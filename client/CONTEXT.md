# Client

The Client context presents TREK's travel-planning experience and defines the user-facing language for interactive views.

## Language

**Shared Packing List**:
The trip-level packing pool shared by trip participants.
_Avoid_: Common List, Group Pool

**My Packing List**:
The current user's packing view, containing their private items and items shared specifically with them.
_Avoid_: Personal Tier, Private List

**Packing Category Template**:
An admin can save one category from the active Shared/My Packing List view. Applying it creates unchecked copies without linking trips.
Saving again with the same name asks for confirmation, then replaces the template contents while preserving the template identity.
