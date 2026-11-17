/**
 * ConnectionReadClient: extraction on a connection lent as a reader (a ChatGPT
 * plan). What the reader is handed, which images go along, and what comes back.
 */
import { ConnectionReadClient } from '../../../../src/nest/llm-parse/clients/connection-read.client';
import { UnreadableLlmResponse, USER_TEXT } from '../../../../src/nest/llm-parse/clients/openai-compatible.client';
import type {
  LlmExtractionInput,
  StructuredReadAnswer,
  StructuredReadRequest,
} from '../../../../src/nest/llm-parse/llm-provider.interface';

import { describe, expect, it, vi } from 'vitest';

const SCHEMA = { type: 'object', properties: { reservations: { type: 'array' } } };
const base: LlmExtractionInput = { prompt: 'Read bookings.', jsonSchema: SCHEMA, model: 'gpt-x' };

function reader(answer: StructuredReadAnswer) {
  return vi.fn(async (_request: StructuredReadRequest) => answer);
}

describe('ConnectionReadClient', () => {
  it('CONNREAD-001: sends the prompt, the document text and the schema as the shape to fill', async () => {
    const read = reader({ filled: { reservations: [{ '@type': 'FlightReservation' }] } });
    const list = await new ConnectionReadClient(read).extract({ ...base, text: 'LH 1166 FRA-LIS' });
    expect(list).toEqual([{ '@type': 'FlightReservation' }]);
    const request = read.mock.calls[0][0];
    expect(request.system).toBe('Read bookings.');
    expect(request.text).toBe(`${USER_TEXT}\n\nLH 1166 FRA-LIS`);
    expect(request.shape).toMatchObject({ name: 'record_reservations', parameters: SCHEMA });
    expect(request.images).toEqual([]);
    expect(request.signal).toBeInstanceOf(AbortSignal);
  });

  it('CONNREAD-002: a photo and the scanned pages go as images, other files do not', async () => {
    const read = reader({ filled: { receipts: [{ total: 12 }] } });
    const list = await new ConnectionReadClient(read).extract({
      ...base,
      rootKey: 'receipts',
      userText: 'Read the receipt.',
      file: { mimeType: 'image/png', data: Buffer.from('page-1') },
      pageImages: [
        { mimeType: 'image/jpeg', data: Buffer.from('page-2') },
        { mimeType: 'image/heic', data: Buffer.from('no') },
        { mimeType: 'application/pdf', data: Buffer.from('no') },
      ],
    });
    expect(list).toEqual([{ total: 12 }]);
    const request = read.mock.calls[0][0];
    expect(request.text).toBe('Read the receipt.');
    expect(request.shape.name).toBe('record_receipts');
    expect(request.images).toEqual([
      { mimeType: 'image/png', data: Buffer.from('page-1').toString('base64') },
      { mimeType: 'image/jpeg', data: Buffer.from('page-2').toString('base64') },
    ]);
  });

  it('CONNREAD-003: a shape written as text is read, prose is an unreadable answer, an empty list is none found', async () => {
    const written = reader({ text: '```json\n{"reservations": [{"n": 3}]}\n```' });
    expect(await new ConnectionReadClient(written).extract(base)).toEqual([{ n: 3 }]);
    await expect(new ConnectionReadClient(reader({ text: 'No booking here.' })).extract(base)).rejects.toBeInstanceOf(
      UnreadableLlmResponse,
    );
    await expect(new ConnectionReadClient(reader({ text: '' })).extract(base)).rejects.toBeInstanceOf(
      UnreadableLlmResponse,
    );
    expect(await new ConnectionReadClient(reader({ filled: { reservations: [] } })).extract(base)).toEqual([]);
  });

  it('CONNREAD-004: a provider failure reaches the caller as it came', async () => {
    const failing = vi.fn(async () => {
      throw new Error('needs_reauth');
    });
    await expect(new ConnectionReadClient(failing).extract(base)).rejects.toThrow('needs_reauth');
  });
});
