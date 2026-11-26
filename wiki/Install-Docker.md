# Install: Docker

Single-container Docker run — suitable for testing or simple personal installs.

## Run Command

```bash
docker run -d \
  --name trek \
  -p 3000:3000 \
  -v ./data:/app/data \
  -v ./uploads:/app/uploads \
  -e ENCRYPTION_KEY=<your-32-byte-hex-key> \
  --restart unless-stopped \
  mauriceboe/trek:latest
```

`ENCRYPTION_KEY` is strongly recommended but not strictly required. If omitted, a key is auto-generated on first start and persisted to `data/.encryption_key`. Setting it explicitly means you can recreate the container from scratch (e.g. on a new host) without losing access to stored encrypted data (API keys, SMTP credentials, OIDC secrets, MFA secrets).

Generate an encryption key with:

```bash
openssl rand -hex 32
```

### Common optional variables

Pass additional `-e` flags for timezone and CORS/email link support:

```bash
  -e TZ=Europe/Berlin \
  -e ALLOWED_ORIGINS=https://trek.example.com \
```

See [Environment-Variables](Environment-Variables) for the full list.

## Image Tags

| Tag | Example                  | Behavior |
|---|--------------------------|---|
| `latest` | `mauriceboe/trek:latest` | Always the newest release across all major versions |
| Major version | `mauriceboe/trek:5`      | Latest release pinned to that major version |
| Minor version | `mauriceboe/trek:5.0`    | Latest patch of that minor version; never moves to the next minor. Published from 5.0.0 on: 4.x releases have no minor tag, so pin those by major or full version |
| Full version | `mauriceboe/trek:5.0.0`  | Exact release; never changes |
| `latest-pre` | `mauriceboe/trek:latest-pre` | Test build of the next version; not for production |

Replace `mauriceboe/trek:latest` in the run command with your chosen tag to pin to a major version, a minor version or an exact release. See [Updating](Updating#image-tags) for how the tags behave.

Every image carries the standard `org.opencontainers.image.*` labels (title, version, source, documentation, licence), so an update tool such as Renovate links an image update to its release notes. `docker inspect mauriceboe/trek:latest --format '{{json .Config.Labels}}'` shows them.

## First Start

On the very first start with an empty database YOUYA creates an admin account. Without `ADMIN_EMAIL` and `ADMIN_PASSWORD` (both are needed, and they only apply on that first start) it uses `admin@trek.local` with a random password that is printed to the container log, so run `docker logs trek` and sign in with it. See [Quick-Start](Quick-Start).

When you start a newer image, YOUYA first copies the database to `data/pre-migrate-<schema>-<time>.db` before it applies any migration, so you can go back to the previous image if needed. See [Updating](Updating).

The in-app Help pages come from the image itself (`/app/wiki`), so they always match the version you run. You do not need to set `TREK_WIKI_DIR`.

## Volume Reference

| Volume | Container path | What lives there |
|---|---|---|
| `./data` | `/app/data` | `travel.db` (SQLite database), `logs/trek.log`, `.jwt_secret`, `.encryption_key` |
| `./uploads` | `/app/uploads` | Uploaded files (photos, documents, covers, avatars) |

Both volumes must survive container replacement, they are your persistent state. Never remove them before pulling a new image. Installed plugins also live under `data` by default (`TREK_PLUGINS_DIR` moves them), so they are covered as long as `data` persists.

You can optionally mount a `storage-config.json` read-only at `/app/data/storage-config.json` to set up file storage once on the first start. See [Admin-Storage](Admin-Storage).

### Named Volumes

The run command above uses bind mounts (`./data`, `./uploads`). You can use Docker named volumes instead, which are fully managed by Docker and not tied to a host path:

```bash
docker run -d \
  --name trek \
  -p 3000:3000 \
  -v trek_data:/app/data \
  -v trek_uploads:/app/uploads \
  -e ENCRYPTION_KEY=<your-32-byte-hex-key> \
  --restart unless-stopped \
  mauriceboe/trek:latest
```

Docker creates `trek_data` and `trek_uploads` automatically on first run. Named volumes are easier to manage with `docker volume` commands and work better in some NAS or container-management environments.

## Health Check

The container exposes a health endpoint at:

```
http://localhost:3000/api/health
```

Docker polls it automatically (interval: 30 s, timeout: 5 s, retries: 3, start period: 15 s). You can check it manually:

```bash
curl -s http://localhost:3000/api/health
```

## Verify the Container Is Running

```bash
docker ps --filter name=trek
docker logs trek
```

## Limitations of `docker run`

A bare `docker run` command has no built-in secret management and is harder to reproduce after a system reboot. It also lacks the hardening of the compose file (`read_only`, `cap_drop`, `cap_add`, `no-new-privileges`, `tmpfs`) and does not rotate container logs, which the compose file limits to three files of 10 MB. For production, see [Install-Docker-Compose](Install-Docker-Compose), which also makes it easy to manage environment variables through a `.env` file.

## Next Steps

- [Reverse-Proxy](Reverse-Proxy) — HTTPS is required for PWA install and the `trek_session` cookie `secure` flag
- [Install-Docker-Compose](Install-Docker-Compose) — recommended for production
- [Environment-Variables](Environment-Variables) — full list of configurable variables
- [Updating](Updating) — how to pull a new image without losing data
