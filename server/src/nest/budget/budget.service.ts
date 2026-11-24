import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@mikro-orm/nestjs';
import type { BudgetFallbackFx, BudgetParticipantFinal, BudgetUnconverted, TrekWsPayload, TrekWsTripEventName } from '@trek/shared';
import { costCategoryOf, storedCostCategory, exchangeRateSourceSchema, splitEqualShares, sumMinor, toMinor } from '@trek/shared';
import { RealtimeService } from '../realtime/realtime.service';
import { PermissionsService } from '../permissions/permissions.service';
import { avatarUrl } from '../common/avatarUrl';
import { byCodeUnit } from '../common/compare';
import { inOrder } from '../common/in-order';
import type { User, BudgetItem, BudgetItemMember, BudgetItemPayer, BudgetItemReceipt } from '../../types';
import { ExchangeRatesService, freezeRate, normalizeCurrency, type FrozenRate, type PreparedRate, type RateWrite } from './exchange-rates.service';
import { budgetRateColumns, type BudgetRateColumns } from '../../db/repositories/_shared/budget-rate';
import { UnitOfWork } from '../database/unit-of-work';
import { BudgetItems } from '../../db/entities/BudgetItems.entity';
import type { BudgetItemsRepository, BudgetItemRow } from '../../db/repositories/BudgetItems.repository';
import { BudgetItemMembers } from '../../db/entities/BudgetItemMembers.entity';
import type { BudgetItemMembersRepository } from '../../db/repositories/BudgetItemMembers.repository';
import { BudgetItemPayers } from '../../db/entities/BudgetItemPayers.entity';
import type { BudgetItemPayersRepository } from '../../db/repositories/BudgetItemPayers.repository';
import { BudgetSettlements } from '../../db/entities/BudgetSettlements.entity';
import type { BudgetSettlementsRepository } from '../../db/repositories/BudgetSettlements.repository';
import { BudgetCategoryOrder } from '../../db/entities/BudgetCategoryOrder.entity';
import type { BudgetCategoryOrderRepository } from '../../db/repositories/BudgetCategoryOrder.repository';
import { Reservations } from '../../db/entities/Reservations.entity';
import type { ReservationsRepository } from '../../db/repositories/Reservations.repository';
import { Places } from '../../db/entities/Places.entity';
import type { PlacesRepository } from '../../db/repositories/Places.repository';
import { Trips } from '../../db/entities/Trips.entity';
import type { TripsRepository, TripAccess } from '../../db/repositories/Trips.repository';
import { TripMembers } from '../../db/entities/TripMembers.entity';
import type { TripMembersRepository } from '../../db/repositories/TripMembers.repository';
import { BUDGET_ITEM_TICKET, RESERVATION_METADATA } from '../../db/json-columns';
import { decodeJson, decodeJsonResult, encodeJson } from '../../utils/json-column';
import { conflict, DomainError } from '../common/domain-error';
import { GUEST_HAS_PAYMENTS, shareAfterLeaving } from './budget-departure.helpers';
import { allocateShownUnits, customSplitCents, isFrozenRate, positiveRate, settlementFlows, settlementFx, type SettlementRates, summaryShareCents, sumMoney, tripConverter } from './budget-money.helpers';

type Trip = TripAccess;

/** A trip currency switch whose rates are already fetched, ready to write (#1543). */
export type CurrencyRebase = { previous: string; next: string; bridge: number | undefined };

type SettlementRow = BudgetRateColumns & {
  id: number; trip_id: number; from_user_id: number; to_user_id: number;
  amount: number; currency: string | null;
  created_at: string; settled_at: string | null; note?: string | null; created_by_user_id: number | null;
  from_username: string; from_avatar: string | null;
  to_username: string; to_avatar: string | null;
};

/** A settle-up note as stored (#2340): trimmed, and nothing at all when blank. */
function settlementNote(note: string | null | undefined): string | null {
  const trimmed = (note ?? '').trim();
  return trimmed ? trimmed : null;
}

/** How the costs UI used to smuggle an itemized receipt through the note field. */
const LEGACY_TICKET_PREFIX = 'TICKETJSON:';

/**
 * Keep a written note and an itemized receipt out of each other's way (#1658).
 *
 * The receipt has its own column since migration 186, but a client that predates
 * it still sends the blob as `note`. Such a payload says nothing about the note
 * the user typed, so the note is reported as untouched (`undefined`) rather than
 * overwritten — an old tab left open must not erase a note written elsewhere.
 *
 * `undefined` means "caller did not speak about this field"; `null` means "clear it".
 */
export function splitLegacyTicketNote(
  note: string | null | undefined,
  ticket: string | null | undefined,
): { note: string | null | undefined; ticket: string | null | undefined } {
  if (typeof note === 'string' && note.startsWith(LEGACY_TICKET_PREFIX)) {
    return { note: undefined, ticket: note.slice(LEGACY_TICKET_PREFIX.length) };
  }
  return { note, ticket };
}

/**
 * Budget domain service — owns the budget SQL (moved from the legacy
 * services/budgetService.ts: identical statements, the `||` falsy-coercion
 * defaults, the COALESCE / CASE WHEN sentinel conventions on update and the
 * post-write re-selects). Trip access, the 'budget_edit' permission and the
 * WebSocket broadcast keep their legacy call paths. (budget.bridge.ts, the
 * former non-Nest entry point, is deleted — its last consumer,
 * UserCleanupService, injects this class now.)
 *
 * Quirk fixes on top of the relocated legacy behavior: every multi-statement
 * write now runs in uow.transactional() ("transactions are not optional"),
 * linkBudgetItemToReservation passes reservation_id through the insert instead
 * of a redundant second UPDATE, settlement re-selects are targeted single-row
 * queries instead of a full listSettlements() scan, settlement usernames use
 * COALESCE(display_name, username) like every item query, and updateMembers no
 * longer double-applies avatarUrl.
 */
@Injectable()
export class BudgetService {
  constructor(
    private readonly permissions: PermissionsService,
    private readonly exchangeRates: ExchangeRatesService,
    private readonly realtime: RealtimeService,
    private readonly uow: UnitOfWork,
    @InjectRepository(BudgetItems) private readonly budgetItemsRepo: BudgetItemsRepository,
    @InjectRepository(BudgetItemMembers) private readonly budgetItemMembersRepo: BudgetItemMembersRepository,
    @InjectRepository(BudgetItemPayers) private readonly budgetItemPayersRepo: BudgetItemPayersRepository,
    @InjectRepository(BudgetSettlements) private readonly budgetSettlementsRepo: BudgetSettlementsRepository,
    @InjectRepository(BudgetCategoryOrder) private readonly budgetCategoryOrderRepo: BudgetCategoryOrderRepository,
    @InjectRepository(Reservations) private readonly reservationsRepo: ReservationsRepository,
    @InjectRepository(Places) private readonly placesRepo: PlacesRepository,
    @InjectRepository(Trips) private readonly tripsRepo: TripsRepository,
    // Plan 4 Task 3 — DatabaseService.rosterUserIds inlined onto
    // TripMembersRepository.rosterUserIds directly.
    @InjectRepository(TripMembers) private readonly tripMembersRepo: TripMembersRepository,
  ) {}

  async verifyTripAccess(tripId: string | number, userId: number) {
    // Plan 4 Task 2 — canAccessTrip's own DatabaseService delegation is
    // gone: this reuses the TripsRepository already injected for other
    // reads and calls findAccessible.
    return await this.tripsRepo.findAccessible(tripId, userId);
  }

  async canEdit(trip: Trip, user: User): Promise<boolean> {
    return this.permissions.checkPermission('budget_edit', user.role, trip.user_id, user.id, trip.user_id !== user.id);
  }

  broadcast<E extends TrekWsTripEventName>(tripId: string, event: E, payload: TrekWsPayload<E>, socketId: string | undefined): void {
    this.realtime.broadcast(tripId, event, payload, socketId);
  }

  /**
   * `BudgetItemRow` (the repository's DB-accurate row — `sort_order`/
   * `created_at` genuinely nullable, per the entity) to `BudgetItem` (the
   * domain type the API and every caller of this service expects —
   * `sort_order: number`, `created_at?: string`). A freshly-read row always
   * has both populated (`sort_order` defaults to 0, `created_at` to
   * `CURRENT_TIMESTAMP`), so this is a type-shape bridge, not a behavior
   * change — matching what the legacy `db.get<BudgetItem>(...)` generic
   * silently assumed.
   */
  private toBudgetItem(row: BudgetItemRow): BudgetItem {
    return {
      ...row,
      exchange_rate_source: exchangeRateSourceSchema.safeParse(row.exchange_rate_source).data ?? 'legacy',
      sort_order: row.sort_order ?? 0,
      created_at: row.created_at ?? undefined,
    };
  }

  // -------------------------------------------------------------------------
  // Helpers
  // -------------------------------------------------------------------------

  private async loadItemMembers(itemId: number | string) {
    const rows = await this.budgetItemMembersRepo.listForItem(itemId as number);
    return rows.map(m => ({ ...m, avatar_url: avatarUrl(m) }));
  }

  private async loadItemPayers(itemId: number | string) {
    const rows = await this.budgetItemPayersRepo.listForItem(itemId as number);
    return rows.map(p => ({ ...p, avatar_url: avatarUrl(p) }));
  }

  private async loadItemReceipts(itemId: number | string): Promise<BudgetItemReceipt[]> {
    const rows = await this.budgetItemsRepo.listReceipts(itemId);

    return rows.map(f => ({
      id: f.id,
      filename: f.filename,
      original_name: f.original_name,
      file_size: f.file_size,
      mime_type: f.mime_type,
      url: `/api/trips/${f.trip_id}/files/${f.id}/download`,
    }));
  }

  /**
   * Who may be a payer or a split member of an expense: everyone on the trip,
   * plus, for an existing expense, whoever already pays for it or shares it.
   * Used to be a plain existence check against `users`, which let any id on the
   * instance become a payer or a split member and come back out through the
   * read-back join with a name and an avatar attached. Off-roster ids still drop
   * silently, the way the packing and reservations assignee paths handle them.
   *
   * Someone removed from the trip keeps their rows on the expenses they were part
   * of, and the edit form sends those ids back. Filtering them out on that save
   * dropped their share and shrank total_price to what the rest had paid (#2604),
   * so ids already on this expense stay allowed, as payer or as member, and can
   * still be taken off it. A stranger who never was on it is refused as before.
   * Read before anything is replaced, inside the caller's transaction.
   */
  async allowedParticipantIds(tripId: string | number, itemId: number | null): Promise<Set<number>> {
    const allowed = new Set(await this.tripMembersRepo.rosterUserIds(tripId));
    if (itemId !== null) {
      for (const p of await this.budgetItemPayersRepo.listForItem(itemId)) allowed.add(p.user_id);
      for (const m of await this.budgetItemMembersRepo.listUserPaid(itemId)) allowed.add(m.user_id);
    }
    return allowed;
  }

  /**
   * Replace the payer rows of an item and keep total_price = sum of payer amounts.
   * A negative amount is a real payer — the recipient of a refund (#2176) — and
   * is stored as such; only a zero (or NaN) amount says nothing and is dropped.
   * `known` is {@link allowedParticipantIds}, read before the rows go.
   */
  private async writeItemPayers(itemId: number | string, known: ReadonlySet<number>, payers: { user_id: number; amount: number }[]) {
    await this.budgetItemPayersRepo.deleteForItem(itemId as number);
    const accepted: number[] = [];
    for (const p of payers) {
      if (!p.amount || !known.has(p.user_id)) continue;
      await this.budgetItemPayersRepo.insertIgnore({ budget_item_id: itemId as number, user_id: p.user_id, amount: p.amount });
      accepted.push(p.amount);
    }
    const total = sumMoney(accepted);
    await this.budgetItemsRepo.setTotalPrice(itemId, total);
    return total;
  }

  /**
   * Drop this item's receipt links, leaving the files themselves alone.
   *
   * The files are deliberately NOT trashed. `budget_edit` and `file_delete` are
   * separate, separately configurable permissions, and a receipt id is any file
   * on the trip, so trashing here would let anyone who may edit an expense
   * delete a document they may not delete, from three surfaces that never see a
   * file permission at all: the REST route, the MCP tool and the plugin RPC.
   * Cleaning up a file nobody references is what the Files trash is for.
   *
   * A row is only removed when the receipt link was all it carried. The same
   * row can also tie the file to a place or a booking, and those links have
   * nothing to do with the expense. A link whose file already sits in the trash
   * is left in place, so restoring that file brings it back attached.
   */
  private async unlinkReceipts(budgetItemId: number | string, keep: ReadonlySet<number> = new Set()) {
    const rows = await this.budgetItemsRepo.listReceiptLinks(budgetItemId);
    for (const row of rows) {
      if (keep.has(row.file_id)) continue;
      if (row.reservation_id || row.assignment_id || row.place_id) {
        await this.budgetItemsRepo.clearLinkBudgetRef(row.id);
      } else {
        await this.budgetItemsRepo.deleteLink(row.id);
      }
    }
  }

  // -------------------------------------------------------------------------
  // CRUD
  // -------------------------------------------------------------------------

  async listBudgetItems(tripId: string | number) {
    const items = (await this.budgetItemsRepo.listWithCategoryOrder(tripId)).map(r => this.toBudgetItem(r));

    const itemIds = items.map(i => i.id);
    const membersByItem: Record<number, (BudgetItemMember & { avatar_url: string | null })[]> = {};

    if (itemIds.length > 0) {
      const allMembers = await this.budgetItemMembersRepo.listForItems(itemIds);

      for (const m of allMembers) {
        if (!membersByItem[m.budget_item_id]) membersByItem[m.budget_item_id] = [];
        membersByItem[m.budget_item_id].push({
          user_id: m.user_id, paid: m.paid, username: m.username, avatar_url: avatarUrl(m), amount: m.amount,
        });
      }
    }

    const payersByItem: Record<number, (BudgetItemPayer & { avatar_url: string | null })[]> = {};
    if (itemIds.length > 0) {
      const allPayers = await this.budgetItemPayersRepo.listForItems(itemIds);

      for (const p of allPayers) {
        if (!payersByItem[p.budget_item_id]) payersByItem[p.budget_item_id] = [];
        payersByItem[p.budget_item_id].push({
          user_id: p.user_id, amount: p.amount, username: p.username, avatar_url: avatarUrl(p),
        });
      }
    }

    const receiptsByItem: Record<number, BudgetItemReceipt[]> = {};
    if (itemIds.length > 0) {
      const allReceipts = await this.budgetItemsRepo.listReceiptsForItems(itemIds);

      for (const r of allReceipts) {
        if (!receiptsByItem[r.budget_item_id]) receiptsByItem[r.budget_item_id] = [];
        receiptsByItem[r.budget_item_id].push({
          id: r.id,
          filename: r.filename,
          original_name: r.original_name,
          file_size: r.file_size,
          mime_type: r.mime_type,
          url: `/api/trips/${r.trip_id}/files/${r.id}/download`,
        });
      }
    }

    items.forEach(item => {
      item.members = membersByItem[item.id] || [];
      item.payers = payersByItem[item.id] || [];
      item.receipts = receiptsByItem[item.id] || [];
    });
    return items;
  }

  async prepareRate(tripId: string | number, data: RateWrite, userId?: number, existing?: { currency: string | null }) {
    return this.exchangeRates.prepareWrite(tripId, data, userId, existing);
  }

  private async rateForCommit(
    tripId: string | number,
    prepared: PreparedRate | undefined,
    existing?: { currency: string | null },
  ): Promise<FrozenRate | undefined> {
    if (!prepared) return undefined;
    await this.exchangeRates.requireCurrentBase(tripId, prepared.base);
    const prior = existing ? normalizeCurrency(existing.currency, prepared.base) : null;
    if (prior !== prepared.previousCurrency) throw conflict('Booked currency changed while resolving the exchange rate');
    return prepared.kind === 'freeze' ? prepared.rate : undefined;
  }

  private async tripCurrency(tripId: string | number): Promise<string> {
    return normalizeCurrency(await this.tripsRepo.getCurrency(tripId));
  }

  /**
   * Freeze a rate onto every expense and transfer in a foreign currency that never
   * froze one. Resolve the trip default, the server snapshot, then a caller fallback. A row that is frozen, in the trip
   * currency or without a currency is never touched, so a second call heals nothing.
   *
   * The write is a compare-and-set in one transaction: only rows that are still
   * unfrozen are updated, and nothing is written when the trip currency changed while
   * the rates were fetched (null, so the caller can say so). A healthy trip with
   * nothing pending returns before any fetch.
   */
  /** @txIndependent Provider snapshots are cached separately from trip writes. */
  async freezeMissingRates(
    tripId: string | number,
    fallback?: BudgetFallbackFx,
    userId?: number,
  ): Promise<{ items: BudgetItem[]; settlements: NonNullable<Awaited<ReturnType<BudgetService['getSettlement']>>>[]; unresolved: string[] } | null> {
    const tripCur = await this.tripCurrency(tripId);
    // The legacy statement was one UNION of both tables, ORDER BY cur.
    const pending = [...new Set([
      ...(await this.budgetItemsRepo.listUnfrozenForeignCurrencies(tripId, tripCur)),
      ...(await this.budgetSettlementsRepo.listUnfrozenForeignCurrencies(tripId, tripCur)),
    ])].sort(byCodeUnit);
    if (pending.length === 0) return { items: [], settlements: [], unresolved: [] };

    const resolved: [string, FrozenRate][] = [];
    const unresolved: string[] = [];
    for (const cur of pending) {
      const rate = await this.exchangeRates.resolveWriteRate(tripId, tripCur, cur, { fallback_fx: fallback }, userId);
      if (rate === null) unresolved.push(cur);
      else resolved.push([cur, rate]);
    }
    if (resolved.length === 0) return { items: [], settlements: [], unresolved };

    const written = await this.uow.transactional(async () => {
      if ((await this.tripCurrency(tripId)) !== tripCur) return null;
      const ids = { budget_items: [] as number[], budget_settlements: [] as number[] };
      for (const [cur, rate] of resolved) {
        ids.budget_items.push(...(await this.budgetItemsRepo.listUnfrozenIdsForCurrency(tripId, cur)));
        await this.budgetItemsRepo.freezeUnfrozenForCurrency(tripId, cur, rate);
      }
      for (const [cur, rate] of resolved) {
        ids.budget_settlements.push(...(await this.budgetSettlementsRepo.listUnfrozenIdsForCurrency(tripId, cur)));
        await this.budgetSettlementsRepo.freezeUnfrozenForCurrency(tripId, cur, rate);
      }
      return ids;
    });
    if (!written) return null;

    const items: BudgetItem[] = [];
    for (const id of written.budget_items.sort((a, b) => a - b)) {
      const item = await this.getBudgetItem(id, tripId);
      if (item !== null) items.push(item);
    }
    const settlements: NonNullable<Awaited<ReturnType<BudgetService['getSettlement']>>>[] = [];
    for (const id of written.budget_settlements.sort((a, b) => a - b)) {
      const settlement = await this.getSettlement(id, tripId);
      if (settlement !== null) settlements.push(settlement);
    }
    return { items, settlements, unresolved };
  }

  /** @txIndependent Provider snapshots are cached separately from trip writes. */
  async rebaseTripCurrency(tripId: string | number, newCurrency?: string | null): Promise<void> {
    const plan = await this.prepareCurrencyRebase(tripId, newCurrency);
    if (plan) await this.applyCurrencyRebase(tripId, plan);
  }

  async prepareCurrencyRebase(tripId: string | number, newCurrency?: string | null): Promise<CurrencyRebase | null> {
    const next = normalizeCurrency(newCurrency, '');
    if (!next) return null;
    const tripCurrency = await this.tripsRepo.getCurrency(tripId);
    if (tripCurrency === undefined) return null;
    const previous = normalizeCurrency(tripCurrency);
    if (previous === next) return null;
    const rates = await this.exchangeRates.getRates(next);
    return { previous, next, bridge: rates?.[previous] };
  }

  async applyCurrencyRebase(tripId: string | number, { previous, next, bridge }: CurrencyRebase): Promise<void> {
    await this.uow.transactional(async () => {
      await this.exchangeRates.requireCurrentBase(tripId, previous);
      const rebase = (row: BudgetRateColumns & { currency: string | null }) => {
        const currency = normalizeCurrency(row.currency, previous);
        if (currency === next) {
          return { currency, rate: freezeRate(1, 'identity', `identity:${next}`) };
        }
        const oldRate = currency === previous ? 1 : row.exchange_rate;
        if (currency !== previous && !isFrozenRate(oldRate, row.exchange_rate_source)) {
          return { currency, rate: { exchange_rate: 1, exchange_rate_source: 'legacy' } };
        }
        if (!positiveRate(bridge)) throw new DomainError(400, 'No bridge exchange rate is available for the trip currency change');
        const rebased = oldRate * bridge;
        if (!positiveRate(rebased)) throw new DomainError(400, 'Invalid exchange rate after trip currency change');
        const rate = budgetRateColumns(row);
        const version = row.exchange_rate_source_version ?? 'legacy';
        return {
          currency,
          rate: {
            ...rate,
            exchange_rate: rebased,
            exchange_rate_source: currency === previous || row.exchange_rate_source === 'identity' || row.exchange_rate_source === 'legacy'
              ? 'global' : row.exchange_rate_source,
            exchange_rate_source_version: `rebase:${previous}:${next}:${version}`,
            exchange_rate_effective_date: null,
            exchange_rate_set_at: new Date().toISOString(),
            exchange_rate_set_by_user_id: null,
          },
        };
      };
      await inOrder(await this.budgetItemsRepo.listAllForTrip(tripId), (row) => {
        const { currency, rate } = rebase(row);
        return this.budgetItemsRepo.setRebasedRate(row.id, currency, rate);
      });
      await inOrder(await this.budgetSettlementsRepo.listRawForTrip(tripId), (row) => {
        const { currency, rate } = rebase(row);
        return this.budgetSettlementsRepo.setRebasedRate(row.id, currency, rate);
      });
      await this.exchangeRates.rebaseTripRates(tripId, previous, next, bridge);
      await this.placesRepo.pinCurrencyForTrip(tripId, previous);
    });
  }

  async createBudgetItem(
    tripId: string | number,
    data: {
      category?: string; name: string; total_price?: number;
      currency?: string | null; exchange_rate?: number;
      payers?: { user_id: number; amount: number }[]; member_ids?: number[];
      members?: { user_id: number; amount?: number | null }[];
      persons?: number | null; days?: number | null; note?: string | null; expense_date?: string | null;
      ticket_json?: string | null;
      reservation_id?: number | null;
      place_id?: number | null;
      receipt_file_ids?: number[];
    },
    prepared?: PreparedRate,
  ) {
    return await this.uow.transactional(async () => {
      const rate = await this.rateForCommit(tripId, prepared);
      const maxOrder = await this.budgetItemsRepo.maxSortOrder(tripId);
      const sortOrder = (maxOrder !== null ? maxOrder : -1) + 1;

      const cat = storedCostCategory(data.category);

      // Ensure category has a sort_order entry
      const catExists = await this.budgetCategoryOrderRepo.exists(tripId, cat);
      if (!catExists) {
        const maxCatOrder = await this.budgetCategoryOrderRepo.maxSortOrder(tripId);
        const catOrder = (maxCatOrder !== null && maxCatOrder !== undefined ? maxCatOrder : -1) + 1;
        await this.budgetCategoryOrderRepo.insertIgnore(tripId, cat, catOrder);
      }

      // total_price is derived from explicit payers when given; otherwise the caller
      // value (planning entries, or a bill no one has paid yet). Negative payer
      // amounts (a refund's recipient, #2176) count like any other.
      const payerTotal = sumMoney((data.payers || []).filter(p => p.amount !== 0).map(p => p.amount));
      const total = data.payers && data.payers.length > 0 ? payerTotal : (data.total_price || 0);

      // A new expense has nobody on it yet, so only the trip's own people qualify.
      const known = data.payers || data.members || data.member_ids ? await this.allowedParticipantIds(tripId, null) : new Set<number>();
      const members = data.members ? data.members.filter(m => known.has(m.user_id)) : undefined;
      const memberIds = data.member_ids ? data.member_ids.filter(uid => known.has(uid)) : undefined;

      const { note, ticket } = splitLegacyTicketNote(data.note, data.ticket_json);

      const itemId = await this.budgetItemsRepo.insertItem({
        trip_id: tripId,
        category: cat,
        name: data.name,
        total_price: total,
        currency: normalizeCurrency(data.currency, '') || null,
        exchange_rate: data.exchange_rate ?? 1,
        ...rate,
        persons: memberIds ? memberIds.length : (data.persons != null ? data.persons : null),
        days: data.days !== undefined && data.days !== null ? data.days : null,
        note: note || null,
        ticket_json: ticket || null,
        sort_order: sortOrder,
        expense_date: data.expense_date || null,
        reservation_id: data.reservation_id != null ? data.reservation_id : null,
        place_id: data.place_id != null ? data.place_id : null,
      });

      if (data.payers && data.payers.length > 0) await this.writeItemPayers(itemId, known, data.payers);
      if (members && members.length > 0) {
        for (const m of members) {
          await this.budgetItemMembersRepo.insertIgnore({ budget_item_id: itemId, user_id: m.user_id, paid: 0, amount: m.amount !== undefined && m.amount !== null ? m.amount : null });
        }
      } else if (memberIds && memberIds.length > 0) {
        for (const uid of memberIds) {
          await this.budgetItemMembersRepo.insertIgnore({ budget_item_id: itemId, user_id: uid, paid: 0, amount: null });
        }
      }

      if (data.receipt_file_ids && data.receipt_file_ids.length > 0) {
        for (const fid of data.receipt_file_ids) {
          // Verify file belongs to this trip
          const belongs = await this.budgetItemsRepo.findTripFile(fid, tripId);
          if (belongs) {
            await this.budgetItemsRepo.insertReceiptLink(fid, itemId);
          }
        }
      }

      const item = this.toBudgetItem((await this.budgetItemsRepo.findById(itemId))!);
      item.members = await this.loadItemMembers(itemId);
      item.payers = await this.loadItemPayers(itemId);
      item.receipts = await this.loadItemReceipts(itemId);
      return item;
    });
  }

  /**
   * Fetch a single budget item hydrated with its members, payers, and
   * receipts, scoped to the trip. `id: number` — Plan 4 Task 8b (U6): every
   * caller is `budget.mcp.ts`'s Zod-typed `itemId`/`created.id`, already a
   * real row id (this route has no REST `GET /:id` counterpart).
   */
  async getBudgetItem(id: number, tripId: string | number): Promise<BudgetItem | null> {
    const row = await this.budgetItemsRepo.findInTrip(id, tripId);
    if (!row) return null;
    const item = this.toBudgetItem(row);
    item.members = await this.loadItemMembers(id);
    item.payers = await this.loadItemPayers(id);
    item.receipts = await this.loadItemReceipts(id);
    return item;
  }

  async linkBudgetItemToReservation(
    tripId: string | number,
    reservationId: number,
    data: { name: string; category?: string; total_price: number; currency?: string | null; exchange_rate?: number; expense_date?: string | null },
    prepared?: PreparedRate,
  ) {
    // createBudgetItem accepts reservation_id directly — the legacy separate
    // UPDATE after the insert was redundant (and non-atomic).
    return await this.createBudgetItem(tripId, { ...data, reservation_id: reservationId }, prepared);
  }

  /**
   * `id: number` (Plan 4 Task 8b, U6 — the program's gate-level id parsing
   * carry: `BudgetController.update` now parses `:id` once via `toRowId`
   * and threads the number down through `update` to here; the other
   * caller, `reservations.service.ts`, already passed a real row id).
   */
  async updateBudgetItem(
    id: number,
    tripId: string | number,
    data: {
      category?: string; name?: string; total_price?: number;
      currency?: string | null; exchange_rate?: number;
      payers?: { user_id: number; amount: number }[]; member_ids?: number[];
      members?: { user_id: number; amount?: number | null }[];
      persons?: number | null; days?: number | null; note?: string | null; sort_order?: number; expense_date?: string | null;
      ticket_json?: string | null;
      receipt_file_ids?: number[];
      reservation_id?: number | null;
      place_id?: number | null;
    },
    prepared?: PreparedRate,
  ) {
    return await this.uow.transactional(async () => {
      const item = await this.budgetItemsRepo.findInTrip(id, tripId);
      if (!item) return null;
      const rate = await this.rateForCommit(tripId, prepared, item);

      // Who may stay on or join this expense, and the paid ticks of its split, are
      // read before the payer and member rows below are replaced.
      const splitTouched = data.payers !== undefined || data.members !== undefined || data.member_ids !== undefined;
      const known = splitTouched ? await this.allowedParticipantIds(tripId, id) : new Set<number>();
      const existingPaid = new Map<number, number>();
      if (data.members !== undefined || data.member_ids !== undefined) {
        for (const e of await this.budgetItemMembersRepo.listUserPaid(id)) existingPaid.set(e.user_id, e.paid);
      }

      // An old client sending a receipt in `note` still lands in ticket_json, and
      // its note is left untouched rather than clobbered with the receipt blob.
      const { note, ticket } = splitLegacyTicketNote(data.note, data.ticket_json);
      const noteTouched = data.note !== undefined && note !== undefined;
      const ticketTouched = data.ticket_json !== undefined || ticket !== undefined;

      // R11's presence-sentinel helper (`BudgetItemsRepository.update`,
      // `presenceSet`) — `category`/`name` pass `present = !!value`
      // (the legacy `COALESCE(?, col)` truthy-wins shape), everything else
      // passes `present = <field> !== undefined` (a true presence sentinel).
      await this.budgetItemsRepo.update(id, {
        category: [!!data.category, data.category ? storedCostCategory(data.category) : ''],
        name: [!!data.name, data.name || ''],
        total_price: [data.total_price !== undefined, data.total_price !== undefined ? data.total_price : 0],
        currency: [data.currency !== undefined, normalizeCurrency(data.currency, '') || null],
        exchange_rate: [data.exchange_rate !== undefined, data.exchange_rate !== undefined ? data.exchange_rate : 1],
        persons: [data.persons !== undefined, data.persons !== undefined ? data.persons : null],
        days: [data.days !== undefined, data.days !== undefined ? data.days : null],
        note: [noteTouched, noteTouched ? (note as string | null) : null],
        ticket_json: [ticketTouched, ticketTouched ? (ticket as string | null) : null],
        sort_order: [data.sort_order !== undefined, data.sort_order !== undefined ? data.sort_order : 0],
        expense_date: [data.expense_date !== undefined, data.expense_date !== undefined ? (data.expense_date || null) : null],
        reservation_id: [data.reservation_id !== undefined, data.reservation_id ?? null],
        place_id: [data.place_id !== undefined, data.place_id ?? null],
      }, rate);

      // Optional inline payer/member replacement (the edit modal saves all at once).
      if (data.payers !== undefined) {
        await this.writeItemPayers(id, known, data.payers);
        // writeItemPayers derives total_price from the payer sum (0 for no payers).
        // A "recorded total, nobody assigned" expense clears payers but still carries
        // an explicit total_price — re-apply it so it isn't clobbered to 0.
        if (data.payers.length === 0 && data.total_price !== undefined) {
          await this.budgetItemsRepo.setTotalPrice(id, data.total_price);
        }
      }
      // The paid ticks carry over, as they do through updateMembers: the edit form
      // saves the whole split every time, and it used to clear every tick with it.
      if (data.members !== undefined) {
        const members = data.members.filter(m => known.has(m.user_id));
        await this.budgetItemMembersRepo.deleteForItem(id);
        for (const m of members) {
          await this.budgetItemMembersRepo.insertIgnore({ budget_item_id: id, user_id: m.user_id, paid: existingPaid.get(m.user_id) || 0, amount: m.amount !== undefined && m.amount !== null ? m.amount : null });
        }
        await this.budgetItemsRepo.setPersons(id, members.length || null);
      } else if (data.member_ids !== undefined) {
        const memberIds = data.member_ids.filter(uid => known.has(uid));
        await this.budgetItemMembersRepo.deleteForItem(id);
        for (const uid of memberIds) {
          await this.budgetItemMembersRepo.insertIgnore({ budget_item_id: id, user_id: uid, paid: existingPaid.get(uid) || 0, amount: null });
        }
        await this.budgetItemsRepo.setPersons(id, memberIds.length || null);
      }

      // If category changed, update category order table
      if (data.category) {
        const catExists = await this.budgetCategoryOrderRepo.exists(tripId, storedCostCategory(data.category));
        if (!catExists) {
          const maxCatOrder = await this.budgetCategoryOrderRepo.maxSortOrder(tripId);
          const catOrder = (maxCatOrder !== null && maxCatOrder !== undefined ? maxCatOrder : -1) + 1;
          await this.budgetCategoryOrderRepo.insertIgnore(tripId, storedCostCategory(data.category), catOrder);
        }
      }

      if (data.receipt_file_ids !== undefined) {
        // The ids that survive are left linked rather than dropped and re-added,
        // so a receipt the request keeps never loses its row for an instant.
        // Deduplicated: the same id twice would make the second pass adopt a
        // second spare row into the pair the first one just wrote.
        const wanted = [...new Set(data.receipt_file_ids.map(Number))];
        const keep = new Set(wanted);
        await this.unlinkReceipts(id, keep);
        if (wanted.length > 0) {
          for (const fid of wanted) {
            const belongs = await this.budgetItemsRepo.findTripFile(fid, tripId);
            if (!belongs) continue;
            // Already this item's receipt: nothing to do. A file can carry several
            // link rows (one per place, one per booking), so on a second save of
            // the same expense the row kept from last time is skipped by
            // unlinkReceipts and the next spare would be adopted into a duplicate
            // (file, item) pair, which the unique index refuses. That threw inside
            // the transaction and rolled the whole expense edit back, every time.
            const already = await this.budgetItemsRepo.linkAlreadyExists(fid, id);
            if (already) continue;
            // A file already tied to a place or a booking gets the receipt link
            // written onto that row, because the unique index is per file and
            // item and a second row for the same pair would be refused anyway.
            const spare = await this.budgetItemsRepo.findSpareLink(fid);
            if (spare) await this.budgetItemsRepo.adoptSpareLink(spare.id, id);
            else await this.budgetItemsRepo.insertReceiptLink(fid, id);
          }
        }
      }

      const updated = this.toBudgetItem((await this.budgetItemsRepo.findById(id))!);
      updated.members = await this.loadItemMembers(id);
      updated.payers = await this.loadItemPayers(id);
      updated.receipts = await this.loadItemReceipts(id);
      return updated;
    });
  }

  // -------------------------------------------------------------------------
  // Payers
  // -------------------------------------------------------------------------

  /** `id: number` — same Plan 4 Task 8b (U6) gate-level narrowing as {@link updateBudgetItem} (`BudgetController.setPayers` parses `:id` via `toRowId`). */
  async setItemPayers(id: number, tripId: string | number, payers: { user_id: number; amount: number }[]) {
    return await this.uow.transactional(async () => {
      const item = await this.budgetItemsRepo.existsInTrip(id, tripId);
      if (!item) return null;
      await this.writeItemPayers(id, await this.allowedParticipantIds(tripId, id), payers);
      const updated = this.toBudgetItem((await this.budgetItemsRepo.findById(id))!);
      updated.members = await this.loadItemMembers(id);
      updated.payers = await this.loadItemPayers(id);
      return updated;
    });
  }

  /** `id: number` — same Plan 4 Task 8b (U6) gate-level narrowing as {@link updateBudgetItem} (`BudgetController.remove` parses `:id` via `toRowId`; `reservations.service.ts` already passed a real row id). */
  async deleteBudgetItem(id: number, tripId: string | number): Promise<boolean> {
    const item = await this.budgetItemsRepo.findForDelete(id, tripId);
    if (!item) return false;
    return await this.uow.transactional(async () => {
      // Find all receipts attached to this item before deleting it
      // The receipts stay; only their tie to this expense goes. Rows that
      // carry nothing else are removed, rows that also point at a place or a
      // booking keep those. A link on a file already in the trash is left for
      // the SET NULL on the foreign key, so restoring the file does not bring
      // back a pointer to an expense that no longer exists.
      await this.unlinkReceipts(id);
      await this.budgetItemsRepo.deleteById(id);

      // The booking keeps a copy of its expenses' total in its metadata, and
      // the reservation update path preserves that copy across edits. With this
      // expense gone the copy is worked out again from what is still linked, and
      // dropped when nothing is, rather than leave a price on the card that no
      // longer has anything behind it.
      if (item.reservation_id) await this.resyncReservationPrice(tripId, item.reservation_id);
      return true;
    });
  }

  /**
   * After an update, the bookings whose mirrored price may have moved: the one
   * the expense is linked to when its total changed, and on a re-link both the
   * booking it left and the one it joined.
   */
  async resyncLinkedPrices(
    tripId: string | number,
    previousReservationId: number | null | undefined,
    updated: { reservation_id?: number | null },
    data: { total_price?: number; reservation_id?: number | null },
    socketId?: string,
  ): Promise<void> {
    const affected = new Set<number>();
    if (data.reservation_id !== undefined && previousReservationId) affected.add(previousReservationId);
    // Not only a new total: the currency and the payers (which derive the total)
    // move the booking's price as well, so any edit of a linked expense resyncs.
    if (updated.reservation_id) affected.add(updated.reservation_id);
    for (const reservationId of affected) await this.resyncReservationPrice(tripId, reservationId, socketId);
  }

  /**
   * Why a link from an expense can't be made, or null when it can: a booking or
   * a place it points at has to exist on the same trip (#2084). REST and MCP
   * both ask this before they write, so neither can reach into another trip.
   */
  async linkRefusal(tripId: string | number, data: { reservation_id?: number | null; place_id?: number | null }): Promise<string | null> {
    if (data.reservation_id != null && (await this.reservationsRepo.findTripId(data.reservation_id)) !== Number(tripId)) {
      return 'reservation_id does not belong to this trip.';
    }
    if (data.place_id != null && (await this.placesRepo.findTripId(data.place_id)) !== Number(tripId)) {
      return 'place_id does not belong to this trip.';
    }
    return null;
  }

  /**
   * Works the booking's mirrored price out again from every expense linked to
   * it (#2084): their sum while they share one currency, the first one's total
   * when they don't (a sum across currencies would be meaningless), and no
   * price at all once none is linked. One expense gives exactly the old mirror.
   * @txStandalone a non-fatal mirror onto the booking, worked out again on every change.
   */
  async resyncReservationPrice(tripId: string | number, reservationId: number, socketId?: string): Promise<void> {
    const linked = await this.budgetItemsRepo.listLinkedToReservation(tripId, reservationId);
    if (linked.length === 0) {
      await this.clearReservationPrice(tripId, reservationId);
      return;
    }
    // No currency means the trip's, and a code is a code whatever its case, so
    // an expense in EUR and one without a currency on a EUR trip do add up.
    const tripCurrency = ((await this.tripsRepo.getCurrency(tripId)) || '').toUpperCase();
    const codeOf = (currency: string | null) => (currency || tripCurrency).toUpperCase();
    const oneCurrency = new Set(linked.map(row => codeOf(row.currency))).size === 1;
    const total = oneCurrency ? sumMoney(linked.map(row => row.total_price || 0)) : (linked[0].total_price || 0);
    // Either way the figure is in the first expense's currency; none means the trip's.
    const allInTripCurrency = oneCurrency && linked.every(row => !row.currency);
    await this.syncReservationPrice(String(tripId), reservationId, total, socketId, allInTripCurrency ? null : codeOf(linked[0].currency) || null);
  }

  /** The counterpart to syncReservationPrice: take the mirrored total back off the booking. Non-fatal, like the writer. */
  private async clearReservationPrice(tripId: string | number, reservationId: number): Promise<void> {
    try {
      const reservation = await this.reservationsRepo.getIdAndMetadata(reservationId, tripId);
      if (!reservation?.metadata) return;
      const meta = decodeJson(RESERVATION_METADATA, reservation.metadata, `reservation ${reservation.id}`);
      if (meta.price === undefined) return;
      delete meta.price;
      delete meta.priceCurrency;
      await this.reservationsRepo.setMetadata(reservation.id, encodeJson(RESERVATION_METADATA, meta));
      const updatedRes = await this.reservationsRepo.getFull(reservation.id);
      this.realtime.broadcast(String(tripId), 'reservation:updated', { reservation: updatedRes }, undefined);
    } catch (err) {
      console.error('[budget] Failed to clear the mirrored price from the reservation:', err);
    }
  }

  // -------------------------------------------------------------------------
  // Members
  // -------------------------------------------------------------------------

  /** `id: number` — same Plan 4 Task 8b (U6) gate-level narrowing as {@link updateBudgetItem} (`BudgetController.updateMembers` parses `:id` via `toRowId`). */
  async updateMembers(id: number, tripId: string | number, userIds: number[]) {
    return await this.uow.transactional(async () => {
      const item = await this.budgetItemsRepo.findInTrip(id, tripId);
      if (!item) return null;

      const existingPaid: Record<number, number> = {};
      const existing = await this.budgetItemMembersRepo.listUserPaid(id);
      for (const e of existing) existingPaid[e.user_id] = e.paid;
      const known = await this.allowedParticipantIds(tripId, id);

      await this.budgetItemMembersRepo.deleteForItem(id);

      const memberIds = userIds.filter(uid => known.has(uid));
      if (memberIds.length > 0) {
        for (const userId of memberIds) {
          await this.budgetItemMembersRepo.insertIgnore({ budget_item_id: id, user_id: userId, paid: existingPaid[userId] || 0 });
        }
        await this.budgetItemsRepo.setPersons(id, memberIds.length);
      } else {
        await this.budgetItemsRepo.setPersons(id, null);
      }

      // loadItemMembers already applies avatar_url — the legacy second .map was redundant.
      const members = await this.loadItemMembers(id);
      const updated = this.toBudgetItem((await this.budgetItemsRepo.findById(id))!);
      return { members, item: updated };
    });
  }

  /**
   * Clears a guest's traces before the users row goes, refusing while money they moved is
   * on the books: the cascade would take their payer rows and recorded payments with it (#2604).
   */
  async releaseGuest(userId: number): Promise<void> {
    await this.uow.transactional(async () => {
      const paid = await this.budgetItemPayersRepo.countNonZeroForUser(userId);
      if (paid + (await this.budgetSettlementsRepo.countForUser(userId)) > 0) {
        throw new DomainError(409, GUEST_HAS_PAYMENTS, { code: 'guest_has_payments' });
      }
      await this.budgetItemsRepo.clearPaidByUser(userId);
      await this.budgetSettlementsRepo.clearCreatedBy(userId);
      await this.removeUserFromBudgetItems(userId);
    });
  }

  async removeUserFromBudgetItems(userId: number): Promise<void> {
    await this.uow.transactional(async () => {
      const itemIds = await this.budgetItemMembersRepo.listItemIdsForUser(userId);
      await Promise.all(itemIds.map(itemId => this.handOnShare(itemId, userId)));
      await this.budgetItemMembersRepo.deleteForUser(userId);

      for (const itemId of itemIds) {
        const count = await this.budgetItemMembersRepo.countForItem(itemId);
        await this.budgetItemsRepo.setPersons(itemId, count || null);
      }
    });
  }

  /** Hands a departing member's custom or receipt share to the rest of the split, see {@link shareAfterLeaving}. */
  private async handOnShare(itemId: number, userId: number): Promise<void> {
    const item = await this.budgetItemsRepo.findById(itemId);
    if (!item) return;
    const ticket = decodeJsonResult(BUDGET_ITEM_TICKET, item.ticket_json);
    const currency = item.currency || (await this.tripsRepo.getCurrency(item.trip_id)) || 'EUR';
    const members = await this.budgetItemMembersRepo.listForItem(itemId);
    const next = shareAfterLeaving(itemId, members, userId, currency, ticket.ok ? ticket.value : null);
    if (next.ticket) await this.budgetItemsRepo.setTicketJson(itemId, encodeJson(BUDGET_ITEM_TICKET, next.ticket));
    const amounts = Object.entries(next.amounts ?? {});
    await Promise.all(amounts.map(([id, amount]) => this.budgetItemMembersRepo.setAmount(itemId, Number(id), amount)));
  }

  /**
   * R2-class fix (same as `FilesService`'s — flagged, mutation-tested): the
   * legacy trip-scoping guard (BG68) and the write (BG69) were two separate
   * statements with no `uow.transactional`, the one write in this file that
   * didn't follow its own "transactions are not optional" convention (§17
   * surprise 4). Wrapped here so a forced mid-transaction failure leaves no
   * partial update.
   */
  /** `id`/`userId`: number — same Plan 4 Task 8b (U6) gate-level narrowing as {@link updateBudgetItem} (`BudgetController.toggleMemberPaid` parses both via `toRowId`). */
  async toggleMemberPaid(id: number, tripId: string | number, userId: number, paid: boolean) {
    return await this.uow.transactional(async () => {
      // Resolve the item within the caller's trip before updating.
      const item = await this.budgetItemsRepo.existsInTrip(id, tripId);
      if (!item) return null;

      await this.budgetItemMembersRepo.setPaid(id, userId, paid ? 1 : 0);

      const member = await this.budgetItemMembersRepo.findMemberWithUser(id, userId);

      return member ? { ...member, avatar_url: avatarUrl(member) } : null;
    });
  }

  // -------------------------------------------------------------------------
  // Per-person summary
  // -------------------------------------------------------------------------

  /**
   * What each member is down for across the trip (`total_assigned`), and how much of
   * that is marked paid (`total_paid`), in the trip currency.
   *
   * Each share is converted to trip cents the way the settlement converts it, at the
   * rate frozen when the expense was entered, and an equal split is a largest-remainder
   * split of those cents (#2525). The SQL this replaces summed raw amounts across
   * currencies and divided them in floats, so a bill of 801.76 USD counted as 801.76 of
   * the trip's euros and a third of 100 came out as 33.333…
   */
  async getPerPersonSummary(tripId: string | number) {
    const tripCurrency = await this.tripCurrency(tripId);
    const items = await this.budgetItemsRepo.listMoneyRows(tripId);
    const members = await this.budgetItemMembersRepo.listForTripWithUsersAndPaid(tripId);
    const people = new Map<number, { user_id: number; username: string; avatar: string | null; assigned: number; paid: number; items_count: number }>();
    for (const item of items) {
      const own = members.filter(m => m.budget_item_id === item.id);
      if (own.length === 0) continue;
      // A foreign row nothing can convert counts for nobody, as in the settlement.
      const convert = tripConverter(item.currency, item.exchange_rate, tripCurrency, item.exchange_rate_source);
      if (!convert) continue;
      const shares = summaryShareCents(own, convert, item.total_price || 0, item.id);
      for (const m of own) {
        const share = shares[m.user_id] || 0;
        let p = people.get(m.user_id);
        if (!p) {
          p = { user_id: m.user_id, username: m.username, avatar: m.avatar, assigned: 0, paid: 0, items_count: 0 };
          people.set(m.user_id, p);
        }
        p.assigned += share;
        if (m.paid === 1) p.paid += share;
        p.items_count += 1;
      }
    }

    return [...people.values()]
      .sort((a, b) => a.user_id - b.user_id)
      .map(p => ({
        user_id: p.user_id, username: p.username, avatar: p.avatar,
        total_assigned: p.assigned / 100, total_paid: p.paid / 100, items_count: p.items_count,
        currency: tripCurrency,
        avatar_url: avatarUrl(p),
      }));
  }

  /**
   * What the trip's expenses add up to in the trip currency, overall and per category
   * (#2525). Every row is converted once, the way the settlement converts it, and
   * rounded to a whole cent before anything is added. Summing total_price as stored adds
   * dollars to euros and labels the result with the trip currency. A foreign row nothing
   * can convert is left out and its id listed under `unconverted`.
   */
  async tripTotals(tripId: string | number, tripCurrency: string): Promise<{ total: number; byCategory: Record<string, number>; unconverted: number[] }> {
    const trip = (tripCurrency || 'EUR').toUpperCase();
    const rows = await this.budgetItemsRepo.listMoneyRows(tripId);
    let total = 0;
    const byCategory: Record<string, number> = {};
    const unconverted: number[] = [];
    for (const r of rows) {
      const convert = tripConverter(r.currency, r.exchange_rate, trip, r.exchange_rate_source);
      if (!convert) {
        unconverted.push(r.id);
        continue;
      }
      const cents = toMinor(convert(r.total_price || 0));
      total += cents;
      const cat = costCategoryOf(r.category) ?? (r.category || '');
      byCategory[cat] = (byCategory[cat] || 0) + cents;
    }
    return {
      total: total / 100,
      byCategory: Object.fromEntries(Object.entries(byCategory).map(([cat, cents]) => [cat, cents / 100])),
      unconverted,
    };
  }

  /**
   * Who owes whom (`balances` + the simplified `flows`), the recorded transfers
   * (`settlements`), and what the trip ends up costing each participant
   * (`finalBudgets`).
   *
   * The final budget is the same ledger read from the other end. The balances
   * answer "who still has to pay whom"; `finalBudgets` answers "what did the trip
   * cost me", which no other figure on the Costs screen gives: a participant's
   * gross outlay minus the reimbursements already recorded minus the ones still
   * to come. It is derived from the same integer cents rather than recomputed, so
   * a breakdown can never contradict the balance printed next to it. The rows
   * behind each figure (`sources`) travel with it, in the same display cents: an
   * expense list converted again on the client with today's rate would not add up
   * to a figure that was booked at the rate frozen on entry.
   *
   * A row with no usable quote is listed under `unconverted` and moves no balance.
   * `currency` says what the amounts are in: the display currency when there is a
   * quote for it (the rates, else `baseRate`, the caller's own units of display
   * currency per 1 trip currency), otherwise the trip currency.
   */
  async calculateSettlement(
    tripId: string | number,
    opts: SettlementRates = {},
  ) {
    const items = (await this.budgetItemsRepo.listAllForTrip(tripId)).map(r => this.toBudgetItem(r));
    const settlements = await this.listSettlements(tripId);
    const requested = normalizeCurrency(opts.base, normalizeCurrency(opts.tripCurrency));
    const hasSelectedRows = [...items, ...settlements].some((row) => row.currency?.toUpperCase() === requested);
    const { currency, trip, bridge, displayUnit, tripUnit, convertRow } = settlementFx(opts, hasSelectedRows);
    const unconvertedItems: number[] = [];
    const unconvertedSettlements: number[] = [];
    const unconvertedCurrencies = new Set<string>();
    const allMembers = await this.budgetItemMembersRepo.listForTripWithUsers(tripId);
    const allPayers = await this.budgetItemPayersRepo.listForTripWithUsers(tripId);

    type Balance = {
      user_id: number;
      username: string;
      avatar_url: string | null;
      cents: number;
      tripCents: number;
    };
    const balances: Record<number, Balance> = {};
    const ensure = (id: number, username?: string, avatar_url?: string | null) =>
      (balances[id] ??= { user_id: id, username: username || '', avatar_url: avatar_url ?? null, cents: 0, tripCents: 0 });
    const frontedCents: Record<number, number> = {};
    const reimbursedCents: Record<number, number> = {};
    const frontedRows: Record<number, { item_id: number; cents: number }[]> = {};
    const movedRows: Record<number, { settlement_id: number; from_user_id: number; to_user_id: number; cents: number }[]> = {};

    for (const item of items) {
      const { toTrip, toDisplay } = convertRow(item.currency, item.exchange_rate, item.exchange_rate_source);
      if (!toDisplay) {
        unconvertedItems.push(item.id);
        unconvertedCurrencies.add((item.currency || '').toUpperCase());
      }
      const members = allMembers.filter(m => m.budget_item_id === item.id);
      const payers = allPayers.filter(p => p.budget_item_id === item.id);
      if (!members.length || !payers.some(p => p.amount !== 0)) continue;

      // Allocate the credited total in whole steps so a rounded split can be paid exactly.
      const custom = members.some(m => m.amount != null);
      const paidMinor = sumMinor(payers.map(p => p.amount));
      const applyExpense = (convert: (amount: number) => number, field: 'cents' | 'tripCents') => {
        let credit = 0;
        for (const p of payers) {
          const paid = toMinor(convert(p.amount));
          ensure(p.user_id, p.username, avatarUrl(p))[field] += paid;
          credit += paid;
          if (field === 'cents' && paid !== 0) {
            frontedCents[p.user_id] = (frontedCents[p.user_id] || 0) + paid;
            (frontedRows[p.user_id] ??= []).push({ item_id: item.id, cents: paid });
          }
        }
        const shares = custom
          ? customSplitCents(members, convert, credit, paidMinor)
          : splitEqualShares(credit, members, item.id);
        for (const m of members) ensure(m.user_id, m.username, avatarUrl(m))[field] -= shares[m.user_id] || 0;
      };
      if (toDisplay) applyExpense(toDisplay, 'cents');
      if (currency !== trip && toTrip) {
        applyExpense(toTrip, 'tripCents');
      }
    }

    for (const s of settlements) {
      const { toTrip, toDisplay } = convertRow(s.currency, s.exchange_rate, s.exchange_rate_source, true);
      if (!toDisplay) {
        unconvertedSettlements.push(s.id);
        unconvertedCurrencies.add((s.currency || '').toUpperCase());
      }
      if (!toDisplay && !toTrip) continue;
      const from = ensure(s.from_user_id, s.from_username, s.from_avatar_url);
      const to = ensure(s.to_user_id, s.to_username, s.to_avatar_url);
      const tripPayment = toTrip ? toMinor(toTrip(s.amount)) : 0;
      const shown = toDisplay ? toMinor(toDisplay(s.amount)) : 0;
      // A recorded payment that already squared a pair at its saved quote stays
      // closed after current defaults change. The reimbursement still shows what
      // they actually paid.
      const closesPair = s.currency === currency && currency !== trip
        && tripPayment > 0 && from.tripCents === -tripPayment && to.tripCents === tripPayment
        && from.cents < 0 && from.cents === -to.cents;
      from.tripCents += tripPayment;
      to.tripCents -= tripPayment;
      if (!toDisplay) continue;
      const booked = closesPair ? -from.cents : shown;
      from.cents += booked;
      to.cents -= booked;
      reimbursedCents[s.to_user_id] = (reimbursedCents[s.to_user_id] || 0) + shown;
      reimbursedCents[s.from_user_id] = (reimbursedCents[s.from_user_id] || 0) - shown;
      const moved = { settlement_id: s.id, from_user_id: s.from_user_id, to_user_id: s.to_user_id };
      (movedRows[s.to_user_id] ??= []).push({ ...moved, cents: shown });
      (movedRows[s.from_user_id] ??= []).push({ ...moved, cents: -shown });
    }

    const ledger = Object.values(balances);
    const shownBalances = allocateShownUnits(ledger.map((b) => b.cents), displayUnit);
    const shownExpenses = allocateShownUnits(ledger.map((b) => frontedCents[b.user_id] || 0), displayUnit);
    const shownReimbursements = allocateShownUnits(ledger.map((b) => reimbursedCents[b.user_id] || 0), displayUnit);
    const flows = settlementFlows(ledger.map((b, i) => ({ ...b, cents: shownBalances[i] })));
    if (currency !== trip) {
      const key = (f: (typeof flows)[number]) => `${f.from.user_id}:${f.to.user_id}`;
      const tripBalances = allocateShownUnits(ledger.map((b) => b.tripCents), tripUnit);
      const tripFlows = settlementFlows(ledger.map((b, i) => ({ ...b, cents: tripBalances[i] })));
      const tripAmounts = new Map(tripFlows.map((f) => [key(f), f.amount]));
      for (const flow of flows) {
        const tripAmount = tripAmounts.get(key(flow));
        const rate = tripAmount ? flow.amount / tripAmount : bridge;
        if (positiveRate(rate)) flow.exchange_rate = rate;
      }
    }

    return {
      balances: ledger.map((b, i) => ({
        user_id: b.user_id, username: b.username, avatar_url: b.avatar_url,
        balance: shownBalances[i] / 100,
      })),
      flows,
      settlements,
      finalBudgets: ledger.map((b, i) => {
        const expenses = shownExpenses[i];
        const reimbursed = shownReimbursements[i];
        const pending = shownBalances[i];
        const fronted = frontedRows[b.user_id] ?? [];
        const moved = movedRows[b.user_id] ?? [];
        const shownFronted = allocateShownUnits(fronted.map((r) => r.cents), displayUnit, expenses);
        const shownMoved = allocateShownUnits(moved.map((r) => r.cents), displayUnit, reimbursed);
        return {
          user_id: b.user_id, username: b.username, avatar_url: b.avatar_url,
          expenses: expenses / 100,
          reimbursed: reimbursed / 100,
          pending: pending / 100,
          final: (expenses - reimbursed - pending) / 100,
          sources: {
            fronted: fronted.map((r, k) => ({ ...r, cents: shownFronted[k] })),
            moved: moved.map((r, k) => ({ ...r, cents: shownMoved[k] })),
            // The flows are display cents already, and the greedy pass drains every
            // balance completely, so the flows on a person's side sum to their balance.
            outstanding: flows
              .filter(f => f.from.user_id === b.user_id || f.to.user_id === b.user_id)
              .map(f => ({
                from_user_id: f.from.user_id,
                to_user_id: f.to.user_id,
                cents: Math.round(f.amount * 100) * (f.to.user_id === b.user_id ? 1 : -1),
              })),
          },
        };
      }) satisfies BudgetParticipantFinal[],
      currency,
      trip_currency: trip,
      ...(bridge !== null && { display_rate: bridge }),
      unconverted: {
        item_ids: unconvertedItems,
        settlement_ids: unconvertedSettlements,
        currencies: [...unconvertedCurrencies].sort(byCodeUnit),
      } satisfies BudgetUnconverted,
    };
  }

  // -------------------------------------------------------------------------
  // Settlements (persisted settle-up transfers — history + undo)
  // -------------------------------------------------------------------------

  // Settlement usernames use COALESCE(display_name, username) like every item
  // query (the legacy raw fu.username was the odd one out) — now the
  // repository's own `joinedQuery()`/`SETTLEMENT_SELECT` shape.

  private mapSettlementRow(r: SettlementRow) {
    return {
      id: r.id, trip_id: r.trip_id,
      from_user_id: r.from_user_id, to_user_id: r.to_user_id,
      amount: r.amount, currency: r.currency ?? null,
      ...budgetRateColumns(r),
      exchange_rate_source: exchangeRateSourceSchema.safeParse(r.exchange_rate_source).data ?? 'legacy',
      created_at: r.created_at, settled_at: r.settled_at ?? null, note: r.note ?? null, created_by_user_id: r.created_by_user_id,
      from_username: r.from_username, from_avatar_url: avatarUrl({ avatar: r.from_avatar }),
      to_username: r.to_username, to_avatar_url: avatarUrl({ avatar: r.to_avatar }),
    };
  }

  async listSettlements(tripId: string | number) {
    const rows = await this.budgetSettlementsRepo.listForTrip(tripId);
    return rows.map(r => this.mapSettlementRow(r));
  }

  /**
   * Targeted single-row read (the legacy re-select was a full
   * listSettlements scan). `id: number` — Plan 4 Task 8b (U6): every caller
   * (`insertSettlement`'s own `newId`, `applySettlementUpdate` below) is
   * already a real row id.
   */
  async getSettlement(id: number, tripId: string | number) {
    const row = await this.budgetSettlementsRepo.findWithUsers(id, tripId);
    return row ? this.mapSettlementRow(row) : null;
  }

  /** Raw settlement insert (no FX freeze) — the REST path wraps it in createSettlement. */
  async insertSettlement(
    tripId: string | number,
    data: { from_user_id: number; to_user_id: number; amount: number; currency?: string | null; exchange_rate?: number; settled_at?: string | null; note?: string | null },
    createdByUserId?: number,
    rate?: FrozenRate,
  ) {
    const newId = await this.budgetSettlementsRepo.insertSettlement({
      trip_id: tripId, from_user_id: data.from_user_id, to_user_id: data.to_user_id,
      amount: Math.round(data.amount * 100) / 100,
      currency: data.currency ? data.currency.toUpperCase() : null,
      exchange_rate: data.exchange_rate ?? 1,
      ...rate,
      settled_at: data.settled_at || null,
      note: settlementNote(data.note),
      created_by_user_id: createdByUserId ?? null,
    });
    return await this.getSettlement(newId, tripId);
  }

  /**
   * Raw settlement update (no FX freeze) — the REST path wraps it in
   * updateSettlement. `id: number` — Plan 4 Task 8b (U6): `BudgetController
   * .updateSettlement` parses `:settlementId` via `toRowId` and threads the
   * number down through `updateSettlement` to here.
   */
  async applySettlementUpdate(
    id: number,
    tripId: string | number,
    data: { from_user_id: number; to_user_id: number; amount: number; currency?: string | null; exchange_rate?: number; settled_at?: string | null; note?: string | null },
    rate?: FrozenRate,
  ) {
    const row = await this.budgetSettlementsRepo.findGuard(id, tripId);
    if (!row) return null;
    await this.budgetSettlementsRepo.update(id, {
      from_user_id: data.from_user_id, to_user_id: data.to_user_id, amount: Math.round(data.amount * 100) / 100,
      currency: [data.currency !== undefined, data.currency ? data.currency.toUpperCase() : null],
      exchange_rate: [data.exchange_rate !== undefined, data.exchange_rate !== undefined ? data.exchange_rate : 1],
      settled_at: [data.settled_at !== undefined, data.settled_at || null],
      note: [data.note !== undefined, settlementNote(data.note)],
    }, rate);
    return await this.getSettlement(id, tripId);
  }

  /** `id: number` — same Plan 4 Task 8b (U6) narrowing as {@link applySettlementUpdate} (`BudgetController.deleteSettlement` parses `:settlementId` via `toRowId`). */
  async deleteSettlement(id: number, tripId: string | number): Promise<boolean> {
    const row = await this.budgetSettlementsRepo.findGuard(id, tripId);
    if (!row) return false;
    await this.budgetSettlementsRepo.deleteById(id);
    return true;
  }

  // -------------------------------------------------------------------------
  // Controller-facing surface (unchanged from the pre-fold wrapper)
  // -------------------------------------------------------------------------

  async list(tripId: string) {
    return await this.listBudgetItems(tripId);
  }

  async perPersonSummary(tripId: string | number) {
    return this.getPerPersonSummary(tripId);
  }

  /**
   * The settlement in the viewer's currency, for REST and MCP alike. Converted with the
   * trip currency's own quote, the one every entry rate was frozen from, so a same-day
   * amount in the display currency round-trips to the cent and paying what settle-up
   * offers closes the balance (#2525). The display currency's quote only stands in when
   * the trip's cannot be fetched, and `baseRate` (the caller's own units of display
   * currency per 1 trip currency) only when neither can. It only stands in for that
   * missing display quote, which also reads a legacy transfer without a currency (taken
   * to be in the display currency, as with a live quote).
   */
  /** @txIndependent Provider snapshots are cached separately from trip writes. */
  async settlement(tripId: string | number, base: string | undefined, tripCurrency: string, baseRate?: number) {
    const trip = normalizeCurrency(tripCurrency);
    const effectiveBase = normalizeCurrency(base, trip);
    const tripRates = Object.fromEntries(
      (await this.exchangeRates.listTripExchangeRates(tripId)).map((row) => [row.currency, row.exchange_rate]),
    );
    const needsGlobal = (effectiveBase !== trip && !positiveRate(tripRates[effectiveBase]))
      || await this.budgetItemsRepo.hasUnfrozenForeign(tripId, trip)
      || (await this.budgetSettlementsRepo.listUnfrozenForeignCurrencies(tripId, trip))
        .some((currency) => !positiveRate(tripRates[currency]));
    const rates = needsGlobal
      ? (await this.exchangeRates.getRates(trip)) ?? (effectiveBase !== trip ? await this.exchangeRates.getRates(effectiveBase) : null)
      : null;
    return this.calculateSettlement(tripId, { base: effectiveBase, rates, tripRates, tripCurrency: trip, baseRate });
  }

  /** @txIndependent Provider snapshots are cached separately from trip writes. */
  async create(tripId: string, data: Parameters<BudgetService['createBudgetItem']>[1] & RateWrite, userId?: number) {
    const prepared = await this.prepareRate(tripId, data, userId);
    return this.createBudgetItem(tripId, data, prepared);
  }

  /** @txIndependent Provider snapshots are cached separately from trip writes. */
  async update(id: number, tripId: string | number, data: Parameters<BudgetService['updateBudgetItem']>[2] & RateWrite, userId?: number) {
    const existing = await this.budgetItemsRepo.findInTrip(id, tripId);
    if (!existing) return null;
    const prepared = await this.prepareRate(tripId, data, userId, existing);
    return this.updateBudgetItem(id, tripId, data, prepared);
  }

  /** `id: number` — same Plan 4 Task 8b (U6) narrowing as {@link update} (`BudgetController.remove`/the `costs.delete` RPC method). */
  async remove(id: number, tripId: string): Promise<boolean> {
    return await this.deleteBudgetItem(id, tripId);
  }

  /** `id: number` — same Plan 4 Task 8b (U6) narrowing as {@link update} (`BudgetController.setPayers`). */
  async setPayers(id: number, tripId: string, payers: { user_id: number; amount: number }[]) {
    return await this.setItemPayers(id, tripId, payers);
  }

  /**
   * Unlike a split member, a settlement cannot drop an off-roster id: it has
   * exactly two named parties and both columns are NOT NULL, so a stranger in
   * either slot makes the row meaningless rather than merely wider. Refuse the
   * whole write. Returning null lands on the caller's existing "Settlement not
   * found" 404, which is also what keeps the endpoint from confirming whether
   * an id it rejected exists at all.
   */
  private async settlementPartiesOnTrip(tripId: string | number, data: { from_user_id: number; to_user_id: number }): Promise<boolean> {
    const roster = await this.tripMembersRepo.rosterUserIds(tripId);
    return roster.has(data.from_user_id) && roster.has(data.to_user_id);
  }

  /** @txIndependent Provider snapshots are cached separately from trip writes. */
  async createSettlement(
    tripId: string | number,
    data: Parameters<BudgetService['insertSettlement']>[1] & RateWrite & { rate_base_currency?: string },
    userId: number,
  ) {
    if (!(await this.settlementPartiesOnTrip(tripId, data))) return null;
    const prepared = await this.prepareRate(tripId, data, userId);
    return this.uow.transactional(async () => {
      if (!(await this.settlementPartiesOnTrip(tripId, data))) return null;
      if (data.rate_base_currency && normalizeCurrency(data.rate_base_currency) !== prepared.base) {
        throw conflict('Trip currency changed since this repayment was quoted');
      }
      const rate = await this.rateForCommit(tripId, prepared);
      return this.insertSettlement(tripId, { ...data, currency: normalizeCurrency(data.currency, prepared.base) }, userId, rate);
    });
  }

  /** @txIndependent Provider snapshots are cached separately from trip writes. */
  async updateSettlement(
    id: number, tripId: string | number,
    data: Parameters<BudgetService['applySettlementUpdate']>[2] & RateWrite,
    userId?: number,
  ) {
    if (!(await this.settlementPartiesOnTrip(tripId, data))) return null;
    const existing = await this.budgetSettlementsRepo.findWithUsers(id, tripId);
    if (!existing) return null;
    const prepared = await this.prepareRate(tripId, data, userId, existing);
    return this.uow.transactional(async () => {
      if (!(await this.settlementPartiesOnTrip(tripId, data))) return null;
      const current = await this.budgetSettlementsRepo.findWithUsers(id, tripId);
      if (!current) return null;
      const rate = await this.rateForCommit(tripId, prepared, current);
      const currency = data.currency === undefined ? undefined : normalizeCurrency(data.currency, prepared.base);
      return this.applySettlementUpdate(id, tripId, { ...data, currency }, rate);
    });
  }

  async reorderItems(tripId: string, orderedIds: number[]): Promise<void> {
    await this.uow.transactional(async () => {
      for (let index = 0; index < orderedIds.length; index++) {
        await this.budgetItemsRepo.setSortOrder(orderedIds[index], tripId, index);
      }
    });
  }

  async reorderCategories(tripId: string, orderedCategories: string[]): Promise<void> {
    await this.uow.transactional(async () => {
      for (let index = 0; index < orderedCategories.length; index++) {
        await this.budgetCategoryOrderRepo.upsertSortOrder(tripId, orderedCategories[index], index);
      }
    });
  }

  /**
   * Mirrors the legacy PUT /:id side effect: when a price-linked budget item's
   * total_price changes, write it into the reservation's metadata and broadcast
   * reservation:updated. Non-fatal — a failure here never breaks the budget update.
   */
  async syncReservationPrice(tripId: string, reservationId: number, totalPrice: number, socketId: string | undefined, currency?: string | null): Promise<void> {
    try {
      const reservation = await this.reservationsRepo.getIdAndMetadata(reservationId, tripId);
      if (!reservation) return;
      const meta = decodeJson(RESERVATION_METADATA, reservation.metadata, `reservation ${reservation.id}`);
      // Cent-clean, so a booking never inherits float noise from the expense
      // it is linked to — and so a row stamped before #1964 heals on the next
      // edit. The panels print this string as it stands.
      meta.price = String(Math.round(totalPrice * 100) / 100);
      // The card names the currency beside the figure (#2084). An expense in the
      // trip's own currency carries none, and neither does its mirror then.
      if (currency !== undefined) {
        if (currency) meta.priceCurrency = currency.toUpperCase();
        else delete meta.priceCurrency;
      }
      await this.reservationsRepo.setMetadata(reservation.id, encodeJson(RESERVATION_METADATA, meta));
      const updatedRes = await this.reservationsRepo.getFull(reservation.id);
      this.realtime.broadcast(tripId, 'reservation:updated', { reservation: updatedRes }, socketId);
    } catch (err) {
      console.error('[budget] Failed to sync price to reservation:', err);
    }
  }
}
