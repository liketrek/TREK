/**
 * RoutingRelayController: each route hands its action and the signed-in user
 * to the relay and writes Valhalla's answer as it came, status, type and body.
 */
import { RoutingRelayController } from '../../../../src/nest/routing-relay/routing-relay.controller';
import type { RoutingRelayService } from '../../../../src/nest/routing-relay/routing-relay.service';
import type { User } from '../../../../src/types';
import { oneByOne } from '../../../helpers/one-by-one';

import type { Response } from 'express';
import { describe, expect, it, vi } from 'vitest';

function response() {
  const res = { status: vi.fn(), type: vi.fn(), send: vi.fn() };
  res.status.mockReturnValue(res);
  res.type.mockReturnValue(res);
  return res;
}

const user = { id: 4 } as User;
const answer = { status: 400, contentType: 'application/json', body: Buffer.from('{"error_code":171}') };

describe('RoutingRelayController', () => {
  it('RELAY-CTRL-001: asks the relay for the user and passes each answer on untouched', async () => {
    const ask = vi.fn().mockResolvedValue(answer);
    const controller = new RoutingRelayController({ ask } as unknown as RoutingRelayService);
    const route = { locations: [], costing: 'auto' } as never;
    const trace = { encoded_polyline: 'abc', costing: 'pedestrian' } as never;
    const height = { shape: [{ lat: 47, lon: 11 }] } as never;

    await oneByOne(
      [
        [(res: Response) => controller.route(user, route, res), 'route', route],
        [(res: Response) => controller.traceAttributes(user, trace, res), 'trace_attributes', trace],
        [(res: Response) => controller.height(user, height, res), 'height', height],
      ] as const,
      async ([call, action, body]) => {
        const res = response();
        await call(res as unknown as Response);
        expect(ask).toHaveBeenLastCalledWith(4, action, body);
        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.type).toHaveBeenCalledWith('application/json');
        expect(res.send).toHaveBeenCalledWith(answer.body);
      },
    );
  });

  it('RELAY-CTRL-003: sends a Retry-After along where the answer names one', async () => {
    const spent = { ...answer, status: 429, retryAfter: '30' };
    const controller = new RoutingRelayController({
      ask: vi.fn().mockResolvedValue(spent),
    } as unknown as RoutingRelayService);
    const res = { ...response(), set: vi.fn() };
    await controller.route(user, { locations: [], costing: 'auto' } as never, res as unknown as Response);
    expect(res.set).toHaveBeenCalledWith('Retry-After', '30');
    expect(res.status).toHaveBeenCalledWith(429);
  });

  it('RELAY-CTRL-002: lets a refusal of the relay itself reach the exception filter', async () => {
    const refusal = new Error('refused');
    const controller = new RoutingRelayController({
      ask: vi.fn().mockRejectedValue(refusal),
    } as unknown as RoutingRelayService);
    const res = response();
    await expect(controller.height(user, { shape: [] } as never, res as unknown as Response)).rejects.toBe(refusal);
    expect(res.send).not.toHaveBeenCalled();
  });
});
