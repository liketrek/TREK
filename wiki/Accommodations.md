# Accommodations

Link an accommodation to specific check-in and check-out days so it appears for every day you are staying there. Accommodations are a distinct record type backed by the `day_accommodations` table and are separate from regular reservations, though each accommodation automatically creates a linked **Hotel** reservation.

## Creating an accommodation

There are two ways to create an accommodation:

**From the Reservations panel:** Click **Manual Booking** and choose **Accommodation** under **Booking Type** at the top of the form. With that type the date and time fields are replaced by accommodation-specific inputs (see below). Saving the form creates both the hotel reservation and the underlying accommodation record at the same time.

**From the Day Detail panel:** Click the hotel icon or the **Add accommodation** button in the Day Detail overlay. A picker appears that lets you select a place from the trip, choose the day range, and optionally fill in check-in/check-out times and a confirmation code. This creates the accommodation record and its linked Hotel reservation together.

![Edit Reservation dialog of an accommodation: Booking Type and Travelers at the top, the stay with its place, nights and check-in and check-out times, the link beside the files, and the linked expense](assets/Hotel-ReservationCard.png)

## Accommodation-specific fields

When creating or editing via the Reservations panel with the type set to **Accommodation**, the date/time and location fields are replaced by accommodation-specific inputs:

| Field | Description |
|-------|-------------|
| **Accommodation** | Search for or select an existing trip place to link as the property. Selecting a place pre-fills the title if it is empty and pre-fills the location field if the place has an address |
| **From** | The check-in day |
| **To** | The check-out day |
| **Check-in** | The earliest time you can check in |
| **Check-in until** | The latest time the front desk accepts check-in |
| **Check-out** | The latest time you must check out |

The **Confirmation code**, **Status** (Pending / Confirmed), and **Notes** fields are also available, as they are for all reservation types.

## In the Day Detail panel

For each day between the **From** day and **To** day (inclusive), the accommodation appears in the Day Detail panel overlay. It shows the linked place name and address, a check-in or check-out label for the relevant boundary days, and the check-in window, check-out time, and confirmation code if set. Middle nights show the place name without a check-in/check-out label. The linked Hotel reservation's status and confirmation number are also shown inline.

![Day planner side bar with accomodation](assets/Hotel-ReservationDaySidebar.png)

## On the route

Booking a night also puts its place on the check-in day, as a stop of its own. That stop
is what the map draws a line to and what the [Road Trip](Road-Trip) view builds its route from, so the
hotel shows up on the drive without having to be entered a second time as an ordinary
place. It works the same way whichever way you book the night: the Day Detail panel, the
booking form under Bookings, the phone, the Road Trip view, an MCP client or a plugin.

The two views show the same night differently, and both are the whole picture:

- **Days** keeps it in the day header, as the badge it has always been. The stop itself is
  hidden there, because the row would be that same hotel a second time.
- **Road Trip** draws it as a service stop in the driving chain, anchored on its
  check-in the way a pinned time anchors any other stop: the day is built to be there
  by then, and a drive that cannot make it is reported late.

A few details worth knowing:

- Only the check-in day gets a stop, however many nights the stay runs. That is the day
  you travel there; the later nights keep showing as badges in the day header.
- The Road Trip view can also start each day after a night at the hotel and end each day
  before one there, with **Start and end each day at your stay** in its driving
  settings. The switch is off by default, stores no extra stop and leaves **Days** as it
  is. See [Road Trip](Road-Trip#starting-and-ending-the-day-at-the-stay).
- The stop leads its check-in day. It is seated first, behind only a stop whose own time
  is at or before the check-in, and the stops that carry no hour follow it. A night
  without a check-in is seated first too, a new check-in seats the stop afresh, and two
  nights booked on one day settle by their check-ins. When those match, or neither night
  has one, the booking made first leads.
- That also means a night booked for the end of a driving day heads that day when its
  stops carry no time of their own. To put the hotel back at the end, drag it down the
  day in the Road Trip rail, where an edit to the booking that leaves the check-in alone
  will not move it back. A start time at or before the check-in does it as well, as long
  as it goes on the first stop after the hotel: the day re-sorts by time and the untimed
  stops behind that one follow it. On the last stop alone it is not enough, because the
  untimed stops in front of it keep counting as being at the check-in and stay behind
  the hotel.
- The place is marked as a **hotel** stop, which is why it carries no number in the Road
  Trip rail and does not count towards the day's stop total. If you had already given the
  place a stop type of your own, that one is kept.
- If the place was already planned for that day, nothing is added. You keep the stop you
  placed, and the booking simply rides along with it.
- Moving the booking to a different check-in day moves its stop with it. Deleting the
  booking removes the stop it created, and leaves a stop you placed yourself standing.
- Hotels count as service stops on the drive, so **Show in Days too** under **Service
  stops** in the Road Trip settings decides whether the hotel's stop shows in the day list.
  The hotel itself always stays in the places list, on the Days map and in the booking
  forms, whatever the switch says.

Nights booked before this existed are given their stop when the server upgrades, so trips
you already have show their hotels on the drive without anyone re-saving anything. Trips
planned before 4.3.1 are seated the same way on upgrade, see
[Upgrading to 4.3.1](Updating#upgrading-to-431).

## When a check-in or check-out day goes

A stay is tied to its check-in and check-out day, so it cannot outlive either of them. What happens to its booking depends on how the day goes:

- **Deleting the day** in the **Reorder days** dialog cancels the stay cleanly, together with its Hotel booking and the expenses of that booking. The question before the delete shows this line in red. See [Deleting a day](Day-Plans-and-Notes#deleting-a-day).
- **Shortening the trip** removes the whole stay, also its nights that are still part of the trip, but leaves its booking under Bookings and its expense under Costs. The trip dialog shows the stay in red before it saves. See [Shortening a trip](Day-Plans-and-Notes#shortening-a-trip).

A stay that only runs across a deleted day, with its check-in before and its check-out after it, is kept, one night shorter: its check-out day moves up with the days after the deleted one. The question before the delete names the stay and its new check-out date. Its Hotel booking is not changed, so a booking made with the hotel itself may need the same change there.

## In the day plan sidebar

Accommodations appear as small colour-coded badges in the day header row of the day plan sidebar:

- **Green badge**: check-in day
- **Red badge**: check-out day
- **Neutral badge**: nights in between (ongoing stay)

Clicking a badge navigates to the linked place. Hotel-type reservations are filtered out of the inline transport card list between places; they do not appear as transport items in the timeline.

## In the Reservations panel

Hotel reservation cards in the Reservations panel show the linked accommodation name (place name) alongside the standard reservation fields such as the confirmation code and status. The check-in and check-out times are displayed in the metadata section of the card when they have been set.

---

**See also:** [Reservations-and-Bookings](Reservations-and-Bookings) · [Transport-Flights-Trains-Cars](Transport-Flights-Trains-Cars) · [Day-Plans-and-Notes](Day-Plans-and-Notes)
