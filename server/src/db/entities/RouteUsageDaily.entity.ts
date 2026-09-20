import { type Opt, PrimaryKeyProp, defineEntity, p, EntityRepository } from '@mikro-orm/core';

export class RouteUsageDaily {
  [PrimaryKeyProp]?: ['day', 'profile', 'surface', 'selfHosted'];
  day!: string;
  profile!: string;
  surface!: string;
  selfHosted!: number;
  requests: number & Opt = 0;
  waypoints: number & Opt = 0;
  km!: number;
  failed: number & Opt = 0;
}

export class RouteUsageDailyRepository extends EntityRepository<RouteUsageDaily> {}

export const RouteUsageDailySchema = defineEntity({
  class: RouteUsageDaily,
  repository: () => RouteUsageDailyRepository,
  properties: {
    day: p.text().primary().index('idx_route_usage_day'),
    profile: p.text().primary(),
    surface: p.text().primary(),
    selfHosted: p.integer().primary(),
    requests: p.integer(),
    waypoints: p.integer(),
    km: p.double().default(0),
    failed: p.integer(),
  },
});
