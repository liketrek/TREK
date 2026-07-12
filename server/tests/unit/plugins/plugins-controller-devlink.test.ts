/**
 * The dev-link controller endpoints (#plugins): POST /link and POST /:id/reload.
 * Verifies both are gated by the kill-switch AND the dev-only TREK_PLUGINS_DEV_LINK
 * flag, that link validates its body, and that reload maps a re-consent error to 409
 * exactly like activate does. The runtime is mocked — this is the HTTP glue only.
 */
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { HttpException } from '@nestjs/common';
import { PluginsController } from '../../../src/nest/plugins/plugins.controller';
import { PluginConsentRequired } from '../../../src/nest/plugins/plugin-runtime.service';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const ctrl = (runtime: any) => new PluginsController({} as any, runtime, {} as any);
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const status = async (p: Promise<any>): Promise<number> =>
  p.then(() => -1, (e) => (e instanceof HttpException ? e.getStatus() : 0));

describe('PluginsController dev-link endpoints', () => {
  beforeEach(() => { process.env.TREK_PLUGINS_ENABLED = 'true'; });
  afterEach(() => { delete process.env.TREK_PLUGINS_DEV_LINK; delete process.env.TREK_PLUGINS_ENABLED; });

  it('POST /link is 403 unless dev-link is enabled, 400 without a path, and delegates when enabled', async () => {
    const runtime = { link: vi.fn(async () => ({ id: 'x', version: '1.0.0', replaced: false })) };
    delete process.env.TREK_PLUGINS_DEV_LINK;
    expect(await status(ctrl(runtime).link({ path: '/abs/dir' }))).toBe(403);
    expect(runtime.link).not.toHaveBeenCalled();

    process.env.TREK_PLUGINS_DEV_LINK = '1';
    expect(await status(ctrl(runtime).link({}))).toBe(400); // no path
    expect(await ctrl(runtime).link({ path: ' /abs/dir ' })).toMatchObject({ id: 'x' });
    expect(runtime.link).toHaveBeenCalledWith('/abs/dir'); // trimmed
  });

  it('POST /link surfaces a runtime error as 400', async () => {
    process.env.TREK_PLUGINS_DEV_LINK = '1';
    const runtime = { link: vi.fn(async () => { throw new Error('no build'); }) };
    expect(await status(ctrl(runtime).link({ path: '/abs' }))).toBe(400);
  });

  it('POST /:id/reload is 403 unless dev-link is enabled', async () => {
    const runtime = { reload: vi.fn(async () => {}), isActive: () => true };
    delete process.env.TREK_PLUGINS_DEV_LINK;
    expect(await status(ctrl(runtime).reload('p'))).toBe(403);
    expect(runtime.reload).not.toHaveBeenCalled();
  });

  it('POST /:id/reload maps a re-consent error to 409 and otherwise returns the live status', async () => {
    process.env.TREK_PLUGINS_DEV_LINK = '1';
    const consent = {
      reload: vi.fn(async () => { throw new PluginConsentRequired('needs consent', ['db:read:trips'], []); }),
      isActive: () => false,
    };
    expect(await status(ctrl(consent).reload('p'))).toBe(409);

    const ok = { reload: vi.fn(async () => {}), isActive: () => true };
    expect(await ctrl(ok).reload('p')).toEqual({ status: 'active' });

    const bad = { reload: vi.fn(async () => { throw new Error('boom'); }), isActive: () => false };
    expect(await status(ctrl(bad).reload('p'))).toBe(400);
  });
});
