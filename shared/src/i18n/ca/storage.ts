import type { TranslationStrings } from '../types';

const storage: TranslationStrings = {
  'storage.field.root': 'Directori arrel',
  'storage.help.root': 'Camí absolut al servidor on aquest backend emmagatzema els seus objectes.',
  'storage.field.endpoint': "URL de l'endpoint",
  'storage.help.endpoint':
    'URL base del servei compatible amb S3, p. ex. https://s3.example.com o http://127.0.0.1:9000.',
  'storage.field.bucket': 'Bucket',
  'storage.field.accessKeyId': "ID de clau d'accés",
  'storage.field.secretAccessKey': "Clau d'accés secreta",
  'storage.field.region': 'Regió',
  'storage.help.region': 'Mantén el valor predeterminat llevat que el teu proveïdor requereixi una regió específica.',
  'storage.field.keyPrefix': 'Prefix de clau',
  'storage.help.keyPrefix': "Prefix opcional afegit a cada clau d'objecte, p. ex. trek/prod.",
  'storage.field.retries': 'Reintents',
  'storage.field.timeoutMs': "Temps d'espera (ms)",
  'storage.field.primary': 'Backend principal',
  'storage.field.replicas': 'Rèpliques',
  'storage.title': 'Emmagatzematge',
  'storage.description': 'On TREK desa els fitxers, fotos i còpies de seguretat pujats. Res no canvia fins que desis.',
  'storage.loading': 'Carregant…',
  'storage.saved': "Configuració d'emmagatzematge desada",
  'storage.save': 'Desar els canvis',
  'storage.unsaved': 'Canvis sense desar',
  'storage.saveConflict':
    "La configuració d'emmagatzematge ha canviat des que es va carregar, així que els teus canvis no s'han desat. Descarta'ls i torna a carregar la configuració desada per començar de nou.",
  'storage.discardAndReload': 'Descarta els meus canvis i torna a carregar',
  'storage.configError.banner':
    "No s'han pogut carregar els paràmetres d'emmagatzematge desats — desar-los els substituirà: {error}",
  'storage.backends.title': 'Backends',
  'storage.backends.add': 'Afegir backend',
  'storage.backends.usedBy': 'Utilitzat per: {categories}',
  'storage.backends.unused': 'No assignat a cap categoria',
  'storage.backends.envReadOnly': "Definit per una variable d'entorn — només lectura",
  'storage.source.built-in': 'Integrat',
  'storage.source.env': 'Entorn',
  'storage.source.settings': 'Configuració',
  'storage.type.local': 'Local',
  'storage.type.s3': 'S3',
  'storage.type.mirror': 'Mirall',
  'storage.actions.test': 'Provar',
  'storage.actions.edit': 'Editar',
  'storage.actions.remove': 'Suprimir',
  'storage.test.running': 'Provant…',
  'storage.test.ok': 'Connexió correcta',
  'storage.test.failed': 'Prova fallida',
  'storage.remove.title': 'Suprimir backend',
  'storage.remove.body':
    'Voleu suprimir {name} de la configuració? El servidor rebutja el desament si encara hi ha alguna cosa que en depengui.',
  'storage.remove.stillAssigned': 'Encara assignat a: {categories}',
  'storage.form.addTitle': 'Afegir backend',
  'storage.form.editTitle': 'Editar backend',
  'storage.form.name': 'Nom',
  'storage.form.type': 'Tipus',
  'storage.form.apply': 'Aplicar',
  'storage.form.cancel': 'Cancel·lar',
  'storage.form.duplicateName': 'Ja existeix un backend anomenat {name}',
  'storage.categories.title': 'Categories',
  'storage.categories.default': 'predeterminada',
  'storage.categories.reassignWarning':
    "Els objectes existents no es mouen: els objectes nous van al backend acabat d'assignar, els antics es queden on són.",
  'storage.category.files': 'Documents del viatge',
  'storage.category.journey': 'Fotos de la travesia',
  'storage.category.covers': 'Imatges de portada',
  'storage.category.avatars': 'Fotos de perfil',
  'storage.category.places': 'Imatges de llocs',
  'storage.category.photos-google': 'Memòria cau de fotos de Google',
  'storage.category.photos-trek': 'Memòria cau de fotos de TREK',
  'storage.category.backups': 'Còpies de seguretat',

  // What each category stores — rendered under the label in the category map.
  'storage.categoryDesc.files':
    'Fitxers adjunts pujats als viatges — bitllets, PDF, confirmacions de reserva i fitxers compartits al xat del viatge.',
  'storage.categoryDesc.journey': 'Fotos i miniatures adjuntes a les entrades de la travesia.',
  'storage.categoryDesc.covers':
    "Imatges de portada de viatges i col·leccions, incloses les portades obtingudes d'Unsplash.",
  'storage.categoryDesc.avatars': "Fotos de perfil dels comptes d'usuari.",
  'storage.categoryDesc.places': 'Imatges adjuntes a llocs i llocs de col·leccions — pujades o importades.',
  'storage.categoryDesc.photos-google':
    'Còpies en memòria cau de fotos de Google Places — es poden tornar a obtenir, es poden perdre sense problemes.',
  'storage.categoryDesc.photos-trek':
    'Fotos en memòria cau del servei de fotos de TREK utilitzat per les Fotos (Memòries) — es poden tornar a obtenir, es poden perdre sense problemes.',
  'storage.categoryDesc.backups':
    'Arxius de còpia de seguretat del servidor creats pel panell de còpia de seguretat o la planificació.',
  'storage.health.title': 'Estat',
  'storage.health.allClear': "No s'ha registrat cap fallada de rèplica.",
  'storage.health.seedFile':
    "Hi ha un fitxer llavor storage-config.json present però s'ignora — ja existeixen files de configuració. Gestiona l'emmagatzematge aquí.",
  'storage.health.failureLine': '{op} de {key} a {backend} ha fallat: {error}',

  // Replicas-on-primary mirror UX (2026-08-20 spec)
  'storage.mirror.targets': 'Objectius del mirall',
  'storage.mirror.targetsHelp': 'Cada escriptura en aquest backend també es copia a cada objectiu seleccionat.',
  'storage.mirror.latencyNote':
    "Les rèpliques s'escriuen una després de l'altra durant cada pujada — un objectiu lent o inabastable alenteix cada pujada de cada categoria en aquest backend.",
  'storage.mirror.mirroredTo': 'Reflectit a: {targets}',
  'storage.mirror.replicaOf': 'Rèplica de: {primaries}',
  'storage.mirror.cacheWarning':
    'No recomanat: aquesta categoria conté contingut que es pot tornar a obtenir — replicar-lo sol ser un malbaratament.',
  'storage.mirror.degenerate.duplicate-mirror':
    "Un segon mirall embolcalla {primary} — el panell només gestiona el primer; elimina'l per gestionar el mirall des de {primary}.",
  'storage.mirror.degenerate.env-primary':
    "Embolcalla un backend definit per una variable d'entorn — no editable aquí.",
  'storage.mirror.degenerate.missing-primary': 'Fa referència a un backend que ja no existeix.',
  'storage.remove.usedAsReplicaBy': 'Utilitzat com a rèplica per: {primaries}',

  // Backfill + usage (backfill/stats/notifications spec)
  'storage.sync.now': 'Sincronitza ara',
  'storage.sync.running': 'Sincronitzant… {done}/{total}',
  'storage.sync.counts': '{copied} copiats · {skipped} omesos · {failed} fallits',
  'storage.sync.cancel': 'Cancel·la la sincronització',
  'storage.sync.done': 'Sincronització finalitzada: {copied} copiats, {deleted} suprimits, {failed} fallits',
  'storage.sync.cancelled': 'Sincronització cancel·lada',
  'storage.sync.error': 'Ha fallat la sincronització: {error}',
  'storage.sync.prompt': "Els objectes existents encara no s'han replicat — vols sincronitzar ara?",
  'storage.sync.dismiss': 'Descarta',
  'storage.usage.line': '{objects} objectes · {size}',
  'storage.usage.computed': 'Ús calculat {age}',
  'storage.usage.never': 'Ús encara no calculat',
  'storage.usage.refresh': 'Actualitza',
  'storage.usage.compute': 'Calcula ara',
  'storage.usage.legacyNote': 'inclou la biblioteca de fotos antiga',

  // Category migration (copy → flip → delta sweep)
  'storage.migrate.promptTitle': 'Vols moure els objectes existents al nou backend?',
  'storage.migrate.promptLine': '{category}: {objects} objectes ({size}) de {from} a {to}',
  'storage.migrate.promptLineUnknown': "{category}: mida desconeguda (encara no s'ha calculat l'ús) de {from} a {to}",
  'storage.migrate.move': 'Mou els objectes existents',
  'storage.migrate.routeOnly': 'Només enruta les escriptures noves',
  'storage.migrate.running': 'Movent {category}… {done}/{total}',
  'storage.migrate.done': 'Trasllat finalitzat: {copied} copiats, {skipped} omesos',
  'storage.migrate.doneFailures': "{failed} han fallat — aquests objectes no s'han copiat al nou backend",
  'storage.migrate.failed': "Ha fallat el trasllat: {error} — la categoria no s'ha canviat",
  'storage.migrate.cancelled': "Trasllat cancel·lat — no s'ha canviat res",
  'storage.migrate.reclaimable': "{objects} objectes ({size}) romanen a {from} — recupera'ls manualment",
  'storage.migrate.cancel': 'Cancel·la el trasllat',
  'storage.migrate.promptCancel': 'Cancel·la',
  'storage.migrate.queued': 'En cua: {categories}',
  'storage.migrate.queueDropped':
    "No s'ha pogut iniciar el trasllat següent — s'ha buidat la cua restant: {categories}",
};
export default storage;
