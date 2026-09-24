import { Directory, Filesystem } from '@capacitor/filesystem'
import { Share } from '@capacitor/share'

function toBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(String(reader.result).slice(String(reader.result).indexOf(',') + 1))
    reader.onerror = () => reject(reader.error)
    reader.readAsDataURL(blob)
  })
}

/** Readable, but safe as a single path segment inside the cache directory. */
export function cacheFileName(filename: string): string {
  const cleaned = Array.from(filename, (ch) => (ch.charCodeAt(0) < 32 || '\\/:*?"<>|'.includes(ch) ? '_' : ch)).join('').trim()
  return cleaned.replace(/^\.+/, '') || 'download'
}

export function fileNameFromUrl(url: string): string {
  const last = url.split('?')[0]!.split('/').filter(Boolean).pop() ?? ''
  try {
    return decodeURIComponent(last)
  } catch {
    return last
  }
}

/**
 * The app's WebView cannot save a download on its own, so the file goes into
 * the app's cache and from there into the system share sheet, which offers
 * saving it to Files, opening it in another app or sending it on.
 */
export async function shareFile(blob: Blob, filename: string): Promise<void> {
  const { uri } = await Filesystem.writeFile({
    path: cacheFileName(filename),
    data: await toBase64(blob),
    directory: Directory.Cache,
  })
  try {
    await Share.share({ files: [uri] })
  } catch (err) {
    // Dismissing the sheet rejects; that is the user's choice, not a failure.
    if (/cancel/i.test(String((err as Error)?.message))) return
    throw err
  }
}
