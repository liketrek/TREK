# Travel transfer runtime (draft)

Eight explicitly scoped OAuth MCP tools implement the [wire contract](Travel-Transfer-Contract.md),
including complete snapshots, original bytes, conditional apply and durable receipts.
Native planner projections now include provider photos, linked journey content and
external documents. The runtime advertises `complete-snapshots`. This is source
implementation and synthetic acceptance; it does not update an installed TREK image.

The PR adds six private tables, a native mapping column and a chunk-checksum column.
No Docker, dependencies, deployment settings, accounts or provider credentials are
installed by this change. Maintainer Discord approval remains unconfirmed; the PR
remains a draft targeting `dev`.

## Content and native mappings

`server/src/db/repositories/_shared/transfer-{native,linked}-domains.ts` explicitly
lists columns, relationships, audiences and allowed native writes. Unknown populated
trip domains or columns stop a snapshot instead of silently dropping content.
Category/tag catalogues do not pull in unrelated personal collections.

- Native create/update/delete for planner days, places, visits, stays, day notes,
  reservations/endpoints, bags/items, tasks, expenses and document associations.
  Persistent server-owned identities survive retries. Dates never cascade-delete
  children. Imported date/task changes do not trigger reminders; a later explicit
  native task edit restores its normal reminder behavior.
- Native root title, description, dates, currency and archive state; exact decimal
  representations, native category definitions, personal tags and ticket item/split
  details retain their meaning. Historical participant IDs/names remain source
  attribution, never account mappings or grants.
- Linked journeys, entries, entry-photo/stay associations, recorded days, books,
  photo galleries and album/document associations retain writing and provenance.
  Trip ownership does not grant journal access. Current journey membership, entry
  author/draft/privacy, photo sharing and provider enablement are rechecked. Linked
  journey content and personal tags require explicit private-data selection.
  A linked journey exports its accessible content, not just entries for one trip;
  source-trip/place IDs remain passive provenance and cannot resolve other trips.
- Protected historical data includes source people, collaboration, polls/reactions,
  cost-sharing/splits, linked journals, provider associations, tours and routes.
  It round-trips as attributed records and original bytes without creating native
  accounts, memberships, votes, messages, journal authors or provider connections.
  **Lossless protected transfer is not native UI feature parity.** Imported journal
  history/photos are retained source content; this does not create native editable
  journey pages or attach a destination provider account.
- Existing covers and local originals use StorageService. Imported shared documents
  are materialized natively. Cover selection and protected photos remain retained
  content rather than changing native cover/gallery selection automatically.

## Original bytes and current authority

Immich uses its original asset endpoint, never video playback. Synology uses the
individual photo download endpoint, never the thumbnail endpoint. Unsupported
providers, missing originals and JSON/HTML/archive responses fail closed. Synology's
protocol is covered by synthetic responses, not acceptance against a physical NAS.
Remote URL covers without a saved original are explicitly refused.

External documents use their saved provider connection and scope. A fresh complete
listing must still contain the document; truncated listings, remote deletion,
changed versions, orphaned/disabled bindings, connection reassignment and changes
while reading fail. Provider sessions may renew through the existing credential
mechanism, but no transfer creates connections, subscriptions or sync jobs.
Credentials, passphrases, webhook tokens and diagnostic URLs are never exported.

Photo/document streams are bounded and SHA-256 verified. Reading a requested range
currently downloads and hashes the entire provider original again, avoiding stale
cache authorization or a changed rendition. This costs bandwidth for large files;
there is no claim of large live-provider performance acceptance. Native local files
use storage stamp/hash checks and bounded range reads. Journal/graph revisions and
current OAuth/trip ownership are checked again before bytes are returned.

## Apply, retries and retention

Only explicit `transfer:read` / `transfer:write` OAuth consent works; static tokens,
session JWTs and unrelated default scopes do not grant transfer. Operations are
bound to account, client, target, digest and private-data selection. Historical
apply calls no ordinary membership/notification/date-cascade mutators.

Graph, native rows, mappings and receipt commit atomically through UnitOfWork.
Storage/network I/O stays outside that transaction. Shared-only apply preserves
excluded private records and rejects identity collisions. Conflict revisions and
current rights are rechecked on retries and before commit.

Chunks are 1 MiB; each original is at most 512 MiB, graphs 64 MiB /20,000 records.
Each account has 2 GiB of reserved/live transfer bytes and at most 64 unapplied
operations. Staging expires after 24 hours. Current graph originals remain readable;
superseded bodies are retired after apply while checksums and identity tombstones
preserve exact chunk replay and immutable original IDs. Migration
`Migration20200101046230_transfer_chunk_receipts.ts` adds the nullable checksum
column; legacy checksums are backfilled lazily before retirement.

Boot/hourly cleanup enumerates only transfer-created file names. After a 26-hour
grace it removes unlinked files whose operation is no longer active, including
crash orphans. Linked and active prepared files survive. The scheduled callback
returns its promise so the scheduler lease covers the entire sweep. Existing
storage-driver mtime/ETag guarantees remain necessary for local hash caching.

## Verification

Tests use migrated native TREK SQLite/MikroORM, Nest DI, real OAuth/MCP HTTP/SSE,
a real LocalDriver and synthetic binary originals. Provider transports are mocked;
current ACL/database paths are real. A 512 MiB original passes actual chunk staging,
verification, native materialization and bounded readback. No live provider account,
production trip, device, Docker image or deployment was changed or accepted.

`memories-native.json` and `memories-linked.json` under
`server/tests/fixtures/travel-transfer/` are outputs from real Memories PostgreSQL
import/re-export of synthetic native TREK snapshots. The linked return graph,
original hash/bytes, native edit and subsequent apply are verified back in TREK.
This complements engine tests for pull/push/both, conflicts, lost acknowledgements
and revocation; it is not simultaneous live two-server acceptance.

```sh
npm run test --workspace=server -- tests/integration/mcp.test.ts tests/integration/oauth.test.ts tests/integration/oauth-authorize.test.ts tests/integration/travel-transfer.test.ts tests/unit/nest/travel-transfer tests/unit/db/foreign-key-indexes.test.ts tests/unit/coverage-thresholds.test.ts tests/unit/mcp/scopes.test.ts tests/unit/nest/todo.service.test.ts tests/unit/nest/reminder-jobs.service.test.ts tests/unit/nest/immich.service.test.ts tests/unit/nest/synology.service.test.ts tests/unit/nest/photo-resolver.service.test.ts tests/unit/nest/memories-access.service.test.ts tests/unit/nest/unified-memories.service.test.ts tests/unit/nest/doc-sync --maxWorkers=2
npm run test:coverage --workspace=server -- tests/unit/nest/travel-transfer tests/integration/travel-transfer.test.ts tests/unit/nest/immich.service.test.ts tests/unit/nest/synology.service.test.ts --coverage.include='src/nest/travel-transfer/**/*.ts' --coverage.include='src/nest/doc-sync/doc-sync-transfer.service.ts' --maxWorkers=2
NODE_OPTIONS=--max-old-space-size=8192 npm run typecheck --workspace=server
NODE_OPTIONS=--max-old-space-size=8192 npm run typecheck:tests --workspace=server
NODE_OPTIONS=--max-old-space-size=8192 npm run lint:strict --workspace=server
NODE_OPTIONS=--max-old-space-size=8192 npm run lint:warnings --workspace=server
npm run check:entities --workspace=server
npm run check:db-types --workspace=server
```

1,296 targeted server tests pass. Focused coverage is 89.95% statements,
86.75% branches, 98.18% functions and 95.29% lines; existing thresholds are unchanged.
Format, size, boundaries, SQL/dialect, transaction, mock/query, MCP/HTTP, DTO and
generated schema gates pass with unchanged baselines. This is not the full monorepo
suite. Run Vitest invocations sequentially: they share a schema-snapshot file.

Fixture regeneration uses `TREK_TRANSFER_FIXTURE` (planner) or `TREK_LINKED_FIXTURE`
(linked photos/journeys) during the respective runtime/linked tests. Memories'
`tests/test_trek_native_interop.py` emits return graphs with `TREK_INTEROP_RESULT`.
Fixtures contain synthetic data only. After an upstream release is installed,
commission with explicit transfer scopes and disposable paired trips before using
real travel data; no live acceptance is claimed here.
