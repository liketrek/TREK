import type { TranslationStrings } from '../types';

const docsync: TranslationStrings = {
  'docsync.title': 'Dokumentide sünkroonimine',
  'docsync.noProviders': 'Dokumenditeenuseid pole saadaval',
  'docsync.noProvidersHint': 'Administraator saab need lubada jaotises Haldus → Lisamoodulid → Dokumendid.',
  'docsync.addProvider': 'Ühenda teenus',
  'docsync.test': 'Testi ühendust',
  'docsync.connect.optional': 'Valikuline',
  'docsync.connected': 'Ühendatud',
  'docsync.chooseFolder': 'Vali kaust',
  'docsync.noFolders': 'Sellest serverist ei leitud veel midagi.',
  'docsync.newFolderPlaceholder': 'Uue kausta nimi',
  'docsync.syncNow': 'Sünkrooni kohe',
  'docsync.unlink': 'Katkesta ühendus',
  'docsync.confirmUnlink':
    'Dokumendid jäävad nii TREKi kui ka salvestusteenusesse. Eemaldatakse ainult nendevaheline seos.',
  'docsync.syncEnabled': 'Sünkrooni automaatselt',
  'docsync.deletePolicy': 'Dokumendi kustutamisel',
  'docsync.deleteUnlink': 'Säilita mõlemad koopiad',
  'docsync.deleteTrash': 'Teisalda prügikasti',
  'docsync.conflictPolicy': 'Kui mõlemad pooled on muutunud',
  'docsync.onConflict.manual': 'Küsi minult',
  'docsync.onConflict.trek_wins': 'Säilita TREKi koopia',
  'docsync.onConflict.provider_wins': 'Säilita salvestusteenuse koopia',
  'docsync.webhookHint':
    'Kleebi see URL teenusepakkuja seadetesse, et muudatused jõuaksid kohale kohe. Ilma selleta kontrollib TREK muudatusi ajastatult.',

  // Connection form fields. The keys mirror the `label` column in
  // document_provider_fields, which stores a key suffix rather than text.
  'docsync.providerUrl': 'Aadress',
  'docsync.providerApiToken': 'API-pääse',
  'docsync.providerApiKey': 'API-võti',
  'docsync.providerAppPassword': 'Rakenduse parool',
  'docsync.providerAppToken': 'Rakenduse pääse',
  'docsync.providerUsername': 'Kasutajanimi',
  'docsync.providerPassword': 'Parool',
  'docsync.providerOrganization': 'Organisatsiooni ID',
  'docsync.providerBasePath': 'Baaskaust',
  'docsync.providerOTP': 'Kaheastmelise autentimise kood',
  'docsync.allowInsecureTls': 'Luba iseallkirjastatud sertifikaat',

  'docsync.hintPaperlessToken': 'Loo see Paperlessi jaotises My Profile. Sellel on kõik vastava konto õigused.',
  'docsync.hintPapraKey':
    'Loo see Papra jaotises API keys. Papra võtmed pääsevad alati ligi kõigile organisatsioonidele, kuhu kuulud.',
  'docsync.hintPapraOrg': 'Papra aadressiribal olev org_… ID.',
  'docsync.hintNextcloudLogin': 'Sinu Nextcloudi kasutajanimi, mitte e-posti aadress.',
  'docsync.hintNextcloudAppPassword': 'Settings → Security → Create new app password. Ära kasuta konto parooli.',
  'docsync.hintOpenCloudToken': 'Loodud OpenCloudi rakenduspääsmete jaotises.',
  'docsync.hintBasePath': 'Kaust, kust TREK otsib reisikaustu. Vaikimisi /TREK.',
  'docsync.hintSynologyUrl': 'Lisa ka port, näiteks https://nas.example.com:5001',
  'docsync.hintSynologyUser': 'Soovitatav on eraldi DSM-konto, millel on juurdepääs ainult sellele ühiskaustale.',
  'docsync.hintSynologyOtp': 'Vajalik ainult üks kord, kui kontol on kaheastmeline autentimine.',

  'docsync.linkState.never': 'Veel sünkroonimata',
  'docsync.linkState.ok': 'Sünkroonis',
  'docsync.linkState.partial': 'Osaliselt sünkroonitud',
  'docsync.linkState.failed': 'Ebaõnnestus',
  'docsync.linkState.needs_reauth': 'Logi uuesti sisse',
  'docsync.linkState.scope_lost': 'Kaust puudub',
  'docsync.linkState.orphaned': 'Omanik lahkus reisilt',

  'docsync.state.pending': 'Ootel',
  'docsync.state.synced': 'Sünkroonitud',
  'docsync.state.conflict': 'Konflikt',
  'docsync.state.rejected_type': 'Tüüp pole lubatud',
  'docsync.state.too_large': 'Liiga suur',
  'docsync.state.error': 'Viga',
  'docsync.state.remote_missing': 'Teenusepakkuja juures puudu',
  'docsync.state.local_deleted': 'TREKis kustutatud',
  'docsync.state.scope_drift': 'Kaustast välja teisaldatud',

  'docsync.conflict.resolve': 'Lahenda {count}',

  'docsync.conflict.title': 'Mõlemad koopiad on muutunud',
  'docsync.conflict.keepTrek': 'Säilita TREKi versioon',
  'docsync.conflict.keepProvider': 'Säilita teenusepakkuja versioon',
  'docsync.conflict.keepBoth': 'Säilita mõlemad',

  // Failure reasons travel as codes, never as upstream text: a provider answers
  // in English, or with a proxy's HTML login page, and neither belongs here.
  'docsync.error.unreachable': 'Teenusepakkujaga ei saadud ühendust.',
  'docsync.error.tls_untrusted':
    'Sertifikaat lükati tagasi. Kui usaldad seda serverit, luba iseallkirjastatud sertifikaadid.',
  'docsync.error.unauthorized': 'Kasutajaandmed lükati tagasi.',
  'docsync.error.forbidden': 'Sellel kontol pole selle toimingu õigust.',
  'docsync.error.not_found': 'Teenusepakkuja juurest ei leitud.',
  'docsync.error.scope_missing': 'Ühendatud kausta pole enam olemas.',
  'docsync.error.rate_limited': 'Teenusepakkuja piirab päringuid. TREK proovib hiljem uuesti.',
  'docsync.error.too_large': 'Fail ületab teenusepakkuja suurusepiirangu.',
  'docsync.error.unsupported_type': 'Teenusepakkuja ei toeta seda failitüüpi.',
  'docsync.error.quota_exceeded': 'Teenusepakkujal pole enam vaba ruumi.',
  'docsync.error.conflict': 'Dokument muutus mõlemal poolel.',
  'docsync.error.checksum_mismatch': 'Andmeedastus ei saabunud terviklikult.',
  'docsync.error.provider_error': 'Teenusepakkuja teatas veast.',
  'docsync.error.timeout': 'Teenusepakkuja vastamine võttis liiga kaua aega.',
  'docsync.error.ssrf_blocked': 'See aadress pole lubatud.',
  'docsync.error.mass_delete_guard':
    'Enamik dokumente kadus korraga, seega midagi ei muudetud. Kontrolli, et kaust oleks endiselt ühendatud.',
  'docsync.error.unknown': 'Midagi läks valesti.',

  // ── The dialog ─────────────────────────────────────────────────────────────
  'docsync.sidebar.connected': 'See reis',
  'docsync.addAnother': 'Lisa veel üks',
  'docsync.syncing': 'Sünkroonimine',
  'docsync.card.pickFolder': 'Ühendatud, vali kaust',

  'docsync.empty.title': 'Midagi pole veel ühendatud',
  'docsync.empty.hintOwner':
    'Vali vasakult salvestusteenus. TREK säilitab kõigest oma koopia, nii et teenuse kadumisel ei lähe midagi kaotsi.',
  'docsync.empty.hintMember': 'Selle seadistab reisi omanik. Dokumendid jäävad igal juhul TREKi.',

  // How each product files things. Shown before anyone connects, because it is
  // what the next screen will ask for.
  'docsync.model.paperless': 'Failid sildi järgi',
  'docsync.model.papra': 'Failid sildi järgi organisatsiooni sees',
  'docsync.model.nextcloud': 'Failid kaustas',
  'docsync.model.opencloud': 'Failid tööruumis',
  'docsync.model.synologydrive': 'Failid NAS-i kaustas',

  // ── The flow bar ───────────────────────────────────────────────────────────
  'docsync.flow.trek': 'TREK',
  'docsync.flow.toProvider': 'Salvestusteenusesse',
  'docsync.flow.toTrek': 'Salvestusteenusest',
  'docsync.flow.documents': 'dokumenti',
  'docsync.flow.summary.both': 'Dokumendid liiguvad mõlemas suunas.',
  'docsync.flow.summary.pull': 'Dokumendid liiguvad ainult sisse.',
  'docsync.flow.summary.push': 'Dokumendid liiguvad ainult välja.',
  'docsync.flow.summaryEditable.both': 'Liiguvad mõlemas suunas. Suuna peatamiseks puuduta seda.',
  'docsync.flow.summaryEditable.pull': 'Liiguvad ainult sisse. Ka väljapoole saatmiseks puuduta teist suunda.',
  'docsync.flow.summaryEditable.push': 'Liiguvad ainult välja. Ka sissepoole toomiseks puuduta teist suunda.',

  // ── One binding ────────────────────────────────────────────────────────────
  'docsync.binding.settings': 'Seaded',
  'docsync.binding.folder': 'Kaust',
  'docsync.binding.lastRun': 'Viimane käivitus',
  'docsync.binding.autoOff': 'Peatatud',
  'docsync.binding.neverRun': 'veel käivitamata',
  'docsync.binding.deleteHint': 'Mis juhtub teisel poolel oleva koopiaga.',
  'docsync.binding.conflictHint': 'Milline koopia säilib, kui dokumenti muudeti mõlemas kohas.',
  'docsync.binding.autoHint': 'Kontrolli taustal muudatusi.',
  'docsync.binding.webhookTitle': 'Kohesed uuendused',
  'docsync.binding.copy': 'Kopeeri',
  'docsync.binding.copied': 'Kopeeritud',

  // ── Connecting ─────────────────────────────────────────────────────────────
  'docsync.connect.submit': 'Ühenda',
  'docsync.connect.testing': 'Ühenduse loomine',
  'docsync.connect.okAs': 'Ühendatud, sisse logitud kasutajana {account}',
  'docsync.connect.insecureHint': 'Sinu võrgus asuvale serverile, millel on iseallkirjastatud sertifikaat.',
  'docsync.connect.about.paperless': 'TREK salvestab selle reisi oma sildi alla ega puutu ülejäänud arhiivi.',
  'docsync.connect.about.papra': 'Vali organisatsioon, kuhu see reis kuulub. TREK salvestab selle seal oma sildi alla.',
  'docsync.connect.about.nextcloud':
    'Kasuta rakenduse parooli, mitte konto parooli: see töötab ka kaheastmelise autentimisega ja saad selle eraldi tühistada.',
  'docsync.connect.about.opencloud': 'TREK saab sellele reisile omaette tööruumi, ülejäänust eraldi.',
  'docsync.connect.about.synologydrive':
    'Soovitatav on DSM-konto, millel on juurdepääs ainult selle reisi ühiskaustale.',

  // ── Picking the container ──────────────────────────────────────────────────
  'docsync.scope.title': 'Kuhu salvestada see reis teenuses {provider}?',
  'docsync.scope.intro': 'Sünkroonitakse ainult siinseid faile. Ülejäänud salvestusteenuse sisu jääb TREKist välja.',
  'docsync.scope.createTitle': 'Loo uus',
  'docsync.scope.createAction': 'Loo',
  'docsync.scope.pickTitle': 'Või kasuta olemasolevat',
  'docsync.scope.search': 'Otsi',
  'docsync.scope.noMatch': 'Vasteid ei leitud.',

  // ── Things a person has to decide ──────────────────────────────────────────
  'docsync.issues.title': 'Vajab ülevaatamist',
  'docsync.issues.conflict': 'Muudetud mõlemas kohas. Vali, kumb säilitada.',
  'docsync.issues.remote_missing': 'Salvestusteenusest kadunud. TREKi koopia on endiselt alles.',
  'docsync.issues.rejected_type': 'See failitüüp pole siin lubatud.',
  'docsync.issues.too_large': 'Ületab suurusepiirangu.',
  'docsync.issues.error': 'Edastus ebaõnnestus.',

  'docsync.error.unknown_provider': 'See teenusepakkuja pole selles TREKi paigalduses saadaval.',
  'docsync.error.provider_disabled':
    'Peatatud: administraator on selle teenuse välja lülitanud. Sünkroonimine jätkub, kui see uuesti lubatakse.',
  'docsync.binding.reconnect': 'Ühenda uuesti',
};

export default docsync;
