// Regenerates src/book/book-icon-names-*.data.ts, the lucide drawings the
// Studio's icon tab offers, from the lucide-react installed at the repo root.
// Run from shared/: `node scripts/gen-book-icon-names.mjs`.
//
// Read from the package's type declarations rather than imported: the shared
// package has no lucide dependency of its own and must not grow one, the
// contract layer stays zod only. The names are taken the way the client's
// iconLibrary.ts takes them from the module: every PascalCase export, less the
// `Lucide*` and `*Icon` aliases of a name that exists bare, and less `Icon`,
// the component every drawing is built on. client/src/components/Studio/
// iconLibrary.test.ts fails when the files and the shipped library drift apart.
import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const lucide = join(here, '..', '..', 'node_modules', 'lucide-react');
const { version } = JSON.parse(readFileSync(join(lucide, 'package.json'), 'utf8'));
const declarations = readFileSync(join(lucide, 'dist', 'lucide-react.d.ts'), 'utf8');

/** The last `export { ... };` of the declarations, which names every icon and its aliases. */
const exportLine = declarations
  .split('\n')
  .filter((line) => line.startsWith('export { '))
  .pop();
if (!exportLine) throw new Error('no export list in lucide-react.d.ts');

const PASCAL_CASE = /^[A-Z][A-Za-z0-9]*$/;
const exported = exportLine
  .replace(/^export \{ /, '')
  .replace(/ \};\s*$/, '')
  .split(',')
  .map((part) =>
    part
      .trim()
      .split(/\s+as\s+/)
      .pop(),
  )
  .filter((name) => PASCAL_CASE.test(name));
const present = new Set(exported);
const names = [...present]
  .filter((name) => !(name.startsWith('Lucide') && present.has(name.slice(6))))
  .filter((name) => !(name.endsWith('Icon') && present.has(name.slice(0, -4))))
  .filter((name) => name !== 'Icon')
  .sort();

/** The three files and the initials each holds, so none of them passes a thousand lines. */
const PARTS = [
  { suffix: 'a-e', constant: 'BOOK_ICON_NAMES_A_E', label: 'A to E', test: /^[A-E]/ },
  { suffix: 'f-p', constant: 'BOOK_ICON_NAMES_F_P', label: 'F to P', test: /^[F-P]/ },
  { suffix: 'q-z', constant: 'BOOK_ICON_NAMES_Q_Z', label: 'Q to Z', test: /^[Q-Z]/ },
];

for (const part of PARTS) {
  const list = names.filter((name) => part.test.test(name));
  const source = `/**
 * The lucide drawings the Studio offers, ${part.label}: part of BOOK_ICON_NAMES
 * (book-icons.ts). Generated from lucide-react ${version} by
 * scripts/gen-book-icon-names.mjs, never edited by hand; the client's
 * iconLibrary.test.ts fails when the list and the library it ships drift apart.
 */
export const ${part.constant}: readonly string[] = [
${list.map((name) => `  '${name}',`).join('\n')}
];
`;
  writeFileSync(join(here, '..', 'src', 'book', `book-icon-names-${part.suffix}.data.ts`), source);
}
console.log(`wrote ${names.length} icon names from lucide-react ${version}`);
