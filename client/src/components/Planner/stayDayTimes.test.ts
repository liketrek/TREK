// FE-PLANNER-STAYTIMES-001 to FE-PLANNER-STAYTIMES-004
import { describe, it, expect } from 'vitest'
import { stayDayTimes } from './stayDayTimes'

const stay = { start_day_id: 1, end_day_id: 3, check_in: '15:00', check_out: '10:00' }

describe('stayDayTimes', () => {
  it('FE-PLANNER-STAYTIMES-001: the arrival day keeps only the check-in', () => {
    expect(stayDayTimes(stay, 1)).toEqual({ checkIn: true, checkOut: false })
  })

  it('FE-PLANNER-STAYTIMES-002: the departure day keeps only the check-out', () => {
    expect(stayDayTimes(stay, 3)).toEqual({ checkIn: false, checkOut: true })
  })

  it('FE-PLANNER-STAYTIMES-003: a night in the middle shows neither time', () => {
    expect(stayDayTimes(stay, 2)).toEqual({ checkIn: false, checkOut: false })
  })

  it('FE-PLANNER-STAYTIMES-004: a stay within one day shows both, and an unset time never shows', () => {
    expect(stayDayTimes({ ...stay, end_day_id: 1 }, 1)).toEqual({ checkIn: true, checkOut: true })
    expect(stayDayTimes({ ...stay, check_in: null }, 1)).toEqual({ checkIn: false, checkOut: false })
  })
})
