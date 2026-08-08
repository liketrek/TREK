/**
 * Unit tests for nest/audit/audit-log.logger — AUDIT-LOG-001 through
 * AUDIT-LOG-009. The logger is the plain module carved out of the legacy
 * services/auditLog.ts; since the quirk-fix pass it has a real severity
 * threshold (error < warn < info < debug) against the import-frozen LOG_LEVEL,
 * lazy data/logs creation (no import-time mkdir), and console.error fallbacks
 * for file-IO failures. It sits inside the src/nest/** coverage gate, so its
 * branches are pinned here with fs fully mocked.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('fs', () => {
  const mock = {
    mkdirSync: vi.fn(),
    existsSync: vi.fn(() => false),
    statSync: vi.fn(() => ({ size: 0 })),
    appendFileSync: vi.fn(),
    renameSync: vi.fn(),
  };
  return { default: mock, ...mock };
});

import fs from 'fs';
import { logInfo, logDebug, logError, logWarn, LOG_LEVEL } from '../../../src/nest/audit/audit-log.logger';

const mocked = vi.mocked(fs);

beforeEach(() => {
  vi.clearAllMocks();
  vi.restoreAllMocks();
  mocked.existsSync.mockReturnValue(false);
  mocked.statSync.mockReturnValue({ size: 0 } as unknown as ReturnType<typeof fs.statSync>);
});

// tests/setup.ts sets LOG_LEVEL=error before the first import, so the statically
// imported helpers run at the most restrictive threshold; the fresh-import cases
// below exercise the other levels.
async function freshLogger(level: string) {
  vi.resetModules();
  vi.stubEnv('LOG_LEVEL', level);
  return import('../../../src/nest/audit/audit-log.logger');
}

describe('severity threshold (frozen at import)', () => {
  it('AUDIT-LOG-001: at LOG_LEVEL=error only logError writes (console + file)', () => {
    const err = vi.spyOn(console, 'error').mockImplementation(() => {});
    const log = vi.spyOn(console, 'log').mockImplementation(() => {});
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    expect(LOG_LEVEL).toBe('error');
    logInfo('nope');
    logWarn('nope');
    logDebug('nope');
    expect(log).not.toHaveBeenCalled();
    expect(warn).not.toHaveBeenCalled();
    expect(mocked.appendFileSync).not.toHaveBeenCalled();
    logError('boom');
    const consoleLine = String(err.mock.calls[0][0]);
    expect(consoleLine.startsWith('\x1b[31m[ERROR]\x1b[0m ')).toBe(true);
    expect(consoleLine).toMatch(/ \d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2} boom$/);
    expect(String(mocked.appendFileSync.mock.calls[0][1])).toMatch(/^\[ERROR\] \d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2} boom\n$/);
  });

  it('AUDIT-LOG-002: at LOG_LEVEL=debug every level logs with its tag', async () => {
    const fresh = await freshLogger('debug');
    try {
      const log = vi.spyOn(console, 'log').mockImplementation(() => {});
      const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
      const err = vi.spyOn(console, 'error').mockImplementation(() => {});
      fresh.logInfo('i');
      fresh.logDebug('d');
      fresh.logWarn('w');
      fresh.logError('e');
      expect(log.mock.calls.map((c) => String(c[0]).includes('[INFO]') || String(c[0]).includes('[DEBUG]'))).toEqual([true, true]);
      expect(String(warn.mock.calls[0][0])).toContain('[WARN]');
      expect(String(err.mock.calls[0][0])).toContain('[ERROR]');
      expect(mocked.appendFileSync).toHaveBeenCalledTimes(4);
    } finally {
      vi.unstubAllEnvs();
      vi.resetModules();
    }
  });

  it('AUDIT-LOG-003: at the production default (info) info/warn log, debug does not', async () => {
    const fresh = await freshLogger('info');
    try {
      const log = vi.spyOn(console, 'log').mockImplementation(() => {});
      const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
      fresh.logInfo('visible');
      fresh.logDebug('invisible');
      fresh.logWarn('visible');
      expect(log).toHaveBeenCalledTimes(1);
      expect(String(log.mock.calls[0][0])).toContain('[INFO]');
      expect(warn).toHaveBeenCalledTimes(1);
    } finally {
      vi.unstubAllEnvs();
      vi.resetModules();
    }
  });

  it('AUDIT-LOG-004: the freeze happens at first import — LOG_LEVEL reflects the env then', async () => {
    const fresh = await freshLogger('debug');
    try {
      expect(fresh.LOG_LEVEL).toBe('debug');
      expect(LOG_LEVEL).toBe('error'); // the static import stays frozen
    } finally {
      vi.unstubAllEnvs();
      vi.resetModules();
    }
  });
});

describe('lazy logs dir + rotation + resilience', () => {
  it('AUDIT-LOG-005: data/logs is created lazily on the first write, not at import', async () => {
    const fresh = await freshLogger('info');
    try {
      mocked.mkdirSync.mockClear();
      expect(mocked.mkdirSync).not.toHaveBeenCalled();
      vi.spyOn(console, 'log').mockImplementation(() => {});
      fresh.logInfo('first write');
      expect(mocked.mkdirSync).toHaveBeenCalledTimes(1);
      fresh.logInfo('second write');
      expect(mocked.mkdirSync).toHaveBeenCalledTimes(1); // memoized
    } finally {
      vi.unstubAllEnvs();
      vi.resetModules();
    }
  });

  it('AUDIT-LOG-006: rotates trek.log through .1… in descending order once the cap is hit', () => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
    mocked.existsSync.mockReturnValue(true);
    mocked.statSync.mockReturnValue({ size: 10 * 1024 * 1024 } as unknown as ReturnType<typeof fs.statSync>);
    logError('rotate me');
    // MAX_LOG_FILES=5 → renames .3→.4, .2→.3, .1→.2, trek.log→.1 (descending).
    expect(mocked.renameSync).toHaveBeenCalledTimes(4);
    const dsts = mocked.renameSync.mock.calls.map((c) => String(c[1]));
    expect(dsts[0].endsWith('trek.log.4')).toBe(true);
    expect(dsts[3].endsWith('trek.log.1')).toBe(true);
    expect(String(mocked.renameSync.mock.calls[3][0]).endsWith('trek.log')).toBe(true);
  });

  it('AUDIT-LOG-007: no rotation below the size cap', () => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
    mocked.existsSync.mockReturnValue(true);
    mocked.statSync.mockReturnValue({ size: 10 } as unknown as ReturnType<typeof fs.statSync>);
    logError('small');
    expect(mocked.renameSync).not.toHaveBeenCalled();
    expect(mocked.appendFileSync).toHaveBeenCalledTimes(1);
  });

  it('AUDIT-LOG-008: file-write failures never throw and leave a console.error trace', () => {
    const err = vi.spyOn(console, 'error').mockImplementation(() => {});
    mocked.appendFileSync.mockImplementation(() => { throw new Error('disk full'); });
    expect(() => logError('still up')).not.toThrow();
    // First call is the [ERROR] line itself, second is the fallback trace.
    expect(err).toHaveBeenCalledTimes(2);
    expect(String(err.mock.calls[1][0])).toBe('[logger] log file write failed: disk full');
  });

  it('AUDIT-LOG-009: rotation failures are traced and the write still goes through', () => {
    const err = vi.spyOn(console, 'error').mockImplementation(() => {});
    mocked.existsSync.mockReturnValue(true);
    mocked.statSync.mockImplementation(() => { throw new Error('stat broke'); });
    expect(() => logError('resilient')).not.toThrow();
    expect(String(err.mock.calls[1][0])).toBe('[logger] log rotation failed: stat broke');
    expect(mocked.appendFileSync).toHaveBeenCalledTimes(1);
  });
});
