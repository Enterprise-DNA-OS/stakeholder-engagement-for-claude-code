# Move your consultation records from Jambo

Jambo documents CSV, Excel and PDF exports of contacts, communications, issues and commitments. Its reporting guide describes contact, communication and issue reports. Report columns are configurable. The vendor does not publish a single fixed CSV heading contract. The examples here are fictional mapping fixtures, not captured Jambo exports.

## Switch in a day

1. In your Jambo account, generate the required contact, communication, issue and commitment reports. Include stable record identifiers and the identifiers linking communications, issues and commitments to contacts. Export CSV. Keep the original exports and attachments in a private archive. If a report omits related identifiers, resolve those links in a reviewed staging copy first. Do not match people by name alone.
2. Install this project, run npm run migrate against an empty database, and create your project with npm run engagement -- add --type=project --name="Your consultation" --owner="Your owner" --purpose="Your collection purpose" --actor="Migration operator". Do not seed real installations.
3. Copy examples/jambo-manifest.json into a private imports directory. Set the project name and your CSV paths. Map each field to the exact heading in your export. Order files as stakeholders, interactions, issues, commitments. Convert dates to YYYY-MM-DD and categorisations to the accepted values below in reviewed staging copies. Preserve the original export separately.
4. Run the command below first with --dry-run. Compare counts, relationship links and samples against Jambo. Resolve all errors. Run again without --dry-run to commit the entire batch.
5. Review imported source statuses and add local completion evidence before closing anything. Compare reports and attachment references, arrange backup and recovery, and keep the original system until the checks are accepted.

```bash
npm run engagement -- import jambo --manifest=imports/jambo-manifest.json --actor="Migration operator" --dry-run
```

After column mapping, this one command brings the four record types across in one transaction. No authentication to Jambo is needed. Large exports and inconsistent relationship identifiers require migration work before that command can succeed.

## Mapping contract

Each file supplies type, file and columns. Paths are relative to the manifest. Each columns entry maps a local field to an exact CSV heading. Required fields must exist and be nonempty. A blank optional field is allowed. Unknown mapped fields fail; unused source columns are retained in the source snapshot.

| Type | Required mapping fields | Optional mapping fields |
| --- | --- | --- |
| stakeholder | source_id, name, owner | organisation, email, influence, purpose, notice-evidence, retention-review |
| interaction | source_id, name, stakeholder, date, channel, note | sentiment |
| issue | source_id, name, stakeholder, owner, due | severity |
| commitment | source_id, name, stakeholder, owner, due | issue |

stakeholder and issue contain the corresponding source IDs, not names. source_id is unique within a record type and project. Influence is an integer from 1 to 5. Channels: meeting, phone, email, site-visit, letter, other. Sentiments: positive, neutral, negative, mixed. Severity: low, medium, high. Empty optional ratings use documented local defaults: influence 3, sentiment neutral, severity medium. Dates must be real calendar dates; interactions cannot be dated in the future. Supply your own owner assignments if the export omits them, and record that mapping decision.

Identical imports skip. A changed source record or mapping fails for explicit reconciliation. A repeated source ID within the batch fails. A missing relationship fails. Every failure rolls back all inserts and the operation history. The dry run also rolls back everything.

## What stays separate

Jambo permissions, dashboards, tags not mapped into local fields, attachment binaries, Esri maps, project hierarchies, multiple organisation associations, automated integrations and historical activity logs need separate migration design. Original unselected CSV columns survive as source snapshots. Imported Closed or Completed labels never close local issues or promises: evidence is reviewed and recorded here first. This prevents an imported status from being mistaken for a new approval.

The JSON export is a complete archive of the local records and operation history. It is not accepted by the Jambo importer, and a recovery exercise is required before relying on it as a restore process. Owner credentials, hosting, backups and sharing permissions remain the operator's responsibility.

Sources checked 12 October 2026:

- https://www.jambo.cloud/features
- https://www.jambo.cloud/blog/how-to-set-up-your-jambo-account-to-produce-the-reports-you-need
- https://www.jambo.cloud/blog/expert-tips-to-get-the-most-out-of-your-stakeholder-data
