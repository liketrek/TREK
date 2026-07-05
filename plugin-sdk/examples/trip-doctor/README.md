# Trip Doctor

> A hooks-only example plugin that enriches TREK's own planner — no UI of its own.

Trip Doctor is the companion example for the **provider hooks** and **entity
metadata** added in #1429. It shows how a plugin can contribute *data* that TREK
renders natively, instead of shipping its own iframe widget.

## What it does

- **Warnings** — scans the open trip and flags places with no map location, plus a
  tip when the trip has no bookings yet. These appear as a non-blocking banner at
  the top of the trip planner (via the `warningProvider` hook).
- **Place notes** — pin a private note on any place; it shows up as a "Note" row at
  the foot of the place-detail panel (via the `placeDetailProvider` hook). Notes are
  stored in the plugin's own per-plugin metadata (`ctx.meta`), not in a schema fork.
- **`POST /pin`** `{ placeId, note }` — set or clear a place's note. Call it from a
  companion widget, a keyboard shortcut, or `curl`.

## Permissions

| Permission | Why |
|---|---|
| `db:read:trips` | Read the trip's places + reservations to find gaps. Membership-checked by the host — the plugin only ever sees a trip the current user can access. |
| `db:meta` | Store/read the plugin's own note on a place. Isolated to this plugin; writes require the user's `place_edit` permission. |
| `hook:trip-warning-provider` | Contribute the validation warnings shown in the planner. |
| `hook:place-detail-provider` | Contribute the "Note" row shown on a place. |

No network access. Every read and write is bound by the host to the person viewing
the planner — Trip Doctor never passes a user id, and a hook that errors or runs
long is dropped without affecting the planner.

## Run it

```bash
npx @trek/plugin-sdk dev      # hot-reload against a local TREK
npx @trek/plugin-sdk pack     # build a signed .trekplugin bundle
```

See the [Plugin Cookbook](https://github.com/mauriceboe/TREK/wiki/Plugin-Cookbook)
for the individual recipes this example is built from.
