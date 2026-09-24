import { describe, it, expect } from 'vitest'
import { safeHttpUrl } from './safeUrl'

describe('safeHttpUrl', () => {
  it('FE-UTIL-SAFEURL-001: passes an ordinary https homepage through', () => {
    expect(safeHttpUrl('https://louvre.fr/en/visit')).toBe('https://louvre.fr/en/visit')
  })

  it('FE-UTIL-SAFEURL-002: passes plain http through — plenty of small venues still run it', () => {
    expect(safeHttpUrl('http://pension-alpenblick.at')).toBe('http://pension-alpenblick.at')
  })

  it('FE-UTIL-SAFEURL-003: rejects javascript:, which window.open would run in this origin', () => {
    expect(safeHttpUrl('javascript:fetch("/api/trips")')).toBeNull()
    expect(safeHttpUrl('JavaScript:alert(1)')).toBeNull()
    expect(safeHttpUrl('  javascript:alert(1)')).toBeNull()
  })

  it('FE-UTIL-SAFEURL-004: rejects the other schemes that are not a web page', () => {
    expect(safeHttpUrl('data:text/html,<script>alert(1)</script>')).toBeNull()
    expect(safeHttpUrl('vbscript:msgbox(1)')).toBeNull()
    expect(safeHttpUrl('file:///etc/passwd')).toBeNull()
  })

  it('FE-UTIL-SAFEURL-005: rejects a bare host, since window.open would treat it as a relative path', () => {
    expect(safeHttpUrl('louvre.fr')).toBeNull()
    expect(safeHttpUrl('//evil.example')).toBeNull()
  })

  // #2483: the write contract now completes a bare host to https. What is read
  // back here is the stored text, which is linked only when it is already final.
  it('FE-UTIL-SAFEURL-007: a value the contract would complete is still not linked as stored', () => {
    expect(safeHttpUrl('fr.wikipedia.org/wiki/Chapelle_Sainte-Barbe_du_Faouët')).toBeNull()
    expect(safeHttpUrl(' https://louvre.fr')).toBeNull()
    expect(safeHttpUrl('https://louvre.fr ')).toBe('https://louvre.fr ')
  })

  it('FE-UTIL-SAFEURL-006: treats absent and empty as nothing to open', () => {
    expect(safeHttpUrl(null)).toBeNull()
    expect(safeHttpUrl(undefined)).toBeNull()
    expect(safeHttpUrl('')).toBeNull()
  })
})
