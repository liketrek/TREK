# Admin: Storage

The **Storage** tab (Admin Panel → Storage) controls where TREK stores each
kind of content: which storage backends exist, which content category writes
to which backend, and whether writes are replicated to additional backends.
On managed/hosted instances this tab is hidden — storage is the operator's
concern.

## Backends

A backend is a named place bytes can live. Two exist out of the box:

| Backend | What it is |
|---------|------------|
| `uploads-local` | The local `uploads/` directory (the `/app/uploads` volume in Docker) |
| `backups-local` | The local `data/backups` directory |

You can **edit** a built-in to relocate its root directory, and **add**
backends of type:

- **Local** — a directory on a disk or mount reachable by the server.
- **S3** — any S3-compatible service (AWS S3, Cloudflare R2, Backblaze B2,
  Garage, MinIO/AIStor). Endpoint URL, bucket, credentials, and optionally
  region, key prefix, retries, and timeout. For self-hosted endpoints, use an
  IP address or `localhost` in the URL unless your server is configured for
  virtual-hosted bucket addressing.

If `TREK_PLACE_PHOTO_DIR` is set, a read-only `place-photos-local` backend
appears too — it is defined by that environment variable, not by this panel.

### Replication (Mirror targets)

Edit any backend and tick one or more **Mirror targets**: every write to that
backend is then also copied to each selected target. Removing all targets
turns replication off again.

- A backend can serve as a **mirror target or as a category target, not
  both** — only backends no category is stored on are offered in the list, and
  saving a configuration that mixes the two is refused. A sync makes a target
  match its backend (see below), so anything else stored there would be
  deleted.
- Writes go to the backend itself first (it stays the source of truth), then
  to each target in order. A slow or unreachable target slows every upload of
  every category on that backend — ideal for backups, worth weighing before
  replicating hot categories like trip documents.
- Replica failures **never fail the original request**. They are recorded and
  shown in the **Health** strip at the top of the tab, with the backend, the
  object, the operation, and how long ago it happened. An empty strip means
  every replicated write landed. Replica failures also notify admins — in-app
  and over the configured webhook/ntfy/email channels (first failure
  immediately, then at most one summary per backend per hour). Preferences
  live in the admin Notifications tab.
- Replication starts with the next write. To copy objects that existed before
  you added a target, press **Sync now** on the backend's row — one sync runs
  at a time, with progress and a cancel button; objects already present with
  matching sizes are skipped, and per-object failures land in the Health
  strip without stopping the run. A sync makes the target **match** the
  backend, not just catch up: it also deletes target objects that no longer
  exist on the backend — it's not a trash can, so run it only when you want
  the target pruned to match, and stray deletions land in the Health strip
  like any other replica failure.

### Test

Every backend row has a **Test** button: the server writes, checks, and
deletes a small probe object (`trek-probe/…`) on the backend — for a
replicated backend, on the backend itself and each target individually — and
reports per-target results. "Connection OK" means credentials, bucket, and
reachability all check out. Targets must be **saved** before Test can probe
them; a just-added, unsaved backend used as a target reports an error until
you save.

## Categories

Every kind of content TREK stores belongs to one of eight categories, each
assigned to exactly one backend:

| Category | Id | What it stores |
|----------|----|----------------|
| Trip documents | `files` | File attachments uploaded to trips — tickets, PDFs, booking confirmations, and files shared in trip chat |
| Journey photos | `journey` | Photos and thumbnails attached to journey entries |
| Cover images | `covers` | Trip and collection cover images, including covers fetched from Unsplash |
| Profile pictures | `avatars` | User account profile pictures |
| Place images | `places` | Images attached to places and collection places — uploaded or imported |
| Google photo cache | `photos-google` | Cached copies of Google Places photos — re-fetchable, safe to lose |
| TREK photo cache | `photos-trek` | Cached photos from the TREK photo service used by Memories — re-fetchable, safe to lose |
| Backups | `backups` | Server backup archives created by the Backup panel or schedule |

Reassigning a category changes where **new** objects go. If the category
already holds objects, the panel asks first: **Move existing objects** copies
everything to the new backend, switches the category, then sweeps any writes
that raced the copy; **Just route new writes** keeps the previous behavior —
new objects go to the new backend, existing ones stay put and keep being
served from wherever they already are. Replicating the Google photo cache or
Place images is flagged as not recommended — both hold content that is
re-fetchable or provider-derived.

The legacy `/uploads/photos` directory written by older TREK versions is not
a category: its files are still served and included in backups, but nothing
writes there anymore and it cannot be reassigned.

### Moving a category's objects

A category migration shares its one-at-a-time slot with mirror syncs (see
*Replication* above) — starting a move while a sync (or another move) is
running is refused, and vice versa. Progress (done/total, copied/skipped/
failed) shows inline with a cancel button.

Cancelling before the category switches is completely safe: nothing has
changed yet, the copy just stops. A failed copy behaves the same way — the
category is never switched if any object failed to copy. Once the switch has
happened, the delta sweep (catching writes that landed on the old backend
while the copy was running) always runs to completion, even if you cancel.

The old objects are **not** deleted when a move finishes — that's what the
reclaimable line means (`N objects (size) remain on <backend> — reclaim
manually`). It's left behind on purpose so you can confirm the new backend
looks right before removing it yourself.

## Usage

The Backends section shows per-backend and per-category object counts and
sizes, scanned nightly (04:15 server time) and on demand via **Refresh**. The
stamp shows when the numbers were computed — reassigning categories does not
retroactively move them until the next scan. The uploads backend's total
includes the legacy photo library.

## Secrets and encryption

Backend credentials (the S3 secret access key) are stored encrypted. Setting
the `ENCRYPTION_KEY` environment variable explicitly is recommended — without
it the implicit key persisted in the data directory is used, which works but
rides inside backup archives (someone holding a backup can decrypt the
secrets it contains). If you later move from the implicit key to an explicit
one, follow [[Encryption Key Rotation|Encryption-Key-Rotation]] — setting a
new key directly would orphan already-stored secrets. Saved secrets display
as a masked placeholder; leaving the mask untouched when editing keeps the
stored value.

## Provisioning at first boot (seed file)

For scripted deployments, place a `storage-config.json` in the data directory
(in Docker: mount it at `/app/data/storage-config.json`). It is imported
exactly once — on the first boot that has no stored storage configuration —
then ignored (a log line says so). An invalid file aborts boot with the exact
validation error.

```jsonc
// storage-config.json - secrets may be plaintext (encrypted on import)
// or already-encrypted enc:v1: values.
{
  "backends": [
    { "name": "off-site", "type": "s3", "options": {
      "endpoint": "https://s3.example.com", "bucket": "trek",
      "accessKeyId": "...", "secretAccessKey": "..." } },
    { "name": "backups-mirror", "type": "mirror", "options": {
      "primary": "backups-local", "replicas": ["off-site"] } }
  ],
  "categories": { "backups": "backups-mirror" }
}
```

The panel presents this exact setup as **Mirror targets** on `backups-local`.

```yaml
# docker-compose: add under the trek service's volumes
      - ./storage-config.json:/app/data/storage-config.json:ro
```

To reset storage configuration (or re-import a seed file): stop the server,
`sqlite3 data/travel.db "DELETE FROM app_settings WHERE key LIKE 'storage.%';"`,
start it again — it boots on the built-in defaults, or re-imports the seed
file if present.

**Restore chicken-and-egg:** backups include the storage configuration. If
your only backup lives on S3 and the credentials are inside it: start a fresh
instance, enter the S3 credentials here (or mount a seed file), then restore
from the Backup panel.

## Related pages

- [[Backups|Backups]] — what a backup contains, restore procedure
- [[Environment Variables|Environment-Variables]]
- [[Encryption Key Rotation|Encryption-Key-Rotation]]
- [[Admin Panel Overview|Admin-Panel-Overview]]
- [[Troubleshooting|Troubleshooting]]
