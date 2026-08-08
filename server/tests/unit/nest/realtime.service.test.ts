import { describe, it, expect, vi, beforeEach } from 'vitest';

const { broadcast, broadcastToUser } = vi.hoisted(() => ({
  broadcast: vi.fn(),
  broadcastToUser: vi.fn(),
}));
vi.mock('../../../src/websocket', () => ({ broadcast, broadcastToUser }));

import { RealtimeService } from '../../../src/nest/realtime/realtime.service';

const svc = new RealtimeService();

beforeEach(() => vi.clearAllMocks());

describe('RealtimeService', () => {
  it('broadcast delegates every argument to the websocket module untouched', () => {
    svc.broadcast('7', 'place:created', { place: { id: 1 } }, '42', 9);
    expect(broadcast).toHaveBeenCalledTimes(1);
    expect(broadcast).toHaveBeenCalledWith('7', 'place:created', { place: { id: 1 } }, '42', 9);
  });

  it('broadcast preserves the caller argument arity exactly (no undefined padding)', () => {
    // The excludeSid truthiness quirk and onlyUserId `!= null` check live in
    // websocket.ts — the facade must not normalize, default, or pad anything
    // on the way through: existing suites assert exact 3/4/5-arg call shapes.
    svc.broadcast(7, 'day:updated', { day: null });
    expect(broadcast.mock.calls[0]).toEqual([7, 'day:updated', { day: null }]);
    svc.broadcast(7, 'day:updated', { day: null }, undefined);
    expect(broadcast.mock.calls[1]).toEqual([7, 'day:updated', { day: null }, undefined]);
    expect(broadcast.mock.calls[1].length).toBe(4);
  });

  it('broadcastToUser delegates every argument untouched', () => {
    const payload = { type: 'vacay:invite', planId: 3 };
    svc.broadcastToUser(5, payload, '11');
    expect(broadcastToUser).toHaveBeenCalledTimes(1);
    expect(broadcastToUser).toHaveBeenCalledWith(5, payload, '11');
    // Same object reference — the facade must not clone or re-envelope.
    expect(broadcastToUser.mock.calls[0][1]).toBe(payload);
  });

  it('per-file vi.mock of src/websocket flows through the facade (call-time delegation)', () => {
    // The 106 existing suites mock src/websocket by path and assert on those
    // mocks; this pins that a facade constructed before/after the mock still
    // routes through the mocked module functions rather than captured bindings.
    const late = new RealtimeService();
    late.broadcast('1', 'todo:created', { item: {} }, undefined);
    late.broadcastToUser(2, { type: 'notification:new' });
    expect(broadcast).toHaveBeenCalledWith('1', 'todo:created', { item: {} }, undefined);
    expect(broadcastToUser).toHaveBeenCalledWith(2, { type: 'notification:new' });
  });
});
