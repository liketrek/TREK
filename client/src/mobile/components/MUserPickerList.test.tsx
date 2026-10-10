// FE-COMP-MUSERPICK-001 to FE-COMP-MUSERPICK-003
import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import MUserPickerList from './MUserPickerList';

const users = [
  { id: 2, username: 'bob' },
  { id: 3, username: 'carol' },
];

describe('MUserPickerList', () => {
  it('FE-COMP-MUSERPICK-001: renders one button per user and tints none while nothing is picked', () => {
    render(<MUserPickerList users={users} selected={null} onPick={vi.fn()} />);

    const rows = screen.getAllByRole('button');
    expect(rows.map((b) => b.textContent)).toEqual(['bob', 'carol']);
    for (const row of rows) {
      expect(row).toHaveAttribute('type', 'button');
      expect(row.className).not.toContain('bg-[color:var(--m-ic)]');
    }
  });

  it('FE-COMP-MUSERPICK-002: tints only the picked user', () => {
    render(<MUserPickerList users={users} selected={3} onPick={vi.fn()} />);

    expect(screen.getByRole('button', { name: 'carol' }).className).toContain('bg-[color:var(--m-ic)]');
    expect(screen.getByRole('button', { name: 'bob' }).className).not.toContain('bg-[color:var(--m-ic)]');
  });

  it('FE-COMP-MUSERPICK-003: hands the tapped user id to onPick', () => {
    const onPick = vi.fn();
    render(<MUserPickerList users={users} selected={null} onPick={onPick} />);

    fireEvent.click(screen.getByRole('button', { name: 'bob' }));

    expect(onPick).toHaveBeenCalledWith(2);
  });
});
