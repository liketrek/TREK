import type { TranslationStrings } from '../types';

const dayplan: TranslationStrings = {
  'dayplan.icsTooltip': 'Eksportuj kalendarz (ICS)',
  'dayplan.emptyDay': 'Brak miejsc zaplanowanych na ten dzień',
  'dayplan.cannotReorderTransport':
    'Nie można zmieniać kolejności dla rezerwacji z określoną godziną',
  'dayplan.confirmRemoveTimeTitle': 'Usunąć godzinę?',
  'dayplan.confirmRemoveTimeBody':
    'To miejsce ma określoną godzinę ({time}). Przeniesienie go usunie godzinę i umożliwi swobodne sortowanie.',
  'dayplan.confirmRemoveTimeAction': 'Usuń godzinę i przenieś',
  'dayplan.cannotDropOnTimed':
    'Nie można umieszczać elementów pomiędzy wpisami z określoną godziną',
  'dayplan.cannotBreakChronology':
    'Spowodowałoby to naruszenie chronologicznej kolejności elementów i rezerwacji z określoną godziną',
  'dayplan.addNote': 'Dodaj notatkę',
  'dayplan.editNote': 'Edytuj notatkę',
  'dayplan.noteAdd': 'Dodaj notatkę',
  'dayplan.noteEdit': 'Edytuj notatkę',
  'dayplan.noteTitle': 'Notatka',
  'dayplan.noteSubtitle': 'Notatka dnia',
  'dayplan.totalCost': 'Łączny koszt',
  'dayplan.days': 'Dni',
  'dayplan.dayN': 'Dzień {n}',
  'dayplan.calculating': 'Obliczanie...',
  'dayplan.route': 'Trasa',
  'dayplan.optimize': 'Optymalizuj',
  'dayplan.optimized': 'Trasa została zoptymalizowana',
  'dayplan.routeError': 'Nie udało się obliczyć trasy',
  'dayplan.toast.needTwoPlaces':
    'Potrzeba co najmniej dwóch miejsc, aby zoptymalizować trasę',
  'dayplan.toast.routeOptimized': 'Trasa została zoptymalizowana',
  'dayplan.toast.noGeoPlaces':
    'Nie znaleziono miejsc ze współrzędnymi do obliczenia trasy',
  'dayplan.confirmed': 'Potwierdzono',
  'dayplan.pendingRes': 'Oczekujące',
  'dayplan.pdf': 'PDF',
  'dayplan.pdfTooltip': 'Eksportuj plan dnia jako PDF',
  'dayplan.pdfError': 'Nie udało się wyeksportować pliku PDF',
  'dayplan.mobile.addPlace': 'Dodaj miejsce',
  'dayplan.mobile.searchPlaces': 'Szukaj miejsc...',
  'dayplan.mobile.allAssigned': 'Wszystkie miejsca przypisane',
  'dayplan.mobile.noMatch': 'Brak wyników',
  'dayplan.mobile.createNew': 'Utwórz nowe miejsce',
};
export default dayplan;
