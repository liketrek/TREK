// FE-UTIL-PDFSWITCH-001 to FE-UTIL-PDFSWITCH-002
import { afterEach, describe, expect, it, vi } from 'vitest';
import { pdfSwitchOn, rememberPdfSwitch } from './pdfSwitch';

const KEY = 'trek_pdf_test_switch';

afterEach(() => {
  vi.restoreAllMocks();
  localStorage.removeItem(KEY);
});

describe('pdfSwitch', () => {
  it('FE-UTIL-PDFSWITCH-001: a switch is on until it is turned off, and remembers either way', () => {
    expect(pdfSwitchOn(KEY)).toBe(true);
    rememberPdfSwitch(KEY, false);
    expect(localStorage.getItem(KEY)).toBe('0');
    expect(pdfSwitchOn(KEY)).toBe(false);
    rememberPdfSwitch(KEY, true);
    expect(localStorage.getItem(KEY)).toBe('1');
    expect(pdfSwitchOn(KEY)).toBe(true);
  });

  it('FE-UTIL-PDFSWITCH-002: a blocked localStorage reads as on and drops the write without throwing', () => {
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new Error('blocked');
    });
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('blocked');
    });
    expect(pdfSwitchOn(KEY)).toBe(true);
    expect(() => rememberPdfSwitch(KEY, false)).not.toThrow();
  });
});
