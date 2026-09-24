import { describe, it, expect, vi, beforeEach } from 'vitest';

// The clients go through safeFetchLlm (SSRF guard: blocks the cloud-metadata
// range, allows a local/LAN Ollama). Mock it here so the tests never do a real
// DNS lookup — the call signature (url, init) matches the raw fetch it wraps, so
// the existing assertions on the recorded call args are unchanged.
const { safeFetchLlmMock } = vi.hoisted(() => ({ safeFetchLlmMock: vi.fn() }));
vi.mock('../../../../src/utils/ssrfGuard', () => ({ safeFetchLlm: safeFetchLlmMock }));

import { OpenAiCompatibleClient } from '../../../../src/nest/llm-parse/clients/openai-compatible.client';
import { AnthropicClient } from '../../../../src/nest/llm-parse/clients/anthropic.client';
import type { LlmExtractionInput } from '../../../../src/nest/llm-parse/llm-provider.interface';
import { readEnv } from '../../../../src/app-config';

const baseInput: LlmExtractionInput = {
  prompt: 'system',
  jsonSchema: { type: 'object' },
  model: 'm',
  text: 'Flight AB123',
};

function mockFetch(impl: (url: string, init: RequestInit) => Promise<Response> | Response) {
  safeFetchLlmMock.mockImplementation(impl as any);
  return safeFetchLlmMock;
}

function jsonResponse(body: unknown, ok = true, status = 200): Response {
  return { ok, status, json: async () => body, text: async () => JSON.stringify(body) } as unknown as Response;
}

beforeEach(() => safeFetchLlmMock.mockReset());

describe('OpenAiCompatibleClient', () => {
  it('posts to {baseUrl}/chat/completions and returns the reservations array', async () => {
    const fetchFn = mockFetch(() =>
      jsonResponse({ choices: [{ message: { content: JSON.stringify({ reservations: [{ '@type': 'FlightReservation' }] }) } }] }),
    );
    const out = await new OpenAiCompatibleClient().extract({ ...baseInput, baseUrl: 'http://localhost:11434/v1/' });
    expect(out).toEqual([{ '@type': 'FlightReservation' }]);
    expect(fetchFn.mock.calls[0][0]).toBe('http://localhost:11434/v1/chat/completions');
  });

  it('tolerates code-fenced JSON', async () => {
    mockFetch(() =>
      jsonResponse({ choices: [{ message: { content: '```json\n{"reservations":[{"@type":"TrainReservation"}]}\n```' } }] }),
    );
    const out = await new OpenAiCompatibleClient().extract(baseInput);
    expect(out).toEqual([{ '@type': 'TrainReservation' }]);
  });

  it('tolerates single-quoted, non-strict JSON output (Gemini, #1638)', async () => {
    mockFetch(() =>
      jsonResponse({
        choices: [
          {
            message: {
              content:
                "[{ '@type': 'LodgingReservation', checkinTime: '2026-08-28T00:00:00', price: 146.25, }]",
            },
          },
        ],
      }),
    );
    const out = await new OpenAiCompatibleClient().extract(baseInput);
    expect(out).toEqual([{ '@type': 'LodgingReservation', checkinTime: '2026-08-28T00:00:00', price: 146.25 }]);
  });

  /*
   * Prose and an honest empty list both came back as `[]`, so a provider that
   * answered neither JSON nor a reservation looked exactly like a document
   * holding no booking: no item, no warning, nothing in the log (#2375). Only
   * what nothing could read throws — a parsed answer that simply holds no
   * reservation keeps the old empty path.
   */
  it('throws on content the lenient parser cannot read (#2375)', async () => {
    mockFetch(() => jsonResponse({ choices: [{ message: { content: 'I could not find a booking in this document.' } }] }));
    await expect(new OpenAiCompatibleClient().extract(baseInput)).rejects.toThrow(/did not answer with JSON/);

    mockFetch(() => jsonResponse({ choices: [{ message: { content: '42' } }] }));
    await expect(new OpenAiCompatibleClient().extract(baseInput)).rejects.toThrow(/did not answer with JSON/);
  });

  it('throws when the response carries no content at all (#2375)', async () => {
    mockFetch(() => jsonResponse({ choices: [{ message: { content: '' } }] }));
    await expect(new OpenAiCompatibleClient().extract(baseInput)).rejects.toThrow(/empty response/);

    // A content filter or a zero-token completion leaves the field off entirely.
    mockFetch(() => jsonResponse({ choices: [{ message: {} }] }));
    await expect(new OpenAiCompatibleClient().extract(baseInput)).rejects.toThrow(/empty response/);
  });

  it('still answers empty for a document that genuinely holds no booking', async () => {
    for (const content of ['[]', '{"reservations":[]}', '{}', '{"reservations":null}', JSON.stringify('{"reservations":[]}')]) {
      mockFetch(() => jsonResponse({ choices: [{ message: { content } }] }));
      expect(await new OpenAiCompatibleClient().extract(baseInput)).toEqual([]);
    }
  });

  it('keeps the unreadable response out of the message on a managed instance', async () => {
    mockFetch(() => jsonResponse({ choices: [{ message: { content: 'Booking for Jane Doe, 12 Rue de Rivoli' } }] }));
    await expect(new OpenAiCompatibleClient().extract(baseInput)).rejects.toThrow(/Jane Doe/);

    // The response is the booking, and on a managed install the operator's log
    // is not the place for it — same split as the extracted text.
    vi.stubEnv('TREK_MANAGED', 'true');
    try {
      await expect(new OpenAiCompatibleClient().extract(baseInput)).rejects.toThrow(/did not answer with JSON$/);
    } finally {
      vi.unstubAllEnvs();
    }
  });

  it('reads a single reservation the model answered on its own', async () => {
    mockFetch(() => jsonResponse({ choices: [{ message: { content: '{"@type":"LodgingReservation","reservationNumber":"733"}' } }] }));
    expect(await new OpenAiCompatibleClient().extract(baseInput)).toEqual([
      { '@type': 'LodgingReservation', reservationNumber: '733' },
    ]);
  });

  it('throws on non-2xx', async () => {
    mockFetch(() => jsonResponse({ error: 'bad' }, false, 401));
    await expect(new OpenAiCompatibleClient().extract(baseInput)).rejects.toThrow(/401/);
    expect(safeFetchLlmMock).toHaveBeenCalledTimes(1); // no retry on non-400
  });

  it('retries once with json_object when the server rejects json_schema (400)', async () => {
    safeFetchLlmMock
      .mockResolvedValueOnce(jsonResponse({ error: { message: 'response_format type is unavailable' } }, false, 400))
      .mockResolvedValueOnce(
        jsonResponse({ choices: [{ message: { content: '{"reservations":[{"@type":"FlightReservation"}]}' } }] }),
      );
    const out = await new OpenAiCompatibleClient().extract(baseInput);
    expect(out).toEqual([{ '@type': 'FlightReservation' }]);
    expect(safeFetchLlmMock).toHaveBeenCalledTimes(2);

    const first = JSON.parse((safeFetchLlmMock.mock.calls[0][1] as RequestInit).body as string);
    const second = JSON.parse((safeFetchLlmMock.mock.calls[1][1] as RequestInit).body as string);
    expect(first.response_format.type).toBe('json_schema');
    expect(second.response_format).toEqual({ type: 'json_object' });
    expect(second.messages).toEqual(first.messages);
    expect(second.model).toBe(first.model);
  });

  it('retries with max_completion_tokens when the model rejects max_tokens (400, #1760)', async () => {
    safeFetchLlmMock
      .mockResolvedValueOnce(
        jsonResponse(
          { error: { message: "Unsupported parameter: 'max_tokens' is not supported with this model. Use 'max_completion_tokens' instead.", code: 'unsupported_parameter' } },
          false,
          400,
        ),
      )
      .mockResolvedValueOnce(
        jsonResponse({ choices: [{ message: { content: '{"reservations":[{"@type":"FlightReservation"}]}' } }] }),
      );
    const out = await new OpenAiCompatibleClient().extract(baseInput);
    expect(out).toEqual([{ '@type': 'FlightReservation' }]);
    expect(safeFetchLlmMock).toHaveBeenCalledTimes(2);

    const first = JSON.parse((safeFetchLlmMock.mock.calls[0][1] as RequestInit).body as string);
    const second = JSON.parse((safeFetchLlmMock.mock.calls[1][1] as RequestInit).body as string);
    expect(first.max_tokens).toBe(4096);
    expect(first.max_completion_tokens).toBeUndefined();
    // The retry swaps the token param but keeps everything else, json_schema included.
    expect(second.max_completion_tokens).toBe(4096);
    expect(second.max_tokens).toBeUndefined();
    expect(second.response_format.type).toBe('json_schema');
    expect(second.messages).toEqual(first.messages);
  });

  // #2262 — reasoning models (the gpt-5 family) reject any explicit temperature.
  // temperature: 0 sat in the shared body, so it went out on every attempt
  // including both retries, and the import could not succeed at all.
  const TEMP_400 = { error: { message: "Unsupported value: 'temperature' does not support 0 with this model. Only the default (1) value is supported.", code: 'unsupported_value' } };

  it('drops temperature when the model rejects it (400, #2262)', async () => {
    safeFetchLlmMock
      .mockResolvedValueOnce(jsonResponse(TEMP_400, false, 400))
      .mockResolvedValueOnce(jsonResponse({ choices: [{ message: { content: '{"reservations":[{"@type":"FlightReservation"}]}' } }] }));
    const out = await new OpenAiCompatibleClient().extract(baseInput);
    expect(out).toEqual([{ '@type': 'FlightReservation' }]);
    expect(safeFetchLlmMock).toHaveBeenCalledTimes(2);

    const first = JSON.parse((safeFetchLlmMock.mock.calls[0][1] as RequestInit).body as string);
    const second = JSON.parse((safeFetchLlmMock.mock.calls[1][1] as RequestInit).body as string);
    expect(first.temperature).toBe(0);
    expect('temperature' in second).toBe(false);
    // Only temperature goes; the schema and the token param are untouched.
    expect(second.response_format.type).toBe('json_schema');
    expect(second.max_tokens).toBe(4096);
  });

  // A gpt-5 rejects both parameters, and the API names one per response. Either
  // order has to converge, which a chain of one-shot ifs cannot do.
  it('combines the token-param and temperature remedies, token param named first', async () => {
    safeFetchLlmMock
      .mockResolvedValueOnce(jsonResponse({ error: { message: "Unsupported parameter: 'max_tokens' is not supported with this model. Use 'max_completion_tokens' instead." } }, false, 400))
      .mockResolvedValueOnce(jsonResponse(TEMP_400, false, 400))
      .mockResolvedValueOnce(jsonResponse({ choices: [{ message: { content: '{"reservations":[{"@type":"FlightReservation"}]}' } }] }));
    const out = await new OpenAiCompatibleClient().extract(baseInput);
    expect(out).toEqual([{ '@type': 'FlightReservation' }]);
    expect(safeFetchLlmMock).toHaveBeenCalledTimes(3);

    const third = JSON.parse((safeFetchLlmMock.mock.calls[2][1] as RequestInit).body as string);
    expect(third.max_completion_tokens).toBe(4096);
    expect('temperature' in third).toBe(false);
    expect(third.response_format.type).toBe('json_schema');
  });

  it('combines them the other way round too, temperature named first', async () => {
    safeFetchLlmMock
      .mockResolvedValueOnce(jsonResponse(TEMP_400, false, 400))
      .mockResolvedValueOnce(jsonResponse({ error: { message: "Unsupported parameter: 'max_tokens' is not supported with this model. Use 'max_completion_tokens' instead." } }, false, 400))
      .mockResolvedValueOnce(jsonResponse({ choices: [{ message: { content: '{"reservations":[{"@type":"FlightReservation"}]}' } }] }));
    const out = await new OpenAiCompatibleClient().extract(baseInput);
    expect(out).toEqual([{ '@type': 'FlightReservation' }]);
    expect(safeFetchLlmMock).toHaveBeenCalledTimes(3);

    const third = JSON.parse((safeFetchLlmMock.mock.calls[2][1] as RequestInit).body as string);
    expect(third.max_completion_tokens).toBe(4096);
    expect('temperature' in third).toBe(false);
  });

  it('keeps temperature when a 400 only mentions the word in passing', async () => {
    safeFetchLlmMock
      .mockResolvedValueOnce(jsonResponse({ error: { message: 'Your prompt mentions temperature but the schema is invalid' } }, false, 400))
      .mockResolvedValueOnce(jsonResponse({ choices: [{ message: { content: '{"reservations":[]}' } }] }));
    await new OpenAiCompatibleClient().extract(baseInput);

    const second = JSON.parse((safeFetchLlmMock.mock.calls[1][1] as RequestInit).body as string);
    // Not a parameter rejection, so it falls through to the json_object retry
    // with deterministic sampling intact — which is what local models need.
    expect(second.temperature).toBe(0);
    expect(second.response_format.type).toBe('json_object');
  });

  /*
   * A provider behind a proxy that supports neither grammar rejected both rungs
   * and the import failed hard, which is what `drop_params` on the proxy side was
   * being used to work around (#2375). The last attempt sends the request the
   * proxy would have produced.
   */
  it('drops response_format entirely once json_schema and json_object are both refused (#2375)', async () => {
    safeFetchLlmMock
      .mockResolvedValueOnce(jsonResponse({ error: 'no json_schema' }, false, 400))
      .mockResolvedValueOnce(jsonResponse({ error: 'no json_object either' }, false, 400))
      .mockResolvedValueOnce(jsonResponse({ choices: [{ message: { content: '{"reservations":[{"@type":"FlightReservation"}]}' } }] }));
    const out = await new OpenAiCompatibleClient().extract(baseInput);
    expect(out).toEqual([{ '@type': 'FlightReservation' }]);
    expect(safeFetchLlmMock).toHaveBeenCalledTimes(3);

    const bodies = safeFetchLlmMock.mock.calls.map(c => JSON.parse((c[1] as RequestInit).body as string));
    expect(bodies[0].response_format.type).toBe('json_schema');
    expect(bodies[1].response_format).toEqual({ type: 'json_object' });
    expect('response_format' in bodies[2]).toBe(false);
    // Only the grammar goes; the prompt, the model and the token cap are untouched.
    expect(bodies[2].messages).toEqual(bodies[0].messages);
    expect(bodies[2].max_tokens).toBe(4096);
  });

  it('throws when the attempt without response_format also fails (400 three times)', async () => {
    safeFetchLlmMock
      .mockResolvedValueOnce(jsonResponse({ error: 'no json_schema' }, false, 400))
      .mockResolvedValueOnce(jsonResponse({ error: 'no json_object either' }, false, 400))
      .mockResolvedValueOnce(jsonResponse({ error: 'nothing this model accepts' }, false, 400));
    await expect(new OpenAiCompatibleClient().extract(baseInput)).rejects.toThrow(/400/);
    expect(safeFetchLlmMock).toHaveBeenCalledTimes(3);
  });

  it('does not retry the NuExtract path on 400', async () => {
    safeFetchLlmMock.mockResolvedValueOnce(jsonResponse({ error: 'bad' }, false, 400));
    await expect(
      new OpenAiCompatibleClient().extract({ ...baseInput, model: 'hf.co/numind/NuExtract-2.0-2B-GGUF:latest' }),
    ).rejects.toThrow(/400/);
    expect(safeFetchLlmMock).toHaveBeenCalledTimes(1);
  });

  it('sends an image natively as image_url but never a file/pdf part', async () => {
    const fetchFn = mockFetch(() => jsonResponse({ choices: [{ message: { content: '{"reservations":[]}' } }] }));
    await new OpenAiCompatibleClient().extract({ ...baseInput, file: { mimeType: 'image/png', data: Buffer.from('IMG') } });
    let parts = JSON.parse((fetchFn.mock.calls[0][1] as RequestInit).body as string).messages[1].content;
    expect(parts.some((p: any) => p.type === 'image_url')).toBe(true);
    expect(parts.some((p: any) => p.type === 'file')).toBe(false);

    // A PDF must NOT be sent as a content part (Ollama rejects it).
    await new OpenAiCompatibleClient().extract({ ...baseInput, file: { mimeType: 'application/pdf', data: Buffer.from('PDF') } });
    parts = JSON.parse((fetchFn.mock.calls[1][1] as RequestInit).body as string).messages[1].content;
    expect(parts.every((p: any) => p.type !== 'file' && p.type !== 'image_url')).toBe(true);
  });

  /**
   * A report could not say whether the schema ever reached the model or the
   * ladder had fallen back to the prompt alone (#2477). The debug line names
   * the rung that answered, and nothing of the booking.
   */
  it('logs which response_format the answering attempt carried (#2477)', async () => {
    const debug = vi.spyOn(console, 'debug').mockImplementation(() => {});
    const ok = () => jsonResponse({ choices: [{ message: { content: '{"reservations":[]}' } }] });
    const refused = () => jsonResponse({ error: 'no' }, false, 400);
    const lines = () => debug.mock.calls.map(c => String(c[0])).filter(l => l.includes('response_format='));
    try {
      safeFetchLlmMock.mockResolvedValueOnce(ok());
      await new OpenAiCompatibleClient().extract(baseInput);
      safeFetchLlmMock.mockResolvedValueOnce(refused()).mockResolvedValueOnce(ok());
      await new OpenAiCompatibleClient().extract(baseInput);
      safeFetchLlmMock.mockResolvedValueOnce(refused()).mockResolvedValueOnce(refused()).mockResolvedValueOnce(ok());
      await new OpenAiCompatibleClient().extract(baseInput);
      safeFetchLlmMock.mockResolvedValueOnce(jsonResponse({ choices: [{ message: { content: '{}' } }] }));
      await new OpenAiCompatibleClient().extract({ ...baseInput, model: 'hf.co/numind/NuExtract-2.0-2B-GGUF:latest' });

      expect(lines()).toEqual([
        '[DEBUG] LLM answered with response_format=json_schema',
        '[DEBUG] LLM answered with response_format=json_object',
        '[DEBUG] LLM answered with response_format=none',
        '[DEBUG] LLM answered with response_format=none',
      ]);
      expect(debug.mock.calls.flat().join(' ')).not.toContain('Flight AB123');
    } finally {
      debug.mockRestore();
    }
  });
});

describe('OpenAiCompatibleClient — NuExtract path', () => {
  it('inlines the template in one user message (no system, no response_format) and maps the flat result', async () => {
    const fetchFn = mockFetch(() =>
      jsonResponse({
        choices: [
          {
            message: {
              content: JSON.stringify({
                reservations: [
                  { type: 'hotel', name: 'B&B Hotel', booking_reference: '733', checkin_time: '2026-05-01T15:00:00', checkout_time: '2026-05-02T12:00:00' },
                ],
              }),
            },
          },
        ],
      }),
    );
    const out = await new OpenAiCompatibleClient().extract({ ...baseInput, model: 'hf.co/numind/NuExtract-2.0-2B-GGUF:latest', text: 'Hotel doc' });

    expect(out).toEqual([
      {
        '@type': 'LodgingReservation',
        reservationNumber: '733',
        reservationFor: { name: 'B&B Hotel' },
        checkinTime: '2026-05-01T15:00:00',
        checkoutTime: '2026-05-02T12:00:00',
      },
    ]);

    const body = JSON.parse((fetchFn.mock.calls[0][1] as RequestInit).body as string);
    expect(body.messages).toHaveLength(1);
    expect(body.messages[0].role).toBe('user');
    expect(body.messages[0].content[0].text.startsWith('# Template:')).toBe(true);
    expect(body.messages[0].content[0].text.endsWith('Hotel doc')).toBe(true);
    expect(body.temperature).toBe(0);
    expect(body.response_format).toBeUndefined();
  });

  it('throws when NuExtract answered something nothing could read (#2375)', async () => {
    mockFetch(() => jsonResponse({ choices: [{ message: { content: 'I am NuExtract, a template filling model.' } }] }));
    await expect(
      new OpenAiCompatibleClient().extract({ ...baseInput, model: 'nuextract', text: 'Hotel doc' }),
    ).rejects.toThrow(/did not answer with JSON/);

    // A template that came back filled with nothing is still an answer.
    mockFetch(() => jsonResponse({ choices: [{ message: { content: '{"type":null,"name":null}' } }] }));
    expect(await new OpenAiCompatibleClient().extract({ ...baseInput, model: 'nuextract', text: 'Hotel doc' })).toEqual([]);
  });

  it('keeps the system prompt and response_format for non-NuExtract models', async () => {
    const fetchFn = mockFetch(() => jsonResponse({ choices: [{ message: { content: '{"reservations":[]}' } }] }));
    await new OpenAiCompatibleClient().extract({ ...baseInput, model: 'qwen2.5:7b' });
    const body = JSON.parse((fetchFn.mock.calls[0][1] as RequestInit).body as string);
    expect(body.messages[0].role).toBe('system');
    expect(body.response_format).toBeDefined();
  });
});

describe('AnthropicClient', () => {
  it('forces the emit_reservations tool and reads its input', async () => {
    const fetchFn = mockFetch(() =>
      jsonResponse({ stop_reason: 'tool_use', content: [{ type: 'tool_use', name: 'emit_reservations', input: { reservations: [{ '@type': 'LodgingReservation' }] } }] }),
    );
    const out = await new AnthropicClient().extract(baseInput);
    expect(out).toEqual([{ '@type': 'LodgingReservation' }]);
    const body = JSON.parse((fetchFn.mock.calls[0][1] as RequestInit).body as string);
    expect(body.tool_choice).toEqual({ type: 'tool', name: 'emit_reservations' });
    expect(body.tools[0].name).toBe('emit_reservations');
  });

  /*
   * The model does not always send its tool input as the array the schema
   * declares — sometimes it sends the same thing JSON-encoded, in one of two
   * shapes. The old check only accepted arrays, so a good extraction was
   * discarded and the import reported "no reservations found" with nothing in
   * the log: exactly what a document containing no booking produces. Whether it
   * happened came down to how the model serialised that particular call, so the
   * same file behaved differently between attempts (#1968).
   */
  it('reads a tool input the model sent as a stringified array', async () => {
    mockFetch(() =>
      jsonResponse({ stop_reason: 'tool_use', content: [{ type: 'tool_use', name: 'emit_reservations', input: { reservations: JSON.stringify([{ '@type': 'LodgingReservation' }]) } }] }),
    );
    expect(await new AnthropicClient().extract(baseInput)).toEqual([{ '@type': 'LodgingReservation' }]);
  });

  it('reads one the model stringified and wrapped again', async () => {
    mockFetch(() =>
      jsonResponse({ stop_reason: 'tool_use', content: [{ type: 'tool_use', name: 'emit_reservations', input: { reservations: JSON.stringify({ reservations: [{ '@type': 'FlightReservation' }] }) } }] }),
    );
    expect(await new AnthropicClient().extract(baseInput)).toEqual([{ '@type': 'FlightReservation' }]);
  });

  it('still answers empty when the tool input really is not a list', async () => {
    mockFetch(() =>
      jsonResponse({ stop_reason: 'tool_use', content: [{ type: 'tool_use', name: 'emit_reservations', input: { reservations: 'no bookings in this document' } }] }),
    );
    expect(await new AnthropicClient().extract(baseInput)).toEqual([]);
  });

  /*
   * A forced tool that was never called, and a run that stopped at the cap with a
   * fragment of one, both came back as [] — so a long voucher reached the person
   * as "no reservations found", with an empty warnings array and nothing in the
   * log. That is the #2375 symptom on the provider the dropdown offers first, so
   * the same rule applies here: only what the client could read is an answer.
   */
  it('throws when the answer was cut off at the token cap (#2375)', async () => {
    mockFetch(() =>
      jsonResponse({ stop_reason: 'max_tokens', content: [{ type: 'tool_use', name: 'emit_reservations', input: {} }] }),
    );
    await expect(new AnthropicClient().extract(baseInput)).rejects.toThrow(/cut off at the 8192-token limit/);
  });

  it('throws when the forced tool was never called (#2375)', async () => {
    mockFetch(() =>
      jsonResponse({ stop_reason: 'end_turn', content: [{ type: 'text', text: 'I could not find a booking in this document.' }] }),
    );
    await expect(new AnthropicClient().extract(baseInput)).rejects.toThrow(/without calling emit_reservations/);

    // A response carrying no content block at all lands on the same message.
    mockFetch(() => jsonResponse({ stop_reason: 'end_turn' }));
    await expect(new AnthropicClient().extract(baseInput)).rejects.toThrow(/without calling emit_reservations/);
  });

  it('still answers empty for a tool call that carries an empty list', async () => {
    mockFetch(() =>
      jsonResponse({ stop_reason: 'tool_use', content: [{ type: 'tool_use', name: 'emit_reservations', input: { reservations: [] } }] }),
    );
    expect(await new AnthropicClient().extract(baseInput)).toEqual([]);
  });

  it('throws on a refusal stop_reason', async () => {
    mockFetch(() => jsonResponse({ stop_reason: 'refusal', content: [] }));
    await expect(new AnthropicClient().extract(baseInput)).rejects.toThrow(/declined/i);
  });

  it('throws on non-2xx', async () => {
    mockFetch(() => jsonResponse({ error: 'bad' }, false, 500));
    await expect(new AnthropicClient().extract(baseInput)).rejects.toThrow(/500/);
  });

  it('sends a native pdf as a base64 document block', async () => {
    const fetchFn = mockFetch(() => jsonResponse({ content: [{ type: 'tool_use', name: 'emit_reservations', input: { reservations: [] } }] }));
    await new AnthropicClient().extract({ ...baseInput, file: { mimeType: 'application/pdf', data: Buffer.from('PDF') } });
    const body = JSON.parse((fetchFn.mock.calls[0][1] as RequestInit).body as string);
    const blocks = body.messages[0].content;
    expect(blocks.some((b: any) => b.type === 'document' && b.source.type === 'base64')).toBe(true);
  });
});

/**
 * The three per-client constants are gone; what replaced them is a config read.
 * Nothing else in the suite would notice if one of them came back as a literal,
 * so pin the seam itself: the abort deadline has to come from LLM_TIMEOUT_MS.
 */
describe('the abort deadline comes from the configured ceiling (#2230)', () => {
  const setTimeoutSpy = () => vi.spyOn(globalThis, 'setTimeout');

  beforeEach(() => vi.restoreAllMocks());

  it('AnthropicClient arms its AbortController with the configured value', async () => {
    const spy = setTimeoutSpy();
    mockFetch(() => jsonResponse({ content: [{ type: 'tool_use', name: 'emit_reservations', input: { reservations: [] } }] }));

    await new AnthropicClient().extract(baseInput);

    expect(spy).toHaveBeenCalledWith(expect.any(Function), readEnv().integrations.llmTimeoutMs);
  });

  it('OpenAiCompatibleClient arms its AbortController with the configured value', async () => {
    const spy = setTimeoutSpy();
    mockFetch(() => jsonResponse({ choices: [{ message: { content: '{"reservations":[]}' } }] }));

    await new OpenAiCompatibleClient().extract({ ...baseInput, baseUrl: 'http://ollama.local:11434/v1' });

    expect(spy).toHaveBeenCalledWith(expect.any(Function), readEnv().integrations.llmTimeoutMs);
  });
});
