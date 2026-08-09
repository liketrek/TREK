# Transfer guest participation by rewriting user references

Status: Accepted

## Context

A Guest claim must transfer one trip participant's current participation to an existing Account member without creating duplicate financial participation or partially rewriting the trip. TREK currently stores participant identity as user references across core tables and inside itemized ticket payloads.

Damaged ticket JSON cannot be safely searched as text for participant IDs. A Guest ID may also appear in a room name, price, or as part of another number, and none of those values establishes financial participation.

## Decision

When an Account member claims a Guest, TREK atomically rewrites that Guest's current trip-scoped participation to the member's user identity and deletes the Guest. Historical actors remain unchanged, and plugin-owned data is erased rather than merged.

Ambiguous financial records block the whole claim. For a damaged ticket payload, Guest involvement is established only by structured financial references on the expense: an expense share, an explicit payer, or the legacy payer field. Parsed ticket participant IDs are structured identity references for valid payloads. Names, prices, arbitrary numeric text, and substring matches are never identity evidence.

Ticket payloads are validated when identity-bearing expense data is written so new malformed or out-of-scope participant references cannot be persisted. Non-identity fields may still be updated on legacy damaged records, allowing those records to be repaired without first interpreting their invalid payload.

## Consequences

Claims retain the existing core contracts, one-time prompt, atomic rewrite, and offline model. Introducing a separate trip-participant identity would require a broader cross-module and plugin migration, while upgrading the Guest account would not support an existing TREK account. Damaged tickets unrelated to the Guest no longer block a claim merely because their text contains the Guest's numeric ID.
