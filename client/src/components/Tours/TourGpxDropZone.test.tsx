import { describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '../../../tests/helpers/render';
import type { Day } from '../../types';
import { dayMenuLabel, tourDaysOf } from './tourDays';
import TourGpxDropZone from './TourGpxDropZone';
import type { TourGpxImport } from './useTourGpxImport';

function gpxImport(overrides: Partial<TourGpxImport> = {}): TourGpxImport {
  return {
    importing: false,
    importFiles: vi.fn().mockResolvedValue(undefined),
    pick: vi.fn(),
    preview: null,
    confirm: vi.fn().mockResolvedValue(undefined),
    cancel: vi.fn(),
    ...overrides,
  };
}

const file = new File(['<gpx/>'], 'ridge.gpx', { type: 'application/gpx+xml' });
const filesDrag = { dataTransfer: { types: ['Files'], files: [file], dropEffect: 'none' } };
const rowDrag = { dataTransfer: { types: ['text/plain'], files: [], dropEffect: 'none' } };

describe('TourGpxDropZone', () => {
  it('RC-04: a file dragged over the workspace says it will be imported, and a drop imports it', () => {
    const importer = gpxImport();
    render(
      <TourGpxDropZone gpxImport={importer} canEdit>
        <p>workspace</p>
      </TourGpxDropZone>
    );
    const zone = screen.getByText('workspace').parentElement as HTMLElement;

    fireEvent.dragEnter(zone, filesDrag);
    expect(screen.getByTestId('tour-gpx-drop')).toHaveTextContent('Drop GPX files to import them');

    fireEvent.drop(zone, filesDrag);
    expect(importer.importFiles).toHaveBeenCalledWith([file]);
    expect(screen.queryByTestId('tour-gpx-drop')).not.toBeInTheDocument();
  });

  it('RC-04: a waypoint or tour row being dragged passes straight through', () => {
    const importer = gpxImport();
    render(
      <TourGpxDropZone gpxImport={importer} canEdit>
        <p>workspace</p>
      </TourGpxDropZone>
    );
    const zone = screen.getByText('workspace').parentElement as HTMLElement;

    fireEvent.dragEnter(zone, rowDrag);
    fireEvent.drop(zone, rowDrag);
    expect(screen.queryByTestId('tour-gpx-drop')).not.toBeInTheDocument();
    expect(importer.importFiles).not.toHaveBeenCalled();
  });

  it('RC-04: leaving every child it entered takes the overlay away again', () => {
    render(
      <TourGpxDropZone gpxImport={gpxImport()} canEdit>
        <p>workspace</p>
      </TourGpxDropZone>
    );
    const zone = screen.getByText('workspace').parentElement as HTMLElement;
    fireEvent.dragEnter(zone, filesDrag);
    fireEvent.dragEnter(zone, filesDrag);
    fireEvent.dragLeave(zone, filesDrag);
    expect(screen.getByTestId('tour-gpx-drop')).toBeInTheDocument();
    fireEvent.dragLeave(zone, filesDrag);
    expect(screen.queryByTestId('tour-gpx-drop')).not.toBeInTheDocument();
  });

  it('RC-04: without the right to add tours it says so and imports nothing', () => {
    const importer = gpxImport();
    render(
      <TourGpxDropZone gpxImport={importer} canEdit={false}>
        <p>workspace</p>
      </TourGpxDropZone>
    );
    const zone = screen.getByText('workspace').parentElement as HTMLElement;
    fireEvent.dragEnter(zone, filesDrag);
    expect(screen.getByTestId('tour-gpx-drop')).toHaveTextContent('You cannot add tours to this trip.');
    fireEvent.drop(zone, filesDrag);
    expect(importer.importFiles).not.toHaveBeenCalled();
  });

  it('RC-04: stays up and says so while an import runs', () => {
    render(
      <TourGpxDropZone gpxImport={gpxImport({ importing: true })} canEdit>
        <p>workspace</p>
      </TourGpxDropZone>
    );
    expect(screen.getByTestId('tour-gpx-drop')).toHaveTextContent('Importing GPX…');
  });
});

describe('tourDays', () => {
  const days = [
    { id: 1, title: null, date: '2026-07-08' },
    { id: 2, title: 'Lakes', date: null },
    { id: 3, title: null, date: null },
  ] as Day[];

  it('RC-02: lists the days a tour is on in the order of the trip, each once', () => {
    const assignments = {
      '3': [{ id: 9, place_id: 42 }],
      '1': [
        { id: 7, place_id: 42 },
        { id: 8, place_id: 42 },
      ],
      '2': [{ id: 6, place_id: 5 }],
    } as never;
    expect(tourDaysOf(42, days, assignments).map(({ day, index }) => [day.id, index])).toEqual([
      [1, 0],
      [3, 2],
    ]);
    expect(tourDaysOf(99, days, assignments)).toEqual([]);
  });

  it('RC-02: names a day by its number, its date and its title as far as it has them', () => {
    const t = (key: string, params?: Record<string, unknown>) => (key === 'dayplan.dayN' ? `Day ${params?.n}` : key);
    expect(dayMenuLabel(days[1], 1, t, 'en')).toBe('Day 2: Lakes');
    expect(dayMenuLabel(days[2], 2, t, 'en')).toBe('Day 3');
    expect(dayMenuLabel(days[0], 0, t, 'en')).toMatch(/^Day 1, .*8/);
  });
});
