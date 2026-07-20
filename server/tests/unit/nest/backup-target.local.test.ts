import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

import { localTarget, validatePath } from '../../../src/nest/backup/backup-target.local';
import type { TargetConfig } from '../../../src/nest/backup/backup-target.config';

function cfg(localPath: string): TargetConfig {
  return {
    localEnabled: true,
    localPath,
    s3Enabled: false,
    endpoint: '', region: '', bucket: '', prefix: '',
    accessKeyId: '', secretAccessKey: '', forcePathStyle: false, requireTls: true,
  };
}

const isBackupName = (n: string) => /^(?:auto-)?backup-[\w-]+\.zip$/.test(n);

let tmp: string;
let src: string;

beforeEach(() => {
  tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'trek-local-target-'));
  src = path.join(tmp, 'backup-2026-01-01T00-00-00.zip');
  fs.writeFileSync(src, 'ARCHIVE-CONTENTS');
});

afterEach(() => {
  fs.rmSync(tmp, { recursive: true, force: true });
});

describe('validatePath', () => {
  it('rejects an empty path', () => {
    expect(validatePath(cfg('')).ok).toBe(false);
  });

  it('rejects a relative path', () => {
    // A relative path resolves against the server's cwd and would silently
    // move if that ever changed.
    const res = validatePath(cfg('backups'));
    expect(res.ok).toBe(false);
    expect(res.error).toMatch(/absolute/i);
  });

  it('refuses the uploads directory', () => {
    const forbidden = path.resolve(__dirname, '../../../src/nest/backup', '../../../uploads');
    const res = validatePath(cfg(forbidden));
    expect(res.ok).toBe(false);
    expect(res.error).toMatch(/uploads/i);
  });

  it('allows the default backups directory — it is where backups belong', () => {
    // data/backups is the local backend default; rejecting it would make the
    // out-of-the-box configuration invalid.
    const dflt = path.resolve(__dirname, '../../../src/nest/backup', '../../../data/backups');
    expect(validatePath(cfg(dflt)).ok).toBe(true);
  });

  it('refuses a directory nested inside uploads', () => {
    // Targeting uploads/ would put every archive inside the NEXT backup, so
    // each run would embed all previous runs and size would compound (#1358).
    const nested = path.resolve(__dirname, '../../../src/nest/backup', '../../../uploads/mirror');
    expect(validatePath(cfg(nested)).ok).toBe(false);
  });

  it('accepts an unrelated absolute directory', () => {
    // The usual case: a path the operator maps to a volume on the Docker image,
    // or any filesystem path on a source install.
    expect(validatePath(cfg(path.join(tmp, 'mapped'))).ok).toBe(true);
  });
});

describe('localTarget', () => {
  it('copies the archive and reports the destination', async () => {
    const dest = path.join(tmp, 'mapped');
    const res = await localTarget(cfg(dest), isBackupName).upload(src);
    expect(res.uploaded).toBe(true);
    expect(fs.readFileSync(path.join(dest, path.basename(src)), 'utf8')).toBe('ARCHIVE-CONTENTS');
  });

  it('leaves no .part file behind on success', async () => {
    const dest = path.join(tmp, 'mapped');
    await localTarget(cfg(dest), isBackupName).upload(src);
    expect(fs.readdirSync(dest).filter(f => f.endsWith('.part'))).toEqual([]);
  });

  it('refuses to write into the uploads directory', async () => {
    const forbidden = path.resolve(__dirname, '../../../src/nest/backup', '../../../uploads');
    const res = await localTarget(cfg(forbidden), isBackupName).upload(src);
    expect(res.uploaded).toBe(false);
    expect(res.error).toMatch(/uploads/i);
  });

  it('reports presence and removes again', async () => {
    const t = localTarget(cfg(path.join(tmp, 'mapped')), isBackupName);
    expect(await t.has(src)).toBe(false);
    await t.upload(src);
    expect(await t.has(src)).toBe(true);
    await t.remove(path.basename(src));
    expect(await t.has(src)).toBe(false);
  });

  it('lists only files that look like TREK backups', async () => {
    const dest = path.join(tmp, 'mapped');
    const t = localTarget(cfg(dest), isBackupName);
    await t.upload(src);
    // The directory may hold other things; they must not surface as restorable.
    fs.writeFileSync(path.join(dest, 'holiday-photo.jpg'), 'x');
    fs.writeFileSync(path.join(dest, 'notes.txt'), 'x');

    const listed = await t.list();
    expect(listed.map(b => b.filename)).toEqual([path.basename(src)]);
    expect(listed[0].size).toBe('ARCHIVE-CONTENTS'.length);
  });

  it('lists nothing when the directory does not exist yet', async () => {
    expect(await localTarget(cfg(path.join(tmp, 'never-made')), isBackupName).list()).toEqual([]);
  });

  it('downloads an archive back to a local path', async () => {
    const t = localTarget(cfg(path.join(tmp, 'mapped')), isBackupName);
    await t.upload(src);
    const back = path.join(tmp, 'restored.zip');
    await t.download(path.basename(src), back);
    expect(fs.readFileSync(back, 'utf8')).toBe('ARCHIVE-CONTENTS');
  });

  describe('test()', () => {
    it('creates the directory, proves it is writable, and cleans up', async () => {
      const dest = path.join(tmp, 'fresh');
      expect(await localTarget(cfg(dest), isBackupName).test()).toEqual({ success: true });
      expect(fs.existsSync(dest)).toBe(true);
      // The probe must not be left lying around in the operator's directory.
      expect(fs.readdirSync(dest)).toEqual([]);
    });

    it('fails a path inside TREK rather than creating it', async () => {
      const forbidden = path.resolve(__dirname, '../../../src/nest/backup', '../../../uploads/x');
      const res = await localTarget(cfg(forbidden), isBackupName).test();
      expect(res.success).toBe(false);
      expect(fs.existsSync(forbidden)).toBe(false);
    });

    it('fails when the target is a file rather than a directory', async () => {
      const notADir = path.join(tmp, 'a-file');
      fs.writeFileSync(notADir, 'x');
      expect((await localTarget(cfg(notADir), isBackupName).test()).success).toBe(false);
    });
  });
});
