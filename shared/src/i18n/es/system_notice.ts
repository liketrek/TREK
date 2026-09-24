import type { TranslationStrings } from '../types';

const system_notice: TranslationStrings = {
  'system_notice.welcome_v1.title': 'Bienvenido a TREK',
  'system_notice.welcome_v1.body':
    'Tu planificador de viajes todo en uno. Crea itinerarios, comparte viajes con amigos y mantente organizado, online o sin conexión.',
  'system_notice.welcome_v1.cta_label': 'Planificar un viaje',
  'system_notice.welcome_v1.hero_alt': 'Destino de viaje pintoresco con la interfaz de TREK',
  'system_notice.welcome_v1.highlight_plan': 'Itinerarios día a día para cualquier viaje',
  'system_notice.welcome_v1.highlight_share': 'Colabora con tus compañeros de viaje',
  'system_notice.welcome_v1.highlight_offline': 'Funciona sin conexión en móvil',
  'system_notice.dev_test_modal.title': '[Dev] Test notice',
  'system_notice.dev_test_modal.body': 'This is a dev-only test notice.',
  'system_notice.thank_you_support.title': 'Gracias por usar TREK',
  'system_notice.thank_you_support.body':
    'Un pequeño agradecimiento por instalar TREK — de verdad significa mucho para mí.\n\nSoy un desarrollador independiente y construyo TREK en mi tiempo libre. Empezó como una pequeña herramienta solo para mis propios viajes, y sinceramente me deja sin palabras todo el apoyo y el interés de la comunidad desde entonces. TREK está hecho con mucho cariño de mi parte — pero también gracias a los muchos colaboradores externos increíbles que han ayudado a darle forma.\n\n**TREK es open source y completamente gratuito — y seguirá siéndolo para siempre. Sin planes de pago, sin suscripciones, sin trampa. Te lo prometo.**\n\nSi TREK te resulta útil y quieres apoyar su desarrollo, un pequeño café me ayuda de verdad a seguir construyendo — sin ninguna presión, pero cada taza mantiene vivas las noches en vela.\n\nGracias por estar aquí.\n\n— Maurice',
  'system_notice.thank_you_support.highlight_opensource': '100% open source en GitHub',
  'system_notice.thank_you_support.highlight_free': 'Gratis para siempre — nunca habrá planes de pago',
  'system_notice.thank_you_support.highlight_community': 'Construido junto a la comunidad',
  'system_notice.thank_you_support.cta_bmc': 'Buy Me a Coffee',
  'system_notice.thank_you_support.cta_kofi': 'Apóyame en Ko-fi',
  'system_notice.pager.prev': 'Aviso anterior',
  'system_notice.pager.next': 'Siguiente aviso',
  'system_notice.pager.counter': '{current} / {total}',
  'system_notice.pager.goto': 'Ir al aviso {n}',
  'system_notice.pager.position': 'Aviso {current} de {total}',
  'system_notice.v3_photos.title': 'Las fotos se han movido en 3.0',
  'system_notice.v3_photos.body':
    '**Fotos** en el Planificador de Viajes han sido eliminadas. Tus fotos están a salvo — TREK nunca modificó tu biblioteca de Immich o Synology.\n\nLas fotos ahora viven en el addon **Journey**. Journey es opcional — si aún no está disponible, pide a tu admin que lo active en Admin → Complementos.',
  'system_notice.v3_journey.title': 'Conoce Journey — diario de viaje',
  'system_notice.v3_journey.body':
    'Documenta tus viajes como historias enriquecidas con cronologías, galerías de fotos y mapas interactivos.',
  'system_notice.v3_journey.cta_label': 'Abrir Journey',
  'system_notice.v3_journey.highlight_timeline': 'Cronología y galería por día',
  'system_notice.v3_journey.highlight_photos': 'Importar desde Immich o Synology',
  'system_notice.v3_journey.highlight_share': 'Compartir públicamente — sin inicio de sesión',
  'system_notice.v3_journey.highlight_export': 'Exportar como libro de fotos PDF',
  'system_notice.v3_features.title': 'Más novedades en 3.0',
  'system_notice.v3_features.body': 'Otras cosas que vale la pena conocer de esta versión.',
  'system_notice.v3_features.highlight_dashboard': 'Rediseño del panel mobile-first',
  'system_notice.v3_features.highlight_offline': 'Modo sin conexión completo como PWA',
  'system_notice.v3_features.highlight_search': 'Autocompletado de lugares en tiempo real',
  'system_notice.v3_features.highlight_import': 'Importar lugares desde archivos KMZ/KML',
  'system_notice.v3_mcp.title': 'MCP: actualización OAuth 2.1',
  'system_notice.v3_mcp.body':
    'La integración MCP ha sido completamente renovada. OAuth 2.1 es ahora el método de autenticación recomendado. Los tokens estáticos (trek_…) están obsoletos y se eliminarán en una versión futura.',
  'system_notice.v3_mcp.highlight_oauth': 'OAuth 2.1 recomendado (mcp-remote)',
  'system_notice.v3_mcp.highlight_scopes': '24 ámbitos de permisos granulares',
  'system_notice.v3_mcp.highlight_deprecated': 'Tokens estáticos trek_ obsoletos',
  'system_notice.v3_mcp.highlight_tools': 'Herramientas y prompts ampliados',
  'system_notice.v3_thankyou.title': 'Una nota personal de mi parte',
  'system_notice.v3_thankyou.body':
    'Antes de seguir — quiero tomarme un momento.\n\nTREK empezó como un proyecto personal que construí para mis propios viajes. Nunca imaginé que crecería hasta convertirse en algo en lo que 4.000 de vosotros confían para planificar sus aventuras. Cada estrella, cada issue, cada solicitud de funcionalidad — los leo todos, y son lo que me mantiene en pie durante las noches largas entre un trabajo a jornada completa y la universidad.\n\nQuiero que sepáis: TREK siempre será open source, siempre self-hosted, siempre vuestro. Sin rastreo, sin suscripciones, sin letra pequeña. Solo una herramienta hecha por alguien que ama viajar tanto como vosotros.\n\nUn agradecimiento especial a [jubnl](https://github.com/jubnl) — te has convertido en un colaborador increíble. Mucho de lo que hace grande la versión 3.0 lleva tu huella. Gracias por creer en este proyecto cuando todavía era un borrador.\n\nY a cada uno de vosotros que reportó un bug, tradujo un texto, compartió TREK con un amigo o simplemente lo usó para planificar un viaje — **gracias**. Vosotros sois la razón de que esto exista.\n\nPor muchas más aventuras juntos.\n\n— Maurice\n\n---\n\n[Únete a la comunidad en Discord](https://discord.gg/7Q6M6jDwzf)\n\nSi TREK mejora tus viajes, un [pequeño café](https://ko-fi.com/mauriceboe) siempre mantiene las luces encendidas.',
  'system_notice.v3014_whitespace_collision.title': 'Acción requerida: conflicto de cuenta de usuario',
  'system_notice.v3014_whitespace_collision.body':
    'La actualización 3.0.14 detectó uno o más conflictos de nombre de usuario o correo electrónico causados por espacios en blanco al inicio o al final de los valores almacenados. Las cuentas afectadas se renombraron automáticamente. Revisa los registros del servidor en busca de líneas que empiecen por **[migration] WHITESPACE COLLISION** para identificar qué cuentas necesitan revisión.',
  // The release modal. One stable set of keys: each big release swaps the copy in place.
  'system_notice.release_notes.eyebrow': 'Actualización instalada',
  'system_notice.release_notes.headline': 'Cuatro cosas que TREK ahora hace por sí mismo.',
  'system_notice.release_notes.intro': 'Su propia API de lugares, viajes por carretera planificados de principio a fin, tu historial de ubicaciones en tus manos, y tus documentos sincronizados.',
  'system_notice.release_notes.features_label': 'Los protagonistas',
  'system_notice.release_notes.features_aside': 'Y eso no es todo',
  'system_notice.release_notes.feature_places_title': 'TREK Places API',
  'system_notice.release_notes.feature_places_body': 'El primer planificador de viajes de código abierto con su propia API de lugares. 73,6 millones de lugares, sin clave, sin cuota.',
  'system_notice.release_notes.feature_roadtrip_title': 'Addon Roadtrip',
  'system_notice.release_notes.feature_roadtrip_body': 'Planifica el trayecto por sí solo: ruta, distancia, horas y paradas. Apagado hasta que un admin lo active.',
  'system_notice.release_notes.feature_dawarich_title': 'Integración con Dawarich',
  'system_notice.release_notes.feature_dawarich_body': 'La alternativa autoalojada a Google Timeline, ahora legible desde TREK. TREK lee, y solo lee.',
  'system_notice.release_notes.footnote': 'Y una larga lista de cambios más pequeños en el resto de TREK.',
  'system_notice.release_notes.notes_label': 'Notas de versión',
  'system_notice.release_notes.note_eyebrow': 'Una nota del desarrollador',
  'system_notice.release_notes.note_title': 'Sois la razón por la que sigo construyendo TREK.',
  'system_notice.release_notes.note_body':
    'TREK nació como una pequeña herramienta para mis propios viajes, escrita después del trabajo porque quería una forma mejor de planificarlos. En realidad, nunca ha dejado de crecer. Casi todo lo he construido a altas horas de la noche, los fines de semana, en trenes, junto a un trabajo a jornada completa, y más de una vez me pregunté en silencio si alguien, en algún lugar, llegaría a abrirlo.',
  'system_notice.release_notes.promise_label': 'La promesa',
  'system_notice.release_notes.promise_lead': 'TREK seguirá siendo gratis, para siempre.',
  'system_notice.release_notes.promise_text':
    'Cada función, cada actualización, para todo el mundo. Sin planes de pago, sin suscripciones, sin trampa.',
  'system_notice.release_notes.note_body_after':
    'Y entonces lo abristeis. En pocos meses erais miles: estrellas, informes de errores, traducciones a idiomas que no hablo, pull requests de gente a la que nunca he conocido. Lo primero que hago cada mañana sigue siendo mirar el repositorio, y todavía me cuesta creérmelo.',
  'system_notice.release_notes.note_closing': 'Gracias por estar aquí. Un abrazo, Maurice.',
  'system_notice.release_notes.support_lead':
    'TREK es gratis y siempre lo será, pero los servidores, los dominios y tantas noches en vela no lo son.',
  'system_notice.release_notes.support_text':
    'Si se ha ganado un sitio en tus viajes, invítame a un café y ayuda a que llegue la próxima versión.',
  'system_notice.release_notes.cta_bmc': 'Buy me a coffee',
  'system_notice.release_notes.cta_kofi': 'Apóyame en Ko-fi',
  'system_notice.release_notes.feature_docsync_title': 'Sincronización de documentos',
  'system_notice.release_notes.feature_docsync_body': 'Paperless-ngx, Papra, Nextcloud, OpenCloud y Synology Drive. Los documentos de un viaje fluyen en ambos sentidos con el almacén que ya usas.',
};
export default system_notice;
