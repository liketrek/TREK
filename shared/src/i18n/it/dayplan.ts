import type { TranslationStrings } from '../types';

const dayplan: TranslationStrings = {
  'dayplan.icsTooltip': 'Esporta calendario (ICS)',
  'dayplan.emptyDay': 'Nessun luogo programmato per questo giorno',
  'dayplan.addNote': 'Aggiungi nota',
  'dayplan.editNote': 'Modifica nota',
  'dayplan.noteAdd': 'Aggiungi nota',
  'dayplan.noteEdit': 'Modifica nota',
  'dayplan.noteTitle': 'Nota',
  'dayplan.noteSubtitle': 'Nota giornaliera',
  'dayplan.totalCost': 'Costo totale',
  'dayplan.days': 'Giorni',
  'dayplan.dayN': 'Giorno {n}',
  'dayplan.calculating': 'Calcolo in corso...',
  'dayplan.route': 'Percorso',
  'dayplan.optimize': 'Ottimizza',
  'dayplan.optimized': 'Percorso ottimizzato',
  'dayplan.routeError': 'Impossibile calcolare il percorso',
  'dayplan.toast.needTwoPlaces':
    "Servono almeno due luoghi per l'ottimizzazione del percorso",
  'dayplan.toast.routeOptimized': 'Percorso ottimizzato',
  'dayplan.toast.noGeoPlaces':
    'Nessun luogo con coordinate trovato per il calcolo del percorso',
  'dayplan.confirmed': 'Confermata',
  'dayplan.pendingRes': 'In attesa',
  'dayplan.pdf': 'PDF',
  'dayplan.pdfTooltip': 'Esporta il programma del giorno come PDF',
  'dayplan.pdfError': 'Impossibile esportare il PDF',
  'dayplan.cannotReorderTransport':
    'Le prenotazioni con un orario fisso non possono essere riordinate',
  'dayplan.confirmRemoveTimeTitle': "Rimuovere l'orario?",
  'dayplan.confirmRemoveTimeBody':
    "Questo luogo ha un orario fisso ({time}). Spostarlo rimuoverà l'orario e consentirà l'ordinamento libero.",
  'dayplan.confirmRemoveTimeAction': 'Rimuovi orario e sposta',
  'dayplan.cannotDropOnTimed':
    'Gli elementi non possono essere posizionati tra voci con orario fisso',
  'dayplan.cannotBreakChronology':
    "Ciò interromperebbe l'ordine cronologico degli elementi e delle prenotazioni pianificati",
  'dayplan.mobile.addPlace': 'Aggiungi luogo',
  'dayplan.mobile.searchPlaces': 'Cerca luoghi...',
  'dayplan.mobile.allAssigned': 'Tutti i luoghi assegnati',
  'dayplan.mobile.noMatch': 'Nessun risultato',
  'dayplan.mobile.createNew': 'Crea nuovo luogo',
  'dayplan.expandAll': 'Expand all days', // en-fallback
  'dayplan.collapseAll': 'Collapse all days', // en-fallback
};
export default dayplan;
