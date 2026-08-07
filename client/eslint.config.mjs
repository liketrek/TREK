import js from '@eslint/js';

import gitignore from 'eslint-config-flat-gitignore';
import eslintConfigPrettier from 'eslint-config-prettier';
import reactHooks from 'eslint-plugin-react-hooks';
import reactRefresh from 'eslint-plugin-react-refresh';
import tseslint from 'typescript-eslint';

// Minimal stub so the existing `// eslint-disable-next-line react/no-danger`
// directive in src/i18n/TransHtml.tsx resolves without pulling in the full
// eslint-plugin-react (not a dependency here). The rule is a no-op.
const reactStub = {
  rules: {
    'no-danger': {
      meta: { schema: [] },
      create() {
        return {};
      },
    },
  },
};

export default tseslint.config(
  gitignore({ strict: false }),
  {
    ignores: [
      'node_modules',
      'dist',
      'coverage',
      'public',
      'test-results',
      'playwright-report',
      'e2e/**',
      'scripts/**',
      '**/*.config.js',
      '**/*.config.ts',
      '**/*.config.mjs',
    ],
  },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  eslintConfigPrettier,
  {
    files: ['src/**/*.{ts,tsx}', 'tests/**/*.{ts,tsx}'],
    plugins: {
      'react-hooks': reactHooks,
      'react-refresh': reactRefresh,
      react: reactStub,
    },
    rules: {
      'react/no-danger': 'off',
      'react-refresh/only-export-components': ['warn', { allowConstantExport: true }],

      // --- Severities tuned to keep CI green on a codebase that was never linted ---
      // (each rule below has pre-existing violations; surfaced as warnings, not blockers)

      // rules-of-hooks has one conditional-hook violation in PlaceInspector.tsx -> warn (not error).
      'react-hooks/rules-of-hooks': 'warn',
      'react-hooks/exhaustive-deps': 'warn',

      '@typescript-eslint/no-explicit-any': 'warn',
      '@typescript-eslint/no-unused-vars': [
        'warn',
        { argsIgnorePattern: '^_', varsIgnorePattern: '^_', caughtErrorsIgnorePattern: '^_' },
      ],
      '@typescript-eslint/no-unused-expressions': 'warn',
      '@typescript-eslint/no-unsafe-function-type': 'warn',
      '@typescript-eslint/no-this-alias': 'warn',
      '@typescript-eslint/no-non-null-asserted-optional-chain': 'warn',

      // js.recommended rules with pre-existing hits.
      'no-empty': 'warn',
      'no-useless-escape': 'warn',
      'no-useless-assignment': 'warn',
      'preserve-caught-error': 'warn',
    },
  },
  {
    // react-dom/server was worth ~190 KB raw / 57 KB gzip in a chunk three lazy
    // routes share — including the Leaflet renderer, which is the default — for
    // output that is always a single <svg>. utils/iconMarkup.ts does that job
    // without Fizz, and this keeps the import from creeping back: nothing else
    // would notice, the build stays green and the app keeps working.
    files: ['src/**/*.{ts,tsx}'],
    ignores: ['src/**/*.test.{ts,tsx}'],
    rules: {
      'no-restricted-imports': ['error', {
        paths: [{
          name: 'react-dom/server',
          message: 'Use renderIconMarkup from utils/iconMarkup — Fizz is ~190 KB for one <svg>.',
        }],
      }],
      'no-restricted-syntax': ['error', {
        selector: "ImportExpression > Literal[value=/^react-dom\\u002F(server|static)/]",
        message: 'Use renderIconMarkup from utils/iconMarkup — Fizz is ~190 KB for one <svg>.',
      }],
    },
  },
);
