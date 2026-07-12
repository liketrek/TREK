import { useCallback, useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from '../../i18n'
import { useAuthStore } from '../../store/authStore'
import { useSettingsStore } from '../../store/settingsStore'
import { useToast } from '../shared/Toast'
import ConfirmDialog from '../shared/ConfirmDialog'
import { pluginsApi } from '../../api/client'
import { addListener, removeListener } from '../../api/websocket'

// The design-token contract handed to plugins (#4 richer context): non-secret CSS
// values, resolved for the CURRENT theme, so a plugin can match TREK exactly (and
// re-match on a theme toggle / accent change) instead of hard-coding a mirror of
// the palette that drifts. Names mirror index.css so a plugin can apply them
// verbatim as CSS variables. This is the whole GLOBAL (:root/.dark) palette — the
// part that a user can recolour via appearance settings (accent scheme, custom
// accent, high-contrast) flows through here live. The glassy `.trek-dash` layer
// (--glass-*/--r-*/--sh-*) is intentionally NOT read here: it is scoped to the
// dashboard subtree, so it resolves EMPTY at documentElement — the SDK design kit
// bakes those values instead (they don't vary with the accent, only light/dark).
const TOKEN_VARS = [
  // surfaces
  '--bg-primary', '--bg-secondary', '--bg-tertiary', '--bg-elevated',
  '--bg-card', '--bg-input', '--bg-hover', '--bg-selected', '--bg-inverse',
  // text
  '--text-primary', '--text-secondary', '--text-muted', '--text-faint', '--text-inverse',
  // borders
  '--border-primary', '--border-secondary', '--border-faint',
  // accent (recoloured by the chosen scheme / custom accent)
  '--accent', '--accent-text', '--accent-on', '--accent-hover', '--accent-subtle',
  // semantic + soft fills
  '--success', '--success-soft', '--danger', '--danger-soft',
  '--warning', '--warning-soft', '--info', '--info-soft',
  // shadows
  '--shadow-card', '--shadow-elevated', '--shadow-sm', '--shadow-md', '--shadow-lg',
  // radii, type, misc
  '--radius-sm', '--radius-md', '--radius-lg', '--radius-xl',
  '--font-system', '--font-subtext', '--overlay', '--ease-out-quint',
]
function readThemeTokens(): Record<string, string> {
  const cs = getComputedStyle(document.documentElement)
  const out: Record<string, string> = {}
  for (const v of TOKEN_VARS) {
    const val = cs.getPropertyValue(v).trim()
    if (val) out[v] = val
  }
  return out
}

/**
 * The host's current appearance state, mirrored from the attributes applyAppearance
 * writes on <html>, so a plugin can honour the same accessibility/appearance choices
 * inside its own sandboxed document (it can't read the parent DOM). All booleans/enums
 * — nothing secret.
 */
function readAppearance() {
  const el = document.documentElement
  return {
    scheme: el.dataset.scheme || 'default',
    density: el.dataset.density === 'compact' ? 'compact' : 'comfortable',
    noTransparency: el.hasAttribute('data-no-transparency'),
    reducedMotion:
      el.hasAttribute('data-reduce-motion') ||
      window.matchMedia('(prefers-reduced-motion: reduce)').matches,
  }
}

/**
 * Renders a plugin's sandboxed page/widget iframe and hosts the trekBridge
 * (#plugins, M3).
 *
 * The frame is served same-origin from /plugin-frame/:id but sandboxed WITHOUT
 * allow-same-origin, so it runs at an OPAQUE origin: no access to the trek_session
 * cookie, no parent DOM, no credentialed fetch. Its only channel is postMessage,
 * and we authenticate every inbound message by the SENDER WINDOW IDENTITY
 * (event.source === our iframe), never by a claimed id or by origin (which is
 * "null" for opaque frames). Data reads go through the host (app-origin, session
 * cookie) so the plugin never handles credentials.
 */

interface PluginFrameProps {
  pluginId: string
  tripId?: string | null
  /** The place in view — set for a place-detail slot so the plugin can scope to it. */
  placeId?: string | null
  /** The day in view — set for a day-detail slot so the plugin can scope to it. */
  dayId?: string | null
  /** The reservation in view — set for a reservation-detail slot so the plugin can scope to it. */
  reservationId?: string | null
  /**
   * Full-page hosts (trip tab, /plugins/:id) set this so the frame always fills
   * its container. Without it a kit-based plugin auto-reports its content height
   * (trek:resize) and the page collapses to a floating island with dead space
   * below — right for dashboard widgets, wrong for a page.
   */
  fill?: boolean
  className?: string
  title?: string
}

type Inbound =
  | { type: 'trek:ready' }
  | { type: 'trek:context:request' }
  | { type: 'trek:navigate'; to: string }
  | { type: 'trek:notify'; level?: 'info' | 'success' | 'warning' | 'error'; message?: string; duration?: number }
  | { type: 'trek:resize'; height?: number }
  | { type: 'trek:invoke'; requestId: string; sub: string; method?: string; body?: unknown }
  | { type: 'trek:confirm'; requestId: string; title?: string; message?: string; confirmLabel?: string; cancelLabel?: string; danger?: boolean }
  | { type: 'trek:openExternal'; url?: string }

interface ConfirmRequest {
  requestId: string
  title?: string
  message?: string
  confirmLabel?: string
  cancelLabel?: string
  danger: boolean
}

export default function PluginFrame({ pluginId, tripId = null, placeId = null, dayId = null, reservationId = null, fill = false, className, title }: PluginFrameProps) {
  const frameRef = useRef<HTMLIFrameElement | null>(null)
  // A sandboxed frame may navigate ITSELF (connect-src can't stop that), and its
  // window identity keeps matching our iframe afterwards. Track loads and refuse
  // the bridge once a second document loads. NOTE: this is best-effort — the load
  // event fires at end-of-document, so a navigated attacker doc that posts during
  // its own load (or holds it open) can still reach the bridge for one exchange.
  // The exposure is bounded (only this plugin's own routes + the trek:context
  // ids the plugin already had; never the httpOnly cookie); fully closing it
  // would require not running plugin client JS at all.
  const loadsRef = useRef(0)
  const { locale } = useTranslation()
  const navigate = useNavigate()
  const toast = useToast()
  // useToast returns a fresh object every render; keep it out of the effect deps
  // (via this ref) or the bridge effect would tear down and re-post the context on
  // EVERY parent re-render instead of only when the context inputs change.
  const toastRef = useRef(toast)
  toastRef.current = toast
  const userId = useAuthStore((s) => s.user?.id)
  const userName = useAuthStore((s) => s.user?.username ?? null)
  const userAvatar = useAuthStore((s) => s.user?.avatar_url ?? null)
  const isAdmin = useAuthStore((s) => s.user?.role === 'admin')
  const settings = useSettingsStore((s) => s.settings)
  const [height, setHeight] = useState<number | null>(null)
  // A host-rendered ConfirmDialog on the plugin's behalf: sandboxed frames have no
  // allow-modals and can't overlay the host, so destructive plugin actions get the
  // same native confirm every TREK feature uses. One at a time; extras are refused.
  // The ref mirrors the state so the message handler can gate + answer without
  // side effects inside a setState updater (StrictMode runs updaters twice).
  const [confirmReq, setConfirmReq] = useState<ConfirmRequest | null>(null)
  const confirmReqRef = useRef<ConfirmRequest | null>(null)

  // opaque frame -> targetOrigin must be '*'. Hoisted so the iframe's onLoad can
  // deliver the context too: the trek:ready handshake alone is racy — if the frame
  // boots before the effect's listener attaches, the plugin never learns the theme
  // and falls back to the OS scheme (dark mode looking "off" until a toggle).
  const postFrame = useCallback((msg: unknown) => frameRef.current?.contentWindow?.postMessage(msg, '*'), [])
  const buildContext = useCallback(() => ({
    type: 'trek:context',
    tripId,
    placeId,
    dayId,
    reservationId,
    userId: userId != null ? String(userId) : null,
    theme: document.documentElement.classList.contains('dark') ? 'dark' : 'light',
    locale,
    // Mirror of what TranslationProvider stamps on <html> — an RTL host (Arabic)
    // wants RTL plugin UIs too, and the frame can't read our DOM to find out.
    dir: (document.documentElement.getAttribute('dir') === 'rtl' ? 'rtl' : 'ltr') as 'rtl' | 'ltr',
    hostOrigin: window.location.origin,
    // #4 richer context — non-secret display data so plugins render natively:
    // who the user is (name/avatar/isAdmin — never email/role beyond a boolean),
    // how TREK formats things, the resolved theme tokens, and the appearance state
    // (accent scheme, density, reduced-motion / no-transparency) so a plugin can
    // mirror the same look and accessibility choices as the host.
    user: userName != null ? { name: userName, avatar: userAvatar, isAdmin } : null,
    appearance: readAppearance(),
    formats: {
      locale,
      currency: settings.default_currency,
      timeFormat: settings.time_format,
      distanceUnit: settings.distance_unit,
      temperatureUnit: settings.temperature_unit,
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    },
    tokens: readThemeTokens(),
  }), [tripId, placeId, dayId, reservationId, userId, locale, userName, userAvatar, isAdmin, settings])

  useEffect(() => {
    const frame = frameRef.current
    if (!frame) return

    const post = postFrame
    const context = buildContext

    const onMessage = async (ev: MessageEvent) => {
      // The ONLY trusted identity: the message came from OUR iframe's window.
      if (ev.source !== frame.contentWindow) return
      // …AND that window still holds the original plugin document (loaded once).
      // A 2nd load means the frame navigated elsewhere — stop bridging to it.
      if (loadsRef.current > 1) return
      const msg = ev.data as Inbound
      if (!msg || typeof msg !== 'object') return

      switch (msg.type) {
        case 'trek:ready':
        case 'trek:context:request':
          post(context())
          break
        case 'trek:navigate': {
          const to = typeof msg.to === 'string' ? msg.to : ''
          // In-app paths only; block protocol-relative and admin unless allowed by the app itself.
          if (/^\/[a-zA-Z0-9/_?=&%.-]*$/.test(to) && !to.startsWith('//')) navigate(to)
          break
        }
        case 'trek:notify': {
          const text = String(msg.message ?? '').slice(0, 200)
          const level = msg.level ?? 'info'
          if (!text) break
          const t = toastRef.current
          const show = t[level] ?? t.info
          // Optional duration, clamped so a plugin can neither flash nor park a
          // toast (isFinite: NaN would slip through the clamp as duration 0 = sticky).
          if (Number.isFinite(msg.duration)) show(text, Math.min(Math.max(msg.duration as number, 1500), 15000))
          else show(text)
          break
        }
        case 'trek:confirm': {
          if (typeof msg.requestId !== 'string' || !msg.requestId) break
          if (confirmReqRef.current) {
            // One dialog at a time — answer the newcomer 'not confirmed' right away.
            post({ type: 'trek:confirm:result', requestId: msg.requestId, confirmed: false })
            break
          }
          const req: ConfirmRequest = {
            requestId: msg.requestId,
            title: typeof msg.title === 'string' ? msg.title.slice(0, 120) : undefined,
            message: typeof msg.message === 'string' ? msg.message.slice(0, 500) : undefined,
            confirmLabel: typeof msg.confirmLabel === 'string' ? msg.confirmLabel.slice(0, 40) : undefined,
            cancelLabel: typeof msg.cancelLabel === 'string' ? msg.cancelLabel.slice(0, 40) : undefined,
            danger: msg.danger !== false,
          }
          confirmReqRef.current = req
          setConfirmReq(req)
          break
        }
        case 'trek:openExternal': {
          // The sandbox has no allow-popups, so the HOST opens the link — but only
          // real web URLs, never javascript:/data:/file: or anything else.
          try {
            const u = new URL(String(msg.url ?? ''))
            if (u.protocol === 'https:' || u.protocol === 'http:') {
              window.open(u.href, '_blank', 'noopener,noreferrer')
            }
          } catch { /* not a URL — ignore */ }
          break
        }
        case 'trek:resize':
          if (!fill && typeof msg.height === 'number' && msg.height > 0) setHeight(Math.min(msg.height, 2000))
          break
        case 'trek:invoke': {
          // The plugin's own route, called host-side with the user's session.
          try {
            const data = await pluginsApi.invoke(pluginId, msg.sub, { method: msg.method, body: msg.body })
            post({ type: 'trek:response', requestId: msg.requestId, data })
          } catch (e) {
            const err = e as { response?: { status?: number }; message?: string }
            post({ type: 'trek:error', requestId: msg.requestId, code: err.response?.status ?? 'error', message: err.message ?? 'invoke failed' })
          }
          break
        }
      }
    }

    window.addEventListener('message', onMessage)

    // Live locale/format sync: this effect re-runs whenever buildContext's inputs
    // (locale, settings, trip/place) change, so a loaded frame gets the fresh
    // context pushed instead of staying stale until reload. First delivery is
    // handled by onLoad; navigated frames (loads > 1) are never re-bridged.
    if (loadsRef.current === 1) post(context())

    // Forward event *names* for the trip in view, mirroring the server-side events
    // surface: only { event, tripId }, never payloads — the frame's user is already
    // looking at this trip. Core events plus the plugin's OWN namespaced broadcasts
    // (plugin:{id}:*) pass; other plugins' broadcasts don't. Trip events only reach
    // the socket while a planner has the trip joined, so this is a planner-side
    // refresh signal — dashboard widgets still poll.
    let wsForward: ((ev: Record<string, unknown>) => void) | null = null
    if (tripId) {
      wsForward = (ev) => {
        if (loadsRef.current !== 1) return
        if (!ev || typeof ev.type !== 'string' || ev.tripId == null || String(ev.tripId) !== tripId) return
        if (ev.type.startsWith('plugin:') && !ev.type.startsWith(`plugin:${pluginId}:`)) return
        post({ type: 'trek:event', event: ev.type, tripId })
      }
      addListener(wsForward)
    }

    // The frame is opaque-origin and can't read our DOM, and we otherwise send the
    // context (incl. theme + tokens) only once on trek:ready — so a plugin can't
    // follow an in-app appearance change. Watch the <html> element for anything
    // applyAppearance touches (the `dark` class, the data-* appearance attributes,
    // and inline style for the custom-accent vars) and re-post the context when the
    // resulting look actually changes, so plugins restyle live. A compact signature
    // dedupes: unrelated mutations don't trigger a repost. (Plugins re-apply on
    // trek:context.)
    const htmlEl = document.documentElement
    const appearanceSig = () => {
      const cs = getComputedStyle(htmlEl)
      return [
        htmlEl.classList.contains('dark'),
        htmlEl.dataset.scheme || '',
        htmlEl.dataset.density || '',
        htmlEl.hasAttribute('data-no-transparency'),
        htmlEl.hasAttribute('data-reduce-motion'),
        cs.getPropertyValue('--accent').trim(),
      ].join('|')
    }
    let prevSig = appearanceSig()
    const themeObserver = new MutationObserver(() => {
      const sig = appearanceSig()
      if (sig === prevSig) return
      prevSig = sig
      if (loadsRef.current <= 1) post(context())
    })
    themeObserver.observe(htmlEl, {
      attributes: true,
      attributeFilter: ['class', 'style', 'data-scheme', 'data-density', 'data-no-transparency', 'data-reduce-motion'],
    })

    return () => {
      window.removeEventListener('message', onMessage)
      themeObserver.disconnect()
      if (wsForward) removeListener(wsForward)
    }
  }, [pluginId, tripId, fill, navigate, postFrame, buildContext])

  // Hosts swap pluginId in place (tab bar, /plugins/:id route) — the iframe below
  // is keyed so the document is a fresh first load, and the per-plugin bridge
  // state must start over with it or the new plugin would be refused as a
  // "navigated" frame (loads > 1) and an open confirm would leak across plugins.
  useEffect(() => {
    loadsRef.current = 0
    setHeight(null)
    confirmReqRef.current = null
    setConfirmReq(null)
  }, [pluginId])

  const answerConfirm = (confirmed: boolean) => {
    const req = confirmReqRef.current
    if (req) postFrame({ type: 'trek:confirm:result', requestId: req.requestId, confirmed })
    confirmReqRef.current = null
    setConfirmReq(null)
  }

  // The dialog title always leads with the host-controlled plugin name, so a
  // plugin cannot dress its confirm up as a TREK system dialog.
  const pluginLabel = title || pluginId
  const confirmTitle = confirmReq?.title ? `${pluginLabel} — ${confirmReq.title}` : pluginLabel

  return (
    <>
      <iframe
        key={pluginId}
        ref={frameRef}
        src={`/plugin-frame/${pluginId}/index.html`}
        // Deliver the context as soon as the document is parsed (the plugin sets up its
        // message listener during parse), closing the trek:ready race so the theme is
        // right on first paint. A 2nd load is a self-navigation — don't bridge to it.
        onLoad={() => { loadsRef.current += 1; if (loadsRef.current === 1) postFrame(buildContext()) }}
        sandbox="allow-scripts allow-forms"
        referrerPolicy="no-referrer"
        loading="lazy"
        title={title || pluginId}
        className={className}
        style={{ width: '100%', height: fill ? '100%' : height ?? '100%', border: 0 }}
      />
      <ConfirmDialog
        isOpen={confirmReq != null}
        onClose={() => answerConfirm(false)}
        onConfirm={() => answerConfirm(true)}
        title={confirmTitle}
        message={confirmReq?.message}
        confirmLabel={confirmReq?.confirmLabel}
        cancelLabel={confirmReq?.cancelLabel}
        danger={confirmReq?.danger}
      />
    </>
  )
}
