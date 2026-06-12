import { CanActivate, HttpException, Injectable } from '@nestjs/common';
import { resolveAuthToggles } from '../../services/authService';

/**
 * Server-side enforcement of the instance-wide `passkey_login` toggle. Placed
 * BEFORE the auth guard on every passkey ceremony route so a disabled feature
 * returns 404 (not "auth required") and cannot be driven by direct API calls —
 * hiding the button in the UI is not enough. Mirrors JourneyAddonGuard.
 *
 * The credential-management routes (list/rename/delete) are deliberately NOT
 * gated by this guard so users can still clean up their passkeys after an admin
 * turns the feature off.
 */
@Injectable()
export class PasskeyEnabledGuard implements CanActivate {
  canActivate(): boolean {
    if (!resolveAuthToggles().passkey_login) {
      throw new HttpException({ error: 'Passkey login is not enabled' }, 404);
    }
    return true;
  }
}
