import * as LucideIcons from 'lucide-react';
import {
  Bike,
  Check,
  Clock,
  Coffee,
  Footprints,
  Globe,
  Image as ImageIcon,
  Landmark,
  MapPin,
  Phone,
  Plane,
  Sailboat,
  Search,
  Snowflake,
  Sparkles,
  Star,
  TrendingUp,
  Zap,
} from 'lucide-react';
import React from 'react';
import './releaseNoticeVisuals.css';

/*
 * The small pictures on the release cards: pieces of TREK itself, drawn at card
 * size rather than screenshotted, because a screenshot this small is a blur. They
 * carry no words, only place names, greetings and figures that read the same in
 * every language, so nothing here needs translating. Every colour lives in
 * releaseNoticeVisuals.css, and every motion stops under reduced motion.
 */

// ── Tours: a trail climbing to the summit at dusk, and the kinds of tour under it ──

const FAR_RIDGE = 'M0 66 L20 50 L38 60 L60 38 L84 56 L104 44 L128 58 L152 40 L176 54 L200 46 V112 H0 Z';
const MOUNTAIN = 'M0 112 V86 L44 62 L84 28 L98 38 L112 32 L152 68 L200 80 V112 Z';
const SNOW = 'M84 28 L73 38 L79 37 L84 42 L89 37.5 L95 37 Z';
const MEADOW = 'M0 112 V96 C 30 88, 60 90, 92 94 S 160 82, 200 90 V112 Z';
// From the valley up the mountain's flank to the summit, in switchbacks.
const TRAIL = 'M24 100 C 40 96, 50 90, 54 84 S 66 78, 70 72 S 64 62, 72 56 S 82 48, 78 42 S 82 34, 84 29';
const KINDS = [Footprints, Bike, Sailboat, Snowflake, Landmark];

function ToursVisual() {
  return (
    <div className="rn-vis rn-vis-tours">
      <svg className="rn-vis-tours-scene" viewBox="0 0 200 112" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
        <circle className="rn-vis-tours-sun" cx="160" cy="24" r="9" />
        <path className="rn-vis-tours-far" d={FAR_RIDGE} />
        <path className="rn-vis-tours-mountain" d={MOUNTAIN} />
        <path className="rn-vis-tours-snow" d={SNOW} />
        <path className="rn-vis-tours-meadow" d={MEADOW} />
        <path className="rn-vis-tours-trail" d={TRAIL} pathLength={1} />
        <circle className="rn-vis-tours-walker" r="2.6">
          <animateMotion dur="5s" begin="1.6s" repeatCount="indefinite" path={TRAIL} />
        </circle>
        <g className="rn-vis-tours-flag">
          <line x1="84" y1="29" x2="84" y2="17" />
          <path d="M84 17 L93 20 L84 23 Z" />
        </g>
      </svg>
      <span className="rn-vis-tours-climb">
        <TrendingUp size={9} strokeWidth={2.6} />
        860 m
      </span>
      <div className="rn-vis-tours-kinds">
        {KINDS.map((Kind, i) => (
          <span key={i} className="rn-vis-tours-kind" style={{ animationDelay: `${1.2 + i * 0.08}s` }}>
            <Kind size={10} strokeWidth={2.2} />
          </span>
        ))}
      </div>
    </div>
  );
}

// ── TREK Studio: an open photo book with a polaroid, a stamp and a sticker ──

function StudioVisual() {
  return (
    <div className="rn-vis rn-vis-studio">
      <div className="rn-vis-book">
        <div className="rn-vis-page rn-vis-page-start">
          <div className="rn-vis-polaroid">
            <svg viewBox="0 0 60 44" aria-hidden="true">
              <rect className="rn-vis-sky" width="60" height="44" />
              <circle className="rn-vis-sun" cx="42" cy="15" r="6" />
              <path className="rn-vis-peak-far" d="M0 32 L12 20 L20 26 L32 12 L44 24 L52 18 L60 26 V44 H0 Z" />
              <path className="rn-vis-peak-near" d="M0 38 L14 28 L26 34 L38 26 L60 36 V44 H0 Z" />
            </svg>
          </div>
          <span className="rn-vis-tape" />
        </div>
        <div className="rn-vis-page rn-vis-page-end">
          <span className="rn-vis-book-title">Dolomiti</span>
          <span className="rn-vis-book-line" />
          <span className="rn-vis-book-line rn-vis-book-line-short" />
          <span className="rn-vis-stamp">
            <Plane size={10} strokeWidth={2.2} />
          </span>
        </div>
        <span className="rn-vis-gutter" />
      </div>
      <span className="rn-vis-sticker">
        <Star size={15} strokeWidth={1.8} />
      </span>
    </div>
  );
}

// ── The assistant: a day in Porto proposed stop by stop, ready to apply ──

const PORTO: Array<{ time: string; name: string; tone: string }> = [
  { time: '09:30', name: 'Ribeira', tone: 'sight' },
  { time: '12:30', name: 'Livraria Lello', tone: 'culture' },
  { time: '16:00', name: 'Torre dos Clérigos', tone: 'view' },
];

function AssistantVisual() {
  return (
    <div className="rn-vis rn-vis-assist">
      <div className="rn-vis-assist-head">
        <span className="rn-vis-assist-avatar">
          <Sparkles size={10} strokeWidth={2.4} />
        </span>
        <span className="rn-vis-assist-typing">
          <i />
          <i />
          <i />
        </span>
      </div>
      <div className="rn-vis-assist-card">
        {PORTO.map((stop, i) => (
          <div key={stop.name} className="rn-vis-assist-row" style={{ animationDelay: `${0.5 + i * 0.35}s` }}>
            <span className="rn-vis-assist-time">{stop.time}</span>
            <span className={`rn-vis-assist-dot rn-vis-assist-dot-${stop.tone}`} />
            <span className="rn-vis-assist-name">{stop.name}</span>
          </div>
        ))}
      </div>
      <span className="rn-vis-assist-apply">
        <Check size={11} strokeWidth={3} />
      </span>
    </div>
  );
}

// ── Help on every screen, in 27 languages: hello in each of them, drifting by ──

const HELLO_A = [
  'Hallo',
  'Bonjour',
  'Hola',
  'Ciao',
  'Olá',
  'Hej',
  'Ahoj',
  'Cześć',
  'Szia',
  'Tere',
  'Salam',
  'Bon dia',
  'Halo',
];
const HELLO_B = [
  'Привіт',
  'Привет',
  'Γεια σου',
  'مرحبا',
  'こんにちは',
  '안녕하세요',
  '你好',
  '哈囉',
  'สวัสดี',
  'Xin chào',
  'Merhaba',
  'Dobrý deň',
];

function HelloRow({ words, reverse }: { words: string[]; reverse?: boolean }) {
  // Written twice, so the row can slide by half its width and start over without a seam.
  return (
    <div className={reverse ? 'rn-vis-hello-row rn-vis-hello-row-reverse' : 'rn-vis-hello-row'}>
      {[...words, ...words].map((word, i) => (
        <span key={i} className="rn-vis-hello" lang="und">
          {word}
        </span>
      ))}
    </div>
  );
}

function HelpVisual() {
  return (
    <div className="rn-vis rn-vis-help">
      <span className="rn-vis-help-q">?</span>
      <div className="rn-vis-help-langs">
        <HelloRow words={HELLO_A} />
        <HelloRow words={HELLO_B} reverse />
      </div>
      <span className="rn-vis-help-count">27</span>
    </div>
  );
}

// ── Place search: a query typed into the search field, the right place on top ──

const RESULTS: Array<{ name: string; Kind: React.ElementType; tone: string }> = [
  { name: 'Kölner Dom', Kind: Landmark, tone: 'sight' },
  { name: 'CGN', Kind: Plane, tone: 'air' },
  { name: 'Café Reichard', Kind: Coffee, tone: 'food' },
];

function SearchVisual() {
  return (
    <div className="rn-vis rn-vis-search">
      <div className="rn-vis-search-field">
        <Search size={10} strokeWidth={2.6} />
        <span className="rn-vis-search-query">Kölner Dom</span>
        <span className="rn-vis-search-caret" />
      </div>
      <div className="rn-vis-search-list">
        {RESULTS.map(({ name, Kind, tone }, i) => (
          <div
            key={name}
            className={i === 0 ? 'rn-vis-search-row rn-vis-search-row-top' : 'rn-vis-search-row'}
            style={{ animationDelay: `${1.3 + i * 0.16}s` }}
          >
            <span className={`rn-vis-search-pin rn-vis-search-pin-${tone}`}>
              <Kind size={8} strokeWidth={2.6} />
            </span>
            <span className="rn-vis-search-name">{name}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Place details, shared: one place's details travelling out to other TREKs ──

const DETAILS = [Globe, Clock, Phone, ImageIcon];

function ShareVisual() {
  return (
    <div className="rn-vis rn-vis-share">
      <svg className="rn-vis-share-links" viewBox="0 0 200 112" preserveAspectRatio="none" aria-hidden="true">
        <path d="M82 56 C 110 56, 120 24, 156 22" />
        <path d="M82 56 C 112 56, 126 56, 160 56" />
        <path d="M82 56 C 110 56, 120 88, 156 90" />
      </svg>
      <div className="rn-vis-share-card">
        <span className="rn-vis-share-pin">
          <MapPin size={11} strokeWidth={2.4} />
        </span>
        <div className="rn-vis-share-fields">
          {DETAILS.map((Detail, i) => (
            <span key={i} className="rn-vis-share-field" style={{ animationDelay: `${0.5 + i * 0.18}s` }}>
              <Detail size={8} strokeWidth={2.4} />
              <i />
            </span>
          ))}
        </div>
      </div>
      {['top', 'mid', 'bottom'].map((at, i) => (
        <span
          key={at}
          className={`rn-vis-share-node rn-vis-share-node-${at}`}
          style={{ animationDelay: `${1.5 + i * 0.2}s` }}
        >
          <img src="/icons/icon-white.svg" alt="" />
        </span>
      ))}
    </div>
  );
}

// ── Routing: a day's stops joined in one go ──

const DAY_ROUTE = 'M16 92 C 34 78, 42 84, 56 70 S 76 40, 96 48 S 120 78, 138 62 S 160 26, 184 22';
const DAY_STOPS: Array<[number, number]> = [
  [16, 92],
  [56, 70],
  [96, 48],
  [138, 62],
  [184, 22],
];

function RoutingVisual() {
  return (
    <div className="rn-vis rn-vis-route">
      <svg className="rn-vis-route-map" viewBox="0 0 200 112" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
        <path
          className="rn-vis-route-street"
          d="M0 30 L200 44 M0 76 L200 64 M40 0 L64 112 M118 0 L104 112 M168 0 L176 112"
        />
        <path className="rn-vis-route-water" d="M0 104 C 50 96, 90 112, 140 102 S 190 98, 200 100 V112 H0 Z" />
        <path className="rn-vis-route-line" d={DAY_ROUTE} pathLength={1} />
        {DAY_STOPS.map(([cx, cy], i) => (
          <circle
            key={i}
            className="rn-vis-route-stop"
            cx={cx}
            cy={cy}
            r="4.2"
            style={{ animationDelay: `${0.3 + i * 0.22}s` }}
          />
        ))}
      </svg>
      <span className="rn-vis-route-badge">
        <Zap size={9} strokeWidth={2.6} />
        20
      </span>
    </div>
  );
}

const VISUALS: Record<string, () => React.ReactElement> = {
  tours: ToursVisual,
  studio: StudioVisual,
  assistant: AssistantVisual,
  help: HelpVisual,
  search: SearchVisual,
  share: ShareVisual,
  routing: RoutingVisual,
};

/** The card's picture, or its icon when the release names no drawing this client knows. */
export function ReleaseFeatureVisual({ visual, iconName }: { visual?: string; iconName: string }) {
  const Drawing = visual ? VISUALS[visual] : undefined;
  if (Drawing) return <Drawing />;
  const Icon: React.ElementType = ((LucideIcons as Record<string, unknown>)[iconName] as React.ElementType) ?? Sparkles;
  return (
    <div className="rn-vis rn-vis-icon">
      <Icon size={30} strokeWidth={1.6} aria-hidden="true" />
    </div>
  );
}
