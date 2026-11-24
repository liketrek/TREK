import { AddonsService } from '../addons/addons.service';
import { DomainError } from '../common/domain-error';
import { CanActivate, Injectable } from '@nestjs/common';

/**
 * Lets a wanderer route through only while the admin allows wanderer under
 * Tours (Admin, Addons, Tours). Runs after the Tours addon check, so with
 * Tours off the caller still hears that Tours is off. That check decides
 * Tours (AddonGuard for the instance or any trip of the caller, TripAddonGuard
 * for one trip), so this guard asks the sub-option alone: it stays
 * instance-wide and applies wherever Tours is on.
 */
@Injectable()
export class WandererEnabledGuard implements CanActivate {
  constructor(private readonly addons: AddonsService) {}

  async canActivate(): Promise<boolean> {
    if (!(await this.addons.isWandererAllowed())) {
      throw new DomainError(404, 'wanderer is not enabled', {
        code: 'wanderer_disabled',
        details: { code: 'disabled' },
      });
    }
    return true;
  }
}
