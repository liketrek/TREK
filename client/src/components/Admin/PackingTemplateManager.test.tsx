// FE-ADMIN-PKG-001 to FE-ADMIN-PKG-032
import { render, screen, waitFor, within } from '../../../tests/helpers/render';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { server } from '../../../tests/helpers/msw/server';
import { resetAllStores } from '../../../tests/helpers/store';
import PackingTemplateManager from './PackingTemplateManager';
import { ToastContainer } from '../shared/Toast';

const tmpl1 = { id: 1, name: 'Beach Trip', item_count: 5, category_count: 2, created_by_name: 'admin' }
const tmpl2 = { id: 2, name: 'City Break', item_count: 3, category_count: 1, created_by_name: 'admin' }

const cat1 = { id: 10, template_id: 1, name: 'Clothing', sort_order: 0 }
const item1 = { id: 100, category_id: 10, name: 'T-shirt', sort_order: 0 }
const item2 = { id: 101, category_id: 10, name: 'Shorts', sort_order: 1 }

beforeEach(() => {
  resetAllStores();
});

/** Template rows carry [chevron, name, edit, delete]; category headers [add item, edit, delete]. */
function rowButtons(name: string, selector: string): HTMLElement[] {
  const row = screen.getByText(name).closest(selector) as HTMLElement;
  return within(row).getAllByRole('button');
}

const templateButtons = (name: string) => rowButtons(name, '.px-5.py-3');
const categoryButtons = (name: string) => rowButtons(name, '.bg-slate-50');
const itemButtons = (name: string) => rowButtons(name, '.group');

/** Expands the single fixture template and waits for its content. */
async function expandBeachTrip(user: ReturnType<typeof userEvent.setup>, firstChild: string) {
  await screen.findByText('Beach Trip');
  await user.click(screen.getByText('Beach Trip'));
  await screen.findByText(firstChild);
}

describe('PackingTemplateManager', () => {
  it('FE-ADMIN-PKG-001: shows loading spinner on mount', async () => {
    server.use(
      http.get('/api/admin/packing-templates', async () => {
        await new Promise(r => setTimeout(r, 100));
        return HttpResponse.json({ templates: [] });
      })
    );
    render(<PackingTemplateManager />);
    expect(document.querySelector('.animate-spin')).toBeInTheDocument();
  });

  it('FE-ADMIN-PKG-002: shows empty state when no templates', async () => {
    render(<PackingTemplateManager />);
    await screen.findByText('No templates created yet');
    expect(screen.queryAllByRole('button', { name: /chevron/i })).toHaveLength(0);
  });

  it('FE-ADMIN-PKG-003: template list renders names and counts', async () => {
    server.use(
      http.get('/api/admin/packing-templates', () =>
        HttpResponse.json({ templates: [tmpl1, tmpl2] })
      )
    );
    render(<PackingTemplateManager />);
    await screen.findByText('Beach Trip');
    expect(screen.getByText('City Break')).toBeInTheDocument();
    // tmpl1 has 2 categories and 5 items
    expect(screen.getByText(/2 categories · 5 items/i)).toBeInTheDocument();
  });

  it('FE-ADMIN-PKG-004: clicking "+" shows create input', async () => {
    const user = userEvent.setup();
    render(<PackingTemplateManager />);
    await screen.findByText('No templates created yet');
    const createBtn = screen.getByRole('button', { name: /new template/i });
    await user.click(createBtn);
    expect(screen.getByPlaceholderText('Template name (e.g. Beach Holiday)')).toBeInTheDocument();
  });

  it('FE-ADMIN-PKG-005: creates template on Enter and shows success toast', async () => {
    const user = userEvent.setup();
    let postCalled = false;
    server.use(
      http.post('/api/admin/packing-templates', async () => {
        postCalled = true;
        return HttpResponse.json({ template: { id: 99, name: 'New Template' } });
      })
    );
    render(<><ToastContainer /><PackingTemplateManager /></>);
    await screen.findByText('No templates created yet');
    await user.click(screen.getByRole('button', { name: /new template/i }));
    const input = screen.getByPlaceholderText('Template name (e.g. Beach Holiday)');
    await user.type(input, 'New Template{Enter}');
    await waitFor(() => expect(postCalled).toBe(true));
    // "New Template" may appear both as the button label and the new list item
    await waitFor(() => expect(screen.getAllByText('New Template').length).toBeGreaterThanOrEqual(1));
    await screen.findByText('Template created');
  });

  it('FE-ADMIN-PKG-006: Escape dismisses create input without API call', async () => {
    const user = userEvent.setup();
    let postCalled = false;
    server.use(
      http.post('/api/admin/packing-templates', async () => {
        postCalled = true;
        return HttpResponse.json({ template: { id: 99, name: 'Should Not Appear' } });
      })
    );
    render(<PackingTemplateManager />);
    await screen.findByText('No templates created yet');
    await user.click(screen.getByRole('button', { name: /new template/i }));
    const input = screen.getByPlaceholderText('Template name (e.g. Beach Holiday)');
    await user.type(input, 'Test{Escape}');
    await waitFor(() => {
      expect(screen.queryByPlaceholderText('Template name (e.g. Beach Holiday)')).not.toBeInTheDocument();
    });
    expect(postCalled).toBe(false);
  });

  it('FE-ADMIN-PKG-007: expanding a template loads and displays its categories and items', async () => {
    const user = userEvent.setup();
    server.use(
      http.get('/api/admin/packing-templates', () =>
        HttpResponse.json({ templates: [tmpl1] })
      ),
      http.get('/api/admin/packing-templates/1', () =>
        HttpResponse.json({ categories: [cat1], items: [item1, item2] })
      )
    );
    render(<PackingTemplateManager />);
    await screen.findByText('Beach Trip');
    await user.click(screen.getByText('Beach Trip'));
    await screen.findByText('Clothing');
    expect(screen.getByText('T-shirt')).toBeInTheDocument();
    expect(screen.getByText('Shorts')).toBeInTheDocument();
  });

  it('FE-ADMIN-PKG-008: collapsing an expanded template hides its content', async () => {
    const user = userEvent.setup();
    server.use(
      http.get('/api/admin/packing-templates', () =>
        HttpResponse.json({ templates: [tmpl1] })
      ),
      http.get('/api/admin/packing-templates/1', () =>
        HttpResponse.json({ categories: [cat1], items: [item1, item2] })
      )
    );
    render(<PackingTemplateManager />);
    await screen.findByText('Beach Trip');
    await user.click(screen.getByText('Beach Trip'));
    await screen.findByText('Clothing');
    // Collapse by clicking again
    await user.click(screen.getByText('Beach Trip'));
    await waitFor(() => {
      expect(screen.queryByText('Clothing')).not.toBeInTheDocument();
      expect(screen.queryByText('T-shirt')).not.toBeInTheDocument();
    });
  });

  it('FE-ADMIN-PKG-009: deleting a template removes it from the list and shows toast', async () => {
    const user = userEvent.setup();
    let deleteCalled = false;
    server.use(
      http.get('/api/admin/packing-templates', () =>
        HttpResponse.json({ templates: [tmpl1, tmpl2] })
      ),
      http.delete('/api/admin/packing-templates/1', () => {
        deleteCalled = true;
        return HttpResponse.json({ success: true });
      })
    );
    render(<><ToastContainer /><PackingTemplateManager /></>);
    await screen.findByText('Beach Trip');
    expect(screen.getByText('City Break')).toBeInTheDocument();

    // Find all Trash2 (delete) buttons — there are 2 (one per template)
    const deleteButtons = screen.getAllByRole('button').filter(b =>
      b.className.includes('hover:bg-red-50') || b.querySelector('svg')
    );
    // Click the delete button for "Beach Trip" (first template row's trash button)
    // The buttons layout in each row: [chevron, edit, delete]
    // We find rows first
    const beachTripRow = screen.getByText('Beach Trip').closest('div');
    const trashBtn = beachTripRow!.parentElement!.querySelector('button.hover\\:bg-red-50') as HTMLElement | null;
    if (trashBtn) {
      await user.click(trashBtn);
    } else {
      // Fallback: find all red-hover buttons and click first
      const allBtns = screen.getAllByRole('button');
      const redBtns = allBtns.filter(b => b.className.includes('hover:bg-red-50'));
      await user.click(redBtns[0]);
    }
    await waitFor(() => expect(deleteCalled).toBe(true));
    await waitFor(() => expect(screen.queryByText('Beach Trip')).not.toBeInTheDocument());
    expect(screen.getByText('City Break')).toBeInTheDocument();
    await screen.findByText('Template deleted');
  });

  it('FE-ADMIN-PKG-010: renaming a template inline updates the list', async () => {
    const user = userEvent.setup();
    let putCalled = false;
    server.use(
      http.get('/api/admin/packing-templates', () =>
        HttpResponse.json({ templates: [tmpl1] })
      ),
      http.put('/api/admin/packing-templates/1', async () => {
        putCalled = true;
        return HttpResponse.json({ success: true });
      })
    );
    render(<PackingTemplateManager />);
    await screen.findByText('Beach Trip');

    // Find the Edit2 button on the template row
    const beachTripText = screen.getByText('Beach Trip');
    const row = beachTripText.closest('div')!.parentElement!;
    const editBtn = row.querySelector('button.hover\\:bg-slate-100') as HTMLElement | null;
    if (editBtn) {
      await user.click(editBtn);
    } else {
      // Fallback: find all slate-100-hover buttons
      const allBtns = screen.getAllByRole('button');
      const editBtns = allBtns.filter(b => b.className.includes('hover:bg-slate-100'));
      await user.click(editBtns[0]);
    }

    const input = screen.getByDisplayValue('Beach Trip');
    await user.clear(input);
    await user.type(input, 'Summer Packing{Enter}');
    await waitFor(() => expect(putCalled).toBe(true));
    await screen.findByText('Summer Packing');
  });

  it('FE-ADMIN-PKG-011: adding a category to an expanded template', async () => {
    const user = userEvent.setup();
    server.use(
      http.get('/api/admin/packing-templates', () =>
        HttpResponse.json({ templates: [tmpl1] })
      ),
      http.get('/api/admin/packing-templates/1', () =>
        HttpResponse.json({ categories: [], items: [] })
      ),
      http.post('/api/admin/packing-templates/1/categories', async () =>
        HttpResponse.json({ category: { id: 20, template_id: 1, name: 'Electronics', sort_order: 1 } })
      )
    );
    render(<PackingTemplateManager />);
    await screen.findByText('Beach Trip');
    await user.click(screen.getByText('Beach Trip'));
    // Wait for expanded state (Add category button should appear)
    await screen.findByText('Add category');
    await user.click(screen.getByText('Add category'));
    const catInput = screen.getByPlaceholderText('Category name (e.g. Clothing)');
    await user.type(catInput, 'Electronics{Enter}');
    expect(await screen.findByText('Electronics')).toBeInTheDocument();
  });

  it('FE-ADMIN-PKG-012: adding an item to a category', async () => {
    const user = userEvent.setup();
    server.use(
      http.get('/api/admin/packing-templates', () =>
        HttpResponse.json({ templates: [tmpl1] })
      ),
      http.get('/api/admin/packing-templates/1', () =>
        HttpResponse.json({ categories: [cat1], items: [] })
      ),
      http.post('/api/admin/packing-templates/1/categories/10/items', async () =>
        HttpResponse.json({ item: { id: 102, category_id: 10, name: 'Sandals', sort_order: 2 } })
      )
    );
    render(<PackingTemplateManager />);
    await screen.findByText('Beach Trip');
    await user.click(screen.getByText('Beach Trip'));
    await screen.findByText('Clothing');

    // Click the "+" button on the Clothing category row
    const clothingHeader = screen.getByText('Clothing').closest('div')!;
    const addItemBtn = clothingHeader.querySelector('button') as HTMLElement;
    await user.click(addItemBtn);

    const itemInput = screen.getByPlaceholderText('Item name');
    await user.type(itemInput, 'Sandals');
    // Submit via Enter key (the input's onKeyDown handler triggers handleAddItem)
    await user.type(itemInput, '{Enter}');
    expect(await screen.findByText('Sandals')).toBeInTheDocument();
  });

  it('FE-ADMIN-PKG-013: renaming a category inline updates its name', async () => {
    const user = userEvent.setup();
    server.use(
      http.get('/api/admin/packing-templates', () =>
        HttpResponse.json({ templates: [tmpl1] })
      ),
      http.get('/api/admin/packing-templates/1', () =>
        HttpResponse.json({ categories: [cat1], items: [] })
      ),
      http.put('/api/admin/packing-templates/1/categories/10', async () =>
        HttpResponse.json({ success: true })
      )
    );
    render(<PackingTemplateManager />);
    await screen.findByText('Beach Trip');
    await user.click(screen.getByText('Beach Trip'));
    await screen.findByText('Clothing');

    // Find the Edit2 button in the Clothing category header
    const clothingHeader = screen.getByText('Clothing').closest('div')!;
    const editBtns = Array.from(clothingHeader.querySelectorAll('button')).filter(
      b => b.className.includes('hover:text-slate-700')
    );
    // Second button (after Plus) is Edit2
    await user.click(editBtns[1]);

    const catInput = screen.getByDisplayValue('Clothing');
    await user.clear(catInput);
    await user.type(catInput, 'Shoes{Enter}');
    expect(await screen.findByText('Shoes')).toBeInTheDocument();
  });

  it('FE-ADMIN-PKG-014: deleting a category removes it and its items', async () => {
    const user = userEvent.setup();
    server.use(
      http.get('/api/admin/packing-templates', () =>
        HttpResponse.json({ templates: [tmpl1] })
      ),
      http.get('/api/admin/packing-templates/1', () =>
        HttpResponse.json({ categories: [cat1], items: [item1, item2] })
      ),
      http.delete('/api/admin/packing-templates/1/categories/10', () =>
        HttpResponse.json({ success: true })
      )
    );
    render(<PackingTemplateManager />);
    await screen.findByText('Beach Trip');
    await user.click(screen.getByText('Beach Trip'));
    await screen.findByText('Clothing');
    expect(screen.getByText('T-shirt')).toBeInTheDocument();

    // Find the Trash2 button in the Clothing category header
    const clothingHeader = screen.getByText('Clothing').closest('div')!;
    const trashBtn = clothingHeader.querySelector('button.hover\\:text-red-500') as HTMLElement;
    await user.click(trashBtn);

    await waitFor(() => {
      expect(screen.queryByText('Clothing')).not.toBeInTheDocument();
      expect(screen.queryByText('T-shirt')).not.toBeInTheDocument();
    });
  });

  it('FE-ADMIN-PKG-015: renaming an item inline updates its name', async () => {
    const user = userEvent.setup();
    server.use(
      http.get('/api/admin/packing-templates', () =>
        HttpResponse.json({ templates: [tmpl1] })
      ),
      http.get('/api/admin/packing-templates/1', () =>
        HttpResponse.json({ categories: [cat1], items: [item1] })
      ),
      http.put('/api/admin/packing-templates/1/items/100', async () =>
        HttpResponse.json({ success: true })
      )
    );
    render(<PackingTemplateManager />);
    await screen.findByText('Beach Trip');
    await user.click(screen.getByText('Beach Trip'));
    await screen.findByText('T-shirt');

    // Find the Edit2 button in the T-shirt item row (opacity-0 group-hover buttons)
    const itemRow = screen.getByText('T-shirt').closest('div')!;
    const editBtn = Array.from(itemRow.querySelectorAll('button')).find(
      b => b.className.includes('opacity-0')
    ) as HTMLElement | undefined;
    if (editBtn) {
      await user.click(editBtn);
    } else {
      // Directly click the first button in the item row
      const btns = itemRow.querySelectorAll('button');
      await user.click(btns[0] as HTMLElement);
    }

    const input = screen.getByDisplayValue('T-shirt');
    await user.clear(input);
    await user.type(input, 'Tank Top{Enter}');
    expect(await screen.findByText('Tank Top')).toBeInTheDocument();
  });

  it('FE-ADMIN-PKG-016: deleting an item removes it from the list', async () => {
    const user = userEvent.setup();
    server.use(
      http.get('/api/admin/packing-templates', () =>
        HttpResponse.json({ templates: [tmpl1] })
      ),
      http.get('/api/admin/packing-templates/1', () =>
        HttpResponse.json({ categories: [cat1], items: [item1, item2] })
      ),
      http.delete('/api/admin/packing-templates/1/items/100', () =>
        HttpResponse.json({ success: true })
      )
    );
    render(<PackingTemplateManager />);
    await screen.findByText('Beach Trip');
    await user.click(screen.getByText('Beach Trip'));
    await screen.findByText('T-shirt');
    expect(screen.getByText('Shorts')).toBeInTheDocument();

    // Find the Trash2 button in the T-shirt row
    const itemRow = screen.getByText('T-shirt').closest('div')!;
    const trashBtns = Array.from(itemRow.querySelectorAll('button')).filter(
      b => b.className.includes('opacity-0')
    );
    // Second opacity-0 button is the delete (trash) button
    const trashBtn = trashBtns[1] || trashBtns[0];
    await user.click(trashBtn as HTMLElement);

    await waitFor(() => expect(screen.queryByText('T-shirt')).not.toBeInTheDocument());
    expect(screen.getByText('Shorts')).toBeInTheDocument();
  });

  it('FE-ADMIN-PKG-017: Escape cancels add category without saving', async () => {
    const user = userEvent.setup();
    let postCalled = false;
    server.use(
      http.get('/api/admin/packing-templates', () =>
        HttpResponse.json({ templates: [tmpl1] })
      ),
      http.get('/api/admin/packing-templates/1', () =>
        HttpResponse.json({ categories: [], items: [] })
      ),
      http.post('/api/admin/packing-templates/1/categories', async () => {
        postCalled = true;
        return HttpResponse.json({ category: { id: 20, template_id: 1, name: 'Ignored', sort_order: 1 } });
      })
    );
    render(<PackingTemplateManager />);
    await screen.findByText('Beach Trip');
    await user.click(screen.getByText('Beach Trip'));
    await screen.findByText('Add category');
    await user.click(screen.getByText('Add category'));
    const catInput = screen.getByPlaceholderText('Category name (e.g. Clothing)');
    await user.type(catInput, 'Test{Escape}');
    await waitFor(() =>
      expect(screen.queryByPlaceholderText('Category name (e.g. Clothing)')).not.toBeInTheDocument()
    );
    expect(postCalled).toBe(false);
  });

  it('FE-ADMIN-PKG-018: Escape cancels add item without saving', async () => {
    const user = userEvent.setup();
    let postCalled = false;
    server.use(
      http.get('/api/admin/packing-templates', () =>
        HttpResponse.json({ templates: [tmpl1] })
      ),
      http.get('/api/admin/packing-templates/1', () =>
        HttpResponse.json({ categories: [cat1], items: [] })
      ),
      http.post('/api/admin/packing-templates/1/categories/10/items', async () => {
        postCalled = true;
        return HttpResponse.json({ item: { id: 102, category_id: 10, name: 'Ignored', sort_order: 2 } });
      })
    );
    render(<PackingTemplateManager />);
    await screen.findByText('Beach Trip');
    await user.click(screen.getByText('Beach Trip'));
    await screen.findByText('Clothing');

    const clothingHeader = screen.getByText('Clothing').closest('div')!;
    const addItemBtn = clothingHeader.querySelector('button') as HTMLElement;
    await user.click(addItemBtn);

    const itemInput = screen.getByPlaceholderText('Item name');
    await user.type(itemInput, 'Test{Escape}');
    await waitFor(() =>
      expect(screen.queryByPlaceholderText('Item name')).not.toBeInTheDocument()
    );
    expect(postCalled).toBe(false);
  });

  it('FE-ADMIN-PKG-019: Escape cancels template rename without saving', async () => {
    const user = userEvent.setup();
    let putCalled = false;
    server.use(
      http.get('/api/admin/packing-templates', () =>
        HttpResponse.json({ templates: [tmpl1] })
      ),
      http.put('/api/admin/packing-templates/1', async () => {
        putCalled = true;
        return HttpResponse.json({ success: true });
      })
    );
    render(<PackingTemplateManager />);
    await screen.findByText('Beach Trip');

    const beachTripText = screen.getByText('Beach Trip');
    const row = beachTripText.closest('div')!.parentElement!;
    const editBtn = row.querySelector('button.hover\\:bg-slate-100') as HTMLElement | null;
    if (editBtn) {
      await user.click(editBtn);
    } else {
      const allBtns = screen.getAllByRole('button');
      const editBtns = allBtns.filter(b => b.className.includes('hover:bg-slate-100'));
      await user.click(editBtns[0]);
    }

    const input = screen.getByDisplayValue('Beach Trip');
    await user.type(input, '{Escape}');
    await waitFor(() => expect(screen.queryByDisplayValue('Beach Trip')).not.toBeInTheDocument());
    expect(putCalled).toBe(false);
    // Original name should be restored
    expect(screen.getByText('Beach Trip')).toBeInTheDocument();
  });

  it('FE-ADMIN-PKG-020: X button on create template input dismisses it', async () => {
    const user = userEvent.setup();
    render(<PackingTemplateManager />);
    await screen.findByText('No templates created yet');
    await user.click(screen.getByRole('button', { name: /new template/i }));
    expect(screen.getByPlaceholderText('Template name (e.g. Beach Holiday)')).toBeInTheDocument();

    // Find the X (cancel) button in the create row — it's the last button in the create row
    const createRow = screen.getByPlaceholderText('Template name (e.g. Beach Holiday)').closest('div')!;
    const createRowButtons = Array.from(createRow.querySelectorAll('button'));
    const cancelBtn = createRowButtons[createRowButtons.length - 1] as HTMLElement;
    await user.click(cancelBtn);

    await waitFor(() =>
      expect(screen.queryByPlaceholderText('Template name (e.g. Beach Holiday)')).not.toBeInTheDocument()
    );
  });

  it('FE-ADMIN-PKG-021: a failing template list toasts and shows the empty state', async () => {
    server.use(http.get('/api/admin/packing-templates', () => HttpResponse.error()));
    render(<><ToastContainer /><PackingTemplateManager /></>);

    expect(await screen.findByText('Failed to load templates')).toBeInTheDocument();
    expect(screen.getByText('No templates created yet')).toBeInTheDocument();
  });

  it('FE-ADMIN-PKG-022: a failing expand toasts and leaves the template without content', async () => {
    const user = userEvent.setup();
    server.use(
      http.get('/api/admin/packing-templates', () => HttpResponse.json({ templates: [tmpl1] })),
      http.get('/api/admin/packing-templates/1', () => HttpResponse.error()),
    );
    render(<><ToastContainer /><PackingTemplateManager /></>);
    await screen.findByText('Beach Trip');

    await user.click(screen.getByText('Beach Trip'));

    expect(await screen.findByText('Failed to load templates')).toBeInTheDocument();
    expect(screen.getByText('Add category')).toBeInTheDocument();
  });

  it('FE-ADMIN-PKG-023: an empty name is not submitted and a failing create toasts', async () => {
    const user = userEvent.setup();
    let posts = 0;
    server.use(
      http.post('/api/admin/packing-templates', () => {
        posts += 1;
        return HttpResponse.json({ error: 'nope' }, { status: 500 });
      }),
    );
    render(<><ToastContainer /><PackingTemplateManager /></>);
    await screen.findByText('No templates created yet');

    await user.click(screen.getByRole('button', { name: /new template/i }));
    const input = screen.getByPlaceholderText('Template name (e.g. Beach Holiday)');
    await user.type(input, '   {Enter}');
    expect(posts).toBe(0);

    await user.clear(input);
    await user.type(input, 'Ski trip{Enter}');
    expect(await screen.findByText('Failed to create template')).toBeInTheDocument();
    expect(posts).toBe(1);
  });

  it('FE-ADMIN-PKG-024: deleting the expanded template collapses it, a failing delete toasts', async () => {
    const user = userEvent.setup();
    let calls = 0;
    server.use(
      http.get('/api/admin/packing-templates', () => HttpResponse.json({ templates: [tmpl1] })),
      http.get('/api/admin/packing-templates/1', () => HttpResponse.json({ categories: [cat1], items: [item1] })),
      http.delete('/api/admin/packing-templates/1', () => {
        calls += 1;
        return calls === 1
          ? HttpResponse.json({ error: 'in use' }, { status: 500 })
          : HttpResponse.json({ success: true });
      }),
    );
    render(<><ToastContainer /><PackingTemplateManager /></>);
    await expandBeachTrip(user, 'Clothing');

    await user.click(templateButtons('Beach Trip')[3]);
    expect(await screen.findByText('Failed to delete template')).toBeInTheDocument();
    expect(screen.getByText('Clothing')).toBeInTheDocument();

    await user.click(templateButtons('Beach Trip')[3]);
    await screen.findByText('Template deleted');
    await waitFor(() => expect(screen.queryByText('Clothing')).not.toBeInTheDocument());
    expect(screen.getByText('No templates created yet')).toBeInTheDocument();
  });

  it('FE-ADMIN-PKG-025: a blank rename closes the editor, a failing rename toasts, blur commits', async () => {
    const user = userEvent.setup();
    let puts = 0;
    server.use(
      http.get('/api/admin/packing-templates', () => HttpResponse.json({ templates: [tmpl1] })),
      http.put('/api/admin/packing-templates/1', () => {
        puts += 1;
        return HttpResponse.json({ error: 'nope' }, { status: 500 });
      }),
    );
    render(<><ToastContainer /><PackingTemplateManager /></>);
    await screen.findByText('Beach Trip');

    await user.click(templateButtons('Beach Trip')[2]);
    await user.clear(screen.getByDisplayValue('Beach Trip'));
    await user.type(screen.getByRole('textbox'), '{Enter}');
    await waitFor(() => expect(screen.getByText('Beach Trip')).toBeInTheDocument());
    expect(puts).toBe(0);

    // Blurring the field commits the pending name — here the request fails
    await user.click(templateButtons('Beach Trip')[2]);
    const input = screen.getByDisplayValue('Beach Trip');
    await user.clear(input);
    await user.type(input, 'Winter');
    await user.tab();
    expect(await screen.findByText('Failed to save')).toBeInTheDocument();
    expect(puts).toBe(1);
  });

  it('FE-ADMIN-PKG-026: a blank category is not posted, a failing add toasts and X cancels', async () => {
    const user = userEvent.setup();
    let posts = 0;
    server.use(
      http.get('/api/admin/packing-templates', () => HttpResponse.json({ templates: [tmpl1] })),
      http.get('/api/admin/packing-templates/1', () => HttpResponse.json({ categories: [], items: [] })),
      http.post('/api/admin/packing-templates/1/categories', () => {
        posts += 1;
        return HttpResponse.json({ error: 'nope' }, { status: 500 });
      }),
    );
    render(<><ToastContainer /><PackingTemplateManager /></>);
    await expandBeachTrip(user, 'Add category');

    await user.click(screen.getByText('Add category'));
    const catInput = screen.getByPlaceholderText('Category name (e.g. Clothing)');
    await user.type(catInput, '  {Enter}');
    expect(posts).toBe(0);

    await user.clear(catInput);
    await user.type(catInput, 'Electronics{Enter}');
    expect(await screen.findByText('Failed to save')).toBeInTheDocument();

    const cancel = within(catInput.parentElement as HTMLElement).getAllByRole('button')[1];
    await user.click(cancel);
    await waitFor(() =>
      expect(screen.queryByPlaceholderText('Category name (e.g. Clothing)')).not.toBeInTheDocument(),
    );
  });

  it('FE-ADMIN-PKG-027: a blank category rename closes the editor and a failing rename toasts', async () => {
    const user = userEvent.setup();
    let puts = 0;
    server.use(
      http.get('/api/admin/packing-templates', () => HttpResponse.json({ templates: [tmpl1] })),
      http.get('/api/admin/packing-templates/1', () => HttpResponse.json({ categories: [cat1], items: [] })),
      http.put('/api/admin/packing-templates/1/categories/10', () => {
        puts += 1;
        return HttpResponse.json({ error: 'nope' }, { status: 500 });
      }),
    );
    render(<><ToastContainer /><PackingTemplateManager /></>);
    await expandBeachTrip(user, 'Clothing');

    await user.click(categoryButtons('Clothing')[1]);
    await user.clear(screen.getByDisplayValue('Clothing'));
    await user.tab();
    await waitFor(() => expect(screen.getByText('Clothing')).toBeInTheDocument());
    expect(puts).toBe(0);

    await user.click(categoryButtons('Clothing')[1]);
    const catInput = screen.getByDisplayValue('Clothing');
    await user.clear(catInput);
    await user.type(catInput, 'Shoes{Enter}');
    expect(await screen.findByText('Failed to save')).toBeInTheDocument();
    expect(puts).toBe(1);
  });

  it('FE-ADMIN-PKG-028: a failing category delete toasts and keeps the category', async () => {
    const user = userEvent.setup();
    server.use(
      http.get('/api/admin/packing-templates', () => HttpResponse.json({ templates: [tmpl1] })),
      http.get('/api/admin/packing-templates/1', () => HttpResponse.json({ categories: [cat1], items: [item1] })),
      http.delete('/api/admin/packing-templates/1/categories/10', () => HttpResponse.error()),
    );
    render(<><ToastContainer /><PackingTemplateManager /></>);
    await expandBeachTrip(user, 'Clothing');

    await user.click(categoryButtons('Clothing')[2]);

    expect(await screen.findByText('Failed to delete category')).toBeInTheDocument();
    expect(screen.getByText('Clothing')).toBeInTheDocument();
    expect(screen.getByText('T-shirt')).toBeInTheDocument();
  });

  it('FE-ADMIN-PKG-029: the add-item button posts the item, a failing add toasts and X closes the row', async () => {
    const user = userEvent.setup();
    let posts = 0;
    server.use(
      http.get('/api/admin/packing-templates', () => HttpResponse.json({ templates: [tmpl1] })),
      http.get('/api/admin/packing-templates/1', () => HttpResponse.json({ categories: [cat1], items: [] })),
      http.post('/api/admin/packing-templates/1/categories/10/items', () => {
        posts += 1;
        return posts === 1
          ? HttpResponse.json({ item: { id: 102, category_id: 10, name: 'Sandals', sort_order: 0 } })
          : HttpResponse.json({ error: 'nope' }, { status: 500 });
      }),
    );
    render(<><ToastContainer /><PackingTemplateManager /></>);
    await expandBeachTrip(user, 'Clothing');

    await user.click(categoryButtons('Clothing')[0]);
    const itemInput = screen.getByPlaceholderText('Item name');
    const addRow = itemInput.parentElement as HTMLElement;
    expect(within(addRow).getAllByRole('button')[0]).toBeDisabled();

    await user.type(itemInput, 'Sandals');
    await user.click(within(addRow).getAllByRole('button')[0]);
    await screen.findByText('Sandals');

    await user.type(screen.getByPlaceholderText('Item name'), 'Towel');
    await user.click(within(addRow).getAllByRole('button')[0]);
    expect(await screen.findByText('Failed to save')).toBeInTheDocument();

    await user.click(within(addRow).getAllByRole('button')[1]);
    await waitFor(() => expect(screen.queryByPlaceholderText('Item name')).not.toBeInTheDocument());
  });

  it('FE-ADMIN-PKG-030: the item editor commits on the check button, cancels on X and ignores a blank name', async () => {
    const user = userEvent.setup();
    let puts = 0;
    server.use(
      http.get('/api/admin/packing-templates', () => HttpResponse.json({ templates: [tmpl1] })),
      http.get('/api/admin/packing-templates/1', () => HttpResponse.json({ categories: [cat1], items: [item1] })),
      http.put('/api/admin/packing-templates/1/items/100', () => {
        puts += 1;
        return puts === 1
          ? HttpResponse.json({ success: true })
          : HttpResponse.json({ error: 'nope' }, { status: 500 });
      }),
    );
    render(<><ToastContainer /><PackingTemplateManager /></>);
    await expandBeachTrip(user, 'T-shirt');

    // A blank name just closes the editor
    await user.click(itemButtons('T-shirt')[0]);
    const blank = screen.getByDisplayValue('T-shirt');
    await user.clear(blank);
    await user.click(within(blank.parentElement as HTMLElement).getAllByRole('button')[0]);
    await waitFor(() => expect(screen.getByText('T-shirt')).toBeInTheDocument());
    expect(puts).toBe(0);

    // X discards the pending name
    await user.click(itemButtons('T-shirt')[0]);
    const editing = screen.getByDisplayValue('T-shirt');
    await user.clear(editing);
    await user.type(editing, 'Discarded');
    await user.click(within(editing.parentElement as HTMLElement).getAllByRole('button')[1]);
    await waitFor(() => expect(screen.getByText('T-shirt')).toBeInTheDocument());
    expect(puts).toBe(0);

    // The check button commits
    await user.click(itemButtons('T-shirt')[0]);
    const editing2 = screen.getByDisplayValue('T-shirt');
    await user.clear(editing2);
    await user.type(editing2, 'Tank Top');
    await user.click(within(editing2.parentElement as HTMLElement).getAllByRole('button')[0]);
    await screen.findByText('Tank Top');
    expect(puts).toBe(1);

    // A failing rename keeps the editor open and toasts
    await user.click(itemButtons('Tank Top')[0]);
    const editing3 = screen.getByDisplayValue('Tank Top');
    await user.clear(editing3);
    await user.type(editing3, 'Vest{Enter}');
    expect(await screen.findByText('Failed to save')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Vest')).toBeInTheDocument();
  });

  it('FE-ADMIN-PKG-031: a failing item delete toasts and keeps the item', async () => {
    const user = userEvent.setup();
    server.use(
      http.get('/api/admin/packing-templates', () => HttpResponse.json({ templates: [tmpl1] })),
      http.get('/api/admin/packing-templates/1', () => HttpResponse.json({ categories: [cat1], items: [item1] })),
      http.delete('/api/admin/packing-templates/1/items/100', () => HttpResponse.error()),
    );
    render(<><ToastContainer /><PackingTemplateManager /></>);
    await expandBeachTrip(user, 'T-shirt');

    await user.click(itemButtons('T-shirt')[1]);

    expect(await screen.findByText('Failed to delete item')).toBeInTheDocument();
    expect(screen.getByText('T-shirt')).toBeInTheDocument();
  });

  it('FE-ADMIN-PKG-032: the chevron button expands and collapses the template', async () => {
    const user = userEvent.setup();
    server.use(
      http.get('/api/admin/packing-templates', () => HttpResponse.json({ templates: [tmpl1] })),
      http.get('/api/admin/packing-templates/1', () => HttpResponse.json({ categories: [cat1], items: [item1] })),
    );
    render(<PackingTemplateManager />);
    await screen.findByText('Beach Trip');

    await user.click(templateButtons('Beach Trip')[0]);
    await screen.findByText('Clothing');

    await user.click(templateButtons('Beach Trip')[0]);
    await waitFor(() => expect(screen.queryByText('Clothing')).not.toBeInTheDocument());
  });
});
