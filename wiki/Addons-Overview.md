# Addons Overview

Addons are optional features that an admin can enable or disable for the entire TREK instance. When an addon is disabled, its navigation tabs, menu items, and API routes are hidden from all users.

![Addon overview](assets/Addons-Overview.png)

## What addons are

Each addon extends TREK with functionality beyond the core trip-planning features. Addons are managed globally: you cannot enable an addon for one user only. Once enabled, the feature becomes available to all users on the instance.

## Addon list

The following addons are registered in the system (defined in `server/src/db/seeds.ts`; the TypeScript constant `ADDON_IDS` in `server/src/addons.ts` covers all addons except `naver_list_import`):

| Addon ID | Type | Description |
|---|---|---|
| `mcp` | integration | Exposes TREK data and actions through the Model Context Protocol for AI assistant integrations. |
| `packing` | trip | **Lists**: packing lists and to-do tasks for your trips. See [Packing-Lists](Packing-Lists). |
| `budget` | trip | **Costs**: track and split trip expenses. See [Budget-Tracking](Budget-Tracking). |
| `documents` | trip | Document and file attachments for trips: itineraries, visa copies and other files. Can be kept in step with a self-hosted document store (Paperless-ngx, Papra, Nextcloud, OpenCloud, Synology). See [Documents-and-Files](Documents-and-Files) and [Document-Sync](Document-Sync). |
| `vacay` | global | Personal vacation day planner with a year calendar, holiday packs, collaborator fusion, and read-only calendar sharing. See [Vacay](Vacay). |
| `atlas` | global | Interactive world map showing countries and regions you have visited, plus a bucket list. See [Atlas](Atlas). |
| `collab` | trip | Notes, polls, and live chat for trip collaboration. See [Real-Time-Collaboration](Real-Time-Collaboration). |
| `roadtrip` | trip | **Road trip**: plans a trip as one continuous drive, with stops along the route, driving times and arrival times that update themselves. Off by default. See [Road-Trip](Road-Trip). |
| `journey` | global | Trip tracking and travel journal: check-ins, photos, and daily stories. See [Journey-Journal](Journey-Journal). |
| `collections` | global | A personal, server-wide library of saved places in named lists, with idea/want/visited status, categories, and fusion sharing with per-member roles. See [Collections](Collections). |
| `airtrail` | integration | Sync flights from your self-hosted AirTrail instance into trips. |
| `dawarich` | integration | Read the stays and recorded routes of each user's own Dawarich instance, offered as suggestions to confirm. Read-only, nothing is written back. See [Dawarich](Dawarich). |
| `llm_parsing` | integration | **AI Parsing**: an LLM fallback that extracts bookings from confirmation files KDE Itinerary can't read. See [AI-Booking-Import](AI-Booking-Import). |
| `naver_list_import` | integration | Import places from shared Naver Maps lists directly into a trip. |


## Enabling addons

> **Admin:** all addons are toggled from the admin panel. Navigate to [Admin-Addons](Admin-Addons) to enable or disable individual addons for your instance.

## Per-addon sub-features

Some addons expose sub-features that an admin can independently toggle. The [Real-Time-Collaboration](Real-Time-Collaboration) addon, for example, lets an admin decide which of its five sub-features (chat, notes, links, polls, and what's next) are active across the instance. These are configured from the [Admin-Addons](Admin-Addons) panel alongside the addon's main toggle.

The **Documents** addon carries one switch per document store: Paperless-ngx, Papra, Nextcloud, OpenCloud and Synology Drive. They are off by default and only show while Documents is on, and switching Documents off switches all of them off. The stores themselves are connected per trip, in the trip's file manager. See [Document-Sync](Document-Sync).
