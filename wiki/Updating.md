# Updating

How to update TREK to a newer version without losing data.

## Before You Update

Back up your data first. Go to Admin Panel → Backups and create a manual backup, or copy your `./data` and `./uploads` directories to a safe location. See [Backups](Backups) for details.

## Image Tags

| Tag | Example | Behavior |
|---|---|---|
| `latest` | `mauriceboe/trek:latest` | Always the newest release across all major versions |
| Major version | `mauriceboe/trek:4` | Latest release pinned to that major version |
| Full version | `mauriceboe/trek:4.0.0` | Exact release; never changes |

Use `latest` or a major-version tag if you want updates on each redeploy. Use a full version tag for explicit control — update by changing the tag, not by re-pulling.

## Docker Compose (Recommended)

**`latest` or major-version tag:**

```bash
docker compose pull && docker compose up -d
```

This pulls the newest matching image and recreates the container with your existing volumes. Your data is untouched.

**Pinned full-version tag:**

Edit `docker-compose.yml`, update the tag in the `image:` line (e.g. `4.0.0` → `4.0.1`), then redeploy:

```bash
docker compose up -d
```

## Docker Run

If you started TREK with `docker run`, pull the new image and replace the container:

```bash
docker pull mauriceboe/trek
docker rm -f trek
docker run -d --name trek -p 3000:3000 \
  -v ./data:/app/data \
  -v ./uploads:/app/uploads \
  -e ENCRYPTION_KEY=<your-key> \
  --restart unless-stopped \
  mauriceboe/trek
```

> **Tip:** Not sure which volume paths you used? Check before removing:
> ```bash
> docker inspect trek --format '{{json .Mounts}}'
> ```

## Helm (Kubernetes)

> **⚠️ Chart repository moved:** The Helm chart is no longer served at `https://mauriceboe.github.io/TREK` (the project moved from a personal repo to the `liketrek` organization). The canonical chart URL is now `https://chart.liketrek.com` — a custom domain (CNAME) for the GitHub Pages site at `https://liketrek.github.io/TREK`, so it stays stable even if the repository moves again. If your `trek` repo still points to an old URL, switch it before updating:
>
> ```bash
> helm repo remove trek
> helm repo add trek https://chart.liketrek.com
> ```
>
> You can check which URL you have configured with `helm repo list`. Existing releases are unaffected — only the repo URL changes.

To update to the newest chart release:

```bash
helm repo update
helm upgrade trek trek/trek
```

Your existing values and PVCs (data, uploads) are preserved. To pin an exact chart version instead, pass `--version <x.y.z>`.

See [Install-Helm](Install-Helm) for the full installation walkthrough and values reference.

## Database Migrations

TREK runs any pending database migrations automatically at startup. No manual migration steps are required after pulling a new image.

## After the Update

The first time a user opens TREK on the desktop after an update, a notice headed **Update installed** opens on top of the app: three cards with the headline features of that release, a note from the maintainer, a **Release notes** link to the full notes on GitHub, and links for supporting the project. Every user sees it once per version. Closing it keeps it closed on that version, and the next update brings it back, a patch release included. The phone does not show it.

The full notes for every version are also in the admin panel under the **GitHub** tab. See [Admin-GitHub-Releases](Admin-GitHub-Releases).

## Upgrading to 4.3.0

A few defaults change with 4.3.0. None of them needs a manual step, but they are worth knowing before you pull the image:

- **Place search asks a new service.** Suggestions, the full search, the category buttons, import geocoding, offline downloads and the Road trip search now ask the TREK Places API at `https://places.liketrek.com`, so your server makes outbound requests to that host. Set `TREK_PLACES_ENABLED=false` to keep searching the way it did before, or `TREK_PLACES_URL` to point at a copy you run yourself. [TREK-Places-API](TREK-Places-API) lists what is sent.
- **New variables.** `NOMINATIM_URL` points every geocoding call at a Nominatim of your own, `ALLOW_LINK_LOCAL_IPS` lets a rootless Podman container reach its host gateway, and `AMAP_API_KEY`, `AMAP_API_SECRET` and `AMAP_API_BASE` put Amap into place search for mainland China. All of them are optional. See [Environment-Variables](Environment-Variables).
- **`OVERPASS_TIMEOUT_MS` now defaults to `25000`** instead of `12000`. If you set a lower value by hand, remove it: the query gives Overpass 20 seconds of work, and a shorter timeout hangs up on answers that were still coming.
- **SSO sessions on an OIDC-only instance last 30 days.** The login page sends `remember=1` on that path, so the session gets the `SESSION_DURATION_REMEMBER` lifetime (default `30d`) instead of `SESSION_DURATION` (default `24h`). Lower `SESSION_DURATION_REMEMBER` if that is too long. With password login on, the SSO button follows the Remember-me switch instead. See [OIDC-SSO](OIDC-SSO).
- **Booked nights get a stop.** A migration puts every existing stay that has a place on its check-in day as a hotel stop, so the trips you already have show their hotels in the [Road-Trip](Road-Trip) view without anyone re-saving a booking. Under **Days** nothing changes: that stop stays hidden behind the badge the booking already shows. See [Accommodations](Accommodations).
- **Two things are on by default.** The **Links** tab in Collab, which an admin switches off under **Admin → Addons**, and the routing counters, daily totals of the route requests the planner makes that never leave the instance. An admin reads them at `/api/route-usage/summary`; an `app_settings` row named `route_usage_enabled` with the value `false` switches them off.

## Upgrading to 4.3.1

Two things change with 4.3.1. Neither needs a manual step on Docker, but they are worth knowing before you pull the image:

- **Booked nights lead their day.** A migration moves every booked night to the head of its check-in day, behind only a stop whose own time is at or before the check-in, and the stops without an hour follow it: a hotel booked for ten in the morning is reached at ten in the [Road-Trip](Road-Trip) view, not at a quarter past twelve behind a whole day of untimed stops. A night booked for the end of a driving day heads that day too when its stops carry no time of their own, so such a day now reads hotel first. A via point drawn on the road into that hotel from the stop that is now last is removed, because that leg no longer exists in the day, the same way a drag would remove it; the other vias follow their stops. Under **Days** nothing changes. To put a hotel back at the end, drag it down the day in the Road Trip rail, or give the first stop after it a start time at or before the check-in, which brings the untimed stops behind that one along; a time on the last stop alone leaves the hotel in the middle of the day. See [Accommodations](Accommodations#on-the-route).
- **Source installs need a build toolchain, or `--ignore-scripts`.** The server runs better-sqlite3 13, which ships its binaries inside the package, so nothing is compiled any more; the Docker image and the Helm chart are unaffected. On an install that runs `npm ci` itself, outside Docker, a lockfile-driven `npm ci` still runs node-gyp against those binaries and stops without Python 3 and a C++ toolchain (`build-essential` on Debian/Ubuntu, the Xcode Command Line Tools on macOS, the Visual Studio Build Tools on Windows; npm/cli#9837). Either keep those installed, as [Development-environment](Development-environment) lists them, or run `npm ci --ignore-scripts`, which is what the image does.

## Encryption Key Note

If you are upgrading from a version that predates the dedicated `ENCRYPTION_KEY` (i.e. you have no `ENCRYPTION_KEY` environment variable set), TREK automatically falls back to `./data/.jwt_secret` on startup and immediately promotes it to `./data/.encryption_key`. No manual steps are required — the transition is handled at first boot after the upgrade.

If you want to rotate to a new key at any point (not required for a normal update), see [Encryption-Key-Rotation](Encryption-Key-Rotation) for the full procedure.

## Proxmox VE (LXC)

If you installed TREK via the [Proxmox VE Community Scripts](https://community-scripts.org/scripts/trek), run the following command inside the **LXC container** and select **Update** when prompted:

```bash
bash -c "$(curl -fsSL https://raw.githubusercontent.com/community-scripts/ProxmoxVE/main/ct/trek.sh)"
```

> **Tip:** Always check the [community-scripts TREK page](https://community-scripts.org/scripts/trek) to confirm the latest command before running.

The script stops the service, backs up your data and uploads, applies the new release, restores the backup, and restarts. No manual steps required.

To verify the update completed and check for errors:

```bash
# Inside the container (pct enter <id> from the Proxmox shell)
journalctl -u trek -n 50
```

## Portainer

Open the **Stacks** list, click the TREK stack, then click **Redeploy**.

**`latest` or major-version tag** — enable the **Re-pull image and redeploy** switch before confirming. Portainer pulls the newest matching image and recreates the container.

![Re-pull image and redeploy switch ticked, with arrows pointing to the switch and the Update button](assets/portainer-force-pull.png)

**Pinned full-version tag** (e.g. `4.0.0`) — edit the stack, update the tag in the `image:` line, then click **Update the stack**. No re-pull switch needed; the tag change forces a fresh pull.

![Edit stack page with an arrow pointing to the image tag in the compose editor](assets/portainer-update-version.png)

![Edit stack page with an arrow pointing to the Update the stack button](assets/portainer-update-stack.png)

See [Install-Portainer](Install-Portainer) for the full installation walkthrough.

## Unraid

In the Unraid Docker tab, click the TREK container and select **Update**. Unraid will pull the latest image and restart with the same volumes.

## Next Steps

- [Backups](Backups) — schedule automatic backups so you always have a restore point before updates
- [Encryption-Key-Rotation](Encryption-Key-Rotation) — if you need to rotate or migrate the encryption key
- [Install-Docker-Compose](Install-Docker-Compose) — switch to Compose for easier future updates
