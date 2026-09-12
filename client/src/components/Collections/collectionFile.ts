import { collectionFileSchema, MAX_COLLECTION_FILE_BYTES, type CollectionFile } from '@trek/shared'

/**
 * The browser half of list export and import (#2198).
 *
 * The file itself is built by the server, which is also where the decision
 * about what may leave the instance lives (`collection-file.schema.ts`). This
 * module only hands the JSON to the browser as a download, and reads a chosen
 * file back into something the import request will accept.
 *
 * A file that arrives here is a stranger's JSON and is treated as one: read
 * locally, never uploaded, parsed rather than evaluated, size-capped before
 * parsing, and put through the shared contract so a field this build does not
 * know is dropped instead of travelling on to the server.
 */

export const COLLECTION_FILE_EXTENSION = '.trekcollection.json'

/** A file name from a list name: lowercase, ascii-ish, short. */
export function collectionFileName(name: string): string {
  const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 40)
  return `${slug || 'collection'}${COLLECTION_FILE_EXTENSION}`
}

/** Hand the file to the browser as a download. */
export function downloadCollectionFile(file: CollectionFile): void {
  const json = JSON.stringify(file, null, 2)
  const url = URL.createObjectURL(new Blob([json], { type: 'application/json' }))
  const a = document.createElement('a')
  a.href = url
  a.download = collectionFileName(file.name)
  document.body.appendChild(a)
  a.click()
  a.remove()
  // Revoked on the next tick: revoking synchronously can cancel the download
  // in some browsers before it has started reading the blob.
  setTimeout(() => URL.revokeObjectURL(url), 0)
}

export type CollectionFileError = 'too-large' | 'unreadable' | 'not-a-collection'

/**
 * Exactly one of the two is set.
 *
 * Two nullable fields rather than a discriminated union on an `ok` flag: the
 * client compiles with `strict: false`, and without `strictNullChecks` a
 * `{ok: true} | {ok: false}` union does not narrow, so every read of the
 * failure branch would need a cast.
 */
export interface ParsedCollectionFile {
  file: CollectionFile | null
  error: CollectionFileError | null
}

/**
 * Read a chosen file into a list file, or say why it is not one.
 *
 * The three failures are kept apart because they are three different things a
 * person can do something about: a file too big to be one of ours, a file that
 * is not JSON at all, and a JSON that is not a TREK list.
 */
export async function readCollectionFile(file: File): Promise<ParsedCollectionFile> {
  if (file.size > MAX_COLLECTION_FILE_BYTES) return { file: null, error: 'too-large' }
  let raw: unknown
  try {
    raw = JSON.parse(await file.text())
  } catch {
    return { file: null, error: 'unreadable' }
  }
  const parsed = collectionFileSchema.safeParse(raw)
  return parsed.success
    ? { file: parsed.data, error: null }
    : { file: null, error: 'not-a-collection' }
}
