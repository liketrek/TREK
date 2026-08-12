# Upstream synchronization workflow

Use this procedure to integrate upstream TREK updates without losing the
customizations in [FORK_CUSTOMIZATIONS.md](FORK_CUSTOMIZATIONS.md).

## 1. Inspect before merging

```bash
git status --short --branch
git remote -v
git fetch upstream
git log --oneline --decorate main..upstream/main
git diff --stat main...upstream/main
```

Start only from a clean working tree. Preserve unrelated work on its own branch
or in a clearly named stash. Never include `.env`, credentials, tokens, or
deployment secrets in the comparison, commits, or documentation.

## 2. Create a dedicated integration branch

```bash
git switch main
git pull --ff-only origin main
git switch -c sync/upstream-<version>
git merge --no-ff upstream/main
```

Do not force-push or reset protected `main`. Resolve conflicts by understanding
both sides; do not automatically accept all upstream or all fork changes.

## 3. Resolve with the preservation checklist

For every conflict or upstream rewrite:

1. Read the corresponding item in `FORK_CUSTOMIZATIONS.md`.
2. Preserve upstream fixes unless they contradict a documented fork invariant.
3. Reapply the fork behavior using the smallest maintainable integration.
4. Keep workflow repository guards, private image coordinates, Tailscale agent
   deployment, Vacay/Obsidian behavior, and PWA cache semantics intact.
5. Record any new recurring merge decision in the preservation document.

Pay special attention to `.github/workflows`, `client/src/App.tsx`,
`client/vite.config.js`, Vacay client/server code, locale files, deployment
scripts, and Docker/Compose configuration.

## 4. Verify locally

Run the gates relevant to the changed areas. For a broad upstream integration,
use the full set:

```bash
npm run build
npm run lint
npm test
node shared/scripts/i18n-parity.mjs --strict
```

Also run focused regression tests for every preserved customization. If a test
cannot be run locally, state that explicitly in the PR and rely on the named CI
gate rather than implying it passed.

## 5. Commit, push, and review

```bash
git add <intentional-files>
git commit -m "chore: integrate upstream <version>"
git push -u origin sync/upstream-<version>
gh pr create --repo syyangv/TREK --base main --head sync/upstream-<version>
```

The PR description should list:

- upstream ref/version and commit;
- fork behaviors deliberately preserved;
- conflict-resolution decisions;
- local verification and known limitations;
- any migration, persistence, or deployment risk.

Require all repository checks to pass. Address failures through additional PR
commits; do not bypass branch protection or silently weaken a gate.

## 6. Release and deploy

After merging:

1. Monitor main CI and the security scan for the merge commit.
2. Confirm `Build & Push Docker Image` publishes a stable release and a
   multi-architecture immutable digest.
3. If Docker Scout fails, update the vulnerable dependencies through a separate
   protected PR, then allow the release to rebuild from the fixed main commit.
4. Trigger `deploy-production.yml` with the exact released semantic version.
5. Approve the protected `production` environment in GitHub.
6. Confirm the restricted agent deploys the exact digest.
7. Require both agent success and private tailnet `/api/health` success.

Do not deploy an image from an earlier commit merely because it already exists.

## 7. Post-deployment verification

Record the following in the session or release report:

- merged commit SHA;
- release version;
- immutable image digest;
- CI, security, release, and deployment run URLs;
- health response;
- results of the fork acceptance checklist.

For UI/data changes, manually verify login, persisted data/uploads, Vacay,
Obsidian synchronization, and the PWA update path on the private production URL.

## Lessons from the v3.4.1 integration

- PR checks can pass while the main-branch security scan later blocks release;
  both must be monitored for the exact release commit.
- Focused tests did not expose strict locale parity or a missing Vitest virtual
  PWA module alias; full CI found both.
- Production environment approval cannot be completed by automation and must be
  performed by an authorized GitHub user.
- A successful deployment is not complete until the exact image digest and
  private production health response are recorded.

