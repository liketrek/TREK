import {
  COLLECTION_GPX_PROBLEMS,
  collectionFileSchema,
  MAX_COLLECTION_FILE_BYTES,
  type CollectionFile,
  type CollectionGpxProblem,
  type CollectionGpxReadResult,
} from '@trek/shared'
import { downloadBlob } from '../../utils/fileDownload'

/**
 * The browser half of list export and import (#2198, #2301).
 *
 * Both files are built by the server, which is also where the decision about
 * what may leave the instance lives (`collection-file.schema.ts`). This module
 * only hands one to the browser as a download, and reads a chosen file back
 * into something the import request will accept.
 *
 * A file that arrives here is a stranger's and is treated as one. A list file
 * is read locally, never uploaded, parsed rather than evaluated, size-capped
 * before parsing, and put through the shared contract so a field this build
 * does not know is dropped instead of travelling on. A GPX is size-capped the
 * same way and then sent as text to the server, which reads it with the XML
 * library the trip importer already uses and hands back a list file: one side
 * that parses XML, and it is the one that enforces the limits.
 */

export const COLLECTION_FILE_EXTENSION = '.trekcollection.json'
export const COLLECTION_GPX_EXTENSION = '.gpx'

/** The two ways a list can leave: whole, for another TREK, or as waypoints for everything else. */
export type CollectionExportFormat = 'trek' | 'gpx'

/** A file name from a list name: lowercase, ascii-ish, short. */
export function collectionFileName(name: string, extension = COLLECTION_FILE_EXTENSION): string {
  const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 40)
  return `${slug || 'collection'}${extension}`
}

function download(content: string, type: string, fileName: string): void {
  downloadBlob(new Blob([content], { type }), fileName)
}

/** Hand the file to the browser as a download. */
export function downloadCollectionFile(file: CollectionFile): void {
  download(JSON.stringify(file, null, 2), 'application/json', collectionFileName(file.name))
}

/** Hand a list's GPX to the browser as a download, named like its list file would be. */
export function downloadCollectionGpx(listName: string, gpx: string): void {
  download(gpx, 'application/gpx+xml', collectionFileName(listName, COLLECTION_GPX_EXTENSION))
}

export type CollectionFileError = 'not-a-collection' | CollectionGpxProblem

/** What a GPX held that did not become a place. */
export interface GpxLeftovers {
  /** Waypoints without usable coordinates. */
  skipped: number
  /** Track points and unnamed route points: lines, not places. */
  trackPoints: number
}

/**
 * Exactly one of `file` and `error` is set; `gpx` only when the file was one.
 *
 * Nullable fields rather than a discriminated union on an `ok` flag: the
 * client compiles with `strict: false`, and without `strictNullChecks` a
 * `{ok: true} | {ok: false}` union does not narrow, so every read of the
 * failure branch would need a cast.
 */
export interface ParsedCollectionFile {
  file: CollectionFile | null
  error: CollectionFileError | null
  gpx?: GpxLeftovers | null
}

/** Reads a GPX document into a list file. The server does that, so the caller supplies it. */
export type GpxReader = (gpx: string, fileName: string) => Promise<CollectionGpxReadResult>

/** A list file is JSON and JSON never opens with `<`, so this is all the sniffing a GPX needs. */
function looksLikeXml(text: string): boolean {
  const withoutBom = text.charCodeAt(0) === 0xfeff ? text.slice(1) : text
  return withoutBom.trimStart().startsWith('<')
}

/** The reason the server gave for refusing a GPX, when it gave one this build knows. */
function gpxProblemOf(err: unknown): CollectionGpxProblem | null {
  const code: unknown = (err as { response?: { data?: { code?: unknown } } } | null)?.response?.data?.code
  return COLLECTION_GPX_PROBLEMS.find(problem => problem === code) ?? null
}

async function readGpx(text: string, fileName: string, reader: GpxReader): Promise<ParsedCollectionFile> {
  try {
    const result = await reader(text, fileName)
    return { file: result.file, error: null, gpx: { skipped: result.skipped, trackPoints: result.track_points } }
  } catch (err) {
    const problem = gpxProblemOf(err)
    // No code means the failure was not the file's (offline, a 500), and that
    // is for the dialog to report as it reports a failed import.
    if (!problem) throw err
    return { file: null, error: problem, gpx: null }
  }
}

/**
 * Read a chosen file into a list file, or say why it is not one.
 *
 * The failures are kept apart because they are different things a person can
 * do something about: a file too big to be one of ours, a file that is not
 * readable at all, a JSON that is not a TREK list, an XML that is not a GPX,
 * and a GPX with more places than a list may hold.
 */
export async function readCollectionFile(file: File, readGpxFile: GpxReader): Promise<ParsedCollectionFile> {
  if (file.size > MAX_COLLECTION_FILE_BYTES) return { file: null, error: 'too-large' }
  let text: string
  try {
    text = await file.text()
  } catch {
    return { file: null, error: 'unreadable' }
  }
  if (looksLikeXml(text)) return readGpx(text, file.name ?? '', readGpxFile)
  let raw: unknown
  try {
    raw = JSON.parse(text)
  } catch {
    return { file: null, error: 'unreadable' }
  }
  const parsed = collectionFileSchema.safeParse(raw)
  return parsed.success
    ? { file: parsed.data, error: null }
    : { file: null, error: 'not-a-collection' }
}
