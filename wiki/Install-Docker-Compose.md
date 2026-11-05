# Install: Docker Compose

Production-ready setup using Docker Compose with security hardening enabled.

## Compose File

See https://github.com/liketrek/TREK/blob/main/docker-compose.yml

## Security Hardening Explained

The compose file ships with several hardening options enabled by default:

| Setting | What it does |
|---|---|
| `read_only: true` | Mounts the container filesystem read-only; only the two mounted volumes (`/app/data`, `/app/uploads`) and `/tmp` are writable |
| `security_opt: no-new-privileges:true` | Prevents the process from gaining additional Linux privileges via setuid/setgid executables |
| `cap_drop: [ALL]` | Drops all Linux capabilities from the container |
| `cap_add: [CHOWN, SETUID, SETGID, KILL]` | Adds back only what the container needs: the first three let the entrypoint drop privileges to the `node` user, `KILL` lets `dumb-init` pass the stop signal on to it, so `docker stop` shuts TREK down cleanly instead of killing it |
| `tmpfs: /tmp:noexec,nosuid,size=128m` | Mounts a 128 MB in-memory `/tmp`; required because the container root is read-only |

> **Note (Docker from snap):** If you installed Docker via `snap` (config under `/var/snap/docker/...`), `no-new-privileges:true` will prevent the container from starting with `exec /usr/bin/dumb-init: operation not permitted`. This is a [snap/AppArmor limitation](https://bugs.launchpad.net/snapd/+bug/1908448), not a TREK issue — install Docker from the [official apt repository](https://docs.docker.com/engine/install/ubuntu/) instead, or remove `no-new-privileges`. See [Troubleshooting](Troubleshooting#container-wont-start-exec-usrbindumb-init-operation-not-permitted).

## Volumes

| Host path | Container path | Contents |
|---|---|---|
| `./data` | `/app/data` | SQLite database, logs, `.jwt_secret`, `.encryption_key` |
| `./uploads` | `/app/uploads` | Uploaded files (photos, documents, covers, avatars) |

### Named Volumes

The compose file above uses bind mounts (`./data`, `./uploads`). You can switch to Docker named volumes, which are fully managed by Docker and not tied to a specific host path. See the [Docker Compose volumes reference](https://docs.docker.com/reference/compose-file/volumes/) for all options.

```yaml
services:
  app:
    # ... (rest of service config unchanged)
    volumes:
      - trek_data:/app/data
      - trek_uploads:/app/uploads

volumes:
  trek_data:
  trek_uploads:
```

Docker creates the volumes automatically on first `docker compose up`. Use `docker volume ls` and `docker volume inspect` to manage them.

### Optional storage seed

A commented line mounts a storage-config.json file from the compose folder read-only into the data directory. Uncomment it to provision file storage once on the first start. See [Admin-Storage](Admin-Storage).

## Healthcheck and Logs

The compose file includes a healthcheck that polls `/api/health` every 30 seconds and follows a changed `PORT`, so `docker ps` shows `healthy` once TREK is up. It also limits the container log to three files of 10 MB each, because Docker keeps every line forever by default.

## Environment Variables

The compose file has no `env_file:` key, so a `.env` placed alongside `docker-compose.yml` is used only for `${VAR}` interpolation — a value reaches the container only if a line in the `environment:` block references it. Four entries are wired that way:

```bash
# .env
ENCRYPTION_KEY=<output of: openssl rand -hex 32>
TZ=Europe/Berlin
LOG_LEVEL=info
ALLOWED_ORIGINS=https://trek.example.com
```

The commented `HTTP_PROXY` / `HTTPS_PROXY` / `NO_PROXY` lines are interpolated as well, so uncommenting them is enough to pick their values up from `.env`.

Every other variable — `APP_URL`, the OIDC block, `FORCE_HTTPS`, `TRUST_PROXY`, `ADMIN_EMAIL`/`ADMIN_PASSWORD`, the MCP limits — ships as a commented literal. Uncomment the line in `docker-compose.yml` and put the value there; setting it in `.env` alone has no effect.

A few variables are not in the compose file at all, among them `FILE_UPLOAD_LIMIT_MB` (the upload limit for files, 50 MB by default) and `RESTORE_FROM_BACKUP` (a backup ZIP to restore on the very first start, see [Backups](Backups#restoring-on-a-new-install-before-setup)). Add a line for them to the `environment:` block yourself.

Some optional variables ship as commented lines, ready to uncomment: `LLM_TIMEOUT_MS` and `LLM_MAX_OUTPUT_TOKENS` for AI parsing, the `VAPID_*` keys for Web Push, `TREK_PLACES_*` and `PLACES_API_KEY` for place search, `AMAP_*`, `UNSPLASH_ACCESS_KEY`, `GOOGLE_LIST_DATA_BASE` and `TREK_WIKI_DIR`. Rootless Podman users will also find `HSTS_INCLUDE_SUBDOMAINS`, `COOKIE_SECURE` and `ALLOW_LINK_LOCAL_IPS` there.

`APP_URL` is usually not needed. TREK resolves its public base URL as `APP_URL` → first `ALLOWED_ORIGINS` entry → `http://localhost:<PORT>`, so the `ALLOWED_ORIGINS` value above already gives OIDC redirect URIs, passkey origin checks and the links in email notifications the correct origin. Uncomment `APP_URL` only when the public base URL has to differ from the first allowed origin.

For a full description of every variable, see [Environment-Variables](Environment-Variables).

## Image Tags

Five tags are available:

| Tag | Example                  | Behavior |
|---|--------------------------|---|
| `latest` | `mauriceboe/trek:latest` | Always the newest release across all major versions |
| Major version | `mauriceboe/trek:5`      | Latest release pinned to that major version |
| Minor version | `mauriceboe/trek:5.0`    | Latest patch of that minor version; never moves to the next minor. Published from 5.0.0 on |
| Full version | `mauriceboe/trek:5.0.0`  | Exact release; never changes |
| `latest-pre` | `mauriceboe/trek:latest-pre` | Test build of the next version; not for production |

The compose file above uses `latest`. To pin, change the `image:` line:

```yaml
image: mauriceboe/trek:5        # track major version 5
image: mauriceboe/trek:5.0      # stay on 5.0.x patches
image: mauriceboe/trek:5.0.0    # pin to exact release
```

## Start TREK

```bash
docker compose up -d
```

Check the logs:

```bash
docker compose logs -f
```

## HTTPS and Reverse Proxy

This compose file is designed for deployments where a reverse proxy (nginx, Caddy, Traefik) terminates TLS in front of TREK. To enable HTTPS redirects and secure cookies, uncomment `FORCE_HTTPS=true` and `TRUST_PROXY=1`.

See [Reverse-Proxy](Reverse-Proxy) for complete proxy configuration examples.

## Next Steps

- [Environment-Variables](Environment-Variables) — full variable reference
- [Reverse-Proxy](Reverse-Proxy) — HTTPS configuration
- [Updating](Updating) — how to pull a new image
