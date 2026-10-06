import { AlertTriangle, Loader2, Lock, LogIn, ShieldCheck } from 'lucide-react';
import React from 'react';
import { SCOPE_GROUPS } from '../api/oauthScopes';
import { useTranslation } from '../i18n';
import { useOAuthAuthorize } from './oauthAuthorize/useOAuthAuthorize';

/**
 * The glyph beside a scope on the consent screen, keyed by its mode.
 *
 * ':use' reads as an action rather than a level of access to your data, so it
 * does not belong on the read/write/delete ladder: falling through to the eye
 * would tell the user a tool-running scope only looks at things.
 */
function scopeGlyph(scope: string): string {
  if (scope.endsWith(':delete')) return '🗑️';
  if (scope.endsWith(':use')) return '🧩';
  if (scope.endsWith(':write')) return '✏️';
  return '👁️';
}

export default function OAuthAuthorizePage(): React.ReactElement {
  const { t } = useTranslation();
  // Page = wiring container: the validate→consent state machine lives in the hook.
  const {
    pageState,
    validation,
    submitting,
    errorMsg,
    selectedScopes,
    clientId,
    scopesByGroup,
    submitConsent,
    toggleScope,
    toggleGroup,
    handleLoginRedirect,
  } = useOAuthAuthorize();

  // ---- Render states ----

  if (pageState === 'loading' || pageState === 'auto_approving') {
    return (
      <div className="flex min-h-screen items-center justify-center" style={{ background: 'var(--bg-primary)' }}>
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-8 w-8 animate-spin" style={{ color: 'var(--accent-primary, #4f46e5)' }} />
          <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
            {pageState === 'auto_approving' ? t('oauth.authorize.authorizing') : t('oauth.authorize.loading')}
          </p>
        </div>
      </div>
    );
  }

  if (pageState === 'error') {
    return (
      <div className="flex min-h-screen items-center justify-center p-4" style={{ background: 'var(--bg-primary)' }}>
        <div
          className="w-full max-w-sm space-y-4 rounded-xl p-8 text-center shadow-lg"
          style={{ background: 'var(--bg-card)' }}
        >
          <AlertTriangle className="mx-auto h-10 w-10 text-red-500" />
          <h1 className="text-xl font-semibold" style={{ color: 'var(--text-primary)' }}>
            {t('oauth.authorize.errorTitle')}
          </h1>
          <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
            {errorMsg}
          </p>
        </div>
      </div>
    );
  }

  if (pageState === 'login_required') {
    return (
      <div className="flex min-h-screen items-center justify-center p-4" style={{ background: 'var(--bg-primary)' }}>
        <div className="w-full max-w-sm space-y-5 rounded-xl p-8 shadow-lg" style={{ background: 'var(--bg-card)' }}>
          <div className="space-y-2 text-center">
            <Lock className="mx-auto h-10 w-10" style={{ color: 'var(--accent-primary, #4f46e5)' }} />
            <h1 className="text-xl font-semibold" style={{ color: 'var(--text-primary)' }}>
              {t('oauth.authorize.loginTitle')}
            </h1>
            <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
              {t('oauth.authorize.loginDescription', { client: validation?.client?.name || clientId })}
            </p>
          </div>
          <button
            type="button"
            onClick={handleLoginRedirect}
            className="flex w-full items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-medium text-white"
            style={{ background: 'var(--accent-primary, #4f46e5)' }}
          >
            <LogIn className="h-4 w-4" />
            {t('oauth.authorize.loginButton')}
          </button>
        </div>
      </div>
    );
  }

  // pageState === 'consent'
  return (
    <div className="flex min-h-screen items-center justify-center p-4" style={{ background: 'var(--bg-primary)' }}>
      <div
        className="flex w-full max-w-2xl flex-col overflow-hidden rounded-xl shadow-lg sm:flex-row"
        style={{ background: 'var(--bg-card)' }}
      >
        {/* Left panel — app identity + actions */}
        <div
          className="flex flex-col px-8 py-8 sm:w-64 sm:flex-shrink-0 sm:border-r"
          style={{ borderColor: 'var(--border-primary)' }}
        >
          <div className="flex-1 space-y-4">
            <div
              className="flex h-12 w-12 items-center justify-center rounded-full"
              style={{ background: 'var(--bg-secondary)' }}
            >
              <ShieldCheck className="h-6 w-6" style={{ color: 'var(--accent-primary, #4f46e5)' }} />
            </div>
            <div>
              <p className="mb-1 text-xs font-medium uppercase tracking-wide" style={{ color: 'var(--text-tertiary)' }}>
                {t('oauth.authorize.requestLabel')}
              </p>
              <h1 className="text-lg font-semibold leading-snug" style={{ color: 'var(--text-primary)' }}>
                {validation?.client?.name || clientId}
              </h1>
              <p className="mt-2 text-sm" style={{ color: 'var(--text-secondary)' }}>
                {t('oauth.authorize.requestDescription')}
              </p>
            </div>
          </div>

          <div className="mt-8 space-y-2">
            <p className="mb-3 text-xs" style={{ color: 'var(--text-tertiary)' }}>
              {t('oauth.authorize.trustNote')}
            </p>
            <button
              type="button"
              onClick={() => submitConsent(true)}
              disabled={submitting || (validation?.scopeSelectable === true && selectedScopes.length === 0)}
              className="w-full rounded-lg px-4 py-2.5 text-sm font-medium text-white transition-opacity disabled:opacity-60"
              style={{ background: 'var(--accent-primary, #4f46e5)' }}
            >
              {submitting
                ? t('oauth.authorize.authorizing')
                : validation?.scopeSelectable && selectedScopes.length === 0
                  ? t('oauth.authorize.selectScope')
                  : validation?.scopeSelectable
                    ? t(
                        selectedScopes.length !== 1
                          ? 'oauth.authorize.approveManyScopes'
                          : 'oauth.authorize.approveOneScope',
                        { count: selectedScopes.length }
                      )
                    : t('oauth.authorize.approveAccess')}
            </button>
            <button
              type="button"
              onClick={() => submitConsent(false)}
              disabled={submitting}
              className="w-full rounded-lg border px-4 py-2.5 text-sm font-medium transition-colors hover:bg-slate-50 disabled:opacity-60 dark:hover:bg-slate-800"
              style={{ borderColor: 'var(--border-primary)', color: 'var(--text-secondary)' }}
            >
              {t('oauth.authorize.deny')}
            </button>
          </div>
        </div>

        {/* Right panel — selectable scopes */}
        <div className="max-h-[80vh] flex-1 overflow-y-auto px-6 py-8 sm:max-h-[600px]">
          <div className="space-y-6">
            {Object.keys(scopesByGroup).length > 0 && (
              <div>
                <p
                  className="mb-4 text-xs font-medium uppercase tracking-wide"
                  style={{ color: 'var(--text-tertiary)' }}
                >
                  {validation?.scopeSelectable
                    ? t('oauth.authorize.choosePermissions')
                    : t('oauth.authorize.permissionsRequested')}
                </p>

                {validation?.scopeSelectable ? (
                  /* DCR client — user selects which scopes to grant */
                  <div className="space-y-3">
                    {Object.entries(scopesByGroup).map(([group, groupScopes]) => {
                      const allGroupSelected = groupScopes.every((s) => selectedScopes.includes(s));
                      const someGroupSelected = groupScopes.some((s) => selectedScopes.includes(s));
                      return (
                        <div
                          key={group}
                          className="overflow-hidden rounded-lg border"
                          style={{ borderColor: 'var(--border-primary)' }}
                        >
                          <label
                            className="flex cursor-pointer items-center gap-2.5 px-3 py-2"
                            style={{ background: 'var(--bg-secondary)' }}
                          >
                            <input
                              type="checkbox"
                              checked={allGroupSelected}
                              ref={(el) => {
                                if (el) el.indeterminate = someGroupSelected && !allGroupSelected;
                              }}
                              onChange={() => toggleGroup(groupScopes, allGroupSelected)}
                              className="flex-shrink-0 rounded"
                            />
                            <span className="text-xs font-semibold" style={{ color: 'var(--text-secondary)' }}>
                              {group}
                            </span>
                            <span className="ml-auto text-xs" style={{ color: 'var(--text-tertiary)' }}>
                              {groupScopes.filter((s) => selectedScopes.includes(s)).length}/{groupScopes.length}
                            </span>
                          </label>
                          <div className="divide-y" style={{ borderColor: 'var(--border-primary)' }}>
                            {groupScopes.map((s) => {
                              const keys = SCOPE_GROUPS[s];
                              return (
                                <label
                                  key={s}
                                  className="flex cursor-pointer items-start gap-2.5 px-3 py-2 transition-colors hover:bg-slate-50 dark:hover:bg-slate-800/50"
                                >
                                  <input
                                    type="checkbox"
                                    checked={selectedScopes.includes(s)}
                                    onChange={() => toggleScope(s)}
                                    className="mt-0.5 flex-shrink-0 rounded"
                                  />
                                  <span className="mt-0.5 flex-shrink-0 text-base leading-none">{scopeGlyph(s)}</span>
                                  <div className="min-w-0">
                                    <p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
                                      {keys ? t(keys.labelKey) : s}
                                    </p>
                                    <p className="mt-0.5 text-xs" style={{ color: 'var(--text-tertiary)' }}>
                                      {keys ? t(keys.descriptionKey) : ''}
                                    </p>
                                  </div>
                                </label>
                              );
                            })}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  /* Settings-created client — scopes are fixed, show read-only */
                  <div className="space-y-5">
                    {Object.entries(scopesByGroup).map(([group, groupScopes]) => (
                      <div key={group}>
                        <p className="mb-2 text-xs font-semibold" style={{ color: 'var(--text-secondary)' }}>
                          {group}
                        </p>
                        <div className="space-y-1.5">
                          {groupScopes.map((s) => {
                            const keys = SCOPE_GROUPS[s];
                            return (
                              <div
                                key={s}
                                className="flex items-start gap-2.5 rounded-lg px-3 py-2"
                                style={{ background: 'var(--bg-secondary)' }}
                              >
                                <span className="mt-0.5 flex-shrink-0 text-base leading-none">{scopeGlyph(s)}</span>
                                <div className="min-w-0">
                                  <p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
                                    {keys ? t(keys.labelKey) : s}
                                  </p>
                                  <p className="mt-0.5 text-xs" style={{ color: 'var(--text-tertiary)' }}>
                                    {keys ? t(keys.descriptionKey) : ''}
                                  </p>
                                </div>
                              </div>
                            );
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
              <p className="mb-3 text-xs font-medium uppercase tracking-wide" style={{ color: 'var(--text-tertiary)' }}>
                {t('oauth.authorize.alwaysIncluded')}
              </p>
              <div className="space-y-1.5">
                {[
                  { name: 'list_trips', desc: t('oauth.authorize.alwaysTool.listTrips') },
                  { name: 'get_trip_summary', desc: t('oauth.authorize.alwaysTool.getTripSummary') },
                ].map(({ name, desc }) => (
                  <div
                    key={name}
                    className="flex items-start gap-2.5 rounded-lg px-3 py-2"
                    style={{ background: 'var(--bg-secondary)' }}
                  >
                    <span className="mt-0.5 flex-shrink-0 text-base leading-none">👁️</span>
                    <div className="min-w-0">
                      <p className="font-mono text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
                        {name}
                      </p>
                      <p className="mt-0.5 text-xs" style={{ color: 'var(--text-tertiary)' }}>
                        {desc}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
