// FE-PLANNER-PLFORMMEDIA-001 to FE-PLANNER-PLFORMMEDIA-003: the files waiting for a new
// place, and the place's picture in the form where no details column stands beside it.
import { fireEvent, render, screen } from '@testing-library/react';
import { createRef } from 'react';
import { describe, expect, it, vi } from 'vitest';

import { PendingFiles, PlaceImageSection } from './PlaceFormMedia';
import type { PlaceImageOwn } from './PlaceImagePicker';

vi.mock('../../api/authUrl', () => ({ fetchImageAsBlob: vi.fn(async () => 'blob:x') }));

const t = ((key: string) => key) as never;

describe('PendingFiles', () => {
  it('FE-PLANNER-PLFORMMEDIA-001: the attach button opens the input, which adds the files', () => {
    const fileRef = createRef<HTMLInputElement>();
    const onAdd = vi.fn();
    render(<PendingFiles files={[]} fileRef={fileRef} onAdd={onAdd} onRemove={vi.fn()} t={t} />);
    expect(screen.queryByTestId('pending-files')).not.toBeInTheDocument();

    const openPicker = vi.spyOn(fileRef.current as HTMLInputElement, 'click');
    fireEvent.click(screen.getByRole('button', { name: 'files.attach' }));
    expect(openPicker).toHaveBeenCalledTimes(1);
    fireEvent.change(fileRef.current as HTMLInputElement, { target: { files: [new File(['x'], 'a.pdf')] } });
    expect(onAdd).toHaveBeenCalledTimes(1);
  });

  it('FE-PLANNER-PLFORMMEDIA-002: each waiting file is listed by name and removed by its index', () => {
    const onRemove = vi.fn();
    render(
      <PendingFiles
        files={[new File(['x'], 'ticket.pdf'), new File(['y'], 'map.png')]}
        fileRef={createRef<HTMLInputElement>()}
        onAdd={vi.fn()}
        onRemove={onRemove}
        t={t}
      />
    );
    expect(screen.getByTestId('pending-files')).toHaveTextContent('ticket.pdf');
    expect(screen.getByText('map.png')).toBeInTheDocument();
    fireEvent.click(screen.getAllByRole('button', { name: 'common.delete' })[1]);
    expect(onRemove).toHaveBeenCalledWith(1);
  });
});

describe('PlaceImageSection', () => {
  it("FE-PLANNER-PLFORMMEDIA-003: the picker sits under the field's label with the place's own pictures", () => {
    const own: PlaceImageOwn = {
      currentUrl: '/uploads/places/c.jpg',
      attached: [],
      pendingPreview: null,
      canUpload: true,
      onUpload: vi.fn(),
      onPickAttached: vi.fn(),
      onRemove: vi.fn(),
    };
    const onPickUrl = vi.fn();
    render(<PlaceImageSection image={{ own, chosen: { kind: 'none' } }} onPickUrl={onPickUrl} t={t} />);

    expect(screen.getByText('places.details.pickImage')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'places.uploadImage' })).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'places.image.current' }));
    expect(onPickUrl).toHaveBeenCalledWith('/uploads/places/c.jpg');
  });
});
