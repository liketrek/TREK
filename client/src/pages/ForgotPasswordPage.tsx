import React, { ChangeEvent } from 'react'
import { Mail, ArrowLeft, CheckCircle2, Terminal } from 'lucide-react'
import { useTranslation } from '../i18n'
import { useForgotPassword } from './forgotPassword/useForgotPassword'

const inputBase: React.CSSProperties = {
  width: '100%', padding: '11px 12px 11px 38px', borderRadius: 12,
  border: '1px solid #e5e7eb', fontSize: 14, fontFamily: 'inherit',
  outline: 'none', transition: 'border-color 120ms',
  background: 'white', color: '#111827',
}

const ForgotPasswordPage: React.FC = () => {
  const { t } = useTranslation()
  // Page = wiring container: form state, the SMTP probe and submit live in the hook.
  const { navigate, email, setEmail, submitted, isLoading, smtpConfigured, handleSubmit } = useForgotPassword()

  return (
    <div style={{
      minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: 'linear-gradient(180deg, #f9fafb, #ffffff)', padding: 24, fontFamily: 'inherit',
    }}>
      <div style={{
        width: '100%', maxWidth: 420, background: 'white', borderRadius: 20,
        boxShadow: '0 12px 40px rgba(0,0,0,0.06), 0 2px 8px rgba(0,0,0,0.04)',
        padding: '32px 28px',
      }}>
        <button type="button" onClick={() => navigate('/login')} style={{
          display: 'flex', alignItems: 'center', gap: 6,
          background: 'none', border: 'none', cursor: 'pointer', padding: 0,
          color: '#6b7280', fontSize: 13, fontFamily: 'inherit', marginBottom: 22,
        }}>
          <ArrowLeft size={14} />{t('login.backToLogin')}
        </button>

        {submitted ? (
          <div style={{ textAlign: 'center', padding: '12px 0' }}>
            <div style={{
              width: 56, height: 56, borderRadius: '50%', background: '#ecfdf5',
              display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
              color: '#059669', marginBottom: 16,
            }}>
              <CheckCircle2 size={28} />
            </div>
            <h1 style={{ fontSize: 22, fontWeight: 700, color: '#111827', margin: '0 0 10px 0' }}>
              {t('login.forgotPasswordSentTitle')}
            </h1>
            <p style={{ fontSize: 14, color: '#4b5563', lineHeight: 1.55, margin: 0 }}>
              {t('login.forgotPasswordSentBody')}
            </p>
            {smtpConfigured === false && (
              <div style={{
                marginTop: 18, padding: '12px 14px',
                background: '#fffbeb', border: '1px solid #fde68a',
                borderRadius: 10, textAlign: 'left',
                display: 'flex', alignItems: 'flex-start', gap: 10,
              }}>
                <Terminal size={16} className="text-[#92400e]" style={{ marginTop: 1, flexShrink: 0 }} />
                <p style={{ fontSize: 12.5, color: '#92400e', lineHeight: 1.55, margin: 0 }}>
                  {t('login.forgotPasswordSmtpHintOff')}
                </p>
              </div>
            )}
            <button type="button" onClick={() => navigate('/login')} style={{
              marginTop: 24, padding: '11px 22px', background: '#111827', color: 'white',
              border: 'none', borderRadius: 12, fontSize: 14, fontWeight: 700,
              cursor: 'pointer', fontFamily: 'inherit',
            }}>{t('login.backToLogin')}</button>
          </div>
        ) : (
          <>
            <h1 style={{ fontSize: 22, fontWeight: 700, color: '#111827', margin: '0 0 8px 0' }}>
              {t('login.forgotPasswordTitle')}
            </h1>
            <p style={{ fontSize: 13.5, color: '#6b7280', lineHeight: 1.55, margin: '0 0 16px 0' }}>
              {t('login.forgotPasswordBody')}
            </p>
            {smtpConfigured === false && (
              <div style={{
                padding: '10px 12px', marginBottom: 18,
                background: '#fffbeb', border: '1px solid #fde68a',
                borderRadius: 10, display: 'flex', alignItems: 'flex-start', gap: 10,
              }}>
                <Terminal size={15} className="text-[#92400e]" style={{ marginTop: 1, flexShrink: 0 }} />
                <p style={{ fontSize: 12.5, color: '#92400e', lineHeight: 1.5, margin: 0 }}>
                  {t('login.forgotPasswordSmtpHintOff')}
                </p>
              </div>
            )}
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div>
                <label style={{ display: 'block', fontSize: 12.5, fontWeight: 600, color: '#374151', marginBottom: 6 }}>
                  {t('common.email')}
                </label>
                <div style={{ position: 'relative' }}>
                  <Mail size={15} className="text-[#9ca3af]" style={{ position: 'absolute', left: 13, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }} />
                  <input
                    type="email" value={email}
                    onChange={(e: ChangeEvent<HTMLInputElement>) => setEmail(e.target.value)}
                    required placeholder={t('login.emailPlaceholder')} style={inputBase}
                    onFocus={(e) => { e.currentTarget.style.borderColor = '#111827' }}
                    onBlur={(e) => { e.currentTarget.style.borderColor = '#e5e7eb' }}
                  />
                </div>
              </div>
              <button type="submit" disabled={isLoading} style={{
                width: '100%', padding: '12px', background: '#111827', color: 'white',
                border: 'none', borderRadius: 12, fontSize: 14, fontWeight: 700,
                cursor: isLoading ? 'default' : 'pointer', fontFamily: 'inherit',
                opacity: isLoading ? 0.7 : 1, transition: 'opacity 0.15s',
              }}>
                {isLoading ? t('login.signingIn') : t('login.forgotPasswordSubmit')}
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  )
}

export default ForgotPasswordPage
