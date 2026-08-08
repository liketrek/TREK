import { createZodDto } from 'nestjs-zod';
import {
  fileUploadRequestSchema,
  fileUpdateRequestSchema,
  fileLinkRequestSchema,
} from '@trek/shared';

/**
 * Server-side createZodDto wrappers over the @trek/shared file contracts. The
 * global ZodValidationPipe (APP_PIPE in app.module.ts) validates any @Body()
 * parameter typed with one of these classes by metatype — the Zod schemas in
 * shared/ remain the single source of truth for the wire contract. Upload is
 * multipart: FileInterceptor populates req.body with the text fields before
 * the pipe runs, so the DTO sees plain strings.
 */
export class FileUploadDto extends createZodDto(fileUploadRequestSchema) {}
export class FileUpdateDto extends createZodDto(fileUpdateRequestSchema) {}
export class FileLinkDto extends createZodDto(fileLinkRequestSchema) {}
