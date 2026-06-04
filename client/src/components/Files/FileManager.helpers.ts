import { FileText, FileImage, File, Plane, Train, Car, Ship, Bus, Sailboat, Bike, CarTaxiFront, Route } from 'lucide-react'
import { downloadFile } from '../../utils/fileDownload'

export function isImage(mimeType?: string | null) {
  if (!mimeType) return false
  return mimeType.startsWith('image/')
}

export function getFileIcon(mimeType?: string | null) {
  if (!mimeType) return File
  if (mimeType === 'application/pdf') return FileText
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
