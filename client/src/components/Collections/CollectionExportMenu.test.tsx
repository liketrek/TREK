// FE-COMP-COLEXPORT-001 to FE-COMP-COLEXPORT-008
import React from 'react';
import { render, screen, waitFor } from '../../../tests/helpers/render';
import userEvent from '@testing-library/user-event';
import { useTranslation } from '../../i18n/TranslationContext';
import CollectionExportMenu from './CollectionExportMenu';

type MenuProps = Omit<React.ComponentProps<typeof CollectionExportMenu>, 't'>;

function Harness(props: MenuProps): React.ReactElement {
  const { t } = useTranslation();
  return (
    <>
      <CollectionExportMenu {...props} t={t} />
      <button type="button">Somewhere else</button>
    </>
  );
}

function renderMenu(overrides: Partial<MenuProps> = {}) {
  const props: MenuProps = { onExport: vi.fn(), ...overrides };
  render(<Harness {...props} />);
  return props;
}

const trigger = () => screen.getByRole('button', { name: 'Export' });
const items = () => screen.getAllByRole('menuitem');

describe('CollectionExportMenu (#2301)', () => {
  it('FE-COMP-COLEXPORT-001: is a closed menu button until pressed', () => {
    renderMenu();
    expect(trigger()).toHaveAttribute('aria-haspopup', 'menu');
    expect(trigger()).toHaveAttribute('aria-expanded', 'false');
    expect(screen.queryByRole('menu')).toBeNull();
  });

  it('FE-COMP-COLEXPORT-002: offers both formats, each with its extension and what it is for', async () => {
    renderMenu();
    await userEvent.click(trigger());

    const menu = screen.getByRole('menu', { name: 'Download this list as a file' });
    expect(trigger()).toHaveAttribute('aria-expanded', 'true');
    expect(trigger()).toHaveAttribute('aria-controls', menu.id);
    expect(items().map(item => item.textContent)).toEqual([
      'TREK list.trekcollection.jsonFor another TREK, with labels and status',
      'GPX.gpxWaypoints for OsmAnd, Organic Maps, Garmin and other map apps',
    ]);
  });

  it('FE-COMP-COLEXPORT-003: exports the picked format, closes and gives focus back', async () => {
    const props = renderMenu();
    await userEvent.click(trigger());

    await userEvent.click(screen.getByRole('menuitem', { name: /GPX/ }));

    expect(props.onExport).toHaveBeenCalledWith('gpx');
    expect(screen.queryByRole('menu')).toBeNull();
    expect(trigger()).toHaveFocus();
  });

  it('FE-COMP-COLEXPORT-004: moves focus into the menu and walks it with the arrow keys, Home and End', async () => {
    renderMenu();
    await userEvent.click(trigger());
    await waitFor(() => expect(items()[0]).toHaveFocus());

    await userEvent.keyboard('{ArrowDown}');
    expect(items()[1]).toHaveFocus();
    // Past the end wraps round, as it does in every menu.
    await userEvent.keyboard('{ArrowDown}');
    expect(items()[0]).toHaveFocus();
    await userEvent.keyboard('{ArrowUp}');
    expect(items()[1]).toHaveFocus();
    await userEvent.keyboard('{Home}');
    expect(items()[0]).toHaveFocus();
    await userEvent.keyboard('{End}');
    expect(items()[1]).toHaveFocus();
  });

  it('FE-COMP-COLEXPORT-005: opens from the keyboard and picks with Enter', async () => {
    const props = renderMenu();
    trigger().focus();

    await userEvent.keyboard('{ArrowDown}');
    await waitFor(() => expect(items()[0]).toHaveFocus());
    await userEvent.keyboard('{Enter}');

    expect(props.onExport).toHaveBeenCalledWith('trek');
  });

  it('FE-COMP-COLEXPORT-006: closes on Escape without exporting, and gives focus back', async () => {
    const props = renderMenu();
    await userEvent.click(trigger());
    await waitFor(() => expect(items()[0]).toHaveFocus());

    await userEvent.keyboard('{Escape}');

    expect(screen.queryByRole('menu')).toBeNull();
    expect(trigger()).toHaveFocus();
    expect(props.onExport).not.toHaveBeenCalled();
  });

  it('FE-COMP-COLEXPORT-007: closes on a click anywhere else, and on Tab', async () => {
    renderMenu();
    await userEvent.click(trigger());
    await userEvent.click(screen.getByRole('button', { name: 'Somewhere else' }));
    expect(screen.queryByRole('menu')).toBeNull();

    await userEvent.click(trigger());
    await waitFor(() => expect(items()[0]).toHaveFocus());
    await userEvent.keyboard('{Tab}');
    expect(screen.queryByRole('menu')).toBeNull();
  });

  it('FE-COMP-COLEXPORT-008: cannot be opened while an export is still running', async () => {
    renderMenu({ exporting: true });
    expect(trigger()).toBeDisabled();
    await userEvent.click(trigger());
    expect(screen.queryByRole('menu')).toBeNull();
  });
});
