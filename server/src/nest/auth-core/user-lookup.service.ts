import { Users } from '../../db/entities/Users.entity';
import type { UsersRepository } from '../../db/repositories/Users.repository';
import { InjectRepository } from '@mikro-orm/nestjs';
import { Injectable } from '@nestjs/common';

/**
 * Who an account is, for a domain that needs a user's name or address and
 * nothing else of the auth domain. Reading the users table belongs to auth;
 * this kernel service answers the narrow question, so such a domain imports
 * neither AuthModule (and its graph) nor a repository it does not own.
 */
@Injectable()
export class UserLookupService {
  constructor(@InjectRepository(Users) private readonly users: UsersRepository) {}

  /** The account's username and email, or undefined for an unknown id. */
  async usernameAndEmail(userId: number): Promise<{ username: string; email: string } | undefined> {
    return this.users.findUsernameEmail(userId);
  }
}
