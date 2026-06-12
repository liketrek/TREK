import type { TranslationStrings } from '../types';

const admin: TranslationStrings = {
  'admin.notifications.title': 'Notificacions',
  'admin.notifications.hint':
    'Tria un canal per rebre notificacions. Només un pot estar actiu alhora.',
  'admin.notifications.none': 'Desactivat',
  'admin.notifications.email': 'Correu (SMTP)',
  'admin.notifications.webhook': 'Webhook',
  'admin.notifications.save': 'Desar la configuració de notificacions',
  'admin.notifications.saved': 'Configuració de notificacions desada',
  'admin.notifications.testWebhook': 'Enviar webhook de prova',
  'admin.notifications.testWebhookSuccess':
    'Webhook de prova enviat correctament',
  'admin.notifications.testWebhookFailed': 'Error en enviar el webhook de prova',
  'admin.smtp.title': 'Correu i notificacions',
  'admin.smtp.hint':
    'Configuració SMTP per a l\'enviament de notificacions per correu.',
  'admin.smtp.testButton': 'Enviar correu de prova',
  'admin.webhook.hint':
    'Enviar notificacions a un webhook extern (Discord, Slack, etc.).',
  'admin.smtp.testSuccess': 'Correu de prova enviat correctament',
  'admin.smtp.testFailed': 'Error en enviar el correu de prova',
  'admin.title': 'Administració',
  'admin.subtitle': 'Gestió d\'usuaris i ajustos del sistema',
  'admin.tabs.users': 'Usuaris',
  'admin.tabs.categories': 'Categories',
  'admin.tabs.backup': 'Còpia de seguretat',
  'admin.tabs.audit': 'Auditoria',
  'admin.stats.users': 'Usuaris',
  'admin.stats.trips': 'Viatges',
  'admin.stats.places': 'Llocs',
  'admin.stats.photos': 'Fotos',
  'admin.stats.files': 'Fitxers',
  'admin.table.user': 'Usuari',
  'admin.table.email': 'Correu',
  'admin.table.role': 'Rol',
  'admin.table.created': 'Creat',
  'admin.table.lastLogin': 'Últim accés',
  'admin.table.actions': 'Accions',
  'admin.you': '(Tu)',
  'admin.editUser': 'Editar usuari',
  'admin.newPassword': 'Contrasenya nova',
  'admin.newPasswordHint': 'Deixa-ho buit per mantenir la contrasenya actual',
  'admin.deleteUser':
    'Eliminar l\'usuari "{name}"? Tots els seus viatges s\'esborraran permanentment.',
  'admin.deleteUserTitle': 'Eliminar usuari',
  'admin.newPasswordPlaceholder': 'Introdueix una contrasenya nova…',
  'admin.toast.loadError': 'No s\'han pogut carregar les dades d\'administració',
  'admin.toast.userUpdated': 'Usuari actualitzat',
  'admin.toast.updateError': 'No s\'ha pogut actualitzar',
  'admin.toast.userDeleted': 'Usuari eliminat',
  'admin.toast.deleteError': 'No s\'ha pogut eliminar',
  'admin.toast.cannotDeleteSelf': 'No pots eliminar el teu propi compte',
  'admin.toast.userCreated': 'Usuari creat',
  'admin.toast.createError': 'No s\'ha pogut crear l\'usuari',
  'admin.toast.fieldsRequired': 'Usuari, correu i contrasenya són obligatoris',
  'admin.createUser': 'Crea usuari',
  'admin.invite.title': 'Enllaços d\'invitació',
  'admin.invite.subtitle': 'Crea enllaços de registre d\'un sol ús',
  'admin.invite.create': 'Crea enllaç',
  'admin.invite.createAndCopy': 'Crea i copia',
  'admin.invite.empty': 'No s\'ha creat cap enllaç de convidada',
  'admin.invite.maxUses': 'Usos màx.',
  'admin.invite.expiry': 'Expira després de',
  'admin.invite.uses': 'utilitzat(s)',
  'admin.invite.expiresAt': 'expira el',
  'admin.invite.createdBy': 'per',
  'admin.invite.active': 'Actiu',
  'admin.invite.expired': 'Expirat',
  'admin.invite.usedUp': 'Esgotat',
  'admin.invite.copied': 'Enllaç de convidada copiat',
  'admin.invite.copyLink': 'Copia enllaç',
  'admin.invite.deleted': 'Enllaç de convidada eliminat',
  'admin.invite.createError': 'Error en crear l\'enllaç',
  'admin.invite.deleteError': 'Error en eliminar l\'enllaç',
  'admin.tabs.settings': 'Configuració',
  'admin.allowRegistration': 'Permetre el registre',
  'admin.allowRegistrationHint':
    'Els nous usuaris es poden registrar per si mateixos',
  'admin.authMethods': 'Mètodes d\'autenticació',
  'admin.passwordLogin': 'Inici de sessió amb contrasenya',
  'admin.passwordLoginHint': 'Permet que els usuaris iniciïn sessió amb correu i contrasenya',
  'admin.passwordRegistration': 'Registre amb contrasenya',
  'admin.passwordRegistrationHint':
    'Permet que els usuaris nous es registrin amb correu i contrasenya',
  'admin.oidcLogin': 'Inici de sessió SSO',
  'admin.oidcLoginHint': 'Permet que els usuaris iniciïn sessió amb SSO',
  'admin.oidcRegistration': 'Aprovisionament automàtic SSO',
  'admin.oidcRegistrationHint':
    'Crea comptes automàticament per als nous usuaris SSO',
  'admin.envOverrideHint':
    'La configuració d\'inici de sessió amb contrasenya està controlada per la variable d\'entorn OIDC_ONLY i no es pot canviar aquí.',
  'admin.lockoutWarning': 'Almenys un mètode d\'inici de sessió ha de romandre activat',
  'admin.requireMfa': 'Exigir autenticació de dos factors (2FA)',
  'admin.requireMfaHint':
    'Els usuaris sense 2FA han de completar la configuració a Ajustos abans d\'utilitzar l\'aplicació.',
  'admin.apiKeys': 'Claus API',
  'admin.apiKeysHint':
    'Opcional. Activa dades ampliades de llocs, com ara fotos i previsió meteorològica.',
  'admin.mapsKey': 'Clau API de Google Maps',
  'admin.mapsKeyHint':
    'Obligatòria per cercar llocs. Aconsegueix-la a console.cloud.google.com',
  'admin.mapsKeyHintLong':
    'Sense una clau API, la cerca de llocs fa servir OpenStreetMap. Amb una clau de Google també es poden carregar fotos, valoracions i horaris d\'obertura. Aconsegueix-la a console.cloud.google.com.',
  'admin.recommended': 'Recomanat',
  'admin.weatherKey': 'Clau API d\'OpenWeatherMap',
  'admin.weatherKeyHint':
    'Per a dades meteorològiques. Gratuït a openweathermap.org',
  'admin.validateKey': 'Provar',
  'admin.keyValid': 'Connectat',
  'admin.keyInvalid': 'No vàlida',
  'admin.keySaved': 'Claus API desades',
  'admin.oidcTitle': 'Inici de sessió únic (OIDC)',
  'admin.oidcSubtitle':
    'Permet iniciar sessió mitjançant proveïdors externs com Google, Apple, Authentik o Keycloak.',
  'admin.oidcDisplayName': 'Nom visible',
  'admin.oidcIssuer': 'URL de l\'emissor',
  'admin.oidcIssuerHint':
    'L\'URL Issuer d\'OpenID Connect del proveïdor. Ex.: https://accounts.google.com',
  'admin.oidcSaved': 'Configuració OIDC desada',
  'admin.fileTypes': 'Tipus de fitxer permesos',
  'admin.fileTypesHint':
    'Configura quins tipus de fitxer poden pujar els usuaris.',
  'admin.fileTypesFormat':
    'Extensions separades per comes (p. ex. jpg,png,pdf,doc). Utilitza * per permetre tots els tipus.',
  'admin.fileTypesSaved': 'Ajustos de tipus de fitxer desats',
  'admin.placesPhotos.title': 'Fotos de Llocs',
  'admin.placesPhotos.subtitle':
    'Obtén fotos de la Google Places API. Desactiva per estalviar quota d\'API. Les fotos de Wikimedia no es veuen afectades.',
  'admin.placesAutocomplete.title': 'Autocompletat de Llocs',
  'admin.placesAutocomplete.subtitle':
    'Utilitza la Google Places API per a suggeriments de cerca. Desactiva per estalviar quota d\'API.',
  'admin.placesDetails.title': 'Detalls del Lloc',
  'admin.placesDetails.subtitle':
    'Obtén informació detallada del lloc (horaris, valoració, web) de la Google Places API. Desactiva per estalviar quota d\'API.',
  'admin.bagTracking.title': 'Seguiment d\'equipatge',
  'admin.bagTracking.subtitle':
    'Activar pes i assignació d\'equipatge per a articles de la llista',
  'admin.collab.chat.title': 'Xat',
  'admin.collab.chat.subtitle':
    'Missatgeria en temps real per a la col·laboració',
  'admin.collab.notes.title': 'Notes',
  'admin.collab.notes.subtitle': 'Notes i documents compartits',
  'admin.collab.polls.title': 'Enquestes',
  'admin.collab.polls.subtitle': 'Enquestes i votacions grupals',
  'admin.collab.whatsnext.title': 'Què ve després',
  'admin.collab.whatsnext.subtitle':
    'Suggeriments d\'activitats i propers passos',
  'admin.tabs.config': 'Personalització',
  'admin.tabs.defaults': 'Valors per defecte',
  'admin.defaultSettings.title': 'Configuració per defecte dels usuaris',
  'admin.defaultSettings.description':
    'Estableix valors per defecte per a tota la instància. Els usuaris que no hagin canviat una opció veuran aquests valors. Els seus propis canvis sempre tenen prioritat.',
  'admin.defaultSettings.saved': 'Per defecte desat',
  'admin.defaultSettings.reset': 'Restaurar al valor per defecte integrat',
  'admin.defaultSettings.resetToBuiltIn': 'Restaurar',
  'admin.tabs.templates': 'Plantilles d\'equipatge',
  'admin.packingTemplates.title': 'Plantilles d\'equipatge',
  'admin.packingTemplates.subtitle':
    'Crea llistes d\'equipatge reutilitzables per als teus viatges',
  'admin.packingTemplates.create': 'Nova plantilla',
  'admin.packingTemplates.namePlaceholder':
    'Nom de la plantilla (ex. Vacances a la platja)',
  'admin.packingTemplates.empty': 'Encara no s\'ha creat cap plantilla',
  'admin.packingTemplates.items': 'articles',
  'admin.packingTemplates.categories': 'categories',
  'admin.packingTemplates.itemName': 'Nom de l\'article',
  'admin.packingTemplates.itemCategory': 'Categoria',
  'admin.packingTemplates.categoryName': 'Nom de categoria (ex. Roba)',
  'admin.packingTemplates.addCategory': 'Afegeix una categoria',
  'admin.packingTemplates.created': 'Plantilla creada',
  'admin.packingTemplates.deleted': 'Plantilla eliminada',
  'admin.packingTemplates.loadError': 'Error en carregar les plantilles',
  'admin.packingTemplates.createError': 'Error en crear la plantilla',
  'admin.packingTemplates.deleteError': 'Error en eliminar la plantilla',
  'admin.packingTemplates.saveError': 'Error en desar',
  'admin.tabs.addons': 'Complements',
  'admin.addons.title': 'Complements',
  'admin.addons.subtitle':
    'Activa o desactiva funcions per personalitzar la teva experiència a TREK.',
  'admin.addons.subtitleBefore':
    'Activa o desactiva funcions per personalitzar la teva experiència a ',
  'admin.addons.subtitleAfter': '.',
  'admin.addons.enabled': 'Actiu',
  'admin.addons.disabled': 'Desactivat',
  'admin.addons.type.trip': 'Viatge',
  'admin.addons.type.global': 'Global',
  'admin.addons.type.integration': 'Integració',
  'admin.addons.tripHint': 'Disponible com a pestanya dins de cada viatge',
  'admin.addons.globalHint':
    'Disponible com a secció independent en la navegació principal',
  'admin.addons.integrationHint':
    'Serveis backend i integracions d\'API sense pàgina dedicada',
  'admin.addons.toast.updated': 'Complement actualitzat',
  'admin.addons.toast.error': 'No s\'ha pogut actualitzar el complement',
  'admin.addons.noAddons': 'No hi ha complements disponibles',
  'admin.weather.title': 'Dades meteorològiques',
  'admin.weather.badge': 'Des del 24 de març de 2026',
  'admin.weather.description':
    'TREK utilitza Open-Meteo com a font de dades meteorològiques. Open-Meteo és un servei meteorològic gratuït i de codi obert: no requereix clau API.',
  'admin.weather.forecast': 'Pronòstic de 16 dies',
  'admin.weather.forecastDesc': 'Abans eren 5 dies (OpenWeatherMap)',
  'admin.weather.climate': 'Dades climàtiques històriques',
  'admin.weather.climateDesc':
    'Mitjanes dels darrers 85 anys per a dates posteriors al pronòstic de 16 dies',
  'admin.weather.requests': '10.000 sol·licituds / dia',
  'admin.weather.requestsDesc': 'Gratuït, sense necessitat de clau API',
  'admin.weather.locationHint':
    'El temps es basa en el primer lloc amb coordenades de cada dia. Si no hi ha cap lloc assignat a un dia, es fa servir com a referència qualsevol lloc de la llista.',
  'admin.tabs.mcpTokens': 'Accés MCP',
  'admin.mcpTokens.title': 'Accés MCP',
  'admin.mcpTokens.subtitle':
    'Gestionar sessions OAuth i tokens d\'API de tots els usuaris',
  'admin.mcpTokens.sectionTitle': 'Tokens d\'API',
  'admin.mcpTokens.owner': 'Propietari',
  'admin.mcpTokens.tokenName': 'Nom del token',
  'admin.mcpTokens.created': 'Creat',
  'admin.mcpTokens.lastUsed': 'Últim ús',
  'admin.mcpTokens.never': 'Mai',
  'admin.mcpTokens.empty': 'Encara no s\'ha creat cap token MCP',
  'admin.mcpTokens.deleteTitle': 'Eliminar token',
  'admin.mcpTokens.deleteMessage':
    'Aquest token es revocarà immediatament. L\'usuari perdrà l\'accés MCP a través d\'aquest token.',
  'admin.mcpTokens.deleteSuccess': 'Token eliminat',
  'admin.mcpTokens.deleteError': 'No s\'ha pogut eliminar el token',
  'admin.mcpTokens.loadError': 'No s\'han pogut carregar els tokens',
  'admin.oauthSessions.sectionTitle': 'Sessions OAuth',
  'admin.oauthSessions.clientName': 'Client',
  'admin.oauthSessions.owner': 'Propietari',
  'admin.oauthSessions.scopes': 'Permisos',
  'admin.oauthSessions.created': 'Creat',
  'admin.oauthSessions.empty': 'No hi ha sessions OAuth actives',
  'admin.oauthSessions.revokeTitle': 'Revocar sessió',
  'admin.oauthSessions.revokeMessage':
    'Això revocarà la sessió OAuth immediatament. El client perdrà l\'accés MCP.',
  'admin.oauthSessions.revokeSuccess': 'Sessió revocada',
  'admin.oauthSessions.revokeError': 'No s\'ha pogut revocar la sessió',
  'admin.oauthSessions.loadError': 'No s\'han pogut carregar les sessions OAuth',
  'admin.tabs.github': 'GitHub',
  'admin.audit.subtitle':
    'Esdeveniments sensibles de seguretat i administració (còpies de seguretat, usuaris, MFA, ajustos).',
  'admin.audit.empty': 'Encara no hi ha entrades d\'auditoria.',
  'admin.audit.refresh': 'Actualitzar',
  'admin.audit.loadMore': 'Carregar més',
  'admin.audit.showing': '{count} carregats · {total} en total',
  'admin.audit.col.time': 'Data i hora',
  'admin.audit.col.user': 'Usuari',
  'admin.audit.col.action': 'Acció',
  'admin.audit.col.resource': 'Recurs',
  'admin.audit.col.ip': 'IP',
  'admin.audit.col.details': 'Detalls',
  'admin.github.title': 'Historial de versions',
  'admin.github.subtitle': 'Últimes novetats de {repo}',
  'admin.github.latest': 'Última',
  'admin.github.prerelease': 'Prellançament',
  'admin.github.showDetails': 'Mostrar els detalls',
  'admin.github.hideDetails': 'Amagar detalls',
  'admin.github.loadMore': 'Carregar més',
  'admin.github.loading': 'Carregant...',
  'admin.github.support': 'Ajuda a continuar desenvolupant TREK',
  'admin.github.error': 'No s\'han pogut carregar les versions',
  'admin.github.by': 'per',
  'admin.update.available': 'Actualització disponible',
  'admin.update.text':
    'TREK {version} està disponible. Estàs utilitzant {current}.',
  'admin.update.button': 'Veure a GitHub',
  'admin.update.install': 'Instal·lar actualització',
  'admin.update.confirmTitle': 'Vols instal·lar l\'actualització?',
  'admin.update.confirmText':
    'TREK s\'actualitzarà de {current} a {version}. Després, el servidor es reiniciarà automàticament.',
  'admin.update.dataInfo':
    'Totes les teves dades (viatges, usuaris, claus API, pujades, Vacay, Atlas, pressupostos) es conservaran.',
  'admin.update.warning':
    'L\'aplicació estarà breument no disponible durant el reinici.',
  'admin.update.confirm': 'Actualitzar ara',
  'admin.update.installing': 'Actualitzant…',
  'admin.update.success':
    'Actualització instal·lada! El servidor s\'està reiniciant…',
  'admin.update.failed': 'L\'actualització ha fallat',
  'admin.update.backupHint':
    'Recomanem crear una còpia de seguretat abans d\'actualitzar.',
  'admin.update.backupLink': 'Anar a Còpia de seguretat',
  'admin.update.howTo': 'Com actualitzar',
  'admin.update.dockerText':
    'La teva instància de TREK s\'executa en Docker. Per actualitzar a {version}, executa les següents ordres al teu servidor:',
  'admin.update.reloadHint': 'Recarrega la pàgina en uns segons.',
  'admin.addons.catalog.memories.name': 'Fotos (Immich)',
  'admin.addons.catalog.memories.description':
    'Comparteix fotos de viatge a través de la teva instància d\'Immich',
  'admin.addons.catalog.mcp.name': 'MCP',
  'admin.addons.catalog.mcp.description':
    'Protocol de context de model per a integració amb assistents d\'IA',
  'admin.addons.catalog.packing.name': 'Llistes',
  'admin.addons.catalog.packing.description':
    'Llistes d\'equipatge i tasques pendents per als teus viatges',
  'admin.addons.catalog.budget.name': 'Pressupost',
  'admin.addons.catalog.budget.description':
    'Controla les despeses i planifica el pressupost del viatge',
  'admin.addons.catalog.documents.name': 'Documents',
  'admin.addons.catalog.documents.description':
    'Guarda i gestiona la documentació del viatge',
  'admin.addons.catalog.vacay.name': 'Vacances',
  'admin.addons.catalog.vacay.description':
    'Planificador personal de vacances amb vista de calendari',
  'admin.addons.catalog.atlas.name': 'Atles',
  'admin.addons.catalog.atlas.description':
    'Mapa del món amb els països visitats i estadístiques de viatge',
  'admin.addons.catalog.collab.name': 'Col·laboració',
  'admin.addons.catalog.collab.description':
    'Notes, enquestes i xat en temps real per organitzar el viatge',
  'admin.oidcOnlyMode': 'Desactivar autenticació per contrasenya',
  'admin.oidcOnlyModeHint':
    'Si està activat, només es permet l\'inici de sessió amb SSO. L\'inici de sessió i registre amb contrasenya es bloquegen.',
  'admin.tabs.permissions': 'Permisos',
  'admin.notifications.emailPanel.title': 'Correu (SMTP)',
  'admin.notifications.webhookPanel.title': 'Webhook',
  'admin.notifications.inappPanel.title': 'In-App',
  'admin.notifications.inappPanel.hint':
    'Les notificacions in-app sempre estan actives i no es poden desactivar globalment.',
  'admin.notifications.adminWebhookPanel.title': 'Webhook d\'administrador',
  'admin.notifications.adminWebhookPanel.hint':
    'Aquest webhook s\'utilitza exclusivament per a notificacions d\'administrador (ex. alertes de versió). És independent dels webhooks d\'usuari i s\'activa automàticament si hi ha una URL configurada.',
  'admin.notifications.adminWebhookPanel.saved':
    'URL del webhook d\'administrador desada',
  'admin.notifications.adminWebhookPanel.testSuccess':
    'Webhook de prova enviat correctament',
  'admin.notifications.adminWebhookPanel.testFailed':
    'Error en enviar el webhook de prova',
  'admin.notifications.adminWebhookPanel.alwaysOnHint':
    'El webhook d\'administrador s\'activa automàticament si hi ha una URL configurada',
  'admin.notifications.ntfy': 'Ntfy',
  'admin.ntfy.hint':
    'Permet als usuaris configurar els seus propis temes ntfy per a notificacions push. Estableix el servidor per defecte a continuació per omplir automàticament els ajustos de l\'usuari.',
  'admin.notifications.testNtfy': 'Enviar Ntfy de prova',
  'admin.notifications.testNtfySuccess': 'Ntfy de prova enviat correctament',
  'admin.notifications.testNtfyFailed': 'Error en enviar el Ntfy de prova',
  'admin.notifications.adminNtfyPanel.title': 'Ntfy d\'administrador',
  'admin.notifications.adminNtfyPanel.hint':
    'Aquest tema Ntfy s\'utilitza exclusivament per a notificacions d\'administrador (ex. alertes de versió). És independent dels temes per usuari i sempre s\'activa quan està configurat.',
  'admin.notifications.adminNtfyPanel.serverLabel': 'URL del servidor Ntfy',
  'admin.notifications.adminNtfyPanel.serverHint':
    'També s\'utilitza com a servidor per defecte per a les notificacions ntfy dels usuaris. Deixa-ho en blanc per utilitzar ntfy.sh. Els usuaris poden canviar-lo en els seus propis ajustos.',
  'admin.notifications.adminNtfyPanel.serverPlaceholder': 'https://ntfy.sh',
  'admin.notifications.adminNtfyPanel.topicLabel': 'Tema d\'administrador',
  'admin.notifications.adminNtfyPanel.topicPlaceholder': 'trek-admin-alerts',
  'admin.notifications.adminNtfyPanel.tokenLabel': 'Token d\'accés (opcional)',
  'admin.notifications.adminNtfyPanel.tokenCleared':
    'Token d\'accés d\'administrador eliminat',
  'admin.notifications.adminNtfyPanel.saved':
    'Configuració de Ntfy d\'administrador desada',
  'admin.notifications.adminNtfyPanel.test': 'Enviar Ntfy de prova',
  'admin.notifications.adminNtfyPanel.testSuccess':
    'Ntfy de prova enviat correctament',
  'admin.notifications.adminNtfyPanel.testFailed':
    'Error en enviar el Ntfy de prova',
  'admin.notifications.adminNtfyPanel.alwaysOnHint':
    'El Ntfy d\'administrador sempre s\'activa quan hi ha un tema configurat',
  'admin.notifications.adminNotificationsHint':
    'Configura quins canals entreguen notificacions d\'administrador (ex. alertes de versió). El webhook s\'activa automàticament si hi ha una URL de webhook d\'administrador configurada.',
  'admin.notifications.tripReminders.title': 'Recordatoris de viatge',
  'admin.notifications.tripReminders.hint':
    'Envia una notificació de recordatori abans que comenci un viatge (requereix dies de recordatori configurats al viatge).',
  'admin.notifications.tripReminders.enabled':
    'Recordatoris de viatge activats',
  'admin.notifications.tripReminders.disabled':
    'Recordatoris de viatge desactivats',
  'admin.tabs.notifications': 'Notificacions',
  'admin.addons.catalog.journey.name': 'Travessia',
  'admin.addons.catalog.journey.description':
    'Seguiment de viatges i dietari de viatger amb registres d\'ubicació, fotos i històries diàries',
  'admin.passkey.title': 'Inici de sessió amb clau d\'accés',
  'admin.passkey.cardHint':
    'Permet que els usuaris iniciïn sessió amb claus d\'accés (WebAuthn). Desactivat per defecte.',
  'admin.passkey.login': 'Activar inici de sessió amb clau d\'accés',
  'admin.passkey.loginHint':
    'Mostra una opció "Iniciar sessió amb una clau d\'accés" i permet als usuaris registrar claus d\'accés als seus ajustos.',
  'admin.passkey.notConfigured':
    'Encara no es resol cap domini de WebAuthn per a aquesta instal·lació. Defineix APP_URL o l\'ID de la part confiable a continuació: les claus d\'accés romandran ocultes fins aleshores.',
  'admin.passkey.rpId': 'ID de la part confiable (domini)',
  'admin.passkey.rpIdHint':
    'El domini pur al qual estan vinculades les claus d\'accés, p. ex. trek.example.org. Deixa-ho buit per derivar-lo d\'APP_URL. Canviar-lo més endavant invalida les claus d\'accés existents.',
  'admin.passkey.origins': 'Orígens permesos',
  'admin.passkey.originsHint':
    'Orígens complets separats per comes, p. ex. https://trek.example.org. Deixa-ho buit per utilitzar APP_URL.',
  'admin.passkey.reset': 'Restablir claus d\'accés',
  'admin.passkey.resetHint':
    'Elimina totes les claus d\'accés d\'aquest usuari (p. ex. després de perdre un dispositiu). Encara podrà iniciar sessió amb la seva contrasenya.',
  'admin.passkey.resetConfirm': 'Vols eliminar totes les claus d\'accés de {name}?',
  'admin.passkey.resetDone': 'S\'han eliminat {count} clau(s) d\'accés',
  'admin.defaultSettings.mapProvider': 'Motor de mapes',
  'admin.defaultSettings.mapProviderHint': 'El mapa per defecte per a tothom en aquesta instància. Cada usuari pot canviar-lo en els seus propis ajustos.',
  'admin.defaultSettings.providerLeaflet': 'Estàndard (gratuït)',
  'admin.defaultSettings.providerMapbox': 'Mapbox (3D)',
  'admin.defaultSettings.mapboxToken': 'Token de Mapbox compartit',
  'admin.defaultSettings.mapboxTokenHint': 'S\'utilitza per a cada usuari que no hagi introduït el seu propi token, de manera que tota la instància obtingui Mapbox sense compartir la clau individualment. S\'emmagatzema xifrat.',
  'admin.defaultSettings.mapboxStyle': 'Estil de mapa',
  'admin.defaultSettings.mapboxStylePlaceholder': 'Tria un estil…',
  'admin.defaultSettings.mapbox3d': 'Edificis i terreny en 3D',
  'admin.defaultSettings.mapboxQuality': 'Mode d\'alta qualitat',
};
export default admin;