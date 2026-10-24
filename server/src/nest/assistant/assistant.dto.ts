/**
 * createZodDto wrappers over the @trek/shared assistant contracts, so the
 * global ZodValidationPipe validates the bodies by metatype and the shared
 * schemas stay the one source of truth.
 */
import {
  assistantAddFoundPlaceRequestSchema,
  assistantAttachmentRequestSchema,
  assistantChatRequestSchema,
  assistantDecisionsRequestSchema,
  assistantInsertFoundPlaceRequestSchema,
  assistantRenderUploadRequestSchema,
  assistantShareRequestSchema,
  assistantStopRequestSchema,
  assistantTakeProposalRequestSchema,
  assistantUndoRequestSchema,
} from '@trek/shared';

import { createZodDto } from 'nestjs-zod';

export class AssistantAddFoundPlaceDto extends createZodDto(assistantAddFoundPlaceRequestSchema) {}
export class AssistantAttachmentDto extends createZodDto(assistantAttachmentRequestSchema) {}
export class AssistantChatDto extends createZodDto(assistantChatRequestSchema) {}
export class AssistantDecisionsDto extends createZodDto(assistantDecisionsRequestSchema) {}
export class AssistantInsertFoundPlaceDto extends createZodDto(assistantInsertFoundPlaceRequestSchema) {}
export class AssistantRenderUploadDto extends createZodDto(assistantRenderUploadRequestSchema) {}
export class AssistantShareDto extends createZodDto(assistantShareRequestSchema) {}
export class AssistantStopDto extends createZodDto(assistantStopRequestSchema) {}
export class AssistantTakeProposalDto extends createZodDto(assistantTakeProposalRequestSchema) {}
export class AssistantUndoDto extends createZodDto(assistantUndoRequestSchema) {}
