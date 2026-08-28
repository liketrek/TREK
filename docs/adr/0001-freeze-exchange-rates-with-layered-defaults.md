---
status: accepted
---

# Freeze exchange rates with layered defaults

TREK treats every caller-supplied exchange-rate value as explicit, while omitted foreign rates are resolved by the server from the trip exchange rate and then the durable global snapshot. The resolve API only suggests a value and temporary source; it does not persist proof that the suggestion was ultimately submitted unchanged. This keeps original amounts intact and prevents later provider or trip-default changes from moving settled balances, at the cost of server-owned provenance and making recalculation an explicit, previewed operation rather than an automatic cascade.

## Consequences

Same-currency items are fixed at 1:1. Existing frozen items change only when their currency changes or a user selects them in a version-checked batch preview; explicit rates are never selected automatically. External callers may write only the rate and its note, while source, version, effective date, set/reset timestamps, and actor are owned by the server. Display-currency conversion happens after balances are netted in the trip currency and may use the current global snapshot.
