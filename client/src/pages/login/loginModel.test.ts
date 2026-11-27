// FE-LOGIN-MODEL-001 to FE-LOGIN-MODEL-004
import { describe, expect, it } from 'vitest';
import { heading, oidcLoginHref, oidcOnlyHref, submitLabel, type LoginStep } from './loginModel';

/** Returns the key itself, so the assertions read the keys. */
const t = (key: string) => key;

const step = (overrides: Partial<LoginStep> = {}): LoginStep => ({
  mode: 'login',
  mfaStep: false,
  passwordChangeStep: false,
  hasUsers: true,
  ...overrides,
});

describe('loginModel', () => {
  it('FE-LOGIN-MODEL-001: names each step of the sign-in', () => {
    expect(heading(step(), t)).toEqual({ title: 'login.title', subtitle: 'login.subtitle', plain: true });
    expect(heading(step({ mfaStep: true }), t).title).toBe('login.mfaTitle');
    expect(heading(step({ passwordChangeStep: true, mfaStep: true }), t).title).toBe('login.setNewPassword');
    expect(heading(step({ mode: 'register' }), t).title).toBe('login.createAccount');
    expect(heading(step({ mode: 'register', hasUsers: false }), t).title).toBe('login.createAdmin');
  });

  it('FE-LOGIN-MODEL-002: labels the submit button for the step and while it runs', () => {
    expect(submitLabel(step(), false, t)).toBe('login.signIn');
    expect(submitLabel(step(), true, t)).toBe('login.signingIn');
    expect(submitLabel(step({ mfaStep: true }), true, t)).toBe('login.mfaVerify');
    expect(submitLabel(step({ mode: 'register' }), false, t)).toBe('login.createAccount');
    expect(submitLabel(step({ mode: 'register' }), true, t)).toBe('login.creating');
    expect(submitLabel(step({ passwordChangeStep: true }), true, t)).toBe('settings.updatePassword');
  });

  it('FE-LOGIN-MODEL-003: carries the invite and the remember-me choice to SSO, only when signing in', () => {
    expect(oidcLoginHref('', 'login', true)).toBe('/api/auth/oidc/login?remember=1');
    expect(oidcLoginHref('', 'login', false)).toBe('/api/auth/oidc/login?remember=0');
    expect(oidcLoginHref('a b', 'login', true)).toBe('/api/auth/oidc/login?invite=a%20b&remember=1');
    expect(oidcLoginHref('', 'register', true)).toBe('/api/auth/oidc/login');
    expect(oidcLoginHref('tok', 'register', false)).toBe('/api/auth/oidc/login?invite=tok');
  });

  it('FE-LOGIN-MODEL-004: always asks for the remembered session on an OIDC-only install', () => {
    expect(oidcOnlyHref('')).toBe('/api/auth/oidc/login?remember=1');
    expect(oidcOnlyHref('tok')).toBe('/api/auth/oidc/login?invite=tok&remember=1');
  });
});
