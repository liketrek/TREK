import {
  journeyDayImportRequestSchema,
  journeyRecordingPreviewRequestSchema,
  journeyRecordingSaveRequestSchema,
} from '@trek/shared';

import { createZodDto } from 'nestjs-zod';

export class JourneyRecordingPreviewDto extends createZodDto(journeyRecordingPreviewRequestSchema) {}
export class JourneyRecordingSaveDto extends createZodDto(journeyRecordingSaveRequestSchema) {}
export class JourneyDayImportDto extends createZodDto(journeyDayImportRequestSchema) {}
