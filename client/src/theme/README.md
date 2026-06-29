# Appearance & theming

TREK's look is driven by **design tokens** (CSS custom properties) so a single
per-user config can re-skin the whole app — color scheme, accent, transparency,
text size, density — without touching component code. New pages get this for
free **if they follow the contract below**.

## How it works

- The per-user config is one validated blob (`AppearanceConfig` in
  `@trek/shared`), stored under the `appearance` settings key.
- `applyAppearance()` (`src/theme/applyAppearance.ts`) is the **only** code that
  writes styling to the DOM: it toggles `.dark`, sets `data-scheme` /
  `data-no-transparency` / `data-density` / `data-reduce-motion` on `<html>`,
  and writes the custom-accent + type-scale CSS variables.
- A render-blocking `public/theme-boot.js` replays a cached snapshot before
  first paint to avoid FOUC (external classic script — the prod CSP blocks
  inline scripts).
- Schemes are data: swatch metadata in `src/theme/schemes.ts`, token values in
  the `[data-scheme="…"]` blocks in `src/index.css`.

## Token taxonomy

| Purpose | Token / utility |
| --- | --- |
| Surfaces | `--bg-primary/secondary/tertiary/elevated/card/input/hover/selected` · `bg-surface*` |
| Text | `--text-primary/secondary/muted/faint` · `text-content*` |
| Borders | `--border-primary/secondary/faint` · `border-edge*` |
| Accent | `--accent` (fill) · `--accent-text` (on fill) · `--accent-on` (on surface) · `--accent-hover` · `--accent-subtle` · `bg-accent` / `text-accent-on` / `bg-accent-subtle` |
| Status | `--success/-soft`, `--danger/-soft`, `--warning/-soft`, `--info/-soft` · `bg-danger-soft text-danger` etc. |
| Elevation | `--shadow-sm/md/lg/card/elevated/modal/dropdown/popover` · `shadow-modal` etc. |
| Overlay / inverse | `--overlay` · `--bg-inverse` / `--text-inverse` · `bg-inverse text-inverse-text` |
| Type tiers | `text-title` / `text-subtitle` / `text-body` / `text-caption` (scale with the user's per-tier multipliers) |

## The contract (enforced by `npm run theme:lint`)

1. **Surfaces/text/borders** use the semantic utilities (`bg-surface*`,
   `text-content*`, `border-edge*`) or `var(--token)` — never raw
   `bg-slate-*` / `text-gray-*` / `bg-white`.
2. **The primary/"black" action look** uses `bg-accent` + `text-accent-text`
   (+ `ring-accent`) — never `bg-slate-900` / `bg-black` / `bg-indigo-*`. This
   is what lets a user's accent reach new surfaces automatically.
3. **Semantic text size** uses the tier utilities `text-title/subtitle/body/caption`
   — never an inline `fontSize: <px>`, never raw `text-sm`/`text-xs` to *mean* a tier.
4. **Translucent/blurred** surfaces consume an alpha/glass token
   (`--bg-elevated`, `--tooltip-bg`, `--glass-*`) or a `backdrop-blur` utility,
   so transparency-off can neutralize them centrally — never inline `rgba()`
   backgrounds or `backdrop-filter` in JSX.
5. **Components never read `AppearanceConfig` to compute styles.** Only
   `applyAppearance` reads the config and writes tokens; components read tokens.
   Dark state is read off the `.dark` class, never duplicated into React state.
6. **New appearance dimensions** are added to `AppearanceConfig` +
   `applyAppearance` + `schemes.ts` — never a second applier or a parallel token
   family. New feature palettes derive their accent from `var(--accent)`.

### Allowed to stay inline / literal

Genuinely dynamic values (data-driven colors like `cat.color`, computed
geometry/transforms/sizes), and the surfaces CSS variables can't reach: injected
map popup/marker HTML, Mapbox/MapLibre paint, and the standalone `@react-pdf`
documents. Mark intentional exceptions with a `theme-lint-disable` line comment.
