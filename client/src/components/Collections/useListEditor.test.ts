// FE-COMP-LISTEDITORHOOK-001 to FE-COMP-LISTEDITORHOOK-011: the list create / edit logic
// behind both the desktop dialog and the phone sheet.
import { act, renderHook } from '@testing-library/react';
import type { Collection } from '@trek/shared';
import { afterEach, beforeEach, describe, expect, it, vi, type Mock, type MockInstance } from 'vitest';

import { resetAllStores } from '../../../tests/helpers/store';
import { tripsApi } from '../../api/client';
import { normalizeLinkUrl } from '../../pages/collections/collectionsModel';
import { useCollectionStore } from '../../store/collectionStore';
import { cleanListLinks, useListEditor, type ListEditorOptions } from './useListEditor';

const t = (k: string) => k;

const LIST = {
  id: 4,
  name: 'Tokyo',
  color: '#ec4899',
  description: 'Food spots',
  links: [{ label: 'Blog', url: 'https://a.example' }],
  cover_image: '/uploads/covers/tokyo.jpg',
  is_owner: true,
} as Collection;

type CollectionState = ReturnType<typeof useCollectionStore.getState>;
const initialCollectionState = useCollectionStore.getState();
let actions: {
  createCollection: Mock<CollectionState['createCollection']>;
  updateCollection: Mock<CollectionState['updateCollection']>;
  uploadCover: Mock<CollectionState['uploadCover']>;
};
let addToast: Mock<NonNullable<Window['__addToast']>>;
let searchCovers: MockInstance<typeof tripsApi.searchCoverImages>;

function setup(over: Partial<ListEditorOptions> = {}) {
  const props: ListEditorOptions = {
    target: 'new',
    onClose: vi.fn(),
    onCreated: vi.fn(),
    t,
    defaultColor: '#6366f1',
    normalizeLinkUrl,
    ...over,
  };
  const hook = renderHook((p: ListEditorOptions) => useListEditor(p), { initialProps: props });
  return { ...hook, props };
}

beforeEach(() => {
  resetAllStores();
  useCollectionStore.setState(initialCollectionState, true);
  actions = {
    createCollection: vi.fn<CollectionState['createCollection']>().mockResolvedValue({ ...LIST, id: 9 }),
    updateCollection: vi.fn<CollectionState['updateCollection']>().mockResolvedValue(undefined),
    uploadCover: vi.fn<CollectionState['uploadCover']>().mockResolvedValue(undefined),
  };
  useCollectionStore.setState(actions);
  addToast = vi.fn<NonNullable<Window['__addToast']>>();
  window.__addToast = addToast;
  searchCovers = vi.spyOn(tripsApi, 'searchCoverImages').mockResolvedValue({
    photos: [{ id: 'p1', url: 'https://img.example/full.jpg', thumb: 'https://img.example/t.jpg' }],
  });
  URL.createObjectURL = vi.fn(() => 'blob:cover');
  URL.revokeObjectURL = vi.fn();
});

const { createObjectURL, revokeObjectURL } = URL;

afterEach(() => {
  URL.createObjectURL = createObjectURL;
  URL.revokeObjectURL = revokeObjectURL;
  vi.restoreAllMocks();
  delete window.__addToast;
});

describe('cleanListLinks', () => {
  it('FE-COMP-LISTEDITORHOOK-001: trims labels, normalises urls and drops rows without one', () => {
    expect(
      cleanListLinks(
        [
          { label: '  Blog ', url: 'a.example' },
          { label: '', url: '  ' },
          { label: '  ', url: 'https://b.example' },
        ],
        normalizeLinkUrl
      )
    ).toEqual([
      { label: 'Blog', url: 'https://a.example' },
      { label: undefined, url: 'https://b.example' },
    ]);
  });
});

describe('useListEditor', () => {
  it('FE-COMP-LISTEDITORHOOK-002: a new list starts empty in the shell default colour', () => {
    const { result } = setup({ defaultColor: '#6366F1' });
    expect(result.current.editing).toBeNull();
    expect(result.current.name).toBe('');
    expect(result.current.color).toBe('#6366F1');
    expect(result.current.coverPreview).toBeNull();
  });

  it('FE-COMP-LISTEDITORHOOK-003: editing seeds the form from the list', () => {
    const { result } = setup({ target: LIST });
    expect(result.current.editing).toBe(LIST);
    expect(result.current.name).toBe('Tokyo');
    expect(result.current.color).toBe('#ec4899');
    expect(result.current.description).toBe('Food spots');
    expect(result.current.links).toEqual(LIST.links);
    expect(result.current.coverPreview).toBe('/uploads/covers/tokyo.jpg');
  });

  it('FE-COMP-LISTEDITORHOOK-004: only the sheet keeps editing the last list once the target clears', () => {
    const dialog = setup({ target: LIST });
    dialog.rerender({ ...dialog.props, target: null });
    expect(dialog.result.current.editing).toBeNull();

    const sheet = setup({ target: LIST, holdLastTarget: true });
    sheet.rerender({ ...sheet.props, target: null });
    expect(sheet.result.current.editing).toBe(LIST);
  });

  it('FE-COMP-LISTEDITORHOOK-005: creates the list with cleaned links, uploads the cover and hands the id over', async () => {
    const { result, props } = setup();
    const file = new File(['x'], 'c.png', { type: 'image/png' });
    act(() => {
      result.current.setName('  Rome ');
      result.current.setDescription('  ');
      result.current.setLinks([{ label: ' Map ', url: 'maps.example' }, { url: '' }]);
      result.current.pickCover(file);
    });
    expect(result.current.coverPreview).toBe('blob:cover');
    await act(async () => {
      await result.current.save();
    });
    expect(actions.createCollection).toHaveBeenCalledWith({
      name: 'Rome',
      color: '#6366f1',
      description: null,
      links: [{ label: 'Map', url: 'https://maps.example' }],
    });
    expect(actions.uploadCover).toHaveBeenCalledWith(9, file);
    expect(props.onCreated).toHaveBeenCalledWith(9);
    expect(props.onClose).toHaveBeenCalledTimes(1);
  });

  it('FE-COMP-LISTEDITORHOOK-006: editing patches the list with a picked Unsplash cover and hands nothing over', async () => {
    const { result, props } = setup({ target: LIST });
    act(() => result.current.pickUnsplash({ id: 'p', url: 'https://img.example/u.jpg', thumb: '' }));
    await act(async () => {
      await result.current.save();
    });
    expect(actions.updateCollection).toHaveBeenCalledWith(4, {
      name: 'Tokyo',
      color: '#ec4899',
      description: 'Food spots',
      links: [{ label: 'Blog', url: 'https://a.example' }],
      cover_image: 'https://img.example/u.jpg',
    });
    expect(actions.uploadCover).not.toHaveBeenCalled();
    expect(props.onCreated).not.toHaveBeenCalled();
  });

  it('FE-COMP-LISTEDITORHOOK-007: a blank name saves nothing', async () => {
    const { result } = setup();
    await act(async () => {
      await result.current.save();
    });
    expect(actions.createCollection).not.toHaveBeenCalled();
  });

  it('FE-COMP-LISTEDITORHOOK-008: a retry after a failed cover upload updates the list it already created', async () => {
    actions.uploadCover.mockRejectedValueOnce({ response: { data: { error: 'Too big' } } });
    const { result, props } = setup();
    act(() => {
      result.current.setName('Rome');
      result.current.pickCover(new File(['x'], 'c.png'));
    });
    await act(async () => {
      await result.current.save();
    });
    expect(addToast).toHaveBeenCalledWith('Too big', 'error', undefined);
    expect(props.onClose).not.toHaveBeenCalled();
    await act(async () => {
      await result.current.save();
    });
    expect(actions.createCollection).toHaveBeenCalledTimes(1);
    expect(actions.updateCollection).toHaveBeenCalledWith(9, expect.objectContaining({ name: 'Rome' }));
  });

  it('FE-COMP-LISTEDITORHOOK-009: closing hands over a list a failed cover upload left behind', async () => {
    actions.uploadCover.mockRejectedValueOnce(new Error('nope'));
    const { result, props } = setup();
    act(() => result.current.close());
    expect(props.onCreated).not.toHaveBeenCalled();
    act(() => {
      result.current.setName('Rome');
      result.current.pickCover(new File(['x'], 'c.png'));
    });
    await act(async () => {
      await result.current.save();
    });
    act(() => result.current.close());
    expect(props.onCreated).toHaveBeenCalledWith(9);
    expect(props.onClose).toHaveBeenCalledTimes(2);
  });

  it('FE-COMP-LISTEDITORHOOK-010: the cover search falls back to the name and keeps only the latest answer', async () => {
    const { result } = setup();
    await act(async () => {
      await result.current.searchCover();
    });
    expect(searchCovers).not.toHaveBeenCalled();
    act(() => result.current.setName('Rome'));
    await act(async () => {
      await result.current.searchCover();
    });
    expect(searchCovers).toHaveBeenCalledWith('Rome');
    expect(result.current.coverResults).toHaveLength(1);
    expect(result.current.searchingCover).toBe(false);

    searchCovers.mockRejectedValueOnce(new Error('down'));
    act(() => result.current.setCoverQuery(' beach '));
    await act(async () => {
      await result.current.searchCover();
    });
    expect(searchCovers).toHaveBeenLastCalledWith('beach');
    expect(result.current.coverResults).toEqual([]);
  });

  it('FE-COMP-LISTEDITORHOOK-011: an upload wins over a picked photo and revokes the old preview blob', () => {
    const { result, unmount } = setup();
    act(() => result.current.pickCover(new File(['x'], 'a.png')));
    act(() => result.current.pickUnsplash({ id: 'p', url: 'https://img.example/u.jpg', thumb: '' }));
    expect(URL.revokeObjectURL).toHaveBeenCalledWith('blob:cover');
    expect(result.current.coverPreview).toBe('https://img.example/u.jpg');
    act(() => result.current.pickCover(new File(['x'], 'b.png')));
    expect(result.current.coverPreview).toBe('blob:cover');
    act(() => result.current.setLink(0, { url: 'x' }));
    unmount();
    expect(URL.revokeObjectURL).toHaveBeenCalledTimes(2);
  });
});
