# Travel transfer runtime (draft)

This draft now contains an executable Nest/MikroORM implementation, not only the
[wire contract](Travel-Transfer-Contract.md). It adds eight MCP tools, four additive
database tables and explicit OAuth consent. No Dockerfile, image or deployment
configuration changes are included.

**Full native-trip sync is not ready.** `travel_transfer_capabilities` deliberately
omits `complete-snapshots`. A complete-contract client, including Memories, must
continue to refuse negotiation. Do not remove that gate to enable a demo.

## Implemented runtime

- Explicit `transfer:read` and `transfer:write` grants, excluded from registration
  defaults and client presets. Static MCP tokens and session JWTs cannot use the
  tools. The transport supplies the authenticated OAuth client identity and a
  credential revalidation callback. Receipts and staged data are bound to that
  account, client, operation, destination and private-data selection.
- Private, persistent, ordered original/graph chunks, with strict base64, exact
  offset replay, per-chunk and whole-object SHA-256 checks. Original bytes are
  never decoded as text or exposed through public upload routes. Originals are
  immutable, including after their association is removed.
- Atomic graph/native-root/receipt commit through the existing UnitOfWork. A null
  target creates a trip only during apply. Concurrent/repeated creates converge
  on the same durable receipt. Changed operation inputs are conflicts. Recovery
  works after reconstructing the Nest container over the same database.
- Revision-bound metadata pagination and bounded original reads. Current account,
  ownership and OAuth authority are checked again on replay and before commit.
  Changes to a native title or retained child invalidate a reviewed revision.
- Historical authors, timestamps, votes and unknown fields stay in protected
  source records, not current-user collaboration rows. Apply does not call
  messaging, notification, invite, membership or cascading date-edit services.
- Shared-only apply preserves excluded private records and originals, rejects
  identity collisions, and validates relationship closure and field manifests.
  Imported private records do not become accessible to a new owner after a native
  ownership transfer.

## Deliberate limits and remaining work

The runtime can create a transfer-backed trip, preserve its entire reviewed source
graph and originals, and synchronize its native title, description and dates. Other
source domains are retained in the protected graph; they are not native planner,
chat, cost or file-manager features. There is no new archive-view UI in this PR.

Ordinary existing native trips are rejected, even if they appear empty. Adding any
unprojected native trip relation to a transfer-backed trip also blocks its snapshot
and further apply. Native currency, cover, archive or reminder changes also block
the initial root projector, so they cannot be silently omitted. The relation check
uses ORM metadata, so a newly added domain
cannot silently disappear. It does not enumerate account-security or membership
rows as portable travel data.

Before advertising `complete-snapshots`, implement and review native projectors for
places/days/assignments/stays/reservations, costs/splits/settlements, packing and
recipient visibility, tasks/participants, collaboration/polls/reactions, original
files and all their associations, tours/routes/recordings, linked journey material,
and provider-backed documents/photos. Each projector needs explicit authority,
field-state/provenance and reference rules, plus reversible mappings. Native file
reads must use StorageService; historical imports must never impersonate accounts.
Native dates must not delete children implicitly. Unsupported external source
material must block transfer, never produce an incomplete `complete: true` graph.

Then qualify two disposable paired native trips through pull/push/both, child edits,
conflicts, private data, permissions changing mid-run, lost acknowledgments, original
checksums and exact graph readback. No production trip transfer or full parity is
claimed by the runtime tests in this draft.

## Bounds and retention

Chunks are 1 MiB (except the final chunk); original manifests allow 512 MiB and
graphs 64 MiB. Staging expires after 24 hours; a new operation sweeps expired,
unapplied staging for its account. At most 64 unapplied operations and 1 GiB of
reserved original-plus-graph bytes per account are allowed. Committed data counts
against that quota. Receipts and original versions are not removed by staging
expiry. These conservative limits avoid unbounded uploads and accidental retry
creation, but a reviewed retention/storage policy is needed before broad use.

Private chunks live in the existing application database and therefore follow its
backup path. This intentionally avoids adding another storage service or a public
file-serving route. Large-volume production storage and original-file lifecycle
acceptance are still required; the tests exercise chunk boundaries with synthetic
bytes, not a 512 MiB production file.

OAuth refresh may require reinitializing the MCP session: final revalidation uses
the credential that initialized it and fails closed after that credential expires
or is revoked. No credential or grant is expanded automatically.

## Verification

Tests use TREK's real migrated SQLite/MikroORM schema (its current runtime engine),
Nest DI, synthetic binary data, and the actual OAuth/MCP HTTP/SSE transport.
They do not substitute SQLite for a PostgreSQL application and do not use family
records or a deployed TREK instance.

Run from the repository root after `npm ci` and `npm run build --workspace=shared`:

```sh
npm run test --workspace=shared -- src/travel-transfer/transfer.schema.spec.ts
npm run test --workspace=server -- tests/integration/travel-transfer.test.ts tests/unit/nest/travel-transfer/runtime.test.ts
npm run test --workspace=server -- tests/integration/mcp.test.ts tests/integration/oauth.test.ts tests/integration/oauth-authorize.test.ts tests/unit/db/foreign-key-indexes.test.ts tests/unit/coverage-thresholds.test.ts tests/unit/mcp/scopes.test.ts
npm run check:entities --workspace=server
npm run check:db-types --workspace=server
npm run i18n:parity:strict --workspace=shared
```

The final targeted server regression set passes 210 tests; the client consent suite
passes 15, shared contract suite 4 and Python reference suite 6. The 25 runtime/HTTP tests measure 88.43% statements, 85.83% branches,
97.36% functions and 97.01% lines against the new domain's 80% threshold. HTTP tests send a
full 1 MiB binary chunk and read an unaligned range across its boundary. They do
not claim an end-to-end 512 MiB upload or live connected-trip acceptance.

Type, lint and coverage gates remain applicable. Maintainer discussion in Discord
is still unconfirmed; the PR remains a draft for review.
