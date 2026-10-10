/** One block of a release body: a heading, a paragraph, or a run of list items. */
export type ReleaseNoteBlock = { kind: 'h3' | 'h4' | 'p'; text: string } | { kind: 'ul'; items: string[] };

/** Escapes the characters that would let release text break out of the HTML it is placed in. */
export function escapeReleaseHtml(str: string): string {
  return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

/**
 * Splits a GitHub release body into the blocks both admin shells render: `### ` and `## `
 * headings, `- ` or `* ` list items gathered into one list until anything else breaks the
 * run, and every other non-empty line as a paragraph. Blank lines only end a list. The
 * text stays raw; each shell formats it inline itself.
 */
export function parseReleaseNotes(body: string): ReleaseNoteBlock[] {
  const blocks: ReleaseNoteBlock[] = [];
  let listItems: string[] = [];

  const flushList = () => {
    if (listItems.length > 0) {
      blocks.push({ kind: 'ul', items: listItems });
      listItems = [];
    }
  };

  for (const line of body.split('\n')) {
    const trimmed = line.trim();
    if (!trimmed) {
      flushList();
      continue;
    }

    if (trimmed.startsWith('### ')) {
      flushList();
      blocks.push({ kind: 'h4', text: trimmed.slice(4) });
    } else if (trimmed.startsWith('## ')) {
      flushList();
      blocks.push({ kind: 'h3', text: trimmed.slice(3) });
    } else if (/^[-*] /.test(trimmed)) {
      listItems.push(trimmed.slice(2));
    } else {
      flushList();
      blocks.push({ kind: 'p', text: trimmed });
    }
  }
  flushList();
  return blocks;
}
