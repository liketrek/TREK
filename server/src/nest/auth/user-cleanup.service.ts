import { BudgetItems } from '../../db/entities/BudgetItems.entity';
import { JourneyContributors } from '../../db/entities/JourneyContributors.entity';
import { JourneyEntries } from '../../db/entities/JourneyEntries.entity';
import { JourneyShareTokens } from '../../db/entities/JourneyShareTokens.entity';
import { Journeys } from '../../db/entities/Journeys.entity';
import { PluginUserErasureQueue } from '../../db/entities/PluginUserErasureQueue.entity';
import { Plugins } from '../../db/entities/Plugins.entity';
import { ShareTokens } from '../../db/entities/ShareTokens.entity';
import { TripMembers } from '../../db/entities/TripMembers.entity';
import { Users } from '../../db/entities/Users.entity';
import type { BudgetItemsRepository } from '../../db/repositories/BudgetItems.repository';
import type { JourneyContributorsRepository } from '../../db/repositories/JourneyContributors.repository';
import type { JourneyEntriesRepository } from '../../db/repositories/JourneyEntries.repository';
import type { JourneyShareTokensRepository } from '../../db/repositories/JourneyShareTokens.repository';
import type { JourneysRepository } from '../../db/repositories/Journeys.repository';
import { MaintenanceRepository } from '../../db/repositories/MaintenanceRepository';
import type { PluginUserErasureQueueRepository } from '../../db/repositories/PluginUserErasureQueue.repository';
import type { PluginsRepository } from '../../db/repositories/Plugins.repository';
import type { ShareTokensRepository } from '../../db/repositories/ShareTokens.repository';
import type { TripMembersRepository } from '../../db/repositories/TripMembers.repository';
import type { UsersRepository } from '../../db/repositories/Users.repository';
// Injected since BudgetModule dropped its AuthModule import (BudgetMcp's demo
// guard reads RuntimeEnvService + the users table now), which un-closed the
// AuthModule -> BudgetModule cycle that used to force budget.bridge here.
import { BudgetService } from '../budget/budget.service';
import { UnitOfWork } from '../database/unit-of-work';
import { pluginsDataRoot } from '../plugins/paths';
import { enqueueHookUserDataErasures } from '../plugins/user-erasure-enqueue';
import { EntityManager } from '@mikro-orm/core';
import { InjectRepository } from '@mikro-orm/nestjs';
import { Injectable } from '@nestjs/common';

import fs from 'node:fs';

/**
 * Account erasure — everything that has to happen around `DELETE FROM users`
 * and is not covered by a foreign key.
 *
 * Lives in the auth domain because it owns the `users` table; both deletion
 * paths (a user deleting their own account, an admin deleting someone else's)
 * go through here, and `TripsService.deleteGuest` reuses the plugin half for a
 * guest id. The plugin erasure runs in the CORE deletion path, not via the
 * plugin runtime, so it works even when TREK_PLUGINS_ENABLED=false or before
 * the runtime has booted — otherwise a deletion in those windows would leave
 * the user's plugin data behind forever.
 */
@Injectable()
export class UserCleanupService {
  constructor(
    // Plan 4 Task 4: `DatabaseService` dropped — UC1 (below) now goes
    // through `MaintenanceRepository`, the rule-4-permitted raw-connection
    // home, constructed from this directly-injected `EntityManager`
    // (`uow.transactional` below always leaves a request context active).
    private readonly em: EntityManager,
    private readonly budget: BudgetService,
    private readonly uow: UnitOfWork,
    @InjectRepository(Users) private readonly usersRepo: UsersRepository,
    // Plan 4 Task 1 (UC4 only) — the table's own Plan 3c ownership.
    @InjectRepository(TripMembers) private readonly tripMembersRepo: TripMembersRepository,
    // Plan 3e Task 2 (budget) — additive, UC5 only.
    @InjectRepository(BudgetItems) private readonly budgetItemsRepo: BudgetItemsRepository,
    // Plan 3g Task 4 (UC7-10) — the genuinely-journey GDPR-erasure deletes.
    @InjectRepository(JourneyShareTokens) private readonly journeyShareTokensRepo: JourneyShareTokensRepository,
    @InjectRepository(Journeys) private readonly journeysRepo: JourneysRepository,
    @InjectRepository(JourneyEntries) private readonly journeyEntriesRepo: JourneyEntriesRepository,
    @InjectRepository(JourneyContributors) private readonly journeyContributorsRepo: JourneyContributorsRepository,
    // Plan 3h Task 6 (UC6, R10) — the genuinely-share GDPR-erasure delete.
    @InjectRepository(ShareTokens) private readonly shareTokensRepo: ShareTokensRepository,
    // Plan 4 Task 8a — UC2/UC3's erasure-enqueue half only (see erasePluginUserData's
    // own docstring for why this narrows the Plan 3b Task 5 "stays raw" ruling).
    @InjectRepository(Plugins) private readonly pluginsRepo: PluginsRepository,
    @InjectRepository(PluginUserErasureQueue)
    private readonly pluginUserErasureQueueRepo: PluginUserErasureQueueRepository,
  ) {}

  /**
   * Erase a user's PLUGIN-held data on account deletion. Two parts:
   *  1. Host-side per-user plugin tables (encrypted config values, OAuth access/refresh
   *     tokens, in-flight OAuth state) — deleted directly; these live in trek.db, not in
   *     a plugin's own db, so nothing else ever removes them.
   *  2. A durable erasure row per plugin that holds `hook:user-data`, so its OWN db is
   *     purged of the user (drained to the plugin when it is next active).
   *
   * Best-effort per table so a slimmed-down schema (some tests) can't fail the user
   * deletion itself.
   *
   * UC1 (`plugin_user_config`/`plugin_oauth_tokens`/`plugin_oauth_state`)
   * stays raw (Plan 3b Task 5 ruling; inventory §6 "the single largest
   * 'stays raw' carve-out in Plan 3b") — that table trio is owned by
   * `nest/plugins`, not this domain. Plan 4 Task 4 moved it off the now-
   * deleted `DatabaseService` onto `MaintenanceRepository.deletePluginUserData`
   * (rule 4's `connection.execute()` escape hatch), not onto a repository
   * this domain would otherwise own. This method always runs inside
   * `deleteUserCompletely`'s `uow.transactional(...)` — `this.em` is safe to
   * pass as-is (MikroORM resolves the active transactional fork through
   * `EntityManager#getContext()`/`#getTransactionContext()` regardless of
   * which EM instance you call them on, via its own `TransactionContext`
   * async-local storage); `MaintenanceRepository.deletePluginUserData` is the
   * one that must thread `em.getTransactionContext()` into `connection
   * .execute(...)`'s `ctx` param — see its own docstring for why a bare
   * `execute()` call there deadlocked against the open transaction.
   *
   * UC2 (`plugins`) and UC3 (`plugin_user_erasure_queue`) — the erasure-
   * ENQUEUE half — narrow that ruling (Plan 4 Task 8a): this method's queue
   * writes were an independent re-implementation of the exact same
   * `SELECT id, permissions FROM plugins` + `hook:user-data` filter +
   * `INSERT OR IGNORE` that `PluginRuntimeService.enqueueUserErasure` (the
   * `emitUserDeleted` sink's post-commit half — every account-deletion call
   * site fires BOTH) already ran a second time for the very same user.
   * Converted onto `PluginsRepository`/`PluginUserErasureQueueRepository` so
   * both paths can share `enqueueHookUserDataErasures` (Plan 4 Task 8a) —
   * ONE implementation of the filter, not two silently drifting copies. The
   * orphan-directory scan below (a plugin uninstalled with its data
   * retained) has no equivalent on the `enqueueUserErasure` side and is kept
   * here, now via the same repository.
   */
  async erasePluginUserData(userId: number): Promise<void> {
    await new MaintenanceRepository(this.em).deletePluginUserData(userId); // UC1 — Plan 4 Task 4
    try {
      const rows = await this.pluginsRepo.listIdsAndPermissions(); // UC2 — Plan 4 Task 8a
      const installed = new Set(rows.map((r) => r.id));
      await enqueueHookUserDataErasures(this.pluginUserErasureQueueRepo, rows, userId); // UC3 — Plan 4 Task 8a
      // Also enqueue for plugins UNINSTALLED with their data retained (deleteData=false):
      // their data dir still holds the user's rows and a same-id reinstall would re-adopt
      // them. No permissions record survives uninstall, so we can't check hook:user-data —
      // enqueue for every orphan data dir; the row sits inert (no FK) and drains only if
      // that id is reinstalled + active (erasure delivery is a duty, not grant-gated).
      try {
        for (const entry of fs.readdirSync(pluginsDataRoot(), { withFileTypes: true })) {
          if (entry.isDirectory() && !installed.has(entry.name))
            await this.pluginUserErasureQueueRepo.insertIgnore(entry.name, userId);
        }
      } catch {
        /* no plugin data root yet */
      }
    } catch {
      /* plugins / queue table absent (slim schema) */
    }
  }

  /**
   * UC4–UC10: `trip_members` (`nest/trip-membership`, Plan 3c) and
   * `budget_items` (`nest/budget`, Plan 3e) are owned by domains outside
   * this file's own domain — UC4 was mis-filed as "Plan 3g's" by an earlier
   * ledger and stayed raw past that plan's close; it converts here (Plan 4
   * Task 1) onto `TripMembersRepository.clearInvitedBy` — UC5 is already
   * converted (`budgetItemsRepo.clearPaidByUser`). `share_tokens` (UC6) belongs to `nest/share`
   * (trip-level share links) and converts here (Plan 3h Task 6, R10) onto
   * `ShareTokensRepository.deleteByCreator` — **DISTINCT from
   * `ShareService`'s own `remove()`**, which deletes `WHERE trip_id = ?`, a
   * different predicate on the same table. `journey_share_tokens`/
   * `journeys`/`journey_entries`/`journey_contributors` (UC7-10,
   * `nest/journey-share`/`nest/journey-domain`, Plan 3g) were converted
   * earlier (Plan 3g Task 4) onto their owning repositories. Verbatim
   * otherwise: same statement order, same bounded 5-table
   * share_tokens/journey_share_tokens/journeys/journey_entries/
   * journey_contributors sequence, `this.budget.removeUserFromBudgetItems`
   * unchanged.
   */
  private async cleanupUserReferences(userId: number): Promise<void> {
    await this.tripMembersRepo.clearInvitedBy(userId); // UC4 — converted (Plan 4 Task 1)
    await this.budgetItemsRepo.clearPaidByUser(userId); // UC5 — Plan 3e Task 2, converted.
    await this.budget.removeUserFromBudgetItems(userId);
    await this.shareTokensRepo.deleteByCreator(userId); // UC6 — converted (Plan 3h Task 6)
    await this.journeyShareTokensRepo.deleteByCreatedBy(userId); // UC7 — converted (Plan 3g Task 4)
    // Owned journeys cascade-delete their entries/contributors/share_tokens/photos via journey_id FKs
    await this.journeysRepo.deleteOwnedByUser(userId); // UC8 — converted (Plan 3g Task 4)
    // Entries authored on other users' journeys (not covered by the cascade above)
    await this.journeyEntriesRepo.deleteByAuthorId(userId); // UC9 — converted (Plan 3g Task 4)
    await this.journeyContributorsRepo.deleteAllForUser(userId); // UC10 — converted (Plan 3g Task 4)
  }

  /**
   * UC11, the transaction's final statement — `UsersRepository.deleteById`
   * (Plan 3b Task 5; the one pre-authorised `UsersRepository` addition, per
   * `task-1-review.md`'s "contract gaps"). Everything above it (UC1–UC10)
   * stays raw, per each method's own docstring.
   */
  async deleteUserCompletely(userId: number): Promise<void> {
    await this.uow.transactional(async () => {
      await this.cleanupUserReferences(userId);
      await this.erasePluginUserData(userId);
      await this.usersRepo.deleteById(userId);
    });
  }
}
