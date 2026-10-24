import { describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '../../../tests/helpers/render';
import { italicTitle } from './fontPicker';
import { WeightLine } from './StudioTypeControls';

const t = (k: string) => k;

describe('WeightLine', () => {
  it('steps through only the weights the family has and says the drawn one by name and number', () => {
    render(<WeightLine font="oswald" weight={700} onPick={vi.fn()} t={t} />);
    expect(screen.getByText('journey.studio.weight')).toBeTruthy();
    const slider = screen.getByRole('slider') as HTMLInputElement;
    // Oswald ships 200 to 700: six stops, the last one drawn.
    expect([slider.min, slider.max, slider.value]).toEqual(['0', '5', '5']);
    expect(slider.getAttribute('aria-valuetext')).toBe('journey.studio.weight.700 700');
    expect(screen.getByText('journey.studio.weight.700 700')).toBeTruthy();
  });

  it('hands back the weight at the stop picked', () => {
    const onPick = vi.fn();
    render(<WeightLine font="sans" weight={400} onPick={onPick} t={t} />);
    fireEvent.change(screen.getByRole('slider'), { target: { value: '0' } });
    expect(onPick).toHaveBeenCalledWith(100);
    fireEvent.change(screen.getByRole('slider'), { target: { value: '8' } });
    expect(onPick).toHaveBeenLastCalledWith(900);
  });

  it('shows the one weight of a family that has one, with nothing to drag, and the weight it really draws', () => {
    render(<WeightLine font="bebas" weight={700} onPick={vi.fn()} t={t} />);
    expect(screen.queryByRole('slider')).toBeNull();
    expect(screen.getByText('journey.studio.weightOnly')).toBeTruthy();
    expect(screen.getByText('journey.studio.weight.400 400')).toBeTruthy();
  });

  it('reads a family this build does not know as the default one', () => {
    render(<WeightLine font="gone" weight={500} onPick={vi.fn()} t={t} />);
    expect((screen.getByRole('slider') as HTMLInputElement).value).toBe('4');
  });
});

describe('italicTitle', () => {
  it('says when the browser slants a family that has no italic of its own', () => {
    expect(italicTitle('garamond', 400, t)).toBe('journey.studio.italic');
    expect(italicTitle('sans', 400, t)).toBe('journey.studio.italicSlanted');
    expect(italicTitle('playfair', 300, t)).toBe('journey.studio.italic');
  });
});
