import { RateLimitModule } from '../common/rate-limit.module';
import { Module } from '@nestjs/common';
import { AuthPublicController } from './auth-public.controller';
import { AuthController } from './auth.controller';
import { PasskeyController } from './passkey.controller';
import { AuthService } from './auth.service';
import { PasskeyService } from './passkey.service';
import { AuditModule } from '../audit/audit.module';
import { PermissionsModule } from '../permissions/permissions.module';
import { AtlasModule } from '../atlas/atlas.module';

/**
 * Auth module — public flows (login/register/reset/mfa-verify/logout) and the
 * authenticated account/MFA/token endpoints. The OIDC sub-mount (/api/auth/oidc)
 * is a separate, not-yet-migrated route, so the strangler lists the auth
 * sub-paths explicitly rather than claiming all of /api/auth.
 *
 * PermissionsModule feeds getAppConfig's permissions block; AtlasModule feeds
 * getTravelStats' hidden-countries subtraction. AuthService is exported for
 * the in-container consumers (the domain *.mcp.ts demo guards, OidcService,
 * PasskeyEnabledGuard); PasskeyService for AdminService's passkey reset;
 * everything outside the container goes through auth.bridge.ts.
 */
@Module({
  imports: [RateLimitModule, AuditModule, PermissionsModule, AtlasModule],
  controllers: [AuthPublicController, AuthController, PasskeyController],
  providers: [AuthService, PasskeyService],
  exports: [AuthService, PasskeyService],
})
export class AuthModule {}
