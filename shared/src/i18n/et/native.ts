import type { TranslationStrings } from '../types';

const native: TranslationStrings = {
  'native.connect.title': 'Ühenda TREKiga',
  'native.connect.hint': 'Sisesta aadress, millel avad TREKi brauseris.',
  'native.connect.placeholder': 'https://trek.example.com',
  'native.connect.submit': 'Ühenda',
  'native.connect.checking': 'Kontrollin…',
  'native.connect.tryDemo': 'Serverit veel pole? Proovi demot',
  'native.connect.whatIsServer': 'Mis on TREKi server?',
  'native.connect.errorInvalid': 'See ei näe välja nagu veebiaadress.',
  'native.connect.errorUnreachable': 'Sellel aadressil ei vastanud ükski server. Kontrolli aadressi ja oma ühendust.',
  'native.connect.errorNotTrek': 'Sellel aadressil olev server ei ole TREK.',
  'native.connect.errorTooOld': 'See TREKi server on rakenduse jaoks liiga vana. Seda tuleb esmalt uuendada.',
  'native.offline.title': 'Server pole kättesaadav',
  'native.offline.hint': 'TREK ei jõudnud serverini {server}. Kontrolli oma ühendust ja proovi uuesti.',
  'native.offline.retry': 'Proovi uuesti',
  'native.changeServer': 'Vaheta serverit',
  'native.login.failed': 'Sisselogimine ei õnnestunud. Palun proovi uuesti.',
  'native.handoff.title': 'Jätka rakenduses',
  'native.handoff.hint': 'Oled sisse logitud kui {name}. Ava TREKi rakendus, et sisselogimine seal lõpetada.',
  'native.handoff.open': 'Ava TREKi rakendus',
  'native.handoff.switchAccount': 'Kasuta teist kontot',
  'native.privacy': 'Privaatsuspoliitika',
  'native.settings.server': 'Server', // same-as-en
  'native.settings.serverHint': 'See rakendus on ühendatud serveriga {server}.',
};

export default native;
