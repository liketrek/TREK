/**
 * Unit tests for nest/audit/audit-log.logger: AUDIT-LOG-001 through
 * AUDIT-LOG-009. The logger ranks error < warn < info < debug against the
 * import-frozen LOG_LEVEL, prints every line to the console at once and hands
 * the same line, without colour codes, to the buffered file sink. The sink is
 * replaced here by a recorder; its own disk behaviour (batching, rotation,
 * failures) is pinned in log-file.test.ts.
 */
import { resolveDataPaths } from '../../../src/app-config/data-paths';
import {
  logInfo,
  logDebug,
  logError,
  logWarn,
  flushLogFile,
  flushLogFileSync,
  LOG_LEVEL,
} from '../../../src/nest/audit/audit-log.logger';

import path from 'node:path';
import { describe, it, expect, vi, beforeEach } from 'vitest';

const sink = vi.hoisted(() => ({
  lines: [] as string[],
  options: [] as Array<{
    dir: string;
    file?: string;
    maxBytes?: number;
    maxFiles?: number;
    onError: (message: string) => void;
  }>,
  flush: vi.fn(async () => {}),
  flushSync: vi.fn(),
}));

vi.mock('../../../src/nest/audit/log-file', () => ({
  BufferedLogFile: class {
    constructor(options: {
      dir: string;
      file?: string;
      maxBytes?: number;
      maxFiles?: number;
      onError: (message: string) => void;
    }) {
      sink.options.push(options);
    }
    write(line: string): void {
      sink.lines.push(line);
    }
    flush(): Promise<void> {
      return sink.flush();
    }
    flushSync(): void {
      sink.flushSync();
    }
  },
}));

beforeEach(() => {
  vi.restoreAllMocks();
  sink.lines.length = 0;
  sink.flush.mockClear();
  sink.flushSync.mockClear();
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
    expect(sink.lines).toEqual([]);
    logError('boom');
    const consoleLine = String(err.mock.calls[0][0]);
    expect(consoleLine.startsWith('\x1b[31m[ERROR]\x1b[0m ')).toBe(true);
    expect(consoleLine).toMatch(/ \d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2} boom$/);
    expect(sink.lines).toHaveLength(1);
    expect(sink.lines[0]).toMatch(/^\[ERROR\] \d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2} boom$/);
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
      expect(log.mock.calls.map((c) => String(c[0]).includes('[INFO]') || String(c[0]).includes('[DEBUG]'))).toEqual([
        true,
        true,
      ]);
      expect(String(warn.mock.calls[0][0])).toContain('[WARN]');
      expect(String(err.mock.calls[0][0])).toContain('[ERROR]');
      expect(sink.lines.map((line) => line.split(' ')[0])).toEqual(['[INFO]', '[DEBUG]', '[WARN]', '[ERROR]']);
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
      expect(sink.lines).toHaveLength(2);
    } finally {
      vi.unstubAllEnvs();
      vi.resetModules();
    }
  });

  it('AUDIT-LOG-008: an unknown LOG_LEVEL falls back to info rather than silencing or flooding the log', async () => {
    const fresh = await freshLogger('verbose');
    try {
      const log = vi.spyOn(console, 'log').mockImplementation(() => {});
      fresh.logInfo('kept');
      fresh.logDebug('dropped');
      expect(log).toHaveBeenCalledTimes(1);
      expect(sink.lines).toHaveLength(1);
      expect(sink.lines[0]).toMatch(/^\[INFO\] .*kept$/);
    } finally {
      vi.unstubAllEnvs();
      vi.resetModules();
    }
  });

  it('AUDIT-LOG-004: the freeze happens at first import, so LOG_LEVEL reflects the env then', async () => {
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

describe('the file sink', () => {
  it('AUDIT-LOG-005: writes trek.log in the data layout logs dir, rotating at 10 MB over 5 files', () => {
    expect(sink.options[0]).toMatchObject({
      dir: resolveDataPaths().logsDir,
      file: 'trek.log',
      maxBytes: 10 * 1024 * 1024,
      maxFiles: 5,
    });
    expect(path.basename(resolveDataPaths().logsDir)).toBe('logs');
  });

  it('AUDIT-LOG-006: the file line carries no colour codes', () => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
    logError('plain');
    expect(sink.lines[0]).not.toContain('\x1b[');
  });

  it('AUDIT-LOG-007: flushLogFile and flushLogFileSync reach the sink', async () => {
    await flushLogFile();
    flushLogFileSync();
    expect(sink.flush).toHaveBeenCalledTimes(1);
    expect(sink.flushSync).toHaveBeenCalledTimes(1);
  });

  it('AUDIT-LOG-009: a failing sink reports to the console with a [logger] prefix, never back into the file', () => {
    const err = vi.spyOn(console, 'error').mockImplementation(() => {});
    sink.options[0]!.onError('log file write failed: disk full');
    expect(err).toHaveBeenCalledWith('[logger] log file write failed: disk full');
    // Writing the failure into the failing file would only queue more of the same.
    expect(sink.lines).toEqual([]);
  });
});
