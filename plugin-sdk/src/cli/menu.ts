/**
 * The top-level menu shown when `trek-plugin-sdk` is run with no command in a
 * terminal (#plugins). It only picks WHICH command to run — the dispatcher then
 * runs it through the same interactive path a named command would take, so each
 * command still prompts for whatever it needs.
 */
import { intro, outro, promptSelect } from './ui.js';

export interface MenuItem {
  value: string;
  label: string;
  hint: string;
}

/** The everyday author journey. `advanced`/`exit` are control entries. */
export const PRIMARY_MENU: MenuItem[] = [
  { value: 'create', label: 'Create a plugin', hint: 'Scaffold a new plugin' },
  { value: 'dev', label: 'Run the dev server', hint: 'Live-reload your plugin locally' },
  { value: 'validate', label: 'Validate', hint: 'Check the manifest + layout' },
  { value: 'pack', label: 'Pack', hint: 'Build plugin.zip' },
  { value: 'publish', label: 'Publish', hint: 'Release + open the registry PR' },
  { value: 'advanced', label: 'Advanced…', hint: 'Signing, registry entry, preflight' },
  { value: 'exit', label: 'Exit', hint: '' },
];

/** The less-common signing/registry commands, behind the `advanced` entry. */
export const ADVANCED_MENU: MenuItem[] = [
  { value: 'keygen', label: 'Generate a signing key', hint: 'Create an Ed25519 signing key' },
  { value: 'sign', label: 'Sign an artifact', hint: 'Print a signature + public key' },
  { value: 'entry', label: 'Registry entry', hint: 'Print the ready-to-PR registry JSON' },
  { value: 'preflight', label: 'Preflight', hint: 'Run the registry CI checks locally' },
  { value: 'submit', label: 'Submit', hint: 'Open the registry PR' },
  { value: 'release', label: 'Release', hint: 'Pack → GitHub release → print entry' },
  { value: 'back', label: '← Back', hint: '' },
];

/** Every value the menu can yield, control entries included. */
const MENU_VALUES = new Set([...PRIMARY_MENU, ...ADVANCED_MENU].map((m) => m.value));

/** Pure: a menu value maps to itself when known, else `undefined`. Unit-tested. */
export function resolveMenuChoice(value: string): string | undefined {
  return MENU_VALUES.has(value) ? value : undefined;
}

const toOptions = (items: MenuItem[]) =>
  items.map(({ value, label, hint }) => (hint ? { value, label, hint } : { value, label }));

/**
 * Show the menu and return the chosen command name for the dispatcher to run,
 * or `null` if the user chose Exit. Loops back from the Advanced submenu.
 */
export async function runMenu(): Promise<string | null> {
  intro('trek-plugin-sdk');
  for (;;) {
    const choice = await promptSelect<string>({
      message: 'What would you like to do?',
      options: toOptions(PRIMARY_MENU),
    });
    if (choice === 'exit') {
      outro('Nothing to do — bye!');
      return null;
    }
    if (choice === 'advanced') {
      const adv = await promptSelect<string>({ message: 'Advanced commands', options: toOptions(ADVANCED_MENU) });
      if (adv === 'back') continue;
      return adv;
    }
    return choice;
  }
}
