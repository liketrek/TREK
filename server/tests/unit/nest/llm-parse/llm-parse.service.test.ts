import { describe, it, expect, vi, beforeEach } from 'vitest';

const { resolveLlmConfig } = vi.hoisted(() => ({ resolveLlmConfig: vi.fn() }));
vi.mock('../../../../src/nest/llm-parse/llm-config.resolver', () => ({ resolveLlmConfig }));

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

import { LlmParseService } from '../../../../src/nest/llm-parse/llm-parse.service';

const cfg = (over: Record<string, unknown> = {}) => ({ provider: 'openai', model: 'm', multimodal: false, ...over });
const svc = () => new LlmParseService();
const file = (name: string, body = 'Flight AB123') => ({ buffer: Buffer.from(body), originalName: name });

beforeEach(() => {
  vi.clearAllMocks();
  resolveLlmConfig.mockReturnValue(cfg());
  extract.mockResolvedValue([{ '@type': 'FlightReservation' }]);
  extractText.mockResolvedValue('Flight AB123');
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
});
