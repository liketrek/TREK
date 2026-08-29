import { AppConfigModule } from '../app-config/app-config.module';
import { AuditModule } from '../audit/audit.module';
import { BudgetModule } from '../budget/budget.module';
import { RateLimitModule } from '../common/rate-limit.module';
import { AllowedFileTypesModule } from '../files/allowed-file-types.module';
import { MailerModule } from '../notifications/mailer/mailer.module';
import { PermissionsModule } from '../permissions/permissions.module';
import { buildStorageUploadOptions } from '../storage/storage-upload.factory';
import { StorageModule } from '../storage/storage.module';
import { StorageService } from '../storage/storage.service';
import { TokensModule } from '../tokens/tokens.module';
import { TripMembershipModule } from '../trip-membership/trip-membership.module';
import { AuthPublicController } from './auth-public.controller';
import { AuthController } from './auth.controller';
import { AVATAR_FILE_FILTER, MAX_AVATAR_SIZE } from './auth.controller';
import { AuthMcp } from './auth.mcp';
import { AuthService } from './auth.service';
import { EphemeralTokenModule } from './ephemeral-token.module';
import { PasskeyController } from './passkey.controller';
import { PasskeyService } from './passkey.service';
import { RegistrationInvitesService } from './registration-invites.service';
import { UserCleanupService } from './user-cleanup.service';
import { UserProfileService } from './user-profile.service';
import { WebauthnConfigService } from './webauthn-config.service';
import { Module } from '@nestjs/common';
import { MulterModule } from '@nestjs/platform-express';

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
 * through auth.bridge. BudgetModule went the same way: it stopped importing
 * AuthModule when BudgetMcp's demo guard moved off AuthService, so this module
 * imports it and UserCleanupService injects BudgetService (which retired
 * budget.bridge). AuthService is
 * exported for the in-container consumers (the domain *.mcp.ts demo guards,
 * OidcService, PasskeyEnabledGuard); PasskeyService for AdminService's passkey
 * reset; UserCleanupService for the two account-deletion paths (AdminService)
 * and the guest deletion in TripsService; everything outside the container goes
 * through auth.bridge.ts.
 */
@Module({
  imports: [
    MulterModule.registerAsync({
      imports: [StorageModule],
      inject: [StorageService],
      useFactory: (storage: StorageService) =>
        buildStorageUploadOptions(storage, {
          category: 'avatars',
          maxSize: MAX_AVATAR_SIZE,
          fileFilter: AVATAR_FILE_FILTER,
        }),
    }),
    StorageModule,
    AllowedFileTypesModule,
    EphemeralTokenModule,
    RateLimitModule,
    AuditModule,
    PermissionsModule,
    TripMembershipModule,
    MailerModule,
    AppConfigModule,
    TokensModule,
    BudgetModule,
  ],
  controllers: [AuthPublicController, AuthController, PasskeyController],
  providers: [
    AuthService,
    UserProfileService,
    RegistrationInvitesService,
    PasskeyService,
    UserCleanupService,
    WebauthnConfigService,
    AuthMcp,
  ],
  exports: [AuthService, RegistrationInvitesService, PasskeyService, UserCleanupService],
})
export class AuthModule {}
