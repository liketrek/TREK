/**
 * A Nest testing module for unit suites: the domain modules under test over
 * the suite's snapshot test db, with the collaborators the suite wants to
 * control replaced by provider overrides.
 *
 * A suite takes its subject out of the container instead of calling its
 * constructor, so a service that gains a dependency changes its module, not
 * every suite that builds it (lint:test-new-service holds the hand-built rest):
 *
 *   const t = await createTestModule({
 *     db: testDb,
 *     imports: [TodoModule],
 *     overrides: [{ provide: PermissionsService, useValue: { checkPermission: () => true } }],
 *   });
 *   const todos = t.get(TodoService);
 *   ...
 *   expect(t.realtime.broadcastMock).toHaveBeenCalledWith(tripId, 'todo:created', ...);
 *   afterAll(() => t.close());
 *
 * Every module gets the request-scoped ORM and the UnitOfWork bound to `db`
 * (the same pair the e2e suites mount) and the global RealtimeModule, whose
 * RealtimeService is a FakeRealtimeService unless the suite hands in its own.
 */
import { RealtimeModule } from '../../src/nest/realtime/realtime.module';
import { RealtimeService } from '../../src/nest/realtime/realtime.service';
import { FakeRealtimeService } from './fake-realtime';
import { createTestMikroOrmModule } from './test-orm';
import { TestUnitOfWorkModule } from './test-uow';
import type { DynamicModule, ForwardReference, INestApplicationContext, Provider, Type } from '@nestjs/common';
import { Test, type TestingModule } from '@nestjs/testing';

import type Database from 'better-sqlite3';

type ModuleImport = Type<unknown> | DynamicModule | Promise<DynamicModule> | ForwardReference;

/** A provider the suite replaces: by value, by class or by factory, as Nest's overrideProvider takes it. */
export type TestOverride =
  | { provide: unknown; useValue: unknown }
  | { provide: unknown; useClass: Type<unknown> }
  | { provide: unknown; useFactory: (...args: never[]) => unknown; inject?: unknown[] };

export interface TestModuleOptions<R extends RealtimeService = FakeRealtimeService> {
  /** The suite's test db (a snapshot copy, usually through the `src/db/database` mock). */
  db: Database.Database;
  /** The domain modules under test. */
  imports: ModuleImport[];
  /** Extra providers next to them, for a provider no module lists. */
  providers?: Provider[];
  /** Collaborators the suite controls. Applied after the realtime override, so one here wins. */
  overrides?: TestOverride[];
  /** The RealtimeService every module gets. Defaults to a fresh FakeRealtimeService. */
  realtime?: R;
  /** Run the lifecycle hooks (onModuleInit and friends). Off by default: most subjects need none. */
  init?: boolean;
}

export interface TestModule<R extends RealtimeService = FakeRealtimeService> {
  moduleRef: TestingModule;
  /** The RealtimeService the container resolved: the fake unless the suite chose otherwise. */
  realtime: R;
  /** A provider out of the container, looked up across modules. */
  get: INestApplicationContext['get'];
  close: () => Promise<void>;
}

export async function createTestModule<R extends RealtimeService = FakeRealtimeService>(
  options: TestModuleOptions<R>,
): Promise<TestModule<R>> {
  const realtime = options.realtime ?? (new FakeRealtimeService() as RealtimeService as R);
  let builder = Test.createTestingModule({
    imports: [
      await TestUnitOfWorkModule.forRoot(options.db),
      // No HTTP request forks a context here, so the global one is allowed.
      await createTestMikroOrmModule(options.db, { allowGlobalContext: true }),
      RealtimeModule,
      ...options.imports,
    ],
    providers: options.providers ?? [],
  })
    .overrideProvider(RealtimeService)
    .useValue(realtime);
  for (const override of options.overrides ?? []) {
    const target = builder.overrideProvider(override.provide);
    if ('useValue' in override) builder = target.useValue(override.useValue);
    else if ('useClass' in override) builder = target.useClass(override.useClass);
    else builder = target.useFactory({ factory: override.useFactory, inject: override.inject as never[] });
  }
  const moduleRef = await builder.compile();
  if (options.init) await moduleRef.init();
  return {
    moduleRef,
    realtime,
    get: moduleRef.get.bind(moduleRef) as INestApplicationContext['get'],
    close: () => moduleRef.close(),
  };
}
