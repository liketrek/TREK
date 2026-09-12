# Trip Planner Overview

The trip planner is the main workspace for building your itinerary. You open it by clicking a trip card on the dashboard.

![Trip Planner](assets/TripPlannerWithPlane.png)

## Layout

The planner uses a **three-pane resizable layout** on desktop:

```
┌─────────────────┬──────────────────────────┬──────────────────┐
│  Day Plan       │                          │  Places          │
│  Sidebar        │       Interactive        │  Sidebar         │
│  (left)         │          Map             │  (right)         │
│                 │        (center)          │                  │
└─────────────────┴──────────────────────────┴──────────────────┘
```

- **Left sidebar** — Day plan: your list of days, assigned places, notes, and transport entries. Collapsible via the panel toggle button.
- **Center** — Interactive map showing all place markers and day routes.
- **Right sidebar** — Places list: search, category filters, and bulk actions. Collapsible.

Each sidebar has a drag handle on its inner edge for resizing.

![Planner in its three-pane layout: the day plan sidebar with days, places, notes and flight entries on the left, the map in the centre, and the places sidebar with search and category filter on the right](assets/TripPlanner.png)

A **Day Detail panel** floats over the map area when you open a specific day, showing the weather forecast, that day's reservations, and the accommodation block. It can be collapsed to a slim header bar without closing it.

## Tabs

The tab bar sits directly below the main navigation bar.

| Tab | Description |
|---|---|
| **Plan** | The three-pane map view described above. Always visible. |
| **Transports** | Flights, trains, cars, cruises, and buses. |
| **Bookings** | Hotels, restaurants, events, tours, and other bookings. |
| **Lists** | Packing list and to-do list. |
| **Costs** | Expense tracking, splitting, and settlement. |
| **Files** | Document manager for receipts, tickets, and other files. |
| **Collab** | Real-time chat, shared notes, and polls. |

> **Admin:** The **Lists**, **Costs**, **Files**, and **Collab** tabs only appear when the corresponding addon is enabled. See [Admin-Addons](Admin-Addons).

The active tab is saved in `sessionStorage` per trip, so switching between trips preserves your last position.

## Roadtrip daily start and end times

Nearby station search results group into count badges when zoomed out. Click a badge to zoom into its stations. Stations that still overlap at close zoom appear in a selectable list. Planned stops, including photo markers, also group into count badges when zoomed out. Day endings remain separate. This works with all supported map providers in Roadtrip mode.

In the Roadtrip view, open **Driving settings** and enter a **Day start** and **Day end** in HH:mm format. Both values enable automatic daily scheduling and connect the drives between days. Clear either field to return to the existing schedule. These preferences belong to the trip. All travellers see the same daily schedule, vehicle settings and driving limits. Members with permission to edit days can change them. Existing trips inherit their owner's previous values once; later changes affect only that trip.

Driving pauses at the end time and resumes from the same location at the next day's start time. Stops and visit durations determine where each pause falls. Editing, adding or removing stops recalculates the pauses and subsequent arrivals. If a visit crosses the end time, the remaining visit continues there the next morning before driving resumes.

Choose **Along the route** to pause at the point reached at the cutoff, or **At the last place** to stay after the last visit when the next place cannot be reached before the cutoff. For example, arriving at 16:00 and staying for one hour ends the day at 17:00 if the next drive takes two hours and the cutoff is 18:00. That drive starts from the same place the next morning. If a single drive cannot fit within a full daily window, a message asks you to add an intermediate place or choose pauses along the route. The final destination does not generate an extra drive to fill the remaining time.

The map and daily cards show the pause location without creating a place, accommodation or booking. The location within a drive is an estimate based on the elapsed share of the leg's duration along its route geometry. The next real stop is reached after the remaining drive, so its arrival can be later than the daily start time. Transport legs such as ferry crossings continue to their destination without a pause in the middle.

Manual times take precedence. A first stop set to 07:00 still starts at 07:00 even with an automatic 08:00 start. A fixed late appointment can extend that day. If fixed appointments cannot be reached without changing their time or stored day, a visible message pauses automatic scheduling. Missing routes also show a message until a complete schedule can be calculated.

The daily layout is calculated for the Roadtrip view. Stored day assignments stay intact, with **From day 1** labels identifying stops carried forward. Additional preview days appear when needed, including beyond the trip's existing days.

To mix both behaviors, select a stop and enable **End the day here** in its place details. This ends the day after that visit and its stay, even when the daily cutoff has not been reached. The next drive starts the following morning. The switch is available only in Roadtrip mode with valid daily travel times. Turning those times off keeps each saved choice but stops applying it. The choice belongs to that particular visit, so another visit to the same place is independent. Disable the switch to follow the default again. The editable **STAY** duration appears beside this switch and opens the same editor as the sidebar.

While online, drag an end-of-day map label along the driving route or onto a visit. A visit that automatically moved into the following day can become the previous day's final stop, even if its full stay ends after the automatic cutoff. Fixed visit times remain protected. Right-click a dragged label to restore its automatic ending, or restore all dragged endings in Driving settings. Focused labels also support the arrow keys and Delete. These overrides belong to the trip, survive reloads and are copied with the trip. They take effect only while daily travel times are enabled.

The map marks pauses with a moon and day number beside a place or above the route. These markers disappear when zoomed out beyond level 6.

> **AI / MCP:** `get_roadtrip_context` reads saved days, visits, pins, stays, vias, followed tracks and day endings. `calculate_roadtrip` calculates arrivals, day splits, driving limits and vehicle-range warnings on the server, using the same planning logic as the browser. No open TREK tab is needed. Pauses remain calculated markers, never places or bookings. `get_roadtrip_settings` and `update_roadtrip_settings` read and change the shared driving preferences for the specified trip; changes update connected views for all its travellers. Place and assignment tools edit stops, stay durations, times and ordering. `set_assignment_end_day` and `set_day_boundary` set or clear individual day endings. `search_roadtrip_corridor` finds stops along a calculated day, with name, charging and route-section filters. `import_trip_gpx` imports tracks; the via tools edit their routing handles. See [MCP-Addon-Tools](MCP-Addon-Tools) for units, scopes and incomplete results.

## Mobile Layout

On screens narrower than 768 px, TREK does not squeeze the three-pane layout — it opens a dedicated mobile trip screen instead: a day-chip rail under the top bar, a switch between the day plan and a full-screen map, and a bottom dock for the other tabs. Tablets and desktops (768 px and up) get the three-pane layout described above.

## Undo

The planner tracks your recent actions — adding places, assigning them to days, reordering, and removing assignments — in a short undo ring. The **Undo** button sits in the Day Plan Sidebar toolbar (at the top of the sidebar); it is greyed out until an undoable action is available. It shows the name of the last action as a tooltip on hover and reverses it when clicked.

## Splash Screen

When you first open a trip, a brief loading screen appears while the planner data and place photos are fetched. This screen shows the trip title and a loading animation. Once data is ready and a short grace period for photos has elapsed, the planner workspace appears.

## Getting Around

| Task | Where to go |
|---|---|
| Add and search places | [Places-and-Search](Places-and-Search) |
| Organize days and notes | [Day-Plans-and-Notes](Day-Plans-and-Notes) |
| Map features and routes | [Map-Features](Map-Features) |
| Weather forecasts | [Weather-Forecasts](Weather-Forecasts) |
| Reservations and bookings | [Reservations-and-Bookings](Reservations-and-Bookings) |

Driving settings includes **Show hazard areas**, off by default and shared by the trip. In online Roadtrip mode, the map loads current DWD warnings for Germany and worldwide GDACS notices. Click an area or event point for its source report and update time. A point alone does not describe the affected area. Feeds refresh every ten minutes; unavailable or incomplete sources are labelled. These are current notices, not forecasts for travel dates or confirmed road closures, and they do not change routing. GDACS supplies a limited recent-event feed, with affected-area geometry loaded for up to twelve flood, wildfire or cyclone events. Coverage is not exhaustive.

> **AI / MCP:** Use `get_roadtrip_hazards` to read notices and source availability. Set `roadtrip_show_hazards` through `update_roadtrip_settings` to change the shared map setting.

## Related Pages

- [Places-and-Search](Places-and-Search)
- [Day-Plans-and-Notes](Day-Plans-and-Notes)
- [Map-Features](Map-Features)
- [Weather-Forecasts](Weather-Forecasts)
- [Reservations-and-Bookings](Reservations-and-Bookings)
- [Admin-Addons](Admin-Addons)

Driving settings also controls **Show in Days too** under **Service stops**. It is on by default and applies to every service stop in the trip, including existing stops. Turn it off to keep service stops exclusively in the Roadtrip view and omit them from the normal Days view and its route. Turning it on restores their visibility without creating duplicates. The setting is shared with fellow travellers and can also be changed through `update_roadtrip_settings` using `roadtrip_service_stops_in_days`.

**Looking for** in Roadtrip also searches installed place-search plugins. Plugin results show their source and can be added like other stops. Search remains online-only and runs on request. Results outside the chosen corridor are removed, and failed sources are shown beside the remaining results.

> **AI / MCP:** `search_roadtrip_corridor` uses the same combined sources and reports `failedSources`.

In Roadtrip, open the three-dot menu beside the day selector to import a Google Maps directions link. Preview the ordered stops, choose a day, then confirm. Resolved stops are appended to that day; unresolved locations are marked and skipped. TREK calculates its own route between the stops. Import needs an online connection and permission to edit places and days.

> **AI / MCP:** Use preview_google_maps_route to inspect a link, then import_google_maps_route to append the reviewed stops to a trip day.

Roadtrip charging stops show compact availability and published energy-price badges. The place detail panel adds source attribution, timestamps and tariff conditions. Data comes from the public MobiData BW OCPDB aggregation, including participating German operators and Swiss data, without an API key or account. Coverage varies; an unknown or stale status does not mean a charger is free. Prices are published source tariffs, not personal charging-card quotes. Data refreshes while Roadtrip is visible and is not advertised as live offline.

> **AI / MCP:** get_roadtrip_charging_info reads the same availability, tariff components, freshness and source information for a saved charging stop.

GDACS warning popups show the current episode score when supplied, falling back to the overall event score. The compact scale indicates GDACS humanitarian impact, not whether roads are passable.

### Accommodation portals in Roadtrip

The Add as a stop dialog offers trivago and CHECK24 for hotels, or PiNCAMP and Pitchup for campsites. The portal opens in a new tab without adding a stop or making a booking. trivago receives the search text; PiNCAMP receives a geographic area extending roughly 20 km from the stop; Pitchup receives the stop coordinates. All three receive the trip dates when both days have dates and departure is after arrival. Review the destination, dates and guest count on the portal. CHECK24 requires a manual search. Check-in and check-out use the shared TREK time picker.

All Looking for categories, including accommodation, are added as Roadtrip service stops. In Roadtrip mode, Edit in a planned place's details opens the stop dialog with its saved duration and overnight dates and times. Saving updates the existing stop; More details still opens the full place editor. The shared stop-type contract also accepts hotel through MCP.

A booked check-out time controls departure from an overnight stop on its check-out day. STAY is calculated from arrival until check-out, including multiple nights, and updates with the route. Explicit arrival times remain authoritative. Clicking STAY for a booking with check-out opens the overnight editor. Browser planning and MCP use the same scheduling logic.

The overnight dialog prefills check-in from the calculated arrival when available; existing manual check-in values take priority. Before adding a corridor result, the suggested arrival is estimated along the current routed leg. Without any known arrival, checkout still anchors the onward drive, but STAY remains unknown instead of displaying the old default duration.

Ordinary places retain the full place editor in Roadtrip mode. The compact stop editor is used for service stops and accommodation. When visits move into another day, their calculated departure continues into that day's following stops, including midnight offsets.

Stops reached after midnight move to the next calculated Roadtrip day with a FROM DAY label. This also creates a display day when no saved day exists yet and retains arrival times for a day containing only one moved stop.

Range warnings also locate an empty battery or tank on connections between days. The warning offers reachable stations on that connection and inserts a selected stop before its destination.
