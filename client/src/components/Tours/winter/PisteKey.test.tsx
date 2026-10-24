// FE-TOUR-PISTE-KEY-001 to FE-TOUR-PISTE-KEY-006
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { fireEvent, render, screen, within } from '../../../../tests/helpers/render';
import { PisteKeyButton } from './PisteKey';

const trigger = () => screen.getByRole('button', { name: 'Piste key' });
const key = () => screen.queryByRole('group', { name: 'Piste key' });

describe('PisteKeyButton (SKI-01)', () => {
  it('FE-TOUR-PISTE-KEY-001: the button carries the grade colours as its badge and opens nothing on its own', () => {
    render(<PisteKeyButton />);
    expect(trigger()).toHaveAttribute('aria-expanded', 'false');
    expect(trigger().querySelectorAll('span[style]')).toHaveLength(4);
    expect(key()).toBeNull();
  });

  it('FE-TOUR-PISTE-KEY-002: opened, the key names every downhill grade and the other winter ways the layer draws', async () => {
    render(<PisteKeyButton />);
    await userEvent.click(trigger());
    const panel = key();
    expect(panel).toBeInTheDocument();
    expect(trigger()).toHaveAttribute('aria-expanded', 'true');
    expect(trigger()).toHaveAttribute('aria-controls', panel?.id);
    expect(within(panel as HTMLElement).getByText('Downhill runs by difficulty')).toBeInTheDocument();
    const grades = within(screen.getByTestId('piste-key-grades')).getAllByRole('listitem');
    expect(grades.map((grade) => grade.textContent)).toEqual([
      'Novice',
      'Easy',
      'Intermediate',
      'Advanced',
      'Expert',
      'Freeride',
    ]);
    const ways = within(screen.getByTestId('piste-key-ways')).getAllByRole('listitem');
    expect(ways.map((way) => way.textContent)).toEqual([
      'Cross-country trails',
      'Winter and snowshoe trails',
      'Toboggan runs',
      'Lifts and cable cars',
    ]);
    // Winter walking trails are dotted, as on the map; the other trails are lines.
    expect(ways[1]?.querySelectorAll('span[style]')).toHaveLength(3);
    expect(ways[0]?.querySelectorAll('span[style]')).toHaveLength(1);
    expect(within(panel as HTMLElement).getByText('OpenSnowMap')).toBeInTheDocument();
  });

  it('FE-TOUR-PISTE-KEY-003: the key says the colours are mapped data and no report on opening, grooming, snow or avalanches', async () => {
    render(<PisteKeyButton />);
    await userEvent.click(trigger());
    expect(
      screen.getByText(
        'Mapped data, not a live report: it says nothing about what is open or groomed, the snow or avalanches.'
      )
    ).toBeInTheDocument();
  });

  it('FE-TOUR-PISTE-KEY-004: the full key opens at OpenSnowMap in a new tab and takes the focus when the key opens', async () => {
    render(<PisteKeyButton />);
    await userEvent.click(trigger());
    const link = screen.getByRole('link', { name: 'Full key at OpenSnowMap' });
    expect(link).toHaveAttribute('href', 'https://www.opensnowmap.org/');
    expect(link).toHaveAttribute('target', '_blank');
    expect(link).toHaveAttribute('rel', 'noopener noreferrer');
    expect(link).toHaveFocus();
  });

  it('FE-TOUR-PISTE-KEY-005: Escape and a click beside it close the key and leave the button', async () => {
    render(<PisteKeyButton />);
    await userEvent.click(trigger());
    await userEvent.keyboard('{Escape}');
    expect(key()).toBeNull();
    expect(trigger()).toHaveFocus();

    await userEvent.click(trigger());
    expect(key()).toBeInTheDocument();
    fireEvent.mouseDown(document.body);
    expect(key()).toBeNull();
  });

  it('FE-TOUR-PISTE-KEY-006: opened further out than the pistes reach, the key says first to zoom in, and not once close', async () => {
    const { rerender } = render(<PisteKeyButton belowMinZoom />);
    await userEvent.click(trigger());
    expect(within(key() as HTMLElement).getByTestId('piste-key-zoom-in')).toHaveTextContent(
      'Zoom in to see the pistes'
    );
    rerender(<PisteKeyButton />);
    expect(screen.queryByTestId('piste-key-zoom-in')).toBeNull();
    expect(screen.getByTestId('piste-key-grades')).toBeInTheDocument();
  });
});
