# Developer Setup Guide

> Before anything else, please read the [[Contributing]] guidelines.

## Prerequisites

- Node.js 22+
- npm
- Git
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

The repo is an npm workspace monorepo. One command at the root installs everything:

```bash
npm ci
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
# Required: path to the extractor binary
KITINERARY_EXTRACTOR_PATH=/usr/local/bin/kitinerary-extractor

# Prevent Qt from probing for a display in headless/server environments
QT_QPA_PLATFORM=offscreen

# KDE cache directory (avoids writing to $HOME)
XDG_CACHE_HOME=/tmp/kf6-cache
```

You can override `KITINERARY_EXTRACTOR_PATH` if you installed the binary to a different location.

---

## 7. Available Scripts

### Root (`/`)

These commands run across all workspaces at once and are the recommended way to work:

| Command              | Description                                                         |
|----------------------|---------------------------------------------------------------------|
| `npm run dev`        | Build shared, then start shared (watch), server, and client together via `concurrently` |
| `npm run build`      | Build shared → server → client in order                            |
| `npm test`           | Run tests in shared, server, and client                            |
| `npm run test:cov`   | Run coverage for server and client                                 |
| `npm run test:e2e`   | Run end-to-end tests (server)                                      |
| `npm run lint`       | Lint shared, server, and client                                    |
| `npm run format`     | Format shared, server, and client                                  |
| `npm run format:check` | Check formatting across all workspaces                           |

### Shared (`/shared`)

The `@trek/shared` package is the single source of truth for code shared between the client and server. It holds the **Zod schemas that define the API contracts** (request/response shapes, common primitives, pagination) and the **i18n translation layer** (per-language keys and types). Both workspaces import from it, so schema and translation changes propagate to both sides from one place.

> **Tip:** run `npm run i18n:parity` (or `i18n:parity:strict`) in this package to verify every locale exposes the same translation keys — the CI parity gate runs the strict variant.

| Command                     | Description                          |
|-----------------------------|--------------------------------------|
| `npm run build`             | Compile shared package (tsup)        |
| `npm run build:watch`       | Compile in watch mode                |
| `npm test`                  | Run tests                            |
| `npm run test:watch`        | Run tests in watch mode              |
| `npm run typecheck`         | Type-check without emitting          |
| `npm run i18n:parity`       | Check locale key parity              |
| `npm run i18n:parity:strict`| Strict locale key parity (CI gate)   |
| `npm run lint`              | Lint source                          |
| `npm run format`            | Format source                        |
| `npm run format:check`   | Check formatting                  |

### Server (`/server`)

| Command                    | Description                              |
|----------------------------|------------------------------------------|
| `npm start`                | Start the server (production)            |
| `npm run dev`              | Start the server in watch mode           |
| `npm run build`            | Compile server                           |
| `npm run typecheck`        | Type-check without emitting              |
| `npm test`                 | Run all tests                            |
| `npm run test:unit`        | Run unit tests only                      |
| `npm run test:integration` | Run integration tests                    |
| `npm run test:ws`          | Run WebSocket tests                      |
| `npm run test:e2e`         | Run end-to-end tests                     |
| `npm run test:watch`       | Run tests in watch mode                  |
| `npm run test:coverage`    | Run tests with coverage report           |
| `npm run lint`             | Lint source                              |
| `npm run format`           | Format source                            |

### Client (`/client`)

| Command                    | Description                                          |
|----------------------------|------------------------------------------------------|
| `npm run dev`              | Start the Vite dev server                            |
| `npm run build`            | Build for production (runs icon generation first)    |
| `npm run preview`          | Preview the production build locally                 |
| `npm test`                 | Run all tests                                        |
| `npm run test:unit`        | Run unit tests only                                  |
| `npm run test:integration` | Run integration tests                                |
| `npm run test:watch`       | Run tests in watch mode                              |
| `npm run test:coverage`    | Run tests with coverage report                       |
| `npm run lint`             | Lint source                                          |
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
- Run tests before pushing: `npm test` at the repo root runs all workspaces.
- Follow the commit message conventions described in the [[Contributing]] guidelines.
