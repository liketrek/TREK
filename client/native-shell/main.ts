import { App } from '@capacitor/app';
import { Capacitor, CapacitorHttp } from '@capacitor/core';
import { Haptics, ImpactStyle, NotificationType } from '@capacitor/haptics';
import { SplashScreen } from '@capacitor/splash-screen';
import { StatusBar, Style } from '@capacitor/status-bar';
import logoUrl from '../public/icons/icon-white.svg';
import logoBlack from '../public/logo-dark.svg'; // #000 wordmark, for light backgrounds
import logoWhite from '../public/logo-light.svg'; // #fff wordmark, for dark backgrounds
import { AUTH_GATE_NAMES, canSignInInApp, type AuthGate } from '../src/native/authGate';
import { opensSoon, refundedBeforeOpening } from '../src/native/cloudOrders';
import { fakeIapClient, getIapClient, productIdFor, type Purchase } from '../src/native/iap';
import {
  AUTH_PROXY_DOCS_URL,
  CLIENT_CERT_DOCS_URL,
  CLOUD_TERMS_URL,
  CLOUD_URL,
  PRIVACY_URL,
  SERVER_DOCS_URL,
  STORE_TERMS_URL,
} from '../src/native/links';
import {
  probeDemo,
  probeServer,
  type ClientCertDemand,
  type ProbeFailure,
  type ProbeGet,
} from '../src/native/serverAddress';
import { passwordProblem } from '../../shared/src/auth/password-policy';
import { TrekShell, type ClientCertificateFailure } from '../src/native/trekShell';
import { directionOf, pickLocale, translator } from './i18n';
import './shell.css';

/**
 * The only page the app ships itself. It welcomes someone on first start, asks
 * for the TREK server they open in their browser, offers TREK Cloud to someone
 * without one, and stands in when a remembered server cannot be reached.
 * Everything past it is the UI that server delivers.
 */

const locale = pickLocale(navigator.languages?.length ? navigator.languages : [navigator.language]);
/** Google Play sells on Android, the App Store everywhere else: the store's own words in the legal texts. */
const onPlay = Capacitor.getPlatform() === 'android';
const t = translator(locale);
document.documentElement.lang = locale;
document.documentElement.dir = directionOf(locale);

const root = document.getElementById('shell')!;
const PROBE_TIMEOUT_MS = 8000;

const iap = getIapClient();
/**
 * Whether this build can take a payment in-app, asked once at start. Without it
 * the plan picker shows the plans but offers no way to buy: the store rules
 * allow no link or button that sends a buyer to the website instead.
 */
const iapReady: Promise<boolean> = iap.isAvailable().catch(() => false);

/** The subdomain suffix a cloud instance sits on, from the cloud address: `liketrek.com` → `.liketrek.com`. */
function cloudSuffix(): string {
  try {
    return `.${new URL(CLOUD_URL).host}`;
  } catch {
    return '.liketrek.com';
  }
}

/** JSON bodies arrive as text from the app's own request; everything else stays text. */
function parseBody(data: unknown): unknown {
  if (typeof data !== 'string') return data;
  try {
    return JSON.parse(data);
  } catch {
    return data;
  }
}

// Native HTTP rather than fetch: the probe goes to a server of the user's
// choosing, which has no reason to answer this page's origin with CORS. The
// app's own request comes first: it shows a stored client certificate and
// reports whether the server asked for one. A web preview has only Capacitor's.
const get: ProbeGet = async (url) => {
  try {
    const response = await TrekShell.requestServer({ url, timeoutMs: PROBE_TIMEOUT_MS });
    return {
      status: response.status,
      data: parseBody(response.data),
      url: response.url,
      headers: response.headers,
      clientCert: { requested: response.certRequested, sent: response.certSent },
    };
  } catch {
    const response = await CapacitorHttp.get({ url, connectTimeout: PROBE_TIMEOUT_MS, readTimeout: PROBE_TIMEOUT_MS });
    return { status: response.status, data: response.data, url: response.url, headers: response.headers };
  }
};

function failureMessage(reason: ProbeFailure): string {
  switch (reason) {
    case 'invalid':
      return t('native.connect.errorInvalid');
    case 'unreachable':
      return t('native.connect.errorUnreachable');
    case 'notTrek':
      return t('native.connect.errorNotTrek');
    case 'authGate':
      return t('native.gate.titleUnknown');
    case 'clientCert':
      return t('native.cert.title');
    case 'tooOld':
      return t('native.connect.errorTooOld');
  }
}

// ── Tiny DOM + haptics helpers ──────────────────────────────────────────────
function el<K extends keyof HTMLElementTagNameMap>(
  tag: K,
  props: Partial<HTMLElementTagNameMap[K]> & { dataset?: Record<string, string> } = {},
  ...children: (Node | string)[]
): HTMLElementTagNameMap[K] {
  const { dataset, ...rest } = props;
  const node = document.createElement(tag);
  Object.assign(node, rest);
  if (dataset) for (const [k, v] of Object.entries(dataset)) node.dataset[k] = v;
  node.append(...children.filter((c) => c !== null && c !== undefined));
  return node;
}

function icon(path: string, size = 22, className?: string): SVGSVGElement {
  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  svg.setAttribute('viewBox', '0 0 24 24');
  svg.setAttribute('width', String(size));
  svg.setAttribute('height', String(size));
  svg.setAttribute('fill', 'none');
  svg.setAttribute('stroke', 'currentColor');
  svg.setAttribute('stroke-width', '2');
  svg.setAttribute('stroke-linecap', 'round');
  svg.setAttribute('stroke-linejoin', 'round');
  if (className) svg.setAttribute('class', className);
  const p = document.createElementNS('http://www.w3.org/2000/svg', 'path');
  p.setAttribute('d', path);
  svg.appendChild(p);
  return svg;
}
const I = {
  chevron: 'M9 18l6-6-6-6',
  cloud: 'M17.5 19a4.5 4.5 0 0 0 .5-9 6 6 0 0 0-11.6-1.6A4 4 0 0 0 6 19z',
  globe: 'M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20M2 12h20M12 2a15 15 0 0 1 0 20 15 15 0 0 1 0-20',
  bolt: 'M13 2 4 14h7l-1 8 9-12h-7z',
  shield: 'M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10',
  check: 'M20 6 9 17l-5-5',
};

async function tap(style: ImpactStyle = ImpactStyle.Light): Promise<void> {
  try {
    await Haptics.impact({ style });
  } catch {
    /* web / unavailable */
  }
}
async function notify(type: NotificationType): Promise<void> {
  try {
    await Haptics.notification({ type });
  } catch {
    /* web / unavailable */
  }
}

// ── Screen transitions ──────────────────────────────────────────────────────
let current: HTMLElement | null = null;

function show(screen: HTMLElement, opts: { back?: boolean } = {}): void {
  screen.classList.add('screen', 'screen-enter');
  if (opts.back) screen.classList.add('screen-back');
  const previous = current;
  if (previous) {
    // The leaving screen is lifted out of the flow where it stands, so it fades
    // from its own place rather than jumping to the top of a centred layout.
    previous.style.top = `${previous.offsetTop}px`;
    previous.style.left = `${previous.offsetLeft}px`;
    previous.style.width = `${previous.offsetWidth}px`;
    previous.classList.remove('screen-enter');
    previous.classList.add('screen-leave');
    if (opts.back) previous.classList.add('screen-back');
    previous.addEventListener('animationend', () => previous.remove(), { once: true });
    setTimeout(() => previous.remove(), 400);
  }
  root.append(screen);
  current = screen;
}

function externalLink(text: string, href: string): HTMLAnchorElement {
  return el('a', { href, target: '_blank', rel: 'noopener noreferrer' }, text);
}
function footLinks(...extra: Node[]): HTMLElement {
  return el('div', { className: 'foot-links' }, ...extra, externalLink(t('native.privacy'), PRIVACY_URL));
}
/**
 * A screen's two halves: what it is (brand, title, explanation) and what to do
 * on it (the choices, the form). Stacked in one column they read as before; on
 * a phone or a foldable on its side the screen is too short for one column, so
 * the halves stand side by side there (shell.css, `.col`).
 */
function columns(about: Node[], act: Node[]): HTMLElement[] {
  return [el('div', { className: 'col col-about' }, ...about), el('div', { className: 'col col-act' }, ...act)];
}
function topbar(onBack: () => void): HTMLElement {
  const back = el('button', { type: 'button', className: 'back' }, icon('M15 18l-6-6 6-6', 18), t('native.back'));
  back.addEventListener('click', () => {
    void tap();
    onBack();
  });
  return el('div', { className: 'topbar' }, back);
}

// ── Welcome ─────────────────────────────────────────────────────────────────
function showWelcome(opts: { back?: boolean } = {}): void {
  // The full TREK wordmark, in the variant that reads on the current scheme.
  const hero = el(
    'span',
    { className: 'hero-logo' },
    el('img', { src: logoWhite, alt: 'TREK', className: 'on-dark' }),
    el('img', { src: logoBlack, alt: '', className: 'on-light' })
  );

  const connect = el(
    'button',
    { type: 'button', className: 'btn btn-ghost' },
    el(
      'span',
      { className: 'btn-row' },
      el('b', {}, t('native.welcome.connect')),
      el('small', {}, t('native.welcome.connectSub'))
    ),
    icon(I.chevron, 20, 'chev')
  );
  connect.addEventListener('click', () => {
    void tap();
    showConnect();
  });

  const cloud = el(
    'button',
    { type: 'button', className: 'btn' },
    el(
      'span',
      { className: 'btn-row' },
      el('b', {}, t('native.welcome.getCloud')),
      el('small', {}, t('native.welcome.getCloudSub'))
    ),
    icon(I.chevron, 20, 'chev')
  );
  cloud.addEventListener('click', () => {
    void tap();
    showCloud();
  });

  const demo = el('button', { type: 'button', className: 'demo-link' }, t('native.connect.tryDemo'));
  demo.addEventListener('click', () => runDemo(demo));

  show(
    el(
      'div',
      {},
      ...columns(
        [
          hero,
          el('h1', { className: 'title brand-title' }, t('native.welcome.headline')),
          el('p', { className: 'sub' }, t('native.welcome.sub')),
        ],
        [cloud, connect, demo, footLinks(externalLink(t('native.connect.whatIsServer'), SERVER_DOCS_URL))]
      )
    ),
    opts
  );
}

// ── Connect (address) ───────────────────────────────────────────────────────
/**
 * `recheck`: an app update needs a newer server than the one it remembered, so
 * the address screen comes back once with it filled in, says why and checks it
 * right away. A server that is new enough loads again without another tap.
 */
function showConnect(prefill = '', opts: { back?: boolean; recheck?: boolean } = {}): void {
  const input = el('input', {
    type: 'url',
    placeholder: t('native.connect.placeholder'),
    value: prefill,
    autocapitalize: 'off',
    spellcheck: false,
  });
  input.setAttribute('inputmode', 'url');
  input.setAttribute('autocomplete', 'url');
  // An address reads left to right in every language, Arabic too.
  input.dir = 'ltr';
  // The on-screen keyboard's return key submits the address; it reads "Go", not a newline.
  input.setAttribute('enterkeyhint', 'go');
  input.setAttribute('aria-label', t('native.connect.title'));
  const field = el('div', { className: 'field' }, input);

  const label = el('span', {}, t('native.connect.submit'));
  const submit = el('button', { type: 'submit', className: 'btn' }, label);
  const error = el('p', { className: 'error', role: 'alert' });
  const gatePanel = el('div', { className: 'gate', role: 'alert', hidden: true });
  const form = el('form', { className: 'form', noValidate: true }, field, submit, error, gatePanel);

  const fail = (reason: ProbeFailure, gate?: AuthGate, server?: string, cert?: ClientCertDemand): void => {
    void notify(NotificationType.Error);
    field.classList.add('bad');
    setTimeout(() => field.classList.remove('bad'), 350);
    if (reason === 'authGate' && gate && server) {
      error.textContent = '';
      fillGatePanel(gatePanel, gate, server);
    } else if (reason === 'clientCert' && cert) {
      error.textContent = '';
      fillCertPanel(gatePanel, cert, () => form.requestSubmit());
    } else {
      error.textContent = failureMessage(reason);
    }
    input.disabled = false;
    submit.disabled = false;
    label.textContent = t('native.connect.submit');
    submit.replaceChildren(label);
    // A panel with its own next step stays in view; the keyboard would cover it.
    if (gatePanel.hidden) input.focus();
  };

  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    void tap(ImpactStyle.Medium);
    error.textContent = '';
    gatePanel.hidden = true;
    gatePanel.replaceChildren();
    input.disabled = true;
    submit.disabled = true;
    submit.replaceChildren(el('span', { className: 'spinner' }), t('native.connect.checking'));
    const result = await probeServer(input.value, get);
    if (result.ok) {
      await connected(result.url);
      return;
    }
    fail(result.reason, result.gate, result.url, result.cert);
  });

  show(
    el(
      'div',
      {},
      ...columns(
        [
          topbar(() => showWelcome({ back: true })),
          el('h1', { className: 'title-sm' }, t('native.connect.title')),
          el('p', { className: 'sub' }, t(opts.recheck ? 'native.connect.recheckHint' : 'native.connect.hint')),
        ],
        [form, footLinks(externalLink(t('native.connect.whatIsServer'), SERVER_DOCS_URL))]
      )
    ),
    opts
  );
  if (opts.recheck && prefill) form.requestSubmit();
  else requestAnimationFrame(() => input.focus());
}

/**
 * A sign-in page of the user's own stands in front of the server (authGate.ts):
 * say which one, offer to sign in to it inside the app, which keeps its session
 * as a browser would, and how to let the app through instead.
 */
function fillGatePanel(panel: HTMLElement, gate: AuthGate, server: string): void {
  const name = gate.kind === 'unknown' || gate.kind === 'basic' ? null : AUTH_GATE_NAMES[gate.kind];
  const title =
    gate.kind === 'basic'
      ? t('native.gate.titleBasic')
      : name
        ? t('native.gate.title', { name })
        : t('native.gate.titleUnknown');
  const children: Node[] = [el('p', { className: 'gate-title' }, title)];
  if (canSignInInApp(gate)) {
    const signIn = el(
      'button',
      { type: 'button', className: 'btn' },
      name ? t('native.gate.signIn', { name }) : t('native.gate.signInGeneric')
    );
    signIn.addEventListener('click', () => {
      void tap(ImpactStyle.Medium);
      void connected(server, gate.loginHost ? [gate.loginHost] : []);
    });
    children.push(
      el('p', { className: 'gate-text' }, t('native.gate.hint')),
      signIn,
      el('p', { className: 'gate-note' }, t('native.gate.googleNote'))
    );
  } else {
    children.push(el('p', { className: 'gate-text' }, t('native.gate.basicHint')));
  }
  children.push(externalLink(t('native.gate.help'), AUTH_PROXY_DOCS_URL));
  panel.replaceChildren(...children);
  panel.hidden = false;
}

/**
 * A proxy in front of the server lets only devices with a client certificate
 * through (mutual TLS: Cloudflare, nginx, Caddy, Traefik). The panel offers to
 * add the certificate file for it, or another one when the proxy refused the
 * one shown; `retry` checks the server again once it is added.
 */
function fillCertPanel(panel: HTMLElement, cert: ClientCertDemand, retry: () => void): void {
  const status = el('p', { className: 'gate-note', role: 'status' });
  const choose = el(
    'button',
    { type: 'button', className: 'btn' },
    cert.sent ? t('native.cert.chooseOther') : t('native.cert.choose')
  );
  choose.addEventListener('click', async () => {
    void tap(ImpactStyle.Medium);
    choose.disabled = true;
    status.textContent = '';
    const outcome = await importCertificate(cert.host, cert.port);
    choose.disabled = false;
    if (outcome === 'imported') {
      void notify(NotificationType.Success);
      retry();
    } else if (outcome !== 'cancelled') {
      void notify(NotificationType.Error);
      status.textContent = certFailureMessage(outcome);
    }
  });
  panel.replaceChildren(
    el('p', { className: 'gate-title' }, cert.sent ? t('native.cert.titleRefused') : t('native.cert.title')),
    el(
      'p',
      { className: 'gate-text' },
      cert.sent ? t('native.cert.hintRefused') : t('native.cert.hint', { host: cert.host })
    ),
    choose,
    status,
    externalLink(t('native.cert.help'), CLIENT_CERT_DOCS_URL)
  );
  panel.hidden = false;
}

/** Imports a certificate file for host and port: 'imported', 'cancelled', or why it failed. */
async function importCertificate(
  host: string,
  port: number
): Promise<'imported' | 'cancelled' | ClientCertificateFailure> {
  try {
    const result = await TrekShell.importClientCertificate({
      host,
      port,
      labels: {
        title: t('native.cert.passwordTitle'),
        message: t('native.cert.passwordMessage'),
        placeholder: t('native.cert.passwordPlaceholder'),
        ok: t('native.cert.passwordOk'),
        cancel: t('native.cert.passwordCancel'),
        wrongPassword: t('native.cert.passwordWrong'),
      },
    });
    if (result.result === 'failed') return result.failure ?? 'format';
    return result.result;
  } catch {
    return 'store';
  }
}

function certFailureMessage(failure: ClientCertificateFailure): string {
  switch (failure) {
    case 'no_key':
      return t('native.cert.errorNoKey');
    case 'expired':
      return t('native.cert.errorExpired');
    case 'not_yet_valid':
      return t('native.cert.errorNotYetValid');
    case 'store':
      return t('native.cert.errorStore');
    case 'format':
      return t('native.cert.errorFormat');
  }
}

// ── Get TREK Cloud ──────────────────────────────────────────────────────────
function feature(path: string, text: string): HTMLElement {
  return el(
    'div',
    { className: 'feature' },
    el('span', { className: 'ic' }, icon(path, 18)),
    el('span', { className: 'tx' }, text)
  );
}

function showCloud(opts: { back?: boolean } = {}): void {
  // The label centred, the chevron at the far edge: it points on, not at the word.
  const cta = el(
    'button',
    { type: 'button', className: 'btn btn-go' },
    el('span', { className: 'btn-label' }, t('native.cloud.cta')),
    icon(I.chevron, 20, 'chev')
  );
  cta.addEventListener('click', () => {
    void tap();
    showPlans();
  });

  const have = el('button', { type: 'button', className: 'linkbtn' }, t('native.cloud.haveServer'));
  have.addEventListener('click', () => {
    void tap();
    showConnect();
  });

  show(
    el(
      'div',
      {},
      ...columns(
        [
          topbar(() => showWelcome({ back: true })),
          // The lockup is a logo: "trek" then "cloud" in every language, never mirrored.
          el(
            'div',
            { className: 'cloud-wordmark', role: 'img', ariaLabel: t('native.cloud.title'), dir: 'ltr' },
            el('img', { src: logoWhite, alt: '', className: 'on-dark' }),
            el('img', { src: logoBlack, alt: '', className: 'on-light' }),
            el('span', { className: 'cloud-tag' }, 'cloud')
          ),
          el('p', { className: 'sub' }, t('native.cloud.sub')),
        ],
        [
          el(
            'div',
            { className: 'features' },
            feature(I.globe, t('native.cloud.f1')),
            feature(I.bolt, t('native.cloud.f2')),
            feature(I.shield, t('native.cloud.f3'))
          ),
          cta,
          have,
          footLinks(),
        ]
      )
    ),
    opts
  );
}

// ── Choose a plan (TREK Cloud) ──────────────────────────────────────────────
interface CloudPlan {
  id: string;
  name: string;
  /** Absent while orders are closed: the cloud names its plans but no price leaves it then. */
  monthlyCents?: number;
  yearlyCents?: number;
  aiDocuments: number;
  storageGb: number;
}

function money(cents: number): string {
  return new Intl.NumberFormat(locale, { style: 'currency', currency: 'EUR' }).format(cents / 100);
}

// A sample catalogue for the dev preview only: the cloud site is behind a gate
// during development, so its /api/plans is unreachable from a local build. Never
// used in a real build (see the import.meta.env.DEV guard below).
const SAMPLE_PLANS: CloudPlan[] = [
  { id: 'start', name: 'Start', monthlyCents: 599, yearlyCents: 5990, aiDocuments: 0, storageGb: 10 },
  { id: 'plus', name: 'Plus', monthlyCents: 999, yearlyCents: 9990, aiDocuments: 100, storageGb: 50 },
  { id: 'pro', name: 'Pro', monthlyCents: 1599, yearlyCents: 15990, aiDocuments: 500, storageGb: 200 },
  { id: 'studio', name: 'Studio', monthlyCents: 2399, yearlyCents: 23990, aiDocuments: 2000, storageGb: 1000 },
];

interface CloudPlans {
  plans: CloudPlan[];
  /** Orders are closed: only a test build may buy, and the store charges it nothing. */
  closed: boolean;
}

async function fetchPlans(): Promise<CloudPlans | null> {
  try {
    const res = await get(`${CLOUD_URL}/api/plans`);
    const data = typeof res.data === 'string' ? JSON.parse(res.data) : res.data;
    const body = (data ?? {}) as { plans?: CloudPlan[]; ordering?: string };
    if (Array.isArray(body.plans) && body.plans.length)
      return { plans: body.plans, closed: body.ordering === 'closed' };
  } catch {
    // Fall through to the preview fallback.
  }
  if (import.meta.env?.DEV) return { plans: SAMPLE_PLANS, closed: false };
  return null;
}

/**
 * What the plan picker can sell. With the store, a plan is offered at the price
 * string the App Store gives for its product, in the buyer's currency, and only
 * when the store knows that product. The fake (development, preview) sells
 * every plan at the plan list's price. Without either, nothing is for sale.
 */
interface Offer {
  canBuy: boolean;
  storePrices: Map<string, string> | null;
  /** Orders are closed and this is no test build: the plans show, nothing is for sale yet. */
  opensSoon: boolean;
}

function offerFor(offer: Offer, plan: CloudPlan, interval: 'month' | 'year'): { label: string; buyable: boolean } {
  const cents = interval === 'year' ? plan.yearlyCents : plan.monthlyCents;
  const ours = typeof cents === 'number' ? money(cents) : '';
  const storePrice = offer.storePrices?.get(productIdFor(plan.id, interval));
  if (offer.storePrices) return { label: storePrice ?? ours, buyable: offer.canBuy && !!storePrice };
  return { label: ours, buyable: offer.canBuy && ours !== '' };
}

async function loadOffer(list: CloudPlans): Promise<Offer> {
  const available = await iapReady;
  // Closed: a real purchase is refused at the cloud, so only a test build may buy on iOS;
  // Android keeps the button for the licence testers (see cloudOrders.ts).
  const sandbox = list.closed && !onPlay ? await iap.isSandbox().catch(() => false) : false;
  const soon = opensSoon({ available, closed: list.closed, sandbox, onPlay });
  const canBuy = available && !soon;
  if (!canBuy || iap === fakeIapClient) return { canBuy, storePrices: null, opensSoon: soon };
  const ids = list.plans.flatMap((p) => [productIdFor(p.id, 'month'), productIdFor(p.id, 'year')]);
  return { canBuy, storePrices: await iap.prices(ids), opensSoon: soon };
}

function planCard(plan: CloudPlan, interval: 'month' | 'year', offer: Offer): HTMLElement {
  const { label, buyable } = offerFor(offer, plan, interval);
  const per = interval === 'year' ? t('native.plans.perYear') : t('native.plans.perMonth');
  const feat = (text: string) => el('span', {}, icon(I.check, 16), text);
  // An absent feature (e.g. a plan with no AI documents): a muted dash, not a
  // green tick, so "none" never reads as a perk.
  const featOff = (text: string) => el('span', { className: 'off' }, icon('M5 12h14', 16), text);
  let sub: HTMLElement | null = null;
  if (buyable) {
    sub = el('button', { type: 'button', className: 'btn' }, t('native.plans.subscribe'));
    sub.addEventListener('click', () => {
      void tap(ImpactStyle.Medium);
      showClaim(plan, interval, `${label} ${per}`);
    });
  }
  return el(
    'div',
    { className: 'plan' },
    el(
      'div',
      { className: 'plan-top' },
      el('span', { className: 'plan-name' }, plan.name),
      // No price yet (orders not open): the plan shows without one rather than with an empty one.
      // The price is figures and a currency sign: one left-to-right run, so Arabic
      // keeps "5,99 €" whole, with the period standing apart beside it.
      ...(label ? [el('span', { className: 'plan-price' }, el('bdi', { dir: 'ltr' }, label), el('small', {}, per))] : [])
    ),
    el(
      'div',
      { className: 'plan-feats' },
      feat(t('native.plans.unlimited')),
      feat(t('native.plans.storage', { n: String(plan.storageGb) })),
      plan.aiDocuments > 0
        ? feat(t('native.plans.aiDocs', { n: String(plan.aiDocuments) }))
        : featOff(t('native.plans.noAi'))
    ),
    ...(sub ? [sub] : [])
  );
}

/**
 * Below the plans. With a store: how the subscription renews, the terms and the
 * privacy policy, and a way to restore a subscription this Apple ID already
 * holds (a reinstall, a new phone). Without one: only that buying in the app is
 * not available, and no pointer elsewhere.
 */
/** The restore button of the plans on screen, which redeems a payment that cleared later. */
let resumeRestore: (() => void) | null = null;
let watchingTransactions = false;

function planFooter(offer: Offer, plans: CloudPlan[]): Node[] {
  if (offer.opensSoon) return [el('p', { className: 'note' }, t('native.plans.closed'))];
  if (!offer.canBuy) return [el('p', { className: 'note' }, t('native.plans.soon'))];

  const status = el('p', { className: 'hint', role: 'status' });
  const restore = el('button', { type: 'button', className: 'btn btn-ghost' }, t('native.plans.restore'));
  restore.addEventListener('click', async () => {
    void tap();
    restore.disabled = true;
    status.className = 'hint';
    status.textContent = t('native.plans.restoring');
    const purchase = await iap.restore();
    if (!purchase) {
      restore.disabled = false;
      status.textContent = t(onPlay ? 'native.plans.restoreNoneAndroid' : 'native.plans.restoreNone');
      return;
    }
    // A restore finds the instance the purchase was first redeemed for; address and email are not asked again.
    const redeemed = await redeemPurchase('', '', purchase);
    if (redeemed.ok && redeemed.instanceUrl) {
      await iap.finish(purchase);
      showProvisioning(redeemed.instanceUrl);
      return;
    }
    // Paid but never set up (Ask to Buy approved later, the app closed mid-purchase):
    // the claim screen takes the purchase as it is, so nothing is bought twice.
    const unclaimed = redeemed.code === 'email-invalid' || (redeemed.code ?? '').startsWith('slug-');
    const match = /^cloud\.([a-z0-9-]+)\.(monthly|yearly)$/.exec(purchase.productId);
    const plan = match ? plans.find((p) => p.id === match[1]) : undefined;
    if (unclaimed && match && plan) {
      const interval = match[2] === 'yearly' ? 'year' : 'month';
      const { label } = offerFor(offer, plan, interval);
      const per = interval === 'year' ? t('native.plans.perYear') : t('native.plans.perMonth');
      showClaim(plan, interval, `${label} ${per}`, { bought: purchase });
      return;
    }
    void notify(NotificationType.Error);
    restore.disabled = false;
    status.className = 'hint bad';
    // Bought before the opening: refused, unacknowledged, and refunded by Google Play.
    status.textContent = refundedBeforeOpening(redeemed.code, onPlay)
      ? t('native.claim.closedRefund')
      : t('native.plans.restoreFailed');
  });

  // A payment that was pending (cash, some carrier billing) and has cleared since:
  // redeemed right away, as the restore would, before Google Play refunds it.
  resumeRestore = () => {
    if (!restore.disabled && restore.isConnected) restore.click();
  };
  if (!watchingTransactions) {
    watchingTransactions = true;
    iap.onTransaction(() => resumeRestore?.());
  }
  void iap.unfinished().then((purchase) => {
    if (purchase) resumeRestore?.();
  });

  return [
    restore,
    status,
    el('p', { className: 'note' }, t(onPlay ? 'native.plans.legalAndroid' : 'native.plans.legal')),
    el(
      'div',
      { className: 'foot-links' },
      externalLink(t('native.plans.ourTerms'), CLOUD_TERMS_URL),
      ...(onPlay ? [] : [externalLink(t('native.plans.terms'), STORE_TERMS_URL)]),
      externalLink(t('native.privacy'), PRIVACY_URL)
    ),
  ];
}

function showPlans(opts: { back?: boolean } = {}): void {
  let interval: 'month' | 'year' = 'month';
  let plans: CloudPlan[] | null = null;
  let offer: Offer = { canBuy: false, storePrices: null, opensSoon: false };

  const content = el('div', { className: 'loading' }, el('span', { className: 'spinner' }));
  const footer = el('div', { className: 'plans-foot' });

  const monthBtn = el('button', { type: 'button' }, t('native.plans.monthly'));
  const yearBtn = el('button', { type: 'button' }, t('native.plans.yearly'));
  const seg = el('div', { className: 'segmented' }, monthBtn, yearBtn);

  const paintSeg = () => {
    monthBtn.setAttribute('aria-pressed', String(interval === 'month'));
    yearBtn.setAttribute('aria-pressed', String(interval === 'year'));
  };
  const renderList = () => {
    const list = plans;
    if (!list) return;
    content.className = 'plans';
    content.replaceChildren(...list.map((p) => planCard(p, interval, offer)));
  };
  const choose = (next: 'month' | 'year') => {
    if (interval === next) return;
    void tap();
    interval = next;
    paintSeg();
    renderList();
  };
  monthBtn.addEventListener('click', () => choose('month'));
  yearBtn.addEventListener('click', () => choose('year'));
  paintSeg();

  const load = async () => {
    const list = await fetchPlans();
    if (list) {
      offer = await loadOffer(list);
      plans = list.plans;
      renderList();
      footer.replaceChildren(...planFooter(offer, list.plans));
      return;
    }
    content.className = '';
    const retry = el('button', { type: 'button', className: 'btn btn-ghost' }, t('native.plans.retry'));
    retry.addEventListener('click', () => {
      void tap();
      content.className = 'loading';
      content.replaceChildren(el('span', { className: 'spinner' }));
      void load();
    });
    content.replaceChildren(el('p', { className: 'error' }, t('native.plans.loadError')), retry);
  };

  show(
    el(
      'div',
      {},
      ...columns(
        [
          topbar(() => showCloud({ back: true })),
          el('h1', { className: 'title-sm' }, t('native.plans.title')),
          el('p', { className: 'sub' }, t('native.plans.sub')),
          seg,
        ],
        [content, footer]
      )
    ),
    opts
  );
  void load();
}

// ── Claim a TREK Cloud instance (choose address, buy, provision) ────────────
type SlugStatus = 'available' | 'taken' | 'invalid' | 'reserved' | 'error';

async function slugStatus(slug: string): Promise<SlugStatus> {
  try {
    const res = await get(`${CLOUD_URL}/api/slug/check?slug=${encodeURIComponent(slug)}`);
    const data = typeof res.data === 'string' ? JSON.parse(res.data) : res.data;
    const status = (data as { status?: string })?.status;
    if (status === 'available' || status === 'taken' || status === 'invalid' || status === 'reserved') return status;
    return 'error';
  } catch {
    return 'error';
  }
}

interface RedeemResult {
  ok: boolean;
  /** Set when ok: the address the app loads. */
  instanceUrl?: string;
  /** Set when ok and a password was chosen: the one-time code that signs the buyer in once the instance answers. */
  welcome?: string;
  /** Set when not ok: a stable refusal code. */
  code?: string;
}
async function redeemPurchase(slug: string, email: string, purchase: Purchase, password = ''): Promise<RedeemResult> {
  try {
    const res = await CapacitorHttp.post({
      url: `${CLOUD_URL}/api/iap/redeem`,
      headers: { 'content-type': 'application/json' },
      connectTimeout: PROBE_TIMEOUT_MS,
      readTimeout: PROBE_TIMEOUT_MS,
      // The language of the contract confirmation mail.
      data: {
        platform: purchase.platform,
        productId: purchase.productId,
        receipt: purchase.receipt,
        slug,
        email,
        // Hashed by the control plane on arrival and set on the new instance; empty for a restore.
        ...(password ? { password } : {}),
        locale,
      },
    });
    const data = typeof res.data === 'string' ? JSON.parse(res.data) : res.data;
    const body = (data ?? {}) as { instanceUrl?: string; code?: string; welcome?: string };
    if ((res.status === 200 || res.status === 201) && typeof body.instanceUrl === 'string') {
      const welcome = typeof body.welcome === 'string' && /^[A-Za-z0-9_-]{43}$/.test(body.welcome) ? body.welcome : undefined;
      return { ok: true, instanceUrl: body.instanceUrl, ...(welcome ? { welcome } : {}) };
    }
    return { ok: false, code: body.code ?? 'redeem-failed' };
  } catch {
    return { ok: false, code: 'redeem-failed' };
  }
}

function showClaim(
  plan: CloudPlan,
  interval: 'month' | 'year',
  price: string,
  opts: { back?: boolean; bought?: Purchase } = {}
): void {
  /** A purchase that went through but whose redeem did not: a retry redeems it again instead of buying twice. */
  let bought: Purchase | null = opts.bought ?? null;

  const slugInput = el('input', {
    type: 'text',
    className: 'slug-input',
    autocapitalize: 'off',
    spellcheck: false,
    value: '',
    placeholder: t('native.claim.addressLabel'),
  });
  slugInput.setAttribute('inputmode', 'url');
  slugInput.setAttribute('autocomplete', 'off');
  slugInput.setAttribute('maxlength', '40');
  slugInput.setAttribute('aria-label', t('native.claim.addressLabel'));
  slugInput.setAttribute('enterkeyhint', 'next');
  // "name.liketrek.com" is one address, left to right in every language.
  const slugField = el(
    'div',
    { className: 'field slug-field', dir: 'ltr' },
    slugInput,
    el('span', { className: 'slug-suffix' }, cloudSuffix())
  );
  const slugNote = el('p', { className: 'hint' });

  const emailInput = el('input', {
    type: 'email',
    value: '',
    autocapitalize: 'off',
    spellcheck: false,
    placeholder: t('native.claim.emailLabel'),
  });
  emailInput.setAttribute('inputmode', 'email');
  emailInput.setAttribute('autocomplete', 'email');
  emailInput.setAttribute('enterkeyhint', 'next');
  emailInput.setAttribute('aria-label', t('native.claim.emailLabel'));
  emailInput.dir = 'ltr';
  emailInput.classList.add('ltr-value');
  const emailField = el('div', { className: 'field' }, emailInput);

  // The password for the new TREK, chosen here so the buyer lands signed in (no password by mail).
  const passwordInput = el('input', {
    type: 'password',
    value: '',
    autocapitalize: 'off',
    spellcheck: false,
    placeholder: t('native.claim.passwordLabel'),
  });
  passwordInput.setAttribute('autocomplete', 'new-password');
  passwordInput.setAttribute('enterkeyhint', 'go');
  passwordInput.setAttribute('maxlength', '128');
  passwordInput.setAttribute('aria-label', t('native.claim.passwordLabel'));
  passwordInput.dir = 'ltr';
  passwordInput.classList.add('ltr-value');
  const passwordField = el('div', { className: 'field' }, passwordInput);
  const passwordHint = el('p', { className: 'hint' }, t('native.claim.passwordHint'));

  const submit = el('button', { type: 'submit', className: 'btn' }, t('native.claim.subscribe', { price }));
  const error = el('p', { className: 'error', role: 'alert' });
  const form = el(
    'form',
    { className: 'form', noValidate: true },
    slugField,
    slugNote,
    emailField,
    el('p', { className: 'hint' }, t('native.claim.emailHint')),
    passwordField,
    passwordHint,
    // Our terms govern the instance (terms § 5a): named before the purchase, not only in the confirmation mail.
    el(
      'p',
      { className: 'note' },
      t('native.claim.agree'),
      ' ',
      externalLink(t('native.plans.ourTerms'), CLOUD_TERMS_URL)
    ),
    submit,
    error
  );

  // "Next" moves on to the next field instead of sending the form half filled;
  // "Go" on the password sends it.
  const nextOnEnter = (from: HTMLInputElement, to: HTMLInputElement) =>
    from.addEventListener('keydown', (e) => {
      if (e.key !== 'Enter' || e.isComposing) return;
      e.preventDefault();
      to.focus();
    });
  nextOnEnter(slugInput, emailInput);
  nextOnEnter(emailInput, passwordInput);

  let status: SlugStatus | null = null;
  let timer: ReturnType<typeof setTimeout> | undefined;
  const noteFor: Partial<Record<SlugStatus, string>> = {
    available: t('native.claim.free'),
    taken: t('native.claim.taken'),
    invalid: t('native.claim.invalid'),
    reserved: t('native.claim.reserved'),
  };
  slugInput.addEventListener('input', () => {
    clearTimeout(timer);
    status = null;
    slugNote.textContent = '';
    slugNote.className = 'hint';
    slugField.classList.remove('bad');
    const value = slugInput.value.trim().toLowerCase();
    if (value.length < 3) return;
    timer = setTimeout(async () => {
      const result = await slugStatus(value);
      if (slugInput.value.trim().toLowerCase() !== value) return;
      status = result;
      slugNote.textContent = noteFor[result] ?? '';
      slugNote.className = `hint ${result === 'available' ? 'ok' : result === 'error' ? '' : 'bad'}`;
    }, 350);
  });

  const shake = (field: HTMLElement): void => {
    void notify(NotificationType.Error);
    field.classList.add('bad');
    setTimeout(() => field.classList.remove('bad'), 350);
  };

  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    error.textContent = '';
    const slug = slugInput.value.trim().toLowerCase();
    const email = emailInput.value.trim();
    if (slug.length < 3 || status === 'taken' || status === 'invalid' || status === 'reserved') {
      shake(slugField);
      slugInput.focus();
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      shake(emailField);
      emailInput.focus();
      return;
    }
    // Before anything is bought: a password TREK would refuse must not cost a purchase first.
    const password = passwordInput.value;
    if (passwordProblem(password) || password.length > 128) {
      shake(passwordField);
      passwordHint.className = 'hint bad';
      passwordInput.focus();
      return;
    }
    passwordHint.className = 'hint';

    void tap(ImpactStyle.Medium);
    // The purchase sheet and the progress want the whole screen, not the keyboard.
    passwordInput.blur();
    const lock = (on: boolean) => {
      slugInput.disabled = on;
      emailInput.disabled = on;
      passwordInput.disabled = on;
      submit.disabled = on;
    };
    lock(true);
    submit.replaceChildren(el('span', { className: 'spinner' }), t('native.connect.checking'));
    const restore = () => {
      lock(false);
      submit.replaceChildren(t('native.claim.subscribe', { price }));
    };

    if (!bought) {
      const outcome = await iap.purchase(productIdFor(plan.id, interval));
      if (outcome.kind === 'cancelled') {
        restore();
        error.textContent = t('native.claim.cancelled');
        return;
      }
      if (outcome.kind === 'pending') {
        restore();
        error.textContent = t('native.claim.pending');
        return;
      }
      if (outcome.kind === 'failed') {
        void notify(NotificationType.Error);
        restore();
        error.textContent = t('native.claim.failed');
        return;
      }
      bought = outcome.purchase;
    }

    const redeemed = await redeemPurchase(slug, email, bought, password);
    if (redeemed.ok && redeemed.instanceUrl) {
      await iap.finish(bought);
      showProvisioning(redeemed.instanceUrl, redeemed.welcome);
      return;
    }
    void notify(NotificationType.Error);
    restore();
    if (redeemed.code === 'slug-taken') {
      shake(slugField);
      slugNote.textContent = t('native.claim.taken');
      slugNote.className = 'hint bad';
    } else if (redeemed.code === 'password-weak') {
      // A common password the list on the server knows: the purchase waits, unredeemed, for a better one.
      shake(passwordField);
      passwordHint.className = 'hint bad';
    } else {
      error.textContent = refundedBeforeOpening(redeemed.code, onPlay)
        ? t('native.claim.closedRefund')
        : t('native.claim.redeemFailed');
    }
  });

  show(
    el(
      'div',
      {},
      ...columns(
        [
          topbar(() => showPlans({ back: true })),
          el('h1', { className: 'title-sm' }, t('native.claim.title')),
          el('p', { className: 'sub' }, t('native.claim.sub')),
        ],
        [form]
      )
    ),
    opts
  );
  requestAnimationFrame(() => slugInput.focus());
}

/** The build runs on the server; the app waits on the new address and loads it the moment it answers. */
function showProvisioning(instanceUrl: string, welcome?: string): void {
  const host = (() => {
    try {
      return new URL(instanceUrl).host;
    } catch {
      return instanceUrl;
    }
  })();

  const spinner = el('div', { className: 'provision-mark' }, el('span', { className: 'spinner' }));
  show(
    el(
      'div',
      { className: 'screen-center' },
      spinner,
      el('h1', { className: 'title-sm' }, t('native.provisioning.title')),
      el('p', { className: 'sub' }, t('native.provisioning.sub', { host }))
    )
  );

  const deadline = Date.now() + 180_000;
  const poll = async (): Promise<void> => {
    const result = await probeServer(instanceUrl, get);
    if (result.ok) {
      await connected(result.url, [], welcome);
      return;
    }
    if (Date.now() > deadline) {
      showProvisioningSlow(instanceUrl, welcome);
      return;
    }
    setTimeout(() => void poll(), 4000);
  };
  setTimeout(() => void poll(), 3000);
}

function showProvisioningSlow(instanceUrl: string, welcome?: string): void {
  void notify(NotificationType.Warning);
  const retry = el('button', { type: 'button', className: 'btn' }, t('native.provisioning.retry'));
  retry.addEventListener('click', () => {
    void tap();
    showProvisioning(instanceUrl, welcome);
  });
  show(
    el(
      'div',
      { className: 'screen-center' },
      el('h1', { className: 'title-sm' }, t('native.provisioning.failedTitle')),
      el('p', { className: 'sub' }, t('native.provisioning.failedSub')),
      retry
    )
  );
}

// ── Shared actions ──────────────────────────────────────────────────────────
async function runDemo(button: HTMLButtonElement, error?: HTMLElement): Promise<void> {
  void tap();
  if (error) error.textContent = '';
  button.disabled = true;
  const result = await probeDemo(get);
  if (result.ok) {
    await connected(result.url);
    return;
  }
  button.disabled = false;
  if (error) {
    error.textContent = failureMessage(result.reason);
  } else {
    void notify(NotificationType.Error);
  }
}

/**
 * The tick, then the server takes over. A beat so the success registers. With a
 * welcome code (a purchase with a chosen password) the app opens the instance's
 * welcome page once, which signs the buyer in; an app build without that option
 * opens the sign-in page instead, where the chosen password works.
 */
async function connected(url: string, signInHosts: string[] = [], welcome?: string): Promise<void> {
  void notify(NotificationType.Success);
  const host = (() => {
    try {
      return new URL(url).host;
    } catch {
      return url;
    }
  })();
  const tick = el('div', { className: 'tick' });
  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  svg.setAttribute('viewBox', '0 0 24 24');
  svg.setAttribute('fill', 'none');
  svg.setAttribute('stroke', 'currentColor');
  svg.setAttribute('stroke-width', '2.5');
  svg.setAttribute('stroke-linecap', 'round');
  svg.setAttribute('stroke-linejoin', 'round');
  const p = document.createElementNS('http://www.w3.org/2000/svg', 'path');
  p.setAttribute('d', I.check);
  svg.appendChild(p);
  tick.appendChild(svg);
  show(
    el('div', { className: 'success' }, tick, el('h1', { className: 'title-sm' }, t('native.connecting', { host })))
  );
  await new Promise((r) => setTimeout(r, 700));
  await TrekShell.setServer({
    url,
    labels: { signInHint: t('native.signInBar.hint'), changeServer: t('native.changeServer') },
    ...(signInHosts.length ? { signInHosts } : {}),
    ...(welcome ? { welcome } : {}),
  });
}

function showUnreachable(server: string, cert?: ClientCertDemand): void {
  const certPanel = el('div', { className: 'gate', role: 'alert', hidden: true });
  if (cert) fillCertPanel(certPanel, cert, () => void TrekShell.reload());
  const retry = el('button', { type: 'button', className: cert ? 'linkbtn' : 'btn' }, t('native.offline.retry'));
  retry.addEventListener('click', () => {
    void tap();
    retry.disabled = true;
    void TrekShell.reload();
  });
  const change = el('button', { type: 'button', className: 'linkbtn' }, t('native.changeServer'));
  change.addEventListener('click', () => {
    void tap();
    void TrekShell.resetServer();
  });
  show(
    el(
      'div',
      {},
      ...columns(
        [
          el('img', { src: logoUrl, alt: '', className: 'shell-logo' }),
          el('h1', { className: 'title-sm' }, cert ? t('native.cert.unreachableTitle') : t('native.offline.title')),
          el(
            'p',
            { className: 'sub' },
            cert
              ? t('native.cert.unreachableHint', { server: new URL(server).host })
              : t('native.offline.hint', { server: new URL(server).host })
          ),
        ],
        [certPanel, retry, change, footLinks()]
      )
    )
  );
}

// ── Start ───────────────────────────────────────────────────────────────────
/**
 * The address screen is always on the near-black surface, so the status bar must
 * draw its clock and icons in light. The server's UI sets its own style once it
 * loads (native/nativeApp.ts); this is only for the screen the app ships. Fails
 * quietly where there is no status bar (web, the simulator without the plugin).
 */
async function paintStatusBar(): Promise<void> {
  try {
    await StatusBar.setStyle({ style: Style.Dark });
  } catch {
    /* web / unavailable: no native status bar to style */
  }
}

/**
 * Android's back gesture steps back through the first screens as their own
 * back button does, and only leaves the app from a screen that has none.
 */
function followBackGesture(): void {
  try {
    void App.addListener('backButton', () => {
      const back = current?.querySelector<HTMLButtonElement>('.topbar .back');
      if (back) back.click();
      else void App.minimizeApp();
    });
  } catch {
    /* web / unavailable: no system back gesture */
  }
}

/**
 * The keyboard closes the ways it does in an iOS app: a tap beside the fields,
 * or a drag of the screen. A web view keeps it open for both, and on the claim
 * screen the keyboard covered the hints and the terms with no way to put it away.
 */
function letKeyboardClose(): void {
  const isField = (target: EventTarget | null) =>
    target instanceof Element && !!target.closest('input, textarea, select, [contenteditable="true"], .field');
  const close = () => {
    const active = document.activeElement;
    if (active instanceof HTMLElement && isField(active)) active.blur();
  };
  document.addEventListener('pointerdown', (e) => {
    if (!isField(e.target)) close();
  }, true);
  let startY: number | null = null;
  document.addEventListener('touchstart', (e) => {
    startY = isField(e.target) ? null : (e.touches[0]?.clientY ?? null);
  }, { passive: true });
  document.addEventListener('touchmove', (e) => {
    const y = e.touches[0]?.clientY;
    if (startY !== null && y !== undefined && Math.abs(y - startY) > 10) {
      startY = null;
      close();
    }
  }, { passive: true });
}

/**
 * Whether the remembered server failed for want of a client certificate. Asked
 * only when the app saw that server ask for one in this run, and then checked
 * once more, so a server that is merely offline is not taken for one that
 * refused the certificate.
 */
async function certificateDemand(server: string): Promise<ClientCertDemand | null> {
  try {
    const { request } = await TrekShell.clientCertificate();
    if (!request || request.host !== new URL(server).hostname.toLowerCase()) return null;
    const result = await probeServer(server, get);
    return result.ok ? null : (result.cert ?? null);
  } catch {
    return null;
  }
}

async function start(): Promise<void> {
  void paintStatusBar();
  followBackGesture();
  letKeyboardClose();
  let url: string | null;
  let previousUrl: string | null | undefined;
  try {
    ({ url, previousUrl } = await TrekShell.getServer());
  } catch {
    // No native shell under us (a web preview, or a simulator without the
    // plugin): there is no remembered server, so start at the welcome screen
    // rather than leaving a blank page.
    showWelcome();
    await SplashScreen.hide().catch(() => {});
    return;
  }
  if (!url && previousUrl) {
    showConnect(previousUrl, { recheck: true });
  } else if (!url) {
    showWelcome();
  } else {
    // Only reached when loading the server failed. A proxy that wanted a client
    // certificate says so here, before the offline copy would start a UI that
    // cannot reach its server.
    const cert = await certificateDemand(url);
    if (cert) {
      showUnreachable(url, cert);
    } else {
      // On iOS the stored copy of its start page brings the offline-capable UI up anyway.
      const { opened } = await TrekShell.openOfflineCopy();
      if (opened) return;
      showUnreachable(url);
    }
  }
  await SplashScreen.hide();
}

void start();
