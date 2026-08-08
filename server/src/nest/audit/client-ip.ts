import { Request } from 'express';

/**
 * Pure request helper — no DB, no side effects — kept out of the injectable
 * AuditService so getClientIp-only consumers stay plain-function imports
 * (same carve-out precedent as files.constants.ts).
 */
export function getClientIp(req: Request): string | null {
  const xff = req.headers['x-forwarded-for'];
  if (typeof xff === 'string') {
    const first = xff.split(',')[0]?.trim();
    return first || null;
  }
  if (Array.isArray(xff) && xff[0]) return String(xff[0]).trim() || null;
  return req.socket?.remoteAddress || null;
}
