import { File, FileText, Files, FolderOpen, Image as ImageIcon, Star, StickyNote, Ticket, FileSpreadsheet } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { isMedia, isWalletPass } from '../../../../components/Files/FileManager.helpers'
import type { Place, Reservation, TranslationFn, TripFile } from '../../../../types'

/**
 * Pure view-model helpers for the mobile Files tab — the real-data
 * counterpart to the demo's FILES rows (spec 03 §5). Type categorisation,
 * filter matching/counting, the starred-first sort and the link-row label
 * builder live here so MFilesTab and the sheets stay layout-only, same split
 * as transportsModel.ts for the Transports tab.
 */

export type FileFilterId = 'all' | 'pdf' | 'image' | 'doc' | 'starred' | 'collab'
export type FileTypeCategory = 'pdf' | 'image' | 'pass' | 'xls' | 'other'

interface FileTypeMeta {
  category: FileTypeCategory
  icon: LucideIcon
  /** Type-tile accent — the tile background is this colour at ~13% alpha (spec 03 §5.2, Z. 3654). */
  color: string
  /** Short uppercase tile caption (Geist 7px/800, spec 03 §5.2). */
  label: string
}

const TYPE_META: Record<FileTypeCategory, Omit<FileTypeMeta, 'category'>> = {
  pass: { icon: Ticket, color: '#8B5CF6', label: 'PASS' },
  pdf: { icon: FileText, color: '#D6273B', label: 'PDF' },
  image: { icon: ImageIcon, color: '#3BA55C', label: 'IMG' },
  xls: { icon: FileSpreadsheet, color: '#2FA37A', label: 'XLS' },
  other: { icon: File, color: '#6b7280', label: 'FILE' },
}

function isSpreadsheetFile(mimeType?: string | null, name?: string | null): boolean {
  const ext = (name || '').toLowerCase().split('.').pop()
  if (ext === 'xls' || ext === 'xlsx' || ext === 'csv' || ext === 'ods') return true
  const mime = mimeType || ''
  return mime.includes('excel') || mime.includes('spreadsheet') || mime === 'text/csv'
}

/**
 * PDF / IMG / PASS / XLS / fallback — the demo's four explicit type rows
 * (Z. 3655) plus the generic fallback, derived from the real mime_type /
 * filename. IMG folds in video (#823 media) since both open in the same
 * lightbox (useFileManager.ts's isMedia groups them the same way).
 */
export function getFileTypeCategory(file: Pick<TripFile, 'mime_type' | 'original_name'>): FileTypeCategory {
  if (isWalletPass(file.mime_type, file.original_name)) return 'pass'
  if (file.mime_type === 'application/pdf') return 'pdf'
  if (isMedia(file.mime_type)) return 'image'
  if (isSpreadsheetFile(file.mime_type, file.original_name)) return 'xls'
  return 'other'
}

export function getFileTypeMeta(file: Pick<TripFile, 'mime_type' | 'original_name'>): FileTypeMeta {
  const category = getFileTypeCategory(file)
  return { category, ...TYPE_META[category] }
}

/** Filter grid definition, in display order (spec 03 §5.1; 'collab' is the optional 6th tile, §5.5/§7.4). */
export const FILE_FILTERS: { id: FileFilterId; icon: LucideIcon; labelKey: string }[] = [
  { id: 'all', icon: FolderOpen, labelKey: 'files.filterAll' },
  { id: 'pdf', icon: FileText, labelKey: 'files.filterPdf' },
  { id: 'image', icon: ImageIcon, labelKey: 'files.filterImages' },
  { id: 'doc', icon: Files, labelKey: 'files.filterDocs' },
  { id: 'starred', icon: Star, labelKey: 'files.filterStarred' },
  { id: 'collab', icon: StickyNote, labelKey: 'files.filterCollab' },
]

/**
 * 'doc' is the demo's "XLS+PASS" bucket (spec 03 §5.1) widened to every
 * non-PDF, non-media file so the tiles fully partition `files` — a plain
 * Word/text/zip attachment (which only gets the generic fallback icon on the
 * row, spec's "Fallback file") still counts as a "Doc" instead of being
 * invisible to every specific filter except All (open point, see report).
 */
export function matchesFileFilter(file: TripFile, filter: FileFilterId): boolean {
  switch (filter) {
    case 'all': return true
    case 'starred': return !!file.starred
    case 'collab': return file.note_id != null
    case 'pdf': return getFileTypeCategory(file) === 'pdf'
    case 'image': return getFileTypeCategory(file) === 'image'
    case 'doc': {
      const category = getFileTypeCategory(file)
      return category === 'xls' || category === 'pass' || category === 'other'
    }
    default: return true
  }
}

/** Starred files first, stable otherwise (spec 03 §5.2: "Sortierung: markierte Dateien zuerst"). */
export function sortFilesStarredFirst(files: TripFile[]): TripFile[] {
  return [...files].sort((a, b) => (b.starred ? 1 : 0) - (a.starred ? 1 : 0))
}

/** Compact "16. Jul" date, matching the rest of the mobile trip screen (e.g. transportsModel's day chips). */
export function formatFileDate(dateStr: string | null | undefined, locale: string): string {
  if (!dateStr) return ''
  const date = new Date(dateStr)
  if (Number.isNaN(date.getTime())) return ''
  return date.toLocaleDateString(locale, { day: 'numeric', month: 'short' })
}

/**
 * The link row's joined descriptor list (spec 03 §5.2: "Links mit '·' gejoint"):
 * one "{Kategorie} · {Name}" string per linked place / reservation (transport
 * vs. booking split like FileManagerRow.tsx's SourceBadge list) plus a
 * Collab-Notes entry when note_id is set.
 */
export function buildFileLinkLabels(
  file: TripFile,
  places: Place[],
  reservations: Reservation[],
  transportTypes: Set<string>,
  t: TranslationFn,
): string[] {
  const labels: string[] = []

  const placeIds = new Set<number>()
  if (file.place_id != null) placeIds.add(file.place_id)
  for (const id of file.linked_place_ids || []) if (id != null) placeIds.add(id)
  for (const id of placeIds) {
    const place = places.find(p => p.id === id)
    if (place) labels.push(`${t('files.sourcePlan')} · ${place.name}`)
  }

  const resIds = new Set<number>()
  if (file.reservation_id != null) resIds.add(file.reservation_id)
  for (const id of file.linked_reservation_ids || []) if (id != null) resIds.add(id)
  for (const id of resIds) {
    const res = reservations.find(r => r.id === id)
    if (res) {
      const key = transportTypes.has(res.type) ? 'files.sourceTransport' : 'files.sourceBooking'
      labels.push(`${t(key)} · ${res.title || t(key)}`)
    }
  }

  if (file.note_id != null) labels.push(t('files.sourceCollab'))

  return labels
}
