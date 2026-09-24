import { CapacitorHttp } from '@capacitor/core'
import { SplashScreen } from '@capacitor/splash-screen'
import { TrekShell } from '../src/native/trekShell'
import { probeServer, type ProbeFailure, type ProbeGet } from '../src/native/serverAddress'
import { pickLocale, translator } from './i18n'
import logoUrl from '../public/icons/icon-white.svg'
import './shell.css'

/**
 * The only page the app ships itself. It asks for a server on first start and
 * stands in when the remembered one cannot be reached; everything else is the
 * UI that server delivers.
 */

const locale = pickLocale(navigator.languages?.length ? navigator.languages : [navigator.language])
const t = translator(locale)
document.documentElement.lang = locale
document.documentElement.dir = locale === 'ar' ? 'rtl' : 'ltr'

const root = document.getElementById('shell')!

const PROBE_TIMEOUT_MS = 8000

// Native HTTP rather than fetch: the probe goes to a server of the user's
// choosing, which has no reason to answer this page's origin with CORS.
const get: ProbeGet = async (url) => {
  const response = await CapacitorHttp.get({ url, connectTimeout: PROBE_TIMEOUT_MS, readTimeout: PROBE_TIMEOUT_MS })
  return { status: response.status, data: response.data, url: response.url }
}

const FAILURE_KEYS: Record<ProbeFailure, string> = {
  invalid: 'native.connect.errorInvalid',
  unreachable: 'native.connect.errorUnreachable',
  notTrek: 'native.connect.errorNotTrek',
  tooOld: 'native.connect.errorTooOld',
}

function el<K extends keyof HTMLElementTagNameMap>(tag: K, props: Partial<HTMLElementTagNameMap[K]> = {}, ...children: (Node | string)[]) {
  const node = Object.assign(document.createElement(tag), props)
  node.append(...children)
  return node
}

function header(title: string, hint: string) {
  return [
    el('img', { src: logoUrl, alt: '', className: 'shell-logo' }),
    el('h1', { className: 'shell-title' }, title),
    el('p', { className: 'shell-hint' }, hint),
  ]
}

function showConnect(prefill = '') {
  const input = el('input', {
    type: 'url',
    className: 'shell-input',
    placeholder: t('native.connect.placeholder'),
    value: prefill,
    autocapitalize: 'off',
    spellcheck: false,
    required: true,
  })
  input.setAttribute('inputmode', 'url')
  input.setAttribute('autocomplete', 'url')
  input.setAttribute('aria-label', t('native.connect.title'))
  const error = el('p', { className: 'shell-error', role: 'alert' })
  const submit = el('button', { type: 'submit', className: 'shell-button' }, t('native.connect.submit'))
  const form = el('form', { className: 'shell-form', noValidate: true }, input, submit, error)

  form.addEventListener('submit', async (event) => {
    event.preventDefault()
    error.textContent = ''
    input.disabled = true
    submit.disabled = true
    submit.textContent = t('native.connect.checking')
    const result = await probeServer(input.value, get)
    if (result.ok) {
      await TrekShell.setServer({ url: result.url })
      return
    }
    error.textContent = t(FAILURE_KEYS[result.reason])
    input.disabled = false
    submit.disabled = false
    submit.textContent = t('native.connect.submit')
    input.focus()
  })

  root.replaceChildren(...header(t('native.connect.title'), t('native.connect.hint')), form)
}

function showUnreachable(server: string) {
  const retry = el('button', { type: 'button', className: 'shell-button' }, t('native.offline.retry'))
  retry.addEventListener('click', () => {
    retry.disabled = true
    void TrekShell.reload()
  })
  const change = el('button', { type: 'button', className: 'shell-link' }, t('native.changeServer'))
  change.addEventListener('click', () => { void TrekShell.resetServer() })

  root.replaceChildren(
    ...header(t('native.offline.title'), t('native.offline.hint', { server: new URL(server).host })),
    el('div', { className: 'shell-form' }, retry, change),
  )
}

async function start() {
  const { url } = await TrekShell.getServer()
  if (!url) {
    showConnect()
  } else {
    // Only reached when loading the server failed. On iOS the stored copy of
    // its start page brings the offline-capable UI up anyway.
    const { opened } = await TrekShell.openOfflineCopy()
    if (opened) return
    showUnreachable(url)
  }
  await SplashScreen.hide()
}

void start()
