# Domain Docs

This repository uses a multi-context domain-document layout matching its npm workspaces.

## Before exploring

1. Read `CONTEXT-MAP.md` at the repository root when it exists.
2. Read only the workspace `CONTEXT.md` files relevant to the task.
3. Read relevant system-wide ADRs under `docs/adr/`.
4. Read relevant workspace ADRs under `<workspace>/docs/adr/`.

If a referenced context file or ADR directory does not exist, proceed silently. Domain-modeling workflows create them lazily when terminology or decisions are settled.

## Context layout

```text
/
├── CONTEXT-MAP.md
├── docs/adr/              # system-wide decisions
├── client/
│   ├── CONTEXT.md         # UI, frontend state, and client behavior
│   └── docs/adr/          # client-specific decisions
├── server/
│   ├── CONTEXT.md         # API, persistence, and server behavior
│   └── docs/adr/          # server-specific decisions
└── shared/
    ├── CONTEXT.md         # shared types and cross-boundary contracts
    └── docs/adr/          # shared-contract decisions
```

## Vocabulary and decisions

- Use the glossary vocabulary defined by the relevant `CONTEXT.md` files in specs, tickets, tests, and code.
- If a needed concept is not defined, note the gap for domain modeling rather than inventing conflicting terminology.
- Surface conflicts with existing ADRs explicitly; do not silently override an accepted decision.
