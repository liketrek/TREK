# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this package is

`trek-plugin-sdk` — the author-facing SDK and CLI for building TREK plugins. It lives inside the TREK monorepo but is **not one of the root npm workspaces**: it has its own `package-lock.json`, is versioned and published to npm independently, and must ship standalone (a published copy has no access to the rest of the repo). Run all commands from `plugin-sdk/`, not the repo root. The repo root's CLAUDE.md covers the main app; its conventions (target `dev` branch, conventional commits) still apply.

It ships three bins from one codebase: `trek-plugin-sdk` / `trek-plugin` (same entry, `src/cli/trek-plugin.ts`) and `create-trek-plugin` (`src/cli/create.ts`).

## Commands

```bash
npm install
npm run build        # tsc ESM build + tsc CJS build + scripts/finish-cjs.mjs
npm run typecheck    # tsc --noEmit
npm test             # vitest run
npx vitest run test/sdk.test.ts        # single test file
npx vitest run -t "name of the test"   # by test-name pattern
node scripts/gen-lucide-icon-names.mjs # regenerate src/lucide-icon-names.ts (uses repo-root lucide-react)
```

Node >= 18. The package is `"type": "module"`; the dual build emits ESM to `dist/` and CJS to `dist/cjs/` (finish-cjs.mjs writes the `{"type":"commonjs"}` scope marker there — without it Node parses the CJS output as ESM).

## The load-bearing principle: mirrored host code + parity tests

The SDK's core promise is that local results equal host/registry results: `dev` enforces what a real TREK enforces, and `validate` passes iff the TREK-Plugins registry CI passes. A drift in the lenient direction is the worst bug in this package — a **false green** lets an author cut an effectively immutable GitHub release (the registry pins its sha256) that the registry then rejects.

Because the package ships standalone, it cannot import server code, so several files are deliberate **copies** of host sources, each guarded by a parity test that reads the original source directly. These tests skip outside the monorepo, but in this checkout they run — keep the pairs in sync when touching either side:

| SDK copy | Source of truth | Parity test |
|---|---|---|
| `src/permissions.ts` (`HOOK_PERMISSION`) | `server/src/nest/plugins/protocol/envelope.ts` via `server/scripts/gen-plugin-facts.ts` | `test/permissions-parity.test.ts` |
| `src/egress-policy.ts` (pure helpers, kept **byte-identical**) | `server/src/nest/plugins/runtime/egress-policy.ts` | `test/permissions-parity.test.ts` |
| `src/manifest.ts` (validation rules, `KNOWN_ADDONS`) | server plugin loader / `server/src/addons.ts` | — kept in sync by hand |
| `src/cli/checks/*` (registry gates) | TREK-Plugins registry repo (`scripts/validate-entry.mjs`, `check-readme.mjs`) | `test/checks-parity.test.ts` (runs the registry's real script; set `TREK_PLUGINS_REPO` to point at a checkout) |
| `src/zip.ts` (ZIP writer) | server `safe-extract.ts` reader | format is frozen against the reader |

`src/permissions.ts` also documents a subtlety worth preserving: ctx methods fail loudly at call time, but hooks/events/jobs are gated *before* the plugin is reached and fail **silently** in production — so the dev server and mock host deliberately make those failures loud (an ungranted `run(def).hook(...)` throws).

**Direction: single-source the contract.** The protocol core — permissions, RPC methods, hooks, the event catalog — is already single-sourced: `src/generated/host-facts.ts` is **machine-written** by `server/scripts/gen-plugin-facts.ts` from `server/src/nest/plugins/protocol/envelope.ts` (never hand-edit it; the server's `check:plugin-facts` CI gate catches drift). The remaining hand-kept copies (egress-policy, manifest rules, registry gates, the ZIP writer) are the residual risk, and the `skipIf(!inMonorepo)` escape hatch means the published SDK's own CI can green-light drift in those — so keep moving copies into the generated/parity-tested set, never away from it. Until then: changing an egress rule, manifest rule, or registry gate means touching **every** copy in one change; parity gates fail closed, never leniently; and version/compat checks fail **closed** on unknown host versions rather than assuming compatibility.

## Architecture

- **`src/index.ts`** — the plugin API surface: all types, `definePlugin`, `PLUGIN_API_VERSION` (bump on any breaking API change). Pure and dependency-free; it mirrors exactly what TREK's isolated plugin runtime injects. Runtime deps for the whole package are only `@clack/prompts`, `semver`, `update-notifier` — keep it that way (e.g. Playwright for `shot` is intentionally the author's devDependency, and the ZIP writer is in-tree instead of a dependency).
- **Two package exports**: `.` (the SDK) and `./testing` (`src/mock-host.ts`) — a mock `PluginContext` + driver enforcing the same permission model against configured fixtures.
- **`src/cli/`** — one file per command, dispatched by `trek-plugin.ts`; `menu.ts` is the no-command guided menu. Interactive TTY sessions get prompts; non-TTY (CI, pipes) stays flag-driven — machine output (`entry` JSON, `pack --json`, PR URLs) goes to stdout, notices to stderr.
- **`src/cli/checks/`** — one check registry, two depths: `runOffline` (synchronous on purpose, so `packPluginDir` can validate before zipping without going async) and `runAll` (adds the GitHub-dependent gates used by `preflight`/`publish`). Printing lives in `report.ts`: `status` renders the checklist and never exits non-zero; `validate` is the same checks with an exit code.
- **`src/ui/kit.ts`** — the design kit (`TREK_UI_CSS`, `TREK_THEME_JS`) as plain strings, inlined into a plugin's `client/index.html` where the `<!-- trek:ui -->` marker sits (`dev`/`pack` expand it; the opaque-origin iframe CSP forbids external link/script). Not a security boundary.
- **`src/lucide-icon-names.ts`** — generated snapshot (see command above); an unknown icon is a validate **warning**, never an error.
- **`test/helpers.ts`** — `makePublishable(dir)` turns a fresh scaffold into a registry-passing plugin (README with per-permission lines, ≥400 prose chars, screenshot); the scaffold deliberately fails publish gates, so tests choose "fresh" vs "publishable" explicitly.
- **`examples/`** — complete example plugins (`trip-doctor`, `koffi`).

## Behavioral contracts to not break

- `status` never exits non-zero; `validate` is the enforcing form.
- `publish` order is check → pack → release → preflight → submit, and a check failure must stop anything from being tagged/released (releases are immutable in practice).
- Signed → unsigned is refused forever; unsigned → signed is always allowed.
- Update notices (update-notifier) print to stderr only and are silent in CI/`NODE_ENV=test`/non-TTY, so JSON output stays pipeable.
