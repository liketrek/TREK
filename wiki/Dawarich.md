# Dawarich

[Dawarich](https://dawarich.app) is a self-hosted location history tracker, a Google Timeline replacement you run yourself. It knows where you actually were. TREK knows what you planned and why. This addon lets TREK read your Dawarich instance and offer what it finds.

The split is deliberate and it does not move: **Dawarich records, TREK plans and interprets.** TREK never starts a tracker of its own, never writes anything into Dawarich, and never keeps a copy of your recorded route. Everything it finds arrives as a **suggestion** that only you can see, and nothing reaches a trip, a journal or your Atlas until you confirm it. A background check must not edit a trip three other people are planning.

> **Admin:** Enable the **Dawarich** addon in **Admin → Addons**. It is listed under **Integration** and is off by default. The toggle is the instance-wide switch only: each user connects their own instance in **Settings → Integrations**. A Dawarich on your local network also needs `ALLOW_INTERNAL_NETWORK=true` on the TREK server. See [Admin-Addons](Admin-Addons) and [Internal-Network-Access](Internal-Network-Access).

## What it does

- **Offers the stays Dawarich recorded during your trips**, for review, in the trip planner and in your journals, with the day, the arrival and departure times and how long you stayed.
- **Turns a reviewed stay into a place or a journal entry**, after you have corrected anything the detector got wrong.
- **Draws the route you actually travelled** over the trip map and the journal map, one colour per day, next to the one you planned.
- **Ticks off your bucket list** when your recordings show you spent real time at a wish, so driving past does not count.
- **Proposes countries for your Atlas** from the countries and cities your recordings cover, without touching what you marked by hand.

## Setting it up

1. In Dawarich, open **Account** and copy your **API key**.
2. In TREK, open **Settings → Integrations**. The **Dawarich** card appears there once the addon is on, on the desktop and on the phone.
3. Enter the **Instance address**, for example `https://dawarich.example.com`, and paste the **API key**.
4. Press **Test connection**. On success TREK says how many stays it found in the last 30 days, shows the Dawarich version, and lists anything your version does not offer.
5. Press **Save**.

| Field | Notes |
|---|---|
| Instance address | The address of Dawarich itself. TREK adds `/api/v1` on its own, and strips a trailing `/api` or `/api/v1` if you pasted one. |
| API key | Stored encrypted and never shown again. Leave it blank to keep the key already stored. |
| Check for new stays automatically | On by default. Off means TREK only reads Dawarich when you ask it to. |
| Allow self-signed certificate | Only needed if your instance uses a certificate your TREK server does not trust, which is common on a LAN. |

Once connected, the card shows **Connected**, a **Check now** button, a **Disconnect** button, when TREK last checked, and the reason when the last check did not fully succeed.

Each person connects their own Dawarich. Your stays and your recorded route are visible to you alone, on a trip you share with others too. A place you create from a stay is an ordinary place, which everyone on the trip sees.

### The API key

- **It is never returned.** The card shows a placeholder, and no endpoint and no MCP tool reads the key back.
- **Blank keeps the stored key.** The field is never prefilled, so leave it empty when you only change a switch. **Save** needs either a stored connection or a typed key.
- **Changing the host clears the key.** A key belongs to the instance that issued it, so pointing the connection at a different scheme, host or port drops the stored key and the card goes back to **Not connected**. Fixing a typo in the path, or adding a trailing slash, keeps it. After a move, type the key in again before you press **Test connection** or **Save**.
- **Clearing the address clears the key** as well.
- **Disconnect** removes the address, the key and the check history. Places and journal entries you already made from stays are yours and stay where they are. Disconnecting is recorded in the [Audit-Log](Audit-Log) as `dawarich.disconnected`.

### Private addresses and certificates

> **A private address** (`192.168.…`, `10.…`) is accepted with a warning, and the save is recorded in the [Audit-Log](Audit-Log) as `dawarich.private_ip_configured`. TREK reaches Dawarich through the same strict guard as Immich and AirTrail, so the server needs `ALLOW_INTERNAL_NETWORK=true` to reach a LAN instance.
>
> **A self-signed certificate** needs **Allow self-signed certificate**. The switch only relaxes the certificate check. An address TREK cannot resolve at all is still refused with *TREK cannot use that address.*

## How TREK checks for stays

With **Check for new stays automatically** on, TREK asks Dawarich for new stays every fifteen minutes. **Check now** on the card does the same at once and reports how many new stays it found. Pressing it while a check is already running answers *A check is already running* instead of asking Dawarich twice.

A check covers the dates of your trips, not your whole history:

- every trip you own or are a member of that has a start date, is not archived, has begun (or begins tomorrow) and ended no more than 400 days ago
- for each of them, from three days before the start to one day after the end, but never past the present moment

Stays outside those windows are never fetched. Dawarich's confirmed and unconfirmed visits both come in, because since Dawarich 1.12 an unconfirmed visit is the normal state of one.

**Checking again never duplicates anything.** A stay is identified by your account and its Dawarich visit id, so the tenth check over the same dates produces the same list as the first. A stay you have not acted on yet is simply updated when Dawarich changes it, and removed when Dawarich deletes it. Stays you accepted or dismissed are never rewritten; see *When Dawarich changes its mind* below.

The addon switch is read on every run, so turning the addon off stops the checks without a restart.

## Reviewing stays in the trip planner

**From Dawarich** sits at the top of the trip's **Places** panel, and at the top of the places list on a phone. It starts collapsed; its header says when TREK last checked and shows how many stays are waiting. Until you connect an instance it reads *Connect Dawarich in Settings to see your stays here.*

Opened, it lists the stays of this trip grouped by day, with each stay's name and its arrival and departure times. A gauge mark flags a stay Dawarich's own detector was unsure about. Each row has two actions:

| Action | What happens |
|---|---|
| **Add as a place** | Opens the review step, then creates a place on the trip. |
| **Not a place I visited** | Dismisses the stay. Reversible, see below. |

**The review step** first shows what was recorded: the arrival and departure, how long the stay lasted, whether Dawarich still marks it *Detected, unconfirmed*, and how confident its detector was. Below that, every value is editable before anything is saved: **Name**, **Arrived**, **Left**, **Day**, **Trip** and **Notes**. **Day** can stay on **Not on a day yet**, which leaves the place unplanned on the trip. **Add place** creates it with the stay's coordinates, its arrival and departure as the place's times, and the length of the stay as its duration. Everyone on the trip sees it straight away.

Adding a place needs the same rights as adding one by hand: `place_edit`, and `day_edit` to put it on a day. See [Admin-Permissions](Admin-Permissions).

A place that came out of a recording carries a small Dawarich mark next to its name in its details (*Added from your Dawarich recordings*), so months later it is still clear where it came from.

Dismissed and accepted stays move to **Show _n_ already dealt with** at the bottom of the list. A dismissed stay has **Put back**. An accepted stay has no undo button, because the place it produced is a thing of its own now; delete the place instead, as described below.

A visit detector is right most of the time and confidently wrong the rest, which is why there is a review step and not an import button.

## Reviewing stays in a journal

On the desktop, a journal folds each day's waiting stays into that day: one line at the end of the day with the Dawarich mark, *1 stay from Dawarich* or *3 stays from Dawarich*, and the span from the first arrival to the last departure. Click it to open the stays.

- A day that has stays waiting but no entry yet joins the timeline, as long as it lies within the journal's own span: the dates of its entries together with the dates of the trips linked to it.
- Nothing is drawn on a day with nothing waiting, or for someone who cannot edit the journal's entries.

Each row offers **Write a journal entry** and **Not a place I visited**. In the fold, **Write a journal entry** adds the entry to this journal straight away: dated to the stay's day, timed at its arrival, and titled and located with the stay's name and coordinates. Edit it afterwards like any other entry, and add photos to it as usual.

On a phone, a Dawarich button over the journal's map (in the timeline view) opens **From Dawarich** as a sheet listing all your waiting stays. There, **Write a journal entry** opens the review step first, with **Name**, **Date**, **Arrived**, **Left**, **Journal** and **Your story**, and **Add entry** writes it.

Writing an entry needs edit rights on the journal.

## Deleting what you accepted

Delete the place or the journal entry a stay produced, and the stay returns to the list as waiting. The same happens when a bucket list wish that was ticked off from a stay is deleted. An acceptance whose result is gone is not an acceptance, so nothing is lost and nothing is stuck.

## When Dawarich changes its mind

Dawarich can rename a stay, move it, or delete it after you have already acted on it. TREK notices on its next check and marks the stay in the **already dealt with** list:

| Mark | Meaning |
|---|---|
| **Changed in Dawarich** | An accepted stay's recording changed since you accepted it. |
| **Gone from Dawarich** | An accepted or dismissed stay no longer exists in Dawarich. |

Both come with the sentence *What you wrote in TREK is untouched*, and that is all TREK does. The place or entry you made is never rewritten or deleted because a detector ran again; that would be the integration overwriting your journal, not a feature.

## The recorded route on the map

### On the trip map

The Dawarich button on the trip map switches the recorded route on and off. On the desktop it sits in the bottom right corner of the map, on a phone among the map controls. It stays available in road trip mode, where the route you actually drove is the thing you most want beside the planned one.

- The route is drawn dashed, one colour per day, underneath the planned route so the plan stays readable. Days are cut at local midnight, not at midnight UTC, so an evening walk stays on the evening it happened.
- On or off is remembered per trip for the browser session.
- While it is on, TREK fetches the route for the trip's dates and refreshes it every two minutes, so a trip in progress catches up without a reload.
- Collapsing a day in the day plan, or in the road trip sidebar, takes that day's route off the map together with its places.
- The button's label says why a map has no line: *Loading the recorded route…*, *Nothing was recorded on these dates*, *The recorded route could not be loaded*, or *The recorded route needs a connection*.

The route is drawn, never applied: TREK does not correct your plan from it.

### On a journal map

A journal draws the same route on its own map, from the first to the last date of the trips linked to it, when **Show all trip GPX tracks** is on in the journal's **Journey Settings**.

### Nothing is stored

The route is read from Dawarich when a map asks for it and then discarded. TREK's server holds it in memory for one minute, so panning and toggling do not ask your instance again, and forgets it on a restart or when you change the connection. No position is written to TREK's database, so the route is not in backups and is not available offline.

TREK prefers the tracks Dawarich has already generated, which arrive split into segments with a travel mode. On an instance that has not generated tracks yet, it falls back to the raw points and thins them to 600 per day, so a month-long trip stays drawable.

## Bucket list and Atlas

On the desktop Atlas, a Dawarich panel sits at the bottom of the map, left of the statistics, with two buttons: **Wishlist** and **Countries**. On a phone, a **Dawarich** button sits next to **Bucket List**. Both open the same dialog. The Dawarich reads need a connection; nothing is cached for offline use.

### Wishlist

**Check wishlist** asks your recordings, entry by entry, whether you reached the places on your bucket list.

- **A match needs closeness and time.** A wish counts as reached within 250 m and after 20 minutes on the spot. Of several stays that qualify, the longest wins.
- Each match shows the distance, the time spent and the day. Matches start selected, apart from wishes already ticked off, which are marked *Already ticked off*.
- Only entries with coordinates can be checked. The others are named as skipped rather than silently ignored.
- One check looks at up to 50 entries, the ones not ticked off yet first, and says so when there were more.

**Tick off _n_** marks the selected wishes visited **on the day of the stay**, not on the day you pressed the button. On the desktop bucket list, a wish ticked off this way shows that date with a tooltip, *Ticked off from your Dawarich recordings*; click the date to undo it. A wish that was already ticked off keeps its own date.

Background checks help here too: a stay of at least 20 minutes within 250 m of a wish is linked to it, and one wish belongs to exactly one stay (the closest one, the longer one on a tie). That link is only a hint. Ticking the wish off still needs you, or an assistant you authorised through MCP.

### Countries

**Look for countries** reads the countries and cities your recordings cover in the last 12 months.

- Countries already marked visited in your Atlas, by hand or from an earlier check, are left out, so a mark you set by hand is never relabelled. The rest are listed with their flag and their cities, and start selected.
- Country names TREK cannot match to a country are listed underneath rather than dropped.
- **Add _n_ countries** marks them visited, recorded as coming from Dawarich. A country you removed from your Atlas earlier comes back when you confirm it here.

TREK asks Dawarich for the year in 30-day pieces, one after another, because Dawarich computes this answer on the spot and a whole year at once can take longer than a request may.

## MCP tools

With the [MCP](MCP-Overview) addon on as well, an assistant can review your stays for you. The tools exist only while the Dawarich addon is on. Switching the addon on or off ends open MCP sessions, so an assistant reconnects with the tools that currently apply. The connection itself (address, key, test, disconnect) is deliberately not reachable through MCP.

| Tool | What it does | Scope |
|---|---|---|
| `list_dawarich_suggestions` | Lists your stays: waiting, accepted or dismissed, optionally for one trip. 50 by default, up to 200. | `journey:read` |
| `accept_dawarich_suggestion_as_place` | Turns a stay into a place on a trip, optionally on one of its days, with a corrected name, notes or coordinates. | `places:write` |
| `accept_dawarich_suggestion_as_journal_entry` | Turns a stay into a dated journal entry, with a title, a story, a date and a time. | `journey:write` |
| `mark_bucket_list_item_visited_from_dawarich` | Ticks off the wish a stay was linked to, or another wish of yours. | `atlas:write` |
| `dismiss_dawarich_suggestion` | Dismisses a stay, or puts a dismissed one back. | `journey:write` |
| `get_dawarich_trip_track` | Summarises a trip's recorded route per day: segments, times, travel mode and distance. The line itself stays on the map. | `journey:read` |

The same rules apply as in the browser: nothing is added until a tool is called, and the permissions for adding a place are checked the same way. See [MCP-Addon-Tools](MCP-Addon-Tools) and [MCP-Scopes](MCP-Scopes).

## What TREK keeps, and what it never does

TREK keeps:

- **your connection**: the address, the encrypted key, the two switches, when it last checked and how that went, and which parts of your instance answered
- **the stays it offered you**: name, coordinates, arrival and departure, length, Dawarich's confidence, the country, and what you did with each. They belong to you and nobody else sees them.

TREK never:

- **writes to Dawarich.** Every request it makes is a read.
- **stores your route or raw positions.** They stay in Dawarich.
- **adds a place, an entry, a tick or a country on its own.** Every one of them needs a confirmation.
- **rewrites or deletes what you made** because the recording changed.

## The other direction

Dawarich can read your TREK trips through the [Public API](Public-API): a versioned, read-only surface with a key you mint yourself and can narrow to just the sections you want it to see (see [What a key may read](Public-API#what-a-key-may-read)). Nothing is written back to TREK either.

## Which Dawarich versions work

TREK asks your instance what it offers when you test the connection, and again after every successful check, so a Dawarich upgrade is picked up without reconnecting. A feature your version does not offer is switched off rather than broken, and the connection card names it: *This Dawarich version does not offer: …*. The integration was checked against Dawarich 1.14.4.

What TREK reads, when the instance offers it:

| Endpoint | Used for |
|---|---|
| `GET /api/v1/users/me` | the connection test, and the version the instance reports |
| `GET /api/v1/visits` | the stays waiting for review |
| `GET /api/v1/tracks` | the recorded route on the map |
| `GET /api/v1/points` | the same, on an instance that has not generated tracks yet |
| `GET /api/v1/locations` | checking your bucket list |
| `GET /api/v1/countries/visited_cities` | the Atlas countries |

Two details worth knowing, because they shape what TREK can promise:

- **A Dawarich visit carries no "last changed" timestamp.** TREK detects a change by comparing the fields it shows, which is why it can tell you a stay changed but not exactly what.
- **Deleting a visit removes it from the API rather than marking it deleted.** TREK notices by re-reading the whole date range, which is why a check reads the trip's dates rather than only what is new.

Each request to Dawarich gives up after 15 seconds, and TREK reads at most 8 MB from one answer.

## Troubleshooting

| What you see | What it usually means |
|---|---|
| No Dawarich card in **Settings → Integrations** | The addon is off. An admin enables it in **Admin → Addons**. |
| *TREK could not reach that address.* | Wrong address, the instance is down, or your TREK server has no route to it. A LAN instance also needs `ALLOW_INTERNAL_NETWORK=true`, and a self-signed certificate needs **Allow self-signed certificate**. **Test connection** adds the underlying reason in brackets. |
| *TREK cannot use that address.* | The address is malformed or does not resolve, so **Save** refused it. |
| *Dawarich rejected the API key.* | The key was regenerated, or belongs to a different instance. |
| *That API key is not allowed to read this.* | Dawarich refused the request for this key. |
| *That address answered with something that is not Dawarich.* | Usually a reverse proxy or a login portal answering instead. Enter the Dawarich address itself, reachable without a separate login. It also appears when one answer is larger than 8 MB. |
| *This Dawarich version does not have that endpoint.* | An older instance. Everything else keeps working; the connection card lists what is missing. |
| *Dawarich asked TREK to slow down. Try again shortly.* | Dawarich is rate limiting. Wait and press **Check now** again. |
| *some trips could not be read* | Part of a check succeeded and part did not. Press **Check now**; if it persists, read the reason on the connection card. |
| **Not connected** after changing the address | The host changed, so the key was cleared. Type it in again. |
| Connected, but no stays | TREK only reads stays inside the dates of your trips, and only the ones Dawarich's visit detection produced. Check that the stays show up in Dawarich itself for those dates. |
| *Nothing was recorded on these dates* | Dawarich has no points or tracks for the trip's dates, or the trip has no dates. |

## See also

- [Public API](Public-API): how Dawarich reads your trips
- [Atlas](Atlas): the bucket list and the visited countries map
- [Journey Journal](Journey-Journal): where accepted stays become entries
- [Internal Network Access](Internal-Network-Access): reaching an instance on your LAN
- [Addons Overview](Addons-Overview): the full addon table
