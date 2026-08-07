import { createZodDto } from 'nestjs-zod';
import { createCategoryRequestSchema, updateCategoryRequestSchema } from '@trek/shared';

/**
 * createZodDto wrappers over the @trek/shared category contracts.
 *
 * Typing a controller parameter with one of these is what lets the global
 * ZodValidationPipe validate it by metatype — `@Body('color')` reads a property
 * and carries no metatype, so it was never validated at all. The schemas in
 * shared/ stay the single source of truth.
 */
export class CategoryCreateDto extends createZodDto(createCategoryRequestSchema) {}
export class CategoryUpdateDto extends createZodDto(updateCategoryRequestSchema) {}
