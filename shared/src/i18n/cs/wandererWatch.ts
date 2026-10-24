import type { TranslationStrings } from '../types';

const wandererWatch: TranslationStrings = {
  'wanderer.watch.label': 'Kontrolovat změny mých tras',
  'wanderer.watch.hint': 'Upozornění, když se importovaná trasa mohla změnit.',
  'wanderer.watch.info':
    'Nejvýše jednou denně TREK přečte krátký záznam každé trasy, kterou jste importovali, nikdy její soubor GPX. Jen vás upozorní: zda změnu převezmete, rozhodnete sami kontrolou zdroje túry.',
  'wanderer.watch.notConnected': 'Nejdřív připojte wanderer',
  'wanderer.watch.on': 'Kontrola na pozadí zapnuta',
  'wanderer.watch.off': 'Kontrola na pozadí vypnuta',
  'wanderer.watch.failed': 'Kontrolu na pozadí se nepodařilo přepnout',
  'wanderer.watch.lastRun': 'Naposledy zkontrolováno {date}',
  'wanderer.watch.neverRun': 'Zatím nezkontrolováno',
  'wanderer.watch.paused': 'Pozastaveno do {time}',
  'wanderer.watch.pausedHint': 'wanderer neodpověděl. Po každém nezdaru TREK čeká déle, než se zeptá znovu.',
  'wanderer.watch.blocked': 'Token odmítnut',
  'wanderer.watch.blockedHint':
    'wanderer odmítl token API. Kontrola pokračuje, jakmile projde test připojení nebo se uloží nový token.',
  'wanderer.watch.hints': 'Upozornění',
  'wanderer.watch.hintsCount': '{count} otevřených upozornění',
  'wanderer.watch.hintsCount.one': '{count} otevřené upozornění',
  'wanderer.watch.hintsCount.few': '{count} otevřená upozornění',
  'wanderer.watch.empty': 'Žádná otevřená upozornění',
  'wanderer.watch.dialogTitle': 'Upozornění k vašim trasám',
  'wanderer.watch.openTour': 'Otevřít túru',
  'wanderer.watch.checkedAt': 'Zkontrolováno {date}',
  'wanderer.watch.noticeLabel': 'Kontrola na pozadí',
  'wanderer.watch.state.possible_change': 'Možná změněno',
  'wanderer.watch.state.changed': 'Změněno',
  'wanderer.watch.state.unverifiable': 'Nelze ověřit',
  'wanderer.watch.stateHint.possible_change':
    'wanderer změnil časové razítko trasy. Jen kontrola zdroje ukáže, zda se liší obsah.',
  'wanderer.watch.stateHint.changed':
    'Záznam ve wanderer ukazuje jiný název nebo popis. Kontrola zdroje ukáže vše, co se změnilo.',
  'wanderer.watch.stateHint.unverifiable': 'TREK tuto trasu nemohl posoudit, takže se o změně nic neříká.',
  'wanderer.watch.reason.unavailable': 'Trasa není dostupná',
  'wanderer.watch.reason.no_change_time': 'Bez časového razítka',
};
export default wandererWatch;
