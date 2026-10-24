# Tours

The **Tours** add-on plans routes inside a trip: hikes and runs, city walks, bike rides, ski days, paddle tours and horse rides, as single-day tours or over several days with stages. A tour has a line on the map, a distance, an ascent and a planned time, and goes on the trip's days like a place does. You can draw a tour in TREK, import a GPX, KML or KMZ file, take one over from another trip or a collection, or bring in a trail from wanderer.

Tours is a trip add-on and on by default; an administrator switches it under **Admin > Add-ons**. While it is on, the Plan tab gets a **Places / Tours** switch in its right column and the trip gets a **Tours** tab for drawing and editing. The Tours tab needs a tablet or a computer; on a phone you see and plan tours, but do not draw them.

This page follows the app: the Plan tab first, then the tour card, the Tours tab and its tools, and at the end what is special about each kind of tour.


## Tours on the Plan tab

While the Tours add-on is on, the right column of the Plan tab has a switch at its top: **Places** and **Tours**. **Tours** replaces the places list with every tour of the trip, so you can plan them next to the days. Tours never appear in the Places list while the add-on is on; a GPX or KML track you import is always a tour.

Each row shows:

- a coloured bar: the colour of the tour's line on the map,
- a round tile: the routing limit (T1 to T6) of a hike planned in TREK, or the icon of the tour's type (bike, run, paddle, horse, ski); a small **GPX** or **wanderer** badge at its foot marks an import,
- the name, the description and a line of badges: the days the tour is on, its time, distance and ascent, a warning triangle when the imported heights or measures are incomplete, and a tick when a recorded track belongs to it,
- for a multi-day tour, a moon with the number of its stages.

Click a row to open the tour's card over the map with its measures and, under **Trip days**, the days it is on. Clicking a tour's line on the map marks its row in the list and scrolls to it.

What the Plan tab does not do: draw or change a route, and delete a tour. Both happen on the **Tours** tab, under **Tours of this trip** (click a tour to open it in the planner, or use the bin on its row). The Tours tab is hidden on phones; tablets and computers have it.

## Putting a tour on a day

There are three ways:

- **The round +** on a row (**Add to day**) opens a menu of the trip's days, each with its date and title. A day that already holds the tour is greyed out.
- **Dragging** a row onto a day in the days column. Dropped between two stops, the tour lands there; dropped on the day's header, it goes to the end.
- **Add to Day** on the tour's card, which plans it on the open day. It is there only while a day is open (click the day's header first).

A tour is on a day at most once. Dropping it on a day that has it already only shows *This tour is already on that day.* The undo arrow above the days takes an assignment back.

A **multi-day tour** (a tour with stage ends) asks how it goes on the day:

- **Stages from this day on**: stage 1 on that day and each next stage on the day after. If the trip ends first, the choice reads *Stages from this day on, up to stage N*, and the stages after it stay without a day.
- **Whole tour on this day**: the whole route on that one day. It is greyed out on a day that already holds the tour.

The + menu asks in a second menu; a drag asks in a small dialog, where **Cancel** leaves the plan as it was.

Putting a tour on a day needs the right to change the trip's days. Without it the + is greyed out and the rows cannot be dragged.

## Tour times in the day plan

In the days column, a tour is a row like any stop. Open **More options** (the three dots) on it and choose **Edit** to give it a **Start** and, if you like, an **End**.

- With a start and no end, TREK works the end out: the start plus the tour's time. The form says so under the fields, and the row shows *start → end* with the worked-out end lighter.
- `≈` marks an estimate, `≥` an end that is at least that late because a stay along the way has no time yet, and `+1` an end past midnight. Point at the end to see how it was worked out.
- An end you type wins over the worked-out one.
- A day that holds one stage of a multi-day tour gets no worked-out end, because the tour's time is that of the whole route.

If the tour ends after the next timed item of the day begins, a line under the row says so (*Ends at 13:30, after Lunch starts at 12:30*). Nothing is moved; it is a hint.

The same menu also has **Remove from day**, **Leave out of route** (the tour stays on the day but the day's route on the map leaves it out; **Add back to route** undoes it), **Open Website** when the tour has one, and **Save to Collection**, which keeps the tour with its route, as the **Collection** button on its card does. There is no **Delete** for a tour here.

## Taking a tour off a day

Choose **Remove from day** in the tour's **More options** menu in the days column, or open the day (click its header), open the tour and click **Remove from Day** on its card. The tour stays in the trip and in the list, now without that day's badge, and the filter counts it under **Unplanned** again once it is on no day.

A multi-day tour placed a stage a day has one entry per day, so it comes off one day at a time.

## Filtering the tour list

The filter button under **Import GPX or KML** shows the status it filters by (**All**, **Unplanned** or **Planned**), the number of tours left and **+1**, **+2** for each further filter. Click it for the menu:

| Section | Values | Shown when |
|---|---|---|
| Status | All, Unplanned (on no day), Planned (on at least one day) | always |
| Source | TREK, GPX import, wanderer | the list holds tours from two or more sources |
| Routing limit | T1 to T6 | the planned hikes differ in it |
| Type | Hike, Bike tour, Run, Ski & winter, Paddle tour, City / sightseeing walk, Horse ride | the list mixes types |

Each value says how many tours it keeps. Click a ticked value again to clear it; Escape or a click outside closes the menu. If nothing matches, the list says *No tour matches these filters.* and **Reset filters** clears them all.

The routing limit is the highest difficulty the route was planned to allow, as stored with the tour, not the difficulty measured on the trail. Filters only change what the list shows; they are not saved and start at **All** when you open the trip again.

## Hiding tours on the map

Point at a row and click the eye (**Hide on the map**). The tour's line and pin leave the map; the row stays, dimmed, with a crossed-out eye (**Show on the map**) that brings it back. While any tour is hidden, a line above the list says **Hidden on the map** with how many, and **Show all** puts them all back.

Limits:

- Hiding is yours alone. It is kept in this browser for this trip and changes nothing about the tour, its days or its colour, and nobody else's map loses it. Another browser or device shows every tour.
- It works on the Plan tab. The Tours tab has no eye, and the phone map always shows every tour.

## Importing tracks on the Plan tab

**Import GPX or KML** at the top of the tours list takes `.gpx`, `.kml` and `.kmz` files, several at once. Nothing is saved before you confirm: the **Import preview** shows each track on a map with its number of points, *No heights in the file* where the file has none, and *Already in the trip* for a track the trip already holds, which is not imported twice. Files with no track or route in them are listed under **Not imported**.

Under **Import as**, choose the type every track of the import becomes (Hike, Bike tour, Run, Paddle tour, Ski & winter, Horse ride and so on). Some types ask more: a bike or run profile, a paddle tour's boat and water, a ski track's discipline. Then click **Import N tours**.

The new tours appear in the list with a **GPX** badge and on the map. On the Plan tab an import does not open in a planner; put it on a day with its round +, or open it on the Tours tab. Importing needs the right to edit the trip's places.

## Tour card

A tour opens a card of its own over the map on the **Plan** tab, the counterpart of a place's card. Open it in one of three ways:

- switch the right column from **Places** to **Tours** and click a tour in the list,
- click the tour's row inside a day,
- click the tour's line or pin on the map.

The map stays usable while the card is open, and **Escape** or the **X** in the head closes it.

The head shows the tour's round tile, its name and a row of pills: the type (Hike, Bike tour, Run, Ski & winter, Paddle tour, City / sightseeing walk, Horse ride), a run's profile and pace or a ski tour's discipline, a paddle tour's boat and water, where an imported tour came from, the planned time, the distance, the ascent and the descent. The time pill's tooltip lists its parts: the time on the move, the breaks and the planned total, or for a city walk the walking time and the stays. An amber **use with caution** pill marks an import whose heights or measures are incomplete.

The body holds, as far as they apply:

| Section | What it shows |
|---|---|
| Trip days | One tile per day the tour is on, with the date. *Not on any day of the trip yet* for an unplanned tour. |
| Measures | Distance, Minimum altitude, Maximum altitude, Ascent, Descent, the times, and the elevation profile in the tour's colour. A paddle tour has no heights and no profile, because its points lie on the banks. |
| Stations | A city walk's stations, with stays and check-offs. |
| Checks and wind | A paddle tour's checks and the wind at its start. |
| Actual track | The recordings linked to the tour, compared with the plan. |
| Packing list | The packing list or category the tour points at. |
| Description, Notes | The tour's texts, and the notes of the stop when the card was opened from a day. |
| Origin | Where the tour came from. |
| Files | The files kept with the tour. |

The footer holds **Add to Day** or **Remove from Day** (only while a day is open), **Navigation**, the tour's web page, **GPX**, **Share** (only where the device can share files), **Collection** (only with the Collections addon on) and **Copy**.

The card does not edit the route and has no delete. Both are in the **Tours** tab: open it and click the tour under **Tours of this trip**. On a phone the Tours tab is not offered and the card opens as a sheet for reading and taking the tour along.

## Tour card: name and colour

The pencil beside the name renames the tour in place: **Enter** or the round check button saves, **Escape** keeps the old name. The coloured dot on the tile, **Track colour**, opens a colour row under the head. **Automatic color** gives the line its inherited colour back, the preset cells set a fixed one, and **Choose custom color** opens the system's colour picker. The line on the map, the stripe in the Tours list and the card's tint follow at once.

Name and colour are part of the trip and everyone sees them. Only members who may edit places can change them. To hide a tour on your own map only, use the eye in the Tours list, which is kept in this browser.

## Tour card: taking a tour along

- **Navigation** opens the start of the tour in a map app. With several apps on offer it lists them; with a preferred map app set in Settings it opens that one directly. It leads to the start only, not along the route.
- The **web page** button appears when the tour has a website. It is labelled with the site's name for Komoot, AllTrails, Outdooractive and Wanderer, and **Website** for any other address.
- **GPX** downloads the saved tour as a GPX file with the whole route and the heights it has. The file is made by the server, so it needs a connection; a tour created offline can be exported once it has synced.
- **Share** hands the same GPX file to the system's share sheet. It only appears where the browser can share files, which is usually a phone or a tablet.

In the Tours tab the same export sits at the top of the left column. There it waits while the open tour has unsaved changes, because the file only holds what is saved.

## Tour card: copies and collections

**Copy** makes a new, independent tour in the same trip, named after the original with *(copy)* behind it, and opens it. The copy has no days. **Collection** keeps an independent copy of the tour in one of your collection lists, under a name you can change, so it can be added to another trip later from the Collections page.

Both are copies: a later change to the tour reaches neither of them, and the other way round. Lists you may only read cannot be picked. Without any list the dialog offers **Open collections**. **Save to Collection** in a tour's menu in the day plan, and the bookmark in the Tours tab, open the same dialog; the Tours tab asks you to save the tour first while it has unsaved changes. You do not need edit rights on the trip to keep a copy, only a list you may add to.

## Tour card: packing list

A tour can point at the trip's whole packing list or at one of its categories. **Link a packing list** opens the choice under **Link to**, each row with its item count; **Link** saves it. The card then shows the linked list, *n of m packed*, a progress bar and the first items, with **All packed** once everything is ticked. **Open packing list** switches to the Lists tab on the packing side, where the items are ticked off; the card follows every tick live.

It is only a link: nothing is copied, and **Remove link** leaves the list and its items as they are. **Change** in the section head points the tour elsewhere. Linking needs the right to edit places, and each traveller only sees the items they may see. With the Packing addon switched off, an existing link shows dimmed and can only be removed.

## Tour card: files

**Upload** in the head of the Files section adds one or more files to the tour. The row below counts them and unfolds to the list; a click on a file opens it. The files are trip files, so they also show in the Files tab. Upload is offered to members who may change the tour and add files.

## Tour card: actual tracks

A planned tour can carry the track you actually recorded, without the plan changing. **Add actual track** opens a dialog: **Done on** picks the day of the trip the tour was done on (or **No day**), **Track** lists the recordings of the trip that can be linked, **Import GPX** brings in a new file, and **Actual** previews what the chosen track measured. **Link** saves it.

Only an import that was not planned over can be linked, each track to one tour, and a tour that is itself the track of another cannot carry one. **Time taken** runs from the first to the last time stamp, breaks included; a file without time stamps says *No time stamps*.

Each linked track gets a **Plan and actual** table (Distance, Ascent, Descent, Time with breaks, and the Difference), **Farthest from the plan** and **Off the plan**, which counts the recorded stretches that ran more than a set distance away from the planned line. **Compare on map** draws the track dotted beside the plan on the trip map; it is not offered on a phone. **Change** picks another recording and **Unlink** takes it off; the track stays in the trip as an import. The tour activities in the Atlas use a linked track instead of the planned values.

## Tour card: origin

**Origin** says where a tour came from:

- **Source**: *planned in TREK*, *GPX import* (or *KML import*, *KMZ import*) with the file name, or *wanderer* with the instance's address and an **Open in wanderer** link.
- **Taken over from**: the trip and tour a taken-over tour was copied from.
- **Imported** or **Created**: the date.
- **Here**: how the tour stands now against what came in: *As imported*, *Edited in TREK*, or *Planned over, recorded track kept*.

For a tour imported from wanderer, members who may edit see **Check source**. It asks wanderer whether the trail changed since the import and changes nothing in the trip. The answer is *Unchanged since the import*, *Changed on wanderer* with the parts that differ (Name, Description, Route), or why it cannot compare, for example *No wanderer connection*. **Import as new snapshot** brings a changed trail in as a new tour beside the old one, which keeps its days and notes. The wanderer connection is set up in Settings, under Integrations.

## The Tours tab

The **Tours** tab is the trip's tour planner. It sits in the trip's tab bar right after **Plan** and exists while an admin has the **Tours** addon on. The tab is offered on a computer and on a tablet; below the phone breakpoint it is left out, and a phone views tours and puts them on days from the **Plan** tab instead, without drawing them.

The tab has three parts:

| Part | What it holds |
|---|---|
| Left rail | The editor. With nothing open it offers **Plan new tour**. A tour in it shows **Tour name**, **Tour type**, **Days** (day tour or multi-day tour), **Waypoints**, the cards of its type and **Details**, with **Discard** and **Save** at the bottom. An imported track opens here as **GPX tour**, to look at. |
| Map | **Search place or address** at the top moves the map. The pill at the bottom left switches the map and holds the switches of the open tour. |
| Right rail, **Tours of this trip** | **Tour summary** of the tour in the editor, the filter, **Trip totals** and the list of every tour of the trip. The plus in its head, **Add tour**, offers **Import GPX or KML**, **Import walk from Google Maps**, **Take over a tour from another trip** and, while a tour is open, **Plan new tour**. |

**Collapse**, on the tab at the inner edge of each rail, folds the rail away; **Plan** and **Tours of this trip** bring them back. A rail's edge can be dragged to make it wider or narrower. GPX, KML and KMZ files dropped anywhere on the tab are imported as tours of the trip.

The maps the pill offers depend on the type of the open tour: **Map** and **Satellite** always, **Topo** for a hike, a run, a bike tour, a horse ride and a ski and winter tour, **Hiking** for a hike and **Cycling** for a bike tour where an admin has those maps on. **3D** shows the landscape, **Via ferratas** the ferratas around a hike, and **Set points** is the switch that lets a click on the map set a point.

## Drawing a tour

**Plan new tour** opens an empty tour, a hike until another type is chosen. Its points are set on the map:

1. Move the map to where the tour starts, with **Search place or address** or by dragging it.
2. Check that **Set points** is on. It is the same switch as **Add point** under **Waypoints**: on by default on the flat map, off by default in 3D, where every look around is a drag. While it is on, the pointer is a crosshair.
3. Click the map in the order you walk. Every click adds the point as the new end of the tour and shows **Point set** at the foot of the map, with **Undo**.
4. From two points on, TREK plans the route along the ways the tour's type uses. A small dot beside **New tour** says what it is doing: **Waiting to calculate**, **Calculating walking route…**, **Loading elevation…**. Once it has gone, the route is ready.

Points cannot be inserted between two others by a click on the map: a click always adds a new end. To bend the route between two points, click the drawn route (a shaping point, see below), or reorder the points afterwards.

A point that no way of the tour's type comes near is not joined: the editor names the point (**No path for hikes reaches point 3**), says how far the nearest way is, and offers **Show point 3**. Move the point onto a way, or draw the leg to it by hand.

**The draft.** Until it is saved, the tour is a draft. The draft is kept: opening the Tours tab of the trip again restores it, marked **Unsaved draft restored**. **Plan new tour** while a draft holds changes asks **Start a new tour?** (**Discard and start**). If a route or the heights cannot be had, the status says so (**Route calculation failed. The last good route is still shown.**) and **Retry** asks again.

## Tour types

**Tour type**, under **Tour name**, decides which ways the route takes and how its time is estimated:

| Type | What it plans |
|---|---|
| **Hike** | On foot, within a maximum trail difficulty you set |
| **City / sightseeing walk** | On foot from stop to stop, without a hiking limit |
| **Run** | On foot at your own pace, on runnable ways |
| **Bike tour** | By bike, routed for touring, road, gravel or MTB |
| **Paddle tour** | On the water, by kayak, canoe or SUP |
| **Horse ride** | On horseback, along signposted horse routes |
| **Ski & winter** | Skiing, snowboarding, snowshoeing, winter hikes |

A bike tour asks for its **Profile**: **Touring**, **Road**, **Gravel** or **MTB**, each with a line on what it prefers. Changing the type or the profile plans the route again; it is one step of the history, so **Undo waypoint edit** brings the old type and route back. Some types need more before **Save** works: a run its planned pace, a paddle tour its boat and its water, a ski and winter tour its discipline. The cards each type adds to the editor are described with that type.

## Moving, ordering and removing points

Every point has a numbered pin on the map and a row under **Waypoints**. The first row carries a **Start** badge and the last one **End**; the card's head counts the stops.

- **Move a point**: drag its pin on the map. The legs to and from it are planned again.
- **Select a point**: click its row, or its pin. The two are highlighted together.
- **Reorder**: drag a row by the grip that appears at its left edge on hover, or use **Move waypoint up** and **Move waypoint down** in its **More actions** menu (the three dots). A point moved to the top or the bottom becomes the start or the end.
- **Remove**: **Remove waypoint**, the bin beside the menu.
- **Undo waypoint edit** and **Redo waypoint edit** in the rail head step through every change of the points, the type and the profile. They have no keyboard shortcut.

A row shows the point's coordinates until its place name has loaded, and keeps them when no name is found.

## Shaping points

A shaping point steers the route without being a stop. Click the drawn route where it should run differently: a small dot appears there, selected, and can be dragged onto the path the route should take. Under **Waypoints** it is listed with a **Shaping point** badge and no number, so the stops keep their numbers, and it is not counted.

**Make it a shaping point** and **Make it a stop** in a point's **More actions** turn one into the other. The start and the end are always stops, a shaping point cannot end a stage of a multi-day tour, and on a horse ride a click on the line adds nothing, because no router shapes it.

## Round trips and reversing a tour

The head of the **Waypoints** card holds the tools for the whole route:

- **Reverse direction** turns the tour round. A leg drawn by hand stays drawn by hand, in the other direction.
- **Return to start** adds a last leg back to the first point. The last row then reads **Back to start**, and the button says **The tour already returns to its start**. Removing that row makes the tour one way again.
- On a hike, **Round hike from the start** looks for round hikes of a length you choose; see the hike reference.

## Legs drawn by hand

Where no router finds a way, or the one it finds is wrong, a leg can be drawn by hand: **Draw the next leg by hand** in the **More actions** of the point the leg starts at. The leg becomes a dashed straight line, and the list shows **Drawn by hand, not routed** with its length. Nobody checked such a leg: it may cross water, private land or a cliff.

**Route the next leg again** in the same menu gives the leg back to the router. **Plan the next leg again** asks the router once more for a routed leg, without touching the others. A hike also offers **Compare ways for the next leg**, described with the hike.

## Trip places as stops

**Trip places**, beside **Add point** under **Waypoints**, unfolds the trip's places with a spot on the map, searchable by **Search the trip's places**. **Near the tour** lists the places within two kilometres of the route, nearest first with their distance; **More places of the trip** holds the rest. A click adds the place as the new end of the tour, and the list stays open for the next one.

The new stop stands for the place: its row says **Place of the trip** under the place's name. The point keeps its own coordinates from then on, and the place stays a place of its own, with its days. **Unlink from the place** in the point's menu drops the link and keeps the point; removing the stop leaves the place as it is. A place already in the tour is marked **In the tour**, and the trip's tours are never offered as stops.

## Name, details and planned time

**Tour name** at the top of the editor is the tour's name. The grey text there (**Untitled hike**, **Untitled bike tour** and so on) is a placeholder, not a name, and **Save** needs a real one.

**Details**, folded with the arrow beside it and remembered in this browser, holds:

| Field | Notes |
|---|---|
| **Description** | Up to 2,000 characters. |
| **Website** | A web address; anything else is refused with **TREK cannot use that address.** |
| **Maximum trail difficulty**, **Route choice** | A hike's only, see the hike reference. |
| **Breaks** | Time added to the estimate. Not on a city walk, whose stays at the stops take its place. |
| **Planned** | The total: estimate plus breaks. A time typed here overrides it and is marked **Manual override**. |

Times are typed as `2:56`, `2 h 56` or `176` (minutes), from 0 to 1,440 minutes for a day tour. **Details** opens by itself while one of its fields holds a value **Save** refuses.

## Saving a tour

**Save**, at the bottom of the editor, is offered once the tour has a name, a route that is calculated, heights for all of it, and no field it refuses, and only when something changed. A saved tour shows **Tour saved**, and the editor becomes **Edit tour**. A new tour is on no day; it is put on a day from **Tours of this trip** or from the Plan tab.

**Discard** throws the unsaved changes away after **Discard unsaved tour changes?**; the saved tour, its waypoints, files and days are not touched. **Back to Tours** closes the editor and asks the same question first when there are changes. A save that fails keeps the draft (**Tour could not be saved. Your draft is still here.**).

## Changing a saved tour

Click a tour under **Tours of this trip** to open it in the editor as **Edit tour**. Its route is planned again from its points as it opens. Everything that works on a new tour works here, and **Save** keeps the tour's days, files and notes. Opening another tour while the editor holds unsaved changes asks first.

A tour that was imported (a GPX, KML or KMZ file, or a wanderer trail) has no points of its own: it opens as **GPX tour**, to look at, and **Plan an editable version** there makes a tour that can be changed. **Download GPX** and **Keep in a collection** in the head of the editor work on a saved tour, and wait for the changes to be saved.

## When a tour was saved elsewhere

Tours of a trip follow every save live, so the editor knows when someone else saves the tour it has open, or you do from another device:

- Without changes of your own, the editor simply loads the newer version and says so.
- With changes, **This tour was saved elsewhere** appears at the top of the editor. Your changes stay. **Load newer** throws them away and loads the other version, after **Load the newer version?**.
- Saving anyway does not overwrite. **Changed in the meantime** asks what to do: **Save as new tour** keeps both (yours is named after the tour with **(my version)** behind it), **Load newer** takes the other version, and **Overwrite** puts yours over it on purpose.

## Tour summary and elevation profile

While a tour with a route is in the editor, **Tour summary** at the top of **Tours of this trip** gives its **Distance**, **Ascent** and **Descent**, the time estimated for its type (the info dot beside it says how it is worked out), **Breaks** and **Planned**. A route over a via ferrata carries a warning badge with the ferrata's grade.

**Elevation profile** draws the height along the route. Moving the pointer along it reads the distance and the height at that spot and marks it on the map; from the keyboard the arrow keys step along it. **Collapse elevation profile** folds the profile, the card's title folds the whole summary. A route without heights has no profile, and a paddle tour shows none.

## Tours of this trip

The right rail lists every tour of the trip, planned or imported. A row gives the tour's type, name, time, distance, climb and the days it is on.

- **Filter**: the button above the list names the status it shows (**All**, **Unplanned**, **Planned**) with the number of tours. Its menu narrows by **Status**, and where the tours differ in them by **Source**, **Routing limit** and **Type**. **Reset filters** clears them when nothing is left.
- **Trip totals**: the tours shown, how many are **Planned** and **Unplanned**, and, opened with the arrow, a line per type with the distance, ascent, descent and the times added up. Each tour counts once, even on several days; times stay apart by kind and are never added across types. A sum with ≥ in front lacks some tours.
- **Add to day**: the round plus on a row opens the trip's days. A day that already holds the tour is greyed out; a multi-day tour asks how its stages go on the days.
- **Delete**: the bin on a row, see below.

## Deleting a tour

The bin on a tour's row under **Tours of this trip** deletes it after a confirmation that names what goes with it: the route, the editable waypoints and the day assignments. **Delete permanently** cannot be undone, and **Undo** does not bring a tour back. Only travellers who may edit the trip's places see the bin. To take a tour off a day and keep it, use **Remove from day** in the day plan instead.

## Importing GPX, KML and KMZ files

A track you already have, recorded on a GPS watch, drawn in another app or saved from Google Earth, comes into a trip as a tour. Every way in goes through the **Import preview**, so you see what a file holds before anything is stored.

**Where to start**

- **Tours tab:** the **+** (**Add tour**) at the top of **Tours of this trip**, then **Import GPX or KML**.
- **Tours tab, by drag and drop:** drag one or more files from your computer anywhere onto the tab. The workspace dims and says *Drop GPX, KML or KMZ files to import them*. Dragging a waypoint or a tour row is not a file drop.
- **Plan tab:** switch the right column to **Tours** and use **Import GPX or KML** at the top of the list. The import does not open in the planner there; open the Tours tab to look at it.

With the Tours addon on, the places column no longer imports tracks: **Import file** is not offered for GPX and KML there, and a file dropped on it is ignored. Tracks always come in as tours.

**What the preview shows**

- A map with the whole course of every file.
- One numbered row per track or route, with its distance, ascent, descent and number of points. A track whose points all carry a time also shows the day it was recorded and how long it took.
- *No heights in the file* where the file has no elevation. The line and the distance are right, ascent and descent stay unknown, and the tour is marked *Imported with caution*.
- *Already in the trip* on a track the trip holds already. It is greyed out and skipped; when every track is a duplicate, there is nothing to import.
- For KML and KMZ, a **Not imported** line that counts the pins, areas and other items the file held besides its lines. Tours are made of lines only, and nothing a file links to is loaded from elsewhere.

**Import as** sets the type for every track of the import. **Hike** is preset. The other types ask for what they need: a profile for a **Bike tour** or a **Run**, the boat and the water for a **Paddle tour**, the discipline (and for cross-country the technique) for **Ski & winter**. A **Horse ride** is kept exactly as ridden: no riding time is worked out and access is not checked.

**Import 1 tour** (or **Import _n_ tours**) stores them. **Cancel** stores nothing.

**Limits**

- GPX, KML and KMZ only, up to 10 MB a file. A KMZ that unpacks too large, or holds no KML, is refused with its name.
- Every track or route becomes a tour of its own. Tracks of one file are never joined.
- A new tour is on no day yet. A single import opens straight away in the Tours tab.
- Importing needs a connection to the server; it is not queued offline.
- You need permission to add places in the trip. Without it the drop zone says *You cannot add tours to this trip*.

## Viewing an imported track

An import is a recorded track, not a planned route. Clicked in **Tours of this trip**, it opens as a **GPX tour** (a **wanderer tour** for a trail from wanderer): its line on the map, a badge saying where it came from, the **Tour summary** with distance, heights and, for a recorded track, its moving time, and the elevation profile.

Nothing is worked out again: the line, the heights and the times are the file's. An import has no waypoints, so it cannot be edited point by point; the **Editable version** card above the summary plans one from it (see below). The head of the column has **Download GPX** and **Keep in a collection**. **Back to Tours** closes it.

## Planning an editable version of an import

**Plan an editable version** turns an import into a tour with waypoints. TREK takes control points from the track, routes them again with the planner's own router and shows how close that comes before anything changes:

| In the card | What it says |
|---|---|
| **Import** and **Suggestion** | the length of each |
| **Within 50 m of the track** | how much of the suggestion stays that close to the recording |
| **Largest deviation** | the furthest the suggestion strays |
| **Control points** | how many points were taken |

On the map the import is dotted and the suggestion solid. When the suggestion leaves the track over longer stretches, the card says so; check those parts on the map before planning with it.

Then choose:

- **Replace the import** plans this tour over in place. Its days, times and notes stay, and the recorded track is kept so you can go back to it. Its **Origin** then reads *Planned over, recorded track kept*.
- **Plan as new tour** starts a second tour beside the import, which stays as it is.
- **Discard** drops the suggestion.

Either way the result opens in the editor and is stored only when you click **Save**.

A paddle or ski import is joined with straight lines between its points instead of being routed. A horse ride has no editable version. A track too short to plan from, or one the router cannot follow, says so and offers **Retry**.

## Going back to the recorded track

A tour planned over with **Replace the import** keeps its recorded track for as long as it exists, not only right after. In the editor it shows a **Recorded track** card; **Restore recorded track**, confirmed once, drops the waypoints and the routed line and shows the tour as the import it was. Its days and notes stay. A tour made with **Plan as new tour** has no recorded track of its own. Restoring needs a connection.

## Taking a tour over from another trip

**Take over a tour from another trip**, under the **+** of **Tours of this trip**, copies a tour of one of your other trips into this one.

- The list shows your other trips' tours with their type, trip and measures. **Search by name**, **Trip** and **Type** narrow it. Only the first 100 tours are listed; search or filter to reach the rest.
- A tour you choose is previewed on the right: its line, its measures, its waypoints and **From the trip**.
- **Name in this trip** sets the copy's name. **Take over** makes the copy.

The copy is independent: on no day yet, and later changes to either tour stay apart. Its **Origin** names the trip and tour it was **Taken over from**. It opens in the editor, unless the editor holds unsaved work, in which case it only joins the list. Taking a tour over needs a connection.

## Importing a trail from wanderer

[wanderer](https://wanderer.to) is a self-hosted trail library. Once an administrator has switched wanderer on under Tours and you have connected your instance under **Settings → Integrations**, the Tours tab offers a **wanderer** button next to **Plan new tour** while no tour is open.

- **Search trails** searches your own trails on the instance. Other people's public trails are not offered.
- **Search this map area** limits the list to trails that reach into the part of the map you see, and is marked **Map area** while on.
- A trail shows its grade, time, distance, ascent and whether it is **Public** or **Private** in wanderer. One already imported into this trip is marked **In this trip**.
- Clicked, the trail draws on the map with what its GPX file measures (**From the GPX file**) and its description. **Open in wanderer** opens it on your instance.
- **Import into trip** brings it in as a wanderer tour. For a trail already in the trip the button is **Open the tour**; for one that changed in wanderer since, **Import as new version** adds the new version beside the old one.

The import is a snapshot: later changes in wanderer do not reach the tour. **Check source** in the tour's **Origin** asks wanderer whether the trail changed since, and the background check under **Settings → Integrations** can tell you when one may have. Without a connection the browser offers **Connect in settings**. The instance has to be reachable from the TREK server; one on a private network needs [internal network access](Internal-Network-Access).

## Tour map: base maps

The map in the middle of the **Tours** tab has its own layer pill at the bottom left. It holds the base maps the open tour's type offers, one at a time:

| Base map | What it shows | Offered for |
|---|---|---|
| **Map** | The standard map of the install | Every tour, and with no tour open |
| **Topo** | OpenTopoMap: contour lines and shaded relief | Hikes, bike tours, runs, ski tours, horse rides |
| **Hiking** | OpenHikingMap: marked trails with their numbers | Hikes, while the admin allows it |
| **Cycling** | CyclOSM: cycle routes and lanes | Bike tours, while the admin allows it |
| **Satellite** | Esri World Imagery | Every tour, and with no tour open |

A paddle tour and a city walk offer **Map** and **Satellite** only.

- The choice belongs to the planner. It never changes the map in the **Plan** tab or the map setting in **Settings**, and it never changes the tour.
- It lasts for every tour you open until the page is reloaded. A tour whose type does not offer the chosen map opens on **Map**, without forgetting the choice.
- **Hiking** and **Cycling** come from volunteer servers. An admin switches each of them on for the whole install. When the open one stops answering, its segment shows a **!** and its tooltip says so; switch to another map, the tour is not affected. In 3D their credit sits above the row of controls.
- **Search place or address** at the top of the map moves the map to a place. It adds nothing to the tour.

## Tour map: overlays

After the divider in the layer pill come the switches laid over the base map. Each is off until you turn it on, except the pistes on a ski tour.

| Switch | What it adds | Offered for |
|---|---|---|
| **Set points** | A click on the map adds a point to the tour | While you edit a tour; on by default in 2D, off in 3D |
| **Via ferratas** | Via ferratas from OpenStreetMap, with a count of those in view | Hikes |
| **Seamarks** | OpenSeaMap: buoys, beacons, harbour marks | Paddle tours |
| Pistes (icon only, tooltip **Pistes, cross-country trails and lifts**) | OpenSnowMap: downhill runs, cross-country and winter trails, toboggan runs, lifts | Ski tours (on by default), and with no tour open |

- While the pistes show, **Piste key** beside the switch opens their legend: the downhill runs by difficulty (Novice, Easy, Intermediate, Advanced, Expert, Freeride), cross-country trails, winter and snowshoe trails, toboggan runs, lifts and cable cars, and a link to the full key at OpenSnowMap.
- The pistes are drawn from zoom 9 on, the seamarks from zoom 6. Further out, the pistes switch stays pressed in a lighter tone and reads **Zoom in to see the pistes**.
- The piste data is what OpenStreetMap has mapped. It says nothing about what is open or groomed, the snow or avalanches.
- When an overlay's server stops answering, its switch shows a **!** and its tooltip says so. The map and the route keep working.
- The overlays are part of your view only: switching one changes nothing for the tour or for other members.

## Tour map: places along the tour

**Along the tour** is a card in the planner's left panel, under the tour's stops. It appears once the open tour has a route, and looks for places close to that route.

- **What to look for**: the kinds to search, up to six at a time. The list depends on the tour's type: Viewpoints, Summits, Huts and shelters, Drinking water, Food, Toilets, Picnic spots, Campsites and Sights for a hike, and for other types for example Put-ins and Boat rental, Bike repair and E-bike charging, or Museums and galleries, Parks and gardens, Coffee shops, Places to eat and Markets. A tour starts with the first three of its type ticked. On a city walk four themes above the list set the kinds at once.
- **Within this distance of the route**: 250 m, 500 m (the default), 1 km or 2 km.
- **Search along the tour** asks once. Searching changes nothing on the tour. The answer stays until the next search; after the route, the kinds or the distance change, **Search again** is highlighted and says the list was found for the route as it was.
- Each place found shows its kind in its colour, its name and its distance from the route. A star marks one of the best known places there, and **In the tour** a place that is a stop already. The same places are pins on the map.
- Click a row or a pin for the place's card over the map: its kind, the distance from the route and how far along the tour it lies, opening hours and website where the source has them, e-bike charging facts, and whether it came from OpenStreetMap or TREK's places index.
- **Where it goes** picks the stretch the place joins: **Between** two stops, or **As the new end**, marked **Extends the tour**. The map shows the new way dashed before anything changes. A stretch that is a fixed line (a via ferrata, a portage) or drawn by hand cannot take a stop and says why.
- **Add as a stop** takes the place into the tour as a stop, not as a place of the trip, and the route is planned again past it. The card then says how much distance and time the tour gained, with **Undo**. The change is part of the draft until you save the tour.

Limits: the search needs a connection. A very long tour is searched along its first part only, and an area with many places shows the first 60; both are said in the card. When OpenStreetMap does not answer, **Try again** counts down until another request makes sense. When nothing is found, **Widen to** tries the next distance.

## Tour map: 3D terrain and flyover

**3D** at the end of the layer pill lays the open tour on the landscape. Click it again to return to the flat map.

- The route is draped over the terrain and coloured by its grade. **Grade** in the bottom row switches between the grade colours and the tour's own colour.
- **Grade mix** sums the grades up: folded, it shows the highest point and the steepest stretch; unfolded, the share of the tour under 5 %, 5 to 10 %, 10 to 18 %, 18 to 27 % and 27 % and more.
- **Relief** exaggerates the heights from 1.0× to 3.0×, which helps on gentle ground.
- **Overview** frames the whole route again.
- **Play flyover** flies a camera along the route behind a dot, and the cursor on the elevation profile in **Tour summary** follows it. **Speed** is 1×, 2× or 4×; at 1× most tours take about 45 seconds. **Pause** stops the flight, **Start over** flies it again from the start. While the flight runs the wheel zooms around the dot and dragging the map is off.
- Before the first flight the landscape along the whole route is loaded, so the flight never waits for a tile. Until then a ring stands in place of the play button; its tooltip reads **Loading the landscape** with the share loaded.
- The chosen base map, the via ferratas, the pistes and the seamarks are drawn on the terrain as well. While you edit a tour, its numbered points can be dragged on the terrain, and with **Set points** on a click on the terrain adds one.
- A paddle tour is drawn in its own colour, with no grades and no grade mix, because water is flat.

Limits: 3D needs a connection and a browser with WebGL. The heights come from the Mapzen terrain tiles (AWS Open Data). With no tour open, the 3D map asks you to open one.

## Multi-day tours

A multi-day tour is one route cut into stages, one for each day you are on the move: a hut to hut trek, a long distance trail, a bike tour with nights on the way. It stays a single tour with a single line on the map. The stages are a view of that line, never copies of it, so moving a stop or bending a leg changes the stage it lies in and nothing else has to be kept in step.

**Making a tour multi-day.** Open the tour in the editor on the **Tours** tab (click it under **Tours of this trip**, or start one with **Plan new tour**). Under **Days**, choose **Multi-day tour**. Nothing changes yet; a note says where the first stage end goes. Then open **More actions** (the three dots) on the stop where the first day ends and choose **End stage here**. **End stage here** also works straight from a day tour: the tour turns into a multi-day tour by itself.

**What can end a stage.** Any stop between the start and the end. The first and the last stop cannot, and neither can a shaping point, since it only bends the line. A tour holds up to 60 stages.

**How a stage reads.**

- In **Waypoints**, each stage starts with a **Stage N** pill and its distance and moving time. The stop that ends a stage carries a moon at the corner of its number, and so does its pin on the map.
- **Tour summary** lists the stages under **Stages**, each from the stop it starts at to the one it ends at, with its distance, ascent, descent and moving time. A click on a stage selects its last stop and marks the spot in the elevation profile, where every stage end is drawn as a mark.
- The time of a stage is moving time: breaks are not included. A bike tour or a city walk shares the router's time out by distance. A stage that takes longer than a day turns to the warning colour and says **More than a day on the move**.
- A stage whose route is not planned yet says **Not measured yet**. Changing a stage end never asks the router again, because the line stays the same.

**Taking stages away.** **Remove stage end** in the menu of the stop with the moon joins its two stages. Removing the stop itself does the same, and a notice says so with **Undo**. **Day tour** under **Days** takes every stage end away at once, after the confirmation **Make it a day tour?** (**Remove stage ends**). The route stays as it is, and undo in the editor brings the stage ends back.

Stage ends are part of the tour, so they are kept when you click **Save**, like any other change in the editor.

## Multi-day tours on the trip days

A multi-day tour goes on the trip in one of two ways:

| Choice | What it does |
|---|---|
| **Stages from this day on** | Stage 1 on the day you picked, each next stage on the day after. If the trip ends first, it reads **Stages from this day on, up to stage N** and the stages after it stay on no day. |
| **Whole tour on this day** | The whole route on that one day. Greyed out on a day that already holds the tour (**This day already holds the tour.**). |

The choice comes up wherever a multi-day tour is put on a day:

- the plus on its row in **Tours of this trip** (**Add to day**), after you pick the day;
- **Add to Day** in the tour's card on the **Plan** tab, for the day that is open there;
- dragging the tour onto a day in the **Plan** tab, which asks in a dialog (**Cancel** leaves the plan as it was).

Spreading the stages from a day moves stages that are already on other days, puts the missing ones on, and takes the whole tour off any day it was on, since the stages take its place. A stage sits on one day at most, and a day holds the tour once. A notice says from which day the stages were put on, and undo above the days in the **Plan** tab takes the whole spread back in one step.

**Seeing the stages with their days.** In **Tours of this trip**, a multi-day tour has a fold button with a moon and its number of stages. **Show stages** unfolds them in route order, each with its measures and a day pill: **Day N**, or a dashed **No day** for a stage on no day yet. Click the pill to move that stage to another day, or choose **No day** to take it off. Under the stages, **Whole tour** adds them up; a figure only some stages know is shown as at least that much. The arrow beside a stage, **Open this stage in the planner**, opens the tour in the editor with that stage shown.

In the day plan, a stage reads as **Stage N** with its own distance and time, and keeps its own start time like any stop.

**Limits.**

- When a saved tour loses a stage that is on a day (its stage end removed, or the tour made a day tour again), the editor warns before you save: saving takes that stage off its day.
- Viewers without permission to change the days see the day pills but cannot open them.
- On the phone, the tour's sheet asks the same two choices when you add a multi-day tour to a day; the stages themselves are set in the editor on the **Tours** tab, which needs a tablet or a computer.

## Hikes

A hike is a tour on foot that the router plans along paths, up to a trail difficulty you allow. Pick **Hike** under **Tour type** in the Tours tab, then set the stops: **Add point** is on from the start on the flat map, so each click on the map adds the next stop, and **Trip places** turns a hut, a hotel or any other place of the trip into a stop. From two stops on, TREK plans the walking route between them and works out distance, climb and descent from the heights along it.

The **Estimated walking time** follows the hiking signpost rule (DIN 33466): distance, climb and descent, without breaks. Breaks go into **Breaks** under **Details** and are added to the planned total. You can also type a planned total of your own; it is then marked **Manual override**.

Limits:

- The route follows ways OpenStreetMap knows. A stop no path reaches is not routed to; the editor names it and offers to show it, and you can move it onto a path or draw the leg to it by hand.
- Routing is planning assistance, not a safety guarantee. The difficulty data in OpenStreetMap can be missing or wrong.

## Hike difficulty and route choice

**Maximum trail difficulty** under **Details** caps the paths the router may use, on the SAC hiking scale from T1 (Hiking) to T6 (Difficult alpine hiking). A new hike starts at T2 (Mountain hiking). Changing it plans the route again.

| Setting | What it means |
|---|---|
| T1, T2 | Marked paths, mountain paths. |
| T3 | Demanding mountain paths. The editor shows a warning: such paths can be exposed and need sure feet and a head for heights. |
| T4 to T6 | Alpine routes. The first time you pick one, TREK asks **Enable alpine routing?** The route may then cross exposed, unmarked or technically difficult terrain, and via ferratas. |

The limit is a setting of the route search, stored with the tour. It is not a grade of the trail you walk; **Trail details** shows what OpenStreetMap actually records.

**Route choice** under the difficulty weighs the way the router picks: **Avoid steep climbs**, **Avoid steps** and **Avoid ferries**. They prefer other ways where there are some, even longer ones, but never forbid a way: where there is no way round, the route still goes there. Each switch plans the route again and is one step of **Undo waypoint edit**.

## Hike trail details

**Trail details** appears below the waypoints of a hike that has a route, and in the view of an imported hike. Switch on **Show along the route** and TREK reads the ways under the line from OpenStreetMap once, then colours the route on the map by what you pick under **What to show**:

- **SAC**: the hiking grade (`sac_scale`) of each stretch, T1 to T6.
- **Surface**: asphalt, paving stones, gravel, natural ground, grass, rock and so on, in groups.
- **Way type**: path, footway, steps, farm or forest track, road, via ferrata and so on.

Each class has its length and its share of the route. Click one to draw only its stretches on the map, and click it again for the whole route. The badges give the share that is **Known**, the class that covers most of it, the **Highest known** grade and, for a planned hike, the **Routing limit** it was planned with. A grade above that limit is marked **Above the limit**.

Ways OpenStreetMap gives no value for are listed under **Unknown**. Unknown does not mean easy. Ways that could not be asked this time can be asked again with **Try again**. The card needs a connection and never changes the tour.

## Round hikes

A round hike starts and ends at the same stop. **Round hike from the start** in the head of the waypoints, or **Round hike from here** in a stop's **More actions**, opens the **Round hike** card over the map.

- **From** sets the stop the round starts at; **Distance** the length you want, from 1 to 60 km.
- **Find rounds** asks the router for loops within 20 % of that length. They come in as **Round A**, **Round B** and so on, each drawn in its own colour with its distance, climb, time and how far it lies off your wish.
- Rounds keep to the hike's **Maximum trail difficulty**, shown as a T pill in the card.
- **Take this round** replaces the planned stops with the round, after asking when there were stops before. **Round taken** at the bottom of the map has **Undo**, and nothing is kept until you save.

Finding rounds asks the router many times, so it takes a while. If no round from that stop fits the length, the card says so; try another distance or another stop.

## Other ways for a hike section

For a leg of a hike the router planned, **More actions** on the stop where the leg starts has **Compare ways for the next leg**. The card **Other ways for this section** lists the **Current way** and the alternatives the router knows, **Way A**, **Way B** and so on, each drawn on the map. Badges on a row say how much longer, higher or slower it is than the current way; heights that are still being looked up show a spinner.

**Take this way** asks the router once more to keep to the chosen way and only then changes the section. When the router does not keep to it, or the tour changed in the meantime, the section stays as it was and the card says why. **Way taken** at the bottom of the map has **Undo**. A leg drawn by hand, and every tour type other than a hike, has no alternatives to compare.

## Via ferratas on a hike

While a hike is open, **Via ferratas** in the row of map buttons at the bottom left draws the via ferratas OpenStreetMap knows around the map's view, as dashed lines with a sign. The badge on the button counts them, shows a spinner while they load, and turns amber with the reason when they cannot load: zoomed out too far, no connection, or the data service unreachable.

A click on a via ferrata opens its card with the name, the grade (or Grade unknown), the length and a link to OpenStreetMap. **Add to tour** puts it on at the end of the route as a fixed leg on its own line: a point at the nearer end, the via ferrata itself, a point at the other end. The router then plans only the way to it and on from the top, and never walks round the climb. A via ferrata the route already climbs reads **Part of the tour**.

Wherever the route climbs a via ferrata, whether you added it or the router took it with alpine routing on, TREK says so: a badge with the grade in **Tour summary**, a warning beside the editor's title, the leg named in **Waypoints**, its end points marked, and the stretch banded on the elevation profile. A via ferrata takes gear and experience; TREK does not judge whether it suits you.

## Runs and pace

A run is a tour on foot planned on runnable ways and timed by your own pace. Pick **Run** under **Tour type** and choose a **Profile**:

| Profile | Prefers |
|---|---|
| Running | Runnable, mostly paved ways in town, in parks and along rivers. |
| Trail running | Forest tracks and natural paths, up to mountain paths (T2). |

Type the **Planned pace** as minutes and seconds per kilometre, or per mile when your distances are in miles. The running time is distance times pace and nothing else: climbs, descents and how technical the way is are not in it. The line under the pace shows the sum, and **Tour summary** shows it as **Running time (planned)**. A run cannot be saved without a pace.

## What a run runs on

A run shows the same **Trail details** card as a hike, matched to the line as a run. Once **Show along the route** is on, the head of the card adds what a runner reads first: the share that is unpaved and the hardest graded path on the run. **Surface** and **Way type** list the stretches, and a click on one draws only those on the map. Nothing in the card changes the run's route or its time.

## City walks

A city walk is a tour on foot from stop to stop, for a day in a town rather than a day on a trail. You plan it in the **Tours** tab like any other tour: click **Plan new tour** and set **Tour type** to **City / sightseeing walk**, or open a saved walk from **Tours of this trip**. The editor is the one every tour uses (waypoints, the map, **Tour summary**), with a few differences:

- The points of a walk are **stops**. Each can carry a label, how long you stay there, how much it matters and whether it is protected.
- The way between the stops is planned on foot, without a hiking limit. A walk has no **Breaks** field: the stays take its place.
- **Tour summary** shows **Est. walking time** (the router's time on foot between the stops, without the stays), **Stays** (the stays added up) and **Planned** (the two together). Enter a planned total yourself and it is marked **Manual override**.
- Shaping points steer the line but are no stops: they get no stay, no arrival and are not counted.

The Tours tab is there on a computer and on a tablet. On a phone a walk can be read and put on a day, but not planned.

## City walk stops and stays

Point at a stop in **Waypoints**, click **More actions** and choose **Edit stop**. The dialog has:

| Field | What it does |
|---|---|
| **Label** | The stop's name. Left empty, the stop shows the name of the trip place it stands for, or the place found at that spot. |
| **Stay in minutes** | How long you stay. Empty means not known yet, 0 a point you only pass (it reads **Passing through**). Whole minutes, up to a day. |
| **Importance** | **Regular** (visited as the walk goes), **Optional** (can be left out when time runs short) or **Must see**. A full ring round the stop's number marks a must see, a dashed one an optional stop. |
| **Protected** | A change proposed later (by the assistant, for example) keeps this stop where it is. You can still edit it yourself. A small shield on the number marks it. |

**Save** in the dialog is one step of the editor's history, so **Undo** at the top of the left column takes it back. Nothing is kept until you click **Save** at the foot of the left column.

A stop taken in with **Trip places** stands for that place of the trip: it keeps its own position, and the place stays a place. **Unlink from the place** in the stop's **More actions** only undoes the link.

If the stays of some stops are not entered, the stays and the planned total read **at least**, and arrivals after such a stop read **at the earliest**.

## City walk sights along the way

**Along the tour**, in the left column once the walk has a route, searches for places near the line.

- **Walk theme** sets what to look for in one click: **Culture and history** (museums, galleries, monuments, historic places), **Parks and views** (parks, gardens, viewpoints), **Food and local life** (coffee shops, places to eat, markets) or **A bit of everything**.
- **What to look for** lists the kinds; tick them on or off one by one.
- **Within this distance of the route** sets how wide the search goes on either side of the line.
- **Search along the tour** runs it. A star marks a **Highlight**, one of the best-known places here. After you change the route the button reads **Search again**: what was found belongs to the route as it was.

Click a result to open its card over the map. **Where it goes** says between which two stops it is planned in (or **As the new end**, which extends the walk), with a rough detour in a straight line. **Add as a stop** puts it into the walk and plans the route again; a notice then says how much longer and how much farther the walk gets, with **Undo**.

A place taken in this way becomes a stop of the walk, not a place of the trip. Its opening hours come along with it when the source has them. The search needs a connection: it asks TREK's places index first and OpenStreetMap behind it, so a stretch can come back incomplete when those servers are busy.

## City walk times and opening hours

Put the walk on a day (the round **+** on its row in **Tours of this trip**, or from the Plan tab) and give it a **Start** on that day (right-click it in the day plan and choose **Edit**). Then, in the editor and in the walk's card on the Plan tab:

- **Times for** at the top of **Waypoints** names the day and the start. On a walk planned on several days, click it to see another day; the choice is not saved.
- Under each stop you read **Arrival about** and, with a stay, until when you stay. The walking time is shared out along the route by distance, and the stays before a stop are added.
- Where a stop has opening hours, it says whether it is open then. A warning appears where a place is closed at your arrival, closes during the stay or is closed all day on that date. A pill says where the hours come from: **OpenStreetMap** (found with the stop, may be out of date) or **Trip place** (entered for that place).

What is missing is said instead of a time: no day (**Put the walk on a day with a start time…**), a day without a date, or no start time on that day. An arrival after midnight is shown as the next day, and its opening hours are not checked. A stop moved since the route was last planned shows no arrival until the route is planned again.

Nothing here changes the walk: the times are a check, not a booking.

## City walk from Google Maps

Plan a walking route in Google Maps, share it, and in **Tours of this trip** click **Add tour** and choose **Import walk from Google Maps**. Paste the link under **Link to the walking route** and click **Read the link**.

- Both a `maps.app.goo.gl` short link and the long `google.com/maps/dir` address work. A short link is followed on the server and needs a connection; it is only followed while it stays on Google Maps.
- Only a route planned **on foot** is read. A link for driving, cycling or transit, or one that does not say, is refused with a note to switch Google Maps to walking.
- **Stops in the link** lists the stops in order. A stop the link gives no position is marked **No position in the link** and left out; nothing is looked up or guessed. A walk needs at least two stops with a position.
- **Load as walk** opens a new, unsaved walk in the editor with the stops and their names. TREK plans the way on foot between them itself; the line drawn in Google Maps is not taken over. If the editor holds unsaved changes, the dialog warns that loading replaces them.

Click **Save** to keep the walk. Until then it is a draft in this browser.

## Checking off a city walk

On the day, open the walk from the day plan: in the **Plan** tab, click it in its day. Its card opens beside the map, and **Stops of the walk** lists every stop with its stay and, with a start time, its arrival and opening hours.

- **Mark visited** and **Skip** mark a stop for that day; **Take back** undoes the mark. A visited stop is ticked, a skipped one struck through.
- The head of the list counts the stops visited (**3 of 7 visited**) and shows the time left on foot from the last stop visited, without the stays. Point at it for how it is worked out.
- The walk's row in the day plan shows the count as well, for example **3/7**.

Marks belong to one day of one walk: a walk on two days is checked off separately on each. Opened from the tour list rather than from a day, the card shows the stops but has nothing to check off. Marking needs the right to edit the trip's days. A walk put on a day while offline can be checked off once it has synced.

## City walk ferry crossings

Where no way on foot joins two stops, the router may cross the water by ferry. The editor then shows a notice above **Waypoints** with the crossing's length and its time by boat.

- **Show crossing** shows it on the map.
- **Take ferry** keeps it. The leg then reads **Ferry crossing**, and **Plan on foot again** on that leg undoes it.
- Otherwise select one of the two stops and move it so a way on foot joins them.

A walk with a crossing that is neither taken nor avoided cannot be saved. The boat time is kept apart from the walking time but counted in the planned total, shown as **Ferry** in **Tour summary**; without a boat time the total is a lower bound.

## Public transit between city walks

With two city walks on the same day, the leg between them in the day plan can be planned by public transit: click the leg (**Change travel mode**) and choose **Public transit**. The search then runs from the last stop of the first walk to the first stop of the next, and departs when the first walk ends (its start plus its planned total). It says when the first walk ends and when the next one starts; where the end is not known, or falls after midnight, you choose a departure time. A connection, or a journey saved before, that arrives after the next walk starts is flagged in the day plan. Nothing is moved: the walks stay two walks on foot.

Public transit needs a trip with dates and the right to edit its days.

## Bike tour profiles

A bike tour is a tour of the type **Bike tour** ("By bike, routed for touring, road, gravel or MTB"). Pick it in the **Tour type** field at the top of the editor on the **Tours** tab. Under the type, the **Profile** field says what kind of riding the router plans for:

| Profile | What the router looks for |
|---|---|
| **Touring** | Prefers cycle paths and quiet roads, paved where it can. This is the default for a new bike tour. |
| **Road** | Keeps to asphalt. Stretches known to be unpaved are pointed out in the Surface and ways card. |
| **Gravel** | Takes gravel and farm tracks, but not technical singletrails. |
| **MTB** | Takes rough tracks as they come. Trail grades are shown where they are mapped. |

Every leg between two waypoints is routed for the profile chosen. Change the profile and the whole route is planned again for the new one; nothing else on the tour changes. A profile only steers the router. It does not say whether a way can be ridden, which is what the Surface and ways card is for.

When a waypoint lies too far from any way a bike may use, no route is drawn to it. The editor says "No way for bikes reaches point N" with the distance the router would have had to jump, and **Show point N** selects that point. Move the point onto a way, or open **More actions** on the point before it and choose **Draw the next leg by hand**: that leg is then a straight line and is not routed.

Search **Along the tour** offers the stops a cyclist asks for first: **Drinking water**, **Bike repair**, **Food** and **E-bike charging**, then viewpoints, toilets, shelters, picnic spots, campsites and sights.

Where an admin has turned on **Cycling map (CyclOSM)** in Admin > Add-ons, the layer row at the bottom left of the tour map offers **Cycling** as a base map while a bike tour is open. If CyclOSM stops answering, switch to another map; the tour stays as it is.

The Tours tab is not offered on a phone. On a tablet or a computer it works as described here.

## Bike tour riding time

The **Tour summary** on the right of the Tours tab shows **Riding time (estimated)** beside the distance, the ascent and the descent. It is the router's time for the profile chosen, with its speed and the climbs weighed in. It is a planning value, breaks not included. Under **Details** in the editor, **Breaks / additional time** is added on top and shows as **Breaks**; **Planned total duration** replaces the sum with a time of your own and is marked **Manual override**.

Save stays greyed out until the tour has a name, the route is calculated and the heights along it are known.

## Bike tour surface and ways

While a bike tour is open in the editor and its route is calculated, the **Surface and ways** card sits under **Waypoints**. It reads the route as the router planned it, from OpenStreetMap, and changes nothing on the tour.

- **The badge in the header** gives the share of the route known to be unpaved (compacted, gravel or natural ground).
- **Surface**: a bar of the shares, then one row per surface with its length and share: **Asphalt**, **Rough paving**, **Compacted**, **Gravel**, **Natural ground** and **Not in the data**.
- **Kind of way**: **Cycle path**, **Cycle lane beside traffic**, **Quiet street**, **Road with traffic**, **Farm or forest track**, **Path**, **Ferry** and **Other**.
- **On the Road profile** a warning above the bars says how far is known to be unpaved, and **Show on the map** marks those stretches.

Click a row and its stretches light up on the map. Click the row again, or another row, to let them go. Only the classes the route actually has get a row, the largest first.

"Not in the data" means OpenStreetMap records no surface there. That is unknown, not fine. Reading the ways needs a connection: offline the card says "Surfaces and trail grades need a connection.", and when the reading fails the route itself is unaffected. The card folds from its header and stays folded in this browser after a reload.

The card is part of the editor only. A tour's detail card on the Plan tab does not show it.

## Bike tour trail grades

On the **MTB** profile the Surface and ways card also reads the trail grades along the route, as OpenStreetMap mappers tagged them:

- **Trail grade (mtb:scale)**: the share of the route from **S0, no particular difficulty** through **S1, small obstacles**, **S2, roots, steps, loose ground** and **S3, blocks, steep, tight bends** to **S4 and up, expert ground**, then **No grade in the data** and **Could not be asked this time**.
- **Uphill grade (mtb:scale:uphill)**: shown only when some of the route carries an uphill grade.

Click a grade row to light up those trails on the map, as with the surfaces. A way without a grade is unknown, not easy, and a grade says nothing about whether a trail suits you. TREK asks its own map data for the grades and falls back to the public Overpass service. When neither answers, the card says "The trail grades could not be read this time." with **Try again**. Grades are only read on the MTB profile; switch a tour to another profile and the grade sections go away.

## Ski and winter tours

**Ski & winter** is the tour type for anything on snow: a day on the pistes, a cross-country loop, a ski tour, a snowshoe walk or a winter hike. You plan one on the **Tours** tab like any other tour (**Plan new tour**, then **Tour type** > **Ski & winter**), but its legs are laid by TREK's piste router instead of a walking or cycling router.

Every ski tour has a **Discipline**, and none is preselected: the tour cannot be saved until you pick one.

| Discipline | What the router plans on |
|---|---|
| **Alpine**, **Snowboard** | Downhill runs and lifts, within your hardest grade |
| **Cross-country** | Cross-country trails, for the **Technique** you choose (**Classic**, **Skating** or **Unknown**) |
| **Ski touring** | Ski touring routes and runs, uphill on your own where you choose to |
| **Snowshoeing**, **Winter hiking** | Winter and snowshoe trails; outside the piste data, summer paths |

Click the map with **Add point** on (it is on by default) and each point is joined to the one before it. Under every point its leg is listed as chips, one per run, lift or stretch on foot, with the run's grade as a coloured dot and the minutes on it. Changing the discipline keeps the points and plans every leg again.

A saved ski tour is shown as it was saved. It is planned again, on the current piste data, as soon as you move a point or change an option.

## Ski piste router options

Under the discipline, the planner shows only the options that discipline uses.

| Option | Values | Used by |
|---|---|---|
| **Hardest runs** | Novice, Easy, Intermediate (default), Advanced, Expert | Alpine, Snowboard, Ski touring |
| **Prefer** | Fastest (default), Most skiing, Easiest | Alpine, Snowboard |
| **Pace** | Relaxed, Normal, Sporty | Alpine, Snowboard |
| **Ride lifts** | On by default for Alpine and Snowboard, off for the others | Every discipline |
| **Allow freeride routes** | Off by default | Alpine, Snowboard, Ski touring |
| **Ride a lift down where needed** | On by default, shown while lifts are ridden | Every discipline that rides lifts |
| **Groomed trails only**, **Lit trails only** | Off by default | Cross-country |
| **Skin up at the edge of pistes** | Off by default | Ski touring |
| **Avoid guessed links** | Off by default: joins the map data only guesses, such as an unmapped stretch between two runs, may be used | Every discipline |
| **Leave out** | Surface lifts, Open chairlifts, Gondolas, Cable cars, Funiculars and trains; a pressed kind is not ridden | While lifts are ridden |

Every change plans the whole tour again.

## Ski legs that could not be planned

A leg the router cannot plan gets a red row under its point that says why, names the run or lift it is about where there is one, and offers what would plan it:

| Reason | Fix offered |
|---|---|
| Only runs harder than your limit join these points. | **Allow harder runs** |
| Only a lift you left out joins these points. | **Allow this lift** |
| The way back needs a lift down. | **Ride the lift down** |
| Only trails groomed for the other technique join these points. | **Switch technique** |
| A discipline that fits the way better | **Switch discipline** |

Every failed row also has **Draw straight**, which draws that leg as a straight line between its two points. Dragging the point closer to a run, trail or lift plans the leg again as well.

Other reasons have no one-click fix: a point too far from any run, trail or lift; no ski area in the piste data; two ski areas that are not joined; nothing in the piste data joining the points. While the piste data for an area is still being downloaded the planner waits and asks again by itself, and offline the legs are drawn straight for now. For snowshoeing and winter hiking, a leg outside the piste data may be taken on summer paths, shown in a grey note rather than as an error.

## Ski piste route summary

The **Piste route** card under the waypoints shows what the router made of the tour:

- **Skiing**, **On lifts**, **Waiting** and **On foot**: the time spent on each.
- **Runs**, **Down on runs** and **Lift rides**: the length of the runs, the height skied down on them and the number of lift rides.
- **Kept clear of**: harder runs the router avoided because of your **Hardest runs** limit.
- Notes when some legs could not be planned, when stretches rest on a guess of the map data, or when the tour was planned on an older copy of the piste data.
- The date of the map data, the ski areas and the data credit.

**Ski time** in the **Tour summary** adds the times up, for your discipline and pace. It is given only once every leg is planned; until then it reads **Not worked out**. To give the tour a time anyway, enter a planned total in its details.

## Ski pistes map layer

While a Ski & winter tour is open, the Tours map lays OpenSnowMap's pistes over the base map by itself. The snowy mountain switch in the layer row at the bottom left (tooltip **Pistes, cross-country trails and lifts**) turns them off and on, and it is there with no tour open too, so a ski area can be looked at before you plan.

- Zoomed too far out, the switch stays pale and says **Zoom in to see the pistes**.
- If the tiles stop loading, the switch shows a warning mark; the map and your route keep working.
- **Piste key**, the button with four coloured dots beside the switch, explains the colours: downhill runs by difficulty (Novice to Freeride), cross-country trails, winter and snowshoe trails, toboggan runs, lifts and cable cars, with a link to the full key at OpenSnowMap.

The layer is offered only for Ski & winter tours; hikes, bike tours and the other types do not show it.

## Importing ski tracks

A recorded ski day comes in through **Add tour** > **Import GPX or KML** on the Tours tab (or by dropping the file on the tab). In the **Import preview**, set **Import as** to **Ski & winter** and pick the **Discipline**, plus the **Technique** for Cross-country; the import stays disabled until the choice is complete.

An imported ski track is kept exactly as recorded: TREK does not lay it on the pistes, and its **Ski track** card shows **Ski time** as **Not worked out**. **Change** on that card opens **Classify ski track**, where the discipline and technique can be corrected later. **Plan an editable version** in the **Editable version** card turns the track into a ski tour you can edit; its points are joined with straight lines.

## Ski data and its limits

- The runs, lifts and trails come from OpenStreetMap, served to the piste router by the TREK Places server. Where the piste data does not reach, legs run straight between their points.
- An administrator can switch the **Piste router** off in **Admin** > **Addons**, with the Tours addon's settings. A ski tour then has its legs drawn straight.
- Nothing in TREK says whether a run, lift or trail is open or groomed, how the snow is, or anything about avalanches. The colours, the times and the 3D gradients are taken from mapped data only.
- The planner, the options and the Piste route card are on the Tours tab, which tablets and computers show. On a phone a ski tour can be read, not planned.

## Paddle tours

A paddle tour is a tour on the water: by kayak, canoe, SUP or any other boat, on a river or a lake. You plan it on the Tours tab like any other tour (Plan new tour, then Tour type: Paddle tour), and it behaves like one: it can be put on a day, kept in a collection, exported as GPX and shared with the trip. What makes it different is that its legs follow the water instead of paths, that carrying the boat and locks count into its time, and that it shows the wind for the day and what OpenStreetMap knows about weirs, locks and access rules on the route.

Paddle tours need the Tours addon. The Tours tab is not shown on phones; there a paddle tour opens read only, from the places list.

## Paddle tour settings

| Field | What it does |
|---|---|
| Boat | Kayak, Canoe, SUP or Other. It sets the speed TREK suggests. Required. |
| Water | River or Lake. Required: a paddle tour cannot be saved without boat and water. |
| Across lakes | Shown for a lake, or when the route crosses one. Straight over takes the shortest line across open water; Near the shore keeps close to the bank, longer but with land never far, for windy days. |
| Paddling speed | Empty means the boat's suggested speed applies; it shows in grey. A speed you type (0.5 to 20 km/h) is marked Own speed, and Use the suggested takes the suggestion again. Boat Other has no suggestion: without a speed, the time on the water stays open. |

The map of a paddle tour offers the Map and Satellite base layers and the Seamarks overlay from OpenSeaMap. Along the tour lists Put-ins, Boat rental and Drinking water first. A paddle tour has no elevation profile.

Every point gets a role badge from its place in the tour: Put-in at the start, Take-out where a portage begins, Re-entry where you put in again after it, and Final take-out at the end.

## Paddle legs on the water

A leg without a line of its own is planned by TREK's water router along rivers, canals and across lakes, from the water data of the regions the server holds. A leg drawn by hand keeps the line you drew and shows Drawn by hand, not routed. More actions on a point switches the next leg between Plan the next leg on the water and Draw the next leg by hand; the waves button in the Waypoints header, Plan the legs drawn by hand on the water, does it for every drawn leg at once.

Where the router carries round a weir, dam or waterfall, or goes through a lock between two of your points, TREK sets points of its own there, marked Found. They count like the ones you set. Move or change one and it becomes yours. Notes under a planned leg flag Whitewater with its grade, a Boat chute, or a Gap in the map data bridged with a straight line.

A leg the router cannot plan is drawn straight and red, and its row says why: the end is not on water TREK knows, there is no water data for the area, no way on the water joins the two points, or planning took too long. Draw straight keeps a straight line on purpose; Try again asks once more where that can help. While a leg is unplanned, the tour cannot be saved.

## Paddle water data

The water network comes from OpenStreetMap extracts by Geofabrik, one region at a time. When a leg ends where TREK has no data, the planner asks the server for that region straight away. What happens then is set by an admin under Admin, Add-ons, Paddle regions:

- loaded right away, within a size limit and a few regions a day. The leg shows Loading the water data with its progress (Downloading, Reading, Building the water network) and plans itself once the data is there, usually within one to three minutes;
- requested, so an admin can let it through. The leg says the data has been requested;
- or neither. The leg then says there is no water data for the area.

An admin who plans a paddle tour loads a region at once, whatever its size. Without a connection, legs are planned once you are online again.

## Paddle portages

A portage is a stretch you carry the boat. Choose Carry the boat from here in a point's More actions: the stretch to the next point becomes land. On the last point, the portage waits for the next point you set (Portage from here), and Do not carry after all takes it back.

The Portage card under the point shows the length and the extra minutes. Under Route, Follow the path lays the carry along mapped ways (asked of the public walking router), or Straight line keeps it straight; when no path is found without a long detour, the line stays straight and the card says so. Out and in is the time to get out, unload and put back in, 10 minutes until you type your own. Paddle this stretch again in More actions turns the portage back into a leg drawn by hand.

## Paddle locks

Lock at this point in More actions puts a lock at a point. Its card asks for Wait and Passage in minutes and says Time missing until both are in. TREK knows no lock schedules: the times are only what you enter. A portage that carries round a lock dims it (Carried round, the portage counts) and its minutes drop out. Remove the lock is in the open card and in More actions.

## Paddle time estimate

The Time estimate card adds up the parts of the tour:

| Row | How it is counted |
|---|---|
| Water | Distance on the water at the paddling speed. |
| Carrying | Length of the portages at the carrying speed, 2 km/h until you set your own in the card. |
| Out and back in | The Out and in minutes of every portage. |
| Locks | Wait plus Passage of every lock that is not carried round. |
| Breaks | The breaks set under Details. |

The strip above the rows shows the route with its water, portages and locks; obstacle marks on it can be clicked to find them on the map. The estimate says Incomplete while a part is unknown (no paddling speed, a lock without times) and names what is missing. With a planned total under Details, the card shows Your planned total and the difference. TREK starts with 4 km/h on the water, 2 km/h carrying and 10 minutes at each portage; these are starting values, not measurements. Current and wind are not in the estimate.

## Paddle wind forecast

The Wind card shows the forecast at the start of the tour for the day it is planned on: the direction it blows from, the strongest hourly Mean, the strongest Gusts, and a bar per hour with its own figures in the tooltip. The forecast comes from Open-Meteo through the TREK server and reaches 16 days ahead. A day further out says from when it comes, a past day that it has passed; a tour on no day, a day without a date or a tour without a start point say so. A tour on several days has a Day chip for each.

On a windy day with a lake crossing, the card offers Plan near the shore, which switches Across lakes and plans the lakes along the bank. What wind means for paddling explains headwind, crosswind, open crossings and gusts. No figure is an all-clear.

## Paddle obstacle checklist

A saved paddle tour has a Checklist: the weirs, dams, locks, waterfalls, rapids, hazards, put-ins, take-outs, slipways, portages and access rules on and near the route, from the OpenStreetMap data of the paddle regions TREK holds, in route order, with your own portages and locks marked Own. The badge in the header counts what is open, to check again, decided or under a ban; the line below says how current the data is (OSM as of, Fetched) and where it does not cover the route (Partial, No data, Cut short).

For each obstacle you choose Paddle through, Carry round, Go round or Not affected, with an optional date on site and a note; Next moves to the next open entry. Carry round plans no portage by itself: Plan the portage selects the point to carry from. An entry decided before the route or the data changed is marked Check again, and one that left the data can be kept or removed; decisions that no longer apply wait under Earlier decisions. For SUP, the list advises checking a permitted portage at locks.

Clicking an obstacle on the map opens its card: how far along the route it lies or that it is only near it, the paddling rules (Canoe, Boat, Access), facts such as Height, Width, Grade, Hours, Fee and Operator where they are mapped, and View in OpenStreetMap. On a put-in, slipway or take-out, Put in here and Take out here add a point at that spot.

Where TREK holds no data for the area, the card says so. The data can have gaps, a decision does not lift a ban or private ground, and a checklist is no safety or legal clearance.

## Recorded paddle tracks

A GPX, KML or KMZ track imported as a Paddle tour (Add tour, Import GPX or KML, then Import as: Paddle tour with its Boat and Water) stays as it was recorded. Its Portages and locks card marks what the track does not know: Portage, then a click on the line where you got out and one where you put back in; Lock, then a click on the line at the lock. A click too far from the line, or on a portage already marked, is refused. The marks get their minutes like a planned tour's, Save keeps them and Discard drops them. The track's Time estimate counts them, and its Water row takes a paddling speed of its own. The Checklist and the Wind card work as on a planned tour.

## Paddle safety

Paddling carries risks. Maps, route suggestions and notes can be incomplete or out of date. The row Paddling has risks at the foot of the editor and in the tour card opens Safety on the water. Before the tour, check the local conditions, the rules for using the water and the weather yourself; TREK supports the planning and does not replace your own judgement.

## Horse ride: sections of horse routes

A **Horse ride** is the one tour type TREK never routes. No router knows where a horse may go, so a ride is put together from what OpenStreetMap maps as signposted horse routes (`route=horse` relations), taken a section at a time, plus stretches you draw by hand.

**Starting a ride.** On the **Tours** tab, click **Plan new tour** and set **Tour type** to **Horse ride** (or open a saved ride under **Tours of this trip**). The name field suggests **Untitled ride** until you name it. The **Horse routes** card appears in the left column, below **Waypoints**. It is only there while a ride is being edited.

**Finding routes.** Move the map to where you want to ride and click **Find in map view**. TREK asks for the routes in that view only when you click, never on every pan. Each route in the list shows its name, its length inside the view, how many sections it has and, where it carries on outside the view, **Goes on beyond the view**. What the card can say instead:

| Message | What it means |
|---|---|
| **Zoom in further to look for horse routes.** | The view is too large for one search. Zoom in and click again. |
| **There are more routes here than one search shows.** | The list was cut. Zoom in to see them all. |
| **No signposted horse routes in this view.** | OpenStreetMap has none mapped here. |
| **Horse routes could not be read.** | The data source did not answer. The ride is unchanged; try **Search this view** later. |
| **Horse routes need a connection.** | You are offline. Horse routes are live map data and are never stored on the device. |

Once the map has moved, the button reads **Search this view**.

**Taking a section.** Click a route to open it. The dialog shows the route on a map with the ride so far, and **Open in OpenStreetMap** leads to the route itself. A route is cut into **Sections** where it ends, forks or meets itself, and you always take a section whole. For the section you pick:

- **Direction**: **As mapped** or **Reversed**. TREK offers first the direction that starts nearer the end of your ride. Where the route is signposted one way only, it says **Signposted this way**, or warns that the section is signposted the other way.
- **Riding access**: what the ways along the section are tagged with, one pill per value with the metres it covers (see below).
- **Joining your ride**: **Starts your ride** on an empty ride, **Joins the end of your ride** when the section starts within 25 m of its last point, or a gap (see the next section).

**Take section** puts it on the ride as one step: **Undo waypoint edit** takes the whole section back. In **Waypoints**, the section is a badge in the brown the map draws it in, with the route's name, an access dot, an arrow mark where it runs against the signposting, and its length. Point at the badge to read the access in full.

**What a ride does not do.** A click on the drawn line adds no shaping point, a point at either end of a section cannot be dragged away from it, and the waypoint menu has none of the routing entries the other types offer. Changing a ride to another type sends its horse route sections back to the router; changing another tour to a ride turns every routed leg into a manual one.

## Horse ride: gaps and manual sections

Horse routes rarely meet end to end. When the section you pick starts more than 25 m from the end of your ride, **Joining your ride** says how far apart they are, on no horse route, and **Take section** stays greyed out until you switch on **Join with a manual section**. The gap is then drawn as a straight line and the section follows it.

A point you click on the map while **Add point** is on joins the ride the same way. Every such leg reads **Manual, unchecked** in **Waypoints**, with its length, and is drawn dashed. Nothing checked it: not a router, not the horse routes, not the access tags. Look at the map, or switch to Satellite, to see what a straight line crosses on the ground.

## Horse ride: riding access and time

**Riding access** shows what OpenStreetMap tags as `horse=*` along the ways of a section:

| Pill | Read as |
|---|---|
| **Designated for riders**, **Allowed**, **Permitted by the owner** | Open to riders as tagged |
| **Access only**, **Discouraged**, **Other rule** | Restricted in part |
| **Private**, **Not allowed** | Closed in part. The dialog adds a warning. |
| **Not in the data** | Nothing is tagged |

The section chips and the leg badges carry the same colour as a dot. These are tags, not permissions: they can be missing or out of date, and being on a signposted route does not mean you may ride it. The signs on site count.

**Riding time.** TREK works out no riding time for a ride, because the pace is the horse's and the rider's. **Riding time** in **Tour summary** stays empty, with an info dot that says why. To have a time on the day plan, enter it under **Planned** in **Details**; it is kept as a manual value and is the time the day plan shows for the ride.

## Horse ride: recorded rides

A ride you recorded on a GPS device or in an app comes in through the import: **Add tour** (the **+** above **Tours of this trip**), **Import GPX or KML**, or a file dropped on the Tours tab. In **Import preview**, set **Tour type** under **Import as** to **Horse ride**. Three badges say what that means, each with its reason on hover:

- **As recorded**: the line stays exactly as the file has it. Nothing is routed again.
- **No riding time**: no time is worked out from the line.
- **Access not checked**: nothing checked whether its ways may be ridden.

A file without elevation adds **No heights in the file**, and the ride's ascent is shown as unknown rather than zero. After **Import 1 tour** the ride opens in the left column with a **Recorded ride** card that repeats the badges above its measures.

A recorded ride has no **Editable version** card: since nothing routes a ride, there is no planned version to make from it. To ride it again along mapped horse routes, plan a new ride beside it.
