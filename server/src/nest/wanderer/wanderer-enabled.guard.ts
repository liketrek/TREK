import { AddonsService } from '../addons/addons.service';
import { DomainError } from '../common/domain-error';
import { CanActivate, Injectable } from '@nestjs/common';

/**
 * Lets a wanderer route through only while the admin allows wanderer under
 * Tours (Admin, Addons, Tours). Runs after the Tours addon check, so with
 * Tours off the caller still hears that Tours is off.
 */
@Injectable()
export class WandererEnabledGuard implements CanActivate {
  constructor(private readonly addons: AddonsService) {}

  async canActivate(): Promise<boolean> {
    if (!(await this.addons.isWandererAvailable())) {
      throw new DomainError(404, 'wanderer is not enabled', {
        code: 'wanderer_disabled',
        details: { code: 'disabled' },
      });
    }
    return true;
  }
}
