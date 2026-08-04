import type { ComponentProps } from 'react'
import { describe, expect, it, vi } from 'vitest'
import PlFileAttach from '../../../../src/mobile/screens/trip/sheets/PlFileAttach'
import { buildPlanner } from '../../../helpers/mobileTrip'
import { fireEvent, render, screen } from '../../../helpers/render'

// FE-MOB-PLFILE-001 to FE-MOB-PLFILE-010

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
})
