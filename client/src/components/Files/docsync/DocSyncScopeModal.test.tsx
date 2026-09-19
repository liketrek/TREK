// FE-DOCSYNC-SCOPE-001 to FE-DOCSYNC-SCOPE-022

/**
 * The folder picker of the document-sync dialog.
 *
 * What matters to somebody opening it: the folders of their own store show up,
 * the one they pick is the one that gets bound, making a new folder is one
 * action rather than two, and a store that refuses to answer says so instead of
 * pretending the archive is empty.
 *
 * The component takes the `useDocSync` hook as a prop, so the double here is the
 * real hook with `api/client` mocked underneath, so the assertions are about
 * the requests that actually leave, not about a hand-written stand-in. The hook
 * is created with `enabled: false` because the panel-level lists it would fetch
 * belong to the dialog around this modal, not to the picker.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'
import en from '@trek/shared/i18n/en'
import { render, screen, fireEvent, waitFor } from '../../../../tests/helpers/render'
import type { DocSyncConnection, DocSyncScope } from './useDocSync'

const S = en as unknown as Record<string, string>

const listScopes = vi.fn()
const createScope = vi.fn()
const createLink = vi.fn()

vi.mock('../../../api/client', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../../../api/client')>()
  return {
    ...actual,
    docsyncApi: {
      ...actual.docsyncApi,
      providers: () => Promise.resolve([]),
      status: () => Promise.resolve({ items: {}, links: [] }),
      listConnections: () => Promise.resolve([]),
      listLinks: () => Promise.resolve([]),
      listScopes: (tripId: number | string, connectionId: number, q?: string) => listScopes(tripId, connectionId, q),
      createScope: (tripId: number | string, connectionId: number, name: string) => createScope(tripId, connectionId, name),
      createLink: (tripId: number | string, data: unknown) => createLink(tripId, data),
    },
  }
})

import DocSyncScopeModal from './DocSyncScopeModal'
import { useDocSync } from './useDocSync'

const TRIP_ID = 42

const connection: DocSyncConnection = {
  id: 5,
  providerId: 'paperless',
  baseUrl: 'https://docs.example.org',
  settings: {},
  secrets: {},
  allowInsecureTls: false,
  lastProbeState: 'ok',
  lastProbeError: null,
}

const folder = (n: number, label: string, remoteRootPath: string | null = `/Documents/${label}`): DocSyncScope =>
  ({ scopeKey: `folder-${n}`, label, remoteRootId: String(n), remoteRootPath })

/** Seven, so the list is one over the threshold that earns a search box. */
const SEVEN = [
  folder(1, 'Trips'),
  folder(2, 'Archive'),
  folder(3, 'Receipts'),
  folder(4, 'Invoices'),
  folder(5, 'Photos'),
  folder(6, 'Manuals'),
  folder(7, 'Warranty'),
]
const SIX = SEVEN.slice(0, 6)
const THREE = SEVEN.slice(0, 3)

const onClose = vi.fn()
const onBound = vi.fn()

function deferred<T>() {
  let resolve!: (value: T) => void
  let reject!: (reason?: unknown) => void
  const promise = new Promise<T>((res, rej) => { resolve = res; reject = rej })
  return { promise, resolve, reject }
}

function Harness({ suggestedName = 'trek-paris-42', providerName = 'Paperless' }: {
  suggestedName?: string
  providerName?: string
}) {
  const sync = useDocSync(TRIP_ID, false)
  return (
    <DocSyncScopeModal
      connection={connection}
      providerName={providerName}
      suggestedName={suggestedName}
      sync={sync}
      onClose={onClose}
      onBound={onBound}
    />
  )
}

const nameField = () => screen.getByPlaceholderText(S['docsync.newFolderPlaceholder'])
const createButton = () => screen.getByRole('button', { name: S['docsync.scope.createAction'] })
const searchField = () => screen.queryByPlaceholderText(S['docsync.scope.search'])
const rowFor = (label: string) => screen.getByText(label).closest('button') as HTMLButtonElement

beforeEach(() => {
  vi.clearAllMocks()
  listScopes.mockResolvedValue({ scopes: THREE })
  createScope.mockResolvedValue(folder(9, 'Paris 2026'))
  createLink.mockResolvedValue({ id: 1 })
})

describe('DocSyncScopeModal list', () => {
  it('FE-DOCSYNC-SCOPE-001: asks the store for its folders as soon as it opens', async () => {
    render(<Harness />)

    await waitFor(() => expect(listScopes).toHaveBeenCalledWith(TRIP_ID, 5, undefined))
  })

  it('FE-DOCSYNC-SCOPE-002: shows every folder the store answered with, and where each one sits', async () => {
    listScopes.mockResolvedValue({ scopes: THREE })
    render(<Harness />)

    expect(await screen.findByText('Trips')).toBeInTheDocument()
    expect(screen.getByText('Archive')).toBeInTheDocument()
    expect(screen.getByText('Receipts')).toBeInTheDocument()
    expect(screen.getByText('/Documents/Archive')).toBeInTheDocument()
  })

  it('FE-DOCSYNC-SCOPE-003: says nothing about an empty archive while the list is still in flight', async () => {
    const pending = deferred<{ scopes: DocSyncScope[] }>()
    listScopes.mockReturnValue(pending.promise)
    render(<Harness />)

    // The dangerous middle state: "no folders" is a claim about the store, and
    // it must not be made before the store has answered.
    expect(screen.queryByText(S['docsync.noFolders'])).not.toBeInTheDocument()
    expect(screen.queryByText('Trips')).not.toBeInTheDocument()

    pending.resolve({ scopes: THREE })
    expect(await screen.findByText('Trips')).toBeInTheDocument()
  })

  it('FE-DOCSYNC-SCOPE-004: a store with no folders at all says so', async () => {
    listScopes.mockResolvedValue({ scopes: [] })
    render(<Harness />)

    expect(await screen.findByText(S['docsync.noFolders'])).toBeInTheDocument()
  })

  it('FE-DOCSYNC-SCOPE-005: names the store in the question it asks', async () => {
    render(<Harness providerName="Paperless" />)

    expect(await screen.findByText(S['docsync.scope.title'].replace('{provider}', 'Paperless'))).toBeInTheDocument()
    expect(screen.getByText(S['docsync.scope.intro'])).toBeInTheDocument()
  })

  it('FE-DOCSYNC-SCOPE-006: the header close button leaves without binding anything', async () => {
    render(<Harness />)
    await screen.findByText('Trips')

    fireEvent.click(screen.getAllByRole('button')[0])

    expect(onClose).toHaveBeenCalled()
    expect(createLink).not.toHaveBeenCalled()
  })
})

describe('DocSyncScopeModal search', () => {
  it('FE-DOCSYNC-SCOPE-007: a list short enough to read gets no search box', async () => {
    listScopes.mockResolvedValue({ scopes: SIX })
    render(<Harness />)
    await screen.findByText('Trips')

    expect(searchField()).not.toBeInTheDocument()
  })

  it('FE-DOCSYNC-SCOPE-008: one folder past the threshold the search box appears', async () => {
    listScopes.mockResolvedValue({ scopes: SEVEN })
    render(<Harness />)
    await screen.findByText('Warranty')

    expect(searchField()).toBeInTheDocument()
  })

  it('FE-DOCSYNC-SCOPE-009: typing narrows the list without going back to the store', async () => {
    listScopes.mockResolvedValue({ scopes: SEVEN })
    render(<Harness />)
    await screen.findByText('Warranty')
    const before = listScopes.mock.calls.length

    fireEvent.change(searchField()!, { target: { value: '  ARCH ' } })

    expect(screen.getByText('Archive')).toBeInTheDocument()
    expect(screen.queryByText('Trips')).not.toBeInTheDocument()
    // Matching is case- and whitespace-insensitive and costs no round trip.
    expect(listScopes.mock.calls.length).toBe(before)
  })

  it('FE-DOCSYNC-SCOPE-010: a query nothing matches says so, and does not claim the store is empty', async () => {
    listScopes.mockResolvedValue({ scopes: SEVEN })
    render(<Harness />)
    await screen.findByText('Warranty')

    fireEvent.change(searchField()!, { target: { value: 'zzz' } })

    expect(screen.getByText(S['docsync.scope.noMatch'])).toBeInTheDocument()
    expect(screen.queryByText(S['docsync.noFolders'])).not.toBeInTheDocument()
  })
})

describe('DocSyncScopeModal picking an existing folder', () => {
  it('FE-DOCSYNC-SCOPE-011: binds the folder that was clicked, with the defaults a new binding gets', async () => {
    render(<Harness />)
    await screen.findByText('Archive')

    fireEvent.click(rowFor('Archive'))

    await waitFor(() => expect(createLink).toHaveBeenCalledWith(TRIP_ID, {
      connectionId: 5,
      scopeKey: 'folder-2',
      remoteRootId: '2',
      remoteRootPath: '/Documents/Archive',
      remoteLabel: 'Archive',
      direction: 'both',
      deletePolicy: 'unlink',
      conflictPolicy: 'manual',
      syncEnabled: true,
    }))
  })

  it('FE-DOCSYNC-SCOPE-012: a bound folder closes the picker', async () => {
    render(<Harness />)
    await screen.findByText('Trips')

    fireEvent.click(rowFor('Trips'))

    await waitFor(() => expect(onBound).toHaveBeenCalled())
  })

  it('FE-DOCSYNC-SCOPE-013: a refused binding leaves the picker open so another folder can be tried', async () => {
    createLink.mockRejectedValueOnce(Object.assign(new Error('nope'), {
      response: { data: { error: 'forbidden' } },
    }))
    render(<Harness />)
    await screen.findByText('Trips')

    fireEvent.click(rowFor('Trips'))

    await waitFor(() => expect(createLink).toHaveBeenCalled())
    expect(onBound).not.toHaveBeenCalled()
    expect(screen.getByText('Trips')).toBeInTheDocument()
  })

  it('FE-DOCSYNC-SCOPE-014: while one folder is being bound nothing else can be started', async () => {
    const pending = deferred<{ id: number }>()
    createLink.mockReturnValueOnce(pending.promise)
    render(<Harness />)
    await screen.findByText('Trips')

    fireEvent.click(rowFor('Trips'))

    expect(rowFor('Archive')).toBeDisabled()
    expect(createButton()).toBeDisabled()

    pending.resolve({ id: 1 })
    await waitFor(() => expect(onBound).toHaveBeenCalled())
  })
})

describe('DocSyncScopeModal creating a folder', () => {
  it('FE-DOCSYNC-SCOPE-015: the trip name is already in the field, so creating is one click', async () => {
    render(<Harness suggestedName="trek-paris-42" />)
    await screen.findByText('Trips')

    expect(nameField()).toHaveValue('trek-paris-42')
    expect(createButton()).toBeEnabled()
  })

  it('FE-DOCSYNC-SCOPE-016: creating makes the folder and binds it in one go', async () => {
    createScope.mockResolvedValue(folder(9, 'Paris 2026', '/Documents/Paris 2026'))
    render(<Harness suggestedName="Paris 2026" />)
    await screen.findByText('Trips')

    fireEvent.click(createButton())

    await waitFor(() => expect(createScope).toHaveBeenCalledWith(TRIP_ID, 5, 'Paris 2026'))
    await waitFor(() => expect(createLink).toHaveBeenCalledWith(TRIP_ID, expect.objectContaining({
      connectionId: 5,
      scopeKey: 'folder-9',
      remoteRootId: '9',
      remoteLabel: 'Paris 2026',
    })))
    await waitFor(() => expect(onBound).toHaveBeenCalled())
  })

  it('FE-DOCSYNC-SCOPE-021: a refused create says why instead of doing nothing', async () => {
    // The create had no failure path at all: the rejection escaped the click
    // handler unhandled, nothing was bound, and the dialog said nothing: the
    // button blinked and the person was left guessing. Every other write in the
    // hook reports, and so does this one now.
    createScope.mockRejectedValue({ response: { data: { error: 'quota_exceeded' } } })
    render(<Harness suggestedName="Paris 2026" />)
    await screen.findByText('Trips')

    fireEvent.click(createButton())

    await waitFor(() => expect(screen.getByText(S['docsync.error.quota_exceeded'])).toBeInTheDocument())
    expect(createLink).not.toHaveBeenCalled()
    expect(onBound).not.toHaveBeenCalled()
  })

  it('FE-DOCSYNC-SCOPE-022: the create button comes back after a refusal', async () => {
    createScope.mockRejectedValue({ response: { data: { error: 'quota_exceeded' } } })
    render(<Harness suggestedName="Paris 2026" />)
    await screen.findByText('Trips')

    fireEvent.click(createButton())

    await waitFor(() => expect(createButton()).toBeEnabled())
  })

  it('FE-DOCSYNC-SCOPE-017: a blank or whitespace-only name creates nothing', async () => {
    render(<Harness suggestedName="" />)
    await screen.findByText('Trips')

    expect(createButton()).toBeDisabled()

    fireEvent.change(nameField(), { target: { value: '   ' } })
    expect(createButton()).toBeDisabled()

    fireEvent.keyDown(nameField(), { key: 'Enter' })
    expect(createScope).not.toHaveBeenCalled()
  })

  it('FE-DOCSYNC-SCOPE-018: Enter in the name field creates the typed name, not the suggested one', async () => {
    createScope.mockResolvedValue(folder(9, 'Belege'))
    render(<Harness suggestedName="trek-paris-42" />)
    await screen.findByText('Trips')

    fireEvent.change(nameField(), { target: { value: '  Belege  ' } })
    fireEvent.keyDown(nameField(), { key: 'Enter' })

    await waitFor(() => expect(createScope).toHaveBeenCalledWith(TRIP_ID, 5, 'Belege'))
  })
})

describe('DocSyncScopeModal errors', () => {
  it('FE-DOCSYNC-SCOPE-019: a store that refuses the credentials says so instead of showing an empty archive', async () => {
    listScopes.mockResolvedValue({ scopes: [], error: 'unauthorized' })
    render(<Harness />)

    expect(await screen.findByText(S['docsync.error.unauthorized'])).toBeInTheDocument()
    expect(screen.queryByText(S['docsync.noFolders'])).not.toBeInTheDocument()
  })

  it('FE-DOCSYNC-SCOPE-020: an error wins over folders the store still managed to list', async () => {
    listScopes.mockResolvedValue({ scopes: THREE, error: 'scope_missing' })
    render(<Harness />)

    expect(await screen.findByText(S['docsync.error.scope_missing'])).toBeInTheDocument()
    expect(screen.queryByText('Trips')).not.toBeInTheDocument()
  })
})
