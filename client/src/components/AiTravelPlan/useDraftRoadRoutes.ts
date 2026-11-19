import type { TravelPlanDraftDay, TravelPlanLeg, ValhallaCosting } from '@trek/shared';
import { useEffect, useMemo, useRef, useState } from 'react';
import { valhallaRelayRepo } from '../../repo/valhallaRelayRepo';
import { decodePolyline } from '../Map/transitGeometry';

type Line = [number, number][];

/** The modes a road router can draw. A train, a flight or a boat keeps its straight sketch. */
const ROAD_MODES = new Set<TravelPlanLeg['mode']>(['walk', 'drive']);

interface DraftRun {
  /** Costing and every point, so a moved stop is asked again and one seen before is not. */
  key: string;
  costing: ValhallaCosting;
  points: { lat: number; lon: number }[];
  /** The run as drawn before any answer, and where no answer comes. */
  straight: Line;
  /** False for a run with a leg no road router should draw, whatever the answer would be. */
  routable: boolean;
}

/** Answers kept for the session: a revision back to the same stops is drawn at once. */
const roadCache = new Map<string, Line>();

/**
 * Every unbroken chain of stops a draft claims, day by day. A gap (no
 * `travelFromPrevious`) ends the chain, so the map keeps the gap.
 */
function runsOf(days: TravelPlanDraftDay[]): DraftRun[] {
  const runs: DraftRun[] = [];
  for (const day of days) {
    let run: DraftRun | null = null;
    for (let index = 1; index < day.items.length; index += 1) {
      const leg = day.items[index].travelFromPrevious;
      if (!leg) {
        run = null;
        continue;
      }
      const from = day.items[index - 1].place;
      const to = day.items[index].place;
      if (!run) {
        run = {
          key: '',
          costing: 'pedestrian',
          points: [{ lat: from.lat, lon: from.lng }],
          straight: [[from.lat, from.lng]],
          routable: true,
        };
        runs.push(run);
      }
      if (leg.mode === 'drive') run.costing = 'auto';
      if (!ROAD_MODES.has(leg.mode)) run.routable = false;
      run.points.push({ lat: to.lat, lon: to.lng });
      run.straight.push([to.lat, to.lng]);
    }
  }
  for (const run of runs) {
    run.key = `${run.costing}:${run.points.map((point) => `${point.lat},${point.lon}`).join('|')}`;
  }
  return runs;
}

/** The answer's legs as one line, in the planner's own coordinates; null if it is not a route. */
function roadLineOf(answer: unknown): Line | null {
  const legs = (answer as { trip?: { legs?: { shape?: unknown }[] } })?.trip?.legs;
  if (!Array.isArray(legs) || legs.length === 0) return null;
  const line: Line = [];
  for (const leg of legs) {
    if (!leg || typeof leg.shape !== 'string' || leg.shape === '') return null;
    for (const point of decodePolyline(leg.shape, 6)) {
      const last = line[line.length - 1];
      if (last && last[0] === point[0] && last[1] === point[1]) continue;
      line.push(point);
    }
  }
  return line.length >= 2 ? line : null;
}

export interface DraftRoadRoutes {
  /** One line per unbroken chain, in day order: the road answer where there is one, the sketch otherwise. */
  lines: Line[];
  /** True while every line is the straight sketch, so the map still has to say so. */
  sketchOnly: boolean;
}

/**
 * The draft's legs drawn along the road network rather than as straight hops.
 *
 * The relay answers inside China with Amap and elsewhere with the Valhalla, so the
 * same call draws roads on either side; a refusal or a missing answer leaves the
 * straight sketch the map has always drawn. Questions go one chain at a time, as
 * the relay paces the key anyway and a preview is not worth a burst.
 */
export function useDraftRoadRoutes(days: TravelPlanDraftDay[]): DraftRoadRoutes {
  const runs = useMemo(() => runsOf(days), [days]);
  const [answers, setAnswers] = useState<Map<string, Line>>(new Map());
  // Chains that already failed here, so a rerender does not ask again; a remount may.
  const failed = useRef<Set<string>>(new Set());

  useEffect(() => {
    const wanted = runs.filter(
      (run) => run.routable && !roadCache.has(run.key) && !answers.has(run.key) && !failed.current.has(run.key)
    );
    if (wanted.length === 0) return;

    const controller = new AbortController();
    let cancelled = false;
    void (async () => {
      const found = new Map<string, Line>();
      for (const run of wanted) {
        try {
          const response = await valhallaRelayRepo.ask(
            'route',
            { locations: run.points, costing: run.costing },
            controller.signal
          );
          if (!response.ok) {
            failed.current.add(run.key);
            continue;
          }
          const line = roadLineOf(await response.json());
          if (!line) {
            failed.current.add(run.key);
            continue;
          }
          roadCache.set(run.key, line);
          found.set(run.key, line);
        } catch {
          // Aborted by the cleanup below is not a failure; anything else keeps the sketch.
          if (!cancelled) failed.current.add(run.key);
          if (cancelled) return;
        }
      }
      if (!cancelled && found.size > 0) setAnswers((previous) => new Map([...previous, ...found]));
    })();

    return () => {
      cancelled = true;
      controller.abort();
    };
  }, [runs, answers]);

  return useMemo(() => {
    const lines = runs.map((run) =>
      run.routable ? (answers.get(run.key) ?? roadCache.get(run.key) ?? run.straight) : run.straight
    );
    const sketchOnly = runs.every((run) => !run.routable || !(answers.has(run.key) || roadCache.has(run.key)));
    return { lines, sketchOnly };
  }, [runs, answers]);
}
