---
status: accepted
---

# Freeze exchange rates with layered defaults

TREK treats every numeric caller-supplied exchange-rate value as explicit. On create, or when an update changes the transaction currency, an omitted foreign rate is resolved by the server from the Trip exchange rate and then the durable Global snapshot. On an update that leaves the currency unchanged, an omitted rate preserves the transaction's existing frozen value. The resolve API only suggests a value and temporary source; it does not persist proof that the suggestion was ultimately submitted unchanged. This keeps original amounts intact and prevents later provider or Trip-default changes from moving settled balances, at the cost of server-owned provenance and making recalculation an explicit, previewed operation rather than an automatic cascade.

## Consequences

Same-currency items are fixed at 1:1. Existing frozen items change only when their currency changes, a caller supplies a new numeric rate, or a user selects them in a version-checked batch preview; explicit rates are never selected automatically. There is no single-item reset-to-inherited contract. External callers may write only the rate and its note, while source, version, effective date, set timestamp, and actor are owned by the server. Display-currency conversion happens after balances are netted in the Trip currency and may use the current Global snapshot.
