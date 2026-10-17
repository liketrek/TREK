import { normalizeEnvAtBoot, readEnv } from '../../../src/app-config/env';

import { describe, it, expect, vi, afterEach } from 'vitest';

/** Everything one normalisation printed as a warning. */
function warnings(raw: Record<string, string | undefined>): string {
  const warn = vi.spyOn(process, 'emitWarning').mockImplementation(() => {});
  normalizeEnvAtBoot(raw);
  const printed = warn.mock.calls.map((c) => String(c[0])).join('\n');
  warn.mockRestore();
  return printed;
}

describe('normalizeEnvAtBoot (#2565)', () => {
  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllEnvs();
    vi.resetModules();
  });

  it('trims a padded NODE_ENV in place and says so', () => {
    for (const padded of ['production ', ' production', 'production\r', '\tproduction\n']) {
      const raw: Record<string, string | undefined> = { NODE_ENV: padded };
      const printed = warnings(raw);
      expect(raw.NODE_ENV, JSON.stringify(padded)).toBe('production');
      expect(printed).toContain(`NODE_ENV=${JSON.stringify(padded)}`);
      expect(printed).toContain('"production"');
    }
  });

  it('trims LOG_LEVEL and DEFAULT_LANGUAGE the same way', () => {
    const raw: Record<string, string | undefined> = { LOG_LEVEL: 'debug ', DEFAULT_LANGUAGE: ' de' };
    const printed = warnings(raw);
    expect(raw.LOG_LEVEL).toBe('debug');
    expect(raw.DEFAULT_LANGUAGE).toBe('de');
    expect(printed).toContain('LOG_LEVEL="debug "');
    expect(printed).toContain('DEFAULT_LANGUAGE=" de"');
  });

  it('leaves clean, unset and differently cased values alone and stays quiet', () => {
    const raw: Record<string, string | undefined> = { NODE_ENV: 'Production', LOG_LEVEL: 'info' };
    expect(warnings(raw)).toBe('');
    expect(raw).toEqual({ NODE_ENV: 'Production', LOG_LEVEL: 'info' });
  });

  it('does not turn a padded "test" into the test runtime', () => {
    // NODE_ENV=test means an in-memory database and no crons. An instance that
    // has been running on "test " with its file database must not wake up on
    // an empty one after an update, so this one is only reported.
    const raw: Record<string, string | undefined> = { NODE_ENV: 'test ' };
    const printed = warnings(raw);
    expect(raw.NODE_ENV).toBe('test ');
    expect(printed).toContain('NODE_ENV="test "');
  });

  it('never touches other variables, secrets keep their surrounding spaces', () => {
    const raw: Record<string, string | undefined> = { SMTP_PASS: ' pass ', TZ: 'UTC ' };
    expect(warnings(raw)).toBe('');
    expect(raw).toEqual({ SMTP_PASS: ' pass ', TZ: 'UTC ' });
  });

  it('runs from the boot import, so everything reading process.env sees the trimmed value', async () => {
    vi.stubEnv('NODE_ENV', 'production ');
    vi.spyOn(process, 'emitWarning').mockImplementation(() => {});
    await import('../../../src/app-config/boot-validate');
    expect(process.env.NODE_ENV).toBe('production');
    expect(readEnv().app.nodeEnv).toBe('production');
    expect(readEnv().app.isProduction).toBe(true);
  });
});
