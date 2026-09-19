import type { TranslationStrings } from '../types';

const docsync: TranslationStrings = {
  'docsync.title': 'Sincronización de documentos',
  'docsync.noProviders': 'No hay proveedores de documentos disponibles',
  'docsync.noProvidersHint': 'Un administrador de la instancia los activa en Admin, Complementos, Documentos.',
  'docsync.addProvider': 'Conectar un proveedor',
  'docsync.test': 'Probar conexión',
  'docsync.connect.optional': 'Opcional',
  'docsync.connected': 'Conectado',
  'docsync.chooseFolder': 'Elegir carpeta',
  'docsync.noFolders': 'Todavía no se ha encontrado nada en esta instancia.',
  'docsync.newFolderPlaceholder': 'Nombre de la nueva carpeta',
  'docsync.syncNow': 'Sincronizar ahora',
  'docsync.unlink': 'Desconectar',
  'docsync.confirmUnlink': 'Los documentos siguen en TREK y en el gestor. Solo desaparece el vínculo entre ambos.',
  'docsync.syncEnabled': 'Sincronizar automáticamente',
  'docsync.deletePolicy': 'Cuando se elimina un documento',
  'docsync.deleteUnlink': 'Conservar ambas copias',
  'docsync.deleteTrash': 'Mover a la papelera',
  'docsync.conflictPolicy': 'Cuando ambos lados cambiaron',
  'docsync.onConflict.manual': 'Preguntarme',
  'docsync.onConflict.trek_wins': 'Conservar la copia de TREK',
  'docsync.onConflict.provider_wins': 'Conservar la copia del almacén',
  'docsync.webhookHint':
    'Pega esta URL en tu proveedor para que los cambios lleguen de inmediato. Sin ella, TREK comprueba cada cierto tiempo.',

  // Campos del formulario de conexión. Las claves reflejan la columna `label` de
  // document_provider_fields, que guarda un sufijo de clave en lugar de texto.
  'docsync.providerUrl': 'Dirección',
  'docsync.providerApiToken': 'Token de API',
  'docsync.providerApiKey': 'Clave de API',
  'docsync.providerAppPassword': 'Contraseña de aplicación',
  'docsync.providerAppToken': 'Token de aplicación',
  'docsync.providerUsername': 'Nombre de usuario',
  'docsync.providerPassword': 'Contraseña',
  'docsync.providerOrganization': 'ID de organización',
  'docsync.providerBasePath': 'Carpeta base',
  'docsync.providerOTP': 'Código de doble factor',
  'docsync.allowInsecureTls': 'Aceptar un certificado autofirmado',

  'docsync.hintPaperlessToken': 'Créalo en Paperless, en Mi perfil. Tiene todos los permisos de esa cuenta.',
  'docsync.hintPapraKey':
    'Créala en Papra, en Claves de API. Las claves de Papra siempre alcanzan a todas las organizaciones a las que perteneces.',
  'docsync.hintPapraOrg': 'El id org_… que aparece en la barra de direcciones de Papra.',
  'docsync.hintNextcloudLogin': 'Tu nombre de usuario de Nextcloud, no tu dirección de correo.',
  'docsync.hintNextcloudAppPassword':
    'Ajustes, Seguridad, Crear nueva contraseña de aplicación. Nunca la contraseña de tu cuenta.',
  'docsync.hintOpenCloudToken': 'Se crea en OpenCloud, en los tokens de aplicación.',
  'docsync.hintBasePath': 'Donde TREK busca las carpetas de los viajes. Por defecto, /TREK.',
  'docsync.hintSynologyUrl': 'Incluye el puerto, por ejemplo https://nas.example.com:5001',
  'docsync.hintSynologyUser': 'Mejor una cuenta DSM dedicada con acceso solo a esta carpeta compartida.',
  'docsync.hintSynologyOtp': 'Solo hace falta una vez, si la cuenta usa autenticación de doble factor.',

  'docsync.linkState.never': 'Aún sin sincronizar',
  'docsync.linkState.ok': 'Al día',
  'docsync.linkState.partial': 'Sincronizado en parte',
  'docsync.linkState.failed': 'Falló',
  'docsync.linkState.needs_reauth': 'Vuelve a iniciar sesión',
  'docsync.linkState.scope_lost': 'La carpeta ya no está',
  'docsync.linkState.orphaned': 'El propietario dejó el viaje',

  'docsync.state.pending': 'En espera',
  'docsync.state.synced': 'Sincronizado',
  'docsync.state.conflict': 'Conflicto',
  'docsync.state.rejected_type': 'Tipo no permitido',
  'docsync.state.too_large': 'Demasiado grande',
  'docsync.state.error': 'Error',
  'docsync.state.remote_missing': 'Falta en el proveedor',
  'docsync.state.local_deleted': 'Eliminado en TREK',
  'docsync.state.scope_drift': 'Fuera de la carpeta',

  'docsync.conflict.resolve': "Resolver {count}",

  'docsync.conflict.title': 'Las dos copias han cambiado',
  'docsync.conflict.keepTrek': 'Conservar la versión de TREK',
  'docsync.conflict.keepProvider': 'Conservar la versión del proveedor',
  'docsync.conflict.keepBoth': 'Conservar ambas',

  // Los motivos de fallo viajan como códigos, nunca como el texto del proveedor: este
  // responde en inglés, o devuelve la página de inicio de sesión HTML de un proxy, y ninguna
  // de las dos cosas pinta nada aquí.
  'docsync.error.unreachable': 'No se pudo contactar con el proveedor.',
  'docsync.error.tls_untrusted':
    'El certificado fue rechazado. Permite los certificados autofirmados si confías en esta instancia.',
  'docsync.error.unauthorized': 'Las credenciales fueron rechazadas.',
  'docsync.error.forbidden': 'Esta cuenta no tiene permiso para hacerlo.',
  'docsync.error.not_found': 'No se encontró en el proveedor.',
  'docsync.error.scope_missing': 'La carpeta conectada ya no existe.',
  'docsync.error.rate_limited': 'El proveedor está limitando las peticiones. TREK lo intentará más tarde.',
  'docsync.error.too_large': 'El archivo supera el tamaño que acepta el proveedor.',
  'docsync.error.unsupported_type': 'El proveedor no acepta este tipo de archivo.',
  'docsync.error.quota_exceeded': 'El proveedor se ha quedado sin espacio.',
  'docsync.error.conflict': 'El documento cambió en ambos lados.',
  'docsync.error.checksum_mismatch': 'La transferencia no llegó íntegra.',
  'docsync.error.provider_error': 'El proveedor informó de un error.',
  'docsync.error.timeout': 'El proveedor tardó demasiado en responder.',
  'docsync.error.ssrf_blocked': 'Esa dirección no está permitida.',
  'docsync.error.mass_delete_guard':
    'Desaparecieron casi todos los documentos a la vez, así que no se cambió nada. Comprueba que la carpeta siga montada.',
  'docsync.error.unknown': 'Algo salió mal.',

  // ── El diálogo ─────────────────────────────────────────────────────────────
  'docsync.sidebar.connected': 'Este viaje',
  'docsync.addAnother': 'Añadir otro',
  'docsync.syncing': 'Sincronizando',
  'docsync.card.pickFolder': 'Conectado, elige una carpeta',

  'docsync.empty.title': 'Aún no hay nada conectado',
  'docsync.empty.hintOwner':
    'Elige un gestor a la izquierda. TREK guarda su propia copia de todo, así que no se pierde nada si desaparece.',
  'docsync.empty.hintMember':
    'Esto lo configura el propietario del viaje. En ambos casos, los documentos siguen en TREK.',

  // Cómo archiva las cosas cada producto. Se muestra antes de que nadie conecte,
  // porque es lo que pedirá la siguiente pantalla.
  'docsync.model.paperless': 'Archiva por etiqueta',
  'docsync.model.papra': 'Archiva por etiqueta, dentro de una organización',
  'docsync.model.nextcloud': 'Archiva en una carpeta',
  'docsync.model.opencloud': 'Archiva en un espacio',
  'docsync.model.synologydrive': 'Archiva en una carpeta del NAS',

  // ── La barra de flujo ──────────────────────────────────────────────────────
  'docsync.flow.trek': 'TREK',
  'docsync.flow.toProvider': 'Hacia el gestor',
  'docsync.flow.toTrek': 'Desde el gestor',
  'docsync.flow.documents': 'documentos',
  'docsync.flow.summary.both': 'Los documentos van en ambos sentidos.',
  'docsync.flow.summary.pull': 'Los documentos solo entran.',
  'docsync.flow.summary.push': 'Los documentos solo salen.',
  'docsync.flow.summaryEditable.both': 'En ambos sentidos. Toca un carril para detenerlo.',
  'docsync.flow.summaryEditable.pull': 'Solo entran. Toca el otro carril para enviar también.',
  'docsync.flow.summaryEditable.push': 'Solo salen. Toca el otro carril para recibir también.',

  // ── Un vínculo ─────────────────────────────────────────────────────────────
  'docsync.binding.settings': 'Ajustes',
  'docsync.binding.folder': 'Carpeta',
  'docsync.binding.lastRun': 'Última ejecución',
  'docsync.binding.autoOff': 'En pausa',
  'docsync.binding.neverRun': 'aún sin ejecutar',
  'docsync.binding.deleteHint': 'Qué pasa con la copia del otro lado.',
  'docsync.binding.conflictHint': 'Qué copia se queda cuando un documento se editó en los dos sitios.',
  'docsync.binding.autoHint': 'Busca cambios en segundo plano.',
  'docsync.binding.webhookTitle': 'Actualizaciones instantáneas',
  'docsync.binding.copy': 'Copiar',
  'docsync.binding.copied': 'Copiado',

  // ── Conexión ───────────────────────────────────────────────────────────────
  'docsync.connect.submit': 'Conectar',
  'docsync.connect.testing': 'Intentando conectar',
  'docsync.connect.okAs': 'Conectado, sesión iniciada como {account}',
  'docsync.connect.insecureHint': 'Para una instancia de tu propia red con un certificado autofirmado.',
  'docsync.connect.about.paperless': 'TREK archiva este viaje con su propia etiqueta y no toca el resto de tu archivo.',
  'docsync.connect.about.papra':
    'Elige la organización a la que pertenece este viaje. TREK lo archiva dentro con su propia etiqueta.',
  'docsync.connect.about.nextcloud':
    'Usa una contraseña de aplicación, no la de tu cuenta: funciona con el doble factor y puedes revocarla por separado.',
  'docsync.connect.about.opencloud': 'TREK recibe su propio espacio para este viaje, separado de todo lo demás.',
  'docsync.connect.about.synologydrive':
    'Mejor una cuenta DSM que solo llegue a la carpeta compartida que debe usar este viaje.',

  // ── Elegir el contenedor ───────────────────────────────────────────────────
  'docsync.scope.title': '¿Dónde debe guardarse este viaje en {provider}?',
  'docsync.scope.intro':
    'Solo se sincroniza lo que haya aquí dentro. Todo lo demás de tu gestor se queda fuera de TREK.',
  'docsync.scope.createTitle': 'Crear uno nuevo',
  'docsync.scope.createAction': 'Crear',
  'docsync.scope.pickTitle': 'O usa uno que ya tengas',
  'docsync.scope.search': 'Buscar',
  'docsync.scope.noMatch': 'No hay coincidencias.',

  // ── Cosas que alguien tiene que decidir ────────────────────────────────────
  'docsync.issues.title': 'Requiere atención',
  'docsync.issues.conflict': 'Cambió en los dos sitios. Elige cuál conservar.',
  'docsync.issues.remote_missing': 'Ya no está en el gestor. La copia de TREK sigue aquí.',
  'docsync.issues.rejected_type': 'Este tipo de archivo no se permite aquí.',
  'docsync.issues.too_large': 'Supera el límite.',
  'docsync.issues.error': 'La transferencia no se completó.',

  'docsync.error.unknown_provider': 'Este proveedor no está disponible en esta instancia.',
  'docsync.error.provider_disabled': 'En pausa: un administrador ha desactivado este proveedor. La sincronización se reanuda en cuanto vuelva a activarse.',
};

export default docsync;
