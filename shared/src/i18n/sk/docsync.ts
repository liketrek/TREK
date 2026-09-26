import type { TranslationStrings } from '../types';

const docsync: TranslationStrings = {
  'docsync.title': 'Synchronizácia dokumentov',
  'docsync.noProviders': 'Nie sú dostupní žiadni poskytovatelia dokumentov',
  'docsync.noProvidersHint': 'Správca inštancie ich zapína v časti Administrácia, Doplnky, Dokumenty.',
  'docsync.addProvider': 'Pripojiť poskytovateľa',
  'docsync.test': 'Otestovať pripojenie',
  'docsync.connect.optional': 'Voliteľné',
  'docsync.connected': 'Pripojené',
  'docsync.chooseFolder': 'Vybrať priečinok',
  'docsync.noFolders': 'Na tejto inštancii sa zatiaľ nič nenašlo.',
  'docsync.newFolderPlaceholder': 'Názov nového priečinka',
  'docsync.syncNow': 'Synchronizovať teraz',
  'docsync.unlink': 'Odpojiť',
  'docsync.confirmUnlink': 'Dokumenty zostanú v TREKu aj v úložisku. Zruší sa len ich prepojenie.',
  'docsync.syncEnabled': 'Synchronizovať automaticky',
  'docsync.deletePolicy': 'Keď sa dokument odstráni',
  'docsync.deleteUnlink': 'Zachovať obe kópie',
  'docsync.deleteTrash': 'Presunúť do koša',
  'docsync.conflictPolicy': 'Keď sa zmenili obe strany',
  'docsync.onConflict.manual': 'Opýtať sa',
  'docsync.onConflict.trek_wins': 'Ponechať kópiu z TREKu',
  'docsync.onConflict.provider_wins': 'Ponechať kópiu z úložiska',
  'docsync.webhookHint':
    'Vložte túto URL k svojmu poskytovateľovi, aby zmeny prichádzali okamžite. Bez toho TREK kontroluje v pravidelných intervaloch.',

  // Polia formulára pripojenia. Kľúče zodpovedajú stĺpcu `label` v tabuľke
  // document_provider_fields, ktorá ukladá príponu kľúča, nie text.
  'docsync.providerUrl': 'Adresa',
  'docsync.providerApiToken': 'API token',
  'docsync.providerApiKey': 'API kľúč',
  'docsync.providerAppPassword': 'Heslo aplikácie',
  'docsync.providerAppToken': 'Token aplikácie',
  'docsync.providerUsername': 'Používateľské meno',
  'docsync.providerPassword': 'Heslo',
  'docsync.providerOrganization': 'ID organizácie',
  'docsync.providerBasePath': 'Základný priečinok',
  'docsync.providerOTP': 'Dvojfaktorový kód',
  'docsync.allowInsecureTls': 'Prijať vlastnoručne podpísaný certifikát',

  'docsync.hintPaperlessToken': 'Vytvorte ho v Paperless pod My Profile. Nesie plné práva daného účtu.',
  'docsync.hintPapraKey':
    'Vytvorte ho v Papra pod API keys. Kľúče Papra vždy dosiahnu na každú organizáciu, do ktorej patríte.',
  'docsync.hintPapraOrg': 'ID v tvare org_… z adresného riadka aplikácie Papra.',
  'docsync.hintNextcloudLogin': 'Vaše prihlasovacie meno v Nextcloude, nie e-mailová adresa.',
  'docsync.hintNextcloudAppPassword': 'Nastavenia, Zabezpečenie, Vytvoriť nové heslo aplikácie. Nikdy heslo k účtu.',
  'docsync.hintOpenCloudToken': 'Vytvára sa v OpenCloude pod tokenmi aplikácií.',
  'docsync.hintBasePath': 'Kde TREK hľadá priečinky ciest. Predvolene /TREK.',
  'docsync.hintSynologyUrl': 'Uveďte aj port, napríklad https://nas.example.com:5001',
  'docsync.hintSynologyUser': 'Najlepšie vyhradený účet DSM s prístupom len k tomuto zdieľanému priečinku.',
  'docsync.hintSynologyOtp': 'Potrebné len raz, ak účet používa dvojfaktorové overenie.',

  'docsync.linkState.never': 'Zatiaľ nesynchronizované',
  'docsync.linkState.ok': 'Aktuálne',
  'docsync.linkState.partial': 'Čiastočne synchronizované',
  'docsync.linkState.failed': 'Zlyhalo',
  'docsync.linkState.needs_reauth': 'Prihláste sa znova',
  'docsync.linkState.scope_lost': 'Priečinok zmizol',
  'docsync.linkState.orphaned': 'Vlastník opustil cestu',

  'docsync.state.pending': 'Čaká',
  'docsync.state.synced': 'Synchronizované',
  'docsync.state.conflict': 'Konflikt',
  'docsync.state.rejected_type': 'Nepovolený typ',
  'docsync.state.too_large': 'Príliš veľké',
  'docsync.state.error': 'Chyba',
  'docsync.state.remote_missing': 'Chýba u poskytovateľa',
  'docsync.state.local_deleted': 'Odstránené v TREKu',
  'docsync.state.scope_drift': 'Presunuté mimo priečinka',

  'docsync.conflict.resolve': 'Vyriešiť {count}',

  'docsync.conflict.title': 'Zmenili sa obe kópie',
  'docsync.conflict.keepTrek': 'Ponechať verziu z TREKu',
  'docsync.conflict.keepProvider': 'Ponechať verziu poskytovateľa',
  'docsync.conflict.keepBoth': 'Ponechať obe',

  // Dôvody zlyhania sa prenášajú ako kódy, nikdy ako text od poskytovateľa: ten
  // odpovedá anglicky alebo HTML prihlasovacou stránkou proxy a ani jedno sem nepatrí.
  'docsync.error.unreachable': 'Poskytovateľa sa nepodarilo kontaktovať.',
  'docsync.error.tls_untrusted':
    'Certifikát bol odmietnutý. Ak tejto inštancii dôverujete, povoľte vlastnoručne podpísané certifikáty.',
  'docsync.error.unauthorized': 'Prihlasovacie údaje boli odmietnuté.',
  'docsync.error.forbidden': 'Tento účet na to nemá oprávnenie.',
  'docsync.error.not_found': 'U poskytovateľa sa nenašlo.',
  'docsync.error.scope_missing': 'Pripojený priečinok už neexistuje.',
  'docsync.error.rate_limited': 'Poskytovateľ obmedzuje počet požiadaviek. TREK to skúsi znova neskôr.',
  'docsync.error.too_large': 'Súbor je väčší, než poskytovateľ prijíma.',
  'docsync.error.unsupported_type': 'Poskytovateľ tento typ súboru neprijíma.',
  'docsync.error.quota_exceeded': 'Poskytovateľovi došlo miesto.',
  'docsync.error.conflict': 'Dokument sa zmenil na oboch stranách.',
  'docsync.error.checksum_mismatch': 'Prenos nedorazil neporušený.',
  'docsync.error.provider_error': 'Poskytovateľ ohlásil chybu.',
  'docsync.error.timeout': 'Poskytovateľ odpovedal príliš dlho.',
  'docsync.error.ssrf_blocked': 'Táto adresa nie je povolená.',
  'docsync.error.mass_delete_guard':
    'Naraz zmizla väčšina dokumentov, preto sa nič nezmenilo. Skontrolujte, či je priečinok stále pripojený.',
  'docsync.error.unknown': 'Niečo sa pokazilo.',

  // ── Dialóg ─────────────────────────────────────────────────────────────────
  'docsync.sidebar.connected': 'Táto cesta',
  'docsync.addAnother': 'Pridať ďalší',
  'docsync.syncing': 'Synchronizuje sa',
  'docsync.card.pickFolder': 'Pripojené, vyberte priečinok',

  'docsync.empty.title': 'Zatiaľ nič nepripojené',
  'docsync.empty.hintOwner':
    'Vyberte úložisko vľavo. TREK si vždy ponecháva vlastnú kópiu všetkého, takže sa nič nestratí, ani keď úložisko zmizne.',
  'docsync.empty.hintMember': 'Nastavuje to vlastník cesty. Dokumenty tak či tak zostávajú v TREKu.',

  // Ako každý produkt veci ukladá. Zobrazuje sa ešte pred pripojením, pretože
  // práve na to sa spýta ďalšia obrazovka.
  'docsync.model.paperless': 'Ukladá podľa štítkov',
  'docsync.model.papra': 'Ukladá podľa štítkov v rámci organizácie',
  'docsync.model.nextcloud': 'Ukladá do priečinka',
  'docsync.model.opencloud': 'Ukladá do priestoru',
  'docsync.model.synologydrive': 'Ukladá do priečinka na NAS',

  // ── Pruh toku ──────────────────────────────────────────────────────────────
  'docsync.flow.trek': 'TREK',
  'docsync.flow.toProvider': 'Do úložiska',
  'docsync.flow.toTrek': 'Z úložiska',
  'docsync.flow.documents': 'dokumentov',
  'docsync.flow.summary.both': 'Dokumenty putujú oboma smermi.',
  'docsync.flow.summary.pull': 'Dokumenty len prichádzajú.',
  'docsync.flow.summary.push': 'Dokumenty len odchádzajú.',
  'docsync.flow.summaryEditable.both': 'Oboma smermi. Klepnutím na pruh jeden smer vypnete.',
  'docsync.flow.summaryEditable.pull': 'Len dnu. Klepnutím na druhý pruh zapnete aj odosielanie.',
  'docsync.flow.summaryEditable.push': 'Len von. Klepnutím na druhý pruh zapnete aj príjem.',

  // ── Jedno prepojenie ───────────────────────────────────────────────────────
  'docsync.binding.settings': 'Nastavenia',
  'docsync.binding.folder': 'Priečinok',
  'docsync.binding.lastRun': 'Posledný beh',
  'docsync.binding.autoOff': 'Pozastavené',
  'docsync.binding.neverRun': 'zatiaľ neprebehlo',
  'docsync.binding.deleteHint': 'Čo sa stane s kópiou na druhej strane.',
  'docsync.binding.conflictHint': 'Ktorá kópia zostane, keď bol dokument upravený na oboch miestach.',
  'docsync.binding.autoHint': 'Kontrolovať zmeny na pozadí.',
  'docsync.binding.webhookTitle': 'Okamžité aktualizácie',
  'docsync.binding.copy': 'Kopírovať',
  'docsync.binding.copied': 'Skopírované',

  // ── Pripájanie ─────────────────────────────────────────────────────────────
  'docsync.connect.submit': 'Pripojiť',
  'docsync.connect.testing': 'Nadväzuje sa spojenie',
  'docsync.connect.okAs': 'Spojenie nadviazané, prihlásené ako {account}',
  'docsync.connect.insecureHint': 'Pre inštanciu vo vlastnej sieti s vlastnoručne podpísaným certifikátom.',
  'docsync.connect.about.paperless': 'TREK ukladá túto cestu pod vlastným štítkom a zvyšku vášho archívu sa nedotkne.',
  'docsync.connect.about.papra':
    'Vyberte organizáciu, do ktorej cesta patrí. TREK ju v nej uloží pod vlastným štítkom.',
  'docsync.connect.about.nextcloud':
    'Použite heslo aplikácie, nie heslo k účtu: funguje aj s dvojfaktorovým overením a dá sa zrušiť samostatne.',
  'docsync.connect.about.opencloud': 'TREK dostane pre túto cestu vlastný priestor, oddelený od všetkého ostatného.',
  'docsync.connect.about.synologydrive':
    'Najlepšie účet DSM, ktorý dosiahne len na zdieľaný priečinok určený pre túto cestu.',

  // ── Výber umiestnenia ──────────────────────────────────────────────────────
  'docsync.scope.title': 'Kam v {provider} túto cestu uložiť?',
  'docsync.scope.intro': 'Synchronizuje sa len to, čo je vnútri. Zvyšok vášho úložiska zostane mimo TREK.',
  'docsync.scope.createTitle': 'Vytvoriť nové',
  'docsync.scope.createAction': 'Vytvoriť',
  'docsync.scope.pickTitle': 'Alebo použite existujúce',
  'docsync.scope.search': 'Hľadať',
  'docsync.scope.noMatch': 'Nič nezodpovedá.',

  // ── Čo musí rozhodnúť človek ───────────────────────────────────────────────
  'docsync.issues.title': 'Vyžaduje pozornosť',
  'docsync.issues.conflict': 'Zmenené na oboch stranách. Vyberte, ktorú verziu ponechať.',
  'docsync.issues.remote_missing': 'V úložisku už nie je. Kópia v TREKu tu zostáva.',
  'docsync.issues.rejected_type': 'Tento typ súboru tu nie je povolený.',
  'docsync.issues.too_large': 'Väčšie než limit.',
  'docsync.issues.error': 'Prenos neprebehol.',

  'docsync.error.unknown_provider': 'Tento poskytovateľ nie je na tejto inštancii dostupný.',
  'docsync.error.provider_disabled':
    'Pozastavené: správca tohto poskytovateľa vypol. Synchronizácia bude pokračovať, hneď ako ho znova zapne.',
  'docsync.binding.reconnect': 'Znova pripojiť',
};

export default docsync;
