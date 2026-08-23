import { describe, it, expect } from 'vitest';

// Guards the lifecycle option in tests/setup.ts: a cross-origin call nobody mocked must
// fail here rather than actually leaving the runner (see msw/handlers/external.ts for the
// FX widget that once did, and answered after its test environment was gone).
describe('msw unhandled requests', () => {
  it('FE-MSW-EGRESS-001: an unmocked cross-origin request is refused', async () => {
    await expect(fetch('https://unmocked.example/rates')).rejects.toThrow();
  });
});
