import { logInfo, logWarn } from '../audit/audit-log.logger';
import type { TravelPlanStreamStage } from '@trek/shared';

/**
 * OPS-02: the planner's chain log.
 *
 * One line per generation event, every line carrying the ids it knows, so a
 * support engineer can follow one traveller's generation from the request to
 * the stored revision:
 *
 *   [ai-travel-plan] event=generation_started revision=1 mode=create allowModel=true
 *   [ai-travel-plan] event=stage revision=1 mode=create stage=parsing durationMs=3
 *   [ai-travel-plan] event=model_call planId=42 revision=1 stage=parse provider=openai model=gpt-4o promptTokens=812 completionTokens=96 durationMs=2400 outcome=ok
 *   ...
 *   [ai-travel-plan] event=revision_persisted planId=42 revision=1 mode=create outcome=ready
 *
 * The JSON create has no plan id until generation has finished (the plan row
 * is written last), so its early lines carry no planId. They belong to the
 * same request through the logger's correlation tag (`[http <id>]`, prefixed
 * to every line), and the closing revision_persisted line names the plan.
 *
 * Only the fields below are rendered. The traveller's sentence, the revision
 * feedback, the model's answer, place names and companion counts are not part
 * of this contract: the formatter reads nothing but this whitelist, so there
 * is nothing that could leak. Request-body redaction for the same fields lives
 * in the global request logger (middleware/globalMiddleware.ts), so the two
 * logs follow one rule: text a traveller wrote is never written to trek.log.
 */
export interface PlannerTrace {
  planId?: number | null;
  revision?: number | null;
}

export type PlannerMode = 'create' | 'stream' | 'revise';

/** One stage of a generation, as the planner reports it, plus the parsing/model steps. */
type PlannerLogStage = TravelPlanStreamStage | 'parse' | 'feedback';

export interface PlannerLogFields extends PlannerTrace {
  mode?: PlannerMode | null;
  stage?: PlannerLogStage | null;
  provider?: string | null;
  model?: string | null;
  promptTokens?: number | null;
  completionTokens?: number | null;
  durationMs?: number | null;
  outcome?: string | null;
  allowModel?: boolean | null;
  /** Warning codes only — never their messages, which may echo the request. */
  warnings?: readonly string[] | null;
  /** The thrown error's class name only — never its message. */
  error?: string | null;
}

/** The order fields render in, so every line of one event reads the same. */
const FIELD_ORDER: ReadonlyArray<keyof PlannerLogFields> = [
  'planId',
  'revision',
  'mode',
  'stage',
  'provider',
  'model',
  'promptTokens',
  'completionTokens',
  'durationMs',
  'outcome',
  'allowModel',
  'warnings',
  'error',
];

/** Longest a single token may be; model names and codes are far shorter. */
const TOKEN_MAX = 64;

/**
 * One line, one token: whitespace and control characters would let a
 * provider-supplied model name forge a second log entry.
 */
function token(value: string): string {
  const cleaned = Array.from(value)
    .map((char) => (char.trim() === '' || char.charCodeAt(0) < 0x20 || char.charCodeAt(0) === 0x7f ? '_' : char))
    .join('')
    .slice(0, TOKEN_MAX);
  return cleaned === '' ? '-' : cleaned;
}

function render(field: keyof PlannerLogFields, value: unknown): string | null {
  if (typeof value === 'number') return Number.isFinite(value) ? String(value) : null;
  if (typeof value === 'boolean') return value ? 'true' : 'false';
  if (field === 'warnings' && Array.isArray(value)) {
    const codes = value.filter((code): code is string => typeof code === 'string' && code !== '');
    return codes.length === 0 ? null : codes.map(token).join(',');
  }
  if (typeof value === 'string') return token(value);
  return null;
}

/** The exact text logPlannerEvent writes, for tests and for callers that need the line. */
export function formatPlannerLog(event: string, fields: PlannerLogFields = {}): string {
  const parts = [`[ai-travel-plan] event=${token(event)}`];
  for (const field of FIELD_ORDER) {
    const rendered = render(field, fields[field]);
    if (rendered !== null) parts.push(`${field}=${rendered}`);
  }
  return parts.join(' ');
}

export type PlannerLogLevel = 'info' | 'warn';

/** Writes one chain-log line; failures (a timeout, an engine error) go to the warn sink. */
export function logPlannerEvent(event: string, fields: PlannerLogFields = {}, level: PlannerLogLevel = 'info'): void {
  const line = formatPlannerLog(event, fields);
  if (level === 'warn') logWarn(line);
  else logInfo(line);
}

/**
 * Wraps the engine's `onStage`: one line per stage with the time since the
 * previous one. The returned function is the callback the service hands the
 * engine, so the JSON and streaming routes report the same stages.
 */
export function stageLogger(trace: PlannerLogFields): (stage: TravelPlanStreamStage) => void {
  let lastAt = Date.now();
  return (stage) => {
    const now = Date.now();
    logPlannerEvent('stage', { ...trace, stage, durationMs: now - lastAt });
    lastAt = now;
  };
}
