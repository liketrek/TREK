/**
 * The one merge behind the search list and the suggestion list (`mergeRanked`),
 * with the rules for the lead Photon's answer opens the list on.
 *
 * Kept apart from maps.helpers.ts, which it reads from: the place rows and the
 * distance come from there, the ranking of a merged list lives here.
 */
import { haversineMetres, interleave, samePlace } from './maps.helpers';
import type { PhotonLead } from './providers/photon.mapping';

/**
 * Put the index's answer and OpenStreetMap's into one list.
 *
 * Overture Places is a dataset of businesses. It is very good at those and
 * largely does not carry temples, bridges, riverside walks, viewpoints or
 * observation decks, which is a fair share of what somebody planning a trip
 * searches for. Measured against 128 places out of a real trip to Japan, saved
 * through the old search: the index answered 51.6 percent inside its top five,
 * and for most of the rest it returned the shops AROUND the landmark rather
 * than nothing, which is worse than nothing because it looks like an answer.
 *
 * Three orderings were tried against that corpus, and the two clever ones lost.
 *
 * A score threshold cannot tell the cases apart: at 0.75 it catches 19 of 62
 * misses and throws away 6 of 66 hits. Promoting results whose name matches
 * what was typed is worse than it sounds, because "Hase Station" shares a word
 * with "Hase-dera" while OpenStreetMap answers in the local language and
 * returns the correct temple under a name that shares nothing at all: the rule
 * pushed seven weak index matches above the right answer, which landed at
 * position eight.
 *
 * So this does not rank. It alternates, index first, and lets each source's own
 * ordering stand. An exact business match still opens the list, because the
 * index put it first; a landmark the index does not carry is second rather than
 * eleventh. Neither source has to be judged by the other's yardstick.
 *
 * A place both sources know is kept once, as the index's copy, because that is
 * the one carrying a stable id, contact details and hours.
 */
export function mergeSearchResults(
  fromIndex: Record<string, unknown>[],
  fromOsm: Record<string, unknown>[],
  limit = 10,
  opts: { lead?: PhotonLead | null; bias?: { lat: number; lng: number } } = {},
): Record<string, unknown>[] {
  return mergeRanked(fromIndex, fromOsm, limit, recordView, opts);
}

/** What the merge reads of a row: its id, its name, the line below it and where it is. */
export interface RowView {
  id: string | null;
  name: string;
  line: string;
  lat?: number;
  lng?: number;
}

const recordView = (r: Record<string, unknown>): RowView => ({
  id: typeof r.osm_id === 'string' ? r.osm_id : null,
  name: String(r.name ?? ''),
  line: String(r.address ?? ''),
  lat: typeof r.lat === 'number' ? r.lat : undefined,
  lng: typeof r.lng === 'number' ? r.lng : undefined,
});

/**
 * The one merge behind the search list and the suggestion list, so the two
 * agree on what comes first. The second list's rows the first already holds
 * go (the same id, or the same place by `samePlace`), the rest alternate with
 * the first's, the first leading.
 *
 * Then Photon's lead (`pickLead`) goes first, and rows of its name inside it
 * go: "Berlin" no longer opens on a business filed as Berlin above the city.
 * Rows that read the same twice, two branches of a chain with the same town
 * below them, are one row: nobody can tell them apart in the list. A row
 * without a line below its name is never folded that way.
 */
export function mergeRanked<T>(
  first: T[],
  second: T[],
  limit: number,
  view: (row: T) => RowView,
  { lead = null, bias }: { lead?: PhotonLead | null; bias?: { lat: number; lng: number } } = {},
): T[] {
  const asPlace = (row: T) => {
    const v = view(row);
    return { lat: v.lat, lng: v.lng, name: v.name };
  };
  const extra = second.filter((o) => {
    const id = view(o).id;
    return !first.some((i) => (id !== null && view(i).id === id) || samePlace(asPlace(i), asPlace(o)));
  });
  const merged = interleave(first, extra, Number.POSITIVE_INFINITY);
  // Photon's own row first; a row of its name inside it only where that row went as the same place.
  const top =
    lead && leadsHere(lead, bias)
      ? (merged.find((row) => view(row).id === lead.placeId) ?? merged.find((row) => standsFor(view(row), lead)))
      : undefined;
  const ordered = top && lead ? [top, ...merged.filter((row) => row !== top && !standsFor(view(row), lead))] : merged;
  const shown = new Set<string>();
  return ordered
    .filter((row) => {
      const v = view(row);
      // Without a line below the name two rows of one name are told apart by nothing but where they are.
      if (!v.line.trim()) return true;
      const reads = `${foldName(v.name)}\n${foldName(v.line)}`;
      if (shown.has(reads)) return false;
      shown.add(reads);
      return true;
    })
    .slice(0, limit);
}

/** How far from where the traveller looks a town may lie and still be what its name means there. */
export const LEAD_TOWN_REACH_M = 1_000_000;

/** What may lead with nothing to say where the traveller is looking: a town, an island or a sight, not a municipality or a county. */
const UNBIASED_LEADS = new Set(['city', 'town', 'landmark', 'island', 'archipelago', 'airport']);

/** Whether a lead leads from where the traveller is looking. */
export function leadsHere(lead: PhotonLead, bias: { lat: number; lng: number } | undefined): boolean {
  if (lead.reach === 'everywhere') return true;
  if (!bias) return UNBIASED_LEADS.has(lead.kind);
  return haversineMetres(bias.lat, bias.lng, lead.lat, lead.lng) <= LEAD_TOWN_REACH_M;
}

/** Whether a row is the lead itself, under its id or as a row of its name inside it. */
function standsFor(row: RowView, lead: PhotonLead): boolean {
  if (row.id === lead.placeId) return true;
  if (row.lat === undefined || row.lng === undefined || foldName(row.name) !== foldName(lead.name)) return false;
  if (!lead.extent) return haversineMetres(row.lat, row.lng, lead.lat, lead.lng) < LEAD_WITHOUT_EXTENT_M;
  const [west, north, east, south] = lead.extent;
  return row.lng >= west && row.lng <= east && row.lat >= south && row.lat <= north;
}

/** Around a lead Photon gave no extent for, how near a row of its name has to be to be it. */
const LEAD_WITHOUT_EXTENT_M = 25_000;

/** A name as the merge compares it: without accents, case or extra spaces. */
export function foldName(value: string): string {
  return value.normalize('NFKD').replace(/\p{M}/gu, '').toLowerCase().replace(/\s+/gu, ' ').trim();
}
