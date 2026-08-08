// FE-COMP-CAT-001 to FE-COMP-CAT-020
import { render, screen, waitFor, fireEvent, within } from '../../../tests/helpers/render';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { server } from '../../../tests/helpers/msw/server';
import { useAuthStore } from '../../store/authStore';
import { resetAllStores, seedStore } from '../../../tests/helpers/store';
import { buildUser, buildCategory } from '../../../tests/helpers/factories';
import CategoryManager from './CategoryManager';
import { ToastContainer } from '../shared/Toast';

beforeEach(() => {
  resetAllStores();
  server.use(
    http.get('/api/categories', () =>
      HttpResponse.json({ categories: [] })
    ),
  );
  seedStore(useAuthStore, { user: buildUser({ role: 'admin' }), isAuthenticated: true });
});

describe('CategoryManager', () => {
  it('FE-COMP-CAT-001: renders without crashing', () => {
    render(<CategoryManager />);
    expect(document.body).toBeInTheDocument();
  });

  it('FE-COMP-CAT-002: shows Categories title', async () => {
    render(<CategoryManager />);
    await screen.findByText('Categories');
  });

  it('FE-COMP-CAT-003: shows empty state when no categories', async () => {
    render(<CategoryManager />);
    await screen.findByText('No categories yet');
  });

  it('FE-COMP-CAT-004: shows New Category button', async () => {
    render(<CategoryManager />);
    await screen.findByText('New Category');
  });

  it('FE-COMP-CAT-005: clicking New Category shows form', async () => {
    const user = userEvent.setup();
    render(<CategoryManager />);
    await screen.findByText('New Category');
    await user.click(screen.getByText('New Category'));
    expect(screen.getByPlaceholderText('Category name')).toBeInTheDocument();
  });

  it('FE-COMP-CAT-006: shows existing categories from API', async () => {
    server.use(
      http.get('/api/categories', () =>
        HttpResponse.json({
          categories: [
            buildCategory({ name: 'Museum' }),
            buildCategory({ name: 'Restaurant' }),
          ],
        })
      )
    );
    render(<CategoryManager />);
    await screen.findByText('Museum');
    expect(screen.getByText('Restaurant')).toBeInTheDocument();
  });

  it('FE-COMP-CAT-007: clicking Create submits POST API', async () => {
    const user = userEvent.setup();
    let postCalled = false;
    server.use(
      http.post('/api/categories', async ({ request }) => {
        postCalled = true;
        const body = await request.json() as Record<string, unknown>;
        return HttpResponse.json({
          category: buildCategory({ name: String(body.name) }),
        });
      })
    );
    render(<><ToastContainer /><CategoryManager /></>);
    await screen.findByText('New Category');
    await user.click(screen.getByText('New Category'));
    const nameInput = screen.getByPlaceholderText('Category name');
    await user.type(nameInput, 'Parks');
    await user.click(screen.getByText('Create'));
    await waitFor(() => expect(postCalled).toBe(true));
  });

  it('FE-COMP-CAT-008: edit button shows form for existing category', async () => {
    const user = userEvent.setup();
    server.use(
      http.get('/api/categories', () =>
        HttpResponse.json({ categories: [buildCategory({ id: 5, name: 'Hotels' })] })
      )
    );
    render(<CategoryManager />);
    await screen.findByText('Hotels');
    // Edit button is icon-only (no title) — find all buttons and click the first action button
    const buttons = screen.getAllByRole('button');
    // Buttons: [New Category, ...action buttons for the category]
    // The edit button is the first action button in the category row (Edit2 icon)
    const actionBtns = buttons.filter(b => !b.textContent?.includes('New Category'));
    await user.click(actionBtns[0]);
    // Name input pre-filled with category name
    expect(screen.getByDisplayValue('Hotels')).toBeInTheDocument();
  });

  it('FE-COMP-CAT-009: delete button triggers DELETE API', async () => {
    const user = userEvent.setup();
    let deleteCalled = false;
    server.use(
      http.get('/api/categories', () =>
        HttpResponse.json({ categories: [buildCategory({ id: 9, name: 'Parks' })] })
      ),
      http.delete('/api/categories/9', () => {
        deleteCalled = true;
        return HttpResponse.json({ success: true });
      })
    );
    vi.spyOn(window, 'confirm').mockReturnValue(true);
    render(<><ToastContainer /><CategoryManager /></>);
    await screen.findByText('Parks');
    // Delete button is icon-only (Trash2, no title) — find the second action button
    const buttons = screen.getAllByRole('button');
    const actionBtns = buttons.filter(b => !b.textContent?.includes('New Category'));
    await user.click(actionBtns[1]);
    await waitFor(() => expect(deleteCalled).toBe(true));
    vi.restoreAllMocks();
  });

  it('FE-COMP-CAT-010: shows subtitle text', async () => {
    render(<CategoryManager />);
    await screen.findByText('Manage categories for places');
  });

  it('FE-COMP-CAT-011: category count is shown', async () => {
    server.use(
      http.get('/api/categories', () =>
        HttpResponse.json({
          categories: [buildCategory({ name: 'Cat1' }), buildCategory({ name: 'Cat2' })],
        })
      )
    );
    render(<CategoryManager />);
    await screen.findByText('Cat1');
    await screen.findByText('Cat2');
    // Both categories rendered
    expect(screen.getAllByRole('button').length).toBeGreaterThan(0);
  });

  it('FE-COMP-CAT-012: Cancel button in form hides the form', async () => {
    const user = userEvent.setup();
    render(<CategoryManager />);
    await screen.findByText('New Category');
    await user.click(screen.getByText('New Category'));
    expect(screen.getByPlaceholderText('Category name')).toBeInTheDocument();
    await user.click(screen.getByText('Cancel'));
    expect(screen.queryByPlaceholderText('Category name')).not.toBeInTheDocument();
  });

  it('FE-COMP-CAT-013: a failing list request toasts and falls back to the empty state', async () => {
    server.use(http.get('/api/categories', () => HttpResponse.error()));
    render(<><ToastContainer /><CategoryManager /></>);

    expect(await screen.findByText('Failed to load categories')).toBeInTheDocument();
    expect(screen.getByText('No categories yet')).toBeInTheDocument();
  });

  it('FE-COMP-CAT-014: editing a category sends a PUT and replaces the row', async () => {
    const user = userEvent.setup();
    let body: Record<string, unknown> | null = null;
    server.use(
      http.get('/api/categories', () =>
        HttpResponse.json({ categories: [buildCategory({ id: 5, name: 'Hotels', color: '#6366f1', icon: 'MapPin' })] })
      ),
      http.put('/api/categories/5', async ({ request }) => {
        body = await request.json() as Record<string, unknown>;
        return HttpResponse.json({ category: buildCategory({ id: 5, name: 'Lodging', color: '#ef4444', icon: 'BedDouble' }) });
      }),
    );
    render(<><ToastContainer /><CategoryManager /></>);
    await screen.findByText('Hotels');

    await user.click(screen.getAllByRole('button').filter(b => !b.textContent?.includes('New Category'))[0]);
    const nameInput = screen.getByDisplayValue('Hotels');
    await user.clear(nameInput);
    await user.type(nameInput, 'Lodging');
    await user.click(screen.getByTitle('Hotel'));
    await user.click(screen.getByText('Update'));

    expect(await screen.findByText('Category updated')).toBeInTheDocument();
    expect(body).toEqual({ name: 'Lodging', color: '#6366f1', icon: 'BedDouble' });
    expect(screen.getByText('Lodging')).toBeInTheDocument();
  });

  it('FE-COMP-CAT-015: a failing save surfaces the server message', async () => {
    const user = userEvent.setup();
    server.use(
      http.post('/api/categories', () => HttpResponse.json({ error: 'name already taken' }, { status: 409 })),
    );
    render(<><ToastContainer /><CategoryManager /></>);
    await screen.findByText('New Category');

    await user.click(screen.getByText('New Category'));
    await user.type(screen.getByPlaceholderText('Category name'), 'Parks');
    await user.click(screen.getByText('Create'));

    expect(await screen.findByText('name already taken')).toBeInTheDocument();
    // The form stays open so the name can be corrected
    expect(screen.getByDisplayValue('Parks')).toBeInTheDocument();
  });

  it('FE-COMP-CAT-016: declining the delete confirm keeps the category', async () => {
    const user = userEvent.setup();
    let deleteCalled = false;
    server.use(
      http.get('/api/categories', () => HttpResponse.json({ categories: [buildCategory({ id: 9, name: 'Parks' })] })),
      http.delete('/api/categories/9', () => { deleteCalled = true; return HttpResponse.json({ success: true }); }),
    );
    vi.spyOn(window, 'confirm').mockReturnValue(false);
    render(<CategoryManager />);
    await screen.findByText('Parks');

    const actionBtns = screen.getAllByRole('button').filter(b => !b.textContent?.includes('New Category'));
    await user.click(actionBtns[1]);

    expect(deleteCalled).toBe(false);
    expect(screen.getByText('Parks')).toBeInTheDocument();
    vi.restoreAllMocks();
  });

  it('FE-COMP-CAT-017: a failing delete toasts and keeps the row', async () => {
    const user = userEvent.setup();
    server.use(
      http.get('/api/categories', () => HttpResponse.json({ categories: [buildCategory({ id: 9, name: 'Parks' })] })),
      http.delete('/api/categories/9', () => HttpResponse.json({ error: 'category in use' }, { status: 409 })),
    );
    vi.spyOn(window, 'confirm').mockReturnValue(true);
    render(<><ToastContainer /><CategoryManager /></>);
    await screen.findByText('Parks');

    const actionBtns = screen.getAllByRole('button').filter(b => !b.textContent?.includes('New Category'));
    await user.click(actionBtns[1]);

    expect(await screen.findByText('category in use')).toBeInTheDocument();
    expect(screen.getByText('Parks')).toBeInTheDocument();
    vi.restoreAllMocks();
  });

  it('FE-COMP-CAT-018: picking an icon and a preset colour updates the live preview', async () => {
    const user = userEvent.setup();
    render(<CategoryManager />);
    await screen.findByText('New Category');
    await user.click(screen.getByText('New Category'));

    // Empty name → the preview falls back to the generic label
    expect(screen.getByText('Category')).toBeInTheDocument();
    await user.type(screen.getByPlaceholderText('Category name'), 'Beach day');
    await user.click(screen.getByTitle('Beach'));

    const preview = screen.getByText('Beach day');
    expect(preview).toHaveStyle({ color: '#6366f1' });

    await user.click(document.querySelectorAll('button[style*="background-color: rgb(239, 68, 68)"]')[0]);
    expect(screen.getByText('Beach day')).toHaveStyle({ color: '#ef4444' });
  });

  it('FE-COMP-CAT-019: the custom colour swatch opens the native picker and adopts its value', async () => {
    const user = userEvent.setup();
    render(<CategoryManager />);
    await screen.findByText('New Category');
    await user.click(screen.getByText('New Category'));

    const colorInput = document.querySelector('input[type="color"]') as HTMLInputElement;
    const clickSpy = vi.spyOn(colorInput, 'click').mockImplementation(() => {});
    await user.click(screen.getByTitle('Choose custom color'));
    expect(clickSpy).toHaveBeenCalled();

    fireEvent.change(colorInput, { target: { value: '#123456' } });
    await waitFor(() => expect(screen.getByText('Category')).toHaveStyle({ color: '#123456' }));
    // A non-preset colour fills the custom swatch instead of showing the pipette
    expect(screen.getByTitle('Choose custom color')).toHaveStyle({ backgroundColor: '#123456' });
    vi.restoreAllMocks();
  });

  it('FE-COMP-CAT-020: starting an edit closes the create form', async () => {
    const user = userEvent.setup();
    server.use(
      http.get('/api/categories', () => HttpResponse.json({ categories: [buildCategory({ id: 3, name: 'Hotels' })] })),
    );
    render(<CategoryManager />);
    await screen.findByText('Hotels');

    await user.click(screen.getByText('New Category'));
    expect(screen.getByPlaceholderText('Category name')).toHaveValue('');

    const row = screen.getByText('Hotels').closest('.p-3') as HTMLElement;
    await user.click(within(row).getAllByRole('button')[0]);

    // Only the inline edit form remains, pre-filled with the row's name
    expect(screen.getAllByPlaceholderText('Category name')).toHaveLength(1);
    expect(screen.getByDisplayValue('Hotels')).toBeInTheDocument();
  });
});
