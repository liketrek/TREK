/**
 * "This tab just signed out" — a fact that has to survive more than a render.
 *
 * On an OIDC-only install the login page bounces to the provider on its own
 * (`useLogin`), which is what makes signing out impossible: the provider still
 * has a live session, answers the silent authorize immediately, and the user is
 * back in TREK without having asked to be (#2123).
 *
 * The brake for that bounce used to be `noRedirect` in react-router location
 * state, and it does not survive the trip. `authStore.logout()` flips
 * `isAuthenticated` on a synchronous lane while BrowserRouter defers its own
 * location update, so React commits one render still on the old route;
 * ProtectedRoute sees a logged-out user and emits `<Navigate to="/login"
 * replace />` with no state, which overwrites the history entry the logout
 * handler had just pushed. Location state also cannot cross a full document
 * load, and `api/client.ts` performs one on any 401.
 *
 * sessionStorage is the right lifetime for it: it outlives both, and it is gone
 * when the tab is. A brand-new tab should auto-SSO again — that is the point of
 * single sign-on. What must not happen is auto-SSO in the tab where somebody
 * just pressed "Sign out".
 *
 * Every accessor is wrapped: Safari in private mode throws on sessionStorage,
 * and losing the brake must degrade to today's behaviour rather than to a blank
 * page.
 */
const KEY = 'trek_signed_out'

/** Called from `authStore.logout()`, so all seven sign-out call sites are covered at once. */
export function markSignedOut(): void {
  try {
    sessionStorage.setItem(KEY, '1')
  } catch {
    /* private mode — the location-state brake still covers the common path */
  }
}

/**
 * Cleared the moment the user asks to come back: any successful authentication,
 * and the click on the manual "Sign in with SSO" link. Without that, an
 * OIDC-only user would be stranded on a login page that refuses to auto-SSO for
 * the life of the tab.
 */
export function clearSignedOut(): void {
  try {
    sessionStorage.removeItem(KEY)
  } catch {
    /* ignore */
  }
}

export function wasSignedOut(): boolean {
  try {
    return sessionStorage.getItem(KEY) === '1'
  } catch {
    return false
  }
}
