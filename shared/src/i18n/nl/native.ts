import type { TranslationStrings } from '../types';

const native: TranslationStrings = {
  'native.connect.title': 'Verbinden met TREK',
  'native.connect.hint': 'Voer het adres in waarop je TREK in je browser opent.',
  'native.connect.placeholder': 'trek.example.com',
  'native.connect.submit': 'Verbinden',
  'native.connect.checking': 'Controleren…',
  'native.connect.errorInvalid': 'Dat lijkt geen webadres.',
  'native.connect.errorUnreachable': 'Er reageert geen server op dit adres. Controleer het adres en je verbinding.',
  'native.connect.errorNotTrek': 'De server op dit adres is geen TREK.',
  'native.connect.errorTooOld': 'Deze TREK-server is te oud voor de app. Hij moet eerst worden bijgewerkt.',
  'native.offline.title': 'Server niet bereikbaar',
  'native.offline.hint': 'TREK kon {server} niet bereiken. Controleer je verbinding en probeer het opnieuw.',
  'native.offline.retry': 'Opnieuw proberen',
  'native.changeServer': 'Server wijzigen',
  'native.login.failed': 'Inloggen is niet gelukt. Probeer het opnieuw.',
  'native.handoff.title': 'Verder in de app',
  'native.handoff.hint': 'Je bent ingelogd als {name}. Open de TREK-app om daar het inloggen af te ronden.',
  'native.handoff.open': 'TREK-app openen',
  'native.handoff.switchAccount': 'Ander account gebruiken',
  'native.settings.server': 'Server',
  'native.settings.serverHint': 'Deze app is verbonden met {server}.',
};

export default native;
