# Page pattern: wiring container + data hook

Every page under `src/pages` follows the same shape: the exported `*Page`
component is a thin **wiring container** and all of its state, effects, data
loading and event handlers live in a co-located **`use<Page>()` hook**.

```
src/pages/
  DashboardPage.tsx          ← container: reads the hook, renders JSX
  dashboard/
    useDashboard.ts          ← state, effects, API calls, handlers
    dashboardModel.ts        ← (optional) pure types + helpers, no React
```

## What goes where

**The hook (`use<Page>.ts`)** owns everything stateful:

- `useState` / `useReducer` / `useRef`
- `useEffect` / `useLayoutEffect`
- `useMemo` / `useCallback`
- store selectors, API calls, WebSocket listeners, handlers
- derived values

It returns a single object the page destructures.

**The page (`*Page.tsx`)** is presentation only:

- `const { ... } = use<Page>()`
- `useTranslation()` for `t`/`locale` (a context hook, not state — allowed)
- JSX, and `t`-dependent display arrays like the tab list
- presentational sub-components and pure helpers may live in the same file,
  before or after the default export

```tsx
export default function DashboardPage() {
  const { t } = useTranslation()
  const { trips, isLoading, handleCreate } = useDashboard()
  if (isLoading) return <Spinner />
  return <Grid trips={trips} onCreate={handleCreate} />
}
```

## Why

- **Testable** — page tests render JSX; hook logic is isolated and mockable.
- **Readable** — the container reads top-to-bottom as "what the page shows".
- **Diffable** — logic changes touch the hook, layout changes touch the page.

## Notes

- A `<page>Model.ts` is optional — use it for pure types and helpers shared
  between the hook and the page (no React imports). See `atlas/atlasModel.ts`
  for a mutable-lookup-table example and `admin/adminModel.ts` for types only.
- The post-guard derivations that depend on a now-narrowed value (e.g. after
  `if (!current) return`) may stay in the page next to the JSX that uses them.
- Keep the rendered JSX byte-identical when extracting — this is a refactor of
  where logic lives, not a redesign.

## Enforcement

`npm run lint:pages` (`scripts/check-page-pattern.mjs`) scans each `*Page.tsx`
default-export body and fails if it calls `useState`, `useReducer`, `useEffect`,
`useLayoutEffect`, `useMemo`, `useCallback` or `useRef` directly. Move that logic
into the page's hook. Sub-components and helper hooks in the same file are not
flagged.
