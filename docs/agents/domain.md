# Domain Docs

Engineering skills use a single-context domain model for this repository.

## Before exploring

Read these resources when they exist and relate to the work:

- `CONTEXT.md` at the repository root
- Relevant ADRs under `docs/adr/`

Proceed silently when either resource is absent. The domain-modeling workflow creates them when terminology or architectural decisions are resolved.

## Layout

- `CONTEXT.md` defines the shared domain vocabulary.
- `docs/adr/` records system-wide architectural decisions.
- Name ADRs sequentially, for example `0001-use-postgresql.md`.

Use terms exactly as defined in the `CONTEXT.md` glossary. If a needed concept is missing, reconsider whether it belongs to the project’s vocabulary or note the gap for domain modeling.

Surface conflicts with existing ADRs explicitly, naming the affected ADR and explaining why the decision may need reconsideration.
