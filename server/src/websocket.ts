/**
 * The transport's public surface, for code outside the Nest container.
 *
 * The implementation moved to nest/realtime: the connection lifecycle and the
 * handshake are RealtimeGateway, the wire protocol is TrekWsAdapter, and the
 * socket registry is ws-state.ts. This file stays because it is the import path
 * the rest of the tree knows, including 115 test files that `vi.mock` it to
 * assert on broadcasts. Repointing them all would be a large diff that proves
 * nothing, and this re-export keeps every one of those mocks working.
 *
 * `setupWebSocket` is gone: the server is created by the adapter now, when Nest
 * initialises the gateway, rather than by index.ts after listen().
 */
export { broadcast, broadcastToUser, getOnlineUserIds } from './nest/realtime/ws-state';
