import express, { Request, Response, NextFunction } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import { v4 as uuid } from 'uuid';
import { authenticate, optionalAuth, demoUploadBlock } from '../middleware/auth';
import { ingressPath } from '../middleware/ingress';
import { AuthRequest, OptionalAuthRequest } from '../types';
import { writeAudit, getClientIp } from '../services/auditLog';
import { setAuthCookie, clearAuthCookie } from '../services/cookie';
import { db } from '../db/database';
import {
  getAppConfig,
  demoLogin,
  validateInviteToken,
  registerUser,
  loginUser,
  getCurrentUser,
  changePassword,
  deleteAccount,
  updateMapsKey,
  updateApiKeys,
  updateSettings,
  getSettings,
  saveAvatar,
  deleteAvatar,
  listUsers,
  validateKeys,
  getAppSettings,
  updateAppSettings,
  getTravelStats,
  setupMfa,
  enableMfa,
  disableMfa,
  verifyMfaLogin,
  listMcpTokens,
  createMcpToken,
  deleteMcpToken,
  createWsToken,
  createResourceToken,
  requestPasswordReset,
  resetPassword,
  generateToken,
} from '../services/authService';
import { sendPasswordResetEmail, getAppUrl } from '../services/notifications';

const router = express.Router();

// ---------------------------------------------------------------------------
// Avatar upload (multer config stays in route — middleware concern)
// ---------------------------------------------------------------------------

const avatarDir = path.join(__dirname, '../../uploads/avatars');
if (!fs.existsSync(avatarDir)) fs.mkdirSync(avatarDir, { recursive: true });

const avatarStorage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, avatarDir),
  filename: (_req, file, cb) => cb(null, uuid() + path.extname(file.originalname)),
});
const ALLOWED_AVATAR_EXTS = ['.jpg', '.jpeg', '.png', '.gif', '.webp'];
const MAX_AVATAR_SIZE = 5 * 1024 * 1024;
const avatarUpload = multer({
  storage: avatarStorage,
  limits: { fileSize: MAX_AVATAR_SIZE },
  fileFilter: (_req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    if (!file.mimetype.startsWith('image/') || !ALLOWED_AVATAR_EXTS.includes(ext)) {
      const err: Error & { statusCode?: number } = new Error('Only image files (jpg, png, gif, webp) are allowed');
      err.statusCode = 400;
      return cb(err);
    }
    cb(null, true);
  },
});

// ---------------------------------------------------------------------------
// Rate limiter (middleware concern — stays in route)
// ---------------------------------------------------------------------------

const RATE_LIMIT_WINDOW = 15 * 60 * 1000;
const RATE_LIMIT_CLEANUP = 5 * 60 * 1000;

const loginAttempts = new Map<string, { count: number; first: number }>();
const mfaAttempts = new Map<string, { count: number; first: number }>();
const forgotAttempts = new Map<string, { count: number; first: number }>();
const resetAttempts = new Map<string, { count: number; first: number }>();
setInterval(() => {
  const now = Date.now();
  for (const [key, record] of loginAttempts) {
    if (now - record.first >= RATE_LIMIT_WINDOW) loginAttempts.delete(key);
  }
  for (const [key, record] of mfaAttempts) {
    if (now - record.first >= RATE_LIMIT_WINDOW) mfaAttempts.delete(key);
  }
  for (const [key, record] of forgotAttempts) {
    if (now - record.first >= RATE_LIMIT_WINDOW) forgotAttempts.delete(key);
  }
  for (const [key, record] of resetAttempts) {
    if (now - record.first >= RATE_LIMIT_WINDOW) resetAttempts.delete(key);
  }
}, RATE_LIMIT_CLEANUP);

function rateLimiter(maxAttempts: number, windowMs: number, store = loginAttempts) {
  return (req: Request, res: Response, next: NextFunction) => {
    const key = req.ip || 'unknown';
    const now = Date.now();
    const record = store.get(key);
    if (record && record.count >= maxAttempts && now - record.first < windowMs) {
      return res.status(429).json({ error: 'Too many attempts. Please try again later.' });
    }
    if (!record || now - record.first >= windowMs) {
      store.set(key, { count: 1, first: now });
    } else {
      record.count++;
    }
    next();
  };
}
const authLimiter = rateLimiter(10, RATE_LIMIT_WINDOW);
const mfaLimiter = rateLimiter(5, RATE_LIMIT_WINDOW, mfaAttempts);
const forgotLimiter = rateLimiter(3, RATE_LIMIT_WINDOW, forgotAttempts);
const resetLimiter = rateLimiter(5, RATE_LIMIT_WINDOW, resetAttempts);

// ---------------------------------------------------------------------------
// Routes
// ---------------------------------------------------------------------------

router.get('/app-config', optionalAuth, (req: Request, res: Response) => {
  const user = (req as OptionalAuthRequest).user;
  res.json(getAppConfig(user));
});

router.post('/demo-login', (req: Request, res: Response) => {
  const result = demoLogin();
  if (result.error) return res.status(result.status!).json({ error: result.error });
  setAuthCookie(res, result.token!, req);
  res.json({ token: result.token, user: result.user });
});

router.get('/invite/:token', authLimiter, (req: Request, res: Response) => {
  const result = validateInviteToken(req.params.token);
  if (result.error) return res.status(result.status!).json({ error: result.error });
  res.json({ valid: result.valid, max_uses: result.max_uses, used_count: result.used_count, expires_at: result.expires_at });
});

router.post('/register', authLimiter, (req: Request, res: Response) => {
  const result = registerUser(req.body);
  if (result.error) return res.status(result.status!).json({ error: result.error });
  writeAudit({ userId: result.auditUserId!, action: 'user.register', ip: getClientIp(req), details: result.auditDetails });
  setAuthCookie(res, result.token!, req);
  res.status(201).json({ token: result.token, user: result.user });
});

router.post('/login', authLimiter, (req: Request, res: Response) => {
  const result = loginUser(req.body);
  if (result.auditAction) {
    writeAudit({ userId: result.auditUserId ?? null, action: result.auditAction, ip: getClientIp(req), details: result.auditDetails });
  }
  if (result.error) return res.status(result.status!).json({ error: result.error });
  if (result.mfa_required) return res.json({ mfa_required: true, mfa_token: result.mfa_token });
  setAuthCookie(res, result.token!, req);
  res.json({ token: result.token, user: result.user });
});

// Home Assistant Ingress SSO.
//
// When this server runs as a Home Assistant add-on, Supervisor proxies
// every request with trusted `X-Remote-User-*` headers that identify the
// signed-in HA user. We translate that identity into a TREK session
// (find-or-create user, issue cookie) so the sidebar "Open Web UI" lands
// the user straight on the dashboard with no password prompt.
//
// Hard preconditions (any miss → 4xx):
//   - The request carries an `X-Ingress-Path` header (set by Supervisor).
//     A non-ingress caller cannot forge this because external traffic
//     never reaches the addon directly — only via Supervisor.
//   - `HA_SSO_ENABLED` is not explicitly `false` (set by the addon shim
//     from the `ha_sso` option).
router.post('/ha-sso', (req: Request, res: Response) => {
  if (!ingressPath(req)) return res.status(404).json({ error: 'Not found' });
  if (process.env.HA_SSO_ENABLED === 'false') {
    return res.status(403).json({ error: 'HA SSO is disabled' });
  }
  const haUserId = String(req.header('X-Remote-User-Id') || '').trim();
  if (!haUserId) return res.status(400).json({ error: 'Missing X-Remote-User-Id header' });

  const rawName = String(req.header('X-Remote-User-Name') || '').trim();
  const baseName = (rawName.replace(/[^A-Za-z0-9_-]/g, '_').slice(0, 32) || 'ha_user') || 'ha_user';

  let user = db.prepare(
    'SELECT id, username, email, role, password_version, mfa_enabled, avatar FROM users WHERE ha_user_id = ?'
  ).get(haUserId) as {
    id: number; username: string; email: string; role: string;
    password_version: number; mfa_enabled: number | boolean; avatar: string | null;
  } | undefined;

  if (!user) {
    const userCount = (db.prepare('SELECT COUNT(*) as count FROM users').get() as { count: number }).count;
    const role = userCount === 0 ? 'admin' : 'user';

    let username = baseName;
    let suffix = 0;
    while (db.prepare('SELECT id FROM users WHERE LOWER(username) = LOWER(?)').get(username)) {
      suffix += 1;
      username = `${baseName}_${suffix}`;
    }
    const email = `${username}@ha.local`;
    const randomPassword = crypto.randomBytes(32).toString('hex');
    const password_hash = bcrypt.hashSync(randomPassword, 12);

    try {
      const result = db.prepare(
        'INSERT INTO users (username, email, password_hash, role, ha_user_id, first_seen_version, login_count) VALUES (?, ?, ?, ?, ?, ?, 0)'
      ).run(username, email, password_hash, role, haUserId, process.env.APP_VERSION || '0.0.0');

      writeAudit({
        userId: Number(result.lastInsertRowid),
        action: 'user.ha_sso_register',
        ip: getClientIp(req),
        details: { username, email, role, ha_user_id: haUserId },
      });

      user = db.prepare(
        'SELECT id, username, email, role, password_version, mfa_enabled, avatar FROM users WHERE id = ?'
      ).get(result.lastInsertRowid) as typeof user;
    } catch (err) {
      console.error('[ha-sso] insert failed:', err);
      return res.status(500).json({ error: 'Failed to create HA-linked user' });
    }
  }

  if (!user) return res.status(500).json({ error: 'HA SSO user lookup failed' });

  db.prepare(
    'UPDATE users SET last_login = CURRENT_TIMESTAMP, login_count = login_count + 1 WHERE id = ?'
  ).run(user.id);

  const token = generateToken({ id: user.id, password_version: user.password_version });
  setAuthCookie(res, token, req);
  writeAudit({ userId: user.id, action: 'user.ha_sso_login', ip: getClientIp(req), details: { ha_user_id: haUserId } });

  res.json({
    token,
    user: {
      id: user.id,
      username: user.username,
      email: user.email,
      role: user.role,
      avatar: user.avatar,
      avatar_url: user.avatar,
      mfa_enabled: !!user.mfa_enabled,
    },
  });
});

// ---------------------------------------------------------------------------
// Password reset (forgot / complete)
// ---------------------------------------------------------------------------

// Generic OK response — identical regardless of email existence, to
// prevent enumeration via response body OR status code.
const GENERIC_FORGOT_RESPONSE = { ok: true };
// Minimum time we spend inside the forgot handler so a "no such user"
// path does not complete noticeably faster than a real reset.
const FORGOT_MIN_LATENCY_MS = 350;

router.post('/forgot-password', forgotLimiter, async (req: Request, res: Response) => {
  const started = Date.now();
  const rawEmail = typeof req.body?.email === 'string' ? req.body.email : '';
  const ip = getClientIp(req);

  const outcome = requestPasswordReset(rawEmail, ip);

  if (outcome.reason === 'issued' && outcome.tokenForDelivery && outcome.userEmail) {
    // Build the reset URL from the server-side canonical APP_URL (or
    // first ALLOWED_ORIGINS entry) — never from request headers. A
    // crafted `Origin` / `Host` / `Referer` would otherwise put an
    // attacker-controlled domain into the emailed reset link while the
    // token itself is still legitimate.
    const origin = getAppUrl();
    const url = `${origin.replace(/\/$/, '')}/reset-password?token=${encodeURIComponent(outcome.tokenForDelivery)}`;

    // Audit the REQUEST always — even for "no user" — so abuse is visible.
    writeAudit({ userId: outcome.userId, action: 'user.password_reset_request', ip, details: { delivered: 'pending' } });

    try {
      const delivery = await sendPasswordResetEmail(outcome.userEmail, url, outcome.userId);
      writeAudit({ userId: outcome.userId, action: 'user.password_reset_request', ip, details: { delivered: delivery.delivered } });
    } catch (err) {
      // Never surface delivery failure to the caller — still respond ok.
      writeAudit({ userId: outcome.userId, action: 'user.password_reset_request', ip, details: { delivered: 'failed' } });
    }
  } else {
    writeAudit({ userId: outcome.userId, action: 'user.password_reset_request', ip, details: { reason: outcome.reason } });
  }

  // Pad the response so timing doesn't reveal outcome.
  const elapsed = Date.now() - started;
  if (elapsed < FORGOT_MIN_LATENCY_MS) {
    await new Promise((r) => setTimeout(r, FORGOT_MIN_LATENCY_MS - elapsed));
  }
  res.json(GENERIC_FORGOT_RESPONSE);
});

router.post('/reset-password', resetLimiter, (req: Request, res: Response) => {
  const ip = getClientIp(req);
  const result = resetPassword(req.body);
  if (result.error) {
    writeAudit({ userId: null, action: 'user.password_reset_fail', ip, details: { reason: result.error } });
    return res.status(result.status!).json({ error: result.error });
  }
  if (result.mfa_required) {
    return res.status(200).json({ mfa_required: true });
  }
  writeAudit({ userId: result.userId ?? null, action: 'user.password_reset_success', ip });
  // Purposefully do NOT auto-login — the user just demonstrated they
  // have email+password access; asking them to sign in fresh is the
  // standard, safer UX.
  res.json({ success: true });
});

router.get('/me', authenticate, (req: Request, res: Response) => {
  const authReq = req as AuthRequest;
  const user = getCurrentUser(authReq.user.id);
  if (!user) return res.status(404).json({ error: 'User not found' });
  res.json({ user });
});

router.post('/logout', (req: Request, res: Response) => {
  clearAuthCookie(res, req);
  res.json({ success: true });
});

router.put('/me/password', authenticate, rateLimiter(5, RATE_LIMIT_WINDOW), (req: Request, res: Response) => {
  const authReq = req as AuthRequest;
  const result = changePassword(authReq.user.id, authReq.user.email, req.body);
  if (result.error) return res.status(result.status!).json({ error: result.error });
  writeAudit({ userId: authReq.user.id, action: 'user.password_change', ip: getClientIp(req) });
  res.json({ success: true });
});

router.delete('/me', authenticate, (req: Request, res: Response) => {
  const authReq = req as AuthRequest;
  const result = deleteAccount(authReq.user.id, authReq.user.email, authReq.user.role);
  if (result.error) return res.status(result.status!).json({ error: result.error });
  writeAudit({ userId: authReq.user.id, action: 'user.account_delete', ip: getClientIp(req) });
  res.json({ success: true });
});

router.put('/me/maps-key', authenticate, (req: Request, res: Response) => {
  const authReq = req as AuthRequest;
  res.json(updateMapsKey(authReq.user.id, req.body.maps_api_key));
});

router.put('/me/api-keys', authenticate, (req: Request, res: Response) => {
  const authReq = req as AuthRequest;
  res.json(updateApiKeys(authReq.user.id, req.body));
});

router.put('/me/settings', authenticate, (req: Request, res: Response) => {
  const authReq = req as AuthRequest;
  const result = updateSettings(authReq.user.id, req.body);
  if (result.error) return res.status(result.status!).json({ error: result.error });
  res.json({ success: result.success, user: result.user });
});

router.get('/me/settings', authenticate, (req: Request, res: Response) => {
  const authReq = req as AuthRequest;
  const result = getSettings(authReq.user.id);
  if (result.error) return res.status(result.status!).json({ error: result.error });
  res.json({ settings: result.settings });
});

router.post('/avatar', authenticate, demoUploadBlock, avatarUpload.single('avatar'), async (req: Request, res: Response) => {
  const authReq = req as AuthRequest;
  if (!req.file) return res.status(400).json({ error: 'No image uploaded' });
  res.json(await saveAvatar(authReq.user.id, req.file.filename));
});

router.delete('/avatar', authenticate, async (req: Request, res: Response) => {
  const authReq = req as AuthRequest;
  res.json(await deleteAvatar(authReq.user.id));
});

router.get('/users', authenticate, (req: Request, res: Response) => {
  const authReq = req as AuthRequest;
  res.json({ users: listUsers(authReq.user.id) });
});

router.get('/validate-keys', authenticate, async (req: Request, res: Response) => {
  const authReq = req as AuthRequest;
  const result = await validateKeys(authReq.user.id);
  if (result.error) return res.status(result.status!).json({ error: result.error });
  res.json({ maps: result.maps, weather: result.weather, maps_details: result.maps_details });
});

router.get('/app-settings', authenticate, (req: Request, res: Response) => {
  const authReq = req as AuthRequest;
  const result = getAppSettings(authReq.user.id);
  if (result.error) return res.status(result.status!).json({ error: result.error });
  res.json(result.data);
});

router.put('/app-settings', authenticate, (req: Request, res: Response) => {
  const authReq = req as AuthRequest;
  const result = updateAppSettings(authReq.user.id, req.body);
  if (result.error) return res.status(result.status!).json({ error: result.error });
  writeAudit({
    userId: authReq.user.id,
    action: 'settings.app_update',
    ip: getClientIp(req),
    details: result.auditSummary,
    debugDetails: result.auditDebugDetails,
  });
  res.json({ success: true });
});

router.get('/travel-stats', authenticate, (req: Request, res: Response) => {
  const authReq = req as AuthRequest;
  res.json(getTravelStats(authReq.user.id));
});

router.post('/mfa/verify-login', mfaLimiter, (req: Request, res: Response) => {
  const result = verifyMfaLogin(req.body);
  if (result.error) return res.status(result.status!).json({ error: result.error });
  writeAudit({ userId: result.auditUserId!, action: 'user.login', ip: getClientIp(req), details: { mfa: true } });
  setAuthCookie(res, result.token!, req);
  res.json({ token: result.token, user: result.user });
});

router.post('/mfa/setup', authenticate, (req: Request, res: Response) => {
  const authReq = req as AuthRequest;
  const result = setupMfa(authReq.user.id, authReq.user.email);
  if (result.error) return res.status(result.status!).json({ error: result.error });
  result.qrPromise!
    .then((qr_svg: string) => {
      res.json({ secret: result.secret, otpauth_url: result.otpauth_url, qr_svg });
    })
    .catch((err: unknown) => {
      console.error('[MFA] QR code generation error:', err);
      res.status(500).json({ error: 'Could not generate QR code' });
    });
});

router.post('/mfa/enable', authenticate, mfaLimiter, (req: Request, res: Response) => {
  const authReq = req as AuthRequest;
  const result = enableMfa(authReq.user.id, req.body.code);
  if (result.error) return res.status(result.status!).json({ error: result.error });
  writeAudit({ userId: authReq.user.id, action: 'user.mfa_enable', ip: getClientIp(req) });
  res.json({ success: true, mfa_enabled: result.mfa_enabled, backup_codes: result.backup_codes });
});

router.post('/mfa/disable', authenticate, rateLimiter(5, RATE_LIMIT_WINDOW), (req: Request, res: Response) => {
  const authReq = req as AuthRequest;
  const result = disableMfa(authReq.user.id, authReq.user.email, req.body);
  if (result.error) return res.status(result.status!).json({ error: result.error });
  writeAudit({ userId: authReq.user.id, action: 'user.mfa_disable', ip: getClientIp(req) });
  res.json({ success: true, mfa_enabled: result.mfa_enabled });
});

// --- MCP Token Management ---

router.get('/mcp-tokens', authenticate, (req: Request, res: Response) => {
  const authReq = req as AuthRequest;
  res.json({ tokens: listMcpTokens(authReq.user.id) });
});

router.post('/mcp-tokens', authenticate, rateLimiter(5, RATE_LIMIT_WINDOW), (req: Request, res: Response) => {
  const authReq = req as AuthRequest;
  const result = createMcpToken(authReq.user.id, req.body.name);
  if (result.error) return res.status(result.status!).json({ error: result.error });
  res.status(201).json({ token: result.token });
});

router.delete('/mcp-tokens/:id', authenticate, (req: Request, res: Response) => {
  const authReq = req as AuthRequest;
  const result = deleteMcpToken(authReq.user.id, req.params.id);
  if (result.error) return res.status(result.status!).json({ error: result.error });
  res.json({ success: true });
});

// Short-lived single-use token for WebSocket connections
router.post('/ws-token', authenticate, (req: Request, res: Response) => {
  const authReq = req as AuthRequest;
  const result = createWsToken(authReq.user.id);
  if (result.error) return res.status(result.status!).json({ error: result.error });
  res.json({ token: result.token });
});

// Short-lived single-use token for direct resource URLs
router.post('/resource-token', authenticate, (req: Request, res: Response) => {
  const authReq = req as AuthRequest;
  const token = createResourceToken(authReq.user.id, req.body.purpose);
  if (!token) return res.status(503).json({ error: 'Service unavailable' });
  res.json(token);
});

export default router;

// Exported for test resets only — do not use in production code
export { loginAttempts, mfaAttempts };
