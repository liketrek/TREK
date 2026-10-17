import type { PaddleRegionLoadState, PaddleRoutePoint } from '@trek/shared';
import { paddleRegionLoadApi } from '../api/paddleRegionLoad';
import { isEffectivelyOffline } from '../sync/networkMode';

/**
 * PAD-11C: the water data around places no paddle region covers, online
 * only on purpose: the server loads it, and a load asked for offline would
 * only start long after the paddler stopped waiting for it. Offline it
 * answers null, and the planner keeps saying why the leg is unplanned.
 */
export const paddleRegionLoadRepo = {
  async load(
    points: readonly PaddleRoutePoint[],
    retry: boolean,
    signal?: AbortSignal
  ): Promise<PaddleRegionLoadState[] | null> {
    if (points.length === 0 || isEffectivelyOffline()) return null;
    return await paddleRegionLoadApi.load({ points: [...points], retry }, signal);
  },
};
