import type { TranslationStrings } from '../types';

const native: TranslationStrings = {
  'native.connect.title': 'Połącz z TREK',
  'native.connect.hint': 'Wpisz adres, pod którym otwierasz TREK w przeglądarce.',
  'native.connect.placeholder': 'trek.example.com',
  'native.connect.submit': 'Połącz',
  'native.connect.checking': 'Sprawdzanie…',
  'native.connect.errorInvalid': 'To nie wygląda na adres internetowy.',
  'native.connect.errorUnreachable': 'Pod tym adresem nie odpowiada żaden serwer. Sprawdź adres i połączenie.',
  'native.connect.errorNotTrek': 'Serwer pod tym adresem to nie TREK.',
  'native.connect.errorTooOld': 'Ten serwer TREK jest za stary dla aplikacji. Najpierw wymaga aktualizacji.',
  'native.offline.title': 'Serwer nieosiągalny',
  'native.offline.hint': 'TREK nie mógł połączyć się z {server}. Sprawdź połączenie i spróbuj ponownie.',
  'native.offline.retry': 'Spróbuj ponownie',
  'native.changeServer': 'Zmień serwer',
  'native.login.failed': 'Logowanie się nie powiodło. Spróbuj ponownie.',
  'native.handoff.title': 'Kontynuuj w aplikacji',
  'native.handoff.hint': 'Zalogowano jako {name}. Otwórz aplikację TREK, aby tam dokończyć logowanie.',
  'native.handoff.open': 'Otwórz aplikację TREK',
  'native.handoff.switchAccount': 'Użyj innego konta',
  'native.settings.server': 'Serwer',
  'native.settings.serverHint': 'Ta aplikacja jest połączona z {server}.',
};

export default native;
