import { http, HttpResponse } from 'msw';
import { buildBudgetItem } from '../../factories';

export const budgetHandlers = [
  http.get('/api/trips/:id/exchange-rates/resolve', ({ params, request }) => {
    const currency = new URL(request.url).searchParams.get('currency')?.toUpperCase() || 'EUR';
    return HttpResponse.json({
      trip_id: Number(params.id),
      trip_currency: 'EUR',
      item_currency: currency,
      exchange_rate: currency === 'USD' ? 1.25 : 1,
      source: currency === 'EUR' ? 'identity' : 'global',
      source_version: `test:${currency}`,
      effective_date: currency === 'EUR' ? null : '2026-01-01',
      fetched_at: currency === 'EUR' ? null : '2026-01-01T00:00:00.000Z',
      stale: false,
    });
  }),

  http.get('/api/trips/:id/budget', ({ params }) => {
    return HttpResponse.json({
      items: [buildBudgetItem({ trip_id: Number(params.id) })],
    });
  }),

  http.post('/api/trips/:id/budget', async ({ params, request }) => {
    const body = await request.json() as Record<string, unknown>;
    const item = buildBudgetItem({ trip_id: Number(params.id), ...body });
    return HttpResponse.json({ item });
  }),

  http.put('/api/trips/:id/budget/:itemId', async ({ params, request }) => {
    const body = await request.json() as Record<string, unknown>;
    const item = buildBudgetItem({ id: Number(params.itemId), trip_id: Number(params.id), ...body });
    return HttpResponse.json({ item });
  }),

  http.delete('/api/trips/:id/budget/:itemId', () => {
    return HttpResponse.json({ success: true });
  }),

  http.put('/api/trips/:id/budget/:itemId/members', async ({ params, request }) => {
    const body = await request.json() as { user_ids: number[] };
    const members = body.user_ids.map(uid => ({ user_id: uid, paid: 0, username: `user${uid}` }));
    const item = buildBudgetItem({ id: Number(params.itemId), trip_id: Number(params.id), persons: body.user_ids.length, members });
    return HttpResponse.json({ members, item });
  }),

  http.put('/api/trips/:id/budget/:itemId/members/:userId/paid', async ({ params, request }) => {
    const body = await request.json() as { paid: boolean };
    return HttpResponse.json({ success: true, paid: body.paid });
  }),
];
