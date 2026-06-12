import { Injectable } from '@nestjs/common';
import * as svc from '../../services/adminService';
import { getAdminUserDefaults, setAdminUserDefaults } from '../../services/settingsService';
import { invalidateMcpSessions } from '../../mcp';
import { getPreferencesMatrix, setAdminPreferences } from '../../services/notificationPreferencesService';
import { adminResetPasskeys } from '../../services/passkeyService';

/**
 * Thin Nest wrapper around the existing admin service (+ the settings,
 * MCP-session and notification-preference helpers the legacy route used). All
 * business logic, audit-relevant return shapes and the addon/MCP invalidation
 * reuse the legacy code unchanged.
 */
@Injectable()
export class AdminService {
  // Users
  listUsers() { return svc.listUsers(); }
  createUser(body: unknown) { return svc.createUser(body as Parameters<typeof svc.createUser>[0]); }
  updateUser(id: string, body: unknown) { return svc.updateUser(id, body as Parameters<typeof svc.updateUser>[1]); }
  deleteUser(id: string, actingUserId: number) { return svc.deleteUser(id, actingUserId); }
  resetUserPasskeys(id: string) { return adminResetPasskeys(Number(id)); }

  getStats() { return svc.getStats(); }
  getPermissions() { return svc.getPermissions(); }
  savePermissions(permissions: Parameters<typeof svc.savePermissions>[0]) { return svc.savePermissions(permissions); }
  getAuditLog(query: { limit?: string; offset?: string }) { return svc.getAuditLog(query); }

  getOidcSettings() { return svc.getOidcSettings(); }
  updateOidcSettings(body: unknown) { return svc.updateOidcSettings(body as Parameters<typeof svc.updateOidcSettings>[0]); }
  saveDemoBaseline() { return svc.saveDemoBaseline(); }

  getGithubReleases(perPage: string, page: string) { return svc.getGithubReleases(perPage, page); }
  checkVersion() { return svc.checkVersion(); }

  // Invites
  listInvites() { return svc.listInvites(); }
  createInvite(userId: number, body: unknown) { return svc.createInvite(userId, body as Parameters<typeof svc.createInvite>[1]); }
  deleteInvite(id: string) { return svc.deleteInvite(id); }

  // Feature toggles
  getBagTracking() { return svc.getBagTracking(); }
  updateBagTracking(enabled: unknown) { return svc.updateBagTracking(enabled as boolean); }
  getPlacesPhotos() { return svc.getPlacesPhotos(); }
  updatePlacesPhotos(enabled: boolean) { return svc.updatePlacesPhotos(enabled); }
  getPlacesAutocomplete() { return svc.getPlacesAutocomplete(); }
  updatePlacesAutocomplete(enabled: boolean) { return svc.updatePlacesAutocomplete(enabled); }
  getPlacesDetails() { return svc.getPlacesDetails(); }
  updatePlacesDetails(enabled: boolean) { return svc.updatePlacesDetails(enabled); }
  getCollabFeatures() { return svc.getCollabFeatures(); }
  updateCollabFeatures(body: unknown) { return svc.updateCollabFeatures(body as Parameters<typeof svc.updateCollabFeatures>[0]); }

  // Packing templates
  listPackingTemplates() { return svc.listPackingTemplates(); }
  getPackingTemplate(id: string) { return svc.getPackingTemplate(id); }
  createPackingTemplate(name: unknown, userId: number) { return svc.createPackingTemplate(name as string, userId); }
  updatePackingTemplate(id: string, body: unknown) { return svc.updatePackingTemplate(id, body as Parameters<typeof svc.updatePackingTemplate>[1]); }
  deletePackingTemplate(id: string) { return svc.deletePackingTemplate(id); }
  createTemplateCategory(templateId: string, name: unknown) { return svc.createTemplateCategory(templateId, name as string); }
  updateTemplateCategory(templateId: string, catId: string, body: unknown) { return svc.updateTemplateCategory(templateId, catId, body as Parameters<typeof svc.updateTemplateCategory>[2]); }
  deleteTemplateCategory(templateId: string, catId: string) { return svc.deleteTemplateCategory(templateId, catId); }
  createTemplateItem(templateId: string, catId: string, name: unknown) { return svc.createTemplateItem(templateId, catId, name as string); }
  updateTemplateItem(itemId: string, body: unknown) { return svc.updateTemplateItem(itemId, body as Parameters<typeof svc.updateTemplateItem>[1]); }
  deleteTemplateItem(itemId: string) { return svc.deleteTemplateItem(itemId); }

  // Addons + tokens + sessions
  listAddons() { return svc.listAddons(); }
  updateAddon(id: string, body: unknown) { return svc.updateAddon(id, body as Parameters<typeof svc.updateAddon>[1]); }
  listMcpTokens() { return svc.listMcpTokens(); }
  deleteMcpToken(id: string) { return svc.deleteMcpToken(id); }
  listOAuthSessions() { return svc.listOAuthSessions(); }
  revokeOAuthSession(id: string) { return svc.revokeOAuthSession(id); }
  rotateJwtSecret() { return svc.rotateJwtSecret(); }

  invalidateMcpSessions() { invalidateMcpSessions(); }

  // Settings + notification preference helpers (non-admin-service modules)
  getAdminUserDefaults() { return getAdminUserDefaults(); }
  setAdminUserDefaults(body: Record<string, unknown>) { return setAdminUserDefaults(body); }
  getPreferencesMatrix(userId: number, role: string) { return getPreferencesMatrix(userId, role, 'admin'); }
  setAdminPreferences(userId: number, body: unknown) { return setAdminPreferences(userId, body as Parameters<typeof setAdminPreferences>[1]); }
}
