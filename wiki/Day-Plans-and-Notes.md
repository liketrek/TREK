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
- **Reorder days** — reorder the days of the trip or insert a new one. A day's places, notes and bookings move with it. Shown to members who can edit days.
- **Show all booking routes** — draws the connection of every routable booking on the map at once. Shown once the trip has at least one routable booking.

Route controls appear at the bottom of a day section, after the place list, and only for the day you have selected — click a day header to select it. The row only appears on a day that can actually be routed: two or more places on the day, a single located place that accommodation optimization can bookend with a hotel, or a transfer day where you check out of one hotel and into another. On a phone the same controls sit in the **Daily Overview** sheet instead, opened from the pill above the plan timeline, and appear there when the day has two located places, or one located place plus a hotel to start from.

- **Route** — draws that day's route on the map.
- **Open in Google Maps** — hands the day's stops to Google Maps as a route, in planned order.
- **Open in CoMaps** — the same day handed to CoMaps for offline navigation, carrying the day's travel mode.
- **Optimize** — reorders the day's places into the shortest route. See [Route-Optimization](Route-Optimization).
- **Travel mode** — Driving or Walking for that day, plus any travel mode a plugin adds.

**See also:** [Places-and-Search](Places-and-Search) · [Map-Features](Map-Features) · [Route-Optimization](Route-Optimization) · [Weather-Forecasts](Weather-Forecasts) · [Reservations-and-Bookings](Reservations-and-Bookings)