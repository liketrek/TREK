import { Users, Check, X } from 'lucide-react'
import { useTranslation } from '../i18n'
import { useJoinTrip } from './join/useJoinTrip'

/**
 * /join/:token — accept a trip invite as an existing, logged-in user (#1143).
 *
 * The route is behind ProtectedRoute, so an unauthenticated visitor is bounced
 * to /login?redirect=/join/:token and lands back here after signing in — there
 * is no registration path from an invite link. Preview resolves the trip name;
 * Accept adds the current user as a member and opens the trip. An already-member
 * (or the owner) is simply taken straight to the trip.
 */
export default function JoinTripPage() {
  const { t } = useTranslation()
  const { state, title, accept, goToDashboard } = useJoinTrip()

  return (
    <div className="min-h-screen flex items-center justify-center bg-surface" style={{ padding: 24 }}>
      <div
        className="bg-surface-card border border-edge text-content"
        style={{ width: '100%', maxWidth: 420, borderRadius: 16, padding: '28px 24px', textAlign: 'center', boxShadow: '0 8px 32px rgba(0,0,0,0.12)' }}
      >
        <div
          className="bg-surface-hover"
          style={{ width: 52, height: 52, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}
        >
          {state === 'invalid'
            ? <X size={24} className="text-content-faint" />
            : <Users size={24} className="text-accent" />}
        </div>

        {state === 'invalid' ? (
          <>
            <h1 style={{ fontSize: 18, fontWeight: 700, marginBottom: 8 }}>{t('trip.invite.invalidTitle')}</h1>
            <p className="text-content-secondary" style={{ fontSize: 14, marginBottom: 20 }}>{t('trip.invite.invalid')}</p>
            <button
              onClick={goToDashboard}
              className="bg-surface-hover text-content"
              style={{ border: 'none', borderRadius: 10, padding: '10px 18px', fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}
            >
              {t('trip.invite.backToDashboard')}
            </button>
          </>
        ) : (
          <>
            <h1 style={{ fontSize: 18, fontWeight: 700, marginBottom: 8 }}>{t('trip.invite.joinHeading')}</h1>
            <p className="text-content-secondary" style={{ fontSize: 14, marginBottom: 22, minHeight: 20 }}>
              {state === 'loading' ? t('common.loading') : t('trip.invite.joinPrompt', { title })}
            </p>
            <div style={{ display: 'flex', gap: 10, justifyContent: 'center' }}>
              <button
                onClick={goToDashboard}
                className="bg-surface-hover text-content"
                style={{ border: 'none', borderRadius: 10, padding: '10px 18px', fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}
              >
                {t('common.cancel')}
              </button>
              <button
                onClick={accept}
                disabled={state !== 'ready'}
                className="bg-accent text-accent-text"
                style={{ border: 'none', borderRadius: 10, padding: '10px 20px', fontWeight: 600, cursor: state === 'ready' ? 'pointer' : 'default', opacity: state === 'ready' ? 1 : 0.6, display: 'inline-flex', alignItems: 'center', gap: 6, fontFamily: 'inherit' }}
              >
                <Check size={16} strokeWidth={2.5} />
                {state === 'joining' ? t('trip.invite.joining') : t('trip.invite.joinCta')}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
