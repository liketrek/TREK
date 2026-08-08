import { createZodDto } from 'nestjs-zod';
import {
  packingCreateItemRequestSchema,
  packingUpdateItemRequestSchema,
  packingSetSharingRequestSchema,
  packingImportRequestSchema,
  packingReorderRequestSchema,
  packingCreateBagRequestSchema,
  packingUpdateBagRequestSchema,
  packingBagMembersRequestSchema,
  packingSaveTemplateRequestSchema,
  packingApplyTemplateRequestSchema,
  packingCategoryAssigneesRequestSchema,
} from '@trek/shared';

/**
 * Server-side createZodDto wrappers over the @trek/shared packing contracts.
 * The global ZodValidationPipe (APP_PIPE in app.module.ts) validates any
 * @Body() parameter typed with one of these classes by metatype — the Zod
 * schemas in shared/ remain the single source of truth for the wire contract.
 */
export class PackingCreateItemDto extends createZodDto(packingCreateItemRequestSchema) {}
export class PackingUpdateItemDto extends createZodDto(packingUpdateItemRequestSchema) {}
export class PackingSetSharingDto extends createZodDto(packingSetSharingRequestSchema) {}
export class PackingImportDto extends createZodDto(packingImportRequestSchema) {}
export class PackingReorderDto extends createZodDto(packingReorderRequestSchema) {}
export class PackingCreateBagDto extends createZodDto(packingCreateBagRequestSchema) {}
export class PackingUpdateBagDto extends createZodDto(packingUpdateBagRequestSchema) {}
export class PackingBagMembersDto extends createZodDto(packingBagMembersRequestSchema) {}
export class PackingSaveTemplateDto extends createZodDto(packingSaveTemplateRequestSchema) {}
export class PackingApplyTemplateDto extends createZodDto(packingApplyTemplateRequestSchema) {}
export class PackingCategoryAssigneesDto extends createZodDto(packingCategoryAssigneesRequestSchema) {}
