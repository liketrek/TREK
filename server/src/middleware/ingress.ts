import { Request } from 'express';

/**
 * Detect Home Assistant Ingress proxied requests via the Supervisor-set
 * `X-Ingress-Path` header. Returns the prefix without trailing slash, or
 * null when the request did not originate from Ingress.
 *
 * Supervisor sets this header on every request it proxies to an add-on
 * with `ingress: true`. Standalone deployments never see it, so the
 * returned null value makes every Ingress-aware code path a no-op there.
 */
export function ingressPath(req: Request): string | null {
  const p = req.header('X-Ingress-Path');
  if (p && p.startsWith('/api/hassio_ingress/')) return p.replace(/\/$/, '');
  return null;
}
