import { inspect, renderTopic, relativeSource, SOURCES } from './content.mjs';
import { page, esc, writeOut } from './render.mjs';
import { REPO_ROOT } from './db.mjs';
import { mkdirSync, writeFileSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { randomUUID } from 'node:crypto';
export const TABLES=['projects','topics','revisions','publications','publication_topics','source_files','releases','activity'];
export function required(v,name){if(typeof v!=='string'||!v.trim())throw Error(`Required: --${name}`);return v.trim();}
export function date(v,name){required(v,name);if(!/^\d{4}-\d{2}-\d{2}$/.test(v)||new Date(v+'T00:00:00Z').toISOString().slice(0,10)!==v)throw Error(`Invalid ${name}: use YYYY-MM-DD`);return v;}
export function integer(v,name){if(!/^\d+$/.test(String(v))||Number(v)<1||!Number.isSafeInteger(Number(v)))throw Error(`${name} must be a positive integer`);return Number(v);}
export function code(v){required(v,'code');if(!/^[A-Za-z0-9_-]+$/.test(v))throw Error('Code must contain letters, numbers, underscores or hyphens');return v;}
export async function resolve(db,table,ref){
 if(!['projects','topics','publications'].includes(table))throw Error('Unknown record type');required(ref,table);
 const col=table==='topics'?'title':'name';
 const exact=await db.query(`select * from ${table} where lower(code)=lower($1) or id::text=$1`,[ref]);if(exact.length===1)return exact[0];
 const rows=await db.query(`select * from ${table} where position(lower($1) in lower(code))>0 or position(lower($1) in lower(${col}))>0 or id::text like $2 order by code`,[ref,ref+'%']);
 if(rows.length!==1)throw Error(rows.length?`Ambiguous ${table}: ${rows.map(r=>r.code+' '+r[col]).join('; ')}`:`No ${table} match: ${ref}`);return rows[0];
}
export async function activity(db,actor,action,reference,detail){await db.query('insert into activity(actor,action,reference,detail) values($1,$2,$3,$4)',[required(actor,'actor'),action,reference,detail]);}
export async function transaction(db,fn){await db.exec('BEGIN');try{const result=await fn();await db.exec('COMMIT');return result;}catch(e){await db.exec('ROLLBACK');throw e;}}
export async function topicChecks(db,t){
 const parsed=inspect(t.source_xhtml);const out=parsed.findings.map(f=>({code:t.code,...f}));
 if(!t.title.trim())out.push({code:t.code,rule:'TITLE',detail:'Topic title is blank',source:SOURCES.title});
 if(parsed.lang!==t.language)out.push({code:t.code,rule:'LANGUAGE',detail:'Source language differs from topic language',source:SOURCES.lang});
 const files=await db.query('select distinct path from source_files where project_id=$1',[t.project_id]);const paths=new Set(files.map(r=>r.path));
 for(const img of parsed.images){
  let source;try{source=relativeSource(t.source_path,img.src);}catch{}
  if(!source||!paths.has(source)||!(/\.(png|jpe?g|gif|webp)$/i.test(source)))out.push({code:t.code,rule:'IMAGE',detail:'Image is missing or unsupported: '+img.src,source:SOURCES.internal});
 }
 for(const href of parsed.links){
  if(/^https?:\/\//i.test(href))continue;
  if(href.startsWith('#')){
   let fragment;try{fragment=decodeURIComponent(href.slice(1));}catch{}
   if(fragment&&!parsed.anchors.includes(fragment))out.push({code:t.code,rule:'LINK FRAGMENT',detail:'Missing local anchor: '+href,source:SOURCES.internal});
   continue;
  }
  let source;try{source=relativeSource(t.source_path,href);}catch{}
  const match=source&&await db.query('select code,source_xhtml from topics where project_id=$1 and source_path=$2 and not archived',[t.project_id,source]);
  if(!match?.length)out.push({code:t.code,rule:'LINK',detail:'Unresolved local link: '+href,source:SOURCES.internal});
  else if(href.includes('#')){let fragment;try{fragment=decodeURIComponent(href.split('#')[1]);}catch{}
   if(fragment&&!inspect(match[0].source_xhtml).anchors.includes(fragment))out.push({code:t.code,rule:'LINK FRAGMENT',detail:'Missing destination anchor: '+href,source:SOURCES.internal});
  }
 }
 return out;
}
export async function compliance(db){
 const rows=await db.query('select * from topics where not archived order by code');const out=[];
 for(const t of rows)out.push(...await topicChecks(db,t));
 return out;
}
export async function readiness(db,p){
 const topics=await db.query('select t.*,pt.position from publication_topics pt join topics t on t.id=pt.topic_id where pt.publication_id=$1 order by pt.position',[p.id]);
 const today=(await db.query('select current_date::text as day'))[0].day;
 const checks=[];const fail=(t,rule,detail)=>checks.push({code:t?.code||p.code,rule,detail,source:SOURCES.internal});
 if(!topics.length)fail(null,'EMPTY','Manual has no topics');
 for(const t of topics){
  if(t.archived)fail(t,'ARCHIVED','Topic is archived');
  if(t.approved_revision!==t.revision)fail(t,'APPROVAL','Current revision is not approved');
  if(t.review_due<today)fail(t,'REVIEW','Review date has passed');
  if(t.language!==p.language)fail(t,'LANGUAGE','Topic language differs from manual');
  checks.push(...await topicChecks(db,t));
  for(const href of inspect(t.source_xhtml).links.filter(h=>!/^https?:\/\//i.test(h)&&!h.startsWith('#'))){
   let target;try{target=relativeSource(t.source_path,href);}catch{}
   if(!topics.some(x=>x.source_path===target))fail(t,'MANUAL LINK','Linked topic is not in this manual: '+href);
  }
 }
 return {publication:p.code,ready:checks.filter(c=>!c.advisory).length===0,checks,topics};
}
export const insights=[
 ['Which shared topics block the most manuals?',`select r.code,r.title,r.manuals,r.used_in,q.standing from v_reuse r join v_review_queue q using(id) where q.standing<>'current' order by r.manuals desc,r.code`],
 ['Which authors have the oldest overdue reviews?',`select owner,count(*)::int as topics,max(days_overdue) as oldest_days from v_review_queue where days_overdue>0 and standing<>'archived' group by owner order by oldest_days desc`],
 ['Which manuals are due with unapproved content?',`select code,name,due_on,topic_blocks from v_publications where topic_blocks>0 order by due_on`],
 ['Which topics are maintained but used nowhere?',`select code,title,owner from v_reuse where manuals=0 order by code`],
 ['Which approved topics have passed their review date?',`select code,title,owner,review_due from v_review_queue where standing='review overdue' order by review_due`],
 ['Which topics changed after their last release?',`select distinct p.code as manual,t.code as topic,(s.item->>'revision')::int as released_revision,t.revision as current_revision from releases r join publications p on p.id=r.publication_id cross join lateral jsonb_array_elements(r.snapshot->'topics') s(item) join topics t on t.id::text=s.item->>'id' where t.revision>(s.item->>'revision')::int order by manual,topic`],
 ['Which reviewers approved the current revisions?',`select approved_by as reviewer,count(*)::int as topics from topics where approved_revision=revision group by approved_by order by topics desc`],
 ['Which manuals mix languages?',`select p.code as manual,t.code as topic,p.language as manual_language,t.language as topic_language from publication_topics pt join publications p on p.id=pt.publication_id join topics t on t.id=pt.topic_id where p.language<>t.language order by p.code,t.code`],
 ['Which manuals have no retained release snapshot?',`select code,name,due_on from v_publications where snapshots=0 order by due_on`],
 ['Where would a shared-topic edit have the widest effect?',`select code,title,manuals,used_in from v_reuse where manuals>1 order by manuals desc,code`]
];
export async function assetsFor(db,projectId){const rows=await db.query('select distinct on(path) path,base64 from source_files where project_id=$1 order by path,created_at desc,id',[projectId]);return new Map(rows.map(r=>[r.path,r.base64]));}
export function manualHtml(p,topics,assets){
 const known=new Map(topics.filter(t=>t.source_path).map(t=>[t.source_path,t.id]));
 let html=page({title:p.name,subtitle:'Local review copy. '+p.code+' · '+p.language,sections:topics.map(t=>({title:t.title,note:`${t.code} · revision ${t.revision} · ${t.owner}`,html:`<article id="topic-${esc(t.id)}">${renderTopic(t,assets,known)}</article>`}))});
 return html.replace('<html lang="en">',`<html lang="${esc(p.language)}">`);
}
export async function renderManual(db,p){const r=await readiness(db,p);const file=writeOut('docs-out/manuals',p.code,manualHtml(p,r.topics,await assetsFor(db,p.project_id)));return {file,ready:r.ready,checks:r.checks};}
export async function snapshot(db,p,version,actor){
 code(version);required(actor,'actor');
 const r=await readiness(db,p);if(!r.ready)throw Error('Release blocked: '+r.checks.filter(c=>!c.advisory).map(c=>c.code+' '+c.rule).join('; '));
 const assets=await assetsFor(db,p.project_id);const html=manualHtml(p,r.topics,assets);
 const record=(await db.query('insert into releases(publication_id,version,actor,snapshot) values($1,$2,$3,$4::jsonb) returning id,version,created_at',[p.id,version,actor,JSON.stringify({publication:p,topics:r.topics,html})]))[0];
 await activity(db,actor,'release',p.code,version);return record;
}
export async function draft(db,kind,ref){
 const sections=[];
 if(kind==='weekly-review'){
  sections.push(['Attention',await db.query('select * from v_attention order by due_on,code')],['Publication readiness',await db.query('select * from v_publications order by due_on')],['Content checks',await compliance(db)]);
 }else{
  const p=await resolve(db,'publications',ref);const r=await readiness(db,p);sections.push(['Manual', [{code:p.code,name:p.name,owner:p.owner,due:p.due_on}]],['Checks',r.checks],['Topics',r.topics.map(t=>({code:t.code,title:t.title,revision:t.revision,owner:t.owner,review_due:t.review_due}))]);
 }
 const out=path.join(process.env.OUTPUT_DIR||REPO_ROOT,'drafts');mkdirSync(out,{recursive:true,mode:0o700});const file=path.join(out,kind+'-'+randomUUID()+'.md');
 writeFileSync(file,`# ${kind}\n\nLocal draft. Nothing sent or published.\n\n`+sections.map(([title,rows])=>`## ${title}\n\n`+rows.map(r=>'- '+Object.entries(r).map(([k,v])=>`${k}: ${v}`).join(' | ')).join('\n')).join('\n\n'),{mode:0o600});return {file};
}
export function readBody(file){return readFileSync(required(file,'file'),'utf8');}
