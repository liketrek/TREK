import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { placesApi } from '../../../../src/api/client'
import ImpFileStep from '../../../../src/mobile/screens/trip/sheets/ImpFileStep'
import type { TripPlanner } from '../../../../src/mobile/screens/trip/MTripShell'
import { buildPlanner } from '../../../helpers/mobileTrip'
import { resetAllStores } from '../../../helpers/store'
import { fireEvent, render, screen, waitFor } from '../../../helpers/render'

// FE-MOB-IMPF-001 to FE-MOB-IMPF-021
//
// planner.t echoes its key, so the assertions check keys (with the appended
// parameter values) instead of the English copy.

function gpxFile(name = 'route.gpx') {
  return new File(['<gpx/>'], name, { type: 'application/gpx+xml' })
}

function kmlFile(name = 'places.kml') {
  return new File(['<kml/>'], name, { type: 'application/vnd.google-earth.kml+xml' })
}

function renderStep(plannerOverrides: Partial<TripPlanner> = {}) {
  const planner = buildPlanner(plannerOverrides)
  const onBack = vi.fn()
  const onDone = vi.fn()
  render(<ImpFileStep planner={planner} onBack={onBack} onDone={onDone} />)
  return { planner, onBack, onDone }
}

function pick(files: File[]) {
  const input = document.querySelector('input[type="file"]') as HTMLInputElement
  fireEvent.change(input, { target: { files } })
}

const submit = () => screen.getByRole('button', { name: 'common.import' })

describe('ImpFileStep', () => {
  beforeEach(() => {
    resetAllStores()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('FE-MOB-IMPF-001: renders the hint and keeps the import disabled without a file', () => {
    renderStep()
    expect(screen.getByText('places.importFileHint')).toBeInTheDocument()
    expect(screen.getByText('places.importFileDropHere')).toBeInTheDocument()
    expect(submit()).toBeDisabled()
  })

  it('FE-MOB-IMPF-002: opens the hidden file input when the drop zone is tapped', () => {
    renderStep()
    const input = document.querySelector('input[type="file"]') as HTMLInputElement
    const click = vi.spyOn(input, 'click')
    fireEvent.click(screen.getByText('places.importFileDropHere'))
    expect(click).toHaveBeenCalledTimes(1)
  })

  it('FE-MOB-IMPF-003: rejects an unsupported extension', () => {
    renderStep()
    pick([new File(['x'], 'notes.txt', { type: 'text/plain' })])
    expect(screen.getByText('places.importFileUnsupported')).toBeInTheDocument()
    expect(screen.getByText('places.importFileDropHere')).toBeInTheDocument()
    expect(submit()).toBeDisabled()
  })

  it('FE-MOB-IMPF-004: rejects a file above the 10 MB limit', () => {
    renderStep()
    const big = gpxFile('huge.gpx')
    Object.defineProperty(big, 'size', { value: 11 * 1024 * 1024 })
    pick([big])
    expect(screen.getByText('places.importFileTooLarge:10')).toBeInTheDocument()
  })

  it('FE-MOB-IMPF-005: keeps the valid files of a mixed selection and reports the first problem', () => {
    renderStep()
    pick([new File(['x'], 'notes.txt'), gpxFile('a.gpx'), kmlFile('b.kml')])
    expect(screen.getByText('places.importFileUnsupported')).toBeInTheDocument()
    expect(screen.getByText('a.gpx, b.kml')).toBeInTheDocument()
    expect(submit()).toBeEnabled()
  })

  it('FE-MOB-IMPF-006: a GPX selection offers only the GPX entity toggles', () => {
    renderStep()
    pick([gpxFile()])
    expect(screen.getByText('places.gpxImportTypes')).toBeInTheDocument()
    expect(screen.queryByText('places.kmlImportTypes')).not.toBeInTheDocument()
    for (const label of ['places.gpxImportWaypoints', 'places.gpxImportRoutes', 'places.gpxImportTracks']) {
      expect(screen.getByRole('button', { name: label })).toHaveAttribute('aria-pressed', 'true')
    }
  })

  it('FE-MOB-IMPF-007: a KMZ selection offers only the KML entity toggles', () => {
    renderStep()
    pick([new File(['x'], 'map.kmz')])
    expect(screen.getByText('places.kmlImportTypes')).toBeInTheDocument()
    expect(screen.queryByText('places.gpxImportTypes')).not.toBeInTheDocument()
  })

  it('FE-MOB-IMPF-008: a mixed selection shows both toggle groups', () => {
    renderStep()
    pick([gpxFile(), kmlFile()])
    expect(screen.getByText('places.gpxImportTypes')).toBeInTheDocument()
    expect(screen.getByText('places.kmlImportTypes')).toBeInTheDocument()
  })

  it('FE-MOB-IMPF-009: turning every GPX entity off blocks the import', () => {
    renderStep()
    pick([gpxFile()])
    for (const label of ['places.gpxImportWaypoints', 'places.gpxImportRoutes', 'places.gpxImportTracks']) {
      fireEvent.click(screen.getByRole('button', { name: label }))
    }
    expect(screen.getByRole('button', { name: 'places.gpxImportWaypoints' })).toHaveAttribute('aria-pressed', 'false')
    expect(screen.getByText('places.gpxImportNoneSelected')).toBeInTheDocument()
    expect(submit()).toBeDisabled()
  })

  it('FE-MOB-IMPF-010: turning every KML entity off blocks the import', () => {
    renderStep()
    pick([kmlFile()])
    fireEvent.click(screen.getByRole('button', { name: 'places.kmlImportPoints' }))
    fireEvent.click(screen.getByRole('button', { name: 'places.kmlImportPaths' }))
    expect(screen.getByText('places.kmlImportNoneSelected')).toBeInTheDocument()
    expect(submit()).toBeDisabled()
  })

  it('FE-MOB-IMPF-011: imports a GPX with the selected entities, toasts and closes', async () => {
    const importGpx = vi.spyOn(placesApi, 'importGpx').mockResolvedValue({
      count: 3, skipped: 0, places: [{ id: 1 }, { id: 2 }, { id: 3 }],
    })
    const { planner, onDone } = renderStep()
    const file = gpxFile()
    pick([file])
    fireEvent.click(screen.getByRole('button', { name: 'places.gpxImportRoutes' }))
    fireEvent.click(submit())

    await waitFor(() => expect(onDone).toHaveBeenCalledTimes(1))
    expect(importGpx).toHaveBeenCalledWith(1, file, { waypoints: true, routes: false, tracks: true })
    expect(planner.tripActions.loadTrip).toHaveBeenCalledWith(1)
    expect(planner.toast.success).toHaveBeenCalledWith('places.gpxImported:3')
    expect(planner.pushUndo).toHaveBeenCalledWith('undo.importGpx', expect.any(Function))
  })

  it('FE-MOB-IMPF-012: the GPX undo bulk-deletes the created places and reloads', async () => {
    vi.spyOn(placesApi, 'importGpx').mockResolvedValue({ count: 2, skipped: 0, places: [{ id: 7 }, { id: 8 }] })
    const bulkDelete = vi.spyOn(placesApi, 'bulkDelete').mockResolvedValue({ deleted: 2 })
    const { planner, onDone } = renderStep()
    pick([gpxFile()])
    fireEvent.click(submit())
    await waitFor(() => expect(onDone).toHaveBeenCalled())

    const revert = vi.mocked(planner.pushUndo).mock.calls[0][1] as () => Promise<void>
    await revert()
    expect(bulkDelete).toHaveBeenCalledWith(1, [7, 8])
    expect(planner.tripActions.loadTrip).toHaveBeenCalledTimes(2)
  })

  it('FE-MOB-IMPF-013: a failing undo still reloads the trip', async () => {
    vi.spyOn(placesApi, 'importGpx').mockResolvedValue({ count: 1, skipped: 0, places: [{ id: 7 }] })
    vi.spyOn(placesApi, 'bulkDelete').mockRejectedValue(new Error('nope'))
    const { planner, onDone } = renderStep()
    pick([gpxFile()])
    fireEvent.click(submit())
    await waitFor(() => expect(onDone).toHaveBeenCalled())

    const revert = vi.mocked(planner.pushUndo).mock.calls[0][1] as () => Promise<void>
    await expect(revert()).resolves.toBeUndefined()
    expect(planner.tripActions.loadTrip).toHaveBeenCalledTimes(2)
  })

  it('FE-MOB-IMPF-014: a KML import keeps the sheet open to show its summary', async () => {
    const importMapFile = vi.spyOn(placesApi, 'importMapFile').mockResolvedValue({
      count: 4,
      places: [{ id: 9 }],
      summary: { totalPlacemarks: 5, createdCount: 4, skippedCount: 1, warnings: ['1 placemark had no coordinates'], errors: [] },
    })
    const { planner, onDone } = renderStep()
    const file = kmlFile()
    pick([file])
    fireEvent.click(screen.getByRole('button', { name: 'places.kmlImportPaths' }))
    fireEvent.click(submit())

    await screen.findByText('places.kmlKmzSummaryValues:5,4,1')
    expect(importMapFile).toHaveBeenCalledWith(1, file, { points: true, paths: false })
    expect(screen.getByText('1 placemark had no coordinates')).toBeInTheDocument()
    expect(planner.toast.success).toHaveBeenCalledWith('places.kmlKmzImported:4')
    expect(planner.pushUndo).toHaveBeenCalledWith('undo.importKeyholeMarkup', expect.any(Function))
    expect(onDone).not.toHaveBeenCalled()
  })

  it('FE-MOB-IMPF-015: merges the summaries of two KML files', async () => {
    vi.spyOn(placesApi, 'importMapFile')
      .mockResolvedValueOnce({
        count: 2, places: [{ id: 1 }],
        summary: { totalPlacemarks: 3, createdCount: 2, skippedCount: 1, warnings: ['first'], errors: [] },
      })
      .mockResolvedValueOnce({
        count: 1, places: [{ id: 2 }],
        summary: { totalPlacemarks: 2, createdCount: 1, skippedCount: 1, warnings: ['second'], errors: [] },
      })
    const { planner } = renderStep()
    pick([kmlFile('a.kml'), kmlFile('b.kml')])
    fireEvent.click(submit())

    await screen.findByText('places.kmlKmzSummaryValues:5,3,2')
    expect(screen.getByText('first second')).toBeInTheDocument()
    expect(planner.toast.success).toHaveBeenCalledWith('places.kmlKmzImported:3')
  })

  it('FE-MOB-IMPF-016: a mixed import counts each format on its own key and labels the undo neutrally', async () => {
    vi.spyOn(placesApi, 'importGpx').mockResolvedValue({ count: 1, skipped: 0, places: [{ id: 1 }] })
    vi.spyOn(placesApi, 'importMapFile').mockResolvedValue({ count: 2, places: [{ id: 2 }] })
    const { planner, onDone } = renderStep()
    pick([gpxFile(), kmlFile()])
    fireEvent.click(submit())

    await waitFor(() => expect(onDone).toHaveBeenCalled())
    expect(planner.toast.success).toHaveBeenCalledWith('places.gpxImported:1')
    expect(planner.toast.success).toHaveBeenCalledWith('places.kmlKmzImported:2')
    expect(planner.pushUndo).toHaveBeenCalledWith('undo.importFiles', expect.any(Function))
  })

  it('FE-MOB-IMPF-016b: a KML response without a summary still warns when everything was skipped', async () => {
    vi.spyOn(placesApi, 'importMapFile').mockResolvedValue({ count: 0, skipped: 3, places: [] })
    const { planner, onDone } = renderStep()
    pick([kmlFile()])
    fireEvent.click(submit())

    await waitFor(() => expect(onDone).toHaveBeenCalled())
    expect(planner.toast.warning).toHaveBeenCalledWith('places.importAllSkipped')
    expect(planner.toast.success).not.toHaveBeenCalled()
  })

  it('FE-MOB-IMPF-017: warns when everything was skipped and registers no undo', async () => {
    vi.spyOn(placesApi, 'importGpx').mockResolvedValue({ count: 0, skipped: 4, places: [] })
    const { planner, onDone } = renderStep()
    pick([gpxFile()])
    fireEvent.click(submit())

    await waitFor(() => expect(onDone).toHaveBeenCalled())
    expect(planner.toast.warning).toHaveBeenCalledWith('places.importAllSkipped')
    expect(planner.toast.success).not.toHaveBeenCalled()
    expect(planner.pushUndo).not.toHaveBeenCalled()
  })

  it('FE-MOB-IMPF-018: shows the server error of a single failing file and stays open', async () => {
    vi.spyOn(placesApi, 'importGpx').mockRejectedValue({ response: { data: { error: 'Malformed GPX' } } })
    const { planner, onDone } = renderStep()
    pick([gpxFile()])
    fireEvent.click(submit())

    await screen.findByText('Malformed GPX')
    expect(planner.toast.error).toHaveBeenCalledWith('Malformed GPX')
    expect(onDone).not.toHaveBeenCalled()
    expect(submit()).toBeEnabled()
  })

  it('FE-MOB-IMPF-019: prefixes each error with its file name on a multi-file import', async () => {
    vi.spyOn(placesApi, 'importGpx').mockRejectedValue(new Error('boom'))
    vi.spyOn(placesApi, 'importMapFile').mockRejectedValue({ response: { data: { error: 'bad kml' } } })
    const { planner } = renderStep()
    pick([gpxFile('a.gpx'), kmlFile('b.kml')])
    fireEvent.click(submit())

    await screen.findByText(/a\.gpx: places\.importFileError/)
    expect(screen.getByText(/b\.kml: bad kml/)).toBeInTheDocument()
    expect(planner.toast.error).toHaveBeenCalledWith('a.gpx: places.importFileError')
  })

  it('FE-MOB-IMPF-020: shows the loading label while the request is in flight', async () => {
    let release: (value: unknown) => void = () => {}
    vi.spyOn(placesApi, 'importGpx').mockReturnValue(new Promise(resolve => { release = resolve }))
    const { onDone } = renderStep()
    pick([gpxFile()])
    fireEvent.click(submit())

    await screen.findByRole('button', { name: 'common.loading' })
    expect(screen.getByRole('button', { name: 'common.loading' })).toBeDisabled()

    release({ count: 1, skipped: 0, places: [] })
    await waitFor(() => expect(onDone).toHaveBeenCalled())
  })

  it('FE-MOB-IMPF-021: the cancel button returns to the import menu', () => {
    const { onBack } = renderStep()
    fireEvent.click(screen.getByRole('button', { name: 'common.cancel' }))
    expect(onBack).toHaveBeenCalledTimes(1)
  })
})
