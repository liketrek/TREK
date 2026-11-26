# Install: Proxmox VE (LXC)

Install YOUYA on Proxmox VE as an LXC container using the [Proxmox VE Community Scripts](https://community-scripts.org/scripts/trek).

> A big thank you to the members of [community-scripts](https://github.com/community-scripts) for adding YOUYA to their collection and maintaining the install and update scripts.

## Prerequisites

- Proxmox VE with shell access
- Internet access from the Proxmox host

## Install

Run the following command in the **Proxmox VE Shell**:

```bash
bash -c "$(curl -fsSL https://raw.githubusercontent.com/community-scripts/ProxmoxVE/main/ct/trek.sh)"
```

> **Tip:** Always verify the latest command on the [community-scripts YOUYA page](https://community-scripts.org/scripts/trek) before running — the script URL may change between releases.

The script will prompt you to choose between **Default** and **Advanced** settings.

### Default container specs

These are the defaults at the time of writing. The script decides them, so check the script page for the current values.

| Resource | Value |
|---|---|
| OS | Debian 13 |
| CPU | 2 cores |
| RAM | 2048 MB |
| Storage | 8 GB |
| Port | 3000 |

The container is unprivileged. YOUYA is installed at `/opt/trek`.

## After Install

Once the container starts, open your browser at:

```
http://<container-ip>:3000
```

On first boot, YOUYA automatically creates an admin account. The credentials are printed to the container log — check them with:

```bash
journalctl -u trek -n 50
```

If you put `ADMIN_EMAIL` and `ADMIN_PASSWORD` into `/opt/trek/server/.env` before the first start, YOUYA uses them instead, but only on that first start and only when both are set. Once a user exists they have no effect.

The `ENCRYPTION_KEY` is auto-generated during setup and saved to `/opt/trek/server/.env`. Record that file in your backups.

## Viewing Logs

YOUYA runs as a systemd service named `trek` inside the LXC. To view logs from within the container:

```bash
# Follow live logs
journalctl -u trek -f

# Show last 100 lines
journalctl -u trek -n 100

# Show logs since last boot
journalctl -u trek -b
```

To access the container shell from the Proxmox VE host, click the container in the UI and open **Console**, or run:

```bash
pct enter <container-id>
```

## Configuration

The environment file is located at `/opt/trek/server/.env` inside the container. Edit it to set variables like `ALLOWED_ORIGINS`, `APP_URL`, or `TZ`, then restart the service:

```bash
systemctl restart trek
```

### Binding to a specific network interface

If your Proxmox host has multiple network interfaces and you want YOUYA to listen on only one of them, set the `HOST` variable in `/opt/trek/server/.env`:

```
HOST=10.0.0.72   # bind only on this LAN interface
```

> **Note:** `HOST` is only relevant for source-based and Proxmox installs. Do not use it in Docker or any containerised deployment.

### Outbound proxy

If the container reaches the internet only through a proxy, set `HTTP_PROXY`, `HTTPS_PROXY` and `NO_PROXY` in the same file, and `NODE_USE_ENV_PROXY=1` next to them: unlike the Docker image, a Proxmox install does not set that switch for you, and without it Node ignores the proxy for everything except YOUYA's guarded integration requests. See [Environment-Variables](Environment-Variables#outbound-https-proxy).

The same file takes every other variable from [Environment-Variables](Environment-Variables), for example the Web Push, OIDC or place search settings. The in-app Help pages are read from the `wiki` folder that comes with the installed version, so they match what you run. Installed plugins are stored under the `data` folder by default (`TREK_PLUGINS_DIR` moves them), so keep that folder in your backups.

See [Environment-Variables](Environment-Variables) for the full variable reference.

## Updating

Run the following command inside the **LXC container** and select **Update** when prompted:

```bash
bash -c "$(curl -fsSL https://raw.githubusercontent.com/community-scripts/ProxmoxVE/main/ct/trek.sh)"
```

> **Tip:** Always check the [community-scripts YOUYA page](https://community-scripts.org/scripts/trek) to confirm the latest command before running.

The script stops the service, backs up your data and uploads, applies the new release, restores the backup, and restarts. No manual steps required. When the new version starts, YOUYA also copies the database to `data/pre-migrate-<schema>-<time>.db` before migrating it, so you can go back if needed (see [Updating](Updating#database-migrations)).

## Next Steps

- [Environment-Variables](Environment-Variables) — complete variable reference
- [Reverse-Proxy](Reverse-Proxy) — put YOUYA behind Nginx or Caddy
- [Updating](Updating) — general update notes
