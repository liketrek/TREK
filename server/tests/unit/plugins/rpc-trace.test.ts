/**
 * Every plugin RPC dispatch is its own unit of work: a correlation id the
 * whole dispatch runs under, and one log line per call. A refused call comes
 * back as `{ ok: false }` rather than a throw, so that is what the line says.
 */
import { currentCorrelation, type Correlation } from '../../../src/nest/common/request-correlation';
import { RpcRateLimiter, DEFAULT_RPC_LIMIT } from '../../../src/nest/plugins/host/rate-limit';
import type { PluginRpcHost } from '../../../src/nest/plugins/host/rpc-host';
import type { RpcRequest, RpcResponse, RpcError } from '../../../src/nest/plugins/protocol/envelope';
import { PluginSupervisor } from '../../../src/nest/plugins/supervisor/plugin-supervisor';
import { createSnapshotTestDb } from '../../helpers/db-mock';
import { createTestOrm, type TestOrm } from '../../helpers/test-orm';

import { describe, it, expect, vi, beforeAll, afterAll, beforeEach } from 'vitest';

const log = vi.hoisted(() => ({
  LOG_LEVEL: 'error',
  logInfo: vi.fn(),
  logDebug: vi.fn(),
  logWarn: vi.fn(),
  logError: vi.fn(),
}));
vi.mock('../../../src/nest/audit/audit-log.logger', () => log);

interface DispatchEntry {
  id: string;
  rpcHost: Pick<PluginRpcHost, 'dispatch'>;
  child: { send: (msg: unknown) => void } | null;
  rpcLimiter: RpcRateLimiter;
  invocations: Map<string, number | undefined>;
}
interface SupervisorPrivate {
  onMessage(sup: DispatchEntry, msg: RpcRequest): Promise<void>;
}

const testDb = createSnapshotTestDb();
let t: TestOrm;

beforeAll(async () => {
  t = await createTestOrm(testDb);
});
afterAll(async () => {
  await t.close();
  testDb.close();
});
beforeEach(() => {
  vi.clearAllMocks();
});

function makeSupervisor(answer: (req: RpcRequest) => RpcResponse | RpcError) {
  const seen: Array<Correlation | undefined> = [];
  const sent: unknown[] = [];
  const dispatch: PluginRpcHost['dispatch'] = async (req) => {
    seen.push(currentCorrelation());
    return answer(req);
  };
  const supervisor = new PluginSupervisor(
    () => ({ dispatch }) as unknown as PluginRpcHost,
    {},
    {},
    () => t.orm,
  ) as unknown as SupervisorPrivate;
  const sup: DispatchEntry = {
    id: 'weather-plugin',
    rpcHost: { dispatch },
    child: { send: (msg) => sent.push(msg) },
    rpcLimiter: new RpcRateLimiter(DEFAULT_RPC_LIMIT, Date.now()),
    invocations: new Map(),
  };
  return { supervisor, sup, seen, sent };
}

describe('plugin RPC tracing', () => {
  it('RPC-TRACE-001: a dispatch runs under its own rpc correlation and logs one ok line', async () => {
    const { supervisor, sup, seen, sent } = makeSupervisor((req) => ({ k: 'res', id: req.id, ok: true, result: 1 }));
    await supervisor.onMessage(sup, { k: 'req', id: 'r1', method: 'trips.get', params: {} });
    await supervisor.onMessage(sup, { k: 'req', id: 'r2', method: 'trips.get', params: {} });
    expect(sent).toHaveLength(2);
    expect(seen.map((c) => c?.kind)).toEqual(['rpc', 'rpc']);
    expect(seen[0]!.id).not.toBe(seen[1]!.id);
    await vi.waitFor(() => expect(log.logDebug).toHaveBeenCalledTimes(2));
    expect(String(log.logDebug.mock.calls[0][0])).toMatch(/^rpc weather-plugin trips\.get ok \d+ms$/);
  });

  it('RPC-TRACE-002: a refused dispatch is logged at warn with its code and reason', async () => {
    const { supervisor, sup } = makeSupervisor((req) => ({
      k: 'res',
      id: req.id,
      ok: false,
      error: { code: 'PERMISSION_DENIED', message: 'no trip access' },
    }));
    await supervisor.onMessage(sup, { k: 'req', id: 'r3', method: 'trips.update', params: {} });
    await vi.waitFor(() => expect(log.logWarn).toHaveBeenCalledTimes(1));
    expect(String(log.logWarn.mock.calls[0][0])).toMatch(
      /^rpc weather-plugin trips\.update refused \d+ms: PERMISSION_DENIED no trip access$/,
    );
  });
});
