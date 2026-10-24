import { describe, it, expect } from 'vitest'
import { buildAssignment, buildBudgetItem, buildDay, buildPlace, buildReservation } from '../../../tests/helpers/factories'
import { planCosts } from './planCosts'

const day1 = buildDay({ id: 1, day_number: 1, date: '2027-01-08' })
const day2 = buildDay({ id: 2, day_number: 2, date: '2027-01-09' })
const day3 = buildDay({ id: 3, day_number: 3, date: '2027-01-10' })
const days = [day1, day2, day3]

const bridges = buildPlace({ id: 50, name: 'Hanging Bridges', price: 100, currency: 'USD' })
const volcano = buildPlace({ id: 51, name: 'Volcano', price: 40 })
// The same place on two days, the way a stop visited twice is planned.
const assignments = {
  '1': [buildAssignment({ id: 500, day_id: 1, place: bridges })],
  '2': [buildAssignment({ id: 501, day_id: 2, place: bridges }), buildAssignment({ id: 502, day_id: 2, place: volcano })],
  '3': [],
}

const base = { days, assignments, reservations: [], tripCurrency: 'USD' }

describe('planCosts (#2551)', () => {
  it('reads the expenses, not the prices on the places, while Costs is on', () => {
    const costs = planCosts({ ...base, budgetItems: [], costsEnabled: true })
    expect(costs.total).toEqual([])
    expect(costs.byDay.size).toBe(0)
  })

  it('drops an expense from the day and the total as soon as it is gone', () => {
    const ticket = buildBudgetItem({ id: 7, total_price: 60, currency: null, place_id: 50 })
    const dinner = buildBudgetItem({ id: 8, total_price: 25, currency: null, expense_date: '2027-01-10' })
    const withBoth = planCosts({ ...base, budgetItems: [ticket, dinner], costsEnabled: true })
    expect(withBoth.total).toEqual([{ amount: 85, currency: 'USD' }])
    expect(withBoth.byDay.get(1)).toEqual([{ amount: 60, currency: 'USD' }])
    expect(withBoth.byDay.get(3)).toEqual([{ amount: 25, currency: 'USD' }])

    const afterDelete = planCosts({ ...base, budgetItems: [dinner], costsEnabled: true })
    expect(afterDelete.total).toEqual([{ amount: 25, currency: 'USD' }])
    expect(afterDelete.byDay.has(1)).toBe(false)
  })

  it('puts an expense on the day its booking starts, a hotel on its first night', () => {
    const hotel = buildReservation({ id: 90, type: 'hotel', accommodation_start_day_id: 2, accommodation_end_day_id: 3 })
    const tour = buildReservation({ id: 91, type: 'tour', day_id: null, reservation_time: '2027-01-10T09:00' })
    const items = [
      buildBudgetItem({ id: 1, total_price: 450, currency: null, reservation_id: 90, expense_date: '2026-10-01' }),
      buildBudgetItem({ id: 2, total_price: 80, currency: null, reservation_id: 91 }),
    ]
    const costs = planCosts({ ...base, reservations: [hotel, tour], budgetItems: items, costsEnabled: true })
    expect(costs.byDay.get(2)).toEqual([{ amount: 450, currency: 'USD' }])
    expect(costs.byDay.get(3)).toEqual([{ amount: 80, currency: 'USD' }])
  })

  it('counts an expense on no day, but in the total, when nothing ties it to one', () => {
    const insurance = buildBudgetItem({ total_price: 120, currency: null, expense_date: '2026-11-02' })
    const costs = planCosts({ ...base, budgetItems: [insurance], costsEnabled: true })
    expect(costs.byDay.size).toBe(0)
    expect(costs.total).toEqual([{ amount: 120, currency: 'USD' }])
  })

  it('counts a foreign expense at the rate frozen when it was entered, as Costs does', () => {
    // 1 USD bought 500 CRC when this was booked: 50 000 CRC counts as 100 USD.
    const booked = buildBudgetItem({ total_price: 50000, currency: 'CRC', exchange_rate: 500, place_id: 51 })
    const unfrozen = buildBudgetItem({ total_price: 30, currency: 'EUR', exchange_rate: 1, place_id: 51 })
    const costs = planCosts({ ...base, budgetItems: [booked, unfrozen], costsEnabled: true })
    expect(costs.byDay.get(2)).toEqual([{ amount: 100, currency: 'USD' }, { amount: 30, currency: 'EUR' }])
  })

  it('nets a refund against the expenses of its day', () => {
    const items = [
      buildBudgetItem({ total_price: 200, currency: null, place_id: 50 }),
      buildBudgetItem({ total_price: -50, currency: null, place_id: 50 }),
    ]
    const costs = planCosts({ ...base, budgetItems: items, costsEnabled: true })
    expect(costs.byDay.get(1)).toEqual([{ amount: 150, currency: 'USD' }])
    expect(costs.total).toEqual([{ amount: 150, currency: 'USD' }])
  })

  it('without Costs, counts a place price once, on the first day the place is planned', () => {
    const costs = planCosts({ ...base, budgetItems: [buildBudgetItem({ total_price: 999 })], costsEnabled: false })
    expect(costs.byDay.get(1)).toEqual([{ amount: 100, currency: 'USD' }])
    expect(costs.byDay.get(2)).toEqual([{ amount: 40, currency: 'USD' }])
    expect(costs.total).toEqual([{ amount: 140, currency: 'USD' }])
  })
})
