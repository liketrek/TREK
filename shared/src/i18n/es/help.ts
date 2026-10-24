import type { TranslationStrings } from '../types';

// English fallback until 'es' is translated.
const help: TranslationStrings = {
  'help.title': 'Ayuda y documentación',
  'help.search': 'Buscar en la documentación…',
  'help.contents': 'Contenido',
  'help.noResults': 'No hay páginas que coincidan.',
  'help.errorTitle': 'No se ha podido cargar esta página',
  'help.errorBody': 'La ayuda se carga desde la wiki de TREK. Comprueba tu conexión y vuelve a intentarlo.',

  // center
  'help.center.button': 'Ayuda para esta pantalla',
  'help.center.title': 'Ayuda',
  'help.center.onThisScreen': 'En esta pantalla',
  'help.center.screens': 'Pantallas',
  'help.center.thisScreen': 'Actual',
  'help.center.subScreens': '{count} subpantallas',
  'help.center.subScreens.one': '{count} subpantalla',
  'help.center.subScreensLabel': 'Subpantallas',
  'help.center.guidesCount': '{count} guías',
  'help.center.guidesCount.one': '{count} guía',
  'help.center.goToScreen': 'Ir a {screen}',
  'help.center.overview': 'Resumen',
  'help.center.howTo': '¿Cómo puedo…?',
  'help.center.searchPlaceholder': 'Buscar en guías y documentación…',
  'help.center.searchEmpty': 'No hay resultados para «{query}».',
  'help.center.searchGuides': 'Guías',
  'help.center.searchDocs': 'Documentación',
  'help.center.searchError': 'La búsqueda no está disponible en este momento.',
  'help.center.back': 'Atrás',
  'help.center.close': 'Cerrar la ayuda',
  'help.center.steps': '{count} pasos',
  'help.center.steps.one': '{count} paso',
  'help.center.step': 'Paso {n}',
  'help.center.stepsLabel': 'Pasos',
  'help.center.stepOf': 'Paso {n} de {total}',
  'help.center.screenshot': 'Captura de pantalla',
  'help.center.result': 'Lo que consigues',
  'help.center.tips': 'Conviene saber',
  'help.center.related': 'Relacionado',
  'help.center.openDocs': 'Abrir en Ayuda y documentación',
  'help.center.docsSection': 'En la documentación',
  'help.center.noContext': 'Todavía no hay ninguna guía para esta pantalla.',
  'help.center.noContextHint': 'Busca en la documentación o cuéntanos qué estabas buscando.',
  'help.center.feedback': '¿Echas algo en falta?',
  'help.center.feedbackLink': 'Cuéntanoslo en GitHub',
  'help.center.discord': 'Pregunta en Discord',
  'help.center.quick': 'Rápido',
  'help.center.guide': 'Guía',
  'help.center.tour': 'Recorrido guiado',
  'help.center.imageAlt': 'Paso {n} de «{title}»',

  // ctx
  'help.ctx.dashboard.title': 'Panel',
  'help.ctx.dashboard.summary':
    'El panel muestra todos tus viajes. La tarjeta de arriba, con aspecto de tarjeta de embarque, muestra el viaje en curso o el próximo. La fila de debajo resume lo que has viajado hasta ahora, y las tarjetas muestran todos los viajes que estás planificando, que has archivado o que ya has terminado.',
  'help.ctx.dashboard.bullet.1':
    'Tarjeta de embarque: el viaje en curso o el próximo, con sus fechas, viajeros, lugares y una cuenta atrás. Haz clic en ella para abrir el viaje. Los cuatro botones de la esquina superior derecha sirven para editarlo, duplicarlo, archivarlo o eliminarlo.',
  'help.ctx.dashboard.bullet.2':
    'Estadísticas de viaje: países visitados, viajes, días de viaje y distancia recorrida en avión, sumando todos tus viajes.',
  'help.ctx.dashboard.bullet.3':
    'Tarjetas de viaje, filtradas por «Planeado», «Archivado» y «Completado», en cuadrícula o en lista. El cuadro de búsqueda de encima busca en todos tus viajes a la vez, por título, fecha o un lugar del viaje. Los botones para editar, duplicar, archivar y eliminar un viaje están en la esquina superior derecha de la foto de cada tarjeta.',
  'help.ctx.dashboard.bullet.4':
    'Widgets a la derecha: conversor de divisas, «Colecciones» (si el complemento «Colecciones» está activado), relojes mundiales, próximas reservas y widgets de plugins. Los integrados se pueden desactivar en «Ajustes», «Apariencia».',
  'help.ctx.dashboard.bullet.5':
    'Puedes crear un viaje nuevo desde la tarjeta «Nuevo viaje» o con el botón de la esquina inferior derecha.',

  // create-trip
  'help.guide.create-trip.title': 'Crear un viaje',
  'help.guide.create-trip.goal': 'Crea un viaje nuevo con nombre, fechas y foto de portada.',
  'help.guide.create-trip.step.1':
    'Haz clic en «Nuevo viaje». La tarjeta al final de tus viajes y el botón de la esquina inferior derecha hacen lo mismo.',
  'help.guide.create-trip.step.2':
    'Ponle un nombre al viaje. Es el único campo obligatorio; todo lo demás puedes añadirlo después.',
  'help.guide.create-trip.step.3':
    'Elige una fecha de inicio y una de fin. TREK crea un día por cada fecha para que puedas empezar a planificar tu itinerario. ¿Aún no tienes fechas? Deja las dos vacías e indica el «Número de días».',
  'help.guide.create-trip.step.4':
    'Opcional: añade una foto de portada. Sube una tuya, arrástrala o pégala, o busca el destino en Unsplash.',
  'help.guide.create-trip.step.5': 'Haz clic en «Crear nuevo viaje».',
  'help.guide.create-trip.result':
    'El viaje aparece en tu panel. Si es tu próximo viaje, se muestra en la tarjeta de embarque de arriba.',
  'help.guide.create-trip.tip.1':
    'Puedes cambiar las fechas más adelante. Si ya hay reservas, TREK te pregunta si quieres moverlas junto con los días.',
  'help.guide.create-trip.tip.2':
    'Todos los gastos se convierten a la divisa del viaje que elijas aquí. Elige la divisa del destino.',

  // edit-trip
  'help.guide.edit-trip.title': 'Editar un viaje',
  'help.guide.edit-trip.goal': 'Cambia el nombre o las fechas de un viaje, o ajusta su configuración.',
  'help.guide.edit-trip.step.1':
    'Haz clic en el lápiz de la esquina superior derecha de la tarjeta del viaje (o de la tarjeta de embarque).',
  'help.guide.edit-trip.step.2':
    'Cambia lo que necesites: nombre, descripción, fechas, portada, moneda, recordatorio o compañeros de viaje.',
  'help.guide.edit-trip.step.3': 'Haz clic en Actualizar.',
  'help.guide.edit-trip.result': 'La tarjeta se actualiza al momento para todos los miembros del viaje.',
  'help.guide.edit-trip.tip.1':
    'Si mueves el inicio de un viaje con reservas, se te pregunta si las reservas también deben moverse. Si acortas un viaje, se muestran los días que se eliminarían y lo que tienen planificado. Solo se guarda cuando haces clic en «Quitar días y guardar».',

  // cover-image
  'help.guide.cover-image.title': 'Poner una foto de portada',
  'help.guide.cover-image.goal': 'Pon a un viaje una imagen que se vea en su tarjeta y en la tarjeta de embarque.',
  'help.guide.cover-image.step.1': 'Abre el formulario de edición del viaje con el lápiz de su tarjeta.',
  'help.guide.cover-image.step.2':
    'En «Imagen de portada», suelta o pega una foto, haz clic para subir una, o escribe un destino y haz clic en «Buscar en Unsplash».',
  'help.guide.cover-image.step.3': 'Elige una foto y haz clic en «Actualizar».',
  'help.guide.cover-image.result': 'La foto se guarda con el viaje y aparece en todos los sitios donde se muestra.',
  'help.guide.cover-image.tip.1':
    'Las fotos de la búsqueda de Unsplash incluyen su autoría automáticamente; las que subes tú se quedan en tu servidor.',

  // duplicate-trip
  'help.guide.duplicate-trip.title': 'Duplicar un viaje',
  'help.guide.duplicate-trip.goal': 'Usa un viaje como plantilla para uno nuevo.',
  'help.guide.duplicate-trip.step.1': 'Haz clic en el icono de duplicar, en la esquina superior derecha de la tarjeta.',
  'help.guide.duplicate-trip.step.2': 'Lee qué se copiará y qué no, y haz clic en «Copiar viaje».',
  'help.guide.duplicate-trip.result':
    'Aparece una copia en tu panel con el nombre del original seguido de (copia). Puedes cambiarle el nombre y las fechas.',
  'help.guide.duplicate-trip.tip.1':
    'Se copian los días, los lugares, las excursiones y las rutas por carretera, las reservas, las partidas del presupuesto, las listas de equipaje, las tareas y las notas de los días; las listas de equipaje y las tareas se copian sin marcar. No se copian los miembros, el chat, las encuestas, los archivos ni los enlaces compartidos.',

  // archive-trip
  'help.guide.archive-trip.title': 'Archivar y restaurar un viaje',
  'help.guide.archive-trip.goal': 'Quita un viaje de tu lista sin borrarlo y recupéralo cuando quieras.',
  'help.guide.archive-trip.step.1': 'Haz clic en el icono de archivar, en la esquina superior derecha de la tarjeta.',
  'help.guide.archive-trip.step.2':
    'Para volver a verlo, cambia el filtro que hay encima de las tarjetas a «Archivado».',
  'help.guide.archive-trip.step.3':
    'Haz clic en Restaurar en la tarjeta para devolverlo a «Planeado», o a «Completado» si sus fechas ya han pasado.',
  'help.guide.archive-trip.result':
    'Los viajes archivados conservan todos sus datos. Ya no aparecen en el panel ni en el calendario de todos los viajes.',

  // delete-trip
  'help.guide.delete-trip.title': 'Eliminar un viaje',
  'help.guide.delete-trip.goal': 'Elimina un viaje definitivamente.',
  'help.guide.delete-trip.step.1': 'Haz clic en el icono de la papelera, en la esquina superior derecha de la tarjeta.',
  'help.guide.delete-trip.step.2':
    'Confirma con Eliminar. El cuadro indica el nombre del viaje, para que sepas que es el correcto.',
  'help.guide.delete-trip.result':
    'Se eliminan el viaje, sus días, lugares, reservas y archivos. No se puede deshacer, así que, si tienes dudas, mejor archiva el viaje.',

  // filter-and-view
  'help.guide.filter-and-view.title': 'Encontrar viajes completados y cambiar entre cuadrícula y lista',
  'help.guide.filter-and-view.goal': 'Consulta los viajes terminados o archivados y elige la vista que prefieras.',
  'help.guide.filter-and-view.step.1':
    'Usa «Planeado», «Archivado» y «Completado», encima de las tarjetas. En «Completado» están todos los viajes cuya fecha de fin ya ha pasado.',
  'help.guide.filter-and-view.step.2':
    'Haz clic en el icono de lista para pasar a una lista compacta; vuelve a hacer clic para volver a la cuadrícula.',
  'help.guide.filter-and-view.result': 'El panel recuerda tu vista en este dispositivo.',

  // calendar-feed
  'help.guide.calendar-feed.title': 'Suscribirte a todos tus viajes desde tu calendario',
  'help.guide.calendar-feed.goal':
    'Consulta en tu aplicación de calendario los días y las reservas de todos los viajes activos, siempre sincronizados.',
  'help.guide.calendar-feed.step.1': 'Haz clic en el icono del calendario, junto al selector de vista.',
  'help.guide.calendar-feed.step.2':
    'Haz clic en «Activar la suscripción al calendario». TREK crea un enlace privado al feed.',
  'help.guide.calendar-feed.step.3':
    'Haz clic en «Añadir a Google Calendar» o en «Añadir a Calendario de Apple / Outlook». Para cualquier otra aplicación de calendario, abre «O copia un enlace manualmente» y copia el enlace desde ahí.',
  'help.guide.calendar-feed.result':
    'Todos tus viajes activos aparecen en tu calendario y se actualizan solos. No se incluyen los viajes archivados ni los que terminaron hace más de 90 días.',
  'help.guide.calendar-feed.tip.1':
    'No compartas el enlace: cualquiera que lo tenga puede leer el feed. Si llega a otras personas, «Regenerar» te da un enlace nuevo y el antiguo deja de funcionar. «Desactivar» elimina el enlace por completo.',

  // widgets
  'help.guide.widgets.title': 'Elegir los widgets del panel',
  'help.guide.widgets.goal': 'Muestra u oculta la fila de estadísticas y los widgets de la derecha.',
  'help.guide.widgets.step.1': 'Abre el menú de tu avatar, en la esquina superior derecha, y elige «Ajustes».',
  'help.guide.widgets.step.2': 'Cambia a la pestaña «Apariencia».',
  'help.guide.widgets.step.3':
    'En «Widgets del panel», activa o desactiva cada widget, por separado para escritorio y para móvil. «Barra lateral derecha» desactiva de una vez toda la columna derecha.',
  'help.guide.widgets.step.4': 'Vuelve al panel. El cambio se aplica al momento.',
  'help.guide.widgets.result':
    'Al ocultar widgets, tus viajes tienen más espacio. Desactiva toda la barra lateral derecha para centrar el diseño.',
  'help.guide.widgets.link': 'Abrir los ajustes de «Apariencia»',

  // currency-widget
  'help.guide.currency-widget.title': 'Convertir divisas',
  'help.guide.currency-widget.goal': 'Convierte un importe entre dos monedas con el tipo de cambio actual.',
  'help.guide.currency-widget.step.1': 'Escribe el importe y elige las dos monedas.',
  'help.guide.currency-widget.step.2':
    'La flecha entre ellas intercambia las monedas; la flecha circular actualiza el tipo de cambio.',
  'help.guide.currency-widget.result':
    'Tu par de monedas se guarda en tu cuenta, así que es el mismo en todos tus dispositivos.',
  'help.guide.currency-widget.tip.1':
    'Los tipos de cambio proceden del servicio gratuito Frankfurter. La flecha circular de la esquina del widget descarga los más recientes.',

  // timezones-widget
  'help.guide.timezones-widget.title': 'Añadir relojes mundiales',
  'help.guide.timezones-widget.goal': 'Consulta la hora local de tus destinos.',
  'help.guide.timezones-widget.step.1':
    'Haz clic en + en el widget «Zonas horarias», busca una ciudad, por ejemplo Lisboa, y elígela en la lista.',
  'help.guide.timezones-widget.step.2':
    'Para quitar un reloj, pasa el cursor por encima y haz clic en la × que aparece a la derecha.',
  'help.guide.timezones-widget.result': 'Tus relojes se guardan en tu cuenta.',
  'help.guide.search-trips.title': 'Buscar en tus viajes',
  'help.guide.search-trips.goal':
    'Encuentra un viaje por su nombre, por una fecha o por un lugar que planificaste en él, incluidos los viajes archivados.',
  'help.guide.search-trips.step.1':
    'Escribe en «Buscar viajes o lugares», encima de las tarjetas. La lista se filtra mientras escribes, en los viajes planeados, archivados y completados a la vez.',
  'help.guide.search-trips.step.2':
    'Si un viaje coincide por uno de sus lugares, ese lugar aparece bajo el título del viaje. Haz clic en la x del cuadro, o pulsa Escape, para volver a ver todos tus viajes.',
  'help.guide.search-trips.result':
    'El panel muestra solo los viajes que coinciden. Borra el cuadro de búsqueda para volver a verlos todos.',
  'help.guide.search-trips.tip.1':
    'También puedes buscar por fecha: escribe un mes y un año, por ejemplo mayo de 2027, o 2027-05, y verás los viajes de ese mes.',
  'help.guide.search-trips.tip.2':
    'Mientras haya una búsqueda activa, el selector «Planeado», «Archivado» y «Completado» no se aplica, así que ningún viaje se queda oculto por un filtro equivocado.',

  // ── Screen: vacay ──────────────────────────────────────────────────────────
  'help.ctx.vacay.title': 'Vacaciones',
  'help.ctx.vacay.summary':
    '«Vacaciones» es tu planificador personal de días libres: cuántos días de vacaciones tienes al año, cuáles has registrado y cuántos te quedan. La cuadrícula muestra el año entero. La barra lateral contiene el selector de año, las personas con las que planificas, los calendarios que te han compartido, la leyenda y tus días disponibles.',
  'help.ctx.vacay.bullet.1':
    'Cuadrícula anual: doce tarjetas de mes, con una casilla por día. Haz clic en un día para registrarlo o quitarlo. Un pequeño punto azul marca los días que ya ocupa un viaje.',
  'help.ctx.vacay.bullet.2':
    'Barra de herramientas inferior: el primer botón, con tu nombre y tu color, registra vacaciones; «Festivo de empresa» marca los días en que libra toda la empresa. «Medio día» y «Compensación» cambian lo que registra cada clic, y «Medio día» también sirve para los festivos de empresa.',
  'help.ctx.vacay.bullet.3':
    '«Derecho»: «Días», «Usado» y «Restantes» del año seleccionado, con los días arrastrados del año anterior y los días de compensación al lado. Haz clic en el título de la tarjeta para plegarla.',
  'help.ctx.vacay.bullet.4':
    '«Personas» son quienes comparten tu plan, cada una con su color. «Calendarios compartidos» muestra los días libres de otras personas como anillos de color. No se pueden editar.',
  'help.ctx.vacay.bullet.5':
    'Los ajustes incluyen los fines de semana, el primer día de la semana, los días arrastrados, tu año de vacaciones, los festivos de empresa, los calendarios de festivos y de vacaciones escolares y, si planificas junto a otra persona, «Deshacer fusión».',
  // log-day
  'help.guide.log-day.title': 'Registrar un día de vacaciones',
  'help.guide.log-day.goal': 'Marca un día libre en la cuadrícula del año y mira cómo se actualiza tu saldo.',
  'help.guide.log-day.step.1':
    'Comprueba el primer botón de la barra de herramientas inferior. Cuando muestra tu nombre y tu color, cada clic en un día registra un día de vacaciones para ti.',
  'help.guide.log-day.step.2':
    'Haz clic en un día de cualquier tarjeta de mes. El día se rellena con tu color y «Usado» sube un día.',
  'help.guide.log-day.step.3': 'Haz clic otra vez en el mismo día para quitarlo.',
  'help.guide.log-day.result':
    'El día queda registrado. «Días», «Usado» y «Restantes» se actualizan al momento, y todas las personas fusionadas en tu plan ven el cambio enseguida.',
  'help.guide.log-day.tip.1':
    'Mientras «Bloquear fines de semana» esté activado en «Ajustes», no se pueden registrar fines de semana. Un día de fin de semana registrado antes se puede seguir quitando.',
  'help.guide.log-day.tip.2':
    'Un punto azul en una casilla indica que uno de tus viajes ocupa ese día, para que veas dónde coinciden las vacaciones y los viajes.',
  // half-day
  'help.guide.half-day.title': 'Registrar medio día',
  'help.guide.half-day.goal': 'Tómate una tarde libre y gasta solo medio día de vacaciones.',
  'help.guide.half-day.step.1':
    'Activa «Medio día» en la barra de herramientas. Su punto naranja es el que marca un medio día en la cuadrícula.',
  'help.guide.half-day.step.2': 'Haz clic en un día. Se registra como 0,5 y muestra un punto naranja en la esquina.',
  'help.guide.half-day.step.3':
    'Cuando termines, vuelve a desactivar «Medio día». Si haces clic en un medio día con otros ajustes, pasa a tener los ajustes actuales.',
  'help.guide.half-day.result':
    '«Usado» sube 0,5. «Medio día» y «Compensación» son independientes, así que también puedes registrar medio día de compensación.',
  'help.guide.half-day.tip.1':
    'La barra de herramientas siempre muestra la marca que pondrá tu próximo clic, para que lo compruebes antes de registrar.',
  // comp-day
  'help.guide.comp-day.title': 'Registrar un día de compensación',
  'help.guide.comp-day.goal': 'Tómate días compensatorios sin gastar días de vacaciones.',
  'help.guide.comp-day.step.1':
    'Activa «Compensación» en la barra de herramientas. El disco rayado es el que marca un día de compensación en la cuadrícula.',
  'help.guide.comp-day.step.2':
    'Haz clic en un día. En lugar de un color sólido, se rellena con rayas diagonales de tu color.',
  'help.guide.comp-day.result':
    'Los días compensatorios se cuentan junto a las tarjetas de días disponibles y nunca reducen «Restantes».',
  'help.guide.comp-day.tip.1':
    'Úsalo para horas extra que te tomas como tiempo libre, horario flexible o días compensatorios: cualquier día libre que no sea de vacaciones.',
  // entitlement
  'help.guide.entitlement.title': 'Definir tus días de vacaciones',
  'help.guide.entitlement.goal': 'Indica en «Vacaciones» cuántos días de vacaciones tienes al año.',
  'help.guide.entitlement.step.1':
    'En la tarjeta «Derecho» de la barra lateral, haz clic en la casilla «Días» de tu fila. Si la tarjeta está plegada, haz clic en su título para desplegarla.',
  'help.guide.entitlement.step.2':
    'Escribe tu número de días y pulsa Intro. Pulsa Escape para mantener el valor anterior.',
  'help.guide.entitlement.result':
    '«Restantes» se recalcula a partir de tus días disponibles, los días arrastrados y los días usados.',
  'help.guide.entitlement.tip.1':
    'Cada año tiene sus propios días disponibles, así que lo que cambies aquí solo afecta al año seleccionado.',
  // years
  'help.guide.years.title': 'Añadir años y cambiar de año',
  'help.guide.years.goal': 'Planifica ya el año que viene o consulta el anterior.',
  'help.guide.years.step.1':
    'Haz clic en el + a la derecha del año para añadir el año siguiente, o en el + de la izquierda para el anterior.',
  'help.guide.years.step.2': 'Cambia de año con las flechas o con las etiquetas de año de debajo.',
  'help.guide.years.step.3':
    'Para quitar un año, pasa el cursor por su etiqueta y haz clic en el pequeño menos. También se borran todas sus entradas, así que confírmalo con cuidado.',
  'help.guide.years.result':
    'Cada año tiene sus propios días disponibles y sus entradas. Los días arrastrados enlazan un año con el siguiente.',
  // company-holidays
  'help.guide.company-holidays.title': 'Marcar los festivos de empresa',
  'help.guide.company-holidays.goal':
    'Bloquea los días en que cierra toda la empresa sin descontarlos de los días de nadie.',
  'help.guide.company-holidays.step.1':
    'Abre Ajustes y comprueba que «Festivos de empresa» está activado. Viene activado por defecto. La barra de herramientas solo muestra el modo mientras esté activado.',
  'help.guide.company-holidays.step.2':
    'De vuelta en la cuadrícula, cambia la barra de herramientas a «Festivo de empresa».',
  'help.guide.company-holidays.step.3':
    'Haz clic en los días. Se ponen en ámbar y aparecen en la leyenda. Vuelve a hacer clic en un día para quitarlo.',
  'help.guide.company-holidays.result':
    'Todas las personas fusionadas en el plan ven los festivos de empresa, y estos nunca reducen «Restantes».',
  'help.guide.company-holidays.tip.1':
    'Cualquier persona fusionada puede editar los festivos de empresa, así que acordad quién se encarga de ellos.',
  // public-holidays
  'help.guide.public-holidays.title': 'Mostrar los festivos',
  'help.guide.public-holidays.goal': 'Muestra en la cuadrícula los festivos de tu país o región.',
  'help.guide.public-holidays.step.1': 'Abre «Ajustes» y activa «Festivos».',
  'help.guide.public-holidays.step.2':
    'Haz clic en «Añadir calendario» y elige el país y, si hace falta, la región. También puedes darle un color y una etiqueta. Después haz clic en Añadir.',
  'help.guide.public-holidays.step.3': 'Cierra «Ajustes». Los festivos aparecen en la cuadrícula y en la leyenda.',
  'help.guide.public-holidays.result':
    'Los festivos se marcan con el color del calendario y nunca se descuentan de tus días disponibles.',
  'help.guide.public-holidays.tip.1':
    'Puedes añadir varios calendarios, por ejemplo el de tu región y el de un compañero fusionado.',
  // school-holidays
  'help.guide.school-holidays.title': 'Mostrar las vacaciones escolares',
  'help.guide.school-holidays.goal': 'Consulta las vacaciones escolares de tu región junto a tus propios días libres.',
  'help.guide.school-holidays.step.1': 'Abre «Ajustes» y activa «Vacaciones escolares».',
  'help.guide.school-holidays.step.2':
    'Haz clic en «Añadir calendario» y elige el país. Si el país tiene calendarios distintos, elige también la región o el grupo y haz clic en Añadir.',
  'help.guide.school-holidays.step.3':
    'Cierra «Ajustes». Las vacaciones escolares se sombrean con el color del calendario y llevan una barra de color en la parte inferior de sus días.',
  'help.guide.school-holidays.result':
    'Las vacaciones escolares solo se muestran en el calendario: nunca restan días a nadie.',
  'help.guide.school-holidays.tip.1':
    '¿No aparece tu región? Tu administrador puede introducir las vacaciones escolares a mano en «Administrador», «Personalización», «Vacaciones escolares».',
  // weekends
  'help.guide.weekends.title': 'Bloquear los fines de semana y elegir el primer día de la semana',
  'help.guide.weekends.goal': 'Excluye los fines de semana del recuento y empieza la semana el día que prefieras.',
  'help.guide.weekends.step.1': 'Abre «Ajustes».',
  'help.guide.weekends.step.2':
    'Activa «Bloquear fines de semana» y, en «Días de fin de semana», elige los días que cuentan como tu fin de semana.',
  'help.guide.weekends.step.3': 'En «La semana comienza el», elige «Lun» o «Dom».',
  'help.guide.weekends.result':
    'Los días bloqueados aparecen en gris en la cuadrícula y no se pueden registrar por error.',
  // leave-year
  'help.guide.leave-year.title': 'Definir tu año de vacaciones',
  'help.guide.leave-year.goal':
    'Cuenta tus días disponibles por año fiscal o desde tu fecha de alta, en vez de enero a diciembre.',
  'help.guide.leave-year.step.1': 'Abre «Ajustes» y busca «Año de vacaciones».',
  'help.guide.leave-year.step.2':
    'Elige «Calendario», «Año fiscal» (con el mes y el día en que empieza) o «Fecha de alta» (con la fecha en que te contrataron).',
  'help.guide.leave-year.result':
    'Los días disponibles, los días usados y los arrastrados se calculan para ese periodo, y la cuadrícula empieza por su primer mes.',
  'help.guide.leave-year.tip.1':
    'Este ajuste es personal: en un plan fusionado, cada persona mantiene su propio año de vacaciones y sus cifras.',
  // carry-over
  'help.guide.carry-over.title': 'Pasar los días no usados al año siguiente',
  'help.guide.carry-over.goal': 'Pasa al periodo siguiente los días que te sobren al final de uno.',
  'help.guide.carry-over.step.1': 'Abre «Ajustes».',
  'help.guide.carry-over.step.2': 'Activa «Arrastrar saldo».',
  'help.guide.carry-over.result':
    'Los días arrastrados se recalculan en todos tus años y aparecen debajo de los días disponibles.',
  'help.guide.carry-over.tip.1': 'Al desactivarlo, todos los saldos de días arrastrados vuelven a cero.',
  // invite
  'help.guide.invite.title': 'Planificar junto a otra persona',
  'help.guide.invite.goal':
    'Une tu plan con el de otro usuario de TREK para que los dos veáis vuestros días libres en una sola cuadrícula.',
  'help.guide.invite.step.1': 'Haz clic en el icono de la persona en la tarjeta «Personas».',
  'help.guide.invite.step.2': 'Elige al usuario y haz clic en «Enviar invitación».',
  'help.guide.invite.step.3':
    'La otra persona recibe una notificación y una «Solicitud de fusión» la próxima vez que abra «Vacaciones». Hasta entonces, la invitación aparece como pendiente; pasa el cursor por encima para cancelarla.',
  'help.guide.invite.result':
    'Los dos planes se unen: cada persona tiene su color, podéis registrar días el uno por el otro y todo se sincroniza en directo.',
  'help.guide.invite.tip.1':
    'Para deshacer una fusión, haz clic en Disolver en «Ajustes». Las entradas de cada persona vuelven a su propio plan.',
  'help.guide.invite.tip.2':
    'Si la otra persona solo tiene que ver tus días, comparte tu calendario en lugar de fusionarlo.',
  // share-calendar
  'help.guide.share-calendar.title': 'Compartir tu calendario en modo de solo lectura',
  'help.guide.share-calendar.goal': 'Permite que alguien vea cuándo libras sin que pueda cambiar tu plan.',
  'help.guide.share-calendar.step.1': 'Haz clic en el icono de compartir en la tarjeta «Calendarios compartidos».',
  'help.guide.share-calendar.step.2': 'Elige al usuario y haz clic en Compartir. No hace falta que lo acepte.',
  'help.guide.share-calendar.step.3':
    'Los calendarios que te han compartido aparecen arriba de la tarjeta: haz clic en uno para ocultarlo o mostrarlo, o pasa el cursor por encima y haz clic en la x para quitarlo. En «Compartes con», pasa el cursor por un nombre y haz clic en «Dejar de compartir».',
  'help.guide.share-calendar.result':
    'Tus días libres aparecen como un anillo de color en su cuadrícula. No puede editar nada de lo que compartes.',
  'help.guide.share-calendar.tip.1':
    'Compartir y fusionar son independientes: puedes estar fusionado con una persona y compartir con otras.',
  'help.guide.share-calendar.tip.2':
    'Pasa el ratón por encima de un día con un anillo para ver quién libra y durante cuánto tiempo.',

  // ── Screen: atlas ─────────────────────────────────────────────────────────────────────
  'help.ctx.atlas.title': 'Atlas',
  'help.ctx.atlas.summary':
    'Atlas muestra en un mapa del mundo los lugares por los que has viajado: cada país al que te ha llevado un viaje aparece coloreado, y puedes añadir a mano los países que visitaste antes de usar TREK. Acerca el mapa para ver las regiones, guarda una lista de deseos con los lugares que aún quieres conocer y consulta tus cifras en el panel translúcido de abajo.',
  'help.ctx.atlas.bullet.1':
    'El mapa: cada país visitado tiene su propio color fijo, los países planeados tienen un contorno discontinuo, los de la lista de deseos tienen rayas diagonales y el resto aparece en gris. Pasa el cursor por un país para ver sus viajes, sus lugares y tu primera y última visita.',
  'help.ctx.atlas.bullet.2':
    'Búsqueda, arriba: escribe un país o un lugar. Si no has estado en el país, se abre su ventana emergente. Si has estado, aparece su tarjeta en el panel. Si eliges un lugar, el mapa abre su región para que puedas marcarla.',
  'help.ctx.atlas.bullet.3':
    '«Mostrar países planeados», arriba a la derecha: muestra los países de tus próximos viajes. El interruptor solo aparece si tienes alguno.',
  'help.ctx.atlas.bullet.4':
    'Panel inferior: la pestaña «Estadísticas» con los países (y a su lado los planeados), regiones, viajes, lugares, ciudades, días, continentes, tu racha y los viajes de este año; la pestaña «Lista de deseos» con los lugares que aún quieres visitar; y, con el complemento «Excursiones», una pestaña «Excursiones» con la distancia y el desnivel de las excursiones que has hecho.',
  'help.ctx.atlas.bullet.5':
    'Regiones: al acercar mucho el zoom, el mapa muestra estados y provincias. Haz clic en uno para marcarlo, desmarcarlo o añadirlo a la lista de deseos.',
  'help.ctx.atlas.bullet.6':
    'Dawarich: con el complemento conectado, un panel a la izquierda de las estadísticas marca deseos como cumplidos y añade países a partir de tus grabaciones. Solo lo hace después de que lo confirmes.',
  // mark-country
  'help.guide.mark-country.title': 'Marcar un país como visitado',
  'help.guide.mark-country.goal':
    'Añade un país que visitaste antes de usar TREK para que aparezca en el mapa y en tu recuento.',
  'help.guide.mark-country.step.1': 'Escribe el país en el cuadro de búsqueda de la parte superior del mapa.',
  'help.guide.mark-country.step.2':
    'Elígelo en la lista. El mapa se desplaza hasta el país y se abre una ventana con su información.',
  'help.guide.mark-country.step.3': 'Elige «Marcar como visitado».',
  'help.guide.mark-country.result':
    'El país toma un color en el mapa y el recuento de «Países» sube en uno. Ese color es permanente: al marcar más países, los colores de los demás no cambian.',
  'help.guide.mark-country.tip.1':
    'Al hacer clic en un país gris del mapa se abre la misma ventana emergente. Para países pequeños, la búsqueda es más fiable.',
  'help.guide.mark-country.tip.2':
    'Un país que marcas a mano siempre cuenta como visitado, sean cuales sean las fechas de los viajes a ese país.',
  // unmark-country
  'help.guide.unmark-country.title': 'Quitar un país que has marcado',
  'help.guide.unmark-country.goal': 'Quita del mapa un país que marcaste a mano.',
  'help.guide.unmark-country.step.1':
    'Busca el país y elígelo, o haz clic en él en el mapa. Si es un país que marcaste tú, la ventana te pregunta si quieres quitarlo.',
  'help.guide.unmark-country.step.2': 'Confirma con Eliminar.',
  'help.guide.unmark-country.result': 'El país vuelve a aparecer en gris y deja de contarse.',
  'help.guide.unmark-country.tip.1':
    'Así solo se pueden quitar los países que marcaste a mano. Un país con viajes o lugares sigue marcado hasta que se quiten esos viajes o lugares. En un país marcado a mano, Eliminar también está en su tarjeta de detalle del panel.',
  // country-details
  'help.guide.country-details.title': 'Ver lo que hiciste en un país',
  'help.guide.country-details.goal': 'Abre un país visitado y ve directamente a los viajes que te llevaron allí.',
  'help.guide.country-details.step.1':
    'Escribe un país que hayas visitado en el cuadro de búsqueda de la parte superior del mapa.',
  'help.guide.country-details.step.2':
    'Elígelo. El mapa se desplaza hasta allí y aparece una tarjeta en el panel inferior. La tarjeta muestra la bandera del país, insignias con sus lugares, viajes y regiones visitadas, y una etiqueta para cada uno de sus tres primeros viajes.',
  'help.guide.country-details.result': 'Haz clic en la etiqueta de un viaje para abrirlo en el planificador.',
  'help.guide.country-details.tip.1':
    'Al pasar el ratón por el país en el mapa ves las mismas cifras, además de la primera y la última visita.',
  // planned-countries
  'help.guide.planned-countries.title': 'Mostrar los países a los que vas a ir',
  'help.guide.planned-countries.goal':
    'Muestra en el mapa los países de tus próximos viajes sin contarlos como visitados.',
  'help.guide.planned-countries.step.1':
    'Activa «Mostrar países planeados», arriba a la derecha. El número de al lado indica cuántos países planeados hay.',
  'help.guide.planned-countries.step.2':
    'Busca un país planeado y elígelo: el panel indica «Planeado» y la descripción emergente del mapa muestra cuándo vas.',
  'help.guide.planned-countries.result':
    'Los países planeados aparecen con un contorno discontinuo, así nunca se confunden con los que ya has visitado. El interruptor recuerda tu elección.',
  'help.guide.planned-countries.tip.1':
    'Un país cuenta como visitado en cuanto empieza el viaje a ese país. Los viajes en curso también cuentan. Los viajes sin fechas no entran en las estadísticas.',
  'help.guide.planned-countries.tip.2': 'El interruptor solo aparece si tienes viajes próximos.',
  // regions
  'help.guide.regions.title': 'Marcar una región',
  'help.guide.regions.goal': 'Marca los estados, provincias o prefecturas en los que has estado, no solo los países.',
  'help.guide.regions.step.1':
    'Acerca el zoom a un país hasta que aparezcan los límites de sus estados y provincias. Si buscas el país y lo eliges, el mapa se acerca lo suficiente.',
  'help.guide.regions.step.2':
    'Haz clic en una región. Al pasar el cursor por una región, aparece su nombre. La ventana emergente muestra la región y su país.',
  'help.guide.regions.step.3': 'Elige «Marcar como visitado».',
  'help.guide.regions.result':
    'La región se rellena con el color del país. Al marcar una región, el país también cuenta como visitado si aún no lo estaba.',
  'help.guide.regions.tip.1':
    'Al hacer clic en una región visitada, aparece «Eliminar», tanto si la marcaste tú como si se añadió por un lugar.',
  'help.guide.regions.tip.2':
    'Las regiones en las que tienes lugares reales se marcan automáticamente. No tienes que hacer nada.',
  // search-place
  'help.guide.search-place.title': 'Buscar un lugar y marcar su región',
  'help.guide.search-place.goal': 'Marca Baviera buscando Múnich, sin necesidad de saber en qué región está la ciudad.',
  'help.guide.search-place.step.1':
    'Escribe una ciudad, un monumento o una dirección en el cuadro de búsqueda. Primero aparecen los países; los lugares que coinciden aparecen debajo, en «Lugares».',
  'help.guide.search-place.step.2':
    'Elige el lugar. El mapa se desplaza hasta allí y encuentra la región en la que está ese punto.',
  'help.guide.search-place.step.3':
    'Elige «Marcar como visitado» para esa región, o «Añadir a lista de deseos» si aún no has estado.',
  'help.guide.search-place.result':
    'Se marcan la región y también el país. Si el paquete de mapas no tiene datos de regiones para ese país, se marca directamente el país.',
  'help.guide.search-place.tip.1':
    'Los lugares salen de la misma búsqueda que en el resto de TREK, así que usan el proveedor que haya configurado tu administrador.',
  // bucket-country
  'help.guide.bucket-country.title': 'Añadir un país a la lista de deseos',
  'help.guide.bucket-country.goal':
    'Ten en el mapa una lista de países que quieres visitar, aparte de los que ya has visitado.',
  'help.guide.bucket-country.step.1': 'Busca el país y elígelo, o haz clic en él en el mapa.',
  'help.guide.bucket-country.step.2': 'Elige «Añadir a lista de deseos».',
  'help.guide.bucket-country.step.3':
    'Elige un mes y un año si ya sabes cuándo, y confirma con «Añadir a lista de deseos».',
  'help.guide.bucket-country.result':
    'El país aparece con rayas diagonales del color que tendrá cuando lo visites, y se añade a la pestaña «Lista de deseos» del panel.',
  'help.guide.bucket-country.tip.1':
    'Cuando el país ya está en la lista, la misma ventana ofrece «Quitar de la lista de deseos».',
  'help.guide.bucket-country.tip.2':
    'Una entrada por fecha objetivo: el mismo país puede estar en la lista para dos meses distintos, pero no dos veces para el mismo mes.',
  // bucket-place
  'help.guide.bucket-place.title': 'Añadir un lugar a la lista de deseos',
  'help.guide.bucket-place.goal':
    'Guarda una ciudad, un monumento o una dirección que quieras visitar, con sus coordenadas y una fecha objetivo.',
  'help.guide.bucket-place.step.1': 'Abre la pestaña «Lista de deseos» en el panel inferior.',
  'help.guide.bucket-place.step.2': 'Haz clic en «Añadir lugar».',
  'help.guide.bucket-place.step.3':
    'Escribe el nombre y pulsa el botón de búsqueda; elige el resultado correcto para que el lugar tenga coordenadas. También puedes escribir solo el nombre y saltarte la búsqueda.',
  'help.guide.bucket-place.step.4': 'Si quieres, elige un mes y un año, y haz clic en «Añadir».',
  'help.guide.bucket-place.result':
    'El lugar aparece arriba de tu lista de deseos con su fecha objetivo. Pasa el cursor por encima para ver la × que lo quita.',
  'help.guide.bucket-place.tip.1':
    'Dawarich solo puede marcar después un deseo como cumplido si tiene coordenadas. Lo hace en cuanto tus grabaciones muestran que estuviste allí.',
  // stats
  'help.guide.stats.title': 'Consultar tus estadísticas',
  'help.guide.stats.goal': 'Descubre qué cuentan las cifras del panel y qué no.',
  'help.guide.stats.step.1':
    '«Países» es el número de países distintos en los que has estado realmente. Los países planeados se muestran debajo del número y no cuentan. «Regiones» cuenta los estados y provincias en los que has estado. «Viajes», «Lugares» y «Días» son totales de todos tus viajes. «Ciudades» se calcula a partir de las direcciones de tus lugares, así que es una estimación.',
  'help.guide.stats.step.2':
    'Los continentes muestran los países visitados por continente. La Antártida aparece en la fila cuando la hayas visitado. Después vienen tu racha (años seguidos con al menos un viaje) y cuántos viajes has hecho este año.',
  'help.guide.stats.result':
    'Las cifras se actualizan solas a medida que planificas tus viajes. Aquí no tienes que mantener nada.',
  'help.guide.stats.tip.1':
    'Las ciudades se sacan del texto de la dirección, no se consultan en ningún sitio. Por eso una dirección corta como «Osteria Francescana, Italy», o una que termina en una prefectura, puede contarse como región en vez de como ciudad.',
  'help.guide.stats.tip.2':
    'Los países que marcas a mano cuentan en «Países» y en los continentes, pero no suman viajes, lugares ni días.',
  // dawarich-countries
  'help.guide.dawarich-countries.title': 'Añadir países a partir de tus grabaciones',
  'help.guide.dawarich-countries.goal':
    'Usa Dawarich para saber en qué países estuviste durante el último año y añade al mapa los que confirmes.',
  'help.guide.dawarich-countries.step.1':
    'Con el complemento de Dawarich conectado, aparece en la parte inferior del mapa, a la izquierda de las estadísticas, un panel de Dawarich con dos casillas. Haz clic en «Países».',
  'help.guide.dawarich-countries.step.2':
    'El cuadro se abre en su pestaña «Países». Haz clic en «Buscar países»: TREK lee los países y ciudades que cubren tus grabaciones de los últimos 12 meses, mes a mes, así que puede tardar un poco. Cada país que aún no está en tu atlas aparece con su bandera, el número de ciudades y el nombre de la primera ciudad. Todos los países aparecen marcados de forma predeterminada. Haz clic en una fila para excluirla.',
  'help.guide.dawarich-countries.step.3':
    'Confirma con el botón de abajo a la derecha, que indica «Add 5 countries» cuando hay cinco filas marcadas. El cuadro indica cuántos se han añadido. Al cerrarlo, el mapa ya está actualizado.',
  'help.guide.dawarich-countries.result':
    'Los países confirmados se colorean en el mapa y se suman a «Países», registrados como procedentes de Dawarich. Los países que marcaste a mano no cambian.',
  'help.guide.dawarich-countries.tip.1':
    'Los países que el Atlas ya muestra como visitados, ya sea a mano, por un viaje o por una comprobación anterior, se omiten, así que tus propias marcas nunca cambian. Si confirmas aquí un país que habías quitado del Atlas, se vuelve a añadir.',
  'help.guide.dawarich-countries.tip.2':
    'Si TREK no reconoce el nombre de un país, lo muestra debajo de las filas en lugar de descartarlo. «Volver a comprobar» vuelve a consultar a Dawarich. La nota bajo la lista indica que se han revisado los últimos 12 meses. Este periodo no se puede cambiar.',
  // dawarich-wishes
  'help.guide.dawarich-wishes.title': 'Marcar deseos cumplidos a partir de tus grabaciones',
  'help.guide.dawarich-wishes.goal':
    'Averigua a qué lugares de tu lista de deseos has llegado realmente y márcalos como alcanzados con la fecha en que llegaste.',
  'help.guide.dawarich-wishes.step.1':
    'En el panel de Dawarich de la parte inferior del mapa, a la izquierda de las estadísticas, haz clic en «Lista de deseos».',
  'help.guide.dawarich-wishes.step.2':
    'El cuadro se abre en su pestaña «Lista de deseos». Haz clic en «Comprobar la lista de deseos»: TREK revisa tus grabaciones para cada entrada que tenga coordenadas. Un deseo alcanzado aparece con lo cerca que llegaste, cuánto tiempo estuviste y el día, y aparece marcado de forma predeterminada. Uno que ya habías marcado indica «Ya tachado». Debajo de la lista, una nota cuenta las entradas sin coordenadas y muestra también la regla: «A wish counts as reached within 250 m and after 20 minutes on the spot».',
  'help.guide.dawarich-wishes.step.3':
    'Confirma con el botón de abajo a la derecha, que pone «Tachar 2» cuando hay dos filas marcadas. Después cierra el diálogo y abre la pestaña «Lista de deseos» del panel de al lado.',
  'help.guide.dawarich-wishes.result':
    'Cada deseo recibe una marca verde con la fecha de la estancia, no con la de hoy. Su descripción emergente dice «Tachado a partir de tus grabaciones de Dawarich». Haz clic en la fecha para deshacerlo.',
  'help.guide.dawarich-wishes.tip.1':
    'Pasar cerca no basta: tienes que estar junto al lugar y quedarte allí un tiempo. Si hay varias estancias que cumplen la condición, se toma la más larga. Un deseo sin coordenadas no se puede comprobar, así que añade los lugares con la búsqueda de «Añadir lugar» y no solo por el nombre.',
  'help.guide.dawarich-wishes.tip.2':
    'Cada comprobación revisa hasta 50 entradas, empezando por las que aún no están marcadas. Si hay más, TREK te lo indica. Un deseo que ya estaba marcado conserva su propia fecha.',

  // ── Screen: collections ───────────────────────────────────────────────────────────────
  'help.ctx.collections.title': 'Colecciones',
  'help.ctx.collections.summary':
    '«Colecciones» es tu biblioteca fuera de los viajes: listas con nombre de los lugares que has descubierto y quieres guardar, cada uno con el estado «Idea», «Quiero ir» o «Visitado» y, con «Excursiones» activado, excursiones completas que guardaste de un viaje. Los lugares y las excursiones se copian a los viajes y desde ellos, nunca se vinculan, así que una lista y un viaje nunca se modifican entre sí.',
  'help.ctx.collections.bullet.1':
    'La columna de listas de la izquierda muestra tus propias listas, las que te han compartido, las invitaciones que aún no has respondido y «Todos los guardados», que reúne todo lo de las listas que te pertenecen. Arriba están «Nueva lista» y la importación de archivos.',
  'help.ctx.collections.bullet.2':
    'La cabecera de la lista abierta muestra su color, portada, descripción y enlaces, los miembros y, a la derecha, Editar (solo el propietario), Exportar y Compartir. En una lista que te han compartido, el botón Compartir indica «Compartida».',
  'help.ctx.collections.bullet.3':
    'Fila de filtros sobre los lugares: el + para añadir un lugar, los desplegables «Estado», «Categoría», «Valoración» y «Ordenar», el icono de la casilla para «Elegir» y el icono de la nube para «Importar de un viaje». El filtro de etiquetas solo aparece en esta fila cuando no se muestra ningún mapa.',
  'help.ctx.collections.bullet.4':
    'Filas de lugares: foto, nombre y dirección, etiquetas y categoría, y la píldora de estado a la derecha. Un clic en la píldora la pasa al siguiente estado.',
  'help.ctx.collections.bullet.5':
    'Mapa a la derecha: un marcador por cada lugar con coordenadas. Su barra superior tiene «Ampliar mapa» («Mostrar lista» cuando el mapa ocupa toda la vista), el filtro de etiquetas con el botón para gestionarlas y el cuadro «Buscar lugares». Haz clic en un marcador para abrir ese lugar.',
  'help.ctx.collections.bullet.6':
    'Ficha de detalle: haz clic en una fila para ver la portada, la categoría, el estado, la valoración con estrellas, las etiquetas, la descripción y los enlaces. La cámara de la portada cambia la foto. Abajo están Editar, «Copiar al viaje», el botón de navegación y «Quitar de la lista».',
  // create-list
  'help.guide.create-list.title': 'Crear una lista',
  'help.guide.create-list.goal': 'Crea una lista nueva con nombre, color y portada, lista para añadirle lugares.',
  'help.guide.create-list.step.1': 'Haz clic en «Nueva lista», en la parte superior de la barra lateral de listas.',
  'help.guide.create-list.step.2':
    'Ponle un nombre a la lista y elige un color. La imagen de portada, la descripción y los enlaces son opcionales; puedes añadirlos más tarde con Editar.',
  'help.guide.create-list.step.3': 'Haz clic en Crear.',
  'help.guide.create-list.result':
    'La lista se abre vacía, con «Añadir un lugar» e «Importar de un viaje» como las dos formas de llenarla.',
  'help.guide.create-list.tip.1':
    'La portada puede ser una imagen que subas tú o una encontrada con la búsqueda de Unsplash en el mismo cuadro.',
  // add-place
  'help.guide.add-place.title': 'Añadir un lugar',
  'help.guide.add-place.goal':
    'Busca un lugar y guárdalo en la lista abierta con nombre, categoría, estado y notas en un solo paso.',
  'help.guide.add-place.step.1':
    'Haz clic en el + al principio de la fila de filtros, encima de los lugares. En una lista todavía vacía, haz clic en «Añadir un lugar», en el centro de la página.',
  'help.guide.add-place.step.2':
    'Escribe el lugar en el campo de búsqueda y elige un resultado. El nombre, la dirección y las coordenadas se rellenan a partir de él.',
  'help.guide.add-place.step.3':
    'Elige el estado y, si quieres, una categoría, una descripción y enlaces, y haz clic en Añadir. El diálogo sigue abierto para el siguiente lugar; con Cancelar se cierra.',
  'help.guide.add-place.result': 'El lugar aparece en la lista y, si tiene coordenadas, como marcador en el mapa.',
  'help.guide.add-place.tip.1':
    'Desde un viaje, «Guardar en colección», en el detalle del lugar o en su menú, añade un lugar del viaje a una lista sin salir del viaje.',
  'help.guide.add-place.tip.2':
    'La lista tiene que ser tuya o una en la que seas editor o administrador; el + no aparece en «Todos los guardados» ni en las listas en las que solo eres lector.',
  // import-from-trip
  'help.guide.import-from-trip.title': 'Importar lugares de un viaje',
  'help.guide.import-from-trip.goal':
    'Añade de una vez a una lista todos los lugares de un viaje, en lugar de guardarlos uno a uno.',
  'help.guide.import-from-trip.step.1':
    'Haz clic en el botón de importar con la flecha y la nube, en la fila de filtros. Si la lista está vacía, el mismo botón está junto a «Añadir un lugar».',
  'help.guide.import-from-trip.step.2': 'Elige uno de tus viajes.',
  'help.guide.import-from-trip.step.3':
    'Marca los lugares que quieras. Los que ya están en la lista aparecen en gris. Al principio se seleccionan los lugares que no están en ningún día del viaje; si todos están ya en algún día, se seleccionan todos los nuevos. «Solo nuevos» oculta los lugares que la lista ya tiene.',
  'help.guide.import-from-trip.step.4': 'Haz clic en Importar. El botón indica siempre cuántos se van a añadir.',
  'help.guide.import-from-trip.result':
    'Los lugares se copian a la lista con su nombre, dirección, coordenadas, descripción y categoría. El viaje no cambia.',
  'help.guide.import-from-trip.tip.1':
    'TREK omite automáticamente los duplicados por nombre o coordenadas, así que puedes importar dos veces sin problema.',
  'help.guide.import-from-trip.tip.2':
    'En la lista de lugares de un viaje, el modo de selección ofrece en su lugar «Guardar en colección» para un conjunto de lugares elegidos a mano.',
  // place-status
  'help.guide.place-status.title': 'Definir el estado de un lugar',
  'help.guide.place-status.goal': 'Controla qué es una idea, qué está en tu lista de candidatos y dónde has estado.',
  'help.guide.place-status.step.1':
    'Haz clic en la etiqueta de estado, en el extremo derecho de la fila de un lugar. «Idea» pasa a «Quiero ir».',
  'help.guide.place-status.step.2':
    'Vuelve a hacer clic para marcarlo como «Visitado», y otra vez para volver a «Idea».',
  'help.guide.place-status.result':
    'La píldora y su color cambian al momento, y los recuentos del filtro de estado encima de la lista se actualizan.',
  'help.guide.place-status.tip.1':
    'El estado solo existe en Colecciones. Si copias un lugar a un viaje, su estado no se copia.',
  'help.guide.place-status.tip.2':
    'Desde un viaje, «Guardar en colección» abre «Guardar en una lista» con una píldora de estado por cada lista en la que está el lugar, y la barra de selección del panel de lugares tiene «Marcar como visitado en tus listas».',
  // place-detail
  'help.guide.place-detail.title': 'Abrir un lugar guardado',
  'help.guide.place-detail.goal':
    'Consulta todo sobre un lugar y lo que puedes hacer con él: editarlo, copiarlo a un viaje, ver cómo llegar o quitarlo.',
  'help.guide.place-detail.step.1':
    'Haz clic en la fila de un lugar. La ficha de detalle se abre junto a la lista y el mapa se desplaza hasta el lugar.',
  'help.guide.place-detail.step.2':
    'Abajo están Editar, «Copiar al viaje», el botón de navegación, que abre el lugar en una aplicación de mapas, y «Quitar de la lista». La cámara de la portada sustituye la foto automática por una tuya.',
  'help.guide.place-detail.result':
    'Con Editar puedes cambiar directamente en la ficha el nombre, la categoría, las etiquetas, la dirección, las coordenadas, la descripción y los enlaces.',
  'help.guide.place-detail.tip.1':
    'La portada se obtiene automáticamente si el lugar no tiene imagen propia. Puedes subir una propia en JPG, PNG, GIF, WebP o HEIC de hasta 20 MB. El icono de la papelera junto a la cámara recupera la foto automática.',
  'help.guide.place-detail.tip.2':
    'Todos los miembros, tú incluido, pueden valorar con estrellas debajo del estado; el filtro «Valoración» de la fila de filtros usa la media.',
  // labels
  'help.guide.labels.title': 'Agrupar lugares con etiquetas',
  'help.guide.labels.goal':
    'Dale a una lista sus propias etiquetas, como barrios o días, además de las categorías comunes.',
  'help.guide.labels.step.1':
    'Haz clic en «Añadir etiqueta», junto a las etiquetas encima del mapa («Gestionar etiquetas» cuando la lista ya tiene alguna). Si no se muestra ningún mapa, el botón está al final de la fila de filtros.',
  'help.guide.labels.step.2':
    'Escribe un nombre, elige un color y haz clic en «Añadir etiqueta». En el mismo diálogo puedes renombrar, cambiar de color o eliminar las etiquetas que ya tienes.',
  'help.guide.labels.step.3':
    'Activa «Elegir», marca los lugares y haz clic en «Asignar etiqueta» en la barra de selección; después elige las etiquetas y confirma con «Asignar etiqueta». Para un solo lugar, también puedes añadir etiquetas con Editar en su ficha de detalle.',
  'help.guide.labels.step.4':
    'Haz clic en una o varias etiquetas encima del mapa para ver solo los lugares que tienen alguna de ellas, en la lista y en el mapa. Vuelve a hacer clic en una etiqueta para quitarla del filtro.',
  'help.guide.labels.result':
    'Los lugares etiquetados muestran sus etiquetas en la fila; el filtro de etiquetas está disponible para todos los miembros, incluidos los lectores.',
  'help.guide.labels.tip.1':
    'Las etiquetas pertenecen a la lista en la que se crearon. Si mueves un lugar a otra lista, pierde sus etiquetas.',
  'help.guide.labels.tip.2': 'Para gestionar y asignar etiquetas necesitas permiso de edición en la lista.',
  // filter-select
  'help.guide.filter-select.title': 'Filtrar y seleccionar lugares',
  'help.guide.filter-select.goal': 'Filtra la lista y modifica muchos lugares a la vez.',
  'help.guide.filter-select.step.1':
    'Usa los desplegables de la fila de filtros: estado, categoría, valoración mínima y orden. Estado y categoría indican cuántos lugares coinciden con cada opción.',
  'help.guide.filter-select.step.2':
    'Haz clic en el icono de la casilla, «Elegir», después de los desplegables. Cada fila muestra una casilla y aparece una barra de selección.',
  'help.guide.filter-select.step.3':
    'Marca lugares o usa «Seleccionar todo» para todos los que muestra el filtro, y elige «Asignar etiqueta», «Mover a lista», «Duplicar en lista», «Copiar al viaje» o Eliminar. Solo el propietario o un administrador de la lista pueden mover y eliminar.',
  'help.guide.filter-select.result':
    'Las acciones se aplican a toda la selección a la vez. La × de la derecha cierra el modo de selección.',
  'help.guide.filter-select.tip.1':
    '«Seleccionar todo» solo selecciona los lugares que coinciden con el filtro. Para actuar sobre todos tus lugares de «Quiero ir», filtra por «Quiero ir» y haz clic en «Seleccionar todo».',
  // copy-to-trip
  'help.guide.copy-to-trip.title': 'Copiar lugares a un viaje',
  'help.guide.copy-to-trip.goal': 'Añade lugares guardados como paradas a uno de tus viajes.',
  'help.guide.copy-to-trip.step.1':
    'Activa «Elegir» y marca los lugares, o abre un lugar y usa «Copiar al viaje» en su ficha de detalle.',
  'help.guide.copy-to-trip.step.2': 'Haz clic en «Copiar al viaje» en la barra de selección.',
  'help.guide.copy-to-trip.step.3': 'Elige el viaje. Si la lista es larga, usa el cuadro de búsqueda para filtrarla.',
  'help.guide.copy-to-trip.result':
    'Los lugares se añaden a la lista de lugares de ese viaje con nombre, descripción, categoría, notas, precio, coordenadas, foto y etiquetas. La colección no cambia.',
  'help.guide.copy-to-trip.tip.1':
    'Los lectores de una lista compartida también pueden hacerlo. Se copian los lugares de la lista y la lista no cambia.',
  // share-list
  'help.guide.share-list.title': 'Compartir una lista con alguien',
  'help.guide.share-list.goal': 'Planifica una lista en directo con otras personas de este TREK.',
  'help.guide.share-list.step.1': 'Haz clic en Compartir, en la cabecera de tu lista.',
  'help.guide.share-list.step.2': 'Elige al usuario y un rol: «Lector», Editor o «Administrador».',
  'help.guide.share-list.step.3':
    'Haz clic en «Enviar invitación». La persona aparece como pendiente hasta que acepte la invitación en su columna de listas o desde la notificación.',
  'help.guide.share-list.result':
    'Cuando acepten, la lista les aparecerá en «Compartida» y todos los cambios se sincronizarán en directo. Puedes seguir editando los miembros y sus roles en el mismo diálogo.',
  'help.guide.share-list.tip.1':
    'Los lectores pueden ver, valorar y copiar lugares a sus propios viajes. Los editores añaden y editan lugares y etiquetas. Los administradores, además, pueden mover y eliminar.',
  'help.guide.share-list.tip.2':
    'Solo el propietario puede invitar y quitar personas; un miembro puede salir por su cuenta de una lista compartida.',
  // export-list
  'help.guide.export-list.title': 'Exportar una lista a un archivo',
  'help.guide.export-list.goal': 'Pasa una lista a alguien de otro servidor TREK, o ábrela en una aplicación de mapas.',
  'help.guide.export-list.step.1': 'Haz clic en Exportar, en la cabecera de la lista.',
  'help.guide.export-list.step.2':
    'Elige «Lista de TREK» para usar la lista en otro TREK, con etiquetas y estados, o GPX para OsmAnd, Organic Maps, un Garmin y otras aplicaciones que leen puntos de ruta.',
  'help.guide.export-list.result':
    'El archivo se descarga. Cualquier miembro de una lista compartida puede exportarla.',
  'help.guide.export-list.tip.1':
    'Un lugar sin coordenadas no puede ser un punto de ruta GPX; se omite y TREK te indica cuántos se han omitido.',
  'help.guide.export-list.tip.2':
    'Las valoraciones, los miembros y las fotos subidas no se exportan, y es a propósito: pertenecen a este TREK, no a la lista.',
  // import-file
  'help.guide.import-file.title': 'Importar una lista desde un archivo',
  'help.guide.import-file.goal':
    'Importa un archivo de lista de TREK o un archivo GPX, como lista nueva o en una lista existente.',
  'help.guide.import-file.step.1':
    'Haz clic en el botón de importar con la flecha hacia arriba, junto a «Nueva lista», en la columna de listas.',
  'help.guide.import-file.step.2':
    'Elige el archivo. Antes de importar nada, TREK muestra lo que contiene: el nombre, cuántos lugares y cuántas etiquetas.',
  'help.guide.import-file.step.3':
    'Deja «Nueva lista» y cambia el nombre si quieres, y haz clic en Importar. O elige «Añadir a una lista» para poner los lugares en una lista que puedas editar, y haz clic en «Añadir a la lista».',
  'help.guide.import-file.result':
    'La lista se abre con los lugares importados. Importar a una lista solo añade lugares. Los que ya estaban conservan su estado, sus notas y sus etiquetas.',
  'help.guide.import-file.tip.1':
    'De un GPX, cada punto de ruta con nombre se convierte en un lugar; los tracks son líneas y se omiten, y la vista previa indica cuántos puntos eran.',
  'help.guide.import-file.tip.2':
    'Si el archivo no es ni una lista de TREK ni un GPX, se rechaza y TREK te dice por qué. Si no se puede leer un lugar concreto, solo se omite ese lugar, no el archivo entero.',
  // edit-list
  'help.guide.edit-list.title': 'Editar o eliminar una lista',
  'help.guide.edit-list.goal':
    'Cambia el nombre, el color, la portada, la descripción o los enlaces de una lista, o elimínala.',
  'help.guide.edit-list.step.1': 'Haz clic en Editar, en la cabecera de la lista. Solo lo ve el propietario.',
  'help.guide.edit-list.step.2':
    'Cambia lo que quieras y haz clic en Guardar. La papelera de abajo a la izquierda, «Eliminar lista», borra la lista y todos sus lugares tras confirmarlo.',
  'help.guide.edit-list.result': 'La cabecera muestra al momento el nuevo color, la portada y la descripción.',
  'help.guide.edit-list.tip.1':
    'Eliminar una lista no se puede deshacer. Si quieres conservar una copia, expórtala antes.',
  // all-saved
  'help.guide.all-saved.title': 'Buscar en toda tu biblioteca',
  'help.guide.all-saved.goal': 'Ve de una vez los lugares de todas tus listas.',
  'help.guide.all-saved.step.1':
    'Haz clic en «Todos los guardados» en la columna de listas. Muestra en una sola vista los lugares de todas las listas de las que eres propietario o copropietario.',
  'help.guide.all-saved.step.2':
    'Escribe en «Buscar lugares», encima del mapa, y usa los filtros como en cualquier lista. «Elegir» también funciona aquí: mover, duplicar, copiar a un viaje o eliminar en varias listas a la vez.',
  'help.guide.all-saved.result':
    'Esta vista reúne todos tus lugares guardados. Aquí no puedes añadir ni importar lugares, porque no hay una lista concreta a la que añadirlos.',
  'help.guide.all-saved.tip.1':
    'Las etiquetas y las excursiones guardadas pertenecen a una sola lista, así que ninguna de las dos está disponible en «Todos los guardados».',

  // ── Screen: journey ───────────────────────────────────────────────────────────────────
  'help.ctx.journey.title': 'Travesía',
  'help.ctx.journey.summary':
    '«Travesía» es tu diario de viaje centrado en las fotos. Cada travesía está vinculada a uno o varios viajes, y la vas completando día a día con entradas que tienen historia, fotos, estado de ánimo y tiempo. Esta pantalla muestra tus travesías; abre una para escribir.',
  'help.ctx.journey.bullet.1':
    'El banner de arriba muestra la travesía en curso, o la más reciente, con sus recuentos de entradas, fotos y lugares. «Seguir escribiendo» la abre en el día de hoy. Cuando un viaje acaba de terminar, encima aparece el banner «El viaje acaba de terminar», que te propone convertirlo en una travesía.',
  'help.ctx.journey.bullet.2':
    'Debajo de «Todas las travesías», una tarjeta por travesía con su portada, estado, fechas y recuentos; la travesía que aparece en el banner no se repite ahí. Haz clic en una tarjeta para abrirla.',
  'help.ctx.journey.bullet.3':
    'La última tarjeta de la cuadrícula, «Crear una nueva travesía», empieza una a partir de tus viajes.',
  // create-journey
  'help.guide.create-journey.title': 'Crear una travesía',
  'help.guide.create-journey.goal': 'Empieza un diario para un viaje, con sus lugares ya añadidos como sugerencias.',
  'help.guide.create-journey.step.1': 'Haz clic en «Crear una nueva travesía», la última tarjeta de la cuadrícula.',
  'help.guide.create-journey.step.2':
    'Ponle un nombre y, si quieres, un subtítulo, y marca los viajes que incluye. El contador indica cuántos lugares se van a añadir.',
  'help.guide.create-journey.step.3': 'Haz clic en «Crear travesía».',
  'help.guide.create-journey.result':
    'Se abre el diario. Cada lugar de los viajes vinculados aparece en la cronología como sugerencia, una vez por cada día en que está planificado. Puedes escribir una entrada para cada uno.',
  'help.guide.create-journey.tip.1': 'Puedes vincular más viajes más adelante desde «Ajustes de la travesía».',
  'help.guide.create-journey.tip.2':
    'Una travesía sin viajes también funciona; en ese caso, añades las entradas a mano.',
  // open-journey
  'help.guide.open-journey.title': 'Abrir una travesía',
  'help.guide.open-journey.goal': 'Abre un diario y descubre en qué punto se abre.',
  'help.guide.open-journey.step.1':
    'Haz clic en una tarjeta. Cada una muestra la portada, las fechas y cuántas entradas, fotos y lugares tiene la travesía.',
  'help.guide.open-journey.result':
    'Una travesía en curso se abre en el día de hoy, o en la última entrada anterior a hoy si aún no has escrito nada hoy. Una travesía terminada se abre desde el principio.',
  'help.guide.open-journey.tip.1':
    'La portada es la primera foto de la travesía, salvo que elijas otra en «Ajustes de la travesía».',
  // continue-writing
  'help.guide.continue-writing.title': 'Seguir con la travesía en curso',
  'help.guide.continue-writing.goal': 'Abre directamente la página de hoy de la travesía en curso.',
  'help.guide.continue-writing.step.1':
    'Haz clic en «Seguir escribiendo» en el banner de arriba. Muestra la travesía que está en curso o, si no hay ninguna, la más reciente.',
  'help.guide.continue-writing.result':
    'El diario se abre en el día de hoy o, si hoy aún no has escrito nada, en la última entrada anterior.',
  'help.guide.continue-writing.tip.1':
    'Cuando un viaje acaba de terminar, aparece encima de este el banner «El viaje acaba de terminar»: «Crear travesía» empieza una travesía con ese viaje marcado, y Descartar oculta la sugerencia en este navegador.',

  // ── Screen: journey-detail ────────────────────────────────────────────────────────────
  'help.ctx.journey-detail.title': 'Diario',
  'help.ctx.journey-detail.summary':
    'Una travesía abierta: la cronología a la izquierda, día a día, y el mapa a la derecha con capas que puedes activar para el plan, lo grabado, las entradas y las fotos. La cabecera muestra los recuentos, Studio, el interruptor de sugerencias y ⋯ para «Ajustes de la travesía». Usa la barra de herramientas de debajo para añadir entradas.',
  'help.ctx.journey-detail.bullet.1':
    'Cabecera: flecha para volver e insignia de estado, portada, título y subtítulo, los recuentos de días, lugares, entradas y fotos y, a la derecha, Studio, el ojo que oculta o muestra las sugerencias y ⋯ para «Ajustes de la travesía».',
  'help.ctx.journey-detail.bullet.2':
    'Barra de herramientas: las pestañas «Cronología» y «Galería», «Buscar en este viaje» y «Añadir entrada». En «Galería», Subir sustituye a «Añadir entrada».',
  'help.ctx.journey-detail.bullet.3':
    '«Cronología»: una sección por día con su número, el recuento de lugares y un + para añadir una entrada ese día. Debajo, las tarjetas de las entradas con fotos, estado de ánimo, tiempo e historia, y las tarjetas de sugerencias de los viajes, con borde discontinuo y una × para descartarlas.',
  'help.ctx.journey-detail.bullet.4':
    'Mapa: la barra de capas de arriba activa o desactiva «Planificado» (marcadores huecos y las rutas GPX discontinuas de los viajes), «Grabado» (rutas continuas guardadas desde Dawarich), «Entradas» (marcadores con el color de cada día, unidos por orden de fecha con una fina línea discontinua) y «Fotos». La (i) de al lado explica cada símbolo.',
  'help.ctx.journey-detail.bullet.5':
    '«Ajustes de la travesía» (⋯): portada, nombre y subtítulo, estado, tracks GPX, días grabados, lugares a partir de fotos, campos de las entradas, sugerencias descartadas, viajes sincronizados, colaboradores y qué miembros de un viaje tienen acceso, enlace público, archivar y eliminar.',
  'help.ctx.journey-detail.bullet.6':
    'Al final de una cronología larga tienes «Volver arriba», un contador de días que salta a cualquier día o entrada, e «Ir a la última entrada».',
  // add-entry
  'help.guide.add-entry.title': 'Escribir una entrada',
  'help.guide.add-entry.goal': 'Añade la historia de un día con título, texto, estado de ánimo y tiempo.',
  'help.guide.add-entry.step.1':
    'Haz clic en «Añadir entrada» en la barra de herramientas, o en el + del extremo derecho de la cabecera de un día para empezar en ese día.',
  'help.guide.add-entry.step.2':
    'Ponle un título a la entrada y escribe tu texto. La barra de herramientas encima del texto añade negrita, cursiva, títulos, citas, enlaces y listas en Markdown.',
  'help.guide.add-entry.step.3':
    'En la columna derecha, comprueba la fecha y la hora, busca una ubicación o usa tu posición actual, y elige tu estado de ánimo y el tiempo que hacía.',
  'help.guide.add-entry.step.4': 'Haz clic en Guardar.',
  'help.guide.add-entry.result':
    'La entrada aparece en su día de la cronología y como chincheta en el mapa. Los contadores de la cabecera se actualizan.',
  'help.guide.add-entry.tip.1': 'Cuando escribes en una sugerencia, usas el mismo editor, con el lugar ya puesto.',
  'help.guide.add-entry.tip.2':
    'Una entrada con lugar tiene la opción «Dejar fuera de la ruta»: la entrada sigue en el diario, pero no cuenta en la distancia ni en los países y no aparece en el mapa de Studio.',
  // entry-photos
  'help.guide.entry-photos.title': 'Añadir fotos y vídeos a una entrada',
  'help.guide.entry-photos.goal': 'Añade fotos a un día; la primera se convierte en la portada de la entrada.',
  'help.guide.entry-photos.step.1': 'Abre el menú de una entrada con el ⋯ de su tarjeta y elige Editar.',
  'help.guide.entry-photos.step.2':
    'Haz clic en «Subir fotos» y elige los archivos. «Desde galería» toma imágenes que ya están en la galería de la travesía; «Fotos externas» busca ese día en una biblioteca de Immich o Synology conectada.',
  'help.guide.entry-photos.step.3':
    'Pasa el cursor por una imagen y haz clic en «Hacer 1º» para elegirla como portada; después haz clic en Guardar.',
  'help.guide.entry-photos.result':
    'Las fotos aparecen en la tarjeta y en la galería; la primera se usa como miniatura en todas partes.',
  'help.guide.entry-photos.tip.1':
    'Los vídeos se añaden a una entrada de la misma forma: mp4, m4v, webm o mov de hasta 500 MB. Se guardan tal cual, sin cambios.',
  'help.guide.entry-photos.tip.2':
    'Los archivos HEIC de un iPhone se convierten a JPEG al subirlos, y con ello pierden los metadatos de GPS y de la cámara.',
  // suggestions
  'help.guide.suggestions.title': 'Usar o descartar las sugerencias',
  'help.guide.suggestions.goal':
    'Convierte los lugares de tus viajes en entradas y descarta aquellos sobre los que no vas a escribir.',
  'help.guide.suggestions.step.1':
    'Una sugerencia es una tarjeta con borde discontinuo y un botón «Añadir entrada»: un lugar de un viaje vinculado en el día en que se planificó. Haz clic en ella para abrir el editor con el lugar y el día ya indicados.',
  'help.guide.suggestions.step.2':
    'Haz clic en la × del extremo derecho de una tarjeta que no vayas a usar. La tarjeta desaparece de la cronología, pero no se borra, y la sincronización del viaje no volverá a sugerirla.',
  'help.guide.suggestions.step.3':
    '¿Has cambiado de idea? Abre «Ajustes de la travesía» con ⋯ en la cabecera: «Recuperar las sugerencias descartadas» indica cuántas hay y las recupera todas.',
  'help.guide.suggestions.result':
    'La cronología muestra solo las entradas que quieres escribir. El icono del ojo de la cabecera oculta todas las sugerencias a la vez mientras lees.',
  'help.guide.suggestions.tip.1': 'Un lugar planificado en dos días genera una sugerencia en cada uno de ellos.',
  'help.guide.suggestions.tip.2':
    'Las sugerencias nunca cuentan en las estadísticas; solo cuentan las entradas escritas.',
  // add-on-day
  'help.guide.add-on-day.title': 'Añadir una entrada en un día anterior',
  'help.guide.add-on-day.goal': 'Escribe sobre un día pasado sin tener que cambiar la fecha después.',
  'help.guide.add-on-day.step.1': 'Haz clic en el + del extremo derecho de la cabecera de ese día.',
  'help.guide.add-on-day.step.2': 'El editor se abre con esa fecha ya puesta. Escribe y guarda como siempre.',
  'help.guide.add-on-day.result': 'La entrada se añade al momento al día correcto.',
  'help.guide.add-on-day.tip.1':
    'Para cambiar el orden dentro de un día, pasa el cursor por una entrada: a su izquierda aparecen «Subir» y «Bajar».',
  // pros-cons
  'help.guide.pros-cons.title': 'Añadir una valoración',
  'help.guide.pros-cons.goal': 'Resume un día con lo que fue genial y lo que no.',
  'help.guide.pros-cons.step.1':
    'En el editor, busca «Pros y contras» bajo la historia. Escribe un punto en «Pros» o en «Contras» y usa «Añadir otro» para el siguiente.',
  'help.guide.pros-cons.step.2':
    'Guarda. En la tarjeta, «Ver más» despliega la historia y la valoración como dos listas breves.',
  'help.guide.pros-cons.result': 'Los pulgares arriba y abajo aparecen bajo el relato, donde se ven de un vistazo.',
  'help.guide.pros-cons.tip.1':
    'Si una travesía no usa valoraciones finales, puedes desactivar esa sección en «Campos de la entrada», dentro de «Ajustes de la travesía».',
  // search-journey
  'help.guide.search-journey.title': 'Encontrar algo en un diario largo',
  'help.guide.search-journey.goal': 'Encuentra una entrada sin tener que desplazarte por semanas de entradas.',
  'help.guide.search-journey.step.1':
    'Escribe en «Buscar en este viaje», en la barra de herramientas. La cronología se filtra mientras escribes, en títulos, historias, lugares y etiquetas. Da igual que uses tildes o mayúsculas.',
  'help.guide.search-journey.step.2':
    'Para saltar a un día, haz clic en el contador de días al final de la cronología, entre «Volver arriba» e «Ir a la última entrada».',
  'help.guide.search-journey.result':
    'La cronología se desplaza hasta el día o la entrada elegidos, y el mapa también. Solo se muestran las entradas que coinciden hasta que borres el cuadro de búsqueda.',
  'help.guide.search-journey.tip.1':
    'Una travesía en curso se abre en la página de hoy, así que la página actual suele estar ya a la vista.',
  'help.guide.search-journey.tip.2':
    'El ojo de la cabecera oculta las sugerencias, para que solo veas las entradas que has escrito.',
  // gallery-map
  'help.guide.gallery-map.title': 'Explorar la galería y el mapa',
  'help.guide.gallery-map.goal': 'Ve toda la travesía en fotos y como lugares en el mapa.',
  'help.guide.gallery-map.step.1':
    'Cambia a «Galería» en la barra de herramientas. Ahí están todas las fotos de todas las entradas, además de las imágenes subidas directamente a la galería. Haz clic en una para abrirla en el visor.',
  'help.guide.gallery-map.step.2':
    'Subir, a la derecha, añade imágenes a la galería. Si tienes Immich o Synology conectados, un botón con el nombre de la biblioteca te permite elegir imágenes de allí.',
  'help.guide.gallery-map.result':
    'Los marcadores tienen el color de su día y se unen por orden de fecha con una fina línea discontinua. La barra de capas de la parte superior del mapa cambia lo que se muestra.',
  'help.guide.gallery-map.tip.1':
    'Los tracks GPX de un viaje se muestran como líneas discontinuas en la capa «Planificado» del mapa. «Mostrar todas las rutas GPX de los viajes», en «Ajustes de la travesía», los desactiva.',
  'help.guide.gallery-map.tip.2':
    'Las fotos de la galería que tienen ubicación también aparecen en el mapa público, si compartes tanto «Galería» como «Mapa».',
  // entry-fields
  'help.guide.entry-fields.title': 'Desactivar campos de las entradas',
  'help.guide.entry-fields.goal': 'Muestra en el editor solo los campos que usa esta travesía.',
  'help.guide.entry-fields.step.1':
    'Haz clic en ⋯, arriba a la derecha de la cabecera, para abrir «Ajustes de la travesía».',
  'help.guide.entry-fields.step.2':
    'En «Campos de la entrada», desactiva «Estado de ánimo», «Clima» o «Pros y contras».',
  'help.guide.entry-fields.result':
    'El editor deja de mostrar estos campos. No se pierde nada de lo que escribiste: al volver a activar un campo, aparecen otra vez los valores guardados. Una travesía compartida oculta los mismos campos.',
  'help.guide.entry-fields.tip.1':
    'Los interruptores son de cada travesía, así que un viaje de trabajo y unas vacaciones pueden tener campos distintos.',
  // link-trip
  'help.guide.link-trip.title': 'Vincular otro viaje',
  'help.guide.link-trip.goal': 'Añade como sugerencias al diario los lugares de un segundo viaje.',
  'help.guide.link-trip.step.1':
    'Haz clic en ⋯, arriba a la derecha de la cabecera, para abrir «Ajustes de la travesía».',
  'help.guide.link-trip.step.2': 'En «Viajes sincronizados», haz clic en «Añadir viaje».',
  'help.guide.link-trip.step.3': 'Busca el viaje por nombre o destino y haz clic en Vincular, a su lado.',
  'help.guide.link-trip.result':
    'Sus lugares aparecen en la cronología como sugerencias en sus días, y se añaden a la capa «Planificado» del mapa con sus tracks GPX.',
  'help.guide.link-trip.tip.1':
    'La papelera junto a un viaje vinculado lo desvincula tras pedir confirmación; las entradas que escribiste se conservan.',
  'help.guide.link-trip.tip.2': 'Las entradas de un día solo cuentan una vez, aunque varios viajes incluyan ese día.',
  // share-public
  'help.guide.share-public.title': 'Compartir la travesía públicamente',
  'help.guide.share-public.goal': 'Comparte un enlace de solo lectura con personas que no tienen cuenta en TREK.',
  'help.guide.share-public.step.1':
    'Abre «Ajustes de la travesía» con ⋯ en la cabecera y baja hasta «Compartir público».',
  'help.guide.share-public.step.2': 'Haz clic en «Crear enlace para compartir».',
  'help.guide.share-public.step.3':
    'Elige qué ven los visitantes: «Cronología», «Galería» y «Mapa». En «Mapa», «Plan del viaje» añade los lugares y rutas planificados, y «Rutas grabadas», las rutas de los días que grabaste. Copiar copia el enlace al portapapeles.',
  'help.guide.share-public.result':
    'Cualquiera con el enlace ve las secciones activadas y nada más; los campos que desactivaste en «Campos de la entrada» también quedan ocultos.',
  'help.guide.share-public.tip.1':
    'Las fotos solo aparecen en el mapa público si «Galería» y «Mapa» están activados. Con «Mapa» desactivado, el servidor quita sus coordenadas antes de enviar las fotos.',
  'help.guide.share-public.tip.2': 'Haz clic en «Eliminar enlace», junto a Copiar, para dejar de compartir.',
  // contributors
  'help.guide.contributors.title': 'Escribir en equipo',
  'help.guide.contributors.goal': 'Deja que otro viajero añada sus propias entradas y fotos.',
  'help.guide.contributors.step.1': 'Abre «Ajustes de la travesía» con ⋯ en la cabecera y busca «Colaboradores».',
  'help.guide.contributors.step.2':
    'Haz clic en «Invitar colaborador» y busca al usuario por nombre o correo electrónico.',
  'help.guide.contributors.step.3': 'Elige «Lector» o Editor y haz clic en Invitar.',
  'help.guide.contributors.result':
    'La travesía aparece en su lista y sus entradas llevan su nombre. Para quitar a un colaborador, haz clic en la × que tiene al lado.',
  'help.guide.contributors.tip.1':
    'Los colaboradores son personas de este TREK. Para todos los demás está el enlace público.',
  // studio
  'help.guide.studio.title': 'Maquetar la travesía como un libro de fotos',
  'help.guide.studio.goal': 'Convierte el diario en páginas imprimibles.',
  'help.guide.studio.step.1': 'Haz clic en «Studio» en la cabecera. El diseñador se abre encima de la travesía.',
  'help.guide.studio.step.2':
    'Para volver, haz clic en × en el extremo derecho de la barra superior. Regresarás a donde estabas.',
  'help.guide.studio.result':
    'La barra lateral y sus paneles están a la izquierda, la doble página en la mesa de trabajo y las propiedades a la derecha. Diseño automático crea el libro a partir de tus entradas. Exportar genera un PDF listo para imprimir.',
  'help.guide.studio.tip.1':
    'Studio necesita una ventana de al menos 1024 px de ancho y no está disponible en el móvil.',
  'help.guide.studio.tip.2':
    'El libro tiene el mismo acceso que la travesía: quien puede leer la travesía puede abrir el libro, y quien puede editarla puede guardarlo.',
  // archive-journey
  'help.guide.archive-journey.title': 'Archivar o eliminar una travesía',
  'help.guide.archive-journey.goal': 'Cierra una travesía terminada o elimínala definitivamente.',
  'help.guide.archive-journey.step.1':
    'Haz clic en ⋯, arriba a la derecha de la cabecera, para abrir «Ajustes de la travesía».',
  'help.guide.archive-journey.step.2':
    'Abajo del todo, «Archivar viaje» la da por terminada y la marca como archivada; «Restaurar viaje» la recupera. «Eliminar» la borra con todas sus entradas y fotos, después de pedirte confirmación.',
  'help.guide.archive-journey.result':
    'Una travesía archivada se puede seguir leyendo y compartiendo; simplemente ya no se abre en el día de hoy.',
  'help.guide.archive-journey.tip.1':
    'Eliminar no se puede deshacer y no afecta a los viajes vinculados a la travesía.',
  'help.guide.archive-journey.tip.2':
    'La portada, el nombre y el subtítulo están en el mismo diálogo, en la parte superior.',
  'help.guide.journey-status.title': 'Definir el estado de una travesía',
  'help.guide.journey-status.goal':
    'Marca tú mismo una travesía como borrador, en vivo o completada, en lugar de seguir las fechas de sus viajes.',
  'help.guide.journey-status.step.1':
    'Haz clic en ⋯, arriba a la derecha de la cabecera de la travesía, para abrir «Ajustes de la travesía».',
  'help.guide.journey-status.step.2':
    'En «Estado», elige «Borrador», «En vivo» o «Completado». La elección se guarda al momento.',
  'help.guide.journey-status.result':
    'La travesía mantiene el estado elegido: «Borrador» y «Completado» aparecen como insignia en su tarjeta y en su cabecera, y una travesía «En vivo» se muestra en el banner de la parte superior de la lista de travesías.',
  'help.guide.journey-status.tip.1':
    '«Automático» vuelve a usar las fechas de los viajes vinculados. Si no hay ningún viaje vinculado, una travesía automática se queda como borrador.',
  'help.guide.journey-status.tip.2':
    'Un estado que pones a mano se mantiene hasta que lo cambies, aunque cambien las fechas del viaje.',

  // ── Screen: journey-studio ────────────────────────────────────────────────────────────
  'help.ctx.journey-studio.title': 'Studio', // same-as-en
  'help.ctx.journey-studio.summary':
    'TREK Studio maqueta una travesía como un libro de fotos que puedes imprimir. Se abre encima del diario: la barra lateral y sus paneles a la izquierda, la doble página en la que trabajas en el centro y sus propiedades a la derecha. Diseño automático crea un primer borrador a partir de tus entradas, un tema da al libro sus colores y tipografías, y el asistente puede diseñar páginas contigo. Después puedes mover, recortar y cambiar el estilo de todo, y deshacer cada paso.',
  'help.ctx.journey-studio.bullet.1':
    'Barra superior: a la izquierda, la portada y el nombre de la travesía. A la derecha, quién más está en el libro y si está guardado, el formato de página, deshacer, rehacer y pegar, Diseño automático, el asistente, la ayuda, Exportar y el botón que cierra Studio.',
  'help.ctx.journey-studio.bullet.2':
    'Barra lateral a la izquierda: Páginas, Contenido (las fotos y entradas de la travesía), Diseños, Elementos (textos, formas, líneas, marcos, iconos y pegatinas), Viaje (cifras, mapas, países y marcas generados a partir de la travesía) y, separadas debajo, Tema y Capas.',
  'help.ctx.journey-studio.bullet.3':
    'Mesa de trabajo: la doble página actual con su sangrado y sus márgenes de seguridad, y debajo la barra de zoom con Ajustar a la vista, Vista de libro y Descargar esta doble página.',
  'help.ctx.journey-studio.bullet.4':
    'Propiedades a la derecha: todo lo del elemento seleccionado, desde la posición, el tamaño y el recorte hasta los colores, los efectos, el orden de apilamiento y el bloqueo. Si no hay nada seleccionado, muestra el fondo de página, el tema, la numeración de páginas y el documento.',
  'help.ctx.journey-studio.bullet.5':
    'El libro se maqueta como uno impreso: portada, una primera página suelta frente al interior en blanco de la portada, las dobles páginas, una última página suelta y la contraportada. Los números de página empiezan a contar desde la primera página y se imprimen tal como se ven.',
  'help.ctx.journey-studio.bullet.6':
    'Varias personas pueden diseñar a la vez: cada una ve los punteros de las demás con su nombre. Si guardas una versión que otra persona ha cambiado, TREK muestra un conflicto en lugar de sobrescribir su trabajo.',
  'help.ctx.journey-studio.bullet.7':
    'Tema: un único aspecto para todo el libro, con su papel, su tinta y tres acentos, sus tipografías y sus motivos. Los elementos vinculados al tema lo siguen cuando lo cambias.',
  'help.ctx.journey-studio.bullet.8':
    'Asistente: donde un administrador ha configurado la IA, el globo de diálogo de la barra superior abre un asistente que maqueta páginas, escribe pies de foto y cambia el estilo del libro contigo. Cada cambio que hace es un paso que puedes deshacer.',
  // studio-auto-layout
  'help.guide.studio-auto-layout.title': 'Crear el libro automáticamente',
  'help.guide.studio-auto-layout.goal':
    'Obtén con un clic un primer borrador completo a partir de las entradas y las fotos del diario.',
  'help.guide.studio-auto-layout.step.1': 'Haz clic en «Auto layout» en la barra superior.',
  'help.guide.studio-auto-layout.step.2':
    'Elige «Todo el libro»: sustituye todas las páginas y conserva tu título y la configuración de página. «Esta página» rehace solo la doble página que tienes en pantalla, y solo aparece en las dobles páginas creadas a partir de una entrada.',
  'help.guide.studio-auto-layout.step.3':
    'Revisa la columna de páginas. Si te gustaba más la versión anterior, Deshacer revierte todo el diseño.',
  'help.guide.studio-auto-layout.result':
    'Una doble página por entrada, por orden, con sus fotos, su título y su texto ya colocados. Cada elemento sigue vinculado a su entrada y se actualiza con ella hasta que lo edites.',
  'help.guide.studio-auto-layout.tip.1':
    'Las dos opciones son pasos normales de deshacer, así que puedes probarlas y deshacerlas.',
  'help.guide.studio-auto-layout.tip.2':
    'Cuando la maquetación automática vincula un elemento a una entrada, el elemento se actualiza al editar esa entrada. Si cambias el elemento en «Propiedades», se quita el vínculo.',
  // studio-pages
  'help.guide.studio-pages.title': 'Añadir, mover y quitar dobles páginas',
  'help.guide.studio-pages.goal': 'Edita el libro página a página.',
  'help.guide.studio-pages.step.1':
    'Abre Páginas en la barra lateral. Las miniaturas muestran el libro en orden: portada, primera página, dobles páginas, última página y contraportada. La primera y la última página se dibujan junto al interior en blanco de su cubierta, como se abre el libro encuadernado.',
  'help.guide.studio-pages.step.2':
    '«Añadir página», abajo, añade una doble página nueva antes de la última página. El + entre dos miniaturas inserta una en esa posición.',
  'help.guide.studio-pages.step.3':
    'Pasa el cursor por una miniatura para ver sus acciones: «Mover antes», «Mover después», «Duplicar página» y «Eliminar página». Haz clic en una miniatura para abrir esa doble página en la mesa de trabajo.',
  'help.guide.studio-pages.result':
    'La portada, la primera y la última página y la contraportada se quedan donde están. Las dobles páginas nuevas siempre se añaden entre ellas.',
  'help.guide.studio-pages.tip.1':
    'La vista de libro, en la barra superior, muestra todo el libro en pliegos, tal como se encuadernará.',
  'help.guide.studio-pages.tip.2':
    'Los números de página se activan en «Documento», dentro de «Propiedades», sin nada seleccionado.',
  // studio-layouts
  'help.guide.studio-layouts.title': 'Aplicar un diseño a una doble página',
  'help.guide.studio-layouts.goal':
    'Aplica a una doble página una distribución predefinida de marcos de foto y de texto.',
  'help.guide.studio-layouts.step.1':
    'Abre Diseños en la barra lateral. Primero van las páginas diseñadas: portadas y dobles páginas completas con el tema del libro, que los chips de estilo reducen a un solo aspecto. Mis disposiciones y Predefinidas van debajo, en la misma cuadrícula.',
  'help.guide.studio-layouts.step.2':
    'Haz clic en una. La doble página de la mesa de trabajo toma los marcos de esa composición, y tus fotos y textos se colocan en ellos.',
  'help.guide.studio-layouts.result':
    'Los marcos vacíos son huecos para el contenido: arrastra una foto desde «Contenido» a uno de ellos, o usa «Añadir a esta página».',
  'help.guide.studio-my-layouts.title': 'Guardar una página como disposición propia',
  'help.guide.studio-my-layouts.goal': 'Reutiliza una disposición que hiciste en otras páginas del libro.',
  'help.guide.studio-my-layouts.step.1': 'Organiza una página como quieras y abre Diseños en la barra lateral.',
  'help.guide.studio-my-layouts.step.2':
    'Haz clic en Guardar esta página como disposición en Mis disposiciones. La página aparece como una tarjeta en la lista.',
  'help.guide.studio-my-layouts.tip.1':
    'Haz clic en tu disposición en otra página para organizarla igual, con sus propias fotos y textos.',
  'help.guide.studio-my-layouts.result':
    'Tus disposiciones se guardan con el libro y se ofrecen en páginas del mismo tipo: las de una portada para portadas, las de una doble página para dobles páginas.',
  'help.guide.studio-layouts.tip.1': 'Aplicar una composición es un paso de deshacer como cualquier otro.',
  // studio-content
  'help.guide.studio-content.title': 'Poner fotos y entradas en una página',
  'help.guide.studio-content.goal': 'Añade a la doble página las fotos y entradas de la propia travesía.',
  'help.guide.studio-content.step.1':
    'Abre «Contenido» en la barra lateral. En «Fotos» están todas las imágenes de la travesía, y en «Entradas», las entradas con su texto.',
  'help.guide.studio-content.step.2':
    'Arrastra una foto a la doble página o a un marco vacío, o haz clic en «Añadir a esta página», debajo de ella. «Subir fotos» añade imágenes que aún no están en la travesía; «Desde Immich» o «Desde Synology» las toma de una biblioteca conectada.',
  'help.guide.studio-content.step.3':
    'Debajo de una entrada, Título, Historia y Lugar colocan ese texto en la página como elemento de texto. La fecha y las coordenadas se añaden como marcas, y ahí también aparecen las fotos de la entrada.',
  'help.guide.studio-content.result':
    'Una foto que sueltas se convierte en un elemento de foto. El texto sigue vinculado a la entrada hasta que lo edites.',
  'help.guide.studio-theme.title': 'Dar un tema al libro',
  'help.guide.studio-theme.goal': 'Define los colores y las tipografías de todo el libro de una vez.',
  'help.guide.studio-theme.step.1':
    'Abre Tema en la barra lateral. Cada tarjeta muestra un tema como una pequeña página: su papel, su tipografía y sus tres colores de acento.',
  'help.guide.studio-theme.step.2':
    'Haz clic en un tema para probarlo. Debajo de las tarjetas puedes cambiar su paleta, elegir otras tipografías y escoger motivos y decoración.',
  'help.guide.studio-theme.step.3':
    'Haz clic en Aplicar al libro, o en Aplicar a esta página para la doble página que ves en pantalla.',
  'help.guide.studio-theme.tip.1':
    'Los elementos vinculados al tema toman sus colores y tipografías y lo siguen cuando lo cambias. Restilizar también lo que aún no está vinculado vincula primero el resto.',
  'help.guide.studio-theme.tip.2': 'Colores de las fotos crea una paleta con las imágenes de la travesía.',
  'help.guide.studio-theme.result':
    'Todos los colores y tipografías vinculados del libro cambian a la vez, y aplicar el tema es un solo paso de deshacer.',
  'help.guide.studio-content.tip.1': 'El cuadro de búsqueda de la parte superior de «Contenido» filtra las dos listas.',
  'help.guide.studio-content.tip.2':
    'Si sueltas un archivo de tu escritorio en la mesa de trabajo, TREK lo sube y lo coloca en un solo paso.',
  // studio-elements
  'help.guide.studio-elements.title': 'Añadir textos, formas, iconos y pegatinas',
  'help.guide.studio-elements.goal': 'Decora una doble página con algo más que fotos e historias.',
  'help.guide.studio-elements.step.1':
    'Abre Elementos en la barra lateral. Seis pestañas ordenan lo que puedes añadir: Texto, Formas, Líneas, Marcos, Iconos y Pegatinas.',
  'help.guide.studio-elements.step.2':
    'Haz clic en un estilo de texto o un título diseñado, una forma, una línea, un marco vacío, un icono o una pegatina. Cada uno se coloca en el centro de la doble página y después puedes moverlo.',
  'help.guide.studio-elements.result':
    'Haz doble clic en un elemento de texto para escribir en él; «Propiedades» incluye la fuente, el grosor, el tamaño, el espaciado y la alineación.',
  'help.guide.studio-stickers.title': 'Decorar con pegatinas',
  'help.guide.studio-stickers.goal': 'Añade ilustraciones, desde monumentos y comida hasta animales y flechas.',
  'help.guide.studio-stickers.step.1': 'Abre Elementos en la barra lateral y elige Pegatinas.',
  'help.guide.studio-stickers.step.2':
    'Busca una palabra o recorre las estanterías, y haz clic en una pegatina para colocarla en la doble página.',
  'help.guide.studio-stickers.tip.1':
    'Con una pegatina seleccionada, Propiedades cambia el color de sus partes y la voltea como un espejo.',
  'help.guide.studio-stickers.result': 'La pegatina es un dibujo, así que se mantiene nítida a cualquier tamaño.',
  'help.guide.studio-elements.tip.1': 'Los marcos son huecos vacíos para fotos: suelta una imagen en ellos más tarde.',
  // studio-travel
  'help.guide.studio-travel.title': 'Añadir mapas, cifras, países y marcas',
  'help.guide.studio-travel.goal': 'Convierte la propia travesía en elementos diseñados en la página.',
  'help.guide.studio-travel.step.1':
    'Abre Viaje en la barra lateral. Cuatro pestañas ordenan lo que puedes añadir: Cifras, Mapas, Países y Marcas.',
  'help.guide.studio-travel.step.2':
    'Cada tarjeta muestra el elemento con las cifras de tu propia travesía, con los colores del tema: un resumen como cartel, billete, señal de carretera o cuentakilómetros, un mapa con paradas numeradas o recortado a un país, un país como sello, postal o chincheta, una fecha o una distancia como sello, etiqueta o cinta.',
  'help.guide.studio-travel.step.3':
    'Haz clic en una tarjeta. El elemento se coloca en el centro de la doble página y después puedes moverlo y cambiarle el tamaño.',
  'help.guide.studio-travel.result':
    'El elemento aparece en la doble página. Propiedades cambia su aspecto, y cada cifra, mapa y país se actualiza cuando cambia la travesía.',
  'help.guide.studio-text-effects.title': 'Añadir efectos al texto',
  'help.guide.studio-text-effects.goal':
    'Da a un titular un contorno, una sombra, una curva o letras rellenas de un patrón.',
  'help.guide.studio-text-effects.step.1': 'Haz clic en un elemento de texto de la página para seleccionarlo.',
  'help.guide.studio-text-effects.step.2':
    'En Propiedades, abre Efectos para añadir un contorno, una sombra o un resaltado, o rellenar las letras con un degradado o un patrón. Mayúsculas y posición curva la línea y la ajusta a su marco.',
  'help.guide.studio-text-effects.tip.1':
    'Ajustar al marco reduce el texto hasta que cabe en su marco, así que un título largo nunca se desborda.',
  'help.guide.studio-text-effects.result': 'El efecto se dibuja con el texto, igual en la impresión que en pantalla.',
  'help.guide.studio-background.title': 'Cambiar el fondo de la página',
  'help.guide.studio-background.goal':
    'Pinta la página de un color, un degradado o un patrón, o coloca una foto debajo.',
  'help.guide.studio-background.step.1':
    'Haz clic en una parte vacía de la página para que no haya nada seleccionado. Fondo de página está en la parte superior de Propiedades.',
  'help.guide.studio-background.step.2':
    'Elige Papel, Sólido, Degradado o Patrón y un color, o haz clic en una foto en Foto de fondo.',
  'help.guide.studio-background.tip.1': 'Aplicar a todas las páginas da el mismo fondo a todas las páginas del libro.',
  'help.guide.studio-background.result':
    'El fondo llega hasta el sangrado, así que se imprime hasta el borde de la página.',
  'help.guide.studio-layers.title': 'Ordenar, ocultar y bloquear con capas',
  'help.guide.studio-layers.goal': 'Mira todo lo de la doble página en orden de apilamiento y trabájalo ahí.',
  'help.guide.studio-layers.step.1':
    'Abre Capas en la barra lateral. La parte superior de la lista es el frente de la página.',
  'help.guide.studio-layers.step.2':
    'Arrastra una fila para reordenarla, usa el ojo para ocultar un elemento y el candado para dejarlo fijo. Selecciona varios y agrúpalos para moverlos juntos.',
  'help.guide.studio-layers.tip.1': 'Haz doble clic en una fila para dar un nombre propio al elemento.',
  'help.guide.studio-layers.tip.2': 'Los elementos ocultos no salen en el PDF.',
  'help.guide.studio-layers.result':
    'Las páginas cargadas siguen siendo fáciles de editar, y las partes terminadas no se pueden mover por accidente.',
  'help.guide.studio-travel.tip.1':
    'En Mapas, Paradas enumera todas las paradas de la ruta. Desactiva una para dejarla fuera de los mapas y las cifras, por ejemplo tu aeropuerto de origen.',
  'help.guide.studio-travel.tip.2':
    'Un mapa de país muestra solo las paradas de ese país, así que el país llena la página aunque la travesía empezara con un vuelo largo.',
  // studio-properties
  'help.guide.studio-properties.title': 'Editar lo que has seleccionado',
  'help.guide.studio-properties.goal': 'Mueve, recorta, da estilo y ordena en capas un elemento con el inspector.',
  'help.guide.studio-properties.step.1':
    'Haz clic en un elemento de la doble página. Aparecen tiradores para el tamaño y la rotación; arrástralo para moverlo.',
  'help.guide.studio-properties.step.2':
    'En «Properties», a la derecha, tienes los ajustes del elemento seleccionado: posición y tamaño, «Crop» con el punto focal que decide qué queda dentro del marco, «Fill» o «Fit», los filtros de «Look», el radio de las esquinas («Corner»), el estilo del marco, el orden de apilamiento y «Lock».',
  'help.guide.studio-properties.step.3':
    '«Duplicar» y «Eliminar» están en la parte superior del inspector. Con «Deshacer», en la barra superior, puedes revertir cualquiera de estos cambios.',
  'help.guide.studio-properties.result':
    'Un elemento bloqueado no se puede seleccionar ni mover en la página. Así proteges una composición terminada mientras trabajas en los demás elementos.',
  'help.guide.studio-properties.tip.1':
    'Con Mayús + clic seleccionas varios elementos, y el inspector los edita a la vez.',
  'help.guide.studio-properties.tip.2':
    'Si editas un elemento que colocó la maquetación automática, deja de estar vinculado a la entrada y ya no sigue los cambios posteriores de esa entrada.',
  // studio-format
  'help.guide.studio-format.title': 'Elegir el formato de página',
  'help.guide.studio-format.goal': 'Define el tamaño de impresión del libro antes de crear la maquetación.',
  'help.guide.studio-format.step.1':
    'Haz clic en el formato de página de la barra superior, junto a las herramientas de edición. Muestra el nombre y la forma del formato.',
  'help.guide.studio-format.step.2':
    'Elige «Square 21 × 21 cm», «Square 30 × 30 cm», A4 o A5 en horizontal o en vertical, o introduce un ancho y un alto personalizados en milímetros. El sangrado y el margen de seguridad están debajo.',
  'help.guide.studio-format.result':
    'Cada doble página se dibuja a ese tamaño, con 3 mm de sangrado y 5 mm de margen de seguridad de forma predeterminada.',
  'help.guide.studio-format.tip.1':
    'Cambia primero el formato y después ejecuta «Diseño automático». Usa el formato que esté configurado en ese momento.',
  'help.guide.studio-format.tip.2':
    'Pide a tu imprenta sus valores de sangrado y de margen de seguridad e introdúcelos.',
  // studio-export
  'help.guide.studio-export.title': 'Exportar el libro en PDF',
  'help.guide.studio-export.goal': 'Obtén un archivo listo para imprimir o para leer en pantalla.',
  'help.guide.studio-export.step.1': 'Haz clic en «Export» en la barra superior.',
  'help.guide.studio-export.step.2':
    'Elige «Páginas sueltas», una página por hoja en orden de lectura, que es lo que necesita una imprenta, o «Pliegos», dos páginas a la vez, tal como se abre el libro. «Marcas de corte» añade el sangrado en todos los bordes y marca por dónde cortar.',
  'help.guide.studio-export.step.3':
    'Haz clic en «Vista de impresión». El navegador abre las páginas. Elige «Guardar como PDF» para crear el archivo.',
  'help.guide.studio-export.result':
    'Un PDF con tantas hojas como indicaba el cuadro, en el formato de página que definiste.',
  'help.guide.studio-export.tip.1': 'El PDF solo se puede crear en un ordenador, igual que el propio Studio.',
  'help.guide.studio-export.tip.2':
    'Para una prueba, exporta en «Pliegos» sin marcas de corte; para la imprenta, en «Páginas sueltas» con ellas.',
  // studio-spread-file
  'help.guide.studio-spread-file.title': 'Reutilizar una doble página en otro libro',
  'help.guide.studio-spread-file.goal': 'Copia un diseño que te guste del libro de una travesía al de otra.',
  'help.guide.studio-spread-file.step.1':
    'Con la doble página en la mesa de trabajo, haz clic en «Descargar esta doble página», en el extremo derecho de la barra de zoom. El archivo contiene el diseño, no las fotos.',
  'help.guide.studio-spread-file.step.2':
    'En el otro libro, abre Páginas, haz clic en Importar junto a «Añadir página» y elige el archivo.',
  'help.guide.studio-spread-file.result':
    'La doble página se importa con sus marcos y estilos de texto. Suelta en los marcos las fotos de la nueva travesía.',
  'help.guide.studio-spread-file.tip.1':
    'Si un archivo no es un diseño de doble página, TREK lo rechaza e indica el motivo.',

  // ── Screen: settings (all tabs) ───────────────────────────────────────────────────────
  'help.ctx.settings.title': 'Ajustes',
  'help.ctx.settings.summary':
    'Tus ajustes personales, con una pestaña por tema en la barra lateral izquierda. La mayoría de los interruptores se aplican en cuanto los cambias. Un formulario con botón Guardar solo se guarda al hacer clic en Guardar. Nada de lo que cambies aquí afecta a TREK para los demás.',
  'help.ctx.settings.bullet.1':
    'Barra lateral izquierda: «Pantalla», «Apariencia», «Mapa», «Notificaciones», «Integraciones», «Sin conexión» y «Cuenta». «Plugins» aparece cuando hay algún plugin activo. «Acerca de» aparece salvo que el administrador del servidor la haya ocultado. La versión se muestra abajo del todo.',
  'help.ctx.settings.bullet.2':
    '«Pantalla» se abre primero. Incluye el idioma, el idioma de los nombres de lugares, las unidades, el formato de hora, el primer día de la semana y la moneda de visualización, además del comportamiento del mapa del viaje. «Apariencia» incluye el tema, los colores, la legibilidad, el tamaño del texto y los widgets del panel.',
  'help.ctx.settings.bullet.3':
    '«Mapa» define el motor de mapas y su estilo; «Notificaciones», qué eventos van a cada canal; «Integraciones» conecta bibliotecas de fotos, AirTrail, Dawarich y wanderer, e incluye las claves de API y MCP; «Sin conexión» define qué guarda este dispositivo.',
  'help.ctx.settings.bullet.4':
    '«Cuenta» incluye tu perfil, tu contraseña, la autenticación de dos factores, las passkeys y la opción de eliminar tu cuenta.',
  'help.ctx.settings-display.title': 'Pantalla',
  'help.ctx.settings-display.summary':
    'Con qué se abre TREK, qué idioma y unidades usa, y cómo se comportan el mapa del viaje y las reservas. Todos los cambios se aplican al momento.',
  'help.ctx.settings-display.bullet.1':
    '«Inicio»: «Página de inicio» abre el «Panel» o el «Viaje activo»; con «Viaje activo», «Pestaña de inicio» elige la pestaña con la que se abre ese viaje.',
  'help.ctx.settings-display.bullet.2':
    'Idioma y región: «Moneda de visualización» (o «Moneda del viaje» para no convertir), «Idioma», «Nombres de lugares», «Unidad de temperatura», «Unidad de distancia», «Formato de hora» y «La semana comienza el».',
  'help.ctx.settings-display.bullet.3':
    '«Viaje y mapa»: «Abrir lugares en», «Fecha primero en los títulos de día», «Etiquetas de rutas de reservas», «Mostrar siempre las rutas de reserva», «Marcadores compactos para lugares sin planificar», «Explorar lugares en el mapa», «Difuminar códigos de reserva» y «Optimizar la ruta desde el alojamiento».',
  'help.ctx.settings-appearance.title': 'Apariencia',
  'help.ctx.settings-appearance.summary':
    'El aspecto de TREK en esta cuenta: modo claro u oscuro, color de acento, transparencias y animaciones, tamaño del texto y los widgets que muestra el panel. Todo se aplica al momento en todos los dispositivos en los que inicies sesión.',
  'help.ctx.settings-appearance.bullet.1':
    '«Tema»: «Modo de color» («Claro», «Oscuro» o «Automático»), el esquema de color y, con «Personalizado», tu propio color de acento para el modo claro y el oscuro, con comprobación de contraste.',
  'help.ctx.settings-appearance.bullet.2':
    '«Legibilidad», marcada como «Experimental»: «Transparencia», «Reducir movimiento», «Densidad» y «Tamaño del texto», con un control deslizante para «Todo» y uno para cada tamaño: «Grande», «Mediano», «Normal» y «Pequeño».',
  'help.ctx.settings-appearance.bullet.3':
    '«Widgets del panel»: interruptores separados para escritorio («Debajo del héroe», «Barra lateral derecha») y para móvil («Debajo del héroe», «Final de la página»).',
  'help.ctx.settings-appearance.bullet.4':
    '«Restablecer valores predeterminados», debajo de las tarjetas, devuelve toda la pestaña a sus valores predeterminados.',
  'help.ctx.settings-map.title': 'Mapa',
  'help.ctx.settings-map.summary':
    'Qué motor dibuja los mapas del planificador y del diario, y con qué estilo. Leaflet es el mapa ráster clásico; Mapbox GL añade edificios en 3D y relieve con tu propio token; MapLibre GL muestra teselas vectoriales de OpenFreeMap sin necesidad de token. El atlas siempre usa Leaflet.',
  'help.ctx.settings-map.bullet.1':
    '«Proveedor de mapa»: Leaflet, Mapbox GL (Experimental) o MapLibre GL, cada opción con una breve descripción.',
  'help.ctx.settings-map.bullet.2':
    '«Plantilla del mapa» y «Clave de API de CARTO» para Leaflet; «Estilo de mapa» para los dos motores GL, y además el «Token de acceso de Mapbox» para Mapbox GL.',
  'help.ctx.settings-map.bullet.3':
    'Solo para Mapbox GL: «Edificios 3D y terreno» y «Modo de alta calidad». Encima de «Guardar mapa» se muestra una vista previa en directo. «Guardar mapa» guarda tu elección.',
  'help.ctx.settings-notifications.title': 'Notificaciones',
  'help.ctx.settings-notifications.summary':
    'Cómo te contacta TREK fuera de la aplicación. Arriba, una tabla con una fila por evento y una columna por canal decide qué se envía por dónde. Debajo están las tarjetas del webhook, ntfy, push en este dispositivo y los canales de plugins.',
  'help.ctx.settings-notifications.bullet.1':
    '«Notificaciones»: activa o desactiva cada evento por canal. Un candado indica que el administrador lo ha desactivado para todos.',
  'help.ctx.settings-notifications.bullet.2':
    '«URL del webhook»: un webhook de Discord, de Slack o personalizado, con Probar y Guardar.',
  'help.ctx.settings-notifications.bullet.3':
    'Ntfy: «Tema de Ntfy» y, de forma opcional, «URL del servidor Ntfy» y Access Token, con Probar y Guardar.',
  'help.ctx.settings-notifications.bullet.4':
    '«Notificaciones push en este dispositivo»: «Activar en este dispositivo» solo afecta a este navegador; «Enviar prueba» envía una notificación de prueba. Un canal de plugin muestra Configurar hasta que se configura.',
  'help.ctx.settings-integrations.title': 'Integraciones',
  'help.ctx.settings-integrations.summary':
    'Todo lo que se conecta a TREK desde fuera: bibliotecas de fotos para el diario, AirTrail para los vuelos, Dawarich para saber por dónde has ido realmente, wanderer para rutas, claves de API de solo lectura para otros programas y MCP para clientes de IA. La conexión con otro servicio solo aparece cuando el administrador la ha activado.',
  'help.ctx.settings-integrations.bullet.1':
    'Immich y Synology Photos, AirTrail, Dawarich y wanderer: cada tarjeta tiene su dirección y su clave, Guardar y «Probar conexión», y una insignia «Conectado» o «No conectado».',
  'help.ctx.settings-integrations.bullet.2':
    '«Claves API»: claves de solo lectura para la API pública, cada una limitada a las áreas que elijas, con el Endpoint para copiarlo.',
  'help.ctx.settings-integrations.bullet.3':
    '«Configuración MCP»: el «Endpoint MCP» y, en «Clientes OAuth 2.1», tus clientes registrados, la «Configuración del cliente» para copiarla y las «Sesiones OAuth activas» con Revocar.',
  'help.ctx.settings-integrations.bullet.4':
    '«Tokens de API»: la forma antigua de conectarse a MCP, marcada como «Obsoleto»; usa en su lugar «Clientes OAuth 2.1».',
  'help.ctx.settings-offline.title': 'Sin conexión',
  'help.ctx.settings-offline.summary':
    'Qué guarda TREK en este dispositivo para que puedas abrir un viaje sin conexión, y qué pasa cuando un cambio hecho sin conexión choca con otro hecho en otro sitio.',
  'help.ctx.settings-offline.bullet.1':
    '«Modo offline»: «Forzar el modo offline» primero lo descarga todo, después funciona solo con la caché y deja tus cambios en cola.',
  'help.ctx.settings-offline.bullet.2':
    '«Prepárate para estar offline»: «Descargar para uso offline» descarga los datos del viaje, los documentos y las teselas del mapa; «Volver a sincronizar ahora» sincroniza de nuevo manualmente.',
  'help.ctx.settings-offline.bullet.3':
    '«Qué almacenar offline»: «Almacenar mosaicos del mapa offline» y un interruptor por viaje. Un viaje terminado solo se guarda si lo activas.',
  'help.ctx.settings-offline.bullet.4':
    '«Conflictos de sincronización» solo aparece cuando dos cambios entran en conflicto, con «La mía», «Conservar la del servidor» y «Cuando ocurre un conflicto». «Caché offline» cuenta los viajes y los cambios pendientes o fallidos, con «Reintentar», Descartar y «Vaciar caché».',
  'help.ctx.settings-account.title': 'Cuenta',
  'help.ctx.settings-account.summary':
    'Tu cuenta en este TREK y cómo inicias sesión: foto de perfil, nombre de usuario y correo, contraseña, autenticación en dos factores y passkeys. «Eliminar cuenta» está al pie de la tarjeta «Cuenta».',
  'help.ctx.settings-account.bullet.1':
    'Cuenta: haz clic en la cámara de la imagen para subir una y en la papelera roja para quitarla. «Nombre de usuario» y «Correo» se guardan con «Guardar perfil».',
  'help.ctx.settings-account.bullet.2':
    '«Cambiar contraseña»: la contraseña actual, la nueva dos veces, con los requisitos marcándose a medida que escribes, y luego «Actualizar contraseña». Si en este TREK solo se inicia sesión mediante SSO, esta tarjeta no aparece.',
  'help.ctx.settings-account.bullet.3':
    'Autenticación de dos factores (2FA) con una app de autenticación y códigos de respaldo; llaves de acceso para iniciar sesión sin contraseña.',
  'help.ctx.settings-account.bullet.4':
    '«Eliminar cuenta» está a la izquierda del pie de la tarjeta «Cuenta» y pide confirmación. El único administrador no puede eliminarse a sí mismo.',
  // language-region
  'help.guide.language-region.title': 'Definir idioma, unidades y moneda',
  'help.guide.language-region.goal': 'Usa TREK en tu idioma y con los formatos de tu región.',
  'help.guide.language-region.step.1':
    'En «Idioma y región», elige un «Idioma» en la fila de opciones. TREK cambia al momento, en todos los dispositivos en los que inicies sesión.',
  'help.guide.language-region.step.2':
    '«Nombres de lugares» define el idioma que usan la búsqueda de lugares, las sugerencias y las direcciones; «Igual que la app» sigue el idioma de la interfaz.',
  'help.guide.language-region.result':
    'Las fechas, las distancias y los importes se muestran en el formato que esperas. En «Costes», los importes se muestran en tu moneda de visualización solo a modo informativo; los importes introducidos no cambian.',
  'help.guide.language-region.tip.1': '«Moneda del viaje» muestra cada viaje en su propia moneda, sin convertir.',
  'help.guide.language-region.tip.2':
    'El idioma también define los nombres de los días y los meses en «Vacaciones» y en el diario.',
  // travel-map-prefs
  'help.guide.travel-map-prefs.title': 'Ajustar el mapa del viaje y los títulos de los días',
  'help.guide.travel-map-prefs.goal':
    'Elige qué muestra el mapa del viaje y cómo se ven las cabeceras de los días, en todos los viajes.',
  'help.guide.travel-map-prefs.step.1':
    'En «Viaje y mapa», «Abrir lugares en» define qué aplicación de mapas abre directamente el botón de navegación; «Preguntar siempre» te deja elegir la aplicación cada vez. «Fecha primero en los títulos de día» muestra primero la fecha en la cabecera de cada día.',
  'help.guide.travel-map-prefs.step.2':
    '«Mostrar siempre las rutas de reserva» dibuja en el mapa todos los vuelos, trenes y demás reservas; «Etiquetas de rutas de reservas» añade el nombre de la estación o del aeropuerto en cada extremo. «Marcadores compactos para lugares sin planificar» reduce los lugares que aún no están en ningún día, para que las paradas planificadas se vean mejor.',
  'help.guide.travel-map-prefs.result':
    'El mapa usa estos ajustes en todos tus viajes hasta que los vuelvas a cambiar.',
  'help.guide.travel-map-prefs.tip.1':
    'Se guardan por cuenta, no por viaje. En un viaje compartido, cada miembro ve sus propias preferencias.',
  'help.guide.travel-map-prefs.tip.2':
    'Un administrador puede definir los valores predeterminados para todos; lo que cambies aquí se aplica solo a ti.',
  // startup
  'help.guide.startup.title': 'Elegir con qué se abre TREK',
  'help.guide.startup.goal': 'Abre TREK en la página que más usas, en lugar de en el panel cada vez.',
  'help.guide.startup.step.1': 'Arriba de «Pantalla», en «Inicio», pon «Página de inicio» en «Panel» o «Viaje activo».',
  'help.guide.startup.step.2':
    'Con «Viaje activo» aparece «Pestaña de inicio»: elige la pestaña con la que se abre ese viaje.',
  'help.guide.startup.result': 'La próxima vez que abras TREK, se abrirá directamente esa página.',
  'help.guide.startup.tip.1':
    '«Viaje activo» es el viaje en curso hoy o el próximo que tengas. Es el mismo viaje que el panel muestra arriba.',
  // theme-scheme
  'help.guide.theme-scheme.title': 'Definir el tema y el color de acento',
  'help.guide.theme-scheme.goal':
    'Pon TREK en modo claro, oscuro o según tu dispositivo, con el color que más te guste.',
  'help.guide.theme-scheme.step.1':
    'En «Tema», pon «Modo de color» en «Claro», «Oscuro» o «Automático». «Automático» sigue la configuración de tu dispositivo.',
  'help.guide.theme-scheme.step.2':
    'Elige un esquema de color: «Predeterminado», alto contraste, índigo, verde azulado, rosa, «Ámbar», violeta o «Personalizado».',
  'help.guide.theme-scheme.step.3':
    'Con «Personalizado», elige uno de los puntos de color o define tu propio color de acento por separado para «Claro» y «Oscuro». La píldora de al lado indica «Buen contraste» o «Poco contraste».',
  'help.guide.theme-scheme.result':
    'Los botones, los enlaces y los resaltados usan el color de acento en todas partes, en todos los dispositivos en los que inicies sesión.',
  'help.guide.theme-scheme.tip.1':
    'En la barra de navegación también tienes un interruptor rápido de modo claro u oscuro; cambia el mismo tema.',
  'help.guide.theme-scheme.tip.2': 'Si el esquema predeterminado te cuesta de leer, elige «High contrast».',
  // readability
  'help.guide.readability.title': 'Ajustar la legibilidad y el tamaño del texto',
  'help.guide.readability.goal':
    'Reduce el efecto cristal y las animaciones, o aumenta el espacio o el tamaño del texto.',
  'help.guide.readability.step.1':
    'En «Legibilidad», «Transparencia» cambia los paneles de cristal por superficies opacas, «Reducir movimiento» reduce al mínimo las animaciones y «Densidad» elige entre cómoda y compacta.',
  'help.guide.readability.step.2':
    '«Tamaño del texto»: arrastra «Todo» para escalar todo el texto a la vez, o ajusta «Grande», «Mediano», «Normal» y «Pequeño» uno a uno. Cada tamaño muestra un ejemplo, así ves el resultado mientras arrastras.',
  'help.guide.readability.result':
    'El cambio se aplica a toda la aplicación a la vez, incluidos los paneles del mapa y el diario.',
  'help.guide.readability.tip.1':
    'Algunas partes de TREK ya usan menos animaciones si tu dispositivo tiene activada la reducción de movimiento. «Reducir movimiento» reduce las animaciones en el resto.',
  'help.guide.readability.tip.2':
    'El tamaño del texto se aplica por niveles tipográficos, así que no se corta nada; si un tamaño ya no cabe, el texto pasa a la línea siguiente.',
  // dashboard-widgets
  'help.guide.dashboard-widgets.title': 'Elegir los widgets del panel',
  'help.guide.dashboard-widgets.goal': 'Muestra solo los widgets que usas, por separado en el ordenador y en el móvil.',
  'help.guide.dashboard-widgets.step.1':
    'En «Widgets del panel», el apartado de escritorio muestra los widgets «Debajo del héroe» y la «Barra lateral derecha». Al desactivar «Barra lateral derecha» se oculta toda la columna y el panel se centra; sus widgets aparecen atenuados hasta que vuelvas a activarla.',
  'help.guide.dashboard-widgets.step.2':
    'El móvil tiene sus propios interruptores, «Debajo del héroe» y «Final de la página», para el panel en tu teléfono.',
  'help.guide.dashboard-widgets.result':
    'El panel cambia al momento. Si la barra lateral derecha está desactivada, el panel se centra.',
  'help.guide.dashboard-widgets.tip.1':
    'Los widgets de un complemento solo aparecen si el administrador tiene activado ese complemento.',
  'help.guide.dashboard-widgets.tip.2':
    'El propio panel recuerda en cada dispositivo si usas la vista de cuadrícula o de lista y el orden.',
  // map-provider
  'help.guide.map-provider.title': 'Elegir el motor y el estilo del mapa',
  'help.guide.map-provider.goal': 'Cambia entre el mapa clásico, las teselas vectoriales y el mapa en 3D de Mapbox.',
  'help.guide.map-provider.step.1':
    'En «Proveedor de mapa», elige Leaflet para el mapa 2D clásico con cualquier tesela ráster, Mapbox GL para teselas vectoriales con edificios y relieve en 3D, o MapLibre GL para teselas vectoriales de OpenFreeMap sin token.',
  'help.guide.map-provider.step.2':
    'Elige una «Plantilla del mapa» para Leaflet o un «Estilo de mapa» para un motor GL, o pega tu propia URL. Mapbox GL necesita un «Token de acceso de Mapbox», y las plantillas de CARTO, una «Clave de API de CARTO»; el enlace bajo cada campo te indica dónde conseguirlos.',
  'help.guide.map-provider.step.3':
    'Con Mapbox GL, activa «Edificios 3D y terreno» y, si tu dispositivo es lo bastante rápido, «Modo de alta calidad». Comprueba la vista previa y haz clic en «Guardar mapa».',
  'help.guide.map-provider.result':
    'El planificador de viajes y los mapas del diario usan el motor que has elegido. El atlas siempre usa Leaflet.',
  'help.guide.map-provider.tip.1': 'Sin token, Mapbox GL usa Leaflet en lugar de mostrar un mapa vacío.',
  'help.guide.map-provider.tip.2':
    'Los mosaicos del mapa que guardas sin conexión son del proveedor que esté activo en el momento de descargarlos.',
  // notification-channels
  'help.guide.notification-channels.title': 'Elegir dónde recibes las notificaciones',
  'help.guide.notification-channels.goal':
    'Recibe recordatorios de viaje y avisos de colaboración en el móvil o en otra herramienta.',
  'help.guide.notification-channels.step.1':
    'Para un webhook, pega una «URL del webhook» de Discord, Slack o personalizada, haz clic en Probar y luego en Guardar.',
  'help.guide.notification-channels.step.2':
    'Para ntfy, rellena el «Tema de Ntfy» y, si tienes tu propio servidor, añade su «URL del servidor Ntfy» y un Access Token. Probar envía un mensaje al momento; Guardar guarda los ajustes.',
  'help.guide.notification-channels.step.3':
    'En la tarjeta «Notificaciones» de arriba, activa o desactiva cada evento por canal. Un candado indica que el administrador lo ha desactivado para todos. Un canal de plugin muestra Configurar hasta que se configura; «Enviar prueba» lo prueba.',
  'help.guide.notification-channels.result':
    'Los eventos se envían por los canales que has activado para ellos. La columna «En la app» decide lo que muestra la campana de la barra de navegación.',
  'help.guide.notification-channels.tip.1':
    'El «Recordatorio» de cada viaje, es decir, cuántos días antes de la salida, se define en el formulario de edición del viaje.',
  'help.guide.notification-channels.tip.2':
    'El administrador puede rellenar de antemano un servidor ntfy predeterminado para todos; el tema lo sigues eligiendo tú.',
  // photo-providers
  'help.guide.photo-providers.title': 'Conectar una biblioteca de fotos',
  'help.guide.photo-providers.goal': 'Haz que el diario cargue las fotos de cada día desde Immich o Synology Photos.',
  'help.guide.photo-providers.step.1':
    'En «Integraciones», busca la tarjeta de Immich o de Synology Photos e introduce lo que pide: la «URL del servidor» con una «Clave API» para Immich, o un «Nombre de usuario» y una «Contraseña» para Synology Photos. Immich también puede copiar las fotos de la travesía a la biblioteca de Immich al subirlas.',
  'help.guide.photo-providers.step.2':
    'Haz clic en «Probar conexión» y luego en Guardar. La insignia cambia a «Conectado».',
  'help.guide.photo-providers.result':
    'La pestaña «Fotos externas» del editor de entradas busca en la biblioteca conectada fotos del día de la entrada, empezando por las más cercanas a su ubicación.',
  'help.guide.photo-providers.tip.1':
    'La conexión es solo de tu cuenta: los demás miembros de una travesía conectan sus propias bibliotecas.',
  'help.guide.photo-providers.tip.2':
    'Un proveedor cuyas fotos no tienen datos GPS también funciona. En ese caso, la lista se ordena por hora.',
  // api-keys
  'help.guide.api-keys.title': 'Crear una clave de API',
  'help.guide.api-keys.goal': 'Permite que otros programas lean tus viajes a través de la API pública.',
  'help.guide.api-keys.step.1':
    'En «Claves API», haz clic en «Crear clave», ponle un «Nombre» que indique dónde se va a usar y, en «Qué puede leer esta clave», deja solo las áreas que necesita. Haz clic en Crear.',
  'help.guide.api-keys.step.2':
    'Copia la clave en «Clave API creada»: solo se muestra una vez. Haz clic en «Listo». El Endpoint to call aparece debajo de la lista.',
  'help.guide.api-keys.result':
    'Los programas que tengan la clave pueden leer las áreas elegidas, pero nunca cambiar nada. La lista muestra cuándo se creó cada clave y cuándo se usó por última vez, y la papelera la elimina.',
  'help.guide.api-keys.tip.1': 'Usa una clave por herramienta, para poder revocar una sin afectar a las demás.',
  'help.guide.api-keys.tip.2':
    'Si quieres que un cliente de IA pueda hacer cambios, usa MCP con OAuth; las claves de API solo leen.',
  // mcp-oauth
  'help.guide.mcp-oauth.title': 'Conectar un asistente de IA por MCP',
  'help.guide.mcp-oauth.goal': 'Da acceso a tus viajes a Claude, a un IDE o a otro cliente MCP.',
  'help.guide.mcp-oauth.step.1': 'En «Configuración MCP», copia el «Endpoint MCP» para tu cliente.',
  'help.guide.mcp-oauth.step.2':
    'En «Clientes OAuth 2.1», haz clic en «Nuevo cliente» y elige un ajuste rápido, como Claude Desktop o Cursor, o rellena tú el «Nombre de la aplicación», las «URIs de redirección» y los «Ámbitos permitidos»; para un servidor sin navegador, elige el cliente de máquina. Haz clic en «Registrar cliente» y copia el «Secreto de cliente»: solo se muestra una vez.',
  'help.guide.mcp-oauth.step.3':
    'Cada cliente tiene «Renovar secreto» y «Eliminar cliente». «Sesiones OAuth activas» muestra los clientes con sesión iniciada, con Revocar. «Configuración del cliente» se despliega y muestra un fragmento listo para usar en los clientes que usan JSON.',
  'help.guide.mcp-oauth.result':
    'El cliente puede leer y cambiar lo que permiten sus ámbitos, en tu nombre, y todas sus acciones aparecen con tu nombre.',
  'help.guide.mcp-oauth.tip.1':
    'Los permisos limitan lo que puede hacer un cliente: dale solo el permiso de lectura hasta que necesite más.',
  'help.guide.mcp-oauth.tip.2':
    'El administrador puede desactivar MCP para toda la instancia. En ese caso, esta sección no aparece.',
  // offline-prepare
  'help.guide.offline-prepare.title': 'Usar viajes sin conexión',
  'help.guide.offline-prepare.goal':
    'Guarda tus viajes y sus mapas en este dispositivo antes de quedarte sin conexión.',
  'help.guide.offline-prepare.step.1':
    'En «Qué almacenar offline», deja activado «Almacenar mosaicos del mapa offline» y activa los viajes que quieras tener en este dispositivo. Un viaje terminado solo se guarda si lo activas.',
  'help.guide.offline-prepare.step.2':
    'De vuelta arriba, en «Prepárate para estar offline», haz clic en «Descargar para uso offline». Descarga los datos del viaje, los documentos y los mosaicos del mapa, e indica cuántos viajes ha guardado.',
  'help.guide.offline-prepare.step.3':
    '«Forzar el modo offline» descarga una vez más y luego funciona solo con lo guardado en este dispositivo, para que compruebes que está todo antes de salir.',
  'help.guide.offline-prepare.result':
    'Los viajes se abren sin conexión. Los cambios que hagas se guardan en una cola y se envían cuando vuelvas a tener conexión.',
  'help.guide.offline-prepare.tip.1':
    'Las teselas del mapa son lo que más espacio ocupa; desactívalas para guardar solo los datos del viaje y los documentos.',
  'help.guide.offline-prepare.tip.2':
    'Instala TREK como aplicación desde el navegador para que el inicio sin conexión sea más fluido.',
  // offline-conflicts
  'help.guide.offline-conflicts.title': 'Decidir qué versión se conserva en un conflicto de sincronización',
  'help.guide.offline-conflicts.goal':
    'Elige cómo resuelve TREK un conflicto entre un cambio hecho sin conexión y otro hecho en otro sitio.',
  'help.guide.offline-conflicts.step.1':
    'Si un cambio que hiciste sin conexión entra en conflicto con otro más reciente, aparece «Conflictos de sincronización» cerca de la parte superior de «Sin conexión». Para cada cambio, haz clic en «La mía» o en «Conservar la del servidor».',
  'help.guide.offline-conflicts.step.2':
    'En la misma tarjeta, «Cuando ocurre un conflicto» decide qué pasará la próxima vez: «Preguntarme cada vez», «Conservar siempre mi versión» o «Conservar siempre la versión del servidor».',
  'help.guide.offline-conflicts.result':
    'Con «Preguntarme cada vez», el conflicto se queda en «Conflictos de sincronización» hasta que elijas. Con las otras dos opciones, TREK lo resuelve automáticamente.',
  'help.guide.offline-conflicts.tip.1':
    '«Vaciar caché» solo borra la copia de este dispositivo. En el servidor no cambia nada.',
  // profile
  'help.guide.profile.title': 'Cambiar tu perfil',
  'help.guide.profile.goal': 'Actualiza tu nombre, tu correo y tu imagen.',
  'help.guide.profile.step.1':
    'En la tarjeta «Cuenta», haz clic en la cámara de tu imagen para subir una; la papelera roja la quita y vuelve a mostrar tu inicial.',
  'help.guide.profile.step.2': 'Edita «Nombre de usuario» y «Correo» debajo de la imagen.',
  'help.guide.profile.result':
    'Tu nombre y tu imagen se actualizan en todas partes a la vez, también en los viajes que compartes.',
  'help.guide.profile.tip.1':
    'Una cuenta vinculada mediante SSO muestra una insignia SSO y «Vinculado con» su proveedor.',
  // password
  'help.guide.password.title': 'Cambiar tu contraseña',
  'help.guide.password.goal': 'Define una nueva contraseña.',
  'help.guide.password.step.1':
    'En «Cambiar contraseña», introduce tu «Contraseña actual», luego la «Nueva contraseña» y repítela en «Confirmar nueva contraseña». La lista de debajo marca cada requisito que cumples mientras escribes.',
  'help.guide.password.step.2': 'Haz clic en «Actualizar contraseña».',
  'help.guide.password.result':
    'La nueva contraseña se aplica al momento. Se cierra la sesión en todos los demás dispositivos, se eliminan tus tokens de API de MCP y los clientes OAuth tienen que volver a iniciar sesión; este dispositivo mantiene la sesión.',
  'help.guide.password.tip.1':
    'Si en este TREK solo se inicia sesión mediante SSO, no hay contraseña de TREK ni tarjeta «Cambiar contraseña».',
  // mfa
  'help.guide.mfa.title': 'Activar la autenticación en dos pasos',
  'help.guide.mfa.goal': 'Protege la cuenta con un código de una app de autenticación.',
  'help.guide.mfa.step.1': 'En «Autenticación de dos factores (2FA)», haz clic en «Configurar autenticador».',
  'help.guide.mfa.step.2':
    'Escanea el código QR con tu aplicación o introduce el secreto a mano, escribe el código de seis cifras que aparece y haz clic en «Activar 2FA».',
  'help.guide.mfa.step.3':
    'Guarda los códigos de respaldo con «Copiar códigos», «Descargar TXT» o «Imprimir / PDF» y haz clic en OK. Cada código sirve una sola vez. Usa un código cuando no tengas el móvil a mano.',
  'help.guide.mfa.result': 'Cada vez que inicies sesión se te pedirá un código después de la contraseña.',
  'help.guide.mfa.tip.1':
    'Para «Desactivar 2FA» necesitas tu contraseña y un código actual o un código de respaldo sin usar.',
  'help.guide.mfa.tip.2': 'El administrador puede exigir 2FA a todos; en ese caso, no se puede desactivar aquí.',
  // passkeys
  'help.guide.passkeys.title': 'Iniciar sesión con una passkey',
  'help.guide.passkeys.goal': 'Usa la huella, el rostro o el PIN de tu dispositivo en lugar de una contraseña.',
  'help.guide.passkeys.step.1':
    'En Passkeys, haz clic en «Añadir una passkey», confirma tu contraseña actual y ponle un nombre que indique de qué dispositivo se trata; después sigue las indicaciones de tu dispositivo.',
  'help.guide.passkeys.step.2':
    'Cada passkey indica si está «Sincronizado» o vinculada a «Este dispositivo» y cuándo se usó por última vez. «Renombrar» cambia su nombre, y el botón de eliminar la borra tras introducir tu contraseña.',
  'help.guide.passkeys.result':
    'La página de inicio de sesión te ofrece la llave de acceso. Puedes seguir entrando con tu contraseña.',
  'help.guide.passkeys.tip.1':
    'Una passkey se guarda en el dispositivo o en su gestor de contraseñas, así que añade una passkey por cada dispositivo.',
  'help.guide.passkeys.tip.2':
    'Las passkeys solo aparecen cuando el administrador las ha activado. Mientras el servidor no tenga su dominio WebAuthn, la tarjeta lo indica en lugar de ofrecer «Añadir una passkey».',
  // delete-account
  'help.guide.delete-account.title': 'Eliminar tu cuenta',
  'help.guide.delete-account.goal': 'Elimina tu cuenta y los datos que solo te pertenecen a ti.',
  'help.guide.delete-account.step.1':
    'En la tarjeta «Cuenta», haz clic en «Eliminar cuenta», a la izquierda del pie, y luego en «Eliminar permanentemente».',
  'help.guide.delete-account.result':
    'Tu cuenta se elimina, junto con los viajes, lugares y archivos que te pertenecen. Los viajes de otras personas se conservan.',
  'help.guide.delete-account.tip.1':
    'Si eres el único administrador, TREK muestra «No es posible eliminarla»: primero haz administrador a otro usuario.',
  'help.guide.delete-account.tip.2': 'No se puede deshacer. Exporta lo que quieras conservar antes de confirmar.',

  // ── Screen: admin (all tabs) ──────────────────────────────────────────────────────────
  'help.ctx.admin.title': 'Administrador',
  'help.ctx.admin.summary':
    'Ajustes de toda la instancia de TREK, para todos los usuarios: quién puede iniciar sesión y cómo, qué está activado, dónde se guardan los archivos, cómo contacta el servidor con las personas y cómo se hacen las copias de seguridad. Solo los administradores ven esta página. La barra lateral agrupa las pestañas en «Usuarios», «Configuración», «Integraciones» y «Mantenimiento», y cada pestaña es una pantalla independiente.',
  'help.ctx.admin.bullet.1':
    'La cabecera muestra a la derecha el número de usuarios, viajes, lugares y archivos. Debajo aparece el banner «Actualización disponible» cuando hay una versión más reciente de TREK.',
  'help.ctx.admin.bullet.2':
    '«Usuarios» y «Valores predeterminados»: cuentas, enlaces de invitación y permisos, y los ajustes y el mapa con los que empieza una cuenta nueva.',
  'help.ctx.admin.bullet.3':
    '«Personalización», «Ajustes», «Complementos», «Plugins» y «Almacenamiento»: plantillas de equipaje, categorías y vacaciones escolares; inicio de sesión, passkeys, 2FA, claves de API y proveedores de búsqueda; los módulos de funciones; plugins de terceros; y dónde se guardan los archivos subidos.',
  'help.ctx.admin.bullet.4':
    '«Notificaciones», «Acceso MCP» y GitHub: los canales que pueden elegir los usuarios y los valores con los que empiezan, los tokens y sesiones de los clientes de IA, y el historial de versiones.',
  'help.ctx.admin.bullet.5':
    '«Copia de seguridad» y «Auditoría»: copias manuales y programadas, y el registro de eventos relevantes para la seguridad.',
  'help.ctx.admin-users.title': 'Usuarios',
  'help.ctx.admin-users.summary':
    'Todas las cuentas de este TREK, con su rol, su correo y su última actividad, los enlaces de invitación que permiten registrarse en una instancia cerrada, y quién puede hacer qué en los viajes.',
  'help.ctx.admin-users.bullet.1':
    'La tabla: usuario, correo, rol, fecha de creación y «Última actividad», con «Editar usuario» y «Eliminar usuario» en cada fila. Un punto verde en el avatar indica que la persona está conectada ahora; tu propia fila indica «(Tú)».',
  'help.ctx.admin-users.bullet.2':
    '«Crear usuario», arriba a la derecha de la tarjeta «Usuarios», añade una cuenta a mano con una contraseña que le das al usuario.',
  'help.ctx.admin-users.bullet.3':
    '«Enlaces de invitación», debajo: enlaces de registro con un límite de usos, una fecha de caducidad y, si quieres, un viaje al que se une el nuevo usuario al registrarse.',
  'help.ctx.admin-users.bullet.4':
    '«Configuración de permisos», abajo: para cada acción, quién puede hacerla («Todos», «Miembros del viaje», «Propietario del viaje» o «Solo administrador»). Haz clic en Guardar, arriba de la tarjeta, para guardarlo.',
  'help.ctx.admin-defaults.title': 'Valores predeterminados',
  'help.ctx.admin-defaults.summary':
    'Con qué empieza una cuenta nueva, para que nadie tenga que configurarlo antes: modo de color, unidades, formato de hora, primer día de la semana, moneda de visualización y códigos de reserva difuminados, además del mapa, sus claves y los servidores de rutas.',
  'help.ctx.admin-defaults.bullet.1':
    '«Configuración predeterminada de usuarios», a la izquierda: «Modo de color», «Unidad de temperatura», «Unidad de distancia», «Formato de hora», «La semana comienza el», «Moneda de visualización» y «Difuminar códigos de reserva».',
  'help.ctx.admin-defaults.bullet.2':
    '«Mapa», a la derecha: «Plantilla del mapa», «Clave de CARTO compartida», «Motor de rutas propio» e «Instancia de Valhalla propia», una vista previa y, después, «Motor de mapas» con «Estilo de mapa», «Token de Mapbox compartido», «Edificios y terreno en 3D» y «Modo de alta calidad».',
  'help.ctx.admin-config.title': 'Personalización',
  'help.ctx.admin-config.summary':
    'Ajustes que comparten todos los viajes de la instancia: las plantillas de equipaje, el conjunto de categorías para lugares y colecciones, y el catálogo de vacaciones escolares que usa «Vacaciones».',
  'help.ctx.admin-config.bullet.1':
    '«Plantillas de equipaje»: listas con nombre de categorías y artículos que la lista de equipaje de un viaje puede usar como punto de partida.',
  'help.ctx.admin-config.bullet.2':
    '«Categorías»: nombre, icono y color de las categorías que se usan en todo TREK, desde el detalle del lugar hasta «Colecciones», cada una editable en un cuadro con vista previa.',
  'help.ctx.admin-config.bullet.3':
    '«Vacaciones escolares»: el catálogo de países y regiones con sus periodos de vacaciones, que todo el mundo puede elegir en «Vacaciones».',
  'help.ctx.admin-settings.title': 'Ajustes',
  'help.ctx.admin-settings.summary':
    'Cómo inicia sesión la gente y qué servicios externos puede usar el servidor. A la izquierda: «Métodos de autenticación», «Inicio de sesión con passkey», «Exigir autenticación en dos factores (2FA)» e «Inicio de sesión único (OIDC)». A la derecha: «Tipos de archivo permitidos» y «Claves API» con los proveedores de búsqueda y de transporte público. La «Zona de peligro» está abajo del todo.',
  'help.ctx.admin-settings.bullet.1':
    '«Métodos de autenticación»: Password Login, Password Registration y, una vez configurado OIDC, SSO Login y SSO Auto-Provisioning. «Exigir autenticación en dos factores (2FA)» tiene su propia tarjeta.',
  'help.ctx.admin-settings.bullet.2':
    '«Inicio de sesión con passkey»: «Activar inicio de sesión con passkey», el «Relying Party ID (dominio)» y los «Orígenes permitidos». «Inicio de sesión único (OIDC)»: «Nombre visible», «URL del emisor», una URL de descubrimiento opcional, «ID de cliente» y «Secreto de cliente».',
  'help.ctx.admin-settings.bullet.3':
    '«Claves API»: la API de lugares de TREK va primero y no necesita clave. Debajo están la «Clave API de Google Maps» (con Probar y «Para qué se usa la clave»), la clave de Unsplash y la de Amap, y un solo botón Guardar al pie de la tarjeta.',
  'help.ctx.admin-settings.bullet.4':
    '«Proveedor de transporte público» y «Proveedor de búsqueda de lugares» eligen quién responde a las búsquedas de transporte y de lugares; «Registro de búsquedas de lugares» registra qué resultado se eligió; «Tipos de archivo permitidos» limita lo que se puede subir.',
  'help.ctx.admin-addons.title': 'Complementos',
  'help.ctx.admin-addons.summary':
    'Los módulos de funciones de TREK, cada uno con su interruptor: Equipaje, Presupuesto, Documentos, Vacaciones, Atlas, Colaboración, Travesía, Colecciones, Viaje por carretera, MCP, AirTrail, Dawarich y el análisis con IA. Si lo desactivas, la entrada del menú, las rutas y la API desaparecen para todos.',
  'help.ctx.admin-addons.bullet.1':
    'Una casilla por complemento con su interruptor y, si tiene opciones, filas secundarias para ellas.',
  'help.ctx.admin-addons.bullet.2':
    'Los proveedores de fotos y de documentos también aparecen aquí como casillas, para que Immich o Synology se puedan ofrecer a los usuarios.',
  'help.ctx.admin-addons.bullet.3': '«Seguimiento de equipaje» tiene su propio interruptor debajo de las casillas.',
  'help.ctx.admin-plugins.title': 'Plugins', // same-as-en
  'help.ctx.admin-plugins.summary':
    'Plugins de terceros que se ejecutan en su propio proceso junto a TREK, cada uno con los permisos que pidió al instalarse. Puedes instalarlos desde el catálogo, subir un paquete o vincular una carpeta mientras desarrollas un plugin.',
  'help.ctx.admin-plugins.bullet.1':
    '«Instalado» y «Descubrir», con «Buscar plugins…» y los filtros «Tipo», «Estado» y «Ordenar». Cada fila muestra la versión, «Revisado», «Firmado» o «Sin firmar», a qué puede acceder el plugin, un interruptor y un menú ⋯.',
  'help.ctx.admin-plugins.bullet.2':
    'Los dos iconos de la cabecera de la tarjeta: «Subir plugin» acepta un .zip, .tgz o .tar.gz (o suelta un .zip en la página); «Volver a escanear» detecta una carpeta de plugin enlazada para desarrollo.',
  'help.ctx.admin-plugins.bullet.3':
    '«Hosts permitidos» por plugin: las direcciones a las que puede conectarse un plugin, ya que las conexiones salientes están bloqueadas por defecto.',
  'help.ctx.admin-storage.title': 'Almacenamiento',
  'help.ctx.admin-storage.summary':
    'Dónde se guardan los archivos subidos: en el disco local o en un bucket S3, con copia opcional a otros destinos. Cada categoría de archivos puede ir a un destino distinto, y no cambia nada hasta que haces clic en «Guardar cambios».',
  'help.ctx.admin-storage.bullet.1':
    '«Salud», arriba: las escrituras fallidas en un destino espejo, o «No se registraron fallos de réplica.».',
  'help.ctx.admin-storage.bullet.2':
    '«Backends»: nombre, tipo, uso y Mirrored to, con Probar, Editar y Eliminar. «Calcular ahora» calcula lo almacenado; un backend definido por una variable de entorno es de solo lectura.',
  'help.ctx.admin-storage.bullet.3':
    '«Categorías»: documentos del viaje, fotos de la travesía, portadas, fotos de perfil, imágenes de lugares, las cachés de fotos y las copias de seguridad, cada una asignada a un backend.',
  'help.ctx.admin-notifications.title': 'Notificaciones',
  'help.ctx.admin-notifications.summary':
    'Los canales que la instancia ofrece a sus usuarios y los que recibes tú como administrador. Los usuarios eligen sus propios temas y URL en «Ajustes»; tú decides qué canales existen y configuras el correo.',
  'help.ctx.admin-notifications.bullet.1':
    '«Correo (SMTP)», Webhook, Ntfy y Web Push tienen cada uno un interruptor para ofrecer el canal a los usuarios; el correo también necesita los ajustes de su servidor. «En la app» siempre está activado.',
  'help.ctx.admin-notifications.bullet.2':
    '«Recordatorios de viaje»: si el servidor envía el recordatorio antes de que empiece un viaje.',
  'help.ctx.admin-notifications.bullet.3':
    '«Webhook de admin», «Ntfy de admin» y la tarjeta «Notificaciones»: adónde van los eventos de administración («Nueva versión disponible», «Fallo de réplica de almacenamiento», «Región de kayak pedida»), cada uno con un botón de prueba.',
  'help.ctx.admin-mcp-tokens.title': 'Acceso MCP',
  'help.ctx.admin-mcp-tokens.summary':
    'Todos los tokens y sesiones OAuth que tienen los clientes de IA en este TREK, de todos los usuarios. Puedes revocar cualquiera de ellos.',
  'help.ctx.admin-mcp-tokens.bullet.1':
    '«Sesiones OAuth»: el cliente, los ámbitos que se le concedieron, su propietario y la fecha, con una papelera para revocarla.',
  'help.ctx.admin-mcp-tokens.bullet.2':
    '«Tokens de API»: nombre, propietario, «Creado» y «Último uso», con una papelera para eliminarlo.',
  'help.ctx.admin-github.title': 'GitHub',
  'help.ctx.admin-github.summary':
    'Novedades de TREK: el historial de versiones de GitHub y si hay una versión más reciente que la tuya. La actualización en sí se hace fuera de la aplicación, en el servidor.',
  'help.ctx.admin-github.bullet.1':
    '«Historial de versiones» muestra las versiones en una cronología con sus notas. La más reciente lleva la etiqueta «Última», las versiones preliminares indican «Prelanzamiento» y GitHub abre la página de versiones.',
  'help.ctx.admin-github.bullet.2':
    '«Actualización disponible» aparece bajo la cabecera de la página cuando hay una versión más reciente; «Cómo actualizar» muestra los comandos para Docker o la guía de actualización para otras instalaciones.',
  'help.ctx.admin-backup.title': 'Copia de seguridad',
  'help.ctx.admin-backup.summary':
    'Copias de seguridad completas de la base de datos y de los archivos subidos, hechas a mano o de forma programada, guardadas en el servidor y descargables en un solo archivo. Usa Restaurar para recuperar una copia.',
  'help.ctx.admin-backup.bullet.1':
    '«Copia de seguridad de datos»: «Crear copia» y «Subir copia de seguridad» arriba de la tarjeta, y la lista de copias con Descargar, Restaurar y un icono de papelera para eliminar.',
  'help.ctx.admin-backup.bullet.2':
    '«Subir copia de seguridad» restaura desde un archivo creado en otra instancia o en un día anterior, tras la misma pregunta que Restaurar.',
  'help.ctx.admin-backup.bullet.3':
    '«Copia automática»: activada o desactivada, «Intervalo», «Ejecutar a la hora» y el día, y «Eliminar copias antiguas después de» (de «1 día» a «Conservar para siempre»); se aplica con Guardar.',
  'help.ctx.admin-audit.title': 'Auditoría',
  'help.ctx.admin-audit.summary':
    'El registro de eventos administrativos y relevantes para la seguridad: inicios de sesión y fallos, cambios de MFA, cambios de usuarios y de ajustes, copias de seguridad y restauraciones. Solo lectura, de lo más reciente a lo más antiguo.',
  'help.ctx.admin-audit.bullet.1':
    'Una fila por evento con la hora, el usuario, la acción, el recurso, la IP y los detalles.',
  'help.ctx.admin-audit.bullet.2':
    'Actualizar, en la cabecera de la tarjeta, vuelve a cargar la lista. La insignia junto al título indica cuántas entradas hay cargadas del total, y «Cargar más» carga entradas más antiguas.',
  // create-user
  'help.guide.create-user.title': 'Crear un usuario',
  'help.guide.create-user.goal': 'Crea una cuenta a mano, sin invitación.',
  'help.guide.create-user.step.1': 'Haz clic en «Crear usuario», arriba a la derecha de la tarjeta «Usuarios».',
  'help.guide.create-user.step.2':
    'Introduce «Nombre de usuario», «Correo» y una «Contraseña»; la lista bajo la contraseña muestra qué requisitos cumple. Elige el «Rol»: «Usuario» o «Administrador».',
  'help.guide.create-user.step.3': 'Haz clic en «Crear usuario».',
  'help.guide.create-user.result':
    'La cuenta aparece en la tabla y puede iniciar sesión al momento. Pásale la contraseña a la persona por un canal de confianza.',
  'help.guide.create-user.tip.1': 'Si la persona debe elegir su propia contraseña, es mejor un enlace de invitación.',
  'help.guide.create-user.tip.2':
    'Un «Administrador» ve esta página y puede hacerlo todo. Lo que un «Usuario» puede hacer en los viajes se define más abajo, en «Configuración de permisos».',
  // edit-user
  'help.guide.edit-user.title': 'Cambiar los datos o la contraseña de un usuario',
  'help.guide.edit-user.goal':
    'Cambia el nombre de alguien, sube o baja su rol, o ayúdale a volver a entrar si ha perdido la contraseña.',
  'help.guide.edit-user.step.1':
    'Haz clic en el lápiz («Editar usuario») de la fila del usuario. El cuadro muestra arriba el correo de la cuenta.',
  'help.guide.edit-user.step.2':
    'Cambia «Nombre de usuario», «Correo» o «Rol», o escribe una «Nueva contraseña» (déjala vacía para mantener la actual), y haz clic en Guardar. «Restablecer passkeys», abajo del todo, elimina todas las passkeys de la cuenta tras confirmarlo.',
  'help.guide.edit-user.result':
    'El cambio se aplica al momento. Una contraseña nueva también cierra la sesión de la persona en todos sus dispositivos, así que cualquier sesión antigua deja de funcionar.',
  'help.guide.edit-user.tip.1': 'No puedes quitarte el rol de administrador si eres el último administrador.',
  'help.guide.edit-user.tip.2':
    'Al restablecer las passkeys se conserva la contraseña; la persona añade passkeys nuevas en «Ajustes», «Cuenta».',
  // invite-links
  'help.guide.invite-links.title': 'Invitar a alguien con un enlace',
  'help.guide.invite-links.goal':
    'Permite que alguien se registre en una instancia cerrada y, si quieres, añádelo a un viaje.',
  'help.guide.invite-links.step.1':
    'Haz clic en «Crear enlace», arriba a la derecha de la tarjeta «Enlaces de invitación».',
  'help.guide.invite-links.step.2':
    'Elige «Usos máx.» (de 1× a 5×, o ∞) y «Expira después de» (de 1d a 14d, o ∞), opcionalmente un viaje en «Añadir a un viaje (opcional)», y haz clic en «Crear y copiar».',
  'help.guide.invite-links.step.3':
    'Envía el enlace. Cada fila muestra cuántas veces se ha usado, cuándo caduca, a qué viaje añade y quién lo creó, con «Activo», «Expirado» o «Agotado» al lado. «Copiar enlace» lo vuelve a copiar, y la papelera lo elimina.',
  'help.guide.invite-links.result':
    'Quien abra el enlace se registra con su propia contraseña. Si se eligió un viaje, se une a él al momento.',
  'help.guide.invite-links.tip.1':
    'Los enlaces de invitación funcionan aunque Password Registration esté desactivado en «Ajustes».',
  'help.guide.invite-links.tip.2':
    'Para una sola persona, lo más seguro es un enlace de un solo uso con caducidad corta.',
  // delete-user
  'help.guide.delete-user.title': 'Eliminar un usuario',
  'help.guide.delete-user.goal': 'Elimina una cuenta y todo lo que le pertenece.',
  'help.guide.delete-user.step.1':
    'Haz clic en la papelera («Eliminar usuario») de la fila del usuario y confirma con Eliminar.',
  'help.guide.delete-user.result':
    'La cuenta se elimina, junto con todos los viajes y travesías que le pertenecen, incluso los viajes que compartía con otros. Los viajes en los que solo era miembro se quedan con sus propietarios.',
  'help.guide.delete-user.tip.1': 'No se puede deshacer. Si no estás seguro, haz antes una copia de seguridad.',
  'help.guide.delete-user.tip.2':
    'La papelera de tu propia fila no funciona: no puedes eliminarte a ti mismo. Tiene que hacerlo otro administrador.',
  // permissions
  'help.guide.permissions.title': 'Decidir quién puede hacer qué',
  'help.guide.permissions.goal': 'Define, para cada acción, qué rol puede realizarla en este TREK.',
  'help.guide.permissions.step.1':
    'En «Configuración de permisos», busca la acción dentro de su grupo, como «Eliminar viajes» en «Gestión de viajes», y elige quién puede hacerla: «Todos», «Miembros del viaje», «Propietario del viaje» o «Solo administrador». Las filas modificadas se marcan como «personalizado».',
  'help.guide.permissions.step.2':
    'Haz clic en Guardar, arriba a la derecha de la tarjeta. «Restablecer valores predeterminados» devuelve cada fila a su nivel de fábrica; después haz clic también en Guardar.',
  'help.guide.permissions.result':
    'La regla se aplica a todos los viajes a la vez. Quien esté por debajo del nivel deja de ver los botones y menús correspondientes.',
  'help.guide.permissions.tip.1':
    '«Propietario del viaje» es la persona que creó el viaje; los administradores siempre pueden hacerlo todo.',
  'help.guide.permissions.tip.2':
    'Cada acción tiene su propia fila, así que puedes, por ejemplo, dejar que los miembros planifiquen lugares y días, pero reservar al propietario la eliminación del viaje.',
  // default-map
  'help.guide.default-map.title': 'Definir el mapa predeterminado para los usuarios nuevos',
  'help.guide.default-map.goal': 'Da a todas las cuentas nuevas un mapa que funcione sin token personal.',
  'help.guide.default-map.step.1':
    'En «Mapa», elige una «Plantilla del mapa» o pega una URL de teselas, e introduce una «Clave de CARTO compartida» si usas teselas de CARTO. La vista previa de debajo muestra el resultado.',
  'help.guide.default-map.step.2':
    'Más abajo, elige el «Motor de mapas»: «Estándar (gratis)», Mapbox (3D) o MapLibre (OpenFreeMap). Para Mapbox y MapLibre, elige el «Estilo de mapa»; para Mapbox, añade el «Token de Mapbox compartido» y decide si quieres «Edificios y terreno en 3D» y «Modo de alta calidad».',
  'help.guide.default-map.result':
    'Las cuentas nuevas empiezan con estos valores; quien haya configurado su propio mapa en «Ajustes» conserva el suyo.',
  'help.guide.default-map.tip.1':
    'Un token o una clave introducidos aquí los comparten todos los que no tengan uno propio, así que vigila su cuota.',
  'help.guide.default-map.tip.2':
    'Las cuentas existentes que nunca han cambiado nada en la pestaña del mapa también usan estos valores predeterminados.',
  // packing-templates
  'help.guide.packing-templates.title': 'Crear una plantilla de equipaje',
  'help.guide.packing-templates.goal': 'Da a los viajes una lista de equipaje de partida en lugar de una vacía.',
  'help.guide.packing-templates.step.1':
    'Haz clic en «Nueva plantilla», escribe un nombre y confirma con la marca de verificación.',
  'help.guide.packing-templates.step.2':
    'Haz clic en el nombre de la plantilla para abrirla y luego en «Añadir categoría». El + de la parte superior de una categoría añade artículos, y un artículo solo necesita un nombre.',
  'help.guide.packing-templates.step.3':
    'Todo se guarda sobre la marcha. El lápiz cambia el nombre de una plantilla, una categoría o un artículo. La papelera elimina un artículo al momento. En una plantilla o una categoría, pide confirmación antes, porque también se borra todo lo que contiene.',
  'help.guide.packing-templates.result':
    'La plantilla aparece en la lista de equipaje de todos los viajes; al aplicarla se copian los artículos, así que cada viaje puede cambiarlos libremente.',
  'help.guide.packing-templates.tip.1':
    'Una plantilla por tipo de viaje (playa, ciudad, senderismo) funciona mejor que una lista muy larga.',
  'help.guide.packing-templates.tip.2': 'Eliminar una plantilla no cambia los viajes en los que ya se aplicó.',
  'help.guide.packing-templates.tip.3':
    '«Guardar como plantilla» en la lista de equipaje de un viaje crea una plantilla con el peso, la cantidad y la bolsa de cada artículo. Aquí aparecen junto a cada artículo, y al aplicar la plantilla los artículos van a las mismas bolsas.',
  // categories
  'help.guide.categories.title': 'Gestionar las categorías',
  'help.guide.categories.goal':
    'Decide qué categorías pueden tener los lugares y las colecciones, y qué aspecto tienen.',
  'help.guide.categories.step.1':
    'Haz clic en «Nueva categoría», escribe el nombre en la línea de título del cuadro, elige un «Icono» y un color, y comprueba la «Vista previa». Haz clic en Crear.',
  'help.guide.categories.step.2':
    'En la lista, el lápiz (Editar) abre una categoría y Actualizar la guarda. La papelera (Eliminar) la borra tras confirmarlo.',
  'help.guide.categories.result':
    'El conjunto se aplica en todas partes a la vez: el inspector de lugares, los marcadores del mapa, Colecciones y los filtros.',
  'help.guide.categories.tip.1':
    'Los lugares conservan el identificador de su categoría, así que al cambiar el nombre de una categoría cambia en todos los lugares.',
  'help.guide.categories.tip.2':
    'Al eliminar una categoría, sus lugares se quedan sin categoría. Si te importa, asígnalos antes a otra categoría.',
  // school-holiday-catalog
  'help.guide.school-holiday-catalog.title': 'Mantener a mano las vacaciones escolares',
  'help.guide.school-holiday-catalog.goal':
    'Mantén las vacaciones escolares de un país o región para que todos puedan elegirlas en «Vacaciones».',
  'help.guide.school-holiday-catalog.step.1':
    'En «Vacaciones escolares», elige el «País» o haz clic en + («Añadir país»), introduce el «País» y su «Código de país (p. ej. US)» y guarda. «Añadir región» añade cada zona del país que tenga sus propias fechas.',
  'help.guide.school-holiday-catalog.step.2':
    'Haz clic en una región para abrir «Región o distrito escolar»: «Añadir período», ponle a cada uno un «Nombre de las vacaciones», una «Fecha de inicio» y una «Fecha fin», y guarda. La papelera elimina un periodo o una región; un país se puede eliminar cuando ya no le quedan regiones.',
  'help.guide.school-holiday-catalog.result':
    'Los usuarios encuentran el país y la región en «Ajustes», dentro de «Vacaciones», y ven los periodos en su cuadrícula anual.',
  'help.guide.school-holiday-catalog.tip.1':
    'No se puede eliminar una región que alguien ya haya elegido en su calendario de «Vacaciones».',
  // auth-methods
  'help.guide.auth-methods.title': 'Decidir cómo se inicia sesión',
  'help.guide.auth-methods.goal':
    'Activa o desactiva el inicio de sesión con contraseña, el SSO y el registro, y exige 2FA.',
  'help.guide.auth-methods.step.1':
    'En «Métodos de autenticación», activa o desactiva Password Login y Password Registration; cada interruptor se aplica al momento. Con el registro desactivado, las cuentas nuevas solo pueden llegar por enlaces de invitación, SSO o «Crear usuario».',
  'help.guide.auth-methods.step.2':
    'SSO Login y SSO Auto-Provisioning necesitan que «Inicio de sesión único (OIDC)» esté configurado más abajo; el aprovisionamiento automático crea una cuenta la primera vez que alguien inicia sesión por SSO.',
  'help.guide.auth-methods.step.3':
    'Activa «Exigir autenticación en dos factores (2FA)» para que todos los que no tengan 2FA tengan que configurarla en «Ajustes» antes de poder usar TREK.',
  'help.guide.auth-methods.result':
    'La página de inicio de sesión ofrece exactamente los métodos que has dejado activados.',
  'help.guide.auth-methods.tip.1':
    'TREK no te deja desactivar el último método de inicio de sesión: su interruptor se pone gris y la descripción emergente dice «At least one login method must remain enabled».',
  'help.guide.auth-methods.tip.2':
    'Si en el servidor está definido OIDC_ONLY, los interruptores de contraseña quedan bloqueados y una nota lo indica.',
  // oidc
  'help.guide.oidc.title': 'Conectar el inicio de sesión único',
  'help.guide.oidc.goal': 'Permite que la gente inicie sesión con tu proveedor de identidad.',
  'help.guide.oidc.step.1':
    'En «Inicio de sesión único (OIDC)», introduce el «Nombre visible» del botón, la «URL del emisor», el «ID de cliente» y el «Secreto de cliente» de tu proveedor. Rellena «URL de descubrimiento (opcional)» solo si tu proveedor no la publica en la dirección habitual, como ocurre con Authentik. Haz clic en Guardar.',
  'help.guide.oidc.step.2': 'Activa SSO Login en «Métodos de autenticación».',
  'help.guide.oidc.result':
    'La página de inicio de sesión muestra el botón de SSO; con «SSO Auto-Provisioning» activado, quien entra por primera vez obtiene una cuenta automáticamente.',
  'help.guide.oidc.tip.1':
    'La URI de redirección que pide tu proveedor es la dirección de tu TREK seguida de la ruta de callback de OIDC que indica la documentación.',
  'help.guide.oidc.tip.2':
    'La asignación de claims decide qué grupos de SSO pasan a ser administradores; consulta la página de OIDC en la documentación.',
  // instance-keys
  'help.guide.instance-keys.title': 'Introducir las claves de API',
  'help.guide.instance-keys.goal':
    'Añade fotos y valoraciones de Google, portadas de Unsplash y búsqueda de Amap para toda la instancia.',
  'help.guide.instance-keys.step.1':
    'En «Claves API», la API de lugares de TREK, arriba, ya se encarga de la búsqueda de lugares sin clave. «Qué contiene» indica lo que cubre y lo que no.',
  'help.guide.instance-keys.step.2':
    'Para fotos, valoraciones y horarios, pega una «Clave API de Google Maps» y haz clic en Probar; indicará «Conectado» o «No válida». Abre «Para qué se usa la clave» y activa solo lo que quieras que se facture: «Fotos de Lugares», «Autocompletado de Lugares», «Detalles del Lugar», «Enriquecimiento de lugares» y «Buscar solo con Google», además de un «Límite diario de llamadas a Google».',
  'help.guide.instance-keys.step.3':
    'Pega la «Clave de API de Unsplash» para buscar portadas y la «Clave de API de Amap (高德地图)» para buscar lugares en China continental, y haz clic en Guardar, al pie de la tarjeta.',
  'help.guide.instance-keys.result':
    'Los usuarios tienen las funciones sin necesidad de claves propias. Sin clave de Google, la búsqueda usa la API de lugares de TREK y OpenStreetMap.',
  'help.guide.instance-keys.tip.1':
    'Si un usuario tiene una clave personal en «Ajustes», TREK usa esa clave en lugar de la de la instancia para ese usuario.',
  'help.guide.instance-keys.tip.2':
    'Las claves también pueden proceder de variables de entorno; en ese caso aparecen aquí como de solo lectura.',
  'help.guide.instance-keys.tip.3':
    '«Límite diario de llamadas a Google» limita lo que TREK puede gastar al día con la clave; la insignia junto al título cuenta las llamadas de hoy. Al alcanzar el límite, las búsquedas usan OpenStreetMap hasta el día siguiente (UTC).',
  // places-transit
  'help.guide.places-transit.title': 'Elegir los proveedores de búsqueda y de transporte público',
  'help.guide.places-transit.goal':
    'Elige qué servicio responde a las búsquedas de lugares y a las consultas de rutas en transporte público.',
  'help.guide.places-transit.step.1':
    'En «Proveedor de transporte público», elige «Transitous (gratis)», que no necesita clave y funciona mejor en Europa, o Google, que usa la clave de Google. La elección se guarda al momento.',
  'help.guide.places-transit.step.2':
    'En «Proveedor de búsqueda de lugares», elige a qué servicio consulta TREK cuando el índice de TREK y OpenStreetMap no encuentran nada: «Automático» (Google si hay clave, y si no Amap), Google Places, Amap (高德地图) u OpenStreetMap.',
  'help.guide.places-transit.result':
    'Todos los cuadros de búsqueda y todas las rutas de transporte público de TREK usan esta opción.',
  'help.guide.places-transit.tip.1':
    'Si eliges una opción sin su clave, aquí aparece un aviso. Entonces la búsqueda de lugares solo usa el índice de TREK y OpenStreetMap, y el transporte público solo usa Transitous.',
  'help.guide.places-transit.tip.2':
    'Las rutas de transporte público de Google se facturan por petición; las de Transitous, no.',
  // file-types
  'help.guide.file-types.title': 'Limitar los tipos de archivo',
  'help.guide.file-types.goal': 'Decide qué extensiones de archivo se pueden subir.',
  'help.guide.file-types.step.1':
    'En «Tipos de archivo permitidos», edita la lista de extensiones separadas por comas, o escribe * para permitir todos los tipos, y haz clic en Guardar.',
  'help.guide.file-types.result':
    'Los archivos de cualquier otro tipo se rechazan con un mensaje claro, en los documentos, en el diario y en las portadas.',
  'help.guide.file-types.tip.1':
    'No quites los tipos de imagen de la lista: las portadas y las fotos de las travesías se comprueban con esa misma lista.',
  // toggle-addon
  'help.guide.toggle-addon.title': 'Activar o desactivar un complemento',
  'help.guide.toggle-addon.goal': 'Pon un módulo de funciones a disposición de todos o retíralo.',
  'help.guide.toggle-addon.step.1':
    'Haz clic en el interruptor de la casilla del complemento. La entrada de navegación aparece o desaparece al momento para todos.',
  'help.guide.toggle-addon.step.2':
    'Algunas casillas tienen filas secundarias para sus opciones, como «Seguimiento de equipaje» en «Listas» o los proveedores de fotos en «Travesía»; solo se muestran con el complemento activado.',
  'help.guide.toggle-addon.result':
    'Al desactivar un complemento, sus datos se conservan. Al volver a activarlo, los datos vuelven a aparecer.',
  'help.guide.toggle-addon.tip.1':
    'Al desactivar MCP se quitan el endpoint y las secciones de «Integraciones» que dependen de él.',
  'help.guide.toggle-addon.tip.2':
    '«Vacaciones», «Atlas» y «Travesía» son los complementos que más piden los usuarios; «Documentos» necesita espacio de almacenamiento para los archivos subidos.',
  // install-plugin
  'help.guide.install-plugin.title': 'Instalar un plugin',
  'help.guide.install-plugin.goal': 'Añade un plugin de terceros y concédele exactamente los permisos que pide.',
  'help.guide.install-plugin.step.1':
    'Abre «Descubrir», busca un plugin con «Buscar plugins…» o con el filtro «Tipo», y haz clic en Instalar. Si tienes un archivo de paquete, haz clic en «Subir plugin» (el icono de la nube, arriba a la derecha de la tarjeta) o suelta el .zip en la página.',
  'help.guide.install-plugin.step.2':
    'En «Instalado», lee la fila: a qué puede acceder el plugin, a qué servidores se conecta y si está «Revisado» y «Firmado». Después activa «Activar plugin»; la fila muestra «Activo».',
  'help.guide.install-plugin.step.3':
    'El menú ⋯ de la fila ofrece «Reiniciar», «Ver registro de errores», «Hosts permitidos» y «Cambiar versión…», además de los enlaces al código fuente; Eliminar desinstala el plugin y sus datos. Si hay una versión más reciente, aparece como actualización en la fila, y si pide permisos nuevos, se queda desactivada hasta que los apruebes.',
  'help.guide.install-plugin.result':
    'El plugin se ejecuta en su propio proceso. Lo que añade, como widgets, capas de mapa o herramientas, aparece donde el plugin lo define.',
  'help.guide.install-plugin.tip.1':
    '«Volver a escanear» detecta una carpeta de plugin enlazada para desarrollo sin necesidad de paquete.',
  'help.guide.install-plugin.tip.2':
    'Un plugin sin firmar aparece marcado como tal; instálalo solo si confías en su procedencia.',
  // storage-backends
  'help.guide.storage-backends.title': 'Mover los archivos subidos a S3 o replicarlos',
  'help.guide.storage-backends.goal':
    'Guarda los archivos en un almacenamiento de objetos o copia cada archivo subido a un segundo destino.',
  'help.guide.storage-backends.step.1':
    'En «Backends», haz clic en «Añadir backend», ponle un «Nombre», elige el «Tipo», Local o S3, y rellena sus campos. Para guardar una copia en otro sitio, marca los «Destinos del espejo». Haz clic en Aplicar y luego en Probar en la nueva fila para comprobar la conexión.',
  'help.guide.storage-backends.step.2':
    'En «Categorías», asigna cada tipo de archivo subido, como «Documentos del viaje», «Fotos de la travesía» o «Copias de seguridad», a un backend.',
  'help.guide.storage-backends.step.3':
    'Haz clic en «Guardar cambios», abajo. Si una categoría apunta ahora a otro destino, TREK pregunta si quieres «Mover objetos existentes» o «Solo enrutar las escrituras nuevas».',
  'help.guide.storage-backends.result':
    'Los archivos nuevos van al backend asignado. Los archivos movidos se sirven desde ahí, y lo que elegiste no mover se queda donde estaba.',
  'help.guide.storage-backends.tip.1':
    'Un backend configurado con variables de entorno se muestra, pero no se puede editar aquí.',
  'help.guide.storage-backends.tip.2':
    'Un destino espejo recibe una copia de cada escritura nueva; «Sincronizar ahora», en la fila, copia lo que ya estaba guardado. Un destino lento ralentiza todas las subidas a ese backend.',
  // channels-instance
  'help.guide.channels-instance.title': 'Configurar los canales de notificación',
  'help.guide.channels-instance.goal':
    'Decide qué canales pueden elegir los usuarios y configura el correo electrónico.',
  'help.guide.channels-instance.step.1':
    'Activa «Correo (SMTP)» en la cabecera de su tarjeta, introduce SMTP Host, SMTP Port, SMTP User, SMTP Password y la From Address, y haz clic en Guardar. «Enviar correo de prueba» te envía un correo. «Omitir la comprobación del certificado TLS» es solo para un servidor de correo local con certificado propio.',
  'help.guide.channels-instance.step.2':
    'Activa Webhook, Ntfy y Web Push para ofrecerlos. Después, los usuarios introducen su propia URL o tema, o activan push en cada dispositivo, en «Ajustes», «Notificaciones».',
  'help.guide.channels-instance.step.3':
    '«Recordatorios de viaje» activa o desactiva el recordatorio antes de que empiece un viaje; «En la app» siempre está activado.',
  'help.guide.channels-instance.result':
    'La pestaña Notificaciones de cada usuario muestra los canales que has activado.',
  'help.guide.channels-instance.tip.1':
    'La «URL del servidor Ntfy» de la tarjeta «Ntfy de admin» también es el servidor predeterminado para los usuarios. Aun así, los usuarios pueden indicar su propio servidor.',
  'help.guide.channels-instance.tip.2':
    'Los canales de plugins aparecen automáticamente en cuanto se activa un plugin que los ofrece.',
  // admin-channels
  'help.guide.admin-channels.title': 'Recibir los eventos de administración en el móvil',
  'help.guide.admin-channels.goal':
    'Recibe avisos de nuevas versiones, de fallos en los espejos de almacenamiento y de solicitudes de regiones de remo.',
  'help.guide.admin-channels.step.1':
    'En «Ntfy de admin», introduce el «Tema de admin» y, si hace falta, la «URL del servidor Ntfy» y un «Token de acceso (opcional)»; en «Webhook de admin», una URL. Haz clic en Guardar en cada tarjeta.',
  'help.guide.admin-channels.step.2':
    'Haz clic en «Enviar Ntfy de prueba» o «Enviar webhook de prueba» para comprobar que llega un mensaje.',
  'help.guide.admin-channels.result':
    'Los eventos de administración llegan a todos los administradores en la aplicación y, si los has activado, al tema de ntfy y al webhook de administración.',
  'help.guide.admin-channels.tip.1':
    'Mantén el tema de administración separado del personal, para que los mensajes de caída no se pierdan entre los mensajes de los viajes.',
  'help.guide.admin-channels.tip.2':
    'El webhook y el tema de administración son independientes de tus propios canales en «Ajustes», «Notificaciones».',
  // mcp-tokens-admin
  'help.guide.mcp-tokens-admin.title': 'Revocar el acceso de la IA',
  'help.guide.mcp-tokens-admin.goal':
    'Consulta y revoca todos los tokens y sesiones que tenga un cliente de IA, de cualquier usuario.',
  'help.guide.mcp-tokens-admin.step.1':
    'En «Sesiones OAuth», busca el cliente por nombre y propietario; sus etiquetas muestran los ámbitos concedidos. La papelera revoca la sesión tras confirmarlo.',
  'help.guide.mcp-tokens-admin.step.2':
    'En «Tokens de API», lo mismo para los tokens: nombre, propietario, «Creado» y «Último uso». La papelera elimina el token, y el cliente deja de funcionar al momento.',
  'help.guide.mcp-tokens-admin.result': 'El usuario del cliente tiene que volver a conectarlo. No cambia nada más.',
  'help.guide.mcp-tokens-admin.tip.1':
    'Los permisos indican qué podía hacer un cliente; puedes mantener sin problema uno de solo lectura.',
  'help.guide.mcp-tokens-admin.tip.2':
    'Al desactivar el complemento MCP, todos los clientes dejan de funcionar a la vez y esta pestaña se oculta, pero no se borra nada: los tokens vuelven a funcionar cuando lo reactivas.',
  // release-history
  'help.guide.release-history.title': 'Comprobar si hay una versión nueva',
  'help.guide.release-history.goal': 'Comprueba si tu TREK está al día y qué trae la próxima versión.',
  'help.guide.release-history.step.1':
    'Cuando hay una versión más reciente, aparece «Actualización disponible» bajo la cabecera de la página, con la versión que usas. «Ver en GitHub» abre la versión, y «Cómo actualizar» muestra los comandos para Docker o la guía de actualización para otras instalaciones.',
  'help.guide.release-history.step.2':
    '«Historial de versiones» muestra todas las versiones con sus notas. «Mostrar detalles» las despliega, la más reciente lleva la etiqueta «Última», y «Cargar más» muestra versiones anteriores.',
  'help.guide.release-history.result':
    'La actualización se hace en el host, descargando la imagen nueva o compilando la nueva etiqueta; el directorio de datos se conserva.',
  'help.guide.release-history.tip.1':
    'Haz una copia de seguridad antes de actualizar. La pestaña «Copia de seguridad» está al lado de esta.',
  'help.guide.release-history.tip.2':
    'Las versiones preliminares aparecen, pero no se anuncian como actualizaciones, salvo que tengas instalada una versión preliminar.',
  // create-backup
  'help.guide.create-backup.title': 'Crear y restaurar una copia de seguridad',
  'help.guide.create-backup.goal':
    'Haz una copia de seguridad de toda la instancia, guarda una copia en otro sitio y ten la posibilidad de restaurarla.',
  'help.guide.create-backup.step.1':
    'En «Copia de seguridad de datos», haz clic en «Crear copia», arriba a la derecha. Guarda la base de datos y los archivos subidos en un solo archivo en el servidor.',
  'help.guide.create-backup.step.2':
    'Descargar guarda una copia fuera del servidor; la papelera elimina las antiguas tras confirmarlo.',
  'help.guide.create-backup.step.3':
    'Restaurar en una copia, o «Subir copia de seguridad» con un archivo, sustituye todos los datos actuales en cuanto haces clic en «Sí, restaurar» en «¿Restaurar copia?».',
  'help.guide.create-backup.result':
    'Una restauración recupera los usuarios, viajes, archivos y ajustes exactamente como estaban en esa copia.',
  'help.guide.create-backup.tip.1':
    'Restaurar es la única acción de esta pantalla que no se puede deshacer. Haz antes una copia nueva.',
  'help.guide.create-backup.tip.2':
    'Las copias se guardan en el directorio de datos. Cópialas a otra máquina para que estén a salvo si esta falla.',
  // auto-backup
  'help.guide.auto-backup.title': 'Programar copias de seguridad',
  'help.guide.auto-backup.goal': 'Haz que el servidor haga sus propias copias de seguridad y borre las antiguas.',
  'help.guide.auto-backup.step.1':
    'En «Copia automática», activa «Activar copia automática» y elige el «Intervalo» («Cada hora», «Diaria», «Semanal» o «Mensual»), «Ejecutar a la hora» y, si es semanal o mensual, el «Día de la semana» o el «Día del mes».',
  'help.guide.auto-backup.step.2':
    'En «Eliminar copias antiguas después de», elige cuánto tiempo se conserva cada copia, de «1 día» a «Conservar para siempre», y haz clic en Guardar.',
  'help.guide.auto-backup.result':
    'Las copias aparecen en la lista según la programación. Las copias más antiguas se eliminan cuando superan la antigüedad que elegiste.',
  'help.guide.auto-backup.tip.1':
    '«Ejecutar a la hora» usa la hora del servidor; la indicación de debajo muestra su zona horaria.',
  'help.guide.auto-backup.tip.2':
    'El espacio en el servidor es limitado: 7 o 14 días suelen bastar, con una copia descargada guardada en otro sitio.',
  // audit-log
  'help.guide.audit-log.title': 'Consultar el registro de auditoría',
  'help.guide.audit-log.goal': 'Averigua quién hizo qué y cuándo.',
  'help.guide.audit-log.step.1':
    'Lee las filas, de la más reciente a la más antigua: «Fecha y hora», «Usuario», «Acción», «Recurso», IP y «Detalles». Las acciones llevan el nombre de lo que ocurrió, como un inicio de sesión fallido, un cambio de MFA o una restauración.',
  'help.guide.audit-log.step.2':
    'Actualizar, arriba a la derecha, vuelve a cargar la lista. La insignia junto al título indica cuántas entradas hay cargadas del total, y «Cargar más» carga entradas más antiguas.',
  'help.guide.audit-log.result':
    'Tienes un registro que puedes mostrar a cualquiera que pregunte por qué ha cambiado algo.',
  'help.guide.audit-log.tip.1': 'Las horas se muestran en la zona horaria del servidor.',
  'help.guide.audit-log.tip.2':
    'En el registro solo se añaden entradas; nada de lo que contiene se puede editar ni eliminar desde la aplicación.',
  // document-providers
  'help.guide.document-providers.title': 'Ofrecer un almacén de documentos',
  'help.guide.document-providers.goal':
    'Decide con qué servicios de almacenamiento puede sincronizar un viaje sus documentos.',
  'help.guide.document-providers.step.1':
    'La casilla «Documentos» muestra los almacenamientos en filas: Paperless-ngx, Papra, Nextcloud, OpenCloud y Synology Drive. Al principio están los cinco desactivados, y las filas solo se muestran mientras «Documentos» esté activado.',
  'help.guide.document-providers.step.2':
    'Activa el interruptor de la fila de Nextcloud. El mensaje indica «Complemento actualizado», y a partir de ese momento los propietarios de los viajes encuentran «Sincronización de documentos» en la pestaña «Archivos» de sus viajes, con Nextcloud en «Conectar un proveedor».',
  'help.guide.document-providers.result':
    'El almacenamiento está disponible en todos los viajes de este TREK. No se conecta nada hasta que el propietario de un viaje lo conecte.',
  'help.guide.document-providers.tip.1':
    'Aquí solo se decide si se puede ofrecer un almacenamiento. La dirección y las credenciales pertenecen a cada viaje, y las introduce el propietario del viaje en su pestaña «Archivos», nunca en el panel de administración.',
  'help.guide.document-providers.tip.2':
    'Si desactivas «Documentos», se desactivan también todos los almacenes, y no puedes activar ninguno mientras «Documentos» esté desactivado: el servidor responde «Enable the Documents addon first». Un almacén en tu propia red necesita además ALLOW_INTERNAL_NETWORK=true en el servidor.',

  // ── Screen: trip ──────────────────────────────────────────────────────────────────────
  'help.ctx.trip.title': 'Viaje',
  'help.ctx.trip.summary':
    'Todo sobre un viaje: el plan con sus días, el mapa y los lugares, y las pestañas de excursiones, transportes, reservas, listas, costes, archivos, colaboración y diario vinculado. Cada una tiene su propia pantalla de ayuda debajo de esta.',
  'help.ctx.trip.bullet.1':
    'La barra de pestañas bajo la barra superior: «Planificado», «Excursiones», «Transportes», «Reservas», «Listas», «Costes», «Archivos», «Colaboración» y, cuando hay un diario vinculado, «Diario». Los complementos y plugins determinan qué pestañas hay en tu TREK.',
  'help.ctx.trip.bullet.2':
    '«Planificado» tiene tres columnas: los días a la izquierda, el mapa en el centro y los lugares a la derecha. Con el complemento «Viaje por carretera», la columna de días empieza con un interruptor «Días» y «Viaje por carretera»; con el complemento «Excursiones», la columna de lugares empieza con «Lugares» y «Excursiones». Las reservas y los transportes forman parte del plan, en cada parada y entre paradas; las pestañas los recogen en listas.',
  'help.ctx.trip.bullet.3':
    '«Ajustes del viaje», la píldora junto al nombre del viaje arriba a la izquierda, abre los ajustes del viaje: «Personas» (miembros e invitados), «Compartiendo» (el enlace público de solo lectura y el enlace de invitación) y «Diario».',
  'help.ctx.trip.bullet.4':
    'El título, las fechas, la portada y la moneda se editan desde «Mis viajes», con el lápiz de la tarjeta del viaje. El nombre del viaje, arriba a la izquierda, te lleva de vuelta allí.',
  'help.ctx.trip.bullet.5':
    'La pestaña del borde interior de una columna la pliega, y el mapa aprovecha el espacio libre. Una columna plegada muestra una pequeña casilla en la esquina superior del mapa; haz clic en ella para volver a mostrar la columna. Arrastra el separador fino junto a una columna para cambiar su anchura.',
  'help.ctx.trip.bullet.6':
    'La flecha de deshacer de la barra de herramientas de los días deshace tus cambios recientes en el plan, uno a uno.',
  // add-member
  'help.guide.add-member.title': 'Añadir un miembro',
  'help.guide.add-member.goal': 'Da acceso a este viaje a alguien que tenga cuenta en TREK.',
  'help.guide.add-member.step.1':
    'Haz clic en «Ajustes del viaje», la píldora junto al nombre del viaje, arriba a la izquierda. Se abre en «Personas».',
  'help.guide.add-member.step.2':
    'En «Invitar usuario», elige a la persona en «Seleccionar usuario…» y haz clic en Invitar.',
  'help.guide.add-member.step.3':
    'La persona aparece ahora en «Acceso». La insignia «Propietario» identifica al propietario. «Quitar acceso», al final de cada fila, quita a la persona tras confirmarlo.',
  'help.guide.add-member.result':
    'El miembro puede ver y editar el viaje igual que tú, dentro de los niveles que el administrador haya fijado en «Configuración de permisos».',
  'help.guide.add-member.tip.1':
    'Si alguien no aparece en la lista, todavía no tiene cuenta de TREK: añádelo como invitado o deja que se registre con un enlace de invitación.',
  'help.guide.add-member.tip.2':
    'El número junto a «Acceso» cuenta las personas del viaje; los invitados aparecen aparte, más abajo.',
  // trip-invite-link
  'help.guide.trip-invite-link.title': 'Invitar con un enlace',
  'help.guide.trip-invite-link.goal': 'Permite que la gente se una al viaje por su cuenta.',
  'help.guide.trip-invite-link.step.1':
    'Haz clic en «Ajustes del viaje», junto al nombre del viaje, y elige «Compartiendo» a la izquierda. En «Enlace de invitación al viaje», haz clic en «Crear enlace de invitación».',
  'help.guide.trip-invite-link.step.2':
    'Haz clic en Copiar y envía el enlace. Cualquiera con cuenta en TREK que lo abra se une como miembro.',
  'help.guide.trip-invite-link.step.3':
    '«Regenerar» crea un enlace nuevo y el antiguo deja de funcionar; «Desactivar» lo desactiva.',
  'help.guide.trip-invite-link.result': 'Quien abra el enlace se une al viaje y aparece en «Acceso».',
  'help.guide.trip-invite-link.tip.1':
    'Quien no tenga cuenta no puede usarlo. Un administrador crea enlaces de registro en Administrador, Usuarios, y puede vincular uno a este viaje.',
  'help.guide.trip-invite-link.tip.2':
    'Regenera el enlace si lo enviaste al chat equivocado: el enlace antiguo deja de funcionar al momento.',
  // add-guest
  'help.guide.add-guest.title': 'Añadir un invitado sin cuenta',
  'help.guide.add-guest.goal': 'Añade al viaje a alguien que no usa TREK.',
  'help.guide.add-guest.step.1':
    'Haz clic en «Ajustes del viaje», junto al nombre del viaje. En «Personas», «Invitados» es la última sección, debajo de «Acceso».',
  'help.guide.add-guest.step.2': 'Escribe el nombre en «Nombre del invitado» y haz clic en «Añadir invitado».',
  'help.guide.add-guest.result':
    'Puedes asignar al invitado gastos, artículos del equipaje y tareas, pero no puede iniciar sesión.',
  'help.guide.add-guest.tip.1':
    '«Renombrar» (el lápiz) cambia el nombre de un invitado. «Quitar acceso» (la papelera) elimina al invitado tras confirmarlo: se borran sus asignaciones, y su parte de cada gasto se reparte entre los demás participantes de ese gasto.',
  'help.guide.add-guest.tip.2':
    'Si más adelante la persona se crea una cuenta, invítala como miembro y elimina al invitado.',
  // public-link
  'help.guide.public-link.title': 'Publicar un enlace de solo lectura',
  'help.guide.public-link.goal': 'Muestra el viaje a personas que no deben editarlo.',
  'help.guide.public-link.step.1':
    'Haz clic en «Ajustes del viaje», junto al nombre del viaje, y elige «Compartiendo» a la izquierda.',
  'help.guide.public-link.step.2':
    'En la tarjeta «Enlace público», activa lo que puede mostrar el enlace. «Mapa y plan» siempre está activado; «Reservas», «Equipaje», «Costes» y Chat los eliges tú.',
  'help.guide.public-link.step.3':
    'En «Opciones», «Solo transporte y alojamiento» excluye las actividades, las notas de los días y los días vacíos. «Sin fotos» excluye las fotos de los lugares.',
  'help.guide.public-link.result':
    'Cualquiera con el enlace ve las partes elegidas sin iniciar sesión y no puede cambiar nada.',
  'help.guide.public-link.tip.1':
    'El enlace no aparece en ningún sitio, pero cualquiera que lo tenga puede abrirlo. Guárdalo con el mismo cuidado que una contraseña.',
  'help.guide.public-link.tip.2': 'Si quieres darle permisos de edición, añade a la persona como miembro.',
  // transfer-ownership
  'help.guide.transfer-ownership.title': 'Ceder el viaje o salir de él',
  'help.guide.transfer-ownership.goal': 'Haz propietaria a otra persona o sal de un viaje que no es tuyo.',
  'help.guide.transfer-ownership.step.1':
    'Haz clic en «Ajustes del viaje», junto al nombre del viaje. En «Acceso», haz clic en «Hacer propietario» (la corona) en la fila de un miembro y confirma.',
  'help.guide.transfer-ownership.step.2':
    '«Abandonar viaje», en tu propia fila, te saca del viaje tras confirmarlo. Si eres el propietario, primero cede la propiedad.',
  'help.guide.transfer-ownership.result':
    'El nuevo propietario gestiona los miembros y puede eliminar el viaje; tú sigues como miembro normal.',
  'help.guide.transfer-ownership.tip.1':
    'El propietario es la persona que creó el viaje, hasta que se ceda la propiedad. Solo el propietario puede eliminar el viaje.',
  'help.guide.transfer-ownership.tip.2':
    '«Quitar acceso», en la fila de otro miembro, funciona al revés: el propietario quita a ese miembro del viaje.',
  // collapse-columns
  'help.guide.collapse-columns.title': 'Hacer sitio para el mapa',
  'help.guide.collapse-columns.goal': 'Pliega una columna o ensánchala.',
  'help.guide.collapse-columns.step.1':
    'Haz clic en la pestaña del borde interior de la columna de días, la del icono de panel, para plegarla; el mapa ocupa el espacio libre. La columna de lugares tiene la misma pestaña.',
  'help.guide.collapse-columns.step.2':
    'Cuando una columna está plegada, aparece una pequeña casilla con el icono del panel en la esquina superior del mapa; su descripción emergente dice «Planificado» o «Lugares». Haz clic en ella para volver a mostrar la columna.',
  'help.guide.collapse-columns.step.3':
    'Arrastra el separador fino que hay entre una columna y el mapa para cambiar el ancho de la columna.',
  'help.guide.collapse-columns.result':
    'Los anchos se recuerdan. En tu próxima visita, las columnas vuelven a estar abiertas.',
  'help.guide.collapse-columns.tip.1': 'Puedes plegar las dos columnas a la vez para ver solo el mapa.',
  'help.guide.collapse-columns.tip.2':
    'En una ventana estrecha solo cabe una columna: al abrir una, se pliega la otra. En el móvil no hay columnas; «Viaje», «Planificado» y «Lugares», arriba, cambian de vista.',
  // undo-change
  'help.guide.undo-change.title': 'Deshacer el último cambio',
  'help.guide.undo-change.goal': 'Deshaz el último cambio que hiciste en el plan.',
  'help.guide.undo-change.step.1':
    'Haz clic en la flecha de deshacer de la barra de herramientas encima de los días; su descripción emergente indica el cambio que va a deshacer.',
  'help.guide.undo-change.result': 'El plan vuelve a estar como antes, y un breve mensaje indica qué se ha deshecho.',
  'help.guide.undo-change.tip.1':
    'Deshacer abarca el plan: añadir, asignar, quitar, reordenar, mover y bloquear lugares, vaciar un día, optimizar una ruta, eliminar lugares, cambios de categoría e importaciones.',
  'help.guide.undo-change.tip.2':
    'Vuelve a hacer clic para retroceder más: TREK guarda tus últimos 30 cambios en este viaje, del más reciente al más antiguo, hasta que salgas de él.',
  'help.guide.clear-day.title': 'Vaciar un día',
  'help.guide.clear-day.goal':
    'Quita de una vez todos los lugares de un día, por ejemplo para volver a planificarlo desde cero.',
  'help.guide.clear-day.step.1': 'Haz clic con el botón derecho en la cabecera del día en el plan.',
  'help.guide.clear-day.step.2': 'Elige «Vaciar día» y confirma.',
  'help.guide.clear-day.result':
    'El día se queda vacío y sus lugares vuelven a la lista como sin planificar. La flecha de deshacer encima de los días los recupera.',
  'help.guide.clear-day.tip.1': 'Solo se quitan los lugares. El día conserva sus notas y sus reservas.',

  // ── Screen: trip-places ───────────────────────────────────────────────────────────────
  'help.ctx.trip-places.title': 'Lugares',
  'help.ctx.trip-places.summary':
    'La columna derecha del plan: todos los lugares del viaje, planificados o no, con búsqueda, filtros y orden, y las formas de añadir lugares: buscándolos, a mano o desde una lista compartida. «Lugares» y «Excursiones», arriba, cambian entre los lugares y las excursiones del viaje.',
  'help.ctx.trip-places.bullet.1':
    '«Lugares» y «Excursiones», arriba de la columna, cambian la lista. Al entrar se abre «Lugares». «Excursiones» muestra las excursiones del viaje e importa archivos GPX, KML y KMZ con «Importar GPX o KML»; las excursiones no aparecen en la lista de lugares.',
  'help.ctx.trip-places.bullet.2':
    '«Añadir lugar/actividad» abre el formulario para un lugar que buscas o escribes. Con un día abierto, el botón indica «Nuevo lugar», y «Al día», a su lado, crea el lugar directamente en ese día.',
  'help.ctx.trip-places.bullet.3':
    '«Importar lugares», el botón con icono que hay al lado, ofrece «Importar lista» para listas compartidas desde Google Maps o Naver Maps. Si un administrador ha desactivado el complemento «Excursiones», también ofrece «Importar archivo» para archivos .gpx, .kml y .kmz, y puedes soltar un archivo sobre la columna.',
  'help.ctx.trip-places.bullet.4':
    'Debajo está la búsqueda, que también busca en descripciones y notas, y a su lado la casilla «Elegir». En la fila de abajo están los filtros: «Mostrar» cambia entre «Todos», «Sin planificar» y «Planeado», cada uno con su recuento. El botón de la etiqueta filtra por categoría; la estrella, por valoración mínima; el globo (si el viaje abarca más de un país o región), por país o región; y «Ordenar por» define el orden de la lista.',
  'help.ctx.trip-places.bullet.5':
    'Cada fila muestra la imagen, el nombre y la descripción o la dirección, y una estrella con la valoración media cuando alguien ha valorado el lugar. Haz clic en ella para ver los detalles del lugar, arrástrala a un día, o haz clic con el botón derecho (o en «Más opciones», sus tres puntos) para Editar, «+ Día», «Abrir la web», Google Maps, «Guardar en colección» y Eliminar.',
  'help.ctx.trip-places.bullet.6':
    'Con un día abierto, el + redondo al final de una fila («+ Día») añade el lugar a ese día. Aparece en todos los lugares que aún no están en ese día. «Planeado» muestra entonces solo ese día, y la etiqueta «Se muestra solo el día abierto» te lo indica. Su x, «Mostrar todo el viaje», cierra el día.',
  // create-place
  'help.guide.create-place.title': 'Crear un lugar',
  'help.guide.create-place.goal': 'Añade a mano un lugar o una actividad con todos los datos que necesita el plan.',
  'help.guide.create-place.step.1':
    'Haz clic en «Añadir lugar/actividad», arriba de la columna de lugares («Nuevo lugar» si hay un día abierto). El formulario se abre con el cursor en la búsqueda.',
  'help.guide.create-place.step.2':
    'Escribe el lugar en «Buscar lugares…» y elige un resultado. Se rellenan el nombre arriba del cuadro, «Dirección», «Latitud», «Longitud» y «Sitio web», y «Detalles del lugar», a la izquierda, muestra imágenes, horario y una descripción. En un TREK con clave de Google, «¿No es el lugar correcto? Buscar en Google», bajo los resultados, repite la búsqueda con Google. Con «Colecciones» activado, «Lugares guardados», a la derecha, ofrece igualmente los lugares de tus listas.',
  'help.guide.create-place.step.3':
    'En «Detalles del lugar», haz clic en una imagen de «Elegir una imagen» para usarla como imagen del lugar. «Usar este texto» copia la descripción en el formulario.',
  'help.guide.create-place.step.4':
    'Revisa los campos del formulario. El nombre, arriba del cuadro, es el único campo obligatorio. La píldora «Categoría» de debajo elige una de las categorías del viaje, y el + de al lado crea una nueva. «Dirección», «Latitud» y «Longitud» vienen de la búsqueda o las escribes tú. «Descripción» y «Notas» son para tus propios textos. En «Sitio web» va el enlace, «Adjuntar» en «Archivos» añade un documento, y «Teléfono», «Correo electrónico» y «Añadir horario» son para los datos que la búsqueda no ha encontrado.',
  'help.guide.create-place.step.5':
    'Haz clic en Añadir. Si el viaje ya tiene un lugar con el mismo nombre o en la misma ubicación, TREK muestra un aviso y el botón cambia a «Añadir de todos modos».',
  'help.guide.create-place.result':
    'El lugar está en la lista y en el mapa, en «Sin planificar» hasta que lo pongas en un día.',
  'help.guide.create-place.tip.1':
    '«Costes», al final del formulario, con el complemento «Presupuesto» activado, abre el editor de costes para el gasto del lugar justo después de guardar. Una imagen o un PDF que pegues en el cuadro se adjunta como archivo en «Archivos».',
  'help.guide.create-place.tip.2':
    'En cualquier TREK, los resultados de búsqueda proceden del índice de TREK y de OpenStreetMap, y «Detalles del lugar» se rellena automáticamente con Wikipedia, Wikivoyage y Wikimedia. TREK solo consulta a Google si ninguno de los dos encuentra nada, y las valoraciones solo las ofrece Google.',
  'help.guide.create-place.tip.3':
    'También puedes crear un lugar en el mapa: haz clic con el botón derecho en el punto y se abre el formulario con las coordenadas y la dirección ya rellenadas.',
  // place-to-open-day
  'help.guide.place-to-open-day.title': 'Añadir un lugar directamente al día abierto',
  'help.guide.place-to-open-day.goal': 'Crea o elige un lugar y añádelo al día en un solo paso.',
  'help.guide.place-to-open-day.step.1':
    'Haz clic en la cabecera de un día en la columna de días. El día queda abierto: su tarjeta se resalta y la columna de lugares muestra el botón «Al día» junto a «Nuevo lugar».',
  'help.guide.place-to-open-day.step.2':
    '«Al día» abre el mismo formulario que «Nuevo lugar», pero el lugar se añade al día abierto en cuanto haces clic en Añadir.',
  'help.guide.place-to-open-day.step.3':
    'Para añadir un lugar existente al día abierto, haz clic en el + redondo al final de su fila («+ Día»), o haz clic con el botón derecho y elige «+ Día». El + aparece en todos los lugares que aún no están en ese día.',
  'help.guide.place-to-open-day.step.4':
    'También funciona al revés, sin abrir antes un día: arrastra la fila del lugar fuera de la columna y suéltala en la tarjeta de un día. Si la sueltas entre dos paradas, se coloca justo ahí.',
  'help.guide.place-to-open-day.result':
    'El lugar aparece al final del día; arrástralo hacia arriba o hacia abajo hasta su sitio.',
  'help.guide.place-to-open-day.tip.1':
    'El día abierto también influye en la búsqueda: con un día abierto, el mapa y la búsqueda de lugares cercanos parten de los lugares que ya están en ese día.',
  'help.guide.place-to-open-day.tip.2':
    '«Deshacer», en la barra de herramientas encima de los días, deshace la asignación.',
  // filter-places
  'help.guide.filter-places.title': 'Buscar un lugar en la lista',
  'help.guide.filter-places.goal': 'Muestra en la columna solo los lugares que buscas.',
  'help.guide.filter-places.step.1':
    '«Mostrar», el desplegable bajo la búsqueda, cambia entre «Todos», «Sin planificar» (aún sin día) y «Planeado» (en algún día), cada uno con su recuento. Si el complemento «Excursiones» está desactivado y se ha importado un track GPX, también aparece «Rutas».',
  'help.guide.filter-places.step.2':
    'Escribe en el cuadro de búsqueda de arriba. La lista se filtra mientras escribes, por nombre, dirección, descripción y notas; la x del campo lo borra.',
  'help.guide.filter-places.step.3':
    'El botón de la etiqueta junto a «Mostrar» muestra las categorías: marca una o varias, entre ellas «Sin categoría». El botón indica cuántas hay marcadas, y «Borrar filtro», al final de la lista, las desmarca todas.',
  'help.guide.filter-places.step.4':
    'La estrella de al lado define una valoración mínima: 5+, 4+, etc., muestran solo los lugares cuya valoración media llega a ese valor. Los lugares sin valoración se ocultan.',
  'help.guide.filter-places.result':
    'El número de «Mostrar» indica cuántos lugares coinciden, y los filtros se combinan.',
  'help.guide.filter-places.tip.1':
    'Con un día abierto, «Planeado» muestra solo ese día y lo indica con «Se muestra solo el día abierto», junto a «Mostrar todo el viaje».',
  'help.guide.filter-places.tip.2':
    'El mapa también aplica «Mostrar», las categorías y la valoración y, con un día abierto, «Planeado» muestra en el mapa solo ese día. La búsqueda y el globo solo filtran la lista.',
  // edit-place
  'help.guide.edit-place.title': 'Editar un lugar',
  'help.guide.edit-place.goal': 'Corrige un nombre, mueve el marcador, añade un sitio web o cambia la categoría.',
  'help.guide.edit-place.step.1':
    'Haz clic con el botón derecho en la fila y elige Editar, o haz clic en «Más opciones» al final de la fila, o abre el lugar y haz clic en Editar en sus detalles.',
  'help.guide.edit-place.step.2':
    'Cambia lo que necesites en «Editar lugar»: el nombre y la píldora «Categoría» en la parte superior del cuadro, «Dirección», «Latitud» y «Longitud», «Descripción», «Notas», «Sitio web», «Teléfono», «Correo electrónico» y el horario de apertura. Si el lugar está en un solo día, o lo abriste desde un día, el formulario también tiene «Inicio», «Fin» y «Notas para este día».',
  'help.guide.edit-place.step.3': 'Haz clic en Actualizar.',
  'help.guide.edit-place.result':
    'El cambio se aplica en todos los sitios donde aparece el lugar: la lista, el mapa y todos los días en que está.',
  'help.guide.edit-place.tip.1':
    '«Notas para este día» pertenecen al lugar solo en ese día; «Notas» pertenecen al propio lugar.',
  'help.guide.edit-place.tip.2':
    'Un «Fin» anterior al «Inicio» bloquea Actualizar; «Solapamiento horario con:» solo avisa de que otra parada del día tiene la misma hora.',
  // delete-place
  'help.guide.delete-place.title': 'Eliminar un lugar',
  'help.guide.delete-place.goal': 'Elimina un lugar del viaje de forma definitiva.',
  'help.guide.delete-place.step.1':
    'Haz clic con el botón derecho en la fila y elige Eliminar (también está en «Más opciones», al final de la fila), o haz clic en Eliminar en los detalles del lugar.',
  'help.guide.delete-place.step.2':
    'Haz clic en Eliminar en el mensaje de confirmación. Si había una noche reservada en el lugar o una reserva vinculada a él, el mensaje indica qué se elimina también.',
  'help.guide.delete-place.result':
    'El lugar desaparece de la lista, del mapa y de todos los días. «Deshacer», en la barra de herramientas encima de los días, lo recupera.',
  'help.guide.delete-place.tip.1':
    'Para quitar un lugar de un solo día, usa en su lugar «Quitar del día» en esa parada.',
  'help.guide.delete-place.tip.2':
    'Para eliminar varios lugares a la vez, haz clic en la marca junto a la búsqueda para empezar una selección.',
  // select-places
  'help.guide.select-places.title': 'Cambiar o eliminar varios lugares a la vez',
  'help.guide.select-places.goal': 'Modifica muchos lugares a la vez en lugar de uno por uno.',
  'help.guide.select-places.step.1':
    'Haz clic en la marca de verificación junto al campo de búsqueda. Las filas muestran casillas redondas y aparece una barra con las acciones en la parte inferior de la columna.',
  'help.guide.select-places.step.2':
    'Haz clic en las filas para marcarlas. «Seleccionar todo», la doble marca de la barra, selecciona todas las filas que muestran los filtros.',
  'help.guide.select-places.step.3':
    'La barra cuenta los lugares marcados. «Cambiar categoría» les asigna a todos una misma categoría; «Guardar en colección» (con «Colecciones» activado) los copia a una de tus colecciones; «Eliminar selección» los borra tras confirmarlo.',
  'help.guide.select-places.step.4': 'Haz clic en «Listo», la X al final de la barra, para terminar la selección.',
  'help.guide.select-places.result':
    'El cambio se aplica a todos los lugares seleccionados; una eliminación se puede deshacer desde la barra de herramientas encima de los días.',
  'help.guide.select-places.tip.1':
    'Los filtros siguen funcionando mientras seleccionas: filtra primero por «Sin planificar» y así «Seleccionar todo» solo selecciona esos lugares.',
  'help.guide.select-places.tip.2':
    '«Marcar como visitado en tus listas» aparece en la barra si el complemento «Colecciones» está activado: marca los lugares como visitados en las colecciones en las que están guardados.',
  // import-places-file
  'help.guide.import-places-file.title': 'Importar lugares desde un archivo GPX, KML o KMZ',
  'help.guide.import-places-file.goal':
    'Si el complemento «Excursiones» está desactivado, importa como lugares los puntos y recorridos exportados desde Google My Maps, Google Earth o un localizador GPS.',
  'help.guide.import-places-file.step.1':
    'Haz clic en «Importar lugares», el botón con icono junto al botón de añadir, y elige «Importar archivo», o suelta el archivo en cualquier parte de la columna de lugares. Las dos opciones solo están disponibles si un administrador ha desactivado el complemento «Excursiones».',
  'help.guide.import-places-file.step.2':
    'Elige el archivo o arrástralo al recuadro. En un GPX, marca qué quieres importar: «Puntos de ruta», «Rutas», «Tracks (con geometría de ruta)». En KML y KMZ, marca «Puntos (Placemarks)» y «Rutas (LineStrings)».',
  'help.guide.import-places-file.step.3':
    'El recuadro admite varios archivos a la vez, pero solo .gpx, .kml y .kmz. Cualquier otro tipo de archivo, o uno de más de 10 MB, se rechaza en el cuadro y no se importa.',
  'help.guide.import-places-file.step.4':
    'Haz clic en Importar. Un mensaje indica cuántos lugares se han importado. Con un archivo KML o KMZ, el cuadro sigue abierto con un resumen de lo que se ha creado y lo que se ha omitido.',
  'help.guide.import-places-file.result':
    'Los lugares están en la lista. Un track tiene una línea de color en su fila, se muestra en el mapa y tiene su propio filtro «Rutas».',
  'help.guide.import-places-file.tip.1':
    'Si el archivo es demasiado grande, se rechaza y TREK te indica el límite de tamaño; vuelve a exportarlo sin fotos o divídelo.',
  'help.guide.import-places-file.tip.2':
    'Puedes deshacer toda la importación desde la barra de herramientas que hay encima de los días.',
  // import-places-list
  'help.guide.import-places-list.title': 'Importar una lista compartida de Google Maps o Naver Maps',
  'help.guide.import-places-list.goal': 'Importa lugares desde el enlace de una lista compartida.',
  'help.guide.import-places-list.step.1':
    'Haz clic en «Importar lugares», el botón con icono junto al botón de añadir, y elige «Importar lista».',
  'help.guide.import-places-list.step.2':
    'En «Proveedor», elige «Lista Google» o «Lista Naver» y pega en «Enlace» el enlace compartido de la lista. También funciona un enlace de indicaciones de Google Maps: sus paradas se convierten en lugares, en el orden de la ruta en coche.',
  'help.guide.import-places-list.step.3': 'Haz clic en Importar.',
  'help.guide.import-places-list.result':
    'Todos los lugares de la lista están en el viaje, con el nombre que tienen en la lista; los que ya estaban en el viaje se omiten.',
  'help.guide.import-places-list.tip.1':
    'La lista tiene que estar compartida públicamente; con el enlace de una lista privada no se importa nada.',
  'help.guide.import-places-list.tip.2':
    '«Enriquecer lugares con Google» aparece en el cuadro si tu TREK tiene clave de Google: busca cada lugar importado y completa sus fotos, dirección y detalles.',
  'help.guide.sort-places.title': 'Ordenar la lista de lugares',
  'help.guide.sort-places.goal': 'Ordena la lista por nombre, por valoración o por lo último que se añadió o cambió.',
  'help.guide.sort-places.step.1':
    'Haz clic en «Ordenar por», el botón de las flechas al final de la fila de filtros. Una marca indica el orden actual, y la descripción emergente del botón muestra su nombre.',
  'help.guide.sort-places.step.2':
    'Elige un orden, por ejemplo «Mejor valorados», u ordena por nombre. La lista se actualiza al momento.',
  'help.guide.sort-places.result': 'La lista muestra los lugares en el orden que elegiste, hasta que elijas otro.',
  'help.guide.sort-places.tip.1':
    'Cualquier orden distinto de «Añadidos recientemente» resalta el botón, para que veas enseguida que la lista está ordenada de otra forma.',
  'help.guide.sort-places.tip.2':
    'Ordenar solo cambia la lista. Los días mantienen su propio orden, y tu navegador recuerda el orden que elegiste.',
  'help.guide.place-by-hand.title': 'Añadir un lugar que la búsqueda no conoce',
  'help.guide.place-by-hand.goal':
    'Introduce tú mismo un lugar, con su teléfono, correo electrónico y horario, cuando la búsqueda no encuentra nada.',
  'help.guide.place-by-hand.step.1':
    'En el diálogo del lugar, escribe el nombre en la búsqueda y pulsa Intro. Si no encuentra nada, el diálogo te lo indica y te ofrece «Añadir a mano».',
  'help.guide.place-by-hand.step.2':
    'Haz clic en «Añadir a mano». El texto que buscaste pasa a ser el nombre, y el diálogo baja hasta los datos de contacto.',
  'help.guide.place-by-hand.step.3': 'Rellena «Teléfono» y «Correo electrónico» si los sabes.',
  'help.guide.place-by-hand.step.4':
    'Haz clic en «Añadir horario» e indica a qué hora abre y cierra el lugar cada día. El botón de copiar aplica a todos los días el horario del primero, y el interruptor de cada día lo marca como «Cerrada».',
  'help.guide.place-by-hand.step.5': 'Haz clic en Añadir.',
  'help.guide.place-by-hand.result':
    'El lugar se añade a la lista. Sus detalles muestran el teléfono, el correo y el horario que introdujiste, igual que un lugar encontrado con la búsqueda.',
  'help.guide.place-by-hand.tip.1':
    'Si editas un lugar que no tiene horario propio, se copia automáticamente el horario de «Detalles del lugar», a la izquierda. Si ya tiene horario, un botón a su lado copia el horario consultado.',
  'help.guide.place-by-hand.tip.2':
    'El horario que introduces sustituye al que se ha encontrado, así que una cafetería con horario de temporada muestra el horario que tú conoces.',

  // ── Screen: trip-days ─────────────────────────────────────────────────────────────────
  'help.ctx.trip-days.title': 'Días',
  'help.ctx.trip-days.summary':
    'La columna izquierda del plan: una tarjeta por día con sus paradas por orden, las notas, las reservas y los transportes del día, y la ruta entre las paradas. Aquí es donde se planifica realmente el viaje.',
  'help.ctx.trip-days.bullet.1':
    'La cabecera de arriba: Exportar (PDF, calendario, GPX) a la izquierda; a la derecha, la flecha de deshacer, «Desplegar todos los días» / «Plegar todos los días», «Reordenar días» y, cuando alguna reserva tiene una ruta que mostrar, «Mostrar todas las rutas de reservas».',
  'help.ctx.trip-days.bullet.2':
    'Una tarjeta de día: una casilla con el número del día y la previsión del tiempo, el título («Día 1» hasta que le pongas nombre) y la fecha y, debajo, píldoras para el alojamiento de la noche (verde el día de entrada, roja el de salida, discontinua mientras no esté confirmado; su billete abre la reserva) y para un coche de alquiler. Haz clic en la cabecera para abrir el día; la flecha lo pliega, y el + («Añadir al día») abre un menú: «Añadir lugar a este día», «Añadir alojamiento», «Añadir transporte», «Transporte público» y «Añadir nota». Un clic con el botón derecho en la cabecera ofrece lo mismo, más «Vaciar día».',
  'help.ctx.trip-days.bullet.3':
    'Dentro de un día: las paradas por orden, cada una con su imagen, el icono de su categoría, nombre, hora y descripción, las reservas vinculadas y quién va; las notas; y las reservas y transportes del día, con el color de su tipo. Pasa el cursor por una parada para ver su asa, el candado de su imagen, las flechas, «Añadir reserva» y los tres puntos («Más opciones»). También puedes abrir el menú de paradas y notas con el botón derecho.',
  'help.ctx.trip-days.bullet.4':
    'En el día abierto, cuando ya tiene dos paradas, aparece debajo la barra de ruta: «Ruta» muestra el día en el mapa y el tiempo de cada tramo entre paradas, los tres iconos definen «Coche», «A pie» o «Bicicleta» para el día, y después vienen «Optimizar», «Abrir en Google Maps» y «Abrir en CoMaps».',
  'help.ctx.trip-days.bullet.5':
    'Puedes añadir lugares a un día de varias formas: arrastrando una fila desde la columna de lugares, con «+ Día» en esa fila, con «Añadir lugar a este día» desde el + del día o en un día vacío, o desde los detalles del lugar.',
  'help.ctx.trip-days.bullet.6':
    '«Coste total», abajo, suma los gastos de «Costes» asociados a las paradas y reservas del día, cada uno una sola vez, en tu moneda de visualización.',
  // read-day-plan
  'help.guide.read-day-plan.title': 'Leer un día',
  'help.guide.read-day-plan.goal': 'Entiende lo que te dice cada parte de la tarjeta de un día antes de cambiar nada.',
  'help.guide.read-day-plan.step.1':
    'La cabecera: una casilla con el número del día y la previsión del tiempo, después «Día 1» o el título que le hayas puesto, y la fecha. Debajo, píldoras para el alojamiento de la noche (verde el día de entrada, roja el de salida, discontinua mientras no esté confirmado; su billete abre la reserva) y para un coche de alquiler. Haz clic en la cabecera para abrir el día (su panel de detalles se abre sobre el mapa). El + de la derecha («Añadir al día») añade un lugar, un alojamiento, un transporte, una conexión de transporte público o una nota, y la flecha pliega la tarjeta.',
  'help.guide.read-day-plan.step.2':
    'Cada parada muestra su imagen, el icono de su categoría y su nombre; después, su hora en cuanto tiene un «Inicio», y su descripción. Las «Notas para este día» aparecen debajo. Al pasar el cursor por la fila aparecen sus controles: el asa de la izquierda sirve para arrastrarla, la imagen se convierte en un candado para la optimización de la ruta y, en el extremo derecho, están las flechas («Subir», «Bajar»), «Añadir reserva» y los tres puntos («Más opciones»).',
  'help.guide.read-day-plan.step.3':
    'Una reserva en una parada aparece sobre ella como insignia «Reserva», verde si está confirmada y ámbar mientras está pendiente, con su hora y su compañía. Haz clic en la insignia para abrir la reserva; el botón de ruta que hay al lado muestra su ruta. Un transporte tiene su propia fila, con el color de su tipo, su hora y «Salida» o «Llegada». Haz clic en una reserva para ver sus detalles; desde ahí, Editar te permite cambiarla.',
  'help.guide.read-day-plan.step.4':
    'Con «Ruta» activado, el conector entre dos paradas indica cuánto dura el tramo y qué distancia tiene, según el medio de transporte del día; haz clic en él para cambiar el medio solo en ese tramo.',
  'help.guide.read-day-plan.step.5':
    'La barra de ruta bajo las paradas del día abierto: «Ruta» muestra el recorrido del día en el mapa, los tres iconos eligen «Coche», «A pie» o «Bicicleta», luego «Optimizar» reordena las paradas, y «Abrir en Google Maps» y «Abrir en CoMaps» abren el día en esas aplicaciones.',
  'help.guide.read-day-plan.result':
    'Cada símbolo de la tarjeta significa algo; en las guías de abajo se explica cómo cambiar cada uno.',
  'help.guide.read-day-plan.tip.1':
    'Haz clic con el botón derecho en una parada, o en sus tres puntos, para abrir su menú: Editar, «Quitar del día», «Quitar de la ruta», «Abrir la web», «Guardar en colección» y Eliminar. Las aplicaciones de navegación están en los detalles del lugar, en «Navegación».',
  'help.guide.read-day-plan.tip.2':
    'Pasa el ratón por encima de una parada y aparecerá «Añadir reserva» al final de la fila. La reserva que crees ahí queda vinculada a esa parada de ese día.',
  // place-onto-day
  'help.guide.place-onto-day.title': 'Añadir un lugar a un día',
  'help.guide.place-onto-day.goal':
    'Convierte un lugar de la lista en una parada de un día, en la posición que le corresponde.',
  'help.guide.place-onto-day.step.1':
    'Arrastra una fila de la columna de lugares a la tarjeta del día. Suéltala entre dos paradas para colocarla justo ahí, o en la cabecera del día para añadirla al final.',
  'help.guide.place-onto-day.step.2':
    'Sin arrastrar: abre el día haciendo clic en su cabecera y luego haz clic en el + redondo al final de la fila del lugar («+ Día»), o haz clic con el botón derecho en la fila y elige «+ Día».',
  'help.guide.place-onto-day.step.3':
    '«Añadir lugar a este día», en el menú + del día o en un día vacío, abre el formulario de lugar, y el lugar nuevo se añade al día al momento.',
  'help.guide.place-onto-day.step.4':
    'Con un día abierto, «Añadir al día», en los detalles de un lugar, lo pone en ese día; «Al día», en la cabecera de la columna de lugares, crea un lugar nuevo directamente en el día abierto.',
  'help.guide.place-onto-day.result':
    'El lugar es ahora una parada del día. Aparece en el mapa con el número del día, y la columna de lugares lo cuenta en «Planeado».',
  'help.guide.place-onto-day.tip.1':
    'Un lugar puede estar en varios días: ponlo en el segundo día desde la columna de lugares. Arrastrar una parada de la tarjeta de un día a otra, en cambio, la mueve.',
  'help.guide.place-onto-day.tip.2': 'La flecha de deshacer de la cabecera deshace la asignación.',
  'help.guide.place-onto-day.tip.3':
    'No puedes soltar una parada entre dos entradas con hora fija ni antes de una reserva que ya tiene hora; el plan siempre mantiene el orden horario.',
  // reorder-stops
  'help.guide.reorder-stops.title': 'Cambiar el orden de un día',
  'help.guide.reorder-stops.goal': 'Sube o baja una parada, o pásala a otro día.',
  'help.guide.reorder-stops.step.1':
    'Pasa el cursor por la parada y arrástrala por el asa hasta su nueva posición en la tarjeta.',
  'help.guide.reorder-stops.step.2':
    'O usa las flechas del extremo derecho de la parada al pasar el cursor («Subir», «Bajar»): una posición por clic.',
  'help.guide.reorder-stops.step.3':
    'Arrastra la parada a la tarjeta de otro día para moverla allí; se quita del día anterior.',
  'help.guide.reorder-stops.step.4':
    'Si una parada tiene una hora fija y moverla rompería el orden del día, TREK pregunta «¿Eliminar hora?», porque la hora determina la posición de la parada. Confirmar quita la hora para que la parada pueda ir a cualquier sitio. Cancelar deja el día como estaba.',
  'help.guide.reorder-stops.result': 'La ruta y los tiempos de viaje se actualizan al momento según el nuevo orden.',
  'help.guide.reorder-stops.tip.1':
    'Una reserva con hora fija se queda en la posición que le corresponde por su hora. Si la sueltas en otro punto de su día, vuelve a su sitio. Si la arrastras a la tarjeta de otro día, pasa a ese día.',
  'help.guide.reorder-stops.tip.2':
    '«Optimizar», en la barra de ruta, ordena todo el día por el camino más corto cuando el día tiene tres paradas o más. Bloquea antes una parada para mantenerla donde está.',
  // set-stop-times
  'help.guide.set-stop-times.title': 'Poner hora a una parada',
  'help.guide.set-stop-times.goal':
    'Indica cuándo empieza y termina una parada, para que el día funcione como un horario.',
  'help.guide.set-stop-times.step.1':
    'Haz clic derecho en la parada, o en sus tres puntos, y elige «Editar». Si abres el formulario desde el día, tiene «Inicio» y «Fin» para ese día justo debajo de la ubicación.',
  'help.guide.set-stop-times.step.2':
    'Introduce «Inicio» y, si quieres, «Fin». «Solapamiento horario con:» te avisa de que otra parada del día con hora se solapa. Si el fin es anterior al inicio, no podrás pulsar «Actualizar».',
  'help.guide.set-stop-times.step.3':
    'Haz clic en Actualizar. La parada recibe una etiqueta con la hora y se coloca en el día según esa hora.',
  'help.guide.set-stop-times.result':
    'Las paradas con hora mantienen su posición en el orden; las paradas sin hora se ordenan a su alrededor.',
  'help.guide.set-stop-times.tip.1':
    'La hora pertenece a la parada de ese día; el mismo lugar puede tener otra hora en otro día.',
  'help.guide.set-stop-times.tip.2':
    'Para mover a mano una parada con hora, arrástrala. TREK pregunta «¿Eliminar hora?» y, al hacer clic en Confirmar, se quita la hora.',
  'help.guide.set-stop-times.tip.3':
    '«Notas para este día», en el mismo formulario, es para información que solo vale para ese día, por ejemplo una reserva de mesa o un número de entrada.',
  // remove-from-day
  'help.guide.remove-from-day.title': 'Quitar una parada de un día',
  'help.guide.remove-from-day.goal': 'Quita un lugar de un día sin eliminarlo del viaje.',
  'help.guide.remove-from-day.step.1':
    'Haz clic con el botón derecho en la parada, o en sus tres puntos, y elige «Quitar del día».',
  'help.guide.remove-from-day.step.2':
    'La parada se quita del día. El lugar sigue en la columna de lugares, en «Sin planificar» si no está en ningún otro día.',
  'help.guide.remove-from-day.result':
    'El día, su ruta y su coste se actualizan. La flecha de deshacer recupera la parada.',
  'help.guide.remove-from-day.tip.1':
    'Eliminar, en el mismo menú, quita el lugar de todo el viaje, incluidos todos sus días.',
  'help.guide.remove-from-day.tip.2':
    '«Quitar del día» también está en el panel de detalles del lugar, junto a «Añadir al día».',
  // lock-stop
  'help.guide.lock-stop.title': 'Bloquear una parada en su sitio',
  'help.guide.lock-stop.goal': 'Deja una parada fija en su posición cuando se optimiza la ruta.',
  'help.guide.lock-stop.step.1':
    'Pasa el ratón por la imagen de la parada y haz clic en el candado: «Mantener posición durante la optimización de ruta».',
  'help.guide.lock-stop.step.2':
    'Ahora Optimizar ordena las demás paradas a su alrededor. Para desbloquearla, vuelve a hacer clic en el candado («Haz clic para desbloquear»).',
  'help.guide.lock-stop.result':
    'El candado aparece sobre la imagen; la parada mantiene su posición hasta que la desbloquees.',
  'help.guide.lock-stop.tip.1': 'Una parada con hora fija queda bloqueada por su hora; nunca se mueve al optimizar.',
  'help.guide.lock-stop.tip.2':
    'El bloqueo solo dura hasta que recargues la página. Después de recargar, todas las paradas vuelven a estar desbloqueadas; solo las paradas con hora siguen fijas.',
  // day-note
  'help.guide.day-note.title': 'Añadir una nota a un día',
  'help.guide.day-note.goal': 'Guarda en el día un recordatorio, un número de entrada o un plan B.',
  'help.guide.day-note.step.1': 'Haz clic en el + de la cabecera del día («Añadir al día») y elige «Añadir nota».',
  'help.guide.day-note.step.2':
    'Escribe el nombre de la nota en la parte superior del diálogo, donde pone «Nota». Es el nombre que se ve en la tarjeta del día. Escribe el resto en «Nota diaria»: la barra de herramientas de encima da formato al texto (negrita, listas, enlaces, citas) y «Vista previa», a la izquierda, muestra cómo quedará la fila.',
  'help.guide.day-note.step.3':
    'Elige un icono y un color para distinguir bien la nota de las paradas, y haz clic en Añadir.',
  'help.guide.day-note.step.4':
    'La nota aparece en el día como una parada: arrástrala a su sitio o usa sus flechas. Haz clic en ella para editarla. Eliminar está en el cuadro de diálogo y en sus tres puntos o en el menú del botón derecho, y antes te pregunta «¿Eliminar nota?».',
  'help.guide.day-note.result': 'La nota forma parte del día y del PDF, en el sitio al que la arrastraste.',
  'help.guide.day-note.tip.1':
    'Los enlaces de una nota se abren en una pestaña nueva, y un salto de línea simple se mantiene como salto de línea.',
  'help.guide.day-note.tip.2': 'Las notas son de cada día. Una nota para todo el viaje va en «Colaboración».',
  // day-route
  'help.guide.day-route.title': 'Mostrar y optimizar la ruta del día',
  'help.guide.day-route.goal':
    'Consulta la ruta entre las paradas, elige cómo te desplazas y deja que TREK ordene las paradas.',
  'help.guide.day-route.step.1':
    'Abre el día y haz clic en «Ruta», en la barra de ruta bajo sus paradas: la ruta entre las paradas se muestra en el mapa, y los conectores entre ellas indican el tiempo y la distancia de cada tramo.',
  'help.guide.day-route.step.2':
    'Los tres iconos de al lado definen el medio de transporte del día: «Coche», «A pie» o «Bicicleta». Los tramos se recalculan. Los plugins pueden añadir sus propios medios.',
  'help.guide.day-route.step.3':
    'Haz clic en un conector para cambiar el medio de ese tramo: elige un medio, «Transporte público» para buscar una conexión donde esté disponible, o «Usar predet. del día» para volver a usar el medio del día.',
  'help.guide.day-route.step.4':
    '«Optimizar» (la flecha circular) reordena las paradas por el camino más corto a partir de tres paradas. Las paradas con candado o con hora fija mantienen su posición; si hay un alojamiento en el día, la ruta empieza ahí.',
  'help.guide.day-route.step.5':
    '«Abrir en Google Maps» o «Abrir en CoMaps» abre todo el día como ruta en esa aplicación, para navegar por el camino; CoMaps también usa el medio de transporte del día.',
  'help.guide.day-route.result':
    'El día es una ruta con horarios; «Coste total» y los tramos se actualizan al cambiar el orden.',
  'help.guide.day-route.tip.1':
    'Las rutas se calculan con OSRM de forma predeterminada; el administrador puede configurar TREK para usar otro motor de rutas en «Valores predeterminados».',
  'help.guide.day-route.tip.2':
    'Si no se ha podido calcular la ruta de un tramo, no se muestra su duración. Comprueba que las dos paradas tengan coordenadas.',
  'help.guide.day-route.tip.3': 'La flecha de deshacer revierte una optimización.',
  // manage-days
  'help.guide.manage-days.title': 'Añadir, reordenar y renombrar días',
  'help.guide.manage-days.goal': 'Cambia los propios días, no solo los lugares que contienen.',
  'help.guide.manage-days.step.1':
    'Los días salen de las fechas del viaje. Cambia las fechas en el formulario de edición del viaje, en el «Panel», y se añadirán o quitarán días al principio o al final. Antes de quitar un día con contenido, una lista te muestra qué días se eliminan y qué contienen.',
  'help.guide.manage-days.step.2':
    '«Reordenar días», en la cabecera, abre una lista: arrastra un día por su asa, o usa «Subir» y «Bajar», y se moverá con sus lugares, notas y reservas. Debajo de la lista, «Añadir» con la fecha siguiente añade un día después del último con fecha y alarga el viaje un día; «Sin fecha» añade al final un día sin fecha. Un viaje sin fechas solo tiene «Añadir día».',
  'help.guide.manage-days.step.3':
    '«Eliminar día», la papelera al final de una fila, pregunta antes. Muestra lo que se borra con el día: sus lugares, notas y reservas, una estancia con entrada o salida ese día, y los días que se adelantan una fecha. «Eliminar día» lo borra y Cancelar lo conserva; el último día no se puede eliminar.',
  'help.guide.manage-days.step.4':
    'Para cambiar el nombre de un día, ábrelo y haz clic en el lápiz junto a su título en el panel de detalles sobre el mapa. El nombre sustituye a «Día 1» en la tarjeta y en el PDF.',
  'help.guide.manage-days.step.5':
    '«Desplegar todos los días» y «Plegar todos los días», en la cabecera, despliegan o pliegan todas las tarjetas a la vez. Para plegar una sola, haz clic en su flecha.',
  'help.guide.manage-days.result':
    'Las fechas se quedan en su posición: al subir un día, este toma la fecha anterior, y sus paradas, notas y reservas se mueven con él.',
  'help.guide.manage-days.tip.1': 'Mover días se puede deshacer con la flecha de deshacer; eliminar un día, no.',
  'help.guide.manage-days.tip.2':
    '«Coste total», al final del plan, suma todo el viaje; la pestaña «Costes» lo desglosa.',
  // bookings-in-plan
  'help.guide.bookings-in-plan.title': 'Ver las reservas y los transportes en el plan',
  'help.guide.bookings-in-plan.goal': 'Descubre dónde aparece una reserva una vez creada y desde qué pantalla se crea.',
  'help.guide.bookings-in-plan.step.1':
    'Un transporte (vuelo, tren, ferry, autobús, coche) es una fila del color de su tipo, con su hora y «Salida» el día en que sale o «Llegada» el día en que llega; el globo de al lado indica la zona horaria, y un vuelo con escala tiene una fila por tramo. En una conexión de transporte público, haz clic en la flecha para ver sus líneas. Haz clic en una fila y se abre la reserva; desde ahí, Editar te permite cambiarla.',
  'help.guide.bookings-in-plan.step.2':
    'Una reserva vinculada a una parada (un restaurante, una visita guiada) aparece en esa parada como etiqueta «Reserva», con su hora. La etiqueta es verde si está confirmada y ámbar mientras está pendiente. Una reserva con día pero sin parada tiene su propia fila en el día.',
  'help.guide.bookings-in-plan.step.3':
    'Una noche de hotel es un alojamiento: su píldora en la cabecera del día es verde el día de entrada y roja el de salida, y su icono de billete abre la reserva. El panel de detalles del día lo muestra en «Alojamiento», y la ruta de cada uno de esos días empieza allí.',
  'help.guide.bookings-in-plan.step.4':
    'En el mapa, el botón de ruta de una fila de reserva muestra su ruta; «Mostrar todas las rutas de reservas», en la cabecera, las muestra todas.',
  'help.guide.bookings-in-plan.step.5':
    'Para crearlas: «Añadir reserva» al pasar el cursor por una parada, «Añadir transporte» y «Transporte público» en el menú + del día, y las pestañas «Reservas» y «Transportes» para la lista completa con importación y archivos.',
  'help.guide.bookings-in-plan.result':
    'Cada reserva aparece una sola vez en el plan. Las pestañas muestran esas mismas reservas en forma de lista.',
  'help.guide.bookings-in-plan.tip.1':
    'Confirmado o pendiente es un estado que defines en la reserva; el plan lo muestra en la parada, y la pestaña «Reservas» cuenta ambos.',
  'help.guide.bookings-in-plan.tip.2':
    'Si sueltas una reserva con hora en otro punto de su día, vuelve a la posición que le corresponde por su hora. Si la arrastras a la tarjeta de otro día, pasa a ese día. Para cambiar la hora, edita la reserva.',
  // export-plan
  'help.guide.export-plan.title': 'Exportar el plan',
  'help.guide.export-plan.goal': 'Exporta el plan como documento, a tu calendario o a un GPS.',
  'help.guide.export-plan.step.1': 'Haz clic en Exportar, a la izquierda de la barra de cabecera encima de los días.',
  'help.guide.export-plan.step.2':
    '«Documento»: PDF abre la vista de impresión de todos los días con sus paradas, notas y reservas, empezando por un mapa general de la ruta; «Mi plan en PDF» incluye solo aquello en lo que participas. En esa vista, «Salto de página por día» empieza cada día en una página nueva, «Notas de transporte» añade las notas de tus transportes y «Guardar como PDF» lo descarga.',
  'help.guide.export-plan.step.3':
    '«Calendario»: «Descargar .ics» guarda las reservas como archivo de calendario; «Suscribirse al calendario» te da un enlace que tu aplicación de calendario actualiza automáticamente.',
  'help.guide.export-plan.step.4':
    '«Mapas y GPS» (GPX): «Todo el viaje» exporta lugares, rutas de los días y tracks; «Solo lugares», solo los puntos; «Días como rutas», una ruta por día, para mapas offline y dispositivos GPS.',
  'help.guide.export-plan.result': 'El archivo se descarga y el viaje no cambia en absoluto.',
  'help.guide.export-plan.tip.1':
    'Para abrir un solo día en una aplicación de mapas, usa su barra de ruta: «Abrir en Google Maps» o «Abrir en CoMaps».',
  'help.guide.export-plan.tip.2':
    'Para «Suscribirse al calendario» tienes que tener activados los feeds de calendario en tus ajustes y permiso para compartir el viaje; en «Panel» hay una guía sobre esto.',
  'help.guide.export-plan.tip.3':
    'Para exportar basta con tener acceso de lectura: cualquier miembro del viaje puede exportar el PDF, el .ics y el GPX.',

  // ── Screen: trip-place ────────────────────────────────────────────────────────────────
  'help.ctx.trip-place.title': 'Detalles del lugar',
  'help.ctx.trip-place.summary':
    'La tarjeta que se abre sobre el mapa al elegir un lugar: todo lo que el viaje sabe de él, las estrellas que le ha dado cada persona, su imagen y sus archivos, y los botones para añadirlo al día abierto, abrirlo en una aplicación de mapas o guardarlo en una lista.',
  'help.ctx.trip-place.bullet.1':
    'Haz clic en una fila de la columna de lugares, en una parada dentro de un día o en un marcador del mapa, y la tarjeta se abre sobre el mapa. Si la abres desde un día, la tarjeta sabe a qué parada te refieres y también muestra los participantes de la parada y su reserva. Una excursión (una caminata, una ruta o un paseo de la pestaña «Excursiones») abre en su lugar su propia tarjeta de excursión.',
  'help.ctx.trip-place.bullet.2':
    'La cabecera muestra la imagen redonda, el nombre, la dirección en una línea y etiquetas con lo que se sabe: abierto o cerrado, la categoría, la hora, el precio, el teléfono, el correo y las coordenadas. Haz clic en la imagen para usar una propia o una foto de los archivos del lugar. Haz doble clic en el nombre para cambiarlo. La X de la derecha cierra la tarjeta. La imagen, el cambio de nombre, Editar y Eliminar solo están disponibles para los viajeros que pueden modificar lugares.',
  'help.ctx.trip-place.bullet.3':
    'Debajo: las estrellas que cada viajero ha dado al lugar, la descripción y las notas, y «Notas para este día» si la parada tiene alguna.',
  'help.ctx.trip-place.bullet.4':
    'Después vienen «Horario de apertura», «Color de la ruta», «Datos de la ruta» y «Archivos», según corresponda. Subir, en el título «Archivos», añade archivos desde tu ordenador, y la lista también muestra los archivos fijados a esta parada y los de su reserva, incluida la confirmación de un hotel. Los plugins pueden añadir sus propias filas debajo.',
  'help.ctx.trip-place.bullet.5':
    'La fila de abajo: «Añadir al día» o «Quitar del día» si hay un día abierto, después «Navegación» (o el nombre de tu aplicación de mapas, si elegiste una en «Ajustes»), «Abrir la web» y «Guardar en colección». A la derecha, la papelera roja elimina el lugar y Editar abre su formulario.',
  'help.ctx.trip-place.bullet.6':
    'Un lugar elegido en la búsqueda muestra lo que saben de él el índice de TREK u OpenStreetMap: «Abierta» o «Cerrada» entre las píldoras de arriba, con un anillo verde o rojo alrededor de la imagen, según la hora local del lugar; su teléfono, también como píldora; el «Horario de apertura» más abajo, con el horario de hoy en la fila y la semana completa al hacer clic; y su sitio web en «Abrir la web». La valoración de Google solo aparece en lugares encontrados con Google, en un TREK con clave de Google. El horario, el teléfono y el correo que hayas escrito tú en el formulario del lugar sustituyen a los consultados y también deciden el color del anillo.',
  // read-place
  'help.guide.read-place.title': 'Lo que te dice la tarjeta de un lugar',
  'help.guide.read-place.goal': 'Consulta en una sola tarjeta todo lo que el viaje sabe de un lugar.',
  'help.guide.read-place.step.1':
    'En la columna de días, haz clic en la parada que quieras consultar. La tarjeta se abre sobre el mapa y la parada sigue marcada en su día.',
  'help.guide.read-place.step.2':
    'Arriba: la imagen redonda, el nombre y la dirección en una línea; la descripción emergente muestra la dirección completa. Las píldoras de debajo indican si está «Abierta» o «Cerrada» en este momento, según la hora local del lugar, con un anillo verde o rojo a juego alrededor de la imagen. También muestran la categoría, la hora, el teléfono y el correo electrónico (haz clic para abrirlos en tu teléfono o en tu aplicación de correo) y, en pantallas anchas, las coordenadas exactas. La X de la derecha cierra la tarjeta.',
  'help.guide.read-place.step.3':
    '«Valoración» es la primera sección bajo la cabecera: las estrellas que ha dado cada viajero al lugar, con la media y el número de votos. Mientras nadie haya votado, indica «Sin valorar todavía».',
  'help.guide.read-place.step.4':
    'Después vienen la descripción y, debajo, las notas. Las dos son el texto del formulario del lugar, con formato: funcionan las listas, los enlaces y la negrita.',
  'help.guide.read-place.step.5':
    '«Participantes» muestra quién va a esta parada. Están todos incluidos hasta que quites a alguien.',
  'help.guide.read-place.step.6':
    '«Horario de apertura», más abajo: la fila muestra el horario del día que estás viendo. Haz clic en ella para ver toda la semana, con ese día en negrita. Al lado está Archivos.',
  'help.guide.read-place.result':
    'La tarjeta sigue abierta hasta que la cierres con la X o elijas otro lugar. El horario semanal sigue desplegado, y la parada a la que pertenece sigue marcada en la columna de días.',
  'help.guide.read-place.tip.1':
    'Si eliges el lugar en la columna de lugares, la tarjeta muestra el lugar, pero no una parada. Por eso no muestra participantes y solo muestra las reservas del propio lugar, como la estancia de un hotel. Elige la parada dentro del día para verlo todo.',
  'help.guide.read-place.tip.2':
    'Si puedes modificar lugares, haz doble clic en el nombre para cambiarlo sin abrir el formulario. Intro guarda y Escape cancela el cambio.',
  'help.guide.read-place.tip.3':
    'Un lugar introducido a mano solo tiene los datos de su formulario. Haz clic en Editar y rellena tú «Teléfono», «Correo electrónico» y el horario, o elige el lugar entre las sugerencias de «Buscar lugares…» y haz clic en Actualizar para que se consulten. La valoración de Google necesita una clave de Google.',
  // rate-place
  'help.guide.rate-place.title': 'Valorar un lugar',
  'help.guide.rate-place.goal': 'Valora un lugar con tus propias estrellas y consulta las valoraciones de los demás.',
  'help.guide.rate-place.step.1':
    'Abre el lugar. La fila de estrellas está justo debajo de la cabecera y muestra la media de los votos hasta ahora, con el número de votos entre paréntesis.',
  'help.guide.rate-place.step.2':
    'Haz clic en la estrella que quieras. Las estrellas se rellenan al pasar el puntero por encima, así ves qué valoración vas a dar.',
  'help.guide.rate-place.step.3':
    'Tu voto se suma a la media al instante, y las caras de al lado muestran quién ha votado. Pasa el ratón por la fila para ver las estrellas de cada uno.',
  'help.guide.rate-place.step.4':
    'La misma media aparece en la fila del lugar en la columna de lugares, así encuentras fácilmente los mejores lugares de la lista.',
  'help.guide.rate-place.result':
    'Todos los participantes del viaje ven tus estrellas en el lugar. Ahora la estrella de la fila de filtros, encima de la lista, puede mostrar solo los lugares con una valoración mínima.',
  'help.guide.rate-place.tip.1':
    'Todos los viajeros pueden valorar, incluso en un viaje en el que solo algunos pueden modificar lugares.',
  'help.guide.rate-place.tip.2':
    'Haz clic en la estrella que ya diste para quitar tu valoración. Si nadie ha valorado el lugar, vuelve a mostrar «Sin valorar todavía».',
  'help.guide.rate-place.tip.3':
    'Junto a las estrellas se muestran como caras hasta seis votantes. La descripción emergente los muestra a todos y te marca a ti.',
  // place-image
  'help.guide.place-image.title': 'Poner tu propia imagen a un lugar',
  'help.guide.place-image.goal': 'Sustituye la miniatura automática por una foto tuya.',
  'help.guide.place-image.step.1': 'Abre el lugar desde la columna de lugares.',
  'help.guide.place-image.step.2':
    'Pasa el cursor por la imagen redonda de la cabecera: aparece una cámara y la descripción emergente dice «Subir imagen». Haz clic y elige tu archivo. Si el lugar ya tiene fotos entre sus archivos, TREK te pregunta primero: «Subir desde el dispositivo» o una de las imágenes de «Desde los archivos adjuntos».',
  'help.guide.place-image.step.3':
    'La parte superior de la tarjeta muestra ahora tu imagen, con una pequeña X roja en la esquina.',
  'help.guide.place-image.step.4':
    'La misma imagen aparece también en la fila del lugar en la columna de lugares y en su marcador del mapa.',
  'help.guide.place-image.result':
    'Tu imagen se usa para el lugar en todas partes: la tarjeta, la columna de lugares, la parada del día, el marcador del mapa y los viajes compartidos.',
  'help.guide.place-image.tip.1': 'Se admiten JPG, PNG, GIF y WebP, y los HEIC de un iPhone se convierten al subirlos.',
  'help.guide.place-image.tip.2':
    'Con la X de la esquina quitas tu imagen y vuelve a aparecer la automática. El lugar en sí no cambia.',
  'help.guide.place-image.tip.3':
    'Si no has añadido ninguna imagen, TREK busca una a partir de las coordenadas del lugar. Si no encuentra ninguna, muestra el icono de la categoría. Solo los viajeros que pueden modificar lugares pueden poner una imagen.',
  // place-day-assign
  'help.guide.place-day-assign.title': 'Añadir el lugar al día abierto o quitarlo',
  'help.guide.place-day-assign.goal': 'Usa el botón de la ficha en lugar de arrastrar la fila por el planificador.',
  'help.guide.place-day-assign.step.1':
    'Haz clic en la cabecera de un día en la columna de días. Ese día pasa a ser el día abierto, y la tarjeta se aplica a él.',
  'help.guide.place-day-assign.step.2':
    'Haz clic en la columna de lugares en un lugar que no esté en ese día. Se abre su tarjeta, y la fila de abajo ofrece «Añadir al día».',
  'help.guide.place-day-assign.step.3':
    'Haz clic en «Añadir al día». La parada se añade al final del día y el botón cambia a «Quitar del día».',
  'help.guide.place-day-assign.step.4':
    'La parada está ahora en el día, al final de la lista. Arrástrala hacia arriba hasta la posición que le corresponde.',
  'help.guide.place-day-assign.step.5':
    '«Quitar del día» vuelve a sacar la parada del día, y en la tarjeta aparece otra vez «Añadir al día».',
  'help.guide.place-day-assign.result': 'La parada se añade al día o se quita de él. El lugar en sí no cambia.',
  'help.guide.place-day-assign.tip.1':
    'El botón solo aparece si hay un día abierto. Sin un día abierto, no hay ningún día al que añadir el lugar.',
  'help.guide.place-day-assign.tip.2':
    'Si quitas una parada de un día, el lugar sigue en el viaje y en la columna de lugares. Eliminar lo quita de todas partes.',
  'help.guide.place-day-assign.tip.3':
    'Una parada añadida al día por una reserva de alojamiento no muestra ninguno de los dos botones. Esa noche se añade y se quita en el bloque de alojamiento del día.',
  // place-participants
  'help.guide.place-participants.title': 'Indicar quién va a esta parada',
  'help.guide.place-participants.goal': 'Elige quién va a una parada sin cambiar quién participa en el viaje.',
  'help.guide.place-participants.step.1':
    'Haz clic en la parada dentro del día. Se abre la tarjeta y en «Participantes» aparecen todas las personas del viaje.',
  'help.guide.place-participants.step.2':
    'Haz clic en la etiqueta de un viajero para quitarlo de esta parada. Al pasar el ratón por encima, el nombre aparece tachado.',
  'help.guide.place-participants.step.3':
    'En cuanto falta alguien, aparece un + discontinuo. Haz clic en él para ver quién no está en la parada.',
  'help.guide.place-participants.step.4':
    'Haz clic en un nombre para volver a añadir a esa persona. Cuando vuelven a estar todos, la parada vuelve a ser de todo el grupo.',
  'help.guide.place-participants.result':
    'La parada solo muestra a los viajeros que elegiste. El resto del grupo tiene ese tiempo libre.',
  'help.guide.place-participants.tip.1':
    '«Participantes» solo aparece cuando hay una parada seleccionada, así que elige el lugar dentro del día, no en la columna de lugares. Además, solo aparece en viajes con más de un viajero.',
  'help.guide.place-participants.tip.2':
    'Si no eliges a nadie, van todos. Por eso no puedes quitar al último viajero de una parada.',
  'help.guide.place-participants.tip.3':
    'Un invitado, aunque no tenga cuenta propia, puede ser participante como cualquier otra persona.',
  // place-booking
  'help.guide.place-booking.title': 'La reserva de una parada',
  'help.guide.place-booking.goal': 'Consulta la reserva de una parada, ábrela y vincúlale una nueva.',
  'help.guide.place-booking.step.1':
    'Abre la parada a la que pertenece la reserva. La tarjeta la muestra en «Reservas» como una pequeña tarjeta propia, con el nombre de la reserva y «Confirmado» o «Pendiente».',
  'help.guide.place-booking.step.2':
    'La tarjeta de la reserva muestra la «Fecha», la hora y el «Código de reserva», etiquetas con otros datos de la reserva (un número de vuelo, un andén, el registro de entrada) y las notas que tenga.',
  'help.guide.place-booking.step.3': 'Haz clic en la tarjeta de la reserva. La reserva se abre sobre el mapa.',
  'help.guide.place-booking.step.4':
    'Editar, al pie de la reserva, abre su propio formulario. En ese formulario, «Vincular a una asignación del día» vincula una reserva a una parada, y ya muestra esta parada. Vuelve a cerrar el formulario.',
  'help.guide.place-booking.step.5':
    'Las reservas nuevas para una parada se crean en la columna de días: pasa el cursor por la parada y haz clic en «Añadir reserva», el icono del billete al final. El formulario se abre como «Nueva reserva», ya vinculado a la parada.',
  'help.guide.place-booking.result':
    'La reserva queda vinculada a la parada: aparece en la tarjeta y en el día, y sus archivos también se muestran aquí, en «Archivos».',
  'help.guide.place-booking.tip.1':
    'Una reserva aparece en la parada a la que está fijada, y una reserva de hotel también aparece en el hotel, lo abras donde lo abras. Una reserva sin parada aparece en la pestaña «Reservas».',
  'help.guide.place-booking.tip.2':
    'Una parada puede tener varias reservas, por ejemplo una comida y una visita guiada que empiezan en el mismo sitio.',
  'help.guide.place-booking.tip.3':
    'En un tren, un vuelo o un ferry, Editar abre en su lugar el formulario de transporte, el mismo que usa la pestaña «Transportes».',
  // place-files
  'help.guide.place-files.title': 'Guardar las entradas de un lugar junto al lugar',
  'help.guide.place-files.goal': 'Adjunta la entrada, el bono o el plano al lugar correspondiente.',
  'help.guide.place-files.step.1':
    'Abre el lugar. «Archivos» está bajo sus detalles, junto a «Horario de apertura» si el lugar lo tiene, y muestra «Archivos» mientras el lugar no tenga ninguno.',
  'help.guide.place-files.step.2': 'Haz clic en Subir, a la derecha del título «Archivos», y elige el archivo.',
  'help.guide.place-files.step.3':
    'El botón indica cuántos archivos tiene el lugar, y la lista se despliega automáticamente.',
  'help.guide.place-files.step.4':
    'Cada fila muestra el nombre y el tamaño del archivo. Haz clic en ella para abrir el archivo.',
  'help.guide.place-files.result':
    'El archivo queda adjunto al lugar y se cuenta en la tarjeta. También aparece en la pestaña «Archivos» del viaje.',
  'help.guide.place-files.tip.1':
    '«Archivos» también muestra lo que está fijado a esta parada y lo adjunto a su reserva, así que la confirmación de un hotel aparece en el hotel.',
  'help.guide.place-files.tip.2':
    'Subir admite varios archivos a la vez, y cualquier foto entre ellos puede convertirse en la imagen del lugar.',
  'help.guide.place-files.tip.3':
    'Si no tienes permiso para subir archivos, no verás el botón «Subir»; los archivos que ya tiene el lugar se siguen mostrando.',
  // place-navigation
  'help.guide.place-navigation.title': 'Abrir un lugar en una aplicación de mapas o en su web',
  'help.guide.place-navigation.goal': 'Abre el lugar en la app de navegación que usas para llegar.',
  'help.guide.place-navigation.step.1': 'Abre el lugar y haz clic en «Navegación», en la fila de abajo.',
  'help.guide.place-navigation.step.2':
    'La lista muestra las aplicaciones de mapas adecuadas para este lugar: Google Maps, Waze, Apple Maps, OpenStreetMap y CoMaps, y además «Otra app de mapas» en Android.',
  'help.guide.place-navigation.step.3':
    'Haz clic en la que uses. Siempre que puede, TREK envía a la aplicación el propio lugar, no solo sus coordenadas, para que llegues a la entrada correcta.',
  'help.guide.place-navigation.step.4':
    '«Abrir la web», al lado, abre en una pestaña nueva la web del propio lugar, con sus horarios y entradas.',
  'help.guide.place-navigation.result':
    'La aplicación de mapas se abre en el lugar, la web se abre en una pestaña nueva y no cambia nada del viaje. Si TREK está instalado como aplicación, se abre la aplicación de mapas en lugar de una pestaña nueva.',
  'help.guide.place-navigation.tip.1':
    'Waze empieza a navegar al momento. Las demás aplicaciones abren el lugar, y tienes que tocar una vez más para iniciar la navegación.',
  'help.guide.place-navigation.tip.2':
    'Las aplicaciones que se ofrecen dependen del lugar y de tu dispositivo: Apple Maps no aparece en Android, 高德地图 solo aparece para lugares de China, y Waze, Apple Maps y CoMaps necesitan las coordenadas del lugar. «Otra app de mapas» abre el lugar en cualquier aplicación de mapas de tu móvil Android.',
  'help.guide.place-navigation.tip.3':
    'Elige tu aplicación de mapas una vez en «Ajustes», en «Abrir lugares en». A partir de entonces, el botón muestra su nombre y la abre directamente. Lo mismo ocurre cuando solo hay una aplicación disponible para un lugar.',
  // place-to-collection
  'help.guide.place-to-collection.title': 'Guardar un lugar en una de tus listas',
  'help.guide.place-to-collection.goal': 'Guarda un lugar que has descubierto en este viaje para el siguiente.',
  'help.guide.place-to-collection.step.1':
    'Abre el lugar y haz clic en «Guardar en colección», en la fila inferior de la tarjeta.',
  'help.guide.place-to-collection.step.2':
    '«Guardar en una lista» muestra todas las listas que tienes o compartes. Un marcador relleno a la derecha indica las listas que ya contienen este lugar.',
  'help.guide.place-to-collection.step.3': 'Haz clic en la lista. El lugar se añade al momento.',
  'help.guide.place-to-collection.step.4': 'Cierra el cuadro con la X; el botón de la tarjeta indica ahora «Guardado».',
  'help.guide.place-to-collection.result':
    'El lugar está en tu lista con su imagen, sus notas y su dirección, listo para el próximo viaje.',
  'help.guide.place-to-collection.tip.1':
    'El botón solo aparece si el complemento «Colecciones» está activado; el administrador lo activa en «Complementos».',
  'help.guide.place-to-collection.tip.2':
    'Un lugar puede estar en varias listas a la vez, con un estado distinto en cada una: idea en una y visitado en otra.',
  'help.guide.place-to-collection.tip.3':
    '«Marcar como visitado», bajo el nombre del lugar en la parte superior del selector, marca el lugar como visitado en la lista. Si el lugar está en varias de tus listas, el botón indica «Visitado en todas» y lo marca en todas a la vez. «Vista» abre tus listas en «Colecciones».',
  // place-track
  'help.guide.place-track.title': 'Consultar un track y darle su propio color',
  'help.guide.place-track.goal': 'Mira cuánto mide una ruta a pie importada y cuál de las líneas del mapa es la suya.',
  'help.guide.place-track.step.1':
    'En la columna de lugares, la fila de un track muestra una línea corta del mismo color que el track en el mapa. Haz clic en ella.',
  'help.guide.place-track.step.2':
    '«Datos de la ruta» indica la longitud del recorrido en las unidades que hayas configurado.',
  'help.guide.place-track.step.3':
    '«Color de la ruta», encima, muestra el color actual. Haz clic en la fila para ver los colores disponibles.',
  'help.guide.place-track.step.4': 'Elige un color. La línea del mapa y el trazo de la fila cambian con él.',
  'help.guide.place-track.step.5':
    'La casilla discontinua de la izquierda, «Color automático», devuelve al track su color predeterminado. El cuentagotas de la derecha abre el selector de color del sistema para elegir cualquier otro color.',
  'help.guide.place-track.result':
    'El track se muestra con el color elegido en la tarjeta, en su fila de la columna de lugares y en el mapa.',
  'help.guide.place-track.tip.1':
    'Solo los lugares con un recorrido tienen estos dos bloques: los importados de un archivo GPX, KML o KMZ antes de que existiera «Excursiones», o en un TREK con «Excursiones» desactivado. Con «Excursiones» activado, un archivo GPX nuevo se convierte en una excursión, que abre su propia tarjeta de excursión.',
  'help.guide.place-track.tip.2':
    'Si el track se grabó con altitudes, también muestra el punto más alto y el más bajo, los metros de subida y de bajada, y el perfil de la ruta.',
  'help.guide.place-track.tip.3':
    'Al importar, cada track recibe su propio color, así que dos rutas a pie nunca tienen el mismo.',
  // read-place
  'help.guide.read-place.step.7':
    'La fila de abajo reúne lo que puedes hacer desde aquí: poner el lugar en el día abierto o quitarlo, abrirlo en una aplicación de mapas o en su web, guardarlo en una lista y, a la derecha, eliminarlo (la papelera roja) o editarlo.',

  // ── Screen: trip-files ────────────────────────────────────────────────────────────────
  'help.ctx.trip-files.title': 'Archivos',
  'help.ctx.trip-files.summary':
    'Todos los documentos del viaje en una sola lista: billetes, confirmaciones, pases e imágenes. Cada uno tiene una nota, un vínculo al lugar o a la reserva a la que pertenece y una papelera desde la que puedes restaurarlo.',
  'help.ctx.trip-files.bullet.1':
    '«Arrastra aquí los archivos», el recuadro discontinuo bajo la barra, acepta los archivos que sueltes en él. Un clic en él abre el selector de archivos. El recuadro muestra los tipos de archivo que acepta este TREK y el límite por archivo (máx. 50 MB, salvo que un administrador haya fijado otro).',
  'help.ctx.trip-files.bullet.2':
    'La barra superior contiene «Archivos» y las pestañas de filtro «Todos», PDF, «Imágenes» y «Documentos», cada una con su recuento. En cuanto destacas un archivo, aparece una pestaña con una estrella después de «Todos», y en cuanto una nota tiene un adjunto, aparece al final la pestaña «Notas de colaboración».',
  'help.ctx.trip-files.bullet.3':
    'Cada fila muestra una miniatura o el tipo de archivo, quién lo subió, el nombre, la nota debajo, el tamaño y la fecha, y una insignia por cada vínculo: el lugar, la reserva o el transporte con su nombre (al pasar el cursor indica «Plan diario», «Reserva» o «Transporte»), y «Desde notas de colaboración».',
  'help.ctx.trip-files.bullet.4':
    'Al final de cada fila hay hasta cinco iconos, cuyo nombre aparece al pasar el cursor: «Destacar», «Asignar» (el lápiz), Abrir, Descargar y Eliminar. Eliminar no pide confirmación: el archivo va a la papelera, desde donde puedes restaurarlo. Sin conexión, las notas, los vínculos, las estrellas y la papelera siguen funcionando y se envían cuando TREK vuelve a estar en línea; solo subir archivos y quitar otro vínculo necesitan conexión.',
  'help.ctx.trip-files.bullet.5':
    'Una imagen o un vídeo se abre a pantalla completa, con las teclas de flecha y una fila de miniaturas. Cualquier otro documento se abre en un cuadro con su nombre arriba y, debajo, «Abrir en una pestaña nueva» y Descargar. Una tarjeta para el monedero digital se descarga directamente.',
  'help.ctx.trip-files.bullet.6':
    'El icono de la papelera en el extremo derecho de la barra («Papelera») cambia la lista a los archivos eliminados. Ahí puedes restaurar cada uno o eliminarlo definitivamente, y «Vaciar papelera», en la barra, los elimina todos. «Sincronización de documentos» está a la izquierda del icono de la papelera si el viaje está conectado a un almacenamiento de documentos, o, para el propietario del viaje o un administrador, en cuanto se activa algún almacenamiento.',
  // files-upload
  'help.guide.files-upload.title': 'Añadir un documento al viaje',
  'help.guide.files-upload.goal':
    'Sube al viaje un billete, una confirmación o una foto de tu carpeta de descargas para que todos los del viaje puedan abrirlo.',
  'help.guide.files-upload.step.1':
    'Abre el viaje y haz clic en Archivos, en la barra de pestañas. Ahí están los documentos del viaje, con el recuadro para subir archivos encima.',
  'help.guide.files-upload.step.2':
    'Haz clic en «Arrastra aquí los archivos» y elige uno o varios archivos. Se suben uno tras otro, y mientras tanto el recuadro indica «Subiendo...». Dentro del recuadro, bajo «o haz clic para explorar», ves los tipos de archivo que acepta este TREK y el tamaño máximo por archivo.',
  'help.guide.files-upload.step.3':
    'Cuando termina de subirse el último archivo, se abre automáticamente «Asignar archivo» para él (si el viaje tiene lugares o reservas), con el nombre del archivo arriba del cuadro. «Añadir una nota...», en «Nota», añade una nota al archivo, y las listas de debajo lo vinculan a un lugar o a una reserva. Ciérralo con la × de arriba a la derecha; al cerrarlo no se pierde nada.',
  'help.guide.files-upload.step.4':
    'Los archivos nuevos aparecen arriba de la lista; solo los destacados quedan por encima. Cada fila muestra quién subió el archivo, el nombre, el tamaño y la fecha. Las imágenes tienen miniatura; los demás archivos muestran su tipo.',
  'help.guide.files-upload.result':
    'Los documentos están en el viaje, y cualquiera que pueda ver el viaje puede abrirlos y descargarlos.',
  'help.guide.files-upload.tip.1':
    'También puedes arrastrar un archivo desde el escritorio directamente al recuadro. El recuadro se resalta mientras el archivo está encima.',
  'help.guide.files-upload.tip.2':
    'Pulsa Ctrl+V para añadir a la lista una imagen del portapapeles; así no tienes que guardar antes la captura de pantalla de una reserva.',
  'help.guide.files-upload.tip.3':
    'Para subir archivos necesitas permiso para hacerlo; sin él, el recuadro ni siquiera aparece. Un tipo que no está en la lista se rechaza con un mensaje y no se sube nada. Un archivo que supera el límite (50 MB, salvo que un administrador haya fijado otro) se rechaza antes de enviar nada, y el mensaje indica el límite. Para subir también necesitas conexión: sin ella, TREK te avisa y no sube nada.',
  // files-link
  'help.guide.files-link.title': 'Vincular un documento a un lugar o a una reserva',
  'help.guide.files-link.goal':
    'Encuentra el billete fácilmente desde el día al que pertenece, no solo desde esta lista.',
  'help.guide.files-link.step.1':
    'Haz clic en el lápiz al final de la fila («Asignar»). Se abre «Asignar archivo», con el nombre del archivo arriba del cuadro.',
  'help.guide.files-link.step.2':
    'En «Nota», «Añadir una nota...» admite una línea, que luego aparece bajo el nombre del archivo en la lista. Se guarda al pulsar Intro o al salir del campo.',
  'help.guide.files-link.step.3':
    'En «Lugar», a la izquierda, están los lugares del viaje, agrupados por día con su fecha, y al final «Sin asignar» para los que no están en ningún día. Haz clic en uno para marcarlo.',
  'help.guide.files-link.step.4':
    'En «Reserva» y «Transporte», a la derecha, están las reservas del viaje. Haz clic en la que corresponde al documento; también queda marcada.',
  'help.guide.files-link.step.5':
    'Cierra con la × de arriba a la derecha. Aquí no hay botón de guardar: cada clic se ha guardado al momento.',
  'help.guide.files-link.result':
    'La fila muestra la nota y una insignia por cada vínculo: una con el nombre del lugar y otra con el del vuelo. Al pasar el ratón por una insignia aparece «Plan diario» o «Transporte». El documento también queda adjunto al lugar y al vuelo.',
  'help.guide.files-link.tip.1':
    'Un archivo puede tener varios vínculos a la vez, así que la misma confirmación puede pertenecer a la vez a la reserva del hotel y al lugar del hotel.',
  'help.guide.files-link.tip.2':
    'Vuelve a hacer clic en una entrada marcada para quitar ese vínculo; el archivo no se borra. Sin conexión, la nota y las nuevas marcas se guardan y se envían cuando TREK vuelve a estar en línea; solo quitar otro vínculo requiere conexión.',
  'help.guide.files-link.tip.3':
    'También funciona al revés: un documento adjunto a un lugar o a una reserva aparece igualmente en esta lista, con la misma insignia en su fila.',
  // files-star
  'help.guide.files-star.title': 'Mantener arriba los documentos importantes',
  'help.guide.files-star.goal':
    'Marca los pocos documentos que de verdad vas a necesitar, para encontrarlos rápido en una lista larga.',
  'help.guide.files-star.step.1':
    'Haz clic en la estrella al final de una fila («Destacar»). Se pone dorada, aparece una segunda estrella delante del nombre del archivo y, al pasar el cursor por el botón, ahora indica «Quitar destacado».',
  'help.guide.files-star.step.2':
    'La lista se reordena: los archivos destacados aparecen por encima de todos los demás y, dentro de cada grupo, primero los más recientes.',
  'help.guide.files-star.step.3':
    'Ahora aparece una estrella en las pestañas de filtro de la barra, justo después de «Todos», con el número de archivos destacados al lado. Haz clic en ella para ver solo esos archivos.',
  'help.guide.files-star.result':
    'Los archivos destacados aparecen arriba en la lista, y hay una pestaña que solo muestra los destacados.',
  'help.guide.files-star.tip.1':
    'La pestaña de la estrella solo existe mientras haya algún archivo destacado. Si quitas el destacado del último archivo, la pestaña desaparece.',
  'help.guide.files-star.tip.2':
    'Destacar requiere el mismo permiso que «Asignar», «Editar metadatos del archivo». Un miembro sin ese permiso ve las estrellas, pero si hace clic en «Destacar» no cambia nada.',
  // files-filter
  'help.guide.files-filter.title': 'Buscar un documento en la lista',
  'help.guide.files-filter.goal': 'Muestra solo el tipo de documento que buscas.',
  'help.guide.files-filter.step.1':
    'Las pestañas de filtro están en la barra de arriba, junto a «Archivos»: «Todos», «PDF», «Imágenes» y «Documentos», cada una con su número de archivos al lado.',
  'help.guide.files-filter.step.2': 'Haz clic en «PDF»: la lista muestra solo los archivos PDF.',
  'help.guide.files-filter.step.3':
    'Hay dos pestañas más que solo aparecen si el viaje tiene archivos de ese tipo. Haz clic en «Notas de colaboración», que aparece en cuanto una nota de la pestaña Colaboración tiene un adjunto: la lista muestra entonces solo esos archivos. De la misma forma aparece una pestaña con una estrella en cuanto destacas un archivo.',
  'help.guide.files-filter.step.4': '«Todos» vuelve a mostrar la lista completa.',
  'help.guide.files-filter.result':
    'La lista muestra solo los archivos de la pestaña elegida, y el número de cada pestaña indica cuántos son.',
  'help.guide.files-filter.tip.1':
    'Aquí no hay carpetas y no se puede cambiar el nombre de los archivos. Para distinguir los documentos, usa la nota de «Asignar archivo», los vínculos a lugares y reservas, y la estrella.',
  'help.guide.files-filter.tip.2':
    'La lista siempre muestra primero los destacados y después los más recientes, así que un documento subido hoy aparece por encima de uno del mes pasado.',
  // files-preview
  'help.guide.files-preview.title': 'Ver un documento sin salir de TREK',
  'help.guide.files-preview.goal':
    'Consulta al momento un billete o una imagen, y descárgalo en tu dispositivo cuando lo necesites ahí.',
  'help.guide.files-preview.step.1':
    'Haz clic en el nombre de una imagen o en su miniatura. Se abre a pantalla completa, con el nombre del archivo y su posición entre las imágenes arriba a la izquierda. Los vídeos se abren igual y se reproducen ahí.',
  'help.guide.files-preview.step.2':
    'Usa las flechas redondas de los lados, las teclas de flecha izquierda y derecha o la tira de miniaturas de abajo para recorrer todas las imágenes que muestra la lista en ese momento.',
  'help.guide.files-preview.step.3':
    '«Abrir en una pestaña nueva» y Descargar son los botones redondos de arriba a la derecha, junto a la ×. Haz clic en la ×, pulsa Escape o haz clic en el fondo oscuro para cerrar la imagen.',
  'help.guide.files-preview.step.4':
    'Un documento que no es una imagen se abre en un cuadro: su nombre arriba, con «Abrir en una pestaña nueva» y Descargar como píldoras debajo y, si es un PDF, la página debajo. La × de arriba a la derecha, Escape o un clic fuera del cuadro lo cierran.',
  'help.guide.files-preview.step.5':
    'La flecha al final de una fila (Descargar) guarda el archivo directamente en tu dispositivo, sin abrirlo antes.',
  'help.guide.files-preview.result':
    'El documento se muestra en pantalla, y los mismos dos botones lo abren en una pestaña del navegador o lo guardan en tu disco.',
  'help.guide.files-preview.tip.1':
    'En una pantalla táctil, desliza el dedo para pasar las imágenes en vez de hacer clic en las flechas.',
  'help.guide.files-preview.tip.2':
    'Los pases de wallet nunca abren vista previa. Se descargan directamente para que el teléfono pueda abrirlos en su aplicación de cartera.',
  'help.guide.files-preview.tip.3':
    '«Abrir en una pestaña nueva» y Descargar cargan el archivo con tu sesión, así que un enlace copiado de la barra de direcciones no le funciona a nadie más.',
  // files-trash
  'help.guide.files-trash.title': 'Eliminar un documento y restaurarlo',
  'help.guide.files-trash.goal':
    'Elimina lo que el viaje ya no necesita y restaura los archivos que todavía te hacen falta.',
  'help.guide.files-trash.step.1':
    'Haz clic en la papelera al final de una fila (Eliminar). El archivo desaparece de la lista al momento y aparece el mensaje «Movido a la papelera». No se pide confirmación.',
  'help.guide.files-trash.step.2':
    'El icono de la papelera en el extremo derecho de la barra («Papelera») cambia la lista a los archivos eliminados. El título de la barra indica «Papelera», y se ocultan las pestañas de filtro y el recuadro de subida.',
  'help.guide.files-trash.step.3':
    'En la papelera, las filas aparecen en gris y tienen dos iconos: «Restaurar», que recupera el archivo, y «Eliminar», que lo borra definitivamente después de pedirte confirmación.',
  'help.guide.files-trash.step.4':
    'Haz clic en «Restaurar». Aparece el mensaje «Archivo restaurado» y el archivo sale de la papelera. Conserva su nota y sus vínculos.',
  'help.guide.files-trash.step.5':
    '«Vaciar papelera», en la barra junto al icono de la papelera, elimina para siempre todo lo que siga en la papelera. Antes, el navegador te pide confirmación una vez. El icono de la papelera vuelve a llevarte a los archivos.',
  'help.guide.files-trash.result': 'El archivo vuelve a estar en la lista donde estaba.',
  'help.guide.files-trash.tip.1':
    'Eliminar en una fila no pide confirmación. Por eso existe la papelera: nada se borra de TREK hasta que lo eliminas aquí. Todo esto también funciona sin conexión y se envía cuando TREK vuelve a estar en línea.',
  'help.guide.files-trash.tip.2':
    'Para eliminar y restaurar archivos hace falta el permiso para eliminar archivos. Un miembro sin él no ve Eliminar en la fila ni los botones de la papelera.',
  'help.guide.files-trash.tip.3': 'Un archivo eliminado definitivamente desde la papelera no se puede recuperar.',
  // files-sync
  'help.guide.files-sync.title': 'Sincronizar los documentos con tu almacenamiento de documentos',
  'help.guide.files-sync.goal':
    'Conecta el viaje a tu propio almacén de documentos para que lo que subas aquí se guarde allí y lo que guardes allí aparezca aquí.',
  'help.guide.files-sync.step.1':
    'Haz clic en «Sincronización de documentos», junto al icono de la papelera, en el extremo derecho de la barra. Se abre el diálogo con el nombre del viaje bajo el título. A la izquierda, en «Conectar un proveedor», están los almacenes que ha activado un administrador, cada uno con una línea que indica cómo guarda los archivos: Paperless-ngx y Papra por etiqueta, Nextcloud y Synology Drive en una carpeta, y OpenCloud en un espacio. A la derecha pone «Aún no hay nada conectado».',
  'help.guide.files-sync.step.2':
    'Haz clic en tu servicio de almacenamiento, en este caso Nextcloud. Se abre un diálogo más pequeño para la conexión, con el nombre del servicio, que te pide los datos de acceso que necesita.',
  'help.guide.files-sync.step.3':
    'Rellena la «Dirección» y los datos de acceso del almacenamiento: un «Token de API» para Paperless-ngx; una clave de API y el «ID de organización» para Papra; «Nombre de usuario» y una «Contraseña de aplicación» para Nextcloud; «Nombre de usuario» y un «Token de aplicación» para OpenCloud; y, para Synology Drive, «Nombre de usuario», «Contraseña» y, si la cuenta lo pide, un «Código de doble factor». Usa una contraseña o un token de aplicación siempre que el almacenamiento lo ofrezca, nunca la contraseña de tu cuenta. Nextcloud y Synology Drive también admiten una «Carpeta base» opcional, donde TREK busca las carpetas de los viajes, aquí /Reisen. «Aceptar un certificado autofirmado», abajo del todo, es solo para un almacenamiento en tu propia red que use un certificado así.',
  'help.guide.files-sync.step.4':
    'Haz clic en «Probar conexión». TREK se conecta al almacenamiento con los datos que has escrito, y el pie indica «Conectado, sesión iniciada como» seguido del nombre de la cuenta. Si se rechazan las credenciales o no se puede acceder a la dirección, el pie lo indica. En ningún caso se guarda nada.',
  'help.guide.files-sync.step.5':
    'Haz clic en «Conectar». La conexión se guarda con el viaje, y TREK pregunta dónde deben estar los documentos del viaje en el almacenamiento: la etiqueta, carpeta o espacio que los contiene. Solo se sincroniza lo que hay ahí dentro. «Crear uno nuevo» lo crea al hacer clic en Crear, con un nombre tomado del título del viaje. En «O usa uno que ya tengas» ves los que ya existen. Haz clic en uno, aquí la carpeta Autumn in Japan.',
  'help.guide.files-sync.step.6':
    'El cuadro se vuelve a abrir: tu almacenamiento aparece en «Este viaje», a la izquierda, y su tarjeta, a la derecha, muestra con qué se sincroniza, cuándo se sincronizó por última vez y «Sincronizar ahora». La primera sincronización empieza automáticamente; haz clic en «Sincronizar ahora» para sincronizar cuando quieras. Después de una sincronización, la insignia «Aún sin sincronizar» junto al nombre cambia a un punto verde, que indica «Al día» al pasar el cursor. La barra de flujo muestra cuántos documentos tienen TREK y el almacenamiento, con los carriles «Hacia el gestor» y «Desde el gestor» entre ellos. Cierra el cuadro con la × de arriba a la derecha.',
  'help.guide.files-sync.result':
    'Los documentos que ya había en el almacén aparecen al principio de la lista, subidos a tu nombre, y todos los documentos del viaje están también en el almacén, salvo los de «Notas de colaboración». A partir de ahora, TREK revisa el almacén en segundo plano y los cambios de la lista se copian en el almacén.',
  'help.guide.files-sync.tip.1':
    'Solo el propietario del viaje o un administrador de la instancia pueden conectar un viaje, porque las credenciales dan acceso a toda la cuenta del almacén. Una vez conectado, todos los miembros ven «Sincronización de documentos» y pueden abrirlo, consultar la tarjeta y pulsar «Sincronizar ahora».',
  'help.guide.files-sync.tip.2':
    'Un almacenamiento en tu propia red necesita ALLOW_INTERNAL_NETWORK=true en el servidor de TREK, y su dirección tiene que ser la del equipo en la red, nunca localhost. Si no, «Probar conexión» responde «Esa dirección no está permitida.».',
  'help.guide.files-sync.tip.3':
    '«Desconectar», el icono junto a «Sincronizar ahora», pide confirmación una vez. Después cierra la conexión y conserva todos los documentos en los dos lados. Si vuelves a conectar una etiqueta, carpeta o espacio, TREK lo trata como nuevo y vuelve a importar todo su contenido. Así que, después de desconectar, conecta uno vacío, no el anterior.',

  // ── Screen: trip-day-detail ───────────────────────────────────────────────────────────
  'help.ctx.trip-day-detail.title': 'Detalles del día',
  'help.ctx.trip-day-detail.summary':
    'El panel que se abre sobre el mapa al hacer clic en la cabecera de un día. Muestra el día en conjunto: su nombre y su fecha, el tiempo en el lugar donde estarás, las reservas de ese día y las noches reservadas para él.',
  'help.ctx.trip-day-detail.bullet.1':
    'Haz clic en la cabecera de un día en la columna de días y el panel se abre sobre el centro del mapa. Vuelve a hacer clic en esa cabecera, o en la X de su derecha, para cerrar el panel y deseleccionar el día. Al abrir un lugar, desde la columna de lugares o desde el mapa, el panel se cierra y se muestra el lugar.',
  'help.ctx.trip-day-detail.bullet.2':
    'La cabecera muestra el nombre del día y su fecha. El lápiz junto al nombre cambia el nombre del día. La doble flecha pliega el panel en una barra estrecha para que vuelvas a ver el mapa.',
  'help.ctx.trip-day-detail.bullet.3':
    'Arriba ves el tiempo del día. «Pronóstico para» indica el lugar al que corresponde la previsión: la primera parada del día o el hotel en el que te despiertas.',
  'help.ctx.trip-day-detail.bullet.4':
    '«Reservas» muestra las reservas de ese día, cada una con su tipo, la parada a la que pertenece y sus horas. Verde significa confirmada; ámbar, pendiente; y los trayectos en transporte público son azules y no tienen estado. Un clic en una fila abre la reserva.',
  'help.ctx.trip-day-detail.bullet.5':
    '«Alojamiento» muestra todas las noches reservadas que abarcan este día, con «Registro de entrada» y «Registro de salida» en los días que corresponden, el horario de entrada, la hora de salida y el número de confirmación. Si la estancia tiene reserva, un recuadro «Reserva» debajo la indica con «Pendiente» o «Confirmado». Haz clic en él para abrir la reserva.',
  'help.ctx.trip-day-detail.bullet.6':
    '«Añadir alojamiento» añade una noche de estancia en este día: elige el alojamiento entre los lugares del viaje, indica qué días abarca y añade las horas y el código. El + de la cabecera de un día, con la descripción «Añadir al día», también tiene «Añadir alojamiento»: abre este panel con el formulario ya abierto.',
  // day-panel
  'help.guide.day-panel.title': 'Abrir un día y consultar sus detalles',
  'help.guide.day-panel.goal':
    'Consulta un día completo, con el tiempo, las reservas y dónde duermes, sin salir del mapa.',
  'help.guide.day-panel.step.1':
    'Haz clic en la cabecera de un día en la columna de días. El día queda seleccionado y sus detalles se abren sobre el centro del mapa.',
  'help.guide.day-panel.step.2':
    'La cabecera muestra el nombre del día («Día 1» hasta que le pongas uno) y, debajo, su fecha.',
  'help.guide.day-panel.step.3':
    'El tiempo del día aparece arriba. «Pronóstico para» indica a qué lugar corresponde: la primera parada del día o el hotel donde dormiste la noche anterior.',
  'help.guide.day-panel.step.4': 'Debajo, «Reservas» muestra las reservas de este día con sus horas.',
  'help.guide.day-panel.step.5':
    '«Alojamiento» muestra las noches reservadas que abarcan este día, con «Registro de entrada» y «Registro de salida» en los días que corresponden.',
  'help.guide.day-panel.step.6':
    'La doble flecha de la cabecera pliega el panel en una barra estrecha. La X de al lado cierra el panel y deselecciona el día.',
  'help.guide.day-panel.result':
    'Si pliegas el panel a su barra, el mapa queda libre y el día sigue seleccionado. Si lo cierras, el día se deselecciona y el plan se queda como estaba.',
  'help.guide.day-panel.tip.1':
    'También puedes plegar el panel haciendo clic en cualquier punto de su barra de cabecera. La flecha es solo una de las formas de hacerlo.',
  'help.guide.day-panel.tip.2':
    'Al abrir un lugar, desde la columna de lugares o desde el mapa, se cierra el panel del día y se muestran los detalles del lugar. Vuelve a hacer clic en la cabecera del día para ver de nuevo el día.',
  // day-weather
  'help.guide.day-weather.title': 'Consultar el tiempo del día',
  'help.guide.day-weather.goal': 'Consulta el tiempo del lugar donde estarás realmente ese día.',
  'help.guide.day-weather.step.1':
    '«Pronóstico para» indica el lugar al que corresponden los datos: la primera parada del día o, en un día sin paradas, el hotel en el que duermes la noche anterior.',
  'help.guide.day-weather.step.2':
    'La cifra grande es la temperatura del día. Al lado están la mínima y la máxima, y el estado del tiempo en palabras.',
  'help.guide.day-weather.step.3':
    'Las píldoras de la derecha: la probabilidad de lluvia, la cantidad, el viento más fuerte, y la salida y la puesta del sol.',
  'help.guide.day-weather.step.4':
    'Abajo del todo tienes el día hora a hora, cada dos horas: la hora, el icono, la temperatura y la probabilidad de lluvia. Las horas con más del 50 % aparecen sombreadas en azul.',
  'help.guide.day-weather.result':
    'La tarjeta del día en la columna de días también muestra el tiempo en letra pequeña bajo su número, así ves de un vistazo el tiempo de todo el viaje.',
  'help.guide.day-weather.tip.1':
    'Los grados y el viento usan la «Unidad de temperatura» de Pantalla, en Ajustes: si eliges °F Fahrenheit, la misma previsión se muestra en °F y mph.',
  'help.guide.day-weather.tip.2':
    'Un día sin ninguna parada ubicada y sin hotel la noche anterior no muestra el tiempo: la previsión siempre es para un lugar, nunca para el viaje.',
  'help.guide.day-weather.tip.3':
    'Con más de 16 días de antelación no hay previsión disponible. Los datos son entonces las medias de años anteriores para esa fecha. Aparecen marcados con Ø, y una nota debajo lo indica.',
  // rename-day
  'help.guide.rename-day.title': 'Ponerle nombre al día',
  'help.guide.rename-day.goal':
    'Ponle a un día un nombre como «Llegada a Kioto» o «Día de descanso» en lugar de «Día 5».',
  'help.guide.rename-day.step.1': 'Abre el día. En la cabecera pone «Día 5», con la fecha debajo.',
  'help.guide.rename-day.step.2': 'Haz clic en el lápiz que hay junto al nombre.',
  'help.guide.rename-day.step.3': 'El nombre pasa a ser un campo editable. Escribe el nombre que quieras.',
  'help.guide.rename-day.step.4':
    'Pulsa Intro o haz clic en otro sitio. Escape cancela el cambio. La tarjeta del día en la columna de días también muestra el nombre.',
  'help.guide.rename-day.result':
    'El nombre sustituye a «Día 5» en el panel y en la tarjeta del día de la columna de días; la fecha no cambia.',
  'help.guide.rename-day.tip.1':
    'Si vacías el campo y guardas, el día vuelve a llamarse «Día 5»: el número aparece cuando no hay nombre.',
  'help.guide.rename-day.tip.2':
    'El nombre pertenece al día, no a su fecha. Si reordenas los días, el nombre se mueve con todo lo demás de ese día.',
  // add-accommodation
  'help.guide.add-accommodation.title': 'Reservar una noche en un día',
  'help.guide.add-accommodation.goal':
    'Añade el hotel al plan una sola vez, con los días que abarca, sus horarios y su número de confirmación.',
  'help.guide.add-accommodation.step.1':
    'Primero, el alojamiento tiene que ser un lugar del viaje. Créalo en la columna de lugares como cualquier otro: el selector solo ofrece lugares que ya existen.',
  'help.guide.add-accommodation.step.2':
    'Abre el día de llegada y haz clic en «Añadir alojamiento», bajo «Alojamiento».',
  'help.guide.add-accommodation.step.3':
    '«Aplicar a los días» define qué noches abarca la estancia: «Inicio» es el día de entrada, «Fin» el de salida, y «Todos» abarca todo el viaje. La parte superior del cuadro muestra el intervalo y el número de noches.',
  'help.guide.add-accommodation.step.4':
    'Rellena «Registro de entrada», «Hasta» y «Registro de salida», y pon el número de la reserva en «Confirmación». Los cuatro campos pueden quedarse vacíos.',
  'help.guide.add-accommodation.step.5':
    'Elige el alojamiento en «Seleccionar alojamiento». «Categoría», encima de la lista, la filtra por una categoría.',
  'help.guide.add-accommodation.step.6': 'Haz clic en Guardar.',
  'help.guide.add-accommodation.result':
    'La estancia aparece en todos los días que abarca, con «Registro de entrada» el primero y «Registro de salida» el último. El alojamiento pasa a ser una parada del día de entrada, así que el mapa muestra la ruta hasta allí, y aparece una reserva de hotel en la pestaña «Reservas».',
  'help.guide.add-accommodation.tip.1':
    'El selector se abre en el día desde el que vienes, con la salida al día siguiente; puedes cambiar las dos fechas antes de guardar.',
  'help.guide.add-accommodation.tip.2':
    'Al crear el hotel, asígnale la categoría «Hotel». Así, con un clic en «Categoría», encima de la lista, verás solo tus hoteles.',
  'help.guide.add-accommodation.tip.3':
    'Todas las horas son opcionales: una estancia sin hora de entrada y sin código sigue cubriendo sus noches, y su ruta se sigue dibujando.',
  // edit-accommodation
  'help.guide.edit-accommodation.title': 'Cambiar o cancelar una noche reservada',
  'help.guide.edit-accommodation.goal': 'Mueve una estancia, corrige sus horas o quítala del plan.',
  'help.guide.edit-accommodation.step.1':
    'La tarjeta muestra el alojamiento y su dirección, «Registro de entrada» o «Registro de salida» en los días que corresponden con sus horas, el número de confirmación y, en «Reserva», la reserva asociada.',
  'help.guide.edit-accommodation.step.2':
    'El lápiz de su derecha, «Editar alojamiento», abre la estancia para editarla. La ventana emergente se titula ahora «Editar alojamiento».',
  'help.guide.edit-accommodation.step.3':
    'Corrige «Registro de entrada», «Hasta», «Registro de salida» y «Confirmación». Aquí también puedes cambiar los días de arriba y el alojamiento de abajo.',
  'help.guide.edit-accommodation.step.4': 'Haz clic en Guardar.',
  'help.guide.edit-accommodation.step.5':
    'La X junto al lápiz, Eliminar, quita la estancia. No pide confirmación, y también se elimina la reserva de hotel asociada a la estancia.',
  'help.guide.edit-accommodation.result':
    'El cambio se aplica al momento a todos los días de la estancia y a la reserva de hotel de la pestaña «Reservas».',
  'help.guide.edit-accommodation.tip.1':
    'Las noches intermedias de una estancia no llevan la etiqueta «Registro de entrada» ni «Registro de salida»: solo la tienen el primer y el último día del periodo.',
  'help.guide.edit-accommodation.tip.2':
    'Al cancelar una estancia también se eliminan la parada que añadió al día de entrada y cualquier coste vinculado a su reserva. Si ha sido un error, vuelve a reservar la noche.',
  // day-bookings
  'help.guide.day-bookings.title': 'Las reservas del día de un vistazo',
  'help.guide.day-bookings.goal':
    'Consulta en un solo sitio lo que ya está reservado para este día y si está confirmado.',
  'help.guide.day-bookings.step.1':
    '«Reservas» muestra las reservas del día: las que tienen esa fecha y las fijadas a una de sus paradas. Una reserva fijada a una parada de otro día solo aparece en esa parada.',
  'help.guide.day-bookings.step.2':
    'Cada fila muestra el tipo de reserva, su nombre y, si pertenece a una parada, esa parada en gris detrás. Sus horas aparecen en el extremo derecho, antes del punto de estado.',
  'help.guide.day-bookings.step.3':
    'El color indica el estado de una reserva: verde, confirmada; ámbar, pendiente; y los trayectos en transporte público son azules, sin estado. Los hoteles no están en esta lista: tienen su propia sección más abajo.',
  'help.guide.day-bookings.step.4':
    'Haz clic en una fila y se abre la reserva. La píldora de su cabecera la cambia entre «Pendiente» y «Confirmado», y Editar, abajo, cambia el resto. Las reservas nuevas se crean en la pestaña «Reservas», y los transportes, en la pestaña «Transportes».',
  'help.guide.day-bookings.result':
    'En esta lista está todo lo que tiene fecha ese día y todo lo vinculado a alguna de sus paradas.',
  'help.guide.day-bookings.tip.1':
    'Cada reserva aparece en el día de su fecha. Si cambias la fecha en la pestaña «Reservas» o «Transportes», la reserva pasa automáticamente al otro día.',
  'help.guide.day-bookings.tip.2':
    'Si no aparece el bloque «Reservas», es que el día no tiene reservas: se oculta en lugar de mostrarse vacío.',
  'help.guide.map-lock.title': 'Bloquear el mapa',
  'help.guide.map-lock.goal': 'Deja el mapa fijo mientras vas pasando por días y lugares.',
  'help.guide.map-lock.step.1':
    'El candado es el de arriba de los dos botones redondos de la esquina inferior izquierda del mapa; al pasar el cursor indica «Bloquear la vista del mapa». Haz clic en él. Mientras está cerrado, abrir un día o elegir un lugar ya no acerca ni desplaza el mapa, y el botón indica ahora «Dejar que el mapa siga la selección».',
  'help.guide.map-lock.result': 'El mapa se queda donde lo dejaste mientras trabajas en el plan.',
  'help.guide.map-lock.tip.1':
    'Vuelve a hacer clic en el candado, que ahora indica «Dejar que el mapa siga la selección», y el mapa volverá a seguir lo que elijas. El candado solo está en el ordenador; en el móvil, el mapa siempre sigue la selección.',

  // ── Screen: trip-map ──────────────────────────────────────────────────────────────────
  'help.ctx.trip-map.title': 'Mapa',
  'help.ctx.trip-map.summary':
    'El centro del plan: cada lugar del viaje como un marcador, cada excursión como una línea, las rutas entre ellos y, en los bordes del mapa, los botones para bloquear la vista, cambiar a satélite, ver todo el viaje de una vez y mostrar los lugares de la zona que estás mirando.',
  'help.ctx.trip-map.bullet.1':
    'Cada marcador es un lugar: muestra su foto si la tiene; si no, el color de su categoría con el icono de la categoría. Pasa el cursor por un marcador para ver una tarjeta con su imagen, su nombre y su dirección, además de su valoración y su categoría si el lugar las tiene. Arrastra un marcador a la tarjeta de un día para planificar el lugar ese día. Una estancia con la reserva aún pendiente aparece atenuada, con un anillo discontinuo.',
  'help.ctx.trip-map.bullet.2':
    'Los marcadores demasiado juntos se agrupan en un círculo oscuro con un número. Haz clic en el círculo y el mapa se acerca a los marcadores que contiene. Con «Marcadores compactos para lugares sin planificar» activado, en «Ajustes» > «Pantalla», en «Viaje y mapa», los lugares que aún no están en ningún día aparecen como puntos pequeños sin foto, para que las paradas planificadas se vean mejor.',
  'help.ctx.trip-map.bullet.3':
    'Haz clic en una chincheta para abrir el lugar en una ficha en la parte inferior del mapa, con su valoración, sus archivos y las siguientes acciones. Haz clic en una zona vacía del mapa para cerrar la ficha.',
  'help.ctx.trip-map.bullet.4':
    'Con un día abierto en la columna de días, sus paradas muestran una pequeña insignia blanca con su número en ese día. Un lugar que está dos veces en el día muestra sus dos números. Los filtros de encima de la lista de lugares («Mostrar», las categorías y la estrella de valoración mínima) también filtran los marcadores del mapa.',
  'help.ctx.trip-map.bullet.5':
    'La fila de iconos de la parte superior busca en la zona visible del mapa: «Restaurantes», Cafés, «Bares y ocio nocturno», «Alojamiento», «Lugares de interés», «Museos y cultura», «Naturaleza y parques» y «Actividades». Las categorías que añade un plugin aparecen detrás de un separador fino. Si la fila es más ancha que el mapa, la rueda del ratón la desplaza en horizontal. «Buscar en esta zona» repite la búsqueda después de mover el mapa.',
  'help.ctx.trip-map.bullet.6':
    'Haz clic con el botón derecho en cualquier punto del mapa para abrir el formulario de lugar en ese punto, con la dirección ya consultada. Abajo a la izquierda hay dos botones redondos: el candado, «Bloquear la vista del mapa», mantiene la vista del mapa mientras vas pasando por días y lugares, y el de debajo, «Cambiar a vista de satélite», sustituye el mapa dibujado por imágenes de satélite.',
  'help.ctx.trip-map.bullet.7':
    '«Mostrar todo el viaje», abajo a la derecha, dibuja todos los días de viaje a la vez y muestra lo que abarca cada día. El icono de ruta de la fila de una reserva dibuja esa reserva, y el icono de ruta de la barra de herramientas sobre los días dibuja todas las reservas. Haz clic en el extremo de una reserva dibujada para abrir sus detalles.',
  'help.ctx.trip-map.bullet.8':
    'Con el complemento de Dawarich activado, el botón redondo de Dawarich bajo «Mostrar todo el viaje» muestra la ruta que grabó realmente tu móvil. «Mostrar ruta grabada» la dibuja con una línea discontinua bajo la ruta planificada, con un color por día. Si no aparece ninguna línea, la etiqueta del botón explica por qué.',
  // map-markers
  'help.guide.map-markers.title': 'Interpretar el mapa',
  'help.guide.map-markers.goal': 'Entiende qué significa cada marcador, insignia y círculo del mapa.',
  'help.guide.map-markers.step.1':
    'El mapa muestra todos los lugares del viaje. Donde los marcadores están demasiado juntos para distinguirlos, se agrupan en un círculo oscuro con el número de marcadores que contiene. Haz clic en el círculo y el mapa se acerca a esos marcadores o, con el zoom máximo, los separa.',
  'help.guide.map-markers.step.2':
    'Un marcador muestra la foto del lugar si la tiene; si no, el color de su categoría con el icono de la categoría. Una estancia con la reserva aún pendiente aparece atenuada y con un anillo discontinuo. Al pasar el cursor por un marcador se abre a su lado una tarjeta: la misma foto, más grande, el nombre y la dirección, con la valoración y la categoría si el lugar las tiene.',
  'help.guide.map-markers.step.3':
    'Haz clic en un marcador y el lugar se abre en una tarjeta en la parte inferior del mapa: arriba la imagen, el nombre y la dirección; después las estrellas, la descripción y los archivos, incluidos los de su reserva. Abajo están las acciones: «Añadir al día» si hay un día abierto («Quitar del día» si el lugar ya está en él), «Navegación», «Abrir la web», «Guardar en colección» («Guardado» si ya está en una) y, a la derecha, la papelera y Editar. La X de arriba, o un clic en una zona vacía del mapa, la cierra.',
  'help.guide.map-markers.step.4':
    'Abre un día en la columna de días y sus paradas se numeran: la pequeña insignia blanca en la esquina de un marcador indica la posición de la parada en el día. Si un lugar aparece dos veces en el día, muestra sus dos números. Si no hay ningún día abierto, no hay números y, en su lugar, la esquina muestra la valoración del lugar, si la tiene.',
  'help.guide.map-markers.step.5':
    'Arrastra una chincheta del mapa a la tarjeta de un día en la columna de días y el lugar quedará planificado ese día, igual que si arrastraras su fila desde la lista de lugares.',
  'help.guide.map-markers.result':
    'El viaje no ha cambiado: el mapa solo lo muestra. Cada marcador indica qué lugar es, en qué día está y en qué orden.',
  'help.guide.map-markers.tip.1':
    'Al plegar un día en la columna de días, sus paradas se ocultan en el mapa. Vuelve a desplegar el día para verlas.',
  'help.guide.map-markers.tip.2':
    'Los filtros de encima de la lista de lugares también deciden lo que muestra el mapa: «Mostrar» («Sin planificar», «Planeado»), las categorías del botón de la etiqueta y la valoración mínima de la estrella reducen los marcadores. El filtro de país solo afecta a la lista.',
  'help.guide.map-markers.tip.3':
    'Este mapa no tiene botones de zoom: la rueda del ratón acerca y aleja, un doble clic acerca un nivel y arrastrar el mapa lo desplaza.',
  // map-nearby-places
  'help.guide.map-nearby-places.title': 'Buscar lugares cercanos en el mapa',
  'help.guide.map-nearby-places.goal':
    'Busca restaurantes, lugares de interés o un hotel en la zona de la ciudad que muestra el mapa, y añade uno al viaje.',
  'help.guide.map-nearby-places.step.1':
    'La fila de iconos de la parte superior del mapa es la búsqueda por categorías: «Restaurantes», Cafés, «Bares y ocio nocturno», «Alojamiento», «Lugares de interés», «Museos y cultura», «Naturaleza y parques» y «Actividades». Las categorías que añade un plugin aparecen detrás de un separador fino; pasa el cursor por un icono para ver su nombre.',
  'help.guide.map-nearby-places.step.2':
    'Haz clic en una categoría. TREK busca ese tipo de lugar en la zona visible del mapa y pone un marcador del color de la categoría por cada resultado. Solo puede haber una categoría a la vez: si haces clic en otra, sustituye a la anterior, y si haces clic en la activa, se desactiva.',
  'help.guide.map-nearby-places.step.3':
    'Al mover el mapa, aparece un segundo botón bajo la fila: «Buscar en esta zona» repite la búsqueda en la nueva vista. Mover el mapa no lanza una búsqueda nueva por sí solo, para que haya menos peticiones.',
  'help.guide.map-nearby-places.step.4':
    'Mantén el cursor sobre un marcador para ver el nombre de lo que ha encontrado la búsqueda. Haz clic en el marcador y se abre el formulario del lugar con sus datos ya rellenados: el nombre arriba del cuadro, «Dirección», «Latitud» y «Longitud», y la web y el teléfono si la búsqueda los encontró.',
  'help.guide.map-nearby-places.step.5':
    'Comprueba lo que se ha rellenado y añade lo que la búsqueda no podía saber. La píldora de categoría bajo el nombre ya está elegida si el viaje tiene una categoría que coincide, como restaurante para un restaurante; si no, indica «Sin categoría» hasta que elijas una. Añade una «Descripción» y tus propias notas.',
  'help.guide.map-nearby-places.step.6':
    'Haz clic en Añadir. Si el viaje ya tiene un lugar con el mismo nombre o en el mismo punto, TREK te avisa y el botón cambia a «Añadir de todos modos».',
  'help.guide.map-nearby-places.result':
    'El lugar está en la lista de lugares y en el mapa como un marcador más del viaje, en «Sin planificar» hasta que lo pongas en un día. Los marcadores de la búsqueda siguen ahí hasta que desactives la categoría.',
  'help.guide.map-nearby-places.tip.1':
    'La fila se oculta si «Explorar lugares en el mapa» está desactivado en «Ajustes» > «Pantalla», en «Viaje y mapa».',
  'help.guide.map-nearby-places.tip.2':
    'Los resultados proceden del índice de lugares de TREK y de OpenStreetMap, así que es una de las pocas cosas del plan que necesitan conexión.',
  'help.guide.map-nearby-places.tip.3':
    'Cada búsqueda abarca solo la zona visible, así que acerca el zoom a la calle que te interesa. Una búsqueda en toda una ciudad solo devuelve los sesenta primeros resultados, sin un orden claro.',
  // map-add-place
  'help.guide.map-add-place.title': 'Crear un lugar con un clic derecho en el mapa',
  'help.guide.map-add-place.goal': 'Coloca un lugar exactamente donde quieras, sin tener que buscarlo antes.',
  'help.guide.map-add-place.step.1':
    'Haz clic derecho en el punto del mapa. Se abre el formulario del lugar con el título «Añadir lugar/actividad».',
  'help.guide.map-add-place.step.2':
    'Latitud y Longitud ya tienen ese punto. TREK busca las coordenadas y rellena Dirección con lo que encuentra allí. Si la búsqueda da con un nombre, TREK también lo pone en la parte superior del diálogo. Todavía no se ha guardado nada, así que corrige lo que no esté bien.',
  'help.guide.map-add-place.step.3':
    'Escribe un nombre que reconozcas en el campo de la parte superior del cuadro. Elige una categoría en la píldora de debajo, que indica «Sin categoría» hasta que elijas una. Después añade los demás datos para el plan: «Descripción», «Notas», «Sitio web».',
  'help.guide.map-add-place.step.4':
    'Haz clic en Añadir. El lugar se añade a la lista como sin planificar, aunque haya un día abierto: el clic con el botón derecho en el mapa fija la ubicación, no el día.',
  'help.guide.map-add-place.result':
    'El lugar está en la lista y en el mapa, en «Sin planificar» hasta que lo pongas en un día.',
  'help.guide.map-add-place.tip.1':
    'La dirección se obtiene a partir de las coordenadas, así que puede mostrar una calle en lugar de un nombre, y en campo abierto puede quedar vacía. Puedes sobrescribir los dos campos.',
  'help.guide.map-add-place.tip.2':
    'En los mapas MapLibre GL y Mapbox GL también funciona el clic con el botón central y, en pantallas táctiles, una pulsación larga.',
  // map-satellite
  'help.guide.map-satellite.title': 'Cambiar a vista satélite',
  'help.guide.map-satellite.goal': 'Cambia del mapa a las imágenes aéreas y vuelve.',
  'help.guide.map-satellite.step.1':
    'El selector de capa base es el de abajo de los dos botones redondos de la esquina inferior izquierda del mapa, bajo el candado. Su icono muestra siempre la capa a la que cambia, y la descripción emergente lo indica: «Cambiar a vista de satélite». Haz clic en él.',
  'help.guide.map-satellite.step.2':
    'El mapa muestra ahora imágenes aéreas, con detalle suficiente para distinguir edificios, y sin necesidad de una clave propia. Todo lo que dibuja TREK sigue encima: los marcadores, la ruta del día, los tracks y las rutas de las reservas.',
  'help.guide.map-satellite.step.3':
    'Ahora el botón indica «Cambiar a vista de mapa». Haz clic en él para volver a la vista de mapa.',
  'help.guide.map-satellite.result': 'El mapa se vuelve a dibujar, y la capa elegida se guarda en tu cuenta.',
  'help.guide.map-satellite.tip.1':
    'La elección se guarda en tu cuenta, no en el viaje, así que todos los viajes se abren como los dejaste, uses el motor de mapas que uses.',
  'help.guide.map-satellite.tip.2':
    'Las imágenes de satélite no tienen rótulos: los nombres de las calles, los barrios y los números de portal solo están en el mapa normal, así que vuelve a él cuando busques una dirección.',
  // map-whole-trip
  'help.guide.map-whole-trip.title': 'Ver todo el viaje y sus distancias',
  'help.guide.map-whole-trip.goal':
    'Muestra todos los días del viaje en lugar de solo el día abierto, y consulta cuánto recorres cada día.',
  'help.guide.map-whole-trip.step.1':
    'El botón redondo «Mostrar todo el viaje» está abajo a la derecha del mapa. Haz clic en él y se dibujan a la vez todos los días del viaje, cada uno con su color, para que puedas distinguir los días contiguos.',
  'help.guide.map-whole-trip.step.2':
    'La tarjeta que hay sobre el botón muestra esos días: un punto de color, el nombre del día, un icono por cada medio de transporte que usas ese día y la distancia recorrida. Arriba del todo está la «Distancia total».',
  'help.guide.map-whole-trip.step.3':
    'Haz clic en un día de la ficha para seleccionarlo: su fila se sombrea y el día se abre en la columna de días. Gira la rueda del ratón sobre una ciudad para acercarte. Los días que pasan por esa ciudad se muestran uno al lado del otro, cada uno en su color.',
  'help.guide.map-whole-trip.step.4':
    'El botón pasa a decir «Ocultar todo el viaje». Haz clic en él para volver a ver solo el día abierto.',
  'help.guide.map-whole-trip.result':
    'Cada día de viaje aparece con su propio color, y la tarjeta muestra lo que abarca cada día y el total del viaje.',
  'help.guide.map-whole-trip.tip.1':
    'El total se calcula unos pocos tramos cada vez. Mientras aparezca … detrás, la cifra es solo una suma parcial. Es definitiva cuando se han calculado todos los tramos.',
  'help.guide.map-whole-trip.tip.2':
    'Si el calculador no puede calcular un tramo, este se queda como línea recta y no se cuenta. La tarjeta te lo indica, para que el total no parezca más bajo sin avisar.',
  'help.guide.map-whole-trip.tip.3':
    'Un día con menos de dos paradas ubicadas y sin trayecto en coche hacia o desde su hotel no tiene ruta que dibujar, así que no aparece en la tarjeta.',
  // map-booking-routes
  'help.guide.map-booking-routes.title': 'Mostrar la ruta de una reserva en el mapa',
  'help.guide.map-booking-routes.goal':
    'Muestra en el mapa los vuelos, trenes y trayectos en coche que tienes reservados, y vuelve a ocultarlos.',
  'help.guide.map-booking-routes.step.1':
    'Las rutas de las reservas están desactivadas hasta que actives alguna. En el extremo derecho de la fila de un transporte, en la columna de días, hay un pequeño icono de ruta: «Mostrar rutas de reservas».',
  'help.guide.map-booking-routes.step.2':
    'Haz clic y la reserva aparece en el mapa: un vuelo como un arco de círculo máximo, un trayecto en coche por las carreteras reales y un tren como la sucesión de sus estaciones. «Confirmado» se dibuja con línea continua y «Pendiente» con línea discontinua, y los extremos de la ruta son píldoras azules con el icono del transporte.',
  'help.guide.map-booking-routes.step.3':
    'Haz clic en una píldora de un extremo y se abren los detalles de la reserva: el estado, el tipo y los días como píldoras en la cabecera de color, las horas de los dos extremos, el resto de datos debajo y, al pie, «En el mapa», que vuelve a desactivar esta ruta, «Cambiar ruta» en una conexión de transporte público, la papelera que elimina la reserva, y Editar. La X de la cabecera cierra los detalles.',
  'help.guide.map-booking-routes.step.4':
    'El icono de ruta de la barra de herramientas encima de los días actúa sobre todo el viaje a la vez: «Mostrar todas las rutas de reservas» dibuja todas las reservas que tienen ruta.',
  'help.guide.map-booking-routes.step.5':
    'Esto sustituye lo que hubieras elegido antes, así que se restablecen las rutas que activaste reserva por reserva. Vuelve a pulsarlo, ahora con el texto «Ocultar todas las rutas de reservas», para ocultarlas todas.',
  'help.guide.map-booking-routes.result':
    'Las reservas que has pedido aparecen en el mapa, y la elección se mantiene para este viaje en este navegador hasta que la cambies.',
  'help.guide.map-booking-routes.tip.1':
    'Los extremos solo muestran el código del aeropuerto o el nombre de la estación si «Etiquetas de rutas de reservas» está activado en «Ajustes» > «Pantalla», en «Viaje y mapa»; si no, solo muestran el icono.',
  'help.guide.map-booking-routes.tip.2':
    '«Mostrar siempre las rutas de reserva», en la misma sección, las muestra desde el principio en todos los viajes en los que aún no lo hayas configurado tú.',
  'help.guide.map-booking-routes.tip.3':
    'Para dibujar una reserva hace falta un origen y un destino con coordenadas, por eso un hotel o un restaurante no tienen icono de ruta.',
  // map-dawarich-trail
  'help.guide.map-dawarich-trail.title': 'Mostrar la ruta que recorriste realmente',
  'help.guide.map-dawarich-trail.goal':
    'Muestra en el mapa la ruta que Dawarich grabó en tu móvil, como línea discontinua junto a la ruta planificada, y descubre día a día cómo fue el viaje en realidad.',
  'help.guide.map-dawarich-trail.step.1':
    'El botón redondo de Dawarich está abajo a la derecha del mapa, bajo «Mostrar todo el viaje». Al pasar el cursor por encima, indica «Mostrar ruta grabada». Haz clic en él. TREK pide a tu Dawarich los datos de las fechas del viaje, y un anillo gira alrededor del botón mientras espera la respuesta.',
  'help.guide.map-dawarich-trail.step.2':
    'La ruta grabada aparece como una línea discontinua, con un color por día, por debajo de la ruta planificada para que el plan se siga leyendo bien. El botón indica ahora «Ocultar ruta grabada». Cada día termina a medianoche, hora local. Al plegar un día en la columna de días, su línea discontinua y sus paradas se ocultan en el mapa.',
  'help.guide.map-dawarich-trail.step.3':
    'Haz clic también en «Mostrar todo el viaje», y cada día planificado se dibuja con línea continua junto a la grabación discontinua. Donde las dos líneas coinciden, el día fue según lo previsto. Donde la línea discontinua se aparta de la ruta planificada, no.',
  'help.guide.map-dawarich-trail.result':
    'Lo que planificaste y lo que hiciste realmente se muestran juntos en el mapa, con líneas discontinuas y continuas. La tarjeta encima de los botones sigue mostrando los días planificados y sus distancias.',
  'help.guide.map-dawarich-trail.tip.1':
    'Si está activada o no se guarda por viaje en tu cuenta, así que es igual en todos los navegadores y dispositivos. Mientras la ruta está activada, TREK vuelve a consultar a Dawarich cada dos minutos, de modo que un viaje en curso se actualiza sin recargar la página. La ruta en sí nunca se guarda: no está en la base de datos de TREK, ni en las copias de seguridad, ni disponible sin conexión.',
  'help.guide.map-dawarich-trail.tip.2':
    'El texto del botón te dice por qué el mapa está vacío: «Cargando la ruta grabada…» mientras se carga, «No se grabó nada en estas fechas», «No se pudo cargar la ruta grabada» o «La ruta grabada necesita conexión» cuando TREK está sin conexión.',
  // map-compass
  'help.guide.map-compass.title': 'Girar el mapa y volver a orientarlo al norte',
  'help.guide.map-compass.goal':
    'Gira el mapa hacia la dirección en la que vas, y vuelve a orientarlo al norte con un clic.',
  'help.guide.map-compass.step.1':
    'Gira el mapa arrastrando con el botón derecho, o mantén pulsado Ctrl y arrastra con el izquierdo; en una pantalla táctil, gira con dos dedos. La brújula redonda, junto a la fila de iconos de categorías en la parte superior del mapa, gira con él: su flecha siempre apunta al norte, así que se inclina el mismo ángulo que el mapa.',
  'help.guide.map-compass.step.2':
    'Haz clic en la brújula. El botón, llamado «Orientar al norte», vuelve a poner el norte arriba, deja la vista plana de nuevo y la flecha vuelve a apuntar hacia arriba.',
  'help.guide.map-compass.result':
    'El mapa vuelve a apuntar al norte y a estar plano. No ha cambiado nada del viaje: la brújula solo cambia la vista.',
  'help.guide.map-compass.tip.1':
    'La brújula solo existe en los mapas MapLibre GL y Mapbox GL; el mapa de Leaflet no se puede girar, así que no tiene brújula. El mapa que usas se elige en «Proveedor de mapa», en «Ajustes» > «Mapa», y se guarda con «Guardar mapa».',
  'help.guide.map-compass.tip.2':
    'El clic también quita la inclinación. Arrastra hacia arriba o hacia abajo con el botón derecho del ratón para inclinar la vista; «Reset north» la endereza y restablece la rotación. En Mapbox GL con «Edificios 3D y terreno» activado, también aplana la vista 3D hasta que vuelvas a inclinarla.',

  // ── Screen: trip-collab ───────────────────────────────────────────────────────────────
  'help.ctx.trip-collab.title': 'Colaboración',
  'help.ctx.trip-collab.summary':
    'La pestaña en la que el grupo planifica en común, en cinco tarjetas: el chat a la izquierda, «Notas» y «Enlaces» al lado, y «Encuestas» y «Qué viene ahora» debajo. Todo lo que se escribe aquí aparece al momento en la pantalla de los demás miembros, sin recargar.',
  'help.ctx.trip-collab.bullet.1':
    'El chat es la tarjeta de la izquierda. Escribe en «Escribe un mensaje...» y pulsa Intro; Mayús e Intro hacen un salto de línea. El emoticono añade un emoji, y «Adjuntar imágenes» añade hasta cuatro imágenes al mensaje.',
  'help.ctx.trip-collab.bullet.2':
    'Pasa el ratón por encima de un mensaje para ver «Responder» y, en tus mensajes, «Eliminar»; con el clic derecho tienes las ocho reacciones rápidas. Un mensaje eliminado se sustituye por un aviso que dice quién lo eliminó.',
  'help.ctx.trip-collab.bullet.3':
    '«Notas» es el espacio de notas compartidas: «Nueva nota», en su cabecera, crea una nota, y el engranaje de al lado abre «Gestionar categorías» para sus nombres y colores. Cuando hay categorías, una fila de píldoras bajo la cabecera filtra las tarjetas: «Todos» o una categoría. Cada tarjeta de nota muestra su categoría como un punto de color y su enlace como un botón redondo, y sus tres puntos («Más opciones») incluyen «Expandir», «Fijar», Editar y Eliminar.',
  'help.ctx.trip-collab.bullet.4':
    '«Enlaces» reúne las direcciones web del viaje. «Añadir enlace» pide un título y una dirección http o https. «Editar enlace», «Fijar enlace» y «Eliminar enlace» están al final de la etiqueta, y los enlaces fijados se quedan al principio.',
  'help.ctx.trip-collab.bullet.5':
    'Usa las encuestas para tomar decisiones. «Nueva encuesta» plantea una pregunta con al menos dos opciones. Haz clic en una opción para votarla. El candado (Cerrar) y la papelera (Eliminar), a la derecha de la cabecera de una encuesta, terminan la votación o eliminan la encuesta.',
  'help.ctx.trip-collab.bullet.6':
    '«Qué viene ahora» muestra las paradas del viaje que aún quedan por delante, hasta ocho, con sus horas y las personas que van. Solo lee el plan del día; las horas se definen ahí.',
  // write-note
  'help.guide.write-note.title': 'Escribir una nota compartida',
  'help.guide.write-note.goal':
    'Deja lo que necesita todo el grupo, como una norma, una dirección o un recordatorio, donde todos puedan encontrarlo.',
  'help.guide.write-note.step.1':
    'Haz clic en «Nueva nota» en la cabecera de la tarjeta «Notas». Se abre el cuadro de la nota, con el cursor ya en el campo del título.',
  'help.guide.write-note.step.2':
    'Escribe el título donde pone «Título de la nota», arriba del diálogo. Es el único campo obligatorio: «Crear» sigue en gris hasta que el título tiene texto, y al pulsar Intro en el título la nota se crea al momento.',
  'help.guide.write-note.step.3':
    '«Contenido» guarda el texto y admite Markdown: una palabra en negrita, una lista, un título. La tarjeta muestra las tres primeras líneas, y «Expandir», en su menú, abre la nota completa.',
  'help.guide.write-note.step.4':
    'En «Categoría», elige la categoría de la nota. Su color se usa ahora en la cabecera del cuadro y después en la de la tarjeta. La primera categoría ya viene seleccionada. Las píldoras son las categorías que ya existen; para crear una nueva, ve a «Gestionar categorías». Mientras el viaje no tenga categorías, esta fila no aparece.',
  'help.guide.write-note.step.5':
    'En «Sitio web» puedes poner un enlace relacionado con la nota. La tarjeta muestra entonces arriba un botón redondo de enlace que lo abre.',
  'help.guide.write-note.step.6':
    'Haz clic en Crear. Solo Cancelar y su cruz cierran el cuadro, así que un clic fuera o Esc no te hacen perder lo que has escrito.',
  'help.guide.write-note.result':
    'La nota es una tarjeta en el panel «Notas», con la parte superior del color de su categoría, y los demás miembros la ven al momento.',
  'help.guide.write-note.tip.1':
    'Los tres puntos de una tarjeta («Más opciones») abren «Expandir», «Fijar», Editar y Eliminar. «Fijar» mantiene la nota arriba del panel, con un marco de su color. Las demás notas se ordenan por la fecha de su último cambio.',
  'help.guide.write-note.tip.2':
    'El engranaje junto a «Nueva nota» abre «Gestionar categorías». Ahí puedes dar color a una categoría, cambiarle el nombre en todas partes a la vez o crearla antes de que la use ninguna nota. No cambia nada hasta que haces clic en Guardar.',
  'help.guide.write-note.tip.3':
    '«Adjuntar archivos» añade un documento a la nota, si tienes permiso para subir archivos al viaje. «Adjuntar» abre el selector de archivos, y también puedes pegar una imagen o un PDF en el cuadro.',
  'help.guide.write-note.tip.4':
    '«Notas» tiene su propio interruptor en «Complementos», debajo de «Colaboración»: un administrador puede desactivarlas y mantener el chat, los enlaces, las encuestas y «What’s Next».',
  // shared-links
  'help.guide.shared-links.title': 'Reunir los enlaces del viaje',
  'help.guide.shared-links.goal':
    'Ten el portal de reservas, el álbum compartido y los horarios en un solo sitio, sin tener que buscarlos en el chat.',
  'help.guide.shared-links.step.1':
    'Haz clic en «Añadir enlace» en la cabecera de la tarjeta «Enlaces». El cuadro se abre con el cursor en el campo de arriba.',
  'help.guide.shared-links.step.2':
    'Escribe el nombre en «Título del enlace», pega la dirección en «Enlace», debajo, y haz clic en «Guardar enlace».',
  'help.guide.shared-links.step.3':
    'La etiqueta muestra el nombre y la web a la que enlaza. Haz clic en ella para abrir la página en una pestaña nueva.',
  'help.guide.shared-links.step.4':
    'Los tres botones redondos del final son «Editar enlace», «Fijar enlace» y «Eliminar enlace». «Fijar enlace» pasa la etiqueta al principio del panel y la muestra con tu color de acento. «Eliminar enlace» pide confirmación antes, porque el enlace se elimina para todos los miembros.',
  'help.guide.shared-links.result':
    'El enlace aparece como etiqueta en el panel «Enlaces», fijado al principio, y se ve al instante en la pantalla de todos los miembros.',
  'help.guide.shared-links.tip.1':
    'Solo se aceptan direcciones http o https. Cualquier otra se rechaza y el diálogo sigue abierto con lo que escribiste.',
  'help.guide.shared-links.tip.2':
    'Primero van los enlaces fijados y después los más recientes. El pequeño icono junto a un título es el favicon del propio sitio, que se carga desde ese sitio, así que sin internet la etiqueta muestra en su lugar un icono de enlace sencillo.',
  'help.guide.shared-links.tip.3':
    '«Enlaces» tiene su propio interruptor en «Complementos», bajo «Colaboración», así que un administrador puede desactivar el panel sin tocar el resto de la pestaña.',
  // create-poll
  'help.guide.create-poll.title': 'Preguntar al grupo',
  'help.guide.create-poll.goal':
    'Convierte una pregunta que nadie responde en el chat en una encuesta en la que todos pueden votar.',
  'help.guide.create-poll.step.1':
    'Haz clic en «Nueva encuesta» en la cabecera de la tarjeta «Encuestas». Se abre el cuadro.',
  'help.guide.create-poll.step.2':
    'Escribe la pregunta en «Pregunta». El aviso «Compatible con Markdown» debajo del cuadro significa que aquí puedes usar negrita, saltos de línea o listas cortas.',
  'help.guide.create-poll.step.3':
    'Rellena «Opción 1» y «Opción 2» en «Opciones». Necesitas al menos dos opciones que no estén vacías, y cada opción puede tener varias líneas.',
  'help.guide.create-poll.step.4':
    '«Añadir opción», debajo, añade una tercera, una cuarta, todas las que necesites. La pequeña cruz junto a una fila, que aparece cuando hay más de dos, elimina esa opción.',
  'help.guide.create-poll.step.5':
    '«Selección múltiple» permite que cada persona marque más de una opción. Si está desactivada, cuando alguien elige otra opción, su voto pasa a la nueva.',
  'help.guide.create-poll.step.6': 'Haz clic en «Crear encuesta».',
  'help.guide.create-poll.result':
    'La encuesta aparece arriba del panel «Encuestas», abierta, con 0 votos en su cabecera.',
  'help.guide.create-poll.tip.1':
    'La pregunta se muestra como Markdown; las opciones se quedan como texto sin formato.',
  'help.guide.create-poll.tip.2':
    '«Crear encuesta» sigue en gris hasta que haya una pregunta y al menos dos opciones con texto.',
  'help.guide.create-poll.tip.3':
    'La fecha límite solo se puede poner desde la app del móvil. Una encuesta con fecha límite muestra el tiempo restante en una etiqueta ámbar en su cabecera y se cierra cuando se acaba el tiempo.',
  'help.guide.create-poll.tip.4':
    'Encuestas tiene su propio interruptor en Complementos, debajo de Colaboración: un administrador puede desactivarlo y mantener activos los otros cuatro paneles.',
  // vote-poll
  'help.guide.vote-poll.title': 'Votar y ver el resultado',
  'help.guide.vote-poll.goal': 'Vota, consulta los resultados del grupo y cambia tu voto.',
  'help.guide.vote-poll.step.1':
    'Haz clic en la opción que quieras. Su círculo muestra una marca, la opción recibe un marco de tu color de acento y la barra de detrás crece.',
  'help.guide.vote-poll.step.2':
    'Ahora ves todo el resultado: la barra muestra la proporción, el porcentaje está a la derecha y los pequeños círculos son las personas que eligieron esa opción, hasta tres.',
  'help.guide.vote-poll.step.3':
    '¿Has cambiado de opinión? Haz clic en otra opción. En una encuesta sin «Selección múltiple», tu voto pasa a la nueva opción en lugar de sumarse un segundo voto.',
  'help.guide.vote-poll.step.4':
    'El número de votos aparece en una etiqueta bajo la pregunta. Si haces clic en la opción que ya elegiste, se quita tu voto y el contador baja.',
  'help.guide.vote-poll.result':
    'Tu opción queda marcada, las barras muestran cómo ha votado el grupo y los círculos indican quién ha elegido cada opción.',
  'help.guide.vote-poll.tip.1':
    'Los porcentajes y quién votó qué solo aparecen después de que hayas votado, o cuando la encuesta está cerrada. El número de votos de la cabecera lo ve todo el mundo.',
  'help.guide.vote-poll.tip.2':
    'Los votos nunca son anónimos: pasa el cursor por uno de los círculos de una opción para ver quién votó.',
  // close-poll
  'help.guide.close-poll.title': 'Cerrar o eliminar una encuesta',
  'help.guide.close-poll.goal':
    'Cierra la votación cuando el grupo ya ha decidido y elimina las encuestas que ya no hacen falta.',
  'help.guide.close-poll.step.1':
    '«Cerrar», el candado a la derecha de la cabecera de la encuesta, termina la votación. Ya no se puede hacer clic en las opciones.',
  'help.guide.close-poll.step.2':
    'Una encuesta cerrada pasa al final del panel, bajo el título «Cerrada» si hay encuestas abiertas encima. Lleva la etiqueta «Cerrada» y muestra el resultado a todos, hayan votado o no. La opción ganadora aparece en negrita sobre una barra verde; si es la que elegiste tú, la barra usa tu color de acento.',
  'help.guide.close-poll.step.3':
    '«Eliminar», la papelera a la derecha de la cabecera, elimina la encuesta. En una encuesta cerrada es el único botón, porque el candado ya no está. No se pide confirmación y los votos también se eliminan.',
  'help.guide.close-poll.result':
    'Una encuesta eliminada desaparece del panel de todos los miembros. Una encuesta que solo has cerrado sigue visible abajo, con su resultado.',
  'help.guide.close-poll.tip.1':
    'Cerrar no se puede deshacer: no hay forma de reabrir. Si una encuesta se cierra por error, hay que volver a crearla.',
  'help.guide.close-poll.tip.2':
    'Eliminar borra la encuesta y todos sus votos para todos, al momento y sin pedir confirmación.',
  // whats-next
  'help.guide.whats-next.title': 'Consultar «Qué viene ahora»',
  'help.guide.whats-next.goal': 'Consulta qué va a hacer el grupo a continuación sin abrir el plan.',
  'help.guide.whats-next.step.1':
    'La tarjeta muestra las próximas paradas del viaje, hasta ocho, en orden horario y agrupadas por día: «Hoy», «Mañana» o la fecha, con el título del día al lado si lo tiene. La cabecera indica cuántas hay.',
  'help.guide.whats-next.step.2':
    'A la izquierda de cada parada aparece su hora: el inicio, «hasta» y el fin si la parada lo tiene, o «TBD» si todavía no tiene hora.',
  'help.guide.whats-next.step.3':
    'Al lado aparecen el nombre, la dirección y, como etiquetas, las personas de esa parada. Si no hay nadie asignado a la parada, aparecen todos los miembros del viaje.',
  'help.guide.whats-next.result':
    'Una lista de lo que viene, solo para consultar: sigue el plan, y nada de lo que hay aquí lo modifica.',
  'help.guide.whats-next.tip.1':
    'Aquí no se configura nada. Las horas proceden del plan del día; si las cambias ahí, esta lista se actualiza al momento.',
  'help.guide.whats-next.tip.2':
    'Solo aparece lo que queda por delante: una parada desaparece de la lista cuando pasa su hora de inicio, una parada de hoy sin hora se mantiene hasta que acaba el día, y al terminar un viaje el panel se queda vacío.',
  'help.guide.whats-next.tip.3':
    '«Qué viene ahora» tiene su propio interruptor en «Complementos», bajo «Colaboración». Es un panel de escritorio: la pestaña «Colaboración» de la aplicación móvil no lo muestra.',
  // trip-chat
  'help.guide.trip-chat.title': 'Hablar con el grupo',
  'help.guide.trip-chat.goal': 'Envía un mensaje, responde a un mensaje concreto, reacciona a otro y elimina uno tuyo.',
  'help.guide.trip-chat.step.1':
    'Escribe en «Escribe un mensaje...» y pulsa Intro. La flecha redonda junto al cuadro hace lo mismo. Con Mayús e Intro, en cambio, creas una línea nueva.',
  'help.guide.trip-chat.step.2':
    'La carita abre el selector de emojis, con Caritas, Reacciones y Viaje. El emoji que eliges se añade al texto que estás escribiendo. No se envía solo.',
  'help.guide.trip-chat.step.3':
    'Pasa el cursor por el mensaje de otra persona: aparece un pequeño botón redondo en su esquina. Es «Responder».',
  'help.guide.trip-chat.step.4':
    'El mensaje al que respondes aparece citado encima del cuadro. Escribe y envía tu mensaje, y la cita se envía con él. Haz clic en la cruz de la cita para quitarla.',
  'help.guide.trip-chat.step.5':
    'Haz clic con el botón derecho en un mensaje para ver las ocho reacciones rápidas. Tu reacción aparece bajo el mensaje. Vuelve a hacer clic en la misma reacción para quitarla.',
  'help.guide.trip-chat.step.6':
    'Tus propios mensajes tienen Eliminar, el icono de la papelera, junto a «Responder». Elimina el mensaje al momento, y una nota indica que lo has eliminado. No se puede deshacer.',
  'help.guide.trip-chat.result':
    'Tu respuesta es el mensaje más reciente, con el mensaje citado en la parte de arriba. Tu reacción aparece debajo del otro mensaje. Donde estaba el mensaje que eliminaste, un aviso indica que lo eliminaste tú.',
  'help.guide.trip-chat.tip.1':
    'Intro envía; Mayús e Intro crean una línea nueva. Los mensajes de solo uno a tres emojis se muestran en grande.',
  'help.guide.trip-chat.tip.2':
    'Con «Adjuntar imágenes» puedes añadir hasta cuatro imágenes a un mensaje. También puedes pegarlas o arrastrarlas al cuadro de texto.',
  'help.guide.trip-chat.tip.3':
    'Un mensaje con un enlace muestra debajo una tarjeta de vista previa que obtiene tu propio TREK, así que un enlace a algo a lo que solo tú tienes acceso se queda como enlace normal.',
  'help.guide.trip-chat.tip.4':
    'El chat tiene su propio interruptor en «Complementos», bajo «Colaboración»: un administrador puede desactivarlo y mantener activados las notas, los enlaces, las encuestas y «Qué viene ahora».',

  // ── Screen: trip-lists ────────────────────────────────────────────────────────────────
  'help.ctx.trip-lists.title': 'Listas',
  'help.ctx.trip-lists.summary':
    'Dos listas para cada viaje: la lista de equipaje, con quién lleva qué y cuánto pesa, y la lista de tareas con todo lo que hay que hacer antes y durante el viaje. La pestaña aparece mientras el complemento Listas esté activado.',
  'help.ctx.trip-lists.bullet.1':
    '«Lista de equipaje» y «Por hacer», en la barra superior, cambian entre las dos y cuentan lo que hay en cada una; los botones del extremo derecho de la barra pertenecen a la que esté abierta.',
  'help.ctx.trip-lists.bullet.2':
    'La lista de equipaje se organiza en listas, por ejemplo «Documentos» o «Ropa», con el nombre que quieras. Cada lista es una tarjeta. Su cabecera tiene un asa para arrastrar la lista entera a otra posición, un punto de color, una insignia de guardados sobre el total, tres puntos con «Renombrar», «Marcar todo», «Desmarcar todo» y «Eliminar lista», y una flecha que pliega la tarjeta. «Añadir lista», en la barra de arriba, crea una nueva.',
  'help.ctx.trip-lists.bullet.3':
    'Cada fila tiene un asa para arrastrar, una casilla y un nombre, y después un pequeño avatar de la persona que lleva el artículo. Si un artículo tiene una cantidad mayor que uno, también tiene un contador de guardados, como 3/10, con un menos y un más. Después vienen la cantidad en una pequeña insignia y, con «Seguimiento de equipaje» activado, el peso en gramos y un círculo de bolsa; luego la papelera y un menú de tres puntos con «Mover a lista», «Compartiendo», «Renombrar» y Eliminar. Los controles que una fila no usa aparecen atenuados hasta que pasas el cursor por encima.',
  'help.ctx.trip-lists.bullet.4':
    '«Compartida» y «Mi lista» dividen la lista de equipaje en dos: la lista que ven todos y la tuya. «Todos», «Pendientes» y «Listo», a su lado, filtran la que esté abierta. «A a Z», al final de la fila, ordena los artículos de cada lista por nombre, y con otro clic se vuelve a tu orden. La tarjeta de progreso de arriba cuenta lo que ya está guardado.',
  'help.ctx.trip-lists.bullet.5':
    '«Aplicar plantilla» y «Guardar como plantilla» rellenan una lista o la guardan, para que no tengas que escribirla. Los dos iconos que hay después, Exportar e Importar, exportan la lista para imprimir, en PDF o como archivo, e importan una lista. El botón rojo del extremo derecho de la tarjeta de progreso indica cuántos artículos están marcados y los quita.',
  'help.ctx.trip-lists.bullet.6':
    '«Por hacer» tiene su propia barra lateral: la tarjeta de progreso, los filtros «Todos», «Mis tareas», «Vencida» y «Listo», una fila por lista y, debajo, «Añadir lista». Las tareas están en una tarjeta. Su cabecera muestra el nombre del filtro y el orden, «Prioridad» o «Fecha límite». Haz clic en una tarea para abrirla en el panel de la derecha. «Nueva tarea», en la barra, abre el cuadro «Nueva tarea».',
  // packing-categories
  'help.guide.packing-categories.title': 'Crear la lista de equipaje',
  'help.guide.packing-categories.goal':
    'Organiza en listas lo que te llevas, añádeles artículos y elige quién se encarga de cada lista.',
  'help.guide.packing-categories.step.1':
    'Haz clic en «Añadir lista», en la barra que hay encima de las listas. Se abre un pequeño diálogo. Escribe el nombre en la franja superior, donde pone «Nombre de la lista (p. ej. Ropa)», y haz clic en «Añadir».',
  'help.guide.packing-categories.step.2':
    'La lista nueva empieza con una fila provisional que solo muestra tres puntos tenues. Haz clic en «Añadir artículo», en la parte inferior de la fila, escribe el artículo en «Nombre del artículo...» y pulsa Intro: el primer artículo sustituye a la fila provisional y el campo sigue abierto para el siguiente.',
  'help.guide.packing-categories.step.3':
    'Cambia el nombre de una fila haciendo clic en él, o con «Renombrar» en los tres puntos de su extremo derecho.',
  'help.guide.packing-categories.step.4':
    'El círculo discontinuo con una persona, en la franja superior de la lista, asigna miembros del viaje a la lista. Elige un nombre. Para quitar a esa persona, haz clic en la etiqueta que aparece.',
  'help.guide.packing-categories.step.5':
    'Los tres puntos junto al recuento abren más opciones: «Renombrar», «Marcar todo», «Desmarcar todo» y «Eliminar lista». «Eliminar lista» borra la lista y todos sus artículos sin volver a preguntar. La flecha del extremo derecho pliega la lista.',
  'help.guide.packing-categories.result':
    'La nueva lista aparece en la cuadrícula con sus artículos debajo y su punto de color, y su insignia cuenta lo que ya está guardado.',
  'help.guide.packing-categories.tip.1':
    'Una lista solo existe a través de sus artículos. Si eliminas el último, la fila se convierte en un marcador de posición para que la lista mantenga su sitio y su color; si eliminas también esa fila, se elimina la lista.',
  'help.guide.packing-categories.tip.2':
    'Cuando asignas a alguien a una lista, recibe una notificación de equipaje. Esto no cambia quién puede ver los artículos: eso se define en «Compartiendo», en el menú de tres puntos de cada fila.',
  'help.guide.packing-categories.tip.3':
    'Dos listas pueden tener el mismo nombre. TREK las distingue internamente, así que los nombres se quedan tal como los escribiste.',
  // check-off-packing
  'help.guide.check-off-packing.title': 'Marcar lo que vas guardando',
  'help.guide.check-off-packing.goal':
    'Marca lo que ya está en la bolsa, sigue la barra de progreso y quita los artículos guardados.',
  'help.guide.check-off-packing.step.1':
    'Haz clic en la casilla a la izquierda de una fila. El nombre aparece tachado y la barra de progreso se actualiza.',
  'help.guide.check-off-packing.step.2':
    'La tarjeta de progreso encima de las listas muestra cuántos artículos están guardados del total de la lista, como número, como porcentaje y como barra.',
  'help.guide.check-off-packing.step.3':
    'Para marcar una lista entera de una vez, abre los tres puntos de su cabecera: ahí tienes «Marcar todo» y «Desmarcar todo».',
  'help.guide.check-off-packing.step.4':
    '«Todos», «Pendientes» y «Listo», junto a «Compartida» y «Mi lista», filtran la cuadrícula. «Pendientes» muestra solo lo que aún falta, así que las listas ya completas se ocultan.',
  'help.guide.check-off-packing.step.5':
    'El botón rojo «Quitar … marcados», en el extremo derecho de la tarjeta de progreso, con el número de artículos marcados, los elimina todos a la vez tras una confirmación del navegador.',
  'help.guide.check-off-packing.result':
    'Solo aparecen los artículos pendientes, y la barra de arriba muestra cuánto equipaje tienes ya listo.',
  'help.guide.check-off-packing.tip.1': 'Un artículo marcado se puede seguir renombrando: haz clic en su nombre.',
  'help.guide.check-off-packing.tip.2':
    '«Marcar todo» y «Desmarcar todo» actúan sobre una lista cada vez, desde los tres puntos de esa lista.',
  'help.guide.check-off-packing.tip.3':
    'Cuando todos los artículos están marcados, el contador se sustituye por «¡Todo preparado!» y la barra se pone verde.',
  // apply-packing-template
  'help.guide.apply-packing-template.title': 'Aplicar una plantilla de equipaje',
  'help.guide.apply-packing-template.goal':
    'Añade al viaje una lista ya preparada y guarda la de este viaje para el próximo.',
  'help.guide.apply-packing-template.step.1':
    'Haz clic en «Aplicar plantilla», en la barra que hay encima de la lista.',
  'help.guide.apply-packing-template.step.2':
    'Elige una plantilla. Cada línea muestra su nombre y cuántos artículos tiene.',
  'help.guide.apply-packing-template.step.3':
    'Los artículos se añaden a la vista en la que estás: «Compartida» los añade a la lista compartida que ven todos, y «Mi lista», a tu propia lista.',
  'help.guide.apply-packing-template.step.4':
    'Para conservar la lista de este viaje para el próximo, haz clic en «Guardar como plantilla». Se abre un pequeño cuadro. Escribe un nombre en el campo de arriba, donde pone «Nombre de la plantilla», y haz clic en Guardar.',
  'help.guide.apply-packing-template.result':
    'Las listas y los artículos de la plantilla se añaden al viaje, junto a lo que ya había.',
  'help.guide.apply-packing-template.tip.1':
    'Una plantilla copia la lista, la cantidad, el peso y la bolsa de cada artículo, y crea las bolsas que el viaje aún no tenga. Las marcas no se copian, y no se quita nada de lo que ya hay en la lista.',
  'help.guide.apply-packing-template.tip.2':
    '«Aplicar plantilla» solo aparece cuando existe alguna plantilla. Si no hay ninguna, el botón no aparece.',
  'help.guide.apply-packing-template.tip.3':
    '«Guardar como plantilla» solo lo ve un administrador de la instancia, y solo cuando la lista tiene artículos. Guarda los artículos compartidos y los tuyos, nunca los artículos privados de otros miembros.',
  // import-packing-list
  'help.guide.import-packing-list.title': 'Pegar una lista de equipaje completa',
  'help.guide.import-packing-list.goal':
    'Convierte de una vez en artículos de equipaje una lista que ya tienes en otro sitio.',
  'help.guide.import-packing-list.step.1':
    'Haz clic en Importar, el icono de la flecha hacia abajo en el extremo derecho de la barra encima de la lista.',
  'help.guide.import-packing-list.step.2':
    'Un artículo por línea: categoría, nombre, peso en g (opcional), bolsa (opcional), checked/unchecked (opcional). El ejemplo gris del recuadro muestra los cuatro formatos, y los números del borde izquierdo cuentan las líneas que escribes. También vale una lista en Markdown: un título da nombre a la lista, y "- [ ]" y "- [x]" se convierten en artículos.',
  'help.guide.import-packing-list.step.3':
    'O carga las líneas desde un archivo con «Cargar CSV/TXT/MD», abajo a la izquierda del cuadro. Admite archivos .csv, .txt o .md y sustituye lo que haya en el recuadro.',
  'help.guide.import-packing-list.step.4':
    'Haz clic en «Importar 3», abajo a la derecha; el número indica las líneas que TREK ha entendido.',
  'help.guide.import-packing-list.result':
    'Cada línea se convierte en una fila, dentro de la lista indicada en su primer campo. Los artículos que ya había no cambian.',
  'help.guide.import-packing-list.tip.1':
    'Las comas, los puntos y comas y los tabuladores separan los campos, y las comillas dobles mantienen un campo unido, así que "Camisa, azul" sigue siendo un solo nombre. Una línea con un único valor es solo un nombre. Las líneas sin lista propia van a «Otros». "3x" delante de un nombre indica la cantidad.',
  'help.guide.import-packing-list.tip.2':
    'Si el viaje aún no tiene la bolsa indicada en el cuarto campo, TREK la crea. «Importar» y «Aplicar plantilla» son las dos formas de añadir pesos y bolsas a muchos artículos a la vez.',
  // export-packing-list
  'help.guide.export-packing-list.title': 'Imprimir o exportar la lista de equipaje',
  'help.guide.export-packing-list.goal':
    'Imprime la lista, guárdala como PDF o expórtala como archivo para otra aplicación o para el próximo viaje.',
  'help.guide.export-packing-list.step.1':
    'Haz clic en Exportar, el icono de la flecha hacia arriba en la barra encima de la lista, justo antes de Importar.',
  'help.guide.export-packing-list.step.2':
    '«Lista de verificación en Markdown (.md)» y «CSV para importar (.csv)» guardan la lista como archivo al momento.',
  'help.guide.export-packing-list.step.3':
    'Haz clic en «Imprimir o guardar como PDF». La vista previa muestra la lista como una página: arriba el viaje, sus fechas y cuánto está guardado, y después cada lista como una tarjeta, con una casilla para marcar en cada artículo.',
  'help.guide.export-packing-list.step.4':
    'Haz clic en «Imprimir o guardar como PDF», debajo de la vista previa. El navegador abre el diálogo de impresión: elige una impresora, o «Guardar como PDF» para guardar un archivo.',
  'help.guide.export-packing-list.result':
    'La impresión y los archivos incluyen la vista que tengas abierta, «Compartida» o «Mi lista», con las cantidades, los pesos y las marcas.',
  'help.guide.export-packing-list.tip.1':
    'El CSV tiene el formato que lee Importar, con las bolsas incluidas, así que puedes usarlo como plantilla de equipaje propia: impórtalo en tu próximo viaje.',
  'help.guide.export-packing-list.tip.2':
    'El archivo Markdown se abre como lista de tareas en Obsidian, Notion o GitHub, y puedes volver a importarlo con Importar.',
  // share-packing-item
  'help.guide.share-packing-item.title': 'Decidir quién ve un artículo y quién lo lleva',
  'help.guide.share-packing-item.goal':
    'Mueve un artículo entre la lista común del grupo, tu propia lista y las personas para las que lo llevas.',
  'help.guide.share-packing-item.step.1':
    'Encima de las listas, «Compartida» es la lista que ven todos y «Mi lista», la tuya. Cada una indica cuántos artículos tiene. Haz clic en «Mi lista» para ver la tuya.',
  'help.guide.share-packing-item.step.2':
    'De vuelta en «Compartida», abre los tres puntos al final de una fila y haz clic en «Compartiendo».',
  'help.guide.share-packing-item.step.3':
    'Hay tres niveles: «Compartida», visible para todo el grupo; «Personal», que solo ves tú; y «Compartir con…», donde eliges para quién es el artículo.',
  'help.guide.share-packing-item.step.4':
    'Un artículo Personal solo está en «Mi lista». Cambia a «Mi lista» para encontrarlo.',
  'help.guide.share-packing-item.step.5':
    'Vuelve a abrir «Compartiendo» y marca un nombre en «Compartir con…». El artículo aparece también en la lista de esa persona, y la fila muestra una pequeña insignia con el número de personas con las que se comparte.',
  'help.guide.share-packing-item.result':
    'El artículo está en el nivel que elegiste, y la fila muestra quién lo lleva.',
  'help.guide.share-packing-item.tip.1':
    'Solo la persona que lleva un artículo puede cambiar con quién se comparte. Quien lo tenga compartido lo ve en su propia «Mi lista» con una pequeña insignia de una mano, que muestra tu nombre al pasar el cursor. Puede marcarlo.',
  'help.guide.share-packing-item.tip.2':
    'En un artículo compartido que lleva otra persona, el menú de tres puntos muestra otras dos opciones en lugar de «Compartiendo»: «Yo también puedo llevarlo», que te añade junto a esa persona, y «Copiar a mi lista», que crea una copia privada para ti.',
  'help.guide.share-packing-item.tip.3':
    'Los artículos nuevos toman la forma de compartir de la vista en la que los añades. Los añadidos en «Compartida» se comparten con todos. Los añadidos en «Mi lista» son personales, salvo que todos los artículos de esa lista estén compartidos con las mismas personas: entonces el nuevo artículo también se comparte con ellas.',
  // packing-bags
  'help.guide.packing-bags.title': 'Pesar el equipaje',
  'help.guide.packing-bags.goal':
    'Añade un peso a cada artículo, reparte los artículos en bolsas y mantén cada bolsa dentro del límite de la aerolínea.',
  'help.guide.packing-bags.step.1':
    'Haz clic en la etiqueta de peso que hay delante del círculo y escribe el peso del artículo en gramos.',
  'help.guide.packing-bags.step.2': 'El círculo después del peso es la bolsa del artículo. Haz clic en él.',
  'help.guide.packing-bags.step.3':
    'Si aún no hay ninguna bolsa, haz clic en «Añadir equipaje», escribe un nombre y pulsa Intro. Se crea la bolsa y el artículo se mete en ella.',
  'help.guide.packing-bags.step.4':
    'La tarjeta «Equipaje» aparece a la derecha de las listas en cuanto hay una bolsa. Cada bolsa muestra su nombre, quién la lleva, una barra de llenado, cuántos artículos contiene y su peso. Debajo de las bolsas aparecen «Sin asignar» y «Peso total» y, debajo, «Preparados»: el peso ya guardado y una barra fina con su proporción.',
  'help.guide.packing-bags.step.5':
    'Haz clic en «Definir límite», junto al peso de la bolsa, y escribe el límite en kilos, como lo indican las aerolíneas.',
  'help.guide.packing-bags.step.6':
    'El más discontinuo al final de la línea del nombre de la bolsa, justo antes de la cruz, abre «Asignar miembros». Marca los miembros que llevan la bolsa: aparecen junto al más, y «Por persona», al pie de la tarjeta, muestra lo que lleva cada uno.',
  'help.guide.packing-bags.result':
    'La tarjeta «Equipaje» de la derecha muestra el peso de cada bolsa frente a su límite, lo que no está en ninguna bolsa, lo que lleva cada persona y el total, con la parte que ya está guardada.',
  'help.guide.packing-bags.tip.1':
    'El campo de peso, el círculo de la bolsa y la tarjeta «Equipaje» solo existen si un administrador ha activado «Seguimiento de equipaje» en el complemento «Listas». En una ventana más estrecha, las bolsas se abren desde el botón «Equipaje», encima de la tarjeta de progreso.',
  'help.guide.packing-bags.tip.2':
    'El servidor calcula el peso de cada bolsa con los artículos de todos los miembros, incluidos los que tú no ves, así que la cifra es el peso real de la bolsa.',
  'help.guide.packing-bags.tip.3':
    'Una bolsa sin límite se compara con la bolsa más pesada para que puedas comparar las barras. Si le pones un límite, su barra se mide con ese límite.',
  // create-todo
  'help.guide.create-todo.title': 'Añadir una tarea',
  'help.guide.create-todo.goal': 'Apunta una tarea, con una lista, una prioridad, una fecha y una persona asignada.',
  'help.guide.create-todo.step.1': 'Haz clic en «Nueva tarea», en el extremo derecho de la barra.',
  'help.guide.create-todo.step.2':
    'Se abre el cuadro «Nueva tarea» con el cursor en la parte superior. Escribe el nombre en el campo «Nombre de la tarea» y añade en «Descripción» lo que quieras recordar.',
  'help.guide.create-todo.step.3':
    '«Lista» agrupa la tarea. Elige una, o usa el más de al lado para crear una nueva en un pequeño cuadro.',
  'help.guide.create-todo.step.4': '«Prioridad» tiene cuatro botones: «Ninguno», «P1», «P2» y «P3», del rojo al azul.',
  'help.guide.create-todo.step.5':
    '«Fecha límite», junto a «Lista», abre un calendario, y «Asignado a» asigna la tarea a una persona.',
  'help.guide.create-todo.step.6': 'Haz clic en «Crear tarea».',
  'help.guide.create-todo.result':
    'La tarea aparece en la lista con la prioridad, la fecha límite y la lista como insignias y el avatar de la persona asignada al final de la fila, y se abre en el panel de la derecha.',
  'help.guide.create-todo.tip.1':
    'Solo el nombre es obligatorio. Todo lo demás puedes rellenarlo después desde el panel de la derecha.',
  'help.guide.create-todo.tip.2':
    'Si hay una lista seleccionada en la barra lateral, la nueva tarea empieza en esa lista.',
  'help.guide.create-todo.tip.3':
    'Pulsar Intro en el campo del nombre crea la tarea al momento, sin tocar los demás campos.',
  // todo-filters
  'help.guide.todo-filters.title': 'Buscar y cambiar una tarea',
  'help.guide.todo-filters.goal': 'Muestra solo las tareas importantes ahora y edita la que buscabas.',
  'help.guide.todo-filters.step.1':
    'Tareas, en la barra lateral: Todos muestra todo lo pendiente, «Mis tareas» lo que tienes asignado, Vencida las tareas con una fecha ya pasada y Listo las tareas terminadas. Cada filtro muestra su número. Haz clic en Vencida.',
  'help.guide.todo-filters.step.2':
    'En «Listas» hay una fila por lista. Elige una para ver esa lista, incluidas las tareas terminadas.',
  'help.guide.todo-filters.step.3':
    'La ordenación de la parte superior de la lista cambia el orden de lo que se ve: «Prioridad» pone primero P1, y «Fecha límite», el plazo más próximo. Solo puedes usar una de las dos a la vez, y con otro clic vuelves a tu propio orden.',
  'help.guide.todo-filters.step.4': 'Haz clic en una tarea para abrirla en el panel de la derecha.',
  'help.guide.todo-filters.step.5':
    'Cambia lo que necesites: el nombre, «Prioridad», «Lista», «Fecha límite» o «Asignado a». «Descripción» muestra su texto con enlaces que funcionan; haz clic dentro para editarlo. Después haz clic en «Guardar cambios», al pie del panel. La casilla de la cabecera del panel marca la tarea como hecha, y Eliminar, junto a «Guardar cambios», la borra al momento.',
  'help.guide.todo-filters.result':
    'La lista muestra solo las tareas que pediste, y el panel de la derecha edita la que elegiste.',
  'help.guide.todo-filters.tip.1':
    'Cada lista cuenta solo las tareas pendientes, pero al seleccionarla también ves las terminadas. «Todos», «Mis tareas» y «Vencida» ocultan las tareas terminadas; «Listo» muestra solo las terminadas.',
  'help.guide.todo-filters.tip.2':
    'En la ordenación, «Prioridad» y «Fecha límite» no se pueden usar a la vez. Mientras una de las dos esté activa, no puedes arrastrar las filas para ordenarlas a tu manera.',

  // ── Screen: trip-bookings ─────────────────────────────────────────────────────────────
  'help.ctx.trip-bookings.title': 'Reservas',
  'help.ctx.trip-bookings.summary':
    'Esta pestaña recoge todo lo reservado para el viaje salvo el transporte: alojamientos, mesas, entradas, visitas guiadas y aparcamientos. Cada reserva es una tarjeta, una fila de lista o una barra en la cronología, con su código, sus documentos, sus viajeros y su coste. Haz clic en una reserva para ver sus detalles.',
  'help.ctx.trip-bookings.bullet.1':
    '«Reserva manual», en el extremo derecho de la barra, abre «Nueva reserva». Permite crear seis tipos de reservas: «Alojamiento», «Restaurante», «Evento», «Excursión», «Aparcamiento» y «Otros». Los vuelos, trenes y demás transportes están en la pestaña «Transportes» y nunca aparecen aquí.',
  'help.ctx.trip-bookings.bullet.2':
    'El icono de descarga delante de «Reserva manual», «Importar confirmaciones de reserva», sube confirmaciones para que TREK las lea automáticamente: EML, PDF, PKPass, HTML o TXT, hasta cinco archivos de 10 MB como máximo, y fotos si el modelo de IA puede leer imágenes. El icono solo aparece si el servidor puede leerlas.',
  'help.ctx.trip-bookings.bullet.3':
    'La búsqueda busca en títulos, tipos, lugares, notas, códigos de reserva y viajeros. «Filtrar», el embudo de al lado, filtra la pestaña por «Estado», por «Tipo», con un recuento para cada uno, y por «Viajeros» en cuanto alguna reserva indica personas. Un número en el embudo indica cuántos filtros hay activos.',
  'help.ctx.trip-bookings.bullet.4':
    'Los tres iconos que hay después de «Filtrar» cambian la vista: «Tarjetas», «Lista» y «Cronología». «Opciones de vista», los controles deslizantes de al lado, agrupa y ordena las tarjetas y la lista o define los carriles de la cronología, y el icono de hoja de cálculo que hay después, «Exportar como hoja de cálculo (CSV)», descarga en un archivo lo que muestra la pestaña. De forma predeterminada, las tarjetas se agrupan en «Confirmado» y «Pendiente», y la lista, por día. Haz clic en el título de una sección para plegarla.',
  'help.ctx.trip-bookings.bullet.5':
    'Cada tarjeta tiene una cabecera del color de su estado, con el punto de estado (al hacer clic cambia entre «Pendiente» y «Confirmado»), el tipo, el título, el lápiz y la papelera. Debajo aparecen los datos que tenga la reserva: «Fecha», «Fecha y hora», «Código de reserva», «Registro de entrada» y «Registro de salida», «Ubicación / dirección», «Alojamiento», «Vinculado a» (la parada del plan), «Enlace», «Notas», «Viajeros», «Archivos» y los gastos vinculados.',
  'help.ctx.trip-bookings.bullet.6':
    'Un clic en una tarjeta, una fila o una barra abre el detalle de la reserva, con «En el mapa» (si la reserva tiene un lugar), la papelera y Editar al pie. Al eliminar se pregunta una vez («¿Eliminar reserva?», que avisa si también se borran costes). Después se eliminan la reserva y sus gastos vinculados y, si es un alojamiento, sus noches se quitan del plan del día.',
  // booking-views
  'help.guide.booking-views.title': 'Cambiar de vista y abrir una reserva',
  'help.guide.booking-views.goal':
    'Ve las reservas como tarjetas, en lista o en una cronología, y abre una para ver todos sus detalles.',
  'help.guide.booking-views.step.1':
    'Los tres iconos que hay después de «Filtrar» en la barra son las vistas, y cada uno muestra su nombre al pasar el cursor: «Tarjetas», «Lista» y «Cronología». La pestaña se abre en «Tarjetas», con una tarjeta por reserva en las secciones «Confirmado» y «Pendiente». Haz clic en «Lista», el del medio.',
  'help.guide.booking-views.step.2':
    '«Lista» muestra una fila por reserva bajo un título por día, con el día y la hora a la derecha; las teclas de flecha pasan de una fila a otra. Haz clic en «Cronología», el último de los tres.',
  'help.guide.booking-views.step.3':
    '«Cronología» muestra las reservas a lo largo de los días del viaje: un carril por tipo y una barra desde el inicio hasta el final de cada una. Una reserva pendiente tiene el borde discontinuo. «Viaje» ajusta todo el viaje al ancho; haz clic en el título de un día para ver ese día por horas.',
  'help.guide.booking-views.step.4':
    '«Día» muestra un día en una escala horaria, y la longitud de cada barra indica su duración. Las flechas junto al nombre del día pasan al día anterior y al siguiente. Mientras el viaje está en curso, «Hoy» salta al día actual, y el selector «Viaje» y «Día» de la derecha vuelve a todo el viaje.',
  'help.guide.booking-views.step.5':
    'Pasa el cursor por una barra para ver su día, sus horas y su lugar, y haz clic en ella para abrir el detalle de la reserva. Una tarjeta en «Tarjetas» y una fila en «Lista» abren la misma ventana emergente.',
  'help.guide.booking-views.step.6':
    'La cabecera de la vista de detalle muestra el título y etiquetas para el estado (al hacer clic lo cambias), el tipo, el día y el código de reserva, con un botón para copiarlo. Debajo están las horas en recuadros y, después, el lugar, los viajeros, las notas, los gastos y los archivos, si la reserva los tiene. Abajo del todo, «En el mapa», la papelera y «Editar».',
  'help.guide.booking-views.result':
    'La reserva se abre en su vista de detalle: «Editar» abre su formulario, «En el mapa» la muestra en el plan, y «Cerrar» o Escape te devuelven a la vista anterior.',
  'help.guide.booking-views.tip.1':
    '«Opciones de vista», el icono de controles deslizantes que hay después de los iconos de vista, te permite agrupar y ordenar Tarjetas y Lista con «Agrupar por» y «Ordenar por». En Cronología ofrece «Una fila por tipo» y «Mostrar la otra pestaña». «Mostrar la otra pestaña» muestra arriba, atenuadas y en una fila estrecha, las entradas de la pestaña Transportes. «Restablecer vista» vuelve a los valores predeterminados, y cada pestaña recuerda su vista en este navegador.',
  'help.guide.booking-views.tip.2':
    'Una reserva anterior o posterior al viaje, o sin fecha, no puede aparecer en la cronología. Se muestra debajo del gráfico como una pequeña tarjeta en «Antes del viaje», «Después del viaje» o «Sin fecha».',
  'help.guide.booking-views.tip.3':
    'Se abre el mismo detalle allí donde aparezca una reserva: en la pestaña «Transportes», en el plan del día, en los detalles de un día y en los de un lugar. Un clic en su título permite cambiar el nombre de la reserva.',
  // create-booking
  'help.guide.create-booking.title': 'Crear una reserva',
  'help.guide.create-booking.goal':
    'Añade a mano al viaje un restaurante, un evento, una visita guiada, una plaza de aparcamiento o cualquier otra cosa.',
  'help.guide.create-booking.step.1':
    'Haz clic en «Reserva manual», en el extremo derecho de la barra. Se abre «Nueva reserva», con el título y dos etiquetas en una cabecera arriba del todo.',
  'help.guide.create-booking.step.2':
    'Haz clic en la etiqueta del tipo, en la franja superior, que en una reserva nueva pone «Otros», y elige el «Tipo de reserva». Desde esta pestaña se crean seis tipos: «Alojamiento», «Restaurante», «Evento», «Excursión», «Aparcamiento» y «Otros». El formulario cambia según lo que elijas: solo «Alojamiento» usa un rango de días en lugar de fechas.',
  'help.guide.create-booking.step.3':
    'Escribe el título en la franja superior, el campo que hay encima de las etiquetas. Es el único campo obligatorio, y Añadir sigue en gris hasta que escribas algo.',
  'help.guide.create-booking.step.4':
    'Indica la «Fecha» y la «Hora de inicio», y la «Fecha fin» y la «Hora de fin» si la reserva tiene final. Los calendarios solo ofrecen días dentro del viaje. Una fecha y hora de fin que no sean posteriores al inicio aparecen en rojo y bloquean Añadir. Una hora de fin anterior a la de inicio sin fecha de fin solo muestra un aviso: si la reserva termina al día siguiente, indica una fecha de fin.',
  'help.guide.create-booking.step.5':
    'Introduce el «Código de reserva» de la confirmación y haz clic en la píldora de estado de la cabecera, junto al tipo. En una reserva nueva indica «Pendiente» y cambia a «Confirmado». El estado decide en qué sección aparece la tarjeta.',
  'help.guide.create-booking.step.6': 'Haz clic en Añadir, al pie del formulario.',
  'help.guide.create-booking.result':
    'La reserva aparece como tarjeta en su sección. El color de su cabecera indica su estado, y la tarjeta muestra su tipo, su fecha y horas y su código. Los demás participantes del viaje la ven al momento.',
  'help.guide.create-booking.tip.1':
    '«Ubicación / dirección» te sugiere direcciones reales mientras escribes; si eliges una, sustituye lo que escribiste, y una dirección que escribas tú se conserva tal cual.',
  'help.guide.create-booking.tip.2':
    'En «Enlace», pon la página de la reserva en la web del proveedor. La tarjeta y la vista de detalle la muestran como un enlace que se abre en una pestaña nueva.',
  'help.guide.create-booking.tip.3':
    'Las notas admiten Markdown, así que una lista o una línea en negrita se ven como tales en la tarjeta y en la vista de detalle.',
  // booking-hotel
  'help.guide.booking-hotel.title': 'Reservar un alojamiento',
  'help.guide.booking-hotel.goal':
    'Añade un alojamiento para que cuente a la vez como reserva y como noches en el plan del día.',
  'help.guide.booking-hotel.step.1':
    'Haz clic en «Reserva manual» y elige «Alojamiento» con la píldora de tipo de la franja superior. Los campos de fecha se sustituyen por un bloque de campos de hotel.',
  'help.guide.booking-hotel.step.2':
    'Elige el hotel en «Alojamiento». La lista contiene los lugares del viaje, sin tracks importados ni excursiones. Al elegir uno, su nombre se usa como título si está vacío, y su dirección pasa a «Ubicación / dirección».',
  'help.guide.booking-hotel.step.3':
    'Indica «Desde» y «Hasta»: la primera noche y la mañana en que te vas. Los dos ofrecen los días del viaje con sus fechas, y TREK mantiene «Hasta» después de «Desde».',
  'help.guide.booking-hotel.step.4':
    'Rellena «Registro de entrada», «Check-in hasta» y «Registro de salida», y el «Código de reserva» de la confirmación.',
  'help.guide.booking-hotel.step.5': 'Haz clic en «Añadir».',
  'help.guide.booking-hotel.result':
    'La tarjeta muestra el rango de días en «Fecha», las horas de entrada y salida, y la dirección. La estancia también aparece ahora en esos días del plan.',
  'help.guide.booking-hotel.tip.1':
    'Alojamiento es el único tipo sin Fecha ni «Hora de inicio». Sus fechas son De y A, y en ellas eliges días del viaje, no fechas del calendario.',
  'help.guide.booking-hotel.tip.2':
    'Deja «Alojamiento» vacío y escribe la dirección: el lugar se busca, se crea y se marca en el mapa automáticamente.',
  'help.guide.booking-hotel.tip.3': 'Al eliminar la reserva, sus noches también se quitan del plan del día.',
  // link-booking
  'help.guide.link-booking.title': 'Vincular una reserva al plan',
  'help.guide.link-booking.goal': 'Vincula una reserva a su parada y a su lugar para que aparezca donde la necesitas.',
  'help.guide.link-booking.step.1':
    'Pasa el ratón por encima de la tarjeta que quieres vincular y haz clic en el lápiz de su cabecera. Se abre «Editar reserva».',
  'help.guide.link-booking.step.2':
    'Abre «Vincular a una asignación del día». La lista muestra tu plan: un encabezado por día y, debajo, las paradas de ese día, numeradas y con sus horas. Elige la parada a la que pertenece la reserva.',
  'help.guide.link-booking.step.3':
    '«Lugar / Actividad» vincula el propio lugar. Elígelo ahí, y el título y «Ubicación / dirección» se rellenan si están vacíos.',
  'help.guide.link-booking.step.4': 'Haz clic en Actualizar.',
  'help.guide.link-booking.result':
    'La tarjeta muestra el día y la parada en «Vinculado a», y la reserva aparece con esa parada en el plan del día.',
  'help.guide.link-booking.tip.1':
    '«Sin vínculo (independiente)», arriba de la lista, quita el vínculo. Un alojamiento no tiene selector de parada: se vincula a través de sus noches.',
  'help.guide.link-booking.tip.2':
    'Al elegir una parada en un día con fecha, se rellena la «Fecha» si estaba vacía. Una fecha que ya habías puesto no cambia.',
  // booking-travelers
  'help.guide.booking-travelers.title': 'Indicar para quién es una reserva',
  'help.guide.booking-travelers.goal': 'Indica para qué viajeros es una reserva y muestra luego solo sus reservas.',
  'help.guide.booking-travelers.step.1':
    'Abre la reserva con el lápiz de su tarjeta. Viajeros está junto a «Código de reserva». Mientras no haya nadie asignado a la reserva, muestra «Asignar viajeros».',
  'help.guide.booking-travelers.step.2':
    'Haz clic y elige las personas para las que es la reserva; los invitados con nombre también aparecen en la lista. Las personas elegidas reciben una marca y su avatar aparece en el campo. Vuelve a hacer clic en el nombre para quitarlas.',
  'help.guide.booking-travelers.step.3': 'Haz clic en Actualizar.',
  'help.guide.booking-travelers.step.4':
    'Haz clic en «Filtrar» en la barra: en «Viajeros», haz clic en una persona para ver solo sus reservas. Puedes activar varias a la vez.',
  'help.guide.booking-travelers.result':
    'La tarjeta muestra las personas para las que es la reserva, y «Filtrar» limita la pestaña a las reservas de las personas que elijas.',
  'help.guide.booking-travelers.tip.1':
    'En la tarjeta y en la vista de detalle, los viajeros solo se muestran; no puedes cambiarlos ahí. Se eligen aquí, en el formulario.',
  'help.guide.booking-travelers.tip.2':
    '«Viajeros» aparece en «Filtrar» cuando el viaje tiene más de un miembro y al menos una reserva tiene asignada a alguien. Tu elección se mantiene hasta que cierres la pestaña del navegador.',
  // booking-files
  'help.guide.booking-files.title': 'Guardar el bono junto a la reserva',
  'help.guide.booking-files.goal': 'Adjunta la confirmación, el billete o el pase a la reserva correspondiente.',
  'help.guide.booking-files.step.1':
    'Abre la reserva con el lápiz de su tarjeta. «Archivos» está junto a «Enlace»; haz clic ahí en «Adjuntar archivo». En una reserva que ya existe, el documento se sube al momento y TREK muestra «Archivo subido».',
  'help.guide.booking-files.step.2': 'El documento aparece con su nombre, con un botón para abrirlo y una X al lado.',
  'help.guide.booking-files.step.3':
    '«Vincular archivo existente» ofrece los documentos del viaje que aún no están en esta reserva. Elige uno y se adjunta sin volver a subirlo.',
  'help.guide.booking-files.step.4': 'Haz clic en «Actualizar».',
  'help.guide.booking-files.result':
    'La tarjeta y la vista de detalles muestran los documentos en «Archivos». Haz clic en un documento para abrirlo. «Mostrar en archivos», encima de la lista en la vista de detalles, te lleva a la pestaña «Archivos».',
  'help.guide.booking-files.tip.1':
    'Si la reserva aún se está creando, el documento se sube al hacer clic en Añadir. Para subirlo necesitas conexión.',
  'help.guide.booking-files.tip.2':
    'La X junto a un documento quita el vínculo, no el documento. El documento sigue en la pestaña «Archivos» del viaje.',
  'help.guide.booking-files.tip.3':
    'El administrador decide qué tipos de archivo se pueden adjuntar en «Tipos de archivo permitidos». Por defecto se permiten documentos, texto e imágenes.',
  // booking-cost
  'help.guide.booking-cost.title': 'Convertir el precio de una reserva en un coste',
  'help.guide.booking-cost.goal':
    'Añade el coste de una reserva a «Costes», repartido entre las personas que lo pagan.',
  'help.guide.booking-cost.step.1':
    'Abre la reserva con el lápiz de su tarjeta y baja hasta el final del formulario. En «Costes» encontrarás «Crear gasto» y «Vincular gasto existente», con la nota «Guarda la reserva y luego abre el editor de gastos».',
  'help.guide.booking-cost.step.2':
    'Haz clic en «Crear gasto». La reserva se guarda, su formulario se cierra y se abre el editor de costes como «Añadir gasto».',
  'help.guide.booking-cost.step.3':
    'El nombre de la cabecera ya es el título de la reserva, y «Día» ya es el día de la reserva. Introduce el «Importe total» y comprueba la «Moneda» de al lado.',
  'help.guide.booking-cost.step.4':
    'La etiqueta de la cabecera es la «Categoría», ya ajustada a la que corresponde al tipo de reserva. En «¿Quién pagó?» elige quién ha pagado y, en «Dividir», cómo se reparte el importe.',
  'help.guide.booking-cost.step.5': 'Haz clic en «Añadir gasto».',
  'help.guide.booking-cost.result':
    'La tarjeta muestra el importe abajo, el formulario de la reserva incluye el gasto en «Gastos vinculados», y el mismo gasto aparece en la pestaña Costes, vinculado a esta reserva.',
  'help.guide.booking-cost.tip.1':
    'La categoría depende del tipo: «Restaurante» pasa a «Comida y bebida», «Alojamiento» a «Alojamiento», «Aparcamiento» a «Aparcamiento», y «Evento» y «Excursión» pasan ambos a «Otros».',
  'help.guide.booking-cost.tip.2':
    'Una reserva puede tener varios gastos. «Vincular gasto existente» ofrece los gastos de «Costes» que aún no están vinculados a nada. En un gasto vinculado, «Desvincular, conservar el gasto» quita el vínculo y mantiene el gasto en «Costes», mientras que la papelera lo elimina.',
  'help.guide.booking-cost.tip.3':
    '«Costes» solo aparece en el formulario si el complemento «Costes» está activado; el administrador lo activa en «Complementos».',
  // filter-bookings
  'help.guide.filter-bookings.title': 'Buscar una reserva',
  'help.guide.filter-bookings.goal': 'Filtra una pestaña larga por palabra, estado, tipo o persona.',
  'help.guide.filter-bookings.step.1':
    'Escribe en «Buscar», en la barra. Busca en títulos, tipos, lugares y direcciones, notas, códigos de reserva y nombres de los viajeros, y los resultados se van filtrando mientras escribes. Pulsa Escape para borrar el campo.',
  'help.guide.filter-bookings.step.2':
    'Haz clic en Filtrar, el embudo junto a la búsqueda. El panel incluye Estado, Tipo y, en cuanto una reserva tiene personas asignadas, Viajeros.',
  'help.guide.filter-bookings.step.3':
    'En «Estado», elige «Confirmado» o «Pendiente» para ver solo esas; «Todos» muestra ambas.',
  'help.guide.filter-bookings.step.4':
    'En «Tipo», haz clic en uno o varios tipos para ver solo esos. Cada tipo muestra cuántas reservas tiene, y una marca indica los seleccionados.',
  'help.guide.filter-bookings.step.5':
    'Un número en «Filtrar» indica cuántos filtros hay activos, y una etiqueta junto a la búsqueda indica cuántas reservas quedan del total. Haz clic en la etiqueta, o en «Restablecer filtros» al pie del panel, para volver a verlo todo.',
  'help.guide.filter-bookings.result':
    'La pestaña muestra solo lo que elegiste, tanto en «Tarjetas» como en «Lista» y «Cronología», y los filtros se mantienen para este viaje hasta que cierres la pestaña del navegador.',
  'help.guide.filter-bookings.tip.1':
    '«Tipo» solo aparece si la pestaña tiene más de un tipo, y solo muestra los tipos que hay en ella. Así que, si no hay ninguna excursión, «Tipo» no tiene la opción «Excursión».',
  'help.guide.filter-bookings.tip.2':
    'Si nada coincide con el filtro, la pestaña muestra «Nada coincide con estos filtros», con «Restablecer filtros» justo debajo.',
  // import-booking-file
  'help.guide.import-booking-file.title': 'Importar una reserva desde su confirmación',
  'help.guide.import-booking-file.goal':
    'Haz que TREK lea la reserva del correo o del PDF que te envió el proveedor, para no tener que escribirla otra vez.',
  'help.guide.import-booking-file.step.1':
    'Haz clic en el icono de descarga de la barra, «Importar confirmaciones de reserva»; su nombre aparece al pasar el cursor. Se abre el cuadro con ese mismo nombre.',
  'help.guide.import-booking-file.step.2':
    'Suelta las confirmaciones en el recuadro, o haz clic en él y elígelas: EML, PDF, PKPass, HTML y TXT, hasta cinco archivos de 10 MB cada uno, y fotos (JPG, PNG, WEBP) si el modelo de IA puede leer imágenes. El recuadro muestra los nombres de los archivos elegidos.',
  'help.guide.import-booking-file.step.3':
    'Haz clic en Importar. El cuadro se cierra al momento, porque la lectura se hace en segundo plano.',
  'help.guide.import-booking-file.step.4':
    'Una tarjeta abajo a la derecha muestra el progreso bajo el nombre del archivo. Sigue visible mientras te mueves por la aplicación y aunque recargues. «Analizando archivos…» cambia a una marca de verificación cuando termina la lectura, y la tarjeta ofrece Importar. Haz clic en él.',
  'help.guide.import-booking-file.step.5':
    'Cada reserva encontrada se abre en «Nueva reserva», una detrás de otra, ya rellenada. En un hotel, eso incluye su nombre como título y, si el lugar está en el viaje, en «Alojamiento», su «Ubicación / dirección», «De» y «Hasta» en sus noches, «Registro de entrada» y «Registro de salida», el «Código de reserva», la confirmación en «Archivos» y, con «Costes» activado, el precio como «Gasto vinculado». Revísala y haz clic en «Añadir».',
  'help.guide.import-booking-file.result':
    'La reserva aparece como tarjeta en «Pendiente», con sus noches, su código y la confirmación en «Archivos». La estancia aparece en esos días del plan. Si «Costes» está activado, el precio se añade como gasto vinculado a la reserva.',
  'help.guide.import-booking-file.tip.1':
    'El icono de importar solo aparece si el servidor puede leer confirmaciones. Para ello hace falta el extractor o el complemento «Análisis con IA», que el administrador activa en Complementos. Una pestaña sin reservas también lo muestra como el botón «Importar desde archivo».',
  'help.guide.import-booking-file.tip.2':
    'Si no se ha podido leer nada, la tarjeta te lo indica. Con «Análisis con IA» activado, ofrece «Probar lectura con IA», que envía esos mismos archivos directamente al modelo. Un análisis terminado se conserva diez minutos; empieza la revisión dentro de ese plazo.',
  'help.guide.import-booking-file.tip.3':
    'La confirmación solo se adjunta si su tipo está en los «Tipos de archivo permitidos» de los ajustes de administración. PDF está permitido de forma predeterminada; un correo, EML, hay que añadirlo antes, o la reserva se guarda sin él.',
  // edit-booking
  'help.guide.edit-booking.title': 'Cambiar una reserva',
  'help.guide.edit-booking.goal':
    'Corrige una hora, añade el código que llegó más tarde o pasa una reserva de «Pendiente» a «Confirmado».',
  'help.guide.edit-booking.step.1':
    'Pasa el ratón por encima de la tarjeta y haz clic en el lápiz de su cabecera. Se abre «Editar reserva» con todos los datos de la reserva.',
  'help.guide.edit-booking.step.2':
    'Cambia lo que necesites, por ejemplo el «Código de reserva» que te envió más tarde la compañía.',
  'help.guide.edit-booking.step.3':
    'Haz clic en la etiqueta Pendiente de la franja superior. Cambia a Confirmado y la franja se vuelve verde.',
  'help.guide.edit-booking.step.4': 'Haz clic en Actualizar.',
  'help.guide.edit-booking.result':
    'La tarjeta cambia de sitio: una reserva confirmada aparece en la sección «Confirmado» con un punto verde y la franja superior verde, y todos los participantes del viaje ven el cambio.',
  'help.guide.edit-booking.tip.1':
    'Si no puedes leer un «Código de reserva», es que «Difuminar códigos de reserva» está activado en «Ajustes», en «Pantalla». Pasa el cursor por el código, o haz clic en él, para leerlo.',
  'help.guide.edit-booking.tip.2':
    'Si cambias el tipo, la categoría de un gasto vinculado cambia con él, salvo que hayas elegido la categoría a mano en el editor de costes.',
  'help.guide.edit-booking.tip.3':
    '«Editar», abajo en la vista de detalle de una reserva, abre el mismo formulario. También puedes cambiar el estado sin abrir ningún formulario: haz clic en el punto de una tarjeta o de una fila, o en la etiqueta de estado de la vista de detalle.',
  // delete-booking
  'help.guide.delete-booking.title': 'Eliminar una reserva',
  'help.guide.delete-booking.goal': 'Quita del viaje una reserva cancelada.',
  'help.guide.delete-booking.step.1':
    'Pasa el cursor por la tarjeta y haz clic en la papelera de su cabecera. La papelera al pie del detalle de una reserva hace lo mismo.',
  'help.guide.delete-booking.step.2':
    '«¿Eliminar reserva?» indica la reserva que has elegido y avisa de que se eliminará definitivamente. Si tiene costes vinculados, indica que también se eliminarán.',
  'help.guide.delete-booking.step.3': 'Haz clic en Eliminar.',
  'help.guide.delete-booking.result':
    'La tarjeta se elimina para todos los participantes del viaje. Eliminar una reserva no se puede deshacer, así que la pregunta de confirmación es tu última oportunidad para cancelar.',
  'help.guide.delete-booking.tip.1':
    'Al eliminar una reserva también se eliminan sus gastos vinculados. Al eliminar un alojamiento, sus noches también se quitan del plan del día.',
  'help.guide.delete-booking.tip.2':
    'Los documentos adjuntos se quedan en la pestaña «Archivos» del viaje; solo se quita su vínculo con la reserva.',

  // ── Screen: trip-costs ────────────────────────────────────────────────────────────────
  'help.ctx.trip-costs.title': 'Costes',
  'help.ctx.trip-costs.summary':
    'El dinero del viaje: todos los gastos en un registro por fechas o en una tabla, quién los introdujo y quién los debe, en la moneda del recibo. La columna derecha muestra quién tiene que pagar a quién para saldar las cuentas.',
  'help.ctx.trip-costs.bullet.1':
    'La barra superior muestra las fechas del viaje y los viajeros entre los que se reparten los costes. También contiene «Buscar gastos…», «Filtrar» (el embudo), «Exportar CSV» (el icono de descarga) y el selector «Lista» / «Tabla».',
  'help.ctx.trip-costs.bullet.2':
    'En su extremo derecho, «Saldar cuentas» registra a la vez todas las transferencias pendientes, «Escanear recibo» rellena un gasto a partir de una foto si el complemento «Análisis con IA» puede leer imágenes, y «Añadir gasto» abre el editor.',
  'help.ctx.trip-costs.bullet.3':
    'Cuatro tarjetas bajo la barra: «Debes» y «Te deben» son tu parte de la liquidación, «Importe pendiente» es lo registrado que aún no tiene pagador, y «Gasto total del viaje» lo suma todo, con «Tu parte» y «Pagaste» debajo.',
  'help.ctx.trip-costs.bullet.4':
    'El registro se agrupa por día, del más reciente al más antiguo, y cada día indica cuántas entradas tiene y cuánto se gastó. Cada fila muestra la categoría como una pestaña de color, el nombre, las etiquetas de quién pagó con lo que pagó cada uno y, debajo, «Dividir» con la parte de cada viajero (una marca indica quién ha pagado la suya); después la nota y el importe, y «prestaste» o «te prestaron» si el reparto hace que otros te deban dinero o que lo debas tú.',
  'help.ctx.trip-costs.bullet.5':
    'La columna de la derecha muestra los resultados: «Saldar cuentas» indica quién paga a quién, «Saldos» muestra lo que a cada viajero le sobra o le falta, «Presupuesto final» lo que le cuesta el viaje a cada uno y «Por categoría» en qué se ha gastado el dinero.',
  'help.ctx.trip-costs.bullet.6':
    'Un pago registrado aparece en el mismo registro como una fila propia, con un lápiz y Deshacer al lado. Un gasto tiene un lápiz y una papelera, y la papelera pide confirmación antes de eliminar el gasto. Un gasto con recibos tiene una etiqueta «Recibo» junto a su nombre que los abre.',
  'help.ctx.trip-costs.bullet.7':
    '«Tabla», en la barra, muestra los mismos gastos en forma de hoja, agrupados por categoría, con «Personas» y «Días» y el importe por persona y por día. En ese caso, «Resumen» sustituye a «Por categoría». «Costes» recuerda la vista que elegiste.',
  // add-expense
  'help.guide.add-expense.title': 'Añadir un gasto',
  'help.guide.add-expense.goal': 'Registra cuánto costó algo, quién lo pagó y entre quiénes se reparte.',
  'help.guide.add-expense.step.1':
    'Haz clic en «Añadir gasto», en el extremo derecho de la barra. Se abre el editor con la fecha de hoy, pagado por ti y con todos ya incluidos en el reparto.',
  'help.guide.add-expense.step.2':
    'Escribe en qué consistió el gasto en el campo de la parte superior del cuadro. Mientras está vacío, muestra «p. ej. Cena, souvenirs, gasolina…». Es el nombre del gasto, y no se puede guardar sin él.',
  'help.guide.add-expense.step.3':
    'La píldora bajo el nombre es la «Categoría», «Comida y bebida» hasta que elijas otra. Hay catorce y no se pueden modificar. La cabecera toma el color de la categoría que elijas, igual que la pestaña de la fila y su barra en «Por categoría».',
  'help.guide.add-expense.step.4':
    'Escribe el importe del recibo en «Importe total». La «Moneda», a su lado, es al principio la misma en la que se muestran los «Costes»; si la cambias, el editor muestra el importe convertido. «Día» es al principio el día de hoy, y en la lista el gasto se agrupa bajo ese día.',
  'help.guide.add-expense.step.5':
    'En «¿Quién pagó?», haz clic en la persona que pagó realmente. «Tú» está seleccionado por defecto. «Nadie ha pagado aún» registra el importe sin que nadie deba dinero por él, y «Pagaron varias personas», en el selector junto al encabezado, reparte la cuenta entre varios pagadores.',
  'help.guide.add-expense.step.6':
    'Debajo, Dividir empieza en «A partes iguales», con todos marcados y la parte de cada uno junto a su nombre. Déjalo así o cámbialo. Haz clic en «Añadir gasto», abajo del diálogo, para guardar.',
  'help.guide.add-expense.result':
    'El gasto está en el registro bajo su día, incluido en el «Gasto total del viaje», y la columna de liquidación ha recalculado quién debe a quién.',
  'help.guide.add-expense.tip.1':
    'Si no cambias nada, el gasto lleva la fecha de hoy, lo pagas tú y se reparte a partes iguales entre todos: solo tienes que rellenar el nombre y el importe.',
  'help.guide.add-expense.tip.2':
    'El ± junto al importe convierte el gasto en un reembolso. Un total negativo significa que se devuelve dinero, y el reparto se invierte.',
  'help.guide.add-expense.tip.3':
    '«Adjuntar», junto a «Recibos y facturas» en la parte inferior del cuadro, admite imágenes y PDF. Se suben al guardar y se guardan en los «Archivos» del viaje, y aparece una etiqueta «Recibo» junto al nombre en la lista.',
  // expense-payers
  'help.guide.expense-payers.title': 'Indicar quién pagó',
  'help.guide.expense-payers.goal': 'Indica quién pagó un gasto. Es la otra mitad del cálculo para saldar cuentas.',
  'help.guide.expense-payers.step.1':
    'Abre un gasto con el lápiz junto a su fila y mira «¿Quién pagó?». «Pagó una sola persona» es la opción predeterminada del selector junto al encabezado: cada viajero es una etiqueta, y la que tiene borde es la persona que pagó. Haz clic en otra etiqueta para cambiarla.',
  'help.guide.expense-payers.step.2':
    '«Nadie ha pagado aún», la etiqueta discontinua que hay después de los viajeros, registra el importe sin que nadie deba nada. El gasto sigue contando para el «Gasto total del viaje».',
  'help.guide.expense-payers.step.3':
    '«Pagaron varias personas», la otra opción de ese selector, muestra a todos los viajeros con una casilla, y cada persona marcada tiene un campo de importe. Marca a quienes pagaron y escribe cuánto pagó cada uno; los importes tienen que sumar el total.',
  'help.guide.expense-payers.step.4':
    'Un gasto que nadie ha pagado aparece marcado como «Pendiente» en su fila y se cuenta en la tarjeta «Importe pendiente», que suma lo gastado que aún no tiene pagador.',
  'help.guide.expense-payers.result':
    'Quién pagó decide a quién se le devuelve el dinero, el reparto decide quién paga, y «Saldos» es la diferencia entre las dos cosas.',
  'help.guide.expense-payers.tip.1':
    '«¿Quién pagó?» y «Dividir» son independientes: puedes pagar una cena en la que no estuviste y participar en el reparto de otra que no pagaste.',
  'help.guide.expense-payers.tip.2':
    'Si hay varios pagadores, los importes tienen que sumar el total. Al marcar un pagador más, lo que queda se reparte de nuevo entre los importes que no has escrito tú. Mientras los importes no cuadren, el editor muestra el total al que deben llegar y no te deja guardar.',
  'help.guide.expense-payers.tip.3':
    'Volver a poner un gasto en «Nadie ha pagado aún» no lo elimina: el importe sigue contando en «Gasto total del viaje» y la fila pasa a «Pendiente».',
  // split-expense
  'help.guide.split-expense.title': 'Dividir una cuenta entre los viajeros',
  'help.guide.split-expense.goal':
    'Decide quién debe un gasto: todos a partes iguales, por importe o concepto a concepto según el recibo.',
  'help.guide.split-expense.step.1':
    'En el editor de gastos, «Dividir» muestra a todos los viajeros con una casilla. Desmarca un nombre para excluir a esa persona de este gasto: el nombre se pone gris, pierde su parte y no debe nada por él.',
  'help.guide.split-expense.step.2':
    '«A partes iguales», en el selector junto al título, es la opción predeterminada: cada viajero marcado recibe la misma parte, que aparece junto a su nombre. Las insignias bajo la lista indican entre cuántas personas se reparte y cuánto es cada parte.',
  'help.guide.split-expense.step.3':
    '«Personalizado» sustituye las partes por campos de importe. Escribe lo que debe cada viajero. La insignia de debajo se actualiza mientras escribes y se pone verde con «El reparto cuadra con el total». No puedes guardar mientras los importes no coincidan con el total.',
  'help.guide.split-expense.step.4':
    '«Recibo» divide la cuenta línea a línea: «Añadir artículo», luego un nombre y un precio por línea y, junto a «Se reparte entre:», los viajeros que comparten esa línea.',
  'help.guide.split-expense.step.5':
    '«Parte de cada uno», debajo de las líneas, muestra lo que debe al final cada viajero, e «Importe total», arriba, es la suma de las líneas. Haz clic en «Guardar», en la parte inferior del diálogo.',
  'help.guide.split-expense.result':
    'Todos los saldos se calculan a partir del reparto. Se guarda con el gasto, aparece en su fila como «Dividir» con la parte de cada viajero y puedes cambiarlo más adelante sin que cambie nada más.',
  'help.guide.split-expense.tip.1':
    'Un viajero al que desmarques no debe nada por este gasto; los demás pagan su parte.',
  'help.guide.split-expense.tip.2':
    '«A partes iguales» reparte hasta el último céntimo: el céntimo que sobra le toca a una persona distinta en cada gasto, para que no lo pague siempre la misma.',
  'help.guide.split-expense.tip.3':
    'El modo «Recibo» calcula el «Importe total» por su cuenta y deja el campo en gris: el total es la suma de las líneas del recibo.',
  'help.guide.split-expense.tip.4':
    'Un reparto personalizado también se puede indicar en porcentaje: cambia «Introducir partes como» a %, y las partes tienen que sumar el 100 % para poder guardar el gasto.',
  // expense-currency
  'help.guide.expense-currency.title': 'Introducir un gasto en otra moneda',
  'help.guide.expense-currency.goal': 'Introduce el importe del recibo y TREK guarda el tipo de cambio.',
  'help.guide.expense-currency.step.1':
    'Abre «Añadir gasto». Escribe el nombre en la parte superior del diálogo e introduce en «Importe total» el importe exacto del recibo, sin convertirlo.',
  'help.guide.expense-currency.step.2':
    'Abre Moneda, junto al importe, y elige la moneda del recibo. La lista incluye todos los códigos que conoce TREK y se puede buscar: escribe las tres letras.',
  'help.guide.expense-currency.step.3':
    'Debajo de los campos aparece una fila de insignias: el importe que escribiste y su valor actual, marcado como «tasa en vivo». Es solo una vista previa. No es el valor que se guarda.',
  'help.guide.expense-currency.step.4':
    'Haz clic en «Añadir gasto», al pie del cuadro. El tipo de cambio se fija en ese momento: este gasto conserva el valor que tenía el día en que lo introdujiste.',
  'help.guide.expense-currency.step.5':
    'En el registro, la fila muestra los dos importes bajo el nombre: el que escribiste, una flecha y el importe en la moneda del viaje. Todos los totales, saldos y liquidaciones de la pestaña «Costes» usan el segundo importe.',
  'help.guide.expense-currency.result':
    'El gasto conserva el importe y la moneda que escribiste. El registro muestra los dos, y los totales y saldos del viaje se calculan en la moneda del viaje.',
  'help.guide.expense-currency.tip.1':
    'El tipo de cambio queda fijado al guardar, así que una deuda saldada no cambia aunque el tipo de cambio varíe la semana siguiente. Solo se guarda un tipo nuevo si cambias la moneda del gasto.',
  'help.guide.expense-currency.tip.2':
    '«Moneda de visualización», en «Ajustes», solo cambia cómo se muestran los importes. Los importes guardados nunca cambian. Si la dejas vacía, cada viaje se muestra en su propia moneda.',
  'help.guide.expense-currency.tip.3':
    'La moneda del viaje se configura en el propio viaje, en «Editar viaje», y requiere el permiso «Editar detalles del viaje». Si la cambias, todos los tipos de cambio fijados se recalculan para la nueva moneda. Los importes en sí no se convierten.',
  // filter-costs
  'help.guide.filter-costs.title': 'Buscar un gasto o lo gastado en un día',
  'help.guide.filter-costs.goal': 'Filtra una lista larga de gastos para ver solo lo que buscas.',
  'help.guide.filter-costs.step.1':
    'Escribe en «Buscar gastos…», en la barra. Busca en el nombre de los gastos mientras escribes, y Esc vuelve a vaciar el campo.',
  'help.guide.filter-costs.step.2':
    '«Filtrar», el embudo junto a la búsqueda, abre los filtros. El selector de arriba es tu propia vista del registro: «Todos»; «Pagados por mí», para lo que pagaste tú; y «Me deben», para los gastos en los que pagaste más de tu parte.',
  'help.guide.filter-costs.step.3':
    'En «Categoría», elige una de las catorce categorías y solo verás los gastos de esa categoría. El embudo indica cuántos filtros hay activos.',
  'help.guide.filter-costs.step.4':
    'En «Día», elige uno de los días con gastos. Un banner sustituye a los encabezados de los días y muestra ese día completo, cuántos gastos tiene y su total.',
  'help.guide.filter-costs.step.5':
    '«Exportar CSV», el icono de descarga junto al embudo, guarda todos los gastos en un archivo, con el importe original, su moneda y el importe convertido.',
  'help.guide.filter-costs.result':
    'Puedes combinar los filtros, y los grupos por día se actualizan con sus propios totales para los gastos que quedan.',
  'help.guide.filter-costs.tip.1':
    'Los pagos registrados no tienen nombre ni categoría, así que una búsqueda o un filtro de categoría los oculta, igual que «Me deben». El filtro de día sí los mantiene, en el día en que se hizo el pago.',
  'help.guide.filter-costs.tip.2':
    '«Exportar CSV» siempre exporta todos los gastos, con independencia de lo que esté filtrado en pantalla, con una fila por gasto.',
  'help.guide.filter-costs.tip.3':
    '«Restablecer filtros», al pie del menú de filtros cuando hay alguno activo, los desactiva todos a la vez.',
  // settle-up
  'help.guide.settle-up.title': 'Ver quién debe a quién y saldar las deudas',
  'help.guide.settle-up.goal':
    'Convierte muchos gastos compartidos en el menor número posible de transferencias para saldar todas las deudas, y regístralas cuando se hagan.',
  'help.guide.settle-up.step.1':
    'La tarjeta «Saldar cuentas», en la columna derecha, muestra las transferencias que saldarían todas las deudas: quién paga a quién, con dos avatares que muestran los nombres al pasar el ratón, y cuánto. El número de su cabecera indica cuántas quedan pendientes.',
  'help.guide.settle-up.step.2':
    'Saldar, junto a una transferencia, la marca como hecha. La transferencia desaparece de la tarjeta y los saldos se actualizan.',
  'help.guide.settle-up.step.3':
    'La transferencia registrada es una fila del registro, en el día en que se hizo, marcada como «Pago» con los dos viajeros y el importe.',
  'help.guide.settle-up.step.4':
    'Junto a esa fila, el lápiz corrige un pago y Deshacer lo anula, y la transferencia vuelve a la tarjeta «Saldar cuentas».',
  'help.guide.settle-up.step.5':
    '«Añadir pago», en la cabecera de la tarjeta, registra una transferencia que no siguió ninguna sugerencia. Elige «De» y «A», el importe, su moneda y el día en que se hizo, añade una «Nota» si quieres, por ejemplo cómo se pagó, y haz clic en «Añadir pago», al pie del cuadro.',
  'help.guide.settle-up.step.6':
    '«Saldar cuentas», en la barra superior, registra a la vez todas las transferencias pendientes, sin preguntar, por ejemplo cuando el grupo salda todas las deudas al final del viaje.',
  'help.guide.settle-up.result':
    'Cada transferencia registrada es una fila del registro y quita una línea de la tarjeta «Saldar cuentas». Cuando la tarjeta muestra «Todos están en paz», el viaje está totalmente pagado.',
  'help.guide.settle-up.tip.1':
    'La tarjeta muestra el menor número de transferencias, no todas las deudas: si tres personas se deben dinero en círculo, todo se reduce a uno o dos pagos.',
  'help.guide.settle-up.tip.2':
    '«Saldar» solo registra una transferencia, no envía dinero. Paga con tu método de pago habitual y luego haz clic en «Saldar».',
  'help.guide.settle-up.tip.3':
    'Un pago se puede hacer en cualquier moneda, así que es normal pagar en euros una deuda en yenes: el diálogo tiene su propio selector de moneda y también fija ese tipo de cambio.',
  // final-budget
  'help.guide.final-budget.title': 'Ver cuánto le ha costado el viaje a cada viajero',
  'help.guide.final-budget.goal': 'Consulta las cifras de cada persona: el saldo actual y el coste real por persona.',
  'help.guide.final-budget.step.1':
    '«Saldos» muestra la situación de cada viajero: una barra verde hacia la derecha si el viaje le debe dinero, una barra roja hacia la izquierda si debe dinero, y el importe junto al nombre.',
  'help.guide.final-budget.step.2':
    '«Presupuesto final», debajo, responde a otra pregunta: no quién debe qué ahora mismo, sino cuánto le cuesta el viaje a cada viajero cuando se haya devuelto todo.',
  'help.guide.final-budget.step.3':
    'Haz clic en un nombre para ver el cálculo: «Gastos pagados» y, debajo, «Reembolsos netos» y «Reembolsos pendientes».',
  'help.guide.final-budget.step.4':
    'Debajo de las tres líneas, bajo el nombre de cada viajero, hay una lista con las filas que forman esa línea: los gastos que pagó ese viajero, las transferencias ya registradas y las que siguen pendientes. Cada lista suma exactamente lo mismo que la línea del mismo nombre.',
  'help.guide.final-budget.result':
    'Saldos muestra quién tiene dinero por cobrar y quién debe dinero a día de hoy. «Presupuesto final» muestra lo que le cuesta el viaje a cada uno una vez saldadas todas las deudas.',
  'help.guide.final-budget.tip.1':
    'Registrar un pago no cambia el presupuesto final de nadie. Solo pasa un importe de los reembolsos pendientes a los reembolsos netos.',
  'help.guide.final-budget.tip.2':
    'Un gasto sin pagador queda fuera de las dos tarjetas, igual que queda fuera de las sugerencias para saldar cuentas.',
  // expense-from-booking
  'help.guide.expense-from-booking.title': 'Convertir una reserva en un gasto',
  'help.guide.expense-from-booking.goal':
    'Asocia lo que costó realmente un vuelo, un hotel o un lugar al registro correspondiente.',
  'help.guide.expense-from-booking.step.1':
    'Busca la reserva en la pestaña «Transportes» o «Reservas» y haz clic en el lápiz de la parte superior de su tarjeta.',
  'help.guide.expense-from-booking.step.2':
    'Baja hasta «Costes», casi al final del formulario. Ahí tienes «Crear gasto», que primero guarda la reserva, y «Vincular gasto existente» para un gasto que ya está en «Costes».',
  'help.guide.expense-from-booking.step.3':
    'Haz clic en «Crear gasto». La reserva se guarda, el formulario se cierra y se abre el editor de costes con el título de la reserva como nombre, una categoría según su tipo y el día de la reserva como día del gasto.',
  'help.guide.expense-from-booking.step.4':
    'Rellena el importe y su moneda, quién pagó y el reparto como en cualquier otro gasto, y haz clic en «Añadir gasto». Cuando vuelvas a abrir la reserva, verás el gasto en «Gastos vinculados», con un lápiz para editarlo, «Desvincular, conservar el gasto» para quitar el vínculo sin borrar el gasto, y una papelera para eliminarlo.',
  'help.guide.expense-from-booking.result':
    'La reserva muestra su coste, y el gasto es una fila normal de la pestaña Costes, con pagador, reparto y moneda como cualquier otro.',
  'help.guide.expense-from-booking.tip.1':
    'Al eliminar la reserva también se eliminan sus gastos vinculados, y la pregunta de confirmación te lo indica. «Quitar gasto», en el bloque «Costes» de la reserva, hace lo contrario: elimina el gasto y conserva la reserva. «Desvincular, conservar el gasto» conserva los dos.',
  'help.guide.expense-from-booking.tip.2':
    'El formulario de un lugar tiene el mismo bloque; ahí, «Crear gasto» guarda primero el lugar.',
  // costs-table
  'help.guide.costs-table.title': 'Planificar los costes en una tabla',
  'help.guide.costs-table.goal':
    'Consulta y modifica los gastos en una tabla, ordenados por categoría y calculados por persona y por día.',
  'help.guide.costs-table.step.1':
    'Haz clic en «Tabla», el segundo icono del selector «Lista» / «Tabla» de la barra. Una tabla con los mismos gastos sustituye al registro, y la búsqueda y los filtros también se aplican a ella.',
  'help.guide.costs-table.step.2':
    'La tabla se agrupa por categoría. La cabecera de cada grupo muestra su nombre, cuántos gastos tiene y su subtotal; haz clic en ella para plegar el grupo. Las columnas son «Nombre», «Fecha», Total, «Personas» y «Días», y después «Por persona», «Por día» y «Por pers. / día», calculadas a partir de las anteriores, sobre fondo gris. Una fila Total al final lo suma todo.',
  'help.guide.costs-table.step.3':
    'Haz clic en una celda para cambiarla directamente: un nombre, un total, «Personas» o «Días». Escribe y pulsa Intro o haz clic fuera para guardar, o pulsa Esc para cancelar; la fecha abre el calendario. «Por persona» y las demás columnas calculadas se actualizan al instante.',
  'help.guide.costs-table.step.4':
    'Un total con candado no se puede cambiar aquí: o alguien lo pagó o se introdujo en otra moneda, y su descripción emergente te dice cuál de las dos. Al hacer clic en él, se abre el gasto, para que los saldos y el tipo de cambio fijado sigan siendo correctos.',
  'help.guide.costs-table.step.5':
    '«Añadir gasto», al final de una categoría, le añade una fila llamada «Nueva entrada», con la fecha de la entrada más reciente de esa categoría. El campo del nombre ya está abierto para que puedas cambiarlo. Introduce un total de la misma forma.',
  'help.guide.costs-table.step.6':
    'En esta vista, la columna derecha muestra «Resumen» en lugar de «Por categoría». Suma los gastos de cuatro formas: «Categoría», «Día», «Pagador», con «Aún sin pagador» para los no pagados, y «Estado», con lo pagado frente a lo pendiente.',
  'help.guide.costs-table.result':
    'Cada gasto aparece en su categoría con su importe por persona y por día. Si cambias un total en una casilla, las tarjetas de arriba y el «Resumen» se actualizan al momento.',
  'help.guide.costs-table.tip.1':
    '«Costes» recuerda la vista en este navegador: se abre en la tabla hasta que vuelvas a hacer clic en «Lista».',
  'help.guide.costs-table.tip.2':
    'Un gasto con reparto «Personalizado» o «Recibo» no tiene una parte única por persona, así que sus columnas «Por persona» y «Por pers. / día» quedan vacías.',
  'help.guide.costs-table.tip.3':
    'Los pagadores, el reparto, la nota y los recibos se editan en el propio gasto: en «Más opciones», al final de cada fila, tienes «Editar», y «Eliminar» para borrar la fila.',

  // ── Screen: trip-transports ───────────────────────────────────────────────────────────
  'help.ctx.trip-transports.title': 'Transportes',
  'help.ctx.trip-transports.summary':
    'Todos los medios con los que te desplazas entre las paradas: vuelos, trenes, autobuses, coches, taxis, bicicletas, cruceros, ferris, teleféricos y las conexiones de transporte público que TREK busca por ti. La pestaña los recoge en una lista. También puedes crearlos y consultarlos en el plan, y se muestran en el mapa.',
  'help.ctx.trip-transports.bullet.1':
    'La pestaña solo muestra los trayectos. El alojamiento, los restaurantes, los eventos y las entradas están en la pestaña «Reservas», así que una misma entrada nunca aparece dos veces.',
  'help.ctx.trip-transports.bullet.2':
    'La barra superior tiene «Buscar», «Filtrar» por estado, tipos y viajeros, las tres vistas «Tarjetas», «Lista» y «Cronología», «Opciones de vista» y «Exportar como hoja de cálculo (CSV)», que descarga lo que se muestra. «Transporte», a la derecha, añade un trayecto a mano. Los iconos de delante, «Importar confirmaciones de reserva» e «Importar desde AirTrail», aparecen si el servidor puede leer confirmaciones o si hay un AirTrail conectado. Con la pestaña vacía, las mismas acciones aparecen en el centro como «Transporte», «Importar desde archivo» y AirTrail.',
  'help.ctx.trip-transports.bullet.3':
    '«Tarjetas» es la vista con la que se abre la pestaña: primero «Confirmado» y después «Pendiente». Puedes plegar cada sección haciendo clic en su título. Las conexiones de transporte público planificadas no tienen estado y aparecen entre los trayectos confirmados por orden horario, salvo que «Opciones de vista» les asigne una sección propia, «Transporte público automático». «Lista» agrupa por día, y «Cronología» muestra todos los trayectos a lo largo de los días del viaje.',
  'help.ctx.trip-transports.bullet.4':
    'La franja superior de cada tarjeta tiene el color de su estado: verde si está confirmado, ámbar si está pendiente y azul si es una conexión planificada. Muestra el punto de estado, el tipo, el título, el lápiz y la papelera. Debajo: «Fecha», hora, «Código de reserva», «Ruta» y la aerolínea y el número de vuelo, o el número de tren, el andén y el asiento. Haz clic en la tarjeta para ver sus detalles.',
  'help.ctx.trip-transports.bullet.5':
    'También puedes crear transportes en el plan: el + de la cabecera de un día (su descripción emergente dice «Añadir al día»), o un clic con el botón derecho en la cabecera, ofrece «Añadir transporte» y «Transporte público». El conector de tiempo entre dos paradas abre la misma búsqueda para ese tramo.',
  'help.ctx.trip-transports.bullet.6':
    'Un transporte con los dos extremos indicados dibuja una línea en el mapa. El icono de ruta de su fila en el plan del día y «En el mapa» en sus detalles activan esa línea. «Mostrar todas las rutas de reservas», en la barra de herramientas encima de los días, activa o desactiva las líneas de todo el viaje.',
  // transports-list
  'help.guide.transports-list.title': 'Entender la pestaña «Transportes»',
  'help.guide.transports-list.goal': 'Entiende qué muestra la lista antes de cambiar nada.',
  'help.guide.transports-list.step.1':
    '«Transportes» es una pestaña del viaje, después de «Planificado» (y de «Excursiones», si ese complemento está activado). Solo contiene los trayectos: los hoteles, restaurantes, eventos y entradas están en la pestaña «Reservas».',
  'help.guide.transports-list.step.2':
    '«Buscar», a la izquierda de la barra, filtra los trayectos mientras escribes. «Filtrar», el embudo que hay al lado, abre las opciones: «Estado» con «Todos», «Confirmado» y «Pendiente», y después cada tipo usado con su recuento. Marca uno o varios tipos para ver solo esos. Un número en el embudo indica cuántos filtros hay activos, y la barra muestra cuántos trayectos se ven, por ejemplo 1 de 4. «Restablecer filtros», al final del menú, vuelve a mostrar todos los trayectos.',
  'help.guide.transports-list.step.3':
    'Al lado, «Tarjetas», «Lista» y «Cronología» muestran los transportes como tarjetas, como filas agrupadas por día o como barras a lo largo de los días del viaje. «Opciones de vista», el icono de los controles deslizantes, define «Agrupar por» y «Ordenar por» en «Tarjetas» y «Lista», y las filas de «Cronología». «Restablecer vista» vuelve a los valores predeterminados. En «Tarjetas», «Transporte público en su propia sección» muestra las conexiones planificadas en «Transporte público automático».',
  'help.guide.transports-list.step.4':
    'Cada tarjeta muestra todos los detalles. La franja superior es verde si está confirmado y ámbar si está pendiente, y muestra el punto de estado, el tipo y el título. Debajo, Fecha indica los días que abarca, con sus fechas. Después vienen «Fecha y hora», «Código de reserva», Ruta con el icono del tipo entre las paradas, y la aerolínea y el número de vuelo, o el número de tren, el andén y el asiento. Haz clic en la tarjeta para abrir sus detalles.',
  'help.guide.transports-list.step.5':
    'Haz clic en el punto de estado para cambiar el trayecto entre «Pendiente» y «Confirmado»; la descripción emergente indica el cambio, por ejemplo «Marcar como Pendiente». El lápiz de la cabecera abre el formulario del transporte, y la papelera lo elimina tras preguntar «¿Eliminar reserva?», con la lista de lo que se borrará, incluidos los costes vinculados.',
  'help.guide.transports-list.result':
    'Cada tarjeta indica si el trayecto está reservado, y puedes usar la barra para filtrar u ordenar la lista cuando quieras.',
  'help.guide.transports-list.tip.1':
    'La pestaña recuerda tus ajustes: la vista, la agrupación y el orden en este navegador, las secciones plegadas en cada viaje, y los filtros hasta que cierres la pestaña del navegador.',
  'help.guide.transports-list.tip.2':
    '«Importar confirmaciones de reserva» e «Importar desde AirTrail», los dos iconos delante de «Transporte», solo aparecen si el servidor puede leer confirmaciones y si hay una instancia de AirTrail conectada. Sin ellos, la lista se rellena a mano o con la búsqueda de transporte público.',
  // add-transport
  'help.guide.add-transport.title': 'Añadir un transporte a un día',
  'help.guide.add-transport.goal':
    'Añade el transporte que te lleva de una parada a la siguiente en el día en que lo usas.',
  'help.guide.add-transport.step.1':
    'En la cabecera del día del trayecto, haz clic en el +, cuya descripción emergente dice «Añadir al día», y elige «Añadir transporte». Un clic con el botón derecho en la cabecera del día ofrece el mismo menú. El formulario se abre con ese día ya rellenado.',
  'help.guide.add-transport.step.2':
    'La píldora de tipo de la cabecera muestra el tipo de transporte, «Vuelo» de forma predeterminada. Haz clic en ella para elegir «Vuelo», «Tren», «Autobús», «Coche», Taxi, «Bicicleta», «Crucero», Ferry, «Teleférico» u «Otros», y el formulario se adapta: un vuelo tiene un aeropuerto en cada escala; un tren, una cadena de estaciones; un crucero, «Embarque», «Puerto de escala» y «Desembarque»; y un coche, «Recogida», «Devolución» y «Paradas por el camino».',
  'help.guide.add-transport.step.3':
    'Escribe el título directamente en la franja superior, donde está el texto de ejemplo en gris. Es el único campo obligatorio: mientras no lo rellenes, la línea de debajo pone «Título *» y «Añadir» sigue en gris. Usa un título que reconocerías en un panel de salidas.',
  'help.guide.add-transport.step.4':
    'En Ruta, los campos De y A admiten una estación, un puerto o una dirección. Antes de que escribas, se proponen los lugares del propio viaje. Escribe al menos tres letras para buscar y elige un resultado. Si solo escribes un nombre y no lo eliges de los resultados, no se guarda y no aparece nada en el mapa.',
  'help.guide.add-transport.step.5':
    '«Fecha» y «Hora de inicio» indican cuándo empieza, y «Fecha fin» y «Hora de fin», cuándo termina; si el trayecto llega al día siguiente, pon ahí el día siguiente. «Código de reserva» y «Notas», más abajo, son opcionales. Haz clic en la píldora «Pendiente» de la cabecera para cambiarla a «Confirmado».',
  'help.guide.add-transport.step.6': 'Haz clic en Añadir.',
  'help.guide.add-transport.result':
    'El transporte es una fila del día, a su hora entre las paradas, y una tarjeta en la pestaña «Transportes» en «Pendiente» o «Confirmado».',
  'help.guide.add-transport.tip.1':
    'La fila se coloca según su hora de inicio, después de la última parada que empieza antes. Arrástrala por el asa a otra posición del día, o a otro día.',
  'help.guide.add-transport.tip.2':
    'Con «Adjuntar archivo», en «Archivos», añades el billete. «Crear gasto», en «Costes», guarda la reserva y abre el editor de «Costes» para el importe.',
  'help.guide.add-transport.tip.3':
    '«Viajeros», el primer bloque del formulario, indica quién usa este transporte. Cuando el viaje tiene más de un miembro y algún transporte tiene asignada a una persona, «Filtrar», en la pestaña, también ofrece «Viajeros» para ver solo los transportes de una persona.',
  // import-transport-file
  'help.guide.import-transport-file.title': 'Importar un vuelo desde su billete electrónico',
  'help.guide.import-transport-file.goal':
    'Haz que TREK lea un vuelo, un tren o un ferry del billete que te envió la compañía, y revísalo antes de guardarlo.',
  'help.guide.import-transport-file.step.1':
    'En la barra de la pestaña «Transportes», haz clic en el icono de descarga delante de «Transporte», cuya descripción emergente dice «Importar confirmaciones de reserva». Se abre el cuadro con ese nombre, el mismo que tiene la pestaña «Reservas». Con la pestaña vacía, «Importar desde archivo», en el centro, hace lo mismo.',
  'help.guide.import-transport-file.step.2':
    'Suelta el billete en el recuadro, o haz clic en él y elige el archivo: EML, PDF, PKPass, HTML y TXT, hasta cinco archivos de 10 MB cada uno, y fotos de un billete (JPG, PNG, WEBP) si tu servidor tiene un modelo de IA para leerlas. El recuadro muestra los nombres de los archivos elegidos.',
  'help.guide.import-transport-file.step.3':
    'Haz clic en Importar. El cuadro se cierra al momento, y el archivo se lee en segundo plano.',
  'help.guide.import-transport-file.step.4':
    'Una tarjeta abajo a la derecha muestra el progreso bajo el nombre del archivo. «Analizando archivos…» cambia a una marca de verificación cuando termina la lectura, y la tarjeta ofrece Importar. Haz clic en él.',
  'help.guide.import-transport-file.step.5':
    'Un vuelo se abre en «Añadir transporte» ya rellenado: la píldora de tipo en «Vuelo», la aerolínea y el número de vuelo como título en la cabecera, los dos aeropuertos en «Ruta» con «Salida» y «Llegada», sus horas y sus zonas horarias, «Aerolínea» y «N° de vuelo», el «Código de reserva» y el billete en «Archivos». Revísalo y haz clic en Añadir.',
  'help.guide.import-transport-file.result':
    'El vuelo aparece como tarjeta en «Pendiente», en la pestaña «Transportes», y como fila en el día de salida, con el billete en «Archivos». Si se conocen los dos aeropuertos, el vuelo se dibuja como una curva en el mapa.',
  'help.guide.import-transport-file.tip.1':
    'Las dos pestañas usan la misma importación. Si un archivo contiene un vuelo y un hotel, el vuelo se abre en «Añadir transporte» y después el hotel en «Nueva reserva», empieces desde la pestaña que empieces.',
  'help.guide.import-transport-file.tip.2':
    'Los aeropuertos se sitúan por su código. Si no se pudo localizar una estación o un puerto, su nombre aparece en ámbar en la tarjeta de importación, abajo a la derecha. Elígelo a mano en Ruta antes de hacer clic en Añadir; si no, el transporte no aparece en el mapa.',
  // plan-transit
  'help.guide.plan-transit.title': 'Planificar una conexión de transporte público',
  'help.guide.plan-transit.goal':
    'Haz que TREK busque los trenes y autobuses reales entre dos puntos de un día y añade al plan el que elijas.',
  'help.guide.plan-transit.step.1':
    'Haz clic en el + de la cabecera del día y elige «Transporte público». La búsqueda se abre para ese día: el día aparece como una píldora en la cabecera, y «A mano» y «Automático», a su lado, cambian entre esta búsqueda y el formulario normal.',
  'help.guide.plan-transit.step.2':
    'En «De» y «A» puedes poner una parada o una estación. Con el cuadro todavía vacío, TREK te sugiere el alojamiento del día, las estaciones y aeropuertos de las reservas del día y las propias paradas del día. Al escribir dos letras, busca en cambio entre las estaciones del horario. «Intercambiar», entre los dos cuadros, invierte «De» y «A».',
  'help.guide.plan-transit.step.3':
    '«Salida» o «Llegada» con una hora indica cuándo quieres viajar, y «Mejor ruta», «Menos transbordos» o «Menos caminata» indica cómo se ordenan los resultados.',
  'help.guide.plan-transit.step.4':
    'Las etiquetas de debajo indican qué medios se pueden usar: «Tren», «Metro», «Tranvía», «Autobús», «Ferry» y «Teleférico». Desactiva uno para excluirlo; siempre queda al menos uno activado. Después haz clic en «Buscar».',
  'help.guide.plan-transit.step.5':
    'Cada resultado muestra la salida y la llegada, la duración, cuántos transbordos y cuánto trayecto a pie hay, y las líneas como insignias, en sus colores si el horario los incluye. Haz clic en uno para desplegarlo y ver cada tramo, con las paradas donde subes y haces transbordo, los andenes y los trayectos a pie entre líneas.',
  'help.guide.plan-transit.step.6': 'Haz clic en «Añadir al día».',
  'help.guide.plan-transit.result':
    'La conexión es una fila del día con las insignias de sus líneas. Haz clic en su flecha para ver cada tramo. También aparece como tarjeta en la pestaña «Transportes» entre los trayectos confirmados, en azul.',
  'help.guide.plan-transit.tip.1':
    'Las conexiones proceden de Transitous, un servicio comunitario gratuito que usa datos públicos de horarios: sin clave y sin cuenta. Un administrador puede configurar la búsqueda para que use Google.',
  'help.guide.plan-transit.tip.2':
    '¿No encuentras nada? Los datos cubren una región y un periodo. Prueba otra hora, activa más medios de transporte o elige una estación en lugar del propio lugar. El mensaje indica qué servicio ha respondido. Un viaje sin fechas no tiene días en los que buscar, así que solo ofrece el formulario normal.',
  'help.guide.plan-transit.tip.3':
    'La misma búsqueda se abre para un solo tramo: haz clic en el conector de tiempo entre dos paradas y elige «Transporte público». El origen, el destino y la hora de salida ya vienen rellenados.',
  // change-transit-route
  'help.guide.change-transit-route.title': 'Abrir y cambiar una conexión planificada',
  'help.guide.change-transit-route.goal':
    'Consulta la conexión tramo a tramo, cámbiale el nombre o vuelve a buscar la ruta.',
  'help.guide.change-transit-route.step.1':
    'En la pestaña «Transportes», una conexión planificada es una tarjeta con una franja superior azul, ordenada por hora junto con los transportes confirmados. Si tienes activado «Transporte público en su propia sección» en «Opciones de vista», aparece en «Transporte público automático». Haz clic en la tarjeta y la conexión se abrirá como una reserva.',
  'help.guide.change-transit-route.step.2':
    'Los recuadros de arriba muestran la salida y la llegada con sus paradas, la duración, los transbordos y los tramos a pie. Debajo, Itinerario detalla la conexión línea por línea, con los horarios, los andenes y los trayectos a pie entre líneas.',
  'help.guide.change-transit-route.step.3':
    '«Cambiar ruta», al pie de la reserva, vuelve a abrir la búsqueda, ya rellenada con los dos extremos de esta conexión y su día.',
  'help.guide.change-transit-route.step.4':
    'Haz clic en «Buscar», abre otra conexión y haz clic en «Añadir al día»; sustituye a la anterior. Editar, en el extremo derecho del pie de la reserva, abre en su lugar el formulario normal de transporte, donde puedes editar el «Código de reserva», los viajeros, las notas y los archivos.',
  'help.guide.change-transit-route.result':
    'El trayecto usa ahora el nuevo itinerario, y su tarjeta en la pestaña «Transportes» muestra las nuevas líneas y horas.',
  'help.guide.change-transit-route.tip.1':
    'Haz clic en el título de la cabecera de la reserva para cambiar el nombre de la conexión sin cambiar la ruta. Sus notas se escriben en el formulario de transporte que se abre con Editar.',
  'help.guide.change-transit-route.tip.2':
    'La papelera, al final de la reserva, elimina la conexión después de pedirte confirmación; el día conserva sus paradas.',
  // leg-travel-mode
  'help.guide.leg-travel-mode.title': 'Cambiar el medio de transporte de un tramo',
  'help.guide.leg-travel-mode.goal':
    'Haz a pie un tramo de un día en coche o planifícalo con la búsqueda de transporte público.',
  'help.guide.leg-travel-mode.step.1':
    'Los conectores entre paradas solo aparecen cuando la ruta del día está activada. Haz clic en la cabecera del día para abrirlo y luego en «Ruta», en la barra bajo sus paradas.',
  'help.guide.leg-travel-mode.step.2':
    'Cada conector muestra el tiempo y la distancia de ese tramo, con el icono del medio con el que se calculó: un coche para ir en coche, un pie para ir a pie y una bici para ir en bicicleta.',
  'help.guide.leg-travel-mode.step.3':
    'Haz clic en el conector. El menú ofrece «Coche», «A pie» y «Bicicleta», «Transporte público» para ese tramo y «Usar predet. del día».',
  'help.guide.leg-travel-mode.step.4': 'Elige «A pie». Solo cambia este tramo; el resto del día mantiene su medio.',
  'help.guide.leg-travel-mode.result':
    'El tramo muestra el icono del pie y su tiempo a pie, y los demás tramos del día mantienen el medio del día.',
  'help.guide.leg-travel-mode.tip.1':
    'El medio pertenece al tramo, no al día: los botones «Coche», «A pie» y «Bicicleta» del día nunca sobrescriben un tramo que hayas configurado a mano. «Usar predet. del día» hace que el tramo vuelva a seguir esos botones.',
  'help.guide.leg-travel-mode.tip.2':
    '«Transporte público», en el mismo menú, abre la búsqueda de conexiones justo para este tramo, con los dos extremos y la hora de salida ya rellenados.',
  'help.guide.leg-travel-mode.tip.3':
    'Los tiempos los calcula un servicio de rutas público sobre carreteras y caminos reales. Si no puede calcular un tramo, el tramo se queda como línea recta y no muestra tiempo.',
  // edit-transport
  'help.guide.edit-transport.title': 'Editar o eliminar un transporte',
  'help.guide.edit-transport.goal':
    'Corrige una hora, un andén o un código de reserva, o quita el transporte del viaje.',
  'help.guide.edit-transport.step.1':
    'En el plan del día, un transporte es una fila entre las paradas, con el color de su tipo. Haz clic en ella para abrir su reserva: el estado, el tipo, los días y el «Código de reserva» (con un botón para copiarlo) como píldoras arriba, y debajo las horas de salida y llegada con sus aeropuertos o estaciones.',
  'help.guide.edit-transport.step.2':
    'Editar, al pie de la reserva, abre el formulario con el que se creó, con «Editar transporte» encima del título en su cabecera. Ahí puedes cambiarlo todo: el título, las píldoras de estado y de tipo, la ruta, los días y las horas, y el «Código de reserva».',
  'help.guide.edit-transport.step.3':
    'La ruta de un vuelo es una cadena de aeropuertos; la de un tren, de estaciones; la de un crucero, de puertos. «Añadir escala» («Añadir puerto» en un crucero) inserta otra en medio, y cada tramo conserva sus propias horas y su número de vuelo o de tren.',
  'help.guide.edit-transport.step.4':
    'Haz clic en Actualizar. Para eliminar el transporte por completo, usa la papelera a la izquierda de esa misma barra, la del pie de su reserva o la de su tarjeta en la pestaña «Transportes», y confirma.',
  'help.guide.edit-transport.result':
    'El cambio se ve en todos los sitios donde aparece el transporte: la pestaña «Transportes», el día en que se hace y su línea en el mapa.',
  'help.guide.edit-transport.tip.1':
    'El mismo formulario se abre desde dos sitios: con Editar en la reserva que se abre desde una fila del plan del día, y con el lápiz de la tarjeta en la pestaña «Transportes». Una conexión de transporte público planificada también se abre como reserva; ahí, «Cambiar ruta» vuelve a abrir la búsqueda, y Editar abre este formulario.',
  'help.guide.edit-transport.tip.2':
    'Para mover un transporte a otro día no necesitas el formulario: arrastra su fila de la tarjeta de un día a la de otro.',
  // transport-on-map
  'help.guide.transport-on-map.title': 'Mostrar un transporte en el mapa',
  'help.guide.transport-on-map.goal': 'Consulta el recorrido real de un vuelo, un trayecto en coche o una conexión.',
  'help.guide.transport-on-map.step.1':
    'Un transporte con los dos extremos indicados muestra un pequeño icono de ruta en su fila del plan del día. Haz clic en él; su descripción emergente cambia a «Ocultar rutas de reservas».',
  'help.guide.transport-on-map.step.2':
    'La ruta aparece en el mapa, con un marcador en forma de píldora en cada extremo que muestra el icono del transporte.',
  'help.guide.transport-on-map.step.3':
    'Haz clic en el marcador de un extremo y la reserva se abre sobre el mapa. Su cabecera muestra el estado, el tipo, los días y el «Código de reserva». Debajo están las horas con sus aeropuertos o estaciones, la aerolínea y el número de vuelo. Haz clic en Cerrar, en su cabecera, para cerrarla.',
  'help.guide.transport-on-map.step.4':
    'El icono de ruta de la barra de herramientas encima de los días actúa sobre todo el viaje: «Mostrar todas las rutas de reservas», y «Ocultar todas las rutas de reservas» para volver a ocultarlas.',
  'help.guide.transport-on-map.step.5':
    'Las conexiones de transporte público planificadas no tienen icono de ruta propio. Se dibujan con el interruptor «Ruta» del día, así que «Ocultar todas las rutas de reservas» no las oculta mientras la ruta de ese día siga activada.',
  'help.guide.transport-on-map.result':
    'Las rutas aparecen en el mapa con un marcador en cada extremo y se quedan ahí hasta que las desactives.',
  'help.guide.transport-on-map.tip.1':
    'Los vuelos, cruceros y ferris se dibujan como una curva. Los coches, autobuses, taxis y bicicletas siguen las carreteras reales. Los trenes y las conexiones planificadas pasan por las estaciones en las que paran.',
  'help.guide.transport-on-map.tip.2':
    'Una reserva confirmada se muestra con línea continua, y una pendiente, con línea discontinua. El ajuste «Etiquetas de rutas de reservas» muestra el código del aeropuerto o el nombre de la estación en los marcadores de los extremos.',
  'help.guide.transport-on-map.tip.3':
    '«Mostrar todas las rutas de reservas» no se suma a las rutas que ya muestras: sustituye lo que configuraste con los iconos individuales. Después de pulsarlo, todas las rutas quedan visibles u ocultas.',
  // airtrail-import
  'help.guide.airtrail-import.title': 'Importar vuelos desde AirTrail',
  'help.guide.airtrail-import.goal':
    'Importa de una vez al viaje los vuelos que ya tienes en AirTrail y mantenlos actualizados desde AirTrail a partir de entonces.',
  'help.guide.airtrail-import.step.1':
    'Si el complemento de AirTrail está activado y tu instancia está conectada en «Ajustes» > «Integraciones», en la barra de la pestaña «Transportes» aparece un icono de avión, «Importar desde AirTrail», antes de «Transporte». Haz clic en él.',
  'help.guide.airtrail-import.step.2':
    '«Importar desde AirTrail» muestra los vuelos de tu cuenta en dos grupos. «Durante este viaje» contiene los vuelos con fecha dentro del viaje, ya marcados. «Otros vuelos» contiene el resto, sin marcar. Los vuelos que ya están en el viaje aparecen en gris y marcados como «Importado».',
  'help.guide.airtrail-import.step.3':
    'Cada fila es una casilla con la aerolínea y el número de vuelo, los dos aeropuertos y la fecha. Haz clic en una fila para incluir o excluir el vuelo. Los vuelos de «Otros vuelos» solo se importan si los marcas.',
  'help.guide.airtrail-import.step.4':
    'Los vuelos de conexión se agrupan: cada uno sale, en el plazo de un día, del aeropuerto donde aterrizó el anterior. La casilla de debajo, «Importar como un solo vuelo con escala en ese aeropuerto», ya está marcada. Déjala marcada para tener una sola reserva con escala, o desmárcala para importar los tramos como vuelos separados.',
  'help.guide.airtrail-import.step.5':
    'Haz clic en el botón de abajo a la derecha, que muestra el número de vuelos marcados, por ejemplo «Importar 2». El mensaje posterior indica cuántos vuelos se han importado.',
  'help.guide.airtrail-import.step.6':
    'Los vuelos aparecen como tarjetas en «Confirmado», cada una con una píldora azul de AirTrail junto al título, y como filas en los días en que se vuela. Un vuelo con conexión es una sola tarjeta, y su ruta pasa por la escala.',
  'help.guide.airtrail-import.result':
    'Los vuelos de AirTrail son tarjetas en la pestaña «Transportes» y filas en sus días, cada uno con la píldora de AirTrail que indica su origen.',
  'help.guide.airtrail-import.tip.1':
    'Si un vuelo ya está en el viaje con el mismo número y la misma fecha, se omite, y un mensaje te dice cuántos se han omitido. La flecha de deshacer de la barra de herramientas, sobre los días, deshace toda la importación.',
  'help.guide.airtrail-import.tip.2':
    'AirTrail sigue siendo la fuente principal de los datos. TREK lee sus cambios cuando abres el viaje y cada pocos minutos en segundo plano. Si borras un vuelo en AirTrail, su tarjeta se mantiene en TREK y su etiqueta cambia a «No sincronizado». Lo que edites en TREK solo se envía a AirTrail si tienes activado «Escribir cambios de vuelta en AirTrail» en «Integraciones».',
  'help.guide.airtrail-import.tip.3':
    'Una conexión unida no es un único vuelo de AirTrail que se pueda sincronizar, así que se importa una sola vez: mantiene la etiqueta azul y, al pasar el ratón por encima, te lo indica. Lo mismo ocurre con un vuelo sincronizado si le añades una escala a mano.',

  // ── Screen: trip-roadtrip ─────────────────────────────────────────────────────────────
  'help.ctx.trip-roadtrip.title': 'Viaje por carretera',
  'help.ctx.trip-roadtrip.summary':
    'El plan mostrado como un solo trayecto: los mismos días y los mismos lugares, unidos como paradas con la conducción entre ellas, en un carril de la columna izquierda y en el mapa. Muestra la distancia y el tiempo de conducción, dónde tienes que repostar y qué hay junto a la carretera.',
  'help.ctx.trip-roadtrip.bullet.1':
    '«Días» y «Viaje por carretera», arriba en la columna izquierda, cambian entre el plan por días y el trayecto en coche. No se copia ni se modifica nada: «Días» muestra el plan exactamente como estaba.',
  'help.ctx.trip-roadtrip.bullet.2':
    'La parte superior del carril muestra los totales del viaje: «Distancia», «Tiempo de conducción» y «Paradas». Debajo hay una tarjeta por cada día con trayecto: el número y la fecha del día en una casilla y, después, píldoras con sus kilómetros y su tiempo de conducción, cuántas paradas tiene, lo que cruza y una insignia «Traza». Un vuelo, tren o ferry reservado aparece en la secuencia como una tarjeta aparte.',
  'help.ctx.trip-roadtrip.bullet.3':
    'Una parada numerada es un lugar que es el objetivo del día. Una parada en el camino, como un repostaje, un punto de carga o un área de descanso, muestra el icono de su tipo en lugar de un número y no se cuenta. Haz clic en un número para cambiar de un tipo a otro, haz clic en la insignia «Parada» para indicar cuánto tiempo te quedas, y arrastra una parada para moverla dentro de su día o a otro día.',
  'help.ctx.trip-roadtrip.bullet.4':
    'Entre dos paradas, una franja de conducción muestra la distancia y la duración del tramo. Haz clic en ella para ver «Rutas para este tramo», o haz clic en la ruta del mapa para desviar el tramo por un punto de paso.',
  'help.ctx.trip-roadtrip.bullet.5':
    'La columna derecha pasa a ser «En la ruta»: elige qué buscar y el día en una línea, la anchura del corredor y luego «Buscar». El más de un resultado, Añadir, lo incorpora al trayecto en el punto por donde realmente pasas, y el icono de la cama en un hotel añade una noche de estancia. «A mano» añade un lugar que la búsqueda no encontró, y los tres puntos junto al título importan una ruta de Google Maps.',
  'help.ctx.trip-roadtrip.bullet.6':
    '«Ajustes de conducción», debajo, incluye los límites, el coche y su autonomía, los tiempos de conducción diarios, qué evitar, cómo se dibuja la línea y si se muestran en el mapa los avisos actuales. Pertenecen al viaje, así que todos planifican con el mismo coche.',
  // roadtrip-mode
  'help.guide.roadtrip-mode.title': 'Ver el viaje como un solo trayecto en coche',
  'help.guide.roadtrip-mode.goal': 'Cambia el plan al modo de viaje por carretera y entiende lo que muestra el carril.',
  'help.guide.roadtrip-mode.step.1':
    'Haz clic en «Viaje por carretera» en el selector «Días» y «Viaje por carretera», arriba de la columna izquierda. El plan del día se sustituye por el trayecto, y el mapa muestra todos los días que tienen ruta.',
  'help.guide.roadtrip-mode.step.2':
    'La tarjeta de la parte superior del carril muestra los totales de todo el viaje: «Distancia», «Tiempo de conducción» y «Paradas». Se queda fija mientras te desplazas por los días.',
  'help.guide.roadtrip-mode.step.3':
    'Debajo hay una tarjeta por cada día con trayecto en coche; los días sin trayecto no aparecen. La cabecera de cada tarjeta muestra el número del día con la fecha debajo y, después, píldoras con la distancia y el tiempo del trayecto y el número de paradas de ese día.',
  'help.guide.roadtrip-mode.step.4':
    'Dentro de la tarjeta, el día se muestra como una secuencia: una parada numerada por cada lugar, un tramo de conducción entre cada par y la hora de llegada en el borde derecho. Un vuelo, tren o ferry reservado aparece en la secuencia como una tarjeta propia.',
  'help.guide.roadtrip-mode.step.5':
    'Haz clic en la cabecera de un día para plegarlo; la flecha del final gira. Un día plegado también se oculta en el mapa. Vuelve a hacer clic en la cabecera para mostrarlo.',
  'help.guide.roadtrip-mode.result':
    'La columna izquierda muestra el trayecto y el mapa muestra todos sus días. «Días» vuelve directamente al plan, sin cambios.',
  'help.guide.roadtrip-mode.tip.1':
    'La elección se guarda en tu cuenta para cada viaje, así que, después de recargar, en otro navegador o en otro dispositivo, el viaje vuelve a abrirse en la vista de viaje por carretera.',
  'help.guide.roadtrip-mode.tip.2':
    'El interruptor solo aparece cuando un administrador ha activado el complemento «Viaje por carretera» en «Complementos», dentro del panel de administración.',
  'help.guide.roadtrip-mode.tip.3':
    'En el móvil no hay selector: el complemento añade su propia pestaña «Viaje por carretera» junto a «Planificado».',
  // roadtrip-stops
  'help.guide.roadtrip-stops.title': 'Paradas en el camino y cuánto tiempo te quedas',
  'help.guide.roadtrip-stops.goal':
    'Convierte un lugar del trayecto en una parada por el camino e indica cuánto dura cada parada.',
  'help.guide.roadtrip-stops.step.1':
    'Haz clic en el número delante de una parada en el carril. Su etiqueta es «Convertir en parada del camino», y muestra debajo los tipos de parada como una fila de círculos de colores.',
  'help.guide.roadtrip-stops.step.2':
    'Elige un tipo. Pasa el cursor por un círculo para ver su nombre: «Alojamiento», «Combustible», «Recarga», «Área de descanso», «Camping», «Comida» o «Lugares de interés». El número cambia al icono de ese tipo y las paradas de debajo se vuelven a numerar.',
  'help.guide.roadtrip-stops.step.3':
    'Una parada por el camino no es un destino, así que la cabecera del día cuenta una parada menos.',
  'help.guide.roadtrip-stops.step.4':
    'Vuelve a hacer clic en el icono, «Cambiar el tipo de parada», y elige «Volver a ser un destino» para que la parada recupere su número.',
  'help.guide.roadtrip-stops.step.5':
    'Cada parada tiene una insignia «Parada», que muestra un más mientras no haya nada planificado. Haz clic en ella para abrir «Tiempo en la parada».',
  'help.guide.roadtrip-stops.step.6':
    'Ajusta la duración con el control deslizante, con los botones de menos y más o con uno de los valores predefinidos. «Salida» cambia, mientras que «Llegada» se mantiene a la hora a la que llega el trayecto. Después, haz clic en «Guardar».',
  'help.guide.roadtrip-stops.result':
    'La etiqueta Parada de la parada que has cambiado muestra la nueva duración, y todas las horas de llegada posteriores se ajustan. Una parada que cambiaste a un tipo y luego devolviste vuelve a ser un destino numerado.',
  'help.guide.roadtrip-stops.tip.1':
    'La duración de la estancia pertenece al lugar, no a cada visita: un lugar planificado en dos días tiene la misma duración en ambos.',
  'help.guide.roadtrip-stops.tip.2':
    'Las paradas por el camino también aparecen en «Días». Si desactivas «Mostrar también en Días», en «Paradas de servicio» dentro de «Ajustes de conducción», solo aparecen en «Viaje por carretera».',
  'help.guide.roadtrip-stops.tip.3': '«Sin parada», en el mismo cuadro, vuelve a quitar el tiempo.',
  'help.guide.roadtrip-stops.tip.4':
    'Haz clic en una parada por el camino o en una noche reservada para abrir su tarjeta sobre el mapa. Con «Viaje por carretera» activado, Editar abre ahí el cuadro compacto que usa la búsqueda en lugar del formulario de lugar, y «Más detalles», en ese cuadro, abre el formulario completo.',
  // roadtrip-corridor
  'help.guide.roadtrip-corridor.title': 'Encontrar gasolineras, sitios para comer y dónde dormir en la ruta',
  'help.guide.roadtrip-corridor.goal':
    'Busca a lo largo de la carretera por la que conduces y añade lo que encuentres al tramo correcto.',
  'help.guide.roadtrip-corridor.step.1':
    'En «Se busca», abre la lista y marca lo que necesites. Puedes combinar Combustible, Recarga, «Área de descanso», Camping, Alojamiento, Comida y «Lugares de interés»: la lista sigue abierta para elegir otra opción, y después el campo muestra un icono por cada tipo.',
  'help.guide.roadtrip-corridor.step.2':
    'Elige el día en el desplegable al final de esa misma línea. Ofrece los días que tienen tarjeta en el carril, y «Buscar» espera hasta que se calcule la ruta del día elegido.',
  'help.guide.roadtrip-corridor.step.3':
    'En «En un radio de», elige hasta qué distancia buscar a cada lado de la carretera, 2 km, 5 km o 10 km, y haz clic en «Buscar».',
  'help.guide.roadtrip-corridor.step.4':
    'Los resultados se agrupan por tipo, en el orden en que pasas por ellos. Cada uno indica a qué distancia está de la ruta y en qué punto del trayecto del día queda.',
  'help.guide.roadtrip-corridor.step.5':
    'Haz clic en Añadir, el más de un resultado. «Añadir como parada» indica en qué día y en qué posición se añade, y pide el «Tipo de parada» y el «Tiempo en la parada»; un punto de carga también muestra «Disponibilidad y tarifas». Añadir lo incorpora al trayecto, y «Más detalles» abre en su lugar el formulario completo del lugar.',
  'help.guide.roadtrip-corridor.result':
    'La parada añadida aparece en la ruta en el punto por donde pasas, con el icono de su tipo. La ruta del día se recalcula pasando por la parada, y la lista se vacía: vuelve a buscar para la siguiente parada.',
  'help.guide.roadtrip-corridor.tip.1':
    'No se busca nada hasta que pulsas «Buscar»: cada búsqueda envía muchas peticiones a un servicio compartido.',
  'help.guide.roadtrip-corridor.tip.2':
    '«Filtrar por nombre» filtra los resultados sin hacer una búsqueda nueva, y «Borrar resultados» vacía la lista y quita sus marcadores. Haz clic en un resultado para verlo en el mapa.',
  'help.guide.roadtrip-corridor.tip.3':
    'También puedes arrastrar un resultado del mapa a la ruta. Así eliges tú el tramo cuando pasas dos veces por la misma carretera. «A mano», junto a «Buscar», añade un lugar que la búsqueda no encontró, buscándolo por su nombre.',
  // roadtrip-via
  'help.guide.roadtrip-via.title': 'Hacer pasar un tramo por un punto intermedio',
  'help.guide.roadtrip-via.goal': 'Haz que un tramo vaya por la carretera que quieres, sin añadirle una parada.',
  'help.guide.roadtrip-via.step.1':
    'Muestra en el mapa el tramo que quieres: haz clic en una parada del carril y cierra la tarjeta que se abre sobre el mapa.',
  'help.guide.roadtrip-via.step.2':
    'Haz clic en la ruta dibujada. Se añade un punto de paso en el tramo en el que hiciste clic, y el tramo se recalcula pasando por él.',
  'help.guide.roadtrip-via.step.3':
    'El carril se actualiza: la cabecera del día muestra la nueva distancia y el nuevo tiempo de conducción, y todas las horas de llegada posteriores al punto de paso cambian con ella.',
  'help.guide.roadtrip-via.step.4':
    'Pasa el ratón por encima del tirador para ver qué hace: «Arrastra para cambiar la ruta, clic derecho para quitar». Arrástralo a otro sitio y el tramo se vuelve a dibujar pasando por el nuevo punto.',
  'help.guide.roadtrip-via.step.5':
    'Haz clic derecho en el punto de arrastre para quitarlo. El tramo vuelve a usar la ruta directa.',
  'help.guide.roadtrip-via.result':
    'El tramo sigue la carretera que has elegido, y se vuelven a calcular la distancia, el tiempo de conducción y las horas de llegada del día.',
  'help.guide.roadtrip-via.tip.1':
    'Un punto de paso no es una parada: no tiene número, ni estancia, ni hora de llegada, y no cuenta entre las paradas del día.',
  'help.guide.roadtrip-via.tip.2':
    'Los tiradores solo aparecen a partir del nivel de zoom 9, así que en un mapa que muestra todo el viaje se ve la línea sin ellos.',
  'help.guide.roadtrip-via.tip.3':
    'Los clics a más de dos kilómetros de cualquier tramo dibujado se ignoran, igual que los clics sobre un vuelo, un tren o un ferry.',
  // roadtrip-alternatives
  'help.guide.roadtrip-alternatives.title': 'Probar otra forma de recorrer un tramo',
  'help.guide.roadtrip-alternatives.goal':
    'Mira las otras rutas que propone el servicio de rutas para una parte del trayecto y elige una.',
  'help.guide.roadtrip-alternatives.step.1':
    'Haz clic en una franja de conducción de la barra lateral, la fila entre dos paradas que muestra la distancia y la duración del tramo. Su etiqueta es «Otras rutas».',
  'help.guide.roadtrip-alternatives.step.2':
    '«Rutas para este tramo» se abre sobre el mapa, con una entrada por carretera y su longitud. El mapa dibuja cada carretera con su tiempo de conducción: la actual en azul intenso y las demás en un azul más claro.',
  'help.guide.roadtrip-alternatives.step.3':
    'Pasa el cursor por una opción para resaltar esa carretera. «Actual» es la carretera que usas y «La más rápida», la más rápida; las demás indican cuánto más lentas son o qué tipo de vía evitan.',
  'help.guide.roadtrip-alternatives.step.4':
    'Haz clic en una opción para usar esa ruta, o en Cerrar para mantener la actual.',
  'help.guide.roadtrip-alternatives.result':
    'El tramo va ahora por la carretera que elegiste, y también cambian la distancia en la columna lateral y las horas de llegada posteriores.',
  'help.guide.roadtrip-alternatives.tip.1':
    'Cuando eliges otra carretera, TREK la comprueba primero con el calculador del viaje por carretera. Después mantiene el tramo en esa carretera con los mínimos puntos de paso necesarios, y sustituye los que ya tuviera el tramo. Una carretera que el calculador no puede seguir no se guarda. Si eliges la carretera propuesta por el calculador, se vuelven a quitar los puntos de paso.',
  'help.guide.roadtrip-alternatives.tip.2':
    '«Sin autopista», «Sin peajes» y «Sin ferri» los calcula un segundo motor con su propio modelo de velocidad, así que sus tiempos no se pueden comparar con los demás.',
  // roadtrip-limits
  'help.guide.roadtrip-limits.title': 'Configurar el coche y los límites de conducción',
  'help.guide.roadtrip-limits.goal':
    'Indica a TREK qué vehículo conduces y cuánto quieres conducir sin hacer una pausa.',
  'help.guide.roadtrip-limits.step.1':
    '«Ajustes de conducción» está debajo de la búsqueda, en la columna derecha. Sus insignias muestran lo que has configurado; haz clic para abrirlo.',
  'help.guide.roadtrip-limits.step.2':
    'En la sección de conducción, «Trayecto más largo seguido» y «Conducción por día» se indican en minutos. Un campo vacío significa desactivado, y no se marca nada.',
  'help.guide.roadtrip-limits.step.3':
    'En «Vehículo», indica qué conduces. «Gasolina» solo reposta en gasolineras, «Eléctrico» solo en puntos de carga y «Ambos» en los dos.',
  'help.guide.roadtrip-limits.step.4':
    'Escribe tú mismo la «Autonomía por depósito» o la «Autonomía por carga». O abre «Calcular a partir del coche», bajo «Repostar hasta»: con el «Depósito» y el «Consumo», o con la «Batería», el «Consumo» y el «Desgaste batería», calcula la autonomía.',
  'help.guide.roadtrip-limits.step.5':
    '«Evitar si es posible», en la columna izquierda, es una preferencia, no una prohibición: si un día no hay otra opción, se usa igualmente esa carretera y se muestra un aviso en su cabecera.',
  'help.guide.roadtrip-limits.step.6':
    'Haz clic en Cerrar. Las insignias de la tarjeta muestran lo que has configurado, y el carril marca cada tramo y cada día que supera un límite.',
  'help.guide.roadtrip-limits.result':
    'Las insignias de la tarjeta muestran lo que has configurado, y cada tramo y cada día que supera un límite tiene una insignia en el carril.',
  'help.guide.roadtrip-limits.tip.1':
    'Los ajustes son del viaje, así que todos sus participantes planifican con el mismo coche y los mismos límites.',
  'help.guide.roadtrip-limits.tip.2':
    '«Repostar hasta» indica hasta qué nivel llena el depósito o la batería cada parada, porque en carretera nadie carga al 100 %. Una parada de repostaje o de carga puede tener su propio valor con la insignia de la batería de su fila.',
  'help.guide.roadtrip-limits.tip.3':
    'En «Línea de la ruta», «Conectar los días» también calcula el trayecto desde la última parada de un día hasta la primera del día siguiente. «Empezar y terminar cada día en tu alojamiento» hace que cada día empiece y termine en el alojamiento reservado para esas noches. «Un color por día» muestra cada día en su propio color.',
  // roadtrip-day-window
  'help.guide.roadtrip-day-window.title': 'Fijar una hora de inicio y de fin para el día de conducción',
  'help.guide.roadtrip-day-window.goal': 'Deja de conducir a la hora que elijas y define dónde debe terminar el día.',
  'help.guide.roadtrip-day-window.step.1':
    'Abre «Ajustes de conducción» en la columna derecha y busca «Horario diario» en la columna izquierda del cuadro.',
  'help.guide.roadtrip-day-window.step.2':
    'Indica un «Inicio del día». Por sí solo no hace nada: hacen falta las dos horas, como indica la nota de debajo.',
  'help.guide.roadtrip-day-window.step.3':
    'Indica un «Fin del día». El trayecto se detiene ahora a esa hora y continúa a la mañana siguiente, con una fila «Fin del día» y otra «Continuar viaje» en la columna lateral.',
  'help.guide.roadtrip-day-window.step.4':
    'En «Final del día», elige «En la ruta» para parar en la carretera a la hora de fin, o «En el último lugar» para detenerte antes de que el siguiente trayecto lo sobrepase.',
  'help.guide.roadtrip-day-window.step.5':
    'Haz clic en Cerrar. La tarjeta «Ajustes de conducción» muestra las dos horas en una insignia.',
  'help.guide.roadtrip-day-window.result':
    'El trayecto se divide en días de viaje de la duración que hayas fijado, y lo que no cabe continúa en días calculados después del último. Tus días y sus lugares no cambian.',
  'help.guide.roadtrip-day-window.tip.1':
    'Si borras cualquiera de las dos horas, esta función se vuelve a desactivar. Las horas que fijes tú en una parada siempre tienen prioridad.',
  'help.guide.roadtrip-day-window.tip.2':
    'Si configuras horarios de viaje diarios, los días siempre quedan conectados: el trayecto desde la última parada de un día hasta la primera del día siguiente se calcula y se cuenta.',
  'help.guide.roadtrip-day-window.tip.3':
    'Cada final de día también es un marcador en el mapa: una luna con el número del día. Arrástralo por la ruta, o sobre un lugar, para terminar el día en otro sitio. Haz clic con el botón derecho para recuperar el final automático. «Restaurar finales de día automáticos», en este cuadro, deshace todos estos cambios. Para terminar un día en una parada, haz clic en la parada y activa «Terminar el día aquí» en su tarjeta.',
  // roadtrip-refuel
  'help.guide.roadtrip-refuel.title': 'Repostar antes de quedarte sin combustible',
  'help.guide.roadtrip-refuel.goal':
    'Encuentra dónde repostar en la parte de la ruta a la que aún llega el coche y añádelo al trayecto.',
  'help.guide.roadtrip-refuel.step.1':
    'Con una autonomía definida, la columna lateral muestra una franja en el tramo donde se acaba el combustible o la batería: «Aquí se vacía el depósito», o «La batería se agota aquí» en un coche eléctrico. Debajo verás en qué punto del tramo ocurre.',
  'help.guide.roadtrip-refuel.step.2':
    'El icono de la lámpara de la franja es el botón: «Buscar combustible», o «Buscar recarga» en un coche eléctrico. Busca a lo largo de la carretera antes de ese punto y muestra «Buscando a lo largo de la ruta…» mientras tanto.',
  'help.guide.roadtrip-refuel.step.3':
    'Se muestran hasta tres gasolineras, cada una con su distancia a la ruta y la autonomía que te quedaría.',
  'help.guide.roadtrip-refuel.step.4':
    'El botón más de una oferta la añade como parada para repostar. «Añadir como parada» se abre con el tipo y la hora ya rellenados, y «Añadir» la coloca en el tramo, en el punto exacto por el que pasa la ruta.',
  'help.guide.roadtrip-refuel.result':
    'La parada aparece en el tramo correcto con su propio icono, y la autonomía se vuelve a contar desde esa parada. La franja se desplaza al punto donde ahora se vacía el depósito, o desaparece si puedes llegar al final del trayecto sin otra parada.',
  'help.guide.roadtrip-refuel.tip.1':
    'La autonomía se cuenta desde la última parada de repostaje o de carga, aunque sea de otro día. Tu tipo de vehículo decide qué paradas cuentan: con «Gasolina», solo las gasolineras; con «Eléctrico», solo los puntos de carga.',
  'help.guide.roadtrip-refuel.tip.2':
    'La búsqueda mira la carretera antes del punto en que se acaba el combustible, deja un margen de reserva y cuenta el desvío dos veces, así que todos los sitios que propone son realmente alcanzables.',
  'help.guide.roadtrip-refuel.tip.3':
    'Si no hay resultados, puedes volver a buscar: la lámpara cambia a «Reintentar», porque la búsqueda de lugares es un servicio compartido que a veces no responde a tiempo.',
  // roadtrip-track
  'help.guide.roadtrip-track.title': 'Hacer que un día siga un track importado',
  'help.guide.roadtrip-track.goal':
    'Usa para el trayecto de un día una ruta panorámica que hayas importado como track GPX o KML.',
  'help.guide.roadtrip-track.step.1':
    'Haz clic en la etiqueta «Traza» en la cabecera de un día. El diálogo se abre en ese día.',
  'help.guide.roadtrip-track.step.2':
    'Elige una traza. Cada una muestra su longitud y si sigue la ruta de este día o a qué distancia está. La más cercana aparece primero.',
  'help.guide.roadtrip-track.step.3':
    'Haz clic en «Seguir esta traza». TREK añade puntos de paso donde la ruta se aleja más del track y vuelve a calcularla, y repite el proceso varias veces.',
  'help.guide.roadtrip-track.step.4':
    'El cuadro indica cuántos puntos de paso se han colocado y cuánto se ajusta ahora la ruta al track, o que la ruta ya seguía el track. «Quitar puntos de paso», abajo a la izquierda, los elimina, y el calculador de rutas vuelve a planificar el día. Al cerrar el cuadro se conserva el track.',
  'help.guide.roadtrip-track.result':
    'El trayecto del día sigue el track en lugar de la carretera que habría elegido el calculador. Pasa el cursor por su insignia «Traza» para ver el nombre del track. Cuando los puntos de paso mantienen el trayecto sobre el track, la insignia también aparece resaltada.',
  'help.guide.roadtrip-track.tip.1':
    'El cuadro muestra los lugares del viaje que tienen un recorrido: un GPX o KML importado con «Importar archivo» en la columna de lugares, bajo «Días», con «Rutas» o «Tracks (con geometría de ruta)» marcado en un GPX, o «Rutas (LineStrings)» en un KML. «Importar archivo» solo aparece mientras el complemento «Excursiones» está desactivado; con «Excursiones» activado, un GPX se convierte en una excursión, y este cuadro no la muestra. Mientras el viaje no tenga ningún track, ningún día muestra la insignia.',
  'help.guide.roadtrip-track.tip.2':
    'Seguir un track sustituye los puntos de paso que ya tenían los tramos del día, así que ajusta un tramo a mano después de seguir el track, no antes.',
  'help.guide.dateless-trip.step.1': 'Haz clic en «Nuevo viaje» y ponle un nombre al viaje.',
  'help.guide.edit-trip.tip.2':
    'Los compañeros de viaje que añadas o quites aquí se aplican al momento, sin pulsar Actualizar.',
  'help.guide.trip-reminder.result':
    'Recibirás el recordatorio los días que hayas elegido antes del inicio del viaje, por los canales en los que recibes notificaciones.',
  'help.guide.upcoming-reservations.step.1':
    'Busca «Próximas reservas» en la columna derecha. Muestra las seis próximas reservas de todos tus viajes, de la más cercana a la más lejana, con su fecha, hora y tipo.',
  'help.guide.half-company-holiday.step.1': 'Cambia la barra de herramientas a «Festivo de empresa».',
  'help.guide.edit-holiday-calendar.result': 'La cuadrícula y la leyenda se actualizan al momento con cada cambio.',
  'help.guide.person-color.result': 'Todos los días que registró esa persona aparecen ahora con el nuevo color.',
  'help.guide.answer-fusion-request.step.1':
    'Abre «Vacaciones» después de que alguien te invite. El cuadro «Solicitud de fusión» se abre solo.',
  'help.guide.log-for-partner.step.1':
    'En la tarjeta «Personas», haz clic en el nombre de la persona. Una marca de verificación indica que está seleccionada.',
  'help.guide.dissolve-fusion.step.1': 'Abre «Ajustes».',
  'help.guide.country-places.step.2': 'Haz clic en la insignia «Lugares» de la tarjeta, la del marcador.',
  'help.guide.search-place.tip.2':
    'Si la región ya está marcada, la ventana emergente te pregunta si quieres quitarla.',
  'help.guide.tour-activity-stats.step.4':
    'Las insignias de la derecha indican en qué se basan las sumas: «Planeado» para las excursiones que cuentan según la planificación del viaje y «Grabado» para las que tienen vinculado un track real. «Pendientes», «Sin día» y «Sin fecha» cuentan las excursiones que aún no se incluyen. La i explica la regla.',
  'help.guide.move-to-list.step.2':
    'Haz clic en «Duplicar en lista» para mantenerlos también aquí, o en «Mover a lista» para quitarlos de esta lista.',
  'help.guide.accept-list-invite.title': 'Aceptar una invitación a una lista',
  'help.guide.tour-collection-add-to-trip.step.3':
    'En «Puntos de ruta», elige la casilla con los puntos de ruta para añadir el inicio, las paradas y el final en su orden, o «Solo la línea» para añadir únicamente la línea guardada.',
  'help.guide.tour-collection-manage.step.1':
    'Abre una lista. Cada excursión guardada muestra su dificultad, su tipo, el viaje desde el que se guardó, su distancia y desnivel, y cuántos puntos de ruta tiene. Pasa el cursor por el nombre del viaje para ver quién la guardó.',
  'help.guide.entry-draft.step.1': 'En el editor, activa «Borrador» en la columna derecha.',
  'help.guide.journey-map-layers.step.3':
    'Haz clic en un marcador hueco o en un punto pequeño del mapa. Una tarjeta te dice qué es: un lugar planeado con su día, o una estancia con «Abrir entrada», que te lleva a la crónica del día a la que pertenece.',
  'help.guide.journey-keep-route.step.3': 'Haz clic en «Guardar ruta».',
  'help.guide.journey-day-stays.step.3':
    'Haz clic en «No es un lugar que visitara» en la estancia que no quieras. La estancia desaparece de la lista.',
  'help.guide.journey-take-over-day.step.3':
    'Si quieres una sola entrada para todo el día, cambia «Entradas» a «Crónica del día»: una única entrada recoge todas las estancias elegidas con sus horas.',
  'help.guide.journey-auto-prepare.step.2': 'En «Días grabados», activa «Preparar automáticamente los días grabados».',
  'help.guide.photo-location.step.2': 'En «Fotos», activa «Ubicar entradas según sus fotos».',
  'help.guide.link-trip.tip.3':
    'Si escribes una entrada en un día de un viaje que aún no está vinculado, el editor te ofrece «Vincular viaje» en la propia entrada.',
  'help.ctx.settings-plugins.summary':
    'Tus ajustes personales de los plugins que ha instalado el administrador: las claves y preferencias que te pide cada plugin y un registro de lo que han hecho los plugins en tu nombre. La pestaña solo aparece mientras haya algún plugin activo.',
  'help.ctx.settings-about.bullet.3':
    'En Ko-fi, Buy Me a Coffee y Discord puedes apoyar a TREK o hablar con las personas que lo desarrollan.',
  'help.guide.language-region.step.3':
    'Elige la «Moneda de visualización», o deja «Moneda del viaje» para ver cada viaje en su propia moneda. Después elige «Unidad de temperatura», «Unidad de distancia», «Formato de hora» y el día en que empieza la semana en «La semana comienza el».',
  'help.guide.travel-map-prefs.step.3':
    '«Explorar lugares en el mapa» muestra la píldora de categorías para buscar lugares cercanos. «Difuminar códigos de reserva» oculta los números de confirmación hasta que pasas el cursor por encima o los tocas. «Optimizar la ruta desde el alojamiento» hace que el día empiece y termine en tu hotel.',
  'help.guide.web-push-device.step.2':
    'En la tarjeta «Notificaciones» de arriba, la columna Push define qué eventos se envían a tus dispositivos.',
  'help.guide.connect-airtrail.goal': 'Haz que TREK importe y sincronice los vuelos de tu propio AirTrail.',
  'help.guide.connect-dawarich.goal': 'Haz que TREK sepa por dónde has ido realmente, a partir de tu propio Dawarich.',
  'help.guide.tour-connect-wanderer.goal':
    'Haz que TREK lea las rutas de tu propio wanderer para importarlas como excursiones.',
  'help.guide.tour-wanderer-watch.title': 'Recibir un aviso cuando cambien tus rutas de wanderer',
  'help.guide.plugin-settings.tip.2':
    'Un canal de plugin en «Notificaciones» tiene un botón Configurar que abre esta página.',
  'help.guide.default-user-settings.result':
    'Las cuentas nuevas, y todos los que nunca han cambiado estos ajustes, verán lo que elijas.',
  'help.guide.own-routing-engine.goal':
    'Calcula las rutas de los días y de los viajes por carretera con tu propio servidor OSRM o Valhalla en lugar de los públicos.',
  'help.guide.admin-passkeys.tip.1':
    'Si TREK aún no puede determinar un dominio, verás un aviso, y las passkeys seguirán ocultas hasta que definas APP_URL o el Relying Party ID.',
  'help.guide.rotate-jwt-secret.step.1':
    'Al final de la pestaña «Ajustes», en «Zona de peligro», haz clic en Renovar junto a «Rotar secreto JWT».',
  'help.guide.storage-backends.tip.3':
    'TREK puede volver a descargar las cachés de fotos, así que replicarlas suele ser un desperdicio de espacio.',
  'help.guide.admin-channels.step.3':
    'En la tarjeta «Notificaciones» de abajo, elige para cada evento por qué canales se envía: «Nueva versión disponible», «Fallo de réplica de almacenamiento» y «Región de kayak pedida». Cada interruptor se guarda al momento.',
  'help.guide.notification-defaults.tip.1':
    '«Desactivado» es un valor predeterminado que cada usuario puede activar; «Bloqueado» lo desactiva para todos.',
  'help.ctx.notifications.bullet.4':
    'Junto a la hora de cada notificación, «Marcar como leída» (la doble marca) y Eliminar (la papelera) actúan solo sobre esa. «Marcar todo como leído» y «Eliminar todo», arriba, actúan sobre toda la lista.',
  'help.guide.read-notifications.tip.2':
    'Una notificación sin botón es solo informativa. Léela en el panel y márcala ahí como leída.',
  'help.guide.filter-notifications.result':
    'La lista muestra solo lo que aún no has leído, empezando por lo más reciente.',
  'help.guide.delete-notifications.title': 'Eliminar notificaciones',
  'help.guide.notification-settings.goal':
    'Elige qué eventos aparecen en la campana y cuáles te llegan también por correo, webhook, ntfy o push.',
  'help.guide.public-link.step.4': 'Haz clic en «Crear enlace», luego en Copiar, y envíalo.',
  'help.guide.link-journal.step.2': 'Haz clic en «Vincular un diario» y elige uno de tus diarios en «Elige un diario».',
  'help.guide.dawarich-stays.title': 'Convertir una estancia grabada en un lugar',
  'help.guide.dawarich-stays.tip.2':
    'Si eliminas un lugar que procede de una estancia, la estancia vuelve a la lista como pendiente.',
  'help.guide.leave-stop-off-route.goal':
    'Mantén una parada en el día sin que la ruta pase por ella, para un lugar al que vas a pie o que solo quieres ver en el mapa.',
  'help.guide.day-route.tip.4':
    'Si quieres una parada en el día pero no en la ruta, elige «Quitar de la ruta» en su menú.',
  'help.guide.move-booking-day.step.2':
    'Arrastra la fila a la cabecera de la tarjeta de otro día. Una reserva de un día se mueve entera a ese día. En una reserva de varios días, la fila «Salida» cambia el día en que empieza y la fila «Llegada», el día en que termina.',
  'help.guide.place-image-from-file.title': 'Usar una foto adjunta como imagen del lugar',
  'help.guide.place-image-from-file.tip.2': 'También se ofrecen las fotos fijadas a la parada o adjuntas a su reserva.',
  'help.guide.place-own-hours.step.5':
    'Haz clic en Actualizar. La tarjeta muestra ahora tu horario en «Horario de apertura», y el «Abierta» o «Cerrada» de arriba se basa en él.',
  'help.guide.confirm-stay-booking.step.3':
    'Haz clic en «Pendiente», arriba. Su descripción emergente dice «Marcar como Confirmado», y el punto se vuelve verde.',
  'help.guide.map-nearby-places.tip.4':
    'Si falla la búsqueda de una categoría, esta muestra un punto rojo, y «Buscar en esta zona» se vuelve rojo con un icono de advertencia: haz clic en él para volver a intentarlo.',
  'help.guide.tour-map-lines.tip.1':
    'Al plegar un día en la columna de días, sus excursiones y sus paradas se ocultan en el mapa.',
  'help.guide.car-stops.step.3':
    'Escribe un título en la cabecera. En «Ruta», elige en «De» dónde recoges el coche y en «A» dónde lo devuelves; los lugares del viaje se te sugieren antes de escribir. «Recogida» y «Hora recogida» indican cuándo lo recoges, y «Devolución» y «Hora devolución», cuándo lo devuelves.',
  'help.guide.transport-details.step.1':
    'En la pestaña «Transportes», haz clic en una tarjeta. Sus detalles se abren sobre la pestaña, con la cabecera del mismo color que la tarjeta. La fila de un transporte en el plan del día abre los mismos detalles.',
  'help.guide.export-transports-csv.tip.2':
    'La pestaña «Reservas» tiene el mismo icono y genera su propio archivo, que termina en bookings.csv.',
  'help.guide.group-sort-bookings.step.2':
    'En «Agrupar por», elige «Estado», «Día», «Tipo» o «Sin agrupar». La pestaña se ordena al momento en esas secciones.',
  'help.guide.export-bookings-csv.result':
    'Tu navegador descarga un archivo con el nombre del viaje y de la pestaña, por ejemplo autumn-in-japan-bookings.csv, con una fila por cada reserva que mostraba la pestaña.',
  'help.guide.arrange-packing-list.result':
    'Las listas quedan en el orden en que las colocaste, y los artículos se ordenan de la A a la Z hasta que lo desactives. TREK sigue guardando tu propio orden.',
  'help.guide.count-packed-pieces.step.2':
    'Aparece un contador delante de la cantidad, 0/5, con un menos y un más. Haz clic en el más por cada unidad que metas en la bolsa.',
  'help.guide.expense-receipts.step.4':
    'De vuelta en el registro, la fila tiene una etiqueta «Recibo» junto a su nombre, con el número entre paréntesis si hay varios. Haz clic en ella para abrir el recibo.',
  'help.guide.final-budget.tip.3':
    'Quien haya salido del viaje sigue teniendo una fila en «Saldos» y «Presupuesto final» mientras se le deba dinero o deba dinero.',
  'help.guide.files-sync-settings.step.2':
    'La barra de flujo muestra TREK y tu gestor con los documentos que tiene cada uno, y dos carriles entre ellos: «Hacia el gestor» y «Desde el gestor». Haz clic en «Hacia el gestor» para desactivarlo. El carril se queda en gris y la línea bajo los carriles dice «Solo entrada». Vuelve a hacer clic para activarlo de nuevo.',
  'help.guide.files-sync-settings.tip.4':
    'Solo el propietario del viaje o un administrador pueden cambiar todo esto. Los demás miembros ven la barra de flujo con una línea como «Los documentos van en ambos sentidos», pero no «Ajustes».',
  'help.guide.manage-notes.step.2':
    '«Expandir» abre la nota completa: todo el texto, su «Sitio web» y sus «Archivos». Haz clic en un archivo para previsualizarlo. Editar, abajo, pasa directamente al editor; la cruz de arriba a la derecha vuelve a cerrar la nota.',
  'help.guide.note-categories.goal':
    'Organiza las notas del grupo en categorías con nombre y color, y muestra una categoría cada vez.',
  'help.guide.note-categories.tip.1':
    'La papelera solo elimina categorías que no usa ninguna nota. Una categoría que todavía usan algunas notas se queda en la lista hasta que pases esas notas a otra categoría.',
  'help.guide.roadtrip-reorder.title': 'Reordenar una parada o pasarla a otro día',
  'help.guide.roadtrip-reorder.tip.3':
    'TREK no te pregunta por las horas que hayas fijado: el carril recalcula el día al momento y marca las paradas a las que ya no se puede llegar a tiempo.',
  'help.guide.roadtrip-overnight.step.3':
    'Arriba del cuadro, «Pernoctar» añade una noche de estancia y «Parada» la convierte en una parada de un rato. Un hotel se abre con «Pernoctar» y un camping, con «Parada». Para una noche solo se pide el «Registro de entrada», que puedes dejar vacío.',
  'help.guide.roadtrip-stop-fill.step.1':
    'En una parada de repostaje o de carga del carril, haz clic en la insignia de la batería. Muestra el nivel hasta el que se llena en esa parada: atenuada mientras usa tu valor de «Repostar hasta», y sólida cuando tiene un valor propio.',
  'help.guide.roadtrip-bookings.step.1':
    'Reserva el trayecto como «Vuelo», «Tren», Ferry, «Crucero» o «Autobús» en su día, con la ubicación de ambos extremos. La ruta en coche lo incluye automáticamente: la carretera termina en la terminal de salida y continúa donde llegas.',
  'help.guide.roadtrip-google-import.result':
    'Las paradas de la ruta se añaden después de la última parada de ese día, y la ruta del carril y del mapa pasa por ellas.',
  'help.guide.roadtrip-hazards.step.3':
    'Los avisos se muestran en el mapa como zonas. Haz clic en uno para ver de qué trata, qué servicio lo ha notificado y cuándo se actualizó por última vez.',
  'help.ctx.trip-tours.bullet.2':
    'Arriba, «Importar GPX o KML» importa archivos como excursiones. El botón de filtro que hay debajo («Todos» al principio, con el número de excursiones) filtra la lista por estado, origen, límite de ruta y tipo.',
  'help.guide.tour-show-list.step.2':
    'Cada fila es una excursión. La barra de color es su línea en el mapa, y la casilla redonda muestra el límite de ruta (T1 a T6) de una caminata planificada en TREK o el icono de su tipo. Las insignias bajo el nombre muestran los días en que está, su duración, distancia y desnivel positivo. En una excursión de varios días, la luna con un número indica cuántas etapas tiene.',
  'help.guide.tour-add-to-day.title': 'Poner una excursión en un día',
  'help.guide.tour-add-to-day.tip.2':
    'Si el viaje termina antes de la última etapa, la opción muestra la última etapa que cabe, y las siguientes se quedan sin día.',
  'help.guide.tour-day-times.step.3':
    'Haz clic en Actualizar. La fila muestra ahora inicio → fin. Una hora de fin calculada aparece más clara, con ≈ si es una estimación, ≥ mientras alguna estancia no tenga hora y +1 si pasa de medianoche. Pasa el cursor por encima para ver cómo se ha calculado.',
  'help.guide.tour-remove-from-day.goal': 'Quita una excursión de la planificación sin eliminarla.',
  'help.guide.tour-filter-list.goal':
    'Reduce una lista larga a las excursiones que buscas: sin planificar, de un archivo o de un tipo.',
  'help.guide.tour-filter-list.result':
    'La lista muestra solo las excursiones filtradas; las demás siguen en el viaje.',
  'help.guide.tour-hide-on-map.result':
    'En tu mapa solo aparecen las excursiones que quieres, y las ocultas siguen en la lista, atenuadas.',
  'help.guide.tour-import-plan-tab.result':
    'El track es ahora una excursión del viaje: una fila en la lista con la insignia GPX y una línea en el mapa.',
  'help.guide.tour-detail-read.title': 'Abrir una excursión y consultar su tarjeta',
  'help.guide.tour-detail-read.step.7': 'Cierra la tarjeta con la X de arriba o pulsa Escape.',
  'help.guide.tour-rename-colour.goal':
    'Ponle a una excursión un nombre que reconozcas y un color de línea que se vea bien en el mapa.',
  'help.guide.tour-take-along.title': 'Descargar una excursión al móvil o al GPS',
  'help.guide.tour-take-along.tip.4':
    'En la pestaña «Excursiones», la misma descarga está arriba de la columna izquierda. Si la excursión tiene cambios sin guardar, la descarga te pide que guardes primero.',
  'help.guide.tour-copy-keep.tip.1':
    'Las dos son copias: los cambios que hagas después en la excursión no afectan ni a la copia ni a la versión que guardaste en la colección.',
  'help.guide.tour-packing-link.step.2':
    'En «Vincular con», elige «Toda la lista de equipaje» o una de sus listas. Cada fila muestra cuántos artículos contiene.',
  'help.guide.tour-files.title': 'Adjuntar archivos a una excursión',
  'help.guide.tour-activity-link.title': 'Vincular el track que hiciste realmente',
  'help.guide.tour-activity-link.tip.2':
    'Solo puedes vincular un track importado que no se haya usado para planificar una excursión, y cada track solo se puede vincular a una excursión.',
  'help.guide.tour-activity-compare.step.4':
    '«Cambiar», debajo del track, elige otra grabación. «Desvincular» la quita de la excursión, y el track sigue en el viaje como importación.',
  'help.guide.tour-origin-check.step.3':
    'Una excursión que dibujaste en la pestaña «Excursiones» indica «planificada en TREK», con el día en que se creó en «Creado».',
  'help.ctx.trip-tour-planner.bullet.2':
    'El carril izquierdo es el editor. Si no hay nada abierto, ofrece «Planificar nueva excursión». Una excursión abierta muestra su nombre, su tipo, sus puntos de ruta, las tarjetas propias de su tipo y sus detalles, con Descartar y Guardar abajo.',
  'help.guide.tour-open-workspace.step.2':
    'El carril izquierdo es el editor. Si no hay ninguna excursión abierta, ofrece «Planificar nueva excursión», que empieza una excursión en el mapa.',
  'help.guide.tour-open-workspace.tip.3':
    'Si abres otra excursión mientras el editor tiene cambios sin guardar, primero se te pregunta: «Descartar cambios» o seguir editando.',
  'help.guide.tour-draw-route.step.5':
    'Haz clic en los siguientes puntos en el orden en que vas a recorrerlos. Cada clic añade el punto como nuevo final y, a partir de dos puntos, TREK planifica la ruta por los caminos.',
  'help.guide.tour-type-profile.goal':
    'Elige el tipo de excursión y, si es en bici, su perfil, para que la ruta vaya por los caminos adecuados.',
  'help.guide.tour-edit-points.title': 'Mover, reordenar y quitar puntos',
  'help.guide.tour-edit-points.tip.1':
    'El primer punto tiene la insignia «Inicio» y el último, «Fin». Si mueves un punto arriba del todo o abajo del todo, pasa a ser el inicio o el final.',
  'help.guide.tour-shaping-points.step.4':
    'Para convertir una parada en punto de forma o al revés, abre «Más acciones» en su fila y elige «Convertir en punto de forma» o «Convertir en parada».',
  'help.guide.tour-loop-reverse.step.2':
    'La última fila muestra ahora «Vuelta al inicio», y la ruta del mapa termina donde empezó.',
  'help.guide.tour-leg-by-hand.step.1':
    'Abre «Más acciones» en el punto donde empieza el tramo y elige «Dibujar a mano el siguiente tramo».',
  'help.guide.tour-trip-places.goal':
    'Añade como parada de la excursión un lugar que ya tienes planificado en el viaje.',
  'help.guide.tour-trip-places.result':
    'La excursión tiene una nueva parada con el lugar del viaje, con el mismo nombre.',
  'help.guide.tour-details-times.tip.2':
    'En una caminata, «Detalles» también incluye «Dificultad máxima del sendero» y «Elección de ruta», que se explican en las guías de caminatas. Un paseo urbano no tiene «Pausas»: en su lugar se usa el tiempo que pasas en sus paradas.',
  'help.guide.tour-save.step.4': 'La excursión aparece ahora en «Excursiones de este viaje», aún sin día.',
  'help.guide.tour-edit-saved.step.2':
    'Cambia lo que necesites, igual que en una excursión nueva: mueve o añade puntos, cambia el tipo o edita los detalles, como aquí la «Descripción».',
  'help.guide.tour-summary-profile.goal':
    'Consulta cuánto mide la excursión, qué pendiente tiene y a qué altura está cada punto de la ruta.',
  'help.guide.tour-summary-profile.result':
    'Sabes cuánto mide la excursión, cuánto sube, cuánto dura y dónde se empina.',
  'help.guide.tour-list-manage.tip.1':
    'Cada excursión cuenta una sola vez en los totales, aunque esté en varios días. Una suma con ≥ delante no incluye algunas excursiones. Pasa el cursor por encima para ver cuántas.',
  'help.guide.tour-delete.tip.1': 'No se puede deshacer, y Deshacer no recupera la excursión.',
  'help.guide.tour-saved-elsewhere.step.3':
    'Si haces clic en Guardar de todos modos, se abre «Cambiada mientras tanto» y no se sobrescribe nada.',
  'help.ctx.trip-tour-import.bullet.2':
    '«Vista previa de la importación» muestra en un mapa todos los tracks de los archivos, con su distancia, ascenso, descenso y puntos, antes de guardar nada. En «Importar como» indicas qué son los tracks.',
  'help.guide.tour-import-gpx.step.3':
    'Se abre la «Vista previa de la importación»; todavía no se ha guardado nada. El mapa muestra el recorrido completo, y cada track de los archivos es una fila numerada con su distancia, ascenso, descenso y puntos. Un track grabado también indica cuándo se grabó y cuánto duró.',
  'help.guide.tour-import-gpx.result':
    'La excursión está en «Excursiones de este viaje», aún sin día. Si es solo una, se abre directamente en el mapa como «Excursión GPX».',
  'help.guide.tour-view-import.tip.3': 'Una ruta de wanderer se abre igual, como «Excursión de wanderer».',
  'help.guide.tour-plan-from-import.tip.1': 'Descartar elimina la sugerencia. No se guarda nada hasta que guardes.',
  'help.guide.tour-restore-recorded.step.2': 'Haz clic en «Restaurar el track grabado».',
  'help.guide.tour-take-over.step.2': 'Elige «Traer una ruta de otro viaje».',
  'help.guide.tour-take-over.result':
    'Un mensaje confirma que se ha traído la excursión, que se abre en el editor lista para ponerla en un día.',
  'help.guide.tour-import-wanderer.tip.2':
    'Lo importado es una copia: los cambios posteriores en wanderer no afectan a la excursión. «Comprobar fuente», en el «Origen» de la excursión, te indica cuándo ha cambiado la ruta.',
  'help.ctx.trip-tour-map.bullet.3':
    '«Buscar lugar o dirección», arriba del mapa, lleva el mapa a un pueblo, un refugio o una cima sin añadir nada a la excursión.',
  'help.guide.tour-map-layers.result':
    'La excursión se muestra sobre el mapa más adecuado, y la píldora indica cuál está activo.',
  'help.guide.tour-along-search.step.3':
    'En «A esta distancia de la ruta», elige a qué distancia de la línea buscar: 250 m, 500 m, 1 km o 2 km.',
  'help.guide.tour-along-add-stop.goal':
    'Haz que la excursión pase por un mirador, un refugio o una fuente que hayas encontrado por el camino.',
  'help.guide.tour-along-add-stop.tip.3':
    'Los tramos donde no se puede añadir una parada (una vía ferrata o un porteo añadidos como línea fija, o un tramo dibujado a mano) aparecen atenuados en la lista, con el motivo al lado.',
  'help.guide.tour-3d-terrain.result':
    'Has visto la excursión sobre el relieve en 3D con sus tramos empinados en color, y vuelves a tener el mapa plano para planificar.',
  'help.guide.tour-3d-flyover.step.3':
    '«Parada» detiene el vuelo donde está, y «Reproducir sobrevuelo» lo reanuda desde ahí. «Empezar de nuevo» vuelve al principio y empieza el vuelo otra vez.',
  'help.guide.tour-map-overlays.step.1':
    'Abre una excursión de esquí en la pestaña «Excursiones». Las pistas se muestran desde el principio: su interruptor es la montaña nevada de la píldora de abajo a la izquierda, «Pistas, circuitos de fondo y remontes». Haz clic en ella para ocultarlas en el mapa y vuelve a hacer clic para mostrarlas.',
  'help.ctx.trip-tour-stages.title': 'Excursiones de varios días',
  'help.guide.tour-multi-day.goal': 'Divide una ruta en etapas, una por cada día de marcha.',
  'help.guide.tour-multi-day.tip.2':
    'Para volver a unir dos etapas, elige «Quitar fin de etapa» en el menú de la parada con la luna. Si eliminas esa parada, también se unen, y un aviso te ofrece Deshacer.',
  'help.guide.tour-stages-on-days.step.3':
    'Elige «Etapas desde este día»: la etapa 1 va en ese día y cada una de las siguientes en el día posterior. «Ruta completa en este día», en cambio, pone toda la ruta en ese único día.',
  'help.guide.tour-stages-on-days.result':
    'Cada etapa está en su día del viaje, y la etapa que abriste está en el editor.',
  'help.ctx.trip-tour-hike.bullet.6':
    '«Resumen de la excursión», a la derecha, muestra la distancia, el desnivel, el tiempo estimado caminando o corriendo, las pausas y el total previsto, con el perfil de altitud debajo. Guardar, abajo en el editor, guarda la excursión.',
  'help.guide.tour-hike-plan.step.6': 'Haz clic en Guardar, abajo de la columna izquierda.',
  'help.guide.tour-hike-trail-details.step.1':
    'Abre la caminata desde «Excursiones de este viaje» y busca «Detalles del sendero» bajo la tarjeta «Puntos de ruta». Activa «Mostrar a lo largo de la ruta».',
  'help.guide.tour-hike-trail-details.tip.3':
    'Nada de esta tarjeta modifica la excursión, y necesita conexión. Una caminata importada muestra la misma tarjeta en su vista, sin límite de ruta.',
  'help.guide.tour-hike-round.result':
    'La caminata sigue el circuito que elegiste y vuelve a su inicio. «Ruta tomada», abajo del mapa, ofrece Deshacer, y Guardar la conserva.',
  'help.guide.tour-hike-compare-ways.step.3':
    'Las insignias de cada fila indican cuánto más larga, más alta o más lenta es respecto al camino actual. Haz clic en la que quieras.',
  'help.guide.tour-ferrata-add.step.1':
    'Con una caminata abierta, haz clic en «Vías ferratas» en la fila de botones del mapa, abajo a la izquierda. La insignia cuenta las vías ferratas visibles; acerca el zoom si te lo pide.',
  'help.guide.tour-ferrata-add.tip.3':
    'El tramo de la vía ferrata se resalta en el perfil de altitud, para que veas en qué momento del día llegas a él.',
  'help.guide.tour-run-plan.step.5': 'Ponle un nombre a la carrera en «Nombre de la excursión» y haz clic en Guardar.',
  'help.guide.tour-run-ways.step.1':
    'Abre la carrera desde «Excursiones de este viaje» y activa «Mostrar a lo largo de la ruta» en «Detalles del sendero», bajo la tarjeta «Puntos de ruta».',
  'help.ctx.trip-tour-walk.bullet.1':
    'El tipo de ruta «Paseo urbano / turístico» convierte una excursión en un paseo. Sus puntos son paradas con una «Etiqueta», un tiempo de estancia y una importancia. Un paseo no tiene límite de senderismo ni campo «Pausas»: en su lugar se usan las estancias.',
  'help.guide.tour-walk-plan.step.2':
    'Añade las paradas: comprueba que «Añadir punto» está activado y haz clic en el mapa en cada una, o haz clic en «Lugares del viaje» para usar un lugar que ya tiene el viaje.',
  'help.guide.tour-walk-plan.result':
    'El paseo muestra sus paradas con sus estancias, y «Resumen de la excursión» las suma. Ponlo en un día para ver a qué hora llegas a cada parada.',
  'help.guide.tour-walk-sights.tip.1': 'Pasa a ser una parada del paseo, no un lugar del viaje.',
  'help.guide.tour-walk-day-times.step.3':
    'Vuelve a abrir el paseo en la pestaña «Excursiones». Arriba de «Puntos de ruta», «Horarios para» muestra el día y su hora de inicio. Si el paseo está planificado en varios días, haz clic ahí para elegir otro.',
  'help.guide.tour-walk-google-import.goal':
    'Pega una ruta a pie compartida desde Google Maps y carga sus paradas como un paseo.',
  'help.guide.tour-walk-google-import.result':
    'Se abre en el editor un nuevo paseo urbano con las paradas de Google Maps, listo para guardar.',
  'help.guide.tour-walk-check-off.tip.2':
    'La fila del paseo en el plan del día también muestra el recuento, por ejemplo 3/7.',
  'help.ctx.trip-tour-bike.bullet.4':
    'Con el perfil MTB, la misma tarjeta muestra la dificultad de los senderos (mtb:scale) donde los cartógrafos la han añadido. Un camino sin grado es desconocido, no fácil.',
  'help.guide.tour-bike-profile.step.6':
    'Escribe un nombre en «Nombre de la excursión» y haz clic en Guardar, abajo del carril izquierdo.',
  'help.guide.tour-bike-surfaces.goal':
    'Averigua qué parte de la ruta es asfalto, grava o desconocida, y por qué tipos de camino pasa.',
  'help.guide.tour-bike-surfaces.tip.3':
    'La tarjeta usa la ruta tal como la planificó el calculador y no cambia nada de la excursión. Necesita conexión; sin ella, te lo indica, y la ruta no se ve afectada.',
  'help.guide.tour-bike-mtb-grades.tip.1':
    '«Sin grado en los datos» significa desconocido, no fácil. El grado no indica si un sendero es adecuado para ti.',
  'help.ctx.trip-tour-ski.bullet.3':
    'Cada punto en el que haces clic en el mapa se une al anterior por pistas, remontes y senderos. Bajo cada punto aparece su tramo como etiquetas, con las pistas en el color de su dificultad y sus minutos. Un tramo que no se puede planificar se pone en rojo, explica por qué y ofrece una solución o «Dibujar recto».',
  'help.guide.tour-ski-plan.step.4':
    'Comprueba que «Añadir punto» está activado y haz clic en el mapa donde empiezas y en cada sitio al que quieras llegar, por orden. El calculador de pistas une cada punto con el anterior por pistas, remontes y senderos.',
  'help.guide.tour-ski-options.title': 'Indicar al calculador de pistas cómo esquías',
  'help.guide.tour-ski-options.tip.2':
    '«Usar remontes» está activado de forma predeterminada en «Alpino» y Snowboard, y desactivado en las demás disciplinas. «Excluir» y «Bajar en remonte si hace falta» solo aparecen si se usan remontes.',
  'help.guide.tour-ski-fix-leg.tip.1':
    'También puedes arrastrar el punto en el mapa más cerca de una pista, un sendero o un remonte. El tramo se vuelve a planificar al soltarlo.',
  'help.guide.tour-ski-summary.step.2':
    '«Esquiando», «En remontes», «Espera» y «A pie» indican el tiempo de cada cosa. «Pistas», «Descenso en pistas» y «Viajes en remonte» indican la longitud de las pistas, el desnivel que bajas esquiando por ellas y cuántos remontes coges.',
  'help.guide.tour-ski-pistes-layer.goal':
    'Consulta las pistas, los circuitos de fondo y los remontes que rodean tu excursión de esquí, y qué significan sus colores.',
  'help.guide.tour-ski-import.title': 'Importar un track de esquí e indicar qué fue',
  'help.guide.tour-ski-import.tip.1':
    'Un track importado se conserva tal como se grabó: TREK no lo ajusta a las pistas, y su tarjeta muestra «Tiempo de esquí» como «Sin calcular».',
  'help.ctx.trip-tour-paddle.bullet.3':
    '«Más acciones» en un punto incluye las herramientas de remo: planificar el siguiente tramo por el agua o dibujarlo a mano, «Portear la embarcación desde aquí» y «Esclusa en este punto».',
  'help.guide.tour-paddle-setup.step.3':
    'En «Barco», elige Kayak, «Canoa», SUP u «Otros». La embarcación determina la velocidad que propone TREK.',
  'help.guide.tour-paddle-setup.tip.4':
    '«Remar tiene riesgos», la fila de abajo de la columna, abre «Seguridad en el agua». Léelo una vez antes de tu primera excursión.',
  'help.guide.tour-paddle-water-route.step.5':
    'Para planificar a la vez todos los tramos dibujados a mano, haz clic en «Planificar por el agua los tramos dibujados a mano», las olas de la cabecera de «Puntos de ruta».',
  'help.guide.tour-paddle-portage.step.1':
    'Pasa el cursor por la parada donde desembarcas y haz clic en «Más acciones», los tres puntos.',
  'help.guide.tour-paddle-portage.result':
    'El tramo aparece como porteo en el mapa y en los puntos de ruta, y la «Estimación de tiempo» lo cuenta como porteo.',
  'help.guide.tour-paddle-lock.tip.2':
    'Si un porteo rodea la esclusa, esta aparece atenuada y marcada como rodeada a pie. Cuenta el tiempo del porteo, y los minutos de la esclusa no se incluyen.',
  'help.guide.tour-paddle-time.step.4':
    'Si la excursión tiene un porteo, la fila «Porteo» cuenta ese tiempo. Haz clic en su velocidad y escribe a qué velocidad llevas la embarcación. «Desembarcar y volver a embarcar» suma los minutos en cada porteo.',
  'help.guide.tour-paddle-wind.step.1':
    'Pon la excursión de remo en un día del viaje. La tarjeta «Viento» de la columna izquierda muestra entonces la previsión de ese día en el inicio de la excursión.',
  'help.guide.tour-paddle-wind.result': 'Sabes qué viento hará ese día, hora a hora, en tu punto de embarque.',
  'help.guide.tour-paddle-checklist.tip.1':
    'Para cada obstáculo, elige qué vas a hacer: «Pasar remando», «Portear», «Rodear» o «No afecta». «Siguiente» te lleva a la siguiente entrada pendiente.',
  'help.guide.tour-paddle-track-marks.step.1':
    'En la pestaña «Excursiones», haz clic en «Añadir ruta» en la columna derecha, elige «Importar GPX o KML» y selecciona el archivo.',
  'help.guide.tour-paddle-track-marks.tip.2':
    'Descartar elimina las marcas que no hayas guardado. El track grabado nunca se vuelve a trazar.',
  'help.ctx.trip-tour-horse.bullet.4':
    'TREK no calcula el tiempo a caballo. Si quieres que aparezca en el día, introduce un tiempo en «Planeado», dentro de «Detalles».',
  'help.guide.tour-horse-plan.step.5':
    'Elige un tramo en «Secciones». Comprueba el «Sentido» en que lo recorres y lo que indica «Acceso a caballo» a lo largo de él.',
  'help.guide.tour-horse-plan.tip.5':
    'En una ruta a caballo no se calcula nada: un clic en la línea dibujada no añade ningún punto de forma, y los puntos de los extremos de un tramo se quedan donde los sitúa la ruta.',
  'help.guide.tour-horse-gap.tip.1':
    'Ningún calculador ni ninguna ruta ecuestre ha comprobado un tramo manual. Mira el mapa para ver por dónde va realmente.',
  'help.guide.tour-horse-recorded.step.4':
    'La ruta se abre en la columna izquierda. La tarjeta «Ruta grabada» muestra «Tal como se grabó», «Sin tiempo a caballo» y «Acceso sin comprobar». Pasa el cursor por una insignia para ver el motivo.',
  'help.guide.dateless-trip.step.2':
    'Deja vacíos «Fecha de inicio» y «Fecha de fin». Debajo aparece el campo «Número de días»: indica cuántos días quieres planificar.',
  'help.guide.trip-reminder.tip.1':
    'Solo el propietario del viaje (o un administrador) ve el bloque «Recordatorio». Si aparece en gris, primero un administrador tiene que activar los recordatorios de viaje en «Administrador», «Notificaciones».',
  'help.guide.upcoming-reservations.step.2': 'Haz clic en una reserva para abrir el viaje al que pertenece.',
  'help.guide.timezones-widget.tip.1':
    'La lista usa los nombres oficiales de las zonas horarias, como Europe/Lisbon o America/New_York, así que busca la ciudad que aparece en el nombre.',
  'help.guide.half-company-holiday.step.2': 'Activa «Medio día» en la misma barra de herramientas.',
  'help.guide.edit-holiday-calendar.tip.1': 'Cada cambio se guarda al momento. No hay botón Guardar.',
  'help.guide.person-color.tip.1':
    'El mismo color identifica a la persona en la barra de herramientas y en la tarjeta «Derecho».',
  'help.guide.answer-fusion-request.step.2':
    'Lee lo que implica fusionar: un calendario compartido, entradas que podéis editar el uno por el otro y ajustes de vacaciones compartidos.',
  'help.guide.log-for-partner.step.2':
    'Mira la barra de herramientas: el primer botón muestra ahora su nombre y su color.',
  'help.guide.dissolve-fusion.step.2': 'En «Deshacer fusión», abajo del todo, haz clic en Disolver.',
  'help.guide.country-places.step.3':
    'El cuadro muestra todos los lugares que cuentan para el país, agrupados por viaje; si hay más de seis, «Buscar lugares», arriba, filtra la lista. Haz clic en un lugar o en el título de un viaje para abrir ese viaje en el planificador.',
  'help.guide.tour-activity-stats.step.5':
    'Haz clic en «Ver excursiones». Se abre «Mis excursiones realizadas» con los totales, el desglose «Por tipo» y todas las excursiones del periodo con su día, su viaje, su distancia y su desnivel. Las píldoras de su cabecera también cambian aquí el periodo y el tipo.',
  'help.guide.move-to-list.step.3':
    'Elige la lista de destino. Si hay más de tres listas, un cuadro de búsqueda arriba te ayuda a filtrarlas.',
  'help.guide.accept-list-invite.goal': 'Únete a una lista que alguien ha compartido contigo, o rechaza la invitación.',
  'help.guide.tour-collection-add-to-trip.step.4':
    'Si quieres, cambia «Nombre en el viaje» y luego haz clic en «Añadir a un viaje».',
  'help.guide.tour-collection-manage.step.2':
    'Escribe en «Buscar lugares». Filtra por nombre tanto las excursiones como los lugares.',
  'help.guide.create-journey.tip.3':
    'Cuando un viaje acaba de terminar, «Crear travesía» en el banner «El viaje acaba de terminar», arriba, empieza una travesía con ese viaje ya seleccionado.',
  'help.guide.entry-draft.step.2': 'Haz clic en Guardar. La tarjeta muestra ahora la insignia «Borrador».',
  'help.guide.gallery-map.step.3':
    'De vuelta en «Cronología», el mapa de la derecha sigue tu desplazamiento: la entrada que tienes a la vista lleva un anillo del color de su día. Haz clic en un marcador para desplazar la cronología hasta su entrada.',
  'help.guide.journey-map-layers.tip.1':
    'Una línea de color discontinua es la ruta GPX de un viaje, que forma parte del plan; una continua es una ruta grabada ese día.',
  'help.guide.journey-keep-route.tip.1':
    'Donde termina la grabación, termina también la línea. TREK solo dibuja lo que se ha grabado.',
  'help.guide.journey-day-stays.tip.1':
    'La fila solo aparece para quienes pueden editar el diario y tienen conectado su propio Dawarich, y solo en los días en los que queda algo por decidir.',
  'help.guide.journey-take-over-day.step.4':
    'Deja activado «Guardar también la ruta del día» para conservar también la ruta y haz clic en el botón «Traer». El botón indica cuántos borradores va a crear.',
  'help.guide.journey-auto-prepare.step.3':
    'La línea de debajo indica cuándo se obtuvieron tus estancias por última vez, o por qué falló. Haz clic en «Consultar ahora» para preguntar a Dawarich en ese momento.',
  'help.guide.photo-location.tip.1': 'Los lugares que has fijado tú nunca se mueven.',
  'help.ctx.settings-plugins.bullet.1':
    '«Ajustes de complementos»: debajo, una tarjeta por cada plugin que necesita datos tuyos, con sus campos y Guardar. Un campo secreto no se vuelve a mostrar una vez guardado.',
  'help.guide.dashboard-widgets.step.3':
    '«Restablecer valores predeterminados», debajo de las tarjetas, devuelve toda la pestaña «Apariencia» a su configuración original.',
  'help.guide.web-push-device.result':
    'La tarjeta muestra «Activado en este dispositivo», y los eventos activados en Push te llegan aunque TREK esté cerrado.',
  'help.guide.connect-airtrail.step.1':
    'En «Integraciones», busca AirTrail e introduce su «URL de la instancia» y una clave de API. La clave se crea en AirTrail, en «Ajustes», «Seguridad».',
  'help.guide.connect-dawarich.step.1':
    'En «Integraciones», busca Dawarich e introduce su «Dirección de la instancia» y la clave de API que encontrarás en Dawarich, en «Cuenta», «Clave de API».',
  'help.guide.tour-connect-wanderer.step.1':
    'En «Integraciones», busca wanderer e introduce su «URL de la instancia» y un token de API. El token se crea en wanderer, en «Ajustes», «Cuenta», «Tokens de API», y empieza por wanderer_key_.',
  'help.guide.tour-wanderer-watch.goal':
    'Haz que TREK compruebe en segundo plano si cambian las rutas que has importado.',
  'help.guide.mcp-oauth.tip.3':
    'Los «Tokens de API» siguen funcionando, pero están marcados como «Obsoleto»; pásate a un cliente OAuth.',
  'help.guide.offline-conflicts.tip.2': 'Esta opción solo se aplica a este dispositivo.',
  'help.guide.default-user-settings.tip.1':
    'Lo que cada usuario elija en «Ajustes» siempre tiene prioridad; estos valores se aplican a quienes no hayan cambiado ese ajuste.',
  'help.guide.own-routing-engine.step.1':
    'En «Mapa», dentro de «Valores predeterminados», introduce la dirección de tu servidor OSRM en «Motor de rutas propio».',
  'help.guide.admin-passkeys.tip.2':
    'Si cambias el dominio más adelante, todas las passkeys que ya se hayan añadido dejarán de funcionar.',
  'help.guide.instance-keys.tip.4':
    'La clave de Amap tiene que ser de tipo Web 服务 (servicio web), no una clave de la API de JS.',
  'help.guide.rotate-jwt-secret.step.2': 'Lee el aviso y haz clic en «Rotar y cerrar sesión».',
  'help.guide.notification-defaults.tip.2':
    'Un valor predeterminado solo se aplica a quienes no hayan cambiado esa casilla por su cuenta.',
  'help.ctx.notifications.bullet.5':
    'En «Ajustes», «Notificaciones», eliges qué eventos recibes aquí y cuáles por correo, webhook, ntfy o push.',
  'help.guide.read-notifications.result':
    'Estás en la pantalla a la que se refería la notificación, y el número de la campana baja en uno.',
  'help.guide.mark-notifications-read.title': 'Marcar notificaciones como leídas',
  'help.guide.delete-notifications.goal': 'Mantén la lista corta eliminando lo que ya no necesitas.',
  'help.guide.notification-settings.step.1': 'Haz clic en tu nombre, arriba a la derecha.',
  'help.guide.public-link.step.5':
    'Puedes cambiar las opciones mientras el enlace exista. «Eliminar enlace» desactiva el enlace.',
  'help.guide.link-journal.step.3':
    'Para cada persona del viaje, elige «Sin acceso», Leer o Editar. «Todos pueden leer» y «Nadie» los ajustan a todos a la vez.',
  'help.guide.collapse-columns.tip.3':
    'Cuando el separador tiene el foco, también puedes moverlo con las teclas de flecha.',
  'help.guide.edit-place.tip.3':
    'Si haces clic fuera del cuadro, no pierdes tus cambios: TREK te pregunta primero «¿Descartar los cambios?», y «Seguir editando» te devuelve al formulario.',
  'help.guide.dawarich-stays.goal':
    'Añade los lugares en los que Dawarich registró tus estancias durante el viaje, después de revisar cada uno.',
  'help.guide.leave-stop-off-route.step.1':
    'Haz clic con el botón derecho en la parada, o en sus tres puntos, y elige «Quitar de la ruta».',
  'help.guide.move-booking-day.step.3':
    'La fila aparece ahora en el nuevo día, a su hora. Abre la reserva si también tienes que cambiar la hora.',
  'help.guide.place-image-from-file.goal':
    'Usa como imagen del lugar una foto que ya está en sus archivos, sin volver a subirla.',
  'help.guide.place-image-from-file.tip.3': 'Solo los viajeros que pueden modificar lugares pueden cambiar la imagen.',
  'help.guide.place-own-hours.result':
    'La tarjeta muestra tu teléfono, tu correo electrónico y tu horario de apertura, y el anillo de la imagen se pone verde o rojo según tu horario.',
  'help.guide.confirm-stay-booking.step.4':
    'Cierra la reserva con la X de arriba a la derecha. En «Reserva», la tarjeta de la estancia muestra ahora «Confirmado».',
  'help.guide.tour-map-lines.title': 'Encontrar tus excursiones en el mapa',
  'help.guide.tour-map-lines.tip.2':
    'Ocultar una excursión solo te afecta a ti y se guarda en este navegador para este viaje: la excursión, sus días y su color no cambian para nadie. «Mostrar todas», encima de la lista de excursiones, vuelve a mostrar todas las ocultas, y el mapa del móvil siempre muestra todas las excursiones.',
  'help.guide.car-stops.step.4':
    'En «Paradas por el camino», haz clic en «Añadir escala» por cada lugar por el que pase el trayecto y elígelo, con una hora al lado si quieres. Las paradas sin lugar elegido se eliminan al guardar.',
  'help.guide.transport-details.step.2':
    'Las píldoras de la cabecera muestran el estado, el tipo, el día y el «Código de reserva». Haz clic en la píldora de estado para cambiar entre «Pendiente» y «Confirmado». El pequeño icono de copiar de la píldora del código, «Copiar código de reserva», copia el código al portapapeles.',
  'help.guide.group-sort-bookings.step.3':
    'En «Ordenar por», elige «Fecha», «Título», «Tipo» o «Estado». La fila de debajo invierte el orden: «Más tempranas primero» o «Más tardías primero» para las fechas, «A a Z» o «De la Z a la A» para el resto.',
  'help.guide.booking-on-map.title': 'Encontrar una reserva en el mapa',
  'help.guide.export-bookings-csv.tip.1':
    'Las columnas son «Tipo», «Título», «Estado», «Inicio», «Fin», «De», «A», «Ubicación», «Confirmación» y «Notas».',
  'help.guide.arrange-packing-list.tip.1':
    'Con «A a Z» activado no puedes arrastrar artículos, pero sí listas enteras.',
  'help.guide.count-packed-pieces.step.3':
    'Mientras solo hayas guardado algunas unidades, el contador aparece en tu color de acento y la casilla tiene un borde de ese color. Haz clic en el menos para restar una unidad.',
  'help.guide.expense-receipts.step.5':
    'La vista previa muestra el recibo, con «Abrir en una pestaña nueva» y Descargar arriba. Si hay varios recibos, las teclas de flecha pasan de uno a otro, y Esc cierra la vista previa.',
  'help.guide.files-sync-settings.step.3':
    'Haz clic en «Ajustes», bajo la barra de flujo, para ver el resto de opciones.',
  'help.guide.manage-notes.step.3':
    '«Fijar», en el mismo menú, mantiene la nota arriba del panel, con un marco del color de su categoría y una chincheta junto al título. «Desfijar», en el mismo menú, devuelve la nota a su posición normal.',
  'help.guide.note-categories.step.1':
    'Haz clic en el engranaje junto a «Nueva nota», en la cabecera de la tarjeta «Notas». Se abre «Gestionar categorías», con una fila por categoría: su color, su nombre, seis puntos de color y una papelera.',
  'help.guide.note-categories.tip.2':
    'Una categoría sin notas solo se guarda en tu navegador. Los demás miembros la ven en cuanto se asigna una nota a ella.',
  'help.guide.roadtrip-reorder.goal':
    'Cambia el orden del trayecto, o pasa una parada a otro día, directamente en el carril.',
  'help.guide.roadtrip-overnight.step.4':
    '«Buscar alojamiento», al lado, muestra el nombre para copiarlo y enlaces a webs de reservas: trivago o CHECK24 para un hotel, PiNCAMP o Pitchup para un camping. Comprueba el lugar, las fechas y los huéspedes en la web.',
  'help.guide.roadtrip-stop-fill.step.2':
    'En «Reposta al», elige entre 50 y 100. La línea bajo los botones indica hasta dónde puedes llegar desde aquí con esa carga.',
  'help.guide.roadtrip-bookings.step.2':
    'En el carril, el trayecto es una tarjeta del color de su tipo, con el horario en la columna de llegada y sus puntos de salida y llegada bajo el título.',
  'help.guide.roadtrip-google-import.tip.1':
    'TREK calcula su propia ruta entre las paradas; no copia la carretera de Google.',
  'help.guide.roadtrip-hazards.result':
    'El mapa muestra los avisos actuales alrededor de tu viaje, y la ruta no cambia.',
  'help.ctx.trip-tours.bullet.3':
    'Cada fila: la barra de color es la línea de la excursión en el mapa, la casilla redonda muestra el límite de ruta (T1 a T6) o el tipo, una pequeña insignia GPX o wanderer indica que es una importación, y las insignias muestran los días, la duración, la distancia y el desnivel positivo. Una luna con un número indica las etapas de una excursión de varios días.',
  'help.guide.tour-show-list.step.3': 'Haz clic en una fila. La tarjeta de la excursión se abre sobre el mapa.',
  'help.guide.tour-add-to-day.goal':
    'Planifica cuándo harás una excursión para que aparezca en el día con su línea en el mapa.',
  'help.guide.tour-add-to-day.tip.3':
    'Una excursión solo se puede añadir una vez a cada día. Si la sueltas en un día que ya la tiene, TREK solo muestra «Esta excursión ya está en ese día.».',
  'help.guide.tour-day-times.step.4':
    'Si la excursión termina después de que empiece el siguiente elemento del día, una nota bajo la fila te avisa, por ejemplo «Ends at 13:30, after Lunch at Gostner Schwaige starts at 12:30». No se mueve nada.',
  'help.guide.tour-remove-from-day.step.1':
    'En la columna de días, pasa el cursor por la fila de la excursión, haz clic en «Más opciones» y elige «Quitar del día».',
  'help.guide.tour-filter-list.step.1':
    'Haz clic en el botón de filtro bajo «Importar GPX o KML». Muestra el estado por el que filtra, «Todos» al principio, con el número de excursiones al lado.',
  'help.guide.tour-hide-on-map.title': 'Ocultar la línea de una excursión en el mapa',
  'help.guide.tour-import-plan-tab.title': 'Importar un track desde la pestaña «Planificado»',
  'help.ctx.trip-tour-detail.title': 'Detalles de la excursión',
  'help.guide.tour-detail-read.goal':
    'Consulta toda la información del viaje sobre una excursión: sus días, su distancia y altitudes, su perfil y su origen.',
  'help.guide.tour-detail-read.tip.1':
    'Una píldora ámbar «use with caution» indica que la importación tiene altitudes o medidas incompletas. Tenlo en cuenta al leer su desnivel positivo y su perfil.',
  'help.guide.tour-rename-colour.step.1':
    'Abre la tarjeta de la excursión y haz clic en el lápiz junto a su nombre. El nombre se convierte en un campo editable.',
  'help.guide.tour-take-along.goal':
    'Obtén indicaciones hasta el inicio de una excursión, abre su página web o descarga su ruta como archivo GPX.',
  'help.guide.tour-take-along.result':
    'Tienes el camino hasta el inicio en tu aplicación de mapas y la ruta completa como archivo GPX.',
  'help.guide.tour-copy-keep.tip.2':
    '«Guardar en colección», en el menú de una excursión en el plan del día, abre este mismo cuadro, así que la ruta también se guarda ahí.',
  'help.guide.tour-packing-link.step.3': 'Haz clic en Vincular.',
  'help.guide.tour-files.goal':
    'Añade a la excursión una reserva, un mapa o una descripción de la ruta, y vuelve a abrirlos desde la tarjeta de la excursión.',
  'help.guide.tour-activity-link.goal': 'Vincula un track GPX grabado a una excursión planificada sin cambiar el plan.',
  'help.guide.tour-activity-link.tip.3':
    '«Tiempo empleado» va desde la primera hasta la última marca de tiempo del track, pausas incluidas.',
  'help.guide.tour-activity-compare.tip.1':
    '«Comparar en el mapa» solo está disponible cuando la tarjeta se muestra junto al mapa, no en el móvil.',
  'help.guide.tour-origin-check.tip.1':
    'Una excursión traída de otro viaje indica ese viaje y la excursión en «Traída de».',
  'help.ctx.trip-tour-planner.bullet.3':
    '«Excursiones de este viaje», el carril derecho, muestra todas las excursiones, con el filtro y los «Totales del viaje» encima de la lista. Con una excursión abierta, «Resumen de la excursión», arriba, muestra su distancia, su desnivel, su duración y su perfil de altitud. El más de arriba, «Añadir ruta», sirve para planificar, importar o traer una excursión.',
  'help.guide.tour-open-workspace.step.3':
    'El carril derecho, «Excursiones de este viaje», muestra todas las excursiones del viaje, con el filtro y los «Totales del viaje» encima de la lista.',
  'help.guide.tour-open-workspace.result':
    'La pestaña «Excursiones»: el editor a la izquierda, las excursiones del viaje a la derecha y el mapa en medio.',
  'help.guide.tour-draw-route.step.6':
    'En «Puntos de ruta», cada punto tiene una fila con su número, que toma el nombre del lugar en cuanto se carga. Mientras TREK está calculando, un pequeño punto junto a «Nueva excursión» muestra su estado.',
  'help.guide.tour-type-profile.step.1':
    'Haz clic en «Tipo de ruta», bajo «Nombre de la excursión». Muestra el tipo actual con una línea que explica cómo se planifica.',
  'help.guide.tour-edit-points.goal':
    'Cambia el recorrido de la excursión moviendo sus puntos en el mapa o en la lista.',
  'help.guide.tour-edit-points.tip.2':
    'Cada fila muestra las coordenadas hasta que se carga el nombre del lugar. Deshacer y Rehacer no tienen atajo de teclado.',
  'help.guide.tour-shaping-points.tip.1': 'El inicio y el final siempre son paradas.',
  'help.guide.tour-loop-reverse.step.3':
    'Haz clic en «Invertir el sentido», al lado, para recorrer toda la excursión en sentido contrario.',
  'help.guide.tour-leg-by-hand.step.2':
    'El tramo pasa a ser una línea recta discontinua, y bajo la fila la lista muestra «Dibujado a mano, sin calcular», con su longitud.',
  'help.guide.tour-trip-places.step.1':
    'Haz clic en «Lugares del viaje», junto a «Añadir punto», en «Puntos de ruta». Debajo aparecen los lugares del viaje.',
  'help.guide.tour-details-times.title': 'Poner nombre a la excursión y planificar su tiempo',
  'help.guide.tour-details-times.tip.3':
    'Haz clic en la flecha junto a «Detalles» para plegarlo. Se abre automáticamente cuando alguno de sus campos tiene un valor que Guardar no acepta.',
  'help.guide.tour-save.tip.1':
    'Descartar, junto a Guardar, descarta los cambios sin guardar tras pedir confirmación. No modifica una excursión ya guardada.',
  'help.guide.tour-edit-saved.step.3':
    'Haz clic en Guardar. Aparece «Excursión guardada», y la excursión conserva sus días, sus archivos y sus notas.',
  'help.guide.tour-summary-profile.step.1':
    '«Resumen de la excursión», arriba de «Excursiones de este viaje», muestra la «Distancia», el «Desnivel positivo» y el «Desnivel negativo» de la excursión abierta en el editor, su tiempo estimado, las pausas y el total previsto.',
  'help.guide.tour-list-manage.title': 'Gestionar las excursiones del viaje',
  'help.guide.tour-list-manage.tip.2':
    'En el menú de días, los días que ya tienen la excursión aparecen en gris. En una excursión de varios días, TREK te pregunta si sus etapas empiezan ese día o si toda la excursión va en ese día.',
  'help.guide.tour-delete.tip.2': 'Si solo quieres quitarla de un día, usa «Quitar del día» en el menú del día.',
  'help.guide.tour-saved-elsewhere.step.4':
    'Elige «Guardar como nueva excursión» para conservar las dos, «Cargar la más reciente» para cargar la otra versión o «Sobrescribir» para sustituir la otra versión por la tuya.',
  'help.ctx.trip-tour-import.bullet.3':
    'Lo importado se abre como «Excursión GPX» o «Excursión de wanderer»: su línea, el «Resumen de la excursión» y el perfil de altitud, tal como se importó. Su fila en la lista lleva la insignia «Importación GPX».',
  'help.guide.tour-import-gpx.step.4':
    'En «Importar como», comprueba qué son los tracks. «Senderismo» viene preseleccionado. Una «Ruta en bicicleta» o una «Carrera a pie» piden su perfil; una «Ruta en piragua», su embarcación y el tipo de agua; «Esquí e invierno», su disciplina.',
  'help.guide.tour-view-import.title': 'Ver un track importado',
  'help.guide.tour-view-import.result': 'Ves el track grabado tal como se importó, sin recalcular nada.',
  'help.guide.tour-plan-from-import.tip.2':
    'Si la tarjeta indica que la sugerencia se aleja del track en tramos largos, revisa esas partes en el mapa antes de planificar con ella.',
  'help.guide.tour-restore-recorded.step.3':
    'Confirma con «Restaurar el track grabado». Se eliminan los puntos de ruta y la línea calculada, y se conservan los días y las notas.',
  'help.guide.tour-take-over.step.3':
    'Busca la excursión: escribe en «Buscar por nombre» o filtra la lista con los filtros «Viaje» y «Tipo».',
  'help.guide.tour-import-wanderer.title': 'Importar una ruta de wanderer',
  'help.guide.tour-import-wanderer.tip.3':
    'Una ruta que ya está en el viaje se marca con «En este viaje» y ofrece «Abrir la excursión». Si una ruta ha cambiado desde la importación, ofrece «Importar como versión nueva» junto a la antigua.',
  'help.ctx.trip-tour-map.bullet.4':
    '«A lo largo de la ruta», una tarjeta del panel izquierdo, busca miradores, agua, refugios, comida y más cerca de la ruta y muestra los resultados en una lista. Puedes añadir un lugar de la lista a la excursión como parada.',
  'help.guide.tour-map-layers.tip.1':
    'El mapa que eliges se mantiene en todas las excursiones que abras hasta que recargues la página. Una excursión cuyo tipo no lo ofrece se abre en «Mapa», y ni el mapa de la pestaña «Planificado» ni el ajuste de «Ajustes» cambian.',
  'help.guide.tour-along-search.step.4':
    'Haz clic en «Buscar a lo largo de la ruta». TREK solo busca: la excursión no cambia.',
  'help.guide.tour-along-add-stop.step.1':
    'Haz clic en un lugar de la lista «A lo largo de la ruta» o en su marcador del mapa. Su tarjeta se abre sobre el mapa: qué es, a qué distancia está de la ruta y en qué punto de la excursión queda.',
  'help.guide.tour-3d-terrain.title': 'Ver una excursión en 3D',
  'help.guide.tour-3d-terrain.tip.1':
    '«Vista general», en la misma fila, vuelve a mostrar toda la ruta después de haber movido la vista.',
  'help.guide.tour-3d-flyover.step.4': 'Haz clic en «Vista general» para volver a ver toda la excursión.',
  'help.guide.tour-map-overlays.step.2':
    'Haz clic en «Leyenda de pistas», el pequeño cuadrado de puntos de colores junto al interruptor.',
  'help.ctx.trip-tour-stages.summary':
    'Una excursión de varios días es una ruta dividida en etapas, una por cada día de viaje. Aquí defines dónde termina cada día, ves las medidas de cada etapa y pones las etapas en los días del viaje.',
  'help.guide.tour-multi-day.step.1':
    'En «Excursiones de este viaje», haz clic en la excursión para abrirla en el editor.',
  'help.guide.tour-multi-day.tip.3':
    'El tiempo de una etapa no incluye las pausas. Un tiempo en color de aviso, «Más de un día en movimiento», dura más de un día.',
  'help.guide.tour-stages-on-days.step.4':
    'Haz clic en el botón con la luna y el número de etapas, «Mostrar etapas», para verlas.',
  'help.ctx.trip-tour-hike.title': 'Caminatas y carreras',
  'help.guide.tour-hike-plan.title': 'Planificar una caminata con la dificultad que tú elijas',
  'help.guide.tour-hike-plan.result':
    'La caminata aparece en «Excursiones de este viaje» con su distancia, desnivel y tiempo de marcha, lista para ponerla en un día.',
  'help.guide.tour-hike-trail-details.step.2':
    'Elige qué mostrar: SAC para el grado de senderismo, «Firme» o «Tipo de vía». La ruta del mapa usa los mismos colores que la lista.',
  'help.guide.tour-hike-round.title': 'Encontrar una ruta circular de una longitud aproximada',
  'help.guide.tour-hike-round.tip.1':
    'Los circuitos no superan la «Dificultad máxima del sendero» de la caminata; la píldora T de la tarjeta indica cuál es.',
  'help.guide.tour-hike-compare-ways.step.4':
    'Haz clic en «Usar este camino». TREK comprueba con el calculador de rutas que la ruta lo sigue realmente.',
  'help.guide.tour-ferrata-add.step.2':
    'Haz clic en una vía ferrata del mapa, en su línea discontinua o en su señal. Su tarjeta muestra el nombre, el grado y la longitud.',
  'help.guide.tour-ferrata-add.tip.4':
    '«Ver en OpenStreetMap», en la tarjeta, abre los datos de la vía ferrata. La insignia se pone ámbar cuando no se puede cargar nada, y la descripción emergente explica el motivo.',
  'help.guide.tour-run-plan.result':
    'La carrera aparece en «Excursiones de este viaje» con su «Tiempo de carrera (previsto)», y su perfil y su ritmo se guardan con ella.',
  'help.guide.tour-run-ways.step.2':
    'La parte superior de la tarjeta muestra ahora qué parte de la carrera no está asfaltada y el sendero de mayor dificultad.',
  'help.ctx.trip-tour-walk.bullet.2':
    '«Puntos de ruta» muestra las paradas por orden. Un anillo alrededor del número de una parada la marca como «Imprescindible» (continuo) u «Opcional» (discontinuo), un pequeño escudo la marca como «Protegida», y una píldora bajo su nombre indica cuánto tiempo te quedas.',
  'help.guide.tour-walk-plan.step.3':
    'Pasa el cursor por una parada en «Puntos de ruta», haz clic en «Más acciones», a su lado, y elige «Editar parada».',
  'help.guide.tour-walk-sights.title': 'Añadir lugares de interés a un paseo urbano',
  'help.guide.tour-walk-sights.tip.2':
    'Si cambias la ruta, el botón muestra «Buscar de nuevo», porque los lugares encontrados corresponden a la ruta anterior.',
  'help.guide.tour-walk-day-times.step.4':
    'Bajo cada parada ves a qué hora llegas y cuánto tiempo te quedas. Aparece un aviso si un lugar está cerrado a esa hora o cierra durante la visita.',
  'help.guide.tour-walk-google-import.step.1':
    'En «Excursiones de este viaje», haz clic en «Añadir ruta» (el + de arriba) y elige «Importar paseo de Google Maps».',
  'help.guide.tour-walk-check-off.title': 'Marcar las paradas de un paseo durante el día',
  'help.guide.tour-walk-check-off.tip.3':
    'Si pones un paseo en un día sin conexión, podrás marcarlo en cuanto se haya sincronizado.',
  'help.guide.tour-bike-profile.title': 'Planificar una ruta en bici a tu manera',
  'help.guide.tour-bike-profile.result':
    'La ruta en bici se guarda y aparece en «Excursiones de este viaje», calculada para su perfil, con su tiempo de pedaleo en el «Resumen de la excursión».',
  'help.guide.tour-bike-surfaces.step.1':
    'En «Excursiones de este viaje», a la derecha, haz clic en una ruta en bici para abrirla. Cuando se calcula su ruta, aparece la tarjeta «Firme y vías» bajo «Puntos de ruta».',
  'help.guide.tour-bike-surfaces.tip.4':
    'Haz clic en el título de la tarjeta para plegarla. Se queda plegada en este navegador aunque recargues.',
  'help.guide.tour-bike-mtb-grades.tip.2':
    'Donde los cartógrafos han clasificado las subidas, debajo aparece «Grado de subida (mtb:scale:uphill)» con sus propias filas.',
  'help.ctx.trip-tour-ski.bullet.4':
    'La tarjeta «Ruta por pistas», bajo los puntos de ruta, divide el día en «Esquiando», «En remontes», «Espera» y «A pie», con la longitud de las pistas, el desnivel que bajas esquiando por ellas y los viajes en remonte. «Tiempo de esquí», en el «Resumen de la excursión» de la derecha, lo suma todo cuando todos los tramos están planificados.',
  'help.guide.tour-ski-plan.step.5':
    'Bajo cada punto aparece su tramo como etiquetas: cada pista, remonte y tramo a pie con su nombre o su tipo, las pistas con un punto del color de su dificultad, y los minutos de cada uno.',
  'help.guide.tour-ski-options.goal':
    'Define las pistas más difíciles, qué prefieres, tu ritmo y qué remontes usar, para que los tramos se adapten a ti.',
  'help.guide.tour-ski-options.tip.3':
    '«Evitar enlaces supuestos» evita que la ruta pase por conexiones que los datos del mapa solo suponen, como un tramo sin cartografiar entre dos pistas.',
  'help.guide.tour-ski-fix-leg.tip.2':
    'Mientras se descargan los datos de pistas de una zona, el planificador espera y vuelve a intentarlo automáticamente.',
  'help.guide.tour-ski-summary.step.3':
    'En el «Resumen de la excursión», a la derecha, «Tiempo de esquí» lo suma todo. Su punto de información explica cómo se calcula.',
  'help.guide.tour-ski-pistes-layer.step.1':
    'Con una excursión de «Esquí e invierno» abierta, el mapa muestra las pistas automáticamente. El interruptor de la montaña nevada, en la fila de abajo a la izquierda del mapa, las oculta y las muestra; su descripción emergente dice «Pistas, circuitos de fondo y remontes».',
  'help.guide.tour-ski-import.goal':
    'Importa un track grabado de esquí, esquí de fondo o raquetas y asígnale la disciplina correcta.',
  'help.guide.tour-ski-import.tip.2':
    'Para editarlo como una excursión planificada, usa «Planificar una versión editable» en su tarjeta «Versión editable». Sus puntos se unen con líneas rectas.',
  'help.ctx.trip-tour-paddle.bullet.4':
    '«Estimación de tiempo» suma el tiempo en el agua, el porteo, el desembarco y reembarque, las esclusas y las pausas, según velocidades y minutos que puedes cambiar.',
  'help.guide.tour-paddle-setup.step.4':
    'En «Agua», elige «Río» o «Lago». No puedes guardar la excursión hasta que elijas la embarcación y el tipo de agua.',
  'help.guide.tour-paddle-setup.result':
    'Una nueva excursión de remo con su embarcación, su tipo de agua y su velocidad, lista para su primer punto en el mapa.',
  'help.guide.tour-paddle-water-route.tip.1':
    'Si faltan los datos del agua, TREK los descarga automáticamente para la región o se los pide a un administrador, según cómo esté configurada la instancia. El tramo muestra entonces «Cargando los datos del agua» y se planifica automáticamente cuando llegan, normalmente en uno a tres minutos.',
  'help.guide.tour-paddle-portage.step.2':
    'Elige «Portear la embarcación desde aquí». El tramo hasta el siguiente punto pasa a ser un porteo, dibujado por tierra.',
  'help.guide.tour-paddle-lock.title': 'Añadir una esclusa y su tiempo de espera',
  'help.guide.tour-paddle-lock.tip.3': '«Eliminar la esclusa» está al final de la tarjeta abierta y en «Más acciones».',
  'help.guide.tour-paddle-time.step.5':
    'Mientras alguna esclusa no tenga sus tiempos, la estimación muestra «Incompleta» y una nota bajo las filas indica lo que falta.',
  'help.guide.tour-paddle-wind.step.2':
    'Comprueba la dirección del viento, su «Medio» y sus «Rachas». «Medio» es la media horaria más alta del día, y «Rachas», la racha más fuerte.',
  'help.guide.tour-paddle-checklist.title': 'Repasar la lista de obstáculos',
  'help.guide.tour-paddle-checklist.tip.2':
    '«Portear» no planifica el porteo automáticamente. Haz clic en «Planificar el porteo» para configurarlo en el mapa.',
  'help.guide.tour-paddle-track-marks.step.2':
    'En la «Vista previa de la importación», pon «Importar como» en «Ruta en piragua» y elige el «Barco» y el «Agua». No se puede continuar con la importación hasta que elijas los dos.',
  'help.guide.tour-paddle-track-marks.tip.3':
    'En un track grabado, la fila «Agua» de la «Estimación de tiempo» tiene su propia velocidad: haz clic en ella y escribe a qué velocidad remaste.',
  'help.ctx.trip-tour-horse.bullet.5':
    'Una ruta a caballo importada de un archivo GPX se conserva tal como se grabó, y su tarjeta «Ruta grabada» indica lo que la importación no ha podido calcular.',
  'help.guide.tour-horse-plan.step.6':
    'Haz clic en «Tomar tramo». El tramo se añade a la ruta como una insignia con el nombre del itinerario en la tarjeta «Puntos de ruta». Añade más tramos de la misma forma.',
  'help.guide.tour-horse-gap.title': 'Salvar un hueco entre rutas ecuestres',
  'help.guide.tour-horse-gap.tip.2':
    'Los puntos en los que haces clic en el mapa se añaden a la ruta de la misma forma, como tramos rectos sin comprobar.',
  'help.guide.tour-horse-recorded.result':
    'La ruta está en el viaje tal como la hiciste, con la distancia y las altitudes del archivo.',
  'help.guide.dateless-trip.step.3': 'Haz clic en «Crear nuevo viaje».',
  'help.guide.trip-reminder.tip.2':
    'Un viaje nuevo empieza con un recordatorio 3 días antes de la salida. Los canales por los que te llega se eligen en «Ajustes», «Notificaciones».',
  'help.guide.upcoming-reservations.result':
    'Se abre el viaje. De vuelta en el panel, el widget sigue mostrando lo próximo.',
  'help.guide.entitlement.tip.2':
    'En un plan fusionado, cada persona tiene su propia fila, y también puedes definir los días de los demás.',
  'help.guide.half-company-holiday.step.3': 'Haz clic en el día. La mitad de la casilla se pone ámbar.',
  'help.guide.school-holidays.tip.2':
    'Pasa el cursor por un día de vacaciones para ver su nombre en «Vacaciones escolares».',
  'help.guide.answer-fusion-request.step.3':
    'Haz clic en «Aceptar y fusionar» para unir los planes, o en Rechazar para mantener tu plan por separado.',
  'help.guide.log-for-partner.step.3':
    'Haz clic en los días que quieras registrar y luego vuelve a hacer clic en tu propio nombre en «Personas».',
  'help.guide.dissolve-fusion.result':
    'Cada persona vuelve a su propio plan con sus propias entradas, y en «Personas» solo apareces tú.',
  'help.guide.country-places.result': 'El planificador se abre en el viaje al que pertenece el lugar.',
  'help.guide.tour-activity-stats.step.6':
    'Si una excursión no llegó a hacerse, haz clic en «Excluir», el botón redondo al final de su fila. La excursión sigue en la lista, atenuada y marcada como «Excluida». El mismo botón, ahora «Volver a contar», la vuelve a incluir.',
  'help.guide.move-to-list.tip.1':
    'Las etiquetas pertenecen a una sola lista, así que un lugar movido o duplicado no tiene etiquetas en la nueva lista.',
  'help.guide.accept-list-invite.step.1':
    'Busca la invitación en «Invitaciones», en la columna de listas. Si has llegado desde la notificación de la invitación, la tarjeta está arriba de la página. Indica la lista y quién te invita.',
  'help.guide.tour-collection-add-to-trip.tip.1':
    'La nueva excursión aún no está en ningún día y no añade lugares. Ni la lista ni la excursión original cambian.',
  'help.guide.tour-collection-manage.step.3':
    'Haz clic en la papelera al final de la fila de la excursión y confirma con «Quitar de la colección».',
  'help.ctx.journey-detail.bullet.7':
    'Con Dawarich conectado, la cabecera de cada día también muestra «Tomar la grabación» (o la distancia de la ruta guardada para el día) e «Incorporar día». En un día con estancias en espera, las estancias se agrupan en una fila al final del día.',
  'help.guide.entry-draft.tip.1':
    'Los colaboradores siguen viendo los borradores. Solo el enlace público los oculta hasta que desactives «Borrador».',
  'help.guide.journey-map-layers.tip.2':
    'Un interruptor atenuado aún no tiene nada que mostrar, y su descripción emergente explica por qué. Tu elección se guarda para cada travesía en este navegador.',
  'help.guide.journey-keep-route.tip.2':
    'Más adelante, haz clic en la distancia de la cabecera del día para volver a compararla con Dawarich: «Sustituir» usa la nueva versión y «Quitar ruta» elimina la ruta del día de la travesía.',
  'help.guide.journey-day-stays.tip.2':
    'En un día con mucho movimiento, «Incorporar día», al final de la fila, gestiona todas sus estancias a la vez.',
  'help.guide.journey-take-over-day.tip.1':
    'No se guarda nada hasta que haces clic en ese botón, y nada se guarda dos veces: una estancia que ya está en el diario aparece marcada y no se puede volver a elegir.',
  'help.guide.journey-auto-prepare.tip.1':
    'Solo se preparan los días de viajes vinculados que tienen fechas, y no se añade nada al diario automáticamente.',
  'help.guide.photo-location.result':
    'Una entrada sin lugar toma la ubicación donde se hizo su primera foto con GPS y aparece en el mapa.',
  'help.guide.contributors.tip.2':
    '«A través de viajes» muestra las personas que tienen acceso por un viaje vinculado. Su acceso se cambia en los ajustes de ese viaje, no aquí.',
  'help.ctx.settings-plugins.bullet.2':
    'Un plugin puede añadir «Acciones» a su tarjeta, que se ejecutan tras confirmarlas, y «Conectar» o «Desconectar» cuando inicia sesión en otro servicio por ti.',
  'help.guide.web-push-device.tip.1':
    'Push funciona por navegador: repite el proceso en cada móvil y ordenador en el que quieras recibir notificaciones. «Desactivar en este dispositivo» las desactiva solo en ese dispositivo.',
  'help.guide.connect-airtrail.step.2':
    '«Permitir certificados autofirmados» es solo para una instancia de confianza en tu propia red. «Escribir cambios de vuelta en AirTrail» está desactivado de forma predeterminada, así que TREK solo lee; actívalo para enviar tus cambios a AirTrail.',
  'help.guide.connect-dawarich.step.2':
    '«Buscar estancias nuevas automáticamente» permite que TREK compruebe por su cuenta. Si está desactivado, TREK solo consulta Dawarich cuando se lo pides. «Permitir certificado autofirmado» es solo para una instancia en la que tu servidor no confía.',
  'help.guide.tour-connect-wanderer.step.2':
    'Activa «Permitir certificado autofirmado» solo si la instancia está en tu propia red.',
  'help.guide.tour-wanderer-watch.step.1':
    'En la tarjeta de wanderer, activa «Comprobar cambios en mis rutas». Antes tienes que haber guardado una conexión.',
  'help.guide.plugin-settings.title': 'Configurar un plugin para ti',
  'help.guide.default-user-settings.tip.2':
    '«Moneda de visualización» solo convierte los importes para mostrarlos. Los importes introducidos en «Costes» no cambian.',
  'help.guide.own-routing-engine.step.2':
    'Para rutas que eviten peajes, autopistas o ferris, introduce la dirección de tu Valhalla en «Instancia de Valhalla propia». Cada campo se guarda al salir de él; después reinicia el servidor de TREK y recarga la página.',
  'help.guide.admin-passkeys.tip.3':
    'Si un usuario ha perdido el dispositivo con sus passkeys, elimínalas con «Restablecer passkeys» en «Editar usuario».',
  'help.guide.rotate-jwt-secret.result':
    'Hay un nuevo secreto de firma, y todos los usuarios, tú incluido, tienen que volver a iniciar sesión.',
  'help.guide.read-notifications.title': 'Leer tus notificaciones',
  'help.guide.filter-notifications.title': 'Ver todas las notificaciones o solo las no leídas',
  'help.guide.mark-notifications-read.goal':
    'Quita el resaltado y el número de la campana cuando ya hayas visto las novedades.',
  'help.guide.delete-notifications.step.1':
    'Haz clic en Eliminar, la papelera junto a la hora de una notificación, para borrar solo esa.',
  'help.guide.notification-settings.step.2': 'Haz clic en «Ajustes» en el menú.',
  'help.guide.public-link.tip.3': 'Pasa el cursor por una opción para ver qué oculta.',
  'help.guide.link-journal.step.4':
    'Lee la nota amarilla: indica quién recibe acceso al diario por primera vez. Después haz clic en «Vincular diario».',
  'help.guide.dawarich-stays.step.1':
    'Con Dawarich conectado en «Ajustes», «Integraciones», aparece «Desde Dawarich» encima de la lista de lugares. Su cabecera indica cuándo comprobó TREK por última vez y cuántas estancias están en espera. Haz clic en ella para abrir la lista.',
  'help.guide.leave-stop-off-route.step.2':
    'Junto al nombre aparece la insignia «Fuera de ruta». La parada sigue en el día y en el mapa, pero la ruta del día y los tiempos de sus tramos la omiten.',
  'help.guide.move-booking-day.result': 'La reserva pertenece al nuevo día en el plan, a la misma hora.',
  'help.guide.clear-day.tip.2': 'Esta opción del menú solo aparece en los días que tienen lugares.',
  'help.guide.place-image-from-file.step.1':
    'Abre un lugar que tenga una foto entre sus «Archivos». El bloque «Archivos», cerca del final de la tarjeta, indica cuántos archivos tiene el lugar.',
  'help.guide.place-own-hours.title': 'Corregir el horario, el teléfono o el correo de un lugar',
  'help.guide.place-own-hours.tip.1':
    'El horario que introduzcas sustituye al que consultó TREK, así que una cafetería con horario de temporada muestra el que tú conoces.',
  'help.guide.day-panel.tip.3':
    '¿Planificas por calendario? Activa «Fecha primero en los títulos de día» en «Ajustes», en «Pantalla», y la cabecera mostrará primero la fecha, con «Día 1» o el nombre del día debajo.',
  'help.guide.confirm-stay-booking.result':
    'La reserva de hotel queda confirmada, tanto en la tarjeta de la estancia como en la pestaña «Reservas».',
  'help.guide.tour-map-lines.goal':
    'Distingue en el mapa las excursiones del viaje, abre una desde su línea y oculta las que no necesites ahora.',
  'help.guide.tour-map-lines.tip.3':
    '«Quitar de la ruta», en el menú de la fila de la excursión en el plan del día, hace que la ruta del día deje de ir al inicio y al final de la excursión. «Volver a añadir a la ruta» los vuelve a unir.',
  'help.guide.car-stops.step.5':
    'El orden de las paradas es la ruta. «Subir» y «Bajar», a la izquierda de cada parada, lo cambian, y «Eliminar parada», la cruz de la derecha, la quita.',
  'help.guide.transport-details.step.3':
    'Las casillas de abajo muestran la salida y la llegada con sus estaciones o aeropuertos y, si están indicados, el andén y el asiento. Si el trayecto tiene paradas intermedias, aparecen en «Ruta», y si se reservó por tramos, el código de cada tramo aparece en «Códigos por tramo». Después vienen «Viajeros», «Notas», «Costes» y «Archivos»; «Mostrar en archivos» abre el billete en la pestaña «Archivos».',
  'help.guide.export-transports-csv.title': 'Exportar los transportes como hoja de cálculo',
  'help.guide.group-sort-bookings.step.4':
    'Haz clic en el título de una sección para plegarla. El número de al lado indica cuántas reservas contiene, y con otro clic se vuelve a abrir.',
  'help.guide.booking-on-map.goal': 'Salta de una reserva a su lugar en el plan y en el mapa.',
  'help.guide.export-bookings-csv.tip.2':
    'Las columnas están separadas por punto y coma, y Excel abre el archivo con los acentos correctos.',
  'help.guide.arrange-packing-list.tip.2':
    'TREK recuerda «A a Z» en este navegador, así que la próxima vez la lista también se abre ordenada. Solo cambia lo que ves tú, nunca el orden que ven los demás.',
  'help.guide.count-packed-pieces.step.4':
    'Cuando el contador llega a la cantidad, el artículo se marca automáticamente y cuenta como guardado.',
  'help.guide.expense-receipts.result':
    'El recibo se guarda con el gasto: la etiqueta de su fila lo abre, y el archivo también está en los «Archivos» del viaje.',
  'help.guide.files-sync-settings.step.4':
    'En «Cuando se elimina un documento», elige qué pasa con la copia del otro lado. «Conservar ambas copias» deja la copia del gestor donde está. «Mover a la papelera» la envía a la papelera del gestor cuando el documento se elimina en TREK.',
  'help.ctx.trip-collab.bullet.7':
    'Todo lo de esta sección necesita conexión. Sin conexión, los mensajes, notas, enlaces, encuestas y votos no se guardan, y TREK muestra «This needs a connection. Try again once TREK is back online.». Los miembros que no pueden editar «Colaboración» pueden leerlo todo, pero no ven «Nueva nota», «Añadir enlace» ni «Nueva encuesta», y el cuadro de mensajes aparece en gris.',
  'help.guide.manage-notes.step.4':
    'Editar abre el cuadro de la nota con todo rellenado. Cambia lo que necesites, aquí una línea más en «Contenido», y haz clic en Guardar.',
  'help.guide.note-categories.step.2':
    'Escribe un nombre en «Nueva categoría...», abajo del todo, y pulsa Intro o haz clic en el más de al lado. La nueva categoría recibe el siguiente color y su propia fila.',
  'help.guide.note-categories.tip.3':
    'En una tarjeta, la categoría es solo el punto de color de su cabecera. Pasa el cursor por el punto para ver su nombre.',
  'help.guide.roadtrip-reorder.step.1':
    'Arrastra una parada por su fila y suéltala sobre otra parada del mismo día. Ocupa el lugar de esa parada, y la ruta del día se recalcula con el nuevo orden.',
  'help.guide.roadtrip-overnight.step.5':
    'Haz clic en Añadir. La noche se reserva de este día al siguiente, y el lugar se añade al trayecto como la noche de ese día.',
  'help.guide.roadtrip-stop-fill.step.3':
    'Para volver a usar tu ajuste en esa parada, abre otra vez la insignia y haz clic en «Usar mi valor por defecto».',
  'help.guide.roadtrip-bookings.step.3':
    'La píldora «Registro de entrada» o «Embarque» indica a qué hora tienes que estar en la terminal: la salida se adelanta ese tiempo respecto al horario.',
  'help.guide.roadtrip-google-import.title': 'Importar una ruta de Google Maps',
  'help.guide.roadtrip-google-import.tip.2':
    'El enlace tiene que tener al menos dos paradas que TREK pueda situar, y como máximo 30.',
  'help.guide.roadtrip-hazards.tip.1':
    'Los avisos no son cortes de carretera: la ruta nunca cambia por ellos, y son avisos actuales, no una previsión para tus fechas.',
  'help.ctx.trip-tours.bullet.4':
    'Pasa el cursor por una fila para ver su ojo («Ocultar en el mapa») y su + redondo («Añadir al día»). Arrastra una fila a un día de la columna izquierda para planificarla ese día, o haz clic en ella para abrir la tarjeta de la excursión sobre el mapa.',
  'help.guide.tour-show-list.step.4':
    'La tarjeta muestra las medidas de la excursión y, en «Días del viaje», los días en que está. Para cambiar la ruta en sí, abre la pestaña «Excursiones» y haz clic en la excursión en «Excursiones de este viaje».',
  'help.guide.tour-add-to-day.step.1':
    'Pasa el cursor por la excursión en la lista y haz clic en el + redondo de la derecha de su fila («Añadir al día»).',
  'help.guide.tour-add-to-day.tip.4':
    'Con un día abierto (haz clic en su cabecera), la tarjeta de la excursión también ofrece «Añadir al día» para ese día. La flecha de deshacer, encima de los días, deshace la asignación.',
  'help.guide.tour-day-times.tip.1': 'La hora de fin que introduzcas sustituye a la calculada.',
  'help.guide.tour-remove-from-day.step.2':
    'La excursión sigue en la lista de la derecha. Su insignia de día desaparece, y el filtro vuelve a contarla en «Sin planificar».',
  'help.guide.tour-filter-list.step.2':
    'En «Estado», elige «Sin planificar» para las excursiones que aún no están en ningún día, o «Planeado» para las que ya están en uno. Cada línea indica cuántas excursiones coinciden.',
  'help.guide.tour-hide-on-map.goal':
    'Oculta en el mapa las excursiones que no necesitas ahora, sin cambiarlas para nadie.',
  'help.guide.tour-import-plan-tab.goal': 'Importa un track GPX o KML como excursión mientras planificas los días.',
  'help.ctx.trip-tour-detail.summary':
    'La tarjeta que se abre sobre el mapa al elegir una excursión en la pestaña «Planificado»: sus días, sus medidas y su perfil, su origen, y los botones para enviarla a tu móvil, copiarla, guardarla en una colección o vincularla a la lista de equipaje.',
  'help.guide.tour-detail-read.step.1':
    'Arriba de la columna derecha, cambia de «Lugares» a «Excursiones» y haz clic en una excursión. Su tarjeta se abre sobre el mapa. Su fila dentro de un día, o su línea en el mapa, abren la misma tarjeta.',
  'help.guide.tour-detail-read.tip.2':
    'Una excursión de remo no muestra altitudes ni perfil: sus puntos están en las orillas, así que las altitudes serían incorrectas.',
  'help.guide.tour-rename-colour.step.2':
    'Escribe el nuevo nombre y haz clic en el botón redondo de la marca de verificación, o pulsa Intro. Escape mantiene el nombre anterior.',
  'help.guide.tour-take-along.step.1':
    'Abre la tarjeta de la excursión. «Navegación», abajo de la tarjeta, abre el inicio de la excursión en una aplicación de mapas y, si hay varias, primero te deja elegir. Te lleva hasta el inicio, no a lo largo de la ruta.',
  'help.guide.tour-copy-keep.title': 'Copiar una excursión o guardarla en una colección',
  'help.guide.tour-copy-keep.tip.3':
    'En la pestaña «Excursiones», el marcador de la parte superior de la columna izquierda hace lo mismo con la excursión abierta. Si tiene cambios sin guardar, te pide que la guardes primero.',
  'help.guide.tour-packing-link.step.4':
    'La tarjeta muestra ahora la lista, cuántos de sus artículos están guardados, una barra y los primeros artículos. Los guardados aparecen tachados.',
  'help.guide.tour-files.step.1':
    'Abre la tarjeta de la excursión y baja hasta «Archivos», al final. Haz clic en Subir en la cabecera de la sección y elige uno o varios archivos.',
  'help.guide.tour-activity-link.step.1':
    'Abre la tarjeta de la excursión planificada y baja hasta «Track real». Haz clic en «Añadir track real».',
  'help.guide.tour-activity-link.result':
    'El track queda vinculado a la excursión, y la tarjeta muestra lado a lado el plan y lo que hiciste.',
  'help.guide.tour-activity-compare.tip.2':
    'Las estadísticas de excursiones del atlas cuentan el track vinculado en lugar de los valores planificados.',
  'help.guide.tour-origin-check.tip.2':
    'Una excursión de wanderer tiene una flecha junto a su origen, «Abrir en wanderer», y «Comprobar fuente» en la cabecera de la sección. La comprobación pregunta a wanderer si la ruta ha cambiado desde la importación. «Importar como nueva instantánea» importa entonces la nueva versión como excursión aparte. Esta excursión conserva sus días y notas.',
  'help.ctx.trip-tour-planner.bullet.4':
    'Mientras «Añadir punto» está activado («Colocar puntos» en la píldora del mapa), cada clic en el mapa coloca un punto. Arrastra un marcador para moverlo, haz clic en la ruta dibujada para añadir ahí un punto de forma, y elige un lugar del viaje con «Lugares del viaje».',
  'help.guide.tour-open-workspace.step.4':
    'El más de la parte superior del carril derecho, «Añadir ruta», ofrece «Importar GPX o KML», «Importar paseo de Google Maps» y «Traer una ruta de otro viaje». Con una excursión abierta, también aparece «Planificar nueva excursión».',
  'help.guide.tour-draw-route.title': 'Dibujar una nueva excursión',
  'help.guide.tour-draw-route.tip.1':
    'Mientras «Colocar puntos» está activado, el puntero es una cruz. Desactívalo para arrastrar el mapa sin añadir puntos. En 3D empieza desactivado, porque en 3D se arrastra el mapa para mirar alrededor.',
  'help.guide.tour-type-profile.step.2':
    'Elige el tipo en la lista: «Senderismo», «Paseo urbano / turístico», «Carrera a pie», «Ruta en bicicleta», «Ruta en piragua», «Ruta a caballo» o «Esquí e invierno». Cada uno explica qué planifica, y al elegir un tipo nuevo la ruta se vuelve a planificar.',
  'help.guide.tour-edit-points.step.1':
    'Arrastra un marcador numerado del mapa hasta donde deba estar el punto. La ruta se vuelve a planificar pasando por el nuevo sitio.',
  'help.guide.tour-edit-points.result':
    'Los puntos están donde quieres y en el orden que quieres, y la ruta se ha vuelto a planificar.',
  'help.guide.tour-shaping-points.tip.2':
    'Un punto de forma no puede ser el final de una etapa de una excursión de varios días.',
  'help.guide.tour-loop-reverse.tip.1':
    'Cuando la excursión ya es circular, «Volver al inicio» indica «La ruta ya vuelve al inicio».',
  'help.guide.tour-leg-by-hand.step.3':
    'Para que el calculador vuelva a planificarlo, abre el mismo menú y elige «Volver a calcular el siguiente tramo».',
  'help.guide.tour-trip-places.step.2':
    'Busca en «Buscar en los lugares del viaje» o mira en «Cerca de la excursión»: los lugares a menos de dos kilómetros de la ruta, del más cercano al más lejano, cada uno con su distancia.',
  'help.guide.tour-details-times.goal':
    'Ponle a la excursión un nombre, una descripción y un enlace, y añade pausas a su tiempo.',
  'help.guide.tour-details-times.result':
    'La excursión tiene ahora su nombre, sus notas y el tiempo que tienes previsto.',
  'help.guide.tour-save.tip.2':
    '«Volver a excursiones», arriba del carril, cierra el editor y, si hay cambios sin guardar, pregunta antes.',
  'help.guide.tour-edit-saved.step.4':
    'Haz clic en «Volver a excursiones» para cerrarlo. Si hay cambios sin guardar, primero pregunta «¿Descartar los cambios sin guardar de la excursión?».',
  'help.guide.tour-summary-profile.step.2': 'El punto de información junto al tiempo estimado explica cómo se calcula.',
  'help.guide.tour-list-manage.goal':
    'Consulta los totales de las excursiones del viaje, pon una en un día y filtra la lista para ver lo que necesitas.',
  'help.guide.tour-list-manage.tip.3':
    'La papelera de una fila elimina la excursión. La pestaña «Planificado» muestra las mismas excursiones cuando su columna derecha está en «Excursiones».',
  'help.guide.tour-delete.tip.3':
    'Las excursiones se eliminan aquí, en la pestaña «Excursiones». La papelera solo aparece a los viajeros que pueden editar los lugares del viaje.',
  'help.guide.tour-saved-elsewhere.tip.1':
    '«Guardar como nueva excursión» pone a tu copia el nombre de la excursión seguido de (my version).',
  'help.ctx.trip-tour-import.bullet.4':
    '«Versión editable» convierte lo importado en una excursión con puntos de ruta que puedes mover. «Reemplazar la importación» conserva el track grabado, y la tarjeta «Track grabado» del editor te permite volver a él.',
  'help.guide.tour-import-gpx.step.5':
    'Haz clic en «Importar 1 excursión» (o «Importar 3 excursiones» si el archivo tiene tres tracks).',
  'help.guide.tour-view-import.goal':
    'Consulta el recorrido, las medidas y la altitud de una excursión importada tal como llegó.',
  'help.guide.tour-plan-from-import.title': 'Planificar una excursión editable a partir de una importación',
  'help.guide.tour-plan-from-import.tip.3':
    'En una importación de remo o de esquí, los puntos se unen con líneas rectas en lugar de calcular la ruta.',
  'help.guide.tour-restore-recorded.tip.1':
    'La tarjeta solo aparece en una excursión que se sustituyó con «Reemplazar la importación» y después se guardó.',
  'help.guide.tour-take-over.step.4':
    'Haz clic en la excursión. A la derecha se ven su línea, sus medidas y el viaje del que procede.',
  'help.guide.tour-import-wanderer.goal': 'Importa al viaje, como excursión, una de las rutas de tu propio wanderer.',
  'help.guide.tour-import-wanderer.tip.4': '«Abrir en wanderer» abre la ruta en tu instancia.',
  'help.ctx.trip-tour-map.bullet.5':
    'En 3D, la ruta se muestra sobre el relieve, coloreada según su pendiente, con una leyenda que resume sus pendientes y un sobrevuelo que la recorre de principio a fin.',
  'help.guide.tour-map-layers.tip.2':
    '«Senderismo» y «Bicicleta» proceden de servidores de voluntarios y solo están disponibles si tu administrador los permite. Cuando uno deja de responder, su segmento muestra un ! y puedes cambiar a otro mapa; tu excursión no cambia.',
  'help.guide.tour-along-search.step.5':
    'Los lugares encontrados aparecen en una lista con su distancia a la ruta y se muestran en el mapa con su color. Una estrella marca los más conocidos, y «En la excursión», los que ya son una parada. El botón indica ahora «Buscar de nuevo».',
  'help.guide.tour-along-add-stop.step.2':
    '«Dónde va» propone el tramo en el que mejor encaja el lugar. Haz clic para elegir en su lugar entre qué dos paradas va, o «Como nuevo final». El mapa muestra la nueva ruta con una línea discontinua antes de cambiar nada.',
  'help.guide.tour-3d-terrain.goal': 'Mira la excursión sobre el paisaje real, coloreada según su pendiente.',
  'help.guide.tour-3d-terrain.tip.2':
    'El mapa que elegiste también se usa en 3D, igual que las vías ferratas, las pistas y las señales náuticas. Mientras editas una excursión, puedes arrastrar sus puntos sobre el relieve y, con «Colocar puntos» activado, añadir uno con un clic.',
  'help.guide.tour-3d-flyover.result':
    'Has visto la excursión desde el aire, de principio a fin, a la velocidad que elegiste.',
  'help.guide.tour-map-overlays.step.3':
    'La leyenda explica qué significan los colores: las pistas de descenso de «Principiante» a Freeride, «Circuitos de esquí de fondo», «Senderos invernales y de raquetas», «Pistas de trineo» y «Remontes». «Leyenda completa en OpenSnowMap» muestra todos los símbolos. Pulsa Escape para cerrarla.',
  'help.ctx.trip-tour-stages.bullet.1':
    '«Días», en el editor, convierte la excursión abierta en «Un día» o «Varios días». Si vuelves a una excursión de un día, todos los finales de etapa se eliminan tras confirmarlo, y la ruta no cambia.',
  'help.guide.tour-multi-day.step.2':
    'En «Días», haz clic en «Varios días». Una nota indica dónde se coloca el primer final de etapa.',
  'help.guide.tour-multi-day.tip.4':
    'Las etapas se guardan al hacer clic en Guardar. Si un cambio elimina una etapa que está en un día del viaje, un aviso indica que al guardar se quitará de ese día.',
  'help.guide.tour-stages-on-days.step.5':
    'Cada etapa muestra el día en que está. Haz clic en su día para pasar la etapa a otro, o elige «Sin día» para quitarla.',
  'help.ctx.trip-tour-hike.summary':
    'Una caminata o una carrera abierta en la pestaña «Excursiones»: el editor a la izquierda, el mapa en el centro y, a la derecha, el resumen de la excursión y las demás excursiones del viaje. Una caminata no supera la dificultad de sendero que permitas, una carrera se calcula con tu propio ritmo, y ambas muestran lo que OpenStreetMap registra por el camino.',
  'help.guide.tour-hike-plan.goal':
    'Empieza una caminata, define sus paradas, elige el grado de sendero más difícil que puede usar la ruta y guárdala.',
  'help.guide.tour-hike-plan.tip.1':
    'Una caminata nueva empieza en T2 («Senderismo de montaña»). T3 añade un aviso de que esos senderos pueden ser expuestos y exigen paso firme y no tener vértigo.',
  'help.guide.tour-hike-trail-details.step.3':
    'Las insignias lo resumen: qué parte de la ruta es «Conocido», el «Máximo conocido» y, aparte, el «Límite de ruta» con el que se planificó la caminata.',
  'help.guide.tour-hike-round.goal':
    'Haz que TREK te proponga circuitos de la longitud que quieras, empezando en una parada de la caminata.',
  'help.guide.tour-hike-round.tip.2':
    'Se aceptan distancias de 1 a 60 km, y se proponen circuitos que se desvían como mucho un 20 % de la tuya.',
  'help.guide.tour-hike-compare-ways.result':
    'Ese tramo sigue el camino que elegiste y el resto de la caminata no cambia. «Camino adoptado», abajo del mapa, ofrece Deshacer.',
  'help.guide.tour-ferrata-add.step.3':
    'Haz clic en «Añadir a la ruta». La vía ferrata se añade al final de la ruta como un tramo propio, con un punto en cada extremo.',
  'help.guide.tour-run-plan.title': 'Planificar una carrera a tu ritmo',
  'help.guide.tour-run-plan.tip.1': 'Sin ritmo, la carrera no se puede guardar.',
  'help.guide.tour-run-ways.step.3':
    'Haz clic en «Firme» y luego en un tipo de firme de la lista para ver en el mapa solo esos tramos.',
  'help.ctx.trip-tour-walk.bullet.3':
    'Cuando el paseo está en un día con hora de inicio, «Horarios para», arriba de «Puntos de ruta», muestra ese día, y cada parada indica su hora de llegada, su estancia y lo que dice su horario de apertura.',
  'help.guide.tour-walk-plan.step.4':
    'Ponle a la parada una «Etiqueta» y una «Estancia en minutos». Deja la estancia vacía si aún no la sabes, e introduce 0 para un punto por el que solo pasas.',
  'help.guide.tour-walk-sights.goal': 'Elige un tema, busca a lo largo del paseo y añade un lugar como parada.',
  'help.guide.tour-walk-sights.tip.3':
    'Los horarios y las webs proceden de la fuente, casi siempre OpenStreetMap. Compruébalos antes de ir.',
  'help.guide.tour-walk-day-times.tip.1':
    'Sin hora de inicio, la línea lo indica: «Give the walk a time on this day to see arrivals and opening hours».',
  'help.guide.tour-walk-google-import.step.2':
    'Pega el enlace en «Enlace a la ruta a pie» y haz clic en «Leer el enlace».',
  'help.guide.tour-walk-check-off.goal':
    'Marca durante el día las paradas visitadas u omitidas y comprueba cuánto queda por caminar.',
  'help.guide.tour-walk-check-off.result':
    'Las paradas visitadas aparecen marcadas, las omitidas tachadas, y el tiempo restante solo cuenta lo que queda por delante.',
  'help.guide.tour-bike-profile.goal':
    'Empieza una ruta en bici y deja que TREK la calcule para cicloturismo, carretera, gravel o MTB.',
  'help.guide.tour-bike-profile.tip.1':
    'Si cambias el perfil más tarde, toda la ruta se vuelve a planificar para el nuevo perfil.',
  'help.guide.tour-bike-surfaces.step.2':
    'La insignia de la cabecera de la tarjeta indica qué parte de la ruta se sabe que no está asfaltada.',
  'help.guide.tour-bike-mtb-grades.title': 'Comprobar la dificultad de los senderos de una ruta en bici de montaña',
  'help.guide.tour-bike-mtb-grades.tip.3':
    'Si no se ha podido leer la dificultad, la tarjeta lo indica. Haz clic en «Reintentar».',
  'help.ctx.trip-tour-ski.bullet.5':
    'Con una excursión de «Esquí e invierno» abierta, el mapa muestra las pistas de OpenSnowMap, con «Leyenda de pistas» junto a su interruptor. Todo son datos cartográficos: nada de esto indica si una pista o un remonte está abierto, cómo está la nieve ni nada sobre aludes.',
  'help.guide.tour-ski-plan.step.6':
    'Ponle un nombre a la excursión en «Nombre de la excursión» y haz clic en Guardar.',
  'help.guide.tour-ski-options.step.1':
    'En una excursión de «Esquí e invierno», las opciones del calculador están bajo «Disciplina». Solo ves las que usa tu disciplina: «Esquí de fondo», por ejemplo, no tiene «Pistas más difíciles».',
  'help.guide.tour-ski-options.result':
    'La excursión se vuelve a planificar dentro de tus límites, y la tarjeta «Ruta por pistas» muestra las pistas más difíciles que ha evitado.',
  'help.guide.tour-ski-fix-leg.tip.3':
    'Sin conexión, los tramos se dibujan rectos de momento. Una fila gris sobre senderos de verano es una nota, no un error.',
  'help.guide.tour-ski-summary.tip.1':
    '«Evitadas» muestra las pistas más difíciles que el calculador evitó por tu límite de «Pistas más difíciles».',
  'help.guide.tour-ski-pistes-layer.step.2':
    'Haz clic en «Leyenda de pistas», el botón con cuatro puntos de colores junto al interruptor.',
  'help.guide.tour-ski-import.step.1':
    'En la pestaña «Excursiones», haz clic en «Añadir ruta» (el más encima de «Excursiones de este viaje»), elige «Importar GPX o KML» y selecciona el archivo.',
  'help.guide.tour-ski-import.tip.3':
    'También puedes soltar archivos GPX, KML o KMZ en cualquier parte de la pestaña «Excursiones» para abrir la misma vista previa.',
  'help.ctx.trip-tour-paddle.bullet.5':
    '«Viento» muestra la previsión en el inicio de la excursión para el día en que está planificada. «Lista de comprobación» muestra los obstáculos de la ruta guardada y lo que decidiste en cada uno.',
  'help.guide.tour-paddle-setup.step.5':
    'En un lago, «Por los lagos» define la ruta: «En línea recta» es la más corta, y «Cerca de la orilla» va pegada a la orilla para los días de viento.',
  'help.guide.tour-paddle-water-route.title': 'Planificar los tramos por el agua',
  'help.guide.tour-paddle-water-route.tip.2':
    'Donde la ruta portea la embarcación alrededor de un azud o pasa por una esclusa, TREK coloca ahí un punto propio, marcado como «Detectado». Si lo mueves o lo cambias, pasa a ser tuyo.',
  'help.guide.tour-paddle-portage.step.3':
    'Bajo el punto aparece una tarjeta «Porteo» con su longitud y los minutos adicionales. Haz clic en ella para abrirla.',
  'help.guide.tour-paddle-lock.goal': 'Añade una esclusa a la excursión e incluye en su tiempo la espera y el paso.',
  'help.guide.tour-paddle-lock.result':
    'La esclusa está en la excursión con sus minutos, y la «Estimación de tiempo» los suma.',
  'help.guide.tour-paddle-time.tip.1':
    'TREK empieza con 4 km/h en el agua, 2 km/h en el porteo y 10 minutos en cada porteo. Son valores iniciales para ajustar, no mediciones.',
  'help.guide.tour-paddle-wind.step.3':
    'Las barras muestran las horas del día, con las rachas detrás del viento medio. Pasa el cursor por una barra para ver los datos y la dirección de esa hora.',
  'help.guide.tour-paddle-checklist.goal':
    'Consulta lo que se sabe sobre azudes, esclusas y normas de acceso en una ruta guardada, y decide qué harás en cada caso.',
  'help.guide.tour-paddle-checklist.tip.3':
    'Una entrada marcada con «Volver a comprobar» se decidió antes de que cambiaran la ruta o los datos. Vuelve a decidirla, o elige «Mantener la decisión» o «Quitar la decisión». Las decisiones que ya no aplican aparecen en «Decisiones anteriores».',
  'help.guide.tour-paddle-track-marks.step.3': 'Haz clic en «Importar 1 excursión».',
  'help.guide.tour-paddle-track-marks.result':
    'El track grabado incluye sus porteos y esclusas, y su «Estimación de tiempo» los cuenta.',
  'help.guide.tour-horse-plan.title': 'Planificar una ruta a caballo por itinerarios ecuestres',
  'help.guide.tour-horse-plan.step.7':
    'Ponle un nombre a la ruta en «Nombre de la excursión» y haz clic en Guardar, abajo de la columna izquierda.',
  'help.guide.tour-horse-gap.goal': 'Continúa con un tramo que empieza lejos del final de tu ruta.',
  'help.guide.tour-horse-gap.tip.3':
    'Un tramo que empieza a menos de 25 m del final de tu ruta continúa directamente desde ahí, y «Conexión con tu ruta» indica «Enlaza con el final de tu ruta».',
  'help.guide.tour-horse-recorded.tip.1':
    'La línea se queda exactamente como la grabó el archivo. No se recalcula nada, y una ruta grabada no tiene versión editable.',
  'help.guide.dateless-trip.result':
    'La tarjeta muestra «Idea» y «Sin fechas», y el viaje tiene tantos días vacíos como pediste.',
  'help.guide.trip-reminder.title': 'Recibir un recordatorio antes de un viaje',
  'help.guide.upcoming-reservations.tip.1':
    'Una estancia de hotel aparece dos veces: una para la entrada y otra para la salida.',
  'help.guide.half-company-holiday.result':
    'La empresa libra medio día, y un día de vacaciones registrado ese día cuenta solo como medio día.',
  'help.guide.edit-holiday-calendar.title': 'Cambiar o quitar un calendario de festivos',
  'help.guide.answer-fusion-request.result':
    'Tras «Aceptar y fusionar», los dos planes aparecen en una sola cuadrícula, cada persona con su color.',
  'help.guide.log-for-partner.result':
    'Los días aparecen con el color de la otra persona y se descuentan de sus días, no de los tuyos.',
  'help.guide.dissolve-fusion.tip.1':
    'Cancelar en esa ventana deja el plan como está; tus entradas se conservan en cualquier caso.',
  'help.guide.country-places.tip.1':
    'Si un lugar aparece en el país equivocado, normalmente tiene una dirección o unas coordenadas incorrectas. Abre su viaje desde aquí y corrige el lugar allí.',
  'help.guide.tour-activity-stats.title': 'Ver lo que has hecho en tus excursiones',
  'help.guide.tour-activity-stats.result':
    'Los totales del cuadro y de la pestaña «Excursiones» ya no incluyen la excursión excluida. Su ruta, sus días y el viaje no cambian.',
  'help.guide.move-to-list.tip.2':
    'Mover quita lugares de la lista, así que solo su propietario o un administrador ven «Mover a lista». «Duplicar en lista» funciona desde cualquier lista que puedas abrir.',
  'help.guide.accept-list-invite.step.2': 'Haz clic en Aceptar para unirte o en Rechazar para declinar la invitación.',
  'help.guide.tour-collection-add-to-trip.tip.2':
    'Si una excursión se guardó sin línea, hay que añadirla con sus puntos de ruta. El cuadro te lo indica y selecciona esa opción por ti.',
  'help.guide.tour-collection-manage.tip.1':
    'Quitar una excursión de la lista no cambia las excursiones que ya se crearon a partir de ella en tus viajes.',
  'help.guide.entry-draft.tip.2':
    'Cuando incorporas un día desde Dawarich, sus entradas son borradores. Busca la insignia antes de compartir.',
  'help.guide.journey-map-layers.result':
    'El mapa muestra solo las capas que quieres, y la leyenda explica cada marcador, punto y línea.',
  'help.guide.journey-keep-route.result':
    'La cabecera del día muestra la distancia, y la ruta aparece con línea continua en la capa «Grabado» del mapa para todos los participantes de la travesía. Un enlace compartido solo la muestra si «Rutas grabadas» está activado.',
  'help.guide.journey-day-stays.result':
    'Las estancias sobre las que has decidido desaparecen de la fila. Las entradas que escribiste aparecen en su día como cualquier otra, y puedes añadir fotos y texto como siempre.',
  'help.guide.journey-take-over-day.tip.2':
    'Los borradores no aparecen en los enlaces compartidos. Añade fotos y texto, y luego desactiva «Borrador» en cada entrada.',
  'help.guide.journey-auto-prepare.tip.2':
    'Un punto en el botón de lista de un día indica que el día aún no es definitivo; la descripción emergente explica por qué.',
  'help.ctx.settings-plugins.bullet.3':
    '«Actividad de plugins», abajo, muestra todas las acciones que han hecho los plugins en tu nombre, de la más reciente a la más antigua, con Actualizar.',
  'help.guide.language-region.tip.3':
    '«La semana comienza el» define la primera columna de todos los selectores de fecha; «Vacaciones» tiene su propio ajuste.',
  'help.guide.web-push-device.tip.2':
    'En iPhone y iPad, primero añade TREK a la pantalla de inicio y ábrelo desde ahí.',
  'help.guide.connect-airtrail.step.3':
    'Haz clic en Guardar y luego en «Probar conexión». Te indica cuántos vuelos ha encontrado, y la insignia cambia a «Conectado».',
  'help.guide.connect-dawarich.step.3':
    'Haz clic en Guardar y luego en «Probar conexión»: cuenta las estancias de los últimos 30 días. Una vez conectado, «Buscar ahora» comprueba al momento y «Desconectar», a la derecha, cierra la conexión.',
  'help.guide.tour-connect-wanderer.step.3':
    'Haz clic en Guardar y luego en «Probar conexión». Te indica cuántas de tus rutas puedes importar, y la insignia cambia a «Conectado».',
  'help.guide.tour-wanderer-watch.step.2':
    'Como mucho una vez al día, TREK lee el registro breve de cada ruta que hayas importado, y la fila indica cuándo comprobó por última vez. Si una ruta puede haber cambiado, recibes una notificación y «Avisos» la cuenta: haz clic en «Avisos» para ver cada excursión como «Puede haber cambiado», «Cambiado» o «No comprobable», y ábrela desde ahí.',
  'help.guide.plugin-settings.goal':
    'Dale a un plugin tus propias claves y preferencias, y consulta lo que ha hecho en tu nombre.',
  'help.guide.own-routing-engine.result': 'Las rutas de todos los viajes se calculan en tus servidores.',
  'help.guide.admin-passkeys.title': 'Ofrecer inicio de sesión con passkey',
  'help.guide.rotate-jwt-secret.tip.1': 'También se cierra tu sesión, así que vuelve a iniciarla justo después.',
  'help.guide.notification-defaults.title': 'Definir los valores predeterminados de notificaciones para los usuarios',
  'help.ctx.notifications.title': 'Notificaciones',
  'help.guide.read-notifications.goal':
    'Consulta lo que ha pasado en tus viajes mientras no estabas y ábrelo directamente.',
  'help.guide.filter-notifications.goal': 'Revisa todas tus notificaciones o solo las que aún no has leído.',
  'help.guide.mark-notifications-read.step.1':
    'Haz clic en «Marcar como leída», la doble marca junto a la hora de una notificación, para marcar solo esa.',
  'help.guide.delete-notifications.step.2':
    '«Eliminar todo», arriba, borra toda la lista de una vez, tras pedirte confirmación.',
  'help.guide.notification-settings.step.3':
    'Haz clic en «Notificaciones» en la barra lateral de «Ajustes». Su primera tarjeta tiene una fila por evento, y la columna «En la app» decide lo que muestra la campana.',
  'help.guide.link-journal.result':
    'Aparece la pestaña «Diario» en la barra de pestañas del viaje. Todos a quienes diste acceso de lectura o edición pueden abrir el diario en esa pestaña, con actualizaciones en directo.',
  'help.guide.create-place.tip.4':
    'Un enlace copiado de Google Maps también funciona en la búsqueda: pégalo, pulsa Intro y TREK obtiene el lugar a partir de él. En cuanto el formulario tiene una posición, «Lugares cerca de este marcador», la mira junto a la búsqueda, muestra lo que hay alrededor.',
  'help.guide.dawarich-stays.step.2':
    'Las estancias se agrupan por día, cada una con la hora de llegada y de salida; un icono de indicador marca las estancias de las que Dawarich no estaba seguro. Haz clic en «Añadir como lugar», el marcador junto a una estancia.',
  'help.guide.leave-stop-off-route.step.3':
    'Para volver a incluirla en la ruta, abre el mismo menú y elige «Volver a añadir a la ruta».',
  'help.guide.move-booking-day.tip.1':
    'Las filas atenuadas de los días intermedios de una reserva de varios días no se pueden arrastrar, ni tampoco un tramo suelto de un vuelo con escalas.',
  'help.guide.place-image-from-file.step.2':
    'Haz clic en la imagen redonda de la cabecera. Como el lugar tiene fotos, una pequeña ventana te pregunta de dónde sacar la imagen.',
  'help.guide.place-own-hours.goal':
    'Pon en la tarjeta el horario que has comprobado tú cuando el consultado es incorrecto o no aparece.',
  'help.guide.place-own-hours.tip.2':
    'El teléfono y el correo aparecen como píldoras en la cabecera de la tarjeta. Haz clic en uno para abrirlo en tu teléfono o en tu aplicación de correo.',
  'help.guide.edit-accommodation.tip.3':
    'Con «Difuminar códigos de reserva» activado en «Ajustes», «Pantalla», el número de confirmación se ve difuminado. Pasa el cursor por encima o haz clic en él para leerlo.',
  'help.guide.confirm-stay-booking.tip.1': 'Vuelve a hacer clic en la píldora y la reserva vuelve a «Pendiente».',
  'help.guide.map-markers.tip.4':
    'Con «Marcadores compactos para lugares sin planificar» activado, en «Ajustes» > «Pantalla», en «Viaje y mapa», los lugares que aún no están en ningún día aparecen como puntos pequeños sin foto ni valoración. El lugar que eliges siempre se muestra completo.',
  'help.guide.tour-map-lines.step.1':
    'Cada excursión del viaje se muestra en el mapa como una línea de su color, con su marcador en el punto de inicio. Si has elegido un color para la excursión, la línea lo usa; si no, usa el color de su categoría.',
  'help.guide.car-stops.step.6': 'Haz clic en Añadir.',
  'help.guide.transport-details.step.4':
    'Haz clic en el título para cambiar el nombre del trayecto sin abrir el formulario. «Renombrar» se abre con el nombre ya escrito: escribe el nuevo y haz clic en Guardar.',
  'help.guide.export-transports-csv.goal':
    'Exporta desde TREK los trayectos del viaje a un archivo CSV para una hoja de cálculo, una agencia de viajes o para imprimirlos.',
  'help.guide.group-sort-bookings.result':
    'Las reservas aparecen en las secciones y en el orden que elegiste, y este navegador recuerda la elección para la próxima vez.',
  'help.guide.booking-on-map.step.1':
    'Haz clic en la tarjeta de una reserva que tenga un lugar, vinculado en «Lugar / Actividad» o, si es una estancia, en «Alojamiento». Se abre su detalle.',
  'help.guide.export-bookings-csv.title': 'Exportar las reservas como hoja de cálculo',
  'help.guide.export-bookings-csv.tip.3':
    'El botón aparece en cuanto la pestaña tiene una reserva. La pestaña «Transportes» exporta sus propias entradas de la misma forma.',
  'help.guide.arrange-packing-list.title': 'Ordenar la lista de equipaje a tu manera',
  'help.guide.count-packed-pieces.result':
    'La fila muestra cuántas unidades están guardadas, y el artículo se marca en cuanto guardas la última.',
  'help.guide.expense-receipts.title': 'Adjuntar un recibo a un gasto',
  'help.guide.expense-receipts.tip.1':
    'En el editor, un clic en el nombre de un archivo de la lista abre la misma vista previa. En ese caso, Esc solo cierra la vista previa, no el gasto.',
  'help.guide.files-sync-settings.step.5':
    '«Cuando ambos lados cambiaron» decide qué copia se conserva si un documento se ha editado en los dos sitios: «Preguntarme», «Conservar la copia de TREK» o «Conservar la copia del almacén». «Sincronizar automáticamente» permite que TREK busque cambios en segundo plano; si está desactivado, la tarjeta indica «En pausa» y solo «Sincronizar ahora» sincroniza. Cada cambio aquí se guarda al momento.',
  'help.guide.manage-notes.step.5':
    'Eliminar pregunta antes, «¿Eliminar nota?», porque la nota se borra para todos los miembros, junto con sus archivos. Haz clic en Eliminar para confirmar.',
  'help.guide.note-categories.step.3':
    'Haz clic en el nombre de una categoría para cambiarlo. Escribe el nuevo nombre y pulsa Intro; Esc mantiene el anterior.',
  'help.guide.roadtrip-reorder.step.2':
    'Para pasar una parada a otro día, suéltala sobre una parada de la tarjeta de ese día. Mientras arrastras, los días con menos de dos paradas aparecen como tarjetas discontinuas al final del carril, y también puedes soltarla ahí.',
  'help.guide.roadtrip-corridor.tip.4':
    'Debajo del filtro, elige una parada del día, o «A medio camino entre dos», para ver solo lo que está a menos de 25, 50 o 100 km de ese punto. Si hay puntos de carga en la lista, «Cualquier conector» y «Cualquier potencia» los filtran por tipo de enchufe y potencia.',
  'help.guide.roadtrip-overnight.result':
    'El lugar aparece en el trayecto como la parada para pasar la noche de ese día, y la estancia queda reservada en el viaje como cualquier otra.',
  'help.guide.roadtrip-stop-fill.result':
    'En esta parada, el depósito se llena hasta el nivel elegido. La autonomía a partir de ahí, incluida cualquier franja «Aquí se vacía el depósito», se calcula con ese valor.',
  'help.guide.roadtrip-bookings.step.4': 'Haz clic en la tarjeta para abrir la reserva.',
  'help.guide.roadtrip-google-import.goal':
    'Convierte una ruta que planificaste en Google Maps en paradas de uno de tus días.',
  'help.guide.roadtrip-google-import.tip.3':
    'La importación necesita conexión y permiso para editar tanto los lugares como los días.',
  'help.guide.roadtrip-hazards.tip.2':
    'DWD cubre Alemania, y GDACS informa de catástrofes en todo el mundo. Un aviso que se muestra solo como un punto indica que su zona afectada es desconocida.',
  'help.ctx.trip-tours.bullet.5':
    'En la columna de días, una excursión es una fila como una parada. Con un «Inicio» muestra inicio → fin, con la hora de fin calculada a partir de la duración de la excursión, y «Más opciones» incluye Editar, «Quitar del día», «Quitar de la ruta» y «Guardar en colección».',
  'help.guide.tour-show-list.step.5': 'Haz clic en «Lugares» en el mismo selector para volver a la lista de lugares.',
  'help.guide.tour-add-to-day.step.2':
    'Elige el día. El menú muestra todos los días del viaje con su fecha y su título; los días que ya tienen la excursión aparecen en gris.',
  'help.guide.tour-add-to-day.result': 'La excursión aparece en su día, y su línea forma parte de ese día en el mapa.',
  'help.guide.tour-day-times.tip.2':
    'Un día con una etapa de una excursión de varios días no tiene hora de fin calculada, porque la duración de la excursión es la de toda la ruta.',
  'help.guide.tour-remove-from-day.step.3':
    'También puedes hacer clic en la cabecera del día para abrirlo, hacer clic en la excursión de la lista y después en «Quitar del día», al pie de su tarjeta.',
  'help.guide.tour-filter-list.step.3':
    'Si la lista los mezcla, «Origen» (TREK, «Importación GPX», wanderer), «Límite de ruta» (T1 a T6) y «Tipo» («Senderismo», «Ruta en bicicleta», etc.) la filtran aún más. Vuelve a hacer clic en un valor marcado para quitarlo.',
  'help.guide.tour-hide-on-map.step.1':
    'Pasa el cursor por una excursión de la lista y haz clic en el ojo que aparece a la derecha de su fila («Ocultar en el mapa»).',
  'help.guide.tour-import-plan-tab.step.1':
    'En la pestaña «Planificado», haz clic en «Excursiones» en el selector de la parte superior de la columna derecha.',
  'help.ctx.trip-tour-detail.bullet.1':
    'Haz clic en una excursión de la lista «Excursiones» (antes cambia la columna derecha de «Lugares» a «Excursiones»), en su fila dentro de un día o en su línea del mapa, y su tarjeta se abre sobre el mapa. Puedes seguir usando el mapa con la tarjeta abierta.',
  'help.guide.tour-detail-read.step.2':
    'La cabecera muestra el nombre de la excursión y un resumen en píldoras: qué tipo de excursión es, de dónde procede si se importó, la duración prevista, la distancia, el desnivel positivo y el negativo.',
  'help.guide.tour-detail-read.tip.3':
    'Algunas excursiones muestran más: un paseo urbano, sus paradas; una excursión de remo, sus comprobaciones y el viento; una excursión ya hecha, su «Track real»; y una excursión vinculada a una lista, su «Lista de equipaje».',
  'help.guide.tour-rename-colour.step.3':
    'Haz clic en el punto de color de la esquina de la casilla redonda de la excursión, «Color del track». La sección «Color del track» se abre bajo la cabecera.',
  'help.guide.tour-take-along.step.2':
    'Si la excursión tiene una página web, el botón de al lado muestra el nombre del sitio (Komoot, AllTrails, Outdooractive o Wanderer) o «Sitio web» para cualquier otro. Abre la página en una pestaña nueva.',
  'help.guide.tour-copy-keep.goal':
    'Crea una variante de una excursión en este viaje, o guárdala en una de tus colecciones para futuros viajes.',
  'help.guide.tour-copy-keep.tip.4':
    '«Colección» solo aparece si el complemento «Colecciones» está activado. Una lista que solo puedes leer no se puede elegir y, si aún no tienes ninguna lista, el cuadro ofrece «Abrir colecciones».',
  'help.guide.tour-packing-link.step.5':
    'Haz clic en «Abrir la lista de equipaje» para ir marcando artículos. TREK cambia a la pestaña «Listas», en la lista de equipaje.',
  'help.guide.tour-files.step.2': 'La fila de debajo indica ahora cuántos hay, y la lista se despliega.',
  'help.guide.tour-activity-link.step.2':
    'En «Hecha el», comprueba el día en que la hiciste. Elige «Sin día» si no corresponde a ninguno.',
  'help.guide.tour-activity-compare.title': 'Comparar el plan con lo que hiciste',
  'help.guide.tour-activity-compare.result':
    'Puedes comparar rápidamente el día con el plan, en la tarjeta y en el mapa.',
  'help.guide.tour-origin-check.tip.3':
    '«Sin conexión con wanderer» significa que tu cuenta aún no está conectada. Conéctala en «Ajustes», «Integraciones».',
  'help.ctx.trip-tour-planner.bullet.5':
    '«Buscar lugar o dirección», arriba del mapa, desplaza el mapa. La píldora de abajo a la izquierda cambia entre los mapas que ofrece el tipo de excursión, como Topo o «Satélite», e incluye los interruptores de la excursión abierta, como «Colocar puntos» y 3D.',
  'help.guide.tour-open-workspace.step.5':
    '«Buscar lugar o dirección», arriba del mapa, lleva el mapa a un lugar para que puedas empezar donde está la excursión.',
  'help.guide.tour-draw-route.goal':
    'Coloca en el mapa los puntos de una nueva excursión y deja que TREK calcule la ruta entre ellos.',
  'help.guide.tour-draw-route.tip.2':
    'Topo o «Senderismo» en la píldora del mapa muestran los senderos, así es más fácil hacer clic en uno. Si un punto está demasiado lejos de cualquier camino que pueda usar ese tipo, recibes un aviso en lugar de una ruta.',
  'help.guide.tour-type-profile.step.3':
    'Una ruta en bici pide su «Perfil» bajo el tipo: «Cicloturismo», «Carretera», Gravel o MTB. La línea de debajo explica qué prefiere el perfil.',
  'help.guide.tour-edit-points.step.2':
    'Haz clic en una fila de «Puntos de ruta» para seleccionar su punto. Su marcador se resalta en el mapa.',
  'help.guide.tour-shaping-points.title': 'Modificar la ruta con un punto de forma',
  'help.guide.tour-shaping-points.tip.3':
    'En una ruta a caballo, un clic en la línea no añade nada, porque ningún calculador le da forma.',
  'help.guide.tour-loop-reverse.tip.2':
    'Quita la fila «Vuelta al inicio» para que vuelva a ser una excursión de solo ida. Un tramo dibujado a mano sigue así al invertir la excursión.',
  'help.guide.tour-leg-by-hand.step.4':
    '«Volver a calcular el siguiente tramo» vuelve a pedir al calculador solo ese tramo, sin tocar los demás.',
  'help.guide.tour-trip-places.step.3':
    'Haz clic en un lugar. Se añade como nuevo final de la excursión, y la lista sigue abierta para el siguiente.',
  'help.guide.tour-details-times.step.1':
    '«Nombre de la excursión», arriba del carril izquierdo, contiene el nombre. En una excursión nueva, el texto gris que aparece ahí, por ejemplo «Ruta de senderismo sin título», es solo un texto de ejemplo: escribe el tuyo.',
  'help.guide.tour-save.title': 'Guardar una excursión',
  'help.guide.tour-save.tip.3':
    'Guardar tampoco funciona si algún campo tiene un valor no válido, como una web que no es una dirección. «Detalles» se abre automáticamente para mostrarlo.',
  'help.guide.tour-edit-saved.tip.1': 'Guardar sigue en gris si no has cambiado la excursión.',
  'help.guide.tour-summary-profile.step.3':
    'Pasa el puntero por el «Perfil de altitud». Muestra la distancia y la altitud en ese punto, y un punto marca el mismo sitio en el mapa.',
  'help.guide.tour-list-manage.step.1':
    '«Totales del viaje» está encima de la lista. Plegado, muestra el número de excursiones y cuántas están en «Planeado» y «Sin planificar». La flecha de su derecha abre una línea por tipo con la distancia, el desnivel positivo, el desnivel negativo y los tiempos sumados.',
  'help.guide.tour-list-manage.result':
    'Ves los totales de las excursiones que muestra el filtro, y cada excursión está en el día que quieres.',
  'help.guide.tour-delete.result': 'La excursión desaparece de la lista, del mapa y de todos los días.',
  'help.guide.tour-saved-elsewhere.tip.2':
    'Pasa lo mismo si cambiaste la excursión en otro dispositivo. Una excursión que no has cambiado simplemente se recarga, y una nota te lo indica.',
  'help.ctx.trip-tour-import.bullet.5':
    'Cuando wanderer está conectado en «Ajustes», «Integraciones», aparece un botón wanderer junto a «Planificar nueva excursión» mientras no haya ninguna excursión abierta. Muestra tus propias rutas para importarlas.',
  'help.guide.tour-import-gpx.tip.1':
    'También puedes arrastrar los archivos desde tu ordenador hasta la pestaña «Excursiones» y soltarlos ahí. Se abre la misma vista previa.',
  'help.guide.tour-view-import.step.1':
    'En la pestaña «Excursiones», haz clic en una excursión con la insignia «Importación GPX» en «Excursiones de este viaje».',
  'help.guide.tour-plan-from-import.goal':
    'Obtén puntos de ruta que puedas mover a partir de un track grabado y comprueba cuánto se ajusta a él la nueva ruta.',
  'help.guide.tour-plan-from-import.tip.4':
    'Una «Ruta a caballo» no tiene versión editable: se conserva tal como se recorrió.',
  'help.guide.tour-restore-recorded.tip.2':
    'Una excursión creada con «Planificar como excursión nueva» no tiene track grabado propio. La importación de la que procede sigue en la lista.',
  'help.guide.tour-take-over.step.5': 'Si quieres, dale otro nombre en «Nombre en este viaje».',
  'help.guide.tour-import-wanderer.step.1':
    'En la pestaña «Excursiones», sin ninguna excursión abierta, haz clic en wanderer junto a «Planificar nueva excursión».',
  'help.guide.tour-import-wanderer.result':
    'La ruta es ahora una excursión del viaje y se abre en el mapa como «Excursión de wanderer».',
  'help.guide.tour-map-layers.title': 'Elegir el mapa de una excursión',
  'help.guide.tour-map-layers.tip.3':
    'Una excursión de remo y un paseo urbano solo ofrecen «Mapa» y «Satélite»; una carrera, una excursión de esquí y una ruta a caballo ofrecen «Mapa», Topo y «Satélite».',
  'help.guide.tour-along-search.result':
    'Los lugares a lo largo de la ruta están en la lista y en el mapa, listos para consultarlos.',
  'help.guide.tour-along-add-stop.step.3':
    'Haz clic en «Añadir como parada». La insignia de al lado es una estimación aproximada del desvío, medido en línea recta.',
  'help.guide.tour-3d-terrain.step.1':
    'Abre una excursión en la pestaña «Excursiones» y haz clic en 3D, al final de la píldora de abajo a la izquierda. El mapa se inclina y muestra el relieve en 3D, con la ruta dibujada encima.',
  'help.guide.tour-3d-terrain.tip.3':
    'El relieve necesita conexión: sus altitudes proceden de las teselas de relieve abiertas de Mapzen. Una excursión de remo se muestra con su propio color, sin pendientes, porque el agua es plana.',
  'help.guide.tour-3d-flyover.tip.1':
    'Gira la rueda del ratón durante el sobrevuelo para acercar o alejar; la cámara sigue centrada en el punto. No puedes arrastrar el mapa hasta que lo pauses.',
  'help.guide.tour-map-overlays.step.4':
    'En una excursión de remo, la píldora ofrece en su lugar «Señales náuticas». Haz clic para ver boyas, balizas y señales de puerto en el agua.',
  'help.ctx.trip-tour-stages.bullet.2':
    '«Terminar etapa aquí», en el menú «Más acciones» de una parada, termina una etapa en esa parada. «Puntos de ruta» muestra entonces un título «Etapa N» por cada etapa, con su distancia y su tiempo, y la parada que termina una etapa tiene un icono de luna.',
  'help.guide.tour-multi-day.step.3':
    'Pasa el cursor por la parada donde termina el primer día, haz clic en «Más acciones» y elige «Terminar etapa aquí».',
  'help.guide.tour-multi-day.result':
    'Una ruta con sus etapas, cada una con sus propias medidas. Haz clic en Guardar para conservarlas.',
  'help.guide.tour-stages-on-days.step.6':
    'La flecha de al lado, «Abrir esta etapa en el planificador», abre la excursión en el editor por esa etapa.',
  'help.ctx.trip-tour-hike.bullet.1':
    '«Tipo de ruta», arriba del editor, decide cómo se planifica la ruta. «Senderismo» usa senderos hasta la «Dificultad máxima del sendero» de «Detalles»; «Carrera a pie» usa caminos aptos para correr y pide tu «Ritmo previsto».',
  'help.guide.tour-hike-plan.step.1':
    'Haz clic en «Planificar nueva excursión», arriba de la columna izquierda. El editor se abre como «Nueva excursión».',
  'help.guide.tour-hike-plan.tip.2':
    'A partir de T4, primero se pregunta «¿Activar rutas alpinas?». Confirma solo si la ruta puede pasar por terreno expuesto o sin señalizar; la pregunta aparece una vez por sesión de edición.',
  'help.guide.tour-hike-trail-details.step.4':
    'Haz clic en un grado de la lista para ver en el mapa solo esos tramos. Vuelve a hacer clic para mostrar toda la ruta.',
  'help.guide.tour-hike-round.step.1':
    'Con la caminata abierta, haz clic en «Ruta circular desde el inicio» en la cabecera de la tarjeta «Puntos de ruta». Desde otra parada, abre su menú «Más acciones» y elige «Ruta circular desde aquí».',
  'help.guide.tour-hike-round.tip.3':
    '«Buscar de nuevo» vuelve a la distancia, y Cancelar cierra la tarjeta sin cambiar nada.',
  'help.guide.tour-hike-compare-ways.tip.1':
    'Solo las caminatas ofrecen esta opción, y solo para tramos que ha planificado el calculador, no para los dibujados a mano.',
  'help.guide.tour-ferrata-add.step.4':
    'En «Puntos de ruta», el tramo entre esos dos puntos muestra el nombre, el grado y la longitud de la vía ferrata.',
  'help.guide.tour-run-plan.goal':
    'Planifica una carrera por caminos aptos para correr y obtén su duración a partir de tu ritmo.',
  'help.guide.tour-run-plan.tip.2':
    'Las subidas, las bajadas y la dificultad técnica del camino no cuentan en el tiempo: es distancia por ritmo y nada más.',
  'help.guide.tour-run-ways.result': 'Antes de salir ya sabes qué partes de la carrera no son de asfalto.',
  'help.ctx.trip-tour-walk.bullet.4':
    '«A lo largo de la ruta» busca lugares de interés según el «Tema del paseo» a una distancia de la ruta, y «Añadir como parada» incluye uno en el paseo donde elijas.',
  'help.guide.tour-walk-plan.step.5':
    'Pon «Importancia» en «Habitual», «Opcional» o «Imprescindible». Activa «Protegida» en una parada que deba quedarse donde está si más adelante se propone un cambio, y haz clic en Guardar.',
  'help.guide.tour-walk-sights.step.1':
    'Con un paseo urbano abierto, busca «A lo largo de la ruta» en la columna izquierda y elige un «Tema del paseo»: «Cultura e historia», «Parques y vistas», «Comida y vida local» o «Un poco de todo».',
  'help.guide.tour-walk-sights.result':
    'El lugar de interés es ahora una parada del paseo, incluida en la ruta entre las paradas que elegiste.',
  'help.guide.tour-walk-day-times.tip.2':
    'Si una parada aún no tiene tiempo de estancia, las horas de llegada posteriores se muestran como las más tempranas posibles.',
  'help.guide.tour-walk-google-import.step.3':
    'Revisa «Paradas del enlace». Las paradas sin posición en el enlace se marcan y se omiten.',
  'help.guide.tour-walk-check-off.step.1':
    'En la pestaña «Planificado», haz clic en el paseo urbano dentro de su día. Su tarjeta se abre junto al mapa.',
  'help.ctx.trip-tour-bike.title': 'Rutas en bici',
  'help.guide.tour-bike-profile.step.1':
    'En la pestaña «Excursiones», haz clic en «Planificar nueva excursión», arriba del carril izquierdo.',
  'help.guide.tour-bike-profile.tip.2':
    'El perfil solo orienta al calculador. No indica si un camino se puede recorrer en bici: la tarjeta «Firme y vías» muestra por dónde va la ruta.',
  'help.guide.tour-bike-surfaces.step.3':
    'En «Firme», haz clic en una fila, como Gravel o «Tierra natural». Sus tramos se resaltan en el mapa. Vuelve a hacer clic en la fila para quitar el resaltado.',
  'help.guide.tour-bike-mtb-grades.goal':
    'Comprueba lo difíciles que son los senderos de una ruta MTB antes de recorrerlos.',
  'help.guide.tour-bike-mtb-grades.tip.4':
    'Si cambias «Perfil» a otro que no sea MTB, las secciones de dificultad desaparecen y la ruta se vuelve a planificar para el nuevo perfil.',
  'help.guide.tour-ski-plan.title': 'Planificar una excursión de esquí e invierno',
  'help.guide.tour-ski-plan.tip.1':
    'Para «Esquí de fondo», elige también la «Técnica»: «Clásica», Skating o «Desconocida». El aviso bajo los campos indica lo que aún falta.',
  'help.guide.tour-ski-options.step.2':
    'Abre «Pistas más difíciles» y elige la dificultad máxima que quieres esquiar, de «Principiante» a «Experto». «Intermedia» es el valor predeterminado.',
  'help.guide.tour-ski-fix-leg.title': 'Arreglar un tramo de esquí que no se ha podido planificar',
  'help.guide.tour-ski-fix-leg.tip.4':
    'Hasta que todos los tramos estén planificados, la tarjeta «Ruta por pistas» indica que aún no hay tiempo de esquí.',
  'help.guide.tour-ski-summary.tip.2':
    '«Tiempo de esquí» sigue en «Sin calcular» hasta que todos los tramos estén planificados. Si quieres darle igualmente un tiempo a la excursión, introduce un total previsto en sus detalles.',
  'help.guide.tour-ski-pistes-layer.step.3':
    'La leyenda muestra las pistas de descenso por dificultad, los circuitos de fondo, los senderos invernales y de raquetas, las pistas de trineo y los remontes. «Leyenda completa en OpenSnowMap» abre la leyenda completa.',
  'help.guide.tour-ski-import.step.2':
    'En la «Vista previa de la importación», abre «Importar como» y elige «Esquí e invierno».',
  'help.guide.tour-ski-import.result':
    'El track está en «Excursiones de este viaje», con su disciplina y su técnica en la tarjeta «Ruta de esquí».',
  'help.ctx.trip-tour-paddle.bullet.6':
    '«Remar tiene riesgos», la fila al pie de la columna izquierda, abre «Seguridad en el agua». El mapa ofrece «Mapa» y «Satélite», y «Señales náuticas» como capa superpuesta.',
  'help.guide.tour-paddle-setup.step.6':
    '«Velocidad de remo» muestra en gris la velocidad sugerida para la embarcación. Si escribes la tuya, el campo indica «Velocidad propia»; el enlace de debajo, «Use the suggested», vuelve a usar la velocidad de la embarcación.',
  'help.guide.tour-paddle-water-route.goal':
    'Deja que TREK planifique un tramo por el río o el lago, y entiende las notas de un tramo que no ha podido planificar.',
  'help.guide.tour-paddle-water-route.tip.3':
    'Las notas bajo un tramo planificado avisan de aguas bravas con su grado, de un «Paso para canoas» o de un «Hueco en los datos del mapa» salvado con una línea recta.',
  'help.guide.tour-paddle-portage.step.4':
    'En «Ruta», «Seguir el camino» usa un camino cartografiado y «Línea recta» va directamente. TREK busca el camino por su cuenta y te avisa si no hay ninguno sin un gran rodeo.',
  'help.guide.tour-paddle-lock.step.1':
    'Pasa el cursor por la parada de la esclusa y haz clic en «Más acciones», los tres puntos.',
  'help.guide.tour-paddle-time.title': 'Consultar y ajustar el tiempo de una excursión de remo',
  'help.guide.tour-paddle-time.tip.2': 'La corriente y el viento no se tienen en cuenta en la estimación.',
  'help.guide.tour-paddle-wind.step.4':
    'Abre «Qué significa el viento al remar» para saber cómo afectan a una embarcación el viento de cara, el viento lateral, las travesías abiertas y las rachas.',
  'help.guide.tour-paddle-checklist.step.1':
    'Guarda la excursión de remo y busca «Lista de comprobación» en la columna izquierda. La insignia de su cabecera resume el estado de la lista.',
  'help.guide.tour-paddle-checklist.tip.4':
    'Los obstáculos proceden de los datos de OpenStreetMap de las regiones que tiene TREK. Si no hay datos, la tarjeta te lo indica, y tienes que comprobar tú los azudes, esclusas y porteos.',
  'help.guide.tour-paddle-track-marks.step.4':
    'Haz clic en el track en «Excursiones de este viaje». La columna izquierda lo muestra tal como se grabó, con la tarjeta «Porteos y esclusas».',
  'help.ctx.trip-tour-horse.title': 'Rutas a caballo',
  'help.guide.tour-horse-plan.goal':
    'Crea una ruta a caballo con tramos de los itinerarios ecuestres señalizados en la vista de mapa.',
  'help.guide.tour-horse-plan.result':
    'La ruta sigue los tramos que elegiste, cada uno con el nombre de su itinerario, el punto que indica su acceso y su longitud, y aparece en «Excursiones de este viaje».',
  'help.guide.tour-horse-gap.step.1':
    'Con un tramo en la ruta, abre otro itinerario y elige un tramo que no toque el final de tu ruta. En «Conexión con tu ruta», un aviso indica a qué distancia están.',
  'help.guide.tour-horse-recorded.title': 'Conservar una ruta a caballo grabada a partir de un archivo GPX',
  'help.guide.tour-horse-recorded.tip.2':
    'Un archivo sin altitudes muestra «Sin altitudes en el archivo» en lugar de un desnivel de cero.',
  'help.guide.dateless-trip.tip.1':
    'Cuando sepas cuándo viajas, abre el formulario con el lápiz de la tarjeta y elige las fechas. Los días que ya has planificado mantienen su orden y reciben las fechas en ese mismo orden.',
  'help.guide.trip-reminder.goal': 'Recibe un aviso unos días antes de salir.',
  'help.guide.upcoming-reservations.tip.2':
    '«Pendiente» indica una reserva que aún no está confirmada. Las reservas canceladas y los viajes archivados no aparecen.',
  'help.guide.half-company-holiday.tip.1':
    'Las vacaciones ya registradas ese día se reducen a medio día. Quien registre ese día más adelante solo gastará 0,5 días.',
  'help.guide.edit-holiday-calendar.goal':
    'Cambia el nombre o el color, mueve o elimina un calendario de festivos o de vacaciones escolares que hayas añadido.',
  'help.guide.person-color.title': 'Cambiar el color de una persona',
  'help.guide.answer-fusion-request.tip.1':
    'La solicitud sigue abierta hasta que la respondas. Si hay varias, las verás una detrás de otra.',
  'help.guide.log-for-partner.tip.1': '«Medio día» y «Compensación» también funcionan para la persona seleccionada.',
  'help.guide.dissolve-fusion.tip.2': 'Si solo quieres que alguien vea tus días, comparte tu calendario.',
  'help.guide.country-details.tip.2':
    'Haz clic en la insignia «Lugares» para ver todos los lugares que cuentan para el país, agrupados por viaje.',
  'help.guide.country-places.tip.2':
    'La insignia solo aparece si el país tiene lugares propios. Un país que solo has marcado a mano no tiene ninguno.',
  'help.guide.tour-activity-stats.goal':
    'Consulta la distancia, el desnivel y el número de excursiones que has hecho en todos tus viajes, por periodo y tipo, y excluye las excursiones que no llegaron a hacerse.',
  'help.guide.tour-activity-stats.tip.1':
    'Una excursión cuenta cuando termina su último día. Una excursión que no está en ningún día, o solo en días sin fecha, nunca cuenta. Para que cuente, ponla en un día con fecha de su viaje.',
  'help.guide.move-to-list.result':
    'Los lugares están en la otra lista, y una breve nota indica cuántos se han movido o duplicado.',
  'help.guide.accept-list-invite.tip.1':
    'Lo que puedes hacer en la lista depende del rol que te haya dado el propietario: «Lector», Editor o «Administrador».',
  'help.guide.tour-collection-add-to-trip.title': 'Añadir a un viaje una excursión de una lista',
  'help.guide.tour-collection-add-to-trip.tip.3':
    'Para guardar una excursión en una lista, abre una excursión guardada en el viaje y haz clic en «Colección», al pie.',
  'help.guide.tour-collection-manage.tip.2': 'Solo el propietario y los administradores de la lista ven la papelera.',
  'help.guide.entry-draft.result':
    'La entrada sigue en tu cronología, marcada como «Borrador», y no aparece en el enlace compartido.',
  'help.guide.journey-map-layers.title': 'Elegir lo que muestra el mapa de la travesía',
  'help.guide.journey-keep-route.title': 'Guardar la ruta que grabaste un día',
  'help.guide.journey-day-stays.title': 'Escribir entradas a partir de las estancias que registró Dawarich',
  'help.guide.journey-take-over-day.title': 'Incorporar un día grabado completo',
  'help.guide.journey-take-over-day.result':
    'El día tiene ahora un borrador por cada estancia o grupo unido, o una única crónica del día, y sus estancias ya no aparecen como pendientes.',
  'help.guide.journey-auto-prepare.result':
    'Mientras un viaje vinculado está en curso, las estancias de cada día aparecen en ese día, listas para «Incorporar día».',
  'help.ctx.settings-about.title': 'Acerca de',
  'help.guide.web-push-device.tip.3':
    'Push necesita que TREK esté abierto por HTTPS. Si las notificaciones están bloqueadas, permítelas en los ajustes del navegador y vuelve a intentarlo.',
  'help.guide.connect-airtrail.result':
    'La insignia muestra «Conectado», y la pestaña «Transportes» de un viaje ofrece «Importar desde AirTrail».',
  'help.guide.connect-dawarich.result':
    'La insignia muestra «Conectado», y el planificador de viajes, el diario y el atlas pueden ofrecerte lo que registró Dawarich.',
  'help.guide.tour-connect-wanderer.result':
    'La insignia muestra «Conectado», y la pestaña «Excursiones» de un viaje puede buscar en tu wanderer e importar sus rutas.',
  'help.guide.tour-wanderer-watch.result':
    'TREK comprueba tus rutas importadas y te avisa cuando alguna puede haber cambiado. Una excursión solo cambia si aceptas el cambio.',
  'help.guide.plugin-settings.step.1':
    'Abre «Plugins» en la barra lateral de ajustes. Bajo «Ajustes de complementos», cada plugin que necesita que configures algo tiene una tarjeta con sus campos: rellénalos y haz clic en Guardar. Las acciones de la tarjeta se ejecutan tras confirmarlas.',
  'help.guide.profile.step.3': 'Haz clic en «Guardar perfil», a la derecha del pie de la tarjeta.',
  'help.guide.default-user-settings.title': 'Definir con qué empiezan los usuarios nuevos',
  'help.guide.own-routing-engine.tip.1':
    'Los servidores públicos de OSRM admiten aproximadamente una petición por segundo. Basta para un día, pero puede ser demasiado lento para un viaje por carretera.',
  'help.guide.admin-passkeys.goal':
    'Permite que la gente inicie sesión con la huella, la cara o el PIN del dispositivo.',
  'help.guide.rotate-jwt-secret.tip.2':
    'Para cerrar la sesión de una sola persona, ponle una «Nueva contraseña» en «Editar usuario». Así solo se cierran sus sesiones.',
  'help.guide.notification-defaults.goal':
    'Decide cómo empiezan las notificaciones de cada usuario y bloquea por completo un canal para un evento.',
  'help.ctx.notifications.summary':
    'Todas las notificaciones que TREK te ha mostrado en la aplicación, de la más reciente a la más antigua: una reserva que alguien ha cambiado, un mensaje nuevo en el chat de un viaje, un calendario que te han compartido. La campana de arriba a la derecha muestra las diez más recientes; esta página, todas.',
  'help.guide.read-notifications.step.1':
    'Haz clic en la campana de arriba a la derecha. El número rojo indica cuántas notificaciones no has leído aún.',
  'help.guide.filter-notifications.step.1': 'Haz clic en la campana de arriba a la derecha.',
  'help.guide.mark-notifications-read.step.2':
    'Haz clic en «Marcar todo como leído», arriba, para marcar todas las notificaciones como leídas a la vez.',
  'help.guide.delete-notifications.tip.1':
    'Al eliminar una notificación, solo desaparece para ti. La reserva, el mensaje o el elemento compartido al que se refería no cambia.',
  'help.guide.notification-settings.tip.1':
    'Un candado en una casilla indica que el administrador ha desactivado ese evento para todos.',
  'help.guide.add-guest.tip.3':
    'Solo el propietario del viaje puede añadir, renombrar y quitar invitados. Un invitado que ha pagado un gasto no se puede quitar hasta que cambies quién pagó o elimines el pago.',
  'help.guide.link-journal.tip.1':
    'Solo puedes vincular diarios de los que eres propietario. No puedes vincular un diario en el que solo puedes escribir.',
  'help.ctx.trip-places.bullet.7':
    'La marca junto a la búsqueda inicia una selección. Usa la barra de la parte inferior de la columna para asignar a la vez una nueva categoría a varias filas, añadirlas a una colección, marcarlas como visitadas o eliminarlas.',
  'help.guide.filter-places.step.5':
    'Si el viaje abarca más de un país o región, el globo filtra la lista por un país o por una región de ese país, cada uno con su recuento. «Borrar filtro» vuelve a «Todos los países».',
  'help.guide.import-places-file.tip.3':
    'Con «Excursiones» activado, que es lo predeterminado, los archivos se importan desde «Excursiones», arriba de la columna, con «Importar GPX o KML», y sus líneas se convierten en excursiones. Los puntos del archivo no se importan ahí, porque las excursiones solo contienen líneas.',
  'help.guide.dawarich-stays.step.3':
    'Revisa el «Nombre», la «Llegada» y la «Salida», elige un «Día» o déjalo en «Aún sin día asignado», añade «Notas» si quieres y haz clic en «Añadir lugar».',
  'help.guide.leave-stop-off-route.result':
    'La parada sigue formando parte del día y del PDF; mientras esté marcada como «Fuera de ruta», la ruta va directamente de la parada anterior a la siguiente.',
  'help.guide.move-booking-day.tip.2':
    'Dentro de su propio día, una reserva con hora siempre vuelve a la posición que le corresponde por su hora.',
  'help.guide.place-image-from-file.step.3':
    'En «Desde los archivos adjuntos», haz clic en la foto que quieras. «Subir desde el dispositivo», encima, te permite elegir en su lugar una nueva de tu ordenador.',
  'help.guide.place-own-hours.step.1':
    'Abre el lugar y haz clic en Editar, abajo a la derecha de la tarjeta. Se abre el formulario del lugar.',
  'help.guide.place-own-hours.tip.3':
    'Haz clic en «Quitar horario» y luego en Actualizar para volver a mostrar en la tarjeta el horario encontrado automáticamente.',
  'help.guide.confirm-stay-booking.title': 'Confirmar la reserva de una estancia',
  'help.guide.confirm-stay-booking.tip.2':
    'La misma píldora funciona en todas las reservas, también en las de «Reservas» del día.',
  'help.guide.map-lock.tip.2':
    'Este navegador recuerda el bloqueo para todos los viajes. Al abrir un viaje, el mapa se ajusta igualmente una vez al viaje, para que nunca se abra sobre una zona vacía.',
  'help.guide.tour-map-lines.step.2':
    'Haz clic en la línea o en el marcador de su inicio. La tarjeta de la excursión se abre en la parte inferior del mapa, y su línea se dibuja más gruesa y con borde blanco para que la distingas entre las demás. La X de la cabecera de la tarjeta la cierra.',
  'help.guide.car-stops.title': 'Planificar un trayecto en coche con paradas por el camino',
  'help.guide.car-stops.result':
    'El trayecto es una tarjeta en la pestaña «Transportes» y una fila en su día, y su línea en el mapa va desde la recogida, pasando por todas las paradas en orden, hasta la devolución.',
  'help.guide.transport-details.step.5':
    '«En el mapa», al pie de los detalles, muestra la línea del trayecto y abre «Planificado» en su día. Editar, en el extremo derecho, abre el formulario completo, y la papelera de al lado elimina el trayecto tras confirmarlo.',
  'help.guide.export-transports-csv.step.1':
    'Si solo quieres una parte, filtra antes la lista. La búsqueda, «Filtrar» y el orden de «Opciones de vista» se tienen en cuenta: el archivo contiene lo que muestra la pestaña, en el mismo orden.',
  'help.guide.group-sort-bookings.tip.1':
    '«Tarjetas» y «Lista» tienen cada una su propia agrupación: «Tarjetas» empieza por «Estado» y «Lista», por «Día». Un punto en «Opciones de vista» indica que algo difiere de lo predeterminado, y «Restablecer vista», al pie del panel, vuelve a lo predeterminado.',
  'help.guide.booking-on-map.step.2': 'Haz clic en «En el mapa», al pie de los detalles.',
  'help.guide.export-bookings-csv.goal':
    'Exporta las reservas del viaje a un archivo CSV para abrirlo en Excel, Numbers o cualquier otra hoja de cálculo.',
  'help.guide.arrange-packing-list.goal':
    'Coloca listas enteras y artículos sueltos donde quieras, o consulta cada lista por orden alfabético.',
  'help.guide.check-off-packing.tip.4':
    'En un artículo con una cantidad mayor que uno, también puedes marcar las unidades como guardadas una a una. Consulta «Guardar varias unidades de un mismo artículo».',
  'help.guide.count-packed-pieces.tip.1':
    'Al marcar la casilla se guardan todas las unidades a la vez, y al desmarcarla se vuelven a sacar todas.',
  'help.guide.expense-receipts.goal':
    'Guarda el recibo o la factura junto al gasto correspondiente y vuelve a abrirlo desde el registro.',
  'help.guide.expense-receipts.tip.2':
    'La papelera junto a un recibo lo quita del gasto al guardar. El archivo sigue en «Archivos»; elimínalo ahí para borrarlo por completo.',
  'help.guide.files-sync.tip.4':
    'Si la tarjeta muestra un aviso amarillo con «Volver a conectar», el almacenamiento ya no acepta el inicio de sesión guardado. Haz clic en «Volver a conectar», introduce una nueva contraseña de aplicación o un nuevo token, y la sincronización vuelve a empezar.',
  'help.guide.files-sync-settings.result':
    'A partir de la próxima ejecución, el viaje solo se sincroniza en el sentido que elegiste, y las eliminaciones y las ediciones en conflicto se gestionan según las reglas que definiste.',
  'help.guide.manage-notes.result':
    'La nota desaparece de la tarjeta «Notas» para todos los miembros a la vez. Una nota que solo has fijado o cambiado se mantiene, y los demás la ven como la dejaste.',
  'help.guide.note-categories.step.4':
    'Los puntos de color de cada fila definen el color de esa categoría: índigo, rojo, ámbar, esmeralda, azul o violeta. Aquí «Alojamiento» se pone en ámbar.',
  'help.guide.roadtrip-reorder.step.3':
    'Con el teclado, pon el foco en una parada y pulsa Alt con la flecha arriba o abajo para moverla una posición dentro de su día.',
  'help.guide.roadtrip-overnight.title': 'Pasar una noche en ruta',
  'help.guide.roadtrip-overnight.tip.1':
    'La noche dura hasta el día siguiente. Para otras fechas, cambia la reserva: modifica las fechas en «Días», junto con el resto de la estancia.',
  'help.guide.roadtrip-stop-fill.tip.1':
    'Solo muestran la insignia las paradas donde tu coche puede repostar: gasolineras para «Gasolina», puntos de carga para «Eléctrico» y ambos para «Ambos».',
  'help.guide.roadtrip-bookings.result':
    'Cada trayecto reservado aparece en la ruta en el punto en que se produce, y la ruta de antes y de después va hasta sus terminales y sale de ellas.',
  'help.guide.roadtrip-google-import.step.1':
    'Haz clic en los tres puntos de la parte superior de «En la ruta» y elige «Importar ruta de Google Maps».',
  'help.guide.roadtrip-hazards.title': 'Mostrar los avisos actuales en el mapa',
  'help.guide.roadtrip-hazards.tip.3':
    'Los datos se actualizan cada diez minutos y necesitan conexión. Como los demás ajustes de conducción, el interruptor se guarda para el viaje.',
  'help.ctx.trip-tours.bullet.6':
    'Los cambios de ruta y la eliminación de excursiones se hacen en la pestaña «Excursiones», en «Excursiones de este viaje».',
  'help.guide.tour-show-list.tip.1':
    'Haz clic en la línea de una excursión en el mapa, y la lista marca esa excursión y se desplaza hasta ella.',
  'help.guide.tour-add-to-day.step.3':
    'Aparece la confirmación «Añadido al día 10», la fila recibe una insignia de día, y el día de la columna izquierda muestra la excursión con su duración, distancia y desnivel positivo.',
  'help.guide.tour-day-times.title': 'Poner una hora de inicio a una excursión en su día',
  'help.guide.tour-day-times.tip.3':
    '«Quitar de la ruta», en el mismo menú, mantiene la excursión en el día pero la excluye de la ruta del día en el mapa. «Volver a añadir a la ruta» lo deshace.',
  'help.guide.tour-remove-from-day.tip.1':
    'Una excursión de varios días se quita de los días de uno en uno, porque cada día tiene su propia etapa.',
  'help.guide.tour-filter-list.step.4':
    'Cierra el menú. El botón muestra ahora el estado, el número de excursiones que quedan y +1 por cada filtro adicional.',
  'help.guide.tour-hide-on-map.step.2':
    'La línea de la excursión se oculta en el mapa. Su fila sigue en la lista, atenuada, con un ojo tachado («Mostrar en el mapa»). Haz clic en él para volver a mostrar la línea.',
  'help.guide.tour-import-plan-tab.step.2':
    'Haz clic en «Importar GPX o KML», arriba de la lista, y elige tus archivos (GPX, KML o KMZ).',
  'help.ctx.trip-tour-detail.bullet.2':
    'La cabecera muestra la casilla redonda de la excursión, su nombre con un lápiz para cambiarlo, un punto con el color de su línea, y píldoras con el tipo, el origen, la duración prevista, la distancia, el desnivel positivo y el negativo. La X de la derecha cierra la tarjeta, igual que Escape.',
  'help.guide.tour-detail-read.step.3':
    'Pasa el cursor por el tiempo para ver cómo se compone: el tiempo en movimiento, las pausas y el total previsto.',
  'help.guide.tour-detail-read.tip.4':
    'La tarjeta no cambia la ruta. Para mover un punto o volver a dibujar un tramo, abre la pestaña «Excursiones» y haz clic en la excursión en «Excursiones de este viaje».',
  'help.guide.tour-rename-colour.step.4':
    'Elige un color. «Color automático», la primera casilla, devuelve la línea a su color predeterminado, y «Elegir color personalizado», la última, te deja elegir cualquier color. La línea del mapa y la franja de la lista de excursiones cambian al momento.',
  'help.guide.tour-take-along.step.3':
    'Haz clic en GPX para descargar la excursión guardada como archivo GPX: toda la ruta con las altitudes que tenga, lista para una aplicación de navegación o un GPS.',
  'help.guide.tour-copy-keep.step.1':
    'Abre la tarjeta de la excursión y haz clic en Copiar, abajo. TREK crea una excursión nueva e independiente sin sus días, y la original no cambia.',
  'help.guide.tour-copy-keep.result':
    'El viaje tiene una segunda excursión que puedes cambiar libremente, y la colección guarda su propia copia, lista para añadirla a otro viaje.',
  'help.guide.tour-packing-link.tip.1':
    'Es solo un vínculo. No se copia ni se mueve nada, y los artículos siguen en «Listas». Si marcas uno ahí, la excursión lo muestra al momento.',
  'help.guide.tour-files.step.3': 'Haz clic en un archivo para abrirlo.',
  'help.guide.tour-activity-link.step.3':
    'Elige la grabación en «Track» o haz clic en «Importar GPX» para importar un archivo nuevo.',
  'help.guide.tour-activity-compare.goal':
    'Consulta dónde se aparta el track real del plan, y cámbialo o desvincúlalo.',
  'help.guide.tour-origin-check.title': 'Ver el origen de una excursión',
  'help.guide.tour-origin-check.result':
    'Sabes de dónde procede la excursión, cuándo llegó y si ha cambiado desde entonces.',
  'help.ctx.trip-tour-planner.bullet.6':
    'Los borradores sin guardar se conservan: abre de nuevo la pestaña «Excursiones» y se recupera, con el aviso «Borrador sin guardar restaurado». «Volver a excursiones» y Descartar preguntan antes de descartar cambios.',
  'help.guide.tour-open-workspace.step.6':
    'La píldora de abajo a la izquierda cambia el mapa, al principio entre «Mapa» y «Satélite». Con una excursión abierta, ofrece los mapas de su tipo, como Topo o «Senderismo», e interruptores como «Colocar puntos» y 3D.',
  'help.guide.tour-draw-route.step.1':
    'Haz clic en «Planificar nueva excursión», arriba del carril izquierdo. El carril pasa a «Nueva excursión», una caminata salvo que elijas otro tipo.',
  'help.guide.tour-draw-route.tip.3':
    'Si un borrador tiene cambios sin guardar, «Planificar nueva excursión» en el menú «Añadir ruta» pregunta antes: «¿Empezar una nueva excursión?», con «Descartar y empezar».',
  'help.guide.tour-type-profile.step.4':
    'La ruta se vuelve a planificar para el perfil, y «Resumen de la excursión», a la derecha, muestra su distancia y su duración.',
  'help.guide.tour-edit-points.step.3':
    'Para cambiar el orden, pasa el cursor por una fila y arrástrala por el asa que aparece en su borde izquierdo.',
  'help.guide.tour-shaping-points.goal': 'Lleva la ruta por otro camino sin añadir una parada.',
  'help.guide.tour-shaping-points.result':
    'La ruta pasa por donde la arrastraste, y las paradas mantienen su numeración.',
  'help.guide.tour-loop-reverse.tip.3':
    'En una caminata, «Ruta circular desde el inicio», al lado, busca rutas circulares de la longitud que elijas.',
  'help.guide.tour-leg-by-hand.tip.1':
    'Ningún calculador ha comprobado un tramo dibujado a mano: puede cruzar agua, terrenos privados o un precipicio.',
  'help.guide.tour-trip-places.step.4':
    'Su fila indica «Lugar del viaje» bajo el nombre. «Desvincular del lugar», en «Más acciones», conserva el punto pero quita el vínculo.',
  'help.guide.tour-details-times.step.2': 'En «Detalles», escribe una «Descripción» y añade un «Sitio web» si lo hay.',
  'help.guide.tour-save.goal': 'Guarda en el viaje la excursión que has dibujado.',
  'help.guide.tour-save.result': 'La excursión está guardada en el viaje, lista para ponerla en un día.',
  'help.guide.tour-edit-saved.tip.2':
    'Un track GPX o KML importado se abre como «Excursión GPX», para consultarlo. «Planificar una versión editable» crea a partir de él una excursión que puedes modificar.',
  'help.guide.tour-summary-profile.step.4':
    '«Contraer perfil de altitud», la flecha junto a su título, oculta el perfil; vuelve a hacer clic para mostrarlo.',
  'help.guide.tour-list-manage.step.2':
    'Pasa el cursor por una excursión y haz clic en el más redondo de su fila, «Añadir al día», para ver los días del viaje.',
  'help.guide.tour-delete.title': 'Eliminar una excursión',
  'help.guide.tour-saved-elsewhere.title': 'Si la excursión se ha guardado desde otro sitio',
  'help.guide.tour-saved-elsewhere.result': 'No se pierde ningún cambio salvo que alguien decida descartarlo.',
  'help.guide.tour-import-gpx.title': 'Importar un archivo GPX, KML o KMZ como excursión',
  'help.guide.tour-import-gpx.tip.2':
    'Cada track o ruta de un archivo se convierte en una excursión independiente. Los tracks nunca se unen.',
  'help.guide.tour-view-import.step.2':
    'La columna izquierda la muestra como «Excursión GPX»: el «Resumen de la excursión» con su distancia, altitudes y tiempo grabado, y el perfil de altitud debajo. El mapa muestra su línea.',
  'help.guide.tour-plan-from-import.step.1':
    'Abre la excursión importada en la pestaña «Excursiones». En la tarjeta «Versión editable» de la izquierda, haz clic en «Planificar una versión editable».',
  'help.guide.tour-plan-from-import.result':
    'La excursión tiene ahora puntos de ruta que puedes arrastrar, y su «Origen» indica «Replanificado, traza grabada conservada».',
  'help.guide.tour-restore-recorded.result':
    'La excursión vuelve a ser una «Excursión GPX» y muestra la línea con la que se grabó.',
  'help.guide.tour-take-over.step.6': 'Haz clic en «Traer».',
  'help.guide.tour-import-wanderer.step.2':
    'Escribe en «Buscar senderos». «Buscar en esta zona del mapa» muestra solo las rutas que están en la parte visible del mapa.',
  'help.ctx.trip-tour-map.title': 'Mapa de la excursión',
  'help.guide.tour-map-layers.goal':
    'Planifica en el mapa que mejor se adapte al tipo de excursión: curvas de nivel para las subidas, senderos señalizados o rutas ciclistas, o imágenes aéreas.',
  'help.guide.tour-along-search.title': 'Buscar lugares a lo largo de una excursión',
  'help.guide.tour-along-search.tip.1':
    'Si cambias la ruta, los tipos o la distancia, «Buscar de nuevo» se resalta e indica que la lista corresponde a la ruta anterior. Haz clic en él para actualizar la lista.',
  'help.guide.tour-along-add-stop.step.4':
    'La ruta se vuelve a planificar pasando por el lugar, y «A lo largo de la ruta» indica cuánta distancia y cuánto tiempo ha sumado la excursión. «Deshacer», en esa misma línea, vuelve a quitar la parada.',
  'help.guide.tour-3d-terrain.step.2':
    'La ruta se colorea según su pendiente. Haz clic en «Pendiente», en la fila de abajo, para mostrarla con el color de la excursión, y vuelve a hacer clic para ver otra vez las pendientes.',
  'help.guide.tour-3d-flyover.title': 'Sobrevolar una excursión',
  'help.guide.tour-3d-flyover.tip.2':
    'El sobrevuelo solo empieza cuando se ha cargado el relieve de toda la ruta, para que no se detenga a mitad de camino a cargar datos del mapa. Pasa el cursor por el anillo para ver cuánto se ha cargado.',
  'help.guide.tour-map-overlays.result':
    'Las pistas o las señales náuticas aparecen sobre el mapa, y la leyenda las explica.',
  'help.ctx.trip-tour-stages.bullet.3':
    '«Resumen de la excursión» muestra cada etapa en «Etapas», desde la parada en la que empieza hasta la parada en la que termina. Un clic en una etapa selecciona su última parada y marca ese punto en el perfil de altitud.',
  'help.guide.tour-multi-day.step.4':
    '«Puntos de ruta» se divide ahora en «Etapa 1» y «Etapa 2», cada una con su distancia y su tiempo. La parada que termina una etapa muestra un icono de luna.',
  'help.guide.tour-stages-on-days.title': 'Poner una excursión de varios días en los días del viaje',
  'help.guide.tour-stages-on-days.tip.1':
    'Si el viaje termina antes de la última etapa, la opción indica cuál es la última etapa que cabe. Las siguientes se quedan sin día.',
  'help.ctx.trip-tour-hike.bullet.2':
    '«Puntos de ruta» muestra las paradas por orden. «Añadir punto» está activado desde el principio, así que cada clic en el mapa coloca el siguiente; «Lugares del viaje», al lado, convierte en parada un refugio o un hotel del viaje.',
  'help.guide.tour-hike-plan.step.2':
    'Abre «Tipo de ruta» y elige «Senderismo»: a pie, dentro de la dificultad que elijas.',
  'help.guide.tour-hike-plan.tip.3':
    '«Elección de ruta», bajo la dificultad, define tus preferencias para la ruta: «Evitar subidas pronunciadas», «Evitar escaleras» y «Evitar ferris». Si no hay otra opción, la ruta pasa igualmente por ahí.',
  'help.guide.tour-hike-trail-details.step.5':
    'Haz clic en «Firme» para ver la misma ruta según el tipo de suelo, del asfalto a la tierra y la roca.',
  'help.guide.tour-hike-round.step.2':
    'La tarjeta «Ruta circular» se abre sobre el mapa. Comprueba el inicio en «De» y escribe la «Distancia» que quieres. La píldora de al lado muestra el rango de longitudes posibles para una ruta circular.',
  'help.guide.tour-hike-compare-ways.title': 'Comparar otros caminos para un tramo de una caminata',
  'help.guide.tour-hike-compare-ways.tip.2':
    'Si el calculador no conoce otro camino, la tarjeta te lo indica. Si no puede seguir el camino que elegiste, el tramo no cambia y la tarjeta te avisa.',
  'help.guide.tour-ferrata-add.step.5':
    '«Resumen de la excursión», a la derecha, muestra la insignia «Vía ferrata» con su grado, y la cabecera del editor avisa: «La ruta pasa por una vía ferrata».',
  'help.guide.tour-run-plan.step.1':
    'Haz clic en «Planificar nueva excursión», abre «Tipo de ruta» y elige «Carrera a pie».',
  'help.guide.tour-run-plan.tip.3': 'Si usas millas, el ritmo también se indica por milla.',
  'help.guide.tour-run-ways.tip.1': 'Nada de esto cambia la ruta de la carrera ni su duración.',
  'help.ctx.trip-tour-walk.bullet.5':
    '«Añadir ruta», en «Excursiones de este viaje», importa una ruta a pie compartida desde Google Maps. En la pestaña «Planificado», un paseo abierto desde su día te permite marcar sus paradas para ese día.',
  'help.guide.tour-walk-plan.step.6':
    '«Resumen de la excursión», a la derecha, muestra «Tiempo est.», «Estancias» y «Planeado», que suma los dos. Haz clic en Guardar, al pie de la columna izquierda, para guardar el paseo.',
  'help.guide.tour-walk-sights.step.2':
    'El tema rellena «Qué buscar». Ábrelo para marcar o desmarcar tipos, y elige hasta qué distancia buscar en «A esta distancia de la ruta».',
  'help.guide.tour-walk-day-times.title': 'Ver las horas de llegada y los horarios del día',
  'help.guide.tour-walk-day-times.tip.3':
    'Los horarios proceden de OpenStreetMap o del lugar del viaje asociado a la parada, y la píldora de al lado indica de cuál. Compruébalos antes de ir.',
  'help.guide.tour-walk-google-import.step.4':
    'Haz clic en «Cargar como paseo». TREK calcula por su cuenta el camino a pie entre las paradas. Haz clic en Guardar para guardar el paseo.',
  'help.guide.tour-walk-check-off.step.2':
    'Baja hasta «Paradas del paseo». Cada parada muestra cuánto tiempo te quedas y, si el paseo tiene hora de inicio, a qué hora llegas.',
  'help.ctx.trip-tour-bike.summary':
    'Una ruta en bici abierta en el editor de la pestaña «Excursiones»: el perfil para el que se calcula, su tiempo de pedaleo, por qué tipo de firme va y, en una ruta de bici de montaña, la dificultad de sus senderos.',
  'help.guide.tour-bike-profile.step.2': 'Abre el campo «Tipo de ruta» y elige «Ruta en bicicleta».',
  'help.guide.tour-bike-profile.tip.3':
    'Si ningún camino para bicis llega cerca de un punto, el carril indica «No way for bikes reaches point N». Mueve el punto, o abre «Más acciones» en el punto anterior y elige «Dibujar a mano el siguiente tramo».',
  'help.guide.tour-bike-surfaces.step.4':
    'En «Tipo de vía», haz clic en una fila, como «Camino agrícola o forestal» o «Carretera con tráfico», para ver por dónde va la ruta por ese tipo de vía.',
  'help.guide.tour-bike-mtb-grades.step.1':
    'Abre la ruta en bici en el editor y comprueba que «Perfil» está en MTB. La dificultad de los senderos solo se lee con ese perfil.',
  'help.ctx.trip-tour-ski.title': 'Excursiones de esquí e invierno',
  'help.guide.tour-ski-plan.goal':
    'Planifica un día de pistas, un circuito de fondo, una travesía con esquís o una ruta con raquetas por las pistas, remontes y senderos cartografiados.',
  'help.guide.tour-ski-plan.tip.2':
    'El punto de información junto a «Disciplina» explica qué hace TREK con las excursiones de esquí. Nada de lo que dice, ni nada de esta pantalla, informa sobre la nieve, los aludes o si las pistas, remontes y senderos están abiertos.',
  'help.guide.tour-ski-options.step.3':
    'En «Preferir», elige «La más rápida», «Más esquí» o «Más fácil». En «Ritmo», elige «Tranquilo», «Normal» o «Deportivo»: cambia el tiempo que el calculador asigna a cada pista.',
  'help.guide.tour-ski-fix-leg.goal': 'Planifica con un clic un tramo en rojo, o dibújalo recto.',
  'help.guide.tour-ski-fix-leg.result':
    'Ya no hay ningún tramo en rojo: cada uno sigue las pistas o va en línea recta entre sus puntos.',
  'help.guide.tour-ski-summary.tip.3':
    'Una excursión guardada se abre tal como se guardó. Mueve un punto o cambia una opción para volver a planificarla con los datos de pistas actuales.',
  'help.guide.tour-ski-pistes-layer.tip.1':
    'Si el interruptor sigue en gris e indica «Acerca el mapa para ver las pistas», acerca el zoom a la estación de esquí.',
  'help.guide.tour-ski-import.step.3':
    'Elige la «Disciplina» y, para «Esquí de fondo», la «Técnica». Hasta que lo hagas, el cuadro indica «Choose a discipline to import the track as ski».',
  'help.ctx.trip-tour-paddle.title': 'Excursiones de remo',
  'help.guide.tour-paddle-setup.title': 'Planificar una excursión de remo',
  'help.guide.tour-paddle-setup.step.7':
    'Comprueba que «Añadir punto» está activado y haz clic en el mapa: primero en el punto de embarque, luego en los puntos intermedios y por último en el de desembarque.',
  'help.guide.tour-paddle-water-route.step.1':
    'Un tramo dibujado a mano muestra «Dibujado a mano, sin calcular» bajo su punto, con su longitud. TREK mantiene la línea tal como la dibujaste.',
  'help.guide.tour-paddle-water-route.tip.4':
    'No puedes guardar mientras haya un tramo sin planificar. Primero planifícalo por el agua o dibújalo a mano.',
  'help.guide.tour-paddle-portage.step.5':
    'En «Desembarcar y embarcar», escribe los minutos que necesitas para salir, descargar y volver al agua. Si lo dejas vacío, TREK cuenta 10 minutos.',
  'help.guide.tour-paddle-lock.step.2':
    'Elige «Esclusa en este punto». Bajo el punto aparece una tarjeta de esclusa marcada con «Falta el tiempo».',
  'help.guide.tour-paddle-time.goal':
    'Mira cómo se suman el tiempo en el agua, el porteo, las esclusas y las pausas, y define tus propios valores.',
  'help.guide.tour-paddle-time.tip.3':
    'Las pausas y un total previsto propio se definen en «Detalles». Con un total previsto, la tarjeta muestra «Tu duración total planificada» junto a la estimación.',
  'help.guide.tour-paddle-wind.tip.1':
    'Solo hay previsión para los próximos 16 días. Para un día posterior, indica a partir de qué fecha estará disponible. Para un día pasado, indica que ya ha pasado.',
  'help.guide.tour-paddle-checklist.step.2':
    'La línea de debajo indica lo actualizados que están los datos: «Fecha OSM» para OpenStreetMap, «Consultados» para cuándo los leyó TREK, y «Datos de obstáculos» donde no cubren toda la ruta.',
  'help.guide.tour-paddle-checklist.tip.5':
    'Una lista de comprobación no es una autorización de seguridad ni legal. Tu decisión no anula una prohibición ni un terreno privado registrados en OpenStreetMap.',
  'help.guide.tour-paddle-track-marks.step.5':
    'Haz clic en «Porteo» y luego en la línea, en el punto donde saliste del agua y donde volviste a entrar.',
  'help.ctx.trip-tour-horse.summary':
    'Una ruta a caballo nunca se calcula automáticamente. Se construye con tramos de los itinerarios ecuestres señalizados que conoce OpenStreetMap, unidos por tramos que dibujas a mano, o se conserva exactamente tal como la grabaste.',
  'help.guide.tour-horse-plan.step.1':
    'Encuadra en el mapa la zona por la que quieres cabalgar y haz clic en «Planificar nueva excursión», arriba de la columna izquierda.',
  'help.guide.tour-horse-plan.tip.1':
    'Que exista un itinerario ecuestre no te da permiso para recorrerlo. «Acceso a caballo» solo muestra lo que indican las etiquetas de OpenStreetMap. Respeta siempre la señalización del lugar.',
  'help.guide.tour-horse-gap.step.2':
    'Activa «Unir con un tramo manual». El hueco se dibuja en línea recta y sin comprobar.',
  'help.guide.tour-horse-recorded.goal':
    'Importa una ruta que grabaste con un GPS o una aplicación y consérvala exactamente tal como la hiciste.',
  'help.guide.tour-horse-recorded.tip.3':
    'También puedes soltar el archivo en cualquier parte de la pestaña «Excursiones» para abrir la misma vista previa.',
  'help.guide.create-trip.tip.3':
    'En «Compañeros de viaje» puedes añadir a personas que ya tienen cuenta aquí. Pasan a ser miembros del viaje en cuanto se crea.',
  'help.guide.trip-reminder.step.1':
    'Haz clic en el lápiz de la tarjeta del viaje. Si es un viaje nuevo, el formulario «Nuevo viaje» tiene la misma sección.',
  'help.guide.company-holidays.tip.2':
    'Un festivo de empresa de día completo elimina las vacaciones ya registradas ese día, para que nadie gaste días de vacaciones en él.',
  'help.guide.half-company-holiday.tip.2':
    'Vuelve a hacer clic en el día con los mismos ajustes para quitarlo, o con «Medio día» desactivado para convertirlo en un festivo de empresa de día completo.',
  'help.guide.edit-holiday-calendar.step.1':
    'Abre «Ajustes» y busca el calendario en «Festivos» o «Vacaciones escolares».',
  'help.guide.person-color.goal': 'Asígnate a ti o a alguien con quien planificas un color más fácil de distinguir.',
  'help.guide.answer-fusion-request.tip.2':
    'Cualquiera de los dos puede deshacer la fusión más adelante, y vuestras entradas se conservan.',
  'help.guide.log-for-partner.tip.2':
    'La otra persona ve el cambio al momento, y su fila en «Derecho» se actualiza enseguida.',
  'help.guide.country-places.title': 'Ver todos los lugares de un país',
  'help.guide.tour-activity-stats.step.1':
    'En el panel inferior del mapa, abre la pestaña «Excursiones», junto a «Estadísticas» y «Lista de deseos».',
  'help.guide.tour-activity-stats.tip.2':
    'Vincula el track que hiciste realmente con «Añadir track real» en el detalle de la excursión, y sus valores grabados sustituyen aquí a los previstos. Una excursión planificada en varios días cuenta una sola vez.',
  'help.ctx.collections.bullet.7':
    'Excursiones guardadas: las excursiones que guardaste desde un viaje son las primeras filas de una lista, con su dificultad, su tipo, el viaje del que proceden y sus medidas. «Añadir a un viaje» crea una excursión nueva a partir de una, y el icono de la papelera la quita de la lista.',
  'help.guide.move-to-list.title': 'Mover o duplicar lugares en otra lista',
  'help.guide.copy-to-trip.tip.2': 'Los lugares que el viaje ya tiene se omiten, y TREK indica cuántos se han omitido.',
  'help.guide.accept-list-invite.tip.2':
    'Haz clic en «Compartida», arriba de la lista, para ver sus miembros. Desde ahí, «Salir de la lista» te permite volver a salir.',
  'help.guide.tour-collection-add-to-trip.goal':
    'Crea una excursión nueva en uno de tus viajes a partir de una excursión guardada en una lista, con o sin sus puntos de ruta.',
  'help.guide.tour-collection-add-to-trip.result':
    'El cuadro confirma que la excursión ya pertenece a ese viaje. «Abrir viaje» te lleva allí. Cerrar te deja en «Colecciones».',
  'help.guide.tour-collection-manage.tip.3':
    'Las excursiones guardadas solo aparecen en su propia lista, no en «Todos los guardados».',
  'help.guide.search-journey.step.3':
    'Haz clic en un día para desplazarte hasta él, o en su flecha para ver las entradas de ese día y elegir una.',
  'help.guide.journey-map-layers.goal': 'Compara el plan con lo que pasó realmente, y activa o desactiva capas.',
  'help.guide.journey-keep-route.goal':
    'Añade al mapa de la travesía la ruta real de un día desde Dawarich y mantenla ahí.',
  'help.guide.journey-day-stays.goal': 'Convierte en entradas, una a una, las estancias que registró Dawarich.',
  'help.guide.journey-take-over-day.goal':
    'Convierte las estancias de un día en borradores de entradas, o en una crónica del día, de una sola vez.',
  'help.guide.journey-auto-prepare.title': 'Dejar que TREK prepare tus días grabados',
  'help.guide.photo-location.title': 'Ubicar las entradas donde se hicieron sus fotos',
  'help.ctx.settings-about.summary':
    'Qué es TREK, qué versión ejecuta este servidor y dónde encontrar el proyecto: la documentación, dónde informar de un error y las formas de apoyar el proyecto.',
  'help.guide.startup.tip.2':
    'Si la pestaña de inicio pertenece a un complemento que has desactivado, se abre el plan en su lugar.',
  'help.guide.web-push-device.title': 'Recibir notificaciones push en este dispositivo',
  'help.guide.connect-airtrail.tip.1':
    'La tarjeta solo aparece si el administrador tiene activado el complemento AirTrail.',
  'help.guide.connect-dawarich.tip.1':
    'TREK solo sugiere entradas, lugares y países; no se añade nada hasta que lo confirmas, y nada se escribe en Dawarich.',
  'help.guide.tour-connect-wanderer.tip.1':
    'La tarjeta solo aparece si el administrador permite wanderer en «Excursiones».',
  'help.guide.tour-wanderer-watch.tip.1':
    'Un aviso nunca cambia una excursión; la comprobación de fuente de la excursión muestra qué ha cambiado realmente.',
  'help.guide.api-keys.tip.3':
    'Envía la clave como Authorization: Bearer o X-API-Key a /api/v1. Cada cuenta puede tener hasta 10 claves.',
  'help.guide.plugin-settings.step.2':
    '«Actividad de plugins» muestra todas las acciones que los plugins han hecho en tu nombre, de la más reciente a la más antigua; Actualizar carga las últimas.',
  'help.ctx.admin-github.bullet.3':
    '«Acerca de»: Ko-fi, Buy Me a Coffee, Discord, «Reportar un error», «Solicitar función» y la wiki.',
  'help.guide.default-user-settings.goal':
    'Da a todas las cuentas unas unidades, un modo de color y una moneda razonables sin que nadie tenga que abrir «Ajustes».',
  'help.guide.default-map.step.3':
    'Cada campo se guarda al salir de él. El enlace «restaurar» junto al nombre de un campo recupera el valor predeterminado de TREK.',
  'help.guide.own-routing-engine.tip.2':
    'Si solo configuras tu propio motor de rutas, tampoco se usa el Valhalla público. El enlace «restaurar» junto a un campo lo vuelve a vaciar.',
  'help.guide.admin-passkeys.step.1':
    'En la pestaña «Ajustes», en «Inicio de sesión con passkey», activa «Activar inicio de sesión con passkey».',
  'help.guide.storage-backends.step.4':
    '«Salud», arriba, muestra las escrituras fallidas en un destino espejo. Si indica «No se registraron fallos de réplica.», todo funciona.',
  'help.guide.channels-instance.tip.3':
    'Web Push necesita HTTPS. En iPhone y iPad, primero hay que añadir TREK a la pantalla de inicio.',
  'help.guide.notification-defaults.step.1':
    'En la pestaña «Notificaciones», baja hasta «Valores predeterminados para usuarios», al final. Cada fila es un evento y cada columna, un canal.',
  'help.ctx.notifications.bullet.1':
    'La campana de arriba a la derecha indica cuántas notificaciones no has leído. Haz clic en ella para ver las diez más recientes, y en «Ver todas las notificaciones», abajo, para abrir esta página.',
  'help.guide.read-notifications.step.2':
    'El panel muestra las diez más recientes. Cada una indica quién hizo qué y dónde, y las no leídas tienen el fondo resaltado.',
  'help.guide.filter-notifications.step.2': 'Abajo del panel, haz clic en «Ver todas las notificaciones».',
  'help.guide.mark-notifications-read.tip.1': 'Abrir una notificación con su botón también la marca como leída.',
  'help.guide.delete-notifications.tip.2':
    'Una notificación eliminada no se puede recuperar. Para ocultar una notificación sin borrarla, márcala como leída y usa «No leídas».',
  'help.guide.notification-settings.tip.2': 'No hay ajustes por viaje: cada interruptor se aplica a todos tus viajes.',
  'help.guide.link-journal.title': 'Vincular un diario al viaje',
  'help.guide.link-journal.tip.2':
    'A partir de entonces, las personas a las que das acceso también ven el diario en su propia lista de travesías.',
  'help.ctx.trip-places.bullet.8':
    'Con Dawarich conectado, «Desde Dawarich», arriba de la lista, muestra las estancias que registró Dawarich durante el viaje. «Añadir como lugar» convierte una estancia en un lugar. «No es un lugar que visitara» la quita de la lista.',
  'help.guide.dawarich-stays.step.4':
    'Si una estancia no fue una visita real, haz clic en «No es un lugar que visitara», la x de al lado, para quitarla. «Mostrar … ya tratadas», al final de la lista, muestra las estancias que añadiste o quitaste. «Devolver» vuelve a poner en la lista una estancia quitada.',
  'help.guide.leave-stop-off-route.tip.1':
    'Solo las paradas con coordenadas tienen esta opción, y el ajuste solo se aplica a este día: el mismo lugar en otro día sigue en la ruta.',
  'help.guide.move-booking-day.title': 'Mover una reserva a otro día',
  'help.guide.place-image-from-file.step.4':
    'La foto es ahora la imagen del lugar. Haz clic en la pequeña X roja de su esquina para quitarla.',
  'help.guide.place-own-hours.step.2': 'Debajo de «Sitio web», rellena «Teléfono» y «Correo electrónico» si los sabes.',
  'help.guide.add-accommodation.tip.4':
    'Una forma más rápida: el + de la cabecera del día, con la descripción «Añadir al día», tiene «Añadir alojamiento». Abre el día con este formulario ya abierto.',
  'help.guide.confirm-stay-booking.goal':
    'Marca como confirmada la reserva de hotel de una estancia, directamente desde el día.',
  'help.guide.map-whole-trip.tip.4':
    'Si se muestra o no el viaje completo se guarda para cada viaje en tu cuenta, así que el viaje se abre igual en otro navegador.',
  'help.guide.tour-map-lines.step.3':
    'Abre en la columna de días un día en el que esté la excursión, y la excursión pasa a formar parte de la ruta del día: la ruta llega hasta donde empieza la excursión y continúa desde donde termina.',
  'help.guide.car-stops.goal':
    'Indica la recogida, la devolución y las paradas intermedias de un coche de alquiler o del tuyo.',
  'help.guide.car-stops.tip.1':
    'No hay un tipo aparte para alquiler: tanto un coche de alquiler como el tuyo son «Coche».',
  'help.guide.transport-details.result':
    '«Planificado» está abierto en el día del trayecto, con su línea en el mapa y el icono de ruta de su fila activado.',
  'help.guide.export-transports-csv.step.2':
    'Haz clic en el icono de hoja de cálculo después de «Opciones de vista», cuya descripción emergente dice «Exportar como hoja de cálculo (CSV)».',
  'help.guide.group-sort-bookings.title': 'Agrupar y ordenar las reservas',
  'help.guide.group-sort-bookings.tip.2':
    'En «Cronología», el mismo botón incluye «Una fila por tipo» y «Mostrar la otra pestaña».',
  'help.guide.booking-on-map.result':
    'El detalle se cierra y la pestaña «Planificado» se abre en el día de la reserva, con su lugar seleccionado en el mapa.',
  'help.guide.export-bookings-csv.step.1':
    'Para exportar solo una parte de la pestaña, fíltrala antes con «Buscar» o «Filtrar». El archivo contiene exactamente lo que muestra la pestaña.',
  'help.guide.import-booking-file.tip.4':
    'Para leer una confirmación hace falta conexión. Sin conexión, Importar te lo indica, y puedes volver a intentarlo cuando TREK vuelva a estar en línea.',
  'help.guide.arrange-packing-list.step.1':
    'Arrastra el asa del extremo izquierdo de la cabecera de una lista, delante de su punto de color, y suelta la lista sobre otra tarjeta. Un borde de tu color de acento marca la tarjeta de destino, y la lista ocupa su lugar para todos los participantes del viaje.',
  'help.guide.count-packed-pieces.title': 'Guardar varias unidades de un mismo artículo',
  'help.guide.count-packed-pieces.tip.2':
    'Con «Seguimiento de equipaje» activado, «Preparados» en la tarjeta «Equipaje» solo cuenta las unidades ya contadas.',
  'help.guide.packing-bags.tip.4':
    'El peso de una bolsa que llevan varias personas se reparte a partes iguales entre ellas en «Por persona». Ese peso aparece subrayado con puntos y muestra una nota al respecto al pasar el cursor.',
  'help.guide.expense-receipts.step.1':
    'Haz clic en el lápiz junto a la fila del gasto. El editor se abre con ese gasto, con «Recibos y facturas» cerca del final.',
  'help.guide.expense-receipts.tip.3':
    'Para adjuntar necesitas conexión y permiso para subir archivos, porque el recibo se guarda como un archivo más del viaje.',
  'help.guide.files-sync-settings.title': 'Elegir el sentido de sincronización de los documentos',
  'help.guide.files-sync-settings.tip.1':
    'Siempre queda un carril activado: hacer clic en el único carril activo no hace nada.',
  'help.guide.manage-notes.title': 'Leer, fijar y editar una nota',
  'help.guide.manage-notes.tip.1':
    '«Expandir» solo aparece en el menú si la nota tiene texto. Un miembro que no puede editar «Colaboración» solo ve «Expandir».',
  'help.guide.note-categories.step.5':
    'Haz clic en Guardar. Todas las notas de una categoría a la que hayas cambiado el nombre o el color cambian a la vez, para todos los miembros. Cancelar descarta tus cambios.',
  'help.guide.trip-chat.tip.5':
    'El chat muestra primero los mensajes más recientes. «Cargar mensajes anteriores», arriba del chat, carga los mensajes más antiguos.',
  'help.guide.roadtrip-reorder.result':
    'Las paradas quedan en el orden que elegiste, y se recalculan la distancia, el tiempo de conducción y las horas de llegada de cada día que hayas cambiado.',
  'help.guide.roadtrip-overnight.goal': 'Busca dónde dormir en ruta y añade la noche al trayecto como reserva.',
  'help.guide.roadtrip-overnight.tip.2':
    'Si vuelves a cambiar una noche reservada a «Parada», desde Editar en su tarjeta, primero se pregunta «¿Quitar la pernoctación?». «Convertir en pausa» elimina la noche, con su reserva y cualquier gasto vinculado, y mantiene la parada en el trayecto.',
  'help.guide.roadtrip-stop-fill.tip.2':
    'Si eliges el valor que ya tiene la parada, la parada vuelve a tu valor predeterminado.',
  'help.guide.roadtrip-bookings.tip.1':
    'La hora en la terminal se adelanta respecto al horario para dar tiempo al registro: una hora para un vuelo o un crucero, media hora para un ferry y diez minutos para un tren o un autobús.',
  'help.guide.roadtrip-google-import.step.2':
    'Pega el enlace de una ruta que compartiste desde Google Maps y haz clic en «Vista previa».',
  'help.guide.roadtrip-hazards.goal':
    'Consulta en el mapa los avisos meteorológicos y las alertas de catástrofes en torno a tu trayecto.',
  'help.ctx.trip-tours.title': 'Excursiones en el plan',
  'help.guide.tour-show-list.title': 'Mostrar las excursiones del viaje en el plan',
  'help.guide.tour-show-list.tip.2':
    '¿Aún no hay excursiones? «Importar GPX o KML», arriba de la lista, importa un archivo, y «Planificar nueva excursión», en la pestaña «Excursiones», crea una nueva.',
  'help.guide.tour-add-to-day.step.4':
    'También puedes arrastrar la fila fuera de la lista y soltarla en un día de la columna izquierda. Si la sueltas entre dos paradas, se coloca ahí.',
  'help.guide.tour-day-times.goal':
    'Comprueba cuándo termina una excursión y si se solapa con lo siguiente de ese día.',
  'help.guide.tour-day-times.tip.4':
    '«Guardar en colección», en el mismo menú, guarda la excursión con su ruta en una colección, igual que el botón «Colección» de la tarjeta.',
  'help.guide.tour-remove-from-day.tip.2':
    'En estos menús y en la tarjeta no hay Eliminar. Las excursiones se eliminan en la pestaña «Excursiones», con la papelera de su fila en «Excursiones de este viaje».',
  'help.guide.tour-filter-list.tip.1':
    '«Límite de ruta» es la dificultad máxima que se permitió al planificar la ruta, no la dificultad medida en el sendero.',
  'help.guide.tour-hide-on-map.step.3':
    'Mientras haya excursiones ocultas, una línea encima de la lista indica «Oculta en el mapa» y cuántas son. «Mostrar todas» vuelve a mostrarlas todas a la vez.',
  'help.guide.tour-import-plan-tab.step.3':
    'La «Vista previa de la importación» muestra cada track antes de guardar nada. En «Importar como», elige el tipo («Senderismo», «Ruta en bicicleta», etc.) y haz clic en «Importar 1 excursión».',
  'help.ctx.trip-tour-detail.bullet.3':
    'Debajo aparecen «Días del viaje», con una casilla por cada día en que está la excursión, las medidas con el perfil de altitud y, según corresponda: las paradas de un paseo urbano, las comprobaciones y el viento de una excursión de remo, «Track real», «Lista de equipaje», «Descripción», «Notas», «Origen» y «Archivos».',
  'help.guide.tour-detail-read.step.4':
    '«Días del viaje» muestra una casilla por cada día en que está la excursión, con su fecha. «Aún no está en ningún día del viaje» significa que aún no está planificada.',
  'help.guide.tour-detail-read.tip.5':
    'En el móvil, la tarjeta se abre como una hoja desde abajo, para consultarla y llevarte la excursión.',
  'help.guide.tour-rename-colour.tip.1':
    'El nombre y el color pertenecen al viaje, así que todos sus participantes los ven. Para ocultar una excursión solo en tu mapa sin cambiarla para nadie más, usa el ojo de la lista de excursiones.',
  'help.guide.tour-take-along.tip.1':
    'En dispositivos que pueden compartir archivos, aparece Compartir junto a GPX, que envía ese mismo archivo directamente a otra aplicación.',
  'help.guide.tour-copy-keep.step.2':
    'La copia se abre al momento, con el nombre del original seguido de (copia). Haz clic en el lápiz para ponerle su propio nombre.',
  'help.guide.tour-packing-link.title': 'Vincular una excursión a la lista de equipaje',
  'help.guide.tour-packing-link.tip.2':
    'Cambiar, en la cabecera de la sección, vincula la excursión a otra lista. «Eliminar vínculo», en ese cuadro, quita el vínculo, y la lista no cambia.',
  'help.guide.tour-files.tip.1':
    'Los archivos también son archivos del viaje, así que aparecen igualmente en la pestaña «Archivos».',
  'help.guide.tour-activity-link.step.4': 'Comprueba lo que ha medido en «Real» y haz clic en Vincular.',
  'help.guide.tour-activity-compare.step.1':
    'Abre la tarjeta de la excursión. «Previsto y real» muestra la «Distancia», el «Desnivel positivo», el «Desnivel negativo» y el «Tiempo con pausas» del plan junto a los del track, con la «Diferencia».',
  'help.guide.tour-origin-check.goal':
    'Averigua si una excursión se dibujó en TREK o se importó, desde qué archivo, y si ha cambiado desde entonces.',
  'help.ctx.trip-tour-planner.title': 'Excursiones',
  'help.guide.tour-open-workspace.title': 'Orientarte en la pestaña «Excursiones»',
  'help.guide.tour-open-workspace.step.7':
    'Haz clic en una excursión del carril derecho. Una excursión planificada en TREK se abre en el editor. Un track importado se abre sin cambios, como «Excursión GPX», para consultarlo.',
  'help.guide.tour-draw-route.step.2':
    'Escribe dónde empieza la excursión en «Buscar lugar o dirección» y elige el resultado. El mapa se desplaza hasta allí.',
  'help.guide.tour-draw-route.tip.4':
    'Los borradores sin guardar se conservan. Vuelve a abrir la pestaña «Excursiones» del viaje y se recupera, con el aviso «Borrador sin guardar restaurado».',
  'help.guide.tour-type-profile.tip.1':
    'Un cambio de tipo cuenta como un paso en el historial: «Deshacer cambio de punto de paso», arriba del carril, recupera el tipo anterior y su ruta.',
  'help.guide.tour-edit-points.step.4':
    'También puedes abrir «Más acciones» (los tres puntos) en la fila y elegir «Subir punto de paso» o «Bajar punto de paso».',
  'help.guide.tour-shaping-points.step.1':
    'Haz clic en la ruta dibujada en el mapa, en el punto por el que debería ir de otra forma. Aparece ahí un pequeño punto: un punto de forma.',
  'help.guide.tour-loop-reverse.title': 'Hacer una ruta circular o invertir la excursión',
  'help.guide.tour-loop-reverse.result':
    'Un circuito que termina donde empezó, o la misma excursión en sentido contrario.',
  'help.guide.tour-leg-by-hand.tip.2':
    'Un punto al que no llega ningún camino muestra un aviso con «Mostrar punto» y su número. Mueve el punto a un camino o dibuja a mano el tramo hasta él.',
  'help.guide.tour-trip-places.tip.1':
    'Un lugar que ya está en la excursión se marca con «En la excursión» y no se puede elegir dos veces.',
  'help.guide.tour-details-times.step.3': 'Introduce las «Pausas», por ejemplo 0:45. Se suman al tiempo estimado.',
  'help.guide.tour-save.step.1': 'Escribe un nombre en «Nombre de la excursión». Sin nombre, Guardar sigue en gris.',
  'help.guide.tour-edit-saved.title': 'Cambiar una excursión guardada',
  'help.guide.tour-edit-saved.tip.3':
    '«Descargar GPX» y «Guardar en una colección», arriba del carril, funcionan en cuanto los cambios están guardados.',
  'help.guide.tour-summary-profile.tip.1': 'Haz clic en el título de la tarjeta para plegar todo el resumen.',
  'help.guide.tour-list-manage.step.3': 'Elige el día. La excursión se añade a ese día, y su fila lo muestra.',
  'help.guide.tour-delete.goal': 'Elimina definitivamente una excursión del viaje.',
  'help.guide.tour-saved-elsewhere.goal':
    'Decide qué hacer cuando otra persona ha guardado la excursión mientras tú la cambiabas.',
  'help.ctx.trip-tour-import.title': 'Importar excursiones',
  'help.guide.tour-import-gpx.goal':
    'Convierte un track de un reloj GPS, una aplicación o Google Earth en una excursión del viaje, revisándolo antes de guardar nada.',
  'help.guide.tour-import-gpx.tip.3':
    'Un track que el viaje ya tiene aparece en gris como «Ya está en el viaje» y se omite.',
  'help.guide.tour-view-import.step.3':
    '«Volver a excursiones», la flecha de arriba a la izquierda, la vuelve a cerrar.',
  'help.guide.tour-plan-from-import.step.2':
    'TREK toma puntos de control del track y vuelve a calcular la ruta entre ellos. El mapa muestra lo importado con línea de puntos y la propuesta con línea continua, y la tarjeta compara sus longitudes, la proporción «A menos de 50 m del track» y la «Mayor desviación».',
  'help.guide.tour-restore-recorded.title': 'Volver al track grabado',
  'help.guide.tour-take-over.title': 'Traer una excursión de otro viaje',
  'help.guide.tour-take-over.tip.1':
    'La copia es una excursión independiente. Aún no está en ningún día, y los cambios posteriores en el original no afectan a la copia, ni al revés. Su «Origen» indica el viaje del que se trajo.',
  'help.guide.tour-import-wanderer.step.3':
    'Haz clic en una ruta. Aparece en el mapa, y la columna muestra lo que mide su archivo GPX, su descripción y si es pública o privada en wanderer.',
  'help.ctx.trip-tour-map.summary':
    'El mapa en el centro de la pestaña «Excursiones», para la excursión que tienes abierta: los mapas adecuados para su tipo, las pistas o señales náuticas superpuestas, los lugares a lo largo de la ruta y la misma excursión en 3D sobre el relieve real.',
  'help.guide.tour-map-layers.step.1':
    'Abre la pestaña «Excursiones» y haz clic en una excursión en «Excursiones de este viaje», a la derecha. Se abre en el planificador, y la píldora de abajo a la izquierda del mapa muestra los mapas que ofrece este tipo de excursión.',
  'help.guide.tour-along-search.goal':
    'Busca miradores, agua, refugios o un sitio para comer cerca de la ruta de la excursión que estás planificando.',
  'help.guide.tour-along-search.tip.2':
    'En un paseo urbano, cuatro temas encima de la lista seleccionan por ti los tipos adecuados.',
  'help.guide.tour-along-add-stop.result':
    'La excursión pasa ahora por el lugar, con su nueva distancia y su nuevo tiempo en «Resumen de la excursión». Guarda la excursión para conservar el cambio.',
  'help.guide.tour-3d-terrain.step.3':
    'Haz clic en la píldora «Reparto de pendientes», a la derecha. Se despliega y muestra qué parte de la excursión va con «menos del 5 %», «del 5 al 10 %», «del 10 al 18 %», «del 18 al 27 %» y «27 % o más». Plegada, muestra el punto más alto y el tramo más empinado.',
  'help.guide.tour-3d-flyover.goal':
    'Recorre visualmente toda la excursión de principio a fin antes de hacerla a pie, en bici o con esquís.',
  'help.guide.tour-3d-flyover.tip.3':
    'Con el sobrevuelo en pausa, desplázate por el perfil de altitud para llevar el punto a esa posición. «Reproducir sobrevuelo» continúa desde ahí.',
  'help.guide.tour-map-overlays.tip.1':
    'Las pistas son datos cartográficos, no un parte en directo: no indican qué está abierto o pisado, ni cómo está la nieve, ni nada sobre aludes. Si alejas el zoom fuera de la estación de esquí, el interruptor indica «Acerca el mapa para ver las pistas».',
  'help.ctx.trip-tour-stages.bullet.4':
    'En «Excursiones de este viaje», una excursión de varios días muestra una luna con su número de etapas. Ese botón, «Mostrar etapas», despliega la lista de etapas con el día de cada una y los totales de «Ruta completa».',
  'help.guide.tour-multi-day.step.5':
    '«Resumen de la excursión» muestra cada etapa en «Etapas». Haz clic en una para ver dónde termina: se selecciona su última parada y el perfil de altitud marca ese punto.',
  'help.guide.tour-stages-on-days.goal': 'Pon cada etapa en su propio día, o toda la excursión en un solo día.',
  'help.guide.tour-stages-on-days.tip.2':
    '«Ruta completa en este día» aparece en gris en un día que ya tiene la excursión. «Etapas desde este día» sigue funcionando ahí y sustituye la excursión completa en ese día.',
  'help.ctx.trip-tour-hike.bullet.3':
    'La cabecera de la tarjeta «Puntos de ruta» tiene las herramientas de ruta: «Invertir el sentido», «Volver al inicio» y, en una caminata, «Ruta circular desde el inicio». «Más acciones» en una parada incluye «Comparar caminos del siguiente tramo».',
  'help.guide.tour-hike-plan.step.3': 'Escribe un nombre en «Nombre de la excursión».',
  'help.guide.tour-hike-plan.tip.4':
    'El tiempo de marcha sigue la regla de la señalización de senderos (DIN 33466) y no incluye pausas. Añádelas en «Pausas», dentro de «Detalles», y aparecerán en el total previsto.',
  'help.guide.tour-hike-trail-details.result':
    'Sabes qué grado tiene cada parte de la caminata, de qué tipo de suelo es y dónde está en el mapa.',
  'help.guide.tour-hike-round.step.3':
    'Haz clic en «Buscar rutas». En la lista y en el mapa aparecen «Circuito A», «Circuito B», etc., cada una con su propio color.',
  'help.guide.tour-hike-compare-ways.goal':
    'Consulta qué otros caminos podría seguir una caminata entre dos paradas y elige uno.',
  'help.guide.tour-hike-compare-ways.tip.3': 'Cancelar cierra la tarjeta sin cambiar la ruta.',
  'help.guide.tour-ferrata-add.result':
    'La caminata sigue la vía ferrata por su propia línea de OpenStreetMap. Haz clic en el mapa para continuar desde arriba. El calculador solo planifica el camino hasta la vía ferrata y el de después.',
  'help.guide.tour-run-plan.step.2':
    'Elige un «Perfil»: «Correr», para caminos sobre todo asfaltados en ciudad, parques y riberas, o «Carrera de montaña», para pistas forestales y senderos naturales.',
  'help.guide.tour-run-plan.tip.4': '«Carrera de montaña» usa senderos hasta los de montaña (T2), nunca más difíciles.',
  'help.guide.tour-run-ways.tip.2':
    'Cambia el «Perfil» a «Carrera de montaña» para que la ruta vaya más por senderos naturales, o a «Correr» para mantenerla en suelo firme.',
  'help.guide.tour-walk-plan.title': 'Planificar un paseo urbano de parada en parada',
  'help.guide.tour-walk-plan.tip.1':
    'El anillo alrededor del número de una parada indica su importancia: continuo para «Imprescindible» y discontinuo para «Opcional». Un pequeño escudo marca una parada «Protegida».',
  'help.guide.tour-walk-sights.step.3':
    'Haz clic en «Buscar a lo largo de la ruta». Una estrella delante de un nombre marca un «Imprescindible», uno de los lugares más conocidos de la zona.',
  'help.guide.tour-walk-day-times.goal':
    'Sabe a qué hora llegas a cada parada el día del paseo y qué lugares estarán cerrados a esa hora.',
  'help.guide.tour-walk-day-times.tip.4':
    'Dos paseos el mismo día: en la pestaña «Planificado», haz clic en el tramo entre ellos («Cambiar medio de transporte») y elige «Transporte público». La búsqueda empieza donde termina el primer paseo, a la hora en que termina, y te avisa si una conexión llega después de que empiece el siguiente paseo.',
  'help.guide.tour-walk-google-import.tip.1':
    'Solo se lee una ruta planificada a pie. Cambia Google Maps al modo a pie antes de compartirla.',
  'help.guide.tour-walk-check-off.step.3':
    'Haz clic en «Marcar como visitado» en una parada que ya hayas visto, u «Omitir» en una que te saltes.',
  'help.ctx.trip-tour-bike.bullet.1':
    '«Perfil», bajo «Tipo de ruta», indica para qué tipo de pedaleo planifica el calculador: «Cicloturismo», «Carretera», Gravel o MTB. La línea de debajo explica qué busca el calculador, y al cambiarlo se vuelve a planificar toda la ruta.',
  'help.guide.tour-bike-profile.step.3':
    'En «Perfil», elige «Cicloturismo», «Carretera», Gravel o MTB. La línea de debajo explica qué busca el calculador con ese perfil.',
  'help.guide.tour-bike-profile.tip.4':
    'Guardar sigue en gris hasta que la excursión tenga nombre y se hayan calculado la ruta y sus altitudes.',
  'help.guide.tour-bike-surfaces.result':
    'El mapa marca los tramos de la fila que elegiste, y sabes por qué tipo de firme va la ruta. La excursión en sí no cambia.',
  'help.guide.tour-bike-mtb-grades.step.2':
    'En la tarjeta «Firme y vías», consulta «Grado del sendero (mtb:scale)»: la proporción de la ruta desde «S0, sin dificultad especial», hasta «S4 o más, terreno de expertos».',
  'help.ctx.trip-tour-ski.summary':
    'Una excursión de tipo «Esquí e invierno» en la pestaña «Excursiones»: un día de pistas, un circuito de fondo, una travesía con esquís, una ruta con raquetas o un paseo invernal. Sus tramos siguen las pistas, remontes y senderos cartografiados en OpenStreetMap, planificados por el calculador de pistas para tu disciplina y tus límites, y un track de esquí grabado se importa con su disciplina.',
  'help.guide.tour-ski-plan.step.1':
    'En la pestaña «Excursiones», haz clic en «Planificar nueva excursión», arriba del carril izquierdo.',
  'help.guide.tour-ski-plan.tip.3':
    'Si cambias la disciplina más tarde, se conservan tus puntos y los tramos se vuelven a planificar con las opciones de esa disciplina.',
  'help.guide.tour-ski-options.step.4':
    'Usa los interruptores: «Usar remontes», «Permitir rutas freeride», «Bajar en remonte si hace falta» y «Evitar enlaces supuestos». «Esquí de fondo» añade «Solo circuitos pisados» y «Solo circuitos iluminados», y «Esquí de travesía» añade «Subir por el borde de la pista».',
  'help.guide.tour-ski-fix-leg.step.1':
    'Un tramo que el calculador no ha podido planificar muestra una fila roja bajo su punto con el motivo, por ejemplo «Only a lift you left out joins these points», y la pista o el remonte al que se refiere.',
  'help.guide.tour-ski-summary.title': 'Consultar la ruta por pistas de una excursión de esquí',
  'help.guide.tour-ski-summary.tip.4':
    'Al pie de la tarjeta aparecen las estaciones de esquí y la fecha de los datos cartográficos con los que se planificó la excursión.',
  'help.guide.tour-ski-pistes-layer.tip.2':
    'Si las pistas dejan de cargarse, el interruptor muestra un icono de aviso. El mapa y tu ruta siguen funcionando.',
  'help.guide.tour-ski-import.step.4': 'Haz clic en «Importar 1 excursión».',
  'help.ctx.trip-tour-paddle.summary':
    'Una excursión en kayak, canoa o SUP por un río o un lago. Indica su embarcación y su tipo de agua, sigue el agua donde TREK tiene datos, incluye en su tiempo los porteos y las esclusas, y muestra el viento del día en que remas y lo que se sabe de los obstáculos del recorrido.',
  'help.guide.tour-paddle-setup.goal':
    'Empieza una excursión en kayak, canoa o SUP e indica con qué remas, en qué tipo de agua y a qué velocidad.',
  'help.guide.tour-paddle-setup.tip.1':
    'Con «Barco» en «Otros» no hay velocidad sugerida. Introduce una, o el tiempo en el agua se quedará vacío.',
  'help.guide.tour-paddle-water-route.step.2':
    'Para que un tramo se planifique por el agua, pasa el cursor por la parada anterior y haz clic en «Más acciones», los tres puntos.',
  'help.guide.tour-paddle-water-route.result':
    'Cada tramo sigue el agua o está dibujado a mano a propósito, y un tramo que TREK no ha podido planificar explica por qué.',
  'help.guide.tour-paddle-portage.tip.1':
    'Si al final quieres remar ese tramo, vuelve a abrir «Más acciones» en el punto y elige «Volver a remar este tramo». Vuelve a ser un tramo dibujado a mano.',
  'help.guide.tour-paddle-lock.step.3': 'Haz clic en la tarjeta de la esclusa para abrirla.',
  'help.guide.tour-paddle-time.step.1':
    '«Estimación de tiempo» está en la columna izquierda, bajo los puntos de ruta. La insignia de su cabecera es el total, pausas incluidas.',
  'help.guide.tour-paddle-time.result': 'La estimación cuenta lo que has introducido e indica lo que aún falta.',
  'help.guide.tour-paddle-wind.tip.2':
    'Una excursión de varios días muestra una etiqueta por cada día en la cabecera de la tarjeta. Haz clic en una para ver ese día.',
  'help.guide.tour-paddle-checklist.step.3':
    'Las entradas siguen el orden de la ruta: azudes, esclusas, rápidos, puntos de embarque y normas de acceso de OpenStreetMap, y tus propios porteos y esclusas, marcados como «Propio».',
  'help.guide.tour-paddle-checklist.result':
    'Cada entrada de la ruta tiene una decisión, y has leído la nota de seguridad.',
  'help.guide.tour-paddle-track-marks.step.6':
    'Haz clic en «Esclusa» y luego en la línea, en el punto donde está la esclusa.',
  'help.ctx.trip-tour-horse.bullet.1':
    'Pon «Tipo de ruta» en «Ruta a caballo» en el editor y aparecerá la tarjeta «Rutas ecuestres» en la columna izquierda. «Buscar en la vista» muestra las rutas de la zona visible del mapa.',
  'help.guide.tour-horse-plan.step.2':
    'Haz clic en el campo «Tipo de ruta», bajo «Nombre de la excursión», y elige «Ruta a caballo». La tarjeta «Rutas ecuestres» aparece debajo de «Puntos de ruta».',
  'help.guide.tour-horse-plan.tip.2':
    'TREK no calcula el tiempo a caballo de una ruta. Si quieres que aparezca en el día, introduce un tiempo en «Planeado», dentro de «Detalles».',
  'help.guide.tour-horse-gap.step.3':
    'Haz clic en «Tomar tramo». Mientras el interruptor esté desactivado, el botón sigue en gris.',
  'help.guide.tour-horse-recorded.step.1':
    'En «Excursiones de este viaje», haz clic en «Añadir ruta» (el +), elige «Importar GPX o KML» y selecciona el archivo de tu ruta.',
  'help.guide.dateless-trip.title': 'Planificar un viaje sin fechas',
  'help.guide.trip-reminder.step.2':
    'En «Recordatorio», elige 1, 3 o 9 días. Para otra antelación, haz clic en «Personalizado» y escribe un número de días entre 1 y 30.',
  'help.guide.upcoming-reservations.title': 'Ir a tus próximas reservas',
  'help.guide.half-company-holiday.title': 'Marcar medio día festivo de empresa',
  'help.guide.edit-holiday-calendar.step.2':
    'Haz clic en el cuadrado de color para elegir otro color, o escribe una etiqueta nueva y pulsa Intro.',
  'help.guide.person-color.step.1': 'En la tarjeta «Personas», haz clic en el punto de color delante del nombre.',
  'help.guide.answer-fusion-request.title': 'Responder a una solicitud de fusión',
  'help.guide.log-for-partner.title': 'Registrar días para alguien con quien planificas',
  'help.guide.dissolve-fusion.title': 'Dejar de planificar juntos',
  'help.guide.country-places.goal':
    'Consulta los lugares que TREK cuenta para un país, para repasar lo que hiciste allí o encontrar un lugar que TREK haya asignado a un país equivocado.',
  'help.guide.regions.tip.3':
    '«Añadir a lista de deseos» también funciona con regiones. La región aparece con el mismo rayado que un país de tu lista de deseos.',
  'help.guide.tour-activity-stats.step.2':
    'Elige un periodo y un tipo con las dos píldoras de la izquierda. «Periodo» ofrece «Desde siempre», «Este año», «Últimos 12 meses» y cada año anterior en el que tengas excursiones; «Tipo» limita las cifras a un tipo de excursión, o a «Todos los tipos».',
  'help.guide.tour-activity-stats.tip.3':
    'Un día con participantes indicados solo cuenta para ellos; un día sin participantes indicados cuenta para todos los del viaje. La pestaña carga datos en directo y necesita conexión a internet.',
  'help.guide.move-to-list.goal':
    'Reorganiza tus listas moviendo lugares de una a otra o copiándolos en una segunda lista.',
  'help.guide.accept-list-invite.result':
    'La lista aparece en «Compartida», en la columna de listas, y se abre con sus lugares. Los cambios que hagan sus miembros se ven en directo.',
  'help.guide.tour-collection-add-to-trip.step.1':
    'Abre la lista. Las excursiones guardadas son las primeras filas, encima de los lugares. Haz clic en «Añadir a un viaje» en la excursión, o en la propia fila.',
  'help.guide.tour-collection-manage.title': 'Buscar y quitar excursiones guardadas',
  'help.guide.tour-collection-manage.result': 'La excursión se quita de la lista, y un breve mensaje lo confirma.',
  'help.guide.entry-draft.title': 'Guardar una entrada como borrador',
  'help.guide.journey-map-layers.step.1':
    'Arriba del mapa, la barra de capas tiene «Planificado», «Grabado», «Entradas» y «Fotos», cada una con su recuento. Haz clic en una para ocultarla o mostrarla.',
  'help.guide.journey-keep-route.step.1':
    'En la cabecera del día, haz clic en el botón de Dawarich, «Tomar la grabación».',
  'help.guide.journey-day-stays.step.1':
    'Un día con estancias por revisar termina con una fila como «4 estancias de Dawarich» y el intervalo de horas. Haz clic en ella para ver las estancias.',
  'help.guide.journey-take-over-day.step.1':
    'Haz clic en «Incorporar día», al final de la fila de estancias del día, o en el botón de lista de la cabecera del día, que indica cuántas estancias hay pendientes.',
  'help.guide.journey-auto-prepare.goal':
    'Haz que las estancias de cada día se preparen automáticamente para revisarlas mientras el viaje está en curso.',
  'help.guide.photo-location.goal': 'Coloca las entradas en el mapa sin tener que buscar un lugar para cada una.',
  'help.ctx.settings-about.bullet.1': 'La versión que ejecuta este servidor aparece junto al título.',
  'help.guide.readability.tip.3':
    '«Legibilidad» está marcada como «Experimental». Si algo se ve mal, haz clic en «Restablecer valores predeterminados», al final de la pestaña, para volver a la configuración predeterminada.',
  'help.guide.web-push-device.goal':
    'Recibe las notificaciones de TREK en tu móvil o tu ordenador aunque TREK esté cerrado.',
  'help.guide.connect-airtrail.tip.2':
    'La clave se guarda cifrada y no se vuelve a mostrar; si ves puntos en el campo, hay una guardada.',
  'help.guide.connect-dawarich.tip.2':
    'Debajo de los botones, la tarjeta indica cuándo comprobó TREK por última vez y qué no ofrece tu versión de Dawarich.',
  'help.guide.tour-connect-wanderer.tip.2':
    'Si la instancia está en una dirección privada, puede que el administrador tenga que permitir las redes internas.',
  'help.guide.tour-wanderer-watch.tip.2':
    '«En pausa hasta» significa que wanderer no ha respondido; «Token rechazado» significa que el token necesita una prueba de conexión correcta o que hace falta uno nuevo.',
  'help.guide.plugin-settings.result':
    'El plugin funciona con tus ajustes, y todas las acciones que hace por ti aparecen en «Actividad de plugins».',
  'help.ctx.admin-defaults.bullet.3':
    'El enlace «restaurar» junto a un campo que hayas configurado recupera el valor predeterminado de TREK. Lo que configure cada usuario siempre tiene prioridad sobre estos valores.',
  'help.ctx.admin-settings.bullet.5':
    '«Zona de peligro»: «Rotar secreto JWT» cierra la sesión de todos los usuarios, también la tuya.',
  'help.guide.default-user-settings.step.1':
    'En «Configuración predeterminada de usuarios», elige «Modo de color» («Claro», «Oscuro» o «Automático»), «Unidad de temperatura», «Unidad de distancia», «Formato de hora», «La semana comienza el», la «Moneda de visualización» y si «Difuminar códigos de reserva» está activado o desactivado. Cada opción se guarda al momento.',
  'help.guide.admin-passkeys.step.2':
    'Introduce el «Relying Party ID (dominio)», por ejemplo trek.example.org, y los «Orígenes permitidos» desde los que se accede a tu TREK, y haz clic en Guardar. Déjalos vacíos para usar APP_URL.',
  'help.guide.rotate-jwt-secret.title': 'Cerrar la sesión de todos a la vez',
  'help.guide.notification-defaults.step.2':
    'Haz clic en una casilla para pasarla al siguiente estado: activado, «Desactivado», «Bloqueado». La descripción emergente indica el siguiente estado, y cada clic se guarda al momento.',
  'help.ctx.notifications.bullet.2':
    '«Todas» y «No leídas», arriba, cambian entre todas las notificaciones y solo las que no has leído. La lista carga más a medida que te desplazas.',
  'help.guide.read-notifications.step.3':
    'Haz clic en el botón bajo una notificación, aquí «Ver Vacay», para abrir aquello a lo que se refiere. Así también se marca como leída.',
  'help.guide.filter-notifications.step.3':
    'Haz clic en «No leídas» para ver solo las notificaciones que no has leído. «Todas» vuelve a mostrarlas todas.',
  'help.guide.mark-notifications-read.tip.2':
    'Marcar como leída solo cambia el color de fondo y el recuento. La notificación sigue en la lista hasta que la elimines.',
  'help.guide.delete-notifications.result': 'La notificación desaparece de la lista y de la campana.',
  'help.guide.notification-settings.result':
    '«Ajustes» está abierto en «Notificaciones», con un interruptor por evento y canal.',
  'help.guide.link-journal.goal':
    'Muestra uno de tus diarios de «Travesía» dentro del viaje, a las personas que elijas.',
  'help.guide.link-journal.tip.3':
    'Más adelante, «Diario» en «Ajustes del viaje» ofrece «Editar acceso», «Cambiar diario» y «Desvincular». Al desvincular desaparece la pestaña; las personas que añadiste en el propio diario mantienen su acceso.',
  'help.guide.dawarich-stays.result':
    'La estancia es ahora un lugar del viaje, en el día que elegiste o en «Sin planificar», y el panel la marca como tratada.',
  'help.ctx.trip-days.bullet.7':
    'Mientras el viaje está en curso, el plan se abre en el día de hoy y se desplaza hasta él.',
  'help.guide.leave-stop-off-route.tip.2':
    '«Quitar del día» saca la parada del día; «Quitar de la ruta» la mantiene en el plan.',
  'help.guide.move-booking-day.goal':
    'Pasa un transporte o una reserva a otro día directamente desde el plan, sin abrir su formulario.',
  'help.guide.place-image-from-file.result':
    'La foto es la imagen del lugar en la tarjeta, en la columna de lugares, en el día y en el mapa.',
  'help.guide.place-own-hours.step.3':
    '«Horario de apertura», debajo, muestra la semana, con una fila por día. Si TREK encontró el horario del lugar, ya está rellenado; si no, haz clic primero en «Añadir horario». Escribe a qué hora abre y cierra cada día, y haz clic en «Cerrada» en los días que no abre.',
  'help.guide.add-accommodation.tip.5':
    'Los tracks GPX y los lugares de excursiones nunca se ofrecen como alojamiento; solo los lugares normales del viaje.',
  'help.guide.confirm-stay-booking.step.1':
    'Abre el día de entrada. En la tarjeta de la estancia, en «Reserva», verás la reserva de hotel de esa noche, con «Pendiente» o «Confirmado». Haz clic en esa casilla.',
  'help.guide.tour-map-lines.step.4':
    'Para quitar una excursión del mapa, cambia la columna derecha a «Excursiones», pasa el cursor por la excursión y haz clic en el ojo, «Ocultar en el mapa». Su línea y su marcador desaparecen del mapa, y la fila sigue en la lista, atenuada, con un ojo tachado, «Mostrar en el mapa», que la vuelve a mostrar.',
  'help.guide.car-stops.step.1':
    'En la cabecera del día en que recoges el coche, haz clic en el +, cuya descripción emergente dice «Añadir al día», y elige «Añadir transporte».',
  'help.guide.car-stops.tip.2': '«Subir» y «Bajar» solo aparecen cuando el trayecto tiene dos paradas o más.',
  'help.guide.transport-details.title': 'Abrir un transporte y usar sus detalles',
  'help.guide.transport-details.tip.1':
    'Si la línea de un trayecto ya se muestra, volver a pulsar «En el mapa» la oculta.',
  'help.guide.export-transports-csv.result':
    'Tu navegador guarda un archivo con el nombre del viaje, por ejemplo autumn-in-japan-transports.csv, con una fila por trayecto: «Tipo», «Título», «Estado», «Inicio», «Fin», «De», «A», «Ubicación», «Confirmación» y «Notas».',
  'help.guide.group-sort-bookings.goal':
    'Organiza las tarjetas o la lista por estado, por día o por tipo, en el orden que quieras.',
  'help.guide.booking-on-map.tip.1':
    '«En el mapa» solo aparece en reservas con un lugar. Elige uno en «Lugar / Actividad» en el formulario y aparecerá el botón.',
  'help.guide.export-bookings-csv.step.2':
    'Abre «Opciones de vista», los controles deslizantes después de los iconos de vista, y elige un orden en «Ordenar por». Las filas siguen ese orden, una por reserva y sin secciones.',
  'help.guide.edit-booking.tip.4':
    'Si has cambiado algo, un clic fuera del formulario, o Escape, te pregunta «¿Descartar los cambios?». «Seguir editando» te devuelve al formulario.',
  'help.guide.arrange-packing-list.step.2':
    'Dentro de una lista, el asa a la izquierda de una fila mueve ese artículo hacia arriba o hacia abajo. Una línea de tu color de acento en el borde izquierdo de una fila indica dónde quedará.',
  'help.guide.count-packed-pieces.goal':
    'Ponle una cantidad a un artículo y marca sus unidades como guardadas una a una.',
  'help.guide.count-packed-pieces.tip.3': 'Con cantidad uno no aparece contador; solo está la casilla.',
  'help.guide.expense-receipts.step.2':
    'Haz clic en «Adjuntar», junto a «Recibos y facturas», y elige la foto o el PDF; también puedes elegir varios a la vez. Cada archivo aparece bajo el título, con una papelera para quitarlo.',
  'help.guide.files-sync-settings.goal':
    'Decide si los documentos solo se importan desde tu almacenamiento, solo se exportan a él o ambas cosas, y qué pasa cuando un documento se elimina o se cambia en los dos sitios.',
  'help.guide.files-sync-settings.tip.2':
    'Con «Preguntarme», un documento editado en los dos sitios queda en espera en «Requiere atención», debajo de la tarjeta. Haz clic en «Resolver» y elige «Conservar la versión de TREK», «Conservar la versión del proveedor» o «Conservar ambas».',
  'help.guide.manage-notes.goal':
    'Abre una nota completa, deja la importante arriba y corrige o elimina lo que ya no esté al día.',
  'help.guide.manage-notes.tip.2':
    'Mientras editas, la cruz roja de un archivo ya adjunto lo elimina al momento, antes de hacer clic en Guardar, y no pasa por la papelera. Todos los archivos de una nota aparecen también en la pestaña «Archivos» del viaje.',
  'help.guide.note-categories.step.6':
    'De vuelta en la tarjeta «Notas», las píldoras bajo la cabecera filtran las tarjetas. Haz clic en una categoría para ver solo sus notas; «Todos», o volver a pulsar la misma píldora, las muestra todas.',
  'help.guide.roadtrip-reorder.tip.1':
    'Mover una parada aquí también la mueve en el plan del día: «Días» muestra el mismo orden.',
  'help.guide.roadtrip-overnight.step.1':
    'En «En la ruta», marca «Alojamiento» en «Se busca», o «Camping» si buscas una parcela, elige el día en que quieres parar y haz clic en «Buscar».',
  'help.guide.roadtrip-overnight.tip.3':
    'Con «Empezar y terminar cada día en tu alojamiento» activado, en «Línea de la ruta» dentro de «Ajustes de conducción», el trayecto del día siguiente empieza donde dormiste.',
  'help.guide.roadtrip-stop-fill.title': 'Definir hasta dónde se llena en una parada',
  'help.guide.roadtrip-bookings.title': 'Incluir tu vuelo, tren o ferry en el trayecto',
  'help.guide.roadtrip-bookings.tip.2':
    'Una mesa o una entrada reservada en una parada aparece como píldora en esa parada; lo que no pertenece a ninguna parada aparece en «También reservado este día».',
  'help.guide.roadtrip-google-import.step.3':
    'Revisa las paradas que ha encontrado. Cada una muestra dónde está; las marcadas con «Location unresolved» se omiten.',
  'help.guide.roadtrip-hazards.step.1': 'Abre «Ajustes de conducción» en la columna derecha.',
  'help.ctx.trip-tours.summary':
    'La columna derecha de la pestaña «Planificado» en modo «Excursiones»: todas las excursiones del viaje en una lista, junto a los días. Desde aquí pones excursiones en días, filtras la lista, ocultas líneas en el mapa e importas archivos GPX o KML. Las rutas se dibujan y se modifican en la pestaña «Excursiones».',
  'help.guide.tour-show-list.goal':
    'Cambia la columna de lugares por las excursiones del viaje para verlas y elegirlas junto a los días.',
  'help.guide.tour-show-list.tip.3':
    'Con el complemento «Excursiones» activado, los tracks nunca aparecen en la lista de lugares: cada track importado es una excursión y aparece aquí.',
  'help.guide.tour-add-to-day.step.5':
    'Si la excursión tiene etapas, el mismo menú te pregunta a continuación. «Etapas desde este día» pone la etapa 1 ese día y cada una de las siguientes en el día posterior; «Ruta completa en este día» pone toda la excursión en ese único día.',
  'help.guide.tour-day-times.step.1':
    'En la columna de días, pasa el cursor por la fila de la excursión, haz clic en «Más opciones» (los tres puntos) y elige Editar.',
  'help.guide.tour-day-times.result':
    'La excursión aparece en la cronología del día con su inicio y su fin, como cualquier parada con hora.',
  'help.guide.tour-remove-from-day.result':
    'El día ya no muestra la excursión, y su fila en la lista no tiene insignia de día.',
  'help.guide.tour-filter-list.tip.2':
    'Una sección solo aparece si las excursiones se diferencian en ella, así que en una lista corta puede que solo veas «Estado».',
  'help.guide.tour-hide-on-map.tip.1':
    'Ocultar solo te afecta a ti y se guarda en este navegador para este viaje: la excursión, sus días y su color no cambian, y la excursión sigue viéndose en los mapas de los demás.',
  'help.guide.tour-import-plan-tab.tip.1':
    'Un track que ya está en el viaje se marca con «Ya está en el viaje» y no se importa dos veces.',
  'help.ctx.trip-tour-detail.bullet.4':
    'La fila de abajo: «Añadir al día» o «Quitar del día» si hay un día abierto, «Navegación» hasta el inicio, la página web de la excursión, GPX, Compartir si tu dispositivo puede compartir archivos, «Colección» y Copiar.',
  'help.guide.tour-detail-read.step.5':
    'Debajo vienen las medidas: «Distancia», «Altitud mínima», «Altitud máxima», «Desnivel positivo» y «Desnivel negativo», los tiempos debajo y el perfil de altitud con el color de la línea de la excursión.',
  'help.guide.tour-detail-read.result':
    'La tarjeta de la excursión está abierta junto al plan, y sabes en qué días está, cuánto mide, qué pendiente tiene y de dónde procede.',
  'help.guide.tour-rename-colour.tip.2':
    'El lápiz y el punto solo funcionan para los miembros que pueden editar lugares.',
  'help.guide.tour-take-along.tip.2':
    'Elige una aplicación de mapas preferida en «Ajustes», y «Navegación» abrirá directamente esa aplicación en lugar de mostrar la lista.',
  'help.guide.tour-copy-keep.step.3':
    'Para guardar una excursión para otros viajes, ábrela y haz clic en «Colección», al pie de su tarjeta.',
  'help.guide.tour-packing-link.goal':
    'Muestra en la propia tarjeta de una excursión lo que hay que llevar, desde la lista de equipaje del viaje o una de sus listas.',
  'help.guide.tour-packing-link.tip.3':
    'Para vincular necesitas permiso para editar lugares. Los demás ven la lista vinculada, pero no pueden cambiar el vínculo.',
  'help.guide.tour-files.tip.2':
    'Subir solo aparece para los miembros que pueden modificar la excursión y añadir archivos.',
  'help.guide.tour-activity-link.step.5':
    'El track aparece ahora en «Track real», con sus propios valores y su propio perfil junto al plan.',
  'help.guide.tour-activity-compare.step.2':
    '«Máxima distancia al plan» muestra la mayor distancia entre el track y la línea planificada, y «Fuera del plan» indica qué parte del track se salió de esa línea.',
  'help.guide.tour-origin-check.step.1':
    'Abre la tarjeta de la excursión y baja hasta «Origen». La fuente indica de dónde procede: «Importación GPX» con el nombre del archivo, importación KML o KMZ, o wanderer con su dirección.',
  'help.ctx.trip-tour-planner.summary':
    'El planificador de excursiones del viaje: el editor a la izquierda, todas las excursiones del viaje a la derecha y el mapa en medio. Aquí dibujas una excursión punto a punto, calculas su ruta por caminos y carreteras reales, añades sus detalles y la guardas en el viaje.',
  'help.guide.tour-open-workspace.goal': 'Abre el planificador de excursiones y descubre para qué sirve cada parte.',
  'help.guide.tour-open-workspace.tip.1':
    '«Contraer», en la pestaña del borde interior de cada carril, oculta el carril para dejar más espacio al mapa; «Planificado» y «Excursiones de este viaje» vuelven a mostrar los carriles. Arrastra el borde de un carril para ensancharlo o estrecharlo.',
  'help.guide.tour-draw-route.step.3':
    'Comprueba que «Añadir punto», en «Puntos de ruta», está activado (es el mismo interruptor que «Colocar puntos» en la píldora del mapa) y haz clic en el mapa donde empieza la excursión.',
  'help.guide.tour-draw-route.result':
    'Una ruta numerada en el mapa y sus puntos en «Puntos de ruta», lista para ponerle nombre y guardarla.',
  'help.guide.tour-type-profile.tip.2':
    'Algunos tipos piden más datos antes de poder guardarse: una «Carrera a pie», su «Ritmo previsto»; una «Ruta en piragua», su embarcación y el tipo de agua; una excursión de «Esquí e invierno», su disciplina.',
  'help.guide.tour-edit-points.step.5':
    '«Eliminar punto de paso», la papelera de al lado, quita el punto de la excursión.',
  'help.guide.tour-shaping-points.step.2':
    'Arrastra el punto al camino por el que debe ir la ruta. La ruta se vuelve a planificar pasando por él.',
  'help.guide.tour-loop-reverse.goal': 'Haz que la excursión termine en su inicio, o invierte su sentido.',
  'help.guide.tour-leg-by-hand.title': 'Dibujar un tramo a mano o volver a planificarlo',
  'help.guide.tour-leg-by-hand.result':
    'El tramo es una línea recta donde elegiste, marcado como dibujado a mano, o se vuelve a calcular.',
  'help.guide.tour-trip-places.tip.2':
    'Si quitas la parada o la desvinculas, el lugar sigue en el viaje tal como estaba, con sus días.',
  'help.guide.tour-details-times.step.4':
    '«Planeado» muestra el total. Escribe el tuyo para sustituirlo; quedará marcado como «Ajuste manual».',
  'help.guide.tour-save.step.2':
    'Espera a que desaparezca el punto junto a «Nueva excursión». Para guardar hacen falta la ruta y todas sus altitudes.',
  'help.guide.tour-edit-saved.goal': 'Abre una excursión que ya planificaste, cámbiala y vuelve a guardarla.',
  'help.guide.tour-edit-saved.result': 'La excursión guardada incluye ahora tus cambios.',
  'help.guide.tour-summary-profile.tip.2':
    'Si la ruta pasa por una vía ferrata, aparece encima de las cifras una insignia de aviso con su grado.',
  'help.guide.tour-list-manage.step.4':
    'El botón encima de «Totales del viaje» es el filtro. Muestra el estado por el que filtra, «Todos» al principio, con el número de excursiones.',
  'help.guide.tour-delete.step.1':
    'Pasa el cursor por la excursión en «Excursiones de este viaje» y haz clic en la papelera a la derecha de su fila, Eliminar con el nombre de la excursión.',
  'help.guide.tour-saved-elsewhere.step.1':
    'Mientras editas, aparece arriba del carril «Esta excursión se guardó en otro lugar». Tus cambios se conservan hasta que decidas.',
  'help.ctx.trip-tour-import.summary':
    'Aquí importas al viaje excursiones que ya existen en otro sitio: un archivo GPX, KML o KMZ de un reloj o una aplicación, una excursión de otro de tus viajes o una ruta de tu propio wanderer. Lo importado se conserva tal como se grabó, y puedes planificar a partir de ello una versión editable.',
  'help.guide.tour-import-gpx.step.1':
    'Abre la pestaña «Excursiones» del viaje. Arriba de «Excursiones de este viaje», a la derecha, haz clic en el + («Añadir ruta»).',
  'help.guide.tour-import-gpx.tip.4':
    'Un archivo KML o KMZ también indica en «No importado» lo que contenía además de sus líneas: puntos, áreas y otros elementos.',
  'help.guide.tour-view-import.tip.1':
    'Lo importado no se puede editar punto a punto. «Planificar una versión editable», en la tarjeta «Versión editable» de arriba, crea a partir de ello una excursión que puedes modificar.',
  'help.guide.tour-plan-from-import.step.3':
    'Haz clic en «Reemplazar la importación» para volver a planificar esta misma excursión: sus días y notas se conservan, y el track grabado se guarda para que puedas recuperarlo. «Planificar como excursión nueva» no cambia lo importado y crea una segunda excursión junto a ello.',
  'help.guide.tour-restore-recorded.goal':
    'Deshaz la replanificación de una importación y recupera el track original, aunque haya pasado mucho tiempo.',
  'help.guide.tour-take-over.goal':
    'Reutiliza una excursión que ya planificaste o importaste en otro de tus viajes, sin volver a dibujarla.',
  'help.guide.tour-take-over.tip.2':
    'Solo aparecen tus otros viajes, y solo las 100 primeras excursiones. Usa la búsqueda o los filtros para encontrar el resto.',
  'help.guide.tour-import-wanderer.step.4': 'Haz clic en «Importar al viaje».',
  'help.ctx.trip-tour-map.bullet.1':
    'La píldora de abajo a la izquierda del mapa tiene los mapas base que ofrece el tipo de la excursión abierta: «Mapa», Topo, «Senderismo» en una caminata, «Bicicleta» en una ruta en bici y «Satélite». Lo que elijas ahí solo se aplica al planificador y nunca cambia el ajuste de mapa de «Ajustes».',
  'help.guide.tour-map-layers.step.2':
    'Haz clic en Topo para ver curvas de nivel y relieve sombreado, el mapa que muestra lo empinado que es el terreno. El mapa elegido queda resaltado en la píldora.',
  'help.guide.tour-along-search.step.1':
    'Abre una excursión en la pestaña «Excursiones» y baja en el panel izquierdo hasta «A lo largo de la ruta», bajo las paradas de la excursión. La tarjeta aparece en cuanto la excursión tiene ruta.',
  'help.guide.tour-along-search.tip.3':
    'Los resultados proceden de OpenStreetMap y del índice de lugares de TREK, así que la búsqueda necesita conexión. Si no se encuentra nada, «Ampliar a» prueba con la siguiente distancia; si un servidor está saturado, «Reintentar» muestra una cuenta atrás hasta que puedas volver a intentarlo.',
  'help.guide.tour-along-add-stop.tip.1':
    'El lugar pasa a ser una parada de la excursión, no un lugar del viaje, así que no aparece en la lista de lugares.',
  'help.guide.tour-3d-terrain.step.4':
    'Arrastra el control «Relieve» para hacer las colinas hasta tres veces más altas, algo útil en terrenos suaves.',
  'help.guide.tour-3d-flyover.step.1':
    'Cambia la excursión a 3D. Mientras se carga el relieve a lo largo de la ruta, un anillo se va llenando donde aparecerá el botón de reproducir; cuando esté lleno, haz clic en «Reproducir sobrevuelo». La cámara sigue un punto por la ruta, y el cursor del perfil de altitud en «Resumen de la excursión» se mueve con él.',
  'help.guide.tour-map-overlays.title': 'Mostrar pistas o señales náuticas sobre el mapa',
  'help.guide.tour-map-overlays.tip.2':
    'El interruptor de pistas también está disponible sin ninguna excursión abierta, para que puedas ver una estación de esquí antes de planificar nada. En una caminata, la píldora ofrece en su lugar «Vías ferratas», con el número de rutas visibles.',
  'help.ctx.trip-tour-stages.bullet.5':
    'El más de la fila de una excursión, «Añadir al día», pone en el viaje una etapa por día a partir del día que elijas, o toda la excursión en ese único día.',
  'help.guide.tour-multi-day.step.6':
    'Para que vuelva a ser de un día, haz clic en «Un día» y confirma «¿Convertirla en una ruta de un día?» con «Quitar finales de etapa». La ruta no cambia.',
  'help.guide.tour-stages-on-days.step.1':
    'En «Excursiones de este viaje», pasa el cursor por la excursión de varios días y haz clic en el más, «Añadir al día».',
  'help.guide.tour-stages-on-days.tip.3':
    'Si arrastras una excursión de varios días a un día en la pestaña «Planificado», se te pregunta lo mismo en un cuadro, igual que con «Añadir al día» en la tarjeta de la excursión.',
  'help.ctx.trip-tour-hike.bullet.4':
    '«Detalles del sendero», bajo los puntos de ruta, muestra el grado SAC, el firme y el tipo de vía de cada tramo según OpenStreetMap, y colorea la ruta del mapa según ellos. Nada de esto modifica la excursión.',
  'help.guide.tour-hike-plan.step.4':
    '«Añadir punto» está activado desde el principio: haz clic en el mapa donde empieza la caminata y donde termina. «Lugares del viaje», al lado, te permite elegir en su lugar un refugio o un hotel del viaje. A partir de dos puntos, TREK calcula la ruta a pie.',
  'help.guide.tour-hike-trail-details.title': 'Ver grados, firmes y tipos de vía a lo largo de una caminata',
  'help.guide.tour-hike-trail-details.tip.1':
    'Los caminos sin valor en OpenStreetMap aparecen en «Desconocida», y desconocido no significa fácil. Si algunos indican «No se pudo consultar esta vez», haz clic en «Reintentar».',
  'help.guide.tour-hike-round.step.4':
    'Haz clic en un circuito para elegirlo. Su fila muestra la distancia, el desnivel y el tiempo, y cuánto se diferencia de la distancia que pediste.',
  'help.guide.tour-hike-compare-ways.step.1':
    'Pasa el cursor por la parada donde empieza el tramo, haz clic en «Más acciones» en su fila y elige «Comparar caminos del siguiente tramo».',
  'help.guide.tour-ferrata-add.title': 'Añadir una vía ferrata a una caminata',
  'help.guide.tour-ferrata-add.tip.1':
    'Una vía ferrata exige equipo y experiencia. La descripción emergente de la insignia indica qué parte de ella sube la ruta.',
  'help.guide.tour-run-plan.step.3':
    'Escribe tu «Ritmo previsto» en minutos y segundos por kilómetro, por ejemplo 7:30.',
  'help.guide.tour-run-ways.title': 'Ver por qué tipo de caminos va una carrera',
  'help.ctx.trip-tour-walk.title': 'Paseo urbano',
  'help.guide.tour-walk-plan.goal':
    'Crea un paseo turístico con paradas, indicando cuánto tiempo te quedas en cada una y cuáles son importantes.',
  'help.guide.tour-walk-plan.tip.2':
    'Un paseo urbano no tiene límite de senderismo ni campo «Pausas»: en su lugar se usan los tiempos de estancia.',
  'help.guide.tour-walk-sights.step.4':
    'Haz clic en un lugar de la lista. Su tarjeta se abre sobre el mapa: en «Dónde va», elige entre qué dos paradas se coloca.',
  'help.guide.tour-walk-day-times.step.1':
    'Pon el paseo en un día: en «Excursiones de este viaje», haz clic en el + redondo de su fila («Añadir al día») y elige el día.',
  'help.guide.tour-walk-day-times.result':
    'Puedes reordenar paradas o cambiar estancias hasta que todos los lugares estén abiertos cuando llegues.',
  'help.guide.tour-walk-google-import.tip.2':
    '«Usar otro enlace» te devuelve al campo del enlace. Al cargar se sustituyen los cambios sin guardar del planificador, y el cuadro te avisa antes.',
  'help.guide.tour-walk-check-off.step.4':
    'La parte superior de la lista cuenta las paradas visitadas y muestra el tiempo a pie que queda. «Deshacer» en una parada quita su marca.',
  'help.ctx.trip-tour-bike.bullet.2':
    'El «Resumen de la excursión» de la derecha muestra el «Tiempo en bici (estimado)», el tiempo que calcula el calculador para el perfil, con las subidas incluidas. Las pausas no se incluyen.',
  'help.guide.tour-bike-profile.step.4':
    'En «Puntos de ruta», haz clic en «Lugares del viaje» y elige el inicio y el final, aquí Hotel Alpenroyal y luego Hotel Greif. También puedes comprobar que «Añadir punto» está activado y hacer clic en el mapa. A partir de dos puntos, TREK calcula la ruta.',
  'help.guide.tour-bike-profile.tip.5':
    'Si un administrador permite el mapa CyclOSM, la fila de capas del mapa también ofrece «Bicicleta» mientras hay una ruta en bici abierta. Si deja de cargar, cambia a «Mapa». La excursión no cambia.',
  'help.guide.tour-bike-surfaces.tip.1':
    '«No consta en los datos» significa que OpenStreetMap no registra el firme en ese punto. El firme es desconocido, no necesariamente bueno.',
  'help.guide.tour-bike-mtb-grades.step.3': 'Haz clic en una fila de grado para resaltar esos senderos en el mapa.',
  'help.ctx.trip-tour-ski.bullet.1':
    'Lo primero es la «Disciplina», y no hay nada preseleccionado: «Alpino», Snowboard, «Esquí de fondo», «Esquí de travesía», «Raquetas» o «Ruta invernal». «Esquí de fondo» también pide la «Técnica»: «Clásica», Skating o «Desconocida». Sin disciplina, la excursión no se puede guardar.',
  'help.guide.tour-ski-plan.step.2': 'Abre «Tipo de ruta» y elige «Esquí e invierno».',
  'help.guide.tour-ski-plan.tip.4':
    'Donde no hay datos de pistas, el tramo es una línea recta entre sus puntos. Con raquetas o en una ruta invernal puede ir en su lugar por senderos de verano, y una nota gris en el tramo lo indica.',
  'help.guide.tour-ski-options.step.5':
    'En «Excluir», pulsa cada tipo de remonte que no quieras usar: «Telearrastres», «Telesillas abiertos», «Telecabinas», «Teleféricos» o «Funiculares y trenes». Los pulsados aparecen tachados.',
  'help.guide.tour-ski-fix-leg.step.2':
    'Haz clic en la solución que ofrece la fila: «Permitir pistas más difíciles», «Permitir este remonte», «Bajar en remonte», «Cambiar técnica» o «Cambiar disciplina». La opción cambia y el tramo se vuelve a planificar.',
  'help.guide.tour-ski-summary.goal':
    'Consulta cómo se reparte el día entre esquiar, remontes, esperas y tramos a pie.',
  'help.guide.tour-ski-summary.result':
    'Sabes cuánto tiempo pasarás en las pistas, en los remontes y esperando en ellos.',
  'help.guide.tour-ski-pistes-layer.tip.3':
    'La capa son datos cartográficos, no un parte en directo: no indica qué está abierto o pisado, ni cómo está la nieve, ni nada sobre aludes. El interruptor también está disponible sin ninguna excursión abierta, para que puedas ver una estación de esquí antes de planificar.',
  'help.guide.tour-ski-import.step.5':
    'Haz clic en el track en «Excursiones de este viaje» para abrirlo. Para corregir su disciplina más adelante, haz clic en Cambiar en su tarjeta «Ruta de esquí».',
  'help.ctx.trip-tour-paddle.bullet.1':
    'En «Tipo de ruta», «Ruta en piragua» pide un «Barco» (Kayak, «Canoa», SUP u «Otros») y el «Agua» («Río» o «Lago»). La excursión no se puede guardar hasta elegir los dos.',
  'help.guide.tour-paddle-setup.step.1':
    'En la pestaña «Excursiones», haz clic en «Planificar nueva excursión», arriba de la columna izquierda.',
  'help.guide.tour-paddle-setup.tip.2':
    'El mapa de una excursión de remo ofrece «Mapa» y «Satélite», y «Señales náuticas» de OpenSeaMap como capa superpuesta.',
  'help.guide.tour-paddle-water-route.step.3':
    'Elige «Planificar el siguiente tramo por el agua». TREK planifica el tramo por el río o el lago desde este punto hasta el siguiente.',
  'help.guide.tour-paddle-portage.title': 'Portear la embarcación para rodear un obstáculo',
  'help.guide.tour-paddle-portage.tip.2':
    'En el último punto, «Portear la embarcación desde aquí» se aplica cuando colocas el siguiente punto. La fila indica «Porteo desde aquí», y su cruz, «Al final no portear», lo deshace.',
  'help.guide.tour-paddle-lock.step.4':
    'Escribe los minutos de «Espera» y de «Tránsito». Cuando estén los dos, la tarjeta muestra su suma.',
  'help.guide.tour-paddle-time.step.2':
    'La franja muestra la ruta de principio a fin: el agua, los porteos en marrón y las esclusas como marcas. Los obstáculos de la ruta son marcas en las que puedes hacer clic para encontrarlos en el mapa.',
  'help.guide.tour-paddle-wind.title': 'Consultar el viento de un día de remo',
  'help.guide.tour-paddle-wind.tip.3':
    'En un día de viento con una travesía de lago, la tarjeta ofrece «Planificar cerca de la orilla», que planifica los lagos pegados a la orilla.',
  'help.guide.tour-paddle-checklist.step.4':
    'Haz clic en una entrada. El mapa se desplaza hasta ella: si es un obstáculo, se abre su tarjeta con tu decisión; si es un porteo o una esclusa tuyos, se selecciona su punto.',
  'help.guide.tour-paddle-track-marks.title': 'Marcar porteos y esclusas en un track de remo grabado',
  'help.guide.tour-paddle-track-marks.step.7': 'Abre las tarjetas, escribe sus minutos y haz clic en Guardar.',
  'help.ctx.trip-tour-horse.bullet.2':
    'Cada itinerario se abre en su propio cuadro: elige un tramo y el «Sentido» en que lo recorres, revisa el «Acceso a caballo» y haz clic en «Tomar tramo».',
  'help.guide.tour-horse-plan.step.3':
    'En la tarjeta «Rutas ecuestres», haz clic en «Buscar en la vista». Aparecen todos los itinerarios ecuestres señalizados de la zona visible, con su longitud en ella.',
  'help.guide.tour-horse-plan.tip.3':
    '¿Has movido el mapa después de buscar? El botón indica «Buscar en esta vista». Si la zona es demasiado grande, te pide que acerques el zoom primero.',
  'help.guide.tour-horse-gap.step.4':
    'En la tarjeta «Puntos de ruta», el tramo de unión indica «Manual, sin comprobar», con su longitud. Pasa el cursor por encima para ver por qué.',
  'help.guide.tour-horse-recorded.step.2':
    'Se abre la «Vista previa de la importación»; aún no se ha guardado nada. En «Importar como», pon «Tipo de ruta» en «Ruta a caballo». Tres insignias indican qué conserva la importación y qué no calcula.',
  'help.guide.dateless-trip.goal': 'Empieza a planificar antes de saber cuándo viajas.',
  'help.guide.trip-reminder.step.3': 'Haz clic en Actualizar.',
  'help.guide.upcoming-reservations.goal':
    'Consulta tus próximas reservas en todos tus viajes y abre el viaje al que pertenecen.',
  'help.guide.log-day.tip.3':
    'Un día marcado como festivo de empresa completo no se puede registrar. En un festivo de empresa de medio día, un día de vacaciones solo cuenta 0,5.',
  'help.guide.half-company-holiday.goal':
    'Dale a todo el mundo la tarde libre, por ejemplo en Nochebuena, sin cerrar el día entero.',
  'help.guide.public-holidays.tip.2': 'Pasa el cursor por un festivo de la cuadrícula para ver su nombre.',
  'help.guide.edit-holiday-calendar.step.3':
    'Cambia el país o la región en sus listas, o haz clic en la papelera para quitar el calendario.',
  'help.guide.person-color.step.2': 'Elige un color. Se guarda al momento y el cuadro se cierra.',
  'help.guide.answer-fusion-request.goal':
    'Decide si quieres unir tu plan de vacaciones con el de alguien que te ha invitado.',
  'help.guide.log-for-partner.goal':
    'Registra un día libre para una persona fusionada en tu plan, por ejemplo si te lo pide.',
  'help.guide.dissolve-fusion.goal': 'Vuelve a separar un plan fusionado en planes independientes.',
  'help.guide.country-places.step.1':
    'Busca un país que hayas visitado y elígelo. Su tarjeta aparece en el panel inferior.',
  'help.guide.tour-activity-stats.step.3':
    'Consulta las cifras: la distancia, con el número de excursiones en su esquina, y después «Desnivel positivo» y «Desnivel negativo». Con «Todos los tipos», aparecen a continuación los tres tipos que más has hecho, cada uno con su recuento y su distancia.',
  'help.guide.move-to-list.step.1':
    'Haz clic en el icono de la casilla, «Elegir», en la fila de filtros y marca los lugares.',
  'help.guide.tour-collection-add-to-trip.step.2':
    'En «Al viaje», elige el viaje. Los viajes a los que no puedes añadir excursiones aparecen atenuados.',
  'help.guide.tour-collection-manage.goal':
    'Consulta qué excursiones contiene una lista y de dónde proceden, y quita las que ya no necesites.',
  'help.guide.entry-draft.goal': 'Escribe una entrada ahora y ocúltala en la travesía compartida hasta que esté lista.',
  'help.guide.journey-map-layers.step.2':
    'Haz clic en la (i) al final de la barra para ver la leyenda del mapa: explica cada marcador, punto y línea.',
  'help.guide.journey-keep-route.step.2':
    'Comprueba la «Zona horaria del día», que determina dónde empieza y termina el día, y revisa la grabación: distancia, intervalo de horas, fragmentos y huecos.',
  'help.guide.journey-day-stays.step.2':
    'Haz clic en «Escribir una entrada de diario» en una estancia. La entrada se añade a ese día a la hora de llegada, con el nombre y la posición de la estancia.',
  'help.guide.journey-take-over-day.step.2':
    'Marca las estancias que quieras conservar y corrige sus nombres. «Unir en una entrada», entre dos estancias marcadas, las fusiona; «Mantener separadas» las vuelve a dividir.',
  'help.guide.journey-auto-prepare.step.1':
    'Haz clic en ⋯, arriba a la derecha de la cabecera, para abrir «Ajustes de la travesía».',
  'help.guide.photo-location.step.1':
    'Haz clic en ⋯, arriba a la derecha de la cabecera, para abrir «Ajustes de la travesía».',
  'help.guide.share-public.tip.3':
    'Los borradores nunca aparecen en el enlace, y las rutas grabadas solo se muestran en los días con alguna entrada publicada.',
  'help.ctx.settings-plugins.title': 'Plugins', // same-as-en
  'help.ctx.settings-about.bullet.2':
    '«Reportar un error» y «Solicitar función» abren el proyecto en GitHub; «Wiki» abre la documentación.',
  'help.guide.map-provider.tip.3':
    'En un mapa GL, haz clic con el botón derecho y arrastra para girarlo e inclinarlo; el clic central añade un lugar.',
  'help.guide.web-push-device.step.1':
    'En «Notificaciones push en este dispositivo», haz clic en «Activar en este dispositivo» y permite las notificaciones cuando lo pida el navegador. «Enviar prueba» comprueba que llegan.',
  'help.guide.connect-airtrail.title': 'Conectar tu AirTrail',
  'help.guide.connect-dawarich.title': 'Conectar tu Dawarich',
  'help.guide.tour-connect-wanderer.title': 'Conectar tu wanderer',
  'help.guide.tour-connect-wanderer.tip.3': '«Desconectar», a la derecha, vuelve a quitar el token.',
  'help.guide.tour-wanderer-watch.tip.3':
    'Los canales por los que recibes estos avisos se eligen en «Notificaciones», en la fila «wanderer: avisos sobre tus rutas».',
  'help.guide.plugin-settings.tip.1': 'Estos ajustes son solo tuyos; cada miembro configura el plugin por su cuenta.',
  'help.guide.offline-conflicts.step.3':
    'Los cambios que el servidor sigue rechazando aparecen en «Caché offline» como «Cambios fallidos»: «Reintentar» los vuelve a enviar y Descartar se queda con la versión del servidor.',
  'help.ctx.admin-notifications.bullet.4':
    '«Valores predeterminados para usuarios», abajo del todo: para cada evento y canal, activado, «Desactivado» o «Bloqueado» para todos los que no lo hayan cambiado.',
  'help.guide.default-user-settings.step.2':
    'Cada campo que configures muestra un enlace «restaurar» junto a su nombre, que recupera el valor predeterminado de TREK.',
  'help.guide.own-routing-engine.title': 'Usar tus propios servidores de rutas',
  'help.guide.admin-passkeys.result':
    'La página de inicio de sesión ofrece «Iniciar sesión con una passkey», y cada persona puede añadir passkeys en sus ajustes.',
  'help.guide.rotate-jwt-secret.goal': 'Cierra todas las sesiones si sospechas de una filtración.',
  'help.guide.notification-defaults.result':
    'Quienes no hayan cambiado una casilla empiezan con lo que elegiste, y las casillas bloqueadas aparecen con candado en sus ajustes.',
  'help.ctx.notifications.bullet.3':
    'Cada notificación indica quién hizo qué y dónde. Las no leídas tienen el fondo resaltado. Un botón debajo, como «Ver viaje» o «Ver Vacay», te lleva allí y la marca como leída.',
  'help.guide.read-notifications.tip.1':
    'La campana está en todas las pantallas que tienen barra de navegación, y su número se actualiza solo cuando llega algo nuevo.',
  'help.guide.filter-notifications.tip.1':
    'La página carga notificaciones más antiguas a medida que bajas, así que no se corta nada tras la primera pantalla.',
  'help.guide.mark-notifications-read.result':
    'Ninguna notificación tiene ya el fondo resaltado, y el número rojo de la campana desaparece.',
  'help.guide.notification-settings.title': 'Elegir de qué quieres recibir avisos',
  'help.guide.link-journal.step.1':
    'Haz clic en «Ajustes del viaje», junto al nombre del viaje, y elige «Diario» a la izquierda.',
  'help.guide.dawarich-stays.tip.1':
    'No se añade nada al viaje hasta que haces clic en «Añadir lugar». Un lugar añadido desde una estancia lo indica en sus detalles: «Añadido desde tus registros de Dawarich».',
  'help.guide.leave-stop-off-route.title': 'Excluir una parada de la ruta',
  'help.guide.move-booking-day.step.1':
    'Pasa el cursor por la fila de la reserva en el día: el asa de la izquierda indica que se puede arrastrar.',
  'help.guide.place-image-from-file.tip.1': 'Solo se ofrecen archivos JPG, PNG, GIF y WebP; un billete en PDF, no.',
  'help.guide.place-own-hours.step.4':
    'Los botones a la derecha de «Horario de apertura»: el de copiar aplica a todos los días el horario del lunes, y la X vuelve a quitar tu horario. Si TREK encontró un horario propio, «Tomar de los detalles del lugar» lo recupera.',
  'help.guide.confirm-stay-booking.step.2':
    'La reserva se abre sobre el plan. La primera píldora de su cabecera muestra su estado.',
  'help.ctx.trip-map.bullet.9':
    'Cada excursión del viaje es una línea de su color, con un marcador en su inicio. Haz clic en la línea para abrir la tarjeta de la excursión. En un día con excursión, la ruta del día llega hasta donde empieza la excursión y continúa desde donde termina. El ojo junto a una excursión en la lista de excursiones, «Ocultar en el mapa», quita su línea de tu mapa.',
  'help.guide.tour-map-lines.result':
    'En el mapa aparecen las excursiones que quieres, cada una con su color, y la que ocultaste aparece atenuada en la lista de excursiones.',
  'help.guide.car-stops.step.2':
    'Haz clic en la píldora de tipo de la cabecera y elige «Coche». El formulario cambia: «Fecha» y «Hora de inicio» pasan a ser «Recogida» y «Hora recogida», «Fecha fin» y «Hora de fin» pasan a ser «Devolución» y «Hora devolución», y aparece «Paradas por el camino» bajo «De» y «A».',
  'help.guide.transport-details.goal':
    'Consulta en un solo sitio todos los detalles de un trayecto, copia su código de reserva, cámbiale el nombre o ve a él en el mapa.',
  'help.guide.transport-details.tip.2':
    'Escape o un clic fuera de los detalles los cierra. Si está abierto «Renombrar» o la pregunta de eliminar, eso se cierra primero.',
  'help.guide.export-transports-csv.tip.1':
    'El icono solo aparece en la barra si la pestaña tiene al menos un trayecto.',
  'help.guide.group-sort-bookings.step.1':
    'En «Tarjetas» o «Lista», haz clic en «Opciones de vista», los controles deslizantes que hay después de los tres iconos de vista.',
  'help.guide.create-booking.tip.4':
    'Sin conexión, la reserva se guarda en este dispositivo y se sincroniza cuando vuelvas a estar en línea. Los archivos nuevos necesitan conexión, así que quítalos o guarda más tarde. Si haces clic fuera del formulario sin querer, o pulsas Escape, TREK pregunta «¿Descartar los cambios?» antes de que pierdas lo que has escrito.',
  'help.guide.booking-on-map.tip.2': 'Una estancia se abre en su primera noche.',
  'help.guide.export-bookings-csv.step.3':
    'Haz clic en «Exportar como hoja de cálculo (CSV)», el icono de hoja de cálculo después de «Opciones de vista».',
  'help.guide.arrange-packing-list.step.3':
    '«A a Z», en el extremo derecho de la fila con «Compartida» y «Mi lista», ordena los artículos de cada lista por nombre, para que veas rápidamente si algo ya está en ella. Vuelve a hacer clic para recuperar tu propio orden.',
  'help.guide.count-packed-pieces.step.1':
    'Haz clic en la insignia de cantidad de una fila, el pequeño número seguido de una x, escribe cuántas unidades llevas, por ejemplo 5, y pulsa Intro.',
  'help.guide.expense-receipts.step.3':
    'Haz clic en Guardar, al pie del cuadro. Los archivos se suben con el gasto y también aparecen en los «Archivos» del viaje.',
  'help.guide.files-sync-settings.step.1':
    'Haz clic en «Sincronización de documentos», en el extremo derecho de la barra. Si el viaje ya está vinculado, la tarjeta de tu almacenamiento se abre a la derecha; si tienes más de uno, haz clic en el que quieras en «Este viaje», a la izquierda.',
  'help.guide.files-sync-settings.tip.3':
    '«Actualizaciones instantáneas», un enlace con Copiar al lado, solo aparece en los almacenamientos en los que TREK no puede suscribirse a los cambios automáticamente. Pega el enlace en el almacenamiento y los cambios llegarán al momento en lugar de en la siguiente comprobación.',
  'help.guide.manage-notes.step.1':
    'Haz clic en los tres puntos de la cabecera de una tarjeta de nota («Más opciones»). El menú incluye «Expandir», «Fijar», Editar y Eliminar.',
  'help.guide.note-categories.title': 'Organizar las notas en categorías',
  'help.guide.note-categories.result':
    'Las notas muestran los nuevos nombres y colores, y la tarjeta «Notas» muestra solo la categoría elegida.',
  'help.guide.roadtrip-stops.tip.5':
    'Una parada con hora de fin en el plan del día dura hasta esa hora. Su cuadro indica cuándo sale el trayecto, y «Quitar la hora de fin» te permite volver a indicar tú la duración.',
  'help.guide.roadtrip-reorder.tip.2':
    'Los trayectos reservados y sus terminales se quedan donde los sitúa la reserva; solo se pueden arrastrar los lugares.',
  'help.guide.roadtrip-overnight.step.2':
    'Un hotel muestra un icono de cama en lugar del más. Haz clic en él, «Añadir como pernoctación», para abrir «Añadir como parada» para la noche. Un camping tiene el Añadir de siempre.',
  'help.guide.roadtrip-stop-fill.goal':
    'Asigna a una parada de repostaje o de carga su propio nivel de llenado, por ejemplo el 80 % en un cargador rápido o el 100 % por la noche.',
  'help.guide.roadtrip-bookings.goal':
    'Comprueba dónde encaja un trayecto reservado dentro de la ruta y a qué hora tienes que llegar.',
  'help.guide.roadtrip-bookings.tip.3':
    'Un trayecto que no está en ninguno de los días del viaje no forma parte de la ruta: una nota en la parte superior del carril lo indica, con «Abrir reserva» para ponerle fecha.',
  'help.guide.roadtrip-google-import.step.4': 'En «Día», elige el día al que van las paradas y haz clic en Importar.',
  'help.guide.roadtrip-hazards.step.2':
    'En «Alertas actuales», abajo de la columna derecha del cuadro, activa «Mostrar zonas de peligro» y haz clic en Cerrar.',
  'help.ctx.trip-tours.bullet.1':
    'El selector «Lugares» y «Excursiones», arriba de la columna derecha, cambia la lista de lugares por la de excursiones. Solo está disponible con el complemento «Excursiones» activado, y en ese caso las excursiones nunca aparecen en la lista de lugares.',
  'help.guide.tour-show-list.step.1':
    'En la pestaña «Planificado», haz clic en «Excursiones» en el selector de la parte superior de la columna derecha. La columna muestra ahora las excursiones en lugar de los lugares.',
  'help.guide.tour-show-list.result':
    'La columna derecha muestra las excursiones del viaje, y la que has elegido está abierta en su tarjeta.',
  'help.guide.tour-add-to-day.tip.1':
    'Si arrastras a un día una excursión con etapas, se te pregunta lo mismo en un pequeño cuadro. Cancelar deja el plan como estaba.',
  'help.guide.tour-day-times.step.2':
    'Indica el «Inicio» y deja «Fin» vacío. La línea bajo los campos muestra la hora de fin que calcula TREK: el inicio más la duración de la excursión.',
  'help.guide.tour-remove-from-day.title': 'Quitar una excursión de un día',
  'help.guide.tour-filter-list.title': 'Filtrar la lista de excursiones',
  'help.guide.tour-filter-list.tip.3':
    'Si no queda nada, la lista indica «Ninguna excursión coincide con estos filtros», y «Restablecer filtros» los quita todos. Los filtros solo cambian lo que muestra la lista, nunca una excursión ni un día.',
  'help.guide.tour-hide-on-map.tip.2':
    'El mapa del móvil siempre muestra todas las excursiones, y la pestaña «Excursiones» no tiene ojo: solo se pueden ocultar aquí, en la pestaña «Planificado».',
  'help.guide.tour-import-plan-tab.tip.2':
    'Lo importado se queda aquí en la lista y no se abre en un planificador. Ponlo en un día con su + redondo, o abre la pestaña «Excursiones» para verlo ahí.',
  'help.ctx.trip-tour-detail.bullet.5':
    'La tarjeta sirve para consultar la excursión y lo que la acompaña. La ruta en sí se cambia en la pestaña «Excursiones»: ábrela y haz clic en la excursión en «Excursiones de este viaje». Las excursiones también se eliminan ahí, no aquí.',
  'help.guide.tour-detail-read.step.6':
    'Sigue bajando para ver la «Descripción» y las «Notas», y después el «Origen»: «planificada en TREK», el archivo del que se importó o la ruta de wanderer de la que procede, con la fecha.',
  'help.guide.tour-rename-colour.title': 'Cambiar el nombre y el color de una excursión',
  'help.guide.tour-rename-colour.result':
    'La excursión muestra su nuevo nombre en todo el viaje, y su línea aparece con el color elegido.',
  'help.guide.tour-take-along.tip.3':
    'El archivo se descarga del servidor, así que hace falta conexión. Una excursión creada sin conexión se puede descargar en cuanto se haya sincronizado.',
  'help.guide.tour-copy-keep.step.4':
    'Elige la lista en «Colección», revisa el «Nombre en la colección» y haz clic en Guardar.',
  'help.guide.tour-packing-link.step.1':
    'Abre la tarjeta de la excursión y baja hasta «Lista de equipaje». Haz clic en «Vincular una lista de equipaje».',
  'help.guide.tour-packing-link.result':
    'Estás en la lista de equipaje de la pestaña «Listas», y la tarjeta de la excursión muestra cada artículo que marques.',
  'help.guide.tour-files.result': 'Los archivos quedan adjuntos a la excursión y se abren desde su tarjeta.',
  'help.guide.tour-activity-link.tip.1':
    'El plan no cambia. El track solo se vincula, y «Desvincular» quita el vínculo.',
  'help.guide.tour-activity-compare.step.3':
    'Haz clic en «Comparar en el mapa» para mostrar el track real con línea de puntos junto al plan. «Terminar la comparación» lo vuelve a quitar.',
  'help.guide.tour-origin-check.step.2':
    '«Importado» muestra el día en que se importó. «Aquí» muestra su estado actual: «Tal como se importó», «Editado en TREK» o «Replanificado, traza grabada conservada».',
  'help.ctx.trip-tour-planner.bullet.1':
    '«Excursiones» aparece en la barra de pestañas del viaje, justo después de «Planificado», si el complemento «Excursiones» está activado. La pestaña está disponible en ordenador y tableta; en el móvil, las excursiones se consultan y se ponen en días desde la pestaña «Planificado», pero no se dibujan.',
  'help.guide.tour-open-workspace.step.1':
    'Haz clic en «Excursiones» en la barra de pestañas del viaje, justo después de «Planificado». El mapa ocupa la pantalla, con un carril a cada lado.',
  'help.guide.tour-open-workspace.tip.2':
    'Suelta archivos GPX, KML o KMZ en cualquier parte de esta pestaña para importarlos como excursiones del viaje.',
  'help.guide.tour-draw-route.step.4':
    'Abajo del mapa aparece «Punto colocado». «Deshacer», al lado, vuelve a quitar el punto.',
  'help.guide.tour-type-profile.title': 'Elegir el tipo de excursión',
  'help.guide.tour-type-profile.result': 'La ruta de la excursión se calcula para el tipo y el perfil que has elegido.',
  'help.guide.tour-edit-points.step.6':
    '«Deshacer cambio de punto de paso» y «Rehacer cambio de punto de paso», arriba del carril, deshacen o rehacen cada cambio, uno a uno.',
  'help.guide.tour-shaping-points.step.3':
    'En «Puntos de ruta» aparece con la insignia «Punto de forma» y sin número, así que las paradas mantienen su numeración.',
  'help.guide.tour-loop-reverse.step.1':
    'Haz clic en «Volver al inicio» en la cabecera de la tarjeta «Puntos de ruta». La excursión recibe un último tramo de vuelta a su primer punto.',
  'help.guide.tour-leg-by-hand.goal':
    'Une dos puntos con una línea recta donde el calculador no encuentra camino, o vuelve a planificar un tramo.',
  'help.guide.tour-trip-places.title': 'Usar un lugar del viaje como parada',
  'help.guide.tour-trip-places.tip.3': 'Las demás excursiones del viaje nunca se ofrecen como parada.',
  'help.guide.tour-details-times.tip.1': 'Los tiempos se pueden escribir como 2:56, 2 h 56 o 176 minutos.',
  'help.guide.tour-save.step.3':
    'Haz clic en Guardar, abajo del carril izquierdo. Aparece «Excursión guardada», y el título del carril cambia a «Editar excursión».',
  'help.guide.tour-edit-saved.step.1':
    'Haz clic en la excursión en «Excursiones de este viaje». Se abre en el carril izquierdo como «Editar excursión», y el mapa muestra su ruta.',
  'help.guide.tour-summary-profile.title': 'Consultar el resumen de la excursión y el perfil de altitud',
  'help.guide.tour-summary-profile.tip.3':
    'Una excursión de remo no muestra altitudes, porque en el agua las únicas disponibles serían las de las orillas.',
  'help.guide.tour-list-manage.step.5':
    'Elige «Sin planificar» para ver las excursiones que aún no están en ningún día, o filtra por «Origen», «Límite de ruta» o «Tipo». Cada línea indica cuántas excursiones coinciden, y los totales se ajustan al filtro.',
  'help.guide.tour-delete.step.2':
    'Lee lo que se elimina con ella: la ruta, los puntos de ruta editables y las asignaciones a días. Haz clic en «Eliminar permanentemente».',
  'help.guide.tour-saved-elsewhere.step.2':
    '«Cargar la más reciente» sustituye tus cambios por la versión más reciente, tras pedir confirmación.',
  'help.ctx.trip-tour-import.bullet.1':
    'El + de la parte superior de «Excursiones de este viaje» es «Añadir ruta». Ofrece «Importar GPX o KML», «Importar paseo de Google Maps» y «Traer una ruta de otro viaje». También puedes soltar archivos en cualquier parte de la pestaña «Excursiones».',
  'help.guide.tour-import-gpx.step.2':
    'Elige «Importar GPX o KML» y selecciona uno o varios archivos .gpx, .kml o .kmz, de hasta 10 MB cada uno.',
  'help.guide.tour-import-gpx.tip.5':
    'Un archivo sin altitudes indica «Sin altitudes en el archivo». La línea y la distancia siguen siendo correctas, pero el desnivel positivo y el negativo quedan como desconocidos.',
  'help.guide.tour-view-import.tip.2':
    'El icono de descarga de la cabecera vuelve a guardarlo como archivo GPX, y el marcador lo guarda en una colección.',
  'help.guide.tour-plan-from-import.step.4':
    'La excursión se abre en el editor con sus puntos de ruta. Cámbiala si quieres y haz clic en Guardar, abajo de la columna.',
  'help.guide.tour-restore-recorded.step.1':
    'En «Excursiones de este viaje», haz clic en la excursión que replanificaste. La tarjeta «Track grabado» del editor indica que se conserva el track con el que se grabó.',
  'help.guide.tour-take-over.step.1':
    'Abre la pestaña «Excursiones» del viaje al que debe ir la excursión. Arriba de «Excursiones de este viaje», haz clic en el + («Añadir ruta»).',
  'help.guide.tour-take-over.tip.3':
    'Para traer una excursión hace falta conexión. Si el editor tiene cambios sin guardar, la copia se añade igualmente a la lista, pero no se abre, para que no pierdas lo que estás haciendo.',
  'help.guide.tour-import-wanderer.tip.1':
    'El botón aparece en cuanto wanderer está conectado en «Ajustes», «Integraciones». Hasta entonces, la lista ofrece «Conectar en los ajustes».',
  'help.ctx.trip-tour-map.bullet.2':
    'Después del separador de la píldora están los interruptores del tipo de excursión: «Colocar puntos» mientras editas una excursión, «Vías ferratas» en una caminata, «Señales náuticas» en una excursión de remo y las pistas en una excursión de esquí. 3D, al final, muestra la excursión sobre el relieve en 3D.',
  'help.guide.tour-map-layers.step.3':
    'En una caminata, haz clic en «Senderismo» para ver los senderos señalizados y sus números; en una ruta en bici aparece en su lugar «Bicicleta», con las rutas ciclistas. «Satélite» muestra imágenes aéreas, y «Mapa» te devuelve al mapa estándar.',
  'help.guide.tour-along-search.step.2':
    'Haz clic en «Qué buscar» y marca los tipos que quieras, hasta seis a la vez: «Miradores», «Cumbres», «Refugios y cobertizos», «Agua potable», «Comida» y más. La lista ofrece lo adecuado para el tipo de excursión, y cada excursión empieza con tres tipos marcados.',
  'help.guide.tour-along-add-stop.title': 'Añadir como parada un lugar a lo largo de la excursión',
  'help.guide.tour-along-add-stop.tip.2':
    'Un lugar que pasa a ser el nuevo final se marca con «Alarga la ruta»: el final anterior deja de serlo, y la excursión continúa hasta este lugar.',
  'help.guide.tour-3d-terrain.step.5': 'Vuelve a hacer clic en 3D para volver al mapa plano y seguir planificando.',
  'help.guide.tour-3d-flyover.step.2':
    'En «Velocidad», elige 1×, 2× o 4×. A 1×, la mayoría de las excursiones tardan unos 45 segundos de principio a fin.',
  'help.guide.tour-map-overlays.goal':
    'Muestra en el mapa las pistas de esquí y los remontes, o las boyas y las señales de puerto, mientras planificas una excursión de esquí o de remo.',
  'help.guide.tour-map-overlays.tip.3':
    'Si una capa deja de cargarse, su interruptor muestra un ! y una explicación; el mapa y tu ruta siguen funcionando sin ella.',
  'help.guide.tour-multi-day.title': 'Planificar una excursión de varios días',
  'help.guide.tour-multi-day.tip.1':
    '«Terminar etapa aquí» también funciona en una excursión de un día: la excursión pasa automáticamente a ser de varios días. La primera y la última parada, y los puntos de forma, no pueden terminar una etapa.',
  'help.guide.tour-stages-on-days.step.2': 'Elige el día en que empiezas la primera etapa.',
  'help.guide.tour-stages-on-days.tip.4':
    'En el plan del día, cada etapa aparece como «Etapa N» con su propia distancia y su propio tiempo. «Deshacer», encima de los días en la pestaña «Planificado», deshace todo el reparto de una vez.',
  'help.ctx.trip-tour-hike.bullet.5':
    'En una caminata, «Vías ferratas», en la fila de botones del mapa abajo a la izquierda, muestra las vías ferratas cercanas. La tarjeta de una vía ferrata la añade a la ruta como un tramo independiente.',
  'help.guide.tour-hike-plan.step.5':
    'En «Detalles», abre «Dificultad máxima del sendero» y elige hasta qué dificultad pueden llegar los senderos, de T1 («Senderismo») a T6 («Senderismo alpino difícil»). La ruta se vuelve a planificar dentro de ese límite.',
  'help.guide.tour-hike-trail-details.goal':
    'Consulta lo que registra OpenStreetMap sobre los caminos de una caminata y encuentra esos tramos en el mapa.',
  'help.guide.tour-hike-trail-details.tip.2':
    'Un grado superior al límite de la caminata muestra la insignia «Por encima del límite» en su fila.',
  'help.guide.tour-hike-round.step.5':
    'Haz clic en «Tomar esta ruta» y luego en «Sustituir» cuando se te pregunte si quieres reemplazar la ruta planificada.',
  'help.guide.tour-hike-compare-ways.step.2':
    '«Otros caminos para este tramo» se abre sobre el mapa con el «Camino actual» y «Camino A», «Camino B», etc. Cada uno aparece en el mapa con su color, y al pasar el cursor por una fila se resalta su línea.',
  'help.guide.tour-ferrata-add.goal': 'Encuentra las vías ferratas cercanas a tu caminata e incluye una en la ruta.',
  'help.guide.tour-ferrata-add.tip.2':
    'Las vías ferratas solo se ofrecen en las caminatas. Si la ruta ya pasa por una vía ferrata, su tarjeta muestra «Parte de la ruta» en lugar de «Añadir a la ruta».',
  'help.guide.tour-run-plan.step.4':
    'Indica el inicio y el final en el mapa, o elígelos con «Lugares del viaje». Bajo el ritmo verás el tiempo de carrera: la distancia por el ritmo.',
  'help.guide.tour-run-ways.goal':
    'Comprueba qué parte de una carrera no está asfaltada y lo difíciles que son sus senderos.',
  'help.ctx.trip-tour-walk.summary':
    'Una excursión a pie de parada en parada, planificada en la pestaña «Excursiones»: cuánto tiempo pasas en cada parada, cuáles son importantes, los lugares de interés del recorrido y a qué hora llegas a cada uno el día del paseo, comprobado con su horario de apertura.',
  'help.guide.tour-walk-plan.step.1':
    'Haz clic en «Planificar nueva excursión», arriba de la columna izquierda; luego abre «Tipo de ruta» y elige «Paseo urbano / turístico».',
  'help.guide.tour-walk-plan.tip.3':
    '«Desvincular del lugar», en «Más acciones» de una parada, solo deshace el vínculo con un lugar del viaje. El lugar sigue en el viaje.',
  'help.guide.tour-walk-sights.step.5':
    'Haz clic en «Añadir como parada». Un aviso indica cuánto se alarga el paseo, con «Deshacer» al lado.',
  'help.guide.tour-walk-day-times.step.2':
    'Ponle una hora de inicio ese día: en la pestaña «Planificado», haz clic con el botón derecho en el paseo dentro del día, elige Editar e introduce un «Inicio».',
  'help.guide.tour-walk-google-import.title': 'Convertir una ruta a pie de Google Maps en un paseo urbano',
  'help.guide.tour-walk-google-import.tip.3':
    'Solo se importan las paradas, no la línea dibujada en Google Maps. Un enlace corto maps.app.goo.gl necesita conexión para poder seguirse.',
  'help.guide.tour-walk-check-off.tip.1':
    'Las marcas se guardan por día: abre el paseo desde su día en el plan, no desde la lista de excursiones.',
  'help.ctx.trip-tour-bike.bullet.3':
    'La tarjeta «Firme y vías», bajo «Puntos de ruta», muestra por dónde va la ruta: los tipos de firme, los tipos de vía y la parte que se sabe sin asfaltar. Haz clic en una fila para resaltar sus tramos en el mapa.',
  'help.guide.tour-bike-profile.step.5':
    'Consulta el «Tiempo en bici (estimado)» en el «Resumen de la excursión», a la derecha. Pasa el cursor por su punto de información para ver cómo se calcula.',
  'help.guide.tour-bike-surfaces.title': 'Ver los tipos de firme de una ruta en bici',
  'help.guide.tour-bike-surfaces.tip.2':
    'Con el perfil «Carretera», un aviso encima de las barras indica qué distancia se sabe sin asfaltar. «Mostrar en el mapa» marca esos tramos.',
  'help.guide.tour-bike-mtb-grades.result':
    'El mapa marca los senderos del grado que elegiste, y sabes qué tramos de la excursión son los difíciles.',
  'help.ctx.trip-tour-ski.bullet.2':
    'Bajo la disciplina están las opciones del calculador de pistas, solo las que usa tu disciplina: «Pistas más difíciles», «Preferir», «Ritmo», interruptores como «Usar remontes», y «Excluir» para los tipos de remonte que no quieras usar. Cada cambio vuelve a planificar la excursión.',
  'help.guide.tour-ski-plan.step.3':
    'En «Disciplina», elige qué vas a hacer: «Alpino», Snowboard, «Esquí de fondo», «Esquí de travesía», «Raquetas» o «Ruta invernal». No hay nada preseleccionado, y la excursión no se puede guardar sin disciplina.',
  'help.guide.tour-ski-plan.result':
    'Una excursión de «Esquí e invierno» guardada en «Excursiones de este viaje», con sus tramos por las pistas, remontes y senderos cartografiados, y su tiempo calculado en el «Resumen de la excursión».',
  'help.guide.tour-ski-options.tip.1': 'Cada cambio vuelve a planificar la excursión, tramo a tramo.',
  'help.guide.tour-ski-fix-leg.step.3':
    'Si ninguna solución te sirve, haz clic en «Dibujar recto». El tramo pasa a ser una línea recta entre sus dos puntos.',
  'help.guide.tour-ski-summary.step.1':
    'Bajo los puntos de ruta, busca la tarjeta «Ruta por pistas». Haz clic en su título para plegarla o desplegarla.',
  'help.guide.tour-ski-pistes-layer.title': 'Mostrar las pistas en el mapa',
  'help.guide.tour-ski-pistes-layer.result': 'Las pistas aparecen bajo la excursión, y puedes interpretar sus colores.',
  'help.guide.tour-ski-import.step.6':
    'En «Clasificar ruta de esquí», elige la disciplina o la técnica correctas y haz clic en Guardar.',
  'help.ctx.trip-tour-paddle.bullet.2':
    'Cada punto muestra su función en una insignia: «Embarque», «Desembarque», «Reembarque» o «Desembarque final». Bajo cada punto ves lo que viene después: un tramo dibujado a mano, un porteo, una esclusa o el motivo por el que no se pudo planificar un tramo.',
  'help.guide.tour-paddle-setup.step.2':
    'Abre «Tipo de ruta» y elige «Ruta en piragua», «En el agua, en kayak, canoa o SUP».',
  'help.guide.tour-paddle-setup.tip.3':
    'En una excursión de remo, «A lo largo de la ruta» busca primero «Embarcaderos», «Alquiler de barcas» y «Agua potable».',
  'help.guide.tour-paddle-water-route.step.4':
    'Un tramo que TREK no ha podido planificar se pone en rojo y explica por qué, por ejemplo que aún no hay datos del agua para la zona. Haz clic en «Dibujar recto» para dibujarlo a mano de momento.',
  'help.guide.tour-paddle-portage.goal':
    'Marca un tramo en el que llevas la embarcación a cuestas, para que cuente como tierra, con tiempo para desembarcar y volver a embarcar.',
  'help.guide.tour-paddle-portage.tip.3':
    'El porteo se calcula a 2 km/h hasta que indiques tu propia «Velocidad de porteo» en la tarjeta «Estimación de tiempo».',
  'help.guide.tour-paddle-lock.tip.1':
    'TREK no conoce los horarios de las esclusas. Los tiempos son solo los que introduces, así que comprueba tú el horario de la esclusa.',
  'help.guide.tour-paddle-time.step.3':
    'La fila «Agua» es la distancia en el agua a tu «Velocidad de remo». Cambia la velocidad en el campo «Velocidad de remo», arriba de la columna.',
  'help.guide.tour-paddle-wind.goal': 'Consulta el viento previsto en el inicio de la excursión el día en que remas.',
  'help.guide.tour-paddle-wind.tip.4':
    'Que no haya un valor de previsión no significa que sea seguro. Comprueba las condiciones en el lugar.',
  'help.guide.tour-paddle-checklist.step.5':
    'Al pie de la columna, haz clic en «Remar tiene riesgos» para leer «Seguridad en el agua» antes de salir.',
  'help.guide.tour-paddle-track-marks.goal':
    'Importa un track de remo de tu reloj y añade dónde porteaste la embarcación y dónde pasaste por una esclusa.',
  'help.guide.tour-paddle-track-marks.tip.1':
    'Haz clic justo sobre el track: un clic demasiado lejos de la línea se rechaza, y la tarjeta te lo indica.',
  'help.ctx.trip-tour-horse.bullet.3':
    'Cada tramo es una insignia en la tarjeta «Puntos de ruta» con el nombre del itinerario, un punto que indica el acceso y su longitud. Un tramo que no cubre ningún itinerario ecuestre indica «Manual, sin comprobar».',
  'help.guide.tour-horse-plan.step.4':
    'Haz clic en un itinerario de la lista. Se abre en su propio mapa, con sus tramos numerados.',
  'help.guide.tour-horse-plan.tip.4':
    '«Deshacer cambio de punto de paso», en la cabecera de la columna izquierda, deshace un tramo entero de una vez.',
  'help.guide.tour-horse-gap.result':
    'La ruta ya no tiene huecos, y el tramo de unión queda marcado como dibujado a mano.',
  'help.guide.tour-horse-recorded.step.3': 'Haz clic en «Importar 1 excursión».',
  'help.guide.dissolve-fusion.step.3': 'Confirma con «Disolver» en la ventana que te lo pide.',
};

export default help;
