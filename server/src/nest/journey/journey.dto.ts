import { createZodDto } from 'nestjs-zod';
import {
  journeyAddTripRequestSchema,
  journeyContributorRequestSchema,
  journeyContributorUpdateRequestSchema,
  journeyCreateRequestSchema,
  journeyEntryCreateRequestSchema,
  journeyEntryPhotoUploadRequestSchema,
  journeyEntryUpdateRequestSchema,
  journeyGalleryVideoRequestSchema,
  journeyLinkPhotoRequestSchema,
  journeyPhotoUpdateRequestSchema,
  journeyPreferencesRequestSchema,
  journeyProviderPhotosRequestSchema,
  journeyReorderEntriesRequestSchema,
  journeyShareLinkRequestSchema,
  journeyUpdateRequestSchema,
} from '@trek/shared';

/**
 * Server-side createZodDto wrappers over the @trek/shared journey contracts.
 * The global ZodValidationPipe (APP_PIPE in app.module.ts) validates any @Body()
 * parameter typed with one of these classes by metatype — the Zod schemas in
 * shared/ remain the single source of truth for the wire contract.
 *
 * The schemas behind them are deliberately permissive, and the bespoke 400s stay
 * in the controller: eight of these handlers answer with their own message
 * ('Title is required', 'trip_id required', 'provider and asset_id required',
 * 'journey_photo_id required', 'entry_date is required', 'user_id required'),
 * and those bodies are pinned. A guard-tight schema would have the pipe answer
 * first, with a different body — a client-visible change, not a refactor.
 *
 * These sixteen routes were the largest block in
 * common/body-contract-allow-list.ts; the boot gate throws on stale entries, so
 * they were removed in the same change.
 */
export class JourneyCreateDto extends createZodDto(journeyCreateRequestSchema) {}
export class JourneyUpdateDto extends createZodDto(journeyUpdateRequestSchema) {}
export class JourneyAddTripDto extends createZodDto(journeyAddTripRequestSchema) {}
export class JourneyEntryCreateDto extends createZodDto(journeyEntryCreateRequestSchema) {}
export class JourneyEntryUpdateDto extends createZodDto(journeyEntryUpdateRequestSchema) {}
export class JourneyReorderEntriesDto extends createZodDto(journeyReorderEntriesRequestSchema) {}
export class JourneyContributorAddDto extends createZodDto(journeyContributorRequestSchema) {}
export class JourneyContributorUpdateDto extends createZodDto(journeyContributorUpdateRequestSchema) {}
export class JourneyPreferencesDto extends createZodDto(journeyPreferencesRequestSchema) {}
export class JourneyShareLinkDto extends createZodDto(journeyShareLinkRequestSchema) {}
export class JourneyProviderPhotosDto extends createZodDto(journeyProviderPhotosRequestSchema) {}
export class JourneyLinkPhotoDto extends createZodDto(journeyLinkPhotoRequestSchema) {}
export class JourneyPhotoUpdateDto extends createZodDto(journeyPhotoUpdateRequestSchema) {}
export class JourneyEntryPhotoUploadDto extends createZodDto(journeyEntryPhotoUploadRequestSchema) {}
export class JourneyGalleryVideoDto extends createZodDto(journeyGalleryVideoRequestSchema) {}
