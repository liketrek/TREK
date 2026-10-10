# Demo Mode

Demo mode lets you run a public "try before you install" instance of TREK. A shared demo account is available for visitors, write operations are blocked for that account, and the database resets automatically every hour so the instance stays in a known state.

<!-- TODO: screenshot: demo mode banner or try-demo button on login page -->

## Enabling demo mode

Set `DEMO_MODE=true` in your environment and restart TREK. See [Environment-Variables](Environment-Variables) for how to set environment variables.

When demo mode is active, the login page shows a one-click **"Try the demo"** button. Clicking it logs the visitor in as the demo user immediately — no credentials need to be entered and no registration is required.

**Demo account (auto-created on first start):**

| Field | Value |
|---|---|
| Email | `demo@trek.app` |
| Password | `demo12345` |

**Admin account:** an admin account is also seeded on first start. By default it uses username `admin`, email `admin@trek.app`, and password `admin12345`. You can override these at seed time with the `DEMO_ADMIN_USER`, `DEMO_ADMIN_EMAIL`, and `DEMO_ADMIN_PASS` environment variables (they only take effect when `DEMO_MODE=true`, on the first start before the database is seeded). See [Environment-Variables](Environment-Variables).

## What the demo user can and cannot do

The demo user account has read access to the shared trip data but the following operations are permanently blocked:

- **Password change** — returns 403.
- **Account deletion** — returns 403.
- **MFA enrollment or removal** — returns 403.
- **File uploads** — avatar uploads, trip cover uploads, and document/photo file attachments are blocked and return 403.
- **All MCP write tools** — create, update, and delete operations via the MCP API are blocked for the demo user.

Registration is also disabled while demo mode is active — visitors cannot create new accounts.

The admin account is unaffected and retains full access.

## Hourly reset

TREK schedules an automatic hourly reset of the demo database. At each reset:

1. The current `travel.db` is replaced with the saved baseline (`travel-baseline.db`).
2. The admin account's credentials (`password_hash`, API keys, avatar) are re-applied on top of the restored baseline, so admin API keys and password changes survive the reset — but only when `DEMO_ADMIN_EMAIL` is set explicitly.

If no baseline has been saved yet, the reset is skipped and a message is logged.

The seeder defaults the admin address to `admin@trek.app` while the reset defaults it to `admin@nomad.app`, a legacy quirk that is pinned deliberately. With `DEMO_ADMIN_EMAIL` unset the reset looks up an address that does not exist, finds no admin row, and skips the carry-over entirely — a password change, API key or avatar set after the baseline was saved is lost on every hourly reset. Set `DEMO_ADMIN_EMAIL` (to `admin@trek.app`, for instance) if you want them to survive. Unlike the seed-time variables above, the reset reads it on every run, so setting it on an already-seeded instance and restarting is enough.

The instance-wide Maps and Unsplash keys stored in `app_settings` are carried across either way, so map and photo search keep working after a reset.

Everybody signed in stays signed in. The baseline holds no sign-in sessions of its own, so the sessions that are active when the reset runs are carried across as well, for every account the baseline still holds under the same email. A visitor or admin mid-session is not sent back to the login screen on the hour.

## Saving a baseline

The baseline is the snapshot the hourly reset restores to. The admin can update it at any time:

**Endpoint:** `POST /api/admin/save-demo-baseline`

In the admin panel, a **Demo Baseline** card sits above the tabs while demo mode is on; its **Save Baseline** button calls this endpoint. The baseline captures the current state of the database, trip data, settings and encrypted API keys included, so demo features (maps, photos, weather) continue to work after each reset. It is written as a consistent snapshot and only then put in place of the previous baseline, so a save that fails leaves the previous one intact.

On first start with demo mode active, TREK seeds three example trips (Tokyo & Kyoto, Barcelona Long Weekend, New York City) owned by the admin and shared with the demo user, then saves the initial baseline automatically once the server is up. The same happens when a backup restored onto a demo instance without a baseline holds no admin trips: the example trips are seeded into the restored database and it becomes the baseline. Only a seeding start or restore saves a baseline on its own: an instance that already holds data but has no baseline keeps skipping the hourly reset until the admin saves one.

## Limitations

- Demo mode is not for production use with real user data. The hourly reset deletes all visitor-created content.
- All demo visitors share a single account — there is no isolation between sessions.
- Because the demo account is shared, its session list (`GET /api/auth/sessions`) shows each visitor only their own session, and ending sessions (`DELETE /api/auth/sessions/{id}`, `POST /api/auth/sessions/revoke-others`) answers 403 `Sessions cannot be ended in demo mode.`, so one visitor cannot see or sign out the others. Logging out still ends the visitor's own session.
- File uploads (photos, documents, trip covers, avatars) are disabled for the demo user.

## See also

- [Environment-Variables](Environment-Variables)
- [Backups](Backups)
