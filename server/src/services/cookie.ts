import { Request, Response } from 'express';
import { SESSION_DURATION_MS, SESSION_DURATION_REMEMBER_MS } from '../config';

const COOKIE_NAME = 'trek_session';

/**
 * Controls the cookie lifetime for a login:
 *  - `undefined` → persistent `maxAge: SESSION_DURATION_MS` (the historical
 *    default, used by register/demo and anything that doesn't opt in).
 *  - `true`  → persistent `maxAge: SESSION_DURATION_REMEMBER_MS` ("Remember me").
 *  - `false` → no `maxAge` — a browser-session cookie cleared on browser close.
 */
export type RememberOption = boolean | undefined;

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
export function cookieOptions(clear = false, req?: Request, remember?: RememberOption) {
  if (process.env.COOKIE_SECURE?.toLowerCase() === 'false') {
    return buildOptions(clear, false, remember);
  }
  const envSecure = process.env.NODE_ENV?.toLowerCase() === 'production' || process.env.FORCE_HTTPS?.toLowerCase() === 'true';
  const requestSecure = req?.secure === true;
  return buildOptions(clear, envSecure || requestSecure, remember);
}

function resolveMaxAge(remember: RememberOption): { maxAge: number } | Record<string, never> {
  // false → session cookie (omit maxAge); true → the longer "remember me"
  // window; undefined → the historical default. Each maxAge matches the JWT exp.
  if (remember === false) return {};
  if (remember === true) return { maxAge: SESSION_DURATION_REMEMBER_MS };
  return { maxAge: SESSION_DURATION_MS };
}

function buildOptions(clear: boolean, secure: boolean, remember?: RememberOption) {
  return {
    httpOnly: true,
    secure,
    sameSite: 'lax' as const,
    path: '/',
    ...(clear ? {} : resolveMaxAge(remember)),
  };
}

export function setAuthCookie(res: Response, token: string, req?: Request, remember?: RememberOption): void {
  res.cookie(COOKIE_NAME, token, cookieOptions(false, req, remember));
}

export function clearAuthCookie(res: Response, req?: Request): void {
  res.clearCookie(COOKIE_NAME, cookieOptions(true, req));
}
