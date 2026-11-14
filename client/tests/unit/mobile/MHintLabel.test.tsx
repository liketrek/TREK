// FE-MOB-HINT-001 to FE-MOB-HINT-004
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import MHintLabel from '../../../src/mobile/components/MHintLabel';
import { render, screen } from '../../helpers/render';

describe('MHintLabel', () => {
  it('FE-MOB-HINT-001: without a hint it is the label alone, with no mark', () => {
    render(<MHintLabel label="Password Login" />);
    expect(screen.getByText('Password Login')).toBeInTheDocument();
    expect(screen.queryByTestId('m-hint-mark')).not.toBeInTheDocument();
  });

  it('FE-MOB-HINT-002: the hint stays in the page for a screen reader while the mark is closed', () => {
    render(<MHintLabel label="Password Login" hint="Allow sign in with email and password" />);
    const hint = screen.getByText('Allow sign in with email and password');
    expect(hint).toHaveClass('sr-only');
    expect(screen.getByTestId('m-hint-mark')).toHaveAttribute('aria-hidden', 'true');
  });

  it('FE-MOB-HINT-003: a tap on the mark shows the hint and a second one folds it again', async () => {
    const user = userEvent.setup();
    render(<MHintLabel label="Password Login" hint="Allow sign in with email and password" />);
    const mark = screen.getByTestId('m-hint-mark');

    await user.click(mark);
    expect(screen.getByText('Allow sign in with email and password')).not.toHaveClass('sr-only');

    await user.click(mark);
    expect(screen.getByText('Allow sign in with email and password')).toHaveClass('sr-only');
  });

  it('FE-MOB-HINT-004: the label takes the class it is given', () => {
    render(<MHintLabel label="Files" hint="Uploads" labelClassName="uppercase" />);
    expect(screen.getByText('Files')).toHaveClass('uppercase');
  });
});
