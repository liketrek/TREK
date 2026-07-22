import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

const mockBind   = vi.fn();
const mockSearch = vi.fn();
const mockUnbind = vi.fn();

vi.mock('ldapts', () => {
  return {
    Client: class MockClient {
      bind   = mockBind;
      search = mockSearch;
      unbind = mockUnbind;
    },
    InvalidCredentialsError: class InvalidCredentialsError extends Error {},
  };
});

vi.mock('node:fs', () => ({ default: { readFileSync: vi.fn(() => Buffer.from('ca-cert')) } }));

import { getLdapConfig, ldapAuthenticate } from '../../../src/services/ldapService';

describe('getLdapConfig', () => {
  afterEach(() => { delete process.env.LDAP_URL; });

  it('returns null when LDAP_URL is not set', () => {
    delete process.env.LDAP_URL;
    expect(getLdapConfig()).toBeNull();
  });

  it('returns config object when LDAP_URL is set', () => {
    process.env.LDAP_URL          = 'ldaps://ipa.example.com:636';
    process.env.LDAP_BIND_DN      = 'uid=bind,dc=example,dc=com';
    process.env.LDAP_BIND_PW      = 'secret';
    process.env.LDAP_BASE         = 'dc=example,dc=com';
    process.env.LDAP_ADMIN_GROUP  = 'cn=admins,dc=example,dc=com';
    process.env.LDAP_ALLOWED_GROUP = 'cn=users,dc=example,dc=com';
    const cfg = getLdapConfig();
    expect(cfg).not.toBeNull();
    expect(cfg!.url).toBe('ldaps://ipa.example.com:636');
    expect(cfg!.allowedGroup).toBe('cn=users,dc=example,dc=com');
  });
});

describe('ldapAuthenticate', () => {
  beforeEach(() => {
    process.env.LDAP_URL     = 'ldaps://ipa.example.com:636';
    process.env.LDAP_BIND_DN = 'uid=bind,dc=example,dc=com';
    process.env.LDAP_BIND_PW = 'secret';
    process.env.LDAP_BASE    = 'dc=example,dc=com';
    delete process.env.LDAP_ADMIN_GROUP;
    delete process.env.LDAP_ALLOWED_GROUP;
    mockBind.mockReset();
    mockSearch.mockReset();
    mockUnbind.mockReset();
  });

  afterEach(() => {
    delete process.env.LDAP_URL;
    delete process.env.LDAP_ADMIN_GROUP;
    delete process.env.LDAP_ALLOWED_GROUP;
  });

  it('returns null when user not found in LDAP', async () => {
    mockBind.mockResolvedValue(undefined);
    mockSearch.mockResolvedValue({ searchEntries: [] });
    mockUnbind.mockResolvedValue(undefined);
    expect(await ldapAuthenticate('nobody', 'pw')).toBeNull();
  });

  it('returns null on invalid credentials', async () => {
    const { InvalidCredentialsError } = await import('ldapts');
    mockBind
      .mockResolvedValueOnce(undefined)
      .mockRejectedValueOnce(new InvalidCredentialsError('invalid'));
    mockSearch.mockResolvedValue({
      searchEntries: [{ dn: 'uid=alice,dc=example,dc=com', uid: 'alice', mail: 'alice@example.com', cn: 'Alice' }],
    });
    mockUnbind.mockResolvedValue(undefined);
    expect(await ldapAuthenticate('alice', 'wrongpw')).toBeNull();
  });

  it('returns LdapUser with isAdmin=false on successful bind', async () => {
    mockBind.mockResolvedValue(undefined);
    mockSearch.mockResolvedValue({
      searchEntries: [{ dn: 'uid=alice,dc=example,dc=com', uid: 'alice', mail: 'alice@example.com', cn: 'Alice', memberOf: [] }],
    });
    mockUnbind.mockResolvedValue(undefined);
    const result = await ldapAuthenticate('alice', 'correctpw');
    expect(result).not.toBeNull();
    expect(result!.uid).toBe('alice');
    expect(result!.isAdmin).toBe(false);
  });

  it('sets isAdmin=true when user is in adminGroup', async () => {
    process.env.LDAP_ADMIN_GROUP = 'cn=trek-admins,dc=example,dc=com';
    mockBind.mockResolvedValue(undefined);
    mockSearch.mockResolvedValue({
      searchEntries: [{ dn: 'uid=bob,dc=example,dc=com', uid: 'bob', mail: 'bob@example.com', cn: 'Bob', memberOf: ['cn=trek-admins,dc=example,dc=com'] }],
    });
    mockUnbind.mockResolvedValue(undefined);
    expect((await ldapAuthenticate('bob', 'pw'))!.isAdmin).toBe(true);
  });

  it('returns null when user not in allowedGroup', async () => {
    process.env.LDAP_ALLOWED_GROUP = 'cn=trek-users,dc=example,dc=com';
    mockBind.mockResolvedValue(undefined);
    mockSearch.mockResolvedValue({
      searchEntries: [{ dn: 'uid=eve,dc=example,dc=com', uid: 'eve', mail: 'eve@example.com', cn: 'Eve', memberOf: ['cn=other,dc=example,dc=com'] }],
    });
    mockUnbind.mockResolvedValue(undefined);
    expect(await ldapAuthenticate('eve', 'pw')).toBeNull();
  });

  it('allows admin through even without allowedGroup membership', async () => {
    process.env.LDAP_ADMIN_GROUP   = 'cn=trek-admins,dc=example,dc=com';
    process.env.LDAP_ALLOWED_GROUP = 'cn=trek-users,dc=example,dc=com';
    mockBind.mockResolvedValue(undefined);
    mockSearch.mockResolvedValue({
      searchEntries: [{ dn: 'uid=admin,dc=example,dc=com', uid: 'admin', mail: 'admin@example.com', cn: 'Admin', memberOf: ['cn=trek-admins,dc=example,dc=com'] }],
    });
    mockUnbind.mockResolvedValue(undefined);
    const result = await ldapAuthenticate('admin', 'pw');
    expect(result).not.toBeNull();
    expect(result!.isAdmin).toBe(true);
  });

  it('does not inject LDAP via username special chars', async () => {
    mockBind.mockResolvedValue(undefined);
    mockSearch.mockResolvedValue({ searchEntries: [] });
    mockUnbind.mockResolvedValue(undefined);
    const result = await ldapAuthenticate('admin)(uid=*', 'pw');
    expect(result).toBeNull();
    const callArg = mockSearch.mock.calls[0][1].filter as string;
    expect(callArg).not.toContain(')(');
  });
});
