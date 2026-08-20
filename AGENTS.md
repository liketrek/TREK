## Agent skills

### Issue tracker

Issues and specs are tracked in GitHub Issues. See `docs/agents/issue-tracker.md`.

### Triage labels

Use the five default triage labels. See `docs/agents/triage-labels.md`.

### Domain docs

Use a multi-context layout for `client`, `server`, and `shared`. See `docs/agents/domain.md`.

### Validation

Client Vitest paths must be workspace-relative: `npm run test --workspace=client -- src/...`.

Server integration tests require a local listening socket; rerun outside the sandbox when `listen EPERM` occurs.

### Production release

Merge to `main`, wait for CI, Security Scan, and the stable release, then deploy the verified version through `deploy-production.yml`.

Production deployment requires environment approval and must finish with `/api/health` returning `{"status":"ok"}`.

### Push workflow

When the user requests a push, include existing local changes unless they explicitly exclude them.
