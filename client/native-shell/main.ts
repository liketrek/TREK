import { App } from '@capacitor/app';
import { Capacitor, CapacitorHttp } from '@capacitor/core';
import { Haptics, ImpactStyle, NotificationType } from '@capacitor/haptics';
import { SplashScreen } from '@capacitor/splash-screen';
import { StatusBar, Style } from '@capacitor/status-bar';
import { PASSWORD_MIN_LENGTH, passwordProblem, passwordRuleStates } from '../../shared/src/auth/password-policy';
import logoWhite from '../public/logo-light.svg'; // #fff wordmark, for the landscape
import { AUTH_GATE_NAMES, canSignInInApp, type AuthGate } from '../src/native/authGate';
import { opensSoon, refundedBeforeOpening } from '../src/native/cloudOrders';
import { fakeIapClient, getIapClient, productIdFor, type Purchase } from '../src/native/iap';
import {
  APP_STORE_SUBSCRIPTIONS_URL,
  AUTH_PROXY_DOCS_URL,
  CLIENT_CERT_DOCS_URL,
  CLOUD_TERMS_URL,
  CLOUD_URL,
  PLAY_SUBSCRIPTIONS_URL,
  PRIVACY_URL,
  STORE_TERMS_URL,
} from '../src/native/links';
import {
  certificateTargetFor,
  probeDemo,
  probeServer,
  type ClientCertDemand,
  type ProbeFailure,
  type ProbeGet,
} from '../src/native/serverAddress';
import { TrekShell, type ClientCertificateFailure } from '../src/native/trekShell';
import { amountIn } from './amount';
import { directionOf, pickLocale, translator } from './i18n';
import { WELCOME_CAMERA, cameraForPlan, startScenery, type Camera, type Scenery } from './scenery';
import './shell.css';

/**
 * The only pages the app ships itself. They welcome someone on first start, ask
 * for the TREK server they open in their browser, offer TREK Cloud to someone
 * without one, and stand in when a remembered server cannot be reached. Every
 * screen stands on the same landscape (scenery.ts); the plans move the camera
 * through it. Everything past them is the UI the chosen server delivers.
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

function icon(path: string, size = 18, className?: string): SVGSVGElement {
  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  svg.setAttribute('viewBox', '0 0 24 24');
  svg.setAttribute('width', String(size));
  svg.setAttribute('height', String(size));
  svg.setAttribute('fill', 'none');
  svg.setAttribute('stroke', 'currentColor');
  svg.setAttribute('stroke-width', '2');
  svg.setAttribute('stroke-linecap', 'round');
  svg.setAttribute('stroke-linejoin', 'round');
  svg.setAttribute('aria-hidden', 'true');
  if (className) svg.setAttribute('class', className);
  const p = document.createElementNS('http://www.w3.org/2000/svg', 'path');
  p.setAttribute('d', path);
  svg.appendChild(p);
  return svg;
}
const I = {
  back: 'M15 18l-6-6 6-6',
  globe: 'M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20M2 12h20M12 2a15 15 0 0 1 0 20 15 15 0 0 1 0-20',
  image:
    'M5 3h14a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2zM8.5 10a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3zM21 15l-5-5L5 21',
  spark: 'M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8z',
  people:
    'M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75',
  shield: 'M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10',
  check: 'M20 6 9 17l-5-5',
  lock: 'M6 11h12a2 2 0 0 1 2 2v7a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2zM8 11V8a4 4 0 0 1 8 0v3',
  key: 'M7.5 20a4.5 4.5 0 1 0 0-9 4.5 4.5 0 0 0 0 9zM10.7 12.3 21 2M16 7l3 3M14 9l2 2',
  alert: 'M12 21.5a9.5 9.5 0 1 0 0-19 9.5 9.5 0 0 0 0 19zM12 7.5v5.5M12 16.5h.01',
  wifiOff:
    'M2 2l20 20M8.5 16.5a5 5 0 0 1 7 0M5 13a10 10 0 0 1 5.2-2.8M19 13a10 10 0 0 0-2.2-1.6M2 8.8a15 15 0 0 1 4.4-2.8M22 8.8A15 15 0 0 0 11 5M12 20h.01',
  gate: 'M6.5 10h11a2.5 2.5 0 0 1 2.5 2.5v6a2.5 2.5 0 0 1-2.5 2.5h-11A2.5 2.5 0 0 1 4 18.5v-6A2.5 2.5 0 0 1 6.5 10zM8 10V7a4 4 0 0 1 8 0v3M12 14.5V17',
  cloud: 'M7 18a4.5 4.5 0 0 1-.6-8.96A6 6 0 0 1 18 9.5a4 4 0 0 1-.5 8.5z',
  clock: 'M12 21.5a9.5 9.5 0 1 0 0-19 9.5 9.5 0 0 0 0 19zM12 7v5l3 2',
  update: 'M12 3v12M7 10l5 5 5-5M5 21h14',
  eye: 'M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7S2 12 2 12zM12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6z',
  out: 'M7 17 17 7M9 7h8v8',
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

function externalLink(text: string, href: string, className?: string): HTMLAnchorElement {
  return el('a', { href, target: '_blank', rel: 'noopener noreferrer', ...(className ? { className } : {}) }, text);
}

// ── Screens ─────────────────────────────────────────────────────────────────
let current: HTMLElement | null = null;

/** The layout with the landscape beside the content: an iPad, an unfolded phone, a phone on its side. */
const wideLayout = matchMedia('(min-width: 900px), (orientation: landscape) and (max-height: 500px)');

/**
 * A screen: the landscape on top (beside, on a wide screen) and the content.
 * The landscape starts drawing once the screen is on the page, from `camera`.
 */
interface Screen {
  node: HTMLElement;
  hero: HTMLElement;
  body: HTMLElement;
  scenery: Scenery | null;
}

type HeroKind = 'welcome' | 'plain' | 'tall';
const FRAME: Record<HeroKind, number> = { welcome: 376, plain: 300, tall: 320 };

function backButton(onBack: () => void): HTMLButtonElement {
  const back = el('button', { type: 'button', className: 'back' }, icon(I.back, 20));
  back.setAttribute('aria-label', t('native.back'));
  back.addEventListener('click', () => {
    void tap();
    onBack();
  });
  return back;
}

function show(
  kind: HeroKind,
  camera: Camera,
  parts: { overlay?: Node[]; content: Node[]; back?: () => void },
  opts: { back?: boolean } = {}
): Screen {
  const hero = el('div', { className: kind === 'plain' ? 'hero' : `hero ${kind}` });
  if (parts.back) hero.append(backButton(parts.back));
  hero.append(...(parts.overlay ?? []));
  const body = el('div', { className: 'body' }, ...parts.content);
  const node = el('div', { className: `scr enter${opts.back ? ' reverse' : ''}` }, hero, body);
  current?.remove();
  root.append(node);
  current = node;
  const scenery = startScenery(hero, { frame: FRAME[kind], camera, haze: kind === 'welcome' && !wideLayout.matches });
  return { node, hero, body, scenery };
}

/** The glass card over the landscape: what this screen is about, an address in large type. */
interface GlassCard {
  node: HTMLElement;
  kicker: HTMLElement;
  glyph: HTMLElement;
  text: HTMLElement;
  /** Shrinks the type until the whole address fits on one line. */
  fit(): void;
}
function glassCard(kicker: string, glyph: string, text: Node[]): GlassCard {
  const kick = el('small', {}, kicker);
  const mark = el('i', {}, icon(glyph, 16));
  const line = el('span', { className: 'url-text', dir: 'ltr' }, ...text);
  const node = el('div', { className: 'card' }, kick, el('div', { className: 'url' }, mark, line));
  return {
    node,
    kicker: kick,
    glyph: mark,
    text: line,
    fit() {
      let size = 22;
      line.style.fontSize = `${size}px`;
      while (size > 13 && line.scrollWidth > line.clientWidth) {
        size -= 1;
        line.style.fontSize = `${size}px`;
      }
    },
  };
}
function setKicker(
  card: GlassCard,
  text: string,
  opts: { busy?: boolean; tone?: 'ok' | 'bad'; glyph?: string } = {}
): void {
  card.kicker.replaceChildren(...(opts.busy ? [el('span', { className: 'spin' })] : []), text);
  card.node.classList.toggle('ok', opts.tone === 'ok');
  card.node.classList.toggle('bad', opts.tone === 'bad');
  if (opts.glyph) card.glyph.replaceChildren(icon(opts.glyph, 16));
}

function notice(text: string): HTMLElement {
  const box = el('div', { className: 'notice', role: 'alert' });
  setNotice(box, text);
  return box;
}
function setNotice(box: HTMLElement, text: string): void {
  box.replaceChildren(...(text ? [el('i', {}, icon(I.alert, 18)), el('span', {}, text)] : []));
}

function shake(field: HTMLElement): void {
  void notify(NotificationType.Error);
  field.classList.remove('bad');
  void field.offsetWidth;
  field.classList.add('bad');
  setTimeout(() => field.classList.remove('bad'), 900);
}

/** A field on a white card: its label above, the input, an optional badge on the card's edge. */
function field(
  label: string,
  input: HTMLInputElement,
  extra: { after?: Node[]; edge?: HTMLElement; below?: Node[] } = {}
): HTMLLabelElement {
  return el(
    'label',
    { className: 'fld' },
    el('span', { className: 'lab' }, label),
    el('span', { className: 'row' }, input, ...(extra.after ?? [])),
    ...(extra.edge ? [extra.edge] : []),
    ...(extra.below ?? [])
  );
}

// ── Welcome ─────────────────────────────────────────────────────────────────
function showWelcome(opts: { back?: boolean } = {}): void {
  const perk = (glyph: string, title: string, sub: string) =>
    el('div', {}, el('i', {}, icon(glyph, 17)), el('span', {}, el('b', {}, title), el('small', {}, sub)));

  const discover = el('button', { type: 'button', className: 'cta' }, t('native.welcome.discover'));
  discover.addEventListener('click', () => {
    void tap();
    showPlans();
  });
  const have = el('button', { type: 'button', className: 'cta2' }, t('native.cloud.haveServer'));
  have.addEventListener('click', () => {
    void tap();
    showConnect();
  });

  show(
    'welcome',
    WELCOME_CAMERA,
    {
      overlay: [el('img', { src: logoWhite, alt: 'TREK', className: 'logo' })],
      content: [
        el(
          'div',
          { className: 'pad grow' },
          el('h1', {}, t('native.welcome.title')),
          el('p', { className: 'lead' }, t('native.welcome.lead')),
          el(
            'div',
            { className: 'perks' },
            perk(I.globe, t('native.welcome.routeTitle'), t('native.welcome.routeSub')),
            perk(I.people, t('native.welcome.togetherTitle'), t('native.welcome.togetherSub')),
            perk(I.image, t('native.welcome.photosTitle'), t('native.welcome.photosSub'))
          ),
          el('div', { className: 'push' }),
          el('div', { className: 'btns' }, discover, have)
        ),
      ],
    },
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
  const host = el('b', { className: 'ph' }, 'trek.example.com');
  const caret = el('span', { className: 'caret', ariaHidden: 'true' });
  const card = glassCard(t('native.connect.yourTrek'), I.globe, [caret, host]);

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
  const found = el('span', { className: 'edge on', hidden: true }, icon(I.check, 12), t('native.connect.found'));
  const addressField = field(t('native.connect.addressField'), input, { edge: found });

  const error = notice('');
  const panel = el('div', { className: 'panel', role: 'alert', hidden: true });
  // The check offers a certificate when the proxy asks for one during the
  // handshake. This adds one up front: for someone who knows their proxy wants
  // it, and for a proxy that refuses without asking, which the check cannot tell.
  const addCert = el(
    'button',
    { type: 'button', className: 'side' },
    icon(I.shield, 18),
    el('span', {}, t('native.connect.addCert'))
  );
  const submit = el('button', { type: 'button', className: 'cta' }, t('native.connect.submit'));
  const demo = el('button', { type: 'button', className: 'link' }, t('native.connect.tryDemo'));
  const form = el(
    'form',
    { className: 'pad form', noValidate: true },
    el('h1', { className: 'title' }, t('native.connect.title')),
    el('p', { className: 'sub' }, t(opts.recheck ? 'native.connect.recheckHint' : 'native.connect.hint')),
    addressField,
    error,
    panel,
    addCert
  );

  const screen = show(
    'tall',
    cameraForPlan(1),
    {
      back: () => showWelcome({ back: true }),
      overlay: [card.node],
      content: [form, el('div', { className: 'dock' }, submit, demo)],
    },
    opts
  );
  // The button sits in the dock at the foot of the screen, outside the form; Return in the field submits as well.
  submit.addEventListener('click', () => form.requestSubmit());

  const bare = (v: string) =>
    v
      .trim()
      .replace(/^https?:\/\//i, '')
      .replace(/\/+$/, '');
  const paintHost = () => {
    const h = bare(input.value);
    host.textContent = h || 'trek.example.com';
    host.classList.toggle('ph', !h);
    if (h) host.after(caret);
    else host.before(caret);
    card.fit();
  };
  const reset = () => {
    setNotice(error, '');
    panel.hidden = true;
    panel.replaceChildren();
    addCert.hidden = false;
    found.hidden = true;
    screen.node.classList.remove('compact');
    setKicker(card, t('native.connect.yourTrek'), { glyph: I.globe });
  };
  input.addEventListener('focus', () => card.node.classList.add('typing'));
  input.addEventListener('blur', () => card.node.classList.remove('typing'));
  input.addEventListener('input', () => {
    paintHost();
    reset();
    submit.textContent = t('native.connect.submit');
  });
  paintHost();

  // What the card says when the check fails, and its mark.
  const KICKER: Partial<Record<ProbeFailure, { labelKey: string; glyph: string }>> = {
    unreachable: { labelKey: 'native.connect.kickerUnreachable', glyph: I.wifiOff },
    notTrek: { labelKey: 'native.connect.kickerNotTrek', glyph: I.alert },
    tooOld: { labelKey: 'native.connect.kickerTooOld', glyph: I.update },
    authGate: { labelKey: 'native.connect.kickerGate', glyph: I.gate },
    clientCert: { labelKey: 'native.connect.kickerCert', glyph: I.key },
  };
  const fail = (reason: ProbeFailure, gate?: AuthGate, server?: string, cert?: ClientCertDemand): void => {
    void notify(NotificationType.Error);
    input.disabled = false;
    submit.disabled = false;
    addCert.disabled = false;
    submit.textContent = t('native.connect.recheck');
    const kicker = KICKER[reason];
    if (kicker) setKicker(card, t(kicker.labelKey), { tone: 'bad', glyph: kicker.glyph });
    if (reason === 'authGate' && gate && server) {
      fillGatePanel(panel, gate, server);
    } else if (reason === 'clientCert' && cert) {
      fillCertPanel(panel, cert, () => form.requestSubmit());
    } else {
      if (reason === 'invalid') shake(addressField);
      setNotice(error, failureMessage(reason));
    }
    // A panel with its own next step stays in view, with the room it needs; the keyboard would cover it.
    const withPanel = !panel.hidden;
    addCert.hidden = withPanel;
    screen.node.classList.toggle('compact', withPanel);
    if (!withPanel) input.focus();
  };

  addCert.addEventListener('click', async () => {
    if (submit.disabled) return; // a check is running
    const target = certificateTargetFor(input.value);
    if (!target) {
      setNotice(error, failureMessage('invalid'));
      shake(addressField);
      input.focus();
      return;
    }
    void tap();
    setNotice(error, '');
    addCert.disabled = true;
    const outcome = await importCertificate(target.host, target.port);
    addCert.disabled = false;
    if (outcome === 'imported') {
      void notify(NotificationType.Success);
      form.requestSubmit();
    } else if (outcome !== 'cancelled') {
      void notify(NotificationType.Error);
      setNotice(error, certFailureMessage(outcome));
    }
  });

  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    if (submit.disabled) return;
    void tap(ImpactStyle.Medium);
    reset();
    input.disabled = true;
    submit.disabled = true;
    addCert.disabled = true;
    input.blur();
    submit.replaceChildren(el('span', { className: 'spin' }), t('native.connect.checking'));
    setKicker(card, t('native.connect.checking'), { busy: true });
    const result = await probeServer(input.value, get);
    if (result.ok) {
      setKicker(card, t('native.connect.connected'), { tone: 'ok', glyph: I.lock });
      found.hidden = false;
      submit.textContent = t('native.connect.connected');
      await connected(result.url);
      return;
    }
    fail(result.reason, result.gate, result.url, result.cert);
  });

  demo.addEventListener('click', () => runDemo(demo, error));

  if (opts.recheck && prefill) form.requestSubmit();
  else if (!prefill) requestAnimationFrame(() => input.focus());
}

/** A small panel with a mark, a title, what to do, and the help page. */
function panelHead(glyph: string, title: string): HTMLElement {
  return el('div', { className: 'panel-head' }, el('i', {}, icon(glyph, 18)), el('b', {}, title));
}
function helpLink(text: string, href: string): HTMLAnchorElement {
  const link = externalLink(text, href, 'panel-help');
  link.append(icon(I.out, 13, 'flip'));
  return link;
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
  const children: Node[] = [panelHead(I.gate, title)];
  if (canSignInInApp(gate)) {
    const signIn = el(
      'button',
      { type: 'button', className: 'panel-btn' },
      name ? t('native.gate.signIn', { name }) : t('native.gate.signInGeneric')
    );
    signIn.addEventListener('click', () => {
      void tap(ImpactStyle.Medium);
      void connected(server, gate.loginHost ? [gate.loginHost] : []);
    });
    children.push(
      el('p', {}, t('native.gate.hint')),
      signIn,
      el('p', { className: 'panel-note' }, t('native.gate.googleNote'))
    );
  } else {
    children.push(el('p', {}, t('native.gate.basicHint')));
  }
  children.push(helpLink(t('native.gate.help'), AUTH_PROXY_DOCS_URL));
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
  const status = el('p', { className: 'panel-status', role: 'status' });
  const choose = el(
    'button',
    { type: 'button', className: 'panel-btn' },
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
  const hint = cert.sent ? t('native.cert.hintRefused') : t('native.cert.hint', { host: cert.host });
  panel.replaceChildren(
    panelHead(I.key, cert.sent ? t('native.cert.titleRefused') : t('native.cert.title')),
    el('p', {}, hint),
    choose,
    status,
    helpLink(t('native.cert.help'), CLIENT_CERT_DOCS_URL)
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
function count(n: number): string {
  return new Intl.NumberFormat(locale).format(n);
}

// A sample catalogue for the dev preview only: the cloud site is behind a gate
// during development, so its /api/plans is unreachable from a local build. Never
// used in a real build (see the import.meta.env.DEV guard below).
const SAMPLE_PLANS: CloudPlan[] = [
  { id: 'start', name: 'Start', monthlyCents: 490, yearlyCents: 4900, aiDocuments: 0, storageGb: 10 },
  { id: 'basis', name: 'Basis', monthlyCents: 790, yearlyCents: 7900, aiDocuments: 25, storageGb: 10 },
  { id: 'plus', name: 'Plus', monthlyCents: 1290, yearlyCents: 12900, aiDocuments: 100, storageGb: 25 },
  { id: 'pro', name: 'Pro', monthlyCents: 1990, yearlyCents: 19900, aiDocuments: 150, storageGb: 50 },
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

/** The plan the picker starts on and marks: the smallest one with AI documents, the one most trips want. */
function recommendedPlan(plans: CloudPlan[]): CloudPlan | undefined {
  return plans.find((p) => p.aiDocuments > 0) ?? plans[0];
}

/** The kind of trip each plan is for: a weekend away, a round trip, a long journey, the whole world. */
const TRIPS: Record<string, { titleKey: string; textKey: string }> = {
  start: { titleKey: 'native.trip.start.title', textKey: 'native.trip.start.text' },
  basis: { titleKey: 'native.trip.basis.title', textKey: 'native.trip.basis.text' },
  plus: { titleKey: 'native.trip.plus.title', textKey: 'native.trip.plus.text' },
  pro: { titleKey: 'native.trip.pro.title', textKey: 'native.trip.pro.text' },
};
/** A plan's trip, its title and one line; a plan the app does not know keeps its own name. */
function tripOf(plan: CloudPlan): { title: string; text: string } {
  const trip = TRIPS[plan.id];
  return trip ? { title: t(trip.titleKey), text: t(trip.textKey) } : { title: plan.name, text: '' };
}

function per(interval: 'month' | 'year'): string {
  return interval === 'year' ? t('native.plans.perYear') : t('native.plans.perMonth');
}

/** The restore button of the plans on screen, which redeems a payment that cleared later. */
let resumeRestore: (() => void) | null = null;
let watchingTransactions = false;
/** Where the camera stood on the plan chosen last, for the screens that follow it. */
let chosenCamera: Camera = cameraForPlan(1);
/** The plan chosen last, so coming back to the plans finds it still chosen. */
let chosenPlanId: string | null = null;
let chosenInterval: 'month' | 'year' = 'month';

/**
 * Restoring a purchase this store account already made (a reinstall, a new
 * phone). Found and redeemed: the instance it belongs to opens. Paid but never
 * set up: the claim screen takes the purchase as it is, so nothing is bought twice.
 */
function restoreButton(offer: Offer, plans: CloudPlan[]): HTMLButtonElement {
  const restore = el('button', { type: 'button', className: 'link' }, t('native.plans.restore'));
  const say = (text: string) => {
    restore.classList.add('msg');
    restore.textContent = text;
  };
  restore.addEventListener('click', async () => {
    void tap();
    restore.disabled = true;
    say(t('native.plans.restoring'));
    const purchase = await iap.restore();
    if (!purchase) {
      restore.disabled = false;
      say(t(onPlay ? 'native.plans.restoreNoneAndroid' : 'native.plans.restoreNone'));
      return;
    }
    // A restore finds the instance the purchase was first redeemed for; address and email are not asked again.
    const redeemed = await redeemPurchase('', '', purchase);
    if (redeemed.ok && redeemed.instanceUrl) {
      await iap.finish(purchase);
      showProvisioning(redeemed.instanceUrl);
      return;
    }
    // Paid but never set up (Ask to Buy approved later, the app closed mid-purchase).
    const unclaimed = redeemed.code === 'email-invalid' || (redeemed.code ?? '').startsWith('slug-');
    const match = /^cloud\.([a-z0-9-]+)\.(monthly|yearly)$/.exec(purchase.productId);
    const plan = match ? plans.find((p) => p.id === match[1]) : undefined;
    if (unclaimed && match && plan) {
      const interval = match[2] === 'yearly' ? 'year' : 'month';
      const { label } = offerFor(offer, plan, interval);
      showClaim(plan, interval, label, { bought: purchase });
      return;
    }
    void notify(NotificationType.Error);
    restore.disabled = false;
    // Bought before the opening: refused, unacknowledged, and refunded by Google Play.
    say(
      refundedBeforeOpening(redeemed.code, onPlay) ? t('native.claim.closedRefund') : t('native.plans.restoreFailed')
    );
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
  return restore;
}

function showPlans(opts: { back?: boolean } = {}): void {
  let interval: 'month' | 'year' = chosenInterval;
  let plans: CloudPlan[] = [];
  let offer: Offer = { canBuy: false, storePrices: null, opensSoon: false };
  let selectedId: string | null = null;

  const tiers = el('div', { className: 'tiers', role: 'radiogroup', hidden: true });
  tiers.setAttribute('aria-label', t('native.plans.title'));
  const title = el('h1', {});
  const text = el('p', {});
  const trip = el('div', { className: 'trip' }, title, text);

  const monthBtn = el('button', { type: 'button', role: 'radio' }, t('native.plans.monthly'));
  const yearBtn = el('button', { type: 'button', role: 'radio' }, t('native.plans.yearly'));
  const cycle = el(
    'div',
    { className: 'cycle', role: 'radiogroup' },
    el('span', { className: 'thumb' }),
    monthBtn,
    yearBtn
  );
  cycle.setAttribute('aria-label', t('native.plans.billing'));
  // The price is figures and a currency sign: one left-to-right run, so Arabic keeps "4,90 €" whole.
  const priceValue = el('b', { dir: 'ltr' });
  const pricePer = el('span', {});
  const price = el('div', { className: 'price' }, priceValue, pricePer);
  const equals = el('div', { className: 'equals' });
  const pricebox = el('div', { className: 'pricebox' }, cycle, price, equals);
  const specs = el('div', { className: 'specs' });
  const foot = el('div', { className: 'pad', hidden: true });

  const loading = el('div', { className: 'loading' }, el('span', { className: 'spin' }));
  const details = el('div', { className: 'stack', hidden: true }, trip, pricebox, specs);
  const choose = el('button', { type: 'button', className: 'cta', hidden: true });
  const dock = el('div', { className: 'dock' }, choose);

  const screen = show(
    'plain',
    chosenCamera,
    {
      back: () => showWelcome({ back: true }),
      content: [el('div', { className: 'pad lift' }, tiers, loading, details), foot, dock],
    },
    opts
  );

  const selected = (): CloudPlan | undefined => plans.find((p) => p.id === selectedId);
  let shown: number | null = null;
  let tween = 0;
  /** The price counts to its new amount, as a figure does on a display, in the store's own format. */
  const paintPrice = (label: string, animate: boolean) => {
    const amount = amountIn(label);
    cancelAnimationFrame(tween);
    if (!amount || shown === null || !animate) {
      priceValue.textContent = label;
      shown = amount ? amount.value : null;
      return;
    }
    const from = shown;
    const start = performance.now();
    const step = (now: number) => {
      const k = Math.min(1, (now - start) / 420);
      const e = 1 - Math.pow(1 - k, 3);
      priceValue.textContent = amount.render(from + (amount.value - from) * e);
      if (k < 1) tween = requestAnimationFrame(step);
    };
    shown = amount.value;
    tween = requestAnimationFrame(step);
  };

  const paint = (animate: boolean) => {
    const plan = selected();
    if (!plan) return;
    const index = plans.indexOf(plan);
    tiers
      .querySelectorAll<HTMLButtonElement>('button')
      .forEach((b) => b.setAttribute('aria-checked', String(b.dataset.plan === plan.id)));
    monthBtn.setAttribute('aria-checked', String(interval === 'month'));
    yearBtn.setAttribute('aria-checked', String(interval === 'year'));
    cycle.dataset.year = String(interval === 'year');

    const { title: tripTitle, text: tripText } = tripOf(plan);
    const recommended = recommendedPlan(plans)?.id === plan.id;
    title.replaceChildren(
      tripTitle,
      ...(recommended ? [el('span', { className: 'badge' }, t('native.plans.recommended'))] : [])
    );
    text.textContent = tripText;
    text.hidden = !tripText;

    const { label, buyable } = offerFor(offer, plan, interval);
    // No price yet (orders not open): the plan shows without one rather than with an empty one.
    price.hidden = !label;
    pricePer.textContent = per(interval);
    if (label) paintPrice(label, animate);
    const year = offerFor(offer, plan, 'year').label;
    // Without a price in either period (orders not open yet) the switch would choose between nothing.
    pricebox.hidden = !label && !year;
    const yearAmount = amountIn(year);
    equals.textContent =
      !label || !year
        ? ''
        : interval === 'month'
          ? t('native.plans.yearlyIs', { price: year })
          : yearAmount
            ? t('native.plans.monthlyIs', { price: yearAmount.render(yearAmount.value / 12) })
            : '';

    const gb = plan.storageGb >= 1000 ? `${count(plan.storageGb / 1000)} TB` : `${count(plan.storageGb)} GB`;
    const tile = (glyph: string, big: string, small: string, off = false) =>
      el(
        'span',
        { className: off ? 'spec off' : 'spec' },
        el('i', {}, icon(glyph, 17)),
        el('span', {}, el('b', {}, big), el('small', {}, small))
      );
    specs.replaceChildren(
      // About 3 MB a photo, as a phone takes them: a size people can picture.
      tile(I.image, gb, t('native.plans.photos', { n: count(plan.storageGb * 300) })),
      plan.aiDocuments > 0
        ? tile(I.spark, t('native.plans.aiPerMonth', { n: count(plan.aiDocuments) }), t('native.plans.aiLabel'))
        : tile(I.spark, t('native.plans.aiNone'), t('native.plans.aiLabel'), true),
      el(
        'span',
        { className: 'spec wide' },
        el('i', {}, icon(I.people, 17)),
        el('span', {}, el('b', {}, t('native.plans.unlimited')), el('small', {}, t('native.plans.unlimitedSub'))),
        el('em', {}, t('native.plans.inEveryPlan'))
      )
    );

    choose.hidden = !buyable;
    choose.textContent = t('native.plans.choose', { trip: tripTitle });
    chosenCamera = cameraForPlan(index);
    chosenPlanId = plan.id;
    chosenInterval = interval;
    if (animate) screen.scenery?.flyTo(chosenCamera);
  };

  monthBtn.addEventListener('click', () => {
    if (interval === 'month') return;
    void tap();
    interval = 'month';
    paint(true);
  });
  yearBtn.addEventListener('click', () => {
    if (interval === 'year') return;
    void tap();
    interval = 'year';
    paint(true);
  });

  choose.addEventListener('click', async () => {
    const plan = selected();
    if (!plan) return;
    void tap(ImpactStyle.Medium);
    // A store account with a running subscription buys nothing more: say so before the form.
    choose.disabled = true;
    const held = await iap.held();
    choose.disabled = false;
    if (held) {
      showSubscribed();
      return;
    }
    showClaim(plan, interval, offerFor(offer, plan, interval).label);
  });

  const load = async () => {
    loading.replaceChildren(el('span', { className: 'spin' }));
    loading.hidden = false;
    const list = await fetchPlans();
    if (!list) {
      const retry = el('button', { type: 'button', className: 'cta2' }, t('native.plans.retry'));
      retry.addEventListener('click', () => {
        void tap();
        void load();
      });
      loading.replaceChildren(el('div', { className: 'stack' }, notice(t('native.plans.loadError')), retry));
      return;
    }
    offer = await loadOffer(list);
    plans = list.plans;
    selectedId = plans.find((p) => p.id === chosenPlanId)?.id ?? recommendedPlan(plans)?.id ?? null;
    tiers.replaceChildren(
      ...plans.map((p) => {
        const b = el('button', { type: 'button', role: 'radio', dataset: { plan: p.id } }, p.name);
        b.addEventListener('click', () => {
          if (selectedId === p.id) return;
          void tap();
          selectedId = p.id;
          paint(true);
        });
        return b;
      })
    );
    loading.hidden = true;
    tiers.hidden = false;
    details.hidden = false;
    // The store's terms below the plans; a shop that cannot sell yet says only that.
    if (offer.opensSoon || !offer.canBuy) {
      foot.replaceChildren(
        el('p', { className: 'legal' }, t(offer.opensSoon ? 'native.plans.closed' : 'native.plans.soon'))
      );
    } else {
      foot.replaceChildren(
        el('p', { className: 'legal' }, t(onPlay ? 'native.plans.legalAndroid' : 'native.plans.legal')),
        el(
          'div',
          { className: 'legal-links' },
          externalLink(t('native.plans.ourTerms'), CLOUD_TERMS_URL),
          ...(onPlay ? [] : [externalLink(t('native.plans.termsShort'), STORE_TERMS_URL)]),
          externalLink(t('native.plans.privacyShort'), PRIVACY_URL)
        )
      );
      dock.append(restoreButton(offer, plans));
    }
    foot.hidden = false;
    paint(true);
  };
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

/**
 * The separate agreement on how a cloud instance differs from a self-run TREK
 * (terms § 2 (1a), § 327h BGB), as the control plane words and versions it. The
 * app shows the server's text, never its own, and sends back the version it showed.
 */
interface DeviationsConsent {
  version: string;
  text: string;
}
async function fetchConsent(): Promise<DeviationsConsent | null> {
  try {
    const res = await CapacitorHttp.get({
      url: `${CLOUD_URL}/api/iap/consent`,
      connectTimeout: PROBE_TIMEOUT_MS,
      readTimeout: PROBE_TIMEOUT_MS,
    });
    const data = typeof res.data === 'string' ? JSON.parse(res.data) : res.data;
    const body = (data ?? {}) as { version?: unknown; deviations?: unknown };
    if (res.status !== 200 || typeof body.version !== 'string' || typeof body.deviations !== 'string') return null;
    if (!body.version || !body.deviations) return null;
    return { version: body.version, text: body.deviations };
  } catch {
    return null;
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
async function redeemPurchase(
  slug: string,
  email: string,
  purchase: Purchase,
  password = '',
  consentVersion: string | null = null
): Promise<RedeemResult> {
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
        // Only a new contract carries the agreement; a restore finds one that already holds it.
        ...(consentVersion ? { consent: { acceptedDeviations: true, version: consentVersion } } : {}),
        locale,
      },
    });
    const data = typeof res.data === 'string' ? JSON.parse(res.data) : res.data;
    const body = (data ?? {}) as { instanceUrl?: string; code?: string; welcome?: string };
    if ((res.status === 200 || res.status === 201) && typeof body.instanceUrl === 'string') {
      const welcome =
        typeof body.welcome === 'string' && /^[A-Za-z0-9_-]{43}$/.test(body.welcome) ? body.welcome : undefined;
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
  priceLabel: string,
  opts: { back?: boolean; bought?: Purchase } = {}
): void {
  /** A purchase that went through but whose redeem did not: a retry redeems it again instead of buying twice. */
  let bought: Purchase | null = opts.bought ?? null;

  // The address on the glass card, written as it is typed.
  const slugShown = el('b', { className: 'ph' }, t('native.claim.slugPlaceholder'));
  const caret = el('span', { className: 'caret', ariaHidden: 'true' });
  const card = glassCard(t('native.claim.addressLabel'), I.lock, [caret, slugShown, el('span', {}, cloudSuffix())]);

  const slugInput = el('input', {
    type: 'text',
    autocapitalize: 'off',
    spellcheck: false,
    value: '',
    placeholder: t('native.claim.slugPlaceholder'),
  });
  slugInput.setAttribute('inputmode', 'url');
  slugInput.setAttribute('autocomplete', 'off');
  slugInput.setAttribute('maxlength', '40');
  slugInput.setAttribute('enterkeyhint', 'next');
  slugInput.dir = 'ltr';
  const free = el('span', { className: 'edge on', hidden: true }, icon(I.check, 12), t('native.claim.freeBadge'));
  const slugNote = el('p', { className: 'note', role: 'status' });
  // "name.liketrek.com" is one address, left to right in every language.
  const slugField = field(t('native.claim.addressField'), slugInput, {
    after: [el('em', { dir: 'ltr' }, cloudSuffix())],
    edge: free,
    below: [slugNote],
  });

  const emailInput = el('input', {
    type: 'email',
    value: '',
    autocapitalize: 'off',
    spellcheck: false,
    placeholder: t('native.claim.emailPlaceholder'),
  });
  emailInput.setAttribute('inputmode', 'email');
  emailInput.setAttribute('autocomplete', 'email');
  emailInput.setAttribute('enterkeyhint', 'next');
  emailInput.dir = 'ltr';
  const emailField = field(t('native.claim.emailLabel'), emailInput);

  // The password for the new TREK, chosen here so the buyer lands signed in (no password by mail).
  const passwordInput = el('input', {
    type: 'password',
    value: '',
    autocapitalize: 'off',
    spellcheck: false,
    placeholder: t('native.claim.passwordPlaceholder'),
  });
  passwordInput.setAttribute('autocomplete', 'new-password');
  passwordInput.setAttribute('enterkeyhint', 'go');
  passwordInput.setAttribute('maxlength', '128');
  passwordInput.dir = 'ltr';
  const eye = el('button', { type: 'button', className: 'eye' }, icon(I.eye, 18));
  eye.setAttribute('aria-label', t('native.claim.showPassword'));
  eye.addEventListener('click', (e) => {
    e.preventDefault();
    passwordInput.type = passwordInput.type === 'password' ? 'text' : 'password';
  });
  // The length on the card's edge, the other rules beneath, each ticked off as it is met.
  // The number outside the words: it is always the same, and the word reads after it in every language.
  const lengthRule = el('span', { className: 'edge' }, `${PASSWORD_MIN_LENGTH}+ ${t('native.claim.ruleLength')}`);
  const RULES = [
    { rule: 'upper', labelKey: 'native.claim.ruleUpper' },
    { rule: 'lower', labelKey: 'native.claim.ruleLower' },
    { rule: 'digit', labelKey: 'native.claim.ruleDigit' },
    { rule: 'special', labelKey: 'native.claim.ruleSpecial' },
  ] as const;
  const ruleItems = RULES.map(({ rule, labelKey }) => ({ rule, node: el('span', {}, t(labelKey)) }));
  const passwordField = field(t('native.claim.passwordLabel'), passwordInput, {
    after: [eye],
    edge: lengthRule,
    below: [el('div', { className: 'rules' }, ...ruleItems.map((r) => r.node))],
  });
  const paintRules = () => {
    const states = passwordRuleStates(passwordInput.value);
    lengthRule.classList.toggle('on', states.length);
    for (const { rule, node } of ruleItems) node.classList.toggle('met', states[rule]);
  };

  // The § 327h agreement, asked on its own before anything is bought.
  let consent: DeviationsConsent | null = null;
  const consentBox = el('input', { type: 'checkbox' });
  const consentText = el('span', { className: 'consent-text' }, t('native.claim.consentLoading'));
  const consentField = el(
    'label',
    { className: 'consent' },
    consentBox,
    el('span', {}, el('strong', {}, t('native.claim.consentTitle')), consentText)
  );
  const loadConsent = async (): Promise<DeviationsConsent | null> => {
    consentBox.checked = false;
    consentBox.disabled = true;
    consentText.textContent = t('native.claim.consentLoading');
    consent = await fetchConsent();
    consentBox.disabled = consent === null;
    consentText.textContent = consent ? consent.text : t('native.claim.consentUnavailable');
    return consent;
  };
  void loadConsent();

  const subscribeLabel = () => t('native.claim.subscribe', { price: priceLabel });
  const submit = el('button', { type: 'button', className: 'cta' }, subscribeLabel());
  // What is about to be bought, so nobody pays for a plan they did not mean.
  const change = el('button', { type: 'button' }, t('native.claim.change'));
  change.addEventListener('click', () => {
    void tap();
    showPlans({ back: true });
  });
  const planRow = el(
    'div',
    { className: 'plan-row' },
    el('span', {}, el('b', {}, plan.name), el('small', { dir: 'ltr' }, `${priceLabel} ${per(interval)}`)),
    // A purchase already made is not a choice any more.
    ...(bought ? [] : [change])
  );
  const error = notice('');
  const form = el(
    'form',
    { className: 'pad form', noValidate: true },
    el('h1', { className: 'title' }, t('native.claim.almost')),
    planRow,
    slugField,
    emailField,
    passwordField,
    // Our terms govern the instance (terms § 5a): named before the purchase, not only in the confirmation mail.
    el(
      'p',
      { className: 'agree' },
      t('native.claim.agree'),
      ' ',
      externalLink(t('native.plans.ourTerms'), CLOUD_TERMS_URL)
    ),
    consentField,
    error
  );

  show(
    'tall',
    chosenCamera,
    {
      back: () => showPlans({ back: true }),
      overlay: [card.node],
      content: [
        form,
        el('div', { className: 'dock' }, submit, el('p', { className: 'fine' }, t('native.claim.renews'))),
      ],
    },
    opts
  );

  // "Next" moves on to the next field instead of sending the form half filled; "Go" on the password sends it.
  const nextOnEnter = (from: HTMLInputElement, to: HTMLInputElement) =>
    from.addEventListener('keydown', (e) => {
      if (e.key !== 'Enter' || e.isComposing) return;
      e.preventDefault();
      to.focus();
    });
  nextOnEnter(slugInput, emailInput);
  nextOnEnter(emailInput, passwordInput);
  passwordInput.addEventListener('keydown', (e) => {
    if (e.key !== 'Enter' || e.isComposing) return;
    e.preventDefault();
    submit.click();
  });

  slugInput.addEventListener('focus', () => card.node.classList.add('typing'));
  slugInput.addEventListener('blur', () => card.node.classList.remove('typing'));

  let status: SlugStatus | null = null;
  let timer: ReturnType<typeof setTimeout> | undefined;
  const noteFor: Partial<Record<SlugStatus, string>> = {
    taken: t('native.claim.taken'),
    invalid: t('native.claim.invalid'),
    reserved: t('native.claim.reserved'),
  };
  slugInput.addEventListener('input', () => {
    clearTimeout(timer);
    status = null;
    free.hidden = true;
    slugNote.textContent = '';
    const value = slugInput.value.trim().toLowerCase();
    slugShown.textContent = value || t('native.claim.slugPlaceholder');
    slugShown.classList.toggle('ph', !value);
    if (value) slugShown.after(caret);
    else slugShown.before(caret);
    card.fit();
    if (value.length < 3) return;
    timer = setTimeout(async () => {
      const result = await slugStatus(value);
      if (slugInput.value.trim().toLowerCase() !== value) return;
      status = result;
      free.hidden = result !== 'available';
      slugNote.textContent = noteFor[result] ?? '';
    }, 350);
  });
  passwordInput.addEventListener('input', () => {
    paintRules();
    setNotice(error, '');
  });
  card.fit();

  submit.addEventListener('click', async () => {
    setNotice(error, '');
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
      setNotice(error, t('native.claim.passwordHint'));
      passwordInput.focus();
      return;
    }
    // Nothing is bought without the agreement on the text the server holds today.
    if (!consent && !(await loadConsent())) {
      shake(consentField);
      setNotice(error, t('native.claim.consentUnavailable'));
      return;
    }
    if (!consentBox.checked) {
      shake(consentField);
      setNotice(error, t('native.claim.consentRequired'));
      consentBox.focus();
      return;
    }
    const consentVersion = consent ? consent.version : null;

    void tap(ImpactStyle.Medium);
    // The purchase sheet and the progress want the whole screen, not the keyboard.
    passwordInput.blur();
    const lock = (on: boolean) => {
      slugInput.disabled = on;
      emailInput.disabled = on;
      passwordInput.disabled = on;
      consentBox.disabled = on || consent === null;
      submit.disabled = on;
    };
    lock(true);
    submit.replaceChildren(el('span', { className: 'spin' }), t('native.connect.checking'));
    const restore = () => {
      lock(false);
      submit.replaceChildren(subscribeLabel());
    };

    if (!bought) {
      const outcome = await iap.purchase(productIdFor(plan.id, interval));
      if (outcome.kind === 'cancelled') {
        restore();
        setNotice(error, t('native.claim.cancelled'));
        return;
      }
      if (outcome.kind === 'pending') {
        restore();
        setNotice(error, t('native.claim.pending'));
        return;
      }
      if (outcome.kind === 'failed') {
        void notify(NotificationType.Error);
        restore();
        setNotice(error, t('native.claim.failed'));
        return;
      }
      if (outcome.kind === 'subscribed') {
        showSubscribed();
        return;
      }
      bought = outcome.purchase;
    }

    const redeemed = await redeemPurchase(slug, email, bought, password, consentVersion);
    if (redeemed.ok && redeemed.instanceUrl) {
      await iap.finish(bought);
      showProvisioning(redeemed.instanceUrl, redeemed.welcome);
      return;
    }
    void notify(NotificationType.Error);
    restore();
    if (redeemed.code === 'slug-taken') {
      shake(slugField);
      free.hidden = true;
      slugNote.textContent = t('native.claim.taken');
    } else if (redeemed.code === 'consent-outdated' || redeemed.code === 'consent-deviations') {
      // The text changed since it was shown: the purchase waits, unredeemed, for the agreement on today's.
      await loadConsent();
      shake(consentField);
      setNotice(error, t('native.claim.consentChanged'));
    } else if (redeemed.code === 'password-weak') {
      // A common password the list on the server knows: the purchase waits, unredeemed, for a better one.
      shake(passwordField);
      setNotice(error, t('native.claim.passwordHint'));
    } else {
      setNotice(
        error,
        refundedBeforeOpening(redeemed.code, onPlay) ? t('native.claim.closedRefund') : t('native.claim.redeemFailed')
      );
    }
  });
}

// ── States of their own ─────────────────────────────────────────────────────
/** A screen that says where things stand: the landscape, the card, a title, what to do. */
function stateScreen(o: {
  camera: Camera;
  kicker: string;
  glyph: string;
  host: string;
  tone?: 'ok' | 'bad';
  busy?: boolean;
  title: string;
  text: string;
  extra?: Node[];
  dock: Node[];
  back?: () => void;
}): { screen: Screen; card: GlassCard; title: HTMLElement; text: HTMLElement; dock: HTMLElement } {
  const card = glassCard(o.kicker, o.glyph, [el('b', {}, o.host)]);
  setKicker(card, o.kicker, { tone: o.tone, busy: o.busy });
  const title = el('h1', { className: 'title' }, o.title);
  const text = el('p', { className: 'sub' }, o.text);
  const dock = el('div', { className: 'dock' }, ...o.dock);
  const screen = show('tall', o.camera, {
    back: o.back,
    overlay: [card.node],
    content: [el('div', { className: 'pad form' }, title, text, ...(o.extra ?? [])), dock],
  });
  card.fit();
  return { screen, card, title, text, dock };
}

/**
 * The store account already holds a TREK Cloud subscription: one per Apple ID or
 * Google account. Another plan would change it on the App Store and run beside
 * it on Google Play, so the app buys nothing and says why. Offered instead: the
 * TREK the subscription belongs to, and the store's own page to manage or end
 * it. Once it has ended, a new one can be taken out, at a new address too.
 */
function showSubscribed(): void {
  void notify(NotificationType.Warning);
  const status = el('p', { className: 'status-line', role: 'status' });
  const open = el('button', { type: 'button', className: 'cta' }, t('native.subscribed.open'));
  open.addEventListener('click', async () => {
    void tap(ImpactStyle.Medium);
    open.disabled = true;
    status.className = 'status-line';
    status.textContent = t('native.plans.restoring');
    const purchase = await iap.restore();
    const redeemed = purchase ? await redeemPurchase('', '', purchase) : null;
    if (purchase && redeemed?.ok && redeemed.instanceUrl) {
      await iap.finish(purchase);
      showProvisioning(redeemed.instanceUrl);
      return;
    }
    void notify(NotificationType.Error);
    open.disabled = false;
    status.className = 'status-line bad';
    status.textContent = t('native.plans.restoreFailed');
  });
  const manage = externalLink(
    t('native.subscribed.manage'),
    onPlay ? PLAY_SUBSCRIPTIONS_URL : APP_STORE_SUBSCRIPTIONS_URL,
    'cta2'
  );
  stateScreen({
    camera: cameraForPlan(0),
    kicker: t('native.subscribed.kicker'),
    glyph: I.cloud,
    host: 'TREK Cloud',
    tone: 'ok',
    title: t('native.subscribed.title'),
    text: t(onPlay ? 'native.subscribed.textAndroid' : 'native.subscribed.text'),
    extra: [status],
    dock: [open, manage],
    back: () => showPlans({ back: true }),
  });
}

function hostOf(url: string): string {
  try {
    return new URL(url).host;
  } catch {
    return url;
  }
}

/**
 * The build runs on the server; the app waits on the new address, ticks off
 * the steps, and opens it once it answers: "Arrived", then on to the trip.
 */
function showProvisioning(instanceUrl: string, welcome?: string): void {
  const host = hostOf(instanceUrl);
  const stepServer = el('span', {}, t('native.provisioning.stepServer'));
  const stepReady = el('span', {}, t('native.provisioning.stepReady'));
  const steps = el(
    'div',
    { className: 'steps' },
    el('span', { className: 'on' }, t('native.provisioning.stepAddress')),
    stepServer,
    stepReady
  );
  // The address set in bold inside the sentence, wherever the language puts it.
  const sentence = t('native.provisioning.sub', { host: '\u0000' });
  const sub = el('span', {});
  sub.append(...sentence.split('\u0000').flatMap((part, i) => (i ? [el('b', { dir: 'ltr' }, host), part] : [part])));
  const view = stateScreen({
    camera: chosenCamera,
    kicker: t('native.provisioning.kicker'),
    glyph: I.lock,
    host,
    busy: true,
    title: t('native.provisioning.title'),
    text: '',
    extra: [steps],
    dock: [],
  });
  view.text.replaceChildren(sub);
  setTimeout(() => stepServer.classList.add('on'), 1300);

  const ready = async (url: string) => {
    stepServer.classList.add('on');
    stepReady.classList.add('on');
    void notify(NotificationType.Success);
    setKicker(view.card, t('native.provisioning.stepReady'), { tone: 'ok' });
    view.title.textContent = t('native.provisioning.readyTitle');
    view.text.textContent = t('native.provisioning.readySub');
    const go = el('button', { type: 'button', className: 'cta' }, t('native.provisioning.open'));
    go.addEventListener('click', () => {
      void tap(ImpactStyle.Medium);
      go.disabled = true;
      void connected(url, [], welcome);
    });
    view.dock.replaceChildren(go);
  };

  const deadline = Date.now() + 180_000;
  const poll = async (): Promise<void> => {
    if (!view.screen.node.isConnected) return;
    const result = await probeServer(instanceUrl, get);
    if (result.ok) {
      await ready(result.url);
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
  const retry = el('button', { type: 'button', className: 'cta' }, t('native.provisioning.retry'));
  retry.addEventListener('click', () => {
    void tap();
    showProvisioning(instanceUrl, welcome);
  });
  stateScreen({
    camera: cameraForPlan(3),
    kicker: t('native.provisioning.failedTitle'),
    glyph: I.clock,
    host: hostOf(instanceUrl),
    title: t('native.provisioning.failedTitle'),
    text: t('native.provisioning.failedSub'),
    dock: [retry],
  });
}

async function runDemo(button: HTMLButtonElement, error?: HTMLElement): Promise<void> {
  void tap();
  if (error) setNotice(error, '');
  button.disabled = true;
  const result = await probeDemo(get);
  if (result.ok) {
    await connected(result.url);
    return;
  }
  button.disabled = false;
  if (error) {
    setNotice(error, failureMessage(result.reason));
  } else {
    void notify(NotificationType.Error);
  }
}

/**
 * The server takes over: a beat so the success registers, then the web view goes
 * there. With a welcome code (a purchase with a chosen password) the app opens
 * the instance's welcome page once, which signs the buyer in; an app build
 * without that option opens the sign-in page instead, where the chosen password works.
 */
async function connected(url: string, signInHosts: string[] = [], welcome?: string): Promise<void> {
  void notify(NotificationType.Success);
  await new Promise((r) => setTimeout(r, 700));
  await TrekShell.setServer({
    url,
    labels: {
      signInHint: t('native.signInBar.hint'),
      changeServer: t('native.changeServer'),
      errorPageHint: t('native.errorPageBar.hint'),
    },
    ...(signInHosts.length ? { signInHosts } : {}),
    ...(welcome ? { welcome } : {}),
  });
}

function showUnreachable(server: string, cert?: ClientCertDemand, failure?: string): void {
  const host = hostOf(server);
  const panel = el('div', { className: 'panel', role: 'alert', hidden: true });
  if (cert) fillCertPanel(panel, cert, () => void TrekShell.reload());
  const retry = el('button', { type: 'button', className: cert ? 'cta2' : 'cta' }, t('native.offline.retry'));
  retry.addEventListener('click', () => {
    void tap();
    retry.disabled = true;
    retry.replaceChildren(el('span', { className: 'spin' }), t('native.connect.checking'));
    void TrekShell.reload();
  });
  const change = el('button', { type: 'button', className: 'link' }, t('native.changeServer'));
  change.addEventListener('click', () => {
    void tap();
    void TrekShell.resetServer();
  });
  stateScreen({
    camera: cameraForPlan(2),
    kicker: cert ? t('native.cert.unreachableTitle') : t('native.connect.kickerUnreachable'),
    glyph: cert ? I.key : I.wifiOff,
    host,
    tone: 'bad',
    title: cert ? t('native.cert.unreachableTitle') : t('native.offline.title'),
    text: cert ? t('native.cert.unreachableHint', { server: host }) : t('native.offline.hint', { server: host }),
    extra: cert ? [panel] : [],
    dock: [
      retry,
      change,
      // The cause in the web view's own terms, small: what a report needs, not a second message.
      ...(failure ? [el('p', { className: 'diag', dir: 'ltr' }, failure.slice(0, 120))] : []),
    ],
  });
}

// ── Start ───────────────────────────────────────────────────────────────────
/**
 * On a phone the status bar sits on the landscape's sea, which a soft shade at
 * the top keeps dark: light clock and icons. On a wide screen it also crosses
 * the light column beside the landscape, where light icons would vanish, so the
 * first screens hide it there. The server's UI sets its own style once it loads
 * (native/nativeApp.ts). Fails quietly where there is no status bar.
 */
async function paintStatusBar(): Promise<void> {
  try {
    await StatusBar.setStyle({ style: Style.Dark });
    if (wideLayout.matches) await StatusBar.hide();
    else await StatusBar.show();
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
      const back = current?.querySelector<HTMLButtonElement>('.back');
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
 * screen the keyboard covered the terms with no way to put it away.
 */
function letKeyboardClose(): void {
  const isField = (target: EventTarget | null) =>
    target instanceof Element && !!target.closest('input, textarea, select, [contenteditable="true"], .fld');
  const close = () => {
    const active = document.activeElement;
    if (active instanceof HTMLElement && isField(active)) active.blur();
  };
  document.addEventListener(
    'pointerdown',
    (e) => {
      if (!isField(e.target)) close();
    },
    true
  );
  let startY: number | null = null;
  document.addEventListener(
    'touchstart',
    (e) => {
      startY = isField(e.target) ? null : (e.touches[0]?.clientY ?? null);
    },
    { passive: true }
  );
  document.addEventListener(
    'touchmove',
    (e) => {
      const y = e.touches[0]?.clientY;
      if (startY !== null && y !== undefined && Math.abs(y - startY) > 10) {
        startY = null;
        close();
      }
    },
    { passive: true }
  );
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
  wideLayout.addEventListener('change', () => void paintStatusBar());
  followBackGesture();
  letKeyboardClose();
  let url: string | null;
  let previousUrl: string | null | undefined;
  let failure: string | null | undefined;
  try {
    ({ url, previousUrl, failure } = await TrekShell.getServer());
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
      showUnreachable(url, undefined, failure ?? undefined);
    }
  }
  await SplashScreen.hide();
}

void start();
