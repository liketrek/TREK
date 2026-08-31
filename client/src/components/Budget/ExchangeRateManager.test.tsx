import { http, HttpResponse } from 'msw';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { server } from '../../../tests/helpers/msw/server';
import { fireEvent, render, screen, waitFor } from '../../../tests/helpers/render';
import { resetAllStores } from '../../../tests/helpers/store';
import { budgetApi } from '../../api/client';
import ExchangeRateManager from './ExchangeRateManager';

const resolution = {
  trip_id: 1,
  trip_currency: 'EUR',
  item_currency: 'USD',
  exchange_rate: 1.25,
  source: 'global',
  source_version: 'global:2026-08-28',
  effective_date: '2026-08-28',
  fetched_at: '2026-08-28T00:00:00.000Z',
  stale: false,
};

describe('ExchangeRateManager', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    resetAllStores();
    server.use(
      http.get('/api/trips/1/exchange-rates', () => HttpResponse.json({ rates: [] })),
      http.get('/api/trips/1/exchange-rates/resolve', () => HttpResponse.json(resolution))
    );
  });

  it('lets a read-only member inspect reciprocal Global context without write actions', async () => {
    render(<ExchangeRateManager tripId={1} tripCurrency="EUR" usedCurrencies={['USD']} canEdit={false} />);

    const rate = await screen.findByDisplayValue('0.8');
    expect(rate).toBeDisabled();
    expect(screen.getByText(/Source: global rate/)).toBeInTheDocument();
    expect(screen.getByText(/Inverse: 1 EUR = 1.25 USD/)).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Save default' })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Preview changes' })).not.toBeInTheDocument();
  });

  it('writes the reciprocal stored/API orientation when an editor saves a Trip default', async () => {
    let body: unknown;
    server.use(
      http.put('/api/trips/1/exchange-rates/USD', async ({ request }) => {
        body = await request.json();
        return HttpResponse.json({ rate: { currency: 'USD', exchange_rate: 2 } });
      })
    );
    render(<ExchangeRateManager tripId={1} tripCurrency="EUR" usedCurrencies={['USD']} canEdit />);

    const rate = await screen.findByDisplayValue('0.8');
    fireEvent.change(rate, { target: { value: '0.5' } });
    fireEvent.click(screen.getByRole('button', { name: 'Save default' }));

    await waitFor(() => expect(body).toEqual({ exchange_rate: 2, note: null }));
  });

  it('previews, selectively applies, and deletes a saved Trip default', async () => {
    const { default: userEvent } = await import('@testing-library/user-event');
    const user = userEvent.setup();
    const saved = {
      trip_id: 1,
      currency: 'USD',
      exchange_rate: 1.25,
      effective_date: null,
      source_version: 'trip:1:USD:v1',
      set_at: '2026-08-28T02:00:00.000Z',
      set_by_user_id: 1,
      note: 'card rate',
    };
    const preview = {
      preview_id: 'preview-1',
      currency: 'USD',
      rows: [
        {
          type: 'expense' as const,
          id: 7,
          amount: 100,
          source: 'global',
          old_exchange_rate: 1.2,
          new_exchange_rate: 1.25,
          old_trip_value: 83.333,
          new_trip_value: 80,
          trip_value_delta: -3.333,
          selected: true,
        },
        {
          type: 'settlement' as const,
          id: 8,
          amount: 20,
          source: 'explicit',
          old_exchange_rate: 1.1,
          new_exchange_rate: 1.25,
          old_trip_value: 18.182,
          new_trip_value: 16,
          trip_value_delta: -2.182,
          selected: false,
        },
      ],
    };
    const previewSpy = vi.spyOn(budgetApi, 'previewExchangeRate').mockResolvedValue(preview);
    const applySpy = vi.spyOn(budgetApi, 'applyExchangeRate').mockResolvedValue({ updated: 2 });
    const deleteSpy = vi.spyOn(budgetApi, 'deleteExchangeRate').mockResolvedValue({ success: true });
    const onChanged = vi.fn();
    server.use(
      http.get('/api/trips/1/exchange-rates', () => HttpResponse.json({ rates: [saved] })),
      http.get('/api/trips/1/exchange-rates/resolve', () =>
        HttpResponse.json({
          ...resolution,
          source: 'trip',
          source_version: saved.source_version,
          fetched_at: saved.set_at,
        })
      )
    );
    render(
      <ExchangeRateManager tripId={1} tripCurrency="EUR" usedCurrencies={['USD']} canEdit onChanged={onChanged} />
    );

    expect((await screen.findAllByText(/card rate/)).length).toBeGreaterThanOrEqual(2);
    await user.click(screen.getByRole('button', { name: 'Preview changes' }));
    await waitFor(() => expect(previewSpy).toHaveBeenCalledWith(1, 'USD', 1.25, 'card rate'));
    expect(await screen.findByText(/Expense #7/)).toBeInTheDocument();
    expect(screen.getByText(/Payment #8/)).toBeInTheDocument();
    const selections = screen.getAllByRole('checkbox');
    expect(selections[0]).toBeChecked();
    expect(selections[1]).not.toBeChecked();
    await user.click(selections[1]);
    await user.click(screen.getByRole('button', { name: 'Apply to 2 item(s)' }));

    await waitFor(() =>
      expect(applySpy).toHaveBeenCalledWith(1, 'USD', 'preview-1', [
        { type: 'expense', id: 7 },
        { type: 'settlement', id: 8 },
      ])
    );
    await user.click(await screen.findByRole('button', { name: 'Delete' }));
    await waitFor(() => expect(deleteSpy).toHaveBeenCalledWith(1, 'USD'));
    expect(onChanged).toHaveBeenCalled();
  });

  it('shows stale and unavailable resolution states', async () => {
    const { rerender } = render(
      <ExchangeRateManager tripId={1} tripCurrency="EUR" usedCurrencies={['USD']} canEdit={false} />
    );
    server.use(
      http.get('/api/trips/2/exchange-rates', () => HttpResponse.json({ rates: [] })),
      http.get('/api/trips/2/exchange-rates/resolve', () =>
        HttpResponse.json({ ...resolution, trip_id: 2, stale: true })
      )
    );
    rerender(<ExchangeRateManager tripId={2} tripCurrency="EUR" usedCurrencies={['USD']} canEdit={false} />);
    expect(await screen.findByText(/Stale provider snapshot/)).toBeInTheDocument();

    server.use(
      http.get('/api/trips/3/exchange-rates', () => HttpResponse.json({ rates: [] })),
      http.get('/api/trips/3/exchange-rates/resolve', () => HttpResponse.json({}, { status: 404 }))
    );
    rerender(<ExchangeRateManager tripId={3} tripCurrency="EUR" usedCurrencies={['USD']} canEdit />);
    expect(await screen.findByText(/Enter a manual rate to save/)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Save default' })).toBeDisabled();
  });
});
