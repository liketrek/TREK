// FE-COMP-VCYREG-001 to FE-COMP-VCYREG-009
import { describe, it, expect, beforeEach } from 'vitest'
import { http, HttpResponse } from 'msw'
import { server } from '../../../tests/helpers/msw/server'
import { resetAllStores, seedStore } from '../../../tests/helpers/store'
import { useSettingsStore } from '../../store/settingsStore'
import { fetchRegionOptions, fetchSchoolHolidayRegionOptions } from './holidayRegions'

function holidaysRespond(rows: unknown) {
  server.use(http.get('/api/addons/vacay/holidays/:year/:country', () => HttpResponse.json(rows)))
}

function regionsRespond(body: unknown) {
  server.use(http.get('/api/addons/vacay/school-holidays/regions/:country', () => HttpResponse.json(body)))
}

beforeEach(() => {
  server.resetHandlers()
  resetAllStores()
})

describe('fetchRegionOptions', () => {
  it('FE-COMP-VCYREG-001: a country with only nationwide holidays offers no regions', async () => {
    holidaysRespond([
      { date: '2026-12-25', name: 'Christmas', localName: 'Weihnachten', global: true, counties: null },
    ])

    expect(await fetchRegionOptions('DE')).toEqual([])
  })

  it('FE-COMP-VCYREG-002: region-split data returns the full ISO subdivision list, sorted', async () => {
    holidaysRespond([
      { date: '2026-11-01', name: 'All Saints', localName: 'Allerheiligen', global: false, counties: ['DE-BY'] },
    ])

    const options = await fetchRegionOptions('DE')
    expect(options.length).toBeGreaterThan(15)
    expect(options[0].label).toBe('Baden-Württemberg')
    expect(options.map(o => o.value)).toContain('DE-NW')
    // The list stays alphabetical by label.
    expect([...options].sort((a, b) => a.label.localeCompare(b.label))).toEqual(options)
  })

  it('FE-COMP-VCYREG-003: a county code ISO does not know is kept with a derived label', async () => {
    holidaysRespond([
      { date: '2026-11-01', name: 'Local', localName: 'Local', global: false, counties: ['DE-ZZ'] },
    ])

    const options = await fetchRegionOptions('DE')
    expect(options.find(o => o.value === 'DE-ZZ')).toEqual({ value: 'DE-ZZ', label: 'ZZ' })
  })

  it('FE-COMP-VCYREG-004: a failing request degrades to no regions', async () => {
    holidaysRespond({ error: 'down' })
    server.use(http.get('/api/addons/vacay/holidays/:year/:country', () =>
      HttpResponse.json({ error: 'down' }, { status: 500 })))

    expect(await fetchRegionOptions('DE')).toEqual([])
  })
})

describe('fetchSchoolHolidayRegionOptions', () => {
  it('FE-COMP-VCYREG-005: unsupported and nationwide countries are not queried', async () => {
    expect(await fetchSchoolHolidayRegionOptions('US')).toEqual([])
    // Ireland is covered, but only at country level.
    expect(await fetchSchoolHolidayRegionOptions('IE')).toEqual([])
  })

  it('FE-COMP-VCYREG-006: a group country prefixes its codes and flattens nested children', async () => {
    regionsRespond({
      groups: [
        {
          code: 'NL-NO', shortName: 'NO', name: [{ language: 'EN', text: 'North' }],
          children: [{ code: 'NL-NO-1', name: [{ language: 'EN', text: 'Sub' }] }],
        },
      ],
      subdivisions: [],
    })

    expect(await fetchSchoolHolidayRegionOptions('NL')).toEqual([
      { value: 'NL|group:NL-NO', label: 'North' },
      { value: 'NL|group:NL-NO-1', label: 'North / Sub' },
    ])
  })

  it('FE-COMP-VCYREG-007: a subdivision country takes the name in the active language and falls back to the code', async () => {
    seedStore(useSettingsStore, { settings: { ...useSettingsStore.getState().settings, language: 'de' } })
    regionsRespond({
      groups: [],
      subdivisions: [
        { code: 'DE-BY', name: [{ language: 'DE', text: 'Bayern' }, { language: 'EN', text: 'Bavaria' }] },
        { code: 'DE-XX' },
      ],
    })

    expect(await fetchSchoolHolidayRegionOptions('DE')).toEqual([
      { value: 'DE-BY', label: 'Bayern' },
      { value: 'DE-XX', label: 'DE-XX' },
    ])
  })

  it('FE-COMP-VCYREG-009: a language the data has no name for falls back to English', async () => {
    regionsRespond({
      groups: [],
      subdivisions: [
        { code: 'DE-BY', name: [{ language: 'DE', text: 'Bayern' }, { language: 'EN', text: 'Bavaria' }] },
      ],
    })

    expect(await fetchSchoolHolidayRegionOptions('DE', 'fr')).toEqual([
      { value: 'DE-BY', label: 'Bavaria' },
    ])
  })

  it('FE-COMP-VCYREG-008: a failing region request degrades to no regions', async () => {
    server.use(http.get('/api/addons/vacay/school-holidays/regions/:country', () =>
      HttpResponse.json({ error: 'down' }, { status: 500 })))

    expect(await fetchSchoolHolidayRegionOptions('NL')).toEqual([])
  })
})
