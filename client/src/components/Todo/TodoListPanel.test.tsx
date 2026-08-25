// FE-COMP-TODO-001 to FE-COMP-TODO-079
import { render, screen, waitFor, fireEvent, within } from '../../../tests/helpers/render';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { server } from '../../../tests/helpers/msw/server';
import { useAuthStore } from '../../store/authStore';
import { useTripStore } from '../../store/tripStore';
import { usePermissionsStore } from '../../store/permissionsStore';
import { resetAllStores, seedStore } from '../../../tests/helpers/store';
import { buildUser, buildTrip, buildTodoItem } from '../../../tests/helpers/factories';
import TodoListPanel from './TodoListPanel';

beforeEach(() => {
  resetAllStores();
  // Simulate desktop width so sidebar labels are rendered (not mobile icon-only mode)
  Object.defineProperty(window, 'innerWidth', { value: 1024, writable: true, configurable: true });
  server.use(
    http.get('/api/trips/:id/members', () =>
      HttpResponse.json({ owner: null, members: [], current_user_id: 1 })
    ),
  );
  seedStore(useAuthStore, { user: buildUser(), isAuthenticated: true });
  seedStore(useTripStore, { trip: buildTrip({ id: 1 }) });
});

afterEach(() => {
  vi.useRealTimers();
  Object.defineProperty(window, 'innerWidth', { value: 0, writable: true, configurable: true });
});

describe('TodoListPanel', () => {
  it('FE-COMP-TODO-001: renders todo items by name', () => {
    const items = [
      buildTodoItem({ name: 'Book hotel', checked: 0 }),
      buildTodoItem({ name: 'Buy tickets', checked: 0 }),
    ];
    render(<TodoListPanel tripId={1} items={items} />);
    expect(screen.getByText('Book hotel')).toBeInTheDocument();
    expect(screen.getByText('Buy tickets')).toBeInTheDocument();
  });

  it('FE-COMP-TODO-002: raising addItemSignal opens the new task form', async () => {
    const { rerender } = render(<TodoListPanel tripId={1} items={[]} addItemSignal={0} />);
    rerender(<TodoListPanel tripId={1} items={[]} addItemSignal={1} />);
    expect(await screen.findByText('Create task')).toBeInTheDocument();
  });

  it('FE-COMP-TODO-003: sidebar filter buttons are rendered', () => {
    render(<TodoListPanel tripId={1} items={[]} />);
    // Filter buttons exist — match by title (mobile mode, jsdom innerWidth=0) or text (desktop)
    const allButtons = screen.getAllByRole('button');
    const buttonTitlesAndTexts = allButtons.map(b => (b.textContent || '') + (b.getAttribute('title') || ''));
    expect(buttonTitlesAndTexts.some(t => t.includes('All'))).toBe(true);
    expect(buttonTitlesAndTexts.some(t => t.includes('My Tasks'))).toBe(true);
    expect(buttonTitlesAndTexts.some(t => t.includes('Done'))).toBe(true);
    expect(buttonTitlesAndTexts.some(t => t.includes('Overdue'))).toBe(true);
  });

  it('FE-COMP-TODO-004: unchecked items are shown in All filter', () => {
    const items = [buildTodoItem({ name: 'Open Task', checked: 0 })];
    render(<TodoListPanel tripId={1} items={items} />);
    expect(screen.getByText('Open Task')).toBeInTheDocument();
  });

  it('FE-COMP-TODO-005: checked items are hidden in All filter (All shows unchecked)', () => {
    const items = [
      buildTodoItem({ name: 'Done Task', checked: 1 }),
      buildTodoItem({ name: 'Open Task', checked: 0 }),
    ];
    render(<TodoListPanel tripId={1} items={items} />);
    // All filter by default shows only unchecked
    expect(screen.queryByText('Done Task')).not.toBeInTheDocument();
    expect(screen.getByText('Open Task')).toBeInTheDocument();
  });

  it('FE-COMP-TODO-006: Done filter shows only checked items', async () => {
    const user = userEvent.setup();
    const items = [
      buildTodoItem({ name: 'Completed Task', checked: 1 }),
      buildTodoItem({ name: 'Pending Task', checked: 0 }),
    ];
    render(<TodoListPanel tripId={1} items={items} />);
    // Find the Done filter button by title (mobile mode) or text (desktop)
    const doneBtn = screen.queryByTitle('Done') || screen.getAllByRole('button').find(
      b => b.textContent?.trim() === 'Done'
    );
    if (doneBtn) {
      await user.click(doneBtn);
      await screen.findByText('Completed Task');
      expect(screen.queryByText('Pending Task')).not.toBeInTheDocument();
    }
  });

  it('FE-COMP-TODO-007: shows P1 priority badge for priority=1 items', () => {
    const items = [buildTodoItem({ name: 'Urgent Task', priority: 1, checked: 0 })];
    render(<TodoListPanel tripId={1} items={items} />);
    expect(screen.getByText('P1')).toBeInTheDocument();
  });

  it('FE-COMP-TODO-008: shows P2 priority badge for priority=2 items', () => {
    const items = [buildTodoItem({ name: 'Normal Task', priority: 2, checked: 0 })];
    render(<TodoListPanel tripId={1} items={items} />);
    expect(screen.getByText('P2')).toBeInTheDocument();
  });

  it('FE-COMP-TODO-009: items with no priority show no priority badge', () => {
    const items = [buildTodoItem({ name: 'Low Priority', priority: 0, checked: 0 })];
    render(<TodoListPanel tripId={1} items={items} />);
    expect(screen.queryByText('P1')).not.toBeInTheDocument();
    expect(screen.queryByText('P2')).not.toBeInTheDocument();
    expect(screen.queryByText('P3')).not.toBeInTheDocument();
  });

  it('FE-COMP-TODO-010: progress bar shows completion percentage', () => {
    const items = [
      buildTodoItem({ name: 'Done Task', checked: 1 }),
      buildTodoItem({ name: 'Open Task', checked: 0 }),
    ];
    render(<TodoListPanel tripId={1} items={items} />);
    // 1/2 = 50% completed
    expect(screen.getByText(/50%/)).toBeInTheDocument();
    expect(screen.getByText(/1 \/ 2 completed/i)).toBeInTheDocument();
  });

  it('FE-COMP-TODO-011: raising addItemSignal opens detail form with Create task button', async () => {
    const { rerender } = render(<TodoListPanel tripId={1} items={[]} addItemSignal={0} />);
    rerender(<TodoListPanel tripId={1} items={[]} addItemSignal={1} />);
    expect(await screen.findByText('Create task')).toBeInTheDocument();
  });

  it('FE-COMP-TODO-012: toggling item calls toggleTodoItem action', async () => {
    const user = userEvent.setup();
    let putCalled = false;
    server.use(
      http.put('/api/trips/1/todo/:id', () => {
        putCalled = true;
        return HttpResponse.json({ success: true });
      })
    );
    const items = [buildTodoItem({ id: 5, name: 'Toggle Me', checked: 0 })];
    render(<TodoListPanel tripId={1} items={items} />);
    // The checkbox is the row's own <button>; the row around it is a button role.
    const row = screen.getByText('Toggle Me').closest('[role="button"]') as HTMLElement;
    const checkboxBtn = row.querySelector('button') as HTMLElement;

    await user.click(checkboxBtn);

    await waitFor(() => expect(putCalled).toBe(true));
  });

  it('FE-COMP-TODO-013: clicking a task row opens its detail pane', async () => {
    const user = userEvent.setup();
    const items = [buildTodoItem({ id: 7, name: 'Click Me', checked: 0 })];
    render(<TodoListPanel tripId={1} items={items} />);
    await user.click(screen.getByText('Click Me'));
    // Detail pane should open showing the task title
    expect(await screen.findByText('Task')).toBeInTheDocument();
  });

  it('FE-COMP-TODO-014: category filter appears in sidebar for items with categories', () => {
    const items = [buildTodoItem({ name: 'JobTask', category: 'JobCat', checked: 0 })];
    render(<TodoListPanel tripId={1} items={items} />);
    // The category filter button shows category name (as text or title)
    const catEls = screen.getAllByText(/JobCat/);
    expect(catEls.length).toBeGreaterThan(0);
  });

  it('FE-COMP-TODO-015: category filter button is accessible and clickable', async () => {
    const user = userEvent.setup();
    const items = [
      buildTodoItem({ name: 'JobTask', category: 'JobCat', checked: 0 }),
      buildTodoItem({ name: 'HomeTask', category: 'HomeCat', checked: 0 }),
    ];
    render(<TodoListPanel tripId={1} items={items} />);
    // Both visible initially in 'all' filter (shows unchecked)
    expect(screen.getByText('JobTask')).toBeInTheDocument();
    expect(screen.getByText('HomeTask')).toBeInTheDocument();
    // Category buttons exist in sidebar (by accessible name or text)
    const catBtn = sidebarButton(/JobCat/);
    expect(catBtn).toBeInTheDocument();
    // Clicking the category button should work without throwing
    await user.click(catBtn);
    // Task with category 'JobCat' remains visible
    expect(screen.getByText('JobTask')).toBeInTheDocument();
  });

  it('FE-COMP-TODO-016: Overdue filter shows items with past due_date', async () => {
    const items = [
      buildTodoItem({ name: 'Overdue Task', checked: 0, due_date: '2020-01-01' }),
      buildTodoItem({ name: 'Future Task', checked: 0, due_date: '2099-12-31' }),
    ];
    render(<TodoListPanel tripId={1} items={items} />);
    const overdueBtn = screen.getAllByRole('button').find(
      b => b.textContent?.includes('Overdue') || b.getAttribute('title') === 'Overdue'
    );
    expect(overdueBtn).toBeTruthy();
    fireEvent.click(overdueBtn!);
    expect(screen.getByText('Overdue Task')).toBeInTheDocument();
    expect(screen.queryByText('Future Task')).not.toBeInTheDocument();
  });

  it('FE-COMP-TODO-079: Overdue uses the local calendar day, not the UTC one', () => {
    // Freeze on an instant whose UTC date differs from the local one, so a UTC-derived
    // "today" would move the cut-off a day in whichever direction this runner sits.
    const offset = new Date(2026, 4, 15, 12).getTimezoneOffset();
    vi.useFakeTimers({ toFake: ['Date'] });
    vi.setSystemTime(new Date(2026, 4, 15, offset > 0 ? 23 : 0, 30));
    const items = [
      buildTodoItem({ id: 1, name: 'Due Today', checked: 0, due_date: '2026-05-15' }),
      buildTodoItem({ id: 2, name: 'Due Yesterday', checked: 0, due_date: '2026-05-14' }),
    ];
    render(<TodoListPanel tripId={1} items={items} />);
    const overdueBtn = screen.getAllByRole('button').find(
      b => b.textContent?.includes('Overdue') || b.getAttribute('title') === 'Overdue'
    );
    fireEvent.click(overdueBtn!);
    expect(screen.getByText('Due Yesterday')).toBeInTheDocument();
    expect(screen.queryByText('Due Today')).not.toBeInTheDocument();
  });

  it('FE-COMP-TODO-017: My Tasks filter shows only items assigned to current user', async () => {
    // Use default current_user_id: 1 from beforeEach; assign one item to user 1
    const items = [
      buildTodoItem({ name: 'Mine', assigned_user_id: 1, checked: 0 }),
      buildTodoItem({ name: 'Others', assigned_user_id: 9, checked: 0 }),
    ];
    render(<TodoListPanel tripId={1} items={items} />);
    // Wait for members API to resolve and set currentUserId=1 (My Tasks count badge shows 1)
    await waitFor(() => {
      const btns = screen.getAllByRole('button');
      const btn = btns.find(b => b.textContent?.includes('My Tasks'));
      expect(btn?.textContent).toMatch(/1/);
    }, { timeout: 3000 });
    const myBtn = screen.getAllByRole('button').find(
      b => b.textContent?.includes('My Tasks') || b.getAttribute('title') === 'My Tasks'
    );
    expect(myBtn).toBeTruthy();
    fireEvent.click(myBtn!);
    expect(screen.getByText('Mine')).toBeInTheDocument();
    expect(screen.queryByText('Others')).not.toBeInTheDocument();
  });

  it('FE-COMP-TODO-018: Sort by priority button reorders tasks', async () => {
    const user = userEvent.setup();
    const items = [
      buildTodoItem({ name: 'Low Prio', priority: 3, checked: 0 }),
      buildTodoItem({ name: 'High Prio', priority: 1, checked: 0 }),
    ];
    render(<TodoListPanel tripId={1} items={items} />);
    const sortBtn = screen.getAllByRole('button').find(
      b => b.textContent?.includes('Priority') || b.getAttribute('title') === 'Priority'
    );
    expect(sortBtn).toBeTruthy();
    await user.click(sortBtn!);
    const html = document.body.innerHTML;
    expect(html.indexOf('High Prio')).toBeLessThan(html.indexOf('Low Prio'));
  });

  it('FE-COMP-TODO-019: Detail pane shows task name and allows editing', async () => {
    const user = userEvent.setup();
    const items = [buildTodoItem({ id: 11, name: 'Edit Me', checked: 0 })];
    render(<TodoListPanel tripId={1} items={items} />);
    await user.click(screen.getByText('Edit Me'));
    // Detail pane opens; the name input should have the task's name
    await waitFor(() => {
      const input = screen.getByDisplayValue('Edit Me');
      expect(input).toBeInTheDocument();
    });
  });

  it('FE-COMP-TODO-020: Saving task name in detail pane calls PUT API', async () => {
    const user = userEvent.setup();
    let putCalled = false;
    server.use(
      http.put('/api/trips/1/todo/11', () => {
        putCalled = true;
        return HttpResponse.json({ item: buildTodoItem({ id: 11, name: 'Renamed' }) });
      }),
    );
    const items = [buildTodoItem({ id: 11, name: 'Edit Me', checked: 0 })];
    render(<TodoListPanel tripId={1} items={items} />);
    await user.click(screen.getByText('Edit Me'));
    // Wait for detail pane to open
    const nameInput = await screen.findByDisplayValue('Edit Me');
    await user.clear(nameInput);
    await user.type(nameInput, 'Renamed');
    // Click Save changes button
    const saveBtn = screen.getAllByRole('button').find(
      b => b.textContent?.includes('Save changes') || b.textContent?.includes('Save')
    );
    if (saveBtn) {
      await user.click(saveBtn);
      await waitFor(() => expect(putCalled).toBe(true));
    }
  });

  it('FE-COMP-TODO-021: Priority P3 badge is shown for priority=3 items', () => {
    const items = [buildTodoItem({ name: 'Low Task', priority: 3, checked: 0 })];
    render(<TodoListPanel tripId={1} items={items} />);
    expect(screen.getByText('P3')).toBeInTheDocument();
  });

  it('FE-COMP-TODO-022: Deleting a task from the detail pane calls delete API and closes pane', async () => {
    const user = userEvent.setup();
    let deleteCalled = false;
    server.use(
      http.delete('/api/trips/1/todo/20', () => {
        deleteCalled = true;
        return HttpResponse.json({ success: true });
      }),
    );
    const items = [buildTodoItem({ id: 20, name: 'Delete Me', checked: 0 })];
    render(<TodoListPanel tripId={1} items={items} />);
    await user.click(screen.getByText('Delete Me'));
    // Wait for detail pane to open
    const deleteBtn = await screen.findByText('Delete');
    await user.click(deleteBtn);
    // API was called and detail pane closed (Save changes button disappears)
    await waitFor(() => {
      expect(deleteCalled).toBe(true);
      expect(screen.queryByText('Save changes')).not.toBeInTheDocument();
    });
  });

  it('FE-COMP-TODO-023: Due date is shown in task list row when set', () => {
    const items = [buildTodoItem({ name: 'Due Task', due_date: '2030-06-15', checked: 0 })];
    render(<TodoListPanel tripId={1} items={items} />);
    // formatDate returns locale-specific string (e.g., "Sat, Jun 15") — check for month/day
    const html = document.body.innerHTML;
    // The date badge should contain Jun 15 or similar representation
    expect(html).toMatch(/Jun/);
    expect(html).toMatch(/15/);
  });

  it('FE-COMP-TODO-024: Closing the detail pane via X button hides it', async () => {
    const user = userEvent.setup();
    const items = [buildTodoItem({ id: 30, name: 'Close Pane Task', checked: 0 })];
    render(<TodoListPanel tripId={1} items={items} />);
    await user.click(screen.getByText('Close Pane Task'));
    // Wait for detail pane to appear (shows "Task" header and "Save changes")
    await screen.findByText('Task');
    // Find the X close button in the detail pane
    const allButtons = screen.getAllByRole('button');
    // The X button in the detail pane header has no text content (just icon)
    // It appears after the task row, so find buttons near the detail pane header
    // The detail pane has a header with title "Task" and an X button
    // We look for a button that closes the pane by finding ones with no text
    const closeBtn = allButtons.find(b => {
      const text = b.textContent?.trim();
      return text === '' && b.closest('[style*="border-left"]');
    });
    if (closeBtn) {
      await user.click(closeBtn);
      await waitFor(() => expect(screen.queryByText('Save changes')).not.toBeInTheDocument());
    }
  });

  it('FE-COMP-TODO-025: New list input appears when clicking "Add list" button', async () => {
    const user = userEvent.setup();
    render(<TodoListPanel tripId={1} items={[]} />);
    // Find and click the "Add list" button
    const addCatBtn = screen.getAllByRole('button').find(
      b => b.textContent?.includes('Add list') || b.getAttribute('title') === 'Add list'
    );
    expect(addCatBtn).toBeTruthy();
    await user.click(addCatBtn!);
    // A text input for category name should appear
    await waitFor(() => {
      const input = screen.getByPlaceholderText('List name');
      expect(input).toBeInTheDocument();
    });
  });

  it('FE-COMP-TODO-026: Adding a new list creates a filter button for it', async () => {
    const user = userEvent.setup();
    server.use(
      http.post('/api/trips/1/todo', () =>
        HttpResponse.json({ item: buildTodoItem({ category: 'Errands', name: 'New Item' }) })
      ),
    );
    render(<TodoListPanel tripId={1} items={[]} />);
    const addCatBtn = screen.getAllByRole('button').find(
      b => b.textContent?.includes('Add list') || b.getAttribute('title') === 'Add list'
    );
    await user.click(addCatBtn!);
    const categoryInput = await screen.findByPlaceholderText('List name');
    await user.type(categoryInput, 'Errands');
    await user.keyboard('{Enter}');
    // The Errands filter button should appear after the API call
    await waitFor(() => {
      const errands = screen.queryAllByText('Errands');
      expect(errands.length).toBeGreaterThan(0);
    });
  });

  it('FE-COMP-TODO-027: Overdue count badge appears on Overdue filter for overdue items', () => {
    const items = [buildTodoItem({ name: 'Old Task', checked: 0, due_date: '2020-01-01' })];
    render(<TodoListPanel tripId={1} items={items} />);
    // The overdue count badge '1' should appear near the Overdue filter button
    const overdueArea = screen.getAllByRole('button').find(
      b => b.textContent?.includes('Overdue') || b.getAttribute('title') === 'Overdue'
    );
    expect(overdueArea).toBeTruthy();
    // The count badge with '1' should be in the DOM (rendered inside the sidebar button)
    expect(overdueArea!.textContent).toMatch(/1/);
  });

  it('FE-COMP-TODO-028: Creating a new task via NewTaskPane calls POST API', async () => {
    const user = userEvent.setup();
    let postCalled = false;
    server.use(
      http.post('/api/trips/1/todo', () => {
        postCalled = true;
        return HttpResponse.json({ item: buildTodoItem({ id: 99, name: 'Brand New Task' }) });
      }),
    );
    const { rerender } = render(<TodoListPanel tripId={1} items={[]} addItemSignal={0} />);
    // Raising the signal opens the new task pane (simulates the toolbar button click)
    rerender(<TodoListPanel tripId={1} items={[]} addItemSignal={1} />);
    await screen.findByText('Create task');
    const nameInput = screen.getByPlaceholderText('Task name');
    await user.type(nameInput, 'Brand New Task');
    await user.click(screen.getByText('Create task'));
    await waitFor(() => expect(postCalled).toBe(true));
  });

  it('FE-COMP-TODO-029: Task with description shows description preview in list', () => {
    const items = [buildTodoItem({
      name: 'Described Task',
      description: 'This is a task description',
      checked: 0,
    })];
    render(<TodoListPanel tripId={1} items={items} />);
    expect(screen.getByText('This is a task description')).toBeInTheDocument();
  });
});

// ── Members served to the detail/new panes (owner + a member + a guest) ────────
const MEMBERS_RESPONSE = {
  owner: { id: 1, username: 'alice', avatar: null },
  members: [
    { id: 2, username: 'bob', avatar: 'bob.png' },
    { id: 3, username: 'gus', avatar: null, is_guest: true },
  ],
  current_user_id: 1,
};

function withMembers() {
  server.use(http.get('/api/trips/:id/members', () => HttpResponse.json(MEMBERS_RESPONSE)));
}

function dragOverRow(row: Element) {
  fireEvent.dragOver(row, { dataTransfer: { dropEffect: '' } });
}

/** Pick an option out of the CustomSelect dropdown, which renders into a body portal. */
function pickOption(label: string | RegExp) {
  const dropdown = document.querySelector('div[style*="z-index: 99999"]') as HTMLElement;
  fireEvent.click(within(dropdown).getByRole('button', { name: label }));
}

/**
 * The sidebar filters are an inline component, so every re-render (the members
 * fetch resolving, for one) swaps the button element. userEvent's async steps can
 * land on the detached node — fireEvent stays atomic.
 *
 * A task row is a button too (it is what selects the task), and its name is built
 * from everything it shows, category chip included. So the sidebar entry is picked
 * by being an actual <button>.
 */
function sidebarButton(name: RegExp | string): HTMLElement {
  const [button] = screen.getAllByRole('button', { name }).filter(el => el.tagName === 'BUTTON');
  expect(button).toBeDefined();
  return button;
}

function clickFilter(name: RegExp | string) {
  fireEvent.click(sidebarButton(name));
}

describe('TodoListPanel — sidebar', () => {
  it('FE-COMP-TODO-030: hovering an inactive filter highlights it and leaving clears it', () => {
    render(<TodoListPanel tripId={1} items={[]} />);
    const done = screen.getByRole('button', { name: /^Done/ });

    fireEvent.mouseEnter(done);
    expect(done.style.background).toBe('var(--bg-hover)');
    fireEvent.mouseLeave(done);
    expect(done.style.background).toBe('transparent');
  });

  it('FE-COMP-TODO-031: the active filter keeps its highlight on mouse-out', () => {
    render(<TodoListPanel tripId={1} items={[]} />);
    const all = screen.getByRole('button', { name: /^All/ });

    fireEvent.mouseLeave(all);
    // 'all' is the active filter, so the hover handlers must leave it alone.
    expect(all.style.background).toBe('var(--bg-hover)');
  });

  it('FE-COMP-TODO-032: hovering the priority sort toggles its background only while off', async () => {
    const user = userEvent.setup();
    render(<TodoListPanel tripId={1} items={[]} />);
    const sort = screen.getByRole('button', { name: 'Priority' });

    fireEvent.mouseEnter(sort);
    expect(sort.style.background).toBe('var(--bg-hover)');
    fireEvent.mouseLeave(sort);
    expect(sort.style.background).toBe('transparent');

    await user.click(sort);
    fireEvent.mouseEnter(sort);
    // Active sort keeps its amber tint instead of the neutral hover.
    expect(sort.style.background).toBe('rgba(245, 158, 11, 0.07)');
  });

  it('FE-COMP-TODO-033: Escape abandons the new-list input', async () => {
    const user = userEvent.setup();
    render(<TodoListPanel tripId={1} items={[]} />);

    await user.click(screen.getByRole('button', { name: 'Add list' }));
    const input = await screen.findByPlaceholderText('List name');
    await user.type(input, 'Errands');
    await user.keyboard('{Escape}');

    expect(screen.queryByPlaceholderText('List name')).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Add list' })).toBeInTheDocument();
  });

  it('FE-COMP-TODO-034: confirming a list that already exists just closes the input', async () => {
    const user = userEvent.setup();
    let posted = false;
    server.use(http.post('/api/trips/1/todo', () => { posted = true; return HttpResponse.json({ item: buildTodoItem() }); }));
    render(<TodoListPanel tripId={1} items={[buildTodoItem({ name: 'Task', category: 'Errands', checked: 0 })]} />);

    await user.click(screen.getByRole('button', { name: 'Add list' }));
    const input = await screen.findByPlaceholderText('List name');
    await user.type(input, 'Errands');
    fireEvent.click(input.nextElementSibling as HTMLElement);

    expect(posted).toBe(false);
    expect(screen.queryByPlaceholderText('List name')).not.toBeInTheDocument();
  });

  it('FE-COMP-TODO-035: without edit rights the list cannot be extended', () => {
    seedStore(usePermissionsStore, { permissions: { packing_edit: 'admin' } });
    render(<TodoListPanel tripId={1} items={[buildTodoItem({ name: 'Task', checked: 0 })]} />);

    expect(screen.queryByRole('button', { name: 'Add list' })).not.toBeInTheDocument();
  });

  it('FE-COMP-TODO-036: selecting a list filter titles the pane with the list name', () => {
    render(<TodoListPanel tripId={1} items={[buildTodoItem({ name: 'Task', category: 'Errands', checked: 0 })]} />);

    clickFilter(/Errands/);

    expect(screen.getByRole('heading', { name: 'Errands' })).toBeInTheDocument();
  });
});

describe('TodoListPanel — drag to reorder', () => {
  const rows = () => Array.from(document.querySelectorAll('[draggable="true"]')).map(h => h.parentElement!);

  it('FE-COMP-TODO-037: dropping a task onto another persists the new global order', async () => {
    let ordered: number[] | null = null;
    server.use(
      http.put('/api/trips/1/todo/reorder', async ({ request }) => {
        ordered = ((await request.json()) as { orderedIds: number[] }).orderedIds;
        return HttpResponse.json({ success: true });
      }),
    );
    const items = [
      buildTodoItem({ id: 1, name: 'First', checked: 0 }),
      buildTodoItem({ id: 2, name: 'Second', checked: 0 }),
      buildTodoItem({ id: 3, name: 'Done one', checked: 1 }),
      buildTodoItem({ id: 4, name: 'Third', checked: 0 }),
    ];
    render(<TodoListPanel tripId={1} items={items} />);

    const [first, , third] = rows();
    fireEvent.dragStart(document.querySelectorAll('[draggable="true"]')[0], { dataTransfer: { effectAllowed: '' } });
    dragOverRow(third);
    fireEvent.drop(third);

    // The checked task is filtered out of the view but keeps its slot in the payload.
    await waitFor(() => expect(ordered).toEqual([2, 4, 3, 1]));
    expect(first).toBeTruthy();
  });

  it('FE-COMP-TODO-038: dropping a task on itself changes nothing', async () => {
    let called = false;
    server.use(http.put('/api/trips/1/todo/reorder', () => { called = true; return HttpResponse.json({ success: true }); }));
    const items = [buildTodoItem({ id: 1, name: 'First', checked: 0 }), buildTodoItem({ id: 2, name: 'Second', checked: 0 })];
    render(<TodoListPanel tripId={1} items={items} />);

    const handles = document.querySelectorAll('[draggable="true"]');
    fireEvent.dragStart(handles[0], { dataTransfer: { effectAllowed: '' } });
    fireEvent.drop(handles[0].parentElement!);

    expect(called).toBe(false);
  });

  it('FE-COMP-TODO-039: ending a drag without a drop clears the drag state', () => {
    const items = [buildTodoItem({ id: 1, name: 'First', checked: 0 }), buildTodoItem({ id: 2, name: 'Second', checked: 0 })];
    render(<TodoListPanel tripId={1} items={items} />);

    const handles = document.querySelectorAll('[draggable="true"]');
    fireEvent.dragStart(handles[0], { dataTransfer: { effectAllowed: '' } });
    dragOverRow(handles[1].parentElement!);
    expect((handles[0].parentElement as HTMLElement).style.opacity).toBe('0.4');
    expect((handles[1].parentElement as HTMLElement).style.boxShadow).toBe('inset 3px 0 0 0 var(--accent)');

    fireEvent.dragEnd(handles[0]);
    expect((handles[0].parentElement as HTMLElement).style.opacity).toBe('1');
    expect((handles[1].parentElement as HTMLElement).style.boxShadow).toBe('none');
  });

  it('FE-COMP-TODO-040: sorting by priority disables the drag handles', async () => {
    const user = userEvent.setup();
    render(<TodoListPanel tripId={1} items={[buildTodoItem({ id: 1, name: 'First', checked: 0 })]} />);
    expect(document.querySelectorAll('[draggable="true"]')).toHaveLength(1);

    await user.click(screen.getByRole('button', { name: 'Priority' }));

    expect(document.querySelectorAll('[draggable="true"]')).toHaveLength(0);
  });
});

describe('TodoListPanel — detail pane', () => {
  const openDetail = async (user: ReturnType<typeof userEvent.setup>, item = buildTodoItem({ id: 40, name: 'Plan route', checked: 0 })) => {
    render(<TodoListPanel tripId={1} items={[item]} />);
    await user.click(screen.getByText(item.name));
    await screen.findByText('Task');
  };

  it('FE-COMP-TODO-041: description, priority and due date are saved together', async () => {
    const user = userEvent.setup();
    withMembers();
    let put: Record<string, unknown> | null = null;
    server.use(
      http.put('/api/trips/1/todo/40', async ({ request }) => {
        put = (await request.json()) as Record<string, unknown>;
        return HttpResponse.json({ item: buildTodoItem({ id: 40, name: 'Plan route' }) });
      }),
    );
    await openDetail(user);

    await user.type(screen.getByPlaceholderText('Description (optional)'), 'via the coast');
    await user.click(screen.getByRole('button', { name: 'P2' }));
    await user.click(screen.getByRole('button', { name: 'Date' }));
    await user.click(screen.getAllByRole('button').find(b => b.textContent?.trim() === '12')!);
    await user.click(screen.getByRole('button', { name: 'Save changes' }));

    await waitFor(() => expect(put).toBeTruthy());
    expect(put!.description).toBe('via the coast');
    expect(put!.priority).toBe(2);
    expect(String(put!.due_date)).toMatch(/^\d{4}-\d{2}-12$/);
  });

  it('FE-COMP-TODO-042: the + button swaps the list select for a free-text field', async () => {
    const user = userEvent.setup();
    withMembers();
    let put: Record<string, unknown> | null = null;
    server.use(
      http.put('/api/trips/1/todo/40', async ({ request }) => {
        put = (await request.json()) as Record<string, unknown>;
        return HttpResponse.json({ item: buildTodoItem({ id: 40, name: 'Plan route' }) });
      }),
    );
    await openDetail(user);

    await user.click(screen.getByRole('button', { name: 'List name' }));
    await user.type(await screen.findByPlaceholderText('List name'), 'Logistics');
    await user.keyboard('{Enter}');

    // Enter closes the inline editor and the typed list is offered as a new option.
    expect(screen.queryByPlaceholderText('List name')).not.toBeInTheDocument();
    expect(screen.getByText(/^Logistics/)).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Save changes' }));
    await waitFor(() => expect(put).toBeTruthy());
    expect(put!.category).toBe('Logistics');
  });

  it('FE-COMP-TODO-043: Escape in the inline list editor clears the typed list', async () => {
    const user = userEvent.setup();
    withMembers();
    await openDetail(user);

    await user.click(screen.getByRole('button', { name: 'List name' }));
    await user.type(await screen.findByPlaceholderText('List name'), 'Logistics');
    await user.keyboard('{Escape}');

    expect(screen.queryByPlaceholderText('List name')).not.toBeInTheDocument();
    expect(screen.queryByText('Logistics')).not.toBeInTheDocument();
    // Nothing changed, so saving stays disabled.
    expect(screen.getByRole('button', { name: 'Save changes' })).toBeDisabled();
  });

  it('FE-COMP-TODO-044: picking an existing list from the dropdown marks the task changed', async () => {
    const user = userEvent.setup();
    withMembers();
    render(<TodoListPanel tripId={1} items={[
      buildTodoItem({ id: 40, name: 'Plan route', checked: 0 }),
      buildTodoItem({ id: 41, name: 'Other', category: 'Errands', checked: 0 }),
    ]} />);
    await user.click(screen.getByText('Plan route'));
    await screen.findByText('Task');

    const pane = screen.getByText('Task').closest('div[style*="border-left"]') as HTMLElement;
    await user.click(within(pane).getByRole('button', { name: 'No list' }));
    pickOption('Errands');

    expect(screen.getByRole('button', { name: 'Save changes' })).not.toBeDisabled();
  });

  it('FE-COMP-TODO-045: a guest assignee is labelled as a guest and persisted', async () => {
    const user = userEvent.setup();
    withMembers();
    let put: Record<string, unknown> | null = null;
    server.use(
      http.put('/api/trips/1/todo/40', async ({ request }) => {
        put = (await request.json()) as Record<string, unknown>;
        return HttpResponse.json({ item: buildTodoItem({ id: 40, name: 'Plan route' }) });
      }),
    );
    await openDetail(user);
    await screen.findByRole('button', { name: 'Unassigned' });

    await user.click(screen.getByRole('button', { name: 'Unassigned' }));
    await user.click(await screen.findByRole('button', { name: /gus · Guest/ }));
    await user.click(screen.getByRole('button', { name: 'Save changes' }));

    await waitFor(() => expect(put).toBeTruthy());
    expect(put!.assigned_user_id).toBe(3);
  });

  it('FE-COMP-TODO-046: a failing save surfaces the error as a toast', async () => {
    const user = userEvent.setup();
    const addToast = vi.fn();
    window.__addToast = addToast as unknown as typeof window.__addToast;
    server.use(http.put('/api/trips/1/todo/40', () => HttpResponse.json({ error: 'Nope' }, { status: 500 })));
    await openDetail(user);

    const nameInput = screen.getByDisplayValue('Plan route');
    await user.clear(nameInput);
    await user.type(nameInput, 'Renamed');
    await user.click(screen.getByRole('button', { name: 'Save changes' }));

    await waitFor(() => expect(addToast).toHaveBeenCalledWith('Nope', 'error', undefined));
    delete window.__addToast;
  });

  it('FE-COMP-TODO-047: a failing delete surfaces the error and keeps the pane open', async () => {
    const user = userEvent.setup();
    const addToast = vi.fn();
    window.__addToast = addToast as unknown as typeof window.__addToast;
    server.use(http.delete('/api/trips/1/todo/40', () => HttpResponse.json({ error: 'Locked' }, { status: 409 })));
    await openDetail(user);

    await user.click(screen.getByRole('button', { name: 'Delete' }));

    await waitFor(() => expect(addToast).toHaveBeenCalledWith('Locked', 'error', undefined));
    expect(screen.getByRole('button', { name: 'Save changes' })).toBeInTheDocument();
    delete window.__addToast;
  });

  it('FE-COMP-TODO-048: a read-only viewer gets no save or delete actions', async () => {
    const user = userEvent.setup();
    seedStore(usePermissionsStore, { permissions: { packing_edit: 'admin' } });
    await openDetail(user);

    expect(screen.queryByRole('button', { name: 'Save changes' })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Delete' })).not.toBeInTheDocument();
    expect(screen.getByDisplayValue('Plan route')).toBeDisabled();
  });

  it('FE-COMP-TODO-049: switching the selected task reloads the pane fields', async () => {
    const user = userEvent.setup();
    withMembers();
    render(<TodoListPanel tripId={1} items={[
      buildTodoItem({ id: 40, name: 'Plan route', description: 'coast', checked: 0 }),
      buildTodoItem({ id: 41, name: 'Book ferry', description: null, checked: 0 }),
    ]} />);

    await user.click(screen.getByText('Plan route'));
    expect(await screen.findByDisplayValue('coast')).toBeInTheDocument();

    await user.click(screen.getByText('Book ferry'));
    await waitFor(() => expect(screen.queryByDisplayValue('coast')).not.toBeInTheDocument());
    expect(screen.getByDisplayValue('Book ferry')).toBeInTheDocument();
  });
});

describe('TodoListPanel — new task pane', () => {
  const openNew = async (items = [] as ReturnType<typeof buildTodoItem>[]) => {
    const { rerender } = render(<TodoListPanel tripId={1} items={items} addItemSignal={0} />);
    rerender(<TodoListPanel tripId={1} items={items} addItemSignal={1} />);
    await screen.findByText('Create task');
    return rerender;
  };

  it('FE-COMP-TODO-050: Enter in the name field creates the task', async () => {
    const user = userEvent.setup();
    let posted: Record<string, unknown> | null = null;
    server.use(
      http.post('/api/trips/1/todo', async ({ request }) => {
        posted = (await request.json()) as Record<string, unknown>;
        return HttpResponse.json({ item: buildTodoItem({ id: 77, name: 'Pack bags' }) });
      }),
    );
    await openNew();

    await user.type(screen.getByPlaceholderText('Task name'), 'Pack bags{Enter}');

    await waitFor(() => expect(posted).toBeTruthy());
    expect(posted!.name).toBe('Pack bags');
    // A created task closes the pane and becomes the selection.
    await waitFor(() => expect(screen.queryByText('Create task')).not.toBeInTheDocument());
  });

  it('FE-COMP-TODO-051: an empty name neither posts nor enables the button', async () => {
    const user = userEvent.setup();
    let posted = false;
    server.use(http.post('/api/trips/1/todo', () => { posted = true; return HttpResponse.json({ item: buildTodoItem() }); }));
    await openNew();

    await user.type(screen.getByPlaceholderText('Task name'), '{Enter}');

    expect(screen.getByRole('button', { name: 'Create task' })).toBeDisabled();
    expect(posted).toBe(false);
  });

  it('FE-COMP-TODO-052: description, list, priority, due date and assignee are all posted', async () => {
    const user = userEvent.setup();
    withMembers();
    let posted: Record<string, unknown> | null = null;
    server.use(
      http.post('/api/trips/1/todo', async ({ request }) => {
        posted = (await request.json()) as Record<string, unknown>;
        return HttpResponse.json({ item: buildTodoItem({ id: 78, name: 'Pack bags' }) });
      }),
    );
    await openNew();
    await screen.findByRole('button', { name: 'Unassigned' });

    await user.type(screen.getByPlaceholderText('Task name'), 'Pack bags');
    await user.type(screen.getByPlaceholderText('Description (optional)'), 'rain gear');
    await user.click(screen.getByRole('button', { name: 'List name' }));
    await user.type(await screen.findByPlaceholderText('List name'), 'Prep ');
    await user.keyboard('{Enter}');
    await user.click(screen.getByRole('button', { name: 'P1' }));
    await user.click(screen.getByRole('button', { name: 'Date' }));
    await user.click(screen.getAllByRole('button').find(b => b.textContent?.trim() === '9')!);
    await user.click(screen.getByRole('button', { name: 'Unassigned' }));
    pickOption('bob');
    await user.click(screen.getByRole('button', { name: 'Create task' }));

    await waitFor(() => expect(posted).toBeTruthy());
    expect(posted!.description).toBe('rain gear');
    expect(posted!.category).toBe('Prep'); // trimmed
    expect(posted!.priority).toBe(1);
    expect(posted!.assigned_user_id).toBe(2);
    expect(String(posted!.due_date)).toMatch(/^\d{4}-\d{2}-09$/);
  });

  it('FE-COMP-TODO-053: Escape in the inline list editor drops the typed list', async () => {
    const user = userEvent.setup();
    await openNew();

    await user.click(screen.getByRole('button', { name: 'List name' }));
    await user.type(await screen.findByPlaceholderText('List name'), 'Prep');
    await user.keyboard('{Escape}');

    expect(screen.queryByPlaceholderText('List name')).not.toBeInTheDocument();
    expect(screen.queryByText('Prep')).not.toBeInTheDocument();
  });

  it('FE-COMP-TODO-054: the active list filter preselects the new task’s list', async () => {
    const items = [buildTodoItem({ id: 60, name: 'Task', category: 'Errands', checked: 0 })];
    const { rerender } = render(<TodoListPanel tripId={1} items={items} addItemSignal={0} />);
    clickFilter(/Errands/);
    rerender(<TodoListPanel tripId={1} items={items} addItemSignal={1} />);
    await screen.findByText('Create task');

    const pane = document.querySelector('.trek-modal-backdrop') as HTMLElement;
    expect(within(pane).getByRole('button', { name: 'Errands' })).toBeInTheDocument();
  });

  it('FE-COMP-TODO-055: a failing create surfaces the error as a toast', async () => {
    const user = userEvent.setup();
    const addToast = vi.fn();
    window.__addToast = addToast as unknown as typeof window.__addToast;
    server.use(http.post('/api/trips/1/todo', () => HttpResponse.json({ error: 'Rejected' }, { status: 400 })));
    await openNew();

    await user.type(screen.getByPlaceholderText('Task name'), 'Pack bags');
    await user.click(screen.getByRole('button', { name: 'Create task' }));

    await waitFor(() => expect(addToast).toHaveBeenCalledWith('Rejected', 'error', undefined));
    // The pane stays open so the user can retry.
    expect(screen.getByRole('button', { name: 'Create task' })).toBeInTheDocument();
    delete window.__addToast;
  });

  it('FE-COMP-TODO-056: closing the new task pane via the backdrop discards it', async () => {
    const user = userEvent.setup();
    await openNew();

    await user.click(document.querySelector('.trek-modal-backdrop')!);

    expect(screen.queryByText('Create task')).not.toBeInTheDocument();
  });
});

describe('TodoListPanel — mobile layout', () => {
  beforeEach(() => {
    Object.defineProperty(window, 'innerWidth', { value: 500, writable: true, configurable: true });
  });

  it('FE-COMP-TODO-057: the sidebar collapses to icons without the progress card', () => {
    render(<TodoListPanel tripId={1} items={[buildTodoItem({ name: 'Task', checked: 1 })]} />);

    expect(screen.queryByText('Tasks')).not.toBeInTheDocument();
    expect(screen.queryByText(/completed/)).not.toBeInTheDocument();
    // Labels move into titles so the icons stay tappable.
    expect(screen.getByTitle('All')).toBeInTheDocument();
    expect(screen.getByTitle('Priority')).toBeInTheDocument();
    expect(screen.getByTitle('Add list')).toBeInTheDocument();
  });

  it('FE-COMP-TODO-058: an open task opens as a bottom sheet that the backdrop closes', async () => {
    const user = userEvent.setup();
    render(<TodoListPanel tripId={1} items={[buildTodoItem({ id: 50, name: 'Plan route', checked: 0 })]} />);

    await user.click(screen.getByText('Plan route'));
    const sheet = await screen.findByText('Task');
    const backdrop = sheet.closest('div[style*="position: fixed"]') as HTMLElement;
    expect(backdrop).toBeTruthy();

    await user.click(backdrop);
    await waitFor(() => expect(screen.queryByText('Save changes')).not.toBeInTheDocument());
  });

  it('FE-COMP-TODO-059: the new task pane opens as a bottom sheet', async () => {
    const user = userEvent.setup();
    const { rerender } = render(<TodoListPanel tripId={1} items={[]} addItemSignal={0} />);
    rerender(<TodoListPanel tripId={1} items={[]} addItemSignal={1} />);
    await screen.findByText('Create task');

    const backdrop = document.querySelector('.trek-modal-backdrop') as HTMLElement;
    expect(backdrop.style.alignItems).toBe('flex-end');

    await user.click(backdrop);
    expect(screen.queryByText('Create task')).not.toBeInTheDocument();
  });

  it('FE-COMP-TODO-060: mobile filters show their counts as corner badges', () => {
    render(<TodoListPanel tripId={1} items={[buildTodoItem({ name: 'Old', checked: 0, due_date: '2020-01-01' })]} />);

    expect(within(screen.getByTitle('Overdue')).getByText('1')).toBeInTheDocument();
  });

  it('FE-COMP-TODO-074: list filters keep their colour dot but drop their label', () => {
    render(<TodoListPanel tripId={1} items={[buildTodoItem({ name: 'Task', category: 'Errands', checked: 0 })]} />);

    const filters = screen.getAllByRole('button');
    const listFilter = filters.find(b => b.getAttribute('title') === 'Errands')!;
    expect(listFilter).toBeInTheDocument();
    expect(listFilter.textContent).toBe('1');
    expect((listFilter.firstElementChild as HTMLElement).style.background).toBe('rgb(59, 130, 246)');
  });

  it('FE-COMP-TODO-075: the detail sheet closes via its own X and ignores taps inside it', async () => {
    const user = userEvent.setup();
    render(<TodoListPanel tripId={1} items={[buildTodoItem({ id: 50, name: 'Plan route', checked: 0 })]} />);

    await user.click(screen.getByText('Plan route'));
    const header = await screen.findByText('Task');

    await user.click(header);
    expect(screen.getByText('Save changes')).toBeInTheDocument();

    await user.click(header.parentElement!.querySelectorAll('button')[0]);
    await waitFor(() => expect(screen.queryByText('Save changes')).not.toBeInTheDocument());
  });

  it('FE-COMP-TODO-076: creating from the mobile sheet closes it and selects the new task', async () => {
    const user = userEvent.setup();
    server.use(http.post('/api/trips/1/todo', () => HttpResponse.json({ item: buildTodoItem({ id: 90, name: 'Pack bags' }) })));
    const items = [buildTodoItem({ id: 90, name: 'Pack bags', checked: 0 })];
    const { rerender } = render(<TodoListPanel tripId={1} items={items} addItemSignal={0} />);
    rerender(<TodoListPanel tripId={1} items={items} addItemSignal={1} />);
    await screen.findByText('Create task');

    await user.type(screen.getByPlaceholderText('Task name'), 'Pack bags');
    await user.click(screen.getByRole('button', { name: 'Create task' }));

    // onCreated closes the sheet and opens the detail sheet on the created task.
    await screen.findByText('Task');
    expect(screen.queryByText('Create task')).not.toBeInTheDocument();
  });

  it('FE-COMP-TODO-077: the mobile new task sheet closes via its own X', async () => {
    const user = userEvent.setup();
    const { rerender } = render(<TodoListPanel tripId={1} items={[]} addItemSignal={0} />);
    rerender(<TodoListPanel tripId={1} items={[]} addItemSignal={1} />);
    const header = await screen.findByText('New task');

    await user.click(header);
    expect(screen.getByText('Create task')).toBeInTheDocument();

    await user.click(header.parentElement!.querySelectorAll('button')[0]);
    expect(screen.queryByText('Create task')).not.toBeInTheDocument();
  });

  it('FE-COMP-TODO-078: the mobile new task sheet inherits the active list filter', async () => {
    const items = [buildTodoItem({ id: 60, name: 'Task', category: 'Errands', checked: 0 })];
    const { rerender } = render(<TodoListPanel tripId={1} items={items} addItemSignal={0} />);
    // On mobile the list filter is icon-only, so the label lives in the title.
    fireEvent.click(screen.getByTitle('Errands'));
    rerender(<TodoListPanel tripId={1} items={items} addItemSignal={1} />);
    await screen.findByText('Create task');

    const pane = document.querySelector('.trek-modal-backdrop') as HTMLElement;
    expect(within(pane).getByRole('button', { name: 'Errands' })).toBeInTheDocument();
  });
});

describe('TodoListPanel — remaining paths', () => {
  it('FE-COMP-TODO-062: ticking a task writes the new checked state back', async () => {
    let put: Record<string, unknown> | null = null;
    server.use(
      http.put('/api/trips/1/todo/5', async ({ request }) => {
        put = (await request.json()) as Record<string, unknown>;
        return HttpResponse.json({ item: buildTodoItem({ id: 5, name: 'Toggle', checked: 1 }) });
      }),
    );
    render(<TodoListPanel tripId={1} items={[buildTodoItem({ id: 5, name: 'Toggle', checked: 0 })]} />);

    const row = screen.getByText('Toggle').closest('div[style*="cursor: pointer"]') as HTMLElement;
    fireEvent.click(within(row).getAllByRole('button')[0]);

    await waitFor(() => expect(put).toEqual({ checked: true }));
  });

  it('FE-COMP-TODO-063: a task dragged out of the current view is not reordered', () => {
    let called = false;
    server.use(http.put('/api/trips/1/todo/reorder', () => { called = true; return HttpResponse.json({ success: true }); }));
    render(<TodoListPanel tripId={1} items={[
      buildTodoItem({ id: 1, name: 'Loose', checked: 0 }),
      buildTodoItem({ id: 2, name: 'Filed', category: 'Errands', checked: 0 }),
    ]} />);

    fireEvent.dragStart(document.querySelectorAll('[draggable="true"]')[0], { dataTransfer: { effectAllowed: '' } });
    clickFilter(/Errands/);
    fireEvent.drop(document.querySelectorAll('[draggable="true"]')[0].parentElement!);

    expect(called).toBe(false);
  });

  it('FE-COMP-TODO-064: hovering the active filter and the active sort leaves them styled', async () => {
    const user = userEvent.setup();
    render(<TodoListPanel tripId={1} items={[]} />);

    const all = screen.getByRole('button', { name: /^All/ });
    fireEvent.mouseEnter(all);
    expect(all.style.background).toBe('var(--bg-hover)');

    const sort = screen.getByRole('button', { name: 'Priority' });
    await user.click(sort);
    fireEvent.mouseLeave(sort);
    expect(sort.style.background).toBe('rgba(245, 158, 11, 0.07)');
  });

  it('FE-COMP-TODO-065: clearing the task name blocks the save', async () => {
    const user = userEvent.setup();
    let put = false;
    server.use(http.put('/api/trips/1/todo/40', () => { put = true; return HttpResponse.json({ item: buildTodoItem({ id: 40 }) }); }));
    render(<TodoListPanel tripId={1} items={[buildTodoItem({ id: 40, name: 'Plan route', checked: 0 })]} />);
    await user.click(screen.getByText('Plan route'));

    await user.clear(await screen.findByDisplayValue('Plan route'));
    await user.click(screen.getByRole('button', { name: 'Save changes' }));

    expect(put).toBe(false);
  });

  it('FE-COMP-TODO-066: the check button closes the inline list editor in both panes', async () => {
    const user = userEvent.setup();
    const { rerender } = render(<TodoListPanel tripId={1} items={[buildTodoItem({ id: 40, name: 'Plan route', checked: 0 })]} addItemSignal={0} />);

    await user.click(screen.getByText('Plan route'));
    await user.click(await screen.findByRole('button', { name: 'List name' }));
    let input = await screen.findByPlaceholderText('List name');
    await user.type(input, 'Logistics');
    fireEvent.click(input.nextElementSibling as HTMLElement);
    expect(screen.queryByPlaceholderText('List name')).not.toBeInTheDocument();
    expect(screen.getByText(/^Logistics/)).toBeInTheDocument();

    rerender(<TodoListPanel tripId={1} items={[buildTodoItem({ id: 40, name: 'Plan route', checked: 0 })]} addItemSignal={1} />);
    await screen.findByText('Create task');
    await user.click(screen.getByRole('button', { name: 'List name' }));
    input = await screen.findByPlaceholderText('List name');
    await user.type(input, 'Prep');
    fireEvent.click(input.nextElementSibling as HTMLElement);
    expect(screen.queryByPlaceholderText('List name')).not.toBeInTheDocument();
    expect(screen.getByText(/^Prep/)).toBeInTheDocument();
  });

  it('FE-COMP-TODO-067: the new task pane can pick an existing list from the dropdown', async () => {
    const user = userEvent.setup();
    let posted: Record<string, unknown> | null = null;
    server.use(
      http.post('/api/trips/1/todo', async ({ request }) => {
        posted = (await request.json()) as Record<string, unknown>;
        return HttpResponse.json({ item: buildTodoItem({ id: 80 }) });
      }),
    );
    const items = [buildTodoItem({ id: 60, name: 'Task', category: 'Errands', checked: 0 })];
    const { rerender } = render(<TodoListPanel tripId={1} items={items} addItemSignal={0} />);
    rerender(<TodoListPanel tripId={1} items={items} addItemSignal={1} />);
    await screen.findByText('Create task');

    const pane = document.querySelector('.trek-modal-backdrop') as HTMLElement;
    await user.type(within(pane).getByPlaceholderText('Task name'), 'Buy stamps');
    await user.click(within(pane).getByRole('button', { name: 'No list' }));
    pickOption('Errands');
    await user.click(screen.getByRole('button', { name: 'Create task' }));

    await waitFor(() => expect(posted).toBeTruthy());
    expect(posted!.category).toBe('Errands');
  });

  it('FE-COMP-TODO-068: clearing the assignee stores null in both panes', async () => {
    const user = userEvent.setup();
    withMembers();
    let put: Record<string, unknown> | null = null;
    let posted: Record<string, unknown> | null = null;
    server.use(
      http.put('/api/trips/1/todo/40', async ({ request }) => {
        put = (await request.json()) as Record<string, unknown>;
        return HttpResponse.json({ item: buildTodoItem({ id: 40, name: 'Plan route' }) });
      }),
      http.post('/api/trips/1/todo', async ({ request }) => {
        posted = (await request.json()) as Record<string, unknown>;
        return HttpResponse.json({ item: buildTodoItem({ id: 81 }) });
      }),
    );
    const items = [buildTodoItem({ id: 40, name: 'Plan route', assigned_user_id: 2, checked: 0 })];
    const { rerender } = render(<TodoListPanel tripId={1} items={items} addItemSignal={0} />);

    await user.click(screen.getByText('Plan route'));
    await user.click(await screen.findByRole('button', { name: 'bob' }));
    pickOption('Unassigned');
    await user.click(screen.getByRole('button', { name: 'Save changes' }));
    await waitFor(() => expect(put).toBeTruthy());
    expect(put!.assigned_user_id).toBeNull();

    rerender(<TodoListPanel tripId={1} items={items} addItemSignal={1} />);
    await screen.findByText('Create task');
    const pane = document.querySelector('.trek-modal-backdrop') as HTMLElement;
    await user.type(within(pane).getByPlaceholderText('Task name'), 'Buy stamps');
    await user.click(within(pane).getByRole('button', { name: 'Unassigned' }));
    pickOption('bob');
    await user.click(within(pane).getByRole('button', { name: 'bob' }));
    pickOption('Unassigned');
    await user.click(screen.getByRole('button', { name: 'Create task' }));

    await waitFor(() => expect(posted).toBeTruthy());
    expect(posted!.assigned_user_id).toBeNull();
  });

  it('FE-COMP-TODO-069: a rejection that is not an Error falls back to the generic message', async () => {
    const user = userEvent.setup();
    const addToast = vi.fn();
    window.__addToast = addToast as unknown as typeof window.__addToast;
    // The store always wraps failures in an Error; a bare throw is the only way
    // into the fallback message.
    const reject = async () => { throw 'boom' };
    useTripStore.setState({ updateTodoItem: reject, deleteTodoItem: reject });
    render(<TodoListPanel tripId={1} items={[buildTodoItem({ id: 40, name: 'Plan route', checked: 0 })]} />);
    await user.click(screen.getByText('Plan route'));

    const nameInput = await screen.findByDisplayValue('Plan route');
    await user.clear(nameInput);
    await user.type(nameInput, 'Renamed');
    await user.click(screen.getByRole('button', { name: 'Save changes' }));
    await waitFor(() => expect(addToast).toHaveBeenCalledWith('Error', 'error', undefined));

    addToast.mockClear();
    await user.click(screen.getByRole('button', { name: 'Delete' }));
    await waitFor(() => expect(addToast).toHaveBeenCalledWith('Error', 'error', undefined));
    delete window.__addToast;
  });

  it('FE-COMP-TODO-070: a create rejected without an Error keeps the pane open', async () => {
    const user = userEvent.setup();
    const addToast = vi.fn();
    window.__addToast = addToast as unknown as typeof window.__addToast;
    const reject = async () => { throw 'boom' };
    useTripStore.setState({ addTodoItem: reject });
    const { rerender } = render(<TodoListPanel tripId={1} items={[]} addItemSignal={0} />);
    rerender(<TodoListPanel tripId={1} items={[]} addItemSignal={1} />);
    await screen.findByText('Create task');

    await user.type(screen.getByPlaceholderText('Task name'), 'Pack bags');
    await user.click(screen.getByRole('button', { name: 'Create task' }));

    await waitFor(() => expect(addToast).toHaveBeenCalledWith('Error', 'error', undefined));
    expect(screen.getByRole('button', { name: 'Create task' })).toBeInTheDocument();
    delete window.__addToast;
  });

  it('FE-COMP-TODO-073: a create that yields no id keeps the pane open', async () => {
    const user = userEvent.setup();
    server.use(http.post('/api/trips/1/todo', () => HttpResponse.json({ item: {} })));
    const { rerender } = render(<TodoListPanel tripId={1} items={[]} addItemSignal={0} />);
    rerender(<TodoListPanel tripId={1} items={[]} addItemSignal={1} />);
    await screen.findByText('Create task');

    await user.type(screen.getByPlaceholderText('Task name'), 'Pack bags');
    await user.click(screen.getByRole('button', { name: 'Create task' }));

    await waitFor(() => expect(screen.getByRole('button', { name: 'Create task' })).not.toBeDisabled());
    expect(screen.getByText('New task')).toBeInTheDocument();
  });

  it('FE-COMP-TODO-071: the new task pane closes via its own X', async () => {
    const user = userEvent.setup();
    const { rerender } = render(<TodoListPanel tripId={1} items={[]} addItemSignal={0} />);
    rerender(<TodoListPanel tripId={1} items={[]} addItemSignal={1} />);
    await screen.findByText('Create task');

    const pane = document.querySelector('.trek-modal-backdrop') as HTMLElement;
    // The header X is the only button without an accessible name.
    await user.click(within(pane).getAllByRole('button').find(b => !b.textContent?.trim())!);

    expect(screen.queryByText('Create task')).not.toBeInTheDocument();
  });

  it('FE-COMP-TODO-072: clicking inside a pane does not dismiss it', async () => {
    const user = userEvent.setup();
    const { rerender } = render(<TodoListPanel tripId={1} items={[]} addItemSignal={0} />);
    rerender(<TodoListPanel tripId={1} items={[]} addItemSignal={1} />);
    await screen.findByText('Create task');

    await user.click(screen.getByText('New task'));

    expect(screen.getByText('Create task')).toBeInTheDocument();
  });
});

describe('TodoListPanel — plugin contributions', () => {
  it('FE-COMP-TODO-061: a plugin column is appended under the contributing task', async () => {
    server.use(
      http.get('/api/view-contributions/todos/1', () =>
        HttpResponse.json({
          contributions: [
            { kind: 'column', pluginId: 'p1', id: 'c1', entityId: 12, label: 'Weather', value: 'Rainy', tone: 'default' },
          ],
        })
      ),
    );
    render(<TodoListPanel tripId={1} items={[
      buildTodoItem({ id: 12, name: 'Hike', checked: 0 }),
      buildTodoItem({ id: 13, name: 'Swim', checked: 0 }),
    ]} />);

    expect(await screen.findByText('Weather')).toBeInTheDocument();
    expect(screen.getByText('Rainy')).toBeInTheDocument();
  });
});
