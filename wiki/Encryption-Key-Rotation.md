# Encryption Key Rotation

## What the encryption key protects

TREK encrypts sensitive settings at rest using AES-256-GCM. The following values are stored encrypted in the database:

- Google Maps API key (instance-wide, in `app_settings`; the per-user column is still read as a fallback)
- Unsplash access key (instance-wide, in `app_settings`; the per-user column is still read as a fallback)
- Mapbox access token (per user)
- OpenWeather API key (per user)
- Immich API key (per user)
- AirTrail API key (per user)
- Synology Photos password, session ID, and device ID (per user)
- Per-user webhook URL, ntfy notification token, and LLM provider API key (in `settings` table)
- OIDC client secret (global, in `app_settings`)
- SMTP password (global, in `app_settings`)
- Admin webhook URL and admin ntfy token (global, in `app_settings`)
- MFA (TOTP) secrets for all users
- Photo passphrases for Synology shared-link photos (in `trek_photos`)
- Passphrases for shared trip album links (in `trip_album_links`)
- S3 storage backend secret access keys (in `app_settings['storage.backends']`; see [Admin-Storage](Admin-Storage))
- Plugin OAuth access and refresh tokens, plus every plugin settings field the plugin's manifest marks `secret` (instance scope in `plugins.config`, user scope in `plugin_user_config.config`)

The encryption derives a key from `ENCRYPTION_KEY` using SHA-256 (with a domain suffix per secret type), so the raw `ENCRYPTION_KEY` value is never stored in the database.

## Key resolution order

On startup, TREK resolves the encryption key in this order:

1. **`ENCRYPTION_KEY` environment variable** — explicit, always takes priority. When set, the value is also written to `./data/.encryption_key` so it survives container restarts if the env var is later removed.
2. **`./data/.encryption_key` file** — present on any install that has started at least once.
3. **`./data/.jwt_secret` file** — one-time fallback for older installs that pre-date the dedicated encryption key. The value is immediately persisted to `./data/.encryption_key` so future JWT rotations cannot break decryption.
4. **Auto-generated** — fresh install with none of the above. A random 32-byte hex key is generated and written to `./data/.encryption_key`.

## What happens if the key is lost

All encrypted settings (API keys, SMTP password, OIDC secret, MFA secrets, notification tokens, etc.) become unreadable — TREK cannot decrypt them. They must be re-entered manually after the key is restored or replaced. Unencrypted data (trips, places, users, etc.) is unaffected.

## Backing up the key

Unless you set `ENCRYPTION_KEY` in the environment, your backup ZIP **does** include the encryption key: `./data/.encryption_key` is bundled into every archive, manual and automatic, as a root-level `.encryption_key` entry, so a restore onto a different install can still decrypt the stored secrets. That makes the ZIP exactly as sensitive as the key itself — store and transfer it accordingly.

On installs that supply the key through the environment the file is not the source of truth, so no backup carries it. Keep it somewhere separate — for example, in a password manager or a secrets manager. See [Backups](Backups).

To find your current key: check the `ENCRYPTION_KEY` environment variable or read `./data/.encryption_key`.

## Rotating the key

Use `scripts/migrate-encryption.ts` to re-encrypt all stored secrets without downtime or manual re-entry.

**Docker:**

```bash
docker exec -it -w /app/server trek node --import tsx scripts/migrate-encryption.ts
```

**Host (run from the `server/` directory):**

```bash
node --import tsx scripts/migrate-encryption.ts
```

The script:

1. Prompts for the old and new encryption keys interactively (keys are never echoed to the terminal or written to shell history).
2. Asks for confirmation before making any changes.
3. Creates a timestamped backup of the database (e.g. `travel.db.backup-1713484800000`) before modifying anything.
4. Re-encrypts all stored secrets across all tables:
   - `app_settings`: `oidc_client_secret`, `smtp_pass`, `admin_webhook_url`, `admin_ntfy_token`, `maps_api_key`, `unsplash_api_key`
   - `app_settings['storage.backends']`: the `secretAccessKey` of every S3 storage backend
   - `users` (per user): `maps_api_key`, `unsplash_api_key`, `openweather_api_key`, `immich_api_key`, `synology_password`, `synology_sid`, `synology_did`, `airtrail_api_key`, `mfa_secret`
   - `settings` (per user): `webhook_url`, `ntfy_token`, `mapbox_access_token`, `llm_api_key`
   - `plugin_oauth_tokens`: `access_token`, `refresh_token` (per plugin and user)
   - `plugins.config` and `plugin_user_config.config`: every settings field a plugin's manifest marks `secret`, resolved per plugin and scope from `plugin_settings_fields`
   - `trip_album_links`: `passphrase`
   - `trek_photos`: `passphrase`
5. Reports counts of migrated, already-migrated, skipped (empty), and errored values.

After a successful migration:

1. Update `ENCRYPTION_KEY` in your environment to the new value.
2. Restart TREK.

If any secrets could not be migrated, the script exits with a non-zero status and the original database backup is retained.

## Upgrading from very old versions

Old installs may have used `./data/.jwt_secret` as the encryption source (before a dedicated `ENCRYPTION_KEY` was introduced). The key resolution chain above handles this automatically on startup — the JWT secret is read, immediately written to `./data/.encryption_key`, and JWT rotation is then safe without breaking decryption.

## See also

- [Backups](Backups)
- [Security-Hardening](Security-Hardening)
- [Environment-Variables](Environment-Variables)
- [User-Settings](User-Settings)
