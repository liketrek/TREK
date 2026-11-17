# Install: TrueNAS SCALE

Install TREK from the [TrueNAS Community catalog](https://apps.truenas.com/catalog/trek_community/), without creating a custom app.

## Install

1. In TrueNAS, configure an Apps storage pool if you have not already done so, then open **Apps → Discover Apps**.
2. Search for **TREK** in the Community train and select **Install**. If it is not listed, check that the Community train is enabled and the catalog is up to date.
3. Set **Initial Admin Email** and **Initial Admin Password**, and choose your timezone. These credentials create the administrator on first startup; changing the fields later does not change an existing account.
4. Review **Data Storage** and **Uploads Storage**. The defaults use TrueNAS-managed ixVolumes; alternatively, choose existing host paths. For host paths, ensure both locations are writable by the configured user and group (UID/GID `568` by default).
5. Review **WebUI Port** (default `30573`) and the remaining settings, then install the app. Wait for it to start.
6. Open the app's **Web Portal** in TrueNAS, or visit `http://<truenas-ip>:30573` with the default published port. Sign in with the initial admin credentials.

## Storage and backups

Data Storage contains the database, settings and generated encryption key; Uploads Storage contains uploaded files. Back up both locations and preserve them when updating or moving TREK. If you set `ENCRYPTION_KEY` explicitly under **Additional Environment Variables**, keep that key safe and include it in your recovery plan. See [Backups](Backups).

## HTTPS and configuration

**Secure Cookies** is disabled by default for direct HTTP access. For production, use HTTPS through a reverse proxy, enable **Secure Cookies**, and add `TRUST_PROXY=1` under **Additional Environment Variables**. The proxy must support WebSocket upgrades on `/ws`. See [Reverse-Proxy](Reverse-Proxy) for setup and [Environment-Variables](Environment-Variables) for other options, including `APP_URL` and `ALLOWED_ORIGINS`.

## Updating

When TrueNAS offers an update for TREK, back up your data and uploads, then update the app from **Apps → Installed Applications**. Catalog updates can arrive separately from TREK releases. Database migrations run at startup and are forward-only; reverting to an older version may require restoring the pre-update database. See [Updating](Updating#database-migrations).
