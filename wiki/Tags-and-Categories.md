# Tags and Categories

TREK has two independent labelling systems for places:

- **Global Place Categories** — admin-managed, shared across every user on the instance (e.g. `Restaurant`, `Museum`).
- **Personal Tags** — user-scoped labels (e.g. `hidden gem`, `kid-friendly`).

<!-- TODO: screenshot: tag list on place detail -->

## Global Place Categories

Categories classify places across all trips. Every user sees the same set of categories.

**Fields per category:**

- **Name** — displayed in the place form and sidebar filter.
- **Color** — used for the colored icon background on map markers and in the places sidebar. Default: `#6366f1`.
- **Icon** — a Lucide icon name (e.g. `MapPin`, `Coffee`, `Mountain`). The UI form defaults to `MapPin`; the database-level fallback is the 📍 emoji, which is also resolved to the `MapPin` Lucide icon at render time.

Categories appear in:

- The **place form** when adding or editing a place.
- The **places sidebar** as filter options.
- **Map markers** — the category icon and color are used to style each place's marker pin.
- **Map tooltips** — hovering a marker shows the category name and icon.

> **Admin:** Create and manage categories in [Admin-Categories](Admin-Categories). Only admins can create, edit, or delete categories. All users can read them.

## Personal Tags

Tags are personal labels owned by each user. They attach to individual places via a many-to-many relationship (`place_tags` table), so the same tag can be applied to as many places as you like, and a single place can carry multiple tags.

**Fields per tag:**

- **Name** — free-form text.
- **Color** — hex value displayed alongside the tag name. Default: `#10b981` (emerald).

Tags are owned by their creator, but only the *list* is private. `GET /api/tags` and the `list_tags` MCP tool return only your own tags, and tag names carry no uniqueness constraint, so different users — or even the same user — can create tags with identical names without conflict.

A tag you attach to a place is **not** private. It becomes part of that place: the place read-back joins `place_tags` → `tags` with no owner filter, so every trip member gets it from `GET /api/trips/:id/places`, the day and assignment endpoints, and the MCP `list_places` tool and `trek://trips/{tripId}/places` resource — gated by trip access alone. The `?tag=` filter on the places list is likewise not user-scoped, so a member can filter by a co-traveller's tag ID. This is deliberate: a tag is kept as long as its owner is on the trip roster, so a co-traveller's tag is not silently stripped when another member re-saves the place. A tag owned by someone outside the trip is dropped instead.

If a trip has a public share link with the map/itinerary section enabled, the tags of places **scheduled on a day** also reach anonymous viewers — trimmed to the tag's ID, name and color, so the owner's user ID never leaves the server. Unscheduled places in the shared place pool carry no tags.

In practice these tags surface through the API and MCP rather than in the app — no view renders a place's tags yet. Deleting a tag automatically removes it from every place it was attached to.

### Where to manage them

At the moment tags are exposed primarily through the MCP API — AI assistants connected to your instance can list, create, update, and delete tags (`list_tags`, `create_tag`, `update_tag`, `delete_tag`) and attach them to places through the place endpoints. A dedicated web UI for tag management is not yet available; the filter `tag` parameter on the places API and on the MCP `list_places` tool does support filtering places by a tag ID once one exists (the `trek://trips/{tripId}/places` MCP resource only filters by `assignment`).

> **AI / MCP:** See [MCP-Tools-and-Resources](MCP-Tools-and-Resources) for the full tag tool list.

## When to use which

| Use case | Use |
|---|---|
| Classifying a place by type (Restaurant, Museum, Hiking Trail…) | **Category** |
| Personal labels you want to apply to specific places | **Tag** |

## See also

- [Places-and-Search](Places-and-Search)
- [Admin-Categories](Admin-Categories)
- [MCP-Overview](MCP-Overview)
