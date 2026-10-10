# Admin: Packing Templates

The **Packing Templates** card on **Admin > Personalization** lets you create reusable packing list templates that users can apply to any trip.

![Packing Template Manager](assets/PackingTemplate.png)

## What templates are

A packing template is a three-level hierarchy:

```
Template
└── Category
    └── Item
```

When a user applies a template to a trip, all categories and items from that template are copied into the trip's packing list. Each item carries its **weight**, **quantity** and **bag** along: a bag the trip does not have yet is created.

Templates are instance-wide. Besides the ones you build here, the list also shows the templates users saved from a trip's packing list (the Common list plus their own items), and you can rename, edit or delete those as well.

## Template list

The template list shows each template as a collapsible row displaying:

- Template name
- Category count and item count (e.g., `3 categories · 12 items`)
- Rename and delete buttons

Inside an expanded template, an item shows its quantity, weight and bag next to its name when it has them (for example `2× · 300 g · Backpack`). These values come from the trip list the template was saved from; items you add here start with none of them.

## Creating a template

1. Click **New Template** (top right of the card).
2. Type a name and press **Enter** or click the confirm button.
3. The new template is added to the list and automatically expanded.

## Adding categories to a template

With a template expanded, click **Add category** (dashed border button at the bottom of the expanded section). Type a category name and press **Enter** or click confirm.

## Adding items to a category

Click the `+` button inside any category header. An **Item name** field appears below the last item. Type a name and press **Enter** to add it. You can add several items in a row without closing the field: press **Enter** after each one.

## Editing inline

All editing is inline:

- **Rename a template**: click the pencil icon on the template row. The name becomes an input; press **Enter** or click away to save.
- **Rename a category**: click the pencil icon in the category header. Press **Enter** or click away to save.
- **Rename an item**: hover the item row to reveal the pencil icon, then click it. Press **Enter** or click the confirm button to save (clicking away does not save).

## Deleting

- **Delete a template**: click the trash icon on the template row. The template is removed at once, without a confirmation. This does not affect trips that already had items from this template applied.
- **Delete a category**: click the trash icon in the category header. All items in that category are also deleted from the template.
- **Delete an item**: hover the item row to reveal the trash icon.

## Applying templates to a trip

Users apply templates (**Apply template**) and save a list as a new one (**Save as template**) in the trip's **Lists** tab. See [Packing-Templates](Packing-Templates) for user-facing documentation.

## Related pages

- [Packing-Templates](Packing-Templates)
- [Packing-Lists](Packing-Lists)
- [Admin-Panel-Overview](Admin-Panel-Overview)
