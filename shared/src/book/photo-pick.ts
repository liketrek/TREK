import { haversineMetres } from '../geo/haversine';

import { z } from 'zod';

/**
 * Photos for a book page, picked without a model looking at them: what the
 * rows know (day, place, capture time, size, caption, whether the book has the
 * photo already) and two cheap pixel signals measured once per photo on the
 * server (a perceptual hash and how sharp it is, photo-signals.service.ts).
 *
 * Pure: the server's `suggest_book_photos` tool calls it with the journey's
 * gallery, and a Studio button can call it later with the same data.
 *
 * What it cannot do, and the tool says so: judge beauty, find faces or closed
 * eyes, tell who is in a photo or what it shows, or know two photos show the
 * same scene from another angle (the hash only catches near-identical framing).
 */

export const PHOTO_PICK = {
  /** Photos within this many metres of a place's centre belong to it. */
  placeRadiusM: 250,
  /** A place is named after the nearest entry location within this many metres. */
  labelRadiusM: 2000,
  /** Two photos taken this close together are one burst... */
  burstSeconds: 10,
  /** ...unless both hashes are measured and differ in more than this many bits (a walk shot every few seconds). */
  burstHashDistance: 20,
  /** Two photos whose hashes differ in at most this many of 64 bits look the same. */
  hashDistance: 10,
  /** Possibly blurry: sharper than less than this share of the journey's typical photo... */
  blurRatio: 0.35,
  /** ...and under this absolute floor (the variance of the grey Laplacian at a 240 px long edge). */
  blurFloor: 60,
  /**
   * Ranking compares in bands, so a later criterion still counts between two
   * photos that are about as good: sharpness within this factor of each other,
   * clipping within this share of the pixels, size within this factor.
   */
  bands: { sharpness: 1.15, clipped: 0.02, pixels: 1.5 },
  /** The typical photo needs this many measured photos before anything counts as blurry. */
  minForMedian: 3,
  /** The long edge in pixels a photo needs for print: a part of a page, or a whole cover. */
  minLongEdge: { page: 1200, cover: 2400 },
  defaultLimit: 24,
  maxLimit: 60,
  /** What one group lists as left out, at most... */
  droppedPerGroup: 30,
  /** ...and all groups together; the rest is counted in each group's `dropped_more`. */
  droppedTotal: 120,
  /** Reasons one pick carries, at most. */
  whyPerPick: 6,
} as const;

/** What the server measured on a photo's pixels; a null is a signal that could not be measured. */
export interface PhotoPickSignals {
  phash: string | null;
  sharpness: number | null;
  clipped: number | null;
  /** The original's size in pixels, never a thumbnail's. */
  origWidth: number | null;
  origHeight: number | null;
}

/** A photo of the journey's gallery as the picker reads it. */
export interface PhotoPickCandidate {
  photoId: number;
  /** As the row has it: ISO with or without a zone, or a bare date. */
  takenAt: string | null;
  lat: number | null;
  lng: number | null;
  /** Any size with the photo's shape (a thumbnail's will do); null when unknown. */
  width: number | null;
  height: number | null;
  caption: string | null;
  /** The journey entries the photo is linked to. */
  entryIds: readonly number[];
  inBook: boolean;
  signals: PhotoPickSignals | null;
}

/** A journey entry: its day and where it was. */
export interface PhotoPickEntry {
  id: number;
  date: string;
  title: string | null;
  location: string | null;
  lat: number | null;
  lng: number | null;
}

export interface PhotoPickOptions {
  /** Only the photos linked to this entry (or, when it has none, taken on its day). */
  entryId?: number;
  /** Only the photos of this day, `YYYY-MM-DD`. */
  date?: string;
  /** A cover wants a wide or square photo and more pixels. */
  purpose?: 'page' | 'cover';
  limit?: number;
  /** Photos whose signals were still being measured; passed through to the answer. */
  signalsPending?: number;
}

const photoIdSchema = z.number().int().positive();

export const photoPickDroppedSchema = z.discriminatedUnion('reason', [
  z.object({ photoId: photoIdSchema, reason: z.literal('near_duplicate_of'), of: photoIdSchema }),
  z.object({ photoId: photoIdSchema, reason: z.literal('possibly_blurry') }),
  z.object({ photoId: photoIdSchema, reason: z.literal('low_resolution') }),
]);
export type PhotoPickDropped = z.infer<typeof photoPickDroppedSchema>;

/** What `suggest_book_photos` answers: groups by day and place, each with its picks and what it left out. */
export const bookPhotoSuggestionsSchema = z.object({
  groups: z.array(
    z.object({
      /** `YYYY-MM-DD`, or `undated` for photos with neither an entry nor a capture time. */
      day: z.string(),
      place: z.string().nullable(),
      entryId: z.number().int().nullable(),
      picks: z.array(z.object({ photoId: photoIdSchema, why: z.array(z.string()).max(PHOTO_PICK.whyPerPick) })),
      dropped: z.array(photoPickDroppedSchema).max(PHOTO_PICK.droppedPerGroup),
      /** Photos left out of this group that `dropped` has no room to name. */
      dropped_more: z.number().int().nonnegative(),
      /** Good photos of this group the limit left out. */
      more: z.number().int().nonnegative(),
    }),
  ),
  /** Groups left out whole because the limit was reached. */
  groups_more: z.number().int().nonnegative(),
  /** Photos judged on their rows alone, their pixels not measured yet. */
  signals_pending: z.number().int().nonnegative(),
});
export type BookPhotoSuggestions = z.infer<typeof bookPhotoSuggestionsSchema>;

// ── Time ──────────────────────────────────────────────────────────────────

const STAMP = /^(\d{4})-(\d{2})-(\d{2})[T ](\d{2}):(\d{2})(?::(\d{2}))?(?:\.\d+)?\s*(Z|[+-]\d{2}:?\d{2})?$/i;
const BARE_DATE = /^(\d{4}-\d{2}-\d{2})$/;

interface Moment {
  /** The local day the photo was taken on. */
  day: string;
  /** Seconds, comparable between photos; null for a bare date. */
  at: number | null;
}

/**
 * When a photo was taken. A time without a zone is the camera's wall clock and
 * its date is the day. A time in UTC is moved by the photo's longitude (an
 * hour per 15 degrees, the sun's time) when it has one, since the day a
 * traveller lived it is the local one; an explicit offset is taken as written.
 */
export function photoMoment(takenAt: string | null, lng: number | null): Moment | null {
  if (!takenAt) return null;
  const bare = BARE_DATE.exec(takenAt.trim());
  if (bare?.[1]) return { day: bare[1], at: null };
  const m = STAMP.exec(takenAt.trim());
  if (!m) return null;
  const [, y, mo, d, h, mi, s, zone] = m;
  const wall = Date.UTC(Number(y), Number(mo) - 1, Number(d), Number(h), Number(mi), Number(s ?? 0));
  if (Number.isNaN(wall)) return null;
  const offsetMin = zone ? zoneMinutes(zone) : 0;
  const at = (wall - offsetMin * 60_000) / 1000;
  if (zone === undefined || offsetMin !== 0) return { day: takenAt.trim().slice(0, 10), at };
  const shift = lng !== null ? Math.round(lng / 15) * 3600 : 0;
  return { day: new Date((at + shift) * 1000).toISOString().slice(0, 10), at };
}

function zoneMinutes(zone: string): number {
  if (zone.toUpperCase() === 'Z') return 0;
  const digits = zone.replace(':', '');
  const sign = digits.startsWith('-') ? -1 : 1;
  return sign * (Number(digits.slice(1, 3)) * 60 + Number(digits.slice(3, 5)));
}

// ── Likeness ──────────────────────────────────────────────────────────────

/** A 64-bit hash as its two 32-bit halves, read once per photo rather than once per pair. */
type Hash = readonly [number, number];

const HASH = /^[0-9a-f]{16}$/i;

function parseHash(hex: string | null | undefined): Hash | null {
  if (!hex || !HASH.test(hex)) return null;
  return [Number.parseInt(hex.slice(0, 8), 16), Number.parseInt(hex.slice(8), 16)];
}

/** The set bits of a 32-bit number. */
function bitCount(x: number): number {
  let v = x - ((x >>> 1) & 0x55555555);
  v = (v & 0x33333333) + ((v >>> 2) & 0x33333333);
  return Math.imul((v + (v >>> 4)) & 0x0f0f0f0f, 0x01010101) >>> 24;
}

function bitsApart(a: Hash, b: Hash): number {
  return bitCount(a[0] ^ b[0]) + bitCount(a[1] ^ b[1]);
}

/** How many of the 64 bits two hashes (16 hex digits each) differ in; null when either is not one. */
export function hashDistance(a: string, b: string): number | null {
  const ha = parseHash(a);
  const hb = parseHash(b);
  return ha && hb ? bitsApart(ha, hb) : null;
}

// ── Picking ───────────────────────────────────────────────────────────────

/** A candidate with what the picker worked out about it. */
interface Placed {
  photo: PhotoPickCandidate;
  day: string;
  at: number | null;
  pos: { lat: number; lng: number } | null;
}

interface Group {
  day: string;
  members: Placed[];
  centre: { lat: number; lng: number } | null;
}

interface Ranked {
  photoId: number;
  at: number | null;
  why: string[];
}

interface Judged {
  picks: Ranked[];
  dropped: PhotoPickDropped[];
}

/**
 * The photos `pickBookPhotos` judges under these options: those of the entry or
 * the day asked for, or all of them. The server measures these first.
 */
export function photosInScope(
  candidates: readonly PhotoPickCandidate[],
  entries: readonly PhotoPickEntry[],
  options: Pick<PhotoPickOptions, 'entryId' | 'date'> = {},
): Set<number> {
  const byEntry = new Map(entries.map((e) => [e.id, e]));
  const placed = candidates.map((photo) => place(photo, byEntry));
  return new Set(filterFor(placed, options, byEntry).map((p) => p.photo.photoId));
}

/** Photos for a page or the cover, grouped by day and place, best first within each group. */
export function pickBookPhotos(
  candidates: readonly PhotoPickCandidate[],
  entries: readonly PhotoPickEntry[],
  options: PhotoPickOptions = {},
): BookPhotoSuggestions {
  const purpose = options.purpose ?? 'page';
  const limit = Math.min(PHOTO_PICK.maxLimit, Math.max(1, options.limit ?? PHOTO_PICK.defaultLimit));
  const byEntry = new Map(entries.map((e) => [e.id, e]));
  const median = medianSharpness(candidates);
  const placed = candidates.map((photo) => place(photo, byEntry));
  const chosen = filterFor(placed, options, byEntry);
  const groups = groupByDayAndPlace(chosen);
  const judged = groups.map((g) => judge(g, purpose, median));
  const shown = takeRoundRobin(
    judged.map((j) => j.picks),
    limit,
  );
  const out: BookPhotoSuggestions['groups'] = [];
  let groupsMore = 0;
  let droppedRoom: number = PHOTO_PICK.droppedTotal;
  groups.forEach((group, i) => {
    const picks = shown[i] ?? [];
    const all = judged[i];
    if (!all || picks.length === 0) {
      if (all && all.picks.length > 0) groupsMore++;
      return;
    }
    const label = labelOf(group, entries);
    const dropped = all.dropped.slice(0, Math.min(PHOTO_PICK.droppedPerGroup, droppedRoom));
    droppedRoom -= dropped.length;
    out.push({
      day: group.day,
      place: label.place,
      entryId: label.entryId,
      picks: picks.map((p) => ({ photoId: p.photoId, why: p.why.slice(0, PHOTO_PICK.whyPerPick) })),
      dropped,
      dropped_more: all.dropped.length - dropped.length,
      more: all.picks.length - picks.length,
    });
  });
  return { groups: out, groups_more: groupsMore, signals_pending: options.signalsPending ?? 0 };
}

/** The sharpness of the journey's typical photo, over every measured one; null with too few to say. */
function medianSharpness(candidates: readonly PhotoPickCandidate[]): number | null {
  const values = candidates
    .map((c) => c.signals?.sharpness)
    .filter((v): v is number => typeof v === 'number' && Number.isFinite(v))
    .sort((a, b) => a - b);
  if (values.length < PHOTO_PICK.minForMedian) return null;
  const mid = Math.floor(values.length / 2);
  const upper = values[mid] ?? 0;
  return values.length % 2 === 1 ? upper : ((values[mid - 1] ?? upper) + upper) / 2;
}

/** The photo's day (its entry's first, else when it was taken) and where it was (its own place, else its entry's). */
function place(photo: PhotoPickCandidate, byEntry: ReadonlyMap<number, PhotoPickEntry>): Placed {
  const entry = photo.entryIds.map((id) => byEntry.get(id)).find((e) => e !== undefined);
  const moment = photoMoment(photo.takenAt, photo.lng);
  const day = entry?.date ?? moment?.day ?? 'undated';
  const own = photo.lat !== null && photo.lng !== null ? { lat: photo.lat, lng: photo.lng } : null;
  const fromEntry = entry && entry.lat !== null && entry.lng !== null ? { lat: entry.lat, lng: entry.lng } : null;
  return { photo, day, at: moment?.at ?? null, pos: own ?? fromEntry };
}

function filterFor(
  placed: readonly Placed[],
  options: PhotoPickOptions,
  byEntry: ReadonlyMap<number, PhotoPickEntry>,
): Placed[] {
  let out = [...placed];
  if (options.entryId !== undefined) {
    const entryId = options.entryId;
    const linked = out.filter((p) => p.photo.entryIds.includes(entryId));
    const entryDay = byEntry.get(entryId)?.date;
    out = linked.length > 0 || !entryDay ? linked : out.filter((p) => p.day === entryDay);
  }
  if (options.date !== undefined) out = out.filter((p) => p.day === options.date);
  return out;
}

/** Days in order (undated last); within a day, greedy places of `placeRadiusM`, the photos without one together. */
function groupByDayAndPlace(placed: readonly Placed[]): Group[] {
  const days = new Map<string, Placed[]>();
  for (const p of [...placed].sort(byTime)) {
    const list = days.get(p.day);
    if (list) list.push(p);
    else days.set(p.day, [p]);
  }
  const out: Group[] = [];
  for (const day of [...days.keys()].sort(byDay)) {
    const located: Group[] = [];
    const nowhere: Group = { day, members: [], centre: null };
    for (const p of days.get(day) ?? []) {
      if (!p.pos) {
        nowhere.members.push(p);
        continue;
      }
      const pos = p.pos;
      const near = located.find(
        (g) => g.centre && haversineMetres(g.centre.lat, g.centre.lng, pos.lat, pos.lng) <= PHOTO_PICK.placeRadiusM,
      );
      if (!near) {
        located.push({ day, members: [p], centre: { ...pos } });
        continue;
      }
      near.members.push(p);
      const n = near.members.length;
      const c = near.centre ?? pos;
      near.centre = { lat: c.lat + (pos.lat - c.lat) / n, lng: c.lng + (pos.lng - c.lng) / n };
    }
    out.push(...located);
    if (nowhere.members.length > 0) out.push(nowhere);
  }
  return out;
}

/** Near duplicates folded onto their best, then the doubtful ones set aside unless nothing else is left. */
function judge(group: Group, purpose: 'page' | 'cover', median: number | null): Judged {
  const sets = similarSets(group.members);
  const dropped: PhotoPickDropped[] = [];
  const kept: { p: Placed; why: string[] }[] = [];
  for (const set of sets) {
    const ranked = [...set].sort((a, b) => compare(a, b, purpose, median));
    const best = ranked[0];
    if (!best) continue;
    const why: string[] = [];
    if (set.length > 1) {
      const measured = set.filter((p) => typeof p.photo.signals?.sharpness === 'number').length;
      why.push(measured >= 2 ? `sharpest of ${set.length} similar` : `best of ${set.length} similar`);
      for (const other of ranked.slice(1)) {
        dropped.push({ photoId: other.photo.photoId, reason: 'near_duplicate_of', of: best.photo.photoId });
      }
    }
    kept.push({ p: best, why });
  }
  const minEdge = PHOTO_PICK.minLongEdge[purpose];
  const doubts = kept.map(({ p }) => doubtOf(p.photo, median, minEdge));
  const sound = kept.filter((_, i) => doubts[i] === null);
  const keepDoubtful = sound.length === 0;
  const picks: Ranked[] = [];
  kept.forEach(({ p, why }, i) => {
    const doubt = doubts[i] ?? null;
    if (doubt && !keepDoubtful) {
      dropped.push({ photoId: p.photo.photoId, reason: doubt });
      return;
    }
    if (doubt === 'possibly_blurry') why.push('possibly blurry');
    if (doubt === 'low_resolution') why.push('low resolution for print');
    picks.push({ photoId: p.photo.photoId, at: p.at, why: [...why, ...plainWhy(p.photo)] });
  });
  const rank = new Map(
    kept
      .map(({ p }) => p)
      .sort((a, b) => compare(a, b, purpose, median))
      .map((p, i) => [p.photo.photoId, i]),
  );
  picks.sort((a, b) => (rank.get(a.photoId) ?? 0) - (rank.get(b.photoId) ?? 0));
  return { picks, dropped };
}

/**
 * Photos that look alike, joined transitively: a burst (taken within
 * `burstSeconds`) whose hashes, where both are measured, are within
 * `burstHashDistance`, or near-identical hashes at any time. `members` come in
 * time order (`groupByDayAndPlace`), so once a photo without a hash is past
 * its burst window no later one can match it. Every hash is read once, and a
 * pair costs two XORs, so a day of thousands of photos stays quick.
 */
function similarSets(members: readonly Placed[]): Placed[][] {
  const parent = members.map((_, i) => i);
  const root = (i: number): number => {
    let r = i;
    while (parent[r] !== r) r = parent[r] ?? r;
    // Every index on the way now points straight at the root.
    for (let k = i; parent[k] !== r;) {
      const next = parent[k] ?? r;
      parent[k] = r;
      k = next;
    }
    return r;
  };
  const hashes = members.map((p) => parseHash(p.photo.signals?.phash));
  members.forEach((a, i) => {
    const ha = hashes[i] ?? null;
    for (let j = i + 1; j < members.length; j++) {
      const b = members[j];
      if (!b) continue;
      const burst = a.at !== null && b.at !== null && b.at - a.at <= PHOTO_PICK.burstSeconds;
      if (!burst && ha === null) break;
      if (alike(burst, ha, hashes[j] ?? null)) parent[root(j)] = root(i);
    }
  });
  const sets = new Map<number, Placed[]>();
  members.forEach((p, i) => sets.set(root(i), [...(sets.get(root(i)) ?? []), p]));
  return [...sets.values()];
}

function alike(burst: boolean, ha: Hash | null, hb: Hash | null): boolean {
  const distance = ha && hb ? bitsApart(ha, hb) : null;
  if (burst) return distance === null || distance <= PHOTO_PICK.burstHashDistance;
  return distance !== null && distance <= PHOTO_PICK.hashDistance;
}

/** Which band of `PHOTO_PICK.bands` a ratio falls in, centred on 1; zero or nothing is the lowest band. */
function band(ratio: number, step: number): number {
  return ratio > 0 ? Math.round(Math.log(ratio) / Math.log(step)) : -Infinity;
}

/**
 * Best first: for a cover a wide or square photo, then the sharper relative to
 * the journey, then fewer burnt-out or black pixels, then more pixels, then a
 * caption, then one the book does not have yet, each compared in bands so the
 * next one decides between two photos about as good. An unknown sharpness
 * counts as typical, an unknown clipping as none, an unknown size as the
 * smallest.
 */
function compare(a: Placed, b: Placed, purpose: 'page' | 'cover', median: number | null): number {
  const { bands } = PHOTO_PICK;
  const keys: Array<(p: Placed) => number> = [
    (p) => (purpose === 'cover' && shapeOf(p.photo) === 'portrait' ? 1 : 0),
    (p) => {
      const s = p.photo.signals?.sharpness;
      return -band(typeof s === 'number' && median ? s / median : 1, bands.sharpness);
    },
    (p) => Math.floor((p.photo.signals?.clipped ?? 0) / bands.clipped),
    (p) => -band((p.photo.signals?.origWidth ?? 0) * (p.photo.signals?.origHeight ?? 0), bands.pixels),
    (p) => (p.photo.caption?.trim() ? 0 : 1),
    (p) => (p.photo.inBook ? 1 : 0),
  ];
  for (const key of keys) {
    const ka = key(a);
    const kb = key(b);
    if (ka !== kb) return ka - kb;
  }
  return byTime(a, b);
}

function doubtOf(
  photo: PhotoPickCandidate,
  median: number | null,
  minEdge: number,
): 'possibly_blurry' | 'low_resolution' | null {
  const s = photo.signals;
  if (s && typeof s.sharpness === 'number' && median !== null) {
    if (s.sharpness < median * PHOTO_PICK.blurRatio && s.sharpness < PHOTO_PICK.blurFloor) return 'possibly_blurry';
  }
  if (s?.origWidth && s.origHeight && Math.max(s.origWidth, s.origHeight) < minEdge) return 'low_resolution';
  return null;
}

/** The photo's shape: from its row's size (drawn upright), else from the original's size the server measured. */
function shapeOf(photo: PhotoPickCandidate): 'landscape' | 'portrait' | 'square' | null {
  const own = photo.width && photo.height;
  const w = own ? photo.width : photo.signals?.origWidth;
  const h = own ? photo.height : photo.signals?.origHeight;
  if (!w || !h) return null;
  const ratio = w / h;
  if (ratio >= 1.1) return 'landscape';
  return ratio <= 0.9 ? 'portrait' : 'square';
}

function plainWhy(photo: PhotoPickCandidate): string[] {
  const why: string[] = [];
  const shape = shapeOf(photo);
  if (shape) why.push(shape);
  why.push(photo.inBook ? 'in the book already' : 'not in the book yet');
  if (photo.caption?.trim()) why.push('has a caption');
  return why;
}

/** Up to `limit` picks, one from each group in turn, so every day and place gets its best before any gets a second. */
function takeRoundRobin(lists: readonly Ranked[][], limit: number): Ranked[][] {
  const out = lists.map((): Ranked[] => []);
  let taken = 0;
  for (let round = 0; taken < limit; round++) {
    let tookOne = false;
    for (let i = 0; i < lists.length && taken < limit; i++) {
      const next = lists[i]?.[round];
      if (!next) continue;
      out[i]?.push(next);
      taken++;
      tookOne = true;
    }
    if (!tookOne) break;
  }
  return out;
}

/**
 * A group's place and entry: the entry most of its photos are linked to, else
 * the nearest entry location within `labelRadiusM` (its entry only when it is
 * of the same day). A group without a place is named after its one entry, if
 * all its photos share one.
 */
function labelOf(group: Group, entries: readonly PhotoPickEntry[]): { place: string | null; entryId: number | null } {
  const counts = new Map<number, number>();
  for (const m of group.members) for (const id of m.photo.entryIds) counts.set(id, (counts.get(id) ?? 0) + 1);
  const linked = [...counts.entries()].sort((a, b) => b[1] - a[1] || a[0] - b[0])[0]?.[0] ?? null;
  const linkedEntry = linked === null ? undefined : entries.find((e) => e.id === linked);
  const centre = group.centre;
  if (!centre) {
    const all = linked !== null && group.members.every((m) => m.photo.entryIds.includes(linked));
    return { place: all ? (linkedEntry?.location ?? null) : null, entryId: linked };
  }
  let nearest: { entry: PhotoPickEntry; d: number } | null = null;
  for (const e of entries) {
    if (e.lat === null || e.lng === null) continue;
    const d = haversineMetres(centre.lat, centre.lng, e.lat, e.lng);
    if (d <= PHOTO_PICK.labelRadiusM && (!nearest || d < nearest.d)) nearest = { entry: e, d };
  }
  const name = nearest ? (nearest.entry.location ?? nearest.entry.title) : null;
  const sameDay = nearest && nearest.entry.date === group.day ? nearest.entry.id : null;
  return { place: name ?? linkedEntry?.location ?? null, entryId: linked ?? sameDay };
}

/** Days in calendar order, `undated` last. */
function byDay(a: string, b: string): number {
  if (a === 'undated' || b === 'undated') return Number(a === 'undated') - Number(b === 'undated');
  return a < b ? -1 : 1;
}

/** Something taken at a time: a pick (its own id) or a placed photo (its photo's). */
interface Timed {
  at: number | null;
  photoId?: number;
  photo?: { photoId: number };
}

function byTime(a: Timed, b: Timed): number {
  if (a.at !== null && b.at !== null && a.at !== b.at) return a.at - b.at;
  if (a.at === null && b.at !== null) return 1;
  if (a.at !== null && b.at === null) return -1;
  return (a.photoId ?? a.photo?.photoId ?? 0) - (b.photoId ?? b.photo?.photoId ?? 0);
}
