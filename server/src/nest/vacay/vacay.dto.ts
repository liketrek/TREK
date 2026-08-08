/**
 * Server-side createZodDto wrappers over the @trek/shared vacay contracts, so
 * the global ZodValidationPipe (APP_PIPE) validates bodies by metatype — the
 * shared Zod schemas stay the single source of truth.
 */
import { createZodDto } from 'nestjs-zod';
import {
  vacayAddHolidayCalendarRequestSchema,
  vacayAddYearRequestSchema,
  vacayCompanyHolidayRequestSchema,
  vacayInviteActionRequestSchema,
  vacayInviteRequestSchema,
  vacaySetColorRequestSchema,
  vacayShareRequestSchema,
  vacayShareUpdateRequestSchema,
  vacayToggleEntryRequestSchema,
  vacayUpdateHolidayCalendarRequestSchema,
  vacayUpdatePlanRequestSchema,
  vacayUpdateStatsRequestSchema,
  vacayYearSettingsRequestSchema,
} from '@trek/shared';

export class VacayUpdatePlanDto extends createZodDto(vacayUpdatePlanRequestSchema) {}
export class VacayAddHolidayCalendarDto extends createZodDto(vacayAddHolidayCalendarRequestSchema) {}
export class VacayUpdateHolidayCalendarDto extends createZodDto(vacayUpdateHolidayCalendarRequestSchema) {}
export class VacaySetColorDto extends createZodDto(vacaySetColorRequestSchema) {}
export class VacayInviteDto extends createZodDto(vacayInviteRequestSchema) {}
export class VacayInviteActionDto extends createZodDto(vacayInviteActionRequestSchema) {}
export class VacayAddYearDto extends createZodDto(vacayAddYearRequestSchema) {}
export class VacayToggleEntryDto extends createZodDto(vacayToggleEntryRequestSchema) {}
export class VacayCompanyHolidayDto extends createZodDto(vacayCompanyHolidayRequestSchema) {}
export class VacayUpdateStatsDto extends createZodDto(vacayUpdateStatsRequestSchema) {}
export class VacayShareDto extends createZodDto(vacayShareRequestSchema) {}
export class VacayYearSettingsDto extends createZodDto(vacayYearSettingsRequestSchema) {}
export class VacayShareUpdateDto extends createZodDto(vacayShareUpdateRequestSchema) {}
