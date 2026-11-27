// What the sign-in screens say and where their buttons lead, shared by the
// browser's LoginPage and the app's AppLogin, so the two cannot drift apart.

export type LoginMode = 'login' | 'register';

export interface LoginStep {
  mode: LoginMode;
  mfaStep: boolean;
  passwordChangeStep: boolean;
  /** False on a fresh install, where the first account becomes the admin. */
  hasUsers: boolean;
}

/** The heading and the line under it, as translation keys. */
export function headingKeys(step: LoginStep): { title: string; subtitle: string } {
  if (step.passwordChangeStep) return { title: 'login.setNewPassword', subtitle: 'login.setNewPasswordHint' };
  if (step.mode === 'login' && step.mfaStep) return { title: 'login.mfaTitle', subtitle: 'login.mfaSubtitle' };
  if (step.mode === 'register') {
    return step.hasUsers
      ? { title: 'login.createAccount', subtitle: 'login.createAccountHint' }
      : { title: 'login.createAdmin', subtitle: 'login.createAdminHint' };
  }
  return { title: 'login.title', subtitle: 'login.subtitle' };
}

/** The submit button's label, as a translation key; another while the request runs. */
export function submitKey(step: LoginStep, loading: boolean): string {
  if (step.passwordChangeStep) return 'settings.updatePassword';
  if (step.mode === 'register') return loading ? 'login.creating' : 'login.createAccount';
  if (step.mfaStep) return 'login.mfaVerify';
  return loading ? 'login.signingIn' : 'login.signIn';
}

/**
 * The SSO button beside the password form. The remember-me switch only shows in
 * login mode; in register mode the parameter stays off so the server default applies.
 */
export function oidcLoginHref(inviteToken: string, mode: LoginMode, rememberMe: boolean): string {
  const params: string[] = [];
  if (inviteToken) params.push('invite=' + encodeURIComponent(inviteToken));
  if (mode === 'login') params.push('remember=' + (rememberMe ? '1' : '0'));
  return '/api/auth/oidc/login' + (params.length ? '?' + params.join('&') : '');
}

/**
 * The only button in OIDC-only mode. No remember-me switch there: the IdP owns
 * the session policy, so it always asks for the remembered lifetime (#1927).
 */
export function oidcOnlyHref(inviteToken: string): string {
  return `/api/auth/oidc/login${inviteToken ? '?invite=' + encodeURIComponent(inviteToken) + '&' : '?'}remember=1`;
}
