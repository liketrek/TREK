import { describe, it, expect, vi } from 'vitest'
import { candidateUrls, probeServer, type ProbeResponse } from './serverAddress'

const features = (url: string, data: unknown = { bookingImport: false, aiParsing: false, nativeApp: true }): ProbeResponse =>
  ({ status: 200, data, url })

describe('candidateUrls', () => {
  it('tries https before http when no scheme was typed', () => {
    expect(candidateUrls('trek.example.com')).toEqual(['https://trek.example.com', 'http://trek.example.com'])
    expect(candidateUrls(' 192.168.1.10:3001/ ')).toEqual(['https://192.168.1.10:3001', 'http://192.168.1.10:3001'])
  })

  it('keeps an explicit scheme and path, without query, hash or trailing slashes', () => {
    expect(candidateUrls('http://nas.local:3001/trek/?x=1#y')).toEqual(['http://nas.local:3001/trek'])
    expect(candidateUrls('HTTPS://Trek.Example.com//')).toEqual(['https://trek.example.com'])
  })

  it('returns nothing for empty input or other schemes', () => {
    expect(candidateUrls('   ')).toEqual([])
    expect(candidateUrls('ftp://trek.example.com')).toEqual([])
    expect(candidateUrls('javascript://alert(1)')).toEqual([])
  })
})

describe('probeServer', () => {
  it('accepts a server that reports nativeApp and follows its redirect', async () => {
    const get = vi.fn().mockResolvedValue(features('https://trek.example.com/api/health/features'))
    expect(await probeServer('http://trek.example.com', get)).toEqual({ ok: true, url: 'https://trek.example.com' })
    expect(get).toHaveBeenCalledWith('http://trek.example.com/api/health/features')
  })

  it('falls back to the candidate itself when the final URL is not the probe path', async () => {
    const get = vi.fn().mockResolvedValue(features('https://sso.example.com/login'))
    expect(await probeServer('https://trek.example.com', get)).toEqual({ ok: true, url: 'https://trek.example.com' })
  })

  it('moves on to plain http when https cannot be reached', async () => {
    const get = vi.fn()
      .mockRejectedValueOnce(new Error('ECONNREFUSED'))
      .mockResolvedValueOnce(features('http://192.168.1.10:3001/api/health/features'))
    expect(await probeServer('192.168.1.10:3001', get)).toEqual({ ok: true, url: 'http://192.168.1.10:3001' })
    expect(get).toHaveBeenNthCalledWith(2, 'http://192.168.1.10:3001/api/health/features')
  })

  it('names a TREK server without the native flag as too old', async () => {
    const get = vi.fn().mockResolvedValue(features('https://old.example.com/api/health/features', { bookingImport: true, aiParsing: false }))
    expect(await probeServer('https://old.example.com', get)).toEqual({ ok: false, reason: 'tooOld' })
  })

  it('tells a server that is not TREK apart from one that is not there', async () => {
    const html = vi.fn().mockResolvedValue({ status: 200, data: '<html>', url: 'https://x.example.com/api/health/features' })
    expect(await probeServer('https://x.example.com', html)).toEqual({ ok: false, reason: 'notTrek' })

    const missing = vi.fn().mockResolvedValue({ status: 404, data: {}, url: 'https://x.example.com/api/health/features' })
    expect(await probeServer('https://x.example.com', missing)).toEqual({ ok: false, reason: 'notTrek' })

    const down = vi.fn().mockRejectedValue(new Error('timeout'))
    expect(await probeServer('x.example.com', down)).toEqual({ ok: false, reason: 'unreachable' })
  })

  it('keeps the most telling failure across candidates', async () => {
    const get = vi.fn()
      .mockResolvedValueOnce(features('https://nas.local/api/health/features', { bookingImport: false }))
      .mockRejectedValueOnce(new Error('ECONNREFUSED'))
    expect(await probeServer('nas.local', get)).toEqual({ ok: false, reason: 'tooOld' })
  })

  it('refuses input that is not an address', async () => {
    const get = vi.fn()
    expect(await probeServer('', get)).toEqual({ ok: false, reason: 'invalid' })
    expect(get).not.toHaveBeenCalled()
  })
})
