# Admin: Addons

The **Addons** tab lets you enable or disable optional features for the entire TREK instance. Toggling an addon affects all users immediately: disabling one hides its UI elements and blocks its API routes instance-wide.

![Addon overview](assets/Addons-Overview.png)

## What addons control

Each addon toggle controls a feature set. When you disable an addon, users lose access to that feature everywhere in the app. No data is deleted; re-enabling the addon restores access to existing data.

## Addon categories

Addons are grouped into three categories, shown as labeled sections.

### Trip addons

Trip addons add per-trip feature panels. They appear in every trip where the addon is enabled.

The default trip addons are: **Lists**, **Costs**, **Documents** and **Collab** (all enabled by default), and **Road trip** (disabled by default). The exact list is determined by what is registered in your TREK database.

**Sub-toggles on trip addons:**

- **Lists**: when enabled, a nested **Bag Tracking** toggle appears. Bag Tracking lets users assign packed items to specific bags.
- **Collab**: when enabled, five sub-toggles appear for individual collaboration features:
  - **Chat**: in-trip real-time chat
  - **Notes**: shared trip notes
  - **Links**: shared trip links, on by default
  - **Polls**: trip polls
  - **What's Next**: the "what's next" widget
- **Documents**: when enabled, one row per document store appears underneath: **Paperless-ngx**, **Papra**, **Nextcloud**, **OpenCloud** and **Synology Drive**. All of them are off by default. Switching a store on only lets trip owners offer it; the address and credentials are entered per trip, in the trip's file manager. Switching a store off pauses the trips bound to it without touching them. Switching **Documents** itself off switches every store off, and each has to be switched on again afterwards; a store cannot be switched on while **Documents** is off. See [Document-Sync](Document-Sync).

Each sub-toggle can be disabled independently while the parent addon remains enabled.

**Road trip** plans a trip as one continuous drive: search along the route, driving limits, daily travel times, via points and avoidance of toll roads, motorways and ferries. **Disabled by default.** It needs no key: routing runs on the public OSRM and Valhalla servers until you set your own under **User Defaults** (**Own routing engine**, **Own Valhalla instance**, restart required). See [Road-Trip](Road-Trip).

### Global addons

Global addons add features that are not tied to a single trip. The default global addons are **Vacay**, **Atlas**, **Collections**, and **Journey**.

- **Vacay**: personal vacation day planner with calendar view. Enabled by default.
- **Atlas**: world map of visited countries with travel stats. Enabled by default.
- **Collections**: personal place library that saves places across trips into named lists, copies them into any trip, and shares them. **Disabled by default.** See [Collections](Collections).
- **Journey**: trip tracking and travel journal (check-ins, photos, daily stories). **Disabled by default.**

**Sub-items on global addons:**

- The **Journey** addon shows photo provider toggles underneath it. Each photo provider (e.g., Immich, Synology Photos) can be enabled or disabled independently.

### Integration addons

Integration addons connect TREK to external services. Most of them need additional configuration (API keys, URLs) once enabled, but not in the admin **Settings** tab: each one has its own place.

- The **MCP** addon requires `APP_URL` to be set in your environment. When enabled, the **MCP Access** tab appears in the Admin Panel. **Disabled by default.** See [MCP-Overview](MCP-Overview) for full details.
- The **Naver List Import** addon imports the places of a shared Naver Maps list into a trip. **Enabled by default.** It needs no key.
- The **AirTrail** addon syncs flights from a self-hosted AirTrail instance. **Disabled by default.** The toggle here is the instance-wide switch only; each user connects their own instance (URL + API key) in **Settings → Integrations**.
- The **Dawarich** addon reads the stays and recorded routes of a self-hosted Dawarich instance and offers them as suggestions. **Disabled by default.** The toggle here is the instance-wide switch only; each user connects their own instance (address + API key) in **Settings → Integrations**. A Dawarich on your local network also needs `ALLOW_INTERNAL_NETWORK=true`. See [Dawarich](Dawarich).
- The **AI Parsing** addon is the LLM fallback for booking imports KItinerary cannot read. **Disabled by default.** When enabled, its provider, base URL, API key, and model fields appear inline underneath the addon row. Filling them in sets the instance-wide config for all users; leaving them blank lets each user configure their own provider in **Settings → Integrations**. See [AI-Booking-Import](AI-Booking-Import).

## Enabling or disabling an addon

Click the toggle switch on any addon row. The change is applied immediately; no save button is needed. A brief success toast confirms the update.

If a toggle fails (e.g., network error), it rolls back to its previous state.

## Additional configuration

Some addons require credentials or environment variables before they are functional:

- **Documents**: the document stores need nothing instance-wide beyond their switch. The trip owner enters a store's address and credentials in the trip's file manager. A store on your local network also needs `ALLOW_INTERNAL_NETWORK=true`. See [Document-Sync](Document-Sync) and [Internal-Network-Access](Internal-Network-Access).
- **Journey**: works without any external integration. To embed photos from Immich or Synology Photos, enable the corresponding photo-provider toggle listed under Journey, then configure credentials per-user in **Settings → Integrations**. See [Photo-Providers](Photo-Providers).
- **MCP**: requires `APP_URL` to be set so OAuth redirect URIs resolve correctly.
- **Road trip**: works out of the box on the public routing servers. To use your own OSRM or Valhalla, set **Own routing engine** or **Own Valhalla instance** under **Admin → User Defaults**, then restart the server and reload the page. See [Road-Trip](Road-Trip#routing-engines).

## Related pages

- [Admin-Panel-Overview](Admin-Panel-Overview)
- [Admin-MCP-Tokens](Admin-MCP-Tokens)
- [MCP-Overview](MCP-Overview)
- [Addons-Overview](Addons-Overview)
- [Document-Sync](Document-Sync)
