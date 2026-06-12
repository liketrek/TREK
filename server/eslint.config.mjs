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
);
