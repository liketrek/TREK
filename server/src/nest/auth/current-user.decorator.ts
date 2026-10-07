import type { User } from '../../types';
import { createParamDecorator, ExecutionContext } from '@nestjs/common';

/**
 * Resolves the authenticated user attached by JwtAuthGuard.
 * Use on guarded handlers: `getThing(@CurrentUser() user: User) { ... }`.
 */
export const CurrentUser = createParamDecorator((_data: unknown, context: ExecutionContext): User | undefined => {
  return context.switchToHttp().getRequest().user;
});
