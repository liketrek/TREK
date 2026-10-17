import { TodoCategoryAssignees } from '../../db/entities/TodoCategoryAssignees.entity';
import { TodoItems } from '../../db/entities/TodoItems.entity';
import { TripMembers } from '../../db/entities/TripMembers.entity';
import type { TodoCategoryAssigneesRepository } from '../../db/repositories/TodoCategoryAssignees.repository';
import type { TodoItemsRepository } from '../../db/repositories/TodoItems.repository';
import type { TripMembersRepository } from '../../db/repositories/TripMembers.repository';
import type { TripAccess } from '../../db/repositories/Trips.repository';
import type { User } from '../../types';
import { UnitOfWork } from '../database/unit-of-work';
import { PermissionsService } from '../permissions/permissions.service';
import { RealtimeService } from '../realtime/realtime.service';
import { TripAccessService } from '../trip-membership/trip-access.service';
import { InjectRepository } from '@mikro-orm/nestjs';
import { Injectable } from '@nestjs/common';
import type { TrekWsPayload, TrekWsTripEventName } from '@trek/shared';

type Trip = TripAccess;

/**
 * Todo domain service — owns the todo SQL, now through
 * `TodoItemsRepository`/`TodoCategoryAssigneesRepository` (Plan 3e Task 4,
 * moved 1:1 off the legacy raw statements: identical column sets, the `||`
 * falsy-coercion defaults, the bodyKeys sentinel protocol on update and the
 * post-write re-selects). Trip access, the 'packing_edit' permission
 * (shared with packing), the roster-filter on category assignees (Plan 4
 * Task 3: `TripMembersRepository.rosterUserIds`, injected directly, not
 * through `DatabaseService`) and the WebSocket broadcast keep their legacy
 * call paths.
 * Non-Nest consumers (plugin RPC host, the legacy MCP trips registrar) go
 * through todo.bridge.ts instead of importing this class directly.
 */
@Injectable()
export class TodoService {
  constructor(
    private readonly permissions: PermissionsService,
    private readonly realtime: RealtimeService,
    private readonly uow: UnitOfWork,
    @InjectRepository(TodoItems) private readonly todoItemsRepo: TodoItemsRepository,
    @InjectRepository(TodoCategoryAssignees)
    private readonly todoCategoryAssigneesRepo: TodoCategoryAssigneesRepository,
    // Plan 4 Task 2 — canAccessTrip's own DatabaseService delegation is
    // gone: this injects TripAccessService (trip-membership).
    private readonly tripsRepo: TripAccessService,
    // Plan 4 Task 3 — DatabaseService.rosterUserIds inlined onto
    // TripMembersRepository.rosterUserIds directly.
    @InjectRepository(TripMembers) private readonly tripMembersRepo: TripMembersRepository,
  ) {}

  async verifyTripAccess(tripId: string | number, userId: number) {
    return await this.tripsRepo.findAccessible(tripId, userId);
  }

  async canEdit(trip: Trip, user: User): Promise<boolean> {
    return this.permissions.checkPermission('packing_edit', user.role, trip.user_id, user.id, trip.user_id !== user.id);
  }

  broadcast<E extends TrekWsTripEventName>(
    tripId: string,
    event: E,
    payload: TrekWsPayload<E>,
    socketId: string | undefined,
  ): void {
    this.realtime.broadcast(tripId, event, payload, socketId);
  }

  async listItems(tripId: string | number) {
    return this.todoItemsRepo.listForTrip(tripId);
  }

  async createItem(
    tripId: string | number,
    data: {
      name: string;
      category?: string | null;
      due_date?: string | null;
      description?: string | null;
      assigned_user_id?: number | null;
      priority?: number;
    },
  ) {
    // The next position and the row that takes it in one transaction, so two items
    // added at once cannot both read the same MAX.
    const id = await this.uow.transactional(async () => {
      const maxOrder = await this.todoItemsRepo.maxSortOrder(tripId);
      return await this.todoItemsRepo.insertItem({
        trip_id: tripId,
        name: data.name,
        category: data.category || null,
        sort_order: (maxOrder ?? -1) + 1,
        due_date: data.due_date || null,
        description: data.description || null,
        assigned_user_id: data.assigned_user_id || null,
        priority: data.priority || 0,
      });
    });

    return this.todoItemsRepo.findById(id);
  }

  /**
   * `id: number` (Plan 4 Task 8b, U6 — program rule 21's gate-level id
   * parsing carry: `TodoController.update` now parses `:id` once via
   * `toRowId` and threads the number here, instead of the raw route string
   * reaching `TodoItemsRepository.findInTrip`/`.update` and relying on
   * SQLite's column-affinity CAST to match it; `todos.rpc.ts`'s `num()` and
   * `todo.mcp.ts`'s Zod-typed `itemId` were already real numbers). `tripId`
   * stays `string | number` — a separate, still-accepted carry (the trip id
   * is gated for ACCESS by `TripAccessGuard`, not threaded as a parsed
   * number to every downstream call — see `places.service.ts
   * #verifyTripAccess`'s own docstring, Plan 4's 23c292f2f, for why that
   * second parse is out of scope here too).
   */
  async updateItem(
    tripId: string | number,
    id: number,
    data: {
      name?: string;
      checked?: number;
      category?: string | null;
      due_date?: string | null;
      description?: string | null;
      assigned_user_id?: number | null;
      priority?: number | null;
    },
    bodyKeys: string[],
  ) {
    const item = await this.todoItemsRepo.findInTrip(id, tripId);
    if (!item) return null;

    await this.todoItemsRepo.update(id, {
      name: [!!data.name, data.name || ''],
      checked: [data.checked !== undefined, data.checked ? 1 : 0],
      category: [!!data.category, data.category || ''],
      due_date: [bodyKeys.includes('due_date'), data.due_date ?? null],
      description: [bodyKeys.includes('description'), data.description ?? null],
      assigned_user_id: [bodyKeys.includes('assigned_user_id'), data.assigned_user_id ?? null],
      priority: [bodyKeys.includes('priority'), data.priority ?? 0],
    });

    return this.todoItemsRepo.findById(id);
  }

  /** `id: number` — same Plan 4 Task 8b (U6) narrowing as {@link updateItem}. */
  async deleteItem(tripId: string | number, id: number): Promise<boolean> {
    const item = await this.todoItemsRepo.existsInTrip(id, tripId);
    if (!item) return false;

    await this.todoItemsRepo.deleteById(id);
    return true;
  }

  async reorderItems(tripId: string | number, orderedIds: number[]): Promise<void> {
    await this.uow.transactional(async () => {
      for (let index = 0; index < orderedIds.length; index++) {
        await this.todoItemsRepo.setSortOrder(orderedIds[index], tripId, index);
      }
    });
  }

  async getCategoryAssignees(tripId: string | number) {
    const rows = await this.todoCategoryAssigneesRepo.listForTrip(tripId);

    const assignees: Record<string, { user_id: number; username: string; avatar: string | null }[]> = {};
    for (const row of rows) {
      if (!assignees[row.category_name]) assignees[row.category_name] = [];
      assignees[row.category_name].push({ user_id: row.user_id, username: row.username, avatar: row.avatar });
    }

    return assignees;
  }

  async updateCategoryAssignees(tripId: string | number, categoryName: string, userIds: number[] | undefined) {
    await this.uow.transactional(async () => {
      await this.todoCategoryAssigneesRepo.deleteForCategory(tripId, categoryName);

      if (Array.isArray(userIds) && userIds.length > 0) {
        // Only people on this trip may be assigned, the way packing filters bag
        // members and reservations filter travellers. Dropped rather than
        // rejected: a copied trip carries assignee ids across before its members
        // exist, and a 400 would make the picker unusable there.
        const roster = await this.tripMembersRepo.rosterUserIds(tripId);
        for (const uid of userIds)
          if (roster.has(uid)) await this.todoCategoryAssigneesRepo.insertIgnore(tripId, categoryName, uid);
      }
    });

    return this.todoCategoryAssigneesRepo.listForCategory(tripId, categoryName);
  }
}
