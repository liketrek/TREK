#!/usr/bin/env node
/*
 * lint:rtl: keeps the layout following the reading direction.
 *
 * Arabic runs the app with dir="rtl". A physical class or style (ml-2,
 * text-left, paddingLeft, left: 0) stays on the same side in either direction,
 * so a gap, an indent or an alignment that follows the text in English lands
 * on the wrong side in Arabic. The logical forms (ms-2, text-start,
 * paddingInlineStart, insetInlineStart) follow the direction, and in a
 * left-to-right language they are exactly the physical ones.
 *
 * Some things are physical on purpose: a map, a chart axis, a drag handle, a
 * popover placed at measured coordinates. Those stay. Every file's physical
 * uses are counted against scripts/rtl-baseline.json, and the check fails when
 * a file holds more than its entry (a file without an entry holds none), so
 * new code reaches for the logical forms. A line that is physical on purpose
 * carries `rtl-lint-disable` in a comment (in a string it is no marker). The
 * marked lines are counted too, against scripts/rtl-disable-baseline.json, so
 * the marker cannot quietly take the place of the logical forms: a new one
 * raises its file's entry by hand, where review sees it. An entry of either
 * baseline above what its file holds now, or for a file that is gone, fails
 * as well until --update lowers it.
 *
 *   npm run lint:rtl              check against the baselines (CI)
 *   npm run lint:rtl -- --list    print every counted use, file by file
 *   npm run lint:rtl -- --update  lower both baselines to what the files hold now;
 *                                 it never raises an entry
 *
 * The matching lives in scripts/lib/rtl.mjs.
 */
import { fileURLToPath } from 'node:url';
import { runCli } from './lib/ratchet.mjs';
import { check } from './lib/rtl.mjs';

const root = fileURLToPath(new URL('..', import.meta.url));
await runCli('lint:rtl', (args) => check({ root, update: args.includes('--update'), list: args.includes('--list') }));
