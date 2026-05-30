import { describe, it, expect, afterEach } from 'vitest';
import { getNestPrefixes, makeNestPathMatcher } from '../../../src/nest/strangler';

describe('strangler toggle', () => {
  const original = process.env.NEST_PREFIXES;
  afterEach(() => {
    if (original === undefined) delete process.env.NEST_PREFIXES;
    else process.env.NEST_PREFIXES = original;
  });

  it('defaults to the migrated prefixes when NEST_PREFIXES is unset', () => {
    delete process.env.NEST_PREFIXES;
    expect(getNestPrefixes()).toEqual([
      '/api/_nest',
      '/api/weather',
      '/api/airports',
      '/api/config',
      '/api/system-notices',
      '/api/maps',
      '/api/categories',
      '/api/tags',
      '/api/notifications',
      '/api/addons/atlas',
      '/api/addons/vacay',
      '/api/trips/:tripId/packing',
      '/api/trips/:tripId/todo',
      '/api/trips/:tripId/budget',
      '/api/trips/:tripId/reservations',
      '/api/trips/:tripId/accommodations',
      '/api/trips/:tripId/days',
      '/api/trips/:tripId/assignments',
      '/api/trips/:tripId/places',
      '/api/trips/:tripId/collab',
      '/api/trips/:tripId/files',
      '/api/photos',
      '/api/journeys',
      '/api/public/journey',
      '/api/shared',
      '/api/settings',
      '/api/backup',
      '/api/auth/app-config',
      '/api/auth/demo-login',
      '/api/auth/invite',
      '/api/auth/register',
      '/api/auth/login',
      '/api/auth/forgot-password',
      '/api/auth/reset-password',
      '/api/auth/me',
      '/api/auth/logout',
      '/api/auth/avatar',
      '/api/auth/users',
      '/api/auth/validate-keys',
      '/api/auth/app-settings',
      '/api/auth/travel-stats',
      '/api/auth/mfa',
      '/api/auth/mcp-tokens',
      '/api/auth/ws-token',
      '/api/auth/resource-token',
      '/api/auth/oidc',
      '/api/oauth',
      '/oauth/token',
      '/oauth/userinfo',
      '/oauth/revoke',
      '/api/admin',
      '/api/trips/:tripId/share-link',
      '/api/trips|',
      '/api/trips/:tripId|',
      '/api/trips/:tripId/members',
      '/api/trips/:tripId/cover',
      '/api/trips/:tripId/copy',
      '/api/trips/:tripId/bundle',
      '/api/trips/:tripId/export.ics',
    ]);
  });

  it('parses NEST_PREFIXES (comma-separated, trimmed)', () => {
    process.env.NEST_PREFIXES = '/api/weather, /api/airports';
    expect(getNestPrefixes()).toEqual(['/api/weather', '/api/airports']);
  });

  it('treats an empty NEST_PREFIXES as "all routes on legacy"', () => {
    process.env.NEST_PREFIXES = '';
    expect(getNestPrefixes()).toEqual([]);
  });

  it('matches exact prefixes and subpaths but not lookalikes', () => {
    const match = makeNestPathMatcher(['/api/_nest']);
    expect(match('/api/_nest')).toBe(true);
    expect(match('/api/_nest/health')).toBe(true);
    expect(match('/api/_nestxyz')).toBe(false);
    expect(match('/api/health')).toBe(false);
  });

  it('exact prefixes (trailing |) match the path only, not sub-paths', () => {
    const match = makeNestPathMatcher(['/api/trips|', '/api/trips/:tripId|', '/api/trips/:tripId/members']);
    expect(match('/api/trips')).toBe(true);
    expect(match('/api/trips/5')).toBe(true);
    expect(match('/api/trips/5/members')).toBe(true);
    expect(match('/api/trips/5/members/2')).toBe(true);
    // Not-yet-migrated nested mounts stay on Express:
    expect(match('/api/trips/5/collab')).toBe(false);
    expect(match('/api/trips/5/files')).toBe(false);
    expect(match('/api/trips/5/cover')).toBe(false);
  });

  it('routes auth sub-paths via their own explicit prefixes (no broad /api/auth catch-all)', () => {
    // The account prefixes alone must NOT swallow the separately-mounted oidc flow:
    const accountOnly = makeNestPathMatcher(['/api/auth/login', '/api/auth/me', '/api/auth/mfa', '/api/auth/mcp-tokens']);
    expect(accountOnly('/api/auth/login')).toBe(true);
    expect(accountOnly('/api/auth/me/password')).toBe(true);
    expect(accountOnly('/api/auth/mfa/verify-login')).toBe(true);
    expect(accountOnly('/api/auth/mcp-tokens/abc')).toBe(true);
    expect(accountOnly('/api/auth/oidc')).toBe(false);
    expect(accountOnly('/api/auth/oidc/callback')).toBe(false);
    // oidc is matched only by its own prefix (A2):
    const withOidc = makeNestPathMatcher(['/api/auth/oidc']);
    expect(withOidc('/api/auth/oidc/login')).toBe(true);
    expect(withOidc('/api/auth/oidc/callback')).toBe(true);
  });

  it('routes the OAuth public endpoints to Nest but leaves the SDK mounts on Express (A3)', () => {
    const match = makeNestPathMatcher(['/oauth/token', '/oauth/userinfo', '/oauth/revoke', '/api/oauth']);
    expect(match('/oauth/token')).toBe(true);
    expect(match('/oauth/userinfo')).toBe(true);
    expect(match('/oauth/revoke')).toBe(true);
    expect(match('/api/oauth/clients')).toBe(true);
    expect(match('/api/oauth/authorize/validate')).toBe(true);
    // The MCP SDK handlers must stay on Express:
    expect(match('/oauth/authorize')).toBe(false);
    expect(match('/oauth/register')).toBe(false);
    expect(match('/oauth/consent')).toBe(false);
  });

  it('matches a pattern prefix with :param without capturing sibling routes', () => {
    const match = makeNestPathMatcher(['/api/trips/:tripId/packing']);
    expect(match('/api/trips/5/packing')).toBe(true);
    expect(match('/api/trips/5/packing/bags')).toBe(true);
    expect(match('/api/trips/abc/packing/123')).toBe(true);
    // Sibling trip routes stay on Express:
    expect(match('/api/trips/5/days')).toBe(false);
    expect(match('/api/trips/5/places')).toBe(false);
    expect(match('/api/trips/5')).toBe(false);
    expect(match('/api/trips/5/packingx')).toBe(false);
  });
});
