/**
 * The data layout: one anchor for data/, uploads/ and the files inside them,
 * shared by the pre-container code (resolveDataPaths) and the Nest classes
 * (DataPathsService). These cases pin where each path lands, because a moved
 * anchor silently moves the database, the key files or the backups.
 */
import { resolveDataPaths, SERVER_ROOT } from '../../../src/app-config/data-paths';
import { DataPathsService } from '../../../src/nest/app-config/data-paths.service';
import { filesDir } from '../../../src/nest/files/files.constants';
import {
  DEFAULT_BACKUPS_ROOT,
  DEFAULT_UPLOADS_ROOT,
  DATA_ROOT,
  GLOBAL_TEMP_DIR,
} from '../../../src/nest/storage/storage-paths';

import path from 'node:path';
import { describe, it, expect, afterEach, vi } from 'vitest';

const SERVER_DIR = path.resolve(__dirname, '..', '..', '..');

afterEach(() => {
  vi.unstubAllEnvs();
});

describe('resolveDataPaths', () => {
  it('DATAPATHS-001: anchors on the server package directory, not on the working directory', () => {
    expect(SERVER_ROOT).toBe(SERVER_DIR);
    const paths = resolveDataPaths({ db: { trekDbFile: undefined } });
    expect(paths.dataDir).toBe(path.join(SERVER_DIR, 'data'));
    expect(paths.uploadsDir).toBe(path.join(SERVER_DIR, 'uploads'));
  });

  it('DATAPATHS-002: places backups, scratch space, logs and the key files inside data/', () => {
    const paths = resolveDataPaths({ db: { trekDbFile: undefined } }, '/srv/trek');
    expect(paths).toEqual({
      dataDir: path.join('/srv/trek', 'data'),
      uploadsDir: path.join('/srv/trek', 'uploads'),
      backupsDir: path.join('/srv/trek', 'data', 'backups'),
      tmpDir: path.join('/srv/trek', 'data', 'tmp'),
      logsDir: path.join('/srv/trek', 'data', 'logs'),
      jwtSecretFile: path.join('/srv/trek', 'data', '.jwt_secret'),
      encryptionKeyFile: path.join('/srv/trek', 'data', '.encryption_key'),
      dbFile: path.join('/srv/trek', 'data', 'travel.db'),
    });
  });

  it('DATAPATHS-003: TREK_DB_FILE moves only the database file', () => {
    const paths = resolveDataPaths({ db: { trekDbFile: '/elsewhere/e2e.db' } }, '/srv/trek');
    expect(paths.dbFile).toBe('/elsewhere/e2e.db');
    expect(paths.dataDir).toBe(path.join('/srv/trek', 'data'));
  });

  it('DATAPATHS-004: reads TREK_DB_FILE from the live environment by default', () => {
    vi.stubEnv('TREK_DB_FILE', '/tmp/live.db');
    expect(resolveDataPaths().dbFile).toBe('/tmp/live.db');
    vi.stubEnv('TREK_DB_FILE', '');
    expect(resolveDataPaths().dbFile).toBe(path.join(SERVER_DIR, 'data', 'travel.db'));
  });
});

describe('every consumer resolves the same layout', () => {
  it('DATAPATHS-005: the storage defaults and the trip-files directory come from it', () => {
    const paths = resolveDataPaths();
    expect(DATA_ROOT).toBe(paths.dataDir);
    expect(DEFAULT_UPLOADS_ROOT).toBe(paths.uploadsDir);
    expect(DEFAULT_BACKUPS_ROOT).toBe(paths.backupsDir);
    expect(GLOBAL_TEMP_DIR).toBe(paths.tmpDir);
    expect(filesDir).toBe(path.join(paths.uploadsDir, 'files'));
  });

  it('DATAPATHS-006: DataPathsService hands Nest classes the same answer', () => {
    vi.stubEnv('TREK_DB_FILE', '/tmp/service.db');
    const service = new DataPathsService();
    expect({ ...service }).toEqual(resolveDataPaths());
    expect(service.dbFile).toBe('/tmp/service.db');
  });
});
