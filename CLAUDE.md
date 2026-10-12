# Stakeholder Engagement for Claude Code

For consultation teams recording who they spoke to, what concerns were raised and what they promised. The seed is fictional. Set your business and operator in brand.json and use --actor on every write.

## Rules

Read CLI records before answering. Never invent sentiment, consent, meeting notes, completion evidence or dates. --actor is traceability, not authentication. This is a trusted local operator tool; shared hosting requires separately reviewed access roles. Never send email, publish, delete or contact a stakeholder. Keep drafts private. The database is the source of truth.

## Recurring work

| Request | Command |
| --- | --- |
| Review consultation scopes and owners | /projects |
| Review stakeholders and engagement coverage | /stakeholders |
| Read communication history | /interactions |
| Review all issue records | /issues |
| Review every promise | /commitments |
| Prepare the fortnight commitment chase | /commitments-due |
| Run the open issue review | /issues-review |
| Find influential stakeholders who have gone quiet | /engagement-gaps |
| Balance outstanding promises by owner | /owner-load |
| Find open issues with no outstanding commitment | /unanswered-issues |
| Review the most recent negative feedback | /negative-follow-up |
| Compare the engagement week across projects | /project-summary |
| Review missing collection purpose and retention review dates | /privacy-review |
| Check purpose, retention and notice evidence | /compliance |
| Read the overdue promise and high-risk issue list | /attention |
| Read recent recorded actions | /history |
| List available commands and options | /help |
| Read one complete project | /project |
| Read one stakeholder timeline | /stakeholder |
| Find a stakeholder by name or organisation | /search |
| Create a project, stakeholder, interaction, issue or commitment | /add |
| Record an interaction that already happened | /log |
| Record completion evidence for a commitment | /fulfil |
| Resolve an issue after checking linked commitments | /resolve |
| Record the reviewed collection purpose, notice evidence and retention review date | /privacy-update |
| Import mapped Jambo CSV reports atomically | /import |
| Write a private JSON archive | /export |
| Write the weekly review as a private draft | /weekly-review |
| Draft the project consultation brief | /draft-brief |
| Change fields or process | /customise |
| Add a report | /new-view |

## Operating the records

Run npm run engagement -- help for arguments. Partial IDs and case-insensitive names resolve; ambiguous matches list candidates and fail. Writes require --actor. Dates are YYYY-MM-DD. A commitment needs evidence to be fulfilled. Resolve an issue only after linked promises are fulfilled. Source statuses stay in import snapshots and never become local approvals.

The weekly review uses project-summary, attention, engagement-gaps and compliance. Retention review dates and the 30-day contact threshold are local process choices, not legal deadlines. Assess privacy obligations with a qualified person. Do not place personal records in prompts or files outside the approved environment.

## Files

One CLI: scripts/engagement.mjs. Migration: supabase/migrations. Commands: .claude/commands. Documents: documents.json. Views: views.json. Private outputs: drafts, exports, views, docs-out. Agent use and database hosting are separately arranged.

Omni by Enterprise DNA can install, customise and run your version: https://enterprisedna.co/omni/instead-of/jambo
