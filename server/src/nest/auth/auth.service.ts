import { Injectable } from '@nestjs/common';
import type { Request, Response } from 'express';
import * as auth from '../../services/authService';
import { setAuthCookie, clearAuthCookie } from '../../services/cookie';
import { sendPasswordResetEmail, getAppUrl } from '../../services/notifications';
import type { User } from '../../types';

/**
 * Thin Nest wrapper around the existing auth service. Token generation, the
 * password/MFA/backup-code crypto, the JWT cookie set/clear and the reset-email
 * delivery all reuse the legacy code unchanged. Access control + audit stay in
 * the controller (mirroring the legacy route handlers).
 */
@Injectable()
export class AuthService {
  // Cookie
  setAuthCookie(res: Response, token: string, req: Request, remember?: boolean) { setAuthCookie(res, token, req, remember); }
  clearAuthCookie(res: Response, req: Request) { clearAuthCookie(res, req); }

  // Reset-email delivery (canonical app URL, never request headers)
  getAppUrl() { return getAppUrl(); }
  sendPasswordResetEmail(email: string, url: string, userId: number | null) { return sendPasswordResetEmail(email, url, userId); }

  // Public config + auth flows
  getAppConfig(user: User | undefined) { return auth.getAppConfig(user); }
  demoLogin() { return auth.demoLogin(); }
  validateInviteToken(token: string) { return auth.validateInviteToken(token); }
  registerUser(body: unknown) { return auth.registerUser(body as Parameters<typeof auth.registerUser>[0]); }
  loginUser(body: unknown) { return auth.loginUser(body as Parameters<typeof auth.loginUser>[0]); }
  requestPasswordReset(email: string, ip: string) { return auth.requestPasswordReset(email, ip); }
  resetPassword(body: unknown) { return auth.resetPassword(body as Parameters<typeof auth.resetPassword>[0]); }
  verifyMfaLogin(body: unknown) { return auth.verifyMfaLogin(body as Parameters<typeof auth.verifyMfaLogin>[0]); }

  // Account
  getCurrentUser(userId: number) { return auth.getCurrentUser(userId); }
  changePassword(userId: number, email: string, body: unknown) { return auth.changePassword(userId, email, body as Parameters<typeof auth.changePassword>[2]); }
  deleteAccount(userId: number, email: string, role: string) { return auth.deleteAccount(userId, email, role); }
  updateMapsKey(userId: number, key: unknown) { return auth.updateMapsKey(userId, key as string); }
  updateApiKeys(userId: number, body: unknown) { return auth.updateApiKeys(userId, body as Parameters<typeof auth.updateApiKeys>[1]); }
  updateSettings(userId: number, body: unknown) { return auth.updateSettings(userId, body as Parameters<typeof auth.updateSettings>[1]); }
  getSettings(userId: number) { return auth.getSettings(userId); }
  saveAvatar(userId: number, filename: string) { return auth.saveAvatar(userId, filename); }
  deleteAvatar(userId: number) { return auth.deleteAvatar(userId); }
  listUsers(userId: number) { return auth.listUsers(userId); }
  validateKeys(userId: number) { return auth.validateKeys(userId); }
  getAppSettings(userId: number) { return auth.getAppSettings(userId); }
  updateAppSettings(userId: number, body: unknown) { return auth.updateAppSettings(userId, body as Parameters<typeof auth.updateAppSettings>[1]); }
  getTravelStats(userId: number) { return auth.getTravelStats(userId); }

  // MFA
  setupMfa(userId: number, email: string) { return auth.setupMfa(userId, email); }
  enableMfa(userId: number, code: unknown) { return auth.enableMfa(userId, code as string); }
  disableMfa(userId: number, email: string, body: unknown) { return auth.disableMfa(userId, email, body as Parameters<typeof auth.disableMfa>[2]); }

  // MCP tokens + short-lived tokens
  listMcpTokens(userId: number) { return auth.listMcpTokens(userId); }
  createMcpToken(userId: number, name: unknown) { return auth.createMcpToken(userId, name as string); }
  deleteMcpToken(userId: number, id: string) { return auth.deleteMcpToken(userId, id); }
  createWsToken(userId: number) { return auth.createWsToken(userId); }
  createResourceToken(userId: number, purpose: unknown) { return auth.createResourceToken(userId, purpose as string); }
}
