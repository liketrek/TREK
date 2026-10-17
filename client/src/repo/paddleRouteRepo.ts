import {
  MAX_PADDLE_ROUTE_LEGS,
  type PaddleBoatType,
  type PaddleLakeStyle,
  type PaddleRouteLeg,
  type PaddleRoutePoint,
} from '@trek/shared';
import { paddleRouteApi } from '../api/paddleRoute';
import { isEffectivelyOffline } from '../sync/networkMode';

export interface PaddleRouteProfile {
  boat: PaddleBoatType;
  lakeStyle: PaddleLakeStyle;
}

/** A leg the router could not be asked for: offline, or the answer did not come. */
export type PaddleLegAnswer = PaddleRouteLeg | { status: 'failed'; code: 'offline'; at: null };

const OFFLINE: PaddleLegAnswer = { status: 'failed', code: 'offline', at: null };
const NO_ANSWER: PaddleLegAnswer = { status: 'failed', code: 'no_water_path', at: null };

/** How many planned legs stay remembered; a leg asked again comes from here and costs no request. */
const REMEMBERED_LEGS = 300;

const remembered = new Map<string, PaddleRouteLeg>();

function keyOf(
  tripId: number | string,
  from: PaddleRoutePoint,
  to: PaddleRoutePoint,
  profile: PaddleRouteProfile
): string {
  return [
    tripId,
    from.lat.toFixed(6),
    from.lng.toFixed(6),
    to.lat.toFixed(6),
    to.lng.toFixed(6),
    profile.boat,
    profile.lakeStyle,
  ].join('|');
}

function remember(key: string, leg: PaddleRouteLeg): void {
  remembered.delete(key);
  remembered.set(key, leg);
  if (remembered.size > REMEMBERED_LEGS) remembered.delete(remembered.keys().next().value as string);
}

/**
 * PAD-11: legs planned on the water, online only on purpose: the network lives
 * on the server. A leg planned before comes from memory, so moving one point
 * asks only for the two legs at it; a leg that failed is asked again next time.
 * Offline every leg comes back failed as `offline`, and the planner keeps the
 * stretch visibly unrouted.
 */
export const paddleRouteRepo = {
  async plan(
    tripId: number | string,
    legs: ReadonlyArray<{ from: PaddleRoutePoint; to: PaddleRoutePoint }>,
    profile: PaddleRouteProfile,
    signal?: AbortSignal
  ): Promise<PaddleLegAnswer[]> {
    const keys = legs.map(({ from, to }) => keyOf(tripId, from, to, profile));
    const answers: Array<PaddleLegAnswer | undefined> = keys.map((key) => remembered.get(key));
    const missing = answers.flatMap((answer, index) => (answer ? [] : [index]));
    if (missing.length > 0 && isEffectivelyOffline()) return answers.map((answer) => answer ?? OFFLINE);
    for (let start = 0; start < missing.length; start += MAX_PADDLE_ROUTE_LEGS) {
      const batch = missing.slice(start, start + MAX_PADDLE_ROUTE_LEGS);
      const asked = batch.flatMap((index) => {
        const leg = legs[index];
        return leg ? [{ index, leg }] : [];
      });
      const planned = await paddleRouteApi.plan(
        tripId,
        { legs: asked.map(({ leg }) => leg), boat: profile.boat, lake_style: profile.lakeStyle },
        signal
      );
      asked.forEach(({ index }, at) => {
        const leg = planned.legs[at];
        const key = keys[index];
        if (!leg || key === undefined) return;
        answers[index] = leg;
        if (leg.status === 'ok') remember(key, leg);
      });
    }
    return answers.map((answer) => answer ?? NO_ANSWER);
  },

  /** P2A-05: forget a leg, so the next plan asks the server again (on its current data). */
  forget(tripId: number | string, from: PaddleRoutePoint, to: PaddleRoutePoint, profile: PaddleRouteProfile): void {
    const key = keyOf(tripId, from, to, profile);
    remembered.delete(key);
  },
};
