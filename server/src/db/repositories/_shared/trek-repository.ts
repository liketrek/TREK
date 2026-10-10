import {
  EntityRepository,
  type CountByOptions,
  type CountOptions,
  type Cursor,
  type DeleteOptions,
  type Dictionary,
  type EntityData,
  type EntityKey,
  type FilterQuery,
  type FindAllOptions,
  type FindByCursorOptions,
  type FindOneOptions,
  type FindOneOrFailOptions,
  type FindOptions,
  type GetKyselyOptions,
  type Loaded,
  type NativeInsertUpdateOptions,
  type Primary,
  type QueryBuilder,
  type RequiredEntityData,
  type SqlEntityManager,
  type StreamOptions,
  type UpdateOptions,
  type UpsertManyOptions,
  type UpsertOptions,
  type WithUsingOptions,
} from '@mikro-orm/sql';

/**
 * The one base class every repository in `src/db/repositories/*.ts` extends,
 * instead of `@mikro-orm/sql`'s `EntityRepository` directly.
 *
 * **Why it exists.** Plan 3b Task 1's `disableIdentityMap` ruling
 * (`Users.repository.ts`'s class docstring, task-1-review.md B1) made every
 * row-out read pass `disableIdentityMap: true` to stop a stale, partially
 * hydrated identity-map entity from being written back over an intervening
 * `nativeUpdate`. The re-review (`task-1-rereview.md` F-R1) found the
 * side effect: `disableIdentityMap: true` resolves its `EntityManager` with
 * `getContext(false)` (`node_modules/@mikro-orm/core/EntityManager.js`,
 * the `findOne`/`find` `disableIdentityMap` branch), and `false` is the one
 * argument that SKIPS the `allowGlobalContext` check —
 * `getContext(validate = true)` is the only place `ValidationError
 * .cannotUseGlobalContext()` is thrown, gated on `validate`
 * (`node_modules/@mikro-orm/core/EntityManager.js:1912-1925`). So every
 * converted read stopped failing closed outside a request context: it now
 * succeeds silently against the global `EntityManager` instead of throwing.
 * Separately, the *write* paths (`nativeUpdate`/`nativeDelete`/`count`/
 * `insert`/`upsert`) never validated in the first place — they all resolve
 * with `getContext(false)` too (task-1-review.md F7 INFO) — so an unwrapped
 * entrypoint that only ever writes was never caught at all.
 *
 * This class restores the program's D6 ratchet ("an unwrapped entrypoint
 * fails loudly") for every path a repository exposes, in one place: each
 * override below calls {@link TrekRepository.validateRequestContext} FIRST —
 * MikroORM's own, VALIDATING `getContext()` (`validate` defaults to `true`)
 * — which throws `ValidationError.cannotUseGlobalContext()` outside
 * `withRequestContext`/`RequestContext.create`/an open transaction, exactly
 * as a managed (identity-map) read did before the `disableIdentityMap`
 * ruling — and only then delegates to `super`. Every overridden method keeps
 * MikroORM's own signature and does nothing else: this class does not change
 * what a repository method returns or which SQL it emits, only whether it
 * runs at all outside a request context.
 *
 * **Read-path default.** `find`/`findOne`/`findAll` additionally merge
 * `{ disableIdentityMap: true }` into the caller's options, unless the
 * caller passes `disableIdentityMap: false` explicitly — the class-level
 * ruling every repository used to restate on its own `Users.repository.ts`,
 * `McpTokens.repository.ts`, etc. — so no repository needs to pass the
 * option itself any more. See
 * https://mikro-orm.io/docs/entity-manager#disableidentitymap.
 *
 * **Kysely.** `em.getKysely()` is the query API for every read that joins,
 * aggregates or projects across tables and for set-based writes, typed
 * against the generated `DB` from `db/kysely/db.ts`; the entity methods cover
 * single-table CRUD, and new code adds no QueryBuilder calls (server/CLAUDE.md,
 * "Which query API"; `lint:query-api` holds the existing ones). It resolves its
 * `EntityManager` with `getContext(false)` too
 * (`node_modules/@mikro-orm/sql/SqlEntityManager.js`), so it has the exact
 * same gap as the write paths above. {@link TrekRepository.kysely} is the one
 * place a repository reaches Kysely, instead of calling
 * `this.getEntityManager().getKysely()` directly.
 *
 * See https://mikro-orm.io/docs/repositories (custom repositories) and
 * https://mikro-orm.io/docs/identity-map (`allowGlobalContext`).
 */
export abstract class TrekRepository<Entity extends object> extends EntityRepository<Entity> {
  /**
   * MikroORM's own validating `getContext()` — throws
   * `ValidationError.cannotUseGlobalContext()` outside a request context
   * (`allowGlobalContext: false`, the production default) or an open
   * transaction. `super.getEntityManager()`, not `this.getEntityManager()`:
   * the latter is itself overridden below to call this method, and calling
   * through `this` here would recurse.
   */
  protected validateRequestContext(): void {
    super.getEntityManager().getContext();
  }

  /**
   * `em.getKysely()`, validated first: the query API for join, aggregate and
   * set-based statements (see the class docstring), always reached through
   * here, never through `this.getEntityManager().getKysely()` directly.
   * No explicit return-type annotation: `SqlEntityManager.getKysely`'s
   * return type is expressed in terms of `this` (the entity list the calling
   * `EntityManager` was constructed with), which does not survive being
   * spelled out via `ReturnType<...>` on its own — inference from the
   * `return` statement below keeps it intact.
   */
  protected kysely<TDB = undefined, TOptions extends GetKyselyOptions = GetKyselyOptions>(options?: TOptions) {
    this.validateRequestContext();
    return this.getEntityManager().getKysely<TDB, TOptions>(options);
  }

  override getEntityManager(): SqlEntityManager {
    this.validateRequestContext();
    return super.getEntityManager();
  }

  /**
   * `find`/`findOne`/`findAll` below drop the base signature's `Using`
   * type parameter and its `IndexFilterQuery`/`using` machinery (MikroORM's
   * named-index query hint) rather than reproduce it: no repository in this
   * program passes `using`, and TypeScript's override-compatibility check
   * on that parameter's conditional type — `[Using] extends [never] ? ... :
   * ...` compared against the base class's own instantiation of it — does
   * not hold even for a byte-identical copy of the declared signature (a
   * generic-defaults quirk in how the checker instantiates the two sides
   * for comparison, not a real behavioural difference). Every other generic
   * (`Hint`/`Fields`/`Excludes`, the ones every repository's `fields`/
   * `populate` options actually use) is preserved exactly.
   */
  override async findOne<Hint extends string = never, Fields extends string = never, Excludes extends string = never>(
    where: FilterQuery<Entity>,
    options?: FindOneOptions<Entity, Hint, Fields, Excludes>,
  ): Promise<Loaded<Entity, Hint, Fields, Excludes> | null> {
    this.validateRequestContext();
    const disableIdentityMap = options?.disableIdentityMap ?? true;
    return super.findOne(where, { ...options, disableIdentityMap });
  }

  override async find<Hint extends string = never, Fields extends string = never, Excludes extends string = never>(
    where: FilterQuery<Entity>,
    options?: FindOptions<Entity, Hint, Fields, Excludes>,
  ): Promise<Loaded<Entity, Hint, Fields, Excludes>[]> {
    this.validateRequestContext();
    const disableIdentityMap = options?.disableIdentityMap ?? true;
    return super.find(where, { ...options, disableIdentityMap });
  }

  override async findAll<
    Hint extends string = never,
    Fields extends string = never,
    Excludes extends string = never,
    Using extends string = never,
  >(
    options?: WithUsingOptions<FindAllOptions<Entity, Hint, Fields, Excludes>, Entity, Using>,
  ): Promise<Loaded<Entity, Hint, Fields, Excludes>[]> {
    this.validateRequestContext();
    const disableIdentityMap = options?.disableIdentityMap ?? true;
    return super.findAll({ ...options, disableIdentityMap });
  }

  override async count<Hint extends string = never>(where?: FilterQuery<Entity>, options?: CountOptions<Entity, Hint>): Promise<number> {
    this.validateRequestContext();
    return super.count(where, options);
  }

  /**
   * Task 7 review, M4: `TrekRepository` left seven DB-reaching base-class
   * methods unoverridden (none used anywhere in this program today —
   * `grep -rnE "\.(countBy|findAndCount|findByCursor|findOneOrFail|
   * insertMany|upsertMany|stream)\(" src/db/repositories/` was 0 hits — but
   * the FIRST one used would silently lose both guarantees: no
   * `validateRequestContext()`, and — for the read-shaped ones — no
   * `disableIdentityMap: true` default). Same shape as `findOne`/`find`/
   * `findAll` above: `Using` dropped for the same override-compatibility
   * reason documented on `findOne`.
   */
  override async findOneOrFail<Hint extends string = never, Fields extends string = never, Excludes extends string = never>(
    where: FilterQuery<Entity>,
    options?: FindOneOrFailOptions<Entity, Hint, Fields, Excludes>,
  ): Promise<Loaded<Entity, Hint, Fields, Excludes>> {
    this.validateRequestContext();
    const disableIdentityMap = options?.disableIdentityMap ?? true;
    return super.findOneOrFail(where, { ...options, disableIdentityMap });
  }

  override async findAndCount<Hint extends string = never, Fields extends string = never, Excludes extends string = never>(
    where: FilterQuery<Entity>,
    options?: FindOptions<Entity, Hint, Fields, Excludes>,
  ): Promise<[Loaded<Entity, Hint, Fields, Excludes>[], number]> {
    this.validateRequestContext();
    const disableIdentityMap = options?.disableIdentityMap ?? true;
    return super.findAndCount(where, { ...options, disableIdentityMap });
  }

  override async findByCursor<
    Hint extends string = never,
    Fields extends string = never,
    Excludes extends string = never,
    IncludeCount extends boolean = true,
    Using extends string = never,
  >(
    options: WithUsingOptions<FindByCursorOptions<Entity, Hint, Fields, Excludes, IncludeCount>, Entity, Using>,
  ): Promise<Cursor<Entity, Hint, Fields, Excludes, IncludeCount>> {
    this.validateRequestContext();
    const disableIdentityMap = options?.disableIdentityMap ?? true;
    return super.findByCursor({ ...options, disableIdentityMap });
  }

  /** Grouping counts don't hydrate an entity — no identity map to isolate — so this only needs the fail-closed guard, matching `count` above. */
  override async countBy(groupBy: EntityKey<Entity> | readonly EntityKey<Entity>[], options?: CountByOptions<Entity>): Promise<Dictionary<number>> {
    this.validateRequestContext();
    return super.countBy(groupBy, options);
  }

  override stream<Hint extends string = never, Fields extends string = never, Excludes extends string = never, Using extends string = never>(
    options?: WithUsingOptions<StreamOptions<Entity, Hint, Fields, Excludes>, Entity, Using>,
  ): AsyncIterableIterator<Loaded<Entity, Hint, Fields, Excludes>> {
    this.validateRequestContext();
    const disableIdentityMap = options?.disableIdentityMap ?? true;
    return super.stream({ ...options, disableIdentityMap });
  }

  override async insertMany(data: Entity[] | RequiredEntityData<Entity>[], options?: NativeInsertUpdateOptions<Entity>): Promise<Primary<Entity>[]> {
    this.validateRequestContext();
    return super.insertMany(data, options);
  }

  override async upsertMany<Fields extends string = never>(
    entitiesOrData?: EntityData<Entity>[] | Entity[],
    options?: UpsertManyOptions<Entity, Fields>,
  ): Promise<Entity[]> {
    this.validateRequestContext();
    return super.upsertMany(entitiesOrData, options);
  }

  override async nativeUpdate(where: FilterQuery<Entity>, data: EntityData<Entity>, options?: UpdateOptions<Entity>): Promise<number> {
    this.validateRequestContext();
    return super.nativeUpdate(where, data, options);
  }

  override async nativeDelete(where: FilterQuery<Entity>, options?: DeleteOptions<Entity>): Promise<number> {
    this.validateRequestContext();
    return super.nativeDelete(where, options);
  }

  override async insert(data: Entity | RequiredEntityData<Entity>, options?: NativeInsertUpdateOptions<Entity>): Promise<Primary<Entity>> {
    this.validateRequestContext();
    return super.insert(data, options);
  }

  override async upsert<Fields extends string = never>(
    entityOrData?: EntityData<Entity> | Entity,
    options?: UpsertOptions<Entity, Fields>,
  ): Promise<Entity> {
    this.validateRequestContext();
    return super.upsert(entityOrData, options);
  }

  override createQueryBuilder<RootAlias extends string = never>(alias?: RootAlias): QueryBuilder<Entity, RootAlias> {
    this.validateRequestContext();
    return super.createQueryBuilder(alias);
  }

  override qb<RootAlias extends string = never>(alias?: RootAlias): QueryBuilder<Entity, RootAlias> {
    this.validateRequestContext();
    return super.qb(alias);
  }
}
