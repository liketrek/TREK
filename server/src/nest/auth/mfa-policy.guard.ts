import { CanActivate, ExecutionContext, HttpException, Injectable, SetMetadata } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import type { Request } from 'express';
import { DatabaseService } from '../database/database.service';
import { RuntimeEnvService } from '../app-config/runtime-env.service';
import { DEMO_EMAILS } from '../common/demo';
import { IS_PUBLIC } from './public.decorator';
import type { User } from '../../types';

/** Metadata key `@MfaExempt()` writes. */
export const MFA_EXEMPT = 'trek:mfa-exempt';

/**
 * Reachable by an authenticated user who has not set up MFA yet, while the
 * require_mfa policy is on.
 *
 * Two kinds qualify and both need the reason spelled out: the routes that let
 * somebody *complete* setup (otherwise the policy locks out every new account),
 * and the pre-auth ceremonies that carry a session but are not yet a session the
 * policy should judge.
 */
export const MfaExempt = (reason: string) => SetMetadata(MFA_EXEMPT, { reason });

type MfaRequest = Request & { user?: User };

/**
 * Enforces app_settings.require_mfa, as a guard rather than an Express layer.
 *
 * The middleware it replaces re-verified the JWT and re-read the users row on
 * every single /api request, then threw the loaded user away — two jwt.verify
 * calls and two SELECTs per authenticated request, because it ran before Nest
 * and could not see what the auth guard had already resolved. This one reads
 * `req.user`, which the global auth guard put there.
 *
 * It also corrects an asymmetry that had grown quietly. The middleware decided
 * on two literal path lists, and every public /api endpoint added after those
 * lists were written — /api/config, /api/help/*, the public journey and share
 * routes, /api/health/features — answered a logged-in user without MFA with a
 * 403 while answering the same request from a stranger perfectly well. Nothing
 * intended that; the lists simply stopped being maintained. Keying on @Public()
 * instead of a path list means the exemption cannot drift from the route again.
 * That is a deliberate behaviour change, and the only one here.
 */
@Injectable()
export class MfaPolicyGuard implements CanActivate {
  constructor(
    private readonly db: DatabaseService,
    private readonly env: RuntimeEnvService,
    private readonly reflector: Reflector,
  ) {}

  canActivate(context: ExecutionContext): boolean {
    const handler = context.getHandler();
    const controller = context.getClass();

    // A route a stranger may call is a route the policy has no business judging.
    if (this.reflector.getAllAndOverride(IS_PUBLIC, [handler, controller])) return true;

    const user = context.switchToHttp().getRequest<MfaRequest>().user;
    // No session: whoever answers next decides, exactly as before.
    if (!user) return true;

    const requireRow = this.db.get<{ value: string }>(
      "SELECT value FROM app_settings WHERE key = 'require_mfa'",
    );
    if (requireRow?.value !== 'true') return true;

    if (this.env.isDemoMode() && user.email && DEMO_EMAILS.has(user.email)) return true;

    const row = this.db.get<{ mfa_enabled: number | boolean }>(
      'SELECT mfa_enabled FROM users WHERE id = ?',
      user.id,
    );
    if (!row) return true;

    // A user-verified passkey is phishing-resistant and inherently two-factor, so
    // owning at least one satisfies require_mfa exactly like TOTP does.
    // (All stored passkeys were registered with userVerification required.)
    const mfaOk = row.mfa_enabled === 1 || row.mfa_enabled === true;
    const passkeyOk = !!this.db.get('SELECT 1 FROM webauthn_credentials WHERE user_id = ? LIMIT 1', user.id);
    if (mfaOk || passkeyOk) return true;

    if (this.reflector.getAllAndOverride(MFA_EXEMPT, [handler, controller])) return true;

    throw new HttpException(
      {
        error: 'Two-factor authentication is required. Complete setup in Settings.',
        code: 'MFA_REQUIRED',
      },
      403,
    );
  }
}
