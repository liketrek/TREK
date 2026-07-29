// FE-COMP-LABELMGR-001 to FE-COMP-LABELMGR-013
import React from 'react';
import { render, screen, waitFor, within } from '../../../tests/helpers/render';
import userEvent from '@testing-library/user-event';
import type { CollectionLabel } from '@trek/shared';
import { useTranslation } from '../../i18n/TranslationContext';
import LabelManager from './LabelManager';

type ManagerProps = Omit<React.ComponentProps<typeof LabelManager>, 't'>;

function Harness(props: ManagerProps): React.ReactElement {
  const { t } = useTranslation();
  return <LabelManager {...props} t={t} />;
}

const berlin: CollectionLabel = { id: 1, collection_id: 10, name: 'Berlin', color: '#0ea5e9' };
const food: CollectionLabel = { id: 2, collection_id: 10, name: 'Food', color: null };

function renderManager(overrides: Partial<ManagerProps> = {}) {
  const props: ManagerProps = {
    isOpen: true,
    labels: [berlin, food],
    onCreate: vi.fn(async () => {}),
    onUpdate: vi.fn(async () => {}),
    onDelete: vi.fn(async () => {}),
    onClose: vi.fn(),
    ...overrides,
  };
  render(<Harness {...props} />);
  return props;
}

/** The row whose rename input carries the given label name. */
function row(name: string): HTMLElement {
  return screen.getByDisplayValue(name).closest('div') as HTMLElement;
}

describe('LabelManager', () => {
  it('FE-COMP-LABELMGR-001: renders one editable row per label under the manage title', () => {
    renderManager();
    expect(screen.getByRole('heading', { name: 'Manage labels' })).toBeInTheDocument();
    expect(screen.getByDisplayValue('Berlin')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Food')).toBeInTheDocument();
  });

  it('FE-COMP-LABELMGR-002: shows the empty copy and no rows when the list has no labels', () => {
    renderManager({ labels: [] });
    expect(screen.getByText('No labels yet')).toBeInTheDocument();
    expect(screen.queryByLabelText('Label name')).not.toBeInTheDocument();
  });

  it('FE-COMP-LABELMGR-003: renders nothing at all while closed', () => {
    renderManager({ isOpen: false });
    expect(screen.queryByRole('heading', { name: 'Manage labels' })).not.toBeInTheDocument();
  });

  it('FE-COMP-LABELMGR-004: the Add button stays disabled until a name is typed', async () => {
    const user = userEvent.setup();
    renderManager();
    const add = screen.getByRole('button', { name: /Add label/ });
    expect(add).toBeDisabled();

    await user.type(screen.getByPlaceholderText('e.g. Berlin'), 'Nightlife');
    expect(add).toBeEnabled();
  });

  it('FE-COMP-LABELMGR-005: adding a label passes the trimmed name plus the picked colour and clears the form', async () => {
    const user = userEvent.setup();
    const props = renderManager();

    await user.type(screen.getByPlaceholderText('e.g. Berlin'), '  Nightlife  ');
    await user.click(screen.getByRole('button', { name: /Add label/ }));

    await waitFor(() => expect(props.onCreate).toHaveBeenCalledWith('Nightlife', '#6366f1'));
    expect(screen.getByPlaceholderText('e.g. Berlin')).toHaveValue('');
  });

  it('FE-COMP-LABELMGR-006: picking a swatch in the create form changes the colour sent to onCreate', async () => {
    const user = userEvent.setup();
    const props = renderManager({ labels: [] });

    // The only swatch row on screen belongs to the create form (no label rows).
    await user.click(screen.getByRole('button', { name: '#10b981' }));
    await user.type(screen.getByPlaceholderText('e.g. Berlin'), 'Nature');
    await user.click(screen.getByRole('button', { name: /Add label/ }));

    await waitFor(() => expect(props.onCreate).toHaveBeenCalledWith('Nature', '#10b981'));
  });

  it('FE-COMP-LABELMGR-007: Enter in the name field creates the label too', async () => {
    const user = userEvent.setup();
    const props = renderManager({ labels: [] });

    await user.type(screen.getByPlaceholderText('e.g. Berlin'), 'Museums{Enter}');
    await waitFor(() => expect(props.onCreate).toHaveBeenCalledWith('Museums', '#6366f1'));
  });

  it('FE-COMP-LABELMGR-008: a whitespace-only name never reaches onCreate', async () => {
    const user = userEvent.setup();
    const props = renderManager({ labels: [] });

    await user.type(screen.getByPlaceholderText('e.g. Berlin'), '   {Enter}');
    expect(props.onCreate).not.toHaveBeenCalled();
  });

  it('FE-COMP-LABELMGR-009: a second submit while the first create is still pending is ignored', async () => {
    const user = userEvent.setup();
    const onCreate = vi.fn(() => new Promise<void>(() => {}));
    renderManager({ labels: [], onCreate });

    const input = screen.getByPlaceholderText('e.g. Berlin');
    await user.type(input, 'Slow{Enter}');
    await user.type(input, '{Enter}');

    expect(onCreate).toHaveBeenCalledTimes(1);
    // The button shows the pending spinner while the promise is open.
    expect(screen.getByRole('button', { name: /Add label/ }).querySelector('.animate-spin')).not.toBeNull();
  });

  it('FE-COMP-LABELMGR-010: renaming a label commits the trimmed name on blur', async () => {
    const user = userEvent.setup();
    const props = renderManager();

    const input = screen.getByDisplayValue('Berlin');
    await user.clear(input);
    await user.type(input, 'Berlin Mitte');
    await user.tab();

    await waitFor(() => expect(props.onUpdate).toHaveBeenCalledWith(1, { name: 'Berlin Mitte' }));
  });

  it('FE-COMP-LABELMGR-011: Enter commits the rename, an unchanged or empty name reverts instead', async () => {
    const user = userEvent.setup();
    const props = renderManager();

    const input = screen.getByDisplayValue('Food');
    await user.type(input, ' Trucks{Enter}');
    await waitFor(() => expect(props.onUpdate).toHaveBeenCalledWith(2, { name: 'Food Trucks' }));
    expect(props.onUpdate).toHaveBeenCalledTimes(1);

    // Focus + blur without a change must not fire a second update.
    const berlinInput = screen.getByDisplayValue('Berlin');
    await user.click(berlinInput);
    await user.tab();
    expect(props.onUpdate).toHaveBeenCalledTimes(1);

    // Emptying the field restores the stored name rather than saving a blank one.
    await user.clear(berlinInput);
    await user.tab();
    expect(screen.getByDisplayValue('Berlin')).toBeInTheDocument();
    expect(props.onUpdate).toHaveBeenCalledTimes(1);
  });

  it('FE-COMP-LABELMGR-012: recolouring a row saves the new colour immediately', async () => {
    const user = userEvent.setup();
    const props = renderManager();

    await user.click(within(row('Berlin')).getByRole('button', { name: '#ef4444' }));
    await waitFor(() => expect(props.onUpdate).toHaveBeenCalledWith(1, { color: '#ef4444' }));
  });

  it('FE-COMP-LABELMGR-013: the row delete button passes the label id, the modal close hands back', async () => {
    const user = userEvent.setup();
    const props = renderManager();

    await user.click(within(row('Food')).getByRole('button', { name: 'Delete' }));
    expect(props.onDelete).toHaveBeenCalledWith(2);

    await user.keyboard('{Escape}');
    expect(props.onClose).toHaveBeenCalledTimes(1);
  });
});
