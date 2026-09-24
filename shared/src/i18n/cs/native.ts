import type { TranslationStrings } from '../types';

const native: TranslationStrings = {
  'native.connect.title': 'Připojit k TREK',
  'native.connect.hint': 'Zadejte adresu, na které otevíráte TREK v prohlížeči.',
  'native.connect.placeholder': 'trek.example.com',
  'native.connect.submit': 'Připojit',
  'native.connect.checking': 'Ověřování…',
  'native.connect.errorInvalid': 'To nevypadá jako webová adresa.',
  'native.connect.errorUnreachable': 'Na této adrese neodpovídá žádný server. Zkontrolujte adresu a připojení.',
  'native.connect.errorNotTrek': 'Server na této adrese není TREK.',
  'native.connect.errorTooOld': 'Tento server TREK je pro aplikaci příliš starý. Nejprve potřebuje aktualizaci.',
  'native.offline.title': 'Server není dostupný',
  'native.offline.hint': 'TREK se nepodařilo spojit s {server}. Zkontrolujte připojení a zkuste to znovu.',
  'native.offline.retry': 'Zkusit znovu',
  'native.changeServer': 'Změnit server',
  'native.login.failed': 'Přihlášení se nezdařilo. Zkuste to prosím znovu.',
  'native.handoff.title': 'Pokračovat v aplikaci',
  'native.handoff.hint': 'Jste přihlášeni jako {name}. Otevřete aplikaci TREK a dokončete přihlášení v ní.',
  'native.handoff.open': 'Otevřít aplikaci TREK',
  'native.handoff.switchAccount': 'Použít jiný účet',
  'native.settings.server': 'Server',
  'native.settings.serverHint': 'Tato aplikace je připojena k {server}.',
};

export default native;
