import { escapeHtml, type GeometryPoint } from '@trek/shared';

/**
 * P7: a route file the user attached in the chat, cut into one GPX text per
 * track or route, so each comes in as a tour of its own and can be taken back
 * on its own. A GPX file is cut out of its own text, so every point keeps
 * what it carried (times, heights, extensions); a KML or KMZ line, which
 * holds no times, is written as GPX from its points.
 */

type TrackTag = 'trk' | 'rte';

/** Where every `<trk>` and `<rte>` element of a GPX text starts and ends, in order. */
function trackBlocks(gpx: string): Array<{ tag: TrackTag; from: number; to: number }> {
  const blocks: Array<{ tag: TrackTag; from: number; to: number }> = [];
  let at = 0;
  for (;;) {
    const trk = openingAt(gpx, 'trk', at);
    const rte = openingAt(gpx, 'rte', at);
    const next = [trk, rte].filter((found) => found >= 0).sort((a, b) => a - b)[0];
    if (next === undefined) return blocks;
    const tag: TrackTag = next === trk ? 'trk' : 'rte';
    const close = gpx.indexOf(`</${tag}>`, next);
    if (close < 0) return blocks;
    const to = close + tag.length + 3;
    blocks.push({ tag, from: next, to });
    at = to;
  }
}

/** The first `<tag>` or `<tag ...>` from `at`, not a longer tag such as `<trkseg>`. */
function openingAt(text: string, tag: string, at: number): number {
  let from = at;
  for (;;) {
    const found = text.indexOf(`<${tag}`, from);
    if (found < 0) return -1;
    const after = text.charAt(found + tag.length + 1);
    if (after === '>' || after === ' ' || after === '\n' || after === '\r' || after === '\t') return found;
    from = found + 1;
  }
}

/** One piece cut out of a GPX file: whether it is a track or a route, and its own GPX text. */
export interface GpxTrackPiece {
  tag: TrackTag;
  gpx: string;
}

/**
 * One GPX text per track and route of a GPX file, in the file's order: the
 * file's head (its declaration, the `<gpx>` element and its metadata) around
 * each element. Empty where the file holds none the cut can find (a
 * namespace prefix, say).
 */
export function splitGpxTrackPieces(gpx: string): GpxTrackPiece[] {
  const blocks = trackBlocks(gpx);
  const first = blocks[0];
  if (!first) return [];
  const head = gpx.slice(0, first.from);
  // The head ends before the first waypoint as well: an import never takes loose points.
  const wpt = openingAt(head, 'wpt', 0);
  const kept = wpt >= 0 ? head.slice(0, wpt) : head;
  return blocks.map(({ tag, from, to }) => ({ tag, gpx: `${kept}${gpx.slice(from, to)}\n</gpx>\n` }));
}

/** The GPX texts of splitGpxTrackPieces, in the file's order. */
export function splitGpxTracks(gpx: string): string[] {
  return splitGpxTrackPieces(gpx).map((piece) => piece.gpx);
}

/** A line read from a KML or KMZ file as a GPX text of one track. */
export function gpxOfLine(name: string, description: string | null, line: readonly GeometryPoint[]): string {
  const points = line
    .map(([lat, lng, ele]) => {
      const height = typeof ele === 'number' && Number.isFinite(ele) ? `<ele>${ele}</ele>` : '';
      return `<trkpt lat="${lat}" lon="${lng}">${height}</trkpt>`;
    })
    .join('');
  const desc = description ? `<desc>${escapeHtml(description)}</desc>` : '';
  return (
    '<?xml version="1.0" encoding="UTF-8"?>\n' +
    '<gpx version="1.1" creator="TREK" xmlns="http://www.topografix.com/GPX/1/1">\n' +
    `<trk><name>${escapeHtml(name)}</name>${desc}<trkseg>${points}</trkseg></trk>\n</gpx>\n`
  );
}
