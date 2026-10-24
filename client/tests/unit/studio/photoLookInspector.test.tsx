import type { BookDocument, BookElement, BookPhotoElement } from '@trek/shared';
import { PHOTO_LOOK_STARTS, bookPageSetupSchema, bookPhotoElementSchema } from '@trek/shared';
import { beforeEach, describe, expect, it } from 'vitest';

import { StudioInspector } from '../../../src/components/Studio/StudioInspector';
import type { JourneySource } from '../../../src/components/Studio/StudioSidebar';
import { useStudioStore } from '../../../src/store/studioStore';
import { fireEvent, render, screen } from '../../helpers/render';

/**
 * The photo look through the inspector itself, written into the book the
 * store holds: the rows sit where the panel puts them and every one of them
 * is one undo step.
 */

const source: JourneySource = { entries: [], photos: [], photoEntries: {} };
const page = bookPageSetupSchema.parse({});

function load(over: Record<string, unknown> = {}) {
  const el = bookPhotoElementSchema.parse({
    id: 'p1',
    kind: 'photo',
    frame: { x: 20, y: 30, w: 60, h: 40 },
    photoId: 12,
    ...over,
  }) as BookElement;
  useStudioStore.getState().load({
    version: 1,
    title: 'T',
    page,
    spreads: [{ id: 'sp1', role: 'inner', background: null, elements: [el], parked: [], entryId: null }],
  } as BookDocument);
  useStudioStore.getState().select(['p1']);
}

const photo = () => useStudioStore.getState().doc?.spreads[0]?.elements[0] as BookPhotoElement;

function draw() {
  return render(
    <StudioInspector
      spreadIndex={0}
      page={page}
      stats={null}
      path={[]}
      source={source}
      setPageNumbers={() => {}}
      t={(k: string) => k}
      locale="en"
    />
  );
}

beforeEach(() => load());

describe('the photo look in the inspector', () => {
  it('FE-STUDIO-LOOKINSP-001: zooms and mirrors from the crop section', () => {
    draw();
    const zoom = screen.getByRole('slider', { name: /journey.studio.photo.zoom/ });
    fireEvent.change(zoom, { target: { value: '2' } });
    fireEvent.pointerUp(zoom);
    fireEvent.click(screen.getByRole('button', { name: /journey.studio.photo.flip/ }));
    expect(photo()).toMatchObject({ zoom: 2, flipX: true });
  });

  it('FE-STUDIO-LOOKINSP-002: puts a border on and takes it off again, leaving nothing behind', () => {
    draw();
    fireEvent.click(screen.getByRole('button', { name: 'journey.studio.photo.edges' }));
    fireEvent.click(screen.getByRole('button', { name: 'journey.studio.photo.border', pressed: false }));
    expect(photo().border).toEqual(PHOTO_LOOK_STARTS.border);
    fireEvent.click(screen.getByRole('button', { name: 'journey.studio.photo.border', pressed: true }));
    expect(JSON.parse(JSON.stringify(photo()))).not.toHaveProperty('border');
  });

  it('FE-STUDIO-LOOKINSP-003: each look change is one undo step', () => {
    draw();
    fireEvent.click(screen.getByRole('button', { name: 'journey.studio.photo.duotone', expanded: false }));
    fireEvent.click(screen.getByRole('button', { name: 'journey.studio.photo.duotone', pressed: false }));
    expect(photo().duotone).toEqual(PHOTO_LOOK_STARTS.duotone);
    useStudioStore.getState().undo();
    expect(photo().duotone).toBeUndefined();
  });
});
