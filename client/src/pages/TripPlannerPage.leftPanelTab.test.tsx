import { fireEvent, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { render } from '../../tests/helpers/render';
import { PanelTab } from './TripPlannerPage';

// FE-PAGE-PLANNER-LEFTTAB-001 to FE-PAGE-PLANNER-LEFTTAB-005

describe('PanelTab', () => {
  it('FE-PAGE-PLANNER-LEFTTAB-001: an open panel shows a flap on its edge that collapses it', () => {
    const onToggle = vi.fn();
    render(<PanelTab hidden={false} label="Collapse" onToggle={onToggle} />);
    const tab = screen.getByRole('button', { name: 'Collapse' });
    expect(tab).toHaveClass('text-content-faint');
    expect(tab.style.position).toBe('absolute');
    expect(tab.style.right).toBe('-28px');
    expect(tab.style.borderRadius).toBe('0 10px 10px 0');
    fireEvent.click(tab);
    expect(onToggle).toHaveBeenCalledTimes(1);
  });

  it('FE-PAGE-PLANNER-LEFTTAB-002: a hidden panel leaves a raised accent tile', () => {
    render(<PanelTab hidden label="Plan" onToggle={vi.fn()} />);
    const tab = screen.getByRole('button', { name: 'Plan' });
    expect(tab).toHaveClass('bg-accent');
    expect(tab.style.position).toBe('fixed');
    expect(tab.style.left).toBe('10px');
    expect(tab.style.borderRadius).toBe('10px');
  });

  it('FE-PAGE-PLANNER-LEFTTAB-003: an open tab says its panel is open and shows a focus ring', () => {
    render(<PanelTab hidden={false} label="Collapse" onToggle={vi.fn()} />);
    const tab = screen.getByRole('button', { name: 'Collapse' });
    expect(tab).toHaveAttribute('aria-expanded', 'true');
    expect(tab).toHaveClass('focus-visible:outline');
  });

  it('FE-PAGE-PLANNER-LEFTTAB-004: the tab states whether the panel is open and shows a focus ring', () => {
    const { rerender } = render(<PanelTab hidden={false} label="Collapse" onToggle={vi.fn()} />);
    const tab = screen.getByRole('button', { name: 'Collapse' });
    expect(tab).toHaveAttribute('aria-expanded', 'true');
    expect(tab).toHaveClass('text-content-faint', 'focus-visible:outline');
    rerender(<PanelTab hidden label="Plan" onToggle={vi.fn()} />);
    const hiddenTab = screen.getByRole('button', { name: 'Plan' });
    expect(hiddenTab).toHaveAttribute('aria-expanded', 'false');
    expect(hiddenTab).toHaveClass('bg-accent', 'focus-visible:outline');
  });

  it('FE-PAGE-PLANNER-LEFTTAB-005: the right panel tab of the plan view is the same tab, mirrored', () => {
    const onToggle = vi.fn();
    const { rerender } = render(<PanelTab side="right" hidden={false} label="Collapse" onToggle={onToggle} />);
    const tab = screen.getByRole('button', { name: 'Collapse' });
    expect(tab).toHaveAttribute('aria-expanded', 'true');
    expect(tab).toHaveClass('text-content-faint', 'focus-visible:outline');
    expect(tab.style.left).toBe('-28px');
    expect(tab.style.borderRadius).toBe('10px 0 0 10px');
    fireEvent.click(tab);
    expect(onToggle).toHaveBeenCalledTimes(1);
    rerender(<PanelTab side="right" hidden label="Places" onToggle={onToggle} />);
    const hiddenTab = screen.getByRole('button', { name: 'Places' });
    expect(hiddenTab).toHaveAttribute('aria-expanded', 'false');
    expect(hiddenTab).toHaveClass('bg-accent', 'focus-visible:outline');
    expect(hiddenTab.style.position).toBe('fixed');
    expect(hiddenTab.style.right).toBe('10px');
  });
});
