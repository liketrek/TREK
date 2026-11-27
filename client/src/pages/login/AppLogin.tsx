import { AlertCircle, Eye, EyeOff, Fingerprint, Globe, Lock, Shield } from 'lucide-react';
import React, { useEffect, useRef } from 'react';
import ToggleSwitch from '../../components/Settings/ToggleSwitch';
import { useNativeServer } from '../../components/Settings/useNativeServer';
import PasswordChecklist from '../../components/shared/PasswordChecklist';
import { useTranslation } from '../../i18n';
import { lightStatusBarIcons } from '../../native/appBoot';
import './appLogin.css';
import { headingKeys, oidcLoginHref, oidcOnlyHref, submitKey, type LoginStep } from './loginModel';
import { mfaCodeInputProps } from './MfaCodeStep';
import { IDP_LOGIN_URL, type useLogin } from './useLogin';

type Login = ReturnType<typeof useLogin>;

/**
 * The sign-in screen inside the iOS and Android app. It follows the app's own
 * address screen (native-shell/), so it continues it instead of looking like a
 * web page: the same landscape on top, the card with the server just connected
 * to, the same fields and buttons. Everything it does comes from useLogin, as
 * on the browser's LoginPage; only the look and the missing language menu
 * (the device decides, see useLogin) differ.
 */
export default function AppLogin({ login }: { login: Login }) {
  useEffect(() => lightStatusBarIcons(), []);
  return (
    <div className={login.showTakeoff ? 'app-login al-leaving' : 'app-login'}>
      <AppLoginHero />
      <main className="al-body">
        <AppLoginContent login={login} />
      </main>
    </div>
  );
}

function AppLoginContent({ login }: { login: Login }) {
  const { t } = useTranslation();
  if (login.redirectScreen) {
    return (
      <div className="al-wait" role="status" aria-live="polite">
        <span className="al-spin" aria-hidden="true" />
        <p>{t('login.oidcRedirecting', { name: login.idpName })}</p>
        {login.idpSlow && (
          <a href={IDP_LOGIN_URL} onClick={login.handleSsoClick}>
            {t('login.oidcRedirectSlow', { name: login.idpName })}
          </a>
        )}
      </div>
    );
  }
  if (login.configWait) {
    return (
      <div className="al-wait" role="status" aria-label={t('common.loading')}>
        <span className="al-spin" aria-hidden="true" />
      </div>
    );
  }
  if (login.oidcOnly) return <OidcOnly login={login} />;
  return <Credentials login={login} />;
}

/** The landscape of the address screen, with the server this screen signs in to. */
function AppLoginHero() {
  const { t } = useTranslation();
  const { host, changeServer } = useNativeServer();
  const hero = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const box = hero.current;
    if (!box) return;
    let cancelled = false;
    // The same camera the address screen ends on, so the picture holds still
    // across the change of screens. The scene stops drawing once its canvas
    // has left the page.
    void import('../../../native-shell/scenery')
      .then(({ startScenery, cameraForPlan }) => {
        if (!cancelled) startScenery(box, { frame: 320, camera: cameraForPlan(1), haze: false });
      })
      .catch((err: unknown) => console.warn('Landscape unavailable:', err));
    return () => {
      cancelled = true;
      box.querySelector('canvas.scenery')?.remove();
    };
  }, []);

  return (
    <div className="al-hero" ref={hero}>
      <img className="al-logo" src="/logo-light.svg" alt="TREK" />
      {host && (
        <div className="al-card">
          <div className="al-card-text">
            <small>
              <Lock size={12} strokeWidth={2.6} aria-hidden="true" />
              {t('native.connect.yourTrek')}
            </small>
            <div className="al-host" dir="ltr">
              <Globe size={17} aria-hidden="true" />
              <span>{host}</span>
            </div>
          </div>
          <button type="button" className="al-change" onClick={changeServer} aria-label={t('native.changeServer')}>
            {t('common.change')}
          </button>
        </div>
      )}
    </div>
  );
}

function Notice({ tone, children }: { tone?: 'warn'; children: React.ReactNode }) {
  return (
    <div className={tone ? `al-notice ${tone}` : 'al-notice'} role={tone ? undefined : 'alert'}>
      <AlertCircle size={18} aria-hidden="true" />
      <div>{children}</div>
    </div>
  );
}

/**
 * A field on a white card, the label above the input, as on the address screen.
 * A control beside the input (the password's eye) sits outside the label, so
 * the label names the input alone.
 */
function Field({
  label,
  after,
  ...input
}: { label: string; after?: React.ReactNode } & React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <div className={after ? 'al-fld-wrap with-after' : 'al-fld-wrap'}>
      <label className="al-fld">
        <span className="al-lab">{label}</span>
        <input {...input} />
      </label>
      {after && <span className="al-after">{after}</span>}
    </div>
  );
}

function OidcOnly({ login }: { login: Login }) {
  const { t } = useTranslation();
  return (
    <div className="al-form">
      <h1 className="al-title">{t('login.title')}</h1>
      <p className="al-sub">{login.noRedirect ? t('login.oidcLoggedOut') : t('login.oidcOnly')}</p>
      {login.error && <Notice>{login.error}</Notice>}
      <a className="al-cta" href={oidcOnlyHref(login.inviteToken)} onClick={login.handleSsoClick}>
        <Shield size={18} aria-hidden="true" />
        {t('login.oidcSignIn', { name: login.appConfig?.oidc_display_name || 'SSO' })}
      </a>
    </div>
  );
}

function stepOf(login: Login): LoginStep {
  return {
    mode: login.mode,
    mfaStep: login.mfaStep,
    passwordChangeStep: login.passwordChangeStep,
    hasUsers: !!login.appConfig?.has_users,
  };
}

function Credentials({ login }: { login: Login }) {
  const { t } = useTranslation();
  const step = stepOf(login);
  const heading = headingKeys(step);
  const onMfa = login.mode === 'login' && login.mfaStep && !login.passwordChangeStep;
  const onAccount = !(login.mode === 'login' && login.mfaStep) && !login.passwordChangeStep;
  return (
    <>
      <form className="al-form" onSubmit={login.handleSubmit}>
        <h1 className="al-title">{t(heading.title)}</h1>
        {/* The plain sign-in needs no line under its heading; the other steps say what they ask for. */}
        {heading.subtitle !== 'login.subtitle' && <p className="al-sub">{t(heading.subtitle)}</p>}
        <Notices login={login} />
        {login.passwordChangeStep && <NewPassword login={login} />}
        {onMfa && <MfaCode login={login} />}
        {onAccount && <Account login={login} />}
        <button type="submit" className="al-cta" disabled={login.isLoading}>
          {login.isLoading && <span className="al-spin" aria-hidden="true" />}
          {t(submitKey(step, login.isLoading))}
        </button>
      </form>
      <OtherWays login={login} />
      <ModeSwitch login={login} />
      {login.mode === 'login' && onAccount && (
        <button type="button" className="al-forgot" onClick={() => login.navigate('/forgot-password')}>
          {t('login.forgotPassword')}
        </button>
      )}
    </>
  );
}

function Notices({ login }: { login: Login }) {
  const { t } = useTranslation();
  return (
    <>
      {login.error && <Notice>{login.error}</Notice>}
      {login.insecureCookie && !login.appConfig?.managed && (
        <Notice tone="warn">
          <b>{t('login.insecureCookie.title')}</b>
          {t('login.insecureCookie.body')}
          <br />
          <a href="https://github.com/liketrek/TREK/wiki/Troubleshooting" target="_blank" rel="noopener noreferrer">
            {t('login.insecureCookie.link')}
          </a>
        </Notice>
      )}
      {login.passwordChangeStep && <Notice tone="warn">{t('settings.mustChangePassword')}</Notice>}
    </>
  );
}

function NewPassword({ login }: { login: Login }) {
  const { t } = useTranslation();
  return (
    <>
      <Field
        label={t('settings.newPassword')}
        type="password"
        autoComplete="new-password"
        value={login.newPassword}
        onChange={(e) => login.setNewPassword(e.target.value)}
        required
      />
      <PasswordChecklist password={login.newPassword} className="al-check" tone="light" />
      <Field
        label={t('settings.confirmPassword')}
        type="password"
        autoComplete="new-password"
        value={login.confirmPassword}
        onChange={(e) => login.setConfirmPassword(e.target.value)}
        required
      />
    </>
  );
}

function MfaCode({ login }: { login: Login }) {
  const { t } = useTranslation();
  const back = () => {
    login.setMfaStep(false);
    login.setMfaToken('');
    login.setMfaCode('');
    login.setError('');
  };
  return (
    <>
      {/* The account the code belongs to, for password managers (see MfaCodeStep). */}
      <input
        type="text"
        name="username"
        autoComplete="username"
        value={login.email}
        readOnly
        tabIndex={-1}
        aria-hidden="true"
        className="sr-only"
      />
      <Field
        label={t('login.mfaCodeLabel')}
        {...mfaCodeInputProps(login.mfaCode, login.setMfaCode, t('login.mfaPlaceholder'))}
      />
      <p className="al-hint">{t('login.mfaHint')}</p>
      <button type="button" className="al-back" onClick={back}>
        {t('login.mfaBack')}
      </button>
    </>
  );
}

function Account({ login }: { login: Login }) {
  const { t } = useTranslation();
  const registering = login.mode === 'register';
  return (
    <>
      {registering && (
        <Field
          label={t('login.username')}
          type="text"
          autoComplete="username"
          autoCapitalize="none"
          value={login.username}
          onChange={(e) => login.setUsername(e.target.value)}
          required
          placeholder="admin"
        />
      )}
      <Field
        label={t('common.email')}
        type="email"
        autoComplete={registering ? 'email' : 'username'}
        inputMode="email"
        autoCapitalize="none"
        value={login.email}
        onChange={(e) => login.setEmail(e.target.value)}
        required
        placeholder={t('login.emailPlaceholder')}
      />
      <Field
        label={t('common.password')}
        type={login.showPassword ? 'text' : 'password'}
        autoComplete={registering ? 'new-password' : 'current-password'}
        value={login.password}
        onChange={(e) => login.setPassword(e.target.value)}
        required
        placeholder="••••••••"
        after={
          <button
            type="button"
            className="al-eye"
            onClick={() => login.setShowPassword((v) => !v)}
            aria-label={t('native.claim.showPassword')}
            aria-pressed={login.showPassword}
          >
            {login.showPassword ? <EyeOff size={19} /> : <Eye size={19} />}
          </button>
        }
      />
      {registering && <PasswordChecklist password={login.password} className="al-check" tone="light" />}
      {!registering && <LoginOptions login={login} />}
    </>
  );
}

function LoginOptions({ login }: { login: Login }) {
  const { t } = useTranslation();
  const toggle = () => login.setRememberMe(!login.rememberMe);
  return (
    <div className="al-options">
      <div className="al-remember">
        <ToggleSwitch on={login.rememberMe} onToggle={toggle} label={t('login.rememberMe')} />
        {/* The caption repeats the switch's own name; a tap on it is a shortcut for the switch. */}
        <span aria-hidden="true" onClick={toggle}>
          {t('login.rememberMe')}
        </span>
      </div>
    </div>
  );
}

/** SSO, a passkey and the demo: the ways in besides the password. */
function OtherWays({ login }: { login: Login }) {
  const { t } = useTranslation();
  const config = login.appConfig;
  const sso = !!(config?.oidc_configured && config?.oidc_login && !login.oidcOnly);
  const passkey = !!(
    config?.passkey_login &&
    config?.passkey_configured &&
    login.mode === 'login' &&
    !login.mfaStep &&
    !login.passwordChangeStep
  );
  if (!sso && !passkey && !config?.demo_mode) return null;
  return (
    <div className="al-alt">
      {(sso || passkey) && <div className="al-or">{t('common.or')}</div>}
      {sso && (
        <a
          className="al-cta2"
          href={oidcLoginHref(login.inviteToken, login.mode, login.rememberMe)}
          onClick={login.handleSsoClick}
        >
          <Shield size={18} aria-hidden="true" />
          {t('login.oidcSignIn', { name: config?.oidc_display_name })}
        </a>
      )}
      {passkey && (
        <button type="button" className="al-cta2" onClick={login.handlePasskeyLogin} disabled={login.isLoading}>
          <Fingerprint size={18} aria-hidden="true" />
          {t('login.passkey.signIn')}
        </button>
      )}
      {config?.demo_mode && (
        <button type="button" className="al-cta al-demo" onClick={login.handleDemoLogin} disabled={login.isLoading}>
          {t('login.demoHint')}
        </button>
      )}
    </div>
  );
}

function ModeSwitch({ login }: { login: Login }) {
  const { t } = useTranslation();
  const config = login.appConfig;
  if (!login.showRegisterOption || !config?.has_users || config?.demo_mode || login.passwordChangeStep) return null;
  const toggle = () => {
    login.setMode((m) => (m === 'login' ? 'register' : 'login'));
    login.setError('');
    login.setMfaStep(false);
    login.setMfaToken('');
    login.setMfaCode('');
  };
  return (
    <p className="al-switch">
      {t(login.mode === 'login' ? 'login.noAccount' : 'login.hasAccount')}{' '}
      <button type="button" onClick={toggle}>
        {t(login.mode === 'login' ? 'login.register' : 'login.signIn')}
      </button>
    </p>
  );
}
