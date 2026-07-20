# Route Optimization

TREK calculates walking and driving times between your places and can reorder them to minimize total travel distance.

![Route Optimization](assets/OptimizeRoute.png)

## Route calculation

TREK uses **OSRM** (Open Source Routing Machine) to calculate routes between consecutive places in the selected day. No API key is required.

The route toggle in the day-plan footer offers a **Driving** and a **Walking** profile (each routed on the matching OSRM network). Installed plugins can add further profiles: a plugin with the `routeProvider` hook — for example an e-mobility plugin that plans charging stops — appears as an extra mode next to Driving/Walking. When such a profile is selected, that plugin computes the day's route: its geometry is drawn on the map, planned stops (e.g. chargers) appear as small dots on the line, and the leg connectors show the plugin's travel times plus any note it attaches ("25 min charge"). If the plugin fails or times out, TREK falls back to straight lines exactly as it does on an OSRM outage.

Route segments reset at any transport reservation (flight, train, car, bus, or cruise) between two places — that leg is not driven or walked, so no ground route is drawn across it.

## Route display

- Colored line segments connect consecutive places on the map.
- At zoom level 12 or higher, time pills show the estimated walking and driving time between each pair of consecutive places.
- When at least two places are on the selected day, total distance and duration are shown in the sidebar footer.

## Optimize route

The **Optimize** button in the sidebar footer reorders places in the current day to minimize total travel distance using a **nearest-neighbor algorithm**. It starts from the first place, then repeatedly visits the closest unvisited place by straight-line (Euclidean) distance.

Only unlocked places are reordered — locked places stay in their current positions.

The reorder can be undone immediately using the undo action that appears after it is applied.

## Export day to Google Maps

The **Open in Google Maps** button (icon next to Optimize) generates a `https://www.google.com/maps/dir/lat,lng/lat,lng/…` URL containing all places in order and opens it in a new tab.

**See also:** [Day-Plans-and-Notes](Day-Plans-and-Notes) · [Map-Features](Map-Features) · [Display-Settings](Display-Settings)
