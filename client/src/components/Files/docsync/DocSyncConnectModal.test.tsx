// FE-DOCSYNC-CONNECT-001 to FE-DOCSYNC-CONNECT-027
import { describe, it, expect, vi, beforeEach } from 'vitest'
import en from '@trek/shared/i18n/en'
import { render, screen, fireEvent, waitFor, act, within } from '../../../../tests/helpers/render'
import type { DocSyncConnection, DocSyncProvider } from './useDocSync'

/** What the app really shows: `en` is bundled, so `t()` resolves for real here. */
const tx = (key: string): string => (en as unknown as Record<string, string>)[key] ?? key

const providers = vi.fn(async (_tripId: number | string): Promise<unknown> => [])
const listConnections = vi.fn(async (_tripId: number | string): Promise<unknown> => [])
const listLinks = vi.fn(async (_tripId: number | string): Promise<unknown> => [])
const status = vi.fn(async (_tripId: number | string): Promise<unknown> => ({ items: {}, links: [] }))
const saveConnection = vi.fn(async (_tripId: number | string, _data: unknown): Promise<unknown> => ({ id: 1 }))
const testConnection = vi.fn(async (_tripId: number | string, _data: unknown): Promise<unknown> => ({ connected: true }))

vi.mock('../../../api/client', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../../../api/client')>()
  return {
    ...actual,
    docsyncApi: {
      ...actual.docsyncApi,
      providers: (tripId: number | string) => providers(tripId),
      status: (tripId: number | string) => status(tripId),
      listConnections: (tripId: number | string) => listConnections(tripId),
      listLinks: (tripId: number | string) => listLinks(tripId),
      saveConnection: (tripId: number | string, data: unknown) => saveConnection(tripId, data),
      testConnection: (tripId: number | string, data: unknown) => testConnection(tripId, data),
    },
  }
})

import DocSyncConnectModal from './DocSyncConnectModal'
import { useDocSync } from './useDocSync'

const TRIP_ID = 42

const nextcloud: DocSyncProvider = {
  id: 'nextcloud',
  name: 'Nextcloud',
  description: 'Two-way document sync with a Nextcloud folder over WebDAV',
  icon: 'Cloud',
  available: true,
  fields: [
    { field_key: 'base_url', label: 'providerUrl', input_type: 'url', placeholder: 'https://cloud.example.com', hint: null, required: true, secret: false },
    { field_key: 'login_name', label: 'providerUsername', input_type: 'text', placeholder: 'username', hint: 'hintNextcloudLogin', required: true, secret: false },
    { field_key: 'app_password', label: 'providerAppPassword', input_type: 'password', placeholder: 'app password', hint: 'hintNextcloudAppPassword', required: true, secret: true },
    { field_key: 'base_path', label: 'providerBasePath', input_type: 'text', placeholder: '/TREK', hint: 'hintBasePath', required: false, secret: false },
    { field_key: 'allow_insecure_tls', label: 'allowInsecureTls', input_type: 'checkbox', placeholder: null, hint: null, required: false, secret: false },
  ],
}

/** Synology is the one provider with a secret that is NOT a password box (the OTP). */
const synology: DocSyncProvider = {
  id: 'synologydrive',
  name: 'Synology Drive',
  description: 'Two-way document sync with a folder on a Synology NAS',
  icon: 'HardDrive',
  available: true,
  fields: [
    { field_key: 'base_url', label: 'providerUrl', input_type: 'url', placeholder: 'https://nas.example.com:5001', hint: 'hintSynologyUrl', required: true, secret: false },
    { field_key: 'password', label: 'providerPassword', input_type: 'password', placeholder: 'password', hint: null, required: true, secret: true },
    { field_key: 'otp_code', label: 'providerOTP', input_type: 'text', placeholder: '123456', hint: 'hintSynologyOtp', required: false, secret: true },
    { field_key: 'allow_insecure_tls', label: 'allowInsecureTls', input_type: 'checkbox', placeholder: null, hint: null, required: false, secret: false },
  ],
}

const connection = (overrides: Partial<DocSyncConnection> = {}): DocSyncConnection => ({
  id: 9,
  providerId: 'nextcloud',
  baseUrl: 'https://cloud.example.com',
  settings: { login_name: 'maurice', base_path: '/Archive/TREK' },
  secrets: { app_password: 'stored' },
  allowInsecureTls: false,
  lastProbeState: 'ok',
  lastProbeError: null,
  ...overrides,
})

function Harness({
  provider,
  onClose,
  onConnected,
  waitForConnection,
}: {
  provider: DocSyncProvider
  onClose: () => void
  onConnected: (providerId: string) => void
  /**
   * Hold the dialog back until the stored connection is in hand, the way the
   * panel does: it only offers "connect" once it knows what is already there.
   */
  waitForConnection?: boolean
}) {
  const sync = useDocSync(TRIP_ID, true)
  if (waitForConnection && !sync.connectionFor(provider.id)) return null
  return <DocSyncConnectModal provider={provider} sync={sync} onClose={onClose} onConnected={onConnected} />
}

/** Let the hook's initial load land before anything is asserted. */
async function flush() {
  await act(async () => {
    await new Promise(resolve => setTimeout(resolve, 0))
  })
}

async function open(provider: DocSyncProvider = nextcloud, waitForConnection = false) {
  const onClose = vi.fn()
  const onConnected = vi.fn()
  const utils = render(
    <Harness provider={provider} onClose={onClose} onConnected={onConnected} waitForConnection={waitForConnection} />,
  )
  await flush()
  return { ...utils, onClose, onConnected }
}

const testButton = () => screen.getByRole('button', { name: tx('docsync.test') })
const connectButton = () => screen.getByRole('button', { name: tx('docsync.connect.submit') })

function fillNextcloud() {
  fireEvent.change(screen.getByPlaceholderText('https://cloud.example.com'), { target: { value: 'https://cloud.example.com' } })
  fireEvent.change(screen.getByPlaceholderText('username'), { target: { value: 'maurice' } })
  fireEvent.change(screen.getByPlaceholderText('app password'), { target: { value: 'app-pw' } })
}

beforeEach(() => {
  vi.clearAllMocks()
  providers.mockResolvedValue([])
  listConnections.mockResolvedValue([])
  listLinks.mockResolvedValue([])
  status.mockResolvedValue({ items: {}, links: [] })
  saveConnection.mockResolvedValue({ id: 1 })
  testConnection.mockResolvedValue({ connected: true })
})

describe('DocSyncConnectModal form', () => {
  it('FE-DOCSYNC-CONNECT-001: renders one labelled box per provider field and leaves the TLS field to the switch', async () => {
    const { baseElement } = await open()

    expect(screen.getByText(tx('docsync.providerUrl'))).toBeInTheDocument()
    expect(screen.getByText(tx('docsync.providerUsername'))).toBeInTheDocument()
    expect(screen.getByText(tx('docsync.providerAppPassword'))).toBeInTheDocument()
    expect(screen.getByText(tx('docsync.providerBasePath'))).toBeInTheDocument()
    // allow_insecure_tls is a switch, not a fifth text box
    expect(baseElement.querySelectorAll('input')).toHaveLength(4)
    expect(screen.getByText(tx('docsync.allowInsecureTls'))).toBeInTheDocument()
    expect(screen.getByRole('button', { pressed: false })).toBeInTheDocument()
  })

  it('FE-DOCSYNC-CONNECT-002: a password field is masked and the other boxes are not', async () => {
    await open()

    expect(screen.getByPlaceholderText('app password')).toHaveAttribute('type', 'password')
    expect(screen.getByPlaceholderText('https://cloud.example.com')).toHaveAttribute('type', 'text')
    expect(screen.getByPlaceholderText('username')).toHaveAttribute('type', 'text')
    expect(screen.getByPlaceholderText('/TREK')).toHaveAttribute('type', 'text')
  })

  it('FE-DOCSYNC-CONNECT-003: a secret the provider declares as plain text stays readable', async () => {
    await open(synology)

    expect(screen.getByPlaceholderText('password')).toHaveAttribute('type', 'password')
    expect(screen.getByPlaceholderText('123456')).toHaveAttribute('type', 'text')
  })

  it('FE-DOCSYNC-CONNECT-004: only the optional fields carry the optional mark', async () => {
    await open()
    const optional = tx('docsync.connect.optional')

    const basePath = screen.getByPlaceholderText('/TREK').closest('label') as HTMLElement
    expect(within(basePath).getByText(optional)).toBeInTheDocument()

    for (const placeholder of ['https://cloud.example.com', 'username', 'app password']) {
      const field = screen.getByPlaceholderText(placeholder).closest('label') as HTMLElement
      expect(within(field).queryByText(optional)).not.toBeInTheDocument()
    }
    expect(screen.getAllByText(optional)).toHaveLength(1)
  })

  it('FE-DOCSYNC-CONNECT-005: a field hint is translated, and a field without one gets no line', async () => {
    await open()

    const username = screen.getByPlaceholderText('username').closest('label') as HTMLElement
    expect(within(username).getByText(tx('docsync.hintNextcloudLogin'))).toBeInTheDocument()

    const baseUrl = screen.getByPlaceholderText('https://cloud.example.com').closest('label') as HTMLElement
    expect(baseUrl.textContent?.trim()).toBe(tx('docsync.providerUrl'))
  })

  it('FE-DOCSYNC-CONNECT-006: the dialog is headed by the provider and explains what it will do', async () => {
    await open()

    expect(screen.getByRole('heading', { name: nextcloud.name })).toBeInTheDocument()
    expect(screen.getByText(tx('docsync.connect.about.nextcloud'))).toBeInTheDocument()
    expect(screen.getByText(tx('docsync.connect.insecureHint'))).toBeInTheDocument()
  })

  it('FE-DOCSYNC-CONNECT-007: escape closes the dialog without saving', async () => {
    const { onClose, onConnected } = await open()

    fireEvent.keyDown(document, { key: 'Escape' })

    expect(onClose).toHaveBeenCalled()
    expect(onConnected).not.toHaveBeenCalled()
    expect(saveConnection).not.toHaveBeenCalled()
  })
})

describe('DocSyncConnectModal required fields', () => {
  it('FE-DOCSYNC-CONNECT-008: nothing can be saved or probed while a required field is empty', async () => {
    await open()

    expect(connectButton()).toBeDisabled()
    expect(testButton()).toBeDisabled()

    fireEvent.click(connectButton())
    fireEvent.click(testButton())

    expect(saveConnection).not.toHaveBeenCalled()
    expect(testConnection).not.toHaveBeenCalled()
  })

  it('FE-DOCSYNC-CONNECT-009: a missing password alone is enough to refuse the save', async () => {
    await open()

    fireEvent.change(screen.getByPlaceholderText('https://cloud.example.com'), { target: { value: 'https://cloud.example.com' } })
    fireEvent.change(screen.getByPlaceholderText('username'), { target: { value: 'maurice' } })

    expect(connectButton()).toBeDisabled()

    fireEvent.change(screen.getByPlaceholderText('app password'), { target: { value: 'app-pw' } })

    expect(connectButton()).toBeEnabled()
  })

  it('FE-DOCSYNC-CONNECT-010: an address of nothing but spaces does not count as filled', async () => {
    await open()

    fillNextcloud()
    expect(connectButton()).toBeEnabled()

    fireEvent.change(screen.getByPlaceholderText('https://cloud.example.com'), { target: { value: '   ' } })

    expect(connectButton()).toBeDisabled()
    expect(testButton()).toBeDisabled()
  })

  it('FE-DOCSYNC-CONNECT-011: an empty optional field does not hold the save back', async () => {
    const { onConnected } = await open()

    fillNextcloud()
    fireEvent.click(connectButton())

    await waitFor(() => expect(onConnected).toHaveBeenCalled())
    expect(saveConnection).toHaveBeenCalledWith(TRIP_ID, {
      providerId: 'nextcloud',
      baseUrl: 'https://cloud.example.com',
      credentials: { base_url: 'https://cloud.example.com', login_name: 'maurice', app_password: 'app-pw' },
      allowInsecureTls: false,
    })
  })
})

describe('DocSyncConnectModal probe verdict', () => {
  it('FE-DOCSYNC-CONNECT-012: the probe carries the typed address, credentials and TLS choice', async () => {
    await open()

    fillNextcloud()
    fireEvent.change(screen.getByPlaceholderText('/TREK'), { target: { value: '/Archive' } })
    fireEvent.click(testButton())

    await waitFor(() => expect(testConnection).toHaveBeenCalledWith(TRIP_ID, {
      providerId: 'nextcloud',
      baseUrl: 'https://cloud.example.com',
      credentials: {
        base_url: 'https://cloud.example.com',
        login_name: 'maurice',
        app_password: 'app-pw',
        base_path: '/Archive',
      },
      allowInsecureTls: false,
    }))
    expect(saveConnection).not.toHaveBeenCalled()
  })

  it('FE-DOCSYNC-CONNECT-013: a reachable provider names the account it signed in as', async () => {
    testConnection.mockResolvedValueOnce({ connected: true, account: 'maurice' })
    await open()

    fillNextcloud()
    fireEvent.click(testButton())

    const line = tx('docsync.connect.okAs').replace('{account}', 'maurice')
    expect(await screen.findByText(line)).toBeInTheDocument()
  })

  it('FE-DOCSYNC-CONNECT-014: a reachable provider without an account just reports the connection', async () => {
    testConnection.mockResolvedValueOnce({ connected: true })
    await open()

    fillNextcloud()
    fireEvent.click(testButton())

    expect(await screen.findByText(tx('docsync.connected'))).toBeInTheDocument()
  })

  it('FE-DOCSYNC-CONNECT-015: a refused credential shows the translated reason', async () => {
    testConnection.mockResolvedValueOnce({ connected: false, error: 'unauthorized' })
    await open()

    fillNextcloud()
    fireEvent.click(testButton())

    const line = await screen.findByText(tx('docsync.error.unauthorized'))
    expect(line).toBeInTheDocument()
    expect(screen.queryByText(tx('docsync.connected'))).not.toBeInTheDocument()
    expect(line.parentElement?.querySelector('svg')?.getAttribute('class')).not.toMatch(/shield/)
  })

  it('FE-DOCSYNC-CONNECT-016: an address TREK itself blocked is marked with the shield, not the warning', async () => {
    testConnection.mockResolvedValueOnce({ connected: false, error: 'ssrf_blocked' })
    await open()

    fillNextcloud()
    fireEvent.click(testButton())

    const line = await screen.findByText(tx('docsync.error.ssrf_blocked'))
    expect(line.parentElement?.querySelector('svg')?.getAttribute('class')).toMatch(/shield/)
  })

  it('FE-DOCSYNC-CONNECT-017: a failure with no reason falls back to the unknown message', async () => {
    testConnection.mockResolvedValueOnce({ connected: false })
    await open()

    fillNextcloud()
    fireEvent.click(testButton())

    expect(await screen.findByText(tx('docsync.error.unknown'))).toBeInTheDocument()
  })

  it('FE-DOCSYNC-CONNECT-018: a request that throws still lands as a verdict rather than an empty footer', async () => {
    testConnection.mockRejectedValueOnce({ response: { data: { error: 'timeout' } } })
    await open()

    fillNextcloud()
    fireEvent.click(testButton())

    expect(await screen.findByText(tx('docsync.error.timeout'))).toBeInTheDocument()
  })

  it('FE-DOCSYNC-CONNECT-019: while the probe runs the dialog says so and the probe button is locked', async () => {
    let settle: (value: unknown) => void = () => {}
    testConnection.mockImplementationOnce(() => new Promise(resolve => { settle = resolve }))
    await open()

    fillNextcloud()
    fireEvent.click(testButton())

    expect(screen.getByText(tx('docsync.connect.testing'))).toBeInTheDocument()
    expect(testButton()).toBeDisabled()

    await act(async () => {
      settle({ connected: true })
      await new Promise(resolve => setTimeout(resolve, 0))
    })

    expect(screen.queryByText(tx('docsync.connect.testing'))).not.toBeInTheDocument()
    expect(screen.getByText(tx('docsync.connected'))).toBeInTheDocument()
    expect(testButton()).toBeEnabled()
  })
})

describe('DocSyncConnectModal saving', () => {
  it('FE-DOCSYNC-CONNECT-020: a successful save reports the connected provider upward', async () => {
    const { onConnected, onClose } = await open()

    fillNextcloud()
    fireEvent.click(connectButton())

    await waitFor(() => expect(onConnected).toHaveBeenCalledWith('nextcloud'))
    expect(onConnected).toHaveBeenCalledTimes(1)
    expect(onClose).not.toHaveBeenCalled()
    // the freshly stored connection is read back, not assumed
    expect(listConnections).toHaveBeenCalledTimes(2)
  })

  it('FE-DOCSYNC-CONNECT-021: a rejected save reports nothing upward and leaves the form standing', async () => {
    saveConnection.mockRejectedValueOnce({ response: { data: { error: 'unauthorized' } } })
    const { onConnected, onClose } = await open()

    fillNextcloud()
    fireEvent.click(connectButton())

    await waitFor(() => expect(saveConnection).toHaveBeenCalled())
    expect(onConnected).not.toHaveBeenCalled()
    expect(onClose).not.toHaveBeenCalled()
    expect(screen.getByPlaceholderText('app password')).toHaveValue('app-pw')
  })

  it('FE-DOCSYNC-CONNECT-022: the save button is locked while the write is in flight', async () => {
    let settle: (value: unknown) => void = () => {}
    saveConnection.mockImplementationOnce(() => new Promise(resolve => { settle = resolve }))
    const { onConnected } = await open()

    fillNextcloud()
    fireEvent.click(connectButton())

    expect(connectButton()).toBeDisabled()

    await act(async () => {
      settle({ id: 1 })
      await new Promise(resolve => setTimeout(resolve, 0))
    })

    expect(onConnected).toHaveBeenCalledWith('nextcloud')
  })

  it('FE-DOCSYNC-CONNECT-023: the self-signed switch starts off and travels with the request', async () => {
    await open()

    fillNextcloud()
    fireEvent.click(screen.getByRole('button', { pressed: false }))

    expect(screen.getByRole('button', { pressed: true })).toBeInTheDocument()

    fireEvent.click(connectButton())

    await waitFor(() => expect(saveConnection).toHaveBeenCalledWith(TRIP_ID, expect.objectContaining({ allowInsecureTls: true })))
  })
})

describe('DocSyncConnectModal with a connection already stored', () => {
  it('FE-DOCSYNC-CONNECT-024: the stored settings come back, the saved secret is only hinted at, and it saves untouched', async () => {
    listConnections.mockResolvedValue([connection({ settings: { login_name: 'maurice', base_path: '/Archive/TREK', app_password: 'never-echo-me' } })])
    const { onConnected } = await open(nextcloud, true)

    expect(await screen.findByPlaceholderText('••••••••')).toBeInTheDocument()
    expect(screen.getByPlaceholderText('username')).toHaveValue('maurice')
    expect(screen.getByPlaceholderText('/TREK')).toHaveValue('/Archive/TREK')
    // a secret is never echoed back into the box, whatever the settings blob holds
    expect(screen.getByPlaceholderText('••••••••')).toHaveValue('')

    // the stored secret counts as filled, so nothing has to be retyped
    expect(connectButton()).toBeEnabled()
    fireEvent.click(connectButton())

    await waitFor(() => expect(onConnected).toHaveBeenCalledWith('nextcloud'))
    expect(saveConnection).toHaveBeenCalledWith(TRIP_ID, {
      providerId: 'nextcloud',
      baseUrl: 'https://cloud.example.com',
      credentials: {},
      allowInsecureTls: false,
    })
  })

  it('FE-DOCSYNC-CONNECT-025: the stored self-signed choice is the one the switch starts on', async () => {
    listConnections.mockResolvedValue([connection({ allowInsecureTls: true })])
    await open(nextcloud, true)

    expect(screen.getByRole('button', { pressed: true })).toBeInTheDocument()
  })

  it('FE-DOCSYNC-CONNECT-026: a connection that lands after the dialog is open still sets the switch', async () => {
    // The switch used to be seeded by a useState initialiser, so it only ever
    // read the connection that existed at the moment the dialog mounted: a
    // stored "allow self-signed" showed as off, and the next save wrote that
    // back. A security switch turning itself off unasked is the bad version of
    // a stale field, so it now reads through until somebody touches it.
    listConnections.mockResolvedValue([connection({ allowInsecureTls: true })])
    await open(nextcloud, false)

    await screen.findByPlaceholderText('••••••••')
    await waitFor(() => expect(screen.getByRole('button', { pressed: true })).toBeInTheDocument())
  })

  it('FE-DOCSYNC-CONNECT-027: the stored address is shown as well as submitted', async () => {
    listConnections.mockResolvedValue([connection()])
    const { onConnected } = await open(nextcloud, true)

    await screen.findByPlaceholderText('••••••••')
    // The address is a column of its own rather than a settings entry. Reading
    // it out of settings left the box empty over its placeholder while the form
    // went on submitting the stored value, the field and the request quietly
    // disagreeing about what the connection is.
    await waitFor(() =>
      expect(screen.getByPlaceholderText('https://cloud.example.com')).toHaveValue('https://cloud.example.com'),
    )

    fireEvent.click(connectButton())

    await waitFor(() => expect(onConnected).toHaveBeenCalled())
    expect(saveConnection).toHaveBeenCalledWith(TRIP_ID, expect.objectContaining({ baseUrl: 'https://cloud.example.com' }))
  })
})
