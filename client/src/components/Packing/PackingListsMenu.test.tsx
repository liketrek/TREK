// FE-PACKLISTSMENU-001 to FE-PACKLISTSMENU-008
import type { ComponentProps } from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '../../../tests/helpers/render';
import { useAddonStore } from '../../store/addonStore';

const applyProps = vi.fn();
const exportProps = vi.fn();
vi.mock('./ApplyTemplateButton', () => ({
  default: (props: { onApplied?: () => void }) => {
    applyProps(props);
    return (
      <button type="button" onClick={props.onApplied}>
        Apply template
      </button>
    );
  },
}));
vi.mock('./PackingExportMenu', () => ({
  default: (props: { onChosen?: () => void }) => {
    exportProps(props);
    return (
      <button type="button" onClick={props.onChosen}>
        Print or save as PDF
      </button>
    );
  },
}));

import PackingListsMenu from './PackingListsMenu';

type Props = ComponentProps<typeof PackingListsMenu>;

function setup(overrides: Partial<Props> = {}) {
  const props: Props = {
    tripId: 4,
    view: 'common',
    canEdit: true,
    isAdmin: true,
    hasItems: true,
    packedCount: 0,
    sort: 'manual',
    onSortChange: vi.fn(),
    hideDone: false,
    onHideDoneChange: vi.fn(),
    onImport: vi.fn(),
    onSaveTemplate: vi.fn(),
    onClearChecked: vi.fn(),
    onOpenBags: vi.fn(),
    buttonClassName: 'btn',
    buttonStyle: {},
    ...overrides,
  };
  render(<PackingListsMenu {...props} />);
  const trigger = screen.getByRole('button', { name: 'Show more' });
  return { props, trigger, menu: () => screen.getByRole('menu', { hidden: true }) };
}

beforeEach(() => {
  vi.clearAllMocks();
  useAddonStore.setState({ bagTracking: false });
});

describe('PackingListsMenu', () => {
  it('FE-PACKLISTSMENU-001: the "..." opens and closes the menu, a click beside it closes it too', () => {
    const { trigger, menu } = setup();
    expect(menu()).not.toBeVisible();
    fireEvent.click(trigger);
    expect(trigger).toHaveAttribute('aria-expanded', 'true');
    expect(menu()).toBeVisible();
    fireEvent.click(document.querySelector('[role="presentation"]')!);
    expect(menu()).not.toBeVisible();
  });

  it('FE-PACKLISTSMENU-002: templates and export sit in it, for the view on screen, and close it once used', () => {
    const { trigger, menu } = setup({ view: 'personal' });
    expect(applyProps).toHaveBeenCalledWith(
      expect.objectContaining({ tripId: 4, visibility: 'personal', variant: 'menu' })
    );
    expect(exportProps).toHaveBeenCalledWith(expect.objectContaining({ tripId: 4, view: 'personal', variant: 'menu' }));
    fireEvent.click(trigger);
    fireEvent.click(screen.getByRole('button', { name: 'Apply template' }));
    expect(menu()).not.toBeVisible();
    fireEvent.click(trigger);
    fireEvent.click(screen.getByRole('button', { name: 'Print or save as PDF' }));
    expect(menu()).not.toBeVisible();
  });

  it('FE-PACKLISTSMENU-003: import and save as template hand over and close the menu', () => {
    const { trigger, props, menu } = setup();
    fireEvent.click(trigger);
    fireEvent.click(screen.getByRole('button', { name: 'Import' }));
    expect(props.onImport).toHaveBeenCalledTimes(1);
    expect(menu()).not.toBeVisible();
    fireEvent.click(trigger);
    fireEvent.click(screen.getByRole('button', { name: 'Save as template' }));
    expect(props.onSaveTemplate).toHaveBeenCalledTimes(1);
  });

  it('FE-PACKLISTSMENU-004: a reader gets no templates, import, save or clean-up', () => {
    setup({ canEdit: false, packedCount: 3 });
    expect(applyProps).not.toHaveBeenCalled();
    expect(screen.queryByRole('button', { name: 'Import', hidden: true })).toBeNull();
    expect(screen.queryByRole('button', { name: 'Save as template', hidden: true })).toBeNull();
    expect(screen.queryByRole('button', { name: /checked/, hidden: true })).toBeNull();
    expect(screen.getByRole('button', { name: /Print or save as PDF/, hidden: true })).toBeInTheDocument();
  });

  it('FE-PACKLISTSMENU-005: save as template is for admins with a list to save', () => {
    setup({ isAdmin: false });
    expect(screen.queryByRole('button', { name: 'Save as template', hidden: true })).toBeNull();
  });

  it('FE-PACKLISTSMENU-006: A to Z and hiding packed items toggle, and show a tick while on', () => {
    const { trigger, props } = setup({ sort: 'name', hideDone: true });
    fireEvent.click(trigger);
    const sort = screen.getByRole('button', { name: 'A to Z' });
    const hide = screen.getByRole('button', { name: 'Hide packed' });
    expect(sort.querySelector('svg.lucide-check')).not.toBeNull();
    expect(hide.querySelector('svg.lucide-check')).not.toBeNull();
    fireEvent.click(sort);
    fireEvent.click(hide);
    expect(props.onSortChange).toHaveBeenCalledWith('manual');
    expect(props.onHideDoneChange).toHaveBeenCalledWith(false);
  });

  it('FE-PACKLISTSMENU-007: an empty list offers no order or hiding, and nothing to clear', () => {
    setup({ hasItems: false });
    expect(screen.queryByRole('button', { name: 'A to Z', hidden: true })).toBeNull();
    expect(screen.queryByRole('button', { name: 'Hide packed', hidden: true })).toBeNull();
    expect(screen.queryByRole('button', { name: /checked/, hidden: true })).toBeNull();
  });

  it('FE-PACKLISTSMENU-008: bags come in with bag tracking, the clean-up with packed items', () => {
    useAddonStore.setState({ bagTracking: true });
    const { trigger, props } = setup({ sort: 'manual', packedCount: 2 });
    fireEvent.click(trigger);
    fireEvent.click(screen.getByRole('button', { name: 'A to Z' }));
    expect(props.onSortChange).toHaveBeenCalledWith('name');
    // The order is a switch: the menu stays open for the next choice.
    fireEvent.click(screen.getByRole('button', { name: 'Bags' }));
    expect(props.onOpenBags).toHaveBeenCalledTimes(1);
    fireEvent.click(trigger);
    fireEvent.click(screen.getByRole('button', { name: 'Remove 2 checked' }));
    expect(props.onClearChecked).toHaveBeenCalledTimes(1);
  });
});
