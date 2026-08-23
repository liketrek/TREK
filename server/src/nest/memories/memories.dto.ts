import { createZodDto } from 'nestjs-zod';
import {
  addTripPhotosSchema,
  createAlbumLinkSchema,
  immichSearchSchema,
  immichSettingsSchema,
  immichTestSchema,
  removeTripPhotoSchema,
  setTripPhotoSharingSchema,
  synologySearchSchema,
  synologySettingsSchema,
  synologyTestSchema,
} from '@trek/shared';

/**
 * Server-side createZodDto wrappers over the @trek/shared memories contracts.
 * The global ZodValidationPipe (APP_PIPE in app.module.ts) validates any @Body()
 * parameter typed with one of these classes by metatype — the Zod schemas in
 * shared/ remain the single source of truth for the wire contract.
 *
 * These nine routes were the last memories entries in
 * common/body-contract-allow-list.ts; the boot gate throws on stale entries, so
 * they were removed in the same change.
 */
export class ImmichSettingsDto extends createZodDto(immichSettingsSchema) {}
export class ImmichTestDto extends createZodDto(immichTestSchema) {}
export class ImmichSearchDto extends createZodDto(immichSearchSchema) {}

export class SynologySettingsDto extends createZodDto(synologySettingsSchema) {}
export class SynologyTestDto extends createZodDto(synologyTestSchema) {}
export class SynologySearchDto extends createZodDto(synologySearchSchema) {}

export class AddTripPhotosDto extends createZodDto(addTripPhotosSchema) {}
export class SetTripPhotoSharingDto extends createZodDto(setTripPhotoSharingSchema) {}
export class RemoveTripPhotoDto extends createZodDto(removeTripPhotoSchema) {}
export class CreateAlbumLinkDto extends createZodDto(createAlbumLinkSchema) {}
