import { CapacitorHttp } from '@capacitor/core';
import { Haptics, ImpactStyle, NotificationType } from '@capacitor/haptics';
import { SplashScreen } from '@capacitor/splash-screen';
import { StatusBar, Style } from '@capacitor/status-bar';
import logoUrl from '../public/icons/icon-white.svg';
import { getIapClient, productIdFor, type Purchase } from '../src/native/iap';
import { CLOUD_URL, PRIVACY_URL, SERVER_DOCS_URL } from '../src/native/links';
import { probeDemo, probeServer, type ProbeFailure, type ProbeGet } from '../src/native/serverAddress';
import { TrekShell } from '../src/native/trekShell';
import { pickLocale, translator } from './i18n';
import './shell.css';

/**
 * The only page the app ships itself. It welcomes someone on first start, asks
 * for the TREK server they open in their browser, offers TREK Cloud to someone
 * without one, and stands in when a remembered server cannot be reached.
 * Everything past it is the UI that server delivers.
 */

const locale = pickLocale(navigator.languages?.length ? navigator.languages : [navigator.language]);
const t = translator(locale);
document.documentElement.lang = locale;
document.documentElement.dir = locale === 'ar' ? 'rtl' : 'ltr';

const root = document.getElementById('shell')!;
const PROBE_TIMEOUT_MS = 8000;

const iap = getIapClient();
/** Whether this build can take a payment in-app; decided once at start. Until then, and in a store build without the purchase plugin, the plan picker finishes on the web. */
let iapAvailable = false;

/** The subdomain suffix a cloud instance sits on, from the cloud address: `liketrek.com` → `.liketrek.com`. */
function cloudSuffix(): string {
  try {
    return `.${new URL(CLOUD_URL).host}`;
  } catch {
    return '.liketrek.com';
  }
}

// Native HTTP rather than fetch: the probe goes to a server of the user's
// choosing, which has no reason to answer this page's origin with CORS.
const get: ProbeGet = async (url) => {
  const response = await CapacitorHttp.get({ url, connectTimeout: PROBE_TIMEOUT_MS, readTimeout: PROBE_TIMEOUT_MS });
  return { status: response.status, data: response.data, url: response.url };
};

function failureMessage(reason: ProbeFailure): string {
  switch (reason) {
    case 'invalid':
      return t('native.connect.errorInvalid');
    case 'unreachable':
      return t('native.connect.errorUnreachable');
    case 'notTrek':
      return t('native.connect.errorNotTrek');
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
  const hero = el('img', { src: logoUrl, alt: '', className: 'hero-mark' });

  const connect = el(
    'button',
    { type: 'button', className: 'btn' },
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
    { type: 'button', className: 'btn btn-ghost' },
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

  const demo = el('button', { type: 'button', className: 'linkbtn' }, t('native.connect.tryDemo'));
  demo.addEventListener('click', () => runDemo(demo));

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
      footLinks(externalLink(t('native.connect.whatIsServer'), SERVER_DOCS_URL))
    ),
    opts
  );
}

// ── Connect (address) ───────────────────────────────────────────────────────
function showConnect(prefill = '', opts: { back?: boolean } = {}): void {
  const input = el('input', {
    type: 'url',
    placeholder: t('native.connect.placeholder'),
    value: prefill,
    autocapitalize: 'off',
    spellcheck: false,
  });
  input.setAttribute('inputmode', 'url');
  input.setAttribute('autocomplete', 'url');
  // The on-screen keyboard's return key submits the address; it reads "Go", not a newline.
  input.setAttribute('enterkeyhint', 'go');
  input.setAttribute('aria-label', t('native.connect.title'));
  const field = el('div', { className: 'field' }, input);

  const label = el('span', {}, t('native.connect.submit'));
  const submit = el('button', { type: 'submit', className: 'btn' }, label);
  const error = el('p', { className: 'error', role: 'alert' });
  const form = el('form', { className: 'form', noValidate: true }, field, submit, error);

  const fail = (reason: ProbeFailure): void => {
    void notify(NotificationType.Error);
    field.classList.add('bad');
    setTimeout(() => field.classList.remove('bad'), 350);
    error.textContent = failureMessage(reason);
    input.disabled = false;
    submit.disabled = false;
    label.textContent = t('native.connect.submit');
    submit.replaceChildren(label);
    input.focus();
  };

  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    void tap(ImpactStyle.Medium);
    error.textContent = '';
    input.disabled = true;
    submit.disabled = true;
    submit.replaceChildren(el('span', { className: 'spinner' }), t('native.connect.checking'));
    const result = await probeServer(input.value, get);
    if (result.ok) {
      await connected(result.url);
      return;
    }
    fail(result.reason);
  });

  const demo = el('button', { type: 'button', className: 'linkbtn' }, t('native.connect.tryDemo'));
  demo.addEventListener('click', () => runDemo(demo, error));

  show(
    el(
      'div',
      {},
      topbar(() => showWelcome({ back: true })),
      el('h1', { className: 'title-sm' }, t('native.connect.title')),
      el('p', { className: 'sub' }, t('native.connect.hint')),
      form,
      demo,
      footLinks(externalLink(t('native.connect.whatIsServer'), SERVER_DOCS_URL))
    ),
    opts
  );
  requestAnimationFrame(() => input.focus());
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
  const cta = el('button', { type: 'button', className: 'btn' }, t('native.cloud.cta'), icon(I.chevron, 20, 'chev'));
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
      topbar(() => showWelcome({ back: true })),
      el('h1', { className: 'title-sm' }, t('native.cloud.title')),
      el('p', { className: 'sub' }, t('native.cloud.sub')),
      el(
        'div',
        { className: 'features' },
        feature(I.globe, t('native.cloud.f1')),
        feature(I.bolt, t('native.cloud.f2')),
        feature(I.shield, t('native.cloud.f3'))
      ),
      cta,
      have,
      footLinks()
    ),
    opts
  );
}

// ── Choose a plan (TREK Cloud) ──────────────────────────────────────────────
interface CloudPlan {
  id: string;
  name: string;
  monthlyCents: number;
  yearlyCents: number;
  aiDocuments: number;
  storageGb: number;
}

function money(cents: number): string {
  return new Intl.NumberFormat(locale, { style: 'currency', currency: 'EUR' }).format(cents / 100);
}

async function fetchPlans(): Promise<CloudPlan[] | null> {
  try {
    const res = await get(`${CLOUD_URL}/api/plans`);
    const data = typeof res.data === 'string' ? JSON.parse(res.data) : res.data;
    const plans = (data as { plans?: CloudPlan[] })?.plans;
    return Array.isArray(plans) && plans.length ? plans : null;
  } catch {
    return null;
  }
}

function subscribe(plan: CloudPlan, interval: 'month' | 'year'): void {
  void tap(ImpactStyle.Medium);
  // In-app purchase when this build can take one; otherwise finish on the web, so
  // nothing half-wired faces a customer until the store products exist.
  if (iapAvailable) {
    showClaim(plan, interval);
  } else {
    window.open(`${CLOUD_URL}/order?plan=${encodeURIComponent(plan.id)}`, '_blank', 'noopener');
  }
}

function planCard(plan: CloudPlan, interval: 'month' | 'year', featured: boolean): HTMLElement {
  const price = interval === 'year' ? plan.yearlyCents : plan.monthlyCents;
  const per = interval === 'year' ? t('native.plans.perYear') : t('native.plans.perMonth');
  const feat = (text: string) => el('span', {}, icon(I.check, 16), text);
  const sub = el('button', { type: 'button', className: 'btn' }, t('native.plans.subscribe'));
  sub.addEventListener('click', () => subscribe(plan, interval));
  return el(
    'div',
    { className: featured ? 'plan featured' : 'plan' },
    el(
      'div',
      { className: 'plan-top' },
      el('span', { className: 'plan-name' }, plan.name),
      el('span', { className: 'plan-price' }, money(price), el('small', {}, per))
    ),
    el(
      'div',
      { className: 'plan-feats' },
      feat(t('native.plans.unlimited')),
      feat(t('native.plans.storage', { n: String(plan.storageGb) })),
      feat(plan.aiDocuments > 0 ? t('native.plans.aiDocs', { n: String(plan.aiDocuments) }) : t('native.plans.noAi'))
    ),
    sub
  );
}

function showPlans(opts: { back?: boolean } = {}): void {
  let interval: 'month' | 'year' = 'month';
  let plans: CloudPlan[] | null = null;

  const content = el('div', { className: 'loading' }, el('span', { className: 'spinner' }));

  const monthBtn = el('button', { type: 'button' }, t('native.plans.monthly'));
  const yearBtn = el(
    'button',
    { type: 'button' },
    t('native.plans.yearly'),
    el('span', { className: 'save' }, t('native.plans.save'))
  );
  const seg = el('div', { className: 'segmented' }, monthBtn, yearBtn);

  const paintSeg = () => {
    monthBtn.setAttribute('aria-pressed', String(interval === 'month'));
    yearBtn.setAttribute('aria-pressed', String(interval === 'year'));
  };
  const renderList = () => {
    const list = plans;
    if (!list) return;
    content.className = 'plans';
    content.replaceChildren(...list.map((p, i) => planCard(p, interval, i === list.length - 1)));
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
    plans = await fetchPlans();
    if (plans) {
      renderList();
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
      topbar(() => showCloud({ back: true })),
      el('h1', { className: 'title-sm' }, t('native.plans.title')),
      el('p', { className: 'sub' }, t('native.plans.sub')),
      seg,
      content,
      el('p', { className: 'note' }, t('native.plans.soon'))
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
  /** Set when not ok: a stable refusal code. */
  code?: string;
}
async function redeemPurchase(slug: string, email: string, purchase: Purchase): Promise<RedeemResult> {
  try {
    const res = await CapacitorHttp.post({
      url: `${CLOUD_URL}/api/iap/redeem`,
      headers: { 'content-type': 'application/json' },
      connectTimeout: PROBE_TIMEOUT_MS,
      readTimeout: PROBE_TIMEOUT_MS,
      data: { platform: purchase.platform, productId: purchase.productId, receipt: purchase.receipt, slug, email },
    });
    const data = typeof res.data === 'string' ? JSON.parse(res.data) : res.data;
    const body = (data ?? {}) as { instanceUrl?: string; code?: string };
    if ((res.status === 200 || res.status === 201) && typeof body.instanceUrl === 'string') {
      return { ok: true, instanceUrl: body.instanceUrl };
    }
    return { ok: false, code: body.code ?? 'redeem-failed' };
  } catch {
    return { ok: false, code: 'redeem-failed' };
  }
}

function showClaim(plan: CloudPlan, interval: 'month' | 'year', opts: { back?: boolean } = {}): void {
  const price = interval === 'year' ? plan.yearlyCents : plan.monthlyCents;

  const slugInput = el('input', {
    type: 'text',
    className: 'slug-input',
    autocapitalize: 'off',
    spellcheck: false,
    value: '',
  });
  slugInput.setAttribute('inputmode', 'url');
  slugInput.setAttribute('autocomplete', 'off');
  slugInput.setAttribute('maxlength', '40');
  slugInput.setAttribute('aria-label', t('native.claim.addressLabel'));
  const slugField = el(
    'div',
    { className: 'field slug-field' },
    slugInput,
    el('span', { className: 'slug-suffix' }, cloudSuffix())
  );
  const slugNote = el('p', { className: 'hint' });

  const emailInput = el('input', { type: 'email', value: '', autocapitalize: 'off', spellcheck: false });
  emailInput.setAttribute('inputmode', 'email');
  emailInput.setAttribute('autocomplete', 'email');
  emailInput.setAttribute('enterkeyhint', 'go');
  emailInput.setAttribute('aria-label', t('native.claim.emailLabel'));
  const emailField = el('div', { className: 'field' }, emailInput);

  const submit = el(
    'button',
    { type: 'submit', className: 'btn' },
    t('native.claim.subscribe', { price: money(price) })
  );
  const error = el('p', { className: 'error', role: 'alert' });
  const form = el(
    'form',
    { className: 'form', noValidate: true },
    slugField,
    slugNote,
    emailField,
    el('p', { className: 'hint' }, t('native.claim.emailHint')),
    submit,
    error
  );

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

    void tap(ImpactStyle.Medium);
    const lock = (on: boolean) => {
      slugInput.disabled = on;
      emailInput.disabled = on;
      submit.disabled = on;
    };
    lock(true);
    submit.replaceChildren(el('span', { className: 'spinner' }), t('native.connect.checking'));
    const restore = () => {
      lock(false);
      submit.replaceChildren(t('native.claim.subscribe', { price: money(price) }));
    };

    const outcome = await iap.purchase(productIdFor(plan.id, interval));
    if (outcome.kind === 'cancelled') {
      restore();
      error.textContent = t('native.claim.cancelled');
      return;
    }
    if (outcome.kind === 'failed') {
      void notify(NotificationType.Error);
      restore();
      error.textContent = t('native.claim.failed');
      return;
    }

    const redeemed = await redeemPurchase(slug, email, outcome.purchase);
    if (redeemed.ok && redeemed.instanceUrl) {
      showProvisioning(redeemed.instanceUrl);
      return;
    }
    void notify(NotificationType.Error);
    restore();
    if (redeemed.code === 'slug-taken') {
      shake(slugField);
      slugNote.textContent = t('native.claim.taken');
      slugNote.className = 'hint bad';
    } else {
      error.textContent = t('native.claim.redeemFailed');
    }
  });

  show(
    el(
      'div',
      {},
      topbar(() => showPlans({ back: true })),
      el('h1', { className: 'title-sm' }, t('native.claim.title')),
      el('p', { className: 'sub' }, t('native.claim.sub')),
      form
    ),
    opts
  );
  requestAnimationFrame(() => slugInput.focus());
}

/** The build runs on the server; the app waits on the new address and loads it the moment it answers. */
function showProvisioning(instanceUrl: string): void {
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
      await connected(result.url);
      return;
    }
    if (Date.now() > deadline) {
      showProvisioningSlow(instanceUrl);
      return;
    }
    setTimeout(() => void poll(), 4000);
  };
  setTimeout(() => void poll(), 3000);
}

function showProvisioningSlow(instanceUrl: string): void {
  void notify(NotificationType.Warning);
  const retry = el('button', { type: 'button', className: 'btn' }, t('native.provisioning.retry'));
  retry.addEventListener('click', () => {
    void tap();
    showProvisioning(instanceUrl);
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

/** The tick, then the server takes over. A beat so the success registers. */
async function connected(url: string): Promise<void> {
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
  await TrekShell.setServer({ url });
}

function showUnreachable(server: string): void {
  const retry = el('button', { type: 'button', className: 'btn' }, t('native.offline.retry'));
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
      el('img', { src: logoUrl, alt: '', className: 'shell-logo' }),
      el('h1', { className: 'title-sm' }, t('native.offline.title')),
      el('p', { className: 'sub' }, t('native.offline.hint', { server: new URL(server).host })),
      retry,
      change,
      footLinks()
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

async function start(): Promise<void> {
  void paintStatusBar();
  iap.isAvailable().then((ok) => {
    iapAvailable = ok;
  });
  let url: string | null = null;
  try {
    ({ url } = await TrekShell.getServer());
  } catch {
    // No native shell under us (a web preview, or a simulator without the
    // plugin): there is no remembered server, so start at the welcome screen
    // rather than leaving a blank page.
    showWelcome();
    await SplashScreen.hide().catch(() => {});
    return;
  }
  if (!url) {
    showWelcome();
  } else {
    // Only reached when loading the server failed. On iOS the stored copy of
    // its start page brings the offline-capable UI up anyway.
    const { opened } = await TrekShell.openOfflineCopy();
    if (opened) return;
    showUnreachable(url);
  }
  await SplashScreen.hide();
}

void start();
