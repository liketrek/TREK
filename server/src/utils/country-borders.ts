import fs from 'fs';
import path from 'path';
import zlib from 'zlib';

// ── The bundled admin-0 borders and the country a point lies in ─────────────
//
// Plain module on purpose, like nest/atlas/atlas-geo.ts it was taken out of: no DI,
// no DB access, no Nest imports. It sits outside the domains because more than one
// of them asks which country a coordinate lies in: atlas, journey and integrations
// (through the re-export in atlas-geo) for the countries of places and visits, maps
// for the country an index suggestion names. Importing it from atlas tied maps into
// an import cycle with atlas (lint:boundaries).
//
// atlas-geo resolves admin-1 regions with the per-country asset path and the packed ring
// test exported here. The admin0 file path and the country poly/box
// indexes below are file-scoped for the reason atlas-geo gives: their lifetime stays
// process-global however many callers there are, so the indexes are built once per
// process, which the #1576 OOM fix depends on.

// ── Bundled boundary GeoJSON (admin-0 countries + admin-1 regions) ─────────
//
// Sourced from geoBoundaries (CC BY 4.0), normalized + quantized offline by
// scripts/build-atlas-geo.mjs into gzipped FeatureCollections under server/assets:
// admin0 as one file, admin1 as one file per country (the whole admin1 bundle ships
// too, for two migrations that read it). No network at runtime.
// (Replaces the previous runtime fetch of Natural Earth, which was stale for recent
// sub-national reforms and depicts some contested borders in unwanted ways.)
//
// __dirname is server/dist/utils at runtime and server/src/utils under vitest;
// both resolve ../../assets to server/assets.

function assetPath(name: 'admin0'): string {
  return path.join(__dirname, '..', '..', 'assets', 'atlas', `${name}.geojson.gz`);
}

/** One country's admin-1 regions, a FeatureCollection of its own, named by ISO_A2. */
export function admin1AssetPath(countryCode: string): string {
  return path.join(__dirname, '..', '..', 'assets', 'atlas', 'admin1', `${countryCode}.geojson.gz`);
}

// The admin0 bytes are not kept: countries/geo sends the file from disk, and the country
// index below reads it once while it is built.
let admin0File: string | null | undefined;
export function getAdmin0File(): string | null {
  if (admin0File !== undefined) return admin0File;
  const file = assetPath('admin0');
  if (!fs.existsSync(file)) {
    console.warn(`[Atlas] admin0.geojson.gz missing — run \`node scripts/build-atlas-geo.mjs\``);
    return (admin0File = null);
  }
  return (admin0File = file);
}

// Feed arbitrary gunzip chunks; invokes onFeature(text) once per top-level Feature object
// inside "features":[ … ]. `pending` holds only the unconsumed tail (at most one partial
// feature + the current chunk), keeping memory flat regardless of bundle size.
function createFeatureSplitter(onFeature: (text: string) => void): (chunk: string) => void {
  let pending = '';
  let started = false;
  // Scan progress is carried across chunks so each character is examined exactly once.
  // A large Feature (e.g. Canada, ~5.5MB) spans hundreds of gunzip chunks; re-scanning the
  // accumulated partial from the start on every chunk was O(n²) per feature and pushed the
  // one-time admin1 build (since replaced by per-country files) past the 15s test timeout
  // under coverage/CI (#1576-followup).
  let scanning = false; // currently inside a Feature object?
  let depth = 0,
    inStr = false,
    esc = false;
  let scanPos = 0,
    featStart = 0; // resume point + current feature start, in `pending`
  return (chunk: string) => {
    pending += chunk;
    if (!started) {
      const fi = pending.indexOf('"features"');
      if (fi === -1) return;
      const br = pending.indexOf('[', fi);
      if (br === -1) return;
      pending = pending.slice(br + 1);
      started = true;
      scanPos = 0;
    }
    const n = pending.length;
    while (scanPos < n) {
      if (!scanning) {
        const c = pending[scanPos];
        if (c === ' ' || c === '\n' || c === '\r' || c === '\t' || c === ',') {
          scanPos++;
          continue;
        }
        if (c === ']') {
          scanPos = n;
          break;
        }
        if (c !== '{') {
          scanPos++;
          continue;
        }
        scanning = true;
        depth = 0;
        inStr = false;
        esc = false;
        featStart = scanPos;
      }
      let end = -1;
      for (let j = scanPos; j < n; j++) {
        const c = pending[j];
        if (inStr) {
          if (esc) esc = false;
          else if (c === '\\') esc = true;
          else if (c === '"') inStr = false;
        } else if (c === '"') inStr = true;
        else if (c === '{') depth++;
        else if (c === '}') {
          if (--depth === 0) {
            end = j + 1;
            scanPos = j + 1;
            break;
          }
        }
      }
      if (end === -1) {
        scanPos = n;
        break;
      } // partial feature — resume from n next chunk
      onFeature(pending.slice(featStart, end));
      scanning = false;
    }
    // Drop the fully-consumed prefix, keeping at most the current partial feature.
    const keepFrom = scanning ? featStart : scanPos;
    if (keepFrom > 0) {
      pending = pending.slice(keepFrom);
      scanPos -= keepFrom;
      if (scanning) featStart -= keepFrom;
    }
  };
}

// ── Bounding-box lookup tables ──────────────────────────────────────────────

// Territories that have their own ISO code but no admin0 polygon in the bundle.
// Without a polygon they can't be point-in-polygon tested, so they rely purely on
// their box and win via the smallest-box tie-break in getCountryFromCoords()
// (e.g. Hong Kong/Macau over China, Gibraltar over Spain).
const MICRO_TERRITORY_BOXES: Record<string, [number, number, number, number]> = {
  HK: [113.83, 22.15, 114.43, 22.56],
  MO: [113.53, 22.1, 113.6, 22.21],
  GI: [-5.36, 36.11, -5.33, 36.16],
  PR: [-67.3, 17.88, -65.22, 18.53],
  PS: [34.2, 29.5, 35.6, 32.6],
  XK: [20.0, 41.9, 21.8, 43.3],
};

// A polygon-less micro-territory box only auto-wins the smallest-box tie-break when it is
// TIGHT around the enclave. HK(0.25°²), MO(0.008), GI(0.0015) and PR(1.35) hug their
// territory, so a point inside them really is in that territory. PS(4.34) and XK(2.52) are
// loose regional rectangles that sprawl across a sovereign neighbour (PS over Israel, XK
// over North Macedonia) — a point there usually belongs to the neighbour, so those boxes
// must NOT auto-win; they defer to the neighbour's real polygon first (see #1490-class fix
// below). This threshold sits between PR and XK.
const MICRO_BOX_MAX_AREA = 2.0;

// ── Point-in-polygon over the bundled admin0 borders (#1331) ─────────────────

// Ray-casting (even-odd) test of (lng,lat) against ring pairs [from, to) of packed
// coordinates. Each one is divided back by the scale before use: for coordinates with no
// more decimals than the scale holds that gives back the exact double the bundle had, so the
// answer is the one a Float64 ring of the same points gives.
function pointInPackedRing(
  lng: number,
  lat: number,
  coords: Int16Array | Int32Array,
  scale: number,
  from: number,
  to: number,
): boolean {
  let inside = false;
  let xj = coords[2 * (to - 1)] / scale;
  let yj = coords[2 * (to - 1) + 1] / scale;
  for (let i = from; i < to; i++) {
    const xi = coords[2 * i] / scale;
    const yi = coords[2 * i + 1] / scale;
    if (yi > lat !== yj > lat && lng < ((xj - xi) * (lat - yi)) / (yj - yi) + xi) {
      inside = !inside;
    }
    xj = xi;
    yj = yi;
  }
  return inside;
}

// True when (lng,lat) falls inside a packed Polygon/MultiPolygon, honouring holes: the
// first ring of each polygon is its outer boundary, the rest are holes.
export function pointInPackedGeometry(lng: number, lat: number, geom: PackedGeom, scale: number): boolean {
  const { coords, ringStarts, polyRingCounts } = geom;
  let ri = 0;
  for (const rc of polyRingCounts) {
    if (pointInPackedRing(lng, lat, coords, scale, ringStarts[ri], ringStarts[ri + 1])) {
      let inHole = false;
      for (let h = 1; h < rc; h++) {
        if (pointInPackedRing(lng, lat, coords, scale, ringStarts[ri + h], ringStarts[ri + h + 1])) {
          inHole = true;
          break;
        }
      }
      if (!inHole) return true;
    }
    ri += rc;
  }
  return false;
}

// Packed polygon geometry: every ring's [lng,lat] pairs back to back in one typed array, each
// value times a scale. Ring r is pairs ringStarts[r] up to ringStarts[r + 1]; polyRingCounts[k]
// is how many rings polygon k owns. Three typed arrays per geometry instead of one per ring,
// at a quarter (Int16, admin-0) or half (Int32, admin-1) of the bytes per point.
export type PackedGeom = { coords: Int16Array | Int32Array; ringStarts: Uint32Array; polyRingCounts: Uint32Array };
type Box = [number, number, number, number]; // [minLng, minLat, maxLng, maxLat]

// The admin-0 bundle is quantized to ADM0_DECIMALS = 2 (scripts/build-atlas-geo.mjs) and no
// coordinate passes ±180, so every one is a whole number of hundredths within ±18000 and fits
// an Int16 exactly (ATLAS-BUNDLE-010 guards it). A third decimal needs ×1000 here and an
// Int32Array, since ±180000 does not fit an Int16.
const ADMIN0_SCALE = 100;

// ISO_A2 → packed admin0 geometry + bounding boxes, derived from the bundled admin0
// borders on first use. The parsed FeatureCollection is dropped after this runs; only the
// Int16 coordinates and the boxes are retained (≈9MB for the 2M points, vs ≈34MB as
// Float64Array rings and ≈145MB as the parsed geometry, #1576).
//
// The boxes used to be a hand-maintained table, which drifted: 43 countries (NG, BY,
// GL, KP, TD, SS, …) had no box at all, so their coordinates fell into a *neighbour's*
// box instead and resolved to the wrong country — Lagos came out as Benin, Minsk as
// Russia (#1490). Deriving them from the same polygons we already ship keeps the two
// in lockstep and can't drift again.
//
// One box is stored PER GEOMETRY PART, not per country. A single box around a country
// that straddles the antimeridian (RU, US, FJ, KI) would span nearly the whole globe;
// per-part boxes keep Alaska and Chukotka separate and handle the ±180 wrap for free.
let countryPolyIndex: Map<string, PackedGeom> | null = null;
let countryBoxIndex: Map<string, Box[]> | null = null;

function buildCountryIndexes(): void {
  const polys = new Map<string, PackedGeom>();
  const boxes = new Map<string, Box[]>();

  const file = getAdmin0File();
  if (file) {
    // Parse ONE feature at a time off the gunzipped string rather than JSON.parse-ing the
    // whole FeatureCollection: the full parse transiently allocates ~285MB (the 145MB
    // object graph plus intermediates) and V8 keeps those pages, which alone exhausts a
    // 512MB host before admin1 even loads (#1576).
    const json = zlib.gunzipSync(fs.readFileSync(file)).toString('utf8');
    const consume = createFeatureSplitter((text) => {
      const f = JSON.parse(text);
      const raw = f.properties?.ISO_A2;
      if (!raw || raw === '-99' || !f.geometry) return;
      const code = String(raw).toUpperCase();

      const parts = (
        f.geometry.type === 'Polygon' ? [f.geometry.coordinates] : f.geometry.coordinates
      ) as number[][][][];
      let points = 0;
      let ringCount = 0;
      for (const part of parts) {
        ringCount += part.length;
        for (const ring of part) points += ring.length;
      }
      const coords = new Int16Array(points * 2);
      const ringStarts = new Uint32Array(ringCount + 1);
      const polyRingCounts = new Uint32Array(parts.length);
      const codeBoxes = boxes.get(code) ?? [];
      let p = 0;
      let ri = 0;
      for (const [k, part] of parts.entries()) {
        polyRingCounts[k] = part.length;
        for (const ring of part) {
          ringStarts[ri++] = p;
          for (const [lng, lat] of ring) {
            coords[2 * p] = Math.round(lng * ADMIN0_SCALE);
            coords[2 * p + 1] = Math.round(lat * ADMIN0_SCALE);
            p++;
          }
        }
        // Bounding box from the part's outer ring (part[0]).
        let minLng = Infinity,
          minLat = Infinity,
          maxLng = -Infinity,
          maxLat = -Infinity;
        for (const [lng, lat] of part[0]) {
          if (lng < minLng) minLng = lng;
          if (lng > maxLng) maxLng = lng;
          if (lat < minLat) minLat = lat;
          if (lat > maxLat) maxLat = lat;
        }
        codeBoxes.push([minLng, minLat, maxLng, maxLat]);
      }
      ringStarts[ri] = p;
      // Matches the previous index exactly: geometry is overwritten (last feature for a
      // code wins) while boxes accumulate across a code's features.
      polys.set(code, { coords, ringStarts, polyRingCounts });
      boxes.set(code, codeBoxes);
    });
    consume(json);
  }

  // Micro-territories aren't in admin0 — give them their box, but no polygon.
  for (const [code, box] of Object.entries(MICRO_TERRITORY_BOXES)) {
    if (!boxes.has(code)) boxes.set(code, [box]);
  }

  countryPolyIndex = polys;
  countryBoxIndex = boxes;
}

function getCountryPolyIndex(): Map<string, PackedGeom> {
  if (!countryPolyIndex) buildCountryIndexes();
  return countryPolyIndex!;
}

function getCountryBoxIndex(): Map<string, Box[]> {
  if (!countryBoxIndex) buildCountryIndexes();
  return countryBoxIndex!;
}

// Broad sanity check — is (lat,lng) anywhere within the country's own admin0 bounding
// box(es)? Deliberately looser than the polygon test in getCountryFromCoords: a genuine
// border-simplification miss (a point just outside the exact border) still needs to pass
// this, so it only rejects a country that isn't even in the right part of the globe. Used
// to gate the address-derived fallback in both country and region resolution.
export function isPointInCountryBox(countryCode: string, lat: number, lng: number): boolean {
  const boxes = getCountryBoxIndex().get(countryCode.toUpperCase());
  if (!boxes) return false;
  return boxes.some(
    ([minLng, minLat, maxLng, maxLat]) => lat >= minLat && lat <= maxLat && lng >= minLng && lng <= maxLng,
  );
}

export function getCountryFromCoords(lat: number, lng: number): string | null {
  // Cheap prefilter: every country with a part-box containing the point. Keep the
  // area of the matching part so overlapping candidates can be ranked below.
  const candidates: { code: string; area: number }[] = [];
  for (const [code, boxes] of getCountryBoxIndex()) {
    for (const [minLng, minLat, maxLng, maxLat] of boxes) {
      if (lat >= minLat && lat <= maxLat && lng >= minLng && lng <= maxLng) {
        candidates.push({ code, area: (maxLng - minLng) * (maxLat - minLat) });
        break;
      }
    }
  }
  if (candidates.length === 0) return null;

  // Boxes overlap near borders, so a point can sit in several — picking the smallest
  // box alone mis-assigns a point just across the border (#1331). Disambiguate with
  // the real admin0 polygon: try candidates smallest-box-first and return the one whose
  // polygon actually contains the point. A candidate with no polygon (a micro-territory
  // like HK/MO/GI) keeps the smallest-box win — but only when its box is tight enough to
  // trust (MICRO_BOX_MAX_AREA); a loose regional box (PS/XK) defers to a real neighbour
  // polygon so it can't steal a point that lies inside that sovereign (Tel Aviv → IL,
  // Skopje → MK), while a genuine PS/XK point still lands on the deferred box below.
  //
  // This runs even for a lone candidate. Short-circuiting a single match was what let a
  // point resolve to a country whose polygon plainly excludes it (#1490).
  candidates.sort((a, b) => a.area - b.area);
  const polys = getCountryPolyIndex();
  let looseBoxFallback: string | null = null;
  for (const { code, area } of candidates) {
    const poly = polys.get(code);
    if (!poly) {
      if (area <= MICRO_BOX_MAX_AREA) return code;
      if (looseBoxFallback === null) looseBoxFallback = code;
      continue;
    }
    if (pointInPackedGeometry(lng, lat, poly, ADMIN0_SCALE)) return code;
  }
  // No tight micro-box and no polygon contained the point — prefer a deferred loose box
  // (a real PS/XK point), else fall back to the smallest box (coastal slop / data gap).
  return looseBoxFallback ?? candidates[0].code;
}
