import type { TranslationStrings } from '../types';

const storage: TranslationStrings = {
  'storage.field.root': 'Directory principale',
  'storage.help.root': 'Percorso assoluto sul server in cui questo backend memorizza i propri oggetti.',
  'storage.field.endpoint': 'URL endpoint',
  'storage.help.endpoint':
    'URL di base del servizio compatibile con S3, es. https://s3.example.com o http://127.0.0.1:9000.',
  'storage.field.bucket': 'Bucket',
  'storage.field.accessKeyId': 'ID chiave di accesso',
  'storage.field.secretAccessKey': 'Chiave di accesso segreta',
  'storage.field.region': 'Regione',
  'storage.help.region':
    'Mantieni il valore predefinito a meno che il tuo provider non richieda una regione specifica.',
  'storage.field.keyPrefix': 'Prefisso chiave',
  'storage.help.keyPrefix': 'Prefisso facoltativo aggiunto a ogni chiave oggetto, es. trek/prod.',
  'storage.field.retries': 'Tentativi',
  'storage.field.timeoutMs': 'Timeout (ms)',
  'storage.field.primary': 'Backend primario',
  'storage.field.replicas': 'Repliche',
  'storage.title': 'Archiviazione',
  'storage.description': 'Dove TREK conserva i file caricati, le foto e i backup. Nulla cambia finché non salvi.',
  'storage.loading': 'Caricamento…',
  'storage.saved': 'Configurazione di archiviazione salvata',
  'storage.save': 'Salva modifiche',
  'storage.unsaved': 'Modifiche non salvate',
  'storage.saveConflict':
    'La configurazione di archiviazione è cambiata da quando è stata caricata, quindi le tue modifiche non sono state salvate. Scartale e ricarica la configurazione salvata per ricominciare.',
  'storage.discardAndReload': 'Scarta le mie modifiche e ricarica',
  'storage.configError.banner':
    'Impossibile caricare le impostazioni di archiviazione salvate — il salvataggio le sostituirà: {error}',
  'storage.backends.title': 'Backend',
  'storage.backends.add': 'Aggiungi backend',
  'storage.backends.usedBy': 'Usato da: {categories}',
  'storage.backends.unused': 'Non assegnato a nessuna categoria',
  'storage.backends.envReadOnly': "Definito da una variabile d'ambiente — sola lettura",
  'storage.source.built-in': 'Integrato',
  'storage.source.env': 'Ambiente',
  'storage.source.settings': 'Impostazioni',
  'storage.type.local': 'Locale',
  'storage.type.s3': 'S3',
  'storage.type.mirror': 'Mirror',
  'storage.actions.test': 'Testa',
  'storage.actions.edit': 'Modifica',
  'storage.actions.remove': 'Rimuovi',
  'storage.test.running': 'Test in corso…',
  'storage.test.ok': 'Connessione riuscita',
  'storage.test.failed': 'Test non riuscito',
  'storage.remove.title': 'Rimuovi backend',
  'storage.remove.body':
    'Rimuovere {name} dalla configurazione? Il server rifiuta il salvataggio se qualcosa dipende ancora da esso.',
  'storage.remove.stillAssigned': 'Ancora assegnato a: {categories}',
  'storage.form.addTitle': 'Aggiungi backend',
  'storage.form.editTitle': 'Modifica backend',
  'storage.form.name': 'Nome',
  'storage.form.type': 'Tipo',
  'storage.form.apply': 'Applica',
  'storage.form.cancel': 'Annulla',
  'storage.form.duplicateName': 'Esiste già un backend chiamato {name}',
  'storage.categories.title': 'Categorie',
  'storage.categories.default': 'predefinita',
  'storage.categories.reassignWarning':
    'Gli oggetti esistenti non vengono spostati: i nuovi oggetti vanno al backend appena assegnato, quelli vecchi restano dove sono.',
  'storage.category.files': 'Documenti di viaggio',
  'storage.category.journey': 'Foto del diario di viaggio',
  'storage.category.covers': 'Immagini di copertina',
  'storage.category.avatars': 'Foto profilo',
  'storage.category.places': 'Immagini dei luoghi',
  'storage.category.photos-google': 'Cache foto di Google',
  'storage.category.photos-trek': 'Cache foto TREK',
  'storage.category.backups': 'Backup',

  // What each category stores — rendered under the label in the category map.
  'storage.categoryDesc.files':
    'Allegati caricati nei viaggi — biglietti, PDF, conferme di prenotazione e file condivisi nella chat del viaggio.',
  'storage.categoryDesc.journey': 'Foto e miniature allegate alle voci del diario di viaggio.',
  'storage.categoryDesc.covers': 'Immagini di copertina di viaggi e raccolte, incluse quelle recuperate da Unsplash.',
  'storage.categoryDesc.avatars': 'Foto profilo degli account utente.',
  'storage.categoryDesc.places': 'Immagini allegate ai luoghi e ai luoghi delle raccolte — caricate o importate.',
  'storage.categoryDesc.photos-google':
    'Copie in cache delle foto di Google Places — recuperabili di nuovo, perderle è sicuro.',
  'storage.categoryDesc.photos-trek':
    'Foto in cache dal servizio foto TREK usato da Foto (Memories) — recuperabili di nuovo, perderle è sicuro.',
  'storage.categoryDesc.backups': 'Archivi di backup del server creati dal pannello Backup o dalla pianificazione.',
  'storage.health.title': 'Stato',
  'storage.health.allClear': 'Nessun errore di replica registrato.',
  'storage.health.seedFile':
    "È presente un file seed storage-config.json ma viene ignorato — esistono già righe di configurazione. Gestisci l'archiviazione qui.",
  'storage.health.failureLine': '{op} di {key} su {backend} non riuscito: {error}',

  // Replicas-on-primary mirror UX (2026-08-20 spec)
  'storage.mirror.targets': 'Destinazioni mirror',
  'storage.mirror.targetsHelp':
    'Ogni scrittura su questo backend viene copiata anche su ogni destinazione selezionata.',
  'storage.mirror.latencyNote':
    "Le repliche vengono scritte una dopo l'altra durante ogni caricamento — una destinazione lenta o irraggiungibile rallenta ogni caricamento di ogni categoria su questo backend.",
  'storage.mirror.mirroredTo': 'Rispecchiato su: {targets}',
  'storage.mirror.replicaOf': 'Replica di: {primaries}',
  'storage.mirror.cacheWarning':
    'Non consigliato: questa categoria contiene contenuti riottenibili — replicarli è di solito uno spreco.',
  'storage.mirror.degenerate.duplicate-mirror':
    'Un secondo mirror avvolge {primary} — il pannello gestisce solo il primo; rimuovi questo per gestire il mirroring da {primary}.',
  'storage.mirror.degenerate.env-primary':
    "Avvolge un backend definito da una variabile d'ambiente — non modificabile qui.",
  'storage.mirror.degenerate.missing-primary': 'Fa riferimento a un backend che non esiste più.',
  'storage.remove.usedAsReplicaBy': 'Usato come replica da: {primaries}',

  // Backfill + usage (backfill/stats/notifications spec)
  'storage.sync.now': 'Sincronizza ora',
  'storage.sync.running': 'Sincronizzazione… {done}/{total}',
  'storage.sync.counts': '{copied} copiati · {skipped} saltati · {failed} falliti',
  'storage.sync.cancel': 'Annulla sincronizzazione',
  'storage.sync.done': 'Sincronizzazione completata: {copied} copiati, {deleted} eliminati, {failed} falliti',
  'storage.sync.cancelled': 'Sincronizzazione annullata',
  'storage.sync.error': 'Sincronizzazione non riuscita: {error}',
  'storage.sync.prompt': 'Gli oggetti esistenti non sono ancora replicati — sincronizzare ora?',
  'storage.sync.dismiss': 'Ignora',
  'storage.usage.line': '{objects} oggetti · {size}',
  'storage.usage.computed': 'Utilizzo calcolato {age}',
  'storage.usage.never': 'Utilizzo non ancora calcolato',
  'storage.usage.refresh': 'Aggiorna',
  'storage.usage.compute': 'Calcola ora',
  'storage.usage.legacyNote': 'include la libreria foto precedente',

  // Category migration (copy → flip → delta sweep)
  'storage.migrate.promptTitle': 'Spostare gli oggetti esistenti nel nuovo backend?',
  'storage.migrate.promptLine': '{category}: {objects} oggetti ({size}) da {from} a {to}',
  'storage.migrate.promptLineUnknown':
    '{category}: dimensione sconosciuta (utilizzo non ancora calcolato) da {from} a {to}',
  'storage.migrate.move': 'Sposta oggetti esistenti',
  'storage.migrate.routeOnly': 'Instrada solo le nuove scritture',
  'storage.migrate.running': 'Spostamento di {category}… {done}/{total}',
  'storage.migrate.done': 'Spostamento completato: {copied} copiati, {skipped} saltati',
  'storage.migrate.doneFailures': '{failed} non riusciti — questi oggetti non sono stati copiati nel nuovo backend',
  'storage.migrate.failed': 'Spostamento non riuscito: {error} — la categoria non è stata cambiata',
  'storage.migrate.cancelled': 'Spostamento annullato — nulla è stato cambiato',
  'storage.migrate.reclaimable': '{objects} oggetti ({size}) restano su {from} — recuperali manualmente',
  'storage.migrate.cancel': 'Annulla spostamento',
  'storage.migrate.promptCancel': 'Annulla',
  'storage.migrate.queued': 'In coda: {categories}',
  'storage.migrate.queueDropped':
    'Impossibile avviare lo spostamento successivo — la coda rimanente è stata svuotata: {categories}',
};
export default storage;
