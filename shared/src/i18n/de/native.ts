import type { TranslationStrings } from '../types';

const native: TranslationStrings = {
  'native.connect.title': 'Mit TREK verbinden',
  'native.connect.hint': 'Gib die Adresse ein, unter der du TREK im Browser öffnest.',
  'native.connect.placeholder': 'trek.example.com',
  'native.connect.submit': 'Verbinden',
  'native.connect.checking': 'Wird geprüft…',
  'native.connect.errorInvalid': 'Das sieht nicht nach einer Webadresse aus.',
  'native.connect.errorUnreachable': 'Unter dieser Adresse antwortet kein Server. Prüfe die Adresse und deine Verbindung.',
  'native.connect.errorNotTrek': 'Unter dieser Adresse läuft kein TREK.',
  'native.connect.errorTooOld': 'Dieser TREK-Server ist zu alt für die App. Er braucht zuerst ein Update.',
  'native.offline.title': 'Server nicht erreichbar',
  'native.offline.hint': 'TREK konnte {server} nicht erreichen. Prüfe deine Verbindung und versuche es erneut.',
  'native.offline.retry': 'Erneut versuchen',
  'native.changeServer': 'Server wechseln',
  'native.login.failed': 'Die Anmeldung hat nicht geklappt. Bitte versuche es erneut.',
  'native.handoff.title': 'Weiter in der App',
  'native.handoff.hint': 'Du bist als {name} angemeldet. Öffne die TREK-App, um die Anmeldung dort abzuschließen.',
  'native.handoff.open': 'TREK-App öffnen',
  'native.handoff.switchAccount': 'Anderes Konto verwenden',
  'native.settings.server': 'Server',
  'native.settings.serverHint': 'Diese App ist mit {server} verbunden.',
};

export default native;
