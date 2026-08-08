import js from '@eslint/js';

import gitignore from 'eslint-config-flat-gitignore';
import eslintConfigPrettier from 'eslint-config-prettier';
import tseslint from 'typescript-eslint';

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
    files: ['src/**/*.ts', 'tests/**/*.ts'],
    rules: {
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
);
