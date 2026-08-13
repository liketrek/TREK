import type { ComponentProps } from 'react'
import { afterEach, beforeEach, describe, expect, it, vi, type Mock } from 'vitest'
import type { CollectionLabel, CollectionPlace } from '@trek/shared'
import { fireEvent, render, screen, waitFor } from '../../../helpers/render'
import MCollPlaceSheet from '../../../../src/mobile/screens/collections/MCollPlaceSheet'
import { mapsApi } from '../../../../src/api/client'
import type { Category } from '../../../../src/types'
import { resetAllStores } from '../../../helpers/store'
import { useTranslation } from '../../../../src/i18n'

// FE-MOB-CPLSH-001 to FE-MOB-CPLSH-037

// react-markdown ships ESM-only chunks jsdom chokes on; the sheet only needs
// the raw description text to reach the renderer.
vi.mock('react-markdown', () => ({
  default: ({ children }: { children: string }) => <span data-testid="md">{children}</span>,
}))
vi.mock('remark-gfm', () => ({ default: () => ({}) }))
vi.mock('remark-breaks', () => ({ default: () => ({}) }))

type Props = ComponentProps<typeof MCollPlaceSheet>

const CATEGORIES = [
  { id: 3, name: 'Restaurant', color: '#E8843D', icon: 'Utensils' },
  { id: 5, name: 'Hotel', color: '#9B5DE5', icon: 'BedDouble' },
] as unknown as Category[]

const LABELS: CollectionLabel[] = [
  { id: 11, collection_id: 1, name: 'Must see', color: '#EF4444' },
  { id: 12, collection_id: 1, name: 'Rainy day', color: null },
]

function place(over: Partial<CollectionPlace> = {}): CollectionPlace {
  return {
    id: 7,
    collection_id: 1,
    name: 'Narisawa',
    address: '2-6-15 Minami-Aoyama',
    status: 'want',
    category_id: 3,
    category: { id: 3, name: 'Restaurant', color: '#E8843D', icon: 'Utensils' },
    description: 'Two stars, book early',
    links: [{ label: 'Menu', url: 'https://narisawa.example/menu' }, { url: 'https://www.booking.example/x' }],
    label_ids: [11],
    ...over,
  } as CollectionPlace
}

type AddToast = NonNullable<Window['__addToast']>
let addToast: Mock<AddToast>

function Harness(props: Omit<Props, 't'>) {
  const { t } = useTranslation()
  return <MCollPlaceSheet {...props} t={t} />
}

function setup(over: Partial<Props> = {}) {
  const onClose = vi.fn()
  const onSetStatus = vi.fn()
  const onSave = vi.fn<Props['onSave']>().mockResolvedValue(undefined)
  const onCopyToTrip = vi.fn()
  const onRemove = vi.fn()
  const props: Omit<Props, 't'> = {
    place: place(),
    canEdit: true,
    canDelete: true,
    categories: CATEGORIES,
    labels: LABELS,
    onClose,
    onSetStatus,
    onSave,
    onCopyToTrip,
    onRemove,
    ...over,
  }
  const view = render(<Harness {...props} />)
  return { ...view, onClose, onSetStatus, onSave, onCopyToTrip, onRemove, props }
}

function pngFile(name = 'cover.png') {
  return new File(['x'], name, { type: 'image/png' })
}

describe('MCollPlaceSheet', () => {
  beforeEach(() => {
    resetAllStores()
    addToast = vi.fn<AddToast>()
    window.__addToast = addToast
    vi.spyOn(mapsApi, 'placePhoto').mockResolvedValue({ photoUrl: null })
  })

  afterEach(() => {
    vi.restoreAllMocks()
    delete window.__addToast
  })

  it('FE-MOB-CPLSH-001: heads the sheet with the place, its category chip and address', () => {
    setup()
    expect(screen.getByRole('dialog', { name: 'Narisawa' })).toBeInTheDocument()
    expect(screen.getByText('Narisawa')).toBeInTheDocument()
    expect(screen.getByText('Restaurant')).toBeInTheDocument()
    expect(screen.getByText('2-6-15 Minami-Aoyama')).toBeInTheDocument()
  })

  it('FE-MOB-CPLSH-002: null place keeps the sheet unmounted', () => {
    setup({ place: null })
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })

  it('FE-MOB-CPLSH-003: a place without a category or address drops both rows', () => {
    setup({ place: place({ category: undefined, category_id: null, address: null }) })
    expect(screen.queryByText('Restaurant')).not.toBeInTheDocument()
    expect(screen.queryByText('2-6-15 Minami-Aoyama')).not.toBeInTheDocument()
  })

  it('FE-MOB-CPLSH-004: the status cycle marks the current status and reports a new one', () => {
    const { onSetStatus } = setup()
    expect(screen.getByRole('button', { name: 'Want to go' })).toHaveAttribute('aria-pressed', 'true')
    expect(screen.getByRole('button', { name: 'Idea' })).toHaveAttribute('aria-pressed', 'false')

    fireEvent.click(screen.getByRole('button', { name: 'Visited' }))
    expect(onSetStatus).toHaveBeenCalledWith('visited')
  })

  it('FE-MOB-CPLSH-005: a read-only member cannot change the status or edit', () => {
    setup({ canEdit: false })
    expect(screen.getByRole('button', { name: 'Visited' })).toBeDisabled()
    expect(screen.queryByRole('button', { name: 'Edit' })).not.toBeInTheDocument()
  })

  it('FE-MOB-CPLSH-006: assigned labels are shown, unassigned ones are not', () => {
    setup()
    expect(screen.getByText('Must see')).toBeInTheDocument()
    expect(screen.queryByText('Rainy day')).not.toBeInTheDocument()
  })

  it('FE-MOB-CPLSH-007: the description is rendered as markdown', () => {
    setup()
    expect(screen.getByTestId('md')).toHaveTextContent('Two stars, book early')
  })

  it('FE-MOB-CPLSH-008: links show their label, falling back to the bare host', () => {
    setup()
    const menu = screen.getByRole('link', { name: 'Menu' })
    expect(menu).toHaveAttribute('href', 'https://narisawa.example/menu')
    expect(menu).toHaveAttribute('rel', 'noopener noreferrer')
    expect(screen.getByRole('link', { name: 'booking.example' })).toBeInTheDocument()
  })

  it('FE-MOB-CPLSH-009: a malformed link url falls back to the raw string', () => {
    setup({ place: place({ links: [{ url: 'not a url' }] }) })
    expect(screen.getByRole('link', { name: 'not a url' })).toBeInTheDocument()
  })

  it('FE-MOB-CPLSH-010: copy-to-trip, remove and close hand back to the screen', () => {
    const { onCopyToTrip, onRemove, onClose } = setup()
    fireEvent.click(screen.getByRole('button', { name: 'Copy to trip' }))
    expect(onCopyToTrip).toHaveBeenCalled()

    fireEvent.click(screen.getByRole('button', { name: 'Remove from list' }))
    expect(onRemove).toHaveBeenCalled()

    fireEvent.click(screen.getByRole('button', { name: 'Close' }))
    expect(onClose).toHaveBeenCalled()
  })

  it('FE-MOB-CPLSH-011: without delete rights the remove action is gone', () => {
    setup({ canDelete: false })
    expect(screen.queryByRole('button', { name: 'Remove from list' })).not.toBeInTheDocument()
  })

  it('FE-MOB-CPLSH-012: the edit form is seeded from the place', () => {
    setup()
    fireEvent.click(screen.getByRole('button', { name: 'Edit' }))
    expect(screen.getByDisplayValue('Narisawa')).toBeInTheDocument()
    expect(screen.getByDisplayValue('Two stars, book early')).toBeInTheDocument()
    expect(screen.getByDisplayValue('https://narisawa.example/menu')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Must see' })).toHaveAttribute('aria-pressed', 'true')
    expect(screen.getByRole('button', { name: 'Rainy day' })).toHaveAttribute('aria-pressed', 'false')
    // The read-only address line gives way to the editable field (#1870).
    expect(screen.queryByText('2-6-15 Minami-Aoyama')).not.toBeInTheDocument()
    expect(screen.getByDisplayValue('2-6-15 Minami-Aoyama')).toBeInTheDocument()
  })

  it('FE-MOB-CPLSH-013: saving sends the trimmed name, labels, category and normalised links', async () => {
    const { onSave } = setup()
    fireEvent.click(screen.getByRole('button', { name: 'Edit' }))
    fireEvent.change(screen.getByDisplayValue('Narisawa'), { target: { value: '  Narisawa Tokyo ' } })
    fireEvent.click(screen.getByRole('button', { name: 'Rainy day' }))
    fireEvent.change(screen.getByDisplayValue('https://www.booking.example/x'), { target: { value: 'booking.example/y' } })
    fireEvent.click(screen.getByRole('button', { name: 'Save' }))

    await waitFor(() => expect(onSave).toHaveBeenCalledWith({
      name: 'Narisawa Tokyo',
      // Untouched here, but the address rides along on every save (#1870).
      address: '2-6-15 Minami-Aoyama',
      description: 'Two stars, book early',
      links: [
        { label: 'Menu', url: 'https://narisawa.example/menu' },
        { label: undefined, url: 'https://booking.example/y' },
      ],
      category_id: 3,
      label_ids: [11, 12],
    }))
    // Back to the read view.
    await waitFor(() => expect(screen.getByRole('button', { name: 'Edit' })).toBeInTheDocument())
  })

  it('FE-MOB-CPLSH-014: an emptied name keeps the old one and a blank description clears it', async () => {
    const { onSave } = setup()
    fireEvent.click(screen.getByRole('button', { name: 'Edit' }))
    fireEvent.change(screen.getByDisplayValue('Narisawa'), { target: { value: '   ' } })
    fireEvent.change(screen.getByDisplayValue('Two stars, book early'), { target: { value: '  ' } })
    fireEvent.click(screen.getByRole('button', { name: 'Save' }))

    await waitFor(() => expect(onSave).toHaveBeenCalledWith(expect.objectContaining({
      name: 'Narisawa',
      description: null,
    })))
  })

  it('FE-MOB-CPLSH-015: blank link rows are dropped before saving', async () => {
    const { onSave } = setup({ place: place({ links: [{ url: '   ' }] }) })
    fireEvent.click(screen.getByRole('button', { name: 'Edit' }))
    fireEvent.click(screen.getByRole('button', { name: 'Save' }))
    await waitFor(() => expect(onSave).toHaveBeenCalledWith(expect.objectContaining({ links: [] })))
  })

  it('FE-MOB-CPLSH-016: a failed save keeps the form open and shows the server message', async () => {
    const onSave = vi.fn<Props['onSave']>().mockRejectedValue({ response: { data: { error: 'Name taken' } } })
    setup({ onSave })
    fireEvent.click(screen.getByRole('button', { name: 'Edit' }))
    fireEvent.click(screen.getByRole('button', { name: 'Save' }))
    await waitFor(() => expect(addToast).toHaveBeenCalledWith('Name taken', 'error', undefined))
    expect(screen.getByDisplayValue('Narisawa')).toBeInTheDocument()
  })

  it('FE-MOB-CPLSH-017: the save button is locked while the request runs', async () => {
    let resolve!: () => void
    const onSave = vi.fn<Props['onSave']>().mockReturnValue(new Promise<void>(r => { resolve = r }))
    setup({ onSave })
    fireEvent.click(screen.getByRole('button', { name: 'Edit' }))
    fireEvent.click(screen.getByRole('button', { name: 'Save' }))
    expect(screen.getByRole('button', { name: 'Save' })).toBeDisabled()

    resolve()
    await waitFor(() => expect(screen.getByRole('button', { name: 'Edit' })).toBeInTheDocument())
  })

  it('FE-MOB-CPLSH-018: cancel throws the edits away and returns to the read view', () => {
    const { onSave } = setup()
    fireEvent.click(screen.getByRole('button', { name: 'Edit' }))
    fireEvent.change(screen.getByDisplayValue('Narisawa'), { target: { value: 'Something else' } })
    fireEvent.click(screen.getByRole('button', { name: 'Cancel' }))
    expect(onSave).not.toHaveBeenCalled()

    fireEvent.click(screen.getByRole('button', { name: 'Edit' }))
    expect(screen.getByDisplayValue('Narisawa')).toBeInTheDocument()
  })

  it('FE-MOB-CPLSH-019: a list without labels hides the label picker in edit mode', () => {
    setup({ labels: [] })
    fireEvent.click(screen.getByRole('button', { name: 'Edit' }))
    expect(screen.queryByRole('button', { name: 'Must see' })).not.toBeInTheDocument()
    expect(screen.getByDisplayValue('Narisawa')).toBeInTheDocument()
  })

  it('FE-MOB-CPLSH-020: the stored cover wins over the auto photo lookup', () => {
    setup({ place: place({ image_url: '/uploads/places/n.jpg', google_place_id: 'gp1' }) })
    expect(document.querySelector('img')).toHaveAttribute('src', '/uploads/places/n.jpg')
    expect(mapsApi.placePhoto).not.toHaveBeenCalled()
  })

  it('FE-MOB-CPLSH-021: without a cover the maps photo is fetched by place id', async () => {
    vi.mocked(mapsApi.placePhoto).mockResolvedValue({ photoUrl: 'https://photos.example/n.jpg' })
    setup({ place: place({ google_place_id: 'gp1' }) })
    await waitFor(() => expect(document.querySelector('img')).toHaveAttribute('src', 'https://photos.example/n.jpg'))
    expect(mapsApi.placePhoto).toHaveBeenCalledWith('gp1', undefined, undefined, 'Narisawa')
  })

  it('FE-MOB-CPLSH-022: coordinates stand in when there is no provider id', async () => {
    setup({ place: place({ lat: 35.6, lng: 139.7 }) })
    await waitFor(() => expect(mapsApi.placePhoto).toHaveBeenCalledWith('35.6,139.7', 35.6, 139.7, 'Narisawa'))
    // A null photoUrl leaves the gradient hero in place.
    expect(document.querySelector('img')).toBeNull()
  })

  it('FE-MOB-CPLSH-023: a place with neither id nor coordinates never asks for a photo', () => {
    setup()
    expect(mapsApi.placePhoto).not.toHaveBeenCalled()
  })

  it('FE-MOB-CPLSH-024: a failing photo lookup is swallowed', async () => {
    vi.mocked(mapsApi.placePhoto).mockRejectedValue(new Error('quota'))
    setup({ place: place({ osm_id: 'node/1' }) })
    await waitFor(() => expect(mapsApi.placePhoto).toHaveBeenCalled())
    expect(document.querySelector('img')).toBeNull()
    expect(screen.getByText('Narisawa')).toBeInTheDocument()
  })

  it('FE-MOB-CPLSH-025: the camera button needs both an upload handler and edit rights', () => {
    const { rerender, props } = setup()
    expect(screen.queryByRole('button', { name: 'Upload image' })).not.toBeInTheDocument()

    rerender(<Harness {...props} onUploadImage={vi.fn()} canEdit={false} />)
    expect(screen.queryByRole('button', { name: 'Upload image' })).not.toBeInTheDocument()

    rerender(<Harness {...props} onUploadImage={vi.fn()} />)
    expect(screen.getByRole('button', { name: 'Upload image' })).toBeInTheDocument()
  })

  it('FE-MOB-CPLSH-026: picking a file uploads it and clears the input again', async () => {
    const onUploadImage = vi.fn<(f: File) => Promise<void>>().mockResolvedValue(undefined)
    setup({ onUploadImage })
    fireEvent.click(screen.getByRole('button', { name: 'Upload image' }))

    const input = document.querySelector('input[type="file"]') as HTMLInputElement
    const file = pngFile()
    fireEvent.change(input, { target: { files: [file] } })
    await waitFor(() => expect(onUploadImage).toHaveBeenCalledWith(file))
    expect(input.value).toBe('')
  })

  it('FE-MOB-CPLSH-027: an empty file pick is a no-op', () => {
    const onUploadImage = vi.fn<(f: File) => Promise<void>>().mockResolvedValue(undefined)
    setup({ onUploadImage })
    const input = document.querySelector('input[type="file"]') as HTMLInputElement
    fireEvent.change(input, { target: { files: [] } })
    expect(onUploadImage).not.toHaveBeenCalled()
  })

  it('FE-MOB-CPLSH-028: a failed upload falls back to the generic upload error', async () => {
    // No `error` field on the response — the sheet's own copy has to stand in.
    const onUploadImage = vi.fn<(f: File) => Promise<void>>().mockRejectedValue({ response: { data: {} } })
    setup({ onUploadImage })
    const input = document.querySelector('input[type="file"]') as HTMLInputElement
    fireEvent.change(input, { target: { files: [pngFile()] } })
    await waitFor(() => expect(addToast).toHaveBeenCalledWith('Could not upload image', 'error', undefined))
  })

  it('FE-MOB-CPLSH-029: an existing cover can be dropped again', async () => {
    const { onSave } = setup({ onUploadImage: vi.fn(), place: place({ image_url: '/uploads/places/n.jpg' }) })
    expect(screen.getByRole('button', { name: 'Change image' })).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Remove image' }))
    await waitFor(() => expect(onSave).toHaveBeenCalledWith({ image_url: null }))
  })

  it('FE-MOB-CPLSH-030: a failed cover removal reports the error', async () => {
    const onSave = vi.fn<Props['onSave']>().mockRejectedValue({ response: { data: { error: 'Locked' } } })
    setup({ onUploadImage: vi.fn(), onSave, place: place({ image_url: '/uploads/places/n.jpg' }) })
    fireEvent.click(screen.getByRole('button', { name: 'Remove image' }))
    await waitFor(() => expect(addToast).toHaveBeenCalledWith('Locked', 'error', undefined))
  })

  it('FE-MOB-CPLSH-031: the ratings row only appears when voting is wired up', () => {
    const onRate = vi.fn()
    const { rerender, props } = setup()
    expect(screen.queryByRole('radiogroup')).not.toBeInTheDocument()

    rerender(<Harness {...props} onRate={onRate} />)
    expect(screen.getByRole('radiogroup')).toBeInTheDocument()
    fireEvent.click(screen.getByRole('radio', { name: '4' }))
    expect(onRate).toHaveBeenCalledWith(4)
  })

  it('FE-MOB-CPLSH-032: opening a different place reseeds the form and leaves edit mode', () => {
    const { rerender, props } = setup()
    fireEvent.click(screen.getByRole('button', { name: 'Edit' }))
    expect(screen.getByDisplayValue('Narisawa')).toBeInTheDocument()

    rerender(<Harness {...props} place={place({ id: 8, name: 'Den', description: null, links: [], label_ids: [] })} />)
    expect(screen.queryByDisplayValue('Narisawa')).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Edit' })).toBeInTheDocument()
    expect(screen.getByText('Den')).toBeInTheDocument()
    expect(screen.queryByTestId('md')).not.toBeInTheDocument()
    expect(screen.queryByRole('link')).not.toBeInTheDocument()
  })

  it('FE-MOB-CPLSH-033: closing holds the last place through the exit animation', () => {
    const { rerender, props } = setup()
    rerender(<Harness {...props} place={null} />)
    expect(screen.getByText('Narisawa')).toBeInTheDocument()
  })

  // ── Editable address (#1870) ───────────────────────────────────────────────

  it('FE-MOB-CPLSH-034: the edit form seeds the address field from the place', () => {
    setup()
    fireEvent.click(screen.getByRole('button', { name: 'Edit' }))
    expect(screen.getByPlaceholderText('Street, City, Country')).toHaveValue('2-6-15 Minami-Aoyama')
  })

  it('FE-MOB-CPLSH-035: a corrected address is trimmed into the patch', async () => {
    const { onSave } = setup()
    fireEvent.click(screen.getByRole('button', { name: 'Edit' }))
    fireEvent.change(screen.getByPlaceholderText('Street, City, Country'), { target: { value: '  3-1-1 Kita-Aoyama ' } })
    fireEvent.click(screen.getByRole('button', { name: 'Save' }))

    await waitFor(() => expect(onSave).toHaveBeenCalledWith(expect.objectContaining({ address: '3-1-1 Kita-Aoyama' })))
  })

  it('FE-MOB-CPLSH-036: an emptied address is sent as null', async () => {
    const { onSave } = setup()
    fireEvent.click(screen.getByRole('button', { name: 'Edit' }))
    fireEvent.change(screen.getByPlaceholderText('Street, City, Country'), { target: { value: '   ' } })
    fireEvent.click(screen.getByRole('button', { name: 'Save' }))

    await waitFor(() => expect(onSave).toHaveBeenCalledWith(expect.objectContaining({ address: null })))
  })

  it('FE-MOB-CPLSH-037: cancel restores the stored address', () => {
    setup()
    fireEvent.click(screen.getByRole('button', { name: 'Edit' }))
    fireEvent.change(screen.getByPlaceholderText('Street, City, Country'), { target: { value: 'Elsewhere' } })
    fireEvent.click(screen.getByRole('button', { name: 'Cancel' }))
    expect(screen.getByText('2-6-15 Minami-Aoyama')).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: 'Edit' }))
    expect(screen.getByPlaceholderText('Street, City, Country')).toHaveValue('2-6-15 Minami-Aoyama')
  })
})
