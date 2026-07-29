// FE-MOB-COLEDIT-001 to FE-MOB-COLEDIT-014
import React from 'react'
import { describe, it, expect, vi, beforeEach, afterEach, type Mock } from 'vitest'
import { http, HttpResponse } from 'msw'
import userEvent from '@testing-library/user-event'
import { render, screen, fireEvent, waitFor } from '../../../helpers/render'
import { server } from '../../../helpers/msw/server'
import type { Collection } from '@trek/shared'
import MCollEditSheet from '../../../../src/mobile/screens/collections/MCollEditSheet'
import { useCollectionStore } from '../../../../src/store/collectionStore'
import { SWATCH_COLORS } from '../../../../src/mobile/screens/collections/collectionsMobileModel'

const t = (key: string) => key

function buildList(over: Partial<Collection> = {}): Collection {
  return {
    id: 4,
    owner_id: 1,
    name: 'Hamburg',
    color: '#38BDF8',
    description: 'Hafenrunde',
    cover_image: '/uploads/covers/hh.jpg',
    links: [{ label: 'Guide', url: 'https://hamburg.de' }],
    is_owner: true,
    ...over,
  }
}

type Props = React.ComponentProps<typeof MCollEditSheet>

function baseProps(overrides: Partial<Props> = {}): Props {
  return {
    target: 'new',
    onClose: vi.fn(),
    onCreated: vi.fn(),
    onRequestDelete: vi.fn(),
    t,
    ...overrides,
  }
}

type CollStore = ReturnType<typeof useCollectionStore.getState>
type AddToast = NonNullable<typeof window.__addToast>

let toast: Mock<AddToast>
let createCollection: Mock<CollStore['createCollection']>
let updateCollection: Mock<CollStore['updateCollection']>
let uploadCover: Mock<CollStore['uploadCover']>

const origCreateObjectURL = URL.createObjectURL
const origRevokeObjectURL = URL.revokeObjectURL

function stubObjectUrl(fn: unknown) {
  Object.defineProperty(URL, 'createObjectURL', { writable: true, configurable: true, value: fn })
}

function unsplash(photos: Record<string, unknown>[]) {
  server.use(http.get('/api/trips/cover-images/search', () => HttpResponse.json({ photos })))
}

/** The cover images carry no alt text, so they are addressed by src. */
const imageWithSrc = (src: string) => document.querySelector(`img[src="${src}"]`)

describe('MCollEditSheet', () => {
  beforeEach(() => {
    toast = vi.fn<AddToast>(() => 1)
    window.__addToast = toast
    // jsdom's URL.createObjectURL rejects a jsdom File, so the cover preview
    // needs a stub that just hands back a fake blob URL.
    stubObjectUrl(vi.fn(() => 'blob:cover'))
    Object.defineProperty(URL, 'revokeObjectURL', { writable: true, configurable: true, value: vi.fn() })

    createCollection = vi.fn<CollStore['createCollection']>(async () => buildList({ id: 11, name: 'Kopenhagen' }))
    updateCollection = vi.fn<CollStore['updateCollection']>(async () => undefined)
    uploadCover = vi.fn<CollStore['uploadCover']>(async () => undefined)
    useCollectionStore.setState({ createCollection, updateCollection, uploadCover })
  })

  afterEach(() => {
    delete window.__addToast
    stubObjectUrl(origCreateObjectURL)
    Object.defineProperty(URL, 'revokeObjectURL', { writable: true, configurable: true, value: origRevokeObjectURL })
  })

  it('FE-MOB-COLEDIT-001: stays unmounted for a null target and opens in create mode', () => {
    const { rerender } = render(<MCollEditSheet {...baseProps({ target: null })} />)
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()

    rerender(<MCollEditSheet {...baseProps()} />)
    expect(screen.getByRole('dialog', { name: 'collections.newList' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'collections.create' })).toBeDisabled()
    // Creating has nothing to delete yet.
    expect(screen.queryByRole('button', { name: /collections.deleteList/ })).not.toBeInTheDocument()
  })

  it('FE-MOB-COLEDIT-002: creating a list posts name, colour, description and normalised links', async () => {
    const user = userEvent.setup()
    const props = baseProps()
    render(<MCollEditSheet {...props} />)

    await user.type(screen.getByPlaceholderText('collections.listNamePlaceholder'), '  Kopenhagen  ')
    await user.type(screen.getByPlaceholderText('collections.descriptionPlaceholder'), ' Kanaltour ')
    await user.click(screen.getByRole('button', { name: SWATCH_COLORS[2] }))

    // Two link rows: one bare host that must be normalised, one empty that drops out.
    await user.click(screen.getByRole('button', { name: /collections.addLink/ }))
    await user.click(screen.getByRole('button', { name: /collections.addLink/ }))
    const urlInputs = screen.getAllByPlaceholderText('https://…')
    await user.type(urlInputs[0], 'visitcopenhagen.com')
    const labelInputs = screen.getAllByPlaceholderText('collections.linkLabel')
    await user.type(labelInputs[0], ' Tips ')

    await user.click(screen.getByRole('button', { name: 'collections.create' }))

    await waitFor(() => expect(createCollection).toHaveBeenCalledTimes(1))
    expect(createCollection).toHaveBeenCalledWith({
      name: 'Kopenhagen',
      color: SWATCH_COLORS[2],
      description: 'Kanaltour',
      links: [{ label: 'Tips', url: 'https://visitcopenhagen.com' }],
    })
    expect(props.onCreated).toHaveBeenCalledWith(11)
    expect(props.onClose).toHaveBeenCalledTimes(1)
  })

  it('FE-MOB-COLEDIT-003: a link row can be removed again before saving', async () => {
    const user = userEvent.setup()
    render(<MCollEditSheet {...baseProps({ target: buildList() })} />)

    expect(screen.getAllByPlaceholderText('https://…')).toHaveLength(1)
    await user.click(screen.getByRole('button', { name: 'common.delete' }))
    expect(screen.queryByPlaceholderText('https://…')).not.toBeInTheDocument()
  })

  it('FE-MOB-COLEDIT-004: editing seeds the form and saves through updateCollection', async () => {
    const user = userEvent.setup()
    const props = baseProps({ target: buildList() })
    render(<MCollEditSheet {...props} />)

    expect(screen.getByRole('dialog', { name: 'collections.editListTitle' })).toBeInTheDocument()
    expect(screen.getByPlaceholderText('collections.listNamePlaceholder')).toHaveValue('Hamburg')
    expect(screen.getByPlaceholderText('collections.descriptionPlaceholder')).toHaveValue('Hafenrunde')
    expect(imageWithSrc('/uploads/covers/hh.jpg')).not.toBeNull()
    // An existing cover offers to be replaced, not added.
    expect(screen.getByText('collections.changeCover')).toBeInTheDocument()

    await user.clear(screen.getByPlaceholderText('collections.descriptionPlaceholder'))
    await user.click(screen.getByRole('button', { name: 'common.save' }))

    await waitFor(() => expect(updateCollection).toHaveBeenCalledTimes(1))
    expect(updateCollection).toHaveBeenCalledWith(4, {
      name: 'Hamburg',
      color: '#38BDF8',
      description: null,
      links: [{ label: 'Guide', url: 'https://hamburg.de' }],
    })
    // An edit must not re-navigate the way a create does.
    expect(props.onCreated).not.toHaveBeenCalled()
    expect(props.onClose).toHaveBeenCalledTimes(1)
  })

  it('FE-MOB-COLEDIT-005: a list without a colour falls back to the first swatch', () => {
    render(<MCollEditSheet {...baseProps({ target: buildList({ color: null, description: null, links: undefined, cover_image: null }) })} />)

    expect(screen.getByRole('button', { name: SWATCH_COLORS[0] })).toHaveAttribute('aria-pressed', 'true')
    expect(document.querySelector('img')).toBeNull()
    expect(screen.getByText('collections.addCover')).toBeInTheDocument()
  })

  it('FE-MOB-COLEDIT-006: picking a file shows the local preview and uploads it after create', async () => {
    const user = userEvent.setup()
    render(<MCollEditSheet {...baseProps()} />)

    const file = new File(['x'], 'cover.png', { type: 'image/png' })
    const input = document.querySelector('input[type="file"]') as HTMLInputElement
    await user.upload(input, file)
    expect(imageWithSrc('blob:cover')).not.toBeNull()

    await user.type(screen.getByPlaceholderText('collections.listNamePlaceholder'), 'Kopenhagen')
    await user.click(screen.getByRole('button', { name: 'collections.create' }))

    await waitFor(() => expect(uploadCover).toHaveBeenCalledWith(11, file))
  })

  it('FE-MOB-COLEDIT-007: an aborted file dialog leaves the cover untouched', () => {
    render(<MCollEditSheet {...baseProps()} />)

    const input = document.querySelector('input[type="file"]') as HTMLInputElement
    const openDialog = vi.spyOn(input, 'click').mockImplementation(() => {})
    // The cover tile is the trigger for the hidden file input.
    fireEvent.click(screen.getByText('collections.addCover'))
    expect(openDialog).toHaveBeenCalledTimes(1)

    fireEvent.change(input, { target: { files: [] } })
    expect(document.querySelector('img')).toBeNull()
  })

  it('FE-MOB-COLEDIT-008: the Unsplash search offers photos and the pick is sent as cover_image', async () => {
    const user = userEvent.setup()
    unsplash([
      { id: 'p1', url: 'https://img/full1.jpg', thumb: 'https://img/t1.jpg', description: 'Canal', photographer: 'Ada' },
      { id: 'p2', url: 'https://img/full2.jpg', thumb: 'https://img/t2.jpg' },
    ])
    render(<MCollEditSheet {...baseProps()} />)

    await user.type(screen.getByPlaceholderText('dashboard.unsplashSearchPlaceholder'), 'copenhagen')
    await user.click(screen.getByRole('button', { name: /Unsplash/ }))

    const photo = await screen.findByRole('button', { name: 'Ada' })
    // The photographer credit is shown; a photo without one still renders its thumb.
    expect(screen.getByText('Ada')).toBeInTheDocument()
    expect(imageWithSrc('https://img/t2.jpg')).not.toBeNull()

    await user.click(photo)
    // The picked photo becomes the preview above the grid.
    expect(imageWithSrc('https://img/full1.jpg')).not.toBeNull()
    await user.type(screen.getByPlaceholderText('collections.listNamePlaceholder'), 'Kopenhagen')
    await user.click(screen.getByRole('button', { name: 'collections.create' }))

    await waitFor(() => expect(createCollection).toHaveBeenCalledTimes(1))
    expect(createCollection).toHaveBeenCalledWith(expect.objectContaining({ cover_image: 'https://img/full1.jpg' }))
    expect(uploadCover).not.toHaveBeenCalled()
  })

  it('FE-MOB-COLEDIT-009: a photo without a url is not selectable and a failing search clears the grid', async () => {
    const user = userEvent.setup()
    unsplash([{ id: 'p0', url: '', thumb: 'https://img/t0.jpg', photographer: 'Nobody' }])
    render(<MCollEditSheet {...baseProps()} />)

    await user.type(screen.getByPlaceholderText('collections.listNamePlaceholder'), 'Kopenhagen')
    // With no query the list name is used as the search term.
    await user.click(screen.getByRole('button', { name: /Unsplash/ }))
    await user.click(await screen.findByRole('button', { name: 'Nobody' }))
    // Only the thumb is on screen — a url-less photo never becomes the cover.
    expect(imageWithSrc('https://img/t0.jpg')).not.toBeNull()
    expect(document.querySelectorAll('img')).toHaveLength(1)

    server.use(http.get('/api/trips/cover-images/search', () => new HttpResponse(null, { status: 500 })))
    await user.click(screen.getByRole('button', { name: /Unsplash/ }))
    await waitFor(() => expect(screen.queryByRole('button', { name: 'Nobody' })).not.toBeInTheDocument())
  })

  it('FE-MOB-COLEDIT-010: Unsplash stays idle while there is neither a query nor a name', async () => {
    const user = userEvent.setup()
    const search = vi.fn(() => HttpResponse.json({ photos: [] }))
    server.use(http.get('/api/trips/cover-images/search', search))
    render(<MCollEditSheet {...baseProps()} />)

    expect(screen.getByRole('button', { name: /Unsplash/ })).toBeDisabled()
    // Enter bypasses the disabled button, so the guard has to hold there too.
    await user.type(screen.getByPlaceholderText('dashboard.unsplashSearchPlaceholder'), '   {Enter}')
    expect(search).not.toHaveBeenCalled()
  })

  it('FE-MOB-COLEDIT-011: a failed save reports the error and a retry updates the already-created list', async () => {
    const user = userEvent.setup()
    uploadCover.mockRejectedValueOnce(Object.assign(new Error('boom'), { response: { data: { error: 'Cover too large' } } }))
    const props = baseProps()
    render(<MCollEditSheet {...props} />)

    const input = document.querySelector('input[type="file"]') as HTMLInputElement
    await user.upload(input, new File(['x'], 'cover.png', { type: 'image/png' }))
    await user.type(screen.getByPlaceholderText('collections.listNamePlaceholder'), 'Kopenhagen')
    await user.click(screen.getByRole('button', { name: 'collections.create' }))

    await waitFor(() => expect(toast).toHaveBeenCalledWith('Cover too large', 'error', undefined))
    expect(props.onClose).not.toHaveBeenCalled()

    // The list already exists — the retry must not create a second one.
    await user.click(screen.getByRole('button', { name: 'collections.create' }))
    await waitFor(() => expect(updateCollection).toHaveBeenCalledWith(11, expect.objectContaining({ name: 'Kopenhagen' })))
    expect(createCollection).toHaveBeenCalledTimes(1)
  })

  it('FE-MOB-COLEDIT-012: a create that returns no list keeps the cover upload from running', async () => {
    const user = userEvent.setup()
    createCollection.mockResolvedValueOnce(null)
    const props = baseProps()
    render(<MCollEditSheet {...props} />)

    const input = document.querySelector('input[type="file"]') as HTMLInputElement
    await user.upload(input, new File(['x'], 'cover.png', { type: 'image/png' }))
    await user.type(screen.getByPlaceholderText('collections.listNamePlaceholder'), 'Kopenhagen')
    await user.click(screen.getByRole('button', { name: 'collections.create' }))

    await waitFor(() => expect(props.onClose).toHaveBeenCalledTimes(1))
    expect(uploadCover).not.toHaveBeenCalled()
    expect(props.onCreated).not.toHaveBeenCalled()
  })

  it('FE-MOB-COLEDIT-013: the owner can delete from the footer, a co-owner cannot', () => {
    const props = baseProps({ target: buildList() })
    const { rerender } = render(<MCollEditSheet {...props} />)

    fireEvent.click(screen.getByRole('button', { name: /collections.deleteList/ }))
    expect(props.onClose).toHaveBeenCalledTimes(1)
    expect(props.onRequestDelete).toHaveBeenCalledWith(4)

    rerender(<MCollEditSheet {...baseProps({ target: buildList({ id: 8, name: 'Julien Tipps', is_owner: false }) })} />)
    expect(screen.queryByRole('button', { name: /collections.deleteList/ })).not.toBeInTheDocument()
    // Switching target re-seeds the form.
    expect(screen.getByPlaceholderText('collections.listNamePlaceholder')).toHaveValue('Julien Tipps')
  })

  it('FE-MOB-COLEDIT-014: cancelling after a failed cover still hands the created list over', async () => {
    const user = userEvent.setup()
    uploadCover.mockRejectedValueOnce(new Error('boom'))
    const props = baseProps()
    render(<MCollEditSheet {...props} />)

    const input = document.querySelector('input[type="file"]') as HTMLInputElement
    await user.upload(input, new File(['x'], 'cover.png', { type: 'image/png' }))
    await user.type(screen.getByPlaceholderText('collections.listNamePlaceholder'), 'Kopenhagen')
    await user.click(screen.getByRole('button', { name: 'collections.create' }))
    await waitFor(() => expect(toast).toHaveBeenCalledWith('common.error', 'error', undefined))

    // The list exists even though the cover step failed — cancelling must not lose it.
    await user.click(screen.getByRole('button', { name: 'common.cancel' }))
    expect(props.onCreated).toHaveBeenCalledWith(11)
    expect(props.onClose).toHaveBeenCalledTimes(1)
  })
})
