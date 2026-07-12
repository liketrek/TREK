import { http, HttpResponse } from 'msw'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
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

/**
 * #1523. The row's ⋯ menu used to be an in-flow `absolute` div, and PageSidebar — the
 * panel's ancestor — is `overflow-hidden`. On the lower rows of a long plugin list the
 * menu was clipped mid-way, taking Delete with it: the plugin became uninstallable from
 * the UI. It must escape every overflow ancestor, and flip up when the bottom is tight.
 */
describe('AdminPluginsPanel — row ⋯ menu is never clipped (#1523)', () => {
  const withRepo = plugin({ source_repo: 'trek/gotify', operatorEgress: false })
  const realRect = HTMLButtonElement.prototype.getBoundingClientRect
  afterEach(() => { HTMLButtonElement.prototype.getBoundingClientRect = realRect })

  /** Put the ⋯ button wherever we want in an 800px-tall viewport. */
  function stubTriggerAt(top: number) {
    window.innerHeight = 800
    window.innerWidth = 1200
    HTMLButtonElement.prototype.getBoundingClientRect = function () {
      return { top, bottom: top + 34, left: 1100, right: 1134, width: 34, height: 34, x: 1100, y: top, toJSON: () => ({}) } as DOMRect
    }
  }

  async function openRowMenu() {
    mockList(withRepo)
    const { container } = render(<AdminPluginsPanel />)
    fireEvent.click(await screen.findByTestId('plugin-row-menu-btn-trek-gotify'))
    return { container, menu: screen.getByTestId('plugin-row-menu-trek-gotify') }
  }

  it('FE-COMP-PLUGINS-MENU-001: renders every action, including Delete', async () => {
    stubTriggerAt(100)
    await openRowMenu()

    for (const label of [/restart/i, /error log/i, /allowed hosts/i, /source repository/i, /report an issue/i, /delete/i]) {
      expect(screen.getByText(label)).toBeInTheDocument()
    }
  })

  it('FE-COMP-PLUGINS-MENU-002: is portaled out of the panel, so no overflow ancestor can clip it', async () => {
    stubTriggerAt(100)
    const { container, menu } = await openRowMenu()

    // THE regression guard: living inside the panel is exactly what got it clipped.
    expect(container.contains(menu)).toBe(false)
    expect(menu.parentElement).toBe(document.body)
    expect(menu.style.position).toBe('fixed')
  })

  it('FE-COMP-PLUGINS-MENU-003: hangs below the ⋯ when there is room', async () => {
    stubTriggerAt(100)
    const { menu } = await openRowMenu()

    expect(menu.style.top).toBe('138px')   // trigger bottom (134) + 4
    expect(menu.style.bottom).toBe('')
    expect(menu.style.right).toBe('66px')  // viewport (1200) - trigger right (1134)
  })

  it('FE-COMP-PLUGINS-MENU-004: flips upward for a row near the bottom — the #1523 case', async () => {
    stubTriggerAt(700) // 66px of room below: the six-item menu would run off-screen
    const { menu } = await openRowMenu()

    expect(menu.style.bottom).toBe('104px') // viewport (800) - trigger top (700) + 4
    expect(menu.style.top).toBe('')
  })
})
