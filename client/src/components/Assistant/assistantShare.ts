import type { AssistantMessage } from '@trek/shared';

import { messageBlocks } from './assistantParts';
import { verbLookOf } from './cards/cardLooks';

/**
 * What an answer says once it goes to the trip chat, which shows plain text:
 * the Markdown read as text, optionally a line per change the user applied,
 * cut to fit a chat message. Pure, so the preview shows exactly what is sent.
 */

/** Room left below the chat's 5000 characters, so the cut and its mark always fit. */
export const SHARE_MAX_CHARS = 4800;

type Translate = (key: string, params?: Record<string, string | number>) => string;

/** What a divider cell holds once trimmed: dashes, with a colon at either end for alignment. */
const RULE_CELL = /^:?-*:?$/;

/** A table's divider row (`|---|:--:|`), which has no words. Read cell by cell, so no pattern backtracks over it. */
function isTableRule(line: string): boolean {
  const cells = (line.startsWith('|') ? line.slice(1) : line).split('|');
  const last = cells.pop() ?? '';
  if (cells.length === 0 || !RULE_CELL.test(last.trim())) return false;
  return cells.every((cell) => {
    const trimmed = cell.trim();
    return trimmed.includes('-') && RULE_CELL.test(trimmed);
  });
}

/** One table row as its cells in a line. */
function tableRow(line: string): string {
  return line
    .replace(/^\|/, '')
    .replace(/\|$/, '')
    .split('|')
    .map((cell) => cell.trim())
    .filter(Boolean)
    .join(', ');
}

/**
 * Rewrites every `[text](url)` of a line (with a leading `!` for a picture), found by scanning:
 * a `[` and the first `]` after it decide the match, so a long line of brackets is read once.
 */
function rewriteBrackets(line: string, picture: boolean, build: (text: string, url: string) => string): string {
  let out = '';
  let from = 0;
  let paren = -1;
  let open = line.indexOf('[');
  while (open !== -1) {
    if (picture && (open === 0 || line[open - 1] !== '!')) {
      open = line.indexOf('[', open + 1);
      continue;
    }
    const close = line.indexOf(']', open + 1);
    if (close === -1) break;
    let next = close;
    if (line[close + 1] === '(') {
      if (paren < close + 2) paren = line.indexOf(')', close + 2);
      if (paren === -1) break;
      let clean = true;
      for (let at = close + 2; at < paren && clean; at++) clean = !/\s/.test(line.charAt(at));
      const text = line.slice(open + 1, close);
      const url = line.slice(close + 2, paren);
      if (clean && (picture || (text !== '' && url !== ''))) {
        out += line.slice(from, picture ? open - 1 : open) + build(text, url);
        from = paren + 1;
        next = paren;
      }
    }
    open = line.indexOf('[', next + 1);
  }
  return out + line.slice(from);
}

/** The marks of one line of running text: emphasis, code, links and pictures. */
function inline(line: string): string {
  const pictures = rewriteBrackets(line, true, (text) => text);
  return rewriteBrackets(pictures, false, (text, url) => (text === url ? url : `${text} (${url})`))
    .replace(/\*\*([^*]+)\*\*/g, '$1')
    .replace(/__([^_]+)__/g, '$1')
    .replace(/(^|[^\w*])\*([^*\s][^*]*)\*/g, '$1$2')
    .replace(/`([^`]+)`/g, '$1');
}

/** One line of Markdown as text, or null for a line that only carries layout (a fence, a table rule). */
function plainLine(line: string): string | null {
  if (/^\s*(?:```|~~~)/.test(line)) return null;
  if (isTableRule(line.trim())) return null;
  const heading = /^\s{0,3}#{1,6}\s(.*)$/.exec(line);
  if (heading) return inline((heading[1] ?? '').trimStart());
  const bullet = /^(\s*)[-*+]\s(.*)$/.exec(line);
  if (bullet) return `${bullet[1] ?? ''}• ${inline((bullet[2] ?? '').trimStart())}`;
  const quote = /^\s*>\s?(.*)$/.exec(line);
  if (quote) return inline(quote[1] ?? '');
  if (line.trim().startsWith('|')) return tableRow(inline(line));
  return inline(line);
}

/** Markdown as the chat shows it, as plain text. Code keeps its lines; blank runs shrink to one empty line. */
export function markdownToText(markdown: string): string {
  const lines: string[] = [];
  let inCode = false;
  for (const line of markdown.split('\n')) {
    if (/^\s*(?:```|~~~)/.test(line)) {
      inCode = !inCode;
      continue;
    }
    if (inCode) {
      lines.push(line);
      continue;
    }
    const text = plainLine(line);
    if (text !== null) lines.push(text.trimEnd());
  }
  return lines
    .join('\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

/** The text cut to `max` characters at the last line or word end before it, marked with an ellipsis. */
function cut(text: string, max: number): { text: string; truncated: boolean } {
  if (text.length <= max) return { text, truncated: false };
  const head = text.slice(0, max - 1);
  const at = Math.max(head.lastIndexOf('\n'), head.lastIndexOf(' '));
  // A break far back would drop much of the answer; then the cut goes through the word.
  const end = at > max * 0.8 ? at : head.length;
  return { text: `${head.slice(0, end).trimEnd()}…`, truncated: true };
}

interface ShareText {
  text: string;
  truncated: boolean;
  /** The answer has applied changes, so "Add the changes" is worth offering. */
  hasChanges: boolean;
}

/**
 * The chat message an answer becomes: its text, then, when `includeChanges`
 * is on, the applied changes in a short list under a heading. Discarded,
 * failed and expired changes never go along.
 */
export function chatTextOf(message: AssistantMessage, opts: { includeChanges: boolean; t: Translate }): ShareText {
  const blocks = messageBlocks(message, false);
  const body = markdownToText(blocks.flatMap((b) => (b.kind === 'text' ? [b.text] : [])).join('\n\n'));
  const previews = blocks.flatMap((b) =>
    b.kind === 'change' ? b.items.flatMap((i) => (i.state === 'applied' && i.preview ? [i.preview] : [])) : []
  );
  // Named by its verb, as the share text always was; a card never goes along (it may hold what is private).
  const lines = previews.map((p) => `✓ ${opts.t(verbLookOf(p.verbKey).labelKey)}: ${p.subject}`);
  const heading = opts.t('assistant.share.changesHeading');
  const changes = opts.includeChanges && lines.length > 0 ? [heading, ...lines].join('\n') : '';
  const full = [body, changes].filter(Boolean).join('\n\n');
  return { ...cut(full, SHARE_MAX_CHARS), hasChanges: lines.length > 0 };
}
