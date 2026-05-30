import { CanActivate, HttpException, Injectable } from '@nestjs/common';
import { JourneyService } from './journey.service';

/**
 * Mirrors the legacy `/api/journeys` mount gate: when the Journey addon is
 * disabled the whole route group answers 404, regardless of auth. Declared
 * before the JwtAuthGuard so the addon check wins over the 401, exactly as the
 * Express middleware ordering did.
 */
@Injectable()
export class JourneyAddonGuard implements CanActivate {
  constructor(private readonly journey: JourneyService) {}

  canActivate(): boolean {
    if (!this.journey.journeyAddonEnabled()) {
      throw new HttpException({ error: 'Journey addon is not enabled' }, 404);
    }
    return true;
  }
}
