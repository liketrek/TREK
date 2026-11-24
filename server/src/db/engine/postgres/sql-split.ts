/**
 * Splits generated DDL into single statements, so one statement Postgres
 * refuses does not take the rest of the schema with it.
 *
 * Understood: `;` outside quotes, `'` and `"` quoted text, and the `$$` dollar
 * quote a function body is written in, which is the only dollar quote TREK's
 * generated DDL and baseline contain. A tagged dollar quote (`$tag$`) is not
 * understood, so it is refused rather than split inside.
 */

/** A tagged dollar quote (`$tag$`), matched where the scan stands. */
const TAGGED_DOLLAR_QUOTE = /\$[A-Za-z_]\w*\$/y;

function refuseTaggedDollarQuote(sql: string, at: number): void {
  TAGGED_DOLLAR_QUOTE.lastIndex = at;
  const tag = TAGGED_DOLLAR_QUOTE.exec(sql)?.[0];
  if (tag) throw new Error(`splitStatements understands only the $$ dollar quote, not ${tag} (at ${at})`);
}

/**
 * The statements in `sql`, trimmed and in order. A statement that sets a
 * session parameter (`SET ...`) is dropped: a dump's preamble, which a schema
 * the entities generate never needs.
 */
export function splitStatements(sql: string): string[] {
  const statements: string[] = [];
  let current = '';
  let quote: '"' | "'" | '$$' | null = null;
  for (let i = 0; i < sql.length; i++) {
    const char = sql[i];
    const dollar = sql.startsWith('$$', i);
    if (quote === '$$') {
      if (dollar) {
        quote = null;
        current += '$';
        i++;
      }
      current += char;
    } else if (quote) {
      if (char === quote) quote = null;
      current += char;
    } else if (dollar) {
      quote = '$$';
      current += '$$';
      i++;
    } else if (char === "'" || char === '"') {
      quote = char;
      current += char;
    } else if (char === ';') {
      if (current.trim()) statements.push(current.trim());
      current = '';
    } else {
      if (char === '$') refuseTaggedDollarQuote(sql, i);
      current += char;
    }
  }
  if (current.trim()) statements.push(current.trim());
  return statements.filter((statement) => !/^set\s/i.test(statement));
}
