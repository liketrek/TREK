import type { TranslationStrings } from '../types';

const docsync: TranslationStrings = {
  'docsync.title': 'Sincronització de documents',
  'docsync.noProviders': 'No hi ha cap proveïdor de documents disponible',
  'docsync.noProvidersHint': 'Un administrador de la instància els activa a Administració, Complements, Documents.',
  'docsync.addProvider': 'Connecta un proveïdor',
  'docsync.test': 'Prova la connexió',
  'docsync.connect.optional': 'Opcional',
  'docsync.connected': 'Connectat',
  'docsync.chooseFolder': 'Tria una carpeta',
  'docsync.noFolders': 'Encara no s’ha trobat res en aquesta instància.',
  'docsync.newFolderPlaceholder': 'Nom de la carpeta nova',
  'docsync.syncNow': 'Sincronitza ara',
  'docsync.unlink': 'Desconnecta',
  'docsync.confirmUnlink':
    'Els documents es queden a TREK i al teu gestor. Només desapareix l’aparellament entre els dos.',
  'docsync.syncEnabled': 'Sincronitza automàticament',
  'docsync.deletePolicy': 'Quan s’elimina un document',
  'docsync.deleteUnlink': 'Conserva les dues còpies',
  'docsync.deleteTrash': 'Mou a la paperera',
  'docsync.conflictPolicy': 'Quan han canviat les dues bandes',
  'docsync.onConflict.manual': "Pregunta-m'ho",
  'docsync.onConflict.trek_wins': 'Conserva la còpia del TREK',
  'docsync.onConflict.provider_wins': 'Conserva la còpia del magatzem',
  'docsync.webhookHint':
    'Enganxa aquesta URL al teu proveïdor perquè els canvis arribin de seguida. Sense això, TREK ho comprova cada cert temps.',

  // Camps del formulari de connexió. Les claus reflecteixen la columna `label` de
  // document_provider_fields, que desa un sufix de clau i no pas el text.
  'docsync.providerUrl': 'Adreça',
  'docsync.providerApiToken': 'Token API',
  'docsync.providerApiKey': 'Clau API',
  'docsync.providerAppPassword': 'Contrasenya d’aplicació',
  'docsync.providerAppToken': 'Token d’aplicació',
  'docsync.providerUsername': 'Nom d’usuari',
  'docsync.providerPassword': 'Contrasenya',
  'docsync.providerOrganization': 'ID d’organització',
  'docsync.providerBasePath': 'Carpeta base',
  'docsync.providerOTP': 'Codi de doble factor',
  'docsync.allowInsecureTls': 'Accepta un certificat autosignat',

  'docsync.hintPaperlessToken': 'Crea’l a El meu perfil, dins de Paperless. Té tots els drets d’aquell compte.',
  'docsync.hintPapraKey':
    'Crea-la a Claus API, dins de Papra. Les claus de Papra sempre arriben a totes les organitzacions a què pertanys.',
  'docsync.hintPapraOrg': 'L’id org_… de la barra d’adreces de Papra.',
  'docsync.hintNextcloudLogin': 'El teu nom d’usuari de Nextcloud, no pas la teva adreça electrònica.',
  'docsync.hintNextcloudAppPassword':
    'Configuració, Seguretat, Crea una contrasenya d’aplicació nova. Mai la contrasenya del compte.',
  'docsync.hintOpenCloudToken': 'Es crea als tokens d’aplicació d’OpenCloud.',
  'docsync.hintBasePath': 'On busca TREK les carpetes dels viatges. Per defecte, /TREK.',
  'docsync.hintSynologyUrl': 'Inclou-hi el port, per exemple https://nas.example.com:5001',
  'docsync.hintSynologyUser': 'Millor un compte DSM dedicat amb accés només a aquesta carpeta compartida.',
  'docsync.hintSynologyOtp': 'Només cal un cop, si el compte fa servir autenticació de doble factor.',

  'docsync.linkState.never': 'Encara no s’ha sincronitzat',
  'docsync.linkState.ok': 'Al dia',
  'docsync.linkState.partial': 'Sincronitzat en part',
  'docsync.linkState.failed': 'Ha fallat',
  'docsync.linkState.needs_reauth': 'Torna a iniciar la sessió',
  'docsync.linkState.scope_lost': 'La carpeta ha desaparegut',
  'docsync.linkState.orphaned': 'El propietari ha deixat el viatge',

  'docsync.state.pending': 'En espera',
  'docsync.state.synced': 'Sincronitzat',
  'docsync.state.conflict': 'Conflicte',
  'docsync.state.rejected_type': 'Tipus no permès',
  'docsync.state.too_large': 'Massa gran',
  'docsync.state.error': 'Error',
  'docsync.state.remote_missing': 'No hi és, al proveïdor',
  'docsync.state.local_deleted': 'Eliminat a TREK',
  'docsync.state.scope_drift': 'Ha sortit de la carpeta',

  'docsync.conflict.resolve': "Resol {count}",

  'docsync.conflict.title': 'Han canviat totes dues còpies',
  'docsync.conflict.keepTrek': 'Conserva la versió de TREK',
  'docsync.conflict.keepProvider': 'Conserva la versió del proveïdor',
  'docsync.conflict.keepBoth': 'Conserva-les totes dues',

  // Els motius de fallada viatgen com a codis, mai com a text de l’altra banda:
  // un proveïdor respon en anglès, o amb la pàgina de login HTML d’un proxy, i
  // cap de les dues coses no hi pinta res.
  'docsync.error.unreachable': 'No s’ha pogut contactar amb el proveïdor.',
  'docsync.error.tls_untrusted':
    'El certificat s’ha rebutjat. Permet els certificats autosignats si confies en aquesta instància.',
  'docsync.error.unauthorized': 'S’han rebutjat les credencials.',
  'docsync.error.forbidden': 'Aquest compte no té permís per fer-ho.',
  'docsync.error.not_found': 'No s’ha trobat al proveïdor.',
  'docsync.error.scope_missing': 'La carpeta connectada ja no existeix.',
  'docsync.error.rate_limited': 'El proveïdor ens està limitant el ritme. TREK ho tornarà a provar més tard.',
  'docsync.error.too_large': 'El fitxer és més gran del que accepta el proveïdor.',
  'docsync.error.unsupported_type': 'El proveïdor no accepta aquest tipus de fitxer.',
  'docsync.error.quota_exceeded': 'El proveïdor s’ha quedat sense espai.',
  'docsync.error.conflict': 'El document ha canviat a totes dues bandes.',
  'docsync.error.checksum_mismatch': 'La transferència no ha arribat intacta.',
  'docsync.error.provider_error': 'El proveïdor ha informat d’un error.',
  'docsync.error.timeout': 'El proveïdor ha trigat massa a respondre.',
  'docsync.error.ssrf_blocked': 'Aquesta adreça no està permesa.',
  'docsync.error.mass_delete_guard':
    'Han desaparegut molts documents de cop, així que no s’ha canviat res. Comprova que la carpeta encara estigui muntada.',
  'docsync.error.unknown': 'Alguna cosa ha anat malament.',

  // ── El diàleg ──────────────────────────────────────────────────────────────
  'docsync.sidebar.connected': 'Aquest viatge',
  'docsync.addAnother': 'Afegeix-ne un altre',
  'docsync.syncing': 'Sincronitzant',
  'docsync.card.pickFolder': 'Connectat, tria una carpeta',

  'docsync.empty.title': 'Encara no hi ha res connectat',
  'docsync.empty.hintOwner':
    'Tria un gestor a l’esquerra. TREK en guarda sempre una còpia pròpia, així que no es perd res si desapareix.',
  'docsync.empty.hintMember': 'Això ho configura el propietari del viatge. Els documents es queden a TREK igualment.',

  // Com arxiva les coses cada producte. Es mostra abans que ningú connecti res,
  // perquè és el que demanarà la pantalla següent.
  'docsync.model.paperless': 'Arxiva per etiqueta',
  'docsync.model.papra': 'Arxiva per etiqueta, dins d’una organització',
  'docsync.model.nextcloud': 'Arxiva en una carpeta',
  'docsync.model.opencloud': 'Arxiva en un espai',
  'docsync.model.synologydrive': 'Arxiva en una carpeta del NAS',

  // ── La barra de flux ───────────────────────────────────────────────────────
  'docsync.flow.trek': 'TREK',
  'docsync.flow.toProvider': 'Cap al gestor',
  'docsync.flow.toTrek': 'Des del gestor',
  'docsync.flow.documents': 'documents',
  'docsync.flow.summary.both': 'Els documents van en tots dos sentits.',
  'docsync.flow.summary.pull': 'Els documents només entren.',
  'docsync.flow.summary.push': 'Els documents només surten.',
  'docsync.flow.summaryEditable.both': 'Van en tots dos sentits. Toca un carril per aturar-lo.',
  'docsync.flow.summaryEditable.pull': 'Només entren. Toca l’altre carril per enviar-ne també.',
  'docsync.flow.summaryEditable.push': 'Només surten. Toca l’altre carril per rebre’n també.',

  // ── Un aparellament ────────────────────────────────────────────────────────
  'docsync.binding.settings': 'Configuració',
  'docsync.binding.folder': 'Carpeta',
  'docsync.binding.lastRun': 'Última execució',
  'docsync.binding.autoOff': 'En pausa',
  'docsync.binding.neverRun': 'encara no s’ha executat',
  'docsync.binding.deleteHint': 'Què passa amb la còpia de l’altra banda.',
  'docsync.binding.conflictHint': "Quina còpia es manté quan un document s'ha editat als dos llocs.",
  'docsync.binding.autoHint': 'Comprova si hi ha canvis en segon pla.',
  'docsync.binding.webhookTitle': 'Actualitzacions instantànies',
  'docsync.binding.copy': 'Copia',
  'docsync.binding.copied': 'Copiat',

  // ── La connexió ────────────────────────────────────────────────────────────
  'docsync.connect.submit': 'Connecta',
  'docsync.connect.testing': 'Provant de contactar-hi',
  'docsync.connect.okAs': 'Contactat, sessió iniciada com a {account}',
  'docsync.connect.insecureHint': 'Per a una instància de la teva xarxa amb un certificat autosignat.',
  'docsync.connect.about.paperless':
    'TREK arxiva aquest viatge sota una etiqueta pròpia i no toca mai la resta del teu arxiu.',
  'docsync.connect.about.papra':
    'Tria l’organització a què pertany aquest viatge. TREK l’arxiva sota una etiqueta pròpia a dins.',
  'docsync.connect.about.nextcloud':
    'Fes servir una contrasenya d’aplicació, no la del compte: funciona amb el doble factor i la pots revocar per separat.',
  'docsync.connect.about.opencloud': 'TREK té un espai propi per a aquest viatge, separat de tota la resta.',
  'docsync.connect.about.synologydrive':
    'Millor un compte DSM que només arribi a la carpeta compartida que ha de fer servir aquest viatge.',

  // ── Tria del contenidor ────────────────────────────────────────────────────
  'docsync.scope.title': 'On ha d’anar aquest viatge dins de {provider}?',
  'docsync.scope.intro': 'Només se sincronitza el que hi ha aquí dins. La resta del teu gestor es queda fora de TREK.',
  'docsync.scope.createTitle': 'Crea’n un de nou',
  'docsync.scope.createAction': 'Crea',
  'docsync.scope.pickTitle': 'O fes servir un que ja tinguis',
  'docsync.scope.search': 'Cerca',
  'docsync.scope.noMatch': 'No hi coincideix res.',

  // ── Coses que ha de decidir una persona ────────────────────────────────────
  'docsync.issues.title': 'Cal revisar-ho',
  'docsync.issues.conflict': 'Ha canviat als dos llocs. Tria quina còpia vols conservar.',
  'docsync.issues.remote_missing': 'Ha desaparegut del gestor. La còpia de TREK encara hi és.',
  'docsync.issues.rejected_type': 'Aquest tipus de fitxer no s’admet aquí.',
  'docsync.issues.too_large': 'Més gran que el límit.',
  'docsync.issues.error': 'La transferència no s’ha completat.',

  'docsync.error.unknown_provider': 'Aquest proveïdor no està disponible en aquesta instància.',
  'docsync.error.provider_disabled': 'En pausa: un administrador ha desactivat aquest proveïdor. La sincronització es reprèn quan es torni a activar.',
  'docsync.binding.reconnect': 'Torna a connectar',
};

export default docsync;
