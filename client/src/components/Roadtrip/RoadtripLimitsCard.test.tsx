import React from 'react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { fireEvent, render, screen } from '../../../tests/helpers/render'
import { useSettingsStore } from '../../store/settingsStore'
import RoadtripLimitsCard from './RoadtripLimitsCard'

/**
 * FE-ROADTRIP-LIMITS-001..012 — the numbers that decide every warning.
 *
 * The one that matters is when a number is written. These fields had no local
 * state, so every keystroke was a settings PUT: typing "180" sent three, and
 * they raced. The value that decides whether a day is over budget could end up a
 * tenth of what was typed and only say so after the next reload.
 */

function open(onSave?: (key: string, value: number | string | boolean) => void) {
  render(<RoadtripLimitsCard onSave={onSave} />)
  fireEvent.click(screen.getByRole('button'))
}

/** Every number field, in the order the dialog lists them. */
const inputs = () => screen.getAllByRole('spinbutton') as HTMLInputElement[]

/**
 * Unfolds the car's own figures.
 *
 * They sit behind a disclosure now, open from the start only when one of them is already
 * stored — so a test that arrives with an empty vehicle has to ask for them, and one that
 * arrives with values does not.
 */
function openSpec() {
  const toggle = screen.queryByRole('button', { name: /Work it out from the car/i })
  if (toggle && toggle.getAttribute('aria-expanded') === 'false') fireEvent.click(toggle)
}

beforeEach(() => {
  useSettingsStore.setState({
    settings: {
      roadtrip_leg_minutes: 0,
      roadtrip_day_minutes: 0,
      roadtrip_range_km: 0,
      distance_unit: 'metric',
    } as never,
  })
})

describe('RoadtripLimitsCard', () => {
  it.each(['electric', 'petrol'])('saves manual range before fill changes for %s', kind => {
    useSettingsStore.setState({ settings: { roadtrip_vehicle: kind, roadtrip_range_km: 0, distance_unit: 'metric' } as never })
    const onSave = vi.fn()
    open(onSave)
    const range = screen.getByTestId('limit-range')
    fireEvent.change(range, { target: { value: '100' } })
    expect(onSave).not.toHaveBeenCalled()
    fireEvent.blur(range)
    expect(onSave).toHaveBeenCalledWith('roadtrip_range_km', 100)
    const fill = screen.getByTestId('limit-fill')
    fireEvent.change(fill, { target: { value: '80' } })
    fireEvent.blur(fill)
    expect(onSave).toHaveBeenCalledWith('roadtrip_fill_percent', 80)
  })

  it('FE-ROADTRIP-LIMITS-001: typing a number writes nothing until the field is left', () => {
    const onSave = vi.fn()
    open(onSave)

    const [leg] = inputs()
    fireEvent.change(leg, { target: { value: '1' } })
    fireEvent.change(leg, { target: { value: '18' } })
    fireEvent.change(leg, { target: { value: '180' } })

    // Three keystrokes used to be three unordered PUTs carrying 1, 18 and 180.
    expect(onSave).not.toHaveBeenCalled()
    expect(leg.value).toBe('180')
  })

  it('FE-ROADTRIP-LIMITS-002: leaving the field saves once, with what was typed', () => {
    const onSave = vi.fn()
    open(onSave)

    const [leg] = inputs()
    fireEvent.change(leg, { target: { value: '180' } })
    fireEvent.blur(leg)

    expect(onSave).toHaveBeenCalledTimes(1)
    expect(onSave).toHaveBeenCalledWith('roadtrip_leg_minutes', 180)
  })

  it('FE-ROADTRIP-LIMITS-003: Enter commits without having to click away', () => {
    const onSave = vi.fn()
    open(onSave)

    const [, day] = inputs()
    fireEvent.change(day, { target: { value: '540' } })
    fireEvent.keyDown(day, { key: 'Enter' })

    expect(onSave).toHaveBeenCalledWith('roadtrip_day_minutes', 540)
  })

  it('FE-ROADTRIP-LIMITS-004: leaving a field nobody touched saves nothing', () => {
    const onSave = vi.fn()
    open(onSave)

    fireEvent.blur(inputs()[0])

    expect(onSave).not.toHaveBeenCalled()
  })

  it('FE-ROADTRIP-LIMITS-005: retyping the value it already had is not a write', () => {
    useSettingsStore.setState({
      settings: { roadtrip_leg_minutes: 180, roadtrip_day_minutes: 0, roadtrip_range_km: 0, distance_unit: 'metric' } as never,
    })
    const onSave = vi.fn()
    open(onSave)

    const [leg] = inputs()
    fireEvent.change(leg, { target: { value: '180' } })
    fireEvent.blur(leg)

    expect(onSave).not.toHaveBeenCalled()
  })

  it('FE-ROADTRIP-LIMITS-006: clearing a field turns the limit off', () => {
    useSettingsStore.setState({
      settings: { roadtrip_leg_minutes: 180, roadtrip_day_minutes: 0, roadtrip_range_km: 0, distance_unit: 'metric' } as never,
    })
    const onSave = vi.fn()
    open(onSave)

    const [leg] = inputs()
    fireEvent.change(leg, { target: { value: '' } })
    fireEvent.blur(leg)

    expect(onSave).toHaveBeenCalledWith('roadtrip_leg_minutes', 0)
  })

  it('FE-ROADTRIP-LIMITS-007: the range field carries the reader own unit', () => {
    useSettingsStore.setState({
      settings: { roadtrip_leg_minutes: 0, roadtrip_day_minutes: 0, roadtrip_range_km: 0, distance_unit: 'imperial' } as never,
    })
    open(vi.fn())

    expect(screen.getByText('mi')).toBeInTheDocument()
    expect(screen.queryByText('km')).not.toBeInTheDocument()
  })

  it('FE-ROADTRIP-LIMITS-008: without a way to save, the dialog is read-only', () => {
    useSettingsStore.setState({
      settings: { roadtrip_leg_minutes: 180, roadtrip_day_minutes: 0, roadtrip_range_km: 0, distance_unit: 'metric' } as never,
    })
    // `onSave` absent is how the caller says the reader may look but not change.
    open(undefined)

    // Disabled rather than accepting a number it would then drop: a field that took 400
    // and sprang back to 180 on Enter, with no word about why, read as broken.
    for (const field of inputs()) expect(field).toBeDisabled()
    // What is stored is still there to be read.
    expect(screen.getByTestId('limit-legMinutes')).toHaveValue(180)
  })

  it('FE-ROADTRIP-LIMITS-009: naming the kind of car brings out its own figures', () => {
    useSettingsStore.setState({
      settings: { roadtrip_vehicle: 'electric', distance_unit: 'metric' } as never,
    })
    open(vi.fn())

    // Four are always out: leg, day, range, fill. The car's own three are folded away
    // until asked for, because nothing is stored on this vehicle yet.
    expect(inputs()).toHaveLength(4)
    openSpec()

    // Leg, day, range, fill, battery, consumption, wear. The three at the end do not
    // exist until there is a kind of car to have them.
    expect(inputs()).toHaveLength(7)
    expect(screen.getByText('kWh')).toBeInTheDocument()
    expect(screen.getByText('kWh/100 km')).toBeInTheDocument()
  })

  it('FE-ROADTRIP-LIMITS-010: a complete pair takes the range field over', () => {
    useSettingsStore.setState({
      settings: {
        roadtrip_vehicle: 'electric',
        roadtrip_battery_kwh: 58,
        roadtrip_kwh_per_100: 16,
        // Deliberately different from what the figures work out to: the point of
        // the row going read-only is that there is no longer a second answer.
        roadtrip_range_km: 500,
        distance_unit: 'metric',
      } as never,
    })
    open(vi.fn())

    expect(screen.getByTestId('limit-derived')).toHaveTextContent('363')
    // Leg, day, battery, consumption, wear, fill — the range input is gone.
    expect(inputs()).toHaveLength(6)
  })

  it('FE-ROADTRIP-LIMITS-011: gallons typed by an imperial reader are stored as litres', () => {
    useSettingsStore.setState({
      settings: { roadtrip_vehicle: 'combustion', distance_unit: 'imperial' } as never,
    })
    const onSave = vi.fn()
    open(onSave)

    // Leg, day, tank, consumption, range, fill.
    openSpec()
    const tank = screen.getByTestId('limit-tankLitres') as HTMLInputElement
    fireEvent.change(tank, { target: { value: '15' } })
    fireEvent.blur(tank)

    // 15 US gallons, not 15 litres. Storing the number as typed would have made
    // every fuel warning fire at a quarter of the right distance.
    expect(onSave).toHaveBeenCalledWith('roadtrip_tank_litres', 56.78)
  })
  it('FE-ROADTRIP-LIMITS-012: the range answers while the figure is still being typed', () => {
    useSettingsStore.setState({
      settings: {
        roadtrip_vehicle: 'electric',
        roadtrip_battery_kwh: 58,
        roadtrip_kwh_per_100: 16,
        distance_unit: 'metric',
      } as never,
    })
    const onSave = vi.fn()
    open(onSave)

    openSpec()
    // By name rather than by position: the rows are no longer at fixed indices now that
    // the car's figures live behind a disclosure.
    const consumption = screen.getByTestId('limit-kwhPer100') as HTMLInputElement
    fireEvent.change(consumption, { target: { value: '20' } })

    // 58 kWh at 20 per hundred is 290 km, shown before anything is written: the gauge
    // is the argument that these figures ARE the range, and it only makes it if it
    // answers now rather than after the field is left.
    expect(screen.getAllByText('290').length).toBeGreaterThan(0)
    expect(onSave).not.toHaveBeenCalled()
  })

  /**
   * The two switches over the route line itself.
   *
   * Both are off by default and both change what the map draws, so what is asserted is
   * that each reports its own key and that neither is written until it is pressed.
   */
  describe('the route line', () => {
    it('FE-ROADTRIP-LIMITS-013: joining the days up is off until it is asked for', () => {
      const onSave = vi.fn()
      open(onSave)

      const toggle = screen.getByRole('button', { name: 'Connect the days' })
      expect(toggle).toHaveAttribute('aria-pressed', 'false')
      fireEvent.click(toggle)
      // Costs a routing request per join and changes every day's kilometres, so it is a
      // decision rather than a default.
      expect(onSave).toHaveBeenCalledWith('roadtrip_connect_days', true)
    })

    it('FE-ROADTRIP-LIMITS-014: a colour per day is its own switch', () => {
      const onSave = vi.fn()
      open(onSave)

      fireEvent.click(screen.getByRole('button', { name: 'A colour per day' }))
      expect(onSave).toHaveBeenCalledWith('roadtrip_day_colors', true)
      expect(onSave).toHaveBeenCalledTimes(1)
    })

    it('FE-ROADTRIP-LIMITS-015: a switch that is on reports the way back off', () => {
      useSettingsStore.setState({
        settings: { roadtrip_connect_days: true, distance_unit: 'metric' } as never,
      })
      const onSave = vi.fn()
      open(onSave)

      const toggle = screen.getByRole('button', { name: 'Connect the days' })
      expect(toggle).toHaveAttribute('aria-pressed', 'true')
      fireEvent.click(toggle)
      expect(onSave).toHaveBeenCalledWith('roadtrip_connect_days', false)
    })

    it('FE-ROADTRIP-LIMITS-018: starting and ending each day at the stay is off until it is asked for', () => {
      const onSave = vi.fn()
      open(onSave)

      const toggle = screen.getByRole('button', { name: 'Start and end each day at your stay' })
      // Missing is off: a trip drives as it always has until somebody switches it on.
      expect(toggle).toHaveAttribute('aria-pressed', 'false')
      fireEvent.click(toggle)
      expect(onSave).toHaveBeenCalledWith('roadtrip_hotel_bookends', true)
      expect(onSave).toHaveBeenCalledTimes(1)
      // What it does is said under it for everybody to read, and the switch is described by
      // that sentence, so a screen reader hears it with the switch rather than never.
      const hint = screen.getByText(
        'After a booked night the day starts at that stay, and before one it ends at the stay booked for that night.',
      )
      expect(toggle).toHaveAttribute('aria-describedby', hint.id)
      expect(hint.id).not.toBe('')
      expect(screen.queryByRole('tooltip')).toBeNull()
      // A switch that needs no sentence is described by none.
      expect(screen.getByRole('button', { name: 'Connect the days' })).not.toHaveAttribute('aria-describedby')
    })

    it('FE-ROADTRIP-LIMITS-019: switched on, it reads on and reports the way back off', () => {
      useSettingsStore.setState({
        settings: { roadtrip_hotel_bookends: true, distance_unit: 'metric' } as never,
      })
      const onSave = vi.fn()
      open(onSave)

      const toggle = screen.getByRole('button', { name: 'Start and end each day at your stay' })
      expect(toggle).toHaveAttribute('aria-pressed', 'true')
      fireEvent.click(toggle)
      expect(onSave).toHaveBeenCalledWith('roadtrip_hotel_bookends', false)
    })

    it('FE-ROADTRIP-LIMITS-021: switched on, the button says so with the bed, instead of saying nothing is set', () => {
      const off = render(<RoadtripLimitsCard onSave={vi.fn()} />)
      expect(screen.getByText('None set')).toBeInTheDocument()
      expect(off.container.querySelector('svg.lucide-bed-double')).toBeNull()
      off.unmount()

      useSettingsStore.setState({
        settings: { roadtrip_hotel_bookends: true, distance_unit: 'metric' } as never,
      })
      const { container } = render(<RoadtripLimitsCard onSave={vi.fn()} />)
      expect(screen.queryByText('None set')).toBeNull()
      const bed = container.querySelector('svg.lucide-bed-double')!
      expect(bed).toHaveAttribute('aria-label', 'Start and end each day at your stay')
      // A sign alone: the switch has no figure to put beside it.
      expect(bed.parentElement!.nextElementSibling).toBeNull()
      expect(screen.getByRole('button')).toHaveAccessibleName(expect.stringContaining('Start and end each day at your stay'))
    })
  })

  /**
   * A member without the right to edit days gets the dialog without a way to save. Every
   * control has to say so by being disabled: a switch that flips and stays off, or a
   * field that takes a number and springs back, is a fault report waiting to happen.
   */
  describe('read-only', () => {
    it('FE-ROADTRIP-LIMITS-016: the kind of car and its figures cannot be changed', () => {
      useSettingsStore.setState({
        settings: { roadtrip_vehicle: 'electric', roadtrip_battery_kwh: 58, distance_unit: 'metric' } as never,
      })
      open(undefined)

      for (const name of ['Either', 'Petrol', 'Electric']) {
        expect(screen.getByRole('radio', { name })).toBeDisabled()
      }
      // The stored figure holds the disclosure open, so the car's own rows are on show.
      expect(screen.getByTestId('limit-batteryKwh')).toBeDisabled()
      expect(screen.getByTestId('limit-batteryKwh')).toHaveValue(58)
      expect(screen.getByTestId('limit-fill')).toBeDisabled()
    })

    it('FE-ROADTRIP-LIMITS-017: the switches over the route line are not offered', () => {
      useSettingsStore.setState({
        settings: { roadtrip_connect_days: true, distance_unit: 'metric' } as never,
      })
      open(undefined)

      expect(screen.queryByRole('button', { name: 'Connect the days' })).not.toBeInTheDocument()
      expect(screen.queryByRole('button', { name: 'A colour per day' })).not.toBeInTheDocument()
      // The rows stay in the dialog, the same way the service-stop and hazard rows do
      // without a way to save: a switch withheld is not a setting that vanished.
      expect(screen.getByText('Connect the days')).toBeInTheDocument()
      expect(screen.getByText('A colour per day')).toBeInTheDocument()
    })

    it('FE-ROADTRIP-LIMITS-020: the stay switch shows its row and offers no switch', () => {
      useSettingsStore.setState({
        settings: { roadtrip_hotel_bookends: true, distance_unit: 'metric' } as never,
      })
      open(undefined)

      expect(screen.queryByRole('button', { name: 'Start and end each day at your stay' })).not.toBeInTheDocument()
      expect(screen.getByText('Start and end each day at your stay')).toBeInTheDocument()
    })
  })
})

vi.mock('../../hooks/useRoadtripSettings', () => ({
  useRoadtripSettings: (select: (preferences: import('@trek/shared').RoadtripPreferences) => unknown) => useSettingsStore(state => select(state.settings as import('@trek/shared').RoadtripPreferences)),
}))

it('shares service stops with Days by default and lets the trip turn it off', () => {
  const onSave = vi.fn()
  open(onSave)
  const toggle = screen.getByRole('button', { name: 'Show in Days too' })
  expect(toggle).toHaveAttribute('aria-pressed', 'true')
  fireEvent.click(toggle)
  expect(onSave).toHaveBeenCalledWith('roadtrip_service_stops_in_days', false)
})
