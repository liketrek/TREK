# Developer Setup Guide

> Before anything else, please read the [[Contributing]] guidelines.

## Prerequisites

- Node.js 24, the version in `.nvmrc` and the one the Docker image and CI run (`nvm use` or `fnm use` picks it up). 22.22.2 or later still installs, but nothing tests it.
- npm
- Git
- Python 3 and a C++ toolchain (`build-essential` on Debian/Ubuntu, the Xcode Command Line Tools on macOS, the Visual Studio Build Tools on Windows). better-sqlite3 ships prebuilt binaries, but a lockfile-driven `npm install` still runs node-gyp against them and stops without these (npm/cli#9837).
- A GitHub account

---

## 1. Fork & Clone the Repository

Go to the [TREK repository](https://github.com/liketrek/TREK) and click **Fork** to create your own copy.

Then clone your fork locally:

```bash
# Clone your fork, checking out the dev branch
git clone -b dev git@github.com:your-username/TREK.git
cd TREK
```

---

## 2. Configure Git Remotes

Add the original repository as `upstream` so you can pull in future updates:

```bash
git remote add upstream git@github.com:liketrek/TREK.git
```

You should now have two remotes:

| Remote     | URL                                          | Purpose                        |
|------------|----------------------------------------------|--------------------------------|
| `origin`   | `git@github.com:your-username/TREK.git`      | Your fork — push changes here  |
| `upstream` | `git@github.com:liketrek/TREK.git`         | Main repo — pull updates from here |

---

## 3. Keep Your Fork Up to Date

Before starting any work, make sure your local `dev` branch is in sync with upstream:

```bash
git fetch upstream
git rebase upstream/dev  # or: git merge upstream/dev
```

---

## 4. Create a Feature Branch

Working on a dedicated branch keeps your changes isolated and makes PRs easier to review:

```bash
# Create a new branch off of dev
git checkout -b fix/my-changes origin/dev
```

Branch naming conventions:
- `feat/short-description` for new features
- `fix/short-description` for bug fixes
- `chore/short-description` for maintenance tasks

---

## 5. Install Dependencies

The repo is an npm workspace monorepo with three workspaces — `shared`, `server`, and `client`. One command at the root installs all three:

```bash
npm ci
```

`plugin-sdk/` is **not** a root workspace: it has its own lockfile and is published to npm independently, so a root `npm ci` never touches it. If you are working on the SDK, install and run its commands from that directory:

```bash
cd plugin-sdk && npm ci
```

---

## 6. Optional: KItinerary (Booking Import)

The booking-confirmation import feature uses [KDE KItinerary](https://apps.kde.org/itinerary/) to parse travel documents. The server works without it, but the import endpoint will be non-functional.

### Linux

```bash
sudo apt-get install -y libkitinerary-bin
```

### Environment variables

Add these to your local `.env` (or export them before starting the server):

```bash
# Prevent Qt from probing for a display in headless/server environments
QT_QPA_PLATFORM=offscreen

# KDE cache directory (avoids writing to $HOME)
XDG_CACHE_HOME=/tmp/kf6-cache

# Optional: only needed when the binary is not found on its own
# KITINERARY_EXTRACTOR_PATH=/usr/lib/x86_64-linux-gnu/libexec/kf6/kitinerary-extractor
```

`KITINERARY_EXTRACTOR_PATH` is optional. Left unset, the server looks for the Debian/Ubuntu location `/usr/lib/<triplet>/libexec/kf6/kitinerary-extractor` and then for `kitinerary-extractor` on `PATH` — one of which is what `libkitinerary-bin` gives you. Set it only if the binary ended up somewhere neither lookup reaches, and make sure the path exists: a value that does not resolve logs a warning and stops the lookup instead of falling back, which turns the import feature off. The Docker image sets it to `/usr/local/bin/kitinerary-extractor`, a symlink created at image build; that path does not exist on a plain apt install.

---

## 7. Available Scripts

### Root (`/`)

These commands run across all workspaces at once and are the recommended way to work:

| Command              | Description                                                         |
|----------------------|---------------------------------------------------------------------|
| `npm run dev`        | Build shared, then start shared (watch), server, and client together via `concurrently` |
| `npm run build`      | Build shared → server → client in order                            |
| `npm test`           | Run tests in shared, server, and client                            |
| `npm run test:cov`   | Run coverage for shared, server, client and plugin-sdk             |
| `npm run test:e2e`   | Run end-to-end tests (server)                                      |
| `npm run lint`       | Lint shared, server, and client (check-only)                       |
| `npm run lint:fix`   | Apply ESLint's fixes in shared and server                          |
| `npm run format`     | Format shared, server, and client                                  |
| `npm run format:check` | Check formatting across all workspaces                           |

### Shared (`/shared`)

The `@trek/shared` package is the single source of truth for code shared between the client and server. It holds the **Zod schemas that define the API contracts** (request/response shapes, common primitives, pagination) and the **i18n translation layer** (per-language keys and types). Both workspaces import from it, so schema and translation changes propagate to both sides from one place.

> **Tip:** run `npm run i18n:parity` (or `i18n:parity:strict`) in this package to verify every locale exposes the same translation keys — the CI parity gate runs the strict variant.

| Command                     | Description                          |
|-----------------------------|--------------------------------------|
| `npm run build`             | Compile shared package (tsdown)      |
| `npm run build:watch`       | Compile in watch mode                |
| `npm test`                  | Run tests                            |
| `npm run test:watch`        | Run tests in watch mode              |
| `npm run typecheck`         | Type-check without emitting          |
| `npm run i18n:parity`       | Check locale key parity              |
| `npm run i18n:parity:strict`| Strict locale key parity (CI gate)   |
| `npm run lint`              | Lint source, check-only (CI gate)    |
| `npm run lint:fix`          | Lint source and apply the fixes      |
| `npm run lint:format`       | Every file outside the shrinking baseline is Prettier-formatted (CI gate) |
| `npm run format`            | Format source                        |
| `npm run format:check`   | Check formatting                  |
| `npm run contracts:open`    | Open shapes in the request contracts may only shrink (CI gate) |

### Server (`/server`)

> **Tip:** `tests/` sits outside the build `tsconfig.json`, so `npm run typecheck` skips it — `npm run typecheck:tests` is the only step that catches a broken test call site. CI runs both.

| Command                      | Description                              |
|------------------------------|------------------------------------------|
| `npm start`                  | Start the server (production)            |
| `npm run dev`                | Start the server in watch mode           |
| `npm run build`              | Compile server                           |
| `npm run typecheck`          | Type-check without emitting              |
| `npm run typecheck:tests`    | Type-check `tests/` too (CI gate)        |
| `npm test`                   | Run all tests                            |
| `npm run test:unit`          | Run unit tests only                      |
| `npm run test:integration`   | Run integration tests                    |
| `npm run test:ws`            | Run WebSocket tests                      |
| `npm run test:e2e`           | Run end-to-end tests                     |
| `npm run test:watch`         | Run tests in watch mode                  |
| `npm run test:coverage`      | Run tests with coverage report           |
| `npm run lint`               | Lint everything, check-only              |
| `npm run lint:fix`           | Lint everything and apply the fixes      |
| `npm run lint:check`         | Same as `npm run lint`                   |
| `npm run lint:warnings`      | ESLint, failing on any error and on warnings above the per-rule baseline (CI gate, replaces `lint:check`) |
| `npm run check:plugin-facts` | Verify generated plugin facts (CI gate)  |
| `npm run lint:size`          | No source file grows past its line limit or its baseline entry (CI gate) |
| `npm run lint:boundaries`    | Import cycles and domain boundaries may not grow past their baseline (CI gate) |
| `npm run lint:tx`            | Methods that write more than once outside one transaction may not grow past their baseline (CI gate) |
| `npm run lint:test-sql`      | Raw SQL fixtures in `tests/` may not grow past their baseline (CI gate) |
| `npm run lint:dialect`       | SQLite-only SQL spellings under `src/` may not grow past their baseline (CI gate) |
| `npm run gen:db-types`       | Regenerate the Kysely table types in `src/db/kysely/` from the migrated schema |
| `npm run check:db-types`     | Verify the generated Kysely table types match the migrations (CI gate) |
| `npm run probe:pg`           | Run the dialect helpers and repository statements against Postgres (CI job, needs `TREK_PG_PROBE_URL`) |
| `npm run lint:format`        | Every file outside the shrinking baseline is Prettier-formatted (CI gate) |
| `npm run lint:strict`        | Strict type errors per file may not grow past their baseline; a new file has none (CI gate) |
| `npm run format`             | Format source                            |

### Client (`/client`)

| Command                    | Description                                          |
|----------------------------|------------------------------------------------------|
| `npm run dev`              | Start the Vite dev server                            |
| `npm run build`            | Build for production (runs icon generation first)    |
| `npm run preview`          | Preview the production build locally                 |
| `npm run typecheck`        | Type-check without emitting (CI gate)                |
| `npm test`                 | Run all tests                                        |
| `npm run test:unit`        | Run unit tests only                                  |
| `npm run test:integration` | Run integration tests                                |
| `npm run test:watch`       | Run tests in watch mode                              |
| `npm run test:coverage`    | Run tests with coverage report                       |
| `npm run lint`             | Lint source                                          |
| `npm run lint:check`       | Same command as `npm run lint`, no longer run in CI  |
| `npm run lint:warnings`    | ESLint, failing on any error and on warnings above the per-rule baseline (CI gate, replaces `lint:check`) |
| `npm run lint:pages`       | Enforce the Page pattern (CI gate)                   |
| `npm run lint:rtl`         | Physical left/right styling may not grow past its baseline, so the layout follows the reading direction (CI gate) |
| `npm run lint:size`        | No file grows past its line limit or its baseline entry (CI gate) |
| `npm run lint:format`      | Every file outside the shrinking baseline is Prettier-formatted (CI gate) |
| `npm run lint:layers`      | Imports only go downwards through the layers (CI gate) |
| `npm run lint:offline`     | Views reach `src/api/` only through the offline core; the baseline only shrinks (CI gate) |
| `npm run lint:dup`         | Lines in copied code blocks may only shrink per file, at SonarCloud's thresholds (CI gate) |
| `npm run lint:pairs`       | Desktop and phone views of a feature import its shared hook; every phone screen is listed (CI gate) |
| `npm run lint:skips`       | No focused test, and skipped tests may only go away (CI gate) |
| `npm run lint:i18n-keys`   | Every translation key the client names exists in `en` (CI gate) |
| `npm run theme:lint`       | Flag styling that bypasses the appearance tokens (not run in CI) |
| `npm run check:gl-split`   | Fail when one built chunk carries both map engines (MapLibre and Mapbox); run after a build |
| `npm run build:analyze`    | Production build with the bundle analyzer            |
| `npm run e2e`              | Playwright end-to-end tests; CI runs the public and app projects in Chromium and WebKit, the screenshot and help-media projects are local only |
| `npm run shots`            | Capture the wiki screenshots with Playwright         |
| `npm run shots:promote`    | Downscale the captured screenshots and move them into `wiki/assets/` |
| `npm run help:media`       | Record the help-center pictures against the real app on its own ports, so `npm run dev` can keep running |
| `npm run help:media:promote` | Convert the recorded help pictures to WebP and move them into `public/help-media/` |
| `npm run format`           | Format source                                        |

---

## 8. Commit & Push Your Changes

```bash
git add .
git commit -m "fix: describe your change"

# Push to your fork's dev branch
git push origin fix/my-changes

# Or if working directly on dev
git push origin dev
```

Then open a Pull Request from your fork to `liketrek/TREK` targeting the `dev` branch. If your PR only modifies files under `wiki/`, it is exempt from branch enforcement and may target any branch.

---

## Tips

- Always branch off from an up-to-date `dev` — run `git fetch upstream && git rebase upstream/dev` before starting new work.
- Run tests before pushing: `npm test` at the repo root runs all workspaces. That alone is not the full CI gate. With `shared` built, these are the checks CI runs before any test (`.github/workflows/test.yml` is the source of truth):
  - in `shared/`: `npm run typecheck && npm run contracts:open`
  - in `server/`: `npm run build && npm run typecheck && npm run typecheck:tests && npm run typecheck:scripts && npm run check:entities && npm run check:db-types && npm run lint:check && npm run db:call-graph -- --sync --tx && npm run lint:size && npm run lint:boundaries && npm run lint:tx && npm run lint:test-sql && npm run lint:dialect && npm run check:plugin-facts`
  - in `client/`: `npm run typecheck && npm run lint:warnings && npm run lint:pages && npm run lint:rtl && npm run lint:size && npm run lint:format && npm run lint:layers && npm run lint:offline && npm run lint:dup && npm run lint:pairs && npm run lint:skips && npm run lint:i18n-keys`
  - at the root, if you touched translations: `npm run i18n:parity:strict --workspace=shared`
- Follow the commit message conventions described in the [[Contributing]] guidelines.
