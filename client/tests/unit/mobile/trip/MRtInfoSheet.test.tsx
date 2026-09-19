import { beforeEach, describe, expect, it } from 'vitest'
import MRtInfoSheet from '../../../../src/mobile/screens/trip/roadtrip/MRtInfoSheet'
import type { MTripShellApi, TripPlanner } from '../../../../src/mobile/screens/trip/MTripShell'
import { useAuthStore } from '../../../../src/store/authStore'
import { useSettingsStore } from '../../../../src/store/settingsStore'
import { useRoadtripPreferencesStore } from '../../../../src/store/roadtripPreferencesStore'
import type { RoadtripPreferences } from '@trek/shared'
import { buildPlanner, buildShell } from '../../../helpers/mobileTrip'
import { resetAllStores, seedStore } from '../../../helpers/store'
import { render, screen } from '../../../helpers/render'

// FE-MOB-RTINFO-001 to FE-MOB-RTINFO-015
//
// The sheet renders inside the real TranslationProvider, so the copy is asserted
// in English. Everything it shows comes out of the roadtrip preferences store,
// which is keyed by "<userId>:<tripId>".

const USER_ID = 7
const TRIP_ID = 4

/** An electric car with every limit filled in, so each row has a value to show. */
const FULL: RoadtripPreferences = {
  roadtrip_vehicle: 'electric',
  roadtrip_battery_kwh: 77,
  roadtrip_kwh_per_100: 18,
  roadtrip_battery_degradation: 8,
  roadtrip_fill_percent: 80,
  roadtrip_leg_minutes: 240,
  roadtrip_day_minutes: 480,
  roadtrip_day_start: '08:00',
  roadtrip_day_end: '19:00',
  roadtrip_avoid: 'toll,ferry',
}

function seedPreferences(preferences: RoadtripPreferences): void {
  useRoadtripPreferencesStore.setState({ byTrip: { [`${USER_ID}:${TRIP_ID}`]: preferences } })
}

function renderSheet(preferences: RoadtripPreferences = FULL, shellOverrides: Record<string, unknown> = {}) {
  seedPreferences(preferences)
  const planner = buildPlanner({ tripId: TRIP_ID } as unknown as Partial<TripPlanner>)
  const shell = buildShell({ sheet: { id: 'rtinfo' }, ...shellOverrides } as unknown as Partial<MTripShellApi>)
  render(<MRtInfoSheet planner={planner} shell={shell} />)
  return { planner, shell }
}

/** The value cell of one limit row, found through its label. */
function limitValue(label: string): string {
  const row = screen.getByText(label).parentElement
  return row?.lastElementChild?.textContent ?? ''
}

describe('MRtInfoSheet', () => {
  beforeEach(() => {
    resetAllStores()
    useRoadtripPreferencesStore.setState({ byTrip: {} })
    seedStore(useAuthStore, { user: { id: USER_ID } as never })
  })

  it('FE-MOB-RTINFO-001: stays closed while another sheet id is active', () => {
    renderSheet(FULL, { sheet: { id: 'rtstop' } })
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })

  it('FE-MOB-RTINFO-002: opens as the driving figures of the trip', () => {
    renderSheet()
    expect(screen.getByRole('dialog', { name: 'Driving figures' })).toBeInTheDocument()
    expect(screen.getByText('Vehicle')).toBeInTheDocument()
    expect(screen.getByText('Driving settings')).toBeInTheDocument()
  })

  it('FE-MOB-RTINFO-003: shows the range the stage plans with, worked out from the battery', () => {
    renderSheet()
    // 77 kWh less 8 % wear, at 18 kWh/100 km.
    expect(screen.getByText('394')).toBeInTheDocument()
    expect(screen.getByText('km')).toBeInTheDocument()
    expect(screen.getByText('per charge')).toBeInTheDocument()
    expect(screen.getByRole('img', { name: '394 km per charge' })).toBeInTheDocument()
  })

  it('FE-MOB-RTINFO-004: explains the fill, the block size and the battery wear under the bar', () => {
    renderSheet()
    expect(screen.getByText('A 80 % stop gives 315.2 km · One block = 50 km · 8 % lost to age')).toBeInTheDocument()
  })

  it('FE-MOB-RTINFO-005: reads the range in miles on an imperial account', () => {
    seedStore(useSettingsStore, { settings: { ...useSettingsStore.getState().settings, distance_unit: 'imperial' } })
    renderSheet()
    expect(screen.getByText('244.8')).toBeInTheDocument()
    expect(screen.getByText('mi')).toBeInTheDocument()
  })

  it('FE-MOB-RTINFO-006: prints every limit as its own value', () => {
    renderSheet()
    expect(limitValue('Longest drive at once')).toBe('4 h')
    expect(limitValue('Driving per day')).toBe('8 h')
    expect(limitValue('Daily travel times')).toBe('08:00 · 19:00')
    expect(limitValue('Fill up to')).toBe('80 %')
    expect(limitValue('Avoid where possible')).toBe('2 avoided')
  })

  it('FE-MOB-RTINFO-007: an unset limit reads "off" rather than zero', () => {
    renderSheet({})
    expect(limitValue('Longest drive at once')).toBe('off')
    expect(limitValue('Driving per day')).toBe('off')
    expect(limitValue('Daily travel times')).toBe('off')
    expect(limitValue('Avoid where possible')).toBe('off')
    expect(screen.queryByText('0')).not.toBeInTheDocument()
    expect(screen.queryByText('0 min')).not.toBeInTheDocument()
  })

  it('FE-MOB-RTINFO-008: an unset fill reads "full", because not saying means filling right up', () => {
    renderSheet({})
    expect(limitValue('Fill up to')).toBe('full')
    expect(screen.queryByText('100 %')).not.toBeInTheDocument()
  })

  it('FE-MOB-RTINFO-009: with no range the figure is a dash and the hint says where to set one', () => {
    renderSheet({})
    expect(screen.getByText('-')).toBeInTheDocument()
    expect(screen.getByRole('img', { name: 'No range set' })).toBeInTheDocument()
    expect(screen.getByText('Type a range, or fill in the figures below and TREK works it out.')).toBeInTheDocument()
  })

  it('FE-MOB-RTINFO-010: a half-set day window counts as no window at all', () => {
    renderSheet({ ...FULL, roadtrip_day_end: '' })
    expect(limitValue('Daily travel times')).toBe('off')
  })

  it('FE-MOB-RTINFO-011: stored avoidance reads "off" when no second routing engine can honour it', () => {
    // A self-hosted router and no Valhalla: the classes are stored but nothing applies them.
    seedStore(useSettingsStore, {
      settings: { ...useSettingsStore.getState().settings, routing_base_url: 'https://osrm.example', valhalla_base_url: '' },
    })
    renderSheet()
    expect(limitValue('Avoid where possible')).toBe('off')
  })

  it('FE-MOB-RTINFO-012: carries no control of any kind, only the way out', () => {
    renderSheet()
    const dialog = screen.getByRole('dialog', { name: 'Driving figures' })
    expect(screen.getAllByRole('button')).toHaveLength(1)
    expect(screen.getByRole('button', { name: 'Close' })).toBeInTheDocument()
    expect(dialog.querySelectorAll('input, select, textarea')).toHaveLength(0)
    for (const role of ['textbox', 'spinbutton', 'slider', 'switch', 'checkbox', 'combobox', 'radio'] as const) {
      expect(screen.queryByRole(role)).not.toBeInTheDocument()
    }
  })

  it('FE-MOB-RTINFO-013: closes with the footnote that names the desktop as the place to change them', () => {
    renderSheet()
    expect(screen.getByText(/These figures are set on the desktop/)).toBeInTheDocument()
  })

  it('FE-MOB-RTINFO-014: a combustion car reads per tank, out of tank size and consumption', () => {
    renderSheet({ roadtrip_vehicle: 'combustion', roadtrip_tank_litres: 60, roadtrip_litres_per_100: 7 })
    // 60 litres at 7 L/100 km, with no battery wear to take off it.
    expect(screen.getByRole('img', { name: '857 km per tank' })).toBeInTheDocument()
    expect(screen.getByText('One block = 50 km')).toBeInTheDocument()
    expect(screen.queryByText(/lost to age/)).not.toBeInTheDocument()
  })

  it('FE-MOB-RTINFO-015: a range too long to count in blocks gets a solid bar and no note', () => {
    renderSheet({ roadtrip_range_km: 2000 })
    expect(screen.getByRole('img', { name: '2000 km per tank' })).toBeInTheDocument()
    expect(screen.queryByText(/One block/)).not.toBeInTheDocument()
  })
})
