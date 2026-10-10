import { Module } from '@nestjs/common';
import { EntityManager } from '@mikro-orm/core';
import { UserAirtrailRepository } from '../../db/repositories/UserAirtrail.repository';
import { UserImmichRepository } from '../../db/repositories/UserImmich.repository';
import { UserSynologyRepository } from '../../db/repositories/UserSynology.repository';

/**
 * Provides the repositories for the third-party connections a user keeps on
 * their own `users` row (Immich, Synology Photos, AirTrail). They share the
 * `users` table with `UsersRepository`, so MikroORM's one-repository-per-entity
 * `@InjectRepository(Users)` cannot hand them out; each is a factory over the
 * context-resolving global `EntityManager`, as `MaintenanceModule` does, so it
 * resolves the request or transaction fork active when a method runs.
 */
@Module({
  providers: [
    { provide: UserImmichRepository, useFactory: (em: EntityManager) => new UserImmichRepository(em), inject: [EntityManager] },
    { provide: UserSynologyRepository, useFactory: (em: EntityManager) => new UserSynologyRepository(em), inject: [EntityManager] },
    { provide: UserAirtrailRepository, useFactory: (em: EntityManager) => new UserAirtrailRepository(em), inject: [EntityManager] },
  ],
  exports: [UserImmichRepository, UserSynologyRepository, UserAirtrailRepository],
})
export class UserConnectionRepositoriesModule {}
