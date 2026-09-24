# Places and Search

Places are the building blocks of your trip. You can add them by searching, pasting a map link, entering coordinates, or importing a file.

![Places sidebar](assets/PlaceAutocomplete.png)

## Adding a place

Click **Add Place/Activity** at the top of the Places sidebar to open the place form. While a day is open the button splits in two: **New place** adds the place to the trip, and **To day** (*Add to the open day*) puts it straight onto that day. In a narrow sidebar both drop to their icons.

You can also **right-click anywhere on the map** to create a place at that exact spot. The address is filled in by reverse geocoding through OpenStreetMap, or through Amap inside mainland China when Amap holds the keyed slot (see [Which provider answers](#which-provider-answers)).

## Searching for a place

Place search needs no API key. Two sources answer it together: the **TREK API**, TREK's own index of 73.6 million places, and **OpenStreetMap**. The index is strongest on businesses such as restaurants, shops and hotels; OpenStreetMap is where the temples, bridges, viewpoints and stations are. What the index is, where its data comes from and what TREK sends to it is on its own page: [TREK Places API](TREK-Places-API).

### Suggestions while you type

After 2 or more characters, and a 300 ms pause, suggestions appear in a dropdown under the search box.

- Use **↑ / ↓** to move through them, **Enter** to pick one, **Esc** to close the list.
- Suggestions come from the TREK API, from its index and from an OpenStreetMap layer it keeps. A suggestion from that layer shows the name that matched what you typed, with the name used on the spot underneath when the two differ.
- Only when the TREK API has nothing does TREK ask the keyed provider (Google or Amap), or, without one, OpenStreetMap's own search service.

### The full search

Press **Enter** without picking a suggestion, or click the search button, to run a full search. It asks the TREK API and OpenStreetMap at the same time and interleaves their answers, TREK first, up to ten results. A place both of them know (within 60 metres, with a matching name) is listed once.

A Google or Amap key does not change this. The keyed provider is asked only when the TREK API and OpenStreetMap both come back empty; see [Google and Amap](#google-and-amap).

Installed [search plugins](Plugin-Cookbook#answer-place-searches-from-your-own-index) add their results below the core list, on the full search only.

### Where each result came from

On the desktop every row, in the suggestions and in the search results, carries a small mark naming its source: **TREK**, **OpenStreetMap**, **Google** or **Amap** (高德地图, or 高德地圖 in traditional Chinese). On the phone the suggestions carry it. A list that mixes the TREK API and OpenStreetMap stays readable that way. Results from the offline cache carry no mark; see [Searching offline](#searching-offline).

### The open day steers the search

Every search is hinted with the area you are planning, so "Hase-dera" finds the temple beside your hotel in Kamakura rather than the one of the same name in Nara. The hint is taken from:

1. the places on the day you have open, or, with no day open or an empty one,
2. all of the trip's places.

A hint that reaches further than about 60 km from its centre is dropped instead of sent. The middle of a round trip sits in open country between the cities, and pointing the search there ranks worse than no hint at all. Measured over 126 places of a real trip, the day hint put the right place among the first five results 70.6 percent of the time, against 54.8 percent with no hint and 57.1 percent with a hint around the whole trip.

Without any hint, the TREK API turns down a single common word such as `bar` as too broad, and OpenStreetMap answers that search on its own. Once the trip has a place or two, the index joins in.

The place form on the desktop and the search sheet on the phone use the same hint.

## Google and Amap

### With a Google Maps API key

> **Admin:** The Google Maps API key is instance-wide, set in **Admin → Settings → API Keys → Google Maps API Key**. It is stored encrypted at rest and used for every member of the instance.

A key does not buy a different search by itself. Google fills the slot that answers once the TREK API and OpenStreetMap both have nothing, and it adds what only a commercial provider has: ratings and photos. No open dataset carries either of those for ordinary businesses. A place found through Google keeps its Google id, so its details, rating and photos keep coming from Google.

That order means a search the index answered with the wrong place never reaches Google on its own. Two ways to send it there:

- **Per search:** under a result list that did not come from Google, a small line reads **Not the right place? Search Google instead**. It sends the same query to Google Places alone, once, and the results carry the Google mark. The line only appears where a search can reach Google at all: an instance with a Google key, and with neither Amap nor OpenStreetMap picked as the provider, the same rule the switch below follows. Desktop form and phone search sheet alike. The MCP tool `search_place` does the same with `provider: 'google'`, see [MCP-Tools-and-Resources](MCP-Tools-and-Resources).
- **For every search:** the switch **Search with Google only** in the key's block (below) sends every search and every suggestion to Google Places and asks nothing of the TREK API or OpenStreetMap, from the app and from `search_place` alike. Off, the order above applies. The switch does nothing without a key, and nothing while Amap or OpenStreetMap is picked as the provider. Switching it on or off is recorded in the [Audit Log](Audit-Log) as `admin.places_google_only`.

The key's block carries five switches under **What the key may be used for**:

| Switch | What it covers |
|---|---|
| **Place Photos** | Google photos. Wikimedia pictures are unaffected. |
| **Place Autocomplete** | The suggestions while you type. |
| **Place Details** | The details of a place: hours, rating, website. |
| **Place Enrichment** | The **Place details** column in the place form, see [below](#place-details-while-searching). |
| **Search with Google only** | Every search and every suggestion goes to Google Places instead of the TREK API and OpenStreetMap. Off by default. On, every list already comes from Google, so the per-search line above has nothing to offer and does not appear; off, the line appears under lists the TREK API or OpenStreetMap produced. |

> **Place Autocomplete and Place Details act on every provider**, not only on Google. Switched off, the suggestion dropdown stays empty and details lookups stop for the TREK API and OpenStreetMap too; the full search keeps working. Leave both on unless that is what you want.

> **API key restrictions:** TREK calls the Google Places API from the server, not the browser. If you apply **HTTP referrers** restrictions to your key in Google Cloud Console, you must also set `APP_URL` in your environment: TREK sends it as the `Referer` header on every outbound Google API request, and without it Google rejects every server-side call with `REQUEST_DENIED`. For server-side deployments, **IP address** restrictions are simpler and need no extra configuration. See [Troubleshooting](Troubleshooting) if photos are missing after adding a key.

### With an Amap (高德地图) API key

> **Admin:** Set the key in **Admin → Settings → API Keys → Amap (高德地图) API Key**, then pick **Amap (高德地图)** under **Place search provider** in the same card. It needs a **Web 服务** (web service) key from [console.amap.com](https://console.amap.com/dev/key/app); a JS API key is a different credential and is rejected.

Google Places is unreachable from most networks inside mainland China, and OpenStreetMap knows very little about Chinese restaurants, shops and shopping centres. With Amap selected it takes the slot Google otherwise holds: the TREK API and OpenStreetMap are still asked first, and Amap answers when they have nothing, in Chinese, with ratings, phone numbers and opening hours where Amap has them. Suggestions, place details and the reverse geocoding behind right-click-to-add-a-place go through Amap as well. Rows that came from Amap carry an Amap mark like every other source.

Amap does not supply place photos here. Its images come with no licence statement TREK could show next to them, so an Amap place gets its picture from Wikimedia Commons like any other, with the credit and licence attached.

A place remembers where it came from. One picked from Amap keeps its Amap id, one picked from Google keeps its Google id, and each keeps opening against the provider that knows it, whichever provider the admin selects later.

Amap links can be pasted into the search box too; see [Pasting a map URL](#pasting-a-map-url). A place in China also offers **高德地图** in its **Navigation** menu, whichever provider answers searches; see [Opening a place in a map app](#opening-a-place-in-a-map-app).

### Which provider answers

**Admin → Settings → API Keys → Place search provider** decides only who fills the keyed slot beside the TREK API and OpenStreetMap. Those two are asked either way.

| Setting | Who fills the keyed slot |
|---|---|
| `Automatic` | Google when a Google key is set, otherwise Amap when an Amap key is, otherwise nobody. The default, and what every install had before Amap existed: adding an Amap key never moves an install off Google on its own. |
| `Google Places` | Google. With no Google key the slot stays empty rather than falling to Amap. |
| `Amap (高德地图)` | Amap. With no Amap key the slot stays empty. |
| `OpenStreetMap` | Nobody, whatever keys are configured. Search runs on the TREK API and OpenStreetMap alone. |

When the selected provider has no key, the card says so: place search is then answered by the TREK index and OpenStreetMap alone.

To keep searches from reaching the TREK API at all, set `TREK_PLACES_ENABLED=false` on the server; see [Switching it off](TREK-Places-API#switching-it-off).

## Place details while searching

On desktop the place form carries a **Place details** column to the left of the form. Pick a search result and it fills in on its own, with no extra click, and nothing changes about the usual flow of searching, picking and saving. If you already know the place, ignore the column and save as before.

The column shows what it can find:

- **Pictures** near or of the place. Click one to make it that place's thumbnail; click it again to clear the choice. The picture then appears everywhere the place does (list, map marker, itinerary, PDF export and shared trips), exactly like a [custom place image](#custom-place-image).
- **A rating**, for a place that came from Google or Amap.
- **Opening Hours**: today's hours up front and the whole week a click away, with an open or closed badge worked out in the place's own time zone. When the hours cannot be read reliably there is no badge rather than a wrong one.
- **Good to know**: facts such as cuisine, outdoor seating, takeaway, step-free access, Wi-Fi or a menu link, where OpenStreetMap carries them.
- **A description**, when one is available. It is *not* written into the place automatically. Use **Use this text** to copy it into the description field; the button is disabled with *Clear the description field first* while you have a description of your own, so nothing you wrote gets overwritten.

One credit line sits under the picture grid, and it belongs to the picture in play: the tile you are hovering, or failing that the one you picked, or the first picture before you have done either. It names the author, links that name to the source page, and adds the licence with a link to its terms. The other tiles carry author and licence as a tooltip only, without the links. Google's pictures get an author line and nothing else, because Google grants no reusable licence for them. Most Wikimedia Commons pictures are CC BY or CC BY-SA, which means the credit has to travel with the picture, so once you pick one, the credit stays visible under the thumbnail in the place's detail panel too.

### Where the information comes from

**Pictures** come from Wikimedia Commons, resolved from the place's own tags first: the Wikidata image, the lead image of its Wikipedia article, its Commons category. Only when those turn up too few does TREK look for pictures taken nearby, within 60 metres, and never for shops, restaurants, cafés and other everyday businesses. Two percent of those have a picture on Wikimedia, against 70 percent of churches, so a picture taken nearby is almost always of the building across the square. A missing picture is the honest answer there.

**Descriptions** come from the first source that has one:

1. The OpenStreetMap `description` tag, for a place from OpenStreetMap.
2. The Wikivoyage article, then the Wikipedia article, that the place is tagged with, in your language where one exists. TREK resolves the article from the tag rather than guessing it from the name, so an ambiguous name never pulls in the wrong article.
3. The place's own website, for a place from the TREK API: the summary the site publishes for machines, credited with the site's host name and linked back. This is what gives restaurants, shops and hotels a description at all. Your server never opens the website itself; the TREK API has read it once for everyone.
4. Google's editorial summary, with a Google key and **Place Details** on.
5. The article about the chain a branch belongs to, headed **About the chain** with the note *This describes the chain, not this branch.*

**Opening hours** come from OpenStreetMap first, because an OpenStreetMap entry describes that exact building where a chain's website often carries one set of hours for every branch. After that come the hours a place from the TREK API publishes on its own site, and for a place found through Google, Google's hours.

Pictures are copied to your own server and served from there. Nothing is loaded directly from Google or Wikimedia while you browse, so no visitor's address leaves your instance.

> **Admin:** the column is controlled by **Place Enrichment**, under **What the key may be used for** in the Google Maps API Key block of **Admin → Settings → API Keys**, and it is on by default. Wikipedia and OpenStreetMap are always used; the Google half additionally follows **Place Photos** and **Place Details**. Turning Place Enrichment off leaves the column with a short note and makes no outbound calls.

The column is desktop-only.

## Exploring the map by category

With **Explore places on the map** switched on in [Display Settings](Display-Settings#explore-places-on-the-map), the trip map carries a row of category buttons: **Restaurants**, **Cafés**, **Bars & nightlife**, **Accommodation**, **Sights**, **Museums & culture**, **Nature & parks** and **Activities**. Tap one to show that kind of place around the part of the map you are looking at. After you move the map, **Search this area** runs it again for the new view.

The TREK API answers these first, from the map centre out to a radius that covers the view, at most 20 km. When it has nothing for the area, or cannot be reached, the public Overpass mirrors of OpenStreetMap answer instead, narrowed to a window of half a degree around the centre; `OVERPASS_URL` and `OVERPASS_TIMEOUT_MS` on [Environment Variables](Environment-Variables) steer those. Results from the TREK API come with address, website, phone and opening hours where the index has them, under the names used on the spot rather than translations. The [Road trip](Road-Trip#search-along-the-route) search along the drive asks the same two sources.

## Searching offline

When a trip is kept for offline use, TREK also downloads the places around it from the TREK API: one request of up to 3000 places, in a box around the trip's places with some margin, at most 1.5 degrees a side (a trip spread wider gets its centre). For a city the size of Rostock that is about a megabyte. The download is repeated only when the trip's area changes, and it happens whether or not **Store map tiles offline** is on: the tiles are the big part, the places are not.

With no network, or with **Force offline mode** on, suggestions and the full search then answer from that cache: places whose name starts with or contains what you typed, ignoring case and accents, across every trip you keep offline. Picking one fills in its name, address, coordinates, website and phone from the cache. Answers from the cache carry no source mark, because they are not a live answer from anyone, and they are never written to the [Place Search Log](#place-search-log).

Switching a trip's offline storage off removes its cached places with the rest of its data, and **Clear cache** in **Settings → Offline** removes them all. With the TREK API switched off nothing is downloaded, and offline search has nothing to answer from. See [Offline Mode and PWA](Offline-Mode-and-PWA).

## Place Search Log

> **Admin:** switch it on under **Admin → Settings → API Keys → Place Search Log**, on the desktop or the phone. It is off by default.

With the log on, every time somebody picks a place from a list of search results or suggestions, TREK writes one row: what was typed, the language TREK was set to, the hint coordinate, which source answered, where in the list the picked place stood and how long the list was, and the picked place's name, id and coordinate. Coordinates are rounded to three decimals, about 100 metres. A row holds no user, no trip and no session, and a search nobody picked from leaves no row at all.

It exists so a different place index can be measured against real searches later: how often was the place people actually wanted among the first five results.

- **Nothing leaves the instance.** The log lives in your database, and only an admin can read it.
- **Retention:** rows older than 180 days are deleted every night, whether the log is on or off, so switching it off also lets what it collected age out.
- **Reading and wiping:** there is no screen for it. Signed in as an admin, `GET /api/place-shadow/summary` returns the row count, the counts per source and how often the pick was the first result or among the first five. `GET /api/place-shadow/export` returns the rows oldest first, 2000 per page; pass the `nextAfter` value back as `?after=` for the next page. `DELETE /api/place-shadow` deletes every row.
- Switching the log on or off is recorded in the [Audit Log](Audit-Log) as `admin.place_shadow`.

## Pasting a map URL

Paste a `maps.app.goo.gl/…`, `goo.gl/maps/…`, or `maps.google.*/…` URL directly into the search box and press the search button. TREK resolves it server-side and fills in the name, address, and coordinates.

Amap links work the same way, as long as the link carries a coordinate: `uri.amap.com/marker?position=…` share links, map URLs with the coordinate in the address, and `surl.amap.com` short links that resolve to one of those. A bare `amap.com/place/…` POI page is an id and nothing else, and TREK answers it with an error rather than guessing where it is. Coordinates are converted from GCJ-02 to WGS-84 on the way in, so the place lands where it belongs on every other map.

## Entering coordinates manually

**Paste** a `lat, lng` pair (e.g. `48.8566, 2.3522`) into the **Latitude** field, comma, semicolon or space separated. TREK detects the pair and fills both coordinate fields at once. This works on paste only: the coordinate fields accept digits, a decimal point and a leading minus, so typing a pair by hand drops the separator and leaves a single invalid number (`48.85662.3522`) behind. Type the two values into their own fields instead.

## Place fields

<!-- TODO: screenshot: Place form with all fields visible -->

| Field | Notes |
|---|---|
| Name | Required |
| Description | Free text |
| Notes | Free text, max 2 000 characters |
| Address | Free text |
| Latitude / Longitude | Decimal degrees |
| Category | Pick an existing category or type a new name to create one inline (default color `#6366f1`, icon `MapPin`) |
| Start time / End time | Shown only when editing an existing place |
| Website | URL |
| File attachments | Click the Paperclip icon to attach a file, or paste an image or PDF from the clipboard. The Paperclip takes anything on the instance's **Allowed File Types** list (by default jpg, jpeg, png, gif, webp, heic, pdf, doc, docx, xls, xlsx, txt, csv, pkpass, pkpasses, md and markdown), plus video, which is exempt from that list. See [Documents-and-Files](Documents-and-Files) |

Two inline warnings are shown when editing times: one if the end time is set to a value before or equal to the start time, and one if the times overlap with another place already assigned to the same day.

## Costs for a place

With the [Costs/Budget addon](Budget-Tracking) enabled, the place form carries the same **Costs** block that bookings and transports have. **Create expense** saves the place and then opens the Costs editor for a new expense linked to it: the museum ticket, the guided tour, the entry fee. Once linked, the block shows that expense with edit and remove actions.

The expense belongs to the **place**, not to a day. Putting the same place on several days does not multiply it: you bought the ticket once. If you really pay each time, add a second expense from the Costs tab.

Deleting the place deletes its linked expense too, the same way deleting a booking does.

## Rating a place

Every trip member can rate a place from 1 to 5 stars, even when place editing is restricted to certain members. Open the place's detail panel: the rating row shows the stars, the average with the number of votes in brackets, and the avatars of who voted; rest the pointer on it to see everyone's stars. Click a star to cast your vote, and click the same star again to clear it. A place nobody has rated reads **Not rated yet**.

The average also sits beside the place's name in the places list and on a marker's hover card on the map; a marker that carries no order badge shows it as a small disc in its corner instead. To narrow the list, the star button in the sidebar header (**Filter by rating**) picks a floor from 1 to 5 stars and keeps only the places whose average reaches it.

Saved places in [Collections](Collections) are rated the same way. Saving a trip place to a list or copying a list place into a trip carries the votes along, but only those of people who are members on both sides.

> **AI / MCP:** `rate_place` sets or clears your own vote; see [MCP-Tools-and-Resources](MCP-Tools-and-Resources).

## Custom place image

By default a place's thumbnail is fetched automatically (from Google or Wikimedia when the place was imported or matched, otherwise a category icon). To use your own photo instead, open the place's detail panel and click its round thumbnail. Pick an image and it becomes that place's thumbnail everywhere (list, map marker, itinerary, PDF export and shared trips). A small remove button on the thumbnail clears the custom image and restores the automatic default. Accepted formats are JPG, PNG, GIF and WebP (HEIC is converted automatically), up to 20 MB.

The same control is available on saved places in [Collections](Collections#place-detail).

## Opening a place in a map app

The **Navigation** button in a place's detail panel, on the phone's place sheet and on a saved place in Collections opens a short menu of map apps, in this order: **Google Maps**, **Waze**, **Apple Maps**, **OpenStreetMap**, **CoMaps** and, for a place in China, **高德地图** (Amap). Waze starts navigating straight away; the others open the place, and starting navigation from there is one tap. When only one app is available the button opens it directly.

Which entries appear depends on the place and on where you are, not on the search provider the admin picked. Apple Maps is left out on Android. Amap is offered by where the place is, because it only has a map of China: a stop in Shanghai gets it whoever is planning the trip, a stop in Lisbon never does. Waze, Apple Maps, CoMaps and Amap need the place's coordinates; Google Maps and OpenStreetMap can still open a place that has none, Google from its name and address, OpenStreetMap from its name. Coordinates handed to Amap are converted to its own datum on the way out, so the pin lands on the right street.

In the installed app the map app takes over the current window rather than a new tab, so coming back lands you where you were.

## Importing multiple places

Drag a `.gpx`, `.kml`, or `.kmz` file onto the Places sidebar to import all waypoints or features at once. You can also import a shared list with the **List Import** button in the sidebar header (it reads **Google List** when Google is the only list source): both Google Maps and Naver Maps list URLs are supported, and a shared Google Maps route works too, its stops becoming places in driving order. Stops a route gives only by name are looked up through the TREK API first.

Imported tracks each get their own line colour so multiple routes stay apart on the map; you can override it per track from the place details. See [Map Features](Map-Features) for the details.

Importing the same list again does not duplicate what is already in the trip. A place is recognised by the provider id it was imported with (Google place id, Google feature id, or OSM id) before its name or its coordinates are considered, so renaming a place in TREK, or moving its pin, does not make it come back as a second copy on the next import.

> **Admin:** with a Google Maps API key in **Admin → Settings → API Keys**, the list import offers **Enrich places via Google**, which looks up each imported place to fill in photos, address and contact details, one Google lookup per place. Without a key the import works the same, just without that option.

**See also:** [TREK Places API](TREK-Places-API) · [Day-Plans-and-Notes](Day-Plans-and-Notes) · [Map-Features](Map-Features) · [Offline-Mode-and-PWA](Offline-Mode-and-PWA) · [Tags-and-Categories](Tags-and-Categories)
