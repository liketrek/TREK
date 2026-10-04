import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@mikro-orm/nestjs';
import type { BudgetFallbackFx, BudgetParticipantFinal, BudgetUnconverted, TrekWsPayload, TrekWsTripEventName } from '@trek/shared';
import { RealtimeService } from '../realtime/realtime.service';
import { PermissionsService } from '../permissions/permissions.service';
import { avatarUrl } from '../common/avatarUrl';
import { byCodeUnit } from '../common/compare';
import type { User, BudgetItem, BudgetItemMember, BudgetItemPayer, BudgetItemReceipt } from '../../types';
import { ExchangeRatesService } from './exchange-rates.service';
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

type Trip = TripAccess;

type SettlementRow = {
  id: number; trip_id: number; from_user_id: number; to_user_id: number;
  amount: number; currency: string | null; exchange_rate: number | null;
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
 * Re-denominate whole trip-currency cents into whole display-currency cents
 * without losing or inventing one (#1382).
 *
 * Rounding every balance on its own lets the rounded set drift away from the sum
 * it came from: a squared-up trip viewed in another currency then shows a cent
 * that no payment flow can ever clear, and the drift moves whenever the live rate
 * does — money appearing without a single expense being touched. Rounding down
 * and handing the leftover to the largest fractions keeps Σ(converted) equal to
 * converted(Σ). `factor === 1` (the display currency IS the trip currency, the
 * common case) is the identity and never touches a float.
 */
/**
 * Add money in whole cents, not in floats (#1964).
 *
 * A total that does not divide evenly is split into parts that are each exact
 * to the cent — 163.21 across two people is 81.61 and 81.60 — but adding those
 * two doubles gives 163.20999999999998, and that is what got written back over
 * the clean total the client sent. It then surfaced anywhere the number is
 * printed without Intl doing the rounding: the expense form when reopened, the
 * mobile cost sheet, and the price stamped onto a linked booking.
 *
 * This is the same rule the settlement maths in this file already follows
 * (toTripCents), applied to the one arithmetic that had been left in euros.
 */
function sumMoney(amounts: number[]): number {
  return amounts.reduce((a, v) => a + Math.round(v * 100), 0) / 100;
}

/**
 * Convert a set of trip cents to display cents so that they still add up: floor
 * each one, then hand the cents lost to flooring to the largest fractions. `total`
 * is what the set has to sum to. By default that is the rounded conversion of its
 * own sum; the rows behind a figure pass the figure's already allocated cents
 * instead, so a list nested under a line lands exactly on that line.
 */
function allocateDisplayCents(cents: number[], factor: number, total = Math.round(cents.reduce((a, c) => a + c, 0) * factor)): number[] {
  if (factor === 1) return [...cents];
  const exact = cents.map(c => c * factor);
  const out = exact.map(v => Math.floor(v));
  const drift = total - out.reduce((a, v) => a + v, 0);
  const byFraction = exact
    .map((v, i) => ({ i, frac: v - Math.floor(v) }))
    .sort((a, b) => b.frac - a.frac || a.i - b.i);
  for (let k = 0; k < drift && k < byFraction.length; k++) out[byFraction[k].i] += 1;
  return out;
}

/**
 * What `exchange_rate` holds on a row whose rate was never frozen. The column is
 * `REAL NOT NULL DEFAULT 1`, so without a migration 1 is the only way to store "no
 * rate". It is read in exactly two places, isFrozenRate and the repositories'
 * unfrozen predicate (BG89-BG92); nothing else in this file compares a rate with 1.
 */
const NOT_FROZEN_RATE = 1;

/** Whether a stored rate is one that was frozen, rather than the "not frozen" sentinel. */
function isFrozenRate(rate: number | null | undefined): rate is number {
  return rate != null && Number.isFinite(rate) && rate > 0 && rate !== NOT_FROZEN_RATE;
}

/**
 * How an amount of a row, in the row's own currency, becomes trip currency, or null when
 * nothing can convert it. The rate frozen when the row was entered wins (#1335), so a
 * booked expense keeps the value it was booked at. A row written before the freeze
 * existed (no frozen rate) converts through today's `rates`, units of each currency per
 * 1 of their base. Pre-rework rows store currency = NULL, which means the trip's own.
 *
 * A foreign row with neither is left out by every caller and reported, rather than read
 * as if it were already in the trip currency: 8,920,000 VND counted as that many dollars
 * swamps every balance on the trip.
 *
 * The settlement nets with it and every trip total adds up with it, so the two can never
 * read the same rows differently.
 */
function tripConverter(
  itemCurrency: string | null | undefined,
  itemRate: number | null | undefined,
  tripCurrency: string,
  rates: Record<string, number> | null,
): ((amount: number) => number) | null {
  const cur = (itemCurrency || tripCurrency).toUpperCase();
  if (cur === tripCurrency) return amount => amount;
  if (isFrozenRate(itemRate)) return amount => amount / itemRate;
  const rCur = rates?.[cur];
  const rTrip = rates?.[tripCurrency];
  if (rCur && rCur > 0 && rTrip && rTrip > 0) return amount => (amount / rCur) * rTrip;
  return null;
}

/**
 * Units of `to` per 1 `from`, from a set of rates quoted against any base (each rate is
 * units of that currency per 1 base). Null when either quote is missing.
 */
function quoteRatio(rates: Record<string, number> | null, to: string, from: string): number | null {
  const rTo = rates?.[to];
  const rFrom = rates?.[from];
  return rTo && rTo > 0 && rFrom && rFrom > 0 ? rTo / rFrom : null;
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
    return { ...row, sort_order: row.sort_order ?? 0, created_at: row.created_at ?? undefined };
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
   * The subset of `userIds` that is actually on this trip. Used to be a plain
   * existence check against `users`, which let any id on the instance become a
   * payer or a split member and come back out through the read-back join with a
   * name and an avatar attached. Off-roster ids drop silently, the way the
   * packing and reservations assignee paths handle them.
   */
  private async rosterMemberIds(tripId: string | number, userIds: number[]): Promise<Set<number>> {
    const unique = new Set(userIds);
    if (unique.size === 0) return new Set();
    const roster = await this.tripMembersRepo.rosterUserIds(tripId);
    return new Set([...unique].filter(id => roster.has(id)));
  }

  /**
   * Replace the payer rows of an item and keep total_price = sum of payer amounts.
   * A negative amount is a real payer — the recipient of a refund (#2176) — and
   * is stored as such; only a zero (or NaN) amount says nothing and is dropped.
   */
  private async writeItemPayers(itemId: number | string, tripId: string | number, payers: { user_id: number; amount: number }[]) {
    await this.budgetItemPayersRepo.deleteForItem(itemId as number);
    const known = await this.rosterMemberIds(tripId, payers.map(p => p.user_id));
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

  /**
   * Freeze the live FX rate at entry time into `exchange_rate` so a settled position
   * isn't re-opened when live rates drift later (#1335 / #1445). The stored rate is
   * "units of the item/display currency per 1 trip currency" — the settlement
   * converts with it via `amount / rate`.
   *
   * Only freezes for a foreign currency with no explicit rate. The server's own rate
   * comes first; `fallback_fx`, rates the caller lent for this write, only fills a
   * currency the server cannot quote (resolveRate). With neither, a new row is
   * stored unfrozen and left out of every figure until a rate turns up. On update it
   * (re)freezes only when the currency changes (checked against `budget_items`), so
   * an unrelated edit never moves money, and a change with no rate at all resets the
   * row to unfrozen instead of keeping the old currency's rate. `fallback_fx` is taken
   * off `data` either way, so it never reaches the write. Callers invoke this *before*
   * the DB write, outside its transaction: the rate fetch is network I/O.
   */
  /**
   * `existingItemId?: number` (Plan 4 Task 8b, U6 — the program's gate-level
   * id parsing carry: `BudgetController.update` now parses `:id` once via
   * `toRowId` and threads the number down through `update` to here; the
   * other caller, `booking-import.service.ts`, never passes this param).
   */
  async freezeForeignRate(
    tripId: string | number,
    data: { currency?: string | null; exchange_rate?: number; fallback_fx?: BudgetFallbackFx },
    existingItemId?: number,
    existingCurrency?: string | null,
  ): Promise<void> {
    const fallback = data.fallback_fx;
    delete data.fallback_fx;
    if (data.exchange_rate != null) return; // an explicit rate from the caller wins
    const cur = (data.currency || '').toUpperCase();
    if (!cur) return; // currency not being set in this request
    // Skip the re-freeze when the currency isn't actually changing, so an unrelated
    // edit never moves money. Items resolve the prior currency from budget_items; a
    // settlement lives in a different table, so its caller passes it in directly.
    let prior: string | undefined;
    if (existingCurrency !== undefined) {
      prior = (existingCurrency || '').toUpperCase();
    } else if (existingItemId != null) {
      const existing = await this.budgetItemsRepo.getCurrency(existingItemId, tripId);
      if (existing !== undefined) prior = (existing || '').toUpperCase();
    }
    if (prior !== undefined && prior === cur) return; // currency unchanged
    const tripCur = await this.tripCurrency(tripId);
    if (cur === tripCur) return; // same as the trip currency → no conversion to freeze
    const rate = this.resolveRate(tripCur, cur, await this.exchangeRates.getRates(tripCur), fallback);
    if (rate !== null) data.exchange_rate = rate;
    // The update SQL keeps the stored rate when none is sent, which left the old
    // currency's rate on the row (a USD 1.08 on a VND bill) and counted it as frozen.
    else if (prior !== undefined) data.exchange_rate = NOT_FROZEN_RATE;
  }

  /** The trip's currency, upper case, EUR when it has none (the default the app reads). */
  private async tripCurrency(tripId: string | number): Promise<string> {
    const currency = await this.tripsRepo.getCurrency(tripId);
    return (currency || 'EUR').toUpperCase();
  }

  /**
   * The rate to freeze `cur` at on a `tripCur` trip: the server's own quote, else the one
   * the caller lent, but only while the lent table is quoted against the trip currency
   * (a table against the old currency after a switch would freeze the wrong figure).
   * A result that is not a usable frozen rate, exactly 1 among them, counts as none.
   */
  private resolveRate(
    tripCur: string,
    cur: string,
    serverRates: Record<string, number> | null,
    fallback: BudgetFallbackFx | undefined,
  ): number | null {
    const own = serverRates?.[cur];
    if (isFrozenRate(own)) return own;
    const lent = fallback && fallback.base.toUpperCase() === tripCur ? fallback.rates[cur] : undefined;
    return isFrozenRate(lent) ? lent : null;
  }

  /**
   * Freeze a rate onto every expense and transfer in a foreign currency that never
   * froze one: the rows the settlement lists as `unconverted`, and also those it still
   * converts at today's live rate. Today's server rate first, `fallback` (rates the
   * caller holds) for what the server cannot quote. A row that is frozen, in the trip
   * currency or without a currency is never touched, so a second call heals nothing.
   *
   * The write is a compare-and-set in one transaction: only rows that are still
   * unfrozen are updated, and nothing is written when the trip currency changed while
   * the rates were fetched (null, so the caller can say so). A healthy trip with
   * nothing pending returns before any fetch.
   */
  async freezeMissingRates(
    tripId: string | number,
    fallback?: BudgetFallbackFx,
  ): Promise<{ items: BudgetItem[]; settlements: NonNullable<Awaited<ReturnType<BudgetService['getSettlement']>>>[]; unresolved: string[] } | null> {
    const tripCur = await this.tripCurrency(tripId);
    // The legacy statement was one UNION of both tables, ORDER BY cur.
    const pending = [...new Set([
      ...(await this.budgetItemsRepo.listUnfrozenForeignCurrencies(tripId, tripCur)),
      ...(await this.budgetSettlementsRepo.listUnfrozenForeignCurrencies(tripId, tripCur)),
    ])].sort(byCodeUnit);
    if (pending.length === 0) return { items: [], settlements: [], unresolved: [] };

    const serverRates = await this.exchangeRates.getRates(tripCur);
    const resolved: [string, number][] = [];
    const unresolved: string[] = [];
    for (const cur of pending) {
      const rate = this.resolveRate(tripCur, cur, serverRates, fallback);
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

  /**
   * Re-anchor a trip's money when its base currency changes (#1543).
   *
   * Every frozen `exchange_rate` is "units of the row's currency per 1 *trip*
   * currency", and `currency = NULL` means "the trip's own currency" — both are
   * relative to the trip currency, so swapping it out from under them silently
   * corrupts the settlement: NULL rows redenominate (9 000 RUB becomes 9 000 EUR)
   * and frozen rates keep pointing at the old base, which is exactly the mismatch
   * that inflated #1543 by ~27x.
   *
   * So, before the switch: pin the implicit rows to the outgoing currency (their
   * amounts really were in it) and re-freeze every row against the incoming one.
   * No stored amount is rewritten — each expense keeps the figure the user typed,
   * in the currency they typed it in, and its real-world value is preserved.
   *
   * Place prices follow the same NULL = "the trip's own currency" convention (that
   * is how the PDF export and the place chips read them), so they are pinned too —
   * otherwise a €15 museum on a trip switched to JPY starts reading as ¥15. They
   * carry no frozen rate, so pinning the currency is all they need.
   *
   * Must run *before* the (synchronous) trip update, while the old currency is
   * still in `trips`, and is a no-op when the currency isn't actually changing.
   */
  async rebaseTripCurrency(
    tripId: string | number,
    newCurrency: string | null | undefined,
  ): Promise<void> {
    const next = (newCurrency || '').toUpperCase();
    if (!next) return;
    const tripCurrency = await this.tripsRepo.getCurrency(tripId);
    if (tripCurrency === undefined) return;
    const prev = (tripCurrency || 'EUR').toUpperCase();
    if (prev === next) return;

    const rates = await this.exchangeRates.getRates(next);
    // A row already denominated in the new base needs no conversion (rate 1). When no
    // live rate is available we also store 1 rather than a stale one: rate 1 means "not
    // frozen", so the settlement falls back to live rates instead of trusting a figure
    // anchored to a currency this trip no longer uses.
    const rateFor = (cur: string): number => {
      if (cur === next) return 1;
      const r = rates?.[cur];
      return r && r > 0 ? r : 1;
    };

    // D4 (rule 23) — one repository method per table, not a dynamic identifier:
    // `budgetItemsRepo`'s and `budgetSettlementsRepo`'s own `pinCurrency`/
    // `listDistinctCurrencies`/`setExchangeRateForCurrency` trios.
    const rebaseBudgetItems = async () => {
      await this.budgetItemsRepo.pinCurrency(tripId, prev);
      const currencies = await this.budgetItemsRepo.listDistinctCurrencies(tripId);
      for (const cur of currencies) {
        await this.budgetItemsRepo.setExchangeRateForCurrency(tripId, cur, rateFor(cur.toUpperCase()));
      }
    };
    const rebaseBudgetSettlements = async () => {
      await this.budgetSettlementsRepo.pinCurrency(tripId, prev);
      const currencies = await this.budgetSettlementsRepo.listDistinctCurrencies(tripId);
      for (const cur of currencies) {
        await this.budgetSettlementsRepo.setExchangeRateForCurrency(tripId, cur, rateFor(cur.toUpperCase()));
      }
    };

    // Only priced places have anything to denominate; a currency on a free place would
    // just be noise. `updated_at` doubles as the optimistic-concurrency token (#1135),
    // so bumping it stops a client holding the pre-switch row from writing the pin away.
    const pinPlaces = async () => {
      await this.placesRepo.pinCurrencyForTrip(tripId, prev);
    };

    await this.uow.transactional(async () => { await rebaseBudgetItems(); await rebaseBudgetSettlements(); await pinPlaces(); });
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
  ) {
    return await this.uow.transactional(async () => {
      const maxOrder = await this.budgetItemsRepo.maxSortOrder(tripId);
      const sortOrder = (maxOrder !== null ? maxOrder : -1) + 1;

      const cat = data.category || 'other';

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

      const knownMembers = data.members ? await this.rosterMemberIds(tripId, data.members.map(m => m.user_id)) : null;
      const members = data.members && knownMembers ? data.members.filter(m => knownMembers.has(m.user_id)) : undefined;
      const knownIds = data.member_ids ? await this.rosterMemberIds(tripId, data.member_ids) : null;
      const memberIds = data.member_ids && knownIds ? data.member_ids.filter(uid => knownIds.has(uid)) : undefined;

      const { note, ticket } = splitLegacyTicketNote(data.note, data.ticket_json);

      const itemId = await this.budgetItemsRepo.insertItem({
        trip_id: tripId,
        category: cat,
        name: data.name,
        total_price: total,
        currency: data.currency || null,
        exchange_rate: data.exchange_rate != null ? data.exchange_rate : 1,
        persons: memberIds ? memberIds.length : (data.persons != null ? data.persons : null),
        days: data.days !== undefined && data.days !== null ? data.days : null,
        note: note || null,
        ticket_json: ticket || null,
        sort_order: sortOrder,
        expense_date: data.expense_date || null,
        reservation_id: data.reservation_id != null ? data.reservation_id : null,
        place_id: data.place_id != null ? data.place_id : null,
      });

      if (data.payers && data.payers.length > 0) await this.writeItemPayers(itemId, tripId, data.payers);
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
    data: { name: string; category?: string; total_price: number; currency?: string | null; exchange_rate?: number },
  ) {
    // createBudgetItem accepts reservation_id directly — the legacy separate
    // UPDATE after the insert was redundant (and non-atomic).
    return await this.createBudgetItem(tripId, { ...data, reservation_id: reservationId });
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
  ) {
    return await this.uow.transactional(async () => {
      const item = await this.budgetItemsRepo.findInTrip(id, tripId);
      if (!item) return null;

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
        category: [!!data.category, data.category || ''],
        name: [!!data.name, data.name || ''],
        total_price: [data.total_price !== undefined, data.total_price !== undefined ? data.total_price : 0],
        currency: [data.currency !== undefined, data.currency !== undefined ? (data.currency || null) : null],
        exchange_rate: [data.exchange_rate !== undefined, data.exchange_rate !== undefined ? data.exchange_rate : 1],
        persons: [data.persons !== undefined, data.persons !== undefined ? data.persons : null],
        days: [data.days !== undefined, data.days !== undefined ? data.days : null],
        note: [noteTouched, noteTouched ? (note as string | null) : null],
        ticket_json: [ticketTouched, ticketTouched ? (ticket as string | null) : null],
        sort_order: [data.sort_order !== undefined, data.sort_order !== undefined ? data.sort_order : 0],
        expense_date: [data.expense_date !== undefined, data.expense_date !== undefined ? (data.expense_date || null) : null],
        reservation_id: [data.reservation_id !== undefined, data.reservation_id ?? null],
        place_id: [data.place_id !== undefined, data.place_id ?? null],
      });

      // Optional inline payer/member replacement (the edit modal saves all at once).
      if (data.payers !== undefined) {
        await this.writeItemPayers(id, tripId, data.payers);
        // writeItemPayers derives total_price from the payer sum (0 for no payers).
        // A "recorded total, nobody assigned" expense clears payers but still carries
        // an explicit total_price — re-apply it so it isn't clobbered to 0.
        if (data.payers.length === 0 && data.total_price !== undefined) {
          await this.budgetItemsRepo.setTotalPrice(id, data.total_price);
        }
      }
      if (data.members !== undefined) {
        const known = await this.rosterMemberIds(tripId, data.members.map(m => m.user_id));
        const members = data.members.filter(m => known.has(m.user_id));
        await this.budgetItemMembersRepo.deleteForItem(id);
        for (const m of members) {
          await this.budgetItemMembersRepo.insertIgnore({ budget_item_id: id, user_id: m.user_id, paid: 0, amount: m.amount !== undefined && m.amount !== null ? m.amount : null });
        }
        await this.budgetItemsRepo.setPersons(id, members.length || null);
      } else if (data.member_ids !== undefined) {
        const known = await this.rosterMemberIds(tripId, data.member_ids);
        const memberIds = data.member_ids.filter(uid => known.has(uid));
        await this.budgetItemMembersRepo.deleteForItem(id);
        for (const uid of memberIds) {
          await this.budgetItemMembersRepo.insertIgnore({ budget_item_id: id, user_id: uid, paid: 0, amount: null });
        }
        await this.budgetItemsRepo.setPersons(id, memberIds.length || null);
      }

      // If category changed, update category order table
      if (data.category) {
        const catExists = await this.budgetCategoryOrderRepo.exists(tripId, data.category);
        if (!catExists) {
          const maxCatOrder = await this.budgetCategoryOrderRepo.maxSortOrder(tripId);
          const catOrder = (maxCatOrder !== null && maxCatOrder !== undefined ? maxCatOrder : -1) + 1;
          await this.budgetCategoryOrderRepo.insertIgnore(tripId, data.category, catOrder);
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
      await this.writeItemPayers(id, tripId, payers);
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

  /**
   * The counterpart to syncReservationPrice: take the mirrored total back off
   * the booking. Non-fatal, exactly like the writer.
   */
  private async clearReservationPrice(tripId: string | number, reservationId: number): Promise<void> {
    try {
      const reservation = await this.reservationsRepo.getIdAndMetadata(reservationId, tripId);
      if (!reservation?.metadata) return;
      const meta = JSON.parse(reservation.metadata);
      if (!meta || typeof meta !== 'object' || meta.price === undefined) return;
      delete meta.price;
      delete meta.priceCurrency;
      await this.reservationsRepo.setMetadata(reservation.id, JSON.stringify(meta));
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

      await this.budgetItemMembersRepo.deleteForItem(id);

      const known = await this.rosterMemberIds(tripId, userIds);
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

  async removeUserFromBudgetItems(userId: number): Promise<void> {
    await this.uow.transactional(async () => {
      const itemIds = await this.budgetItemMembersRepo.listItemIdsForUser(userId);
      if (itemIds.length === 0) {
        return;
      }

      await this.budgetItemMembersRepo.deleteForUser(userId);

      for (const itemId of itemIds) {
        const count = await this.budgetItemMembersRepo.countForItem(itemId);
        await this.budgetItemsRepo.setPersons(itemId, count || null);
      }
    });
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
  async getPerPersonSummary(tripId: string | number, rates: Record<string, number> | null = null) {
    const tripCurrency = await this.tripCurrency(tripId);
    const items = await this.budgetItemsRepo.listMoneyRows(tripId);
    const members = await this.budgetItemMembersRepo.listForTripWithUsersAndPaid(tripId);
    const people = new Map<number, { user_id: number; username: string; avatar: string | null; assigned: number; paid: number; items_count: number }>();
    for (const item of items) {
      const own = members.filter(m => m.budget_item_id === item.id);
      if (own.length === 0) continue;
      // A foreign row nothing can convert counts for nobody, as in the settlement.
      const convert = tripConverter(item.currency, item.exchange_rate, tripCurrency, rates);
      if (!convert) continue;
      const toTripCents = (amount: number) => Math.round(convert(amount) * 100);
      // A member with an amount of their own owes exactly that; the rest split the
      // total evenly, as the query this replaces did.
      const equal = this.splitEqualShares(toTripCents(item.total_price || 0), own, item.id);
      for (const m of own) {
        const share = m.amount !== null && m.amount !== undefined ? toTripCents(m.amount) : (equal[m.user_id] || 0);
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
  async tripTotals(tripId: string | number, tripCurrency: string, rates: Record<string, number> | null = null): Promise<{ total: number; byCategory: Record<string, number>; unconverted: number[] }> {
    const trip = (tripCurrency || 'EUR').toUpperCase();
    const rows = await this.budgetItemsRepo.listMoneyRows(tripId);
    let total = 0;
    const byCategory: Record<string, number> = {};
    const unconverted: number[] = [];
    for (const r of rows) {
      const convert = tripConverter(r.currency, r.exchange_rate, trip, rates);
      if (!convert) {
        unconverted.push(r.id);
        continue;
      }
      const cents = Math.round(convert(r.total_price || 0) * 100);
      total += cents;
      const cat = r.category || '';
      byCategory[cat] = (byCategory[cat] || 0) + cents;
    }
    return {
      total: total / 100,
      byCategory: Object.fromEntries(Object.entries(byCategory).map(([cat, cents]) => [cat, cents / 100])),
      unconverted,
    };
  }

  /**
   * Today's rates against the trip currency, for the totals above. Fetched only when a
   * row in another currency never froze a rate of its own: every other row converts
   * without them, so a trip whose rows were all booked never waits on the network.
   */
  async ratesForTripTotals(tripId: string | number, tripCurrency: string): Promise<Record<string, number> | null> {
    const trip = (tripCurrency || 'EUR').toUpperCase();
    const unbooked = await this.budgetItemsRepo.hasUnfrozenForeign(tripId, trip);
    return unbooked ? this.exchangeRates.getRates(trip) : null;
  }

  /**
   * Largest-remainder split of an expense across its participants. Takes and
   * returns **whole cents**, so the shares add back up to the input exactly —
   * the settlement ledger is netted in integer cents (#1382).
   *
   * The remainder cent rotates with the item id rather than always landing on the
   * first member, so across several expenses the rounding evens out instead of
   * always favouring the same person.
   *
   * Floor-based (`totalCents - baseCents * n`, never `%`), so a negative total —
   * a refund split across its beneficiaries (#2176) — still yields a remainder
   * in [0, n) and shares that sum back to the total exactly. The client mirror
   * (CostsPanel.helpers.splitEqualShares) must stay share-for-share identical;
   * the parity fixture in budget.service.calc.test.ts pins both sides.
   */
  private splitEqualShares(totalCents: number, members: { user_id: number }[], itemId: number): Record<number, number> {
    const n = members.length;
    if (n === 0) return {};

    const baseCents = Math.floor(totalCents / n);
    const remainder = totalCents - baseCents * n;

    const shares: Record<number, number> = {};
    const sortedMembers = [...members].sort((a, b) => a.user_id - b.user_id);
    const startIndex = itemId % n;

    for (let i = 0; i < n; i++) {
      const member = sortedMembers[i];
      const hasExtraCent = ((i - startIndex + n) % n) < remainder;
      shares[member.user_id] = baseCents + (hasExtraCent ? 1 : 0);
    }

    return shares;
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
   * A row nothing can convert (a foreign currency with no frozen rate and no live
   * one) is left out whole and listed under `unconverted`, so Σ balances stays 0.
   * `currency` says what the amounts are in: the display currency when there is a
   * quote for it (the rates, else `baseRate`, the caller's own units of display
   * currency per 1 trip currency), otherwise the trip currency.
   */
  async calculateSettlement(
    tripId: string | number,
    opts: { base?: string; rates?: Record<string, number> | null; tripCurrency?: string; baseRate?: number } = {},
  ) {
    const requested = (opts.base || opts.tripCurrency || 'EUR').toUpperCase();
    const tripCurrency = (opts.tripCurrency || requested).toUpperCase();
    const rates = opts.rates ?? null;
    // Net the whole settlement in the trip's canonical currency and convert the final
    // totals to the display currency once, instead of netting in the (moving) display
    // currency. Otherwise per-expense rounding shifts as live FX drifts and the greedy
    // debt-simplifier reshuffles it into phantom third-party micro-flows (#1382). When
    // the display currency IS the trip currency (the common case) every conversion below
    // is the identity, so behaviour is unchanged.
    // rates[X] = units of X per 1 base; the frozen exchange_rate is units of item-currency
    // per 1 trip-currency. Pre-rework rows store currency = NULL = "the trip's own currency".
    // Prefer the FX rate frozen at entry time (#1335): a settled expense keeps the rate
    // it was booked at, so a later live-rate drift doesn't re-open it with a residual.
    // Legacy rows without a frozen rate convert via base with live rates.
    const converterFor = (itemCurrency: string | null | undefined, itemRate?: number | null) =>
      tripConverter(itemCurrency, itemRate, tripCurrency, rates);
    // trip-currency → display currency, applied once to the final netted totals.
    // Held as a plain factor so it is exactly linear: the balances are converted as
    // one set (allocateDisplayCents) rather than one at a time, which is what keeps
    // them adding up to zero in whatever currency the viewer picked (#1382).
    //
    // `rates` may be quoted against any base; the ratio of the two quotes is the
    // factor either way. Callers pass the trip currency's own quote (see settlement()),
    // the one freezeForeignRate froze every entry rate from, so a bill entered today in
    // the display currency converts back to exactly what was typed (#2525). Taken the
    // other way round, from the display currency's quote, the two quotes are not exact
    // inverses and 12,345.67 USD came back as 12,346.06.
    //
    // Without a quote, the caller's own figure for the pair (`baseRate`) stands in for
    // the missing display quote, and for nothing else: a row with a currency of its own
    // is never converted with it. Like a live quote, it also reads a legacy transfer
    // without a currency, which is taken to be in the display currency. With neither,
    // the answer stays in the trip currency and says so, rather than printing trip cents
    // as the display currency.
    const baseRate = opts.baseRate != null && Number.isFinite(opts.baseRate) && opts.baseRate > 0 ? opts.baseRate : null;
    const quoted = requested === tripCurrency ? 1 : (quoteRatio(rates, requested, tripCurrency) ?? baseRate);
    const currency = quoted === null ? tripCurrency : requested;
    const displayFactor = quoted ?? 1;
    // A recorded settle-up amount is entered in whatever display currency the payer
    // was viewing. New rows capture that currency and the rate frozen at settle time
    // (#1445), so a settled position stays balanced when live rates drift — mirroring
    // the expenses; a frozen currency without a usable rate falls back to live rates,
    // and without those the transfer is left out like an expense. Legacy rows
    // (currency = NULL) have no frozen rate, so fall back to the old behaviour: assume
    // they were entered in the current display base and convert with live rates.
    const settleConverterFor = (sCurrency?: string | null, sRate?: number | null) =>
      sCurrency
        ? tripConverter(sCurrency, sRate, tripCurrency, rates)
        // The inverse of the display factor, so such a transfer reads back as entered.
        : (amount: number) => amount / displayFactor;
    const unconvertedItems: number[] = [];
    const unconvertedSettlements: number[] = [];
    const unconvertedCurrencies = new Set<string>();

    const items = (await this.budgetItemsRepo.listAllForTrip(tripId)).map(r => this.toBudgetItem(r));
    const allMembers = await this.budgetItemMembersRepo.listForTripWithUsers(tripId);
    const allPayers = await this.budgetItemPayersRepo.listForTripWithUsers(tripId);

    // Net balance per user, in whole cents of the TRIP currency: positive = is owed
    // money, negative = owes money. Every amount is converted out of its own currency
    // and rounded to a cent once, at the boundary — from there on the ledger is
    // integer arithmetic, so Σ(balances) is exactly 0 and no sub-cent residual can
    // build up behind the two-decimal figures the user sees (#1382).
    const balances: Record<number, { user_id: number; username: string; avatar_url: string | null; cents: number }> = {};
    const ensure = (id: number, src: { username?: string; avatar?: string | null }) => {
      if (!balances[id]) balances[id] = { user_id: id, username: src.username || '', avatar_url: avatarUrl(src), cents: 0 };
      return balances[id];
    };
    // The two halves of the balance, kept apart so the per-person final budget can
    // show its own arithmetic: what each person fronted, and what the recorded
    // transfers have already moved back. Same trip cents as `balances`, filled by
    // the same two loops, so the three figures cannot drift from the balance they
    // are derived from.
    const frontedCents: Record<number, number> = {};
    const reimbursedCents: Record<number, number> = {};
    // ...and the rows they are made of, so the breakdown lists them in these same
    // cents rather than converting the expense list a second time on the client.
    const frontedRows: Record<number, { item_id: number; cents: number }[]> = {};
    const movedRows: Record<number, { settlement_id: number; from_user_id: number; to_user_id: number; cents: number }[]> = {};
    // Read in the trip currency, those figures are the ledger's own trip cents. Read in
    // another one, they are built from each row's unrounded trip amount instead: a trip
    // cent is worth more than a dollar cent on a euro trip, so a bill of 12,345.67 USD
    // rounded to 10,831.44 EUR first came back as 12,345.68 (#2525). The balances, and
    // with them settle-up, still net whole trip cents.
    const finalUnit = (exactTripCents: number) => (displayFactor === 1 ? Math.round(exactTripCents) : exactTripCents);

    for (const item of items) {
      // Before anything else, planning-only and unpaid rows included: a row no rate can
      // convert is reported whole and moves nothing, credits and shares alike.
      const convert = converterFor(item.currency, item.exchange_rate);
      if (!convert) {
        unconvertedItems.push(item.id);
        unconvertedCurrencies.add((item.currency || '').toUpperCase());
        continue;
      }
      const toTripCents = (amount: number): number => Math.round(convert(amount) * 100);
      const members = allMembers.filter(m => m.budget_item_id === item.id);
      const payers = allPayers.filter(p => p.budget_item_id === item.id);
      if (members.length === 0) continue; // planning-only entry → doesn't affect balances

      // An expense nobody has paid stays out of the ledger (#2225), which is what
      // both cost panels already promise by flagging the row "Unfinished" (the
      // hint beside it reads: total only, not settled yet) and counting it into
      // the Outstanding card instead (CostsPanel/costsModel.isUnfinished). The
      // panels additionally require a non-zero total to paint that label; the
      // ledger deliberately does not, or PUT /budget/:id/payers with an empty
      // array (which zeroes total_price and does not re-apply it) would leave a
      // custom split debiting its members against no credit at all.
      // Charging its split members regardless, as #1382/#2176/#1543 left in
      // place below, debits a share with no credit behind it: Σ(balances) drifts
      // off zero by the unpaid total, and the greedy simplifier at the end of this
      // method has no memory of which expense made which debt, so it pairs the
      // inflated debtor with a creditor from some unrelated expense and offers a
      // payment between two people who never shared a bill. Booking every flow it
      // offered then left someone short: "everyone square" beside a balance that
      // is not zero.
      if (!payers.some(p => p.amount !== 0)) continue;

      // Payers are credited what they actually paid (converted to trip currency with
      // the item's stored exchange rate). A negative payer — the recipient of a
      // refund (#2176) — is debited by the same arithmetic: their credit is negative.
      let creditCents = 0;
      for (const p of payers) {
        const exact = convert(p.amount) * 100;
        const paid = Math.round(exact);
        ensure(p.user_id, p).cents += paid;
        frontedCents[p.user_id] = (frontedCents[p.user_id] || 0) + finalUnit(exact);
        if (paid !== 0) (frontedRows[p.user_id] ??= []).push({ item_id: item.id, cents: finalUnit(exact) });
        creditCents += paid;
      }
      // …and each split participant owes their share — a custom per-member amount
      // when one is set, otherwise an equal share of the expense.
      //
      // The equal split divides what the payers were actually credited, not
      // total_price: the two are the same figure (the write path derives the total
      // from the payer sum), but converting the total separately would round to a
      // different cent on a foreign-currency expense and leave the item off by one.
      // Negative credits (a refund, #2176) divide the same way. Nothing falls back
      // to total_price any more: an item with no payer behind it never reaches
      // here since #2225. An item whose payers net to exactly zero still does, and
      // divides zero, which is what it is worth.
      const hasCustomSplit = members.some(m => m.amount !== null && m.amount !== undefined);
      const equalShares = !hasCustomSplit ? this.splitEqualShares(creditCents, members, item.id) : {};
      for (const m of members) {
        const memberShare = hasCustomSplit && m.amount !== null && m.amount !== undefined
          ? toTripCents(m.amount)
          : (equalShares[m.user_id] || 0);
        ensure(m.user_id, m).cents -= memberShare;
      }
    }

    // Persisted settle-up transfers already moved money: the payer's debt shrinks,
    // the receiver's credit shrinks, so the corresponding flow disappears. A transfer
    // counts even when neither user has an expense-derived balance yet — a manual
    // payment, or one left behind after its expense was deleted, then correctly
    // surfaces as an amount still to square up instead of silently vanishing.
    const settlements = await this.listSettlements(tripId);
    const ensureSettled = (id: number, username: string | undefined, avatar_url: string | null | undefined) => {
      if (!balances[id]) balances[id] = { user_id: id, username: username || '', avatar_url: avatar_url ?? null, cents: 0 };
      return balances[id];
    };
    for (const s of settlements) {
      const convert = settleConverterFor(s.currency, s.exchange_rate);
      if (!convert) {
        unconvertedSettlements.push(s.id);
        unconvertedCurrencies.add((s.currency || '').toUpperCase());
        continue;
      }
      // Rounded to a trip cent per transfer, so recording one in a display currency
      // can't leave a sliver of a cent behind to accumulate over a trip's lifetime.
      const exact = convert(s.amount) * 100;
      const inTrip = Math.round(exact);
      ensureSettled(s.from_user_id, s.from_username, s.from_avatar_url).cents += inTrip;
      ensureSettled(s.to_user_id, s.to_username, s.to_avatar_url).cents -= inTrip;
      // Net of the transfers in both directions: sending one back is a reimbursement
      // received in reverse, and netting them is what keeps the final budget's
      // subtraction equal to the balance it is taken from.
      const shown = finalUnit(exact);
      reimbursedCents[s.to_user_id] = (reimbursedCents[s.to_user_id] || 0) + shown;
      reimbursedCents[s.from_user_id] = (reimbursedCents[s.from_user_id] || 0) - shown;
      const moved = { settlement_id: s.id, from_user_id: s.from_user_id, to_user_id: s.to_user_id };
      (movedRows[s.to_user_id] ??= []).push({ ...moved, cents: shown });
      (movedRows[s.from_user_id] ??= []).push({ ...moved, cents: -shown });
    }

    // Into the display currency as one set, then simplify — balances and flows are
    // derived from the same integers, so what the balances say is owed is exactly
    // what "Settle up" offers to move, down to the last cent (#1382).
    const ledger = Object.values(balances);
    const displayCents = allocateDisplayCents(ledger.map(b => b.cents), displayFactor);
    // Each component of the final budget is re-denominated as its own set, for the
    // same reason the balances are: rounding one person at a time lets the column
    // drift away from the figure it converted from. The final itself is then
    // subtracted in display cents rather than converted separately, so the three
    // lines the breakdown shows always add up to the total beside them, whatever
    // currency the viewer picked.
    const frontedDisplayCents = allocateDisplayCents(ledger.map(b => frontedCents[b.user_id] || 0), displayFactor);
    const reimbursedDisplayCents = allocateDisplayCents(ledger.map(b => reimbursedCents[b.user_id] || 0), displayFactor);

    // Calculate optimized payment flows (greedy algorithm)
    const people = ledger
      .map((b, i) => ({ user_id: b.user_id, username: b.username, avatar_url: b.avatar_url, cents: displayCents[i] }))
      .filter(b => b.cents !== 0);
    const debtors = people.filter(p => p.cents < 0).map(p => ({ ...p, amount: -p.cents }));
    const creditors = people.filter(p => p.cents > 0).map(p => ({ ...p, amount: p.cents }));

    // Sort by amount descending for efficient matching
    debtors.sort((a, b) => b.amount - a.amount);
    creditors.sort((a, b) => b.amount - a.amount);

    const flows: { from: { user_id: number; username: string; avatar_url: string | null }; to: { user_id: number; username: string; avatar_url: string | null }; amount: number }[] = [];

    let di = 0, ci = 0;
    while (di < debtors.length && ci < creditors.length) {
      const transfer = Math.min(debtors[di].amount, creditors[ci].amount);
      flows.push({
        from: { user_id: debtors[di].user_id, username: debtors[di].username, avatar_url: debtors[di].avatar_url },
        to: { user_id: creditors[ci].user_id, username: creditors[ci].username, avatar_url: creditors[ci].avatar_url },
        amount: transfer / 100,
      });
      debtors[di].amount -= transfer;
      creditors[ci].amount -= transfer;
      if (debtors[di].amount === 0) di++;
      if (creditors[ci].amount === 0) ci++;
    }

    return {
      balances: ledger.map((b, i) => ({
        user_id: b.user_id, username: b.username, avatar_url: b.avatar_url,
        balance: displayCents[i] / 100,
      })),
      flows,
      settlements,
      finalBudgets: ledger.map((b, i) => {
        // The rows behind each figure, converted against the figure itself: the
        // same largest-remainder split, with the cents already allocated to the
        // figure as the target, so each list adds up to the line it sits under.
        const fronted = frontedRows[b.user_id] || [];
        const moved = movedRows[b.user_id] || [];
        const frontedDisplay = allocateDisplayCents(fronted.map(r => r.cents), displayFactor, frontedDisplayCents[i]);
        const movedDisplay = allocateDisplayCents(moved.map(r => r.cents), displayFactor, reimbursedDisplayCents[i]);
        return {
          user_id: b.user_id, username: b.username, avatar_url: b.avatar_url,
          expenses: frontedDisplayCents[i] / 100,
          reimbursed: reimbursedDisplayCents[i] / 100,
          pending: displayCents[i] / 100,
          final: (frontedDisplayCents[i] - reimbursedDisplayCents[i] - displayCents[i]) / 100,
          sources: {
            fronted: fronted.map((r, k) => ({ item_id: r.item_id, cents: frontedDisplay[k] })),
            moved: moved.map((r, k) => ({ ...r, cents: movedDisplay[k] })),
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
      amount: r.amount, currency: r.currency ?? null, exchange_rate: r.exchange_rate ?? 1,
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
  ) {
    const newId = await this.budgetSettlementsRepo.insertSettlement({
      trip_id: tripId, from_user_id: data.from_user_id, to_user_id: data.to_user_id,
      amount: Math.round(data.amount * 100) / 100,
      currency: data.currency ? data.currency.toUpperCase() : null,
      exchange_rate: data.exchange_rate != null ? data.exchange_rate : 1,
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
  ) {
    const row = await this.budgetSettlementsRepo.findGuard(id, tripId);
    if (!row) return null;
    await this.budgetSettlementsRepo.update(id, {
      from_user_id: data.from_user_id, to_user_id: data.to_user_id, amount: Math.round(data.amount * 100) / 100,
      currency: [data.currency !== undefined, data.currency ? data.currency.toUpperCase() : null],
      exchange_rate: [data.exchange_rate !== undefined, data.exchange_rate !== undefined ? data.exchange_rate : 1],
      settled_at: [data.settled_at !== undefined, data.settled_at || null],
      note: [data.note !== undefined, settlementNote(data.note)],
    });
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
    const currency = await this.tripsRepo.getCurrency(tripId);
    return await this.getPerPersonSummary(tripId, await this.ratesForTripTotals(tripId, currency || 'EUR'));
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
  async settlement(tripId: string | number, base: string | undefined, tripCurrency: string, baseRate?: number) {
    const trip = (tripCurrency || 'EUR').toUpperCase();
    const effectiveBase = (base || trip).toUpperCase();
    const rates = (await this.exchangeRates.getRates(trip))
      ?? (effectiveBase === trip ? null : await this.exchangeRates.getRates(effectiveBase));
    return await this.calculateSettlement(tripId, { base: effectiveBase, rates, tripCurrency: trip, baseRate });
  }

  async create(tripId: string, data: Parameters<BudgetService['createBudgetItem']>[1] & { fallback_fx?: BudgetFallbackFx }) {
    await this.freezeForeignRate(tripId, data);
    return await this.createBudgetItem(tripId, data);
  }

  /** `id: number` — Plan 4 Task 8b (U6): `BudgetController.update`/the `costs.update` RPC method both parse/hand this a real row id now (`toRowId`/`num()`). */
  async update(id: number, tripId: string | number, data: Parameters<BudgetService['updateBudgetItem']>[2] & { fallback_fx?: BudgetFallbackFx }) {
    await this.freezeForeignRate(tripId, data, id);
    return await this.updateBudgetItem(id, tripId, data);
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

  async createSettlement(tripId: string | number, data: { from_user_id: number; to_user_id: number; amount: number; currency?: string | null; settled_at?: string | null; note?: string | null; fallback_fx?: BudgetFallbackFx }, userId: number) {
    if (!(await this.settlementPartiesOnTrip(tripId, data))) return null;
    // Freeze the FX rate for the display currency the amount was entered in so the
    // transfer keeps cancelling its expense when live rates drift (#1445).
    await this.freezeForeignRate(tripId, data);
    return await this.insertSettlement(tripId, data, userId);
  }

  /** `id: number` — Plan 4 Task 8b (U6): `BudgetController.updateSettlement` parses `:settlementId` via `toRowId` and threads the number here; the MCP tool's Zod-typed `settlementId` was already a number. */
  async updateSettlement(id: number, tripId: string | number, data: { from_user_id: number; to_user_id: number; amount: number; currency?: string | null; settled_at?: string | null; note?: string | null; fallback_fx?: BudgetFallbackFx }) {
    // Pass the settlement's stored currency so an edit that doesn't change it keeps
    // the already-frozen rate (#1445) — otherwise a live-rate drift would re-open a
    // settled position on an unrelated edit.
    if (!(await this.settlementPartiesOnTrip(tripId, data))) return null;
    const existing = await this.getSettlement(id, tripId);
    await this.freezeForeignRate(tripId, data, undefined, existing?.currency ?? null);
    return await this.applySettlementUpdate(id, tripId, data);
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
      const meta = reservation.metadata ? JSON.parse(reservation.metadata) : {};
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
      await this.reservationsRepo.setMetadata(reservation.id, JSON.stringify(meta));
      const updatedRes = await this.reservationsRepo.getFull(reservation.id);
      this.realtime.broadcast(tripId, 'reservation:updated', { reservation: updatedRes }, socketId);
    } catch (err) {
      console.error('[budget] Failed to sync price to reservation:', err);
    }
  }
}
