# Handoff — porting `pwa-template` elements into TREK

**Date:** 2026-08-11
**Base at time of implementation:** upstream v3.4.1 integration (`2228251b`)
**Status:** Implemented and verified. The version-reload conflict is reconciled,
the approved full-width update banner is mounted, and the non-PDF `100vh` sweep
is complete. Typecheck and production build pass; see §5 for test status.

**Start at §6 — open items, sorted by what they need from you.** §5 has the
build status table; §3 has the reasoning.

---

## 1. Question being answered

Can the reusable PWA patterns from `~/projects/pwa-template` (as applied in
`~/projects/pwa-deals`) be added to TREK's client?

**Answer: partially — and less than first estimated.** The original read was
"roughly one third"; after checking the tree, closer to **a quarter**. Two of the
candidate items turned out to be already implemented in TREK, better than the
template does them (`OfflineBanner` §6d, the Workbox precache manifest §3).

The limiting factor is not technical difficulty, it is TREK's fork topology.

---

## 2. Context a newcomer needs

### TREK is a fork, and that dominates the cost model

```
origin    https://github.com/syyangv/TREK.git
upstream  https://github.com/mauriceboe/TREK.git
```

Every line added to a file that upstream also edits (`client/index.css`,
`client/vite.config.js`, layout components) becomes a recurring merge conflict on
every future upstream sync. The template's benefit is one-time; the merge tax
recurs forever. That asymmetry is the main filter applied below.

(An earlier draft warned that the branch was mid-merge and that the merge had to
finish before any of this work. That merge has since landed as `2228251b` — see
§6a.1. The warning is retained only as context for why the sequencing in §4 is
ordered as it is.)

### TREK already has a real PWA setup

Verified in the repo — this is not greenfield:

| Thing | Where |
|---|---|
| `VitePWA({ registerType: … })` + Workbox (`autoUpdate` → now `'prompt'`, §5) | `client/vite.config.js:8-9` |
| Toast system (`ToastContainer`, `useToast`, `window.__addToast`) | `client/src/store/notify.ts` |
| Offline / sync-state banner | `client/src/components/Layout/OfflineBanner.tsx` |
| Hand-rolled version check that wipes all caches and reloads | `client/src/App.tsx:144-162` ⚠️ see §3 |
| Web manifest (standalone, icons 180/192/512) | `client/vite.config.js:98-115` |
| Apple meta tags, `viewport-fit=cover` | `client/index.html:5,14-17` |
| Map-tile `CacheFirst` runtime cache (12288 entries / 30d) | `client/vite.config.js:27-43` |
| `safe-area-inset` usage — 24 occurrences | `index.css`, `Navbar.tsx`, `BottomNav.tsx`, `MobileTopBar.tsx`, `Modal.tsx`, others |

### The template's four parts

`~/projects/pwa-template/docs/pwa-template.md` (682 lines):

1. Deployment (launchd / Fly.io / Docker)
2. Screen fixed — overflow, grids, safe areas, touch
3. Versioning kept in sync with the code
4. Variation matrix (decision guide)

There is also a `pwa-ux` skill at `~/.agent/skills/pwa-ux`.

---

## 3. Findings per part

### Part 1 — Deployment: **skip, not applicable**

Template targets launchd + LaunchAgent plists for single-user Mac apps. TREK ships
a `Dockerfile` and a Helm chart (`charts/trek/`). Nothing transfers.

### Part 2 — Screen fixed: **mostly already implemented; port rules, not the file**

Do **not** copy `pwa-deals/app/static/css/pwa.css` in. It is written against bare
class names from a vanilla-JS app — `.navbar`, `.fab`, `.toast`, `.grid`, `.sheet`.
TREK is React with component-scoped styles. Those selectors would either silently
no-op or collide with existing rules. Use it as a **review checklist** instead.

One real gap it surfaces: ~20 remaining `100vh` usages that should be `100dvh`
(template Pattern L — Android address bar clips modal buttons).

**Critical caveat — do not sweep blindly.** These two files use `100vh`
*correctly* and must be excluded; they render to a fixed print page where `dvh`
is meaningless and would break PDF export:

- `client/src/components/PDF/JourneyBookPDF.tsx` (4 occurrences)
- `client/src/components/PDF/TripPDF.tsx` (2 occurrences)

Legitimate candidates include `Todo/TodoListPanel.tsx`, `Packing/PackingListPanelBagModal.tsx`,
`Layout/PageSidebar.tsx`, `Layout/InAppNotificationBell.tsx`, `pages/*Page.tsx`,
`styles/collections.css`. Each still needs confirming as mobile-reachable before editing.

### Part 3 — Version sync: **skip the mechanism, take only the UX** — *but read the correction at the end of this section first*

Strongest recommendation against porting. Template Part 3 hand-rolls what Workbox
already provides. TREK's content-hashed precache manifest *is* the version sync,
and is more reliable than a manually bumped `sw1` cache string. Adding a
hand-written `sw.js` would put two service workers in a race for the same scope.

What **is** genuinely missing is template Part 4d, *update UX*: `autoUpdate` swaps
the service worker silently, and iOS standalone PWAs retain the old worker until
every instance is closed — so users sit on stale code with no signal. Fix is
`registerType: 'prompt'` plus a small reload-toast component.

> **The two paragraphs above were written before reading `App.tsx`, and the
> correction immediately below supersedes them.** "TREK's precache manifest *is*
> the version sync" is only half true — there is a second, hand-rolled mechanism
> already in the tree.

#### ⚠️ Correction — TREK already hand-rolls a version sync, at `client/src/App.tsx:144-162`

Found while implementing, and it changes the picture. On boot, `getAppConfig()`
compares `config.version` against `localStorage.trek_app_version`. On mismatch it:

1. `caches.keys()` → `caches.delete(n)` for **every** cache,
2. unregisters **every** service worker registration,
3. `window.location.reload()` — immediately, with no user signal.

Two consequences:

- **It preempts the prompt.** TREK ships client and server on one version number,
  so any deploy changes `config.version`, this block fires on the next boot, and
  the waiting-worker prompt never gets a chance to appear. `registerType: 'prompt'`
  is close to a no-op until this path is reconciled.
- **It nukes the map-tile cache.** Step 1 is indiscriminate, so the `map-tiles`
  CacheFirst store (up to 12288 tiles, `client/vite.config.js:27-43`) is destroyed
  on every version bump. For an app whose offline story is downloaded maps, that
  is a real regression, and it is independent of anything in this document.

This is upstream code in a heavily-tracked file, so changing it carries merge tax
and is a judgement call rather than an obvious fix. Options, cheapest first:

| Option | Effect | Merge tax |
|---|---|---|
| Exclude `map-tiles` from the `caches.delete` sweep, leave the rest | Fixes the tile regression only; prompt still preempted | ~1 line |
| Additionally drop the `reload()` and let the SW prompt own the refresh | Both paths reconciled, single update UX | ~6 lines |
| Leave as-is | Prompt is dead code | none |

### Part 4 — Variation matrix: **adopt, free**

Pure decision doc. No code, no merge surface.

---

## 4. Recommended subset

| Item | Merge tax | Value | Do it? |
|---|---|---|---|
| Part 4 matrix recorded as a decision note | none | orientation | yes |
| Targeted `100vh` → `100dvh` (excluding PDF) | low | real iOS/Android fix | yes |
| Update-available prompt | low, isolated | fixes stale SW on iOS | yes — decided, §5 |
| Reconcile `App.tsx` force-reload | medium (upstream file) | unblocks the prompt; stops wiping map tiles | yes — needs a decision |
| `offline.js` connection indicator | n/a | zero, already covered by `OfflineBanner` | no |
| `pwa.css` wholesale | high | ~0, already covered | no |
| Hand-rolled `sw.js` + version injection | high | negative, fights Workbox | no |
| Part 1 deployment patterns | n/a | n/a | no |

**Sequencing:** ~~resolve the upstream merge~~ (done, `2228251b`) → reconcile
`App.tsx:144-162` → build `UpdateBanner` → `dvh` sweep. The `App.tsx` step comes
*before* the banner, because the banner is unreachable until it is done.

---

## 5. The original blocking decision — resolved

(The `registerType` question that blocked this doc's first draft. A *different*
blocker has since been found — see §6a.)

`registerType` in `client/vite.config.js` encodes the entire update policy:

- **`autoUpdate`** (previous) — never interrupts, but can strand an iOS user on
  stale code for days.
- **`prompt`** — guarantees freshness, but can interrupt someone mid-trip-planning,
  possibly while offline.

**Decided (syang, 2026-08-11): `prompt`.** TREK is a collaborative realtime app;
a stale client desyncing from collaborators is worse than a mild interruption.

Reload policy was not separately specified. Implemented default: **surface, never
act** — the banner appears and reloads only on tap, so it can never interrupt an
edit or a reorder mid-gesture. Swappable later for defer-until-idle.

### Implementation status

| Step | State |
|---|---|
| `registerType: 'prompt'` + rationale comment in `client/vite.config.js` | done |
| `/// <reference types="vite-plugin-pwa/react" />` in `client/src/vite-env.d.ts` | done |
| `UpdateBanner` component + en i18n keys + mount in `App.tsx` | done — full-width banner approved 2026-08-11 |
| Reconcile `App.tsx:144-162` | done — Workbox owns updates; map tiles preserved |
| `100vh` → `100dvh` sweep | done — PDF print layouts intentionally excluded |

Verification after implementation:

- `npm run typecheck` — passed
- `npm run build` — passed; generated a prompt-mode Workbox worker
- Local production lifecycle test — passed: installed v1 under a controlled
  browser, published a byte-distinct v2 worker, observed it enter `waiting`,
  observed the approved banner, tapped Reload, and confirmed v2 activated
- Offline cache persistence — passed: a sentinel response placed in the real
  `map-tiles` Cache Storage cache before the update remained after activation
- `npm test` — 3356 passed, 38 skipped, 1 unrelated existing AdminPage test
  failed while waiting for an invite-token fixture; no update-banner failure

The implementation is maintained as a focused follow-up to the upstream v3.4.1
integration; consult Git history for its commit and review status.

### Facts that made this cheaper than expected

- **No toast dependency needed.** TREK already has one: `ToastContainer` +
  `useToast` + the `window.__addToast` bridge in `client/src/store/notify.ts`.
- **`OfflineBanner.tsx` is the pattern to copy** for a fixed pill — it uses
  `bottom: calc(var(--bottom-nav-h) + 16px)`, which already solves the
  bottom-nav/safe-area clearance problem. Don't re-derive it.
- **i18n key drift is not enforced.** `shared/src/i18n/i18n-parity.spec.ts` gates
  only *file*-set parity across the ~24 locale dirs, explicitly not key parity.
  So new keys can go into `shared/src/i18n/en/` alone and other locales fall back
  to English. Adding a UI string does not mean touching 24 files.

---

## 6. Completion record

There are no remaining implementation decisions or code blockers.

- The upstream merge landed as `2228251b` before this work began.
- Workbox now owns the client update lifecycle. The old version-change path no
  longer clears caches, unregisters workers, or forces a reload, so `map-tiles`
  survives releases.
- The user approved the full-width amber update banner. It is mounted globally,
  remains visible while a worker waits, and calls `updateServiceWorker(true)`
  only after Reload is tapped.
- All non-PDF `100vh` instances were confirmed as responsive UI and converted
  to `100dvh`. The six PDF declarations remain deliberately unchanged.
- TREK's existing `OfflineBanner` remains the sole connection/sync indicator;
  the template's `offline.js` was not copied.
- Focused update-banner tests cover hidden, waiting, and user-activation states.
- Typecheck and production build pass. The full suite's single AdminPage
  invite-token failure reproduces independently and is unrelated to this work.

The generated production worker's two-release lifecycle is verified locally in
a real browser. A physical installed-iOS smoke test remains a release-time device
check, not an implementation blocker.

## 7. Production deployment record

Deployed 2026-08-11 to:

- `https://home-macbook-air.tailcd6e49.ts.net/dashboard`
- Reported application version: `3.5.1`
- Running image: `trek-local:3.5.1-pwa`
- Running image ID: `sha256:1ed44ba7c84642d09d037eb83b00fa4c2cd72f03302de5153e0efa9b1e349c22`
- Main assets: `index-BfttcZn0.js`, `index-DCvTOdDL.css`
- Service-worker SHA-256: `aaadf7d0980ce285f4cf9ece0f774c558d64cc69075a6e241c5ea1c36330edf5`
- Post-deploy health: healthy; `/api/health` returned `{"status":"ok"}`

### Deployment decisions and lessons

The working branch is based on TREK `3.4.1`, but production was already running
`3.5.1`. Building the working tree directly would therefore have downgraded the
server. The verified patch was applied to an isolated export of tag `v3.5.1`,
then shared/client typechecks, focused banner tests, and the production PWA build
were rerun before building the deployment image.

The Dockerfile defaults `APP_VERSION` to `dev`. The first candidate image was
healthy and served the correct assets, but correctly failed version verification
because it reported `dev`. The final image was rebuilt with:

```bash
docker build --build-arg APP_VERSION=3.5.1 -t trek-local:3.5.1-pwa .
```

The prior immutable image remains the rollback target:

```text
thvysy44/trek-fork@sha256:ba0018609f5147e581391fcb8b4c91e20969d9bbff5fe024fde76933f1c0564e
```

### Durability warning

This deployment uses a local Docker image and the Compose override only selects
it when `TREK_IMAGE=trek-local:3.5.1-pwa` is supplied. A future plain
`docker compose up` can revert to the configured registry image. The repository
changes are also still uncommitted on a `3.4.1`-based branch.

For a durable release, port the patch onto a maintained `3.5.1`-based branch,
commit it, publish an immutable registry image, and update the deployment image
reference to that digest.

---

## 8. Reference

- Template: `~/projects/pwa-template/docs/pwa-template.md`
- Working example: `~/projects/pwa-deals/app/static/` (`css/pwa.css`, `js/offline.js`, `sw.js`)
- Skill: `~/.agent/skills/pwa-ux`
- TREK PWA config: `client/vite.config.js`, `client/index.html`
