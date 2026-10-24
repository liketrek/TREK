import { resolveDataPaths, type DataPaths } from '../../app-config/data-paths';
import { Injectable } from '@nestjs/common';

/**
 * The data layout for Nest classes: the data directory, uploads, backups,
 * scratch space, logs, the key files and the database file.
 *
 * Providers that read a data path take this one (AdminService,
 * StorageRegistryService). Code that runs before the container exists or is
 * shared with code outside it (config.ts key resolution, the database
 * connection, index.ts, the file logger, the backup functions, the plugin
 * trees) calls `resolveDataPaths()` directly; src/app-config/README.md keeps
 * the list. Both get the same answer, and neither counts `..` hops from its
 * own file. Resolved once per built app: none of these move while a process
 * runs.
 */
@Injectable()
export class DataPathsService implements DataPaths {
  readonly dataDir: string;
  readonly uploadsDir: string;
  readonly backupsDir: string;
  readonly tmpDir: string;
  readonly logsDir: string;
  readonly jwtSecretFile: string;
  readonly encryptionKeyFile: string;
  readonly dbFile: string;

  constructor() {
    const paths = resolveDataPaths();
    this.dataDir = paths.dataDir;
    this.uploadsDir = paths.uploadsDir;
    this.backupsDir = paths.backupsDir;
    this.tmpDir = paths.tmpDir;
    this.logsDir = paths.logsDir;
    this.jwtSecretFile = paths.jwtSecretFile;
    this.encryptionKeyFile = paths.encryptionKeyFile;
    this.dbFile = paths.dbFile;
  }
}
