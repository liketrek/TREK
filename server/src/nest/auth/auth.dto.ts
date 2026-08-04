import { createZodDto } from 'nestjs-zod';
import {
  registerRequestSchema,
  loginRequestSchema,
  forgotPasswordRequestSchema,
  resetPasswordRequestSchema,
  changePasswordRequestSchema,
  mfaVerifyLoginRequestSchema,
  mfaEnableRequestSchema,
  mfaDisableRequestSchema,
  mcpTokenCreateRequestSchema,
  mapsKeyUpdateRequestSchema,
  apiKeysUpdateRequestSchema,
  settingsUpdateRequestSchema,
  appSettingsUpdateRequestSchema,
  resourceTokenRequestSchema,
  passkeyRegisterOptionsRequestSchema,
  passkeyRegisterVerifyRequestSchema,
  passkeyLoginVerifyRequestSchema,
  passkeyRenameRequestSchema,
  passkeyDeleteRequestSchema,
} from '@trek/shared';

/**
 * Server-side createZodDto wrappers over the @trek/shared auth contracts. The
 * global ZodValidationPipe (APP_PIPE in app.module.ts) validates any @Body()
 * parameter typed with one of these classes by metatype — the Zod schemas in
 * shared/ remain the single source of truth for the wire contract. The
 * credential/MFA rules (and their bespoke 4xx strings) stay in AuthService;
 * these pin only the well-defined request shapes.
 */
export class RegisterDto extends createZodDto(registerRequestSchema) {}
export class LoginDto extends createZodDto(loginRequestSchema) {}
export class ForgotPasswordDto extends createZodDto(forgotPasswordRequestSchema) {}
export class ResetPasswordDto extends createZodDto(resetPasswordRequestSchema) {}
export class ChangePasswordDto extends createZodDto(changePasswordRequestSchema) {}
export class MfaVerifyLoginDto extends createZodDto(mfaVerifyLoginRequestSchema) {}
export class MfaEnableDto extends createZodDto(mfaEnableRequestSchema) {}
export class MfaDisableDto extends createZodDto(mfaDisableRequestSchema) {}
export class McpTokenCreateDto extends createZodDto(mcpTokenCreateRequestSchema) {}
export class MapsKeyUpdateDto extends createZodDto(mapsKeyUpdateRequestSchema) {}
export class ApiKeysUpdateDto extends createZodDto(apiKeysUpdateRequestSchema) {}
export class SettingsUpdateDto extends createZodDto(settingsUpdateRequestSchema) {}
export class AppSettingsUpdateDto extends createZodDto(appSettingsUpdateRequestSchema) {}
export class ResourceTokenDto extends createZodDto(resourceTokenRequestSchema) {}
export class PasskeyRegisterOptionsDto extends createZodDto(passkeyRegisterOptionsRequestSchema) {}
export class PasskeyRegisterVerifyDto extends createZodDto(passkeyRegisterVerifyRequestSchema) {}
export class PasskeyLoginVerifyDto extends createZodDto(passkeyLoginVerifyRequestSchema) {}
export class PasskeyRenameDto extends createZodDto(passkeyRenameRequestSchema) {}
export class PasskeyDeleteDto extends createZodDto(passkeyDeleteRequestSchema) {}
