import { http, HttpResponse } from 'msw';

const effectiveDate = '2026-08-07';

export const exchangeRateHandlers = [
  http.get('/api/exchange-rates', ({ request }) => {
    const base = new URL(request.url).searchParams.get('base')?.toUpperCase() || 'EUR';
    return HttpResponse.json({
      base_currency: base,
      rates: { [base]: 1, EUR: base === 'EUR' ? 1 : 0.8, USD: 1.2, JPY: 170 },
      source_version: `test-global:${effectiveDate}:${base}`,
      effective_date: effectiveDate,
      fetched_at: '2026-08-08T00:00:00.000Z',
      stale: false,
    });
  }),

  http.get('/api/trips/:id/exchange-rates', () => HttpResponse.json({ rates: [] })),

  http.get('/api/trips/:id/exchange-rates/resolve', ({ params, request }) => {
    const currency = new URL(request.url).searchParams.get('currency')?.toUpperCase() || 'EUR';
    const rate = currency === 'EUR' ? 1 : currency === 'USD' ? 1.2 : currency === 'JPY' ? 170 : 0.85;
    return HttpResponse.json({
      trip_id: Number(params.id),
      trip_currency: 'EUR',
      item_currency: currency,
      exchange_rate: rate,
      source: currency === 'EUR' ? 'identity' : 'global',
      source_version: currency === 'EUR' ? 'identity:EUR' : `test-global:${effectiveDate}:EUR`,
      effective_date: currency === 'EUR' ? null : effectiveDate,
      fetched_at: currency === 'EUR' ? null : '2026-08-08T00:00:00.000Z',
      stale: false,
    });
  }),

  http.put('/api/trips/:id/exchange-rates/:currency', async ({ params, request }) => {
    const body = (await request.json()) as { exchange_rate: number; note?: string | null };
    return HttpResponse.json({
      rate: {
        trip_id: Number(params.id),
        currency: String(params.currency).toUpperCase(),
        exchange_rate: body.exchange_rate,
        source_version: `test-trip:${String(params.currency).toUpperCase()}`,
        set_at: '2026-08-08T00:00:00.000Z',
        set_by_user_id: 1,
        note: body.note ?? null,
      },
    });
  }),

  http.delete('/api/trips/:id/exchange-rates/:currency', () => HttpResponse.json({ success: true })),

  http.post('/api/trips/:id/exchange-rates/:currency/preview', async ({ params, request }) => {
    const body = (await request.json()) as { exchange_rate: number };
    return HttpResponse.json({
      preview_id: `test-preview-${String(params.currency).toUpperCase()}`,
      trip_id: Number(params.id),
      currency: String(params.currency).toUpperCase(),
      exchange_rate: body.exchange_rate,
      rows: [],
    });
  }),

  http.post('/api/trips/:id/exchange-rates/:currency/apply', async ({ params, request }) => {
    const body = (await request.json()) as { selected: Array<{ type: string; id: number }> };
    return HttpResponse.json({
      rate: { trip_id: Number(params.id), currency: String(params.currency).toUpperCase() },
      updated: body.selected,
    });
  }),
];
