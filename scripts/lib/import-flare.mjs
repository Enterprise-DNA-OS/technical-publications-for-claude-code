import { readdirSync, readFileSync, lstatSync } from 'node:fs';
import path from 'node:path';
import { createHash } from 'node:crypto';
import { XMLParser, XMLValidator } from 'fast-xml-parser';
import { inspect, relativeSource } from './content.mjs';
import { required, code, date, activity } from './domain.mjs';
const hash=s=>createHash('sha256').update(s).digest('hex');
function scan(root){
 if(!lstatSync(root).isDirectory())throw Error('Import expects an extracted Flare project folder');
 const files=[];let total=0;
 const walk=dir=>{for(const e of readdirSync(dir,{withFileTypes:true}).sort((a,b)=>a.name.localeCompare(b.name))){
  const full=path.join(dir,e.name);if(e.isSymbolicLink())throw Error('Symlinks are not accepted in imports');
  if(e.isDirectory()){if(['.git','node_modules','Output','Analyzer','FileSync','Users'].includes(e.name))continue;walk(full);}
  else if(e.isFile()){
   const size=lstatSync(full).size;if(size>10_000_000)throw Error('Source file exceeds 10 MB: '+e.name);
   total+=size;if(total>100_000_000||files.length>=10000)throw Error('Project exceeds import limit (100 MB / 10000 files)');
   const bytes=readFileSync(full);files.push({path:path.relative(root,full).split(path.sep).join('/'),bytes,sha256:hash(bytes)});
  }
 }};walk(root);return files;
}
function tocEntries(data){const result=[];const visit=v=>{if(Array.isArray(v)){v.forEach(visit);return;}if(!v||typeof v!=='object')return;
 for(const [key,value]of Object.entries(v)){if(key==='TocEntry'){for(const entry of [value].flat()){if(entry['@_Link'])result.push(entry['@_Link']);visit(entry);}}else if(!key.startsWith('@_'))visit(value);}};visit(data);return result;}
export async function importFlare(db,root,o){
 const projectCode=code(o.project),owner=required(o.owner,'owner'),due=date(o.due,'due'),actor=required(o.actor,'actor');
 const files=scan(path.resolve(root));if(!files.some(f=>/^Content\/.*\.html?$/i.test(f.path)))throw Error('No Content/*.htm topics found; export a Flare project, not generated output');
 const topics=files.filter(f=>/^Content\/.*\.html?$/i.test(f.path)).map(f=>{
  if((f.bytes[0]===0xff&&f.bytes[1]===0xfe)||(f.bytes[0]===0xfe&&f.bytes[1]===0xff)||f.bytes.includes(0))throw Error('Convert UTF-16 or binary topic to UTF-8 first: '+f.path);
  const source=f.bytes.toString('utf8');const p=inspect(source);return {path:f.path,source,title:p.title||path.posix.basename(f.path),language:p.lang||o.language||'en',code:projectCode+'-'+hash(f.path).slice(0,10),findings:p.findings};
 });
 const manualFiles=files.filter(f=>/^Project\/TOCs\/.*\.fltoc$/i.test(f.path));const manuals=[];
 for(const f of manualFiles){
  const xml=f.bytes.toString('utf8');if(/<!DOCTYPE|<!ENTITY/i.test(xml))throw Error('TOC must not contain external declarations');
  const valid=XMLValidator.validate(xml);if(valid!==true)throw Error('Invalid TOC '+f.path+': '+valid.err.msg);
  const data=new XMLParser({ignoreAttributes:false,processEntities:false}).parse(xml);
  const refs=tocEntries(data).map(h=>relativeSource('Content/index.htm',h));
  if(new Set(refs).size!==refs.length)throw Error('Repeated topic in TOC requires manual conversion: '+f.path);
  for(const ref of refs)if(!topics.some(t=>t.path===ref))throw Error('TOC points outside imported topics: '+ref);
  manuals.push({code:projectCode+'-TOC-'+hash(f.path).slice(0,8),name:path.posix.basename(f.path,'.fltoc'),refs});
 }
 if(!manuals.length)manuals.push({code:projectCode+'-ALL',name:'Imported topics for review',refs:topics.map(t=>t.path)});
 if(o['dry-run'])return {dry_run:true,files:files.length,topics:topics.length,manuals:manuals.length,findings:topics.flatMap(t=>t.findings.map(f=>({path:t.path,...f})))};
 const project=(await db.query('insert into projects(code,name) values($1,$2) on conflict(code) do update set name=projects.name returning *',[projectCode,o.name||projectCode]))[0];
 for(const f of files)await db.query('insert into source_files(project_id,path,sha256,base64) values($1,$2,$3,$4) on conflict do nothing',[project.id,f.path,f.sha256,f.bytes.toString('base64')]);
 const ids=new Map();let changed=0;
 for(const t of topics){
  const prior=(await db.query('select * from topics where project_id=$1 and source_path=$2',[project.id,t.path]))[0];
  if(prior){
   if(prior.source_xhtml!==t.source){
    if(!o['update-existing'])throw Error('Changed existing topic '+prior.code+': review the source, then use --update-existing; original revision is retained');
    await db.query('update topics set source_xhtml=$1,title=$2,language=$3 where id=$4',[t.source,t.title,t.language,prior.id]);changed++;
   }ids.set(t.path,prior.id);
  }else{
   const added=(await db.query('insert into topics(project_id,code,title,source_path,source_xhtml,language,owner,review_due) values($1,$2,$3,$4,$5,$6,$7,$8) returning id',[project.id,t.code,t.title,t.path,t.source,t.language,owner,due]))[0];ids.set(t.path,added.id);changed++;
  }
 }
 for(const m of manuals){
  const prior=(await db.query('select * from publications where code=$1',[m.code]))[0];
  if(prior){
   const existing=await db.query('select topic_id from publication_topics where publication_id=$1 order by position',[prior.id]);
   if(JSON.stringify(existing.map(x=>x.topic_id))!==JSON.stringify(m.refs.map(r=>ids.get(r))))throw Error('TOC membership changed for '+m.code+'; create a new manual edition to preserve its order');
  }else{
   const p=(await db.query('insert into publications(project_id,code,name,language,owner,due_on) values($1,$2,$3,$4,$5,$6) returning id',[project.id,m.code,m.name,o.language||topics[0].language,owner,due]))[0];
   for(let i=0;i<m.refs.length;i++)await db.query('insert into publication_topics(publication_id,topic_id,position) values($1,$2,$3)',[p.id,ids.get(m.refs[i]),i+1]);
  }
 }
 await activity(db,actor,'import',projectCode,`${topics.length} topics, ${changed} changed, ${manuals.length} manuals, ${files.length} source files`);
 return {project:projectCode,topics:topics.length,changed,manuals:manuals.length,files:files.length};
}
