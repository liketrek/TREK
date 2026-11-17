// FE-MAILINGEST-API-001
import { describe, expect, it, vi } from 'vitest';

vi.mock('./client', () => ({
  default: { get: vi.fn(), post: vi.fn(), patch: vi.fn(), put: vi.fn(), delete: vi.fn() },
  postMultipart: vi.fn(async () => ({ duplicate: false })),
}));

import apiClient, { postMultipart } from './client';
import { mailIngestApi } from './mailIngest';

describe('mailIngestApi.upload', () => {
  it('FE-MAILINGEST-API-001: sends the .eml as a multipart form, never through the JSON post', async () => {
    const file = new File(['From: a@b.c\r\n\r\nhi'], 'booking.eml', { type: 'message/rfc822' });
    expect(await mailIngestApi.upload(file)).toEqual({ duplicate: false });
    const [url, form] = vi.mocked(postMultipart).mock.calls[0];
    expect(url).toBe('/mail-ingest/upload');
    expect((form as FormData).get('file')).toBe(file);
    expect(apiClient.post).not.toHaveBeenCalled();
  });
});
