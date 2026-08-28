import {
  ChevronDown,
  Eye,
  EyeOff,
  Fingerprint,
  Globe,
  KeyRound,
  Lock,
  Mail,
  Plane,
  Shield,
  User,
} from 'lucide-react';
import React from 'react';
import ToggleSwitch from '../components/Settings/ToggleSwitch';
import { SUPPORTED_LANGUAGES, useTranslation } from '../i18n';
import { useLogin } from './login/useLogin';
import LoginWorld from './login/LoginWorld';

/** Fixed so the sky does not reshuffle on every render. */
const STARFIELD = [
  { top: 6, left: 12, size: 1, opacity: 0.3, delay: 0 },
  { top: 11, left: 68, size: 2, opacity: 0.22, delay: 1.4 },
  { top: 17, left: 34, size: 1, opacity: 0.35, delay: 2.6 },
  { top: 22, left: 84, size: 1, opacity: 0.25, delay: 0.7 },
  { top: 28, left: 19, size: 2, opacity: 0.2, delay: 3.1 },
  { top: 33, left: 57, size: 1, opacity: 0.32, delay: 1.9 },
  { top: 39, left: 91, size: 1, opacity: 0.24, delay: 2.2 },
  { top: 46, left: 8, size: 1, opacity: 0.28, delay: 0.4 },
  { top: 52, left: 73, size: 2, opacity: 0.18, delay: 3.6 },
  { top: 58, left: 42, size: 1, opacity: 0.3, delay: 1.1 },
  { top: 64, left: 88, size: 1, opacity: 0.26, delay: 2.9 },
  { top: 71, left: 26, size: 1, opacity: 0.22, delay: 0.9 },
  { top: 77, left: 63, size: 1, opacity: 0.3, delay: 3.3 },
  { top: 83, left: 15, size: 2, opacity: 0.2, delay: 1.7 },
  { top: 88, left: 79, size: 1, opacity: 0.27, delay: 2.4 },
  { top: 93, left: 48, size: 1, opacity: 0.23, delay: 0.2 },
];

export default function LoginPage(): React.ReactElement {
  const { t, language } = useTranslation();
  // Page = wiring container: the whole auth surface lives in the useLogin hook.
  const {
    navigate,
    mode,
    setMode,
    username,
    setUsername,
    email,
    setEmail,
    password,
    setPassword,
    rememberMe,
    setRememberMe,
    showPassword,
    setShowPassword,
    isLoading,
    error,
    setError,
    insecureCookie,
    appConfig,
    inviteToken,
    langDropdownOpen,
    setLangDropdownOpen,
    setLanguageLocal,
    showTakeoff,
    mfaStep,
    setMfaStep,
    mfaToken,
    setMfaToken,
    mfaCode,
    setMfaCode,
    passwordChangeStep,
    newPassword,
    setNewPassword,
    confirmPassword,
    setConfirmPassword,
    noRedirect,
    showRegisterOption,
    oidcOnly,
    handleDemoLogin,
    handleSubmit,
    handlePasskeyLogin,
  } = useLogin();

  const oidcButtonShown = !!(appConfig?.oidc_configured && appConfig?.oidc_login && !oidcOnly);
  const passkeyAvailable = !!(
    appConfig?.passkey_login &&
    appConfig?.passkey_configured &&
    !oidcOnly &&
    mode === 'login' &&
    !mfaStep &&
    !passwordChangeStep
  );

  const inputBase: React.CSSProperties = {
    width: '100%',
    padding: '11px 12px 11px 40px',
    border: '1px solid #e5e7eb',
    borderRadius: 12,
    fontSize: 'calc(14px * var(--fs-scale-body, 1))',
    fontFamily: 'inherit',
    outline: 'none',
    color: '#111827',
    background: 'white',
    boxSizing: 'border-box',
    transition: 'border-color 0.15s',
  };

  if (showTakeoff) {
    return (
      <div
        className="takeoff-overlay"
        style={{ position: 'fixed', inset: 0, zIndex: 99999, overflow: 'hidden', background: '#070c1a' }}
      >
        {/* Signing in picks up exactly where the login panel left off: the same dot
            map, except now every route departs at once. The network finishing is
            the moment — no separate imagery, no plane flying off alone. */}
        <div className="takeoff-world">
          <LoginWorld variant="takeoff" />
        </div>

        {/* The colour rises with the departures rather than sitting there from the start. */}
        <div className="takeoff-aurora takeoff-aurora-a" />
        <div className="takeoff-aurora takeoff-aurora-b" />

        <div className="takeoff-mark">
          <img src="/logo-light.svg" alt="TREK" style={{ height: 'clamp(58px, 5.2vw, 84px)' }} />
          <p
            style={{
              margin: '12px 0 0',
              fontSize: 'calc(clamp(15px, 1.35vw, 21px) * var(--fs-scale-title, 1))',
              color: 'rgba(255,255,255,0.62)',
              fontFamily: "'MuseoModerno', sans-serif",
              textTransform: 'lowercase',
              whiteSpace: 'nowrap',
              textShadow: '0 2px 10px rgba(4,8,20,0.6)',
            }}
          >
            {t('login.tagline')}
          </p>
        </div>

        {/* Hands over to the app instead of cutting to it. */}
        <div className="takeoff-veil" />

        <style>{`
          .takeoff-world {
            position: absolute;
            inset: 0;
            opacity: 0;
            animation: takeoffWorld 2600ms cubic-bezier(0.22,1,0.36,1) forwards;
          }
          @keyframes takeoffWorld {
            0%   { opacity: 0; transform: scale(1.14); }
            18%  { opacity: 1; }
            100% { opacity: 1; transform: scale(1); }
          }

          .takeoff-aurora {
            position: absolute;
            border-radius: 50%;
            filter: blur(110px);
            opacity: 0;
          }
          .takeoff-aurora-a {
            width: 46vw; height: 46vw; top: -8%; left: 4%;
            background: radial-gradient(circle, rgba(79,70,229,0.55) 0%, rgba(79,70,229,0) 70%);
            animation: takeoffGlow 2600ms ease-out forwards;
          }
          .takeoff-aurora-b {
            width: 38vw; height: 38vw; bottom: -10%; right: 6%;
            background: radial-gradient(circle, rgba(6,182,212,0.4) 0%, rgba(6,182,212,0) 72%);
            animation: takeoffGlow 2600ms ease-out 220ms forwards;
          }
          @keyframes takeoffGlow {
            0%   { opacity: 0; }
            55%  { opacity: 1; }
            100% { opacity: 0.75; }
          }

          .takeoff-mark {
            position: absolute;
            top: 50%; left: 50%;
            display: flex;
            flex-direction: column;
            align-items: center;
            transform: translate(-50%, -50%);
            opacity: 0;
            filter: drop-shadow(0 2px 12px rgba(4,8,20,0.6)) drop-shadow(0 0 40px rgba(4,8,20,0.5));
            animation: takeoffMark 2600ms cubic-bezier(0.22,1,0.36,1) forwards;
          }
          @keyframes takeoffMark {
            0%, 22% { opacity: 0; transform: translate(-50%, -50%) scale(0.94); }
            48%     { opacity: 1; transform: translate(-50%, -50%) scale(1); }
            88%     { opacity: 1; transform: translate(-50%, -50%) scale(1); }
            100%    { opacity: 1; transform: translate(-50%, -50%) scale(1.03); }
          }

          .takeoff-veil {
            position: absolute;
            inset: 0;
            background: #f9fafb;
            opacity: 0;
            animation: takeoffVeil 2600ms ease-in forwards;
          }
          @keyframes takeoffVeil {
            0%, 82% { opacity: 0; }
            100%    { opacity: 1; }
          }

          @media (prefers-reduced-motion: reduce) {
            .takeoff-world, .takeoff-aurora, .takeoff-mark { animation: none; opacity: 1; transform: none; }
            .takeoff-mark { transform: translate(-50%, -50%); }
            .takeoff-veil { animation: takeoffVeil 2600ms linear forwards; }
          }
        `}</style>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', fontFamily: 'var(--font-system)', position: 'relative' }}>
      {/* Language dropdown */}
      <div style={{ position: 'absolute', top: 16, right: 16, zIndex: 10 }}>
        <button type="button"
          onClick={(e) => {
            e.stopPropagation();
            setLangDropdownOpen((o) => !o);
          }}
          aria-haspopup="listbox"
          aria-expanded={langDropdownOpen}
          aria-label="Change language"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            padding: '6px 12px',
            borderRadius: 99,
            background: 'rgba(0,0,0,0.06)',
            border: 'none',
            fontSize: 'calc(13px * var(--fs-scale-body, 1))',
            fontWeight: 500,
            color: '#374151',
            cursor: 'pointer',
            fontFamily: 'inherit',
            transition: 'background 0.15s',
          }}
          onMouseEnter={(e: React.MouseEvent<HTMLButtonElement>) =>
            (e.currentTarget.style.background = 'rgba(0,0,0,0.1)')
          }
          onMouseLeave={(e: React.MouseEvent<HTMLButtonElement>) =>
            (e.currentTarget.style.background = 'rgba(0,0,0,0.06)')
          }
        >
          <Globe size={14} />
          {SUPPORTED_LANGUAGES.find((l) => l.value === language)?.label ?? language.toUpperCase()}
          <ChevronDown
            size={12}
            style={{ transition: 'transform 0.15s', transform: langDropdownOpen ? 'rotate(180deg)' : 'none' }}
          />
        </button>

        {langDropdownOpen && (
          <div
            role="listbox"
            aria-label="Select language"
            tabIndex={-1}
            /* Both handlers do the one job: keep the event from reaching the
               document listener that closes the dropdown. The options below are
               real buttons and carry the keyboard interaction themselves. */
            onClick={(e) => e.stopPropagation()}
            onKeyDown={(e) => e.stopPropagation()}
            style={{
              position: 'absolute',
              top: '100%',
              right: 0,
              marginTop: 4,
              background: 'white',
              borderRadius: 12,
              boxShadow: '0 4px 24px rgba(0,0,0,0.12)',
              border: '1px solid rgba(0,0,0,0.08)',
              minWidth: 190,
              maxHeight: 320,
              overflowY: 'auto',
            }}
          >
            {SUPPORTED_LANGUAGES.map(({ value, label }) => (
              <button type="button"
                key={value}
                role="option"
                aria-selected={value === language}
                onClick={() => {
                  setLanguageLocal(value);
                  setLangDropdownOpen(false);
                }}
                style={{
                  display: 'block',
                  width: '100%',
                  textAlign: 'left',
                  padding: '9px 16px',
                  border: 'none',
                  background: value === language ? 'rgba(99,102,241,0.08)' : 'transparent',
                  color: value === language ? '#4f46e5' : '#374151',
                  fontWeight: value === language ? 600 : 400,
                  fontSize: 'calc(14px * var(--fs-scale-body, 1))',
                  cursor: 'pointer',
                  fontFamily: 'inherit',
                  transition: 'background 0.1s',
                }}
                onMouseEnter={(e: React.MouseEvent<HTMLButtonElement>) => {
                  if (value !== language) e.currentTarget.style.background = 'rgba(0,0,0,0.04)';
                }}
                onMouseLeave={(e: React.MouseEvent<HTMLButtonElement>) => {
                  if (value !== language) e.currentTarget.style.background = 'transparent';
                }}
              >
                {label}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Left — branding */}
      <div
        style={{
          display: 'none',
          width: '55%',
          background: '#070c1a',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          padding: '60px 48px',
          position: 'relative',
          overflow: 'hidden',
        }}
        className="lg-panel"
      >
        <style>{`@media(min-width:1024px){.lg-panel{display:flex!important}}`}</style>

        {/* Aurora — three drifting colour fields. They are the whole background:
            deep indigo, a cold cyan and a warm violet, blurred past recognition so
            what is left is the gradient, not the shapes. */}
        <div className="login-aurora login-aurora-a" />
        <div className="login-aurora login-aurora-b" />
        <div className="login-aurora login-aurora-c" />

        {/* Depth: a handful of pinpricks, far enough back to read as distance. */}
        <div style={{ position: 'absolute', inset: 0, overflow: 'hidden' }}>
          {STARFIELD.map((s, i) => (
            <div
              key={i}
              className="login-star"
              style={{
                position: 'absolute',
                width: s.size,
                height: s.size,
                borderRadius: '50%',
                background: 'white',
                opacity: s.opacity,
                top: `${s.top}%`,
                left: `${s.left}%`,
                animationDelay: `${s.delay}s`,
              }}
            />
          ))}
        </div>

        {/* Coastlines as a dot map, with routes lighting up between cities across
            it. The geometry is TREK's own Atlas bundle, baked in at build time
            because this screen is unauthenticated. */}
        <LoginWorld />

        {/* No max-width: the tagline stays on one line, so the block is allowed to
            use the whole panel rather than wrapping inside it. */}
        <div style={{ position: 'relative', zIndex: 1, maxWidth: '100%', textAlign: 'center' }}>
          {/* Logo. The soft dark halo is what separates it from the dot map behind —
              wide and low-opacity rather than a hard drop shadow, so it reads as the
              map dimming around the mark instead of an outline. */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 12 }}>
            <img
              src="/logo-light.svg"
              alt="TREK"
              style={{
                height: 'clamp(58px, 5.2vw, 84px)',
                filter: 'drop-shadow(0 2px 10px rgba(4,8,20,0.55)) drop-shadow(0 0 34px rgba(4,8,20,0.45))',
              }}
            />
          </div>

          <h2
            style={{
              margin: 0,
              // Scales with the panel so it stays on one line in every language.
              fontSize: 'calc(clamp(32px, 2.95vw, 46px) * var(--fs-scale-title, 1))',
              fontWeight: 700,
              color: 'white',
              lineHeight: 1.15,
              letterSpacing: '-0.02em',
              fontFamily: "'MuseoModerno', sans-serif",
              textTransform: 'lowercase',
              whiteSpace: 'nowrap',
              textShadow: '0 2px 10px rgba(4,8,20,0.55), 0 0 34px rgba(4,8,20,0.5)',
            }}
          >
            {t('login.tagline')}
          </h2>
          <p
            style={{
              margin: '10px 0 0',
              // Must never wrap: the panel is a fixed share of the viewport, so the
              // size follows it and a long translation shrinks instead of breaking.
              fontSize: 'calc(clamp(11px, 1.05vw, 16px) * var(--fs-scale-subtitle, 1))',
              whiteSpace: 'nowrap',
              color: 'rgba(255,255,255,0.62)',
              lineHeight: 1.7,
              textShadow: '0 1px 8px rgba(4,8,20,0.6), 0 0 24px rgba(4,8,20,0.45)',
            }}
          >
            {t('login.description')}
          </p>
        </div>
      </div>

      {/* Right — form */}
      <div
        style={{
          flex: 1,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '32px 24px',
          background: '#f9fafb',
        }}
      >
        <div style={{ width: '100%', maxWidth: 400 }}>
          {/* Mobile logo */}
          <div
            style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, marginBottom: 36 }}
            className="mobile-logo"
          >
            <style>{`@media(min-width:1024px){.mobile-logo{display:none!important}}`}</style>
            <img src="/logo-dark.svg" alt="TREK" style={{ height: 48 }} />
            <p
              style={{
                margin: 0,
                fontSize: 'calc(16px * var(--fs-scale-subtitle, 1))',
                color: '#9ca3af',
                fontFamily: "'MuseoModerno', sans-serif",
                textTransform: 'lowercase',
                whiteSpace: 'nowrap',
              }}
            >
              {t('login.tagline')}
            </p>
          </div>

          <div
            style={{
              background: 'white',
              borderRadius: 20,
              border: '1px solid #e5e7eb',
              padding: '36px 32px',
              boxShadow: '0 2px 16px rgba(0,0,0,0.06)',
            }}
          >
            {oidcOnly ? (
              <>
                <h2
                  style={{
                    margin: '0 0 4px',
                    fontSize: 'calc(22px * var(--fs-scale-title, 1))',
                    fontWeight: 800,
                    color: '#111827',
                  }}
                >
                  {t('login.title')}
                </h2>
                <p style={{ margin: '0 0 24px', fontSize: 'calc(13.5px * var(--fs-scale-body, 1))', color: '#9ca3af' }}>
                  {noRedirect ? t('login.oidcLoggedOut') : t('login.oidcOnly')}
                </p>
                {error && (
                  <div
                    style={{
                      padding: '10px 14px',
                      background: '#fef2f2',
                      border: '1px solid #fecaca',
                      borderRadius: 10,
                      fontSize: 'calc(13px * var(--fs-scale-body, 1))',
                      color: '#dc2626',
                      marginBottom: 16,
                    }}
                  >
                    {error}
                  </div>
                )}
                <a
                  href={`/api/auth/oidc/login${inviteToken ? '?invite=' + encodeURIComponent(inviteToken) : ''}`}
                  style={{
                    width: '100%',
                    padding: '12px',
                    background: '#111827',
                    color: 'white',
                    border: 'none',
                    borderRadius: 12,
                    fontSize: 'calc(14px * var(--fs-scale-body, 1))',
                    fontWeight: 700,
                    cursor: 'pointer',
                    fontFamily: 'inherit',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 8,
                    textDecoration: 'none',
                    transition: 'background 180ms cubic-bezier(0.23,1,0.32,1)',
                    boxSizing: 'border-box',
                  }}
                  onMouseEnter={(e: React.MouseEvent<HTMLAnchorElement>) => {
                    e.currentTarget.style.background = '#1f2937';
                  }}
                  onMouseLeave={(e: React.MouseEvent<HTMLAnchorElement>) => {
                    e.currentTarget.style.background = '#111827';
                  }}
                >
                  <Shield size={16} />
                  {t('login.oidcSignIn', { name: appConfig?.oidc_display_name || 'SSO' })}
                </a>
              </>
            ) : (
              <>
                <h2
                  style={{
                    margin: '0 0 4px',
                    fontSize: 'calc(22px * var(--fs-scale-title, 1))',
                    fontWeight: 800,
                    color: '#111827',
                  }}
                >
                  {passwordChangeStep
                    ? t('login.setNewPassword')
                    : mode === 'login' && mfaStep
                      ? t('login.mfaTitle')
                      : mode === 'register'
                        ? !appConfig?.has_users
                          ? t('login.createAdmin')
                          : t('login.createAccount')
                        : t('login.title')}
                </h2>
                <p style={{ margin: '0 0 28px', fontSize: 'calc(13.5px * var(--fs-scale-body, 1))', color: '#9ca3af' }}>
                  {passwordChangeStep
                    ? t('login.setNewPasswordHint')
                    : mode === 'login' && mfaStep
                      ? t('login.mfaSubtitle')
                      : mode === 'register'
                        ? !appConfig?.has_users
                          ? t('login.createAdminHint')
                          : t('login.createAccountHint')
                        : t('login.subtitle')}
                </p>

                <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                  {error && (
                    <div
                      style={{
                        padding: '10px 14px',
                        background: '#fef2f2',
                        border: '1px solid #fecaca',
                        borderRadius: 10,
                        fontSize: 'calc(13px * var(--fs-scale-body, 1))',
                        color: '#dc2626',
                      }}
                    >
                      {error}
                    </div>
                  )}

                  {insecureCookie && !appConfig?.managed && (
                    <div
                      style={{
                        padding: '12px 14px',
                        background: '#fffbeb',
                        border: '1px solid #fde68a',
                        borderRadius: 10,
                        fontSize: 'calc(13px * var(--fs-scale-body, 1))',
                        color: '#92400e',
                      }}
                    >
                      <div style={{ fontWeight: 700, marginBottom: 4 }}>{t('login.insecureCookie.title')}</div>
                      <div style={{ lineHeight: 1.55 }}>{t('login.insecureCookie.body')}</div>
                    </div>
                  )}

                  {passwordChangeStep && (
                    <>
                      <div
                        style={{
                          padding: '10px 14px',
                          background: '#fefce8',
                          border: '1px solid #fde68a',
                          borderRadius: 10,
                          fontSize: 'calc(13px * var(--fs-scale-body, 1))',
                          color: '#92400e',
                        }}
                      >
                        {t('settings.mustChangePassword')}
                      </div>
                      <div>
                        <label
                          style={{
                            display: 'block',
                            fontSize: 'calc(12.5px * var(--fs-scale-body, 1))',
                            fontWeight: 600,
                            color: '#374151',
                            marginBottom: 6,
                          }}
                        >
                          {t('settings.newPassword')}
                        </label>
                        <div style={{ position: 'relative' }}>
                          <Lock
                            size={15}
                            className="text-[#9ca3af]"
                            style={{
                              position: 'absolute',
                              left: 13,
                              top: '50%',
                              transform: 'translateY(-50%)',
                              pointerEvents: 'none',
                            }}
                          />
                          <input
                            type="password"
                            value={newPassword}
                            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewPassword(e.target.value)}
                            required
                            placeholder={t('settings.newPassword')}
                            style={inputBase}
                            onFocus={(e: React.FocusEvent<HTMLInputElement>) =>
                              (e.target.style.borderColor = '#111827')
                            }
                            onBlur={(e: React.FocusEvent<HTMLInputElement>) => (e.target.style.borderColor = '#e5e7eb')}
                          />
                        </div>
                      </div>
                      <div>
                        <label
                          style={{
                            display: 'block',
                            fontSize: 'calc(12.5px * var(--fs-scale-body, 1))',
                            fontWeight: 600,
                            color: '#374151',
                            marginBottom: 6,
                          }}
                        >
                          {t('settings.confirmPassword')}
                        </label>
                        <div style={{ position: 'relative' }}>
                          <Lock
                            size={15}
                            className="text-[#9ca3af]"
                            style={{
                              position: 'absolute',
                              left: 13,
                              top: '50%',
                              transform: 'translateY(-50%)',
                              pointerEvents: 'none',
                            }}
                          />
                          <input
                            type="password"
                            value={confirmPassword}
                            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setConfirmPassword(e.target.value)}
                            required
                            placeholder={t('settings.confirmPassword')}
                            style={inputBase}
                            onFocus={(e: React.FocusEvent<HTMLInputElement>) =>
                              (e.target.style.borderColor = '#111827')
                            }
                            onBlur={(e: React.FocusEvent<HTMLInputElement>) => (e.target.style.borderColor = '#e5e7eb')}
                          />
                        </div>
                      </div>
                    </>
                  )}

                  {mode === 'login' && mfaStep && !passwordChangeStep && (
                    <div>
                      <label
                        style={{
                          display: 'block',
                          fontSize: 'calc(12.5px * var(--fs-scale-body, 1))',
                          fontWeight: 600,
                          color: '#374151',
                          marginBottom: 6,
                        }}
                      >
                        {t('login.mfaCodeLabel')}
                      </label>
                      <div style={{ position: 'relative' }}>
                        <KeyRound
                          size={15}
                          className="text-[#9ca3af]"
                          style={{
                            position: 'absolute',
                            left: 13,
                            top: '50%',
                            transform: 'translateY(-50%)',
                            pointerEvents: 'none',
                          }}
                        />
                        <input
                          type="text"
                          inputMode="text"
                          autoComplete="one-time-code"
                          value={mfaCode}
                          onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                            setMfaCode(e.target.value.toUpperCase().slice(0, 24))
                          }
                          placeholder="000000 or XXXX-XXXX"
                          required
                          autoFocus
                          style={inputBase}
                          onFocus={(e: React.FocusEvent<HTMLInputElement>) => (e.target.style.borderColor = '#111827')}
                          onBlur={(e: React.FocusEvent<HTMLInputElement>) => (e.target.style.borderColor = '#e5e7eb')}
                        />
                      </div>
                      <p style={{ fontSize: 'calc(12px * var(--fs-scale-body, 1))', color: '#9ca3af', marginTop: 8 }}>
                        {t('login.mfaHint')}
                      </p>
                      <button
                        type="button"
                        onClick={() => {
                          setMfaStep(false);
                          setMfaToken('');
                          setMfaCode('');
                          setError('');
                        }}
                        style={{
                          marginTop: 8,
                          background: 'none',
                          border: 'none',
                          color: '#6b7280',
                          fontSize: 'calc(13px * var(--fs-scale-body, 1))',
                          cursor: 'pointer',
                          padding: 0,
                          fontFamily: 'inherit',
                        }}
                      >
                        {t('login.mfaBack')}
                      </button>
                    </div>
                  )}

                  {/* Username (register only) */}
                  {mode === 'register' && !passwordChangeStep && (
                    <div>
                      <label
                        style={{
                          display: 'block',
                          fontSize: 'calc(12.5px * var(--fs-scale-body, 1))',
                          fontWeight: 600,
                          color: '#374151',
                          marginBottom: 6,
                        }}
                      >
                        {t('login.username')}
                      </label>
                      <div style={{ position: 'relative' }}>
                        <User
                          size={15}
                          className="text-[#9ca3af]"
                          style={{
                            position: 'absolute',
                            left: 13,
                            top: '50%',
                            transform: 'translateY(-50%)',
                            pointerEvents: 'none',
                          }}
                        />
                        <input
                          type="text"
                          value={username}
                          onChange={(e: React.ChangeEvent<HTMLInputElement>) => setUsername(e.target.value)}
                          required
                          placeholder="admin"
                          style={inputBase}
                          onFocus={(e: React.FocusEvent<HTMLInputElement>) => (e.target.style.borderColor = '#111827')}
                          onBlur={(e: React.FocusEvent<HTMLInputElement>) => (e.target.style.borderColor = '#e5e7eb')}
                        />
                      </div>
                    </div>
                  )}

                  {/* Email */}
                  {!(mode === 'login' && mfaStep) && !passwordChangeStep && (
                    <div>
                      <label
                        style={{
                          display: 'block',
                          fontSize: 'calc(12.5px * var(--fs-scale-body, 1))',
                          fontWeight: 600,
                          color: '#374151',
                          marginBottom: 6,
                        }}
                      >
                        {t('common.email')}
                      </label>
                      <div style={{ position: 'relative' }}>
                        <Mail
                          size={15}
                          className="text-[#9ca3af]"
                          style={{
                            position: 'absolute',
                            left: 13,
                            top: '50%',
                            transform: 'translateY(-50%)',
                            pointerEvents: 'none',
                          }}
                        />
                        <input
                          type="email"
                          value={email}
                          onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEmail(e.target.value)}
                          required
                          placeholder={t('login.emailPlaceholder')}
                          style={inputBase}
                          onFocus={(e: React.FocusEvent<HTMLInputElement>) => (e.target.style.borderColor = '#111827')}
                          onBlur={(e: React.FocusEvent<HTMLInputElement>) => (e.target.style.borderColor = '#e5e7eb')}
                        />
                      </div>
                    </div>
                  )}

                  {/* Password */}
                  {!(mode === 'login' && mfaStep) && !passwordChangeStep && (
                    <div>
                      <label
                        style={{
                          display: 'block',
                          fontSize: 'calc(12.5px * var(--fs-scale-body, 1))',
                          fontWeight: 600,
                          color: '#374151',
                          marginBottom: 6,
                        }}
                      >
                        {t('common.password')}
                      </label>
                      <div style={{ position: 'relative' }}>
                        <Lock
                          size={15}
                          className="text-[#9ca3af]"
                          style={{
                            position: 'absolute',
                            left: 13,
                            top: '50%',
                            transform: 'translateY(-50%)',
                            pointerEvents: 'none',
                          }}
                        />
                        <input
                          type={showPassword ? 'text' : 'password'}
                          value={password}
                          onChange={(e: React.ChangeEvent<HTMLInputElement>) => setPassword(e.target.value)}
                          required
                          placeholder="••••••••"
                          style={{ ...inputBase, paddingRight: 44 }}
                          onFocus={(e: React.FocusEvent<HTMLInputElement>) => (e.target.style.borderColor = '#111827')}
                          onBlur={(e: React.FocusEvent<HTMLInputElement>) => (e.target.style.borderColor = '#e5e7eb')}
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword((v) => !v)}
                          style={{
                            position: 'absolute',
                            right: 12,
                            top: '50%',
                            transform: 'translateY(-50%)',
                            background: 'none',
                            border: 'none',
                            cursor: 'pointer',
                            padding: 2,
                            color: '#9ca3af',
                            width: 22,
                            height: 22,
                          }}
                        >
                          <Eye
                            size={16}
                            style={{
                              position: 'absolute',
                              inset: 3,
                              opacity: showPassword ? 0 : 1,
                              transform: showPassword ? 'scale(0.7) rotate(-20deg)' : 'scale(1) rotate(0)',
                              transition:
                                'opacity 180ms cubic-bezier(0.23,1,0.32,1), transform 180ms cubic-bezier(0.23,1,0.32,1)',
                            }}
                          />
                          <EyeOff
                            size={16}
                            style={{
                              position: 'absolute',
                              inset: 3,
                              opacity: showPassword ? 1 : 0,
                              transform: showPassword ? 'scale(1) rotate(0)' : 'scale(0.7) rotate(20deg)',
                              transition:
                                'opacity 180ms cubic-bezier(0.23,1,0.32,1), transform 180ms cubic-bezier(0.23,1,0.32,1)',
                            }}
                          />
                        </button>
                      </div>
                      {mode === 'login' && (
                        <div
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            gap: 12,
                            marginTop: 8,
                          }}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <ToggleSwitch
                              on={rememberMe}
                              onToggle={() => setRememberMe(!rememberMe)}
                              label={t('login.rememberMe')}
                            />
                            {/* The visible caption repeats the switch's own aria-label and
                                clicking it is a mouse shortcut for hitting the switch.
                                Hidden from assistive tech so it does not read out as a
                                second "Remember me" control: the switch above is the one
                                that carries the name, the focus and the keyboard. */}
                            <span
                              aria-hidden="true"
                              onClick={() => setRememberMe(!rememberMe)}
                              style={{
                                cursor: 'pointer',
                                color: '#374151',
                                fontSize: 'calc(12.5px * var(--fs-scale-body, 1))',
                                fontWeight: 500,
                                userSelect: 'none',
                              }}
                            >
                              {t('login.rememberMe')}
                            </span>
                          </div>
                          <button
                            type="button"
                            onClick={() => navigate('/forgot-password')}
                            style={{
                              background: 'none',
                              border: 'none',
                              cursor: 'pointer',
                              padding: 0,
                              color: '#6b7280',
                              fontSize: 'calc(12.5px * var(--fs-scale-body, 1))',
                              fontWeight: 500,
                              fontFamily: 'inherit',
                            }}
                            onMouseEnter={(e: React.MouseEvent<HTMLButtonElement>) => {
                              e.currentTarget.style.color = '#111827';
                            }}
                            onMouseLeave={(e: React.MouseEvent<HTMLButtonElement>) => {
                              e.currentTarget.style.color = '#6b7280';
                            }}
                          >
                            {t('login.forgotPassword')}
                          </button>
                        </div>
                      )}
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={isLoading}
                    style={{
                      marginTop: 4,
                      width: '100%',
                      padding: '12px',
                      background: '#111827',
                      color: 'white',
                      border: 'none',
                      borderRadius: 12,
                      fontSize: 'calc(14px * var(--fs-scale-body, 1))',
                      fontWeight: 700,
                      cursor: isLoading ? 'default' : 'pointer',
                      fontFamily: 'inherit',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: 8,
                      opacity: isLoading ? 0.7 : 1,
                      transition: 'opacity 0.15s',
                    }}
                    onMouseEnter={(e: React.MouseEvent<HTMLButtonElement>) => {
                      if (!isLoading) e.currentTarget.style.background = '#1f2937';
                    }}
                    onMouseLeave={(e: React.MouseEvent<HTMLButtonElement>) =>
                      (e.currentTarget.style.background = '#111827')
                    }
                  >
                    {isLoading ? (
                      <>
                        <div
                          style={{
                            width: 15,
                            height: 15,
                            border: '2px solid rgba(255,255,255,0.3)',
                            borderTopColor: 'white',
                            borderRadius: '50%',
                            animation: 'spin 0.7s linear infinite',
                          }}
                        />
                        {passwordChangeStep
                          ? t('settings.updatePassword')
                          : mode === 'register'
                            ? t('login.creating')
                            : mode === 'login' && mfaStep
                              ? t('login.mfaVerify')
                              : t('login.signingIn')}
                      </>
                    ) : (
                      <>
                        <Plane size={16} />
                        {passwordChangeStep
                          ? t('settings.updatePassword')
                          : mode === 'register'
                            ? t('login.createAccount')
                            : mode === 'login' && mfaStep
                              ? t('login.mfaVerify')
                              : t('login.signIn')}
                      </>
                    )}
                  </button>
                </form>

                {/* Toggle login/register */}
                {showRegisterOption && appConfig?.has_users && !appConfig?.demo_mode && !passwordChangeStep && (
                  <p
                    style={{
                      textAlign: 'center',
                      marginTop: 16,
                      fontSize: 'calc(13px * var(--fs-scale-body, 1))',
                      color: '#9ca3af',
                    }}
                  >
                    {mode === 'login' ? t('login.noAccount') + ' ' : t('login.hasAccount') + ' '}
                    <button type="button"
                      onClick={() => {
                        setMode((m) => (m === 'login' ? 'register' : 'login'));
                        setError('');
                        setMfaStep(false);
                        setMfaToken('');
                        setMfaCode('');
                      }}
                      style={{
                        background: 'none',
                        border: 'none',
                        color: '#111827',
                        fontWeight: 600,
                        cursor: 'pointer',
                        fontFamily: 'inherit',
                        fontSize: 'calc(13px * var(--fs-scale-body, 1))',
                      }}
                    >
                      {mode === 'login' ? t('login.register') : t('login.signIn')}
                    </button>
                  </p>
                )}
              </>
            )}
          </div>

          {/* OIDC / SSO login button (only when OIDC is configured, oidc_login enabled, not in oidc-only mode) */}
          {appConfig?.oidc_configured && appConfig?.oidc_login && !oidcOnly && (
            <>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginTop: 16 }}>
                <div style={{ flex: 1, height: 1, background: '#e5e7eb' }} />
                <span style={{ fontSize: 'calc(12px * var(--fs-scale-body, 1))', color: '#9ca3af' }}>
                  {t('common.or')}
                </span>
                <div style={{ flex: 1, height: 1, background: '#e5e7eb' }} />
              </div>
              <a
                href={`/api/auth/oidc/login${
                  inviteToken ? '?invite=' + encodeURIComponent(inviteToken) : ''
                }${
                  // The remember-me toggle only renders in login mode; in
                  // register mode omit the param so the server default applies.
                  mode === 'login' ? (inviteToken ? '&' : '?') + 'remember=' + (rememberMe ? '1' : '0') : ''
                }`}
                style={{
                  marginTop: 12,
                  width: '100%',
                  padding: '12px',
                  background: 'white',
                  color: '#374151',
                  border: '1px solid #d1d5db',
                  borderRadius: 12,
                  fontSize: 'calc(14px * var(--fs-scale-body, 1))',
                  fontWeight: 600,
                  cursor: 'pointer',
                  fontFamily: 'inherit',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 8,
                  textDecoration: 'none',
                  transition:
                    'background 180ms cubic-bezier(0.23,1,0.32,1), border-color 180ms cubic-bezier(0.23,1,0.32,1)',
                  boxSizing: 'border-box',
                }}
                onMouseEnter={(e: React.MouseEvent<HTMLAnchorElement>) => {
                  e.currentTarget.style.background = '#f9fafb';
                  e.currentTarget.style.borderColor = '#9ca3af';
                }}
                onMouseLeave={(e: React.MouseEvent<HTMLAnchorElement>) => {
                  e.currentTarget.style.background = 'white';
                  e.currentTarget.style.borderColor = '#d1d5db';
                }}
              >
                <Shield size={16} />
                {t('login.oidcSignIn', { name: appConfig.oidc_display_name })}
              </a>
            </>
          )}

          {/* Passkey login button (instance toggle on + a usable RP ID resolves) */}
          {passkeyAvailable && (
            <>
              {!oidcButtonShown && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginTop: 16 }}>
                  <div style={{ flex: 1, height: 1, background: '#e5e7eb' }} />
                  <span style={{ fontSize: 'calc(12px * var(--fs-scale-body, 1))', color: '#9ca3af' }}>
                    {t('common.or')}
                  </span>
                  <div style={{ flex: 1, height: 1, background: '#e5e7eb' }} />
                </div>
              )}
              <button
                type="button"
                onClick={handlePasskeyLogin}
                disabled={isLoading}
                style={{
                  marginTop: 12,
                  width: '100%',
                  padding: '12px',
                  background: 'white',
                  color: '#374151',
                  border: '1px solid #d1d5db',
                  borderRadius: 12,
                  fontSize: 'calc(14px * var(--fs-scale-body, 1))',
                  fontWeight: 600,
                  cursor: isLoading ? 'default' : 'pointer',
                  fontFamily: 'inherit',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 8,
                  opacity: isLoading ? 0.7 : 1,
                  transition:
                    'background 180ms cubic-bezier(0.23,1,0.32,1), border-color 180ms cubic-bezier(0.23,1,0.32,1)',
                  boxSizing: 'border-box',
                }}
                onMouseEnter={(e: React.MouseEvent<HTMLButtonElement>) => {
                  if (!isLoading) {
                    e.currentTarget.style.background = '#f9fafb';
                    e.currentTarget.style.borderColor = '#9ca3af';
                  }
                }}
                onMouseLeave={(e: React.MouseEvent<HTMLButtonElement>) => {
                  e.currentTarget.style.background = 'white';
                  e.currentTarget.style.borderColor = '#d1d5db';
                }}
              >
                <Fingerprint size={16} />
                {t('login.passkey.signIn')}
              </button>
            </>
          )}

          {/* Demo login button */}
          {appConfig?.demo_mode && (
            <button type="button"
              onClick={handleDemoLogin}
              disabled={isLoading}
              style={{
                marginTop: 16,
                width: '100%',
                padding: '14px',
                background: 'linear-gradient(135deg, #f59e0b, #d97706)',
                color: '#451a03',
                border: 'none',
                borderRadius: 14,
                fontSize: 'calc(15px * var(--fs-scale-subtitle, 1))',
                fontWeight: 700,
                cursor: isLoading ? 'default' : 'pointer',
                fontFamily: 'inherit',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 10,
                opacity: isLoading ? 0.7 : 1,
                transition:
                  'transform 200ms cubic-bezier(0.23,1,0.32,1), box-shadow 200ms cubic-bezier(0.23,1,0.32,1), opacity 200ms cubic-bezier(0.23,1,0.32,1)',
                boxShadow: '0 2px 12px rgba(245, 158, 11, 0.3)',
              }}
              onMouseEnter={(e: React.MouseEvent<HTMLButtonElement>) => {
                if (!isLoading) e.currentTarget.style.transform = 'translateY(-1px)';
                e.currentTarget.style.boxShadow = '0 4px 16px rgba(245, 158, 11, 0.4)';
              }}
              onMouseLeave={(e: React.MouseEvent<HTMLButtonElement>) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = '0 2px 12px rgba(245, 158, 11, 0.3)';
              }}
            >
              <Plane size={18} />
              {t('login.demoHint')}
            </button>
          )}
        </div>
      </div>

      <button
        type="button"
        onClick={() => navigate('/legal')}
        className="fixed bottom-3 right-4 z-20 text-xs text-white/60 underline"
      >
        {t('legal.title')}
      </button>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg) } }

        /* ── Branding panel ──────────────────────────────────────────────────
           Aurora: three colour fields, blurred far past their own shape, drifting
           on different periods so the gradient never repeats a frame exactly. */
        .login-aurora {
          position: absolute;
          border-radius: 50%;
          filter: blur(90px);
          will-change: transform;
        }
        .login-aurora-a {
          width: 620px; height: 620px; top: -12%; left: -14%;
          background: radial-gradient(circle, rgba(79,70,229,0.55) 0%, rgba(79,70,229,0) 68%);
          animation: auroraA 34s ease-in-out infinite;
        }
        .login-aurora-b {
          width: 520px; height: 520px; bottom: -16%; right: -10%;
          background: radial-gradient(circle, rgba(6,182,212,0.4) 0%, rgba(6,182,212,0) 70%);
          animation: auroraB 44s ease-in-out infinite;
        }
        .login-aurora-c {
          width: 460px; height: 460px; top: 42%; left: 34%;
          background: radial-gradient(circle, rgba(168,85,247,0.32) 0%, rgba(168,85,247,0) 72%);
          animation: auroraC 52s ease-in-out infinite;
        }
        @keyframes auroraA {
          0%, 100% { transform: translate3d(0,0,0) scale(1); }
          33%      { transform: translate3d(14%, 18%, 0) scale(1.14); }
          66%      { transform: translate3d(26%, 4%, 0) scale(0.94); }
        }
        @keyframes auroraB {
          0%, 100% { transform: translate3d(0,0,0) scale(1.05); }
          40%      { transform: translate3d(-22%, -14%, 0) scale(0.9); }
          70%      { transform: translate3d(-8%, -28%, 0) scale(1.2); }
        }
        @keyframes auroraC {
          0%, 100% { transform: translate3d(0,0,0) scale(0.95); }
          50%      { transform: translate3d(-18%, 12%, 0) scale(1.25); }
        }

        @keyframes twinkle {
          0%, 100% { opacity: 0.15; }
          50% { opacity: 0.5; }
        }
        .login-star { animation: twinkle 3s ease-in-out infinite; }


        /* Ambient only — the world map holds still. */
        @media (prefers-reduced-motion: reduce) {
          .login-aurora, .login-star { animation: none; }
        }

      `}</style>
    </div>
  );
}
