import { DemoService } from './demo.service';
import { Global, Module } from '@nestjs/common';

/**
 * Global home for `DemoService` (Plan 3i Task 3). The 5 `isDemoUserId`
 * survivor sites (`trip-invite.mcp.ts`,
 * `plugins/contributions/plugin-mcp-tools.service.ts`, `feeds.mcp.ts`,
 * `categories.mcp.ts`, `budget.mcp.ts`) live in 5 different domain modules
 * this task does not own; `@Global()` (the same shape `AppConfigModule`
 * uses) lets every one of them inject `DemoService` by constructor without
 * any of those 5 modules needing an explicit import. `DemoService`'s own
 * dependencies (`RuntimeEnvService`, `EntityManager`) are already global
 * providers themselves (`AppConfigModule`, `MikroOrmModule.forRoot`'s core
 * module) — this module exists only to make `DemoService` itself
 * resolvable, registered once in `app.module.ts`.
 */
@Global()
@Module({
  providers: [DemoService],
  exports: [DemoService],
})
export class DemoModule {}
