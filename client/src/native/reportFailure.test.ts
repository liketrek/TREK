import { afterEach, describe, expect, it, vi } from 'vitest';

import { reportNativeFailure } from './reportFailure';

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('reportNativeFailure', () => {
  it('hands the failure to the page error event', () => {
    const report = vi.fn();
    vi.stubGlobal('reportError', report);
    const err = new Error('share failed');
    reportNativeFailure(err);
    expect(report).toHaveBeenCalledWith(err);
  });

  it('does nothing where the runtime has no reportError', () => {
    vi.stubGlobal('reportError', undefined);
    expect(() => reportNativeFailure(new Error('x'))).not.toThrow();
  });
});
