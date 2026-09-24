# Road Trip

Road trip mode plans a trip as one continuous drive. The same days and the same places you plan under **Days** are read as a chain of stops with the driving between them: how far each leg is, how long it takes, when you arrive and when you set off again. Change a stay, pin a time or move a stop, and every arrival after it moves with it.

It is a second way of looking at a trip, not a second trip. Nothing is copied: switch back to **Days** and the plan is where you left it.

> **Admin:** Enable the **Road trip** addon in **Admin → Addons**. It is listed under **Trip** and is off by default. It needs no key and no account: routing runs on the public OpenStreetMap routing servers until you point it at your own, see [Routing engines](#routing-engines). See [Admin-Addons](Admin-Addons).

## What it does

- **Shows the whole drive.** Trip distance, driving time and stop count at the top, then one card per day with every leg and every arrival.
- **Keeps your times.** A time you pin on a stop is never moved. The schedule is worked out forwards and backwards from it, and a stop you would reach late says by how much.
- **Knows how long you stay.** Each stop carries its own stay, up to a full day, and a stay that runs past midnight carries the drive into the next morning.
- **Caps a day.** Daily travel times end each day at the hour you choose, along the route or at the last place, and the rest of the drive continues on extra calculated days.
- **Watches your limits.** The longest drive in one go, the driving per day, and the range on one tank or charge. Legs and days over them are marked, and so is the point where the tank runs dry.
- **Searches along the road you actually drive** for fuel, charging, rest areas, campsites, accommodation, food and sights, within 2, 5 or 10 km of it.
- **Lets you shape the route** with via points, offers **Other ways** to drive a leg, and avoids toll roads, motorways and ferries where possible.
- **Follows a scenic route** from an imported GPX or KML track.
- **Shows weather warnings and disaster alerts** on the map when you ask for them. They never change the route.
- Works on the phone as its own **Road trip** tab, and through [MCP](#mcp-tools) without an open browser.

## Switching to Road trip

With the addon on, a **Days** / **Road trip** switch sits at the top of the planner's left column on the desktop. The choice is remembered per trip for as long as the browser tab stays open.

In **Road trip** the planner changes shape:

| Where | Days | Road trip |
|---|---|---|
| Left column | the day plan | the drive: a summary of **Distance**, **Driving time** and **Stops**, then one card per day |
| Map | the selected day | every day of the trip. **Fold** on a day card takes that day off the map as well |
| Right column | the places list | **Along the route** (the search, see below) and the **Driving settings** card |

The map's category pills still work, so you can look around what is in view as well as along the drive; a place both searches find is drawn once. **Show whole trip** is not offered, because this view already draws the whole trip.

The drive is built from the places planned on each day. Plan the places the trip is for under **Days** as usual, or import them (see [Importing a Google Maps route](#importing-a-google-maps-route)). A day is routed once it has two places with coordinates; a day with fewer shows an empty card you can drop a stop onto, and a place without coordinates is left out of the drive. In the rail, drag a stop to reorder its day or to move it to another day, or focus it with the keyboard and press Alt with the up or down arrow.

While the legs are still being routed, the summary says *Still working out the rest of the drive*, because until then every total is a partial sum.

### A day card

The header of each card carries the day's number, its date, its driving (for example *412 km in 5 h 10 min*) and its number of stops. It also shows how far the day runs over your driving limit, which road classes it could not avoid, and a **Track** badge for [following a track](#following-a-gpx-or-kml-track).

Below it, the day is a chain:

- **Numbered stops** are the places the day is for. The numbers match the markers on the map.
- **Stops on the way** (fuel, charging, a rest area and the other kinds below) sit on the dashed line with the icon of their kind instead of a number. They are not counted as stops, so a day with a charger between four places is still a four-stop day.
- **Drive bands** between the stops show each leg as distance and time. Click one for [Other ways](#other-ways-and-avoidance).
- **Arrival times** stand at the right edge. A time you set is printed a little stronger than one worked out from the drive; hover one to see which it is (*Time you set* or *Calculated from the drive*). A small *+1* means the next day.
- A stop the road does not quite reach, such as a viewpoint up a footpath, shows the gap as a dashed spur on the map, and the rail prints *{distance} from the road* once it is 250 m or more.
- A charging or rest halt a routing plugin adds to a leg is listed as *Stop on the way*. It is the plugin's, so it is shown but cannot be edited.

A stop reached after midnight moves to the card of the day it is reached on, under a **From day _n_** band that names the day it came from and when the drive left. Nothing is written for this: the stop still belongs to the day you planned it on, and a shorter stay the evening before puts it back.

## Stops on the way

Any stop can be a **destination**, the numbered kind, or a **stop on the way**. The kinds are:

| Kind of stop | Stay it starts with | Notes |
|---|---|---|
| **Fuel** | 10 min | Refills the range, unless the vehicle is set to **Electric**. |
| **Charging** | 30 min | Refills the range, unless the vehicle is set to **Petrol**. Shows [availability and tariffs](#charger-availability-and-tariffs). |
| **Rest area** | 20 min | |
| **Campsite** | 60 min | Can also be booked as a night. |
| **Accommodation** | 30 min | Added from the search as a night by default, see [Booked nights on the drive](#booked-nights-on-the-drive). |
| **Food** | 45 min | |
| **Sights** | 30 min | |

The stay is only a starting point. Change it on the stop, see [How long you stay](#how-long-you-stay).

- **Make it a stop on the way:** click the number of a numbered stop and pick a kind. The number turns into the kind's icon and the stops below it are renumbered.
- **Change what kind of stop this is:** click the icon of a stop on the way. **Back to a destination** gives it its number again.
- A fuel or charging stop that refills your vehicle carries a fill badge (see [Driving limits and range](#driving-limits-and-range)). Click it to set how full this particular stop fills, or **Use my default**.

Stops on the way also show under **Days** and on the day's route there. To keep them in Road trip only, switch off **Show in Days too** under **Service stops** in the **Driving settings**. The switch is on by default, belongs to the trip, and applies to every stop on the way, including existing ones. A stop that a booked night put on the drive is always hidden under **Days**, whatever the switch says, because the day already shows that booking.

### Adding a stop from the search

**Add** on a search result opens **Add as a stop**. It says where the stop lands, for example *Day 2, as stop 4*: at the point of the day where the drive really passes it. It warns when the same place is already on the trip. Pick the **Kind of stop** and the **Time at this stop** (5, 10, 20, 30, 45 or 60 minutes), then **Add**. **More details** opens the full place form instead.

For accommodation and campsites the dialog asks **Pause** or **Overnight**. Accommodation starts on **Overnight** (its button in the result list already reads **Add as an overnight stay**), a campsite on **Pause**. An overnight stay asks only for the **Check-in** time, prefilled from the calculated arrival, and shows the place's website and phone where known. **Find accommodation** opens trivago and CHECK24 for a hotel, or PiNCAMP and Pitchup for a campsite, in a new tab, with the place and your dates where the portal accepts them. Nothing is booked and no stop is added by opening a portal. CHECK24 needs a manual search.

## How long you stay

Every stop has a **Stay** badge. Click it to open **Time at this stop**:

- The length is the big number in the middle. Set it with the slider, the minus and plus buttons (5 minutes at a time), or one of the presets from 15 minutes to 12 hours. The slider reaches a full day.
- Below it, **Arrive** and **Leave** show what the stay does to the day while you change it.
- **No stay** clears it.

**The stay belongs to the place, not to one visit.** A place planned on two days has the same stay on both.

A stay may run past midnight. The clock carries into the next morning together with the drive from there, and the next stop moves to the card of the day it is actually reached on. With daily travel times set, the hours between one day's end time and the next day's start time count towards the stay, so a twelve hour night that begins at 20:00 is over at 08:00 the next morning.

A booked night is answered the same way: its length is its stay. The drive never reads a check-out, because a check-out is the latest the room has to be handed back, not the time anybody drives on. The booking keeps its check-out as a booking detail under **Days**. When the day [starts at the stay](#starting-and-ending-the-day-at-the-stay), the hotel's row prints it as *until 10:00*, and that is still a label, not the time the drive leaves.

## Leaving at a set time

A visit's **End** is the time the drive leaves it. Set it in the place form, where the **End** field says so in Road trip mode: *On the road trip, the drive leaves at this time.*

- The stop is stood at from whenever the drive gets there until that time. Its **Stay** badge shows the stay that results together with the time, for example *2 h until 14:00*. That length is worked out, never written into the place, so it is right again the moment an arrival moves.
- If the drive gets there after the End, the badge warns *Arrives 25 min after the time you set to leave*, and the drive leaves on arrival.
- If the daily travel times close the day before the End comes, the stop is where that day ends: *The travel day ends before 14:00, so the drive goes on the next morning.*
- Clicking the **Stay** badge of such a stop opens the End instead of the slider, with **Remove end time**. After that the stay is yours to choose again. The button is missing when you may not edit the stop, and when the End is stored on the place itself and another visit of the same place relies on it: removing it there would change that visit too.

The End belongs to one visit; the stay belongs to the place. Older trips can carry an End on the place, which then applies to its visits that have none of their own.

## Pinned times and the schedule

Give a visit a **Start** in the place form and the chain restarts from it. That time is never moved.

- With nothing to count from (no pinned time, no check-in and no daily travel times), the rail shows driving times but no clock times.
- **The schedule works backwards too.** Pin 10:00 on the second stop and the first one says when to set off, worked out from the drive and the stay. It stops at a leg that has not routed rather than inventing a duration.
- A stop reached later than the time you set says so: *Arrives 15 min after the time you set*. The same warning appears on a fuel or charging halt that carries a time.
- The **Check-in** of a booked night holds its stop the way a pinned time does: the day is built to be there by then, the chain restarts from it, and a drive that gets there later is late, with the same *Arrives 15 min after the time you set* warning a missed pin gets. A time pinned on the stop itself wins over the check-in.

## Daily travel times and day endings

In **Driving settings → Daily travel times**, set a **Day start time** and a **Day end time**. Both are needed; clear either to turn the feature off. Manual times take priority.

Driving then stops at the end time and continues from the same point at the next day's start time. How the day ends is chosen under **End the day**:

| Choice | What happens |
|---|---|
| **Along the route** (default) | The day pauses on the road wherever the drive has got to at the end time. |
| **At the last place** | The day stops at the last place before the next drive would pass the end time. A drive too long for any single day asks you to add a place along the way or to pause along the route. |

- Whatever does not fit continues on **extra calculated days**, beyond the trip's own days if needed. These are arranged for the road trip view only; your days and their places are not changed.
- The rail shows each ending as an **End of day** row with **Show on map**. The map marks it with a moon and the day number, hidden once you zoom out below level 6.
- **End the day here**, in a stop's place details, ends the day after that visit and its stay even before the end time. It belongs to that one visit.
- While online you can drag an end-of-day marker on the map along the route or onto a visit. Right-click it to restore the automatic ending, or use **Restore automatic day endings** in the Driving settings. A focused marker also takes the arrow keys and Delete.
- If a time you pinned cannot be reached together with the daily breaks, the planner says so and pauses automatic scheduling rather than moving your time.
- Turning daily travel times off keeps every **End the day here** and every dragged ending, but stops applying them until the times are back.
- With daily travel times set, the days are always connected: the drive from one day's last stop to the next day's first is routed and counted.
- With **Start and end each day at your stay** on, a booked night ends the day by itself. The drive to tonight's hotel is never cut or carried into the morning, so that day's **End of day** can come after the end time, and the next morning starts at the hotel. A dragged ending between two stops that a booked night separates is ignored. See [Starting and ending the day at the stay](#starting-and-ending-the-day-at-the-stay).

## Driving settings

The **Driving settings** card sits under the search in the right column. Its badges show what is set without opening it. The settings belong to the trip, so everyone on it plans with the same car, the same limits and the same daily times. Changing them needs the permission *Edit days, notes & assignments* (see [Admin-Permissions](Admin-Permissions)). Trips that existed before took their owner's earlier values once.

| Section | Settings |
|---|---|
| **Driving** | **Longest drive at once**, **Driving per day**, both in minutes. Empty means off. |
| **Daily travel times** | **Day start time**, **Day end time**, **End the day**, **Restore automatic day endings** |
| **Avoid where possible** | **Toll roads**, **Motorways**, **Ferries** |
| **Service stops** | **Show in Days too** |
| **Vehicle** | What you drive (**Either**, **Petrol**, **Electric**), the range, **Fill up to**, and **Work it out from the car** |
| **Route line** | **Connect the days**, **Start and end each day at your stay**, **A colour per day** |
| **Current warnings** | **Show hazard areas** |

**Connect the days** routes the drive from one day's last stop to the next day's first and counts it towards the day it arrives on. It is off by default, and always on while daily travel times are set. **Start and end each day at your stay** is off by default too, see [Starting and ending the day at the stay](#starting-and-ending-the-day-at-the-stay). **A colour per day** draws each day in its own colour and tints its card to match.

## Driving limits and range

All three limits are yours to set, and nothing is assumed about the vehicle: with no limit set, nothing is flagged.

- **Longest drive at once:** a leg over it gets a warning badge, *1 h 10 min over your longest drive*.
- **Driving per day:** a day over it says so in its header. Both limits count driving only, not stays and not overnight legs.
- **Range on one tank** (or **Range on one charge** for an electric car), in your distance unit. Instead of typing it, open **Work it out from the car** and enter **Tank size** and **Consumption**, or for an electric car **Battery**, **Consumption** and **Battery wear**. Once those add up, the range is worked out from them and cannot be typed over.
- **Fill up to** says how full a stop fills, because nobody charges to 100 % on the road. Each fuel or charging stop can override it.

The range counts from the last fuel or charging stop, across days. **What you drive** decides which stops count: **Petrol** refills only at fuel stops, **Electric** only at charging stops, **Either** at both.

Where the range runs out, the rail draws a band across the leg: **Tank runs out here** or **Battery runs out here**, *after 64 km*. **Find fuel** or **Find charging** searches the road before that point and offers up to three stations the car can still reach, keeping 10 km in reserve and counting the detour twice. Each shows how much range it leaves to spare, and **Add {name} as a fuel stop** (or **as a charging stop**) puts it on the right leg. This works across day boundaries too, and needs a connection.

## Search along the route

The **Along the route** panel searches the road actually driven, not the straight line between stops. That is the difference between one petrol station and forty.

1. Pick the **Day** at the top of the panel.
2. Under **Looking for**, pick one or more of **Fuel**, **Charging**, **Rest area**, **Campsite**, **Accommodation**, **Food** and **Sights**. It opens on **Charging** when the trip's vehicle is electric, and on **Fuel** otherwise.
3. Under **Within**, pick 2, 5 or 10 km either side of the road.
4. Press **Search**.

Results are grouped by kind and listed in the order you pass them, each with how far along the day it is (*after 120 km*) and how far off the route. Click a result to bring it into view on the map, which is how you tell which side of the road it is on. **Add** puts it on the drive, see [Adding a stop from the search](#adding-a-stop-from-the-search).

To narrow the results afterwards:

- **Filter by name**, for example a brand.
- Limit the list to one stretch: **The whole day**, around one stop, or around the middle of a leg (*Halfway, Lyon to Avignon*), within 25, 50 or 100 km. A break on a five hour drive belongs in the middle of it.
- For charging: **Any plug** or one plug family, and **Any power** or a minimum of 11, 22, 50 or 150 kW. These filters work where OpenStreetMap states them. A station that states neither stays in the list, because most stations state no power at all.

**Clear results** empties the list, its pins on the map and the filters.

The search asks TREK's place index and OpenStreetMap, and any installed place-search plugin, whose hits show their source. A source that fails is named beside the results that did arrive, and a search cut short says so rather than claiming the stretch was checked. The search only runs when you press **Search**, and needs a connection.

### Add manually

The search does not know every charger or pump: a good share of the chargers at a motorway junction are missing from OpenStreetMap. **Add manually**, beside **Search**, is for those.

- Look the place up by name.
- TREK works out which leg of which day it belongs on, measured against the drawn route. **Add between** lists every leg of every routed day, if the guess is wrong.
- A place well away from the route is accepted, with a note: *12 km from the route, so check which leg it belongs on.*
- The dialog opens on the kind you are searching for, with that kind's usual stay.

### Charger availability and tariffs

A charging stop shows how many connectors are free and the published price, compactly in the rail and in full in its place details, with the source, the time of the data and the tariff conditions. The same panel appears in **Add as a stop** when the kind is **Charging**, so you can read it before the stop exists.

The data comes from the public [MobiData BW OCPDB](https://api.mobidata-bw.de/), which aggregates participating operators, without a key or an account. Coverage varies by region and operator. *No reliable data available* and *Status outdated* mean exactly that; neither means the charger is free. The prices are **Published tariffs**, not what your own charging card pays. The data is refreshed every minute while it is shown and is not available offline.

## Via points

A via point bends a day's drive without adding a stop: no number, no stay, no arrival.

- **Click the route** on the map to drop one. It is attached to the leg you clicked, between the two stops it lies between.
- **Drag** it to move it. The route is redrawn through the new spot.
- **Right-click** it to remove it, and the leg drives the direct way again.

The handles show once you zoom in far enough to aim at a road (zoom level 9). A via remembers which stop it follows, so reordering a day re-pins it instead of letting the drive snap back. Placing and moving vias needs the permission *Edit days, notes & assignments* and a connection; without either, the route cannot be clicked and the handles cannot be moved.

## Other ways and avoidance

Click a drive band in the rail to see **Ways to drive this leg**. TREK asks the router for alternatives and lists them: the **Fastest**, how much slower or quicker each other one is, and on a leg you already reshaped, the road you are on as **Current**. Hover an entry to light it up on the map, click it to drive that way. Choosing a different road places a via on the leg, replacing any the leg already had; choosing the router's own road removes them.

The list can also offer **No motorway**, **No tolls** and **No ferry**. These come from the second routing engine (see below), which prices roads with its own speed model, so they are marked *Timed by the avoidance router, not the main one* and are not compared with the others. When the router knows only one way, the list says *Only one sensible way to drive this one.*

To avoid road classes for the whole trip, switch them on under **Avoid where possible** in the Driving settings: **Toll roads**, **Motorways**, **Ferries**. This is a preference, not a ban. A day with no way round still uses the road, and says so in its header (*Toll roads unavoidable*) instead of pretending. Days that could avoid what was asked still do.

When the instance has its own OSRM but no Valhalla, the switches are unavailable and say *Your routing provider does not support avoidance.*

## Routing engines

Routing needs two engines, and both have public defaults, so the addon works without any setup:

| Engine | Used for | Public default | Own instance |
|---|---|---|---|
| **OSRM** | every road route TREK draws: the road trip, the day plan, the routed booking lines | the FOSSGIS servers at `routing.openstreetmap.de` | **Own routing engine** |
| **Valhalla** | driving around toll roads, motorways and ferries, and the **No motorway**, **No tolls** and **No ferry** offers | the FOSSGIS Valhalla at `valhalla1.openstreetmap.de` | **Own Valhalla instance** |

The public OSRM servers allow roughly one request a second. That is enough for a day plan and tight for a road trip, which routes every leg of every day: TREK spaces its requests and retries a refused one, but a long trip takes a while to fill in. An instance with many road trippers is better off with its own.

> **Admin:** Set your own engines under **Admin → User Defaults**, in the **Map** section, on the desktop or the phone: **Own routing engine** for OSRM, **Own Valhalla instance** for Valhalla. A value saves when you leave the field, and **reset** restores the public default. Then **restart the server and reload the page.** Only an admin can set them; they apply to everyone.

Why a restart: routes are calculated in the browser, and the browser only talks to addresses the server names in its security policy, which it builds once at start. An address the policy does not name is blocked by the browser without an error TREK could report.

What the combinations do:

| Own routing engine | Own Valhalla instance | Result |
|---|---|---|
| empty | empty | Public OSRM for routes, public Valhalla for avoidance. |
| set | empty | Your OSRM for routes. **The public Valhalla is not used**, because an instance that runs its own router has chosen against public hosts. The avoid switches are unavailable, and **Other ways** can still offer routes without motorways or tolls if your OSRM supports excluding them. |
| empty or set | set | Your Valhalla for avoidance. |

Requirements for your own instances:

- **OSRM** must serve the standard layout, `<address>/route/v1/<profile>/…`, which `osrm-routed` does out of the box. It answers every route in TREK, not only road trips. The public servers refuse to exclude road classes; an OSRM of your own built through the MLD pipeline, with a profile that has those classes, can answer **No motorway** and **No tolls** in **Other ways** by itself.
- **Reachable from the browser.** The browser calls the engine directly, so the address has to work from the devices your travellers plan on, not only from the TREK server. `http://localhost:5000` means the traveller's own computer to a browser. When TREK is served over HTTPS, the engine has to be HTTPS too, or the browser blocks it as mixed content.
- **Reachable from the TREK server** for the [MCP tools](#mcp-tools), which calculate on the server. An address on your local network is accepted there without `ALLOW_INTERNAL_NETWORK`, because only an admin can set it.

There is no environment variable for either engine. See also [Admin-Panel-Overview](Admin-Panel-Overview) and [Route-Optimization](Route-Optimization).

## Following a GPX or KML track

Scenic routes are usually published as a track. A day can follow one that is already imported into the trip:

1. Import the file under **Days** with **Import file** in the places panel, with its tracks (GPX) or paths (KML) selected. See [Places-and-Search](Places-and-Search#importing-multiple-places).
2. In Road trip, click the **Track** badge in the day's header.
3. Pick the track. The list shows each track's colour, length and how far it lies from this day, nearest first.
4. Press **Follow this track**.

TREK then places via points where the road strays furthest from the track and routes again, round after round, until the drive is close enough. It reports the result: *6 via points placed. The drive stays within 300 m of the track.* Via points already on those legs are replaced. On the public routing servers this can take half a minute for a long route.

The badge is then tinted, and its tooltip names the track the day follows. **Drop _n_ via points** in the same dialog undoes it.

## Weather warnings and disaster alerts

Switch on **Show hazard areas** under **Current warnings** in the Driving settings. It is off by default and shared by the trip.

- **DWD** weather warnings cover Germany. **GDACS** reports disasters worldwide; up to twelve flood, wildfire or cyclone events are drawn with their affected area.
- Click an area or an event for the source report and when it was last updated, and for GDACS its alert score. An event given only as a point says *Location only; affected area unknown.*
- The feeds are refreshed every ten minutes, and a source that is incomplete or unreachable is labelled as such. Offline, live warnings are unavailable.
- **Warnings are not road closures. Routes stay unchanged.** They are current notices, not forecasts for your travel dates, and the coverage is not exhaustive.

## Booked nights on the drive

A night booked anywhere, whether in the day panel, the booking form, on the phone, in Road trip, through MCP or by a plugin, puts its place on the check-in day as an **Accommodation** stop on the way. The hotel is on the drive without being entered twice.

- **Days** shows the night in the day header as always, and hides the stop so the hotel is not listed twice.
- Moving the booking to another day moves its stop along; deleting the booking removes the stop it created. A stop you placed yourself is left standing.
- The drive uses the booking's **Check-in** to anchor the stop, the way a pinned time anchors any other, and the place's stay as its length. A drive that cannot make the check-in is reported late. The check-out stays a booking detail.
- **The night leads its day.** Its stop is seated first, behind only a stop whose own time is at or before the check-in, and the stops that carry no hour follow it: a hotel booked for ten in the morning is reached at ten, not at a quarter past twelve behind a whole day of untimed stops. A night without a check-in is seated first as well, a new check-in seats the stop afresh, and two nights booked on one day settle by their check-ins. A day that is nothing but its booked night stands among the days with the hotel and its check-in, instead of under the *Only {name} so far* placeholder.
- One consequence to be aware of: a night booked for the end of a driving day heads that day too when its stops carry no time of their own, so the drive reads hotel first. To put the hotel back at the end, drag it down the rail: an edit to the booking that leaves the check-in alone will not undo that. A **Start** at or before the check-in does it as well, as long as it goes on the *first* stop after the hotel: the day re-sorts by time, and the untimed stops behind that one follow it. On the last stop alone it is not enough, because the untimed stops in front of it keep counting as being at the check-in and stay behind the hotel.
- **Add as an overnight stay** from the search books the night and adds the stop in one go. The night runs to the next day; change the dates under **Days**. On the phone, booking a night works in the desktop planner only.

Trips planned before 4.3.1 were seated the same way when the server upgraded, see [Upgrading to 4.3.1](Updating#upgrading-to-431).

See [Accommodations](Accommodations#on-the-route) for the details.

### Starting and ending the day at the stay

Normally a day drives from its first stop to its last, and the hotel you slept in is not on it. **Start and end each day at your stay**, under **Route line** in the Driving settings, changes that: the day after a booked night starts at that hotel, and the day before one ends at tonight's hotel. The switch is off by default, so a trip drives exactly as before until somebody turns it on. Like every driving setting it belongs to the trip and needs the permission *Edit days, notes & assignments*. On the phone it is the one switch in **Driving figures**, see [On the phone](#on-the-phone).

With it on:

- The hotel stands at the edge of the day card as a row of its own, with a bed icon and no number. In the morning it reads *Check-out · Hotel Adler* with *until 10:00* on the day you leave, and *From Hotel Adler* on a day you come back to. When the plan sets out after the check-out hour, the row adds *Leaves after check-out*. In the evening it reads *Back to Hotel Adler*, or *Check-in · Hotel Adler* on the day the stay begins when the hotel's own stop is not on the card before it, for example because you removed it.
- The drive to and from the hotel counts towards the day's distance, driving time, driving limits and range. The hotel does not count as a stop and does not refill the tank.
- These rows are not stops you planned, and nothing is stored for them: they cannot be dragged, removed or given a stay. Clicking one opens the night's booking, or the hotel's place when there is no booking to open. On the phone, a night without a booking opens the stay for somebody who may edit days.
- Only real nights count: a stay that checks in and out on the same day adds no row, and neither does a hotel without coordinates. Where two stays overlap, the choice is the one **Days** makes: the day ends at a stay checked in that day, otherwise at the one it started from, and it starts at a stay checked in on an earlier day, the one entered first where there are two. A drive between two different hotels is then a real drive.
- A side of the day that already starts or ends at the hotel gets no row. Neither does a day that starts where a flight, train or ferry lands or at a hire car's pick-up desk, or ends at a departure terminal or where the hire car goes back.
- A day with one place becomes a drive from the hotel to it and back. A day between two nights in the same hotel with no place planned has no drive, and a check-out day with no places is the drive from one hotel to the next.
- The drive from and to the hotel keeps its road. Clicking it on the map places no via point and says *No via point on the drive to or from your stay. Add a stop there instead.*, and its drive band offers no **Other ways**. Where the day drives the same road again between two of its places, a click there places the via point on that leg as usual. A place added from the search along that drive goes to the start or the end of the day.
- With **Connect the days** on or daily travel times set, a night at one hotel is no drive between the two days. A via point on the drive from one day into the next is kept, but not used while that day ends at a hotel.

Switch it off and every day drives from its first stop to its last, as before. The **Days** view does not change either way.

## Flights, trains and ferries on the drive

A **Flight**, **Train**, **Ferry**, **Cruise** or **Bus** booking on a day is a seam in the drive: the road ends at the terminal the booking leaves from and starts again at the one it lands at. Nothing is routed across the ride, so a flight from Hamburg to Munich no longer turns into an eight-hour drive on the road trip map.

- A ride that leaves and lands on the same day is one block on the day card: the booking and how long it takes at the top, then the terminal it leaves from and the one it lands at, each with the timetable under its name (*Departure 13:20*, *Arrival 14:30*) and the time the drive has you there on the right. The block opens the booking. A ride that lands on a later day shows its departure at the end of one day and its arrival at the start of the next, each as a row of its own.
- The departure terminal is pinned a check-in ahead of the timetable (an hour for a flight or a cruise, half an hour for a ferry, ten minutes for a train or a bus). A drive that cannot get there by then is late, the way a missed pinned time is. The arrival terminal is pinned at the timetable's arrival, and the drive continues from it.
- The map draws the ride as the booking's own line, the same arc the day plan draws, beside the roads.
- The ride's hours and kilometres are the booking's, not the drive's: the day's distance and driving time count the roads only, the range budget spends nothing on a flight, and after a ride the car cannot take (a flight, a cruise, a bus) the range starts afresh, because the next road is driven in another car. A car ferry or a motorail keeps the budget.
- A booking that lands on a later day seats its arrival at the start of that day. With **Connect the days** on, the join between the two days is the ride. With daily travel times set, the ride runs on the booking's clock: no day ends at the airport and no morning resumes on the plane.
- The terminals sit where the day plan lists the booking: a position you dragged it to under Days, otherwise behind the last stop whose time is before the departure, otherwise at the end of the day. Move the booking under Days to move the seam.

What the seam does not do: it never plans the ride itself, and a booking without located terminals (an airport TREK could not place, a train with no station coordinates) makes no seam and is left to the day plan. Via points and other ways of driving are offered for the road into a departure terminal, not for the ride or for the road out of an arrival, and the search along the route skips the ride. A taxi or a transit hop is not a seam: you stay on the road.

### Hire cars

A **Car** booking is not a seam, you drive it, but its desks are where the drive starts and ends. The pick-up desk stands on the day card as a row with the car icon and *Pick-up 09:00* under its name, and it opens the day when nothing timed comes before it. The return desk closes the day it is handed back on, with *Return 11:30*. The road runs through both like any other stop, the range budget starts from a full tank at the pick-up, and both rows open the booking. The return only appears when the booking names a return day and a located return desk; nothing is guessed.

### Other bookings on the day

A table, tickets or a tour booked on the day appear as chips under the stop they belong to: the stop the booking is pinned to, or the stop at the booking's place on that day. A chip shows the booking's icon, its name and the time it starts, and opens the booking. A booking on the day that belongs to no stop is listed under *Also booked this day* at the end of the card, so nothing you booked goes unseen in road trip mode. Nights are the stays, and rides and hire cars have their own rows, so none of them become chips.

## Car bookings with stops

A **Car** booking can carry the stops of its drive between pick-up and return, the way a flight carries its layovers. In the booking form, **Stops along the way** lists them, each with a place and a time; **Add stop** adds one and the arrows put them in order. The booking's line on the map runs through them in that order. This works on the desktop and on the phone, and does not need the addon. See [Transport-Flights-Trains-Cars](Transport-Flights-Trains-Cars).

## Importing a Google Maps route

A route planned in Google Maps can become the stops of a day:

1. In Road trip, open the **…** menu next to the day picker in **Along the route** and choose **Import Google Maps route**.
2. Paste the directions link. Long links, short `maps.app.goo.gl` links and Google's URL-builder links work. The link needs 2 to 30 stops.
3. Check the stops in the preview and choose the **Day**. A stop TREK could not place is marked *Location unresolved; this stop will be skipped.*
4. Import. The stops are appended to that day in their order.

TREK calculates its own route between them; Google's road is not copied. The import needs a connection and permission to edit both places and days. The **List Import** button in the places panel under **Days** (it reads **Google List** when Google is the only list source) accepts the same kind of link.

## On the phone

On a phone the addon adds a **Road trip** tab next to **Plan**. The tab bar holds five sections, so with the other trip addons on, the lists tab moves into **More** while the road trip addon is on, and comes back when it is off. A desktop window made narrower than 768 px switches to this phone layout too.

The tab shows the open day as a chain: where it starts and where it ends, each stop with its stay, the times you set next to the ones worked out, the band where the tank or battery runs out, and the stops a night drive carries into the next morning. On the day you are actually driving, **Up Next** is measured against the clock, with a countdown that turns into *15 min behind plan* once the planned time has passed. The map half of the tab draws that day alone.

- **Tap a stop** for a sheet that writes out what the badges mean, with navigation, a longer or shorter stay, and **End the day here**.
- **Tap a stop's number or icon** to change its kind, the same seven kinds as on the desktop.
- **Tap a leg** for other ways to drive it. They light up on the map before anything is saved.
- **Search along the drive** is two choices: what you are **Looking for**, and **How far**, either *50 km ahead* or **The whole day**. On the day you are driving, *ahead* starts at your next stop; otherwise it starts at the beginning of the day. Fuel and charging offers show the detour and the range they leave, with a button that puts one on the day. Search needs a connection.
- **Tap the day and distance** at the top of the tab for **Driving figures**: the range and the limits every warning is measured against, to read, and one switch, **Start and end each day at your stay** (see [Starting and ending the day at the stay](#starting-and-ending-the-day-at-the-stay)). It is the same setting as on the desktop and changes it for the whole trip; somebody who may not edit days sees it greyed out.

Planning is done on the desktop: the other Driving settings, reordering and deleting stops, following a track and booking a night. The phone reads the plan and handles what a passenger decides on the road.

## MCP tools

With the [MCP](MCP-Overview) addon on as well, an assistant can plan and check a road trip without an open browser. The server uses the same scheduling, range and day-ending rules as the planner. The road trip tools exist only while the addon is on (`set_assignment_end_day` and `import_trip_gpx` are general tools and always there), and each write needs the same permission as in the browser.

| Tool | What it does | Scope |
|---|---|---|
| `get_roadtrip_context` | Reads the saved days, visits, pinned times, End times, stays, kinds of stop, vias, followed tracks and day endings, plus a `carriers` block with the flight, train, ferry, cruise and bus bookings that seam the drive and the hire cars whose desks stand on it, and the booked nights with their check-in and check-out day. | `trips:read` |
| `calculate_roadtrip` | Works out arrivals, departures, day splits, driving limit and range warnings. Missing coordinates and routing failures are reported, not hidden. A booking's terminals and a hire car's desks come back as stops carrying `carrier` (its role, type and timetable); their `assignmentId` and `placeId` are synthetic negative numbers that belong to no assignment and no place, so never pass them to the assignment or place tools. With **Start and end each day at your stay** on, the hotel rows come back as stops carrying `bookend`, with the stay's real `placeId` and a synthetic negative `assignmentId`. | `trips:read` |
| `get_roadtrip_settings`, `update_roadtrip_settings` | Read or change the trip's shared driving settings. | `trips:read`, `trips:write` |
| `search_roadtrip_corridor` | Searches along a calculated day, with the same kinds, filters and sources as the panel. It never adds anything. | `trips:read` |
| `list_route_vias`, `add_route_via`, `add_route_vias`, `update_route_via`, `reanchor_route_vias`, `remove_route_via` | List, add, move, re-pin and remove via points. | `trips:read`, `trips:write` |
| `list_day_boundaries`, `set_day_boundary` | Read or set dragged day endings. | `trips:read`, `trips:write` |
| `set_assignment_end_day` | **End the day here** for one visit. | `places:write` |
| `get_roadtrip_hazards` | Reads the current DWD and GDACS notices. | `trips:read` |
| `get_roadtrip_charging_info`, `lookup_roadtrip_charging_info` | Availability and published tariffs, for a charging stop on the trip or for any station by position. | `trips:read` |
| `preview_google_maps_route`, `import_google_maps_route` | Reads a Google Maps directions link, then appends the reviewed stops to a day. | `trips:read`, `places:write` |
| `import_trip_gpx` | Imports a GPX file's waypoints, routes and tracks into the trip. | `places:write` |

Units, limits and the exact fields are on [MCP-Addon-Tools](MCP-Addon-Tools). See also [MCP-Scopes](MCP-Scopes).

## What needs a connection

Road trip planning is online. Routing, the search along the route, via points, dragging day endings, **Find fuel**, charger data, hazard areas and the Google Maps import all need a connection, and the controls say so rather than accepting a change they cannot send.

What TREK contacts, and from where:

| Service | Asked by | When | To change it |
|---|---|---|---|
| OSRM (`routing.openstreetmap.de` by default) | the browser, and the TREK server for MCP | every route | **Own routing engine** |
| Valhalla (`valhalla1.openstreetmap.de` by default) | the browser, and the TREK server for MCP | only when avoiding road classes or offering **No motorway**, **No tolls**, **No ferry** | **Own Valhalla instance**, or not at all once only **Own routing engine** is set |
| TREK's place index and OpenStreetMap | the TREK server | the search along the route (OpenStreetMap through Overpass), and the place lookups of **Add manually** and the Google import (the usual place search) | see [TREK-Places-API](TREK-Places-API) and [Places-and-Search](Places-and-Search), and `OVERPASS_URL` and `NOMINATIM_URL` in [Environment-Variables](Environment-Variables) |
| MobiData BW OCPDB | the TREK server | when a charging stop's data is shown | |
| DWD and GDACS | the TREK server | only with **Show hazard areas** on | switch it off |
| Google short links (`maps.app.goo.gl`) | the TREK server | only to unfold a short link during the Google import | |

## Troubleshooting

| What you see | What it usually means |
|---|---|
| No **Days** / **Road trip** switch | The addon is off. An admin enables it in **Admin → Addons**. On a phone, look for the **Road trip** tab instead. |
| *No route yet* | The trip has no days with places yet. Add places under **Days**, or give a place its coordinates. |
| **No route** on a leg | The routing server did not answer that leg: usually the public servers' limit of about one request a second, sometimes a place the road network cannot reach. TREK retries and asks a refused day one leg at a time; reload later, or set your own engine. |
| *Still working out the rest of the drive* for a long time | A long trip on the public routing servers. Every leg is a request, spaced a second apart. |
| *Daily breaks cannot be calculated until all connecting routes are available.* | A leg is missing. The day endings appear once every leg has routed. |
| *A fixed time conflicts with the drive and daily breaks.* | A time you pinned cannot be reached with the daily travel times. Your time is kept; move it, or change the daily times. |
| *A drive exceeds the daily travel window.* | With **At the last place**, one leg is longer than a whole travel day. Add a place along the way, or choose **Along the route**. |
| A stop you pinned or gave an End shows a late warning | The drive cannot get there in time. The warning says by how many minutes. |
| *Toll roads unavoidable* (or motorways, ferries) on a day | There is no way round on that day. The day uses the road; the other days still avoid it. |
| *Your routing provider does not support avoidance.* | Your own OSRM is set without a Valhalla. Set **Own Valhalla instance** too. |
| Routes stay straight lines after setting your own engine | The server was not restarted, the page was not reloaded, or the browser cannot reach the address (see [Routing engines](#routing-engines)). The browser's developer console shows the blocked request. |
| The search finds nothing where you know there is a charger | It is probably missing from the open data the search reads. Use **Add manually**. |
| *The place search is not answering right now.* or stretches that *could not be searched* | The place index or the OpenStreetMap mirrors did not answer. Search again, or narrow the stretch. |
| *Use a Google Maps directions link.* | The link is not a Google Maps directions link, for example a single place. |
| *The link must contain between 2 and 30 readable stops.* | Too few or too many stops in the link. Split a longer route into days. |
| Via handles do not appear or do not move | Zoom in further. Otherwise you are offline, or you may not edit days on this trip. |
| *No via point on the drive to or from your stay. Add a stop there instead.* | You clicked the drive to or from a hotel row, which takes no via point. Add a stop there instead, or switch off **Start and end each day at your stay**. |

## See also

- [Accommodations](Accommodations): how a booked night becomes a stop on the drive
- [Route Optimization](Route-Optimization): route modes and the day plan's routing
- [Map Features](Map-Features): the planner map
- [Places and Search](Places-and-Search): importing GPX and KML files and Google Maps lists
- [Transport: Flights, Trains, Cars](Transport-Flights-Trains-Cars): car bookings with stops
- [MCP Addon Tools](MCP-Addon-Tools): the road trip tools in detail
- [Admin: Addons](Admin-Addons): switching the addon on
- [Addons Overview](Addons-Overview): the full addon table
