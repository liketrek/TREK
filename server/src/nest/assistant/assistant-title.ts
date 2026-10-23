/** The longest title a thread gets from its first message. */
export const THREAD_TITLE_CHARS = 60;

/** What a cut title does not end on before its ellipsis. */
const TRAILING = new Set([' ', '.', ',', ';', ':', '!', '?', '-']);

/**
 * A thread's title: its first message on one line, cut at the last word that
 * fits in 60 characters (or hard at 60 when a single word is longer), with an
 * ellipsis when anything was cut. No model is asked.
 */
export function titleFrom(text: string): string {
  const line = text.replace(/\s+/g, ' ').trim();
  if (line.length <= THREAD_TITLE_CHARS) return line;
  const head = line.slice(0, THREAD_TITLE_CHARS);
  const space = head.lastIndexOf(' ');
  const cut = space > THREAD_TITLE_CHARS / 2 ? head.slice(0, space) : head;
  let end = cut.length;
  while (end > 0 && TRAILING.has(cut[end - 1])) end--;
  return `${cut.slice(0, end)}…`;
}
