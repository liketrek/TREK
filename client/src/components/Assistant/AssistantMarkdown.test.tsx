/**
 * FE-AI-MD-001 to FE-AI-MD-005
 *
 * An answer is untrusted text: nothing in it may load by itself, raw HTML
 * never becomes markup, and a link always shows where it goes.
 */
import { describe, expect, it } from 'vitest';

import { render, screen } from '../../../tests/helpers/render';
import AssistantMarkdown from './AssistantMarkdown';

describe('AssistantMarkdown', () => {
  it('FE-AI-MD-001: renders Markdown as text, lists and emphasis', () => {
    const { container } = render(<AssistantMarkdown text={'**Kyoto** first\n\n- Kinkaku-ji\n- Ryoan-ji'} />);
    expect(container.querySelector('strong')).toHaveTextContent('Kyoto');
    expect(screen.getAllByRole('listitem')).toHaveLength(2);
  });

  it('FE-AI-MD-002: draws no image, in Markdown or as raw HTML', () => {
    const { container } = render(
      <AssistantMarkdown text={'![pixel](https://evil.example/p.gif)\n\n<img src="https://evil.example/q.gif">'} />
    );
    expect(container.querySelector('img')).toBeNull();
    expect(container.querySelector('picture, video, audio, iframe')).toBeNull();
  });

  it('FE-AI-MD-003: leaves no javascript: link to click', () => {
    const { container } = render(<AssistantMarkdown text={'[open](javascript:alert(1))'} />);
    const link = container.querySelector('a');
    expect(link?.getAttribute('href') ?? '').not.toMatch(/^javascript:/i);
  });

  it('FE-AI-MD-004: an outside link opens in its own tab and names its host', () => {
    render(<AssistantMarkdown text={'[Tickets](https://www.kinkaku-ji.or.jp/en/)'} />);
    const link = screen.getByRole('link', { name: /Tickets/ });
    expect(link).toHaveAttribute('target', '_blank');
    expect(link).toHaveAttribute('rel', 'noopener noreferrer nofollow');
    expect(link).toHaveTextContent('(www.kinkaku-ji.or.jp)');
  });

  it('FE-AI-MD-005: a link into TREK stays in the app, and the writing caret is marked', () => {
    const { container } = render(<AssistantMarkdown text={'See [day 2](/trips/4)'} writing />);
    const link = screen.getByRole('link', { name: 'day 2' });
    expect(link).toHaveAttribute('href', '/trips/4');
    expect(link).not.toHaveAttribute('target');
    expect(container.firstElementChild).toHaveAttribute('data-writing', 'true');
  });
});
