import { describe, expect, it, vi } from 'vitest';

const exchangeRates = vi.hoisted(() => ({
  applyTripExchangeRateUpdate: vi.fn(() => ({ rate: { currency: 'USD' }, updated: [] })),
  deleteTripExchangeRate: vi.fn(() => true),
  getGlobalRateSnapshot: vi.fn(async () => ({ base_currency: 'EUR', rates: { EUR: 1 } })),
  listTripExchangeRates: vi.fn(() => [{ currency: 'USD', exchange_rate: 1.2 }]),
  previewTripExchangeRateUpdate: vi.fn(() => ({ preview_id: 'preview-1', rows: [] })),
  resolveExchangeRate: vi.fn(async () => ({ quote_id: 'quote-1', exchange_rate: 1.2 })),
  setTripExchangeRate: vi.fn(() => ({ currency: 'USD', exchange_rate: 1.2 })),
}));

vi.mock('../../../src/services/exchangeRateService', () => exchangeRates);
vi.mock('../../../src/services/auditLog', () => ({ getClientIp: vi.fn(() => '127.0.0.1'), writeAudit: vi.fn() }));
vi.mock('../../../src/nest/budget/budget.service', () => ({ BudgetService: class {} }));

import { GlobalExchangeRateController, TripExchangeRateController } from '../../../src/nest/budget/exchange-rate.controller';

const user = { id: 5 } as any;
const request = {} as any;

describe('exchange-rate controllers', () => {
  it('membership-gates rate reads and resolves an immutable quote', async () => {
    const budget = {
      verifyTripAccess: vi.fn(() => ({ id: 1 })),
      canEdit: vi.fn(() => true),
      broadcast: vi.fn(),
    } as any;
    const controller = new TripExchangeRateController(budget);

    expect(controller.list(user, '1')).toEqual({ rates: [{ currency: 'USD', exchange_rate: 1.2 }] });
    await expect(controller.resolve(user, '1', 'USD')).resolves.toMatchObject({ quote_id: 'quote-1' });
    expect(budget.verifyTripAccess).toHaveBeenCalledWith('1', 5);
  });

  it('requires budget_edit before rate writes and broadcasts successful changes', () => {
    const deniedBudget = {
      verifyTripAccess: vi.fn(() => ({ id: 1 })),
      canEdit: vi.fn(() => false),
      broadcast: vi.fn(),
    } as any;
    expect(() => new TripExchangeRateController(deniedBudget).set(
      user, '1', 'USD', { exchange_rate: 1.2 }, undefined, request,
    )).toThrow(expect.objectContaining({ status: 403 }));

    const budget = { ...deniedBudget, canEdit: vi.fn(() => true), broadcast: vi.fn() } as any;
    const result = new TripExchangeRateController(budget).set(
      user, '1', 'USD', { exchange_rate: 1.2, note: 'bank' }, 'socket-1', request,
    );
    expect(result).toEqual({ rate: { currency: 'USD', exchange_rate: 1.2 } });
    expect(exchangeRates.setTripExchangeRate).toHaveBeenCalledWith('1', 'USD', 1.2, 5, 'bank');
    expect(budget.broadcast).toHaveBeenCalledWith(
      '1', 'budget:exchange-rates-updated', { rate: { currency: 'USD', exchange_rate: 1.2 } }, 'socket-1',
    );
  });

  it('broadcasts batch apply results and preserves a 409 service conflict', () => {
    const budget = {
      verifyTripAccess: vi.fn(() => ({ id: 1 })),
      canEdit: vi.fn(() => true),
      broadcast: vi.fn(),
    } as any;
    const controller = new TripExchangeRateController(budget);
    const applied = controller.apply(
      user, '1', 'USD', { preview_id: 'preview-1', selected: [] }, 'socket-1', request,
    );
    expect(applied).toMatchObject({ rate: { currency: 'USD' } });
    expect(budget.broadcast).toHaveBeenCalledWith('1', 'budget:exchange-rates-applied', applied, 'socket-1');

    const conflict = Object.assign(new Error('changed'), { status: 409 });
    exchangeRates.applyTripExchangeRateUpdate.mockImplementationOnce(() => { throw conflict; });
    expect(() => controller.apply(
      user, '1', 'USD', { preview_id: 'preview-2', selected: [] }, undefined, request,
    )).toThrow(expect.objectContaining({ status: 409 }));
  });

  it('returns 503 when no durable global snapshot is available', async () => {
    exchangeRates.getGlobalRateSnapshot.mockResolvedValueOnce(null as any);
    await expect(new GlobalExchangeRateController().get('EUR'))
      .rejects.toThrow(expect.objectContaining({ status: 503 }));
  });
});
