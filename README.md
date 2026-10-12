# Stakeholder Engagement for Claude Code

Keep your consultation history, unresolved concerns and promises in a database you own. Know who needs a follow-up and what evidence belongs in the project report.

## Three ways to run it

- **Do it yourself.** The MIT-licensed free version runs with Claude Code, Codex, OpenCode or Cursor. Arrange your own database hosting and agent usage. Map your Jambo CSV exports using the included manifest.
- **We customise it.** Enterprise DNA brings your records across, adds your fields and consultation rules, and builds the screens or connections your team needs. One setup fee, then an agreed retainer for ongoing work.
- **We run it for you.** Omni by Enterprise DNA installs, connects, backs up and operates your version. One setup fee, then a monthly retainer. [Book a call](https://enterprisedna.co/omni/book?offer=replace-software&utm_campaign=jambo&utm_medium=readme).

## Try fictional consultation data

```bash
npm install
npm run demo
npm run engagement -- commitments-due
npm run engagement -- engagement-gaps --json
npm run view
npm run docs
```

Requires Node 20 or later. With DATABASE_URL unset, PGlite stores records in .data/db. Set DATABASE_URL to use PostgreSQL. The same migrations run on both. Run one embedded writer at a time. npm run demo contains fictional groups and projects; do not seed a real installation.

## The engagement week

Review upcoming promises, triage issues, plan contact with groups who have gone quiet, record meetings and calls, then draft the consultation report. Completing a promise needs evidence. Resolving an issue requires all linked promises to be fulfilled. Recording an interaction never sends a message. Sentiment is explicitly entered, never guessed from a person or group.

Read before writing. Supply --actor for every write. It records the operator's stated identity, not authentication. Partial IDs and case-insensitive names work; ambiguous names list the candidates and exit with an error. Dates use YYYY-MM-DD.

- /projects
- /stakeholders
- /interactions
- /issues
- /commitments
- /commitments-due
- /issues-review
- /engagement-gaps
- /owner-load
- /unanswered-issues
- /negative-follow-up
- /project-summary
- /privacy-review
- /compliance
- /attention
- /history
- /help
- /project
- /stakeholder
- /search
- /add
- /log
- /fulfil
- /resolve
- /privacy-update
- /import
- /export
- /weekly-review
- /draft-brief
- /customise
- /new-view

There are 29 CLI commands and 31 slash-command recipes. npm run engagement -- help lists arguments. /customise and /new-view guide a coding agent through additive changes; they are not CLI mutations.

## Ten questions your records can answer today

Jambo also offers configurable reporting. These are useful questions this implementation answers, not a claim that Jambo cannot answer equivalent questions.

- Which promises are due in the next fortnight? `commitments-due`
- Which high-influence stakeholders have had no recent contact? `engagement-gaps`
- Which high-risk issues remain open? `issues-review`
- Which owners have the most overdue promises? `owner-load`
- Which open issues have no outstanding promise attached? `unanswered-issues`
- Whose latest recorded feedback was negative? `negative-follow-up`
- Which projects have overdue promises and recent engagement? `project-summary`
- Which records need purpose or retention review? `privacy-review`
- Which stakeholder records lack notice evidence? `compliance`
- Who recorded the most recent changes? `history`

## Your first hour: ten things to ask for

1. Put our business name, logo and colours on the reports.
2. Show every overdue promise and who owns it.
3. Find influential stakeholders with no recent contact.
4. Explain the high-risk issue queue.
5. Record a call that happened, with the date and agreed follow-up.
6. Fulfil a promise using the actual completion evidence.
7. Draft our weekly consultation review.
8. Add our consultation phase field through a migration.
9. Add a read-only report for our project board.
10. Test our Jambo export mapping before saving anything.

## Bring your Jambo records

```bash
npm run engagement -- import jambo --manifest=examples/jambo-manifest.json --actor="Migration operator" --dry-run
```

This example targets the fictional demo. For real data, migrate an empty database, create your project, and map your own exports in a private manifest. The [switch guide](docs/replace-jambo.md) explains the four supported record types and mapping contract. The one-command import is available after mapping your export headings and relationship identifiers. Original Jambo report headings are configurable; the included CSV files are fictional mapping fixtures.

The batch is atomic. Dry runs save nothing. Identical imports skip. Changed source records, duplicate identifiers and missing relationships fail for explicit reconciliation. Imported Closed and Completed statuses remain source snapshots, not local evidence. Attachments, permissions, interactive maps and historical activity logs need separate migration design.

## Documents and views

npm run docs writes private consultation evidence reports and commitment follow-up drafts. npm run view writes the engagement week and privacy review as read-only HTML. Set your business identity in brand.json. Nothing sends or publishes. Outputs remain in docs-out, views and drafts. [Why no front end](docs/why-no-front-end.md).

## Privacy record review

The compliance command prompts review of missing collection purpose, retention review dates and notice evidence. [The cited rules and limits](docs/compliance.md) cover NZ Privacy Act IPP1, IPP9 and the indirect collection notice rule IPP3A. A filled field does not prove legal compliance. Retention dates and contact intervals are operator choices, not statutory deadlines.

Row security is enabled and public access revoked. Owner credentials still have broad access. A shared installation requires reviewed roles and access policies, protected storage, data residency decisions and approved agent access. Local operation history is not tamper-proof. The free version provides no public intake form, automatic mailbox sync, mapping service or per-user login.

## Validation and archives

npm test creates a disposable database and exercises every CLI command, migrations, seed repeats, closure guards, project isolation, privacy prompts, atomic imports, mapping, repeated imports, invalid data, backups, private drafts and escaped HTML. GitHub CI runs Node 20 and 22 on Windows and Linux plus a PostgreSQL service. Local PGlite results are reported separately from remote CI.

npm run engagement -- export --out=exports/backup.json writes all records and operation history to a private JSON file without overwriting an existing one. It is an archive for reviewed recovery, not a Jambo import or automatic restore tool. Test a recovery procedure before relying on your backup process.

MIT licence. Independent of Jambo. Names belong to their owners. [Research and six-factor scoring](docs/research.md).
