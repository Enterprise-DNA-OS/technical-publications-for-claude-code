create function touch_record() returns trigger language plpgsql as $$ begin new.updated_at=now(); return new; end $$;
create table projects (
 id uuid primary key default gen_random_uuid(), code text not null unique check(code ~ '^[A-Za-z0-9_-]+$'), name text not null check(length(trim(name))>0),
 created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table topics (
 id uuid primary key default gen_random_uuid(), project_id uuid not null references projects(id), code text not null unique,
 title text not null, source_path text, source_xhtml text not null, language text not null default 'en', owner text not null,
 review_due date not null, revision integer not null default 1 check(revision>0), approved_revision integer,
 approved_by text, approved_on date, archived boolean not null default false,
 created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
 unique(project_id,source_path), check(approved_revision is null or (approved_revision=revision and length(trim(approved_by))>0 and approved_on is not null and lower(trim(approved_by))<>lower(trim(owner))))
);
create table revisions (
 id uuid primary key default gen_random_uuid(), topic_id uuid not null references topics(id), revision integer not null,
 title text not null, source_xhtml text not null, language text not null, owner text not null,
 created_at timestamptz not null default now(), updated_at timestamptz not null default now(), unique(topic_id,revision)
);
create function version_topic() returns trigger language plpgsql as $$ begin
 if tg_op='UPDATE' and (new.source_xhtml,new.title,new.language,new.owner) is distinct from (old.source_xhtml,old.title,old.language,old.owner) then
 new.revision=old.revision+1; new.approved_revision=null; new.approved_by=null; new.approved_on=null;
 elsif tg_op='UPDATE' and new.revision<>old.revision then raise exception 'Revision is managed by content changes'; end if;
 return new; end $$;
create trigger version_topic before update on topics for each row execute function version_topic();
create function save_revision() returns trigger language plpgsql as $$ begin
 insert into revisions(topic_id,revision,title,source_xhtml,language,owner) values(new.id,new.revision,new.title,new.source_xhtml,new.language,new.owner) on conflict(topic_id,revision) do nothing; return new; end $$;
create trigger save_revision after insert or update on topics for each row execute function save_revision();
create table publications (
 id uuid primary key default gen_random_uuid(), project_id uuid not null references projects(id), code text not null unique,
 name text not null, language text not null default 'en', owner text not null, due_on date not null,
 created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table publication_topics (
 id uuid primary key default gen_random_uuid(), publication_id uuid not null references publications(id), topic_id uuid not null references topics(id),
 position integer not null check(position>0), created_at timestamptz not null default now(), updated_at timestamptz not null default now(), unique(publication_id,topic_id), unique(publication_id,position)
);
create function same_project() returns trigger language plpgsql as $$ begin
 if (select project_id from topics where id=new.topic_id) is distinct from (select project_id from publications where id=new.publication_id) then raise exception 'Topic and publication must belong to the same project'; end if; return new; end $$;
create trigger same_project before insert or update on publication_topics for each row execute function same_project();
create table source_files (
 id uuid primary key default gen_random_uuid(), project_id uuid not null references projects(id), path text not null,
 sha256 text not null, base64 text not null, created_at timestamptz not null default now(), updated_at timestamptz not null default now(), unique(project_id,path,sha256)
);
create table releases (
 id uuid primary key default gen_random_uuid(), publication_id uuid not null references publications(id), version text not null, actor text not null,
 snapshot jsonb not null, created_at timestamptz not null default now(), updated_at timestamptz not null default now(), unique(publication_id,version)
);
create table activity (
 id uuid primary key default gen_random_uuid(), actor text not null, action text not null, reference text not null, detail text not null,
 created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create function immutable_record() returns trigger language plpgsql as $$ begin raise exception 'Historical records are append-only'; end $$;
create trigger immutable_revisions before update or delete on revisions for each row execute function immutable_record();
create trigger immutable_releases before update or delete on releases for each row execute function immutable_record();
create trigger immutable_activity before update or delete on activity for each row execute function immutable_record();
create trigger immutable_sources before update or delete on source_files for each row execute function immutable_record();
create view v_review_queue as select t.id,t.code,t.title,p.code as project,t.owner,t.revision,t.approved_revision,t.review_due,
 current_date-t.review_due as days_overdue,
 case when t.archived then 'archived' when t.approved_revision is distinct from t.revision then 'needs approval' when t.review_due<current_date then 'review overdue' else 'current' end as standing
 from topics t join projects p on p.id=t.project_id;
create view v_publications as select p.id,p.code,p.name,p.owner,p.language,p.due_on,count(pt.id)::int as topic_count,
 count(pt.id) filter(where t.archived or t.approved_revision is distinct from t.revision or t.review_due<current_date or t.language<>p.language)::int as topic_blocks,
 (select count(*)::int from releases r where r.publication_id=p.id) as snapshots
 from publications p left join publication_topics pt on pt.publication_id=p.id left join topics t on t.id=pt.topic_id group by p.id;
create view v_reuse as select t.id,t.code,t.title,t.owner,t.revision,count(pt.id)::int as manuals,
 coalesce(string_agg(p.code,', ' order by p.code),'') as used_in
 from topics t left join publication_topics pt on pt.topic_id=t.id left join publications p on p.id=pt.publication_id group by t.id;
create view v_attention as
 select 'topic' as kind,code,title as detail,owner,review_due as due_on,standing as reason from v_review_queue where standing in ('needs approval','review overdue')
 union all select 'manual',code,name,owner,due_on,case when topic_count=0 then 'empty manual' else 'topic checks outstanding' end from v_publications where topic_count=0 or topic_blocks>0;
do $$ declare t text; begin foreach t in array array['projects','topics','publications','publication_topics'] loop
 execute format('create trigger touch_record before update on %I for each row execute function touch_record()',t);
 end loop;
 foreach t in array array['projects','topics','revisions','publications','publication_topics','source_files','releases','activity'] loop
 execute format('alter table %I enable row level security',t); execute format('revoke all on %I from public',t);
 end loop; end $$;
revoke all on v_review_queue,v_publications,v_reuse,v_attention from public;
