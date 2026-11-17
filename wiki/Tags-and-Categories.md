# Tags and Categories

TREK has three ways to label a place:

- **Global Place Categories**: admin-managed, shared across every user on the instance (e.g. `Restaurant`, `Museum`). A place has one category, and it decides the marker.
- **Trip Tags**: extra labels a trip owns (e.g. `Monument`, `Activity`, `Old Town`). A place can carry any number of them, everybody on the trip sees the same ones, and the places list filters by them.
- **Personal Tags**: user-scoped labels (e.g. `hidden gem`, `kid-friendly`), reached through the API and MCP.

## Global Place Categories

Categories classify places across all trips. Every user sees the same set of categories.

**Fields per category:**

- **Name**: displayed in the place form and sidebar filter.
- **Color**: used for the colored icon background on map markers and in the places sidebar. Default: `#6366f1`.
- **Icon**: a Lucide icon name (e.g. `MapPin`, `Coffee`, `Mountain`). The UI form defaults to `MapPin`; the database-level fallback is the 📍 emoji, which is also resolved to the `MapPin` Lucide icon at render time.

Categories appear in:

- The **place form** when adding or editing a place: the category is the pill in the head band, and the **+** next to it (*New category*) creates one on the spot.
- The **places column** as filter options: the tag icon opens the categories, and a badge on it counts those in force. The trip's tags are in the same list, see [Trip Tags](#trip-tags). In select mode, **Change category** gives every ticked place the same category.
- **Map markers**: the category icon and color are used to style each place's marker pin.
- **Map hover cards**: resting the pointer on a marker shows the category with the place's name and address.
- **Saved places** in [Collections](Collections), which use the same set.

![Place form of Hallgrimskirkja with the category pill in the head band open: the categories with their colours, Attraction ticked, and the + for a new category beside the pill](assets/PlaceCategoryPicker.png)

A place picked from the search or from a marker of the map's category buttons comes with a matching category already picked, when the palette has one whose name or icon fits (a hotel goes to a category such as Hotel or Accommodation, a museum to Sights or Museum). Pick another one and it stays yours. See [The place form](Places-and-Search#the-place-form).

> **Admin:** Create and manage categories in [Admin-Categories](Admin-Categories), or create one on the spot with the **+** (*New category*) next to the category pill in the head band of the place form. Only admins can create, edit, or delete categories. All users can read them.

> **AI / MCP:** `list_categories` lists the palette; `create_category`, `update_category` and `delete_category` are for admins only.

## Trip Tags

A category says what kind of place something is, and a place has exactly one. Tags are the extra labels beside it: a cathedral in the category *Sights* can also be tagged `Monument`, `Rainy day` and `Old Town`, and you can then look at the trip through any one of them. A tag never changes the marker: its icon and colour stay the category's.

**Fields per tag:**

- **Name**: up to 50 characters. A trip has each name once, whatever its capitals: adding `monument` to a trip that has `Monument` gives you the tag that is there.
- **Color**: a hex value, shown on the tag's mark. A tag added in the app gets one from a small palette in turn; over the API the default is `#10b981`.

### Who owns them

A trip tag belongs to the **trip**, not to the person who made it. That is what keeps a shared trip in step:

- Every member of the trip sees the same tags, on the places and in the pickers.
- Whoever may edit the trip's places (the permission **Add / edit / delete places**, `place_edit`, see [Admin-Permissions](Admin-Permissions)) can add a tag, rename it, recolour it and delete it. Nobody needs to be the one who created it. The app adds tags from the place form; renaming and deleting go through the API and MCP for now.
- The tags go with the trip: deleting the trip deletes them, and a copy of the trip gets its own copies, on the same places.
- Deleting a tag takes it off every place that carried it.
- TREK keeps who added a tag, so an account that is deleted takes the tags it added with it, like the notes it wrote.

A change to the tags reaches the other members while they have the trip open: the pickers, the pills on the places and the filter follow without a reload.

### Where they appear

- **The place form**, on the desktop and on the phone: under **Tags**, every tag of the trip is a switch. Tick the ones the place should carry. To add a new one, type its name into **New tag** and press Enter or the button beside it: the tag is added to the trip and ticked. Saving the place saves its tags. A save that did not touch the tags leaves them alone, so it cannot undo a tag a fellow traveller put on the place in the meantime.
- **The category filter** of the places list: the tags are listed after the categories. Tick one or several: the list, and the map with it, keeps the places that carry one of the ticked tags. With categories ticked as well, both have to hold, so *Sights* and `Monument` together show the sights that are monuments. **Clear filter** lifts the tags too.
- **On the place**: pills beside the category in the head of the place inspector, and chips under the category on the phone's place sheet.

Putting a tag the trip already has on a place works offline, like any other edit of a place. Adding a new tag needs a connection.

> **API:** `GET /api/trips/:tripId/tags` lists the trip's tags for any member. `POST /api/trips/:tripId/tags` adds one (or answers the existing tag of that name), `PUT /api/trips/:tripId/tags/:id` renames or recolours it and `DELETE /api/trips/:tripId/tags/:id` removes it, each with the permission to edit places. A place is written with `tags`, the ids of the tags it should carry, always the whole set. Other clients hear a change as the WebSocket event `tripTags:changed`.

> **AI / MCP:** `list_trip_tags`, `create_trip_tag`, `update_trip_tag` and `delete_trip_tag` manage a trip's tags, and `create_place`, `create_and_assign_place` and `update_place` take `tags`. See [MCP-Tools-and-Resources](MCP-Tools-and-Resources).

## Personal Tags

Personal tags are labels owned by one user rather than by a trip. They attach to individual places via the same many-to-many relationship as trip tags (`place_tags` table), so the same tag can be applied to as many places as you like, and a single place can carry multiple tags.

**Fields per tag:**

- **Name**: free-form text.
- **Color**: hex value displayed alongside the tag name. Default: `#10b981` (emerald).

Personal tags are owned by their creator, but only the *list* is private. `GET /api/tags` and the `list_tags` MCP tool return only your own personal tags, never a trip's, and their names carry no uniqueness constraint, so different users, or even the same user, can create tags with identical names without conflict.

A tag you attach to a place is **not** private. It becomes part of that place: the place read-back joins `place_tags` → `tags` with no owner filter, so every trip member gets it from `GET /api/trips/:id/places`, the day and assignment endpoints, and the MCP `list_places` tool and `trek://trips/{tripId}/places` resource, gated by trip access alone. The `?tag=` filter on the places list is likewise not user-scoped, so a member can filter by a co-traveller's tag ID. This is deliberate: a personal tag is kept as long as its owner is on the trip roster, so a co-traveller's tag is not silently stripped when another member re-saves the place. A personal tag owned by someone outside the trip is dropped instead, and so is a tag that belongs to another trip.

If a trip has a public share link with the map/itinerary section enabled, the tags of places **scheduled on a day** also reach anonymous viewers, trimmed to the tag's ID, name and color, so the owner's user ID never leaves the server. Unscheduled places in the shared place pool carry no tags.

In the app a personal tag on a place looks like any other tag of that place: it is a pill on the place and an entry of the category filter, and the place form keeps it ticked. The form does not offer it for other places, though: what it offers are the trip's own tags. Deleting a tag automatically removes it from every place it was attached to.

### Where to manage them

Personal tags are managed through the MCP API: AI assistants connected to your instance can list, create, update, and delete them (`list_tags`, `create_tag`, `update_tag`, `delete_tag`) and attach them to places through the place endpoints. The app has no screen for them; the filter `tag` parameter on the places API and on the MCP `list_places` tool filters places by the ID of any tag, a trip's or a personal one (the `trek://trips/{tripId}/places` MCP resource only filters by `assignment`).

> **AI / MCP:** See [MCP-Tools-and-Resources](MCP-Tools-and-Resources) for the full tag tool list.

## When to use which

| Use case | Use |
|---|---|
| Classifying a place by type (Restaurant, Museum, Hiking Trail…) | **Category** |
| Extra labels the whole trip shares and filters by (Monument, Rainy day, Old Town…) | **Trip tag** |
| Labels of your own that follow you from trip to trip, set through an AI assistant | **Personal tag** |

## See also

- [Places-and-Search](Places-and-Search)
- [Admin-Categories](Admin-Categories)
- [MCP-Overview](MCP-Overview)
