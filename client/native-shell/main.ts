import { CapacitorHttp } from '@capacitor/core'
import { Haptics, ImpactStyle, NotificationType } from '@capacitor/haptics'
import { SplashScreen } from '@capacitor/splash-screen'
import { TrekShell } from '../src/native/trekShell'
import { probeDemo, probeServer, type ProbeFailure, type ProbeGet } from '../src/native/serverAddress'
import { CLOUD_URL, PRIVACY_URL, SERVER_DOCS_URL } from '../src/native/links'
import { pickLocale, translator } from './i18n'
import logoUrl from '../public/icons/icon-white.svg'
import './shell.css'

/**
 * The only page the app ships itself. It welcomes someone on first start, asks
 * for the TREK server they open in their browser, offers TREK Cloud to someone
 * without one, and stands in when a remembered server cannot be reached.
 * Everything past it is the UI that server delivers.
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

function failureMessage(reason: ProbeFailure): string {
  switch (reason) {
    case 'invalid':
      return t('native.connect.errorInvalid')
    case 'unreachable':
      return t('native.connect.errorUnreachable')
    case 'notTrek':
      return t('native.connect.errorNotTrek')
    case 'tooOld':
      return t('native.connect.errorTooOld')
  }
}

// ── Tiny DOM + haptics helpers ──────────────────────────────────────────────
function el<K extends keyof HTMLElementTagNameMap>(
  tag: K,
  props: Partial<HTMLElementTagNameMap[K]> & { dataset?: Record<string, string> } = {},
  ...children: (Node | string)[]
): HTMLElementTagNameMap[K] {
  const { dataset, ...rest } = props
  const node = document.createElement(tag)
  Object.assign(node, rest)
  if (dataset) for (const [k, v] of Object.entries(dataset)) node.dataset[k] = v
  node.append(...children.filter((c) => c !== null && c !== undefined))
  return node
}

function icon(path: string, size = 22, className?: string): SVGSVGElement {
  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg')
  svg.setAttribute('viewBox', '0 0 24 24')
  svg.setAttribute('width', String(size))
  svg.setAttribute('height', String(size))
  svg.setAttribute('fill', 'none')
  svg.setAttribute('stroke', 'currentColor')
  svg.setAttribute('stroke-width', '2')
  svg.setAttribute('stroke-linecap', 'round')
  svg.setAttribute('stroke-linejoin', 'round')
  if (className) svg.setAttribute('class', className)
  const p = document.createElementNS('http://www.w3.org/2000/svg', 'path')
  p.setAttribute('d', path)
  svg.appendChild(p)
  return svg
}
const I = {
  chevron: 'M9 18l6-6-6-6',
  cloud: 'M17.5 19a4.5 4.5 0 0 0 .5-9 6 6 0 0 0-11.6-1.6A4 4 0 0 0 6 19z',
  globe: 'M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20M2 12h20M12 2a15 15 0 0 1 0 20 15 15 0 0 1 0-20',
  bolt: 'M13 2 4 14h7l-1 8 9-12h-7z',
  shield: 'M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10',
  check: 'M20 6 9 17l-5-5',
}

async function tap(style: ImpactStyle = ImpactStyle.Light): Promise<void> {
  try {
    await Haptics.impact({ style })
  } catch {
    /* web / unavailable */
  }
}
async function notify(type: NotificationType): Promise<void> {
  try {
    await Haptics.notification({ type })
  } catch {
    /* web / unavailable */
  }
}

// ── Screen transitions ──────────────────────────────────────────────────────
let current: HTMLElement | null = null

function show(screen: HTMLElement, opts: { back?: boolean } = {}): void {
  screen.classList.add('screen', 'screen-enter')
  if (opts.back) screen.classList.add('screen-back')
  const previous = current
  if (previous) {
    previous.classList.remove('screen-enter')
    previous.classList.add('screen-leave')
    if (opts.back) previous.classList.add('screen-back')
    previous.addEventListener('animationend', () => previous.remove(), { once: true })
    setTimeout(() => previous.remove(), 400)
  }
  root.append(screen)
  current = screen
}

function externalLink(text: string, href: string): HTMLAnchorElement {
  return el('a', { href, target: '_blank', rel: 'noopener noreferrer' }, text)
}
function footLinks(...extra: Node[]): HTMLElement {
  return el('div', { className: 'foot-links' }, ...extra, externalLink(t('native.privacy'), PRIVACY_URL))
}
function topbar(onBack: () => void): HTMLElement {
  const back = el('button', { type: 'button', className: 'back' }, icon('M15 18l-6-6 6-6', 18), t('native.back'))
  back.addEventListener('click', () => {
    void tap()
    onBack()
  })
  return el('div', { className: 'topbar' }, back)
}

// ── Welcome ─────────────────────────────────────────────────────────────────
function showWelcome(opts: { back?: boolean } = {}): void {
  const hero = el('img', { src: logoUrl, alt: '', className: 'hero-mark' })

  const connect = el(
    'button',
    { type: 'button', className: 'btn' },
    el('span', { className: 'btn-row' }, el('b', {}, t('native.welcome.connect')), el('small', {}, t('native.welcome.connectSub'))),
    icon(I.chevron, 20, 'chev'),
  )
  connect.addEventListener('click', () => {
    void tap()
    showConnect()
  })

  const cloud = el(
    'button',
    { type: 'button', className: 'btn btn-ghost' },
    el('span', { className: 'btn-row' }, el('b', {}, t('native.welcome.getCloud')), el('small', {}, t('native.welcome.getCloudSub'))),
    icon(I.chevron, 20, 'chev'),
  )
  cloud.addEventListener('click', () => {
    void tap()
    showCloud()
  })

  const demo = el('button', { type: 'button', className: 'linkbtn' }, t('native.connect.tryDemo'))
  demo.addEventListener('click', () => runDemo(demo))

  show(
    el(
      'div',
      {},
      hero,
      el('h1', { className: 'title' }, t('native.welcome.headline')),
      el('p', { className: 'sub' }, t('native.welcome.sub')),
      connect,
      cloud,
      demo,
      footLinks(externalLink(t('native.connect.whatIsServer'), SERVER_DOCS_URL)),
    ),
    opts,
  )
}

// ── Connect (address) ───────────────────────────────────────────────────────
function showConnect(prefill = '', opts: { back?: boolean } = {}): void {
  const input = el('input', {
    type: 'url',
    placeholder: t('native.connect.placeholder'),
    value: prefill,
    autocapitalize: 'off',
    spellcheck: false,
  })
  input.setAttribute('inputmode', 'url')
  input.setAttribute('autocomplete', 'url')
  input.setAttribute('aria-label', t('native.connect.title'))
  const field = el('div', { className: 'field' }, input)

  const label = el('span', {}, t('native.connect.submit'))
  const submit = el('button', { type: 'submit', className: 'btn' }, label)
  const error = el('p', { className: 'error', role: 'alert' })
  const form = el('form', { className: 'form', noValidate: true }, field, submit, error)

  const fail = (reason: ProbeFailure): void => {
    void notify(NotificationType.Error)
    field.classList.add('bad')
    setTimeout(() => field.classList.remove('bad'), 350)
    error.textContent = failureMessage(reason)
    input.disabled = false
    submit.disabled = false
    label.textContent = t('native.connect.submit')
    submit.replaceChildren(label)
    input.focus()
  }

  form.addEventListener('submit', async (event) => {
    event.preventDefault()
    void tap(ImpactStyle.Medium)
    error.textContent = ''
    input.disabled = true
    submit.disabled = true
    submit.replaceChildren(el('span', { className: 'spinner' }), t('native.connect.checking'))
    const result = await probeServer(input.value, get)
    if (result.ok) {
      await connected(result.url)
      return
    }
    fail(result.reason)
  })

  const demo = el('button', { type: 'button', className: 'linkbtn' }, t('native.connect.tryDemo'))
  demo.addEventListener('click', () => runDemo(demo, error))

  show(
    el(
      'div',
      {},
      topbar(() => showWelcome({ back: true })),
      el('h1', { className: 'title-sm' }, t('native.connect.title')),
      el('p', { className: 'sub' }, t('native.connect.hint')),
      form,
      demo,
      footLinks(externalLink(t('native.connect.whatIsServer'), SERVER_DOCS_URL)),
    ),
    opts,
  )
  requestAnimationFrame(() => input.focus())
}

// ── Get TREK Cloud ──────────────────────────────────────────────────────────
function feature(path: string, text: string): HTMLElement {
  return el('div', { className: 'feature' }, el('span', { className: 'ic' }, icon(path, 18)), el('span', { className: 'tx' }, text))
}

function showCloud(opts: { back?: boolean } = {}): void {
  const cta = el('a', { className: 'btn', href: CLOUD_URL, target: '_blank', rel: 'noopener noreferrer' }, t('native.cloud.cta'), icon(I.chevron, 20, 'chev'))
  cta.addEventListener('click', () => void tap())

  const have = el('button', { type: 'button', className: 'linkbtn' }, t('native.cloud.haveServer'))
  have.addEventListener('click', () => {
    void tap()
    showConnect()
  })

  show(
    el(
      'div',
      {},
      topbar(() => showWelcome({ back: true })),
      el('h1', { className: 'title-sm' }, t('native.cloud.title')),
      el('p', { className: 'sub' }, t('native.cloud.sub')),
      el('div', { className: 'features' }, feature(I.globe, t('native.cloud.f1')), feature(I.bolt, t('native.cloud.f2')), feature(I.shield, t('native.cloud.f3'))),
      cta,
      have,
      footLinks(),
    ),
    opts,
  )
}

// ── Shared actions ──────────────────────────────────────────────────────────
async function runDemo(button: HTMLButtonElement, error?: HTMLElement): Promise<void> {
  void tap()
  if (error) error.textContent = ''
  button.disabled = true
  const result = await probeDemo(get)
  if (result.ok) {
    await connected(result.url)
    return
  }
  button.disabled = false
  if (error) {
    error.textContent = failureMessage(result.reason)
  } else {
    void notify(NotificationType.Error)
  }
}

/** The tick, then the server takes over. A beat so the success registers. */
async function connected(url: string): Promise<void> {
  void notify(NotificationType.Success)
  const host = (() => {
    try {
      return new URL(url).host
    } catch {
      return url
    }
  })()
  const tick = el('div', { className: 'tick' })
  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg')
  svg.setAttribute('viewBox', '0 0 24 24')
  svg.setAttribute('fill', 'none')
  svg.setAttribute('stroke', 'currentColor')
  svg.setAttribute('stroke-width', '2.5')
  svg.setAttribute('stroke-linecap', 'round')
  svg.setAttribute('stroke-linejoin', 'round')
  const p = document.createElementNS('http://www.w3.org/2000/svg', 'path')
  p.setAttribute('d', I.check)
  svg.appendChild(p)
  tick.appendChild(svg)
  show(el('div', { className: 'success' }, tick, el('h1', { className: 'title-sm' }, t('native.connecting', { host }))))
  await new Promise((r) => setTimeout(r, 700))
  await TrekShell.setServer({ url })
}

function showUnreachable(server: string): void {
  const retry = el('button', { type: 'button', className: 'btn' }, t('native.offline.retry'))
  retry.addEventListener('click', () => {
    void tap()
    retry.disabled = true
    void TrekShell.reload()
  })
  const change = el('button', { type: 'button', className: 'linkbtn' }, t('native.changeServer'))
  change.addEventListener('click', () => {
    void tap()
    void TrekShell.resetServer()
  })
  show(
    el(
      'div',
      {},
      el('img', { src: logoUrl, alt: '', className: 'shell-logo' }),
      el('h1', { className: 'title-sm' }, t('native.offline.title')),
      el('p', { className: 'sub' }, t('native.offline.hint', { server: new URL(server).host })),
      retry,
      change,
      footLinks(),
    ),
  )
}

// ── Start ───────────────────────────────────────────────────────────────────
async function start(): Promise<void> {
  const { url } = await TrekShell.getServer()
  if (!url) {
    showWelcome()
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
