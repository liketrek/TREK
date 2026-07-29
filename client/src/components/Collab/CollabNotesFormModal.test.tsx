// FE-W5CNF-001 to FE-W5CNF-021
// NoteFormModal takes everything it needs as props, so the tests drive it
// directly rather than through CollabNotes.

import { render, screen, fireEvent, waitFor } from '../../../tests/helpers/render'
import userEvent from '@testing-library/user-event'
import { useAuthStore } from '../../store/authStore'
import { useTripStore } from '../../store/tripStore'
import { usePermissionsStore } from '../../store/permissionsStore'
import { resetAllStores, seedStore } from '../../../tests/helpers/store'
import { buildUser, buildTrip } from '../../../tests/helpers/factories'
import { NoteFormModal } from './CollabNotesFormModal'
import type { CollabNote, NoteFile } from './CollabNotes.types'

const identity = (key: string) => key

function buildAttachment(overrides: Partial<NoteFile> = {}): NoteFile {
  return {
    id: 1,
    filename: 'stored.png',
    original_name: 'photo.png',
    mime_type: 'image/png',
    url: '/uploads/collab/photo.png',
    ...overrides,
  }
}

function buildNote(overrides: Partial<CollabNote> = {}): CollabNote {
  return {
    id: 42,
    trip_id: 1,
    title: 'Existing note',
    content: 'Existing content',
    category: 'Food',
    website: 'https://example.com',
    pinned: false,
    color: '#6366f1',
    username: 'tester',
    avatar_url: null,
    avatar: null,
    user_id: 1,
    created_at: '2025-06-01T10:00:00.000Z',
    attachments: [],
    ...overrides,
  } as CollabNote
}

interface ModalOverrides {
  note?: CollabNote | null
  onClose?: () => void
  onSubmit?: (data: Record<string, unknown>) => Promise<void>
  onDeleteFile?: (noteId: number, fileId: number) => Promise<void>
  existingCategories?: string[]
  categoryColors?: Record<string, string>
  t?: (key: string) => string
}

function renderModal(overrides: ModalOverrides = {}) {
  const onSubmit = overrides.onSubmit ?? vi.fn(async () => {})
  const onClose = overrides.onClose ?? vi.fn(() => {})
  render(
    <NoteFormModal
      note={overrides.note ?? null}
      tripId={1}
      onClose={onClose}
      onSubmit={onSubmit as unknown as React.ComponentProps<typeof NoteFormModal>['onSubmit']}
      onDeleteFile={overrides.onDeleteFile}
      existingCategories={overrides.existingCategories ?? []}
      categoryColors={overrides.categoryColors as Record<string, string>}
      getCategoryColor={(cat: string) => (cat === 'Food' ? '#ef4444' : '#6366f1')}
      t={overrides.t ?? identity}
    />,
  )
  return { onSubmit, onClose }
}

beforeEach(() => {
  resetAllStores()
  seedStore(useAuthStore, { user: buildUser({ id: 1 }), isAuthenticated: true })
  seedStore(useTripStore, { trip: buildTrip({ id: 1, user_id: 1 }) })
})

describe('NoteFormModal', () => {
  it('FE-W5CNF-001: falls back to an empty color map when none is supplied', () => {
    renderModal({ existingCategories: ['Food'] })
    expect(screen.getByRole('button', { name: 'Food' })).toBeInTheDocument()
  })

  it('FE-W5CNF-002: submitting with a blank title does nothing', async () => {
    const { onSubmit, onClose } = renderModal()
    const form = document.querySelector('form')!
    fireEvent.submit(form)
    await waitFor(() => expect(onSubmit).not.toHaveBeenCalled())
    expect(onClose).not.toHaveBeenCalled()
  })

  it('FE-W5CNF-003: a filled-in note is submitted trimmed and the modal closes', async () => {
    const user = userEvent.setup()
    const { onSubmit, onClose } = renderModal({ existingCategories: ['Food'] })
    await user.type(screen.getByPlaceholderText('collab.notes.titlePlaceholder'), '  Dinner  ')
    await user.type(screen.getByPlaceholderText('collab.notes.contentPlaceholder'), 'Book a table')
    await user.type(screen.getByPlaceholderText('collab.notes.websitePlaceholder'), ' https://trek.test ')
    await user.click(screen.getByRole('button', { name: 'collab.notes.create' }))
    await waitFor(() => expect(onSubmit).toHaveBeenCalledTimes(1))
    expect(onSubmit).toHaveBeenCalledWith({
      title: 'Dinner',
      content: 'Book a table',
      category: 'Food',
      color: '#ef4444',
      website: 'https://trek.test',
      _pendingFiles: [],
    })
    expect(onClose).toHaveBeenCalled()
  })

  it('FE-W5CNF-004: a note without a category submits null instead of an empty string', async () => {
    const user = userEvent.setup()
    const { onSubmit } = renderModal()
    await user.type(screen.getByPlaceholderText('collab.notes.titlePlaceholder'), 'Loose note')
    await user.click(screen.getByRole('button', { name: 'collab.notes.create' }))
    await waitFor(() => expect(onSubmit).toHaveBeenCalled())
    expect(onSubmit).toHaveBeenCalledWith(expect.objectContaining({ category: null, website: null }))
  })

  it('FE-W5CNF-005: a rejected submit keeps the modal open and re-enables the button', async () => {
    const user = userEvent.setup()
    const onSubmit = vi.fn(async () => { throw new Error('boom') })
    const { onClose } = renderModal({ onSubmit })
    await user.type(screen.getByPlaceholderText('collab.notes.titlePlaceholder'), 'Fails')
    const submit = screen.getByRole('button', { name: 'collab.notes.create' })
    await user.click(submit)
    await waitFor(() => expect(onSubmit).toHaveBeenCalled())
    expect(onClose).not.toHaveBeenCalled()
    expect(submit).toBeEnabled()
  })

  it('FE-W5CNF-006: edit mode prefills the fields and uses the save label', () => {
    renderModal({ note: buildNote() })
    expect(screen.getByDisplayValue('Existing note')).toBeInTheDocument()
    expect(screen.getByDisplayValue('Existing content')).toBeInTheDocument()
    expect(screen.getByDisplayValue('https://example.com')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'collab.notes.save' })).toBeInTheDocument()
    expect(screen.getByText('collab.notes.edit')).toBeInTheDocument()
  })

  it('FE-W5CNF-007: the close button calls back without submitting', async () => {
    const user = userEvent.setup()
    const { onClose, onSubmit } = renderModal()
    const header = screen.getByText('collab.notes.new').parentElement!
    await user.click(header.querySelector('button')!)
    expect(onClose).toHaveBeenCalledTimes(1)
    expect(onSubmit).not.toHaveBeenCalled()
  })

  it('FE-W5CNF-008: picking another category marks it active and submits it', async () => {
    const user = userEvent.setup()
    const { onSubmit } = renderModal({
      existingCategories: ['Food'],
      categoryColors: { Sights: '#6366f1' },
    })
    const sights = screen.getByRole('button', { name: 'Sights' })
    expect(sights.style.background).toBe('transparent')
    await user.click(sights)
    expect(sights.style.background).toBe('rgba(99, 102, 241, 0.094)')
    await user.type(screen.getByPlaceholderText('collab.notes.titlePlaceholder'), 'Museum')
    await user.click(screen.getByRole('button', { name: 'collab.notes.create' }))
    await waitFor(() => expect(onSubmit).toHaveBeenCalled())
    expect(onSubmit).toHaveBeenCalledWith(expect.objectContaining({ category: 'Sights' }))
  })

  it('FE-W5CNF-009: pasting an image attaches it as a pending file', () => {
    renderModal()
    const file = new File(['x'], 'pasted.png', { type: 'image/png' })
    fireEvent.paste(document.querySelector('form')!, {
      clipboardData: { items: [{ type: 'image/png', getAsFile: () => file }] },
    })
    expect(screen.getByText('pasted.png')).toBeInTheDocument()
  })

  it('FE-W5CNF-010: pasting a PDF after a non-file item attaches the PDF', () => {
    renderModal()
    const file = new File(['%PDF'], 'itinerary.pdf', { type: 'application/pdf' })
    fireEvent.paste(document.querySelector('form')!, {
      clipboardData: {
        items: [
          { type: 'text/plain', getAsFile: () => null },
          { type: 'application/pdf', getAsFile: () => file },
        ],
      },
    })
    expect(screen.getByText('itinerary.pdf')).toBeInTheDocument()
  })

  it('FE-W5CNF-011: a paste whose item yields no file attaches nothing', () => {
    renderModal()
    fireEvent.paste(document.querySelector('form')!, {
      clipboardData: { items: [{ type: 'image/png', getAsFile: () => null }] },
    })
    expect(screen.queryByText(/\.png$/)).not.toBeInTheDocument()
  })

  it('FE-W5CNF-012: a paste without clipboard items is ignored', () => {
    renderModal()
    fireEvent.paste(document.querySelector('form')!, { clipboardData: {} })
    expect(screen.getByPlaceholderText('collab.notes.titlePlaceholder')).toBeInTheDocument()
  })

  it('FE-W5CNF-013: without upload rights the file section is hidden and paste is ignored', () => {
    seedStore(usePermissionsStore, { permissions: { file_upload: 'admin' } })
    renderModal()
    expect(screen.queryByText('collab.notes.attachFiles')).not.toBeInTheDocument()
    const file = new File(['x'], 'blocked.png', { type: 'image/png' })
    fireEvent.paste(document.querySelector('form')!, {
      clipboardData: { items: [{ type: 'image/png', getAsFile: () => file }] },
    })
    expect(screen.queryByText('blocked.png')).not.toBeInTheDocument()
  })

  it('FE-W5CNF-014: choosing files through the picker lists them and long names are truncated', () => {
    renderModal()
    const input = document.querySelector('input[type="file"]') as HTMLInputElement
    const longName = 'an-extremely-long-attachment-name.pdf'
    fireEvent.change(input, {
      target: {
        files: [
          new File(['a'], 'short.png', { type: 'image/png' }),
          new File(['b'], longName, { type: 'application/pdf' }),
        ],
      },
    })
    expect(screen.getByText('short.png')).toBeInTheDocument()
    expect(screen.getByText(`${longName.slice(0, 17)}...`)).toBeInTheDocument()
  })

  it('FE-W5CNF-015: an empty file selection changes nothing', () => {
    renderModal()
    const input = document.querySelector('input[type="file"]') as HTMLInputElement
    fireEvent.change(input, { target: { files: [] } })
    expect(screen.queryByText(/\.png$/)).not.toBeInTheDocument()
  })

  it('FE-W5CNF-016: a pending file can be removed again', async () => {
    const user = userEvent.setup()
    renderModal()
    const input = document.querySelector('input[type="file"]') as HTMLInputElement
    fireEvent.change(input, { target: { files: [new File(['a'], 'remove-me.png', { type: 'image/png' })] } })
    const chip = screen.getByText('remove-me.png').closest('div')!
    await user.click(chip.querySelector('button')!)
    expect(screen.queryByText('remove-me.png')).not.toBeInTheDocument()
  })

  it('FE-W5CNF-017: the add button opens the hidden file picker', async () => {
    const user = userEvent.setup()
    renderModal()
    const input = document.querySelector('input[type="file"]') as HTMLInputElement
    const clickSpy = vi.spyOn(input, 'click').mockImplementation(() => {})
    await user.click(screen.getByRole('button', { name: 'files.attach' }))
    expect(clickSpy).toHaveBeenCalled()
    clickSpy.mockRestore()
  })

  it('FE-W5CNF-018: the add button falls back to an English label', () => {
    renderModal({ t: (key: string) => (key === 'files.attach' ? '' : key) })
    expect(screen.getByRole('button', { name: 'Add' })).toBeInTheDocument()
  })

  it('FE-W5CNF-019: deleting an existing attachment calls back and drops the chip', async () => {
    const user = userEvent.setup()
    const onDeleteFile = vi.fn(async () => {})
    renderModal({
      note: buildNote({
        attachments: [
          buildAttachment({ id: 7, original_name: 'a-really-long-attachment-name.pdf', mime_type: 'application/pdf' }),
        ],
      }),
      onDeleteFile,
    })
    const chip = screen.getByText('a-really-long-att...').closest('div')!
    await user.click(chip.querySelector('button')!)
    await waitFor(() => expect(onDeleteFile).toHaveBeenCalledWith(42, 7))
    expect(screen.queryByText('a-really-long-att...')).not.toBeInTheDocument()
  })

  it('FE-W5CNF-020: an attachment without a delete handler stays in the list', async () => {
    const user = userEvent.setup()
    renderModal({ note: buildNote({ attachments: [buildAttachment({ id: 9 })] }) })
    const chip = screen.getByText('photo.png').closest('div')!
    await user.click(chip.querySelector('button')!)
    expect(screen.getByText('photo.png')).toBeInTheDocument()
  })

  it('FE-W5CNF-021: an attachment without an original name renders an empty label', () => {
    renderModal({
      note: buildNote({
        attachments: [buildAttachment({ id: 11, original_name: undefined as unknown as string, mime_type: 'text/plain' })],
      }),
    })
    const section = screen.getByText('collab.notes.attachFiles').parentElement!
    expect(section.querySelectorAll('img').length).toBe(0)
  })
})
