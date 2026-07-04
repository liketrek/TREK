// FE-COMP-COLDETAIL-001 to FE-COMP-COLDETAIL-010
import React from 'react';
import { render, screen } from '../../../tests/helpers/render';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { server } from '../../../tests/helpers/msw/server';
import { useAuthStore } from '../../store/authStore';
import { resetAllStores, seedStore } from '../../../tests/helpers/store';
import { buildUser } from '../../../tests/helpers/factories';
import type { CollectionPlace } from '@trek/shared';
import { useTranslation } from '../../i18n/TranslationContext';
import CollectionPlaceDetail from './CollectionPlaceDetail';

// The component takes `t` as a PROP (not from context), so wrap it in a tiny
// consumer that feeds it the real English `t` from the TranslationProvider the
// test render helper mounts. That way we can assert on visible English strings.
type DetailProps = React.ComponentProps<typeof CollectionPlaceDetail>;
function TranslatedDetail(props: Omit<DetailProps, 't'>): React.ReactElement {
  const { t } = useTranslation();
  return <CollectionPlaceDetail {...props} t={t} />;
}

// Place literal per spec: no image_url / lat / lng / provider id, so the cover
// stays a gradient and status is 'idea'.
const place: CollectionPlace = {
  id: 1,
  collection_id: 10,
  name: 'Test Cafe',
  status: 'idea',
  description: 'Nice spot',
  address: 'Somewhere',
  links: [{ url: 'https://x.com' }],
  category: { id: 1, name: 'Food', color: '#f00', icon: null },
};

function renderDetail(overrides: Partial<Omit<DetailProps, 't'>> = {}) {
  const props = {
    place,
    canEdit: true,
    canDelete: true,
    categories: [],
    labels: [],
    anchorRect: null,
    onClose: vi.fn(),
    onSetStatus: vi.fn(),
    onSave: vi.fn().mockResolvedValue(undefined),
    onCopyToTrip: vi.fn(),
    onRemove: vi.fn(),
    ...overrides,
  } as Omit<DetailProps, 't'>;
  render(<TranslatedDetail {...props} />);
  return props;
}

beforeEach(() => {
  resetAllStores();
  seedStore(useAuthStore, { user: buildUser(), placesPhotosEnabled: false });
  // The detail sheet asks the maps provider for a cover photo on mount when a
  // place carries no image of its own — stub it so nothing hits the network.
  server.use(
    http.get('/api/maps/place-photo/:id', () =>
      HttpResponse.json({ photoUrl: null, attribution: null }),
    ),
  );
});

describe('CollectionPlaceDetail', () => {
  it('FE-COMP-COLDETAIL-001: renders the place name, address and description', async () => {
    renderDetail();
    expect(await screen.findByRole('heading', { name: 'Test Cafe' })).toBeInTheDocument();
    expect(screen.getByText('Somewhere')).toBeInTheDocument();
    expect(screen.getByText('Nice spot')).toBeInTheDocument();
  });

  // ── Editor / admin (canEdit + canDelete) ────────────────────────────────────
  it('FE-COMP-COLDETAIL-002: shows Edit and Remove buttons when canEdit && canDelete', async () => {
    renderDetail({ canEdit: true, canDelete: true });
    expect(await screen.findByRole('button', { name: 'Edit' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Remove from list' })).toBeInTheDocument();
  });

  it('FE-COMP-COLDETAIL-003: clicking a status option calls onSetStatus when canEdit', async () => {
    const user = userEvent.setup();
    const props = renderDetail({ canEdit: true, canDelete: true });
    const visited = await screen.findByRole('button', { name: 'Visited' });
    await user.click(visited);
    expect(props.onSetStatus).toHaveBeenCalledTimes(1);
    expect(props.onSetStatus).toHaveBeenCalledWith('visited');
  });

  it('FE-COMP-COLDETAIL-004: current status option is pressed, others are not', async () => {
    renderDetail({ canEdit: true, canDelete: true });
    expect(await screen.findByRole('button', { name: 'Idea' })).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByRole('button', { name: 'Want to go' })).toHaveAttribute('aria-pressed', 'false');
  });

  it('FE-COMP-COLDETAIL-005: entering edit mode reveals name input + Save', async () => {
    const user = userEvent.setup();
    renderDetail({ canEdit: true });
    await user.click(await screen.findByRole('button', { name: 'Edit' }));
    expect(screen.getByDisplayValue('Test Cafe')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Save/i })).toBeInTheDocument();
  });

  // ── Viewer (no edit / no delete) ────────────────────────────────────────────
  it('FE-COMP-COLDETAIL-006: hides Edit and Remove buttons when canEdit=false && canDelete=false', async () => {
    renderDetail({ canEdit: false, canDelete: false });
    // Wait for the async photo effect to settle before asserting absence.
    expect(await screen.findByRole('button', { name: 'Copy to trip' })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Edit' })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Remove from list' })).not.toBeInTheDocument();
  });

  it('FE-COMP-COLDETAIL-007: clicking a status option does NOT call onSetStatus when canEdit=false', async () => {
    const user = userEvent.setup();
    const props = renderDetail({ canEdit: false, canDelete: false });
    const visited = await screen.findByRole('button', { name: 'Visited' });
    await user.click(visited);
    expect(props.onSetStatus).not.toHaveBeenCalled();
  });

  it('FE-COMP-COLDETAIL-008: status segment still renders (read-only) for viewers', async () => {
    renderDetail({ canEdit: false, canDelete: false });
    expect(await screen.findByRole('button', { name: 'Idea' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Visited' })).toBeInTheDocument();
  });

  // ── Copy-to-trip is available in read mode regardless of permissions ─────────
  it('FE-COMP-COLDETAIL-009: Copy to trip button fires onCopyToTrip (editor)', async () => {
    const user = userEvent.setup();
    const props = renderDetail({ canEdit: true, canDelete: true });
    await user.click(await screen.findByRole('button', { name: 'Copy to trip' }));
    expect(props.onCopyToTrip).toHaveBeenCalledTimes(1);
  });

  it('FE-COMP-COLDETAIL-010: Copy to trip button fires onCopyToTrip (viewer)', async () => {
    const user = userEvent.setup();
    const props = renderDetail({ canEdit: false, canDelete: false });
    await user.click(await screen.findByRole('button', { name: 'Copy to trip' }));
    expect(props.onCopyToTrip).toHaveBeenCalledTimes(1);
  });
});
