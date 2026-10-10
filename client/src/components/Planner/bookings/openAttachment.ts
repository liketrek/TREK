import { openFile } from '../../../utils/fileDownload';

/**
 * Opens a file attached to a booking. The desktop panel passes `onError` to say
 * so with a toast when the file cannot be opened; the phone's bookings and
 * transports cards pass nothing and stay silent, as they always have.
 */
export function openAttachment(f: { url: string; original_name: string }, onError?: () => void): void {
  const opening = openFile(f.url, f.original_name);
  void (onError ? opening.catch(onError) : opening);
}
