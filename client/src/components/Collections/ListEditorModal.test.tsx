// FE-COMP-LISTEDITOR-001 to FE-COMP-LISTEDITOR-025
import React from 'react'
import type { Mock } from 'vitest'
import { render, screen, fireEvent, waitFor } from '../../../tests/helpers/render'
import type { Collection } from '@trek/shared'
import { useCollectionStore } from '../../store/collectionStore'
import { tripsApi } from '../../api/client'
import { useTranslation } from '../../i18n/TranslationContext'
import ListEditorModal from './ListEditorModal'

// The modal takes `t` as a prop, so a harness forwards the real English
// translator from the provider the render helper mounts.
type Props = React.ComponentProps<typeof ListEditorModal>
function Harness(props: Omit<Props, 't'>): React.ReactElement {
  const { t } = useTranslation()
  return <ListEditorModal {...props} t={t} />
}

const existing: Collection = {
  id: 42,
  owner_id: 1,
  name: 'Tokyo 2026',
  color: '#ec4899',
  description: 'Ramen shortlist',
  links: [{ label: 'Guide', url: 'https://guide.example' }],
  cover_image: '/uploads/covers/tokyo.jpg',
  is_owner: true,
}

type CollectionStore = ReturnType<typeof useCollectionStore.getState>
type AddToast = NonNullable<typeof window.__addToast>

const initialCollectionState = useCollectionStore.getState()
let actions: {
  createCollection: Mock<CollectionStore['createCollection']>
  updateCollection: Mock<CollectionStore['updateCollection']>
  uploadCover: Mock<CollectionStore['uploadCover']>
}
let addToast: Mock<AddToast>

const realCreateObjectURL = URL.createObjectURL
const realRevokeObjectURL = URL.revokeObjectURL
function stubObjectUrl(value: unknown, revoke: unknown): void {
  Object.defineProperty(URL, 'createObjectURL', { writable: true, configurable: true, value })
  Object.defineProperty(URL, 'revokeObjectURL', { writable: true, configurable: true, value: revoke })
}

function setup(over: Partial<Omit<Props, 't'>> = {}) {
  const props: Omit<Props, 't'> = {
    target: 'new',
    onClose: vi.fn(),
    onCreated: vi.fn(),
    onRequestDelete: vi.fn(),
    ...over,
  }
  const view = render(<Harness {...props} />)
  return { ...view, props }
}

describe('ListEditorModal', () => {
  beforeEach(() => {
    useCollectionStore.setState(initialCollectionState, true)
    actions = {
      createCollection: vi.fn<CollectionStore['createCollection']>(async () => ({ id: 77, owner_id: 1, name: 'Fresh' })),
      updateCollection: vi.fn<CollectionStore['updateCollection']>(async () => undefined),
      uploadCover: vi.fn<CollectionStore['uploadCover']>(async () => undefined),
    }
    useCollectionStore.setState(actions)
    addToast = vi.fn<AddToast>(() => 0)
    window.__addToast = addToast
    // Node's URL.createObjectURL rejects a jsdom File, so the preview blob is stubbed.
    stubObjectUrl(vi.fn(() => 'blob:cover-preview'), vi.fn())
    vi.spyOn(tripsApi, 'searchCoverImages').mockResolvedValue({
      photos: [
        { id: 'p1', url: 'https://img/full1.jpg', thumb: 'https://img/thumb1.jpg', description: 'A street', photographer: 'Rin' },
        { id: 'p2', url: 'https://img/full2.jpg', thumb: 'https://img/thumb2.jpg', description: null, photographer: null },
      ],
    })
  })

  afterEach(() => {
    vi.restoreAllMocks()
    delete window.__addToast
    stubObjectUrl(realCreateObjectURL, realRevokeObjectURL)
  })

  it('FE-COMP-LISTEDITOR-001: renders nothing while the target is null', () => {
    setup({ target: null })
    expect(screen.queryByRole('heading', { name: /New list|Edit list/ })).not.toBeInTheDocument()
  })

  it('FE-COMP-LISTEDITOR-002: create mode shows the New list title and a Create action', () => {
    setup()
    expect(screen.getByRole('heading', { name: 'New list' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Create' })).toBeDisabled()
    expect(screen.queryByRole('button', { name: /Delete list/ })).not.toBeInTheDocument()
  })

  it('FE-COMP-LISTEDITOR-003: edit mode seeds name, description, links and the cover preview', () => {
    setup({ target: existing })
    expect(screen.getByRole('heading', { name: 'Edit list' })).toBeInTheDocument()
    expect(screen.getByDisplayValue('Tokyo 2026')).toBeInTheDocument()
    expect(screen.getByDisplayValue('Ramen shortlist')).toBeInTheDocument()
    expect(screen.getByDisplayValue('Guide')).toBeInTheDocument()
    expect(screen.getByDisplayValue('https://guide.example')).toBeInTheDocument()
    // A seeded cover flips the button label and paints the image.
    expect(screen.getByRole('button', { name: 'Change cover' })).toBeInTheDocument()
    expect(document.querySelector('img[src="/uploads/covers/tokyo.jpg"]')).toBeTruthy()
  })

  it('FE-COMP-LISTEDITOR-004: the owner gets a Delete list action that closes and hands off the id', () => {
    const { props } = setup({ target: existing })
    fireEvent.click(screen.getByRole('button', { name: /Delete list/ }))
    expect(props.onClose).toHaveBeenCalledTimes(1)
    expect(props.onRequestDelete).toHaveBeenCalledWith(42)
  })

  it('FE-COMP-LISTEDITOR-005: a non-owner editor sees no Delete list action', () => {
    setup({ target: { ...existing, is_owner: false } })
    expect(screen.queryByRole('button', { name: /Delete list/ })).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Save' })).toBeInTheDocument()
  })

  it('FE-COMP-LISTEDITOR-006: creating posts the trimmed payload and reports the new id', async () => {
    const { props } = setup()
    fireEvent.change(screen.getByPlaceholderText('e.g. Tokyo 2025'), { target: { value: '  Rome  ' } })
    fireEvent.change(screen.getByPlaceholderText('Add a description…'), { target: { value: '  gelato  ' } })
    fireEvent.click(screen.getByRole('button', { name: 'Create' }))

    await waitFor(() => expect(actions.createCollection).toHaveBeenCalledTimes(1))
    expect(actions.createCollection).toHaveBeenCalledWith({
      name: 'Rome',
      color: '#6366f1',
      description: 'gelato',
      links: [],
    })
    expect(props.onCreated).toHaveBeenCalledWith(77)
    expect(props.onClose).toHaveBeenCalledTimes(1)
  })

  it('FE-COMP-LISTEDITOR-007: an empty description is sent as null', async () => {
    setup()
    fireEvent.change(screen.getByPlaceholderText('e.g. Tokyo 2025'), { target: { value: 'Rome' } })
    fireEvent.click(screen.getByRole('button', { name: 'Create' }))
    await waitFor(() => expect(actions.createCollection).toHaveBeenCalled())
    expect(actions.createCollection.mock.calls[0][0].description).toBeNull()
  })

  it('FE-COMP-LISTEDITOR-008: editing patches the existing list and never calls onCreated', async () => {
    const { props } = setup({ target: existing })
    fireEvent.change(screen.getByDisplayValue('Tokyo 2026'), { target: { value: 'Tokyo 2027' } })
    fireEvent.click(screen.getByRole('button', { name: 'Save' }))

    await waitFor(() => expect(actions.updateCollection).toHaveBeenCalledTimes(1))
    expect(actions.updateCollection).toHaveBeenCalledWith(42, expect.objectContaining({ name: 'Tokyo 2027', color: '#ec4899' }))
    expect(actions.createCollection).not.toHaveBeenCalled()
    expect(props.onCreated).not.toHaveBeenCalled()
    expect(props.onClose).toHaveBeenCalledTimes(1)
  })

  it('FE-COMP-LISTEDITOR-009: Enter in the name field saves', async () => {
    setup()
    const nameInput = screen.getByPlaceholderText('e.g. Tokyo 2025')
    fireEvent.change(nameInput, { target: { value: 'Lisbon' } })
    fireEvent.keyDown(nameInput, { key: 'Enter' })
    await waitFor(() => expect(actions.createCollection).toHaveBeenCalled())
  })

  it('FE-COMP-LISTEDITOR-010: Enter on a blank name does nothing', () => {
    setup()
    fireEvent.keyDown(screen.getByPlaceholderText('e.g. Tokyo 2025'), { key: 'Enter' })
    expect(actions.createCollection).not.toHaveBeenCalled()
  })

  it('FE-COMP-LISTEDITOR-026: a second Enter while the create is in flight does not make a second list', async () => {
    let release: (value: { id: number; owner_id: number; name: string }) => void = () => {}
    actions.createCollection.mockReturnValueOnce(new Promise(resolve => { release = resolve }))
    const { props } = setup()
    const nameInput = screen.getByPlaceholderText('e.g. Tokyo 2025')
    fireEvent.change(nameInput, { target: { value: 'Lisbon' } })
    fireEvent.keyDown(nameInput, { key: 'Enter' })
    await waitFor(() => expect(actions.createCollection).toHaveBeenCalledTimes(1))
    fireEvent.keyDown(nameInput, { key: 'Enter' })
    release({ id: 77, owner_id: 1, name: 'Lisbon' })
    await waitFor(() => expect(props.onClose).toHaveBeenCalled())
    expect(actions.createCollection).toHaveBeenCalledTimes(1)
    expect(props.onCreated).toHaveBeenCalledTimes(1)
  })

  it('FE-COMP-LISTEDITOR-011: picking a swatch changes the saved colour', async () => {
    setup()
    fireEvent.change(screen.getByPlaceholderText('e.g. Tokyo 2025'), { target: { value: 'Oslo' } })
    fireEvent.click(screen.getByRole('button', { name: '#22c55e' }))
    fireEvent.click(screen.getByRole('button', { name: 'Create' }))
    await waitFor(() => expect(actions.createCollection).toHaveBeenCalled())
    expect(actions.createCollection.mock.calls[0][0].color).toBe('#22c55e')
  })

  it('FE-COMP-LISTEDITOR-012: links are normalised, labelled and blank rows are dropped', async () => {
    setup()
    fireEvent.change(screen.getByPlaceholderText('e.g. Tokyo 2025'), { target: { value: 'Oslo' } })
    fireEvent.click(screen.getByRole('button', { name: /Add link/ }))
    fireEvent.click(screen.getByRole('button', { name: /Add link/ }))

    const urls = screen.getAllByPlaceholderText('https://…')
    const labels = screen.getAllByPlaceholderText('Label')
    fireEvent.change(labels[0], { target: { value: '  Menu  ' } })
    fireEvent.change(urls[0], { target: { value: 'example.com/menu' } })
    // The second row stays blank and must not reach the payload.
    fireEvent.click(screen.getByRole('button', { name: 'Create' }))

    await waitFor(() => expect(actions.createCollection).toHaveBeenCalled())
    expect(actions.createCollection.mock.calls[0][0].links).toEqual([
      { label: 'Menu', url: 'https://example.com/menu' },
    ])
  })

  it('FE-COMP-LISTEDITOR-013: a link row can be removed again', () => {
    setup({ target: existing })
    expect(screen.getByDisplayValue('https://guide.example')).toBeInTheDocument()
    fireEvent.click(screen.getAllByRole('button', { name: 'Delete' })[0])
    expect(screen.queryByDisplayValue('https://guide.example')).not.toBeInTheDocument()
  })

  it('FE-COMP-LISTEDITOR-014: choosing a file shows a preview and uploads it after the create', async () => {
    const file = new File(['x'], 'cover.png', { type: 'image/png' })
    const { container } = setup()
    fireEvent.change(screen.getByPlaceholderText('e.g. Tokyo 2025'), { target: { value: 'Oslo' } })
    const fileInput = container.ownerDocument.querySelector('input[type="file"]') as HTMLInputElement
    fireEvent.change(fileInput, { target: { files: [file] } })

    expect(screen.getByRole('button', { name: 'Change cover' })).toBeInTheDocument()
    expect(document.querySelector('img[src="blob:cover-preview"]')).toBeTruthy()

    fireEvent.click(screen.getByRole('button', { name: 'Create' }))
    await waitFor(() => expect(actions.uploadCover).toHaveBeenCalledWith(77, file))
  })

  it('FE-COMP-LISTEDITOR-015: the cover tile opens the file picker, and an empty pick leaves the cover alone', () => {
    const { container } = setup()
    const fileInput = container.ownerDocument.querySelector('input[type="file"]') as HTMLInputElement
    const openPicker = vi.fn()
    fileInput.addEventListener('click', openPicker)

    fireEvent.click(screen.getByRole('button', { name: 'Add cover' }))
    expect(openPicker).toHaveBeenCalledTimes(1)

    fireEvent.change(fileInput, { target: { files: [] } })
    expect(screen.getByRole('button', { name: 'Add cover' })).toBeInTheDocument()
  })

  it('FE-COMP-LISTEDITOR-016: the Unsplash search renders results and the picked photo becomes cover_image', async () => {
    setup()
    fireEvent.change(screen.getByPlaceholderText('e.g. Tokyo 2025'), { target: { value: 'Oslo' } })
    fireEvent.change(screen.getByPlaceholderText('Search destination photos'), { target: { value: 'fjord' } })
    fireEvent.click(screen.getByRole('button', { name: /Search Unsplash/ }))

    expect(await screen.findByRole('button', { name: 'Rin' })).toBeInTheDocument()
    expect(tripsApi.searchCoverImages).toHaveBeenCalledWith('fjord')
    // A photo without a photographer falls back to the generic label.
    fireEvent.click(screen.getByRole('button', { name: 'Unsplash' }))
    expect(document.querySelector('img[src="https://img/full2.jpg"]')).toBeTruthy()

    fireEvent.click(screen.getByRole('button', { name: 'Create' }))
    await waitFor(() => expect(actions.createCollection).toHaveBeenCalled())
    expect(actions.createCollection.mock.calls[0][0].cover_image).toBe('https://img/full2.jpg')
    expect(actions.uploadCover).not.toHaveBeenCalled()
  })

  it('FE-COMP-LISTEDITOR-017: an empty query falls back to the list name, Enter triggers the search', async () => {
    setup()
    const query = screen.getByPlaceholderText('Search destination photos')
    fireEvent.change(screen.getByPlaceholderText('e.g. Tokyo 2025'), { target: { value: 'Bergen' } })
    fireEvent.keyDown(query, { key: 'Enter' })
    await waitFor(() => expect(tripsApi.searchCoverImages).toHaveBeenCalledWith('Bergen'))
  })

  it('FE-COMP-LISTEDITOR-018: with neither a query nor a name the search button stays disabled', () => {
    setup()
    expect(screen.getByRole('button', { name: /Search Unsplash/ })).toBeDisabled()
  })

  it('FE-COMP-LISTEDITOR-019: a failing cover search clears the result grid', async () => {
    vi.mocked(tripsApi.searchCoverImages).mockRejectedValueOnce(new Error('offline'))
    setup()
    fireEvent.change(screen.getByPlaceholderText('Search destination photos'), { target: { value: 'fjord' } })
    fireEvent.click(screen.getByRole('button', { name: /Search Unsplash/ }))
    await waitFor(() => expect(tripsApi.searchCoverImages).toHaveBeenCalled())
    expect(screen.queryByRole('button', { name: 'Rin' })).not.toBeInTheDocument()
  })

  it('FE-COMP-LISTEDITOR-020: an uploaded file wins over a previously picked Unsplash photo', async () => {
    const file = new File(['x'], 'cover.png', { type: 'image/png' })
    const { container } = setup()
    fireEvent.change(screen.getByPlaceholderText('e.g. Tokyo 2025'), { target: { value: 'Oslo' } })
    fireEvent.change(screen.getByPlaceholderText('Search destination photos'), { target: { value: 'fjord' } })
    fireEvent.click(screen.getByRole('button', { name: /Search Unsplash/ }))
    fireEvent.click(await screen.findByRole('button', { name: 'Rin' }))

    const fileInput = container.ownerDocument.querySelector('input[type="file"]') as HTMLInputElement
    fireEvent.change(fileInput, { target: { files: [file] } })
    fireEvent.click(screen.getByRole('button', { name: 'Create' }))

    await waitFor(() => expect(actions.createCollection).toHaveBeenCalled())
    expect(actions.createCollection.mock.calls[0][0].cover_image).toBeUndefined()
    await waitFor(() => expect(actions.uploadCover).toHaveBeenCalledWith(77, file))
  })

  it('FE-COMP-LISTEDITOR-021: a failed cover upload toasts the server message and the retry updates instead of re-creating', async () => {
    actions.uploadCover.mockRejectedValueOnce({ response: { data: { error: 'Cover too large' } } })
    const file = new File(['x'], 'cover.png', { type: 'image/png' })
    const { container, props } = setup()
    fireEvent.change(screen.getByPlaceholderText('e.g. Tokyo 2025'), { target: { value: 'Oslo' } })
    fireEvent.change(container.ownerDocument.querySelector('input[type="file"]') as HTMLInputElement, { target: { files: [file] } })

    fireEvent.click(screen.getByRole('button', { name: 'Create' }))
    await waitFor(() => expect(addToast).toHaveBeenCalledWith('Cover too large', 'error', undefined))
    expect(props.onClose).not.toHaveBeenCalled()

    // Retry: the id from the first (successful) create is reused.
    fireEvent.click(screen.getByRole('button', { name: 'Create' }))
    await waitFor(() => expect(actions.updateCollection).toHaveBeenCalledWith(77, expect.objectContaining({ name: 'Oslo' })))
    expect(actions.createCollection).toHaveBeenCalledTimes(1)
  })

  it('FE-COMP-LISTEDITOR-022: switching the target reseeds the form', () => {
    const { rerender, props } = setup({ target: existing })
    fireEvent.change(screen.getByDisplayValue('Tokyo 2026'), { target: { value: 'scratch' } })
    rerender(<Harness {...props} target="new" />)
    expect(screen.queryByDisplayValue('scratch')).not.toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'New list' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Add cover' })).toBeInTheDocument()
  })

  it('FE-COMP-LISTEDITOR-023: a create that fails outright keeps the modal open and reports the error', async () => {
    actions.createCollection.mockRejectedValueOnce(new Error('boom'))
    const { props } = setup()
    fireEvent.change(screen.getByPlaceholderText('e.g. Tokyo 2025'), { target: { value: 'Oslo' } })
    fireEvent.click(screen.getByRole('button', { name: 'Create' }))
    // A plain failure has no server-provided message, so the translated fallback shows.
    await waitFor(() => expect(addToast).toHaveBeenCalledWith('Error', 'error', undefined))
    expect(props.onClose).not.toHaveBeenCalled()
    // The save button releases again so the user can retry.
    await waitFor(() => expect(screen.getByRole('button', { name: 'Create' })).not.toBeDisabled())
  })

  it('FE-COMP-LISTEDITOR-024: unmounting revokes the last preview blob', () => {
    const revoke = vi.fn()
    stubObjectUrl(vi.fn(() => 'blob:cover-preview'), revoke)
    const file = new File(['x'], 'cover.png', { type: 'image/png' })
    const { container, unmount } = setup()
    fireEvent.change(container.ownerDocument.querySelector('input[type="file"]') as HTMLInputElement, { target: { files: [file] } })
    unmount()
    expect(revoke).toHaveBeenCalledWith('blob:cover-preview')
  })

  it('FE-COMP-LISTEDITOR-025: Cancel closes without touching the store', () => {
    const { props } = setup({ target: existing })
    fireEvent.click(screen.getByRole('button', { name: 'Cancel' }))
    expect(props.onClose).toHaveBeenCalledTimes(1)
    expect(actions.updateCollection).not.toHaveBeenCalled()
  })
})
