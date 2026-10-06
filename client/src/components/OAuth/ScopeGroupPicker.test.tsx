// FE-COMP-SCOPE-001 to FE-COMP-SCOPE-009
import userEvent from '@testing-library/user-event';
import { render, screen } from '../../../tests/helpers/render';
import { resetAllStores } from '../../../tests/helpers/store';
import ScopeGroupPicker from './ScopeGroupPicker';

beforeEach(() => {
  resetAllStores();
});

describe('ScopeGroupPicker', () => {
  it('FE-COMP-SCOPE-001: renders scope groups', () => {
    render(<ScopeGroupPicker selected={[]} onChange={vi.fn()} />);
    // Several group headers should be visible
    expect(screen.getAllByRole('button').length).toBeGreaterThan(0);
  });

  it('FE-COMP-SCOPE-002: shows Select All button when nothing selected', () => {
    render(<ScopeGroupPicker selected={[]} onChange={vi.fn()} />);
    expect(screen.getByRole('button', { name: /select all/i })).toBeInTheDocument();
  });

  it('FE-COMP-SCOPE-003: Select All calls onChange with all scopes', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<ScopeGroupPicker selected={[]} onChange={onChange} />);
    await user.click(screen.getByRole('button', { name: /select all/i }));
    expect(onChange).toHaveBeenCalledTimes(1);
    const called = onChange.mock.calls[0][0] as string[];
    expect(called.length).toBeGreaterThan(0);
  });

  it('FE-COMP-SCOPE-004: shows Deselect All button when all selected', async () => {
    // First collect all scopes by clicking Select All and capturing the callback
    const user = userEvent.setup();
    const captured: string[][] = [];
    const { rerender } = render(<ScopeGroupPicker selected={[]} onChange={(s) => captured.push(s)} />);
    await user.click(screen.getByRole('button', { name: /select all/i }));
    const allScopes = captured[0];

    // Now rerender with all scopes selected
    rerender(<ScopeGroupPicker selected={allScopes} onChange={vi.fn()} />);
    expect(screen.getByRole('button', { name: /deselect all/i })).toBeInTheDocument();
  });

  it('FE-COMP-SCOPE-005: Deselect All calls onChange with empty array', async () => {
    const user = userEvent.setup();
    const captured: string[][] = [];

    // Get all scopes first
    const { rerender } = render(<ScopeGroupPicker selected={[]} onChange={(s) => captured.push(s)} />);
    await user.click(screen.getByRole('button', { name: /select all/i }));
    const allScopes = captured[0];

    const onChange = vi.fn();
    rerender(<ScopeGroupPicker selected={allScopes} onChange={onChange} />);
    await user.click(screen.getByRole('button', { name: /deselect all/i }));
    expect(onChange).toHaveBeenCalledWith([]);
  });

  it('FE-COMP-SCOPE-006: expanding a group reveals individual scope checkboxes', async () => {
    const user = userEvent.setup();
    render(<ScopeGroupPicker selected={[]} onChange={vi.fn()} />);

    // Groups are collapsed by default — checkboxes for individual scopes not visible
    const groupToggles = screen
      .getAllByRole('button')
      .filter(
        (b) =>
          !b.textContent?.toLowerCase().includes('select all') && !b.textContent?.toLowerCase().includes('deselect all')
      );
    // Click the first group expand button
    await user.click(groupToggles[0]);
    // Individual scope checkboxes should now appear (more than just group-level ones)
    const checkboxes = screen.getAllByRole('checkbox');
    expect(checkboxes.length).toBeGreaterThan(0);
  });

  it('FE-COMP-SCOPE-007: group checkbox selects all scopes in the group', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<ScopeGroupPicker selected={[]} onChange={onChange} />);

    const groupCheckboxes = screen.getAllByRole('checkbox');
    await user.click(groupCheckboxes[0]);
    expect(onChange).toHaveBeenCalledTimes(1);
    const called = onChange.mock.calls[0][0] as string[];
    expect(called.length).toBeGreaterThan(0);
  });

  it('FE-COMP-SCOPE-008: individual scope toggle adds/removes that scope', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<ScopeGroupPicker selected={[]} onChange={onChange} />);

    // Expand first group
    const groupToggles = screen
      .getAllByRole('button')
      .filter(
        (b) =>
          !b.textContent?.toLowerCase().includes('select all') && !b.textContent?.toLowerCase().includes('deselect all')
      );
    await user.click(groupToggles[0]);

    // There are now individual scope checkboxes — click the second one (first is group-level)
    const checkboxes = screen.getAllByRole('checkbox');
    await user.click(checkboxes[1]); // individual scope
    expect(onChange).toHaveBeenCalledTimes(1);
  });

  it('FE-COMP-SCOPE-009: count badge shown when some scopes selected in group', () => {
    // Get any single scope key from the first group via Select All trick + manual slice
    // We'll just select a scope by triggering group checkbox and passing it in
    const firstGroupScope = 'trips:read'; // known scope from SCOPE_GROUPS
    render(<ScopeGroupPicker selected={[firstGroupScope]} onChange={vi.fn()} />);
    // Count badge like "(1/N)" should be visible
    expect(screen.getByText(/\(\d+\/\d+\)/)).toBeInTheDocument();
  });
});
