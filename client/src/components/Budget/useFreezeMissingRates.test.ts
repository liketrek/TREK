// FE-FREEZE-RATES-001 to FE-FREEZE-RATES-006
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { act, renderHook, waitFor } from '@testing-library/react'
import { http, HttpResponse } from 'msw'
import type { BudgetUnconverted } from '@trek/shared'
import { server } from '../../../tests/helpers/msw/server'
import { resetAllStores, seedStore } from '../../../tests/helpers/store'
import { buildBudgetItem } from '../../../tests/helpers/factories'
import { useTripStore } from '../../store/tripStore'
import { setForcedOffline } from '../../sync/networkMode'
import { clearExchangeRateCache } from '../../hooks/useExchangeRates'
import { resetFreezeAttempts, useFreezeMissingRates } from './useFreezeMissingRates'

// The reporter's setup: an AUD trip whose server cannot fetch rates, and a VND bill that
// never froze one. The browser has today's AUD table.
const bill = () => buildBudgetItem({ id: 11, trip_id: 5, name: 'Pho', total_price: 8920000, currency: 'VND', exchange_rate: 1 })
const pending: BudgetUnconverted = { item_ids: [11], settlement_ids: [3], currencies: ['VND'] }

type Props = Parameters<typeof useFreezeMissingRates>[0]

function mountHook(over: Partial<Props> = {}) {
  const onHealed = vi.fn()
  const props: Props = { tripId: 5, tripCurrency: 'AUD', canEdit: true, unconverted: pending, onHealed, ...over }
  const view = renderHook((p: Props) => useFreezeMissingRates(p), { initialProps: props })
  return { ...view, onHealed, props }
}

let posted: unknown[] = []

function serveFreeze(reply: () => Response = () => HttpResponse.json({
  items: [{ ...bill(), exchange_rate: 18241.3 }],
  settlements: [{ id: 3, trip_id: 5, from_user_id: 2, to_user_id: 1, amount: 100000, currency: 'VND', exchange_rate: 18241.3 }],
  unresolved: [],
})) {
  server.use(http.post('/api/trips/5/budget/freeze-rates', async ({ request }) => {
    posted.push(await request.json())
    return reply()
  }))
}

/** Lets a heal that was never going to send anything run to its end. */
const settle = () => act(async () => { await new Promise(r => setTimeout(r, 30)) })

beforeEach(() => {
  resetAllStores()
  resetFreezeAttempts()
  clearExchangeRateCache()
  posted = []
  localStorage.setItem('trek_fx_AUD', JSON.stringify({ rates: { AUD: 1, VND: 18241.3, EUR: 0.61 }, ts: Date.now() }))
  seedStore(useTripStore, { budgetItems: [bill()] })
  serveFreeze()
})

afterEach(() => {
  setForcedOffline(false)
  vi.restoreAllMocks()
})

describe('useFreezeMissingRates', () => {
  it('FE-FREEZE-RATES-001: lends the fresh rates for the listed currencies and reloads once rows count', async () => {
    const { onHealed } = mountHook()

    await waitFor(() => expect(onHealed).toHaveBeenCalledTimes(1))
    // Only the currency the settlement is missing goes out, never the whole table.
    expect(posted).toEqual([{ fallback_fx: { base: 'AUD', rates: { VND: 18241.3 } } }])
    expect(useTripStore.getState().budgetItems[0].exchange_rate).toBe(18241.3)
  })

  it('FE-FREEZE-RATES-002: asks once per set of rows, however often the settlement is read', async () => {
    const { onHealed, props, rerender } = mountHook()
    await waitFor(() => expect(onHealed).toHaveBeenCalledTimes(1))

    // The same rows in another order, then again after a reload: nothing new to ask.
    rerender({ ...props, unconverted: { item_ids: [11], settlement_ids: [3], currencies: ['VND'] } })
    rerender({ ...props, unconverted: { settlement_ids: [3], item_ids: [11], currencies: ['VND'] } })
    await settle()
    expect(posted).toHaveLength(1)

    // Another row is another attempt.
    rerender({ ...props, unconverted: { item_ids: [11, 12], settlement_ids: [3], currencies: ['VND'] } })
    await waitFor(() => expect(posted).toHaveLength(2))
  })

  it('FE-FREEZE-RATES-003: never asks for a viewer, offline, or with nothing left out', async () => {
    mountHook({ canEdit: false })
    mountHook({ unconverted: { item_ids: [], settlement_ids: [], currencies: [] } })
    mountHook({ unconverted: undefined })
    setForcedOffline(true)
    mountHook({ unconverted: { item_ids: [21], settlement_ids: [], currencies: ['VND'] } })
    await settle()

    expect(posted).toEqual([])
  })

  it('FE-FREEZE-RATES-004: sends nothing when the browser has no rate for the currency either', async () => {
    const { onHealed } = mountHook({ unconverted: { item_ids: [31], settlement_ids: [], currencies: ['JPY'] } })
    await settle()

    expect(posted).toEqual([])
    expect(onHealed).not.toHaveBeenCalled()
  })

  it('FE-FREEZE-RATES-005: does not reload when the server froze nothing', async () => {
    serveFreeze(() => HttpResponse.json({ items: [], settlements: [], unresolved: ['VND'] }))
    const { onHealed } = mountHook()

    await waitFor(() => expect(posted).toHaveLength(1))
    await settle()
    expect(onHealed).not.toHaveBeenCalled()
  })

  it('FE-FREEZE-RATES-006: a refused heal is logged, not thrown, and not retried in a loop', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    serveFreeze(() => HttpResponse.json({ error: 'The trip currency changed. Reload and try again.' }, { status: 409 }))
    const { onHealed, props, rerender } = mountHook()

    await waitFor(() => expect(warn).toHaveBeenCalled())
    rerender({ ...props })
    await settle()
    expect(posted).toHaveLength(1)
    expect(onHealed).not.toHaveBeenCalled()
  })
})
