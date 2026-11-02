/**
 * A connection URL fit for a log line: the password masked and the query
 * dropped, since libpq reads a password from the query too
 * (`?password=...`). A value that does not parse is not echoed at all.
 */
export function redactUrl(url: string): string {
  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    return '<unparseable URL>';
  }
  if (parsed.password) parsed.password = '***';
  parsed.search = '';
  parsed.hash = '';
  return parsed.toString();
}
