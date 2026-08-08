# Freeze exchange rates with layered defaults

TREK resolves a new expense or settlement payment from an explicit manual value, then a trip exchange rate, then the durable global exchange-rate snapshot, and copies the result onto that item as its frozen exchange rate. This keeps original amounts intact and prevents later provider or trip-default changes from moving settled balances, at the cost of storing rate provenance and making recalculation an explicit, previewed operation rather than an automatic cascade.

## Consequences

Same-currency items are fixed at 1:1. Existing frozen items change only when their currency changes or a user selects them in a version-checked batch preview; manual rates are never selected automatically. Display-currency conversion happens after balances are netted in the trip currency and may use the current global snapshot.
