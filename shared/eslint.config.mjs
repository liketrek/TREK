import js from '@eslint/js';

import gitignore from 'eslint-config-flat-gitignore';
import eslintConfigPrettier from 'eslint-config-prettier';
import tseslint from 'typescript-eslint';

export default tseslint.config(
  gitignore({ strict: false }),
  js.configs.recommended,
  ...tseslint.configs.recommended,
  eslintConfigPrettier,
  {
    // Formatting is Prettier's own check (npm run lint:format, held to
    // scripts/format-baseline.json until the one mechanical reformat), not an
    // ESLint rule: run through ESLint it could only be enforced with --fix,
    // which rewrote the files CI was about to check.
    rules: {
      '@typescript-eslint/no-unused-vars': [
        'error',
        { argsIgnorePattern: '^_', varsIgnorePattern: '^_' },
      ],
      '@typescript-eslint/no-explicit-any': 'error',
    },
  },
  {
    ignores: ['node_modules'],
  },
);
