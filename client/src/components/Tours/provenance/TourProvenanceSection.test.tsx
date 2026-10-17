import { fireEvent, render, screen } from '@testing-library/react';
import type { TourProvenance, TourSourceCheckResponse } from '@trek/shared';
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
});
