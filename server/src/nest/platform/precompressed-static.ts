import express, { type NextFunction, type Request, type Response } from 'express';
import { readdirSync } from 'node:fs';
import path from 'node:path';

const BROTLI_SUFFIX = '.br';

/** Every URL under `urlPrefix` whose file has a Brotli copy beside it. A missing directory holds none. */
function collectPrecompressed(dir: string, urlPrefix: string, into: Set<string>): Set<string> {
  let entries;
  try {
    entries = readdirSync(dir, { withFileTypes: true });
  } catch {
    return into;
  }
  for (const entry of entries) {
    if (entry.isDirectory()) collectPrecompressed(path.join(dir, entry.name), `${urlPrefix}${entry.name}/`, into);
    else if (entry.name.endsWith(BROTLI_SUFFIX)) into.add(`${urlPrefix}${entry.name.slice(0, -BROTLI_SUFFIX.length)}`);
  }
  return into;
}

/** The Content-Type the static handler gives the original file, charset included, from the same table. */
function contentTypeOf(file: string): string {
  const { mime } = express.static;
  const type = mime.lookup(file);
  const charset = mime.charsets.lookup(type, '');
  return charset ? `${type}; charset=${charset}` : type;
}

/**
 * Hands a browser that accepts Brotli the copy the client build wrote beside a hashed
 * asset (`<file>.br`, client/scripts/precompress.mjs) instead of compressing the file
 * again on every download.
 *
 * It only points the request at the copy and sets the two headers the static handler
 * behind it cannot know (the type of the original file, the encoding); that handler
 * still sends the file, with its own caching headers, ETag and conditional requests.
 * The compression middleware leaves a response that already names its encoding alone.
 *
 * The copies are listed from disk once, at startup, so only a file the build produced
 * is ever rewritten, whatever the request path looks like, and a build without copies
 * (a source checkout that skipped the postbuild step) is served as before. A range
 * request gets the uncompressed file: its offsets mean the original bytes.
 */
export function precompressedStatic(assetsDir: string, urlPrefix = '/assets/') {
  const precompressed = collectPrecompressed(assetsDir, urlPrefix, new Set<string>());
  return (req: Request, res: Response, next: NextFunction): void => {
    if ((req.method !== 'GET' && req.method !== 'HEAD') || !precompressed.has(req.path)) return next();
    // Said for every answer under this URL, so a cache never hands the Brotli bytes
    // to a client that did not ask for them.
    res.vary('Accept-Encoding');
    if (req.headers.range || !req.acceptsEncodings('br')) return next();
    res.setHeader('Content-Type', contentTypeOf(req.path));
    res.setHeader('Content-Encoding', 'br');
    req.url = `${req.path}${BROTLI_SUFFIX}${req.url.slice(req.path.length)}`;
    next();
  };
}
