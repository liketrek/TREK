import { createZodDto } from 'nestjs-zod';
import {
  collectionCreateRequestSchema,
  collectionUpdateRequestSchema,
  collectionReorderRequestSchema,
  collectionDeleteManyRequestSchema,
  collectionSavePlaceRequestSchema,
  collectionSaveFromTripRequestSchema,
  collectionSaveFromTripManyRequestSchema,
  collectionPlaceUpdateRequestSchema,
  collectionSetStatusRequestSchema,
  collectionSetStatusManyRequestSchema,
  collectionSetStatusFromTripRequestSchema,
  collectionCopyToTripRequestSchema,
  collectionInviteRequestSchema,
  collectionInviteActionRequestSchema,
  collectionInviteCancelRequestSchema,
  collectionRemoveMemberRequestSchema,
  collectionSetMemberRoleRequestSchema,
  collectionLabelCreateRequestSchema,
  collectionLabelUpdateRequestSchema,
  collectionLabelAssignRequestSchema,
} from '@trek/shared';

/**
 * Server-side createZodDto wrappers over the @trek/shared collections
 * contracts. Typing a controller parameter with one of these classes is what
 * lets the global ZodValidationPipe (APP_PIPE) validate it by metatype — the
 * Zod schemas in shared/ remain the single source of truth for the contract.
 */

export class CollectionCreateDto extends createZodDto(collectionCreateRequestSchema) {}
export class CollectionUpdateDto extends createZodDto(collectionUpdateRequestSchema) {}
export class CollectionReorderDto extends createZodDto(collectionReorderRequestSchema) {}
export class CollectionDeleteManyDto extends createZodDto(collectionDeleteManyRequestSchema) {}
export class CollectionSavePlaceDto extends createZodDto(collectionSavePlaceRequestSchema) {}
export class CollectionSaveFromTripDto extends createZodDto(collectionSaveFromTripRequestSchema) {}
export class CollectionSaveFromTripManyDto extends createZodDto(collectionSaveFromTripManyRequestSchema) {}
export class CollectionPlaceUpdateDto extends createZodDto(collectionPlaceUpdateRequestSchema) {}
export class CollectionSetStatusDto extends createZodDto(collectionSetStatusRequestSchema) {}
export class CollectionSetStatusManyDto extends createZodDto(collectionSetStatusManyRequestSchema) {}
export class CollectionSetStatusFromTripDto extends createZodDto(collectionSetStatusFromTripRequestSchema) {}
export class CollectionCopyToTripDto extends createZodDto(collectionCopyToTripRequestSchema) {}
export class CollectionInviteDto extends createZodDto(collectionInviteRequestSchema) {}
export class CollectionInviteActionDto extends createZodDto(collectionInviteActionRequestSchema) {}
export class CollectionInviteCancelDto extends createZodDto(collectionInviteCancelRequestSchema) {}
export class CollectionRemoveMemberDto extends createZodDto(collectionRemoveMemberRequestSchema) {}
export class CollectionSetMemberRoleDto extends createZodDto(collectionSetMemberRoleRequestSchema) {}
export class CollectionLabelCreateDto extends createZodDto(collectionLabelCreateRequestSchema) {}
export class CollectionLabelUpdateDto extends createZodDto(collectionLabelUpdateRequestSchema) {}
export class CollectionLabelAssignDto extends createZodDto(collectionLabelAssignRequestSchema) {}
