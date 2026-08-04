import type { ComponentProps } from 'react'
import { describe, expect, it, vi } from 'vitest'
import type { Collection } from '@trek/shared'
import { fireEvent, render, screen, waitFor } from '../../../helpers/render'
import MCollListPickerSheet, {
  type MCollListPickerMode,
} from '../../../../src/mobile/screens/collections/MCollListPickerSheet'
import { useTranslation } from '../../../../src/i18n'

// FE-MOB-CLISTP-001 to FE-MOB-CLISTP-010

const LISTS = [
  { id: 1, owner_id: 3, name: 'Tokyo 2026', color: '#38BDF8', place_count: 12 },
  // No colour and no count — both fall back.
  { id: 2, owner_id: 3, name: 'Someday' },
] as unknown as Collection[]

function Harness(props: Omit<ComponentProps<typeof MCollListPickerSheet>, 't'>) {
  const { t } = useTranslation()
  return <MCollListPickerSheet {...props} t={t} />
}

function setup(over: Partial<ComponentProps<typeof MCollListPickerSheet>> = {}) {
  const onPick = vi.fn<(id: number) => Promise<void>>().mockResolvedValue(undefined)
  const onClose = vi.fn()
  const props = { mode: 'move' as MCollListPickerMode | null, lists: LISTS, count: 3, onPick, onClose, ...over }
  const view = render(<Harness {...props} />)
  return { ...view, onPick, onClose, props }
}

describe('MCollListPickerSheet', () => {
  it('FE-MOB-CLISTP-001: move mode titles the sheet with the selection size', () => {
    setup()
    expect(screen.getByRole('dialog', { name: 'Move 3 to another list' })).toBeInTheDocument()
    expect(screen.getByText('Move 3 to another list')).toBeInTheDocument()
  })

  it('FE-MOB-CLISTP-002: copy mode uses the duplicate wording', () => {
    setup({ mode: 'copy', count: 1 })
    expect(screen.getByRole('dialog', { name: 'Duplicate 1 to another list' })).toBeInTheDocument()
  })

  it('FE-MOB-CLISTP-003: renders one row per list with its place count', () => {
    setup()
    expect(screen.getByRole('button', { name: /Tokyo 2026/ })).toHaveTextContent('12')
    expect(screen.getByRole('button', { name: /Someday/ })).toHaveTextContent('0')
  })

  it('FE-MOB-CLISTP-004: an empty target list explains there is nowhere to move to', () => {
    setup({ lists: [] })
    expect(screen.getByText('No other lists yet')).toBeInTheDocument()
  })

  it('FE-MOB-CLISTP-005: picking a list hands the target id to the caller', async () => {
    const { onPick } = setup()
    fireEvent.click(screen.getByRole('button', { name: /Tokyo 2026/ }))
    await waitFor(() => expect(onPick).toHaveBeenCalledWith(1))
  })

  it('FE-MOB-CLISTP-006: while a pick runs the row spins and every row is locked', async () => {
    let resolve!: () => void
    const onPick = vi.fn<(id: number) => Promise<void>>().mockReturnValue(new Promise<void>(r => { resolve = r }))
    setup({ onPick })
    const first = screen.getByRole('button', { name: /Tokyo 2026/ })
    fireEvent.click(first)

    expect(first.querySelector('.animate-spin')).not.toBeNull()
    expect(screen.getByRole('button', { name: /Someday/ })).toBeDisabled()
    fireEvent.click(screen.getByRole('button', { name: /Someday/ }))
    expect(onPick).toHaveBeenCalledTimes(1)

    resolve()
    await waitFor(() => expect(first.querySelector('.animate-spin')).toBeNull())
  })

  it('FE-MOB-CLISTP-007: once a pick has settled another list can be picked', async () => {
    const { onPick } = setup({ mode: 'copy' })
    fireEvent.click(screen.getByRole('button', { name: /Tokyo 2026/ }))
    await waitFor(() => expect(screen.getByRole('button', { name: /Someday/ })).not.toBeDisabled())

    fireEvent.click(screen.getByRole('button', { name: /Someday/ }))
    await waitFor(() => expect(onPick).toHaveBeenNthCalledWith(2, 2))
  })

  it('FE-MOB-CLISTP-008: the header close hands back to the caller', () => {
    const { onClose } = setup()
    fireEvent.click(screen.getByRole('button', { name: 'Close' }))
    expect(onClose).toHaveBeenCalled()
  })

  it('FE-MOB-CLISTP-009: mode null keeps the sheet unmounted', () => {
    setup({ mode: null })
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })

  it('FE-MOB-CLISTP-010: the title follows the mode it is opened with, and is held on close', () => {
    const { rerender, props } = setup({ mode: null })
    rerender(<Harness {...props} mode="copy" />)
    expect(screen.getByRole('dialog', { name: 'Duplicate 3 to another list' })).toBeInTheDocument()

    // Closing keeps the last title through the exit animation.
    rerender(<Harness {...props} mode={null} />)
    expect(screen.getByText('Duplicate 3 to another list')).toBeInTheDocument()
  })

  it('FE-MOB-CLISTP-011: a rejecting pick unlocks the rows instead of escaping', async () => {
    const onPick = vi.fn<(id: number) => Promise<void>>().mockRejectedValue(new Error('nope'))
    setup({ onPick })
    fireEvent.click(screen.getByRole('button', { name: /Tokyo 2026/ }))

    await waitFor(() => expect(screen.getByRole('button', { name: /Someday/ })).not.toBeDisabled())
    fireEvent.click(screen.getByRole('button', { name: /Someday/ }))
    await waitFor(() => expect(onPick).toHaveBeenNthCalledWith(2, 2))
  })
})
