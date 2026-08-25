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

**Common currency list**:
A user's ordered shortcuts for currencies they choose frequently; it does not assign a currency to a trip, expense, payment, or display.
_Avoid_: Favourite currency, preferred currencies

**Global exchange rate**:
A provider-derived rate in TREK's durable, server-wide snapshot.
_Avoid_: Live rate, browser rate

**Trip exchange rate**:
A trip-specific default rate for one foreign currency.
_Avoid_: Trip override

**Frozen exchange rate**:
The one effective exchange rate saved on an individual expense or settlement payment.
_Avoid_: Current rate, live rate

**Exchange-rate suggestion**:
A read-only rate proposed for a new expense or settlement payment, with temporary trip or global provenance that is not proof of what was ultimately saved.
_Avoid_: Quote, reserved rate

**Rate provenance**:
The server-recorded origin and version of a frozen exchange rate: identity, global, trip, explicit, or legacy. Explicit means the caller supplied the saved rate value.
_Avoid_: Rate type, rate metadata

**Trip participant**:
A person represented in one trip who can hold assignments or financial participation, whether or not they can sign in.
_Avoid_: User, traveler

**Departure transport**:
The chronologically first non-cancelled transport booking that can be placed on a Trip's timeline.
_Avoid_: First reservation, Trip start time

**Account member**:
A trip participant linked to a TREK account with access to the trip.
_Avoid_: Real member, registered guest

**Guest**:
A trip-scoped participant represented by name without a sign-in account.
_Avoid_: Anonymous user, temporary account

**Expense share**:
The portion of an expense owed by one trip participant, either equal or custom.
_Avoid_: Person count, payment

**Payer**:
A trip participant who paid some or all of an expense.
_Avoid_: Expense owner, settlement sender

**Settlement payment**:
A recorded transfer from one trip participant to another that reduces their net trip balance.
_Avoid_: Expense, reimbursement estimate

**Guest identity transfer**:
An irreversible transfer of one Guest's trip participation to the Account member who represents the same person.
_Avoid_: Guest claim, Guest merge, account upgrade

**New-member identity check**:
A per-trip check asking a newly joined Account member whether an existing Guest represents them.
_Avoid_: Guest prompt, claim prompt, new joiner check

**Web Push channel**:
TREK's own route for delivering eligible notifications to authorized browser installations.
_Avoid_: Ntfy push, native push

**Device subscription**:
An Account member's authorization for one browser installation to receive TREK Web Push notifications.
_Avoid_: Device token, ntfy topic
