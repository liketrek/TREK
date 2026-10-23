import { stripMarkdown } from './strip-markdown';

import { describe, expect, it } from 'vitest';

// STRIPMD-001 to STRIPMD-008 (moved from the client's FE-UTIL-STRIPMD-001 to 006)

describe('stripMarkdown', () => {
  it('STRIPMD-001: strips bold and italic formatting', () => {
    expect(stripMarkdown('**bold** and _italic_')).toBe('bold and italic');
    expect(stripMarkdown('__also bold__ and *also italic*')).toBe('also bold and also italic');
  });

  it('STRIPMD-002: strips headings', () => {
    expect(stripMarkdown('# Heading 1')).toBe('Heading 1');
    expect(stripMarkdown('## Heading 2')).toBe('Heading 2');
    expect(stripMarkdown('### Heading 3')).toBe('Heading 3');
  });

  it('STRIPMD-003: converts links to text and removes images', () => {
    expect(stripMarkdown('[click here](https://example.com)')).toBe('click here');
    expect(stripMarkdown('![alt text](image.jpg)')).toBe('');
  });

  it('STRIPMD-004: strips code blocks and inline code', () => {
    expect(stripMarkdown('use `console.log`')).toBe('use console.log');
    expect(stripMarkdown('```\ncode block\n```')).toBe('');
  });

  it('STRIPMD-005: strips blockquotes and lists', () => {
    expect(stripMarkdown('> quoted text')).toBe('quoted text');
    expect(stripMarkdown('- item one')).toBe('item one');
    expect(stripMarkdown('1. first item')).toBe('first item');
  });

  it('STRIPMD-006: strips strikethrough and horizontal rules', () => {
    expect(stripMarkdown('~~deleted~~')).toBe('deleted');
    expect(stripMarkdown('---')).toBe('');
  });

  it('STRIPMD-007: keeps the link quirks of the old regex and joins the lines', () => {
    expect(stripMarkdown('[a[b](c)')).toBe('a[b');
    expect(stripMarkdown('[](c) after')).toBe('after');
    expect(stripMarkdown('[a] (c)')).toBe('[a] (c)');
    expect(stripMarkdown('[a](c\n) next')).toBe('[a](c ) next');
    expect(stripMarkdown('one\n\ntwo\nthree')).toBe('one two three');
  });

  it('STRIPMD-008: a long run of brackets without a close reads in linear time', () => {
    const started = Date.now();
    expect(stripMarkdown('[x'.repeat(32_000)).length).toBe(64_000);
    expect(Date.now() - started).toBeLessThan(1_000);
  });
});
