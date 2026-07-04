import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from '../../i18n'
import { useAuthStore } from '../../store/authStore'
import { useToast } from '../shared/Toast'
import { pluginsApi } from '../../api/client'

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
  className?: string
  title?: string
}

type Inbound =
  | { type: 'trek:ready' }
  | { type: 'trek:context:request' }
  | { type: 'trek:navigate'; to: string }
  | { type: 'trek:notify'; level?: 'info' | 'success' | 'warning' | 'error'; message?: string }
  | { type: 'trek:resize'; height?: number }
  | { type: 'trek:invoke'; requestId: string; sub: string; method?: string; body?: unknown }

export default function PluginFrame({ pluginId, tripId = null, className, title }: PluginFrameProps) {
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
  const userId = useAuthStore((s) => s.user?.id)
  const [height, setHeight] = useState<number | null>(null)

  useEffect(() => {
    const frame = frameRef.current
    if (!frame) return

    const post = (msg: unknown) => frame.contentWindow?.postMessage(msg, '*') // opaque frame -> targetOrigin must be '*'

    const context = () => ({
      type: 'trek:context',
      tripId,
      userId: userId != null ? String(userId) : null,
      theme: document.documentElement.classList.contains('dark') ? 'dark' : 'light',
      locale,
      hostOrigin: window.location.origin,
    })

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
          if (text) (toast[level] ?? toast.info)(text)
          break
        }
        case 'trek:resize':
          if (typeof msg.height === 'number' && msg.height > 0) setHeight(Math.min(msg.height, 2000))
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
    return () => window.removeEventListener('message', onMessage)
  }, [pluginId, tripId, userId, locale, navigate, toast])

  return (
    <iframe
      ref={frameRef}
      src={`/plugin-frame/${pluginId}/index.html`}
      onLoad={() => { loadsRef.current += 1 }}
      sandbox="allow-scripts allow-forms"
      referrerPolicy="no-referrer"
      loading="lazy"
      title={title || pluginId}
      className={className}
      style={{ width: '100%', height: height ?? '100%', border: 0 }}
    />
  )
}
