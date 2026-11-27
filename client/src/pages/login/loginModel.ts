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

type Translate = (key: string) => string;

/**
 * The heading and the line under it. `plain` is the plain sign-in, whose line
 * the app's screen leaves out. Translated here, with the keys written out, so
 * the i18n key check sees every one of them.
 */
export function heading(step: LoginStep, t: Translate): { title: string; subtitle: string; plain: boolean } {
  if (step.passwordChangeStep) {
    return { title: t('login.setNewPassword'), subtitle: t('login.setNewPasswordHint'), plain: false };
  }
  if (step.mode === 'login' && step.mfaStep) {
    return { title: t('login.mfaTitle'), subtitle: t('login.mfaSubtitle'), plain: false };
  }
  if (step.mode === 'register') {
    return step.hasUsers
      ? { title: t('login.createAccount'), subtitle: t('login.createAccountHint'), plain: false }
      : { title: t('login.createAdmin'), subtitle: t('login.createAdminHint'), plain: false };
  }
  return { title: t('login.title'), subtitle: t('login.subtitle'), plain: true };
}

/** The submit button's label; another while the request runs. */
export function submitLabel(step: LoginStep, loading: boolean, t: Translate): string {
  if (step.passwordChangeStep) return t('settings.updatePassword');
  if (step.mode === 'register') return loading ? t('login.creating') : t('login.createAccount');
  if (step.mfaStep) return t('login.mfaVerify');
  return loading ? t('login.signingIn') : t('login.signIn');
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
