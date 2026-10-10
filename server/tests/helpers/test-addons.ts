import { Addons } from '../../src/db/entities/Addons.entity';
import { AppSettings } from '../../src/db/entities/AppSettings.entity';
import { PhotoProviderFields } from '../../src/db/entities/PhotoProviderFields.entity';
import { PhotoProviders } from '../../src/db/entities/PhotoProviders.entity';
import { Users } from '../../src/db/entities/Users.entity';
import { AddonsService } from '../../src/nest/addons/addons.service';
import { UnitOfWork } from '../../src/nest/database/unit-of-work';
import { sharedTestOrm } from './test-uow';

import type Database from 'better-sqlite3';

/**
 * AddonsService's constructor grew from one `DatabaseService` to four
 * injected repositories plus `DatabaseService` (Plan 3a Task 4, addons.md —
 * the `AppSettingsRepository`/`AddonsRepository`/`PhotoProvidersRepository`/
 * `PhotoProviderFieldsRepository` wiring). Every hand-constructed
 * `new AddonsService(dbs)` in the test tree needs the same four repositories
 * a real `@InjectRepository` graph would hand it — this file is that
 * factory, named `test-addons.ts` per the Task 4 brief (owned by Task 4;
 * `tests/helpers/test-uow.ts` stays Task 3's file to extend).
 *
 * Built on the shared per-handle ORM (`test-uow.ts`'s `sharedTestOrm`, not a
 * fresh `createTestOrm` here) — the SAME one `createTestAppSettingsRepo`/
 * `createTestUnitOfWork` draw from, so a repository built here and a
 * `UnitOfWork`/repository built elsewhere for the same handle resolve
 * through the identical context-resolving `EntityManager`, exactly like
 * Nest's real DI graph (task-2-review.md I2's fix, carried forward for this
 * domain).
 */
/**
 * The full `AddonsService` a hand-constructed test collaborator needs, bound
 * to the suite's own better-sqlite3 handle. Plan 4 Task 4 dropped the
 * trailing `DatabaseService` param (dead in `AddonsService` itself since
 * `transit-provider.ts`/`instance-api-keys.ts` moved onto
 * `AppSettingsRepository` — Plan 4 Task 1).
 */
export async function createTestAddonsService(db: Database.Database): Promise<AddonsService> {
  const t = await sharedTestOrm(db);
  return new AddonsService(
    t.repo(Addons),
    t.repo(PhotoProviders),
    t.repo(PhotoProviderFields),
    t.repo(AppSettings),
    t.repo(Users),
    new UnitOfWork(t.em),
  );
}
