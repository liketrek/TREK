import { describe, it, expect } from 'vitest'
import { translateApiError } from './translateApiError'

// Mimics the real t(): returns a translation for known keys, the key itself otherwise.
const dict: Record<string, string> = {
  'files.uploadErrorType': "This file type isn't supported",
  'files.uploadError': 'Upload failed',
}
const t = (key: string) => dict[key] ?? key

describe('translateApiError', () => {
  it('resolves a server message that is a known i18n key', () => {
    const err = new Error('files.uploadErrorType')
    expect(translateApiError(t, err, 'files.uploadError')).toBe("This file type isn't supported")
  })

  it('falls back to the generic key when the message is a plain string', () => {
    const err = new Error('Some raw server message')
    expect(translateApiError(t, err, 'files.uploadError')).toBe('Upload failed')
  })

  it('falls back when the message is an empty string', () => {
    expect(translateApiError(t, new Error(''), 'files.uploadError')).toBe('Upload failed')
  })

  it('falls back when the thrown value is not an Error', () => {
    expect(translateApiError(t, 'nope', 'files.uploadError')).toBe('Upload failed')
    expect(translateApiError(t, undefined, 'files.uploadError')).toBe('Upload failed')
  })
})
