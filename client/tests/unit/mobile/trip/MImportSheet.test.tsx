import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { placesApi } from '../../../../src/api/client'
import MImportSheet from '../../../../src/mobile/screens/trip/sheets/MImportSheet'
import { buildPlanner } from '../../../helpers/mobileTrip'
import { resetAllStores } from '../../../helpers/store'
import { fireEvent, render, screen, waitFor } from '../../../helpers/render'

// FE-MOB-IMPS-001 to FE-MOB-IMPS-010
//
// planner.t echoes its key — assertions go against keys, not English copy.

function renderSheet(open = true) {
  const planner = buildPlanner()
  const onClose = vi.fn()
  const view = render(<MImportSheet planner={planner} open={open} onClose={onClose} />)
  return { ...view, planner, onClose }
}

const menuRow = (title: string) => screen.getByRole('button', { name: new RegExp(`^${title}`) })

describe('MImportSheet', () => {
  beforeEach(() => {
    resetAllStores()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('FE-MOB-IMPS-001: renders nothing while closed', () => {
    renderSheet(false)
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })

  it('FE-MOB-IMPS-002: opens on the menu with both import options', () => {
    renderSheet()
    const dialog = screen.getByRole('dialog', { name: 'mobileTrip.importPlaces' })
    expect(dialog).toBeInTheDocument()
    expect(menuRow('places.importFile')).toHaveTextContent('GPX · KML · KMZ')
    expect(menuRow('places.importList')).toHaveTextContent('mobileTrip.importListSub')
    expect(screen.queryByRole('button', { name: 'common.back' })).not.toBeInTheDocument()
  })

  it('FE-MOB-IMPS-003: the close button reports the sheet closed', () => {
    const { onClose } = renderSheet()
    fireEvent.click(screen.getByRole('button', { name: 'common.close' }))
    expect(onClose).toHaveBeenCalledTimes(1)
  })

  it('FE-MOB-IMPS-004: the file option opens the file step under its own title', () => {
    renderSheet()
    fireEvent.click(menuRow('places.importFile'))
    expect(screen.getByText('places.importFileHint')).toBeInTheDocument()
    expect(screen.getByText('places.importFileDropHere')).toBeInTheDocument()
    expect(screen.queryByText('mobileTrip.importListSub')).not.toBeInTheDocument()
  })

  it('FE-MOB-IMPS-005: the list option opens the shared-list step', () => {
    renderSheet()
    fireEvent.click(menuRow('places.importList'))
    expect(screen.getByText('places.googleListHint')).toBeInTheDocument()
    expect(screen.getByRole('textbox')).toBeInTheDocument()
  })

  it('FE-MOB-IMPS-006: the header back button returns to the menu', () => {
    renderSheet()
    fireEvent.click(menuRow('places.importList'))
    fireEvent.click(screen.getByRole('button', { name: 'common.back' }))
    expect(menuRow('places.importFile')).toBeInTheDocument()
    expect(screen.queryByRole('textbox')).not.toBeInTheDocument()
  })

  it('FE-MOB-IMPS-007: the footer cancel of either step returns to the menu', () => {
    renderSheet()
    fireEvent.click(menuRow('places.importFile'))
    fireEvent.click(screen.getByRole('button', { name: 'common.cancel' }))
    expect(menuRow('places.importList')).toBeInTheDocument()

    fireEvent.click(menuRow('places.importList'))
    fireEvent.click(screen.getByRole('button', { name: 'common.cancel' }))
    expect(menuRow('places.importFile')).toBeInTheDocument()
  })

  it('FE-MOB-IMPS-008: reopening the sheet resets it to the menu', () => {
    const { rerender, planner, onClose } = renderSheet()
    fireEvent.click(menuRow('places.importList'))
    expect(screen.getByRole('textbox')).toBeInTheDocument()

    rerender(<MImportSheet planner={planner} open={false} onClose={onClose} />)
    rerender(<MImportSheet planner={planner} open onClose={onClose} />)
    expect(screen.queryByRole('textbox')).not.toBeInTheDocument()
    expect(menuRow('places.importFile')).toBeInTheDocument()
  })

  it('FE-MOB-IMPS-009: a finished list import closes the whole sheet', async () => {
    vi.spyOn(placesApi, 'importGoogleList').mockResolvedValue({ count: 2, skipped: 0, listName: 'L', places: [] })
    const { onClose } = renderSheet()
    fireEvent.click(menuRow('places.importList'))
    fireEvent.change(screen.getByRole('textbox'), { target: { value: 'https://maps.app.goo.gl/abc' } })
    fireEvent.click(screen.getByRole('button', { name: 'common.import' }))
    await waitFor(() => expect(onClose).toHaveBeenCalledTimes(1))
  })

  it('FE-MOB-IMPS-010: a finished file import closes the whole sheet', async () => {
    vi.spyOn(placesApi, 'importGpx').mockResolvedValue({ count: 1, skipped: 0, places: [] })
    const { onClose } = renderSheet()
    fireEvent.click(menuRow('places.importFile'))
    const input = document.querySelector('input[type="file"]') as HTMLInputElement
    fireEvent.change(input, { target: { files: [new File(['<gpx/>'], 'route.gpx')] } })
    fireEvent.click(screen.getByRole('button', { name: 'common.import' }))
    await waitFor(() => expect(onClose).toHaveBeenCalledTimes(1))
  })
})
