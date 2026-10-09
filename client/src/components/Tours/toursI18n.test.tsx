import { beforeEach, describe, expect, it, vi } from 'vitest'
import { within } from '@testing-library/react'
import en from '@trek/shared/i18n/en'
import de from '@trek/shared/i18n/de'
import fr from '@trek/shared/i18n/fr'
import type { TourListItem } from '@trek/shared'
import { fireEvent, render, screen, waitFor } from '../../../tests/helpers/render'
import { resetAllStores, seedStore } from '../../../tests/helpers/store'
import { useSettingsStore } from '../../store/settingsStore'
import { useTranslation } from '../../i18n'
import { analyzeRouteGeometry } from '../../utils/routeGeometry'
import TourListRow from './TourListRow'
import { TourPlannerRail, TourPlannerToursRail } from './planner/TourPlannerPanels'
import type { TourPlannerController } from './planner/useTourPlanner'

vi.mock('../../../../server/src/config', () => { throw new Error('Config initialization is forbidden in client tests') })
vi.mock('../../../../server/src/db/database', () => { throw new Error('Legacy database imports are forbidden in client tests') })
vi.mock('../../../../server/src/nest/database/database.service', () => { throw new Error('Database service imports are forbidden in client tests') })
vi.mock('better-sqlite3', () => { throw new Error('SQLite imports are forbidden in client tests') })

const tour: TourListItem = {
  place_id: 42, name: 'Ridge walk', tour_type: 'hike', distance: 4,
  elevation_gain: 100, elevation_loss: 80, duration: 60, difficulty: null,
  wanderer_ref: null, match_confidence: 1,
  max_hiking_difficulty: 2, planned: false, caution: false,
}

function toursText(strings: typeof en, key: string): string {
  const value = strings[key]
  if (typeof value !== 'string') throw new Error(`Missing Tours text: ${key}`)
  return value
}

function planner(overrides: Partial<TourPlannerController>): TourPlannerController {
  return {
    canEdit: true, canAssign: true,
    mode: { type: 'neutral' }, status: 'empty', error: null, name: '',
    maxHikingDifficulty: 2, waypoints: [], hasUnsavedChanges: false,
    draftRestored: false, newTourConfirmationOpen: false,
    readOnlyGpxTour: null, readOnlyGpxAnalysis: null,
    route: null, routeAnalysis: null, elevationProfileExpanded: true,
    ...overrides,
  } as TourPlannerController
}

function assertNoRawToursKeys() {
  const visible = [document.body.textContent, ...Array.from(document.querySelectorAll('[aria-label], [title], [placeholder]'))
    .flatMap(element => ['aria-label', 'title', 'placeholder'].map(attribute => element.getAttribute(attribute)))]
    .filter(Boolean).join(' ')
  expect(visible).not.toMatch(/\b(?:tours|tourTypes)\.[a-zA-Z]+/)
}

beforeEach(() => {
  resetAllStores()
  seedStore(useSettingsStore, { settings: { language: 'en', distance_unit: 'metric' } })
})

describe('Tours English and German copy', () => {
  it('has exact merged Tours keys and matching interpolation parameters in both languages', () => {
    const keys = Object.keys(en).filter(key => key.startsWith('tours.') || key.startsWith('tourTypes.'))
    expect(keys.length).toBeGreaterThan(100)
    expect(toursText(de, 'trip.tabs.tourPlanner')).toBe('Touren')
    expect(Object.keys(de).filter(key => key.startsWith('tours.') || key.startsWith('tourTypes.')).sort()).toEqual(keys.sort())
    for (const key of keys) {
      const params = (text: string) => [...text.matchAll(/\{([^{}]+)\}/g)].map(match => match[1]).sort()
      expect(params(toursText(de, key)), key).toEqual(params(toursText(en, key)))
    }
    for (let level = 1; level <= 6; level++) {
      expect(en[`tours.planner.difficulty.t${level}`]).toMatch(new RegExp(`^T${level} `))
      expect(de[`tours.planner.difficulty.t${level}`]).toMatch(new RegExp(`^T${level} `))
    }
    expect(de['tours.planner.safetyNoteDetails']).toMatch(/OSM.*Wetter.*Sperrungen/)
    expect(de['tours.planner.difficulty.t3Warning']).toMatch(/Trittsicherheit/)
    expect(de['tours.planner.difficulty.alpineBody']).toMatch(/OSM/)
    expect(toursText(en, 'tours.planner.breaksAdditionalInfo')).toBe('Optional whole minutes added to calculated walking time.')
    expect(toursText(en, 'tours.planner.plannedTotalInfo')).toBe('Calculated planned total duration.')
    expect(toursText(de, 'tours.planner.breaksAdditionalInfo')).toBe('Optionale ganze Minuten, die zur berechneten Gehzeit hinzukommen.')
    expect(toursText(de, 'tours.planner.plannedTotalInfo')).toBe('Berechnete geplante Gesamtdauer.')
  })

  for (const [language, neutral, newTitle, editTitle, gpxTitle, back] of [
    ['en', 'Plan a tour', 'New tour', 'Edit tour', 'GPX tour', 'Back to Tours'],
    ['de', 'Tour planen', 'Neue Tour', 'Tour bearbeiten', 'GPX-Tour', 'Zurück zu den Touren'],
  ]) {
    it(`${language}: renders the four modes, status, safety and accessibility without raw keys`, async () => {
      seedStore(useSettingsStore, { settings: { language } })
      const { rerender } = render(<TourPlannerRail planner={planner({})} />)
      expect(await screen.findByText(neutral)).toBeInTheDocument()
      assertNoRawToursKeys()

      const waypoint = { id: 'first', lat: 48, lng: 11, role: 'start' as const }
      rerender(<TourPlannerRail planner={planner({
        mode: { type: 'new-draft' }, status: 'routing', hasUnsavedChanges: true,
        draftRestored: true, waypoints: [waypoint], maxHikingDifficulty: 3,
      })} />)
      expect(screen.getByRole('heading', { name: newTitle })).toBeInTheDocument()
      const strings = language === 'de' ? de : en
      expect(screen.getByText(toursText(strings, 'tours.planner.restored'))).toBeInTheDocument()
      expect(screen.getByText(toursText(strings, 'tours.planner.status.routing'))).toBeInTheDocument()
      expect(screen.getByText(toursText(strings, 'tours.planner.difficulty.t3Warning'))).toBeInTheDocument()
      expect(screen.getByText((_, element) => element?.tagName === 'SPAN' && element.textContent?.includes(toursText(strings, 'tours.planner.safetyNoteDetails')) === true)).toBeInTheDocument()
      expect(screen.getByLabelText(language === 'de' ? 'Wegpunkt 1' : 'Waypoint 1')).toBeInTheDocument()
      expect(screen.getByRole('button', { name: language === 'de' ? 'Maximale Wegschwierigkeit' : 'Maximum trail difficulty' })).toBeInTheDocument()
      assertNoRawToursKeys()

      rerender(<TourPlannerRail planner={planner({ mode: { type: 'edit-saved', placeId: 42 }, editingPlaceId: 42 })} />)
      expect(screen.getByRole('heading', { name: editTitle })).toBeInTheDocument()
      expect(screen.getByRole('button', { name: back })).toHaveAttribute('aria-label', back)
      assertNoRawToursKeys()

      const geometry = JSON.stringify([[48, 11, 500], [48.01, 11.02, 550]])
      rerender(<TourPlannerRail planner={planner({
        mode: { type: 'view-gpx', placeId: 42, tour },
        readOnlyGpxTour: { tour, routeGeometry: geometry },
        readOnlyGpxAnalysis: analyzeRouteGeometry(geometry),
      })} />)
      expect(screen.getByRole('heading', { name: gpxTitle })).toBeInTheDocument()
      expect(screen.getByRole('button', { name: language === 'de' ? 'Höhenprofil einklappen' : 'Collapse elevation profile' })).toHaveAttribute('aria-expanded', 'true')
      assertNoRawToursKeys()
    })
  }

  it('German ADD row and save outcome have localized badges, labels and day picker', async () => {
    seedStore(useSettingsStore, { settings: { language: 'de' } })
    const { rerender } = render(<TourListRow tour={tour} onSelect={() => {}} />)
    await waitFor(() => expect(screen.getByLabelText(toursText(de, 'tours.planner.difficulty.t2'))).toBeInTheDocument())
    const onAssignToDay = vi.fn()
    rerender(<TourPlannerToursRail planner={planner({ saveOutcome: tour, mode: { type: 'edit-saved', placeId: 42 } })} tours={[tour]} days={[{ id: 7, title: 'Gipfeltag', date: '2026-05-15' } as never]} loading={false} onAssignToDay={onAssignToDay} onViewGpxTour={vi.fn()} />)
    const saveBanner = screen.getByText(toursText(de, 'tours.planner.saved')).closest('[role="status"]') as HTMLElement
    expect(within(saveBanner).getByRole('button', { name: toursText(de, 'tours.planner.planAnother') })).toBeInTheDocument()
    expect(within(saveBanner).queryByRole('button', { name: toursText(de, 'tours.planner.assignToDay') })).not.toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: `${toursText(de, 'tours.addToDay')}: ${tour.name}` }))
    const dayOption = screen.getByRole('button', { name: /Gipfeltag/ })
    expect(dayOption).toHaveTextContent(/Tag 1/)
    fireEvent.click(dayOption)
    await waitFor(() => expect(onAssignToDay).toHaveBeenCalledWith(42, 7))
    assertNoRawToursKeys()
  })

  it('German routing, elevation, save errors and alpine acknowledgement use translated copy', async () => {
    seedStore(useSettingsStore, { settings: { language: 'de' } })
    const { rerender } = render(<TourPlannerRail planner={planner({ mode: { type: 'new-draft' } })} />)
    await screen.findByRole('heading', { name: toursText(de, 'tours.planner.newTitle') })
    for (const [status, key] of [
      ['routing-failed', 'tours.planner.status.routingFailed'],
      ['enriching-elevation', 'tours.planner.status.elevation'],
      ['elevation-failed', 'tours.planner.status.elevationFailed'],
      ['saving', 'tours.planner.status.saving'],
    ] as const) {
      rerender(<TourPlannerRail planner={planner({ mode: { type: 'new-draft' }, status, error: null })} />)
      expect(screen.getByText(toursText(de, key))).toBeInTheDocument()
      assertNoRawToursKeys()
    }
    rerender(<TourPlannerRail planner={planner({ mode: { type: 'new-draft' }, status: 'ready', error: 'save' })} />)
    expect(screen.getByText(toursText(de, 'tours.planner.status.saveFailed'))).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: toursText(de, 'tours.planner.maxDifficulty') }))
    fireEvent.click(screen.getByRole('button', { name: toursText(de, 'tours.planner.difficulty.t4') }))
    expect(screen.getByRole('heading', { name: toursText(de, 'tours.planner.difficulty.alpineTitle') })).toBeInTheDocument()
    expect(screen.getByText(toursText(de, 'tours.planner.difficulty.alpineBody'))).toBeInTheDocument()
    assertNoRawToursKeys()
  })

  it('German dirty-draft confirmation and GPX missing-elevation text are localized', async () => {
    seedStore(useSettingsStore, { settings: { language: 'de' } })
    const { rerender } = render(<TourPlannerRail planner={planner({ mode: { type: 'new-draft' }, hasUnsavedChanges: true })} />)
    await screen.findByRole('heading', { name: toursText(de, 'tours.planner.newTitle') })
    fireEvent.click(screen.getByRole('button', { name: toursText(de, 'tours.planner.backToTours') }))
    expect(screen.getByRole('heading', { name: toursText(de, 'tours.planner.discardTitle') })).toBeInTheDocument()
    expect(screen.getByText(toursText(de, 'tours.planner.discardBody'))).toBeInTheDocument()
    expect(screen.getByRole('button', { name: toursText(de, 'tours.planner.discardUnsaved') })).toBeInTheDocument()
    assertNoRawToursKeys()

    rerender(<TourPlannerRail planner={planner({
      mode: { type: 'view-gpx', placeId: tour.place_id, tour },
      readOnlyGpxTour: { tour, routeGeometry: null },
    })} />)
    expect(screen.getByText(toursText(de, 'tours.planner.gpxNoGeometry'))).toBeInTheDocument()
    expect(screen.getByText(toursText(de, 'tours.detail.gpxReadOnly'))).toBeInTheDocument()
    assertNoRawToursKeys()
  })

  it('French Tours copy loads from the registered locale domain', async () => {
    seedStore(useSettingsStore, { settings: { language: 'fr' } })
    function Sample() {
      const { t } = useTranslation()
      return <span>{t('tours.planner.neutralTitle')}</span>
    }
    render(<Sample />)
    await waitFor(() => expect(document.documentElement.lang).toBe('fr'))
    expect(await screen.findByText(toursText(fr, 'tours.planner.neutralTitle'))).toBeInTheDocument()
    assertNoRawToursKeys()
  })
})