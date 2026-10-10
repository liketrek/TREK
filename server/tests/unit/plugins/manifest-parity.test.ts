/**
 * One verdict per manifest, whoever judges it: the host's install loader
 * (`parseManifest` with `requireTrek`, what an install answers) and the SDK's
 * `validateManifest` (what `trek-plugin validate` answers) run over the shared corpus
 * in plugin-sdk/test/fixtures/manifest-corpus.ts and must each give the verdict
 * recorded there. The SDK may be stricter than the host only where a case says so;
 * accepting what the host refuses is the false green this test exists to stop.
 *
 * The SDK is a standalone package outside this workspace's rootDir, so both modules
 * are loaded by path at run time rather than through a typed import.
 */
import { ManifestError, parseManifest } from '../../../src/nest/plugins/install/manifest';

import path from 'node:path';
import { beforeAll, describe, expect, it } from 'vitest';

type Verdict = 'accept' | 'reject';
interface ManifestCase {
  name: string;
  manifest: unknown;
  host: Verdict;
  sdk?: Verdict;
  why?: string;
}
interface SdkValidation {
  ok: boolean;
  errors: string[];
}

const sdkRoot = path.resolve(__dirname, '../../../../plugin-sdk');
let corpus: ManifestCase[] = [];
let validateManifest: (raw: unknown) => SdkValidation;

beforeAll(async () => {
  ({ MANIFEST_CORPUS: corpus } = (await import(path.join(sdkRoot, 'test/fixtures/manifest-corpus.ts'))) as {
    MANIFEST_CORPUS: ManifestCase[];
  });
  ({ validateManifest } = (await import(path.join(sdkRoot, 'src/manifest.ts'))) as {
    validateManifest: (raw: unknown) => SdkValidation;
  });
});

function hostVerdict(manifest: unknown): { verdict: Verdict; reason: string } {
  try {
    parseManifest(manifest, { requireTrek: true });
    return { verdict: 'accept', reason: '' };
  } catch (e) {
    // Anything but a ManifestError is a crash in the loader, not a verdict.
    if (!(e instanceof ManifestError)) throw e;
    return { verdict: 'reject', reason: e.message };
  }
}

function sdkVerdict(manifest: unknown): { verdict: Verdict; reason: string } {
  const result = validateManifest(manifest);
  return { verdict: result.ok ? 'accept' : 'reject', reason: result.errors.join('; ') };
}

// Each test lists every case that disagrees, so one run names all of them.
describe('manifest parity: host loader and SDK validate', () => {
  it('has a corpus to judge', () => {
    expect(corpus.length).toBeGreaterThan(40);
  });

  it('the host gives every case its recorded verdict', () => {
    const wrong = corpus
      .map((c) => ({ c, got: hostVerdict(c.manifest) }))
      .filter(({ c, got }) => got.verdict !== c.host)
      .map(({ c, got }) => `${c.name}: expected ${c.host}, got ${got.verdict} ${got.reason}`);
    expect(wrong).toEqual([]);
  });

  it('the SDK gives every case its recorded verdict', () => {
    const wrong = corpus
      .map((c) => ({ c, got: sdkVerdict(c.manifest) }))
      .filter(({ c, got }) => got.verdict !== (c.sdk ?? c.host))
      .map(({ c, got }) => `${c.name}: expected ${c.sdk ?? c.host}, got ${got.verdict} ${got.reason}`);
    expect(wrong).toEqual([]);
  });

  it('never has the SDK accept what the host refuses', () => {
    const falseGreens = corpus
      .filter((c) => sdkVerdict(c.manifest).verdict === 'accept' && hostVerdict(c.manifest).verdict === 'reject')
      .map((c) => c.name);
    expect(falseGreens).toEqual([]);
  });
});
