// FE-DAWARICH-ATLASDLG-001 to FE-DAWARICH-ATLASDLG-029
/**
 * The room where Dawarich's two Atlas questions get answered.
 *
 * Nothing in here runs on its own, and that is the whole design: the Atlas is a
 * curated list that carries tombstones precisely so a country somebody removed
 * stays removed, so every read and every write starts with a person pressing a
 * button. What is worth pinning is therefore not "does it fetch" but everything
 * arranged around the fetch.
 *
 *  - **What is written, and dated when.** A wish is ticked off on the day it was
 *    reached, not on today, and wishes reached on the same day travel in one
 *    request. A regression here either back-dates somebody's list wrongly or
 *    turns one confirmation into twenty requests.
 *  - **The five states each half can be in.** Unasked, in flight, answered,
 *    answered with nothing, answered with caveats. The confirm button is
 *    rendered or absent rather than merely greyed out, so each state has to
 *    decide whether that control exists at all, and the caveats under the list
 *    are only said when there is something to say.
 *  - **Refusing to write blind.** Offline is not a server error: nothing was
 *    sent, and "something went wrong talking to Dawarich" for a train tunnel
 *    sends people hunting for a bug in their own instance.
 *  - **Both shells.** The phone gets an MSheet with its own footer, the desktop
 *    a Modal; the body between them is the same tree, so a regression that
 *    dropped one shell would otherwise only surface on a device.
 */
import React from 'react'
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, waitFor } from '../../../tests/helpers/render'
import { act, fireEvent } from '@testing-library/react'
import { setForcedOffline } from '../../sync/networkMode'
import { DawarichOfflineError } from '../../repo/dawarichRepo'
import DawarichAtlasDialog from './DawarichAtlasDialog'

const toast = { success: vi.fn(), error: vi.fn(), info: vi.fn(), warning: vi.fn() }
vi.mock('../shared/Toast', () => ({ useToast: () => toast, default: () => toast }))

const repo = {
  bucketScan: vi.fn(),
  atlasSuggestions: vi.fn(),
}
vi.mock('../../repo/dawarichRepo', () => ({
  dawarichRepo: {
    bucketScan: (...args: unknown[]) => repo.bucketScan(...args),
    atlasSuggestions: (...args: unknown[]) => repo.atlasSuggestions(...args),
  },
  DawarichOfflineError: class extends Error {},
}))

const api = {
  confirmBucketVisits: vi.fn(),
  acceptAtlasCountries: vi.fn(),
}
vi.mock('../../api/dawarich', () => ({
  dawarichApi: {
    confirmBucketVisits: (...args: unknown[]) => api.confirmBucketVisits(...args),
    acceptAtlasCountries: (...args: unknown[]) => api.acceptAtlasCountries(...args),
  },
}))

// The one thing the dialog reads about the device. A hoisted flag rather than a
// resize: useIsPhone is matchMedia-driven and the global stub always answers false.
const phone = vi.hoisted(() => ({ value: false }))
vi.mock('../../mobile/useIsPhone', () => ({ useIsPhone: () => phone.value }))

const SCAN = {
  matches: [
    {
      itemId: 11,
      name: 'Museum Ludwig',
      match: { at: '2026-09-10T14:00:00Z', minutes: 145, distanceMeters: 49, points: 60 },
      alreadyVisited: false,
    },
    {
      itemId: 12,
      name: 'Kölner Dom',
      match: { at: '2026-09-09T14:00:00Z', minutes: 30, distanceMeters: 80, points: 12 },
      alreadyVisited: true,
    },
    { itemId: 13, name: 'Rheinpark', match: null, alreadyVisited: false },
  ],
  skippedWithoutCoordinates: 2,
  truncated: false,
  fetchedAt: '2026-09-12T10:00:00Z',
}

const COUNTRIES = {
  countries: [
    { countryCode: 'DE', sourceName: 'Germany', cities: [{ name: 'Cologne', minutes: 400, lastSeenAt: '2026-09-10T10:00:00Z' }], alreadyVisited: true },
    { countryCode: 'NL', sourceName: 'Netherlands', cities: [{ name: 'Maastricht', minutes: 90, lastSeenAt: '2026-09-08T10:00:00Z' }], alreadyVisited: false },
  ],
  unresolved: ['Freedonia'],
  fetchedAt: '2026-09-12T10:00:00Z',
}

/**
 * Three wishes reached on two days. The pair sharing a timestamp is the whole
 * point of the fixture: the dialog groups by the date it is about to write, and
 * a regression that lost the grouping would send one request per wish. The
 * third one sits far enough away to be reported in kilometres rather than
 * metres, which is the other half of the row's arithmetic.
 */
const SAME_DAY = {
  matches: [
    {
      itemId: 21,
      name: 'Van Gogh Museum',
      match: { at: '2026-08-02T11:00:00Z', minutes: 95, distanceMeters: 30, points: 40 },
      alreadyVisited: false,
    },
    {
      itemId: 22,
      name: 'Rijksmuseum',
      match: { at: '2026-08-02T11:00:00Z', minutes: 120, distanceMeters: 55, points: 51 },
      alreadyVisited: false,
    },
    {
      itemId: 23,
      name: 'Kinderdijk',
      match: { at: '2026-07-30T09:00:00Z', minutes: 70, distanceMeters: 1400, points: 22 },
      alreadyVisited: false,
    },
  ],
  skippedWithoutCoordinates: 0,
  truncated: false,
  fetchedAt: '2026-09-12T10:00:00Z',
}

/**
 * A reading with nothing to apologise for: no unmatched names, one country with
 * more cities than fit beside a flag and one with none at all.
 */
const MORE_COUNTRIES = {
  countries: [
    {
      countryCode: 'FR',
      sourceName: 'France',
      cities: ['Paris', 'Lyon', 'Nice', 'Nantes'].map(name => ({
        name,
        minutes: 120,
        lastSeenAt: '2026-08-02T10:00:00Z',
      })),
      alreadyVisited: false,
    },
    { countryCode: 'BE', sourceName: 'Belgium', cities: [], alreadyVisited: false },
  ],
  unresolved: [],
  fetchedAt: '2026-09-12T10:00:00Z',
}

/** A promise this test settles by hand, to pin down what is on screen mid-flight. */
function deferred<T>() {
  let resolve!: (value: T) => void
  const promise = new Promise<T>(res => {
    resolve = res
  })
  return { promise, resolve }
}

function open(props: Partial<React.ComponentProps<typeof DawarichAtlasDialog>> = {}) {
  return render(<DawarichAtlasDialog isOpen onClose={vi.fn()} {...props} />)
}

beforeEach(() => {
  phone.value = false
  setForcedOffline(false)
  toast.success.mockReset()
  toast.error.mockReset()
  repo.bucketScan.mockReset().mockResolvedValue(SCAN)
  repo.atlasSuggestions.mockReset().mockResolvedValue(COUNTRIES)
  api.confirmBucketVisits.mockReset().mockResolvedValue({ updated: 1 })
  api.acceptAtlasCountries.mockReset().mockResolvedValue({ marked: 1 })
})

// Force-offline is module state, not component state: left on, it would leak
// into the next file's writes.
afterEach(() => setForcedOffline(false))

describe('DawarichAtlasDialog', () => {
  it('FE-DAWARICH-ATLASDLG-001: asks nothing on its own — the scan runs when the reader says so', () => {
    open()
    expect(repo.bucketScan).not.toHaveBeenCalled()
    expect(screen.getByRole('button', { name: 'Check wishlist' })).toBeInTheDocument()
  })

  it('FE-DAWARICH-ATLASDLG-002: offers no confirmation before there is anything to confirm', () => {
    open()
    // Hidden until a result is on screen rather than merely disabled: a greyed
    // out "Tick off 0" is a dead control asking to be understood, and `hidden`
    // keeps it out of the accessibility tree too.
    expect(screen.queryByRole('button', { name: /Tick off/ })).toBeNull()
  })

  it('FE-DAWARICH-ATLASDLG-003: a scan lists what it found, with the distance, the time and the day', async () => {
    open()
    fireEvent.click(screen.getByRole('button', { name: 'Check wishlist' }))

    await waitFor(() => expect(screen.getByRole('checkbox', { name: 'Museum Ludwig' })).toBeInTheDocument())
    const row = screen.getByRole('checkbox', { name: 'Museum Ludwig' })
    expect(row.textContent).toContain('49 m away')
    expect(row.textContent).toContain('2 h 25 min')
    // A wish with no match at all is not a row — there is nothing to decide.
    expect(screen.queryByRole('checkbox', { name: 'Rheinpark' })).not.toBeInTheDocument()
  })

  it('FE-DAWARICH-ATLASDLG-004: open wishes start selected, already ticked ones do not', async () => {
    open()
    fireEvent.click(screen.getByRole('button', { name: 'Check wishlist' }))

    await waitFor(() => expect(screen.getByRole('checkbox', { name: 'Museum Ludwig' })).toBeInTheDocument())
    expect(screen.getByRole('checkbox', { name: 'Museum Ludwig' })).toHaveAttribute('aria-checked', 'true')
    expect(screen.getByRole('checkbox', { name: 'Kölner Dom' })).toHaveAttribute('aria-checked', 'false')
    expect(screen.getByRole('checkbox', { name: 'Kölner Dom' })).toBeDisabled()
  })

  it('FE-DAWARICH-ATLASDLG-005: unticking a row takes it out of what gets written', async () => {
    open()
    fireEvent.click(screen.getByRole('button', { name: 'Check wishlist' }))
    await waitFor(() => expect(screen.getByRole('checkbox', { name: 'Museum Ludwig' })).toBeInTheDocument())

    fireEvent.click(screen.getByRole('checkbox', { name: 'Museum Ludwig' }))

    expect(screen.getByRole('button', { name: /Tick off 0/ })).toBeDisabled()
  })

  it('FE-DAWARICH-ATLASDLG-006: confirming writes exactly the picked wishes and reports back', async () => {
    const onChanged = vi.fn()
    open({ onChanged })
    fireEvent.click(screen.getByRole('button', { name: 'Check wishlist' }))
    await waitFor(() => expect(screen.getByRole('checkbox', { name: 'Museum Ludwig' })).toBeInTheDocument())

    fireEvent.click(screen.getByRole('button', { name: /Tick off 1/ }))

    // With the date the stay was actually reached on — a wish from last year
    // ticked off with today's date is a wrong entry in a list people keep.
    await waitFor(() => expect(api.confirmBucketVisits).toHaveBeenCalledWith([11], '2026-09-10T14:00:00Z'))
    expect(onChanged).toHaveBeenCalled()
    // Marked in place rather than rescanned — one upstream request per wish is
    // not worth spending to tell the reader what they just did.
    await waitFor(() => expect(screen.getByRole('checkbox', { name: 'Museum Ludwig' })).toBeDisabled())
    expect(repo.bucketScan).toHaveBeenCalledTimes(1)
  })

  it('FE-DAWARICH-ATLASDLG-007: the countries tab offers only what the Atlas does not already have', async () => {
    open({ initialTab: 'countries' })
    fireEvent.click(screen.getByRole('button', { name: 'Look for countries' }))

    await waitFor(() => expect(screen.getByRole('checkbox', { name: 'Netherlands' })).toBeInTheDocument())
    expect(screen.queryByRole('checkbox', { name: 'Germany' })).not.toBeInTheDocument()
    // A country Dawarich named but TREK could not code is said out loud, not dropped.
    expect(screen.getByText(/Freedonia/)).toBeInTheDocument()
  })

  it('FE-DAWARICH-ATLASDLG-008: confirming countries sends their codes', async () => {
    open({ initialTab: 'countries' })
    fireEvent.click(screen.getByRole('button', { name: 'Look for countries' }))
    await waitFor(() => expect(screen.getByRole('checkbox', { name: 'Netherlands' })).toBeInTheDocument())

    fireEvent.click(screen.getByRole('button', { name: /Add 1 countries/ }))

    await waitFor(() => expect(api.acceptAtlasCountries).toHaveBeenCalledWith(['NL']))
  })

  it('FE-DAWARICH-ATLASDLG-009: a scan that fails says so and leaves the dialog usable', async () => {
    repo.bucketScan.mockRejectedValue({ response: { data: { error: 'Dawarich rejected the API key.' } } })
    open()

    fireEvent.click(screen.getByRole('button', { name: 'Check wishlist' }))

    await waitFor(() => expect(toast.error).toHaveBeenCalledWith('Dawarich rejected the API key.'))
    expect(screen.getByRole('button', { name: 'Check wishlist' })).toBeInTheDocument()
  })

  it('FE-DAWARICH-ATLASDLG-010: while the recordings are being read there are placeholders and nothing to press', async () => {
    const scan = deferred<typeof SCAN>()
    repo.bucketScan.mockReturnValueOnce(scan.promise)
    open()

    fireEvent.click(screen.getByRole('button', { name: 'Check wishlist' }))

    expect(screen.getByText('Checking…')).toBeInTheDocument()
    expect(screen.queryByRole('checkbox')).toBeNull()
    // Neither control exists yet: there is nothing to confirm, and "check again"
    // before the first answer is a second request for the same thing.
    expect(screen.queryByRole('button', { name: /Tick off/ })).toBeNull()
    expect(screen.queryByRole('button', { name: 'Check again' })).toBeNull()

    await act(async () => {
      scan.resolve(SCAN)
    })
    await waitFor(() => expect(screen.getByRole('checkbox', { name: 'Museum Ludwig' })).toBeInTheDocument())
  })

  it('FE-DAWARICH-ATLASDLG-011: a scan that found nothing says so in a sentence and offers no confirmation', async () => {
    repo.bucketScan.mockResolvedValue({ ...SCAN, matches: [], skippedWithoutCoordinates: 0 })
    open()

    fireEvent.click(screen.getByRole('button', { name: 'Check wishlist' }))

    await waitFor(() =>
      expect(screen.getByText('Nothing on your wishlist turned up in your recordings.')).toBeInTheDocument(),
    )
    // Absent, not greyed out: a dead "Tick off 0" under an empty state only asks
    // to be understood.
    expect(screen.queryByRole('button', { name: /Tick off/ })).toBeNull()
    // The rule stays on screen, because it is the answer to "why did nothing
    // turn up": driving past a wish does not count as reaching it.
    expect(screen.getByText(/A wish counts as reached within 250 m and after 20 minutes/)).toBeInTheDocument()
  })

  it('FE-DAWARICH-ATLASDLG-012: the caveats under a scan are only said when there are any', async () => {
    repo.bucketScan.mockResolvedValue({ ...SCAN, skippedWithoutCoordinates: 0, truncated: true })
    open()

    fireEvent.click(screen.getByRole('button', { name: 'Check wishlist' }))

    await waitFor(() =>
      expect(screen.getByText('Only the first entries were checked. Run it again for the rest.')).toBeInTheDocument(),
    )
    // Nothing was skipped this time, so nothing is said about skipping: a
    // "0 entries have no coordinates" line is noise dressed as information.
    expect(screen.queryByText(/have no coordinates/)).toBeNull()
  })

  it('FE-DAWARICH-ATLASDLG-013: a country shows the first of its cities, one without any shows none', async () => {
    repo.atlasSuggestions.mockResolvedValue(MORE_COUNTRIES)
    open({ initialTab: 'countries' })

    fireEvent.click(screen.getByRole('button', { name: 'Look for countries' }))

    await waitFor(() => expect(screen.getByRole('checkbox', { name: 'France' })).toBeInTheDocument())
    const france = screen.getByRole('checkbox', { name: 'France' })
    // The badge counts all four; the line beside it names three, which is what
    // fits beside a flag at the width a phone gives this dialog.
    expect(france.textContent).toContain('4 cities')
    expect(france.textContent).toContain('Paris, Lyon, Nice')
    expect(france.textContent).not.toContain('Nantes')
    expect(screen.getByRole('checkbox', { name: 'Belgium' }).textContent).not.toContain('cities')
    // Everything matched, so the dialog does not mention matching at all.
    expect(screen.queryByText(/could not match these to a country/)).toBeNull()
    expect(screen.getByText('The last 12 months were looked at.')).toBeInTheDocument()
  })

  it('FE-DAWARICH-ATLASDLG-014: a reading with nothing new in it says so rather than showing an empty list', async () => {
    // Germany alone, and the Atlas already has it.
    repo.atlasSuggestions.mockResolvedValue({ ...COUNTRIES, countries: [COUNTRIES.countries[0]] })
    open({ initialTab: 'countries' })

    fireEvent.click(screen.getByRole('button', { name: 'Look for countries' }))

    await waitFor(() =>
      expect(screen.getByText('Your recordings show no countries TREK does not already have.')).toBeInTheDocument(),
    )
    expect(screen.queryByRole('button', { name: /Add \d+ countries/ })).toBeNull()
  })

  it('FE-DAWARICH-ATLASDLG-015: wishes reached on one day travel in one request, another day in its own', async () => {
    repo.bucketScan.mockResolvedValue(SAME_DAY)
    open()

    fireEvent.click(screen.getByRole('button', { name: 'Check wishlist' }))
    await waitFor(() => expect(screen.getByRole('checkbox', { name: 'Rijksmuseum' })).toBeInTheDocument())
    // Over a kilometre out is said in kilometres: "1400 m away" is a
    // measurement, "1.4 km away" is how far it was.
    expect(screen.getByRole('checkbox', { name: 'Kinderdijk' }).textContent).toContain('1.4 km away')

    fireEvent.click(screen.getByRole('button', { name: /Tick off 3/ }))

    await waitFor(() => expect(api.confirmBucketVisits).toHaveBeenCalledTimes(2))
    // Grouped by date, not ordered by it: the row order inside a day is the
    // sort's business and nothing here depends on it.
    const calls = api.confirmBucketVisits.mock.calls as Array<[number[], string]>
    const byDate = new Map(calls.map(([ids, at]) => [at, [...ids].sort((a, b) => a - b)]))
    expect(byDate.get('2026-08-02T11:00:00Z')).toEqual([21, 22])
    expect(byDate.get('2026-07-30T09:00:00Z')).toEqual([23])
    // Both answers counted, not just the last one to come back.
    expect(toast.success).toHaveBeenCalledWith('2 wishes ticked off')
  })

  it('FE-DAWARICH-ATLASDLG-016: an unticked wish is left out of the write entirely', async () => {
    repo.bucketScan.mockResolvedValue(SAME_DAY)
    open()

    fireEvent.click(screen.getByRole('button', { name: 'Check wishlist' }))
    await waitFor(() => expect(screen.getByRole('checkbox', { name: 'Kinderdijk' })).toBeInTheDocument())

    fireEvent.click(screen.getByRole('checkbox', { name: 'Kinderdijk' }))
    fireEvent.click(screen.getByRole('checkbox', { name: 'Rijksmuseum' }))
    fireEvent.click(screen.getByRole('button', { name: /Tick off 1/ }))

    // One request, for one day, carrying one id. The day whose other wish was
    // dropped does not travel half-empty, and the other day does not travel at all.
    await waitFor(() => expect(api.confirmBucketVisits).toHaveBeenCalledTimes(1))
    expect(api.confirmBucketVisits).toHaveBeenCalledWith([21], '2026-08-02T11:00:00Z')
  })

  it('FE-DAWARICH-ATLASDLG-017: a row that was unticked can be put back', async () => {
    open()
    fireEvent.click(screen.getByRole('button', { name: 'Check wishlist' }))
    await waitFor(() => expect(screen.getByRole('checkbox', { name: 'Museum Ludwig' })).toBeInTheDocument())

    fireEvent.click(screen.getByRole('checkbox', { name: 'Museum Ludwig' }))
    expect(screen.getByRole('checkbox', { name: 'Museum Ludwig' })).toHaveAttribute('aria-checked', 'false')

    fireEvent.click(screen.getByRole('checkbox', { name: 'Museum Ludwig' }))

    expect(screen.getByRole('checkbox', { name: 'Museum Ludwig' })).toHaveAttribute('aria-checked', 'true')
    expect(screen.getByRole('button', { name: /Tick off 1/ })).toBeEnabled()
  })

  it('FE-DAWARICH-ATLASDLG-018: offline, a wish confirmation is refused before anything is sent', async () => {
    open()
    fireEvent.click(screen.getByRole('button', { name: 'Check wishlist' }))
    await waitFor(() => expect(screen.getByRole('checkbox', { name: 'Museum Ludwig' })).toBeInTheDocument())

    setForcedOffline(true)
    fireEvent.click(screen.getByRole('button', { name: /Tick off 1/ }))

    expect(toast.error).toHaveBeenCalledWith(expect.stringContaining('TREK is offline right now'))
    // Not attempted at all: a confirmation fired into a dead connection hangs to
    // a timeout and then reports a server error for something no server saw.
    expect(api.confirmBucketVisits).not.toHaveBeenCalled()
    // And the selection survives, so pressing it again once there is signal is enough.
    expect(screen.getByRole('button', { name: /Tick off 1/ })).toBeEnabled()
  })

  it('FE-DAWARICH-ATLASDLG-019: offline, a country confirmation is refused before anything is sent', async () => {
    open({ initialTab: 'countries' })
    fireEvent.click(screen.getByRole('button', { name: 'Look for countries' }))
    await waitFor(() => expect(screen.getByRole('checkbox', { name: 'Netherlands' })).toBeInTheDocument())

    setForcedOffline(true)
    fireEvent.click(screen.getByRole('button', { name: /Add 1 countries/ }))

    expect(toast.error).toHaveBeenCalledWith(expect.stringContaining('TREK is offline right now'))
    expect(api.acceptAtlasCountries).not.toHaveBeenCalled()
  })

  it('FE-DAWARICH-ATLASDLG-020: a write that failed leaves every row exactly as it was', async () => {
    // A rejection with no `{ error }` envelope at all: a socket that died
    // mid-request rather than a server that answered.
    api.confirmBucketVisits.mockRejectedValue(new Error('socket hang up'))
    const onChanged = vi.fn()
    open({ onChanged })

    fireEvent.click(screen.getByRole('button', { name: 'Check wishlist' }))
    await waitFor(() => expect(screen.getByRole('checkbox', { name: 'Museum Ludwig' })).toBeInTheDocument())
    fireEvent.click(screen.getByRole('button', { name: /Tick off 1/ }))

    await waitFor(() => expect(toast.error).toHaveBeenCalledWith('Something went wrong talking to Dawarich.'))
    // Nothing was marked off locally, so a second attempt still has something to
    // send, and the Atlas is not asked to re-read for a write that never landed.
    expect(screen.getByRole('checkbox', { name: 'Museum Ludwig' })).toHaveAttribute('aria-checked', 'true')
    expect(screen.getByRole('checkbox', { name: 'Museum Ludwig' })).toBeEnabled()
    expect(onChanged).not.toHaveBeenCalled()
  })

  it('FE-DAWARICH-ATLASDLG-021: a refusal carrying no readable reason still gets a sentence', async () => {
    // An `{ error }` that is not a string is not a message: falling through to
    // the generic sentence beats printing "[object Object]" at somebody.
    api.acceptAtlasCountries.mockRejectedValue({ response: { data: { error: { code: 502 } } } })
    open({ initialTab: 'countries' })

    fireEvent.click(screen.getByRole('button', { name: 'Look for countries' }))
    await waitFor(() => expect(screen.getByRole('checkbox', { name: 'Netherlands' })).toBeInTheDocument())
    fireEvent.click(screen.getByRole('button', { name: /Add 1 countries/ }))

    await waitFor(() => expect(toast.error).toHaveBeenCalledWith('Something went wrong talking to Dawarich.'))
    expect(screen.getByRole('checkbox', { name: 'Netherlands' })).toHaveAttribute('aria-checked', 'true')
  })

  it('FE-DAWARICH-ATLASDLG-022: a read that never left the device reads as a connection, not a failure', async () => {
    // The repo refuses offline reads itself, and its refusal has to survive the
    // trip through failureText as the connection message rather than as
    // "something went wrong talking to Dawarich", which points at the instance.
    repo.atlasSuggestions.mockRejectedValue(new DawarichOfflineError())
    open({ initialTab: 'countries' })

    fireEvent.click(screen.getByRole('button', { name: 'Look for countries' }))

    await waitFor(() =>
      expect(toast.error).toHaveBeenCalledWith(expect.stringContaining('TREK is offline right now')),
    )
    // Still unasked, so the button that asks is the one on screen.
    expect(screen.getByRole('button', { name: 'Look for countries' })).toBeInTheDocument()
  })

  it('FE-DAWARICH-ATLASDLG-023: the other tab asks the other question, and each keeps its own answer', async () => {
    open()
    fireEvent.click(screen.getByRole('button', { name: 'Check wishlist' }))
    await waitFor(() => expect(screen.getByRole('checkbox', { name: 'Museum Ludwig' })).toBeInTheDocument())

    fireEvent.click(screen.getByRole('button', { name: /Countries/ }))

    // Switching tabs asks nothing on its own: a country reading costs an
    // upstream request, and nobody asked for it by moving their eyes.
    expect(repo.atlasSuggestions).not.toHaveBeenCalled()
    fireEvent.click(screen.getByRole('button', { name: 'Look for countries' }))
    await waitFor(() => expect(screen.getByRole('checkbox', { name: 'Netherlands' })).toBeInTheDocument())

    fireEvent.click(screen.getByRole('button', { name: /Wishlist/ }))

    // The scan is still there, and was not repeated for the return trip.
    expect(screen.getByRole('checkbox', { name: 'Museum Ludwig' })).toBeInTheDocument()
    expect(repo.bucketScan).toHaveBeenCalledTimes(1)
  })

  it('FE-DAWARICH-ATLASDLG-024: "Check again" re-runs the scan and is inert while it runs', async () => {
    open()
    fireEvent.click(screen.getByRole('button', { name: 'Check wishlist' }))
    await waitFor(() => expect(screen.getByRole('checkbox', { name: 'Museum Ludwig' })).toBeInTheDocument())

    const second = deferred<typeof SCAN>()
    repo.bucketScan.mockReturnValueOnce(second.promise)
    fireEvent.click(screen.getByRole('button', { name: 'Check again' }))

    // A second press while the first is in flight would run the whole scan twice:
    // one upstream request per wish, for the same answer.
    expect(screen.getByRole('button', { name: 'Check again' })).toBeDisabled()

    await act(async () => {
      second.resolve(SCAN)
    })

    await waitFor(() => expect(screen.getByRole('button', { name: 'Check again' })).toBeEnabled())
    expect(repo.bucketScan).toHaveBeenCalledTimes(2)
  })

  it('FE-DAWARICH-ATLASDLG-025: "Check again" on the countries tab re-reads the countries, not the wishes', async () => {
    open({ initialTab: 'countries' })
    fireEvent.click(screen.getByRole('button', { name: 'Look for countries' }))
    await waitFor(() => expect(screen.getByRole('checkbox', { name: 'Netherlands' })).toBeInTheDocument())

    fireEvent.click(screen.getByRole('button', { name: 'Check again' }))

    await waitFor(() => expect(repo.atlasSuggestions).toHaveBeenCalledTimes(2))
    expect(repo.bucketScan).not.toHaveBeenCalled()
    // A year back from the moment it was asked, both times: the window is the
    // same question asked again, not a widening one.
    const calls = repo.atlasSuggestions.mock.calls as Array<[string, string]>
    for (const [from, to] of calls) {
      expect(Date.parse(to) - Date.parse(from)).toBe(365 * 24 * 60 * 60 * 1000)
    }
    expect(Date.parse(calls[1][0])).toBeGreaterThanOrEqual(Date.parse(calls[0][0]))
  })

  it('FE-DAWARICH-ATLASDLG-026: on a phone it is a sheet, and the count and the confirm live in its own footer', async () => {
    phone.value = true
    const onClose = vi.fn()
    open({ onClose })

    expect(screen.getByRole('dialog', { name: 'Dawarich' })).toBeInTheDocument()
    // The desktop modal puts the title in a heading: its absence is the tell
    // that the right shell rendered.
    expect(screen.queryByRole('heading', { name: /Dawarich/ })).toBeNull()

    fireEvent.click(screen.getByRole('button', { name: 'Check wishlist' }))
    await waitFor(() => expect(screen.getByRole('checkbox', { name: 'Museum Ludwig' })).toBeInTheDocument())

    expect(screen.getByText('1 selected')).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: /Tick off 1/ }))
    await waitFor(() => expect(api.confirmBucketVisits).toHaveBeenCalledWith([11], '2026-09-10T14:00:00Z'))

    fireEvent.click(screen.getByRole('button', { name: 'Close' }))
    expect(onClose).toHaveBeenCalled()
  })

  it('FE-DAWARICH-ATLASDLG-027: a country that was just added stops being offered, and the Atlas is told', async () => {
    const onChanged = vi.fn()
    open({ initialTab: 'countries', onChanged })

    fireEvent.click(screen.getByRole('button', { name: 'Look for countries' }))
    await waitFor(() => expect(screen.getByRole('checkbox', { name: 'Netherlands' })).toBeInTheDocument())

    fireEvent.click(screen.getByRole('button', { name: /Add 1 countries/ }))

    await waitFor(() => expect(toast.success).toHaveBeenCalledWith('1 countries added'))
    // Marked in place rather than re-read: the reading costs an upstream request
    // and the only thing that changed is what the reader just pressed. The row
    // leaving the list is what says the write landed.
    await waitFor(() =>
      expect(screen.getByText('Your recordings show no countries TREK does not already have.')).toBeInTheDocument(),
    )
    expect(screen.queryByRole('checkbox', { name: 'Netherlands' })).toBeNull()
    expect(screen.queryByRole('button', { name: /Add \d+ countries/ })).toBeNull()
    expect(repo.atlasSuggestions).toHaveBeenCalledTimes(1)
    // The Atlas keeps its own map and its own counts; without this the country
    // it was just told about only appears there after a reload.
    expect(onChanged).toHaveBeenCalledTimes(1)
  })

  it('FE-DAWARICH-ATLASDLG-028: a request that died without a reason at all still gets a sentence', async () => {
    // An aborted request rejects with nothing: not an Error, not a response.
    // Reaching into `.response.data` on that must not be the thing that takes
    // the dialog down, because a crash here loses the scan the reader is
    // looking at as well as the message they needed.
    repo.bucketScan.mockRejectedValue(undefined)
    open()

    fireEvent.click(screen.getByRole('button', { name: 'Check wishlist' }))

    await waitFor(() => expect(toast.error).toHaveBeenCalledWith('Something went wrong talking to Dawarich.'))
    expect(screen.getByRole('button', { name: 'Check wishlist' })).toBeInTheDocument()
  })

  it('FE-DAWARICH-ATLASDLG-029: a country can be unticked and put back, and only the ticked ones are written', async () => {
    // Both offers start ticked, which is the useful default but not the answer
    // every time: a border crossed on the way to somewhere else is a country
    // Dawarich saw and the reader does not want in their Atlas. Taking one out
    // has to actually take it out of the write, and changing one's mind has to
    // put it back, because the Atlas carries tombstones and an unwanted country
    // added here is removed by hand afterwards.
    repo.atlasSuggestions.mockResolvedValue(MORE_COUNTRIES)
    open({ initialTab: 'countries' })

    fireEvent.click(screen.getByRole('button', { name: 'Look for countries' }))
    await waitFor(() => expect(screen.getByRole('checkbox', { name: 'Belgium' })).toBeInTheDocument())
    expect(screen.getByRole('button', { name: /Add 2 countries/ })).toBeEnabled()

    fireEvent.click(screen.getByRole('checkbox', { name: 'Belgium' }))
    expect(screen.getByRole('checkbox', { name: 'Belgium' })).toHaveAttribute('aria-checked', 'false')

    // Out and back in again: the tick is a toggle, not a one-way door.
    fireEvent.click(screen.getByRole('checkbox', { name: 'France' }))
    expect(screen.getByRole('button', { name: /Add 0 countries/ })).toBeDisabled()
    fireEvent.click(screen.getByRole('checkbox', { name: 'France' }))
    expect(screen.getByRole('checkbox', { name: 'France' })).toHaveAttribute('aria-checked', 'true')

    fireEvent.click(screen.getByRole('button', { name: /Add 1 countries/ }))

    // Belgium was never sent, so nothing has to be undone in the Atlas after.
    await waitFor(() => expect(api.acceptAtlasCountries).toHaveBeenCalledWith(['FR']))
    await waitFor(() => expect(toast.success).toHaveBeenCalledWith('1 countries added'))
    // And it is still on offer, still unticked, for the trip it does belong to.
    expect(screen.getByRole('checkbox', { name: 'Belgium' })).toHaveAttribute('aria-checked', 'false')
  })
})
