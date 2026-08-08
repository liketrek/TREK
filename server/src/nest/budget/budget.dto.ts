import { createZodDto } from 'nestjs-zod';
import {
  budgetCreateItemRequestSchema,
  budgetUpdateItemRequestSchema,
  budgetUpdatePayersRequestSchema,
  budgetUpdateMembersRequestSchema,
  budgetToggleMemberPaidRequestSchema,
  budgetReorderItemsRequestSchema,
  budgetReorderCategoriesRequestSchema,
  budgetCreateSettlementRequestSchema,
  budgetUpdateSettlementRequestSchema,
} from '@trek/shared';

/**
 * Server-side createZodDto wrappers over the @trek/shared budget contracts. The
 * global ZodValidationPipe (APP_PIPE in app.module.ts) validates any @Body()
 * parameter typed with one of these classes by metatype — the Zod schemas in
 * shared/ remain the single source of truth for the wire contract.
 */
export class BudgetCreateItemDto extends createZodDto(budgetCreateItemRequestSchema) {}
export class BudgetUpdateItemDto extends createZodDto(budgetUpdateItemRequestSchema) {}
export class BudgetUpdatePayersDto extends createZodDto(budgetUpdatePayersRequestSchema) {}
export class BudgetUpdateMembersDto extends createZodDto(budgetUpdateMembersRequestSchema) {}
export class BudgetToggleMemberPaidDto extends createZodDto(budgetToggleMemberPaidRequestSchema) {}
export class BudgetReorderItemsDto extends createZodDto(budgetReorderItemsRequestSchema) {}
export class BudgetReorderCategoriesDto extends createZodDto(budgetReorderCategoriesRequestSchema) {}
export class BudgetCreateSettlementDto extends createZodDto(budgetCreateSettlementRequestSchema) {}
export class BudgetUpdateSettlementDto extends createZodDto(budgetUpdateSettlementRequestSchema) {}
