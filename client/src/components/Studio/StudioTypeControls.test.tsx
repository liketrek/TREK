import { describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '../../../tests/helpers/render';
import { BOOK_FONT_ORDER } from './bookFonts';
import { FontButtons, WeightLine } from './StudioTypeControls';

const t = (k: string) => k;

describe('FontButtons', () => {
  it('offers every bundled family in the picker order and marks the current one', () => {
    render(<FontButtons font="serif" weight={400} onPick={vi.fn()} />);
    const buttons = screen.getAllByRole('button');
    expect(buttons).toHaveLength(BOOK_FONT_ORDER.length);
    expect(screen.getByRole('button', { name: 'Lora' }).className).toContain('is-on');
    expect(screen.getByRole('button', { name: 'Poppins' }).className).not.toContain('is-on');
  });

  it('keeps the weight when the new family ships it', () => {
    const onPick = vi.fn();
    render(<FontButtons font="sans" weight={700} onPick={onPick} />);
    fireEvent.click(screen.getByRole('button', { name: 'Inter' }));
    expect(onPick).toHaveBeenCalledWith({ font: 'inter', weight: 700 });
  });

  it('moves the weight to one the new family really has', () => {
    const onPick = vi.fn();
    render(<FontButtons font="sans" weight={700} onPick={onPick} />);
    fireEvent.click(screen.getByRole('button', { name: 'Bebas Neue' }));
    expect(onPick).toHaveBeenCalledWith({ font: 'bebas', weight: 400 });
  });
});

describe('WeightLine', () => {
  it('greys the weights the family does not ship and says why', () => {
    render(<WeightLine font="bebas" weight={400} onPick={vi.fn()} t={t} />);
    expect(screen.getByText('journey.studio.weight')).toBeTruthy();
    const bold = screen.getByRole('radio', { name: '700' }) as HTMLButtonElement;
    expect(bold.disabled).toBe(true);
    expect(bold.title).toBe('journey.studio.weightMissing');
    const regular = screen.getByRole('radio', { name: '400' }) as HTMLButtonElement;
    expect(regular.disabled).toBe(false);
    expect(regular.getAttribute('aria-checked')).toBe('true');
  });

  it('hands the picked weight back', () => {
    const onPick = vi.fn();
    render(<WeightLine font="sans" weight={400} onPick={onPick} t={t} />);
    fireEvent.click(screen.getByRole('radio', { name: '600' }));
    expect(onPick).toHaveBeenCalledWith(600);
  });
});
