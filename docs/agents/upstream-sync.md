# Upstream Release Sync

The repository includes the [TREK Upstream Upgrade skill](../../.agents/skills/trek-upstream-upgrade/SKILL.md), invoked as `$trek-upstream-upgrade`. Its playbook is checked in with the skill, so collaborators do not need the personal `upgrade-upstream-fork` installation.

`origin` is the downstream fork and `upstream` is `https://github.com/liketrek/TREK.git`. Upgrade from official stable release tags, never from upstream `dev`. Record tag and commit signatures separately from release provenance. An unsigned release requires a recorded user acceptance and a pinned full commit SHA.

## v5.2.0 integration

The feature branch `codex/upgrade-trek-v5.2.0` integrates the official release with the fork's `dev` history. The assessment records the original design decisions. The integration record tracks what was implemented and tested. [Assessment](../upgrades/v5.2.0-assessment.md) · [Integration record](../upgrades/v5.2.0.md)

- **Visit duration.** Use upstream's Road Trip editor and keep the fork's duration input in the regular day planner. Both edit the same visit. Reconcile the older SQLite limit so seven-day stays work on upgraded installs.
- **Costs.** Use the currency selected on the Costs page for debts and repayments. When conversion is needed, use the expense's saved rate for that pair, then the trip rate, then the system rate. Record the amount shown when the user confirms repayment.
- **Dashboard and sessions.** Retire the exact departure countdown and use upstream’s trip-date display. Keep the dev deployment’s 30-day remembered login setting.
- **Trip PDF.** Adopt the upstream layout and print each visit's duration and estimated arrival and departure times.
- **Database.** Preserve existing fork SQLite data and migration history. Verify equivalent fork data on PostgreSQL, including a populated SQLite-to-PostgreSQL move.

## Release integration workflow

1. Resolve the requested official release and full commit SHA; record the signature status and current fork tips. Use a read-only merge simulation for planning.
2. Validate an independent, unmodified upstream worktree. For a compatible upgrade, merge the pinned release into a persistent `codex/upgrade-trek-vX` worktree from `origin/dev`. For an incompatible upgrade, start from the pinned release and port the fork contracts.
3. Resolve by feature contract, including automatically merged overlapping files. Preserve custom commit ancestry and save implementation checkpoints.
4. Test real migration prefixes, old fork lineages, partial/repeated upgrades and an isolated data copy. Do not relabel a current database as an old schema.
5. Deliver validation evidence in a PR to `dev`. A fresh production-backup restore and live-plugin checks gate later promotion/deployment, not independently testable PR work.

The previous upgrade adopted v4.3.4 (`d80577480c672799154ea9912918d906d16c0a75`) incrementally from the delivered v4.3.3 baseline (`1c05ee4b3ac9523c41ccdd3baad989ba48a7409a`). The user explicitly accepted the unsigned tag and commit on 2026-10-23 based on official release provenance and that pinned SHA. See [v4.3.4 evidence and remaining gates](upgrades/v4.3.4.md). That release changed version metadata only. Its security fix required a fresh image running Node 24.22.1 or later in the 24.x line.

The earlier v4.3.3 upgrade came directly from the fork's v4.2.1 baseline (`515398f8ee3000b36a5f5b80365d6214f3f1a723`). See [the v4.3.3 ledger](upgrades/v4.3.3.md) and [the preceding v4.2.1 ledger](upgrades/v4.2.1.md). The unsubmitted v4.3.0 attempt is not a delivered baseline.

The v5.1.0 upgrade starts from upstream `dc36c21c08f681fd2806764fad8e17b270f6f175` and ports the contracts in fork tip `0b970eac7aad7ccc38d5a505c1c0d5866f919dd1`. Upstream replaced the positional SQLite migration runner with MikroORM, so merging the old implementations would obscure which schema changes had already run. A history bridge with `ours` requires an inventory proving every diverged change was retained or deliberately retired; an unchanged tree hash alone proves only that the bridge did not change its chosen tree.

The v5.1.1 integration merges official `95d62b7a02f3209d927504f5d21b3efe5065d2bc` into dev `020a51a00968052f1bf1de16c9533b8727a8edcd`. See [the v5.1.1 evidence ledger](../upgrades/v5.1.1.md) for retained contracts, unsigned-release acceptance, migration checks and remaining rollout gates. This records a local upgrade branch, not promotion or deployment.

## Customization inventory

- Layered frozen exchange rates with provenance across REST, MCP, plugins, desktop, and mobile.
- Ordered Common currency shortcuts with administrator inheritance and personal empty/reset semantics.
- Guest identity transfer and the New-member identity check.
- Upstream browser/native push. The custom Direct Web Push implementation is superseded; preserve its historical migration receipts. Push runtime code follows upstream v5.1.1 without fork enrollment or renewal guards.
- Mobile timeline day selection recovers after reload, a cleared selection, or a stale day id. The map permits an intentional All days selection; returning to the timeline restores the previous valid day or the closest valid focus day.
- Recorded mobile payments use the upstream date-grouped ledger with frozen FX and the fork's edit/delete actions.
- Traditional Chinese wording overlay and `zh-HK` detection.
- Debranded Help/About/release promotion with a neutral AGPL Legal/Source page.
- Docker builder stages explicitly include development dependencies.
- Fork CI runs the S3 contract against pinned community MinIO so it does not depend on upstream's proprietary AIStor license secret; Sonar upload is gated by `SONAR_ENABLED` and uses the fork-owned project and token.

Superseded: the Mapbox reservation-source teardown patch, which is already present upstream v4.

## Migration lineages

The old fork used migrations 176–180 and 199–202 for different schemas than upstream. The historical normalization bridge ends at upstream step 200. Do not move that endpoint when later migrations are added. The v4.3.4 fork tracked the official chain through step 244 in `schema_version`, with separate named rows in `fork_schema_migrations` for the crosswalk, enhanced FX, Guest identity, and Web Push.

Upstream v5 maps the proven legacy steps into the MikroORM migration history before running pending migrations. Step 258 is the last official positional step that v5.1.0 knows how to map. It is not the v5.1.0 migration head. Keep the fork ledger separate and use the actual schema to classify a legacy database before mapping its history.

Never boot an unmodified upstream image against a fork database. For the historical v4 audit command, see [v4.3.4 evidence and remaining gates](upgrades/v4.3.4.md). Rehearse the v5 upgrade against an isolated restored backup. If no production backup is available, a tested PR can still be prepared, but production rehearsal remains a merge/deployment gate. Roll back only by restoring the complete pre-upgrade database, uploads, encryption material, plugin data, configuration, and old image.
