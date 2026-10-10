/**
 * Cuts a SQL script after each semicolon that ends a statement: one outside a quoted
 * string or identifier ('…', "…", `…`, […]) and outside a comment. The pieces keep
 * their text, so joining them gives the script back.
 *
 * A semicolon inside a trigger body (`CREATE TRIGGER … BEGIN …; END;`) ends a piece
 * here as well. Telling it apart takes SQLite's own parser, so the caller does that:
 * it prepares the pieces it has gathered so far and keeps gathering while SQLite
 * reports them as incomplete input.
 *
 * Pure, no imports: plugin-data.service.ts runs a plugin's exec() script through it,
 * one statement at a time, so the time budget can be checked between statements.
 */
export function splitAfterSemicolons(sql: string): string[] {
  const pieces: string[] = [];
  let start = 0;
  let i = 0;
  while (i < sql.length) {
    const skipTo = endOfQuotedOrComment(sql, i);
    if (skipTo !== i) {
      i = skipTo;
      continue;
    }
    i += 1;
    if (sql[i - 1] === ';') {
      pieces.push(sql.slice(start, i));
      start = i;
    }
  }
  if (start < sql.length) pieces.push(sql.slice(start));
  return pieces;
}

/**
 * Where the quoted string, quoted identifier or comment starting at `i` ends (the index
 * after it), or `i` itself when none starts there. An unterminated one runs to the end.
 */
function endOfQuotedOrComment(sql: string, i: number): number {
  const c = sql[i];
  if (c === "'" || c === '"' || c === '`') return endOfQuoted(sql, i, c);
  if (c === '[') return endAfter(sql, ']', i + 1);
  if (c === '-' && sql[i + 1] === '-') return endAfter(sql, '\n', i + 2);
  if (c === '/' && sql[i + 1] === '*') return endAfter(sql, '*/', i + 2);
  return i;
}

/** The index after `token`'s first occurrence from `from`, or the end of `sql`. */
function endAfter(sql: string, token: string, from: number): number {
  const at = sql.indexOf(token, from);
  return at < 0 ? sql.length : at + token.length;
}

/** A quote doubled inside the quoted text stands for itself and does not close it. */
function endOfQuoted(sql: string, i: number, quote: string): number {
  let j = i + 1;
  while (j < sql.length) {
    if (sql[j] !== quote) {
      j += 1;
    } else if (sql[j + 1] === quote) {
      j += 2;
    } else {
      return j + 1;
    }
  }
  return sql.length;
}
