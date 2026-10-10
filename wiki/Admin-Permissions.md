# Admin: Permissions

The **Permission Settings** card, at the bottom of the **Users** tab, controls which role level is required to perform each action. Saved changes apply immediately across the entire instance.

![Permissions panel](assets/PermissionSettings.png)

## Role model

TREK uses four permission levels, ordered from most to least privileged. The dropdowns show them by the label in brackets:

| Level | Label | Who it includes |
|-------|-------|----------------|
| `admin` | **Admin only** | Instance administrators only |
| `trip_owner` | **Trip owner** | The user who created the trip |
| `trip_member` | **Trip members** | Any user who is a member of the trip |
| `everybody` | **Everyone** | Any authenticated user (for `trip_create`: no trip context required; for all other actions: any authenticated user with trip access) |

Each action is assigned a minimum required level. A user whose role is at or above that level can perform the action. Not every level is available for every action: each action offers only the levels that make sense for it. For example, `trip_create` only allows **Everyone** or **Admin only**, while `trip_edit` only allows **Trip owner** or **Trip members**.

## Action categories

Actions are grouped into five sections. Each row shows the action's name, a hint below it and the dropdown.

### Trip Management

| Action key | Row label | What it controls | Default | Choices |
|------------|-----------|-----------------|---------|---------|
| `trip_create` | **Create trips** | Create a new trip | Everyone | Admin only, Everyone |
| `trip_edit` | **Edit trip details** | Edit trip name, dates, description, and currency | Trip owner | Trip owner, Trip members |
| `trip_delete` | **Delete trips** | Permanently delete a trip | Trip owner | Admin only, Trip owner |
| `trip_archive` | **Archive / unarchive trips** | Archive or unarchive a trip | Trip owner | Trip owner, Trip members |
| `trip_cover_upload` | **Upload cover image** | Upload or change the cover image for a trip | Trip owner | Trip owner, Trip members |

### Member Management

| Action key | Row label | What it controls | Default | Choices |
|------------|-----------|-----------------|---------|---------|
| `member_manage` | **Add / remove members** | Invite or remove trip members | Trip owner | Admin only, Trip owner, Trip members |

### Files

| Action key | Row label | What it controls | Default | Choices |
|------------|-----------|-----------------|---------|---------|
| `file_upload` | **Upload files** | Upload files to a trip | Trip members | Admin only, Trip owner, Trip members |
| `file_edit` | **Edit file metadata** | Edit file descriptions and links | Trip members | Trip owner, Trip members |
| `file_delete` | **Delete files** | Move files to trash or permanently delete them | Trip members | Trip owner, Trip members |

### Content & Schedule

| Action key | Row label | What it controls | Default | Choices |
|------------|-----------|-----------------|---------|---------|
| `place_edit` | **Add / edit / delete places** | Add, edit, or delete places | Trip members | Trip owner, Trip members |
| `day_edit` | **Edit days, notes & assignments** | Edit days, day notes, and place assignments | Trip members | Trip owner, Trip members |
| `reservation_edit` | **Manage reservations** | Create, edit, or delete reservations | Trip members | Trip owner, Trip members |

### Budget, Packing & Collaboration

| Action key | Row label | What it controls | Default | Choices |
|------------|-----------|-----------------|---------|---------|
| `budget_edit` | **Manage budget** | Create, edit, or delete expenses in Costs | Trip members | Trip owner, Trip members |
| `packing_edit` | **Manage packing lists** | Manage packing items and bags | Trip members | Trip owner, Trip members |
| `collab_edit` | **Collaboration (notes, polls, chat)** | Create notes, polls, and send messages | Trip members | Trip owner, Trip members |
| `share_manage` | **Manage share links** | Read, create or delete public share links and calendar feed links | Trip owner | Trip owner, Trip members |

## Changing permissions

Each action row has a dropdown. Select the minimum role level required. A **customized** badge appears next to any action that differs from its default.

Click **Save** (top right of the card) to persist your changes; it stays disabled until something has changed. **Reset to defaults** (circular arrow icon) puts every action back to its shipped default in the form without saving: click **Save** afterwards if you want to keep the reset.

## Related pages

- [Admin-Panel-Overview](Admin-Panel-Overview)
- [Admin-Users-and-Invites](Admin-Users-and-Invites)
