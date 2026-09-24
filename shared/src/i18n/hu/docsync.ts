import type { TranslationStrings } from '../types';

const docsync: TranslationStrings = {
  'docsync.title': 'Dokumentumok szinkronizálása',
  'docsync.noProviders': 'Nincs elérhető dokumentumszolgáltató',
  'docsync.noProvidersHint': 'A példány rendszergazdája kapcsolja be ezeket az Admin, Bővítmények, Dokumentumok alatt.',
  'docsync.addProvider': 'Szolgáltató csatlakoztatása',
  'docsync.test': 'Kapcsolat tesztelése',
  'docsync.connect.optional': 'Nem kötelező',
  'docsync.connected': 'Kapcsolódva',
  'docsync.chooseFolder': 'Mappa kiválasztása',
  'docsync.noFolders': 'Ezen a példányon még nem található semmi.',
  'docsync.newFolderPlaceholder': 'Az új mappa neve',
  'docsync.syncNow': 'Szinkronizálás most',
  'docsync.unlink': 'Leválasztás',
  'docsync.confirmUnlink':
    'A dokumentumok a TREK-ben és a tárolóban is megmaradnak. Csak a köztük lévő párosítás szűnik meg.',
  'docsync.syncEnabled': 'Automatikus szinkronizálás',
  'docsync.deletePolicy': 'Ha egy dokumentumot törölnek',
  'docsync.deleteUnlink': 'Mindkét példány megtartása',
  'docsync.deleteTrash': 'Áthelyezés a kukába',
  'docsync.conflictPolicy': 'Ha mindkét oldal változott',
  'docsync.onConflict.manual': 'Kérdezzen rá',
  'docsync.onConflict.trek_wins': 'A TREK-példány megtartása',
  'docsync.onConflict.provider_wins': 'A tároló példányának megtartása',
  'docsync.webhookHint':
    'Illeszd be ezt az URL-t a szolgáltatódnál, hogy a változások azonnal megérkezzenek. Enélkül a TREK időzítve ellenőriz.',

  // A kapcsolati űrlap mezői. A kulcsok a document_provider_fields tábla `label`
  // oszlopát tükrözik, amely szöveg helyett kulcsvégződést tárol.
  'docsync.providerUrl': 'Cím',
  'docsync.providerApiToken': 'API-token',
  'docsync.providerApiKey': 'API-kulcs',
  'docsync.providerAppPassword': 'Alkalmazásjelszó',
  'docsync.providerAppToken': 'Alkalmazástoken',
  'docsync.providerUsername': 'Felhasználónév',
  'docsync.providerPassword': 'Jelszó',
  'docsync.providerOrganization': 'Szervezet azonosítója',
  'docsync.providerBasePath': 'Alapmappa',
  'docsync.providerOTP': 'Kétlépcsős kód',
  'docsync.allowInsecureTls': 'Saját aláírású tanúsítvány elfogadása',

  'docsync.hintPaperlessToken':
    'A Paperlessben a Saját profil alatt hozhatsz létre egyet. Az adott fiók teljes jogosultságát viszi magával.',
  'docsync.hintPapraKey':
    'A Paprában az API-kulcsok alatt hozhatsz létre egyet. A Papra kulcsaival mindig eléred minden szervezetedet.',
  'docsync.hintPapraOrg': 'Az org_… azonosító a Papra címsorából.',
  'docsync.hintNextcloudLogin': 'A Nextcloud bejelentkezési neved, nem az e-mail-címed.',
  'docsync.hintNextcloudAppPassword':
    'Beállítások, Biztonság, Új alkalmazásjelszó létrehozása. Soha ne a fiókod jelszava.',
  'docsync.hintOpenCloudToken': 'Az OpenCloudban az alkalmazástokenek alatt jön létre.',
  'docsync.hintBasePath': 'Itt keresi a TREK az utak mappáit. Alapértelmezés szerint /TREK.',
  'docsync.hintSynologyUrl': 'Add meg a portot is, például https://nas.example.com:5001',
  'docsync.hintSynologyUser': 'Legjobb egy külön DSM-fiók, amely csak ehhez a megosztott mappához fér hozzá.',
  'docsync.hintSynologyOtp': 'Csak egyszer kell, ha a fiók kétlépcsős azonosítást használ.',

  'docsync.linkState.never': 'Még nincs szinkronizálva',
  'docsync.linkState.ok': 'Naprakész',
  'docsync.linkState.partial': 'Részben szinkronizálva',
  'docsync.linkState.failed': 'Sikertelen',
  'docsync.linkState.needs_reauth': 'Jelentkezz be újra',
  'docsync.linkState.scope_lost': 'A mappa eltűnt',
  'docsync.linkState.orphaned': 'A tulajdonos elhagyta az utat',

  'docsync.state.pending': 'Várakozik',
  'docsync.state.synced': 'Szinkronizálva',
  'docsync.state.conflict': 'Ütközés',
  'docsync.state.rejected_type': 'Nem engedélyezett típus',
  'docsync.state.too_large': 'Túl nagy',
  'docsync.state.error': 'Hiba',
  'docsync.state.remote_missing': 'Hiányzik a szolgáltatónál',
  'docsync.state.local_deleted': 'Törölve a TREK-ben',
  'docsync.state.scope_drift': 'Kikerült a mappából',

  'docsync.conflict.resolve': "{count} megoldása",

  'docsync.conflict.title': 'Mindkét példány megváltozott',
  'docsync.conflict.keepTrek': 'A TREK-verzió megtartása',
  'docsync.conflict.keepProvider': 'A szolgáltató verziójának megtartása',
  'docsync.conflict.keepBoth': 'Mindkettő megtartása',

  // A hiba okai kódként utaznak, sosem a túloldal szövegeként: a szolgáltató
  // angolul válaszol, vagy egy proxy HTML-es bejelentkező oldalával, és egyiknek
  // sincs itt helye.
  'docsync.error.unreachable': 'A szolgáltató nem érhető el.',
  'docsync.error.tls_untrusted':
    'A tanúsítvány elutasítva. Engedélyezd a saját aláírású tanúsítványokat, ha megbízol ebben a példányban.',
  'docsync.error.unauthorized': 'A hitelesítő adatokat elutasították.',
  'docsync.error.forbidden': 'Ennek a fióknak ehhez nincs jogosultsága.',
  'docsync.error.not_found': 'Nem található a szolgáltatónál.',
  'docsync.error.scope_missing': 'A csatlakoztatott mappa már nem létezik.',
  'docsync.error.rate_limited': 'A szolgáltató korlátozza a kéréseinket. A TREK később újra próbálkozik.',
  'docsync.error.too_large': 'A fájl nagyobb, mint amennyit a szolgáltató elfogad.',
  'docsync.error.unsupported_type': 'A szolgáltató nem fogadja el ezt a fájltípust.',
  'docsync.error.quota_exceeded': 'A szolgáltatónál elfogyott a hely.',
  'docsync.error.conflict': 'A dokumentum mindkét oldalon megváltozott.',
  'docsync.error.checksum_mismatch': 'Az átvitel nem érkezett meg épségben.',
  'docsync.error.provider_error': 'A szolgáltató hibát jelzett.',
  'docsync.error.timeout': 'A szolgáltató túl sokáig válaszolt.',
  'docsync.error.ssrf_blocked': 'Ez a cím nem engedélyezett.',
  'docsync.error.mass_delete_guard':
    'Egyszerre tűnt el a dokumentumok nagy része, ezért semmi nem változott. Ellenőrizd, hogy a mappa még csatolva van-e.',
  'docsync.error.unknown': 'Valami hiba történt.',

  // ── A párbeszédablak ───────────────────────────────────────────────────────
  'docsync.sidebar.connected': 'Ez az út',
  'docsync.addAnother': 'Másik hozzáadása',
  'docsync.syncing': 'Szinkronizálás',
  'docsync.card.pickFolder': 'Kapcsolódva, válassz mappát',

  'docsync.empty.title': 'Még nincs semmi csatlakoztatva',
  'docsync.empty.hintOwner':
    'Válassz egy tárolót a bal oldalon. A TREK mindenről saját másolatot tart, így semmi nem vész el, ha a tároló megszűnik.',
  'docsync.empty.hintMember': 'Ezt az út tulajdonosa állítja be. A dokumentumok így is, úgy is megmaradnak a TREK-ben.',

  // Hogyan rendszerez az egyes termékek. A csatlakozás előtt látszik, mert ez az,
  // amit a következő képernyő kérni fog.
  'docsync.model.paperless': 'Címke szerint rendszerez',
  'docsync.model.papra': 'Címke szerint rendszerez, egy szervezeten belül',
  'docsync.model.nextcloud': 'Mappába rendszerez',
  'docsync.model.opencloud': 'Térbe rendszerez',
  'docsync.model.synologydrive': 'A NAS egyik mappájába rendszerez',

  // ── A folyamatsáv ──────────────────────────────────────────────────────────
  'docsync.flow.trek': 'TREK',
  'docsync.flow.toProvider': 'Ki a tárolóba',
  'docsync.flow.toTrek': 'Be a tárolóból',
  'docsync.flow.documents': 'dokumentum',
  'docsync.flow.summary.both': 'A dokumentumok oda-vissza mozognak.',
  'docsync.flow.summary.pull': 'A dokumentumok csak befelé jönnek.',
  'docsync.flow.summary.push': 'A dokumentumok csak kifelé mennek.',
  'docsync.flow.summaryEditable.both': 'Oda-vissza mozognak. Koppints egy sávra a leállításhoz.',
  'docsync.flow.summaryEditable.pull': 'Csak befelé. Koppints a másik sávra a kiküldéshez is.',
  'docsync.flow.summaryEditable.push': 'Csak kifelé. Koppints a másik sávra a behozatalhoz is.',

  // ── Egy összekapcsolás ─────────────────────────────────────────────────────
  'docsync.binding.settings': 'Beállítások',
  'docsync.binding.folder': 'Mappa',
  'docsync.binding.lastRun': 'Utolsó futás',
  'docsync.binding.autoOff': 'Szüneteltetve',
  'docsync.binding.neverRun': 'még nem futott',
  'docsync.binding.deleteHint': 'Mi történjen a másik oldalon lévő példánnyal.',
  'docsync.binding.conflictHint': 'Melyik példány marad, ha a dokumentumot mindkét helyen szerkesztették.',
  'docsync.binding.autoHint': 'Változások keresése a háttérben.',
  'docsync.binding.webhookTitle': 'Azonnali frissítések',
  'docsync.binding.copy': 'Másolás',
  'docsync.binding.copied': 'Másolva',

  // ── Csatlakozás ────────────────────────────────────────────────────────────
  'docsync.connect.submit': 'Csatlakozás',
  'docsync.connect.testing': 'Próbálom elérni',
  'docsync.connect.okAs': 'Elértem, bejelentkezve mint {account}',
  'docsync.connect.insecureHint': 'Saját hálózaton futó, saját aláírású tanúsítványt használó példányhoz.',
  'docsync.connect.about.paperless':
    'A TREK saját címke alá rendezi ezt az utat, és az archívumod többi részéhez nem nyúl.',
  'docsync.connect.about.papra':
    'Válaszd ki a szervezetet, amelyhez ez az út tartozik. A TREK azon belül saját címke alá rendezi.',
  'docsync.connect.about.nextcloud':
    'Alkalmazásjelszót használj, ne a fiókod jelszavát: átmegy a kétlépcsős azonosításon, és külön is visszavonható.',
  'docsync.connect.about.opencloud': 'A TREK saját teret kap ehhez az úthoz, mindentől elkülönítve.',
  'docsync.connect.about.synologydrive':
    'Legjobb egy olyan DSM-fiók, amely csak az ehhez az úthoz tartozó megosztott mappát éri el.',

  // ── A tároló kiválasztása ──────────────────────────────────────────────────
  'docsync.scope.title': 'Hová kerüljön ez az út a(z) {provider} tárolóban?',
  'docsync.scope.intro': 'Csak az szinkronizálódik, ami itt van. A tárolód minden más tartalma kívül marad a TREK-en.',
  'docsync.scope.createTitle': 'Új létrehozása',
  'docsync.scope.createAction': 'Létrehozás',
  'docsync.scope.pickTitle': 'Vagy használj egy meglévőt',
  'docsync.scope.search': 'Keresés',
  'docsync.scope.noMatch': 'Erre nincs találat.',

  // ── Amikről dönteni kell ───────────────────────────────────────────────────
  'docsync.issues.title': 'Átnézést igényel',
  'docsync.issues.conflict': 'Mindkét helyen megváltozott. Válaszd ki, melyik maradjon.',
  'docsync.issues.remote_missing': 'Eltűnt a tárolóból. A TREK-példány még megvan.',
  'docsync.issues.rejected_type': 'Ez a fájltípus itt nem engedélyezett.',
  'docsync.issues.too_large': 'Nagyobb a megengedettnél.',
  'docsync.issues.error': 'Az átvitel nem sikerült.',

  'docsync.error.unknown_provider': 'Ez a szolgáltató nem érhető el ezen a példányon.',
  'docsync.error.provider_disabled': 'Szüneteltetve: egy rendszergazda kikapcsolta ezt a szolgáltatót. A szinkronizálás folytatódik, amint újra bekapcsolják.',
  'docsync.binding.reconnect': 'Újracsatlakozás',
};

export default docsync;
