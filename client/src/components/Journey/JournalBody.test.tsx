// FE-COMP-JOURNALBODY-001 to FE-COMP-JOURNALBODY-013

import { describe, it, expect } from 'vitest';
import { render, screen } from '../../../tests/helpers/render';
import JournalBody from './JournalBody';

describe('JournalBody', () => {
  it('FE-COMP-JOURNALBODY-001: renders plain text content', () => {
    render(<JournalBody text="Hello traveller" />);
    expect(screen.getByText('Hello traveller')).toBeInTheDocument();
  });

  it('FE-COMP-JOURNALBODY-002: renders bold markdown as <strong>', () => {
    const { container } = render(<JournalBody text="This is **bold** text" />);
    const strong = container.querySelector('strong');
    expect(strong).toBeInTheDocument();
    expect(strong!.textContent).toBe('bold');
  });

  it('FE-COMP-JOURNALBODY-003: renders links with target _blank', () => {
    render(<JournalBody text="[Visit](https://example.com)" />);
    const link = screen.getByRole('link', { name: 'Visit' });
    expect(link).toHaveAttribute('href', 'https://example.com');
    expect(link).toHaveAttribute('target', '_blank');
    expect(link).toHaveAttribute('rel', 'noopener noreferrer');
  });

  it('FE-COMP-JOURNALBODY-004: renders headings with proper elements', () => {
    const { container } = render(<JournalBody text="## Section Title" />);
    const p = container.querySelector('p');
    expect(p).toBeInTheDocument();
    expect(p!.textContent).toBe('Section Title');
  });

  it('FE-COMP-JOURNALBODY-005: handles empty text without crashing', () => {
    const { container } = render(<JournalBody text="" />);
    expect(container.querySelector('.journal-body')).toBeInTheDocument();
  });

  it('FE-COMP-JOURNALBODY-006: renders block quotes with the journal accent border', () => {
    const { container } = render(<JournalBody text="> Remember the light" />);
    const quote = container.querySelector('blockquote');
    expect(quote).toBeInTheDocument();
    expect(quote!.textContent).toContain('Remember the light');
    expect(quote!.getAttribute('style')).toContain('var(--journal-accent)');
  });

  it('FE-COMP-JOURNALBODY-007: renders bullet and numbered lists', () => {
    const { container } = render(<JournalBody text={'- one\n- two\n\n1. first\n2. second'} />);
    expect(container.querySelectorAll('ul li')).toHaveLength(2);
    expect(container.querySelectorAll('ol li')).toHaveLength(2);
    expect(screen.getByText('second')).toBeInTheDocument();
  });

  it('FE-COMP-JOURNALBODY-008: renders emphasis and horizontal rules', () => {
    const { container } = render(<JournalBody text={'Some *stress* here\n\n---\n\nAfter'} />);
    expect(container.querySelector('em')!.textContent).toBe('stress');
    expect(container.querySelector('hr')).toBeInTheDocument();
  });

  it('FE-COMP-JOURNALBODY-009: renders inline code without a pre wrapper', () => {
    const { container } = render(<JournalBody text="Run `npm test` now" />);
    const code = container.querySelector('code');
    expect(code!.textContent).toBe('npm test');
    expect(container.querySelector('pre')).not.toBeInTheDocument();
    expect(code!.getAttribute('style')).toContain('rgba(0, 0, 0, 0.06)');
  });

  it('FE-COMP-JOURNALBODY-010: renders fenced code blocks inside a single pre element', () => {
    const { container } = render(<JournalBody text={'```js\nconst a = 1\n```'} />);
    const pres = container.querySelectorAll('pre');
    expect(pres).toHaveLength(1);
    expect(pres[0].querySelector('code')!.textContent).toContain('const a = 1');
  });

  it('FE-COMP-JOURNALBODY-011: renders h1 and h3 as plain paragraphs', () => {
    const { container } = render(<JournalBody text={'# Big\n\n### Small'} />);
    expect(container.querySelector('h1')).not.toBeInTheDocument();
    expect(container.querySelector('h3')).not.toBeInTheDocument();
    expect(screen.getByText('Big').tagName).toBe('P');
    expect(screen.getByText('Small').tagName).toBe('P');
  });

  it('FE-COMP-JOURNALBODY-012: keeps a setext underline as text instead of a heading', () => {
    // The pre-pass inserts a blank line so "====" stays its own block.
    const { container } = render(<JournalBody text={'Day One\n===='} />);
    expect(screen.getByText('Day One')).toBeInTheDocument();
    expect(screen.getByText('====')).toBeInTheDocument();
    expect(container.querySelectorAll('p')).toHaveLength(2);
  });

  it('FE-COMP-JOURNALBODY-013: darkens code backgrounds in dark mode', () => {
    const { container } = render(<JournalBody text={'`x`\n\n```js\ny\n```'} dark />);
    const [inline] = Array.from(container.querySelectorAll('code'));
    expect(inline.getAttribute('style')).toContain('rgba(255, 255, 255, 0.08)');
    // the block styling sits on react-markdown's own <pre>, there is no second one
    const pres = container.querySelectorAll('pre');
    expect(pres).toHaveLength(1);
    expect(pres[0].getAttribute('style')).toContain('rgba(255, 255, 255, 0.05)');
  });
});
