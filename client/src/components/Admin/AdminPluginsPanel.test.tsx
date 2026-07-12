import { http, HttpResponse } from 'msw'
import { beforeEach, describe, expect, it } from 'vitest'
import { server } from '../../../tests/helpers/msw/server'
import { fireEvent, render, screen, waitFor } from '../../../tests/helpers/render'
import { resetAllStores } from '../../../tests/helpers/store'
import AdminPluginsPanel from './AdminPluginsPanel'

/**
 * The "allowed hosts" chip. A plugin that talks to a SELF-HOSTED service (a Gotify) can't
 * name the operator's host in its manifest, so the admin adds it — but they'd never know
 * that unless the card says so. Until a host exists the plugin can reach NOTHING and looks
 * silently broken, which is why the chip is warning-toned and actionable in that state.
 */
function plugin(over: Record<string, unknown> = {}) {
  return {
    id: 'trek-gotify', name: 'Gotify', description: 'Push notifications', type: 'integration',
    icon: 'Bell', version: '1.0.0', status: 'active', enabled: 1,
    last_error: null, reviewed_at: null, source_repo: null,
    permissions: JSON.stringify(['hook:notification-channel', 'http:outbound:gotify.net']),
    capabilities: '{}',
    operatorEgress: true,
    egressHostCount: 0,
    dependencyStatus: 'ok',
    dependencyIssues: { disabledAddons: [], missing: [], versionMismatch: [] },
    ...over,
  }
}

function mockList(p: Record<string, unknown>) {
  server.use(
    http.get('*/api/admin/plugins', () => HttpResponse.json({ enabled: true, devLink: false, plugins: [p] })),
    http.get('*/api/admin/plugins/registry', () => HttpResponse.json({ plugins: [] })),
  )
}

beforeEach(() => resetAllStores())

describe('AdminPluginsPanel — allowed-hosts chip', () => {
  it('FE-COMP-PLUGINS-EGRESS-001: invites the admin to add a host when none is set', async () => {
    mockList(plugin({ egressHostCount: 0 }))
    render(<AdminPluginsPanel />)
    // The plugin can't reach anything yet — the card must say so, not stay silent.
    expect(await screen.findByRole('button', { name: /add allowed host/i })).toBeInTheDocument()
  })

  it('FE-COMP-PLUGINS-EGRESS-002: shows the count once hosts exist', async () => {
    mockList(plugin({ egressHostCount: 2 }))
    render(<AdminPluginsPanel />)
    expect(await screen.findByRole('button', { name: /2 allowed host/i })).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /add allowed host/i })).not.toBeInTheDocument()
  })

  it('FE-COMP-PLUGINS-EGRESS-003: a plugin that never declared operatorEgress gets NO chip', async () => {
    mockList(plugin({ operatorEgress: false }))
    render(<AdminPluginsPanel />)
    await screen.findByText('Gotify')
    // An admin must never be invited to widen egress for a plugin that didn't ask for it.
    expect(screen.queryByRole('button', { name: /allowed host/i })).not.toBeInTheDocument()
  })

  it('FE-COMP-PLUGINS-EGRESS-004: clicking the chip opens the allowed-hosts dialog', async () => {
    mockList(plugin({ egressHostCount: 1 }))
    server.use(
      http.get('*/api/admin/plugins/trek-gotify/egress-hosts', () =>
        HttpResponse.json({ supported: true, hosts: ['gotify.mydomain.com'] })),
    )
    render(<AdminPluginsPanel />)

    fireEvent.click(await screen.findByRole('button', { name: /1 allowed host/i }))
    await waitFor(() => expect(screen.getByText('gotify.mydomain.com')).toBeInTheDocument())
  })
})

/**
 * The Discover (pre-install) modal. Its "Connects to" list is what a reviewer reads to
 * judge a plugin's network reach — so for an operatorEgress plugin that list is NOT the
 * whole story, and saying nothing would actively mislead them.
 */
function mockDetail(manifest: Record<string, unknown> | null) {
  server.use(
    http.get('*/api/admin/plugins', () => HttpResponse.json({ enabled: true, devLink: false, plugins: [] })),
    // pluginBrowse returns the ARRAY itself, not { plugins: [...] }.
    http.get('*/api/admin/plugins/registry', () =>
      HttpResponse.json([{ id: 'trek-gotify', name: 'Gotify', author: 'jubnl', description: 'Push', repo: 'jubnl/trek-gotify', type: 'integration', tags: [] }])),
    http.get('*/api/admin/plugins/registry/trek-gotify', () =>
      HttpResponse.json({
        id: 'trek-gotify', name: 'Gotify', author: 'jubnl', description: 'Push', repo: 'jubnl/trek-gotify',
        type: 'integration', tags: [], size: 1024, publishedAt: null, latest: '1.0.0', manifest,
      })),
  )
}

describe('AdminPluginsPanel — Discover modal, operator-egress pill', () => {
  const base = { permissions: ['hook:notification-channel', 'http:outbound:gotify.net'], egress: ['gotify.net'], settings: [], license: 'MIT', icon: null }

  /** The panel opens on Installed — switch to Discover, then open the plugin's card. */
  async function openDetail() {
    render(<AdminPluginsPanel />)
    fireEvent.click(await screen.findByRole('button', { name: /discover/i }))
    fireEvent.click(await screen.findByText('Gotify'))
  }

  it('FE-COMP-PLUGINS-EGRESS-005: warns that the host list is not the whole story', async () => {
    mockDetail({ ...base, operatorEgress: true })
    await openDetail()

    // The declared host is still listed…
    expect(await screen.findByText('gotify.net')).toBeInTheDocument()
    // …alongside the pill saying an admin adds more.
    expect(screen.getByText(/hosts you add/i)).toBeInTheDocument()
  })

  it('FE-COMP-PLUGINS-EGRESS-006: an ordinary plugin gets NO such pill', async () => {
    mockDetail({ ...base, operatorEgress: false })
    await openDetail()

    expect(await screen.findByText('gotify.net')).toBeInTheDocument()
    // Its egress list IS the whole story — claiming otherwise would be a lie.
    expect(screen.queryByText(/hosts you add/i)).not.toBeInTheDocument()
  })
})
