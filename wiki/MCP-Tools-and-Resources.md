# MCP Tools and Resources

TREK exposes **tools** (read and write actions) and **resources** (read-only `trek://` URIs). Tools are registered per-session based on OAuth scopes and enabled addons.

For addon-gated tools (Packing, To-Dos, Atlas, Collab, Collections, Vacay, Journey) and their resources, see [MCP-Addon-Tools](MCP-Addon-Tools).

## Tools

### Trip Summary

| Tool | Description |
|---|---|
| `get_trip_summary` | Full denormalized snapshot of a trip — metadata, members, days with assignments and notes, accommodations, budget, packing, reservations, collab notes, and to-dos in one call. Use this as your context loader before making changes. |

### Compound tools

Compound tools collapse multi-step workflows into a single atomic transaction. If the second step fails, the first is rolled back.

> Use compound tools only when the place or item does not yet exist. For existing records, call the individual tools directly.

| Tool | Wraps | Description |
|---|---|---|
| `create_and_assign_place` | `create_place` + `assign_place_to_day` | Create a place and assign it to a day. Returns `{ place, assignment }`. Requires `places:write`. |
| `create_place_accommodation` | `create_place` + `create_accommodation` | Create a place and book it as an accommodation. Returns `{ place, accommodation }`. Requires `trips:write`. |
| `create_budget_item_with_members` | `create_budget_item` + `set_budget_item_members` | Create a budget item and set splitting members. If `userIds` is omitted, behaves like `create_budget_item`. Returns `{ item }`. Requires `budget:write`. |

### Trips

Requires `trips:read` or `trips:write` scope.

| Tool | Description |
|---|---|
| `list_trips` | List all trips you own or are a member of. Supports `include_archived` flag. |
| `create_trip` | Create a trip with title, dates, and currency. Days are auto-generated from the date range. |
| `update_trip` | Update a trip's title, description, dates, or currency. |
| `delete_trip` | Delete a trip. Owner only. Requires `trips:delete`. |
| `list_trip_members` | List the owner and all collaborators of a trip. |
| `add_trip_member` | Add a user to a trip by username or email. Owner only. |
| `remove_trip_member` | Remove a collaborator from a trip. Owner only. |
| `create_trip_guest` | Add a travelling companion who has no TREK account. Assignable to budget splits, packing and day participants; never signs in, never emailed. Owner only. |
| `rename_trip_guest` | Rename a guest on a trip. Owner only. |
| `delete_trip_guest` | Delete a guest and re-split the expenses they were part of. Owner only. |
| `copy_trip` | Duplicate a trip (days, places, itinerary, packing, budget, reservations). Packing items reset to unchecked. |
| `export_trip_ics` | Export the trip itinerary and reservations as iCalendar (`.ics`) text. |
| `get_share_link` | Get the current public share link for a trip and its permission flags. Requires `trips:share`. |
| `create_share_link` | Create or update the public share link with configurable visibility flags. Requires `trips:share`. |
| `delete_share_link` | Revoke the public share link for a trip. Requires `trips:share`. |

### Places

Requires `places:read` or `places:write` scope.

| Tool | Description |
|---|---|
| `list_places` | List places in a trip, optionally filtered by assignment status, category, tag, or search query. |
| `create_place` | Add a place with name, coordinates, address, category, notes, website, phone, and optional `google_place_id` / `osm_id`. |
| `update_place` | Update any field of an existing place including transport mode, timing, and price. |
| `rate_place` | Set or clear your own 1–5 star rating on a place. Every trip member rates independently and the place shows the average. Pass `null` to clear the vote. |
| `bulk_update_places` | Update many places at once, applying the same field values (e.g. category, price, transport mode) to every listed place in a single call. |
| `delete_place` | Remove a place from a trip. Also removes all day assignments. |
| `bulk_delete_places` | Delete multiple places by ID. Removes all day assignments. Cannot be undone. |
| `import_places_from_url` | Import all places from a publicly shared Google Maps or Naver Maps list URL. |
| `list_categories` | List all available place categories with id, name, icon, and color. |
| `search_place` | Search for a place by name or address. Returns `osm_id` and `google_place_id` for use in `create_place`. |

### Day Planning

Requires `trips:read` or `trips:write` scope.

| Tool | Description |
|---|---|
| `update_day` | Set or clear a day's title. |
| `create_day` | Add a new day to a trip with optional date and notes. |
| `delete_day` | Delete a day from a trip. |
| `set_day_default_transport_mode` | Set the whole-day default travel mode. Per-leg modes still override it. Pass `null` to clear. |
| `assign_place_to_day` | Pin a place to a specific day in the itinerary. Requires `places:write`. |
| `unassign_place` | Remove a place assignment from a day. Requires `places:write`. |
| `reorder_day_assignments` | Reorder places within a day by providing assignment IDs in order. Requires `places:write`. |
| `update_assignment_time` | Set start/end times for a place assignment (e.g. `"09:00"` – `"11:30"`). Pass `null` to clear. Requires `places:write`. |
| `move_assignment` | Move a place assignment to a different day. Requires `places:write`. |
| `set_leg_transport_mode` | Set the travel mode of a route leg for a place assignment. `direction` `"outgoing"` (default) targets the leg leaving the stop, `"incoming"` the arriving one. Pass `null` to inherit the day default. Requires `places:write`. |
| `get_assignment_participants` | Get users participating in a specific place assignment. Requires `places:read` or `places:write`. |
| `set_assignment_participants` | Set participants for a place assignment (replaces current list). Requires `places:write`. |

### Day Notes

Requires `trips:read` or `trips:write` scope.

| Tool | Description |
|---|---|
| `create_day_note` | Add a note to a specific day with optional time label and emoji icon. |
| `update_day_note` | Edit a day note's text, time, or icon. |
| `delete_day_note` | Remove a note from a day. |

### Accommodations

Requires `trips:read` or `trips:write` scope.

| Tool | Description |
|---|---|
| `create_accommodation` | Add an accommodation (hotel, Airbnb, etc.) linked to a place and a check-in/check-out date range. |
| `update_accommodation` | Update fields on an existing accommodation including dates, times, confirmation, and notes. |
| `delete_accommodation` | Delete an accommodation record from a trip. |

### Transport

Requires `reservations:write` scope.

| Tool | Description |
|---|---|
| `create_transport` | Create a transport booking in any of the nine types the transport form offers (`flight`, `train`, `bus`, `car`, `taxi`, `bicycle`, `cruise`, `ferry`, `transport_other`), with optional multi-stop endpoints, departure/arrival times, and confirmation details. Scheduled public transit goes through `create_transit_journey` instead. |
| `update_transport` | Update an existing transport booking. Pass `endpoints[]` to replace all stops. |
| `delete_transport` | Delete a transport booking from a trip. |

### Automated public transit

Transit search is powered by Transitous and uses the existing `geo:read` and `reservations:write` scopes.

| Tool | Scope required | Description |
|---|---|---|
| `search_transit_stops` | `geo:read` | Search real public-transit stops and stations, optionally biased around coordinates. |
| `search_transit_routes` | `geo:read` | Search scheduled routes between two coordinates with time, mode, and transfer filters. Also returns `dropped`, the number of provider itineraries that failed validation and are absent from the results. |
| `create_transit_journey` | `reservations:write` | Save a selected route as a first-class automated transit journey on a trip day. |

### Reservations

Requires `reservations:read` or `reservations:write` scope.

| Tool | Description |
|---|---|
| `create_reservation` | Create a pending reservation: hotels, restaurants, events, tours, activities, and other types. Carries the booking link (`url`) and an end time. |
| `update_reservation` | Update any field including status (`pending` / `confirmed` / `cancelled`). |
| `delete_reservation` | Delete a reservation and its linked accommodation record if applicable. |
| `reorder_reservations` | Reorder reservations within a day. |
| `set_reservation_travelers` | Set who is travelling on a booking, from the trip roster (members and guests). Replaces the list; an empty array clears it. Ids that are not on the trip come back under `ignored_user_ids` rather than being attached. |
| `link_hotel_accommodation` | Set or update a hotel reservation's check-in/out day links and place. |

### Budget

Requires `budget:read` or `budget:write` scope. Budget addon must be enabled.

| Tool | Description |
|---|---|
| `create_budget_item` | Add an expense with name, category, and price. |
| `update_budget_item` | Update an expense's details, split (persons/days), or notes. |
| `delete_budget_item` | Remove a budget item. |
| `set_budget_item_members` | Set which members are splitting a budget item (replaces current list). |
| `toggle_budget_member_paid` | Mark or unmark a member as having paid their share. |
| `get_settlement_summary` | Each member's net balance and the suggested payments to settle shared expenses, in the trip's base currency. Call this before recording a settlement. |
| `list_settlements` | List the recorded settle-up payments for a trip — who paid whom, how much, and when. |
| `create_settlement` | Record a settle-up payment: one member paid another the given amount in the trip's base currency. |
| `update_settlement` | Update a recorded settle-up payment (payer, recipient, and amount). |
| `delete_settlement` | Delete a recorded settle-up payment. This is the undo for `create_settlement` and restores the affected balances. |

### Tags

Requires `places:read` or `places:write` scope.

| Tool | Description |
|---|---|
| `list_tags` | List all tags belonging to the current user. |
| `create_tag` | Create a new tag (user-scoped label for places) with optional hex color. |
| `update_tag` | Update the name or color of an existing tag. |
| `delete_tag` | Delete a tag (removes it from all attached places). |

### Maps & Weather

| Tool | Scope required | Description |
|---|---|---|
| `get_place_details` | `geo:read` | Fetch detailed information (hours, photos, ratings) about a place by its Google Place ID. |
| `reverse_geocode` | `geo:read` | Get a human-readable address for given coordinates. |
| `resolve_maps_url` | `geo:read` | Resolve a Google Maps share URL to coordinates and place name. |
| `search_airports` | `geo:read` | Search for airports by name, city, or IATA code. Returns IATA code, name, city, country, timezone. |
| `get_airport` | `geo:read` | Look up an airport by IATA code (e.g. `"ZRH"`, `"CDG"`). |
| `get_weather` | `weather:read` | Get a weather forecast for a location and date. |
| `get_detailed_weather` | `weather:read` | Get an hourly/detailed weather forecast for a location and date. |

### Notifications

Requires `notifications:read` or `notifications:write` scope.

| Tool | Description |
|---|---|
| `list_notifications` | List in-app notifications with pagination and optional unread filter. |
| `get_unread_notification_count` | Get the unread notification count. |
| `mark_notification_read` | Mark a notification as read. |
| `mark_notification_unread` | Mark a notification as unread. |
| `mark_all_notifications_read` | Mark all notifications as read. |

### Files

Requires `files:read` or `files:write`. Reading what is inside a document needs `files:content`, which is a **separate** scope and is not implied by `files:write`.

| Tool | Description |
|---|---|
| `list_trip_files` | List a trip's documents: name, type, size, uploader, description, what they are linked to, starred and trash state. Pass `trash` to list the trash instead. |
| `read_trip_file` | Read one document's contents. Text comes back as text, anything else base64, with an `encoding` field saying which. Files over 10 MB are refused; use the download link in the app. |
| `update_trip_file` | Set a file's description and the booking or place it belongs to. Pass null to detach. |
| `link_trip_file` | Link a file to one more booking, place or day assignment. |
| `unlink_trip_file` | Remove one link. The file stays. |
| `list_trip_file_links` | List everything a file is linked to. |

### Settings

Requires `settings:read` or `settings:write`.

| Tool | Description |
|---|---|
| `get_display_settings` | Read the user's units, time format, language, default currency and start page. Read this before rendering a temperature, a distance or a clock time. |
| `update_display_settings` | Change one or more of those preferences. Only display preferences: API keys, map tokens and LLM settings are refused, whatever is passed. |

### Calendar feeds

Requires `trips:share`, the same scope that manages public share links.

| Tool | Description |
|---|---|
| `get_trip_calendar_feed` | Read the subscribable feed URL for one trip, and whether it is on. |
| `enable_trip_calendar_feed` | Turn the trip feed on and mint its token. |
| `rotate_trip_calendar_feed` | Issue a new token. Every existing subscription to that trip stops working. |
| `disable_trip_calendar_feed` | Turn it off and revoke the token. |
| `get_all_trips_calendar_feed` | The same, for the feed that carries every trip the user can see. |
| `enable_all_trips_calendar_feed` | |
| `rotate_all_trips_calendar_feed` | |
| `disable_all_trips_calendar_feed` | |

### Invite links

Requires `trips:share`. This is the link that grants **membership**, not the read-only public view link that `create_share_link` makes.

| Tool | Description |
|---|---|
| `get_trip_invite_link` | Read the current invite link and when it expires. |
| `create_trip_invite_link` | Mint an invite link, optionally with an expiry. Rotating replaces the old one, which stops working. |
| `delete_trip_invite_link` | Revoke it. |

Accepting an invite has no tool on purpose: joining somebody's trip is a human act.

### Imports

| Tool | Description |
|---|---|
| `list_airtrail_flights` | List the flights available to import from a connected AirTrail account. Requires the AirTrail addon. |
| `import_airtrail_flights` | Import chosen flights into a trip as transport bookings. |

### Photos

Requires `journey:read`, or `journey:write` to attach. Needs a configured Immich or Synology Photos provider.

| Tool | Description |
|---|---|
| `search_provider_photos` | Search the connected photo library. |
| `list_provider_albums` | List its albums. |
| `list_provider_album_photos` | List one album's photos. |

Photo bytes are never returned: those are image URLs the app renders.

### Help and instance

| Tool | Description |
|---|---|
| `list_help_topics` | List the bundled help pages. Answers "how do I do X in TREK?" without guessing. |
| `get_help_page` | Read one help page. |
| `list_addons` | Which addons and collaboration features this instance has enabled. Worth calling when a tool you expected is not in the list: an addon that is off removes its tools exactly the way a missing scope does. |
| `get_trip_warnings` | Warnings plugins have raised about a trip. A plugin raising one is telling the user something is wrong, so it is worth reading before reviewing an itinerary. |

---

## Resources

Resources provide read-only access via `trek://` URIs. Read them to understand current state before making changes.

### Core resources

| URI | Scope required | Description |
|---|---|---|
| `trek://trips` | `trips:*` | All trips you own or are a member of |
| `trek://trips/{tripId}` | `trips:*` | Single trip with metadata and member count |
| `trek://trips/{tripId}/days` | `trips:read` | Days of a trip with their assigned places |
| `trek://trips/{tripId}/places` | `places:read` | All places in a trip. Supports `?assignment=all\|unassigned\|assigned` |
| `trek://trips/{tripId}/reservations` | `reservations:read` | Flights, hotels, restaurants, and other reservations |
| `trek://trips/{tripId}/days/{dayId}/notes` | `trips:read` | Notes for a specific day |
| `trek://trips/{tripId}/accommodations` | `trips:read` | Hotels and rentals with check-in/out details |
| `trek://trips/{tripId}/members` | `trips:*` | Owner and collaborators |
| `trek://categories` | (any) | Available place categories (id, name, icon, color) |
| `trek://notifications/in-app` | `notifications:read` | Your in-app notifications (most recent 50, newest first) |

For addon-gated resources (Budget, Packing, To-Dos, Collab, Atlas, Vacay, Journey), see [MCP-Addon-Tools](MCP-Addon-Tools).

---

## Related

- [MCP-Addon-Tools](MCP-Addon-Tools)
- [MCP-Scopes](MCP-Scopes)
- [MCP-Prompts](MCP-Prompts)
- [MCP-Setup](MCP-Setup)
