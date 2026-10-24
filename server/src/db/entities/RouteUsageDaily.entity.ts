import { EntityRepositoryType, type Opt, PrimaryKeyProp, defineEntity, p } from '@mikro-orm/core';
import { RouteUsageDailyRepository } from '../repositories/RouteUsageDaily.repository';

export class RouteUsageDaily {
  [EntityRepositoryType]?: RouteUsageDailyRepository;
  [PrimaryKeyProp]?: ['day', 'profile', 'surface', 'self_hosted'];
  day!: string;
  profile!: string;
  surface!: string;
  self_hosted!: number;
  requests: number & Opt = 0;
  waypoints: number & Opt = 0;
  km!: number & Opt;
  failed: number & Opt = 0;
}

export const RouteUsageDailySchema = defineEntity({
  class: RouteUsageDaily,
  repository: () => RouteUsageDailyRepository,
  properties: {
    day: p.text().primary().index('idx_route_usage_day'),
    profile: p.text().primary(),
    surface: p.text().primary(),
    self_hosted: p.integer().primary(),
    requests: p.integer().default(0),
    waypoints: p.integer().default(0),
    km: p.double().defaultRaw(`0`),
    failed: p.integer().default(0),
  },
});
