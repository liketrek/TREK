import { AiChatClientService } from '../ai-connections/ai-chat-client.service';
import { AiConnectionsService } from '../ai-connections/ai-connections.service';
import { parseLenientJson } from '../llm-parse/llm-parse.contract';
import { logPlannerEvent, type PlannerTrace } from './planner-log';
import { Injectable } from '@nestjs/common';
import {
  travelPlanPaceSchema,
  travelPlanRequestSchema,
  travelPlanTransportSchema,
  type TravelPlanCreateRequest,
  type TravelPlanModelMeta,
  type TravelPlanWarning,
} from '@trek/shared';

import { z } from 'zod';

/** How long one parsing call may take before the planner gives up on it. */
const PARSE_TIMEOUT_MS = 30_000;

/** The structured request a model may extract from a sentence; nothing is required. */
const parsedRequestSchema = z.object({
  destination: z.string().trim().min(1).max(120).optional(),
  origin: z.string().trim().min(1).max(120).optional(),
  startDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .optional(),
  endDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .optional(),
  dayCount: z.number().int().min(1).max(14).optional(),
  travelers: z
    .object({
      adults: z.number().int().min(1).max(50).optional(),
      children: z.number().int().min(0).max(50).optional(),
      seniors: z.number().int().min(0).max(50).optional(),
    })
    .optional(),
  budgetCny: z.number().nonnegative().max(1_000_000).optional(),
  pace: travelPlanPaceSchema.optional(),
  interests: z.array(z.string().trim().min(1).max(40)).max(20).optional(),
  transport: travelPlanTransportSchema.optional(),
  constraints: z.array(z.string().trim().min(1).max(200)).max(20).optional(),
});

type ParsedRequest = z.infer<typeof parsedRequestSchema>;

const parsedFeedbackSchema = z.object({
  keywords: z.array(z.string().trim().min(1).max(40)).max(3).default([]),
});

/** What one parsing pass changed, and what it cost. */
export interface PlannerParseOutcome {
  request: TravelPlanCreateRequest;
  warnings: TravelPlanWarning[];
  model: ModelUsage | null;
}

type ModelUsage = Pick<TravelPlanModelMeta, 'provider' | 'model' | 'promptTokens' | 'completionTokens'>;

/** OPS-01: false when the cost cap is reached and the model must not run. */
export interface PlannerModelOptions {
  allowModel?: boolean;
  /** OPS-02: the ids each model-call line carries, when they exist yet. */
  trace?: PlannerTrace;
}

/** The warning a capped generation carries instead of calling the model. */
function usageLimitWarning(): TravelPlanWarning {
  return {
    code: 'usage_limit',
    message: '今日 AI 模型用量已达到上限，本次只按你填写的结构化字段规划。',
    severity: 'warning',
  };
}

/**
 * PLAN-06: the traveller's sentence becomes the structured request.
 *
 * The model extracts only what the traveller said. Every field it omits stays
 * absent, and a model that is not connected changes nothing: the structured
 * request is still usable, and the plan says the prompt was not parsed. The
 * parser never fills a destination, a date or a budget on its own.
 */
@Injectable()
export class PlannerRequestParser {
  constructor(
    private readonly connections: AiConnectionsService,
    private readonly clients: AiChatClientService,
  ) {}

  /** Merges whatever the model extracted into what the client already sent. */
  async merge(
    userId: number,
    request: TravelPlanCreateRequest,
    options: PlannerModelOptions = {},
  ): Promise<PlannerParseOutcome> {
    if (!request.prompt) return { request, warnings: [], model: null };
    if (options.allowModel === false) {
      logPlannerEvent('model_skipped', { ...options.trace, stage: 'parse', outcome: 'usage_limit' });
      return { request, warnings: [usageLimitWarning()], model: null };
    }

    const answer = await this.ask(userId, PARSE_SYSTEM_PROMPT, request.prompt, 'parse', options.trace);
    if ('warning' in answer) {
      return { request, warnings: [answer.warning], model: null };
    }

    const parsed = parsedRequestSchema.safeParse(parseLenientJson(answer.text));
    if (!parsed.success) {
      return {
        request,
        warnings: [
          {
            code: 'prompt_unparsed',
            message: '模型没有返回可用的结构化需求，本次只能按你填写的字段规划。',
            severity: 'warning',
          },
        ],
        model: answer.meta,
      };
    }

    return {
      request: mergeRequest(request, parsed.data),
      warnings: [],
      model: answer.meta,
    };
  }

  /** Up to three search words a revision asks for; falls back to the words themselves. */
  async feedbackKeywords(
    userId: number,
    feedback: string,
    options: PlannerModelOptions = {},
  ): Promise<{ keywords: string[]; warnings: TravelPlanWarning[]; model: ModelUsage | null }> {
    if (options.allowModel === false) {
      logPlannerEvent('model_skipped', { ...options.trace, stage: 'feedback', outcome: 'usage_limit' });
      return { keywords: [truncate(feedback, 40)], warnings: [usageLimitWarning()], model: null };
    }

    const answer = await this.ask(userId, FEEDBACK_SYSTEM_PROMPT, feedback, 'feedback', options.trace);
    if ('warning' in answer) {
      return { keywords: [truncate(feedback, 40)], warnings: [answer.warning], model: null };
    }

    const parsed = parsedFeedbackSchema.safeParse(parseLenientJson(answer.text));
    if (!parsed.success || parsed.data.keywords.length === 0) {
      return { keywords: [truncate(feedback, 40)], warnings: [], model: answer.meta };
    }
    return { keywords: parsed.data.keywords, warnings: [], model: answer.meta };
  }

  /**
   * One model call. The chain line names the provider, model, tokens and
   * duration; the prompt and the answer are never part of it (OPS-02).
   */
  private async ask(
    userId: number,
    system: string,
    prompt: string,
    purpose: 'parse' | 'feedback',
    trace: PlannerTrace = {},
  ): Promise<{ ok: true; text: string; meta: ModelUsage } | { ok: false; warning: TravelPlanWarning }> {
    const startedAt = Date.now();
    let connection;
    try {
      connection = await this.connections.resolveForUser(userId);
    } catch {
      logPlannerEvent('model_call', {
        ...trace,
        stage: purpose,
        durationMs: Date.now() - startedAt,
        outcome: 'not_configured',
      });
      return {
        ok: false,
        warning: {
          code: 'model_not_configured',
          message: '还没有可用的模型连接，自然语言需求没有被解析，只按结构化字段规划。',
          severity: 'info',
        },
      };
    }

    const client = this.clients.create(connection);
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), PARSE_TIMEOUT_MS);
    let text = '';
    let promptTokens: number | null = null;
    let completionTokens: number | null = null;

    try {
      for await (const event of client.stream(
        {
          system,
          messages: [{ role: 'user', text: prompt }],
          tools: [],
          toolChoice: 'none',
        },
        controller.signal,
      )) {
        if (event.type === 'text-delta') text += event.delta;
        if (event.type === 'usage') {
          promptTokens = (promptTokens ?? 0) + event.inputTokens;
          completionTokens = (completionTokens ?? 0) + event.outputTokens;
        }
      }
    } catch {
      logPlannerEvent(
        'model_call',
        {
          ...trace,
          stage: purpose,
          provider: connection.kind,
          model: client.model,
          durationMs: Date.now() - startedAt,
          outcome: controller.signal.aborted ? 'timeout' : 'error',
        },
        'warn',
      );
      return {
        ok: false,
        warning: {
          code: 'model_unavailable',
          message: '模型暂时没有响应，自然语言需求没有被解析，只按结构化字段规划。',
          severity: 'warning',
        },
      };
    } finally {
      clearTimeout(timer);
    }

    if (text.trim() === '') {
      logPlannerEvent(
        'model_call',
        {
          ...trace,
          stage: purpose,
          provider: connection.kind,
          model: client.model,
          promptTokens,
          completionTokens,
          durationMs: Date.now() - startedAt,
          outcome: 'empty',
        },
        'warn',
      );
      return {
        ok: false,
        warning: {
          code: 'model_unavailable',
          message: '模型没有返回内容，自然语言需求没有被解析，只按结构化字段规划。',
          severity: 'warning',
        },
      };
    }

    logPlannerEvent('model_call', {
      ...trace,
      stage: purpose,
      provider: connection.kind,
      model: client.model,
      promptTokens,
      completionTokens,
      durationMs: Date.now() - startedAt,
      outcome: 'ok',
    });
    return {
      ok: true,
      text,
      meta: { provider: connection.kind, model: client.model, promptTokens, completionTokens },
    };
  }
}

/**
 * Explicit request fields win; the model fills what the client left out.
 *
 * Three fields carry schema defaults, so "absent" is indistinguishable from
 * "the default" after parsing. For those the default is treated as absent:
 * a traveller who really wants one adult, balanced pace and public transport
 * gets exactly that from the defaults anyway.
 */
export function mergeRequest(base: TravelPlanCreateRequest, parsed: ParsedRequest): TravelPlanCreateRequest {
  const travelers = travelersOrDefault(base, parsed);
  return travelPlanRequestSchema.parse({
    ...base,
    destination: base.destination ?? parsed.destination,
    origin: base.origin ?? parsed.origin,
    startDate: base.startDate ?? parsed.startDate,
    endDate: base.endDate ?? parsed.endDate,
    dayCount: base.dayCount ?? parsed.dayCount,
    budgetCny: base.budgetCny ?? parsed.budgetCny,
    pace: base.pace === 'balanced' ? (parsed.pace ?? base.pace) : base.pace,
    transport: base.transport === 'public_transit' ? (parsed.transport ?? base.transport) : base.transport,
    travelers,
    interests: unique([...base.interests, ...(parsed.interests ?? [])]),
    constraints: unique([...base.constraints, ...(parsed.constraints ?? [])]),
  });
}

function travelersOrDefault(base: TravelPlanCreateRequest, parsed: ParsedRequest) {
  const isDefault = base.travelers.adults === 1 && base.travelers.children === 0 && base.travelers.seniors === 0;
  if (!isDefault || !parsed.travelers) return base.travelers;
  return {
    adults: parsed.travelers.adults ?? base.travelers.adults,
    children: parsed.travelers.children ?? base.travelers.children,
    seniors: parsed.travelers.seniors ?? base.travelers.seniors,
  };
}

/** The fields without which a plan cannot be built, in the order the traveller reads them. */
export function missingRequestFields(request: TravelPlanCreateRequest): string[] {
  const missing: string[] = [];
  if (!request.destination) missing.push('目的地');
  if (!request.startDate) missing.push('出发日期');
  if (!request.endDate && !request.dayCount) missing.push('行程天数');
  return missing;
}

function unique(values: string[]): string[] {
  return [...new Set(values.map((value) => value.trim()).filter((value) => value !== ''))];
}

function truncate(value: string, max: number): string {
  return value.trim().slice(0, max);
}

function chinaToday(): string {
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Shanghai' }).format(new Date());
}

const PARSE_SYSTEM_PROMPT = `你是一个中国旅行需求解析器。把用户的一句话解析为 JSON。

只输出一个 JSON 对象，不要 Markdown，不要解释。可用字段：
- destination：目的地城市或区域
- origin：出发地
- startDate / endDate：YYYY-MM-DD
- dayCount：1-14 的整数
- travelers：{"adults": 整数, "children": 整数, "seniors": 整数}
- budgetCny：数字，人民币总预算
- pace："relaxed" | "balanced" | "intensive"
- interests：字符串数组，最多 8 个
- transport："public_transit" | "driving" | "walking" | "mixed"
- constraints：字符串数组，最多 8 条

规则：
1. 只写用户明确说出的信息；不确定就省略该字段。
2. 绝不编造目的地、日期、人数或预算。
3. 今天是 ${chinaToday()}（中国时区），把“下周末”“三天后”这类相对时间换算成具体日期。
4. 不要输出任何 JSON 以外的文字。`;

const FEEDBACK_SYSTEM_PROMPT = `你是一个旅行计划修改意见解析器。从用户对行程的修改意见中，提取最多 3 个适合用于地点检索的关键词（地点名、主题或类型）。

只输出一个 JSON 对象：{"keywords": ["关键词1", "关键词2"]}。
没有可提取的关键词时输出 {"keywords": []}。不要输出 JSON 以外的文字。`;
