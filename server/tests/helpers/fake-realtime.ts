/**
 * A RealtimeService that records instead of delivering.
 *
 * Suites observe broadcasts through DI rather than by mocking a module path:
 * a hand-built service gets `new FakeRealtimeService()` where it took a
 * RealtimeService, and a booted Nest app gets its container instance swapped
 * (`.overrideProvider(RealtimeService).useValue(fake)`) or spied on with
 * `spyOnRealtime(app)`. Each method records into a `vi.fn`, so the assertions read the
 * same as they did against the old module mock:
 *
 *   const realtime = new FakeRealtimeService();
 *   const service = new TodoService(permissions, realtime, ...);
 *   expect(realtime.broadcastMock).toHaveBeenCalledWith(tripId, 'todo:created', ...);
 *
 * The fake receives exactly the arguments the service handed RealtimeService
 * (the facade passes them through without padding), so call-shape assertions
 * keep their meaning.
 */
import { RealtimeService } from '../../src/nest/realtime/realtime.service';
import type { INestApplicationContext } from '@nestjs/common';

import { vi, type Mock } from 'vitest';

type BroadcastArgs = [
  tripId: number | string,
  eventType: string,
  payload: Record<string, unknown>,
  excludeSid?: number | string,
  onlyUserId?: number,
];
type BroadcastToUserArgs = [userId: number, payload: Record<string, unknown>, excludeSid?: number | string];

export class FakeRealtimeService extends RealtimeService {
  readonly broadcastMock: Mock<(...args: BroadcastArgs) => void> = vi.fn();
  readonly broadcastToUserMock: Mock<(...args: BroadcastToUserArgs) => void> = vi.fn();
  /** Nobody is online unless a case says otherwise. */
  readonly getOnlineUserIdsMock: Mock<() => Set<number>> = vi.fn(() => new Set<number>());

  constructor() {
    super();
    // Some callers take the method off the instance before calling it
    // (McpToolGuardsService.safeBroadcast does), as the real facade allows.
    this.broadcast = this.broadcast.bind(this);
    this.broadcastToUser = this.broadcastToUser.bind(this);
    this.getOnlineUserIds = this.getOnlineUserIds.bind(this);
  }

  override broadcast(...args: BroadcastArgs): void {
    this.broadcastMock(...args);
  }

  override broadcastToUser(...args: BroadcastToUserArgs): void {
    this.broadcastToUserMock(...args);
  }

  override getOnlineUserIds(): Set<number> {
    return this.getOnlineUserIdsMock();
  }

  /** Forget every recorded call (and any per-case return value). */
  reset(): void {
    this.broadcastMock.mockReset();
    this.broadcastToUserMock.mockReset();
    this.getOnlineUserIdsMock.mockReset();
    this.getOnlineUserIdsMock.mockImplementation(() => new Set<number>());
  }
}

export interface RealtimeSpies {
  broadcast: Mock<(...args: BroadcastArgs) => void>;
  broadcastToUser: Mock<(...args: BroadcastToUserArgs) => void>;
}

/**
 * Spy on the RealtimeService a booted app resolved, for suites that build the
 * whole app (buildApp) and cannot override a provider. The spies do not
 * deliver: a test socket would otherwise receive every broadcast the case
 * caused, which is what the old module mock prevented too.
 */
export function spyOnRealtime(app: INestApplicationContext): RealtimeSpies {
  const realtime = app.get(RealtimeService);
  const broadcast = vi.spyOn(realtime, 'broadcast').mockImplementation(() => undefined);
  const broadcastToUser = vi.spyOn(realtime, 'broadcastToUser').mockImplementation(() => undefined);
  return {
    broadcast: broadcast as unknown as RealtimeSpies['broadcast'],
    broadcastToUser: broadcastToUser as unknown as RealtimeSpies['broadcastToUser'],
  };
}
