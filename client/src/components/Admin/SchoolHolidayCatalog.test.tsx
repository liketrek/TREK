import { beforeEach, describe, expect, it, vi } from 'vitest'
import { http, HttpResponse } from 'msw'
import { within } from '@testing-library/react'
import { render, screen, fireEvent, waitFor } from '../../../tests/helpers/render'
import { server } from '../../../tests/helpers/msw/server'
import { resetAllStores } from '../../../tests/helpers/store'
import SchoolHolidayCatalog from './SchoolHolidayCatalog'
import SchoolHolidayRegionEditor from './SchoolHolidayRegionEditor'
import { fetchSchoolHolidayRegionOptions } from '../Vacay/holidayRegions'
import { useSchoolHolidayCountries } from '../Vacay/useSchoolHolidayCountries'
import { useVacayStore } from '../../store/vacayStore'
import type { SchoolHolidayRegionDetail } from '@trek/shared'

const region: SchoolHolidayRegionDetail = { id: 7, code: 'US-MANUAL-7', country: 'US', name: 'Seattle schools', revision: 1, holidays: [{ name: 'Winter break', startDate: '2026-12-20', endDate: '2027-01-06' }] }
const catalog = { countries: [{ code: 'US', name: 'USA' }], regions: [region] }
beforeEach(() => resetAllStores())

function enterDate(label: string, value: string) {
  const picker = within(screen.getByRole('group', { name: label }))
  fireEvent.click(picker.getByRole('button', { name: /enter.*manually/i }))
  const input = picker.getByRole('textbox')
  fireEvent.change(input, { target: { value } })
  fireEvent.blur(input)
}

describe('manual school holiday administration', () => {
  it('creates a country, a district and its named periods', async () => {
    let created = false
    const saves: unknown[] = []
    server.use(
      http.get('/api/school-holiday-catalog', () => HttpResponse.json({ countries: created ? catalog.countries : [], regions: [] })),
      http.post('/api/school-holiday-catalog/countries', async ({ request }) => { expect(await request.json()).toEqual({ code: 'US', name: 'USA' }); created = true; return HttpResponse.json(catalog.countries[0]) }),
      http.post('/api/school-holiday-catalog/countries/US/regions', async ({ request }) => { saves.push(await request.json()); return HttpResponse.json(region) }),
    )
    render(<SchoolHolidayCatalog />)
    await waitFor(() => expect(screen.getByRole('button', { name: 'Add country' })).toBeEnabled())
    fireEvent.click(screen.getByRole('button', { name: 'Add country' }))
    fireEvent.change(screen.getByLabelText('Country'), { target: { value: 'USA' } })
    fireEvent.change(screen.getByLabelText('Country code (e.g. US)'), { target: { value: 'us' } })
    fireEvent.click(screen.getByRole('button', { name: 'Save' }))
    await waitFor(() => expect(screen.getByRole('button', { name: 'Add region' })).toBeEnabled())
    fireEvent.click(screen.getByRole('button', { name: 'Add region' }))
    fireEvent.change(screen.getByLabelText('Region or school district'), { target: { value: 'Seattle schools' } })
    fireEvent.click(screen.getByRole('button', { name: 'Add holiday period' }))
    fireEvent.change(screen.getByLabelText('Holiday name'), { target: { value: 'Winter break' } })
    enterDate('Start date', '2026-12-20')
    enterDate('End date', '2027-01-06')
    fireEvent.click(screen.getByRole('button', { name: 'Save' }))
    await waitFor(() => expect(saves).toEqual([{ name: region.name, revision: 0, holidays: region.holidays }]))
    await waitFor(() => expect(screen.queryByLabelText('Holiday name')).not.toBeInTheDocument())
  })

  it('opens existing periods and keeps edits after a failed save', async () => {
    server.use(
      http.get('/api/school-holiday-catalog', () => HttpResponse.json(catalog)),
      http.get('/api/school-holiday-catalog/regions/7', () => HttpResponse.json(region)),
      http.put('/api/school-holiday-catalog/regions/7', () => HttpResponse.json({ error: 'This region changed. Reopen it before saving again.' }, { status: 409 })),
    )
    render(<SchoolHolidayCatalog />)
    fireEvent.click(await screen.findByRole('button', { name: 'Seattle schools' }))
    await screen.findByDisplayValue('Winter break')
    await waitFor(() => expect(screen.getByRole('button', { name: 'Save' })).toBeEnabled())
    fireEvent.change(screen.getByLabelText('Holiday name'), { target: { value: 'New name' } })
    fireEvent.click(screen.getByRole('button', { name: 'Save' }))
    expect(await screen.findByRole('alert')).toHaveTextContent('This region changed')
    expect(screen.getByLabelText('Holiday name')).toHaveValue('New name')
  })

  it('validates names and confirms discarding changes', async () => {
    const save = vi.fn()
    const close = vi.fn()
    render(<SchoolHolidayRegionEditor region={region} busy={false} error="" onClose={close} onSave={save} />)
    fireEvent.change(screen.getByLabelText('Holiday name'), { target: { value: ' ' } })
    fireEvent.submit(screen.getByRole('button', { name: 'Save' }).closest('form')!)
    expect(save).not.toHaveBeenCalled()
    expect(screen.getByRole('alert')).toHaveTextContent('Check the names and dates')
    fireEvent.click(screen.getByRole('button', { name: 'Cancel' }))
    expect(screen.getByText('Discard unsaved changes?')).toBeInTheDocument()
    expect(close).not.toHaveBeenCalled()
  })

  it('removes a period and saves an existing region without changing its revision token', () => {
    const save = vi.fn()
    render(<SchoolHolidayRegionEditor region={region} busy={false} error="" onClose={vi.fn()} onSave={save} />)
    fireEvent.click(screen.getByRole('button', { name: 'Delete Winter break' }))
    fireEvent.click(screen.getByRole('button', { name: 'Save' }))
    expect(save).toHaveBeenCalledWith({ name: region.name, revision: 1, holidays: [] })
  })

  it('blocks offline edits but still lets the dialog close', () => {
    const close = vi.fn()
    render(<SchoolHolidayRegionEditor region={region} busy={false} offline error="Offline" onClose={close} onSave={vi.fn()} />)
    expect(screen.getByRole('button', { name: 'Save' })).toBeDisabled()
    fireEvent.click(screen.getByRole('button', { name: 'Cancel' }))
    expect(close).toHaveBeenCalledOnce()
  })

  it('keeps deletion conflicts visible and allows retrying the catalog', async () => {
    server.use(
      http.get('/api/school-holiday-catalog', () => HttpResponse.json(catalog)),
      http.delete('/api/school-holiday-catalog/regions/7', ({ request }) => {
        expect(new URL(request.url).searchParams.get('revision')).toBe('1')
        return HttpResponse.json({ error: 'Region is in use' }, { status: 409 })
      }),
    )
    render(<SchoolHolidayCatalog />)
    fireEvent.click(await screen.findByRole('button', { name: 'Delete Seattle schools' }))
    fireEvent.click(screen.getByRole('button', { name: 'Delete' }))
    expect(await screen.findByRole('alert')).toHaveTextContent('Region is in use')
    fireEvent.click(screen.getByRole('button', { name: 'Retry' }))
    await waitFor(() => expect(screen.queryByRole('alert')).not.toBeInTheDocument())
    expect(screen.getByRole('button', { name: 'Seattle schools' })).toBeInTheDocument()
  })

  it('keeps national API calendars selectable alongside manual regions', async () => {
    server.use(http.get('/api/school-holiday-catalog', () => HttpResponse.json({ countries: [{ code: 'IE', name: 'Ireland' }], regions: [{ ...region, country: 'IE', code: 'IE-MANUAL-7' }] })))
    expect(await fetchSchoolHolidayRegionOptions('IE')).toEqual([{ value: 'IE', label: 'IE' }, { value: 'IE-MANUAL-7', label: region.name }])
  })

  it('keeps API regions available if loading the manual catalog fails', async () => {
    server.use(
      http.get('/api/school-holiday-catalog', () => HttpResponse.json({}, { status: 502 })),
      http.get('/api/addons/vacay/school-holidays/regions/DE', () => HttpResponse.json({ subdivisions: [{ code: 'DE-BY', name: [{ language: 'EN', text: 'Bavaria' }] }] })),
    )
    expect(await fetchSchoolHolidayRegionOptions('DE')).toEqual([{ value: 'DE-BY', label: 'Bavaria' }])
    await expect(fetchSchoolHolidayRegionOptions('US')).rejects.toThrow()
  })

  it('offers USA independently of provider countries and fetches only local regions', async () => {
    const provider = vi.fn(() => HttpResponse.json([]))
    server.use(http.get('/api/school-holiday-catalog', () => HttpResponse.json(catalog)), http.get('/api/addons/vacay/school-holidays/regions/US', provider))
    function Countries() { const { countries } = useSchoolHolidayCountries(); return <>{countries.map(country => <span key={country.value}>{country.label}</span>)}</> }
    render(<Countries />)
    expect(await screen.findByText('USA')).toBeInTheDocument()
    expect(await fetchSchoolHolidayRegionOptions('US')).toEqual([{ value: 'US-MANUAL-7', label: 'Seattle schools' }])
    expect(provider).not.toHaveBeenCalled()
  })

  it('keeps manual regions usable when a supported country provider fails', async () => {
    server.use(
      http.get('/api/school-holiday-catalog', () => HttpResponse.json({ countries: [{ code: 'DE', name: 'Germany' }], regions: [{ ...region, country: 'DE', code: 'DE-MANUAL-7' }] })),
      http.get('/api/addons/vacay/school-holidays/regions/DE', () => HttpResponse.json({}, { status: 502 })),
    )
    expect(await fetchSchoolHolidayRegionOptions('DE')).toEqual([{ value: 'DE-MANUAL-7', label: region.name }])
  })

  it('renders manual dates with inclusive boundaries without touching leave entries', async () => {
    server.use(http.get('/api/school-holiday-catalog/regions/7/holidays/2026', () => HttpResponse.json(region.holidays)))
    useVacayStore.setState({
      selectedYear: 2026,
      plan: { id: 1, school_holidays_enabled: true, holidays_enabled: false, holidays_region: null, block_weekends: true, company_holidays_enabled: true, carry_over_enabled: false, holiday_calendars: [{ id: 1, plan_id: 1, region: region.code, label: 'School', color: '#a5f3fc', sort_order: 0, type: 'school_holiday' }] },
      entries: [{ plan_id: 1, user_id: 1, date: '2026-12-23', fraction: 1, kind: 'vacation' }],
    })
    const entries = useVacayStore.getState().entries
    await useVacayStore.getState().loadHolidays(2026)
    expect(useVacayStore.getState().holidays['2026-12-20']).toBeDefined()
    expect(useVacayStore.getState().holidays['2026-12-31']).toBeDefined()
    expect(useVacayStore.getState().entries).toBe(entries)
  })
});
