import { Request } from 'express';

/**
 * Pure request helper — no DB, no side effects — kept out of the injectable
 * AuditService so getClientIp-only consumers stay plain-function imports
 * (same carve-out precedent as files.constants.ts).
 *
 * It honours `trust proxy` (set in globalMiddleware from TRUST_PROXY, one hop by
 * default) rather than reading X-Forwarded-For itself. The leftmost entry of
 * that header is whatever the client typed, and this value ends up on the audit
 * rows an operator reads after an incident — the one place a caller must not be
 * able to dictate. With trust proxy off, req.ip is the socket address anyway.
 */
export function getClientIp(req: Request): string | null {
  return req.ip?.trim() || req.socket?.remoteAddress || null;
}
