/**
 * The AI reading of a forwarded mail: one request per mail with the trip list,
 * a scan's pages as images only for a model that reads them, the local router
 * for a self-hosted model, and every failure reported as its outcome with
 * nothing of the mail in the log.
 */
import { LlmRequestError } from '../../../../src/nest/llm-parse/clients/llm-request-error';
import { LlmConfigResolver } from '../../../../src/nest/llm-parse/llm-config.resolver';
import { LlmParseService } from '../../../../src/nest/llm-parse/llm-parse.service';
import { MailReadService } from '../../../../src/nest/llm-parse/mail-read.service';
import type { MailReadInput } from '../../../../src/nest/llm-parse/mail-read.types';
import { Test } from '@nestjs/testing';

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const { createLlmClient, extract } = vi.hoisted(() => {
  const extract = vi.fn();
  return { createLlmClient: vi.fn(() => ({ extract })), extract };
});
vi.mock('../../../../src/nest/llm-parse/llm-client.factory', () => ({ createLlmClient }));

const { renderPdfPages, capImage } = vi.hoisted(() => ({
  renderPdfPages: vi.fn(),
  capImage: vi.fn(async (data: Buffer, mimeType: string) => ({ data, mimeType })),
}));
vi.mock('../../../../src/nest/llm-parse/image-input', async (orig) => {
  const actual = (await orig()) as Record<string, unknown>;
  return { ...actual, renderPdfPages, capImage };
});

const { extractText } = vi.hoisted(() => ({ extractText: vi.fn() }));
vi.mock('../../../../src/nest/llm-parse/text-extract', async (orig) => {
  const actual = (await orig()) as Record<string, unknown>;
  return { ...actual, extractText };
});

const { routeExtraction, routeImageExtraction } = vi.hoisted(() => ({
  routeExtraction: vi.fn(),
  routeImageExtraction: vi.fn(),
}));
vi.mock('../../../../src/nest/llm-parse/router/extraction-router', async (orig) => {
  const actual = (await orig()) as Record<string, unknown>;
  return { ...actual, routeExtraction, routeImageExtraction };
});

const resolve = vi.fn();
const readsImages = vi.fn();
const isAvailable = vi.fn();
let service: MailReadService;

beforeEach(async () => {
  vi.clearAllMocks();
  resolve.mockResolvedValue({ provider: 'anthropic', model: 'm', vision: 'off' });
  readsImages.mockResolvedValue(false);
  isAvailable.mockResolvedValue(true);
  extractText.mockResolvedValue('Ticket ABC123');
  const moduleRef = await Test.createTestingModule({
    providers: [
      MailReadService,
      { provide: LlmConfigResolver, useValue: { resolve } },
      { provide: LlmParseService, useValue: { readsImages, isAvailable } },
    ],
  }).compile();
  service = moduleRef.get(MailReadService);
});
afterEach(() => vi.restoreAllMocks());

const flight = { '@type': 'FlightReservation', reservationNumber: 'ABC123' };
const input = (over: Partial<MailReadInput> = {}): MailReadInput => ({
  subject: 'Your flight',
  date: 'Mon, 1 Mar 2027',
  body: 'Booking ABC123 Tokyo to Osaka',
  attachments: [],
  hints: [],
  trips: [{ ref: 't1', title: 'Japan', start_date: '2027-03-01', end_date: '2027-03-14', destinations: [] }],
  ...over,
});
const pdf = { fileName: 'ticket.pdf', kind: 'pdf' as const, mimeType: 'application/pdf', data: Buffer.from('%PDF') };

describe('MailReadService.read', () => {
  it('answers ai_disabled without a configured model', async () => {
    resolve.mockResolvedValue(null);
    const reading = await service.read(input(), 1, '2026-11-13');
    expect(reading).toMatchObject({ outcome: 'ai_disabled', bookings: [], imageOnly: false });
    expect(reading.documentText).toContain('Booking ABC123');
  });

  it('reads a mail in one request with the trip list and the bookings root', async () => {
    extract.mockResolvedValue([{ kind: 'new_booking', reservations: [flight], trip_ref: 't1', trip_confidence: 0.8 }]);
    const reading = await service.read(input({ attachments: [pdf], hints: [{ type: 'flight' }] }), 1, '2026-11-13');

    expect(extract).toHaveBeenCalledTimes(1);
    const sent = extract.mock.calls[0][0];
    expect(sent).toMatchObject({ rootKey: 'bookings', model: 'm', file: undefined, pageImages: [] });
    expect(sent.prompt).toContain('t1: "Japan"');
    expect(sent.text).toContain('<attachment name="ticket.pdf">\nTicket ABC123');
    expect(sent.text).toContain('<attachment name="machine-readable data">');
    expect(reading.outcome).toBe('ok');
    expect(reading.bookings[0]).toMatchObject({ tripRef: 't1', tripConfidence: 0.8 });
    expect(reading.documentText).toContain('Ticket ABC123');
  });

  it('sends a scan’s pages as images to a model that reads them, and flags a mail read from images alone', async () => {
    readsImages.mockResolvedValue(true);
    extractText.mockResolvedValue('');
    renderPdfPages.mockResolvedValue([{ mimeType: 'image/png', data: Buffer.from('p1') }]);
    extract.mockResolvedValue([]);
    const reading = await service.read(input({ body: '', attachments: [pdf] }), 1, '2026-11-13');
    expect(extract.mock.calls[0][0].file).toEqual({ mimeType: 'image/png', data: Buffer.from('p1') });
    expect(reading).toMatchObject({ outcome: 'empty', imageOnly: true });
  });

  it('answers no_text for a mail with nothing to read', async () => {
    extractText.mockResolvedValue('');
    const reading = await service.read(input({ body: '', attachments: [pdf] }), 1, '2026-11-13');
    expect(reading.outcome).toBe('no_text');
    expect(extract).not.toHaveBeenCalled();
  });

  it('reports a spent allowance as its outcome and logs no content', async () => {
    const lines: string[] = [];
    for (const method of ['log', 'info', 'warn', 'error'] as const) {
      vi.spyOn(console, method).mockImplementation((...args: unknown[]) => {
        lines.push(args.map(String).join(' '));
      });
    }
    extract.mockRejectedValue(new LlmRequestError('gate', 429, 'QUOTA_SPENT'));
    const reading = await service.read(input(), 1, '2026-11-13');
    expect(reading.outcome).toBe('quota_exhausted');
    expect(lines.join(' | ')).toContain('Mail read failed');
    expect(lines.join(' | ')).not.toContain('ABC123');
  });

  it('reads through the local router without a trip choice', async () => {
    resolve.mockResolvedValue({ provider: 'local', model: 'qwen', vision: 'off' });
    routeExtraction.mockResolvedValue({ kiItems: [flight], warnings: [], outcome: 'ok' });
    const reading = await service.read(input(), 1, '2026-11-13');
    expect(createLlmClient).not.toHaveBeenCalled();
    expect(reading.bookings).toEqual([
      {
        kind: 'new_booking',
        reservations: [flight],
        tripRef: null,
        tripConfidence: null,
        uncertainFields: [],
        suggestedNewTrip: null,
      },
    ]);

    routeExtraction.mockResolvedValue({ kiItems: [], warnings: [], outcome: 'provider_error' });
    expect((await service.read(input(), 1, '2026-11-13')).outcome).toBe('provider_error');
  });

  it('reads a photo-only mail through the local router’s image path', async () => {
    resolve.mockResolvedValue({ provider: 'local', model: 'qwen', vision: 'on' });
    readsImages.mockResolvedValue(true);
    routeImageExtraction.mockResolvedValue({ kiItems: [], warnings: [], outcome: 'empty' });
    const photo = { fileName: 'a.png', kind: 'png' as const, mimeType: 'image/png', data: Buffer.from('png') };
    const reading = await service.read(input({ body: '', attachments: [photo] }), 1, '2026-11-13');
    expect(routeImageExtraction).toHaveBeenCalledTimes(1);
    expect(reading.outcome).toBe('empty');
  });
});

describe('MailReadService helpers', () => {
  it('walks a mail and refuses bytes that are none', () => {
    expect(service.walk(Buffer.from('not a mail at all'))).toBeNull();
    const walked = service.walk(Buffer.from('From: a@b.c\r\nSubject: Fwd: Hotel\r\n\r\nYour booking 123'));
    expect(walked?.subject).toBe('Hotel');
  });

  it('asks the parse service whether AI is available', async () => {
    expect(await service.isAvailable(4)).toBe(true);
    expect(isAvailable).toHaveBeenCalledWith(4);
  });
});
