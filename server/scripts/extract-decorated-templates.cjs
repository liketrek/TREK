/**
 * Turn pages drawn in the Studio into decorated templates.
 *
 * Reads the book of a journey and writes the pages named into a data file of
 * the decorated templates (shared/src/book/templates/data/), in the format
 * shared/src/book/templates/template-format.ts describes: every measure a
 * fraction of the page it was drawn on, the pictures and the words taken out,
 * the roles and the theme links kept. The reading is shared's
 * `bookTemplateFromSpread`, so what this writes is what its spec holds.
 *
 * How a drawn page says what is what:
 *
 *   - Name a layer after its role in the layers panel (title, subtitle, date,
 *     body, caption, photo:1, photo:2 and on, map). A text bound to the journal
 *     takes the role of its source without a name, a date mark takes date, a
 *     map takes map, and the photo frames left take the next photo roles in
 *     paint order.
 *   - Group the elements of a lockup (a title with its date line, a badge with
 *     its words, a stamp with its postmark): the group comes along and is laid
 *     as one group of the page.
 *   - Link colours and faces to the book's theme in the inspector. With the
 *     book themed, a colour the document links nowhere (a border, an outline,
 *     a pattern, a sticker's slots) that is exactly one of the theme's is kept
 *     as a tint, so the template follows the theme of any book it is laid in.
 *
 * Usage, from server/:
 *
 *     node scripts/extract-decorated-templates.cjs <journeyId> <archetype> <id>[,<id>...] [out]
 *
 * One id per page to take, in book order (the cover first when it is
 * named), each the template's id; `-` skips a page. The tags start as the
 * archetype and the description as a line to replace: write both, and the
 * names in every locale (studio.templates.name.<id in camel case>), before
 * the file is committed. Run Prettier on it, then build shared and read the
 * templates' spec.
 */
const Database = require('better-sqlite3');
const fs = require('fs');

const [journeyArg, archetype, idList, out] = process.argv.slice(2);
if (!journeyArg || !archetype || !idList) {
  console.error('usage: node scripts/extract-decorated-templates.cjs <journeyId> <archetype> <id>[,<id>...] [out]');
  process.exit(1);
}

const {
  BOOK_COVER_ARCHETYPES,
  bookDecoratedTemplateSchema,
  bookTemplateFromSpread,
  normalizeBookDocument,
} = require('@trek/shared');

if (!BOOK_COVER_ARCHETYPES.includes(archetype)) {
  console.error(`archetype must be one of ${BOOK_COVER_ARCHETYPES.join(', ')}`);
  process.exit(1);
}

const db = new Database('data/travel.db', { readonly: true });
const row = db.prepare('SELECT document FROM journey_books WHERE journey_id = ?').get(Number(journeyArg));
db.close();
if (!row) throw new Error(`no book on journey ${journeyArg}`);

// Through the contract on the way in, so every element carries every field the document has today.
const doc = normalizeBookDocument(JSON.parse(row.document));
const ids = idList.split(',');

const templates = doc.spreads.flatMap((spread, i) => {
  const id = ids[i];
  if (!id || id === '-') return [];
  const tpl = bookTemplateFromSpread(spread, doc.page, {
    id,
    archetype,
    tags: [archetype],
    descr: 'Describe in one sentence what the page shows.',
    theme: doc.theme ?? null,
  });
  const checked = bookDecoratedTemplateSchema.safeParse(tpl);
  if (!checked.success) throw new Error(`${id}: ${checked.error.message}`);
  return [tpl];
});

const name = `EXTRACTED_${archetype.replace(/-/g, '_').toUpperCase()}`;
const file = `import type { BookDecoratedTemplate } from '../template-format';

/**
 * Decorated templates drawn in the Studio (journey ${journeyArg}) and read out
 * by server/scripts/extract-decorated-templates.cjs: fractions of the page
 * they were drawn on, in the format of template-format.ts.
 */
export const ${name}: readonly BookDecoratedTemplate[] = ${JSON.stringify(templates, null, 2)};
`;

const target = out || `../shared/src/book/templates/data/extracted-${archetype}.data.ts`;
fs.writeFileSync(target, file);
console.log(`wrote ${templates.length} templates to ${target}`);
