/**
 * OPS-02: the planner's chain log.
 *
 * The logger module is mocked, so every case reads the exact line the product
 * writes. The parser cases prove the model-call line names the provider, the
 * model and the token counts, and that neither the traveller's sentence nor
 * the provider's error text ever appears: the formatter only knows the
 * whitelisted fields, and the error is reduced to "outcome=error".
 */
import { formatPlannerLog, logPlannerEvent, stageLogger } from '../../../../src/nest/ai-travel-plan/planner-log';
import { PlannerRequestParser } from '../../../../src/nest/ai-travel-plan/planner-prompt';
import { logInfo, logWarn } from '../../../../src/nest/audit/audit-log.logger';
import { travelPlanCreateRequestSchema, type TravelPlanCreateRequest } from '@trek/shared';

import { beforeEach, describe, expect, it, vi, type Mock } from 'vitest';

vi.mock('../../../../src/nest/audit/audit-log.logger', () => ({
  logInfo: vi.fn(),
  logWarn: vi.fn(),
  logDebug: vi.fn(),
  logError: vi.fn(),
}));

const info = logInfo as unknown as Mock;
const warn = logWarn as unknown as Mock;

function lastLine(sink: Mock): string {
  return String(sink.mock.calls.at(-1)?.[0] ?? '');
}

function request(overrides: Partial<TravelPlanCreateRequest> = {}): TravelPlanCreateRequest {
  return travelPlanCreateRequestSchema.parse({
    destination: '杭州',
    startDate: '2026-05-01',
    endDate: '2026-05-02',
    ...overrides,
  });
}

async function* streamOf(text: string) {
  yield { type: 'text-delta' as const, delta: text };
  yield { type: 'usage' as const, inputTokens: 3, outputTokens: 4 };
}

/** The provider already answered "usage", then nothing at all. */
async function* emptyStream() {
  yield { type: 'usage' as const, inputTokens: 7, outputTokens: 0 };
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe('formatPlannerLog', () => {
  it('PLANLOG-001: renders the fixed field order and drops the fields that do not apply', () => {
    expect(
      formatPlannerLog('generation_finished', {
        planId: 42,
        revision: 2,
        mode: 'stream',
        stage: 'validating',
        provider: 'openai',
        model: 'test-model',
        promptTokens: 812,
        completionTokens: 96,
        durationMs: 2400,
        outcome: 'ready',
        warnings: ['place_search_failed'],
      }),
    ).toBe(
      '[ai-travel-plan] event=generation_finished planId=42 revision=2 mode=stream stage=validating ' +
        'provider=openai model=test-model promptTokens=812 completionTokens=96 durationMs=2400 ' +
        'outcome=ready warnings=place_search_failed',
    );
    expect(formatPlannerLog('generation_started', { revision: 1, provider: null, durationMs: Number.NaN })).toBe(
      '[ai-travel-plan] event=generation_started revision=1',
    );
  });

  it('PLANLOG-002: renders the whitelist only — a prompt, feedback or model answer never reach the line', () => {
    const fields = {
      planId: 42,
      revision: 1,
      prompt: '带两岁女儿去阿坝州，住在松潘古城旁边',
      feedback: '把第二天改成室内',
      answer: '{"destination":"阿坝州"}',
      warnings: ['usage_limit'],
    } as never;

    const line = formatPlannerLog('generation_finished', fields);

    expect(line).toBe('[ai-travel-plan] event=generation_finished planId=42 revision=1 warnings=usage_limit');
    expect(line).not.toContain('两岁');
    expect(line).not.toContain('松潘');
    expect(line).not.toContain('室内');
    expect(line).not.toContain('destination');
  });

  it('PLANLOG-003: a value can never forge a second log line', () => {
    const line = formatPlannerLog('model_call', {
      provider: 'openai',
      model: 'evil\n[ERROR] forged\tentry',
      error: 'TypeError',
    });

    expect(line).not.toMatch(/[\r\n\t]/);
    expect(line).toBe(
      '[ai-travel-plan] event=model_call provider=openai model=evil_[ERROR]_forged_entry error=TypeError',
    );
  });

  it('PLANLOG-004: warnings render as their codes, comma separated', () => {
    expect(formatPlannerLog('generation_finished', { warnings: ['place_search_failed', 'route_unavailable'] })).toBe(
      '[ai-travel-plan] event=generation_finished warnings=place_search_failed,route_unavailable',
    );
    expect(formatPlannerLog('generation_finished', { warnings: [] })).toBe(
      '[ai-travel-plan] event=generation_finished',
    );
  });

  it('PLANLOG-005: a failure goes to the warn sink, a normal event to info', () => {
    logPlannerEvent('generation_failed', { outcome: 'error', error: 'TypeError' }, 'warn');
    logPlannerEvent('generation_started', { revision: 1 });

    expect(warn).toHaveBeenCalledTimes(1);
    expect(lastLine(warn)).toBe('[ai-travel-plan] event=generation_failed outcome=error error=TypeError');
    expect(info).toHaveBeenCalledTimes(1);
    expect(lastLine(info)).toBe('[ai-travel-plan] event=generation_started revision=1');
  });
});

describe('stageLogger', () => {
  it('PLANLOG-010: each stage is one line carrying the trace and the time since the previous stage', () => {
    const stage = stageLogger({ planId: 12, revision: 3, mode: 'stream' });

    stage('parsing');
    stage('places');

    expect(info).toHaveBeenCalledTimes(2);
    expect(String(info.mock.calls[0][0])).toMatch(
      /^\[ai-travel-plan\] event=stage planId=12 revision=3 mode=stream stage=parsing durationMs=\d+$/,
    );
    expect(String(info.mock.calls[1][0])).toMatch(
      /^\[ai-travel-plan\] event=stage planId=12 revision=3 mode=stream stage=places durationMs=\d+$/,
    );
  });

  it('PLANLOG-011: a JSON create has no planId before the row exists, and still carries revision and mode', () => {
    stageLogger({ revision: 1, mode: 'create' })('parsing');

    expect(lastLine(info)).toMatch(
      /^\[ai-travel-plan\] event=stage revision=1 mode=create stage=parsing durationMs=\d+$/,
    );
  });
});

describe('PlannerRequestParser model-call line', () => {
  it('PLANLOG-020: logs provider, model, tokens, duration and outcome — never the traveller sentence', async () => {
    const parser = new PlannerRequestParser(
      { resolveForUser: vi.fn(async () => ({ kind: 'openai' })) } as never,
      { create: vi.fn(() => ({ model: 'test-model', stream: () => streamOf('{"dayCount":3}') })) } as never,
    );

    await parser.merge(7, request({ prompt: '带两岁女儿去杭州，住西湖边' }), { trace: { planId: 42, revision: 2 } });

    const line = lastLine(info);
    expect(line).toMatch(
      /^\[ai-travel-plan\] event=model_call planId=42 revision=2 stage=parse provider=openai model=test-model promptTokens=3 completionTokens=4 durationMs=\d+ outcome=ok$/,
    );
    expect(line).not.toContain('两岁');
    expect(line).not.toContain('西湖');
  });

  it('PLANLOG-021: no connection is an info line naming the ids that are already known', async () => {
    const parser = new PlannerRequestParser(
      { resolveForUser: vi.fn(async () => Promise.reject(new Error('not connected'))) } as never,
      { create: vi.fn() } as never,
    );

    await parser.merge(7, request({ prompt: '杭州两天' }), { trace: { planId: 42, revision: 1 } });

    expect(lastLine(info)).toMatch(
      /^\[ai-travel-plan\] event=model_call planId=42 revision=1 stage=parse durationMs=\d+ outcome=not_configured$/,
    );
    expect(warn).not.toHaveBeenCalled();
  });

  it('PLANLOG-022: a capped generation is logged as skipped and never resolves a connection', async () => {
    const connections = { resolveForUser: vi.fn() };
    const clients = { create: vi.fn() };
    const parser = new PlannerRequestParser(connections as never, clients as never);

    await parser.merge(7, request({ prompt: '杭州两天' }), {
      allowModel: false,
      trace: { planId: 42, revision: 1 },
    });

    expect(lastLine(info)).toBe(
      '[ai-travel-plan] event=model_skipped planId=42 revision=1 stage=parse outcome=usage_limit',
    );
    expect(connections.resolveForUser).not.toHaveBeenCalled();
    expect(clients.create).not.toHaveBeenCalled();
  });

  it('PLANLOG-023: a failing stream is a warn line — the provider message and the prompt stay out', async () => {
    const parser = new PlannerRequestParser(
      { resolveForUser: vi.fn(async () => ({ kind: 'openai' })) } as never,
      {
        create: vi.fn(() => ({
          model: 'test-model',
          stream: () =>
            (async function* () {
              yield { type: 'text-delta' as const, delta: '' };
              throw new Error('400: prompt 带两岁女儿去杭州 rejected');
            })(),
        })),
      } as never,
    );

    const outcome = await parser.merge(7, request({ prompt: '带两岁女儿去杭州' }));

    expect(outcome.warnings).toEqual([expect.objectContaining({ code: 'model_unavailable' })]);
    expect(lastLine(warn)).toMatch(
      /^\[ai-travel-plan\] event=model_call stage=parse provider=openai model=test-model durationMs=\d+ outcome=error$/,
    );
    expect(lastLine(warn)).not.toContain('两岁');
  });

  it('PLANLOG-024: an empty answer is logged with its tokens and outcome=empty', async () => {
    const parser = new PlannerRequestParser(
      { resolveForUser: vi.fn(async () => ({ kind: 'openai' })) } as never,
      { create: vi.fn(() => ({ model: 'test-model', stream: () => emptyStream() })) } as never,
    );

    await parser.merge(7, request({ prompt: '杭州两天' }));

    expect(lastLine(warn)).toMatch(
      /^\[ai-travel-plan\] event=model_call stage=parse provider=openai model=test-model promptTokens=7 completionTokens=0 durationMs=\d+ outcome=empty$/,
    );
  });

  it('PLANLOG-025: an aborted parse is logged as timeout, not error', async () => {
    vi.useFakeTimers();
    try {
      const parser = new PlannerRequestParser(
        { resolveForUser: vi.fn(async () => ({ kind: 'openai' })) } as never,
        {
          create: vi.fn(() => ({
            model: 'test-model',
            stream: (_request: unknown, signal: AbortSignal) =>
              (async function* () {
                await new Promise((_resolve, reject) => {
                  signal.addEventListener('abort', () => reject(new Error('aborted')));
                });
                yield { type: 'text-delta' as const, delta: '' };
              })(),
          })),
        } as never,
      );

      const pending = parser.merge(7, request({ prompt: '杭州两天' }));
      await vi.advanceTimersByTimeAsync(30_000);
      await pending;

      expect(lastLine(warn)).toMatch(/outcome=timeout$/);
    } finally {
      vi.useRealTimers();
    }
  });
});
