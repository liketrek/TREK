import { Request, Response } from 'express';
import { SESSION_DURATION_MS } from '../config';

const COOKIE_NAME = 'trek_session';

/**
 * Decide whether the session cookie should carry the `Secure` flag.
 *
 * We previously only derived this from `NODE_ENV=production` or
 * `FORCE_HTTPS=true`. That left behind a common self-host setup:
 * TREK running behind Traefik / Caddy / Cloudflare Tunnel with
 * `NODE_ENV=development` locally and no `FORCE_HTTPS` — the cookie
 * went out without `Secure`, even though the public leg was https.
 *
 * Now we also honour `req.secure`, which Express derives from
 * `X-Forwarded-Proto` once `trust proxy` is set (TREK sets it to `1`
 * in production automatically). If Express sees the request was TLS
 * on the outermost hop, the cookie is `Secure`. `COOKIE_SECURE=false`
 * remains the explicit escape hatch for plain-HTTP LAN testing.
 */
export function cookieOptions(clear = false, req?: Request) {
  if (process.env.COOKIE_SECURE?.toLowerCase() === 'false') {
    return buildOptions(clear, false);
  }
  const envSecure = process.env.NODE_ENV?.toLowerCase() === 'production' || process.env.FORCE_HTTPS?.toLowerCase() === 'true';
  const requestSecure = req?.secure === true;
  return buildOptions(clear, envSecure || requestSecure);
}

function buildOptions(clear: boolean, secure: boolean) {
  return {
    httpOnly: true,
    secure,
    sameSite: 'lax' as const,
    path: '/',
    ...(clear ? {} : { maxAge: SESSION_DURATION_MS }), // matches the JWT expiry (SESSION_DURATION)
  };
}

export function setAuthCookie(res: Response, token: string, req?: Request): void {
  res.cookie(COOKIE_NAME, token, cookieOptions(false, req));
}

export function clearAuthCookie(res: Response, req?: Request): void {
  res.clearCookie(COOKIE_NAME, cookieOptions(true, req));
}
