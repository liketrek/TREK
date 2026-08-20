# Context Map

## Contexts

- [Client](./client/CONTEXT.md) — presents TREK's browser and mobile-responsive user experience
- Server — owns APIs, persistence, permissions, and server-side behavior; its glossary is created when server-specific terminology is first resolved
- Shared — owns cross-boundary types and contracts; its glossary is created when shared terminology is first resolved

## Relationships

- **Client → Server**: the client consumes server APIs and renders the resulting travel-planning state.
- **Client ↔ Shared**: the client uses shared types to represent API and domain contracts.
- **Server ↔ Shared**: the server implements and publishes the contracts represented by shared types.
