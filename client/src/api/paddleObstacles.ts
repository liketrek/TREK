import { paddleObstaclesResponseSchema, type PaddleObstaclesResponse } from '@trek/shared';
import apiClient from './client';

/** PAD-05A: the paddle objects of a map area and how far TREK's data covers it. */
export const paddleObstaclesApi = {
  inBox: (
    box: { south: number; west: number; north: number; east: number },
    signal?: AbortSignal
  ): Promise<PaddleObstaclesResponse> =>
    apiClient
      .get('/paddle/obstacles', {
        params: { bbox: [box.south, box.west, box.north, box.east].map((v) => v.toFixed(5)).join(',') },
        signal,
      })
      .then((r) => paddleObstaclesResponseSchema.parse(r.data)),
};
