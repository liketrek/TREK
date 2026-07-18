# Calendar Feeds

Subscribe your calendar app to a TREK trip so it stays in sync automatically, instead of importing a snapshot once.

> **Not the same as the ICS export.** The **Download ICS** action described in [Day-Plans-and-Notes](Day-Plans-and-Notes) writes a one-off `.ics` file that never changes after you import it. A calendar *feed* is a live URL your calendar re-fetches on its own. Use the export for a frozen copy, a feed for something that keeps up with your edits.

## Where to find it

There are two feeds, reached from two places:

- **Per-trip feed** — in the trip planner, hover the **ICS** button in the Day Plan sidebar toolbar and choose **Subscribe to calendar**. (The other entry in that menu, **Download ICS**, is the one-off export.)
- **All-trips feed** — on the **My Trips** dashboard, click the calendar-plus button in the toolbar (**Subscribe to all trips**).

Both open the same dialog.

## Per-trip vs. all-trips

|                     | Per-trip feed                     | All-trips feed                                              |
|---------------------|-----------------------------------|-------------------------------------------------------------|
| Covers              | One trip                          | Every trip you own **or** are a member of                    |
| Calendar name       | The trip title                    | *{your username} – All Trips*                                |
| Excludes            | —                                 | Archived trips, and trips that ended more than 90 days ago   |
| URL                 | `/api/feed/trip/{token}.ics`      | `/api/feed/user/{token}.ics`                                 |
| Token lives on      | The trip                          | Your user account                                            |

The all-trips feed merges every qualifying trip into one calendar, sorted by start date, and de-duplicates the time-zone definitions so each event still resolves to the right local time.

## Turning a feed on

1. Open the **Subscribe to calendar** (or **Subscribe to all trips**) dialog. Opening it only reads the current state — it never mints a link behind your back.
2. Click **Enable calendar subscription**. TREK generates a random token and shows the feed URL.
3. Hand the URL to your calendar app with one of the buttons:
   - **Add to Google Calendar** — opens Google's add-by-URL page with the feed pre-filled.
   - **Add to Apple Calendar / Outlook** — a `webcal://` link that the OS hands to your default calendar app.
   - **Or copy a link manually** — expand this to copy the raw `https://…` URL (for a *From URL* box) or the `webcal://` variant.

The URL is built from `APP_URL` when it is set; otherwise TREK falls back to the host you are browsing from. Set `APP_URL` behind a reverse proxy so the link is the one your calendar app can actually reach — see [Environment-Variables](Environment-Variables) and [Reverse-Proxy](Reverse-Proxy).

## The token, and who can read the feed

The random token in the URL **is** the credential. The feed endpoint requires no login: anyone who has the link can read the whole trip — every event, note, address, and confirmation detail — without an account. The dialog says as much: *Creates a secret link anyone with it can read without logging in. You can turn it off anytime.*

Treat the URL like a password. Don't post it in a shared document or a public issue.

## Rotating and revoking

Once a feed is enabled, two buttons appear beneath the subscribe links:

- **Regenerate** — issues a new token. The old URL stops resolving immediately, so every calendar still subscribed to it goes dead and has to be re-added.
- **Turn off** — clears the token entirely. The URL 404s and no feed exists until you enable one again.

Use **Regenerate** if a link leaked; use **Turn off** if you no longer want a public feed at all.

## What appears in the feed

The feed carries the same events as the ICS export:

- **The trip itself** — an all-day event spanning the trip's start and end dates, with the trip description.
- **Timed day assignments** — one event per place that has a time, using the place name as the title, its address as the location, and its notes in the description. Times are anchored to the place's own time zone.
- **A per-day summary event** — an all-day event for each day that has untimed places or notes, titled with the day title (or *Day N*), listing those places and notes in the description.
- **Reservations** — hotels, restaurants, and transport. Flights and other transport take their start and end from the departure and arrival endpoints, each in its own time zone. Reservations with no placeable date are skipped.

Feeds are served with cache headers that tell clients not to cache, plus an hourly refresh hint (`REFRESH-INTERVAL` / `X-PUBLISHED-TTL` of one hour). Most calendar apps treat that as a suggestion — Google in particular refreshes on its own schedule, often much slower — so an edit may take a while to show up.

## Permissions

No dedicated permission gates feeds. You can manage a per-trip token if you own the trip or are a member of it; anyone else gets a *Trip not found*. The all-trips feed is always scoped to your own account.

Because the token grants unauthenticated read access, enabling a feed effectively shares that trip's contents with whoever holds the link, regardless of trip roles — see [Public-Share-Links](Public-Share-Links) for the equivalent trade-off on the sharing side.

## See also

- [Day-Plans-and-Notes](Day-Plans-and-Notes)
- [Trip-Planner-Overview](Trip-Planner-Overview)
- [Reservations-and-Bookings](Reservations-and-Bookings)
- [Public-Share-Links](Public-Share-Links)
- [My-Trips-Dashboard](My-Trips-Dashboard)
- [Environment-Variables](Environment-Variables)
