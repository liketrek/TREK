import React from 'react';
import * as LucideIcons from 'lucide-react';
import { Car, Landmark, Search, Sparkles } from 'lucide-react';
import DawarichIcon from '../shared/DawarichIcon';
import TrekMark from '../shared/TrekMark';

/*
 * The small pictures on the release cards: pieces of TREK itself, drawn at card
 * size rather than screenshotted, because a screenshot this small is a blur. They
 * carry no words, only place names and figures that read the same in every
 * language, so nothing here needs translating.
 */

function PlacesApiVisual() {
  return (
    <div className="rn-vis rn-vis-places">
      <span className="rn-vis-trekbadge"><TrekMark className="rn-vis-trekmark" /></span>
      <div className="rn-vis-search">
        <Search size={11} strokeWidth={2.4} />
        <span className="rn-vis-typed">Fushimi Inari</span>
        <span className="rn-vis-caret" />
      </div>
      <div className="rn-vis-result">
        <span className="rn-vis-cat" style={{ background: '#ef4444' }}><Landmark size={10} strokeWidth={2.2} /></span>
        <span className="rn-vis-place">
          <span>Fushimi Inari Taisha</span>
          <small>Kyoto</small>
        </span>
      </div>
    </div>
  );
}

// The route and its stops, in the planner's own route blue and marker style.
const ROUTE = 'M26 84 C 58 82, 60 44, 96 46 S 136 74, 160 52 S 176 30, 182 28';

function RoadtripVisual() {
  return (
    <div className="rn-vis rn-vis-road">
      <svg viewBox="0 0 200 112" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
        <path className="rn-vis-road-casing" d={ROUTE} />
        <path className="rn-vis-road-line" d={ROUTE} />
      </svg>
      <span className="rn-vis-marker" style={{ left: '13%', top: '75%', background: '#6366f1' }}>1</span>
      <span className="rn-vis-marker" style={{ left: '48%', top: '41%', background: '#f59e0b' }}>2</span>
      <span className="rn-vis-marker" style={{ left: '91%', top: '25%', background: '#ec4899' }}>3</span>
      <span className="rn-vis-distance"><Car size={10} strokeWidth={2.2} />386 km</span>
    </div>
  );
}

// A recorded day, with the two places the traveller stayed.
const TRAIL = '84,94 96,88 106,80 118,76 130,74 142,66 152,58 162,62 172,66 180,56 186,46';
const STAYS: Array<[number, number]> = [[130, 74], [186, 46]];

function DawarichVisual() {
  return (
    <div className="rn-vis rn-vis-trail">
      <svg viewBox="0 0 200 112" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
        <polyline className="rn-vis-trail-line" points={TRAIL} />
        {STAYS.map(([x, y]) => <circle key={x} className="rn-vis-trail-stay" cx={x} cy={y} r="3.4" />)}
      </svg>
      <span className="rn-vis-brand"><DawarichIcon size={58} /></span>
    </div>
  );
}

const VISUALS: Record<string, () => React.ReactElement> = {
  'places-api': PlacesApiVisual,
  roadtrip: RoadtripVisual,
  dawarich: DawarichVisual,
};

/** The card's picture, or its icon when the release names no drawing this client knows. */
export function ReleaseFeatureVisual({ visual, iconName }: { visual?: string; iconName: string }) {
  const Drawing = visual ? VISUALS[visual] : undefined;
  if (Drawing) return <Drawing />;
  const Icon: React.ElementType =
    ((LucideIcons as Record<string, unknown>)[iconName] as React.ElementType) ?? Sparkles;
  return (
    <div className="rn-vis rn-vis-icon">
      <Icon size={30} strokeWidth={1.6} aria-hidden="true" />
    </div>
  );
}
