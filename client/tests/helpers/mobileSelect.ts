import { screen, within } from '@testing-library/react';
import type { UserEvent } from '@testing-library/user-event';

/**
 * Picks an option of the phone's own select (MAdminSelect): taps the combobox
 * named `name`, then the option labelled `option` in the picker sheet it opens.
 */
export async function pickMobileOption(user: UserEvent, name: string, option: string): Promise<void> {
  await user.click(screen.getByRole('combobox', { name }));
  const sheet = await screen.findByRole('dialog', { name });
  await user.click(within(sheet).getByRole('button', { name: option }));
}

/** The labels a phone select offers, read from its open picker sheet. */
export async function mobileOptionLabels(user: UserEvent, name: string): Promise<string[]> {
  await user.click(screen.getByRole('combobox', { name }));
  const sheet = await screen.findByRole('dialog', { name });
  return within(sheet)
    .getAllByRole('button')
    .filter((button) => button.getAttribute('aria-label') === null)
    .map((button) => button.textContent ?? '');
}
