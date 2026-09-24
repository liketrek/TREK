# MCP Addon Tools and Resources

This page covers MCP tools and resources that require specific addons to be enabled on your TREK instance. For the rest of the surface (trips, places, day planning, accommodations, transport, reservations, tags, maps, and notifications — plus the Budget tools, which need the Budget addon, listed as **Costs** under **Admin → Addons**, but are documented there) see [MCP-Tools-and-Resources](MCP-Tools-and-Resources).

---

## Addon-gated tools

### Packing _(Packing addon required)_

Requires `packing:read` or `packing:write` scope. The Packing addon is listed as **Lists** under **Admin → Addons** (id `packing`) and covers packing lists and to-dos.

| Tool | Description |
|---|---|
| `create_packing_item` | Add an item to the packing checklist with optional category. |
| `update_packing_item` | Rename an item or change its category. |
| `set_packing_item_sharing` | Move an item between the three sharing tiers: `common` puts it in the pool the whole trip packs from, `personal` keeps it to its owner, `shared` covers the trip members in `recipient_ids`. Only the item's owner may change this. |
| `toggle_packing_item` | Check or uncheck a packing item. |
| `delete_packing_item` | Remove a packing item. |
| `reorder_packing_items` | Set the display order of packing items within a trip. |
| `bulk_import_packing` | Import multiple packing items at once from a list (with optional quantity). |
| `list_packing_templates` | List the reusable packing templates (id, name, item count) so one can be applied. |
| `apply_packing_template` | Apply a saved packing template to a trip. |
| `save_packing_template` | Save the current packing list as a reusable template. Templates are global, so this is admin only — a non-admin gets `Admin access required`. |
| `delete_packing_template` | Delete a reusable packing template. Global too, so admin only. |
| `list_packing_bags` | List all packing bags for a trip. |
| `create_packing_bag` | Create a new packing bag (e.g. "Carry-on", "Checked bag"). |
| `update_packing_bag` | Rename or recolor a packing bag. |
| `delete_packing_bag` | Delete a packing bag (items are unassigned, not deleted). |
| `set_bag_members` | Assign trip members to a packing bag. |
| `get_packing_category_assignees` | Get which trip members are assigned to each packing category. |
| `set_packing_category_assignees` | Assign trip members to a packing category. |

### To-Dos _(Packing addon required)_

Requires `todos:read` or `todos:write` scope.

| Tool | Description |
|---|---|
| `list_todos` | List all to-do items for a trip, ordered by position. |
| `create_todo` | Create a to-do item with name, category, due date, description, assignee, and priority. |
| `update_todo` | Update an existing to-do item. Pass `null` to clear nullable fields. |
| `toggle_todo` | Mark a to-do item as done or undone. |
| `delete_todo` | Delete a to-do item. |
| `reorder_todos` | Reorder to-do items by providing a new ordered list of IDs. |
| `get_todo_category_assignees` | Get the default assignees configured per to-do category for a trip. |
| `set_todo_category_assignees` | Set default assignees for a to-do category. Pass an empty array to clear. |

### Atlas _(Atlas addon required)_

Requires `atlas:read` or `atlas:write` scope.

| Tool | Description |
|---|---|
| `mark_country_visited` | Mark a country as visited using its ISO 3166-1 alpha-2 code (e.g. `"FR"`, `"JP"`). |
| `unmark_country_visited` | Remove a country from your visited list. |
| `get_atlas_stats` | Get atlas statistics — visited country counts, region counts, and continent breakdown. |
| `list_visited_regions` | List all manually visited sub-country regions for the current user. |
| `locate_atlas_region` | Resolve a coordinate to the country and region codes the Atlas map can highlight, which is where the pair `mark_region_visited` expects comes from. A point outside every bundled polygon answers with `null` fields rather than an error. For a postal address use `reverse_geocode` instead. |
| `mark_region_visited` | Mark a sub-country region as visited (e.g. `"US-CA"`). |
| `unmark_region_visited` | Remove a region from the visited list. |
| `get_country_atlas_places` | Get places saved in the user's atlas for a specific country. |
| `create_bucket_list_item` | Add a destination to your personal bucket list with optional coordinates, country code and target date. The same destination for the same target date is rejected as a duplicate. |
| `update_bucket_list_item` | Update a bucket list item (name, notes, coordinates, target date). |
| `delete_bucket_list_item` | Remove an item from your bucket list. |

### Collab _(Collab addon required)_

Requires `collab:read` or `collab:write` scope.

The addon alone is not enough. Collab has five sub-features an admin switches on and off independently in Admin → Addons — Notes, Polls, Chat, Links and What's Next, all on by default — and three of them gate MCP entries. A tool or resource is only registered when its own sub-feature is enabled on top of the addon, so switching one off makes its entries vanish from the tool list rather than return an error. Links and What's Next have no MCP tools or resources of their own, so toggling them changes nothing here.

| Sub-feature | Tools it gates | Resource it gates |
|---|---|---|
| Notes | `create_collab_note`, `update_collab_note`, `delete_collab_note` | `trek://trips/{tripId}/collab-notes` |
| Polls | `list_collab_polls`, `create_collab_poll`, `vote_collab_poll`, `close_collab_poll`, `delete_collab_poll` | `trek://trips/{tripId}/collab/polls` |
| Chat | `list_collab_messages`, `send_collab_message`, `delete_collab_message`, `react_collab_message` | `trek://trips/{tripId}/collab/messages` |

| Tool | Description |
|---|---|
| `create_collab_note` | Create a shared note visible to all trip members. Supports title, content, category, and color. |
| `update_collab_note` | Edit a collab note's content, category, color, or pin status. |
| `delete_collab_note` | Delete a collab note. |
| `list_collab_polls` | List all polls for a trip. |
| `create_collab_poll` | Create a poll with a question, options, optional multiple choice, and deadline. |
| `vote_collab_poll` | Vote on a poll option (or remove vote if already voted). |
| `close_collab_poll` | Close a poll so no more votes can be cast. |
| `delete_collab_poll` | Delete a poll and all its votes. |
| `list_collab_messages` | List chat messages for a trip (most recent 100, supports pagination via `before`). |
| `send_collab_message` | Send a chat message to a trip's collab channel, with optional reply threading. |
| `delete_collab_message` | Delete a chat message (own messages only). |
| `react_collab_message` | Toggle a reaction emoji on a chat message. |

### Collections _(Collections addon required)_

Requires `collections:read` or `collections:write` scope.

| Tool | Description |
|---|---|
| `list_collections` | List the saved-place collections the user owns or has accepted a share for, plus any pending incoming invites. |
| `get_collection` | Get one collection with its members, labels, and all saved places, including the average rating and each member's vote. |
| `available_collection_users` | List users who can still be invited to a collection (excludes current members and guests). |
| `find_place_in_collections` | Answer whether a place is already on one of your lists, across the whole library in one call, naming each list and the status the place has there. Identify the place by `google_place_id` / `google_ftid` from `search_place` or by `lat` + `lng`; a name alone is never matched. |
| `create_collection` | Create a new saved-place collection owned by the user. |
| `update_collection` | Update a collection's name, description, colour, icon, cover, links, or sort order. Owner/admin only. |
| `delete_collection` | Permanently delete a collection and all its saved places. Owner only, and it cannot be undone. |
| `reorder_collections` | Reorder the user's collections — pass every collection id in the desired order. |
| `save_place_to_collection` | Save a place into a collection from a raw payload. Returns a duplicate marker instead of saving when a similar place already exists, unless `force` is true. |
| `save_trip_places_to_collection` | Copy one or more existing trip places into a collection. Duplicates are skipped unless `force` is true. |
| `update_collection_place` | Update a saved place's name, address, coordinates, description, notes, status, category, links, tags, labels, image, or move it to another collection. |
| `set_collection_place_status` | Set a saved place's status: `idea`, `want`, or `visited`. |
| `set_collection_place_status_from_trip` | Set a status on every saved copy of the given trip places, in every list they are on, for marking places visited after a day out. Ids are trip place ids. Lists you may only read are skipped. Returns how many saved places changed and how many of the trip places were found in at least one list. |
| `rate_collection_place` | Set or clear the current user's 1-5 star rating on a saved place. Every member rates independently; pass `null` to remove the vote. |
| `delete_collection_place` | Remove a saved place from its collection. Requires delete permission on the list. |
| `copy_collection_places_to_trip` | Copy one or more saved places into a trip, ratings included. Requires edit access to the target trip. |
| `create_collection_label` | Create a custom per-collection label (name plus optional hex colour) for grouping and filtering places. |
| `update_collection_label` | Rename or recolour a collection label, or change its sort order. |
| `delete_collection_label` | Delete a collection label; its assignments on places are cleared. |
| `assign_collection_labels` | Add labels across a set of saved places, or take them away with `remove=true`. |
| `invite_to_collection` | Invite a user to collaborate on a collection as `viewer`, `editor`, or `admin` (default `editor`). Owner only. |
| `set_collection_member_role` | Change an accepted member's role. Owner only. |
| `remove_collection_member` | Remove an accepted member from a shared collection. Owner only. |
| `cancel_collection_invite` | Cancel a pending invite you sent for a collection. Owner only. |
| `accept_collection_invite` | Accept a pending invite to join a shared collection. |
| `decline_collection_invite` | Decline a pending invite to a shared collection. |
| `leave_collection` | Leave a shared collection you are a member of. The owner cannot leave — delete the list instead. |

### Vacay _(Vacay addon required)_

Requires `vacay:read` or `vacay:write` scope.

| Tool | Description |
|---|---|
| `get_vacay_plan` | Get the current user's active vacation plan. |
| `get_vacay_year_settings` | Read the caller's leave-year window: `calendar` runs January to December, `fiscal` starts on a configured month and day, `anniversary` on the hire date's month and day. Read it before interpreting a year in `get_vacay_stats` or `get_vacay_entries`, which count over that window. |
| `update_vacay_plan` | Update vacation plan settings (weekend blocking, holidays, carry-over). |
| `set_vacay_color` | Set the current user's color in the vacation plan calendar. |
| `get_available_vacay_users` | List users who can be invited to the current vacation plan. |
| `send_vacay_invite` | Invite a user to join the vacation plan by their user ID. |
| `accept_vacay_invite` | Accept a pending invitation to join another user's vacation plan. |
| `decline_vacay_invite` | Decline a pending vacation plan invitation. |
| `cancel_vacay_invite` | Cancel an outgoing invitation (owner only). |
| `dissolve_vacay_plan` | Dissolve the shared plan — all members return to their own individual plan. |
| `list_vacay_years` | List calendar years tracked in the current vacation plan. |
| `add_vacay_year` | Add a calendar year to the vacation plan. |
| `delete_vacay_year` | Remove a calendar year from the vacation plan. |
| `get_vacay_entries` | Get all vacation day entries for the active plan and a specific year. |
| `toggle_vacay_entry` | Toggle a day on or off as a vacation day for the current user. |
| `toggle_company_holiday` | Toggle a date as a company holiday for the whole plan. |
| `get_vacay_stats` | Get vacation statistics for a specific year (days used, remaining, carried over). |
| `update_vacay_stats` | Update the vacation day allowance for a specific user and year. |
| `add_holiday_calendar` | Add a public holiday calendar (by region code from `list_holiday_countries`) to the vacation plan, or a school-holiday calendar with `type: 'school_holiday'` and a region code from `list_school_holiday_regions` or `list_manual_school_holiday_regions`. A school-holiday calendar only shows up once `update_vacay_plan` has set `school_holidays_enabled`. |
| `update_holiday_calendar` | Update label or color for a holiday calendar. |
| `delete_holiday_calendar` | Remove a holiday calendar from the vacation plan. |
| `list_holiday_countries` | List countries available for public holiday calendars. |
| `list_holidays` | List public holidays for a country and year. |
| `list_school_holiday_regions` | List a country's school-holiday regions. Pass `calendar_regions[].region` verbatim as the region of `add_holiday_calendar`; a group is stored as `COUNTRY\|group:CODE`, and a bare group code would leave the calendar empty. |
| `list_school_holidays` | List school holidays for a country and year, narrowed to a subdivision or group code from `list_school_holiday_regions`. These are term breaks; a day off is normally counted against the public holidays from `list_holidays`. |
| `list_vacay_shares` | List read-only calendar shares — who you share your calendar with, and which calendars are shared with you. |
| `get_shareable_vacay_users` | List the users the caller can share their calendar with, for `share_vacay_calendar`. A wider set than `get_available_vacay_users`, which lists candidates for merging plans and so leaves out everyone already in a plan of their own. |
| `share_vacay_calendar` | Share the current user's vacation calendar with another user (view only, no merge). |
| `unshare_vacay_calendar` | Remove a read-only calendar share — revoke one you shared, or remove a calendar shared with you. |
| `get_shared_vacay_calendars` | Get the read-only calendars shared with the current user for a year (entries and company holidays per sharer). |

**Manual school holidays.** The catalog an admin maintains under **Admin → Personalization → School holidays** (see [Vacay](Vacay)) has tools of its own. They are registered whether or not the Vacay addon is on. Reading needs `vacay:read`; every write needs `vacay:write` and an admin account, and a non-admin gets `Admin access required`.

| Tool | Scope | Description |
|---|---|---|
| `list_manual_school_holiday_regions` | `vacay:read` | List the manual catalog: countries with their regions. Pass `regions[].code` verbatim to `add_holiday_calendar` with `type: 'school_holiday'`. Needs no external API. |
| `get_manual_school_holiday_region` | `vacay:read` | Read one region, its current revision and all named holiday periods. Read it before an update, which replaces the whole list of periods and needs the current revision. |
| `list_manual_school_holidays` | `vacay:read` | Named school breaks of a manual region for one year, including breaks that span a year boundary. Both boundary dates are included. |
| `create_manual_school_holiday_country` | `vacay:write`, admin only | Add a country to the catalog with its two-letter uppercase code and display name. Check the catalog first to avoid duplicates. |
| `create_manual_school_holiday_region` | `vacay:write`, admin only | Add a region or school district to an existing country, with named periods as inclusive `YYYY-MM-DD` dates. Use revision `0` on creation. |
| `update_manual_school_holiday_region` | `vacay:write`, admin only | Rename a region and replace its complete list of periods. Supply the current revision; a stale one is rejected. Every calendar using the region follows the change. |
| `delete_manual_school_holiday_region` | `vacay:write`, admin only | Delete a region and its periods, with the current revision. A region a vacation calendar has selected cannot be deleted. |
| `delete_manual_school_holiday_country` | `vacay:write`, admin only | Delete an empty country from the catalog. Remove its unused regions first. |

### Journey _(Journey addon required)_

Requires `journey:read` or `journey:write` scope.

| Tool | Description |
|---|---|
| `list_journeys` | List all journeys owned or contributed to by the current user. |
| `get_journey` | Get a full snapshot of a journey — metadata, entries, contributors, and linked trips. |
| `get_journey_stats` | What a journey adds up to: distance travelled in metres, calendar days spanned, countries in visit order, the furthest point reached, and entry, photo and place counts. Entries switched off with `stats_excluded` count towards none of those and are listed under `excluded`. Pass `include_route` for the route itself, up to 400 stops with coordinates. |
| `create_journey` | Create a new journey with title, optional subtitle, and an initial list of trip IDs. |
| `update_journey` | Update a journey's title, subtitle, cover or status, and whether its entries offer a pros/cons list, a mood and a weather note (`show_verdict`, `show_mood`, `show_weather`). Owner only. |
| `restore_journey_suggestions` | Bring back every trip-derived suggestion that was dismissed from a journey. Answers with how many came back. |
| `delete_journey` | Delete a journey. |
| `add_journey_trip` | Link an existing trip to a journey. |
| `remove_journey_trip` | Remove a trip from a journey. |
| `list_journey_entries` | List all entries in a journey (date, text, mood, linked trip). |
| `create_journey_entry` | Add an entry with date (required), optional title, story text, time of day, location name, mood, and sort order. |
| `update_journey_entry` | Edit a journey entry's title, story, date, time of day, place, coordinates, weather, tags, mood, pros/cons list or visibility. `stats_excluded: true` keeps the entry but takes it off the route and out of `get_journey_stats`; `dismissed: true` waves a trip-derived suggestion away without deleting it, so the trip sync does not offer it again. |
| `delete_journey_entry` | Remove an entry from a journey. |
| `reorder_journey_entries` | Reorder entries by providing the new ordered list of entry IDs. |
| `list_journey_contributors` | List the contributors of a journey (owner and editors/viewers). |
| `add_journey_contributor` | Invite a user to a journey with `editor` or `viewer` role. |
| `update_journey_contributor_role` | Change a contributor's role between `editor` and `viewer`. |
| `remove_journey_contributor` | Remove a contributor from a journey. |
| `update_journey_preferences` | Update display preferences for a journey. |
| `add_journey_provider_photos` | Attach photos from a connected library (Immich or Synology Photos) to a journey, or to one entry when `entryId` is given. Find the asset ids first with `search_provider_photos` or `list_provider_album_photos`. No image data passes through: the journey stores a reference and the app fetches the picture. An asset already attached is skipped rather than duplicated. |
| `get_journey_suggestions` | Get suggested trips to add to journeys based on recent trip history. |
| `list_journey_available_trips` | List all trips available to the current user for linking to a journey. |
| `get_journey_share_link` | Get the current public share link for a journey. Requires `journey:share`. |
| `create_journey_share_link` | Create or update the public share link for a journey. Requires `journey:share`. |
| `delete_journey_share_link` | Revoke the public share link for a journey. Requires `journey:share`. |

### Dawarich _(Dawarich addon required)_

Each tool asks for the scope of what it writes, so the scopes differ per tool. The connection itself (address, API key, test, disconnect) has no MCP tool. See [Dawarich](Dawarich).

| Tool | Purpose | Scope |
|---|---|---|
| `list_dawarich_suggestions` | List the stays TREK pulled from the caller's Dawarich for review, optionally for one trip or one state (`new`, `accepted`, `dismissed`); 50 by default, up to 200 | `journey:read` |
| `accept_dawarich_suggestion_as_place` | Turn a stay into a place on a trip, optionally on one of its days, with a corrected name, notes or coordinates | `places:write` |
| `accept_dawarich_suggestion_as_journal_entry` | Turn a stay into a dated journal entry with a title, story, date and time | `journey:write` |
| `mark_bucket_list_item_visited_from_dawarich` | Tick off the bucket list wish a stay was matched to, or another wish of the caller's | `atlas:write` |
| `dismiss_dawarich_suggestion` | Dismiss a stay, or put a dismissed one back | `journey:write` |
| `get_dawarich_trip_track` | Summary of a trip's recorded route per local day: segments, times, travel mode, distance and point counts, without the geometry. Read live from Dawarich, nothing stored | `journey:read` |

### Document sync _(Documents addon required)_

`get_trip_document_sync` and `list_trip_document_sync_issues` require `files:read`; `sync_trip_documents` requires `files:write`. Any member of the trip may call them. No tool connects a store or changes a binding: that hands TREK a credential to someone's document archive, and it stays with the trip owner in the file manager. See [Document-Sync](Document-Sync).

| Tool | Description |
|---|---|
| `get_trip_document_sync` | Show whether the trip's documents are synced with a document store (Paperless-ngx, Papra, Nextcloud, OpenCloud or a Synology NAS), which tag, folder or space they are bound to, when the last run happened and how it went, and how many documents are synced, waiting, in conflict or missing in the store. |
| `list_trip_document_sync_issues` | List the documents that need a person: conflicts, documents refused for their type or size, transfers that failed, and documents gone from the store. Returns `configured: false` for a trip that is not bound, and an empty list when everything is in step. |
| `sync_trip_documents` | Run every binding of the trip now instead of waiting for the next scheduled check, and report how many documents came in, went out and are in conflict. Pass `full: true` to compare both sides in full. A binding whose owner left the trip, or whose store an admin switched off, is reported and not run. Safe to call repeatedly: a run already in progress is not started twice. |

### Road trip _(Road trip addon required)_

These tools work without an open browser. The external assistant chooses places based on the traveller's interests, uses the existing trip, day, place and assignment tools to save them, and recalculates to check the result. What each tool corresponds to in the planner is described on [Road-Trip](Road-Trip#mcp-tools).

| Tool | Purpose | Scope |
|---|---|---|
| `get_roadtrip_context` | Saved days, visits, coordinates, stays, pinned times, vehicle preferences, route profiles, vias, tracks and manual boundaries, plus a `carriers` block with the flight, train, ferry, cruise and bus bookings that seam the drive and the hire cars whose desks stand on it, and `stays` with every booked stay, its check-in and check-out day and the earliest linked reservation | `trips:read` |
| `calculate_roadtrip` | Calculated days, arrivals, departures, automatic pauses, driving warnings and range warnings; optional geometry. A booking's terminals and a hire car's desks come back as stops carrying `carrier` (its role, type and timetable); their `assignmentId` and `placeId` are synthetic negative numbers that belong to no assignment and no place, so never pass them to the assignment or place tools. With `roadtrip_hotel_bookends` on, a day after a booked night starts at that stay and a day before one ends there: those stops carry `bookend` (phase, accommodation, reservation, check-in and check-out flags, the check-out time as a label), the stay's real `placeId` and a synthetic negative `assignmentId`, and cannot be reordered, edited or given via points | `trips:read` |
| `get_roadtrip_settings` | Shared driving preferences for the specified trip; a missing `roadtrip_hotel_bookends` means off | `trips:read` |
| `update_roadtrip_settings` | Patch shared trip driving preferences, preserving other settings | `trips:write` |
| `search_roadtrip_corridor` | Fuel, charging, rest areas, campsites, food, sights or hotels along a day | `trips:read` |
| `update_route_via` | Move an existing routing handle and optionally change its outgoing leg | `trips:write` |
| `list_route_vias` | A day's via points, or the whole trip's together with its followed tracks | `trips:read` |
| `add_route_via`, `add_route_vias` | Add one via point, or a whole chain on one day. With `roadtrip_hotel_bookends` on, a via after the last stop of a day that ends at a booked night is kept but not used, because the drive to the hotel keeps its own road | `trips:write` |
| `reanchor_route_vias` | Re-pin a day's via points after its stops changed | `trips:write` |
| `remove_route_via` | Remove a via point so the leg drives direct again | `trips:write` |
| `list_day_boundaries`, `set_day_boundary` | Read or set dragged day endings; null restores the automatic ending | `trips:read` / `trips:write` |
| `get_roadtrip_hazards` | Current DWD and GDACS notices with geometry, timestamps and source availability | `trips:read` |
| `get_roadtrip_charging_info`, `lookup_roadtrip_charging_info` | Availability and published tariffs for a saved charging stop, or for a station by coordinate and name | `trips:read` |
| `preview_google_maps_route` | Read the ordered stops of a Google Maps directions link; nothing is saved | `trips:read` |
| `import_google_maps_route` | Append the reviewed stops to a day as places and visits | `places:write` |

Driving preferences include daily times, day-ending mode, leg/day driving limits, fuel or electric vehicle specifications, fallback range, fill percentage, avoidance, route display and whether each day starts and ends at the stay (`roadtrip_hotel_bookends`, off by default). They belong to the specified trip and apply equally to all its travellers. Both settings tools require tripId. Changing driving preferences requires day-edit permission, as do changes to visits, vias and endings. Fixed visit times retain priority over automatic times. Turning daily travel times off preserves saved endings but stops applying them.

Calculation distances are metres, route durations seconds, and stays minutes. Settings use kilometres, litres, kWh, consumption per 100 km and percentages regardless of display units. Zero clears a numeric limit; an empty daily time disables the automatic window. Vehicle specifications take precedence over fallback range when complete. The optional calculation settings are a preview and are never saved. Calculations support up to 150 visits and 100 waypoints per routing run (30 for plugin profiles). Routing calls are paced and cached. Missing coordinates, provider failures and schedule conflicts are reported explicitly; incomplete totals must not be presented as a complete itinerary. Avoidance is a routing preference, and `avoidMissed` identifies requested classes that could not be avoided, including when Valhalla falls back to OSRM.

Corridor results include source attribution, distance along/from the route, failed areas and truncated areas. Follow `nextOffset` for remaining search rectangles. Filters include name or brand, socket type, minimum known charging power and `fromKm`/`toKm`. Unknown charging power remains unknown. With `roadtrip_hotel_bookends` on, the road of a day includes the drive from the stay slept in and to the stay of that night; a place found there belongs at the start or the end of the stored day. Search never adds places automatically. Use the returned place information with `create_and_assign_place`, then move or reorder the assignment and re-anchor vias as needed. Recalculate after editing.

Corridor searches include installed search-provider plugins. Providers receive the category and search bounds, and the host filters hits to the route. The response lists successful and failed sources; a failed provider does not discard the remaining results.

The via tools manage scenic detours and followed tracks. `list_day_boundaries`, `set_day_boundary` and `set_assignment_end_day` manage manual endings; `set_assignment_end_day` is a general assignment tool and is registered whether or not the addon is on. With `roadtrip_hotel_bookends` on, a boundary between two stops that a booked night separates is ignored, because the night ends the day. The Places tool `import_trip_gpx` accepts GPX XML up to one million characters, uses the standard importer and requires places:write. It imports waypoints, routes and tracks without assigning them to days; `export_trip_gpx` exports the trip. Stay durations and place-level time defaults can be cleared with null through `update_place`.

`get_roadtrip_hazards` takes `tripId`. It does not reroute the trip. The shared `roadtrip_show_hazards` setting controls the online map overlay.

Google Maps directions links can be reviewed with `preview_google_maps_route` and saved with `import_google_maps_route`. Import creates places and visits together in the supplied order, with trip access and place/day permission checks. Unresolved stops must be omitted from the confirmed input. The Google road geometry is not copied.

`get_roadtrip_charging_info` accepts tripId and placeId. It requires trip access and the Road trip addon. It reports matching failures, unavailable feeds, freshness, known free capacity and unknown status counts separately. Published tariff components include currency, tax handling and conditions; they do not estimate a user's roaming price. Data source: [MobiData BW OCPDB](https://api.mobidata-bw.de/), with per-source attribution from its public source registry.

`lookup_roadtrip_charging_info` answers the same question for a station that is not on the trip, by coordinate and name rather than by place id, which is what a hit found along the route has. It takes tripId, lat, lng and name, requires the same trip access and the same addon, and returns the same fields with the same caveats. The trip is there for the access check only and does not narrow the search. One station per call: it shares its cache with the saved-stop tool, and the registry behind it is public infrastructure. It carries no power rating and no socket count; those are OpenStreetMap tag data and travel with the corridor search result instead.

---

## Addon-gated resources

Resources provide read-only access via `trek://` URIs. The following resources require their addon to be enabled.

| URI | Addon | Scope required | Description |
|---|---|---|---|
| `trek://trips/{tripId}/budget` | Budget | `budget:read` | Budget and expense items |
| `trek://trips/{tripId}/budget/per-person` | Budget | `budget:read` | Per-person totals and split breakdown |
| `trek://trips/{tripId}/budget/settlement` | Budget | `budget:read` | Suggested transactions to settle who owes whom |
| `trek://trips/{tripId}/packing` | Packing | `packing:read` | Packing checklist |
| `trek://trips/{tripId}/packing/bags` | Packing | `packing:read` | Packing bags with their assigned members |
| `trek://trips/{tripId}/todos` | Packing | `todos:read` | To-do items ordered by position |
| `trek://trips/{tripId}/collab-notes` | Collab | `collab:read` | Shared collaborative notes |
| `trek://bucket-list` | Atlas | `atlas:read` | Your personal travel bucket list |
| `trek://visited-countries` | Atlas | `atlas:read` | Countries marked as visited in Atlas |
| `trek://atlas/stats` | Atlas | `atlas:read` | Visited country counts and continent breakdown |
| `trek://atlas/regions` | Atlas | `atlas:read` | Manually visited sub-country regions |
| `trek://trips/{tripId}/collab/polls` | Collab | `collab:read` | All polls for a trip with vote counts per option |
| `trek://trips/{tripId}/collab/messages` | Collab | `collab:read` | Most recent 100 chat messages for a trip |
| `trek://vacay/plan` | Vacay | `vacay:read` | Full snapshot of your active vacation plan (members, years, config) |
| `trek://vacay/entries/{year}` | Vacay | `vacay:read` | All vacation day entries for the active plan and a specific year |
| `trek://vacay/holidays/{year}` | Vacay | `vacay:read` | Public holidays for the plan's configured region and year |
| `trek://journeys` | Journey | `journey:read` | All journeys owned or contributed to by the current user |
| `trek://journeys/{journeyId}` | Journey | `journey:read` | Single journey with entries, contributors, and linked trips |
| `trek://journeys/{journeyId}/entries` | Journey | `journey:read` | All entries in a journey (date, text, mood, linked trip) |
| `trek://journeys/{journeyId}/contributors` | Journey | `journey:read` | Contributors (owner and collaborators) of a journey |

---

## Related

- [MCP-Tools-and-Resources](MCP-Tools-and-Resources)
- [MCP-Scopes](MCP-Scopes)
- [MCP-Prompts](MCP-Prompts)
- [MCP-Setup](MCP-Setup)
