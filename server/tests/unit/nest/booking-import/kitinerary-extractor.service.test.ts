import { describe, it, expect, vi, beforeEach } from 'vitest';

/**
 * The binary probe behind `GET /api/health/features`.
 *
 * It had no test at all, which matters more than the line count suggests: this
 * one boolean is what the client reads to decide whether to offer booking import
 * at all, and every branch that resolves it is a filesystem lookup that behaves
 * differently on the three platforms TREK ships to.
 */
const { existsSync, readdirSync, readEnv, execSync, execFile } = vi.hoisted(() => ({
  existsSync: vi.fn(),
  readdirSync: vi.fn(),
  readEnv: vi.fn(),
  execSync: vi.fn(),
  // A plain function, because the service promisifies it at module load.
  execFile: vi.fn(),
}));

vi.mock('node:fs', () => ({
  existsSync,
  readdirSync,
  writeFileSync: vi.fn(),
  unlinkSync: vi.fn(),
}));
// The last branch of the probe shells out. Unmocked, the suite spawns a real
// process on every machine and comes back green-or-red depending on whether the
// developer happens to have KItinerary installed.
vi.mock('node:child_process', () => ({ execSync, execFile }));
vi.mock('../../../../src/app-config', () => ({ readEnv }));

import { KitineraryExtractorService } from '../../../../src/nest/booking-import/kitinerary-extractor.service';

function boot(env: { kitineraryExtractorPath?: string } = {}) {
  readEnv.mockReturnValue({ integrations: env });
  const svc = new KitineraryExtractorService();
  svc.onModuleInit();
  return svc;
}

beforeEach(() => {
  vi.clearAllMocks();
  existsSync.mockReturnValue(false);
  readdirSync.mockReturnValue([]);
  execSync.mockImplementation(() => { throw new Error('command not found'); });
});

describe('KitineraryExtractorService binary probe', () => {
  it('KIT-EXT-001: takes the configured path when it exists', () => {
    existsSync.mockImplementation((p: string) => p === '/opt/kitinerary-extractor');
    expect(boot({ kitineraryExtractorPath: '/opt/kitinerary-extractor' }).isAvailable()).toBe(true);
  });

  it('KIT-EXT-002: an explicitly configured path that is missing disables the feature outright', () => {
    // It deliberately does NOT fall through to the search: somebody who set the
    // variable meant that binary, and silently using another one would hide the
    // typo behind a working feature.
    const svc = boot({ kitineraryExtractorPath: '/nope/kitinerary-extractor' });
    expect(svc.isAvailable()).toBe(false);
    expect(readdirSync).not.toHaveBeenCalled();
  });

  it('KIT-EXT-003: finds the Debian multiarch location by scanning /usr/lib', () => {
    readdirSync.mockReturnValue(['x86_64-linux-gnu'] as never);
    existsSync.mockImplementation((p: string) => p.includes('x86_64-linux-gnu'));
    expect(boot().isAvailable()).toBe(true);
  });

  it('KIT-EXT-004: survives a system with no /usr/lib at all', () => {
    readdirSync.mockImplementation(() => { throw new Error('ENOENT'); });
    expect(boot().isAvailable()).toBe(false);
  });

  it('KIT-EXT-005: reports unavailable when nothing is found, rather than throwing at boot', () => {
    expect(boot().isAvailable()).toBe(false);
  });

  it('KIT-EXT-006: extracting without a binary fails loudly', async () => {
    await expect(boot().extract(Buffer.from(''), 'x.pdf')).rejects.toThrow('not available');
  });

  it('KIT-EXT-007: falls back to the binary on PATH when nothing is on disk', () => {
    execSync.mockReturnValue(Buffer.from(''));
    expect(boot().isAvailable()).toBe(true);
    expect(execSync).toHaveBeenCalledWith('kitinerary-extractor --version', expect.objectContaining({ timeout: 3000 }));
  });
});
