/**
 * Reads the fields of a multipart request body without going through
 * `Request.formData()`.
 *
 * Uploads in this app go out through axios' XHR adapter, and the body jsdom
 * produces for that is one Node's multipart parser refuses on the CI runner
 * (Node 24) while accepting it locally (Node 22) — the handler then throws
 * before it ever sees a field. Reading the raw payload keeps the assertion on
 * what was actually sent and takes the parser out of the picture.
 *
 * The body is a stream and can only be read once, so this returns everything in
 * one pass. File parts are reported by filename rather than by content.
 */
export interface MultipartBody {
  /** Plain text fields, by name. */
  fields: Record<string, string>;
  /** Names of the uploaded files, in the order they were appended. */
  filenames: string[];
}

export async function readMultipart(request: Request): Promise<MultipartBody> {
  const body = await request.text();
  const boundary = request.headers.get('content-type')?.match(/boundary=(?:"([^"]+)"|([^;]+))/i);
  const marker = boundary ? `--${(boundary[1] ?? boundary[2]).trim()}` : null;

  const fields: Record<string, string> = {};
  const filenames: string[] = [];

  // Without a boundary there is nothing reliable to split on — hand back an
  // empty result so the assertion fails on the value rather than on a throw.
  if (!marker) return { fields, filenames };

  for (const part of body.split(marker).slice(1)) {
    const name = part.match(/name="([^"]*)"/)?.[1];
    if (!name) continue;
    const filename = part.match(/filename="([^"]*)"/)?.[1];
    if (filename !== undefined) { filenames.push(filename); continue; }
    // Headers, blank line, then the value up to the trailing CRLF.
    fields[name] = part.match(/\r?\n\r?\n([\s\S]*?)\r?\n?$/)?.[1] ?? '';
  }
  return { fields, filenames };
}
