# Backups

TREK stores all data in a single SQLite database (`travel.db`) plus an `uploads/` directory of attachments, cover photos, and avatars. The Backup panel lets you create, download, restore, and schedule backups of both.

## Where to find it

**Admin Panel → Backup** tab.

![Backup tab](assets/Backup.png)

## What a backup contains

A backup is a ZIP archive with these entries:

| Entry | Contents |
|---|---|
| `travel.db` | The full SQLite database |
| `uploads/` | All uploaded attachments, covers, and avatars |
| `plugins-data/` | Each installed plugin's own database + files (present only if plugins are installed) |
| `plugins-code/` | The installed plugin code, so a restore is self-contained (dev-linked plugins are skipped) |

**The at-rest encryption key is included** whenever `ENCRYPTION_KEY` is *not* set as an environment variable — which is
the default for most self-hosted installs. TREK bundles `data/.encryption_key` into the archive so the backup is
self-contained: the database stores SMTP, OIDC, MFA and API-key secrets encrypted with that key, and a restore onto a
fresh install could not decrypt them otherwise.

> **This makes the backup ZIP as sensitive as the key itself.** Anyone holding the archive holds everything in it in
> plaintext. Treat it like a password vault export: transfer it over a channel you trust, and think twice before handing
> it to third-party storage. If you set `ENCRYPTION_KEY` as an environment variable, the key is *not* bundled — the env
> var is then the source of truth, and you must store it yourself (a password manager) or the backup becomes
> undecryptable. See [Encryption-Key-Rotation](Encryption-Key-Rotation).

## Manual backup

Click **Create Backup** in the Backup tab. The server creates the ZIP and makes it available for download. Up to 3 manual backups can be created per hour per IP address (rate-limit window: 1 hour).

You can also download or delete any existing backup from the list.

## Restoring a backup

You can restore from:

- **A stored backup** — click **Restore** next to any backup in the list.
- **An uploaded ZIP** — click **Upload & Restore** and select a backup file from your computer (maximum upload size: 500 MB by default, configurable with the `BACKUP_UPLOAD_LIMIT_MB` environment variable — see [Environment-Variables](Environment-Variables)).

Before restoring, TREK runs integrity checks on the uploaded database:

1. **SQLite `PRAGMA integrity_check`** — verifies the database file is not corrupt.
2. **Required tables present** — confirms the file contains `users`, `trips`, `trip_members`, `places`, and `days`. Files missing any of these are rejected as not being a valid TREK backup.

> **Warning:** Restoring replaces all current data. Back up your current state first if you want to keep it.

> **Plugins & restart:** `travel.db` and `uploads/` are swapped in immediately. Plugin data and code are **staged** and applied on the **next server restart** — the running plugins hold their databases open, so they can't be swapped live (the same reason the bundled encryption key only takes effect on restart). Restart the server after restoring an instance that uses plugins.

## Auto-backup

Enable scheduled backups in the **Auto-Backup** section of the Backup tab.

**Interval** options:

- Hourly
- Daily
- Weekly
- Monthly

**Retention** (`Keep last … days`) — enter a number of days. Backups older than that many days are pruned after each auto-backup run. Set to **0** to keep all backups indefinitely (no pruning).

**Schedule** options (depend on interval):

- **Hour** — time of day for daily, weekly, and monthly backups (0–23).
- **Day of week** — Sunday through Saturday (for weekly backups).
- **Day of month** — 1–28 (for monthly backups). Day 29–31 is excluded to avoid months with fewer days.

Auto-backup files are named `auto-backup-<timestamp>.zip` (manual backups use `backup-<timestamp>.zip`).

After each auto-backup run, **all** backup files (manual and auto) older than `keep_days` are pruned. Set `keep_days` to `0` to disable pruning entirely.

## External backup target

A backup that only ever lives on the same volume as the data it protects is one disk failure away from being useless.
The **External backup target** section of the Backup tab mirrors every backup — manual *and* automatic — to a second
location. Pick a **storage backend**:

| Backend | What it does |
|---|---|
| **Off** | Backups stay in `data/backups` only. The default. |
| **Directory** | Copies the archive to a second directory. On Docker that is a path inside the container, which you map to wherever the copy should really live. |
| **S3-compatible** | Any S3 API: AWS S3, MinIO, Garage, Supabase Storage, Backblaze B2, Wasabi… |


### Setting it up

1. Pick the **storage backend**. For **Directory**, enter the target directory and you are done. For **S3**, enter the
   **endpoint URL**, **bucket**, **region** and optionally a **path prefix** (e.g. `trek/backups/`) to namespace within
   a shared bucket — leave the endpoint empty for real AWS S3.
2. Enter the **access key ID** and **secret access key**. The secret is encrypted at rest with the same
   `ENCRYPTION_KEY`-derived key as every other stored credential and is never sent back to the browser — it shows as
   `••••••••` and saving the form unchanged keeps it.
3. Turn on **path-style addressing** for MinIO, Garage, Supabase Storage and most self-hosted gateways.
4. Press **Test connection**, then **Save target**.

**Endpoints with a path work as-is.** Plenty of S3 services do not serve the API at the host root — Supabase Storage
uses `https://<project-ref>.storage.supabase.co/storage/v1/s3`, and any Ceph RGW, SeaweedFS, Zenko or MinIO sitting
behind a reverse proxy or Kubernetes ingress is typically mounted under a path such as `https://nas.example.com/s3`.
Paste the endpoint exactly as your provider gives it to you; TREK passes it to the S3 client unchanged instead of
reducing it to a bare origin.

### The backup list spans both locations

The backup list merges what is on disk with what is at the target. Each entry is
badged with where it lives — **S3** when both copies exist, **S3 only** when the
local file is gone. An S3-only archive is fully usable: **Restore** fetches it
back and runs the same integrity, zip-slip and zip-bomb checks a local restore
does, and **Delete** removes it from the bucket. Download is local-only, since it
streams the file from disk.

If the bucket is unreachable the list falls back to local entries and says so,
rather than hiding backups you still have.

### Uploading the backups you already have

Enabling the target only affects backups made from then on. **Upload all existing
backups** pushes everything already in `data/backups` to the target. Archives
already present are skipped rather than re-transferred, so re-running it after an
interrupted upload is cheap and safe.

### Deleting removes both copies

Deleting a backup in the admin panel removes the local file **and** the mirrored
copy. If the target refuses the delete, the UI says so instead of reporting plain
success — otherwise a deleted backup would quietly remain restorable, and keep
costing storage.

### Test connection checks writes, not just reachability

For S3 the button runs `HeadBucket`, then writes and deletes a small probe object. For a directory it creates the
directory, writes a probe file and removes it again. A key with read-only permissions — or a share mounted read-only —
therefore **fails** the test rather than passing it and then breaking every subsequent backup silently. If the probe
can be written but not removed, the test reports success with a warning: backups will work, pruning will not.

### Reaching a self-hosted bucket

The endpoint is checked against TREK's SSRF guard before any request.

- **Loopback is always blocked.** A MinIO or Garage container next to TREK must be addressed by its service name
  (`http://minio:9000`) or LAN address — never `http://localhost:9000`.
- **Private/LAN addresses need `ALLOW_INTERNAL_NETWORK=true`**, the same switch a self-hosted Ollama needs.
- **Plain `http://` requires turning off "Require HTTPS"**, which the UI warns about: backups contain your whole
  database and every upload.

### Configuring it through environment variables

Setting `BACKUP_TARGET_TYPE` (`none`, `local` or `s3`) puts the target under environment control — the accompanying
values take priority and the admin form becomes read-only, matching how `SMTP_PASS` overrides the stored SMTP password.
See [Environment-Variables](Environment-Variables) for the full list. Leave it unset to manage the target from the UI.

## Before updating TREK

Always create a manual backup before updating. See [Updating](Updating).

## Audit log

The following actions are recorded in the [Audit-Log](Audit-Log):

| Action key | When |
|---|---|
| `backup.create` | Manual backup created |
| `backup.restore` | Restore from stored backup |
| `backup.upload_restore` | Restore from uploaded ZIP |
| `backup.delete` | Backup deleted |
| `backup.auto_settings` | Auto-backup settings saved |
| `backup.target_settings` | External backup target saved (never records the secret key) |
| `backup.target_test` | External backup target connection tested |
| `backup.target_backfill` | "Upload all existing backups" run |
| `backup.target_deleted` | A backup was removed from the external target |
| `backup.restore_remote` | Restore from an archive held only at the external target |
| `backup.target_uploaded` | Backup mirrored to the external target |
| `backup.target_failed` | Mirroring a backup to the external target failed |

## When something goes wrong

The [Troubleshooting](Troubleshooting) page covers the failures this feature actually produces: TLS handshake errors from path-style addressing, a read-only key passing a naive check, an endpoint refused by the SSRF guard, a target directory inside TREK own data trees, and backups that stay local because no backend was selected.

## See also

- [Encryption-Key-Rotation](Encryption-Key-Rotation)
- [Admin-Panel-Overview](Admin-Panel-Overview)
- [Security-Hardening](Security-Hardening)
- [Updating](Updating)
