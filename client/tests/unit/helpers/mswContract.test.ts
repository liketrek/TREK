import { budgetCreateItemRequestSchema, tagSchema } from '@trek/shared';
import { HttpResponse } from 'msw';
import { describe, expect, it } from 'vitest';
import { z } from 'zod';
import { contractHandler } from '../../helpers/msw/contract';
import { server } from '../../helpers/msw/server';

// A tag as a drifted factory might build it: a string id and no user.
const offContract = { id: 'one', name: 'Food' } as unknown as z.input<typeof tagSchema>;

const url = (path: string) => `${location.origin}${path}`;

async function send(method: string, path: string, body?: unknown) {
  const res = await fetch(url(path), {
    method,
    headers: body === undefined ? undefined : { 'Content-Type': 'application/json' },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  return { status: res.status, json: (await res.json()) as Record<string, unknown> };
}

describe('contractHandler', () => {
  it('FE-MSW-CONTRACT-001: hands the resolver the parsed body and answers its result as JSON', async () => {
    server.use(
      contractHandler(
        'post',
        '/api/contract-probe',
        { request: budgetCreateItemRequestSchema, response: z.object({ name: z.string() }) },
        ({ body }) => ({ name: body.name })
      )
    );
    expect(await send('POST', '/api/contract-probe', { name: 'Taxi' })).toEqual({
      status: 200,
      json: { name: 'Taxi' },
    });
  });

  it('FE-MSW-CONTRACT-002: refuses a body the contract does not allow with a 400, as the server does', async () => {
    server.use(contractHandler('post', '/api/contract-probe', { request: budgetCreateItemRequestSchema }, () => ({})));
    const res = await send('POST', '/api/contract-probe', { name: '' });
    expect(res.status).toBe(400);
    expect(res.json.issues).toEqual([expect.stringMatching(/^name: /)]);
  });

  it('FE-MSW-CONTRACT-003: a mock that answers outside the contract fails instead of passing it on', async () => {
    server.use(
      contractHandler('get', '/api/contract-probe', { response: z.object({ tag: tagSchema }) }, () => ({
        tag: offContract,
      }))
    );
    expect((await fetch(url('/api/contract-probe'))).status).toBe(500);
  });

  it('FE-MSW-CONTRACT-004: a resolver may still answer a status of its own, unchecked', async () => {
    server.use(
      contractHandler('get', '/api/contract-probe', { response: z.object({ tag: tagSchema }) }, () =>
        HttpResponse.json({ error: 'gone' }, { status: 404 })
      )
    );
    expect(await send('GET', '/api/contract-probe')).toEqual({ status: 404, json: { error: 'gone' } });
  });
});

// Each default handler held to a contract, called the way the client calls it. A
// factory or handler that drifts from @trek/shared fails here by name instead of
// as a 500 deep inside some component test.
describe('default handlers answer inside the @trek/shared contract', () => {
  const calls: [string, string, unknown?][] = [
    ['GET', '/api/trips/1/budget'],
    ['POST', '/api/trips/1/budget', { name: 'Taxi', total_price: 12, member_ids: [1] }],
    ['PUT', '/api/trips/1/budget/5', { name: 'Taxi', total_price: 14 }],
    ['PUT', '/api/trips/1/budget/5/members', { user_ids: [1, 2] }],
    ['PUT', '/api/trips/1/budget/5/members/2/paid', { paid: true }],
    ['GET', '/api/trips/1/places'],
    ['POST', '/api/trips/1/places', { name: 'Louvre', lat: 48.86, lng: 2.33 }],
    ['PUT', '/api/trips/1/places/3', { name: 'Louvre' }],
    ['POST', '/api/trips/1/places/3/image'],
    ['GET', '/api/trips/1/todo'],
    ['POST', '/api/trips/1/todo', { name: 'Book train' }],
    ['PUT', '/api/trips/1/todo/4', { checked: true }],
    ['GET', '/api/tags'],
    ['POST', '/api/tags', { name: 'Food', color: '#ff0000' }],
    ['GET', '/api/categories'],
    ['POST', '/api/categories', { name: 'Museum', color: '#123456', icon: 'landmark' }],
    ['GET', '/api/trips/1/days/2/notes'],
    ['POST', '/api/trips/1/days/2/notes', { text: 'Bring cash' }],
    ['PUT', '/api/trips/1/days/2/notes/9', { text: 'Bring more cash' }],
    ['PUT', '/api/trips/1/days/2', { title: 'Arrival' }],
    ['GET', '/api/trips/1/packing'],
    ['POST', '/api/trips/1/packing', { name: 'Socks', checked: false }],
    ['PUT', '/api/trips/1/packing/6', { checked: true }],
    ['GET', '/api/trips/1/reservations'],
    ['POST', '/api/trips/1/reservations', { title: 'Dinner', type: 'restaurant' }],
    ['PUT', '/api/trips/1/reservations/8', { title: 'Late dinner' }],
    ['POST', '/api/trips/1/days/2/assignments', { place_id: 3 }],
    ['PUT', '/api/trips/1/days/2/assignments/reorder', { orderedIds: [1, 2] }],
    ['PUT', '/api/trips/1/assignments/7/move', { new_day_id: 3, order_index: 0 }],
  ];

  it.each(calls)('FE-MSW-CONTRACT-005: %s %s', async (method, path, body) => {
    const res = await send(method, path, body);
    expect(res.json).not.toHaveProperty('issues');
    expect(res.status).toBe(200);
  });

  it('FE-MSW-CONTRACT-007: a todo item answers checked as 0/1 like the server stores it', async () => {
    const res = await send('PUT', '/api/trips/1/todo/4', { checked: true });
    expect((res.json.item as { checked: unknown }).checked).toBe(1);
  });

  it('FE-MSW-CONTRACT-006: a packing item answers checked as 0/1 like the server stores it', async () => {
    const res = await send('PUT', '/api/trips/1/packing/6', { checked: true });
    expect((res.json.item as { checked: unknown }).checked).toBe(1);
  });
});
