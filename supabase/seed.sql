begin;
insert into projects(id,name,owner,purpose) values
 ('10000000-0000-4000-8000-000000000001','Harbour access consultation','Mara','Record access concerns and agreed follow-up'),
 ('10000000-0000-4000-8000-000000000002','River crossing consultation','Alex','Record consultation on crossing options') on conflict do nothing;
insert into stakeholders(id,project_id,name,organisation,owner,influence,purpose,notice_evidence,retention_review) values
 ('20000000-0000-4000-8000-000000000001','10000000-0000-4000-8000-000000000001','Harbour Residents Group','Fictional residents association','Mara',5,'Consultation representative','private://notices/harbour',current_date+180),
 ('20000000-0000-4000-8000-000000000002','10000000-0000-4000-8000-000000000001','Quayside Workshop','Fictional workshop','Alex',4,'','',current_date-10),
 ('20000000-0000-4000-8000-000000000003','10000000-0000-4000-8000-000000000002','River Walkers Group','Fictional recreation group','Alex',4,'Discuss walkway continuity','private://notices/river',current_date+90) on conflict do nothing;
insert into interactions(id,project_id,stakeholder_id,name,occurred_on,channel,sentiment,note,actor) values
 ('30000000-0000-4000-8000-000000000001','10000000-0000-4000-8000-000000000001','20000000-0000-4000-8000-000000000001','Access meeting',current_date-4,'meeting','negative','Residents requested a written access plan.','Mara'),
 ('30000000-0000-4000-8000-000000000002','10000000-0000-4000-8000-000000000001','20000000-0000-4000-8000-000000000002','Delivery route discussion',current_date-45,'phone','mixed','Workshop needs delivery windows confirmed.','Alex') on conflict do nothing;
insert into issues(id,project_id,stakeholder_id,name,owner,severity,due_on) values
 ('40000000-0000-4000-8000-000000000001','10000000-0000-4000-8000-000000000001','20000000-0000-4000-8000-000000000001','Access during works','Mara','high',current_date-3),
 ('40000000-0000-4000-8000-000000000002','10000000-0000-4000-8000-000000000001','20000000-0000-4000-8000-000000000002','Delivery disruption','Alex','medium',current_date+7) on conflict do nothing;
insert into commitments(id,project_id,stakeholder_id,issue_id,name,owner,due_on) values
 ('50000000-0000-4000-8000-000000000001','10000000-0000-4000-8000-000000000001','20000000-0000-4000-8000-000000000001','40000000-0000-4000-8000-000000000001','Provide written access plan','Mara',current_date-2),
 ('50000000-0000-4000-8000-000000000002','10000000-0000-4000-8000-000000000001','20000000-0000-4000-8000-000000000002','40000000-0000-4000-8000-000000000002','Confirm delivery windows','Alex',current_date+3) on conflict do nothing;
commit;
