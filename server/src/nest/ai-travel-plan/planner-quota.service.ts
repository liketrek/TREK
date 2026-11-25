import { AiTravelPlans } from '../../db/entities/AiTravelPlans.entity';
import type { AiTravelPlansRepository } from '../../db/repositories/AiTravelPlans.repository';
import { AiConnectionsService } from '../ai-connections/ai-connections.service';
import { AiUsageService } from '../ai-connections/ai-usage.service';
import { logWarn } from '../audit/audit-log.logger';
import type { AppSettingKey } from '../common/app-settings.registry';
import { DomainError } from '../common/domain-error';
import { SettingsService } from '../settings/settings.service';
import { InjectRepository } from '@mikro-orm/nestjs';
import { Injectable } from '@nestjs/common';
import { todayUtc, type AiConnectionScope, type TravelPlanModelMeta, type TravelPlanQuota } from '@trek/shared';

/** What each cap is when no admin row exists; 0 in a row means "no cap". */
const DEFAULT_LIMITS: PlannerQuotaLimits = {
  dailyGenerations: 30,
  dailyTokens: 300_000,
  instanceDailyTokens: 3_000_000,
  instanceMonthlyTokens: 60_000_000,
};

export interface PlannerQuotaLimits {
  /** Generations one user may start per UTC day. */
  dailyGenerations: number;
  /** Tokens one user may spend per UTC day on the instance's connection. */
  dailyTokens: number;
  /** Tokens everybody may spend per UTC day on the instance's connection. */
  instanceDailyTokens: number;
  /** Tokens everybody may spend per UTC calendar month on the instance's connection. */
  instanceMonthlyTokens: number;
}

export interface PlannerModelPolicy {
  /** Who pays for the model calls, or null when no connection could be resolved. */
  paidBy: AiConnectionScope | null;
  /** False when a token cap is already reached: the plan is built from the structured fields only. */
  allowModel: boolean;
}

/**
 * OPS-01: the travel planner's rate and cost caps.
 *
 * A generation is refused with 429 `daily_limit` before it starts, so no model
 * call and no place search runs past the cap. Token caps degrade instead: the
 * request keeps the fields the traveller typed, the parser skips the model and
 * the plan carries a `usage_limit` warning. Every cap is read from
 * `app_settings` on each call, so an admin's change applies to the next
 * generation. Token caps count only `instance`-paid calls: a traveller who
 * connected their own key spends their own budget.
 */
@Injectable()
export class PlannerQuotaService {
  constructor(
    @InjectRepository(AiTravelPlans) private readonly plans: AiTravelPlansRepository,
    private readonly settings: SettingsService,
    private readonly usage: AiUsageService,
    private readonly connections: AiConnectionsService,
  ) {}

  async limits(): Promise<PlannerQuotaLimits> {
    const [dailyGenerations, dailyTokens, instanceDailyTokens, instanceMonthlyTokens] = await Promise.all([
      this.readLimit('ai_planner_daily_generations', DEFAULT_LIMITS.dailyGenerations),
      this.readLimit('ai_planner_daily_tokens', DEFAULT_LIMITS.dailyTokens),
      this.readLimit('ai_planner_instance_daily_tokens', DEFAULT_LIMITS.instanceDailyTokens),
      this.readLimit('ai_planner_instance_monthly_tokens', DEFAULT_LIMITS.instanceMonthlyTokens),
    ]);
    return { dailyGenerations, dailyTokens, instanceDailyTokens, instanceMonthlyTokens };
  }

  /** Refuses with 429 `daily_limit` when this user has used today's generations. */
  async assertGenerationAllowed(userId: number): Promise<void> {
    const { dailyGenerations } = await this.limits();
    if (dailyGenerations <= 0) return;
    const used = await this.usedGenerationsToday(userId);
    if (used < dailyGenerations) return;
    throw new DomainError(429, `今日 AI 生成次数已用完（${used}/${dailyGenerations}），请明天再试或联系管理员。`, {
      code: 'daily_limit',
      details: { code: 'daily_limit', used, limit: dailyGenerations },
    });
  }

  /** Today's usage against the per-user cap, for the response; null when the cap is off. */
  async view(userId: number): Promise<TravelPlanQuota | null> {
    const { dailyGenerations } = await this.limits();
    if (dailyGenerations <= 0) return null;
    return { used: await this.usedGenerationsToday(userId), limit: dailyGenerations };
  }

  /**
   * Whether this generation may call a model. Resolving the connection here
   * answers who pays; a user's own connection never spends the instance's
   * token budget. A missing connection is not a refusal here: the parser
   * reports `model_not_configured` itself and no model is billed.
   */
  async modelPolicy(userId: number): Promise<PlannerModelPolicy> {
    let paidBy: AiConnectionScope;
    try {
      paidBy = (await this.connections.resolveForUser(userId)).paidBy;
    } catch {
      return { paidBy: null, allowModel: true };
    }
    if (paidBy !== 'instance') return { paidBy, allowModel: true };

    const limits = await this.limits();
    const monthStart = `${todayUtc().slice(0, 8)}01`;
    const [userTokens, instanceTokens, monthTokens] = await Promise.all([
      limits.dailyTokens > 0 ? this.usage.tokensToday(userId, 'instance') : 0,
      limits.instanceDailyTokens > 0 ? this.usage.instanceTokensToday() : 0,
      limits.instanceMonthlyTokens > 0 ? this.usage.instanceTokensSince(monthStart) : 0,
    ]);
    const allowModel =
      (limits.dailyTokens <= 0 || userTokens < limits.dailyTokens) &&
      (limits.instanceDailyTokens <= 0 || instanceTokens < limits.instanceDailyTokens) &&
      (limits.instanceMonthlyTokens <= 0 || monthTokens < limits.instanceMonthlyTokens);
    return { paidBy: 'instance', allowModel };
  }

  /**
   * Books what this generation's model calls cost. A failed write is logged,
   * never thrown: accounting must not lose the plan the traveller generated.
   *
   * @txStandalone a usage row stands on its own; it is an audit of a model call, not part of the plan's transaction
   */
  async record(userId: number, paidBy: AiConnectionScope | null, meta: TravelPlanModelMeta): Promise<void> {
    const inputTokens = meta.promptTokens ?? 0;
    const outputTokens = meta.completionTokens ?? 0;
    if (!paidBy || (inputTokens === 0 && outputTokens === 0)) return;
    try {
      await this.usage.record(userId, paidBy, { inputTokens, outputTokens });
    } catch (err) {
      logWarn(
        `[ai-travel-plan] usage record failed for user ${userId}: ${err instanceof Error ? err.message : String(err)}`,
      );
    }
  }

  private async usedGenerationsToday(userId: number): Promise<number> {
    return this.plans.countGenerationsSince(userId, `${todayUtc()} 00:00:00`);
  }

  private async readLimit(key: AppSettingKey, fallback: number): Promise<number> {
    const raw = await this.settings.getAppSetting(key);
    if (raw === null || raw.trim() === '') return fallback;
    const value = Number(raw);
    return Number.isFinite(value) && value >= 0 ? Math.floor(value) : fallback;
  }
}
