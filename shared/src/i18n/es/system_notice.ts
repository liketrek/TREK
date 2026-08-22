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
  // 4.0.0 release modal — the release on the left, the note from the maintainer on the right
  'system_notice.release_400.eyebrow': 'Actualización instalada',
  'system_notice.release_400.tag': 'Versión',
  'system_notice.release_400.headline': 'La mayor versión que TREK ha tenido jamás.',
  'system_notice.release_400.intro':
    'TREK recibe un móvil y un libro. La escribieron diecinueve personas — y con ella se fueron unos ciento cincuenta bugs.',
  'system_notice.release_400.feature_mobile_title': 'TREK en el móvil',
  'system_notice.release_400.feature_mobile_body':
    'Todo por debajo de 768px es ya una interfaz propia — un dock de cristal, sus propios paneles, su propio planificador. Abre TREK en tu móvil.',
  'system_notice.release_400.feature_studio_title': 'TREK Studio',
  'system_notice.release_400.feature_studio_badge': 'Beta',
  'system_notice.release_400.feature_studio_body':
    'El PDF de Journey se convirtió en un diseñador de fotolibros. Maqueta el libro cuando se lo pides y luego se aparta.',
  'system_notice.release_400.feature_vacay_title': 'Vacay aprende el resto',
  'system_notice.release_400.feature_vacay_body':
    'Medios días, días de compensación y flexibles, vacaciones escolares en la rejilla — y un año que no tiene que empezar en enero.',
  'system_notice.release_400.feature_places_title': 'Lugares que se muestran, archivos que salen',
  'system_notice.release_400.feature_places_body':
    'Las fotos y la descripción se rellenan solas antes de guardar un lugar. Y tus archivos ya no tienen que vivir en el disco donde corre TREK.',
  'system_notice.release_400.footnote':
    'Y estas son cuatro. La 4.0.0 trae varios cientos de cambios más, desde Collections y Atlas hasta todo el servidor por debajo.',
  'system_notice.release_400.note_eyebrow': 'Una nota del desarrollador',
  'system_notice.release_400.note_title': 'Gracias por usar TREK.',
  'system_notice.release_400.note_body':
    'TREK empezó como una pequeña herramienta para mis propios viajes, escrita en mi tiempo libre. Y lo sigue siendo: tardes, fines de semana, las horas junto a un trabajo a jornada completa.\n\nDurante un tiempo fui solo yo. Ya no — diecinueve personas sacaron esta versión, y miles de personas llegaron con estrellas, issues, traducciones y pull requests. Estoy agradecido por cada parte.',
  'system_notice.release_400.promise_label': 'La promesa',
  'system_notice.release_400.promise_text':
    'La parte open source de TREK sigue siendo gratis, para siempre. Sin planes de pago, sin suscripciones, sin trampa. Prometido.',
  'system_notice.release_400.note_body_after':
    'La 4.0.0 costó semanas de noches en vela — una app de móvil, un diseñador de libros, una migración del servidor, casi todo escrito entre medianoche y las dos. No es una queja: me encanta hacer esto. Es solo la respuesta honesta a cómo sale una versión así de un proyecto de tiempo libre.',
  'system_notice.release_400.note_closing': 'Gracias por estar aquí.',
  'system_notice.release_400.note_signature': '— Maurice',
  'system_notice.release_400.support_text':
    'El apoyo es lo que mantiene esto en marcha — servidores, dominios y las noches en vela que acaban en versiones como esta. Si TREK vale algo para ti, un café es la forma más directa de que siga.',
  'system_notice.release_400.cta_bmc': 'Buy me a coffee',
  'system_notice.release_400.cta_kofi': 'Apóyame en Ko-fi',
};
export default system_notice;
