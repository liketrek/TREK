// Regenerates src/lucide-icon-names.ts from the lucide-react version installed at
// the repo root. Run from plugin-sdk/: `node scripts/gen-lucide-icon-names.mjs`.
//
// The SDK ships no lucide dependency of its own (it is a dependency-light CLI), so
// the name list is a checked-in snapshot rather than a runtime lookup — same shape
// as KNOWN_ADDONS in src/manifest.ts.
import { writeFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const here = dirname(fileURLToPath(import.meta.url));
const require = createRequire(join(here, '..', '..', 'package.json'));

const dynamicIconImports = require('lucide-react/dynamicIconImports.js');
const iconsByKebabName = dynamicIconImports.default ?? dynamicIconImports;
const { version } = require('lucide-react/package.json');

const toPascalCase = (kebab) =>
  kebab.split('-').map((part) => part[0].toUpperCase() + part.slice(1)).join('');

const names = Object.keys(iconsByKebabName).map(toPascalCase).sort();

const source = `// GENERATED — do not edit by hand.
// Snapshot of every lucide icon name (lucide-react ${version}), used by
// \`trek-plugin validate\` to WARN on a manifest \`icon\` lucide doesn't know —
// never a hard error (the host falls back to Blocks, and a plugin built for a
// newer TREK may name an icon this SDK predates). Regenerate with
// \`node scripts/gen-lucide-icon-names.mjs\`.
export const LUCIDE_ICON_NAMES: ReadonlySet<string> = new Set([
${names.map((n) => '  ' + JSON.stringify(n) + ',').join('\n')}
]);
`;

writeFileSync(join(here, '..', 'src', 'lucide-icon-names.ts'), source);
console.log(`wrote ${names.length} icon names from lucide-react ${version}`);
