import type { TranslationStrings } from '../types';

const wandererWatch: TranslationStrings = {
  'wanderer.watch.label': 'Sprawdzaj zmiany moich szlaków',
  'wanderer.watch.hint': 'Powiadomienie, gdy zaimportowany szlak mógł się zmienić.',
  'wanderer.watch.info':
    'Najwyżej raz dziennie TREK czyta krótki wpis każdego zaimportowanego szlaku, nigdy jego pliku GPX. Tylko powiadamia: czy przejąć zmianę, decydujesz sam przez sprawdzenie źródła trasy.',
  'wanderer.watch.notConnected': 'Najpierw połącz wanderer',
  'wanderer.watch.on': 'Sprawdzanie w tle włączone',
  'wanderer.watch.off': 'Sprawdzanie w tle wyłączone',
  'wanderer.watch.failed': 'Nie udało się przełączyć sprawdzania w tle',
  'wanderer.watch.lastRun': 'Ostatnio sprawdzono {date}',
  'wanderer.watch.neverRun': 'Jeszcze nie sprawdzono',
  'wanderer.watch.paused': 'Wstrzymane do {time}',
  'wanderer.watch.pausedHint':
    'wanderer nie odpowiedział. Po każdym niepowodzeniu TREK czeka dłużej, zanim zapyta ponownie.',
  'wanderer.watch.blocked': 'Token odrzucony',
  'wanderer.watch.blockedHint':
    'wanderer odrzucił token API. Sprawdzanie wznowi się, gdy test połączenia się powiedzie lub zostanie zapisany nowy token.',
  'wanderer.watch.hints': 'Wskazówki',
  'wanderer.watch.hintsCount': '{count} otwartej wskazówki',
  'wanderer.watch.hintsCount.one': '{count} otwarta wskazówka',
  'wanderer.watch.hintsCount.few': '{count} otwarte wskazówki',
  'wanderer.watch.hintsCount.many': '{count} otwartych wskazówek',
  'wanderer.watch.empty': 'Brak otwartych wskazówek',
  'wanderer.watch.dialogTitle': 'Wskazówki dotyczące twoich szlaków',
  'wanderer.watch.openTour': 'Otwórz trasę',
  'wanderer.watch.checkedAt': 'Sprawdzono {date}',
  'wanderer.watch.noticeLabel': 'Sprawdzanie w tle',
  'wanderer.watch.state.possible_change': 'Mogło się zmienić',
  'wanderer.watch.state.changed': 'Zmieniono',
  'wanderer.watch.state.unverifiable': 'Nie do sprawdzenia',
  'wanderer.watch.stateHint.possible_change':
    'wanderer zmienił znacznik czasu szlaku. Dopiero sprawdzenie źródła pokaże, czy treść się różni.',
  'wanderer.watch.stateHint.changed':
    'Wpis w wanderer ma inną nazwę lub inny opis. Sprawdzenie źródła pokaże wszystko, co się zmieniło.',
  'wanderer.watch.stateHint.unverifiable': 'TREK nie mógł ocenić tego szlaku, więc nic nie wiadomo o zmianie.',
  'wanderer.watch.reason.unavailable': 'Szlak niedostępny',
  'wanderer.watch.reason.no_change_time': 'Brak znacznika czasu',
};
export default wandererWatch;
