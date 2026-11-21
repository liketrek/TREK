import { DatabaseEngineModule } from './database-engine.module';
import { DatabaseLifecycle } from './database-lifecycle.service';
import { Module } from '@nestjs/common';

/**
 * Provides `DatabaseLifecycle`. Not global: the backup port and the app root
 * import it by name, so a partial test harness that never touches the
 * connection lifecycle does not have to supply the `MikroORM` it injects.
 */
@Module({ imports: [DatabaseEngineModule], providers: [DatabaseLifecycle], exports: [DatabaseLifecycle] })
export class DatabaseLifecycleModule {}
