import request from 'supertest';
import { expect } from 'vitest';
import type { Server } from 'http';

export interface ParityRequest {
  method?: 'get' | 'post' | 'put' | 'patch' | 'delete';
  path: string;
  query?: Record<string, string>;
  body?: unknown;
}

/**
 * Reusable Nest-vs-Express parity harness.
 *
 * Fires the same HTTP request at the legacy Express app and the migrated Nest app
 * and asserts the response is client-identical — same status code and same JSON
 * body. With the underlying service mocked identically for both, any difference is
 * purely framework-layer (routing, validation, error envelope), which is exactly
 * what a migration must not change. Use one assertion per migrated route/case.
 */
export async function expectParity(
  expressServer: Server | Express.Application,
  nestServer: Server,
  req: ParityRequest,
): Promise<void> {
  const fire = (target: Server | Express.Application) => {
    const method = req.method ?? 'get';
    let r = request(target as never)[method](req.path);
    if (req.query) r = r.query(req.query);
    if (req.body !== undefined) r = r.send(req.body as object);
    return r;
  };

  const [ex, ne] = await Promise.all([fire(expressServer), fire(nestServer)]);

  const label = `${(req.method ?? 'GET').toUpperCase()} ${req.path}`;
  expect(ne.status, `${label}: status mismatch`).toBe(ex.status);
  expect(ne.body, `${label}: body mismatch`).toEqual(ex.body);
}
