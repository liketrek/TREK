import { ADDON_IDS } from '../../../src/addons';
import type { AddonsService } from '../../../src/nest/addons/addons.service';
import { createMcpAddonGate } from '../../../src/nest/addons/mcp-addon-gate';

import { describe, it, expect, vi } from 'vitest';

function gate(enabled: boolean) {
  const addons = { isAddonEnabled: vi.fn(() => enabled) };
  return { addons, mw: createMcpAddonGate(addons as unknown as AddonsService) };
}

function makeRes() {
  const res = {
    statusCode: 200,
    ended: false,
    status: vi.fn(function (this: typeof res, c: number) {
      this.statusCode = c;
      return this;
    }),
    end: vi.fn(function (this: typeof res) {
      this.ended = true;
      return this;
    }),
  };
  return res;
}

/**
 * createMcpAddonGate decides inside an async IIFE (Express cannot await a
 * middleware), so the 404 or the next() lands a microtask after mw() returns.
 * Drain the microtask queue — no timer is involved, so there is nothing to sleep
 * for.
 */
async function flushMicrotasks(): Promise<void> {
  for (let i = 0; i < 10; i++) await Promise.resolve();
}

describe('createMcpAddonGate', () => {
  it('GATE-001: 404s with an empty body when the MCP addon is off', async () => {
    const { addons, mw } = gate(false);
    const res = makeRes();
    const next = vi.fn();
    mw({} as never, res as never, next);
    await flushMicrotasks();
    expect(addons.isAddonEnabled).toHaveBeenCalledWith(ADDON_IDS.MCP);
    expect(res.statusCode).toBe(404);
    expect(res.ended).toBe(true);
    expect(next).not.toHaveBeenCalled();
  });

  it('GATE-002: continues when the addon is on', async () => {
    const { mw } = gate(true);
    const res = makeRes();
    const next = vi.fn();
    mw({} as never, res as never, next);
    await flushMicrotasks();
    expect(res.statusCode).toBe(200);
    expect(next).toHaveBeenCalled();
  });
});
