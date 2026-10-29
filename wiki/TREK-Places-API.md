# TREK Places API

The TREK Places API is TREK's own place index. It answers place search, the suggestions under the search box, the details of a place picked from it, the category buttons on the map and the geocoding behind imports, with no API key to enter and no account. Every installation gets a fair daily allowance, counted by the number of requests only. In the app it is called the **TREK API**, and a result that came from it carries a **TREK** mark.

It does not replace OpenStreetMap. A search asks both and shows their results together, because each is good at what the other lacks: the index is strongest on businesses such as restaurants, shops and hotels, and OpenStreetMap is where the temples, bridges, viewpoints and stations are. How the two meet in the search box is described in [Places and Search](Places-and-Search).

> **Admin:** there is nothing to set up. The index is on by default on every install and has no switch in the admin panel: whether searches leave the instance is a property of the deployment, so it is decided with environment variables (see [Switching it off](#switching-it-off) and [Running your own copy](#running-your-own-copy)), where a second admin cannot flip it from a browser. **Admin → Settings → API Keys** opens with its card, marked **Recommended default**, and **What is in it** on that card lists the fields and sources described below.

## What it is

The index is built from the places dataset of the [Overture Maps Foundation](https://overturemaps.org), rebuilt monthly, and holds 73.6 million places worldwide. The TREK project serves it from `https://places.liketrek.com`, which is where every install asks unless it is pointed at another copy.

Beside the places themselves, the service keeps what the dataset does not have:

- **Opening hours**, from a layer of 5.7 million objects taken from OpenStreetMap, and after that from the hours a place publishes on its own website for machines to read.
- **Descriptions**, quoted from a place's own website, credited with the site's host name and linked back. About 43 percent of the places in the index carry a website address. The service reads each page once and every instance reads the result from there: your TREK server never opens a business's website itself.
- **An OpenStreetMap layer for suggestions.** It carries the stations, temples and bridges the index lacks, and every name a place is known under, so a suggestion shows the name that matched what you typed, with the name used on the spot underneath when the two differ.

### What it includes and what it does not

| Included | Not included |
|---|---|
| Name, coordinates, category, address, phone, email, website, description, opening hours, a stable id | Ratings, photos of ordinary businesses |

No open dataset has ratings or photos of ordinary businesses, at any price. A Google Maps API key stays the only way to those two; see [With a Google Maps API key](Places-and-Search#with-a-google-maps-api-key).

Names are the ones the index has, which are the names used on the spot. The index has no translations, so the category buttons over Tokyo show Japanese names whatever language TREK is set to.

## Where TREK uses it

| Where | What the TREK API does | When it has no answer or cannot be reached |
|---|---|---|
| Suggestions while typing | Answers on its own, from the index and its OpenStreetMap layer | Google or Amap when one holds the keyed slot, otherwise OpenStreetMap's search service (Nominatim) |
| Full search (search button or **Enter**) | Asked together with OpenStreetMap; the two lists are interleaved, TREK first | OpenStreetMap's answer on its own; the keyed provider only when both are empty |
| Opening a place picked from it | Address, contact details, opening hours and description | The place keeps what was saved with it |
| Category buttons on the trip map | Places of that category around the map centre | The public Overpass mirrors of OpenStreetMap |
| The [Road trip](Road-Trip#search-along-the-route) addon's search along the drive | Fuel, charging, rest areas, campsites and the other kinds it looks for | The public Overpass mirrors |
| Tours: the trail grades, surfaces and kinds of way along a planned tour | The OpenStreetMap tags of the ways the tour runs on, from its ways layer | The public Overpass mirrors |
| Tours: the signposted horse routes around the map view | The horse route relations in the view with their ways, from its routes layer | The public Overpass mirrors |
| Tours: the ski piste router (**Ski & winter** tours) | The winter layer: which build it serves, the index of ski areas, and the graph of runs, lifts and trails of one area, which your server keeps and checks once a day | A ski area already kept on your server still plans; a leg that cannot be planned gets a red row, *The piste data cannot be reached right now.*, with **Draw straight** |
| Booking imports, and stops given only by name in an imported Google Maps route | The coordinate of a venue, found by its name | OpenStreetMap's search service, which also resolves street addresses |
| Preparing a trip for offline use | Up to 3000 places around the trip, in one request | Nothing is cached, and offline search has nothing to answer from |
| MCP: `search_place` and `search_pois` | The same as the full search and the category buttons | The same fallbacks |
| Places near a point (**Places near this pin** in the place form, `POST /api/maps/nearby`, `search_nearby_places`) | Named places of any kind around the point, nearest first | Google Places when the index has nothing and a key exists, OpenStreetMap otherwise |

Where Google holds the keyed slot (a Google key, with neither Amap nor OpenStreetMap picked as the places provider), two things skip the index and OpenStreetMap for a search: the **Search Google instead** line under a result list (`provider: 'google'` on `search_place`) sends that one search to Google Places alone, and the admin switch **Search with Google only** sends every search and every suggestion there, `search_place` and **Places near this pin** included; the category buttons and `search_pois` keep asking the index. See [Google and Amap](Places-and-Search#google-and-amap).

Right-click reverse geocoding on the map does not use it: that is OpenStreetMap's (or Amap's inside mainland China, when Amap holds the keyed slot), through the [address search](#address-search) where the installation has a key.

### Why two sources

Measured over 128 places of a real trip, every one of them first found through the old search, the right place was among the first five results 50.0 percent of the time with OpenStreetMap alone, 51.6 percent with the index alone and 72.7 percent with both together. The gain comes from two sources answering instead of one, not from the index on its own. The first result alone is 5.5 points worse than OpenStreetMap alone, because the index always opens the list.

## Licences

What the index returns may be kept. That is what lets TREK store a place you pick from it and copy a trip's surroundings onto your device for offline search, which Google's terms rule out for Google's own results.

| Data | Source | Licence |
|---|---|---|
| Places | Overture Maps Foundation | CDLA-Permissive-2.0; the Foursquare share Apache-2.0, the AllThePlaces share CC0-1.0 |
| Opening hours, and the OpenStreetMap rows in suggestions | © OpenStreetMap contributors | ODbL-1.0 |
| Descriptions | The place's own website | Quoted and linked back, no licence claimed |

The OpenStreetMap layers are kept apart from the place rows and are joined only when an answer is put together, so the share-alike terms of the ODbL stay with the OpenStreetMap data and do not spread to the rest of the index. The service lists all of this at `/v1/attribution`. The name TREK Places API describes the interface, not the origin of the data, and it is not endorsed by the Overture Maps Foundation or the OpenStreetMap Foundation.

## Installation key and daily allowance

On its first search an installation registers itself with the service in the background: it solves a small proof of work (a few seconds on a Raspberry Pi) and receives a key, which TREK keeps encrypted in its database and renews on its own after 60 of its 90 days. Nobody clicks anything, and the first searches do not wait for it; until the key is there, requests go out the way they always did and are answered from a shared pool.

The key carries a random installation id and nothing else: no address, no host name, no user. It lets the service give each installation its own daily allowance instead of one pool per network, and it is sent only to the hosts in `TREK_SERVICES_HOSTS` (`places.liketrek.com`, `photon.liketrek.com` and `valhalla.liketrek.com` by default), never to a copy you run yourself or anywhere else.

**Admin → Settings → API Keys** shows on the card how this installation stands: connected, setting up its key, on the shared pool, switched off or revoked, with today's use, what is left and when the count starts again. **New identity** drops the key and asks for a new one; use it after cloning an installation onto a second machine, or after the key was revoked. Requests are counted per installation and, independently, per network; the counters are deleted after two days. Search terms and coordinates are never logged.

| Variable | What it does |
|---|---|
| `TREK_SERVICES` | `auto` (default) registers on first use; `off` sends no key, and searches use the shared pool |
| `TREK_SERVICES_KEY` | A key issued to you for this installation. It wins over the stored one, and the installation never registers by itself |
| `TREK_SERVICES_HOSTS` | Comma-separated hosts that receive the key over https |

An installation pointed at its own copy with `TREK_PLACES_URL`, or with `TREK_PLACES_ENABLED=false`, never registers.

## Address search

Where the installation holds a key, the OpenStreetMap half of the search, the suggestions of an install without the index or a key, the right-click on the map, the name of a pasted map link and the geocoding of imports ask the address search of the TREK services first: a [Photon](https://github.com/komoot/photon) instance at `photon.liketrek.com` with a planet-wide import of OpenStreetMap. Nominatim stays behind it. A refused key, a spent allowance, an error, no answer within 2.5 seconds, or nothing found at a right-clicked point all go to Nominatim, so the result reads the same either way. After four misses in a row TREK asks Nominatim alone for a minute.

It is asked in the language TREK is set to, without its region (`pt-BR` asks in Portuguese, `zh-TW` in Chinese), where the import holds names in that language: Arabic, Azerbaijani, Catalan, Chinese, Czech, Dutch, English, Estonian, French, German, Greek, Hungarian, Indonesian, Italian, Japanese, Korean, Polish, Portuguese, Russian, Slovak, Spanish, Swedish, Thai, Turkish, Ukrainian and Vietnamese. Any other language gets the names used on the spot. Opening a place and matching a Google place to its OpenStreetMap record stay on Nominatim.

It sends the words searched, the coordinate a search is ranked around, the point of a reverse lookup and that language, with the installation key and the `User-Agent` and nothing else. There is no shared pool: without a key, with `TREK_SERVICES=off`, or with `NOMINATIM_URL` set to a Nominatim of your own, TREK never asks it and searches the way it did before. `TREK_PHOTON_URL` points at another copy.

## What leaves your instance

Every request goes out from your TREK server, never from a browser, so the service sees your server's address and nobody else's.

| Sent | When |
|---|---|
| The words typed or searched | Suggestions and full search |
| One coordinate to rank results around: the centre of the open day's places, or of the trip's (see [The open day steers the search](Places-and-Search#the-open-day-steers-the-search)) | Suggestions and full search, when there is a hint |
| The map centre, a radius and the categories asked for | Category buttons and the Road trip search |
| The trip's area as a box | Preparing a trip for offline use |
| The index id of one place | Opening a place picked from the index |
| A venue name | Booking imports and route imports |
| The OpenStreetMap way ids a planned tour runs on | Tours trail grades, surfaces and kinds of way |
| The map view as a box, grown to a 0.05 degree grid | Tours horse routes |
| The id of a ski area | Tours ski piste router. No coordinate goes along: the service learns which area a planner loaded, never where anyone clicked. |
| An `X-TREK-Instance` header | Every request |
| A `User-Agent` of `TREK/<version>` | Every request |
| The installation key as an `Authorization` header | Every request to a host in `TREK_SERVICES_HOSTS`, once the installation has one |

The header carries an opaque token derived from your instance's own address, so the service can rate-limit each instance on its own instead of everyone behind one IP. Set `APP_URL` (or `ALLOWED_ORIGINS`): without either, the token is derived from the port alone, and two unconfigured installs on the same port share one rate-limit bucket.

Who is searching never goes along. No user, account, session, cookie or trip id is sent, and neither is the language TREK is set to or the one picked under **Place names** (see [Language of place names](Places-and-Search#language-of-place-names)). The service's own front page states that queries are not logged, that requests are counted per rate-limit bucket and nothing else, and that the instance token is not stored.

The requests use Node's default HTTP client, so an outbound proxy set with `HTTPS_PROXY` applies to them, and `NO_PROXY` can exempt the service's host. The official image already turns Node's environment proxy on; a source install needs `NODE_USE_ENV_PROXY=1` as well. See [Environment Variables](Environment-Variables#outbound-https-proxy).

The instance's own [Place Search Log](Places-and-Search#place-search-log) is a different thing: it is off by default, lives in your database and never leaves the instance.

## Switching it off

```yaml
services:
  app:
    environment:
      - TREK_PLACES_ENABLED=false
```

`false`, `0`, `off` and `no` in any casing switch the index off, as on every other boolean switch. A value that is not boolean-like at all aborts startup, and unset or blank leaves the index on.

With the index off, TREK stops asking it for suggestions, searches, category buttons, the Road trip search, import geocoding, offline downloads, the ways and horse routes of Tours and the piste data of ski tours, and place search works the way it did before 4.3.0:

- **Full search** goes to OpenStreetMap on an install without a key. With a Google key, Google answers every search, and with Amap selected, Amap does; OpenStreetMap is then no longer asked beside them.
- **Suggestions** come from Google or Amap when one holds the keyed slot, otherwise from OpenStreetMap's public search service. That service's usage policy does not allow autocomplete, so on a keyless install consider pointing `NOMINATIM_URL` at a Nominatim of your own.
- **Category buttons** and the **Road trip search** are answered by the Overpass mirrors.
- **Tours** read the grades of the ways under a tour and the horse routes around the map from the Overpass mirrors.
- **Ski & winter tours** have no piste data to plan on. The winter layer is the only source of it, so there is no Overpass fallback: no ski leg can be planned, even in an area kept earlier. Each leg gets a red row, *The piste data cannot be reached right now.*, and **Draw straight** draws it as a straight line. Nothing is downloaded or refreshed in the background. Hikes, bike tours and the other types are not affected. See [Ski data and its limits](Tours#ski-data-and-its-limits).
- **Imports** geocode through OpenStreetMap's search service.
- **Offline search** has nothing to answer from, because no places are downloaded.

The card in **Admin → Settings → API Keys** stays either way: it describes the index and has no switch.

## Running your own copy

`TREK_PLACES_URL` points an instance at a copy of the service you run yourself. It has to answer the same `/v1` API the public service does. Unset or blank means the public service; a trailing slash is stripped, and a value that is not a full URL aborts startup.

The address is read from your own configuration and is not a URL a user can type, so it does not go through the SSRF guard: a copy on your LAN or in the same Docker network works without `ALLOW_INTERNAL_NETWORK`.

> **Helm:** both variables go under `env:` in `values.yaml`, and the chart's ConfigMap passes them through. `TREK_PLACES_ENABLED` is passed whenever it is set at all, so an unquoted `false` or `--set env.TREK_PLACES_ENABLED=false` reaches the container too; see [How to Set Variables](Environment-Variables#how-to-set-variables).

### Related variables

| Variable | What it steers |
|---|---|
| `TREK_PLACES_ENABLED` | Whether the index is asked at all |
| `TREK_PLACES_URL` | Which copy of the index is asked |
| `TREK_SERVICES`, `TREK_SERVICES_KEY`, `TREK_SERVICES_HOSTS` | The installation key, see [Installation key and daily allowance](#installation-key-and-daily-allowance) |
| `NOMINATIM_URL` | The OpenStreetMap half of the full search, right-click reverse geocoding, OpenStreetMap place details and import geocoding. Set, it also keeps them off the [address search](#address-search) |
| `TREK_PHOTON_URL` | Which copy of the [address search](#address-search) is asked |
| `OVERPASS_URL`, `OVERPASS_TIMEOUT_MS` | The Overpass mirrors behind the category buttons, the Road trip search and the ways and horse routes of Tours when the index has no answer |

Defaults and details for each are on [Environment Variables](Environment-Variables).

## When the service cannot be reached

Nothing breaks. Every call has a short deadline, 3.5 seconds for a search, 10 seconds per batch of tour ways, 20 seconds for an offline download or a view of routes, and for the winter layer 5 seconds for its build, 15 for the index of ski areas and 30 for one area, and every call site falls back to what TREK did before the index existed. After four calls in a row that got no answer or a server error, TREK stops asking for a minute and takes the fallback straight away, so an instance that cannot reach the service does not pay the deadline on every keystroke. The first call after that minute tries again, and one answer resets the count. Place search and the layers (the ways and routes of Tours and the winter layer) are counted apart, so a busy answer to a heavy tour never pauses the search. When a tour's ways stop answering part way, Tours keeps the batches that came and asks the Overpass mirrors only for the rest. Ski tours have no such second source.

| What you see | What it usually means |
|---|---|
| A search lists only **OpenStreetMap** results | The index had nothing for it, or turned down a single common word because there was no location hint to narrow it. Add a place or two to the trip, or open a day, and the index joins in. |
| `TREK Places search failed, falling back: …` in the server log | The same, or the service could not be reached. The text after the colon says which. |
| `TREK Places API unreachable, not retrying yet` in the server log | Four calls in a row got no answer and TREK is waiting out the minute. Check that the server can reach `places.liketrek.com` (or your `TREK_PLACES_URL`) and your proxy settings. |
| `TREK Places area lookup failed: …` in the server log | A trip's surroundings could not be downloaded for offline use. The trip itself still syncs. |
| `[TrekPlaces] /v1/ways: …; asking the Overpass mirrors instead` (or `/v1/routes`) in the server log | Logged once per reason: the layer is switched off, not built yet on the service, or did not answer. Tours keeps using Overpass. |
| The category buttons take seconds | They are being answered by Overpass, because the index had nothing for that area or is switched off. |

## See also

- [Places and Search](Places-and-Search): how the index, OpenStreetMap, Google and Amap meet in the search box
- [Offline Mode and PWA](Offline-Mode-and-PWA): keeping a trip on the device
- [Environment Variables](Environment-Variables): every variable named on this page
- [Plugin Cookbook](Plugin-Cookbook#answer-place-searches-from-your-own-index): adding a third index of your own to the search
