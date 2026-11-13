import {
  mailIngestApplyRequestSchema,
  mailIngestFileRequestSchema,
  mailIngestInboxQuerySchema,
  mailIngestMoveRequestSchema,
  mailIngestPrefsUpdateRequestSchema,
  mailIngestUndoRequestSchema,
} from '@trek/shared';

import { createZodDto } from 'nestjs-zod';

export class MailIngestPrefsUpdateDto extends createZodDto(mailIngestPrefsUpdateRequestSchema) {}
export class MailIngestInboxQueryDto extends createZodDto(mailIngestInboxQuerySchema) {}
export class MailIngestApplyDto extends createZodDto(mailIngestApplyRequestSchema) {}
export class MailIngestMoveDto extends createZodDto(mailIngestMoveRequestSchema) {}
export class MailIngestFileDto extends createZodDto(mailIngestFileRequestSchema) {}
export class MailIngestUndoDto extends createZodDto(mailIngestUndoRequestSchema) {}
