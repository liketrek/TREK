import type { TranslationStrings } from '../types';

const dayplan: TranslationStrings = {
  'dayplan.icsTooltip': 'Naptár exportálása (ICS)',
  'dayplan.emptyDay': 'Nincs tervezett hely erre a napra',
  'dayplan.addNote': 'Jegyzet hozzáadása',
  'dayplan.editNote': 'Jegyzet szerkesztése',
  'dayplan.noteAdd': 'Jegyzet hozzáadása',
  'dayplan.noteEdit': 'Jegyzet szerkesztése',
  'dayplan.noteTitle': 'Jegyzet',
  'dayplan.noteSubtitle': 'Napi jegyzet',
  'dayplan.totalCost': 'Összköltség',
  'dayplan.days': 'nap',
  'dayplan.dayN': '{n}. nap',
  'dayplan.calculating': 'Számítás...',
  'dayplan.route': 'Útvonal',
  'dayplan.optimize': 'Optimalizálás',
  'dayplan.optimized': 'Útvonal optimalizálva',
  'dayplan.routeError': 'Nem sikerült kiszámítani az útvonalat',
  'dayplan.toast.needTwoPlaces':
    'Legalább két hely szükséges az útvonal-optimalizáláshoz',
  'dayplan.toast.routeOptimized': 'Útvonal optimalizálva',
  'dayplan.toast.noGeoPlaces':
    'Nem találhatók koordinátákkal rendelkező helyek az útvonalszámításhoz',
  'dayplan.confirmed': 'Megerősítve',
  'dayplan.pendingRes': 'Függőben',
  'dayplan.pdf': 'PDF',
  'dayplan.pdfTooltip': 'Napi terv exportálása PDF-be',
  'dayplan.pdfError': 'Nem sikerült a PDF exportálás',
  'dayplan.cannotReorderTransport':
    'A rögzített időpontú foglalások nem rendezhetők át',
  'dayplan.confirmRemoveTimeTitle': 'Időpont eltávolítása?',
  'dayplan.confirmRemoveTimeBody':
    'Ennek a helynek rögzített időpontja van ({time}). Az áthelyezéssel az időpont eltávolítódik és szabad rendezés válik lehetővé.',
  'dayplan.confirmRemoveTimeAction': 'Időpont eltávolítása és áthelyezés',
  'dayplan.cannotDropOnTimed':
    'Elemek nem helyezhetők rögzített időpontú bejegyzések közé',
  'dayplan.cannotBreakChronology':
    'Ez megbontaná az időzített elemek és foglalások időrendi sorrendjét',
  'dayplan.mobile.addPlace': 'Helyszín hozzáadása',
  'dayplan.mobile.searchPlaces': 'Helyszínek keresése...',
  'dayplan.mobile.allAssigned': 'Minden helyszín kiosztva',
  'dayplan.mobile.noMatch': 'Nincs találat',
  'dayplan.mobile.createNew': 'Új helyszín létrehozása',
  'dayplan.expandAll': 'Expand all days', // en-fallback
  'dayplan.collapseAll': 'Collapse all days', // en-fallback
};
export default dayplan;
