#!/usr/bin/env node
import { getDb, REPO_ROOT } from './lib/db.mjs';
import { table } from './lib/format.mjs';
import { inspect } from './lib/content.mjs';
import { resolve,required,date,integer,code,activity,transaction,topicChecks,compliance,readiness,insights,renderManual,snapshot,draft,readBody,TABLES } from './lib/domain.mjs';
import { importFlare } from './lib/import-flare.mjs';
import { mkdirSync,writeFileSync } from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { randomUUID } from 'node:crypto';
export const commands={
 projects:'List documentation projects', topics:'List topics, revisions and review status', topic:'Read one topic and its full revision history',
 manuals:'List manuals, deadlines and blockers', manual:'Read one manual and its ordered topics',
 'review-queue':'Reviews due or awaiting approval',attention:'Topics and manuals needing attention',reuse:'Show which manuals use each topic',
 compliance:'Check source titles, language, image descriptions and content conversion', 'release-check':'Check a manual before taking a release snapshot',
 insights:'Answer ten cross-record questions',activity:'Read the audit log',releases:'List retained release snapshots',
 'add-project':'Create a documentation project','add-topic':'Create a topic from an XHTML file', revise:'Revise a topic; invalidate its previous approval',
 'schedule-review':'Assign an owner and a review deadline',approve:'Record an independent review of the exact revision',archive:'Archive a topic without erasing its history',
 'add-manual':'Create a manual',attach:'Add a topic at a position in a manual',log:'Record an operator note',
 'render-manual':'Render a branded local manual for review',release:'Retain an immutable local release snapshot; nothing is published',
 'release-copy':'Write an exact retained release to a local HTML file',
 'weekly-review':'Draft the Monday review from attention, manuals and compliance','draft-review':'Draft a manual review request',
 import:'Import an exported MadCap Flare project folder',export:'Export the complete database as JSON'
};
const flags={
 'add-project':['code','name'], 'add-topic':['project','code','title','file','language','owner','due'],
 revise:['file','title','language'], 'schedule-review':['owner','due'],approve:['revision','reviewer','due'],
 archive:[], 'add-manual':['project','code','name','language','owner','due'], attach:['topic','position'], log:['note'],
 import:['project','name','owner','due','language','dry-run','update-existing'],release:['version'], 'release-copy':['version'],
 export:['out']
};
const writes=new Set(['add-project','add-topic','revise','schedule-review','approve','archive','add-manual','attach','log','import','release']);
function parseArgs(args){const o={},pos=[];for(let i=0;i<args.length;i++){
 const a=args[i];if(!a.startsWith('--')){pos.push(a);continue;}
 const eq=a.indexOf('=');const key=a.slice(2,eq<0?undefined:eq);
 if(key in o)throw Error('Duplicate flag: '+key);
 if(['json','dry-run','update-existing','help'].includes(key)){if(eq>=0)throw Error('Boolean flag takes no value: '+key);o[key]=true;}
 else if(eq>=0)o[key]=a.slice(eq+1);else{if(!args[i+1]||args[i+1].startsWith('--'))throw Error('Flag needs value: '+key);o[key]=args[++i];}
 }return {o,pos};}
export async function execute(db,args){
 const {o,pos}=parseArgs(args);const cmd=pos.shift();if(o.help||!cmd)return commands;
 if(!commands[cmd])throw Error('Unknown command: '+cmd);
 for(const k of Object.keys(o))if(!['json','actor',...(flags[cmd]||[])].includes(k))throw Error('Unknown flag for '+cmd+': --'+k);
 const ref=pos[0];if(pos.length>(cmd==='import'?2:1))throw Error('Unexpected positional arguments');
 if(writes.has(cmd))required(o.actor,'actor');
 const run=async()=>{
 switch(cmd){
 case 'projects':return db.query('select code,name from projects order by code');
 case 'topics':return db.query('select code,title,owner,revision,review_due,standing from v_review_queue order by code');
 case 'topic':{const t=await resolve(db,'topics',ref);return {topic:t,history:await db.query('select revision,title,owner,created_at from revisions where topic_id=$1 order by revision',[t.id]),checks:await topicChecks(db,t)};}
 case 'manuals':return db.query('select code,name,owner,due_on,topic_count,topic_blocks,snapshots from v_publications order by due_on,code');
 case 'manual':case 'release-check':{const p=await resolve(db,'publications',ref);const r=await readiness(db,p);return cmd==='release-check'?{publication:r.publication,ready:r.ready,checks:r.checks}:r;}
 case 'review-queue':return db.query("select code,title,owner,review_due,standing from v_review_queue where standing in ('needs approval','review overdue') order by review_due,code");
 case 'attention':return db.query('select * from v_attention order by due_on,code');
 case 'reuse':return db.query('select code,title,manuals,used_in from v_reuse order by manuals desc,code');
 case 'compliance':return compliance(db);
 case 'activity':return db.query('select actor,action,reference,detail,created_at from activity order by created_at desc,id limit 100');
 case 'releases':return db.query('select p.code as manual,r.version,r.actor,r.created_at from releases r join publications p on p.id=r.publication_id order by r.created_at desc,r.id');
 case 'insights':{const out=[];for(const [question,sql]of insights)out.push({question,rows:await db.query(sql)});return out;}
 case 'add-project':{const c=code(o.code);await db.query('insert into projects(code,name) values($1,$2)',[c,required(o.name,'name')]);await activity(db,o.actor,cmd,c,o.name);return {created:c};}
 case 'add-topic':{
  const p=await resolve(db,'projects',o.project),body=readBody(o.file),parsed=inspect(body),c=code(o.code);
  await db.query('insert into topics(project_id,code,title,source_xhtml,language,owner,review_due) values($1,$2,$3,$4,$5,$6,$7)',[p.id,c,o.title||parsed.title||c,body,o.language||parsed.lang||'en',required(o.owner,'owner'),date(o.due,'due')]);await activity(db,o.actor,cmd,c,'Created draft topic');return {created:c};
 }
 case 'revise':{const t=await resolve(db,'topics',ref);const body=readBody(o.file);inspect(body);
  await db.query('update topics set source_xhtml=$1,title=$2,language=$3 where id=$4',[body,o.title||t.title,o.language||t.language,t.id]);
  await activity(db,o.actor,cmd,t.code,'Content revision');return resolve(db,'topics',t.code);
 }
 case 'schedule-review':{const t=await resolve(db,'topics',ref);await db.query('update topics set owner=$1,review_due=$2,approved_revision=null,approved_by=null,approved_on=null where id=$3',[required(o.owner,'owner'),date(o.due,'due'),t.id]);await activity(db,o.actor,cmd,t.code,'Review assigned');return {scheduled:t.code};}
 case 'approve':{
  const t=await resolve(db,'topics',ref),reviewer=required(o.reviewer,'reviewer'),rev=integer(o.revision,'revision');
  if(t.archived)throw Error('Archived topic cannot be approved');
  if(rev!==t.revision)throw Error('Revision changed: review the current revision');
  if(reviewer.toLowerCase()===t.owner.trim().toLowerCase())throw Error('An independent reviewer is required');
  if(reviewer.trim().toLowerCase()!==o.actor.trim().toLowerCase())throw Error('Actor must be the reviewer');
  const checks=(await topicChecks(db,t)).filter(c=>!c.advisory);if(checks.length)throw Error('Approval blocked: '+checks.map(c=>c.rule).join(', '));
  const due=date(o.due,'due');const today=(await db.query('select current_date::text as d'))[0].d;if(due<today)throw Error('Review due date cannot be in the past');
  await db.query('update topics set approved_revision=revision,approved_by=$1,approved_on=current_date,review_due=$2 where id=$3',[reviewer,due,t.id]);await activity(db,o.actor,cmd,t.code,`Revision ${rev}, reviewed by ${reviewer}`);return {approved:t.code,revision:rev};
 }
 case 'archive':{const t=await resolve(db,'topics',ref);await db.query('update topics set archived=true where id=$1',[t.id]);await activity(db,o.actor,cmd,t.code,'Archived, history retained');return {archived:t.code};}
 case 'add-manual':{const p=await resolve(db,'projects',o.project),c=code(o.code);await db.query('insert into publications(project_id,code,name,language,owner,due_on) values($1,$2,$3,$4,$5,$6)',[p.id,c,required(o.name,'name'),required(o.language,'language'),required(o.owner,'owner'),date(o.due,'due')]);await activity(db,o.actor,cmd,c,o.name);return {created:c};}
 case 'attach':{const p=await resolve(db,'publications',ref),t=await resolve(db,'topics',o.topic);if(t.archived)throw Error('Cannot attach an archived topic');await db.query('insert into publication_topics(publication_id,topic_id,position) values($1,$2,$3)',[p.id,t.id,integer(o.position,'position')]);await activity(db,o.actor,cmd,p.code,t.code);return {manual:p.code,topic:t.code};}
 case 'log':{required(ref,'reference');await activity(db,o.actor,'note',ref,required(o.note,'note'));return {logged:ref};}
 case 'render-manual':return renderManual(db,await resolve(db,'publications',ref));
 case 'release':return snapshot(db,await resolve(db,'publications',ref),required(o.version,'version'),o.actor);
 case 'release-copy':{const p=await resolve(db,'publications',ref);const version=code(o.version);const row=(await db.query('select snapshot from releases where publication_id=$1 and version=$2',[p.id,version]))[0];if(!row)throw Error('No release with that version');const dir=path.join(process.env.OUTPUT_DIR||REPO_ROOT,'docs-out/releases');mkdirSync(dir,{recursive:true,mode:0o700});const file=path.join(dir,p.code+'-'+version+'.html');writeFileSync(file,row.snapshot.html,{mode:0o600});return {file};}
 case 'weekly-review':case 'draft-review':return draft(db,cmd,ref);
 case 'import':if(ref!=='madcap-flare')throw Error('Supported import: madcap-flare <extracted-project-folder>');return importFlare(db,required(pos[1],'folder'),o);
 case 'export':{const data={format:1,exported_at:new Date().toISOString(),records:{}};for(const t of TABLES)data.records[t]=await db.query(`select * from ${t} order by id`);const file=path.resolve(o.out||path.join(process.env.OUTPUT_DIR||REPO_ROOT,'exports',randomUUID()+'.json'));mkdirSync(path.dirname(file),{recursive:true,mode:0o700});writeFileSync(file,JSON.stringify(data,null,2)+'\n',{mode:0o600,flag:'wx'});return {file,counts:Object.fromEntries(TABLES.map(t=>[t,data.records[t].length]))};}
 }
 };
 // All commands use a consistent transaction. Writer locks serialize approvals,
 // edits, TOC changes and snapshots on a shared Postgres connection.
 return transaction(db,async()=>{
  if(writes.has(cmd))await db.exec('LOCK TABLE topics,publications,publication_topics IN SHARE ROW EXCLUSIVE MODE');
  return run();
 });
}
export function format(result){
 if(Array.isArray(result)){
  if(result[0]?.question)return result.map(r=>r.question+'\n'+format(r.rows)).join('\n\n');
  const keys=[...new Set(result.flatMap(Object.keys))];return table(result,keys.map(key=>({key,label:key,width:key==='detail'?90:50,format:v=>typeof v==='object'&&v!==null?JSON.stringify(v):v})));
 }
 return JSON.stringify(result,null,2);
}
if(process.argv[1]&&import.meta.url===pathToFileURL(path.resolve(process.argv[1])).href){let db;try{
 const args=process.argv.slice(2);if(args.includes('--help')||!args.length){console.log(Object.entries(commands).map(([k,v])=>k.padEnd(18)+v).join('\n'));}
 else{db=await getDb();const result=await execute(db,args);console.log(args.includes('--json')?JSON.stringify(result,null,2):format(result));}
 }catch(e){console.error(e.message);process.exitCode=1;}finally{if(db)await db.close();}}
