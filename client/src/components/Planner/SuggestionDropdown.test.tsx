import { fireEvent, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { render } from '../../../tests/helpers/render';
import { PlaceSuggestion, SuggestionInputBox, SuggestionList, SuggestionRow } from './SuggestionDropdown';

// FE-PLANNER-SUGGESTMARKUP-001 to FE-PLANNER-SUGGESTMARKUP-008

function inputBox(over: Partial<React.ComponentProps<typeof SuggestionInputBox>> = {}) {
  const props = {
    icon: <span data-testid="icon" />,
    query: 'Ber',
    placeholder: 'Search',
    onType: vi.fn(),
    onOpen: vi.fn(),
    onKeyDown: vi.fn(),
    ...over,
  };
  render(<SuggestionInputBox {...props} />);
  return props;
}

describe('SuggestionInputBox', () => {
  it('FE-PLANNER-SUGGESTMARKUP-001: renders the icon and the query, and reports typing, focus and keys', () => {
    const props = inputBox();
    expect(screen.getByTestId('icon')).toBeInTheDocument();
    const field = screen.getByPlaceholderText('Search');
    expect(field).toHaveValue('Ber');
    expect(field).toHaveAttribute('data-no-autofocus');
    fireEvent.change(field, { target: { value: 'Berl' } });
    expect(props.onType).toHaveBeenCalledWith('Berl');
    fireEvent.focus(field);
    expect(props.onOpen).toHaveBeenCalled();
    fireEvent.keyDown(field, { key: 'ArrowDown' });
    expect(props.onKeyDown).toHaveBeenCalled();
  });

  it('FE-PLANNER-SUGGESTMARKUP-002: shows the clear button only with an onClear', () => {
    inputBox();
    expect(screen.queryByRole('button', { name: 'Clear' })).not.toBeInTheDocument();
  });

  it('FE-PLANNER-SUGGESTMARKUP-003: the clear button calls onClear', () => {
    const onClear = vi.fn();
    inputBox({ onClear });
    fireEvent.click(screen.getByRole('button', { name: 'Clear' }));
    expect(onClear).toHaveBeenCalled();
  });
});

describe('SuggestionList', () => {
  it('FE-PLANNER-SUGGESTMARKUP-004: renders nothing while idle and empty', () => {
    const { container } = render(
      <SuggestionList loading={false} rowCount={0}>
        <span>row</span>
      </SuggestionList>
    );
    expect(container).toBeEmptyDOMElement();
  });

  it('FE-PLANNER-SUGGESTMARKUP-005: shows the loading line until rows arrive', () => {
    const { rerender } = render(
      <SuggestionList loading rowCount={0}>
        {null}
      </SuggestionList>
    );
    expect(screen.getByText('Loading...')).toBeInTheDocument();
    rerender(
      <SuggestionList loading rowCount={1}>
        <span>row</span>
      </SuggestionList>
    );
    expect(screen.queryByText('Loading...')).not.toBeInTheDocument();
    expect(screen.getByText('row')).toBeInTheDocument();
  });
});

describe('SuggestionRow', () => {
  it('FE-PLANNER-SUGGESTMARKUP-006: reports pick and hover, and marks the active row', () => {
    const onPick = vi.fn();
    const onHover = vi.fn();
    render(
      <SuggestionRow active onPick={onPick} onHover={onHover} align="center">
        Berlin
      </SuggestionRow>
    );
    const row = screen.getByRole('button', { name: 'Berlin' });
    expect(row).toHaveClass('bg-surface-hover');
    expect(row.style.alignItems).toBe('center');
    fireEvent.mouseEnter(row);
    expect(onHover).toHaveBeenCalled();
    fireEvent.click(row);
    expect(onPick).toHaveBeenCalled();
  });

  it('FE-PLANNER-SUGGESTMARKUP-007: an inactive row stays transparent', () => {
    render(
      <SuggestionRow active={false} onPick={vi.fn()} onHover={vi.fn()} align="flex-start">
        Paris
      </SuggestionRow>
    );
    const row = screen.getByRole('button', { name: 'Paris' });
    expect(row).toHaveClass('bg-transparent');
    expect(row.style.alignItems).toBe('flex-start');
  });
});

describe('PlaceSuggestion', () => {
  it('FE-PLANNER-SUGGESTMARKUP-008: shows the address under the name only when it says more', () => {
    const { rerender } = render(<PlaceSuggestion name="Louvre" address="Rue de Rivoli, Paris" />);
    expect(screen.getByText('Louvre')).toBeInTheDocument();
    expect(screen.getByText('Rue de Rivoli, Paris')).toBeInTheDocument();
    rerender(<PlaceSuggestion name="Louvre" address="Louvre" />);
    expect(screen.getAllByText('Louvre')).toHaveLength(1);
    rerender(<PlaceSuggestion name={null} address="Rue de Rivoli, Paris" />);
    expect(screen.getAllByText('Rue de Rivoli, Paris')).toHaveLength(1);
  });
});
