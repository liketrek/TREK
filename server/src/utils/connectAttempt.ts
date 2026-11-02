import net from 'node:net';

/**
 * How long Node waits for one address of a dual-stack name before it gives up
 * on that connection attempt and tries the next address.
 *
 * Node's default is 250 ms. That is shorter than a single round trip from
 * Australia or New Zealand to a server in Europe, so on a network without IPv6
 * the IPv4 handshake is cut off before it can finish, the IPv6 attempt fails at
 * once, and the request ends in ETIMEDOUT although the host was reachable all
 * along. Two seconds lets a slow but working handshake through; a host that
 * really does not answer on one family still moves on to the other.
 */
export const CONNECT_ATTEMPT_TIMEOUT_MS = 2_000;

/**
 * Raises Node's per-address connect attempt timeout for every outbound
 * connection, global fetch and undici agents alike (undici leaves the attempt
 * timeout to Node unless a caller sets autoSelectFamily itself). A larger value
 * an operator already set, for example through
 * NODE_OPTIONS=--network-family-autoselection-attempt-timeout, is kept.
 */
export function widenConnectAttemptTimeout(): number {
  const current = net.getDefaultAutoSelectFamilyAttemptTimeout();
  if (current >= CONNECT_ATTEMPT_TIMEOUT_MS) return current;
  net.setDefaultAutoSelectFamilyAttemptTimeout(CONNECT_ATTEMPT_TIMEOUT_MS);
  return CONNECT_ATTEMPT_TIMEOUT_MS;
}
