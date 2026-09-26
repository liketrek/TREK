# Todos and Tasks

Manage a to-do list for trip tasks and pre-departure preparation.

![Todos and Tasks](assets/Todos.png)

## Where to find it

Open the **Lists** tab inside the trip planner and select **Todo**. The Todo feature shares the Lists addon with Packing Lists, so it is only visible when that addon is enabled.

> **Admin:** Enable the Lists/Packing addon in [Admin-Addons](Admin-Addons).

## Layout

The panel is divided into two columns by default:

- **Left sidebar**: a progress card (done of all, as a count, a percentage and a bar), the smart filters, one row per list, and **Add list**, which asks for the name in a dialog.
- **Task list**: a card whose head names the active filter with its count and holds the sort, **Priority** or **Due date**. Each row is a checkbox, the name, the description, the priority, due date and list as small badges, and the assignee as an avatar with the name as its tooltip.

When you click a task, a **detail pane** opens as a third column on the right side of the task list (on desktop) or slides up as a bottom sheet (on mobile). Its head carries a checkbox that ticks the task off, and **Delete** and **Save changes** stay in sight at its foot while the fields scroll. The new-task form opens as a modal overlay with the same fields; the **+** beside the List field names a new list in a dialog.

On small screens the sidebar collapses to a narrow icon rail showing only colored dots and icons with badge counts.

## Task fields

Each task has the following fields:

| Field | Notes |
|---|---|
| Name | Required. |
| Checked | Boolean — marks the task done. |
| List | Optional grouping label. The sidebar heading is **Lists**, the button reads **Add list**, and a task without one shows **No list**. |
| Due date | Optional date. |
| Description | Optional free-text body. |
| Assignee | Optional trip member. |
| Priority | 0 (none), 1 (P1), 2 (P2), or 3 (P3). |

Click a task row to open the detail pane on the right (or a modal sheet on mobile) where you can edit all fields.

## Priority levels

| Level | Label | Color |
|---|---|---|
| 1 | P1 | Red (`#ef4444`) |
| 2 | P2 | Amber (`#f59e0b`) |
| 3 | P3 | Blue (`#3b82f6`) |

Tasks with no priority set show no badge.

## Sidebar filters

| Filter | Shows |
|---|---|
| **All** | All unchecked tasks. |
| **My tasks** | Unchecked tasks assigned to you. |
| **Overdue** | Unchecked tasks with a past due date. |
| **Done** | Checked tasks. |
| Per-list rows | All tasks in that specific list (checked and unchecked). |

## Sorting

The sort sits in the head of the task list. **Priority** orders the tasks from P1 to P2 to P3 (tasks with no priority appear last), **Due date** puts the nearest deadline first. Only one of the two is on at a time; a second click on the active one goes back to your own order, which you can then change by dragging the rows.

## Adding tasks

Click the **+ Add new task** button in the top-right corner of the Lists panel header (visible when the **To-Do** sub-tab is active). A new-task form opens as a modal where you can set all fields before saving. On mobile it slides up from the bottom of the screen.

## Permissions

All write operations require the `packing_edit` permission (shared with Packing Lists).

## See also

- [Packing-Lists](Packing-Lists)
- [Admin-Addons](Admin-Addons)
- [Trip-Planner-Overview](Trip-Planner-Overview)
