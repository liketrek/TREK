# CLAUDE.md

Scope: the **`@trek/mcp-apps`** workspace, the interactive views (MCP Apps) TREK's MCP tools can draw in a host that supports the `io.modelcontextprotocol/ui` extension (Claude, ChatGPT). See the repo-root `CLAUDE.md` for the monorepo picture and `wiki/MCP-Apps.md` for what an admin and a user see.

## Commands (run from `mcp-apps/`)

```bash
npm run build          # scripts/build.mjs: one vite build per widget into ../server/mcp-apps/<name>.html (needs shared built)
npm run typecheck      # tsc --noEmit, strict
npm run test           # vitest (jsdom); test:coverage holds 80% on every metric
npm run format:check   # Prettier (CI gate)
```

## How a widget is put together

- **The name** is listed once in `MCP_APP_WIDGETS` (`shared/src/mcp-apps/widgets.ts`). The build, the server's resource (`server/src/nest/mcp-apps/mcp-apps.mcp.ts`) and the tool's `_meta: uiTool(mcpAppUri(name))` all read it from there.
- **One folder per widget** under `src/widgets/<name>/`: `index.html` and `main.tsx` (the React root, left out of coverage), `App.tsx` (wires the host through `useTrekApp`), and a pure component that renders the tool's `structuredContent` and takes its callbacks as props. Tests render the pure component, and `App` with `useTrekApp` mocked.
- **Data comes from the tool result only.** A widget parses `structuredContent` with the tool's output schema from `@trek/shared/mcp-apps` and never fetches anything. Its sandbox's CSP allows images from the TREK address alone. Links back into TREK use the `trek/appUrl` the result carries in `_meta`.
- **Strings** come from shared's `mcpApps` locale domain (`shared/src/i18n/<locale>/mcpApps.ts`), real translations in every locale. Never import the full locale index: it would put megabytes of help pages into every document. `client/scripts/i18n-keys.mjs` reads `src/` here so a key a widget names counts as used.
- **Styling** reads the host's style variables (`--color-*`, `--font-*`, `--border-radius-*`) with TREK's own as fallbacks (`src/lib/theme.css`). Use logical properties so Arabic and Hebrew run right to left.
