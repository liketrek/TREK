/**
 * The six handlers are thin: they pass the signed-in user, the route id and
 * the validated body through, and apply forwards the idempotency header. The
 * service contract is covered separately; this file pins the routing surface.
 */
import { AiTravelPlanController } from '../../../../src/nest/ai-travel-plan/ai-travel-plan.controller';
import type { AiTravelPlanService } from '../../../../src/nest/ai-travel-plan/ai-travel-plan.service';
import type { User } from '../../../../src/types';

import type { Response } from 'express';
import { describe, expect, it, vi } from 'vitest';

const user = { id: 7, role: 'user' } as User;

function controller(): {
  controller: AiTravelPlanController;
  plans: Record<
    'create' | 'createStreaming' | 'get' | 'createRevision' | 'apply' | 'discard' | 'undo',
    ReturnType<typeof vi.fn>
  >;
} {
  const plans = {
    create: vi.fn(async () => ({ plan: { id: 1 } })),
    createStreaming: vi.fn(async (_user: User, _body: unknown, emit: (event: unknown) => void) => {
      emit({ type: 'progress', stage: 'places', message: 'retrieving' });
    }),
    get: vi.fn(async () => ({ plan: { id: 1 } })),
    createRevision: vi.fn(async () => ({ plan: { id: 1 }, revision: { version: 2 } })),
    apply: vi.fn(async () => ({ plan: { id: 1 }, tripId: 9 })),
    discard: vi.fn(async () => ({ plan: { id: 1 } })),
    undo: vi.fn(async () => ({ plan: { id: 1 }, tripId: 9, tripDeleted: true })),
  };
  return {
    controller: new AiTravelPlanController(plans as unknown as AiTravelPlanService),
    plans,
  };
}

function response(): Response {
  return {
    status: vi.fn(),
    setHeader: vi.fn(),
    flushHeaders: vi.fn(),
    write: vi.fn(),
    end: vi.fn(),
    writableEnded: false,
    destroyed: false,
  } as unknown as Response;
}

describe('AiTravelPlanController', () => {
  it('POST /api/ai-travel-plans passes the user and body through', async () => {
    const { controller: c, plans } = controller();
    const body = { prompt: '杭州三天' };

    await expect(c.create(user, body as never)).resolves.toEqual({ plan: { id: 1 } });
    expect(plans.create).toHaveBeenCalledWith(user, body);
  });

  it('GET /api/ai-travel-plans/:id passes the route id as a string', async () => {
    const { controller: c, plans } = controller();

    await expect(c.get(user, '42')).resolves.toEqual({ plan: { id: 1 } });
    expect(plans.get).toHaveBeenCalledWith(user, '42');
  });

  it('POST /:id/revisions passes the feedback body through', async () => {
    const { controller: c, plans } = controller();
    const body = { feedback: '慢一点' };

    await expect(c.createRevision(user, '42', body)).resolves.toMatchObject({ revision: { version: 2 } });
    expect(plans.createRevision).toHaveBeenCalledWith(user, '42', body);
  });

  it('POST /:id/apply forwards the idempotency key', async () => {
    const { controller: c, plans } = controller();
    const body = { mode: 'new_trip' as const };

    await expect(c.apply(user, '42', body, 'key-1')).resolves.toEqual({ plan: { id: 1 }, tripId: 9 });
    expect(plans.apply).toHaveBeenCalledWith(user, '42', body, 'key-1');
  });

  it('POST /:id/discard passes only the optional reason', async () => {
    const { controller: c, plans } = controller();

    await expect(c.discard(user, '42', { reason: '计划有变' })).resolves.toEqual({ plan: { id: 1 } });
    expect(plans.discard).toHaveBeenCalledWith(user, '42', '计划有变');
  });

  it('POST /:id/undo passes the route id and the optional reason', async () => {
    const { controller: c, plans } = controller();

    await expect(c.undo(user, '42', { reason: '改主意了' })).resolves.toMatchObject({ tripDeleted: true });
    expect(plans.undo).toHaveBeenCalledWith(user, '42', '改主意了');
  });

  it('POST /api/ai-travel-plans/stream writes each event as an SSE data line', async () => {
    const { controller: c, plans } = controller();
    const body = { prompt: '杭州三天' };
    const res = response();

    await c.stream(user, body as never, res);

    expect(plans.createStreaming).toHaveBeenCalledWith(user, body, expect.any(Function));
    expect(res.setHeader).toHaveBeenCalledWith('Content-Type', 'text/event-stream; charset=utf-8');
    expect(res.write).toHaveBeenCalledWith(
      `data: ${JSON.stringify({ type: 'progress', stage: 'places', message: 'retrieving' })}\n\n`,
    );
    expect(res.end).toHaveBeenCalled();
  });

  it('POST /api/ai-travel-plans/stream turns a rejected create into one error event', async () => {
    const { controller: c, plans } = controller();
    plans.createStreaming.mockRejectedValueOnce(new Error('forbidden'));
    const res = response();

    await c.stream(user, { prompt: '杭州' } as never, res);

    expect(res.write).toHaveBeenCalledWith(
      `data: ${JSON.stringify({
        type: 'error',
        code: 'generation_failed',
        message: '生成请求没有被接受，请稍后重试。',
      })}\n\n`,
    );
    expect(res.end).toHaveBeenCalled();
  });
});
