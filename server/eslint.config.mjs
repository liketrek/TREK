import js from '@eslint/js';

import gitignore from 'eslint-config-flat-gitignore';
import eslintConfigPrettier from 'eslint-config-prettier';
import tseslint from 'typescript-eslint';

import noPromiseAsValue from './eslint-rules/no-promise-as-value.mjs';

// Local rules live in eslint-rules/ and are exposed under the `trek/` prefix.
const trek = { rules: { 'no-promise-as-value': noPromiseAsValue } };

export default tseslint.config(
  gitignore({ strict: false }),
  {
    ignores: [
      'node_modules',
      'dist',
      'coverage',
      'public',
      'data',
      'uploads',
      'assets',
      'scripts/**',
      'reset-admin.js',
      '**/*.config.js',
      '**/*.config.ts',
      '**/*.config.mjs',
    ],
  },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  eslintConfigPrettier,
  {
    files: ['src/**/*.ts'],
    languageOptions: {
      parserOptions: {
        // Type-aware linting for src/: the project service asks TypeScript which
        // config owns a file, the way an editor does, so there is no `project`
        // array to keep in sync. Every file under src/ is in tsconfig.json's
        // `include`, so the service resolves them all.
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
      },
    },
  },
  {
    // tests/ needs the classic `project` instead. The project service looks for
    // the tsconfig.json nearest the file and refuses a file that config does not
    // include ("was not found by the project service"); tsconfig.json includes
    // only `src`, and its `allowDefaultProject` escape hatch rejects any glob
    // containing `**`, so it cannot cover a tree this size. `tsconfig.tests.json`
    // (the one `npm run typecheck:tests` uses) includes src + tests, which is
    // exactly the program these files need.
    files: ['tests/**/*.ts'],
    languageOptions: {
      parserOptions: {
        project: ['./tsconfig.tests.json'],
        tsconfigRootDir: import.meta.dirname,
      },
    },
  },
  {
    files: ['src/**/*.ts', 'tests/**/*.ts'],
    plugins: { trek },
    rules: {
      // trek/no-promise-as-value closes the hole the two rules below leave open:
      // with `strict: false`, a promise used as a plain VALUE (element access,
      // comparison, interpolation, spread, iteration, Object.keys/JSON.stringify)
      // type-checks clean and silently produces `any`, `false` or `[object
      // Promise]`. See eslint-rules/no-promise-as-value.mjs.
      'trek/no-promise-as-value': 'error',
      // --- The promise safety net for the Phase 1 async sweep (ORM migration) ---
      // Turning a DB-touching method `async` makes every unawaited call site a
      // silently reordered write, and every `if (svc.exists(id))` permanently
      // true — neither of which the type checker reports. These two rules are
      // the only thing that catches them, so they are errors, not warnings.
      '@typescript-eslint/no-floating-promises': ['error', { ignoreVoid: true }],
      '@typescript-eslint/no-misused-promises': [
        'error',
        { checksConditionals: true, checksVoidReturn: false, checksSpreads: true },
      ],
      // --- Severities tuned to keep CI green on a codebase that was never linted ---
      // (each rule below has pre-existing violations; surfaced as warnings, not blockers)
      '@typescript-eslint/no-explicit-any': 'warn',
      '@typescript-eslint/no-unused-vars': [
        'warn',
        { argsIgnorePattern: '^_', varsIgnorePattern: '^_', caughtErrorsIgnorePattern: '^_' },
      ],
      // The server is CommonJS (tsconfig module: commonjs); require() is intentional throughout.
      '@typescript-eslint/no-require-imports': 'warn',
      '@typescript-eslint/no-unsafe-function-type': 'warn',
      // js.recommended rules with pre-existing hits in the never-linted codebase.
      'no-empty': 'warn',
      'no-useless-escape': 'warn',
      'prefer-const': 'warn',
    },
  },
  {
    // Config-access guard: every env read in src/ goes through src/app-config
    // (readEnv() / derive functions / registerAs tokens). Direct process.env
    // access is banned outside the documented exemptions below — see
    // src/app-config/README.md for the rationale behind each.
    files: ['src/**/*.ts'],
    ignores: [
      // The config layer itself.
      'src/app-config/**',
      'src/nest/app-config/**',
      // Key-material resolution (file persistence + runtime rotation), not env config.
      'src/config.ts',
      // Scrubbed plugin child process — must not import app-config.
      'src/nest/plugins/runtime/plugin-host-entry.ts',
      // Child-env whitelist block: the env there is an IPC channel to the sandbox.
      'src/nest/plugins/supervisor/plugin-supervisor.ts',
      // Dynamic-key caps (process.env[name] with a computed name).
      'src/nest/plugins/host/daily-budget.ts',
      'src/nest/plugins/host/plugin-audit.ts',
    ],
    rules: {
      'no-restricted-syntax': [
        'error',
        {
          selector: "MemberExpression[object.name='process'][property.name='env']",
          message:
            'Read configuration via src/app-config (readEnv()/derive/tokens), not process.env. Exemptions: eslint.config.mjs + src/app-config/README.md.',
        },
        {
          // Bracket-notation variant (process['env']) — property is a Literal
          // node (.value), so the selector above can't match it.
          selector: "MemberExpression[object.name='process'][property.value='env']",
          message:
            'Read configuration via src/app-config (readEnv()/derive/tokens), not process.env. Exemptions: eslint.config.mjs + src/app-config/README.md.',
        },
      ],
    },
  },
  {
    // src/services/ is gone. It was the legacy layer this migration existed to
    // empty, and the last of it (airtrail) folded into src/nest/integrations/.
    //
    // The wall matters more than the deletion: the directory disappearing is not
    // what stops it coming back, because the way it grew was one file at a time,
    // each one reasonable on its own. A new domain goes to src/nest/<domain>/
    // with a service, a controller and a module.
    files: ['src/**/*.ts', 'tests/**/*.ts'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            {
              group: ['**/services/*', '**/services/**/*'],
              message:
                'src/services/ is deleted. New backend code goes to src/nest/<domain>/ (service + controller + module, registered in app.module.ts). See src/nest/README.md.',
            },
          ],
        },
      ],
    },
  },
  {
    // D4: the driver is an implementation detail of src/db. Nothing else in
    // src/ names `better-sqlite3` — a domain module that imports it is coupled
    // to the engine the ORM exists to abstract, and (for the value import)
    // reaches a connection the DI graph never handed it.
    //
    // `no-restricted-imports` is repeated rather than added to the src/services
    // block above because ESLint flat config REPLACES a rule's options with the
    // last matching config object's — a block that set only the driver path
    // would silently drop the services wall for every file it matches.
    files: ['src/**/*.ts'],
    ignores: [
      // The connection and the ORM's bound driver: this is where the engine lives.
      'src/db/database.ts',
      // openDatabase(): every better-sqlite3 handle the server opens (#2518).
      'src/db/connection.ts',
      'src/db/orm-driver.ts',
      'src/db/durability.ts',
      // The plugin sandbox opens its own per-plugin database files, deliberately
      // outside the app's ORM and connection.
      'src/nest/plugins/host/plugin-data.service.ts',
      // Frozen forever (ruling 7): invoked from inside numbered, already-shipped
      // MikroORM migrations — rewriting either onto the ORM would change what a
      // re-run of an old migration against an old schema snapshot produces,
      // which is never done to a landed migration. Not Plan 4's or any future
      // plan's to touch.
      'src/db/reseat-booked-nights.ts',
      'src/db/document-provider-seed.ts',
    ],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          paths: [
            {
              name: 'better-sqlite3',
              message:
                'The SQLite driver is an implementation detail of src/db. Go through the ORM (src/db/entities + src/db/repositories) or UnitOfWork; the handle itself is owned by src/db/database.ts.',
            },
          ],
          patterns: [
            {
              group: ['**/services/*', '**/services/**/*'],
              message:
                'src/services/ is deleted. New backend code goes to src/nest/<domain>/ (service + controller + module, registered in app.module.ts). See src/nest/README.md.',
            },
          ],
        },
      ],
    },
  },
  {
    // D4/D10: a repository is dialect-neutral. It talks to the ORM through
    // @mikro-orm/core and @mikro-orm/sql — never to a concrete driver package,
    // never to better-sqlite3 (the driver is wired once, in src/db/orm-driver.ts)
    // — and it never spells raw SQL inline: every database function goes through
    // src/db/dialect/sql-functions.ts, which dispatches on the live platform.
    //
    // Both rules restate the blocks above for the same flat-config reason: the
    // last matching config object's options REPLACE, not extend, the earlier
    // ones, so dropping either restatement would open a hole under
    // src/db/repositories/ only.
    files: ['src/db/repositories/**/*.ts'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          paths: [
            {
              name: '@mikro-orm/sqlite',
              message:
                'Repositories are dialect-neutral: import from @mikro-orm/sql / @mikro-orm/core. The driver lives in src/db/orm-driver.ts.',
            },
            {
              name: '@mikro-orm/postgresql',
              message:
                'Repositories are dialect-neutral: import from @mikro-orm/sql / @mikro-orm/core. The driver lives in src/db/orm-driver.ts.',
            },
            {
              name: 'better-sqlite3',
              message:
                'Repositories are dialect-neutral: import from @mikro-orm/sql / @mikro-orm/core. The driver lives in src/db/orm-driver.ts.',
            },
          ],
          patterns: [
            {
              group: ['**/services/*', '**/services/**/*'],
              message:
                'src/services/ is deleted. New backend code goes to src/nest/<domain>/ (service + controller + module, registered in app.module.ts). See src/nest/README.md.',
            },
          ],
        },
      ],
      'no-restricted-syntax': [
        'error',
        {
          selector: "MemberExpression[object.name='process'][property.name='env']",
          message:
            'Read configuration via src/app-config (readEnv()/derive/tokens), not process.env. Exemptions: eslint.config.mjs + src/app-config/README.md.',
        },
        {
          selector: "MemberExpression[object.name='process'][property.value='env']",
          message:
            'Read configuration via src/app-config (readEnv()/derive/tokens), not process.env. Exemptions: eslint.config.mjs + src/app-config/README.md.',
        },
        {
          selector: "CallExpression[callee.name='raw']",
          message:
            'Dialect SQL goes through src/db/dialect/sql-functions.ts, which dispatches on the live MikroORM platform. A repository must not spell raw SQL.',
        },
        {
          selector: "TaggedTemplateExpression[tag.name='sql']",
          message:
            'Dialect SQL goes through src/db/dialect/sql-functions.ts, which dispatches on the live MikroORM platform. A repository must not spell raw SQL.',
        },
      ],
    },
  },
  {
    // The plugin RPC decorator kit is written to stay extractable into its own
    // package, so its dependencies are pinned to Nest plus the two host modules it
    // genuinely needs. See src/nest/plugins/host/rpc-kit/README.md for what an
    // extraction would cost, and why the envelope import is the deliberate exception.
    files: ['src/nest/plugins/host/rpc-kit/**/*.ts'],
    rules: {
      // Written as a deny list rather than an allow list on purpose: these patterns
      // are gitignore-style, and a leading '**' would exclude the parent directory of
      // every allowed path, which makes the '!' re-includes silently ineffective.
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            {
              group: [
                // The host modules next door.
                '../rpc-host',
                '../rpc-errors',
                '../rpc-params',
                '../rate-limit',
                '../daily-budget',
                '../plugin-audit',
                '../plugin-jobs',
                '../plugin-guards.service',
                '../plugin-host-*',
                // Everything one level up, in plugins/ itself.
                '../../*.service',
                '../../*.module',
                '../../*.controller',
                '../../dependencies',
                '../../dev-link',
                '../../kill-switch',
                '../../paths',
                '../../plugin-backup',
                '../../signature-status',
                '../../text-sanitize',
                '../../install/**',
                '../../registry/**',
                '../../runtime/**',
                '../../supervisor/**',
                // The wire protocol, except the one file the kit validates against.
                '../../protocol/*',
                '!../../protocol/envelope',
                // Anything outside the plugin subtree, and the rest of the app.
                '../../../**',
                '@trek/**',
                'node:*',
              ],
              message:
                'rpc-kit stays extractable: it may import @nestjs/common, @nestjs/core, its own files, and type-only from ../../protocol/envelope and ../plugin-data.service. See rpc-kit/README.md.',
            },
          ],
        },
      ],
    },
  },
);
