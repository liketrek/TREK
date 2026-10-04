import { createZodDto } from 'nestjs-zod';
import {
  shoppingCreateItemRequestSchema,
  shoppingUpdateItemRequestSchema,
  shoppingReorderRequestSchema,
} from '@trek/shared';

export class ShoppingCreateItemDto extends createZodDto(shoppingCreateItemRequestSchema) {}
export class ShoppingUpdateItemDto extends createZodDto(shoppingUpdateItemRequestSchema) {}
export class ShoppingReorderDto extends createZodDto(shoppingReorderRequestSchema) {}
