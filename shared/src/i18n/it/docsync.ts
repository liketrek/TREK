import type { TranslationStrings } from '../types';

const docsync: TranslationStrings = {
  'docsync.title': 'Sincronizzazione documenti',
  'docsync.noProviders': 'Nessun provider di documenti disponibile',
  'docsync.noProvidersHint': 'Un amministratore dell’istanza li attiva in Admin, Moduli, Documenti.',
  'docsync.addProvider': 'Collega un provider',
  'docsync.test': 'Prova la connessione',
  'docsync.connect.optional': 'Facoltativo',
  'docsync.connected': 'Connesso',
  'docsync.chooseFolder': 'Scegli la cartella',
  'docsync.noFolders': 'Non è ancora stato trovato nulla su questa istanza.',
  'docsync.newFolderPlaceholder': 'Nome della nuova cartella',
  'docsync.syncNow': 'Sincronizza ora',
  'docsync.unlink': 'Disconnetti',
  'docsync.confirmUnlink': 'I documenti restano in TREK e nell’archivio. Sparisce solo l’abbinamento fra i due.',
  'docsync.syncEnabled': 'Sincronizza automaticamente',
  'docsync.deletePolicy': 'Quando un documento viene eliminato',
  'docsync.deleteUnlink': 'Mantieni entrambe le copie',
  'docsync.deleteTrash': 'Sposta nel cestino',
  'docsync.conflictPolicy': 'Quando entrambi i lati sono cambiati',
  'docsync.onConflict.manual': 'Chiedimelo',
  'docsync.onConflict.trek_wins': 'Tieni la copia di TREK',
  'docsync.onConflict.provider_wins': "Tieni la copia dell'archivio",
  'docsync.webhookHint':
    'Incolla questo URL nel tuo provider per ricevere subito le modifiche. Senza, TREK controlla a intervalli regolari.',

  // Campi del modulo di connessione. Le chiavi rispecchiano la colonna `label` di
  // document_provider_fields, che salva un suffisso di chiave invece del testo.
  'docsync.providerUrl': 'Indirizzo',
  'docsync.providerApiToken': 'Token API',
  'docsync.providerApiKey': 'Chiave API',
  'docsync.providerAppPassword': 'Password per applicazioni',
  'docsync.providerAppToken': 'Token applicativo',
  'docsync.providerUsername': 'Nome utente',
  'docsync.providerPassword': 'Password',
  'docsync.providerOrganization': 'ID organizzazione',
  'docsync.providerBasePath': 'Cartella di base',
  'docsync.providerOTP': 'Codice a due fattori',
  'docsync.allowInsecureTls': 'Accetta un certificato autofirmato',

  'docsync.hintPaperlessToken': 'Crealo in Paperless sotto Il mio profilo. Ha tutti i diritti di quell’account.',
  'docsync.hintPapraKey':
    'Creala in Papra sotto Chiavi API. Le chiavi Papra raggiungono sempre tutte le organizzazioni a cui appartieni.',
  'docsync.hintPapraOrg': 'L’id org_… che compare nella barra degli indirizzi di Papra.',
  'docsync.hintNextcloudLogin': 'Il tuo nome utente Nextcloud, non l’indirizzo email.',
  'docsync.hintNextcloudAppPassword':
    'Impostazioni, Sicurezza, Crea nuova password per applicazioni. Mai la password del tuo account.',
  'docsync.hintOpenCloudToken': 'Si crea in OpenCloud sotto i token applicativi.',
  'docsync.hintBasePath': 'Dove TREK cerca le cartelle dei viaggi. Come impostazione predefinita /TREK.',
  'docsync.hintSynologyUrl': 'Indica anche la porta, per esempio https://nas.example.com:5001',
  'docsync.hintSynologyUser': 'Meglio un account DSM dedicato, con accesso solo a questa cartella condivisa.',
  'docsync.hintSynologyOtp': 'Serve una sola volta, se l’account usa l’autenticazione a due fattori.',

  'docsync.linkState.never': 'Non ancora sincronizzato',
  'docsync.linkState.ok': 'Allineato',
  'docsync.linkState.partial': 'Sincronizzato in parte',
  'docsync.linkState.failed': 'Non riuscito',
  'docsync.linkState.needs_reauth': 'Accedi di nuovo',
  'docsync.linkState.scope_lost': 'La cartella non c’è più',
  'docsync.linkState.orphaned': 'Il proprietario ha lasciato il viaggio',

  'docsync.state.pending': 'In attesa',
  'docsync.state.synced': 'Sincronizzato',
  'docsync.state.conflict': 'Conflitto',
  'docsync.state.rejected_type': 'Tipo non consentito',
  'docsync.state.too_large': 'Troppo grande',
  'docsync.state.error': 'Errore',
  'docsync.state.remote_missing': 'Assente sul provider',
  'docsync.state.local_deleted': 'Eliminato in TREK',
  'docsync.state.scope_drift': 'Spostato fuori dalla cartella',

  'docsync.conflict.resolve': "Risolvi {count}",

  'docsync.conflict.title': 'Entrambe le copie sono cambiate',
  'docsync.conflict.keepTrek': 'Mantieni la versione di TREK',
  'docsync.conflict.keepProvider': 'Mantieni la versione del provider',
  'docsync.conflict.keepBoth': 'Mantieni entrambe',

  // I motivi di errore viaggiano come codici, mai come testo del provider: quello risponde
  // in inglese, oppure restituisce la pagina di accesso HTML di un proxy, e nessuna delle due
  // cose ha senso qui.
  'docsync.error.unreachable': 'Impossibile raggiungere il provider.',
  'docsync.error.tls_untrusted':
    'Il certificato è stato rifiutato. Consenti i certificati autofirmati se ti fidi di questa istanza.',
  'docsync.error.unauthorized': 'Le credenziali sono state rifiutate.',
  'docsync.error.forbidden': 'Questo account non è autorizzato a farlo.',
  'docsync.error.not_found': 'Non trovato sul provider.',
  'docsync.error.scope_missing': 'La cartella collegata non esiste più.',
  'docsync.error.rate_limited': 'Il provider sta limitando le richieste. TREK riproverà più tardi.',
  'docsync.error.too_large': 'Il file supera la dimensione accettata dal provider.',
  'docsync.error.unsupported_type': 'Il provider non accetta questo tipo di file.',
  'docsync.error.quota_exceeded': 'Il provider ha esaurito lo spazio.',
  'docsync.error.conflict': 'Il documento è cambiato da entrambe le parti.',
  'docsync.error.checksum_mismatch': 'Il trasferimento non è arrivato integro.',
  'docsync.error.provider_error': 'Il provider ha segnalato un errore.',
  'docsync.error.timeout': 'Il provider ha impiegato troppo tempo a rispondere.',
  'docsync.error.ssrf_blocked': 'Questo indirizzo non è consentito.',
  'docsync.error.mass_delete_guard':
    'Quasi tutti i documenti sono spariti in una volta, quindi non è stato modificato nulla. Controlla che la cartella sia ancora montata.',
  'docsync.error.unknown': 'Qualcosa è andato storto.',

  // ── La finestra ────────────────────────────────────────────────────────────
  'docsync.sidebar.connected': 'Questo viaggio',
  'docsync.addAnother': 'Aggiungine un altro',
  'docsync.syncing': 'Sincronizzazione',
  'docsync.card.pickFolder': 'Connesso, scegli una cartella',

  'docsync.empty.title': 'Ancora nessun collegamento',
  'docsync.empty.hintOwner':
    'Scegli un archivio a sinistra. TREK tiene una copia di tutto, quindi non si perde nulla se l’archivio sparisce.',
  'docsync.empty.hintMember': 'Se ne occupa il proprietario del viaggio. In ogni caso i documenti restano in TREK.',

  // Come ogni prodotto archivia le cose. Si vede prima di collegarsi, perché è
  // quello che chiederà la schermata successiva.
  'docsync.model.paperless': 'Archivia per tag',
  'docsync.model.papra': 'Archivia per tag, dentro un’organizzazione',
  'docsync.model.nextcloud': 'Archivia in una cartella',
  'docsync.model.opencloud': 'Archivia in uno spazio',
  'docsync.model.synologydrive': 'Archivia in una cartella sul NAS',

  // ── La barra del flusso ────────────────────────────────────────────────────
  'docsync.flow.trek': 'TREK',
  'docsync.flow.toProvider': 'Verso l’archivio',
  'docsync.flow.toTrek': 'Dall’archivio',
  'docsync.flow.documents': 'documenti',
  'docsync.flow.summary.both': 'Documenti in entrambe le direzioni.',
  'docsync.flow.summary.pull': 'Documenti solo in entrata.',
  'docsync.flow.summary.push': 'Documenti solo in uscita.',
  'docsync.flow.summaryEditable.both': 'In entrambe le direzioni. Tocca una corsia per fermarla.',
  'docsync.flow.summaryEditable.pull': 'Solo in entrata. Tocca l’altra corsia per inviare anche in uscita.',
  'docsync.flow.summaryEditable.push': 'Solo in uscita. Tocca l’altra corsia per ricevere anche in entrata.',

  // ── Un abbinamento ─────────────────────────────────────────────────────────
  'docsync.binding.settings': 'Impostazioni',
  'docsync.binding.folder': 'Cartella',
  'docsync.binding.lastRun': 'Ultima esecuzione',
  'docsync.binding.autoOff': 'In pausa',
  'docsync.binding.neverRun': 'mai eseguita',
  'docsync.binding.deleteHint': 'Che cosa succede alla copia dall’altra parte.',
  'docsync.binding.conflictHint': 'Quale copia resta quando un documento è stato modificato in entrambi i posti.',
  'docsync.binding.autoHint': 'Controlla le modifiche in background.',
  'docsync.binding.webhookTitle': 'Aggiornamenti immediati',
  'docsync.binding.copy': 'Copia',
  'docsync.binding.copied': 'Copiato',

  // ── Connessione ────────────────────────────────────────────────────────────
  'docsync.connect.submit': 'Connetti',
  'docsync.connect.testing': 'Tentativo di connessione',
  'docsync.connect.okAs': 'Raggiunto, accesso come {account}',
  'docsync.connect.insecureHint': 'Per un’istanza sulla tua rete con un certificato autofirmato.',
  'docsync.connect.about.paperless':
    'TREK archivia questo viaggio sotto un tag suo e non tocca il resto del tuo archivio.',
  'docsync.connect.about.papra':
    'Scegli l’organizzazione a cui appartiene questo viaggio. TREK lo archivia lì sotto un tag suo.',
  'docsync.connect.about.nextcloud':
    'Usa una password per applicazioni, non quella del tuo account: regge l’autenticazione a due fattori e puoi revocarla da sola.',
  'docsync.connect.about.opencloud': 'TREK riceve uno spazio tutto suo per questo viaggio, separato da tutto il resto.',
  'docsync.connect.about.synologydrive':
    'Meglio un account DSM che raggiunga solo la cartella condivisa destinata a questo viaggio.',

  // ── Scelta del contenitore ─────────────────────────────────────────────────
  'docsync.scope.title': 'Dove deve stare questo viaggio in {provider}?',
  'docsync.scope.intro':
    'Viene sincronizzato solo quello che sta qui dentro. Tutto il resto del tuo archivio resta fuori da TREK.',
  'docsync.scope.createTitle': 'Creane uno nuovo',
  'docsync.scope.createAction': 'Crea',
  'docsync.scope.pickTitle': 'Oppure usane uno che hai già',
  'docsync.scope.search': 'Cerca',
  'docsync.scope.noMatch': 'Nessun risultato.',

  // ── Cose da decidere ───────────────────────────────────────────────────────
  'docsync.issues.title': 'Da controllare',
  'docsync.issues.conflict': 'Cambiato da entrambe le parti. Scegli quale copia tenere.',
  'docsync.issues.remote_missing': 'Sparito dall’archivio. La copia in TREK c’è ancora.',
  'docsync.issues.rejected_type': 'Questo tipo di file non è consentito qui.',
  'docsync.issues.too_large': 'Oltre il limite di dimensione.',
  'docsync.issues.error': 'Il trasferimento non è andato a buon fine.',

  'docsync.error.unknown_provider': 'Questo provider non è disponibile su questa istanza.',
  'docsync.error.provider_disabled': 'In pausa: un amministratore ha disattivato questo provider. La sincronizzazione riprende appena viene riattivato.',
};

export default docsync;
