import { Injectable } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';

/**
 * Smoke service proving NestJS DI works under the chosen runtime AND that the
 * injected DatabaseService talks to TREK's existing SQLite connection.
 */
@Injectable()
export class HealthService {
  constructor(private readonly database: DatabaseService) {}

  info() {
    const row = this.database.get<{ n: number }>('SELECT COUNT(*) AS n FROM users');
    return {
      runtime: 'nestjs',
      diInjected: true,
      // Proof the shared connection works: real row count from the existing DB.
      userCount: row?.n ?? null,
    };
  }
}
