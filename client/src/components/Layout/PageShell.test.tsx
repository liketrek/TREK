// FE-W4SHELL-001 to FE-W4SHELL-006
import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '../../../tests/helpers/render'

vi.mock('./Navbar', () => ({
  default: ({ tripTitle }: { tripTitle?: string }) => <nav data-testid="navbar">{tripTitle ?? 'nav'}</nav>,
}))

import PageShell from './PageShell'

describe('PageShell', () => {
  it('FE-W4SHELL-001: renders the navbar above the children', () => {
    render(<PageShell><p>content</p></PageShell>)

    expect(screen.getByTestId('navbar')).toBeInTheDocument()
    expect(screen.getByText('content')).toBeInTheDocument()
  })

  it('FE-W4SHELL-002: offsets the content by the global nav height', () => {
    render(<PageShell><p>content</p></PageShell>)

    expect(screen.getByText('content').parentElement).toHaveStyle({ paddingTop: 'var(--nav-h)' })
  })

  it('FE-W4SHELL-003: accepts a custom nav offset and content style', () => {
    render(
      <PageShell navOffset="80px" contentStyle={{ maxWidth: 900 }} contentClassName="mx-auto">
        <p>content</p>
      </PageShell>,
    )
    const wrapper = screen.getByText('content').parentElement as HTMLElement

    expect(wrapper.style.paddingTop).toBe('80px')
    expect(wrapper.style.maxWidth).toBe('900px')
    expect(wrapper.className).toBe('mx-auto')
  })

  it('FE-W4SHELL-004: keeps min-h-screen and appends the caller className', () => {
    const { container } = render(<PageShell className="bg-surface"><p>c</p></PageShell>)

    expect((container.firstElementChild as HTMLElement).className).toBe('min-h-screen bg-surface')
  })

  it('FE-W4SHELL-005: leaves the root class untouched without a className', () => {
    const { container } = render(<PageShell><p>c</p></PageShell>)
    const root = container.firstElementChild as HTMLElement

    expect(root.className).toBe('min-h-screen')
    expect(root.getAttribute('style')).toBeNull()
  })

  it('FE-W4SHELL-006: themes the root via an inline background and forwards navbar props', () => {
    const { container } = render(
      <PageShell background="var(--bg-secondary)" navbar={{ tripTitle: 'Iceland' }}><p>c</p></PageShell>,
    )

    expect((container.firstElementChild as HTMLElement).style.background).toBe('var(--bg-secondary)')
    expect(screen.getByTestId('navbar')).toHaveTextContent('Iceland')
  })
})
