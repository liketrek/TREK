import { downloadFile, openFile } from '../../../utils/fileDownload';

export type Attachment = { url: string; original_name: string };

/**
 * Opens a file attached to a booking. The desktop panel passes `onError` to say
 * so with a toast when the file cannot be opened; the phone's bookings and
 * transports cards pass nothing and stay silent, as they always have.
 */
export function openAttachment(f: Attachment, onError?: () => void): void {
  settle(openFile(f.url, f.original_name), onError);
}

/**
 * Saves a file attached to a booking under its original name, where opening it
 * would only show it in a viewer (a PDF ticket on a phone, say). Failures are
 * reported the same way as for opening.
 */
export function downloadAttachment(f: Attachment, onError?: () => void): void {
  settle(downloadFile(f.url, f.original_name), onError);
}

function settle(pending: Promise<void>, onError?: () => void): void {
  // Without a handler the rejection is still caught, so it never surfaces as unhandled.
  void pending.catch(() => onError?.());
}
