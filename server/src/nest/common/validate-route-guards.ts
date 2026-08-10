import { METHOD_METADATA, PATH_METADATA, GUARDS_METADATA } from '@nestjs/common/constants';
import { ModulesContainer } from '@nestjs/core';
import type { INestApplication } from '@nestjs/common';
import { IS_PUBLIC, OPTIONAL_AUTH } from '../auth/public.decorator';

export interface RouteGuardEntry {
  /** `ControllerClass.methodName` */
  id: string;
  /** How the route is covered, for the failure message. */
  cover: 'public' | 'optional-auth' | 'declared-guards';
}

/**
 * Boot-time gate: every registered route must be authenticated, or say why not.
 *
 * This is the thing that makes default-deny stick. The APP_GUARD alone protects
 * what exists today; this refuses to boot when a NEW route arrives that is
 * neither guarded nor explicitly exempt — the same shape as
 * validate-body-contracts.ts, and for the same reason. Without it, the next
 * `@Public()` pasted in to make a test pass is invisible.
 *
 * A route counts as covered when it carries @Public(), @OptionalAuth(), or a
 * declared @UseGuards chain (on the handler or the class). Everything else falls
 * to GlobalAuthGuard, which is fine — that is the default — so this gate does
 * not fail on it. What it reports is the inventory, so the exempt set is a list
 * somebody can read.
 */
export function collectRouteGuards(app: INestApplication): RouteGuardEntry[] {
  const container = app.get(ModulesContainer, { strict: false });
  const entries: RouteGuardEntry[] = [];

  for (const module of container.values()) {
    for (const wrapper of module.controllers.values()) {
      const ctor = wrapper.metatype as (new (...args: never[]) => object) | undefined;
      if (!ctor?.prototype) continue;

      const classPublic = Reflect.getMetadata(IS_PUBLIC, ctor);
      const classOptional = Reflect.getMetadata(OPTIONAL_AUTH, ctor);
      const classGuards = (Reflect.getMetadata(GUARDS_METADATA, ctor) as unknown[] | undefined) ?? [];

      for (const name of Object.getOwnPropertyNames(ctor.prototype)) {
        if (name === 'constructor') continue;
        const handler = (ctor.prototype as Record<string, unknown>)[name];
        if (typeof handler !== 'function') continue;
        // The definition of "a registered route" in this codebase: it carries an
        // HTTP method decorator. Same test validate-body-contracts.ts uses.
        if (Reflect.getMetadata(METHOD_METADATA, handler) === undefined) continue;

        const id = `${ctor.name}.${name}`;
        const isPublic = classPublic ?? Reflect.getMetadata(IS_PUBLIC, handler);
        const isOptional = classOptional ?? Reflect.getMetadata(OPTIONAL_AUTH, handler);
        const handlerGuards = (Reflect.getMetadata(GUARDS_METADATA, handler) as unknown[] | undefined) ?? [];

        if (isPublic) entries.push({ id, cover: 'public' });
        else if (isOptional) entries.push({ id, cover: 'optional-auth' });
        else if (classGuards.length > 0 || handlerGuards.length > 0) entries.push({ id, cover: 'declared-guards' });
      }
    }
  }

  return entries.sort((a, b) => a.id.localeCompare(b.id));
}

/**
 * The routes that answer without a session. Reviewed as a list on purpose: this
 * is the whole anonymous surface of the server in one place, and a diff that
 * grows it is a diff that widens what strangers can reach.
 *
 * Entries are `ControllerClass.methodName`. Sorted, no duplicates.
 */
export const PUBLIC_ROUTE_ALLOW_LIST: string[] = [
  // Everything a visitor needs before they have a session, plus the paths where
  // a token other than the session cookie is the credential.
  'AuthPublicController.demoLogin',
  'AuthPublicController.forgotPassword',
  'AuthPublicController.invite',
  'AuthPublicController.login',
  'AuthPublicController.logout',
  'AuthPublicController.register',
  'AuthPublicController.resetPassword',
  'AuthPublicController.verifyMfaLogin',
  'ConfigController.getConfig',
  'FeaturesController.features',
  // The download link carries its own short-lived token.
  'FilesDownloadController.download',
  'HelpController.asset',
  'HelpController.index',
  'HelpController.page',
  // Share-token validated.
  'JourneyPublicController.get',
  'JourneyPublicController.legacyPhoto',
  'JourneyPublicController.photo',
  'OauthPublicController.revoke',
  'OauthPublicController.token',
  'OauthPublicController.userinfo',
  // The OIDC handshake, before a TREK session exists.
  'OidcController.callback',
  'OidcController.exchange',
  'OidcController.login',
  // Serves the sandbox document; the RPC inside it is authenticated.
  'PluginFrameController.serve',
  // Auth is per plugin route (route.auth in the manifest), asserted in the handler.
  'PluginsProxyController.proxy',
  // Share-token validated.
  'SharedController.placePhotoBytes',
  'SharedController.read',
];

/**
 * Throws when a route carries @Public() without being listed above, or when a
 * listed route no longer exists. Stale entries fail too, for the same reason the
 * body-contract gate fails on them: a list nobody prunes stops being a list.
 */
export function validateRouteGuards(app: INestApplication, allowList: string[] = PUBLIC_ROUTE_ALLOW_LIST): void {
  const entries = collectRouteGuards(app);
  const publicIds = entries.filter((e) => e.cover === 'public').map((e) => e.id);
  const allowed = new Set(allowList);

  const undeclared = publicIds.filter((id) => !allowed.has(id));
  const stale = allowList.filter((id) => !publicIds.includes(id));

  const problems: string[] = [];
  if (undeclared.length > 0) {
    problems.push(
      `route(s) marked @Public() but not in PUBLIC_ROUTE_ALLOW_LIST:\n  ${undeclared.join('\n  ')}`,
    );
  }
  if (stale.length > 0) {
    problems.push(
      `PUBLIC_ROUTE_ALLOW_LIST entries that are no longer @Public():\n  ${stale.join('\n  ')}`,
    );
  }
  if (problems.length > 0) {
    throw new Error(
      `Anonymous route surface changed.\n\n${problems.join('\n\n')}\n\n` +
        'Every entry is a route a stranger can reach. Add it deliberately, with the reason ' +
        'string @Public() requires, or remove the stale line.',
    );
  }
}
