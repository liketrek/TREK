import type { TranslationStrings } from '../types';

const oauth: TranslationStrings = {
  'oauth.scope.group.trips': 'Viajes',
  'oauth.scope.group.places': 'Lugares',
  'oauth.scope.group.atlas': 'Atlas',
  'oauth.scope.group.packing': 'Equipaje',
  'oauth.scope.group.todos': 'Tareas',
  'oauth.scope.group.budget': 'Presupuesto',
  'oauth.scope.group.reservations': 'Reservas',
  'oauth.scope.group.collab': 'Colaboración',
  'oauth.scope.group.notifications': 'Notificaciones',
  'oauth.scope.group.vacay': 'Vacaciones',
  'oauth.scope.group.geo': 'Geo',
  'oauth.scope.group.weather': 'Clima',
  'oauth.scope.group.journey': 'Travesía',
  'oauth.scope.trips:read.label': 'Ver viajes e itinerarios',
  'oauth.scope.trips:read.description': 'Leer viajes, días, notas y miembros',
  'oauth.scope.trips:write.label': 'Editar viajes e itinerarios',
  'oauth.scope.trips:write.description': 'Crear y actualizar viajes, días, notas y gestionar miembros',
  'oauth.scope.trips:delete.label': 'Eliminar viajes',
  'oauth.scope.trips:delete.description': 'Eliminar viajes permanentemente — esta acción es irreversible',
  'oauth.scope.trips:share.label': 'Gestionar enlaces de compartir',
  'oauth.scope.trips:share.description': 'Crear, actualizar y revocar enlaces públicos de viaje',
  'oauth.scope.places:read.label': 'Ver lugares y datos del mapa',
  'oauth.scope.places:read.description': 'Leer lugares, asignaciones de días, etiquetas y categorías',
  'oauth.scope.places:write.label': 'Gestionar lugares',
  'oauth.scope.places:write.description': 'Crear, actualizar y eliminar lugares, asignaciones y etiquetas',
  'oauth.scope.atlas:read.label': 'Ver Atlas',
  'oauth.scope.atlas:read.description': 'Leer países visitados, regiones y lista de deseos',
  'oauth.scope.atlas:write.label': 'Gestionar Atlas',
  'oauth.scope.atlas:write.description': 'Marcar países y regiones como visitados, gestionar lista de deseos',
  'oauth.scope.packing:read.label': 'Ver listas de equipaje',
  'oauth.scope.packing:read.description': 'Leer artículos, maletas y responsables de categoría',
  'oauth.scope.packing:write.label': 'Gestionar listas de equipaje',
  'oauth.scope.packing:write.description': 'Agregar, actualizar, eliminar, marcar y reordenar artículos y maletas',
  'oauth.scope.todos:read.label': 'Ver listas de tareas',
  'oauth.scope.todos:read.description': 'Leer tareas del viaje y responsables de categoría',
  'oauth.scope.todos:write.label': 'Gestionar listas de tareas',
  'oauth.scope.todos:write.description': 'Crear, actualizar, marcar, eliminar y reordenar tareas',
  'oauth.scope.budget:read.label': 'Ver presupuesto',
  'oauth.scope.budget:read.description': 'Leer partidas de presupuesto y desglose de gastos',
  'oauth.scope.budget:write.label': 'Gestionar presupuesto',
  'oauth.scope.budget:write.description': 'Crear, actualizar y eliminar partidas de presupuesto',
  'oauth.scope.reservations:read.label': 'Ver reservas',
  'oauth.scope.reservations:read.description': 'Leer reservas y detalles de alojamiento',
  'oauth.scope.reservations:write.label': 'Gestionar reservas',
  'oauth.scope.reservations:write.description': 'Crear, actualizar, eliminar y reordenar reservas',
  'oauth.scope.collab:read.label': 'Ver colaboración',
  'oauth.scope.collab:read.description': 'Leer notas colaborativas, encuestas y mensajes',
  'oauth.scope.collab:write.label': 'Gestionar colaboración',
  'oauth.scope.collab:write.description': 'Crear, actualizar y eliminar notas, encuestas y mensajes',
  'oauth.scope.notifications:read.label': 'Ver notificaciones',
  'oauth.scope.notifications:read.description': 'Leer notificaciones y conteos no leídos',
  'oauth.scope.notifications:write.label': 'Gestionar notificaciones',
  'oauth.scope.notifications:write.description': 'Marcar notificaciones como leídas y responderlas',
  'oauth.scope.vacay:read.label': 'Ver planes de vacaciones',
  'oauth.scope.vacay:read.description': 'Leer datos de planificación, entradas y estadísticas de vacaciones',
  'oauth.scope.vacay:write.label': 'Gestionar planes de vacaciones',
  'oauth.scope.vacay:write.description': 'Crear y gestionar entradas de vacaciones, festivos y planes de equipo',
  'oauth.scope.geo:read.label': 'Mapas y geocodificación',
  'oauth.scope.geo:read.description': 'Buscar lugares, resolver URLs de mapa y geocodificar coordenadas',
  'oauth.scope.weather:read.label': 'Previsiones meteorológicas',
  'oauth.scope.weather:read.description': 'Obtener previsiones meteorológicas para lugares y fechas del viaje',
  'oauth.scope.journey:read.label': 'Ver travesías',
  'oauth.scope.journey:read.description': 'Leer travesías, entradas y lista de colaboradores',
  'oauth.scope.journey:write.label': 'Gestionar travesías',
  'oauth.scope.journey:write.description': 'Crear, actualizar y eliminar travesías y sus entradas',
  'oauth.scope.journey:share.label': 'Gestionar enlaces de travesías',
  'oauth.scope.journey:share.description': 'Crear, actualizar y revocar enlaces públicos de compartir para travesías',
  'oauth.authorize.authorizing': 'Authorizing…', // en-fallback
  'oauth.authorize.loading': 'Loading…', // en-fallback
  'oauth.authorize.errorTitle': 'Authorization Error', // en-fallback
  'oauth.authorize.loginTitle': 'Sign in to continue', // en-fallback
  'oauth.authorize.loginDescription': '{client} wants access to your TREK account. Please sign in first.', // en-fallback
  'oauth.authorize.loginButton': 'Sign in to TREK', // en-fallback
  'oauth.authorize.requestLabel': 'Authorization Request', // en-fallback
  'oauth.authorize.requestDescription': 'This application is requesting access to your TREK account.', // en-fallback
  'oauth.authorize.trustNote': 'Only grant access to applications you trust. Your data stays on your server.', // en-fallback
  'oauth.authorize.selectScope': 'Select at least one scope', // en-fallback
  'oauth.authorize.approveOneScope': 'Approve ({count} scope)', // en-fallback
  'oauth.authorize.approveManyScopes': 'Approve ({count} scopes)', // en-fallback
  'oauth.authorize.approveAccess': 'Approve Access', // en-fallback
  'oauth.authorize.deny': 'Deny', // en-fallback
  'oauth.authorize.choosePermissions': 'Choose which permissions to grant', // en-fallback
  'oauth.authorize.permissionsRequested': 'Permissions requested', // en-fallback
  'oauth.authorize.alwaysIncluded': 'Always included', // en-fallback
  'oauth.authorize.alwaysTool.listTrips': 'List your trips so the AI can discover trip IDs', // en-fallback
  'oauth.authorize.alwaysTool.getTripSummary': 'Read a trip overview needed to use any other tool', // en-fallback
};
export default oauth;
