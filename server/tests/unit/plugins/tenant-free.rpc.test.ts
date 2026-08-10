/**
 * The three tenant-free plugin methods: weather, categories and exchange rates.
 *
 * They are grouped because what matters about them is the same property, and it is
 * the one a migration could quietly lose: they carry no tenant data, so they work
 * with NO acting user. Everything else in the plugin surface refuses that.
 */
import { describe, it, expect, vi } from 'vitest';
import { expectRegisteredProvider } from '../../helpers/module-providers';
import { PluginRpcHost } from '../../../src/nest/plugins/host/rpc-host';
import { createTestPluginRegistry } from '../../../src/nest/plugins/host/rpc-kit/testing';
import { CategoriesRpc } from '../../../src/nest/categories/categories.rpc';
import { CategoriesModule } from '../../../src/nest/categories/categories.module';
import { WeatherRpc } from '../../../src/nest/weather/weather.rpc';
import { WeatherModule } from '../../../src/nest/weather/weather.module';
import { ExchangeRatesRpc } from '../../../src/nest/budget/exchange-rates.rpc';
import { BudgetModule } from '../../../src/nest/budget/budget.module';
import type { CategoriesService } from '../../../src/nest/categories/categories.service';
import type { WeatherService } from '../../../src/nest/weather/weather.service';
import type { ExchangeRatesService } from '../../../src/nest/budget/exchange-rates.service';
import type { RpcRequest, RpcError } from '../../../src/nest/plugins/protocol/envelope';
import { makeDeps } from '../../helpers/rpc-host-deps';

const req = (method: string, params: Record<string, unknown> = {}): RpcRequest => ({ k: 'req', id: 'x', method, params });

function build() {
  const categories = { list: vi.fn(() => [{ id: 1, name: 'Food' }]) } as unknown as CategoriesService & Record<string, ReturnType<typeof vi.fn>>;
  const weather = { get: vi.fn(async () => ({ temp: 20 })) } as unknown as WeatherService & Record<string, ReturnType<typeof vi.fn>>;
  const rates = { getRates: vi.fn(async (base: string) => ({ [base]: 1, USD: 1.08 })) } as unknown as ExchangeRatesService & Record<string, ReturnType<typeof vi.fn>>;
  const registry = createTestPluginRegistry([
    new CategoriesRpc(categories),
    new WeatherRpc(weather),
    new ExchangeRatesRpc(rates),
  ]);
  const host = (...grants: string[]) => new PluginRpcHost('p', new Set(grants), makeDeps(), registry);
  return { categories, weather, rates, host };
}

describe('tenant-free plugin methods', () => {
  it('TENANTFREE-001 weather.get and categories.list work without a user', async () => {
    const f = build();
    expect((await f.host('weather:read').dispatch(req('weather.get', { lat: 48, lng: 11 }), undefined)).ok).toBe(true);
    expect((await f.host('db:read:categories').dispatch(req('categories.list', {}), undefined)).ok).toBe(true);
  });

  it('TENANTFREE-002 rates.get works without a user and needs rates:read', async () => {
    const f = build();
    expect((await f.host('rates:read').dispatch(req('rates.get', { base: 'EUR' }), undefined)).ok).toBe(true);
    expect(f.rates.getRates).toHaveBeenCalledWith('EUR');
    const denied = (await f.host().dispatch(req('rates.get', { base: 'EUR' }), undefined)) as RpcError;
    expect(denied.error.code).toBe('PERMISSION_DENIED');
  });

  it('TENANTFREE-003 weather coordinates are coerced, and the language stays pinned to en', async () => {
    const f = build();
    // Numeric strings are accepted, as the wire contract has always allowed.
    await f.host('weather:read').dispatch(req('weather.get', { lat: '48.1', lng: '11.5', date: '2027-01-01' }), undefined);
    expect(f.weather.get).toHaveBeenCalledWith('48.1', '11.5', '2027-01-01', 'en');
  });

  it('TENANTFREE-004 a non-numeric coordinate is BAD_PARAMS', async () => {
    const res = (await build().host('weather:read').dispatch(req('weather.get', { lat: 'north', lng: 11 }), undefined)) as RpcError;
    expect(res.error.code).toBe('BAD_PARAMS');
    expect(res.error.message).toBe('lat must be a number');
  });

  it('TENANTFREE-005 a non-string base is BAD_PARAMS', async () => {
    const res = (await build().host('rates:read').dispatch(req('rates.get', { base: 42 }), undefined)) as RpcError;
    expect(res.error.code).toBe('BAD_PARAMS');
  });

  it('TENANTFREE-006 an absent date is passed through as undefined, not as a string', async () => {
    const f = build();
    await f.host('weather:read').dispatch(req('weather.get', { lat: 1, lng: 2 }), undefined);
    expect(f.weather.get).toHaveBeenCalledWith('1', '2', undefined, 'en');
  });

  it('TENANTFREE-007 each class is listed in its module providers', () => {
    expectRegisteredProvider(CategoriesModule, CategoriesRpc);
    expectRegisteredProvider(WeatherModule, WeatherRpc);
    expectRegisteredProvider(BudgetModule, ExchangeRatesRpc);
  });
});
