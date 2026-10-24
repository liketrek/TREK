import type { TranslationStrings } from '../types';

const wandererWatch: TranslationStrings = {
  'wanderer.watch.label': 'Kontrolovať zmeny mojich trás',
  'wanderer.watch.hint': 'Upozornenie, keď sa importovaná trasa mohla zmeniť.',
  'wanderer.watch.info':
    'Najviac raz denne TREK prečíta krátky záznam každej trasy, ktorú ste importovali, nikdy jej súbor GPX. Len vás upozorní: či zmenu prevezmete, rozhodnete sami kontrolou zdroja túry.',
  'wanderer.watch.notConnected': 'Najprv pripojte wanderer',
  'wanderer.watch.on': 'Kontrola na pozadí zapnutá',
  'wanderer.watch.off': 'Kontrola na pozadí vypnutá',
  'wanderer.watch.failed': 'Kontrolu na pozadí sa nepodarilo prepnúť',
  'wanderer.watch.lastRun': 'Naposledy skontrolované {date}',
  'wanderer.watch.neverRun': 'Zatiaľ neskontrolované',
  'wanderer.watch.paused': 'Pozastavené do {time}',
  'wanderer.watch.pausedHint': 'wanderer neodpovedal. Po každom neúspechu TREK čaká dlhšie, kým sa znova opýta.',
  'wanderer.watch.blocked': 'Token odmietnutý',
  'wanderer.watch.blockedHint':
    'wanderer odmietol token API. Kontrola pokračuje, keď prejde test pripojenia alebo sa uloží nový token.',
  'wanderer.watch.hints': 'Upozornenia',
  'wanderer.watch.hintsCount': '{count} otvorených upozornení',
  'wanderer.watch.hintsCount.one': '{count} otvorené upozornenie',
  'wanderer.watch.hintsCount.few': '{count} otvorené upozornenia',
  'wanderer.watch.empty': 'Žiadne otvorené upozornenia',
  'wanderer.watch.dialogTitle': 'Upozornenia k vašim trasám',
  'wanderer.watch.openTour': 'Otvoriť túru',
  'wanderer.watch.checkedAt': 'Skontrolované {date}',
  'wanderer.watch.noticeLabel': 'Kontrola na pozadí',
  'wanderer.watch.state.possible_change': 'Možno zmenené',
  'wanderer.watch.state.changed': 'Zmenené',
  'wanderer.watch.state.unverifiable': 'Nedá sa overiť',
  'wanderer.watch.stateHint.possible_change':
    'wanderer zmenil časovú pečiatku trasy. Len kontrola zdroja ukáže, či sa líši obsah.',
  'wanderer.watch.stateHint.changed':
    'Záznam vo wanderer ukazuje iný názov alebo popis. Kontrola zdroja ukáže všetko, čo sa zmenilo.',
  'wanderer.watch.stateHint.unverifiable': 'TREK túto trasu nemohol posúdiť, takže sa o zmene nič nehovorí.',
  'wanderer.watch.reason.unavailable': 'Trasa nie je dostupná',
  'wanderer.watch.reason.no_change_time': 'Bez časovej pečiatky',
};
export default wandererWatch;
