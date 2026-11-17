import { nulFreeInput } from '../../db/nul-free';
import { Injectable, type PipeTransform } from '@nestjs/common';

import type { NextFunction, Request, Response } from 'express';

/**
 * Where a request's input loses its NUL characters before any logic runs.
 *
 * The database stores no U+0000 on either engine (`db/nul-free.ts`), so a
 * value that still carries one in the application is a different value from
 * the one a lookup or a write uses: a throttle keyed on it, a rate-limit
 * bucket, a uniqueness pre-check or a comparison with a stored row sees one
 * spelling while the database sees another. Normalising at the edge makes the
 * two agree, and keeps the database's own stripping as the backstop for what
 * does not arrive through a request (an import, a provider's feed, a plugin).
 *
 * The edges, each passing what it parsed through {@link nulFreeInput}:
 * - {@link nulFreeRequest}, mounted in `bootstrap.ts` right after the body
 *   parsers and before the request context, so every guard, interceptor and
 *   controller after it reads a clean path, query string, body and cookies;
 * - {@link NulFreeInputPipe}, the first global pipe, for what a route parses
 *   itself after that middleware: the fields and file names of a multipart
 *   upload, which multer sets inside the route's interceptor;
 * - the websocket adapter, for every frame (`realtime/trek-ws.adapter.ts`);
 * - the MCP registry's input mapper (`trekMcpInputMapper` in
 *   `mcp/nest-mcp-policy.ts`), for the arguments of every tool, prompt and
 *   resource template, since /mcp keeps its raw body.
 *
 * Headers need nothing: Node's HTTP parser answers 400 to a header value that
 * holds a NUL before TREK sees the request. A cookie is percent-decoded by
 * cookie-parser, so `%00` in one becomes a NUL, and is cleaned here.
 */

/** `url` without a percent-encoded NUL, repeated so `%%0000` cannot leave one behind. */
export function withoutEncodedNul(url: string): string {
  let out = url;
  while (out.includes('%00')) out = out.replaceAll('%00', '');
  return out;
}

/**
 * The HTTP edge. The path and the query string are cleaned in the URL itself,
 * before the router decodes either: Express reads `req.query` from `req.url`
 * on every access and fills the route parameters from it when a route
 * matches, so both come out without NUL. A NUL can only reach a URL as `%00`,
 * since Node refuses a raw one in the request line. `req.originalUrl` keeps
 * what the client sent, for the access log.
 */
export function nulFreeRequest(req: Request, _res: Response, next: NextFunction): void {
  req.url = withoutEncodedNul(req.url);
  if (req.body !== undefined) req.body = nulFreeInput(req.body);
  const withCookies = req as Request & { cookies?: unknown; signedCookies?: unknown };
  if (withCookies.cookies !== undefined) withCookies.cookies = nulFreeInput(withCookies.cookies);
  if (withCookies.signedCookies !== undefined) withCookies.signedCookies = nulFreeInput(withCookies.signedCookies);
  next();
}

/**
 * The same rule for every argument a route handler receives. After
 * {@link nulFreeRequest} it only changes what the route parsed itself (a
 * multipart body and its files); everything else already holds no NUL and
 * comes back as the same value.
 */
@Injectable()
export class NulFreeInputPipe implements PipeTransform {
  transform(value: unknown): unknown {
    return nulFreeInput(value);
  }
}
