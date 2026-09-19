// FE-DOCSYNC-MOBILE-001 to FE-DOCSYNC-MOBILE-018
import type { ComponentProps } from 'react'
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, fireEvent, waitFor, within } from '../../../../../tests/helpers/render'
import { docsyncApi } from '../../../../api/client'
import type { DocSyncConnection, DocSyncLink, DocSyncProvider, DocSyncScope } from '../../../../components/Files/docsync/useDocSync'
import MDocSyncSheet from './MDocSyncSheet'

/**
 * The phone sheet is markup over `useDocSync`, so everything here goes through
 * the one module boundary that hook has: `docsyncApi`. Nothing reaches into the
 * component.
 */

const TRIP_ID = 3

/**
 * Shaped like a row of document_provider_fields, which matters more than it looks.
 *
 * `field_key` is snake_case and `label` already carries the full key suffix
 * (`providerApiKey`, not `apiKey`), see server/src/db/document-provider-seed.ts.
 * An earlier version of this fixture invented both, which made a sheet that
 * built label keys the wrong way look correct: the fixture's `apiKey` and the
 * sheet's `docsync.provider${cap(...)}` happened to meet in the middle, while
 * the real data produced `docsync.providerProviderApiKey` and rendered the raw
 * key on screen.
 */
const field = (over: Partial<DocSyncProvider['fields'][number]>): DocSyncProvider['fields'][number] => ({
  field_key: 'api_token',
  label: 'providerApiToken',
  input_type: 'text',
  placeholder: null,
  hint: null,
  required: true,
  secret: true,
  ...over,
})

const provider = (over: Partial<DocSyncProvider>): DocSyncProvider => ({
  id: 'paperless',
  name: 'Paperless',
  description: null,
  icon: 'paperless',
  available: true,
  fields: [
    field({ field_key: 'base_url', label: 'providerUrl', input_type: 'url', placeholder: 'https://paperless.example', secret: false }),
    field({}),
  ],
  ...over,
})

const connection = (over: Partial<DocSyncConnection>): DocSyncConnection => ({
  id: 5,
  providerId: 'paperless',
  baseUrl: 'https://paperless.example',
  settings: {},
  secrets: {},
  allowInsecureTls: false,
  lastProbeState: 'ok',
  lastProbeError: null,
  ...over,
})

const link = (over: Partial<DocSyncLink> = {}): DocSyncLink => ({
  id: 11,
  connectionId: 5,
  providerId: 'paperless',
  scopeKey: 'tag:trek-3',
  remoteLabel: 'TREK trip 3',
  remoteRootPath: null,
  direction: 'both',
  deletePolicy: 'unlink',
  conflictPolicy: 'manual',
  syncEnabled: true,
  lastSyncAt: null,
  lastSyncState: 'never',
  lastSyncError: null,
  webhookUrl: null,
  ...over,
})

const scope = (over: Partial<DocSyncScope>): DocSyncScope => ({
  scopeKey: 'folder:1',
  label: 'Photos',
  remoteRootId: '1',
  remoteRootPath: '/Photos',
  ...over,
})

/** Server state the spies read, so a mutation can change what the next load returns. */
let providers: DocSyncProvider[]
let connections: DocSyncConnection[]
let links: DocSyncLink[]
let scopes: DocSyncScope[]

const onClose = vi.fn()

function renderSheet(over: Partial<ComponentProps<typeof MDocSyncSheet>> = {}) {
  return render(
    <MDocSyncSheet tripId={TRIP_ID} tripTitle="Rome" canManage open onClose={onClose} {...over} />,
  )
}

/** List → detail for the one bound store. */
async function openDetail() {
  fireEvent.click(await screen.findByRole('button', { name: /Paperless/ }))
  await screen.findByRole('button', { name: 'Sync now' })
}

const lane = (name: RegExp) => screen.getByRole('button', { name })

beforeEach(() => {
  onClose.mockClear()
  providers = [
    provider({}),
    provider({ id: 'nextcloud', name: 'Nextcloud', fields: [field({ field_key: 'app_password', label: 'providerAppPassword' })] }),
    provider({ id: 'papra', name: 'Papra', fields: [field({ field_key: 'api_key', label: 'providerApiKey' })] }),
  ]
  connections = [connection({}), connection({ id: 6, providerId: 'nextcloud' })]
  links = [link()]
  scopes = [scope({}), scope({ scopeKey: 'folder:2', label: 'Invoices', remoteRootId: '2', remoteRootPath: '/Invoices' })]

  vi.spyOn(docsyncApi, 'providers').mockImplementation(async () => providers)
  vi.spyOn(docsyncApi, 'listConnections').mockImplementation(async () => connections)
  vi.spyOn(docsyncApi, 'listLinks').mockImplementation(async () => links.map(l => ({ ...l })))
  vi.spyOn(docsyncApi, 'status').mockImplementation(async () => ({
    items: {},
    links: links.map(l => ({ id: l.id, holdings: { inTrek: 4, atProvider: 2, paired: 2, missing: 0 } })),
  }))
  vi.spyOn(docsyncApi, 'listScopes').mockImplementation(async () => ({ scopes }))
  vi.spyOn(docsyncApi, 'updateLink').mockResolvedValue({})
  vi.spyOn(docsyncApi, 'deleteLink').mockImplementation(async () => { links = []; return {} })
  vi.spyOn(docsyncApi, 'syncNow').mockResolvedValue({ state: 'ok', pulled: 0, pushed: 0, conflicts: 0, missing: 0 })
  vi.spyOn(docsyncApi, 'testConnection').mockResolvedValue({ connected: true })
  vi.spyOn(docsyncApi, 'saveConnection').mockResolvedValue({})
  vi.spyOn(docsyncApi, 'createScope').mockResolvedValue(scope({}))
  vi.spyOn(docsyncApi, 'createLink').mockResolvedValue({})
})

afterEach(() => {
  vi.restoreAllMocks()
})

describe('MDocSyncSheet: opening and the store list', () => {
  it('FE-DOCSYNC-MOBILE-001: renders nothing and asks the server nothing while it is closed', () => {
    renderSheet({ open: false })

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    expect(docsyncApi.providers).not.toHaveBeenCalled()
    expect(docsyncApi.listLinks).not.toHaveBeenCalled()
  })

  it('FE-DOCSYNC-MOBILE-002: shows a spinner until the first load lands', async () => {
    let arrive!: (v: DocSyncProvider[]) => void
    vi.spyOn(docsyncApi, 'providers').mockReturnValue(new Promise(r => { arrive = r }))

    renderSheet()

    expect(document.querySelector('.animate-spin')).not.toBeNull()
    expect(screen.queryByRole('button', { name: /Paperless/ })).not.toBeInTheDocument()

    arrive(providers)
    expect(await screen.findByRole('button', { name: /Paperless/ })).toBeInTheDocument()
    expect(document.querySelector('.animate-spin')).toBeNull()
  })

  it('FE-DOCSYNC-MOBILE-003: lists the bound store and, separately, the ones that could be added', async () => {
    renderSheet()

    const bound = await screen.findByRole('button', { name: /Paperless/ })
    expect(bound).toHaveAccessibleName(expect.stringContaining('TREK trip 3'))
    expect(screen.getByText('This trip')).toBeInTheDocument()
    expect(screen.getByText('Add another')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Nextcloud/ })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Papra/ })).toBeInTheDocument()
    // The trip's own name rides along under the sheet title.
    expect(screen.getByRole('dialog', { name: 'Document sync' })).toBeInTheDocument()
    expect(screen.getByText('Rome')).toBeInTheDocument()
  })

  it('FE-DOCSYNC-MOBILE-004: an instance with no providers says so instead of listing nothing', async () => {
    providers = []
    links = []
    renderSheet()

    expect(await screen.findByText('No document providers are available')).toBeInTheDocument()
    expect(screen.queryByText('This trip')).not.toBeInTheDocument()
  })

  it('FE-DOCSYNC-MOBILE-017: a bound trip keeps showing its store after every provider was switched off', async () => {
    providers = []
    links = [link({ providerName: 'Paperless-ngx' })]
    renderSheet({ canManage: false })

    const row = await screen.findByRole('button', { name: /TREK trip 3/ })
    expect(screen.queryByText('No document providers are available')).not.toBeInTheDocument()
    expect(screen.queryByText('Add another')).not.toBeInTheDocument()
    // The providers route no longer names it, so the name comes off the link,
    // in the list and again as the detail view's title and far end.
    expect(row).toHaveAccessibleName(expect.stringContaining('Paperless-ngx'))

    fireEvent.click(row)
    await screen.findByRole('button', { name: 'Sync now' })
    expect(screen.getAllByText('Paperless-ngx')).toHaveLength(2)
    expect(screen.queryByText('Document sync')).not.toBeInTheDocument()
    expect(screen.queryByText('paperless')).not.toBeInTheDocument()
  })
})

describe('MDocSyncSheet: moving between the views', () => {
  it('FE-DOCSYNC-MOBILE-005: tapping a bound store opens its detail view', async () => {
    renderSheet()

    fireEvent.click(await screen.findByRole('button', { name: /Paperless/ }))

    expect(await screen.findByRole('button', { name: 'Sync now' })).toBeInTheDocument()
    expect(screen.getByText('Folder')).toBeInTheDocument()
    expect(screen.getByText('TREK trip 3')).toBeInTheDocument()
    expect(screen.getByText('not run yet')).toBeInTheDocument()
    // The list is gone, not merely scrolled past.
    expect(screen.queryByText('Add another')).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /Nextcloud/ })).not.toBeInTheDocument()
  })

  it('FE-DOCSYNC-MOBILE-006: the back arrow returns to the list, and the list only has a back arrow once you have left it', async () => {
    renderSheet()
    await screen.findByRole('button', { name: /Paperless/ })
    expect(screen.queryByRole('button', { name: 'Back' })).not.toBeInTheDocument()

    await openDetail()
    fireEvent.click(screen.getByRole('button', { name: 'Back' }))

    expect(screen.getByText('Add another')).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Sync now' })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Back' })).not.toBeInTheDocument()
  })

  it('FE-DOCSYNC-MOBILE-007: reopening the sheet starts at the list again, not where it was left', async () => {
    const { rerender } = renderSheet()
    await openDetail()

    rerender(<MDocSyncSheet tripId={TRIP_ID} tripTitle="Rome" canManage open={false} onClose={onClose} />)
    rerender(<MDocSyncSheet tripId={TRIP_ID} tripTitle="Rome" canManage open onClose={onClose} />)

    expect(await screen.findByText('Add another')).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Sync now' })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Back' })).not.toBeInTheDocument()
  })

  it('FE-DOCSYNC-MOBILE-008: an addable store with no connection asks for credentials first', async () => {
    renderSheet()

    fireEvent.click(await screen.findByRole('button', { name: /Papra/ }))

    expect(await screen.findByRole('button', { name: 'Test connection' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Save' })).toBeInTheDocument()
    expect(screen.getByText('API key')).toBeInTheDocument()
    expect(docsyncApi.listScopes).not.toHaveBeenCalled()
    // The header now names the store being connected.
    expect(screen.getByRole('dialog', { name: 'Document sync' })).toBeInTheDocument()
    expect(screen.getByText('Papra')).toBeInTheDocument()
  })

  it('FE-DOCSYNC-MOBILE-009: an addable store that already has a connection goes straight to the folder view', async () => {
    renderSheet()

    fireEvent.click(await screen.findByRole('button', { name: /Nextcloud/ }))

    expect(await screen.findByRole('button', { name: /Invoices/ })).toBeInTheDocument()
    expect(docsyncApi.listScopes).toHaveBeenCalledWith(TRIP_ID, 6, undefined)
    expect(screen.queryByRole('button', { name: 'Test connection' })).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Photos/ })).toBeInTheDocument()
    // A folder name is suggested from the trip so nobody has to invent one.
    expect(screen.getByDisplayValue('rome-3')).toBeInTheDocument()
  })
})

describe('MDocSyncSheet: the two lanes', () => {
  it('FE-DOCSYNC-MOBILE-010: switching a lane off narrows the direction to the other one', async () => {
    renderSheet()
    await openDetail()

    expect(lane(/Out to the store/)).toHaveAttribute('aria-pressed', 'true')
    expect(lane(/In from the store/)).toHaveAttribute('aria-pressed', 'true')

    fireEvent.click(lane(/Out to the store/))

    await waitFor(() => expect(docsyncApi.updateLink).toHaveBeenCalledWith(TRIP_ID, 11, { direction: 'pull' }))
  })

  it('FE-DOCSYNC-MOBILE-011: the last remaining lane cannot be switched off, and the dead one carries the hatch', async () => {
    links = [link({ direction: 'push' })]
    renderSheet()
    await openDetail()

    const out = lane(/Out to the store/)
    const back = lane(/In from the store/)
    expect(out).toHaveAttribute('aria-pressed', 'true')
    expect(back).toHaveAttribute('aria-pressed', 'false')
    expect(back.className).toContain('trek-docsync-lane-off-m')
    expect(out.className).not.toContain('trek-docsync-lane-off-m')

    fireEvent.click(out)

    expect(docsyncApi.updateLink).not.toHaveBeenCalled()
    expect(lane(/Out to the store/)).toHaveAttribute('aria-pressed', 'true')

    // The off lane can still be switched back on.
    fireEvent.click(back)
    await waitFor(() => expect(docsyncApi.updateLink).toHaveBeenCalledWith(TRIP_ID, 11, { direction: 'both' }))
  })
})

describe('MDocSyncSheet: what the owner may do', () => {
  it('FE-DOCSYNC-MOBILE-012: the auto-sync switch patches the binding', async () => {
    renderSheet()
    await openDetail()

    const auto = screen.getByRole('switch', { name: 'Sync automatically' })
    expect(auto).toBeChecked()

    fireEvent.click(auto)

    await waitFor(() => expect(docsyncApi.updateLink).toHaveBeenCalledWith(TRIP_ID, 11, { syncEnabled: false }))
  })

  it('FE-DOCSYNC-MOBILE-013: disconnecting asks first, then unbinds and drops back to the list', async () => {
    renderSheet()
    await openDetail()

    fireEvent.click(screen.getByRole('button', { name: 'Disconnect' }))

    const confirm = screen.getByRole('dialog', { name: 'Disconnect' })
    expect(docsyncApi.deleteLink).not.toHaveBeenCalled()

    fireEvent.click(within(confirm).getByRole('button', { name: 'Disconnect' }))

    await waitFor(() => expect(docsyncApi.deleteLink).toHaveBeenCalledWith(TRIP_ID, 11))
    expect(await screen.findByText('Connect a provider')).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Sync now' })).not.toBeInTheDocument()
  })

  it('FE-DOCSYNC-MOBILE-018: a binding whose provider an admin switched off says so, and a refused run leaves it at that', async () => {
    let off = false
    vi.spyOn(docsyncApi, 'status').mockImplementation(async () => ({
      items: {},
      links: links.map(l => ({ id: l.id, providerOff: off, holdings: { inTrek: 4, atProvider: 2, paired: 2, missing: 0 } })),
    }))
    vi.spyOn(docsyncApi, 'syncNow').mockImplementation(async () => {
      off = true
      throw { response: { status: 409, data: { error: 'provider_disabled' } } }
    })
    renderSheet()
    await openDetail()
    expect(screen.queryByText('Paused: an administrator has switched this provider off. Syncing resumes once it is back on.')).not.toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: 'Sync now' }))

    expect(await screen.findByText('Paused: an administrator has switched this provider off. Syncing resumes once it is back on.')).toBeInTheDocument()
  })

  it('FE-DOCSYNC-MOBILE-014: Sync now runs that binding', async () => {
    renderSheet()
    await openDetail()

    fireEvent.click(screen.getByRole('button', { name: 'Sync now' }))

    await waitFor(() => expect(docsyncApi.syncNow).toHaveBeenCalledWith(TRIP_ID, 11, false))
  })
})

describe('MDocSyncSheet: what a member may do', () => {
  it('FE-DOCSYNC-MOBILE-015: a member sees no settings and no disconnect, and the lanes are inert', async () => {
    renderSheet({ canManage: false })
    await openDetail()

    expect(screen.queryByRole('switch')).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Disconnect' })).not.toBeInTheDocument()
    expect(screen.queryByText('When a document is deleted')).not.toBeInTheDocument()

    expect(lane(/Out to the store/)).toBeDisabled()
    expect(lane(/In from the store/)).toBeDisabled()
    fireEvent.click(lane(/Out to the store/))
    expect(docsyncApi.updateLink).not.toHaveBeenCalled()

    // Reading and running it is still theirs.
    expect(screen.getByRole('button', { name: 'Sync now' })).toBeEnabled()
  })

  it('FE-DOCSYNC-MOBILE-016: a member is not offered stores to add, and an unbound trip explains who sets it up', async () => {
    links = []
    renderSheet({ canManage: false })

    expect(await screen.findByText('Nothing connected yet')).toBeInTheDocument()
    expect(screen.getByText('The trip owner sets this up. Documents stay in TREK either way.')).toBeInTheDocument()
    expect(screen.queryByText('Connect a provider')).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /Nextcloud/ })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /Papra/ })).not.toBeInTheDocument()
  })
})
