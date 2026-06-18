import type { TranslationStrings } from '../types';

const oauth: TranslationStrings = {
  'oauth.scope.group.trips': 'Podróże',
  'oauth.scope.group.places': 'Miejsca',
  'oauth.scope.group.atlas': 'Atlas',
  'oauth.scope.group.packing': 'Pakowanie',
  'oauth.scope.group.todos': 'Zadania',
  'oauth.scope.group.budget': 'Budżet',
  'oauth.scope.group.reservations': 'Rezerwacje',
  'oauth.scope.group.collab': 'Współpraca',
  'oauth.scope.group.notifications': 'Powiadomienia',
  'oauth.scope.group.vacay': 'Urlop',
  'oauth.scope.group.geo': 'Geo',
  'oauth.scope.group.weather': 'Pogoda',
  'oauth.scope.group.journey': 'Dziennik podróży',
  'oauth.scope.trips:read.label': 'Przeglądaj podróże i itineraria',
  'oauth.scope.trips:read.description': 'Odczytuj podróże, dni, notatki i członków',
  'oauth.scope.trips:write.label': 'Edytuj podróże i itineraria',
  'oauth.scope.trips:write.description': 'Twórz i aktualizuj podróże, dni, notatki oraz zarządzaj członkami',
  'oauth.scope.trips:delete.label': 'Usuń podróże',
  'oauth.scope.trips:delete.description': 'Trwale usuń całe podróże — ta akcja jest nieodwracalna',
  'oauth.scope.trips:share.label': 'Zarządzaj linkami udostępniania',
  'oauth.scope.trips:share.description': 'Twórz, aktualizuj i unieważniaj publiczne linki udostępniania',
  'oauth.scope.places:read.label': 'Przeglądaj miejsca i dane mapy',
  'oauth.scope.places:read.description': 'Odczytuj miejsca, przypisania dni, tagi i kategorie',
  'oauth.scope.places:write.label': 'Zarządzaj miejscami',
  'oauth.scope.places:write.description': 'Twórz, aktualizuj i usuń miejsca, przypisania i tagi',
  'oauth.scope.atlas:read.label': 'Przeglądaj Atlas',
  'oauth.scope.atlas:read.description': 'Odczytuj odwiedzone kraje, regiony i listę marzeń',
  'oauth.scope.atlas:write.label': 'Zarządzaj Atlasem',
  'oauth.scope.atlas:write.description': 'Oznaczaj kraje i regiony jako odwiedzone, zarządzaj listą marzeń',
  'oauth.scope.packing:read.label': 'Przeglądaj listy pakowania',
  'oauth.scope.packing:read.description': 'Odczytuj przedmioty, torby i przypisania kategorii',
  'oauth.scope.packing:write.label': 'Zarządzaj listami pakowania',
  'oauth.scope.packing:write.description': 'Dodawaj, aktualizuj, usuwaj, zaznaczaj i porządkuj przedmioty i torby',
  'oauth.scope.todos:read.label': 'Przeglądaj listy zadań',
  'oauth.scope.todos:read.description': 'Odczytuj zadania podróży i przypisania kategorii',
  'oauth.scope.todos:write.label': 'Zarządzaj listami zadań',
  'oauth.scope.todos:write.description': 'Twórz, aktualizuj, zaznaczaj, usuwaj i porządkuj zadania',
  'oauth.scope.budget:read.label': 'Przeglądaj budżet',
  'oauth.scope.budget:read.description': 'Odczytuj pozycje budżetu i zestawienie wydatków',
  'oauth.scope.budget:write.label': 'Zarządzaj budżetem',
  'oauth.scope.budget:write.description': 'Twórz, aktualizuj i usuń pozycje budżetu',
  'oauth.scope.reservations:read.label': 'Przeglądaj rezerwacje',
  'oauth.scope.reservations:read.description': 'Odczytuj rezerwacje i szczegóły zakwaterowania',
  'oauth.scope.reservations:write.label': 'Zarządzaj rezerwacjami',
  'oauth.scope.reservations:write.description': 'Twórz, aktualizuj, usuwaj i porządkuj rezerwacje',
  'oauth.scope.collab:read.label': 'Przeglądaj współpracę',
  'oauth.scope.collab:read.description': 'Odczytuj notatki, ankiety i wiadomości',
  'oauth.scope.collab:write.label': 'Zarządzaj współpracą',
  'oauth.scope.collab:write.description': 'Twórz, aktualizuj i usuń notatki, ankiety i wiadomości',
  'oauth.scope.notifications:read.label': 'Przeglądaj powiadomienia',
  'oauth.scope.notifications:read.description': 'Odczytuj powiadomienia i liczby nieprzeczytanych',
  'oauth.scope.notifications:write.label': 'Zarządzaj powiadomieniami',
  'oauth.scope.notifications:write.description': 'Oznaczaj powiadomienia jako przeczytane i odpowiadaj na nie',
  'oauth.scope.vacay:read.label': 'Przeglądaj plany urlopowe',
  'oauth.scope.vacay:read.description': 'Odczytuj dane planowania urlopu, wpisy i statystyki',
  'oauth.scope.vacay:write.label': 'Zarządzaj planami urlopowymi',
  'oauth.scope.vacay:write.description': 'Twórz i zarządzaj wpisami urlopowymi, świętami i planami zespołu',
  'oauth.scope.geo:read.label': 'Mapy i geokodowanie',
  'oauth.scope.geo:read.description': 'Wyszukuj miejsca, rozwiązuj adresy URL map i odwrotnie geokoduj współrzędne',
  'oauth.scope.weather:read.label': 'Prognozy pogody',
  'oauth.scope.weather:read.description': 'Pobieraj prognozy pogody dla miejsc i dat podróży',
  'oauth.scope.journey:read.label': 'Przeglądaj dzienniki podróży',
  'oauth.scope.journey:read.description': 'Odczytuj dzienniki podróży, wpisy i listę współautorów',
  'oauth.scope.journey:write.label': 'Zarządzaj dziennikami podróży',
  'oauth.scope.journey:write.description': 'Twórz, aktualizuj i usuwaj dzienniki podróży oraz ich wpisy',
  'oauth.scope.journey:share.label': 'Zarządzaj linkami dzienników podróży',
  'oauth.scope.journey:share.description':
    'Twórz, aktualizuj i unieważniaj publiczne linki udostępniania dzienników podróży',
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
