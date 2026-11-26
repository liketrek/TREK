import { Users } from '../../db/entities/Users.entity';
import type { UsersRepository } from '../../db/repositories/Users.repository';
import { dbNow } from '../../db/types/db-timestamp.type';
import { UnitOfWork } from '../database/unit-of-work';
import { SessionsService, type SessionClient } from '../sessions/sessions.service';
import { AuthService } from './auth.service';
import { InjectRepository } from '@mikro-orm/nestjs';
import { Injectable } from '@nestjs/common';

/**
 * The signed-in session a new one is carried on from: its account, the
 * password version it was issued under, and its id (null on a token from
 * before sessions were tracked).
 */
export interface SessionOrigin {
  userId: number;
  passwordVersion: number;
  sessionId: string | null;
}

/**
 * Signs in an account whose identity another way in has already proven: the
 * login is recorded on the account and the session minted in one transaction.
 *
 * Auth owns the users table, so a domain whose flow ends in a sign-in (the
 * native app hand-off) asks here instead of reaching for that table itself.
 */
@Injectable()
export class LoginSessionService {
  constructor(
    private readonly auth: AuthService,
    private readonly uow: UnitOfWork,
    private readonly sessions: SessionsService,
    @InjectRepository(Users) private readonly users: UsersRepository,
  ) {}

  /**
   * The session token, or null when the session it is carried on from no
   * longer stands: the account is gone, the password changed since, or that
   * session ended (a sign-out, a revocation, a password reset). A credential
   * the account took back cannot mint a new one this way.
   */
  async signIn(origin: SessionOrigin, remember: boolean | undefined, client?: SessionClient): Promise<string | null> {
    return this.uow.transactional(async () => {
      const passwordVersion = await this.users.getPasswordVersion(origin.userId);
      if (passwordVersion === null || passwordVersion !== origin.passwordVersion) return null;
      if (origin.sessionId !== null && !(await this.sessions.findActive(origin.sessionId, origin.userId, dbNow()))) {
        return null;
      }
      await this.users.touchLastLogin(origin.userId);
      return this.auth.generateToken({ id: origin.userId, password_version: passwordVersion }, remember, client);
    });
  }
}
