# Day Plans and Notes

The Day Plan sidebar lets you organize places into days, add free-form notes, and manage the order of your itinerary.

![Day Plan](assets/TripPlanner.png)

## The Day Plan sidebar

The Day Plan sidebar is the left panel in the trip planner. Each trip day is shown as a collapsible section. Expanded or collapsed state is saved per trip in `localStorage` (key: `day-expanded-{tripId}`), so your layout is preserved across page reloads and between browser sessions on that device.

## Day timeline

Each day shows a merged, time-ordered list of:

- **Assigned places** — with time, category icon, and action buttons
- **Day notes** — with their selected icon and optional time
- **Reservations and transports** — non-hotel types (flights, trains, cars, cruises) appear inline; hotels appear in the Day Detail panel

Items are sorted by their time or position index.

## Assigning places to a day

- **Drag and drop** — drag a place from the right-hand Places sidebar and drop it onto a day section or between existing items.

![Adding a place by dragging](assets/DayItineraryAddPlaceDragging.gif)

- **Add button** — click a day header to select it, then click the **+** on a place in the right-hand Places sidebar; the place is assigned to the selected day straight away.

![Adding a place by button](assets/DayItineraryAddPlaceByButton.gif)

- **Mobile** — tap the **Add Place** button inside an expanded day section to open an inline search panel; find the place and tap it to assign.

You can also reorder places within a day, or move them to a different day, by dragging and dropping inside the sidebar.

To remove a place from a day, right-click the entry in the day timeline and choose **Remove from day**, or select the place and use the **Remove from Day** button in the place detail panel. On mobile, switch the plan screen to **Plan** and tap the **X** next to the place. Deleting the place itself, from the same right-click menu, removes it from every day.

![Removing a place by button](assets/DayItineraryRemovePlaceByButton.gif)

## Multi-day reservations

A reservation that spans multiple days appears in each relevant day with a phase label:

| Reservation type | Start day | Middle days | End day |
|---|---|---|---|
| Flight | Departure | In transit | Arrival |
| Car | Pickup | Active | Return |
| Parking | Drop-off | Not shown | Pickup |
| Other | Start | Ongoing | End |

Car rentals that are in the "Active" (middle) phase are shown in the day header rather than the timeline. A multi-day parking booking is dropped from the days in between entirely — it appears on its drop-off day and its pickup day only, with no day header badge.

## Day notes

Click the note **+** button in any day section to add a note. Notes have four fields:

- **Title** (required) — the main note text shown in the timeline
- **Subtitle / detail** (optional) — a free-form text field (Markdown supported) displayed beneath the title
- **Icon** — choose from 32 icons: FileText, Info, Clock, MapPin, Navigation, Train, Plane, Bus, Car, Ship, Coffee, Ticket, Star, Heart, Camera, Flag, Lightbulb, AlertTriangle, ShoppingBag, Bookmark, Utensils, Wine, ParkingSquare, Fuel, Footprints, Mountain, Waves, Sun, Umbrella, Music, Landmark, Gift
- **Colour** (optional) — tints the note card in the day timeline; the dialog shows a live preview of the card the note will become

Notes interleave with places and transports in the day timeline and are ordered by their `sort_order`. Use the **↑ / ↓** chevron buttons on a note to reposition it within the merged timeline. Notes can also be repositioned by dragging.

## Day Detail panel

Click a day header to open the Day Detail panel. It appears as a floating panel centered in the map area and shows:

- The weather forecast for that day (see [Weather-Forecasts](Weather-Forecasts))
- Reservations linked to assignments on that day
- Accommodation block (hotel check-in / check-out, with check-in window and confirmation number)

The panel can be collapsed to a slim header bar or closed entirely with the **X** button.

## Toolbar actions

At the top of the Day Plan sidebar:

- **Export** — opens the export dialog, which holds every format in three groups: **Document** (a PDF of the full trip plan, see [PDF-Export](PDF-Export)), **Calendar** (a `.ics` file for import into calendar apps, plus a subscribable calendar feed for members who can manage share links) and **Maps & GPS** (GPX — whole trip, places only, or days as routes).
- **Expand / Collapse all** — toggles all day sections open or closed at once.
- **Undo** — reverses the last drag, reorder, or assign action.
- **Reorder days**: reorder the days of the trip, add a day, or delete one. A day's places, notes and bookings move with it. Shown to members who can edit days. See [Adding a day](#adding-a-day) and [Deleting a day](#deleting-a-day).
- **Show all booking routes** — draws the connection of every routable booking on the map at once. Shown once the trip has at least one routable booking.

Route controls appear at the bottom of a day section, after the place list, and only for the day you have selected — click a day header to select it. The row only appears on a day that can actually be routed: two or more places on the day, a single located place that accommodation optimization can bookend with a hotel, or a transfer day where you check out of one hotel and into another. On a phone the same controls sit in the **Daily Overview** sheet instead, opened from the pill above the plan timeline, and appear there when the day has two located places, or one located place plus a hotel to start from.

- **Route** — draws that day's route on the map.
- **Open in Google Maps** — hands the day's stops to Google Maps as a route, in planned order.
- **Open in CoMaps** — the same day handed to CoMaps for offline navigation, carrying the day's travel mode.
- **Optimize** — reorders the day's places into the shortest route. See [Route-Optimization](Route-Optimization).
- **Travel mode** — Driving or Walking for that day, plus any travel mode a plugin adds.

## Adding a day

The **Reorder days** dialog adds a day at its foot. On a phone the same choice sits below the list of the **Reorder days** sheet, which opens from the calendar icon next to the day title above the plan. On a trip with dates there are two ways, and a line under the buttons says what each one does:

- **Add day without date** puts a day without a date at the end. The trip dates stay as they are, which suits a buffer day you have not placed yet.
- **Add** followed by the next date (for example **Add Tue, Oct 13**) adds the calendar day after the last date of the trip and extends the trip to it. The new day goes right behind the last dated day, so days without a date move one place back and keep their plans. No existing day or booking changes its date. A message confirms the new end of the trip, and fellow travellers see it straight away.

A trip without dates has a single **Add day** button. Adding a day needs a connection. Once a trip spans the most days a trip can have (999), the button with the date is greyed out and the line under it says why.

## Deleting a day

Members who can edit days find a delete button at the end of every row of the **Reorder days** dialog; on a phone it sits next to the arrows in the **Reorder days** sheet. Nothing is deleted straight away. TREK first asks, and lists what goes with the day:

- **Planned places** stay in the place list of the trip. Only their spot on this day goes.
- **Notes**, the day title and the day description are deleted.
- **Bookings** on the day stay under Bookings, without a day, and keep their date.
- **A stay that checks in or out on the day** is cancelled, together with its booking and the expense of that booking. The list shows it in red, since this is the line that costs money, and names the booking and the amount of its expense. A booking without an expense is named alone.
- **A stay that only runs across the day**, with its check-in before and its check-out after it, is kept, but one night shorter: its check-out day moves up with the other days. The list names the stay and its new check-out date. The booking behind it is not changed.
- **The days after it** move up one place. On a trip with dates the dates stay where they are, so every later day, and the bookings on it, takes the date one slot earlier; the list says how many days and bookings move. The first day without a date takes over the last date, and the list names that day and the date it gets. From then on it counts as a dated day, also when the trip is shortened later. When there is no day without a date, the trip ends one day earlier, and the list names the new end date.

A day with nothing on it gets a single line that says so. Deleting needs a connection, and the last day of a trip cannot be deleted; in both cases the button is greyed out and TREK says why. There is no undo, which is why the question spells out the consequences first. An open panel of the deleted day closes, and earlier undo steps that acted on that day are dropped, since they could no longer be taken back. Fellow travellers see the day go, and a new end date, straight away.

## Shortening a trip

New dates lay the days of a trip out again. Plans follow their position: the first day of the plan takes the new start date, the second the date after it, and so on. When the new dates hold fewer days than the plan, the last days go, also when it was the start that moved. Empty days without a date that are left over go as well, with any change of dates.

Before such a save, TREK asks first: in the trip dialog as a step before the save. Editing the trip from the phone's dashboard asks in a sheet over the trip sheet instead; editing it from inside the planner shows the same step as on desktop, also on a phone. Escape in that step goes back to the form and keeps what you typed. It names the days that go, the first six by name and the rest as a count, and lists what is on them:

- **Planned places** stay in the place list of the trip.
- **Notes**, day titles and day descriptions are deleted.
- **Bookings** on those days stay under Bookings. With **Keep bookings on their dates**, a booking whose date is still part of the trip goes back onto that day; with **Shift everything** it stays without a day. The sheet on the phone's dashboard does not offer the choice and keeps bookings on their dates.
- **A stay that checks in or out on one of those days** is removed as a whole, also for nights that are still part of the trip. Unlike when you delete a single day, its booking stays under Bookings and its expense, if it has one, under Costs. The list shows the stay in red.
- **The last days go, not the first** closes the list when the start moved, as a reminder that plans follow their position.

The save button then reads **Remove days and save**. When the start moved, the same step also asks how bookings follow the new dates, as before. When the days that go hold nothing, nothing extra is asked. Should TREK fail to read the days of the trip, it warns in general terms instead of listing them. There is no undo.

On a trip without dates, a lower **Day count** only takes away days with no places, notes or stay on them, starting from the end. A day with plans on it stays.

**See also:** [Places-and-Search](Places-and-Search) · [Map-Features](Map-Features) · [Route-Optimization](Route-Optimization) · [Weather-Forecasts](Weather-Forecasts) · [Reservations-and-Bookings](Reservations-and-Bookings)