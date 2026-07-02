/**
 * Unit tests for avatarUrl — AVATAR-URL-001 through AVATAR-URL-003.
 * The stored value is either an uploaded file name or an absolute https URL from
 * an OIDC `picture` claim (#1399); the helper resolves both to a renderable src.
 */
import { describe, it, expect } from 'vitest';
import { avatarUrl } from '../../../src/services/avatarUrl';

describe('avatarUrl', () => {
  it('AVATAR-URL-001: prefixes an uploaded file name with the avatars path', () => {
    expect(avatarUrl({ avatar: 'abc123.jpg' })).toBe('/uploads/avatars/abc123.jpg');
  });

  it('AVATAR-URL-002: passes an absolute https URL (OIDC picture) through untouched', () => {
    expect(avatarUrl({ avatar: 'https://idp.example.com/u/pic.png' })).toBe(
      'https://idp.example.com/u/pic.png',
    );
  });

  it('AVATAR-URL-003: returns null when no avatar is set', () => {
    expect(avatarUrl({ avatar: null })).toBeNull();
    expect(avatarUrl({ avatar: undefined })).toBeNull();
    expect(avatarUrl({})).toBeNull();
  });
});
