import type { TranslationStrings } from '../types';

const native: TranslationStrings = {
  'native.connect.title': 'Csatlakozás a TREK-hez',
  'native.connect.hint': 'Add meg azt a címet, amelyen a böngésződben megnyitod a TREK-et.',
  'native.connect.placeholder': 'trek.example.com',
  'native.connect.submit': 'Csatlakozás',
  'native.connect.checking': 'Ellenőrzés…',
  'native.connect.errorInvalid': 'Ez nem úgy néz ki, mint egy webcím.',
  'native.connect.errorUnreachable': 'Ezen a címen nem válaszol szerver. Ellenőrizd a címet és a kapcsolatot.',
  'native.connect.errorNotTrek': 'Az ezen a címen futó szerver nem TREK.',
  'native.connect.errorTooOld': 'Ez a TREK-szerver túl régi az alkalmazáshoz. Előbb frissíteni kell.',
  'native.offline.title': 'A szerver nem érhető el',
  'native.offline.hint': 'A TREK nem érte el ezt: {server}. Ellenőrizd a kapcsolatot, és próbáld újra.',
  'native.offline.retry': 'Újra',
  'native.changeServer': 'Szerver módosítása',
  'native.login.failed': 'A bejelentkezés nem sikerült. Próbáld újra.',
  'native.handoff.title': 'Folytatás az alkalmazásban',
  'native.handoff.hint': '{name} néven vagy bejelentkezve. Nyisd meg a TREK alkalmazást, hogy ott befejezd a bejelentkezést.',
  'native.handoff.open': 'TREK alkalmazás megnyitása',
  'native.handoff.switchAccount': 'Másik fiók használata',
  'native.settings.server': 'Szerver',
  'native.settings.serverHint': 'Ez az alkalmazás ehhez csatlakozik: {server}.',
};

export default native;
