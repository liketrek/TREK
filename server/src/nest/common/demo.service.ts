import { Users } from '../../db/entities/Users.entity';
import { RuntimeEnvService } from '../app-config/runtime-env.service';
import { isDemoEmail } from './demo';
import { EntityManager } from '@mikro-orm/core';
import { Injectable } from '@nestjs/common';

/**
 * Plan 3i Task 3 — `common/demo-write.ts#isDemoUserId(env, db, userId)`
 * converted onto an injected class: `DemoService.isDemoUserId(userId)`
 * resolves `env`/the repository via ITS OWN constructor instead of taking
 * them as parameters. The 5 external call sites (`trip-invite.mcp.ts`,
 * `plugins/contributions/plugin-mcp-tools.service.ts`, `feeds.mcp.ts`,
 * `categories.mcp.ts`, `budget.mcp.ts`) each inject this class and call
 * `this.demo.isDemoUserId(userId)` in place of the free function — every
 * one of them is an ordinary in-request MCP tool handler (no pre-init/boot
 * hazard, confirmed by `task-0-report.md` §6), so an injected `EntityManager`
 * resolving the current request's fork is exactly the right shape.
 *
 * `isDemoWriteBlocked`/`DEMO_WRITE_ERROR` (the six-upload-endpoint sibling
 * check) stay exactly where they are, in `common/demo-write.ts` — a
 * different, pure-function check over an already-known email string that
 * this task does not touch.
 *
 * Provided by `DemoModule` (`@Global()`, mirroring `AppConfigModule`'s own
 * shape) so the 5 survivor sites — each in a domain module this task does
 * not own — can inject it without any of those 5 modules needing an
 * explicit import.
 */
@Injectable()
export class DemoService {
  constructor(
    private readonly env: RuntimeEnvService,
    private readonly em: EntityManager,
  ) {}

  /**
   * `SELECT email FROM users WHERE id = ?`, gated by `env.isDemoMode()` —
   * byte-identical to the legacy `isDemoUserId(env, db, userId)`. Composes
   * `UsersRepository#getEmail` (the exact shape — `Users.repository.ts`,
   * Plan 3i Task 1's territory, never edited by this task) rather than a
   * new statement.
   */
  async isDemoUserId(userId: number): Promise<boolean> {
    if (!this.env.isDemoMode()) return false;
    const email = await this.em.getRepository(Users).getEmail(userId);
    return isDemoEmail(email);
  }
}
