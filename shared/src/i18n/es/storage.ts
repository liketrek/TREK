import type { TranslationStrings } from '../types';

const storage: TranslationStrings = {
  'storage.field.root': 'Directorio raíz',
  'storage.help.root': 'Ruta absoluta en el servidor donde este backend almacena sus objetos.',
  'storage.field.endpoint': 'URL del endpoint',
  'storage.help.endpoint':
    'URL base del servicio compatible con S3, p. ej. https://s3.example.com o http://127.0.0.1:9000.',
  'storage.field.bucket': 'Bucket',
  'storage.field.accessKeyId': 'ID de clave de acceso',
  'storage.field.secretAccessKey': 'Clave de acceso secreta',
  'storage.field.region': 'Región',
  'storage.help.region': 'Mantén el valor predeterminado a menos que tu proveedor requiera una región específica.',
  'storage.field.keyPrefix': 'Prefijo de clave',
  'storage.help.keyPrefix': 'Prefijo opcional añadido a cada clave de objeto, p. ej. trek/prod.',
  'storage.field.retries': 'Reintentos',
  'storage.field.timeoutMs': 'Tiempo de espera (ms)',
  'storage.field.primary': 'Backend principal',
  'storage.field.replicas': 'Réplicas',
  'storage.title': 'Almacenamiento',
  'storage.description':
    'Dónde guarda TREK los archivos, fotos y copias de seguridad subidos. Nada cambia hasta que guardes.',
  'storage.loading': 'Cargando…',
  'storage.saved': 'Configuración de almacenamiento guardada',
  'storage.save': 'Guardar cambios',
  'storage.unsaved': 'Cambios sin guardar',
  'storage.saveConflict':
    'La configuración de almacenamiento cambió desde que la cargaste, así que tus cambios no se guardaron. Descártalos y recarga la configuración guardada para empezar de nuevo.',
  'storage.discardAndReload': 'Descartar mis cambios y recargar',
  'storage.configError.banner':
    'No se pudieron cargar los ajustes de almacenamiento guardados — guardar los reemplazará: {error}',
  'storage.backends.title': 'Backends',
  'storage.backends.add': 'Añadir backend',
  'storage.backends.usedBy': 'Usado por: {categories}',
  'storage.backends.unused': 'No asignado a ninguna categoría',
  'storage.backends.envReadOnly': 'Definido por una variable de entorno — solo lectura',
  'storage.source.built-in': 'Integrado',
  'storage.source.env': 'Entorno',
  'storage.source.settings': 'Configuración',
  'storage.type.local': 'Local',
  'storage.type.s3': 'S3',
  'storage.type.mirror': 'Espejo',
  'storage.actions.test': 'Probar',
  'storage.actions.edit': 'Editar',
  'storage.actions.remove': 'Quitar',
  'storage.test.running': 'Probando…',
  'storage.test.ok': 'Conexión correcta',
  'storage.test.failed': 'Prueba fallida',
  'storage.remove.title': 'Quitar backend',
  'storage.remove.body':
    '¿Quitar {name} de la configuración? El servidor rechaza el guardado si algo todavía depende de él.',
  'storage.remove.stillAssigned': 'Aún asignado a: {categories}',
  'storage.form.addTitle': 'Añadir backend',
  'storage.form.editTitle': 'Editar backend',
  'storage.form.name': 'Nombre',
  'storage.form.type': 'Tipo',
  'storage.form.apply': 'Aplicar',
  'storage.form.cancel': 'Cancelar',
  'storage.form.duplicateName': 'Ya existe un backend llamado {name}',
  'storage.categories.title': 'Categorías',
  'storage.categories.default': 'predeterminada',
  'storage.categories.reassignWarning':
    'Los objetos existentes no se mueven: los nuevos objetos van al backend recién asignado, los antiguos permanecen donde están.',
  'storage.category.files': 'Documentos del viaje',
  'storage.category.journey': 'Fotos de la travesía',
  'storage.category.covers': 'Imágenes de portada',
  'storage.category.avatars': 'Fotos de perfil',
  'storage.category.places': 'Imágenes de lugares',
  'storage.category.photos-google': 'Caché de fotos de Google',
  'storage.category.photos-trek': 'Caché de fotos de TREK',
  'storage.category.backups': 'Copias de seguridad',

  // What each category stores — rendered under the label in the category map.
  'storage.categoryDesc.files':
    'Archivos adjuntos subidos a los viajes — billetes, PDF, confirmaciones de reserva y archivos compartidos en el chat del viaje.',
  'storage.categoryDesc.journey': 'Fotos y miniaturas adjuntas a las entradas de la travesía.',
  'storage.categoryDesc.covers':
    'Imágenes de portada de viajes y colecciones, incluidas las portadas obtenidas de Unsplash.',
  'storage.categoryDesc.avatars': 'Fotos de perfil de las cuentas de usuario.',
  'storage.categoryDesc.places': 'Imágenes adjuntas a lugares y lugares de colecciones — subidas o importadas.',
  'storage.categoryDesc.photos-google':
    'Copias en caché de fotos de Google Places — se pueden volver a obtener, es seguro perderlas.',
  'storage.categoryDesc.photos-trek':
    'Fotos en caché del servicio de fotos de TREK usado por Fotos (Memories) — se pueden volver a obtener, es seguro perderlas.',
  'storage.categoryDesc.backups':
    'Archivos de copia de seguridad del servidor creados por el panel de Copias de seguridad o su programación.',
  'storage.health.title': 'Estado',
  'storage.health.allClear': 'No se registraron fallos de réplica.',
  'storage.health.seedFile':
    'Hay un archivo semilla storage-config.json presente pero ignorado — ya existen filas de configuración. Gestiona el almacenamiento aquí.',
  'storage.health.failureLine': '{op} de {key} en {backend} falló: {error}',

  // Replicas-on-primary mirror UX (2026-08-20 spec)
  'storage.mirror.targets': 'Destinos del espejo',
  'storage.mirror.targetsHelp': 'Cada escritura en este backend también se copia a cada destino seleccionado.',
  'storage.mirror.latencyNote':
    'Las réplicas se escriben una tras otra durante cada subida — un destino lento o inaccesible ralentiza cada subida de cada categoría en este backend.',
  'storage.mirror.mirroredTo': 'Reflejado en: {targets}',
  'storage.mirror.replicaOf': 'Réplica de: {primaries}',
  'storage.mirror.cacheWarning':
    'No recomendado: esta categoría contiene contenido que se puede volver a obtener — replicarlo suele ser un desperdicio.',
  'storage.mirror.degenerate.duplicate-mirror':
    'Un segundo espejo envuelve {primary} — el panel solo gestiona el primero; elimina este para gestionar el espejado desde {primary}.',
  'storage.mirror.degenerate.env-primary':
    'Envuelve un backend definido por una variable de entorno — no editable aquí.',
  'storage.mirror.degenerate.missing-primary': 'Hace referencia a un backend que ya no existe.',
  'storage.remove.usedAsReplicaBy': 'Usado como réplica por: {primaries}',

  // Backfill + usage (backfill/stats/notifications spec)
  'storage.sync.now': 'Sincronizar ahora',
  'storage.sync.running': 'Sincronizando… {done}/{total}',
  'storage.sync.counts': '{copied} copiados · {skipped} omitidos · {failed} fallidos',
  'storage.sync.cancel': 'Cancelar sincronización',
  'storage.sync.done': 'Sincronización finalizada: {copied} copiados, {deleted} eliminados, {failed} fallidos',
  'storage.sync.cancelled': 'Sincronización cancelada',
  'storage.sync.error': 'Error en la sincronización: {error}',
  'storage.sync.prompt': 'Los objetos existentes aún no se han replicado — ¿sincronizar ahora?',
  'storage.sync.dismiss': 'Descartar',
  'storage.usage.line': '{objects} objetos · {size}',
  'storage.usage.computed': 'Uso calculado {age}',
  'storage.usage.never': 'Uso aún no calculado',
  'storage.usage.refresh': 'Actualizar',
  'storage.usage.compute': 'Calcular ahora',
  'storage.usage.legacyNote': 'incluye la biblioteca de fotos antigua',

  // Category migration (copy → flip → delta sweep)
  'storage.migrate.promptTitle': '¿Mover los objetos existentes al nuevo backend?',
  'storage.migrate.promptLine': '{category}: {objects} objetos ({size}) de {from} a {to}',
  'storage.migrate.promptLineUnknown': '{category}: tamaño desconocido (uso aún no calculado) de {from} a {to}',
  'storage.migrate.move': 'Mover objetos existentes',
  'storage.migrate.routeOnly': 'Solo enrutar las escrituras nuevas',
  'storage.migrate.running': 'Moviendo {category}… {done}/{total}',
  'storage.migrate.done': 'Movimiento finalizado: {copied} copiados, {skipped} omitidos',
  'storage.migrate.doneFailures': '{failed} fallaron — esos objetos no se copiaron al nuevo backend',
  'storage.migrate.failed': 'Error al mover: {error} — la categoría no se cambió',
  'storage.migrate.cancelled': 'Movimiento cancelado — no se cambió nada',
  'storage.migrate.reclaimable': '{objects} objetos ({size}) permanecen en {from} — recupéralos manualmente',
  'storage.migrate.cancel': 'Cancelar movimiento',
  'storage.migrate.promptCancel': 'Cancelar',
  'storage.migrate.queued': 'En cola: {categories}',
  'storage.migrate.queueDropped': 'No se pudo iniciar la siguiente migración — se vació la cola restante: {categories}',
};
export default storage;
