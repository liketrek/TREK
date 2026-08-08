// FE-W4CTD-001 to FE-W4CTD-009
import type { ComponentProps } from 'react'
import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '../../../tests/helpers/render'
import CopyTripDialog from './CopyTripDialog'

function setup(overrides: Partial<ComponentProps<typeof CopyTripDialog>> = {}) {
  const onClose = vi.fn()
  const onConfirm = vi.fn()
  const utils = render(
    <CopyTripDialog isOpen tripTitle="Iceland 2026" onClose={onClose} onConfirm={onConfirm} {...overrides} />,
  )
  return { onClose, onConfirm, ...utils }
}

describe('CopyTripDialog', () => {
  it('FE-W4CTD-001: renders nothing while closed', () => {
    const { container } = render(
      <CopyTripDialog isOpen={false} tripTitle="Iceland 2026" onClose={() => {}} onConfirm={() => {}} />,
    )

    expect(container).toBeEmptyDOMElement()
    expect(screen.queryByText('Iceland 2026')).toBeNull()
  })

  it('FE-W4CTD-002: shows the trip title and both copy lists', () => {
    setup()

    expect(screen.getByText('Iceland 2026')).toBeInTheDocument()
    // 6 "will copy" + 4 "won't copy" bullets.
    expect(screen.getAllByRole('listitem')).toHaveLength(10)
  })

  it('FE-W4CTD-003: confirming calls onConfirm and then closes', () => {
    const { onClose, onConfirm } = setup()

    fireEvent.click(screen.getByRole('button', { name: /copy/i }))

    expect(onConfirm).toHaveBeenCalledOnce()
    expect(onClose).toHaveBeenCalledOnce()
  })

  it('FE-W4CTD-004: cancel closes without confirming', () => {
    const { onClose, onConfirm } = setup()

    fireEvent.click(screen.getByRole('button', { name: /cancel/i }))

    expect(onClose).toHaveBeenCalledOnce()
    expect(onConfirm).not.toHaveBeenCalled()
  })

  it('FE-W4CTD-005: clicking the backdrop closes the dialog', () => {
    const { onClose, baseElement } = setup()
    const backdrop = baseElement.querySelector('.trek-backdrop-enter')!

    fireEvent.click(backdrop)

    expect(onClose).toHaveBeenCalledOnce()
  })

  it('FE-W4CTD-006: clicking inside the card does not close it', () => {
    const { onClose, baseElement } = setup()

    fireEvent.click(baseElement.querySelector('.trek-modal-enter')!)

    expect(onClose).not.toHaveBeenCalled()
  })

  it('FE-W4CTD-007: Escape closes the dialog', () => {
    const { onClose } = setup()

    fireEvent.keyDown(document, { key: 'Escape' })

    expect(onClose).toHaveBeenCalledOnce()
  })

  it('FE-W4CTD-008: other keys are ignored and the listener is dropped on close', () => {
    const onClose = vi.fn()
    const { rerender } = render(
      <CopyTripDialog isOpen tripTitle="Iceland 2026" onClose={onClose} onConfirm={() => {}} />,
    )

    fireEvent.keyDown(document, { key: 'Enter' })
    expect(onClose).not.toHaveBeenCalled()

    rerender(<CopyTripDialog isOpen={false} tripTitle="Iceland 2026" onClose={onClose} onConfirm={() => {}} />)
    fireEvent.keyDown(document, { key: 'Escape' })
    expect(onClose).not.toHaveBeenCalled()
  })

  it('FE-W4CTD-009: portals the dialog to document.body', () => {
    const { container, baseElement } = setup()

    expect(container).toBeEmptyDOMElement()
    expect(baseElement.querySelector('.trek-backdrop-enter')).not.toBeNull()
  })
})
