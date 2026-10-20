import { spawnSync } from 'node:child_process';
import { getDb, REPO_ROOT } from './lib/db.mjs';
import { renderManual } from './lib/domain.mjs';
import path from 'node:path';
const result=spawnSync(process.execPath,[path.join(REPO_ROOT,'scripts/docs.mjs')],{stdio:'inherit',cwd:REPO_ROOT});
if(result.status!==0)process.exit(result.status||1);
const db=await getDb();try{await db.exec('BEGIN READ ONLY');for(const p of await db.query('select * from publications order by code')){const r=await renderManual(db,p);console.log(`manual: ${r.file} (${r.ready?'ready for review':'has release blockers'})`);}}finally{await db.exec('ROLLBACK');await db.close();}
