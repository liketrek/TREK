# Budget Tracking

Track trip expenses by category, split costs between members, and visualize spending.

> **Renamed to Costs (v3.3.0, #1464):** This feature is now called **Costs** everywhere in the UI — the planner tab reads **Costs** and it is listed as **Costs** in Admin → Addons (its internal addon id stays `budget`). Screenshots and some labels on this page may still say "Budget".

<!-- TODO: screenshot: budget summary and expense list -->

![Budget panel](assets/Budget.png)

## Where to find it

Open the **Budget** tab inside the trip planner. The tab is only visible when the Budget addon is enabled.

> **Admin:** Budget is an addon. Enable it in [Admin-Addons](Admin-Addons).

![Create Budget](assets/BudgetCreateBudget.gif)

## Currency

Costs is **multi-currency** (#551). Three settings are involved, and they do different jobs:

- The **trip currency** (Trip → Edit trip) is the trip's accounting base. Every balance and settle-up is calculated in it.
- Each **expense** carries **its own currency** — pick it in the expense modal and enter what the receipt says (a $100 dinner on a rouble trip is `100 USD`). It is converted into the trip currency at a rate **frozen when you save it**, so a settled debt doesn't reopen when the market moves.
- Your **display currency** (Settings → Display) converts what you *read* — totals, chart, balances — into one currency. It changes nothing that is stored. Left on **Trip currency** (the default), each trip is shown in its own currency.

165 currencies are supported, with rates from [Frankfurter](https://frankfurter.dev) (no API key needed). When an item's currency differs from the display currency, the modal shows the converted amount alongside the rate (`1 {from} in {to}`), and the ledger row shows both (`$100.00 → 7 668,71 ₽`).

> **Read [Currencies](Currencies) for the full picture** — how the three interact, what happens when you change a trip's currency, and which currency a public share link is shown in.

## Categories

Expenses are grouped into categories. Each category is shown with a small colored square indicator that cycles through a 12-color palette as you add more categories.

From the toolbar you can:

- **Add a category** — type a name and click the **+** button (or press Enter).
- **Rename a category** — click the pencil icon next to its name in the category header.
- **Reorder categories** — drag the grip handle on the left of the category header.
- **Delete a category** — click the trash icon in the category header. This deletes all expense items inside it.

## Expense items

Each category contains a table of items with the following columns:

| Column | Notes |
|---|---|
| Name | Editable inline. Read-only when linked to a reservation. |
| Total | The total cost for this item. |
| Persons | Number of persons (or member chips on multi-member trips). |
| Days | Number of days. |
| Per Person | Calculated: Total ÷ Persons. |
| Per Day | Calculated: Total ÷ Days. |
| Per Person/Day | Calculated: Total ÷ (Persons × Days). |
| Date | Optional expense date. |
| Note | Free-text note. |

Click any editable cell to edit it inline. Drag the grip handle to reorder items within a category.

Add a new item using the inline **add row** at the bottom of each category table.

## Splitting costs

The **Persons** column behaves differently depending on the trip:

- **Single-user trip** — enter a number of persons directly.
- **Multi-member trip** — a member chip picker appears. Click the edit button to open the expense modal, where you can select:
  - **Equally** — Splits the cost equally among selected members. Remainder cents (from rounding errors) are distributed deterministically and rotated using the item ID to ensure everyone is charged equally over the course of the trip.
  - **Custom** — Enter specific custom amounts for each traveler. The sum of the custom splits must balance exactly to the total price.
  - **Ticket** — Build an itemized list of expenses (e.g. Apples: $10, cake: $50, Milk: $40) and assign specific trip participants to split each individual item. Individual shares are calculated cent-perfectly, the total expense price is automatically summed, and the list of itemized splits is saved/restored across edits.

Click an assigned member chip again to mark them as **paid** (the chip shows a green ring).

![Add Expense](assets/BudgetAddExpensive.gif)

## Settlement calculator

When multiple members are assigned to expenses and there are outstanding debts between members, a collapsible **Settlement** section appears inside the total card. Click the section header to expand it. It shows the minimum number of transfers needed to settle all debts (using a greedy matching algorithm), including:

- Transfer flows: who pays whom and how much.
- Net balances: each member's overall surplus or deficit.

Balances are always netted in the **trip currency** and converted to your display currency once, at the end — so they stay stable even when the trip mixes currencies.

A recorded payment carries **its own currency** too: settling a rouble debt with a euro transfer is normal, so the payment modal has a currency picker, and its rate is frozen when you record it. A payment made in another currency shows both amounts in the ledger (`$30.00 → 27,00 €`).

![Final Settlement](assets/BudgetFinalSettlement.gif)

## Budget summary

The right-hand column contains two widgets:

- **Total card** — displays the grand total in large type. On multi-member trips it also shows a per-member breakdown with a proportional bar.
- **Donut chart** — spending by category. Each segment uses that category's color. The legend always shows the amount and percentage for each category; hovering a legend row highlights it.

## Exporting

Click **Export CSV** in the toolbar to download all expenses as a spreadsheet (restored in v3.3.0, #1500). The file is semicolon-delimited with a UTF-8 byte-order mark (so Excel opens it cleanly), rows sorted by date, and is named `costs-<trip>.csv`. The columns are: **Date, Name, Category, Amount, Currency, Amount (<display currency>), Note** — each expense shows both its original amount in its own currency and the converted amount in your display currency.

## Permissions

All write operations (adding/editing/deleting items and categories, and an expense's currency) require the `budget_edit` permission. The **trip** currency lives on the trip itself, so changing that requires `trip_edit` instead.

## See also

- [Currencies](Currencies)
- [Admin-Addons](Admin-Addons)
- [Reservations-and-Bookings](Reservations-and-Bookings)
- [Trip-Planner-Overview](Trip-Planner-Overview)
