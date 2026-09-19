// FE-DOCSYNC-BIND-001 to FE-DOCSYNC-BIND-026
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, fireEvent, waitFor, within } from '../../../../tests/helpers/render'
import DocSyncBinding from './DocSyncBinding'
import type { DocSyncLink, useDocSync } from './useDocSync'

type Sync = ReturnType<typeof useDocSync>

const syncNow = vi.fn(async (_linkId: number) => ({ state: 'ok', pulled: 0, pushed: 0, conflicts: 0, missing: 0 }))
const updateLink = vi.fn(async (_linkId: number, _patch: Record<string, unknown>) => {})
const removeLink = vi.fn(async (_linkId: number) => {})

const WEBHOOK = 'https://trek.example/api/trips/3/docsync/hooks/abc123'

function makeLink(overrides: Partial<DocSyncLink> = {}): DocSyncLink {
  return {
    id: 4,
    connectionId: 1,
    providerId: 'paperless',
    scopeKey: 'trek-trip-3',
    remoteLabel: 'Lisbon papers',
    remoteRootPath: '/TREK/Lisbon',
    direction: 'both',
    deletePolicy: 'unlink',
    conflictPolicy: 'manual',
    syncEnabled: true,
    lastSyncAt: null,
    lastSyncState: 'ok',
    lastSyncError: null,
    webhookUrl: null,
    holdings: { inTrek: 3, atProvider: 2, paired: 2, missing: 1 },
    ...overrides,
  }
}

function makeSync(overrides: Partial<Sync> = {}): Sync {
  return {
    providers: [],
    connections: [],
    links: [],
    itemCounts: {},
    loading: false,
    busy: null,
    error: null,
    connectionFor: () => null,
    load: vi.fn(),
    saveConnection: vi.fn(),
    testConnection: vi.fn(),
    loadScopes: vi.fn(),
    createScope: vi.fn(),
    createLink: vi.fn(),
    updateLink,
    removeLink,
    syncNow,
    resolveConflict: vi.fn(),
    lastRunFor: () => ({ pulled: 0, pushed: 0 }),
    ...overrides,
  } as unknown as Sync
}

function renderCard(
  opts: {
    link?: Partial<DocSyncLink>
    sync?: Partial<Sync>
    canManage?: boolean
    providerName?: string
  } = {},
) {
  const utils = render(
    <DocSyncBinding
      link={makeLink(opts.link)}
      providerName={opts.providerName ?? 'Paperless'}
      sync={makeSync(opts.sync)}
      canManage={opts.canManage ?? true}
    />,
  )
  const header = utils.container.querySelector('header') as HTMLElement
  return { ...utils, header }
}

const openSettings = () => fireEvent.click(screen.getByRole('button', { name: 'Settings' }))

const rowFor = (label: string) => screen.getByText(label).closest('div') as HTMLElement

beforeEach(() => {
  vi.clearAllMocks()
})

describe('DocSyncBinding: running a sync', () => {
  it('FE-DOCSYNC-BIND-001: "Sync now" asks the hook to run this binding', () => {
    renderCard()

    fireEvent.click(screen.getByRole('button', { name: 'Sync now' }))

    expect(syncNow).toHaveBeenCalledWith(4)
  })

  it('FE-DOCSYNC-BIND-002: while this binding runs the button reads "Syncing" and refuses another click', () => {
    renderCard({ sync: { busy: 'sync-4' } })

    const button = screen.getByRole('button', { name: 'Syncing' })
    expect(button).toBeDisabled()
    expect(screen.queryByRole('button', { name: 'Sync now' })).not.toBeInTheDocument()

    fireEvent.click(button)
    expect(syncNow).not.toHaveBeenCalled()
  })

  it('FE-DOCSYNC-BIND-003: a run on another binding leaves this card ready', () => {
    renderCard({ sync: { busy: 'sync-9' } })

    expect(screen.getByRole('button', { name: 'Sync now' })).toBeEnabled()
  })

  it('FE-DOCSYNC-BIND-004: the disconnect button unlinks this binding', () => {
    renderCard()

    fireEvent.click(screen.getByRole('button', { name: 'Disconnect' }))

    expect(removeLink).toHaveBeenCalledWith(4)
  })
})

describe('DocSyncBinding: what it says about itself', () => {
  it('FE-DOCSYNC-BIND-005: a healthy binding shows its state as a dot, not as a word', () => {
    renderCard()

    expect(screen.queryByText('In sync')).not.toBeInTheDocument()
    const dot = screen.getByTitle('In sync')
    expect(dot).toBeInTheDocument()
    expect(dot).toBeEmptyDOMElement()
  })

  it('FE-DOCSYNC-BIND-006: a failing binding spells the state out and appends the reason', () => {
    renderCard({ link: { lastSyncState: 'failed', lastSyncError: 'unauthorized' } })

    expect(screen.getByText('Failed')).toBeInTheDocument()
    expect(screen.getByText('Failed · The credentials were refused.')).toBeInTheDocument()
  })

  it('FE-DOCSYNC-BIND-007: a failing binding without a reason code shows the state alone', () => {
    renderCard({ link: { lastSyncState: 'failed', lastSyncError: null } })

    // once as the header badge, once as the banner underneath it
    expect(screen.getAllByText('Failed')).toHaveLength(2)
  })

  it('FE-DOCSYNC-BIND-008: a partly synced binding also gets the banner', () => {
    renderCard({ link: { lastSyncState: 'partial', lastSyncError: 'too_large' } })

    expect(screen.getByText('Partly synced · The file is larger than the provider accepts.')).toBeInTheDocument()
  })

  it('FE-DOCSYNC-BIND-009: a binding that never ran names its state but raises no alarm', () => {
    renderCard({ link: { lastSyncState: 'never', lastSyncAt: null } })

    expect(screen.getAllByText('Not synced yet')).toHaveLength(1)
    expect(screen.getByText('not run yet')).toBeInTheDocument()
  })

  it('FE-DOCSYNC-BIND-026: a binding whose provider an admin switched off says it is paused, not what the last run said', () => {
    // The server leaves the binding's own state as the last run wrote it, so
    // without this the card went on reporting an old failure, or nothing.
    renderCard({ link: { providerOff: true, lastSyncState: 'failed', lastSyncError: 'unauthorized' } })

    expect(screen.getByText('Paused: an administrator has switched this provider off. Syncing resumes once it is back on.')).toBeInTheDocument()
    expect(screen.queryByText('Failed · The credentials were refused.')).not.toBeInTheDocument()
  })

  it('FE-DOCSYNC-BIND-010: a paused binding is badged, an active one is not', () => {
    const { unmount } = renderCard({ link: { syncEnabled: false } })
    expect(screen.getByText('Paused')).toBeInTheDocument()
    unmount()

    renderCard({ link: { syncEnabled: true } })
    expect(screen.queryByText('Paused')).not.toBeInTheDocument()
  })

  it('FE-DOCSYNC-BIND-011: the last run is shown as elapsed time once there is one', () => {
    renderCard({ link: { lastSyncAt: new Date(Date.now() - 2 * 3600_000).toISOString() } })

    expect(screen.getByText(/hours ago/)).toBeInTheDocument()
    expect(screen.queryByText('not run yet')).not.toBeInTheDocument()
  })

  it('FE-DOCSYNC-BIND-012: the folder falls back to the path, then to the scope key', () => {
    const { unmount } = renderCard({ link: { remoteLabel: '' } })
    expect(screen.getByText('/TREK/Lisbon')).toBeInTheDocument()
    unmount()

    renderCard({ link: { remoteLabel: '', remoteRootPath: null } })
    expect(screen.getByText('trek-trip-3')).toBeInTheDocument()
  })

  it('FE-DOCSYNC-BIND-013: names the store it is handed in the header and at the far end of the flow', () => {
    const { header } = renderCard({ providerName: 'Paperless-ngx' })

    expect(within(header).getByText('Paperless-ngx')).toBeInTheDocument()
    expect(screen.getAllByText('Paperless-ngx')).toHaveLength(2)
    expect(screen.queryByText('paperless')).not.toBeInTheDocument()
  })

  it('FE-DOCSYNC-BIND-014: the flow bar gets the holdings, and zeros when there are none', () => {
    const { unmount } = renderCard()
    expect(screen.getByText('3')).toBeInTheDocument()
    expect(screen.getByText('2')).toBeInTheDocument()
    unmount()

    renderCard({ link: { holdings: undefined } })
    expect(screen.getAllByText('0')).toHaveLength(2)
  })
})

describe('DocSyncBinding: the settings section', () => {
  it('FE-DOCSYNC-BIND-015: the settings stay folded away until they are opened', () => {
    renderCard()

    const toggle = screen.getByRole('button', { name: 'Settings' })
    expect(toggle).toHaveAttribute('aria-expanded', 'false')
    expect(screen.queryByText('Sync automatically')).not.toBeInTheDocument()
    expect(screen.queryByText('When a document is deleted')).not.toBeInTheDocument()

    fireEvent.click(toggle)

    expect(toggle).toHaveAttribute('aria-expanded', 'true')
    expect(screen.getByText('Sync automatically')).toBeInTheDocument()
    expect(screen.getByText('When a document is deleted')).toBeInTheDocument()

    fireEvent.click(toggle)
    expect(screen.queryByText('Sync automatically')).not.toBeInTheDocument()
  })

  it('FE-DOCSYNC-BIND-016: a member gets no settings section and no disconnect button', () => {
    renderCard({ canManage: false })

    expect(screen.queryByRole('button', { name: 'Settings' })).not.toBeInTheDocument()
    expect(screen.queryByText('Sync automatically')).not.toBeInTheDocument()
    expect(screen.queryByText('When a document is deleted')).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Disconnect' })).not.toBeInTheDocument()
    // a member may still trigger a run
    expect(screen.getByRole('button', { name: 'Sync now' })).toBeEnabled()
  })

  it('FE-DOCSYNC-BIND-017: turning "sync automatically" off patches the link', () => {
    renderCard()
    openSettings()

    fireEvent.click(within(rowFor('Sync automatically')).getByRole('button'))

    expect(updateLink).toHaveBeenCalledWith(4, { syncEnabled: false })
  })

  it('FE-DOCSYNC-BIND-018: turning it back on patches the other way', () => {
    renderCard({ link: { syncEnabled: false } })
    openSettings()

    const toggle = within(rowFor('Sync automatically')).getByRole('button')
    expect(toggle).toHaveAttribute('aria-pressed', 'false')
    fireEvent.click(toggle)

    expect(updateLink).toHaveBeenCalledWith(4, { syncEnabled: true })
  })

  it('FE-DOCSYNC-BIND-019: choosing another delete policy patches the link', () => {
    renderCard()
    openSettings()

    const trigger = within(rowFor('When a document is deleted')).getByRole('button')
    expect(trigger).toHaveTextContent('Keep both copies')

    fireEvent.click(trigger)
    fireEvent.click(screen.getByRole('button', { name: 'Move to recycle bin' }))

    expect(updateLink).toHaveBeenCalledWith(4, { deletePolicy: 'trash' })
  })
})

describe('DocSyncBinding: the webhook URL', () => {
  const realClipboard = navigator.clipboard

  afterEach(() => {
    Object.defineProperty(navigator, 'clipboard', { value: realClipboard, configurable: true, writable: true })
  })

  const stubClipboard = (writeText: (text: string) => Promise<void>) => {
    Object.defineProperty(navigator, 'clipboard', { value: { writeText }, configurable: true, writable: true })
  }

  it('FE-DOCSYNC-BIND-020: a binding without a webhook shows no webhook section', () => {
    renderCard({ link: { webhookUrl: null } })
    openSettings()

    expect(screen.queryByText('Instant updates')).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Copy' })).not.toBeInTheDocument()
  })

  it('FE-DOCSYNC-BIND-021: a binding with a webhook shows the URL for pasting', () => {
    renderCard({ link: { webhookUrl: WEBHOOK } })
    openSettings()

    expect(screen.getByText('Instant updates')).toBeInTheDocument()
    expect(screen.getByText(WEBHOOK)).toBeInTheDocument()
  })

  it('FE-DOCSYNC-BIND-022: copying the webhook puts it on the clipboard and confirms', async () => {
    const writeText = vi.fn(async (_text: string) => {})
    stubClipboard(writeText)
    renderCard({ link: { webhookUrl: WEBHOOK } })
    openSettings()

    fireEvent.click(screen.getByRole('button', { name: 'Copy' }))

    await waitFor(() => expect(writeText).toHaveBeenCalledWith(WEBHOOK))
    expect(await screen.findByRole('button', { name: 'Copied' })).toBeInTheDocument()
  })

  it('FE-DOCSYNC-BIND-023: a blocked clipboard leaves the URL on screen and the button unchanged', async () => {
    const writeText = vi.fn(async (_text: string) => { throw new Error('not allowed') })
    stubClipboard(writeText)
    renderCard({ link: { webhookUrl: WEBHOOK } })
    openSettings()

    fireEvent.click(screen.getByRole('button', { name: 'Copy' }))

    await waitFor(() => expect(writeText).toHaveBeenCalled())
    expect(screen.queryByRole('button', { name: 'Copied' })).not.toBeInTheDocument()
    expect(screen.getByText(WEBHOOK)).toBeInTheDocument()
  })
})

describe('DocSyncBinding: the direction lanes', () => {
  it('FE-DOCSYNC-BIND-024: switching a lane off patches the direction', () => {
    renderCard()

    fireEvent.click(screen.getByRole('button', { name: 'Out to the store' }))

    expect(updateLink).toHaveBeenCalledWith(4, { direction: 'pull' })
  })

  it('FE-DOCSYNC-BIND-025: a member cannot change the direction', () => {
    renderCard({ canManage: false })

    const lane = screen.getByRole('button', { name: 'Out to the store' })
    expect(lane).toBeDisabled()
    fireEvent.click(lane)
    expect(updateLink).not.toHaveBeenCalled()
  })
})
