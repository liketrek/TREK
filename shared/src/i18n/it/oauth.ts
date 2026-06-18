import type { TranslationStrings } from '../types';

const oauth: TranslationStrings = {
  'oauth.scope.group.trips': 'Viaggi',
  'oauth.scope.group.places': 'Luoghi',
  'oauth.scope.group.atlas': 'Atlas',
  'oauth.scope.group.packing': 'Bagagli',
  'oauth.scope.group.todos': 'Attività',
  'oauth.scope.group.budget': 'Budget',
  'oauth.scope.group.reservations': 'Prenotazioni',
  'oauth.scope.group.collab': 'Collaborazione',
  'oauth.scope.group.notifications': 'Notifiche',
  'oauth.scope.group.vacay': 'Ferie',
  'oauth.scope.group.geo': 'Geo',
  'oauth.scope.group.weather': 'Meteo',
  'oauth.scope.group.journey': 'Diario di viaggio',
  'oauth.scope.trips:read.label': 'Visualizza viaggi e itinerari',
  'oauth.scope.trips:read.description': 'Leggi viaggi, giorni, note giornaliere e membri',
  'oauth.scope.trips:write.label': 'Modifica viaggi e itinerari',
  'oauth.scope.trips:write.description': 'Crea e aggiorna viaggi, giorni, note e gestisci membri',
  'oauth.scope.trips:delete.label': 'Elimina viaggi',
  'oauth.scope.trips:delete.description': 'Elimina definitivamente interi viaggi — questa azione è irreversibile',
  'oauth.scope.trips:share.label': 'Gestisci link di condivisione',
  'oauth.scope.trips:share.description': 'Crea, aggiorna e revoca link di condivisione pubblici per i viaggi',
  'oauth.scope.places:read.label': 'Visualizza luoghi e dati mappa',
  'oauth.scope.places:read.description': 'Leggi luoghi, assegnazioni giornaliere, tag e categorie',
  'oauth.scope.places:write.label': 'Gestisci luoghi',
  'oauth.scope.places:write.description': 'Crea, aggiorna ed elimina luoghi, assegnazioni e tag',
  'oauth.scope.atlas:read.label': 'Visualizza Atlas',
  'oauth.scope.atlas:read.description': 'Leggi paesi visitati, regioni e lista dei desideri',
  'oauth.scope.atlas:write.label': 'Gestisci Atlas',
  'oauth.scope.atlas:write.description': 'Segna paesi e regioni come visitati, gestisci la lista dei desideri',
  'oauth.scope.packing:read.label': 'Visualizza liste bagagli',
  'oauth.scope.packing:read.description': 'Leggi articoli, borse e assegnatari di categoria',
  'oauth.scope.packing:write.label': 'Gestisci liste bagagli',
  'oauth.scope.packing:write.description': 'Aggiungi, aggiorna, elimina, spunta e riordina articoli e borse',
  'oauth.scope.todos:read.label': 'Visualizza liste attività',
  'oauth.scope.todos:read.description': 'Leggi attività del viaggio e assegnatari di categoria',
  'oauth.scope.todos:write.label': 'Gestisci liste attività',
  'oauth.scope.todos:write.description': 'Crea, aggiorna, spunta, elimina e riordina attività',
  'oauth.scope.budget:read.label': 'Visualizza budget',
  'oauth.scope.budget:read.description': 'Leggi voci di budget e ripartizione delle spese',
  'oauth.scope.budget:write.label': 'Gestisci budget',
  'oauth.scope.budget:write.description': 'Crea, aggiorna ed elimina voci di budget',
  'oauth.scope.reservations:read.label': 'Visualizza prenotazioni',
  'oauth.scope.reservations:read.description': 'Leggi prenotazioni e dettagli alloggio',
  'oauth.scope.reservations:write.label': 'Gestisci prenotazioni',
  'oauth.scope.reservations:write.description': 'Crea, aggiorna, elimina e riordina prenotazioni',
  'oauth.scope.collab:read.label': 'Visualizza collaborazione',
  'oauth.scope.collab:read.description': 'Leggi note collaborative, sondaggi e messaggi',
  'oauth.scope.collab:write.label': 'Gestisci collaborazione',
  'oauth.scope.collab:write.description': 'Crea, aggiorna ed elimina note collaborative, sondaggi e messaggi',
  'oauth.scope.notifications:read.label': 'Visualizza notifiche',
  'oauth.scope.notifications:read.description': 'Leggi notifiche in-app e conteggi non letti',
  'oauth.scope.notifications:write.label': 'Gestisci notifiche',
  'oauth.scope.notifications:write.description': 'Segna notifiche come lette e rispondi',
  'oauth.scope.vacay:read.label': 'Visualizza piani ferie',
  'oauth.scope.vacay:read.description': 'Leggi dati di pianificazione ferie, voci e statistiche',
  'oauth.scope.vacay:write.label': 'Gestisci piani ferie',
  'oauth.scope.vacay:write.description': 'Crea e gestisci voci ferie, festività e piani del team',
  'oauth.scope.geo:read.label': 'Mappe e geocodifica',
  'oauth.scope.geo:read.description': 'Cerca luoghi, risolvi URL mappa e geocodifica inversa coordinate',
  'oauth.scope.weather:read.label': 'Previsioni meteo',
  'oauth.scope.weather:read.description': 'Ottieni previsioni meteo per luoghi e date del viaggio',
  'oauth.scope.journey:read.label': 'Visualizza diari di viaggio',
  'oauth.scope.journey:read.description': 'Leggi diari di viaggio, voci e lista dei collaboratori',
  'oauth.scope.journey:write.label': 'Gestisci diari di viaggio',
  'oauth.scope.journey:write.description': 'Crea, aggiorna ed elimina diari di viaggio e le loro voci',
  'oauth.scope.journey:share.label': 'Gestisci link diari di viaggio',
  'oauth.scope.journey:share.description':
    'Crea, aggiorna e revoca link di condivisione pubblici per i diari di viaggio',
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
