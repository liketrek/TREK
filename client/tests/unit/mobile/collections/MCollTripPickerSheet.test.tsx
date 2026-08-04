import type { ComponentProps } from 'react'
import { afterEach, beforeEach, describe, expect, it, vi, type Mock } from 'vitest'
import { fireEvent, render, screen, waitFor } from '../../../helpers/render'
import MCollTripPickerSheet from '../../../../src/mobile/screens/collections/MCollTripPickerSheet'
import { tripsApi } from '../../../../src/api/client'
import { useTranslation } from '../../../../src/i18n'

// FE-MOB-CTRIPP-001 to FE-MOB-CTRIPP-014

type Props = ComponentProps<typeof MCollTripPickerSheet>
type CopyResult = { copied: number; skipped: { id: number; name: string }[] }

const TRIPS = [
  { id: 1, title: 'Japan 2020', start_date: '2020-03-01', end_date: '2020-03-05', cover_image: '/uploads/covers/jp.jpg' },
  { id: 2, title: 'Weekend in Prague', start_date: null, end_date: null, cover_image: null },
  { id: 3, title: 'Open ended', start_date: '2020-03-01', end_date: null, cover_image: null },
]

function Harness(props: Omit<Props, 't'>) {
  const { t } = useTranslation()
  return <MCollTripPickerSheet {...props} t={t} />
}

type AddToast = NonNullable<Window['__addToast']>
let addToast: Mock<AddToast>

function setup(over: Partial<Props> = {}) {
  const onCopy = vi.fn<(id: number) => Promise<CopyResult>>().mockResolvedValue({ copied: 1, skipped: [] })
  const onClose = vi.fn()
  const props = { open: true, count: 1, onCopy, onClose, ...over }
  const view = render(<Harness {...props} />)
  return { ...view, onCopy, onClose, props }
}

describe('MCollTripPickerSheet', () => {
  beforeEach(() => {
    addToast = vi.fn<AddToast>()
    window.__addToast = addToast
    vi.spyOn(tripsApi, 'list').mockResolvedValue({ trips: TRIPS })
  })

  afterEach(() => {
    vi.restoreAllMocks()
    delete window.__addToast
  })

  it('FE-MOB-CTRIPP-001: a single place uses the plain title, several the counted one', async () => {
    const { rerender, props } = setup()
    expect(await screen.findByText('Japan 2020')).toBeInTheDocument()
    expect(screen.getByRole('dialog', { name: 'Copy to trip' })).toBeInTheDocument()

    rerender(<Harness {...props} count={4} />)
    expect(screen.getByRole('dialog', { name: 'Copy 4 to trip' })).toBeInTheDocument()
  })

  it('FE-MOB-CTRIPP-002: renders every trip with its cover and date range', async () => {
    setup()
    const row = await screen.findByRole('button', { name: /Japan 2020/ })
    expect(row.querySelector('img')).toHaveAttribute('src', '/uploads/covers/jp.jpg')
    expect(screen.getByText('Sun, Mar 1, 2020 – Thu, Mar 5, 2020')).toBeInTheDocument()
  })

  it('FE-MOB-CTRIPP-003: a trip without dates shows no range, an open-ended one only its start', async () => {
    setup()
    const noDates = await screen.findByRole('button', { name: /Weekend in Prague/ })
    expect(noDates.querySelector('.lucide-calendar-days')).toBeNull()
    // Without a cover the pin placeholder stands in.
    expect(noDates.querySelector('.lucide-map-pin')).not.toBeNull()
    expect(screen.getByText('Sun, Mar 1, 2020')).toBeInTheDocument()
  })

  it('FE-MOB-CTRIPP-004: the spinner holds the list until the trips arrive', async () => {
    let resolve!: (v: { trips: typeof TRIPS }) => void
    vi.mocked(tripsApi.list).mockReturnValue(new Promise(r => { resolve = r }))
    setup()
    expect(document.querySelector('.animate-spin')).not.toBeNull()
    expect(screen.queryByText('No trips yet')).not.toBeInTheDocument()

    resolve({ trips: TRIPS })
    expect(await screen.findByText('Japan 2020')).toBeInTheDocument()
  })

  it('FE-MOB-CTRIPP-005: a response without a trips array falls back to the empty state', async () => {
    vi.mocked(tripsApi.list).mockResolvedValue({})
    setup()
    expect(await screen.findByText('No trips yet')).toBeInTheDocument()
  })

  it('FE-MOB-CTRIPP-006: a failing request shows the empty state instead of breaking', async () => {
    vi.mocked(tripsApi.list).mockRejectedValue(new Error('offline'))
    setup()
    expect(await screen.findByText('No trips yet')).toBeInTheDocument()
  })

  it('FE-MOB-CTRIPP-007: a closed sheet asks for nothing and renders nothing', () => {
    setup({ open: false })
    expect(tripsApi.list).not.toHaveBeenCalled()
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })

  it('FE-MOB-CTRIPP-008: the search box filters the rows by title, case-insensitively', async () => {
    setup()
    await screen.findByText('Japan 2020')
    fireEvent.change(screen.getByPlaceholderText('Search trips'), { target: { value: 'prague' } })
    expect(screen.getByText('Weekend in Prague')).toBeInTheDocument()
    expect(screen.queryByText('Japan 2020')).not.toBeInTheDocument()

    fireEvent.change(screen.getByPlaceholderText('Search trips'), { target: { value: 'nothing' } })
    expect(screen.getByText('No trips yet')).toBeInTheDocument()
  })

  it('FE-MOB-CTRIPP-009: copying reports the count and closes the sheet', async () => {
    const { onCopy, onClose } = setup()
    fireEvent.click(await screen.findByRole('button', { name: /Japan 2020/ }))
    await waitFor(() => expect(onClose).toHaveBeenCalled())
    expect(onCopy).toHaveBeenCalledWith(1)
    expect(addToast).toHaveBeenCalledWith('Copied 1 places', 'success', undefined)
  })

  it('FE-MOB-CTRIPP-010: duplicates the server skipped get their own toast', async () => {
    const onCopy = vi.fn<(id: number) => Promise<CopyResult>>()
      .mockResolvedValue({ copied: 2, skipped: [{ id: 9, name: 'Louvre' }] })
    setup({ onCopy })
    fireEvent.click(await screen.findByRole('button', { name: /Japan 2020/ }))
    await waitFor(() => expect(addToast).toHaveBeenCalledWith('Skipped 1 duplicates', 'info', undefined))
    expect(addToast).toHaveBeenCalledWith('Copied 2 places', 'success', undefined)
  })

  it('FE-MOB-CTRIPP-011: a no-op copy says so rather than staying silent', async () => {
    const onCopy = vi.fn<(id: number) => Promise<CopyResult>>().mockResolvedValue({ copied: 0, skipped: [] })
    setup({ onCopy })
    fireEvent.click(await screen.findByRole('button', { name: /Japan 2020/ }))
    await waitFor(() => expect(addToast).toHaveBeenCalledWith('Nothing to copy', 'info', undefined))
  })

  it('FE-MOB-CTRIPP-012: a failed copy surfaces the server message and keeps the sheet open', async () => {
    const onCopy = vi.fn<(id: number) => Promise<CopyResult>>()
      .mockRejectedValue({ response: { data: { error: 'Trip is locked' } } })
    const { onClose } = setup({ onCopy })
    fireEvent.click(await screen.findByRole('button', { name: /Japan 2020/ }))
    await waitFor(() => expect(addToast).toHaveBeenCalledWith('Trip is locked', 'error', undefined))
    expect(onClose).not.toHaveBeenCalled()
  })

  it('FE-MOB-CTRIPP-013: while a copy runs the row spins and a second trip is ignored', async () => {
    let resolve!: (v: CopyResult) => void
    const onCopy = vi.fn<(id: number) => Promise<CopyResult>>()
      .mockReturnValue(new Promise<CopyResult>(r => { resolve = r }))
    const { onClose } = setup({ onCopy })
    const row = await screen.findByRole('button', { name: /Japan 2020/ })
    fireEvent.click(row)
    expect(row).toBeDisabled()
    expect(row.querySelector('.animate-spin')).not.toBeNull()

    fireEvent.click(screen.getByRole('button', { name: /Weekend in Prague/ }))
    expect(onCopy).toHaveBeenCalledTimes(1)

    resolve({ copied: 1, skipped: [] })
    await waitFor(() => expect(onClose).toHaveBeenCalled())
  })

  it('FE-MOB-CTRIPP-014: the header close hands back without copying', async () => {
    const { onClose, onCopy } = setup()
    await screen.findByText('Japan 2020')
    fireEvent.click(screen.getByRole('button', { name: 'Close' }))
    expect(onClose).toHaveBeenCalled()
    expect(onCopy).not.toHaveBeenCalled()
  })
})
