import { Users } from '../../db/entities/Users.entity';
import type { UsersRepository } from '../../db/repositories/Users.repository';
import { UnitOfWork } from '../database/unit-of-work';
import type { SessionClient } from '../sessions/sessions.service';
import { AuthService } from './auth.service';
import { InjectRepository } from '@mikro-orm/nestjs';
import { Injectable } from '@nestjs/common';

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
    @InjectRepository(Users) private readonly users: UsersRepository,
  ) {}

  /** The session token, or null when the account no longer exists. */
  async signIn(userId: number, remember: boolean | undefined, client?: SessionClient): Promise<string | null> {
    return this.uow.transactional(async () => {
      const passwordVersion = await this.users.getPasswordVersion(userId);
      if (passwordVersion === null) return null;
      await this.users.touchLastLogin(userId);
      return this.auth.generateToken({ id: userId, password_version: passwordVersion }, remember, client);
    });
  }
}
