// FE-PLANNER-FILEIMP-001 to FE-PLANNER-FILEIMP-018
import { render, screen, fireEvent, waitFor } from '../../../tests/helpers/render';
import { http, HttpResponse } from 'msw';
import { server } from '../../../tests/helpers/msw/server';
import { readMultipart } from '../../../tests/helpers/multipart';
import { useTripStore } from '../../store/tripStore';
import { resetAllStores, seedStore } from '../../../tests/helpers/store';
import { buildTrip } from '../../../tests/helpers/factories';
import FileImportModal from './FileImportModal';

const toastCalls: Array<[string, string]> = [];
vi.mock('../shared/Toast', () => ({
  useToast: () => ({
    success: (m: string) => { toastCalls.push(['success', m]); return 0; },
    error: (m: string) => { toastCalls.push(['error', m]); return 0; },
    warning: (m: string) => { toastCalls.push(['warning', m]); return 0; },
    info: (m: string) => { toastCalls.push(['info', m]); return 0; },
  }),
}));

const defaultProps = { isOpen: true, onClose: vi.fn(), tripId: 3 };

// See BookingImportModal.test.tsx: a file that is really uploaded must carry as
// many bytes as it reports, otherwise the multipart body and its length disagree.
const gpx = (name = 'route.gpx', size = 100) => {
  const f = new File(['<gpx/>'.padEnd(Math.min(size, 4096), ' ')], name, { type: 'application/gpx+xml' });
  if (size > 4096) Object.defineProperty(f, 'size', { value: size });
  return f;
};
const kml = (name = 'places.kml') => new File(['<kml/>'], name, { type: 'application/vnd.google-earth.kml+xml' });

const fileInput = () => document.querySelector('input[type="file"]') as HTMLInputElement;
const dropZone = () => screen.getByText(/Click to select a file or drag and drop here/).parentElement as HTMLElement;
const importBtn = () => screen.getByRole('button', { name: 'Import' });

beforeEach(() => {
  toastCalls.length = 0;
  resetAllStores();
  seedStore(useTripStore, { trip: buildTrip({ id: 3 }) });
  server.use(
    http.get('/api/trips/3', () => HttpResponse.json({ trip: buildTrip({ id: 3 }), days: [], places: [], assignments: {} })),
  );
});

describe('FileImportModal', () => {
  it('FE-PLANNER-FILEIMP-001: renders nothing while closed', () => {
    render(<FileImportModal {...defaultProps} isOpen={false} />);
    expect(screen.queryByText('Import file')).not.toBeInTheDocument();
  });

  it('FE-PLANNER-FILEIMP-002: shows title, hint and a disabled import button', () => {
    render(<FileImportModal {...defaultProps} />);
    expect(screen.getByText('Import file')).toBeInTheDocument();
    expect(screen.getByText(/Import \.gpx, \.kml or \.kmz files/)).toBeInTheDocument();
    expect(importBtn()).toBeDisabled();
  });

  it('FE-PLANNER-FILEIMP-003: an initialFile is pre-selected and shows the GPX options', () => {
    render(<FileImportModal {...defaultProps} initialFile={gpx()} />);
    expect(screen.getByText('route.gpx')).toBeInTheDocument();
    expect(screen.getByText('What do you want to import?')).toBeInTheDocument();
    expect(screen.getByText('Waypoints')).toBeInTheDocument();
    expect(screen.getByText('Tracks (with path geometry)')).toBeInTheDocument();
  });

  it('FE-PLANNER-FILEIMP-004: an unsupported initialFile is rejected on open', () => {
    render(<FileImportModal {...defaultProps} initialFile={new File(['x'], 'notes.txt')} />);
    expect(screen.getByText('Unsupported file type. Use .gpx, .kml or .kmz.')).toBeInTheDocument();
    expect(importBtn()).toBeDisabled();
  });

  it('FE-PLANNER-FILEIMP-005: an oversized file is rejected with the size limit message', () => {
    render(<FileImportModal {...defaultProps} />);
    fireEvent.change(fileInput(), { target: { files: [gpx('big.gpx', 11 * 1024 * 1024)] } });
    expect(screen.getByText('File is too large. Maximum upload size is 10 MB.')).toBeInTheDocument();
  });

  it('FE-PLANNER-FILEIMP-006: a KML selection shows the point/path options instead', () => {
    render(<FileImportModal {...defaultProps} />);
    fireEvent.change(fileInput(), { target: { files: [kml()] } });
    expect(screen.getByText('Points (Placemarks)')).toBeInTheDocument();
    expect(screen.getByText('Paths (LineStrings)')).toBeInTheDocument();
    expect(screen.queryByText('Waypoints')).not.toBeInTheDocument();
  });

  it('FE-PLANNER-FILEIMP-007: unticking every GPX type blocks the import', () => {
    render(<FileImportModal {...defaultProps} initialFile={gpx()} />);
    fireEvent.click(screen.getByText('Waypoints'));
    fireEvent.click(screen.getByText('Routes'));
    fireEvent.click(screen.getByText('Tracks (with path geometry)'));
    expect(screen.getByText('Select at least one type to import.')).toBeInTheDocument();
    expect(importBtn()).toBeDisabled();
  });

  it('FE-PLANNER-FILEIMP-008: unticking every KML type blocks the import', () => {
    render(<FileImportModal {...defaultProps} initialFile={kml()} />);
    fireEvent.click(screen.getByText('Points (Placemarks)'));
    fireEvent.click(screen.getByText('Paths (LineStrings)'));
    expect(screen.getByText('Select at least one type to import.')).toBeInTheDocument();
    expect(importBtn()).toBeDisabled();
  });

  it('FE-PLANNER-FILEIMP-009: dragging over the drop zone switches to the drop label', () => {
    render(<FileImportModal {...defaultProps} />);
    const zone = dropZone();
    fireEvent.dragEnter(zone);
    expect(screen.getByText('Drop file to select')).toBeInTheDocument();
    fireEvent.dragLeave(zone);
    expect(screen.getByText(/Click to select a file/)).toBeInTheDocument();
  });

  it('FE-PLANNER-FILEIMP-019: clicking the drop zone opens the hidden file input', () => {
    render(<FileImportModal {...defaultProps} />);
    const click = vi.spyOn(fileInput(), 'click').mockImplementation(() => {});
    fireEvent.click(dropZone());
    expect(click).toHaveBeenCalled();
    click.mockRestore();
  });

  it('FE-PLANNER-FILEIMP-010: dropping a file selects it', () => {
    render(<FileImportModal {...defaultProps} />);
    fireEvent.drop(dropZone(), { dataTransfer: { files: [gpx('dropped.gpx')] } });
    expect(screen.getByText('dropped.gpx')).toBeInTheDocument();
  });

  it('FE-PLANNER-FILEIMP-011: a GPX import posts the selected type flags, toasts and closes', async () => {
    const onClose = vi.fn();
    let flags: Record<string, string> = {};
    server.use(
      http.post('/api/trips/3/places/import/gpx', async ({ request }) => {
        const { fields } = await readMultipart(request);
        flags = {
          waypoints: fields.importWaypoints,
          routes: fields.importRoutes,
          tracks: fields.importTracks,
        };
        return HttpResponse.json({ count: 4, skipped: 0, places: [{ id: 11 }, { id: 12 }] });
      }),
    );
    render(<FileImportModal {...defaultProps} onClose={onClose} initialFile={gpx()} />);
    fireEvent.click(screen.getByText('Routes'));
    fireEvent.click(importBtn());

    await waitFor(() => expect(onClose).toHaveBeenCalled());
    expect(flags).toEqual({ waypoints: 'true', routes: 'false', tracks: 'true' });
    expect(toastCalls).toContainEqual(['success', '4 places imported from GPX']);
  });

  it('FE-PLANNER-FILEIMP-012: a successful GPX import registers an undo that bulk-deletes the new places', async () => {
    const pushUndo = vi.fn();
    let deleted: number[] = [];
    server.use(
      http.post('/api/trips/3/places/import/gpx', () =>
        HttpResponse.json({ count: 2, skipped: 0, places: [{ id: 21 }, { id: 22 }] })),
      http.post('/api/trips/3/places/bulk-delete', async ({ request }) => {
        deleted = ((await request.json()) as { ids: number[] }).ids;
        return HttpResponse.json({ deleted: deleted.length });
      }),
    );
    render(<FileImportModal {...defaultProps} pushUndo={pushUndo} initialFile={gpx()} />);
    fireEvent.click(importBtn());
    await waitFor(() => expect(pushUndo).toHaveBeenCalled());
    expect(pushUndo.mock.calls[0][0]).toBe('GPX import');

    await pushUndo.mock.calls[0][1]();
    expect(deleted).toEqual([21, 22]);
  });

  it('FE-PLANNER-FILEIMP-013: a KML import keeps the modal open to show the summary', async () => {
    const onClose = vi.fn();
    server.use(
      http.post('/api/trips/3/places/import/map', () =>
        HttpResponse.json({
          count: 3,
          places: [{ id: 31 }],
          summary: { totalPlacemarks: 5, createdCount: 3, skippedCount: 2, warnings: ['2 placemarks had no coordinates'], errors: [] },
        })),
    );
    render(<FileImportModal {...defaultProps} onClose={onClose} initialFile={kml()} />);
    fireEvent.click(importBtn());
    expect(await screen.findByText('Placemarks: 5 • Imported: 3 • Skipped: 2')).toBeInTheDocument();
    expect(screen.getByText('2 placemarks had no coordinates')).toBeInTheDocument();
    expect(onClose).not.toHaveBeenCalled();
    expect(toastCalls).toContainEqual(['success', '3 places imported from KMZ/KML']);
  });

  it('FE-PLANNER-FILEIMP-014: summaries of several KML files are merged', async () => {
    server.use(
      http.post('/api/trips/3/places/import/map', () =>
        HttpResponse.json({
          count: 1,
          places: [{ id: 41 }],
          summary: { totalPlacemarks: 2, createdCount: 1, skippedCount: 1, warnings: ['w'], errors: [] },
        })),
    );
    render(<FileImportModal {...defaultProps} />);
    fireEvent.change(fileInput(), { target: { files: [kml('a.kml'), kml('b.kmz')] } });
    fireEvent.click(importBtn());
    expect(await screen.findByText('Placemarks: 4 • Imported: 2 • Skipped: 2')).toBeInTheDocument();
  });

  it('FE-PLANNER-FILEIMP-015: an import where everything was skipped warns instead of claiming success', async () => {
    server.use(
      http.post('/api/trips/3/places/import/gpx', () => HttpResponse.json({ count: 0, skipped: 3, places: [] })),
    );
    render(<FileImportModal {...defaultProps} initialFile={gpx()} />);
    fireEvent.click(importBtn());
    await waitFor(() => expect(toastCalls).toContainEqual(['warning', 'All places were already in the trip.']));
  });

  it('FE-PLANNER-FILEIMP-016: a failing import shows the server error and keeps the modal open', async () => {
    const onClose = vi.fn();
    server.use(
      http.post('/api/trips/3/places/import/gpx', () => HttpResponse.json({ error: 'Malformed GPX' }, { status: 400 })),
    );
    render(<FileImportModal {...defaultProps} onClose={onClose} initialFile={gpx()} />);
    fireEvent.click(importBtn());
    expect(await screen.findByText('Malformed GPX')).toBeInTheDocument();
    expect(onClose).not.toHaveBeenCalled();
    expect(toastCalls).toContainEqual(['error', 'Malformed GPX']);
  });

  it('FE-PLANNER-FILEIMP-017: with several files each error is prefixed with its file name', async () => {
    server.use(
      http.post('/api/trips/3/places/import/gpx', () => HttpResponse.error()),
    );
    render(<FileImportModal {...defaultProps} />);
    fireEvent.change(fileInput(), { target: { files: [gpx('one.gpx'), gpx('two.gpx')] } });
    fireEvent.click(importBtn());
    const box = await screen.findByText(/one\.gpx: Import failed/);
    expect(box.textContent).toContain('two.gpx: Import failed');
  });

  it('FE-PLANNER-FILEIMP-018: Cancel closes without importing, and a backdrop click closes too', () => {
    const onClose = vi.fn();
    render(<FileImportModal {...defaultProps} onClose={onClose} initialFile={gpx()} />);
    fireEvent.click(screen.getByRole('button', { name: 'Cancel' }));
    expect(onClose).toHaveBeenCalledTimes(1);

    fireEvent.click(document.querySelector('[style*="z-index: 99999"]') as HTMLElement);
    expect(onClose).toHaveBeenCalledTimes(2);
    // A click inside the card is swallowed.
    fireEvent.click(screen.getByText('Import file'));
    expect(onClose).toHaveBeenCalledTimes(2);
  });
});
