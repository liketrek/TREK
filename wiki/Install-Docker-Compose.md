# Install: Docker Compose

Production-ready setup using Docker Compose with security hardening enabled.

## Compose File

See https://github.com/mauriceboe/TREK/blob/main/docker-compose.yml

## Security Hardening Explained

The compose file ships with several hardening options enabled by default:

| Setting | What it does |
|---|---|
| `read_only: true` | Mounts the container filesystem read-only; only the two named volumes and `/tmp` are writable |
| `security_opt: no-new-privileges:true` | Prevents the process from gaining additional Linux privileges via setuid/setgid executables |
| `cap_drop: [ALL]` | Drops all Linux capabilities from the container |
| `cap_add: [CHOWN, SETUID, SETGID]` | Adds back only the capabilities needed for the entrypoint to drop privileges to the `node` user |
| `tmpfs: /tmp:noexec,nosuid,size=64m` | Mounts a 64 MB in-memory `/tmp`; required because the container root is read-only |

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

## Environment Variables

The compose file reads variables from a `.env` file placed alongside `docker-compose.yml`. At minimum, set:

```bash
# .env
ENCRYPTION_KEY=<output of: openssl rand -hex 32>
TZ=Europe/Berlin
ALLOWED_ORIGINS=https://trek.example.com
APP_URL=https://trek.example.com
```

Uncomment and fill in the OIDC, initial setup, or MCP variables as needed. For a full description of every variable, see [Environment-Variables](Environment-Variables).

## Image Tags

Three tag strategies are available:

| Tag | Example | Behavior |
|---|---|---|
| `latest` | `mauriceboe/trek:latest` | Always the newest release across all major versions |
| Major version | `mauriceboe/trek:3` | Latest release pinned to that major version |
| Full version | `mauriceboe/trek:3.0.15` | Exact release; never changes |

The compose file above uses `latest`. To pin, change the `image:` line:

```yaml
image: mauriceboe/trek:3        # track major version 3
image: mauriceboe/trek:3.0.15   # pin to exact release
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
