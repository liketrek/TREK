#!/usr/bin/env node
/*
 * lint:format: new server code is formatted with Prettier.
 *
 * `npm run format:check` was never part of CI, and most files differ from what
 * .prettierrc asks for. Formatting all of them belongs in one mechanical
 * commit of its own; until it lands, the files that were unformatted when
 * this check came in are listed in scripts/format-baseline.json and the list
 * only shrinks: every file outside it, a new one in particular, must be
 * formatted, and a listed file leaves the list once it has been. After the
 * mass reformat, --update empties the list and the check is a plain
 * prettier --check over src/ and tests/.
 *
 *   npm run lint:format              check against the baseline (CI)
 *   npm run lint:format -- --list    print every unformatted file
 *   npm run lint:format -- --update  take formatted and deleted files off the list;
 *                                    it never adds one
 *
 * To format a file: npx prettier --write <file>. The comparison lives in
 * scripts/lib/format.mjs at the repository root; Prettier and its config come
 * from this workspace.
 */
import { fileURLToPath } from 'node:url';
import * as prettier from 'prettier';
import { check } from '../../scripts/lib/format.mjs';
import { runCli } from '../../scripts/lib/ratchet.mjs';

const root = fileURLToPath(new URL('..', import.meta.url));
await runCli('lint:format', (args) =>
  check({
    prettier,
    root,
    dirs: ['src', 'tests'],
    accepts: (key) => key.endsWith('.ts'),
    update: args.includes('--update'),
    list: args.includes('--list'),
  }),
);
