import type { RouteUsageEntry, RouteUsageSummaryResult } from '@trek/shared'
import { apiClient } from './client'

/**
 * Reports the routing counters this browser has tallied up.
 *
 * Fire and forget: it never throws and never blocks the route it is describing. A
 * failed report is a lost count, which is a far smaller problem than a map that waits
 * on a measurement.
 *
 * No client-side switch to check, unlike the shadow log. Counting is on unless an
 * operator turned it off, and that is a server setting the server enforces — a report
 * to a switched-off instance is answered with `recorded: false` and costs one request.
 */
export const routeUsageApi = {
  report: (entries: RouteUsageEntry[]): Promise<void> =>
    entries.length
      ? apiClient.post('/route-usage/report', { entries }).then(() => undefined)
      : Promise.resolve(),

  /** Admin only. The figures behind "could we host a router ourselves". */
  summary: (): Promise<RouteUsageSummaryResult> =>
    apiClient.get('/route-usage/summary').then(r => r.data),
}
