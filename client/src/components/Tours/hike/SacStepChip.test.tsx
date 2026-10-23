/**
 * FE-TOUR-SAC-CHIP-001 to FE-TOUR-SAC-CHIP-002
 *
 * A grade as the hike's chip: a dot in its map colour beside its short name,
 * the highest SAC step with a question mark when too little is graded, and a
 * lone question mark in the grey of the unknown when nothing is.
 */
import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { GradeChip, SacStepChip } from './SacStepChip';

const dotOf = (container: HTMLElement) => container.querySelector<HTMLElement>('[aria-hidden="true"]');

describe('SacStepChip', () => {
  it('FE-TOUR-SAC-CHIP-001: names the step in its colour, uncertain with a question mark', () => {
    const { container } = render(<SacStepChip step={3} />);
    expect(screen.getByText('T3')).toBeInTheDocument();
    expect(dotOf(container)?.style.background).toBe('var(--hike-sac-t3)');
    render(<SacStepChip step={4} uncertain />);
    expect(screen.getByText('T4?')).toBeInTheDocument();
  });

  it('FE-TOUR-SAC-CHIP-002: no known step reads as a faint question mark in the grey of the unknown, never as easy', () => {
    const { container } = render(<SacStepChip step={null} />);
    expect(screen.getByText('?')).toHaveClass('text-content-faint');
    expect(dotOf(container)?.style.background).toBe('var(--bike-surface-unknown)');
    const plain = render(<GradeChip color="var(--hike-way-path)" text={null} />);
    expect(plain.container.textContent).toBe('');
  });
});
