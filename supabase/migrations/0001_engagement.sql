create function touch_updated_at() returns trigger language plpgsql as $$ begin new.updated_at=now(); return new; end $$;
create table projects (
 id uuid primary key default gen_random_uuid(), name text not null check(length(trim(name))>0), owner text not null,
 purpose text not null default '', created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create unique index project_name on projects(lower(name));
create table stakeholders (
 id uuid primary key default gen_random_uuid(), project_id uuid not null references projects(id),
 name text not null check(length(trim(name))>0), organisation text not null default '', email text not null default '',
 owner text not null, influence integer not null default 3 check(influence between 1 and 5),
 purpose text not null default '', notice_evidence text not null default '', retention_review date,
 source_id text, source_snapshot jsonb, source_hash text,
 created_at timestamptz not null default now(), updated_at timestamptz not null default now(), unique(project_id,source_id), unique(project_id,id)
);
create table interactions (
 id uuid primary key default gen_random_uuid(), project_id uuid not null references projects(id), stakeholder_id uuid not null,
 name text not null, occurred_on date not null, channel text not null check(channel in ('meeting','phone','email','site-visit','letter','other')),
 sentiment text not null default 'neutral' check(sentiment in ('positive','neutral','negative','mixed')),
 note text not null, actor text not null, source_id text, source_snapshot jsonb, source_hash text,
 created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
 foreign key(project_id,stakeholder_id) references stakeholders(project_id,id), unique(project_id,source_id)
);
create table issues (
 id uuid primary key default gen_random_uuid(), project_id uuid not null references projects(id), stakeholder_id uuid not null,
 name text not null, owner text not null, severity text not null check(severity in ('low','medium','high')),
 due_on date not null, status text not null default 'open' check(status in ('open','resolved')),
 resolution text, resolved_at timestamptz, source_id text, source_snapshot jsonb, source_hash text,
 created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
 foreign key(project_id,stakeholder_id) references stakeholders(project_id,id), unique(project_id,source_id), unique(project_id,id),
 check((status='open' and resolution is null and resolved_at is null) or (status='resolved' and length(trim(resolution))>0 and resolved_at is not null))
);
create table commitments (
 id uuid primary key default gen_random_uuid(), project_id uuid not null references projects(id), stakeholder_id uuid not null, issue_id uuid,
 name text not null, owner text not null, due_on date not null, status text not null default 'open' check(status in ('open','fulfilled')),
 evidence text, fulfilled_at timestamptz, source_id text, source_snapshot jsonb, source_hash text,
 created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
 foreign key(project_id,stakeholder_id) references stakeholders(project_id,id), foreign key(project_id,issue_id) references issues(project_id,id), unique(project_id,source_id),
 check((status='open' and evidence is null and fulfilled_at is null) or (status='fulfilled' and length(trim(evidence))>0 and fulfilled_at is not null))
);
create table history (
 id uuid primary key default gen_random_uuid(), actor text not null, operation text not null, record_id uuid not null,
 detail jsonb not null, created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
do $$ declare t text; begin foreach t in array array['projects','stakeholders','interactions','issues','commitments','history'] loop
 execute format('create trigger touch before update on %I for each row execute function touch_updated_at()',t);
 execute format('alter table %I enable row level security',t);
 execute format('revoke all on %I from public',t);
 end loop; end $$;
create index interaction_contact on interactions(stakeholder_id,occurred_on);
create index issue_due on issues(status,due_on);
create index commitment_due on commitments(status,due_on);
create view engagement_coverage as
 select s.id,s.project_id,p.name as project,s.name as stakeholder,s.organisation,s.owner,s.influence,
 (select max(i.occurred_on) from interactions i where i.stakeholder_id=s.id) as last_contact,
 (select count(*) from issues i where i.stakeholder_id=s.id and i.status='open') as open_issues,
 (select count(*) from commitments c where c.stakeholder_id=s.id and c.status='open' and c.due_on<current_date) as overdue_promises
 from stakeholders s join projects p on p.id=s.project_id;
create view commitment_register as
 select c.id,c.project_id,p.name as project,s.name as stakeholder,c.name as commitment,c.owner,c.due_on,c.status,c.evidence,
 c.due_on<current_date and c.status='open' as overdue from commitments c join projects p on p.id=c.project_id join stakeholders s on s.id=c.stakeholder_id;
create view issue_register as
 select i.id,i.project_id,p.name as project,s.name as stakeholder,i.name as issue,i.owner,i.severity,i.due_on,i.status,i.resolution,
 (select count(*) from commitments c where c.issue_id=i.id and c.status='open') as open_promises
 from issues i join projects p on p.id=i.project_id join stakeholders s on s.id=i.stakeholder_id;
create view privacy_checks as
 select id,project_id,name as stakeholder,'NZ IPP1: purpose review' as rule,'Record and assess collection purpose' as action,'https://www.privacy.org.nz/privacy-principles/1/' as source from stakeholders where trim(purpose)=''
 union all
 select id,project_id,name,'NZ IPP9: retention review','Review necessity; do not automatically delete','https://www.privacy.org.nz/privacy-principles/9/' from stakeholders where retention_review is null or retention_review<=current_date;
revoke all on engagement_coverage,commitment_register,issue_register,privacy_checks from public;
