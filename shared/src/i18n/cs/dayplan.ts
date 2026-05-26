import type { TranslationStrings } from '../types';

const dayplan: TranslationStrings = {
  'dayplan.icsTooltip': 'Exportovat kalendář (ICS)',
  'dayplan.emptyDay': 'Na tento den nejsou naplánována žádná místa',
  'dayplan.addNote': 'Přidat poznámku',
  'dayplan.editNote': 'Upravit poznámku',
  'dayplan.noteAdd': 'Přidat poznámku',
  'dayplan.noteEdit': 'Upravit poznámku',
  'dayplan.noteTitle': 'Poznámka',
  'dayplan.noteSubtitle': 'Poznámka ke dni',
  'dayplan.totalCost': 'Celkové náklady',
  'dayplan.days': 'Dny',
  'dayplan.dayN': 'Den {n}',
  'dayplan.calculating': 'Počítání...',
  'dayplan.route': 'Trasa',
  'dayplan.optimize': 'Optimalizovat',
  'dayplan.optimized': 'Trasa optimalizována',
  'dayplan.routeError': 'Nepodařilo se vypočítat trasu',
  'dayplan.toast.needTwoPlaces':
    'Pro optimalizaci trasy jsou potřeba alespoň dvě místa',
  'dayplan.toast.routeOptimized': 'Trasa byla optimalizována',
  'dayplan.toast.noGeoPlaces':
    'Nebyla nalezena žádná místa se souřadnicemi pro výpočet trasy',
  'dayplan.confirmed': 'Potvrzeno',
  'dayplan.pendingRes': 'Čeká na potvrzení',
  'dayplan.pdf': 'PDF',
  'dayplan.pdfTooltip': 'Exportovat denní plán do PDF',
  'dayplan.pdfError': 'Export do PDF se nezdařil',
  'dayplan.cannotReorderTransport':
    'Rezervace s pevným časem nelze přeuspořádat',
  'dayplan.confirmRemoveTimeTitle': 'Odebrat čas?',
  'dayplan.confirmRemoveTimeBody':
    'Toto místo má pevný čas ({time}). Přesunutím se čas odebere a povolí se volné řazení.',
  'dayplan.confirmRemoveTimeAction': 'Odebrat čas a přesunout',
  'dayplan.cannotDropOnTimed':
    'Položky nelze umístit mezi záznamy s pevným časem',
  'dayplan.cannotBreakChronology':
    'Toto by porušilo chronologické pořadí naplánovaných položek a rezervací',
  'dayplan.mobile.addPlace': 'Přidat místo',
  'dayplan.mobile.searchPlaces': 'Hledat místa...',
  'dayplan.mobile.allAssigned': 'Všechna místa přiřazena',
  'dayplan.mobile.noMatch': 'Žádná shoda',
  'dayplan.mobile.createNew': 'Vytvořit nové místo',
};
export default dayplan;
