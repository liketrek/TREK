import type { TranslationStrings } from '../types';

const native: TranslationStrings = {
  'native.connect.title': 'Pripojiť k TREK',
  'native.connect.hint': 'Zadajte adresu, na ktorej otvárate TREK v prehliadači.',
  'native.connect.placeholder': 'https://trek.example.com',
  'native.connect.submit': 'Pripojiť',
  'native.connect.checking': 'Overuje sa…',
  'native.connect.tryDemo': 'Ešte nemáte server? Vyskúšajte demo',
  'native.connect.whatIsServer': 'Čo je server TREK?',
  'native.connect.errorInvalid': 'Toto nevyzerá ako webová adresa.',
  'native.connect.errorUnreachable': 'Na tejto adrese neodpovedal žiadny server. Skontrolujte adresu a pripojenie.',
  'native.connect.errorNotTrek': 'Server na tejto adrese nie je TREK.',
  'native.connect.errorTooOld': 'Tento server TREK je pre aplikáciu príliš starý. Najprv ho treba aktualizovať.',
  'native.offline.title': 'Server nie je dostupný',
  'native.offline.hint': 'TREK sa nepodarilo spojiť so serverom {server}. Skontrolujte pripojenie a skúste to znova.',
  'native.offline.retry': 'Skúsiť znova',
  'native.changeServer': 'Zmeniť server',
  'native.login.failed': 'Prihlásenie sa nepodarilo. Skúste to, prosím, znova.',
  'native.handoff.title': 'Pokračovať v aplikácii',
  'native.handoff.hint': 'Ste prihlásení ako {name}. Otvorte aplikáciu TREK a dokončite prihlásenie v nej.',
  'native.handoff.open': 'Otvoriť aplikáciu TREK',
  'native.handoff.switchAccount': 'Použiť iný účet',
  'native.privacy': 'Zásady ochrany osobných údajov',
  'native.settings.server': 'Server', // same-as-en
  'native.settings.serverHint': 'Táto aplikácia je pripojená k serveru {server}.',
};

export default native;
