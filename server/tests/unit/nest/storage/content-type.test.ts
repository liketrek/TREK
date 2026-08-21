import { describe, it, expect } from 'vitest';
import { contentTypeFor } from '../../../../src/nest/storage/content-type';

describe('contentTypeFor', () => {
  it('CTYPE-001 maps common extensions, case-insensitively, and falls back to octet-stream', () => {
    expect(contentTypeFor('files/a1b2.pdf')).toBe('application/pdf');
    expect(contentTypeFor('covers/x.JPG')).toBe('image/jpeg');
    expect(contentTypeFor('journey/clip.mp4')).toBe('video/mp4');
    expect(contentTypeFor('files/notes.txt')).toBe('text/plain');
    expect(contentTypeFor('files/archive.zip')).toBe('application/zip');
    expect(contentTypeFor('files/no-extension')).toBe('application/octet-stream');
    expect(contentTypeFor('files/weird.xyzzy')).toBe('application/octet-stream');
  });
});
