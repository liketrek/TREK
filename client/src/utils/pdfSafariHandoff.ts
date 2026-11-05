/**
 * An iPhone or iPad ignores print() in an app added to the Home Screen, in the
 * page and in an iframe alike, so the trip PDF cannot be saved from there. Safari
 * can print it. This is the link that hands the export over: it opens the trip in
 * Safari with the export dialog already up.
 */

export const EXPORT_PARAM = 'export';
export const EXPORT_PDF = 'pdf';

/** The trip, opened with its export dialog showing. Absolute, since it leaves the installed app. */
export function pdfExportUrl(tripId: number): string {
  return `${window.location.origin}/trips/${tripId}?${EXPORT_PARAM}=${EXPORT_PDF}`;
}
