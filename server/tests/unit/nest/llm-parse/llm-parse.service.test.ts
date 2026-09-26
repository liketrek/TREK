import { describe, it, expect, vi, beforeEach } from 'vitest';

// LlmConfigResolver is constructor-injected — a stub instance instead of the
// old path mock (same behaviors as before the DI move).
const resolveLlmConfig = vi.fn();

const { createLlmClient, extract } = vi.hoisted(() => {
  const extract = vi.fn();
  return { createLlmClient: vi.fn(() => ({ extract })), extract };
});
vi.mock('../../../../src/nest/llm-parse/llm-client.factory', () => ({ createLlmClient }));

const { extractEnforced } = vi.hoisted(() => ({ extractEnforced: vi.fn() }));

const { renderPdfPages } = vi.hoisted(() => ({ renderPdfPages: vi.fn() }));
vi.mock('../../../../src/nest/llm-parse/image-input', async (orig) => {
  const actual = await orig() as Record<string, unknown>;
  return { ...actual, renderPdfPages };
});
vi.mock('../../../../src/nest/llm-parse/router/ollama-format.client', async (orig) => {
  const actual = await orig() as Record<string, unknown>;
  return { ...actual, extractEnforced };
});

const { extractText } = vi.hoisted(() => ({ extractText: vi.fn(async () => 'Flight AB123') }));
vi.mock('../../../../src/nest/llm-parse/text-extract', async (orig) => {
  const actual = await orig() as Record<string, unknown>;
  return { ...actual, extractText };
});

const { routeExtraction, routeImageExtraction, detectFlightNumbers } = vi.hoisted(() => ({
  routeExtraction: vi.fn(),
  routeImageExtraction: vi.fn(),
  detectFlightNumbers: vi.fn(() => [] as string[]),
}));
// The router's pure helpers stay real: the currency fallback reads the document's
// total through extractTotalPrice.
vi.mock('../../../../src/nest/llm-parse/router/extraction-router', async (orig) => {
  const actual = await orig() as Record<string, unknown>;
  return { ...actual, routeExtraction, routeImageExtraction, detectFlightNumbers };
});

import { LlmParseService } from '../../../../src/nest/llm-parse/llm-parse.service';
import type { LlmConfigResolver } from '../../../../src/nest/llm-parse/llm-config.resolver';
import type { RuntimeEnvService } from '../../../../src/nest/app-config/runtime-env.service';
import type { LlmLocalService } from '../../../../src/nest/llm-parse/llm-local.service';

const cfg = (over: Record<string, unknown> = {}) => ({ provider: 'openai', model: 'm', vision: 'off', ...over });
const llmConfigStub = { resolve: resolveLlmConfig } as unknown as LlmConfigResolver;
const modelCapabilities = vi.fn();
const svc = () => new LlmParseService(
  llmConfigStub,
  { isManaged: () => false } as unknown as RuntimeEnvService,
  { modelCapabilities } as unknown as LlmLocalService,
);
const file = (name: string, body = 'Flight AB123') => ({ buffer: Buffer.from(body), originalName: name });

/** The first bytes of a PNG that claims the given size: enough for the pixel cap to refuse it. */
function pngClaiming(w: number, h: number): Buffer {
  const out = Buffer.alloc(33);
  Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]).copy(out, 0);
  out.writeUInt32BE(13, 8);
  out.write('IHDR', 12, 'latin1');
  out.writeUInt32BE(w, 16);
  out.writeUInt32BE(h, 20);
  return out;
}

beforeEach(() => {
  vi.clearAllMocks();
  resolveLlmConfig.mockReturnValue(cfg());
  extract.mockResolvedValue([{ '@type': 'FlightReservation' }]);
  extractText.mockResolvedValue('Flight AB123');
  detectFlightNumbers.mockReturnValue([]);
  routeExtraction.mockResolvedValue({ kiItems: [{ '@type': 'LodgingReservation' }], warnings: [] });
  routeImageExtraction.mockResolvedValue({ kiItems: [{ '@type': 'TrainReservation' }], warnings: [] });
  modelCapabilities.mockResolvedValue(null);
  renderPdfPages.mockResolvedValue([]);
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

describe('LlmParseService: a photo', () => {
  it('readsImages follows on and off whatever the provider, and never asks a server for them', async () => {
    resolveLlmConfig.mockReturnValue(cfg({ provider: 'local', vision: 'on' }));
    await expect(svc().readsImages(1)).resolves.toBe(true);
    resolveLlmConfig.mockReturnValue(cfg({ provider: 'local', vision: 'off' }));
    await expect(svc().readsImages(1)).resolves.toBe(false);
    resolveLlmConfig.mockReturnValue(cfg({ provider: 'openai', vision: 'on' }));
    await expect(svc().readsImages(1)).resolves.toBe(true);
    expect(modelCapabilities).not.toHaveBeenCalled();
  });

  it('readsImages on auto asks a local server, and answers no for a cloud provider', async () => {
    resolveLlmConfig.mockReturnValue(cfg({ provider: 'local', vision: 'auto', baseUrl: 'http://ollama:11434/v1', model: 'qwen3.5:4b', apiKey: 'proxy-key' }));
    modelCapabilities.mockResolvedValue(['completion', 'vision']);
    await expect(svc().readsImages(1)).resolves.toBe(true);
    // With the key the extraction sends, so an Ollama behind an auth proxy answers.
    expect(modelCapabilities).toHaveBeenCalledWith('http://ollama:11434/v1', 'qwen3.5:4b', 'proxy-key');
    modelCapabilities.mockResolvedValue(['completion']);
    await expect(svc().readsImages(1)).resolves.toBe(false);
    modelCapabilities.mockResolvedValue(null);
    await expect(svc().readsImages(1)).resolves.toBe(false);

    modelCapabilities.mockClear();
    for (const provider of ['openai', 'anthropic']) {
      resolveLlmConfig.mockReturnValue(cfg({ provider, vision: 'auto' }));
      await expect(svc().readsImages(1)).resolves.toBe(false);
    }
    expect(modelCapabilities).not.toHaveBeenCalled();
  });

  it('readsImages is false when AI parsing is not configured', async () => {
    resolveLlmConfig.mockReturnValue(null);
    await expect(svc().readsImages(1)).resolves.toBe(false);
  });

  it('refuses a photo the model cannot read, without calling it', async () => {
    const res = await svc().parse(file('ticket.jpg', 'jpeg'), 1);
    expect(res.kiItems).toEqual([]);
    expect(res.warnings[0]).toMatch(/does not read images/);
    expect(extract).not.toHaveBeenCalled();
    expect(extractText).not.toHaveBeenCalled();
  });

  it('sends a photo as an image to a cloud provider, with no text', async () => {
    for (const provider of ['openai', 'anthropic']) {
      extract.mockClear();
      resolveLlmConfig.mockReturnValue(cfg({ provider, vision: 'on' }));
      await svc().parse(file('ticket.PNG', 'not really a png'), 1);
      const input = extract.mock.calls[0][0];
      // Bytes that do not decode go as they came rather than being refused.
      expect(input.file).toEqual({ mimeType: 'image/png', data: Buffer.from('not really a png') });
      expect(input.text).toBeUndefined();
    }
    expect(extractText).not.toHaveBeenCalled();
  });

  it('sends a photo through the local router with the image attached', async () => {
    resolveLlmConfig.mockReturnValue(cfg({ provider: 'local', vision: 'on', baseUrl: 'http://ollama:11434/v1' }));
    const res = await svc().parse(file('ticket.jpeg', 'jpeg bytes'), 1);
    expect(res.kiItems).toEqual([{ '@type': 'TrainReservation' }]);
    expect(routeImageExtraction).toHaveBeenCalledWith([Buffer.from('jpeg bytes')], expect.objectContaining({ baseUrl: 'http://ollama:11434/v1' }));
    expect(routeExtraction).not.toHaveBeenCalled();
    expect(extract).not.toHaveBeenCalled();
  });

  it('turns a photo too large to decode into a warning, not a throw', async () => {
    resolveLlmConfig.mockReturnValue(cfg({ vision: 'on' }));
    const res = await svc().parse({ buffer: pngClaiming(20000, 20000), originalName: 'ticket.png' }, 1);
    expect(res.kiItems).toEqual([]);
    expect(res.warnings[0]).toMatch(/^ticket\.png: could not read file .*20000 x 20000 pixels/);
    expect(extract).not.toHaveBeenCalled();
  });

  it('leaves a PDF on its text path when the model reads images', async () => {
    resolveLlmConfig.mockReturnValue(cfg({ vision: 'on' }));
    await svc().parse(file('a.pdf', '%PDF'), 1);
    expect(extract.mock.calls[0][0].file).toBeUndefined();
    expect(extractText).toHaveBeenCalled();
  });
});

describe('LlmParseService.readReceipt', () => {
  const RECEIPT = { merchant: 'Bäckerei', date: '2026-09-20', total: 7.5, currency: 'EUR', items: [{ name: 'Brezel', price: 2.5 }] };

  it('says why when AI parsing is not set up, the file is not a photo, or the model reads no images', async () => {
    resolveLlmConfig.mockReturnValue(null);
    expect((await svc().readReceipt(file('r.jpg'), 1)).warnings[0]).toMatch(/not configured/);
    resolveLlmConfig.mockReturnValue(cfg({ vision: 'on' }));
    expect(await svc().readReceipt(file('r.pdf'), 1)).toEqual({ receipt: null, warnings: ['r.pdf: not a photo'] });
    resolveLlmConfig.mockReturnValue(cfg({ vision: 'off' }));
    expect((await svc().readReceipt(file('r.jpg'), 1)).warnings[0]).toMatch(/does not read images/);
    expect(extract).not.toHaveBeenCalled();
    expect(extractEnforced).not.toHaveBeenCalled();
  });

  it('reads through Ollama\'s native chat on a local provider, with the photo and the receipt schema', async () => {
    resolveLlmConfig.mockReturnValue(cfg({ provider: 'local', vision: 'on', baseUrl: 'http://ollama:11434/v1', model: 'qwen3.5:4b' }));
    extractEnforced.mockResolvedValue(RECEIPT);
    await expect(svc().readReceipt(file('r.jpg', 'jpeg'), 1)).resolves.toEqual({ receipt: RECEIPT, warnings: [] });
    const call = extractEnforced.mock.calls[0][0];
    expect(call).toMatchObject({ baseUrl: 'http://ollama:11434/v1', model: 'qwen3.5:4b', images: [Buffer.from('jpeg').toString('base64')] });
    expect(call.schema.required).toContain('total');
    // The grammar holds Ollama to one flat receipt, and the prompt says the same.
    expect(call.system).toContain('Return ONLY a JSON object of the form { "merchant"');
    expect(extract).not.toHaveBeenCalled();
  });

  it('asks a cloud client for a receipts list with the photo attached, and keeps the first', async () => {
    resolveLlmConfig.mockReturnValue(cfg({ provider: 'anthropic', vision: 'on' }));
    extract.mockResolvedValue([RECEIPT, { total: 1 }]);
    await expect(svc().readReceipt(file('r.png', 'png'), 1)).resolves.toEqual({ receipt: RECEIPT, warnings: [] });
    const input = extract.mock.calls[0][0];
    expect(input.rootKey).toBe('receipts');
    expect(input.file).toEqual({ mimeType: 'image/png', data: Buffer.from('png') });
    expect(input.text).toBeUndefined();
    expect(input.prompt).toContain('Return ONLY a JSON object of the form { "receipts": [');
  });

  it('refuses a photo too large to decode with a warning, before asking the model', async () => {
    resolveLlmConfig.mockReturnValue(cfg({ vision: 'on' }));
    const res = await svc().readReceipt({ buffer: pngClaiming(20000, 20000), originalName: 'r.png' }, 1);
    expect(res).toEqual({ receipt: null, warnings: ['r.png: the photo is 20000 x 20000 pixels, more than the 40 megapixels TREK reads'] });
    expect(extract).not.toHaveBeenCalled();
  });

  it('answers a warning, not a throw, when the model fails or reads nothing', async () => {
    resolveLlmConfig.mockReturnValue(cfg({ vision: 'on' }));
    extract.mockRejectedValue(new Error('429'));
    const failed = await svc().readReceipt(file('r.jpg'), 1);
    expect(failed.receipt).toBeNull();
    expect(failed.warnings[0]).toMatch(/AI parsing failed — 429/);
    extract.mockResolvedValue([]);
    expect(await svc().readReceipt(file('r.jpg'), 1)).toEqual({ receipt: null, warnings: ['r.jpg: no receipt could be read'] });
  });
});

describe('LlmParseService: a scanned PDF', () => {
  const page = (n: string) => ({ mimeType: 'image/jpeg', data: Buffer.from(n) });

  beforeEach(() => extractText.mockResolvedValue('   '));

  it('sends the pages as images when the text layer is empty and the model reads images', async () => {
    resolveLlmConfig.mockReturnValue(cfg({ vision: 'on' }));
    renderPdfPages.mockResolvedValue([page('p1'), page('p2')]);
    await svc().parse(file('scan.pdf', '%PDF'), 1);
    const input = extract.mock.calls[0][0];
    expect(input.file).toEqual(page('p1'));
    expect(input.pageImages).toEqual([page('p2')]);
    expect(input.text).toBeUndefined();
  });

  it('hands the local router every page', async () => {
    resolveLlmConfig.mockReturnValue(cfg({ provider: 'local', vision: 'on' }));
    renderPdfPages.mockResolvedValue([page('p1'), page('p2')]);
    await svc().parse(file('scan.pdf', '%PDF'), 1);
    expect(routeImageExtraction).toHaveBeenCalledWith([Buffer.from('p1'), Buffer.from('p2')], expect.anything());
    expect(routeExtraction).not.toHaveBeenCalled();
  });

  it('keeps the warning, and draws nothing, when the model reads no images', async () => {
    resolveLlmConfig.mockReturnValue(cfg({ vision: 'off' }));
    const res = await svc().parse(file('scan.pdf', '%PDF'), 1);
    expect(res.warnings[0]).toMatch(/no readable text found \(a scanned PDF needs a model that reads images\)/);
    expect(renderPdfPages).not.toHaveBeenCalled();
    expect(extract).not.toHaveBeenCalled();
  });

  it('keeps the warning when no page could be drawn', async () => {
    resolveLlmConfig.mockReturnValue(cfg({ vision: 'on' }));
    const res = await svc().parse(file('scan.pdf', '%PDF'), 1);
    expect(res.warnings[0]).toMatch(/no readable text found/);
    expect(extract).not.toHaveBeenCalled();
  });

  it('does not draw an empty text file', async () => {
    resolveLlmConfig.mockReturnValue(cfg({ vision: 'on' }));
    await svc().parse(file('empty.txt', ''), 1);
    expect(renderPdfPages).not.toHaveBeenCalled();
  });
});
