/**
 * `shot` up to the point where it would need a browser.
 *
 * The screenshot path itself needs Playwright and a Chromium, which this suite has no business
 * downloading — but everything that decides WHETHER to take a screenshot, and what to tell the
 * author when it cannot, is ordinary logic and is where the useful behaviour lives.
 */
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { scaffold } from '../src/cli/create.js';
import { runShot, ShotError } from '../src/cli/shot.js';

describe('shot', () => {
  let tmp: string;
  beforeEach(() => { tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'shot-')); });
  afterEach(() => { fs.rmSync(tmp, { recursive: true, force: true }); });

  it('refuses a directory that is not a plugin', async () => {
    await expect(runShot(tmp)).rejects.toThrow(/no trek-plugin.json/);
  });

  /**
   * An integration plugin has no UI, so there is nothing to render — but it still NEEDS a
   * screenshot, because the registry requires one and the store card shows it. Erroring out with
   * "no UI" would be true and useless; say what to photograph instead.
   */
  it('tells an integration author what to screenshot instead of failing blankly', async () => {
    scaffold('int-plug', 'integration', tmp);
    const err = await runShot(path.join(tmp, 'int-plug')).catch((e: unknown) => e);

    expect(err).toBeInstanceOf(ShotError);
    const message = (err as Error).message;
    expect(message).toMatch(/no UI/i);
    // The useful half: what to do about it.
    expect(message).toMatch(/docs\/screenshot\.png/);
    expect(message).toMatch(/notification|badge|settings/i);
  });

  it('does not boot a browser just to discover the plugin has no UI', async () => {
    // The integration check must come BEFORE loadChromium, or an author with no Playwright gets
    // "install Playwright" for a plugin Playwright could never have helped with.
    scaffold('int-plug', 'integration', tmp);
    const err = await runShot(path.join(tmp, 'int-plug')).catch((e: unknown) => e);
    expect((err as Error).message).not.toMatch(/playwright/i);
  });
});
