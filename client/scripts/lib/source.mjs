/*
 * Reading source the way the line ratchets need it: with the comments blanked
 * out, and telling a disable marker in a comment from the same text in code.
 * Shared by lint:rtl (scripts/lib/rtl.mjs) and theme:lint (scripts/lib/theme.mjs).
 */
import ts from 'typescript';

/**
 * The source with its comments blanked out, so prose like "top right" or
 * "left out" is no side. TypeScript finds the comments in a .ts/.tsx file,
 * which keeps `/*` and `//` inside strings and JSX text where they belong
 * (accept="image/*", a URL); a stylesheet only has block comments.
 */
export function withoutComments(source, file) {
  const chars = source.split('');
  const blank = (pos, end) => {
    for (let i = pos; i < end; i++) if (chars[i] !== '\n') chars[i] = ' ';
  };
  if (file.endsWith('.css')) {
    for (const m of source.matchAll(/\/\*[\s\S]*?\*\//g)) blank(m.index, m.index + m[0].length);
    return chars.join('');
  }
  const kind = file.endsWith('.tsx') ? ts.ScriptKind.TSX : ts.ScriptKind.TS;
  const sf = ts.createSourceFile(file, source, ts.ScriptTarget.Latest, true, kind);
  const seen = new Set();
  const take = (ranges) => {
    for (const r of ranges ?? []) {
      if (seen.has(r.pos)) continue;
      seen.add(r.pos);
      blank(r.pos, r.end);
    }
  };
  const visit = (node) => {
    take(ts.getLeadingCommentRanges(source, node.pos));
    take(ts.getTrailingCommentRanges(source, node.end));
    // JSX text holds no comments, and asking for them there would read `//` in a URL as one.
    if (!ts.isJsxText(node)) for (const child of node.getChildren(sf)) visit(child);
  };
  visit(sf);
  take(ts.getLeadingCommentRanges(source, sf.endOfFileToken.pos));
  return chars.join('');
}

/**
 * Whether line carries marker inside a comment; in a string or in code it is no
 * marker. code is the same line from withoutComments.
 */
export function markedInComment(line, code, marker) {
  for (let at = line.indexOf(marker); at !== -1; at = line.indexOf(marker, at + 1)) {
    if (!code.slice(at, at + marker.length).trim()) return true;
  }
  return false;
}
