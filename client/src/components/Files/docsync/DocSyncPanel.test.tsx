// FE-DOCSYNC-PANEL-001 to FE-DOCSYNC-PANEL-018

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
  links = [],
  items = {},
}: {
  providers?: DocSyncProvider[]
  links?: DocSyncLink[]
  items?: Record<string, number>
}): void {
  providers.mockResolvedValue(p)
  listConnections.mockResolvedValue([])
  listLinks.mockResolvedValue(links)
  status.mockResolvedValue({
    items,
    links: links.map(l => ({ id: l.id, holdings: { inTrek: 3, atProvider: 3, paired: 3, missing: 0 } })),
  })
}

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

beforeEach(() => {
  vi.clearAllMocks()
  serverHas({})
  deleteLink.mockResolvedValue({})
  updateLink.mockResolvedValue({})
  syncNow.mockResolvedValue({ state: 'ok', pulled: 0, pushed: 0, conflicts: 0, missing: 0 })
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
