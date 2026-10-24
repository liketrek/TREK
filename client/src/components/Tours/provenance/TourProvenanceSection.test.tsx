import { fireEvent, render, screen } from '@testing-library/react';
import type { TourProvenance, TourSourceCheckResponse, TourSourceHint } from '@trek/shared';
import { describe, expect, it, vi } from 'vitest';
import TourProvenanceSection from './TourProvenanceSection';
import type { SourceCheck } from './useSourceCheck';

const base: TourProvenance = {
  origin: 'trek',
  createdAt: '2026-07-01 10:00:00',
  source: { kind: 'trek' },
  derivedFrom: null,
  plannedOver: false,
  editedLocally: null,
};

function check(over: Partial<SourceCheck> = {}): SourceCheck {
  return {
    checking: false,
    result: null,
    check: vi.fn(),
    canReimport: false,
    confirming: false,
    askReimport: vi.fn(),
    cancelReimport: vi.fn(),
    reimporting: false,
    reimport: vi.fn(),
    ...over,
  } as SourceCheck;
}

// Rendered without the translation provider: every text reads as its key, so the test pins which string each part shows.
describe('TourProvenanceSection (P2C-02, MF-03)', () => {
  it('names a planned tour as planned here, with no local state and no check', () => {
    render(<TourProvenanceSection provenance={base} />);
    expect(screen.getByText('tours.provenance.label')).toBeInTheDocument();
    expect(screen.getByText('tours.badge.planned')).toBeInTheDocument();
    expect(screen.getByText('tours.provenance.createdAt')).toBeInTheDocument();
    expect(screen.queryByText('tours.provenance.localState')).toBeNull();
    expect(screen.queryByRole('button', { name: /tours.provenance.check/ })).toBeNull();
  });

  it('names the trip and tour a tour was taken over from, and nothing for one that was not (LIB-02)', () => {
    const { rerender } = render(
      <TourProvenanceSection provenance={{ ...base, takenOverFrom: { tripTitle: 'Alps', tourName: 'Ridge' } }} />
    );
    expect(screen.getByText('tours.provenance.takenOverFrom')).toBeInTheDocument();
    expect(screen.getByTestId('tour-provenance-taken-over')).toHaveTextContent('Alps: Ridge');
    rerender(<TourProvenanceSection provenance={{ ...base, takenOverFrom: null }} />);
    expect(screen.queryByTestId('tour-provenance-taken-over')).toBeNull();
  });

  it('shows a GPX import with its file, and that it was planned over keeping its track', () => {
    render(
      <TourProvenanceSection
        provenance={{ ...base, origin: 'gpx', source: { kind: 'gpx', fileName: 'ridge.gpx' }, plannedOver: true }}
      />
    );
    expect(screen.getByText('tours.badge.gpx')).toBeInTheDocument();
    expect(screen.getByText('ridge.gpx')).toBeInTheDocument();
    expect(screen.getByText('tours.provenance.importedAt')).toBeInTheDocument();
    expect(screen.getByText('tours.provenance.plannedOver')).toBeInTheDocument();
  });

  it('names a KML or KMZ import by its format, never as GPX (IO-02)', () => {
    const { rerender } = render(
      <TourProvenanceSection provenance={{ ...base, origin: 'gpx', source: { kind: 'gpx', fileName: 'Alps.KML' } }} />
    );
    expect(screen.getByText('tours.provenance.fileImport')).toBeInTheDocument();
    expect(screen.queryByText('tours.badge.gpx')).toBeNull();
    expect(screen.getByText('Alps.KML')).toBeInTheDocument();
    rerender(
      <TourProvenanceSection provenance={{ ...base, origin: 'gpx', source: { kind: 'gpx', fileName: null } }} />
    );
    expect(screen.getByText('tours.badge.gpx')).toBeInTheDocument();
  });

  it('links a wanderer snapshot to its trail, tells local edits apart and checks the source on purpose', () => {
    const onCheck = vi.fn();
    render(
      <TourProvenanceSection
        provenance={{
          ...base,
          origin: 'wanderer',
          source: {
            kind: 'wanderer',
            instance: 'https://trails.example',
            externalId: 't1',
            externalUrl: 'https://trails.example/trail/view/@me/t1',
            externalUpdated: '2026-10-01 08:00:00Z',
            importedAt: '2026-10-02 09:00:00',
          },
          editedLocally: true,
        }}
        check={check({ check: onCheck })}
      />
    );
    expect(screen.getByText('trails.example')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'tours.provenance.openSource' })).toHaveAttribute(
      'href',
      'https://trails.example/trail/view/@me/t1'
    );
    expect(screen.getByText('tours.provenance.externalUpdated')).toBeInTheDocument();
    expect(screen.getByText('tours.provenance.editedLocally')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: /tours.provenance.check$/ }));
    expect(onCheck).toHaveBeenCalledTimes(1);
  });

  it('says what the check found, the parts that changed, and asks before the reimport', () => {
    const result: TourSourceCheckResponse = {
      state: 'changed',
      changes: ['name', 'route'],
      externalUpdated: '2026-10-14 12:00:00Z',
      importedUpdated: null,
      editedLocally: false,
      reimport: { trailId: 't1', contentHash: 'h' },
    };
    const askReimport = vi.fn();
    const { rerender } = render(
      <TourProvenanceSection
        provenance={{
          ...base,
          origin: 'wanderer',
          source: {
            kind: 'wanderer',
            instance: 'https://t.example',
            externalId: 't1',
            externalUrl: null,
            externalUpdated: null,
            importedAt: null,
          },
        }}
        check={check({ result, canReimport: true, askReimport })}
      />
    );
    expect(screen.getByRole('status')).toHaveTextContent('tours.provenance.state.changed');
    expect(screen.getByText('tours.provenance.change.name')).toBeInTheDocument();
    expect(screen.getByText('tours.provenance.change.route')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: /tours.provenance.reimport/ }));
    expect(askReimport).toHaveBeenCalledTimes(1);

    rerender(
      <TourProvenanceSection
        provenance={{
          ...base,
          origin: 'wanderer',
          source: {
            kind: 'wanderer',
            instance: 'https://t.example',
            externalId: 't1',
            externalUrl: null,
            externalUpdated: null,
            importedAt: null,
          },
        }}
        check={check({ result: { ...result, state: 'unavailable', changes: [], reimport: null } })}
      />
    );
    expect(screen.getByText('tours.provenance.body.unavailable')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /tours.provenance.reimport/ })).toBeNull();
  });

  it('shows the background hint with its own check button until the source answered (WAN-02)', () => {
    const onCheck = vi.fn();
    const wanderer: TourProvenance = {
      ...base,
      origin: 'wanderer',
      source: {
        kind: 'wanderer',
        instance: 'https://t.example',
        externalId: 't1',
        externalUrl: null,
        externalUpdated: null,
        importedAt: null,
      },
    };
    const hint: TourSourceHint = {
      state: 'changed',
      changes: ['description'],
      reason: null,
      externalUpdated: '2026-10-14',
      checkedAt: '2026-10-20T10:00:00Z',
    };
    const { rerender } = render(
      <TourProvenanceSection provenance={wanderer} check={check({ check: onCheck })} hint={hint} />
    );
    const notice = screen.getByTestId('tour-source-hint');
    expect(notice).toHaveTextContent('wanderer.watch.noticeLabel');
    expect(screen.getByTestId('source-hint-state')).toHaveAttribute('data-state', 'changed');
    expect(screen.getByText('tours.provenance.change.description')).toBeInTheDocument();
    const buttons = screen.getAllByRole('button', { name: /tours.provenance.check$/ });
    expect(buttons).toHaveLength(1);
    fireEvent.click(buttons[0]);
    expect(onCheck).toHaveBeenCalledTimes(1);

    rerender(
      <TourProvenanceSection
        provenance={wanderer}
        check={check({ answered: true })}
        hint={{ ...hint, state: 'unverifiable', changes: [], reason: 'unavailable' }}
      />
    );
    expect(screen.queryByTestId('tour-source-hint')).toBeNull();
    expect(screen.getAllByRole('button', { name: /tours.provenance.check$/ })).toHaveLength(1);

    rerender(<TourProvenanceSection provenance={wanderer} hint={hint} />);
    expect(screen.queryByTestId('tour-source-hint')).toBeNull();
  });
});
