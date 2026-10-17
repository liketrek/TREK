/**
 * The SDK half of the manifest parity corpus (test/fixtures/manifest-corpus.ts). It
 * runs standalone; the server's manifest-parity test runs the same corpus through
 * the host's loader as well, so the two cannot drift apart unseen.
 */
import { describe, expect, it } from 'vitest';
import { validateManifest } from '../src/manifest.js';
import { PLUGIN_API_VERSION } from '../src/index.js';
import { MANIFEST_CORPUS } from './fixtures/manifest-corpus.js';

describe('manifest corpus — validate', () => {
  it.each(MANIFEST_CORPUS)('$name', ({ manifest, host, sdk }) => {
    const result = validateManifest(manifest);
    expect(result.ok ? 'accept' : 'reject', result.errors.join('; ')).toBe(sdk ?? host);
  });

  it('marks every stricter-than-host case as one, with its reason', () => {
    for (const c of MANIFEST_CORPUS) {
      if (c.sdk === undefined) continue;
      expect(c.sdk, `${c.name}: the SDK may only ever be stricter than the host`).toBe('reject');
      expect(c.host, c.name).toBe('accept');
      expect(c.why, `${c.name} needs a reason`).toBeTruthy();
    }
  });
});

describe('apiVersion', () => {
  const base = { id: 'demo-plugin', name: 'Demo', version: '1.0.0', type: 'integration', trek: '>=4.0.0 <5.0.0' };

  it.each([0, -1, 1.5, '1', null])('refuses %p, which is not a positive integer', (apiVersion) => {
    expect(validateManifest({ ...base, apiVersion }).errors).toContain('apiVersion must be a positive integer');
  });

  it('refuses a version newer than the plugin API TREK implements', () => {
    const next = PLUGIN_API_VERSION + 1;
    expect(validateManifest({ ...base, apiVersion: next }).errors).toEqual([
      `apiVersion ${next} is newer than the plugin API TREK implements (v${PLUGIN_API_VERSION})`,
    ]);
  });

  it('keeps an accepted version and defaults a missing one to 1', () => {
    expect(validateManifest({ ...base, apiVersion: PLUGIN_API_VERSION }).manifest?.apiVersion).toBe(PLUGIN_API_VERSION);
    expect(validateManifest(base).manifest?.apiVersion).toBe(1);
  });
});
