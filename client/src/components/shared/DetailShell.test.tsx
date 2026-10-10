import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import DetailShell from './DetailShell'

describe('DetailShell', () => {
  it('centers between planner panels and owns header, scrolling, footer and close behavior', () => {
    const onClose = vi.fn()
    const { container } = render(
      <DetailShell
        header={<h2>Detail title</h2>}
        footer={<button type="button">Action</button>}
        onClose={onClose}
        closeLabel="Close"
        leftWidth={240}
        rightWidth={320}
        testId="detail-scroll"
      >
        <p>Detail content</p>
      </DetailShell>,
    )

    const shell = container.firstElementChild as HTMLElement
    expect(shell.style.left).toBe('calc(240px + 0.5 * (100% - 240px - 320px))')
    expect(screen.getByTestId('detail-scroll')).toHaveTextContent('Detail content')
    expect(screen.getByRole('button', { name: 'Action' })).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Close' }))
    expect(onClose).toHaveBeenCalledOnce()
  })
})
