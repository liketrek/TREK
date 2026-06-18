import type { TranslationStrings } from '../types';

const oauth: TranslationStrings = {
  'oauth.scope.group.trips': 'Reizen',
  'oauth.scope.group.places': 'Plaatsen',
  'oauth.scope.group.atlas': 'Atlas',
  'oauth.scope.group.packing': 'Paklijst',
  'oauth.scope.group.todos': 'Taken',
  'oauth.scope.group.budget': 'Budget',
  'oauth.scope.group.reservations': 'Reserveringen',
  'oauth.scope.group.collab': 'Samenwerking',
  'oauth.scope.group.notifications': 'Meldingen',
  'oauth.scope.group.vacay': 'Vakantie',
  'oauth.scope.group.geo': 'Geo',
  'oauth.scope.group.weather': 'Weer',
  'oauth.scope.group.journey': 'Reisverslag',
  'oauth.scope.trips:read.label': 'Reizen en reisplannen bekijken',
  'oauth.scope.trips:read.description': 'Reizen, dagen, notities en leden lezen',
  'oauth.scope.trips:write.label': 'Reizen en reisplannen bewerken',
  'oauth.scope.trips:write.description': 'Reizen, dagen en notities aanmaken, bijwerken en leden beheren',
  'oauth.scope.trips:delete.label': 'Reizen verwijderen',
  'oauth.scope.trips:delete.description': 'Hele reizen permanent verwijderen — deze actie is onomkeerbaar',
  'oauth.scope.trips:share.label': 'Deellinks beheren',
  'oauth.scope.trips:share.description': 'Publieke deellinks aanmaken, bijwerken en intrekken',
  'oauth.scope.places:read.label': 'Plaatsen en kaartgegevens bekijken',
  'oauth.scope.places:read.description': 'Plaatsen, dagtoewijzingen, tags en categorieën lezen',
  'oauth.scope.places:write.label': 'Plaatsen beheren',
  'oauth.scope.places:write.description': 'Plaatsen, toewijzingen en tags aanmaken, bijwerken en verwijderen',
  'oauth.scope.atlas:read.label': 'Atlas bekijken',
  'oauth.scope.atlas:read.description': "Bezochte landen, regio's en bucketlist lezen",
  'oauth.scope.atlas:write.label': 'Atlas beheren',
  'oauth.scope.atlas:write.description': "Landen en regio's markeren als bezocht, bucketlist beheren",
  'oauth.scope.packing:read.label': 'Paklijsten bekijken',
  'oauth.scope.packing:read.description': 'Pakartikelen, tassen en categorietoewijzingen lezen',
  'oauth.scope.packing:write.label': 'Paklijsten beheren',
  'oauth.scope.packing:write.description':
    'Pakartikelen en tassen toevoegen, bijwerken, verwijderen, omschakelen en herordenen',
  'oauth.scope.todos:read.label': 'Takenlijsten bekijken',
  'oauth.scope.todos:read.description': 'Reistaakitems en categorietoewijzingen lezen',
  'oauth.scope.todos:write.label': 'Takenlijsten beheren',
  'oauth.scope.todos:write.description': 'Taakitems aanmaken, bijwerken, omschakelen, verwijderen en herordenen',
  'oauth.scope.budget:read.label': 'Budget bekijken',
  'oauth.scope.budget:read.description': 'Budgetitems en kostenspecificatie lezen',
  'oauth.scope.budget:write.label': 'Budget beheren',
  'oauth.scope.budget:write.description': 'Budgetitems aanmaken, bijwerken en verwijderen',
  'oauth.scope.reservations:read.label': 'Reserveringen bekijken',
  'oauth.scope.reservations:read.description': 'Reserveringen en accommodatiedetails lezen',
  'oauth.scope.reservations:write.label': 'Reserveringen beheren',
  'oauth.scope.reservations:write.description': 'Reserveringen aanmaken, bijwerken, verwijderen en herordenen',
  'oauth.scope.collab:read.label': 'Samenwerking bekijken',
  'oauth.scope.collab:read.description': 'Samenwerkingsnotities, polls en berichten lezen',
  'oauth.scope.collab:write.label': 'Samenwerking beheren',
  'oauth.scope.collab:write.description':
    'Samenwerkingsnotities, polls en berichten aanmaken, bijwerken en verwijderen',
  'oauth.scope.notifications:read.label': 'Meldingen bekijken',
  'oauth.scope.notifications:read.description': 'In-app meldingen en ongelezen aantallen lezen',
  'oauth.scope.notifications:write.label': 'Meldingen beheren',
  'oauth.scope.notifications:write.description': 'Meldingen als gelezen markeren en erop reageren',
  'oauth.scope.vacay:read.label': 'Vakantieplannen bekijken',
  'oauth.scope.vacay:read.description': 'Vakantieplanningsgegevens, invoeren en statistieken lezen',
  'oauth.scope.vacay:write.label': 'Vakantieplannen beheren',
  'oauth.scope.vacay:write.description': 'Vakantie-invoeren, feestdagen en teamplannen aanmaken en beheren',
  'oauth.scope.geo:read.label': 'Kaarten & geocodering',
  'oauth.scope.geo:read.description': "Locaties zoeken, kaart-URL's oplossen en coördinaten omgekeerd geocoderen",
  'oauth.scope.weather:read.label': 'Weersverwachtingen',
  'oauth.scope.weather:read.description': 'Weersverwachtingen ophalen voor reislocaties en -datums',
  'oauth.scope.journey:read.label': 'Reisverslagen bekijken',
  'oauth.scope.journey:read.description': 'Reisverslagen, vermeldingen en lijst van bijdragers lezen',
  'oauth.scope.journey:write.label': 'Reisverslagen beheren',
  'oauth.scope.journey:write.description': 'Reisverslagen en hun vermeldingen aanmaken, bijwerken en verwijderen',
  'oauth.scope.journey:share.label': 'Reisverslag-links beheren',
  'oauth.scope.journey:share.description': 'Publieke deellinks voor reisverslagen aanmaken, bijwerken en intrekken',
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
