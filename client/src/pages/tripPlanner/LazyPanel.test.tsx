// FE-PAGE-PLANNER-LAZYPANEL-001 to FE-PAGE-PLANNER-LAZYPANEL-004
import React, { lazy } from 'react'
import { render, screen } from '../../../tests/helpers/render'
import { LazyPanel } from './LazyPanel'

// A chunk that never arrives, so the fallback stays on screen.
const Pending = lazy(() => new Promise<{ default: React.ComponentType }>(() => {}))

let consoleError: ReturnType<typeof vi.spyOn>
beforeEach(() => {
  // React and the boundary both log a caught error; keep the output readable.
  consoleError = vi.spyOn(console, 'error').mockImplementation(() => {})
})
afterEach(() => {
  consoleError.mockRestore()
})

describe('LazyPanel', () => {
  it('FE-PAGE-PLANNER-LAZYPANEL-001: renders the panel once its chunk is there', async () => {
    const Loaded = lazy(async () => ({ default: () => <p>packing list</p> }))
    render(<LazyPanel id="packing"><Loaded /></LazyPanel>)

    expect(await screen.findByText('packing list')).toBeInTheDocument()
  })

  it('FE-PAGE-PLANNER-LAZYPANEL-002: a panel holds its place with a skeleton while loading', () => {
    const { container } = render(<LazyPanel id="files"><Pending /></LazyPanel>)

    const skeleton = container.querySelector('.animate-pulse')
    expect(skeleton).not.toBeNull()
    expect(skeleton).toHaveClass('min-h-[180px]', 'bg-surface-secondary')
  })

  it('FE-PAGE-PLANNER-LAZYPANEL-003: an overlay shows nothing while its chunk loads', () => {
    const { container } = render(<LazyPanel id="roadtrip-stay" overlay><Pending /></LazyPanel>)

    expect(container).toBeEmptyDOMElement()
  })

  it('FE-PAGE-PLANNER-LAZYPANEL-004: a chunk that fails stays inside its own panel', async () => {
    const Broken = lazy(() => Promise.reject(new Error('panel exploded')))
    render(
      <div>
        <p>planner frame</p>
        <LazyPanel id="collab"><Broken /></LazyPanel>
      </div>,
    )

    expect(await screen.findByRole('alert')).toBeInTheDocument()
    expect(screen.getByText('planner frame')).toBeInTheDocument()
    expect(consoleError).toHaveBeenCalledWith('[ErrorBoundary:planner-panel:collab]', expect.any(Error), expect.anything())
  })
})
