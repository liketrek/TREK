import { PluginController, PluginMethod } from '../plugins/host/rpc-kit/decorators';
import { str } from '../plugins/host/rpc-params';
import { ExchangeRatesService } from './exchange-rates.service';

/**
 * The exchange-rate surface a plugin may reach (#plugins). Tenant-free like
 * weather: a cached upstream feed with no user and no trip behind it, useful to any
 * plugin that shows or converts money.
 *
 * Note this is NOT gated on the Costs addon. It carries no budget data, and the
 * router never gated it either.
 */
@PluginController()
export class ExchangeRatesRpc {
  constructor(private readonly exchangeRates: ExchangeRatesService) {}

  @PluginMethod('rates.get', { permission: 'rates:read' })
  get(params: Record<string, unknown>): unknown {
    return this.exchangeRates.getRates(str(params.base, 'base'));
  }
}
