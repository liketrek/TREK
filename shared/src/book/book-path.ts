import { MAX_PATH_POINTS, MAX_PATH_SEGMENTS } from './book.schema';

/**
 * A journey's tracks, thinned to what a printed line can show.
 *
 * A three-week drive is hundreds of thousands of GPS fixes. At the size a map
 * is printed, a point every fifteen metres and a point every kilometre are the
 * same picture, and only one of them fits in a document that has to be saved,
 * sent over a websocket and parsed on the other side. Moved here from the
 * Studio (client/src/pages/journeyStudio/useJourneyStudio.ts) so the server's
 * design tool draws the same line the editor does.
 *
 * Thinned by taking every nth point rather than by simplifying the geometry:
 * Douglas-Peucker would keep the shape better, and it is a hundred lines of
 * code to gain something nobody can see at 60mm across. The ends of every
 * segment are kept, because a track that stops short of where it ended reads
 * as a bug.
 */

/** Points one thinned segment keeps, under the document's own cap. */
const PER_SEGMENT = Math.min(600, MAX_PATH_POINTS);

export function bookPath(tracks: readonly { points: readonly (readonly unknown[])[] }[]): [number, number][][] {
  const out: [number, number][][] = [];
  for (const track of tracks.slice(0, MAX_PATH_SEGMENTS)) {
    // Normalised on the way in: the contract types a pair as a tuple, and Zod
    // infers that loosely enough that the pair has to be rebuilt to stay one.
    const pts = track.points
      .map((p): [number, number] => [Number(p[0]), Number(p[1])])
      .filter((p) => Number.isFinite(p[0]) && Number.isFinite(p[1]));
    if (pts.length < 2) continue;
    if (pts.length <= PER_SEGMENT) {
      out.push(pts);
      continue;
    }
    const step = (pts.length - 1) / (PER_SEGMENT - 1);
    const thinned: [number, number][] = [];
    for (let i = 0; i < PER_SEGMENT; i++) {
      const at = pts[Math.round(i * step)];
      if (at) thinned.push(at);
    }
    out.push(thinned);
  }
  return out;
}
