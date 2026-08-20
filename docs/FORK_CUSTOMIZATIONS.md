# Fork customizations to preserve

See [PWA Icon Design and Release](PWA_ICON_DESIGN_AND_RELEASE.md) for the
approved TREK app-icon direction, asset-generation pipeline, iOS cache-busting
requirements, and deployment verification checklist.

This file is the preservation checklist for `syyangv/TREK`. Review every item
when syncing from upstream. A clean merge is not sufficient evidence that these
behaviors survived.

## Deployment and release isolation

- Workflows must remain scoped to `syyangv/TREK`, not `liketrek/TREK` or another
  upstream repository.
- Images publish as `thvysy44/trek-fork` and production deploys an immutable
  digest, never a mutable branch or unverified tag.
- Production is the private Tailscale instance reached through the restricted
  deployment agent. Do not replace this with public hosting or direct SSH.
- The `production` GitHub environment requires manual approval.
- Required order: main CI and security scan, multi-architecture image release,
  production approval, deployment-agent rollout, `/api/health` verification.

See [CI/CD deployment](ci-cd-phase-3-4-deployment.md) and
[Tailscale self-hosting](TAILSCALE_SELF_HOSTING.md).

## Vacay and Obsidian

- Preserve the Vacay addon and its read-only Obsidian Yearly Glance import.
- Planned leave is imported directly from the vault's `请假计划.md` Markdown
  table (`Date | Type | Note`); Yearly Glance renders this source but is not a
  runtime dependency for Vacay. Treat `Type`, never title, color, or emoji, as
  the category authority. Supported values are `PTO`, `病假`, and `公共假期`.
- Keep the vault mounted read-only. Reconciliation may update TREK's derived
  Vacay rows, but must never modify `请假计划.md` or any Obsidian note.
- Preserve PTO, sick-leave, and public-holiday mappings and their locale keys.
- Vacay must default to the current configured calendar year, not the highest
  configured year.
- When a Vacay year is added, each user's base annual entitlement must inherit
  from the preceding year. The inherited `vacation_days` value is separate from
  `carried_over`; use 30 only when no preceding user-year configuration exists.
- Carry-over recalculation may update `carried_over` on an existing year, but it
  must not overwrite a base entitlement that the user configured for that year.
- Verify imported entries, company holidays, user entitlements, and existing
  persisted data after an upstream sync.

## PWA and offline behavior

- Workbox uses `registerType: 'prompt'` and a user-controlled update banner.
- The update prompt must not obscure offline, failed-sync, or conflict status.
- A failed service-worker activation remains retryable and must not create an
  unhandled promise rejection.
- App-version checks must not unregister service workers, force reloads, or wipe
  the persistent `map-tiles` cache.
- Mobile application layouts use dynamic viewport units where appropriate;
  fixed PDF/print layouts intentionally retain print-safe sizing.

See [PWA implementation handoff](pwa-template-handoff.md).

## CI-specific compatibility

- Keep fork-scoped workflows and environment variables intact when resolving
  upstream workflow conflicts.
- Run strict locale parity in addition to ordinary shared tests.
- Vitest uses a deterministic test-only alias for the virtual PWA registration
  module; production continues to use the Vite PWA plugin.
- The Docker security scan is a release gate. Fix reported dependencies rather
  than bypassing or weakening it.

## Post-sync acceptance checklist

- [ ] Login and authenticated navigation work.
- [ ] Existing database records and uploads remain present.
- [ ] Vacay opens on the current year and existing entries remain visible.
- [ ] `请假计划.md` future PTO and holiday rows import by `Type`, while
  unrelated Yearly Glance events such as flights do not become PTO.
- [ ] Obsidian/Yearly Glance data imports without destructive writes.
- [ ] PWA installs and an update produces the reload banner.
- [ ] Offline map cache is retained across a PWA update.
- [ ] Main CI, strict i18n parity, Docker smoke, Helm, and security gates pass.
- [ ] Released image matches the intended main commit and immutable digest.
- [ ] Private production `/api/health` returns `{"status":"ok"}`.

Update this document in the same PR whenever a new fork-only behavior is added.
