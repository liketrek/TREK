// FE-W4FMH-001 to FE-W4FMH-012
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { File as FileIcon, FileText, FileImage, FileVideo, Plane, Train, Bus, Car, CarTaxiFront, Bike, Ship, Sailboat, Route } from 'lucide-react'

const downloadFile = vi.fn(async (_url: string, _name: string) => {})
vi.mock('../../utils/fileDownload', () => ({ downloadFile: (url: string, name: string) => downloadFile(url, name) }))

import {
  isImage, isVideo, isMedia, isMarkdown, getFileIcon, formatSize,
  triggerDownload, formatDateWithLocale, transportIcon,
} from './FileManager.helpers'

beforeEach(() => {
  downloadFile.mockReset()
  downloadFile.mockResolvedValue(undefined)
})

describe('mime helpers', () => {
  it('FE-W4FMH-001: detects images and videos', () => {
    expect(isImage('image/png')).toBe(true)
    expect(isImage('application/pdf')).toBe(false)
    expect(isImage(null)).toBe(false)
    expect(isVideo('video/mp4')).toBe(true)
    expect(isVideo(undefined)).toBe(false)
  })

  it('FE-W4FMH-002: treats both images and videos as lightbox media', () => {
    expect(isMedia('image/jpeg')).toBe(true)
    expect(isMedia('video/quicktime')).toBe(true)
    expect(isMedia('application/pdf')).toBe(false)
    expect(isMedia(null)).toBe(false)
  })

  it('FE-W4FMH-003: detects markdown by extension first', () => {
    expect(isMarkdown('application/octet-stream', 'NOTES.MD')).toBe(true)
    expect(isMarkdown('', 'readme.markdown')).toBe(true)
    expect(isMarkdown('text/markdown', 'blob')).toBe(true)
    expect(isMarkdown('text/x-markdown', null)).toBe(true)
    expect(isMarkdown('text/plain', 'notes.txt')).toBe(false)
    expect(isMarkdown(null, null)).toBe(false)
  })
})

describe('getFileIcon', () => {
  it('FE-W4FMH-004: picks the icon matching the mime family', () => {
    expect(getFileIcon('application/pdf')).toBe(FileText)
    expect(getFileIcon('video/mp4')).toBe(FileVideo)
    expect(getFileIcon('image/png')).toBe(FileImage)
    expect(getFileIcon('application/zip')).toBe(FileIcon)
    expect(getFileIcon(null)).toBe(FileIcon)
  })
})

describe('formatSize', () => {
  it('FE-W4FMH-005: renders bytes below a kilobyte', () => {
    expect(formatSize(512)).toBe('512 B')
  })

  it('FE-W4FMH-006: renders kilobytes and megabytes with one decimal', () => {
    expect(formatSize(2048)).toBe('2.0 KB')
    expect(formatSize(1024 * 1024 * 3.25)).toBe('3.3 MB')
  })

  it('FE-W4FMH-007: renders nothing for a missing or zero size', () => {
    expect(formatSize(0)).toBe('')
    expect(formatSize(null)).toBe('')
    expect(formatSize(undefined)).toBe('')
  })
})

describe('triggerDownload', () => {
  it('FE-W4FMH-008: forwards to the download helper', () => {
    triggerDownload('/uploads/files/a.pdf', 'a.pdf')

    expect(downloadFile).toHaveBeenCalledWith('/uploads/files/a.pdf', 'a.pdf')
  })

  it('FE-W4FMH-009: swallows a rejected download', async () => {
    downloadFile.mockRejectedValue(new Error('offline'))

    expect(() => triggerDownload('/x', 'x')).not.toThrow()
    await Promise.resolve()
  })
})

describe('formatDateWithLocale', () => {
  it('FE-W4FMH-010: formats an ISO date in the given locale', () => {
    expect(formatDateWithLocale('2026-06-15T10:00:00Z', 'en-GB')).toBe('15/06/2026')
  })

  it('FE-W4FMH-011: returns an empty string for a missing or unparseable date', () => {
    expect(formatDateWithLocale(null, 'en-GB')).toBe('')
    expect(formatDateWithLocale('', 'en-GB')).toBe('')
    expect(formatDateWithLocale('2026-06-15', 'en_US')).toBe('')
  })
})

describe('transportIcon', () => {
  it('FE-W4FMH-012: maps every transport type, defaulting to the plane', () => {
    expect(transportIcon('train')).toBe(Train)
    expect(transportIcon('bus')).toBe(Bus)
    expect(transportIcon('car')).toBe(Car)
    expect(transportIcon('taxi')).toBe(CarTaxiFront)
    expect(transportIcon('bicycle')).toBe(Bike)
    expect(transportIcon('cruise')).toBe(Ship)
    expect(transportIcon('ferry')).toBe(Sailboat)
    expect(transportIcon('transport_other')).toBe(Route)
    expect(transportIcon('flight')).toBe(Plane)
    expect(transportIcon('')).toBe(Plane)
  })
})
