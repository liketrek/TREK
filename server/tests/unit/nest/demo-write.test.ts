/**
 * The demo-mode upload block.
 *
 * The condition was copy-pasted into six upload handlers, each carrying its own
 * copy of the 403 body. All six call isDemoWriteBlocked now.
 *
 * It is a function rather than a guard on purpose, and that is worth a test of
 * its own: guards run before the multipart parser, so throwing from one leaves
 * the request body unread and Node resets the connection — the client gets
 * ECONNRESET instead of the 403. PROFILE-015 in the integration suite is what
 * demonstrates it end-to-end.
 */
import { describe, it, expect, vi, afterEach } from 'vitest';

vi.mock('../../../src/nest/common/demo', () => ({ isDemoEmail: vi.fn(() => false) }));

import { isDemoWriteBlocked, DEMO_WRITE_ERROR } from '../../../src/nest/common/demo-write';
import { RuntimeEnvService } from '../../../src/nest/app-config/runtime-env.service';
import { isDemoEmail } from '../../../src/nest/common/demo';

const env = new RuntimeEnvService();

afterEach(() => {
  delete process.env.DEMO_MODE;
  vi.mocked(isDemoEmail).mockReturnValue(false);
});

describe('isDemoWriteBlocked', () => {
  it('DEMO-WRITE-001: blocks the demo account while the instance runs in demo mode', () => {
    process.env.DEMO_MODE = 'true';
    vi.mocked(isDemoEmail).mockReturnValue(true);

    expect(isDemoWriteBlocked(env, 'demo@trek.app')).toBe(true);
  });

  it('DEMO-WRITE-002: lets a normal account through even while demo mode is on', () => {
    process.env.DEMO_MODE = 'true';
    vi.mocked(isDemoEmail).mockReturnValue(false);

    expect(isDemoWriteBlocked(env, 'alice@example.com')).toBe(false);
  });

  it('DEMO-WRITE-003: lets the demo account through when the instance is not in demo mode', () => {
    vi.mocked(isDemoEmail).mockReturnValue(true);

    expect(isDemoWriteBlocked(env, 'demo@trek.app')).toBe(false);
  });

  it('DEMO-WRITE-004: reads the env live, so a toggle takes effect without a restart', () => {
    vi.mocked(isDemoEmail).mockReturnValue(true);
    expect(isDemoWriteBlocked(env, 'demo@trek.app')).toBe(false);

    process.env.DEMO_MODE = 'true';
    expect(isDemoWriteBlocked(env, 'demo@trek.app')).toBe(true);
  });

  it('DEMO-WRITE-005: the 403 body is the one the six endpoints have always sent', () => {
    expect(DEMO_WRITE_ERROR).toEqual({
      error: 'Uploads are disabled in demo mode. Self-host TREK for full functionality.',
    });
  });
});
