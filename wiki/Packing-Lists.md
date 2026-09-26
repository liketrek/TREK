# Packing Lists

Create categorized packing checklists with member assignments and optional bag tracking.

![Packing Lists](assets/PackingList.png)

## Where to find it

Open the **Lists** tab inside the trip planner and select **Packing**. The tab is only visible when the Lists addon is enabled.

> **Admin:** Enable the **Lists** addon (its internal id is `packing`, and it covers both Packing and Todo) and optionally turn on its nested **Bag Tracking** toggle in [Admin-Addons](Admin-Addons).

## Progress bar

A progress bar shows how many items have been checked (packed) out of the total. It is hidden on small screens and visible on larger viewports. When all items are checked, an **All packed!** message replaces the packed/total counter and the bar turns green.

Once something is ticked, a red **Remove N checked** button sits at the right end of the progress card and deletes every ticked item after one confirmation.

## Filters

Three filter buttons let you narrow the item view:

- **All** — every item regardless of checked state.
- **Open** — unchecked items only.
- **Done** — checked items only.

## Categories

Items are grouped into categories. Each category has a colored dot that cycles through a 10-color palette. A new packing list starts empty — nothing is pre-populated, and the panel just reads *Packing list is empty* until you add something. Fill it by adding categories and items by hand, by applying a saved template (see [Templates](#templates)), or by pasting a whole list in at once (see [Importing a list](#importing-a-list)).

The UI labels these groups **lists** rather than categories: the button that creates one reads **Add list**, sits in the Lists bar above the list, and asks for the name in a dialog with the placeholder *List name (e.g. Clothing)*; moving an item between them reads **Move to List**, and the confirm dialog asks about deleting *the list "{name}"*. The REST API and this page still call them categories.

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
- The **name**: click it to rename the item, ticked or not.
- Who brings it, as a small avatar with the full name as its tooltip.
- The **quantity** and, with bag tracking on, the **weight** in grams, as small badges you click to type into.
- With bag tracking on, the **bag** circle, which opens the bag picker. The picker stays open until you click beside it.

At the end of the row sit the **delete** bin and a **⋯** menu holding **Move to List**, **Sharing**, **Rename** and **Delete**. What a row does not use (a quantity of one, an empty weight, no bag, the bin and the menu) stays dimmed until you point at the row or tab into it, so the columns stay in line from row to row.

**Add item** at the bottom of each category opens a field shaped like the next row: Enter adds the item and keeps the field open for the next one, Esc closes it. A whole list comes in at once with **Import** (below).

On phones the row keeps the name and reduces everything else: sharing shows as an icon rather than a sentence, a weight nobody entered prints nothing, and edit/delete sit behind the **⋯** button at the end of the row while the list is in edit mode.

## Importing a list

The **import** button (down arrow) in the Lists header opens a paste box, or use **Load CSV/TXT/MD** to pick a file. One item per line:

```
Category, Name, Weight in g (optional), Bag (optional), checked/unchecked (optional)
```

```
Toiletries, Toothbrush
Clothing, T-Shirts, 200
Documents, Passport, , Carry-on
Electronics, Charger, 50, Suitcase, checked
```

Commas, semicolons and tabs all work as separators, and a quoted value keeps its commas (`"Shirt, blue"`). A line with a single value is treated as just a name. A line without a category lands in **Other**, and a bag name that does not exist yet is created for you. `3x` in front of a name sets the quantity (`3x Socks`). Imported items are appended; nothing already on the list is removed.

A Markdown list is read as well, the way Obsidian, Notion, GitHub and most notes apps write one. Every heading names the category of the items under it, `- [ ]` and `- [x]` become items (the second one already packed), plain bullets and numbered items work too, and a weight in brackets at the end of a line is picked up:

```
## Clothing
- [ ] 3x T-Shirts (200 g)
- [x] Rain jacket
```

Anything that is neither a heading nor a list item, a note or a blank line, is left out.

Import is the only place in the UI that loads weights and bag assignments in bulk — applying a template brings across names and categories only. It requires the `packing_edit` permission.

## Printing and exporting

The **export** button (up arrow) next to the import button takes the list along. It covers the view that is open, **Shared** or **My list**, and is there for everyone who can see the list, not only those who can edit it. On phones the same three entries are in the packing list's **⋯** menu.

- **Print or save as PDF** opens a preview of the list as a page: the trip and its dates in a dark block on top with the number of items, how many are packed, the total weight and the bags, then one card per category with a box to tick for every item, its quantity, weight and bag, and the bags with what each holds at the end. **Print or save as PDF** under the preview opens the browser's print dialog, where **Save as PDF** makes the PDF. The page is laid out for A4, in two columns, and a category never breaks across a column or a page.
- **Markdown checklist (.md)** saves the list as a Markdown checklist: a heading per category and a `- [ ]` or `- [x]` line per item, with its quantity and its weight per piece. It keeps everything but the bags.
- **CSV for import (.csv)** saves the list in exactly the format the import reads, bags included. Kept on your computer, it works as a packing template of your own that needs no admin: import it into the next trip.

Both files come back in through the import unchanged.

## Sharing packing items

Every packing item has a sharing tier that controls who sees it and who is bringing it. By default everything sits in the shared group pool, exactly as before — the tiers are opt-in per item.

### The two views

Two pills at the top of the list switch what you're looking at:

- **Shared** — the group pool: items everyone on the trip can see.
- **My list** — your own items: your personal items, things you've been asked to bring, and things you shared with specific people.

Each pill shows a count of the items in it.

### The three tiers

Open **Sharing** in an item's **⋯** menu to move it between tiers:

- **Shared** — *In the group pool, visible to everyone.* This is where every item starts.
- **Personal** — *Private — only you can see it.*
- **Shared with…** — pick specific trip members below the two tier options. The item then shows only on your list and on theirs. (If you're the only one on the trip, this reads *No one else on this trip yet*.)

New items inherit the view you add them in: adding an item while in **My list** makes it Personal, adding it in **Shared** puts it in the shared group pool. To share an item with specific people, add it first, then open its Sharing control and choose them.

Only the item's owner (the person bringing it) can change its sharing. Someone you shared an item *with* just sees it on their **My list** with a **by {name}** badge and can tick it off — they don't manage who else it's shared with.

### Who's bringing what

Every item in the **Shared** pool shows who is bringing it. For an item someone else added, other members find two actions in the item's **⋯** menu instead of Sharing:

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
- Member avatars assigned to that bag, beside its name, with a dashed **+** to pick them.
- Item count, under the fill bar.

Below the bags, **Unassigned** counts the items that are in no bag and their weight, and **Total weight** at the foot of the card sums everything.

To use bags:

1. Click **+ Bags** in the head of the Bags card, or **Add bag** in an item's bag picker, and type a name. The color dot is assigned automatically from a fixed palette; there is no color picker. A click beside the field closes it again.
2. Assign items to a bag using the bag picker on each item row (visible when bag tracking is enabled).
3. Assign members to a bag with the dashed **+** beside its name; the picker closes on a click beside it.

## Templates

You can save and reuse packing lists across trips:

- **Save as template** (admins only) — click **Save as template** in the Lists bar and name the template in the dialog that opens; it saves the current list's items and categories. It only shows for instance admins, and only when the list has items.
- **Apply Template** — if templates exist, an **Apply Template** dropdown appears in the header. Selecting a template appends its items to the current list without removing existing items.

Templates are managed by admins in [Admin-Packing-Templates](Admin-Packing-Templates).

## Permissions

All write operations require the `packing_edit` permission. Saving a list as a template on top of that requires an instance admin account; applying a template does not.

## See also

- [Packing-Templates](Packing-Templates)
- [Admin-Addons](Admin-Addons)
- [Notifications](Notifications)
- [Trip-Planner-Overview](Trip-Planner-Overview)
