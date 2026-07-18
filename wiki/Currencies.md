# Currencies

TREK has **three** currency settings, and they answer three different questions. Most confusion about the Costs tab comes from mixing them up, so this page is the one place they are defined together.

| Setting | Where | Question it answers | Affects |
|---|---|---|---|
| **Trip currency** | Trip → Edit trip | *What is this trip's money?* | Stored data — the base every balance is calculated in |
| **Expense currency** | Costs → expense modal | *What currency did I actually pay in?* | Stored data — that one expense |
| **Display currency** | Settings → General | *What currency do I want to read?* | Presentation only — never the stored data |

The short version: **the trip currency is the accounting base, the expense currency is the receipt, and the display currency is your reading glasses.**

## Trip currency

Every trip has exactly one currency. It is set when you create the trip and can be changed later in the trip edit dialog (requires the `trip_edit` permission). It defaults to **EUR**.

This is the trip's **accounting base**. It is not a cosmetic label:

- Every balance, debt and settle-up suggestion is calculated in it.
- Every expense in another currency is converted **into it** and stored with the rate it was converted at.
- It is what the Costs tab falls back to when nobody has expressed a display preference.

Pick the currency of the place you are travelling to (or the one you will actually settle up in), and you will rarely think about currencies again.

### Changing the trip currency

Changing it is **not** a relabelling — it is a re-basing, and TREK does the work for you so that no money moves:

- Expenses that had no currency of their own (they simply inherited the trip's) are **pinned to the old currency** first. A 9 000 ₽ expense on a trip switching from RUB to EUR stays *9 000 ₽*; it does not silently become 9 000 €.
- Every frozen exchange rate is **re-anchored** to the new base, because a frozen rate is stored relative to the trip currency (see below).
- **Place prices** are pinned the same way. A place price also inherits the trip's currency unless you gave it one of its own, so a €15 museum on a trip switching to JPY is stamped EUR rather than starting to read as ¥15.

The numbers you typed are never rewritten. Each expense keeps its original amount, in its original currency, and its real-world value survives the switch — only the base the balances are expressed in changes.

## Expense currency

Each expense in the Costs tab carries **its own currency**, chosen in the expense modal. Enter what the receipt says: a $100 dinner on a rouble trip is entered as **100 USD**, not as its rouble equivalent.

When an expense's currency differs from the trip currency, TREK looks up the live rate **once, at the moment you save it**, and freezes it on the expense. That frozen rate is what converts the expense into the trip currency forever after.

> **Why freeze it?** Because a debt settled today shouldn't reopen tomorrow. If balances were recomputed at live rates, a settled-up trip would drift back into a few cents of debt every time the FX market moved. The rate you booked at is the rate you owe at.

Rates come from [Frankfurter](https://frankfurter.dev) (European Central Bank data, no API key needed). **165 currencies** are supported. If the rate lookup fails (the instance is offline, or the upstream is down), the expense is stored without a frozen rate and falls back to live conversion when it is next read — TREK never invents a rate.

### Settle-up payments

A payment recorded in **Settle Up** also carries its own currency, for the same reason: settling a rouble debt with a euro transfer is perfectly normal. Its rate is frozen at the moment you record it, exactly like an expense's, so the payment keeps cancelling the debt it was meant to cancel.

## Display currency

**Settings → General → Currency** is a **per-user, presentation-only** preference. It converts what you *read* in the Costs tab — totals, the category chart, balances, the settle-up amounts — into a single currency, so a trip with dollars, yen and roubles in it still adds up to one number you understand.

It never changes what is stored. Two people looking at the same trip can read it in different currencies and both see correct, consistent balances.

It has two modes:

| Value | Behaviour |
|---|---|
| **Trip currency** (the default) | Each trip is shown in **its own** currency. A Tokyo trip reads in yen, a Moscow trip in roubles. |
| A specific currency (e.g. `USD`) | **Every** trip is converted into that currency for you, whatever its own currency is. |

Leave it on **Trip currency** unless you specifically want everything in your home currency regardless of where you are going. An administrator can set an instance-wide default for new users (Admin → Default User Settings); choosing **Trip currency** yourself overrides it, because it is a deliberate choice rather than an absence of one.

> Display conversion uses **live** rates, not the frozen ones — it is a view, and a view should reflect today. This is why a converted total can shift slightly day to day while the underlying balances stay rock steady.

## How they fit together

An expense flows through all three:

```
    100 USD                  ≈ 7 668 ₽                    ≈ 87 €
  ┌───────────┐   frozen   ┌───────────────┐    live    ┌───────────────┐
  │  expense  │ ─────────► │     trip      │ ─────────► │    display    │
  │ currency  │    rate    │   currency    │    rate    │   currency    │
  └───────────┘  (at entry)└───────────────┘  (at read) └───────────────┘
     what you              what the trip is             what you read,
     actually paid         settled in  ← balances       if you asked for
                                          live here     a display currency
```

Balances are always netted in the **trip currency** and converted to your display currency **once, at the end** — never per-expense. That ordering is deliberate: netting in a moving display currency would let rounding drift shuffle a settled trip into phantom one-cent debts.

## The public share link

A public share page has no logged-in viewer, so it cannot use "your" display currency. It uses **the sharer's display currency, falling back to the trip's own currency** — i.e. a guest sees the trip the way the person who shared it sees it. If the sharer left their display currency on **Trip currency**, guests read the trip in the trip's currency.

## Relationship with the Costs addon

The **trip currency lives on the trip itself**, not in the Costs addon — it is set in the trip dialog and remains set even if Costs is disabled. Expense currencies, frozen rates and settle-up all belong to **Costs** (addon id `budget`), which an admin can toggle in [Admin-Addons](Admin-Addons). Turning Costs off hides the money features; it does not clear the trip's currency.

Changing the trip currency requires `trip_edit`. Adding or editing expenses (and their currencies) requires `budget_edit`. See [Admin-Permissions](Admin-Permissions).

## Troubleshooting

**"My balances are huge / nonsense on a trip with a foreign expense."**
Fixed in v3.4.0 (#1543). The settlement was reading the trip currency incorrectly and treating every trip as EUR, which inflated balances on any non-EUR trip that had a foreign-currency expense. Upgrade; no data was damaged and nothing needs fixing by hand.

**"The totals move slightly from day to day."**
Expected, if your display currency differs from the trip currency: the *display* conversion uses live rates. The underlying balances and debts do not move.

**"An expense shows an odd converted value."**
Its rate was frozen when it was entered, and the market has moved since. That is by design — see the note above.

## See also

- [Budget-Tracking](Budget-Tracking) — the Costs tab
- [Creating-a-Trip](Creating-a-Trip) — where the trip currency is set
- [Display-Settings](Display-Settings) — where the display currency is set
- [Public-Share-Links](Public-Share-Links)
- [Admin-Addons](Admin-Addons)
