import type { WalkImportPreviewResponse } from '@trek/shared';
import { describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen, within } from '../../../../tests/helpers/render';
import type { WalkImport } from './useWalkImport';
import { WalkImportDialog, WalkImportDraftNotice } from './WalkImportDialog';

// FE-WALK-IMPORT-DIALOG-001 to FE-WALK-IMPORT-DIALOG-006

const ROUTE = 'https://www.google.com/maps/dir/Cathedral/Market/Park/data=!3e2';
const PREVIEW: WalkImportPreviewResponse = {
  stations: [
    { name: 'Cathedral', lat: 48.1, lng: 11.5 },
    { name: 'Market', lat: null, lng: null },
    { name: null, lat: 48.12, lng: 11.52 },
  ],
  resolved_url: ROUTE,
};

function walkImport(over: Partial<WalkImport> = {}): WalkImport {
  return {
    open: true,
    show: vi.fn(),
    close: vi.fn(),
    url: '',
    setUrl: vi.fn(),
    phase: 'link',
    preview: null,
    failure: null,
    unplaced: 0,
    canRead: false,
    canLoad: false,
    read: vi.fn().mockResolvedValue(undefined),
    back: vi.fn(),
    load: vi.fn(),
    ...over,
  };
}

const atPreview = (over: Partial<WalkImport> = {}) =>
  walkImport({ phase: 'preview', preview: PREVIEW, unplaced: 1, canLoad: true, url: ROUTE, ...over });

describe('WalkImportDialog (CW-07)', () => {
  it('FE-WALK-IMPORT-DIALOG-001: asks for the link, reads it on the button and on Enter, and says why one was refused', () => {
    const closed = walkImport({ open: false });
    const { rerender } = render(<WalkImportDialog walkImport={closed} hasUnsavedChanges={false} />);
    expect(screen.queryByRole('dialog')).toBeNull();

    const w = walkImport({ url: 'https://maps.app.goo.gl/abc', canRead: true });
    rerender(<WalkImportDialog walkImport={w} hasUnsavedChanges={false} />);
    expect(screen.getByText('Walk from a Google Maps link')).toBeInTheDocument();
    const input = screen.getByLabelText('Link to the walking route');
    fireEvent.change(input, { target: { value: 'https://maps.app.goo.gl/xyz' } });
    expect(w.setUrl).toHaveBeenCalledWith('https://maps.app.goo.gl/xyz');
    fireEvent.click(screen.getByTestId('walk-import-read'));
    expect(w.read).toHaveBeenCalledTimes(1);
    fireEvent.submit(input.closest('form') as HTMLFormElement);
    expect(w.read).toHaveBeenCalledTimes(2);
    fireEvent.click(screen.getByText('Cancel'));
    expect(w.close).toHaveBeenCalledTimes(1);

    const refused = walkImport({ failure: 'That route is not planned on foot.' });
    rerender(<WalkImportDialog walkImport={refused} hasUnsavedChanges={false} />);
    expect(screen.getByText('That route is not planned on foot.')).toBeInTheDocument();
    expect(screen.getByTestId('walk-import-read')).toBeDisabled();
    fireEvent.submit(screen.getByLabelText('Link to the walking route').closest('form') as HTMLFormElement);
    expect(refused.read).not.toHaveBeenCalled();
  });

  it('FE-WALK-IMPORT-DIALOG-002: waits while the link is read', () => {
    render(<WalkImportDialog walkImport={walkImport({ phase: 'reading', url: ROUTE })} hasUnsavedChanges={false} />);
    expect(screen.getByLabelText('Link to the walking route')).toBeDisabled();
    expect(screen.getByTestId('walk-import-read')).toBeDisabled();
  });

  it('FE-WALK-IMPORT-DIALOG-003: shows the stops in their order, the one without a position marked', () => {
    render(<WalkImportDialog walkImport={atPreview()} hasUnsavedChanges={false} />);
    const rows = screen.getAllByTestId('walk-import-station');
    expect(rows.map((row) => row.textContent)).toEqual([
      '1Cathedral48.10000, 11.50000',
      '2MarketNo position in the link',
      '3Stop 348.12000, 11.52000',
    ]);
    expect(rows.map((row) => row.getAttribute('data-unresolved'))).toEqual([null, 'true', null]);
    expect(screen.getByText('1 stop has no position in the link and is left out.')).toBeInTheDocument();
    expect(
      screen.getByText('TREK plans the way between the stops again; the line drawn in Google Maps is not taken over.')
    ).toBeInTheDocument();
    expect(screen.queryByText('A walk needs at least two stops with a position.')).toBeNull();
    expect(screen.queryByText('Loading the walk replaces the unsaved changes in the planner.')).toBeNull();
  });

  it('FE-WALK-IMPORT-DIALOG-004: names Google Maps as the source and opens the route read there in a new tab', () => {
    render(<WalkImportDialog walkImport={atPreview()} hasUnsavedChanges={false} />);
    const preview = screen.getByTestId('walk-import-preview');
    expect(within(preview).getByText('From Google Maps')).toBeInTheDocument();
    const source = screen.getByTestId('walk-import-source');
    expect(source).toHaveAttribute('href', ROUTE);
    expect(source).toHaveAttribute('target', '_blank');
    expect(source).toHaveAttribute('rel', 'noopener noreferrer');
    expect(source).toHaveTextContent('Open in Google Maps');
  });

  it('FE-WALK-IMPORT-DIALOG-005: loads or goes back, warns before replacing unsaved work, and loads nothing with too few positions', () => {
    const w = atPreview();
    const { rerender } = render(<WalkImportDialog walkImport={w} hasUnsavedChanges />);
    expect(screen.getByText('Loading the walk replaces the unsaved changes in the planner.')).toBeInTheDocument();
    fireEvent.click(screen.getByTestId('walk-import-load'));
    expect(w.load).toHaveBeenCalledTimes(1);
    fireEvent.click(screen.getByText('Use another link'));
    expect(w.back).toHaveBeenCalledTimes(1);
    // Enter does not read again while the stops are shown.
    fireEvent.submit(screen.getByTestId('walk-import-preview').closest('form') as HTMLFormElement);
    expect(w.read).not.toHaveBeenCalled();

    rerender(<WalkImportDialog walkImport={atPreview({ canLoad: false, unplaced: 2 })} hasUnsavedChanges={false} />);
    expect(screen.getByTestId('walk-import-load')).toBeDisabled();
    expect(screen.getByText('A walk needs at least two stops with a position.')).toBeInTheDocument();
    expect(screen.getByText('2 stops have no position in the link and are left out.')).toBeInTheDocument();
  });
});

describe('WalkImportDraftNotice (CW-07)', () => {
  it('FE-WALK-IMPORT-DIALOG-006: says where an unsaved walk came from, and nothing for any other draft', () => {
    const { rerender } = render(
      <WalkImportDraftNotice planner={{ draftSource: 'google_maps', mode: { type: 'new-draft' } }} />
    );
    expect(
      screen.getByText('From a Google Maps walking route. TREK planned the way between the stops itself.')
    ).toBeInTheDocument();
    rerender(
      <WalkImportDraftNotice planner={{ draftSource: 'google_maps', mode: { type: 'edit-saved', placeId: 3 } }} />
    );
    expect(screen.queryByRole('status')).toBeNull();
    rerender(<WalkImportDraftNotice planner={{ draftSource: null, mode: { type: 'new-draft' } }} />);
    expect(screen.queryByRole('status')).toBeNull();
  });
});
