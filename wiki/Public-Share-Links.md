# Public Share Links

Share a read-only view of your trip with people who do not have a TREK account. The viewer opens in a browser without logging in.

![Public share link](assets/Share.png)

## Creating a share link

Open your trip and click the **Share** button (Users icon) in the top navbar. This opens the Members & Share modal. The share link section appears on the right side of the modal and is visible only to users with the `share_manage` permission (trip owner and admins by default).

Click **Create link** to generate a token.

The share URL takes the form:

```
<your-instance>/shared/<token>
```

Copy this URL and send it to anyone you want to share the trip with. No TREK account is required to view it.

### How long a link lives

A share link is valid for **90 days**, counted from the last time it was saved. Creating the link writes a 90-day expiry, and flipping one of the unlocked permission toggles re-saves the link and writes a new one, so a link you actively manage never lapses under you.

Once the 90 days are up, visitors get **Link expired or invalid**. The share section in the Members & Share modal does not show this — it keeps displaying the URL and the **Delete link** button, because the owner-side lookup ignores the expiry. There is no expired badge to warn you.

To revive a lapsed link, flip one of the unlocked toggles — **Bookings**, **Packing**, **Costs** or **Chat** — and flip it back if you did not mean to change anything. **Map & Plan** is locked, so clicking it sends no request and will not revive the link. Flipping an unlocked toggle re-saves the **same** token for another 90 days and the old URL starts working again. If you want a genuinely different URL, because the old one leaked for instance, use **Delete link** and then **Create link**.

Links created before TREK added the expiry carry no expiry at all and work indefinitely. The first time you change one of their toggles, that save puts them on the 90-day clock like every other link.

## Permission toggles

When creating or updating a share link you choose what the recipient can see. The available flags are:

| Toggle | Default | What it shows |
|--------|---------|---------------|
| **Map & Plan** (`share_map`) | Always on | The Plan tab with the interactive map and day-by-day itinerary. This toggle is locked on and cannot be disabled from the UI; a link whose flag was turned off outside the UI has no Plan tab, and the server withholds its days, places and notes entirely. |
| **Bookings** (`share_bookings`) | **On** | The Bookings tab with reservations and transport. Also controls whether transport items appear inline in the day plan. |
| **Packing** (`share_packing`) | Off | The packing list tab, grouped by category |
| **Costs** (`share_budget`) | Off | The Costs tab with a total summary and line items grouped by category |
| **Chat** (`share_collab`) | Off | A read-only Chat tab showing messages in chronological order |

Disabled toggles hide the corresponding tab from the public viewer entirely. Permission changes take effect immediately — you do not need to recreate the link.

### Which currency guests see

A public viewer has no account, so there is no "their" display currency to use. The Costs tab is rendered in **the sharer's display currency, falling back to the trip's own currency** — in other words, a guest sees the money the way the person who shared the trip sees it. If the sharer leaves their display currency on **Trip currency** (the default), guests read the trip in the trip's own currency. See [Currencies](Currencies).

## What the public viewer shows

The shared trip page renders a branded read-only interface with a dark hero header showing the trip title, description, and date range. A tab bar at the top provides access to the sections you enabled. The viewer can switch the display language using a language picker in the top-right corner.

The Plan tab appears whenever **Map & Plan** is on — which is every link created through the share UI, since that toggle is locked on there. A link whose `share_map` flag was turned off outside the UI (through the REST API or the `create_share_link` MCP tool, both of which take it as a plain boolean) has no Plan tab at all: the server withholds the days, places, assignments and notes entirely, and the viewer opens on the first section the owner did share. A **day picker** sits directly above the map — an **All** pill plus one pill per day (**Day 1**, **Day 2**, …) — and drives the same selection as the day cards below it, so the map and the expanded day never disagree. Pick a day and its stops are numbered on the map in visiting order (a place the day returns to shows both positions on one marker, e.g. `1 · 3`) and joined by a dashed connector. That connector is a straight line showing sequence, not a driving route: TREK will not send a shared itinerary to a third-party routing service on an anonymous visitor's behalf. On **All** the map shows every geocoded place as an unnumbered pin with no connector. Below the map sits a collapsible day-by-day itinerary (with places, notes, and transport inline when Bookings is enabled) and accommodation badges per day.

The Chat tab (when enabled via `share_collab`) shows chat messages grouped by date with sender avatars. Viewers cannot send messages.

## Revoking a share link

Open the Share button in the navbar, then click **Delete link** in the share link section. The existing URL stops working immediately for anyone who has it.

## Journey public share

The Travel Journal (Journey addon) has a separate share mechanism with its own token namespace and permission flags (timeline, gallery, map). See [Journey-Journal](Journey-Journal) for details.

## Related pages

[Trip-Members-and-Sharing](Trip-Members-and-Sharing) · [Currencies](Currencies) · [Journey-Journal](Journey-Journal) · [Real-Time-Collaboration](Real-Time-Collaboration)
