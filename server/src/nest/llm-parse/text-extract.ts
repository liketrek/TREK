import { extname } from 'node:path';
import { PDFParse } from 'pdf-parse';

/** File extensions whose bytes are inherently text and can be decoded directly. */
const TEXT_LIKE = new Set(['.txt', '.html', '.htm', '.eml']);

export function isTextLike(fileName: string): boolean {
  return TEXT_LIKE.has(extname(fileName).toLowerCase());
}

export function isPdf(fileName: string): boolean {
  return extname(fileName).toLowerCase() === '.pdf';
}

/** Strip HTML/XML tags and collapse whitespace for a cleaner LLM prompt. */
function stripMarkup(s: string): string {
  return s
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/gi, ' ')
    .replace(/[ \t]+/g, ' ')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

/** Extract the embedded text layer from a PDF (empty for scanned/image-only PDFs). */
async function extractPdfText(buffer: Buffer): Promise<string> {
  const parser = new PDFParse({ data: new Uint8Array(buffer) });
  try {
    // Space (not tab) between same-line items reads more naturally for the LLM.
    const res = await parser.getText({ cellSeparator: ' ' });
    return cleanPdfText(res.text ?? '');
  } finally {
    await parser.destroy?.();
  }
}

/**
 * Clean up pdf-parse output for the LLM:
 *  - strip `-- N of M --` page markers
 *  - normalize whitespace/tabs
 *  - collapse letter-spaced UPPERCASE runs ("A M S T E R D A M" → "AMSTERDAM"),
 *    a common PDF kerning artifact that otherwise hides booking fields
 */
function cleanPdfText(text: string): string {
  return text
    .replace(/^\s*-+\s*\d+\s+of\s+\d+\s*-+\s*$/gim, '')
    .replace(/[ \t]+/g, ' ')
    .replace(/\b(?:[A-Z] ){2,}[A-Z]\b/g, m => m.replace(/ /g, ''))
    .replace(/ *\n */g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

/**
 * Extract text from a booking file for the OpenAI-compatible/local LLM path
 * (Ollama can't ingest PDFs or `file` parts, so everything becomes text).
 *  - txt/html/htm/eml → decoded (markup stripped)
 *  - pdf              → embedded text layer via pdf-parse
 *  - anything else    → best-effort UTF-8 decode
 * A scanned/image-only PDF yields empty text — that case needs a vision provider
 * (Anthropic reads PDFs natively).
 */
export async function extractText(buffer: Buffer, fileName: string): Promise<string> {
  const ext = extname(fileName).toLowerCase();
  if (isPdf(fileName)) return extractPdfText(buffer);
  const raw = buffer.toString('utf8');
  if (ext === '.html' || ext === '.htm' || ext === '.eml') return stripMarkup(raw);
  return raw.trim();
}
