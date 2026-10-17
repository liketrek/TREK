import {
  adminUserCreateRequestSchema,
  adminUserUpdateRequestSchema,
  adminPermissionsRequestSchema,
  adminInviteCreateRequestSchema,
  adminFeatureToggleRequestSchema,
  adminAddonUpdateRequestSchema,
  adminCollabFeaturesRequestSchema,
  adminTestNotificationRequestSchema,
  adminTransitProviderRequestSchema,
} from '@trek/shared';

import { createZodDto } from 'nestjs-zod';

/**
 * Server-side createZodDto wrappers over the @trek/shared admin contracts. The
 * global ZodValidationPipe (APP_PIPE in app.module.ts) validates any @Body()
 * parameter typed with one of these classes by metatype — the Zod schemas in
 * shared/ remain the single source of truth for the wire contract.
 *
 * These cover the AdminController body contracts; the four feature toggles
 * share AdminFeatureToggleDto. The admin routes served by other domains
 * (packing templates, OIDC, notification and user-setting defaults) keep their
 * DTOs in those domains, so a domain controller never imports the admin domain.
 */
export class AdminUserCreateDto extends createZodDto(adminUserCreateRequestSchema) {}
export class AdminUserUpdateDto extends createZodDto(adminUserUpdateRequestSchema) {}
export class AdminPermissionsDto extends createZodDto(adminPermissionsRequestSchema) {}
export class AdminInviteCreateDto extends createZodDto(adminInviteCreateRequestSchema) {}
export class AdminFeatureToggleDto extends createZodDto(adminFeatureToggleRequestSchema) {}
export class AdminAddonUpdateDto extends createZodDto(adminAddonUpdateRequestSchema) {}
export class AdminCollabFeaturesDto extends createZodDto(adminCollabFeaturesRequestSchema) {}
export class AdminTestNotificationDto extends createZodDto(adminTestNotificationRequestSchema) {}
export class AdminTransitProviderDto extends createZodDto(adminTransitProviderRequestSchema) {}
