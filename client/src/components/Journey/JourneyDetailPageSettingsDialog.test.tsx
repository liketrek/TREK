// FE-JRN-SETTINGS-001 to FE-JRN-SETTINGS-019

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { http, HttpResponse } from 'msw'
import userEvent from '@testing-library/user-event'
import { render, screen, waitFor, within, fireEvent, act } from '../../../tests/helpers/render'
import { server } from '../../../tests/helpers/msw/server'
import { useJourneyStore, type JourneyDetail } from '../../store/journeyStore'
import { JourneySettingsDialog } from './JourneyDetailPageSettingsDialog'

type ToastKind = 'success' | 'error' | 'warning' | 'info'

const mockNavigate = vi.fn()
vi.mock('react-router', async () => {
  const actual = await vi.importActual<typeof import('react-router')>('react-router')
  return { ...actual, useNavigate: () => mockNavigate }
})

const toastSpy = vi.fn((_message: string, _type?: ToastKind, _duration?: number) => 0)
const updateJourney = vi.fn(async (_id: number, _data: Record<string, unknown>) => {})
const deleteJourney = vi.fn(async (_id: number) => {})

function buildJourney(overrides: Partial<JourneyDetail> = {}): JourneyDetail {
  return {
    id: 3,
    user_id: 1,
    title: 'Italy 2026',
    subtitle: 'Rome & Florence',
    status: 'active',
    cover_image: null,
    cover_gradient: null,
    created_at: 0,
    updated_at: 0,
    entries: [],
    gallery: [],
    trips: [{ trip_id: 5, added_at: 0, title: 'Italy Trip', place_count: 8 }],
    contributors: [
      { journey_id: 3, user_id: 1, role: 'owner', added_at: 0, username: 'maurice', avatar: null },
      { journey_id: 3, user_id: 2, role: 'editor', added_at: 0, username: 'julien', avatar: null },
    ],
    stats: { entries: 0, photos: 0, places: 0 },
    ...overrides,
  }
}

function mountDialog(journey: JourneyDetail = buildJourney()) {
  const onClose = vi.fn()
  const onSaved = vi.fn()
  const onOpenInvite = vi.fn()
  const onRefresh = vi.fn()
  const utils = render(
    <JourneySettingsDialog
      journey={journey}
      onClose={onClose}
      onSaved={onSaved}
      onOpenInvite={onOpenInvite}
      onRefresh={onRefresh}
    />,
  )
  return { ...utils, onClose, onSaved, onOpenInvite, onRefresh }
}

/** The confirm dialogs are portalled and only differ by their heading. */
function confirmIn(headingText: string) {
  const modal = screen.getByRole('heading', { name: headingText }).closest('.trek-modal-enter') as HTMLElement
  return within(modal)
}

beforeEach(() => {
  toastSpy.mockClear()
  updateJourney.mockClear()
  updateJourney.mockResolvedValue(undefined)
  deleteJourney.mockClear()
  deleteJourney.mockResolvedValue(undefined)
  mockNavigate.mockClear()
  window.__addToast = toastSpy
  useJourneyStore.setState({ updateJourney, deleteJourney })
  server.use(
    http.get('/api/journeys/3/share-link', () => HttpResponse.json({ link: null })),
    http.get('/api/journeys/available-trips', () => HttpResponse.json({ trips: [] })),
  )
})

afterEach(() => {
  delete window.__addToast
})

describe('JourneySettingsDialog', () => {
  it('FE-JRN-SETTINGS-001: seeds the form from the journey and lists trips and contributors', async () => {
    mountDialog()

    expect(screen.getByDisplayValue('Italy 2026')).toBeInTheDocument()
    expect(screen.getByDisplayValue('Rome & Florence')).toBeInTheDocument()
    expect(screen.getByText('Italy Trip')).toBeInTheDocument()
    expect(screen.getByText('8 places')).toBeInTheDocument()
    expect(screen.getByText('julien')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Add cover image' })).toBeInTheDocument()
    await screen.findByRole('button', { name: /create share link/i })
  })

  it('FE-JRN-SETTINGS-002: saves the edited title and subtitle', async () => {
    const user = userEvent.setup()
    const { onSaved } = mountDialog()

    const titleInput = screen.getByDisplayValue('Italy 2026')
    await user.clear(titleInput)
    await user.type(titleInput, 'Italy 2027')
    await user.type(screen.getByPlaceholderText('e.g. Thailand, Vietnam & Cambodia'), '!')

    await user.click(screen.getByRole('button', { name: 'Save' }))

    await waitFor(() => expect(onSaved).toHaveBeenCalledTimes(1))
    expect(updateJourney).toHaveBeenCalledWith(3, { title: 'Italy 2027', subtitle: 'Rome & Florence!' })
  })

  it('FE-JRN-SETTINGS-003: clears the subtitle to null when it is emptied', async () => {
    const user = userEvent.setup()
    mountDialog()

    await user.clear(screen.getByDisplayValue('Rome & Florence'))
    await user.click(screen.getByRole('button', { name: 'Save' }))

    await waitFor(() => expect(updateJourney).toHaveBeenCalledWith(3, { title: 'Italy 2026', subtitle: null }))
  })

  it('FE-JRN-SETTINGS-004: reports a failed save', async () => {
    updateJourney.mockRejectedValueOnce(new Error('nope'))
    const user = userEvent.setup()
    const { onSaved } = mountDialog()

    await user.click(screen.getByRole('button', { name: 'Save' }))

    await waitFor(() => expect(toastSpy).toHaveBeenCalledWith('Failed to save', 'error', undefined))
    expect(onSaved).not.toHaveBeenCalled()
  })

  it('FE-JRN-SETTINGS-005: disables saving while the title is blank', async () => {
    const user = userEvent.setup()
    mountDialog()

    await user.clear(screen.getByDisplayValue('Italy 2026'))

    expect(screen.getByRole('button', { name: 'Save' })).toBeDisabled()
  })

  it('FE-JRN-SETTINGS-006: uploads a picked cover image', async () => {
    let uploaded = false
    server.use(http.post('/api/journeys/3/cover', () => {
      uploaded = true
      return HttpResponse.json({ ok: true })
    }))
    const { container, onSaved } = mountDialog()

    const fileInput = container.querySelector('input[type="file"]') as HTMLInputElement
    fireEvent.change(fileInput, { target: { files: [new File(['x'], 'cover.png', { type: 'image/png' })] } })

    await waitFor(() => expect(onSaved).toHaveBeenCalledTimes(1))
    expect(uploaded).toBe(true)
    expect(toastSpy).toHaveBeenCalledWith('Cover updated', 'success', undefined)
  })

  it('FE-JRN-SETTINGS-007: reports a failed cover upload', async () => {
    server.use(http.post('/api/journeys/3/cover', () => new HttpResponse(null, { status: 413 })))
    const { container, onSaved } = mountDialog()

    const fileInput = container.querySelector('input[type="file"]') as HTMLInputElement
    fireEvent.change(fileInput, { target: { files: [new File(['x'], 'cover.png', { type: 'image/png' })] } })

    await waitFor(() => expect(toastSpy).toHaveBeenCalledWith('Upload failed', 'error', undefined))
    expect(onSaved).not.toHaveBeenCalled()
  })

  it('FE-JRN-SETTINGS-008: ignores a cover change event without a file', async () => {
    const { container, onSaved } = mountDialog()

    const fileInput = container.querySelector('input[type="file"]') as HTMLInputElement
    fireEvent.change(fileInput, { target: { files: [] } })

    expect(onSaved).not.toHaveBeenCalled()
    expect(toastSpy).not.toHaveBeenCalled()
  })

  it('FE-JRN-SETTINGS-009: shows the existing cover as a preview', () => {
    mountDialog(buildJourney({ cover_image: 'covers/italy.jpg' }))

    expect(screen.getByRole('button', { name: 'Change cover' })).toBeInTheDocument()
    const preview = document.querySelector('img[src="/uploads/covers/italy.jpg"]')
    expect(preview).toBeInTheDocument()
  })

  it('FE-JRN-SETTINGS-010: archives an active journey', async () => {
    const user = userEvent.setup()
    const { onSaved } = mountDialog()

    await user.click(screen.getByRole('button', { name: 'Archive Journey' }))

    await waitFor(() => expect(updateJourney).toHaveBeenCalledWith(3, { status: 'archived' }))
    expect(toastSpy).toHaveBeenCalledWith('Journey archived', 'success', undefined)
    expect(onSaved).toHaveBeenCalledTimes(1)
  })

  it('FE-JRN-SETTINGS-011: restores an archived journey', async () => {
    const user = userEvent.setup()
    mountDialog(buildJourney({ status: 'archived' }))

    await user.click(screen.getByRole('button', { name: 'Restore Journey' }))

    await waitFor(() => expect(updateJourney).toHaveBeenCalledWith(3, { status: 'active' }))
    expect(toastSpy).toHaveBeenCalledWith('Journey reopened', 'success', undefined)
  })

  it('FE-JRN-SETTINGS-012: reports a failed archive toggle', async () => {
    updateJourney.mockRejectedValueOnce(new Error('nope'))
    const user = userEvent.setup()
    mountDialog()

    await user.click(screen.getByRole('button', { name: 'Archive Journey' }))

    await waitFor(() => expect(toastSpy).toHaveBeenCalledWith('Failed to save', 'error', undefined))
    expect(screen.getByRole('button', { name: 'Archive Journey' })).toBeEnabled()
  })

  it('FE-JRN-SETTINGS-013: deletes the journey and navigates back to the list', async () => {
    const user = userEvent.setup()
    mountDialog()

    await user.click(screen.getByRole('button', { name: 'Delete' }))
    await user.click(confirmIn('Delete Journey').getByRole('button', { name: 'Delete' }))

    await waitFor(() => expect(deleteJourney).toHaveBeenCalledWith(3))
    expect(mockNavigate).toHaveBeenCalledWith('/journey')
  })

  it('FE-JRN-SETTINGS-014: reports a failed delete and stays on the page', async () => {
    deleteJourney.mockRejectedValueOnce(new Error('nope'))
    const user = userEvent.setup()
    mountDialog()

    await user.click(screen.getByRole('button', { name: 'Delete' }))
    await user.click(confirmIn('Delete Journey').getByRole('button', { name: 'Delete' }))

    await waitFor(() => expect(toastSpy).toHaveBeenCalledWith('Failed to delete', 'error', undefined))
    expect(mockNavigate).not.toHaveBeenCalled()
  })

  it('FE-JRN-SETTINGS-015: unlinks a trip after confirmation', async () => {
    let unlinked = false
    server.use(http.delete('/api/journeys/3/trips/5', () => {
      unlinked = true
      return HttpResponse.json({ ok: true })
    }))
    const user = userEvent.setup()
    const { onSaved } = mountDialog()

    await user.click(screen.getByTitle('Unlink trip'))
    expect(screen.getByText(/Unlink "Italy Trip"\?/)).toBeInTheDocument()
    await user.click(confirmIn('Unlink Trip').getByRole('button', { name: 'Unlink' }))

    await waitFor(() => expect(onSaved).toHaveBeenCalledTimes(1))
    expect(unlinked).toBe(true)
    expect(toastSpy).toHaveBeenCalledWith('Trip unlinked', 'success', undefined)
  })

  it('FE-JRN-SETTINGS-016: reports a failed unlink', async () => {
    server.use(http.delete('/api/journeys/3/trips/5', () => new HttpResponse(null, { status: 500 })))
    const user = userEvent.setup()
    const { onSaved } = mountDialog()

    await user.click(screen.getByTitle('Unlink trip'))
    await user.click(confirmIn('Unlink Trip').getByRole('button', { name: 'Unlink' }))

    await waitFor(() => expect(toastSpy).toHaveBeenCalledWith('Failed to unlink trip', 'error', undefined))
    expect(onSaved).not.toHaveBeenCalled()
  })

  it('FE-JRN-SETTINGS-017: removes a contributor only after the browser confirm', async () => {
    let removed = 0
    server.use(http.delete('/api/journeys/3/contributors/2', () => {
      removed += 1
      return HttpResponse.json({ ok: true })
    }))
    const confirmSpy = vi.spyOn(window, 'confirm').mockReturnValue(false)
    const user = userEvent.setup()
    const { onRefresh } = mountDialog()

    // Only the non-owner contributor gets a remove control.
    const removeBtn = screen.getByRole('button', { name: 'Remove contributor' })
    await user.click(removeBtn)
    expect(confirmSpy).toHaveBeenCalledWith('Remove julien from this journey?')
    expect(removed).toBe(0)

    confirmSpy.mockReturnValue(true)
    await user.click(removeBtn)
    await waitFor(() => expect(onRefresh).toHaveBeenCalledTimes(1))
    expect(removed).toBe(1)
    expect(toastSpy).toHaveBeenCalledWith('Contributor removed', 'success', undefined)
    confirmSpy.mockRestore()
  })

  it('FE-JRN-SETTINGS-018: reports a failed contributor removal', async () => {
    server.use(http.delete('/api/journeys/3/contributors/2', () => new HttpResponse(null, { status: 500 })))
    const confirmSpy = vi.spyOn(window, 'confirm').mockReturnValue(true)
    const user = userEvent.setup()
    const { onRefresh } = mountDialog()

    await user.click(screen.getByRole('button', { name: 'Remove contributor' }))

    await waitFor(() => expect(toastSpy).toHaveBeenCalledWith('Failed to remove contributor', 'error', undefined))
    expect(onRefresh).not.toHaveBeenCalled()
    confirmSpy.mockRestore()
  })

  it('FE-JRN-SETTINGS-019: opens the invite and the add-trip flow', async () => {
    const user = userEvent.setup()
    const { onOpenInvite } = mountDialog(buildJourney({ trips: [] }))

    expect(screen.getByText('No trips linked')).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Invite Contributor' }))
    expect(onOpenInvite).toHaveBeenCalledTimes(1)

    await user.click(screen.getByRole('button', { name: 'Add Trip' }))
    expect(await screen.findByRole('heading', { name: 'Link Trip' })).toBeInTheDocument()
  })

  it('FE-JRN-SETTINGS-019b: closing the link-trip dialog leaves the settings dialog alone', async () => {
    const user = userEvent.setup()
    const { onClose } = mountDialog(buildJourney({ trips: [] }))

    await user.click(screen.getByRole('button', { name: 'Add Trip' }))
    const linkHeading = await screen.findByRole('heading', { name: 'Link Trip' })
    await user.click(linkHeading.parentElement!.querySelector('button')!)

    expect(screen.queryByRole('heading', { name: 'Link Trip' })).not.toBeInTheDocument()
    expect(onClose).not.toHaveBeenCalled()
    expect(screen.getByRole('heading', { name: 'Journey Settings' })).toBeInTheDocument()
  })

  it('FE-JRN-SETTINGS-020: closes straight away when nothing was edited', async () => {
    const user = userEvent.setup()
    const { onClose } = mountDialog()

    await user.click(screen.getByRole('button', { name: 'Cancel' }))

    expect(onClose).toHaveBeenCalledTimes(1)
    expect(screen.queryByRole('heading', { name: 'Discard Changes' })).not.toBeInTheDocument()
  })

  it('FE-JRN-SETTINGS-021: asks before discarding unsaved edits', async () => {
    const user = userEvent.setup()
    const { onClose } = mountDialog()

    await user.type(screen.getByDisplayValue('Italy 2026'), '!')
    await user.click(screen.getByRole('button', { name: 'Cancel' }))
    expect(onClose).not.toHaveBeenCalled()

    await user.click(confirmIn('Discard Changes').getByRole('button', { name: 'Discard' }))
    expect(onClose).toHaveBeenCalledTimes(1)
  })

  it('FE-JRN-SETTINGS-022: keeps the dialog open when the discard prompt is dismissed', async () => {
    const user = userEvent.setup()
    const { onClose } = mountDialog()

    // The header close button carries only an icon, so it is addressed by position.
    const headerClose = screen.getByRole('heading', { name: 'Journey Settings' })
      .parentElement!.querySelectorAll('button')[0]
    await user.type(screen.getByDisplayValue('Rome & Florence'), '!')
    act(() => { headerClose.click() })

    await user.click(confirmIn('Discard Changes').getByRole('button', { name: 'Cancel' }))

    expect(onClose).not.toHaveBeenCalled()
    expect(screen.getByRole('heading', { name: 'Journey Settings' })).toBeInTheDocument()
  })
})
