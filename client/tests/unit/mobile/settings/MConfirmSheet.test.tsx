import { describe, it, expect, vi } from 'vitest'
import { fireEvent, render, screen } from '@testing-library/react'
import MConfirmSheet from '../../../../src/mobile/screens/settings/MConfirmSheet'

// FE-MOB-CONFIRM-001 to FE-MOB-CONFIRM-004

describe('MConfirmSheet', () => {
  it('FE-MOB-CONFIRM-001: a long list scrolls between the title and the buttons, which stay in reach', () => {
    render(
      <MConfirmSheet open onClose={vi.fn()} title="Remove days?" message="Saving removes these days:" confirmLabel="Remove days and save" cancelLabel="Cancel" danger onConfirm={vi.fn()}>
        <ul aria-label="consequences">{Array.from({ length: 40 }, (_, i) => <li key={i}>Row {i}</li>)}</ul>
      </MConfirmSheet>,
    )
    const scroller = screen.getByRole('list', { name: 'consequences' }).closest('.overflow-y-auto') as HTMLElement
    expect(scroller).not.toBeNull()
    expect(scroller).toHaveClass('min-h-0', 'flex-1')
    expect(scroller).toHaveTextContent('Saving removes these days:')
    // Title and buttons sit outside the scrolling part.
    expect(scroller.contains(screen.getByText('Remove days?'))).toBe(false)
    const confirm = screen.getByRole('button', { name: 'Remove days and save' })
    expect(scroller.contains(confirm)).toBe(false)
    expect(confirm.parentElement).toHaveClass('flex-none')
  })

  it('FE-MOB-CONFIRM-002: confirm and cancel reach their handlers, busy turns the confirm off', () => {
    const onClose = vi.fn()
    const onConfirm = vi.fn()
    const { rerender } = render(
      <MConfirmSheet open onClose={onClose} title="Delete Tue, Oct 13?" message="Gone for good." confirmLabel="Delete day" cancelLabel="Cancel" onConfirm={onConfirm} />,
    )
    fireEvent.click(screen.getByRole('button', { name: 'Delete day' }))
    fireEvent.click(screen.getByRole('button', { name: 'Cancel' }))
    expect(onConfirm).toHaveBeenCalledTimes(1)
    expect(onClose).toHaveBeenCalledTimes(1)

    rerender(
      <MConfirmSheet open onClose={onClose} title="Delete Tue, Oct 13?" message="Gone for good." confirmLabel="Delete day" cancelLabel="Cancel" onConfirm={onConfirm} busy />,
    )
    expect(screen.getByRole('button', { name: 'Delete day' })).toBeDisabled()
  })

  it('FE-MOB-CONFIRM-003: without onConfirm it is a notice with a single button', () => {
    render(<MConfirmSheet open onClose={vi.fn()} title="Heads up" message="Nothing to confirm." cancelLabel="OK" />)
    expect(screen.getAllByRole('button').map(b => b.textContent)).toEqual(['OK'])
  })
  it('FE-MOB-CONFIRM-004: a long label never wraps inside its button; the row makes room instead', () => {
    render(<MConfirmSheet open onClose={vi.fn()} title="Remove days?" message="Saving removes these days:" confirmLabel="Retirer les jours et enregistrer" cancelLabel="Annuler" danger onConfirm={vi.fn()} />)
    const confirm = screen.getByRole('button', { name: 'Retirer les jours et enregistrer' })
    expect(confirm).toHaveClass('whitespace-nowrap')
    expect(screen.getByRole('button', { name: 'Annuler' })).toHaveClass('whitespace-nowrap')
    expect(confirm.parentElement).toHaveClass('flex-wrap')
  })
})
