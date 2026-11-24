import { Directory, Filesystem } from '@capacitor/filesystem';
import { Share } from '@capacitor/share';
import { toBase64 } from './blobBase64';
import { hasNativeFeature } from './capabilities';
import { TrekShell } from './trekShell';
import { addToWallet, isWalletPassName } from './wallet';

/** Readable, but safe as a single path segment inside the cache directory. */
export function cacheFileName(filename: string): string {
  const cleaned = Array.from(filename, (ch) => (ch.charCodeAt(0) < 32 || '\\/:*?"<>|'.includes(ch) ? '_' : ch))
    .join('')
    .trim();
  return cleaned.replace(/^\.+/, '') || 'download';
}

export function fileNameFromUrl(url: string): string {
  const [path = ''] = url.split('?', 1);
  const last = path.split('/').filter(Boolean).pop() ?? '';
  try {
    return decodeURIComponent(last);
  } catch {
    return last;
  }
}

/**
 * The app's WebView cannot save a download on its own, so the file goes into
 * the app's cache and from there into the system share sheet, which offers
 * saving it to Files, opening it in another app or sending it on.
 */
export async function shareFile(blob: Blob, filename: string): Promise<void> {
  // A Wallet pass goes to Apple Wallet's own sheet, not to the generic share sheet.
  if (isWalletPassName(filename) && (await addToWallet(blob))) return;
  await shareCached(await writeToCache(blob, filename));
}

/**
 * Opens a file to look at it: a PDF to page through, an image, a document, in
 * the system's viewer (Quick Look on iOS, the viewing app on Android). An app
 * without the viewer, or a type nothing on the device shows, gets the share
 * sheet as before, which still previews and saves it.
 */
export async function openNativeFile(blob: Blob, filename: string): Promise<void> {
  if (isWalletPassName(filename) && (await addToWallet(blob))) return;
  const uri = await writeToCache(blob, filename);
  if (hasNativeFeature('filePreview')) {
    try {
      const { result } = await TrekShell.previewFile({
        path: uri,
        mimeType: blob.type || 'application/octet-stream',
        title: filename,
      });
      if (result === 'shown') return;
    } catch {
      /* the viewer could not open it: the share sheet still can */
    }
  }
  await shareCached(uri);
}

async function writeToCache(blob: Blob, filename: string): Promise<string> {
  const { uri } = await Filesystem.writeFile({
    path: cacheFileName(filename),
    data: await toBase64(blob),
    directory: Directory.Cache,
  });
  return uri;
}

async function shareCached(uri: string): Promise<void> {
  try {
    await Share.share({ files: [uri] });
  } catch (err) {
    // Dismissing the sheet rejects; that is the user's choice, not a failure.
    if (/cancel/i.test(String((err as Error)?.message))) return;
    throw err;
  }
}
