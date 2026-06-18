import type { TranslationStrings } from '../types';

const oauth: TranslationStrings = {
  'oauth.scope.group.trips': 'Voyages',
  'oauth.scope.group.places': 'Lieux',
  'oauth.scope.group.atlas': 'Atlas',
  'oauth.scope.group.packing': 'Bagages',
  'oauth.scope.group.todos': 'Tâches',
  'oauth.scope.group.budget': 'Budget',
  'oauth.scope.group.reservations': 'Réservations',
  'oauth.scope.group.collab': 'Collaboration',
  'oauth.scope.group.notifications': 'Notifications',
  'oauth.scope.group.vacay': 'Congés',
  'oauth.scope.group.geo': 'Géo',
  'oauth.scope.group.weather': 'Météo',
  'oauth.scope.group.journey': 'Journal de voyage',
  'oauth.scope.trips:read.label': 'Voir les voyages et itinéraires',
  'oauth.scope.trips:read.description': 'Lire les voyages, jours, notes et membres',
  'oauth.scope.trips:write.label': 'Modifier les voyages et itinéraires',
  'oauth.scope.trips:write.description': 'Créer et mettre à jour les voyages, jours, notes et gérer les membres',
  'oauth.scope.trips:delete.label': 'Supprimer des voyages',
  'oauth.scope.trips:delete.description':
    'Supprimer définitivement des voyages entiers — cette action est irréversible',
  'oauth.scope.trips:share.label': 'Gérer les liens de partage',
  'oauth.scope.trips:share.description': 'Créer, modifier et révoquer des liens de partage publics',
  'oauth.scope.places:read.label': 'Voir les lieux et données cartographiques',
  'oauth.scope.places:read.description': 'Lire les lieux, affectations de jours, étiquettes et catégories',
  'oauth.scope.places:write.label': 'Gérer les lieux',
  'oauth.scope.places:write.description': 'Créer, modifier et supprimer des lieux, affectations et étiquettes',
  'oauth.scope.atlas:read.label': "Voir l'Atlas",
  'oauth.scope.atlas:read.description': 'Lire les pays visités, régions et liste de souhaits',
  'oauth.scope.atlas:write.label': "Gérer l'Atlas",
  'oauth.scope.atlas:write.description': 'Marquer des pays et régions visités, gérer la liste de souhaits',
  'oauth.scope.packing:read.label': 'Voir les listes de bagages',
  'oauth.scope.packing:read.description': 'Lire les articles, sacs et assignations de catégories',
  'oauth.scope.packing:write.label': 'Gérer les listes de bagages',
  'oauth.scope.packing:write.description': 'Ajouter, modifier, supprimer, cocher et réordonner les articles et sacs',
  'oauth.scope.todos:read.label': 'Voir les listes de tâches',
  'oauth.scope.todos:read.description': 'Lire les tâches et assignations de catégories',
  'oauth.scope.todos:write.label': 'Gérer les listes de tâches',
  'oauth.scope.todos:write.description': 'Créer, modifier, cocher, supprimer et réordonner les tâches',
  'oauth.scope.budget:read.label': 'Voir le budget',
  'oauth.scope.budget:read.description': 'Lire les dépenses et la répartition du budget',
  'oauth.scope.budget:write.label': 'Gérer le budget',
  'oauth.scope.budget:write.description': 'Créer, modifier et supprimer des dépenses',
  'oauth.scope.reservations:read.label': 'Voir les réservations',
  'oauth.scope.reservations:read.description': "Lire les réservations et détails d'hébergement",
  'oauth.scope.reservations:write.label': 'Gérer les réservations',
  'oauth.scope.reservations:write.description': 'Créer, modifier, supprimer et réordonner les réservations',
  'oauth.scope.collab:read.label': 'Voir la collaboration',
  'oauth.scope.collab:read.description': 'Lire les notes, sondages et messages collaboratifs',
  'oauth.scope.collab:write.label': 'Gérer la collaboration',
  'oauth.scope.collab:write.description': 'Créer, modifier et supprimer des notes, sondages et messages',
  'oauth.scope.notifications:read.label': 'Voir les notifications',
  'oauth.scope.notifications:read.description': 'Lire les notifications et le nombre de non-lus',
  'oauth.scope.notifications:write.label': 'Gérer les notifications',
  'oauth.scope.notifications:write.description': 'Marquer les notifications comme lues et y répondre',
  'oauth.scope.vacay:read.label': 'Voir les plans de congés',
  'oauth.scope.vacay:read.description': 'Lire les données, entrées et statistiques de congés',
  'oauth.scope.vacay:write.label': 'Gérer les plans de congés',
  'oauth.scope.vacay:write.description': "Créer et gérer les entrées de congés, jours fériés et plans d'équipe",
  'oauth.scope.geo:read.label': 'Cartes et géocodage',
  'oauth.scope.geo:read.description':
    'Chercher des lieux, résoudre des URL cartographiques et géocoder des coordonnées',
  'oauth.scope.weather:read.label': 'Prévisions météo',
  'oauth.scope.weather:read.description': 'Obtenir les prévisions météo pour les lieux et dates de voyage',
  'oauth.scope.journey:read.label': 'Voir les journaux de voyage',
  'oauth.scope.journey:read.description': 'Lire les journaux de voyage, les entrées et la liste des contributeurs',
  'oauth.scope.journey:write.label': 'Gérer les journaux de voyage',
  'oauth.scope.journey:write.description': 'Créer, modifier et supprimer les journaux de voyage et leurs entrées',
  'oauth.scope.journey:share.label': 'Gérer les liens de journaux de voyage',
  'oauth.scope.journey:share.description':
    'Créer, modifier et révoquer des liens de partage publics pour les journaux de voyage',
  'oauth.authorize.authorizing': 'Authorizing…', // en-fallback
  'oauth.authorize.loading': 'Loading…', // en-fallback
  'oauth.authorize.errorTitle': 'Authorization Error', // en-fallback
  'oauth.authorize.loginTitle': 'Sign in to continue', // en-fallback
  'oauth.authorize.loginDescription': '{client} wants access to your TREK account. Please sign in first.', // en-fallback
  'oauth.authorize.loginButton': 'Sign in to TREK', // en-fallback
  'oauth.authorize.requestLabel': 'Authorization Request', // en-fallback
  'oauth.authorize.requestDescription': 'This application is requesting access to your TREK account.', // en-fallback
  'oauth.authorize.trustNote': 'Only grant access to applications you trust. Your data stays on your server.', // en-fallback
  'oauth.authorize.selectScope': 'Select at least one scope', // en-fallback
  'oauth.authorize.approveOneScope': 'Approve ({count} scope)', // en-fallback
  'oauth.authorize.approveManyScopes': 'Approve ({count} scopes)', // en-fallback
  'oauth.authorize.approveAccess': 'Approve Access', // en-fallback
  'oauth.authorize.deny': 'Deny', // en-fallback
  'oauth.authorize.choosePermissions': 'Choose which permissions to grant', // en-fallback
  'oauth.authorize.permissionsRequested': 'Permissions requested', // en-fallback
  'oauth.authorize.alwaysIncluded': 'Always included', // en-fallback
  'oauth.authorize.alwaysTool.listTrips': 'List your trips so the AI can discover trip IDs', // en-fallback
  'oauth.authorize.alwaysTool.getTripSummary': 'Read a trip overview needed to use any other tool', // en-fallback
};
export default oauth;
