# MCP Addon Tools and Resources

This page covers MCP tools and resources that require specific addons to be enabled on your TREK instance. For the rest of the surface (trips, places, day planning, accommodations, transport, reservations, tags, maps, and notifications — plus the Budget tools, which need the Budget addon, listed as **Costs** under **Admin → Addons**, but are documented there) see [MCP-Tools-and-Resources](MCP-Tools-and-Resources).

---

## Addon-gated tools

### Packing _(Packing addon required)_

Requires `packing:read` or `packing:write` scope. The Packing addon is listed as **Lists** under **Admin → Addons** (id `packing`) and covers packing lists and to-dos.

| Tool | Description |
|---|---|
| `list_packing_items` | List the packing items the user may see (another member's personal items stay hidden), with the trip's bags and who looks after each category. Narrow it with `category`, `bag_id` (`null` for the items in no bag) or `status` (`open`, `packed`); `group_by` (`category` or `bag`) only says how the list is meant to be shown. |
| `create_packing_item` | Add an item to the packing checklist with optional category. |
| `update_packing_item` | Rename an item, change its category, or count how many of it are already packed. |
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
| `mark_country_visited` | Mark a country as visited using its ISO 3166-1 alpha-2 code (e.g. `"FR"`, `"JP"`). The answer's `after` says where the country stands now and how many countries count as visited. |
| `unmark_country_visited` | Remove a country from your visited list. The answer's `after` says where the country stands now (a country your trips put on the map stays) and how many countries count as visited. |
| `get_atlas_stats` | Get atlas statistics — visited country counts, region counts, and continent breakdown. |
| `list_visited_regions` | List all manually visited sub-country regions for the current user. |
| `locate_atlas_region` | Resolve a coordinate to the country and region codes the Atlas map can highlight, which is where the pair `mark_region_visited` expects comes from. A point outside every bundled polygon answers with `null` fields rather than an error. For a postal address use `reverse_geocode` instead. |
| `mark_region_visited` | Mark a sub-country region as visited (e.g. `"US-CA"`). The answer's `after` also counts the visited regions of that country. On all four mark tools `after` is left out when the atlas cannot be read back; the change itself stands. |
| `unmark_region_visited` | Remove a region from the visited list. Removing the last region of a country also removes the country, unless it was marked visited itself. The answer's `after` says where that country stands now, how many countries count as visited and how many of its regions are left. |
| `get_country_atlas_places` | Get places saved in the user's atlas for a specific country. |
| `create_bucket_list_item` | Add a destination to your personal bucket list with optional coordinates, country code, target date and `region_code` (a state or province, hatched on the Atlas map). The same destination for the same target date is rejected as a duplicate. |
| `list_bucket_list` | List your bucket list: every wish with its id, name, country and region, target date, notes and when it was reached. The ids are what `update_bucket_list_item` and `delete_bucket_list_item` take. |
| `update_bucket_list_item` | Update a bucket list item (name, notes, coordinates, target date). |
| `delete_bucket_list_item` | Remove an item from your bucket list. |

### Collab _(Collab addon required)_

Requires `collab:read` or `collab:write` scope.

The addon alone is not enough. Collab has five sub-features an admin switches on and off independently in Admin → Addons — Notes, Polls, Chat, Links and What's Next, all on by default — and three of them gate MCP entries. A tool or resource is only registered when its own sub-feature is enabled on top of the addon, so switching one off makes its entries vanish from the tool list rather than return an error. Links and What's Next have no MCP tools or resources of their own, so toggling them changes nothing here.

| Sub-feature | Tools it gates | Resource it gates |
|---|---|---|
| Notes | `list_collab_notes`, `create_collab_note`, `update_collab_note`, `delete_collab_note` | `trek://trips/{tripId}/collab-notes` |
| Polls | `list_collab_polls`, `create_collab_poll`, `vote_collab_poll`, `close_collab_poll`, `delete_collab_poll` | `trek://trips/{tripId}/collab/polls` |
| Chat | `list_collab_messages`, `send_collab_message`, `delete_collab_message`, `react_collab_message` | `trek://trips/{tripId}/collab/messages` |

| Tool | Description |
|---|---|
| `list_collab_notes` | List the shared notes of a trip, pinned first, with their category, colour, link and files. |
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
| `get_collection_items` | Read saved places and labels by their own ids across every list you can see, without loading whole lists: each place with its status, labels, rating and notes, and the lists they sit in with their colour, size, labels, members (names and roles only) and whether you may delete places from them. Saved place ids are not trip place ids. Ids you cannot see are left out. |
| `create_collection` | Create a new saved-place collection owned by the user. |
| `update_collection` | Update a collection's name, description, colour, icon, cover, links, or sort order. Owner/admin only. |
| `delete_collection` | Permanently delete a collection and all its saved places. Owner only, and it cannot be undone. |
| `reorder_collections` | Reorder the user's collections — pass every collection id in the desired order. |
| `save_place_to_collection` | Save a place into a collection from a raw payload. Returns a duplicate marker instead of saving when a similar place already exists, unless `force` is true. |
| `save_trip_places_to_collection` | Copy one or more existing trip places into a collection. Duplicates are skipped unless `force` is true. |
| `update_collection_place` | Update a saved place's name, address, coordinates, description, notes, status, category, links, tags, labels, image, or move it to another collection (moving out of a list needs the owner or admin role there). |
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
| `get_journey_map_layers` | What a journey's map shows beside its entries and photos: the planned places of its linked trips with their days and the entry written about each (a plan is no proof of a visit), the trips' GPX routes by name and size while the track switch is on, and the stays journal entries were taken over from, each where it was recorded. Every source answers on its own, `ok` or `unavailable`. |
| `get_journey_tracks` | The GPX tracks a journey's map draws, from the trips added to it: per track the place and trip it belongs to, its name, its kind, how many points it has and its length in km, plus `display_geometry`, the line thinned for drawing to at most 200 points per track and about 1000 for all tracks together, both ends always kept. Same journey access as the map. |
| `get_journey_stats` | What a journey adds up to: distance travelled in metres, calendar days spanned, countries in visit order, the furthest point reached, and entry, photo and place counts. Entries switched off with `stats_excluded` count towards none of those and are listed under `excluded`. Pass `include_route` for the route itself, up to 400 stops with coordinates. |
| `create_journey` | Create a new journey with title, optional subtitle, and an initial list of trip IDs. |
| `update_journey` | Update a journey's title, subtitle, cover or status, and whether its entries offer a pros/cons list, a mood and a weather note (`show_verdict`, `show_mood`, `show_weather`). `status_override` sets the shown status by hand (`draft`, `live` or `completed`), `null` goes back to following the trip dates. `photo_location` lets an entry without a place take the position of its first geotagged photo. `auto_prepare_recordings` switches the preparation of its recorded days from Dawarich on or off. Owner only. |
| `restore_journey_suggestions` | Bring back every trip-derived suggestion that was dismissed from a journey. Answers with how many came back. |
| `delete_journey` | Delete a journey. |
| `add_journey_trip` | Link an existing trip to a journey. |
| `remove_journey_trip` | Remove a trip from a journey. |
| `list_journey_entries` | List the entries of a journey in reading order (date, text, mood, linked trip), with the journey's id and title. `from` and `to` (`YYYY-MM-DD`, both included) keep only the entries of those days. |
| `get_journey_entry` | One journal entry by its id, as `list_journey_entries` answers it (photos included), with the id and title of its journey. |
| `create_journey_entry` | Add an entry with date (required), optional title, story text, time of day, location name, mood, and sort order. `is_draft: true` creates it as a draft that the journey share link leaves out. |
| `update_journey_entry` | Edit a journey entry's title, story, date, time of day, place, coordinates, weather, tags, mood, pros/cons list or visibility. `stats_excluded: true` keeps the entry but takes it off the route and out of `get_journey_stats`; `dismissed: true` waves a trip-derived suggestion away without deleting it, so the trip sync does not offer it again. `is_draft` turns the entry into a draft or publishes it. |
| `delete_journey_entry` | Remove an entry from a journey. |
| `reorder_journey_entries` | Reorder entries by providing the new ordered list of entry IDs. |
| `reorder_journey_entry_photos` | Put the photos of one entry in a new order by passing every photo id of the entry once. The first photo is the entry's cover. |
| `list_journey_contributors` | List the contributors of a journey (owner and editors/viewers). |
| `add_journey_contributor` | Invite a user to a journey with `editor` or `viewer` role. |
| `update_journey_contributor_role` | Change a contributor's role between `editor` and `viewer`. |
| `remove_journey_contributor` | Remove a contributor from a journey. |
| `update_journey_preferences` | Update display preferences for a journey. |
| `add_journey_provider_photos` | Attach photos from a connected library (Immich or Synology Photos) to a journey, or to one entry when `entryId` is given. Find the asset ids first with `search_provider_photos` or `list_provider_album_photos`. No image data passes through: the journey stores a reference and the app fetches the picture. An asset already attached is skipped rather than duplicated. |
| `get_journey_suggestions` | Get suggested trips to add to journeys based on recent trip history. |
| `list_journey_available_trips` | List all trips available to the current user for linking to a journey. |
| `get_journey_share_link` | Get the current public share link for a journey. Requires `journey:share`. |
| `create_journey_share_link` | Create or update the public share link for a journey. `share_plan` adds the linked trips' planned places and GPX routes to the shared map, `share_recordings` the recorded days that have a published entry; both start off and show nothing while the map is not shared. Requires `journey:share`. |
| `delete_journey_share_link` | Revoke the public share link for a journey. Requires `journey:share`. |
| `list_journey_recorded_days` | The days of recorded route a journey keeps: zone, distance, pieces, gaps, modes, whether the day was still running, and whose recording it is, without the geometry. Readable without a Dawarich connection. |
| `delete_journey_recorded_day` | Drop the recorded route a journey keeps for one day. Entries and texts stay, and Dawarich keeps its own recording. Needs edit access. |
| `get_book` | The journey's photo book from the Studio, without its document: version, title, page format and every page with its id, role, photos and first words. Page and element ids for the tools below come from here. Any member may read it. |
| `describe_book_page` | One page of the book in words: every element with its id, frame in millimetres and photo or text, then the findings (overlaps, content in the fold or past the trim, empty frames, low print resolution, words past their frame). |
| `list_book_layouts` | The layouts a page can take: templates for double spreads and single pages, photo grids, and the book's own saved layouts, with what each does to what is on the page. |
| `create_book` | Lay down a blank book (cover, first page, one double spread, last page, back) for a journey that has none, in a page format of your choice. Needs edit access. |
| `add_book_pages` | Add up to 10 empty double spreads, always between the first and the last page, optionally on a template or tied to an entry. Needs edit access. |
| `move_book_page` | Move one double spread to another place between the first and the last page; the answer says where it stood. A move to where the page already is changes nothing. Needs edit access. |
| `delete_book_pages` | Delete up to 10 double spreads. The cover, first, last and back pages stay. Needs edit access. |
| `edit_book_page` | Change one page with up to 20 operations, all or nothing: a layout, a gallery photo into a frame, its crop and look, swapping photos, texts and captions, moving and resizing, removing, the page colour. Locked elements are left alone, and photos come only from the journey's gallery. Needs edit access. |
| `set_book_cover` | The cover's layout, photo, title and subtitle. Needs edit access. |
| `suggest_book_photos` | Photos of the journey's gallery for a page or the cover, grouped by day and place, best first: near duplicates (bursts and near-identical pictures) are folded onto the sharpest, and possibly blurry or low-resolution photos are named rather than picked. Narrow it to one entry or day. Sharpness and likeness are measured once per photo in the background; it cannot judge faces or what a photo shows. Any member may use it. |
| `restore_book_page` | Put the pages an earlier change answered under `previous_spreads` back as they were, all in one call, only while the book is still at the version that change answered. Photos must be in the gallery or the book, and locked elements stay as they are. Meant for undo. Needs edit access. |
| `set_book_setup` | The page format (a preset, or width and height in millimetres, bleed, safe margin) and the page numbers. Elements keep their size and place, as in the Studio. The answer holds the setup as it was. Needs edit access. |
| `duplicate_book_page` | Copy one double spread with everything on it, with new ids, right after it. Needs edit access. |
| `save_book_layout` | Keep the arrangement of one page as one of the book's own layouts (at most 24). Needs edit access. |
| `remove_book_layout` | Take one of the book's own layouts away; pages laid out on it stay as they are. Needs edit access. |
| `restore_book_layout` | Put back a layout `remove_book_layout` took away, only while the book is still at the version that removal answered. Meant for undo. Needs edit access. |
| `design_book` | Design the whole book as a draft: chapters, pacing, pages, photos, type and colours, from what the person asks for (style, density, page count, scope, what to keep). Nothing changes until `apply_book_design`. It sees no faces and judges no beauty. Needs edit access. |
| `get_book_design` | A design draft again, with the pages chosen for the apply now. |
| `revise_book_design` | Change one page of a draft with the operations `edit_book_page` takes; nothing in the book changes. |
| `apply_book_design` | Write a draft into the book in one change: the chosen pages, each only if nobody changed it since the design. The book as it was is kept so the change can be taken back in one step. Needs edit access. |
| `restore_book_revision` | Put the book back as an applied design found it, only while it is still at the version the apply answered. Meant for undo. Needs edit access. |

Every book write is one save of the whole book against its version: nothing is written when any part is refused, and every member's open Studio is told the book changed, the asking one included.

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
| `scan_bucket_list_visits` | Ask the recordings, wish by wish, whether the caller reached the places on their bucket list: a stay of at least 20 minutes within 250 m counts, reported with its start, length, distance and points. At most 50 wishes per scan; an instance that cannot be reached or turns the key away ends the scan with that error rather than a list of misses; nothing is ticked off | `atlas:read` |
| `confirm_bucket_list_visits` | Tick off 1 to 200 wishes after a scan, dated with `visitedAt`, else the matched stay, else today; a wish ticked off already keeps its date. Answers `updated` | `atlas:write` |
| `clear_bucket_list_visit` | Take the visited mark off one of the caller's wishes again, with its date and source | `atlas:write` |
| `suggest_atlas_countries` | The countries, cities and minutes the recordings put the caller in between `from` and `to` (at most 400 days), each marked when the Atlas has it already, plus the country names that matched no code. Read live from Dawarich; nothing is marked | `atlas:read` |
| `accept_atlas_countries` | Mark 1 to 300 confirmed countries (ISO 3166-1 alpha-2) as visited in the caller's Atlas; one marked already keeps its source. Answers `marked` | `atlas:write` |
| `preview_journey_recorded_day` | Read one local day of the caller's recording and show what a journey would keep, without keeping it: the window the day runs in, distance, pieces, gaps, modes, whether the journey keeps the day already and how many other people would see it, and the `contentHash` the save needs. Needs the Journey addon too and edit access to the journey | `journey:read` |
| `save_journey_recorded_day` | Keep that day in the journey after the traveller confirmed the preview. Send its `utcOffsetMinutes` and `contentHash` as `expectedHash`; a recording that changed since is not kept. A different version is replaced only with `replace: true`; entries and texts are never touched. Needs the Journey addon too | `journey:write` |
| `review_journey_day_stays` | The caller's stays of one local day, read from Dawarich again, as a journey would take them over: name, place, arrival and departure, whether Dawarich only guessed it, and whether the journey holds it already, left it out before or it went elsewhere, plus the entries the journey has on that day. When Dawarich does not answer, the stays of the last sync with the reason. Needs the Journey addon too and edit access to the journey | `journey:read` |
| `take_over_journey_day_stays` | Take chosen stays of that day into the journey as draft entries: one per stay, several stays of one place as one entry, or a day report listing them with their times, at a chosen stay or without a map position. Corrected names, stays left out on purpose (dismissed, restorable), every stay kept with its own place and times on its entry; stays the journey holds already are reported, never written twice. Needs the Journey addon too | `journey:write` |
| `get_journey_recording_prep` | Whether a journey prepares its recorded days in the background and how the caller's own last runs over its linked trip periods went: when one was last tried, when one last came through (the stays waiting at its days are as new as that), why the last one failed, and whether the caller's connection can prepare anything (`ready`, `sync_off`, `not_connected`). Nothing is ever written into the journey on its own. Needs the Journey addon too and edit access to the journey | `journey:read` |

### Document sync _(Documents addon required)_

`get_trip_document_sync` and `list_trip_document_sync_issues` require `files:read`; `sync_trip_documents` requires `files:write`. Any member of the trip may call them. No tool connects a store or changes a binding: that hands TREK a credential to someone's document archive, and it stays with the trip owner in the file manager. See [Document-Sync](Document-Sync).

| Tool | Description |
|---|---|
| `get_trip_document_sync` | Show whether the trip's documents are synced with a document store (Paperless-ngx, Papra, Nextcloud, OpenCloud or a Synology NAS), which tag, folder or space they are bound to, when the last run happened and how it went, and how many documents are synced, waiting, in conflict or missing in the store. |
| `list_trip_document_sync_issues` | List the documents that need a person: conflicts, documents refused for their type or size, transfers that failed, and documents gone from the store. Returns `configured: false` for a trip that is not bound, and an empty list when everything is in step. |
| `sync_trip_documents` | Run every binding of the trip now instead of waiting for the next scheduled check, and report how many documents came in, went out and are in conflict. Pass `full: true` to compare both sides in full. A binding whose owner left the trip, or whose store an admin switched off, is reported and not run. Safe to call repeatedly: a run already in progress is not started twice. |

### Tours _(Tours addon required)_

The saved tours of a trip, as the Tours list and the tour detail show them, how far a city walk got on a day, paddle legs planned on the water, a city walk prepared from a briefing, a change to a saved city walk prepared for review and saved once the traveller confirmed it, a saved change taken back the same way, a hike planned on the server with its heights and SAC grades, created, changed or taken in from a GPX file once the traveller confirmed it, and the tours the user has done, summed across their trips as the Atlas shows them. `take_over_tour`, `create_city_walk`, `create_hike`, `update_tour`, `import_tour_gpx`, `save_tour_change`, `undo_tour_change`, `assign_tour_track`, `unassign_tour_track`, `set_tour_activity_excluded`, `save_tour_to_collection`, `take_over_collection_tour`, `delete_collection_tour`, `link_tour_packing` and `unlink_tour_packing` write; every other tool here only reads. The collection tools need the Collections addon as well, the packing tools the Lists addon. Tours someone is still drawing in the planner are not saved yet and do not show here.

| Tool | Description | Scope |
|---|---|---|
| `list_tours` | The saved tours of a trip: name, type (`hike`, `walk` for a city walk, `run`, `bike`, `kayak` for a paddle tour, `horse` for a ride, which has no riding time worked out, or `ski` for a ski and winter tour), origin (`trek` for planned in TREK, `gpx` for a GPX import, `wanderer` for a wanderer snapshot), distance, ascent and descent (unknown for a paddle tour drawn in the planner), the stored routing limit of a hike on the SAC scale and its route choices (`hiking_preferences`), the discipline of a ski tour (`ski_discipline`: `alpine`, `snowboard`, `cross_country`, `touring`, `snowshoe` or `winter_hike`; snowshoeing and winter hiking are ski tours, a hike is summer only; `ski_technique` for cross-country only: `classic`, `skating` or `unknown`; a planned ski tour has its legs planned by the piste router along the runs, lifts and trails of OpenStreetMap where that data reaches and drawn straight elsewhere (`ski_options`, `ski_route_build` and `ski_planned_legs` say what it was planned with, on which build, and which legs), with a ski time only when every leg was planned; an imported one is kept as recorded; neither says anything about snow, avalanches or open runs), the boat, water and chosen speed of a paddle tour, the check bench of a paddle tour (`paddle_check`: how far the OpenStreetMap obstacle data covers its route and how many obstacles are open, to check again or decided; a planning status, never a safety or legal clearance), for a city walk how many stations it has (`station_count`), their stays as far as entered and how many have none, whether a tour still waits for its way to be planned (`route_pending`: saved with its points only, its distance and walking time unknown until someone opens it in the planner and saves it), for a multi-day tour how many stages its route is split into (`stage_count`, `null` for a tour of one day), the `revision` (raised by every saved change of the tour), the actual tracks linked to a tour (`activity_tracks`) and, for an actual track, the tour it belongs to (`activity_of`), when an imported track was recorded (`track_started_at`, `track_ended_at`; unknown when the file carried no times), and the days of the trip each tour is on | `trips:read` |
| `get_tour_plan` | One tour: its facts, its ordered control points, its provenance (where it came from, when, and whether it was changed in TREK since) and its days. A control point can carry a fixed leg to the next one: a via ferrata (`ferrata`), a stretch drawn by hand (`free`), which no router planned or checked, or on a ride a section of a signposted horse route (`horse_route`) in the direction chosen, with its signposting and the `horse=*` tags its ways carried; being on a route is no permission to ride it. A shaping point (`shaping: true`) only steers the route and is no stop. A stop with `stage_end: true` ends a stage of a multi-day tour and the next one begins there; the stages follow the route in its order. A paddle tour also carries its obstacle checklist (`obstacle_check`): the obstacles of the OpenStreetMap data along its route, what the travellers decided about each, and their own portages and locks. The stations of a city walk carry every field spelled out: `key` (the same across saves), `name`, `stay_minutes` (`0` for a point only passed, `null` when not known), `importance` (`optional`, `must`, or `null` for normal), `protected` (a station a proposed change has to keep where it is; the travellers can still edit it) and `opening_hours` (as OpenStreetMap writes them, `null` when none is known). Every leg from one control point to the next is listed in `legs` with its kind (`routed` for a leg the router planned, `track` for part of a recorded line no router planned, as for an import without control points of its own, `ferrata`, `free`, `portage` or `horse_route`; a leg of a planned ski tour is `routed` where the piste router planned it and `free`, a straight line between its points, where it did not) and, for a fixed leg or a ski tour's leg, the length of its own line; a routed or track leg has no length of its own stored. `line` gives the saved line in brief: how many points it has, whether they carry heights, and a preview thinned to 200 points. Pass `dayId` with a city walk to read the visits of that day: each station then says `visit_status` (planned, visited or skipped) and `run` what is still open; without a day no visit is told. `derived` names every field worked out on reading rather than stored with the tour. The actual tracks linked to the tour (`activities`) each name their day, the recording (its tour in the trip, origin, file name, when it came in) and what that recording measures: distance, ascent and descent (unknown without heights) and the time from its first to its last time stamp, breaks included (unknown when the file carried no times, never estimated); the planned values stay apart and unchanged. Reading changes nothing, not even the revision. The full track geometry is not included | `trips:read` |
| `find_tours_for_day` | The tours put on one day of a trip, with the same facts as `list_tours` | `trips:read` |
| `get_city_walk_progress` | How far a city walk got on one day it is on: every station in order with its key, its status that day (planned, visited or skipped, as checked off in the day plan), importance, protection, stay and opening hours, what is still open, and the walking time of the whole walk. Visits belong to that day only. Reading changes nothing | `trips:read` |
| `get_city_walk_remaining_time` | What is left of a city walk on one day it is on, counted from the last station checked off as visited (or the start): the walking time still ahead along the saved line, the stays still open and the open stations, kept apart from the walking time of the whole walk. Says what it counts from and that no live position is known; an upper bound while a station ahead is skipped; unknown, with the reason, without a line, a walking time or a clear order of visits. Reading changes nothing | `trips:read` |
| `export_tour_gpx` | One saved tour as a GPX file: its whole saved line as one track, with the heights it carries and none it lacks, and a file name. A tour without a line cannot be exported | `trips:read` |
| `search_tour_pois` | Places along the saved line of a hike, run, ride, bike tour, paddle tour, ski and winter tour or city walk within a corridor (viewpoints, peaks, shelters, drinking water, food, toilets, picnic, campsites, sights, slipways, boat rental, bike repair, for a bike tour e-bike charging points, for a ski and winter tour coffee shops and places to eat as well, and for a city walk museums and galleries, parks and gardens, coffee shops, places to eat and markets): source (TREK places index or OpenStreetMap), kind, address, website, phone, opening hours as the source has them (a hint, never a promise), the distance straight across to the line (not a detour) and how far along the line; up to 60, the nearest to the line when more match, listed from the start. An e-bike charging point is one OpenStreetMap tags for bicycles (`bicycle=designated` or `yes`, never a charger for cars alone) and carries `charging`: bicycle, sockets, capacity, fee and access as OpenStreetMap states them, empty where it says nothing; whether it works or is free today is not known. When sights are asked for, the best known places near the line (by the page views of their Wikidata item) are searched too, so a famous square no category names is found as a sight, and the highlights among them carry `highlight: true` and come first. A place OpenStreetMap has no name for comes with an empty name. `unavailable` names the categories no source could be searched for right now, so their places are missing rather than absent. `retry_after_s`, when present beside `unavailable`, is how many seconds until asking again makes sense, because the OpenStreetMap mirrors failed and are only probed now and then. Says when stretches could not be searched, only the first part of a long line was, or more places matched. A tour saved with its points only (`route_pending`) has no line to search along yet. Nothing is added | `trips:read` |
| `list_tour_library` | The saved tours of every trip the user can open, to choose one to take over into another trip: name, type, distance, ascent, descent, planned times and the trip each is in. Narrowed by a part of the name, a type or a trip; the trip being planned can be left out. Up to 100 tours, `truncated` says there were more | `trips:read` |
| `assign_tour_track` | Links an actual track to a saved tour, once the user chose it: another tour of the same trip that came in through the GPX import or from wanderer and was not planned over, for one of the tour's day assignments or for none. A day that already has one gets this one instead; a track belongs to one tour only. The planned line, measures and times of the tour do not change. Needs `place_edit` | `trips:write` |
| `unassign_tour_track` | Unlinks an actual track from a tour again; the track stays in the trip as the import it is and the tour does not change. Needs `place_edit` | `trips:write` |
| `get_tour_activity_stats` | The tours the user has done across the trips they can open, summed: how many, distance, ascent and descent, as a whole and by type, for a period (`from`, `to`) and one type. A tour counts once the last day it is on is over, and only where the user takes part: named among the participants of that day, or nobody named, which means everyone of the trip; a day naming only others is theirs. Each tour says what its values rest on: `plan` (the planning of the trip, not a measurement) or `track` (a linked actual track, which replaces the plan instead of adding to it). A tour on several days counts once, an import other tours were planned from does not count beside them while one of them counts (`derived_from_place_id` names it), a paddle tour sums no heights, and an unknown value stays unknown. Tours the user left out are listed but not summed; `uncounted` names those of their trips on no day or on days without a date | `trips:read` |
| `set_tour_activity_excluded` | Leaves a tour out of the user's own activity sums, or counts it again, for instance a tour that fell through. The tour, its days and its plan do not change, and nobody else's sums do | `trips:write` |
| `take_over_tour` | Copies a saved tour of another trip into a trip as an independent tour: its line, measures, settings and control points, without its days, its links to places of the other trip or the obstacle decisions taken there. The copy remembers which trip and tour it came from; the source trip is not changed. A city walk keeps its stations with their keys, names, stays, importance, protection and opening hours, and none of the visits of the other trip's days. Needs `place_edit` on the trip it writes into | `trips:write` |
| `list_collection_tours` | The whole tours kept in a collection, newest first: name, type, distance, ascent, descent, planned times, how many waypoints each keeps, whether it has a line, the trip and tour it was saved from and who saved it. Each is an independent copy; later changes to the tour it came from do not reach it. Needs the Collections addon too | `collections:read` |
| `get_collection_tour` | One tour kept in a collection with what taking it into a trip asks about: its line thinned to at most 400 points, its waypoints in order with their roles, and every trip the user can open with whether they may add a tour to it | `collections:read`, `trips:read` |
| `save_tour_to_collection` | Keeps a saved tour of a trip in a collection the user may add to, as an independent copy: line, type, measures, settings and waypoints with their roles, and where it came from. Its days, links to places of the trip and obstacle decisions stay in the trip; the trip is not changed | `collections:write`, `trips:read` |
| `take_over_collection_tour` | Makes a new tour of a trip from a tour kept in a collection. `include_waypoints` must be given: true brings the waypoints in order with their roles, false keeps only the line as saved (a kept tour without a line needs its waypoints). No days and no places are added; neither the collection nor the original tour changes. Needs `place_edit` on the trip | `trips:write`, `collections:read` |
| `delete_collection_tour` | Removes a tour kept in a collection; only the collection's owner or an admin of it may. Tours already made from it stay | `collections:write` |
| `get_tour_packing` | The packing list a tour points at: the whole list of the trip or one of its categories (`packing_link`, `null` while it points at nothing), how it reads (`ready`, `empty`, or `missing` when its category has no item the user can see any more), the items the user may see of it with their quantity and whether each is packed, and the tour's own facts (type, distance, ascent and descent, walking and planned time, difficulty) as context for suggesting what to pack, unknown ones `null`. Reading changes nothing, and a suggestion becomes an item only through the packing tools | `trips:read`, `packing:read` |
| `link_tour_packing` | Points a tour at the packing list of its trip: `category` `null` for the whole list, or the name of one of its categories exactly as its items carry it (one the user can see an item of). Replaces what the tour pointed at; nothing in the packing list is copied or changed. Needs `place_edit` on the trip | `trips:write`, `packing:read` |
| `unlink_tour_packing` | Lets a tour stop pointing at its packing list. The list, its categories and its items stay exactly as they are. Needs `place_edit` on the trip | `trips:write` |
| `preview_google_maps_walk` | Reads the stops of a Google Maps walking route shared as a link (a `maps.app.goo.gl` short link or a `google.com/maps/dir` link), in order, for a city walk: each stop's name and position, or no position when the link gives none (nothing is looked up or guessed), and the long link that was read. Only a route Google Maps marks as on foot is read; a car, bike or transit route, or a link that does not say, is refused. A short link is followed only to Google Maps itself. Nothing is saved, and the line drawn in Google Maps is not taken over: TREK plans the way on foot between the stops again. Needs `place_edit` on the trip | `trips:read` |
| `propose_city_walk` | Proposes a city walk from a briefing without saving anything: start (and end), the time frame on a day, the themes (`culture`, `parks`, `food`, `mixed`), the stations the traveller wished for, the places of the trip it may use and fixed appointments. Places for the themes come from the same search as `search_tour_pois`, up to 8, each with its source, theme and category; nothing is made up. Answers the stations in order with the walking distance and time from the one before, the arrival and leave times, the stay where the traveller gave it (unknown otherwise, which makes later arrivals the earliest possible), and the opening hours checked against the arrival on that day. The order is chosen on estimates; the walk in that order is then planned on foot by the router TREK uses for road trips (the traveller's own routing server where they set one), whose legs give the distances and times. Where it gives no way, because the router cannot be reached or a station lies more than 300 m off every way, the times are estimates over the straight distance with an allowance for streets at 4.5 km/h, and the answer says so and why. Walking and stays are kept apart, a complete total only when every stay is known, with the minutes the frame leaves for the stays not known. Lists free time, the wishes and appointments that cannot be kept as asked, what was left out and why, and `stations_for_create` for `create_city_walk`. With `include_geometry` it adds the way on foot for drawing (`line_geometry`, up to 300 points) where the router planned one | `trips:read` |
| `create_city_walk` | Creates a city walk from stations the traveller confirmed (for instance `stations_for_create` of `propose_city_walk`), through the same creation the planner's save uses: a key for every station, its name, stay, importance, protection, opening hours and the place of the trip it stands for. The way on foot is planned by the same router as for the proposal, and the walk is saved with it, its distance and its walking time. Where the router gives no way, the walk is saved with its stations only (`route_pending`), says why, and has no line, distance or walking time until someone opens it in the planner, where TREK plans the way on foot and the walk can be saved with it. Needs `place_edit` on the trip | `trips:write` |
| `propose_hike` | Plans a named hike for the traveller to look at, without saving anything: the way on foot through its points in order (start, points on the way, each with its kind of place where it is one, end; `round_trip` comes back to the start), on paths no harder than `max_hiking_difficulty` on the SAC scale (T1 to T6, T2 when left out) and avoiding steep climbs, steps or ferries where there is a way round (`hiking_preferences`). The way is planned by TREK's Valhalla router with the planner's hiking costing (the instance an admin set, else the public FOSSGIS one), through the same paced queue as the road trip. Answers the distance, ascent and descent, the walking time without breaks (by DIN 33466 from the heights where every point has one, else the router's), the lowest and highest point (with where it lies along the way), the SAC grades OpenStreetMap records along the way (the hardest, up to 80 graded stretches, neighbours joined with the harder grade kept, and how much is unknown, which is never read as easy), each point with where it lies along the way, how far it was moved onto a way, the walking minutes from the start and, with `start_time`, its arrival, and up to 12 summits, huts, drinking water and viewpoints within 250 m of the way (`along`; left out with `along: false`, and none where they could not be searched). With `day_id` (whose date it takes) or `date` it plans the day: the arrival (on the next day past midnight), sunrise and sunset and the weather by the hour at the highest point (to about a kilometre), from the forecast, as observed for a past day (which knows no likelihood of rain), or, further out, from last year's day; without a start the latest one that is back half an hour before sunset. It warns of a start before sunrise, an arrival after sunset or within the hour before it, and of the first walking hour with thunderstorms or rain more likely than not, these two on a forecast only; without the weather the day still answers, without sun, hours or warnings. With `include_geometry` it adds the line (up to 300 points) and height profile (up to 200 samples) for drawing (`line_geometry`, `profile_geometry`). Where no way is planned it says why: no Valhalla (a routing server of the traveller's own knows no hiking limit), the router not answering, no way within the limit, a point more than 300 m from any way, or a way too long for one hike (past the router's own distance limit, or more than 10,000 points, whose heights would hold the router's queue up for everyone). A planned way with every height is kept for 15 minutes (the last 64 per instance, up to 200,000 line points together), so a hike created or changed from the proposal saves the line it showed. `variant_label` is given back, so several ways can be compared | `trips:read` |
| `create_hike` | Creates a hike from points the traveller confirmed (usually those of `propose_hike`), through the same creation the planner's save uses: its points in order as start, points on the way and end with their names and kinds of place, the way planned by the same router (the line a proposal of the last 15 minutes showed) and saved whole with the height of every point, its distance, ascent, descent, walking time, hiking limit, preferences and planned time. Where the router does not answer, for the way or for its heights, the hike is saved with its points only (`route_pending`), says so, and TREK plans the way when someone opens it in the planner. Any other reason the proposal names (no Valhalla, no way within the limit, a point off every way, a way too long) refuses the hike with why, and nothing is saved, since the planner could not plan it either. With `day_id` it is put on that day of the trip in the same write, `start_time` kept as the start of that visit, and the trip is told of the tour and the visit once both are saved (`assignment` names the visit; `day_edit` is needed as well). Needs `place_edit` on the trip | `trips:write` |
| `update_tour` | Changes a saved hike against the `revision` it was read at: a new name, description or planned time keeps its way; new points, a new hiking limit or new preferences plan the way anew as `propose_hike` does, and so does a hike still waiting for its way. A hike changed since that revision is refused as a conflict before anything is planned, and a new way that cannot be planned, or not with its heights, is refused with the reason, leaving the hike as it was. A new point standing where a saved one stood (within 25 m) keeps that point's link to a place of the trip and its name. A hike with a section drawn by hand (a via ferrata, a free line, a ferry) or split into stages takes new points only in the planner, the hand-drawn one a new limit or new preferences too. A recorded track without points of its own takes only new points, which plan it over and keep the recording; every other tour type is refused (a city walk changes through `prepare_tour_change` and `save_tour_change`). The hike stays on its days. Needs `place_edit` on the trip | `trips:write` |
| `import_tour_gpx` | Takes in the tracks and routes of a GPX file, passed as its text, as tours of the trip, one each, through the same import as the planner's file import: a hike unless another type is named (a bike import with its profile, a run with its profile, a paddle import with its boat and water, a ski import with its discipline). A track already in the trip under the same name and start is skipped and counted; a file without a track or route is refused. Needs `place_edit` on the trip | `trips:write` |
| `prepare_tour_change` | Prepares a change to a saved city walk for the traveller to review, without saving anything: no tour, station, visit or day plan changes, and turning it down keeps the plan as it was. The changes apply in order and name the saved stations by their keys: `add` (a new station after a station; a spontaneous stop on the way is an add after the station the traveller is at), `remove`, `replace` and `move`. A protected station, or one visited or skipped on any day of the walk, is never removed, replaced or moved, nothing is put before the last station already done, and a leg drawn by hand stays as drawn, the closing leg of a loop included; such a change is refused, and with it the whole proposal, naming every change and why. Another type of tour, or a walk that is a recorded track without stations of its own, is refused as well: so far only a city walk takes prepared changes. The answer names the tour and the `revision` it was prepared on (a save has to name it, and a tour changed since is refused rather than overwritten), the stations after the change with what changed each and where it stood before, what was removed, the way on foot before and after planned by the same router TREK uses for city walks and its change in metres and minutes (the distance and walking time stored with the walk given apart), the stays as far as known before and after, every leg after the change with the new ones marked, `data_gaps` for what could not be worked out (no way from the router, stays not known, no arrival times, shaping points dropped because the leg they steered changed), a warning for a station of importance must removed or replaced, each new station that is not yet a place of the trip as `create_place` takes it to keep it as a place instead (a station linked to a place of the trip is left out), whether the traveller may change the trip's places at all (`can_save`) and the `proposal_id` a save of it names | `trips:read` |
| `save_tour_change` | Saves a change `prepare_tour_change` prepared, once the traveller said yes to it exactly as shown: the same changes, the `revision` it was prepared on, its `proposal_id` and `confirmed` set to true. Anything else is refused and nothing is saved. The trip permission and the tour are checked again before anything is written: a tour changed since the proposal was prepared is refused as a conflict rather than overwritten (prepare the change again), a proposal already saved, sent again because its answer was lost, writes nothing and answers `already_saved` with the step it was saved as, and a change the rules no longer allow, a station visited or skipped meanwhile or a place of the trip gone, is refused with every reason. The change is saved whole or not at all, through the same write the planner's save uses: the stations in their order, the stations kept keep their keys and their visits, and the way on foot is planned by the same router as the proposal; where it gives no way the walk keeps its stations only (`route_pending`) until someone opens it in the planner. Every save is kept as a step of the tour with the revision it was prepared on and the one it raised the tour to, the changes and the tour as it was before them, so it can be followed and taken back with `undo_tour_change`; nothing of the conversation is kept. A new walk has no revision yet and is made with `create_city_walk`. Needs `place_edit` on the trip | `trips:write` |
| `list_tour_change_steps` | Lists the changes saved to a tour with `save_tour_change`, the latest first: each step with when it was saved, the revision it was prepared on and the one it raised the tour to, and the changes as confirmed. `standing` says whether it can be taken back: `latest` (the tour's latest change), `undone` (taken back already, with when and the revision that raised the tour to), `later_change` (something was saved on top of it since, so taking it back would lose that) or `no_earlier_state` (its record of the tour before cannot be read). Edits saved in the planner are no steps, and a draft in the planner is never seen | `trips:read` |
| `prepare_tour_undo` | Shows what taking back a saved step would do, without changing anything: the step and its changes, the tour now (distance and walking time as stored, each station with whether it was visited or skipped on a day) and the tour exactly as it was before the step (its stations, each kept or coming back with where it stands now, and the distance and walking time stored then), the stations taking back removes, and the `step_id` and `expected_revision` that `undo_tour_change` names. Only the tour's latest change can be taken back; a step something was saved on top of since is refused as a conflict, so no later edit is lost, and so is one that would remove a station visited or skipped since or bring back a station whose place of the trip is gone. Visits of stations that stay, the days and the tour's name and notes are not touched. Not the planner's undo: discarding a draft in the planner never changes a saved tour. Also says whether the traveller may change the trip's places (`can_undo`) | `trips:read` |
| `undo_tour_change` | Takes back a saved step once the traveller said yes to the preview of exactly that step: `step_id` and `expected_revision` as `prepare_tour_undo` gave them, and `confirmed` set to true. Everything is checked again before anything is written, and a tour changed since the preview, a step no longer the latest change or taken back already, or a station visited or skipped meanwhile that would go, refuses it and leaves the tour as it is. Restores the tour whole or not at all, exactly as it was before the step: its line, its stations with their keys and the distance and walking time stored then. A step is taken back once, and taking it back raises the tour's revision like any other save. Needs `place_edit` on the trip | `trips:write` |
| `plan_paddle_route` | Plans the legs of a paddle tour on the water network TREK builds from the paddle regions an admin added: each leg (`from`, `to`) along rivers and canals and across lakes, carried round weirs, dams and waterfalls, through or round locks (`lock_policy`), with `boat` and `lake_style` (`direct` or `shore`). Answers per leg its length, how far its ends were moved onto the water and its stretches (water, lake, whitewater, boat pass, portage with its source, lock, gap) with where each starts and ends in metres along the leg; a leg that cannot be planned says why (`not_on_water`, `no_region`, `cross_region`, `no_water_path`, `busy`, `timeout`). Nothing is saved; a planning aid, never a safety or legal clearance. With `include_geometry` each planned leg adds its line for drawing (`line_geometry`), all legs together up to 300 points shared by length | `trips:read` |
| `plan_ski_route` | Plans the legs of a ski and winter tour on the runs, lifts, cross-country trails, ski touring and winter paths of OpenStreetMap, which the Places host serves as one graph per ski area: for a `discipline` (`alpine`, `snowboard`, `cross_country` with a `technique`, `touring`, `snowshoe`, `winter_hike`) and its `options` (difficulty limit, freeride, lift classes to avoid, riding down, priority, pace, groomed or lit trails only, ascent along pistes, lifts at all). Answers per leg its length, climb and descent, its time split into skiing, lifts, waiting and walking, how far its ends were moved onto the network, its stretches with where each starts and ends in metres along the leg, and notes on what they rest on; a leg that cannot be planned says why (`not_on_piste`, `no_area`, `cross_area`, `disconnected`, `blocked_by_difficulty`, `blocked_by_lift_avoid`, `blocked_by_technique`, `needs_ride_down`, `uphill_only`, `loading`, `places_unavailable`, `disabled`, `busy`, `timeout`) and, where one helps, the one change that would plan it. No clicked point leaves the server. Times are estimates, nothing says what is open, groomed or safe today; nothing is saved. With `include_geometry` each planned leg adds its line for drawing (`line_geometry`, with its heights), all legs together up to 300 points shared by length | `trips:read` |

### Road trip _(Road trip addon required)_

These tools work without an open browser. The external assistant chooses places based on the traveller's interests, uses the existing trip, day, place and assignment tools to save them, and recalculates to check the result. What each tool corresponds to in the planner is described on [Road-Trip](Road-Trip#mcp-tools).

| Tool | Purpose | Scope |
|---|---|---|
| `get_roadtrip_context` | Saved days, visits, coordinates, stays, pinned times, vehicle preferences, route profiles, vias, tracks and manual boundaries, plus a `carriers` block with the flight, train, ferry, cruise and bus bookings that seam the drive and the hire cars whose desks stand on it, and `stays` with every booked stay, its check-in and check-out day and the earliest linked reservation | `trips:read` |
| `calculate_roadtrip` | Calculated days, arrivals, departures, automatic pauses, driving warnings and range warnings; optional geometry. A booking's terminals and a hire car's desks come back as stops carrying `carrier` (its role, type and timetable); their `assignmentId` and `placeId` are synthetic negative numbers that belong to no assignment and no place, so never pass them to the assignment or place tools. With `roadtrip_hotel_bookends` on, a day after a booked night starts at that stay and a day before one ends there: those stops carry `bookend` (phase, accommodation, reservation, check-in and check-out flags, the check-out time as a label), the stay's real `placeId` and a synthetic negative `assignmentId`, and cannot be reordered, edited or given via points | `trips:read` |
| `get_roadtrip_settings` | Shared driving preferences for the specified trip; a missing `roadtrip_hotel_bookends` means off | `trips:read` |
| `update_roadtrip_settings` | Patch shared trip driving preferences, preserving other settings | `trips:write` |
| `search_roadtrip_corridor` | Fuel, charging, rest areas, campsites, food, sights or hotels along a day, each hit with the two stops of the day it lies between (`between`) | `trips:read` |
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

Google Maps directions links can be reviewed with `preview_google_maps_route` and saved with `import_google_maps_route`. Import creates places and visits together in the supplied order, with trip access and place/day permission checks, and answers with the ids of the places and visits it created (`place_ids`, `assignment_ids`). Unresolved stops must be omitted from the confirmed input. The Google road geometry is not copied.

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
