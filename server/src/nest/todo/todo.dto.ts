import { createZodDto } from 'nestjs-zod';
import {
  todoCreateItemRequestSchema,
  todoUpdateItemRequestSchema,
  todoReorderRequestSchema,
  todoCategoryAssigneesRequestSchema,
} from '@trek/shared';

/**
 * Server-side createZodDto wrappers over the @trek/shared todo contracts. The
 * global ZodValidationPipe (APP_PIPE in app.module.ts) validates any @Body()
 * parameter typed with one of these classes by metatype — the Zod schemas in
 * shared/ remain the single source of truth for the wire contract.
 */
export class TodoCreateItemDto extends createZodDto(todoCreateItemRequestSchema) {}
export class TodoUpdateItemDto extends createZodDto(todoUpdateItemRequestSchema) {}
export class TodoReorderDto extends createZodDto(todoReorderRequestSchema) {}
export class TodoCategoryAssigneesDto extends createZodDto(todoCategoryAssigneesRequestSchema) {}
