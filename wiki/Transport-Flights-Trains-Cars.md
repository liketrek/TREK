# Transport: Flights, Trains & Cars

Log flights, trains, car rentals, and cruises with departure and arrival endpoints, times, and transit-specific details.

## Where to create

Open the **Transports** tab in the trip planner and click **Add**, or open the planner from a day view and use the transport shortcut. Transport records appear in the [Reservations](Reservations-and-Bookings) panel alongside other bookings.

## Public transit search

Each day header in the plan sidebar has a **transit button** (tram icon) that opens a public-transit route search, powered by [Transitous](https://transitous.org/) — free, open data, no API key or paid provider. (The rename pencil this button replaced moved next to the day name in the day detail panel.)

- Pick **from** and **to** (stop/station search; the day's own places and hotels appear as quick picks), a **depart/arrive** time, and filter by mode: train, subway, tram, bus, ferry, cable car.
- Rank the results by **best route**, **fewer transfers**, or **less walking**.
- Each result shows local departure/arrival times, duration, transfers, walking time and the line badges in their official colors; expand it for the stop-by-stop breakdown.
- **Add to day** saves the chosen connection as a regular transport (typed by its dominant leg — train, bus, ferry …). It slots into the day timeline at its departure time and can be edited, deleted and drag-reordered like any other transport. The full itinerary stays visible in the transport's detail view; editing the transport keeps it as long as the origin and destination are unchanged.

Self-hosters can point the `TRANSIT_API_URL` environment variable at their own MOTIS instance.

## Transport types

Four types are available: **Flight**, **Train**, **Car**, **Cruise**.

## Common fields

All transport types share these fields:

| Field | Notes |
|-------|-------|
| Title | Required |
| Departure day | Linked to a trip day |
| Departure time | Optional |
| Arrival day | Linked to a trip day (can differ from departure day) |
| Arrival time | Optional |
| Booking / confirmation code | Optional |
| Status | Pending or Confirmed |
| Notes | Optional free text |

## Endpoints

### Flights

The departure and arrival fields use the **Airport picker** — type a city name or IATA code (minimum two characters) to search. Results show the IATA code, airport name, city, and country.

Once you select an airport, the **timezone** for that airport appears next to the time field. This lets you enter local departure and arrival times without confusion across time zones.

<!-- TODO: screenshot: Transport modal for a flight with airport picker and timezone -->

### Trains, cars, and cruises

Departure and arrival fields use the **generic location picker** — search by place name or enter a free-text location. Results come from the maps search service.

For **car rentals**, the departure field is labelled **Pickup date/time** and the arrival field is labelled **Return date/time**.

## Flight-specific fields

When the type is set to Flight, two additional fields appear:

- **Airline** — carrier name (e.g. Lufthansa)
- **Flight number** — (e.g. LH 123)

## Train-specific fields

When the type is set to Train, three additional fields appear:

- **Train number** — (e.g. ICE 123)
- **Platform** — platform or track number
- **Seat** — seat or coach assignment

## On the map

Transport records with both endpoints set appear as lines on the trip map:

- **Flights** and **cruises** render as geodesic great-circle curves that follow the curvature of the Earth.
- **Trains** and **cars** render as straight polylines between the two endpoints.

Confirmed bookings are drawn as solid lines; pending bookings use a dashed line. Endpoint markers are shown at each location. For flights, a midpoint label appears along the arc showing the route codes (e.g. ZRH → JFK) and flight duration and distance when enough screen space is available.

See [Map-Features](Map-Features) for details on how these overlays work.

## In the day plan

When a transport is assigned to a day, it appears inline in the day timeline between places. Multi-day transports show phase labels depending on the type:

| Type | Start day | Middle days | End day |
|------|-----------|-------------|---------|
| Flight | Departure | In transit | Arrival |
| Car rental | Pickup | Active | Return |
| Train / Cruise | Start | Ongoing | End |

See [Day-Plans-and-Notes](Day-Plans-and-Notes) for details.

---

> **Faster: import the confirmation** — If you have a booking confirmation email or PDF, you can skip the form entirely. See [Import from booking confirmation](Reservations-and-Bookings#import-from-booking-confirmation) in the Reservations guide.

---

**See also:** [Reservations-and-Bookings](Reservations-and-Bookings) · [Accommodations](Accommodations) · [Map-Features](Map-Features) · [Day-Plans-and-Notes](Day-Plans-and-Notes)
