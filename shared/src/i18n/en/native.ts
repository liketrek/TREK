import type { TranslationStrings } from '../types';

const native: TranslationStrings = {
  'native.connect.title': 'Connect to TREK',
  'native.connect.hint': 'Enter the address you open TREK at in your browser.',
  'native.connect.placeholder': 'trek.example.com',
  'native.connect.submit': 'Connect',
  'native.connect.checking': 'Checking…',
  'native.connect.errorInvalid': 'That does not look like a web address.',
  'native.connect.errorUnreachable': 'No server answered at this address. Check the address and your connection.',
  'native.connect.errorNotTrek': 'The server at this address is not TREK.',
  'native.connect.errorTooOld': 'This TREK server is too old for the app. It needs an update first.',
  'native.offline.title': 'Server not reachable',
  'native.offline.hint': 'TREK could not reach {server}. Check your connection and try again.',
  'native.offline.retry': 'Try again',
  'native.changeServer': 'Change server',
  'native.login.failed': 'Signing in did not work. Please try again.',
  'native.handoff.title': 'Continue in the app',
  'native.handoff.hint': 'You are signed in as {name}. Open the TREK app to finish signing in there.',
  'native.handoff.open': 'Open the TREK app',
  'native.handoff.switchAccount': 'Use a different account',
  'native.settings.server': 'Server',
  'native.settings.serverHint': 'This app is connected to {server}.',
};

export default native;
