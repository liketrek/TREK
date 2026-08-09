import userEvent from '@testing-library/user-event';
import { render, screen, waitFor } from '../../../tests/helpers/render';
import { ToastContainer } from '../shared/Toast';
import CommonCurrenciesEditor from './CommonCurrenciesEditor';

describe('CommonCurrenciesEditor', () => {
  it('searches localized names when adding a currency', async () => {
    const user = userEvent.setup();
    const onSave = vi.fn(async (value: string[]) => value);
    render(<CommonCurrenciesEditor value={['USD']} onSave={onSave} />);

    await user.click(screen.getByText(/search for a currency/i).closest('button')!);
    await user.type(screen.getByPlaceholderText('...'), 'Euro');
    await user.click(screen.getByRole('button', { name: /EUR.*Euro/i }));

    expect(onSave).toHaveBeenCalledWith(['USD', 'EUR']);
  });

  it('disables adding after ten currencies', () => {
    render(
      <CommonCurrenciesEditor
        value={['AUD', 'BRL', 'CAD', 'CHF', 'CNY', 'EUR', 'GBP', 'HKD', 'JPY', 'USD']}
        onSave={vi.fn()}
      />
    );

    expect(screen.getByText('Maximum of 10 currencies').closest('button')).toBeDisabled();
  });

  it('enforces move boundaries, removes, clears, and resets', async () => {
    const user = userEvent.setup();
    const onSave = vi.fn(async (value: string[]) => value);
    const onReset = vi.fn(async () => ['CAD']);
    render(<CommonCurrenciesEditor value={['USD', 'EUR']} onSave={onSave} onReset={onReset} />);

    expect(screen.getByRole('button', { name: /move USD up/i })).toBeDisabled();
    expect(screen.getByRole('button', { name: /move EUR down/i })).toBeDisabled();
    await user.click(screen.getByRole('button', { name: /move EUR up/i }));
    expect(onSave).toHaveBeenLastCalledWith(['EUR', 'USD']);

    await user.click(screen.getByRole('button', { name: /remove USD/i }));
    expect(onSave).toHaveBeenLastCalledWith(['EUR']);
    await user.click(screen.getByRole('button', { name: /clear/i }));
    expect(onSave).toHaveBeenLastCalledWith([]);
    await user.click(screen.getByRole('button', { name: /reset/i }));
    expect(onReset).toHaveBeenCalled();
    expect(await screen.findByText(/CAD/)).toBeInTheDocument();
  });

  it('rolls back an optimistic operation and reports a save failure', async () => {
    const user = userEvent.setup();
    const onSave = vi.fn().mockRejectedValue(new Error('save failed'));
    render(
      <>
        <ToastContainer />
        <CommonCurrenciesEditor value={['USD']} onSave={onSave} />
      </>
    );

    await user.click(screen.getByRole('button', { name: /remove USD/i }));
    await waitFor(() => expect(screen.getByText(/USD/)).toBeInTheDocument());
    expect(await screen.findByText('save failed')).toBeInTheDocument();
  });
});
