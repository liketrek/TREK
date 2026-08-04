// FE-MOB-MCAT-001 to FE-MOB-MCAT-016
import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, waitFor, within, fireEvent } from '../../../helpers/render';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { server } from '../../../helpers/msw/server';
import { resetAllStores, seedStore } from '../../../helpers/store';
import { buildAdmin, buildCategory } from '../../../helpers/factories';
import { useAuthStore } from '../../../../src/store/authStore';
import { ToastContainer } from '../../../../src/components/shared/Toast';
import MAdminCategoryManager from '../../../../src/mobile/screens/admin/MAdminCategoryManager';

function withToast() {
  return render(<><ToastContainer /><MAdminCategoryManager /></>);
}

// The preset swatches carry no label — jsdom normalises the inline hex to rgb().
function swatch(hex: string): HTMLElement {
  const rgb = `rgb(${parseInt(hex.slice(1, 3), 16)}, ${parseInt(hex.slice(3, 5), 16)}, ${parseInt(hex.slice(5, 7), 16)})`;
  const found = Array.from(document.querySelectorAll('button')).find(b => b.style.backgroundColor === rgb);
  if (!found) throw new Error(`no colour swatch for ${hex}`);
  return found;
}

describe('MAdminCategoryManager', () => {
  beforeEach(() => {
    resetAllStores();
    seedStore(useAuthStore, { isAuthenticated: true, user: buildAdmin() });
    server.use(http.get('/api/categories', () => HttpResponse.json({ categories: [] })));
  });

  it('FE-MOB-MCAT-001: shows a spinner while the list is loading, then the empty state', async () => {
    render(<MAdminCategoryManager />);
    expect(document.querySelector('.animate-spin')).toBeInTheDocument();

    expect(await screen.findByText('No categories yet')).toBeInTheDocument();
    expect(document.querySelector('.animate-spin')).not.toBeInTheDocument();
  });

  it('FE-MOB-MCAT-002: renders the card head and the New Category action', async () => {
    render(<MAdminCategoryManager />);
    await screen.findByText('No categories yet');

    expect(screen.getByText('Categories')).toBeInTheDocument();
    expect(screen.getByText('Manage categories for places')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'New Category' })).toBeInTheDocument();
  });

  it('FE-MOB-MCAT-003: a failing list request surfaces the load error toast', async () => {
    server.use(http.get('/api/categories', () => HttpResponse.json({ error: 'nope' }, { status: 500 })));
    withToast();

    expect(await screen.findByText('Failed to load categories')).toBeInTheDocument();
  });

  it('FE-MOB-MCAT-004: lists the categories from the API with name and colour badge', async () => {
    server.use(http.get('/api/categories', () => HttpResponse.json({
      categories: [
        buildCategory({ id: 1, name: 'Museum', color: '#10b981', icon: 'Landmark' }),
        buildCategory({ id: 2, name: 'Hotel', color: '#3b82f6', icon: 'BedDouble' }),
      ],
    })));
    render(<MAdminCategoryManager />);

    expect(await screen.findByText('Museum')).toBeInTheDocument();
    expect(screen.getByText('Hotel')).toBeInTheDocument();
    expect(screen.getByText('#10b981')).toBeInTheDocument();
    expect(screen.getByText('#3b82f6')).toBeInTheDocument();
  });

  it('FE-MOB-MCAT-005: New Category opens the form with the default preview label', async () => {
    const user = userEvent.setup();
    render(<MAdminCategoryManager />);
    await screen.findByText('No categories yet');

    await user.click(screen.getByRole('button', { name: 'New Category' }));

    expect(screen.getByPlaceholderText('Category name')).toHaveValue('');
    expect(screen.getByText('Icon')).toBeInTheDocument();
    expect(screen.getByText('Color')).toBeInTheDocument();
    // Empty name falls back to the generic preview label
    expect(screen.getByText('Category')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Create' })).toBeDisabled();
  });

  it('FE-MOB-MCAT-006: typing a name enables Create and updates the live preview', async () => {
    const user = userEvent.setup();
    render(<MAdminCategoryManager />);
    await screen.findByText('No categories yet');
    await user.click(screen.getByRole('button', { name: 'New Category' }));

    await user.type(screen.getByPlaceholderText('Category name'), 'Parks');

    expect(screen.getByRole('button', { name: 'Create' })).toBeEnabled();
    expect(screen.getByText('Parks')).toBeInTheDocument();
  });

  it('FE-MOB-MCAT-007: creating posts name, chosen icon and preset colour, and appends the row', async () => {
    const user = userEvent.setup();
    let body: Record<string, unknown> | null = null;
    server.use(http.post('/api/categories', async ({ request }) => {
      body = await request.json() as Record<string, unknown>;
      return HttpResponse.json({ category: buildCategory({ id: 77, name: 'Parks', color: '#10b981', icon: 'TreePine' }) });
    }));
    withToast();
    await screen.findByText('No categories yet');
    await user.click(screen.getByRole('button', { name: 'New Category' }));

    await user.type(screen.getByPlaceholderText('Category name'), 'Parks');
    await user.click(screen.getByTitle('Nature'));
    await user.click(swatch('#10b981'));
    await user.click(screen.getByRole('button', { name: 'Create' }));

    await waitFor(() => expect(screen.getByText('Category created')).toBeInTheDocument());
    expect(body).toEqual({ name: 'Parks', color: '#10b981', icon: 'TreePine' });
    // Form closed, new row present with its colour badge
    expect(screen.queryByPlaceholderText('Category name')).not.toBeInTheDocument();
    expect(screen.getByText('#10b981')).toBeInTheDocument();
  });

  it('FE-MOB-MCAT-008: a rejected create shows the server error message', async () => {
    const user = userEvent.setup();
    server.use(http.post('/api/categories', () => HttpResponse.json({ error: 'Name already taken' }, { status: 409 })));
    withToast();
    await screen.findByText('No categories yet');
    await user.click(screen.getByRole('button', { name: 'New Category' }));
    await user.type(screen.getByPlaceholderText('Category name'), 'Parks');
    await user.click(screen.getByRole('button', { name: 'Create' }));

    expect(await screen.findByText('Name already taken')).toBeInTheDocument();
    // Form stays open so the admin can correct the name
    expect(screen.getByPlaceholderText('Category name')).toHaveValue('Parks');
  });

  it('FE-MOB-MCAT-009: Cancel closes the create form', async () => {
    const user = userEvent.setup();
    render(<MAdminCategoryManager />);
    await screen.findByText('No categories yet');
    await user.click(screen.getByRole('button', { name: 'New Category' }));
    expect(screen.getByPlaceholderText('Category name')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Cancel' }));

    expect(screen.queryByPlaceholderText('Category name')).not.toBeInTheDocument();
  });

  it('FE-MOB-MCAT-010: the custom colour input marks the colour as non-preset and is sent on save', async () => {
    const user = userEvent.setup();
    let body: Record<string, unknown> | null = null;
    server.use(http.post('/api/categories', async ({ request }) => {
      body = await request.json() as Record<string, unknown>;
      return HttpResponse.json({ category: buildCategory({ id: 3, name: 'Custom', color: '#123456' }) });
    }));
    withToast();
    await screen.findByText('No categories yet');
    await user.click(screen.getByRole('button', { name: 'New Category' }));

    // The eyedropper button only forwards to the hidden colour input; drive it directly.
    const pickerButton = screen.getByTitle('Choose custom color');
    await user.click(pickerButton);
    const colorInput = document.querySelector('input[type="color"]') as HTMLInputElement;
    fireEvent.change(colorInput, { target: { value: '#123456' } });

    expect(pickerButton.style.backgroundColor).toBe('rgb(18, 52, 86)');

    await user.type(screen.getByPlaceholderText('Category name'), 'Custom');
    await user.click(screen.getByRole('button', { name: 'Create' }));

    await waitFor(() => expect(body).toEqual({ name: 'Custom', color: '#123456', icon: 'MapPin' }));
  });

  it('FE-MOB-MCAT-011: the edit button opens an inline form prefilled from the category', async () => {
    const user = userEvent.setup();
    server.use(http.get('/api/categories', () => HttpResponse.json({
      categories: [buildCategory({ id: 5, name: 'Hotels', color: '#ef4444', icon: 'BedDouble' })],
    })));
    render(<MAdminCategoryManager />);
    await screen.findByText('Hotels');

    await user.click(screen.getByRole('button', { name: 'Edit' }));

    expect(screen.getByDisplayValue('Hotels')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Update' })).toBeInTheDocument();
    expect(document.querySelector('input[type="color"]')).toHaveValue('#ef4444');
  });

  it('FE-MOB-MCAT-012: saving an edit PUTs the change and replaces the row in place', async () => {
    const user = userEvent.setup();
    let putUrl = '';
    server.use(
      http.get('/api/categories', () => HttpResponse.json({
        categories: [buildCategory({ id: 5, name: 'Hotels', color: '#ef4444', icon: 'BedDouble' })],
      })),
      http.put('/api/categories/:id', async ({ request, params }) => {
        putUrl = String(params.id);
        const b = await request.json() as Record<string, unknown>;
        return HttpResponse.json({ category: buildCategory({ id: 5, name: String(b.name), color: '#ef4444' }) });
      }),
    );
    withToast();
    await screen.findByText('Hotels');
    await user.click(screen.getByRole('button', { name: 'Edit' }));

    const input = screen.getByDisplayValue('Hotels');
    await user.clear(input);
    await user.type(input, 'Lodging');
    await user.click(screen.getByRole('button', { name: 'Update' }));

    await waitFor(() => expect(screen.getByText('Category updated')).toBeInTheDocument());
    expect(putUrl).toBe('5');
    expect(screen.getByText('Lodging')).toBeInTheDocument();
    expect(screen.queryByDisplayValue('Lodging')).not.toBeInTheDocument();
  });

  it('FE-MOB-MCAT-013: opening the edit form closes an open create form', async () => {
    const user = userEvent.setup();
    server.use(http.get('/api/categories', () => HttpResponse.json({
      categories: [buildCategory({ id: 5, name: 'Hotels' })],
    })));
    render(<MAdminCategoryManager />);
    await screen.findByText('Hotels');

    await user.click(screen.getByRole('button', { name: 'New Category' }));
    expect(screen.getAllByPlaceholderText('Category name')).toHaveLength(1);

    await user.click(screen.getByRole('button', { name: 'Edit' }));

    // Only the inline edit form remains, prefilled
    const inputs = screen.getAllByPlaceholderText('Category name');
    expect(inputs).toHaveLength(1);
    expect(inputs[0]).toHaveValue('Hotels');
  });

  it('FE-MOB-MCAT-014: the trash button asks for confirmation before deleting', async () => {
    const user = userEvent.setup();
    let deleted = false;
    server.use(
      http.get('/api/categories', () => HttpResponse.json({ categories: [buildCategory({ id: 9, name: 'Parks' })] })),
      http.delete('/api/categories/9', () => { deleted = true; return HttpResponse.json({ success: true }); }),
    );
    withToast();
    await screen.findByText('Parks');

    await user.click(screen.getByRole('button', { name: 'Delete' }));
    const dialog = await screen.findByRole('dialog');
    expect(within(dialog).getByText('Delete category? Places in this category will not be deleted.')).toBeInTheDocument();

    await user.click(within(dialog).getByRole('button', { name: 'Cancel' }));
    // The sheet stays mounted through its exit animation
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
    expect(deleted).toBe(false);

    await user.click(screen.getByRole('button', { name: 'Delete' }));
    await user.click(within(await screen.findByRole('dialog')).getByRole('button', { name: 'Delete' }));

    await waitFor(() => expect(deleted).toBe(true));
    expect(await screen.findByText('Category deleted')).toBeInTheDocument();
    await waitFor(() => expect(screen.queryByText('Parks')).not.toBeInTheDocument());
  });

  it('FE-MOB-MCAT-015: a failing delete keeps the row and shows the server error', async () => {
    const user = userEvent.setup();
    server.use(
      http.get('/api/categories', () => HttpResponse.json({ categories: [buildCategory({ id: 9, name: 'Parks' })] })),
      http.delete('/api/categories/9', () => HttpResponse.json({ error: 'Category in use' }, { status: 400 })),
    );
    withToast();
    await screen.findByText('Parks');

    await user.click(screen.getByRole('button', { name: 'Delete' }));
    await user.click(within(await screen.findByRole('dialog')).getByRole('button', { name: 'Delete' }));

    expect(await screen.findByText('Category in use')).toBeInTheDocument();
    expect(screen.getByText('Parks')).toBeInTheDocument();
  });

  it('FE-MOB-MCAT-016: picking an icon in the edit form is sent with the update', async () => {
    const user = userEvent.setup();
    let body: Record<string, unknown> | null = null;
    server.use(
      http.get('/api/categories', () => HttpResponse.json({
        categories: [buildCategory({ id: 5, name: 'Hotels', color: '#ef4444', icon: 'BedDouble' })],
      })),
      http.put('/api/categories/5', async ({ request }) => {
        body = await request.json() as Record<string, unknown>;
        return HttpResponse.json({ category: buildCategory({ id: 5, name: 'Hotels' }) });
      }),
    );
    render(<MAdminCategoryManager />);
    await screen.findByText('Hotels');
    await user.click(screen.getByRole('button', { name: 'Edit' }));

    await user.click(screen.getByTitle('Camping'));
    await user.click(screen.getByRole('button', { name: 'Update' }));

    await waitFor(() => expect(body).toEqual({ name: 'Hotels', color: '#ef4444', icon: 'Tent' }));
  });
});
