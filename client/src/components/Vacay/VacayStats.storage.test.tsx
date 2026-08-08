// FE-COMP-VCYSTAT-001 to FE-COMP-VCYSTAT-002
import React from 'react'
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { render, screen } from '../../../tests/helpers/render'
import { resetAllStores } from '../../../tests/helpers/store'
import { useVacayStore } from '../../store/vacayStore'
import { useAuthStore } from '../../store/authStore'
import VacayStats from './VacayStats'

const COLLAPSED_KEY_STAT = {
  user_id: 1, person_name: 'alice', person_color: '#3b82f6', year: 2026,
  vacation_days: 30, carried_over: 0, total_available: 30, used: 4, remaining: 26,
}

beforeEach(() => {
  resetAllStores()
  useAuthStore.setState({ user: { id: 1, username: 'alice', email: 'a@t.app', role: 'user' } as never })
  useVacayStore.setState({ selectedYear: 2026, stats: [COLLAPSED_KEY_STAT] })
})

afterEach(() => {
  vi.restoreAllMocks()
  localStorage.clear()
})

describe('VacayStats storage', () => {
  it('FE-COMP-VCYSTAT-001: a blocked localStorage still renders the expanded card', () => {
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => { throw new Error('denied') })
    render(<VacayStats />)

    // Expanded is the fallback, so the person's numbers are on screen.
    expect(screen.getByText('alice')).toBeInTheDocument()
  })

  it('FE-COMP-VCYSTAT-002: a persisted collapsed flag is honoured on mount', () => {
    localStorage.setItem('vacay-stats-collapsed', '1')
    render(<VacayStats />)

    expect(screen.queryByText('alice')).not.toBeInTheDocument()
  })
})
