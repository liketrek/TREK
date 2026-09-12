// FE-COMP-COLLIMPORT-001 to FE-COMP-COLLIMPORT-010
import { render, screen, waitFor } from '../../../tests/helpers/render';
import userEvent from '@testing-library/user-event';
import type { CollectionFile } from '@trek/shared';
import { useTranslation } from '../../i18n/TranslationContext';
import ImportCollectionModal from './ImportCollectionModal';

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
    onClose: vi.fn(),
    ...overrides,
  };
  render(<Harness {...props} />);
  return props;
}

/** Put a file into the hidden input the way a file picker would. */
async function choose(content: string, name = 'list.trekcollection.json') {
  const input = document.querySelector('input[type="file"]') as HTMLInputElement;
  const file = new File([content], name, { type: 'application/json' });
  // jsdom's File has no usable text(); the component awaits it.
  Object.defineProperty(file, 'text', { value: () => Promise.resolve(content) });
  await userEvent.upload(input, file);
}

const importButton = () => screen.getByRole('button', { name: 'Import' });

describe('ImportCollectionModal (#2198)', () => {
  it('FE-COMP-COLLIMPORT-001: opens asking for a file, with Import not yet possible', () => {
    renderModal();
    expect(screen.getByText('Choose a list file')).toBeInTheDocument();
    expect(screen.getByText('.trekcollection.json')).toBeInTheDocument();
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
