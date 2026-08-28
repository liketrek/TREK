/**
 * MCP session invalidation on plugin lifecycle changes — MCPINV-001 to MCPINV-007.
 *
 * The advertised tool surface is frozen at initialize (no event store is
 * configured, and tools/list_changed would not help), so anything that changes
 * which plugin tools exist has to end the sessions that were built before it.
 *
 * Unconditional by design: the surface is per-session, because it depends on the
 * caller's scopes and the plugin's grants, so there is no ctx-free set to diff.
 */
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { PluginsController } from '../../../src/nest/plugins/plugins.controller';
import type { RuntimeEnvService } from '../../../src/nest/app-config/runtime-env.service';

const invalidate = vi.fn();
vi.mock('../../../src/mcp/sessionManager', () => ({ invalidateMcpSessions: () => invalidate() }));

/* eslint-disable @typescript-eslint/no-explicit-any */
const registry = { recomputeUpdateHold: vi.fn(async () => {}) } as any;
const ctrl = (runtime: any) =>
  new PluginsController({} as any, runtime, registry, { isManaged: () => false } as unknown as RuntimeEnvService);

const runtime = () =>
  ({
    activate: vi.fn(async () => {}),
    isActive: vi.fn(() => true),
    deactivateWithDependents: vi.fn(async () => {}),
    update: vi.fn(async () => ({ version: '1.1.0' })),
    retrust: vi.fn(async () => ({ ok: true })),
    uninstall: vi.fn(async () => {}),
  }) as any;
/* eslint-enable @typescript-eslint/no-explicit-any */

beforeEach(() => {
  invalidate.mockClear();
  process.env.TREK_PLUGINS_ENABLED = 'true';
});

describe('plugin lifecycle invalidates MCP sessions', () => {
  it('MCPINV-001: activate', async () => {
    await ctrl(runtime()).activate('weather', { consent: true } as never);
    expect(invalidate).toHaveBeenCalledTimes(1);
  });

  it('MCPINV-002: deactivate', async () => {
    await ctrl(runtime()).deactivate('weather');
    expect(invalidate).toHaveBeenCalledTimes(1);
  });

  it('MCPINV-003: update', async () => {
    // A version bump can change the declared tools, so it is a surface change
    // even though the plugin stays active.
    await ctrl(runtime()).update('weather', {} as never);
    expect(invalidate).toHaveBeenCalledTimes(1);
  });

  it('MCPINV-004: uninstall', async () => {
    await ctrl(runtime()).uninstall('weather', {} as never);
    expect(invalidate).toHaveBeenCalledTimes(1);
  });

  it('MCPINV-005: retrust', async () => {
    // Retrust installs a version, so it is an update by another name.
    await ctrl(runtime()).retrust(
      'weather',
      { version: '1.1.0', publicKey: 'k' } as never,
      { id: 1 },
      { headers: {}, socket: {} } as never,
    );
    expect(invalidate).toHaveBeenCalledTimes(1);
  });

  it('MCPINV-006: a failed activate does not invalidate', async () => {
    // Nothing changed, so nobody's session should be dropped.
    const r = runtime();
    r.activate = vi.fn(async () => { throw new Error('boom'); });
    await expect(ctrl(r).activate('weather', {} as never)).rejects.toThrow();
    expect(invalidate).not.toHaveBeenCalled();
  });

  it('MCPINV-007: a failed update does not invalidate', async () => {
    const r = runtime();
    r.update = vi.fn(async () => { throw new Error('boom'); });
    await expect(ctrl(r).update('weather', {} as never)).rejects.toThrow();
    expect(invalidate).not.toHaveBeenCalled();
  });
});
