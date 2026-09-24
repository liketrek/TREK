import { describe, it, expect, vi, beforeEach } from 'vitest'
import { downloadBlob, downloadFile, openFile } from '../../../src/utils/fileDownload'
import { shareFile } from '../../../src/native/nativeFiles'

vi.mock('../../../src/db/offlineDb', () => ({ getCachedBlob: vi.fn() }))
vi.mock('../../../src/native/platform', () => ({ isNativeApp: () => true }))
vi.mock('../../../src/native/nativeFiles', async () => {
  const actual = await vi.importActual<typeof import('../../../src/native/nativeFiles')>('../../../src/native/nativeFiles')
  return { ...actual, shareFile: vi.fn() }
})

const pdf = new Blob(['%PDF'], { type: 'application/pdf' })

beforeEach(() => {
  vi.mocked(shareFile).mockReset().mockResolvedValue()
  vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: true, status: 200, blob: () => Promise.resolve(pdf) }))
})

describe('fileDownload inside the native app', () => {
  it('hands an in-memory blob to the share sheet instead of an anchor', () => {
    const click = vi.spyOn(HTMLAnchorElement.prototype, 'click')
    downloadBlob(pdf, 'report.pdf')
    expect(shareFile).toHaveBeenCalledWith(pdf, 'report.pdf')
    expect(click).not.toHaveBeenCalled()
  })

  it('logs a share that failed rather than losing it', async () => {
    const error = vi.spyOn(console, 'error').mockImplementation(() => {})
    vi.mocked(shareFile).mockRejectedValue(new Error('no space'))
    downloadBlob(pdf, 'report.pdf')
    await vi.waitFor(() => expect(error).toHaveBeenCalledWith('[download]', expect.any(Error)))
  })

  it('shares a protected file under its given name, or the one from its URL', async () => {
    await downloadFile('/api/trips/1/files/2/download', 'Boarding pass.pdf')
    expect(shareFile).toHaveBeenLastCalledWith(pdf, 'Boarding pass.pdf')

    await downloadFile('/uploads/files/ticket%20A.pdf')
    expect(shareFile).toHaveBeenLastCalledWith(pdf, 'ticket A.pdf')
  })

  it('opens files through the share sheet too, since there is no tab to open them in', async () => {
    await openFile('/api/trips/1/files/2/download')
    expect(shareFile).toHaveBeenLastCalledWith(pdf, 'download')
  })
})
