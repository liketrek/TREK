# Travel transfer runtime (draft)

Eight OAuth MCP tools implement the [wire contract](Travel-Transfer-Contract.md)
with persistent staging, exact original bytes, atomic apply and durable receipts.
This draft also maps ordinary native planner trips. It adds six private tables and
one mapping column; it does not change Docker, dependencies or deployment settings.

**Full native-trip sync is unfinished.** `complete-snapshots` remains withheld.
Complete-contract clients, including Memories, must continue refusing negotiation.
The saved connection and a successful connection check do not enable transfer.
The following native coverage is implemented and tested, not a claim that all TREK
travel domains or provider integrations are complete.

## Native mappings

`server/src/db/repositories/_shared/transfer-native-domains.ts` is the explicit
column, relationship, audience and write allowlist. It is not a generic database
export. New populated columns and unreviewed related domains fail closed.

- Native root title, description, dates, currency and archive state; currency is
  also projected as portable cost settings. Dates never cascade-delete planner
  children, and imported date changes do not trigger trip reminders.
- Native create/update/delete for days, places, visits, stays, day notes,
  reservations/endpoints, packing bags/items, tasks, expense values and file links.
  Server-owned bindings reuse identities across retries; source IDs never grant
  access to unrelated native rows. Unknown fields do not overwrite native values.
- Split/payer/settlement history, source people, collaboration, polls/reactions,
  participants, packing assignments/recipients, tours/route records and other
  explicitly enumerated source records remain attributed protected data. This
  does not create source accounts, grant memberships, cast votes or post messages.
  Private packing and personal source rows are filtered by current ownership;
  their dependants inherit the private audience. Other people's private packing
  cannot be exported or deleted through a bag cascade.
- Native shared files, legacy local photos and local covers produce original
  manifests through StorageService. Hashes and size/stamp checks cover bounded
  reads; stale bytes or missing originals stop the operation. Shared imported
  documents are materialized through StorageService with attachment MIME handling;
  private originals remain in private transfer storage. A native file is never
  fabricated from a thumbnail or remote URL. Native cover selection is not imported.
- Native task checkboxes round-trip without fabricating source completion times.
  Imported/changed tasks are excluded from reminder selection and atomic reminder
  claims. An explicit native task edit resumes normal reminders. Unchanged native
  tasks retain existing reminder behaviour.

Scalar mappings preserve raw source spellings alongside portable values. Decimal
precision loss, invalid calendar dates/coordinates/booleans and unsafe references
are rejected. Explicit deletion checks protect retained and private children.
Native edits invalidate revisions and overwrite only changed projected fields;
foreign extensions and historical attribution remain intact.

## Runtime protections

Explicit `transfer:read` / `transfer:write` consent is required, with no default,
preset, static-token or session-JWT grant. Current OAuth credentials, client and
trip ownership are rechecked on replay and before commit. Staging and receipts
are bound to account, client, operation, target and private-data selection.

Original and graph chunks require strict base64, offsets and SHA-256 hashes.
Graph, native rows, mappings and receipt commit atomically through UnitOfWork.
Storage I/O happens outside that transaction; authority and revisions are checked
again before commit. Shared-only apply preserves excluded private records and
rejects identity collisions. Historical imports do not call ordinary notification,
invite, membership or destructive date mutators.

Chunks are 1 MiB, originals at most 512 MiB, graphs at most 64 MiB and 20,000 records.
Staging expires after 24 hours; each account has at most 64 unapplied operations
and 1 GiB of declared graph/original bytes, including committed versions. Receipts
and committed originals survive expiry. Storage exceptions clean up newly prepared
unlinked files. A process crash between storage preparation and DB commit can leave
an orphan; a reviewed native-storage orphan sweep and long-term retention policy
are still required before broad use. Hash caches rely on the storage driver's
size/mtime/ETag integrity. No 512 MiB end-to-end acceptance is claimed.

## Remaining work before full negotiation

- Provider-backed `trip_photos` / `trek_photos`, album and external-document
  associations, linked journeys/journals and their writing/media/originals. Reuse
  current domain ACLs and provider original-stream APIs; never export provider
  secrets, use playback transcodes as originals, or broaden journal visibility.
- Complete personal category/tag semantics, receipt/ticket splits, and reversible
  native representations for currently protected domains where safe. Protected
  source retention is not native chat/cost-sharing/journal feature parity.
- Large-file lifecycle/retention and crash-orphan cleanup, and two disposable
  native trips across pull/push/both with all supported source families, child
  edits, conflicts, revocation, interruptions and original hashes.

Populated unreviewed source domains currently stop snapshots instead of silently
producing a partial graph. Do not remove the capability gate to bypass this work.
No production trip or deployed-image acceptance is claimed. Maintainer Discord
approval is unconfirmed; the PR remains a draft targeting `dev`.

## Verification

Tests use migrated TREK SQLite/MikroORM and Nest DI, actual OAuth/MCP HTTP/SSE,
StorageService with a real local driver and synthetic binary files. The committed
`server/tests/fixtures/travel-transfer/memories-native.json` was produced by a real
Memories PostgreSQL import/re-export of a synthetic native TREK snapshot. It tests
exact graph readback, not a hand-written mock of the other application.

```sh
npm run build --workspace=shared
npm run test --workspace=server -- tests/integration/mcp.test.ts tests/integration/oauth.test.ts tests/integration/oauth-authorize.test.ts tests/integration/travel-transfer.test.ts tests/unit/nest/travel-transfer tests/unit/db/foreign-key-indexes.test.ts tests/unit/coverage-thresholds.test.ts tests/unit/mcp/scopes.test.ts tests/unit/nest/todo.service.test.ts tests/unit/nest/reminder-jobs.service.test.ts --maxWorkers=2
npm run test:coverage --workspace=server -- tests/unit/nest/travel-transfer tests/integration/travel-transfer.test.ts --coverage.include='src/nest/travel-transfer/**/*.ts' --maxWorkers=2
NODE_OPTIONS=--max-old-space-size=8192 npm run typecheck --workspace=server
NODE_OPTIONS=--max-old-space-size=8192 npm run typecheck:tests --workspace=server
NODE_OPTIONS=--max-old-space-size=8192 npm run lint:strict --workspace=server
NODE_OPTIONS=--max-old-space-size=8192 npm run lint:warnings --workspace=server
npm run check:entities --workspace=server
npm run check:db-types --workspace=server
```

The targeted server regression set passes 292 tests. These are targeted source and
runtime checks, not the full monorepo suite, physical-device acceptance or live
connected-account sync. Existing strict/warning baselines and the domain coverage
threshold remain unchanged. Format, size, boundary, dialect, transaction, test,
query, MCP/HTTP, generated schema and foreign-key-index gates also apply.

To regenerate the synthetic TREK fixture, set `TREK_TRANSFER_FIXTURE` to an output
path when running `runtime.test.ts`; no production account is used. Memories'
`tests/test_trek_native_interop.py` can export the return graph with
`TREK_INTEROP_RESULT` during its PostgreSQL run. Never use family data as fixtures.
