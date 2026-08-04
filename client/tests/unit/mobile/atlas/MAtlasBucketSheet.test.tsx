import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '../../../helpers/render';
import { buildAtlasController, buildBucketItem } from '../../../helpers/atlas';
import MAtlasBucketSheet from '../../../../src/mobile/screens/atlas/MAtlasBucketSheet';

// FE-MOB-ATLASBUCK-001 to FE-MOB-ATLASBUCK-021

function renderSheet(over: Record<string, unknown> = {}, props: { open?: boolean; onClose?: () => void } = {}) {
  const atlas = buildAtlasController(over);
  const onClose = props.onClose ?? vi.fn(() => undefined);
  render(<MAtlasBucketSheet atlas={atlas} open={props.open ?? true} onClose={onClose} />);
  return { atlas, onClose };
}

const emptyForm = { name: '', notes: '', lat: '', lng: '', target_date: '' };

describe('MAtlasBucketSheet', () => {
  it('FE-MOB-ATLASBUCK-001: stays unmounted while closed', () => {
    renderSheet({}, { open: false });
    expect(screen.queryByText('atlas.bucketTab')).not.toBeInTheDocument();
  });

  it('FE-MOB-ATLASBUCK-002: an empty list shows the empty state and no counter', () => {
    renderSheet({ bucketList: [] });

    expect(screen.getByText('atlas.bucketEmpty')).toBeInTheDocument();
    expect(screen.getByText('atlas.bucketEmptyHint')).toBeInTheDocument();
  });

  it('FE-MOB-ATLASBUCK-003: items render with country, target month, coordinates and notes', () => {
    renderSheet({
      bucketList: [
        buildBucketItem({ id: 1, name: 'Kyoto', country_code: 'JP', target_date: '2027-04', lat: 35.01, lng: 135.77, notes: 'cherry blossom' }),
      ],
    });

    expect(screen.getByText('Kyoto')).toBeInTheDocument();
    expect(screen.getByText('Japan · Apr 2027 · 35.01, 135.77 · cherry blossom')).toBeInTheDocument();
    expect(screen.getByText('1')).toBeInTheDocument();
  });

  it('FE-MOB-ATLASBUCK-004: an alpha-3 country code is resolved back to its flag and name', () => {
    renderSheet({ bucketList: [buildBucketItem({ id: 2, name: 'Porto', country_code: 'PRT' })] });

    const flag = document.querySelector('img') as HTMLImageElement | null;
    expect(flag?.src).toContain('flagcdn.com/w40/pt.png');
    expect(screen.getByText('Portugal')).toBeInTheDocument();
  });

  it('FE-MOB-ATLASBUCK-005: an item without a country shows the star placeholder and only its name', () => {
    renderSheet({ bucketList: [buildBucketItem({ id: 3, name: 'Northern lights', country_code: null })] });

    expect(document.querySelector('img')).toBeNull();
    expect(screen.getByText('Northern lights')).toBeInTheDocument();
  });

  it('FE-MOB-ATLASBUCK-006: a year-only target date renders unchanged', () => {
    renderSheet({ bucketList: [buildBucketItem({ id: 4, name: 'Patagonia', country_code: null, target_date: '2030' })] });
    expect(screen.getByText('2030')).toBeInTheDocument();
  });

  it('FE-MOB-ATLASBUCK-007: the trash button deletes the item by id', () => {
    const { atlas } = renderSheet({ bucketList: [buildBucketItem({ id: 9, name: 'Kyoto' })] });

    fireEvent.click(screen.getByRole('button', { name: 'atlas.unmark' }));

    expect(atlas.handleDeleteBucketItem).toHaveBeenCalledWith(9);
  });

  it('FE-MOB-ATLASBUCK-008: the add button opens the form', () => {
    const { atlas } = renderSheet({ showBucketAdd: false });

    fireEvent.click(screen.getByText('atlas.addPoi'));

    expect(atlas.setShowBucketAdd).toHaveBeenCalledWith(true);
  });

  it('FE-MOB-ATLASBUCK-009: typing without a picked place feeds the POI search field', () => {
    const { atlas } = renderSheet({ showBucketAdd: true });

    fireEvent.change(screen.getByPlaceholderText('atlas.bucketNamePlaceholder'), { target: { value: 'Kyo' } });

    expect(atlas.setBucketSearch).toHaveBeenCalledWith('Kyo');
    expect(atlas.setBucketForm).not.toHaveBeenCalled();
  });

  it('FE-MOB-ATLASBUCK-010: typing after a place was picked edits the name instead', () => {
    const { atlas } = renderSheet({ showBucketAdd: true, bucketForm: { ...emptyForm, name: 'Kyoto' } });

    fireEvent.change(screen.getByPlaceholderText('atlas.bucketNamePlaceholder'), { target: { value: 'Kyoto old town' } });

    expect(atlas.setBucketForm).toHaveBeenCalledWith({ ...emptyForm, name: 'Kyoto old town' });
  });

  it('FE-MOB-ATLASBUCK-011: Enter searches while the name is empty and adds once it is set', () => {
    const search = renderSheet({ showBucketAdd: true });
    fireEvent.keyDown(screen.getByPlaceholderText('atlas.bucketNamePlaceholder'), { key: 'Enter' });
    expect(search.atlas.handleBucketPoiSearch).toHaveBeenCalled();
    expect(search.atlas.handleAddBucketItem).not.toHaveBeenCalled();

    fireEvent.keyDown(screen.getByPlaceholderText('atlas.bucketNamePlaceholder'), { key: 'a' });
    expect(search.atlas.handleBucketPoiSearch).toHaveBeenCalledTimes(1);
  });

  it('FE-MOB-ATLASBUCK-012: the search button is disabled while a lookup is running', () => {
    const { atlas } = renderSheet({ showBucketAdd: true, bucketSearching: true });

    const searchBtn = screen.getByRole('button', { name: 'common.search' });
    expect(searchBtn).toBeDisabled();

    fireEvent.click(searchBtn);
    expect(atlas.handleBucketPoiSearch).not.toHaveBeenCalled();
  });

  it('FE-MOB-ATLASBUCK-013: picking a search result keeps notes and target month but fills name and coordinates', () => {
    const { atlas } = renderSheet({
      showBucketAdd: true,
      bucketForm: { name: '', notes: 'onsen', lat: '', lng: '', target_date: '2027-04' },
      bucketSearch: 'kyo',
      bucketSearchResults: [{ name: 'Kyoto', lat: 35.0116, lng: 135.7681, address: 'Japan' }],
    });

    expect(screen.getByText('Japan')).toBeInTheDocument();
    fireEvent.click(screen.getByText('Kyoto'));

    expect(atlas.setBucketForm).toHaveBeenCalledWith({
      name: 'Kyoto', notes: 'onsen', lat: '35.0116', lng: '135.7681', target_date: '2027-04',
    });
    expect(atlas.setBucketSearchResults).toHaveBeenCalledWith([]);
    expect(atlas.setBucketSearch).toHaveBeenCalledWith('');
  });

  it('FE-MOB-ATLASBUCK-014: a result without a name falls back to the typed query', () => {
    const { atlas } = renderSheet({
      showBucketAdd: true,
      bucketSearch: 'somewhere',
      bucketSearchResults: [{ address: 'Nowhere' }],
    });

    fireEvent.click(screen.getByText('Nowhere'));

    expect(atlas.setBucketForm).toHaveBeenCalledWith({ ...emptyForm, name: 'somewhere', lat: '', lng: '' });
  });

  it('FE-MOB-ATLASBUCK-015: the clear button drops the picked place but keeps the form open', () => {
    const { atlas } = renderSheet({
      showBucketAdd: true,
      bucketForm: { name: 'Kyoto', notes: 'onsen', lat: '35.01', lng: '135.77', target_date: '' },
    });

    expect(screen.getByText('35.0100, 135.7700')).toBeInTheDocument();
    // The clear icon button sits in the name row, ahead of the form's cancel button.
    fireEvent.click(screen.getAllByRole('button', { name: 'common.cancel' })[0]);

    expect(atlas.setBucketForm).toHaveBeenCalledWith({ name: '', notes: 'onsen', lat: '', lng: '', target_date: '' });
    expect(atlas.setShowBucketAdd).not.toHaveBeenCalled();
  });

  it('FE-MOB-ATLASBUCK-016: notes feed the form and Add stays disabled until a name exists', () => {
    const { atlas } = renderSheet({ showBucketAdd: true });

    fireEvent.change(screen.getByPlaceholderText('atlas.bucketNotesPlaceholder'), { target: { value: 'diving' } });
    expect(atlas.setBucketForm).toHaveBeenCalledWith({ ...emptyForm, notes: 'diving' });

    expect(screen.getByText('common.add')).toBeDisabled();
  });

  it('FE-MOB-ATLASBUCK-017: cancelling the form resets name, search and results', () => {
    const { atlas } = renderSheet({
      showBucketAdd: true,
      bucketForm: { name: 'Kyoto', notes: 'onsen', lat: '', lng: '', target_date: '2027-04' },
    });

    fireEvent.click(screen.getByText('common.cancel'));

    expect(atlas.setShowBucketAdd).toHaveBeenCalledWith(false);
    expect(atlas.setBucketForm).toHaveBeenCalledWith(emptyForm);
    expect(atlas.setBucketSearch).toHaveBeenCalledWith('');
    expect(atlas.setBucketSearchResults).toHaveBeenCalledWith([]);
  });

  it('FE-MOB-ATLASBUCK-018: closing the sheet resets the form as well', () => {
    const onClose = vi.fn(() => undefined);
    const { atlas } = renderSheet({ showBucketAdd: true }, { onClose });

    fireEvent.click(screen.getByRole('button', { name: 'common.close' }));

    expect(atlas.setShowBucketAdd).toHaveBeenCalledWith(false);
    expect(onClose).toHaveBeenCalled();
  });

  describe('month/year picker', () => {
    it('FE-MOB-ATLASBUCK-019: opens on the current year and writes the picked month back', () => {
      const { atlas } = renderSheet({ showBucketAdd: true });
      const year = new Date().getFullYear();

      fireEvent.click(screen.getByText('atlas.bucketWhen'));
      expect(screen.getByText(String(year))).toBeInTheDocument();

      fireEvent.click(screen.getByText('Mar'));

      expect(atlas.setBucketForm).toHaveBeenCalledWith({ ...emptyForm, target_date: `${year}-03` });
      expect(screen.queryByText('Mar')).not.toBeInTheDocument();
    });

    it('FE-MOB-ATLASBUCK-020: the year steppers move the grid a year at a time', () => {
      renderSheet({ showBucketAdd: true, bucketForm: { ...emptyForm, target_date: '2027-04' } });

      expect(screen.getByText('April 2027')).toBeInTheDocument();
      fireEvent.click(screen.getByText('April 2027'));

      fireEvent.click(screen.getByRole('button', { name: 'mobileVacay.prevYear' }));
      expect(screen.getByText('2026')).toBeInTheDocument();

      fireEvent.click(screen.getByRole('button', { name: 'mobileVacay.nextYear' }));
      fireEvent.click(screen.getByRole('button', { name: 'mobileVacay.nextYear' }));
      expect(screen.getByText('2028')).toBeInTheDocument();
    });

    it('FE-MOB-ATLASBUCK-021: reset clears an already chosen target month', () => {
      const { atlas } = renderSheet({ showBucketAdd: true, bucketForm: { ...emptyForm, target_date: '2027-04' } });

      fireEvent.click(screen.getByText('April 2027'));
      fireEvent.click(screen.getByText('common.reset'));

      expect(atlas.setBucketForm).toHaveBeenCalledWith({ ...emptyForm, target_date: '' });
    });
  });
});
