import { AiTravelPlanRevisions } from '../../db/entities/AiTravelPlanRevisions.entity';
import { AiTravelPlans } from '../../db/entities/AiTravelPlans.entity';
import {
  AI_TRAVEL_PLAN_APPLY_RESULT,
  AI_TRAVEL_PLAN_REQUEST,
  AI_TRAVEL_PLAN_REVISION_DRAFT,
  AI_TRAVEL_PLAN_REVISION_FACTS,
  AI_TRAVEL_PLAN_REVISION_MODEL_META,
  AI_TRAVEL_PLAN_REVISION_WARNINGS,
} from '../../db/json-columns';
import type { AiTravelPlanRevisionsRepository } from '../../db/repositories/AiTravelPlanRevisions.repository';
import type { AiTravelPlansRepository } from '../../db/repositories/AiTravelPlans.repository';
import { dbNow, parseDbTimestamp, utcSuffix, type DbTimestamp } from '../../db/types';
import type { User } from '../../types';
import { decodeJson, encodeJson } from '../../utils/json-column';
import { AuditService } from '../audit/audit.service';
import { DomainError } from '../common/domain-error';
import { UnitOfWork } from '../database/unit-of-work';
import { PermissionsService } from '../permissions/permissions.service';
import { TripAccessService } from '../trip-membership/trip-access.service';
import { PlanApplyClaimLostError, PlannerApplyService } from './planner-apply.service';
import { TRAVEL_PLAN_ENGINE, type TravelPlanEngine, type TravelPlanEngineResult } from './travel-plan-engine';
import { UniqueConstraintViolationException } from '@mikro-orm/core';
import { InjectRepository } from '@mikro-orm/nestjs';
import { Inject, Injectable } from '@nestjs/common';
import {
  APPLICABLE_TRAVEL_PLAN_STATUSES,
  EDITABLE_TRAVEL_PLAN_STATUSES,
  emptyTravelPlanDraft,
  travelPlanStatusSchema,
  type TravelPlan,
  type TravelPlanApplyRequest,
  type TravelPlanApplyResponse,
  type TravelPlanCreateRequest,
  type TravelPlanDiscardResponse,
  type TravelPlanDraft,
  type TravelPlanRevision,
  type TravelPlanRevisionRequest,
  type TravelPlanRevisionResponse,
  type TravelPlanStatus,
  type TravelPlanStreamEvent,
  type TravelPlanStreamStage,
  type TravelPlanUndoResponse,
  type TravelPlanWarning,
} from '@trek/shared';

/** How long a generated draft stays applicable before it counts as expired. */
const PLAN_TTL_DAYS = 7;

/** What the streaming route tells the traveller at each stage. */
const STAGE_MESSAGES: Record<TravelPlanStreamStage, string> = {
  parsing: '正在解析你的旅行需求…',
  places: '正在检索真实地点…',
  routing: '正在计算地点之间的交通…',
  scheduling: '正在排布每天的行程…',
  validating: '正在校验行程…',
};

/** The empty draft a plan reads as when it has no revision yet. */
const NO_REVISION_CHECKED_AT = '1970-01-01 00:00:00';

/** `X-Idempotency-Key` limits, matching the global interceptor's. */
const IDEMPOTENCY_KEY_MAX = 200;

/**
 * AI travel plans: the traveller's request, the planner's draft revisions, and
 * the explicit apply that will later write a trip.
 *
 * Phase 1 ships the data model, the versioned drafts and the full REST
 * contract. Reading, revising and discarding work end to end; applying
 * validates everything and refuses with 501 until the trip-writing phase
 * lands — no trip row is written before an explicit, implemented apply.
 */
@Injectable()
export class AiTravelPlanService {
  constructor(
    @InjectRepository(AiTravelPlans) private readonly plans: AiTravelPlansRepository,
    @InjectRepository(AiTravelPlanRevisions) private readonly revisions: AiTravelPlanRevisionsRepository,
    private readonly uow: UnitOfWork,
    private readonly audit: AuditService,
    private readonly permissions: PermissionsService,
    private readonly tripAccess: TripAccessService,
    private readonly applyService: PlannerApplyService,
    @Inject(TRAVEL_PLAN_ENGINE) private readonly engine: TravelPlanEngine,
  ) {}

  /** Generates revision 1 and stores the plan. Nothing touches a trip. */
  async create(user: User, request: TravelPlanCreateRequest): Promise<{ plan: TravelPlan }> {
    await this.requireTripCreate(user);

    const now = dbNow();
    const startedAt = Date.now();
    const result = await this.engine.generate({ request, userId: user.id });
    const durationMs = Date.now() - startedAt;
    const encoded = this.encodeRevision(result);
    const status = result.status ?? 'ready';

    const planId = await this.uow.transactional(async () => {
      const id = await this.plans.insert({
        owner: user.id,
        status,
        request_json: encodeJson(AI_TRAVEL_PLAN_REQUEST, request),
        current_revision: 1,
        targetTrip: null,
        appliedTrip: null,
        expires_at: addDays(now, PLAN_TTL_DAYS),
        created_at: now,
        updated_at: now,
      });
      await this.revisions.insert({
        plan: id,
        version: 1,
        reason: null,
        ...encoded,
        duration_ms: durationMs,
        created_at: now,
      });
      return id;
    });

    await this.audit.writeAudit({
      userId: user.id,
      action: 'ai_travel_plan.create',
      resource: `ai_travel_plan:${planId}`,
      details: { planId, revision: 1, engine: result.modelMeta.engine },
    });

    return { plan: await this.loadView(planId, user.id) };
  }

  /**
   * PLAN-11: create and generate while reporting progress over SSE.
   *
   * The row exists before generation starts, so a dropped connection never
   * cancels the work: generation runs to completion, the revision and status
   * are persisted exactly as the JSON route does, and the client reattaches
   * with `GET /:id`. Writes to a closed stream are dropped by the writer, not
   * by this method.
   */
  async createStreaming(
    user: User,
    request: TravelPlanCreateRequest,
    emit: (event: TravelPlanStreamEvent) => void,
  ): Promise<void> {
    await this.requireTripCreate(user);

    const now = dbNow();
    const planId = await this.uow.transactional(async () =>
      this.plans.insert({
        owner: user.id,
        status: 'generating',
        request_json: encodeJson(AI_TRAVEL_PLAN_REQUEST, request),
        current_revision: 0,
        targetTrip: null,
        appliedTrip: null,
        expires_at: addDays(now, PLAN_TTL_DAYS),
        created_at: now,
        updated_at: now,
      }),
    );
    emit({ type: 'plan', plan: await this.loadView(planId, user.id) });

    const startedAt = Date.now();
    try {
      const result = await this.engine.generate({
        userId: user.id,
        request,
        onStage: (stage) => emit({ type: 'progress', stage, message: STAGE_MESSAGES[stage] }),
      });
      const durationMs = Date.now() - startedAt;
      const encoded = this.encodeRevision(result);
      const status = result.status ?? 'ready';

      await this.uow.transactional(async () => {
        await this.revisions.insert({
          plan: planId,
          version: 1,
          reason: null,
          ...encoded,
          duration_ms: durationMs,
          created_at: dbNow(),
        });
        await this.plans.nativeUpdate(
          { id: planId, owner: user.id },
          { status, current_revision: 1, updated_at: dbNow() },
        );
      });

      await this.audit.writeAudit({
        userId: user.id,
        action: 'ai_travel_plan.create',
        resource: `ai_travel_plan:${planId}`,
        details: { planId, revision: 1, engine: result.modelMeta.engine, streamed: true },
      });

      emit({ type: 'done', plan: await this.loadView(planId, user.id) });
    } catch {
      await this.plans.nativeUpdate({ id: planId, owner: user.id }, { status: 'failed', updated_at: dbNow() });
      emit({
        type: 'error',
        code: 'generation_failed',
        message: '生成过程出错，本次没有写入任何行程数据，请稍后重试。',
      });
    }
  }
  async get(user: User, rawId: string): Promise<{ plan: TravelPlan }> {
    return { plan: await this.loadView(parsePlanId(rawId), user.id) };
  }

  /** Appends a new immutable revision and points the plan at it. */
  async createRevision(
    user: User,
    rawId: string,
    body: TravelPlanRevisionRequest,
  ): Promise<TravelPlanRevisionResponse> {
    const planId = parsePlanId(rawId);
    const now = dbNow();
    const plan = await this.mustFindOwned(planId, user.id);
    const status = effectiveStatus(plan, now);
    if (!EDITABLE_TRAVEL_PLAN_STATUSES.includes(status)) {
      throw planError(409, `草案当前状态为 ${status}，不能修改。`, 'plan_not_editable', { status });
    }
    if (body.expectedRevision !== undefined && body.expectedRevision !== plan.current_revision) {
      throw planError(409, `草案已更新到第 ${plan.current_revision} 版，请刷新后再提交。`, 'revision_conflict', {
        currentRevision: plan.current_revision,
      });
    }

    const startedAt = Date.now();
    const result = await this.engine.revise({
      request: decodeJson(AI_TRAVEL_PLAN_REQUEST, plan.request_json, `plan ${plan.id}`),
      draft: await this.currentDraft(plan),
      feedback: body.feedback,
      userId: user.id,
    });
    const durationMs = Date.now() - startedAt;
    const version = plan.current_revision + 1;
    const encoded = this.encodeRevision(result);
    const nextStatus = result.status ?? 'ready';

    try {
      await this.uow.transactional(async () => {
        await this.revisions.insert({
          plan: plan.id,
          version,
          reason: body.feedback,
          ...encoded,
          duration_ms: durationMs,
          created_at: now,
        });
        await this.plans.nativeUpdate(
          { id: plan.id, owner: user.id },
          { status: nextStatus, current_revision: version, updated_at: now },
        );
      });
    } catch (err) {
      // Two concurrent revisions both computed `current + 1`; the unique
      // (plan_id, version) pair refused the second one.
      if (err instanceof UniqueConstraintViolationException) {
        throw planError(409, '草案已被其他请求更新，请刷新后重试。', 'revision_conflict');
      }
      throw err;
    }

    await this.audit.writeAudit({
      userId: user.id,
      action: 'ai_travel_plan.revise',
      resource: `ai_travel_plan:${plan.id}`,
      details: { planId: plan.id, revision: version },
    });

    const revision = await this.revisions.findByVersion(plan.id, version);
    return {
      plan: await this.loadView(plan.id, user.id),
      // The insert above is the only source for this version; a missing row
      // here would mean the insert vanished, which is a bug, not a 404.
      revision: toRevisionView(revision as AiTravelPlanRevisions),
    };
  }

  /**
   * Applies a ready draft: one transaction writes the draft into the trip,
   * claims the plan row and records what it wrote. Replaying an applied plan
   * answers its trip without writing a second copy. The room events go out
   * only after the commit.
   */
  async apply(
    user: User,
    rawId: string,
    body: TravelPlanApplyRequest,
    idempotencyKey: string | undefined,
  ): Promise<TravelPlanApplyResponse> {
    if (!idempotencyKey || idempotencyKey.trim() === '') {
      throw planError(400, '应用方案必须携带 X-Idempotency-Key 请求头。', 'idempotency_key_required');
    }
    if (idempotencyKey.length > IDEMPOTENCY_KEY_MAX) {
      throw planError(400, `X-Idempotency-Key 不能超过 ${IDEMPOTENCY_KEY_MAX} 个字符。`, 'idempotency_key_too_long');
    }

    const planId = parsePlanId(rawId);
    const now = dbNow();
    const plan = await this.mustFindOwned(planId, user.id);
    const status = effectiveStatus(plan, now);

    if (status === 'applied' && plan.applied_trip_id) {
      // Idempotent replay: the same plan always answers its own trip.
      return { plan: await this.loadView(plan.id, user.id), tripId: plan.applied_trip_id };
    }
    if (status === 'expired') {
      throw planError(410, '草案已过期或已放弃，不能应用。', 'plan_expired');
    }
    if (!APPLICABLE_TRAVEL_PLAN_STATUSES.includes(status)) {
      throw planError(409, `草案当前状态为 ${status}，不能应用。`, 'plan_not_applicable', { status });
    }

    if (body.mode === 'existing_trip') {
      const tripId = body.tripId as number;
      const access = await this.tripAccess.findAccessible(tripId, user.id);
      if (!access) throw planError(404, '行程不存在或无权访问。', 'trip_not_found');
      const isMember = access.user_id !== user.id;
      const allowed = await this.permissions.checkPermission('trip_edit', user.role, access.user_id, user.id, isMember);
      if (!allowed) throw planError(403, '你没有编辑该行程的权限。', 'trip_edit_forbidden');
    }

    const draft = await this.currentDraft(plan);
    if (draft.days.length === 0) {
      throw planError(409, '草案还没有可写入的行程内容，请先补充或重新生成草案。', 'plan_empty_draft');
    }

    let tripId: number;
    try {
      ({ tripId } = await this.applyService.apply({
        plan,
        user,
        body,
        request: decodeJson(AI_TRAVEL_PLAN_REQUEST, plan.request_json, `plan ${plan.id}`),
        draft,
      }));
    } catch (err) {
      if (!(err instanceof PlanApplyClaimLostError)) throw err;
      // Another request claimed the plan and left no applied trip (a discard
      // raced this apply). Answer the status the row holds now, writes rolled back.
      const fresh = await this.mustFindOwned(plan.id, user.id);
      const current = effectiveStatus(fresh, dbNow());
      throw planError(409, `草案当前状态为 ${current}，不能应用。`, 'plan_not_applicable', { status: current });
    }

    await this.audit.writeAudit({
      userId: user.id,
      action: 'ai_travel_plan.apply',
      resource: `ai_travel_plan:${plan.id}`,
      details: {
        planId: plan.id,
        mode: body.mode,
        tripId,
        revision: plan.current_revision,
        idempotencyKey,
      },
    });
    return { plan: await this.loadView(plan.id, user.id), tripId };
  }

  /**
   * Undoes an apply. A `new_trip` apply is reverted by deleting the trip it
   * created; the plan goes back to `ready` (or `expired` once its TTL has run
   * out) and can be applied again. An apply into an existing trip is refused:
   * the recorded ids name the rows a person removes by hand, because deleting
   * them automatically would also remove anything the traveller added since.
   */
  async undo(user: User, rawId: string, reason?: string): Promise<TravelPlanUndoResponse> {
    const planId = parsePlanId(rawId);
    const now = dbNow();
    const plan = await this.mustFindOwned(planId, user.id);
    const status = effectiveStatus(plan, now);

    if (status !== 'applied') {
      throw planError(409, `草案当前状态为 ${status}，没有可撤销的应用。`, 'plan_not_applied', { status });
    }
    const result = decodeJson(AI_TRAVEL_PLAN_APPLY_RESULT, plan.apply_result_json, `plan ${plan.id}`);
    if (!result) {
      throw planError(409, '这次应用没有记录写入的实体，无法自动撤销。', 'apply_result_missing');
    }
    if (result.mode !== 'new_trip') {
      throw planError(
        409,
        '这次应用写入了已有行程，不能自动撤销；请手动删除下列由这次应用新增的实体。',
        'undo_manual_required',
        {
          tripId: result.tripId,
          dayIds: result.createdDayIds,
          placeIds: result.createdPlaceIds,
          assignmentIds: result.createdAssignmentIds,
        },
      );
    }

    await this.applyService.undoNewTrip(user, result.tripId);
    // The claim guards a second undo: only the request that still sees an
    // applied row resets it. The trip delete above is idempotent-safe because
    // the second caller would already find no trip.
    const restored = plan.expires_at && plan.expires_at < now ? 'expired' : 'ready';
    await this.plans.nativeUpdate(
      { id: plan.id, owner: user.id, status: 'applied' },
      {
        status: restored,
        applied_trip_id: null,
        target_trip_id: null,
        apply_result_json: null,
        updated_at: now,
      },
    );
    await this.audit.writeAudit({
      userId: user.id,
      action: 'ai_travel_plan.undo',
      resource: `ai_travel_plan:${plan.id}`,
      details: { planId: plan.id, tripId: result.tripId, mode: result.mode, reason: reason ?? null },
    });
    return { plan: await this.loadView(plan.id, user.id), tripId: result.tripId, tripDeleted: true };
  }

  /** Marks a plan expired so it can never be applied. Idempotent on an expired plan. */
  async discard(user: User, rawId: string, reason?: string): Promise<TravelPlanDiscardResponse> {
    const planId = parsePlanId(rawId);
    const now = dbNow();
    const plan = await this.mustFindOwned(planId, user.id);
    const status = effectiveStatus(plan, now);

    if (status === 'applied') {
      throw planError(409, '已应用的草案不能放弃。', 'plan_already_applied', { status });
    }
    if (status === 'expired') {
      return { plan: await this.loadView(plan.id, user.id) };
    }

    await this.plans.nativeUpdate(
      { id: plan.id, owner: user.id },
      { status: 'expired', expires_at: now, updated_at: now },
    );
    await this.audit.writeAudit({
      userId: user.id,
      action: 'ai_travel_plan.discard',
      resource: `ai_travel_plan:${plan.id}`,
      details: { planId: plan.id, reason: reason ?? null },
    });
    return { plan: await this.loadView(plan.id, user.id) };
  }

  /* ------------------------------------------------------------------ */

  private async requireTripCreate(user: User): Promise<void> {
    const allowed = await this.permissions.checkPermission('trip_create', user.role, null, user.id, false);
    if (!allowed) throw planError(403, '你没有创建行程的权限。', 'trip_create_forbidden');
  }

  private async mustFindOwned(planId: number, ownerId: number): Promise<AiTravelPlans> {
    const plan = await this.plans.findOwned(planId, ownerId);
    if (!plan) throw planError(404, '行程草案不存在。', 'plan_not_found');
    return plan;
  }

  private async loadView(planId: number, ownerId: number): Promise<TravelPlan> {
    const plan = await this.mustFindOwned(planId, ownerId);
    const revisions = await this.revisions.findByPlan(plan.id);
    return toPlanView(plan, revisions);
  }

  private async currentDraft(plan: AiTravelPlans): Promise<TravelPlanDraft> {
    if (plan.current_revision <= 0) return emptyTravelPlanDraft(NO_REVISION_CHECKED_AT);
    const revision = await this.revisions.findByVersion(plan.id, plan.current_revision);
    if (!revision) return emptyTravelPlanDraft(NO_REVISION_CHECKED_AT);
    return decodeJson(AI_TRAVEL_PLAN_REVISION_DRAFT, revision.draft_json, `revision ${revision.id}`);
  }

  private encodeRevision(result: TravelPlanEngineResult): {
    draft_json: string;
    facts_json: string;
    warnings_json: string;
    model_meta_json: string;
  } {
    return {
      draft_json: encodeJson(AI_TRAVEL_PLAN_REVISION_DRAFT, result.draft),
      facts_json: encodeJson(AI_TRAVEL_PLAN_REVISION_FACTS, result.facts),
      warnings_json: encodeJson(AI_TRAVEL_PLAN_REVISION_WARNINGS, result.warnings),
      model_meta_json: encodeJson(AI_TRAVEL_PLAN_REVISION_MODEL_META, result.modelMeta),
    };
  }
}

/** Turns a stored plan plus its revisions into the wire contract. */
function toPlanView(plan: AiTravelPlans, revisions: AiTravelPlanRevisions[], now: DbTimestamp = dbNow()): TravelPlan {
  const current = revisions.find((revision) => revision.version === plan.current_revision) ?? null;
  const warnings: TravelPlanWarning[] = current
    ? decodeJson(AI_TRAVEL_PLAN_REVISION_WARNINGS, current.warnings_json, `revision ${current.id}`)
    : [];

  return {
    id: plan.id,
    status: effectiveStatus(plan, now),
    request: decodeJson(AI_TRAVEL_PLAN_REQUEST, plan.request_json, `plan ${plan.id}`),
    currentRevision: plan.current_revision,
    targetTripId: plan.target_trip_id ?? null,
    appliedTripId: plan.applied_trip_id ?? null,
    applyResult: decodeJson(AI_TRAVEL_PLAN_APPLY_RESULT, plan.apply_result_json, `plan ${plan.id}`),
    expiresAt: utcSuffix(plan.expires_at),
    createdAt: utcSuffix(plan.created_at),
    updatedAt: utcSuffix(plan.updated_at),
    draft: current ? decodeJson(AI_TRAVEL_PLAN_REVISION_DRAFT, current.draft_json, `revision ${current.id}`) : null,
    warnings,
    revisions: revisions.map((revision) => ({
      version: revision.version,
      reason: revision.reason ?? null,
      warnings: decodeJson(AI_TRAVEL_PLAN_REVISION_WARNINGS, revision.warnings_json, `revision ${revision.id}`),
      createdAt: utcSuffix(revision.created_at),
    })),
  };
}

/** The full contract of one revision (the create-revision response). */
function toRevisionView(revision: AiTravelPlanRevisions): TravelPlanRevision {
  return {
    version: revision.version,
    reason: revision.reason ?? null,
    draft: decodeJson(AI_TRAVEL_PLAN_REVISION_DRAFT, revision.draft_json, `revision ${revision.id}`),
    facts: decodeJson(AI_TRAVEL_PLAN_REVISION_FACTS, revision.facts_json, `revision ${revision.id}`),
    warnings: decodeJson(AI_TRAVEL_PLAN_REVISION_WARNINGS, revision.warnings_json, `revision ${revision.id}`),
    modelMeta: decodeJson(AI_TRAVEL_PLAN_REVISION_MODEL_META, revision.model_meta_json, `revision ${revision.id}`),
    durationMs: revision.duration_ms ?? null,
    createdAt: utcSuffix(revision.created_at),
  };
}

/**
 * The status the API answers with: a ready draft past its TTL reads as
 * expired without writing anything (GET handlers must not write).
 */
function effectiveStatus(plan: AiTravelPlans, now: DbTimestamp): TravelPlanStatus {
  const parsed = travelPlanStatusSchema.safeParse(plan.status);
  const status: TravelPlanStatus = parsed.success ? parsed.data : 'failed';
  if ((status === 'draft' || status === 'ready') && plan.expires_at && plan.expires_at < now) return 'expired';
  return status;
}

/** A plan id from the route; anything that cannot be one is a 404. */
function parsePlanId(raw: string): number {
  const id = Number(raw);
  if (!Number.isInteger(id) || id <= 0) throw planError(404, '行程草案不存在。', 'plan_not_found');
  return id;
}

/** A refusal with a stable machine code in the body and the same code on the error. */
function planError(status: number, message: string, code: string, details: Record<string, unknown> = {}): DomainError {
  return new DomainError(status, message, { code, details: { ...details, code } });
}

/** `now` plus whole days, in the canonical db timestamp spelling. */
function addDays(now: DbTimestamp, days: number): DbTimestamp {
  const base = parseDbTimestamp(now)?.getTime() ?? Date.now();
  return dbNow(new Date(base + days * 86_400_000));
}
