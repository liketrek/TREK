import type { TranslationStrings } from '../types';

const dayplan: TranslationStrings = {
  'dayplan.icsTooltip': 'Exporter le calendrier (ICS)',
  'dayplan.emptyDay': 'Aucun lieu prévu pour ce jour',
  'dayplan.addNote': 'Ajouter une note',
  'dayplan.editNote': 'Modifier la note',
  'dayplan.noteAdd': 'Ajouter une note',
  'dayplan.noteEdit': 'Modifier la note',
  'dayplan.noteTitle': 'Note',
  'dayplan.noteSubtitle': 'Note du jour',
  'dayplan.totalCost': 'Coût total',
  'dayplan.days': 'Jours',
  'dayplan.dayN': 'Jour {n}',
  'dayplan.calculating': 'Calcul en cours…',
  'dayplan.route': 'Itinéraire',
  'dayplan.optimize': 'Optimiser',
  'dayplan.optimized': 'Itinéraire optimisé',
  'dayplan.routeError': "Impossible de calculer l'itinéraire",
  'dayplan.toast.needTwoPlaces':
    "Au moins deux lieux nécessaires pour optimiser l'itinéraire",
  'dayplan.toast.routeOptimized': 'Itinéraire optimisé',
  'dayplan.toast.noGeoPlaces':
    "Aucun lieu avec des coordonnées trouvé pour le calcul d'itinéraire",
  'dayplan.confirmed': 'Confirmé',
  'dayplan.pendingRes': 'En attente',
  'dayplan.pdf': 'PDF',
  'dayplan.pdfTooltip': 'Exporter le plan du jour en PDF',
  'dayplan.pdfError': "Échec de l'export PDF",
  'dayplan.cannotReorderTransport':
    'Les réservations avec une heure fixe ne peuvent pas être réorganisées',
  'dayplan.confirmRemoveTimeTitle': "Supprimer l'heure ?",
  'dayplan.confirmRemoveTimeBody':
    "Ce lieu a une heure fixe ({time}). Le déplacer supprimera l'heure et permettra un tri libre.",
  'dayplan.confirmRemoveTimeAction': "Supprimer l'heure et déplacer",
  'dayplan.cannotDropOnTimed':
    'Les éléments ne peuvent pas être placés entre des entrées à heure fixe',
  'dayplan.cannotBreakChronology':
    "Cela briserait l'ordre chronologique des éléments et réservations planifiés",
  'dayplan.mobile.addPlace': 'Ajouter un lieu',
  'dayplan.mobile.searchPlaces': 'Rechercher des lieux...',
  'dayplan.mobile.allAssigned': 'Tous les lieux attribués',
  'dayplan.mobile.noMatch': 'Aucun résultat',
  'dayplan.mobile.createNew': 'Créer un nouveau lieu',
  'dayplan.expandAll': 'Expand all days', // en-fallback
  'dayplan.collapseAll': 'Collapse all days', // en-fallback
};
export default dayplan;
