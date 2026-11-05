import {
  placeContribDecisionRequestSchema,
  placeContribLogQuerySchema,
  placeContribWithdrawRequestSchema,
  type PlaceContribDecisionRequest,
  type PlaceContribFieldSwitches,
} from '@trek/shared';

import { createZodDto } from 'nestjs-zod';
import type { z } from 'zod';

/**
 * The fields the decision's variants share. Its contract is a union over
 * `action`, and a class cannot extend a union: the DTO is typed as this common
 * shape while the pipe validates against the full union.
 */
interface PlaceContribDecisionFields {
  action: PlaceContribDecisionRequest['action'];
  termsVersion?: number;
  fields?: PlaceContribFieldSwitches;
  withdraw?: boolean;
}

/** Zod-pipe wrappers over the @trek/shared contracts of /api/admin/places-contribute. */
export class PlaceContribDecisionDto extends createZodDto(
  placeContribDecisionRequestSchema as z.ZodType<PlaceContribDecisionFields>,
) {}
export class PlaceContribLogQueryDto extends createZodDto(placeContribLogQuerySchema) {}
export class PlaceContribWithdrawDto extends createZodDto(placeContribWithdrawRequestSchema) {}
