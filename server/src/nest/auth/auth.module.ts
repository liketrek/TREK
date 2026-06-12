import { Module } from '@nestjs/common';
import { AuthPublicController } from './auth-public.controller';
import { AuthController } from './auth.controller';
import { PasskeyController } from './passkey.controller';
import { AuthService } from './auth.service';
import { RateLimitService } from './rate-limit.service';

/**
 * Auth module — public flows (login/register/reset/mfa-verify/logout) and the
 * authenticated account/MFA/token endpoints. The OIDC sub-mount (/api/auth/oidc)
 * is a separate, not-yet-migrated route, so the strangler lists the auth
 * sub-paths explicitly rather than claiming all of /api/auth.
 */
@Module({
  controllers: [AuthPublicController, AuthController, PasskeyController],
  providers: [AuthService, RateLimitService],
})
export class AuthModule {}
