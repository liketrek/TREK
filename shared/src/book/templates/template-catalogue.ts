import type { BookCoverArchetype } from '../book-archetypes';
import { findBookTemplate } from '../book-layouts';
import { COVERS_CUTOUT } from './data/covers-cutout.data';
import { COVERS_GRID_BADGE } from './data/covers-grid-badge.data';
import { COVERS_MINIMAL_SERIF } from './data/covers-minimal-serif.data';
import { COVERS_POSTCARD } from './data/covers-postcard.data';
import { COVERS_POSTER_POP } from './data/covers-poster-pop.data';
import { COVERS_SPINE_BAND } from './data/covers-spine-band.data';
import { COVERS_STAMP_COLLAGE } from './data/covers-stamp-collage.data';
import { INNER_CHAPTERS } from './data/inner-chapters.data';
import { INNER_COLLAGE } from './data/inner-collage.data';
import { INNER_EPHEMERA } from './data/inner-ephemera.data';
import { INNER_GRIDS } from './data/inner-grids.data';
import { INNER_STORY } from './data/inner-story.data';
import {
  templatePhotoSlots,
  templateRoles,
  type BookDecoratedTemplate,
  type BookTemplateKind,
} from './template-format';

/**
 * The decorated templates the Studio offers and the assistant lays pages
 * on: 21 covers, three in each of the seven archetypes, and 16 double
 * spreads, each set in the manner of one of them. The data files hold them
 * as drawn (template-format.ts); this is the one list the Studio's panel,
 * the page operations and `list_book_layouts` read.
 */
export const BOOK_DECORATED_TEMPLATES: readonly BookDecoratedTemplate[] = [
  ...COVERS_SPINE_BAND,
  ...COVERS_POSTER_POP,
  ...COVERS_CUTOUT,
  ...COVERS_POSTCARD,
  ...COVERS_GRID_BADGE,
  ...COVERS_MINIMAL_SERIF,
  ...COVERS_STAMP_COLLAGE,
  ...INNER_STORY,
  ...INNER_CHAPTERS,
  ...INNER_COLLAGE,
  ...INNER_EPHEMERA,
  ...INNER_GRIDS,
];

const BY_ID = new Map(BOOK_DECORATED_TEMPLATES.map((t) => [t.id, t]));

/** A decorated template by id, or undefined. */
export function findDecoratedTemplate(id: string): BookDecoratedTemplate | undefined {
  return BY_ID.get(id);
}

/** The decorated templates for a single page or a double spread, of one archetype when one is named. */
export function decoratedTemplatesFor(
  kind: BookTemplateKind,
  archetype?: BookCoverArchetype | null,
): BookDecoratedTemplate[] {
  return BOOK_DECORATED_TEMPLATES.filter((t) => t.kind === kind && (!archetype || t.archetype === archetype));
}

/** Whether a layout id names a template of either set: a built-in layout or a decorated one. */
export function isBookTemplateId(id: string): boolean {
  return BY_ID.has(id) || findBookTemplate(id) !== undefined;
}

/** One decorated template as `list_book_layouts` lists it. */
export function decoratedTemplateRow(tpl: BookDecoratedTemplate) {
  const roles = templateRoles(tpl);
  return {
    id: tpl.id,
    archetype: tpl.archetype,
    tags: [...tpl.tags],
    descr: tpl.descr,
    photoSlots: templatePhotoSlots(tpl),
    roles: roles.filter((r) => !r.startsWith('photo:')),
  };
}
