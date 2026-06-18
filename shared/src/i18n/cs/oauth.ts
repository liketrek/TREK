import type { TranslationStrings } from '../types';

const oauth: TranslationStrings = {
  'oauth.scope.group.trips': 'Výlety',
  'oauth.scope.group.places': 'Místa',
  'oauth.scope.group.atlas': 'Atlas',
  'oauth.scope.group.packing': 'Balení',
  'oauth.scope.group.todos': 'Úkoly',
  'oauth.scope.group.budget': 'Rozpočet',
  'oauth.scope.group.reservations': 'Rezervace',
  'oauth.scope.group.collab': 'Spolupráce',
  'oauth.scope.group.notifications': 'Oznámení',
  'oauth.scope.group.vacay': 'Dovolená',
  'oauth.scope.group.geo': 'Geo',
  'oauth.scope.group.weather': 'Počasí',
  'oauth.scope.group.journey': 'Cestovní deník',
  'oauth.scope.trips:read.label': 'Zobrazit výlety a itineráře',
  'oauth.scope.trips:read.description': 'Číst výlety, dny, poznámky a členy',
  'oauth.scope.trips:write.label': 'Upravit výlety a itineráře',
  'oauth.scope.trips:write.description': 'Vytvářet a aktualizovat výlety, dny, poznámky a spravovat členy',
  'oauth.scope.trips:delete.label': 'Mazat výlety',
  'oauth.scope.trips:delete.description': 'Trvale smazat celé výlety — tato akce je nevratná',
  'oauth.scope.trips:share.label': 'Spravovat sdílené odkazy',
  'oauth.scope.trips:share.description': 'Vytvářet, aktualizovat a rušit veřejné sdílené odkazy',
  'oauth.scope.places:read.label': 'Zobrazit místa a mapová data',
  'oauth.scope.places:read.description': 'Číst místa, denní přiřazení, štítky a kategorie',
  'oauth.scope.places:write.label': 'Spravovat místa',
  'oauth.scope.places:write.description': 'Vytvářet, aktualizovat a mazat místa, přiřazení a štítky',
  'oauth.scope.atlas:read.label': 'Zobrazit Atlas',
  'oauth.scope.atlas:read.description': 'Číst navštívené země, regiony a seznam přání',
  'oauth.scope.atlas:write.label': 'Spravovat Atlas',
  'oauth.scope.atlas:write.description': 'Označovat navštívené země a regiony, spravovat seznam přání',
  'oauth.scope.packing:read.label': 'Zobrazit seznamy balení',
  'oauth.scope.packing:read.description': 'Číst položky, tašky a přiřazení kategorií',
  'oauth.scope.packing:write.label': 'Spravovat seznamy balení',
  'oauth.scope.packing:write.description': 'Přidávat, aktualizovat, mazat, označovat a řadit položky a tašky',
  'oauth.scope.todos:read.label': 'Zobrazit seznamy úkolů',
  'oauth.scope.todos:read.description': 'Číst úkoly výletu a přiřazení kategorií',
  'oauth.scope.todos:write.label': 'Spravovat seznamy úkolů',
  'oauth.scope.todos:write.description': 'Vytvářet, aktualizovat, označovat, mazat a řadit úkoly',
  'oauth.scope.budget:read.label': 'Zobrazit rozpočet',
  'oauth.scope.budget:read.description': 'Číst položky rozpočtu a přehled výdajů',
  'oauth.scope.budget:write.label': 'Spravovat rozpočet',
  'oauth.scope.budget:write.description': 'Vytvářet, aktualizovat a mazat položky rozpočtu',
  'oauth.scope.reservations:read.label': 'Zobrazit rezervace',
  'oauth.scope.reservations:read.description': 'Číst rezervace a podrobnosti ubytování',
  'oauth.scope.reservations:write.label': 'Spravovat rezervace',
  'oauth.scope.reservations:write.description': 'Vytvářet, aktualizovat, mazat a řadit rezervace',
  'oauth.scope.collab:read.label': 'Zobrazit spolupráci',
  'oauth.scope.collab:read.description': 'Číst poznámky, ankety a zprávy spolupráce',
  'oauth.scope.collab:write.label': 'Spravovat spolupráci',
  'oauth.scope.collab:write.description': 'Vytvářet, aktualizovat a mazat poznámky, ankety a zprávy',
  'oauth.scope.notifications:read.label': 'Zobrazit oznámení',
  'oauth.scope.notifications:read.description': 'Číst oznámení v aplikaci a počty nepřečtených',
  'oauth.scope.notifications:write.label': 'Spravovat oznámení',
  'oauth.scope.notifications:write.description': 'Označovat oznámení jako přečtená a reagovat na ně',
  'oauth.scope.vacay:read.label': 'Zobrazit plány dovolené',
  'oauth.scope.vacay:read.description': 'Číst data plánování dovolené, záznamy a statistiky',
  'oauth.scope.vacay:write.label': 'Spravovat plány dovolené',
  'oauth.scope.vacay:write.description': 'Vytvářet a spravovat záznamy dovolené, svátky a týmové plány',
  'oauth.scope.geo:read.label': 'Mapy a geokódování',
  'oauth.scope.geo:read.description': 'Vyhledávat místa, řešit URL map a zpětně geokódovat souřadnice',
  'oauth.scope.weather:read.label': 'Předpovědi počasí',
  'oauth.scope.weather:read.description': 'Získávat předpovědi počasí pro místa a data výletu',
  'oauth.scope.journey:read.label': 'Zobrazit cestovní deníky',
  'oauth.scope.journey:read.description': 'Číst cestovní deníky, záznamy a seznam přispěvatelů',
  'oauth.scope.journey:write.label': 'Spravovat cestovní deníky',
  'oauth.scope.journey:write.description': 'Vytvářet, aktualizovat a mazat cestovní deníky a jejich záznamy',
  'oauth.scope.journey:share.label': 'Spravovat odkazy na cestovní deníky',
  'oauth.scope.journey:share.description': 'Vytvářet, aktualizovat a rušit veřejné sdílené odkazy na cestovní deníky',
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
