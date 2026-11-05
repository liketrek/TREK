/**
 * The reference parser every reclaim source builds on (#2924): which objects a
 * stored value names, in every spelling the columns hold. A key reported too
 * many only keeps an object; one missed would delete it, so the cases lean on
 * the spellings the validators let through (absolute self-URLs, queries,
 * relative journey covers, legacy file names) and on object names that hold
 * the characters a URL treats as special. RCLP-001 to RCLP-016.
 */
import {
  keySearchCore,
  keysNamedIn,
  storageKeysIn,
  storageOwnerMarkerInstall,
  storageOwnerMarkerKey,
  uploadKeysIn,
  type StorageKeyOptions,
  type StorageKeyRef,
} from '../../../../src/nest/storage/storage-reclaim.types';

import { describe, expect, it } from 'vitest';

/** The keys of one category among the refs, as a set: the order and the repeats do not matter to a source. */
function keysIn(refs: StorageKeyRef[], category: string): Set<string> {
  return new Set(refs.filter((ref) => ref.category === category).map((ref) => ref.key));
}

describe('uploadKeysIn', () => {
  it('RCLP-001: finds the path in its plain, slash-less and absolute self-URL spellings', () => {
    expect(keysIn(uploadKeysIn('/uploads/covers/a.jpg'), 'covers')).toEqual(new Set(['a.jpg']));
    expect(keysIn(uploadKeysIn('uploads/files/b.pdf'), 'files')).toEqual(new Set(['b.pdf']));
    expect(keysIn(uploadKeysIn('https://trip.example.com/uploads/places/c.png'), 'places')).toEqual(new Set(['c.png']));
    expect(keysIn(uploadKeysIn('HTTPS://HOST/Uploads/Covers/D.JPG'), 'covers')).toEqual(new Set(['D.JPG']));
  });

  it('RCLP-002: reports the key as it stands and cut at a query or fragment, decoded and trimmed', () => {
    expect(keysIn(uploadKeysIn('/uploads/places/x.jpg?v=2'), 'places')).toEqual(new Set(['x.jpg?v=2', 'x.jpg']));
    expect(keysIn(uploadKeysIn('/uploads/places/x.jpg#top'), 'places')).toEqual(new Set(['x.jpg#top', 'x.jpg']));
    expect([...keysIn(uploadKeysIn('  /uploads/covers/y.jpg  '), 'covers')]).toContain('y.jpg');
    expect(keysIn(uploadKeysIn('/uploads/photos/my%20photo.jpg'), 'photos')).toEqual(
      new Set(['my%20photo.jpg', 'my photo.jpg', 'my']),
    );
  });

  it('RCLP-003: finds every path in a text, each cut where the next begins or the text ends', () => {
    const refs = uploadKeysIn('see /uploads/covers/a.jpg and "/uploads/places/b.jpg" too');
    expect(keysIn(refs, 'covers')).toEqual(new Set(['a.jpg and ', 'a.jpg and', 'a.jpg']));
    expect(keysIn(refs, 'places')).toEqual(new Set(['b.jpg']));
    const joined = uploadKeysIn('/uploads/covers/a.jpg/uploads/places/b.jpg');
    expect(keysIn(joined, 'covers')).toEqual(new Set(['a.jpg']));
    expect(keysIn(joined, 'places')).toEqual(new Set(['b.jpg']));
  });

  it('RCLP-004: keeps a nested key whole and reports nothing for an empty one', () => {
    expect(keysIn(uploadKeysIn('/uploads/journey/thumbs/abc.jpg'), 'journey')).toEqual(new Set(['thumbs/abc.jpg']));
    expect(uploadKeysIn('/uploads/covers/')).toEqual([]);
    // A climbing key names no object a listing yields; reporting it only keeps.
    expect([...keysIn(uploadKeysIn('/uploads/covers/%2E%2E/x'), 'covers')]).toContain('%2E%2E/x');
  });

  it('RCLP-005: names nothing for empty values, other hosts and other paths', () => {
    expect(uploadKeysIn(null)).toEqual([]);
    expect(uploadKeysIn(undefined)).toEqual([]);
    expect(uploadKeysIn('')).toEqual([]);
    expect(uploadKeysIn('https://images.unsplash.com/photo-123?w=800')).toEqual([]);
    expect(uploadKeysIn('/api/maps/place-photo/abc/bytes')).toEqual([]);
    expect(uploadKeysIn('/my-uploads/covers/a.jpg')).toEqual([]);
  });

  it('RCLP-006: a broken percent sequence keeps the raw key', () => {
    expect(keysIn(uploadKeysIn('/uploads/covers/100%.jpg'), 'covers')).toEqual(new Set(['100%.jpg']));
  });
});

describe('storageKeysIn', () => {
  it('RCLP-007: reads the relative <category>/<key> spelling of journey covers', () => {
    expect(keysIn(storageKeysIn('covers/a.jpg'), 'covers')).toEqual(new Set(['a.jpg']));
    expect(keysIn(storageKeysIn('journey/b.jpg?x=1'), 'journey')).toEqual(new Set(['b.jpg?x=1', 'b.jpg']));
    expect(keysIn(storageKeysIn('./journey/thumbs/c.jpg'), 'journey')).toEqual(new Set(['thumbs/c.jpg']));
    expect(storageKeysIn('notacategory/a.jpg')).toEqual([]);
  });

  it('RCLP-008: a bare name belongs to the column category, a URL or a path does not', () => {
    expect(keysIn(storageKeysIn('a1b2.jpg', { bare: 'avatars' }), 'avatars')).toEqual(new Set(['a1b2.jpg']));
    expect(storageKeysIn('https://idp.example.com/pic.jpg', { bare: 'avatars' })).toEqual([]);
    expect(keysIn(storageKeysIn('some/dir/x.pdf', { bare: 'files' }), 'files')).toEqual(new Set());
    expect(storageKeysIn('a1b2.jpg')).toEqual([]);
  });

  it('RCLP-009: with basename, a legacy path still names its last segment', () => {
    const options: StorageKeyOptions = { bare: 'files', basename: true };
    expect(keysIn(storageKeysIn('files/x.pdf', options), 'files')).toEqual(new Set(['x.pdf']));
    expect(keysIn(storageKeysIn('/uploads/files/y.pdf', options), 'files')).toEqual(new Set(['y.pdf']));
    expect(keysIn(storageKeysIn('C:\\old\\uploads\\z.pdf', options), 'files')).toEqual(new Set(['z.pdf']));
  });

  it('RCLP-010: names nothing for a blank or a non-string, and only the raw text for a bare query', () => {
    expect(storageKeysIn('   ', { bare: 'files' })).toEqual([]);
    expect(keysIn(storageKeysIn('?only=query', { bare: 'files' }), 'files')).toEqual(new Set(['?only=query']));
    expect(storageKeysIn(null)).toEqual([]);
    expect(storageKeysIn(42 as unknown as string)).toEqual([]);
  });

  it('RCLP-013: a bare name holding a #, a ? or a trailing blank is reported untouched first', () => {
    // An upload's key is <uuid><extname>, and extname takes whatever follows the last dot.
    const options: StorageKeyOptions = { bare: 'files', basename: true };
    expect([...keysIn(storageKeysIn('0f8e2b7c. #4711', options), 'files')]).toContain('0f8e2b7c. #4711');
    expect([...keysIn(storageKeysIn('0f8e2b7c.c#', options), 'files')]).toContain('0f8e2b7c.c#');
    expect([...keysIn(storageKeysIn('0f8e2b7c.v2?final', options), 'files')]).toContain('0f8e2b7c.v2?final');
    expect([...keysIn(storageKeysIn('0f8e2b7c.pdf ', options), 'files')]).toContain('0f8e2b7c.pdf ');
    expect([...keysIn(storageKeysIn('legacy/0f8e2b7c. #4711', options), 'files')]).toContain('0f8e2b7c. #4711');
    // The URL spellings keep the raw tail too, so a path naming such an object keeps it.
    expect([...keysIn(storageKeysIn('/uploads/files/0f8e2b7c.c#'), 'files')]).toContain('0f8e2b7c.c#');
  });
});

describe('keysNamedIn', () => {
  it('RCLP-011: answers the keys of one category the values name, lowercased', () => {
    const values = ['/uploads/covers/A.JPG', 'covers/b.jpg', '/uploads/places/c.jpg', null, 'https://elsewhere/x'];
    expect(keysNamedIn('covers', values)).toEqual(new Set(['a.jpg', 'b.jpg']));
    expect(keysNamedIn('places', values)).toEqual(new Set(['c.jpg']));
  });

  it('RCLP-012: passes the column options on, so a bare avatar name keeps its object', () => {
    const avatarColumn: StorageKeyOptions = { bare: 'avatars' };
    expect(keysNamedIn('avatars', ['U1.png', 'https://idp/u2.png'], avatarColumn)).toEqual(new Set(['u1.png']));
  });
});

describe('keySearchCore', () => {
  it('RCLP-014: the longest plain run a row naming the key in any spelling holds verbatim', () => {
    expect(keySearchCore('0F8E2B7C-1D2A-4C3B-9E8F-7A6B5C4D3E2F.jpg')).toBe('0f8e2b7c-1d2a-4c3b-9e8f-7a6b5c4d3e2f');
    expect(keySearchCore('0f8e2b7c-1d2a. #4711')).toBe('0f8e2b7c-1d2a');
    expect(keySearchCore('my photo.jpg')).toBeNull();
    expect(keySearchCore('a.jpg')).toBeNull();
  });
});

describe('owner markers', () => {
  it('RCLP-015: the marker key names the install, and only a marker key reads as one', () => {
    const id = '0f8e2b7c-1d2a-4c3b-9e8f-7a6b5c4d3e2f';
    expect(storageOwnerMarkerKey(id)).toBe(`trek-owner-${id}`);
    expect(storageOwnerMarkerInstall(storageOwnerMarkerKey(id))).toBe(id);
    expect(storageOwnerMarkerInstall('0f8e2b7c.jpg')).toBeNull();
    expect(storageOwnerMarkerInstall('trek-owner-')).toBeNull();
    expect(storageOwnerMarkerInstall(`sub/trek-owner-${id}`)).toBeNull();
  });

  it('RCLP-016: a marker key is a valid root-level key no upload is ever named', () => {
    const key = storageOwnerMarkerKey('0f8e2b7c-1d2a-4c3b-9e8f-7a6b5c4d3e2f');
    expect(key.includes('/')).toBe(false);
    expect(key.startsWith('.')).toBe(false);
  });
});
