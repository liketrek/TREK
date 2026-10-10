#!/usr/bin/env node
/*
 * theme:lint: styling that bypasses the appearance tokens may only go down.
 *
 * A user picks a colour scheme, an accent, transparency and a text size, and
 * applyAppearance() turns that into CSS variables. A colour literal, a palette
 * class, a raw text size or a z-index of its own never hears about any of it,
 * so the surface stays light in a dark scheme, keeps indigo under a red
 * accent, or ignores the text size setting. The contract is in
 * src/theme/README.md; this counts what of it source shows, per file under
 * src/ (tests excluded):
 *
 *   arbitrary-color   bg-[#..], text-[rgba(..)] and the like
 *   inline-color      color: '#111', background: 'rgba(...)' in a style
 *   inline-font-size  fontSize: 13
 *   palette-class     bg-gray-100, text-indigo-600, bg-white, text-black
 *   raw-text-size     text-xs, text-sm ... text-9xl instead of the type tiers
 *   z-index-literal   z-[9999], zIndex: 10000 above Tailwind's z-50, instead of
 *                     a step of the layering scale (--z-bar ... --z-toast)
 *   dark-mode-read    reading settings.dark_mode instead of the .dark class
 *
 * Each file may hold no more hits than its entry in scripts/theme-baseline.json
 * (a file without an entry holds none). A line that is literal on purpose (map
 * paint, PDF, brand colours) carries `theme-lint-disable` in a comment; those
 * lines are counted against scripts/theme-disable-baseline.json, so the marker
 * cannot quietly take the place of the tokens. An entry of either baseline
 * above what its file holds now, or for a file that is gone, fails as well
 * until --update lowers it.
 *
 *   npm run theme:lint              check against the baselines (CI)
 *   npm run theme:lint -- --list    print every hit, file by file
 *   npm run theme:lint -- --update  lower both baselines to what the files hold now;
 *                                   it never raises an entry
 *
 * The matching lives in scripts/lib/theme.mjs.
 */
import { fileURLToPath } from 'node:url';
import { runCli } from './lib/ratchet.mjs';
import { check } from './lib/theme.mjs';

const root = fileURLToPath(new URL('..', import.meta.url));
await runCli('theme:lint', (args) => check({ root, update: args.includes('--update'), list: args.includes('--list') }));
