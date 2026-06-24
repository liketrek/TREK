import { describe, it, expect, vi } from 'vitest';

const { getText } = vi.hoisted(() => ({ getText: vi.fn(async () => ({ text: 'Hotel X — confirmation ABC' })) }));
vi.mock('pdf-parse', () => ({
  PDFParse: class {
    getText = getText;
    destroy = vi.fn(async () => {});
  },
}));

import { isTextLike, isPdf, extractText } from '../../../../src/nest/llm-parse/text-extract';

describe('text-extract', () => {
  it('classifies text-like and pdf extensions', () => {
    expect(isTextLike('a.txt')).toBe(true);
    expect(isTextLike('a.html')).toBe(true);
    expect(isTextLike('a.eml')).toBe(true);
    expect(isTextLike('a.pdf')).toBe(false);
    expect(isPdf('a.PDF')).toBe(true);
    expect(isPdf('a.txt')).toBe(false);
  });

  it('decodes plain text', async () => {
    expect(await extractText(Buffer.from('hello world'), 'a.txt')).toBe('hello world');
  });

  it('strips markup from html/eml', async () => {
    const html = '<html><style>x{}</style><body><p>Flight AB123</p><script>1</script></body></html>';
    const out = await extractText(Buffer.from(html), 'a.html');
    expect(out).toContain('Flight AB123');
    expect(out).not.toContain('<p>');
    expect(out).not.toContain('x{}');
  });

  it('extracts the embedded text layer from a pdf', async () => {
    const out = await extractText(Buffer.from('%PDF-1.4'), 'a.pdf');
    expect(out).toBe('Hotel X — confirmation ABC');
    expect(getText).toHaveBeenCalled();
  });
});
