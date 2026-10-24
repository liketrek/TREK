import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { createMarkdownHtml } from './markdownHtml';
import { SafeMarkdown } from './SafeMarkdown';

describe('SafeMarkdown (#2692)', () => {
  it('FE-COMP-SAFEMD-001: renders GitHub markdown with kept line breaks and safe links', () => {
    render(<SafeMarkdown>{'# Title\nfirst\nsecond\n\n[site](https://example.com)'}</SafeMarkdown>);
    expect(screen.getByRole('heading', { name: 'Title' })).toBeInTheDocument();
    expect(document.querySelector('br')).not.toBeNull();
    const link = screen.getByRole('link', { name: 'site' });
    expect(link).toHaveAttribute('target', '_blank');
    expect(link).toHaveAttribute('rel', 'noopener noreferrer nofollow');
  });

  it('FE-COMP-SAFEMD-002: shows raw HTML as text and never as an element', () => {
    render(<SafeMarkdown>{'Room <TBD> <img src=x onerror=alert(1)>'}</SafeMarkdown>);
    expect(document.querySelector('img')).toBeNull();
    expect(screen.getByText(/Room <TBD>/)).toBeInTheDocument();
  });
});

describe('createMarkdownHtml (#2692)', () => {
  it('FE-COMP-SAFEMD-003: returns the sanitized HTML, the same for the same text', () => {
    const markdown = createMarkdownHtml();
    try {
      const html = markdown.html('**bold** and <script>alert(1)</script>');
      expect(html).toContain('<strong>bold</strong>');
      expect(html).not.toContain('<script>');
      expect(markdown.html('**bold** and <script>alert(1)</script>')).toBe(html);
      expect(markdown.html('- a\n- b')).toContain('<li>a</li>');
    } finally {
      markdown.dispose();
    }
  });
});
