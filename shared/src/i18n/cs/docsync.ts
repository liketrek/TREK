import type { TranslationStrings } from '../types';

const docsync: TranslationStrings = {
  'docsync.title': 'Synchronizace dokumentů',
  'docsync.noProviders': 'Nejsou dostupní žádní poskytovatelé dokumentů',
  'docsync.noProvidersHint': 'Správce instance je zapíná v Administraci, Doplňky, Dokumenty.',
  'docsync.addProvider': 'Připojit poskytovatele',
  'docsync.test': 'Otestovat připojení',
  'docsync.connect.optional': 'Volitelné',
  'docsync.connected': 'Připojeno',
  'docsync.chooseFolder': 'Vybrat složku',
  'docsync.noFolders': 'Na této instanci zatím nic nenalezeno.',
  'docsync.newFolderPlaceholder': 'Název nové složky',
  'docsync.syncNow': 'Synchronizovat teď',
  'docsync.unlink': 'Odpojit',
  'docsync.confirmUnlink': 'Dokumenty zůstanou v TREKu i v úložišti. Zruší se jen jejich propojení.',
  'docsync.syncEnabled': 'Synchronizovat automaticky',
  'docsync.deletePolicy': 'Když se dokument smaže',
  'docsync.deleteUnlink': 'Zachovat obě kopie',
  'docsync.deleteTrash': 'Přesunout do koše',
  'docsync.conflictPolicy': 'Když se změnily obě strany',
  'docsync.onConflict.manual': 'Zeptat se',
  'docsync.onConflict.trek_wins': 'Ponechat kopii z TREKu',
  'docsync.onConflict.provider_wins': 'Ponechat kopii z úložiště',
  'docsync.webhookHint':
    'Vložte tuto URL k poskytovateli, aby změny přicházely okamžitě. Bez toho se TREK ptá v pravidelných intervalech.',

  // Pole formuláře připojení. Klíče odpovídají sloupci `label` v tabulce
  // document_provider_fields, která ukládá příponu klíče, ne text.
  'docsync.providerUrl': 'Adresa',
  'docsync.providerApiToken': 'API token',
  'docsync.providerApiKey': 'API klíč',
  'docsync.providerAppPassword': 'Heslo aplikace',
  'docsync.providerAppToken': 'Token aplikace',
  'docsync.providerUsername': 'Uživatelské jméno',
  'docsync.providerPassword': 'Heslo',
  'docsync.providerOrganization': 'ID organizace',
  'docsync.providerBasePath': 'Základní složka',
  'docsync.providerOTP': 'Dvoufaktorový kód',
  'docsync.allowInsecureTls': 'Přijmout vlastnoručně podepsaný certifikát',

  'docsync.hintPaperlessToken': 'Vytvořte jej v Paperless-ngx pod My Profile. Nese plná práva daného účtu.',
  'docsync.hintPapraKey':
    'Vytvořte jej v aplikaci Papra pod API keys. Klíče Papra vždy dosáhnou na všechny organizace, do kterých patříte.',
  'docsync.hintPapraOrg': 'ID ve tvaru org_… z adresního řádku aplikace Papra.',
  'docsync.hintNextcloudLogin': 'Vaše přihlašovací jméno v Nextcloudu, ne e-mailová adresa.',
  'docsync.hintNextcloudAppPassword': 'Nastavení, Zabezpečení, Vytvořit nové heslo aplikace. Nikdy heslo k účtu.',
  'docsync.hintOpenCloudToken': 'Vytváří se v OpenCloudu pod tokeny aplikací.',
  'docsync.hintBasePath': 'Kde TREK hledá složky cest. Výchozí je /TREK.',
  'docsync.hintSynologyUrl': 'Uveďte i port, například https://nas.example.com:5001',
  'docsync.hintSynologyUser': 'Nejlépe vyhrazený účet DSM s přístupem jen k této sdílené složce.',
  'docsync.hintSynologyOtp': 'Potřeba jen jednou, pokud účet používá dvoufaktorové ověření.',

  'docsync.linkState.never': 'Zatím nesynchronizováno',
  'docsync.linkState.ok': 'Aktuální',
  'docsync.linkState.partial': 'Částečně synchronizováno',
  'docsync.linkState.failed': 'Selhalo',
  'docsync.linkState.needs_reauth': 'Přihlaste se znovu',
  'docsync.linkState.scope_lost': 'Složka zmizela',
  'docsync.linkState.orphaned': 'Vlastník opustil cestu',

  'docsync.state.pending': 'Čeká',
  'docsync.state.synced': 'Synchronizováno',
  'docsync.state.conflict': 'Konflikt',
  'docsync.state.rejected_type': 'Nepovolený typ',
  'docsync.state.too_large': 'Příliš velké',
  'docsync.state.error': 'Chyba',
  'docsync.state.remote_missing': 'Chybí u poskytovatele',
  'docsync.state.local_deleted': 'Smazáno v TREKu',
  'docsync.state.scope_drift': 'Přesunuto mimo složku',

  'docsync.conflict.resolve': "Vyřešit {count}",

  'docsync.conflict.title': 'Změnily se obě kopie',
  'docsync.conflict.keepTrek': 'Ponechat verzi z TREKu',
  'docsync.conflict.keepProvider': 'Ponechat verzi poskytovatele',
  'docsync.conflict.keepBoth': 'Ponechat obě',

  // Důvody selhání se přenášejí jako kódy, nikdy jako text od poskytovatele:
  // ten odpovídá anglicky nebo HTML přihlašovací stránkou proxy a ani jedno sem nepatří.
  'docsync.error.unreachable': 'Poskytovatele se nepodařilo kontaktovat.',
  'docsync.error.tls_untrusted':
    'Certifikát byl odmítnut. Pokud této instanci důvěřujete, povolte vlastnoručně podepsané certifikáty.',
  'docsync.error.unauthorized': 'Přihlašovací údaje byly odmítnuty.',
  'docsync.error.forbidden': 'Tento účet k tomu nemá oprávnění.',
  'docsync.error.not_found': 'U poskytovatele nenalezeno.',
  'docsync.error.scope_missing': 'Připojená složka už neexistuje.',
  'docsync.error.rate_limited': 'Poskytovatel omezuje počet požadavků. TREK to zkusí znovu později.',
  'docsync.error.too_large': 'Soubor je větší, než poskytovatel přijímá.',
  'docsync.error.unsupported_type': 'Poskytovatel tento typ souboru nepřijímá.',
  'docsync.error.quota_exceeded': 'Poskytovateli došlo místo.',
  'docsync.error.conflict': 'Dokument se změnil na obou stranách.',
  'docsync.error.checksum_mismatch': 'Přenos nedorazil neporušený.',
  'docsync.error.provider_error': 'Poskytovatel ohlásil chybu.',
  'docsync.error.timeout': 'Poskytovatel odpovídal příliš dlouho.',
  'docsync.error.ssrf_blocked': 'Tato adresa není povolena.',
  'docsync.error.mass_delete_guard':
    'Najednou zmizela většina dokumentů, proto se nic nezměnilo. Zkontrolujte, zda je složka stále připojená.',
  'docsync.error.unknown': 'Něco se pokazilo.',

  // ── Dialog ─────────────────────────────────────────────────────────────────
  'docsync.sidebar.connected': 'Tato cesta',
  'docsync.addAnother': 'Přidat další',
  'docsync.syncing': 'Synchronizuje se',
  'docsync.card.pickFolder': 'Připojeno, vyberte složku',

  'docsync.empty.title': 'Zatím nic nepřipojeno',
  'docsync.empty.hintOwner':
    'Vyberte úložiště vlevo. TREK si vždy nechává vlastní kopii, takže se nic neztratí, ani když úložiště zmizí.',
  'docsync.empty.hintMember': 'Nastavuje to vlastník cesty. Dokumenty tak jako tak zůstávají v TREKu.',

  // Jak každý produkt věci ukládá. Zobrazuje se ještě před připojením, protože
  // právě na to se zeptá další obrazovka.
  'docsync.model.paperless': 'Ukládá podle štítků',
  'docsync.model.papra': 'Ukládá podle štítků v rámci organizace',
  'docsync.model.nextcloud': 'Ukládá do složky',
  'docsync.model.opencloud': 'Ukládá do prostoru',
  'docsync.model.synologydrive': 'Ukládá do složky na NAS',

  // ── Pruh toku ──────────────────────────────────────────────────────────────
  'docsync.flow.trek': 'TREK',
  'docsync.flow.toProvider': 'Do úložiště',
  'docsync.flow.toTrek': 'Z úložiště',
  'docsync.flow.documents': 'dokumentů',
  'docsync.flow.summary.both': 'Dokumenty putují oběma směry.',
  'docsync.flow.summary.pull': 'Dokumenty jen přicházejí.',
  'docsync.flow.summary.push': 'Dokumenty jen odcházejí.',
  'docsync.flow.summaryEditable.both': 'Oběma směry. Klepnutím na pruh jeden směr vypnete.',
  'docsync.flow.summaryEditable.pull': 'Jen dovnitř. Klepnutím na druhý pruh zapnete i odesílání.',
  'docsync.flow.summaryEditable.push': 'Jen ven. Klepnutím na druhý pruh zapnete i příjem.',

  // ── Jedno propojení ────────────────────────────────────────────────────────
  'docsync.binding.settings': 'Nastavení',
  'docsync.binding.folder': 'Složka',
  'docsync.binding.lastRun': 'Poslední běh',
  'docsync.binding.autoOff': 'Pozastaveno',
  'docsync.binding.neverRun': 'zatím neproběhlo',
  'docsync.binding.deleteHint': 'Co se stane s kopií na druhé straně.',
  'docsync.binding.conflictHint': 'Která kopie zůstane, když byl dokument upraven na obou místech.',
  'docsync.binding.autoHint': 'Kontrolovat změny na pozadí.',
  'docsync.binding.webhookTitle': 'Okamžité aktualizace',
  'docsync.binding.copy': 'Kopírovat',
  'docsync.binding.copied': 'Zkopírováno',

  // ── Připojování ────────────────────────────────────────────────────────────
  'docsync.connect.submit': 'Připojit',
  'docsync.connect.testing': 'Navazuje se spojení',
  'docsync.connect.okAs': 'Spojení navázáno, přihlášeno jako {account}',
  'docsync.connect.insecureHint': 'Pro instanci ve vlastní síti s vlastnoručně podepsaným certifikátem.',
  'docsync.connect.about.paperless': 'TREK ukládá tuto cestu pod vlastním štítkem a zbytku vašeho archivu se nedotkne.',
  'docsync.connect.about.papra': 'Vyberte organizaci, do které cesta patří. TREK ji v ní uloží pod vlastním štítkem.',
  'docsync.connect.about.nextcloud':
    'Použijte heslo aplikace, ne heslo k účtu: funguje i s dvoufaktorovým ověřením a dá se zrušit samostatně.',
  'docsync.connect.about.opencloud': 'TREK dostane pro tuto cestu vlastní prostor, oddělený od všeho ostatního.',
  'docsync.connect.about.synologydrive':
    'Nejlépe účet DSM, který dosáhne jen na sdílenou složku určenou pro tuto cestu.',

  // ── Výběr umístění ─────────────────────────────────────────────────────────
  'docsync.scope.title': 'Kam v {provider} tuto cestu uložit?',
  'docsync.scope.intro': 'Synchronizuje se jen to, co je uvnitř. Zbytek vašeho úložiště zůstane mimo TREK.',
  'docsync.scope.createTitle': 'Vytvořit nové',
  'docsync.scope.createAction': 'Vytvořit',
  'docsync.scope.pickTitle': 'Nebo použijte existující',
  'docsync.scope.search': 'Hledat',
  'docsync.scope.noMatch': 'Nic neodpovídá.',

  // ── Co musí rozhodnout člověk ──────────────────────────────────────────────
  'docsync.issues.title': 'Vyžaduje pozornost',
  'docsync.issues.conflict': 'Změněno na obou stranách. Vyberte, kterou verzi ponechat.',
  'docsync.issues.remote_missing': 'V úložišti už není. Kopie v TREKu tu zůstává.',
  'docsync.issues.rejected_type': 'Tento typ souboru zde není povolen.',
  'docsync.issues.too_large': 'Větší než povolený limit.',
  'docsync.issues.error': 'Přenos neproběhl.',

  'docsync.error.unknown_provider': 'Tento poskytovatel není na této instanci dostupný.',
  'docsync.error.provider_disabled': 'Pozastaveno: správce tohoto poskytovatele vypnul. Synchronizace bude pokračovat, jakmile ho znovu zapne.',
  'docsync.binding.reconnect': 'Znovu připojit',
};

export default docsync;
