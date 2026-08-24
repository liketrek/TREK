import { describe, it, expect } from 'vitest';
import { createMockHost } from '../src/index.js';

/**
 * Mock-host fidelity for the two host-mediated daily budgets (ai.complete/extract and
 * notify.send, daily-budget.ts) and the ctx.meta quotas (meta.rpc.ts). Error strings
 * and check order are copied verbatim from the server so a plugin author sees the
 * exact same failure locally that production would give them.
 */

describe('daily budgets', () => {
  it('exhausts the AI budget', async () => {
    const host = createMockHost({ grants: ['ai:invoke'], actingUserId: 1, aiPerDay: 2 });
    await host.ctx.ai.complete('hi');
    await host.ctx.ai.complete('hi');
    await expect(host.ctx.ai.complete('hi')).rejects.toThrow('daily AI budget exhausted (resets at UTC midnight)');
  });

  it('ai.extract shares the same per-host AI budget as ai.complete', async () => {
    const host = createMockHost({ grants: ['ai:invoke'], actingUserId: 1, aiPerDay: 1 });
    await host.ctx.ai.complete('hi');
    await expect(host.ctx.ai.extract('text', {})).rejects.toThrow('daily AI budget exhausted (resets at UTC midnight)');
  });

  it('aiPerDay: 0 disables the broker — the first call fails', async () => {
    const host = createMockHost({ grants: ['ai:invoke'], actingUserId: 1, aiPerDay: 0 });
    await expect(host.ctx.ai.complete('hi')).rejects.toThrow('daily AI budget exhausted (resets at UTC midnight)');
  });

  it('defaults to 200/day for ai, far above what a normal test suite calls', async () => {
    const host = createMockHost({ grants: ['ai:invoke'], actingUserId: 1 });
    for (let i = 0; i < 200; i++) await host.ctx.ai.complete('hi');
    await expect(host.ctx.ai.complete('hi')).rejects.toThrow('daily AI budget exhausted (resets at UTC midnight)');
  });

  it('exhausts the notify budget', async () => {
    const host = createMockHost({
      grants: ['notify:send'],
      actingUserId: 1,
      trips: { 1: { members: [1] } },
      notifyPerDay: 1,
    });
    await host.ctx.notify.send({ title: 't', body: 'b', scope: 'user', targetId: 1 });
    await expect(host.ctx.notify.send({ title: 't', body: 'b', scope: 'user', targetId: 1 })).rejects.toThrow(
      'daily notification budget exhausted (resets at UTC midnight)',
    );
  });

  it('notifyPerDay: 0 disables the broker — the first call fails', async () => {
    const host = createMockHost({
      grants: ['notify:send'],
      actingUserId: 1,
      trips: { 1: { members: [1] } },
      notifyPerDay: 0,
    });
    await expect(host.ctx.notify.send({ title: 't', body: 'b', scope: 'user', targetId: 1 })).rejects.toThrow(
      'daily notification budget exhausted (resets at UTC midnight)',
    );
  });

  it('defaults to 100/day for notify, far above what a normal test suite calls', async () => {
    const host = createMockHost({ grants: ['notify:send'], actingUserId: 1, trips: { 1: { members: [1] } } });
    for (let i = 0; i < 100; i++) await host.ctx.notify.send({ title: 't', body: 'b', scope: 'user', targetId: 1 });
    await expect(host.ctx.notify.send({ title: 't', body: 'b', scope: 'user', targetId: 1 })).rejects.toThrow(
      'daily notification budget exhausted (resets at UTC midnight)',
    );
  });
});

describe('ctx.meta quotas', () => {
  const fixture = () =>
    createMockHost({ grants: ['db:meta'], actingUserId: 1, trips: { 1: { members: [1] } } });

  it('meta value quota: 65536 bytes passes, 65537 rejects', async () => {
    const { ctx } = fixture();
    // Size the payload via Buffer.byteLength(JSON.stringify(v)), same as the server's
    // notion of "serialized JSON bytes" — a bare string serializes with 2 quote bytes,
    // so budget those into the repeat count.
    const okValue = 'x'.repeat(65536 - 2);
    expect(Buffer.byteLength(JSON.stringify(okValue), 'utf8')).toBe(65536);
    await expect(ctx.meta.set('trip', 1, 'k', okValue)).resolves.toEqual({ key: 'k', value: okValue });

    const tooBig = 'x'.repeat(65537 - 2);
    expect(Buffer.byteLength(JSON.stringify(tooBig), 'utf8')).toBe(65537);
    await expect(ctx.meta.set('trip', 1, 'k2', tooBig)).rejects.toThrow('metadata value too large (>65536 bytes)');
  });

  it('meta key length: 256 chars passes, 257 rejects', async () => {
    const { ctx } = fixture();
    const okKey = 'k'.repeat(256);
    await expect(ctx.meta.set('trip', 1, okKey, 'v')).resolves.toEqual({ key: okKey, value: 'v' });

    const tooLongKey = 'k'.repeat(257);
    await expect(ctx.meta.set('trip', 1, tooLongKey, 'v')).rejects.toThrow('metadata key too long (>256 chars)');
  });

  it('meta key count: 100 keys per (plugin, entity) passes, the 101st rejects', async () => {
    const { ctx } = fixture();
    for (let i = 0; i < 100; i++) {
      await ctx.meta.set('trip', 1, `key-${i}`, i);
    }
    await expect(ctx.meta.set('trip', 1, 'key-100', 100)).rejects.toThrow(
      'too many metadata keys on this trip (max 100)',
    );
  });

  it('overwriting an existing key never counts against the 100-key cap', async () => {
    const { ctx } = fixture();
    for (let i = 0; i < 100; i++) {
      await ctx.meta.set('trip', 1, `key-${i}`, i);
    }
    // The entity already has 100 keys; updating one of them must still succeed.
    await expect(ctx.meta.set('trip', 1, 'key-0', 'updated')).resolves.toEqual({ key: 'key-0', value: 'updated' });
  });

  it('checks in server order: key length before value size before key count', async () => {
    const { ctx } = fixture();
    // A key that is simultaneously too long AND paired with an oversized value must
    // fail on the key-length check first.
    const tooLongKey = 'k'.repeat(257);
    const tooBigValue = 'x'.repeat(70000);
    await expect(ctx.meta.set('trip', 1, tooLongKey, tooBigValue)).rejects.toThrow('metadata key too long (>256 chars)');

    // Fill the entity to the cap, then a value that is ALSO too large must fail on
    // the value-size check (raised before the key-count check ever runs).
    const full = fixture();
    for (let i = 0; i < 100; i++) {
      await full.ctx.meta.set('trip', 1, `key-${i}`, i);
    }
    await expect(full.ctx.meta.set('trip', 1, 'new-key', tooBigValue)).rejects.toThrow(
      'metadata value too large (>65536 bytes)',
    );
  });
});
