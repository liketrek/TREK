---
name: trek-upstream-upgrade
description: Assess, plan, rehearse, and implement official upstream release upgrades for the TREK fork while preserving its custom features, commit history, database lineages, and deployment contracts. Use for TREK upstream syncs and upgrade overlap reviews; not ordinary dependency bumps or unrelated repositories.
---

# TREK Upstream Upgrade

Upgrade from evidence, not from the apparent simplicity of a Git merge. The desired result is an upstream-current tree whose retained downstream contracts are explicit, tested, migration-safe, and traceable to both histories.

## TREK project context

This repository-scoped variant includes the reviewed upgrade workflow and its playbook; it does not require a personal skill installation. Resolve the repository root with `git rev-parse --show-toplevel` when working in a subdirectory.

- Read the [upstream sync guide](../../../docs/agents/upstream-sync.md) for the current release baseline, customization inventory, branch flow, and audit commands. Treat its linked upgrade ledgers as evidence, not permission for another rollout.
- Follow [ADR 0004](../../../docs/adr/0004-adopt-upstream-release-baselines-with-schema-crosswalks.md) for integration strategy and [ADR 0005](../../../docs/adr/0005-separate-upstream-and-fork-migration-lineages.md) for independent migration lineages. Read [CONTEXT.md](../../../CONTEXT.md) for the fork's domain terminology.
- Inspect the current migration runner, `server/src/db/fork-migrations.ts`, and `server/scripts/audit-v4-upgrade.ts` before changing schema endpoints. Derive current versions from the checkout; do not carry a previous upgrade's target forward by assumption.
- Open upgrade PRs against `dev`. Promotion to `release`/`main`, release tags, and production deployment remain separate actions requiring their applicable authorization and rollout evidence.

## Match the requested scope

- For an assessment or conflict check, stay read-only and report feasibility, overlap, likely breakage, and the recommended strategy.
- For a plan, produce an implementation-ready plan without creating branches, commits, tags, PRs, or deployments.
- Read [references/upgrade-playbook.md](references/upgrade-playbook.md) for planning, rehearsal, or implementation, and follow only the phases authorized by the request. For read-only planning, prefer `git merge-tree` with an isolated object cache; do not create working branches or start an in-progress merge.
- Treat branch promotion and production rollout as separate actions. An implementation request does not silently authorize a production-connected merge.

## Establish authority and ground truth

1. Read repository instructions, upstream-sync documentation, ADRs, domain vocabulary, migration policy, release process, and test configuration before deciding how to integrate.
2. Preserve unrelated working-tree changes. Record the current branch, remotes, branch tips, tags, default branch, and whether any branch is connected to automatic deployment.
3. Resolve “latest” from official upstream releases at execution time. Prefer the latest stable release tag unless the user selects another target; do not use upstream `dev` or `main` as a release baseline by assumption.
4. Record the exact upstream tag, peeled commit, release notes, signature/verification status, package versions, and migration endpoint. Official release provenance and cryptographic signature verification are separate claims. If the user accepts an unsigned release, pin its full commit SHA, record that exception, and do not describe it as signature-verified.
5. Run the unmodified upstream tag's documented build and tests before porting. Separate baseline failures from downstream failures.

## Build a customization contract inventory

Do not equate customizations with commits. Derive a concise inventory from the fork-point diff, downstream commit history, tests, schemas, routes, events, settings, docs, and production assumptions.

Classify each customization as:

- **Retain:** still required and not supplied upstream.
- **Adapt:** required behavior, but its implementation must move into upstream's new architecture.
- **Superseded:** upstream now provides equivalent behavior; keep upstream's implementation and regression-test the contract.
- **Retire:** intentionally dropped, including its UI, schema, translations, docs, and tests where safe.
- **Decision required:** upstream and downstream now express incompatible product semantics.

Record contracts rather than implementation details: externally visible routes and schemas, stored data and precedence rules, permissions, events, plugin/MCP interfaces, desktop/mobile behavior, localization, deployment invariants, and rollback expectations.

## Choose the integration strategy from evidence

Use an **incremental release-tag merge** when the previous upstream baseline is known, architecture and migration lineage remain compatible, conflict volume is bounded, and tests can prove behavior.

Use a **release-baseline port** from the exact upstream tag when any of these apply:

- a major release or broad architecture replacement;
- downstream and upstream reused migration identifiers for different schemas;
- customized subsystems were deleted, renamed, or replaced upstream;
- conflict rehearsal produces extensive modify/delete conflicts or cross-cutting overlaps;
- resolving text conflicts would preserve old architecture rather than required behavior;
- the resulting semantics cannot be explained and tested confidently.

Rehearse before committing to either strategy. Count unique conflict paths and conflict types, then group overlaps by subsystem. A clean textual merge is not proof of behavioral compatibility.

## Port by contract

- Start from upstream's architecture and authoritative new semantics.
- Reimplement retained behavior at the new module seams; do not restore deleted legacy layers merely to reduce diff size.
- Preserve public contracts only when the inventory says to retain them.
- Reconcile upstream additions inside customized domains instead of letting downstream code overwrite them.
- Reapply localization key-by-key over the complete upstream locale; verify locale parity.
- Drop superseded patches and document why they are no longer carried.
- Keep each core and SDK/package version at the value shipped by the chosen upstream release unless the user explicitly chooses otherwise; independently versioned packages need not share the core version number.

## TREK FX upgrade contract

The v4.3.3 integration deliberately keeps **preview, then manual apply** instead of upstream's automatic freeze-on-open. Preserve explicit → trip → global priority and provenance across REST, MCP, plugin RPC, reservations and imports. Intentional 1:1 rates are identified by provenance; the legacy default 1 is not evidence of freezing. For v5.2.0 and later, calculate debts and suggested repayments in the selected Costs currency. Use the expense rate for its currency pair, then the trip rate, then the system rate. Report a row as awaiting conversion when all applicable sources are missing. Save a confirmed repayment in the quoted currency at the quoted rate. See the [v5.2.0 integration record](../../../docs/upgrades/v5.2.0.md). New foreign writes require a valid rate, while unrelated edits preserve the freeze. Keep nullable preview amounts/deltas and reject stale previews before writing.

Use the [v4.3.3 evidence ledger](../../../docs/agents/upgrades/v4.3.3.md) for this decision and schema 244, not as proof of a deployed baseline. The earlier uncommitted v4.3.0 attempt is not an integration baseline. During implementation use persistent worktrees and commit checkpoints so an expired temporary directory cannot lose the only copy of work.

## Protect database lineages and production data

Never edit published upstream migrations to make a fork database fit. Detect overlapping or divergent migration histories explicitly.

When upstream and the fork assigned the same numeric versions to different schemas, keep upstream's numeric lineage authoritative and track fork migrations independently with stable named IDs. Translate legacy metadata only when expected artifacts prove the lineage. Reject ambiguous or mixed schemas rather than guessing.

Keep the historical schema endpoint of a legacy normalization bridge separate from the current upstream endpoint. Normalize only to the schema the bridge actually installs, then let the official runner apply every subsequent migration. Test with the real older schema, not a current schema whose version metadata was merely lowered.

Fork migrations must be transactional, idempotent, value-preserving, and safe on fresh upstream databases, supported legacy fork databases, and repeated runs. Add a read-only audit path that does not open the normal auto-migrating application module when data risk warrants it.

Rehearse with a restored production backup and the real encryption/configuration assumptions. Verify schema endpoints, applied fork IDs, integrity checks, foreign-key checks, and preservation counts or checksums for important data.

## Preserve history without changing the audited tree

For a baseline port, commit and verify the completed upstream-based tree first. Create safety tags for pre-upgrade branch tips. If ancestry must be connected, use an `ours` history bridge only after recording the tree hash, then prove the bridge did not alter the tree.

Promote the identical audited tree through the repository's branch flow. Verify tree hashes after every GitHub merge; commit hashes may differ while tree hashes must not. If a release branch has diverged, inventory its unique commits and tree changes first. Reconcile every retained contract before considering a dedicated `ours` history bridge. Matching tree hashes prove that a bridge changed no files; they do not prove that the bridged branch had no unported work.

## Verification and rollout gates

Run repository-required builds, types, lint/format, unit/integration/coverage, targeted UI tests, production container build, SDK/plugin tests, migration matrix, and restored-backup rehearsal in proportion to the changed contracts. Recheck previous conflict hotspots even when compilation succeeds.

Before merging any branch that may deploy, inspect deployment metadata rather than trusting environment names. A branch promotion can trigger production even when its URL looks like staging, or vice versa.

Do not open production writes after an upgrade until the deployment has passed migration audit and smoke tests. A production-connected merge requires a fresh complete backup, a maintenance/write-stop plan, encryption and plugin data coverage, and an explicit rollback image. Never start the old application against a migrated database; rollback restores the old image and the complete pre-upgrade backup together.

## Stop conditions

Pause and request direction when:

- a product-semantic choice would change or retire a downstream contract;
- a schema version is ambiguous or lacks the artifacts needed to classify it;
- a requested production rollout cannot validate live plugins, encryption material, or production configuration; for assessment or PR delivery, record the missing production evidence and continue independent authorized work;
- the chosen integration strategy no longer matches the observed conflict/architecture evidence;
- a production-connected branch would merge without the required fresh backup and maintenance confirmation.

Finish with an evidence ledger: target tag and commit, strategy, customization disposition, conflict audit, migration classifications, tests and rehearsals, tree hashes, PR/tag links, deployment state, and any explicitly deferred advisory findings.
