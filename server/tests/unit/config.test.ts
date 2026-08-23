import fs from 'node:fs';
import path from 'node:path';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// config.ts resolves its key material at import time, so every case here has to
// reset the module registry and re-import it with the file system stubbed out.
const ENC_KEY_FILE = path.resolve(__dirname, '../../data/.encryption_key');
const JWT_SECRET_FILE = path.resolve(__dirname, '../../data/.jwt_secret');

const enoent = (): NodeJS.ErrnoException => {
  const err = new Error('ENOENT: no such file or directory') as NodeJS.ErrnoException;
  err.code = 'ENOENT';
  return err;
};

describe('config — encryption key resolution', () => {
  const realEnvKey = process.env.ENCRYPTION_KEY;
  const realRead = fs.readFileSync;

  beforeEach(() => {
    // The env var short-circuits the whole file-resolution chain under test.
    delete process.env.ENCRYPTION_KEY;
    vi.resetModules();
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.resetModules();
    process.env.ENCRYPTION_KEY = realEnvKey;
  });

  // Only the key file itself is faked; everything else keeps reading from disk,
  // because app-config and its dependants load in the same import.
  const stubKeyFileRead = (impl: () => string) => {
    vi.spyOn(fs, 'readFileSync').mockImplementation(((file: fs.PathOrFileDescriptor, ...rest: unknown[]) => {
      if (String(file) === ENC_KEY_FILE) return impl();
      if (String(file) === JWT_SECRET_FILE) throw enoent();
      return (realRead as (...args: unknown[]) => unknown)(file, ...rest);
    }) as typeof fs.readFileSync);
  };

  it('CFGKEY-001: aborts boot when the key file cannot be read for a reason other than ENOENT', async () => {
    const exit = vi.spyOn(process, 'exit').mockImplementation((() => {
      throw new Error('process.exit called');
    }) as never);
    const write = vi.spyOn(fs, 'writeFileSync').mockImplementation(() => undefined);
    vi.spyOn(console, 'error').mockImplementation(() => undefined);
    stubKeyFileRead(() => {
      const err = new Error('EACCES: permission denied') as NodeJS.ErrnoException;
      err.code = 'EACCES';
      throw err;
    });

    await expect(import('../../src/config')).rejects.toThrow('process.exit called');
    expect(exit).toHaveBeenCalledWith(1);
    expect(write).not.toHaveBeenCalledWith(ENC_KEY_FILE, expect.anything(), expect.anything());
  });

  it('CFGKEY-001b: names the errno, and the bind-mount case behind EISDIR', async () => {
    vi.spyOn(process, 'exit').mockImplementation((() => {
      throw new Error('process.exit called');
    }) as never);
    vi.spyOn(fs, 'writeFileSync').mockImplementation(() => undefined);
    const error = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    stubKeyFileRead(() => {
      const err = new Error('EISDIR: illegal operation on a directory, read') as NodeJS.ErrnoException;
      err.code = 'EISDIR';
      throw err;
    });

    await expect(import('../../src/config')).rejects.toThrow('process.exit called');
    // Without the code the operator sees a message and no way to tell a
    // permission problem from a directory in the file's place.
    const lines = error.mock.calls.map((c) => c.join(' '));
    expect(lines.some((l) => l.startsWith('FATAL:') && l.includes('EISDIR'))).toBe(true);
    expect(lines.some((l) => l.includes('bind mount'))).toBe(true);
  });

  it('CFGKEY-002: refuses to regenerate over an existing but empty key file', async () => {
    const exit = vi.spyOn(process, 'exit').mockImplementation((() => {
      throw new Error('process.exit called');
    }) as never);
    const write = vi.spyOn(fs, 'writeFileSync').mockImplementation(() => undefined);
    vi.spyOn(console, 'error').mockImplementation(() => undefined);
    vi.spyOn(fs, 'existsSync').mockImplementation(((file: fs.PathLike) => String(file) === ENC_KEY_FILE) as typeof fs.existsSync);
    stubKeyFileRead(() => '   \n');

    await expect(import('../../src/config')).rejects.toThrow('process.exit called');
    expect(exit).toHaveBeenCalledWith(1);
    expect(write).not.toHaveBeenCalledWith(ENC_KEY_FILE, expect.anything(), expect.anything());
  });

  it('CFGKEY-003: still auto-generates a key when nothing is on disk yet', async () => {
    const exit = vi.spyOn(process, 'exit').mockImplementation((() => {
      throw new Error('process.exit called');
    }) as never);
    vi.spyOn(fs, 'writeFileSync').mockImplementation(() => undefined);
    vi.spyOn(console, 'log').mockImplementation(() => undefined);
    // The key file is genuinely absent, so the empty-file guard must not fire.
    vi.spyOn(fs, 'existsSync').mockImplementation(((file: fs.PathLike) => String(file) !== ENC_KEY_FILE) as typeof fs.existsSync);
    stubKeyFileRead(() => {
      throw enoent();
    });

    const config = await import('../../src/config');
    expect(exit).not.toHaveBeenCalled();
    expect(config.ENCRYPTION_KEY).toMatch(/^[0-9a-f]{64}$/);
  });
});
