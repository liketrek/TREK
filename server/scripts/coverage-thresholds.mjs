#!/usr/bin/env node
/**
 * Prints the per-domain `thresholds` block for vitest.config.ts from the last
 * coverage run, at each domain's measured value minus one point of slack.
 *
 *     npm run test:coverage        # writes coverage/coverage-summary.json
 *     node scripts/coverage-thresholds.mjs
 *
 * The gate is a RATCHET: raise an entry when you improve a domain, never lower one
 * to make a build pass. Use this when you have genuinely raised coverage and want the
 * new floor written down, not to re-baseline a regression away.
 *
 * It reads coverage-summary.json rather than the text reporter on purpose. The text
 * reporter prints one row per DIRECTORY, so a domain with subdirectories (plugins,
 * memories, auth) reads several points higher there than it actually is, and a
 * threshold copied off it would be wrong in the loose direction.
 */
import fs from 'node:fs';
import path from 'node:path';

const summaryPath = path.join(process.cwd(), 'coverage', 'coverage-summary.json');
if (!fs.existsSync(summaryPath)) {
  console.error(`no ${summaryPath} — run "npm run test:coverage" first`);
  process.exit(1);
}

const METRICS = [
  ['statements', 'statements'],
  ['branches', 'branches'],
  ['functions', 'functions'],
  ['lines', 'lines'],
];

const summary = JSON.parse(fs.readFileSync(summaryPath, 'utf8'));
const domains = new Map();
for (const [file, entry] of Object.entries(summary)) {
  if (file === 'total') continue;
  const match = file.split('\\').join('/').match(/\/src\/nest\/([a-z0-9-]+)\//);
  if (!match) continue;
  const totals = domains.get(match[1]) ?? new Map(METRICS.map(([k]) => [k, { covered: 0, total: 0 }]));
  for (const [key, metric] of METRICS) {
    totals.get(key).covered += entry[metric].covered;
    totals.get(key).total += entry[metric].total;
  }
  domains.set(match[1], totals);
}

// A domain with no branches at all reads as 100%, which is the right floor for it.
const floorOf = ({ covered, total }) => (total === 0 ? 100 : Math.max(0, Math.floor((100 * covered) / total) - 1));

for (const domain of [...domains.keys()].sort()) {
  const totals = domains.get(domain);
  const parts = METRICS.map(([key]) => `${key}: ${floorOf(totals.get(key))}`).join(', ');
  console.log(`        'src/nest/${domain}/**/*.ts': { ${parts} },`);
}
