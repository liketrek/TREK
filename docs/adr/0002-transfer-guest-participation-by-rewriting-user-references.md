---
status: accepted
---

# Transfer guest participation by rewriting user references

TREK atomically rewrites a Guest's current trip-scoped participation to the Account member who represents the same person, then deletes the Guest. Historical actors remain unchanged and plugin-owned data is erased. Ambiguous financial records block the whole transfer; valid ticket participants are structured identity references, while malformed ticket text is never searched for an id.

V4 reservation-traveler membership is deduplicated during transfer. Place ratings are personal opinions: when both identities rated the same place, the Account member's existing rating wins, the Guest duplicate is discarded, and the overlap is disclosed in the preview and audit record. Non-overlapping Guest ratings move to the Account member.

The New-member identity check runs for non-owner Account members until they decline it, successfully transfer a Guest, or have no candidates. Existing memberships and trip owners remain opted out.
