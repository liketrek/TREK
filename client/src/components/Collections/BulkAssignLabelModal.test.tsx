// FE-COMP-BULKLABEL-001 to FE-COMP-BULKLABEL-009
import React from 'react';
import { render, screen, waitFor } from '../../../tests/helpers/render';
import userEvent from '@testing-library/user-event';
import type { CollectionLabel } from '@trek/shared';
import { useTranslation } from '../../i18n/TranslationContext';
import BulkAssignLabelModal from './BulkAssignLabelModal';

type ModalProps = Omit<React.ComponentProps<typeof BulkAssignLabelModal>, 't'>;

function Harness(props: ModalProps): React.ReactElement {
  const { t } = useTranslation();
  return <BulkAssignLabelModal {...props} t={t} />;
}

const berlin: CollectionLabel = { id: 1, collection_id: 10, name: 'Berlin', color: '#0ea5e9' };
const food: CollectionLabel = { id: 2, collection_id: 10, name: 'Food', color: null };

function renderModal(overrides: Partial<ModalProps> = {}) {
  const props: ModalProps = {
    isOpen: true,
    labels: [berlin, food],
    count: 4,
    onAssign: vi.fn(async () => {}),
    onManage: vi.fn(),
    onClose: vi.fn(),
    ...overrides,
  };
  render(<Harness {...props} />);
  return props;
}

describe('BulkAssignLabelModal', () => {
  it('FE-COMP-BULKLABEL-001: titles the modal with the selection count and lists every label', () => {
    renderModal({ count: 4 });
    expect(screen.getByRole('heading', { name: 'Add labels to 4 places' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Berlin' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Food' })).toBeInTheDocument();
  });

  it('FE-COMP-BULKLABEL-002: with no labels it explains why and offers the manager instead', async () => {
    const user = userEvent.setup();
    const props = renderModal({ labels: [] });

    expect(screen.getByText('Create a label first to group places in this list.')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Assign label' })).not.toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /Manage labels/ }));
    expect(props.onManage).toHaveBeenCalledTimes(1);
  });

  it('FE-COMP-BULKLABEL-003: the assign button is disabled until at least one label is picked', async () => {
    const user = userEvent.setup();
    renderModal();
    const assign = screen.getByRole('button', { name: /^Assign label$/ });
    expect(assign).toBeDisabled();

    await user.click(screen.getByRole('button', { name: 'Berlin' }));
    expect(assign).toBeEnabled();
  });

  it('FE-COMP-BULKLABEL-004: picking a label marks the row selected, clicking again unpicks it', async () => {
    const user = userEvent.setup();
    renderModal();
    const berlinRow = screen.getByRole('button', { name: 'Berlin' });

    await user.click(berlinRow);
    expect(berlinRow).toHaveClass('border-accent');

    await user.click(berlinRow);
    expect(berlinRow).not.toHaveClass('border-accent');
    expect(screen.getByRole('button', { name: /^Assign label$/ })).toBeDisabled();
  });

  it('FE-COMP-BULKLABEL-005: assigning sends every picked id in click order and clears the selection', async () => {
    const user = userEvent.setup();
    const props = renderModal();

    await user.click(screen.getByRole('button', { name: 'Food' }));
    await user.click(screen.getByRole('button', { name: 'Berlin' }));
    await user.click(screen.getByRole('button', { name: /^Assign label$/ }));

    await waitFor(() => expect(props.onAssign).toHaveBeenCalledWith([2, 1]));
    // Selection resets so the modal is ready for the next batch.
    await waitFor(() => expect(screen.getByRole('button', { name: /^Assign label$/ })).toBeDisabled());
    expect(screen.getByRole('button', { name: 'Berlin' })).not.toHaveClass('border-accent');
  });

  it('FE-COMP-BULKLABEL-006: a second click while the assign is pending is ignored', async () => {
    const user = userEvent.setup();
    const onAssign = vi.fn(() => new Promise<void>(() => {}));
    renderModal({ onAssign });

    await user.click(screen.getByRole('button', { name: 'Berlin' }));
    const assign = screen.getByRole('button', { name: /^Assign label$/ });
    await user.click(assign);
    await user.click(assign);

    expect(onAssign).toHaveBeenCalledTimes(1);
    expect(assign.querySelector('.animate-spin')).not.toBeNull();
    expect(assign).toBeDisabled();
  });

  it('FE-COMP-BULKLABEL-007: Cancel closes without assigning anything', async () => {
    const user = userEvent.setup();
    const props = renderModal();

    await user.click(screen.getByRole('button', { name: 'Berlin' }));
    await user.click(screen.getByRole('button', { name: 'Cancel' }));

    expect(props.onClose).toHaveBeenCalledTimes(1);
    expect(props.onAssign).not.toHaveBeenCalled();
  });

  it('FE-COMP-BULKLABEL-008: the footer manage shortcut opens the label manager', async () => {
    const user = userEvent.setup();
    const props = renderModal();

    await user.click(screen.getByRole('button', { name: /Manage labels/ }));
    expect(props.onManage).toHaveBeenCalledTimes(1);
  });

  it('FE-COMP-BULKLABEL-009: renders nothing while closed', () => {
    renderModal({ isOpen: false });
    expect(screen.queryByRole('heading', { name: /Add labels to/ })).not.toBeInTheDocument();
  });
});
