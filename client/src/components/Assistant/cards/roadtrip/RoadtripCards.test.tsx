/**
 * FE-AI-RT-020 to FE-AI-RT-029, FE-AI-RT-033
 *
 * The road trip's other cards: corridor hits worded as the corridor panel
 * words them, a charger as checked with its source and no link, green only
 * while its count is fresh and dated once it is not from today, transit
 * connections that open one at a time and the journey a change adds, the day
 * route a change bends in its three states, and the rules a change sets.
 */
import type {
  CorridorCard as CorridorCardData,
  DayRouteCard,
  RoadtripRulesCard,
  TransitCard as TransitCardData,
} from '@trek/shared';
import type { ReactNode } from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { charger } from '../../../../../tests/helpers/assistantRoadtrip';
import { fireEvent, render, screen } from '../../../../../tests/helpers/render';
import { useAssistantStore } from '../../../../store/assistantStore';
import type { ChangeItem } from '../../assistantParts';
import { type AssistantView, AssistantViewContext } from '../../assistantViewContext';
import ChargingCard from './ChargingCard';
import CorridorCard from './CorridorCard';
import DayRouteBody from './DayRouteBody';
import RulesBody from './RulesBody';
import TransitCard, { TransitBody } from './TransitCard';

const INITIAL = useAssistantStore.getState();

afterEach(() => {
  useAssistantStore.setState(INITIAL, true);
});

function inView(ui: ReactNode, view: Partial<AssistantView> = {}) {
  const value: AssistantView = { tripId: 4, variant: 'window', onOpen: vi.fn(), ...view };
  return render(<AssistantViewContext.Provider value={value}>{ui}</AssistantViewContext.Provider>);
}

function item(state: ChangeItem['state']): ChangeItem {
  return { toolCallId: 'call_9', preview: null, applied: null, state, card: null };
}

const CORRIDOR: CorridorCardData = {
  kind: 'corridor',
  dayId: 31,
  dayNumber: 2,
  category: 'charging',
  widthKm: 5,
  hits: [
    {
      ref: 'call_1:0',
      name: 'Ionity Holzkirchen',
      brand: 'Ionity',
      lat: 47.88,
      lng: 11.7,
      alongKm: 31.4,
      offKm: 0.4,
      between: ['Munich', 'Verona'],
      sockets: [{ type: 'ccs', kw: 350, count: 6 }],
    },
  ],
  more: 4,
  searched: { done: 6, total: 9 },
  partial: true,
};

const leg = {
  mode: 'RAIL',
  line: 'RE 4',
  lineColor: '#ff0000',
  lineTextColor: null,
  from: { name: 'Munich Hbf', time: '08:04', track: '12' },
  to: { name: 'Rosenheim', time: '08:41', track: null },
  durationS: 2220,
  stops: 3,
  headsign: 'Salzburg',
  agency: null,
};
const itinerary = {
  date: '2026-10-01',
  start: '08:04',
  end: '08:41',
  endDayOffset: 0,
  durationS: 2220,
  transfers: 0,
  walkS: 0,
  legs: [leg],
};
const TRANSIT: TransitCardData = {
  kind: 'transit',
  from: 'Munich',
  to: 'Rosenheim',
  dayId: null,
  itineraries: [itinerary, { ...itinerary, start: '09:04', end: '09:41', legs: [{ ...leg, line: 'RE 5' }] }],
  more: 2,
  dropped: 1,
};

describe('road trip cards', () => {
  it('FE-AI-RT-020: lists corridor hits with how far along and off the road they lie and the stops around them', () => {
    inView(<CorridorCard cards={[{ toolCallId: 'call_1', card: CORRIDOR }]} />);
    expect(screen.getByText('Ionity Holzkirchen')).toBeInTheDocument();
    expect(screen.getByText('Munich')).toBeInTheDocument();
    expect(screen.getByText('Verona')).toBeInTheDocument();
    expect(screen.getByText(/CCS/)).toHaveTextContent('CCS 350 kW ×6');
    expect(screen.getByText('Searched 6 of 9 areas so far.')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '4 more found along the route' })).toBeInTheDocument();
    fireEvent.mouseEnter(screen.getByRole('button', { name: /Ionity Holzkirchen/ }));
    expect(useAssistantStore.getState().preview).toMatchObject({ tripId: 4, ref: 'call_1:0', lat: 47.88 });
  });

  it('FE-AI-RT-021: a corridor search that found nothing says so', () => {
    const empty: CorridorCardData = { ...CORRIDOR, hits: [], more: 0, partial: false };
    inView(<CorridorCard cards={[{ toolCallId: 'call_1', card: empty }]} />);
    expect(screen.getByText(/Nothing found within 5/)).toBeInTheDocument();
  });

  it('FE-AI-RT-022: a charger shows its snapshot, when it was checked and its source, and links nowhere', () => {
    const { container } = inView(<ChargingCard toolCallId="call_2" card={charger({ updatedAt: null })} />);
    expect(screen.getByText('4/6')).toBeInTheDocument();
    expect(screen.getByText(/Checked at/)).toBeInTheDocument();
    expect(screen.getByText('1 other price')).toBeInTheDocument();
    expect(screen.getByText('Data from MobiData BW under CC BY 4.0.')).toBeInTheDocument();
    expect(container.querySelector('a')).toBeNull();
  });

  it('FE-AI-RT-023: a stale charger warns, and an unknown one shows no figure', () => {
    inView(<ChargingCard toolCallId="call_2" card={charger({ stale: true, available: null, energy: null })} />);
    expect(screen.getByText('?')).toBeInTheDocument();
    expect(screen.getByText(/Checked at/)).toHaveClass('text-warning');
  });

  it('FE-AI-RT-028: a count checked just now is green; one from another day is neutral and says the day', () => {
    const fresh = inView(<ChargingCard toolCallId="call_2" card={charger({ checkedAt: new Date().toISOString() })} />);
    expect(screen.getByText('4/6')).toHaveClass('bg-success-soft');
    expect(screen.getByText(/Checked at/)).not.toHaveTextContent(/2025/);
    fresh.unmount();
    inView(<ChargingCard toolCallId="call_2" card={charger({ checkedAt: '2025-03-04T07:38:00Z' })} />);
    expect(screen.getByText('4/6')).not.toHaveClass('bg-success-soft');
    expect(screen.getByText(/Checked at/)).toHaveTextContent(/Mar.*2025/);
  });

  it('FE-AI-RT-024: transit connections open one at a time and count what the card leaves out', () => {
    inView(<TransitCard cards={[{ toolCallId: 'call_3', card: TRANSIT }]} />);
    expect(screen.getByText('Munich → Rosenheim')).toBeInTheDocument();
    expect(screen.getAllByRole('button', { expanded: true })).toHaveLength(1);
    expect(screen.getAllByRole('button', { expanded: false })).toHaveLength(1);
    expect(screen.getByText('Munich Hbf')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { expanded: false }));
    expect(screen.getAllByRole('button', { expanded: true })).toHaveLength(1);
    expect(screen.getByText('2 more connections')).toBeInTheDocument();
    expect(screen.getByText('1 connection could not be shown')).toBeInTheDocument();
  });

  it('FE-AI-RT-033: a title of Arabic names points its arrow left, from the first name to the second', () => {
    inView(<TransitCard cards={[{ toolCallId: 'call_3', card: { ...TRANSIT, from: 'الرياض', to: 'جدة' } }]} />);
    expect(screen.getByText('الرياض ← جدة')).toBeInTheDocument();
  });

  it('FE-AI-RT-025: a held journey shows its one connection leg by leg', () => {
    inView(<TransitBody card={{ ...TRANSIT, itineraries: [itinerary], more: 0, dropped: 0 }} item={item('pending')} />);
    expect(screen.getByText('Munich Hbf')).toBeInTheDocument();
    expect(screen.getByText('Rosenheim')).toBeInTheDocument();
  });

  it('FE-AI-RT-026: the day route dashes what waits, fades once discarded and names its new stops and vias', () => {
    const route: DayRouteCard = {
      kind: 'dayRoute',
      dayId: 31,
      dayNumber: 1,
      stops: [
        { placeId: 1, name: 'Munich', lat: 48.1, lng: 11.6, added: false },
        { placeId: null, name: 'Garmisch', lat: 47.5, lng: 11.1, added: true },
      ],
      vias: [{ lat: 47.8, lng: 11.3, after: 0, state: 'added', from: null }],
      afterName: 'Munich',
      track: 'Romantic Road',
      unresolved: ['My location'],
    };
    const { container, rerender } = inView(<DayRouteBody card={route} item={item('pending')} />);
    expect(screen.getByText('1 via point')).toBeInTheDocument();
    expect(screen.getByText('After Munich')).toBeInTheDocument();
    expect(screen.getByText('Follows Romantic Road')).toBeInTheDocument();
    expect(screen.getByText('1 new stop')).toBeInTheDocument();
    expect(screen.getByText('1 stop could not be placed')).toBeInTheDocument();
    expect(container.querySelector('[stroke-dasharray]')).not.toBeNull();
    rerender(
      <AssistantViewContext.Provider value={{ tripId: 4, variant: 'window' }}>
        <DayRouteBody card={route} item={item('discarded')} />
      </AssistantViewContext.Provider>
    );
    expect(container.firstElementChild).toHaveClass('opacity-50');
  });

  it('FE-AI-RT-027: the rules a change sets read from the saved value to the new one, and where a day ends', () => {
    const rules: RoadtripRulesCard = {
      kind: 'roadtripRules',
      settings: [
        { key: 'roadtrip_hotel_bookends', before: false, after: true },
        { key: 'roadtrip_day_start', before: null, after: '09:30' },
      ],
      dayEnd: { dayId: 31, dayNumber: 2, mode: 'along', from: 'Garmisch', to: 'Innsbruck', percent: 40 },
    };
    inView(<RulesBody card={rules} item={item('pending')} />);
    expect(screen.getByText('Start and end each day at your stay')).toBeInTheDocument();
    expect(screen.getByText('Off')).toHaveClass('line-through');
    expect(screen.getByText('On')).toBeInTheDocument();
    expect(screen.getByText('Day start time')).toBeInTheDocument();
    expect(screen.getByText('The day ends 40 % along the drive after Garmisch')).toBeInTheDocument();
    expect(screen.queryByText('Day 2')).not.toBeInTheDocument();
  });

  it('FE-AI-RT-029: a day end without the stop it names says nothing rather than half a sentence', () => {
    const blank: RoadtripRulesCard = {
      kind: 'roadtripRules',
      settings: [],
      dayEnd: { dayId: 31, dayNumber: 2, mode: 'stop', from: null, to: null, percent: null },
    };
    const first = inView(<RulesBody card={blank} item={item('pending')} />);
    expect(first.container).not.toHaveTextContent(/The day ends/);
    first.unmount();
    const auto: RoadtripRulesCard = {
      ...blank,
      dayEnd: { dayId: 31, dayNumber: 2, mode: 'auto', from: null, to: null, percent: null },
    };
    inView(<RulesBody card={auto} item={item('pending')} />);
    expect(screen.getByText('The day ends automatically again')).toBeInTheDocument();
  });
});
