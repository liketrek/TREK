import { CONNECT_ATTEMPT_TIMEOUT_MS, widenConnectAttemptTimeout } from '../../../src/utils/connectAttempt';

import net from 'node:net';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

describe('widenConnectAttemptTimeout', () => {
  let original: number;

  beforeEach(() => {
    original = net.getDefaultAutoSelectFamilyAttemptTimeout();
  });

  afterEach(() => {
    net.setDefaultAutoSelectFamilyAttemptTimeout(original);
  });

  it('raises Node’s 250 ms default so a slow but working handshake is not cut off', () => {
    net.setDefaultAutoSelectFamilyAttemptTimeout(250);

    expect(widenConnectAttemptTimeout()).toBe(CONNECT_ATTEMPT_TIMEOUT_MS);
    expect(net.getDefaultAutoSelectFamilyAttemptTimeout()).toBe(CONNECT_ATTEMPT_TIMEOUT_MS);
  });

  it('keeps a larger value an operator already set', () => {
    net.setDefaultAutoSelectFamilyAttemptTimeout(5_000);

    expect(widenConnectAttemptTimeout()).toBe(5_000);
    expect(net.getDefaultAutoSelectFamilyAttemptTimeout()).toBe(5_000);
  });
});
