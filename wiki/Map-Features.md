# Map Features

The trip planner map shows your places, route lines, transport overlays, and your current location in real time.

<!-- TODO: screenshot: trip map with place markers and route lines -->

![Trip Planner Map](assets/TripPlannerWithPlane.png)

## Map renderer

TREK uses **Leaflet** by default. If you configure a Mapbox access token in Settings → Map, the map upgrades to **Mapbox GL** with higher-quality tiles, 3D buildings, and terrain. If Mapbox GL is selected but no access token is present, TREK falls back to Leaflet automatically so the map is never blank.

The scopes required for Mapbox GL are:
- STYLES:TILES
- STYLES:READ
- FONTS:READ
- DATASETS:WRITE
- VISION:CREATE

## Place markers

Each place is shown as a circular marker:

- **Photo marker** — if the place has a photo (proxied from Google or another provider), that image appears in the circle.
- **Icon marker** — if no photo is available, a category-colored icon is shown instead.
- **Selected place** — the active place has a larger marker.
- **Order badge** — a small badge at the bottom-right of each marker shows the order number(s) of that place within the day's itinerary. If the place appears on multiple days, all order positions are shown separated by `·`.

When zoomed out, nearby markers are grouped into clusters. Clicking a cluster zooms the map to fit its members; at maximum zoom the cluster spiderfies to show individual markers.

## Route lines

When you have a day selected, a dark dashed line connects consecutive places in that day's order.

## Route time pills

At zoom level 12 or higher, small pill-shaped labels appear between consecutive places and show the estimated **walking time** and **driving time** for each segment. Below zoom 12 they are hidden to keep the map clean.

> **Requires:** Settings → Display → **Route calculation** must be ON. When this setting is OFF, TREK never queries the routing service, so no pills are calculated or drawn at any zoom level.

## Reservation and transport overlay

Flights, trains, cars, and cruises can be drawn as overlays between their endpoint places. Overlays are **off by default** — activate each reservation individually by clicking the small **Route** icon next to the booking row in the day sidebar. The selection is remembered per trip in your browser. Click the icon again to hide it.

- **Flights and cruises** — geodesic great-circle arcs
- **Cars, buses, taxis and bicycles** — real routed lines that follow actual roads, fetched on demand from a public OSRM router (driving for car/bus/taxi, cycling for bicycle). A straight line is shown while the route loads and kept if routing fails or the trip is very long (~2000 km+)
- **Trains** — a straight line between the endpoints; a multi-leg train draws its whole station chain (from → stop → to)
- **Antimeridian crossings** — routes that cross the date line now draw as one continuous arc instead of splitting into disconnected segments at the map edges
- **Endpoint markers** — pill-shaped labels with the transport icon and the endpoint code (e.g. IATA airport code) or location name
- **Flight stats** — a floating label on the arc shows departure code → arrival code and, when times are available, the duration and great-circle distance. Stats labels are only rendered for flights and require Settings → Display → **Route calculation** to be ON.
- **Confirmed reservations** — solid line; **Pending** — dashed line

> **Admin:** Whether endpoint text labels appear on the endpoint markers is controlled by the **Booking route labels** setting in Settings → Display (`map_booking_labels`).

## Plugin map markers

Installed plugins can add their own markers to the trip map — for example to show bookings on the map (#587). A plugin implements the `mapMarkerProvider` hook and returns marker specs (`id`, `lat`, `lng`, and optional `label`, `popupText`, `url`, `icon`, `tone`); TREK range-checks the coordinates, length-caps the text, allows only http/https/mailto links, and draws them itself. Markers are additive and fail-safe: a plugin never runs code on the map canvas, and one that errors or is slow simply contributes nothing.

> **Plugins:** requires the `hook:map-marker-provider` permission. See [Plugin-Development](Plugin-Development) for the hook contract.

## Location button

The location button sits in the bottom-right corner of the map on mobile devices and cycles through three states:

| State | Icon | Behavior |
|---|---|---|
| Off | Outline locate | Location not tracked |
| Show | Solid blue locate | Your position is shown as a dot |
| Follow | Solid blue arrow | Map re-centers as you move |

If geolocation is denied or unavailable, the button turns red.

## Right-click / middle-click to create a place

Right-click anywhere on the **Leaflet** map to open the Place form with the clicked coordinates and a reverse-geocoded address already filled in.

On the **Mapbox GL** map, right-click is reserved for the built-in rotate/pitch gesture, so use **middle-click** instead to trigger the same Place form.

**See also:** [Places-and-Search](Places-and-Search) · [Day-Plans-and-Notes](Day-Plans-and-Notes) · [Route-Optimization](Route-Optimization) · [Map-Settings](Map-Settings) · [Reservations-and-Bookings](Reservations-and-Bookings)
