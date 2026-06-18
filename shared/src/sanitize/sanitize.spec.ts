import { sanitizeInlineHtml, sanitizeRichTextHtml, escapeHtml } from './sanitize';

import { describe, it, expect } from 'vitest';

describe('escapeHtml', () => {
  it('escapes the five metacharacters', () => {
    expect(escapeHtml(`a & b < c > d " e ' f`)).toBe('a &amp; b &lt; c &gt; d &quot; e &#39; f');
  });

  it('escapes ampersands first (no double-escape of entities)', () => {
    expect(escapeHtml('&lt;')).toBe('&amp;lt;');
  });

  it('returns empty string for empty input', () => {
    expect(escapeHtml('')).toBe('');
  });

  it('leaves plain ASCII text untouched', () => {
    expect(escapeHtml('Paris Adventure 2026')).toBe('Paris Adventure 2026');
  });

  it('neutralises a script tag without sanitising', () => {
    expect(escapeHtml('<script>alert(1)</script>')).toBe('&lt;script&gt;alert(1)&lt;/script&gt;');
  });
});

describe('sanitizeInlineHtml', () => {
  it('returns empty string for empty input', () => {
    expect(sanitizeInlineHtml('')).toBe('');
  });

  it('preserves the allowed inline tags', () => {
    expect(sanitizeInlineHtml('a <strong>b</strong> c')).toBe('a <strong>b</strong> c');
    expect(sanitizeInlineHtml('<em>x</em>')).toBe('<em>x</em>');
  });

  it('strips <script> entirely', () => {
    const out = sanitizeInlineHtml('safe <script>alert(1)</script> text');
    expect(out).not.toContain('<script');
    expect(out).not.toContain('alert(1)');
    expect(out).toContain('safe');
  });

  it('strips <img> (no img tag in inline allow-list)', () => {
    expect(sanitizeInlineHtml('<img src=x onerror=alert(1)>')).toBe('');
  });

  it('strips on* event handlers from preserved tags', () => {
    const out = sanitizeInlineHtml('<span onclick="alert(1)">hi</span>');
    expect(out).not.toContain('onclick');
    expect(out).toContain('hi');
  });

  it('strips style attribute (CSS-injection surface)', () => {
    const out = sanitizeInlineHtml('<span style="background:url(javascript:alert(1))">x</span>');
    expect(out).not.toContain('style=');
    expect(out).not.toContain('javascript:');
  });

  it('strips iframe / object / embed / svg-with-script', () => {
    expect(sanitizeInlineHtml('<iframe src="evil"></iframe>')).toBe('');
    expect(sanitizeInlineHtml('<object data="evil"></object>')).toBe('');
    expect(sanitizeInlineHtml('<embed src="evil" />')).toBe('');
    expect(sanitizeInlineHtml('<svg><script>alert(1)</script></svg>')).not.toContain('script');
  });

  it('does not preserve href / target on the inline tag set', () => {
    // <a> is not in the inline allow-list, so href can never appear here.
    const out = sanitizeInlineHtml('<a href="javascript:alert(1)">x</a>');
    expect(out).toBe('x');
  });

  it('keeps user text content when the wrapping tag is stripped', () => {
    expect(sanitizeInlineHtml('<custom-tag>hello</custom-tag>')).toBe('hello');
  });
});

describe('sanitizeRichTextHtml', () => {
  it('preserves the full prose tag set', () => {
    const html = '<p>hello <strong>world</strong></p><ul><li>one</li></ul>';
    const out = sanitizeRichTextHtml(html);
    expect(out).toContain('<p>');
    expect(out).toContain('<strong>world</strong>');
    expect(out).toContain('<li>one</li>');
  });

  it('still strips <script> + on* + style', () => {
    const out = sanitizeRichTextHtml('<p onclick="alert(1)" style="x">hi</p><script>x()</script>');
    expect(out).not.toContain('onclick');
    expect(out).not.toContain('style=');
    expect(out).not.toContain('<script');
  });

  it('blocks javascript: hrefs', () => {
    const out = sanitizeRichTextHtml('<a href="javascript:alert(1)">x</a>');
    expect(out).not.toContain('javascript:');
  });

  it('blocks data: hrefs that smuggle scripts', () => {
    const out = sanitizeRichTextHtml('<a href="data:text/html,<script>alert(1)</script>">x</a>');
    expect(out).not.toContain('data:text/html');
  });

  it('keeps http(s) hrefs intact', () => {
    const out = sanitizeRichTextHtml('<a href="https://example.com">link</a>');
    expect(out).toContain('href="https://example.com"');
  });

  it('strips disallowed tags but keeps their content', () => {
    expect(sanitizeRichTextHtml('<p>before<custom>middle</custom>after</p>')).toContain('middle');
  });

  it('drops mathml + svg shorthand vectors', () => {
    const mathPayload = '<math><mtext><script>alert(1)</script></mtext></math>';
    const out = sanitizeRichTextHtml(mathPayload);
    expect(out).not.toContain('<script');
    expect(out).not.toContain('alert(1)');
  });
});
