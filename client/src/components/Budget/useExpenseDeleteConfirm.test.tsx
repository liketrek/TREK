import { buildBudgetItem } from '../../../tests/helpers/factories';
import { fireEvent, render, screen } from '../../../tests/helpers/render';
import type { BudgetItem } from '../../types';
import { useExpenseDeleteConfirm } from './useExpenseDeleteConfirm';

const item = (over: Partial<BudgetItem>): BudgetItem => ({ ...buildBudgetItem({ trip_id: 1 }), ...over }) as BudgetItem;

const taxi = item({ id: 7, name: 'Taxi', receipts: [] });
const hotel = item({ id: 8, name: 'Hotel', receipts: [{ id: 1 }] as unknown as BudgetItem['receipts'] });

// The harness drives the hook through buttons, so no handle leaks out of render.
function Harness({ onDelete }: { onDelete: (id: number) => Promise<unknown> }) {
  const { ask, askById, dialog } = useExpenseDeleteConfirm([taxi, hotel], onDelete);
  return (
    <>
      <button onClick={() => ask(taxi)}>ask taxi</button>
      <button onClick={() => askById(8)}>ask hotel</button>
      <button onClick={() => askById(999)}>ask unknown</button>
      {dialog}
    </>
  );
}

const press = (name: string) => fireEvent.click(screen.getByRole('button', { name }));

describe('useExpenseDeleteConfirm', () => {
  it('asks first and deletes only once the dialog is confirmed', () => {
    const onDelete = vi.fn(() => Promise.resolve());
    render(<Harness onDelete={onDelete} />);
    expect(screen.queryByText('Delete expense?')).not.toBeInTheDocument();

    press('ask taxi');
    expect(screen.getByText('Delete expense?')).toBeInTheDocument();
    expect(screen.getByText('"Taxi" will be permanently deleted.')).toBeInTheDocument();
    expect(onDelete).not.toHaveBeenCalled();

    fireEvent.click(screen.getByRole('button', { name: 'Delete' }));
    expect(onDelete).toHaveBeenCalledWith(7);
    expect(screen.queryByText('Delete expense?')).not.toBeInTheDocument();
  });

  it('looks a row up by its id and says the receipt files stay', () => {
    render(<Harness onDelete={vi.fn(() => Promise.resolve())} />);

    press('ask hotel');
    expect(
      screen.getByText('"Hotel" will be permanently deleted. Its receipt files stay in Files.')
    ).toBeInTheDocument();
  });

  it('sends nothing when the dialog is cancelled or the id is unknown', () => {
    const onDelete = vi.fn(() => Promise.resolve());
    render(<Harness onDelete={onDelete} />);

    press('ask taxi');
    fireEvent.click(screen.getByRole('button', { name: 'Cancel' }));
    expect(screen.queryByText('Delete expense?')).not.toBeInTheDocument();

    press('ask unknown');
    expect(screen.queryByText('Delete expense?')).not.toBeInTheDocument();
    expect(onDelete).not.toHaveBeenCalled();
  });
});
