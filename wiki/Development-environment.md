# Developer Setup Guide

> Before anything else, please read the [[Contributing]] guidelines.

## Prerequisites

- Node.js 22+
- npm
- Git
- A GitHub account

---

## 1. Fork & Clone the Repository

Go to the [TREK repository](https://github.com/mauriceboe/TREK) and click **Fork** to create your own copy.

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
git remote add upstream git@github.com:mauriceboe/TREK.git
```

You should now have two remotes:

| Remote     | URL                                          | Purpose                        |
|------------|----------------------------------------------|--------------------------------|
| `origin`   | `git@github.com:your-username/TREK.git`      | Your fork — push changes here  |
| `upstream` | `git@github.com:mauriceboe/TREK.git`         | Main repo — pull updates from here |

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
git checkout -b fix/my-changes origin/dev
```

Branch naming conventions:
- `feat/short-description` for new features
- `fix/short-description` for bug fixes
- `chore/short-description` for maintenance tasks

---

## 5. Install Dependencies

Install dependencies for both the client and server:

```bash
# Client
cd client
npm i

# Server
cd ../server
npm i
```

---

## 6. Available Scripts

### Server (`/server`)

| Command                    | Description                              |
|----------------------------|------------------------------------------|
| `npm start`                | Start the server (production)            |
| `npm run dev`              | Start the server in watch mode (tsx)     |
| `npm test`                 | Run all tests                            |
| `npm run test:unit`        | Run unit tests only                      |
| `npm run test:integration` | Run integration tests                    |
| `npm run test:ws`          | Run WebSocket tests                      |
| `npm run test:watch`       | Run tests in watch mode                  |
| `npm run test:coverage`    | Run tests with coverage report           |

### Client (`/client`)

| Command                  | Description                                          |
|--------------------------|------------------------------------------------------|
| `npm run dev`            | Start the Vite dev server                            |
| `npm run build`          | Build for production (runs icon generation first)    |
| `npm run preview`        | Preview the production build locally                 |
| `npm test`               | Run all tests                                        |
| `npm run test:unit`      | Run unit tests only                                  |
| `npm run test:integration` | Run integration tests                              |
| `npm run test:watch`     | Run tests in watch mode                              |
| `npm run test:coverage`  | Run tests with coverage report                       |

---

## 7. Commit & Push Your Changes

```bash
git add .
git commit -m "fix: describe your change"

# Push to your fork's dev branch
git push origin fix/my-changes:dev

# Or if working directly on dev
git push origin dev
```

Then open a Pull Request from your fork to `mauriceboe/TREK` targeting the `dev` branch. If your PR only modifies files under `wiki/`, it is exempt from branch enforcement and may target any branch.

---

## Tips

- Always branch off from an up-to-date `dev` — run `git fetch upstream && git rebase upstream/dev` before starting new work.
- Run tests before pushing: `npm run test` in both `client/` and `server/`.
- Follow the commit message conventions described in the [[Contributing]] guidelines.