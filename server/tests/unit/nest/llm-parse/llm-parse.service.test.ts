import { describe, it, expect, vi, beforeEach } from 'vitest';

// LlmConfigResolver is constructor-injected — a stub instance instead of the
// old path mock (same behaviors as before the DI move).
const resolveLlmConfig = vi.fn();

const { createLlmClient, extract } = vi.hoisted(() => {
  const extract = vi.fn();
  return { createLlmClient: vi.fn(() => ({ extract })), extract };
});
vi.mock('../../../../src/nest/llm-parse/llm-client.factory', () => ({ createLlmClient }));

const { extractText } = vi.hoisted(() => ({ extractText: vi.fn(async () => 'Flight AB123') }));
vi.mock('../../../../src/nest/llm-parse/text-extract', async (orig) => {
  const actual = await orig() as Record<string, unknown>;
  return { ...actual, extractText };
});

const { routeExtraction, detectFlightNumbers } = vi.hoisted(() => ({
  routeExtraction: vi.fn(),
  detectFlightNumbers: vi.fn(() => [] as string[]),
}));
vi.mock('../../../../src/nest/llm-parse/router/extraction-router', () => ({ routeExtraction, detectFlightNumbers }));

import { LlmParseService } from '../../../../src/nest/llm-parse/llm-parse.service';
import type { LlmConfigResolver } from '../../../../src/nest/llm-parse/llm-config.resolver';
import type { LlmLocalService } from '../../../../src/nest/llm-parse/llm-local.service';
import type { RuntimeEnvService } from '../../../../src/nest/app-config/runtime-env.service';

const cfg = (over: Record<string, unknown> = {}) => ({ provider: 'openai', model: 'm', multimodal: false, ...over });
const llmConfigStub = { resolve: resolveLlmConfig } as unknown as LlmConfigResolver;
/** Ollama's own answer about a model. `null` = an older server with nothing to say. */
const localCapabilities = vi.fn<(baseUrl: string | undefined, model: string) => Promise<string[] | null>>(
  async () => null,
);
const llmLocalStub = { capabilities: localCapabilities } as unknown as LlmLocalService;

const svc = () =>
  new LlmParseService(llmConfigStub, llmLocalStub, { isManaged: () => false } as unknown as RuntimeEnvService);
const file = (name: string, body = 'Flight AB123') => ({ buffer: Buffer.from(body), originalName: name });

beforeEach(() => {
  vi.clearAllMocks();
  resolveLlmConfig.mockReturnValue(cfg());
  extract.mockResolvedValue([{ '@type': 'FlightReservation' }]);
  extractText.mockResolvedValue('Flight AB123');
  detectFlightNumbers.mockReturnValue([]);
  routeExtraction.mockResolvedValue({ kiItems: [{ '@type': 'LodgingReservation' }], warnings: [] });
});

describe('LlmParseService', () => {
  it('isAvailable reflects whether a config resolves', () => {
    resolveLlmConfig.mockReturnValueOnce(null);
    expect(svc().isAvailable(1)).toBe(false);
    expect(svc().isAvailable(1)).toBe(true);
  });

  it('returns a not-configured warning when no config resolves', async () => {
    resolveLlmConfig.mockReturnValue(null);
    const res = await svc().parse(file('a.txt'), 1);
    expect(res.kiItems).toEqual([]);
    expect(res.warnings[0]).toMatch(/not configured/i);
    expect(extract).not.toHaveBeenCalled();
  });

  it('sends extracted text for a text-like file', async () => {
    const res = await svc().parse(file('a.txt'), 1);
    expect(res.kiItems).toEqual([{ '@type': 'FlightReservation' }]);
    const input = extract.mock.calls[0][0];
    expect(input.text).toBe('Flight AB123');
    expect(input.file).toBeUndefined();
  });

  it('extracts text for a pdf on the OpenAI-compatible/local path (no native bytes)', async () => {
    extractText.mockResolvedValue('Hotel X');
    await svc().parse(file('a.pdf', '%PDF'), 1);
    const input = extract.mock.calls[0][0];
    expect(input.text).toBe('Hotel X');
    expect(input.file).toBeUndefined();
  });

  it('sends a pdf as native bytes only for Anthropic', async () => {
    resolveLlmConfig.mockReturnValue(cfg({ provider: 'anthropic' }));
    await svc().parse(file('a.pdf', '%PDF'), 1);
    const input = extract.mock.calls[0][0];
    expect(input.file).toEqual({ mimeType: 'application/pdf', data: expect.any(Buffer) });
    expect(input.text).toBeUndefined();
    expect(extractText).not.toHaveBeenCalled();
  });

  it('warns when a pdf yields no readable text (e.g. a scan)', async () => {
    extractText.mockResolvedValue('   ');
    const res = await svc().parse(file('a.pdf', '%PDF'), 1);
    expect(res.kiItems).toEqual([]);
    expect(res.warnings[0]).toMatch(/no readable text/i);
    expect(extract).not.toHaveBeenCalled();
  });

  it('folds flattened type fields into reservationFor (small-model output)', async () => {
    extract.mockResolvedValue([{
      '@type': 'FlightReservation',
      reservationNumber: 'ABC',
      flightNumber: 'EZY1357',
      airline: { iataCode: 'EG' },
      departureAirport: { iataCode: 'GEG' },
      arrivalAirport: { iataCode: 'AMS' },
      departureTime: '2026-06-11T10:00:00',
    }]);
    const res = await svc().parse(file('a.txt'), 1);
    const item = res.kiItems[0] as any;
    expect(item.reservationNumber).toBe('ABC');
    expect(item.reservationFor).toMatchObject({ flightNumber: 'EZY1357', departureAirport: { iataCode: 'GEG' } });
    // root-level keys are not duplicated into reservationFor
    expect(item.reservationFor.reservationNumber).toBeUndefined();
  });

  it('leaves already-nested reservationFor untouched', async () => {
    extract.mockResolvedValue([{ '@type': 'FlightReservation', reservationFor: { flightNumber: 'X1' } }]);
    const res = await svc().parse(file('a.txt'), 1);
    expect((res.kiItems[0] as any).reservationFor).toEqual({ flightNumber: 'X1' });
  });

  it('drops nodes without a string @type and warns', async () => {
    extract.mockResolvedValue([{ '@type': 'FlightReservation' }, { foo: 'bar' }]);
    const res = await svc().parse(file('a.txt'), 1);
    expect(res.kiItems).toEqual([{ '@type': 'FlightReservation' }]);
    expect(res.warnings.some(w => /unrecognized/i.test(w))).toBe(true);
  });

  it('degrades to a warning when the client throws', async () => {
    extract.mockRejectedValue(new Error('boom'));
    const res = await svc().parse(file('a.txt'), 1);
    expect(res.kiItems).toEqual([]);
    expect(res.warnings[0]).toMatch(/AI parsing failed/i);
  });

  it('logs the swallowed client error to console.error', async () => {
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {});
    extract.mockRejectedValue(new Error('boom'));
    await svc().parse(file('a.txt'), 1);
    expect(spy).toHaveBeenCalledWith(expect.stringContaining('[llm-parse]'), 'boom');
    spy.mockRestore();
  });

  it('routes the local provider through the extraction router instead of the single-shot client', async () => {
    resolveLlmConfig.mockReturnValue(cfg({ provider: 'local', baseUrl: 'http://ollama:11434/v1', apiKey: 'k' }));
    extractText.mockResolvedValue('Hotel booking');
    routeExtraction.mockResolvedValue({ kiItems: [{ '@type': 'LodgingReservation' }], warnings: ['note'] });
    const res = await svc().parse(file('a.txt'), 1);
    expect(res.kiItems).toEqual([{ '@type': 'LodgingReservation' }]);
    expect(res.warnings).toEqual(['note']);
    expect(extract).not.toHaveBeenCalled();
    expect(routeExtraction).toHaveBeenCalledWith('Hotel booking', { baseUrl: 'http://ollama:11434/v1', model: 'm', apiKey: 'k' });
  });

  it('keeps the wide text cap (16k) for a local flight itinerary but tightens it (6k) otherwise', async () => {
    const long = 'x'.repeat(7000);
    extractText.mockResolvedValue(long);

    resolveLlmConfig.mockReturnValue(cfg({ provider: 'local' }));
    detectFlightNumbers.mockReturnValue(['AB123']);
    await svc().parse(file('flights.txt'), 1);
    expect(routeExtraction.mock.calls[0][0]).toHaveLength(7000); // under the 16k cap, untouched

    vi.clearAllMocks();
    resolveLlmConfig.mockReturnValue(cfg({ provider: 'local' }));
    extractText.mockResolvedValue(long);
    detectFlightNumbers.mockReturnValue([]);
    routeExtraction.mockResolvedValue({ kiItems: [], warnings: [] });
    await svc().parse(file('hotel.txt'), 1);
    expect(routeExtraction.mock.calls[0][0]).toHaveLength(6000); // single booking → tighter cap
  });

  it('degrades to a warning when the local router throws', async () => {
    resolveLlmConfig.mockReturnValue(cfg({ provider: 'local' }));
    routeExtraction.mockRejectedValue(new Error('ollama down'));
    const res = await svc().parse(file('a.txt'), 1);
    expect(res.kiItems).toEqual([]);
    expect(res.warnings[0]).toMatch(/AI parsing failed/i);
  });

  it('logs the swallowed router error to console.error', async () => {
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {});
    resolveLlmConfig.mockReturnValue(cfg({ provider: 'local' }));
    routeExtraction.mockRejectedValue(new Error('ollama down'));
    await svc().parse(file('a.txt'), 1);
    expect(spy).toHaveBeenCalledWith(expect.stringContaining('[llm-parse]'), 'ollama down');
    spy.mockRestore();
  });

  it('warns when the file cannot be read (text extraction throws)', async () => {
    extractText.mockRejectedValue(new Error('corrupt pdf'));
    const res = await svc().parse(file('a.pdf', '%PDF'), 1);
    expect(res.kiItems).toEqual([]);
    expect(res.warnings[0]).toMatch(/could not read file/i);
    expect(res.warnings[0]).toContain('corrupt pdf');
  });
});

describe('LlmParseService.readsPhotos', () => {
  beforeEach(() => localCapabilities.mockResolvedValue(null));

  it('takes the operator at their word when the switch is on', async () => {
    resolveLlmConfig.mockReturnValue(cfg({ model: 'some-local-thing', multimodal: true }));
    await expect(svc().readsPhotos(1)).resolves.toBe(true);
  });

  it('asks the local server, which knows, instead of guessing from the id', async () => {
    // Verified against Ollama 0.32.15: qwen3.5:4b reports vision, qwen3:8b does not.
    resolveLlmConfig.mockReturnValue(cfg({ provider: 'local', model: 'anything-at-all' }));
    localCapabilities.mockResolvedValue(['completion', 'vision', 'tools', 'thinking']);
    await expect(svc().readsPhotos(1)).resolves.toBe(true);
    expect(localCapabilities).toHaveBeenCalledWith(undefined, 'anything-at-all');
  });

  it('believes the local server when it says the model is blind, id notwithstanding', async () => {
    resolveLlmConfig.mockReturnValue(cfg({ provider: 'local', model: 'qwen3.5:4b' }));
    localCapabilities.mockResolvedValue(['completion', 'tools']);
    await expect(svc().readsPhotos(1)).resolves.toBe(false);
  });

  it('falls back to the id when the server is too old to answer', async () => {
    // A model that works must not be hidden because Ollama predates the field.
    resolveLlmConfig.mockReturnValue(cfg({ provider: 'local', model: 'qwen3.5:4b' }));
    localCapabilities.mockResolvedValue(null);
    await expect(svc().readsPhotos(1)).resolves.toBe(true);
  });

  it('never asks the local server about a cloud model', async () => {
    resolveLlmConfig.mockReturnValue(cfg({ provider: 'openai', model: 'gpt-4o' }));
    await expect(svc().readsPhotos(1)).resolves.toBe(true);
    expect(localCapabilities).not.toHaveBeenCalled();
  });

  it('says no to a text-only model when the switch is off', async () => {
    // Not a lesser choice for a photograph — the wrong one: the provider rejects
    // the image rather than doing its best with it.
    resolveLlmConfig.mockReturnValue(cfg({ model: 'qwen3:8b', multimodal: false }));
    await expect(svc().readsPhotos(1)).resolves.toBe(false);
  });

  it('says no when nothing is configured at all', async () => {
    resolveLlmConfig.mockReturnValue(null);
    await expect(svc().readsPhotos(1)).resolves.toBe(false);
  });
});
