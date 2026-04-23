import { describe, it, expect } from 'vitest';
import type { Request } from 'express';

import { ingressPath } from '../../../src/middleware/ingress';

function mockReq(headers: Record<string, string> = {}): Request {
  return {
    header(name: string) {
      return headers[name] ?? headers[name.toLowerCase()];
    },
  } as unknown as Request;
}

describe('ingressPath', () => {
  it('returns null when X-Ingress-Path is absent (standalone deployment)', () => {
    expect(ingressPath(mockReq())).toBeNull();
  });

  it('returns null when header value does not match the hassio_ingress prefix', () => {
    expect(ingressPath(mockReq({ 'X-Ingress-Path': '/some/other/path' }))).toBeNull();
  });

  it('returns the prefix without trailing slash for a valid Ingress request', () => {
    expect(ingressPath(mockReq({ 'X-Ingress-Path': '/api/hassio_ingress/abc123/' }))).toBe(
      '/api/hassio_ingress/abc123',
    );
  });

  it('accepts the prefix even without a trailing slash', () => {
    expect(ingressPath(mockReq({ 'X-Ingress-Path': '/api/hassio_ingress/abc123' }))).toBe(
      '/api/hassio_ingress/abc123',
    );
  });
});
