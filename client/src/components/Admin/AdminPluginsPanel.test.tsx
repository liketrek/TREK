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

/**
 * Signature status (#plugins). TREK has always verified author signatures and TOFU-pinned
 * the key — and never showed any of it, so a successfully-installed UNSIGNED plugin looked
 * identical to a signed one, forever.
 *
 * The two tests that matter most here are the ones guarding the override: a re-trust is
 * offered for a ROTATED key (benign explanation) and for NOTHING else. A signature that
 * doesn't verify means the bytes are not what the author signed, and there is no story
 * where the right answer is letting the admin wave it through.
 */
function registryEntry(over: Record<string, unknown> = {}) {
  return {
    id: 'trek-gotify', name: 'Gotify', author: 'Acme', description: 'Push', repo: 'acme/gotify',
    type: 'integration', latest: '2.0.0', minTrekVersion: null, reviewedAt: null,
    screenshotUrl: null, signed: true, authorPublicKey: 'NEWKEYbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb',
    ...over,
  }
}

function mockPanel(p: Record<string, unknown>, entry: Record<string, unknown> | null = registryEntry()) {
  server.use(
    http.get('*/api/admin/plugins', () => HttpResponse.json({ enabled: true, devLink: false, plugins: [p] })),
    http.get('*/api/admin/plugins/registry', () => HttpResponse.json(entry ? [entry] : [])),
  )
}

describe('AdminPluginsPanel — signature badges', () => {
  it('FE-COMP-PLUGINS-SIG-001: a registry plugin with a pinned key reads as Signed', async () => {
    mockPanel(plugin({ source_repo: 'acme/gotify', signed: true, keyFingerprint: 'AAAAAAAA…BBBBBBBB' }))
    render(<AdminPluginsPanel />)
    expect(await screen.findByText('Signed')).toBeInTheDocument()
    expect(screen.queryByText('Unsigned')).not.toBeInTheDocument()
  })

  it('FE-COMP-PLUGINS-SIG-002: a registry plugin with no key reads as Unsigned', async () => {
    mockPanel(plugin({ source_repo: 'acme/gotify', signed: false, keyFingerprint: null }))
    render(<AdminPluginsPanel />)
    expect(await screen.findByText('Unsigned')).toBeInTheDocument()
  })

  // The precedence rule. `signed` derives from the pinned key, sideloaded from source_repo
  // — so they are NOT mutually exclusive in the data, and a sideloaded plugin genuinely has
  // no key. Rendering "Unsigned" NEXT TO "Sideloaded" would double up on a plugin whose
  // badge already says something strictly stronger, diluting the amber into wallpaper.
  it('FE-COMP-PLUGINS-SIG-003: a sideloaded plugin shows Sideloaded and NO trust badge', async () => {
    mockPanel(plugin({ source_repo: 'local:upload', signed: false }))
    render(<AdminPluginsPanel />)
    expect(await screen.findByText('Sideloaded')).toBeInTheDocument()
    expect(screen.queryByText('Unsigned')).not.toBeInTheDocument()
    expect(screen.queryByText('Signed')).not.toBeInTheDocument()
  })

  it('FE-COMP-PLUGINS-SIG-004: a dev-linked plugin shows Dev-Link and NO trust badge', async () => {
    mockPanel(plugin({ source_repo: 'local:link', signed: false }))
    render(<AdminPluginsPanel />)
    expect(await screen.findByText('Dev-Link')).toBeInTheDocument()
    expect(screen.queryByText('Unsigned')).not.toBeInTheDocument()
  })
})

describe('AdminPluginsPanel — a refused update', () => {
  const blocked = (code: string) =>
    plugin({
      source_repo: 'acme/gotify', signed: true, keyFingerprint: 'OLDKEYaa…aaaaaaaa',
      updateBlock: { code, detail: 'the signing key changed', version: '2.0.0' },
    })

  it('FE-COMP-PLUGINS-SIG-005: the row keeps showing WHY, instead of the reason dying with a toast', async () => {
    mockPanel(blocked('SIGNATURE_KEY_CHANGED'))
    render(<AdminPluginsPanel />)
    expect(await screen.findByText(/update blocked/i)).toBeInTheDocument()
  })

  // The block describes the version that was REFUSED. Once the registry offers a newer one,
  // it describes an artifact nobody is being offered anymore — so it reads as stale and the
  // admin can simply re-attempt.
  it('FE-COMP-PLUGINS-SIG-006: the block goes quiet once a NEWER version is on offer', async () => {
    mockPanel(blocked('SIGNATURE_KEY_CHANGED'), registryEntry({ latest: '3.0.0' }))
    render(<AdminPluginsPanel />)
    await screen.findByText('Gotify')
    await waitFor(() => expect(screen.queryByText(/update blocked/i)).not.toBeInTheDocument())
  })

  it('FE-COMP-PLUGINS-SIG-007: Review opens the re-trust dialog for a ROTATED key', async () => {
    mockPanel(blocked('SIGNATURE_KEY_CHANGED'))
    render(<AdminPluginsPanel />)
    fireEvent.click(await screen.findByRole('button', { name: /review/i }))

    // Both fingerprints, so the admin can compare them against what the author tells them.
    expect(await screen.findByText(/key it was installed with/i)).toBeInTheDocument()
    expect(screen.getByText(/key it is offering now/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /trust the new key/i })).toBeInTheDocument()
  })

  // D2, at the UI. An invalid signature means the bytes are not what the author signed.
  // There is no override — not a disabled button, not one behind a confirm. The ABSENCE of
  // an escape hatch is the feature. (The server refuses it too; this is belt and braces.)
  it('FE-COMP-PLUGINS-SIG-008: an INVALID signature offers NO re-trust affordance at all', async () => {
    mockPanel(blocked('SIGNATURE_INVALID'))
    render(<AdminPluginsPanel />)
    fireEvent.click(await screen.findByRole('button', { name: /review/i }))

    await screen.findByText(/do not match the author's signature/i)
    expect(screen.queryByRole('button', { name: /trust the new key/i })).not.toBeInTheDocument()
    // ...and it does not even show the key comparison, which would imply a choice exists.
    expect(screen.queryByText(/key it is offering now/i)).not.toBeInTheDocument()
  })

  it('FE-COMP-PLUGINS-SIG-009: an unsigned-downgrade refusal offers no override either', async () => {
    mockPanel(blocked('SIGNATURE_MISSING'))
    render(<AdminPluginsPanel />)
    fireEvent.click(await screen.findByRole('button', { name: /review/i }))

    await screen.findByText(/ships no signature/i)
    expect(screen.queryByRole('button', { name: /trust the new key/i })).not.toBeInTheDocument()
  })

  it('FE-COMP-PLUGINS-SIG-010: confirming a re-trust re-pins AND updates in ONE call', async () => {
    let body: unknown = null
    mockPanel(blocked('SIGNATURE_KEY_CHANGED'))
    server.use(
      http.post('*/api/admin/plugins/trek-gotify/retrust', async ({ request }) => {
        body = await request.json()
        return HttpResponse.json({ version: '2.0.0', activated: true, newPermissions: [], newEgress: [] })
      }),
    )
    render(<AdminPluginsPanel />)
    fireEvent.click(await screen.findByRole('button', { name: /review/i }))
    fireEvent.click(await screen.findByRole('button', { name: /trust the new key/i }))

    // The FULL key goes back, not the fingerprint: the server's equality check is exact, so
    // it can refuse if the entry was re-keyed again since this dialog rendered.
    await waitFor(() =>
      expect(body).toEqual({ version: '2.0.0', publicKey: 'NEWKEYbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb' }),
    )
    // No follow-up /update: a re-pin that waited for a second call would leave the plugin
    // pinned to a key no install had ever verified against if that call never came.
  })
})

describe('AdminPluginsPanel — update consent', () => {
  it('FE-COMP-PLUGINS-SIG-011: says an unsigned update is untied to its author, and still activates in one click', async () => {
    let activated = false
    mockPanel(plugin({ source_repo: 'acme/gotify', signed: false }), registryEntry({ signed: false }))
    server.use(
      http.post('*/api/admin/plugins/trek-gotify/update', () =>
        HttpResponse.json({ version: '2.0.0', activated: false, newPermissions: ['db:read:trips'], newEgress: [] }),
      ),
      http.post('*/api/admin/plugins/trek-gotify/activate', () => { activated = true; return HttpResponse.json({ status: 'active' }) }),
    )
    render(<AdminPluginsPanel />)
    await screen.findByText('Gotify')
    fireEvent.click(await screen.findByRole('button', { name: /update to|2\.0\.0/i }))

    // Informs — it does not block. No checkbox, no second click.
    expect(await screen.findByText(/nothing ties this version to its author/i)).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: /approve & turn on/i }))
    await waitFor(() => expect(activated).toBe(true))
  })

  // The warning used to be read ONLY off the registry entry, so an unreachable registry left
  // it undefined and the pill silently vanished — at the exact moment the admin was widening
  // what unsigned code may do. The installed row carries an authoritative `signed` from the
  // server on every list call; degrade to that rather than to silence.
  //
  // Consent is reached here by turning a plugin back ON after an update widened its
  // permissions (409 CONSENT_REQUIRED) — which is the path that still works with the registry
  // down, precisely because it needs nothing from the registry.
  it('FE-COMP-PLUGINS-SIG-015: the unsigned warning survives an unreachable registry', async () => {
    server.use(
      http.get('*/api/admin/plugins', () =>
        HttpResponse.json({
          enabled: true, devLink: false,
          plugins: [plugin({ source_repo: 'acme/gotify', signed: false, enabled: 0, status: 'inactive', operatorEgress: false })],
        })),
      // The registry is down: `regById` stays empty, so the entry's `signed` is unknowable.
      http.get('*/api/admin/plugins/registry', () => HttpResponse.json({ error: 'registry unreachable' }, { status: 500 })),
      http.post('*/api/admin/plugins/trek-gotify/activate', () =>
        HttpResponse.json({ error: 'consent required', code: 'CONSENT_REQUIRED', newPermissions: ['db:read:trips'], newEgress: [] }, { status: 409 })),
    )
    render(<AdminPluginsPanel />)
    fireEvent.click(await screen.findByRole('button', { name: /enable plugin/i }))

    // Falls back to the installed row's `signed: false` rather than going quiet.
    expect(await screen.findByText(/nothing ties this version to its author/i)).toBeInTheDocument()
  })
})

/**
 * A signature refusal must reach the dialog even when the plugin has NO installed row —
 * which is every fresh install from Discover, and every dependency being downloaded.
 *
 * Routing the refusal off the installed list meant those two paths silently fell back to a
 * generic toast: the admin met SIGNATURE_INVALID for the first time on the one path where the
 * dialog explaining it never opened. A fresh install has no pinned key, so it can only ever
 * be _INVALID / _INCOMPLETE — never a rotation — and both are non-overridable, so the dialog
 * must explain and offer nothing.
 */
describe('AdminPluginsPanel — a refusal with no installed row', () => {
  it('FE-COMP-PLUGINS-SIG-013: a fresh install refused for an INVALID signature opens the dialog, not a toast', async () => {
    server.use(
      http.get('*/api/admin/plugins', () => HttpResponse.json({ enabled: true, devLink: false, plugins: [] })),
      http.get('*/api/admin/plugins/registry', () => HttpResponse.json([registryEntry()])),
      http.post('*/api/admin/plugins/install', () =>
        HttpResponse.json({ error: 'author signature verification failed', code: 'SIGNATURE_INVALID' }, { status: 400 })),
    )
    render(<AdminPluginsPanel />)
    fireEvent.click(await screen.findByRole('button', { name: /discover/i }))
    fireEvent.click(await screen.findByRole('button', { name: /^install$/i }))

    // The dialog, named after the plugin — which it can only know from the REGISTRY entry,
    // there being no installed row to read a name off.
    expect(await screen.findByText(/gotify's signature could not be verified/i)).toBeInTheDocument()
    await screen.findByText(/do not match the author's signature/i)
    // Non-overridable, and no key comparison — showing one would imply a choice exists.
    expect(screen.queryByRole('button', { name: /trust the new key/i })).not.toBeInTheDocument()
    expect(screen.queryByText(/key it is offering now/i)).not.toBeInTheDocument()
  })

  it('FE-COMP-PLUGINS-SIG-014: a refusal while downloading a DEPENDENCY opens the dialog too', async () => {
    const parent = plugin({ id: 'trek-parent', name: 'Parent', source_repo: 'acme/parent', enabled: 0, status: 'inactive', operatorEgress: false })
    server.use(
      http.get('*/api/admin/plugins', () => HttpResponse.json({ enabled: true, devLink: false, plugins: [parent] })),
      http.get('*/api/admin/plugins/registry', () => HttpResponse.json([registryEntry()])),
      // Turning it on reveals the missing dependency…
      http.post('*/api/admin/plugins/trek-parent/activate', () =>
        HttpResponse.json({ error: 'missing dependency', code: 'DEPENDENCY_MISSING', missing: [{ id: 'trek-gotify', version: '^1.0.0' }], versionMismatch: [] }, { status: 409 })),
      // …and downloading it is refused on its signature.
      http.post('*/api/admin/plugins/install', () =>
        HttpResponse.json({ error: 'author signature verification failed', code: 'SIGNATURE_INVALID' }, { status: 400 })),
    )
    render(<AdminPluginsPanel />)
    fireEvent.click(await screen.findByRole('button', { name: /enable plugin/i }))
    fireEvent.click(await screen.findByRole('button', { name: /download/i }))

    // Named after the DEPENDENCY, not the parent — it is the dependency's author whose
    // signature did not verify, and saying "Parent" here would point the admin at the wrong
    // plugin entirely.
    expect(await screen.findByText(/gotify's signature could not be verified/i)).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /trust the new key/i })).not.toBeInTheDocument()
  })
})

describe('AdminPluginsPanel — a block never outlives the registry relationship', () => {
  // The server clears the block on sideload/dev-link. This is the belt: even if a stale
  // block somehow reached the client, a plugin whose code the admin supplied by hand must
  // never claim an update was blocked over an author signing key.
  it('FE-COMP-PLUGINS-SIG-012: a sideloaded plugin never shows an update block', async () => {
    mockPanel(plugin({
      source_repo: 'local:upload', signed: false,
      updateBlock: { code: 'SIGNATURE_KEY_CHANGED', detail: 'the signing key changed', version: '2.0.0' },
    }))
    render(<AdminPluginsPanel />)
    await screen.findByText('Sideloaded')
    expect(screen.queryByText(/update blocked/i)).not.toBeInTheDocument()
  })
})

/**
 * TREK-version compatibility. The SERVER owns the semver — a second implementation in the
 * browser would eventually disagree with the install gate and offer a button that 400s —
 * so the panel only renders the verdict the API hands it (`compatible`, `latestCompatible`).
 */
describe('AdminPluginsPanel — TREK-version compatibility', () => {
  /** Discover cards for a plugin that is NOT installed — an installed one just reads "Installed". */
  async function openDiscover(entry: Record<string, unknown>) {
    mockPanel(plugin({ id: 'something-else' }), registryEntry(entry))
    render(<AdminPluginsPanel />)
    fireEvent.click(await screen.findByText('Discover'))
  }

  it('blocks Install when no published version runs on this TREK, and says why', async () => {
    await openDiscover({ trek: '>=4.0.0', hostVersion: '3.3.0', compatible: false, latestCompatible: null })
    const btn = await screen.findByRole('button', { name: /^incompatible$/i })
    expect(btn).toBeDisabled()
  })

  it('offers the newest version that DOES run here rather than a dead button', async () => {
    await openDiscover({ latest: '2.0.0', trek: '>=3.4.0', hostVersion: '3.3.0', compatible: false, latestCompatible: '1.5.0' })
    const btn = await screen.findByRole('button', { name: /^install 1\.5\.0$/i })
    expect(btn).toBeEnabled()
  })

  it('installs normally when the latest version fits', async () => {
    await openDiscover({ trek: '>=3.2.0 <4.0.0', hostVersion: '3.3.0', compatible: true, latestCompatible: '2.0.0' })
    expect(await screen.findByRole('button', { name: /^install$/i })).toBeEnabled()
  })

  it('an installed plugin the server has outgrown shows the blocker on its card', async () => {
    // Same amber chip machinery as a disabled addon / missing dependency — the admin sees
    // one "here is why this cannot turn on" surface, not a new concept per blocker.
    mockPanel(plugin({
      dependencyStatus: 'hostIncompatible', trekRange: '>=3.2.0 <4.0.0', hostVersion: '4.0.0', enabled: 0, status: 'inactive',
    }))
    render(<AdminPluginsPanel />)
    expect(await screen.findByText(/needs trek >=3\.2\.0 <4\.0\.0/i)).toBeInTheDocument()
  })
})
