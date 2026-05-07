# Install: Unraid

Install TREK on Unraid via Community Applications or a direct template import.

<!-- TODO: screenshot: Unraid container template settings -->

## Prerequisite

Docker must be enabled in Unraid (**Settings → Docker → Enable Docker: Yes**).

## Install via Community Applications

1. Open the **Apps** tab in Unraid.
2. Search for **TREK**.
3. Click **Install** on the TREK result.

If the app does not appear, you can install directly from the template URL. In **Docker → Add Container**, paste the template URL:

```
https://raw.githubusercontent.com/mauriceboe/TREK/main/unraid-template.xml
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
| `ADMIN_EMAIL` | *(empty)* | Email for the first admin account (first-boot only; no effect once any user exists). Must be set together with `ADMIN_PASSWORD`. |
| `ADMIN_PASSWORD` | *(empty)* | Password for the first admin account (first-boot only). Must be set together with `ADMIN_EMAIL`. If either is omitted, TREK creates the account with email `admin@trek.local` and a random password printed to the container log. |

### Advanced Variables

Additional variables (`PORT`, `NODE_ENV`, `LOG_LEVEL`, `DEFAULT_LANGUAGE`, `FORCE_HTTPS`, `TRUST_PROXY`, `COOKIE_SECURE`, `ALLOW_INTERNAL_NETWORK`, all OIDC variables, `MCP_RATE_LIMIT`, `MCP_MAX_SESSION_PER_USER`, `DEMO_MODE`) are available under **Advanced View** in the template editor.

## Setting the Encryption Key

Generate a key in the Unraid terminal (**Tools → Terminal**):

```bash
openssl rand -hex 32
```

Copy the output into the `ENCRYPTION_KEY` field before starting the container for the first time. If you skip this, TREK auto-generates a key and saves it to `data/.encryption_key` — your data is still protected, but you should record that file in your backups.

## After Install

Once the container starts, open your browser at:

```
http://<unraid-ip>:<port>
```

On first boot, TREK automatically creates an admin account. The credentials are printed to the container log — check **Docker → trek → Log** in the Unraid UI. If you set both `ADMIN_EMAIL` and `ADMIN_PASSWORD`, those values are used; otherwise the email is `admin@trek.local` and a random password is generated.

## Next Steps

- [Environment-Variables](Environment-Variables) — complete variable reference
- [Updating](Updating) — how to pull a new image on Unraid
