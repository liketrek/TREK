# Proposed lossless travel transfer contract

**Draft contract with an initial runtime implementation.** See
[the runtime status and limits](Travel-Transfer-Runtime.md). Eight tools are now
implemented, but complete native-trip projectors are still missing and the runtime
does not advertise `complete-snapshots`. Full-sync clients must remain blocked.
The contribution guide requires prior discussion in Discord #github-pr; that
approval is still unconfirmed. This PR targets `dev` and changes no deployed image.

## Problem

A third-party trip manager cannot safely synchronize complete trips with today's
MCP tools: original-file reads are limited and may decode text; upload is absent;
historical conversation writes attribute to the caller and broadcast new messages;
creates have no durable retry receipts; shortening trip dates may remove children.
Using session-cookie endpoints as a machine API would bypass the supported contract.
The request is an additive, explicitly scoped machine transfer interface, not a
change to ordinary chat, upload, date editing or public read-only API semantics.

## Negotiation and transport

Use the existing OAuth/MCP transport and current trip/resource permission checks.
Never accept a cookie or reinterpret a read-only API key. New `transfer:read` and
`transfer:write` scopes must be opt-in; existing grants receive neither implicitly.
An OAuth resource remains `/mcp`; original chunks travel through bounded tool calls,
not new bearer-token destinations. Every request and replay rechecks the current
user/client/grant, trip access, field audience and original ownership.

`travel_transfer_capabilities()` returns `format: travel-transfer/1`,
`features: [complete-snapshots, field-manifests, original-chunks,
historical-attribution, silent-apply, conditional-apply, durable-receipts,
protected-extensions, graph-staging, idempotent-trip-create, scoped-apply]`, `max_original_bytes: 536870912`, `chunk_bytes: 1048576`.
A missing feature blocks full transfer. Advertising is a guarantee, not tool-name
inference. Unsupported/inaccessible domains are reported explicitly before apply;
never silently omit fields and then return `complete: true`.

## Proposed tools

- `travel_transfer_list_trips(cursor?, limit=100)`: current authorised IDs/titles
  and bounded cursor. A title never identifies a trip or repairs a lost create.
- `travel_transfer_snapshot(trip_id, revision?, cursor?, include_private=false)`: revision-bound pages of
  the attached snapshot schema. First page freezes the complete authorised graph;
  child-only edits change its revision. Private data and nested private widgets are excluded unless explicitly requested
  and currently authorised. Every page reauthorises and binds the same
  trip/revision. Limit metadata pages to1MiB. Cyclic cursors, changed revisions,
  missing graph references or unavailable domains abort the snapshot.
- `travel_transfer_read_original(trip_id, revision, id, offset, limit)`: exact bytes
  as bounded base64, offset/total length/full SHA-256/chunk SHA-256. No text decoding,
  redirects, external URLs or credentials. Range must be0..declared size, at most1MiB.
- `travel_transfer_write_original(trip_id, operation_id, id, offset, total, sha256,
  chunk_sha256, data, include_private=false)`: append verified chunks into an account/operation-bound
  staging object. Replayed chunks must match exactly; reject holes, offset or digest
  changes. Support512MiB per original. Publish only after full hash verification.
- `travel_transfer_stage_graph(trip_id?, operation_id, payload_digest, offset, total,
  chunk_sha256, data, include_private=false)`: stage canonical UTF-8 JSON in bounded base64 chunks. Bind
  the staging object to account/client/operation/digest, verify replay bytes and
  whole SHA-256, and return exactly `{next_offset, payload_digest}`. The metadata
  aggregate limit is64MiB; it must not become a single MCP request.
- `travel_transfer_apply(trip_id?, expected_revision?, operation_id, payload_digest,
  original_ids, include_private=false)`: commit the reviewed graph, stable mappings and a durable
  receipt in one transaction. Original I/O is outside database locks; reauthorise
  before commit. No broadcasts, invites, membership edits, reminders or notifications.
  Retain historic author/source time separately from the importing local account;
  do not impersonate accounts or re-cast historical votes as current user's votes.
- `travel_transfer_receipt(trip_id, operation_id, payload_digest, include_private=false)`: durable lookup,
  reauthorised even on replay. Return `applied` with digest/result revision/mappings,
  `not_applied`, or `pending`; never guess based on a matching title/timestamp.
  A lost acknowledgement is reconciled before another apply. Reusing an operation
  ID with another digest is a conflict. Bind receipts to user, client and trip. An applied receipt includes `state`,
  `payload_digest`, `trip_id` and `revision`. `not_applied` and `pending` include
  `payload_digest`. Missing receipts must be authoritative, never inferred.

A null trip ID stages a new trip under the same operation; only atomic apply
creates it, and its receipt supplies the permanent trip ID. The expected revision
is null only for this explicitly chosen creation. Read snapshots return the
schema envelope plus `next_cursor` (null on the last page); each page repeats the
same trip/revision and `complete:true` guarantee for the frozen whole snapshot.
List pages return `{trips:[{id,title}],next_cursor}`. Original reads return exactly
`{offset,total,sha256,chunk_sha256,data}` and writes acknowledge exactly
`{next_offset,sha256}`. Replaying original/graph staging never publishes a trip.
The apply digest is SHA-256 of canonical JSON (sorted keys, UTF-8, no insignificant
whitespace, finite numbers); amounts and weights remain strings. Server storage
must retain bounded receipt history independently of staging expiry.

Metadata writes can be paged/staged before the atomic apply; an implementation must
not put a64MiB snapshot into one MCP response. Per-call and aggregate time/byte/job
limits, staging quotas/expiry and safe cancellation are required. Disconnect/revoke
pauses future execution; never delete committed travel data as cleanup.

## Snapshot and merge semantics

[JSON schema](transfer-contract/snapshot.schema.json) and
[executable reference](transfer-contract/reference.py) define envelope validation,
explicit null/empty/unknown/unavailable/extension states, relationship closure,
record/file identity and three-way comparisons. `source.fields` names exactly the
supplied fields. The schema is necessary but not sufficient: the reference checks
uniqueness, relationship closure, manifest coverage and original identity too.
`$transfer: absent` is a reserved internal sentinel, never a source value.

Stable record IDs survive repeat import and child edits. Pair the root trip
explicitly; identities are never inferred from labels, dates or names. Amounts,
weights and precision-sensitive facts use exact strings and original source text;
finite floats are for geometry, not money. Preserve source order, original enum
values, null/empty distinctions and unmodelled fields as protected extensions.
References point only to records in the same authorised complete snapshot.
Credentials/account-security data and unauthorised private fields are excluded.
Linking trips never grants access. Shared canonical writing is linked without
creating duplicate journal posts or merging private discussions.

Use per-side per-record/field baselines (a common baseline after a settled
bidirectional run). Unchanged one-way sources must not repeatedly overwrite
destination-only edits or propose the same deletion. Use a per-record/field comparison. Apply one-sided edits, settle identical
edits once and explicitly review competing edits. Deletion proposals and audience
changes always require a choice, including one-sided changes; do not infer deletion
from missing pages. Date edits must preserve children unless a separately reviewed
explicit deletion is authorised. Originals are immutable versions: an ID cannot
change bytes, length or hash. Preserve previous originals and their associations.

A consumer may retain source-only domains with their full manifests/relationships;
it must identify them visibly and must not claim native feature parity. A producer
must define and test all projections before claiming this full contract. The initial runtime implements the tools but deliberately refuses ordinary native
trips until the projectors are reviewed and tested.

## Required integration acceptance

Two disposable paired trips, pull/push/both; every travel domain including original
files, collaboration and source extensions; child-only and conflicting edits;
private/excluded fields; account/client/key/trip revocation during every phase;
interrupted chunks/apply and lost responses; durable receipt recovery; no duplicates,
echo, notifications or membership changes; original checksums; portable mappings,
paused restore and explicit re-enable; mobile review and current-authority replay.

Reference conformance tests use only synthetic values and standard-library Python:

```sh
cd wiki/transfer-contract
python3 -m unittest test_reference -v
```

The reference is independently developed in Memories and contributed under TREK's
AGPL-3.0 licence. The Python reference has no runtime dependency; the TypeScript server implementation
uses TREK’s existing dependencies. This draft has not been deployed.


## Selected-audience apply guarantee

The `scoped-apply` feature binds `include_private` to the frozen snapshot revision,
all staged bytes, operation identity, conditional apply and its durable receipt.
A shared-only snapshot/apply leaves private and otherwise unselected records and
originals unchanged. Absence outside the selected audience is never a deletion.
Reject a supplied shared identity that collides with a private/unselected identity;
never widen that record's audience. Replaying an operation with a different scope
is a conflict even when the graph digest matches.

Derived personal cost totals, private planner labels and private chat attachments
must be separate private records. Including private source data never moves it
into an otherwise shared widget. Bag totals are derived from destination-visible
canonical items; do not republish selected-reader private item weights through a
shared summary. Document-link visibility intersects the file and target audiences.
