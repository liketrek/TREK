import React, { ChangeEvent } from 'react'
import { Lock, KeyRound, CheckCircle2, AlertTriangle, Eye, EyeOff } from 'lucide-react'
import { useTranslation } from '../i18n'
import { useResetPassword } from './resetPassword/useResetPassword'

const inputBase: React.CSSProperties = {
  width: '100%', padding: '11px 44px 11px 38px', borderRadius: 12,
  border: '1px solid #e5e7eb', fontSize: 14, fontFamily: 'inherit',
  outline: 'none', transition: 'border-color 120ms',
  background: 'white', color: '#111827',
}

const ResetPasswordPage: React.FC = () => {
  const { t } = useTranslation()
  // Page = wiring container: token, form state, validation + submit live in the hook.
  const {
    navigate, token,
    pw, setPw, pw2, setPw2, showPw, setShowPw,
    mfaCode, setMfaCode, mfaRequired, error, success, isLoading,
    handleSubmit,
  } = useResetPassword()

  const shell = (inner: React.ReactNode) => (
    <div style={{
      minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: 'linear-gradient(180deg, #f9fafb, #ffffff)', padding: 24, fontFamily: 'inherit',
    }}>
      <div style={{
        width: '100%', maxWidth: 440, background: 'white', borderRadius: 20,
        boxShadow: '0 12px 40px rgba(0,0,0,0.06), 0 2px 8px rgba(0,0,0,0.04)',
        padding: '32px 28px',
      }}>{inner}</div>
    </div>
  )

  if (success) {
    return shell(
      <div style={{ textAlign: 'center', padding: '12px 0' }}>
        <div style={{
          width: 56, height: 56, borderRadius: '50%', background: '#ecfdf5',
          display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
          color: '#059669', marginBottom: 16,
        }}><CheckCircle2 size={28} /></div>
        <h1 style={{ fontSize: 22, fontWeight: 700, color: '#111827', margin: '0 0 10px 0' }}>
          {t('login.resetPasswordSuccessTitle')}
        </h1>
        <p style={{ fontSize: 14, color: '#4b5563', lineHeight: 1.55, margin: 0 }}>
          {t('login.resetPasswordSuccessBody')}
        </p>
        <button type="button" onClick={() => navigate('/login')} style={{
          marginTop: 24, padding: '11px 22px', background: '#111827', color: 'white',
          border: 'none', borderRadius: 12, fontSize: 14, fontWeight: 700,
          cursor: 'pointer', fontFamily: 'inherit',
        }}>{t('login.signIn')}</button>
      </div>
    )
  }

  if (!token) {
    return shell(
      <div style={{ textAlign: 'center', padding: '12px 0' }}>
        <div style={{
          width: 56, height: 56, borderRadius: '50%', background: '#fef2f2',
          display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
          color: '#dc2626', marginBottom: 16,
        }}><AlertTriangle size={28} /></div>
        <h1 style={{ fontSize: 22, fontWeight: 700, color: '#111827', margin: '0 0 10px 0' }}>
          {t('login.resetPasswordInvalidLink')}
        </h1>
        <p style={{ fontSize: 14, color: '#4b5563', lineHeight: 1.55, margin: 0 }}>
          {t('login.resetPasswordInvalidLinkBody')}
        </p>
        <button type="button" onClick={() => navigate('/forgot-password')} style={{
          marginTop: 24, padding: '11px 22px', background: '#111827', color: 'white',
          border: 'none', borderRadius: 12, fontSize: 14, fontWeight: 700,
          cursor: 'pointer', fontFamily: 'inherit',
        }}>{t('login.forgotPasswordSubmit')}</button>
      </div>
    )
  }

  return shell(
    <>
      <h1 style={{ fontSize: 22, fontWeight: 700, color: '#111827', margin: '0 0 8px 0' }}>
        {t('login.resetPasswordTitle')}
      </h1>
      <p style={{ fontSize: 13.5, color: '#6b7280', lineHeight: 1.55, margin: '0 0 22px 0' }}>
        {mfaRequired ? t('login.resetPasswordMfaBody') : t('login.resetPasswordBody')}
      </p>
      {error && (
        <div style={{
          padding: '10px 12px', background: '#fef2f2', border: '1px solid #fecaca',
          borderRadius: 10, color: '#991b1b', fontSize: 13, marginBottom: 14,
        }}>{error}</div>
      )}
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        {!mfaRequired && (
          <>
            <div>
              <label style={{ display: 'block', fontSize: 12.5, fontWeight: 600, color: '#374151', marginBottom: 6 }}>
                {t('login.newPassword')}
              </label>
              <div style={{ position: 'relative' }}>
                <Lock size={15} className="text-[#9ca3af]" style={{ position: 'absolute', left: 13, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }} />
                <input
                  type={showPw ? 'text' : 'password'} value={pw}
                  onChange={(e: ChangeEvent<HTMLInputElement>) => setPw(e.target.value)}
                  required placeholder="••••••••" style={inputBase}
                  onFocus={(e) => { e.currentTarget.style.borderColor = '#111827' }}
                  onBlur={(e) => { e.currentTarget.style.borderColor = '#e5e7eb' }}
                />
                <button type="button" onClick={() => setShowPw(v => !v)} style={{
                  position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)',
                  background: 'none', border: 'none', cursor: 'pointer', padding: 2, color: '#9ca3af',
                }}>{showPw ? <EyeOff size={16} /> : <Eye size={16} />}</button>
              </div>
            </div>
            <div>
              <label style={{ display: 'block', fontSize: 12.5, fontWeight: 600, color: '#374151', marginBottom: 6 }}>
                {t('login.confirmPassword')}
              </label>
              <div style={{ position: 'relative' }}>
                <Lock size={15} className="text-[#9ca3af]" style={{ position: 'absolute', left: 13, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }} />
                <input
                  type={showPw ? 'text' : 'password'} value={pw2}
                  onChange={(e: ChangeEvent<HTMLInputElement>) => setPw2(e.target.value)}
                  required placeholder="••••••••" style={inputBase}
                  onFocus={(e) => { e.currentTarget.style.borderColor = '#111827' }}
                  onBlur={(e) => { e.currentTarget.style.borderColor = '#e5e7eb' }}
                />
              </div>
            </div>
          </>
        )}
        {mfaRequired && (
          <div>
            <label style={{ display: 'block', fontSize: 12.5, fontWeight: 600, color: '#374151', marginBottom: 6 }}>
              {t('login.mfaCode')}
            </label>
            <div style={{ position: 'relative' }}>
              <KeyRound size={15} className="text-[#9ca3af]" style={{ position: 'absolute', left: 13, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }} />
              <input
                type="text" inputMode="numeric" value={mfaCode}
                onChange={(e: ChangeEvent<HTMLInputElement>) => setMfaCode(e.target.value)}
                required placeholder="123456 or backup-code" style={{ ...inputBase, paddingRight: 12 }}
                autoFocus
                onFocus={(e) => { e.currentTarget.style.borderColor = '#111827' }}
                onBlur={(e) => { e.currentTarget.style.borderColor = '#e5e7eb' }}
              />
            </div>
          </div>
        )}
        <button type="submit" disabled={isLoading} style={{
          width: '100%', padding: '12px', background: '#111827', color: 'white',
          border: 'none', borderRadius: 12, fontSize: 14, fontWeight: 700,
          cursor: isLoading ? 'default' : 'pointer', fontFamily: 'inherit',
          opacity: isLoading ? 0.7 : 1,
        }}>
          {isLoading ? '…' : (mfaRequired ? t('login.resetPasswordVerify') : t('login.resetPasswordSubmit'))}
        </button>
      </form>
    </>
  )
}

export default ResetPasswordPage
