# Dawarich

[Dawarich](https://dawarich.app) is a self-hosted location-history tracker — a Google Timeline replacement you run yourself. It knows exactly where you were. TREK knows what you planned and why. This addon connects the two.

The split is deliberate and it does not move: **Dawarich records, TREK plans and interprets.** TREK never starts a tracker of its own, never writes anything into Dawarich, and never keeps a copy of your GPS archive. The route drawn on a trip is fetched for the window you are looking at and thrown away again.

## What it does

- **Suggests entries from where you actually were.** Dawarich detects the places you stopped at; TREK lists them for review, with the date, the arrival and departure times and how long you stayed.
- **Turns a reviewed stay into a place, a journal entry, or a ticked wish** — your choice, after you have corrected anything the detector got wrong.
- **Draws the route you actually took** over a trip's map, coloured per day in your own timezone, alongside the one you planned.
- **Ticks off your wishlist.** For each entry on your Atlas bucket list with coordinates, TREK can ask your recordings whether you ever got there — and how long you stayed, so driving past does not count.
- **Offers the countries your recordings say you visited** for your Atlas, without touching what you marked by hand.

Everything arrives as a **suggestion**. Nothing reaches a trip, a journal or your Atlas until you confirm it — a background poll must not edit a trip three other people are planning.

## Setting it up

**An administrator** enables the `dawarich` addon under **Admin → Addons**. It is off by default.

**Each reader** then connects their own instance:

1. In Dawarich, open **Account** and copy your **API key**.
2. In TREK, go to **Settings → Integrations → Dawarich**.
3. Paste your instance address (for example `https://dawarich.example.com`) and the key.
4. Press **Test connection**. TREK reports what it found and which parts of your instance it can read.
5. Press **Save**.

The key is stored encrypted and never shown again. Leave the field blank when changing the address later — blank means "keep the stored key", as long as the address still points at the same instance. **Moving the connection to a different host clears the key**: a key issued by one Dawarich must not be sent to another one, so retype it after a move. Fixing a typo in the path, or adding a trailing slash, keeps it.

> **A self-signed certificate** on a LAN instance needs the *Allow self-signed certificate* switch. TREK still refuses addresses it cannot resolve or reach; the switch only relaxes the certificate check.
>
> **A private address** (`192.168.…`, `10.…`) is accepted with a warning. Your TREK server may additionally need `ALLOW_INTERNAL_NETWORK=true` to reach it.

Each person connects their own Dawarich. One user's recordings are never visible to anyone else on a shared trip.

## Reviewing what was recorded

TREK checks for new stays in the background every fifteen minutes, for trips that are running or recently finished. You can turn that off and pull by hand instead, and **Check now** always works.

Stays appear:

- in the **Places** panel of a trip, for the dates that trip covers
- in a **journal**, above its timeline

Each one shows what was recorded and how sure Dawarich's detector was. Then:

| Action | What happens |
|---|---|
| **Write a journal entry** | Creates a dated entry in the journal you pick, prefilled with the stay's date, time, name and coordinates. Add photos to the entry afterwards, as usual. |
| **Add as a place** | Creates a place on the trip, optionally pinned to one of its days. Left off a day it joins the trip's shortlist. |
| **Not a place I visited** | Dismisses it. Reversible — dismissed stays are one click away under *Show already dealt with*. |

Everything is editable before it is saved. A visit detector is right most of the time and confidently wrong the rest, which is exactly why there is a review step and not an import button.

Wishes are not ticked off from here. A wish belongs to the Atlas, is reached once, and is confirmed there — see *Wishlist and Atlas* below.

A place that came out of a recording carries a small Dawarich mark next to its name, so months later it is still clear where it came from. Delete that place and the stay returns to the review list: an acceptance whose result is gone is not an acceptance.

### When Dawarich changes its mind

Dawarich can rename a stay, or delete one, after you have already written a journal entry from it. TREK notices and says so next to the entry — and does nothing else. What you wrote is yours; an integration that rewrote your journal because a detector ran again would be a bug, not a feature.

## The recorded route on the map

Open a trip and press the Dawarich control on the map. The route you actually travelled is drawn dashed and coloured per day, under the planned route so the plan stays readable.

It is fetched live and never stored. If there is nothing to draw, the control says which: nothing was recorded on those dates, the instance could not be reached, or the device is offline.

A journal draws the same thing for its own dates, on the map it already has, when *Show trip tracks* is on.

## Wishlist and Atlas

Both live in the **Atlas**, on the Dawarich panel beside the statistics:

- **Wishlist** asks your recordings about each bucket-list entry that has coordinates. A match needs both closeness and time spent — within 250 m and at least 20 minutes on the spot, so driving past does not count. What it finds is a list you confirm, with the distance, the time spent and the day; entries without coordinates are named as skipped rather than silently ignored. A wish is ticked off on the day it was reached, not on the day you pressed the button, and a tick that came from a recording can be undone on the wishlist itself.
- **Countries** reads the countries and cities your recordings cover in the last year. Countries already in your Atlas are marked as such, and countries you marked by hand keep their own provenance when confirmed again.

## The other direction

Dawarich can read your TREK trips through the [Public API](Public-API) — a versioned, read-only surface with a key you mint yourself and can narrow to just the sections you want it to see. Nothing is written back to TREK either.

## Which Dawarich versions work

TREK probes your instance when you connect and uses what it finds. A feature your version does not offer is switched off rather than broken, and the connection card names what is missing.

What TREK reads, when the instance offers it:

| Endpoint | Used for |
|---|---|
| `GET /api/v1/users/me` | the connection test |
| `GET /api/v1/visits` | the stays waiting for review |
| `GET /api/v1/tracks` | the recorded route on the map |
| `GET /api/v1/points` | the same, on an instance that has not generated tracks yet |
| `GET /api/v1/locations` | checking your wishlist |
| `GET /api/v1/countries/visited_cities` | the Atlas countries |

Two details worth knowing, because they shape what TREK can promise:

- **A Dawarich visit carries no "last changed" timestamp.** TREK detects a change by comparing the fields it shows, which is why it can tell you a stay changed but cannot tell you exactly what.
- **Deleting a visit removes it from the API rather than marking it deleted.** TREK notices by re-reading the whole window, which is why a sync reads a date range rather than only what is new.

## Troubleshooting

| What you see | What it usually means |
|---|---|
| *TREK could not reach that address* | Wrong address, instance down, or your TREK server has no route to it. |
| *Dawarich rejected the API key* | The key was regenerated, or belongs to a different instance. |
| *That address answered with something that is not Dawarich* | Usually a reverse proxy or an auth portal answering instead. Enter the Dawarich address itself. |
| *This Dawarich version does not have that endpoint* | An older instance. Everything else keeps working; the connection card lists what is missing. |
| Connected, but no stays | Dawarich detects visits only with a reverse geocoder configured (Photon, Nominatim, Geoapify or LocationIQ). Check that first. |
| *some trips could not be read* | Part of the sync succeeded. Press **Check now**; if it persists, look at the reason under the connection. |

## See also

- [Public API](Public-API) — how Dawarich reads your trips
- [Atlas](Atlas) — the bucket list and the visited-countries map
- [Journey Journal](Journey-Journal) — where accepted stays become entries
- [Addons Overview](Addons-Overview) — the full addon table
