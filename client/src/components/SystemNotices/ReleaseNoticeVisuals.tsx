import * as LucideIcons from 'lucide-react';
import {
  BedDouble,
  Check,
  Clock,
  Coffee,
  Globe,
  Image as ImageIcon,
  Landmark,
  Mail,
  MapPin,
  Phone,
  Plane,
  Search,
  Sparkles,
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

// ── Booking mails: a forwarded mail flies into the trip and becomes its booking ──

function MailVisual() {
  return (
    <div className="rn-vis rn-vis-mail">
      <span className="rn-vis-mail-env">
        <Mail size={13} strokeWidth={2.2} />
      </span>
      <div className="rn-vis-mail-trip">
        <span className="rn-vis-mail-head">Tokyo</span>
        <span className="rn-vis-mail-row">
          <BedDouble size={9} strokeWidth={2.4} />
          <i />
        </span>
        <span className="rn-vis-mail-row rn-vis-mail-row-new">
          <Plane size={9} strokeWidth={2.4} />
          <b>LH 716</b>
          <span className="rn-vis-mail-check">
            <Check size={8} strokeWidth={3.2} />
          </span>
        </span>
      </div>
    </div>
  );
}

// ── Live flight status: the aircraft on its way, and how late it runs ──

const FLIGHT_ARC = 'M24 86 C 70 18, 130 18, 176 86';

function FlightVisual() {
  return (
    <div className="rn-vis rn-vis-flight">
      <svg className="rn-vis-flight-map" viewBox="0 0 200 112" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
        <path className="rn-vis-flight-arc" d={FLIGHT_ARC} pathLength={1} />
        <circle className="rn-vis-flight-airport" cx="24" cy="86" r="3.4" />
        <circle className="rn-vis-flight-airport" cx="176" cy="86" r="3.4" />
        <g className="rn-vis-flight-plane">
          <path d="M-6 0 L5 0 M1 -4 L4 0 L1 4 M-5 -2 L-3 0 L-5 2" />
          <animateMotion dur="4.2s" begin="0.4s" repeatCount="indefinite" rotate="auto" path={FLIGHT_ARC} />
        </g>
      </svg>
      <span className="rn-vis-flight-code rn-vis-flight-from">FRA</span>
      <span className="rn-vis-flight-code rn-vis-flight-to">HND</span>
      <span className="rn-vis-flight-live">
        <i />
        +12 min
      </span>
    </div>
  );
}

// ── The trip PDF: a cover with the route in the day colours, the days behind it ──

const COVER_ROUTE = 'M10 40 L22 30 L30 34 L40 22 L50 26';

function PdfVisual() {
  return (
    <div className="rn-vis rn-vis-pdf">
      <span className="rn-vis-pdf-page rn-vis-pdf-back">
        {[0, 1, 2, 3].map((i) => (
          <i key={i} />
        ))}
      </span>
      <span className="rn-vis-pdf-page rn-vis-pdf-mid">
        {[0, 1, 2].map((i) => (
          <i key={i} />
        ))}
      </span>
      <span className="rn-vis-pdf-page rn-vis-pdf-cover">
        <svg viewBox="0 0 60 50" aria-hidden="true">
          <path className="rn-vis-pdf-route" d={COVER_ROUTE} pathLength={1} />
          <circle cx="10" cy="40" r="2.2" />
          <circle cx="50" cy="26" r="2.2" />
        </svg>
        <b />
        <i />
      </span>
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
  mail: MailVisual,
  flight: FlightVisual,
  pdf: PdfVisual,
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
