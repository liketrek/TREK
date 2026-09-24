// FE-COMP-COLLIMPORT-001 to FE-COMP-COLLIMPORT-026
import { render, screen, waitFor } from '../../../tests/helpers/render';
import userEvent from '@testing-library/user-event';
import type { Collection, CollectionFile } from '@trek/shared';
import { useTranslation } from '../../i18n/TranslationContext';
import ImportCollectionModal from './ImportCollectionModal';
import type { GpxReader } from './collectionFile';

// The modal takes `t` as a prop, so this harness forwards the real English
// translator and the assertions read as the strings a person sees.
function Harness(props: Omit<React.ComponentProps<typeof ImportCollectionModal>, 't'>) {
  const { t } = useTranslation();
  return <ImportCollectionModal {...props} t={t} />;
}

const listFile: CollectionFile = {
  format: 'trek.collection', version: 1, name: 'Lisbon',
  description: 'Worth it if you have three days',
  color: '#ef4444',
  labels: [{ name: 'Must see', color: '#ff0000' }, { name: 'Rainy day', color: '#00ff00' }],
  places: [{ name: 'Time Out Market' }, { name: 'Miradouro' }, { name: 'Pastéis de Belém' }],
} as CollectionFile;

function renderModal(overrides: Partial<React.ComponentProps<typeof ImportCollectionModal>> = {}) {
  const props = {
    onImport: vi.fn().mockResolvedValue(undefined),
    onReadGpx: vi.fn().mockRejectedValue(new Error('no GPX expected here')),
    onClose: vi.fn(),
    ...overrides,
  };
  render(<Harness {...props} />);
  return props;
}

/** Put a file into the hidden input the way a file picker would. */
async function choose(content: string, name = 'list.trekcollection.json') {
  const input = document.querySelector('input[type="file"]') as HTMLInputElement;
  const file = new File([content], name, { type: name.endsWith('.gpx') ? 'application/gpx+xml' : 'application/json' });
  // jsdom's File has no usable text(); the component awaits it.
  Object.defineProperty(file, 'text', { value: () => Promise.resolve(content) });
  await userEvent.upload(input, file);
}

const importButton = () => screen.getByRole('button', { name: 'Import' });

describe('ImportCollectionModal (#2198)', () => {
  it('FE-COMP-COLLIMPORT-001: opens asking for a file, with Import not yet possible', () => {
    renderModal();
    expect(screen.getByText('Choose a list file')).toBeInTheDocument();
    expect(importButton()).toBeDisabled();
  });

  it('FE-COMP-COLLIMPORT-002: shows what the file holds before anything is imported', async () => {
    const props = renderModal();
    await choose(JSON.stringify(listFile));

    await waitFor(() => expect(screen.getByText('Worth it if you have three days')).toBeInTheDocument());
    expect(screen.getByText('3 places')).toBeInTheDocument();
    expect(screen.getByText('2 labels')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Lisbon')).toBeInTheDocument();
    expect(importButton()).toBeEnabled();
    expect(props.onImport).not.toHaveBeenCalled();
  });

  it('FE-COMP-COLLIMPORT-003: leaves the label count out when the file has none', async () => {
    renderModal();
    await choose(JSON.stringify({ ...listFile, labels: [] }));
    await waitFor(() => expect(screen.getByText('3 places')).toBeInTheDocument());
    expect(screen.queryByText(/labels$/)).toBeNull();
  });

  it('FE-COMP-COLLIMPORT-004: imports the file under its own name', async () => {
    const props = renderModal();
    await choose(JSON.stringify(listFile));
    await waitFor(() => expect(importButton()).toBeEnabled());

    await userEvent.click(importButton());

    await waitFor(() => expect(props.onImport).toHaveBeenCalledTimes(1));
    // No name argument: the file's own name was kept.
    expect(props.onImport).toHaveBeenCalledWith(expect.objectContaining({ name: 'Lisbon' }), undefined);
  });

  it('FE-COMP-COLLIMPORT-005: imports under a name the person typed instead', async () => {
    const props = renderModal();
    await choose(JSON.stringify(listFile));
    await waitFor(() => expect(screen.getByDisplayValue('Lisbon')).toBeInTheDocument());

    await userEvent.clear(screen.getByDisplayValue('Lisbon'));
    await userEvent.type(screen.getByRole('textbox'), 'Lisbon (from Ana)');
    await userEvent.click(importButton());

    await waitFor(() => expect(props.onImport).toHaveBeenCalledWith(expect.anything(), 'Lisbon (from Ana)'));
  });

  it('FE-COMP-COLLIMPORT-006: will not import under an empty name', async () => {
    renderModal();
    await choose(JSON.stringify(listFile));
    await waitFor(() => expect(screen.getByDisplayValue('Lisbon')).toBeInTheDocument());

    await userEvent.clear(screen.getByRole('textbox'));

    expect(importButton()).toBeDisabled();
  });

  it('FE-COMP-COLLIMPORT-007: says what is wrong with a file it cannot use', async () => {
    renderModal();

    await choose('not json');
    await waitFor(() => expect(screen.getByText('That file could not be read.')).toBeInTheDocument());

    await choose(JSON.stringify({ format: 'something.else' }));
    await waitFor(() => expect(screen.getByText('That is not a TREK list file.')).toBeInTheDocument());
  });

  it('FE-COMP-COLLIMPORT-008: takes a good file after a bad one, and forgets the complaint', async () => {
    renderModal();
    await choose('not json');
    await waitFor(() => expect(screen.getByText('That file could not be read.')).toBeInTheDocument());

    await choose(JSON.stringify(listFile));

    await waitFor(() => expect(screen.getByDisplayValue('Lisbon')).toBeInTheDocument());
    expect(screen.queryByText('That file could not be read.')).toBeNull();
  });

  it('FE-COMP-COLLIMPORT-009: keeps the dialog open and says why when the import fails', async () => {
    const props = renderModal({ onImport: vi.fn().mockRejectedValue(new Error('the server said no')) });
    await choose(JSON.stringify(listFile));
    await waitFor(() => expect(importButton()).toBeEnabled());

    await userEvent.click(importButton());

    await waitFor(() => expect(screen.getByText('the server said no')).toBeInTheDocument());
    expect(screen.getByDisplayValue('Lisbon')).toBeInTheDocument();
    expect(props.onClose).not.toHaveBeenCalled();
  });

  it('FE-COMP-COLLIMPORT-010: closes without importing on Cancel', async () => {
    const props = renderModal();
    await userEvent.click(screen.getByRole('button', { name: 'Cancel' }));
    expect(props.onClose).toHaveBeenCalledTimes(1);
    expect(props.onImport).not.toHaveBeenCalled();
  });
});

describe('ImportCollectionModal with a GPX (#2301)', () => {
  const gpx = '<?xml version="1.0"?><gpx version="1.1"><wpt lat="1" lon="2"><name>Pena Palace</name></wpt></gpx>';
  const gpxFile: CollectionFile = {
    format: 'trek.collection', version: 1, name: 'Sintra loop',
    places: [{ name: 'Pena Palace' }, { name: 'Moorish Castle' }],
  } as CollectionFile;
  const refusal = (code: string) => Object.assign(new Error('Request failed'), { response: { status: 400, data: { error: 'no', code } } });

  it('FE-COMP-COLLIMPORT-011: says which files it takes', () => {
    renderModal();
    expect(screen.getByText('.trekcollection.json · .gpx')).toBeInTheDocument();
    const input = document.querySelector('input[type="file"]') as HTMLInputElement;
    expect(input.accept).toContain('.gpx');
  });

  it('FE-COMP-COLLIMPORT-012: shows what a GPX holds, and what of it will not become a place', async () => {
    const onReadGpx = vi.fn().mockResolvedValue({ file: gpxFile, skipped: 2, track_points: 8 });
    const props = renderModal({ onReadGpx });

    await choose(gpx, 'sintra.gpx');

    await waitFor(() => expect(screen.getByDisplayValue('Sintra loop')).toBeInTheDocument());
    expect(onReadGpx).toHaveBeenCalledWith(gpx, 'sintra.gpx');
    expect(screen.getByText('2 places')).toBeInTheDocument();
    expect(screen.getByText('2 waypoints without usable coordinates are left out.')).toBeInTheDocument();
    expect(screen.getByText('This file also has 8 track points. Tracks are not imported, only waypoints.')).toBeInTheDocument();
    // The note about ratings and members is about TREK files; a GPX never had any.
    expect(screen.queryByText(/Ratings, members/)).toBeNull();

    await userEvent.click(importButton());
    await waitFor(() => expect(props.onImport).toHaveBeenCalledWith(gpxFile, undefined));
  });

  it('FE-COMP-COLLIMPORT-013: imports a GPX under a name the person typed', async () => {
    const props = renderModal({ onReadGpx: vi.fn().mockResolvedValue({ file: gpxFile, skipped: 0, track_points: 0 }) });
    await choose(gpx, 'sintra.gpx');
    await waitFor(() => expect(screen.getByDisplayValue('Sintra loop')).toBeInTheDocument());

    await userEvent.clear(screen.getByRole('textbox'));
    await userEvent.type(screen.getByRole('textbox'), 'Sintra with the kids');
    await userEvent.click(importButton());

    await waitFor(() => expect(props.onImport).toHaveBeenCalledWith(gpxFile, 'Sintra with the kids'));
    expect(screen.queryByText(/track points/)).toBeNull();
  });

  it('FE-COMP-COLLIMPORT-014: will not make an empty list of a GPX that only has a track', async () => {
    const trackOnly = { ...gpxFile, places: [] };
    renderModal({ onReadGpx: vi.fn().mockResolvedValue({ file: trackOnly, skipped: 0, track_points: 120 }) });

    await choose(gpx, 'track.gpx');

    await waitFor(() => expect(screen.getByText('This GPX file has no waypoints, so there is nothing to import.')).toBeInTheDocument());
    expect(screen.getByText('This file also has 120 track points. Tracks are not imported, only waypoints.')).toBeInTheDocument();
    expect(importButton()).toBeDisabled();
  });

  it('FE-COMP-COLLIMPORT-015: says in its own words why a GPX was refused', async () => {
    const onReadGpx = vi.fn()
      .mockRejectedValueOnce(refusal('not-gpx'))
      .mockRejectedValueOnce(refusal('too-many-places'))
      .mockRejectedValueOnce(refusal('unreadable'));
    renderModal({ onReadGpx });

    await choose(gpx, 'a.gpx');
    await waitFor(() => expect(screen.getByText('That is not a GPX file.')).toBeInTheDocument());
    await choose(gpx, 'b.gpx');
    await waitFor(() => expect(screen.getByText(
      'That file has more than 1000 places. Split it and import the parts one at a time.',
    )).toBeInTheDocument());
    await choose(gpx, 'c.gpx');
    await waitFor(() => expect(screen.getByText('That file could not be read.')).toBeInTheDocument());
    expect(importButton()).toBeDisabled();
  });

  it('FE-COMP-COLLIMPORT-016: says it is reading while the server reads, and why it could not', async () => {
    let fail: ((err: unknown) => void) | null = null;
    const onReadGpx = vi.fn<GpxReader>(() => new Promise((_, reject) => { fail = reject; }));
    renderModal({ onReadGpx });

    await choose(gpx, 'slow.gpx');
    await waitFor(() => expect(screen.getByText('Reading the file…')).toBeInTheDocument());

    fail!(Object.assign(new Error('x'), { response: { status: 503, data: { error: 'The server is busy' } } }));

    await waitFor(() => expect(screen.getByText('The server is busy')).toBeInTheDocument());
    expect(screen.getByText('Choose a list file')).toBeInTheDocument();
  });
});

// ── The same file into a list that is already there (#2301 follow-up) ────────

describe('ImportCollectionModal into an existing list', () => {
  const lists = [
    { id: 7, owner_id: 1, name: 'Lisbon 2027', color: '#22c55e', place_count: 4 },
    { id: 9, owner_id: 1, name: 'Porto', color: '#3b82f6', place_count: 2 },
  ] as Collection[];

  const intoProps = (over: Partial<React.ComponentProps<typeof ImportCollectionModal>> = {}) =>
    renderModal({ onImportInto: vi.fn().mockResolvedValue(undefined), lists, ...over });

  it('FE-COMP-COLLIMPORT-020: offers the choice only once a file has been read', async () => {
    intoProps();
    expect(screen.queryByText('Add to a list')).not.toBeInTheDocument();

    await choose(JSON.stringify(listFile));

    await waitFor(() => expect(screen.getByText('Add to a list')).toBeInTheDocument());
    expect(screen.getByText('New list')).toBeInTheDocument();
    // A new list stays the default, so nothing changes for anyone who ignores it.
    expect(screen.getByDisplayValue('Lisbon')).toBeInTheDocument();
    expect(importButton()).toBeEnabled();
  });

  it('FE-COMP-COLLIMPORT-021: keeps to a new list when there is nothing to add to', async () => {
    renderModal({ onImportInto: vi.fn(), lists: [] });
    await choose(JSON.stringify(listFile));
    await waitFor(() => expect(screen.getByDisplayValue('Lisbon')).toBeInTheDocument());

    expect(screen.queryByText('Add to a list')).not.toBeInTheDocument();
  });

  it('FE-COMP-COLLIMPORT-022: adds the file to the list that was picked, and asks for no name', async () => {
    const props = intoProps();
    await choose(JSON.stringify(listFile));
    await waitFor(() => expect(screen.getByText('Add to a list')).toBeInTheDocument());

    await userEvent.click(screen.getByText('Add to a list'));
    expect(screen.queryByDisplayValue('Lisbon')).not.toBeInTheDocument();
    await userEvent.click(screen.getByText('Porto'));
    await userEvent.click(screen.getByRole('button', { name: 'Add to list' }));

    await waitFor(() => expect(props.onImportInto).toHaveBeenCalledWith(expect.objectContaining({ name: 'Lisbon' }), 9));
    expect(props.onImport).not.toHaveBeenCalled();
  });

  it('FE-COMP-COLLIMPORT-023: starts on the list that is open, whatever order they come in', async () => {
    const props = intoProps({ defaultListId: 9 });
    await choose(JSON.stringify(listFile));
    await waitFor(() => expect(screen.getByText('Add to a list')).toBeInTheDocument());

    await userEvent.click(screen.getByText('Add to a list'));
    await userEvent.click(screen.getByRole('button', { name: 'Add to list' }));

    await waitFor(() => expect(props.onImportInto).toHaveBeenCalledWith(expect.anything(), 9));
  });

  it('FE-COMP-COLLIMPORT-024: says what adding to a list does and does not do', async () => {
    intoProps();
    await choose(JSON.stringify(listFile));
    await waitFor(() => expect(screen.getByText('Add to a list')).toBeInTheDocument());

    await userEvent.click(screen.getByText('Add to a list'));

    expect(screen.getByText(/Places the list already has stay as they are/)).toBeInTheDocument();
  });

  it('FE-COMP-COLLIMPORT-025: keeps the dialog open and says why when adding fails', async () => {
    const onImportInto = vi.fn().mockRejectedValue(
      Object.assign(new Error('x'), { response: { status: 403, data: { error: 'You have read-only access to this list' } } }),
    );
    intoProps({ onImportInto });
    await choose(JSON.stringify(listFile));
    await waitFor(() => expect(screen.getByText('Add to a list')).toBeInTheDocument());

    await userEvent.click(screen.getByText('Add to a list'));
    await userEvent.click(screen.getByRole('button', { name: 'Add to list' }));

    await waitFor(() => expect(screen.getByText('You have read-only access to this list')).toBeInTheDocument());
  });

  it('FE-COMP-COLLIMPORT-026: goes back to a new list with the name it started with', async () => {
    const props = intoProps();
    await choose(JSON.stringify(listFile));
    await waitFor(() => expect(screen.getByText('Add to a list')).toBeInTheDocument());

    await userEvent.click(screen.getByText('Add to a list'));
    await userEvent.click(screen.getByText('New list'));
    await userEvent.click(importButton());

    await waitFor(() => expect(props.onImport).toHaveBeenCalledWith(expect.objectContaining({ name: 'Lisbon' }), undefined));
    expect(props.onImportInto).not.toHaveBeenCalled();
  });
});
