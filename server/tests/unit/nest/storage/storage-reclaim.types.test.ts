/**
 * The reference parser every reclaim source builds on (#2924): which objects a
 * stored value names, in every spelling the columns hold. A key reported too
 * many only keeps an object; one missed would delete it, so the cases lean on
 * the spellings the validators let through (absolute self-URLs, queries,
 * relative journey covers, legacy file names). RCLP-001 to RCLP-012.
 */
import {
  referencedAmong,
  storageKeysIn,
  uploadKeysIn,
  type StorageKeyOptions,
  type StorageKeyRef,
} from '../../../../src/nest/storage/storage-reclaim.types';

import { describe, expect, it } from 'vitest';

const ref = (category: string, key: string): StorageKeyRef => ({ category, key });

describe('uploadKeysIn', () => {
  it('RCLP-001: finds the path in its plain, slash-less and absolute self-URL spellings', () => {
    expect(uploadKeysIn('/uploads/covers/a.jpg')).toEqual([ref('covers', 'a.jpg')]);
    expect(uploadKeysIn('uploads/files/b.pdf')).toEqual([ref('files', 'b.pdf')]);
    expect(uploadKeysIn('https://trip.example.com/uploads/places/c.png')).toEqual([ref('places', 'c.png')]);
    expect(uploadKeysIn('HTTPS://HOST/Uploads/Covers/D.JPG')).toEqual([ref('covers', 'D.JPG')]);
  });

  it('RCLP-002: drops a query or a fragment, decodes and trims the key', () => {
    expect(uploadKeysIn('/uploads/places/x.jpg?v=2')).toEqual([ref('places', 'x.jpg')]);
    expect(uploadKeysIn('/uploads/places/x.jpg#top')).toEqual([ref('places', 'x.jpg')]);
    expect(uploadKeysIn('  /uploads/covers/y.jpg  ')).toEqual([ref('covers', 'y.jpg')]);
    expect(uploadKeysIn('/uploads/photos/my%20photo.jpg')).toEqual([
      ref('photos', 'my%20photo.jpg'),
      ref('photos', 'my photo.jpg'),
      ref('photos', 'my'),
    ]);
  });

  it('RCLP-003: finds every path in a text, each cut where the next begins or the text ends', () => {
    expect(uploadKeysIn('see /uploads/covers/a.jpg and "/uploads/places/b.jpg" too')).toEqual([
      ref('covers', 'a.jpg and'),
      ref('covers', 'a.jpg'),
      ref('places', 'b.jpg'),
    ]);
    expect(uploadKeysIn('/uploads/covers/a.jpg/uploads/places/b.jpg')).toEqual([
      ref('covers', 'a.jpg'),
      ref('places', 'b.jpg'),
    ]);
  });

  it('RCLP-004: keeps a nested key whole and refuses empty or climbing keys', () => {
    expect(uploadKeysIn('/uploads/journey/thumbs/abc.jpg')).toEqual([ref('journey', 'thumbs/abc.jpg')]);
    expect(uploadKeysIn('/uploads/covers/')).toEqual([]);
    expect(uploadKeysIn('/uploads/covers/../avatars/a.jpg')).toEqual([]);
    expect(uploadKeysIn('/uploads/covers/%2E%2E/x')).toEqual([ref('covers', '%2E%2E/x')]);
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
    expect(uploadKeysIn('/uploads/covers/100%.jpg')).toEqual([ref('covers', '100%.jpg')]);
  });
});

describe('storageKeysIn', () => {
  it('RCLP-007: reads the relative <category>/<key> spelling of journey covers', () => {
    expect(storageKeysIn('covers/a.jpg')).toEqual([ref('covers', 'a.jpg')]);
    expect(storageKeysIn('journey/b.jpg?x=1')).toEqual([ref('journey', 'b.jpg')]);
    expect(storageKeysIn('./journey/thumbs/c.jpg')).toEqual([ref('journey', 'thumbs/c.jpg')]);
    expect(storageKeysIn('notacategory/a.jpg')).toEqual([]);
  });

  it('RCLP-008: a bare name belongs to the column category, a URL or a path does not', () => {
    expect(storageKeysIn('a1b2.jpg', { bare: 'avatars' })).toEqual([ref('avatars', 'a1b2.jpg')]);
    expect(storageKeysIn('https://idp.example.com/pic.jpg', { bare: 'avatars' })).toEqual([]);
    expect(storageKeysIn('some/dir/x.pdf', { bare: 'files' })).toEqual([]);
    expect(storageKeysIn('a1b2.jpg')).toEqual([]);
  });

  it('RCLP-009: with basename, a legacy path still names its last segment', () => {
    expect(storageKeysIn('files/x.pdf', { bare: 'files', basename: true })).toEqual([
      ref('files', 'x.pdf'),
      ref('files', 'x.pdf'),
    ]);
    expect(storageKeysIn('/uploads/files/y.pdf', { bare: 'files', basename: true })).toEqual([
      ref('files', 'y.pdf'),
      ref('files', 'y.pdf'),
    ]);
    expect(storageKeysIn('C:\\old\\uploads\\z.pdf', { bare: 'files', basename: true })).toEqual([
      ref('files', 'z.pdf'),
    ]);
  });

  it('RCLP-010: names nothing for a blank or a non-string', () => {
    expect(storageKeysIn('   ', { bare: 'files' })).toEqual([]);
    expect(storageKeysIn('?only=query', { bare: 'files' })).toEqual([]);
    expect(storageKeysIn(null)).toEqual([]);
    expect(storageKeysIn(42 as unknown as string)).toEqual([]);
  });
});

describe('referencedAmong', () => {
  it('RCLP-011: answers the candidates of one category the values name, without regard to case', () => {
    const values = ['/uploads/covers/A.JPG', 'covers/b.jpg', '/uploads/places/c.jpg', null, 'https://elsewhere/x'];
    expect(referencedAmong('covers', ['a.jpg', 'b.jpg', 'c.jpg', 'd.jpg'], values)).toEqual(
      new Set(['a.jpg', 'b.jpg']),
    );
    expect(referencedAmong('places', ['c.jpg'], values)).toEqual(new Set(['c.jpg']));
  });

  it('RCLP-012: passes the column options on, so a bare avatar name keeps its object', () => {
    const avatarColumn: StorageKeyOptions = { bare: 'avatars' };
    expect(referencedAmong('avatars', ['u1.png'], ['u1.png'], avatarColumn)).toEqual(new Set(['u1.png']));
    expect(
      referencedAmong('avatars', ['u1.png', 'u2.png'], ['u1.png', 'https://idp/u2.png'], { bare: 'avatars' }),
    ).toEqual(new Set(['u1.png']));
  });
});
