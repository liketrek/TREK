import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import MarkdownText from './MarkdownText'

describe('MarkdownText', () => {
  it('FE-MDTEXT-001: a description written in markdown reads as formatted text, not as syntax (#2337)', () => {
    render(<MarkdownText>{'# Checkpoint Charlie\n\nThe **most famous** crossing.'}</MarkdownText>)
    expect(screen.getByRole('heading', { name: 'Checkpoint Charlie' })).toBeInTheDocument()
    expect(screen.getByText('most famous').tagName).toBe('STRONG')
    expect(screen.queryByText(/#\s*Checkpoint/)).toBeNull()
  })

  it('FE-MDTEXT-002: a gfm table is a table', () => {
    render(<MarkdownText>{'| Day | Stop |\n| --- | --- |\n| 1 | Gate |'}</MarkdownText>)
    expect(screen.getByRole('table')).toBeInTheDocument()
    expect(screen.getByRole('columnheader', { name: 'Day' })).toBeInTheDocument()
  })

  it('FE-MDTEXT-003: a single newline stays a line break, the way the editors show it', () => {
    const { container } = render(<MarkdownText>{'Opening hours\n9–17'}</MarkdownText>)
    expect(container.querySelector('br')).not.toBeNull()
  })

  it('FE-MDTEXT-004: a link in a full view opens in its own tab', () => {
    render(<MarkdownText>{'[tickets](https://example.com/tickets)'}</MarkdownText>)
    const link = screen.getByRole('link', { name: 'tickets' })
    expect(link).toHaveAttribute('target', '_blank')
    expect(link.getAttribute('rel')).toContain('noopener')
  })

  it('FE-MDTEXT-005: a clamped row keeps the link text but drops the anchor, so the tap opens the row', () => {
    render(<MarkdownText clamp>{'[tickets](https://example.com/tickets)'}</MarkdownText>)
    expect(screen.queryByRole('link')).toBeNull()
    expect(screen.getByText('tickets')).toBeInTheDocument()
  })

  it('FE-MDTEXT-006: a clamped row is held to one line so a long description cannot swallow the list', () => {
    const { container } = render(<MarkdownText clamp className="text-m-muted">{'# Berlin Wall Memorial\n\nA long second paragraph.'}</MarkdownText>)
    const wrapper = container.firstElementChild as HTMLElement
    expect(wrapper.style.maxHeight).toBe('1.2em')
    expect(wrapper.className).toContain('truncate')
    expect(wrapper.className).toContain('text-m-muted')
  })

  it('FE-MDTEXT-007: a clamped row takes its direction from its own text, so a Latin address in Arabic is cut at its end', () => {
    const { container } = render(<MarkdownText clamp>{'68 Fukakusa Yabunouchicho, Fushimi Ward, Kyoto'}</MarkdownText>)
    const wrapper = container.firstElementChild as HTMLElement
    expect(wrapper).toHaveAttribute('dir', 'auto')
    expect(wrapper).toHaveClass('truncate')
    // No isolate inside: dir="auto" would not see the text through a <bdi>.
    expect(wrapper.querySelector('bdi')).toBeNull()
  })

  it('FE-MDTEXT-008: in a full view each paragraph runs in its own direction, inside its block', () => {
    const text = ["Kyoto's kitchen: pickles and matcha everything.", 'Second paragraph?'].join('\n\n')
    const { container } = render(<MarkdownText>{text}</MarkdownText>)
    expect(container.firstElementChild).not.toHaveAttribute('dir')
    const paragraphs = container.querySelectorAll('p')
    expect(paragraphs).toHaveLength(2)
    paragraphs.forEach(p => expect(p.firstElementChild?.tagName).toBe('BDI'))
    expect(paragraphs[1].textContent).toBe('Second paragraph?')
  })
})
