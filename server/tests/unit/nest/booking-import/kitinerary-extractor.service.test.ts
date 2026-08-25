import { describe, it, expect, vi, beforeEach } from 'vitest';

/**
 * The binary probe behind `GET /api/health/features`.
 *
 * It had no test at all, which matters more than the line count suggests: this
 * one boolean is what the client reads to decide whether to offer booking import
 * at all, and every branch that resolves it is a filesystem lookup that behaves
 * differently on the three platforms TREK ships to.
 */
const { existsSync, readdirSync, readEnv, execFileSync, execFile } = vi.hoisted(() => ({
  existsSync: vi.fn(),
  readdirSync: vi.fn(),
  readEnv: vi.fn(),
  execFileSync: vi.fn(),
  // A plain function, because the service promisifies it at module load.
  execFile: vi.fn(),
}));

vi.mock('node:fs', () => ({
  existsSync,
  readdirSync,
  writeFileSync: vi.fn(),
  unlinkSync: vi.fn(),
}));
// The last branch of the probe runs the candidate to see whether it works.
// Unmocked, the suite spawns a real process on every machine and comes back
// green-or-red depending on whether the developer happens to have KItinerary
// installed.
vi.mock('node:child_process', () => ({ execFileSync, execFile }));
vi.mock('../../../../src/app-config', () => ({ readEnv }));

import { join } from 'node:path';
import { KitineraryExtractorService } from '../../../../src/nest/booking-import/kitinerary-extractor.service';

// The probe builds candidates with path.join, so the expectations have to as
// well — on Windows the separator is a backslash and a hardcoded '/usr/...'
// string would never match.
const onPath = (dir: string) => join(dir, 'kitinerary-extractor');

function boot(env: { kitineraryExtractorPath?: string; searchPath?: string[] } = {}) {
  readEnv.mockReturnValue({ integrations: { searchPath: [], ...env } });
  const svc = new KitineraryExtractorService();
  svc.onModuleInit();
  return svc;
}

beforeEach(() => {
  vi.clearAllMocks();
  existsSync.mockReturnValue(false);
  readdirSync.mockReturnValue([]);
  execFileSync.mockImplementation(() => { throw new Error('command not found'); });
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

  it('KIT-EXT-007: falls back to a binary on the search path when nothing is on disk', () => {
    existsSync.mockImplementation((p: string) => p === onPath('/usr/local/bin'));
    execFileSync.mockReturnValue(Buffer.from(''));

    expect(boot({ searchPath: ['/usr/local/bin'] }).isAvailable()).toBe(true);
    expect(execFileSync).toHaveBeenCalledWith(
      onPath('/usr/local/bin'), ['--version'], expect.objectContaining({ timeout: 3000 }),
    );
  });

  it('KIT-EXT-008: stores the absolute path, never the bare name', async () => {
    existsSync.mockImplementation((p: string) => p === onPath('/opt/tools'));
    execFileSync.mockReturnValue(Buffer.from(''));
    execFile.mockImplementation((_b: string, _a: string[], _o: unknown, cb: (e: null, r: unknown) => void) =>
      cb(null, { stdout: '[]', stderr: '' }));

    // An unqualified name would be re-resolved through PATH on every extraction,
    // so what the probe stores has to be the concrete file it verified.
    await boot({ searchPath: ['/opt/tools'] }).extract(Buffer.from(''), 'x.pdf');

    expect(execFile).toHaveBeenCalledWith(
      onPath('/opt/tools'), [expect.any(String)], expect.anything(), expect.anything(),
    );
  });

  it('KIT-EXT-009: a search-path entry that exists but will not run is skipped', () => {
    existsSync.mockReturnValue(true);
    execFileSync.mockImplementation((bin: string) => {
      if (bin === onPath('/broken')) throw new Error('not executable');
      return Buffer.from('');
    });

    expect(boot({ searchPath: ['/broken', '/good'] }).isAvailable()).toBe(true);
    expect(execFileSync).toHaveBeenLastCalledWith(
      onPath('/good'), ['--version'], expect.anything(),
    );
  });
});
