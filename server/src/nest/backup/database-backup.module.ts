import { DATABASE_BACKUP } from '../database/database-backup.interface';
import { DatabaseLifecycleModule } from '../database/database-lifecycle.module';
import { MaintenanceModule } from '../database/maintenance.module';
import { SqliteDatabaseBackup } from './sqlite-database-backup';
import { Global, Module } from '@nestjs/common';

/**
 * Binds the database backup port (`DATABASE_BACKUP`) to the engine in use.
 *
 * Global because its consumers sit in two domains: the backup domain itself
 * and the admin domain (the demo reset job and the baseline route). Admin
 * cannot import this file. The backup domain already reaches admin (backup
 * imports auth, auth imports settings, settings imports admin), so an
 * `admin -> backup` import would close a new domain cycle that
 * `lint:boundaries` refuses. Both inject the token from the shared database
 * kernel instead. `BackupModule` imports this module, which is what puts it in
 * the application; a test harness that mounts `AdminModule` without
 * `BackupModule` imports it itself (tests/e2e/admin.e2e.test.ts).
 */
@Global()
@Module({
  imports: [DatabaseLifecycleModule, MaintenanceModule],
  providers: [SqliteDatabaseBackup, { provide: DATABASE_BACKUP, useExisting: SqliteDatabaseBackup }],
  exports: [DATABASE_BACKUP],
})
export class DatabaseBackupModule {}
