import {
  tripJournalCandidatesQuerySchema,
  tripJournalLinkMembersRequestSchema,
  tripJournalLinkRequestSchema,
} from '@trek/shared';

import { createZodDto } from 'nestjs-zod';

export class TripJournalLinkDto extends createZodDto(tripJournalLinkRequestSchema) {}
export class TripJournalLinkMembersDto extends createZodDto(tripJournalLinkMembersRequestSchema) {}
export class TripJournalCandidatesQueryDto extends createZodDto(tripJournalCandidatesQuerySchema) {}
