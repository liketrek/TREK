import { Request, Response, NextFunction } from 'express';
import { db } from '../db/database';
import { extractToken, verifyJwtAndLoadUser } from './auth';
import { DEMO_EMAILS } from '../services/demo';

/** Paths that never require MFA (public or pre-auth). */
export function isPublicApiPath(method: string, pathNoQuery: string): boolean {
  if (method === 'GET' && pathNoQuery === '/api/health') return true;
  if (method === 'GET' && pathNoQuery === '/api/auth/app-config') return true;
  if (method === 'POST' && pathNoQuery === '/api/auth/login') return true;
  if (method === 'POST' && pathNoQuery === '/api/auth/register') return true;
  if (method === 'POST' && pathNoQuery === '/api/auth/demo-login') return true;
  if (method === 'GET' && pathNoQuery.startsWith('/api/auth/invite/')) return true;
  if (method === 'POST' && pathNoQuery === '/api/auth/mfa/verify-login') return true;
  // Unauthenticated passkey (primary) login ceremony.
  if (method === 'POST' && pathNoQuery === '/api/auth/passkey/login/options') return true;
  if (method === 'POST' && pathNoQuery === '/api/auth/passkey/login/verify') return true;
  if (pathNoQuery.startsWith('/api/auth/oidc/')) return true;
  return false;
}

/** Authenticated paths allowed while MFA is not yet enabled (setup + lockout recovery). */
export function isMfaSetupExemptPath(method: string, pathNoQuery: string): boolean {
  if (method === 'GET' && pathNoQuery === '/api/auth/me') return true;
  if (method === 'POST' && pathNoQuery === '/api/auth/mfa/setup') return true;
  if (method === 'POST' && pathNoQuery === '/api/auth/mfa/enable') return true;
  // Allow enrolling a passkey as the second factor (a user-verified passkey
  // satisfies require_mfa), so a fresh user under the policy isn't stuck.
  if (method === 'POST' && pathNoQuery === '/api/auth/passkey/register/options') return true;
  if (method === 'POST' && pathNoQuery === '/api/auth/passkey/register/verify') return true;
  if (method === 'GET' && pathNoQuery === '/api/auth/passkey/credentials') return true;
  if ((method === 'GET' || method === 'PUT') && pathNoQuery === '/api/auth/app-settings') return true;
  return false;
}

/**
 * When app_settings.require_mfa is true, block API access for users without MFA enabled,
 * except for public routes and MFA setup endpoints.
 */
export function enforceGlobalMfaPolicy(req: Request, res: Response, next: NextFunction): void {
  const pathNoQuery = (req.originalUrl || req.url || '').split('?')[0];

  if (!pathNoQuery.startsWith('/api')) {
    next();
    return;
  }

  if (isPublicApiPath(req.method, pathNoQuery)) {
    next();
    return;
  }

  // Accept both the httpOnly session cookie (regular SPA users) and the
  // Authorization header (MCP / API clients). Previously this only looked
  // at the header so every normal cookie-authenticated session sailed
  // past `require_mfa` unchecked.
  const token = extractToken(req);
  if (!token) {
    next();
    return;
  }

  // Use the shared verify helper so the `password_version` gate applies
  // here too — a JWT stolen before a password reset would otherwise
  // continue to satisfy this middleware until its natural 24h expiry.
  const verified = verifyJwtAndLoadUser(token);
  if (!verified) {
    next();
    return;
  }
  const userId = verified.id;

  const requireRow = db.prepare("SELECT value FROM app_settings WHERE key = 'require_mfa'").get() as { value: string } | undefined;
  if (requireRow?.value !== 'true') {
    next();
    return;
  }

  if (process.env.DEMO_MODE?.toLowerCase() === 'true' && verified.email && DEMO_EMAILS.has(verified.email)) {
    next();
    return;
  }

  const row = db.prepare('SELECT mfa_enabled FROM users WHERE id = ?').get(userId) as
    | { mfa_enabled: number | boolean }
    | undefined;
  if (!row) {
    next();
    return;
  }

  // A user-verified passkey is phishing-resistant and inherently two-factor, so
  // owning at least one satisfies the require_mfa policy exactly like TOTP does.
  // (All stored passkeys were registered with userVerification required.)
  const mfaOk = row.mfa_enabled === 1 || row.mfa_enabled === true;
  const passkeyOk = !!db.prepare('SELECT 1 FROM webauthn_credentials WHERE user_id = ? LIMIT 1').get(userId);
  if (mfaOk || passkeyOk) {
    next();
    return;
  }

  if (isMfaSetupExemptPath(req.method, pathNoQuery)) {
    next();
    return;
  }

  res.status(403).json({
    error: 'Two-factor authentication is required. Complete setup in Settings.',
    code: 'MFA_REQUIRED',
  });
}
