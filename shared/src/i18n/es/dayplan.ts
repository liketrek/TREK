import type { TranslationStrings } from '../types';

const dayplan: TranslationStrings = {
  'dayplan.icsTooltip': 'Exportar calendario (ICS)',
  'dayplan.emptyDay': 'No hay lugares planificados para este día',
  'dayplan.addNote': 'Añadir nota',
  'dayplan.editNote': 'Editar nota',
  'dayplan.noteAdd': 'Añadir nota',
  'dayplan.noteEdit': 'Editar nota',
  'dayplan.noteTitle': 'Nota',
  'dayplan.noteSubtitle': 'Nota diaria',
  'dayplan.totalCost': 'Coste total',
  'dayplan.days': 'Días',
  'dayplan.dayN': 'Día {n}',
  'dayplan.calculating': 'Calculando...',
  'dayplan.route': 'Ruta',
  'dayplan.optimize': 'Optimizar',
  'dayplan.optimized': 'Ruta optimizada',
  'dayplan.routeError': 'No se pudo calcular la ruta',
  'dayplan.toast.needTwoPlaces':
    'Se necesitan al menos dos lugares para optimizar la ruta',
  'dayplan.toast.routeOptimized': 'Ruta optimizada',
  'dayplan.toast.noGeoPlaces':
    'No se encontraron lugares con coordenadas para calcular la ruta',
  'dayplan.confirmed': 'Confirmado',
  'dayplan.pendingRes': 'Pendiente',
  'dayplan.pdf': 'PDF',
  'dayplan.pdfTooltip': 'Exportar plan diario como PDF',
  'dayplan.pdfError': 'No se pudo exportar el PDF',
  'dayplan.cannotReorderTransport':
    'Las reservas con hora fija no se pueden reordenar',
  'dayplan.confirmRemoveTimeTitle': '¿Eliminar hora?',
  'dayplan.confirmRemoveTimeBody':
    'Este lugar tiene una hora fija ({time}). Al moverlo se eliminará la hora y se permitirá el orden libre.',
  'dayplan.confirmRemoveTimeAction': 'Eliminar hora y mover',
  'dayplan.cannotDropOnTimed':
    'No se pueden colocar elementos entre entradas con hora fija',
  'dayplan.cannotBreakChronology':
    'Esto rompería el orden cronológico de los elementos y reservas programados',
  'dayplan.mobile.addPlace': 'Añadir lugar',
  'dayplan.mobile.searchPlaces': 'Buscar lugares...',
  'dayplan.mobile.allAssigned': 'Todos los lugares asignados',
  'dayplan.mobile.noMatch': 'Sin coincidencias',
  'dayplan.mobile.createNew': 'Crear nuevo lugar',
  'dayplan.expandAll': 'Expand all days', // en-fallback
  'dayplan.collapseAll': 'Collapse all days', // en-fallback
};
export default dayplan;
