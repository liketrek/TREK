# Real-Time Collaboration

TREK keeps every trip in sync across all connected members without requiring a page refresh. A dedicated **Collab addon** adds a second layer on top of that sync: group chat, shared notes, shared links, polls, and a "What's Next" widget showing upcoming assigned places.

![The Collab tab: chat, shared notes, links, polls and the What's Next widget side by side](assets/Collab.png)

## Real-time sync

All changes to a trip (places, day plans, reservations, budget entries and packing lists) are broadcast instantly to every connected member via WebSocket. You see other people's edits as they happen.

## WebSocket transport

| Parameter | Value |
|-----------|-------|
| Path | `/ws` |
| Scope | One room per trip |
| Rate limit | 30 messages per 10-second window, plus a looser ceiling of 200 frames per 10 seconds that every frame counts against before it is parsed. Live cursor frames (`book:cursor`) are exempt from the tighter limit, not from the looser one |
| Max payload | 64 KB per message |
| Heartbeat | Ping every 30 seconds; sockets that miss a pong are terminated |
| Origin check | Only enforced when `ALLOWED_ORIGINS` is set: an upgrade whose `Origin` header is not an exact match for a list entry is refused with HTTP **403** during the handshake. An upgrade that sends no `Origin` header at all is always admitted |

**Authentication** uses a short-lived ephemeral token passed as a query parameter on connect. If authentication fails, the server closes the connection with one of these codes:

- **4001**: missing, invalid, or expired token; user not found
- **4403**: site-wide MFA is required but the account does not have MFA enabled

An origin rejection happens before the socket exists, so it produces no close code at all: the browser just reports a failed connection. And because clients that send no `Origin` header are exempt, curl and other CLI clients keep connecting while every browser fails, which makes it look like a client bug. If real-time sync stops working behind a reverse proxy, check that `ALLOWED_ORIGINS` lists the exact scheme, host, and port the browser uses: the comparison is a plain string match, so `https://trek.example.com` matches neither `http://trek.example.com` nor `https://trek.example.com:443`. See [Environment-Variables](Environment-Variables) and [Reverse-Proxy](Reverse-Proxy).

## The Collab addon

The Collab addon (`collab`) must be enabled by an admin before the panel is visible inside a trip. Once enabled, it provides five sub-features that can each be toggled independently:

| Sub-feature | What it provides |
|-------------|-----------------|
| **Chat** | Group chat with reactions, replies, images, and URL previews |
| **Notes** | Categorized, pinnable, markdown-formatted shared notes |
| **Links** | Shared web addresses with a title, editable and pinnable, synced live between members |
| **Polls** | Single- or multiple-choice votes with optional deadlines |
| **What's Next** | Upcoming assigned places across all trip days |

> **Admin:** enable the Collab addon and individual sub-features in [Admin-Addons](Admin-Addons). Links is on by default, like the other four.

On a **desktop** (1024 px and wider) each sub-feature is a card with a head band that carries its name, its count and its actions. Chat is a fixed 380 px column on the left when other sub-features are also enabled; if only Chat is on, it fills the full width. Notes, Links, Polls and What's Next share the space on the right; with three or more of them, Notes and Links form the upper row and Polls and What's Next the lower one. On a narrower window a tab bar at the top switches between the enabled sub-features one at a time, and the phone app has its own Collab tab. Disabled sub-features are hidden.

### Links

The **Links** panel collects the web addresses a trip runs on: the booking portal, the shared photo album, the restaurant's menu. **Add link** in its head band opens a small dialog for a **Link title** and an `http(s)` address; anything else is refused. Each link is a chip with the site's favicon, the title and the host (a long title wraps onto further lines rather than being cut off), two to a row where the panel is wide enough and one to a row where it is narrow; a pinned chip is drawn in the accent tint. The whole chip is the link and opens the address in a new tab. Members with `collab_edit` find three buttons in the chip's tail, faint until the pointer is on the chip and always shown on touch: **Edit link** opens the same dialog with the title and the address filled in, **Pin link** moves it to the top of the list, and **Delete link** asks first, because the link goes for every member. Pinned links come first, then the newest. Adding, editing, pinning and deleting show up for every connected member at once.

## Conflict handling

TREK uses a **last-write-wins** model. Each mutation is applied on the server and the resulting canonical state is broadcast to all connected clients. If two members edit the same field at the same time, the change that reaches the server last is the one that sticks; all clients converge to that server-authoritative state.

On reconnect, any locally queued mutations are flushed to the server before the client re-fetches trip data, so offline changes are applied before the latest state is read back.

There is no operational-transform or CRDT merge: simultaneous edits to the same field are not merged; one silently wins.

## Access control

All Collab reads require trip membership. Writing (sending messages, creating notes, adding or editing links, creating polls, voting) requires the `collab_edit` permission. Members without `collab_edit` can read but cannot post or interact.

## Related pages

[Collab-Chat](Collab-Chat) · [Collab-Notes](Collab-Notes) · [Collab-Polls](Collab-Polls) · [Whats-Next-Widget](Whats-Next-Widget) · [Trip-Planner-Overview](Trip-Planner-Overview) · [Admin-Addons](Admin-Addons)
