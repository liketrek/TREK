# Upstream Release Sync

`origin` is the downstream fork and `upstream` is `https://github.com/liketrek/TREK.git`. Upgrade from signed/stable release tags, never from upstream `dev`.

## Workflow

1. Fetch and verify the requested upstream tag and record the current fork tips with `pre-vX/` safety tags.
2. Create `codex/upgrade-trek-vX` from the tag and run the unmodified upstream baseline tests.
3. Port the customization inventory below by contract and regression test; do not replay historical implementation commits.
4. Rehearse database migration on a restored production backup and run the read-only upgrade audit.
5. After verification, merge the preserved old tips with the `ours` strategy and verify the tree hash did not change. Target `dev`, then promote through the normal release/main flow.

## Customization inventory

- Layered frozen exchange rates with provenance across REST, MCP, plugins, desktop, and mobile.
- Ordered Common currency shortcuts with administrator inheritance and personal empty/reset semantics.
- Guest identity transfer and the New-member identity check.
- TREK-managed Direct Web Push.
- Exact departure-transport countdown on desktop and mobile spotlights.
- Traditional Chinese wording overlay and `zh-HK` detection.
- Debranded Help/About/release promotion with a neutral AGPL Legal/Source page.
- Docker builder stages explicitly include development dependencies.

Superseded: the Mapbox reservation-source teardown patch, which is already present upstream v4.

## Migration warning

The old fork used migrations 176–180 for different schemas than upstream v4. Never boot an unmodified v4 image against that database. Use the downstream build whose migrations 199–202 contain the crosswalk, and roll back only by restoring the complete pre-upgrade backup.
