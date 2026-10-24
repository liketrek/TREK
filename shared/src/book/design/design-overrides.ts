import type { AutoEntry, AutoPhoto } from '../auto/auto-types';
import { applyBookOps } from '../book-ops';
import type { BookOpsContext } from '../book-ops-core';
import type { BookFinding } from '../book-ops.schema';
import type { BookDocument, BookSpread } from '../book.schema';
import type { BookDesignOverrideBeat, BookDesignPageOverride } from './design-brief.schema';
import type { ComposeCtx } from './design-compose';
import { composeLively } from './design-lively-pacing';
import type { BookDesignPlanRow } from './design-merge';
import type { PlannedSpread } from './design-pacing';
import { composeDuo, composeGrid, composeHero, composeTrio, type Composed } from './design-spreads';
import { decorateSpread } from './design-stickers';

/**
 * Pages of a design given another beat or another layout by the directives
 * (`pages.overrides`), after the design is made: the page keeps its place,
 * its id, its chapter and its photos, and is composed again as the beat asks
 * from those photos and its entry's words, or laid out on the template by the
 * page edit's own `layout` operation, so a layout the engine learns there is
 * one an override may name. Then it is themed and repaired like every other
 * designed page.
 *
 * An override that cannot be honoured is said in the notes and the page stays
 * as designed: a page the design keeps as it was, a single page, one that
 * sets a story (no recomposed beat sets one), or too few photos for the beat.
 */

interface OverrideEnv {
  c: ComposeCtx;
  entries: readonly AutoEntry[];
  /** The engine's own finish for a designed page: themed, repaired, its weights real. */
  finish: (spread: BookSpread) => { spread: BookSpread; findings: BookFinding[] };
  ops: BookOpsContext;
}

/** The photos a beat needs at least. */
const LEAST: Readonly<Record<BookDesignOverrideBeat, number>> = {
  collage: 1,
  'script-overlay': 1,
  'grid-badge': 2,
  'stamp-row': 1,
  'two-tone': 1,
  hero: 1,
  duo: 2,
  trio: 3,
  grid: 4,
};

/** The beats that need the page's entry for their words. */
const NEEDS_ENTRY: ReadonlySet<BookDesignOverrideBeat> = new Set(['script-overlay', 'two-tone', 'hero']);

/** The photos of a page as the composers take them, in paint order. */
function photosOf(c: ComposeCtx, spread: BookSpread): AutoPhoto[] {
  return spread.elements.flatMap((e) => {
    if (e.kind !== 'photo' || e.photoId == null) return [];
    const info = c.infos.get(e.photoId);
    return [{ photoId: e.photoId, width: info?.width ?? null, height: info?.height ?? null }];
  });
}

/** Whether a page sets an entry's story, which none of the beats an override names sets again. */
const setsStory = (spread: BookSpread) =>
  spread.elements.some((e) => e.kind === 'text' && e.binding?.source === 'entry.story');

/** The page's elements composed as a classic photo beat, or null when the beat needs what the page lacks. */
function classic(
  c: ComposeCtx,
  beat: BookDesignOverrideBeat,
  plan: PlannedSpread,
  hand: 'left' | 'right',
): Composed | null {
  const entryId = plan.entry?.id ?? null;
  const [first] = plan.photos;
  if (beat === 'hero') return plan.entry && first ? composeHero(c, plan.entry, first, hand) : null;
  if (beat === 'duo') return composeDuo(c, plan.photos, hand, entryId);
  if (beat === 'trio') return composeTrio(c, plan.photos, hand, entryId);
  return beat === 'grid' ? composeGrid(c, plan.photos.slice(0, 6), hand, entryId) : null;
}

/** A page composed again as `beat`, or why it cannot be. */
function recomposed(
  env: OverrideEnv,
  spread: BookSpread,
  beat: BookDesignOverrideBeat,
  index: number,
): BookSpread | string {
  const { c } = env;
  if (setsStory(spread)) return `page ${index} sets a story, which a ${beat} page does not, so it stays as designed`;
  const photos = photosOf(c, spread);
  if (photos.length < LEAST[beat]) return `page ${index} holds ${photos.length} photos, too few for a ${beat} page`;
  const entry = env.entries.find((e) => e.id === spread.entryId) ?? null;
  if (NEEDS_ENTRY.has(beat) && !entry)
    return `page ${index} belongs to no entry, so a ${beat} page has no words for it`;
  const chapter = { key: `o${index}`, label: null, entries: entry ? [entry] : [], photos, stations: false, burst: [] };
  const plan: PlannedSpread = { beat, chapter, entry, photos };
  const hand = index % 2 === 0 ? 'left' : 'right';
  const made = composeLively(c, plan, hand, index) ?? classic(c, beat, plan, hand);
  if (!made) return `page ${index} could not be composed as a ${beat} page`;
  const page: BookSpread = { ...spread, elements: made.elements, groups: undefined };
  return decorateSpread(c, page, `deco:o${index}`);
}

/** A page laid out on a template by the `layout` operation, or why it cannot be. */
function laidOut(
  env: OverrideEnv,
  doc: BookDocument,
  spread: BookSpread,
  template: string,
  index: number,
): BookSpread | string {
  const spreads = doc.spreads.map((s) => (s.id === spread.id ? spread : s));
  const done = applyBookOps({ ...doc, spreads }, { spreadId: spread.id, ops: [{ op: 'layout', template }] }, env.ops);
  if (done.ok === false) return `page ${index} cannot take the layout ${template}: ${done.error.message}`;
  const laid = done.doc.spreads.find((s) => s.id === spread.id) ?? spread;
  // A layout mints ids of its own; the design's counter mints them again, so one journey designs one book.
  const elements = laid.elements.map((e) => ({ ...e, id: env.c.newId(e.kind.charAt(0)) }));
  return { ...laid, elements };
}

const count = (findings: readonly BookFinding[], severity: BookFinding['severity']) =>
  findings.filter((f) => f.severity === severity).length;

/** The photos a page shows, as a plan row names them. */
const photoIdsOf = (spread: BookSpread) =>
  spread.elements.flatMap((e) => (e.kind === 'photo' && e.photoId != null ? [e.photoId] : []));

/** The design with its overridden pages composed again, its plan following them, and what could not be done. */
export function applyPageOverrides(
  doc: BookDocument,
  plan: readonly BookDesignPlanRow[],
  overrides: readonly BookDesignPageOverride[],
  env: OverrideEnv,
): { doc: BookDocument; plan: BookDesignPlanRow[]; notes: string[] } {
  const notes: string[] = [];
  const spreads = [...doc.spreads];
  const rows = [...plan];
  for (const o of overrides) {
    const spread = spreads[o.index];
    const at = rows.findIndex((r) => r.index === o.index && r.action !== 'drop');
    const row = rows[at];
    if (!spread || !row || spread.role !== 'inner') {
      notes.push(`page ${o.index} is not a double page of the design, so its override is left out`);
      continue;
    }
    if (row.action === 'keep') {
      notes.push(`page ${o.index} is kept as it was, so its override is left out`);
      continue;
    }
    let next = spread;
    let beat = row.beat;
    if (o.beat) {
      const made = recomposed(env, next, o.beat, o.index);
      if (typeof made === 'string') notes.push(made);
      else [next, beat] = [made, o.beat];
    }
    if (o.template) {
      const laid = laidOut(env, { ...doc, spreads }, next, o.template, o.index);
      if (typeof laid === 'string') notes.push(laid);
      else next = laid;
    }
    if (next === spread) continue;
    const finished = env.finish(next);
    spreads[o.index] = finished.spread;
    rows[at] = {
      ...row,
      beat,
      photoIds: photoIdsOf(finished.spread),
      findings: { severe: count(finished.findings, 'severe'), warn: count(finished.findings, 'warn') },
    };
  }
  return { doc: { ...doc, spreads }, plan: rows, notes };
}
