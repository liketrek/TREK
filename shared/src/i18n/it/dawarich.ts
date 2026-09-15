import type { TranslationStrings } from '../types';

const dawarich: TranslationStrings = {
  // ── Connection ─────────────────────────────────────────────────────────────
  'dawarich.title': 'Dawarich',
  'dawarich.intro':
    'Collega la tua istanza Dawarich per vedere dove sei stato davvero. TREK la legge e propone voci di diario, luoghi e paesi — nulla viene aggiunto finché non lo confermi e nulla viene riscritto su Dawarich.',
  'dawarich.url': 'Indirizzo dell’istanza',
  'dawarich.apiKey': 'Chiave API',
  'dawarich.apiKeyPlaceholder': 'Incolla la tua chiave API di Dawarich',
  'dawarich.apiKeyHint':
    'La trovi in Dawarich sotto Account → Chiave API. Viene salvata cifrata e non viene più mostrata.',
  'dawarich.allowInsecureTls': 'Consenti certificato autofirmato',
  'dawarich.allowInsecureTlsHint':
    'Serve solo se la tua istanza usa un certificato di cui il tuo server non si fida.',
  'dawarich.syncEnabled': 'Cerca automaticamente nuove soste',
  'dawarich.syncEnabledHint': 'Se disattivato, TREK legge Dawarich solo quando glielo chiedi.',
  'dawarich.test.button': 'Prova la connessione',
  'dawarich.test.success': 'Connesso. {count} soste trovate negli ultimi 30 giorni.',
  'dawarich.test.failed': 'Impossibile raggiungere Dawarich.',
  'dawarich.syncNow': 'Controlla ora',
  'dawarich.connected': 'Connesso',
  'dawarich.notConnected': 'Non connesso',
  'dawarich.disconnect': 'Disconnetti',
  'dawarich.lastSync': 'Ultimo controllo {when}',
  'dawarich.neverSynced': 'Non ancora controllato',
  'dawarich.syncPartial': 'alcuni viaggi non sono stati letti',
  'dawarich.serverVersion': 'Dawarich {version}',

  'dawarich.toast.saved': 'Connessione a Dawarich salvata',
  'dawarich.toast.saveError': 'Impossibile salvare la connessione',
  'dawarich.toast.disconnected': 'Dawarich disconnesso',
  'dawarich.toast.synced': '{count} nuove soste trovate',
  'dawarich.toast.syncError': 'Impossibile leggere Dawarich',
  'dawarich.toast.syncRunning': 'Un controllo è già in corso',
  'dawarich.toast.acceptError': 'Impossibile aggiungerlo',
  'dawarich.toast.updateError': 'Impossibile aggiornare questo suggerimento',
  'dawarich.toast.accepted.place': 'Aggiunto al viaggio',
  'dawarich.toast.accepted.journal': 'Aggiunto al diario',
  'dawarich.toast.accepted.bucket_list': 'Spuntato dalla tua lista dei desideri',

  // ── What the connected instance can do ─────────────────────────────────────
  'dawarich.capability.visits': 'soste',
  'dawarich.capability.track': 'percorso registrato',
  'dawarich.capability.locations': 'confronto con la lista dei desideri',
  'dawarich.capability.visitedCities': 'paesi e città',
  'dawarich.capability.missing': 'Questa versione di Dawarich non offre: {features}.',

  // ── Failure reasons, as sentences the reader can act on ────────────────────
  'dawarich.error.unreachable': 'TREK non è riuscito a raggiungere quell’indirizzo.',
  'dawarich.error.unauthorized': 'Dawarich ha rifiutato la chiave API.',
  'dawarich.error.forbidden': 'Quella chiave API non è autorizzata a leggere questi dati.',
  'dawarich.error.not_found': 'Questa versione di Dawarich non ha quell’endpoint.',
  'dawarich.error.rate_limited': 'Dawarich ha chiesto a TREK di rallentare. Riprova tra poco.',
  'dawarich.error.server_error': 'Dawarich ha risposto con un errore.',
  'dawarich.error.invalid_response': 'Quell’indirizzo ha risposto con qualcosa che non è Dawarich.',
  'dawarich.error.too_large': 'Dawarich ha inviato più dati di quanti TREK ne legga in una volta.',
  'dawarich.error.not_connected': 'Nessuna istanza Dawarich è ancora collegata.',
  'dawarich.error.addon_disabled': 'Il componente aggiuntivo Dawarich è disattivato su questa istanza.',
  'dawarich.error.offline': 'Serve una connessione: TREK al momento è offline.',
  'dawarich.error.invalid_url': 'TREK non può usare questo indirizzo.',
  'dawarich.warning.private_ip': 'Questo indirizzo punta a un IP privato ({ip}). Verifica che sia voluto: il server potrebbe richiedere ALLOW_INTERNAL_NETWORK=true per raggiungerlo.',
  'dawarich.error.unknown': 'Qualcosa è andato storto nella comunicazione con Dawarich.',

  // ── The recorded route on the map ──────────────────────────────────────────
  'dawarich.trail.show': 'Mostra il percorso registrato',
  'dawarich.trail.hide': 'Nascondi il percorso registrato',
  'dawarich.trail.loading': 'Caricamento del percorso registrato…',
  'dawarich.trail.empty': 'In queste date non è stato registrato nulla',
  'dawarich.trail.offline': 'Il percorso registrato richiede una connessione',
  'dawarich.trail.unavailable': 'Impossibile caricare il percorso registrato',

  // ── Suggestions ────────────────────────────────────────────────────────────
  'dawarich.duration.minutes': '{minutes} min',
  'dawarich.duration.hours': '{hours} h',
  'dawarich.duration.hoursMinutes': '{hours} h {minutes} min',
  'dawarich.checkedAgo': 'verificato {ago}',

  'dawarich.badge.lowConfidence': 'Incerto',
  'dawarich.badge.sourceChanged': 'Cambiato in Dawarich',
  'dawarich.badge.sourceMissing': 'Sparito da Dawarich',

  'dawarich.suggestions.title': 'Da Dawarich',
  'dawarich.suggestions.pending': '{count} in attesa di te',
  'dawarich.suggestions.loading': 'Lettura di Dawarich…',
  'dawarich.suggestions.notConnected':
    'Collega Dawarich nelle Impostazioni per vedere qui le tue soste.',
  'dawarich.suggestions.unavailable': 'Impossibile leggere Dawarich.',
  'dawarich.suggestions.allHandled': 'Tutto ciò che è registrato qui è già stato gestito.',
  'dawarich.suggestions.asJournal': 'Scrivi una voce di diario',
  'dawarich.suggestions.asPlace': 'Aggiungi come luogo',
  'dawarich.suggestions.dismiss': 'Non è un luogo che ho visitato',
  'dawarich.suggestions.dismissed': 'Ignorato',
  'dawarich.suggestions.restore': 'Ripristina',
  'dawarich.suggestions.showHandled': 'Mostra {count} già gestiti',
  'dawarich.suggestions.hideHandled': 'Nascondi quelli già gestiti',
  'dawarich.suggestions.matchesWish': 'Nella tua lista dei desideri: {name}',
  'dawarich.suggestions.acceptedAs.place': 'Aggiunto come luogo',
  'dawarich.suggestions.acceptedAs.journal': 'Nel diario',
  'dawarich.suggestions.acceptedAs.bucket_list': 'Desiderio spuntato',
  'dawarich.suggestions.sourceChanged':
    'Questa sosta è cambiata in Dawarich da quando l’hai usata. Quello che hai scritto in TREK resta intatto.',
  'dawarich.suggestions.sourceMissing':
    'Questa sosta non esiste più in Dawarich. Quello che hai scritto in TREK resta intatto.',
  'dawarich.sourceStatus.suggested': 'Rilevata, non confermata',
  'dawarich.confidence.high': 'Rilevamento sicuro',
  'dawarich.confidence.medium': 'Rilevamento abbastanza sicuro',
  'dawarich.confidence.low': 'Rilevamento incerto',

  // ── The review step ────────────────────────────────────────────────────────
  'dawarich.accept.title.place': 'Aggiungi questa sosta come luogo',
  'dawarich.accept.title.journal': 'Scrivi una voce di diario',
  'dawarich.accept.title.bucket_list': 'Spunta un desiderio',
  'dawarich.accept.confirm.place': 'Aggiungi luogo',
  'dawarich.accept.confirm.journal': 'Aggiungi voce',
  'dawarich.accept.confirm.bucket_list': 'Spuntalo',
  'dawarich.accept.recorded': 'Registrata dal {from} al {to}',
  'dawarich.accept.duration': '{minutes} min',
  'dawarich.accept.name': 'Nome',
  'dawarich.accept.date': 'Data',
  'dawarich.accept.from': 'Arrivo',
  'dawarich.accept.to': 'Partenza',
  'dawarich.accept.trip': 'Viaggio',
  'dawarich.accept.thisTrip': 'Questo viaggio',
  'dawarich.accept.pickTrip': 'Scegli un viaggio',
  'dawarich.accept.day': 'Giorno',
  'dawarich.accept.noDay': 'Non ancora assegnata a un giorno',
  'dawarich.accept.journal': 'Diario',
  'dawarich.accept.pickJournal': 'Scegli un diario',
  'dawarich.accept.notes': 'Note',
  'dawarich.accept.story': 'La tua storia',
  'dawarich.accept.storyPlaceholder': 'Cosa è successo qui?',
  'dawarich.accept.photosHint': 'Aggiungi le foto alla voce dopo averla creata.',

  // ── A place that came out of a recording ──────────────────────────────────
  'dawarich.place.fromDawarich': 'Aggiunto dalle tue registrazioni Dawarich',

  // ── Wishlist ───────────────────────────────────────────────────────────────
  'dawarich.bucket.title': 'Confronta la tua lista dei desideri con Dawarich',
  'dawarich.bucket.description':
    'Cerca nelle tue registrazioni i luoghi che volevi raggiungere. Una visita richiede sia la vicinanza sia il tempo trascorso — passarci davanti in auto non conta.',
  'dawarich.bucket.scan': 'Controlla la lista dei desideri',
  'dawarich.bucket.scanning': 'Controllo in corso…',
  'dawarich.bucket.noMatches': 'Nelle tue registrazioni non è emerso nulla della tua lista dei desideri.',
  'dawarich.bucket.alreadyVisited': 'Già spuntato',
  'dawarich.bucket.confirm': 'Spunta {count}',
  'dawarich.bucket.confirmed': '{count} desideri spuntati',
  'dawarich.bucket.skipped': '{count} voci non hanno coordinate e non sono state controllate.',
  'dawarich.bucket.truncated':
    'Sono state controllate solo le prime voci. Esegui di nuovo il controllo per le altre.',
  'dawarich.bucket.visitedFrom': 'Spuntato dalle tue registrazioni Dawarich',
  'dawarich.bucket.clearVisit': 'Annulla',

  // ── Atlas ──────────────────────────────────────────────────────────────────
  'dawarich.atlas.title': 'Paesi da Dawarich',
  'dawarich.atlas.description':
    'I paesi in cui, secondo le tue registrazioni, sei stato. Conferma quelli che vuoi nel tuo Atlante — nulla viene aggiunto da solo e ciò che hai segnato a mano resta tuo.',
  'dawarich.atlas.load': 'Cerca i paesi',
  'dawarich.atlas.loading': 'Lettura delle tue registrazioni…',
  'dawarich.atlas.empty': 'Le tue registrazioni non mostrano paesi che TREK non abbia già.',
  'dawarich.atlas.cities': '{count} città',
  'dawarich.atlas.citiesOne': '1 città',
  'dawarich.atlas.accept': 'Aggiungi {count} paesi',
  'dawarich.atlas.accepted': '{count} paesi aggiunti',
  'dawarich.atlas.unresolved': 'TREK non è riuscito ad abbinare questi a un paese: {names}.',
  'dawarich.atlas.source': 'Da Dawarich',
  'dawarich.atlas.range': 'Esaminato dal {from} al {to}',

  'dawarich.atlas.trigger': 'Desideri e paesi dalle tue registrazioni',
  'dawarich.atlas.dialogSubtitle': 'Cosa dicono le tue registrazioni sul tuo Atlas',
  'dawarich.atlas.tab.wishes': 'Lista dei desideri',
  'dawarich.atlas.tab.countries': 'Paesi',
  'dawarich.atlas.window': 'Sono stati esaminati gli ultimi 12 mesi.',
  'dawarich.selected': '{count} selezionati',
  'dawarich.again': 'Controlla di nuovo',
  'dawarich.bucket.metersAway': 'a {meters} m',
  'dawarich.bucket.kilometersAway': 'a {km} km',
  'dawarich.bucket.rule': 'Un desiderio è raggiunto entro {meters} m e dopo {minutes} minuti sul posto.',

};

export default dawarich;
