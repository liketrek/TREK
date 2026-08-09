import { RateLimitModule } from '../common/rate-limit.module';
import { Module } from '@nestjs/common';
import { TokensModule } from '../tokens/tokens.module';
import { AuthPublicController } from './auth-public.controller';
import { AuthController } from './auth.controller';
import { PasskeyController } from './passkey.controller';
import { AuthService } from './auth.service';
import { PasskeyService } from './passkey.service';
import { AuthMcp } from './auth.mcp';
import { UserCleanupService } from './user-cleanup.service';
import { WebauthnConfigService } from './webauthn-config.service';
import { AppConfigModule } from '../app-config/app-config.module';
import { AuditModule } from '../audit/audit.module';
import { MailerModule } from '../notifications/mailer/mailer.module';
import { PermissionsModule } from '../permissions/permissions.module';
import { TripMembershipModule } from '../trip-membership/trip-membership.module';

/**
 * Auth module — public flows (login/register/reset/mfa-verify/logout) and the
 * authenticated account/MFA/token endpoints. The OIDC sub-mount (/api/auth/oidc)
 * is a separate, not-yet-migrated route, so the strangler lists the auth
 * sub-paths explicitly rather than claiming all of /api/auth.
 *
 * PermissionsModule feeds getAppConfig's permissions block; MailerModule sends
 * the password-reset mail. It is a leaf module of its own precisely so this
 * import does not become AuthModule -> NotificationsModule -> AuthModule.
 *
 * AtlasModule is deliberately absent. getTravelStats was the only reason for it
 * and now belongs to AtlasService; the direction is reversed, so AtlasModule
 * imports AuthModule and atlas.mcp.ts can inject AuthService instead of routing
 * through auth.bridge. AuthService is
 * exported for the in-container consumers (the domain *.mcp.ts demo guards,
 * OidcService, PasskeyEnabledGuard); PasskeyService for AdminService's passkey
 * reset; UserCleanupService for the two account-deletion paths (AdminService)
 * and the guest deletion in TripsService; everything outside the container goes
 * through auth.bridge.ts.
 */
@Module({
  imports: [RateLimitModule, AuditModule, PermissionsModule, TripMembershipModule, MailerModule, AppConfigModule, TokensModule],
  controllers: [AuthPublicController, AuthController, PasskeyController],
  providers: [AuthService, PasskeyService, UserCleanupService, WebauthnConfigService, AuthMcp],
  exports: [AuthService, PasskeyService, UserCleanupService],
})
export class AuthModule {}
