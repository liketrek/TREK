import { METHOD_METADATA } from '@nestjs/common/constants';
import { ModulesContainer } from '@nestjs/core';
import type { INestApplication } from '@nestjs/common';
import { MANAGED_FORBIDDEN } from './managed';

export interface ManagedRouteEntry {
  /** `ControllerClass.methodName` */
  id: string;
  /** Why this surface is not the instance admin's, for the next reader. */
  reason: string;
  /** Multipart routes refuse inside the handler; the guard steps aside for them. */
  enforcedInHandler: boolean;
}

/**
 * Collects every route marked with `@ManagedForbidden`.
 *
 * Same walk as `collectRouteGuards`, and deliberately so: a route is anything
 * carrying an HTTP method decorator, and metadata is read from the handler with
 * the class as fallback.
 */
export function collectManagedRoutes(app: INestApplication): ManagedRouteEntry[] {
  const container = app.get(ModulesContainer, { strict: false });
  const entries: ManagedRouteEntry[] = [];

  for (const module of container.values()) {
    for (const wrapper of module.controllers.values()) {
      const ctor = wrapper.metatype as (new (...args: never[]) => object) | undefined;
      if (!ctor?.prototype) continue;

      const classMark = Reflect.getMetadata(MANAGED_FORBIDDEN, ctor) as
        | { reason?: string; enforcedInHandler?: boolean }
        | undefined;

      for (const name of Object.getOwnPropertyNames(ctor.prototype)) {
        if (name === 'constructor') continue;
        const handler = (ctor.prototype as Record<string, unknown>)[name];
        if (typeof handler !== 'function') continue;
        if (Reflect.getMetadata(METHOD_METADATA, handler) === undefined) continue;

        const mark =
          (Reflect.getMetadata(MANAGED_FORBIDDEN, handler) as typeof classMark) ?? classMark;
        if (!mark) continue;

        entries.push({
          id: `${ctor.name}.${name}`,
          reason: mark.reason ?? '',
          enforcedInHandler: mark.enforcedInHandler === true,
        });
      }
    }
  }

  return entries.sort((a, b) => a.id.localeCompare(b.id));
}

/**
 * The surfaces a centrally administered install withholds from its own admin.
 *
 * Reviewed as a list on purpose, exactly like the anonymous-route list next
 * door. Each entry takes a control away from somebody who would have it on a
 * self-hosted install, so a diff that grows this list is a diff that narrows
 * what a customer may do, and that should never happen by accident.
 *
 * Entries are `ControllerClass.methodName`. Sorted, no duplicates.
 */
export const MANAGED_ROUTE_ALLOW_LIST: string[] = [
  'AdminController.rotateJwtSecret',
  'AdminOidcController.get',
  'AdminOidcController.update',
  'AuthController.createMcpToken',
  'AuthController.validateKeys',
  'BackupController.restore',
  'BackupController.updateAutoSettings',
  'BackupController.uploadRestore',
  'LlmLocalController.capabilities',
  'LlmLocalController.models',
  'LlmLocalController.pull',
  'NotificationsController.testSmtp',
  'PluginsController.link',
  'PluginsController.reload',
  'PluginsController.upload',
  'StorageAdminController.backfillCancel',
  'StorageAdminController.backfillStart',
  'StorageAdminController.get',
  'StorageAdminController.migrationCancel',
  'StorageAdminController.migrationStart',
  'StorageAdminController.statsRefresh',
  'StorageAdminController.test',
  'StorageAdminController.update',
];

/**
 * Throws when a route carries `@ManagedForbidden` without being listed above,
 * when a listed route no longer carries it, or when a marker has no reason.
 *
 * The third case has no equivalent in the guard gate and is the one that keeps
 * this list worth reading: a marker whose reason is blank tells the next person
 * nothing about why the control was taken away, and there is no way to recover
 * that intent afterwards.
 */
export function validateManagedRoutes(
  app: INestApplication,
  allowList: string[] = MANAGED_ROUTE_ALLOW_LIST,
): void {
  const entries = collectManagedRoutes(app);
  const ids = entries.map((e) => e.id);
  const allowed = new Set(allowList);

  const undeclared = ids.filter((id) => !allowed.has(id));
  const stale = allowList.filter((id) => !ids.includes(id));
  const unexplained = entries.filter((e) => e.reason.trim() === '').map((e) => e.id);

  const problems: string[] = [];
  if (undeclared.length > 0) {
    problems.push(
      `route(s) marked @ManagedForbidden() but not in MANAGED_ROUTE_ALLOW_LIST:\n  ${undeclared.join('\n  ')}`,
    );
  }
  if (stale.length > 0) {
    problems.push(
      `MANAGED_ROUTE_ALLOW_LIST entries that are no longer marked:\n  ${stale.join('\n  ')}`,
    );
  }
  if (unexplained.length > 0) {
    problems.push(`@ManagedForbidden() without a reason:\n  ${unexplained.join('\n  ')}`);
  }
  if (problems.length > 0) {
    throw new Error(
      `Managed surface changed.\n\n${problems.join('\n\n')}\n\n` +
        'Every entry is a control a centrally administered install withholds from its ' +
        'own admin. Add it deliberately, with the reason the decorator requires, or ' +
        'remove the stale line.',
    );
  }
}
