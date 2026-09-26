import type { ComponentProps } from 'react'
import { describe, expect, it, vi } from 'vitest'
import PlFileAttach from '../../../../src/mobile/screens/trip/sheets/PlFileAttach'
import { openFile } from '../../../../src/utils/fileDownload'
import type { TripFile } from '../../../../src/types'
import { buildTripFile } from '../../../helpers/factories'
import { buildPlanner } from '../../../helpers/mobileTrip'
import { fireEvent, render, screen, waitFor } from '../../../helpers/render'

// FE-MOB-PLFILE-001 to FE-MOB-PLFILE-017

vi.mock('../../../../src/utils/fileDownload', () => ({ openFile: vi.fn(async () => undefined) }))

const planner = buildPlanner()

function file(name: string, type = 'application/pdf') {
  return new File(['x'], name, { type })
}

function setup(props: Partial<ComponentProps<typeof PlFileAttach>> = {}) {
  const onAdd = vi.fn()
  const onRemove = vi.fn()
  const view = render(
    <PlFileAttach planner={planner} files={[]} onAdd={onAdd} onRemove={onRemove} {...props} />,
  )
  const input = view.container.querySelector('input[type="file"]') as HTMLInputElement
  return { ...view, onAdd, onRemove, input }
}

describe('PlFileAttach', () => {
  it('FE-MOB-PLFILE-001: renders the files heading, the paste hint and the attach pill', () => {
    setup()
    expect(screen.getByText('files.title')).toBeInTheDocument()
    expect(screen.getByText('files.pasteHint')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'files.attach' })).toBeInTheDocument()
  })

  it('FE-MOB-PLFILE-002: hideHint drops the paste subline but keeps the heading', () => {
    setup({ hideHint: true })
    expect(screen.getByText('files.title')).toBeInTheDocument()
    expect(screen.queryByText('files.pasteHint')).not.toBeInTheDocument()
  })

  it('FE-MOB-PLFILE-003: the picker input is hidden and accepts multiple files', () => {
    const { input } = setup()
    expect(input).toHaveClass('hidden')
    expect(input).toHaveAttribute('multiple')
  })

  it('FE-MOB-PLFILE-004: the attach pill opens the hidden picker', () => {
    const { input } = setup()
    const click = vi.spyOn(input, 'click').mockImplementation(() => undefined)
    fireEvent.click(screen.getByRole('button', { name: 'files.attach' }))
    expect(click).toHaveBeenCalledTimes(1)
    click.mockRestore()
  })

  it('FE-MOB-PLFILE-005: picking files reports them as an array and clears the input', () => {
    const { input, onAdd } = setup()
    const a = file('ticket.pdf')
    const b = file('map.png', 'image/png')
    fireEvent.change(input, { target: { files: [a, b] } })
    expect(onAdd).toHaveBeenCalledTimes(1)
    expect(onAdd.mock.calls[0][0]).toEqual([a, b])
    expect(input.value).toBe('')
  })

  it('FE-MOB-PLFILE-006: an empty pick still reports an empty array', () => {
    const { input, onAdd } = setup()
    fireEvent.change(input, { target: { files: [] } })
    expect(onAdd).toHaveBeenCalledWith([])
  })

  it('FE-MOB-PLFILE-010: a cancelled pick without a file list reports an empty array', () => {
    const { input, onAdd } = setup()
    fireEvent.change(input, { target: { files: null } })
    expect(onAdd).toHaveBeenCalledWith([])
  })

  it('FE-MOB-PLFILE-007: renders no attachment list while nothing is pending', () => {
    setup()
    expect(screen.queryByRole('button', { name: 'common.delete' })).not.toBeInTheDocument()
  })

  it('FE-MOB-PLFILE-008: lists every pending attachment by name', () => {
    setup({ files: [file('booking.pdf'), file('voucher.pdf')] })
    expect(screen.getByText('booking.pdf')).toBeInTheDocument()
    expect(screen.getByText('voucher.pdf')).toBeInTheDocument()
    expect(screen.getAllByRole('button', { name: 'common.delete' })).toHaveLength(2)
  })

  it('FE-MOB-PLFILE-009: the row X removes exactly its own index', () => {
    const { onRemove } = setup({ files: [file('a.pdf'), file('b.pdf'), file('c.pdf')] })
    fireEvent.click(screen.getAllByRole('button', { name: 'common.delete' })[1])
    expect(onRemove).toHaveBeenCalledWith(1)
  })

  // ── Files already on a saved booking (#2084) ───────────────────────────────

  const voucher = buildTripFile({ id: 1, original_name: 'voucher.pdf', url: '/uploads/files/voucher.pdf' })
  const ticket = buildTripFile({ id: 2, original_name: 'ticket.pdf' })
  const map = buildTripFile({ id: 3, original_name: 'map.png' })

  it('FE-MOB-PLFILE-011: canAttach false drops the picker pill but keeps the row', () => {
    setup({ canAttach: false, attached: [voucher] })
    expect(screen.queryByRole('button', { name: 'files.attach' })).not.toBeInTheDocument()
    expect(screen.getByText('files.title')).toBeInTheDocument()
    expect(screen.getByText('voucher.pdf')).toBeInTheDocument()
  })

  it('FE-MOB-PLFILE-012: attached files are listed above the pending ones and open on tap', () => {
    setup({ attached: [voucher], files: [file('fresh.pdf')] })
    const names = screen.getAllByText(/voucher\.pdf|fresh\.pdf/).map(n => n.textContent)
    expect(names).toEqual(['voucher.pdf', 'fresh.pdf'])
    // Only the pending one can be dropped here.
    expect(screen.getAllByRole('button', { name: 'common.delete' })).toHaveLength(1)
    fireEvent.click(screen.getByText('voucher.pdf'))
    expect(openFile).toHaveBeenCalledWith('/uploads/files/voucher.pdf', 'voucher.pdf')
  })

  it('FE-MOB-PLFILE-013: the link pill needs both candidates and a link handler', () => {
    const { unmount } = setup({ linkable: [ticket] })
    expect(screen.queryByRole('button', { name: 'files.link' })).not.toBeInTheDocument()
    unmount()
    setup({ linkable: [], onLink: vi.fn(async () => true) })
    expect(screen.queryByRole('button', { name: 'files.link' })).not.toBeInTheDocument()
  })

  it('FE-MOB-PLFILE-014: the link pill folds the trip files in and out', () => {
    setup({ linkable: [ticket, map], onLink: vi.fn(async () => true) })
    const pill = screen.getByRole('button', { name: 'files.link' })
    expect(pill).toHaveAttribute('aria-expanded', 'false')
    expect(screen.queryByText('ticket.pdf')).not.toBeInTheDocument()
    fireEvent.click(pill)
    expect(pill).toHaveAttribute('aria-expanded', 'true')
    expect(pill.className).toContain('bg-m-act')
    expect(screen.getByText('ticket.pdf')).toBeInTheDocument()
    expect(screen.getByText('map.png')).toBeInTheDocument()
    fireEvent.click(pill)
    expect(screen.queryByText('ticket.pdf')).not.toBeInTheDocument()
  })

  it('FE-MOB-PLFILE-015: a linked file folds the list away', async () => {
    const onLink = vi.fn(async (_f: TripFile) => true)
    setup({ linkable: [ticket, map], onLink })
    fireEvent.click(screen.getByRole('button', { name: 'files.link' }))
    fireEvent.click(screen.getByText('map.png'))
    expect(onLink).toHaveBeenCalledWith(map)
    await waitFor(() => expect(screen.queryByText('ticket.pdf')).not.toBeInTheDocument())
  })

  it('FE-MOB-PLFILE-016: a failed link keeps the list open for another try', async () => {
    const onLink = vi.fn(async (_f: TripFile) => false)
    setup({ linkable: [ticket], onLink })
    fireEvent.click(screen.getByRole('button', { name: 'files.link' }))
    fireEvent.click(screen.getByText('ticket.pdf'))
    await waitFor(() => expect(onLink).toHaveBeenCalledTimes(1))
    expect(screen.getByText('ticket.pdf')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'files.link' })).toHaveAttribute('aria-expanded', 'true')
  })

  it('FE-MOB-PLFILE-017: link and attach sit side by side when both are allowed', () => {
    setup({ linkable: [ticket], onLink: vi.fn(async () => true) })
    const buttons = screen.getAllByRole('button').map(b => b.textContent)
    expect(buttons).toEqual(['files.link', 'files.attach'])
  })
})
