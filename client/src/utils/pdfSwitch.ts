/*
 * The two switches of the trip PDF preview (a new page for every day, and the notes
 * of the transports), remembered in this browser.
 */

/** A preview switch that is on unless it was turned off; both default to on. */
export function pdfSwitchOn(key: string): boolean {
  try {
    return localStorage.getItem(key) !== '0';
  } catch {
    return true;
  }
}

export function rememberPdfSwitch(key: string, on: boolean): void {
  try {
    localStorage.setItem(key, on ? '1' : '0');
  } catch {
    // A blocked localStorage costs the preference, not the export.
  }
}
