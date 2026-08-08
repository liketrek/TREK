import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { placesApi } from '../../../../src/api/client'
import ImpListStep from '../../../../src/mobile/screens/trip/sheets/ImpListStep'
import { useAuthStore } from '../../../../src/store/authStore'
import type { TripPlanner } from '../../../../src/mobile/screens/trip/MTripShell'
import { buildPlanner } from '../../../helpers/mobileTrip'
import { resetAllStores, seedStore } from '../../../helpers/store'
import { fireEvent, render, screen, waitFor } from '../../../helpers/render'

// FE-MOB-IMPL-001 to FE-MOB-IMPL-017
//
// planner.t echoes its key, so the assertions below check keys (plus the
// appended parameter values) rather than the English copy.

function renderStep(plannerOverrides: Partial<TripPlanner> = {}) {
  const planner = buildPlanner(plannerOverrides)
  const onBack = vi.fn()
  const onDone = vi.fn()
  render(<ImpListStep planner={planner} onBack={onBack} onDone={onDone} />)
  return { planner, onBack, onDone }
}

function typeUrl(value: string) {
  const input = screen.getByRole('textbox')
  fireEvent.change(input, { target: { value } })
  return input
}

const submit = () => screen.getByRole('button', { name: 'common.import' })

describe('ImpListStep', () => {
  beforeEach(() => {
    resetAllStores()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('FE-MOB-IMPL-001: starts on Google with its hint, placeholder and a disabled submit', () => {
    renderStep()
    expect(screen.getByText('places.importGoogleList')).toBeInTheDocument()
    expect(screen.getByText('places.googleListHint')).toBeInTheDocument()
    expect(screen.getByRole('textbox')).toHaveAttribute('placeholder', 'https://maps.app.goo.gl/…')
    expect(submit()).toBeDisabled()
  })

  it('FE-MOB-IMPL-002: switching to Naver swaps hint and placeholder', () => {
    renderStep()
    fireEvent.click(screen.getByText('places.importNaverList'))
    expect(screen.getByText('places.naverListHint')).toBeInTheDocument()
    expect(screen.getByRole('textbox')).toHaveAttribute('placeholder', 'https://naver.me/…')
    fireEvent.click(screen.getByText('places.importGoogleList'))
    expect(screen.getByText('places.googleListHint')).toBeInTheDocument()
  })

  it('FE-MOB-IMPL-003: hides the enrichment switch without a Maps key', () => {
    renderStep()
    expect(screen.queryByRole('switch')).not.toBeInTheDocument()
  })

  it('FE-MOB-IMPL-004: offers the enrichment switch once a Maps key is configured', () => {
    seedStore(useAuthStore, { hasMapsKey: true })
    renderStep()
    const toggle = screen.getByRole('switch', { name: 'places.enrichOnImport' })
    expect(toggle).toHaveAttribute('aria-checked', 'false')
    expect(screen.getByText('places.enrichOnImportHint')).toBeInTheDocument()
    fireEvent.click(toggle)
    expect(toggle).toHaveAttribute('aria-checked', 'true')
  })

  it('FE-MOB-IMPL-005: keeps the submit disabled for whitespace-only input', () => {
    renderStep()
    typeUrl('   ')
    expect(submit()).toBeDisabled()
  })

  it('FE-MOB-IMPL-006: imports a Google list, reloads the trip and toasts the count', async () => {
    vi.spyOn(placesApi, 'importGoogleList').mockResolvedValue({
      count: 4, skipped: 0, listName: 'Tokyo eats', places: [{ id: 71 }, { id: 72 }],
    })
    const { planner, onDone } = renderStep()
    typeUrl('  https://maps.app.goo.gl/abc  ')
    fireEvent.click(submit())

    await waitFor(() => expect(onDone).toHaveBeenCalledTimes(1))
    expect(placesApi.importGoogleList).toHaveBeenCalledWith(1, 'https://maps.app.goo.gl/abc', false)
    expect(planner.tripActions.loadTrip).toHaveBeenCalledWith(1)
    expect(planner.toast.success).toHaveBeenCalledWith('places.googleListImported:4,Tokyo eats')
  })

  it('FE-MOB-IMPL-007: passes the enrichment flag when the user asked for it', async () => {
    seedStore(useAuthStore, { hasMapsKey: true })
    vi.spyOn(placesApi, 'importGoogleList').mockResolvedValue({ count: 1, skipped: 0, listName: 'L', places: [] })
    const { onDone } = renderStep()
    fireEvent.click(screen.getByRole('switch', { name: 'places.enrichOnImport' }))
    typeUrl('https://maps.app.goo.gl/abc')
    fireEvent.click(submit())
    await waitFor(() => expect(onDone).toHaveBeenCalled())
    expect(placesApi.importGoogleList).toHaveBeenCalledWith(1, 'https://maps.app.goo.gl/abc', true)
  })

  it('FE-MOB-IMPL-008: registers an undo that bulk-deletes the imported places', async () => {
    vi.spyOn(placesApi, 'importGoogleList').mockResolvedValue({
      count: 2, skipped: 0, listName: 'L', places: [{ id: 71 }, { id: 72 }],
    })
    const bulkDelete = vi.spyOn(placesApi, 'bulkDelete').mockResolvedValue({ deleted: 2 })
    const { planner, onDone } = renderStep()
    typeUrl('https://maps.app.goo.gl/abc')
    fireEvent.click(submit())
    await waitFor(() => expect(onDone).toHaveBeenCalled())

    expect(planner.pushUndo).toHaveBeenCalledWith('undo.importGoogleList', expect.any(Function))
    const revert = vi.mocked(planner.pushUndo).mock.calls[0][1] as () => Promise<void>
    await revert()
    expect(bulkDelete).toHaveBeenCalledWith(1, [71, 72])
    expect(planner.tripActions.loadTrip).toHaveBeenCalledTimes(2)
  })

  it('FE-MOB-IMPL-009: a failing undo still reloads the trip', async () => {
    vi.spyOn(placesApi, 'importGoogleList').mockResolvedValue({
      count: 1, skipped: 0, listName: 'L', places: [{ id: 71 }],
    })
    vi.spyOn(placesApi, 'bulkDelete').mockRejectedValue(new Error('gone'))
    const { planner, onDone } = renderStep()
    typeUrl('https://maps.app.goo.gl/abc')
    fireEvent.click(submit())
    await waitFor(() => expect(onDone).toHaveBeenCalled())

    const revert = vi.mocked(planner.pushUndo).mock.calls[0][1] as () => Promise<void>
    await expect(revert()).resolves.toBeUndefined()
    expect(planner.tripActions.loadTrip).toHaveBeenCalledTimes(2)
  })

  it('FE-MOB-IMPL-010: skips the undo entry when nothing was created', async () => {
    vi.spyOn(placesApi, 'importGoogleList').mockResolvedValue({ count: 3, skipped: 0, listName: 'L', places: [] })
    const { planner, onDone } = renderStep()
    typeUrl('https://maps.app.goo.gl/abc')
    fireEvent.click(submit())
    await waitFor(() => expect(onDone).toHaveBeenCalled())
    expect(planner.pushUndo).not.toHaveBeenCalled()
  })

  it('FE-MOB-IMPL-011: warns instead of celebrating when every entry was skipped', async () => {
    vi.spyOn(placesApi, 'importGoogleList').mockResolvedValue({ count: 0, skipped: 5, listName: 'L', places: [] })
    const { planner, onDone } = renderStep()
    typeUrl('https://maps.app.goo.gl/abc')
    fireEvent.click(submit())
    await waitFor(() => expect(onDone).toHaveBeenCalled())
    expect(planner.toast.warning).toHaveBeenCalledWith('places.importAllSkipped')
    expect(planner.toast.success).not.toHaveBeenCalled()
  })

  it('FE-MOB-IMPL-012: imports a Naver list on the Naver endpoint', async () => {
    vi.spyOn(placesApi, 'importNaverList').mockResolvedValue({
      count: 2, skipped: 0, listName: 'Seoul', places: [{ id: 81 }],
    })
    const { planner, onDone } = renderStep()
    fireEvent.click(screen.getByText('places.importNaverList'))
    typeUrl('https://naver.me/xyz')
    fireEvent.click(submit())
    await waitFor(() => expect(onDone).toHaveBeenCalled())
    expect(placesApi.importNaverList).toHaveBeenCalledWith(1, 'https://naver.me/xyz', false)
    expect(planner.toast.success).toHaveBeenCalledWith('places.naverListImported:2,Seoul')
    expect(planner.pushUndo).toHaveBeenCalledWith('undo.importNaverList', expect.any(Function))
  })

  it('FE-MOB-IMPL-013: surfaces the server error message and keeps the sheet open', async () => {
    vi.spyOn(placesApi, 'importGoogleList').mockRejectedValue({ response: { data: { error: 'List is private' } } })
    const { planner, onDone } = renderStep()
    typeUrl('https://maps.app.goo.gl/abc')
    fireEvent.click(submit())
    await waitFor(() => expect(planner.toast.error).toHaveBeenCalledWith('List is private'))
    expect(onDone).not.toHaveBeenCalled()
    expect(submit()).toBeEnabled()
  })

  it('FE-MOB-IMPL-014: falls back to the provider error key without a server message', async () => {
    vi.spyOn(placesApi, 'importNaverList').mockRejectedValue(new Error('network'))
    const { planner } = renderStep()
    fireEvent.click(screen.getByText('places.importNaverList'))
    typeUrl('https://naver.me/xyz')
    fireEvent.click(submit())
    await waitFor(() => expect(planner.toast.error).toHaveBeenCalledWith('places.naverListError'))
  })

  it('FE-MOB-IMPL-015: Enter in the url field submits and ignores an empty field', async () => {
    vi.spyOn(placesApi, 'importGoogleList').mockResolvedValue({ count: 1, skipped: 0, listName: 'L', places: [] })
    const { onDone } = renderStep()
    const input = screen.getByRole('textbox')
    fireEvent.keyDown(input, { key: 'Enter' })
    expect(placesApi.importGoogleList).not.toHaveBeenCalled()

    fireEvent.change(input, { target: { value: 'https://maps.app.goo.gl/abc' } })
    fireEvent.keyDown(input, { key: 'a' })
    expect(placesApi.importGoogleList).not.toHaveBeenCalled()

    fireEvent.keyDown(input, { key: 'Enter' })
    await waitFor(() => expect(onDone).toHaveBeenCalled())
    expect(placesApi.importGoogleList).toHaveBeenCalledTimes(1)
  })

  it('FE-MOB-IMPL-016: shows the loading label and refuses a second submit while in flight', async () => {
    let release: (value: unknown) => void = () => {}
    vi.spyOn(placesApi, 'importGoogleList').mockReturnValue(new Promise(resolve => { release = resolve }))
    const { onDone } = renderStep()
    const input = typeUrl('https://maps.app.goo.gl/abc')
    fireEvent.click(submit())

    await screen.findByRole('button', { name: 'common.loading' })
    fireEvent.keyDown(input, { key: 'Enter' })
    expect(placesApi.importGoogleList).toHaveBeenCalledTimes(1)

    release({ count: 1, skipped: 0, listName: 'L', places: [] })
    await waitFor(() => expect(onDone).toHaveBeenCalled())
  })

  it('FE-MOB-IMPL-017: the cancel button goes back to the import menu', () => {
    const { onBack } = renderStep()
    fireEvent.click(screen.getByRole('button', { name: 'common.cancel' }))
    expect(onBack).toHaveBeenCalledTimes(1)
  })
})
