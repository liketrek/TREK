# TREK Travel Planning

TREK coordinates shared trips, including the currencies used to record, settle, and display their costs.

## Language

**Trip currency**:
The single accounting currency in which a trip's balances are netted.
_Avoid_: Base currency, accounting base

**Expense currency**:
The currency of the original amount recorded for one expense.
_Avoid_: Cost currency, receipt currency

**Payment currency**:
The currency of the original amount recorded for one settlement payment.
_Avoid_: Settlement currency, transfer currency

**Display currency**:
A user's presentation-only currency for reading final totals and balances.
_Avoid_: User currency, preferred currency

**Global exchange rate**:
A provider-derived rate in TREK's durable, server-wide snapshot.
_Avoid_: Live rate, browser rate

**Trip exchange rate**:
A trip-specific default rate for one foreign currency.
_Avoid_: Trip override

**Frozen exchange rate**:
The one effective exchange rate saved on an individual expense or settlement payment.
_Avoid_: Current rate, live rate

**Rate provenance**:
The recorded origin and version of a frozen exchange rate: identity, global, trip, manual, or legacy.
_Avoid_: Rate type, rate metadata
