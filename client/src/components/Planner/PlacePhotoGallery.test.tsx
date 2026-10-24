// FE-PLANNER-PHOTOGALLERY-001 to FE-PLANNER-PHOTOGALLERY-003: the place's picture as the
// way into its photos, on the desktop inspector and the phone sheet alike.
import { act, fireEvent, render, screen, within } from '@testing-library/react';
import type { MapsPlaceEnrichmentResult } from '@trek/shared';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { buildPlace } from '../../../tests/helpers/factories';
import { resetAllStores, seedStore } from '../../../tests/helpers/store';
import { useAuthStore } from '../../store/authStore';
import PlacePhotoGallery from './PlacePhotoGallery';
import { __clearEnrichmentCacheForTests } from './placeEnrichment';

const placeEnrichment = vi.fn();
// Partial: the store registry behind resetAllStores needs the real default client.
vi.mock('../../api/client', async (importOriginal) => ({
  ...(await importOriginal<typeof import('../../api/client')>()),
  mapsApi: { placeEnrichment: (...a: unknown[]) => placeEnrichment(...a) },
}));
vi.mock('../Journey/VideoPlayerLazy', () => ({ default: () => null }));

const PLACE = buildPlace({ id: 3, name: 'Tower', lat: 48.85, lng: 2.29, image_url: '/uploads/places/tower.jpg' });

beforeEach(() => {
  resetAllStores();
  seedStore(useAuthStore, { placesEnrichEnabled: true });
  placeEnrichment.mockReset();
  sessionStorage.clear();
  __clearEnrichmentCacheForTests();
});

describe('PlacePhotoGallery', () => {
  it('FE-PLANNER-PHOTOGALLERY-001: with nothing to open the picture stays a plain picture', () => {
    seedStore(useAuthStore, { placesEnrichEnabled: false });
    render(
      <PlacePhotoGallery place={{ ...PLACE, image_url: null }} language="en" label="Show photos">
        <span data-testid="avatar" />
      </PlacePhotoGallery>
    );
    expect(screen.getByTestId('avatar')).toBeInTheDocument();
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
  });

  it('FE-PLANNER-PHOTOGALLERY-002: the trigger is a labelled button that says it is busy while the sources answer', async () => {
    let settle: (v: MapsPlaceEnrichmentResult) => void = () => {};
    placeEnrichment.mockReturnValue(new Promise<MapsPlaceEnrichmentResult>((r) => (settle = r)));
    render(
      <PlacePhotoGallery
        place={{ ...PLACE, image_url: null }}
        language="en"
        label="Show photos"
        className="rounded-full"
      >
        <span data-testid="avatar" />
      </PlacePhotoGallery>
    );
    const trigger = screen.getByRole('button', { name: 'Show photos' });
    expect(trigger).toHaveClass('rounded-full');
    expect(trigger).toContainElement(screen.getByTestId('avatar'));
    expect(trigger).toHaveAttribute('aria-busy', 'false');

    fireEvent.click(trigger);
    expect(trigger).toHaveAttribute('aria-busy', 'true');
    expect(trigger).toHaveClass('opacity-70');

    await act(async () =>
      settle({
        photos: [
          {
            key: 'k0',
            url: '/api/maps/place-photo/k0/bytes',
            attribution: 'Alice',
            license: null,
            licenseUrl: null,
            sourceUrl: null,
            source: 'wikimedia',
          },
        ],
        facts: [],
        description: null,
      } as unknown as MapsPlaceEnrichmentResult)
    );
    expect(trigger).toHaveAttribute('aria-busy', 'false');
    const gallery = screen.getByRole('dialog', { name: 'Show photos' });
    expect(within(gallery).getByRole('img', { name: 'Alice' })).toHaveAttribute(
      'src',
      '/api/maps/place-photo/k0/bytes'
    );
  });

  it('FE-PLANNER-PHOTOGALLERY-003: the gallery opens on the body, over everything, and closes again', () => {
    seedStore(useAuthStore, { placesEnrichEnabled: false });
    const { container } = render(
      <PlacePhotoGallery place={PLACE} language="en" label="Show photos">
        <span data-testid="avatar" />
      </PlacePhotoGallery>
    );
    fireEvent.click(screen.getByRole('button', { name: 'Show photos' }));
    const gallery = screen.getByRole('dialog', { name: 'Show photos' });
    expect(gallery.parentElement).toBe(document.body);
    expect(container).not.toContainElement(gallery);
    expect(gallery.querySelector('img')).toHaveAttribute('src', '/uploads/places/tower.jpg');

    fireEvent.keyDown(window, { key: 'Escape' });
    expect(screen.queryByRole('dialog', { name: 'Show photos' })).not.toBeInTheDocument();
  });
});
