// Dedicated disposable CI database only. Never point this at business records.
if(!process.env.TEST_DATABASE_URL)throw Error('TEST_DATABASE_URL is required');
process.env.DATABASE_URL=process.env.TEST_DATABASE_URL;
const { getDb }=await import('./lib/db.mjs');const {migrate}=await import('./migrate.mjs');const {seed}=await import('./seed.mjs');const {execute}=await import('./publications.mjs');
const db=await getDb();try{await migrate(db);await seed(db);await seed(db);const r=await execute(db,['release-check','PUB-QUICK']);if(!r.ready)throw Error(JSON.stringify(r));await execute(db,['release','PUB-QUICK','--version=ci','--actor=Test']);console.log('PASS Postgres migration, seed, readiness and snapshot');}finally{await db.close();}
