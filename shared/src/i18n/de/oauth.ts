import type { TranslationStrings } from '../types';

const oauth: TranslationStrings = {
  'oauth.scope.group.trips': 'Reisen',
  'oauth.scope.group.places': 'Orte',
  'oauth.scope.group.atlas': 'Atlas',
  'oauth.scope.group.packing': 'Packliste',
  'oauth.scope.group.todos': 'Aufgaben',
  'oauth.scope.group.budget': 'Budget',
  'oauth.scope.group.reservations': 'Buchungen',
  'oauth.scope.group.collab': 'Zusammenarbeit',
  'oauth.scope.group.notifications': 'Benachrichtigungen',
  'oauth.scope.group.vacay': 'Urlaub',
  'oauth.scope.group.geo': 'Geo',
  'oauth.scope.group.weather': 'Wetter',
  'oauth.scope.group.journey': 'Journey',
  'oauth.scope.trips:read.label': 'Reisen und Reisepläne anzeigen',
  'oauth.scope.trips:read.description': 'Reisen, Tage, Tagesnotizen und Mitglieder lesen',
  'oauth.scope.trips:write.label': 'Reisen und Reisepläne bearbeiten',
  'oauth.scope.trips:write.description': 'Reisen, Tage und Notizen erstellen, aktualisieren und Mitglieder verwalten',
  'oauth.scope.trips:delete.label': 'Reisen löschen',
  'oauth.scope.trips:delete.description': 'Reisen dauerhaft löschen — diese Aktion ist unwiderruflich',
  'oauth.scope.trips:share.label': 'Freigabelinks verwalten',
  'oauth.scope.trips:share.description': 'Öffentliche Freigabelinks erstellen, aktualisieren und widerrufen',
  'oauth.scope.places:read.label': 'Orte und Kartendaten anzeigen',
  'oauth.scope.places:read.description': 'Orte, Tageszuweisungen, Tags und Kategorien lesen',
  'oauth.scope.places:write.label': 'Orte verwalten',
  'oauth.scope.places:write.description': 'Orte, Zuweisungen und Tags erstellen, aktualisieren und löschen',
  'oauth.scope.atlas:read.label': 'Atlas anzeigen',
  'oauth.scope.atlas:read.description': 'Besuchte Länder, Regionen und Wunschliste lesen',
  'oauth.scope.atlas:write.label': 'Atlas verwalten',
  'oauth.scope.atlas:write.description': 'Länder und Regionen als besucht markieren, Wunschliste verwalten',
  'oauth.scope.packing:read.label': 'Packlisten anzeigen',
  'oauth.scope.packing:read.description': 'Packgegenstände, Taschen und Kategoriezuweisungen lesen',
  'oauth.scope.packing:write.label': 'Packlisten verwalten',
  'oauth.scope.packing:write.description':
    'Packgegenstände und Taschen hinzufügen, aktualisieren, löschen, abhaken und sortieren',
  'oauth.scope.todos:read.label': 'Aufgabenlisten anzeigen',
  'oauth.scope.todos:read.description': 'Reiseaufgaben und Kategoriezuweisungen lesen',
  'oauth.scope.todos:write.label': 'Aufgabenlisten verwalten',
  'oauth.scope.todos:write.description': 'Aufgaben erstellen, aktualisieren, abhaken, löschen und sortieren',
  'oauth.scope.budget:read.label': 'Budget anzeigen',
  'oauth.scope.budget:read.description': 'Budgeteinträge und Ausgabenaufschlüsselung lesen',
  'oauth.scope.budget:write.label': 'Budget verwalten',
  'oauth.scope.budget:write.description': 'Budgeteinträge erstellen, aktualisieren und löschen',
  'oauth.scope.reservations:read.label': 'Buchungen anzeigen',
  'oauth.scope.reservations:read.description': 'Buchungen und Unterkunftsdetails lesen',
  'oauth.scope.reservations:write.label': 'Buchungen verwalten',
  'oauth.scope.reservations:write.description': 'Buchungen erstellen, aktualisieren, löschen und sortieren',
  'oauth.scope.collab:read.label': 'Zusammenarbeit anzeigen',
  'oauth.scope.collab:read.description': 'Kollaborationsnotizen, Umfragen und Nachrichten lesen',
  'oauth.scope.collab:write.label': 'Zusammenarbeit verwalten',
  'oauth.scope.collab:write.description':
    'Kollaborationsnotizen, Umfragen und Nachrichten erstellen, aktualisieren und löschen',
  'oauth.scope.notifications:read.label': 'Benachrichtigungen anzeigen',
  'oauth.scope.notifications:read.description': 'In-App-Benachrichtigungen und ungelesene Zählungen lesen',
  'oauth.scope.notifications:write.label': 'Benachrichtigungen verwalten',
  'oauth.scope.notifications:write.description': 'Benachrichtigungen als gelesen markieren und darauf reagieren',
  'oauth.scope.vacay:read.label': 'Urlaubspläne anzeigen',
  'oauth.scope.vacay:read.description': 'Urlaubsplanungsdaten, Einträge und Statistiken lesen',
  'oauth.scope.vacay:write.label': 'Urlaubspläne verwalten',
  'oauth.scope.vacay:write.description': 'Urlaubseinträge, Feiertage und Teampläne erstellen und verwalten',
  'oauth.scope.geo:read.label': 'Karten & Geocodierung',
  'oauth.scope.geo:read.description': 'Orte suchen, Karten-URLs auflösen und Koordinaten rückwärts geokodieren',
  'oauth.scope.weather:read.label': 'Wettervorhersagen',
  'oauth.scope.weather:read.description': 'Wettervorhersagen für Reiseorte und -daten abrufen',
  'oauth.scope.journey:read.label': 'Journeys ansehen',
  'oauth.scope.journey:read.description': 'Journeys, Einträge und Mitarbeiterliste lesen',
  'oauth.scope.journey:write.label': 'Journeys verwalten',
  'oauth.scope.journey:write.description': 'Journeys und deren Einträge erstellen, bearbeiten und löschen',
  'oauth.scope.journey:share.label': 'Journey-Links verwalten',
  'oauth.scope.journey:share.description':
    'Öffentliche Freigabelinks für Journeys erstellen, aktualisieren und widerrufen',
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
