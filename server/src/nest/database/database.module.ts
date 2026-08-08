import { Global, Module } from '@nestjs/common';
import { db } from '../../db/database';
import { DatabaseService } from './database.service';
import { DATABASE_CONNECTION } from './database.tokens';

/**
 * Global so every migrated module can inject DatabaseService without re-importing.
 * DATABASE_CONNECTION resolves to the existing better-sqlite3 singleton Proxy
 * (no new connection, single writer preserved); tests can override the token
 * to hand the container a throwaway connection.
 */
@Global()
@Module({
  providers: [{ provide: DATABASE_CONNECTION, useFactory: () => db }, DatabaseService],
  exports: [DatabaseService, DATABASE_CONNECTION],
})
export class DatabaseModule {}
