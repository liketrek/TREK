import { createZodDto } from 'nestjs-zod';
import {
  docsyncConnectionInputSchema,
  docsyncConnectionTestSchema,
  docsyncLinkInputSchema,
  docsyncLinkUpdateSchema,
  docsyncResolveConflictSchema,
  docsyncScopeCreateSchema,
  docsyncSyncNowSchema,
} from '@trek/shared';

/**
 * Zod DTOs for every mutating route in this domain.
 *
 * The boot-time ratchet in common/validate-body-contracts.ts refuses to start
 * if a mutation takes an unwrapped body, so these are not optional decoration.
 */
export class DocsyncConnectionDto extends createZodDto(docsyncConnectionInputSchema) {}
export class DocsyncConnectionTestDto extends createZodDto(docsyncConnectionTestSchema) {}
export class DocsyncLinkDto extends createZodDto(docsyncLinkInputSchema) {}
export class DocsyncLinkUpdateDto extends createZodDto(docsyncLinkUpdateSchema) {}
export class DocsyncScopeCreateDto extends createZodDto(docsyncScopeCreateSchema) {}
export class DocsyncResolveConflictDto extends createZodDto(docsyncResolveConflictSchema) {}
export class DocsyncSyncNowDto extends createZodDto(docsyncSyncNowSchema) {}
