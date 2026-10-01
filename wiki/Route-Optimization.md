# Route Optimization

TREK works out the driving, walking and cycling times between the places of a day, draws the route on the map, can reorder the places into a shorter route, and hands the day to a map app for navigation. All of it sits in the route bar at the foot of the selected day.

![The route bar of the selected day: the Route toggle, the travel mode, Optimize, and the buttons for Google Maps and CoMaps](assets/PlanRouteBar.png)

## The route bar

Click a day's head band to select it. Its card then ends in the route bar, as long as the day can be routed: two or more places, one located place that the day's accommodation can frame, or a transfer day from one hotel to another. On a phone the same controls sit in the **Daily Overview** sheet, opened from the pill above the plan timeline.

| Control | What it does |
|---|---|
| **Route** | Draws the day's route on the map and shows the travel time between each pair of stops in the day. See [Route lines](Map-Features#route-lines). |
| Travel mode | **Driving** (car), **Walking** (foot), **Cycling** (bike), and any mode a plugin adds (bolt). It sets the day's default mode. |
| **Optimize** | Reorders the day's free places into a shorter route. See [Optimize route](#optimize-route). |
| **Open in Google Maps** | Hands the day's stops to Google Maps as a route. |
| **Open in CoMaps** | Hands the same day to CoMaps for offline navigation. |

Time that plugins add to the day, such as a charging stop, shows under the bar as **+X min**.

## Route calculation

TREK uses **OSRM** (Open Source Routing Machine) to calculate routes between consecutive places in the selected day. No API key is required. By default that is the public FOSSGIS OSRM, which allows about one request a second. An admin can point TREK at an OSRM of their own under **Admin → User Defaults** (**Own routing engine**, restart required); see [Road-Trip](Road-Trip#routing-engines).

The travel mode in the route bar offers **Driving**, **Walking** and **Cycling**, each routed on the matching OSRM network (on the public servers `routed-car`, `routed-foot` and `routed-bike`; an own OSRM is asked under the profiles `driving`, `foot` and `bike`). Installed plugins can add further profiles: a plugin with the `routeProvider` hook, for example an e-mobility plugin that plans charging stops, appears as an extra mode next to the built-in ones. When such a profile is selected, that plugin computes the day's route: its geometry is drawn on the map, planned stops such as chargers appear as small dots on the line, and the connectors between the stops show the plugin's travel times plus any note it attaches ("25 min charge"). If the plugin fails or times out, TREK falls back to straight lines exactly as it does on an OSRM outage.

The mode you pick is the **day's** default. It is stored on the day, so each day of a trip can differ and the choice survives a reload.

A single leg can override the day default. With **Route** on, click the connector between two stops (*Change travel mode*) and pick **Driving**, **Walking**, **Cycling** or a plugin profile for that leg alone, or **Use day default** to clear the override again. The same menu sits on the connectors to and from the day's accommodation and on the connector after a transport booking, where it sets the mode of the leg *arriving* at the next stop. Every connector shows the icon and the time of the mode its leg was actually drawn with.

When the trip has a start and an end date and you may edit the day, that menu also carries **Public transit**. It opens the automated transit search (see [Transport-Flights-Trains-Cars](Transport-Flights-Trains-Cars)) already filled in with the leg's two endpoints and the departure time of the stop you are leaving.

Route segments reset at any transport booking (flight, train, car, bus or cruise) between two places: that leg is not driven or walked, so no ground route is drawn across it.

### Leaving a stop out of the route

A place can stay on its day without being part of the route: **Leave out of route** in the place's **…** menu in the day (on a phone, the route icon on the day's chip in the place sheet). The route then runs from the stop before it straight to the one after, the connectors skip it, and the row carries an **Off route** pill. **Add back to route** in the same menu undoes it. See [Leaving a stop out of the route](Day-Plans-and-Notes#leaving-a-stop-out-of-the-route).

### Counting routing requests

> **Admin:** counting is on by default. To switch it off, set `route_usage_enabled` to `false` in the `app_settings` table of the database; there is no screen for it.

Every route is worked out in the browser against the routing host, so the server never sees a request of its own. The browser therefore tallies what it asks for and posts the totals in batches, and the instance keeps one row per day, routing profile and kind of request: how many requests, how many waypoints, roughly how many kilometres, how many came back without a route, and whether they went to the public hosts or to your own engine. Counters only: no coordinate, no route, no user and no trip are in them, and they never leave the instance.

Signed in as an admin, `GET /api/route-usage/summary` returns the totals, the requests per day, the busiest day, the split per profile and per kind of request, and the share answered by a self-hosted engine. `DELETE /api/route-usage` wipes the counters. Rows older than 400 days are deleted every night, whether counting is on or off.

## Route display

- The route runs through the day's stops on the map, in their planned order. Stretches routed for walking are drawn dashed, so they read apart from the drive.
- Between each pair of consecutive stops, a slim connector row in the day carries that leg's travel time and distance, with an icon for the mode it was routed in.
- Plugins can attach time entries to the day (planned charging time at a stop, a security buffer before a flight). They appear as slim rows under the place or booking they belong to, and their minutes add up to the **+X min** under the route bar.

## Optimize route

**Optimize** in the route bar reorders the places of the selected day into a shorter route. A **nearest-neighbour** pass produces a good starting order, then a **2-opt** pass untangles the crossings that pass leaves behind; both measure straight-line distance. A message confirms *Route optimized*, or *Route optimized from your accommodation*.

With **Optimize route from accommodation** (Settings → General → Travel & map, on by default) the run is anchored on the day's hotel: a loop out from and back to it, or a hotel-to-hotel run on a transfer day. With the setting off, or on a day whose accommodation has no coordinates, it starts from the first place instead. A day with fewer than three places is left alone on desktop, and the phone's day sheet only offers the button from three up. The **Optimize** action in the plan screen's **Plan** mode on a phone has no such floor: two movable places with coordinates are enough, and with a hotel anchoring the run even those two can swap.

Only free places are reordered. A place keeps its slot if you locked it, or if it has a time set, since a timed stop is anchored by its time. To lock a place, click its photo or category tile in the day (*Keep position during route optimization*); a lock covers the picture until you click it again (*Click to unlock*). Locked and timed stops stay where they are, and the reordered ones fill the gaps between them. On a phone there is no lock, so only a set time pins a stop.

**Undo** in the head band of the days column reverses an optimization.

## Open the day in a map app

Two buttons in the route bar hand the current day to an external map app, both with its places in planned order, framed by the day's accommodation exactly the way the drawn route is.

**Open in Google Maps** builds a `https://www.google.com/maps/dir/lat,lng/lat,lng/…` URL containing all stops in order and opens it in a new tab. A day with a single stop opens as a map search on that point instead.

**Open in CoMaps** (the compass) hands the same day to CoMaps for offline navigation and carries the day's travel mode with it: the day's own default, or the current route profile when the day has none. A day of exactly two stops goes over as a real turn-by-turn route in that mode (walking as pedestrian, cycling as bicycle, everything else as vehicle). Any other day goes over as named pins, because CoMaps' route link takes a start and a destination and nothing between them, and handing over the whole day beats quietly dropping the middle of the plan. For the full itinerary as one navigable track, use the [GPX export](Map-Features#exporting-a-trip-as-gpx).

Both buttons are on the phone as well, in the day sheet.

## Planning a whole drive

For a trip that is one long drive, the [Road-Trip](Road-Trip) addon adds a **Road trip** view beside **Days**: the whole trip as one chain of legs with arrival times, daily travel times, driving limits, search along the route, via points and avoidance of toll roads, motorways and ferries.

**See also:** [Day-Plans-and-Notes](Day-Plans-and-Notes) · [Map-Features](Map-Features) · [Display-Settings](Display-Settings) · [Road-Trip](Road-Trip)
