import React from 'react'
import { SCOPE_GROUPS } from '../api/oauthScopes'
import { Lock, ShieldCheck, AlertTriangle, Loader2, LogIn } from 'lucide-react'
import { useTranslation } from '../i18n'
import { useOAuthAuthorize } from './oauthAuthorize/useOAuthAuthorize'

export default function OAuthAuthorizePage(): React.ReactElement {
  const { t } = useTranslation()
  // Page = wiring container: the validate→consent state machine lives in the hook.
  const {
    pageState, validation, submitting, errorMsg, selectedScopes, clientId,
    scopesByGroup, submitConsent, toggleScope, toggleGroup, handleLoginRedirect,
  } = useOAuthAuthorize()

  // ---- Render states ----

  if (pageState === 'loading' || pageState === 'auto_approving') {
    return (
        <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--bg-primary)' }}>
          <div className="flex flex-col items-center gap-3">
            <Loader2 className="w-8 h-8 animate-spin" style={{ color: 'var(--accent-primary, #4f46e5)' }} />
            <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
              {pageState === 'auto_approving' ? t('oauth.authorize.authorizing') : t('oauth.authorize.loading')}
            </p>
          </div>
        </div>
    )
  }

  if (pageState === 'error') {
    return (
        <div className="min-h-screen flex items-center justify-center p-4" style={{ background: 'var(--bg-primary)' }}>
          <div className="w-full max-w-sm rounded-xl shadow-lg p-8 space-y-4 text-center" style={{ background: 'var(--bg-card)' }}>
            <AlertTriangle className="w-10 h-10 mx-auto text-red-500" />
            <h1 className="text-xl font-semibold" style={{ color: 'var(--text-primary)' }}>{t('oauth.authorize.errorTitle')}</h1>
            <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>{errorMsg}</p>
          </div>
        </div>
    )
  }

  if (pageState === 'login_required') {
    return (
        <div className="min-h-screen flex items-center justify-center p-4" style={{ background: 'var(--bg-primary)' }}>
          <div className="w-full max-w-sm rounded-xl shadow-lg p-8 space-y-5" style={{ background: 'var(--bg-card)' }}>
            <div className="text-center space-y-2">
              <Lock className="w-10 h-10 mx-auto" style={{ color: 'var(--accent-primary, #4f46e5)' }} />
              <h1 className="text-xl font-semibold" style={{ color: 'var(--text-primary)' }}>{t('oauth.authorize.loginTitle')}</h1>
              <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                {t('oauth.authorize.loginDescription', { client: validation?.client?.name || clientId })}
              </p>
            </div>
            <button
                onClick={handleLoginRedirect}
                className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium text-white"
                style={{ background: 'var(--accent-primary, #4f46e5)' }}>
              <LogIn className="w-4 h-4" />
              {t('oauth.authorize.loginButton')}
            </button>
          </div>
        </div>
    )
  }

  // pageState === 'consent'
  return (
      <div className="min-h-screen flex items-center justify-center p-4" style={{ background: 'var(--bg-primary)' }}>
        <div className="w-full max-w-2xl rounded-xl shadow-lg overflow-hidden flex flex-col sm:flex-row" style={{ background: 'var(--bg-card)' }}>

          {/* Left panel — app identity + actions */}
          <div className="sm:w-64 sm:flex-shrink-0 flex flex-col px-8 py-8 sm:border-r" style={{ borderColor: 'var(--border-primary)' }}>
            <div className="flex-1 space-y-4">
              <div className="w-12 h-12 rounded-full flex items-center justify-center" style={{ background: 'var(--bg-secondary)' }}>
                <ShieldCheck className="w-6 h-6" style={{ color: 'var(--accent-primary, #4f46e5)' }} />
              </div>
              <div>
                <p className="text-xs font-medium uppercase tracking-wide mb-1" style={{ color: 'var(--text-tertiary)' }}>{t('oauth.authorize.requestLabel')}</p>
                <h1 className="text-lg font-semibold leading-snug" style={{ color: 'var(--text-primary)' }}>
                  {validation?.client?.name || clientId}
                </h1>
                <p className="text-sm mt-2" style={{ color: 'var(--text-secondary)' }}>
                  {t('oauth.authorize.requestDescription')}
                </p>
              </div>
            </div>

            <div className="mt-8 space-y-2">
              <p className="text-xs mb-3" style={{ color: 'var(--text-tertiary)' }}>
                {t('oauth.authorize.trustNote')}
              </p>
              <button
                  onClick={() => submitConsent(true)}
                  disabled={submitting || (validation?.scopeSelectable === true && selectedScopes.length === 0)}
                  className="w-full px-4 py-2.5 rounded-lg text-sm font-medium text-white disabled:opacity-60 transition-opacity"
                  style={{ background: 'var(--accent-primary, #4f46e5)' }}>
                {submitting
                    ? t('oauth.authorize.authorizing')
                    : validation?.scopeSelectable && selectedScopes.length === 0
                        ? t('oauth.authorize.selectScope')
                        : validation?.scopeSelectable
                            ? t(
                                selectedScopes.length !== 1
                                    ? 'oauth.authorize.approveManyScopes'
                                    : 'oauth.authorize.approveOneScope',
                                { count: selectedScopes.length },
                            )
                            : t('oauth.authorize.approveAccess')}
              </button>
              <button
                  onClick={() => submitConsent(false)}
                  disabled={submitting}
                  className="w-full px-4 py-2.5 rounded-lg text-sm font-medium border transition-colors hover:bg-slate-50 dark:hover:bg-slate-800 disabled:opacity-60"
                  style={{ borderColor: 'var(--border-primary)', color: 'var(--text-secondary)' }}>
                {t('oauth.authorize.deny')}
              </button>
            </div>
          </div>

          {/* Right panel — selectable scopes */}
          <div className="flex-1 px-6 py-8 overflow-y-auto max-h-[80vh] sm:max-h-[600px]">
            <div className="space-y-6">
              {Object.keys(scopesByGroup).length > 0 && (
                  <div>
                    <p className="text-xs font-medium uppercase tracking-wide mb-4" style={{ color: 'var(--text-tertiary)' }}>
                      {validation?.scopeSelectable ? t('oauth.authorize.choosePermissions') : t('oauth.authorize.permissionsRequested')}
                    </p>

                    {validation?.scopeSelectable ? (
                        /* DCR client — user selects which scopes to grant */
                        <div className="space-y-3">
                          {Object.entries(scopesByGroup).map(([group, groupScopes]) => {
                            const allGroupSelected = groupScopes.every(s => selectedScopes.includes(s))
                            const someGroupSelected = groupScopes.some(s => selectedScopes.includes(s))
                            return (
                                <div key={group} className="rounded-lg border overflow-hidden" style={{ borderColor: 'var(--border-primary)' }}>
                                  <label className="flex items-center gap-2.5 px-3 py-2 cursor-pointer" style={{ background: 'var(--bg-secondary)' }}>
                                    <input
                                        type="checkbox"
                                        checked={allGroupSelected}
                                        ref={el => { if (el) el.indeterminate = someGroupSelected && !allGroupSelected }}
                                        onChange={() => toggleGroup(groupScopes, allGroupSelected)}
                                        className="rounded flex-shrink-0"
                                    />
                                    <span className="text-xs font-semibold" style={{ color: 'var(--text-secondary)' }}>{group}</span>
                                    <span className="ml-auto text-xs" style={{ color: 'var(--text-tertiary)' }}>
                              {groupScopes.filter(s => selectedScopes.includes(s)).length}/{groupScopes.length}
                            </span>
                                  </label>
                                  <div className="divide-y" style={{ borderColor: 'var(--border-primary)' }}>
                                    {groupScopes.map(s => {
                                      const keys = SCOPE_GROUPS[s]
                                      return (
                                          <label
                                              key={s}
                                              className="flex items-start gap-2.5 px-3 py-2 cursor-pointer transition-colors hover:bg-slate-50 dark:hover:bg-slate-800/50">
                                            <input
                                                type="checkbox"
                                                checked={selectedScopes.includes(s)}
                                                onChange={() => toggleScope(s)}
                                                className="mt-0.5 rounded flex-shrink-0"
                                            />
                                            <span className="mt-0.5 text-base leading-none flex-shrink-0">
                                    {s.endsWith(':delete') ? '🗑️' : s.endsWith(':write') ? '✏️' : '👁️'}
                                  </span>
                                            <div className="min-w-0">
                                              <p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>{keys ? t(keys.labelKey) : s}</p>
                                              <p className="text-xs mt-0.5" style={{ color: 'var(--text-tertiary)' }}>{keys ? t(keys.descriptionKey) : ''}</p>
                                            </div>
                                          </label>
                                      )
                                    })}
                                  </div>
                                </div>
                            )
                          })}
                        </div>
                    ) : (
                        /* Settings-created client — scopes are fixed, show read-only */
                        <div className="space-y-5">
                          {Object.entries(scopesByGroup).map(([group, groupScopes]) => (
                              <div key={group}>
                                <p className="text-xs font-semibold mb-2" style={{ color: 'var(--text-secondary)' }}>{group}</p>
                                <div className="space-y-1.5">
                                  {groupScopes.map(s => {
                                    const keys = SCOPE_GROUPS[s]
                                    return (
                                        <div key={s} className="flex items-start gap-2.5 px-3 py-2 rounded-lg" style={{ background: 'var(--bg-secondary)' }}>
                                <span className="mt-0.5 text-base leading-none flex-shrink-0">
                                  {s.endsWith(':delete') ? '🗑️' : s.endsWith(':write') ? '✏️' : '👁️'}
                                </span>
                                          <div className="min-w-0">
                                            <p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>{keys ? t(keys.labelKey) : s}</p>
                                            <p className="text-xs mt-0.5" style={{ color: 'var(--text-tertiary)' }}>{keys ? t(keys.descriptionKey) : ''}</p>
                                          </div>
                                        </div>
                                    )
                                  })}
                                </div>
                              </div>
                          ))}
                        </div>
                    )}
                  </div>
              )}

              {/* Always-available tools — granted regardless of scopes */}
              <div>
                <p className="text-xs font-medium uppercase tracking-wide mb-3" style={{ color: 'var(--text-tertiary)' }}>
                  {t('oauth.authorize.alwaysIncluded')}
                </p>
                <div className="space-y-1.5">
                  {[
                    { name: 'list_trips',       desc: t('oauth.authorize.alwaysTool.listTrips') },
                    { name: 'get_trip_summary', desc: t('oauth.authorize.alwaysTool.getTripSummary') },
                  ].map(({ name, desc }) => (
                      <div key={name} className="flex items-start gap-2.5 px-3 py-2 rounded-lg" style={{ background: 'var(--bg-secondary)' }}>
                        <span className="mt-0.5 text-base leading-none flex-shrink-0">👁️</span>
                        <div className="min-w-0">
                          <p className="text-sm font-medium font-mono" style={{ color: 'var(--text-primary)' }}>{name}</p>
                          <p className="text-xs mt-0.5" style={{ color: 'var(--text-tertiary)' }}>{desc}</p>
                        </div>
                      </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

        </div>
      </div>
  )
}