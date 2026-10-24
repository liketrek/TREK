import { planRepositories, readCompilerOptions, type MethodPlan } from '../../../../scripts/pg-probe/arg-samples';
import { withTransferSamples } from '../../../../scripts/pg-probe/transfer-samples';
import { NATIVE_DOMAINS } from '../../../../src/db/repositories/_shared/transfer-native-domains';
import { travelTransfer } from '@trek/shared';

import path from 'node:path';
import { beforeAll, describe, expect, it } from 'vitest';

let original: MethodPlan[];
let plans: MethodPlan[];
const args = (method: string): unknown[] => {
  const plan = plans.find((entry) => entry.method === method);
  if (!plan || !('args' in plan)) throw new Error(`Missing sample: ${method}`);
  return plan.args;
};

beforeAll(() => {
  const root = path.resolve(__dirname, '../../../..');
  original = planRepositories(
    [path.join(root, 'src/db/repositories/TravelTransferOperations.repository.ts')],
    readCompilerOptions(path.join(root, 'tsconfig.json')),
    root,
  );
  plans = withTransferSamples(original);
});

describe('transfer repository Postgres samples', () => {
  it('keeps every real method and supplies JSON that passes the storage contract', () => {
    expect(plans.map((plan) => plan.method)).toEqual(original.map((plan) => plan.method));
    expect(travelTransfer.graphSchema.safeParse(args('saveGraph')[2]).success).toBe(true);
    const rows = args('unprojectedDomain')[1];
    expect(rows).toEqual({
      ...Object.fromEntries(NATIVE_DOMAINS.map((entry) => [entry.table, []])),
      trips: [{ id: 1 }],
    });
  });

  it('pairs real table metadata with nonempty column values and scoped keys', () => {
    const domain = NATIVE_DOMAINS.find((entry) => entry.table === 'days');
    expect(args('nativeInsert')).toEqual([domain, { trip_id: 1, day_number: 1 }]);
    expect(args('updateMapped')).toEqual([domain, { id: 1 }, { day_number: 2 }]);
    expect(args('deleteMapped')).toEqual([domain, { id: 1 }]);
    expect(plans.find((plan) => plan.method === 'createTrip')).toBe(
      original.find((plan) => plan.method === 'createTrip'),
    );
  });

  it('refuses stale samples rather than silently dropping probe coverage', () => {
    expect(() => withTransferSamples(original.filter((plan) => plan.method !== 'nativeInsert'))).toThrow(
      'nativeInsert',
    );
    expect(() => withTransferSamples(original.map((plan) => ({ ...plan, className: 'OtherRepository' })))).toThrow(
      'stale',
    );
  });
});
