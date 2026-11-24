/*
 * The switches of the trip PDF preview (a new page for every day, the notes of
 * the transports, large text), remembered in this browser.
 */

/** A preview switch as it was last left; `defaultOn` until it is first touched, or when storage is blocked. */
export function pdfSwitchOn(key: string, defaultOn = true): boolean {
  try {
    const stored = localStorage.getItem(key);
    return stored === null ? defaultOn : stored !== '0';
  } catch {
    return defaultOn;
  }
}

export function rememberPdfSwitch(key: string, on: boolean): void {
  try {
    localStorage.setItem(key, on ? '1' : '0');
  } catch {
    // A blocked localStorage costs the preference, not the export.
  }
}
