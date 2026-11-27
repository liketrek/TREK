// FE-LOGIN-MODEL-001 to FE-LOGIN-MODEL-004
import { describe, expect, it } from 'vitest';
import { headingKeys, oidcLoginHref, oidcOnlyHref, submitKey, type LoginStep } from './loginModel';

const step = (overrides: Partial<LoginStep> = {}): LoginStep => ({
  mode: 'login',
  mfaStep: false,
  passwordChangeStep: false,
  hasUsers: true,
  ...overrides,
});

describe('loginModel', () => {
  it('FE-LOGIN-MODEL-001: names each step of the sign-in', () => {
    expect(headingKeys(step())).toEqual({ title: 'login.title', subtitle: 'login.subtitle' });
    expect(headingKeys(step({ mfaStep: true })).title).toBe('login.mfaTitle');
    expect(headingKeys(step({ passwordChangeStep: true, mfaStep: true })).title).toBe('login.setNewPassword');
    expect(headingKeys(step({ mode: 'register' })).title).toBe('login.createAccount');
    expect(headingKeys(step({ mode: 'register', hasUsers: false })).title).toBe('login.createAdmin');
  });

  it('FE-LOGIN-MODEL-002: labels the submit button for the step and while it runs', () => {
    expect(submitKey(step(), false)).toBe('login.signIn');
    expect(submitKey(step(), true)).toBe('login.signingIn');
    expect(submitKey(step({ mfaStep: true }), true)).toBe('login.mfaVerify');
    expect(submitKey(step({ mode: 'register' }), false)).toBe('login.createAccount');
    expect(submitKey(step({ mode: 'register' }), true)).toBe('login.creating');
    expect(submitKey(step({ passwordChangeStep: true }), true)).toBe('settings.updatePassword');
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
