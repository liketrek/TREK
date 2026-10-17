import { sumMinor } from '@trek/shared'
import type {
  BudgetCreateItemRequest,
  BudgetCreateSettlementRequest,
  BudgetFreezeRatesRequest,
  BudgetFreezeRatesResponse,
  BudgetUpdateItemRequest,
  BudgetUpdateSettlementRequest,
} from '@trek/shared'
import { budgetApi } from '../api/client'
import { offlineDb, replaceTripRows } from '../db/offlineDb'
import { mutationQueue, generateUUID, nextTempId } from '../sync/mutationQueue'
import { isEffectivelyOffline } from '../sync/networkMode'
import { onlineThenCache } from './withOfflineFallback'
import type { BudgetItemPayer } from '@trek/shared'
import type { BudgetItem, BudgetItemMember } from '../types'

type SettlementResponse = Awaited<ReturnType<typeof budgetApi.settlement>>

/** Whether a settle-up write went out or waits in the queue for the connection. */
export interface SettlementWriteResult {
  queued: boolean
}

type ItemBody = BudgetCreateItemRequest | BudgetUpdateItemRequest
type People = Map<number, { username: string; avatar_url?: string | null }>

/** The names the cached trip members carry, for the split rows an offline write draws. */
async function peopleOf(tripId: number): Promise<People> {
  const rows = await offlineDb.tripMembers.where('tripId').equals(tripId).toArray()
  return new Map(rows.map(m => [m.id, { username: m.username, avatar_url: m.avatar_url ?? null }]))
}

function payersFrom(itemId: number, payers: { user_id: number; amount: number }[], people: People): BudgetItemPayer[] {
  return payers
    .filter(p => p.amount !== 0)
    .map(p => ({ user_id: p.user_id, amount: p.amount, budget_item_id: itemId, username: people.get(p.user_id)?.username ?? '', avatar_url: people.get(p.user_id)?.avatar_url ?? null }))
}

/**
 * The split as the server will store it: the members with their amounts when the
 * body lists them, the ids otherwise. A paid tick already on someone stays, as it
 * does on the server.
 */
function membersFrom(itemId: number, body: ItemBody, before: BudgetItemMember[], people: People): BudgetItemMember[] | undefined {
  const listed = body.members ?? body.member_ids?.map(user_id => ({ user_id, amount: null }))
  if (!listed) return undefined
  const paid = new Map(before.map(m => [m.user_id, m.paid]))
  return listed.map(m => ({
    user_id: m.user_id,
    amount: m.amount ?? null,
    paid: paid.get(m.user_id) ?? 0,
    budget_item_id: itemId,
    username: people.get(m.user_id)?.username ?? before.find(b => b.user_id === m.user_id)?.username ?? '',
    avatar_url: people.get(m.user_id)?.avatar_url ?? null,
  }))
}

/** The total the server derives: the payers' sum when there are payers, the entered amount otherwise. */
function totalFrom(body: ItemBody, payers: BudgetItemPayer[] | undefined, fallback: number): number {
  if (payers && payers.length > 0) return sumMinor(payers.map(p => p.amount)) / 100
  return body.total_price ?? fallback
}

/**
 * The expense an offline write leaves on screen until the queue replays it and
 * the server's own row replaces it. Request-only fields stay out of the row.
 */
function localItem(itemId: number, tripId: number, body: ItemBody, before: BudgetItem | undefined, people: People): BudgetItem {
  const { fallback_fx: _fx, member_ids: _ids, members: _members, payers: _payers, receipt_file_ids: receiptIds, ...fields } = body
  const payers = body.payers ? payersFrom(itemId, body.payers, people) : undefined
  const members = membersFrom(itemId, body, before?.members ?? [], people)
  return {
    ...(before ?? { sort_order: Number.MAX_SAFE_INTEGER, persons: null, receipts: [] }),
    ...fields,
    id: itemId,
    trip_id: tripId,
    name: fields.name || before?.name || '',
    category: fields.category || before?.category || 'other',
    total_price: totalFrom(body, payers, before?.total_price ?? 0),
    ...(payers ? { payers } : {}),
    ...(members ? { members, persons: members.length || null } : {}),
    ...(receiptIds ? { receipts: (before?.receipts ?? []).filter(r => receiptIds.includes(r.id)) } : {}),
  } as BudgetItem
}

function itemUrl(tripId: number | string, id: number, suffix = ''): string {
  return `/trips/${tripId}/budget/${id < 0 ? '{id}' : id}${suffix}`
}

/** Queue a write to one expense, held behind any older write to it. */
async function enqueueItemWrite(tripId: number | string, id: number, method: 'PUT' | 'DELETE', suffix: string, body: unknown): Promise<void> {
  await mutationQueue.enqueue({
    id: generateUUID(),
    tripId: Number(tripId),
    method,
    url: itemUrl(tripId, id, suffix),
    body,
    resource: 'budgetItems',
    entityId: id,
    ...(id < 0 ? { tempEntityId: id } : {}),
  })
  mutationQueue.sendSoon()
}

/**
 * Expenses and settle-up payments through the offline core. Reads fall back to
 * the Dexie copy; a write made offline lands there and in the mutation queue,
 * and replays once the connection is back. Budget writes carry no version token,
 * so an online write to an expense that still has an older one queued joins the
 * queue behind it (mustQueue).
 *
 * A payment gets no local row: its effect on the balances is worked out by the
 * server, so the ledger shows it once the queue has sent it. Receipts are file
 * uploads and stay online-only.
 */
export const budgetRepo = {
  async list(tripId: number | string): Promise<{ items: BudgetItem[] }> {
    return onlineThenCache(
      async () => {
        const result = await budgetApi.list(tripId)
        void replaceTripRows('budgetItems', Number(tripId), result.items)
        return result
      },
      async () => ({
        items: await offlineDb.budgetItems
          .where('trip_id').equals(Number(tripId)).toArray(),
      }),
    )
  },

  async create(tripId: number | string, data: BudgetCreateItemRequest): Promise<{ item: BudgetItem }> {
    if (!isEffectivelyOffline()) {
      const result: { item: BudgetItem } = await budgetApi.create(tripId, data)
      await offlineDb.budgetItems.put(result.item)
      return result
    }
    const tid = Number(tripId)
    const tempId = nextTempId()
    const item = localItem(tempId, tid, data, undefined, await peopleOf(tid))
    await offlineDb.transaction('rw', offlineDb.budgetItems, offlineDb.mutationQueue, async () => {
      await offlineDb.budgetItems.put(item)
      await mutationQueue.enqueue({
        id: generateUUID(),
        tripId: tid,
        method: 'POST',
        url: `/trips/${tripId}/budget`,
        body: data,
        resource: 'budgetItems',
        tempId,
      })
    })
    return { item }
  },

  async update(tripId: number | string, id: number, data: BudgetUpdateItemRequest): Promise<{ item: BudgetItem }> {
    if (!(await mutationQueue.mustQueue('budgetItems', id))) {
      const result: { item: BudgetItem } = await budgetApi.update(tripId, id, data)
      await offlineDb.budgetItems.put(result.item)
      return result
    }
    const tid = Number(tripId)
    const item = localItem(id, tid, data, await offlineDb.budgetItems.get(id), await peopleOf(tid))
    await offlineDb.budgetItems.put(item)
    await enqueueItemWrite(tripId, id, 'PUT', '', data)
    return { item }
  },

  async delete(tripId: number | string, id: number): Promise<void> {
    if (!(await mutationQueue.mustQueue('budgetItems', id))) {
      await budgetApi.delete(tripId, id)
      await offlineDb.budgetItems.delete(id)
      return
    }
    await offlineDb.budgetItems.delete(id)
    await enqueueItemWrite(tripId, id, 'DELETE', '', undefined)
  },

  async setMembers(tripId: number | string, id: number, userIds: number[]): Promise<{ members: BudgetItemMember[]; item: BudgetItem }> {
    if (!(await mutationQueue.mustQueue('budgetItems', id))) {
      const result: { members: BudgetItemMember[]; item: BudgetItem } = await budgetApi.setMembers(tripId, id, userIds)
      const cached = await offlineDb.budgetItems.get(id)
      if (cached) await offlineDb.budgetItems.put({ ...cached, ...result.item, members: result.members })
      return result
    }
    const tid = Number(tripId)
    const item = localItem(id, tid, { member_ids: userIds }, await offlineDb.budgetItems.get(id), await peopleOf(tid))
    await offlineDb.budgetItems.put(item)
    await enqueueItemWrite(tripId, id, 'PUT', '/members', { user_ids: userIds })
    return { members: item.members ?? [], item }
  },

  async togglePaid(tripId: number | string, id: number, userId: number, paid: boolean): Promise<void> {
    const queued = await mutationQueue.mustQueue('budgetItems', id)
    if (!queued) await budgetApi.togglePaid(tripId, id, userId, paid)
    // The server keeps the tick as 0/1, and so does the copy here.
    await offlineDb.budgetItems.where('id').equals(id).modify(item => {
      item.members = (item.members ?? []).map(m => (m.user_id === userId ? { ...m, paid: paid ? 1 : 0 } : m))
    })
    if (queued) await enqueueItemWrite(tripId, id, 'PUT', `/members/${userId}/paid`, { paid })
  },

  /**
   * The new order of the expenses. Offline it waits in the queue; an expense
   * created offline has no server id to name yet, so it keeps the place the
   * server gives a new one, at the end.
   */
  async reorderItems(tripId: number | string, orderedIds: number[]): Promise<void> {
    if (!isEffectivelyOffline()) {
      await budgetApi.reorderItems(tripId, orderedIds)
      return
    }
    await offlineDb.transaction('rw', offlineDb.budgetItems, offlineDb.mutationQueue, async () => {
      for (const [index, id] of orderedIds.entries()) {
        await offlineDb.budgetItems.update(id, { sort_order: index })
      }
      await mutationQueue.enqueue({
        id: generateUUID(),
        tripId: Number(tripId),
        method: 'PUT',
        url: `/trips/${tripId}/budget/reorder/items`,
        body: { orderedIds: orderedIds.filter(id => id > 0) },
      })
    })
  },

  async reorderCategories(tripId: number | string, orderedCategories: string[]): Promise<void> {
    if (!isEffectivelyOffline()) {
      await budgetApi.reorderCategories(tripId, orderedCategories)
      return
    }
    await mutationQueue.enqueue({
      id: generateUUID(),
      tripId: Number(tripId),
      method: 'PUT',
      url: `/trips/${tripId}/budget/reorder/categories`,
      body: { orderedCategories },
    })
  },

  /** Online only: the rate it freezes is today's, which a later replay would not be. */
  async freezeRates(tripId: number | string, data: BudgetFreezeRatesRequest): Promise<BudgetFreezeRatesResponse> {
    return budgetApi.freezeRates(tripId, data)
  },

  /**
   * The balances, flows and payments the server nets for the trip. Offline the
   * last ones read for the same display currency stand in.
   */
  async settlement(tripId: number | string, base: string, baseRate?: number | null): Promise<SettlementResponse> {
    const tid = Number(tripId)
    return onlineThenCache(
      async () => {
        const result = await budgetApi.settlement(tripId, base, baseRate)
        await offlineDb.budgetSettlements.put({ tripId: tid, base, settlement: result })
        return result
      },
      async () => {
        const cached = await offlineDb.budgetSettlements.get(tid)
        if (!cached || cached.base !== base) throw new Error('Settlement not available offline')
        return cached.settlement as SettlementResponse
      },
    )
  },

  async pendingWrites(tripId: number | string): Promise<number> {
    const rows = await mutationQueue.pending(Number(tripId))
    return rows.filter(m => m.resource === 'budgetItems' || m.resource === 'budgetSettlements' || m.url.includes('/budget/')).length
  },

  async createSettlement(tripId: number | string, data: BudgetCreateSettlementRequest): Promise<SettlementWriteResult> {
    if (!isEffectivelyOffline()) {
      await budgetApi.createSettlement(tripId, data)
      return { queued: false }
    }
    await mutationQueue.enqueue({
      id: generateUUID(),
      tripId: Number(tripId),
      method: 'POST',
      url: `/trips/${tripId}/budget/settlements`,
      body: data,
      resource: 'budgetSettlements',
    })
    return { queued: true }
  },

  async updateSettlement(tripId: number | string, id: number, data: BudgetUpdateSettlementRequest): Promise<SettlementWriteResult> {
    return settlementWrite(tripId, id, 'PUT', data, () => budgetApi.updateSettlement(tripId, id, data))
  },

  async deleteSettlement(tripId: number | string, id: number): Promise<SettlementWriteResult> {
    return settlementWrite(tripId, id, 'DELETE', undefined, () => budgetApi.deleteSettlement(tripId, id))
  },
}

async function settlementWrite(
  tripId: number | string,
  id: number,
  method: 'PUT' | 'DELETE',
  body: unknown,
  send: () => Promise<unknown>,
): Promise<SettlementWriteResult> {
  if (!(await mutationQueue.mustQueue('budgetSettlements', id))) {
    await send()
    return { queued: false }
  }
  await mutationQueue.enqueue({
    id: generateUUID(),
    tripId: Number(tripId),
    method,
    url: `/trips/${tripId}/budget/settlements/${id}`,
    body,
    resource: 'budgetSettlements',
    entityId: id,
  })
  mutationQueue.sendSoon()
  return { queued: true }
}
