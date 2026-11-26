# Install: Unraid

Install YOUYA on Unraid via Community Applications or a direct template import.

## Prerequisite

Docker must be enabled in Unraid (**Settings → Docker → Enable Docker: Yes**).

## Install via Community Applications

1. Open the **Apps** tab in Unraid.
2. Search for **YOUYA**.
3. Click **Install** on the YOUYA result.

If the app does not appear, you can install directly from the template URL. In **Docker → Add Container**, paste the template URL:

```
https://raw.githubusercontent.com/liketrek/TREK/main/unraid-template.xml
```

## Template Fields

The Unraid template exposes the following fields in the container UI:

### Ports & Paths

| Field | Container path | Default host value |
|---|---|---|
| Web UI Port | `3000/tcp` | `3000` |
| Data | `/app/data` | `/mnt/user/appdata/trek/data` |
| Uploads | `/app/uploads` | `/mnt/user/appdata/trek/uploads` |

### Core Variables (always visible)

| Variable | Default | Notes |
|---|---|---|
| `ENCRYPTION_KEY` | *(empty)* | Set on first install. Generate with `openssl rand -hex 32` in the Unraid terminal. |
| `TZ` | `UTC` | Timezone for logs, reminders, and scheduled tasks (e.g. `Europe/Berlin`) |
| `ALLOWED_ORIGINS` | *(empty)* | Comma-separated origins for CORS and email notification links, e.g. `https://trek.example.com` |
| `APP_URL` | *(empty)* | Public base URL; required when OIDC is enabled (must match the redirect URI registered with your IdP) |
| `ADMIN_EMAIL` | `admin@trek.local` | Email for the first admin account (first-boot only; no effect once any user exists). Pre-filled by the template — must be set together with `ADMIN_PASSWORD`, otherwise both are ignored. |
| `ADMIN_PASSWORD` | *(empty)* | Password for the first admin account (first-boot only). Must be set together with `ADMIN_EMAIL`. If either is omitted, YOUYA creates the account with email `admin@trek.local` and a random password printed to the container log. |

### Advanced Variables

Additional variables (`PORT`, `NODE_ENV`, `LOG_LEVEL`, `TREK_WIKI_DIR`, `DEFAULT_LANGUAGE`, `FORCE_HTTPS`, `HSTS_INCLUDE_SUBDOMAINS`, `TRUST_PROXY`, `COOKIE_SECURE`, `ALLOW_INTERNAL_NETWORK`, `SESSION_DURATION`, `SESSION_DURATION_REMEMBER`, the OIDC variables apart from `OIDC_USERNAME_CLAIM`, `MCP_RATE_LIMIT`, `MCP_MAX_SESSION_PER_USER`, `DEMO_MODE`, `UNSPLASH_ACCESS_KEY`, `VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY`, `VAPID_SUBJECT`) are available under **Advanced View** in the template editor.

Any other variable from [Environment-Variables](Environment-Variables), such as `OIDC_USERNAME_CLAIM`, `ALLOW_LINK_LOCAL_IPS`, `FILE_UPLOAD_LIMIT_MB`, `PLACES_API_KEY`, the `SMTP_*` settings, the `AMAP_*` keys or `HTTP_PROXY`, is added as a new variable in the template editor, with its name as the key.

## Setting the Encryption Key

Generate a key in the Unraid terminal (**Tools → Terminal**):

```bash
openssl rand -hex 32
```

Copy the output into the `ENCRYPTION_KEY` field before starting the container for the first time. If you skip this, YOUYA auto-generates a key and saves it to `data/.encryption_key` — your data is still protected, but you should record that file in your backups.

## After Install

Once the container starts, open your browser at:

```
http://<unraid-ip>:<port>
```

On first boot, YOUYA automatically creates an admin account. The credentials are printed to the container log — check **Docker → trek → Log** in the Unraid UI. If you set both `ADMIN_EMAIL` and `ADMIN_PASSWORD`, those values are used; otherwise the email is `admin@trek.local` and a random password is generated.

## Updating

Click the YOUYA container in the **Docker** tab and select **Update**. Before the new version migrates the database, YOUYA copies it to `pre-migrate-<schema>-<time>.db` in the `data` folder (`/mnt/user/appdata/trek/data` by default), so you can go back to the previous image if needed. See [Updating](Updating#database-migrations).

## Next Steps

- [Environment-Variables](Environment-Variables) — complete variable reference
- [Updating](Updating) — how to pull a new image on Unraid
