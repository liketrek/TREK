# Packing Lists

Create categorized packing checklists with member assignments and optional bag tracking.

![Packing Lists](assets/PackingList.png)

## Where to find it

Open the **Lists** tab inside the trip planner and select **Packing**. The tab is only visible when the Lists addon is enabled.

> **Admin:** Enable the **Lists** addon (its internal id is `packing`, and it covers both Packing and Todo) and optionally turn on its nested **Bag Tracking** toggle in [Admin-Addons](Admin-Addons).

## Progress bar

A progress bar shows how many items have been checked (packed) out of the total. It is hidden on small screens and visible on larger viewports. When all items are checked, an **All packed!** message replaces the packed/total counter and the bar turns green.

## Filters

Three filter buttons let you narrow the item view:

- **All** — every item regardless of checked state.
- **Open** — unchecked items only.
- **Done** — checked items only.

## Categories

Items are grouped into categories. Each category has a colored dot that cycles through a 10-color palette. A new packing list starts empty — nothing is pre-populated, and the panel just reads *Packing list is empty* until you add something. Fill it by adding categories and items by hand, by applying a saved template (see [Templates](#templates)), or by pasting a whole list in at once (see [Importing a list](#importing-a-list)).

The UI labels these groups **lists** rather than categories: the button that creates one reads **Add list** with the placeholder *List name (e.g. Clothing)*, moving an item between them reads **Move to List**, and the confirm dialog asks about deleting *the list "{name}"*. The REST API and this page still call them categories.

Each category header has a collapse/expand toggle and an overflow menu with these actions:

- **Rename** — rename the category.
- **Check All** — mark every item in the category as packed.
- **Uncheck All** — unmark every item in the category.
- **Delete List** — delete the category and all its items.

**Rename** and **Delete List** need the `packing_edit` permission; **Check All** and **Uncheck All** are always shown.

### Assigning members to a category

Use the people-picker chip row in the category header to assign trip members to that category. Assigned members receive a packing notification. See [Notifications](Notifications) for details.

## Items

Each item row contains:

- A **checkbox** to mark the item packed.
- An editable **name** (click to rename; renaming is disabled while an item is checked).
- A **quantity** field (always visible).
- When bag tracking is enabled: a **weight** field (in grams) and a **bag picker**.

Each row also carries a **category picker** (colored dot), a **rename** button (pencil icon), and a **delete** button. Add new items using the inline "add item" row at the bottom of each category, or bring a whole list in at once with **Import** (below).

On phones the row keeps the name and reduces everything else: sharing shows as an icon rather than a sentence, a weight nobody entered prints nothing, and edit/delete sit behind the **⋯** button at the end of the row while the list is in edit mode.

## Importing a list

**Import** in the Lists header opens a paste box, or use **Load CSV/TXT** to pick a file. One item per line:

```
Category, Name, Weight in g (optional), Bag (optional), checked/unchecked (optional)
```

```
Toiletries, Toothbrush
Clothing, T-Shirts, 200
Documents, Passport, , Carry-on
Electronics, Charger, 50, Suitcase, checked
```

Commas, semicolons and tabs all work as separators, and a quoted value keeps its commas (`"Shirt, blue"`). A line with a single value is treated as just a name. A line without a category lands in **Other**, and a bag name that does not exist yet is created for you. Imported items are appended; nothing already on the list is removed.

Import is the only place in the UI that loads weights and bag assignments in bulk — applying a template brings across names and categories only. It requires the `packing_edit` permission.

## Sharing packing items

Every packing item has a sharing tier that controls who sees it and who is bringing it. By default everything sits in the shared group pool, exactly as before — the tiers are opt-in per item.

### The two views

Two pills at the top of the list switch what you're looking at:

- **Shared** — the group pool: items everyone on the trip can see.
- **My list** — your own items: your personal items, things you've been asked to bring, and things you shared with specific people.

Each pill shows a count of the items in it.

### The three tiers

Open an item's **Sharing** control (the share icon on the row) to move it between tiers:

- **Shared** — *In the group pool, visible to everyone.* This is where every item starts.
- **Personal** — *Private — only you can see it.*
- **Shared with…** — pick specific trip members below the two tier options. The item then shows only on your list and on theirs. (If you're the only one on the trip, this reads *No one else on this trip yet*.)

New items inherit the view you add them in: adding an item while in **My list** makes it Personal, adding it in **Shared** puts it in the shared group pool. To share an item with specific people, add it first, then open its Sharing control and choose them.

Only the item's owner (the person bringing it) can change its sharing. Someone you shared an item *with* just sees it on their **My list** with a **by {name}** badge and can tick it off — they don't manage who else it's shared with.

### Who's bringing what

Every item in the **Shared** pool shows who is bringing it. For an item someone else added, other members see two quick actions instead of the Sharing control:

- **I can bring that too** — pledge to co-bring it. The item's badge then shows a **+1** next to the original bringer. Tap again (*I'm not bringing it*) to withdraw.
- **Copy to my list** — clone the item onto your own personal list as a separate private copy, leaving the shared one untouched.

> Items created before this feature have no assigned bringer, so they show no "brought by" badge until someone edits their sharing.

> **Note:** this per-item sharing is separate from assigning **members to a category** (above). Category assignments only send a packing notification — they don't change who can see an item.

All of this is still gated by the `packing_edit` permission; there is no extra addon or admin toggle.

## Bag tracking

Bag tracking is only available when an admin has enabled it.

> **Admin:** Turn on Bag Tracking in [Admin-Addons](Admin-Addons).

When enabled, a **Bags** panel appears as a right-hand sidebar on wide screens, or as a modal sheet on narrow screens (tap the **Bags** button in the header to open it). Each bag shows:

- Name and color dot.
- Total weight, and a weight limit if you set one. Click **Set limit** next to the weight (or the limit itself, to change it) and type the limit in kilograms — that is how airlines state them, and TREK stores it in grams. Clearing the field removes the limit again.
- A fill bar. With a limit it reads against that limit; without one the bag is scaled against the heaviest bag, so bags stay comparable.
- Member avatars assigned to that bag.
- Item count.

The sidebar also shows an **unassigned** section for items that have no bag, and a **total weight** line summing all items.

To use bags:

1. Click **+ Add bag** and type a name. The color dot is assigned automatically from a fixed palette; there is no color picker.
2. Assign items to a bag using the bag picker on each item row (visible when bag tracking is enabled).
3. Assign members to a bag using the member chip row on the bag card.

## Templates

You can save and reuse packing lists across trips:

- **Save as template** (admins only) — click the **Save as template** button in the header to save the current list's items and categories as a named template. It only shows for instance admins, and only when the list has items.
- **Apply Template** — if templates exist, an **Apply Template** dropdown appears in the header. Selecting a template appends its items to the current list without removing existing items.

Templates are managed by admins in [Admin-Packing-Templates](Admin-Packing-Templates).

## Permissions

All write operations require the `packing_edit` permission. Saving a list as a template on top of that requires an instance admin account; applying a template does not.

## See also

- [Packing-Templates](Packing-Templates)
- [Admin-Addons](Admin-Addons)
- [Notifications](Notifications)
- [Trip-Planner-Overview](Trip-Planner-Overview)
