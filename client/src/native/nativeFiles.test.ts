import { describe, it, expect, vi, beforeEach } from 'vitest'
import { Directory, Filesystem } from '@capacitor/filesystem'
import { Share } from '@capacitor/share'
import { cacheFileName, fileNameFromUrl, shareFile } from './nativeFiles'

vi.mock('@capacitor/filesystem', () => ({ Directory: { Cache: 'CACHE' }, Filesystem: { writeFile: vi.fn() } }))
vi.mock('@capacitor/share', () => ({ Share: { share: vi.fn() } }))

beforeEach(() => {
  vi.mocked(Filesystem.writeFile).mockReset().mockResolvedValue({ uri: 'file:///cache/trip.pdf' })
  vi.mocked(Share.share).mockReset().mockResolvedValue({})
})

describe('cacheFileName', () => {
  it('keeps a readable name but nothing that could leave the cache directory', () => {
    expect(cacheFileName('Lisbon 2026.pdf')).toBe('Lisbon 2026.pdf')
    expect(cacheFileName('../../etc/passwd')).toBe('_.._etc_passwd')
    expect(cacheFileName('a:b*c?"d"<e>|f\u0001.txt')).toBe('a_b_c__d__e__f_.txt')
    expect(cacheFileName('...hidden')).toBe('hidden')
    expect(cacheFileName('   ')).toBe('download')
  })
})

describe('fileNameFromUrl', () => {
  it('takes the decoded last path segment', () => {
    expect(fileNameFromUrl('/api/trips/1/files/42/Boarding%20pass.pdf?token=x')).toBe('Boarding pass.pdf')
    expect(fileNameFromUrl('/uploads/files/')).toBe('files')
    expect(fileNameFromUrl('/bad/%E0%A4%A')).toBe('%E0%A4%A')
  })
})

describe('shareFile', () => {
  it('writes the blob to the cache and hands it to the share sheet', async () => {
    await shareFile(new Blob(['hello'], { type: 'text/plain' }), 'note.txt')

    expect(Filesystem.writeFile).toHaveBeenCalledWith({ path: 'note.txt', data: btoa('hello'), directory: Directory.Cache })
    expect(Share.share).toHaveBeenCalledWith({ files: ['file:///cache/trip.pdf'] })
  })

  it('treats a dismissed sheet as the user changing their mind', async () => {
    vi.mocked(Share.share).mockRejectedValue(new Error('Share canceled'))
    await expect(shareFile(new Blob(['x']), 'x.txt')).resolves.toBeUndefined()
  })

  it('passes a real failure on', async () => {
    vi.mocked(Share.share).mockRejectedValue(new Error('No activity found'))
    await expect(shareFile(new Blob(['x']), 'x.txt')).rejects.toThrow('No activity found')
  })
})
