# Contributing

Thanks for your interest in contributing to TREK! Here are the guidelines for submitting pull requests.

## Before You Start

- **Ask in Discord first** — Before writing any code, pitch your idea in the `#github-pr` channel on our [Discord server](https://discord.gg/NhZBDSd4qW). We'll let you know if the PR is wanted and give direction. PRs without prior approval will be closed
- **Check existing issues** — Look for open issues or discussions before starting work
- **Target the `dev` branch** — All PRs must be opened against `dev`, not `main`. Exception: PRs that only modify files under `wiki/` may target any branch
- **One thing per PR** — Keep PRs focused on a single change. Don't bundle unrelated fixes
- **Tests are required**: Your change must come with tests. The project holds 80% or more coverage, and a PR that drops it is closed
- **Stay up to date**: Your branch must be [up to date with `dev`](Development-environment#3-keep-your-fork-up-to-date) before you submit

## Pull Request Guidelines

### Code Quality

- Write clean, readable code that matches the existing style
- No unnecessary abstractions or over-engineering
- Don't add features beyond what was discussed in the issue
- Don't add comments unless the logic isn't self-evident
- Don't add error handling for scenarios that can't happen

### What We Look For

- **Does it solve the stated problem?** — The PR should match the issue it addresses
- **Is it minimal?** — No extra refactoring, no "while I'm here" changes
- **Does it break anything?** — Breaking changes are not acceptable
- **Is the code clean?** — Consistent style, no debug logs, no dead code

### Commit Messages

Use conventional commits:
```
fix(component): short description of what was fixed
feat(component): short description of new feature
```

### PR Description

Follow the template provided by default (.github/PULL_REQUEST_TEMPLATE.md). A PR description contains:

- **Summary:** what changes and why, in one to three bullet points
- **Test plan:** how you verified it works
- **Linked issue:** for example `Fixes #123`

### What Will Get Your PR Closed

- PRs that weren't discussed and approved in `#github-pr` on Discord first
- PRs that add unnecessary complexity (e.g. a redo button when undo already exists)
- PRs with breaking changes
- PRs that reformat or refactor unrelated code
- PRs that change code style or formatting across unrelated files
- PRs that add dependencies without justification

## Development Setup

See the [[Development Environment|Development-environment]] page for the full setup guide, including forking, remote configuration, branch conventions, and available scripts.

## Tech Stack

| Layer | Technology                                                                                |
|---|-------------------------------------------------------------------------------------------|
| Frontend | React 19, TypeScript, Zustand 5, Leaflet, Tailwind CSS 3.4, Vite 8 (Rolldown)             |
| Backend | NestJS 11 (Express 4 adapter), TypeScript, better-sqlite3, Zod (@trek/shared)             |
| Real-time | WebSocket (ws)                                                                            |
| Database | SQLite with WAL mode                                                                      |
| Auth | JWT (HS256), bcrypt, TOTP MFA, passkeys (WebAuthn), OIDC                                 |
| Maps | Leaflet + react-leaflet (default, OpenFreeMap vector basemap via maplibre-gl-leaflet), MapLibre GL 5, Mapbox GL 3, Valhalla, OSRM, Photon, Nominatim |
| i18n | 28 languages, EN canonical (locale directories live in shared/src/i18n/)                  |

Documentation changes go to `wiki/`. The same pages ship inside the app: the in-app help reads them (served under `/api/help`) and links into them, and the MCP help tools search them, so a wiki edit reaches users with the next release as well as the GitHub wiki.

Beyond the tests, CI enforces a set of quality gates: type checks, lint ratchets that may only shrink, and a SonarCloud gate on new code (80% coverage, at most 3% duplicated lines). The [[Development Environment|Development-environment]] page lists the commands, and the `CLAUDE.md` file of each package explains its rules. Desktop and phone views of a feature share one hook, so a feature that touches both keeps its logic in that hook.

Every translation key must exist in all 28 locales, the `Shared: i18n Parity` CI job fails on drift, so run `npm run i18n:parity:strict --workspace=shared` before pushing. Add a real translation to every locale; an English placeholder in a non-English file is not accepted. Two directory names differ from the language they hold: Brazilian Portuguese is `br`, Greek is `gr`.
