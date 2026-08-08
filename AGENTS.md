# Repository Guidelines

## Project Structure & Module Organization

TREK is an npm workspace organized around three core packages. `client/` contains the Vite/React application, with UI code in `src/`, browser assets in `public/`, Vitest suites in `tests/`, and Playwright scenarios in `e2e/`. `server/` holds the TypeScript backend, grouped under `src/`, with unit, integration, WebSocket, and end-to-end tests under `tests/`. `shared/` provides domain schemas and types consumed by both applications; keep cross-boundary contracts here. `plugin-sdk/` is a separately managed package. Documentation and deployment resources live in `docs/`, `wiki/`, and `charts/`.

## Build, Test, and Development Commands

- `npm ci`: install the locked root workspace dependencies.
- `npm run dev`: build `shared`, watch it, and start the server and client together.
- `npm run build`: produce shared, server, and client builds in dependency order.
- `npm test`: run all core Vitest suites once.
- `npm run test:cov`: collect client and server coverage.
- `npm run lint` / `npm run format:check`: validate ESLint and Prettier rules.
- `npm run test:unit --workspace=client`: run a focused workspace suite; substitute `server` as needed.
- `npm run e2e --workspace=client`: run Playwright browser tests.

Run `npm ci`, `npm run build`, and `npm test` inside `plugin-sdk/` when changing that package.

## Coding Style & Naming Conventions

Use TypeScript and follow neighboring module patterns. Prettier enforces 2-space indentation, 120-column lines, single quotes, semicolons, and sorted imports; run formatting instead of manually arranging imports. ESLint is configured per workspace. Name React components and their files in PascalCase, hooks as `useSomething`, other functions and variables in camelCase, and domain directories in lowercase. Avoid unrelated formatting or lint-configuration changes.

## Testing Guidelines

Vitest is the primary unit and integration framework; Playwright covers client browser flows. Name tests `*.test.ts(x)` in `tests/` or `*.spec.ts` beside shared schemas. Add regression coverage with every behavioral change and keep aggregate coverage at or above 80%.

## Commit & Pull Request Guidelines

Use conventional commits such as `fix(maps): correct zoom level on Safari` or `feat(budget): add CSV export`. Discuss proposed code changes in Discord's `#github-pr` channel first. Keep one change per PR, preserve backward compatibility, update from `dev`, and target `dev` (wiki-only changes are exempt). Include a concise description, related issue or approved discussion, test plan, updated tests/docs, and screenshots for visible UI changes.

## Agent skills

### Issue tracker

Track issues and specs in GitHub Issues for `mnlauaa/TREK`. See `docs/agents/issue-tracker.md`.

### Triage labels

Use the five canonical triage labels when classifying issues. See `docs/agents/triage-labels.md`.

### Domain docs

Use the single-context domain layout: root `CONTEXT.md` and system-wide ADRs in `docs/adr/`. See `docs/agents/domain.md`.
