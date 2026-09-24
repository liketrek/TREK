// FE-DOCSYNC-PANEL-001 to FE-DOCSYNC-PANEL-023

/**
 * The document-sync dialog shell (#2391).
 *
 * The panel itself owns three decisions: which store is open, which of them a
 * person is even offered, and whether the "needs a look" list is worth the
 * space. Everything below it (the binding card, the flow bar, the connect and
 * scope modals) is tested where it lives; what is exercised here is the shell
 * around them, driven through the real `useDocSync` against a mocked
 * `docsyncApi`, because the selection rules are a reaction to what the server
 * answers rather than to a prop.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'
import en from '@trek/shared/i18n/en'
import { act, render, screen, within, fireEvent, waitFor } from '../../../../tests/helpers/render'

/** What the dialog actually renders for a key, via the same fallback chain `t()` uses. */
const t = (key: string): string => (en as unknown as Record<string, string>)[key] ?? key

const providers = vi.fn()
const listConnections = vi.fn()
const listLinks = vi.fn()
const status = vi.fn()
const deleteLink = vi.fn()
const updateLink = vi.fn()
const syncNow = vi.fn()
const items = vi.fn()
const resolve = vi.fn()
const saveConnection = vi.fn()

vi.mock('../../../api/client', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../../../api/client')>()
  return {
    ...actual,
    docsyncApi: {
      ...actual.docsyncApi,
      providers: (tripId: number | string) => providers(tripId),
      listConnections: (tripId: number | string) => listConnections(tripId),
      listLinks: (tripId: number | string) => listLinks(tripId),
      status: (tripId: number | string) => status(tripId),
      deleteLink: (tripId: number | string, linkId: number) => deleteLink(tripId, linkId),
      updateLink: (tripId: number | string, linkId: number, patch: unknown) => updateLink(tripId, linkId, patch),
      syncNow: (tripId: number | string, linkId: number, full: boolean) => syncNow(tripId, linkId, full),
      items: (tripId: number | string, state?: string) => items(tripId, state),
      resolve: (tripId: number | string, itemId: number, keep: string) => resolve(tripId, itemId, keep),
      saveConnection: (tripId: number | string, data: unknown) => saveConnection(tripId, data),
    },
  }
})

/** Set by the one test that needs a render slower than React's time slice. */
let slowCard = false

vi.mock('./DocSyncBinding', async (importOriginal) => {
  const actual = await importOriginal<typeof import('./DocSyncBinding')>()
  const Card = actual.default
  return {
    ...actual,
    default: function SlowableBinding(props: Parameters<typeof Card>[0]) {
      // Busy for longer than the scheduler's 5 ms slice, so the commit that
      // shows the card leaves its effects for a later task, as a loaded CI
      // runner does.
      if (slowCard) {
        const end = performance.now() + 20
        while (performance.now() < end) { /* busy */ }
      }
      return <Card {...props} />
    },
  }
})

import DocSyncPanel from './DocSyncPanel'
import type { DocSyncLink, DocSyncProvider } from './useDocSync'

const provider = (id: string, name: string, available = true): DocSyncProvider => ({
  id,
  name,
  description: null,
  icon: id,
  available,
  fields: [],
})

const link = (id: number, providerId: string, overrides: Partial<DocSyncLink> = {}): DocSyncLink => ({
  id,
  connectionId: id,
  providerId,
  scopeKey: `scope-${id}`,
  remoteLabel: `Folder ${id}`,
  remoteRootPath: `/TREK/folder-${id}`,
  direction: 'both',
  deletePolicy: 'unlink',
  conflictPolicy: 'manual',
  syncEnabled: true,
  lastSyncAt: null,
  lastSyncState: 'ok',
  lastSyncError: null,
  webhookUrl: null,
  ...overrides,
})

/** What the server answers, as one object the tests reshape per case. */
function serverHas({
  providers: p = [],
  connections = [],
  links = [],
  items = {},
}: {
  providers?: DocSyncProvider[]
  connections?: Array<Record<string, unknown>>
  links?: DocSyncLink[]
  items?: Record<string, number>
}): void {
  providers.mockResolvedValue(p)
  listConnections.mockResolvedValue(connections)
  listLinks.mockResolvedValue(links)
  status.mockResolvedValue({
    items,
    links: links.map(l => ({ id: l.id, holdings: { inTrek: 3, atProvider: 3, paired: 3, missing: 0 } })),
  })
}

/** The stored connection a binding runs under. */
const connection = (id: number, providerId: string) => ({
  id,
  providerId,
  baseUrl: 'https://docs.example.org',
  settings: {},
  secrets: { token: '***' },
  allowInsecureTls: false,
  lastProbeState: 'ok',
  lastProbeError: null,
})

function deferred<T>() {
  let resolve!: (value: T) => void
  const promise = new Promise<T>(r => { resolve = r })
  return { promise, resolve }
}

const onClose = vi.fn()

/** The detail column's binding card. */
const binding = () => screen.getByRole('article')

/** The store list beside it. */
const sidebar = () => screen.getByRole('navigation')

/** The stores filed under one sidebar heading. */
const group = (heading: string) =>
  within(screen.getByRole('heading', { name: heading }).parentElement as HTMLElement)

/** The "needs a look" section under the binding card. */
const issues = () =>
  within(screen.getByRole('heading', { name: t('docsync.issues.title') }).closest('section') as HTMLElement)

/** Disconnect asks first; this answers yes. The question renders in a portal. */
const confirmUnlink = () => {
  const dialog = screen.getByText(t('docsync.confirmUnlink')).closest('.trek-modal-enter') as HTMLElement
  fireEvent.click(within(dialog).getByRole('button', { name: t('docsync.unlink') }))
}

beforeEach(() => {
  vi.clearAllMocks()
  slowCard = false
  serverHas({})
  deleteLink.mockResolvedValue({})
  updateLink.mockResolvedValue({})
  syncNow.mockResolvedValue({ state: 'ok', pulled: 0, pushed: 0, conflicts: 0, missing: 0 })
  items.mockResolvedValue([])
  resolve.mockResolvedValue({ success: true })
  saveConnection.mockResolvedValue({ id: 1 })
})

describe('DocSyncPanel: first load', () => {
  it('FE-DOCSYNC-PANEL-001: shows a spinner while the first load is in flight and nothing else', async () => {
    const gate = deferred<DocSyncProvider[]>()
    providers.mockReturnValue(gate.promise)

    render(<DocSyncPanel tripId={7} canManage onClose={onClose} />)

    // The spinner carries no text of its own; the spin is the whole affordance.
    expect(document.querySelector('.animate-spin')).not.toBeNull()
    expect(screen.queryByRole('navigation')).not.toBeInTheDocument()
    expect(screen.queryByText(t('docsync.noProviders'))).not.toBeInTheDocument()

    await act(async () => { gate.resolve([]) })
  })

  it('FE-DOCSYNC-PANEL-002: replaces the spinner with the store list once the load lands', async () => {
    serverHas({ providers: [provider('paperless', 'Paperless-ngx')] })

    render(<DocSyncPanel tripId={7} canManage onClose={onClose} />)

    expect(await screen.findByRole('navigation')).toBeInTheDocument()
    expect(document.querySelector('.animate-spin')).toBeNull()
  })

  it('FE-DOCSYNC-PANEL-003: says there is nothing to configure when the instance offers no provider', async () => {
    serverHas({ providers: [] })

    render(<DocSyncPanel tripId={7} canManage onClose={onClose} />)

    expect(await screen.findByText(t('docsync.noProviders'))).toBeInTheDocument()
    expect(screen.getByText(t('docsync.noProvidersHint'))).toBeInTheDocument()
    expect(screen.queryByRole('navigation')).not.toBeInTheDocument()
  })

  it('FE-DOCSYNC-PANEL-017: a bound trip keeps showing its binding after every provider was switched off', async () => {
    serverHas({ providers: [], links: [link(1, 'paperless', { providerName: 'Paperless-ngx' })] })

    render(<DocSyncPanel tripId={7} canManage={false} onClose={onClose} />)

    expect(await screen.findByRole('article')).toBeInTheDocument()
    expect(within(sidebar()).getByText('Folder 1')).toBeInTheDocument()
    expect(screen.queryByText(t('docsync.noProviders'))).not.toBeInTheDocument()
    // The providers route no longer names it, so the name comes off the link.
    expect(within(sidebar()).getByText('Paperless-ngx')).toBeInTheDocument()
    expect(within(binding()).getAllByText('Paperless-ngx').length).toBeGreaterThan(0)
    expect(screen.queryByText('paperless')).not.toBeInTheDocument()
  })

  it('FE-DOCSYNC-PANEL-018: a reload that finds the addon gone blanks the bindings too', async () => {
    serverHas({ providers: [provider('paperless', 'Paperless-ngx')], links: [link(1, 'paperless')] })
    // Documents is switched off while the dialog is open: the run is refused
    // and so is every route the reload after it asks.
    const gone = { response: { status: 404 } }
    syncNow.mockImplementation(async () => {
      providers.mockRejectedValue(gone)
      throw gone
    })

    render(<DocSyncPanel tripId={7} canManage onClose={onClose} />)
    await screen.findByRole('article')

    fireEvent.click(within(binding()).getByRole('button', { name: t('docsync.syncNow') }))

    expect(await screen.findByText(t('docsync.noProviders'))).toBeInTheDocument()
    expect(screen.queryByRole('article')).not.toBeInTheDocument()
    expect(screen.queryByRole('navigation')).not.toBeInTheDocument()
  })

  it('FE-DOCSYNC-PANEL-004: a provider switched on without a working adapter is not offered', async () => {
    serverHas({ providers: [provider('papra', 'Papra', false)] })

    render(<DocSyncPanel tripId={7} canManage onClose={onClose} />)

    expect(await screen.findByText(t('docsync.noProviders'))).toBeInTheDocument()
    expect(screen.queryByText('Papra')).not.toBeInTheDocument()
  })
})

describe('DocSyncPanel: the store list', () => {
  it('FE-DOCSYNC-PANEL-005: files the bound stores under one heading and the rest under another', async () => {
    serverHas({
      providers: [
        provider('paperless', 'Paperless-ngx'),
        provider('nextcloud', 'Nextcloud'),
        provider('opencloud', 'OpenCloud'),
      ],
      links: [link(1, 'paperless')],
    })

    render(<DocSyncPanel tripId={7} canManage onClose={onClose} />)
    await screen.findByRole('navigation')

    const connected = group(t('docsync.sidebar.connected'))
    expect(connected.getByRole('button', { name: /Paperless-ngx/ })).toBeInTheDocument()
    expect(connected.queryByRole('button', { name: /Nextcloud/ })).not.toBeInTheDocument()

    const addable = group(t('docsync.addAnother'))
    expect(addable.getByRole('button', { name: /Nextcloud/ })).toBeInTheDocument()
    expect(addable.getByRole('button', { name: /OpenCloud/ })).toBeInTheDocument()
    expect(addable.queryByRole('button', { name: /Paperless-ngx/ })).not.toBeInTheDocument()
  })

  it('FE-DOCSYNC-PANEL-006: with nothing bound the list invites a first connection instead of another one', async () => {
    serverHas({ providers: [provider('paperless', 'Paperless-ngx')], links: [] })

    render(<DocSyncPanel tripId={7} canManage onClose={onClose} />)
    await screen.findByRole('navigation')

    expect(screen.getByRole('heading', { name: t('docsync.addProvider') })).toBeInTheDocument()
    expect(screen.queryByRole('heading', { name: t('docsync.addAnother') })).not.toBeInTheDocument()
    expect(screen.queryByRole('heading', { name: t('docsync.sidebar.connected') })).not.toBeInTheDocument()
  })

  it('FE-DOCSYNC-PANEL-007: opens the first bound store without being asked', async () => {
    serverHas({
      providers: [provider('paperless', 'Paperless-ngx'), provider('nextcloud', 'Nextcloud')],
      links: [link(1, 'paperless'), link(2, 'nextcloud')],
    })

    render(<DocSyncPanel tripId={7} canManage onClose={onClose} />)

    const card = await screen.findByRole('article')
    // The card names its provider twice (header and flow bar), so the folder is
    // what says which of the two bindings is open.
    expect(within(card).getByText('Folder 1')).toBeInTheDocument()
    expect(within(card).queryByText('Folder 2')).not.toBeInTheDocument()
    expect(within(card).getAllByText('Paperless-ngx').length).toBeGreaterThan(0)
    expect(within(card).queryByText('Nextcloud')).not.toBeInTheDocument()
    expect(within(sidebar()).getByRole('button', { name: /Paperless-ngx/ })).toHaveAttribute('aria-current', 'true')
  })

  it('FE-DOCSYNC-PANEL-008: picking a store swaps the detail column and moves the marker with it', async () => {
    serverHas({
      providers: [provider('paperless', 'Paperless-ngx'), provider('nextcloud', 'Nextcloud')],
      links: [link(1, 'paperless'), link(2, 'nextcloud')],
    })

    render(<DocSyncPanel tripId={7} canManage onClose={onClose} />)
    await screen.findByRole('article')

    const second = within(sidebar()).getByRole('button', { name: /Nextcloud/ })
    fireEvent.click(second)

    expect(within(binding()).getByText('Folder 2')).toBeInTheDocument()
    expect(within(binding()).queryByText('Folder 1')).not.toBeInTheDocument()
    expect(within(binding()).getAllByText('Nextcloud').length).toBeGreaterThan(0)
    expect(within(binding()).queryByText('Paperless-ngx')).not.toBeInTheDocument()
    expect(second).toHaveAttribute('aria-current', 'true')
    expect(within(sidebar()).getByRole('button', { name: /Paperless-ngx/ })).not.toHaveAttribute('aria-current')
  })

  it('FE-DOCSYNC-PANEL-023: a store picked before the list-following effect has run stays picked', async () => {
    serverHas({
      providers: [provider('paperless', 'Paperless-ngx'), provider('nextcloud', 'Nextcloud')],
      links: [link(1, 'paperless'), link(2, 'nextcloud')],
    })
    slowCard = true

    render(<DocSyncPanel tripId={7} canManage onClose={onClose} />)

    // Outside act, as during the wait inside findBy*: React commits the card on
    // its own scheduler, and the click lands the moment the card is in the DOM,
    // before the effect that follows the list has had its turn.
    const env = globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }
    const previous = env.IS_REACT_ACT_ENVIRONMENT
    env.IS_REACT_ACT_ENVIRONMENT = false
    try {
      await new Promise<void>(resolve => {
        const observer = new MutationObserver(() => {
          if (!document.querySelector('article')) return
          observer.disconnect()
          fireEvent.click(within(sidebar()).getByRole('button', { name: /Nextcloud/ }))
          resolve()
        })
        observer.observe(document.body, { childList: true, subtree: true })
      })
    } finally {
      env.IS_REACT_ACT_ENVIRONMENT = previous
    }

    expect(within(binding()).getByText('Folder 2')).toBeInTheDocument()
    expect(within(binding()).queryByText('Folder 1')).not.toBeInTheDocument()
  })
})

describe('DocSyncPanel: a member rather than the owner', () => {
  it('FE-DOCSYNC-PANEL-009: is shown where the documents go but is offered no store to add', async () => {
    serverHas({
      providers: [provider('paperless', 'Paperless-ngx'), provider('nextcloud', 'Nextcloud')],
      links: [link(1, 'paperless')],
    })

    render(<DocSyncPanel tripId={7} canManage={false} onClose={onClose} />)
    await screen.findByRole('navigation')

    expect(within(sidebar()).getByRole('button', { name: /Paperless-ngx/ })).toBeInTheDocument()
    expect(screen.queryByRole('heading', { name: t('docsync.addAnother') })).not.toBeInTheDocument()
    expect(within(sidebar()).queryByRole('button', { name: /Nextcloud/ })).not.toBeInTheDocument()
  })

  it('FE-DOCSYNC-PANEL-010: with nothing bound is told the owner sets this up, not to pick a store', async () => {
    serverHas({ providers: [provider('paperless', 'Paperless-ngx')], links: [] })

    render(<DocSyncPanel tripId={7} canManage={false} onClose={onClose} />)

    expect(await screen.findByText(t('docsync.empty.hintMember'))).toBeInTheDocument()
    expect(screen.queryByText(t('docsync.empty.hintOwner'))).not.toBeInTheDocument()
    expect(within(sidebar()).queryAllByRole('button')).toHaveLength(0)
  })
})

describe('DocSyncPanel: removing a binding', () => {
  it('FE-DOCSYNC-PANEL-011: moves the selection to the binding that is left instead of emptying the column', async () => {
    const paperless = link(1, 'paperless')
    const nextcloud = link(2, 'nextcloud')
    const both = [provider('paperless', 'Paperless-ngx'), provider('nextcloud', 'Nextcloud')]
    serverHas({ providers: both, links: [paperless, nextcloud] })
    // The unlink lands on the server, and the reload after it is what the panel
    // reacts to, so that is where the row disappears.
    deleteLink.mockImplementation(async () => {
      serverHas({ providers: both, links: [paperless] })
      return {}
    })

    render(<DocSyncPanel tripId={7} canManage onClose={onClose} />)
    await screen.findByRole('article')

    fireEvent.click(within(sidebar()).getByRole('button', { name: /Nextcloud/ }))
    expect(within(binding()).getByText('Folder 2')).toBeInTheDocument()

    fireEvent.click(within(binding()).getByRole('button', { name: t('docsync.unlink') }))
    confirmUnlink()

    await waitFor(() => expect(deleteLink).toHaveBeenCalledWith(7, 2))
    await waitFor(() => expect(within(binding()).getByText('Folder 1')).toBeInTheDocument())
    expect(screen.queryByText(t('docsync.empty.title'))).not.toBeInTheDocument()
    expect(within(sidebar()).getByRole('button', { name: /Paperless-ngx/ })).toHaveAttribute('aria-current', 'true')
  })

  it('FE-DOCSYNC-PANEL-012: removing the last binding leaves the invitation, not a blank column', async () => {
    serverHas({ providers: [provider('paperless', 'Paperless-ngx')], links: [link(1, 'paperless')] })
    deleteLink.mockImplementation(async () => {
      serverHas({ providers: [provider('paperless', 'Paperless-ngx')], links: [] })
      return {}
    })

    render(<DocSyncPanel tripId={7} canManage onClose={onClose} />)
    await screen.findByRole('article')

    fireEvent.click(within(binding()).getByRole('button', { name: t('docsync.unlink') }))
    confirmUnlink()

    expect(await screen.findByText(t('docsync.empty.title'))).toBeInTheDocument()
    expect(screen.getByText(t('docsync.empty.hintOwner'))).toBeInTheDocument()
    expect(screen.queryByRole('article')).not.toBeInTheDocument()
  })
})

describe('DocSyncPanel: what needs a look', () => {
  it('FE-DOCSYNC-PANEL-013: stays quiet when nothing needs attention', async () => {
    serverHas({ providers: [provider('paperless', 'Paperless-ngx')], links: [link(1, 'paperless')], items: {} })

    render(<DocSyncPanel tripId={7} canManage onClose={onClose} />)
    await screen.findByRole('article')

    expect(screen.queryByRole('heading', { name: t('docsync.issues.title') })).not.toBeInTheDocument()
  })

  it('FE-DOCSYNC-PANEL-014: counts that need no decision do not open the issues panel', async () => {
    serverHas({
      providers: [provider('paperless', 'Paperless-ngx')],
      links: [link(1, 'paperless')],
      items: { pending: 9, synced: 41, local_deleted: 2 },
    })

    render(<DocSyncPanel tripId={7} canManage onClose={onClose} />)
    await screen.findByRole('article')

    expect(screen.queryByRole('heading', { name: t('docsync.issues.title') })).not.toBeInTheDocument()
  })

  it('FE-DOCSYNC-PANEL-015: names only the states needing attention, with their counts', async () => {
    serverHas({
      providers: [provider('paperless', 'Paperless-ngx')],
      links: [link(1, 'paperless')],
      items: { conflict: 2, too_large: 1, pending: 9, synced: 41 },
    })

    render(<DocSyncPanel tripId={7} canManage onClose={onClose} />)
    await screen.findByRole('article')

    const panel = within(
      screen.getByRole('heading', { name: t('docsync.issues.title') }).closest('section') as HTMLElement,
    )
    const rows = panel.getAllByRole('listitem')
    expect(rows).toHaveLength(2)
    expect(within(rows[0]).getByText(t('docsync.state.conflict'))).toBeInTheDocument()
    expect(within(rows[0]).getByText(t('docsync.issues.conflict'))).toBeInTheDocument()
    // The conflict row carries a button rather than a bare count: it is the one
    // of these a person can act on.
    expect(within(rows[0]).getByRole('button', { name: /Resolve/ })).toBeInTheDocument()
    expect(within(rows[1]).getByText(t('docsync.state.too_large'))).toBeInTheDocument()
    expect(within(rows[1]).getByText('1')).toBeInTheDocument()
    expect(panel.queryByText(t('docsync.state.pending'))).not.toBeInTheDocument()
  })

  it('FE-DOCSYNC-PANEL-019: a member is shown the conflict count but offered no choice', async () => {
    // The server refuses a member's choice with 403, so the three buttons
    // would only ever fail for them. The count is what they are owed.
    serverHas({
      providers: [provider('paperless', 'Paperless-ngx')],
      links: [link(1, 'paperless')],
      items: { conflict: 2 },
    })

    render(<DocSyncPanel tripId={7} canManage={false} onClose={onClose} />)
    await screen.findByRole('article')

    const row = issues().getAllByRole('listitem')[0]
    expect(within(row).getByText(t('docsync.state.conflict'))).toBeInTheDocument()
    expect(within(row).getByText('2')).toBeInTheDocument()
    expect(within(row).queryByRole('button')).not.toBeInTheDocument()
    expect(items).not.toHaveBeenCalled()
  })

  it('FE-DOCSYNC-PANEL-020: a choice the server refuses is said in the column, and the row stays', async () => {
    serverHas({
      providers: [provider('paperless', 'Paperless-ngx')],
      links: [link(1, 'paperless')],
      items: { conflict: 1 },
    })
    items.mockResolvedValue([{ id: 40, file_name: 'boarding-pass.pdf', remote_name: 'boarding-pass.pdf' }])
    // Settled by the owner in another tab a moment ago.
    resolve.mockRejectedValue({ response: { status: 400, data: { error: 'conflict' } } })

    render(<DocSyncPanel tripId={7} canManage onClose={onClose} />)
    await screen.findByRole('article')

    fireEvent.click(issues().getByRole('button', { name: /Resolve/ }))
    fireEvent.click(await issues().findByRole('button', { name: t('docsync.conflict.keepTrek') }))

    await waitFor(() => expect(resolve).toHaveBeenCalledWith(7, 40, 'trek'))
    expect(await screen.findByRole('alert')).toHaveTextContent(t('docsync.error.conflict'))
    // The list is read back rather than trimmed by hand, so the row is still
    // there, ready for another try.
    await waitFor(() => expect(issues().getByRole('button', { name: t('docsync.conflict.keepTrek') })).toBeEnabled())
    expect(issues().getByText('boarding-pass.pdf')).toBeInTheDocument()
    expect(items).toHaveBeenCalledTimes(2)
  })
})

describe('DocSyncPanel: what a click on the card reports', () => {
  it('FE-DOCSYNC-PANEL-021: a refused run is said under the card rather than swallowed', async () => {
    serverHas({ providers: [provider('paperless', 'Paperless-ngx')], links: [link(1, 'paperless')] })
    syncNow.mockRejectedValue({ response: { status: 409, data: { error: 'provider_disabled' } } })

    render(<DocSyncPanel tripId={7} canManage onClose={onClose} />)
    await screen.findByRole('article')
    expect(screen.queryByRole('alert')).not.toBeInTheDocument()

    fireEvent.click(within(binding()).getByRole('button', { name: t('docsync.syncNow') }))

    expect(await screen.findByRole('alert')).toHaveTextContent(t('docsync.error.provider_disabled'))
    expect(screen.getByRole('article')).toBeInTheDocument()
  })

  it('FE-DOCSYNC-PANEL-022: a refused credential opens the form for the bound store, and saving runs the binding', async () => {
    // The sidebar only ever opened the form for a store with no connection
    // yet, and a bound store is not listed there, so a rotated token could
    // only be entered through the API.
    serverHas({
      providers: [provider('paperless', 'Paperless-ngx')],
      connections: [connection(5, 'paperless')],
      links: [link(1, 'paperless', { lastSyncState: 'needs_reauth', lastSyncError: 'unauthorized' })],
    })

    render(<DocSyncPanel tripId={7} canManage onClose={onClose} />)
    await screen.findByRole('article')

    fireEvent.click(within(binding()).getByRole('button', { name: t('docsync.binding.reconnect') }))

    // The credential form, for this store, not the folder picker.
    expect(screen.getByRole('button', { name: t('docsync.connect.submit') })).toBeInTheDocument()
    expect(screen.queryByText(t('docsync.scope.pickTitle'))).not.toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: t('docsync.connect.submit') }))

    await waitFor(() => expect(saveConnection).toHaveBeenCalledWith(7, expect.objectContaining({ providerId: 'paperless' })))
    await waitFor(() => expect(syncNow).toHaveBeenCalledWith(7, 1, false))
    await waitFor(() => expect(screen.queryByRole('button', { name: t('docsync.connect.submit') })).not.toBeInTheDocument())
    expect(screen.queryByText(t('docsync.scope.pickTitle'))).not.toBeInTheDocument()
  })
})

describe('DocSyncPanel: the dialog itself', () => {
  it('FE-DOCSYNC-PANEL-016: names the trip under the title and closes from the header', async () => {
    serverHas({ providers: [] })

    render(<DocSyncPanel tripId={7} tripTitle="Iceland 2026" canManage onClose={onClose} />)
    await screen.findByText(t('docsync.noProviders'))

    expect(screen.getByText(t('docsync.title'))).toBeInTheDocument()
    expect(screen.getByText('Iceland 2026')).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button'))
    expect(onClose).toHaveBeenCalledTimes(1)
  })
})
