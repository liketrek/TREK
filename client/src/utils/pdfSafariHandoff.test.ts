/**
 * FE-PDFSAFARI-001: the link the iOS Home Screen app hands to Safari.
 */
import { describe, expect, it } from 'vitest';

import { EXPORT_PARAM, EXPORT_PDF, pdfExportUrl } from './pdfSafariHandoff';

describe('pdfExportUrl', () => {
  it('FE-PDFSAFARI-001: is the absolute trip address with the export asked for', () => {
    const url = new URL(pdfExportUrl(42));
    expect(url.origin).toBe(window.location.origin);
    expect(url.pathname).toBe('/trips/42');
    expect(url.searchParams.get(EXPORT_PARAM)).toBe(EXPORT_PDF);
  });
});
