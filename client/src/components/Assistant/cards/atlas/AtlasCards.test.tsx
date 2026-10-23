/**
 * FE-AI-ATLAS-001 to FE-AI-ATLAS-006
 *
 * The atlas answer cards as the chat draws them: the passport with its
 * figures, flags, continents, next trip and streak; a country with its trips
 * and places; the bucket list as wish tiles; every one leading to the Atlas,
 * and the pure look that names the atlas tools, steps and follow-ups.
 */
import type { AssistantMessage, AtlasBucketEntry, AtlasCountryCard, AtlasPassportCard, TrekCard } from '@trek/shared';
import type { ReactNode } from 'react';
import { describe, expect, it, vi } from 'vitest';

import { fireEvent, render, screen } from '../../../../../tests/helpers/render';
import { type AssistantView, AssistantViewContext } from '../../assistantViewContext';
import { CARD_LOOKS, ENTITY_LOOK, STEP_LOOKS, TOOL_LABELS } from '../cardLooks';
import type { CardEntry } from '../cardTypes';
import AtlasBucketBlock from './AtlasBucketCard';
import AtlasCountryBlock from './AtlasCountryCard';
import AtlasPassportBlock from './AtlasPassportCard';

const MESSAGE = { id: 'm1', role: 'assistant', parts: [] } as unknown as AssistantMessage;
const CODES = 'JP FR IT ES PT GR HR AT CH DE NL BE NO SE DK IS FI PL'.split(' ');

function inView(ui: ReactNode, view: Partial<AssistantView> = {}) {
  const value: AssistantView = { tripId: 4, variant: 'window', ...view };
  return render(<AssistantViewContext.Provider value={value}>{ui}</AssistantViewContext.Provider>);
}

const entries = (...cards: TrekCard[]): CardEntry[] =>
  cards.map((card, index) => ({ toolCallId: `call_${index}`, card }));

const passport: AtlasPassportCard = {
  kind: 'atlasPassport',
  countries: { visited: 23, planned: 4, idea: 0 },
  totals: { trips: 48, days: 410, places: 990, cities: 312, flownKm: 182_300 },
  flags: [...CODES.map((code) => ({ code, status: 'visited' as const })), { code: 'MA', status: 'planned' as const }],
  moreFlags: 4,
  continents: [
    { name: 'Europe', visited: 14, planned: 2 },
    { name: 'Asia', visited: 5, planned: 0 },
    { name: 'Africa', visited: 0, planned: 1 },
  ],
  nextTrip: { title: 'Lisbon', startDate: '2026-11-03', daysUntil: 12 },
  streakYears: 3,
};

const japan: AtlasCountryCard = {
  kind: 'atlasCountry',
  code: 'JP',
  status: 'planned',
  markedBy: 'dawarich',
  placeCount: 14,
  tripCount: 2,
  trips: [
    { id: 1, title: 'Kyoto in spring', startDate: '2024-04-03', endDate: '2024-04-14' },
    { id: 2, title: 'Tokyo food week', startDate: '2019-10-12', endDate: null },
  ],
  moreTrips: 1,
  places: ['Fushimi Inari', 'Kinkaku-ji'],
  morePlaces: 12,
  change: null,
};

function wish(id: number | null, name: string, extra: Partial<AtlasBucketEntry> = {}): AtlasBucketEntry {
  return {
    id,
    name,
    countryCode: 'IS',
    regionCode: null,
    targetDate: null,
    notes: null,
    reachedOn: null,
    reachedFrom: null,
    ...extra,
  };
}

describe('atlas answer cards', () => {
  it('FE-AI-ATLAS-001: the passport shows the visited number, the figures, sixteen flags and the rest counted', () => {
    const onOpen = vi.fn();
    inView(<AtlasPassportBlock cards={entries(passport)} message={MESSAGE} />, { onOpen });
    expect(screen.getByRole('region', { name: 'Your atlas' })).toBeInTheDocument();
    expect(screen.getByText('23')).toBeInTheDocument();
    expect(screen.getByText('4 planned')).toBeInTheDocument();
    for (const label of ['Trips', 'Days', 'Cities', 'Flown']) expect(screen.getByText(label)).toBeInTheDocument();
    expect(screen.getByText('182300 km')).toBeInTheDocument();
    expect(screen.getByRole('img', { name: 'Japan, Visited' })).toBeInTheDocument();
    expect(screen.queryByRole('img', { name: 'Morocco, Planned' })).toBeNull();
    expect(screen.getByText('7 more')).toBeInTheDocument();
    expect(screen.getByText('Europe')).toBeInTheDocument();
    expect(screen.queryByText('Africa')).toBeNull();
    expect(screen.getByText('Next trip: Lisbon in 12 days')).toBeInTheDocument();
    expect(screen.getByText('3 years in a row')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: '7 more' }));
    expect(onOpen).toHaveBeenCalledWith({ kind: 'page', path: '/atlas' });
    fireEvent.click(screen.getByRole('button', { name: /Open Atlas/ }));
    expect(onOpen).toHaveBeenCalledWith({ kind: 'page', path: '/atlas' });
  });

  it('FE-AI-ATLAS-002: a roomy window shows more flags, a trip-less user only the number and the flags, nothing flown no figure', () => {
    const roomy = inView(<AtlasPassportBlock cards={entries(passport)} message={MESSAGE} />, { density: 'roomy' });
    expect(screen.getByRole('img', { name: 'Morocco, Planned' })).toHaveClass('opacity-60');
    expect(screen.getByText('4 more')).toBeInTheDocument();
    roomy.unmount();

    const tripless = {
      ...passport,
      totals: { trips: 0, days: 0, places: 0, cities: 0, flownKm: null },
      continents: [],
      nextTrip: null,
      streakYears: null,
    };
    inView(<AtlasPassportBlock cards={entries(passport, tripless)} message={MESSAGE} />, { variant: 'fullscreen' });
    expect(screen.queryByText('Trips')).toBeNull();
    expect(screen.queryByText('Flown')).toBeNull();
    expect(screen.getByRole('img', { name: 'Japan, Visited' })).toBeInTheDocument();
    expect(screen.queryByText(/Next trip/)).toBeNull();
  });

  it('FE-AI-ATLAS-003: a country reads its standing, continent, counts, latest trips, places and its recordings', () => {
    const korea: TrekCard = { ...japan, code: 'KR', status: null, markedBy: null };
    inView(<AtlasCountryBlock cards={entries(japan, korea)} message={MESSAGE} />);
    expect(screen.getByText('Japan')).toBeInTheDocument();
    expect(screen.getByText('South Korea')).toBeInTheDocument();
    expect(screen.getByText('Planned')).toBeInTheDocument();
    expect(screen.getByText('Not on your map')).toBeInTheDocument();
    expect(screen.getAllByText('Asia')).toHaveLength(2);
    expect(screen.getAllByText('2 trips')).toHaveLength(2);
    expect(screen.getAllByText('14 places')).toHaveLength(2);
    expect(screen.getAllByText('Apr 3, 2024 to Apr 14, 2024')).toHaveLength(2);
    expect(screen.getAllByText('Oct 12, 2019')).toHaveLength(2);
    expect(screen.getAllByText('12 more')).toHaveLength(2);
    expect(screen.getAllByText('1 more')).toHaveLength(2);
    expect(screen.getAllByText('From your recordings')).toHaveLength(1);
  });

  it('FE-AI-ATLAS-004: the bucket list shows six tiles on the phone, each wish once, counted by its longest read', () => {
    const onOpen = vi.fn();
    const first: TrekCard = {
      kind: 'atlasBucket',
      items: [
        wish(1, 'Northern lights', { targetDate: '2027-02', notes: 'Glacier hike' }),
        wish(2, 'Petra', { countryCode: null, reachedOn: '2025-04-02', reachedFrom: 'dawarich' }),
        ...[3, 4, 5].map((id) => wish(id, `Wish ${id}`)),
      ],
      more: 3,
      change: null,
    };
    const later = [wish(5, 'Wish 5'), wish(6, 'Wish 6'), wish(7, 'Wish 7')];
    const second: TrekCard = { kind: 'atlasBucket', items: later, more: 0, change: null };
    inView(<AtlasBucketBlock cards={entries(first, second)} message={MESSAGE} />, { variant: 'fullscreen', onOpen });
    expect(screen.getByRole('region', { name: 'Bucket List' })).toBeInTheDocument();
    expect(screen.getAllByRole('listitem')).toHaveLength(6);
    expect(screen.getByText('Feb 2027')).toBeInTheDocument();
    expect(screen.getByText('Glacier hike')).toBeInTheDocument();
    expect(screen.getByText('Reached on Apr 2, 2025')).toBeInTheDocument();
    expect(screen.queryByText('Wish 7')).toBeNull();
    // The first read knows 8 wishes (5 shown, 3 left out), the second only 3: 8 in all, 6 shown, 2 more.
    fireEvent.click(screen.getByRole('button', { name: '2 more' }));
    expect(onOpen).toHaveBeenCalledWith({ kind: 'page', path: '/atlas' });
  });

  it('FE-AI-ATLAS-005: blocks of another kind or without a card of theirs draw nothing', () => {
    const other = entries({ kind: 'tourList' } as TrekCard);
    const { container } = inView(
      <>
        <AtlasPassportBlock cards={other} message={MESSAGE} />
        <AtlasCountryBlock cards={other} message={MESSAGE} />
        <AtlasBucketBlock cards={other} message={MESSAGE} />
      </>
    );
    expect(container).toBeEmptyDOMElement();
  });

  it('FE-AI-ATLAS-006: the look names the atlas tools and reads, opens the Atlas for an applied change and asks next', () => {
    expect(TOOL_LABELS.unmark_region_visited?.labelKey).toBe('assistant.tool.unmark_region_visited');
    expect(TOOL_LABELS.mark_country_visited?.labelKey).toBe('assistant.tool.mark_country_visited');
    expect(STEP_LOOKS.list_bucket_list?.stepKey).toBe('assistant.step.bucketList');
    const applied = { toolCallId: 'c', entity: 'atlas' as const, ids: [], dayId: null, undoUntil: null };
    expect(ENTITY_LOOK.atlas.open?.(applied, null)).toEqual({ kind: 'page', path: '/atlas' });
    expect(ENTITY_LOOK.atlas.onMap).toBeUndefined();
    expect(CARD_LOOKS.atlasBucket.followUps?.map((followUp) => followUp.id)).toEqual(['atlasPlanWish', 'atlasAddWish']);
  });
});
