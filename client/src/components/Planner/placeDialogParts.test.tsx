// FE-PLANNER-PLACEDLGPARTS-001 to FE-PLANNER-PLACEDLGPARTS-004
import { describe, it, expect } from 'vitest';
import { render, screen } from '../../../tests/helpers/render';
import { COLUMN_CARD, ColumnHead, HintCard, SIDE_COLUMN, WHITE_BUTTON } from './placeDialogParts';

describe('placeDialogParts', () => {
  it('FE-PLANNER-PLACEDLGPARTS-001: ColumnHead names its column as a heading, with its icon beside it', () => {
    render(<ColumnHead icon={<span data-testid="col-icon" />}>Place details</ColumnHead>);
    expect(screen.getByRole('heading', { level: 3, name: 'Place details' })).toBeInTheDocument();
    expect(screen.getByTestId('col-icon')).toBeInTheDocument();
  });

  it('FE-PLANNER-PLACEDLGPARTS-002: HintCard says its line next to its icon', () => {
    render(<HintCard icon={<span data-testid="hint-icon" />}>Pick a place to see its details</HintCard>);
    expect(screen.getByText('Pick a place to see its details')).toBeInTheDocument();
    expect(screen.getByTestId('hint-icon')).toBeInTheDocument();
  });

  it('FE-PLANNER-PLACEDLGPARTS-003: the column frame stretches with the dialog and clips its cards', () => {
    expect(SIDE_COLUMN).toContain('self-stretch');
    expect(SIDE_COLUMN).toContain('overflow-hidden');
    expect(COLUMN_CARD).toContain('bg-surface-card');
  });

  it('FE-PLANNER-PLACEDLGPARTS-004: the white button dims when disabled', () => {
    expect(WHITE_BUTTON).toContain('disabled:opacity-50');
  });
});
