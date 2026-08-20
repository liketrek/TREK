import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import type { INestApplication } from '@nestjs/common';
import { buildApp } from '../../src/bootstrap';

/**
 * A book is bigger than a form post (#1973).
 *
 * The API's body ceiling is a hundred kilobytes, which is right for an
 * interface of forms and ids and wrong for a photo book. A Studio document is
 * sent WHOLE on every autosave, on purpose, and a fortnight's journey passes a
 * hundred kilobytes before anybody asks for road geometry: an Iceland book with
 * roads measured 101KB against a 100KB limit.
 *
 * What that produced was not an error anybody could act on. The save failed
 * with a 413, the editor said "not saved", and nothing anywhere said why —
 * which is the same shape of bug as the mood mark that could not be stored, and
 * it deserves the same kind of guard.
 */

describe('the size of a book', () => {
  let app: INestApplication;

  beforeAll(async () => {
    app = await buildApp();
    await app.init();
  });

  afterAll(async () => {
    await app?.close();
  });

  /** A body far past the ordinary ceiling, shaped like a save. */
  const bigBody = () => ({
    title: 'A long journey',
    baseVersion: 1,
    document: { version: 1, title: 'A long journey', spreads: [], filler: 'x'.repeat(400_000) },
  });

  it('takes a document larger than the API-wide limit rather than refusing it', async () => {
    const res = await request(app.getHttpServer())
      .put('/api/journeys/1/book')
      .send(bigBody());

    /*
     * Unauthenticated, so 401 is the expected answer and the point of the test
     * is what it is NOT: a 413 means the body never reached the router, which
     * is exactly the failure being guarded against.
     */
    expect(res.status).not.toBe(413);
  });

  it('keeps the tighter limit on every other route', async () => {
    const res = await request(app.getHttpServer())
      .post('/api/journeys')
      .send({ title: 'x'.repeat(400_000) });

    expect(res.status).toBe(413);
  });
});
