/**
 * FE-ROADTRIP-SNAPSHOT-001 to FE-ROADTRIP-SNAPSHOT-005
 *
 * The rail's pieces drawn from a snapshot, as the assistant's road trip card
 * draws them: a charger's badges handed in instead of asked live, the
 * vehicle the drive was worked out for instead of the saved one, the day's
 * colour as the drive had it, and the day card without the rail's margins.
 */
import { render, screen } from '@testing-library/react';
import type { ReactElement } from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { preferences, resetRailStores, seedRailSettings } from '../../../tests/helpers/roadtripRail';
import { TranslationProvider } from '../../i18n';
import { ChargingBadges } from './ChargingInfo';
import { DaySection } from './RoadtripSidebar';
import { DayHeader } from './RoadtripSidebarHeaders';
import { ServiceStop, Stop } from './RoadtripSidebarStopRows';
import type { RoadtripDay, RoadtripStop } from './useRoadtripRoutes';

vi.mock('../../hooks/useElementSize', () => ({
  useElementSize: () => ({ ref: () => undefined, width: 0, height: 0 }),
}));
vi.mock('./ChargingInfo', async (importOriginal) => {
  const actual = await importOriginal<typeof import('./ChargingInfo')>();
  const { createElement } = await import('react');
  return { ...actual, default: () => createElement('span', null, 'live charger') };
});

const wrap = (ui: ReactElement) => render(<TranslationProvider>{ui}</TranslationProvider>);

beforeEach(() => {
  seedRailSettings();
  preferences({ roadtrip_vehicle: 'electric', roadtrip_fill_percent: 80 });
});
afterEach(() => resetRailStores());

function stop(over: Partial<RoadtripStop> = {}): RoadtripStop {
  return {
    assignmentId: 1,
    ownerDayId: 1,
    ownerIndex: 0,
    placeId: 10,
    name: 'Ionity Allertal',
    lat: 52.1,
    lng: 10.1,
    time: null,
    dwellMinutes: null,
    legMode: null,
    incomingLegMode: null,
    stopType: 'charging',
    ...over,
  };
}

function day(over: Partial<RoadtripDay> = {}): RoadtripDay {
  return {
    dayId: 3,
    dayNumber: 2,
    date: null,
    title: 'Hamburg to Hanover',
    stops: [
      stop({ name: 'Hamburg', stopType: null }),
      stop({ assignmentId: 2, placeId: 20, name: 'Hanover', stopType: null }),
    ],
    legs: [
      {
        mid: [0, 0],
        from: [0, 0],
        to: [0, 0],
        distance: 150_000,
        duration: 5400,
        walkingText: '',
        drivingText: '',
        distanceText: '',
      },
    ],
    schedule: {
      entries: [
        { arrival: null, departure: null, anchored: false, dayOffset: 0 },
        { arrival: null, departure: null, anchored: false, dayOffset: 0 },
      ],
      warnings: [],
    },
    legVias: [],
    geometry: [],
    distance: 150_000,
    duration: 5400,
    driveWarnings: [],
    dayWarning: null,
    ...over,
  };
}

const NO_DRAG = { from: null, setFrom: () => undefined, dropAt: null, setDropAt: () => undefined };

describe('rail rows from a snapshot', () => {
  it('FE-ROADTRIP-SNAPSHOT-001: a charger shows the badges handed in, none for null, the live ones when left out', () => {
    const { rerender } = wrap(
      <ServiceStop stop={stop()} entry={undefined} late={[]} selected={false} charging={<span>snapshot</span>} />
    );
    expect(screen.getByText('snapshot')).toBeInTheDocument();
    expect(screen.queryByText('live charger')).not.toBeInTheDocument();
    rerender(
      <TranslationProvider>
        <ServiceStop stop={stop()} entry={undefined} late={[]} selected={false} charging={null} />
      </TranslationProvider>
    );
    expect(screen.queryByText('live charger')).not.toBeInTheDocument();
    rerender(
      <TranslationProvider>
        <ServiceStop stop={stop()} entry={undefined} late={[]} selected={false} />
      </TranslationProvider>
    );
    expect(screen.getByText('live charger')).toBeInTheDocument();
  });

  it('FE-ROADTRIP-SNAPSHOT-002: the fill badge follows the vehicle handed in, not the saved one', () => {
    const { rerender } = wrap(
      <Stop stop={stop()} number={1} entry={undefined} late={[]} selected={false} continues={false} charging={null} />
    );
    expect(screen.getByText('80 %')).toBeInTheDocument();
    rerender(
      <TranslationProvider>
        <Stop
          stop={stop()}
          number={1}
          entry={undefined}
          late={[]}
          selected={false}
          continues={false}
          charging={null}
          vehicle={{ kind: 'combustion', fill: null }}
        />
      </TranslationProvider>
    );
    expect(screen.queryByText('80 %')).not.toBeInTheDocument();
    rerender(
      <TranslationProvider>
        <Stop
          stop={stop()}
          number={1}
          entry={undefined}
          late={[]}
          selected={false}
          continues={false}
          charging={null}
          vehicle={{ kind: 'electric', fill: 60 }}
        />
      </TranslationProvider>
    );
    expect(screen.getByText('60 %')).toBeInTheDocument();
  });

  it('FE-ROADTRIP-SNAPSHOT-003: the day wears its colour when the drive had colours, whatever the saved setting', () => {
    const tinted = /^color-mix\(in srgb, .+ 11%, transparent\)$/;
    const { container, unmount } = wrap(<DayHeader day={day()} dayColors />);
    expect(container.querySelector('header')?.style.background).toMatch(tinted);
    unmount();
    preferences({ roadtrip_day_colors: true });
    const plain = wrap(<DayHeader day={day()} dayColors={false} />);
    expect(plain.container.querySelector('header')?.style.background).not.toMatch(tinted);
  });

  it('FE-ROADTRIP-SNAPSHOT-004: the day card sits flush in another surface and its stops are read only', () => {
    const { container } = wrap(<DaySection day={day()} drag={NO_DRAG} flush dayColors={false} />);
    const section = container.querySelector('section');
    expect(section).not.toHaveClass('mx-3.5');
    expect(screen.getByText('Hamburg to Hanover')).toBeInTheDocument();
    expect(screen.getByText('Hanover')).toBeInTheDocument();
    expect(container.querySelector('[draggable="true"]')).toBeNull();
  });

  it('FE-ROADTRIP-SNAPSHOT-005: the compact badges read the free points of all, or a question mark, and the price', () => {
    const { rerender } = wrap(
      <ChargingBadges label="4/6 available" known available={4} total={6} energy={{ price: 0.59, currency: 'EUR' }} />
    );
    expect(screen.getByText('4/6')).toHaveClass('bg-success-soft');
    expect(screen.getByText(/kWh\*/)).toBeInTheDocument();
    rerender(
      <TranslationProvider>
        <ChargingBadges label="Status outdated" known={false} available={null} total={6} energy={null} />
      </TranslationProvider>
    );
    expect(screen.getByText('?')).toBeInTheDocument();
    expect(screen.queryByText(/kWh/)).not.toBeInTheDocument();
  });
});
