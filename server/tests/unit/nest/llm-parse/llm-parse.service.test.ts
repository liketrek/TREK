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
// The router's pure helpers stay real: the currency fallback reads the document's
// total through extractTotalPrice.
vi.mock('../../../../src/nest/llm-parse/router/extraction-router', async (orig) => {
  const actual = await orig() as Record<string, unknown>;
  return { ...actual, routeExtraction, detectFlightNumbers };
});

import { LlmParseService } from '../../../../src/nest/llm-parse/llm-parse.service';
import type { LlmConfigResolver } from '../../../../src/nest/llm-parse/llm-config.resolver';
import type { RuntimeEnvService } from '../../../../src/nest/app-config/runtime-env.service';

const cfg = (over: Record<string, unknown> = {}) => ({ provider: 'openai', model: 'm', multimodal: false, ...over });
const llmConfigStub = { resolve: resolveLlmConfig } as unknown as LlmConfigResolver;
const svc = () => new LlmParseService(llmConfigStub, { isManaged: () => false } as unknown as RuntimeEnvService);
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

/**
 * What a schema-bound provider answered for one Booking.com stay (#2477): the
 * same node twice, and a currency the model made up. Synthetic values in the
 * reporter's shape.
 */
describe('LlmParseService: cleaning up an AI answer (#2477)', () => {
  const stay = (over: Record<string, unknown> = {}) => ({
    '@type': 'LodgingReservation',
    checkinTime: '2026-09-06T13:00:00',
    checkoutTime: '2026-09-07T11:00:00',
    price: 89.35,
    priceCurrency: 'EURials',
    reservationFor: { name: 'Harbour View Inn', address: 'Example Road 1' },
    ...over,
  });
  const PRINT = ['Harbour View Inn', 'PREIS', '1 Zimmer € 74,46', 'Preis', '(für 2 Gäste)', '€ 89,35'].join('\n');

  it('collapses exact duplicate nodes from one AI answer', async () => {
    extractText.mockResolvedValue(PRINT);
    extract.mockResolvedValue([stay(), stay()]);
    const res = await svc().parse(file('Bestätigung_1.pdf', '%PDF'), 1);
    expect(res.kiItems).toHaveLength(1);
    expect(res.warnings).toEqual([]);
  });

  it("collapses the reporter's two nodes without a venue into one as well", async () => {
    extractText.mockResolvedValue(PRINT);
    const bare = { '@type': 'LodgingReservation', checkinTime: '2026-09-06T13:00:00', checkoutTime: '2026-09-07T11:00:00', price: 89.35, priceCurrency: 'EURials' };
    extract.mockResolvedValue([bare, { ...bare }]);
    const res = await svc().parse(file('Bestätigung_1.pdf', '%PDF'), 1);
    expect(res.kiItems).toEqual([{ ...bare, priceCurrency: 'EUR' }]);
  });

  it('treats the same fields in another key order as the same node', async () => {
    const a = stay();
    const b = { reservationFor: { address: 'Example Road 1', name: 'Harbour View Inn' }, priceCurrency: 'EURials', price: 89.35, checkoutTime: a.checkoutTime, checkinTime: a.checkinTime, '@type': a['@type'] };
    extract.mockResolvedValue([a, b]);
    const res = await svc().parse(file('a.txt'), 1);
    expect(res.kiItems).toHaveLength(1);
  });

  it('keeps distinct nodes that only look alike', async () => {
    extract.mockResolvedValue([stay(), stay({ checkinTime: '2026-09-07T13:00:00', checkoutTime: '2026-09-08T11:00:00' })]);
    const res = await svc().parse(file('a.txt'), 1);
    expect(res.kiItems).toHaveLength(2);
  });

  it('turns a garbled priceCurrency into the code it starts with', async () => {
    extract.mockResolvedValue([stay()]);
    const res = await svc().parse(file('a.txt'), 1);
    expect(res.kiItems[0].priceCurrency).toBe('EUR');
  });

  it("falls back to the document's currency symbol when the model named no currency", async () => {
    extractText.mockResolvedValue(PRINT);
    extract.mockResolvedValue([stay({ priceCurrency: 'ZZZ' }), stay({ priceCurrency: undefined, checkinTime: '2026-10-01T15:00:00' })]);
    const res = await svc().parse(file('b.pdf', '%PDF'), 1);
    expect(res.kiItems.map((n) => n.priceCurrency)).toEqual(['EUR', 'EUR']);
  });

  it('drops the currency when neither the model nor the document names one', async () => {
    extractText.mockResolvedValue('Harbour View Inn, 89.35 total');
    extract.mockResolvedValue([stay({ priceCurrency: 'ZZZ' })]);
    const res = await svc().parse(file('b.txt'), 1);
    expect(res.kiItems[0]).not.toHaveProperty('priceCurrency');
    expect(res.kiItems[0].price).toBe(89.35);
  });

  it('asks the document only when the node has a price', async () => {
    extractText.mockResolvedValue(PRINT);
    extract.mockResolvedValue([stay({ price: undefined, priceCurrency: 'Pesos' })]);
    const res = await svc().parse(file('b.pdf', '%PDF'), 1);
    expect(res.kiItems[0]).not.toHaveProperty('priceCurrency');
  });

  it('has no document to ask on the native PDF path', async () => {
    resolveLlmConfig.mockReturnValue(cfg({ provider: 'anthropic' }));
    extract.mockResolvedValue([stay({ priceCurrency: 'ZZZ' })]);
    const res = await svc().parse(file('b.pdf', '%PDF'), 1);
    expect(extractText).not.toHaveBeenCalled();
    expect(res.kiItems[0]).not.toHaveProperty('priceCurrency');
  });

  it('leaves a node without price and currency as it came', async () => {
    const plain = { '@type': 'FlightReservation', reservationFor: { flightNumber: 'X1' } };
    extract.mockResolvedValue([plain]);
    const res = await svc().parse(file('a.txt'), 1);
    expect(res.kiItems).toEqual([plain]);
  });
});
