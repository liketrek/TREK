import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '../../../tests/helpers/render';
import type { TranslationFn } from '../../types';
import AtlasLayerToggle from './AtlasLayerToggle';

// FE-ATLAS-TOGGLE-001 to FE-ATLAS-TOGGLE-003

const t = ((key: string) => key) as TranslationFn;

describe('AtlasLayerToggle', () => {
  it('FE-ATLAS-TOGGLE-001: stays out of the way while nothing is planned', () => {
    const { container } = render(
      <AtlasLayerToggle t={t} showPlanned={false} onToggle={vi.fn()} plannedCount={0} />,
    );

    expect(container).toBeEmptyDOMElement();
  });

  it('FE-ATLAS-TOGGLE-002: shows the label and how many countries the layer would add', () => {
    render(<AtlasLayerToggle t={t} showPlanned={false} onToggle={vi.fn()} plannedCount={4} />);

    expect(screen.getByText('atlas.showPlanned')).toBeInTheDocument();
    expect(screen.getByText('4')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'atlas.showPlanned' })).toHaveAttribute('aria-pressed', 'false');
  });

  it('FE-ATLAS-TOGGLE-003: reports the flip and reflects the current state', () => {
    const onToggle = vi.fn();
    const { rerender } = render(
      <AtlasLayerToggle t={t} showPlanned={false} onToggle={onToggle} plannedCount={4} />,
    );

    fireEvent.click(screen.getByRole('button', { name: 'atlas.showPlanned' }));
    expect(onToggle).toHaveBeenCalledTimes(1);

    rerender(<AtlasLayerToggle t={t} showPlanned onToggle={onToggle} plannedCount={4} />);
    expect(screen.getByRole('button', { name: 'atlas.showPlanned' })).toHaveAttribute('aria-pressed', 'true');
  });
});
