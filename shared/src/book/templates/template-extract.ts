import type { BookCoverArchetype } from '../book-archetypes';
import type { BookPaint } from '../book-paint.schema';
import type { BookElement, BookPageSetup, BookSpread } from '../book.schema';
import { bookThemeColor } from '../theme/book-theme';
import { BOOK_COLOR_TOKENS, type BookColorToken, type BookTheme } from '../theme/book-theme.schema';
import {
  BOOK_TEMPLATE_TEXT_ROLES,
  bookTemplateRoleSchema,
  templatePhotoIndex,
  type BookDecoratedTemplate,
  type BookTemplateElement,
  type BookTemplatePhotoRole,
  type BookTemplateRole,
  type BookTemplateTint,
} from './template-format';
import { keepsProportions } from './template-lay';
import { templateRoleOfBinding } from './template-words';

/**
 * A spread drawn in the Studio, turned into a decorated template: the way a
 * template is made (server/scripts/extract-decorated-templates.cjs reads a
 * book and writes what this returns into a data file).
 *
 * - Every measure is divided back into the fractions the format keeps
 *   (template-format.ts), the inverse of laying a template on a page.
 * - The pictures come out, and so do the words of every text that takes a
 *   role; a text without one is a word of the design and keeps its words.
 * - Roles are read off the page. A layer named after a role (`title`,
 *   `photo:2`, `map`) takes it; a text bound to the journal takes the role its
 *   source reads as; a date mark takes `date`, a map `map`; the photo frames
 *   left take the next photo roles in paint order.
 * - The theme links the document has stay; with the book's theme given, a
 *   colour the document links nowhere (a border, an outline, a pattern's two
 *   colours, a sticker's slots) that is exactly one of the theme's becomes a
 *   tint. A text whose letters a photo of the page fills keeps that photo's
 *   role as `fillPhoto`.
 */

export interface BookTemplateExtract {
  id: string;
  archetype: BookCoverArchetype;
  tags: readonly string[];
  descr: string;
  /** The book's theme, for the tints; without one no colour becomes a tint. */
  theme?: BookTheme | null;
}

const r4 = (v: number) => Math.round(v * 10000) / 10000;

/** The role a layer's name gives it, when the name is one. */
function namedRole(el: BookElement): BookTemplateRole | undefined {
  const name = el.name?.trim();
  return name && bookTemplateRoleSchema.safeParse(name).success ? (name as BookTemplateRole) : undefined;
}

/** The role a page's content says an element plays, without a name to say it. */
function contentRole(el: BookElement): BookTemplateRole | undefined {
  if (el.kind === 'text') return templateRoleOfBinding(el.binding);
  if (el.kind === 'badge' && el.variant === 'date') return 'date';
  if (el.kind === 'map') return 'map';
  return undefined;
}

/** Every element's role, each role given once: names first, then the journal, then photo order. */
function rolesOf(elements: readonly BookElement[]): (BookTemplateRole | undefined)[] {
  const taken = new Set<string>();
  const claim = (role: BookTemplateRole | undefined) => {
    if (!role || taken.has(role)) return undefined;
    taken.add(role);
    return role;
  };
  const roles = elements.map((el) => claim(namedRole(el)));
  elements.forEach((el, i) => {
    if (!roles[i]) roles[i] = claim(contentRole(el));
  });
  let next = 1;
  elements.forEach((el, i) => {
    if (roles[i] || el.kind !== 'photo') return;
    while (taken.has(`photo:${next}`)) next += 1;
    roles[i] = claim(`photo:${next}`);
  });
  return roles;
}

/** The token a colour is exactly, in this theme, or undefined. */
function tokenOf(theme: BookTheme | null | undefined, hex: string | null | undefined): BookColorToken | undefined {
  if (!theme || !hex) return undefined;
  const want = hex.toLowerCase();
  return BOOK_COLOR_TOKENS.find((t) => bookThemeColor(theme, t).toLowerCase() === want);
}

type Loose = Record<string, unknown>;
type Colour = { color: string } | null | undefined;

function paintTint(paint: BookPaint | undefined, theme: BookTheme | null | undefined): BookTemplateTint {
  if (!paint || paint.type === 'solid') return {};
  if (paint.type === 'pattern') {
    const fg = tokenOf(theme, paint.fg);
    const bg = tokenOf(theme, paint.bg);
    return { ...(fg ? { fg } : {}), ...(bg ? { bg } : {}) };
  }
  const stops = paint.stops.map((s) => tokenOf(theme, s.color) ?? null);
  return stops.some(Boolean) ? { stops } : {};
}

/** The tints of an element: the colours it links nowhere that are its theme's. */
function tintOf(el: BookElement, theme: BookTheme | null | undefined): BookTemplateTint | undefined {
  const of = (value: Colour) => tokenOf(theme, value?.color);
  let tint: BookTemplateTint = {};
  if (el.kind === 'photo') tint = { border: of(el.border), shadow: of(el.shadow), cutout: of(el.cutout) };
  if (el.kind === 'text') {
    const fill = el.fillPaint?.type === 'solid' ? tokenOf(theme, el.fillPaint.color) : undefined;
    tint = { outline: of(el.outline), shadow: of(el.shadow), highlight: of(el.highlight), fill };
  }
  if (el.kind === 'line') tint = { stroke: tokenOf(theme, el.stroke) };
  if (el.kind === 'shape') tint = paintTint(el.paint, theme);
  if (el.kind === 'sticker' && el.colors.length) {
    const colors = el.colors.map((c) => tokenOf(theme, c) ?? null);
    if (colors.some(Boolean)) tint = { colors };
  }
  const set = Object.entries(tint).filter(([, v]) => v !== undefined);
  return set.length ? (Object.fromEntries(set) as BookTemplateTint) : undefined;
}

/** Whether an element is round or square on purpose, so it keeps its proportions on a page of another shape. */
function keepsShape(el: BookElement): boolean {
  if (Math.abs(el.frame.w - el.frame.h) > Math.max(el.frame.w, el.frame.h) * 0.01) return false;
  if (el.kind === 'shape') return el.shape !== 'rect' && el.shape !== 'line';
  if (el.kind === 'photo') return el.mask !== null && el.mask !== 'rect';
  return el.kind === 'text' && el.curve?.type === 'circle';
}

/** Every length of an element as a fraction of the page's shorter side. */
function lengthsToFractions(out: Loose, unit: number): void {
  for (const key of ['radius', 'strokeWidth', 'edgeSize', 'size', 'fitMax']) {
    if (typeof out[key] === 'number') out[key] = r4((out[key] as number) / unit);
  }
  for (const key of ['outline', 'border', 'cutout']) {
    const edge = out[key] as { width: number } | null | undefined;
    if (edge) out[key] = { ...edge, width: r4(edge.width / unit) };
  }
  const shadow = out.shadow as { dx: number; dy: number } | null | undefined;
  if (shadow) out.shadow = { ...shadow, dx: r4(shadow.dx / unit), dy: r4(shadow.dy / unit) };
  const band = out.highlight as { padX: number; padY: number; radius: number } | null | undefined;
  if (band) {
    out.highlight = { ...band, padX: r4(band.padX / unit), padY: r4(band.padY / unit), radius: r4(band.radius / unit) };
  }
}

interface Measures {
  pw: number;
  ph: number;
  unit: number;
}

/** A frame as the format keeps it: a kept element's size from the shorter side, about its centre. */
function frameToFractions(el: BookElement, keep: boolean, m: Measures) {
  const f = el.frame;
  if (!keep) return { x: r4(f.x / m.pw), y: r4(f.y / m.ph), w: r4(f.w / m.pw), h: r4(f.h / m.ph) };
  const w = f.w / m.unit;
  const h = f.h / m.unit;
  return { x: r4((f.x + f.w / 2) / m.pw - w / 2), y: r4((f.y + f.h / 2) / m.ph - h / 2), w: r4(w), h: r4(h) };
}

/** The content taken out of an element that takes a role: its picture, its words, its journey. */
function withoutContent(out: Loose, role: BookTemplateRole | undefined): void {
  if (out.kind === 'photo') out.photoId = null;
  if (out.kind === 'map')
    Object.assign(out, { countries: [], points: [], path: [], roads: [], tileUrl: '', attribution: '' });
  if (out.kind === 'text' && role && (BOOK_TEMPLATE_TEXT_ROLES as readonly string[]).includes(role)) {
    Object.assign(out, { text: '', binding: null, overridden: false });
  }
  delete out.name;
  delete out.hidden;
  out.locked = false;
}

/** The photo role whose picture fills a text's letters, when a frame on the page holds that picture. */
function fillRole(
  el: BookElement,
  elements: readonly BookElement[],
  roles: readonly (BookTemplateRole | undefined)[],
): BookTemplatePhotoRole | undefined {
  if (el.kind !== 'text' || el.fillPaint?.type !== 'photo') return undefined;
  const photoId = el.fillPaint.photoId;
  const i = elements.findIndex((e) => e.kind === 'photo' && e.photoId === photoId);
  const role = i >= 0 ? roles[i] : undefined;
  return templatePhotoIndex(role) === null ? undefined : (role as BookTemplatePhotoRole);
}

const camel = (id: string) => id.replace(/-([a-z0-9])/g, (_, c: string) => c.toUpperCase());

/** A drawn spread as a decorated template, its visible elements in paint order. */
export function bookTemplateFromSpread(
  spread: BookSpread,
  page: Pick<BookPageSetup, 'pageWidth' | 'pageHeight'>,
  meta: BookTemplateExtract,
): BookDecoratedTemplate {
  const m: Measures = { pw: page.pageWidth, ph: page.pageHeight, unit: Math.min(page.pageWidth, page.pageHeight) };
  const visible = spread.elements.filter((e) => !e.hidden);
  const roles = rolesOf(visible);
  const elements = visible.map((el, i): BookTemplateElement => {
    const role = roles[i];
    const keep = keepsShape(el);
    const out: Loose = { ...el, id: `${el.kind.charAt(0)}${i + 1}` };
    out.frame = frameToFractions(el, keep || keepsProportions(el), m);
    lengthsToFractions(out, m.unit);
    const fillPhoto = fillRole(el, visible, roles);
    if (fillPhoto) out.fillPaint = null;
    withoutContent(out, role);
    const tint = tintOf(el, meta.theme);
    return {
      ...(out as BookElement),
      ...(role ? { role } : {}),
      ...(keep ? { keep: true as const } : {}),
      ...(tint ? { tint } : {}),
      ...(fillPhoto ? { fillPhoto } : {}),
    };
  });
  const backgroundTint = paintTint(spread.backgroundPaint, meta.theme);
  return {
    id: meta.id,
    labelKey: `studio.templates.name.${camel(meta.id)}`,
    kind: spread.role === 'inner' ? 'inner' : 'single',
    archetype: meta.archetype,
    tags: [...meta.tags],
    descr: meta.descr,
    background: spread.background,
    ...(spread.backgroundToken ? { backgroundToken: spread.backgroundToken } : {}),
    ...(spread.backgroundPaint ? { backgroundPaint: spread.backgroundPaint } : {}),
    ...(Object.keys(backgroundTint).length ? { backgroundTint } : {}),
    elements,
  };
}
