/**
 * FE-PDFPREVIEW-001 to FE-PDFPREVIEW-005: the trip PDF's preview and the control
 * that saves it. An iPhone or iPad ignores print() in the Home Screen app, so
 * there the preview hands the export to Safari instead of offering a button that
 * does nothing.
 */
import { afterEach, describe, expect, it, vi } from 'vitest';

import { PAGE_BREAK_KEY, openPdfPreview, type PdfPreviewOptions } from './pdfPreview';

const tr = (key: string) => key;

function open(overrides: Partial<PdfPreviewOptions> = {}) {
  openPdfPreview({
    html: '<html><body>plan</body></html>',
    title: 'Lisbon',
    tripId: 9,
    tr,
    breaksPerDay: true,
    showTransportNotes: true,
    hasTransportNotes: false,
    ...overrides,
  });
}

function standalone(value: boolean) {
  Object.defineProperty(navigator, 'standalone', { configurable: true, get: () => value });
}

afterEach(() => {
  document.getElementById('pdf-preview-overlay')?.remove();
  delete (navigator as unknown as Record<string, unknown>).standalone;
  localStorage.clear();
});

describe('openPdfPreview', () => {
  it('FE-PDFPREVIEW-001: a browser gets the print button, and it prints the frame', () => {
    open();
    expect(document.getElementById('pdf-safari-link')).toBeNull();
    expect(document.getElementById('pdf-safari-hint')).toBeNull();

    const iframe = document.querySelector<HTMLIFrameElement>('#pdf-preview-overlay iframe');
    const print = vi.fn();
    Object.defineProperty(iframe, 'contentWindow', { value: { print }, configurable: true });
    const button = document.getElementById('pdf-print-btn');
    expect(button?.textContent).toBe('pdf.saveAsPdf');
    button?.click();
    expect(print).toHaveBeenCalledTimes(1);
  });

  it('FE-PDFPREVIEW-002: the iOS Home Screen app gets a Safari link to the trip export and says why', () => {
    standalone(true);
    open();
    expect(document.getElementById('pdf-print-btn')).toBeNull();

    const link = document.getElementById('pdf-safari-link') as HTMLAnchorElement;
    expect(link.textContent).toBe('pdf.openInSafari');
    expect(link.target).toBe('_blank');
    expect(link.rel).toBe('noopener');
    const url = new URL(link.href);
    expect(url.pathname).toBe('/trips/9');
    expect(url.searchParams.get('export')).toBe('pdf');
    expect(document.getElementById('pdf-safari-hint')?.textContent).toBe('pdf.safariHint');
  });

  it('FE-PDFPREVIEW-003: without a trip to hand over, the preview keeps the print button', () => {
    standalone(true);
    open({ tripId: undefined });
    expect(document.getElementById('pdf-print-btn')).not.toBeNull();
    expect(document.getElementById('pdf-safari-link')).toBeNull();
  });

  it('FE-PDFPREVIEW-004: the title is escaped and the close button removes the preview', () => {
    open({ title: '<b>Lisbon</b>' });
    const overlay = document.getElementById('pdf-preview-overlay');
    expect(overlay?.querySelector('b')).toBeNull();
    expect(overlay?.textContent).toContain('<b>Lisbon</b>');
    document.getElementById('pdf-close-btn')?.click();
    expect(document.getElementById('pdf-preview-overlay')).toBeNull();
  });

  it('FE-PDFPREVIEW-005: the page-break switch flips and remembers the choice', () => {
    open();
    const toggle = document.getElementById('pdf-daybreak-toggle');
    expect(toggle?.getAttribute('aria-checked')).toBe('true');
    toggle?.click();
    expect(toggle?.getAttribute('aria-checked')).toBe('false');
    expect(localStorage.getItem(PAGE_BREAK_KEY)).not.toBeNull();
  });
});
