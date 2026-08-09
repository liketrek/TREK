import { PluginController, PluginMethod } from '../plugins/host/rpc-kit/decorators';
import { num } from '../plugins/host/rpc-params';
import { WeatherService } from './weather.service';

/**
 * The weather surface a plugin may reach (#plugins). Tenant-free: a host-cached
 * forecast by coordinates plus an optional date, so no user and no trip.
 *
 * The language is pinned to 'en' exactly as the deps factory pinned it. A plugin
 * has no locale of its own, and the wire contract never carried one.
 */
@PluginController()
export class WeatherRpc {
  constructor(private readonly weather: WeatherService) {}

  @PluginMethod('weather.get', { permission: 'weather:read' })
  get(params: Record<string, unknown>): unknown {
    const lat = num(params.lat, 'lat');
    const lng = num(params.lng, 'lng');
    return this.weather.get(String(lat), String(lng), typeof params.date === 'string' ? params.date : undefined, 'en');
  }
}
