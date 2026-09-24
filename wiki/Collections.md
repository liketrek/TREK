# Collections

Collections is a personal, server-wide library of saved places that lives outside of any single trip. Keep multiple named lists of places you have discovered — a "Norway road trip" wishlist, "Best coffee in Lisbon", "Someday" — each place carrying an idea / want-to-go / visited status, and share a list with other users.

> **Admin:** enable Collections in [Admin-Addons](Admin-Addons).

![Collections](assets/Collections.png)

## What Collections is

A place you save to a trip only exists inside that trip. Collections is the opposite: a place library that belongs to *you*, independent of any trip, so a spot you find while planning one trip is still there for the next one. Places are copied into and out of trips (never linked), so editing a saved place never changes a trip and vice versa.

## Accessing Collections

When the admin has enabled the addon, a **Collections** entry appears in the main navigation (and a bottom-tab on mobile). Opening it shows your lists on the left, the active list's places in the middle, and a map on the right.

The dashboard also gains a **Collections widget** that surfaces your lists as compact badges. Each user can hide that widget from their own dashboard under **Dashboard widgets** on the Appearance tab (see [Appearance-Settings](Appearance-Settings)) without affecting anyone else.

## Lists

- **Create a list** from the "New list" action in the rail. A list has a name, a colour, an optional cover image (upload your own or search Unsplash), a description and a set of links.
- **Edit or delete a list** from the **Edit** button in the list's hero (owner only). Deleting a list removes its saved places.
- **All saved** is a built-in view that unions the places from every list you own or co-own, so you can search and act across your whole library at once.

![A single collection, "Kyoto shortlist", with its coloured hero, Edit and Share actions, the lists rail on the left and three saved places each marked Idea, next to the map](assets/CollectionDetail.png)

## Place status

Every saved place carries a status you can cycle with one tap:

- **Idea** — something you noted but haven't committed to.
- **Want to go** — on the shortlist.
- **Visited** — been there.

Status is a Collections concept and is not carried into a trip when you copy a place.

### Setting it from a trip

You usually find out you have been somewhere while looking at the trip, not while browsing the library, so the status can be set from there too:

- The **Save to list** dialog on a trip place shows every list that already holds it, each with its own status pill. Tap a pill to cycle that list's status, or use **Visited everywhere** to mark all of them at once.
- The places panel has a **mark visited** action in its selection bar (and in the bulk toolbar on phones). Select the places — *Select all* covers the whole trip — and every saved copy of them is marked visited.

Matching is by the place's provider id, its coordinates, or the link a place saved out of that trip already carries, so a copy you renamed inside a list is still found. Lists shared with you read-only are left alone.

## Categories

Places can be assigned a **category** from the same admin-defined set used across TREK (see [Admin: Categories](Admin-Categories)). Category colours and icons show on the place avatar, the place detail and the list rows, and you can filter a list by category.

## Adding places

- **Search and add** — the "+" action opens a search; pick a result and set the name, category, status, a markdown description and links before saving, all in one step.
- **Save from a trip** — the place inspector and the trip place context menu both offer **Save to collection**, which toggles that place in or out of each of your lists.
- **Bulk-add from a trip** — in the trip place list, enter select mode, tick several places, and use the **Save to collection** action in the selection bar to copy them all into a chosen list at once. Duplicates (by name or coordinates) are skipped automatically.
- **Import a whole trip** — the download button in the list's filter row (and the second button on an empty list) opens **Import from a trip**: pick one of your trips, then tick the places you want. Places you already saved are greyed out and cannot be picked twice, and the ones no day of that trip holds start out selected, since those are the plans a trip left behind. **Only new** hides everything already on the list, and the counter on the import button always shows what is about to be added.

## Place detail

Clicking a saved place opens a detail sheet showing a cover photo (fetched automatically when the place has none of its own), its category, its [labels](#custom-labels), a live status control, a markdown description, and links. Editing the place also lets you assign its labels. From there you can edit the place, **copy it into a trip**, or remove it from the list.

To set your own cover instead of the auto-fetched one, use the camera button on the detail sheet's cover to upload an image (JPG, PNG, GIF or WebP, up to 20 MB); the remove button next to it clears the custom image and restores the automatic default.

## Filtering and bulk actions

Above the places sit compact filters — by **status**, by **category**, and by [**label**](#custom-labels) — plus a **Select** toggle. In select mode you can:

- **Select all** the currently filtered places.
- **Assign label** — add one or more of the list's labels to every selected place at once.
- **Copy to trip** — copies the selected places into any of your trips (carrying their name, description, category, notes, price, coordinates, photo and tags).
- **Move** or **Duplicate** the selection into another of your lists.
- **Delete** the selection.

## Custom labels

Each list can define its own **labels** — for example *Berlin*, *Hamburg* and *Ostsee* inside a "Germany 2026" list — to group its saved places beyond the shared category set. Labels belong to the one list they're created in and are shared with everyone on it.

- **Manage** — a label manager (reachable from the filter bar) lets you create, rename, recolour and delete labels.
- **Assign** — set a place's labels from its detail sheet, or add labels to many places at once with **Assign label** in the selection bar.
- **Filter** — pick one or more labels in the filter bar to narrow **both the place list and the map** to places carrying any of them.

Managing and assigning labels needs edit rights (Editor or Admin); **filtering by label is available to every member, including Viewers**. Moving a place to another list drops its labels, since labels belong to the source list.

## Sharing a list (fusion)

Lists are private by default. The owner can **share** a list by inviting other users, similar to Vacay fusion. Invited users see the list once they accept, and changes sync live over websocket.

### Member roles

When sharing, the owner assigns each member a permission role, and can change it at any time:

| Role | Can do |
|---|---|
| **Viewer** | View the list, cast their own star rating on its places, copy its places into their own trips, and filter by label — no other changes to the list. |
| **Editor** *(default)* | Add new places and edit existing ones, and manage + assign the list's labels. |
| **Admin** | Everything an editor can, plus delete places. |

The owner always has full control. The owner can also remove a member, and a member can leave a shared list themselves. Permissions are enforced on the server, so a role can only ever do what it is allowed to.

## Sending a list to someone else

Sharing works between people on the same TREK. To give a list to somebody who runs their own, or to keep a copy of your own, export it as a file.

**Export** sits next to Edit and Share in the list header, on desktop, and asks which format you want. Any member of a shared list may export it.

- **TREK list** downloads the open list as a `.trekcollection.json` file: the list's name, description and colour, its labels, and every place with its address, coordinates, notes, status, website, phone, category name and labels. This is the one to give to another TREK.
- **GPX** downloads the places as waypoints in a `.gpx` file, for OsmAnd, Organic Maps, a Garmin, gpx.studio or any other app that reads GPX. Each waypoint carries the place's name, description and address, notes, website and category, which every such app shows. Labels, status, phone and the rest travel alongside in a TREK extension that other apps ignore, so a GPX made by TREK comes back into TREK complete. A place without coordinates cannot be a waypoint: it is left out, and TREK tells you how many were.

**Import** sits next to **New list** in the lists rail, as the button with the upload arrow. Pick a TREK list file or a GPX file and TREK shows what is in it before anything happens: the name, how many places, how many labels. Then choose where the places go, and you land on that list when it is done.

- **New list** is the default: the file becomes a list of your own, under a name you can change right there.
- **Add to a list** puts the places into a list you already have. The list is picked from the ones you may edit, which is your own lists plus a shared one where you are an editor or an admin; the list you have open is preselected.

Adding to a list only ever adds. A place the list already has is left exactly as it is, with its status, notes, rating and labels, and counted as already there when the import reports what it did. TREK recognises it the same way it does when you save a single place: by the provider it came from, then by name. Position only counts for a place without a name, which a file never carries, so a place that was renamed since the export is added a second time unless a provider id still identifies it. The list keeps its own name, colour, icon and description, whatever the file says about the list it came from; a label the file brings that the list does not have is created, and one it already has keeps its name and colour.

From a GPX, every waypoint becomes a place, and so does a route point somebody named. A track is a line rather than a place, so it is not imported, and the preview says how many track points were left behind. A waypoint's type (OsmAnd files its favourites into groups this way) becomes the place's category when your palette has one of that name. A waypoint without a name is called "Waypoint" and its number in the file; one without usable coordinates is skipped and counted.

A few things deliberately stay behind, because they belong to the instance the file came from rather than to the list:

- **Star ratings and members.** A rating is an opinion somebody gave the people on that list.
- **Uploaded photos and cover images.** They live on the sender's server; a place keeps an image only when it is an ordinary `https://` address.
- **Ids of any kind**, including which trip a place was originally saved from. The receiving instance issues its own; a category comes across by name and is matched against the palette on the other side, or left empty when there is no match.

A file that is neither a TREK list nor a GPX is refused with a reason. A single place inside a file that cannot be read is skipped and reported, so one bad line does not cost you the rest of the list.

## See also

- [Addons-Overview](Addons-Overview)
- [Admin-Addons](Admin-Addons)
- [Admin: Categories](Admin-Categories)
- [Dashboard Widgets](Dashboard-Widgets)
