/**
 * Transfer rows have correlated dynamic table/column names, and their JSON is
 * refined by Zod. Type-only samples cannot express those constraints. Supply
 * typed valid arguments, never synthetic results or SQL/coverage exemptions.
 */
import type { TravelTransferOperationsRepository } from '../../src/db/repositories/TravelTransferOperations.repository';
import { NATIVE_DOMAINS } from '../../src/db/repositories/_shared/transfer-native-domains';
import type { MethodPlan } from './arg-samples';
import { travelTransfer } from '@trek/shared';

type Method = 'saveGraph' | 'unprojectedDomain' | 'nativeInsert' | 'updateMapped' | 'deleteMapped';
type Arguments = { [K in Method]: Parameters<TravelTransferOperationsRepository[K]> };

export function withTransferSamples(plans: MethodPlan[]): MethodPlan[] {
  const domain = NATIVE_DOMAINS.find((entry) => entry.table === 'days');
  if (!domain) throw new Error('pg-probe: transfer day mapping is missing');
  const samples: Arguments = {
    saveGraph: [
      1,
      1,
      { format: travelTransfer.FORMAT, trip: '1', revision: 'probe', complete: true, records: [], originals: [] },
      {},
    ],
    unprojectedDomain: [
      1,
      { ...Object.fromEntries(NATIVE_DOMAINS.map((entry) => [entry.table, []])), trips: [{ id: 1 }] },
    ],
    nativeInsert: [domain, { trip_id: 1, day_number: 1 }],
    updateMapped: [domain, { id: 1 }, { day_number: 2 }],
    deleteMapped: [domain, { id: 1 }],
  };
  const pending = new Set(Object.keys(samples));
  const result = plans.map((plan) => {
    if (
      plan.file !== 'src/db/repositories/TravelTransferOperations.repository.ts' ||
      plan.className !== 'TravelTransferOperationsRepository' ||
      !Object.hasOwn(samples, plan.method)
    )
      return plan;
    pending.delete(plan.method);
    return { className: plan.className, file: plan.file, method: plan.method, args: samples[plan.method as Method] };
  });
  if (pending.size) throw new Error(`pg-probe: stale transfer samples: ${[...pending].join(', ')}`);
  return result;
}
