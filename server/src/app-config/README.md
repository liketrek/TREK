# app-config — TREK's environment configuration layer

One validated source of truth for every environment variable the server reads.
Framework-free (no Nest imports), so it is consumable from anywhere: Nest DI
classes, the legacy free-function services, mcp, websocket, scheduler, db and
the pre-init Express middleware.

```
env.schema.ts    Zod catalog of the whole env surface; fail-fast at boot
derive.ts        pure (raw env) → typed namespace functions, exact per-site coercions
env.ts           readEnv() live accessor + validateEnvAtBoot()
app-url.ts       getAppUrl()/getMcpSafeUrl() instance base-URL resolution
data-paths.ts    resolveDataPaths(): data/, uploads/, backups, tmp, logs, key files, DB file
boot-validate.ts side-effect import used by index.ts (validates before other modules load)
parsers.ts       shared coercion helpers (boolTrueLoose, numberOr, csvList, …)
```

The Nest binding lives in `src/nest/app-config/` (`AppConfigModule`, registerAs
tokens, `RuntimeEnvService`) and consumes the SAME derive functions.

## Invariants — read before touching anything here

1. **`readEnv()` is live.** It re-derives from the current `process.env` on
   every call, with no caching or memoization, ever. ~60 test files mutate
   `process.env` at runtime and depend on the next read observing the change.
2. **Validation runs once, at boot, from the production entrypoint only.**
   Never wire the schema into `buildApp()`, `ConfigModule.forRoot({ validate })`
   or a request path. Unset/blank variables always pass (defaults apply); only
   present-but-malformed values abort startup. The one addition on top of the
   schema is `managedPreconditions()` in `env.ts`: cross-field rules that only
   apply with `TREK_MANAGED`, for combinations that are individually valid and
   together wrong. It is empty without the switch, so a self-hoster never meets
   it. Put a rule there only if booting anyway would be a security or data
   problem — not to enforce a preference.
   The report prints each malformed value, because that is what makes a typo
   findable, except for the credentials in `SECRET_ENV_KEYS` (`env.ts`), which
   print as `***`. A new password, token, key or secret variable goes into that
   set; `validate.test.ts` fails on a credential-sounding name missing from it.
3. **Parity is law — with one deliberate exception.** Every derived field pins
   the exact coercion of the call site(s) it replaced (`Number(x) || d`
   treating `"0"` as unset, per-site defaults for the same variable, …). Do not
   "fix" a quirk here; log it as a follow-up instead. The exception: **boolean
   switches are unified** through `parseBool` — every boolean-like variable
   accepts `true/1/on/yes` and `false/0/off/no` (any casing) and derives to a
   real boolean. This intentionally replaces the legacy per-site literals
   (`'true'` here, `'1'` there, `'on'` elsewhere); tests that pinned those
   narrow literals get updated when their call site migrates.
4. **Env vs DB-setting layering stays at the call site.** For
   `process.env.X || getSetting('x')` patterns, this layer supplies only the
   env half; the runtime-mutable admin-setting fallback remains inline where it
   was.
5. **Never convert a frozen read to a live read or vice versa.** Modules that
   captured env in module-top `const`s (mcp, backupService, ssrfGuard, plugin
   rate limits, …) keep freeze-at-import timing, merely sourcing the value from
   `readEnv()` at module top. Request-time reads stay request-time.

## data-paths.ts: the one data layout

`resolveDataPaths()` is the only place the server anchors `data/` and
`uploads/` (on `SERVER_ROOT`, the package directory, never on `process.cwd()`)
and names what lives in them: backups, the scratch dir, the logs, the JWT
secret and encryption key files, and the database file (TREK_DB_FILE when set,
else `data/travel.db`). Never derive one of these paths from `__dirname` in a
new file: a moved file would quietly move the data.

Two ways in, by where the code runs:

- **Nest providers inject `DataPathsService`** (`src/nest/app-config/`), which
  resolves the same layout once per built app: `AdminService` (the JWT secret
  file), `StorageRegistryService` (the built-in uploads and backups roots and
  the scratch dir) and, through `StorageRegistryService.tempDir()`,
  `StorageJobsService`. A new provider that needs a data path takes it the
  same way.
- **Plain modules call `resolveDataPaths()`** because they run without a
  container or are shared with code that does: `config.ts` key resolution,
  `db/db-path.ts`, `index.ts`, the file logger, `demo/demo-reset.ts`, the
  backup restore and archive functions (`nest/backup/backup.impl.ts`,
  `auto-backup.settings.ts`, file I/O with no container state), the plugin
  trees (`nest/plugins/paths.ts`, also read by the out-of-process supervisor),
  and `nest/storage/storage-paths.ts`, which keeps the seed-config test seam
  that `StorageAdminService` and the registry share. `files.constants.ts`
  still exports `filesDir` for the tests that pin the layout; no production
  code reads it.

## app-url.ts — instance base-URL resolution (moved 2026-07-28)

`getAppUrl()` (APP_URL → first ALLOWED_ORIGINS entry → `http://localhost:PORT`,
each candidate URL-validated, ALL trailing slashes stripped) and
`getMcpSafeUrl()` (same, sanitized to HTTPS/localhost/127.0.0.1 for the MCP
SDK's issuer check) moved here **verbatim** from `services/notifications.ts`
(audit findings `auth-2`/`notifications-1`/`admin-3`/`mcp-1`). They follow
invariant 1: `readEnv()` per call, live, never cached. The invalid-URL silent
fallthrough and the strip-ALL-slashes quirk (see `parsers.ts`
`stripTrailingSlashes`) are parity-pinned — do not "fix" them here.

## Ownership: one door per variable

Every variable has exactly one owner, and the owner decides how it is read:

- **A registerAs token** (`src/nest/app-config/tokens.ts`, derived by
  `boot-derive.ts`): boot-stable values that only Nest classes need. The token
  is snapshotted per built app and injected (`@Inject(storageConfig.KEY)`, or
  `app.get(httpConfig.KEY)` for the pre-init Express layer). Today:
  `httpConfig` (TRUST_PROXY, HSTS_INCLUDE_SUBDOMAINS, HTTP_KEEP_ALIVE_TIMEOUT_MS),
  `storageConfig` (TREK_PLACE_PHOTO_DIR), `transitConfig` (TRANSIT_API_URL,
  for TransitService) and `kitineraryConfig` (KITINERARY_EXTRACTOR_PATH and
  PATH, for KitineraryExtractorService's binary probe). A module whose provider
  injects one imports `AppConfigModule`, so it also builds on its own in a test.
- **`readEnv()` / `RuntimeEnvService`** (`derive.ts`): everything else, both
  the runtime-toggled values and the boot-stable ones that code outside a Nest
  provider reads, which freezes them in module-top consts. Each of those has a
  reader the container cannot inject into:
  - PORT, HOST: `index.ts`, before the app exists.
  - SESSION_DURATION(_REMEMBER), DEFAULT_LANGUAGE, ENCRYPTION_KEY: `src/config.ts`,
    a plain module evaluated at process start.
  - MCP_*: `src/mcp/`, the process-wide session state.
  - TREK_PLUGIN_RPC_*/LOG_*/MAX_RSS_MB: the plugin host and supervisor, which
    are deliberately not Nest (the sandbox boundary).
  - TREK_PLUGIN_REGISTRY_URL: `PluginRegistryService` is a provider, but several
    plugin suites build it by hand with a trailing `@Optional()` UnitOfWork, so
    a required token parameter cannot go in without reordering that signature.
  - TREK_WIKI_DIR: `nest/help/wiki.ts`, a plain module the help MCP tools call.
  - BACKUP_*: `nest/backup/backup-archive.ts`, which the first-start restore
    (`boot-restore.ts`, called from `index.ts`) runs before the database opens.
  - LOG_LEVEL: the logger, imported everywhere.
  - ALLOW_INTERNAL_NETWORK, ALLOW_LINK_LOCAL_IPS: the SSRF guard in `utils/`.
  - TREK_DB_FILE, TREK_DB_JOURNAL_MODE, TREK_DB_SYNCHRONOUS: the database,
    opened before the container.

`deriveAll()` never reads a variable a token owns, and a token is dropped once
nothing injects it. `tests/unit/app-config/config-ownership.test.ts` records
the keys each side reads through a Proxy and fails on an overlap, on a token
without a consumer and on a variable the schema does not validate. Moving a
variable to a token means moving its field from `derive.ts` to
`boot-derive.ts` and converting every reader in the same change.

`server/.env.example` names every variable the schema validates except the
few in `env-reference.test.ts`'s `NOT_OPERATOR_SETTINGS`; that test fails on
drift in either direction. The managed-hosting switches (TREK_MANAGED and the
keys only a managed install sets: MAPBOX_ACCESS_TOKEN, CARTO_API_KEY,
PLACES_API_BASE) are on that list on purpose and stay out of every public
reference.

## Classification: boot-stable vs runtime-toggled

**Boot-stable** (frozen at app/module creation; a `registerAs` token where the
variable is token-owned, module-top `readEnv()` consts elsewhere):
PORT, HOST, TRUST_PROXY, HSTS_INCLUDE_SUBDOMAINS, HTTP_KEEP_ALIVE_TIMEOUT_MS, SESSION_DURATION(_REMEMBER), MCP_SESSION_TTL,
MCP_MAX_SESSION_PER_USER, MCP_SSE_KEEPALIVE, TREK_PLUGIN_RPC_*/LOG_*/MAX_RSS_MB,
TREK_PLUGIN_REGISTRY_URL, TREK_WIKI_DIR*, TREK_PLACE_PHOTO_DIR, BACKUP_*,
TRANSIT_API_URL, KITINERARY_EXTRACTOR_PATH, LOG_LEVEL*, ALLOW_INTERNAL_NETWORK*, ALLOW_LINK_LOCAL_IPS*, DEFAULT_LANGUAGE,
TREK_DB_FILE, TREK_DB_JOURNAL_MODE, TREK_DB_SYNCHRONOUS, ENCRYPTION_KEY**.
(* frozen today because the consuming module captures it at import; tests that
override these set them at file top, before the SUT import.)
(** ENCRYPTION_KEY is boot-stable for the cipher key material itself —
`src/config.ts` resolves and freezes it at process start, per the exemption
below.)

**Runtime-toggled** (read live on every access via `readEnv()` /
`RuntimeEnvService`; tests mutate these mid-lifetime):
TREK_MANAGED, PLACES_API_BASE, PLACES_API_KEY, AMAP_API_BASE, AMAP_API_KEY, AMAP_API_SECRET, MAPBOX_ACCESS_TOKEN, CARTO_API_KEY, DEMO_MODE, NODE_ENV, APP_VERSION, APP_URL, TREK_API_DOCS_ENABLED,
TREK_PLUGINS_ENABLED / _DEV_LINK / _IGNORE_TREK_RANGE / _DIR / _DATA_DIR / TREK_PLUGIN_PERMISSIONS,
OIDC_*, SMTP_*, FORCE_HTTPS, COOKIE_SECURE,
ALLOWED_ORIGINS, UNSPLASH_ACCESS_KEY, WEBAUTHN_*, TZ, ADMIN_EMAIL,
TREK_DB_PRE_MIGRATE_SNAPSHOT(_KEEP) (read when a migration run starts; the
legacy-upgrade suites set it per file),
ADMIN_PASSWORD, IDEMPOTENCY_TTL_SECONDS, MCP_RATE_LIMIT (request-path check),
LLM_TIMEOUT_MS, NOMINATIM_URL, VAPID_* (resolved per use by the Web Push key
service, which the notification suites build without the container).

## Exemptions — raw `process.env` stays

- `src/nest/plugins/runtime/plugin-host-entry.ts` — runs in a scrubbed child
  process; must not import this layer.
- `src/nest/plugins/supervisor/plugin-supervisor.ts` child-env whitelist block —
  the env there is an IPC channel to the sandbox, not app configuration.
- Dynamic-key reads (`process.env[name]`) in `plugins/host/daily-budget.ts` and
  `plugins/host/plugin-audit.ts`.
- `src/config.ts` ENCRYPTION_KEY/JWT_SECRET resolution — key material with file
  persistence and runtime rotation, not env config.
- Standalone scripts (`reset-admin.js`, `scripts/*`) and `tests/**`. Note that
  `reset-admin.js` and `scripts/migrate-encryption.ts` open the database file
  read-write and therefore re-implement `TREK_DB_JOURNAL_MODE` /
  `TREK_DB_SYNCHRONOUS` inline (the journal mode lives in the file header, so
  they must agree with the server). Neither can import this layer — the image
  ships `dist/`, not `src/` — so the defaults in `parsers.resolveDurability()`
  and in those two files move together.

The exemption list is enforced by the `no-restricted-syntax` ban on
`process.env` in `eslint.config.mjs` — keep the two lists in sync.

## Follow-up candidates (quirks pinned during the migration, deliberately NOT fixed)

- `numberOr` (`Number(x) || d`) treats `"0"` and negative-invalid values oddly:
  `PORT=0` silently becomes 3001, `TREK_PLUGIN_RPC_BURST=-5` stays -5.
- APP_URL trailing-slash stripping differs per site (feeds strips one slash,
  notifications strips all).
- `DEMO_ADMIN_EMAIL` defaults differ (demo-seed: admin@trek.app, demo-reset:
  admin@nomad.app).
- NODE_ENV comparisons are case-sensitive at some sites (HSTS activation,
  platform statics, spa-fallback, authService dev_mode, oidcService
  frontendUrl) and case-insensitive at others.
