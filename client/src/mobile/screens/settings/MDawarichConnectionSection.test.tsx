/**
 * MDawarichConnectionSection: FE-MOB-DAWARICH-001 to FE-MOB-DAWARICH-012.
 *
 * The phone twin of the desktop Dawarich card. It owns no behaviour at all:
 * `useDawarichConnection` holds every bit of it so the two shells cannot drift
 * apart and so a feature touching both does not spend the whole duplication
 * budget on a second copy of the connect / test / sync logic. What is left in
 * this file is the wiring, and the wiring is precisely what a self-hoster
 * notices when it breaks.
 *
 * Each of the states below is one such break:
 *
 *  - a Save or Test button that stays tappable while the request it starts is
 *    still in flight fires it a second time, and on a phone that is one
 *    mis-timed thumb away rather than a deliberate double click;
 *  - "Check now" or "Disconnect" offered before a connection exists asks the
 *    server to sync an instance it has no address for;
 *  - the key field advertising "Paste your Dawarich API key" while a key is
 *    already stored sends the reader back to Dawarich for a key TREK already
 *    has, and the hook reads anything typed there as a replacement, so the
 *    placeholder is the only signal that the field is empty on purpose;
 *  - the status block claiming "Connected" (or a last-sync time, or a server
 *    version) from stale state is the card lying about the one thing it exists
 *    to report.
 *
 * So the hook is mocked and the card is rendered against every state it can
 * return: the empty card, the three placeholder states of the key field, each
 * separate reason either button locks, the connected card with and without a
 * previous sync, a sync in flight, a failed one, and the version line that
 * appears only once a probe actually reported a version.
 */
import React from 'react'
import { describe, it, expect, vi } from 'vitest'
import type { DawarichCapabilities } from '@trek/shared'
import { render, screen, fireEvent } from '../../../../tests/helpers/render'
import { getLocaleForLanguage } from '../../../i18n'
import { useSettingsStore } from '../../../store/settingsStore'
import type { DawarichConnectionState } from '../../../hooks/useDawarichConnection'
import MDawarichConnectionSection from './MDawarichConnectionSection'

// The card reads the hook on every render, so swapping this module-level value
// and re-rendering is enough to walk it through a state the real hook would
// take an API round trip to reach.
let state: DawarichConnectionState

vi.mock('../../../hooks/useDawarichConnection', () => ({
  useDawarichConnection: () => state,
}))

/**
 * Defaults are the card as it looks once the settings read has come back and
 * found nothing: no address, no key, nothing connected, nothing in flight.
 * `canSave` is false because the real hook derives it from url + key/connection
 * and would say the same here.
 */
function makeState(over: Partial<DawarichConnectionState> = {}): DawarichConnectionState {
  return {
    url: '',
    setUrl: vi.fn(),
    apiKey: '',
    setApiKey: vi.fn(),
    allowInsecureTls: false,
    toggleInsecureTls: vi.fn(),
    syncEnabled: true,
    toggleSync: vi.fn(),
    connected: false,
    loading: false,
    saving: false,
    testing: false,
    syncing: false,
    lastSyncAt: null,
    lastSyncState: 'never',
    lastSyncError: null,
    capabilities: null,
    probeMessage: null,
    canSave: false,
    save: vi.fn(async () => {}),
    test: vi.fn(async () => {}),
    syncNow: vi.fn(async () => {}),
    disconnect: vi.fn(async () => {}),
    ...over,
  }
}

function renderCard(over: Partial<DawarichConnectionState> = {}) {
  state = makeState(over)
  const view = render(<MDawarichConnectionSection />)
  // Re-renders the same tree against a fresh hook return, the way the real card
  // moves from "idle" to "saving" without being unmounted in between.
  const show = (next: Partial<DawarichConnectionState>) => {
    state = makeState(next)
    view.rerender(<MDawarichConnectionSection />)
  }
  return { ...view, show }
}

const urlField = () => screen.getByLabelText('Instance address')
const keyField = () => screen.getByLabelText('API key')
const saveButton = () => screen.getByRole('button', { name: /Save/ })
const testButton = () => screen.getByRole('button', { name: /Test connection/ })
const syncButton = () => screen.getByRole('button', { name: /Check now/ })
const disconnectButton = () => screen.getByRole('button', { name: /Disconnect/ })

/**
 * A capability probe as 1.14.4 answers it: the two `visit*` flags are false
 * there, which is exactly why the shape carries flags rather than a version
 * comparison. `serverVersion` is the only field this card reads.
 */
const CAPABILITIES: DawarichCapabilities = {
  visits: true,
  tracks: true,
  points: true,
  locations: true,
  visitedCities: true,
  visitUpdatedAt: false,
  visitCountryCode: false,
  serverVersion: '1.14.4',
  probedAt: '2026-09-12T10:00:00Z',
}

describe('MDawarichConnectionSection', () => {
  it('FE-MOB-DAWARICH-001 claims nothing before a connection exists', () => {
    renderCard()

    expect(screen.getByText('Dawarich')).toBeInTheDocument()
    expect(screen.getByText(/Connect your own Dawarich instance/)).toBeInTheDocument()
    expect(screen.getByText('Not connected')).toBeInTheDocument()

    // Everything below only makes sense once an instance answered, so none of
    // it may be on screen while the card is empty.
    expect(screen.queryByRole('button', { name: /Check now/ })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /Disconnect/ })).not.toBeInTheDocument()
    expect(screen.queryByText('Not checked yet')).not.toBeInTheDocument()
    expect(screen.queryByText(/^Dawarich \d/)).not.toBeInTheDocument()

    // No address and no key: neither button has anything to send.
    expect(saveButton()).toBeDisabled()
    expect(testButton()).toBeDisabled()
  })

  it('FE-MOB-DAWARICH-002 hands every keystroke and tap straight to the shared hook', () => {
    renderCard({ url: 'https://dawarich.example.com', apiKey: 'abc', canSave: true })

    fireEvent.change(urlField(), { target: { value: 'https://tracks.example.com' } })
    expect(state.setUrl).toHaveBeenCalledWith('https://tracks.example.com')

    fireEvent.change(keyField(), { target: { value: 'new-key' } })
    expect(state.setApiKey).toHaveBeenCalledWith('new-key')

    // An address plus a typed key is the one combination that unlocks both.
    expect(saveButton()).toBeEnabled()
    expect(testButton()).toBeEnabled()

    fireEvent.click(saveButton())
    expect(state.save).toHaveBeenCalledTimes(1)

    fireEvent.click(testButton())
    expect(state.test).toHaveBeenCalledTimes(1)
  })

  it('FE-MOB-DAWARICH-003 masks the key field only while a stored key is untouched', () => {
    const { show } = renderCard({ connected: true, apiKey: '' })

    // Connected and the field blank means "a key is stored, we just never show
    // it again": the dots say so; the invitation to paste one would not.
    expect(keyField()).toHaveAttribute('placeholder', '••••••••')

    // The moment the reader types, the field is a replacement key again.
    show({ connected: true, apiKey: 'typed' })
    expect(keyField()).toHaveAttribute('placeholder', 'Paste your Dawarich API key')

    show({ connected: false, apiKey: '' })
    expect(keyField()).toHaveAttribute('placeholder', 'Paste your Dawarich API key')
  })

  it('FE-MOB-DAWARICH-004 locks Save for each of its three separate reasons', () => {
    const { show } = renderCard({ url: 'https://dawarich.example.com', canSave: true })
    expect(saveButton()).toBeEnabled()

    // A save already in flight: a second tap would send the settings twice.
    show({ url: 'https://dawarich.example.com', canSave: true, saving: true })
    expect(saveButton()).toBeDisabled()

    // The initial settings read has not come back, so the form does not yet
    // hold what the server has: saving now would overwrite it with blanks.
    show({ url: 'https://dawarich.example.com', canSave: true, loading: true })
    expect(saveButton()).toBeDisabled()

    // An address with neither a stored connection nor a typed key.
    show({ url: 'https://dawarich.example.com', canSave: false })
    expect(saveButton()).toBeDisabled()
  })

  it('FE-MOB-DAWARICH-005 locks Test for each of its three separate reasons', () => {
    const { show } = renderCard({ url: 'https://dawarich.example.com' })
    expect(testButton()).toBeEnabled()

    show({ url: 'https://dawarich.example.com', testing: true })
    expect(testButton()).toBeDisabled()

    show({ url: 'https://dawarich.example.com', loading: true })
    expect(testButton()).toBeDisabled()

    // Whitespace is not an address. Trimming here is what stops a probe of ''.
    show({ url: '   ' })
    expect(testButton()).toBeDisabled()
  })

  it('FE-MOB-DAWARICH-006 mirrors both switches and reports each tap back', () => {
    const { show } = renderCard({ syncEnabled: true, allowInsecureTls: false })

    const sync = screen.getByRole('switch', { name: 'Check for new stays automatically' })
    const tls = screen.getByRole('switch', { name: 'Allow self-signed certificate' })
    expect(sync).toHaveAttribute('aria-checked', 'true')
    expect(tls).toHaveAttribute('aria-checked', 'false')

    fireEvent.click(sync)
    expect(state.toggleSync).toHaveBeenCalledTimes(1)
    fireEvent.click(tls)
    expect(state.toggleInsecureTls).toHaveBeenCalledTimes(1)

    // Inverted, because a switch that renders the same in both positions is
    // the failure this assertion exists for.
    show({ syncEnabled: false, allowInsecureTls: true })
    expect(screen.getByRole('switch', { name: 'Check for new stays automatically' })).toHaveAttribute(
      'aria-checked',
      'false',
    )
    expect(screen.getByRole('switch', { name: 'Allow self-signed certificate' })).toHaveAttribute(
      'aria-checked',
      'true',
    )
  })

  it('FE-MOB-DAWARICH-007 offers Check now and Disconnect once connected, and says no sync has run', () => {
    const { container } = renderCard({ connected: true, lastSyncAt: null })

    expect(screen.getByText('Connected')).toBeInTheDocument()
    // Connected but never synced: "Last checked never" would read as a time.
    expect(screen.getByText('Not checked yet')).toBeInTheDocument()
    expect(container.querySelector('.animate-spin')).toBeNull()

    fireEvent.click(syncButton())
    expect(state.syncNow).toHaveBeenCalledTimes(1)

    expect(disconnectButton()).toBeEnabled()
    fireEvent.click(disconnectButton())
    expect(state.disconnect).toHaveBeenCalledTimes(1)
  })

  it('FE-MOB-DAWARICH-008 renders the last sync in the reader locale, never the raw timestamp', () => {
    const when = '2026-09-10T14:00:00Z'
    renderCard({ connected: true, lastSyncAt: when })

    // Computed the same way the card does (same locale, same formatter), so
    // the assertion holds in whatever timezone the runner sits in and survives
    // a change of default language. The whitespace collapse is not cosmetic:
    // Testing Library normalises the rendered text before comparing but leaves
    // the expected string alone, and ICU writes a narrow no-break space before
    // AM/PM on some builds, which the two sides would then never agree on.
    const locale = getLocaleForLanguage(useSettingsStore.getState().settings.language || 'en')
    const line = `Last checked ${new Date(when).toLocaleString(locale)}`.replace(/\s+/g, ' ')
    expect(screen.getByText(line)).toBeInTheDocument()
    expect(screen.queryByText(new RegExp(when))).not.toBeInTheDocument()
    expect(screen.queryByText('Not checked yet')).not.toBeInTheDocument()
  })

  it('FE-MOB-DAWARICH-009 spins the icon and locks Check now while a sync is running', () => {
    const { container } = renderCard({ connected: true, syncing: true })

    expect(syncButton()).toBeDisabled()
    expect(container.querySelector('.animate-spin')).toBeInTheDocument()
  })

  it('FE-MOB-DAWARICH-010 shows the probe result and the last sync error, the error marked as one', () => {
    const { show } = renderCard({
      connected: true,
      // Both lines at once on purpose: a successful probe does not clear the
      // error the last background sync left behind, and hiding one behind the
      // other would let a broken sync read as healthy.
      probeMessage: 'Could not reach Dawarich. (self-signed certificate)',
      lastSyncError: 'Dawarich refused the key.',
    })

    expect(screen.getByText('Could not reach Dawarich. (self-signed certificate)')).toBeInTheDocument()
    const error = screen.getByText('Dawarich refused the key.')
    expect(error.className).toContain('--m-st-danger')

    // And the state both lines matter most in is the one where there is no
    // connection: a probe that just failed leaves the card disconnected, so
    // folding either line into the `connected &&` block above would swallow the
    // only explanation the reader ever gets.
    show({
      connected: false,
      probeMessage: 'TREK could not reach that address. (ENOTFOUND)',
      lastSyncError: 'Dawarich rejected the API key.',
    })
    expect(screen.getByText('Not connected')).toBeInTheDocument()
    expect(screen.getByText('TREK could not reach that address. (ENOTFOUND)')).toBeInTheDocument()
    expect(screen.getByText('Dawarich rejected the API key.')).toBeInTheDocument()
  })

  it('FE-MOB-DAWARICH-011 names the server version only once a probe reported one', () => {
    const { show } = renderCard({ connected: true, capabilities: null })
    expect(screen.queryByText(/^Dawarich 1\.14\.4$/)).not.toBeInTheDocument()

    // A probe that ran against a build too old to send X-Dawarich-Version: the
    // capabilities are real, the version is not, and inventing one would be
    // worse than leaving the line out.
    show({ connected: true, capabilities: { ...CAPABILITIES, serverVersion: null } })
    expect(screen.queryByText(/^Dawarich 1\.14\.4$/)).not.toBeInTheDocument()

    show({ connected: true, capabilities: CAPABILITIES })
    expect(screen.getByText('Dawarich 1.14.4')).toBeInTheDocument()
  })

  it('FE-MOB-DAWARICH-012 locks Disconnect while a save is still in flight', () => {
    renderCard({ connected: true, saving: true })

    // Same `saving` flag as Save: disconnecting mid-save would race the write
    // it is about to undo.
    expect(disconnectButton()).toBeDisabled()
  })
})
