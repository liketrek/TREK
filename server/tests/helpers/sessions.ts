import { UserSessions } from '../../src/db/entities/UserSessions.entity';
import type { UserSessionsRepository } from '../../src/db/repositories/UserSessions.repository';
import { SessionsService } from '../../src/nest/sessions/sessions.service';
import { findRows } from './factories/rows';
import { sharedTestOrm } from './test-uow';

import type Database from 'better-sqlite3';

/**
 * The `user_sessions` table behind `SessionsService`, bound to a suite's own
 * better-sqlite3 handle through the memoised `sharedTestOrm`, so a session row
 * written inside a hand-built service's `UnitOfWork` transaction lands on the
 * same connection the suite reads back.
 */
export function createTestUserSessionsRepo(db: Database.Database): Promise<UserSessionsRepository> {
  return sharedTestOrm(db).then((t) => t.repo(UserSessions));
}

/** A real `SessionsService` over that repository, for the hand-constructed `AuthService`/`AdminService`. */
export async function createTestSessionsService(db: Database.Database): Promise<SessionsService> {
  return new SessionsService(await createTestUserSessionsRepo(db));
}

/** The session rows of a user, oldest first, read through the ORM on the suite's own handle. */
export async function sessionRows(
  db: Database.Database,
  userId: number,
): Promise<{ id: string; revoked_at: string | null; expires_at: string; user_agent: string | null }[]> {
  const rows = await findRows(
    await sharedTestOrm(db),
    UserSessions,
    { user: userId },
    { created_at: 'asc', id: 'asc' },
  );
  return rows.map(({ id, revoked_at, expires_at, user_agent }) => ({
    id,
    revoked_at: revoked_at ?? null,
    expires_at,
    user_agent: user_agent ?? null,
  }));
}
