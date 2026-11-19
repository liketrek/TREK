import type { PlannerTrace } from './planner-log';
import type {
  TravelPlanCreateRequest,
  TravelPlanDraft,
  TravelPlanFact,
  TravelPlanModelMeta,
  TravelPlanStatus,
  TravelPlanStreamStage,
  TravelPlanWarning,
} from '@trek/shared';

/** The injection token the module binds the planner behind. */
export const TRAVEL_PLAN_ENGINE = Symbol('TRAVEL_PLAN_ENGINE');

/** What one planner call produced. The service owns persistence; the engine owns the draft. */
export interface TravelPlanEngineResult {
  draft: TravelPlanDraft;
  facts: TravelPlanFact[];
  warnings: TravelPlanWarning[];
  modelMeta: TravelPlanModelMeta;
  /**
   * The status the draft is persisted with. `draft` means a blocking warning
   * stopped generation (an incomplete request, no verified place): the plan is
   * kept and may be revised, but `apply` refuses it. Absent means `ready`.
   */
  status?: Extract<TravelPlanStatus, 'ready' | 'draft' | 'failed'>;
}

export interface GenerateTravelPlanInput {
  /** The owner; used to resolve their model connection and map provider keys. */
  userId: number;
  request: TravelPlanCreateRequest;
  /** Progress for the streaming route; the JSON route passes nothing. */
  onStage?: (stage: TravelPlanStreamStage) => void;
  /**
   * False when OPS-01's token cap is already reached: skip every model call and
   * build the draft from the structured fields alone (the warning says so).
   */
  allowModel?: boolean;
  /**
   * OPS-02: the ids the engine's model-call lines carry. Absent on the JSON
   * create, whose plan row is only written after generation has finished.
   */
  trace?: PlannerTrace;
}

export interface ReviseTravelPlanInput extends GenerateTravelPlanInput {
  /** The draft version being revised. */
  draft: TravelPlanDraft;
  /** The traveller's instruction for this revision. */
  feedback: string;
}

/**
 * The seam a planner plugs into: today the honest unconfigured engine, later a
 * model-backed planner in this process or the Java/Spring AI service behind
 * the same REST contract. It must never invent a place a provider did not
 * return; a draft without verified places is an empty draft with a warning.
 */
export interface TravelPlanEngine {
  readonly id: string;
  generate(input: GenerateTravelPlanInput): Promise<TravelPlanEngineResult>;
  revise(input: ReviseTravelPlanInput): Promise<TravelPlanEngineResult>;
}
