import type { TranslationStrings } from '../types';

const dawarich: TranslationStrings = {
  // ── Connection ─────────────────────────────────────────────────────────────
  'dawarich.title': 'Dawarich',
  'dawarich.intro':
    'Kapcsold össze a saját Dawarich-példányodat, és lásd, merre jártál valójában. A TREK kiolvassa, és naplóbejegyzéseket, helyeket és országokat javasol — semmi nem kerül be, amíg meg nem erősíted, és a Dawarichba semmit nem ír vissza.',
  'dawarich.url': 'A példány címe',
  'dawarich.apiKey': 'API-kulcs',
  'dawarich.apiKeyPlaceholder': 'Illeszd be a Dawarich API-kulcsodat',
  'dawarich.apiKeyHint':
    'A Dawarichban a Fiók → API-kulcs alatt található. Titkosítva tároljuk, és többé nem jelenik meg.',
  'dawarich.allowInsecureTls': 'Saját aláírású tanúsítvány engedélyezése',
  'dawarich.allowInsecureTlsHint':
    'Csak akkor kell, ha a példányod olyan tanúsítványt használ, amelyben a kiszolgálód nem bízik meg.',
  'dawarich.syncEnabled': 'Új tartózkodások automatikus keresése',
  'dawarich.syncEnabledHint': 'Kikapcsolva a TREK csak akkor olvassa a Dawarichot, ha te kéred.',
  'dawarich.test.button': 'Kapcsolat tesztelése',
  'dawarich.test.success': 'Kapcsolódva. {count} tartózkodás az elmúlt 30 napban.',
  'dawarich.test.failed': 'Nem sikerült elérni a Dawarichot.',
  'dawarich.syncNow': 'Keresés most',
  'dawarich.connected': 'Kapcsolódva',
  'dawarich.notConnected': 'Nincs kapcsolódva',
  'dawarich.disconnect': 'Leválasztás',
  'dawarich.lastSync': 'Utoljára ellenőrizve: {when}',
  'dawarich.neverSynced': 'Még nem volt ellenőrzés',
  'dawarich.syncPartial': 'néhány utat nem sikerült kiolvasni',
  'dawarich.serverVersion': 'Dawarich {version}',

  'dawarich.toast.saved': 'Dawarich-kapcsolat mentve',
  'dawarich.toast.saveError': 'Nem sikerült menteni a kapcsolatot',
  'dawarich.toast.disconnected': 'Dawarich leválasztva',
  'dawarich.toast.synced': '{count} új tartózkodás',
  'dawarich.toast.syncError': 'Nem sikerült kiolvasni a Dawarichot',
  'dawarich.toast.syncRunning': 'Már fut egy ellenőrzés',
  'dawarich.toast.acceptError': 'Nem sikerült hozzáadni',
  'dawarich.toast.updateError': 'Nem sikerült frissíteni ezt a javaslatot',
  'dawarich.toast.accepted.place': 'Hozzáadva az úthoz',
  'dawarich.toast.accepted.journal': 'Hozzáadva a naplóhoz',
  'dawarich.toast.accepted.bucket_list': 'Kipipálva a kívánságlistádon',

  // ── What the connected instance can do ─────────────────────────────────────
  'dawarich.capability.visits': 'tartózkodások',
  'dawarich.capability.track': 'rögzített útvonal',
  'dawarich.capability.locations': 'kívánságlista-egyeztetés',
  'dawarich.capability.visitedCities': 'országok és városok',
  'dawarich.capability.missing': 'Ez a Dawarich-verzió nem kínálja a következőket: {features}.',

  // ── Failure reasons, as sentences the reader can act on ────────────────────
  'dawarich.error.unreachable': 'A TREK nem érte el ezt a címet.',
  'dawarich.error.unauthorized': 'A Dawarich elutasította az API-kulcsot.',
  'dawarich.error.forbidden': 'Ez az API-kulcs nem olvashatja ezt.',
  'dawarich.error.not_found': 'Ebben a Dawarich-verzióban nincs ilyen végpont.',
  'dawarich.error.rate_limited': 'A Dawarich lassítást kért a TREK-től. Próbáld újra hamarosan.',
  'dawarich.error.server_error': 'A Dawarich hibával válaszolt.',
  'dawarich.error.invalid_response': 'Ez a cím olyasmivel válaszolt, ami nem Dawarich.',
  'dawarich.error.too_large': 'A Dawarich több adatot küldött, mint amennyit a TREK egyszerre beolvas.',
  'dawarich.error.not_connected': 'Még nincs csatlakoztatott Dawarich-példány.',
  'dawarich.error.addon_disabled': 'A Dawarich bővítmény ki van kapcsolva ezen a példányon.',
  'dawarich.error.offline': 'Ehhez kapcsolat kell — a TREK most offline.',
  'dawarich.error.invalid_url': 'A TREK nem tudja használni ezt a címet.',
  'dawarich.warning.private_ip': 'Ez a cím privát IP-re mutat ({ip}). Ellenőrizd, hogy így akartad-e — a szervernek ehhez ALLOW_INTERNAL_NETWORK=true kellhet.',
  'dawarich.error.unknown': 'Hiba történt a Dawarichhal folytatott kommunikáció közben.',

  // ── The recorded route on the map ──────────────────────────────────────────
  'dawarich.trail.show': 'Rögzített útvonal megjelenítése',
  'dawarich.trail.hide': 'Rögzített útvonal elrejtése',
  'dawarich.trail.loading': 'Rögzített útvonal betöltése…',
  'dawarich.trail.empty': 'Ezeken a napokon nem készült rögzítés',
  'dawarich.trail.offline': 'A rögzített útvonalhoz kapcsolat kell',
  'dawarich.trail.unavailable': 'A rögzített útvonalat nem sikerült betölteni',

  // ── Suggestions ────────────────────────────────────────────────────────────
  'dawarich.duration.minutes': '{minutes} perc',
  'dawarich.duration.hours': '{hours} ó',
  'dawarich.duration.hoursMinutes': '{hours} ó {minutes} perc',
  'dawarich.checkedAgo': 'ellenőrizve {ago}',

  'dawarich.badge.lowConfidence': 'Bizonytalan',
  'dawarich.badge.sourceChanged': 'Megváltozott a Dawarichban',
  'dawarich.badge.sourceMissing': 'Eltűnt a Dawarichból',

  'dawarich.suggestions.title': 'A Dawarichból',
  'dawarich.suggestions.pending': '{count} vár rád',
  'dawarich.suggestions.loading': 'A Dawarich olvasása…',
  'dawarich.suggestions.notConnected':
    'Kapcsold össze a Dawarichot a Beállításokban, hogy itt lásd a tartózkodásaidat.',
  'dawarich.suggestions.unavailable': 'A Dawarichot nem sikerült kiolvasni.',
  'dawarich.suggestions.allHandled': 'Minden itt rögzített dologgal foglalkoztál már.',
  'dawarich.suggestions.asJournal': 'Naplóbejegyzés írása',
  'dawarich.suggestions.asPlace': 'Hozzáadás helyszínként',
  'dawarich.suggestions.dismiss': 'Itt nem jártam',
  'dawarich.suggestions.dismissed': 'Elvetve',
  'dawarich.suggestions.restore': 'Visszatétel',
  'dawarich.suggestions.showHandled': '{count} elintézett megjelenítése',
  'dawarich.suggestions.hideHandled': 'A már elintézettek elrejtése',
  'dawarich.suggestions.matchesWish': 'A kívánságlistádon: {name}',
  'dawarich.suggestions.acceptedAs.place': 'Hozzáadva helyszínként',
  'dawarich.suggestions.acceptedAs.journal': 'A naplóban',
  'dawarich.suggestions.acceptedAs.bucket_list': 'Kívánság kipipálva',
  'dawarich.suggestions.sourceChanged':
    'Ez a tartózkodás megváltozott a Dawarichban, amióta felhasználtad. Amit a TREK-ben írtál, érintetlen maradt.',
  'dawarich.suggestions.sourceMissing':
    'Ez a tartózkodás már nem létezik a Dawarichban. Amit a TREK-ben írtál, érintetlen maradt.',
  'dawarich.sourceStatus.suggested': 'Felismerve, megerősítetlen',
  'dawarich.confidence.high': 'Biztos felismerés',
  'dawarich.confidence.medium': 'Meglehetősen biztos felismerés',
  'dawarich.confidence.low': 'Bizonytalan felismerés',

  // ── The review step ────────────────────────────────────────────────────────
  'dawarich.accept.title.place': 'Tartózkodás hozzáadása helyszínként',
  'dawarich.accept.title.journal': 'Naplóbejegyzés írása',
  'dawarich.accept.title.bucket_list': 'Kívánság kipipálása',
  'dawarich.accept.confirm.place': 'Helyszín hozzáadása',
  'dawarich.accept.confirm.journal': 'Bejegyzés hozzáadása',
  'dawarich.accept.confirm.bucket_list': 'Pipáld ki',
  'dawarich.accept.recorded': 'Rögzítve {from} és {to} között',
  'dawarich.accept.duration': '{minutes} perc',
  'dawarich.accept.name': 'Név',
  'dawarich.accept.date': 'Dátum',
  'dawarich.accept.from': 'Érkezés',
  'dawarich.accept.to': 'Távozás',
  'dawarich.accept.trip': 'Utazás',
  'dawarich.accept.thisTrip': 'Ez az utazás',
  'dawarich.accept.pickTrip': 'Válassz utazást',
  'dawarich.accept.day': 'Nap',
  'dawarich.accept.noDay': 'Még nincs naphoz rendelve',
  'dawarich.accept.journal': 'Napló',
  'dawarich.accept.pickJournal': 'Válassz naplót',
  'dawarich.accept.notes': 'Jegyzetek',
  'dawarich.accept.story': 'A történeted',
  'dawarich.accept.storyPlaceholder': 'Mi történt itt?',
  'dawarich.accept.photosHint': 'A fotókat a bejegyzés létrehozása után add hozzá.',

  // ── A place that came out of a recording ──────────────────────────────────
  'dawarich.place.fromDawarich': 'A Dawarich-felvételeidből hozzáadva',

  // ── Wishlist ───────────────────────────────────────────────────────────────
  'dawarich.bucket.title': 'Kívánságlista összevetése a Dawarichcsal',
  'dawarich.bucket.description':
    'Átnézi a rögzítéseidet azokat a helyeket keresve, amelyeket el akartál érni. Egy látogatáshoz közelség és eltöltött idő is kell — az elhajtás nem számít.',
  'dawarich.bucket.scan': 'Kívánságlista ellenőrzése',
  'dawarich.bucket.scanning': 'Ellenőrzés…',
  'dawarich.bucket.noMatches': 'A kívánságlistádról semmi nem bukkant fel a rögzítéseidben.',
  'dawarich.bucket.alreadyVisited': 'Már kipipálva',
  'dawarich.bucket.confirm': '{count} kipipálása',
  'dawarich.bucket.confirmed': '{count} kívánság kipipálva',
  'dawarich.bucket.skipped': '{count} bejegyzésnek nincs koordinátája, ezért nem volt ellenőrizhető.',
  'dawarich.bucket.truncated': 'Csak az első bejegyzések lettek ellenőrizve. Futtasd le újra a többihez.',
  'dawarich.bucket.visitedFrom': 'A Dawarich-rögzítéseid alapján kipipálva',
  'dawarich.bucket.clearVisit': 'Visszavonás',

  // ── Atlas ──────────────────────────────────────────────────────────────────
  'dawarich.atlas.title': 'Országok a Dawarichból',
  'dawarich.atlas.description':
    'Azok az országok, amelyekben a rögzítéseid szerint jártál. Erősítsd meg, melyek kerüljenek az Atlaszodba — magától semmi nem kerül be, és amit kézzel jelöltél, a tiéd marad.',
  'dawarich.atlas.load': 'Országok keresése',
  'dawarich.atlas.loading': 'A rögzítéseid olvasása…',
  'dawarich.atlas.empty': 'A rögzítéseid nem mutatnak olyan országot, amelyet a TREK ne ismerne már.',
  'dawarich.atlas.cities': '{count} város',
  'dawarich.atlas.citiesOne': '1 város',
  'dawarich.atlas.accept': '{count} ország hozzáadása',
  'dawarich.atlas.accepted': '{count} ország hozzáadva',
  'dawarich.atlas.unresolved': 'A TREK ezeket nem tudta országhoz párosítani: {names}.',
  'dawarich.atlas.source': 'A Dawarichból',
  'dawarich.atlas.range': 'Vizsgált időszak: {from} – {to}',

  'dawarich.atlas.trigger': 'Kívánságok és országok a felvételeidből',
  'dawarich.atlas.dialogSubtitle': 'Mit mondanak a felvételeid az Atlaszodról',
  'dawarich.atlas.tab.wishes': 'Kívánságlista',
  'dawarich.atlas.tab.countries': 'Országok',
  'dawarich.atlas.window': 'Az elmúlt 12 hónapot néztük át.',
  'dawarich.selected': '{count} kiválasztva',
  'dawarich.again': 'Ellenőrzés újra',
  'dawarich.bucket.metersAway': '{meters} m-re',
  'dawarich.bucket.kilometersAway': '{km} km-re',
  'dawarich.bucket.rule': 'Egy kívánság {meters} méteren belül és {minutes} perc helyszíni idő után számít teljesítettnek.',

  'dawarich.journey.dayStays.one': '1 tartózkodás a Dawarichból',
  'dawarich.journey.dayStays.other': '{count} tartózkodás a Dawarichból',
};

export default dawarich;
