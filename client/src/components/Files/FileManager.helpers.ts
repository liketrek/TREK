import { FileText, FileImage, File, FileVideo, Plane, Train, Car, Ship, Bus, Sailboat, Bike, CarTaxiFront, Route } from 'lucide-react'
import { downloadFile } from '../../utils/fileDownload'

export function isImage(mimeType?: string | null) {
  if (!mimeType) return false
  return mimeType.startsWith('image/')
}

export function isVideo(mimeType?: string | null) {
  return !!mimeType && mimeType.startsWith('video/')
}

/** Image or video — the file types that open in the media lightbox (#823). */
export function isMedia(mimeType?: string | null) {
  return isImage(mimeType) || isVideo(mimeType)
}

/**
 * Markdown file (#1345). Detected by EXTENSION first — browsers often send an
 * empty / octet-stream / text/plain MIME for .md — falling back to the markdown
 * MIME types.
 */
export function isMarkdown(mimeType?: string | null, name?: string | null) {
  const ext = (name || '').toLowerCase().split('.').pop()
  if (ext === 'md' || ext === 'markdown') return true
  return !!mimeType && (mimeType === 'text/markdown' || mimeType === 'text/x-markdown')
}

/**
 * Apple Wallet pass (#1447). Detected by EXTENSION first — browsers often send an
 * empty / octet-stream MIME for .pkpass — falling back to the wallet MIME types.
 * Wallet passes must be downloaded so the OS hands them to Apple Wallet rather
 * than rendered in the in-app PDF preview.
 */
export function isWalletPass(mimeType?: string | null, name?: string | null) {
  const ext = (name || '').toLowerCase().split('.').pop()
  if (ext === 'pkpass' || ext === 'pkpasses') return true
  return !!mimeType && (mimeType === 'application/vnd.apple.pkpass' || mimeType === 'application/vnd.apple.pkpasses')
}

export function getFileIcon(mimeType?: string | null) {
  if (!mimeType) return File
  if (mimeType === 'application/pdf') return FileText
  if (isVideo(mimeType)) return FileVideo
  if (isImage(mimeType)) return FileImage
  return File
}

export function formatSize(bytes?: number | null) {
  if (!bytes) return ''
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`
}

export function triggerDownload(url: string, filename: string) {
  downloadFile(url, filename).catch(() => {})
}

export function formatDateWithLocale(dateStr?: string | null, locale?: string) {
  if (!dateStr) return ''
  try {
    return new Date(dateStr).toLocaleDateString(locale, { day: '2-digit', month: '2-digit', year: 'numeric' })
  } catch { return '' }
}

export function transportIcon(type: string) {
  if (type === 'train') return Train
  if (type === 'bus') return Bus
  if (type === 'car') return Car
  if (type === 'taxi') return CarTaxiFront
  if (type === 'bicycle') return Bike
  if (type === 'cruise') return Ship
  if (type === 'ferry') return Sailboat
  if (type === 'transport_other') return Route
  return Plane
}
