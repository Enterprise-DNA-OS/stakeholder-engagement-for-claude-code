import fs from 'node:fs';
import path from 'node:path';
import {createHash,randomUUID} from 'node:crypto';
import {pathToFileURL} from 'node:url';
import {getDb,REPO_ROOT} from './lib/db.mjs';
import {parseCsv} from './lib/csv.mjs';
import {table} from './lib/format.mjs';
export const entities={project:'projects',stakeholder:'stakeholders',interaction:'interactions',issue:'issues',commitment:'commitments'};
export const reads={
 projects:'select id,name,owner,purpose from projects order by name',
 stakeholders:'select * from engagement_coverage order by project,stakeholder',
 interactions:'select i.id,p.name as project,s.name as stakeholder,i.name,i.occurred_on,i.channel,i.sentiment,i.note,i.actor from interactions i join projects p on p.id=i.project_id join stakeholders s on s.id=i.stakeholder_id order by occurred_on desc,i.created_at desc',
 issues:'select * from issue_register order by due_on,issue',
 commitments:'select * from commitment_register order by due_on,commitment',
 'commitments-due':"select project,stakeholder,commitment,owner,due_on,overdue from commitment_register where status='open' and due_on<=current_date+14 order by due_on,commitment",
 'issues-review':"select project,stakeholder,issue,owner,severity,due_on,open_promises from issue_register where status='open' order by case severity when 'high' then 0 when 'medium' then 1 else 2 end,due_on",
 'engagement-gaps':"select project,stakeholder,owner,influence,last_contact,open_issues,overdue_promises from engagement_coverage where influence>=4 and (last_contact is null or last_contact<current_date-30) order by last_contact nulls first,stakeholder",
 'owner-load':"select owner,count(*) as open_promises,count(*) filter(where due_on<current_date) as overdue from commitments where status='open' group by owner order by overdue desc,owner",
 'unanswered-issues':"select project,stakeholder,issue,owner from issue_register where status='open' and open_promises=0 order by project,issue",
 'negative-follow-up':"select e.project,e.stakeholder,e.owner,e.last_contact,e.overdue_promises from engagement_coverage e where (select i.sentiment from interactions i where i.stakeholder_id=e.id order by i.occurred_on desc,i.created_at desc,i.id desc limit 1)='negative' order by e.stakeholder",
 'project-summary':"select p.name as project,(select count(*) from stakeholders s where s.project_id=p.id) as stakeholders,(select count(*) from interactions i where i.project_id=p.id and i.occurred_on>=current_date-7) as contacts_this_week,(select count(*) from issues i where i.project_id=p.id and i.status='open') as open_issues,(select count(*) from commitments c where c.project_id=p.id and c.status='open' and c.due_on<current_date) as overdue_promises from projects p order by p.name",
 'privacy-review':'select stakeholder,rule,action,source from privacy_checks order by stakeholder,rule',
 compliance:"select stakeholder,rule,action,source from privacy_checks union all select name,'Notice evidence review','Assess direct or indirect collection notice obligations','https://www.privacy.org.nz/privacy-principles/3a/' from stakeholders where trim(notice_evidence)='' order by stakeholder,rule",
 attention:"select 'commitment' as kind,project,stakeholder,commitment as item,owner,due_on from commitment_register where status='open' and overdue union all select 'issue',project,stakeholder,issue,owner,due_on from issue_register where status='open' and (severity='high' or due_on<current_date) order by due_on,item",
 history:'select actor,operation,record_id,detail,created_at from history order by created_at desc,id desc limit 100'
};
const options={
 help:[],project:['project'],stakeholder:['stakeholder','project'],search:['text'],
 add:['type','project','stakeholder','issue','name','owner','purpose','organisation','email','influence','notice-evidence','retention-review','due','severity','date','channel','sentiment','note'],
 log:['project','stakeholder','name','date','channel','sentiment','note'],
 fulfil:['commitment','project','evidence'],resolve:['issue','project','evidence'],
 'privacy-update':['stakeholder','project','purpose','notice-evidence','retention-review'],
 import:['manifest','dry-run'],export:['out'],'weekly-review':[], 'draft-brief':['project']
};
export const commands=[...Object.keys(reads),...Object.keys(options)];
const must=(v,k)=>{if(v===undefined||v===true||!String(v).trim())throw Error(`Missing --${k}`);return String(v).trim();};
const choose=(v,allowed)=>{if(!allowed.includes(v))throw Error(`Expected ${allowed.join('|')}, got ${v}`);return v;};
function date(v,k){v=must(v,k);if(!/^\d{4}-\d{2}-\d{2}$/.test(v)||!Number.isFinite(Date.parse(v))||new Date(v).toISOString().slice(0,10)!==v)throw Error(`${k} requires a real YYYY-MM-DD date`);return v;}
function parse(args){const a=[...args];const cmd=a.shift()||'help';if(!commands.includes(cmd))throw Error(`Unknown command ${cmd}`);const o={};const positional=[];for(const arg of a){if(!arg.startsWith('--')){positional.push(arg);continue;}const eq=arg.indexOf('=');const k=arg.slice(2,eq<0?undefined:eq);if(![...(options[cmd]||[]),'json','actor'].includes(k))throw Error(`Unknown --${k} for ${cmd}`);if(k in o)throw Error(`Duplicate --${k}`);o[k]=eq<0?true:arg.slice(eq+1);}if(positional.length&&!(cmd==='import'&&positional.length===1&&positional[0]==='jambo'))throw Error('Unexpected argument');if(cmd==='import'&&positional[0]!=='jambo')throw Error('Use import jambo');for(const [k,v] of Object.entries(o))if(!['json','dry-run'].includes(k)&&v===true)throw Error(`--${k} requires a value`);return {cmd,o};}
export async function resolve(db,type,term,projectId){
 const t=entities[type];if(!t)throw Error('Unknown record type');term=must(term,type);
 const rows=await db.query(`select * from ${t} where (id::text=$1 or lower(name)=lower($1) or position(lower($1) in lower(name))>0 or id::text like $1||'%')${projectId&&type!=='project'?' and project_id=$2':''} order by name,id`,projectId&&type!=='project'?[term,projectId]:[term]);
 const exact=rows.filter(r=>r.id===term||r.name.toLowerCase()===term.toLowerCase());const candidates=exact.length?exact:rows;
 if(candidates.length!==1)throw Error(`${type} ${candidates.length?'ambiguous':'not found'}: ${candidates.map(r=>`${r.id} ${r.name}`).join('; ')||term}`);return candidates[0];
}
async function insert(db,t,values){const keys=Object.keys(values);return (await db.query(`insert into ${t} (${keys.join(',')}) values (${keys.map((_,i)=>`$${i+1}`).join(',')}) returning *`,Object.values(values)))[0];}
async function audit(db,actor,operation,id,detail){await insert(db,'history',{actor,operation,record_id:id,detail:JSON.stringify(detail)});}
async function create(db,type,o,actor,refs={}){
 const name=must(o.name,'name');if(type==='project')return insert(db,'projects',{name,owner:must(o.owner,'owner'),purpose:must(o.purpose,'purpose')});
 const project=refs.project||await resolve(db,'project',o.project);
 const v={project_id:project.id,name};
 if(type==='stakeholder'){
 const influence=Number(o.influence??3);if(!Number.isInteger(influence)||influence<1||influence>5)throw Error('Influence must be 1 to 5');
 return insert(db,'stakeholders',{...v,owner:must(o.owner,'owner'),organisation:o.organisation||'',email:o.email||'',influence,purpose:o.purpose||'',notice_evidence:o['notice-evidence']||'',retention_review:o['retention-review']?date(o['retention-review'],'retention-review'):null});
 }
 const stakeholder=refs.stakeholder||await resolve(db,'stakeholder',o.stakeholder,project.id);v.stakeholder_id=stakeholder.id;
 if(type==='interaction'){
 const occurred=date(o.date,'date');if(occurred>new Date().toISOString().slice(0,10))throw Error('An interaction cannot be in the future');
 return insert(db,'interactions',{...v,occurred_on:occurred,channel:choose(o.channel,['meeting','phone','email','site-visit','letter','other']),sentiment:choose(o.sentiment||'neutral',['positive','neutral','negative','mixed']),note:must(o.note,'note'),actor});
 }
 v.owner=must(o.owner,'owner');v.due_on=date(o.due,'due');
 if(type==='issue')return insert(db,'issues',{...v,severity:choose(o.severity||'medium',['low','medium','high'])});
 if(type==='commitment'){
 const issue=refs.issue||(o.issue?await resolve(db,'issue',o.issue,project.id):null);
 if(issue&&(issue.stakeholder_id!==stakeholder.id||issue.status!=='open'))throw Error('Issue must be open and belong to this stakeholder');
 return insert(db,'commitments',{...v,issue_id:issue?.id||null});
 }
 throw Error('Unknown --type');
}
const outFile=(sub,text)=>{const f=path.resolve(process.env.OUTPUT_DIR||REPO_ROOT,sub);fs.mkdirSync(path.dirname(f),{recursive:true});fs.writeFileSync(f,text,{flag:'wx',mode:0o600});return {file:f};};
export async function run(db,args){
 const {cmd,o}=parse(args);
 if(reads[cmd])return db.query(reads[cmd]);
 if(cmd==='help')return commands.map(command=>({command,options:(options[command]||[]).join(', ')}));
 if(cmd==='search'){const text=must(o.text,'text');return db.query('select * from engagement_coverage where position(lower($1) in lower(stakeholder||organisation||project))>0 order by stakeholder',[text]);}
 if(cmd==='project'||cmd==='stakeholder'){
 const project=o.project?await resolve(db,'project',o.project):null;const record=cmd==='project'?project:await resolve(db,'stakeholder',o.stakeholder,project?.id);if(!record)throw Error('Missing --project');
 const output={record};for(const type of ['stakeholder','interaction','issue','commitment']){if(cmd==='stakeholder'&&type==='stakeholder')continue;output[entities[type]]=await db.query(`select * from ${entities[type]} where ${cmd==='project'?'project_id':'stakeholder_id'}=$1 order by created_at,id`,[record.id]);}return output;
 }
 if(cmd==='export'){const records={};for(const t of [...Object.values(entities),'history','schema_migrations'])records[t]=await db.query(`select * from ${t}`);return outFile(must(o.out,'out'),JSON.stringify({format:'stakeholder-engagement-v1',at:new Date().toISOString(),records},null,2)+'\n');}
 if(cmd==='weekly-review'||cmd==='draft-brief'){
 const data=cmd==='weekly-review'?Object.fromEntries(await Promise.all(['project-summary','attention','engagement-gaps','compliance'].map(async k=>[k,await run(db,[k])]))):await run(db,['project',`--project=${must(o.project,'project')}`]);
 return outFile(`drafts/${cmd}-${randomUUID()}.md`,`# PRIVATE DRAFT: ${cmd}\n\nFor internal review. No message sent. Review personal information before sharing.\n\n`+Object.entries(data).map(([k,v])=>`## ${k}\n\n\x60\x60\x60json\n${JSON.stringify(v,null,2)}\n\x60\x60\x60`).join('\n\n')+'\n');
 }
 const actor=must(o.actor,'actor');await db.exec('BEGIN');
 try{
 let result;
 if(cmd==='import')result=await importJambo(db,o,actor);
 else if(cmd==='add'||cmd==='log'){const type=cmd==='log'?'interaction':choose(o.type,Object.keys(entities));result=await create(db,type,o,actor);await audit(db,actor,cmd,result.id,{type,name:result.name});}
 else if(cmd==='fulfil'||cmd==='resolve'){
 const type=cmd==='fulfil'?'commitment':'issue';const p=o.project?await resolve(db,'project',o.project):null;const record=await resolve(db,type,o[type],p?.id);if(record.status!=='open')throw Error('Record is already closed');const evidence=must(o.evidence,'evidence');
 if(type==='issue'){const open=await db.query("select id from commitments where issue_id=$1 and status='open'",[record.id]);if(open.length)throw Error('Fulfil linked commitments before resolving the issue');}
 const sql=type==='commitment'?"update commitments set status='fulfilled',evidence=$2,fulfilled_at=now() where id=$1 returning *":"update issues set status='resolved',resolution=$2,resolved_at=now() where id=$1 returning *";
 result=(await db.query(sql,[record.id,evidence]))[0];await audit(db,actor,cmd,record.id,{evidence});
 }else if(cmd==='privacy-update'){
 const p=o.project?await resolve(db,'project',o.project):null;const s=await resolve(db,'stakeholder',o.stakeholder,p?.id);
 result=(await db.query('update stakeholders set purpose=$2,notice_evidence=$3,retention_review=$4 where id=$1 returning *',[s.id,must(o.purpose,'purpose'),must(o['notice-evidence'],'notice-evidence'),date(o['retention-review'],'retention-review')]))[0];await audit(db,actor,cmd,s.id,{purpose:result.purpose,notice_evidence:result.notice_evidence,retention_review:result.retention_review});
 }else throw Error(`Unimplemented ${cmd}`);
 await db.exec(o['dry-run']?'ROLLBACK':'COMMIT');return result;
 }catch(e){await db.exec('ROLLBACK');throw e;}
}
async function importJambo(db,o,actor){
 const manifestFile=path.resolve(must(o.manifest,'manifest'));const m=JSON.parse(fs.readFileSync(manifestFile,'utf8'));
 const project=await resolve(db,'project',must(m.project,'manifest.project'));
 if(!Array.isArray(m.files)||!m.files.length)throw Error('Manifest needs files');
 const seen=new Set();let inserted=0,skipped=0;
 const source=async(type,id)=>{const rows=await db.query(`select * from ${entities[type]} where project_id=$1 and source_id=$2`,[project.id,`jambo:${must(id,`${type} source id`)}`]);if(rows.length!==1)throw Error(`Missing imported ${type} source id: ${id}`);return rows[0];};
 for(const spec of m.files){
 const type=choose(spec.type,['stakeholder','interaction','issue','commitment']);
 if(!spec.columns||!spec.columns.source_id||!spec.columns.name)throw Error('Column mapping requires source_id and name');
 const allowed=['source_id','name','owner','organisation','email','influence','purpose','notice-evidence','retention-review','stakeholder','issue','due','severity','date','channel','sentiment','note'];
 for(const key of Object.keys(spec.columns))if(!allowed.includes(key))throw Error(`Unknown mapped field ${key}`);
 const rows=parseCsv(fs.readFileSync(path.resolve(path.dirname(manifestFile),must(spec.file,'file')),'utf8'));if(!rows.length)throw Error('CSV is empty');
 for(const row of rows){const values={};for(const [field,header] of Object.entries(spec.columns)){if(!Object.hasOwn(row,header))throw Error(`CSV missing mapped column ${header}`);values[field]=row[header].trim();}
 const id=`jambo:${must(values.source_id,'source_id')}`;const key=`${type}:${id}`;if(seen.has(key))throw Error(`Duplicate source id ${key}`);seen.add(key);
 const snapshot=Object.fromEntries(Object.entries(row).sort(([a],[b])=>a.localeCompare(b)));const hash=createHash('sha256').update(JSON.stringify({snapshot,columns:spec.columns})).digest('hex');
 const previous=await db.query(`select * from ${entities[type]} where project_id=$1 and source_id=$2`,[project.id,id]);
 if(previous.length){if(previous[0].source_hash!==hash)throw Error(`Source ${id} changed; reconcile explicitly before importing`);skipped++;continue;}
 const refs={project};if(type!=='stakeholder')refs.stakeholder=await source('stakeholder',values.stakeholder);
 if(type==='commitment'&&values.issue)refs.issue=await source('issue',values.issue);
 const record=await create(db,type,values,actor,refs);
 await db.query(`update ${entities[type]} set source_id=$2,source_snapshot=$3,source_hash=$4 where id=$1`,[record.id,id,JSON.stringify(snapshot),hash]);await audit(db,actor,'import jambo',record.id,{type,source_id:id});inserted++;
 }
 }
 return {inserted,skipped,dry_run:Boolean(o['dry-run']),note:'Source statuses are snapshots. Imported issues and commitments remain open pending evidence review.'};
}
function human(value){if(Array.isArray(value)){if(!value.length)return '(none)';const keys=Object.keys(value[0]);return table(value,keys.map(key=>({key,label:key,format:v=>v&&typeof v==='object'?JSON.stringify(v):v,width:85})));}return JSON.stringify(value,null,2);}
if(process.argv[1]&&import.meta.url===pathToFileURL(path.resolve(process.argv[1])).href){let db;try{db=await getDb();const value=await run(db,process.argv.slice(2));console.log(process.argv.includes('--json')?JSON.stringify(value):human(value));}catch(e){console.error(e.message);process.exitCode=1;}finally{if(db)await db.close();}}
