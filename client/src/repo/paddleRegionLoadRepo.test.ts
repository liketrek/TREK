// FE-REPO-PADDLE-REGION-LOAD-001 to 003: the water data of places asked for online only (PAD-11C).
import { paddleRegionLoadRequestSchema, paddleRegionLoadResponseSchema } from '@trek/shared';
import { http, HttpResponse } from 'msw';
import { afterEach, describe, expect, it } from 'vitest';
import { contractHandler } from '../../tests/helpers/msw/contract';
import { server } from '../../tests/helpers/msw/server';
import { setForcedOffline } from '../sync/networkMode';
import { paddleRegionLoadRepo } from './paddleRegionLoadRepo';

const LOAD = '/api/paddle/regions/load';
const PLACE = { lat: 53.2, lng: 12.9 };

describe('paddleRegionLoadRepo', () => {
  afterEach(() => setForcedOffline(false));

  it('FE-REPO-PADDLE-REGION-LOAD-001: asks the server for the places and answers its states in order', async () => {
    const bodies: unknown[] = [];
    server.use(
      contractHandler(
        'post',
        LOAD,
        { request: paddleRegionLoadRequestSchema, response: paddleRegionLoadResponseSchema },
        async ({ request }) => {
          bodies.push(await request.json());
          return { points: [{ state: 'ready' as const, region: { id: 'mv', name: 'Mecklenburg' } }] };
        }
      )
    );
    await expect(paddleRegionLoadRepo.load([PLACE], true)).resolves.toEqual([
      { state: 'ready', region: { id: 'mv', name: 'Mecklenburg' } },
    ]);
    expect(bodies).toEqual([{ points: [PLACE], retry: true }]);
  });

  it('FE-REPO-PADDLE-REGION-LOAD-002: asks nothing offline or about no place', async () => {
    setForcedOffline(true);
    await expect(paddleRegionLoadRepo.load([PLACE], false)).resolves.toBeNull();
    setForcedOffline(false);
    await expect(paddleRegionLoadRepo.load([], false)).resolves.toBeNull();
  });

  it('FE-REPO-PADDLE-REGION-LOAD-003: refuses an answer that is not the contract', async () => {
    server.use(http.post(LOAD, () => HttpResponse.json({ points: [{ state: 'maybe' }] })));
    await expect(paddleRegionLoadRepo.load([PLACE], false)).rejects.toMatchObject({ name: 'ZodError' });
  });
});
