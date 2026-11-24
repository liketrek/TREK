import type { TranslationStrings } from '../types';

const system_notice: TranslationStrings = {
  'system_notice.welcome_v1.title': 'Benvingut/da a TREK',
  'system_notice.welcome_v1.body':
    'El teu planificador de viatges tot en un. Crea itineraris, comparteix viatges amb amics i mantén-te organitzat, en línia o fora de línia.',
  'system_notice.welcome_v1.cta_label': 'Planifica un viatge',
  'system_notice.welcome_v1.hero_alt': 'Destí de viatge pintoresc amb la interfície de TREK',
  'system_notice.welcome_v1.highlight_plan': 'Itineraris dia a dia per a qualsevol viatge',
  'system_notice.welcome_v1.highlight_share': 'Col·labora amb els teus companys de viatge',
  'system_notice.welcome_v1.highlight_offline': 'Funciona sense connexió en mòbil',
  'system_notice.dev_test_modal.title': '[Dev] Notificació de prova',
  'system_notice.dev_test_modal.body': 'Això és una notificació de prova només per a desenvolupadors.',
  'system_notice.pager.prev': 'Avís anterior',
  'system_notice.pager.next': 'Avís següent',
  'system_notice.pager.counter': '{current} / {total}',
  'system_notice.pager.goto': "Vés a l'avís {n}",
  'system_notice.pager.position': 'Avís {current} de {total}',
  'system_notice.v3_photos.title': "Les fotos s'han mogut a la versió 3.0",
  'system_notice.v3_photos.body':
    "Les **Fotos** al Planificador de Viatges han estat eliminades. Les teves fotos estan segures — TREK mai va modificar la teva biblioteca d'Immich o Synology.\n\nLes fotos ara viuen al complement **Journey**. Journey és opcional — si encara no està disponible, demana al teu admin que l'activi a Admin → Complementos.",
  'system_notice.v3_journey.title': 'Coneix Journey — diari de viatge',
  'system_notice.v3_journey.body':
    'Documenta els teus viatges com a històries enriquides amb cronologies, galeries de fotos i mapes interactius.',
  'system_notice.v3_journey.cta_label': 'Obre Journey',
  'system_notice.v3_journey.highlight_timeline': 'Cronologia i galeria per dia',
  'system_notice.v3_journey.highlight_photos': "Importa des d'Immich o Synology",
  'system_notice.v3_journey.highlight_share': 'Comparteix públicament — sense inici de sessió',
  'system_notice.v3_journey.highlight_export': 'Exporta com a llibre de fotos PDF',
  'system_notice.v3_features.title': 'Més novetats a la versió 3.0',
  'system_notice.v3_features.body': "Altres coses que val la pena conèixer d'aquesta versió.",
  'system_notice.v3_features.highlight_dashboard': 'Redisseny del panell mobile-first',
  'system_notice.v3_features.highlight_offline': 'Mode fora de línia complet com a PWA',
  'system_notice.v3_features.highlight_search': 'Autocompleció de llocs en temps real',
  'system_notice.v3_features.highlight_import': 'Importa llocs des de fitxers KMZ/KML',
  'system_notice.v3_mcp.title': 'MCP: actualització OAuth 2.1',
  'system_notice.v3_mcp.body':
    "La integració MCP ha estat completament renovada. OAuth 2.1 és ara el mètode d'autenticació recomanat. Els tokens estàtics (trek_…) estan obsolets i s'eliminaran en una versió futura.",
  'system_notice.v3_mcp.highlight_oauth': 'OAuth 2.1 recomanat (mcp-remote)',
  'system_notice.v3_mcp.highlight_scopes': '24 àmbits de permisos granulars',
  'system_notice.v3_mcp.highlight_deprecated': 'Tokens estàtics trek_ obsolets',
  'system_notice.v3_mcp.highlight_tools': 'Eines i indicacions ampliades',
  'system_notice.v3_thankyou.title': 'Una nota personal de part meva',
  'system_notice.v3_thankyou.body':
    "Abans de continuar — vull prendre'm un moment.\n\nTREK va començar com un projecte personal que vaig construir per als meus propis viatges. Mai vaig imaginar que créixeria fins a convertir-se en una eina en què 4.000 de vosaltres confieu per planificar les vostres aventures. Cada estrella, cada issue, cada sol·licitud de funcionalitat — les llegeixo totes, i són el que em manté dempeus durant les nits llargues entre un treball a jornada completa i la universitat.\n\nVull que sapigueu: TREK sempre serà open source, sempre autoallotjat, sempre vostre. Sense rastreig, sense subscripcions, sense lletra petita. Només una eina feta per algú que estima viatjar tant com vosaltres.\n\nUn agraïment especial a [jubnl](https://github.com/jubnl) — t'has convertit en un col·laborador increïble. Molt del que fa gran la versió 3.0 porta la teva empremta. Gràcies per creure en aquest projecte quan encara era un esborrany.\n\nI a cadascun de vosaltres que va informar d'un error, va traduir un text, va compartir TREK amb un amic o simplement el va utilitzar per planificar un viatge — **gràcies**. Vosaltres sou la raó que això existeixi.\n\nPer moltes més aventures junts.\n\n— Maurice\n\n---\n\n[Uneix-te a la comunitat a Discord](https://discord.gg/7Q6M6jDwzf)\n\nSi TREK millora els teus viatges, un [petit cafè](https://ko-fi.com/mauriceboe) sempre manté els llums encesos.",
  'system_notice.v3014_whitespace_collision.title': "Acció requerida: conflicte de compte d'usuari",
  'system_notice.v3014_whitespace_collision.body':
    "L'actualització 3.0.14 va detectar un o més conflictes de nom d'usuari o correu electrònic causats per espais en blanc al principi o al final dels valors emmagatzemats. Els comptes afectats es van reanomenar automàticament. Revisa els registres del servidor a la recerca de línies que comencin per **[migration] WHITESPACE COLLISION** per identificar quins comptes necessiten revisió.",

  'system_notice.thank_you_support.title': 'Gràcies per utilitzar TREK',
  'system_notice.thank_you_support.body':
    "Si t'agrada utilitzar TREK, considera donar suport al seu desenvolupament de codi obert.",
  'system_notice.thank_you_support.highlight_opensource': '100% codi obert a GitHub',
  'system_notice.thank_you_support.highlight_free': 'Gratuït per sempre — sense nivells de pagament',
  'system_notice.thank_you_support.highlight_community': 'Construït conjuntament amb la comunitat',
  'system_notice.thank_you_support.cta_bmc': 'Buy Me a Coffee',
  'system_notice.thank_you_support.cta_kofi': 'Dona suport a Ko-fi',
  'system_notice.thank_you_support.cta_patreon': 'Cada mes a Patreon',
  'system_notice.release_notes.eyebrow': 'Actualització instal·lada',
  'system_notice.release_notes.headline': 'Menys teclejar, més viatjar.',
  'system_notice.release_notes.features_label': 'Els protagonistes',
  'system_notice.release_notes.features_aside': 'I això no és tot',
  'system_notice.release_notes.feature_mail_title': 'Els correus de reserva arriben al teu viatge',
  'system_notice.release_notes.feature_mail_body':
    'Reenvia una confirmació a la teva adreça personal i TREK troba el teu viatge, ho comprova i afegeix la reserva amb el seu document.',
  'system_notice.release_notes.feature_flight_title': 'Estat del vol en directe, gratis',
  'system_notice.release_notes.feature_flight_body':
    'TREK segueix cadascun dels teus vols el dia que toca: estat, retard, tots dos aeroports i un mapa amb l’avió, sense clau d’API.',
  'system_notice.release_notes.feature_pdf_title': 'Un PDF del viatge nou',
  'system_notice.release_notes.feature_pdf_body':
    'Una portada amb la teva ruta, cada dia com a cronologia i totes les teves reserves amb els codis, a punt per imprimir o compartir.',
  'system_notice.release_notes.footnote':
    'A més, PostgreSQL, complements per viatge, etiquetes als llocs, més maneres de portar les despeses i una llarga llista de canvis més petits.',
  'system_notice.release_notes.notes_label': 'Notes de la versió',
  'system_notice.release_notes.note_eyebrow': 'Una nota del mantenidor',
  'system_notice.release_notes.note_title': 'Sou el motiu pel qual continuo construint TREK.',
  'system_notice.release_notes.note_body':
    'TREK va néixer com una eina petita per als meus propis viatges, feta després de la feina. Gairebé tot el que fas servir avui va prendre forma de nit, en caps de setmana o en trens, al costat d’una feina a temps complet, i sovint em preguntava si algú arribaria a obrir-lo.',
  'system_notice.release_notes.promise_label': 'La promesa',
  'system_notice.release_notes.promise_lead': 'TREK continuarà sent gratuït, per sempre.',
  'system_notice.release_notes.promise_text':
    'Cada funcionalitat, cada actualització, per a tothom. Sense nivells de pagament, sense subscripcions, sense lletra petita.',
  'system_notice.release_notes.note_body_after':
    'Després vau arribar vosaltres, aviat per milers: amb estrelles, informes d’errors, traduccions a idiomes que no parlo i pull requests de gent que no havia vist mai. Cada matí encara miro el repositori a primera hora, i encara no se’m fa del tot real.',
  'system_notice.release_notes.note_closing':
    'Gràcies per ser aquí. Maurice',
  'system_notice.release_notes.support_label': 'Possible gràcies a tu',
  'system_notice.release_notes.support_lead': 'TREK només existeix gràcies a les donacions.',
  'system_notice.release_notes.support_text':
    'Paguen els servidors i em donen el temps per seguir construint-lo. Fins i tot un sol cafè ajuda que TREK continuï sent gratuït per a tothom.',
  'system_notice.release_notes.cta_bmc': 'Buy me a coffee',
  'system_notice.release_notes.cta_kofi': 'Dona suport a Ko-fi',
  'system_notice.release_notes.cta_patreon': 'Cada mes a Patreon',
  'system_notice.release_notes.intro':
    'Els correus de reserva que reenvies arriben al teu viatge, TREK segueix els teus vols en directe i el PDF del viatge és totalment nou. TREK també funciona ara amb PostgreSQL.',
};
export default system_notice;
