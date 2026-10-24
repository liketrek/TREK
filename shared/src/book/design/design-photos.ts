import { isPano } from '../auto/auto-elements';
import type { AutoEntry, AutoPhoto } from '../auto/auto-types';
import { MIN_PRINT_DPI, photoDpi } from '../book-findings';
import type { BookPhotoInfo } from '../book-ops-core';
import type { BookPageSetup, BookPhotoElement } from '../book.schema';
import {
  PHOTO_PICK,
  pickBookPhotos,
  type PhotoPickCandidate,
  type PhotoPickDropped,
  type PhotoPickEntry,
} from '../photo-pick';
import type { BookDesignDirectives } from './design-directives.schema';

/**
 * Which photos a designed book uses, chapter by chapter, and why the others
 * were left out. `best` takes the photo-pick ranking (near duplicates and
 * possibly blurry ones out, with the reason); `include` forces a photo in,
 * `exclude` takes one out; a chapter keeps at most `perChapterMax`.
 */

export type BookDesignLeftOutReason = PhotoPickDropped['reason'] | 'excluded' | 'chapter_max' | 'page_budget';

export interface BookDesignLeftOut {
  photoId: number;
  reason: BookDesignLeftOutReason;
}

export interface DesignPhotoChoice {
  /** The photos each entry keeps, best first. */
  byEntry: Map<number, AutoPhoto[]>;
  leftOut: BookDesignLeftOut[];
}

/** The entries as the photo picker reads them. */
export function pickEntriesOf(
  entries: readonly AutoEntry[],
  candidates: readonly PhotoPickCandidate[],
): PhotoPickEntry[] {
  const at = new Map(candidates.flatMap((c) => c.entryIds.map((id): [number, PhotoPickCandidate] => [id, c])));
  return entries.map((e) => ({
    id: e.id,
    date: e.date ?? '',
    title: e.title,
    location: e.location,
    lat: e.lat ?? at.get(e.id)?.lat ?? null,
    lng: e.lng ?? at.get(e.id)?.lng ?? null,
  }));
}

/** An entry's photos in the order the picker ranks them, and the ones it left out. */
function ranked(
  entry: AutoEntry,
  candidates: readonly PhotoPickCandidate[],
  pickEntries: readonly PhotoPickEntry[],
): { order: AutoPhoto[]; dropped: PhotoPickDropped[] } {
  const own = new Map(entry.photos.map((p) => [p.photoId, p]));
  const result = pickBookPhotos(candidates, pickEntries, { entryId: entry.id, limit: PHOTO_PICK.maxLimit });
  const pickedIds = result.groups.flatMap((g) => g.picks.map((p) => p.photoId)).filter((id) => own.has(id));
  const dropped = result.groups.flatMap((g) => g.dropped).filter((d) => own.has(d.photoId));
  const out = new Set(dropped.map((d) => d.photoId));
  const seen = new Set(pickedIds);
  const rest = entry.photos.filter((p) => !seen.has(p.photoId) && !out.has(p.photoId));
  const order = [...pickedIds.map((id) => own.get(id) as AutoPhoto), ...rest];
  return { order, dropped };
}

/** An entry's photos as they are, for `pick: 'all'` or a journey without measured photos. */
function unranked(entry: AutoEntry): { order: AutoPhoto[]; dropped: PhotoPickDropped[] } {
  return { order: [...entry.photos], dropped: [] };
}

/** The entry an included photo belongs to: the one it is linked to, else the one of its day, else the first. */
function homeOf(photoId: number, entries: readonly AutoEntry[], candidates: readonly PhotoPickCandidate[]) {
  const c = candidates.find((x) => x.photoId === photoId);
  const linked = entries.find((e) => c?.entryIds.includes(e.id));
  const day = c?.takenAt?.slice(0, 10);
  return linked ?? entries.find((e) => day && e.date === day) ?? entries[0];
}

/** The photos each entry of the design keeps. */
export function choosePhotos(
  entries: readonly AutoEntry[],
  candidates: readonly PhotoPickCandidate[],
  directives: BookDesignDirectives,
  gallery: readonly BookPhotoInfo[],
): DesignPhotoChoice {
  const opts = directives.photos;
  const pick = opts?.pick ?? 'best';
  const exclude = new Set(opts?.exclude ?? []);
  const include = new Set(opts?.include ?? []);
  const pickEntries = pickEntriesOf(entries, candidates);
  const leftOut: BookDesignLeftOut[] = [];
  const byEntry = new Map<number, AutoPhoto[]>();
  const used = new Set<number>();

  for (const entry of entries) {
    const best = pick === 'best' && candidates.length > 0;
    const { order, dropped } = best ? ranked(entry, candidates, pickEntries) : unranked(entry);
    for (const d of dropped) {
      if (include.has(d.photoId)) order.push(entry.photos.find((p) => p.photoId === d.photoId) as AutoPhoto);
      else leftOut.push({ photoId: d.photoId, reason: d.reason });
    }
    const kept: AutoPhoto[] = [];
    for (const p of order) {
      if (used.has(p.photoId)) continue;
      if (exclude.has(p.photoId)) {
        leftOut.push({ photoId: p.photoId, reason: 'excluded' });
        continue;
      }
      if (opts?.perChapterMax !== undefined && kept.length >= opts.perChapterMax && !include.has(p.photoId)) {
        leftOut.push({ photoId: p.photoId, reason: 'chapter_max' });
        continue;
      }
      used.add(p.photoId);
      kept.push(p);
    }
    byEntry.set(entry.id, kept);
  }

  for (const photoId of include) {
    const info = gallery.find((g) => g.photoId === photoId);
    const home = homeOf(photoId, entries, candidates);
    if (!info || used.has(photoId) || exclude.has(photoId) || !home) continue;
    used.add(photoId);
    const list = byEntry.get(home.id) ?? [];
    list.push({ photoId, width: info.width ?? null, height: info.height ?? null, caption: info.caption ?? null });
    byEntry.set(home.id, list);
  }
  return { byEntry, leftOut };
}

/** The resolution a photo prints at in a frame, from what the gallery knows of it; null when its size is unknown. */
export function dpiIn(
  photo: AutoPhoto,
  info: BookPhotoInfo | undefined,
  frame: BookPhotoElement['frame'],
): number | null {
  const width = info?.width ?? photo.width;
  const height = info?.height ?? photo.height;
  if (!width || !height) return null;
  const el = { frame, fit: 'cover' } as BookPhotoElement;
  return photoDpi(el, { photoId: photo.photoId, width, height });
}

/** Clearly wider than tall: a picture that can run across a spread. */
export const isLandscape = (p: AutoPhoto) => !!(p.width && p.height && p.width >= p.height * 1.2);

/** A panorama: more than twice as wide as tall. */
export const isPanorama = (p: AutoPhoto) => isPano(p);

/** A picture wide and sharp enough to run across a whole spread at print resolution, its detail off the fold. */
export function heroWorthy(photo: AutoPhoto, info: BookPhotoInfo | undefined, page: BookPageSetup): boolean {
  if (!isLandscape(photo)) return false;
  const frame = {
    x: -page.bleed,
    y: -page.bleed,
    w: page.pageWidth * 2 + page.bleed * 2,
    h: page.pageHeight + page.bleed * 2,
  };
  const dpi = dpiIn(photo, info, frame);
  if (dpi === null || dpi < MIN_PRINT_DPI) return false;
  const sx = info?.salient?.x;
  return sx === undefined || sx < 0.4 || sx > 0.6;
}

/** Photos taken within this long of the first of them make one burst. */
const BURST_MS = 15 * 60 * 1000;

/**
 * A chapter's burst: the longest run of four or more of its photos taken
 * within fifteen minutes of the run's first, which reads best as one grid;
 * empty when it has none. A photo without a capture time is in no burst.
 * Only the time is read: a near-duplicate set kept with `pick: 'all'` is a
 * burst when it was taken within the window, as such sets usually are.
 */
export function burstOf(photos: readonly AutoPhoto[], candidates: readonly PhotoPickCandidate[]): number[] {
  const takenAt = new Map(candidates.map((c): [number, string | null] => [c.photoId, c.takenAt]));
  // The sort is stable: photos taken at the same moment keep the chapter's order.
  const timed = photos
    .map((p) => ({ photoId: p.photoId, at: Date.parse(takenAt.get(p.photoId) ?? '') }))
    .filter((p) => Number.isFinite(p.at))
    .sort((a, b) => a.at - b.at);
  const times = timed.map((p) => p.at);
  let best: number[] = [];
  let end = 0;
  timed.forEach((first, i) => {
    while (end < times.length && (times[end] as number) - first.at <= BURST_MS) end++;
    if (end - i >= 4 && end - i > best.length) best = timed.slice(i, end).map((p) => p.photoId);
  });
  return best;
}
