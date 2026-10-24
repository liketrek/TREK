import js from '@eslint/js';

import gitignore from 'eslint-config-flat-gitignore';
import eslintConfigPrettier from 'eslint-config-prettier';
import reactHooks from 'eslint-plugin-react-hooks';
import reactRefresh from 'eslint-plugin-react-refresh';
import tseslint from 'typescript-eslint';
import trek from './scripts/lib/eslint-rules.mjs';

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
      trek,
    },
    languageOptions: {
      // Typed linting, for the rules that need to know a value is a promise.
      parserOptions: { projectService: true, tsconfigRootDir: import.meta.dirname },
    },
    rules: {
      'react/no-danger': 'off',
      'react-refresh/only-export-components': ['warn', { allowConstantExport: true }],

      // --- Severities tuned to keep CI green on a codebase that was never linted ---
      // (each rule below has pre-existing violations; surfaced as warnings, not blockers)

      // A hook called conditionally is a crash waiting for the render that skips it.
      // The rest of react-hooks v7's recommended set (the React Compiler's checks:
      // state set in effects or render, refs read in render, impure renders,
      // mutated props) as warnings, each count held by scripts/eslint-baseline.json.
      ...Object.fromEntries(Object.keys(reactHooks.configs['recommended-latest'].rules).map((rule) => [rule, 'warn'])),
      'react-hooks/rules-of-hooks': 'error',
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

      // --- Added later as warnings; lint:warnings freezes what exists and fails on each new one ---

      // A promise nobody awaits or catches loses its failure, and an async
      // handler where a void one is expected (onClick={async () => ...})
      // rejects into nowhere.
      '@typescript-eslint/no-floating-promises': 'warn',
      '@typescript-eslint/no-misused-promises': ['warn', { checksVoidReturn: { attributes: true } }],
      'trek/no-swallowed-catch': 'warn',
      // A `!` silences the null the type admits instead of handling it.
      '@typescript-eslint/no-non-null-assertion': 'warn',
      // Whole-store subscriptions; the message points to useShallow.
      'trek/store-without-selector': 'warn',
      // window.__dragData, window.__addToast and window.dispatchEvent buses.
      'trek/no-window-globals': 'warn',
      'no-console': 'warn',
    },
  },
  {
    // Size and branching, in app code only. ESLint's defaults for complexity
    // (20) and max-depth (4). Five parameters: a hook with more takes an
    // options object. A function body may hold 120 lines in a .ts file, which
    // is logic only; a .tsx component also holds its markup, which is long by
    // nature, so it gets 300, still well under the god components this is
    // meant to stop (LoginPage was one function of 1300 lines).
    files: ['src/**/*.{ts,tsx}'],
    ignores: ['src/**/*.test.{ts,tsx}'],
    rules: {
      complexity: ['warn', 20],
      'max-depth': ['warn', 4],
      'max-params': ['warn', 5],
      'max-lines-per-function': ['warn', { max: 120, skipBlankLines: true, skipComments: true, IIFEs: true }],
    },
  },
  {
    files: ['src/**/*.tsx'],
    ignores: ['src/**/*.test.tsx'],
    rules: {
      'max-lines-per-function': ['warn', { max: 300, skipBlankLines: true, skipComments: true, IIFEs: true }],
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
