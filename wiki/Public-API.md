# Public API

A small, versioned, read-only surface that lets other software read your trips — built for integrations like location trackers, journalling tools and home automation, where something outside TREK wants to know what you planned.

> **Not the same as the internal API.** TREK's own frontend talks to a few hundred endpoints under `/api/…`. Those answer a session cookie, carry no version and change whenever the client changes — they are not a contract, and anything built on them will break. The public API is the opposite promise: a handful of endpoints under `/api/v1/`, authenticated with a key you mint yourself, that will not change shape without a new version number.

## What it can do

Read trips. That is deliberate and complete:

- list the trips you own or are a member of
- fetch one trip with its days, places in planned order, day notes, reservations, accommodations and fellow travellers
- read the bucket list: places the traveller wants to reach, not tied to any trip

It cannot write anything. An integration that reads your itinerary needs no ability to delete a place, and a key that can only read is a very different thing to hand to third-party software.

## Getting a key

1. Open **Settings → Integrations**
2. Under **API Keys**, click **Create key** and give it a name you will recognise later (the name is only for you — "Dawarich", "home assistant", "laptop script")
3. **Copy the key immediately.** It is shown once. TREK stores only a hash of it, so it cannot be shown again — if you lose it, delete the key and make a new one.

Keys look like `trek_` followed by 48 characters. You can hold ten at a time.

> **API keys and MCP tokens are not interchangeable.** They live on the same screen but open different doors: an [MCP token](MCP-Setup) drives every assistant tool, an API key reads trips over HTTP. A key of the wrong kind is rejected exactly like one that does not exist. Mint the kind the other software asks for.

To revoke access, delete the key. It stops working immediately, and anything using it gets a 401 on its next request.

## Using it

Send the key as a bearer token:

```bash
curl -H "Authorization: Bearer trek_your_key_here" \
     https://trek.example.com/api/v1/trips
```

or, if the software you are configuring expects a header named for an API key:

```bash
curl -H "X-API-Key: trek_your_key_here" \
     https://trek.example.com/api/v1/trips
```

Both are equivalent. Use whichever the other side offers.

## Endpoints

### `GET /api/v1/trips`

Every trip you can reach, newest first, without itineraries.

```json
{
  "trips": [
    {
      "id": 12,
      "title": "Tuscany",
      "description": "Wine and hill towns",
      "start_date": "2026-06-14",
      "end_date": "2026-06-22",
      "currency": "EUR",
      "archived": false,
      "updated_at": "2026-06-01 10:00:00"
    }
  ]
}
```

`updated_at` moves when the trip's **own** fields change — title, dates, currency, cover. It does **not** move when a place, a day or a note is edited. Do not use it to decide whether to re-fetch; you would miss every itinerary change. Compare the payload instead.

### `GET /api/v1/trips/{id}`

One trip with its contents. Returns **404** if the trip does not exist *or* is not yours — the two are indistinguishable on purpose, so the endpoint cannot be used to find out which trip ids exist.

Pick what you need with `?include=`, comma-separated:

| Section | What it adds |
|---|---|
| `days` | the itinerary spine: one entry per day, with `date`, `day_number`, `title`, `notes` |
| `places` | stops on each day, **in planned order**, with coordinates, times, duration, category and transport mode |
| `notes` | timed free-text notes on a day |
| `reservations` | bookings on their starting day: type, title, location, time, status |
| `accommodations` | where you sleep, with the date range resolved and check-in/check-out times |
| `travellers` | who is on the trip, by display name |

Two sections come back at trip level rather than on a day, because that is where they live:

| Field | Comes with | What it is |
|---|---|---|
| `unplanned_places` | `places` | places collected but not scheduled yet. On a real instance these are routinely **half** of a trip's places, and they carry coordinates. A hotel is not listed here; it is under `accommodations`. |
| `unscheduled_reservations` | `reservations` | bookings with no day. Deleting a day detaches its bookings rather than deleting them, so these exist in the wild. |

Asking for `places`, `notes` or `reservations` brings `days` along automatically, since that is where they are reported. `?include=notes` returns the day skeleton with its notes and empty place lists, not an empty trip.

Omitting `include` returns everything. A section you did not ask for is **absent** rather than empty, so your code can tell "not requested" apart from "nothing there". An unknown section name is a `400` rather than being silently ignored — a typo should not hand you a payload quietly missing what you wanted.

```bash
# only the notes, for a lightweight sync
curl -H "Authorization: Bearer trek_…" \
     "https://trek.example.com/api/v1/trips/12?include=days,notes"
```

```json
{
  "id": 12,
  "title": "Tuscany",
  "start_date": "2026-06-14",
  "days": [
    {
      "date": "2026-06-14",
      "day_number": 1,
      "title": "Arrival",
      "notes": null,
      "places": [
        {
          "name": "Uffizi",
          "address": "Florence",
          "lat": 43.76, "lng": 11.25,
          "time": "14:00", "end_time": null,
          "duration_minutes": 180,
          "category": "Museum",
          "notes": null,
          "transport_mode": "walking"
        }
      ],
      "day_notes": [{ "text": "Bring the tickets", "time": "09:00" }],
      "reservations": [
        { "type": "flight", "title": "LH 1234", "location": "FRA",
          "time": "2026-06-14T08:00", "end_time": null,
          "status": "confirmed", "notes": null }
      ]
    }
  ],
  "accommodations": [
    { "name": "Hotel Alba", "address": null, "lat": null, "lng": null,
      "start_date": "2026-06-14", "end_date": "2026-06-15",
      "check_in": "15:00", "check_out": "11:00", "notes": null }
  ],
  "travellers": [{ "name": "ada", "owner": true }, { "name": "bob", "owner": false }]
}
```

### `GET /api/v1/bucket-list`

Places the caller wants to reach, with no trip attached. Its own endpoint because it hangs off the user, not a trip.

```json
{
  "items": [
    { "name": "Hokkaido", "lat": 43.06, "lng": 141.35,
      "country_code": "JP", "notes": "in winter", "target_date": "2027-02-01" }
  ]
}
```

`target_date` is an aspiration, not a booking. Entries are returned whether or not the Atlas addon is switched on: the addon governs whether TREK shows the feature, not whether the rows exist, and an endpoint whose answers change when an unrelated toggle moves is one nobody can build on.

## Notes for integrators

**Join on dates, not ids.** Every day carries an ISO `date`, and accommodations carry a resolved date range rather than internal day ids. If your software keeps its own notion of a trip, the date is the one thing both sides can agree on. TREK's internal ids are not in the payload at all, by design — they would tie you to storage details that are free to change.

**One request, not many.** Rather than separate endpoints per section, `?include=` lets you fetch exactly what you need in a single call. Fetching a trip four times for four sections would burn your rate budget for no benefit.

**There are no timezones.** Times are stored and returned exactly as the traveller typed them: `14:00` means two in the afternoon wherever they were. If you are matching against timestamps of your own, the trip's dates are the reliable join; the times are a hint, not a UTC instant.

**Rate limit: 120 requests per minute**, counted per user rather than per IP address. A self-hosted integration and its owner's browser often share an address, and an IP-based limit would let one starve the other. Exceeding it returns `429`; back off and retry.

**Errors** are JSON with an `error` field:

| Status | Meaning |
|---|---|
| `400` | malformed trip id, or an unknown `include` section |
| `401` | missing, malformed or unknown key — also what you get for a key of the wrong kind |
| `404` | no such trip, or not one of yours |
| `429` | rate limit exceeded |

**Versioning.** `/api/v1` may gain fields; it will not lose them or change their types. A breaking change ships as `/api/v2` and both run side by side for a transition period. Write your client to ignore fields it does not know.

## What is not here yet

- **Writing.** Read-only for now. Write access needs per-scope enforcement that this surface does not implement, and a key that only reads is a much safer thing to hand out.
- **Incremental sync.** There is no `?since=` filter, because TREK cannot yet answer it truthfully — child records carry no modification timestamp, so a filter on `updated_at` would silently hide trips whose itinerary changed. Fetch the list and compare.
- **Webhooks.** Nothing pushes; poll at a sensible interval.

If you are building something and one of these blocks you, open a discussion — the surface is meant to grow around real integrations rather than ahead of them.

## See also

- [MCP Overview](MCP-Overview) — the other machine-facing surface, for AI assistants
- [Calendar Feeds](Calendar-Feeds) — subscribe a calendar app to a trip
- [Admin: MCP Tokens](Admin-MCP-Tokens) — the instance-wide view of issued tokens
