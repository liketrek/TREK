import type { TranslationStrings } from '../types';

// English fallback until 'es' is translated.
const help: TranslationStrings = {
  'help.title': 'Help & Docs',
  'help.search': 'Search docs…',
  'help.contents': 'Contents',
  'help.noResults': 'No matching pages.',
  'help.errorTitle': "Couldn't load this page",
  'help.errorBody': 'The help content is fetched from the TREK wiki. Check your connection and try again.',

  // center
  'help.center.button': 'Ayuda para esta pantalla',
  'help.center.title': 'Ayuda',
  'help.center.onThisScreen': 'En esta pantalla',
  'help.center.screens': 'Pantallas',
  'help.center.thisScreen': 'Esta pantalla',
  'help.center.subScreens': 'Subpantallas: {count}',
  'help.center.subScreensLabel': 'Subpantallas',
  'help.center.guidesCount': '{count} guías',
  'help.center.goToScreen': 'Ir a {screen}',
  'help.center.overview': 'Resumen',
  'help.center.howTo': 'Cómo puedo…',
  'help.center.searchPlaceholder': 'Buscar en guías y documentación…',
  'help.center.searchEmpty': 'No hay resultados para «{query}».',
  'help.center.searchGuides': 'Guías',
  'help.center.searchDocs': 'Documentación',
  'help.center.searchError': 'La búsqueda no está disponible ahora mismo.',
  'help.center.back': 'Atrás',
  'help.center.close': 'Cerrar la ayuda',
  'help.center.steps': '{count} pasos',
  'help.center.step': 'Paso {n}',
  'help.center.stepsLabel': 'Pasos',
  'help.center.stepOf': 'Paso {n} de {total}',
  'help.center.screenshot': 'Captura',
  'help.center.result': 'Lo que obtienes',
  'help.center.tips': 'Conviene saber',
  'help.center.related': 'Relacionado',
  'help.center.openDocs': 'Abrir en Ayuda y documentación',
  'help.center.docsSection': 'En la documentación',
  'help.center.noContext': 'Todavía no hay guía para esta pantalla.',
  'help.center.noContextHint': 'Busca en la documentación o cuéntanos qué buscabas.',
  'help.center.feedback': '¿Falta algo?',
  'help.center.feedbackLink': 'Cuéntanoslo en GitHub',
  'help.center.discord': 'Pregunta en Discord',
  'help.center.quick': 'Rápido',
  'help.center.guide': 'Guía',
  'help.center.tour': 'Recorrido',
  'help.center.imageAlt': 'Paso {n} de «{title}»',

  // ctx
  'help.ctx.dashboard.title': 'Panel',
  'help.ctx.dashboard.summary':
    'El panel es la puerta de entrada a todos tus viajes. La tarjeta de embarque de arriba destaca el viaje en curso o el siguiente, la fila de debajo cuenta lo que ya has viajado, y las tarjetas listan todo lo que planificas, has archivado o ya has terminado.',
  'help.ctx.dashboard.bullet.1':
    'Tarjeta de embarque: el viaje en curso o el siguiente, con sus fechas, viajeros, lugares y una cuenta atrás. Haz clic para abrir el viaje.',
  'help.ctx.dashboard.bullet.2':
    'Estadísticas: países visitados, viajes, días de viaje y distancia volada, sumando todos tus viajes.',
  'help.ctx.dashboard.bullet.3':
    'Tarjetas de viaje, filtradas por Planificados, Archivado y Completado, en cuadrícula o en lista. Pasa el ratón por una tarjeta para editar, duplicar, archivar y eliminar.',
  'help.ctx.dashboard.bullet.4':
    'Widgets a la derecha: conversor de divisas, relojes mundiales, próximas reservas y colecciones. Cada uno se puede desactivar.',
  'help.ctx.dashboard.bullet.5':
    'La tarjeta «Nuevo viaje» y el botón de la esquina inferior derecha inician un viaje nuevo.',

  // create-trip
  'help.guide.create-trip.title': 'Crear un viaje',
  'help.guide.create-trip.goal': 'Empezar un viaje nuevo con nombre, fechas y foto de portada.',
  'help.guide.create-trip.step.1':
    'Haz clic en «Nuevo viaje». La tarjeta al final de tus viajes y el botón de la esquina inferior derecha hacen lo mismo.',
  'help.guide.create-trip.step.2':
    'Ponle un nombre al viaje. Es el único campo obligatorio; todo lo demás se puede añadir después.',
  'help.guide.create-trip.step.3':
    'Elige fecha de inicio y de fin. TREK crea un día por fecha, así el itinerario queda listo para rellenar.',
  'help.guide.create-trip.step.4':
    'Opcional: añade una foto de portada. Sube la tuya, arrastra una o busca el destino en Unsplash.',
  'help.guide.create-trip.step.5': 'Haz clic en «Crear nuevo viaje».',
  'help.guide.create-trip.result':
    'El viaje aparece en tu panel. Si es el siguiente, ocupa la tarjeta de embarque de arriba.',
  'help.guide.create-trip.tip.1':
    'Las fechas se pueden cambiar más tarde. Si ya hay reservas, TREK pregunta si deben moverse junto con los días.',
  'help.guide.create-trip.tip.2':
    'La divisa del viaje que eliges aquí es a la que se convierte cada gasto. Elige la divisa del destino.',

  // edit-trip
  'help.guide.edit-trip.title': 'Editar un viaje',
  'help.guide.edit-trip.goal': 'Renombrar un viaje, cambiar sus fechas o ajustar su configuración.',
  'help.guide.edit-trip.step.1':
    'Pasa el ratón por la tarjeta del viaje (o la tarjeta de embarque) y haz clic en el lápiz.',
  'help.guide.edit-trip.step.2':
    'Cambia lo que necesites: nombre, descripción, fechas, portada, divisa, recordatorio o miembros.',
  'help.guide.edit-trip.step.3': 'Haz clic en «Actualizar».',
  'help.guide.edit-trip.result': 'La tarjeta se actualiza al momento, para todos los miembros del viaje.',
  'help.guide.edit-trip.tip.1':
    'Mover las fechas de un viaje que ya tiene reservas abre un segundo paso que pregunta si las reservas deben moverse también.',

  // cover-image
  'help.guide.cover-image.title': 'Poner una foto de portada',
  'help.guide.cover-image.goal': 'Darle al viaje una imagen que se vea en su tarjeta y en la tarjeta de embarque.',
  'help.guide.cover-image.step.1': 'Abre el formulario de edición del viaje con el lápiz de su tarjeta.',
  'help.guide.cover-image.step.2':
    'En «Imagen de portada», suelta una foto, haz clic para subir una o escribe un destino en la búsqueda de Unsplash.',
  'help.guide.cover-image.step.3': 'Elige una foto y haz clic en «Actualizar».',
  'help.guide.cover-image.result':
    'La foto se guarda con el viaje y se muestra en todos los sitios donde aparece el viaje.',
  'help.guide.cover-image.tip.1':
    'Las fotos de la búsqueda de Unsplash se acreditan automáticamente; tus propias subidas se quedan en tu servidor.',

  // duplicate-trip
  'help.guide.duplicate-trip.title': 'Duplicar un viaje',
  'help.guide.duplicate-trip.goal': 'Reutilizar un viaje como plantilla para uno nuevo.',
  'help.guide.duplicate-trip.step.1': 'Pasa el ratón por la tarjeta y haz clic en el icono de duplicar.',
  'help.guide.duplicate-trip.step.2': 'Lee qué se copiará y qué no, y confirma.',
  'help.guide.duplicate-trip.result': 'Aparece una copia junto al original, lista para renombrar y cambiar de fechas.',
  'help.guide.duplicate-trip.tip.1':
    'Se copian días, lugares, reservas, partidas del presupuesto, listas de equipaje y notas de día. No se copian miembros, chat, encuestas, archivos ni enlaces compartidos.',

  // archive-trip
  'help.guide.archive-trip.title': 'Archivar y restaurar un viaje',
  'help.guide.archive-trip.goal': 'Apartar un viaje sin borrarlo y recuperarlo más adelante.',
  'help.guide.archive-trip.step.1': 'Pasa el ratón por la tarjeta y haz clic en «Archivar».',
  'help.guide.archive-trip.step.2': 'Cambia el filtro de encima de las tarjetas a «Archivado» para volver a verlo.',
  'help.guide.archive-trip.step.3': 'Haz clic en «Restaurar» en la tarjeta para devolverlo a «Planificados».',
  'help.guide.archive-trip.result':
    'Los viajes archivados lo conservan todo. Solo dejan de ocupar el panel y el calendario de todos los viajes.',

  // delete-trip
  'help.guide.delete-trip.title': 'Eliminar un viaje',
  'help.guide.delete-trip.goal': 'Quitar un viaje para siempre.',
  'help.guide.delete-trip.step.1': 'Pasa el ratón por la tarjeta y haz clic en la papelera.',
  'help.guide.delete-trip.step.2': 'Confirma. El diálogo nombra el viaje para que sepas que es el correcto.',
  'help.guide.delete-trip.result':
    'El viaje, sus días, lugares, reservas y archivos desaparecen. No hay vuelta atrás; si dudas, archívalo.',

  // filter-and-view
  'help.guide.filter-and-view.title': 'Encontrar viajes completados, cambiar entre cuadrícula y lista',
  'help.guide.filter-and-view.goal': 'Ver viajes terminados o archivados y elegir la disposición que prefieras.',
  'help.guide.filter-and-view.step.1':
    'Usa «Planificados», «Archivado» y «Completado» encima de las tarjetas. Completado es todo viaje cuya fecha de fin ya pasó.',
  'help.guide.filter-and-view.step.2':
    'Haz clic en el icono de lista para pasar a una lista compacta; vuelve a hacer clic para la cuadrícula.',
  'help.guide.filter-and-view.result': 'El panel recuerda tu disposición en este dispositivo.',

  // calendar-feed
  'help.guide.calendar-feed.title': 'Suscribirte a todos los viajes en tu calendario',
  'help.guide.calendar-feed.goal':
    'Ver los días y las reservas de cada viaje activo en tu app de calendario, siempre sincronizados.',
  'help.guide.calendar-feed.step.1': 'Haz clic en el icono de calendario junto al selector de vista.',
  'help.guide.calendar-feed.step.2':
    'Haz clic en «Enable calendar subscription». TREK genera un enlace privado del feed.',
  'help.guide.calendar-feed.step.3':
    'Añade el feed con uno de los botones (Google, Apple, Outlook) o copia el enlace en cualquier app de calendario que se suscriba a URL.',
  'help.guide.calendar-feed.result':
    'Cada viaje activo aparece en tu calendario y se actualiza solo. Quedan fuera los viajes archivados y los que terminaron hace más de 90 días.',
  'help.guide.calendar-feed.tip.1':
    'El enlace es secreto. Quien lo tenga puede leer el feed; revócalo desde el mismo diálogo si se filtra.',

  // widgets
  'help.guide.widgets.title': 'Elegir los widgets del panel',
  'help.guide.widgets.goal': 'Mostrar u ocultar la fila de estadísticas y los widgets de la derecha.',
  'help.guide.widgets.step.1': 'Abre el menú de tu avatar arriba a la derecha y elige «Ajustes».',
  'help.guide.widgets.step.2': 'Cambia a la pestaña «Appearance».',
  'help.guide.widgets.step.3':
    'En «Dashboard widgets», activa o desactiva cada widget. Escritorio y móvil se configuran por separado.',
  'help.guide.widgets.step.4': 'Vuelve al panel. El cambio se aplica al instante.',
  'help.guide.widgets.result':
    'Los widgets ocultos dejan sitio a tus viajes; desactiva toda la columna derecha para centrar la disposición.',
  'help.guide.widgets.link': 'Abrir los ajustes de apariencia',

  // currency-widget
  'help.guide.currency-widget.title': 'Convertir divisas',
  'help.guide.currency-widget.goal': 'Convertir un importe entre dos divisas con tipos actuales.',
  'help.guide.currency-widget.step.1': 'Escribe el importe y elige las dos divisas.',
  'help.guide.currency-widget.step.2':
    'La flecha entre ambas intercambia el par; la flecha circular actualiza el tipo de cambio.',
  'help.guide.currency-widget.result':
    'Tu par de divisas se recuerda en tu cuenta, así que es el mismo en todos tus dispositivos.',
  'help.guide.currency-widget.tip.1': 'Los tipos vienen del Banco Central Europeo y se actualizan una vez al día.',

  // timezones-widget
  'help.guide.timezones-widget.title': 'Añadir relojes mundiales',
  'help.guide.timezones-widget.goal': 'Tener a la vista la hora local de tus destinos.',
  'help.guide.timezones-widget.step.1': 'Haz clic en + en el widget «Zonas horarias» y busca una ciudad.',
  'help.guide.timezones-widget.step.2': 'Quita un reloj con la × de al lado.',
  'help.guide.timezones-widget.result': 'Tus relojes se guardan con tu cuenta.',

  // ── Screen: vacay ──────────────────────────────────────────────────────────
  'help.ctx.vacay.title': 'Vacay',
  'help.ctx.vacay.summary':
    'Vacay es tu planificador personal de vacaciones: cuántos días tienes al año, cuáles has registrado y cuántos quedan. La cuadrícula muestra el año entero de un vistazo; la barra lateral reúne el selector de año, las personas con las que planificas, los calendarios compartidos contigo, la leyenda y tu saldo.',
  'help.ctx.vacay.bullet.1':
    'Cuadrícula anual: doce tarjetas de mes, una celda por día. Haz clic en un día para registrarlo o borrarlo. Un puntito azul marca los días que ya cubre un viaje.',
  'help.ctx.vacay.bullet.2':
    'Barra inferior: modo Vacaciones o Festivo de empresa, más los interruptores Medio día y Compensación que cambian lo que registra un clic.',
  'help.ctx.vacay.bullet.3':
    'Derecho: tus días del año, cuántos has usado y cuántos quedan, con el arrastre del periodo anterior.',
  'help.ctx.vacay.bullet.4':
    'Personas son quienes se han fusionado con tu plan, cada una con su color. Calendarios compartidos son anillos de solo lectura con los días libres de otros.',
  'help.ctx.vacay.bullet.5':
    'Los ajustes cubren fines de semana, inicio de semana, arrastre, tu año de vacaciones, festivos de empresa y calendarios de festivos o vacaciones escolares.',
  // log-day
  'help.guide.log-day.title': 'Registrar un día de vacaciones',
  'help.guide.log-day.goal': 'Marcar un día libre en la cuadrícula y ver cómo el saldo lo sigue.',
  'help.guide.log-day.step.1':
    'Mira la barra inferior: el botón de la izquierda, con tu color, significa que un clic registra un día de vacaciones para ti.',
  'help.guide.log-day.step.2':
    'Haz clic en un día de cualquier tarjeta de mes. Se rellena con tu color y Usados cuenta un día más.',
  'help.guide.log-day.step.3': 'Vuelve a hacer clic en el mismo día para borrarlo.',
  'help.guide.log-day.result':
    'El día queda registrado, Días, Usados y Restantes se actualizan al instante, y quien esté fusionado con tu plan lo ve en directo.',
  'help.guide.log-day.tip.1':
    'Los fines de semana no se pueden registrar mientras Bloquear fines de semana esté activado en Ajustes.',
  'help.guide.log-day.tip.2':
    'Un punto azul en una celda significa que uno de tus viajes cubre ese día, así ves dónde coinciden vacaciones y viajes.',
  // half-day
  'help.guide.half-day.title': 'Registrar medio día',
  'help.guide.half-day.goal': 'Tomarte una tarde sin gastar un día entero de saldo.',
  'help.guide.half-day.step.1':
    'Activa Medio día en la barra. Su punto naranja es la marca que recibe un medio día en la cuadrícula.',
  'help.guide.half-day.step.2': 'Haz clic en un día. Se registra como 0,5 y lleva el punto naranja en la esquina.',
  'help.guide.half-day.step.3':
    'Desactiva Medio día cuando termines; hacer clic en un medio día con otros ajustes lo convierte en el sitio.',
  'help.guide.half-day.result':
    'Usados crece 0,5. Medio día y Compensación son independientes, así que también cabe medio día de compensación.',
  'help.guide.half-day.tip.1':
    'La barra siempre muestra la marca que pondrá tu próximo clic, para comprobarlo antes de registrar.',
  // comp-day
  'help.guide.comp-day.title': 'Registrar compensación o flex',
  'help.guide.comp-day.goal': 'Tomar tiempo compensatorio que no cuesta días de vacaciones.',
  'help.guide.comp-day.step.1':
    'Activa Compensación en la barra. El disco rayado es el aspecto de un día de compensación en la cuadrícula.',
  'help.guide.comp-day.step.2':
    'Haz clic en un día. Se rellena con rayas diagonales de tu color en vez de un bloque sólido.',
  'help.guide.comp-day.result':
    'Los días de compensación se cuentan junto a las tarjetas de saldo y nunca reducen Restantes.',
  'help.guide.comp-day.tip.1':
    'Horas extra recuperadas, flextime, un día compensatorio: todo lo que es libre pero no vacaciones va aquí.',
  // entitlement
  'help.guide.entitlement.title': 'Definir tu saldo de vacaciones',
  'help.guide.entitlement.goal': 'Decirle a Vacay cuántos días de vacaciones tienes al año.',
  'help.guide.entitlement.step.1': 'En la barra lateral, haz clic en la tarjeta Días bajo Derecho.',
  'help.guide.entitlement.step.2': 'Escribe tu número de días y pulsa Intro.',
  'help.guide.entitlement.result':
    'Restantes se recalcula a partir de tu saldo, el arrastre si lo hay y los días usados.',
  'help.guide.entitlement.tip.1':
    'Cada año tiene su propio saldo, así que un cambio aquí solo afecta al año seleccionado.',
  // years
  'help.guide.years.title': 'Añadir años y cambiar entre ellos',
  'help.guide.years.goal': 'Planificar ya el año que viene, o repasar el anterior.',
  'help.guide.years.step.1':
    'Haz clic en el + a la derecha del año para añadir el siguiente, o en el + de la izquierda para el anterior.',
  'help.guide.years.step.2': 'Cambia de año con las flechas o con las fichas de año de debajo.',
  'help.guide.years.step.3':
    'Para quitar un año, pasa el ratón por su ficha y haz clic en el pequeño menos. Sus entradas se van con él, así que confirma con cuidado.',
  'help.guide.years.result': 'Cada año conserva su propio saldo y sus entradas; el arrastre los enlaza.',
  // company-holidays
  'help.guide.company-holidays.title': 'Marcar festivos de empresa',
  'help.guide.company-holidays.goal': 'Bloquear los días en que toda la empresa cierra sin gastar el saldo de nadie.',
  'help.guide.company-holidays.step.1':
    'Abre Ajustes y comprueba que Festivos de empresa está activado. Lo está por defecto; la barra solo ofrece el modo mientras lo esté.',
  'help.guide.company-holidays.step.2': 'De vuelta en la cuadrícula, pon la barra en modo Festivo de empresa.',
  'help.guide.company-holidays.step.3': 'Haz clic en los días. Se vuelven ámbar y aparecen en la leyenda.',
  'help.guide.company-holidays.result':
    'Los festivos de empresa los ve todo el que esté fusionado con el plan y nunca reducen Restantes.',
  'help.guide.company-holidays.tip.1':
    'Cualquier persona fusionada puede editar los festivos de empresa, así que acordad quién las mantiene.',
  // public-holidays
  'help.guide.public-holidays.title': 'Mostrar festivos',
  'help.guide.public-holidays.goal': 'Poner en la cuadrícula los festivos de tu país o región.',
  'help.guide.public-holidays.step.1': 'Abre Ajustes y activa Festivos.',
  'help.guide.public-holidays.step.2':
    'Haz clic en Añadir calendario, elige el país y, cuando importe, la región. Dale un color y una etiqueta si quieres.',
  'help.guide.public-holidays.step.3': 'Cierra Ajustes. Los festivos aparecen en la cuadrícula y en la leyenda.',
  'help.guide.public-holidays.result':
    'Los festivos se marcan con el color del calendario y nunca cuentan contra tu saldo.',
  'help.guide.public-holidays.tip.1':
    'Puedes añadir varios calendarios, por ejemplo tu región y la de un compañero fusionado.',
  // school-holidays
  'help.guide.school-holidays.title': 'Mostrar vacaciones escolares',
  'help.guide.school-holidays.goal': 'Ver las vacaciones escolares de tu región junto a tus propios días libres.',
  'help.guide.school-holidays.step.1': 'Abre Ajustes y activa School Holidays.',
  'help.guide.school-holidays.step.2':
    'Haz clic en Añadir calendario y elige el país. Si un país divide su calendario, elige también la región o el grupo.',
  'help.guide.school-holidays.step.3':
    'Cierra Ajustes. Cada periodo recibe una banda de color en la parte baja de sus días.',
  'help.guide.school-holidays.result':
    'Las vacaciones escolares son puramente visuales: nunca reducen el saldo de nadie.',
  'help.guide.school-holidays.tip.1':
    '¿Falta tu región? Tu administrador puede mantener las vacaciones escolares a mano en Admin, Personalización, Vacaciones escolares.',
  // weekends
  'help.guide.weekends.title': 'Bloquear fines de semana y fijar el inicio de semana',
  'help.guide.weekends.goal':
    'Dejar los fines de semana fuera del cómputo y empezar la semana el día al que estás acostumbrado.',
  'help.guide.weekends.step.1': 'Abre Ajustes.',
  'help.guide.weekends.step.2': 'Activa Bloquear fines de semana y elige qué días cuentan como tu fin de semana.',
  'help.guide.weekends.step.3': 'En La semana comienza el, elige lunes o domingo.',
  'help.guide.weekends.result':
    'Los días bloqueados aparecen en gris en la cuadrícula y no se pueden registrar por error.',
  // leave-year
  'help.guide.leave-year.title': 'Definir tu año de vacaciones',
  'help.guide.leave-year.goal':
    'Contar tu saldo por año fiscal o desde tu fecha de contratación en vez de enero a diciembre.',
  'help.guide.leave-year.step.1': 'Abre Ajustes y busca Año de vacaciones.',
  'help.guide.leave-year.step.2':
    'Elige Año natural, Año fiscal (con el mes y el día en que empieza) o Fecha de alta (con la fecha en que te contrataron).',
  'help.guide.leave-year.result':
    'Saldo, días usados y arrastre siguen ese periodo, y la cuadrícula empieza por su primer mes.',
  'help.guide.leave-year.tip.1':
    'Este ajuste es personal: en un plan fusionado cada uno conserva su propio año de vacaciones y sus cifras.',
  // carry-over
  'help.guide.carry-over.title': 'Arrastrar los días no usados',
  'help.guide.carry-over.goal': 'Sumar lo que sobra al final de un periodo al siguiente.',
  'help.guide.carry-over.step.1': 'Abre Ajustes.',
  'help.guide.carry-over.step.2': 'Activa Arrastrar saldo.',
  'help.guide.carry-over.result': 'La cantidad arrastrada se recalcula en todos tus años y se muestra bajo el saldo.',
  'help.guide.carry-over.tip.1': 'Desactivarlo pone todos los saldos de arrastre a cero.',
  // invite
  'help.guide.invite.title': 'Planificar junto a alguien',
  'help.guide.invite.goal':
    'Fusionar tu plan con otro usuario de TREK para ver los días libres de ambos en una sola cuadrícula.',
  'help.guide.invite.step.1': 'Haz clic en el icono de persona del panel Personas.',
  'help.guide.invite.step.2': 'Elige al usuario y envía la invitación.',
  'help.guide.invite.step.3': 'Recibe una notificación y acepta. Hasta entonces la invitación aparece como pendiente.',
  'help.guide.invite.result':
    'Ambos planes se fusionan: cada persona tiene un color, podéis registrar días el uno para el otro y todo se sincroniza en directo.',
  'help.guide.invite.tip.1':
    'Para deshacer una fusión, usa Disolver en Ajustes. Las entradas de cada uno vuelven a su propio plan.',
  'help.guide.invite.tip.2': 'Si la otra persona solo debe ver tus días, comparte tu calendario en vez de fusionar.',
  // share-calendar
  'help.guide.share-calendar.title': 'Compartir tu calendario en solo lectura',
  'help.guide.share-calendar.goal': 'Dejar que alguien vea cuándo estás libre sin darle voz en tu plan.',
  'help.guide.share-calendar.step.1': 'Haz clic en el icono de compartir del panel Calendarios compartidos.',
  'help.guide.share-calendar.step.2': 'Elige al usuario y haz clic en Compartir. No hace falta aceptación.',
  'help.guide.share-calendar.step.3':
    'Los calendarios compartidos contigo aparecen en el mismo panel; el ojo oculta uno, Dejar de compartir revoca el tuyo.',
  'help.guide.share-calendar.result':
    'Tus días libres aparecen como un anillo de color en su cuadrícula. Nada de lo que compartes puede editarse desde allí.',
  'help.guide.share-calendar.tip.1':
    'Compartir y fusionar son independientes: puedes estar fusionado con una persona y compartir con otras.',
  'help.guide.share-calendar.tip.2': 'Pasa el ratón por un día con anillo para ver quién está libre y cuánto tiempo.',

  // ── Screen: atlas ─────────────────────────────────────────────────────────────────────
  'help.ctx.atlas.title': 'Atlas',
  'help.ctx.atlas.summary':
    'El Atlas es tu huella viajera en un mapa del mundo: cada país al que te ha llevado un viaje está coloreado, y los que visitaste antes de TREK los añades a mano. Acerca el zoom para ver regiones, lleva una lista de deseos de lugares que aún quieres ver y lee tus cifras en el panel de cristal de abajo.',
  'help.ctx.atlas.bullet.1':
    'El mapa: los países visitados llevan un color que es suyo, los planificados tienen contorno discontinuo, los de la lista de deseos un rayado diagonal y todo lo demás es gris. Pasa el ratón por un país para ver sus viajes, lugares y primera y última visita.',
  'help.ctx.atlas.bullet.2':
    'Búsqueda arriba: escribe un país o un lugar. Elegir un país vuela hasta él y abre su ventana; elegir un lugar aterriza en su región para que puedas marcarla.',
  'help.ctx.atlas.bullet.3':
    'Mostrar países planeados, arriba a la derecha: revela los países de tus próximos viajes. El interruptor solo aparece mientras tengas alguno.',
  'help.ctx.atlas.bullet.4':
    'Panel de abajo: la pestaña Estadísticas con países, viajes, lugares, ciudades, días, continentes y tu racha; la pestaña Lista de deseos con lo que aún te espera.',
  'help.ctx.atlas.bullet.5':
    'Regiones: a partir del nivel de zoom 5 el mapa pasa a estados y provincias, cada uno clicable para marcarlo o quitarlo.',
  'help.ctx.atlas.bullet.6':
    'Dawarich: con el addon conectado, un panel a la izquierda de las estadísticas tacha deseos y añade países desde tus registros, nunca sin tu confirmación.',
  // mark-country
  'help.guide.mark-country.title': 'Marcar un país como visitado',
  'help.guide.mark-country.goal':
    'Añade un país en el que estuviste antes de TREK, para que el mapa y tu recuento lo incluyan.',
  'help.guide.mark-country.step.1': 'Escribe el país en el cuadro de búsqueda de la parte superior del mapa.',
  'help.guide.mark-country.step.2':
    'Elígelo de la lista. El mapa vuela hasta allí y se abre una ventana para ese país.',
  'help.guide.mark-country.step.3': 'Elige Marcar como visitado.',
  'help.guide.mark-country.result':
    'El país toma su color en el mapa y Países cuenta uno más. Ese color es permanente: marcar más países nunca reordena el resto.',
  'help.guide.mark-country.tip.1':
    'Hacer clic en un país gris del mapa abre la misma ventana; la búsqueda es el camino seguro para países pequeños.',
  'help.guide.mark-country.tip.2':
    'Un país marcado a mano siempre cuenta como visitado, sean cuales sean las fechas de cualquier viaje allí.',
  // unmark-country
  'help.guide.unmark-country.title': 'Quitar un país que marcaste',
  'help.guide.unmark-country.goal': 'Vuelve a quitar del mapa un país marcado a mano.',
  'help.guide.unmark-country.step.1':
    'Busca el país y elígelo, o haz clic en él en el mapa. Para un país que marcaste tú, la ventana pregunta si quitarlo.',
  'help.guide.unmark-country.step.2': 'Confirma con Eliminar.',
  'help.guide.unmark-country.result': 'El país vuelve a gris y sale de tu recuento.',
  'help.guide.unmark-country.tip.1':
    'Solo los países marcados a mano se quitan así. Un país con viajes o lugares se queda mientras los tenga; Eliminar también está en su tarjeta de detalle del panel cuando se marcó a mano.',
  // country-details
  'help.guide.country-details.title': 'Ver qué hiciste en un país',
  'help.guide.country-details.goal': 'Abre un país visitado y salta a los viajes que te llevaron allí.',
  'help.guide.country-details.step.1': 'Busca un país que hayas visitado.',
  'help.guide.country-details.step.2':
    'Elígelo. El mapa vuela hasta allí y el panel de abajo añade una tarjeta con su bandera, lugares, viajes y un chip por viaje.',
  'help.guide.country-details.result': 'Haz clic en un chip de viaje para abrir ese viaje en el planificador.',
  'help.guide.country-details.tip.1':
    'Pasar el ratón por el país en el mapa muestra las mismas cifras más la primera y la última visita.',
  // planned-countries
  'help.guide.planned-countries.title': 'Mostrar los países a los que vas',
  'help.guide.planned-countries.goal': 'Lleva al mapa los países de tus próximos viajes sin contarlos como visitados.',
  'help.guide.planned-countries.step.1':
    'Activa Mostrar países planeados, arriba a la derecha. El número de al lado dice cuántos esperan.',
  'help.guide.planned-countries.step.2':
    'Busca un país planificado y elígelo: el panel dice Planeado y el tooltip del mapa muestra cuándo vas.',
  'help.guide.planned-countries.result':
    'Los países planificados aparecen con contorno discontinuo, para que nunca parezcan un sitio donde ya estuviste. El interruptor recuerda tu elección.',
  'help.guide.planned-countries.tip.1':
    'Un país cuenta como visitado en cuanto el viaje allí ha empezado; un viaje en curso también cuenta. Los viajes sin fechas quedan completamente fuera de las estadísticas.',
  'help.guide.planned-countries.tip.2': 'El interruptor solo existe mientras tengas viajes próximos.',
  // regions
  'help.guide.regions.title': 'Marcar una región',
  'help.guide.regions.goal': 'Más fino que países: marca los estados, provincias o prefecturas en los que has estado.',
  'help.guide.regions.step.1':
    'Acerca el zoom a un país hasta que aparezcan sus regiones, desde el nivel de zoom 5. Buscar el país y elegirlo te acerca lo suficiente.',
  'help.guide.regions.step.2':
    'Haz clic en una región. Al pasar el ratón sale su nombre; la ventana muestra la región y su país.',
  'help.guide.regions.step.3': 'Elige Marcar como visitado.',
  'help.guide.regions.result':
    'La región se rellena con el color del país. Marcar una región también cuenta el país como visitado si aún no lo estaba.',
  'help.guide.regions.tip.1':
    'Hacer clic en una región visitada ofrece Eliminar, la hayas marcado tú o la haya puesto ahí un lugar.',
  'help.guide.regions.tip.2':
    'Las regiones en las que tienes lugares reales se marcan por ti; ahí no hay nada que hacer.',
  // search-place
  'help.guide.search-place.title': 'Encontrar un lugar y marcar su región',
  'help.guide.search-place.goal': 'Marca Baviera buscando Múnich, sin saber en qué región está una ciudad.',
  'help.guide.search-place.step.1':
    'Escribe una ciudad, un monumento o una dirección en el cuadro de búsqueda. Los países van primero; los lugares que coinciden aparecen debajo, bajo Lugares.',
  'help.guide.search-place.step.2': 'Elige el lugar. El mapa vuela hasta allí y averigua en qué región está el punto.',
  'help.guide.search-place.step.3':
    'Elige Marcar como visitado para esa región, o Añadir a lista de deseos si aún te espera.',
  'help.guide.search-place.result':
    'La región queda marcada, y con ella el país. Los países sin datos de regiones en el paquete de mapas recurren al país en sí.',
  'help.guide.search-place.tip.1':
    'Los lugares vienen de la misma búsqueda que en todo TREK, así que siguen al proveedor que configuró tu admin.',
  // bucket-country
  'help.guide.bucket-country.title': 'Poner un país en la lista de deseos',
  'help.guide.bucket-country.goal':
    'Lleva una lista de deseos de países directamente en el mapa, aparte de los que ya visitaste.',
  'help.guide.bucket-country.step.1': 'Busca el país y elígelo, o haz clic en él en el mapa.',
  'help.guide.bucket-country.step.2': 'Elige Añadir a lista de deseos.',
  'help.guide.bucket-country.step.3': 'Elige mes y año si ya sabes cuándo, y confirma con Añadir a lista de deseos.',
  'help.guide.bucket-country.result':
    'El país se dibuja con rayado diagonal en el color que llevará cuando llegues, y aparece en la pestaña Lista de deseos del panel.',
  'help.guide.bucket-country.tip.1':
    'La misma ventana ofrece Quitar de la lista de deseos una vez que el país está en la lista.',
  'help.guide.bucket-country.tip.2':
    'Una entrada por fecha objetivo: el mismo país puede estar en la lista para dos meses distintos, pero no dos veces para el mismo.',
  // bucket-place
  'help.guide.bucket-place.title': 'Añadir un lugar a la lista de deseos',
  'help.guide.bucket-place.goal':
    'Guarda una ciudad, un monumento o una dirección con la que sueñas, con coordenadas y fecha objetivo.',
  'help.guide.bucket-place.step.1': 'Abre la pestaña Lista de deseos en el panel de abajo.',
  'help.guide.bucket-place.step.2': 'Haz clic en Añadir lugar.',
  'help.guide.bucket-place.step.3':
    'Escribe el nombre y pulsa el botón de búsqueda; elige la coincidencia para que el lugar tenga coordenadas. Escribir solo un nombre y saltarte la búsqueda también funciona.',
  'help.guide.bucket-place.step.4': 'Elige mes y año si quieres y haz clic en Añadir.',
  'help.guide.bucket-place.result':
    'El lugar queda arriba de tu lista de deseos con su fecha objetivo; la × de al lado lo quita de nuevo.',
  'help.guide.bucket-place.tip.1':
    'Un deseo con coordenadas es lo que Dawarich puede tachar por ti más tarde, cuando tus registros muestren que estuviste allí.',
  // stats
  'help.guide.stats.title': 'Leer tus estadísticas',
  'help.guide.stats.goal': 'Saber qué cuentan las cifras del panel, y qué no.',
  'help.guide.stats.step.1':
    'Países es el número de países distintos en los que has estado de verdad; los planificados se muestran al lado, no dentro. Viajes, Lugares y Días son totales de todos tus viajes. Ciudades se deduce de las direcciones de tus lugares, así que es una estimación.',
  'help.guide.stats.step.2':
    'Los continentes muestran países visitados por continente; la Antártida se une a la fila en cuanto hayas estado. Luego tu racha, años consecutivos con al menos un viaje, y cuántos viajes hiciste este año.',
  'help.guide.stats.result': 'Las cifras siguen a tus viajes mientras los planificas; aquí no hay nada que mantener.',
  'help.guide.stats.tip.1':
    'Las ciudades se leen del texto de la dirección, no se consultan, así que una dirección corta como «Osteria Francescana, Italy» o una que termina en una prefectura puede dar una región en vez de una ciudad.',
  'help.guide.stats.tip.2':
    'Los países marcados a mano cuentan en Países y en los continentes, pero no aportan viajes, lugares ni días.',
  // dawarich-countries
  'help.guide.dawarich-countries.title': 'Añadir países desde tus grabaciones',
  'help.guide.dawarich-countries.goal':
    'Deja que Dawarich diga en qué países estuviste durante el último año, y pon en el mapa los que confirmes.',
  'help.guide.dawarich-countries.step.1':
    'Con el addon de Dawarich conectado, un panel de Dawarich está en la parte baja del mapa, a la izquierda de las estadísticas, con dos mosaicos. Haz clic en Países.',
  'help.guide.dawarich-countries.step.2':
    'El diálogo se abre en su pestaña Países. Haz clic en Buscar países: TREK lee los países y ciudades que cubren tus grabaciones en los últimos 12 meses, mes a mes, así que dale un momento. Cada país que tu Atlas aún no tiene aparece con su bandera, cuántas ciudades y el nombre de la primera, y empieza marcado; haz clic en una fila para dejarla fuera.',
  'help.guide.dawarich-countries.step.3':
    'Confirma con el botón de abajo a la derecha, que dice Añadir 5 países cuando hay cinco filas marcadas. El diálogo dice cuántos se añadieron; ciérralo y el mapa se ha vuelto a leer.',
  'help.guide.dawarich-countries.result':
    'Los países confirmados llevan un color en el mapa y cuentan en Países, anotados como procedentes de Dawarich. Lo que marcaste a mano queda intacto.',
  'help.guide.dawarich-countries.tip.1':
    'Los países que el Atlas ya muestra como visitados, a mano, desde un viaje o desde una comprobación anterior, se dejan fuera, así que tus propias marcas nunca se reetiquetan. Un país que quitaste antes del Atlas vuelve cuando lo confirmas aquí.',
  'help.guide.dawarich-countries.tip.2':
    'Un nombre de país que TREK no puede emparejar se lista bajo las filas en vez de descartarse, y Volver a comprobar pregunta a Dawarich una vez más. La nota bajo la lista dice que Se han revisado los últimos 12 meses; esa ventana es fija.',
  // dawarich-wishes
  'help.guide.dawarich-wishes.title': 'Tachar deseos desde tus grabaciones',
  'help.guide.dawarich-wishes.goal':
    'Averigua qué lugares de tu lista de deseos has alcanzado de verdad, y táchalos en el día en que ocurrió.',
  'help.guide.dawarich-wishes.step.1':
    'En el panel de Dawarich en la parte baja del mapa, a la izquierda de las estadísticas, haz clic en Lista de deseos.',
  'help.guide.dawarich-wishes.step.2':
    'El diálogo se abre en su pestaña Lista de deseos. Haz clic en Comprobar la lista de deseos: TREK repasa tus grabaciones buscando cada entrada que tiene coordenadas. Un deseo que alcanzaste aparece con lo cerca que llegaste, cuánto te quedaste y el día, y empieza marcado; uno que ya tachaste dice Ya tachado. Bajo la lista una nota cuenta las entradas sin coordenadas, y la regla también está ahí: Un deseo cuenta como cumplido a menos de 250 m y tras 20 minutos en el lugar.',
  'help.guide.dawarich-wishes.step.3':
    'Confirma con el botón de abajo a la derecha, que dice Tachar 2 cuando hay dos filas marcadas. Luego cierra el diálogo y abre la pestaña Lista de deseos del panel de al lado.',
  'help.guide.dawarich-wishes.result':
    'Cada deseo lleva una marca verde con la fecha de la estancia, no la de hoy; su tooltip dice Tachado a partir de tus grabaciones de Dawarich, y un clic en la fecha lo deshace.',
  'help.guide.dawarich-wishes.tip.1':
    'Pasar de largo no cuenta: la regla necesita cercanía y tiempo a la vez, y de varias estancias que cumplan, gana la más larga. Un deseo sin coordenadas no se puede comprobar, así que añade los lugares a través de la búsqueda en Añadir lugar y no solo por el nombre.',
  'help.guide.dawarich-wishes.tip.2':
    'Una comprobación mira hasta 50 entradas, primero las aún no tachadas, y lo dice cuando había más. Un deseo que ya estaba tachado conserva su propia fecha.',

  // ── Screen: collections ───────────────────────────────────────────────────────────────
  'help.ctx.collections.title': 'Colecciones',
  'help.ctx.collections.summary':
    'Collections es tu biblioteca de lugares fuera de cualquier viaje: listas con nombre de lugares que encontraste y quieres guardar, cada lugar con un estado Idea, Quiero ir o Visitado. Los lugares se copian hacia y desde los viajes, nunca se enlazan, así que una lista y un viaje nunca se cambian entre sí.',
  'help.ctx.collections.bullet.1':
    'Barra de listas a la izquierda: tus propias listas, las compartidas contigo, invitaciones que esperan un sí, Todos los guardados como la unión de todo lo tuyo, y Nueva lista más la importación de archivo arriba del todo.',
  'help.ctx.collections.bullet.2':
    'Cabecera de la lista abierta: su color, portada, descripción y enlaces, los miembros, y las acciones Editar, Exportar y Compartir a la derecha.',
  'help.ctx.collections.bullet.3':
    'Fila de filtros sobre los lugares: estado, categoría, valoración y orden, el filtro de etiquetas, el + para añadir un lugar, la importación desde un viaje y Elegir para acciones en bloque.',
  'help.ctx.collections.bullet.4':
    'Filas de lugares: avatar, nombre y dirección, etiquetas y categoría, y la píldora de estado a la derecha, que cambia con un clic.',
  'help.ctx.collections.bullet.5':
    'Mapa a la derecha: un pin por lugar con coordenadas, el conmutador lista o mapa, el cuadro de búsqueda y el filtro de etiquetas. Hacer clic en un pin abre ese lugar.',
  'help.ctx.collections.bullet.6':
    'Ficha de detalle: haz clic en una fila para ver portada, categoría, etiquetas, estado, descripción y enlaces, con Editar, Copiar al viaje y Quitar de la lista.',
  // create-list
  'help.guide.create-list.title': 'Crear una lista',
  'help.guide.create-list.goal':
    'Empieza una nueva lista con nombre, con un color y una portada, lista para recibir lugares.',
  'help.guide.create-list.step.1': 'Haz clic en Nueva lista arriba de la barra de listas.',
  'help.guide.create-list.step.2':
    'Dale un nombre a la lista y elige un color. Imagen de portada, descripción y enlaces son opcionales; puedes añadirlos más tarde con Editar.',
  'help.guide.create-list.step.3': 'Haz clic en Crear.',
  'help.guide.create-list.result':
    'La lista se abre vacía, con Añadir un lugar e Importar de un viaje como las dos formas de llenarla.',
  'help.guide.create-list.tip.1':
    'La portada puede ser una subida tuya o una imagen encontrada con la búsqueda de Unsplash en el mismo diálogo.',
  // add-place
  'help.guide.add-place.title': 'Añadir un lugar',
  'help.guide.add-place.goal':
    'Encuentra un lugar y guárdalo en la lista abierta con nombre, categoría, estado y notas de una vez.',
  'help.guide.add-place.step.1': 'Haz clic en el + de la fila de filtros sobre los lugares.',
  'help.guide.add-place.step.2':
    'Escribe el lugar en el campo de búsqueda y elige un resultado. Nombre, dirección y coordenadas se rellenan a partir de él.',
  'help.guide.add-place.step.3':
    'Pon el estado y, si quieres, una categoría, una descripción y enlaces, y luego haz clic en Añadir. El diálogo sigue abierto para el siguiente lugar; Cancelar lo cierra.',
  'help.guide.add-place.result': 'El lugar aparece en la lista y, cuando tiene coordenadas, como un pin en el mapa.',
  'help.guide.add-place.tip.1':
    'Desde dentro de un viaje, Guardar en colección en el inspector del lugar o en el menú del lugar pone un lugar del viaje en una lista sin salir del viaje.',
  'help.guide.add-place.tip.2':
    'La lista debe ser tuya o una en la que seas editor o administrador; el + no está en Todos los guardados ni en una lista que solo ves.',
  // import-from-trip
  'help.guide.import-from-trip.title': 'Importar lugares de un viaje',
  'help.guide.import-from-trip.goal':
    'Trae de una vez todos los lugares de un viaje a una lista en vez de guardarlos uno a uno.',
  'help.guide.import-from-trip.step.1':
    'Haz clic en el botón de importar con la flecha de nube en la fila de filtros. En una lista vacía la misma acción está junto a Añadir un lugar.',
  'help.guide.import-from-trip.step.2': 'Elige uno de tus viajes.',
  'help.guide.import-from-trip.step.3':
    'Marca los lugares que quieras. Los que ya están en la lista aparecen en gris; los que no están en ningún día del viaje salen seleccionados de entrada. Solo nuevos oculta lo que ya tienes.',
  'help.guide.import-from-trip.step.4':
    'Haz clic en Importar. El botón siempre dice cuántos están a punto de añadirse.',
  'help.guide.import-from-trip.result':
    'Los lugares se copian a la lista con su nombre, dirección, coordenadas, descripción y categoría. El viaje se queda como estaba.',
  'help.guide.import-from-trip.tip.1':
    'Los duplicados por nombre o coordenadas se saltan automáticamente, así que importar dos veces no hace daño.',
  'help.guide.import-from-trip.tip.2':
    'Dentro de la lista de lugares de un viaje, el modo de selección ofrece en cambio Guardar en colección para un conjunto de lugares elegidos a mano.',
  // place-status
  'help.guide.place-status.title': 'Poner el estado de un lugar',
  'help.guide.place-status.goal': 'Lleva la cuenta de qué es una idea, qué está en la lista corta y dónde has estado.',
  'help.guide.place-status.step.1':
    'Haz clic en la píldora de estado al final derecho de una fila de lugar. Idea pasa a Quiero ir.',
  'help.guide.place-status.step.2': 'Haz clic otra vez para Visitado, y una más para volver a empezar en Idea.',
  'help.guide.place-status.result':
    'La píldora y su color cambian al momento; el filtro de estado sobre la lista lleva la cuenta.',
  'help.guide.place-status.tip.1': 'El estado es cosa de Collections: copiar un lugar a un viaje no se lo lleva.',
  'help.guide.place-status.tip.2':
    'Desde un viaje, Guardar en colección muestra una píldora de estado por cada lista en la que está el lugar, y el panel de lugares tiene la acción Marcar como visitado para una selección.',
  // place-detail
  'help.guide.place-detail.title': 'Abrir un lugar guardado',
  'help.guide.place-detail.goal': 'Ve todo sobre un lugar y actúa: editar, copiar a un viaje, quitar.',
  'help.guide.place-detail.step.1':
    'Haz clic en una fila de lugar. La ficha de detalle se abre junto a la lista y el mapa se desplaza hasta el lugar.',
  'help.guide.place-detail.step.2':
    'Abajo están Editar, Copiar al viaje y Quitar de la lista; la cámara sobre la portada cambia la foto automática por una tuya.',
  'help.guide.place-detail.result':
    'Editar desbloquea nombre, categoría, etiquetas, dirección, coordenadas, descripción y enlaces ahí mismo en la ficha.',
  'help.guide.place-detail.tip.1':
    'La portada se obtiene automáticamente cuando el lugar no tiene imagen propia. Tu propia subida puede ser JPG, PNG, GIF o WebP hasta 20 MB.',
  'help.guide.place-detail.tip.2':
    'Los miembros de una lista compartida también pueden dejar aquí una valoración con estrellas, y el filtro de valoración de la fila de filtros usa la media.',
  // labels
  'help.guide.labels.title': 'Agrupar lugares con etiquetas',
  'help.guide.labels.goal':
    'Dale a una lista sus propias etiquetas, como barrios o días, más allá de las categorías comunes.',
  'help.guide.labels.step.1': 'Abre el gestor de etiquetas desde el control de etiquetas de la fila de filtros.',
  'help.guide.labels.step.2':
    'Escribe un nombre, elige un color y haz clic en Añadir etiqueta. Renombra, recolorea o elimina etiquetas existentes en el mismo diálogo.',
  'help.guide.labels.step.3':
    'Activa Elegir, marca los lugares y haz clic en Asignar etiqueta en la barra de selección. Un solo lugar también recibe etiquetas con Editar en su ficha de detalle.',
  'help.guide.labels.step.4':
    'Elige una o más etiquetas en la fila de filtros para reducir la lista y el mapa a los lugares que lleven cualquiera de ellas.',
  'help.guide.labels.result':
    'Los lugares etiquetados muestran sus etiquetas en la fila; el filtro de etiquetas está ahí para todos los miembros, lectores incluidos.',
  'help.guide.labels.tip.1':
    'Las etiquetas pertenecen a la única lista en la que se crearon. Mover un lugar a otra lista las deja atrás.',
  'help.guide.labels.tip.2': 'Gestionar y asignar etiquetas requiere derechos de edición en la lista.',
  // filter-select
  'help.guide.filter-select.title': 'Filtrar y seleccionar lugares',
  'help.guide.filter-select.goal': 'Reduce la lista y actúa sobre muchos lugares a la vez.',
  'help.guide.filter-select.step.1':
    'Usa los desplegables de la fila de filtros: estado, categoría, valoración mínima y orden. Cada uno muestra cuántos lugares dejaría.',
  'help.guide.filter-select.step.2':
    'Haz clic en Elegir. Cada fila recibe una casilla y aparece una barra de selección.',
  'help.guide.filter-select.step.3':
    'Marca lugares o usa Seleccionar todo para todo lo filtrado ahora mismo, y luego elige Asignar etiqueta, Mover a lista, Duplicar en lista, Copiar al viaje o Eliminar.',
  'help.guide.filter-select.result':
    'Las acciones se aplican a toda la selección de una vez. La × de la derecha sale del modo de selección.',
  'help.guide.filter-select.tip.1':
    'Seleccionar todo sigue al filtro, así que filtrar por Quiero ir y seleccionar todo es la forma rápida de actuar sobre la lista corta.',
  // copy-to-trip
  'help.guide.copy-to-trip.title': 'Copiar lugares a un viaje',
  'help.guide.copy-to-trip.goal': 'Convierte lugares guardados en paradas de uno de tus viajes.',
  'help.guide.copy-to-trip.step.1':
    'Activa Elegir y marca los lugares, o abre un lugar y usa Copiar al viaje en su ficha de detalle.',
  'help.guide.copy-to-trip.step.2': 'Haz clic en Copiar al viaje en la barra de selección.',
  'help.guide.copy-to-trip.step.3': 'Elige el viaje. El cuadro de búsqueda acorta una lista larga.',
  'help.guide.copy-to-trip.result':
    'Los lugares aterrizan en la lista de lugares de ese viaje con nombre, descripción, categoría, notas, precio, coordenadas, foto y tags. Nada cambia en la colección.',
  'help.guide.copy-to-trip.tip.1':
    'Los lectores de una lista compartida también pueden hacerlo; copia desde la lista, no la cambia.',
  // share-list
  'help.guide.share-list.title': 'Compartir una lista con alguien',
  'help.guide.share-list.goal': 'Planifica una lista junto con otras personas de este TREK, en directo.',
  'help.guide.share-list.step.1': 'Haz clic en Compartir en la cabecera de tu lista.',
  'help.guide.share-list.step.2': 'Selecciona al usuario y un rol: Lector, Editor o Administrador.',
  'help.guide.share-list.step.3':
    'Haz clic en Enviar invitación. La persona aparece como invitación pendiente hasta que acepta la invitación en su barra de listas.',
  'help.guide.share-list.result':
    'Una vez aceptada, la lista le aparece bajo Compartida y cada cambio se sincroniza en directo. Los miembros y sus roles siguen siendo editables en el mismo diálogo.',
  'help.guide.share-list.tip.1':
    'Los lectores pueden mirar, valorar y copiar lugares a sus propios viajes. Los editores añaden y editan lugares y etiquetas. Los administradores además pueden eliminar.',
  'help.guide.share-list.tip.2':
    'Solo el propietario invita y quita personas; un miembro puede salir por sí mismo de una lista compartida.',
  // export-list
  'help.guide.export-list.title': 'Exportar una lista como archivo',
  'help.guide.export-list.goal': 'Entrega una lista a alguien de otro TREK, o llévatela a una app de mapas.',
  'help.guide.export-list.step.1': 'Haz clic en Exportar en la cabecera de la lista.',
  'help.guide.export-list.step.2':
    'Elige Lista de TREK para otro TREK, con etiquetas y estado, o GPX para OsmAnd, Organic Maps, un Garmin y otras apps que leen waypoints.',
  'help.guide.export-list.result':
    'El archivo se descarga. Cualquier miembro de una lista compartida puede exportarla.',
  'help.guide.export-list.tip.1':
    'Un lugar sin coordenadas no puede ser un waypoint GPX; se deja fuera y TREK te dice cuántos han sido.',
  'help.guide.export-list.tip.2':
    'Valoraciones, miembros y fotos subidas se quedan atrás a propósito; pertenecen a este TREK, no a la lista.',
  // import-file
  'help.guide.import-file.title': 'Importar una lista desde un archivo',
  'help.guide.import-file.goal':
    'Trae un archivo de Lista de TREK o un archivo GPX, como lista nueva o a una que ya tengas.',
  'help.guide.import-file.step.1':
    'Haz clic en el botón de importar con la flecha de subida junto a Nueva lista en la barra de listas.',
  'help.guide.import-file.step.2':
    'Elige el archivo. TREK muestra lo que contiene antes de que pase nada: el nombre, cuántos lugares y etiquetas.',
  'help.guide.import-file.step.3':
    'Deja Nueva lista y cambia el nombre si quieres, o elige Añadir a una lista para meter los lugares en una lista que puedas editar, y luego haz clic en Importar.',
  'help.guide.import-file.result':
    'Aterrizas en la lista con los lugares importados. Añadir a una lista únicamente añade; los lugares que ya estaban conservan su estado, sus notas y sus etiquetas.',
  'help.guide.import-file.tip.1':
    'De un GPX, cada waypoint con nombre se convierte en un lugar; los tracks son líneas y se dejan fuera, y la vista previa dice cuántos puntos eran.',
  'help.guide.import-file.tip.2':
    'Un archivo que no es ni una Lista de TREK ni un GPX se rechaza con un motivo; un solo lugar ilegible se salta, no el archivo entero.',
  // edit-list
  'help.guide.edit-list.title': 'Editar o eliminar una lista',
  'help.guide.edit-list.goal':
    'Cambia el nombre, el color, la portada, la descripción o los enlaces de una lista, o quita la lista.',
  'help.guide.edit-list.step.1': 'Haz clic en Editar en la cabecera de la lista. Solo el propietario lo ve.',
  'help.guide.edit-list.step.2':
    'Cambia lo que quieras y haz clic en Guardar. Eliminar lista, abajo a la izquierda, quita la lista con todos sus lugares, tras una confirmación.',
  'help.guide.edit-list.result': 'La cabecera toma el nuevo color, la portada y la descripción de inmediato.',
  'help.guide.edit-list.tip.1':
    'Eliminar una lista no se puede deshacer. Expórtala antes si quieres conservar una copia.',
  // all-saved
  'help.guide.all-saved.title': 'Buscar en toda tu biblioteca',
  'help.guide.all-saved.goal': 'Mira a la vez todas las listas que te pertenecen.',
  'help.guide.all-saved.step.1':
    'Haz clic en Todos los guardados en la barra de listas. Une los lugares de todas las listas que posees o de las que eres copropietario.',
  'help.guide.all-saved.step.2':
    'Usa el cuadro de búsqueda y los filtros como en cualquier lista; Elegir también funciona aquí para copiar a un viaje.',
  'help.guide.all-saved.result':
    'Una sola vista sobre todos tus lugares guardados, sin añadir ni importar, ya que no hay una lista concreta donde ponerlos.',
  'help.guide.all-saved.tip.1':
    'Las etiquetas son por lista, así que el filtro de etiquetas no se ofrece en Todos los guardados.',

  // ── Screen: journey ───────────────────────────────────────────────────────────────────
  'help.ctx.journey.title': 'Travesía',
  'help.ctx.journey.summary':
    'Travesía es tu diario de viaje con las fotos por delante. Cada travesía está ligada a uno o más viajes y crece día a día a partir de entradas con relato, fotos, ánimo y tiempo. Esta pantalla lista tus travesías; abre una para escribir.',
  'help.ctx.journey.bullet.1':
    'El banner de arriba muestra la travesía en curso, o la más reciente, con sus recuentos de entradas, fotos y lugares. Seguir escribiendo la abre en el día de hoy.',
  'help.ctx.journey.bullet.2':
    'Debajo, una tarjeta por travesía con su portada, subtítulo, fechas y recuentos. Haz clic en una tarjeta para abrirla.',
  'help.ctx.journey.bullet.3':
    'La última tarjeta de la cuadrícula, Crear una nueva travesía, empieza una a partir de tus viajes.',
  // create-journey
  'help.guide.create-journey.title': 'Crear una travesía',
  'help.guide.create-journey.goal':
    'Empezar un diario para un viaje, con los lugares del viaje ya esperando como sugerencias.',
  'help.guide.create-journey.step.1': 'Haz clic en Crear una nueva travesía, la última tarjeta de la cuadrícula.',
  'help.guide.create-journey.step.2':
    'Ponle un nombre y, si quieres, un subtítulo, y marca los viajes a los que pertenece. El contador dice cuántos lugares entrarán.',
  'help.guide.create-journey.step.3': 'Haz clic en Crear travesía.',
  'help.guide.create-journey.result':
    'El diario se abre. Cada lugar de los viajes vinculados está en la cronología como sugerencia, una por cada día en el que está, lista para escribirse.',
  'help.guide.create-journey.tip.1': 'Más viajes se pueden vincular después desde Ajustes de la travesía.',
  'help.guide.create-journey.tip.2': 'Una travesía sin viajes también funciona; entonces añades las entradas a mano.',
  // open-journey
  'help.guide.open-journey.title': 'Abrir una travesía',
  'help.guide.open-journey.goal': 'Entrar en un diario, y saber dónde se abre.',
  'help.guide.open-journey.step.1':
    'Haz clic en una tarjeta. Cada una muestra la portada, las fechas y cuántas entradas, fotos y lugares contiene la travesía.',
  'help.guide.open-journey.result':
    'Una travesía en curso se abre en el día de hoy, o en la última entrada antes de hoy cuando aún no hay nada escrito; una terminada se abre al principio.',
  'help.guide.open-journey.tip.1':
    'La portada es la primera foto de la travesía, salvo que fijes una en Ajustes de la travesía.',
  // continue-writing
  'help.guide.continue-writing.title': 'Seguir con la travesía en curso',
  'help.guide.continue-writing.goal': 'Ir directo a la página de hoy de la travesía en la que estás.',
  'help.guide.continue-writing.step.1':
    'Haz clic en Seguir escribiendo en el banner de arriba. Muestra la travesía en curso, o la más reciente cuando no hay ninguna.',
  'help.guide.continue-writing.result':
    'El diario se abre en el día de hoy, o en la última entrada antes de hoy cuando aún no hay nada escrito.',
  'help.guide.continue-writing.tip.1':
    'El banner también ofrece una sugerencia para un viaje que aún no tiene travesía; Descartar la oculta.',

  // ── Screen: journey-detail ────────────────────────────────────────────────────────────
  'help.ctx.journey-detail.title': 'Diario',
  'help.ctx.journey-detail.summary':
    'Una travesía abierta: la cronología a la izquierda, día a día, y el mapa a la derecha con cada entrada y los lugares de los viajes vinculados. Todo lo que añade al diario está arriba; la cabecera tiene los recuentos, Studio, el interruptor de sugerencias y Ajustes de la travesía.',
  'help.ctx.journey-detail.bullet.1':
    'Cabecera: portada, título y subtítulo, los recuentos de días, lugares, entradas y fotos, y a la derecha Studio, el interruptor de sugerencias y Ajustes de la travesía.',
  'help.ctx.journey-detail.bullet.2':
    'Barra de herramientas: las pestañas Cronología y Galería, Buscar en este viaje y Añadir entrada.',
  'help.ctx.journey-detail.bullet.3':
    'Cronología: una sección por día con un + para añadir una entrada ese día; tarjetas de entrada con fotos, ánimo, tiempo y relato; sugerencias de los viajes en un estilo más claro, con Descartar esta sugerencia.',
  'help.ctx.journey-detail.bullet.4':
    'Mapa: las entradas como pines, unidos por orden de fecha con una línea discontinua, los lugares de los viajes y las rutas GPX importadas en esos viajes.',
  'help.ctx.journey-detail.bullet.5':
    'Ajustes de la travesía: portada, nombre y subtítulo, rutas en el mapa, campos de la entrada, sugerencias descartadas, viajes vinculados, colaboradores, compartir público, archivar y eliminar.',
  'help.ctx.journey-detail.bullet.6':
    'Dos botones redondos flotan sobre una cronología larga: volver arriba y saltar a la última entrada.',
  // add-entry
  'help.guide.add-entry.title': 'Escribir una entrada',
  'help.guide.add-entry.goal': 'Añadir el relato de un día con título, texto, ánimo y tiempo.',
  'help.guide.add-entry.step.1':
    'Haz clic en Añadir entrada en la barra de herramientas, o en el + de la cabecera de un día para empezar ese día.',
  'help.guide.add-entry.step.2':
    'Ponle nombre al momento y escribe el relato. La barra sobre el texto añade negrita, cursiva, títulos, citas, enlaces y listas en Markdown.',
  'help.guide.add-entry.step.3':
    'Elige un ánimo y el tiempo, comprueba la fecha y fija una ubicación si quieres: busca un lugar o usa tu posición actual.',
  'help.guide.add-entry.step.4': 'Haz clic en Guardar.',
  'help.guide.add-entry.result':
    'La entrada aparece en su día en la cronología y como pin en el mapa. Sus recuentos se actualizan en la cabecera.',
  'help.guide.add-entry.tip.1': 'Escribir en una sugerencia es el mismo editor, con el lugar ya puesto.',
  'help.guide.add-entry.tip.2':
    'Las etiquetas de abajo son texto libre, joya oculta o mejor comida, y la búsqueda las encuentra.',
  // entry-photos
  'help.guide.entry-photos.title': 'Añadir fotos y vídeos a una entrada',
  'help.guide.entry-photos.goal': 'Poner imágenes en un día; la primera se convierte en la portada de la entrada.',
  'help.guide.entry-photos.step.1': 'Abre el menú de una entrada con el ⋯ de su tarjeta y elige Editar.',
  'help.guide.entry-photos.step.2':
    'Haz clic en Subir fotos y elige los archivos. Desde galería toma imágenes que ya están en la galería de la travesía; External photos busca ese día en una biblioteca Immich o Synology conectada.',
  'help.guide.entry-photos.step.3':
    'Pasa el ratón por una imagen para Hacer 1º y elegir la portada, y haz clic en Guardar.',
  'help.guide.entry-photos.result':
    'Las fotos se ven en la tarjeta y en la galería; la primera es la miniatura en todas partes.',
  'help.guide.entry-photos.tip.1':
    'Los vídeos van en una entrada de la misma forma: mp4, m4v, webm o mov hasta 500 MB, guardados tal como se suben.',
  'help.guide.entry-photos.tip.2':
    'Los archivos HEIC de un iPhone se convierten a JPEG al subirlos, lo que elimina sus metadatos de GPS y cámara.',
  // suggestions
  'help.guide.suggestions.title': 'Usar o descartar las sugerencias',
  'help.guide.suggestions.goal':
    'Convertir los lugares de tus viajes en entradas, y quitar de en medio aquellos sobre los que no vas a escribir.',
  'help.guide.suggestions.step.1':
    'Una sugerencia es una tarjeta más clara con el nombre del lugar en cursiva. Haz clic en ella para abrir el editor con el lugar y el día ya puestos.',
  'help.guide.suggestions.step.2':
    'Haz clic en Descartar esta sugerencia en una tarjeta que no vas a usar. Sale de la cronología sin borrarse, y la sincronización del viaje no la volverá a ofrecer.',
  'help.guide.suggestions.step.3':
    '¿Cambiaste de idea? Ajustes de la travesía muestra cuántas están descartadas, y Recuperar las sugerencias descartadas las devuelve todas.',
  'help.guide.suggestions.result':
    'La cronología solo contiene lo que piensas escribir; el interruptor de la cabecera oculta todas las sugerencias de golpe mientras lees.',
  'help.guide.suggestions.tip.1': 'Un lugar que abarca dos días da una sugerencia en cada uno.',
  'help.guide.suggestions.tip.2':
    'Las sugerencias nunca cuentan en las estadísticas; solo cuentan las entradas escritas.',
  // add-on-day
  'help.guide.add-on-day.title': 'Añadir una entrada en un día anterior',
  'help.guide.add-on-day.goal': 'Escribir sobre un día que ya pasó sin corregir la fecha después.',
  'help.guide.add-on-day.step.1': 'Haz clic en el + de la cabecera de ese día.',
  'help.guide.add-on-day.step.2': 'El editor se abre con esa fecha puesta. Escribe y Guardar como siempre.',
  'help.guide.add-on-day.result': 'La entrada cae directamente en el día correcto.',
  'help.guide.add-on-day.tip.1': 'Dentro de un día, las flechas del menú de una entrada la mueven antes o después.',
  // pros-cons
  'help.guide.pros-cons.title': 'Añadir un veredicto',
  'help.guide.pros-cons.goal': 'Resumir un día con lo que fue genial y lo que no.',
  'help.guide.pros-cons.step.1':
    'En el editor, busca Pros y contras bajo el relato. Escribe un punto en Pros o Contras y usa Añadir otro para el siguiente.',
  'help.guide.pros-cons.step.2': 'Guardar. El veredicto aparece en la tarjeta como dos listas cortas.',
  'help.guide.pros-cons.result': 'Pulgar arriba y pulgar abajo de un vistazo, bajo el relato.',
  'help.guide.pros-cons.tip.1':
    'Una travesía que no usa veredictos puede apagar la sección en Campos de la entrada, en Ajustes de la travesía.',
  // search-journey
  'help.guide.search-journey.title': 'Encontrar algo en un diario largo',
  'help.guide.search-journey.goal': 'Llegar a la entrada que buscas sin desplazarte por semanas.',
  'help.guide.search-journey.step.1':
    'Escribe en Buscar en este viaje, en la barra de herramientas. La cronología se filtra mientras escribes, en títulos, relatos, lugares y etiquetas. Los acentos y las mayúsculas no importan.',
  'help.guide.search-journey.step.2':
    'El interruptor de sugerencias de la cabecera oculta las tarjetas sin escribir mientras lees. Cuando la cronología se hace larga, dos botones redondos flotan sobre su borde inferior: volver arriba y saltar a la última entrada.',
  'help.guide.search-journey.result':
    'Solo quedan las entradas que coinciden; vacía el cuadro para volver a verlo todo.',
  'help.guide.search-journey.tip.1':
    'Una travesía en curso se abre en el día de hoy, así que la página actual suele estar ya a la vista.',
  'help.guide.search-journey.tip.2':
    'Las etiquetas también cuentan: buscar joya oculta encuentra cada entrada etiquetada así.',
  // gallery-map
  'help.guide.gallery-map.title': 'Recorrer la galería y el mapa',
  'help.guide.gallery-map.goal': 'Ver toda la travesía como imágenes, y como lugares en el mapa.',
  'help.guide.gallery-map.step.1':
    'Cambia a Galería en la barra de herramientas: cada foto de cada entrada, más las imágenes subidas directamente a la galería. Haz clic en una para el visor.',
  'help.guide.gallery-map.step.2':
    'El mapa de la derecha muestra las entradas como pines por orden de fecha, los lugares de los viajes vinculados y cualquier ruta GPX importada en esos viajes, con el color que tiene en el planificador.',
  'help.guide.gallery-map.result':
    'Pasa el ratón por una ruta para ver su nombre. La línea discontinua entre entradas la dibuja TREK; una ruta es el recorrido que grabaste de verdad.',
  'help.guide.gallery-map.tip.1': 'Las rutas se pueden apagar para una travesía en Ajustes de la travesía.',
  'help.guide.gallery-map.tip.2':
    'Las fotos de la galería con ubicación también aparecen en el mapa público, cuando Galería y Mapa se comparten los dos.',
  // entry-fields
  'help.guide.entry-fields.title': 'Apagar campos de la entrada',
  'help.guide.entry-fields.goal': 'Limitar el editor a lo que usa esta travesía.',
  'help.guide.entry-fields.step.1': 'Abre Ajustes de la travesía desde la cabecera.',
  'help.guide.entry-fields.step.2': 'En Campos de la entrada, apaga Ánimo, Tiempo o Pros y contras.',
  'help.guide.entry-fields.result':
    'El editor deja de pedirlos. Nada escrito se pierde: volver a encender un campo trae a la vista los valores guardados, y una travesía compartida oculta los mismos campos.',
  'help.guide.entry-fields.tip.1':
    'Los interruptores son por travesía, así que un viaje de trabajo y unas vacaciones pueden diferir.',
  // link-trip
  'help.guide.link-trip.title': 'Vincular otro viaje',
  'help.guide.link-trip.goal': 'Traer los lugares de un segundo viaje al diario como sugerencias.',
  'help.guide.link-trip.step.1': 'Abre Ajustes de la travesía desde la cabecera.',
  'help.guide.link-trip.step.2': 'Bajo los viajes vinculados, haz clic en Añadir viaje.',
  'help.guide.link-trip.step.3': 'Elige el viaje.',
  'help.guide.link-trip.result':
    'Sus lugares llegan a la cronología como sugerencias en sus días, y sus rutas GPX se suman al mapa.',
  'help.guide.link-trip.tip.1':
    'La × junto a un viaje vinculado lo desvincula de nuevo; las entradas que escribiste se quedan.',
  'help.guide.link-trip.tip.2': 'Las entradas de un día cuentan solo una vez, por muchos viajes que cubran ese día.',
  // share-public
  'help.guide.share-public.title': 'Compartir la travesía públicamente',
  'help.guide.share-public.goal': 'Dar a gente sin cuenta de TREK un enlace de solo lectura.',
  'help.guide.share-public.step.1': 'Abre Ajustes de la travesía y busca Compartir público.',
  'help.guide.share-public.step.2': 'Haz clic en Crear enlace para compartir.',
  'help.guide.share-public.step.3':
    'Elige qué ven los visitantes: Cronología, Galería y Mapa son interruptores separados. Copiar pone el enlace en tu portapapeles.',
  'help.guide.share-public.result':
    'Quien tenga el enlace ve las secciones activadas y nada más; los campos que apagaste en Campos de la entrada también quedan ocultos allí.',
  'help.guide.share-public.tip.1':
    'Las fotos aparecen en el mapa público solo cuando Galería y Mapa están los dos encendidos; con Mapa apagado, sus coordenadas se eliminan antes de salir del servidor.',
  'help.guide.share-public.tip.2': 'Elimina el enlace en el mismo sitio para terminar de compartir.',
  // contributors
  'help.guide.contributors.title': 'Escribir juntos',
  'help.guide.contributors.goal': 'Dejar que un compañero de viaje añada sus propias entradas y fotos.',
  'help.guide.contributors.step.1': 'Abre Ajustes de la travesía y baja hasta los colaboradores.',
  'help.guide.contributors.step.2': 'Haz clic en Invitar colaborador y busca al usuario por nombre o correo.',
  'help.guide.contributors.step.3': 'Elige un rol y confirma.',
  'help.guide.contributors.result':
    'La travesía aparece en su lista y sus entradas llevan su nombre. Quita a un colaborador con la × que tiene al lado.',
  'help.guide.contributors.tip.1':
    'Los colaboradores son para gente de este TREK. Para todos los demás está el enlace público.',
  // studio
  'help.guide.studio.title': 'Maquetar la travesía como un álbum de fotos',
  'help.guide.studio.goal': 'Convertir el diario en páginas imprimibles.',
  'help.guide.studio.step.1': 'Haz clic en Studio en la cabecera. El diseñador se abre encima de la travesía.',
  'help.guide.studio.step.2':
    'El nombre de la travesía a la izquierda de la barra superior es el camino de vuelta; te deja donde estabas.',
  'help.guide.studio.result':
    'La tira de páginas a la izquierda, el pliego en la mesa de trabajo, las propiedades a la derecha. Auto layout construye el álbum a partir de tus entradas; Export genera un PDF listo para imprimir.',
  'help.guide.studio.tip.1': 'Studio necesita una ventana de al menos 1024 px de ancho y no se ofrece en el móvil.',
  'help.guide.studio.tip.2':
    'El álbum hereda el acceso de la travesía: quien puede leer la travesía puede abrirlo, quien puede editarla puede guardar.',
  // archive-journey
  'help.guide.archive-journey.title': 'Archivar o eliminar una travesía',
  'help.guide.archive-journey.goal': 'Cerrar una travesía terminada, o quitar una para siempre.',
  'help.guide.archive-journey.step.1': 'Abre Ajustes de la travesía.',
  'help.guide.archive-journey.step.2':
    'Abajo del todo, Archivar viaje la termina y la marca como archivada; Restaurar viaje la trae de vuelta. Eliminar la quita con todas sus entradas y fotos, tras una confirmación.',
  'help.guide.archive-journey.result':
    'Una travesía archivada sigue siendo legible y compartible; solo deja de abrirse en el día de hoy.',
  'help.guide.archive-journey.tip.1':
    'Eliminar no se puede deshacer, y no toca los viajes a los que la travesía estaba vinculada.',
  'help.guide.archive-journey.tip.2': 'La portada, el nombre y el subtítulo están en el mismo diálogo, arriba.',

  // ── Screen: journey-studio ────────────────────────────────────────────────────────────
  'help.ctx.journey-studio.title': 'Studio',
  'help.ctx.journey-studio.summary':
    'TREK Studio maqueta una travesía como un libro de fotos imprimible. Se abre sobre el diario: la lista de páginas y el contenido a la izquierda, la doble página en la que trabajas en el centro, sus propiedades a la derecha. Auto layout construye un primer borrador con tus entradas; todo lo que viene después es tuyo para mover, recortar y cambiar de estilo, con deshacer para cada paso.',
  'help.ctx.journey-studio.bullet.1':
    'Barra superior: Back to the journey, Book view, Undo y Redo, Page format, Auto layout y Export. La marca Guardado junto al título te dice cuándo el libro está almacenado.',
  'help.ctx.journey-studio.bullet.2':
    'Columna a la izquierda con cinco secciones: Pages, Content (las fotos y entradas de la travesía), Elements (texto, formas, líneas, cuadrículas, marcos, iconos), Viaje (mapas, países, banderas y marcas construidas a partir de la travesía) y Layouts.',
  'help.ctx.journey-studio.bullet.3':
    'Mesa de trabajo: la doble página actual con su sangrado y sus márgenes de seguridad, la barra de zoom debajo, Fit to view y Descargar esta doble página a la derecha.',
  'help.ctx.journey-studio.bullet.4':
    'Properties a la derecha: posición y tamaño, recorte y punto focal, rellenar o ajustar, look, esquinas, marco, orden de apilamiento y bloqueo de lo que esté seleccionado; números de página y el documento cuando no hay nada.',
  'help.ctx.journey-studio.bullet.5':
    'El libro tiene la forma de uno encuadernado: cubierta, una primera página suelta, las dobles páginas, una última página suelta y la contracubierta. Los números de página cuentan desde la primera página y se imprimen tal como se muestran.',
  'help.ctx.journey-studio.bullet.6':
    'Varias personas pueden diseñar a la vez: cada una ve los punteros de las demás con sus nombres, y guardar sobre una versión que otra persona cambió vuelve como un conflicto en lugar de sobrescribir su trabajo.',
  // studio-auto-layout
  'help.guide.studio-auto-layout.title': 'Construir el libro automáticamente',
  'help.guide.studio-auto-layout.goal':
    'Consigue con un clic un primer borrador completo a partir de las entradas y fotos del diario.',
  'help.guide.studio-auto-layout.step.1': 'Haz clic en Auto layout en la barra superior.',
  'help.guide.studio-auto-layout.step.2':
    'Elige Todo el libro: reemplaza todas las páginas y conserva tu título y la configuración de página. Esta página reconstruye solo la que está en pantalla, y se ofrece en una doble página que salió de una entrada.',
  'help.guide.studio-auto-layout.step.3':
    'Repasa la lista de páginas. Undo devuelve todo el diseño si preferías lo que tenías.',
  'help.guide.studio-auto-layout.result':
    'Una doble página por entrada, en orden, con sus fotos, título e historia colocados por ti. Cada elemento sigue a su entrada hasta que lo editas.',
  'help.guide.studio-auto-layout.tip.1':
    'Las dos opciones son pasos de deshacer normales, así que pruébalas sin miedo.',
  'help.guide.studio-auto-layout.tip.2':
    'Un elemento que Auto layout ató a una entrada sigue los cambios de esa entrada hasta que lo tocas en Properties; eso rompe el vínculo.',
  // studio-pages
  'help.guide.studio-pages.title': 'Añadir, mover y quitar dobles páginas',
  'help.guide.studio-pages.goal': 'Da forma al libro página a página.',
  'help.guide.studio-pages.step.1':
    'Abre Pages en la columna. Las miniaturas son el libro en orden: cubierta, primera página, dobles páginas, última página, contracubierta.',
  'help.guide.studio-pages.step.2':
    'Añadir página, abajo, pone una nueva antes de la última página; el + entre dos miniaturas inserta una justo ahí.',
  'help.guide.studio-pages.step.3':
    'Pasa el ratón por una miniatura para ver sus acciones: Mover antes, Mover después, Duplicar página y Eliminar página. Haz clic en una miniatura para abrir esa doble página en la mesa de trabajo.',
  'help.guide.studio-pages.result':
    'La cubierta, la primera y la última página y la contracubierta se quedan donde están; las dobles páginas nuevas siempre caen entre ellas.',
  'help.guide.studio-pages.tip.1':
    'Book view en la barra superior muestra el libro entero en hojas, tal como se encuadernará.',
  'help.guide.studio-pages.tip.2':
    'Los números de página se activan bajo Documento en Properties, sin nada seleccionado.',
  // studio-layouts
  'help.guide.studio-layouts.title': 'Aplicar un layout a una doble página',
  'help.guide.studio-layouts.goal': 'Dale a una doble página una disposición lista de marcos de foto y texto.',
  'help.guide.studio-layouts.step.1':
    'Abre Layouts en la columna. Trece layouts de doble página y un juego aparte para la cubierta, la contracubierta y las páginas sueltas.',
  'help.guide.studio-layouts.step.2':
    'Haz clic en uno. La doble página de la mesa de trabajo toma sus marcos; las fotos y el texto que ya tenías se vierten en ellos.',
  'help.guide.studio-layouts.result':
    'Los marcos vacíos esperan contenido: arrastra una foto desde Content a uno, o usa Add to this page.',
  'help.guide.studio-layouts.tip.1': 'Un layout es un paso de deshacer como cualquier otro.',
  // studio-content
  'help.guide.studio-content.title': 'Poner fotos y entradas en una página',
  'help.guide.studio-content.goal': 'Lleva el material propio de la travesía a la doble página.',
  'help.guide.studio-content.step.1':
    'Abre Content en la columna. Photos lista cada imagen de la travesía; Entries lista las entradas con su texto.',
  'help.guide.studio-content.step.2':
    'Arrastra una foto a la doble página, o a un marco vacío, o haz clic en Add to this page debajo de ella. Subir fotos añade imágenes que aún no están en la travesía.',
  'help.guide.studio-content.step.3':
    'Bajo una entrada, Title, Story y Place ponen ese texto en la página como elemento de texto; Fecha y las coordenadas llegan como marcas, y las fotos de la entrada aparecen listadas ahí mismo.',
  'help.guide.studio-content.result':
    'Una foto soltada se convierte en un elemento de foto; el texto sigue a la entrada hasta que lo editas.',
  'help.guide.studio-content.tip.1': 'El cuadro de búsqueda arriba de Content filtra las dos listas.',
  'help.guide.studio-content.tip.2':
    'Soltar un archivo desde tu escritorio en la mesa de trabajo lo sube y lo coloca de una vez.',
  // studio-elements
  'help.guide.studio-elements.title': 'Añadir texto, formas e iconos',
  'help.guide.studio-elements.goal': 'Decora una doble página más allá de fotos e historias.',
  'help.guide.studio-elements.step.1': 'Abre Elements en la columna.',
  'help.guide.studio-elements.step.2':
    'Haz clic en un estilo de texto para un titular o un pie, una forma, una línea, una cuadrícula, un marco vacío con un estilo de marco o un icono de la biblioteca con buscador. Cada uno cae en el centro de la doble página, listo para moverse.',
  'help.guide.studio-elements.result':
    'Haz doble clic en un elemento de texto para escribir en él; Properties guarda fuente, peso, tamaño, espaciado y alineación.',
  'help.guide.studio-elements.tip.1': 'Los marcos son huecos de foto vacíos: suelta una imagen dentro más tarde.',
  // studio-travel
  'help.guide.studio-travel.title': 'Añadir un mapa, banderas y cifras',
  'help.guide.studio-travel.goal': 'Convierte la propia travesía en cifras sobre la página.',
  'help.guide.studio-travel.step.1': 'Abre Viaje en la columna.',
  'help.guide.studio-travel.step.2':
    'Elige qué añadir: un mapa de ruta de las entradas, siluetas de países, una lista o cuadrícula de países, banderas, una marca de fecha, de día o de distancia, o un resumen de todo el viaje. Cada uno se construye con los datos de la travesía y se actualiza con ellos.',
  'help.guide.studio-travel.result':
    'El elemento aparece en la doble página; Properties ajusta su estilo, y en el mapa su área.',
  'help.guide.studio-travel.tip.1':
    'Las marcas siguen a la entrada de la que salió la doble página, así que una marca de fecha en una doble página maquetada automáticamente ya muestra ese día.',
  // studio-properties
  'help.guide.studio-properties.title': 'Editar lo que seleccionaste',
  'help.guide.studio-properties.goal': 'Mueve, recorta, da estilo y apila un elemento con el inspector.',
  'help.guide.studio-properties.step.1':
    'Haz clic en un elemento de la doble página. Aparecen asas para tamaño y rotación; arrástralo para moverlo.',
  'help.guide.studio-properties.step.2':
    'Properties a la derecha sigue a la selección: posición y tamaño, Crop con el punto focal que decide qué queda dentro del marco, Fill o Fit, los filtros de Look, el radio en Corner, el estilo en Marco, el orden de apilamiento y Lock.',
  'help.guide.studio-properties.step.3':
    'Duplicar y Delete están arriba del inspector; Undo en la barra superior revierte cualquiera de ellos.',
  'help.guide.studio-properties.result':
    'Un elemento bloqueado ya no se puede agarrar en la página, lo que mantiene a salvo un diseño terminado mientras trabajas alrededor.',
  'help.guide.studio-properties.tip.1':
    'Mayús+clic selecciona varios elementos; el inspector los edita entonces juntos.',
  'help.guide.studio-properties.tip.2':
    'Editar un elemento que colocó Auto layout rompe su vínculo con la entrada; deja de seguir los cambios posteriores de esa entrada.',
  // studio-format
  'help.guide.studio-format.title': 'Elegir el formato de página',
  'help.guide.studio-format.goal': 'Fija el tamaño al que se imprimirá el libro, antes de que el diseño dependa de él.',
  'help.guide.studio-format.step.1': 'Haz clic en Page format en la barra superior.',
  'help.guide.studio-format.step.2':
    'Elige Square 21 × 21 cm, Square 30 × 30 cm, A4 o A5 landscape o portrait, o introduce un ancho y un alto propios en milímetros. Sangrado y Seguridad están justo debajo.',
  'help.guide.studio-format.result':
    'Cada doble página se dibuja a ese tamaño, con 3 mm de sangrado y 5 mm de margen de seguridad por defecto.',
  'help.guide.studio-format.tip.1':
    'Cambia primero el formato y después lanza Auto layout; el diseño se construye para el tamaño que encuentra.',
  'help.guide.studio-format.tip.2': 'Pide a tu imprenta sus valores de sangrado y seguridad e introduce esos.',
  // studio-export
  'help.guide.studio-export.title': 'Exportar el libro como PDF',
  'help.guide.studio-export.goal': 'Consigue un archivo listo para imprimir, o uno para leer en pantalla.',
  'help.guide.studio-export.step.1': 'Haz clic en Export en la barra superior.',
  'help.guide.studio-export.step.2':
    'Elige Páginas sueltas, una página por hoja en orden de lectura, que es lo que quiere una imprenta, o Pliegos, dos páginas a la vez tal como se abre el libro. Marcas de corte añade el sangrado en cada borde y marca por dónde cortar.',
  'help.guide.studio-export.step.3':
    'Haz clic en Vista de impresión. Tu navegador abre las páginas y Guardar como PDF las convierte en el archivo.',
  'help.guide.studio-export.result':
    'Un PDF con tantas hojas como anunció el diálogo, en el formato de página que fijaste.',
  'help.guide.studio-export.tip.1': 'Crear el PDF es solo para escritorio, como el propio Studio.',
  'help.guide.studio-export.tip.2':
    'Para una prueba, exporta Pliegos sin marcas de corte; para la imprenta, Páginas sueltas con ellas.',
  // studio-spread-file
  'help.guide.studio-spread-file.title': 'Reutilizar una doble página en otro libro',
  'help.guide.studio-spread-file.goal': 'Llévate un diseño que te gusta del libro de una travesía a otro.',
  'help.guide.studio-spread-file.step.1':
    'Con la doble página en la mesa de trabajo, haz clic en Descargar esta doble página en el extremo derecho de la barra de zoom. El archivo guarda el diseño, no las fotografías.',
  'help.guide.studio-spread-file.step.2':
    'En el otro libro, abre Pages y haz clic en Importar junto a Añadir página, después elige el archivo.',
  'help.guide.studio-spread-file.result':
    'La doble página llega con sus marcos y estilos de texto; suelta las fotos de la nueva travesía en los marcos.',
  'help.guide.studio-spread-file.tip.1': 'Un archivo que no es un diseño de doble página se rechaza con un motivo.',

  // ── Screen: settings (all tabs) ───────────────────────────────────────────────────────
  'help.ctx.settings.title': 'Ajustes',
  'help.ctx.settings.summary':
    'Tus ajustes personales, una pestaña por tema en la barra lateral de la izquierda. La mayoría de los interruptores se aplican en cuanto los cambias; un formulario con un botón Guardar abajo espera a que lo pulses. Nada de aquí cambia el TREK de nadie más.',
  'help.ctx.settings.bullet.1':
    'Barra lateral izquierda: Pantalla, Appearance, Mapa, Notificaciones, Integraciones, Offline y Cuenta. Complementos aparece en cuanto hay uno instalado, Acerca de allí donde el admin no lo haya quitado.',
  'help.ctx.settings.bullet.2':
    'Pantalla es idioma, unidades, moneda y con qué se abre la app; Appearance es tema, colores, tamaño del texto y los widgets del panel.',
  'help.ctx.settings.bullet.3':
    'Mapa elige el motor de renderizado y su estilo; Notificaciones los canales que te llegan; Integraciones bibliotecas de fotos, claves API y MCP; Offline lo que la app guarda en este dispositivo.',
  'help.ctx.settings.bullet.4':
    'Cuenta contiene tu perfil, contraseña, autenticación de dos factores, passkeys y la eliminación de tu cuenta.',
  'help.ctx.settings-display.title': 'Pantalla',
  'help.ctx.settings-display.summary':
    'Idioma, unidades y moneda, cómo se comportan el mapa y las reservas, y con qué se abre TREK. Cada cambio aquí se aplica al momento.',
  'help.ctx.settings-display.bullet.1':
    'Language & region: el idioma de la interfaz, el formato de hora, el primer día de la semana, la moneda de visualización, y las unidades de distancia y temperatura.',
  'help.ctx.settings-display.bullet.2':
    'Travel & map: rutas de reserva siempre en el mapa, la píldora Explorar lugares, optimización de la ruta desde tu alojamiento, códigos de reserva difuminados y rutas de reserva etiquetadas.',
  'help.ctx.settings-display.bullet.3':
    'Inicio: si TREK se abre en el panel o en el viaje activo, y qué pestaña de un viaje sale primero.',
  'help.ctx.settings-appearance.title': 'Appearance',
  'help.ctx.settings-appearance.summary':
    'Cómo se ve TREK en esta cuenta: claro u oscuro, el color de acento, cristal y movimiento, tamaño del texto, y qué widgets muestra el panel. Todo se aplica en vivo, en cada dispositivo en el que inicies sesión.',
  'help.ctx.settings-appearance.bullet.1':
    'Theme: Claro, Oscuro o Automático, y el Color scheme con un Custom accent tuyo.',
  'help.ctx.settings-appearance.bullet.2':
    'Readability: Transparency, Reduce motion, Density y Text size, con tamaños avanzados por nivel.',
  'help.ctx.settings-appearance.bullet.3':
    'Dashboard widgets: un interruptor por widget, por separado para Desktop y Mobile.',
  'help.ctx.settings-appearance.bullet.4': 'Reset to defaults abajo lo devuelve todo a su sitio.',
  'help.ctx.settings-map.title': 'Mapa',
  'help.ctx.settings-map.summary':
    'Qué motor dibuja los mapas y con qué estilo. Leaflet es el mapa ráster clásico, MapLibre dibuja mosaicos vectoriales sin ningún token, Mapbox añade edificios 3D y terreno con tu propio token.',
  'help.ctx.settings-map.bullet.1':
    'Proveedor de mapa: Leaflet, MapLibre o Mapbox, cada uno con una línea sobre lo que necesita.',
  'help.ctx.settings-map.bullet.2':
    'Estilo de mapa y Plantilla del mapa: el aspecto de los mosaicos, más el token o la clave que pide un proveedor.',
  'help.ctx.settings-map.bullet.3':
    'Modo de alta calidad para el antialiasing y la proyección de globo; Guardar mapa escribe la elección.',
  'help.ctx.settings-notifications.title': 'Notificaciones',
  'help.ctx.settings-notifications.summary':
    'Dónde te localiza TREK fuera de la app: notificaciones push en este dispositivo, un tema de ntfy, un webhook o un canal que aporta un complemento. Bajo los canales, una fila por evento decide qué va a dónde.',
  'help.ctx.settings-notifications.bullet.1':
    'ntfy: el tema, un servidor propio opcional y un token de acceso opcional, con Probar para enviar uno al momento.',
  'help.ctx.settings-notifications.bullet.2': 'Webhook: una URL que recibe cada evento como JSON, con Probar.',
  'help.ctx.settings-notifications.bullet.3':
    'Notificaciones push en este dispositivo: Activar en este dispositivo solo cubre el navegador que estás usando, así que repítelo en cada móvil u ordenador. Enviar prueba llega a todos.',
  'help.ctx.settings-notifications.bullet.4':
    'Las filas de preferencias: por evento, qué canal está activo. Los canales de complementos muestran Configurar hasta que estén configurados.',
  'help.ctx.settings-integrations.title': 'Integraciones',
  'help.ctx.settings-integrations.summary':
    'Todo lo que se conecta a TREK desde fuera: bibliotecas de fotos para la travesía, claves API para scripts, y el endpoint MCP con sus tokens y clientes OAuth para asistentes de IA.',
  'help.ctx.settings-integrations.bullet.1':
    'Proveedores de fotos: Immich y Synology Photos, cada uno con su URL y su clave, Probar conexión y Guardar.',
  'help.ctx.settings-integrations.bullet.2':
    'Claves API: claves personales para scripts y otras herramientas que llaman a la API de TREK en tu nombre.',
  'help.ctx.settings-integrations.bullet.3':
    'Configuración MCP: el endpoint, una configuración de cliente lista para copiar, y los tokens de API.',
  'help.ctx.settings-integrations.bullet.4':
    'Clientes OAuth 2.1: apps que inician sesión a través de TREK, con URIs de redirección, ámbitos permitidos, clientes de máquina y las sesiones activas.',
  'help.ctx.settings-offline.title': 'Offline',
  'help.ctx.settings-offline.summary':
    'Lo que TREK guarda en este dispositivo para que un viaje siga abriéndose sin conexión, y qué pasa cuando un cambio hecho offline choca con otro hecho en otro sitio.',
  'help.ctx.settings-offline.bullet.1':
    'Modo offline: Forzar el modo offline hace que la app se comporte como si no hubiera red, para probar o en una conexión con datos limitados.',
  'help.ctx.settings-offline.bullet.2':
    'Prepárate para estar offline: Descargar para uso offline trae ahora tus viajes y sus mosaicos del mapa.',
  'help.ctx.settings-offline.bullet.3':
    'Qué almacenar offline: mosaicos del mapa activados o no, y un interruptor por viaje.',
  'help.ctx.settings-offline.bullet.4':
    'Conflictos de sincronización y Caché offline: la estrategia para las colisiones, el recuento de cambios pendientes y fallidos, Volver a sincronizar ahora y Vaciar caché.',
  'help.ctx.settings-account.title': 'Cuenta',
  'help.ctx.settings-account.summary':
    'Quién eres en este TREK y cómo inicias sesión: perfil y avatar, contraseña, autenticación de dos factores, passkeys, y al final del todo la eliminación de la cuenta.',
  'help.ctx.settings-account.bullet.1': 'Perfil: usuario, correo y avatar, guardados con Guardar perfil.',
  'help.ctx.settings-account.bullet.2':
    'Cambiar contraseña: contraseña actual, la nueva dos veces, Actualizar contraseña.',
  'help.ctx.settings-account.bullet.3':
    'Autenticación de dos factores (2FA) con una app de autenticación y códigos de respaldo; Passkeys para iniciar sesión sin contraseña.',
  'help.ctx.settings-account.bullet.4':
    'Eliminar cuenta abajo, tras una confirmación. El último admin no puede eliminarse a sí mismo.',
  // language-region
  'help.guide.language-region.title': 'Elegir idioma, unidades y moneda',
  'help.guide.language-region.goal': 'Haz que TREK hable tu idioma y cuente como tú.',
  'help.guide.language-region.step.1':
    'Elige el idioma de la interfaz en Language & region. TREK cambia al momento, en cada dispositivo en el que inicies sesión.',
  'help.guide.language-region.step.2':
    'Debajo, elige el formato de hora, el día en que comienza la semana en todos los selectores de fecha, la moneda de visualización, y las unidades de distancia y temperatura.',
  'help.guide.language-region.result':
    'Fechas, distancias y dinero se leen como esperas; la moneda propia de un viaje sigue apareciendo junto a los importes convertidos.',
  'help.guide.language-region.tip.1':
    'La moneda de visualización es para los totales entre viajes; cada viaje conserva la moneda que le diste.',
  'help.guide.language-region.tip.2': 'El idioma también fija los nombres de días y meses en Vacay y en la travesía.',
  // travel-map-prefs
  'help.guide.travel-map-prefs.title': 'Ajustar cómo se comportan el mapa y las reservas',
  'help.guide.travel-map-prefs.goal': 'Decide qué muestra el mapa del viaje por defecto.',
  'help.guide.travel-map-prefs.step.1':
    'En Travel & map, Mostrar siempre las rutas de reserva mantiene vuelos y trenes en el mapa aunque su día no esté abierto; Explorar lugares en el mapa muestra la píldora para encontrar lugares; Optimizar la ruta desde el alojamiento empieza la ruta donde duermes.',
  'help.guide.travel-map-prefs.step.2':
    'Difuminar códigos de reserva oculta los números de confirmación hasta que pasas el ratón; Etiquetas de rutas de reservas escribe el nombre de la reserva a lo largo de su ruta.',
  'help.guide.travel-map-prefs.result':
    'El mapa del viaje sigue estos ajustes en todos los viajes, hasta que los vuelvas a cambiar.',
  'help.guide.travel-map-prefs.tip.1':
    'Son por cuenta, no por viaje. Cada miembro de un viaje compartido ve sus propias elecciones.',
  // startup
  'help.guide.startup.title': 'Elegir con qué se abre TREK',
  'help.guide.startup.goal': 'Aterriza donde más trabajas, no en el panel cada vez.',
  'help.guide.startup.step.1': 'En Inicio, pon Página de inicio en Panel o Viaje activo.',
  'help.guide.startup.step.2': 'Pestaña de inicio elige qué pestaña de un viaje sale primero cuando abres uno.',
  'help.guide.startup.result': 'El próximo inicio de sesión y el próximo toque en el logo te llevan directo allí.',
  'help.guide.startup.tip.1': 'Viaje activo es el viaje en curso hoy, o el siguiente cuando no hay ninguno.',
  // theme-scheme
  'help.guide.theme-scheme.title': 'Elegir el tema y el color de acento',
  'help.guide.theme-scheme.goal': 'Pon TREK claro, oscuro o como tu dispositivo, en el color que te guste.',
  'help.guide.theme-scheme.step.1': 'En Theme, elige Claro, Oscuro o Automático. Automático sigue a tu dispositivo.',
  'help.guide.theme-scheme.step.2':
    'Elige un Color scheme: Default, High contrast, Indigo, Teal, Rose, Amber, Violet o Custom.',
  'help.guide.theme-scheme.step.3':
    'Con Custom, elige un acento de los predefinidos o introduce el tuyo. Una comprobación de contraste al lado dice si el texto sigue siendo legible encima.',
  'help.guide.theme-scheme.result':
    'Botones, enlaces y resaltados toman el acento en todas partes, en cada dispositivo en el que inicies sesión.',
  'help.guide.theme-scheme.tip.1':
    'La barra de navegación también tiene un interruptor rápido claro u oscuro; fija el mismo tema.',
  'help.guide.theme-scheme.tip.2':
    'High contrast es el esquema a elegir cuando el predeterminado se lee demasiado suave.',
  // readability
  'help.guide.readability.title': 'Ajustar la legibilidad y el tamaño del texto',
  'help.guide.readability.goal': 'Menos cristal, menos movimiento, más espacio o letra más grande.',
  'help.guide.readability.step.1':
    'En Readability, Transparency cambia los paneles de cristal por superficies sólidas, Reduce motion reduce las animaciones al mínimo, y Density elige Comfortable o Compact.',
  'help.guide.readability.step.2':
    'Text size escala Everything de una vez; Advanced text sizes deja que títulos, subtítulos, cuerpo y pies difieran.',
  'help.guide.readability.result': 'Toda la app sigue al momento, incluidos los paneles del mapa y la travesía.',
  'help.guide.readability.tip.1': 'Reduce motion también sigue el ajuste de tu sistema cuando lo dejas en paz.',
  'help.guide.readability.tip.2':
    'El tamaño del texto se aplica a través de los niveles tipográficos, así que nada se corta; un tamaño que ya no cabe salta de línea.',
  // dashboard-widgets
  'help.guide.dashboard-widgets.title': 'Elegir los widgets del panel',
  'help.guide.dashboard-widgets.goal':
    'Muestra solo los widgets que usas, por separado en el escritorio y en el móvil.',
  'help.guide.dashboard-widgets.step.1':
    'En Dashboard widgets, activa o desactiva cada widget para Desktop y para Mobile: la barra lateral derecha entera, moneda, colecciones, zonas horarias, próximas reservas, países del Atlas y las cifras de viaje.',
  'help.guide.dashboard-widgets.step.2': 'Reset to defaults abajo devuelve toda la pestaña a como venía.',
  'help.guide.dashboard-widgets.result':
    'El panel se reordena al momento; con la barra lateral derecha apagada se centra.',
  'help.guide.dashboard-widgets.tip.1':
    'Los widgets de un addon solo aparecen mientras el admin tenga ese addon activado.',
  'help.guide.dashboard-widgets.tip.2':
    'El propio panel recuerda tu vista de cuadrícula o lista y el orden por dispositivo.',
  // map-provider
  'help.guide.map-provider.title': 'Elegir el motor y el estilo del mapa',
  'help.guide.map-provider.goal': 'Cambia entre el mapa clásico, los mosaicos vectoriales y el mapa 3D de Mapbox.',
  'help.guide.map-provider.step.1':
    'En Proveedor de mapa, elige Leaflet para el mapa 2D clásico con cualquier mosaico ráster, MapLibre para mosaicos vectoriales de OpenFreeMap sin token, o Mapbox para mosaicos vectoriales con edificios 3D y terreno.',
  'help.guide.map-provider.step.2':
    'Elige un Estilo de mapa o una Plantilla del mapa para el aspecto. Mapbox necesita un Token de acceso de Mapbox, algunos estilos ráster una Clave de API de CARTO; el enlace junto al campo lleva a donde conseguir uno.',
  'help.guide.map-provider.step.3':
    'Modo de alta calidad añade antialiasing y la proyección de globo. Haz clic en Guardar mapa.',
  'help.guide.map-provider.result':
    'Cada mapa de TREK, viajes, Atlas, Colecciones y la travesía, lo dibuja el motor que elegiste.',
  'help.guide.map-provider.tip.1': 'Sin token, Mapbox recurre al mapa predeterminado en lugar de no mostrar nada.',
  'help.guide.map-provider.tip.2':
    'Los mosaicos del mapa que almacenas offline vienen del proveedor activo cuando los descargas.',
  // notification-channels
  'help.guide.notification-channels.title': 'Configurar dónde te llegan las notificaciones',
  'help.guide.notification-channels.goal':
    'Recibe recordatorios de viaje y eventos de colaboración en tu móvil o en otra herramienta.',
  'help.guide.notification-channels.step.1':
    'En Notificaciones, rellena un Tema de Ntfy; añade tu propia URL del servidor Ntfy (opcional) y un Token de acceso (opcional) si tienes uno. Probar envía un mensaje al instante.',
  'help.guide.notification-channels.step.2':
    'O indica una URL del webhook que reciba cada evento como JSON, y pruébala igual con Probar.',
  'help.guide.notification-channels.step.3':
    'En las filas de abajo, activa o desactiva cada evento por canal. Un canal de complemento dice Configurar hasta que esté configurado en los ajustes del complemento; Enviar prueba prueba uno.',
  'help.guide.notification-channels.result':
    'Los eventos salen por los canales activos. La campana de la barra de navegación sigue mostrándolos en la app de todos modos.',
  'help.guide.notification-channels.tip.1':
    'Las preferencias por viaje viven en el propio viaje, en sus ajustes de notificación.',
  'help.guide.notification-channels.tip.2':
    'El admin puede prerrellenar un servidor ntfy predeterminado para todos; tú sigues eligiendo tu propio tema.',
  // photo-providers
  'help.guide.photo-providers.title': 'Conectar una biblioteca de fotos',
  'help.guide.photo-providers.goal': 'Deja que la travesía tome las fotos del día desde Immich o Synology Photos.',
  'help.guide.photo-providers.step.1':
    'En Integraciones, busca la sección del proveedor e introduce su URL y su clave API. Immich también ofrece reflejar las subidas de la travesía de vuelta en la biblioteca.',
  'help.guide.photo-providers.step.2': 'Haz clic en Probar conexión y luego en Guardar.',
  'help.guide.photo-providers.result':
    'La pestaña External photos del editor de entradas busca en la biblioteca conectada el día de la entrada, primero las más cercanas a la ubicación de la entrada.',
  'help.guide.photo-providers.tip.1':
    'La conexión es tuya: los demás miembros de una travesía conectan sus propias bibliotecas.',
  'help.guide.photo-providers.tip.2':
    'Un proveedor sin datos GPS en sus fotos funciona igual; la lista va entonces en orden de tiempo.',
  // api-keys
  'help.guide.api-keys.title': 'Crear una clave API',
  'help.guide.api-keys.goal': 'Deja que un script u otra herramienta llame a la API de TREK como tú.',
  'help.guide.api-keys.step.1': 'En Claves API, haz clic en Crear clave y dale un nombre que diga dónde se usará.',
  'help.guide.api-keys.step.2':
    'Copia la clave del diálogo: se muestra una sola vez. Elimina una clave de la lista cuando la herramienta ya no la necesite.',
  'help.guide.api-keys.result':
    'Las peticiones con esa clave actúan con tus permisos; la lista muestra cuándo se creó y se usó por última vez cada clave.',
  'help.guide.api-keys.tip.1': 'Una clave por herramienta hace que revocar sea indoloro.',
  'help.guide.api-keys.tip.2':
    'Para un asistente de IA usa MCP con OAuth en su lugar; las claves API son para clientes HTTP simples.',
  // mcp-oauth
  'help.guide.mcp-oauth.title': 'Conectar un asistente de IA por MCP',
  'help.guide.mcp-oauth.goal': 'Da a Claude, a un IDE o a otro cliente MCP acceso a tus viajes.',
  'help.guide.mcp-oauth.step.1':
    'En Configuración MCP, copia el Endpoint MCP, o toda la Configuración del cliente para un cliente que acepte un fragmento JSON.',
  'help.guide.mcp-oauth.step.2':
    'Los clientes que inician sesión por el navegador usan OAuth 2.1: Nuevo cliente en Clientes OAuth 2.1, con sus URIs de redirección, los Ámbitos permitidos y, para un servidor sin navegador, Cliente de máquina.',
  'help.guide.mcp-oauth.step.3':
    'Renovar secreto y Eliminar cliente están en cada cliente; Sesiones OAuth activas lista lo que tiene sesión iniciada y te deja revocarlo. Tokens de API con Crear nuevo token es la vía antigua de entrada.',
  'help.guide.mcp-oauth.result':
    'El cliente puede leer y cambiar lo que sus ámbitos permiten, como tú, y cada acción aparece con tu nombre.',
  'help.guide.mcp-oauth.tip.1':
    'Los ámbitos son la red de seguridad: da a un cliente solo el ámbito de lectura hasta que necesite más.',
  'help.guide.mcp-oauth.tip.2': 'El admin puede desactivar MCP para toda la instancia; entonces esta sección no está.',
  // offline-prepare
  'help.guide.offline-prepare.title': 'Llevarte viajes offline',
  'help.guide.offline-prepare.goal':
    'Ten tus viajes y sus mapas en este dispositivo antes de que se caiga la conexión.',
  'help.guide.offline-prepare.step.1':
    'En Qué almacenar offline, deja Almacenar mosaicos del mapa offline activado y activa los viajes que quieras en este dispositivo.',
  'help.guide.offline-prepare.step.2':
    'Haz clic en Descargar para uso offline en Prepárate para estar offline. Trae los viajes y los mosaicos alrededor de sus lugares.',
  'help.guide.offline-prepare.step.3':
    'Forzar el modo offline en Modo offline te deja comprobar que está todo antes de salir.',
  'help.guide.offline-prepare.result':
    'Los viajes se abren sin conexión; los cambios que hagas esperan en una cola y salen al reconectar.',
  'help.guide.offline-prepare.tip.1':
    'Los mosaicos son lo que más espacio ocupa: la sección Caché offline muestra lo que hay almacenado, por viaje.',
  'help.guide.offline-prepare.tip.2': 'Instala TREK como app desde el navegador para el arranque offline más fluido.',
  // offline-conflicts
  'help.guide.offline-conflicts.title': 'Decidir qué gana en un conflicto de sincronización',
  'help.guide.offline-conflicts.goal':
    'Elige cómo resuelve TREK un cambio hecho offline frente a otro hecho en otro sitio.',
  'help.guide.offline-conflicts.step.1':
    'En Conflictos de sincronización, elige Preguntarme cada vez, Conservar siempre mi versión o Conservar siempre la versión del servidor.',
  'help.guide.offline-conflicts.step.2':
    'Caché offline muestra viajes, cambios pendientes y fallidos y conflictos; Volver a sincronizar ahora empuja la cola, Vaciar caché vacía el dispositivo.',
  'help.guide.offline-conflicts.result':
    'Con Preguntarme, un conflicto muestra ambas versiones y te deja elegir; con las otras dos se resuelve en silencio.',
  'help.guide.offline-conflicts.tip.1':
    'Vaciar caché solo elimina la copia de este dispositivo; nada del servidor se toca.',
  // profile
  'help.guide.profile.title': 'Cambiar tu perfil',
  'help.guide.profile.goal': 'Actualiza tu nombre, correo e imagen.',
  'help.guide.profile.step.1':
    'En Cuenta, edita Usuario y Correo. El avatar admite una subida tuya; quítalo para volver a las iniciales.',
  'help.guide.profile.step.2': 'Haz clic en Guardar perfil.',
  'help.guide.profile.result':
    'Tu nombre e imagen se actualizan en todas partes a la vez, incluidos los viajes que compartes.',
  'help.guide.profile.tip.1':
    'Una cuenta que inicia sesión por OIDC lo muestra aquí; el correo viene entonces del proveedor.',
  // password
  'help.guide.password.title': 'Cambiar tu contraseña',
  'help.guide.password.goal': 'Pon una contraseña nueva.',
  'help.guide.password.step.1': 'En Cambiar contraseña, escribe tu contraseña actual y luego la nueva dos veces.',
  'help.guide.password.step.2': 'Haz clic en Actualizar contraseña.',
  'help.guide.password.result':
    'La nueva contraseña vale desde el próximo inicio de sesión; las demás sesiones siguen abiertas.',
  'help.guide.password.tip.1': 'Una cuenta que inicia sesión por OIDC no tiene contraseña de TREK que cambiar.',
  // mfa
  'help.guide.mfa.title': 'Activar la autenticación de dos factores',
  'help.guide.mfa.goal': 'Protege la cuenta con un código de una app de autenticación.',
  'help.guide.mfa.step.1': 'En Autenticación de dos factores (2FA), haz clic en Configurar autenticador.',
  'help.guide.mfa.step.2':
    'Escanea el código QR con tu app, o introduce el secreto a mano, luego teclea el código de seis dígitos que muestra y haz clic en Activar 2FA.',
  'help.guide.mfa.step.3':
    'Guarda los códigos de respaldo: cópialos, descárgalos o imprímelos. Cada uno sirve una vez, cuando no tienes el móvil a mano.',
  'help.guide.mfa.result': 'Cada inicio de sesión pide un código después de la contraseña.',
  'help.guide.mfa.tip.1': 'Desactivar 2FA necesita tu contraseña y un código vigente.',
  'help.guide.mfa.tip.2': 'El admin puede exigir 2FA a todos; entonces no se puede desactivar aquí.',
  // passkeys
  'help.guide.passkeys.title': 'Iniciar sesión con una passkey',
  'help.guide.passkeys.goal': 'Usa la huella, la cara o el PIN de tu dispositivo en lugar de una contraseña.',
  'help.guide.passkeys.step.1':
    'En Passkeys, haz clic en Añadir una passkey y confirma con tu dispositivo. Dale un nombre que diga qué dispositivo es.',
  'help.guide.passkeys.step.2':
    'La lista muestra cada passkey con su nombre y su último uso; el botón de eliminar quita una.',
  'help.guide.passkeys.result': 'La página de inicio de sesión ofrece la passkey; la contraseña queda como respaldo.',
  'help.guide.passkeys.tip.1':
    'Una passkey vive en el dispositivo o en su gestor de contraseñas, así que añade una por dispositivo.',
  'help.guide.passkeys.tip.2':
    'Las passkeys necesitan HTTPS; en una instancia con HTTP simple la sección explica por qué no están disponibles.',
  // delete-account
  'help.guide.delete-account.title': 'Eliminar tu cuenta',
  'help.guide.delete-account.goal': 'Elimina tu cuenta y los datos que son solo tuyos.',
  'help.guide.delete-account.step.1': 'Al final del todo de Cuenta, haz clic en Eliminar cuenta y confirma.',
  'help.guide.delete-account.result':
    'Tu cuenta, tus propios viajes y tus travesías desaparecen; los viajes que compartes con otros se quedan con ellos.',
  'help.guide.delete-account.tip.1':
    'El último admin de una instancia no puede eliminarse a sí mismo; haz admin a otra persona antes.',
  'help.guide.delete-account.tip.2': 'No hay vuelta atrás. Exporta lo que quieras conservar antes de confirmar.',

  // ── Screen: admin (all tabs) ──────────────────────────────────────────────────────────
  'help.ctx.admin.title': 'Administración',
  'help.ctx.admin.summary':
    'La instancia detrás del TREK de todos: quién puede iniciar sesión y cómo, qué está activado, dónde viven los archivos, cómo llega el servidor a la gente y cómo se respalda. Solo los admins ven esta página; cada pestaña es una pantalla propia en la barra lateral.',
  'help.ctx.admin.bullet.1':
    'Las cuatro tarjetas de arriba cuentan usuarios, viajes, lugares y archivos; un banner encima anuncia una versión más nueva de TREK.',
  'help.ctx.admin.bullet.2':
    'Usuarios y Valores predeterminados: cuentas, enlaces de invitación y los ajustes de mapa con los que arranca una cuenta nueva.',
  'help.ctx.admin.bullet.3':
    'Personalización, Ajustes, Complementos y Plugins: plantillas de equipaje, categorías y vacaciones escolares; métodos de inicio de sesión y claves API; los módulos de funciones; plugins de terceros.',
  'help.ctx.admin.bullet.4':
    'Almacenamiento, Notificaciones, Acceso MCP y GitHub: adónde van las subidas, los canales de toda la instancia, tokens y sesiones de clientes de IA, y el historial de versiones.',
  'help.ctx.admin.bullet.5':
    'Copia de seguridad y Auditoría: copias bajo demanda y programadas, y el registro de eventos relevantes para la seguridad.',
  'help.ctx.admin-users.title': 'Usuarios',
  'help.ctx.admin-users.summary':
    'Cada cuenta de este TREK, con rol, correo y último inicio de sesión, y los enlaces de invitación que permiten a la gente registrarse en una instancia cerrada.',
  'help.ctx.admin-users.bullet.1':
    'La tabla: usuario, correo, rol, fecha de creación, último acceso y las acciones por fila. Tú apareces marcado como tú.',
  'help.ctx.admin-users.bullet.2': 'Crear usuario arriba añade una cuenta a mano, con una contraseña que entregas tú.',
  'help.ctx.admin-users.bullet.3':
    'Enlaces de invitación debajo: enlaces de registro de un solo uso con un límite de usos, una caducidad y, si quieres, un viaje al que el nuevo usuario se une al llegar.',
  'help.ctx.admin-users.bullet.4':
    'Configuración de permisos al final: por acción, quién puede hacerla, Todos, Miembros del viaje, Propietario del viaje o Solo administrador.',
  'help.ctx.admin-defaults.title': 'Valores predeterminados',
  'help.ctx.admin-defaults.summary':
    'Los ajustes con los que arranca una cuenta nueva, para que nadie tenga que buscar primero la pestaña del mapa: motor de mapas, estilo, tokens y calidad.',
  'help.ctx.admin-defaults.bullet.1':
    'Motor de mapas, estilo y token de Mapbox, clave de CARTO y calidad de Mapbox, exactamente como los pondría un usuario en Ajustes, Mapa.',
  'help.ctx.admin-defaults.bullet.2':
    'Restaurar por campo devuelve la elección propia de TREK; el ajuste propio de un usuario siempre gana a estos.',
  'help.ctx.admin-config.title': 'Personalización',
  'help.ctx.admin-config.summary':
    'Lo que comparten todos los viajes de la instancia: plantillas de equipaje, el conjunto de categorías para lugares y colecciones, y el catálogo de vacaciones escolares del que bebe Vacay.',
  'help.ctx.admin-config.bullet.1':
    'Plantillas de equipaje: listas con nombre de categorías y artículos de las que puede partir la lista de equipaje de un viaje.',
  'help.ctx.admin-config.bullet.2':
    'Categorías: nombre, icono y color de las categorías que se usan en todo TREK, del inspector de lugares a Colecciones.',
  'help.ctx.admin-config.bullet.3':
    'Vacaciones escolares: el catálogo de países y regiones, para sitios que las fuentes integradas no cubren.',
  'help.ctx.admin-settings.title': 'Ajustes',
  'help.ctx.admin-settings.summary':
    'Cómo entra la gente y con qué puede hablar el servidor: métodos de inicio de sesión y registro, SSO, passkeys, política de dos factores, las claves API para mapas, lugares e imágenes, los proveedores de búsqueda y transporte, y los tipos de archivo que pueden tener las subidas.',
  'help.ctx.admin-settings.bullet.1':
    'Authentication Methods: Password Login, Password Registration, SSO Login, SSO Auto-Provisioning y Exigir autenticación en dos factores (2FA).',
  'help.ctx.admin-settings.bullet.2':
    'Inicio de sesión único (OIDC) con emisor, cliente y nombre visible; Inicio de sesión con passkey con Relying Party ID y orígenes.',
  'help.ctx.admin-settings.bullet.3':
    'Claves API: Google Maps, Unsplash y Amap, cada una con Probar; Para qué se usa la clave limita la clave de Google a las funciones que quieres pagar.',
  'help.ctx.admin-settings.bullet.4':
    'Proveedor de búsqueda de lugares y Proveedor de transporte público eligen quién responde a búsquedas y rutas; Tipos de archivo permitidos limita las subidas.',
  'help.ctx.admin-addons.title': 'Complementos',
  'help.ctx.admin-addons.summary':
    'Los módulos de funciones de TREK, cada uno con un interruptor: Listas, Costes, Documentos, Vacay, Atlas, Colaboración, Travesía, Colecciones, Viaje por carretera, MCP, AirTrail, Dawarich y el análisis con IA. Apagado significa que la entrada de navegación, las rutas y la API desaparecen para todos.',
  'help.ctx.admin-addons.bullet.1':
    'Un mosaico por complemento con su interruptor y, cuando las tiene, subfilas para sus opciones.',
  'help.ctx.admin-addons.bullet.2':
    'Los proveedores de fotos y de documentos también aparecen aquí como mosaicos, para ofrecer Immich o Synology a los usuarios.',
  'help.ctx.admin-addons.bullet.3': 'Seguimiento de equipaje tiene su propio interruptor bajo los mosaicos.',
  'help.ctx.admin-plugins.title': 'Plugins',
  'help.ctx.admin-plugins.summary':
    'Plugins de terceros que corren en su propio proceso junto a TREK, cada uno con los permisos que pidió al instalarse. Instala desde el catálogo, sube un paquete o enlaza una carpeta mientras desarrollas uno.',
  'help.ctx.admin-plugins.bullet.1':
    'La lista: cada plugin instalado con versión, estado, firma y los permisos que tiene; activar, desactivar, actualizar o desinstalar por fila.',
  'help.ctx.admin-plugins.bullet.2':
    'Subir plugin toma un archivo de paquete; Volver a escanear detecta una carpeta de plugin enlazada para desarrollo.',
  'help.ctx.admin-plugins.bullet.3':
    'Hosts permitidos por plugin: las direcciones a las que un plugin puede llamar, ya que la salida se deniega por defecto.',
  'help.ctx.admin-storage.title': 'Almacenamiento',
  'help.ctx.admin-storage.summary':
    'Dónde viven las subidas: el disco local, un bucket de S3 o un espejo que escribe en ambos. Cada categoría de subida puede ir a un backend distinto, y Estado dice si cada backend responde.',
  'help.ctx.admin-storage.bullet.1':
    'Backends: nombre y tipo de cada uno, con Probar, Editar y Quitar; uno fijado por el entorno es de solo lectura aquí.',
  'help.ctx.admin-storage.bullet.2':
    'Categorías: portadas, documentos, fotos de la travesía y el resto, cada una asignada a un backend; cambiar una ofrece mover los archivos existentes.',
  'help.ctx.admin-storage.bullet.3':
    'Estado: una comprobación por backend, y el archivo semilla que demuestra que la configuración es la que ve el servidor.',
  'help.ctx.admin-notifications.title': 'Notificaciones',
  'help.ctx.admin-notifications.summary':
    'Los canales que la instancia ofrece a sus usuarios, y los que te llegan a ti como admin. Los usuarios eligen sus propios temas y URL en Ajustes; tú decides qué existe y configuras el correo.',
  'help.ctx.admin-notifications.bullet.1':
    'In-App, Email (SMTP), Ntfy, Webhook y Web Push: un panel cada uno, con un interruptor que ofrece el canal a los usuarios y la configuración del lado del servidor que necesita.',
  'help.ctx.admin-notifications.bullet.2':
    'Recordatorios de viaje: si el servidor envía el recordatorio antes de que empiece un viaje.',
  'help.ctx.admin-notifications.bullet.3':
    'Ntfy de admin y Webhook de admin: adónde van los eventos de admin como una copia fallida o una versión nueva, con Probar.',
  'help.ctx.admin-mcp-tokens.title': 'Acceso MCP',
  'help.ctx.admin-mcp-tokens.summary':
    'Cada token y sesión OAuth que los clientes de IA tienen contra este TREK, de todos los usuarios, con el poder de revocar cualquiera.',
  'help.ctx.admin-mcp-tokens.bullet.1': 'Tokens de API: quién lo creó, cuándo se usó por última vez, y Eliminar.',
  'help.ctx.admin-mcp-tokens.bullet.2': 'Sesiones OAuth: el cliente, el usuario y los ámbitos concedidos, y Revocar.',
  'help.ctx.admin-github.title': 'GitHub',
  'help.ctx.admin-github.summary':
    'Qué hay de nuevo en TREK: el historial de versiones desde GitHub, la versión que ejecutas y si ha salido una más nueva. La actualización en sí ocurre fuera de la app, en el host.',
  'help.ctx.admin-github.bullet.1':
    'Historial de versiones lista las versiones con sus notas; la más nueva lleva Última, y la tuya está marcada.',
  'help.ctx.admin-github.bullet.2':
    'Actualización disponible aparece en la cabecera en cuanto existe una versión más nueva, con cómo actualizar en Docker y en otras instalaciones.',
  'help.ctx.admin-backup.title': 'Copia de seguridad',
  'help.ctx.admin-backup.summary':
    'Copias completas de la base de datos y las subidas, hechas a mano o programadas, guardadas en el servidor y descargables en un solo archivo. Restaurar devuelve una.',
  'help.ctx.admin-backup.bullet.1':
    'Copia de seguridad de datos: Crear copia, y la lista de las existentes con Descargar, Restaurar y eliminar.',
  'help.ctx.admin-backup.bullet.2':
    'Subir copia de seguridad trae un archivo hecho en otra instancia o en un día anterior.',
  'help.ctx.admin-backup.bullet.3': 'Copia automática: activada o no, intervalo, hora y día, y cuántas conservar.',
  'help.ctx.admin-audit.title': 'Auditoría',
  'help.ctx.admin-audit.summary':
    'El registro de eventos administrativos y relevantes para la seguridad: inicios de sesión y fallos, cambios de MFA, cambios de usuarios y ajustes, copias y restauraciones. Solo lectura, lo más nuevo primero.',
  'help.ctx.admin-audit.bullet.1': 'Una fila por evento con hora, usuario, acción, recurso, IP y detalles.',
  'help.ctx.admin-audit.bullet.2': 'Actualizar recarga; Cargar más retrocede más.',
  // create-user
  'help.guide.create-user.title': 'Crear un usuario',
  'help.guide.create-user.goal': 'Añade una cuenta a mano, sin invitación.',
  'help.guide.create-user.step.1': 'Haz clic en Crear usuario en la parte superior de la pestaña Usuarios.',
  'help.guide.create-user.step.2':
    'Introduce Usuario, Correo y una Contraseña, y elige el Rol: Usuario o Administrador.',
  'help.guide.create-user.step.3': 'Haz clic en Crear usuario.',
  'help.guide.create-user.result':
    'La cuenta aparece en la tabla y puede iniciar sesión de inmediato; entrega la contraseña por un canal en el que confíes.',
  'help.guide.create-user.tip.1':
    'Para alguien que deba elegir su propia contraseña, un enlace de invitación es la mejor forma de entrar.',
  'help.guide.create-user.tip.2':
    'Los admins ven esta página y el registro de auditoría; todo lo demás es igual para ambos roles.',
  // edit-user
  'help.guide.edit-user.title': 'Cambiar el rol o la contraseña de un usuario',
  'help.guide.edit-user.goal': 'Asciende a alguien, degrádalo o devuélvele el acceso tras perder la contraseña.',
  'help.guide.edit-user.step.1':
    'Haz clic en el lápiz de la fila del usuario. Editar usuario se abre con los datos de la cuenta.',
  'help.guide.edit-user.step.2':
    'Cambia el Rol, pon una Nueva contraseña, o haz clic en Restablecer passkeys cuando la persona haya perdido el dispositivo donde estaban sus passkeys, y luego Guardar.',
  'help.guide.edit-user.result':
    'El cambio se aplica en la siguiente petición; una contraseña nueva funciona desde el siguiente inicio de sesión.',
  'help.guide.edit-user.tip.1': 'No puedes quitarte el rol de admin mientras seas el último admin.',
  'help.guide.edit-user.tip.2':
    'Restablecer passkeys conserva la contraseña; la persona añade passkeys nuevas en Ajustes, Cuenta.',
  // invite-links
  'help.guide.invite-links.title': 'Invitar a alguien con un enlace',
  'help.guide.invite-links.goal':
    'Deja que una persona se registre en una instancia cerrada y, si quieres, aterrice en un viaje.',
  'help.guide.invite-links.step.1': 'En Enlaces de invitación, haz clic en Crear enlace.',
  'help.guide.invite-links.step.2':
    'Pon Usos máx. y Expira después de, opcionalmente Añadir a un viaje (opcional), y haz clic en Crear y copiar.',
  'help.guide.invite-links.step.3':
    'Envía el enlace. Cada fila muestra cuántas veces se usó y quién lo creó; Copiar enlace lo copia de nuevo, y los enlaces agotados o expirados están marcados.',
  'help.guide.invite-links.result':
    'Quien abra el enlace se registra con su propia contraseña y, si hay un viaje elegido, se une a él al momento.',
  'help.guide.invite-links.tip.1':
    'Los enlaces de invitación funcionan aunque Password Registration esté desactivado en Ajustes.',
  'help.guide.invite-links.tip.2':
    'Un enlace de un solo uso y caducidad corta es el valor más seguro para una sola persona.',
  // delete-user
  'help.guide.delete-user.title': 'Eliminar un usuario',
  'help.guide.delete-user.goal': 'Quita una cuenta y todo lo que solo le pertenece a ella.',
  'help.guide.delete-user.step.1':
    'Haz clic en el icono de papelera de la fila del usuario y confirma Eliminar usuario.',
  'help.guide.delete-user.result':
    'La cuenta, sus propios viajes y sus travesías desaparecen; los viajes compartidos con otros se quedan con los miembros restantes.',
  'help.guide.delete-user.tip.1': 'No se puede deshacer. Haz antes una copia de seguridad si no estás seguro.',
  'help.guide.delete-user.tip.2': 'El último admin no se puede eliminar; haz antes admin a otra persona.',
  // permissions
  'help.guide.permissions.title': 'Decidir quién puede hacer qué',
  'help.guide.permissions.goal': 'Define, por acción, qué rol tiene permiso para hacerla en este TREK.',
  'help.guide.permissions.step.1':
    'En Configuración de permisos, busca la acción en su grupo, por ejemplo Eliminar viajes en Gestión de viajes, y elige el nivel: Todos, Miembros del viaje, Propietario del viaje o Solo administrador. Una fila cambiada aparece marcada como personalizado.',
  'help.guide.permissions.step.2':
    'Haz clic en Guardar. Restablecer valores predeterminados devuelve cada fila al nivel integrado.',
  'help.guide.permissions.result':
    'La regla se aplica a todos los viajes a la vez; los botones y menús de quienes están por debajo del nivel desaparecen.',
  'help.guide.permissions.tip.1':
    'Propietario del viaje es la persona que creó el viaje; los admins siempre pueden hacerlo todo.',
  'help.guide.permissions.tip.2':
    'Baja un nivel antes que eliminar a un miembro: un miembro que no puede editar aún puede leer y comentar.',
  // default-map
  'help.guide.default-map.title': 'Fijar el mapa por defecto para usuarios nuevos',
  'help.guide.default-map.goal': 'Da a cada cuenta nueva un mapa que funcione sin token personal.',
  'help.guide.default-map.step.1':
    'En Mapa, elige el Motor de mapas y, para Mapbox o MapLibre, el Estilo de mapa, el Token de Mapbox compartido y el Modo de alta calidad; para un mapa ráster, la Plantilla del mapa y la Clave de CARTO compartida.',
  'help.guide.default-map.step.2':
    'Junto a cualquier campo que hayas cambiado, restaurar devuelve la elección propia de TREK. Configuración predeterminada de usuarios a la izquierda hace lo mismo para Modo de color, las unidades y la moneda.',
  'help.guide.default-map.result':
    'Las cuentas nuevas arrancan con esto; quien haya puesto su propio mapa en Ajustes conserva el suyo.',
  'help.guide.default-map.tip.1':
    'Un token introducido aquí lo comparten todos los que no tienen uno propio, así que vigila su cuota.',
  'help.guide.default-map.tip.2':
    'Las cuentas existentes que nunca tocaron la pestaña del mapa siguen también estos valores.',
  // packing-templates
  'help.guide.packing-templates.title': 'Crear una plantilla de equipaje',
  'help.guide.packing-templates.goal': 'Da a los viajes una lista de equipaje de partida en lugar de una vacía.',
  'help.guide.packing-templates.step.1': 'Haz clic en Nueva plantilla, escribe un nombre y confirma con la marca.',
  'help.guide.packing-templates.step.2':
    'Abre la plantilla y haz clic en Añadir categoría; bajo cada categoría, el + añade artículos, y un artículo solo necesita un nombre.',
  'help.guide.packing-templates.step.3':
    'Todo se guarda sobre la marcha. El lápiz renombra una plantilla, una categoría o un artículo, la papelera lo elimina.',
  'help.guide.packing-templates.result':
    'La plantilla se ofrece en la lista de equipaje de cada viaje; aplicarla copia los artículos, así que un viaje puede cambiarlos libremente.',
  'help.guide.packing-templates.tip.1':
    'Una plantilla por tipo de viaje, playa, ciudad, senderismo, es mejor que una lista gigante.',
  'help.guide.packing-templates.tip.2': 'Eliminar una plantilla no toca los viajes que ya la aplicaron.',
  // categories
  'help.guide.categories.title': 'Gestionar el conjunto de categorías',
  'help.guide.categories.goal':
    'Decide qué categorías pueden llevar los lugares y las colecciones, y qué aspecto tienen.',
  'help.guide.categories.step.1':
    'Haz clic en Nueva categoría, dale un nombre, elige un icono y un color; la Vista previa muestra el resultado. Haz clic en Crear.',
  'help.guide.categories.step.2':
    'Pasa el ratón por una categoría de la lista para editarla o eliminarla. Eliminar pide confirmación.',
  'help.guide.categories.result':
    'El conjunto se aplica en todas partes a la vez: el inspector de lugares, los pines del mapa, Colecciones y los filtros.',
  'help.guide.categories.tip.1':
    'Los lugares conservan su id de categoría, así que renombrar una categoría la renombra en cada lugar.',
  'help.guide.categories.tip.2':
    'Una categoría eliminada deja a sus lugares sin ninguna; reasígnalos antes si eso importa.',
  // school-holiday-catalog
  'help.guide.school-holiday-catalog.title': 'Mantener las vacaciones escolares a mano',
  'help.guide.school-holiday-catalog.goal':
    'Cubre un país o región que las fuentes de vacaciones integradas no cubren.',
  'help.guide.school-holiday-catalog.step.1':
    'En Vacaciones escolares, haz clic en Añadir país, introduce el País y su Código de país (p. ej. US), y Guardar; después Añadir región por cada parte que sea distinta.',
  'help.guide.school-holiday-catalog.step.2':
    'Haz clic en una región para abrir Región o distrito escolar: Añadir período, dale a cada uno un Nombre de las vacaciones, Fecha de inicio y Fecha de fin, y Guardar. La papelera quita un período, una región o, cuando ya no le quedan regiones, un país.',
  'help.guide.school-holiday-catalog.result':
    'Los usuarios encuentran el país y la región en Ajustes dentro de Vacay y ven los períodos en su cuadrícula anual.',
  'help.guide.school-holiday-catalog.tip.1':
    'Las regiones de las fuentes integradas no se pueden editar aquí; añade al lado una región manual si una fecha está mal.',
  // auth-methods
  'help.guide.auth-methods.title': 'Decidir cómo inicia sesión la gente',
  'help.guide.auth-methods.goal':
    'Abre o cierra el inicio de sesión con contraseña, el SSO y el registro, y exige 2FA.',
  'help.guide.auth-methods.step.1':
    'En Authentication Methods, activa o desactiva Password Login y Password Registration. Registro desactivado significa cuentas nuevas solo por enlaces de invitación, SSO o a mano.',
  'help.guide.auth-methods.step.2':
    'SSO Login y SSO Auto-Provisioning necesitan un Inicio de sesión único (OIDC) configurado más abajo; el aprovisionamiento automático crea una cuenta la primera vez que alguien entra por SSO.',
  'help.guide.auth-methods.step.3':
    'Exigir autenticación en dos factores (2FA) hace que cada inicio de sesión con contraseña configure un autenticador en el siguiente acceso. Inicio de sesión con passkey necesita el Relying Party ID y los orígenes por los que se llega a tu TREK.',
  'help.guide.auth-methods.result':
    'La página de inicio de sesión ofrece exactamente los métodos que dejaste activados.',
  'help.guide.auth-methods.tip.1':
    'Aparece un aviso antes de que te dejes fuera: al menos una vía de entrada para admins sigue activa.',
  'help.guide.auth-methods.tip.2': 'Los valores fijados por variables de entorno se muestran aquí como solo lectura.',
  // oidc
  'help.guide.oidc.title': 'Conectar el inicio de sesión único',
  'help.guide.oidc.goal': 'Deja que la gente inicie sesión con tu proveedor de identidad.',
  'help.guide.oidc.step.1':
    'En Inicio de sesión único (OIDC), introduce el Nombre visible para el botón y la URL del emisor, el Client ID y el Client Secret de tu proveedor, y luego Guardar.',
  'help.guide.oidc.step.2': 'Activa SSO Login en Authentication Methods.',
  'help.guide.oidc.result':
    'La página de inicio de sesión muestra el botón de SSO; con SSO Auto-Provisioning activado, quien entra por primera vez recibe una cuenta automáticamente.',
  'help.guide.oidc.tip.1':
    'La URI de redirección que necesita tu proveedor es la dirección de tu TREK más la ruta de callback de OIDC de la documentación.',
  'help.guide.oidc.tip.2':
    'El mapeo de claims decide qué grupos de SSO se convierten en admins; mira la página de OIDC en la documentación.',
  // instance-keys
  'help.guide.instance-keys.title': 'Introducir las claves API',
  'help.guide.instance-keys.goal':
    'Desbloquea la búsqueda de lugares de Google, las portadas de Unsplash y Amap para toda la instancia.',
  'help.guide.instance-keys.step.1':
    'En Claves API, pega la Clave API de Google Maps y haz clic en Probar; el campo dice si la clave responde.',
  'help.guide.instance-keys.step.2':
    'En Para qué se usa la clave, activa solo las funciones que quieres que se facturen a esa clave: autocompletado, detalles, fotos, enriquecimiento, el registro de búsquedas.',
  'help.guide.instance-keys.step.3':
    'Clave de API de Unsplash alimenta la búsqueda de portadas; Clave de API de Amap (高德地图) la búsqueda de lugares en China. Prueba cada una de la misma forma.',
  'help.guide.instance-keys.result':
    'Los usuarios obtienen las funciones sin claves propias; sin clave de Google, TREK busca a través de la pila libre de OpenStreetMap y la TREK Places API.',
  'help.guide.instance-keys.tip.1':
    'La clave personal de un usuario en Ajustes gana a la clave de la instancia para ese usuario.',
  'help.guide.instance-keys.tip.2':
    'Las claves también pueden venir de variables de entorno; esas se muestran aquí como solo lectura.',
  // places-transit
  'help.guide.places-transit.title': 'Elegir los proveedores de búsqueda y transporte',
  'help.guide.places-transit.goal':
    'Decide quién responde a las búsquedas de lugares y a las rutas de transporte público.',
  'help.guide.places-transit.step.1':
    'En Proveedor de búsqueda de lugares, elige Automático, Google Places, Amap (高德地图) u OpenStreetMap. Automático usa la mejor clave que exista.',
  'help.guide.places-transit.step.2':
    'En Proveedor de transporte público, elige Transitous (gratis), mundial y sin clave, o Google, que necesita la clave de Google.',
  'help.guide.places-transit.result':
    'Cada cuadro de búsqueda y cada ruta de transporte público en TREK sigue esa elección.',
  'help.guide.places-transit.tip.1': 'Un proveedor sin su clave muestra un aviso aquí y recurre a OpenStreetMap.',
  'help.guide.places-transit.tip.2': 'Las rutas de transporte de Google se facturan por petición; Transitous no.',
  // file-types
  'help.guide.file-types.title': 'Limitar los tipos de archivo',
  'help.guide.file-types.goal': 'Decide qué extensiones de archivo pueden tener las subidas.',
  'help.guide.file-types.step.1':
    'En Tipos de archivo permitidos, edita la lista de extensiones separadas por comas y guarda.',
  'help.guide.file-types.result':
    'Las subidas de cualquier otro tipo se rechazan con un mensaje claro, en los documentos, el diario y las portadas.',
  'help.guide.file-types.tip.1':
    'Mantén los tipos de imagen en la lista; las portadas y las fotos de la travesía pasan por la misma comprobación.',
  // toggle-addon
  'help.guide.toggle-addon.title': 'Activar o desactivar un complemento',
  'help.guide.toggle-addon.goal': 'Ofrece un módulo de funciones a todos, o quítalo.',
  'help.guide.toggle-addon.step.1':
    'Cambia el interruptor en el mosaico del complemento. La entrada de navegación aparece o desaparece para todos a la vez.',
  'help.guide.toggle-addon.step.2':
    'Algunos mosaicos llevan subfilas para sus opciones, como Seguimiento de equipaje bajo Listas o los proveedores de fotos bajo Travesía; solo se muestran mientras el complemento está activado.',
  'help.guide.toggle-addon.result':
    'Los datos de un complemento desactivado se conservan; volver a activarlo los muestra de nuevo.',
  'help.guide.toggle-addon.tip.1':
    'MCP desactivado quita el endpoint y las secciones de Integraciones que dependen de él.',
  'help.guide.toggle-addon.tip.2':
    'Vacay, Atlas y Travesía son los complementos que más piden los usuarios; Documentos necesita almacenamiento para las subidas.',
  // install-plugin
  'help.guide.install-plugin.title': 'Instalar un plugin',
  'help.guide.install-plugin.goal': 'Añade un plugin de terceros y dale exactamente los permisos que pide.',
  'help.guide.install-plugin.step.1':
    'Abre Descubrir, elige un plugin y haz clic en Instalar; o haz clic en Subir plugin y elige un paquete .zip o .tar.gz.',
  'help.guide.install-plugin.step.2':
    'De vuelta en Instalado, lee la fila: qué puede leer o escribir el plugin, los hosts a los que llama y si está firmado. Activa Activar plugin.',
  'help.guide.install-plugin.step.3':
    'El menú de la fila ofrece Reiniciar, Ver registro de errores, Hosts permitidos y Cambiar versión…; Eliminar lo desinstala. Se ofrece una actualización en la fila cuando existe una versión más nueva, y una que pide permisos nuevos se queda apagada hasta que los apruebes.',
  'help.guide.install-plugin.result':
    'El plugin corre en su propio proceso; lo que añade, widgets, capas de mapa, herramientas, aparece donde el plugin lo declara.',
  'help.guide.install-plugin.tip.1':
    'Volver a escanear detecta una carpeta de plugin enlazada para desarrollo sin paquete.',
  'help.guide.install-plugin.tip.2':
    'Un plugin sin firmar aparece marcado como tal; instálalo solo si confías en su origen.',
  // storage-backends
  'help.guide.storage-backends.title': 'Mover las subidas a S3 o a un espejo',
  'help.guide.storage-backends.goal': 'Guarda los archivos en almacenamiento de objetos, o en disco y bucket a la vez.',
  'help.guide.storage-backends.step.1':
    'En Backends, haz clic en Añadir backend, dale un Nombre, elige el Tipo, Local, S3 o Espejo, rellena los campos y Aplicar. Probar comprueba la conexión, Guardar cambios la escribe.',
  'help.guide.storage-backends.step.2':
    'En Categorías, asigna cada categoría de subida a un backend. Cambiar una pregunta si Mover objetos existentes o Solo enrutar las escrituras nuevas.',
  'help.guide.storage-backends.step.3': 'Estado arriba comprueba cada backend; una entrada roja nombra lo que falló.',
  'help.guide.storage-backends.result':
    'Las subidas nuevas van al backend asignado; los archivos movidos se sirven desde allí.',
  'help.guide.storage-backends.tip.1':
    'Un backend configurado por variables de entorno se muestra pero no se puede editar aquí.',
  'help.guide.storage-backends.tip.2':
    'Un espejo escribe en ambos destinos y lee del primero; úsalo para migrar sin tiempo de inactividad.',
  // channels-instance
  'help.guide.channels-instance.title': 'Configurar los canales de notificación',
  'help.guide.channels-instance.goal': 'Decide qué canales pueden elegir los usuarios y configura el correo.',
  'help.guide.channels-instance.step.1':
    'En Email (SMTP), introduce SMTP Host, SMTP Port, SMTP User, SMTP Password y la From Address; Enviar correo de prueba te manda un correo a ti.',
  'help.guide.channels-instance.step.2':
    'Activa Web Push, Ntfy y Webhook para ofrecerlos; los usuarios activan entonces push en cada dispositivo, o introducen su propio tema o URL, en Ajustes, Notificaciones.',
  'help.guide.channels-instance.step.3':
    'Recordatorios de viaje controla el recordatorio antes de que empiece un viaje; In-App siempre está activo y aquí solo se explica.',
  'help.guide.channels-instance.result': 'La pestaña Notificaciones de cada usuario muestra los canales que activaste.',
  'help.guide.channels-instance.tip.1':
    'Un servidor ntfy por defecto introducido aquí aparece prerrellenado para los usuarios; aun así pueden indicar el suyo.',
  'help.guide.channels-instance.tip.2':
    'Los canales de plugins aparecen por sí solos en cuanto está activo un plugin con esa capacidad.',
  // admin-channels
  'help.guide.admin-channels.title': 'Recibir los eventos de admin en el móvil',
  'help.guide.admin-channels.goal': 'Entérate de copias fallidas, versiones nuevas y otros eventos de la instancia.',
  'help.guide.admin-channels.step.1':
    'En Ntfy de admin, introduce un tema y, si hace falta, servidor y token; en Webhook de admin, una URL.',
  'help.guide.admin-channels.step.2':
    'Haz clic en Enviar Ntfy de prueba o Enviar webhook de prueba para ver llegar un mensaje.',
  'help.guide.admin-channels.result': 'Los eventos de admin van allí además de a la campana de la app de cada admin.',
  'help.guide.admin-channels.tip.1':
    'Mantén el tema de admin separado del personal, para que una caída no se ahogue entre la charla de los viajes.',
  // mcp-tokens-admin
  'help.guide.mcp-tokens-admin.title': 'Revocar el acceso de la IA',
  'help.guide.mcp-tokens-admin.goal':
    'Ve y corta cada token y sesión que tenga un cliente de IA, de cualquier usuario.',
  'help.guide.mcp-tokens-admin.step.1':
    'En Tokens de API, busca el token por usuario y nombre; la papelera lo elimina y el cliente se detiene al momento.',
  'help.guide.mcp-tokens-admin.step.2':
    'En Sesiones OAuth, lo mismo para los clientes basados en navegador: cliente, usuario y fecha, y la papelera revoca la sesión.',
  'help.guide.mcp-tokens-admin.result': 'Su usuario tiene que volver a conectar el cliente; nada más cambia.',
  'help.guide.mcp-tokens-admin.tip.1':
    'Los ámbitos te dicen qué podía hacer un cliente; dejar un ámbito de solo lectura es inofensivo.',
  'help.guide.mcp-tokens-admin.tip.2': 'Desactivar el complemento MCP lo revoca todo de una vez.',
  // release-history
  'help.guide.release-history.title': 'Comprobar si hay una versión nueva',
  'help.guide.release-history.goal': 'Sabe si tu TREK está al día y qué trae la siguiente versión.',
  'help.guide.release-history.step.1':
    'Cuando existe una versión más nueva, Actualización disponible aparece en la parte superior de la página de admin; Ver en GitHub la abre, y Cómo actualizar explica la actualización para Docker y para otras instalaciones.',
  'help.guide.release-history.step.2':
    'Historial de versiones lista cada versión con sus notas; Mostrar detalles las despliega, la más nueva lleva Última, y Cargar más retrocede más.',
  'help.guide.release-history.result':
    'La actualización ocurre en el host, descargando la imagen nueva o construyendo la etiqueta nueva; el directorio de datos se queda.',
  'help.guide.release-history.tip.1':
    'Haz una copia de seguridad antes de actualizar; la pestaña Copia de seguridad está al lado.',
  'help.guide.release-history.tip.2':
    'Las versiones preliminares se muestran pero no se anuncian como actualizaciones, salvo que ejecutes una.',
  // create-backup
  'help.guide.create-backup.title': 'Hacer y restaurar una copia de seguridad',
  'help.guide.create-backup.goal':
    'Haz una instantánea de toda la instancia, guarda una copia en otro sitio y sé capaz de devolverla.',
  'help.guide.create-backup.step.1':
    'En Copia de seguridad de datos, haz clic en Crear copia. Empaqueta la base de datos y las subidas en un solo archivo en el servidor.',
  'help.guide.create-backup.step.2':
    'Descargar guarda una copia fuera de la máquina; la papelera elimina las antiguas para liberar espacio.',
  'help.guide.create-backup.step.3':
    'Restaurar sobre una copia, o Subir copia de seguridad con un archivo, sustituye los datos actuales después de que ¿Restaurar copia? pregunte una vez.',
  'help.guide.create-backup.result':
    'Una restauración devuelve usuarios, viajes, archivos y ajustes al estado de esa copia; todos quedan desconectados.',
  'help.guide.create-backup.tip.1':
    'Restaurar es la única acción de aquí que no se puede deshacer. Haz antes una copia fresca.',
  'help.guide.create-backup.tip.2':
    'Las copias viven en el directorio de datos; una copia en otra máquina es lo que las convierte en copia de seguridad.',
  // auto-backup
  'help.guide.auto-backup.title': 'Programar copias de seguridad',
  'help.guide.auto-backup.goal': 'Deja que el servidor se respalde solo y conserve solo las últimas.',
  'help.guide.auto-backup.step.1':
    'En Copia automática, activa Activar copia automática y elige el Intervalo, Ejecutar a la hora y, para semanal o mensual, el Día de la semana o el Día del mes.',
  'help.guide.auto-backup.step.2':
    'Eliminar copias antiguas después de fija cuánto tiempo se conserva una copia; las más antiguas se van cuando se hace una nueva.',
  'help.guide.auto-backup.result':
    'Las copias aparecen en la lista según lo programado; un fallo llega a los canales de admin.',
  'help.guide.auto-backup.tip.1':
    'Las horas siguen la zona horaria del servidor, que se muestra en la pestaña Auditoría.',
  'help.guide.auto-backup.tip.2': 'El almacenamiento del servidor es finito; conservar de tres a cinco suele bastar.',
  // audit-log
  'help.guide.audit-log.title': 'Leer el registro de auditoría',
  'help.guide.audit-log.goal': 'Averigua quién hizo qué, y cuándo.',
  'help.guide.audit-log.step.1':
    'Lee las filas: hora, usuario, acción, recurso, IP y detalles, lo más nuevo primero. Las acciones se nombran por lo que pasó, como un fallo de inicio de sesión, un cambio de MFA o una restauración.',
  'help.guide.audit-log.step.2': 'Actualizar recarga la parte superior; Cargar más retrocede más.',
  'help.guide.audit-log.result': 'Un rastro que puedes entregar a quien pregunte por qué cambió algo.',
  'help.guide.audit-log.tip.1': 'Las horas se muestran en la zona horaria del servidor, indicada encima de la tabla.',
  'help.guide.audit-log.tip.2':
    'El registro es solo de adición; nada de aquí se puede editar ni eliminar desde la app.',
  // document-providers
  'help.guide.document-providers.title': 'Ofrecer un almacén de documentos',
  'help.guide.document-providers.goal': 'Decide con qué almacenes puede un viaje mantener sus documentos al día.',
  'help.guide.document-providers.step.1':
    'El mosaico Documentos lleva los almacenes como subfilas: Paperless-ngx, Papra, Nextcloud, OpenCloud y Synology Drive. Los cinco empiezan apagados, y las filas solo están ahí mientras Documentos mismo está activado.',
  'help.guide.document-providers.step.2':
    'Cambia el interruptor de la fila Nextcloud. El mensaje dice Complemento actualizado, y desde ahora los propietarios de viaje encuentran Sincronización de documentos en la pestaña Archivos de sus viajes, con Nextcloud bajo Conectar un proveedor.',
  'help.guide.document-providers.result':
    'El almacén se ofrece en cada viaje de este TREK; nada queda conectado hasta que un propietario de viaje lo haga.',
  'help.guide.document-providers.tip.1':
    'Aquí solo se decide si un almacén puede ofrecerse. La dirección y las credenciales pertenecen a un viaje y las introduce su propietario en la pestaña Archivos del viaje, nunca en el panel de administración.',
  'help.guide.document-providers.tip.2':
    'Apagar Documentos apaga con él todos los almacenes, y un almacén no se puede encender mientras Documentos está apagado: el servidor responde Enable the Documents addon first. Un almacén en tu propia red necesita además ALLOW_INTERNAL_NETWORK=true en el servidor.',

  // ── Screen: trip ──────────────────────────────────────────────────────────────────────
  'help.ctx.trip.title': 'Viaje',
  'help.ctx.trip.summary':
    'Un viaje, todo él: el plan con sus días, mapa y lugares, y las pestañas de transportes, reservas, listas, costes, archivos y colaboración. Cada una es su propia pantalla de ayuda debajo de esta.',
  'help.ctx.trip.bullet.1':
    'La barra de pestañas: Plan, Transportes, Reservas, Listas, Costes, Archivos y Colaboración. Los addons y los plugins deciden qué pestañas existen en tu TREK.',
  'help.ctx.trip.bullet.2':
    'Plan son tres columnas: los días a la izquierda, el mapa en el centro, los lugares a la derecha. Las reservas y los transportes viven dentro del plan, en la parada y entre paradas; las pestañas los listan.',
  'help.ctx.trip.bullet.3':
    'Compartir, arriba a la derecha, abre a la gente del viaje: miembros, invitados, el enlace de invitación y el enlace público de solo lectura.',
  'help.ctx.trip.bullet.4':
    'El título, las fechas, la portada y la moneda se editan desde Mis viajes, con el lápiz de la tarjeta del viaje.',
  'help.ctx.trip.bullet.5':
    'Los chevrones del borde interior de una columna la pliegan y el mapa ocupa el sitio; el separador fino junto a una columna cambia su anchura.',
  'help.ctx.trip.bullet.6':
    'La flecha de deshacer en la barra de herramientas de los días revierte el último cambio al plan.',
  // add-member
  'help.guide.add-member.title': 'Añadir un miembro',
  'help.guide.add-member.goal': 'Da acceso a este viaje a alguien con cuenta de TREK.',
  'help.guide.add-member.step.1': 'Haz clic en Compartir, arriba a la derecha.',
  'help.guide.add-member.step.2': 'En Invitar usuario, elige a la persona de la lista y haz clic en Invitar.',
  'help.guide.add-member.step.3':
    'La persona aparece ahora en Acceso. La corona marca al propietario; el icono al final de una fila quita el acceso de nuevo.',
  'help.guide.add-member.result':
    'El miembro ve y edita el viaje como tú, dentro de los niveles que el admin fijó en Configuración de permisos.',
  'help.guide.add-member.tip.1':
    'Quien falte en la lista aún no tiene cuenta de TREK: añádelo como invitado, o deja que se registre con un enlace de invitación.',
  'help.guide.add-member.tip.2':
    'El número junto a Acceso cuenta a la gente del viaje; los invitados se listan aparte, debajo.',
  // trip-invite-link
  'help.guide.trip-invite-link.title': 'Invitar por enlace',
  'help.guide.trip-invite-link.goal': 'Deja que la gente se una al viaje por su cuenta.',
  'help.guide.trip-invite-link.step.1':
    'Haz clic en Compartir y luego, en Enlace de invitación al viaje, en Crear enlace de invitación.',
  'help.guide.trip-invite-link.step.2':
    'Haz clic en Copiar y envía el enlace. Cualquiera con cuenta de TREK que lo abra se une como miembro.',
  'help.guide.trip-invite-link.step.3':
    'Regenerar sustituye el enlace y deja el antiguo inservible; Desactivar lo apaga.',
  'help.guide.trip-invite-link.result': 'Quien abra el enlace está en el viaje y aparece en Acceso.',
  'help.guide.trip-invite-link.tip.1':
    'Alguien sin cuenta no puede usarlo. Un admin reparte enlaces de registro en Administración, Usuarios, y puede vincular uno a este viaje.',
  'help.guide.trip-invite-link.tip.2':
    'Regenera cuando un enlace haya ido al chat equivocado: el antiguo deja de funcionar al instante.',
  // add-guest
  'help.guide.add-guest.title': 'Añadir un invitado sin cuenta',
  'help.guide.add-guest.goal': 'Cuenta con alguien que no usa TREK.',
  'help.guide.add-guest.step.1': 'Haz clic en Compartir y baja hasta Invitados.',
  'help.guide.add-guest.step.2': 'Escribe el nombre en Nombre del invitado y haz clic en Añadir invitado.',
  'help.guide.add-guest.result':
    'El invitado puede asignarse a costes, artículos de equipaje y tareas, pero no puede iniciar sesión.',
  'help.guide.add-guest.tip.1':
    'El lápiz renombra a un invitado; el icono al final de la fila lo quita junto con sus partes y asignaciones.',
  'help.guide.add-guest.tip.2':
    'Si la persona consigue una cuenta más adelante, invítala como miembro y quita al invitado.',
  // public-link
  'help.guide.public-link.title': 'Publicar un enlace de solo lectura',
  'help.guide.public-link.goal': 'Muestra el viaje a gente que no debe editarlo.',
  'help.guide.public-link.step.1':
    'Haz clic en Compartir; a la derecha, en Enlace público, marca lo que el enlace puede mostrar. Mapa y plan está siempre activo; Reservas, Equipaje, Costes y Chat los eliges tú.',
  'help.guide.public-link.step.2': 'Haz clic en Crear enlace y luego en Copiar.',
  'help.guide.public-link.step.3': 'Las marcas pueden cambiarse mientras el enlace exista; Eliminar enlace lo detiene.',
  'help.guide.public-link.result':
    'Cualquiera con el enlace ve las partes elegidas sin iniciar sesión y no puede cambiar nada.',
  'help.guide.public-link.tip.1':
    'El enlace no aparece listado en ningún sitio; quien lo tenga puede abrirlo, así que trátalo como una contraseña.',
  'help.guide.public-link.tip.2': 'Para derechos de edición, añade a la persona como miembro en su lugar.',
  // transfer-ownership
  'help.guide.transfer-ownership.title': 'Ceder el viaje o abandonarlo',
  'help.guide.transfer-ownership.goal': 'Haz propietario a otra persona, o sal de un viaje que no es tuyo.',
  'help.guide.transfer-ownership.step.1':
    'Haz clic en Compartir. En Acceso, la corona en la fila de un miembro hace propietaria a esa persona; confirma la pregunta.',
  'help.guide.transfer-ownership.step.2':
    'Abandonar viaje en tu propia fila te saca del viaje; como propietario, cédelo primero.',
  'help.guide.transfer-ownership.result':
    'El nuevo propietario gestiona a los miembros y puede eliminar el viaje; tú te quedas como miembro normal.',
  'help.guide.transfer-ownership.tip.1':
    'El propietario es quien creó el viaje hasta que lo cede; eliminar el viaje es solo cosa suya.',
  'help.guide.transfer-ownership.tip.2':
    'Quitar acceso en otra fila es el mismo botón al revés: el propietario saca a un miembro.',
  // collapse-columns
  'help.guide.collapse-columns.title': 'Hacer sitio para el mapa',
  'help.guide.collapse-columns.goal': 'Pliega una columna o dale más anchura.',
  'help.guide.collapse-columns.step.1':
    'Haz clic en el chevrón del borde interior de la columna de días para plegarla; el mapa ocupa el espacio. La columna de lugares tiene el mismo chevrón.',
  'help.guide.collapse-columns.step.2': 'Haz clic de nuevo en el chevrón para recuperar la columna.',
  'help.guide.collapse-columns.step.3':
    'Arrastra el separador fino entre una columna y el mapa para cambiar la anchura de la columna.',
  'help.guide.collapse-columns.result':
    'Las anchuras se recuerdan; las columnas vuelven abiertas en la próxima visita.',
  'help.guide.collapse-columns.tip.1': 'Las dos columnas pueden plegarse a la vez para una vista solo de mapa.',
  'help.guide.collapse-columns.tip.2':
    'En un teléfono no hay columnas: Plan y Lugares son los dos botones en la parte inferior del mapa.',
  // undo-change
  'help.guide.undo-change.title': 'Deshacer el último cambio',
  'help.guide.undo-change.goal': 'Revierte lo que acabas de hacer en el plan.',
  'help.guide.undo-change.step.1':
    'Haz clic en la flecha de deshacer de la barra de herramientas sobre los días; su tooltip nombra el cambio que va a revertir.',
  'help.guide.undo-change.result':
    'El plan vuelve a estar como estaba, y la flecha se pone gris hasta el próximo cambio.',
  'help.guide.undo-change.tip.1':
    'Deshacer cubre el plan: asignar, quitar, reordenar y mover lugares, optimizar una ruta, eliminar lugares, cambios de categoría e importaciones.',
  'help.guide.undo-change.tip.2':
    'Tiene un solo paso de profundidad: solo el último cambio puede revertirse, y un cambio nuevo lo sustituye.',

  // ── Screen: trip-places ───────────────────────────────────────────────────────────────
  'help.ctx.trip-places.title': 'Lugares',
  'help.ctx.trip-places.summary':
    'La columna derecha del plan: todos los lugares del viaje, planificados o no, con búsqueda y filtros, y las formas de traer lugares, a mano, desde un archivo o desde una lista compartida.',
  'help.ctx.trip-places.bullet.1':
    'Añadir lugar/actividad, arriba, abre el formulario de un lugar que escribes o buscas. Mientras hay un día abierto el botón dice Nuevo lugar, y Al día, a su lado, crea el lugar directamente en ese día.',
  'help.ctx.trip-places.bullet.2':
    'Importar archivo acepta archivos .gpx, .kml y .kmz; Importar lista acepta una lista compartida de Google Maps o de Naver Maps. Un archivo también se puede soltar sin más sobre la columna.',
  'help.ctx.trip-places.bullet.3':
    'El desplegable cambia entre Todo, Sin planificar, Planificados y, en cuanto se importa una ruta, Rutas; debajo están la búsqueda, el filtro de categoría y la estrella para una valoración mínima.',
  'help.ctx.trip-places.bullet.4':
    'Una fila muestra imagen, nombre y descripción o dirección. Haz clic en ella para ver los detalles del lugar, arrástrala a un día, o haz clic derecho para Editar, + Día, Abrir la web, Google Maps, Guardar en colección y Eliminar.',
  'help.ctx.trip-places.bullet.5':
    'Con un día abierto, un + al final de una fila sin planificar pone el lugar en ese día, y Planificados lista solo ese día, con Mostrar todo el viaje para volver a ampliar.',
  'help.ctx.trip-places.bullet.6':
    'La marca al extremo derecho de la fila de filtros inicia una selección: varias filas a la vez reciben una categoría nueva, van a una colección o se eliminan.',
  // create-place
  'help.guide.create-place.title': 'Crear un lugar',
  'help.guide.create-place.goal':
    'Añade un lugar o una actividad a mano, con todo lo que el plan necesita saber de él.',
  'help.guide.create-place.step.1':
    'Haz clic en Añadir lugar/actividad, arriba en la columna de lugares (Nuevo lugar mientras hay un día abierto). Se abre el formulario.',
  'help.guide.create-place.step.2':
    'Escribe el lugar en Buscar lugares... arriba y elige un resultado. Nombre, Dirección, Latitud, Longitud y Página web se rellenan, y Detalles del lugar, a la izquierda, muestra imágenes, el horario de apertura y una descripción. En un TREK con clave de Google, ¿No es el lugar correcto? Buscar en Google está bajo la lista y repite la misma búsqueda a través de Google.',
  'help.guide.create-place.step.3':
    'En Detalles del lugar, un clic en una imagen bajo Elegir una imagen la convierte en la imagen del lugar; Usar este texto lleva la descripción al formulario.',
  'help.guide.create-place.step.4':
    'Revisa los campos: Nombre es obligatorio; Descripción y Notas son tuyas; Dirección, Latitud y Longitud vienen de la búsqueda o se escriben; Categoría elige una de las categorías del viaje, y el + de al lado crea una nueva en el acto; Página web recoge el enlace.',
  'help.guide.create-place.step.5':
    'Haz clic en Añadir. Si ya hay un lugar con el mismo nombre en el viaje, el formulario lo avisa y el botón pasa a ser Añadir de todos modos.',
  'help.guide.create-place.result':
    'El lugar está en la lista y en el mapa, bajo Sin planificar hasta que se pone en un día.',
  'help.guide.create-place.tip.1':
    'Archivos y Costes, al final del formulario, adjuntan un documento al lugar, o abren el editor de Costes para su gasto justo después de guardar.',
  'help.guide.create-place.tip.2':
    'El índice de TREK y OpenStreetMap responden a la búsqueda en cualquier TREK, y Detalles del lugar se rellena desde Wikipedia, Wikivoyage y Wikimedia. A Google solo se le pregunta donde los dos salen vacíos, y solo él trae las valoraciones.',
  'help.guide.create-place.tip.3':
    'Un lugar también puede empezar en el mapa: haz clic derecho en el punto y el formulario se abre con las coordenadas y la dirección puestas.',
  // place-to-open-day
  'help.guide.place-to-open-day.title': 'Añadir un lugar directamente al día abierto',
  'help.guide.place-to-open-day.goal': 'Ahórrate el segundo paso: crea o elige el lugar y tenlo en el día de una vez.',
  'help.guide.place-to-open-day.step.1':
    'Haz clic en la cabecera de un día en la columna de días. El día está abierto: su tarjeta queda resaltada y la columna de lugares gana el botón Al día.',
  'help.guide.place-to-open-day.step.2':
    'Al día abre el mismo formulario que Nuevo lugar, solo que el lugar cae en el día abierto en cuanto haces clic en Añadir.',
  'help.guide.place-to-open-day.step.3':
    'Un lugar que ya existe va al día abierto con el + al final de su fila, o con clic derecho, + Día.',
  'help.guide.place-to-open-day.step.4':
    'Al revés también funciona, y sin abrir antes ningún día: arrastra la fila del lugar fuera de la columna y suéltala sobre una tarjeta de día. Si la sueltas entre dos paradas, aterriza justo ahí.',
  'help.guide.place-to-open-day.result':
    'El lugar queda listado bajo el día, al final; arrástralo arriba o abajo hasta donde le toca.',
  'help.guide.place-to-open-day.tip.1':
    'El día abierto también guía la búsqueda: con un día abierto, el mapa y la búsqueda cercana parten de donde ya va ese día.',
  'help.guide.place-to-open-day.tip.2': 'Deshacer, en la barra de herramientas sobre los días, revierte la asignación.',
  // filter-places
  'help.guide.filter-places.title': 'Encontrar un lugar en la lista',
  'help.guide.filter-places.goal': 'Estrecha la columna a los lugares que buscas.',
  'help.guide.filter-places.step.1':
    'El desplegable de arriba cambia entre Todo, Sin planificar (aún en ningún día), Planificados (en un día) y Rutas (rutas GPX importadas), cada uno con su número.',
  'help.guide.filter-places.step.2': 'Escribe en Buscar lugares...; la lista se estrecha mientras escribes.',
  'help.guide.filter-places.step.3':
    'Todas las categorías abre una lista para marcar una o varias categorías, Sin categoría entre ellas; Borrar filtro, abajo del todo, lo reinicia.',
  'help.guide.filter-places.step.4':
    'La estrella de al lado fija una valoración mínima: 5+, 4+ y así sucesivamente muestran solo lugares que has valorado al menos así de alto.',
  'help.guide.filter-places.result': 'El número sobre las filas dice cuántos lugares encajan; los filtros se combinan.',
  'help.guide.filter-places.tip.1':
    'Con un día abierto, Planificados lista solo ese día y lo dice: Se muestra solo el día abierto, con Mostrar todo el viaje al lado.',
  'help.guide.filter-places.tip.2':
    'El mapa también se estrecha al día abierto; Todo en la lista sigue mostrando todos los lugares del viaje.',
  // edit-place
  'help.guide.edit-place.title': 'Cambiar un lugar',
  'help.guide.edit-place.goal': 'Corrige un nombre, mueve el pin, añade una página web o cambia la categoría.',
  'help.guide.edit-place.step.1':
    'Haz clic derecho en la fila y elige Editar, o abre el lugar y haz clic en Editar en sus detalles.',
  'help.guide.edit-place.step.2':
    'Cambia lo que necesites: Nombre, Descripción, Notas, Dirección, Latitud y Longitud, Categoría, Página web. Abierto desde un día, el formulario tiene además Notas para este día e Inicio y Fin para ese día.',
  'help.guide.edit-place.step.3': 'Haz clic en Actualizar.',
  'help.guide.edit-place.result':
    'El cambio se aplica en todos los sitios donde aparece el lugar: la lista, el mapa y cada día en el que está.',
  'help.guide.edit-place.tip.1':
    'Notas para este día pertenece al lugar en ese único día; Notas pertenece al lugar en sí.',
  'help.guide.edit-place.tip.2':
    'Un Fin anterior al Inicio bloquea Actualizar; Solapamiento horario con: solo avisa de que otra parada del día tiene la misma hora.',
  // delete-place
  'help.guide.delete-place.title': 'Eliminar un lugar',
  'help.guide.delete-place.goal': 'Saca un lugar del viaje para siempre.',
  'help.guide.delete-place.step.1':
    'Haz clic derecho en la fila y elige Eliminar, o haz clic en Eliminar en los detalles del lugar.',
  'help.guide.delete-place.step.2':
    'Confirma. Si se reservó una noche en el lugar, o hay una reserva vinculada a él, la pregunta dice qué se va con él.',
  'help.guide.delete-place.result':
    'El lugar desaparece de la lista, del mapa y de cada día; Deshacer, en la barra de herramientas sobre los días, lo trae de vuelta.',
  'help.guide.delete-place.tip.1': 'Para quitar un lugar de un solo día, usa en su lugar Quitar del día en esa parada.',
  'help.guide.delete-place.tip.2': 'Varios lugares a la vez: la marca junto a los filtros inicia una selección.',
  // select-places
  'help.guide.select-places.title': 'Cambiar o eliminar varios lugares a la vez',
  'help.guide.select-places.goal': 'Ordena la lista de una sola vez en lugar de uno por uno.',
  'help.guide.select-places.step.1':
    'Haz clic en la marca al extremo derecho de la fila de filtros. Las filas reciben casillas y aparece una barra con las acciones.',
  'help.guide.select-places.step.2':
    'Marca las filas, o usa Seleccionar todo en la barra; la barra cuenta lo que está seleccionado.',
  'help.guide.select-places.step.3':
    'Change category les da a todos una misma categoría; Guardar en colección los copia a una de tus colecciones; Eliminar selección los quita tras una confirmación.',
  'help.guide.select-places.step.4': 'Haz clic de nuevo en la marca para salir de la selección.',
  'help.guide.select-places.result':
    'El cambio se aplica a cada lugar seleccionado; un borrado se puede deshacer desde la barra de herramientas sobre los días.',
  'help.guide.select-places.tip.1':
    'Los filtros siguen funcionando mientras seleccionas: filtra primero a Sin planificar y así Seleccionar todo coge justo esos.',
  'help.guide.select-places.tip.2':
    'Marcar como visitado en tus listas aparece en la barra cuando el addon Colecciones está activo: marca los lugares en las colecciones en las que están guardados.',
  // import-places-file
  'help.guide.import-places-file.title': 'Importar lugares desde un archivo GPX, KML o KMZ',
  'help.guide.import-places-file.goal': 'Trae lo que exportaron Google My Maps, Google Earth o un rastreador GPS.',
  'help.guide.import-places-file.step.1':
    'Haz clic en Importar archivo, o suelta el archivo en cualquier punto de la columna de lugares.',
  'help.guide.import-places-file.step.2':
    'Elige el archivo o arrástralo al recuadro. Para un GPX, marca qué importar: Puntos de ruta, Rutas, Tracks (con geometría de ruta); para KML y KMZ, Puntos (Placemarks) y Rutas (LineStrings).',
  'help.guide.import-places-file.step.3':
    'El recuadro acepta varios archivos a la vez, y solo .gpx, .kml y .kmz. Otro tipo de archivo, o uno de más de 10 MB, se rechaza en el diálogo y no se importa.',
  'help.guide.import-places-file.step.4':
    'Haz clic en Importar. Un mensaje dice cuántos lugares han entrado; con un archivo KML o KMZ el diálogo se queda abierto con un resumen de lo que se ha creado y de lo que se ha omitido.',
  'help.guide.import-places-file.result':
    'Los lugares están en la lista; una ruta lleva una marca de itinerario en su fila, se dibuja en el mapa y recibe su propio filtro Rutas.',
  'help.guide.import-places-file.tip.1':
    'Un archivo demasiado grande se rechaza indicando el límite de tamaño; expórtalo de nuevo sin fotos, o divídelo.',
  'help.guide.import-places-file.tip.2':
    'La importación se puede deshacer entera desde la barra de herramientas sobre los días.',
  // import-places-list
  'help.guide.import-places-list.title': 'Importar una lista compartida de Google Maps o de Naver Maps',
  'help.guide.import-places-list.goal': 'Convierte el enlace de una lista compartida en lugares.',
  'help.guide.import-places-list.step.1': 'Haz clic en Importar lista y elige Lista Google o Lista Naver.',
  'help.guide.import-places-list.step.2':
    'Pega el enlace compartido de la lista. Un enlace de indicaciones de Google Maps también sirve: sus paradas se convierten en lugares, en orden de conducción.',
  'help.guide.import-places-list.step.3': 'Haz clic en Importar.',
  'help.guide.import-places-list.result':
    'Todos los lugares de la lista están en el viaje, con el nombre que tienen en la lista; los lugares que ya están en el viaje se omiten.',
  'help.guide.import-places-list.tip.1':
    'La lista tiene que estar compartida públicamente; el enlace de una lista privada no importa nada.',
  'help.guide.import-places-list.tip.2':
    'Enriquecer lugares con Google aparece en el diálogo cuando tu TREK tiene una clave de Google: busca cada lugar importado y completa fotos, dirección y detalles.',

  // ── Screen: trip-days ─────────────────────────────────────────────────────────────────
  'help.ctx.trip-days.title': 'Días',
  'help.ctx.trip-days.summary':
    'La columna izquierda del plan: una tarjeta por día con sus paradas en orden, las notas, las reservas y los transportes del día, y la ruta entre las paradas. Aquí es donde el viaje se planifica de verdad.',
  'help.ctx.trip-days.bullet.1':
    'La barra de arriba: Exportar (PDF, calendario, GPX), Expand all days / Collapse all days, la flecha de Deshacer, Reordenar días y Mostrar todas las rutas de reservas.',
  'help.ctx.trip-days.bullet.2':
    'Una tarjeta de día: número, tiempo, título, fecha y el coste del día en la cabecera; haz clic en la cabecera para abrir el día, su flecha la pliega. Transporte público, Añadir transporte y Añadir nota están también en la cabecera.',
  'help.ctx.trip-days.bullet.3':
    'Dentro de un día: las paradas en orden, cada una con imagen, nombre, hora y un candado sobre la imagen; las notas; las reservas que pertenecen al día; y entre las paradas el tiempo de viaje de cada tramo.',
  'help.ctx.trip-days.bullet.4':
    'Bajo las paradas, la barra de ruta: Ruta dibuja el día en el mapa, Optimizar ordena las paradas, En coche / A pie fija el medio de transporte del día, Abrir en Google Maps y Abrir en CoMaps entregan el día.',
  'help.ctx.trip-days.bullet.5':
    'Los lugares llegan a un día arrastrando una fila de la columna de lugares, con el + de esa fila, con Añadir lugar a este día en un día vacío, o desde los detalles del lugar.',
  'help.ctx.trip-days.bullet.6':
    'Coste total, abajo, suma cada parada y cada reserva con precio, en la moneda del viaje.',
  // read-day-plan
  'help.guide.read-day-plan.title': 'Leer un día',
  'help.guide.read-day-plan.goal': 'Saber qué te dice cada parte de una tarjeta de día antes de cambiar nada.',
  'help.guide.read-day-plan.step.1':
    'La cabecera: el número del día, el pronóstico para el día, Día 1 o el título que le pusiste, la fecha y el coste del día. Haz clic en la cabecera para abrir el día (sus Detalles del día se abren sobre el mapa); la flecha de la derecha pliega y despliega la tarjeta.',
  'help.guide.read-day-plan.step.2':
    'Una parada: el asidero de la izquierda la arrastra, la imagen lleva un candado para la optimización de ruta, luego el nombre, la descripción y, si las hay, las Notas para este día. Una insignia de hora muestra Inicio y Fin cuando la parada los tiene; las flechas que aparecen en su extremo derecho la suben o la bajan.',
  'help.guide.read-day-plan.step.3':
    'Una reserva del día: una reserva en una parada la marca como Reserva confirmada o Reserva pendiente, y un transporte aparece como Salida o Llegada con su hora y su trayecto, con un pequeño interruptor que dibuja esa ruta en el mapa.',
  'help.guide.read-day-plan.step.4':
    'Entre dos paradas el conector dice cuánto dura el tramo y qué distancia tiene, en el medio de transporte del día; haz clic en él para cambiar el medio de ese único tramo.',
  'help.guide.read-day-plan.step.5':
    'La barra de ruta al final: Ruta dibuja el camino del día en el mapa, Optimizar reordena las paradas, los botones de modo eligen En coche o A pie, Abrir en Google Maps y Abrir en CoMaps abren el día allí.',
  'help.guide.read-day-plan.result':
    'Cada símbolo de la tarjeta tiene un significado; las guías de abajo cambian cada uno de ellos.',
  'help.guide.read-day-plan.tip.1':
    'Haz clic derecho en una parada para su menú: Editar, Quitar del día, Abrir la web, las apps de navegación (Google Maps, Waze, Apple Maps, OpenStreetMap, CoMaps), Guardar en colección, Eliminar.',
  'help.guide.read-day-plan.tip.2':
    'Pasa el ratón por una parada y Añadir reserva aparece en su extremo: una reserva creada ahí queda atada a esta parada en este día.',
  // place-onto-day
  'help.guide.place-onto-day.title': 'Poner un lugar en un día',
  'help.guide.place-onto-day.goal': 'Convertir un lugar de la lista en una parada del día, donde le toca en el orden.',
  'help.guide.place-onto-day.step.1':
    'Arrastra una fila de la columna de lugares hasta la tarjeta del día. Suéltala entre dos paradas para ponerla exactamente ahí, o en cualquier punto de la tarjeta para añadirla al final.',
  'help.guide.place-onto-day.step.2':
    'Sin arrastrar: abre el día haciendo clic en su cabecera, luego haz clic en el + del final de la fila del lugar, o haz clic derecho en la fila y elige + Día.',
  'help.guide.place-onto-day.step.3':
    'En un día vacío, Añadir lugar a este día abre el formulario de lugar, y el lugar nuevo cae en el día de inmediato.',
  'help.guide.place-onto-day.step.4':
    'Desde los detalles de un lugar, Añadir al día pregunta a qué día; desde la cabecera del día, Al día en la columna de lugares crea un lugar nuevo en el día abierto.',
  'help.guide.place-onto-day.result':
    'El lugar es una parada del día, en el mapa con el número del día, y la columna de lugares lo cuenta bajo Planificados.',
  'help.guide.place-onto-day.tip.1':
    'Un lugar puede estar en varios días: ponlo en el segundo día desde la columna de lugares. Arrastrar una parada de una tarjeta de día a otra la mueve en vez de copiarla.',
  'help.guide.place-onto-day.tip.2': 'La flecha de Deshacer de la barra deshace la asignación.',
  'help.guide.place-onto-day.tip.3':
    'Una parada no se puede soltar entre dos entradas con hora fija, ni antes de una reserva que ya tiene hora; el plan mantiene su cronología.',
  // reorder-stops
  'help.guide.reorder-stops.title': 'Cambiar el orden de un día',
  'help.guide.reorder-stops.goal': 'Subir o bajar una parada, o llevarla a otro día.',
  'help.guide.reorder-stops.step.1': 'Arrastra la parada por su asidero hasta la nueva posición dentro de la tarjeta.',
  'help.guide.reorder-stops.step.2':
    'O usa las flechas del extremo derecho de la parada: un paso arriba o abajo por clic.',
  'help.guide.reorder-stops.step.3': 'Arrastra la parada a otra tarjeta de día para moverla allí; deja el día antiguo.',
  'help.guide.reorder-stops.step.4':
    'Una parada con hora fija pregunta ¿Eliminar hora? cuando moverla rompería el orden del día, porque la hora decidía su sitio: Confirmar quita la hora y la deja ir a cualquier parte.',
  'help.guide.reorder-stops.result': 'La ruta y los tiempos de viaje siguen el nuevo orden al instante.',
  'help.guide.reorder-stops.tip.1':
    'Las reservas con hora fija no se pueden reordenar; se quedan donde su hora las coloca.',
  'help.guide.reorder-stops.tip.2':
    'Optimizar, en la barra de ruta, ordena todo el día por el camino más corto; bloquea antes una parada para que se quede donde está.',
  // set-stop-times
  'help.guide.set-stop-times.title': 'Darle una hora a una parada',
  'help.guide.set-stop-times.goal':
    'Fijar cuándo empieza y termina una parada, para que el día se lea como un horario.',
  'help.guide.set-stop-times.step.1':
    'Haz clic derecho en la parada y elige Editar. Abierto desde el día, el formulario tiene Inicio y Fin abajo.',
  'help.guide.set-stop-times.step.2':
    'Pon Inicio y, si quieres, Fin. Solapamiento horario con: avisa de que otra parada del día con hora se solapa; un Fin anterior al Inicio bloquea Actualizar.',
  'help.guide.set-stop-times.step.3':
    'Haz clic en Actualizar. La parada recibe una insignia de hora y se mueve al sitio que su hora le da en el día.',
  'help.guide.set-stop-times.result':
    'Las paradas con hora mantienen su sitio en el orden; las paradas sin hora se ordenan a su alrededor.',
  'help.guide.set-stop-times.tip.1':
    'La hora pertenece a la parada de ese día; el mismo lugar puede tener otra hora en otro día.',
  'help.guide.set-stop-times.tip.2':
    'Para mover a mano una parada con hora, arrástrala: la pregunta ¿Eliminar hora? quita la hora por el camino, en cuanto haces clic en Confirmar.',
  'help.guide.set-stop-times.tip.3':
    'El campo Notas para este día, en el mismo formulario, guarda lo que solo vale en este día, una mesa reservada, un número de entrada.',
  // remove-from-day
  'help.guide.remove-from-day.title': 'Sacar una parada de un día',
  'help.guide.remove-from-day.goal': 'Desplanificar un lugar sin borrarlo del viaje.',
  'help.guide.remove-from-day.step.1': 'Haz clic derecho en la parada y elige Quitar del día.',
  'help.guide.remove-from-day.step.2':
    'La parada ya no está en el día; el lugar sigue en la columna de lugares, bajo Sin planificar si no está en ningún otro día.',
  'help.guide.remove-from-day.result':
    'El día, su ruta y su coste se actualizan; la flecha de Deshacer devuelve la parada.',
  'help.guide.remove-from-day.tip.1':
    'Eliminar, en el mismo menú, quita el lugar de todo el viaje, con todos sus días.',
  'help.guide.remove-from-day.tip.2':
    'Quitar del día está también en el panel de detalles del lugar, junto a Añadir al día.',
  // lock-stop
  'help.guide.lock-stop.title': 'Fijar una parada en su sitio',
  'help.guide.lock-stop.goal': 'Mantener una parada donde está cuando se optimiza la ruta.',
  'help.guide.lock-stop.step.1':
    'Pasa el ratón por la imagen de la parada y haz clic en el candado: Mantener posición durante la optimización de ruta.',
  'help.guide.lock-stop.step.2':
    'Optimizar ordena ahora las demás paradas a su alrededor; haz clic otra vez en el candado (Haz clic para desbloquear) para soltarla.',
  'help.guide.lock-stop.result':
    'El candado se ve sobre la imagen; la parada conserva su posición hasta que la desbloquees.',
  'help.guide.lock-stop.tip.1':
    'Una parada con hora fija queda bloqueada por su hora; nunca se mueve durante la optimización.',
  'help.guide.lock-stop.tip.2':
    'El candado dura esta visita: tras recargar, cada parada vuelve a estar libre, solo las paradas con hora siguen fijas.',
  // day-note
  'help.guide.day-note.title': 'Añadir una nota a un día',
  'help.guide.day-note.goal': 'Guardar un recordatorio, un número de entrada o un plan B dentro del día.',
  'help.guide.day-note.step.1': 'Haz clic en Añadir nota en la cabecera del día.',
  'help.guide.day-note.step.2':
    'Dale un nombre en Nota, que es lo que se ve en el día, y escribe el resto en Nota diaria. La barra de herramientas de encima da formato al texto (Negrita, Lista con viñetas, Enlace, Cita), y Vista previa, a la izquierda, muestra cómo quedará la nota en el día.',
  'help.guide.day-note.step.3':
    'Elige un Icono y un Color, para que la nota destaque entre las paradas, y luego Añadir.',
  'help.guide.day-note.step.4':
    'La nota está en el día como una parada: arrástrala a su sitio, haz clic derecho para Editar y Eliminar.',
  'help.guide.day-note.result':
    'La nota forma parte del día, también en el PDF; una nota con hora se ordena con las paradas que tienen hora.',
  'help.guide.day-note.tip.1':
    'Una nota con hora puede hacer de transporte del que no tienes reserva: «08:15 S3 desde la estación central».',
  'help.guide.day-note.tip.2': 'Las notas son por día; una nota para todo el viaje va en Colaboración.',
  // day-route
  'help.guide.day-route.title': 'Mostrar y optimizar la ruta del día',
  'help.guide.day-route.goal':
    'Ver el camino entre las paradas, elegir cómo viajas y dejar que TREK ordene la secuencia.',
  'help.guide.day-route.step.1':
    'Abre el día y haz clic en Ruta en la barra de ruta: el camino entre las paradas se dibuja en el mapa, y los conectores entre las paradas muestran el tiempo y la distancia de cada tramo.',
  'help.guide.day-route.step.2':
    'En coche y A pie, al lado, fijan el medio de transporte del día; los tramos se recalculan. Los plugins pueden añadir medios propios.',
  'help.guide.day-route.step.3':
    'Haz clic en un conector para cambiar el medio de ese único tramo: elige uno, o Usar predet. del día para volver al del día.',
  'help.guide.day-route.step.4':
    'Optimizar reordena las paradas por el camino más corto. Las paradas con candado o con hora fija conservan su sitio; con un alojamiento en el día, la ruta empieza ahí.',
  'help.guide.day-route.step.5':
    'Abrir en Google Maps o Abrir en CoMaps abre el día entero como ruta en esa aplicación, para navegar por el camino.',
  'help.guide.day-route.result':
    'El día es una ruta con horas; Coste total y los tramos se actualizan según cambia el orden.',
  'help.guide.day-route.tip.1':
    'Las rutas vienen de OSRM por defecto; el administrador puede apuntar TREK a otro motor de rutas en Valores predeterminados.',
  'help.guide.day-route.tip.2':
    'Un tramo que no se ha podido calcular no muestra tiempo; comprueba que las dos paradas tengan coordenadas.',
  'help.guide.day-route.tip.3': 'La flecha de Deshacer deshace una optimización.',
  // manage-days
  'help.guide.manage-days.title': 'Añadir, reordenar y renombrar días',
  'help.guide.manage-days.goal': 'Dar forma a los días en sí, no solo a lo que hay en ellos.',
  'help.guide.manage-days.step.1':
    'Los días salen de las fechas del viaje; cambia las fechas en la tarjeta del viaje en Panel y se añaden o se quitan días en los extremos. Antes de quitar un día con contenido, una lista dice qué días se van y qué llevan.',
  'help.guide.manage-days.step.2':
    'Reordenar días, en la barra, abre una lista: Subir y Bajar mueven un día con todo lo que lleva, y Eliminar día, la papelera de al lado, lo quita. Debajo de la lista, el botón con la fecha siguiente añade un día justo después del último con fecha y alarga el viaje un día; Sin fecha añade un día sin fecha al final.',
  'help.guide.manage-days.step.3':
    'Eliminar día pregunta primero: la lista muestra lo que se va con el día, sus lugares, notas y reservas, un alojamiento con entrada o salida ese día y los días que adelantan una fecha. Eliminar día lo quita y Cancelar lo conserva; el último día no se puede eliminar.',
  'help.guide.manage-days.step.4':
    'Para renombrar un día, ábrelo y haz clic en el lápiz junto a su título en los Detalles del día sobre el mapa; el nombre sustituye a Día 1 en la tarjeta y en el PDF.',
  'help.guide.manage-days.step.5':
    'Expand all days y Collapse all days, en la barra, pliegan todas las tarjetas a la vez; una sola tarjeta se pliega con su flecha.',
  'help.guide.manage-days.result':
    'Las fechas se quedan con la posición: un día que sube toma la fecha anterior, y sus paradas, notas y reservas viajan con él.',
  'help.guide.manage-days.tip.1': 'Mover días se puede deshacer desde la barra; eliminar un día, no.',
  'help.guide.manage-days.tip.2':
    'El coste en la cabecera de un día suma las paradas y reservas de ese día que llevan precio.',
  // bookings-in-plan
  'help.guide.bookings-in-plan.title': 'Leer reservas y transportes en el plan',
  'help.guide.bookings-in-plan.goal': 'Saber dónde aparece una reserva una vez existe, y qué pantalla la crea.',
  'help.guide.bookings-in-plan.step.1':
    'Un transporte (Vuelo, Tren, Ferry, Autobús, Coche) aparece en el día en que sale como Salida y en el día en que llega como Llegada, con hora y trayecto; uno de varios días abarca los días intermedios.',
  'help.guide.bookings-in-plan.step.2':
    'Una reserva atada a una parada (un Restaurante, una Excursión) marca esa parada como Reserva confirmada o Reserva pendiente; una reserva con día pero sin parada es una fila propia dentro del día.',
  'help.guide.bookings-in-plan.step.3':
    'Una noche de hotel es un alojamiento: está en los Detalles del día bajo Alojamiento, del Registro de entrada al Registro de salida, y la ruta de cada uno de esos días empieza ahí.',
  'help.guide.bookings-in-plan.step.4':
    'En el mapa, el interruptor de una fila de transporte dibuja su ruta; Mostrar todas las rutas de reservas, en la barra, las dibuja todas.',
  'help.guide.bookings-in-plan.step.5':
    'Para crearlas: Añadir reserva en una parada con el ratón encima, Añadir transporte y Transporte público en la cabecera del día, y las pestañas Reservas y Transportes para la lista completa con importación y archivos.',
  'help.guide.bookings-in-plan.result':
    'Una reserva, un sitio en el plan; las pestañas son las mismas reservas en forma de lista.',
  'help.guide.bookings-in-plan.tip.1':
    'Confirmada y Pendiente es un estado que pones en la reserva; el plan lo muestra en la parada, la pestaña Reservas cuenta las dos.',
  'help.guide.bookings-in-plan.tip.2':
    'Un transporte con hora fija no se puede arrastrar; cambia en su lugar su hora en la reserva.',
  // export-plan
  'help.guide.export-plan.title': 'Exportar el plan',
  'help.guide.export-plan.goal': 'Llevarte el plan como documento, a tu calendario o a un GPS.',
  'help.guide.export-plan.step.1': 'Haz clic en Exportar en la barra sobre los días.',
  'help.guide.export-plan.step.2':
    'Documento: PDF abre la vista de impresión de cada día con sus paradas, notas y reservas; Salto de página por día empieza cada día en una página nueva, Guardar como PDF lo descarga.',
  'help.guide.export-plan.step.3':
    'Calendario: Descargar .ics guarda las reservas como archivo de calendario; Suscribirse al calendario da un enlace que tu aplicación de calendario actualiza sola.',
  'help.guide.export-plan.step.4':
    'Mapas y GPS · GPX: Todo el viaje exporta lugares, rutas de los días y tracks; Solo lugares, los puntos; Días como rutas, una ruta por día, para mapas sin conexión y dispositivos GPS.',
  'help.guide.export-plan.result': 'El archivo se descarga; en el viaje no cambia nada.',
  'help.guide.export-plan.tip.1':
    'Un día suelto va a una aplicación de mapas desde su barra de ruta: Abrir en Google Maps o Abrir en CoMaps.',
  'help.guide.export-plan.tip.2':
    'Suscribirse al calendario necesita los feeds de calendario activados en tus ajustes; Panel tiene una guía para ello.',
  'help.guide.export-plan.tip.3': 'Exportar es leer: cualquier miembro del viaje puede hacerlo.',

  // ── Screen: trip-place ────────────────────────────────────────────────────────────────
  'help.ctx.trip-place.title': 'Detalles del lugar',
  'help.ctx.trip-place.summary':
    'La ficha que se abre sobre el mapa cuando eliges un lugar: todo lo que el viaje sabe de él, las estrellas que le ha dado cada uno, su imagen y sus archivos, y los botones que lo ponen en el día abierto, en una lista o en una aplicación de mapas.',
  'help.ctx.trip-place.bullet.1':
    'Haz clic en una fila de la columna de lugares, en una parada dentro de un día o en un marcador del mapa, y la ficha se abre sobre el mapa. Elegirlo dentro de un día le dice a la ficha a qué parada te refieres, y eso es lo que trae consigo los participantes de la parada y su reserva.',
  'help.ctx.trip-place.bullet.2':
    'La cabecera lleva la imagen redonda, el nombre, la categoría, la dirección y las coordenadas. Haz clic en la imagen para poner una tuya, doble clic en el nombre para renombrar el lugar en el acto, y la X de la derecha cierra la ficha.',
  'help.ctx.trip-place.bullet.3':
    'Debajo: el precio si lo tiene, las estrellas que cada viajero le ha dado al lugar, la descripción y las notas, y Notas para este día cuando la parada lleva alguna.',
  'help.ctx.trip-place.bullet.4':
    'Horario de apertura, Color de la ruta, Datos de la ruta y Archivos siguen a continuación, en la medida en que apliquen. Archivos acepta cualquier cosa de tus carpetas y lista además lo que cuelga de la reserva de esta parada.',
  'help.ctx.trip-place.bullet.5':
    'La fila de abajo: Añadir al día o Quitar del día mientras hay un día abierto, luego Guardar en colección, Navegación, Abrir la web, Editar y Eliminar.',
  'help.ctx.trip-place.bullet.6':
    'Un lugar elegido desde la búsqueda lleva lo que el índice de TREK u OpenStreetMap saben de él: un anillo verde Abierto o rojo Cerrado alrededor de la imagen, juzgado por el reloj del propio lugar, el número de teléfono bajo las estrellas, Horario de apertura más abajo con la línea del día en la fila y toda la semana tras un clic, y su web tras Abrir la web. La valoración de Google solo se muestra en un lugar encontrado a través de Google, en un TREK con clave de Google.',
  // read-place
  'help.guide.read-place.title': 'Lo que la ficha te dice de un lugar',
  'help.guide.read-place.goal': 'Lee todo lo que el viaje sabe de un lugar, en una sola ficha.',
  'help.guide.read-place.step.1':
    'En la columna de días, haz clic en la parada que quieres leer. La ficha se abre sobre el mapa y la parada se queda marcada en su día.',
  'help.guide.read-place.step.2':
    'La cabecera: la imagen redonda, el nombre, la dirección y las coordenadas exactas. Un anillo verde con Abierto, o rojo con Cerrado, alrededor de la imagen dice si el lugar está abierto ahora mismo, según su propio reloj, en cuanto TREK conoce su horario. La X de la derecha vuelve a cerrar la ficha.',
  'help.guide.read-place.step.3':
    'Debajo, las estrellas que cada viajero le ha dado al lugar, con la media y cuántos han votado. Sin valorar todavía mientras no lo haya hecho nadie. Justo debajo, el número de teléfono cuando el lugar tiene uno: un clic en él pasa el número a tu aplicación de teléfono.',
  'help.guide.read-place.step.4':
    'Luego la descripción y, bajo ella, las notas. Ambas son el texto del formulario del lugar, renderizado: listas, enlaces y negritas funcionan.',
  'help.guide.read-place.step.5': 'Participantes dice quién va a esta parada. Están todos hasta que saques a alguien.',
  'help.guide.read-place.step.6':
    'Horario de apertura, más abajo: la fila lleva el horario del día que estás mirando, y un clic en ella despliega toda la semana con ese día en negrita. Archivos está al lado.',
  'help.guide.read-place.result':
    'La ficha sigue abierta hasta que la cierras con la X o eliges otro lugar, el horario de la semana sigue desplegado, y la parada a la que pertenece se queda marcada en la columna de días.',
  'help.guide.read-place.tip.1':
    'Elegida desde la columna de lugares, la ficha conoce el lugar pero no una parada, así que no muestra ni participantes ni reserva. Elige la parada dentro del día y ahí están los dos.',
  'help.guide.read-place.tip.2':
    'Haz doble clic en el nombre para renombrar el lugar sin abrir el formulario. Intro guarda, Escape descarta el cambio.',
  'help.guide.read-place.tip.3':
    'Un lugar escrito a mano no muestra nada de eso: la ficha solo conoce lo que guarda su formulario. Ábrelo con Editar, elígelo entre las sugerencias bajo Buscar lugares... y haz clic en Actualizar, y el horario, el número de teléfono y la web vienen con él. La valoración de Google necesita una clave de Google.',
  // rate-place
  'help.guide.rate-place.title': 'Valorar un lugar',
  'help.guide.rate-place.goal': 'Dale a un lugar tus propias estrellas, y mira las que le han dado todos los demás.',
  'help.guide.rate-place.step.1':
    'Abre el lugar. La fila de estrellas está justo bajo la cabecera y lleva la media de los votos hasta ahora, con su número entre paréntesis.',
  'help.guide.rate-place.step.2':
    'Haz clic en la estrella que quieres. Las estrellas se llenan a medida que las recorres, así ves lo que estás a punto de dar.',
  'help.guide.rate-place.step.3':
    'Tu voto entra en la media al momento, y las caras de al lado son quienes han votado. Deja el puntero sobre la fila para ver las estrellas de cada uno.',
  'help.guide.rate-place.step.4':
    'La misma media está en la fila del lugar en la columna de lugares, así los buenos destacan en la lista.',
  'help.guide.rate-place.result':
    'Tus estrellas están en el lugar, a la vista de todo el viaje, y la estrella de la fila de filtros sobre la lista ya puede dejar solo los lugares que llegan a un mínimo.',
  'help.guide.rate-place.tip.1':
    'Todo viajero puede valorar, incluso en un viaje donde solo algunos tienen el permiso Añadir / editar / eliminar lugares.',
  'help.guide.rate-place.tip.2':
    'Haz clic en la estrella que ya diste para retirar tu voto. Sin nadie votando, el lugar vuelve a decir Sin valorar todavía.',
  'help.guide.rate-place.tip.3':
    'Junto a las estrellas caben hasta seis votantes como caras; el tooltip los nombra a todos, y marca el tuyo.',
  // place-image
  'help.guide.place-image.title': 'Poner tu propia imagen en un lugar',
  'help.guide.place-image.goal': 'Sustituye la miniatura automática por una foto tuya.',
  'help.guide.place-image.step.1': 'Abre el lugar desde la columna de lugares.',
  'help.guide.place-image.step.2':
    'Deja el puntero sobre la imagen redonda de la cabecera: aparece una cámara y el tooltip dice Subir imagen. Haz clic en ella y elige tu archivo.',
  'help.guide.place-image.step.3': 'La cabecera muestra ahora tu imagen, con una pequeña X roja en su esquina.',
  'help.guide.place-image.step.4':
    'La misma imagen está en la fila del lugar en la columna de lugares, y en su marcador en el mapa.',
  'help.guide.place-image.result':
    'Tu imagen es la imagen del lugar en todas partes: la ficha, la columna de lugares, la parada en el día, el marcador en el mapa y un viaje compartido.',
  'help.guide.place-image.tip.1': 'Se aceptan JPG, PNG, GIF y WebP, y un HEIC de un iPhone se convierte por el camino.',
  'help.guide.place-image.tip.2':
    'La X de la esquina vuelve a quitar tu imagen y regresa la automática. El lugar en sí queda intacto.',
  'help.guide.place-image.tip.3':
    'Sin una imagen tuya, TREK busca una a partir de las coordenadas del lugar, y recurre al icono de la categoría.',
  // place-day-assign
  'help.guide.place-day-assign.title': 'Poner el lugar en el día abierto, o quitarlo',
  'help.guide.place-day-assign.goal':
    'Usa el botón de la propia ficha en vez de arrastrar la fila por el planificador.',
  'help.guide.place-day-assign.step.1':
    'Haz clic en la cabecera de un día en la columna de días. Ese día es ahora el abierto, y la ficha trabaja sobre él.',
  'help.guide.place-day-assign.step.2':
    'Haz clic en la columna de lugares en un lugar que no esté en ese día. Su ficha se abre y la fila de abajo ofrece Añadir al día.',
  'help.guide.place-day-assign.step.3':
    'Haz clic en Añadir al día. La parada aterriza al final del día y el botón pasa a ser Quitar del día.',
  'help.guide.place-day-assign.step.4':
    'La parada ya está en el día, la última de la lista. Arrástrala hacia arriba hasta su sitio.',
  'help.guide.place-day-assign.step.5':
    'Quitar del día saca esa parada del día otra vez, y la ficha vuelve a ofrecer Añadir al día.',
  'help.guide.place-day-assign.result':
    'El día lleva la parada, o ya no la lleva, y el lugar en sí queda intacto en cualquiera de los dos casos.',
  'help.guide.place-day-assign.tip.1':
    'El botón solo existe mientras hay un día abierto. Sin uno, la ficha no tiene a qué añadir el lugar.',
  'help.guide.place-day-assign.tip.2':
    'Sacar una parada de un día deja el lugar en el viaje y en la columna de lugares. Eliminar es lo que lo quita de todas partes.',
  'help.guide.place-day-assign.tip.3':
    'Una parada que ha puesto en el día una reserva de alojamiento no ofrece ninguno de los dos botones: esa noche se añade y se quita en el bloque Alojamiento del día.',
  // place-participants
  'help.guide.place-participants.title': 'Decir quién va a esta parada',
  'help.guide.place-participants.goal': 'Divide el grupo para una parada sin dividir el viaje.',
  'help.guide.place-participants.step.1':
    'Haz clic en la parada dentro del día. La ficha se abre y Participantes lista a todos los del viaje.',
  'help.guide.place-participants.step.2':
    'Haz clic en el nombre de un viajero para sacarlo de esta parada. El nombre se tacha al pasar el puntero por encima.',
  'help.guide.place-participants.step.3':
    'Aparece un + discontinuo en cuanto falta alguien. Haz clic en él para ver quién no está en la parada.',
  'help.guide.place-participants.step.4':
    'Haz clic en un nombre para devolverlo. Con todos de vuelta, la parada vuelve a ser de todo el grupo.',
  'help.guide.place-participants.result':
    'La parada lleva a los viajeros que has elegido, y el resto del grupo tiene esa tarde para sí.',
  'help.guide.place-participants.tip.1':
    'Participantes solo aparece con una parada seleccionada, así que elige el lugar dentro del día y no en la columna de lugares, y solo en un viaje con más de un viajero.',
  'help.guide.place-participants.tip.2':
    'Nadie elegido significa que van todos, y por eso el último viajero que queda en una parada no se puede sacar.',
  'help.guide.place-participants.tip.3':
    'Un invitado, que no tiene cuenta propia, puede ser participante como cualquier otro.',
  // place-booking
  'help.guide.place-booking.title': 'La reserva de una parada',
  'help.guide.place-booking.goal': 'Lee la reserva que pertenece a una parada, ábrela y engancha una nueva a ella.',
  'help.guide.place-booking.step.1':
    'Abre la parada a la que pertenece la reserva. La ficha muestra una franja con Confirmada o Pendiente y el nombre de la reserva.',
  'help.guide.place-booking.step.2':
    'La franja lleva la Fecha, la Hora y el Código de reserva, y las notas que tenga la reserva.',
  'help.guide.place-booking.step.3': 'Haz clic en la franja. Se abre encima el formulario de la reserva.',
  'help.guide.place-booking.step.4':
    'Vincular a una asignación del día es lo que engancha una reserva a una parada, y aquí ya nombra esta. Cierra el formulario otra vez.',
  'help.guide.place-booking.step.5':
    'Una reserva nueva para una parada empieza en la columna de días: pasa el puntero por la parada y haz clic en el + de su extremo. El formulario se abre como Nueva reserva, ya vinculada a ella.',
  'help.guide.place-booking.result':
    'La reserva cuelga de la parada: está en la ficha, está en el día, y sus archivos aparecen aquí también bajo Archivos.',
  'help.guide.place-booking.tip.1':
    'La franja solo se muestra en la parada a la que la reserva está enganchada. Una reserva sin parada vive en la pestaña Reservas.',
  'help.guide.place-booking.tip.2':
    'Varias reservas pueden compartir una parada: la comida y la visita que sale de la misma puerta.',
  'help.guide.place-booking.tip.3':
    'Un tren, un vuelo o un ferry abre en su lugar el formulario de transporte, el que usa la pestaña Transportes.',
  // place-files
  'help.guide.place-files.title': 'Guardar las entradas de un lugar junto al lugar',
  'help.guide.place-files.goal': 'Pon la entrada, el bono o el plano de un lugar donde lo vas a buscar.',
  'help.guide.place-files.step.1':
    'Abre el lugar. Archivos está al pie de la ficha y dice Archivos mientras el lugar no tiene ninguno.',
  'help.guide.place-files.step.2': 'Haz clic en Subir, a su lado, y elige el archivo.',
  'help.guide.place-files.step.3': 'El botón cuenta lo que el lugar guarda, y la lista se abre sola.',
  'help.guide.place-files.step.4':
    'Cada fila es el nombre del archivo con su tamaño. Haz clic en ella para abrir el archivo.',
  'help.guide.place-files.result':
    'El archivo está en el lugar, contado en la ficha, y está también en la pestaña Archivos del viaje.',
  'help.guide.place-files.tip.1':
    'Archivos lista también lo que cuelga de la reserva de esta parada, así que una confirmación de hotel aparece en el hotel.',
  'help.guide.place-files.tip.2': 'Subir acepta varios archivos a la vez.',
  'help.guide.place-files.tip.3':
    'Sin el permiso Subir archivos, el botón Subir no está; los archivos que ya están en el lugar siguen ahí.',
  // place-navigation
  'help.guide.place-navigation.title': 'Abrir un lugar en una aplicación de mapas o en su web',
  'help.guide.place-navigation.goal': 'Entrega el lugar a la aplicación que de verdad te va a llevar allí.',
  'help.guide.place-navigation.step.1': 'Abre el lugar y haz clic en Navegación en la fila de abajo.',
  'help.guide.place-navigation.step.2':
    'La lista son las aplicaciones de mapas que encajan con este lugar: Google Maps, Waze, Apple Maps, OpenStreetMap y CoMaps.',
  'help.guide.place-navigation.step.3':
    'Haz clic en la que uses. TREK le pasa el lugar en sí donde puede, no solo un par de coordenadas, así llegas a la entrada correcta.',
  'help.guide.place-navigation.step.4':
    'Abrir la web, a su lado, abre la página propia del lugar, sus horarios y sus entradas, en una pestaña nueva.',
  'help.guide.place-navigation.result':
    'La aplicación de mapas se abre en el lugar, la web en una pestaña propia, y nada cambia en el viaje.',
  'help.guide.place-navigation.tip.1':
    'Waze empieza a navegar de inmediato. Las demás abren el lugar, y arrancar desde ahí es un toque más.',
  'help.guide.place-navigation.tip.2':
    'Qué aplicaciones se ofrecen depende del lugar y de tu dispositivo: Apple Maps se queda fuera en Android, 高德地图 solo sale con un lugar en China, y Waze, Apple Maps y CoMaps necesitan las coordenadas del lugar.',
  'help.guide.place-navigation.tip.3':
    'Cuando solo encaja una aplicación, el botón lleva el nombre de esa aplicación y la abre directamente.',
  // place-to-collection
  'help.guide.place-to-collection.title': 'Guardar un lugar en una de tus listas',
  'help.guide.place-to-collection.goal': 'Conserva para el próximo viaje un lugar que has encontrado en este.',
  'help.guide.place-to-collection.step.1': 'Abre el lugar y haz clic en Guardar en colección, al final de la ficha.',
  'help.guide.place-to-collection.step.2':
    'Guardar en una lista muestra todas las listas que tienes o compartes. Una marca señala las que ya contienen este lugar.',
  'help.guide.place-to-collection.step.3': 'Haz clic en la lista. El lugar está en ella al momento.',
  'help.guide.place-to-collection.step.4': 'Cierra, y el botón de la ficha dice Guardado.',
  'help.guide.place-to-collection.result':
    'El lugar está en tu lista con su imagen, sus notas y su dirección, listo para el próximo viaje.',
  'help.guide.place-to-collection.tip.1':
    'El botón solo está mientras el complemento Colecciones está activo, que el administrador enciende en Complementos.',
  'help.guide.place-to-collection.tip.2':
    'Un lugar puede estar en varias listas a la vez, con su propio estado en cada una: una Idea en una, Visitado en otra.',
  'help.guide.place-to-collection.tip.3':
    'Marcar como visitado, junto al nombre del lugar en el selector, lo marca en la lista; con el lugar en varias de tus listas la píldora dice Visitado en todas y las hace todas de una vez.',
  // place-track
  'help.guide.place-track.title': 'Leer una ruta y darle su propio color',
  'help.guide.place-track.goal':
    'Mira lo larga que es una caminata importada, y distingue su línea de las demás en el mapa.',
  'help.guide.place-track.step.1':
    'En la columna de lugares, la fila de una ruta lleva un trazo corto del color con el que está dibujada su línea. Haz clic en ella.',
  'help.guide.place-track.step.2':
    'Datos de la ruta da la longitud del camino, en la Unidad de distancia que hayas puesto.',
  'help.guide.place-track.step.3':
    'Color de la ruta, encima, muestra el color en uso. Haz clic en la fila para abrir las muestras.',
  'help.guide.place-track.step.4': 'Elige un color. La línea del mapa y el trazo de la fila cambian con él.',
  'help.guide.place-track.step.5':
    'La celda discontinua de la izquierda, Color automático, le devuelve a la ruta el color que hereda; la pipeta de la derecha abre el selector de color de tu sistema para cualquier otro.',
  'help.guide.place-track.result':
    'La ruta se dibuja en el color que has elegido, en la ficha, en su fila de la columna de lugares y en el mapa.',
  'help.guide.place-track.tip.1':
    'Solo un lugar que lleva un camino, importado de un archivo GPX, KML o KMZ, tiene estos dos bloques.',
  'help.guide.place-track.tip.2':
    'Una ruta grabada con alturas muestra además su punto más alto y más bajo, los metros de subida y de bajada, y el perfil de la caminata.',
  'help.guide.place-track.tip.3':
    'Una importación da a cada ruta que trae un color propio, así que dos caminatas nunca llegan con el mismo.',
  // read-place
  'help.guide.read-place.step.7':
    'La fila de abajo es lo que puedes hacer desde aquí: quitar el lugar del día abierto o ponerlo en él, guardarlo en una lista, abrirlo en una aplicación de mapas, editarlo o eliminarlo.',

  // ── Screen: trip-files ────────────────────────────────────────────────────────────────
  'help.ctx.trip-files.title': 'Archivos',
  'help.ctx.trip-files.summary':
    'Todos los documentos del viaje en una lista: billetes, confirmaciones, pases y fotos, cada uno con una nota, un vínculo al lugar o a la reserva a la que pertenece, y una papelera de la que puede volver a salir.',
  'help.ctx.trip-files.bullet.1':
    'Arrastra aquí los archivos, arriba, acepta los archivos; un clic en el recuadro abre el selector de archivos. La línea de debajo enumera los tipos de archivo que acepta este TREK y el límite de 50 MB por archivo.',
  'help.ctx.trip-files.bullet.2':
    'Las pestañas dicen qué muestra la lista: Todo, PDF, Imágenes y Documentos, cada una con su recuento. Una pestaña de estrella se les une en cuanto un archivo está destacado, y Notas de colaboración en cuanto una nota lleva un adjunto.',
  'help.ctx.trip-files.bullet.3':
    'Una fila lleva quién la subió, el nombre, la nota debajo, el tamaño y la fecha, y una etiqueta por cada vínculo: Plan diario y el lugar, Reserva o Transporte y la reserva, Desde notas de colaboración.',
  'help.ctx.trip-files.bullet.4':
    'Al final de una fila están Destacar, Asignar, Abrir, Descargar y Eliminar. Eliminar no pregunta: el archivo va a la papelera, de donde se puede recuperar.',
  'help.ctx.trip-files.bullet.5':
    'Una imagen o un vídeo se abre a pantalla completa, con las teclas de flecha y una tira de miniaturas; cualquier otro documento se abre en una vista previa sobre la página, con Abrir en una pestaña nueva y Descargar. Un pase de wallet se descarga de inmediato.',
  'help.ctx.trip-files.bullet.6':
    'Papelera, en el extremo derecho, cambia la lista a los archivos eliminados, donde cada uno se restaura o se elimina para siempre y Vaciar papelera los quita todos. Donde un administrador ha conectado un almacén de documentos, Sincronización de documentos está al lado.',
  // files-upload
  'help.guide.files-upload.title': 'Meter un documento en el viaje',
  'help.guide.files-upload.goal':
    'Saca un billete, una confirmación o una foto de tu carpeta de descargas y ponlos en el viaje, donde todos los que están en él pueden alcanzarlos.',
  'help.guide.files-upload.step.1':
    'Abre el viaje y haz clic en Archivos en la barra de pestañas. Ahí están los documentos del viaje, con el recuadro de subida encima.',
  'help.guide.files-upload.step.2':
    'Haz clic en Arrastra aquí los archivos y elige uno o varios archivos. Se suben uno tras otro y en el recuadro pone Subiendo... mientras dura. La línea de debajo dice qué tipos acepta este TREK y que un archivo puede tener 50 MB como máximo.',
  'help.guide.files-upload.step.3':
    'En cuanto el último archivo está arriba, Asignar archivo se abre solo para él. Añadir una nota... le da al archivo una línea propia, y las listas de debajo lo atan a un lugar o a una reserva. Ciérralo con la ×; al cerrarlo no se pierde nada.',
  'help.guide.files-upload.step.4':
    'Los archivos nuevos quedan arriba del todo en la lista. Una fila muestra quién lo subió, el nombre, el tamaño y la fecha; una imagen recibe una miniatura, cualquier otro archivo su tipo.',
  'help.guide.files-upload.result':
    'Los documentos están en el viaje, y todo el que puede ver el viaje puede abrirlos y descargarlos.',
  'help.guide.files-upload.tip.1':
    'Un archivo también se puede arrastrar desde el escritorio directamente al recuadro, que se ilumina mientras el archivo está encima.',
  'help.guide.files-upload.tip.2':
    'Una imagen del portapapeles entra en la lista con Ctrl+V, así que nunca hay que guardar antes una captura de una reserva.',
  'help.guide.files-upload.tip.3':
    'Subir necesita el permiso Subir archivos; sin él el recuadro no está siquiera. Un tipo que no está en la lista se rechaza con un mensaje y no se sube nada. Un archivo de más de 50 MB lo descarta el propio recuadro, antes de que se envíe nada.',
  // files-link
  'help.guide.files-link.title': 'Atar un documento a un lugar o a una reserva',
  'help.guide.files-link.goal':
    'Haz que el billete se encuentre desde el día al que pertenece, y no solo desde esta lista.',
  'help.guide.files-link.step.1':
    'Haz clic en Asignar, el lápiz al final de la fila. Se abre Asignar archivo, con el nombre del archivo.',
  'help.guide.files-link.step.2':
    'Bajo Nota, Añadir una nota... admite una línea, que después queda bajo el nombre del archivo en la lista. Se guarda en el momento en que sales del campo.',
  'help.guide.files-link.step.3':
    'Bajo Lugar están los lugares del viaje, agrupados por el día en el que están, con Sin asignar al final para los que no están en ningún día. Haz clic en uno y recibe una marca.',
  'help.guide.files-link.step.4':
    'Bajo Reserva y Transporte están las reservas del viaje. Haz clic en aquella a la que pertenece el documento; también recibe su marca.',
  'help.guide.files-link.step.5':
    'Cierra con la ×. Aquí no hay botón de guardar: cada clic se escribió en cuanto lo hiciste.',
  'help.guide.files-link.result':
    'La fila lleva la nota y una etiqueta por cada vínculo, Plan diario y el nombre del lugar, Transporte y el nombre del vuelo, y el documento cuelga además del lugar y del vuelo.',
  'help.guide.files-link.tip.1':
    'Un archivo puede tener varios vínculos a la vez, así que la misma confirmación pertenece al hotel y a la noche que cubre.',
  'help.guide.files-link.tip.2':
    'Volver a hacer clic en una entrada marcada quita ese vínculo; el archivo en sí se queda.',
  'help.guide.files-link.tip.3':
    'Funciona también al revés: un documento adjunto a un lugar o a una reserva está también en esta lista, con la misma etiqueta en su fila.',
  // files-star
  'help.guide.files-star.title': 'Mantener arriba los documentos importantes',
  'help.guide.files-star.goal':
    'Saca los dos o tres papeles que vas a necesitar de verdad de una lista que crece durante todo el viaje.',
  'help.guide.files-star.step.1':
    'Haz clic en Destacar al final de una fila. La estrella se llena de amarillo, aparece una segunda estrella delante del nombre del archivo y el botón pasa a decir Quitar destacado.',
  'help.guide.files-star.step.2':
    'La lista se vuelve a ordenar: los archivos destacados quedan por encima de todos los demás, los más nuevos primero dentro de cada grupo.',
  'help.guide.files-star.step.3':
    'Arriba se ha unido una estrella a las pestañas, con el número de archivos destacados detrás. Haz clic en ella para ver solo esos.',
  'help.guide.files-star.result':
    'Los papeles que necesitas en el mostrador están arriba del todo en la lista, y una pestaña no muestra nada más.',
  'help.guide.files-star.tip.1':
    'La pestaña de estrella solo existe mientras algo está destacado. Quita el destacado al último archivo y la pestaña se va con él.',
  'help.guide.files-star.tip.2':
    'Destacar cuenta como una edición: un miembro que solo puede leer los archivos del viaje ve las estrellas pero no puede ponerlas.',
  // files-filter
  'help.guide.files-filter.title': 'Encontrar un documento en la lista',
  'help.guide.files-filter.goal': 'Reduce una lista con todo al único tipo de papel que buscas.',
  'help.guide.files-filter.step.1':
    'Las pestañas encima de la lista son Todo, PDF, Imágenes y Documentos, cada una con el número de archivos detrás.',
  'help.guide.files-filter.step.2': 'Haz clic en PDF: la lista se queda con los archivos PDF y con nada más.',
  'help.guide.files-filter.step.3':
    'Otras dos pestañas van y vienen según lo que hay en el viaje. Haz clic en Notas de colaboración, que está ahí en cuanto una nota de la pestaña Colaboración lleva un adjunto: la lista se queda con esos archivos y nada más. Una estrella se suma a la fila igual, en cuanto un archivo está destacado.',
  'help.guide.files-filter.step.4': 'Todo devuelve la lista entera.',
  'help.guide.files-filter.result':
    'La lista muestra solo lo que nombra la pestaña, y el recuento de cada pestaña dice cuántos son.',
  'help.guide.files-filter.tip.1':
    'Aquí no hay carpetas ni cambios de nombre: la nota de Asignar archivo, los vínculos a lugares y reservas, y la estrella son aquello por lo que se ordena un documento.',
  'help.guide.files-filter.tip.2':
    'La lista en sí va siempre destacados primero y después los más nuevos primero, así que un documento subido hoy queda por encima de uno del mes pasado.',
  // files-preview
  'help.guide.files-preview.title': 'Leer un documento sin salir de TREK',
  'help.guide.files-preview.goal':
    'Mira un billete o una imagen en el sitio, y llévatelos a tu propia máquina cuando los necesites ahí.',
  'help.guide.files-preview.step.1':
    'Haz clic en el nombre de una imagen o en su miniatura. Se abre a pantalla completa, con el nombre del archivo y su posición entre las imágenes en la cabecera.',
  'help.guide.files-preview.step.2':
    'Las flechas redondas de los lados, las teclas de flecha izquierda y derecha y la tira de miniaturas de abajo recorren todas las imágenes que la lista muestra en ese momento.',
  'help.guide.files-preview.step.3':
    'Abrir en una pestaña nueva y Descargar están en la cabecera; la × o Escape vuelve a cerrar la imagen.',
  'help.guide.files-preview.step.4':
    'Un documento que no es una imagen se abre en cambio en una vista previa sobre la página, con los mismos dos botones en su cabecera. Esta se cierra con la × o con un clic al lado.',
  'help.guide.files-preview.step.5':
    'Descargar al final de una fila guarda el archivo directamente en tu máquina, sin abrir nada antes.',
  'help.guide.files-preview.result':
    'El documento está en pantalla, y los mismos dos botones lo ponen en una pestaña del navegador o en tu disco.',
  'help.guide.files-preview.tip.1':
    'En una pantalla táctil pasas las imágenes con el dedo en vez de hacer clic en las flechas.',
  'help.guide.files-preview.tip.2':
    'Un pase de wallet nunca abre una vista previa: se descarga de inmediato, para que el teléfono pueda pasárselo a su aplicación wallet.',
  'help.guide.files-preview.tip.3':
    'Abrir en una pestaña nueva y Descargar traen ambos el archivo con tu sesión, así que un enlace copiado de la barra de direcciones no le sirve a nadie más.',
  // files-trash
  'help.guide.files-trash.title': 'Tirar un documento y recuperarlo',
  'help.guide.files-trash.goal':
    'Quita de en medio lo que el viaje ya no necesita, sin perder nada que al final sí necesitabas.',
  'help.guide.files-trash.step.1':
    'Haz clic en Eliminar al final de una fila. El archivo deja la lista al instante y el mensaje dice Movido a la papelera. Nada pregunta antes.',
  'help.guide.files-trash.step.2':
    'Papelera, en el extremo derecho de la barra de herramientas, cambia la lista a lo que se ha tirado. El título dice Papelera y las pestañas de filtro ya no están.',
  'help.guide.files-trash.step.3':
    'Una fila tirada queda en gris y le quedan dos botones: Restaurar, que devuelve el archivo, y Eliminar, que lo quita para siempre tras una pregunta.',
  'help.guide.files-trash.step.4':
    'Haz clic en Restaurar. El mensaje dice Archivo restaurado y la fila deja la papelera, con su nota y sus vínculos todavía puestos.',
  'help.guide.files-trash.step.5':
    'Vaciar papelera, arriba, quita para siempre todo lo que quede aquí, y el navegador pregunta una vez antes de hacerlo. Papelera vuelve a cambiar a los archivos.',
  'help.guide.files-trash.result':
    'El archivo está de vuelta en la lista donde estaba, como si no hubiera pasado nada.',
  'help.guide.files-trash.tip.1':
    'Eliminar en una fila no pregunta antes, y para eso está la papelera: nada sale de TREK hasta que lo dices aquí dentro.',
  'help.guide.files-trash.tip.2':
    'Tirar un archivo y recuperarlo necesita el permiso Eliminar archivos. Un miembro que no lo tiene no ve ni Eliminar en la fila ni los botones de la papelera.',
  'help.guide.files-trash.tip.3': 'Un archivo eliminado para siempre en la papelera no se puede recuperar.',
  // files-sync
  'help.guide.files-sync.title': 'Mantener los documentos al día con tu almacén de documentos',
  'help.guide.files-sync.goal':
    'Vincula el viaje a tu propio almacén de documentos, para que lo que se sube aquí aterrice allí y lo que se archiva allí aparezca aquí.',
  'help.guide.files-sync.step.1':
    'Haz clic en Sincronización de documentos, junto a Papelera en el extremo derecho de la barra de herramientas. El diálogo se abre con el nombre del viaje bajo su título. A la izquierda, bajo Conectar un proveedor, están los almacenes que un administrador ha activado, cada uno con una línea sobre cómo archiva: Paperless-ngx y Papra por etiqueta, Nextcloud y Synology Drive en una carpeta, OpenCloud en un espacio. A la derecha se lee Aún no hay nada conectado.',
  'help.guide.files-sync.step.2':
    'Haz clic en tu almacén, aquí Nextcloud. Se abre un diálogo más pequeño para la conexión, con el nombre del almacén, que pide los datos con los que se inicia sesión en ese almacén.',
  'help.guide.files-sync.step.3':
    'Rellena Dirección y el inicio de sesión propio del almacén: un Token de API para Paperless-ngx, una Clave de API y el ID de organización para Papra, Nombre de usuario y una Contraseña de aplicación para Nextcloud, Nombre de usuario y un Token de aplicación para OpenCloud, y para Synology Drive Nombre de usuario, Contraseña y, si la cuenta lo pide, un Código de doble factor. Usa una contraseña o un token de aplicación siempre que el almacén lo ofrezca, nunca la contraseña de tu cuenta. Nextcloud y Synology Drive admiten además una Carpeta base opcional, donde TREK busca las carpetas de viaje, aquí /Reisen. Aceptar un certificado autofirmado, abajo del todo, es solo para un almacén en tu propia red con un certificado así.',
  'help.guide.files-sync.step.4':
    'Haz clic en Probar conexión. TREK alcanza el almacén con lo que escribiste y el pie dice Conectado, sesión iniciada como seguido del nombre de la cuenta. Unas credenciales rechazadas o una dirección inalcanzable se nombran ahí en su lugar, y en ningún caso se guarda nada.',
  'help.guide.files-sync.step.5':
    'Haz clic en Conectar. La conexión se guarda con el viaje y TREK pregunta dónde debe guardarse el viaje en el almacén: la etiqueta, la carpeta o el espacio que contiene sus documentos. Solo se sincroniza lo que hay dentro. Crear uno nuevo lo crea con Crear, con un nombre prerrellenado a partir del título del viaje; bajo O usa uno que ya tengas están los que ya existen. Haz clic en uno, aquí la carpeta Autumn in Japan.',
  'help.guide.files-sync.step.6':
    'El diálogo vuelve: tu almacén está bajo Este viaje a la izquierda, y su tarjeta a la derecha indica adónde sincroniza, cuándo se ejecutó por última vez y Sincronizar ahora. Una primera ejecución arranca sola; Sincronizar ahora lanza una cuando quieras. Cuando una ejecución termina, la insignia Aún sin sincronizar junto al nombre da paso a un punto verde, Al día cuando lo señalas, y la barra de flujo cuenta los documentos que tienen TREK y el almacén cada uno, con los carriles Hacia el gestor y Desde el gestor entre ellos. Cierra el diálogo con la ×.',
  'help.guide.files-sync.result':
    'Los documentos que ya estaban allí están arriba de la lista, subidos a tu nombre, y cada documento del viaje está también en el almacén. Desde ahora TREK revisa el almacén en segundo plano, y el almacén sigue a la lista.',
  'help.guide.files-sync.tip.1':
    'Solo el propietario del viaje o un administrador de la instancia puede vincular un viaje, ya que las credenciales alcanzan toda esa cuenta del almacén. Cualquier miembro puede abrir Sincronización de documentos, leer la tarjeta y pulsar Sincronizar ahora.',
  'help.guide.files-sync.tip.2':
    'Un almacén en tu propia red necesita ALLOW_INTERNAL_NETWORK=true en el servidor de TREK, y su dirección tiene que ser la de la máquina en la red, nunca localhost. Sin eso, Probar conexión responde Esa dirección no está permitida.',
  'help.guide.files-sync.tip.3':
    'Desconectar en la tarjeta termina el emparejamiento y conserva cada documento en ambos lados. Una etiqueta, carpeta o espacio vinculado por segunda vez se trata como nuevo, y todo lo que hay dentro entra otra vez, así que después de un Desconectar vincula uno vacío y no el antiguo.',

  // ── Screen: trip-day-detail ───────────────────────────────────────────────────────────
  'help.ctx.trip-day-detail.title': 'Detalles del día',
  'help.ctx.trip-day-detail.summary':
    'El panel que la cabecera de un día abre sobre el mapa: el día entero, su nombre y su fecha, el tiempo donde vas a estar, las reservas que caen en él y las noches reservadas para él.',
  'help.ctx.trip-day-detail.bullet.1':
    'Haz clic en la cabecera de un día en la columna de días y el panel se abre sobre el centro del mapa. La misma cabecera otra vez, o la equis a su derecha, lo cierra y suelta el día.',
  'help.ctx.trip-day-detail.bullet.2':
    'La cabecera lleva el nombre del día y su fecha. El lápiz junto al nombre renombra el día, el doble chevrón pliega el panel a una barra estrecha para dejar el mapa libre otra vez.',
  'help.ctx.trip-day-detail.bullet.3':
    'Arriba del todo, el tiempo del día. Pronóstico para nombra el lugar al que corresponde: la primera parada del día, o el alojamiento donde te despiertas.',
  'help.ctx.trip-day-detail.bullet.4':
    'Reservas lista las reservas de ese día, cada una con su tipo, la parada a la que pertenece y sus horas. Verde significa confirmada, ámbar todavía pendiente; es solo una lectura, las reservas se cambian en la pestaña Reservas.',
  'help.ctx.trip-day-detail.bullet.5':
    'Alojamiento muestra cada noche reservada sobre este día, con Registro de entrada y Registro de salida en los días en que ocurren, la franja de entrada, la hora de salida y el número de confirmación.',
  'help.ctx.trip-day-detail.bullet.6':
    'Añadir alojamiento reserva una noche en este día: elige el establecimiento entre los lugares del viaje, di qué días cubre, y añade las horas y el código.',
  // day-panel
  'help.guide.day-panel.title': 'Abrir un día y leer sus detalles',
  'help.guide.day-panel.goal': 'Ver un día entero, su tiempo, sus reservas y dónde duermes, sin salir del mapa.',
  'help.guide.day-panel.step.1':
    'Haz clic en la cabecera de un día en la columna de días. El día queda seleccionado y sus detalles se abren sobre el centro del mapa.',
  'help.guide.day-panel.step.2': 'La cabecera nombra el día, Día 1 hasta que le des un nombre, con su fecha debajo.',
  'help.guide.day-panel.step.3':
    'Arriba del todo, el tiempo del día. Pronóstico para dice a qué lugar corresponde: la primera parada del día, o el alojamiento donde te despiertas.',
  'help.guide.day-panel.step.4': 'Reservas, debajo, lista las reservas que caen en este día, con sus horas.',
  'help.guide.day-panel.step.5':
    'Alojamiento muestra las noches reservadas sobre este día, con Registro de entrada y Registro de salida en los días en que ocurren.',
  'help.guide.day-panel.step.6':
    'El doble chevrón de la cabecera pliega el panel a una barra estrecha. La equis de al lado cierra el panel y suelta el día.',
  'help.guide.day-panel.result':
    'Plegado a su barra, el panel deja el mapa libre y mantiene el día seleccionado; cerrado, el día se deselecciona y el plan queda como estaba.',
  'help.guide.day-panel.tip.1':
    'Hacer clic en cualquier punto de la barra de cabecera del panel también lo pliega. El chevrón es solo el botón para ello.',
  'help.guide.day-panel.tip.2':
    'Abrir un lugar desde la columna de lugares pone los detalles del lugar en el sitio del panel. Ciérralos y el día vuelve.',
  // day-weather
  'help.guide.day-weather.title': 'Leer el tiempo del día',
  'help.guide.day-weather.goal': 'Saber cómo será el día allí donde de verdad estás ese día.',
  'help.guide.day-weather.step.1':
    'Pronóstico para nombra el lugar al que corresponden los números: la primera parada del día o, en un día sin ninguna, el alojamiento donde te despiertas.',
  'help.guide.day-weather.step.2':
    'El número grande es la temperatura del día, a su lado la mínima y la máxima, y la condición en palabras.',
  'help.guide.day-weather.step.3':
    'Los chips de debajo: la probabilidad de lluvia, cuánta cae, el viento más fuerte, y el amanecer y el atardecer.',
  'help.guide.day-weather.step.4':
    'Abajo del todo, el día hora por hora, cada dos horas: la hora, el icono, la temperatura y la probabilidad de lluvia. Una hora por encima del 50 por ciento se sombrea en azul.',
  'help.guide.day-weather.result':
    'La tarjeta del día en la columna de días lleva el mismo tiempo en pequeño bajo su número, así que todo el viaje se lee de un vistazo.',
  'help.guide.day-weather.tip.1':
    'Los grados y el viento siguen Unidad de temperatura, en Pantalla dentro de Ajustes: elige °F Fahrenheit y el mismo pronóstico se da en °F y mph.',
  'help.guide.day-weather.tip.2':
    'Un día sin parada localizada y sin alojamiento donde despertarse no muestra ningún tiempo: el pronóstico es siempre para un lugar, nunca para el viaje.',
  'help.guide.day-weather.tip.3':
    'Más allá de 16 días no hay pronóstico que obtener. Los números son entonces los promedios de años anteriores para esa fecha, marcados con Ø, y debajo se dice que es así.',
  // rename-day
  'help.guide.rename-day.title': 'Dar un nombre al día',
  'help.guide.rename-day.goal': 'Llamar a un día por lo que es, Llegada a Kyoto o Día de descanso, en vez de Día 5.',
  'help.guide.rename-day.step.1': 'Abre el día. Su cabecera dice Día 5, con la fecha debajo.',
  'help.guide.rename-day.step.2': 'Haz clic en el lápiz junto al nombre.',
  'help.guide.rename-day.step.3': 'El nombre se convierte en un campo. Escribe el nombre que quieras.',
  'help.guide.rename-day.step.4':
    'Pulsa Intro, o simplemente haz clic en otro sitio; Esc descarta el cambio. La tarjeta del día en la columna de días lleva el nombre también.',
  'help.guide.rename-day.result':
    'El nombre sustituye a Día 5 en el panel y en la tarjeta del día de la columna de días; la fecha se queda donde estaba.',
  'help.guide.rename-day.tip.1':
    'Vacía el campo y guarda, y el día vuelve a ser Día 5: el número es lo que se ve cuando no hay nombre.',
  'help.guide.rename-day.tip.2':
    'El nombre pertenece al día, no a su fecha. Reordena los días y el nombre viaja con todo lo demás de ese día.',
  // add-accommodation
  'help.guide.add-accommodation.title': 'Reservar una noche en un día',
  'help.guide.add-accommodation.goal':
    'Poner el hotel en el plan una sola vez, con los días que cubre, sus horas y su número de confirmación.',
  'help.guide.add-accommodation.step.1':
    'El establecimiento tiene que ser primero un lugar del viaje. Créalo en la columna de lugares como cualquier otro lugar: el selector solo ofrece lo que ya está ahí.',
  'help.guide.add-accommodation.step.2':
    'Abre el día de tu llegada y haz clic en Añadir alojamiento, bajo Alojamiento.',
  'help.guide.add-accommodation.step.3':
    'Aplicar a los días dice qué noches cubre la estancia: el día de entrada a la izquierda, el día de salida a la derecha. Todos toma el viaje entero.',
  'help.guide.add-accommodation.step.4':
    'Rellena Registro de entrada, Hasta y Registro de salida, y pon el número de la reserva bajo Confirmación. Los cuatro pueden quedar vacíos.',
  'help.guide.add-accommodation.step.5':
    'Elige el establecimiento entre los lugares del viaje. Los chips sobre la lista la reducen a una categoría.',
  'help.guide.add-accommodation.step.6': 'Haz clic en Guardar.',
  'help.guide.add-accommodation.result':
    'La estancia aparece en cada día que cubre, Registro de entrada en el primero y Registro de salida en el último. El establecimiento se convierte en parada del día de entrada, de modo que el mapa dibuja el camino hasta allí, y en la pestaña Reservas aparece una reserva de tipo Alojamiento.',
  'help.guide.add-accommodation.tip.1':
    'El selector se abre en el día del que venías, con la salida al día siguiente; ambos se pueden mover antes de guardar.',
  'help.guide.add-accommodation.tip.2':
    'Dale al hotel la categoría Hotel del viaje al crearlo y los chips sobre la lista la reducen a tus hoteles con un solo clic.',
  'help.guide.add-accommodation.tip.3':
    'Las horas son todas opcionales: una estancia sin entrada y sin código cubre igualmente sus noches y dibuja igualmente su ruta.',
  // edit-accommodation
  'help.guide.edit-accommodation.title': 'Cambiar o cancelar una noche reservada',
  'help.guide.edit-accommodation.goal': 'Mover una estancia, corregir sus horas, o sacarla del plan otra vez.',
  'help.guide.edit-accommodation.step.1':
    'En cada día de la estancia, la tarjeta muestra el establecimiento, la franja de entrada, la hora de salida y el número de confirmación.',
  'help.guide.edit-accommodation.step.2':
    'El lápiz de su derecha vuelve a abrir la estancia. La ventana dice ahora Editar alojamiento.',
  'help.guide.edit-accommodation.step.3':
    'Corrige la fila de campos: Registro de entrada, Hasta, Registro de salida y Confirmación. Los días de arriba y el establecimiento de abajo también se cambian aquí.',
  'help.guide.edit-accommodation.step.4': 'Haz clic en Guardar.',
  'help.guide.edit-accommodation.step.5':
    'La equis de al lado del lápiz termina la estancia. No pregunta nada, y la reserva de tipo Alojamiento que le pertenece se va con ella.',
  'help.guide.edit-accommodation.result':
    'El cambio llega de una vez a cada día que la estancia cubre, y con él a la reserva de tipo Alojamiento de la pestaña Reservas.',
  'help.guide.edit-accommodation.tip.1':
    'Una noche en medio de una estancia no lleva ni la etiqueta Registro de entrada ni Registro de salida: solo las llevan el primer y el último día del rango.',
  'help.guide.edit-accommodation.tip.2':
    'Cancelar una estancia se lleva también la parada que puso en el día de entrada y cualquier coste unido a su reserva. Reserva la noche de nuevo si fue un error.',
  // day-bookings
  'help.guide.day-bookings.title': 'Las reservas del día de un vistazo',
  'help.guide.day-bookings.goal': 'Ver en un solo sitio qué hay ya reservado para este día y si está confirmado.',
  'help.guide.day-bookings.step.1':
    'Reservas lista las reservas del día: las fechadas en él, y las que cuelgan de alguna de sus paradas.',
  'help.guide.day-bookings.step.2':
    'Una fila muestra de qué tipo de reserva se trata, su nombre y, cuando pertenece a una parada, esa parada tras un punto. Sus horas van al extremo derecho.',
  'help.guide.day-bookings.step.3':
    'El color dice cómo está una reserva: una fila verde está confirmada, una ámbar sigue pendiente. Los alojamientos no están en esta lista, tienen su propio bloque debajo.',
  'help.guide.day-bookings.step.4':
    'La lista solo lee las reservas. Una reserva se crea y se cambia en la pestaña Reservas.',
  'help.guide.day-bookings.result':
    'Todo lo fechado en el día, y todo lo que cuelga de alguna de sus paradas, está en esta única lista.',
  'help.guide.day-bookings.tip.1':
    'Una reserva cae en un día por su propia fecha. Cambia la fecha en la pestaña Reservas y se muda al otro día por sí sola.',
  'help.guide.day-bookings.tip.2':
    'Que no haya bloque Reservas significa que el día no tiene reservas: se oculta en vez de mostrarse vacío.',

  // ── Screen: trip-map ──────────────────────────────────────────────────────────────────
  'help.ctx.trip-map.title': 'Mapa',
  'help.ctx.trip-map.summary':
    'El centro del plan: cada lugar del viaje como un pin, las rutas que los unen y los interruptores en los bordes del mapa para el satélite, para todo el viaje de una vez y para los lugares alrededor de la zona que estás mirando.',
  'help.ctx.trip-map.bullet.1':
    'Un pin es un lugar: su propia foto cuando la tiene, si no el color de su categoría con el icono de la categoría. Deja el puntero encima para ver una ficha con su nombre y su dirección, además de su categoría y su valoración cuando el lugar las lleva. Arrastra un pin hasta una tarjeta del día para planificar ahí el lugar.',
  'help.ctx.trip-map.bullet.2':
    'Los pines demasiado juntos para distinguirse se pliegan en una burbuja oscura con un recuento. Haz clic en la burbuja y el mapa se acerca a lo que hay dentro.',
  'help.ctx.trip-map.bullet.3':
    'Haz clic en un pin para abrir el lugar bajo el mapa, con su valoración, sus archivos y lo que puedes hacer con él a continuación; haz clic en un trozo vacío del mapa para soltarlo otra vez.',
  'help.ctx.trip-map.bullet.4':
    'Con un día abierto en la columna de días, sus paradas llevan una pequeña insignia blanca con su número dentro de ese día, y un lugar planificado en dos días lleva los dos números, unidos por ·.',
  'help.ctx.trip-map.bullet.5':
    'La fila de iconos de arriba busca en la parte del mapa que ves: Restaurantes, Cafés, Bares y ocio nocturno, Alojamiento, Lugares de interés, Museos y cultura, Naturaleza y parques y Actividades. Buscar en esta zona la repite después de que muevas el mapa.',
  'help.ctx.trip-map.bullet.6':
    'Un clic derecho en cualquier punto del mapa abre el formulario de lugar en ese punto, con la dirección ya consultada. El botón redondo de abajo a la izquierda cambia el mapa dibujado por imágenes aéreas.',
  'help.ctx.trip-map.bullet.7':
    'Mostrar todo el viaje, abajo a la derecha, dibuja todos los días de trayecto a la vez y lista lo que cubre cada uno; el icono de ruta en la fila de una reserva dibuja esa reserva, y el de la barra de herramientas sobre los días las dibuja todas.',
  // map-markers
  'help.guide.map-markers.title': 'Leer el mapa',
  'help.guide.map-markers.goal': 'Saber qué te dice cada pin, insignia y burbuja del mapa.',
  'help.guide.map-markers.step.1':
    'El mapa lleva todos los lugares del viaje. Donde los pines quedan demasiado juntos para distinguirse, se pliegan en una burbuja oscura que lleva el número que hay dentro; haz clic en la burbuja y el mapa se acerca a lo que había dentro, o, en el zoom más profundo, abre los pines en abanico.',
  'help.guide.map-markers.step.2':
    'Un pin es la propia foto del lugar cuando la tiene, si no el color de su categoría con el icono de la categoría. Deja el puntero encima y una ficha da su nombre y su dirección, con su categoría y su valoración cuando el lugar las lleva.',
  'help.guide.map-markers.step.3':
    'Haz clic en un pin y el lugar se abre en una ficha bajo el mapa: sus coordenadas, su valoración, sus archivos, y abajo del todo qué hacer con él a continuación, entre ello Navegación, Editar y Eliminar, con Añadir al día mientras hay un día abierto. Haz clic en un trozo vacío del mapa para soltarlo otra vez.',
  'help.guide.map-markers.step.4':
    'Abre un día en la columna de días y sus paradas se numeran: la pequeña insignia blanca en la esquina de un pin es el puesto de esa parada en el día. Un lugar planificado en dos días lleva los dos números, unidos por ·. Sin un día abierto no hay números, y la esquina lleva la valoración en su lugar.',
  'help.guide.map-markers.step.5':
    'Arrastra un pin fuera del mapa hasta una tarjeta del día en la columna de días y el lugar queda planificado ese día, igual que si arrastraras su fila fuera de la lista de lugares.',
  'help.guide.map-markers.result':
    'Nada del viaje ha cambiado: el mapa es una vista de él, y cada pin dice qué lugar, qué día y en qué orden.',
  'help.guide.map-markers.tip.1':
    'Un día plegado en la columna de días se lleva sus paradas fuera del mapa; vuelve a abrir el día y están de vuelta.',
  'help.guide.map-markers.tip.2':
    'El filtro sobre la lista de lugares decide también lo que dibuja el mapa: elige Sin planificar y solo quedan en él los lugares que aún no tienen día.',
  'help.guide.map-markers.tip.3':
    'Este mapa no tiene botones de zoom: la rueda acerca y aleja, un doble clic acerca un paso, y arrastrar el propio mapa lo mueve.',
  // map-nearby-places
  'help.guide.map-nearby-places.title': 'Encontrar lugares a tu alrededor en el mapa',
  'help.guide.map-nearby-places.goal':
    'Deja que el mapa busque restaurantes, lugares de interés o un hotel en la zona que estás mirando, y llévate uno al viaje.',
  'help.guide.map-nearby-places.step.1':
    'La fila de iconos de la parte alta del mapa es la búsqueda por categoría: Restaurantes, Cafés, Bares y ocio nocturno, Alojamiento, Lugares de interés, Museos y cultura, Naturaleza y parques y Actividades.',
  'help.guide.map-nearby-places.step.2':
    'Haz clic en una categoría. TREK busca ese tipo de lugar en la parte del mapa que ves y suelta un pin del color de la categoría por cada resultado. Una categoría cada vez: hacer clic en otra la cambia, y hacer clic en la que está activa la apaga.',
  'help.guide.map-nearby-places.step.3':
    'Mueve el mapa y aparece un segundo botón bajo la fila: Buscar en esta zona repite la misma búsqueda para la vista nueva. Moverlo por sí solo nunca vuelve a buscar, lo que mantiene bajo el número de peticiones.',
  'help.guide.map-nearby-places.step.4':
    'Los pines llevan el nombre de lo que se ha encontrado. Haz clic en uno y el formulario de lugar se abre ya rellenado a partir de él: Nombre, Dirección, Latitud y Longitud, y la página web y el teléfono donde OpenStreetMap los tiene.',
  'help.guide.map-nearby-places.step.5':
    'Revisa lo que ha rellenado y añade lo que la búsqueda no podía saber: una Descripción, una Categoría, notas tuyas.',
  'help.guide.map-nearby-places.step.6':
    'Haz clic en Añadir. Si ya hay un lugar con el mismo nombre en el viaje, el formulario lo avisa y el botón pasa a ser Añadir de todos modos.',
  'help.guide.map-nearby-places.result':
    'El lugar está en la lista de lugares y en el mapa como uno de los pines propios del viaje, bajo Sin planificar hasta que lo pongas en un día. Los pines de la búsqueda se quedan hasta que apagues la categoría.',
  'help.guide.map-nearby-places.tip.1':
    'La fila no está cuando Explorar lugares en el mapa está apagado en Ajustes, bajo Travel & map.',
  'help.guide.map-nearby-places.tip.2':
    'Las respuestas vienen del índice de lugares de TREK y de OpenStreetMap, así que esta es una de las pocas cosas del plan que necesita conexión.',
  'help.guide.map-nearby-places.tip.3':
    'Una búsqueda cubre lo que hay en pantalla, así que acércate a la calle por la que preguntas: una ciudad entera responde con los primeros sesenta resultados y con poco orden entre ellos.',
  // map-add-place
  'help.guide.map-add-place.title': 'Crear un lugar con un clic derecho en el mapa',
  'help.guide.map-add-place.goal': 'Pon un lugar exactamente donde lo quieres, sin buscarlo antes.',
  'help.guide.map-add-place.step.1':
    'Haz clic derecho en el punto del mapa que quieres. Se abre el formulario de lugar, titulado Añadir lugar/actividad.',
  'help.guide.map-add-place.step.2':
    'Latitud y Longitud ya están en ese punto, y TREK consulta las coordenadas y rellena Dirección con lo que encuentra allí, y también Nombre cuando la consulta da uno. Todavía no hay nada guardado, así que sobrescribe lo que esté mal.',
  'help.guide.map-add-place.step.3':
    'Dale un Nombre que reconozcas, y el resto de lo que el plan debe saber: Descripción, Notas, Categoría, Página web.',
  'help.guide.map-add-place.step.4':
    'Haz clic en Añadir. El lugar cae en la lista como sin planificar incluso con un día abierto: un clic derecho en el mapa dice dónde, no cuándo.',
  'help.guide.map-add-place.result':
    'El lugar está en la lista y en el mapa, bajo Sin planificar hasta que lo pongas en un día.',
  'help.guide.map-add-place.tip.1':
    'La dirección viene de una consulta de las coordenadas, así que puede leerse como una calle y no como un nombre, y en campo abierto puede volver vacía. Los dos campos son tuyos para sobrescribirlos.',
  'help.guide.map-add-place.tip.2':
    'En los mapas MapLibre GL y Mapbox GL un clic con el botón central hace lo mismo, y en una pantalla táctil una pulsación larga.',
  // map-satellite
  'help.guide.map-satellite.title': 'Cambiar a satélite',
  'help.guide.map-satellite.goal': 'Cambia el mapa dibujado por imágenes aéreas, y vuelve.',
  'help.guide.map-satellite.step.1':
    'El botón redondo de abajo a la izquierda del mapa es el conmutador de capa base. Su icono muestra siempre la capa a la que pasaría, y al poner el puntero encima dice cuál: Cambiar a vista de satélite. Haz clic en él.',
  'help.guide.map-satellite.step.2':
    'El mapa es ahora imagen aérea, con detalle suficiente para distinguir un solo edificio y sin ninguna clave tuya. Todo lo que dibuja TREK se queda encima: los pines, la ruta del día, las rutas importadas y las rutas de reservas.',
  'help.guide.map-satellite.step.3':
    'El botón dice ahora Cambiar a vista de mapa. Haz clic en él para volver al mapa dibujado.',
  'help.guide.map-satellite.result':
    'El mapa vuelve a estar dibujado, y la capa en la que lo dejaste queda recordada en tu cuenta.',
  'help.guide.map-satellite.tip.1':
    'La elección se guarda en tu cuenta y no en el viaje, así que cada viaje se abre como lo dejaste, sea cual sea el motor de mapas que uses.',
  'help.guide.map-satellite.tip.2':
    'Las imágenes no llevan texto: los nombres de calle, los barrios y los números están en el mapa dibujado, así que vuelve a él cuando busques una dirección.',
  // map-whole-trip
  'help.guide.map-whole-trip.title': 'Ver todo el viaje y sus distancias',
  'help.guide.map-whole-trip.goal':
    'Cambia el único día abierto por todos los días de trayecto del viaje, y lee cuánto recorre cada uno.',
  'help.guide.map-whole-trip.step.1':
    'El botón redondo Mostrar todo el viaje está abajo a la derecha del mapa. Haz clic en él y todos los días de trayecto del viaje se dibujan a la vez, cada uno en su propio color sobre un borde blanco, para que los días vecinos no se confundan.',
  'help.guide.map-whole-trip.step.2':
    'La ficha sobre el botón lista esos días: un punto de color, el nombre del día, un icono por cada forma en que lo recorres, y la distancia que cubre. Distancia total está arriba del todo.',
  'help.guide.map-whole-trip.step.3':
    'Haz clic en un día de la ficha para seleccionarlo, igual que si lo eligieras en la columna de días: el mapa encuadra ese día, y sus paradas recuperan sus números.',
  'help.guide.map-whole-trip.step.4':
    'El botón dice ahora Ocultar todo el viaje. Púlsalo para volver al único día abierto.',
  'help.guide.map-whole-trip.result':
    'Todos los días de trayecto están dibujados en su propio color, y la ficha dice lo que cubre cada uno y a cuánto llega el viaje.',
  'help.guide.map-whole-trip.tip.1':
    'El total llega por tramos, unos pocos cada vez. Mientras le sigue un …, el número es aún una suma parcial; se asienta en cuanto cada tramo ha respondido.',
  'help.guide.map-whole-trip.tip.2':
    'Un tramo que el router rechaza queda como una línea recta y no cuenta nada, y la ficha lo dice en lugar de mostrar en silencio una cifra demasiado baja.',
  'help.guide.map-whole-trip.tip.3':
    'Un día con menos de dos paradas localizadas no tiene ruta que dibujar, así que se deja fuera de la ficha por completo.',
  // map-booking-routes
  'help.guide.map-booking-routes.title': 'Mostrar la ruta de una reserva en el mapa',
  'help.guide.map-booking-routes.goal':
    'Dibuja en el mapa los vuelos, trenes y trayectos en coche que has reservado, y quítalos de nuevo.',
  'help.guide.map-booking-routes.step.1':
    'Las rutas de reservas están apagadas hasta que pidas una. En la fila de una reserva, en la columna de días, hay un pequeño icono de ruta: Mostrar rutas de reservas.',
  'help.guide.map-booking-routes.step.2':
    'Haz clic en él y la reserva aparece en el mapa: un vuelo como un arco de círculo máximo, un trayecto en coche por las carreteras reales, un tren como la cadena de sus estaciones. Confirmada se dibuja continua, Pendiente discontinua, y los extremos de la ruta son píldoras azules con el icono del transporte.',
  'help.guide.map-booking-routes.step.3':
    'Haz clic en una píldora de extremo y se abre la reserva que hay detrás, con sus horas, su referencia y desde dónde sale. Cerrar la guarda otra vez.',
  'help.guide.map-booking-routes.step.4':
    'El icono de ruta de la barra de herramientas sobre los días hace todo el viaje de una vez: Mostrar todas las rutas de reservas dibuja todas las reservas que tienen una.',
  'help.guide.map-booking-routes.step.5':
    'Es un borrón y cuenta nueva y no una capa encima, así que lo que hayas elegido reserva a reserva se descarta. Púlsalo otra vez, que ahora dice Ocultar todas las rutas de reservas, y el mapa queda limpio.',
  'help.guide.map-booking-routes.result':
    'Las reservas que has pedido están dibujadas en el mapa, y la elección se guarda para este viaje en este navegador hasta que la cambies.',
  'help.guide.map-booking-routes.tip.1':
    'Los extremos llevan el código del aeropuerto o el nombre de la estación solo cuando Etiquetas de rutas de reservas está activado en Ajustes, bajo Travel & map; si no, muestran solo el icono.',
  'help.guide.map-booking-routes.tip.2':
    'Mostrar siempre las rutas de reserva, en los mismos ajustes, las dibuja desde el principio en todos los viajes sobre los que aún no has decidido.',
  'help.guide.map-booking-routes.tip.3':
    'Una reserva necesita dos extremos con coordenadas antes de poder dibujarse, así que un hotel o un restaurante no lleva icono de ruta.',
  'help.ctx.trip-map.bullet.8':
    'Con el addon de Dawarich activado, el botón redondo de Dawarich bajo Mostrar todo el viaje dibuja la ruta que tu teléfono grabó de verdad: Mostrar ruta grabada la pone discontinua bajo la ruta planificada, un color por día, y la etiqueta del botón dice por qué no hay línea cuando no la hay.',
  // map-dawarich-trail
  'help.guide.map-dawarich-trail.title': 'Mostrar la ruta que recorriste de verdad',
  'help.guide.map-dawarich-trail.goal':
    'Pon sobre el mapa la ruta que Dawarich grabó en tu teléfono, discontinua junto a la que planificaste, y lee el viaje día a día tal como fue en realidad.',
  'help.guide.map-dawarich-trail.step.1':
    'El botón redondo de Dawarich está abajo a la derecha del mapa, bajo Mostrar todo el viaje; al pasar por encima dice Mostrar ruta grabada. Haz clic en él. TREK le pide a tu Dawarich las fechas del viaje, y un anillo gira alrededor del botón mientras la respuesta está en camino.',
  'help.guide.map-dawarich-trail.step.2':
    'La ruta grabada llega como una línea discontinua, un color por día, dibujada bajo la ruta planificada para que el plan siga legible. El botón ahora dice Ocultar ruta grabada. Los días se cortan a medianoche local, y un día plegado en la columna de días quita del mapa su línea discontinua junto con sus paradas.',
  'help.guide.map-dawarich-trail.step.3':
    'Haz clic también en Mostrar todo el viaje y cada día planificado se dibuja en línea continua junto a la grabación discontinua. Donde las dos van juntas, el día fue según lo planeado; donde la línea discontinua se desvía es donde no.',
  'help.guide.map-dawarich-trail.result':
    'Lo que planificaste y lo que hiciste de verdad están juntos en el mapa, discontinuo frente a continuo, y la tarjeta sobre los botones sigue listando los días planificados y sus distancias.',
  'help.guide.map-dawarich-trail.tip.1':
    'Activado o no se recuerda por viaje para esta sesión del navegador. Mientras la ruta está activada, TREK vuelve a preguntar a Dawarich cada dos minutos, así que un viaje en marcha se pone al día sin recargar; la ruta en sí nunca se guarda, así que no está en la base de datos de TREK, ni en las copias de seguridad, ni disponible sin conexión.',
  'help.guide.map-dawarich-trail.tip.2':
    'La etiqueta del botón explica un mapa vacío: Cargando la ruta grabada… mientras está en camino, No se grabó nada en estas fechas, No se pudo cargar la ruta grabada, o La ruta grabada necesita conexión cuando TREK está sin conexión.',
  // map-compass
  'help.guide.map-compass.title': 'Girar el mapa y volver a encontrar el norte',
  'help.guide.map-compass.goal': 'Gira el mapa para que mire hacia donde vas, y devuélvelo al norte con un solo clic.',
  'help.guide.map-compass.step.1':
    'Gira el mapa arrastrando con el botón derecho, o mantén Ctrl y arrastra con el izquierdo; en una pantalla táctil, gira con dos dedos. La brújula redonda junto a la fila de iconos de categoría en la parte alta del mapa gira con él: su flecha siempre apunta al norte, así que se inclina tanto como hayas girado.',
  'help.guide.map-compass.step.2':
    'Haz clic en la brújula. Reset north, que así se llama el botón, lleva el mapa suavemente de vuelta al norte arriba y a una vista plana, y la flecha vuelve a estar recta.',
  'help.guide.map-compass.result':
    'El mapa vuelve a estar orientado al norte y plano, y nada del viaje ha cambiado: la brújula solo mueve la cámara.',
  'help.guide.map-compass.tip.1':
    'La brújula solo existe en los mapas MapLibre GL y Mapbox GL; el mapa Leaflet no se puede girar, así que no tiene. Proveedor de mapa en Ajustes, bajo Mapa, decide cuál usas, y Guardar mapa conserva la elección.',
  'help.guide.map-compass.tip.2':
    'El clic también quita la inclinación: arrastrar arriba o abajo con el botón derecho inclina la vista, y Reset north la nivela junto con el giro. En Mapbox GL con Edificios 3D y terreno activado, eso aplana también la vista 3D, hasta que la vuelvas a inclinar.',

  // ── Screen: trip-collab ───────────────────────────────────────────────────────────────
  'help.ctx.trip-collab.title': 'Colaboración',
  'help.ctx.trip-collab.summary':
    'La pestaña en la que el grupo planifica en común: Mensajes a la izquierda, las notas compartidas y los enlaces al lado, las encuestas debajo y Qué viene ahora al final. Todo lo que se escribe aquí está al momento en la pantalla de todos los demás miembros, sin recargar.',
  'help.ctx.trip-collab.bullet.1':
    'Mensajes es la columna de la izquierda. Escribe en Escribe un mensaje... y pulsa Enter; Shift y Enter hacen un salto de línea. El smiley añade un emoji, Adjuntar imágenes cuelga hasta cuatro fotos del mensaje.',
  'help.ctx.trip-collab.bullet.2':
    'Pasa el ratón por un mensaje para Responder y, en los tuyos, Eliminar; con clic derecho salen las ocho reacciones rápidas. Un mensaje eliminado deja una línea que dice que lo has eliminado.',
  'help.ctx.trip-collab.bullet.3':
    'Notas es el bloc compartido: Nueva nota escribe una, y el engranaje de al lado abre Gestionar categorías para sus nombres y colores. Una tarjeta lleva Expandir, Fijar, Editar y Eliminar.',
  'help.ctx.trip-collab.bullet.4':
    'Enlaces reúne las direcciones con las que funciona el viaje. Añadir enlace toma un título y una dirección http o https; Editar enlace, Fijar enlace y Eliminar enlace están al final de la ficha, y los enlaces fijados se quedan delante.',
  'help.ctx.trip-collab.bullet.5':
    'Encuestas decide las cosas. Nueva encuesta plantea una pregunta con al menos dos opciones; un clic en una opción es tu voto, Cerrar termina la votación y Eliminar quita la encuesta.',
  'help.ctx.trip-collab.bullet.6':
    'Qué viene ahora lista las paradas del viaje que aún están por delante, hasta ocho de ellas, con sus horas y las personas que van en ellas. Solo lee el plan del día; las horas se fijan allí.',
  // write-note
  'help.guide.write-note.title': 'Escribir una nota compartida',
  'help.guide.write-note.goal':
    'Pon lo que todo el grupo necesita, una regla, una dirección, un recordatorio, donde todos lo vuelvan a encontrar.',
  'help.guide.write-note.step.1':
    'Haz clic en Nueva nota en la parte de arriba del panel Notas. Se abre el formulario.',
  'help.guide.write-note.step.2':
    'Título de la nota es el nombre que lleva la tarjeta. Es lo único en lo que el formulario insiste: Crear sigue gris mientras esté vacío.',
  'help.guide.write-note.step.3':
    'La caja grande de debajo guarda el texto y acepta Markdown: una palabra en negrita, una lista, un título. La tarjeta muestra las primeras líneas, y Expandir en ella abre la nota entera.',
  'help.guide.write-note.step.4':
    'Bajo Categoría, elige la que corresponde a la nota; su color pasa a ser el color de la tarjeta. Las píldoras son las categorías que ya existen, y una nueva se crea en Gestionar categorías.',
  'help.guide.write-note.step.5':
    'Sitio web recoge un enlace que pertenece a la nota. La tarjeta lleva entonces un recuadro Link que lo abre.',
  'help.guide.write-note.step.6': 'Haz clic en Crear.',
  'help.guide.write-note.result':
    'La nota es una tarjeta en el panel Notas, en el color de su categoría, y ya está en la pantalla de todos los demás miembros.',
  'help.guide.write-note.tip.1':
    'Fijar en una tarjeta la mantiene arriba del panel; todo lo de debajo se ordena por cuándo se cambió por última vez.',
  'help.guide.write-note.tip.2':
    'El engranaje junto a Nueva nota abre Gestionar categorías: allí una categoría recibe su color, se renombra en todas partes a la vez, o se añade antes de que ninguna nota la use.',
  'help.guide.write-note.tip.3':
    'Adjuntar archivos cuelga un documento de la nota. Adjuntar abre el selector de archivos, y una imagen o un PDF también se pueden pegar sin más en el formulario.',
  'help.guide.write-note.tip.4':
    'Notas es un interruptor propio en Complementos, bajo Colaboración: un administrador puede apagarlas y dejar funcionando el Chat, los Enlaces, las Encuestas y Qué sigue.',
  // shared-links
  'help.guide.shared-links.title': 'Reunir los enlaces del viaje',
  'help.guide.shared-links.goal':
    'Ten el portal de reservas, el álbum compartido y el horario en un solo sitio en vez de rebuscarlos en Mensajes.',
  'help.guide.shared-links.step.1': 'Haz clic en Añadir enlace en la parte de arriba del panel Enlaces.',
  'help.guide.shared-links.step.2':
    'Dale un nombre al enlace en Título del enlace, pega la dirección en el campo de debajo y haz clic en Guardar enlace.',
  'help.guide.shared-links.step.3':
    'La ficha muestra el nombre y el sitio al que apunta. Un clic en ella abre la página en una pestaña nueva.',
  'help.guide.shared-links.step.4':
    'Los tres botones pequeños de su final son Editar enlace, Fijar enlace y Eliminar enlace. Fijar enlace mueve la ficha al principio del panel; Eliminar enlace no pregunta nada.',
  'help.guide.shared-links.result':
    'El enlace es una ficha en el panel Enlaces, fijada al principio, y en la pantalla de todos los miembros a la vez.',
  'help.guide.shared-links.tip.1':
    'Solo se aceptan direcciones http y https; el campo rechaza cualquier otra cosa antes de guardar.',
  'help.guide.shared-links.tip.2':
    'Los enlaces fijados van primero, luego los más nuevos. El iconito junto a un título es el favicon del propio sitio, traído del sitio mismo, así que sin internet la ficha muestra un símbolo de enlace simple en su lugar.',
  'help.guide.shared-links.tip.3':
    'Enlaces es un interruptor propio en Complementos, bajo Colaboración, así que un administrador puede apagar el panel sin tocar el resto de la pestaña.',
  // create-poll
  'help.guide.create-poll.title': 'Preguntar al grupo',
  'help.guide.create-poll.goal':
    'Convierte una pregunta que nadie contesta en Mensajes en una encuesta que todos pueden marcar.',
  'help.guide.create-poll.step.1': 'Haz clic en Nueva encuesta en la parte de arriba del panel Encuestas.',
  'help.guide.create-poll.step.2':
    'Escribe la pregunta. Compatible con Markdown debajo de la caja significa que aquí funcionan una palabra en negrita, un salto de línea o una lista corta.',
  'help.guide.create-poll.step.3': 'Rellena Opción 1 y Opción 2. Dos opciones con algo dentro son el mínimo.',
  'help.guide.create-poll.step.4':
    '+ Añadir opción añade una tercera, una cuarta, tantas como necesites; la crucecita junto a una fila quita una otra vez.',
  'help.guide.create-poll.step.5':
    'Selección múltiple deja que todos marquen más de una opción. Sin activarla, un voto se traslada cuando alguien elige otra cosa.',
  'help.guide.create-poll.step.6': 'Haz clic en Crear encuesta.',
  'help.guide.create-poll.result':
    'La encuesta está arriba del panel Encuestas, abierta, y todavía no ha votado nadie.',
  'help.guide.create-poll.tip.1': 'La pregunta se muestra como Markdown; las opciones siguen siendo texto plano.',
  'help.guide.create-poll.tip.2':
    'Crear encuesta sigue gris hasta que hay una pregunta y al menos dos opciones con algo dentro.',
  'help.guide.create-poll.tip.3':
    'Una fecha límite solo se puede poner en la app del móvil. Una encuesta que la tiene muestra aquí el tiempo que queda en una ficha ámbar y cuenta como cerrada en cuanto se acaba.',
  'help.guide.create-poll.tip.4':
    'Encuestas es un interruptor propio en Complementos, bajo Colaboración: un administrador puede apagarlas y dejar funcionando los otros cuatro paneles.',
  // vote-poll
  'help.guide.vote-poll.title': 'Votar y leer el resultado',
  'help.guide.vote-poll.goal': 'Da tu voto, mira cómo está el grupo y cambia de idea.',
  'help.guide.vote-poll.step.1': 'Haz clic en la opción que quieras. Su círculo se llena y la barra de detrás crece.',
  'help.guide.vote-poll.step.2':
    'Ahora se lee el resultado entero: la barra es la proporción, el porcentaje está a la derecha, y los círculos pequeños son las personas que eligieron esa opción.',
  'help.guide.vote-poll.step.3':
    '¿Has cambiado de idea? Haz clic en otra opción. En una encuesta sin Selección múltiple tu voto se traslada en vez de añadir un segundo.',
  'help.guide.vote-poll.step.4':
    'Bajo la pregunta está cuántos votos tiene la encuesta. Un clic en la opción que ya elegiste vuelve a sacar tu voto, y el contador baja.',
  'help.guide.vote-poll.result':
    'Tu marca está en una opción, las barras muestran cómo se reparte el grupo, y los círculos dicen quién eligió qué.',
  'help.guide.vote-poll.tip.1':
    'Las barras y los porcentajes solo aparecen cuando has votado tú, o cuando la encuesta está cerrada, para que a nadie le influyan los resultados provisionales.',
  'help.guide.vote-poll.tip.2':
    'Un voto nunca es anónimo: pasa el ratón por uno de los círculos de una opción para ver el nombre que hay detrás.',
  // close-poll
  'help.guide.close-poll.title': 'Cerrar una encuesta o quitarla',
  'help.guide.close-poll.goal':
    'Para la votación cuando el grupo ya ha decidido, y quita de en medio una encuesta que ya no necesita nadie.',
  'help.guide.close-poll.step.1':
    'Cerrar, el candado en la esquina de una encuesta, termina la votación. Las opciones dejan de aceptar clics.',
  'help.guide.close-poll.step.2':
    'Una encuesta cerrada baja bajo el encabezado Cerradas al final del panel, lleva una insignia Cerrada y enseña el resultado a todos, hayan votado o no. La opción ganadora se tiñe de verde.',
  'help.guide.close-poll.step.3':
    'Eliminar, la papelera en el mismo rincón, quita la encuesta. Nada pregunta dos veces, y los votos se van con ella.',
  'help.guide.close-poll.result':
    'La encuesta ha desaparecido del panel de todos los miembros. Una que solo has cerrado sigue legible abajo, con su resultado.',
  'help.guide.close-poll.tip.1':
    'Cerrar no se puede deshacer: no hay reapertura. Una encuesta cerrada sin querer hay que volver a plantearla.',
  'help.guide.close-poll.tip.2':
    'Eliminar quita la encuesta y todos sus votos a todo el mundo, al momento y sin preguntar.',
  // whats-next
  'help.guide.whats-next.title': 'Leer Qué viene ahora',
  'help.guide.whats-next.goal': 'Mira qué hace el grupo a continuación sin abrir el plan.',
  'help.guide.whats-next.step.1':
    'El panel lista las paradas del viaje que aún están por delante, hasta ocho de ellas, en orden de hora, bajo un encabezado por día: Hoy, Mañana o la fecha.',
  'help.guide.whats-next.step.2':
    'A la izquierda de una fila está su hora: el comienzo, hasta, y el final cuando la parada lo tiene, o TBD cuando todavía no se le ha puesto hora.',
  'help.guide.whats-next.step.3':
    'Las fichas bajo el nombre son las personas que van en esa parada. Si no se ha elegido a nadie, se lista a todo el viaje.',
  'help.guide.whats-next.result': 'Una lista de lo que viene, solo para leer: sigue el plan, y nada de aquí lo cambia.',
  'help.guide.whats-next.tip.1':
    'Aquí no se fija nada. Las horas vienen del plan del día; cámbialas allí y esta lista lo sigue al momento.',
  'help.guide.whats-next.tip.2':
    'Solo se lista lo que todavía está por delante: una parada cuya hora ya pasó se cae, y al final de un viaje el panel está vacío.',
  'help.guide.whats-next.tip.3':
    'Qué sigue es un interruptor propio en Complementos, bajo Colaboración, y es un panel de escritorio: la pestaña Colaboración de la app del móvil no lo ofrece.',
  // trip-chat
  'help.guide.trip-chat.title': 'Hablar con el grupo',
  'help.guide.trip-chat.goal': 'Di algo, responde a un mensaje concreto, reacciona a otro y retira el tuyo.',
  'help.guide.trip-chat.step.1':
    'Escribe en Escribe un mensaje... y pulsa Enter. La flecha azul junto a la caja hace lo mismo; Shift y Enter hacen un salto de línea en su lugar.',
  'help.guide.trip-chat.step.2':
    'El smiley abre el selector de emojis, con Smileys, Reactions y Travel dentro. Lo que eliges se añade a lo que estás escribiendo, no se envía por sí solo.',
  'help.guide.trip-chat.step.3':
    'Pasa el ratón por el mensaje de otra persona: en su esquina aparece un botón redondo pequeño. Ese es Responder.',
  'help.guide.trip-chat.step.4':
    'El mensaje al que respondes queda citado sobre la caja. Escribe y envía, y la cita viaja en tu burbuja; la cruz de la cita la descarta.',
  'help.guide.trip-chat.step.5':
    'Haz clic derecho en un mensaje para las ocho reacciones rápidas. La tuya queda bajo la burbuja, y un segundo clic en la misma la retira.',
  'help.guide.trip-chat.step.6':
    'Tus propios mensajes llevan Eliminar junto a Responder. Quita el mensaje y deja una línea que dice que lo has eliminado: no hay vuelta atrás.',
  'help.guide.trip-chat.result':
    'Tu respuesta está bajo el mensaje que cita, una reacción cuelga de un tercero, y el que retiraste deja una sola línea que lo dice.',
  'help.guide.trip-chat.tip.1':
    'Enter envía, Shift y Enter hacen un salto de línea. Un mensaje que es solo emoji se muestra grande.',
  'help.guide.trip-chat.tip.2':
    'Adjuntar imágenes toma hasta cuatro fotos para un mensaje; también se pueden pegar o soltar sin más sobre la caja.',
  'help.guide.trip-chat.tip.3':
    'Un mensaje con un enlace dentro recibe debajo una tarjeta de vista previa, traída por tu propio TREK, así que un enlace a algo a lo que solo llegas tú sigue siendo un enlace simple.',
  'help.guide.trip-chat.tip.4':
    'Chat es un interruptor propio en Complementos, bajo Colaboración: un administrador puede apagarlo y dejar funcionando las Notas, los Enlaces, las Encuestas y Qué sigue.',

  // ── Screen: trip-lists ────────────────────────────────────────────────────────────────
  'help.ctx.trip-lists.title': 'Listas',
  'help.ctx.trip-lists.summary':
    'Dos listas para un viaje: la lista de equipaje, con quién lleva qué y cuánto pesa, y la lista de todo lo que tiene que pasar antes y durante. La pestaña está ahí mientras el addon Listas esté activo.',
  'help.ctx.trip-lists.bullet.1':
    'Lista de equipaje y Por hacer, arriba, cambian entre las dos y cuentan lo que hay en cada una; los botones de la derecha pertenecen a la que esté abierta.',
  'help.ctx.trip-lists.bullet.2':
    'La lista de equipaje está agrupada en listas, Documentos, Ropa, como las quieras llamar, cada una con un punto de color, un contador de preparados sobre el total y tres puntos con Renombrar, Marcar todo, Desmarcar todo y Eliminar lista. Añadir lista, en la barra de arriba, crea una nueva.',
  'help.ctx.trip-lists.bullet.3':
    'Una fila es una casilla y un nombre, luego, como pequeñas insignias, quién lleva el artículo, la cantidad y el peso en gramos, y un círculo de equipaje mientras Seguimiento de equipaje esté activo, y después la papelera y tres puntos con Mover a lista, Compartir, Renombrar y Eliminar. Lo que una fila no usa queda atenuado hasta que pasas el ratón por encima, y el asa de la izquierda la sube o la baja dentro de su lista.',
  'help.ctx.trip-lists.bullet.4':
    'Compartido y Mi lista parten la lista de equipaje en dos: el fondo común que ve todo el mundo, y la tuya. Todo, Pendientes y Hecho estrechan la que esté abierta, y la barra de arriba cuenta lo que está preparado.',
  'help.ctx.trip-lists.bullet.5':
    'Aplicar plantilla y Guardar como plantilla llenan o conservan una lista sin teclearla, y los dos iconos de al lado exportan la lista, como impresión, PDF o archivo, e importan una. El botón rojo junto a la barra de progreso dice cuántos artículos están marcados y los quita.',
  'help.ctx.trip-lists.bullet.6':
    'Por hacer tiene su propia barra lateral: la tarjeta de progreso, los filtros Todo, Mis tareas, Vencida y Hecho, una fila por lista y Añadir lista debajo. Las tareas están en una tarjeta cuya cabecera nombra el filtro y contiene el orden, Prioridad o Fecha límite. Un clic en una tarea la abre en el panel de la derecha, y Nueva tarea abre el formulario Nueva tarea sobre el centro de la pantalla.',
  // packing-categories
  'help.guide.packing-categories.title': 'Construir la lista de equipaje',
  'help.guide.packing-categories.goal':
    'Agrupa en listas lo que te llevas, llénalas de artículos y di quién se ocupa de cada lista.',
  'help.guide.packing-categories.step.1':
    'Haz clic en Añadir lista en la barra que hay sobre las listas, escribe el nombre en Nombre de la lista (p. ej. Ropa) y haz clic en Añadir.',
  'help.guide.packing-categories.step.2':
    'La lista nueva empieza con una fila vacía. Haz clic en Añadir artículo, escribe el artículo en Nombre del artículo... y pulsa Intro; el campo sigue abierto para el siguiente.',
  'help.guide.packing-categories.step.3':
    'Renombra una fila haciendo clic en su nombre, o con Renombrar en los tres puntos de su extremo derecho.',
  'help.guide.packing-categories.step.4':
    'El círculo discontinuo de la cabecera de la lista asigna miembros del viaje a la lista. Elige un nombre; la etiqueta que aparece quita de nuevo a esa persona con un clic.',
  'help.guide.packing-categories.step.5':
    'Los tres puntos al final de la cabecera guardan el resto: Renombrar, Marcar todo, Desmarcar todo y Eliminar lista, que se lleva la lista y todo lo que hay en ella sin volver a preguntar.',
  'help.guide.packing-categories.result':
    'La lista nueva se sitúa en la cuadrícula con sus artículos debajo y su punto de color, y su contador dice lo que ya está preparado.',
  'help.guide.packing-categories.tip.1':
    'Una lista no es más que sus artículos. Elimina el último y la fila se convierte en un marcador de posición para que la lista conserve su sitio y su color; elimina también esa fila y la lista desaparece.',
  'help.guide.packing-categories.tip.2':
    'Asignar a alguien a una lista le envía una notificación de equipaje. No cambia quién puede ver los artículos, eso es Compartir, en los tres puntos de una fila.',
  'help.guide.packing-categories.tip.3':
    'Dos listas pueden llevar el mismo nombre. TREK las distingue internamente, así que los nombres quedan tal como los escribiste.',
  // check-off-packing
  'help.guide.check-off-packing.title': 'Ir marcando mientras preparas',
  'help.guide.check-off-packing.goal':
    'Marca lo que ya está en la maleta, mira la barra y quita los artículos preparados.',
  'help.guide.check-off-packing.step.1':
    'Haz clic en la casilla de la izquierda de una fila. El nombre se tacha y la barra se mueve.',
  'help.guide.check-off-packing.step.2':
    'La barra de arriba cuenta lo preparado frente a todo lo que hay en la lista, como número y como porcentaje.',
  'help.guide.check-off-packing.step.3':
    'Una lista entera de una vez: los tres puntos de su cabecera guardan Marcar todo y Desmarcar todo.',
  'help.guide.check-off-packing.step.4':
    'Todo, Pendientes y Hecho estrechan la cuadrícula. Pendientes deja solo lo que aún falta, así que una lista del todo preparada se cae de ahí.',
  'help.guide.check-off-packing.step.5':
    'Eliminar 3 marcados, junto a la barra de progreso, borra de golpe todos los artículos marcados, tras una confirmación del navegador.',
  'help.guide.check-off-packing.result':
    'Solo aparece lo que sigue pendiente, y la barra de arriba dice por dónde va el equipaje.',
  'help.guide.check-off-packing.tip.1': 'Un artículo marcado se puede seguir renombrando: haz clic en su nombre.',
  'help.guide.check-off-packing.tip.2':
    'Marcar todo y Desmarcar todo actúan sobre una lista cada vez, desde los tres puntos de esa lista.',
  'help.guide.check-off-packing.tip.3':
    'Cuando todos los artículos están marcados, ¡Todo preparado! sustituye al contador y la barra se pone verde.',
  // apply-packing-template
  'help.guide.apply-packing-template.title': 'Aplicar una plantilla de equipaje',
  'help.guide.apply-packing-template.goal':
    'Trae una lista ya hecha al viaje, y guarda la lista de este viaje para el siguiente.',
  'help.guide.apply-packing-template.step.1': 'Haz clic en Aplicar plantilla en la barra de encima de la lista.',
  'help.guide.apply-packing-template.step.2':
    'Elige una plantilla. Cada línea la nombra y dice cuántos artículos tiene.',
  'help.guide.apply-packing-template.step.3':
    'Los artículos caen en la vista en la que estás: Compartido los pone en el fondo común que ve todo el mundo, Mi lista los hace tuyos.',
  'help.guide.apply-packing-template.step.4':
    'Guardar la lista de este viaje para el próximo: Guardar como plantilla abre un diálogo, escribe un nombre y haz clic en Guardar.',
  'help.guide.apply-packing-template.result':
    'Las listas y los artículos de la plantilla están en el viaje, junto a lo que ya había.',
  'help.guide.apply-packing-template.tip.1':
    'Una plantilla solo lleva nombres y listas. Las cantidades, los pesos, el equipaje y lo que ya está marcado se quedan atrás.',
  'help.guide.apply-packing-template.tip.2':
    'Aplicar plantilla solo está ahí una vez que existe una plantilla. Sin ninguna, el botón no aparece.',
  'help.guide.apply-packing-template.tip.3':
    'Guardar como plantilla aparece solo para un administrador de la instancia, y solo mientras la lista tiene artículos. Guarda el fondo común más tus propios artículos, nunca los privados de otro miembro.',
  // import-packing-list
  'help.guide.import-packing-list.title': 'Pegar una lista de equipaje entera',
  'help.guide.import-packing-list.goal':
    'Convierte de una vez una lista que ya tienes en otro sitio en artículos de equipaje.',
  'help.guide.import-packing-list.step.1':
    'Haz clic en el botón de importar con la flecha hacia abajo en la barra de encima de la lista.',
  'help.guide.import-packing-list.step.2':
    'Un artículo por línea: Categoría, Nombre, Peso en g (opcional), Equipaje (opcional), checked/unchecked (opcional). El ejemplo gris del recuadro muestra las cuatro formas. También sirve una lista en Markdown: un encabezado da nombre a la lista, y "- [ ]" y "- [x]" se convierten en artículos.',
  'help.guide.import-packing-list.step.3':
    'O carga las líneas desde un archivo con Cargar CSV/TXT/MD. Acepta un .csv, un .txt o un .md y sustituye lo que haya en el recuadro.',
  'help.guide.import-packing-list.step.4': 'Haz clic en Importar. El botón cuenta las líneas que ha entendido.',
  'help.guide.import-packing-list.result':
    'Cada línea es una fila, en la lista que nombra su primer campo, y nada de lo que ya había se toca.',
  'help.guide.import-packing-list.tip.1':
    'Las comas, los puntos y comas y los tabuladores separan campos, y las comillas mantienen un campo unido, de modo que «Camisa, azul» sigue siendo un solo nombre. Una línea con un único valor es solo un nombre, una línea sin lista propia cae en Otros, y "3x" delante de un nombre fija la cantidad.',
  'help.guide.import-packing-list.tip.2':
    'Un equipaje nombrado en el cuarto campo se crea si el viaje aún no lo tiene. Este es el único sitio que carga pesos y equipaje en bloque; una plantilla trae solo nombres y listas.',
  // export-packing-list
  'help.guide.export-packing-list.title': 'Imprimir o exportar la lista de equipaje',
  'help.guide.export-packing-list.goal':
    'Llévate la lista en papel, en PDF o como archivo para otra aplicación o para el próximo viaje.',
  'help.guide.export-packing-list.step.1':
    'Haz clic en el botón de exportar con la flecha hacia arriba en la barra de encima de la lista.',
  'help.guide.export-packing-list.step.2':
    'Lista de verificación en Markdown (.md) y CSV para importar (.csv) guardan la lista como archivo al instante.',
  'help.guide.export-packing-list.step.3':
    'Haz clic en Imprimir o guardar como PDF. La vista previa muestra la lista como una página: el viaje y sus fechas arriba, y luego cada lista como una tarjeta con una casilla para marcar.',
  'help.guide.export-packing-list.step.4':
    'Haz clic en Imprimir o guardar como PDF debajo de la vista previa. El navegador abre su diálogo de impresión: elige una impresora, o Guardar como PDF para quedarte con un archivo.',
  'help.guide.export-packing-list.result':
    'La impresión y los archivos recogen la vista que está abierta, Compartido o Mi lista, con las cantidades, los pesos y las marcas.',
  'help.guide.export-packing-list.tip.1':
    'El CSV es el formato que lee Importar, equipaje incluido, así que sirve como plantilla de equipaje propia: impórtalo en el próximo viaje.',
  'help.guide.export-packing-list.tip.2':
    'El archivo Markdown se abre como lista de verificación en Obsidian, Notion o GitHub, y vuelve a entrar igual por Importar.',
  // share-packing-item
  'help.guide.share-packing-item.title': 'Decidir quién ve un artículo y quién lo lleva',
  'help.guide.share-packing-item.goal':
    'Mueve un artículo entre el fondo común del grupo, tu propia lista y las personas para las que lo llevas.',
  'help.guide.share-packing-item.step.1':
    'Compartido, encima de las listas, es el fondo común que ve todo el mundo, Mi lista es la tuya, y cada una cuenta lo que contiene. Haz clic en Mi lista para ver la tuya.',
  'help.guide.share-packing-item.step.2':
    'De vuelta en Compartido, abre los tres puntos al final de una fila y haz clic en Compartir.',
  'help.guide.share-packing-item.step.3':
    'Tres niveles: Compartido, en el fondo común del grupo y visible para todos; Personal, que solo ves tú; y Compartir con…, donde eliges a las personas que cubre el artículo.',
  'help.guide.share-packing-item.step.4':
    'Un artículo Personal solo está en Mi lista. Cambia de vista para encontrarlo.',
  'help.guide.share-packing-item.step.5':
    'Abre Compartir otra vez y marca un nombre bajo Compartir con…. El artículo aparece también en la lista de esa persona, y la fila recibe una pequeña insignia que cuenta las personas con las que se comparte.',
  'help.guide.share-packing-item.result': 'El artículo queda en el nivel que elegiste, y la fila dice quién lo lleva.',
  'help.guide.share-packing-item.tip.1':
    'Solo quien lleva un artículo cambia su forma de compartirlo. Aquel con quien lo compartiste lo ve en su propia Mi lista, marcado con tu nombre, y puede marcarlo.',
  'help.guide.share-packing-item.tip.2':
    'En un artículo que lleva otra persona obtienes dos botones distintos: Yo también puedo llevarlo, que te añade a su lado, y Copiar a mi lista, que hace una copia privada tuya.',
  'help.guide.share-packing-item.tip.3':
    'Los artículos nuevos heredan la vista en la que los añades. Añadidos en Mi lista son Personal, añadidos en Compartido van al fondo común.',
  // packing-bags
  'help.guide.packing-bags.title': 'Pesar el equipaje',
  'help.guide.packing-bags.goal':
    'Pon un peso a cada artículo, reparte los artículos en bultos y mantén cada uno por debajo del límite de la aerolínea.',
  'help.guide.packing-bags.step.1':
    'Haz clic en la insignia de peso anterior al círculo y escribe el peso del artículo en gramos.',
  'help.guide.packing-bags.step.2': 'El círculo del final de la fila es su bulto. Haz clic en él.',
  'help.guide.packing-bags.step.3':
    'Todavía sin bulto: Añadir equipaje, un nombre, Intro. El bulto se crea y el artículo entra directamente en él.',
  'help.guide.packing-bags.step.4':
    'El panel Equipaje aparece a la derecha en cuanto existe un bulto: nombre, peso, una barra de llenado, quién lo lleva y cuántos artículos tiene, y luego Sin asignar y Peso total.',
  'help.guide.packing-bags.step.5':
    'Haz clic en Definir límite y escribe el límite en kilogramos, tal como lo indican las aerolíneas.',
  'help.guide.packing-bags.step.6': 'El signo más discontinuo junto al nombre de un bulto dice quién lo lleva.',
  'help.guide.packing-bags.result':
    'El panel Equipaje de la derecha muestra el peso de cada bulto frente a su límite, lo que no está en ninguno, y el total.',
  'help.guide.packing-bags.tip.1':
    'El campo de peso, el círculo de equipaje y el panel Equipaje solo existen mientras un administrador tenga Seguimiento de equipaje activado bajo el addon Listas.',
  'help.guide.packing-bags.tip.2':
    'El peso de un bulto se suma en el servidor sobre los artículos de todos los miembros, incluidos los que tú no puedes ver, así que el número es de verdad lo que pesa el bulto.',
  'help.guide.packing-bags.tip.3':
    'Un bulto sin límite se dibuja frente al bulto más pesado, para que las barras sigan siendo comparables. Dale un límite y la barra se mide frente a él.',
  // create-todo
  'help.guide.create-todo.title': 'Añadir una tarea',
  'help.guide.create-todo.goal':
    'Apunta algo que tiene que pasar, con una lista, una prioridad, una fecha y un nombre al lado.',
  'help.guide.create-todo.step.1': 'Haz clic en Nueva tarea, arriba a la derecha.',
  'help.guide.create-todo.step.2':
    'Ponle nombre en Nombre de la tarea, y escribe lo que valga la pena recordar en Descripción.',
  'help.guide.create-todo.step.3':
    'Lista agrupa la tarea. Elige una, o usa el signo más de al lado para darle nombre a una nueva en un pequeño diálogo.',
  'help.guide.create-todo.step.4': 'Prioridad son cuatro botones: Ninguna, P1, P2 y P3, del rojo al azul.',
  'help.guide.create-todo.step.5': 'Fecha límite abre un calendario, y Asignado a pone un nombre en la tarea.',
  'help.guide.create-todo.step.6': 'Haz clic en Crear tarea.',
  'help.guide.create-todo.result':
    'La tarea está en la lista con sus distintivos, la prioridad, la fecha límite, la lista y la persona a la que está asignada, y se abre en el panel de la derecha.',
  'help.guide.create-todo.tip.1':
    'Solo el nombre es obligatorio. Todo lo demás se puede rellenar después desde el panel de la derecha.',
  'help.guide.create-todo.tip.2':
    'Con una lista seleccionada en la barra lateral, una tarea nueva empieza en esa lista.',
  'help.guide.create-todo.tip.3': 'Intro en el campo del nombre crea la tarea al momento, sin tocar los demás campos.',
  // todo-filters
  'help.guide.todo-filters.title': 'Encontrar y cambiar una tarea',
  'help.guide.todo-filters.goal':
    'Recorta la lista de tareas a lo que importa ahora, y luego edita la tarea en la que has caído.',
  'help.guide.todo-filters.step.1':
    'Tareas en la barra lateral: Todo es todo lo que sigue abierto, Mis tareas lo que recae en ti, Vencida lo que tiene una fecha pasada, Hecho lo que está terminado. Cada uno lleva su cuenta; haz clic en Vencida.',
  'help.guide.todo-filters.step.2':
    'Bajo Listas hay una fila por lista. Elegir una muestra esa lista, tareas terminadas incluidas.',
  'help.guide.todo-filters.step.3':
    'El orden en la cabecera de la lista reordena lo que hay en pantalla: Prioridad pone P1 primero, Fecha límite pone el plazo más cercano primero. Solo uno de los dos a la vez, y un segundo clic vuelve a tu propio orden.',
  'help.guide.todo-filters.step.4': 'Haz clic en una tarea para abrirla en el panel de la derecha.',
  'help.guide.todo-filters.step.5':
    'Cambia lo que necesites, Descripción, Prioridad, Lista, Fecha límite o Asignado a, y luego Guardar cambios. La casilla en la cabecera del panel marca la tarea como hecha, y Eliminar se la lleva al instante.',
  'help.guide.todo-filters.result':
    'La lista muestra solo las tareas que has pedido, y el panel de la derecha edita la que elegiste.',
  'help.guide.todo-filters.tip.1':
    'Una fila de lista cuenta solo lo que sigue abierto, pero seleccionarla muestra también las tareas terminadas. Todo, Mis tareas y Vencida ocultan lo hecho; Hecho no muestra nada más.',
  'help.guide.todo-filters.tip.2':
    'Prioridad y Fecha límite en el orden se excluyen, y mientras uno de los dos esté activo las filas ya no se pueden arrastrar a un orden propio.',

  // ── Screen: trip-bookings ─────────────────────────────────────────────────────────────
  'help.ctx.trip-bookings.title': 'Reservas',
  'help.ctx.trip-bookings.summary':
    'La pestaña que guarda todo lo reservado para el viaje que no es una forma de desplazarse: los alojamientos, las mesas, las entradas, las excursiones, los aparcamientos. Cada reserva es una tarjeta en Pendiente o en Confirmada, con su código, su documento, sus viajeros y su coste.',
  'help.ctx.trip-bookings.bullet.1':
    'Reserva manual, arriba a la derecha, abre el formulario. Las seis clases que crea son Alojamiento, Restaurante, Evento, Excursión, Aparcamiento y Otro; los vuelos, los trenes y lo demás viven en la pestaña Transportes y aquí no aparecen nunca.',
  'help.ctx.trip-bookings.bullet.2':
    'Importar desde archivo entrega una confirmación al análisis: EML, PDF, PKPass, HTML o TXT, cinco archivos de 10 MB como mucho. El botón solo está ahí si el servidor sabe leerlos.',
  'help.ctx.trip-bookings.bullet.3':
    'Los chips junto al título filtran por clase, cada uno con su propia cuenta, y Todo lo trae todo de vuelta. En cuanto una reserva nombra personas, la fila de avatares junto a los chips reduce la pestaña a una de ellas.',
  'help.ctx.trip-bookings.bullet.4':
    'Las tarjetas están en dos secciones, Pendiente y Confirmada, cada una con su cuenta. Un clic en el título de una sección la pliega, y si está abierta se recuerda para este viaje.',
  'help.ctx.trip-bookings.bullet.5':
    'Una tarjeta lleva el punto de estado, la clase, el título, las fechas y las horas, el Código de reserva, la Ubicación / dirección, aquello a lo que la reserva está vinculada, su Enlace, sus Notas, sus Archivos y sus Viajeros.',
  'help.ctx.trip-bookings.bullet.6':
    'El lápiz de una tarjeta vuelve a abrir el mismo formulario; la papelera pregunta una vez y la reserva desaparece. En un alojamiento, sus noches en el Plan por días y su gasto vinculado se van con ella.',
  // create-booking
  'help.guide.create-booking.title': 'Crear una reserva',
  'help.guide.create-booking.goal':
    'Pon a mano en el viaje un restaurante, un evento, una excursión, una plaza de aparcamiento o cualquier otra cosa.',
  'help.guide.create-booking.step.1':
    'Haz clic en Reserva manual, arriba a la derecha de la pestaña. Se abre Nueva reserva.',
  'help.guide.create-booking.step.2':
    'Elige el Tipo de reserva en la lista de arriba del formulario, junto a Viajeros. Alojamiento, Restaurante, Evento, Excursión, Aparcamiento y Otro son las seis que hace esta pestaña, y el formulario cambia con la elección: solo Alojamiento cambia sus fechas por un rango de días.',
  'help.guide.create-booking.step.3':
    'Escribe el Título. Es el único campo en el que el formulario insiste, y Añadir sigue muerto mientras esté vacío.',
  'help.guide.create-booking.step.4':
    'Pon Fecha y Hora de inicio, y Fecha fin y Hora de fin si la reserva tiene final. Los calendarios solo ofrecen días dentro del viaje, y un final que no es posterior al inicio lo dice en rojo y bloquea Añadir.',
  'help.guide.create-booking.step.5':
    'Mete el Código de reserva de la confirmación y pon el Estado. Pendiente o Confirmada decide en cuál de las dos secciones aterriza la tarjeta.',
  'help.guide.create-booking.step.6': 'Haz clic en Añadir.',
  'help.guide.create-booking.result':
    'La reserva es una tarjeta en su sección, con su chip de clase, sus fechas y su código, y todos los demás del viaje la ven aparecer.',
  'help.guide.create-booking.tip.1':
    'Ubicación / dirección ofrece direcciones reales mientras escribes; elegir una sustituye lo que habías puesto, y una dirección escrita por ti se queda tal cual.',
  'help.guide.create-booking.tip.2':
    'Enlace recoge la página de la reserva en el proveedor. La tarjeta lo convierte en un enlace que se abre en una pestaña nueva.',
  'help.guide.create-booking.tip.3':
    'Las Notas son Markdown, así que una lista o una línea en negrita se muestran como tales en la tarjeta.',
  // booking-hotel
  'help.guide.booking-hotel.title': 'Reservar un alojamiento',
  'help.guide.booking-hotel.goal':
    'Mete un alojamiento para que cuente a la vez como reserva y como noches en el Plan por días.',
  'help.guide.booking-hotel.step.1':
    'Haz clic en Reserva manual y elige Alojamiento. Los campos de fecha se van y un bloque de campos de hotel ocupa su lugar.',
  'help.guide.booking-hotel.step.2':
    'Elige el hotel bajo Alojamiento. La lista son los lugares propios del viaje, y elegir uno escribe su nombre en Título y su dirección en Ubicación / dirección.',
  'help.guide.booking-hotel.step.3':
    'Pon Desde y Hasta: la primera noche y la mañana en que te vas. Ambos ofrecen los días del viaje con sus fechas, y los dos se mantienen en orden el uno al otro.',
  'help.guide.booking-hotel.step.4':
    'Rellena Registro de entrada, Check-in hasta y Registro de salida, y el Código de reserva de la confirmación.',
  'help.guide.booking-hotel.step.5': 'Haz clic en Añadir.',
  'help.guide.booking-hotel.result':
    'La tarjeta lleva un rango de días en vez de una fecha, con las horas de entrada y de salida y la dirección, y la misma estancia está ahora en esos días del plan.',
  'help.guide.booking-hotel.tip.1':
    'Alojamiento es el único tipo sin Fecha ni Hora de inicio. Sus fechas son Desde y Hasta, y son días del viaje en lugar de un calendario.',
  'help.guide.booking-hotel.tip.2':
    'Deja Alojamiento vacío y escribe la dirección en su lugar: el lugar se busca, se crea y se marca en el mapa por ti.',
  'help.guide.booking-hotel.tip.3': 'Eliminar la reserva se lleva las noches del Plan por días con ella.',
  // link-booking
  'help.guide.link-booking.title': 'Atar una reserva al plan',
  'help.guide.link-booking.goal':
    'Cuelga una reserva de la parada y del lugar a los que pertenece, para que aparezca donde la vas a querer.',
  'help.guide.link-booking.step.1': 'Haz clic en el lápiz de la tarjeta que quieres vincular. Se abre Editar reserva.',
  'help.guide.link-booking.step.2':
    'Abre Vincular a una asignación del día. La lista es tu plan: un título por día y luego las paradas de ese día, numeradas y con sus horas. Elige aquella a la que pertenece la reserva.',
  'help.guide.link-booking.step.3':
    'Lugar / Actividad vincula el lugar en sí. Elígelo ahí, y Título y Ubicación / dirección se rellenan allí donde los dejaste vacíos.',
  'help.guide.link-booking.step.4': 'Haz clic en Actualizar.',
  'help.guide.link-booking.result':
    'La tarjeta nombra el día y la parada bajo Vincular a una asignación del día, y la reserva viaja junto a esa parada en el Plan por días.',
  'help.guide.link-booking.tip.1':
    'Sin vínculo (independiente), arriba en la lista, quita otra vez el vínculo. Alojamiento no tiene selector de parada alguno: se vincula a través de sus noches.',
  'help.guide.link-booking.tip.2':
    'Elegir una parada en un día con fecha rellena una Fecha vacía por ti. Una fecha que ya habías puesto se deja en paz.',
  // booking-travelers
  'help.guide.booking-travelers.title': 'Decir para quién es una reserva',
  'help.guide.booking-travelers.goal': 'Marca los viajeros que cubre una reserva y luego ve solo las suyas.',
  'help.guide.booking-travelers.step.1':
    'Abre la reserva con el lápiz. Viajeros está arriba del formulario, junto a Tipo de reserva, y pone Asignar viajeros mientras no haya nadie en la reserva.',
  'help.guide.booking-travelers.step.2':
    'Haz clic y elige las personas para las que es esta reserva; los invitados con nombre también están en la lista. Una elegida recibe una marca y su avatar en el campo. Vuelve a hacer clic en el nombre para quitarla.',
  'help.guide.booking-travelers.step.3': 'Haz clic en Actualizar.',
  'help.guide.booking-travelers.step.4':
    'Arriba en la barra de herramientas, junto a los chips de clase, haz clic en el avatar de un viajero para ver solo sus reservas.',
  'help.guide.booking-travelers.result':
    'La tarjeta lista las personas para las que es, y la fila de avatares reduce la pestaña a una de ellas.',
  'help.guide.booking-travelers.tip.1':
    'En la tarjeta los viajeros solo se muestran, nunca se cambian. Se ponen aquí, en el formulario.',
  'help.guide.booking-travelers.tip.2':
    'La fila de avatares aparece en cuanto el viaje tiene más de un miembro y al menos una reserva nombra a alguien. Lo que elijas dura esta sesión del navegador.',
  // booking-files
  'help.guide.booking-files.title': 'Guardar el justificante con la reserva',
  'help.guide.booking-files.goal': 'Adjunta la confirmación, el billete o el pase a la reserva a la que pertenecen.',
  'help.guide.booking-files.step.1':
    'Abre la reserva con el lápiz, baja hasta Archivos y haz clic en Adjuntar archivo. En una reserva que ya existe el documento sube al momento y TREK dice Archivo subido.',
  'help.guide.booking-files.step.2': 'El documento aparece con su nombre, con un botón para abrirlo y una X al lado.',
  'help.guide.booking-files.step.3':
    'Vincular archivo existente ofrece los documentos del viaje que aún no están en esta reserva. Elige uno y se adjunta sin volver a subir nada.',
  'help.guide.booking-files.step.4': 'Haz clic en Actualizar.',
  'help.guide.booking-files.result':
    'La tarjeta lista los documentos bajo Archivos, y un clic en uno de ellos lo abre.',
  'help.guide.booking-files.tip.1':
    'En una reserva que todavía estás creando el documento espera y sube en el momento en que haces clic en Añadir.',
  'help.guide.booking-files.tip.2':
    'La X junto a un documento quita el vínculo, no el documento. Se queda en la pestaña Archivos del viaje.',
  'help.guide.booking-files.tip.3':
    'Qué clases de archivo se pueden adjuntar es la lista Tipos de archivo permitidos del administrador; documentos, texto e imágenes están permitidos de serie.',
  // booking-cost
  'help.guide.booking-cost.title': 'Convertir el precio de una reserva en un coste',
  'help.guide.booking-cost.goal':
    'Lleva lo que cuesta una reserva a los Costes, repartido entre las personas que lo pagan.',
  'help.guide.booking-cost.step.1':
    'Abre la reserva y baja al final del formulario. Bajo Costes están Crear gasto y Vincular gasto existente, con la nota Guarda la reserva y luego abre el editor de gastos.',
  'help.guide.booking-cost.step.2':
    'Haz clic en Crear gasto. La reserva se guarda, su formulario se cierra y el editor de Costes se abre.',
  'help.guide.booking-cost.step.3':
    '¿Para qué fue? ya es el título de la reserva. Mete el Importe total y comprueba la Moneda y el Día.',
  'help.guide.booking-cost.step.4':
    'Categoría es la que implica el tipo de reserva. Pon ¿Quién pagó? y cómo se reparte el importe.',
  'help.guide.booking-cost.step.5': 'Haz clic en Añadir gasto.',
  'help.guide.booking-cost.result':
    'El formulario de la reserva muestra ahora el gasto bajo Gastos vinculados con su importe, y el mismo gasto está en la pestaña Costes, atado a esta reserva.',
  'help.guide.booking-cost.tip.1':
    'La categoría sigue al tipo: Restaurante pasa a Comida y bebida, Alojamiento pasa a Alojamiento, Aparcamiento pasa a Aparcamiento, y Evento y Excursión aterrizan ambos en Otros.',
  'help.guide.booking-cost.tip.2':
    'Una reserva puede llevar varios gastos. Vincular gasto existente ofrece los de Costes que aún no pertenecen a nada. En uno vinculado, Desvincular, conservar el gasto lo suelta y lo deja en Costes, mientras que la papelera lo quita.',
  'help.guide.booking-cost.tip.3':
    'Costes solo está en el formulario mientras el complemento Costes está activado, algo que el administrador conmuta en Complementos.',
  // filter-bookings
  'help.guide.filter-bookings.title': 'Encontrar una reserva',
  'help.guide.filter-bookings.goal': 'Reduce una pestaña larga a la clase, la persona o el estado que buscas.',
  'help.guide.filter-bookings.step.1':
    'Los chips junto al título son las clases que este viaje usa de verdad, cada uno con el número que contiene. Todo es la pestaña entera.',
  'help.guide.filter-bookings.step.2':
    'Haz clic en un chip para quedarte solo con esa clase. Haz clic en un segundo y se quedan ambas.',
  'help.guide.filter-bookings.step.3': 'Todo lo devuelve todo.',
  'help.guide.filter-bookings.step.4':
    'Los avatares junto a los chips filtran por viajero, una persona o varias a la vez.',
  'help.guide.filter-bookings.step.5':
    'Pendiente y Confirmada son las dos secciones, cada una con su cuenta. Haz clic en un título para plegar una; sigue plegada cuando vuelves.',
  'help.guide.filter-bookings.result':
    'La pestaña muestra solo lo que elegiste, y sigue elegido cuando vuelves a ella en esta sesión del navegador.',
  'help.guide.filter-bookings.tip.1':
    'Los chips solo ofrecen las clases que el viaje tiene, así que un viaje sin una sola excursión no tiene chip Excursión.',
  'help.guide.filter-bookings.tip.2':
    'Un filtro que no encaja con nada deja la pestaña vacía con No se encontraron lugares. La redacción es la de la lista de lugares; el sentido es el mismo.',
  // import-booking-file
  'help.guide.import-booking-file.title': 'Leer una reserva de su confirmación',
  'help.guide.import-booking-file.goal':
    'Deja que TREK saque la reserva del correo o del PDF que mandó el proveedor, en vez de escribirla otra vez.',
  'help.guide.import-booking-file.step.1':
    'Haz clic en Importar desde archivo en la barra de herramientas. Se abre Importar confirmaciones de reserva.',
  'help.guide.import-booking-file.step.2':
    'Suelta las confirmaciones en la caja, o haz clic en ella y elígelas: EML, PDF, PKPass, HTML y TXT, hasta cinco archivos de 10 MB cada uno. Las que elegiste aparecen con su nombre en la caja.',
  'help.guide.import-booking-file.step.3':
    'Haz clic en Importar. El diálogo se cierra al momento, porque la lectura ocurre en segundo plano.',
  'help.guide.import-booking-file.step.4':
    'Una tarjeta abajo a la derecha informa de la ejecución bajo el nombre del archivo, y te sigue por la aplicación y a través de una recarga. Analizando archivos… se convierte en una marca cuando la lectura termina, y la tarjeta ofrece Importar. Haz clic ahí.',
  'help.guide.import-booking-file.result':
    'La reserva es una tarjeta en Pendiente con sus noches, su código y la confirmación bajo Archivos, la estancia se sitúa en esos días del plan, y con Costes activado el precio es un gasto ligado a ella.',
  'help.guide.import-booking-file.tip.1':
    'Importar desde archivo solo está ahí si el servidor sabe leer confirmaciones, y eso pide o el extractor o el complemento Análisis con IA. Ese lo conmuta el administrador en Complementos.',
  'help.guide.import-booking-file.tip.2':
    'Si no se pudo leer nada, la tarjeta lo dice y ofrece Try AI parsing, que manda los mismos archivos directos al modelo. Un análisis terminado se guarda diez minutos; empieza la revisión dentro de ese margen.',
  'help.guide.import-booking-file.tip.3':
    'La confirmación solo se adjunta cuando su tipo está en los Tipos de archivo permitidos de los ajustes de administración. PDF está de serie; un correo, EML, hay que añadirlo antes, o la reserva se guarda sin él.',
  // edit-booking
  'help.guide.edit-booking.title': 'Cambiar una reserva',
  'help.guide.edit-booking.goal':
    'Corrige una hora, añade el código que llegó más tarde, o pasa una reserva de Pendiente a Confirmada.',
  'help.guide.edit-booking.step.1':
    'Haz clic en el lápiz de la cabecera de la tarjeta. Editar reserva se abre con todo lo que la reserva sabe.',
  'help.guide.edit-booking.step.2':
    'Cambia lo que haya que cambiar, aquí el Código de reserva que el operador mandó por fin.',
  'help.guide.edit-booking.step.3': 'Pon Estado en Confirmada.',
  'help.guide.edit-booking.step.4': 'Haz clic en Actualizar.',
  'help.guide.edit-booking.result':
    'La tarjeta se muda: una reserva confirmada está en la sección Confirmada detrás de un punto verde, y todos en el viaje la ven mudarse.',
  'help.guide.edit-booking.tip.1':
    'Un Código de reserva que no puedes leer es Difuminar códigos de reserva en Ajustes, bajo Pantalla. Pasa el ratón por encima, o haz clic, y queda legible.',
  'help.guide.edit-booking.tip.2':
    'Cambia el tipo y la categoría de un gasto vinculado le sigue, salvo que hubieras elegido una categoría a mano en el editor de Costes.',
  'help.guide.edit-booking.tip.3':
    'Un alojamiento se edita aquí también: sus días Desde y Hasta están en el mismo formulario.',
  // delete-booking
  'help.guide.delete-booking.title': 'Eliminar una reserva',
  'help.guide.delete-booking.goal': 'Saca del viaje una reserva que se cayó.',
  'help.guide.delete-booking.step.1': 'Haz clic en la papelera de la cabecera de la tarjeta.',
  'help.guide.delete-booking.step.2':
    '¿Eliminar reserva? nombra la que elegiste y dice que se eliminará permanentemente.',
  'help.guide.delete-booking.step.3': 'Haz clic en Confirmar.',
  'help.guide.delete-booking.result':
    'La tarjeta ya no está, para todos en el viaje. Una reserva no tiene deshacer, así que la pregunta es la última parada.',
  'help.guide.delete-booking.tip.1':
    'Eliminar una reserva de alojamiento saca también sus noches del Plan por días y quita el gasto que estaba vinculado a ella.',
  'help.guide.delete-booking.tip.2':
    'Los documentos que estaban adjuntos se quedan en la pestaña Archivos del viaje; solo se va su vínculo con la reserva.',
  // import-booking-file
  'help.guide.import-booking-file.step.5':
    'Cada reserva que se encontró se abre en Nueva reserva, una tras otra, ya rellenada. Para un hotel eso es el nombre en Título y, cuando el viaje tiene el lugar, bajo Alojamiento, su Ubicación / dirección, Desde y Hasta en sus noches, Registro de entrada y Registro de salida, el Código de reserva, la confirmación bajo Archivos y, con Costes activado, el precio como Gasto vinculado. Compruébala y haz clic en Añadir.',

  // ── Screen: trip-costs ────────────────────────────────────────────────────────────────
  'help.ctx.trip-costs.title': 'Costes',
  'help.ctx.trip-costs.summary':
    'El dinero del viaje: cada gasto en un registro con fecha, quién lo adelantó y quién lo debe, en la moneda en la que estaba el recibo, y, en la columna derecha, quién tiene que pagar a quién para que vuelva a cuadrar.',
  'help.ctx.trip-costs.bullet.1':
    'Cuatro tarjetas arriba: Debes y Te deben son tu propio lado del ajuste de cuentas, Importe pendiente es lo que está registrado pero aún no tiene pagador, y Gasto total del viaje lo suma todo, con Tu parte y Pagaste debajo.',
  'help.ctx.trip-costs.bullet.2':
    'Añadir gasto, arriba a la derecha, abre el editor; Saldar cuentas, a su lado, registra de una vez todas las transferencias abiertas.',
  'help.ctx.trip-costs.bullet.3':
    'El registro está agrupado por día, lo más reciente primero, con el total de ese día a la derecha. Una fila lleva la categoría como pestaña de color, el nombre, las fichas de los pagadores, la nota y el importe, más prestaste o tomaste prestado cuando el reparto te deja a favor o en contra en ese gasto.',
  'help.ctx.trip-costs.bullet.4':
    'Sobre la lista están Buscar gastos…, un filtro de categoría, un filtro de día, el selector Todos / Pagados por mí / Me deben y el botón Exportar CSV.',
  'help.ctx.trip-costs.bullet.5':
    'La columna derecha es la respuesta: Saldar cuentas lista quién paga a quién, Saldos muestra el superávit o el déficit de cada viajero, Presupuesto final lo que el viaje le cuesta a cada uno, y Por categoría adónde ha ido el dinero.',
  'help.ctx.trip-costs.bullet.6':
    'Un pago registrado está en el mismo registro como una fila propia, con Editar y Deshacer al lado; un gasto tiene un lápiz y una papelera, y la papelera lo elimina sin preguntar.',
  // add-expense
  'help.guide.add-expense.title': 'Añadir un gasto',
  'help.guide.add-expense.goal': 'Registra lo que algo ha costado, quién lo ha pagado y con quién se reparte.',
  'help.guide.add-expense.step.1':
    'Haz clic en Añadir gasto, arriba a la derecha de la pestaña Costes. El editor se abre, con la fecha de hoy y con todo el mundo ya en el reparto.',
  'help.guide.add-expense.step.2':
    'Escribe para qué fue en ¿Para qué fue?, el único campo que hay que rellenar, y la cifra del recibo en Importe total.',
  'help.guide.add-expense.step.3':
    'Moneda y Día están debajo del importe. Moneda empieza en la del viaje; cámbiala y el editor muestra lo que vale el importe en la moneda del viaje. Día empieza en hoy y es el día bajo el que el registro agrupa el gasto.',
  'help.guide.add-expense.step.4':
    'Elige una Categoría. Hay catorce y no se pueden cambiar: la que elijas es la pestaña de color de la fila y la barra en Por categoría.',
  'help.guide.add-expense.step.5':
    'En ¿Quién pagó?, elige a la persona que adelantó el dinero de verdad. Tú viene preseleccionado; Nadie ha pagado aún registra el importe sin que nadie lo deba, y Pagaron varias personas reparte la cuenta entre varios pagadores.',
  'help.guide.add-expense.step.6':
    'Split empieza en Equally con todo el mundo incluido, y junto a cada nombre está la parte que le sale. Haz clic en Añadir gasto para guardar.',
  'help.guide.add-expense.result':
    'El gasto está en el registro bajo su día, contado en Gasto total del viaje, y la columna de saldo de cuentas ha recalculado quién debe a quién.',
  'help.guide.add-expense.tip.1':
    'Tal como se abre, el gasto está en la moneda del viaje, con la fecha de hoy y repartido a partes iguales entre todos: solo el nombre y el importe hay que rellenarlos de verdad.',
  'help.guide.add-expense.tip.2':
    'El ± junto al importe convierte el gasto en un reembolso. Un total negativo devuelve dinero en vez de cogerlo, y el reparto va al revés.',
  'help.guide.add-expense.tip.3':
    'Adjuntar recibo / factura, abajo, acepta imágenes y PDF. Se suben al guardar, llegan a los Archivos del viaje, y junto al nombre en la lista aparece una ficha Recibos.',
  // expense-payers
  'help.guide.expense-payers.title': 'Decir quién pagó la cuenta',
  'help.guide.expense-payers.goal':
    'Registra quién ha puesto el dinero de su bolsillo en un gasto, la otra mitad del cálculo del ajuste de cuentas.',
  'help.guide.expense-payers.step.1':
    'Abre un gasto con el lápiz junto a su fila y mira ¿Quién pagó?. Pagó una sola persona es lo predeterminado: el desplegable nombra a la única persona que adelantó el dinero.',
  'help.guide.expense-payers.step.2':
    'Nadie ha pagado aún, la primera entrada de ese desplegable, registra el importe sin que nadie deba nada. El gasto cuenta igualmente en Gasto total del viaje.',
  'help.guide.expense-payers.step.3':
    'Pagaron varias personas, el enlace junto a la etiqueta, abre una fila por viajero. Incluye a los que pagaron y escribe lo que puso cada uno; los importes deben sumar el total.',
  'help.guide.expense-payers.step.4':
    'Un gasto que nadie ha pagado se marca como Pendiente en su fila y se cuenta en la tarjeta Importe pendiente, donde se acumula el gasto registrado pero sin saldar.',
  'help.guide.expense-payers.result':
    'Quién pagó decide a quién se le devuelve, el reparto decide quién paga, y Saldos es la diferencia entre los dos.',
  'help.guide.expense-payers.tip.1':
    '¿Quién pagó? y Split son independientes: puedes pagar una cena en la que no estuviste, y entrar en el reparto de una que no pagaste.',
  'help.guide.expense-payers.tip.2':
    'Con varios pagadores los importes deben sumar el total. Incluye a uno más y los demás se reordenan a su alrededor; mientras no cuadren, el editor dice cuánto tienen que sumar y se niega a guardar.',
  'help.guide.expense-payers.tip.3':
    'Quitar un pagador no quita el gasto: el importe sigue en Gasto total del viaje y la fila pasa a Pendiente.',
  // split-expense
  'help.guide.split-expense.title': 'Repartir una cuenta entre los viajeros',
  'help.guide.split-expense.goal':
    'Decide quién debe en un gasto: todos a partes iguales, por importe, o línea por línea del recibo.',
  'help.guide.split-expense.step.1':
    'En el editor de gastos, Split lista a todos los viajeros. Haz clic en un nombre para dejarlo fuera de este gasto; un viajero excluido pone Excluido y no debe nada por él.',
  'help.guide.split-expense.step.2':
    'Equally es lo predeterminado: cada viajero incluido recibe la misma parte, y la línea bajo la lista dice entre cuántos se reparte y a cuánto sale cada parte.',
  'help.guide.split-expense.step.3':
    'Custom cambia las partes por campos de importe. Escribe lo que debe cada viajero; la línea de debajo va contando y se pone verde en El reparto cuadra con el total. No se guarda mientras no cuadre.',
  'help.guide.split-expense.step.4':
    'Ticket reparte el recibo línea por línea: Añadir artículo, luego un nombre y un precio por línea, y bajo Se reparte entre: los viajeros que comparten esa línea.',
  'help.guide.split-expense.step.5':
    'Parte de cada uno, bajo las líneas, muestra lo que acaba debiendo cada viajero, e Importe total, arriba, se suma a partir de las líneas. Haz clic en Guardar.',
  'help.guide.split-expense.result':
    'El reparto es aquello con lo que se construye cada saldo. Se guarda con el gasto y se puede cambiar más tarde sin tocar nada más.',
  'help.guide.split-expense.tip.1':
    'Un viajero que dejas fuera pone Excluido y no debe nada por ese gasto concreto; los demás asumen su parte.',
  'help.guide.split-expense.tip.2':
    'Equally cuadra hasta el céntimo: el céntimo sobrante rota de un gasto a otro, para que no sea siempre el mismo quien lo paga.',
  'help.guide.split-expense.tip.3':
    'El modo Ticket suma Importe total por su cuenta y deja el campo en gris: las líneas del recibo son el total.',
  // expense-currency
  'help.guide.expense-currency.title': 'Introducir un gasto en otra moneda',
  'help.guide.expense-currency.goal': 'Introduce lo que pone de verdad el recibo y deja que TREK guarde la tasa.',
  'help.guide.expense-currency.step.1':
    'Abre Añadir gasto y rellena el nombre y el importe exactamente como pone el recibo, la cifra en sí y no una conversión de ella.',
  'help.guide.expense-currency.step.2':
    'Abre Moneda y elige la moneda del recibo. La lista lleva todos los códigos que TREK conoce y se puede buscar: escribe las tres letras.',
  'help.guide.expense-currency.step.3':
    'Bajo los campos aparece una línea con lo que vale el importe ahora mismo, marcada tasa en vivo. Es una vista previa, no lo que se guarda.',
  'help.guide.expense-currency.step.4':
    'Haz clic en Añadir gasto. La tasa se congela en el acto: a partir de ahí este gasto vale lo que valía el día en que lo introdujiste.',
  'help.guide.expense-currency.step.5':
    'En el registro la fila lleva las dos cifras bajo el nombre: lo que escribiste, una flecha, y lo que cuenta en la moneda del viaje. Cada total, cada saldo y cada ajuste de cuentas de arriba usa la segunda.',
  'help.guide.expense-currency.result':
    'El gasto conserva el importe y la moneda que escribiste. El registro muestra los dos, y los totales y los saldos del viaje siguen en la moneda del viaje.',
  'help.guide.expense-currency.tip.1':
    'La tasa se congela en el momento en que guardas, para que una deuda saldada no se reabra porque el mercado se movió a la semana siguiente. Solo cambiar la moneda del gasto congela una nueva.',
  'help.guide.expense-currency.tip.2':
    'Moneda de visualización en Ajustes cambia solo lo que lees; los importes guardados no se mueven nunca. Si se deja vacía, cada viaje se muestra en su propia moneda.',
  'help.guide.expense-currency.tip.3':
    'La moneda del viaje vive en el propio viaje, bajo Editar viaje, y necesita el permiso Editar detalles del viaje. Cambiarla vuelve a anclar cada tasa congelada en vez de redenominar los importes.',
  // filter-costs
  'help.guide.filter-costs.title': 'Encontrar un gasto, o el gasto de un día',
  'help.guide.filter-costs.goal': 'Reduce un registro largo a lo que buscas de verdad.',
  'help.guide.filter-costs.step.1':
    'Escribe en Buscar gastos…, encima de la lista. Busca en el nombre del gasto mientras escribes.',
  'help.guide.filter-costs.step.2':
    'Todas las categorías abre las catorce categorías. Elige una y solo quedan los gastos de esa categoría.',
  'help.guide.filter-costs.step.3':
    'Todos los días lista cada día en el que se gastó algo. Elige uno y un banner sustituye las cabeceras de día por ese día, cuántos gastos contiene y su total.',
  'help.guide.filter-costs.step.4':
    'El selector Todos / Pagados por mí / Me deben es tu propia vista del registro: aquello en lo que pusiste dinero, y aquello que todavía tienes pendiente de recuperar.',
  'help.guide.filter-costs.step.5':
    'Exportar CSV, al final de la fila, escribe cada gasto en un archivo, con el importe original, su moneda y el importe convertido.',
  'help.guide.filter-costs.result':
    'Los filtros se combinan, y los grupos de día se redibujan con sus propios totales para lo que queda.',
  'help.guide.filter-costs.tip.1':
    'Los pagos registrados no llevan nombre ni categoría, así que una búsqueda o un filtro de categoría los oculta. El filtro de día los conserva, bajo el día en que se registró el pago.',
  'help.guide.filter-costs.tip.2':
    'Exportar CSV exporta siempre todos los gastos, sea lo que sea lo que esté filtrado en pantalla, una fila por gasto.',
  // settle-up
  'help.guide.settle-up.title': 'Averiguar quién debe a quién, y saldarlo',
  'help.guide.settle-up.goal':
    'Convierte un montón de gastos compartidos en el menor número de transferencias que dejan a todos en paz, y regístralas a medida que ocurren.',
  'help.guide.settle-up.step.1':
    'La tarjeta Saldar cuentas, en la columna derecha, lista las transferencias que dejarían a todos en paz: quién paga a quién, y cuánto. El número junto al título es cuántas siguen abiertas.',
  'help.guide.settle-up.step.2':
    'Saldar, junto a una transferencia, la registra como hecha. El flujo desaparece de la tarjeta y los saldos se redibujan.',
  'help.guide.settle-up.step.3':
    'La transferencia registrada es una fila del registro, bajo el día en que ocurrió, marcada como Pago con los dos viajeros y el importe.',
  'help.guide.settle-up.step.4':
    'Junto a esa fila, el lápiz corrige un pago y Deshacer lo retira, y la transferencia vuelve a la tarjeta Saldar cuentas.',
  'help.guide.settle-up.step.5':
    'Añadir pago, en la cabecera de la tarjeta, registra una transferencia que no siguió ninguna sugerencia. Elige De y Para, el Importe, su moneda y el día en que ocurrió.',
  'help.guide.settle-up.step.6':
    'Saldar cuentas, en la cabecera de arriba de la pantalla, registra de una vez todas las transferencias abiertas, como un grupo que se pone en paz al final de un viaje.',
  'help.guide.settle-up.result':
    'Cada transferencia registrada es una fila del registro y una línea menos en la tarjeta Saldar cuentas. Cuando la tarjeta pone Todos están en paz, el viaje está pagado.',
  'help.guide.settle-up.tip.1':
    'La tarjeta muestra el menor número de transferencias, no cada deuda: tres personas que se deben en círculo se reducen a uno o dos pagos.',
  'help.guide.settle-up.tip.2':
    'Saldar registra una transferencia, no mueve dinero. Envíala por el medio que uses y luego haz clic.',
  'help.guide.settle-up.tip.3':
    'Un pago se puede hacer en cualquier moneda, así que pagar en euros una deuda en yenes es normal: el diálogo tiene su propio selector de moneda y también congela esa tasa.',
  // final-budget
  'help.guide.final-budget.title': 'Ver lo que el viaje le costó a cada viajero',
  'help.guide.final-budget.goal': 'Lee el lado por persona del registro: el saldo de hoy, y el coste real por persona.',
  'help.guide.final-budget.step.1':
    'Saldos muestra la posición de cada viajero: una barra verde hacia la derecha si el viaje le debe, una barra roja hacia la izquierda si él le debe al viaje, y el importe junto al nombre.',
  'help.guide.final-budget.step.2':
    'Presupuesto final, debajo, responde a otra pregunta: no quién debe qué ahora mismo, sino lo que el viaje le cuesta a cada viajero una vez que todo se ha devuelto.',
  'help.guide.final-budget.step.3':
    'Haz clic en un nombre para abrir la cuenta: Gastos pagados, y debajo Reembolsos netos y Reembolsos pendientes.',
  'help.guide.final-budget.step.4':
    'Bajo cada línea están las filas de las que se compone: los gastos que pagó ese viajero, las transferencias ya registradas y las que siguen abiertas. Suman exactamente la línea de encima.',
  'help.guide.final-budget.result':
    'Saldos es quién está a favor o en contra hoy; Presupuesto final es lo que el viaje acaba costándole a cada uno de vosotros una vez que todo se ha devuelto.',
  'help.guide.final-budget.tip.1':
    'Registrar un pago no cambia el presupuesto final de nadie. Solo mueve un importe de los reembolsos pendientes a los reembolsos netos.',
  'help.guide.final-budget.tip.2':
    'Un gasto sin pagador se queda fuera de las dos tarjetas, igual que se queda fuera de las sugerencias de saldo de cuentas.',
  // expense-from-booking
  'help.guide.expense-from-booking.title': 'Convertir una reserva en un gasto',
  'help.guide.expense-from-booking.goal':
    'Adjunta lo que un vuelo, un hotel o un lugar costó de verdad al registro al que pertenece.',
  'help.guide.expense-from-booking.step.1':
    'Abre la reserva en la pestaña Transportes o Reservas y haz clic en su lápiz.',
  'help.guide.expense-from-booking.step.2':
    'Baja hasta el bloque Costes al final del formulario. Ofrece Crear gasto, que primero guarda la reserva, y Vincular gasto existente para uno que ya está en la pestaña Costes.',
  'help.guide.expense-from-booking.step.3':
    'Haz clic en Crear gasto. La reserva se guarda, el formulario se cierra, y el editor de Costes se abre con el título de la reserva como nombre y su tipo ya emparejado con una categoría.',
  'help.guide.expense-from-booking.step.4':
    'Rellena el importe y su moneda, quién pagó y el reparto como en cualquier gasto, y guarda. Al reabrir la reserva aparece bajo Gastos vinculados, con un lápiz para editarlo, Desvincular, conservar el gasto para soltarlo y una papelera para quitarlo.',
  'help.guide.expense-from-booking.result':
    'La reserva lleva su coste, y el gasto es una fila corriente de la pestaña Costes, con un pagador, un reparto y una moneda como cualquier otro.',
  'help.guide.expense-from-booking.tip.1':
    'Eliminar la reserva elimina con ella sus gastos vinculados. Quitar gasto, en el bloque Costes de la reserva, hace lo contrario: el gasto se va, la reserva se queda. Desvincular, conservar el gasto mantiene ambos.',
  'help.guide.expense-from-booking.tip.2':
    'Un lugar tiene el mismo bloque en su formulario, donde Crear gasto guarda primero el lugar.',

  // ── Screen: trip-transports ───────────────────────────────────────────────────────────
  'help.ctx.trip-transports.title': 'Transportes',
  'help.ctx.trip-transports.summary':
    'Todo lo que te lleva entre las paradas: vuelos, trenes, autobuses, coches, taxis, bicicletas, cruceros, ferries y las conexiones de transporte público que TREK busca por ti. La pestaña es la lista de todos ellos; también se crean y se leen en el plan, y se dibujan en el mapa.',
  'help.ctx.trip-transports.bullet.1':
    'La pestaña solo guarda los trayectos. Alojamientos, restaurantes, eventos y entradas viven en Reservas, así que la misma entrada nunca aparece dos veces.',
  'help.ctx.trip-transports.bullet.2':
    'La barra de herramientas los cuenta todos bajo Todo y da a cada tipo en uso su propio chip con su propio recuento, Vuelo, Tren, Coche, Transporte público. Transporte, a la derecha, añade uno a mano.',
  'help.ctx.trip-transports.bullet.3':
    'Las tarjetas vienen en tres grupos, cada uno plegable por su encabezado: Transporte público automático para las conexiones que planificó la búsqueda, luego Pendiente, luego Confirmada.',
  'help.ctx.trip-transports.bullet.4':
    'Una tarjeta lleva el estado, el tipo, los días que abarca, las horas, el Código de reserva, la ruta y la Aerolínea con el N° de vuelo, o el N° de tren, el Andén y el Asiento. El lápiz la abre, la papelera la elimina tras una pregunta.',
  'help.ctx.trip-transports.bullet.5':
    'Los transportes también se crean en el plan: cada cabecera de día tiene un más para Añadir transporte y un botón de tranvía para Transporte público, y el conector de tiempo de viaje entre dos paradas abre la misma búsqueda para ese único tramo.',
  'help.ctx.trip-transports.bullet.6':
    'Un transporte con los dos extremos puestos dibuja una línea en el mapa. El icono de ruta en su fila del plan del día enciende esa línea, y Mostrar todas las rutas de reservas, en la barra sobre los días, cambia todo el viaje.',
  // transports-list
  'help.guide.transports-list.title': 'Leer la pestaña Transportes',
  'help.guide.transports-list.goal': 'Saber qué te dice la lista antes de cambiar nada en ella.',
  'help.guide.transports-list.step.1':
    'Transportes es la segunda pestaña del viaje. Solo guarda los trayectos: hoteles, restaurantes, eventos y entradas están en Reservas.',
  'help.guide.transports-list.step.2':
    'La barra de herramientas cuenta cada transporte bajo Todo y da a cada tipo en uso su propio chip con su propio recuento. Haz clic en un chip para quedarte solo con ese tipo, haz clic otra vez para soltarlo. Varios chips pueden estar activos a la vez, y Todo los limpia.',
  'help.guide.transports-list.step.3':
    'Transporte público automático es un grupo propio, las conexiones que planificó la búsqueda de transporte público. Pendiente y Confirmada guardan todo lo introducido a mano. La flecha junto a un encabezado pliega un grupo.',
  'help.guide.transports-list.step.4':
    'Una tarjeta lo dice todo: el punto de estado con Pendiente o Confirmada, el tipo, los días que abarca con sus fechas, las horas, el Código de reserva, la ruta, y la Aerolínea con el N° de vuelo, o el N° de tren, el Andén y el Asiento.',
  'help.guide.transports-list.step.5':
    'El lápiz abre el transporte para editarlo, la papelera lo elimina, tras una pregunta que nombra lo que se va.',
  'help.guide.transports-list.result':
    'La lista queda reducida a lo que buscabas, y cada tarjeta dice de un vistazo si el trayecto está reservado.',
  'help.guide.transports-list.tip.1':
    'Los chips y los grupos plegados se recuerdan por viaje, así que la pestaña se abre de nuevo tal como la dejaste.',
  'help.guide.transports-list.tip.2':
    'Importar desde archivo y AirTrail solo se suman a Transporte en la barra de herramientas cuando el servidor sabe leer confirmaciones de reserva y cuando hay una instancia de AirTrail conectada. Sin ellos, la lista se llena a mano y con la búsqueda de transporte público.',
  // add-transport
  'help.guide.add-transport.title': 'Añadir un transporte a un día',
  'help.guide.add-transport.goal':
    'Poner el trayecto que te lleva de una parada a la siguiente en el día en que ocurre.',
  'help.guide.add-transport.step.1':
    'Cada cabecera de día lleva cuatro botones pequeños a su derecha. Haz clic en el más, cuyo tooltip dice Añadir transporte. El formulario se abre con Fecha ya puesta en ese día.',
  'help.guide.add-transport.step.2':
    'Tipo de reserva elige qué vas a tomar: Vuelo, Tren, Autobús, Coche, Taxi, Bicicleta, Crucero, Ferry u Otro. El formulario sigue. Un vuelo recibe un aeropuerto en cada tramo, un tren una cadena de estaciones, un coche las palabras Recogida y Devolución y Paradas por el camino.',
  'help.guide.add-transport.step.3':
    'Título es el único campo que hay que rellenar; Añadir se queda gris sin él. Escribe lo que reconocerías en un panel de andén.',
  'help.guide.add-transport.step.4':
    'Desde y Hasta buscan una estación, un puerto o una dirección. Escribe al menos tres letras y elige un resultado de la lista. Un nombre solo escrito no lleva coordenadas, así que no dibuja nada en el mapa.',
  'help.guide.add-transport.step.5':
    'Fecha y Hora de inicio dicen cuándo va, Fecha fin y Hora de fin cuándo ha terminado; un trayecto que llega al día siguiente toma allí el día siguiente. Código de reserva, Estado con Pendiente o Confirmada, y Notas son opcionales.',
  'help.guide.add-transport.step.6': 'Haz clic en Añadir.',
  'help.guide.add-transport.result':
    'El transporte es una fila en el día, a su hora entre las paradas, y una tarjeta en la pestaña Transportes bajo Pendiente o Confirmada.',
  'help.guide.add-transport.tip.1':
    'La fila cae donde la pone su hora de inicio, tras la última parada que empieza antes. Su asa la arrastra a cualquier otro sitio del día, o a otro día.',
  'help.guide.add-transport.tip.2':
    'Adjuntar archivo, bajo Archivos, recoge el billete, y Crear gasto, bajo Costes, guarda la reserva y abre el editor de Costes para el importe.',
  'help.guide.add-transport.tip.3':
    'Viajeros marca quién va en este trayecto. En cuanto un transporte tiene viajeros, la barra de herramientas de la pestaña hace crecer sus avatares y filtra la lista por ellos.',
  // plan-transit
  'help.guide.plan-transit.title': 'Planificar una conexión de transporte público',
  'help.guide.plan-transit.goal':
    'Dejar que TREK busque los trenes y autobuses reales entre dos puntos de un día y poner en el plan el que elijas.',
  'help.guide.plan-transit.step.1':
    'En la cabecera del día, haz clic en el botón de tranvía, Transporte público. La búsqueda se abre para ese día.',
  'help.guide.plan-transit.step.2':
    'Origen y Destino toman una parada o una estación. Con la casilla aún vacía se ofrecen las paradas propias del día y los alojamientos del viaje; al escribir dos letras se buscan en su lugar las estaciones del horario. Intercambiar, entre las dos casillas, da la vuelta a la conexión.',
  'help.guide.plan-transit.step.3':
    'Salida o Llegada con una hora dice cuándo quieres viajar, y Mejor ruta, Menos transbordos o Menos caminata dice cómo se deben ordenar las respuestas.',
  'help.guide.plan-transit.step.4':
    'Los chips de debajo dicen qué medios se pueden usar: Tren, Metro, Tranvía, Autobús, Ferry y Teleférico. Apaga uno para dejarlo fuera, al menos uno sigue encendido. Luego haz clic en Buscar.',
  'help.guide.plan-transit.step.5':
    'Cada resultado da salida y llegada, cuánto dura, cuántos transbordos y cuánta caminata, y las líneas en sus propios colores. Haz clic en uno para desplegarlo parada a parada, con los andenes y los tramos a pie entre las líneas.',
  'help.guide.plan-transit.step.6': 'Haz clic en Añadir al día.',
  'help.guide.plan-transit.result':
    'La conexión es una fila en el día con sus líneas, sus transbordos y su tiempo a pie, y una tarjeta en la pestaña Transportes bajo Transporte público automático.',
  'help.guide.plan-transit.tip.1':
    'Las conexiones vienen de Transitous, un servicio comunitario libre sobre datos públicos de horarios: sin clave, sin cuenta. Un administrador puede apuntar la búsqueda a Google en su lugar.',
  'help.guide.plan-transit.tip.2':
    '¿No se encontró nada? Los datos cubren una región y un periodo. Prueba otra hora, enciende más medios, o elige una estación en vez del lugar en sí. El mensaje nombra el servicio que respondió.',
  'help.guide.plan-transit.tip.3':
    'La misma búsqueda se abre para un solo tramo: haz clic en el conector de tiempo de viaje entre dos paradas y elige Transporte público. Origen, Destino y la hora de salida vienen ya rellenos.',
  // change-transit-route
  'help.guide.change-transit-route.title': 'Abrir y cambiar una conexión planificada',
  'help.guide.change-transit-route.goal':
    'Leer la conexión parada a parada, cambiarle el nombre, o volver a buscar la ruta.',
  'help.guide.change-transit-route.step.1':
    'En la pestaña Transportes, las conexiones planificadas están bajo Transporte público automático. Haz clic en la tarjeta.',
  'help.guide.change-transit-route.step.2':
    'Duración, Transbordos y A pie están arriba. Itinerario, debajo, recorre la conexión parada a parada, con los andenes y los tramos a pie entre las líneas.',
  'help.guide.change-transit-route.step.3':
    'Cambiar ruta lanza la búsqueda de nuevo, ya rellena con los dos extremos de esta conexión y con su día.',
  'help.guide.change-transit-route.step.4':
    'Elige otra conexión y haz clic en Añadir al día; ocupa el lugar de la anterior. Editar detalles, junto a Cambiar ruta, abre en cambio el formulario de transporte normal, donde viven el Código de reserva, el Estado, los viajeros y los archivos.',
  'help.guide.change-transit-route.result':
    'El trayecto lleva el nuevo itinerario, y su tarjeta en la pestaña Transportes muestra las nuevas líneas y horas.',
  'help.guide.change-transit-route.tip.1':
    'El título del trayecto es solo texto: el lápiz de al lado lo renombra sin tocar la ruta. Notas, debajo, acepta markdown y tiene una pestaña Editar y una Vista previa.',
  'help.guide.change-transit-route.tip.2':
    'Eliminar, al pie del trayecto, saca la conexión del viaje; el día conserva sus paradas.',
  // leg-travel-mode
  'help.guide.leg-travel-mode.title': 'Cambiar cómo se recorre un tramo',
  'help.guide.leg-travel-mode.goal':
    'Hacer a pie un tramo de un día que por lo demás se recorre en coche, o entregar ese tramo a la búsqueda de transporte público.',
  'help.guide.leg-travel-mode.step.1':
    'Los conectores entre las paradas solo aparecen cuando la ruta del día está encendida. Haz clic en el día para abrirlo, luego en Ruta bajo sus paradas.',
  'help.guide.leg-travel-mode.step.2':
    'Cada conector nombra el tiempo de viaje y la distancia de ese tramo, con el icono del medio en que se calculó: un coche para conducir, un pie para caminar.',
  'help.guide.leg-travel-mode.step.3':
    'Haz clic en el conector. El menú ofrece En coche y A pie, Transporte público, y Usar predet. del día.',
  'help.guide.leg-travel-mode.step.4':
    'Elige A pie. Solo cambia este tramo; el resto del día conserva su propio medio.',
  'help.guide.leg-travel-mode.result':
    'El tramo muestra el icono del pie y su tiempo a pie, y los demás tramos del día conservan el medio del día.',
  'help.guide.leg-travel-mode.tip.1':
    'El medio pertenece al tramo, no al día: los botones En coche y A pie del día entero nunca sobrescriben un tramo que has puesto a mano. Usar predet. del día les devuelve el tramo.',
  'help.guide.leg-travel-mode.tip.2':
    'Transporte público, en el mismo menú, abre la búsqueda de conexiones para exactamente este tramo, con los dos extremos y la hora de salida ya rellenos.',
  'help.guide.leg-travel-mode.tip.3':
    'Los tiempos vienen de un enrutador público sobre carreteras y caminos peatonales reales. Un tramo que no sabe responder conserva su línea recta y no muestra tiempo.',
  // edit-transport
  'help.guide.edit-transport.title': 'Cambiar o eliminar un transporte',
  'help.guide.edit-transport.goal':
    'Corregir una hora, un andén o un código de reserva, o sacar el trayecto del viaje.',
  'help.guide.edit-transport.step.1':
    'En el plan del día un transporte es una fila de color entre las paradas. Haz clic en ella.',
  'help.guide.edit-transport.step.2':
    'El formulario es el que lo creó, con Editar transporte en su barra de título. Todo se puede cambiar: el tipo, la ruta, los días y las horas, el Código de reserva, el Estado.',
  'help.guide.edit-transport.step.3':
    'La ruta de un vuelo es una cadena de aeropuertos, la de un tren una cadena de estaciones. Añadir escala pone otra en medio, y cada tramo conserva sus propias horas y su propio número de vuelo o de tren.',
  'help.guide.edit-transport.step.4':
    'Haz clic en Actualizar. Para quitar el transporte del todo, usa la papelera de su tarjeta en la pestaña Transportes y confirma.',
  'help.guide.edit-transport.result':
    'El cambio se ve en todas partes donde aparece el transporte: la pestaña Transportes, el día en que va, y su línea en el mapa.',
  'help.guide.edit-transport.tip.1':
    'El mismo formulario se abre por los dos lados, con el lápiz de la tarjeta en la pestaña Transportes y con la fila propia del transporte en el plan del día. Una conexión de transporte público planificada es la excepción: su fila abre la vista del trayecto, y Editar detalles lleva allí a este formulario.',
  'help.guide.edit-transport.tip.2':
    'Mover un transporte a otro día no necesita el formulario en absoluto: arrastra su fila de una tarjeta de día a la siguiente.',
  // transport-on-map
  'help.guide.transport-on-map.title': 'Dibujar un transporte en el mapa',
  'help.guide.transport-on-map.goal': 'Ver por dónde va de verdad un vuelo, un trayecto en coche o una conexión.',
  'help.guide.transport-on-map.step.1':
    'Un transporte con los dos extremos puestos lleva un pequeño icono de ruta en su fila del plan del día. Haz clic en él; su etiqueta pasa a Ocultar rutas de reservas.',
  'help.guide.transport-on-map.step.2':
    'La ruta se dibuja en el mapa, con un marcador en forma de píldora en cada extremo que lleva el icono del transporte.',
  'help.guide.transport-on-map.step.3':
    'Haz clic en un marcador de extremo para leer la reserva sin salir del mapa: las horas, la Aerolínea y el N° de vuelo, el Código de reserva y la dirección. Cerrar retira la hoja.',
  'help.guide.transport-on-map.step.4':
    'El icono de ruta de la barra sobre los días hace todo el viaje de una vez: Mostrar todas las rutas de reservas, y Ocultar todas las rutas de reservas para limpiarlas de nuevo.',
  'help.guide.transport-on-map.step.5':
    'Una conexión de transporte público planificada no tiene icono propio. Se dibuja con el interruptor Ruta del día, y por eso Ocultar todas las rutas de reservas no la quita mientras la ruta de ese día siga encendida.',
  'help.guide.transport-on-map.result':
    'Las rutas están en el mapa con un marcador en cada extremo, y se quedan ahí hasta que las vuelvas a apagar.',
  'help.guide.transport-on-map.tip.1':
    'Un vuelo, un crucero y un ferry se dibujan como una curva, un coche, un autobús, un taxi y una bicicleta siguen las carreteras reales, y un tren o una conexión planificada pasa por las estaciones en las que para.',
  'help.guide.transport-on-map.tip.2':
    'Una reserva confirmada es una línea continua, una pendiente una discontinua. El ajuste Etiquetas de rutas de reservas escribe el código del aeropuerto o el nombre de la estación en los marcadores de los extremos.',
  'help.guide.transport-on-map.tip.3':
    'Mostrar todas las rutas de reservas es borrón y cuenta nueva, no una capa: descarta lo que habían puesto los iconos sueltos, así que pulsarlo dos veces te deja con todo encendido o todo apagado.',
  // import-transport-file
  'help.guide.import-transport-file.title': 'Leer un vuelo de su billete electrónico',
  'help.guide.import-transport-file.goal':
    'Deja que TREK saque un vuelo, un tren o un ferry del billete que mandó la compañía, y compruébalo antes de que se guarde.',
  'help.guide.import-transport-file.step.1':
    'Haz clic en Importar desde archivo en la barra de herramientas de la pestaña Transportes, junto a Transporte. Se abre Importar confirmaciones de reserva, el mismo diálogo que tiene la pestaña Reservas.',
  'help.guide.import-transport-file.step.2':
    'Suelta el billete en la caja, o haz clic en ella y elígelo: EML, PDF, PKPass, HTML y TXT, hasta cinco archivos de 10 MB cada uno. Los archivos que elegiste aparecen con su nombre en la caja.',
  'help.guide.import-transport-file.step.3':
    'Haz clic en Importar. El diálogo se cierra al momento; la lectura ocurre en segundo plano.',
  'help.guide.import-transport-file.step.4':
    'Una tarjeta abajo a la derecha informa de la ejecución bajo el nombre del archivo. Analizando archivos… se convierte en una marca cuando la lectura termina, y la tarjeta ofrece Importar. Haz clic ahí.',
  'help.guide.import-transport-file.step.5':
    'Un vuelo se abre en Añadir transporte, ya rellenado: Tipo de reserva en Vuelo, la aerolínea y el número de vuelo en Título, los dos aeropuertos bajo Ruta con Salida y Llegada, sus horas y sus zonas horarias, Aerolínea y N° de vuelo, el Código de reserva y el billete bajo Archivos. Compruébalo y haz clic en Añadir.',
  'help.guide.import-transport-file.result':
    'El vuelo es una tarjeta en Pendiente en la pestaña Transportes y una fila en el día en que sale, con el billete bajo Archivos, y con los dos aeropuertos conocidos dibuja su curva en el mapa.',
  'help.guide.import-transport-file.tip.1':
    'Las dos pestañas comparten una sola importación: un archivo con un vuelo y un hotel abre el vuelo en Añadir transporte y el hotel en Nueva reserva, uno tras otro, sea cual sea la pestaña desde la que empezaste.',
  'help.guide.import-transport-file.tip.2':
    'Los aeropuertos se colocan por su código. Una estación o un puerto que la lectura no pudo situar aparece en ámbar en la tarjeta; elígelo a mano bajo Ruta antes de hacer clic en Añadir, o el transporte no dibuja nada en el mapa.',
  // airtrail-import
  'help.guide.airtrail-import.title': 'Importar vuelos desde AirTrail',
  'help.guide.airtrail-import.goal':
    'Trae al viaje de una vez los vuelos que ya llevas en AirTrail, y deja que sigan a AirTrail a partir de ahí.',
  'help.guide.airtrail-import.step.1':
    'Con el addon de AirTrail activado y tu instancia conectada bajo Integraciones en Ajustes, la barra de herramientas de la pestaña Transportes lleva un botón AirTrail junto a Transporte. Haz clic en él.',
  'help.guide.airtrail-import.step.2':
    'Importar desde AirTrail lista los vuelos de tu cuenta en dos grupos. Durante este viaje tiene los fechados dentro del viaje, ya marcados; Otros vuelos tiene el resto, sin marcar. Un vuelo que ya está en el viaje aparece en gris y marcado como Importado.',
  'help.guide.airtrail-import.step.3':
    'Cada fila es una casilla con la aerolínea y el número de vuelo, los dos aeropuertos y la fecha. Haz clic en una fila para meter el vuelo o dejarlo fuera; los de Otros vuelos solo entran cuando los marcas.',
  'help.guide.airtrail-import.step.4':
    'Los vuelos que enlazan, cada uno saliendo dentro de un día desde el aeropuerto en que aterrizó el anterior, se enmarcan juntos. La casilla de debajo, Importar como un solo vuelo con escala en ese aeropuerto, ya está marcada: déjala para una sola reserva con escala, o desmárcala para importar los tramos como vuelos separados.',
  'help.guide.airtrail-import.step.5':
    'Haz clic en Importar. El botón cuenta los vuelos marcados, y el mensaje de después dice cuántos entraron.',
  'help.guide.airtrail-import.step.6':
    'Los vuelos son tarjetas bajo Confirmada, cada una con una insignia azul de AirTrail junto a su estado, y filas en los días en que vuelan. Una conexión unida es una sola tarjeta, con su ruta pasando por la escala.',
  'help.guide.airtrail-import.result':
    'Los vuelos de AirTrail son tarjetas en la pestaña Transportes y filas en sus días, cada una con la insignia de AirTrail que dice de dónde vino.',
  'help.guide.airtrail-import.tip.1':
    'Un vuelo que ya está en el viaje con el mismo número y la misma fecha se salta, y un mensaje dice cuántos fueron. Deshacer, en la barra de herramientas sobre los días, revierte toda la importación.',
  'help.guide.airtrail-import.tip.2':
    'AirTrail sigue siendo la fuente de la verdad. TREK lee sus cambios cuando abres el viaje y cada pocos minutos en segundo plano; un vuelo borrado allí conserva su tarjeta, con la insignia cambiada a No sincronizado. Los cambios hechos en TREK solo vuelven con Escribir cambios de vuelta en AirTrail activado bajo Integraciones.',
  'help.guide.airtrail-import.tip.3':
    'Una conexión unida no tiene un único vuelo de AirTrail al que seguir, así que es una importación única: conserva la insignia azul, y pasar por encima de la insignia lo dice. Lo mismo le pasa a un vuelo sincronizado al que das una escala a mano.',

  // ── Screen: trip-roadtrip ─────────────────────────────────────────────────────────────
  'help.ctx.trip-roadtrip.title': 'Viaje por carretera',
  'help.ctx.trip-roadtrip.summary':
    'El plan leído como un solo trayecto: los mismos días y los mismos lugares, encadenados en paradas con la conducción entre ellas, en una lista por la columna izquierda y en el mapa. Dice cuánto hay y cuánto dura, dónde se vacía el depósito y qué hay junto a la carretera.',
  'help.ctx.trip-roadtrip.bullet.1':
    'Días y Viaje por carretera, arriba en la columna izquierda, cambian entre el plan de días y el trayecto. Nada se copia y nada se modifica: Días devuelve el plan exactamente como estaba.',
  'help.ctx.trip-roadtrip.bullet.2':
    'La cabecera de la lista suma el viaje: Distancia, Tiempo de conducción y Paradas. Debajo viene una tarjeta por día, con los kilómetros propios del día, para cuántas paradas es, lo que se pasa, y una etiqueta Traza.',
  'help.ctx.trip-roadtrip.bullet.3':
    'Una parada numerada es un lugar para el que existe el día. Una parada del camino, gasolina, recarga, un área de descanso, lleva el icono de su tipo en vez de un número y no se cuenta. Haz clic en un número para cambiar lo que es, y en la etiqueta Parada para decir cuánto dura.',
  'help.ctx.trip-roadtrip.bullet.4':
    'Entre dos paradas, una banda de conducción da el tramo en distancia y tiempo. Haz clic en ella para Rutas para este tramo, o haz clic en la ruta dibujada en el mapa para doblar el tramo por un punto de paso.',
  'help.ctx.trip-roadtrip.bullet.5':
    'La columna derecha pasa a ser A lo largo de la ruta: elige un día, qué buscar y qué ancho tiene el corredor, y luego Buscar. Añadir pone un resultado en el trayecto en el punto por el que se pasa de verdad.',
  'help.ctx.trip-roadtrip.bullet.6':
    'Los Ajustes de conducción, debajo, guardan los límites, el coche y su autonomía, el horario diario, lo que hay que evitar y cómo se dibuja la línea. Pertenecen al viaje, así que todo el mundo planifica con el mismo coche.',
  // roadtrip-mode
  'help.guide.roadtrip-mode.title': 'Leer el viaje como un solo trayecto',
  'help.guide.roadtrip-mode.goal': 'Pasa el plan al modo viaje por carretera y lee lo que te cuenta la lista.',
  'help.guide.roadtrip-mode.step.1':
    'Haz clic en Viaje por carretera en el selector Días y Viaje por carretera, arriba en la columna izquierda. El plan de días queda sustituido por el trayecto, y el mapa dibuja cada día que tiene ruta calculada.',
  'help.guide.roadtrip-mode.step.2':
    'La cabecera de la lista suma todo el viaje: Distancia, Tiempo de conducción y Paradas.',
  'help.guide.roadtrip-mode.step.3':
    'Debajo viene una tarjeta por día. Su cabecera lleva el número y la fecha del día, la conducción en distancia y tiempo, y para cuántas paradas es el día.',
  'help.guide.roadtrip-mode.step.4':
    'Dentro de la tarjeta el día es una cadena: una parada numerada por lugar, una banda de conducción entre cada par, y la hora de llegada en el borde derecho.',
  'help.guide.roadtrip-mode.step.5':
    'Haz clic en la cabecera de un día para plegarlo. Un día plegado también sale del mapa; haz clic otra vez en la cabecera para traerlo de vuelta.',
  'help.guide.roadtrip-mode.result':
    'La columna izquierda es el trayecto y el mapa muestra cada uno de sus días. Días vuelve directo al plan, sin cambios.',
  'help.guide.roadtrip-mode.tip.1':
    'La elección se recuerda por viaje mientras la pestaña del navegador siga abierta, así que una recarga vuelve al trayecto.',
  'help.guide.roadtrip-mode.tip.2':
    'El selector solo existe cuando un administrador ha activado el complemento Viaje por carretera, en Complementos dentro de Administración.',
  'help.guide.roadtrip-mode.tip.3':
    'En el móvil no hay selector: el complemento añade su propia pestaña Viaje por carretera junto a Plan.',
  // roadtrip-stops
  'help.guide.roadtrip-stops.title': 'Paradas del camino, y cuánto te quedas',
  'help.guide.roadtrip-stops.goal':
    'Convierte un lugar del trayecto en una parada del camino, y di cuánto dura cada parada.',
  'help.guide.roadtrip-stops.step.1':
    'Haz clic en el número que hay delante de una parada en la lista. Su etiqueta es Convertir en parada del camino, y abre Tipo de parada.',
  'help.guide.roadtrip-stops.step.2':
    'Elige un tipo: Alojamiento, Gasolina, Recarga, Área de descanso, Camping, Comida o Lugares de interés. El número se convierte en el icono de ese tipo y las paradas de debajo se renumeran.',
  'help.guide.roadtrip-stops.step.3':
    'Una parada del camino no es un destino, así que la cabecera del día cuenta una parada menos.',
  'help.guide.roadtrip-stops.step.4':
    'Haz clic otra vez en el icono, Cambiar el tipo de parada, y elige Volver a ser un destino para devolverle su número a la parada.',
  'help.guide.roadtrip-stops.step.5':
    'Cada parada lleva una etiqueta Parada. Haz clic en ella para abrir Tiempo en la parada.',
  'help.guide.roadtrip-stops.step.6':
    'Fija la duración con el deslizador, con los botones menos y más o con uno de los valores predefinidos, mira qué hacen Llegada y Salida, y luego haz clic en Guardar.',
  'help.guide.roadtrip-stops.result':
    'La parada a la que le pusiste tiempo lleva la hora en su etiqueta Parada y todas las llegadas posteriores se han movido con ella, y la que mandaste a un tipo y de vuelta es otra vez un destino numerado.',
  'help.guide.roadtrip-stops.tip.1':
    'Una estancia pertenece al lugar, no a una visita: en un lugar planificado en dos días se está lo mismo en ambos.',
  'help.guide.roadtrip-stops.tip.2':
    'Las paradas del camino también aparecen en Días. Apagar Mostrar también en Días, dentro de Paradas de servicio en los Ajustes de conducción, las deja solo en Viaje por carretera.',
  'help.guide.roadtrip-stops.tip.3': 'Sin parada, en el mismo diálogo, quita otra vez ese tiempo.',
  // roadtrip-corridor
  'help.guide.roadtrip-corridor.title': 'Encontrar gasolina, comida y cama a lo largo de la ruta',
  'help.guide.roadtrip-corridor.goal':
    'Busca en la carretera que conduces de verdad, y pon lo que encuentres en el tramo correcto.',
  'help.guide.roadtrip-corridor.step.1':
    'Elige el día arriba en A lo largo de la ruta. Solo se ofrecen los días con ruta calculada.',
  'help.guide.roadtrip-corridor.step.2':
    'En Se busca, marca lo que necesitas. Gasolina, Recarga, Área de descanso, Camping, Alojamiento, Comida y Lugares de interés se pueden combinar.',
  'help.guide.roadtrip-corridor.step.3':
    'En En un radio de, elige cuánto mirar a cada lado de la carretera, 2 km, 5 km o 10 km, y luego haz clic en Buscar.',
  'help.guide.roadtrip-corridor.step.4':
    'Los resultados vuelven agrupados por tipo, en el orden en que los pasas, cada uno con lo avanzado que va el día en ese punto y lo lejos que queda de la ruta.',
  'help.guide.roadtrip-corridor.step.5':
    'Añadir en un resultado abre Añadir como parada. Dice en qué día y en qué posición cae la parada, pide el tipo y el tiempo en la parada, y Añadir la pone en el trayecto.',
  'help.guide.roadtrip-corridor.result':
    'Los resultados se listan en el orden en que los pasas y se dibujan en el mapa, y el que has añadido queda en el trayecto en el punto por el que se pasa de verdad.',
  'help.guide.roadtrip-corridor.tip.1':
    'No se busca nada hasta que pulsas Buscar: una ejecución son muchas peticiones a un servicio compartido.',
  'help.guide.roadtrip-corridor.tip.2':
    'Filtrar por nombre estrecha lo que ha vuelto sin volver a preguntar, y Borrar resultados vacía la lista y sus chinchetas. Haz clic en un resultado para traerlo a la vista en el mapa.',
  'help.guide.roadtrip-corridor.tip.3':
    'Un resultado también se puede arrastrar desde el mapa hasta la ruta dibujada, que es como eliges tú mismo el tramo donde la misma carretera se recorre dos veces. Añadir a mano, junto a Buscar, busca en cambio un lugar por su nombre.',
  // roadtrip-via
  'help.guide.roadtrip-via.title': 'Doblar un tramo por un punto de paso',
  'help.guide.roadtrip-via.goal': 'Manda un tramo por la carretera que de verdad quieres, sin añadirle una parada.',
  'help.guide.roadtrip-via.step.1':
    'Trae a la vista el tramo que quieres: haz clic en una parada de la lista y luego cierra la tarjeta que se abre sobre el mapa.',
  'help.guide.roadtrip-via.step.2':
    'Haz clic en la ruta dibujada. Se deja un punto de paso en el tramo en el que has hecho clic, y el tramo se vuelve a calcular pasando por él.',
  'help.guide.roadtrip-via.step.3':
    'La lista lo sigue: la cabecera del día lleva la nueva distancia y el nuevo tiempo de conducción, y cada llegada posterior al punto de paso se mueve con él.',
  'help.guide.roadtrip-via.step.4':
    'Pasa el ratón por el tirador y dice lo que sabe hacer: Arrastra para remodelar la ruta, clic derecho para quitar. Arrástralo a otro sitio y el tramo se vuelve a dibujar por el punto nuevo.',
  'help.guide.roadtrip-via.step.5':
    'Haz clic derecho en el tirador para quitarlo. El tramo vuelve a ir por el camino directo.',
  'help.guide.roadtrip-via.result':
    'El tramo sigue la carretera que has elegido, y la distancia, el tiempo de conducción y las llegadas del día se vuelven a calcular para ella.',
  'help.guide.roadtrip-via.tip.1':
    'Un punto de paso no es una parada: no tiene número, ni estancia, ni hora de llegada, y no cuenta entre las paradas del día.',
  'help.guide.roadtrip-via.tip.2':
    'Los tiradores se dibujan a partir del nivel de zoom 9, así que un mapa ajustado a todo el viaje muestra la línea sin ellos.',
  'help.guide.roadtrip-via.tip.3':
    'Un clic a más de dos kilómetros de cualquier tramo dibujado se ignora, y un clic sobre un vuelo, un tren o un ferry también.',
  // roadtrip-alternatives
  'help.guide.roadtrip-alternatives.title': 'Probar otra forma de conducir un tramo',
  'help.guide.roadtrip-alternatives.goal': 'Mira qué más ofrece el enrutador para un trecho, y tómalo.',
  'help.guide.roadtrip-alternatives.step.1':
    'Haz clic en una banda de conducción de la lista, la fila entre dos paradas que da el tramo en distancia y tiempo. Su etiqueta es Otras rutas.',
  'help.guide.roadtrip-alternatives.step.2':
    'Rutas para este tramo se abre sobre el mapa, una entrada por carretera, cada una dibujada en el mapa con su propio color.',
  'help.guide.roadtrip-alternatives.step.3':
    'Pasa el ratón por una entrada para encender esa carretera. Actual es la carretera por la que se va y La más rápida la más veloz; las demás dicen cuánto más lentas son, o qué clase de carretera dejan fuera.',
  'help.guide.roadtrip-alternatives.step.4':
    'Haz clic en una entrada para ir por ahí, o en Cerrar para quedarte con la carretera en la que estás.',
  'help.guide.roadtrip-alternatives.result':
    'El tramo va por la carretera que has elegido, y la distancia de la lista y las llegadas posteriores cambian con ella.',
  'help.guide.roadtrip-alternatives.tip.1':
    'Elegir otra carretera pone un punto de paso en el tramo y sustituye los que ya tuviera; elegir la carretera propia del enrutador los quita otra vez.',
  'help.guide.roadtrip-alternatives.tip.2':
    'Sin autopista, Sin peajes y Sin ferri vienen de un segundo motor con su propio modelo de velocidad, así que sus tiempos no son comparables con los demás.',
  // roadtrip-limits
  'help.guide.roadtrip-limits.title': 'Fijar el coche y los límites de conducción',
  'help.guide.roadtrip-limits.goal': 'Dile a TREK qué conduces y cuánto estás dispuesto a conducir de una vez.',
  'help.guide.roadtrip-limits.step.1':
    'Ajustes de conducción está debajo de la búsqueda, en la columna derecha. Sus etiquetas dicen qué hay puesto; haz clic para abrirlo.',
  'help.guide.roadtrip-limits.step.2':
    'En Conducción, Trayecto más largo seguido y Conducción por día van en minutos. Un campo vacío significa desactivado, y no se marca nada.',
  'help.guide.roadtrip-limits.step.3':
    'En Vehículo, di qué conduces. Gasolina solo reposta en paradas de gasolina, Eléctrico solo en las de recarga, Ambos en las dos.',
  'help.guide.roadtrip-limits.step.4':
    'Escribe tú mismo Autonomía por depósito, o Autonomía por carga. Calcular a partir del coche, debajo, toma Depósito y Consumo, o Batería y Consumo, y hace la cuenta.',
  'help.guide.roadtrip-limits.step.5':
    'Evitar si es posible es una preferencia, no una prohibición: un día sin manera de rodearlo usa igualmente esa carretera, y lo dice en su cabecera.',
  'help.guide.roadtrip-limits.step.6':
    'Cierra el diálogo. La tarjeta dice qué hay puesto, y la lista marca cada tramo y cada día que se pasa.',
  'help.guide.roadtrip-limits.result':
    'Las etiquetas de la tarjeta dicen qué hay puesto, y cada tramo y cada día por encima de un límite lleva una etiqueta en la lista.',
  'help.guide.roadtrip-limits.tip.1':
    'Los ajustes pertenecen al viaje, así que todo el mundo planifica en él con el mismo coche y los mismos límites.',
  'help.guide.roadtrip-limits.tip.2':
    'Repostar hasta dice cuánto reposta una parada, porque nadie carga al 100 % en la carretera. Una parada de gasolina o de recarga puede saltárselo por su cuenta.',
  'help.guide.roadtrip-limits.tip.3':
    'Línea de la ruta decide cómo se dibuja el trayecto: Conectar los días calcula la noche entre dos días, y Un color por día da a cada día el suyo.',
  // roadtrip-day-window
  'help.guide.roadtrip-day-window.title': 'Dar un principio y un final al día de conducción',
  'help.guide.roadtrip-day-window.goal': 'Deja de conducir a la hora que elijas, y di dónde debe acabar el día.',
  'help.guide.roadtrip-day-window.step.1': 'Abre Ajustes de conducción en la columna derecha y busca Horario diario.',
  'help.guide.roadtrip-day-window.step.2':
    'Pon un Inicio del día. Por sí solo no hace nada: hacen falta las dos horas, como dice la nota que hay debajo.',
  'help.guide.roadtrip-day-window.step.3':
    'Pon un Fin del día. El trayecto ahora se detiene a esa hora y pasa el resto a la mañana siguiente, como una fila Fin del día y una fila Continuar viaje en la lista.',
  'help.guide.roadtrip-day-window.step.4':
    'En Final del día, elige En la ruta para parar en la carretera a la hora de fin, o En el último lugar para detenerte antes de que el siguiente trayecto la sobrepase.',
  'help.guide.roadtrip-day-window.step.5':
    'Cierra el diálogo. La tarjeta Ajustes de conducción lleva las dos horas como etiqueta.',
  'help.guide.roadtrip-day-window.result':
    'El trayecto se corta en días de viaje de la longitud que has fijado, y lo que no cabe continúa en días calculados después del último. Tus días y sus lugares no se modifican.',
  'help.guide.roadtrip-day-window.tip.1':
    'Vaciar cualquiera de las dos horas lo desactiva todo otra vez. Las horas que hayas fijado tú en una parada siempre tienen prioridad.',
  'help.guide.roadtrip-day-window.tip.2':
    'Con el horario diario puesto, los días están siempre conectados: el trayecto desde la última parada de un día hasta la primera del siguiente se calcula y se cuenta.',
  'help.guide.roadtrip-day-window.tip.3':
    'Cada final de día es también un marcador en el mapa, una luna con el número del día. Arrástralo por la ruta, o hasta un lugar, para acabar el día en otro sitio; haz clic derecho en él para devolver el final automático, y Restaurar finales de día automáticos en este diálogo lo deshace todo.',
  // roadtrip-refuel
  'help.guide.roadtrip-refuel.title': 'Repostar antes de que se vacíe el depósito',
  'help.guide.roadtrip-refuel.goal':
    'Encuentra dónde repostar en el trecho que el coche todavía alcanza, y ponlo en el trayecto.',
  'help.guide.roadtrip-refuel.step.1':
    'Con una autonomía puesta, la lista dibuja una banda cruzando el tramo en el punto donde se agota: Aquí se vacía el depósito, y debajo, a qué distancia dentro del tramo cae eso.',
  'help.guide.roadtrip-refuel.step.2':
    'La lámpara de la banda es el botón. Buscar combustible mira a lo largo de la carretera que ya has conducido, con Buscando a lo largo de la ruta… mientras lo hace.',
  'help.guide.roadtrip-refuel.step.3':
    'Vuelven hasta tres estaciones, cada una con lo lejos que queda de la ruta y cuánta autonomía dejaría de sobra.',
  'help.guide.roadtrip-refuel.step.4':
    'El más de una oferta la añade como parada de repostaje. Añadir como parada se abre con el tipo y el tiempo ya rellenos, y Añadir la pone en el tramo en el punto por el que se pasa de verdad.',
  'help.guide.roadtrip-refuel.result':
    'La parada está en el tramo correcto con su propio icono, la autonomía cuenta de nuevo desde ella, y la banda ha desaparecido.',
  'help.guide.roadtrip-refuel.tip.1':
    'La autonomía cuenta desde la última parada de gasolina o de recarga, de un día a otro. Qué conduces decide qué paradas cuentan: Gasolina solo la gasolina, Eléctrico solo la recarga.',
  'help.guide.roadtrip-refuel.tip.2':
    'La búsqueda mira la carretera anterior al punto seco, guarda una reserva y cuenta el desvío dos veces, así que todo lo que ofrece se alcanza de verdad.',
  'help.guide.roadtrip-refuel.tip.3':
    'Una respuesta vacía no es un callejón sin salida: la lámpara pasa a Reintentar, porque la búsqueda de lugares es un servicio compartido que a veces caduca.',
  // roadtrip-track
  'help.guide.roadtrip-track.title': 'Hacer que un día siga una traza importada',
  'help.guide.roadtrip-track.goal':
    'Pon el trayecto de un día sobre una carretera bonita que hayas importado como traza GPX o KML.',
  'help.guide.roadtrip-track.step.1':
    'Haz clic en la etiqueta Traza en la cabecera de un día. El diálogo se abre en ese día.',
  'help.guide.roadtrip-track.step.2':
    'Elige una traza. Cada una dice cuánto mide y si va a lo largo de este día o a qué distancia queda, la más cercana primero.',
  'help.guide.roadtrip-track.step.3':
    'Haz clic en Seguir esta traza. TREK deja puntos de paso donde el trayecto más se aparta de la traza, y vuelve a calcular, ronda tras ronda.',
  'help.guide.roadtrip-track.step.4':
    'Dice cuántos puntos de paso ha colocado y a qué distancia se mantiene ahora el trayecto. El botón de debajo quita otra vez esos puntos de paso y devuelve el día al enrutador; cerrar el diálogo conserva la traza.',
  'help.guide.roadtrip-track.result':
    'El trayecto del día sigue la traza en vez de la carretera que eligió el enrutador, y su etiqueta Traza está encendida y nombra esa traza cuando apuntas a ella.',
  'help.guide.roadtrip-track.tip.1':
    'Importa el archivo en Días con Importar archivo, con Rutas o Tracks marcados. Mientras el viaje no tenga ninguna, ningún día lleva la etiqueta.',
  'help.guide.roadtrip-track.tip.2':
    'Seguir una traza sustituye los puntos de paso que ya tenían los tramos del día, así que da forma a un tramo a mano después de la traza, no antes.',
};

export default help;
