import { dbNow } from '../../db/types';
import { PlannerRequestParser, missingRequestFields } from './planner-prompt';
import { hasBlockingWarning, validateDraft } from './planner-validator';
import { PlannerService, type PlannerOutcome } from './planner.service';
import type {
  GenerateTravelPlanInput,
  ReviseTravelPlanInput,
  TravelPlanEngine,
  TravelPlanEngineResult,
} from './travel-plan-engine';
import { Injectable } from '@nestjs/common';
import type { TravelPlanModelMeta, TravelPlanWarning } from '@trek/shared';

const ENGINE_ID = 'nest-planner';

const EMPTY_BUDGET = { min: 0, max: 0, breakdown: {}, breakdownMax: {}, assumptions: [] };

/**
 * PLAN-06..10 bound behind the phase-1 seam.
 *
 * It composes four honest pieces: the parser turns a sentence into fields,
 * the provider fetches only real places and routes, the planner schedules
 * them, and the validator decides whether the result may be applied. Model
 * errors and provider failures become warnings or a `draft`/`failed` status,
 * never an invented place, price or route.
 */
@Injectable()
export class RealTravelPlanEngine implements TravelPlanEngine {
  readonly id = ENGINE_ID;

  constructor(
    private readonly parser: PlannerRequestParser,
    private readonly planner: PlannerService,
  ) {}

  async generate(input: GenerateTravelPlanInput): Promise<TravelPlanEngineResult> {
    input.onStage?.('parsing');
    const merged = await this.parser.merge(input.userId, input.request, {
      allowModel: input.allowModel,
      trace: input.trace,
    });
    const warnings = [...merged.warnings];
    const modelMeta = modelMetaOf([merged.model]);
    const missing = missingRequestFields(merged.request);

    if (missing.length > 0) {
      return {
        draft: {
          summary: `还缺少${missing.join('、')}，补充后即可检索真实地点。`,
          factsCheckedAt: dbNow(),
          days: [],
          estimatedBudgetCny: EMPTY_BUDGET,
          lodgingAreas: [],
          warnings: [],
        },
        facts: [],
        warnings: [
          ...warnings,
          {
            code: 'request_incomplete',
            message: `请补充${missing.join('、')}后再生成行程。`,
            severity: 'blocking',
          },
        ],
        modelMeta,
        status: 'draft',
      };
    }

    try {
      const outcome = await this.planner.plan({
        userId: input.userId,
        request: merged.request,
        onStage: input.onStage,
      });
      return finish(merged.request, outcome, warnings, modelMeta);
    } catch {
      return failedOutcome(warnings, modelMeta);
    }
  }

  async revise(input: ReviseTravelPlanInput): Promise<TravelPlanEngineResult> {
    input.onStage?.('parsing');
    const merged = await this.parser.merge(input.userId, input.request, {
      allowModel: input.allowModel,
      trace: input.trace,
    });
    const warnings = [...merged.warnings];
    const missing = missingRequestFields(merged.request);

    if (missing.length > 0) {
      return {
        draft: { ...input.draft, warnings: [] },
        facts: [],
        warnings: [
          ...warnings,
          {
            code: 'request_incomplete',
            message: `请补充${missing.join('、')}后再修改行程。`,
            severity: 'blocking',
          },
        ],
        modelMeta: modelMetaOf([merged.model]),
        status: 'draft',
      };
    }

    const feedback = await this.parser.feedbackKeywords(input.userId, input.feedback, {
      allowModel: input.allowModel,
      trace: input.trace,
    });
    warnings.push(...feedback.warnings);

    try {
      const outcome = await this.planner.plan({
        userId: input.userId,
        request: merged.request,
        extraQueries: feedback.keywords,
        onStage: input.onStage,
      });

      if (outcome.draft.days.every((day) => day.items.length === 0) && input.draft.days.length > 0) {
        // The revision asked for places the provider could not find. Keeping
        // the previous draft is more useful than replacing it with nothing,
        // and the warning says exactly what happened.
        const kept: TravelPlanWarning[] = [
          ...input.draft.warnings,
          {
            code: 'revision_not_applied',
            message: '这次修改没有检索到新的真实地点，已保留上一版行程。',
            severity: 'warning',
          },
        ];
        return {
          draft: { ...input.draft, warnings: kept },
          facts: [],
          warnings: kept,
          modelMeta: modelMetaOf([merged.model, feedback.model]),
          status: hasBlockingWarning(kept) ? 'draft' : 'ready',
        };
      }

      return finish(merged.request, outcome, warnings, modelMetaOf([merged.model, feedback.model]));
    } catch {
      return failedOutcome(warnings, modelMetaOf([merged.model, feedback.model]));
    }
  }
}

function finish(
  request: GenerateTravelPlanInput['request'],
  outcome: PlannerOutcome,
  carry: TravelPlanWarning[],
  modelMeta: TravelPlanModelMeta,
): TravelPlanEngineResult {
  const warnings = validateDraft(request, {
    ...outcome.draft,
    warnings: [...carry, ...outcome.warnings],
  });
  return {
    draft: { ...outcome.draft, warnings },
    facts: outcome.facts,
    warnings,
    modelMeta,
    status: hasBlockingWarning(warnings) ? 'draft' : 'ready',
  };
}

function failedOutcome(warnings: TravelPlanWarning[], modelMeta: TravelPlanModelMeta): TravelPlanEngineResult {
  const all: TravelPlanWarning[] = [
    ...warnings,
    {
      code: 'generation_failed',
      message: '生成过程出错，本次没有产出可应用的行程，请稍后重试。',
      severity: 'blocking',
    },
  ];
  return {
    draft: {
      summary: '本次生成失败，没有写入任何行程数据。',
      factsCheckedAt: dbNow(),
      days: [],
      estimatedBudgetCny: EMPTY_BUDGET,
      lodgingAreas: [],
      warnings: all,
    },
    facts: [],
    warnings: all,
    modelMeta,
    status: 'failed',
  };
}

function modelMetaOf(
  models: Array<Pick<TravelPlanModelMeta, 'provider' | 'model' | 'promptTokens' | 'completionTokens'> | null>,
): TravelPlanModelMeta {
  const used = models.filter((model): model is NonNullable<typeof model> => model !== null);
  const sum = (pick: (model: (typeof used)[number]) => number | null): number | null => {
    const values = used.map(pick).filter((value): value is number => value !== null);
    return values.length === 0 ? null : values.reduce((total, value) => total + value, 0);
  };
  return {
    engine: ENGINE_ID,
    provider: used[0]?.provider ?? null,
    model: used[0]?.model ?? null,
    promptTokens: sum((model) => model.promptTokens),
    completionTokens: sum((model) => model.completionTokens),
    costCny: null,
  };
}
