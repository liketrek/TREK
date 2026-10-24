import type { TranslationStrings } from '../types';

// English fallback until 'it' is translated.
const help: TranslationStrings = {
  'help.title': 'Guida e documentazione',
  'help.search': 'Cerca nella guida…',
  'help.contents': 'Indice',
  'help.noResults': 'Nessuna pagina trovata.',
  'help.errorTitle': 'Impossibile caricare la pagina',
  'help.errorBody': 'I contenuti della guida vengono caricati dal wiki di TREK. Controlla la connessione e riprova.',

  // center
  'help.center.button': 'Aiuto per questa schermata',
  'help.center.title': 'Guida',
  'help.center.onThisScreen': 'In questa schermata',
  'help.center.screens': 'Schermate',
  'help.center.thisScreen': 'Attuale',
  'help.center.subScreens': '{count} sottoschermate',
  'help.center.subScreens.one': '{count} sottoschermata',
  'help.center.subScreensLabel': 'Sottoschermate',
  'help.center.guidesCount': '{count} guide',
  'help.center.guidesCount.one': '{count} guida',
  'help.center.goToScreen': 'Vai a {screen}',
  'help.center.overview': 'Panoramica',
  'help.center.howTo': 'Come faccio a…',
  'help.center.searchPlaceholder': 'Cerca in guide e documentazione…',
  'help.center.searchEmpty': 'Nessun risultato per «{query}».',
  'help.center.searchGuides': 'Guide',
  'help.center.searchDocs': 'Documentazione',
  'help.center.searchError': 'La ricerca non è disponibile al momento.',
  'help.center.back': 'Indietro',
  'help.center.close': 'Chiudi la guida',
  'help.center.steps': '{count} passaggi',
  'help.center.steps.one': '{count} passaggio',
  'help.center.step': 'Passaggio {n}',
  'help.center.stepsLabel': 'Passaggi',
  'help.center.stepOf': 'Passaggio {n} di {total}',
  'help.center.screenshot': 'Screenshot', // same-as-en
  'help.center.result': 'Risultato',
  'help.center.tips': 'Da sapere',
  'help.center.related': 'Correlati',
  'help.center.openDocs': 'Apri in Guida e documentazione',
  'help.center.docsSection': 'Nella documentazione',
  'help.center.noContext': "Non c'è ancora una guida per questa schermata.",
  'help.center.noContextHint': 'Cerca nella documentazione oppure dicci cosa stavi cercando.',
  'help.center.feedback': 'Manca qualcosa?',
  'help.center.feedbackLink': 'Scrivici su GitHub',
  'help.center.discord': 'Chiedi su Discord',
  'help.center.quick': 'In breve',
  'help.center.guide': 'Guida',
  'help.center.tour': 'Tour guidato',
  'help.center.imageAlt': 'Passaggio {n} di «{title}»',

  // ctx
  'help.ctx.dashboard.title': 'Dashboard', // same-as-en
  'help.ctx.dashboard.summary':
    "La dashboard mostra tutti i tuoi viaggi. La scheda in alto, a forma di carta d'imbarco, mostra il viaggio in corso o il prossimo in programma. La riga sotto riassume quanto hai viaggiato finora, e le schede elencano tutti i viaggi che stai pianificando, che hai archiviato o che hai già concluso.",
  'help.ctx.dashboard.bullet.1':
    "Carta d'imbarco: il viaggio in corso o il prossimo, con date, compagni di viaggio, luoghi e conto alla rovescia. Cliccala per aprire il viaggio. I quattro pulsanti in alto a destra servono a modificarlo, duplicarlo, archiviarlo o eliminarlo.",
  'help.ctx.dashboard.bullet.2':
    'Statistiche di viaggio: paesi visitati, viaggi, giorni in viaggio e chilometri in volo, calcolati su tutti i tuoi viaggi.',
  'help.ctx.dashboard.bullet.3':
    "Le schede dei viaggi, filtrabili per «In programma», «Archiviati» e «Completato», in griglia o in elenco. La casella di ricerca sopra cerca in tutti i tuoi viaggi insieme, per titolo, data o luogo del viaggio. I pulsanti per modificare, duplicare, archiviare ed eliminare un viaggio si trovano nell'angolo in alto a destra della foto di ogni scheda.",
  'help.ctx.dashboard.bullet.4':
    'I widget a destra: convertitore di valuta, «Raccolte» (se il modulo Raccolte è attivo), orologi mondiali, prossime prenotazioni e widget dei plugin. Quelli integrati si possono disattivare in «Impostazioni», «Aspetto».',
  'help.ctx.dashboard.bullet.5':
    'Per creare un nuovo viaggio puoi usare sia la scheda «Nuovo Viaggio» sia il pulsante in basso a destra.',

  // create-trip
  'help.guide.create-trip.title': 'Creare un viaggio',
  'help.guide.create-trip.goal': 'Crea un nuovo viaggio con nome, date e foto di copertina.',
  'help.guide.create-trip.step.1':
    'Clicca su «Nuovo Viaggio». La scheda in fondo ai tuoi viaggi e il pulsante in basso a destra fanno la stessa cosa.',
  'help.guide.create-trip.step.2':
    "Dai un nome al viaggio. È l'unico campo obbligatorio: tutto il resto puoi aggiungerlo in seguito.",
  'help.guide.create-trip.step.3':
    "Scegli una data di inizio e una di fine. TREK crea un giorno per ogni data, così puoi iniziare a pianificare l'itinerario. Non hai ancora le date? Lasciale vuote e inserisci invece il «Numero di giorni».",
  'help.guide.create-trip.step.4':
    'Facoltativo: aggiungi una foto di copertina. Carica una tua foto, trascinala o incollala, oppure cerca la destinazione su Unsplash.',
  'help.guide.create-trip.step.5': 'Clicca su «Crea Nuovo Viaggio».',
  'help.guide.create-trip.result':
    "Il viaggio compare nella dashboard. Se è il tuo prossimo viaggio, lo vedi nella carta d'imbarco in alto.",
  'help.guide.create-trip.tip.1':
    'Puoi cambiare le date anche dopo. Se ci sono già delle prenotazioni, TREK ti chiede se spostarle insieme ai giorni.',
  'help.guide.create-trip.tip.2':
    'Tutti i costi vengono convertiti nella valuta del viaggio che scegli qui. Scegli la valuta della destinazione.',

  // edit-trip
  'help.guide.edit-trip.title': 'Modificare un viaggio',
  'help.guide.edit-trip.goal': 'Rinomina un viaggio, cambiane le date o modificane le impostazioni.',
  'help.guide.edit-trip.step.1':
    "Clicca sulla matita nell'angolo in alto a destra della scheda del viaggio (o della carta d'imbarco).",
  'help.guide.edit-trip.step.2':
    'Modifica ciò che ti serve: nome, descrizione, date, copertina, valuta, promemoria o compagni di viaggio.',
  'help.guide.edit-trip.step.3': 'Clicca su «Aggiorna».',
  'help.guide.edit-trip.result': 'La scheda si aggiorna subito, per tutti i membri del viaggio.',
  'help.guide.edit-trip.tip.1':
    "Se sposti l'inizio di un viaggio con delle prenotazioni, TREK chiede se spostare anche quelle. Se accorci un viaggio, vengono elencati i giorni che verrebbero rimossi e cosa vi è pianificato. Il salvataggio avviene solo dopo che clicchi su «Rimuovi i giorni e salva».",

  // cover-image
  'help.guide.cover-image.title': 'Impostare una foto di copertina',
  'help.guide.cover-image.goal':
    "Scegli per il viaggio un'immagine da mostrare sulla sua scheda e sulla carta d'imbarco.",
  'help.guide.cover-image.step.1': 'Apri il modulo di modifica del viaggio con la matita sulla sua scheda.',
  'help.guide.cover-image.step.2':
    'Sotto «Immagine di copertina», trascina o incolla una foto, clicca per caricarne una, oppure scrivi una destinazione e clicca su «Cerca su Unsplash».',
  'help.guide.cover-image.step.3': 'Scegli una foto e clicca «Aggiorna».',
  'help.guide.cover-image.result': 'La foto viene salvata con il viaggio e compare ovunque il viaggio sia elencato.',
  'help.guide.cover-image.tip.1':
    'Le foto trovate con la ricerca Unsplash vengono attribuite automaticamente; quelle che carichi tu restano sul tuo server.',

  // duplicate-trip
  'help.guide.duplicate-trip.title': 'Duplicare un viaggio',
  'help.guide.duplicate-trip.goal': 'Usa un viaggio come modello per uno nuovo.',
  'help.guide.duplicate-trip.step.1': "Clicca sull'icona di duplicazione nell'angolo in alto a destra della scheda.",
  'help.guide.duplicate-trip.step.2': 'Leggi cosa verrà copiato e cosa no, poi clicca su «Copia viaggio».',
  'help.guide.duplicate-trip.result':
    "Nella tua dashboard compare una copia, con il nome dell'originale seguito da (copia). Puoi rinominarla e cambiarne le date.",
  'help.guide.duplicate-trip.tip.1':
    'Vengono copiati giorni, luoghi, escursioni e percorsi dei road trip, prenotazioni, voci di budget, liste valigia, attività da fare e note dei giorni; liste valigia e attività vengono copiate senza spunte. Membri, chat, sondaggi, file e link di condivisione non vengono copiati.',

  // archive-trip
  'help.guide.archive-trip.title': 'Archiviare e ripristinare un viaggio',
  'help.guide.archive-trip.goal': "Togli un viaggio dall'elenco senza eliminarlo e ripristinalo quando vuoi.",
  'help.guide.archive-trip.step.1': "Clicca sull'icona di archiviazione nell'angolo in alto a destra della scheda.",
  'help.guide.archive-trip.step.2': 'Per rivederlo, imposta il filtro sopra le schede su «Archiviati».',
  'help.guide.archive-trip.step.3':
    'Clicca su «Ripristina» nella scheda per riportarlo tra quelli «In programma», oppure tra quelli «Completato» se le date sono già passate.',
  'help.guide.archive-trip.result':
    'I viaggi archiviati conservano tutti i dati. Non compaiono più nella dashboard né nel feed del calendario con tutti i viaggi.',

  // delete-trip
  'help.guide.delete-trip.title': 'Eliminare un viaggio',
  'help.guide.delete-trip.goal': 'Elimina definitivamente un viaggio.',
  'help.guide.delete-trip.step.1': "Clicca sull'icona del cestino nell'angolo in alto a destra della scheda.",
  'help.guide.delete-trip.step.2':
    'Conferma con «Elimina». La finestra riporta il nome del viaggio, così sai che è quello giusto.',
  'help.guide.delete-trip.result':
    "Il viaggio, con i suoi giorni, luoghi, prenotazioni e file, viene eliminato. L'operazione è irreversibile: se hai dubbi, archivia il viaggio.",

  // filter-and-view
  'help.guide.filter-and-view.title': 'Trovare i viaggi completati e passare da griglia a elenco',
  'help.guide.filter-and-view.goal': 'Visualizza i viaggi conclusi o archiviati e scegli il layout che preferisci.',
  'help.guide.filter-and-view.step.1':
    'Usa «In programma», «Archiviati» e «Completato» sopra le schede. In «Completato» trovi tutti i viaggi la cui data di fine è già passata.',
  'help.guide.filter-and-view.step.2':
    "Clicca l'icona dell'elenco per passare a un elenco compatto; cliccala di nuovo per tornare alla griglia.",
  'help.guide.filter-and-view.result': 'La dashboard ricorda il layout scelto su questo dispositivo.',

  // calendar-feed
  'help.guide.calendar-feed.title': 'Iscriversi a tutti i viaggi dal calendario',
  'help.guide.calendar-feed.goal':
    'Vedi i giorni e le prenotazioni di tutti i viaggi attivi nella tua app di calendario, sempre sincronizzati.',
  'help.guide.calendar-feed.step.1': "Clicca l'icona del calendario accanto al selettore della vista.",
  'help.guide.calendar-feed.step.2':
    'Clicca su «Attiva l’abbonamento al calendario». TREK crea un link privato al feed.',
  'help.guide.calendar-feed.step.3':
    'Clicca su «Aggiungi a Google Calendar» o «Aggiungi a Calendario Apple / Outlook». Per qualsiasi altra app di calendario, apri «Oppure copia un link manualmente» e copia il link da lì.',
  'help.guide.calendar-feed.result':
    'Ogni viaggio attivo compare nel tuo calendario e si aggiorna automaticamente. Sono esclusi i viaggi archiviati e quelli terminati da più di 90 giorni.',
  'help.guide.calendar-feed.tip.1':
    'Tieni il link riservato: chiunque lo abbia può leggere il feed. Se finisce nelle mani di altri, «Rigenera» crea un nuovo link e quello vecchio smette di funzionare. «Disattiva» rimuove del tutto il link.',

  // widgets
  'help.guide.widgets.title': 'Scegliere i widget della dashboard',
  'help.guide.widgets.goal': 'Mostra o nascondi la riga delle statistiche e i widget a destra.',
  'help.guide.widgets.step.1': 'Apri il menu del tuo avatar in alto a destra e scegli «Impostazioni».',
  'help.guide.widgets.step.2': 'Passa alla scheda «Aspetto».',
  'help.guide.widgets.step.3':
    "Sotto «Widget dashboard», attiva o disattiva ogni widget, separatamente per desktop e per mobile. «Barra laterale destra» disattiva in una volta l'intera colonna di destra.",
  'help.guide.widgets.step.4': 'Torna alla dashboard: la modifica è già applicata.',
  'help.guide.widgets.result':
    'Nascondendo i widget, i tuoi viaggi hanno più spazio. Disattiva tutta la barra laterale destra per centrare il layout.',
  'help.guide.widgets.link': "Apri le impostazioni dell'aspetto",

  // currency-widget
  'help.guide.currency-widget.title': 'Convertire le valute',
  'help.guide.currency-widget.goal': 'Converti un importo tra due valute con i tassi di cambio attuali.',
  'help.guide.currency-widget.step.1': "Inserisci l'importo e scegli le due valute.",
  'help.guide.currency-widget.step.2':
    'La freccia tra le due valute le inverte; la freccia circolare aggiorna il tasso di cambio.',
  'help.guide.currency-widget.result':
    'La coppia di valute viene salvata nel tuo account, quindi è la stessa su tutti i dispositivi.',
  'help.guide.currency-widget.tip.1':
    "I tassi di cambio provengono dal servizio gratuito Frankfurter. La freccia circolare nell'angolo del widget scarica quelli più aggiornati.",

  // timezones-widget
  'help.guide.timezones-widget.title': 'Aggiungere orologi mondiali',
  'help.guide.timezones-widget.goal': "Controlla l'ora locale delle tue destinazioni.",
  'help.guide.timezones-widget.step.1':
    "Clicca su + nel widget «Fusi orari», cerca una città, ad esempio Lisbona, e sceglila dall'elenco.",
  'help.guide.timezones-widget.step.2':
    'Per rimuovere un orologio, passaci sopra con il mouse e clicca sulla × che compare a destra.',
  'help.guide.timezones-widget.result': 'I tuoi orologi vengono salvati nel tuo account.',
  'help.guide.search-trips.title': 'Cercare tra i tuoi viaggi',
  'help.guide.search-trips.goal':
    'Trova un viaggio per nome, per data o per un luogo pianificato al suo interno, compresi i viaggi archiviati.',
  'help.guide.search-trips.step.1':
    "Scrivi in «Cerca viaggi o luoghi» sopra le schede. L'elenco si filtra mentre scrivi, cercando insieme tra viaggi in programma, archiviati e completati.",
  'help.guide.search-trips.step.2':
    'Se un viaggio viene trovato grazie a uno dei suoi luoghi, quel luogo compare sotto il titolo del viaggio. Clicca sulla x nella casella, o premi Esc, per vedere di nuovo tutti i viaggi.',
  'help.guide.search-trips.result':
    'La dashboard mostra solo i viaggi corrispondenti. Svuota il campo di ricerca per vederli di nuovo tutti.',
  'help.guide.search-trips.tip.1':
    'Puoi cercare anche per data: scrivi un mese e un anno, ad esempio maggio 2027, oppure 2027-05, per trovare i viaggi di quel mese.',
  'help.guide.search-trips.tip.2':
    'Durante una ricerca, il selettore «In programma», «Archiviati» e «Completato» non viene applicato, così nessun viaggio resta nascosto da un filtro sbagliato.',

  // ── Screen: vacay ──────────────────────────────────────────────────────────
  'help.ctx.vacay.title': 'Ferie',
  'help.ctx.vacay.summary':
    "Ferie è il tuo pianificatore personale delle assenze: quanti giorni di ferie hai in un anno, quali hai registrato e quanti te ne restano. La griglia mostra l'intero anno. La barra laterale contiene il selettore dell'anno, le persone con cui pianifichi, i calendari condivisi con te, la legenda e la tua disponibilità.",
  'help.ctx.vacay.bullet.1':
    'La griglia annuale: dodici schede mensili, una cella per giorno. Clicca su un giorno per registrarlo o toglierlo. Un pallino blu indica i giorni già coperti da un viaggio.',
  'help.ctx.vacay.bullet.2':
    "La barra degli strumenti in basso: il primo pulsante, con il tuo nome e il tuo colore, registra le ferie; «Ferie aziendali» segna i giorni in cui tutta l'azienda è chiusa. «Mezza giornata» e «Recupero / Flex» cambiano cosa registra un clic, e «Mezza giornata» funziona anche per le ferie aziendali.",
  'help.ctx.vacay.bullet.3':
    "«Disponibilità»: «Giorni», «Utilizzato» e «Rimanenti» per l'anno selezionato, con accanto i giorni riportati e quelli di recupero / flex. Clicca sul titolo della scheda per comprimerla.",
  'help.ctx.vacay.bullet.4':
    '«Persone» sono le persone con cui condividi il piano, ciascuna con il suo colore. «Calendari condivisi» mostra i giorni liberi degli altri come anelli colorati, che non puoi modificare.',
  'help.ctx.vacay.bullet.5':
    'Le impostazioni riguardano weekend, inizio della settimana, riporto dei giorni, il tuo anno di ferie, ferie aziendali, calendari delle festività e delle vacanze scolastiche e, quando pianifichi insieme a qualcuno, «Sciogli unione».',
  // log-day
  'help.guide.log-day.title': 'Registrare un giorno di ferie',
  'help.guide.log-day.goal': "Segna un giorno libero nella griglia dell'anno e guarda il saldo aggiornarsi.",
  'help.guide.log-day.step.1':
    'Controlla il primo pulsante della barra degli strumenti in basso. Quando mostra il tuo nome e il tuo colore, un clic su un giorno registra per te un giorno di ferie.',
  'help.guide.log-day.step.2':
    'Clicca un giorno in una qualsiasi scheda del mese. Il giorno si colora con il tuo colore e «Utilizzato» aumenta di un giorno.',
  'help.guide.log-day.step.3': 'Clicca di nuovo lo stesso giorno per annullarlo.',
  'help.guide.log-day.result':
    'Il giorno è registrato. «Giorni», «Utilizzato» e «Rimanenti» si aggiornano subito, e chi è unito al tuo piano vede la modifica in tempo reale.',
  'help.guide.log-day.tip.1':
    'Finché «Blocca weekend» è attivo in «Impostazioni», non puoi registrare i weekend. Un giorno di weekend registrato in precedenza si può comunque togliere.',
  'help.guide.log-day.tip.2':
    'Un pallino blu in una cella indica che uno dei tuoi viaggi copre quel giorno, così vedi dove ferie e viaggi coincidono.',
  // half-day
  'help.guide.half-day.title': 'Registrare mezza giornata',
  'help.guide.half-day.goal': 'Prenditi un pomeriggio libero usando solo mezza giornata di ferie.',
  'help.guide.half-day.step.1':
    'Attiva «Mezza giornata» nella barra degli strumenti. Il pallino arancione indica la mezza giornata nella griglia.',
  'help.guide.half-day.step.2':
    "Clicca un giorno. Viene registrato come 0,5 e mostra un pallino arancione nell'angolo.",
  'help.guide.half-day.step.3':
    'Quando hai finito, disattiva di nuovo «Mezza giornata». Se clicchi una mezza giornata con impostazioni diverse, viene aggiornata alle impostazioni attuali.',
  'help.guide.half-day.result':
    '«Utilizzato» aumenta di 0,5. «Mezza giornata» e «Recupero / Flex» sono indipendenti, quindi puoi registrare anche mezza giornata di recupero.',
  'help.guide.half-day.tip.1':
    'La barra degli strumenti mostra sempre il segno che inserirà il prossimo clic, così puoi controllare prima di registrare.',
  // comp-day
  'help.guide.comp-day.title': 'Registrare recupero o flessibilità',
  'help.guide.comp-day.goal': 'Prendi un giorno di recupero senza usare giorni di ferie.',
  'help.guide.comp-day.step.1':
    'Attiva «Recupero / Flex» nella barra degli strumenti. Il cerchio tratteggiato indica il giorno di recupero nella griglia.',
  'help.guide.comp-day.step.2':
    'Clicca un giorno. Si riempie di righe diagonali nel tuo colore anziché di un colore pieno.',
  'help.guide.comp-day.result':
    'I giorni di recupero vengono conteggiati accanto ai riquadri delle ferie spettanti e non riducono mai «Rimanenti».',
  'help.guide.comp-day.tip.1':
    'Usalo per straordinari recuperati, flessibilità oraria o giorni di compensazione: qualsiasi assenza che non sia ferie.',
  // entitlement
  'help.guide.entitlement.title': 'Impostare la disponibilità',
  'help.guide.entitlement.goal': "Indica a Ferie quanti giorni di ferie hai nell'anno.",
  'help.guide.entitlement.step.1':
    'Nella scheda «Disponibilità» della barra laterale, clicca sulla casella «Giorni» nella tua riga. Se la scheda è chiusa, clicca sul titolo per aprirla.',
  'help.guide.entitlement.step.2':
    'Inserisci il numero dei tuoi giorni e premi Invio. Premi Esc per mantenere il valore precedente.',
  'help.guide.entitlement.result':
    "«Rimanenti» viene ricalcolato in base alle ferie spettanti, all'eventuale riporto e ai giorni già usati.",
  'help.guide.entitlement.tip.1':
    "Ogni anno ha le sue ferie spettanti, quindi una modifica qui vale solo per l'anno selezionato.",
  // years
  'help.guide.years.title': 'Aggiungere e cambiare anno',
  'help.guide.years.goal': "Pianifica già l'anno prossimo o guarda quello passato.",
  'help.guide.years.step.1':
    "Clicca sul + a destra dell'anno per aggiungere l'anno successivo, oppure sul + a sinistra per quello precedente.",
  'help.guide.years.step.2': "Passa da un anno all'altro con le frecce o con i chip degli anni sotto.",
  'help.guide.years.step.3':
    'Per rimuovere un anno, passa con il mouse sul suo chip e clicca sul piccolo meno. In questo modo vengono eliminate anche tutte le sue voci, quindi conferma con attenzione.',
  'help.guide.years.result':
    'Ogni anno ha le sue ferie spettanti e le sue voci. Il riporto collega un anno al successivo.',
  // company-holidays
  'help.guide.company-holidays.title': 'Segnare le chiusure aziendali',
  'help.guide.company-holidays.goal': 'Blocca i giorni di chiusura aziendale senza scalarli dalle ferie di nessuno.',
  'help.guide.company-holidays.step.1':
    'Apri le Impostazioni e controlla che «Ferie aziendali» sia attivo. Lo è per impostazione predefinita. La barra degli strumenti mostra questa modalità solo quando è attiva.',
  'help.guide.company-holidays.step.2': 'Tornando alla griglia, passa a «Ferie aziendali» nella barra degli strumenti.',
  'help.guide.company-holidays.step.3':
    'Clicca sui giorni: diventano ambra e compaiono nella legenda. Clicca di nuovo su un giorno per toglierlo.',
  'help.guide.company-holidays.result':
    'Le ferie aziendali sono visibili a tutti i partecipanti al piano unito, e non riducono mai i «Rimanenti».',
  'help.guide.company-holidays.tip.1':
    "Chiunque partecipi al piano unito può modificare le ferie aziendali, quindi mettetevi d'accordo su chi le gestisce.",
  // public-holidays
  'help.guide.public-holidays.title': 'Mostrare le festività',
  'help.guide.public-holidays.goal': 'Inserisci nella griglia le festività del tuo paese o della tua regione.',
  'help.guide.public-holidays.step.1': 'Apri le Impostazioni e attiva «Festività pubbliche».',
  'help.guide.public-holidays.step.2':
    "Clicca su «Aggiungi calendario», poi scegli il paese e, se necessario, la regione. Puoi anche assegnargli un colore e un'etichetta. Poi clicca su «Aggiungi».",
  'help.guide.public-holidays.step.3': 'Chiudi le Impostazioni. Le festività compaiono nella griglia e nella legenda.',
  'help.guide.public-holidays.result':
    'Le festività sono segnate nel colore del calendario e non vengono mai scalate dalle tue ferie.',
  'help.guide.public-holidays.tip.1':
    'Puoi aggiungere più calendari, ad esempio quello della tua regione e quello di un collega con cui hai unito il piano.',
  // school-holidays
  'help.guide.school-holidays.title': 'Mostrare le vacanze scolastiche',
  'help.guide.school-holidays.goal': 'Vedi le vacanze scolastiche della tua regione accanto ai tuoi giorni liberi.',
  'help.guide.school-holidays.step.1': 'Apri le Impostazioni e attiva «Vacanze scolastiche».',
  'help.guide.school-holidays.step.2':
    'Clicca su «Aggiungi calendario» e scegli il paese. Se il paese ha calendari diversi, scegli anche la regione o il gruppo, poi clicca su «Aggiungi».',
  'help.guide.school-holidays.step.3':
    'Chiudi «Impostazioni». Le vacanze scolastiche sono evidenziate nel colore del calendario e hanno una barra colorata lungo il fondo dei loro giorni.',
  'help.guide.school-holidays.result':
    'Le vacanze scolastiche vengono solo mostrate nel calendario: non riducono mai le ferie di nessuno.',
  'help.guide.school-holidays.tip.1':
    "Manca la tua regione? L'amministratore può inserire a mano le vacanze scolastiche in Amministrazione, Personalizzazione, Vacanze scolastiche.",
  // weekends
  'help.guide.weekends.title': "Bloccare i weekend e impostare l'inizio della settimana",
  'help.guide.weekends.goal': 'Escludi i weekend dal conteggio e fai iniziare la settimana dal giorno che preferisci.',
  'help.guide.weekends.step.1': 'Apri «Impostazioni».',
  'help.guide.weekends.step.2':
    'Attiva «Blocca weekend», poi sotto «Giorni del weekend» scegli i giorni che per te sono weekend.',
  'help.guide.weekends.step.3': 'Sotto «La settimana inizia il», scegli «Lun» o «Dom».',
  'help.guide.weekends.result':
    'I giorni bloccati sono in grigio nella griglia e non si possono registrare per errore.',
  // leave-year
  'help.guide.leave-year.title': 'Impostare il tuo anno di ferie',
  'help.guide.leave-year.goal':
    'Conta le ferie su un anno fiscale o dalla data di assunzione, invece che da gennaio a dicembre.',
  'help.guide.leave-year.step.1': 'Apri le Impostazioni e cerca «Anno delle ferie».',
  'help.guide.leave-year.step.2':
    'Scegli «Calendario», «Anno fiscale» (con mese e giorno di inizio) o «Assunzione» (con la tua data di assunzione).',
  'help.guide.leave-year.result':
    'Disponibilità, giorni utilizzati e riporto vengono calcolati su quel periodo, e la griglia inizia dal suo primo mese.',
  'help.guide.leave-year.tip.1':
    'Questa impostazione è personale: in un piano unito ognuno mantiene il proprio anno di ferie e i propri conteggi.',
  // carry-over
  'help.guide.carry-over.title': 'Riportare i giorni non utilizzati',
  'help.guide.carry-over.goal': 'Riporta al periodo successivo quello che ti resta alla fine del periodo.',
  'help.guide.carry-over.step.1': 'Apri le Impostazioni.',
  'help.guide.carry-over.step.2': 'Attiva «Riporto».',
  'help.guide.carry-over.result':
    'Il riporto viene ricalcolato su tutti i tuoi anni e mostrato sotto le ferie spettanti.',
  'help.guide.carry-over.tip.1': 'Disattivandolo, tutti i saldi riportati tornano a zero.',
  // invite
  'help.guide.invite.title': 'Pianificare insieme a qualcuno',
  'help.guide.invite.goal':
    "Unisci il tuo piano a quello di un altro utente TREK, così vedete entrambi i giorni liberi in un'unica griglia.",
  'help.guide.invite.step.1': "Clicca sull'icona della persona nella scheda «Persone».",
  'help.guide.invite.step.2': "Scegli l'utente e clicca su «Invia invito».",
  'help.guide.invite.step.3':
    "La persona riceve una notifica e una «Richiesta di unione» la prossima volta che apre Ferie. Fino ad allora l'invito risulta in attesa; passaci sopra con il mouse per annullarlo.",
  'help.guide.invite.result':
    "I due piani si uniscono: ogni persona ha il suo colore, potete registrare giorni l'uno per l'altro e tutto si sincronizza in tempo reale.",
  'help.guide.invite.tip.1':
    "Per annullare un'unione, clicca su «Sciogli» in «Impostazioni». Le voci di ognuno tornano nel rispettivo piano.",
  'help.guide.invite.tip.2':
    "Se l'altra persona deve solo vedere i tuoi giorni, condividi il calendario invece di unire i piani.",
  // share-calendar
  'help.guide.share-calendar.title': 'Condividere il calendario in sola lettura',
  'help.guide.share-calendar.goal':
    'Fai vedere a qualcuno quando sei assente, senza permettergli di modificare il tuo piano.',
  'help.guide.share-calendar.step.1': "Clicca sull'icona di condivisione nella scheda «Calendari condivisi».",
  'help.guide.share-calendar.step.2': "Scegli l'utente e clicca su «Condividi». Non serve che accetti.",
  'help.guide.share-calendar.step.3':
    'I calendari condivisi con te compaiono in cima alla scheda: cliccane uno per nasconderlo o mostrarlo, oppure passaci sopra con il mouse e clicca sulla x per rimuoverlo. Sotto «Condividi con», passa con il mouse su un nome e clicca su «Interrompi condivisione».',
  'help.guide.share-calendar.result':
    'I tuoi giorni liberi compaiono come anello colorato nella sua griglia. Non può modificare nulla di ciò che condividi.',
  'help.guide.share-calendar.tip.1':
    'Condivisione e unione sono indipendenti: puoi unire il tuo piano con una persona e condividerlo con altre.',
  'help.guide.share-calendar.tip.2':
    'Passa il mouse su un giorno con un anello per vedere chi è assente e per quanto tempo.',

  // ── Screen: atlas ─────────────────────────────────────────────────────────────────────
  'help.ctx.atlas.title': 'Atlante',
  'help.ctx.atlas.summary':
    "L'Atlante mostra su una mappa del mondo dove sei stato: ogni paese in cui ti ha portato un viaggio è colorato, e puoi aggiungere a mano i paesi visitati prima di usare TREK. Ingrandisci per vedere le regioni, tieni una lista dei luoghi che vuoi ancora vedere e consulta le tue statistiche nel pannello trasparente in basso.",
  'help.ctx.atlas.bullet.1':
    'La mappa: ogni paese visitato ha un suo colore fisso, i paesi in programma hanno un contorno tratteggiato, quelli della lista desideri un tratteggio diagonale, e tutti gli altri sono grigi. Passa con il mouse su un paese per vederne viaggi, luoghi, prima e ultima visita.',
  'help.ctx.atlas.bullet.2':
    'La ricerca in alto: scrivi un paese o un luogo. Per un paese in cui non sei stato si apre il suo popup. Per un paese in cui sei stato, la sua scheda compare nel pannello. Se scegli un luogo, la mappa apre la sua regione così puoi segnarla.',
  'help.ctx.atlas.bullet.3':
    "«Mostra i paesi in programma», in alto a destra: mostra i paesi dei tuoi prossimi viaggi. L'interruttore compare solo se ne hai.",
  'help.ctx.atlas.bullet.4':
    "Pannello in basso: la scheda «Statistiche» con i paesi (e accanto quelli in programma), regioni, viaggi, luoghi, città, giorni, continenti, la tua serie e i viaggi di quest'anno; la scheda «Lista desideri» con i luoghi che vuoi ancora visitare; con il modulo Escursioni, anche una scheda «Escursioni» con distanza e dislivello delle escursioni che hai fatto.",
  'help.ctx.atlas.bullet.5':
    'Regioni: ingrandendo molto, la mappa mostra stati e province. Cliccane una per segnarla, togliere il segno o aggiungerla alla lista desideri.',
  'help.ctx.atlas.bullet.6':
    'Dawarich: con il modulo collegato, un pannello a sinistra delle statistiche segna i desideri come realizzati e aggiunge paesi in base alle tue registrazioni. Lo fa solo dopo la tua conferma.',
  // mark-country
  'help.guide.mark-country.title': 'Segnare un paese come visitato',
  'help.guide.mark-country.goal':
    'Aggiungi un paese visitato prima di usare TREK, così compare sulla mappa e nel conteggio.',
  'help.guide.mark-country.step.1': 'Scrivi il nome del paese nel campo di ricerca in alto sulla mappa.',
  'help.guide.mark-country.step.2':
    "Selezionalo dall'elenco. La mappa si sposta sul paese e si apre una finestra dedicata.",
  'help.guide.mark-country.step.3': 'Scegli «Segna come visitato».',
  'help.guide.mark-country.result':
    'Il paese riceve un colore sulla mappa e il conteggio «Paesi» aumenta di uno. Il colore è permanente: quando segni altri paesi, i colori degli altri non cambiano.',
  'help.guide.mark-country.tip.1':
    'Cliccando su un paese grigio sulla mappa si apre lo stesso popup. Per i paesi piccoli, la ricerca è più affidabile.',
  'help.guide.mark-country.tip.2':
    'Un paese segnato a mano conta sempre come visitato, indipendentemente dalle date dei viaggi in quel paese.',
  // unmark-country
  'help.guide.unmark-country.title': 'Rimuovere un paese segnato',
  'help.guide.unmark-country.goal': 'Rimuovi dalla mappa un paese che avevi segnato a mano.',
  'help.guide.unmark-country.step.1':
    "Cerca il paese e selezionalo, oppure cliccalo sulla mappa. Se l'hai segnato tu, la finestra ti chiede se vuoi rimuoverlo.",
  'help.guide.unmark-country.step.2': 'Conferma con «Rimuovi».',
  'help.guide.unmark-country.result': 'Il paese torna grigio e non viene più conteggiato.',
  'help.guide.unmark-country.tip.1':
    'In questo modo si possono rimuovere solo i paesi segnati a mano. Un paese con viaggi o luoghi resta segnato finché quei viaggi o luoghi non vengono rimossi. Per un paese segnato a mano, «Rimuovi» si trova anche nella sua scheda di dettaglio nel pannello.',
  // country-details
  'help.guide.country-details.title': 'Vedere cosa hai fatto in un paese',
  'help.guide.country-details.goal': 'Apri un paese visitato e vai ai viaggi che ti ci hanno portato.',
  'help.guide.country-details.step.1': 'Scrivi un paese che hai visitato nella casella di ricerca in cima alla mappa.',
  'help.guide.country-details.step.2':
    'Selezionalo. La mappa si sposta lì e nel pannello in basso compare una scheda con la bandiera del paese, i badge per luoghi, viaggi e regioni visitate, e un chip per ciascuno dei primi tre viaggi.',
  'help.guide.country-details.result': 'Clicca il chip di un viaggio per aprirlo nel pianificatore.',
  'help.guide.country-details.tip.1':
    "Passando il mouse sul paese nella mappa vedi gli stessi numeri, più la prima e l'ultima visita.",
  // planned-countries
  'help.guide.planned-countries.title': 'Mostrare i paesi in cui andrai',
  'help.guide.planned-countries.goal':
    'Mostra sulla mappa i paesi dei tuoi prossimi viaggi, senza conteggiarli come visitati.',
  'help.guide.planned-countries.step.1':
    'Attiva «Mostra i paesi in programma», in alto a destra. Il numero accanto indica quanti sono i paesi in programma.',
  'help.guide.planned-countries.step.2':
    'Cerca un paese in programma e selezionalo: il pannello indica «In programma» e il tooltip sulla mappa mostra quando ci andrai.',
  'help.guide.planned-countries.result':
    "I paesi in programma hanno un contorno tratteggiato, così non si confondono mai con quelli già visitati. L'interruttore ricorda la tua scelta.",
  'help.guide.planned-countries.tip.1':
    'Un paese conta come visitato quando il viaggio è iniziato. Conta anche un viaggio in corso. I viaggi senza date non rientrano affatto nelle statistiche.',
  'help.guide.planned-countries.tip.2': "L'interruttore compare solo se hai viaggi in programma.",
  // regions
  'help.guide.regions.title': 'Segnare una regione',
  'help.guide.regions.goal':
    'Segna non solo i paesi, ma anche gli stati, le province o le prefetture in cui sei stato.',
  'help.guide.regions.step.1':
    'Ingrandisci un paese finché compaiono i confini di stati e province. Se cerchi il paese e lo selezioni, la mappa si avvicina abbastanza.',
  'help.guide.regions.step.2':
    'Clicca su una regione. Passandoci sopra con il mouse ne vedi il nome. Il popup mostra la regione e il suo paese.',
  'help.guide.regions.step.3': 'Scegli «Segna come visitato».',
  'help.guide.regions.result':
    'La regione si colora con il colore del paese. Se il paese non era ancora segnato, segnando la regione viene contato come visitato anche il paese.',
  'help.guide.regions.tip.1':
    "Quando clicchi una regione visitata, viene proposto «Rimuovi», sia che l'abbia segnata tu sia che sia stata aggiunta per un luogo.",
  'help.guide.regions.tip.2':
    'Le regioni in cui hai luoghi reali vengono segnate automaticamente. Non devi fare nulla.',
  // search-place
  'help.guide.search-place.title': 'Trovare un luogo e segnarne la regione',
  'help.guide.search-place.goal':
    'Segna la Baviera cercando Monaco, senza dover sapere in quale regione si trova una città.',
  'help.guide.search-place.step.1':
    'Scrivi una città, un monumento o un indirizzo nella casella di ricerca. Prima compaiono i paesi; i luoghi corrispondenti compaiono sotto, in «Luoghi».',
  'help.guide.search-place.step.2':
    'Scegli il luogo: la mappa si sposta lì e individua la regione in cui si trova il punto.',
  'help.guide.search-place.step.3':
    'Scegli «Segna come visitato» per quella regione, oppure «Aggiungi alla lista desideri» se non ci sei ancora stato.',
  'help.guide.search-place.result':
    'Vengono segnati la regione e anche il paese. Per i paesi che non hanno dati regionali nel pacchetto mappe, viene segnato direttamente il paese.',
  'help.guide.search-place.tip.1':
    "I luoghi vengono dalla stessa ricerca usata in tutto TREK, quindi usano il provider impostato dall'amministratore.",
  // bucket-country
  'help.guide.bucket-country.title': 'Aggiungere un paese alla lista desideri',
  'help.guide.bucket-country.goal':
    'Tieni sulla mappa una lista desideri di paesi, separata dai paesi che hai visitato.',
  'help.guide.bucket-country.step.1': 'Cerca il paese e selezionalo, oppure cliccalo sulla mappa.',
  'help.guide.bucket-country.step.2': 'Scegli «Aggiungi alla lista desideri».',
  'help.guide.bucket-country.step.3':
    'Se sai già quando, scegli mese e anno, poi conferma con «Aggiungi alla lista desideri».',
  'help.guide.bucket-country.result':
    "Il paese compare con righe diagonali nel colore che avrà dopo che l'avrai visitato, ed è elencato nella scheda «Lista desideri» del pannello.",
  'help.guide.bucket-country.tip.1':
    'Quando il paese è in lista, la stessa finestra propone «Rimuovi dalla lista desideri».',
  'help.guide.bucket-country.tip.2':
    'Una voce per ogni data obiettivo: lo stesso paese può essere in lista per due mesi diversi, ma non due volte per lo stesso mese.',
  // bucket-place
  'help.guide.bucket-place.title': 'Aggiungere un luogo alla lista desideri',
  'help.guide.bucket-place.goal':
    "Salva una città, un'attrazione o un indirizzo che vuoi visitare, con coordinate e data prevista.",
  'help.guide.bucket-place.step.1': 'Apri la scheda «Lista desideri» nel pannello in basso.',
  'help.guide.bucket-place.step.2': 'Clicca «Aggiungi luogo».',
  'help.guide.bucket-place.step.3':
    'Scrivi il nome e premi il pulsante di ricerca; scegli il risultato giusto, così il luogo ha le coordinate. Puoi anche scrivere solo un nome e saltare la ricerca.',
  'help.guide.bucket-place.step.4': 'Se vuoi, scegli mese e anno, poi clicca «Aggiungi».',
  'help.guide.bucket-place.result':
    'Il luogo compare in cima alla tua lista desideri con la data prevista. Passaci sopra con il mouse per far apparire la × che lo rimuove.',
  'help.guide.bucket-place.tip.1':
    'Dawarich può segnare in seguito un desiderio come realizzato solo se ha delle coordinate. Lo fa quando le tue registrazioni mostrano che ci sei stato.',
  // stats
  'help.guide.stats.title': 'Leggere le tue statistiche',
  'help.guide.stats.goal': 'Scopri cosa conteggiano i numeri del pannello, e cosa no.',
  'help.guide.stats.step.1':
    '«Paesi» è il numero di paesi diversi in cui sei stato davvero. I paesi in programma compaiono sotto il numero e non vengono conteggiati. «Regioni» conta gli stati e le province in cui sei stato. «Viaggi», «Luoghi» e «Giorni» sono i totali di tutti i tuoi viaggi. «Città» si basa sugli indirizzi dei tuoi luoghi, quindi è una stima.',
  'help.guide.stats.step.2':
    "I continenti mostrano i paesi visitati per continente. L'«Antartide» compare nella riga dopo che l'hai visitata. Seguono la tua serie (anni consecutivi con almeno un viaggio) e il numero di viaggi fatti quest'anno.",
  'help.guide.stats.result': 'I numeri si aggiornano da soli mentre pianifichi i viaggi. Qui non devi gestire nulla.',
  'help.guide.stats.tip.1':
    "Le città vengono ricavate dal testo dell'indirizzo, non cercate. Per questo un indirizzo breve come «Osteria Francescana, Italy», o che termina con una prefettura, può essere contato come regione anziché come città.",
  'help.guide.stats.tip.2':
    'I paesi segnati a mano contano in «Paesi» e nei continenti, ma non aggiungono viaggi, luoghi o giorni.',
  // dawarich-countries
  'help.guide.dawarich-countries.title': 'Aggiungere paesi dalle tue registrazioni',
  'help.guide.dawarich-countries.goal':
    "Usa Dawarich per scoprire in quali paesi sei stato nell'ultimo anno, e aggiungi alla mappa quelli che confermi.",
  'help.guide.dawarich-countries.step.1':
    'Quando il modulo Dawarich è collegato, in fondo alla mappa, a sinistra delle statistiche, compare un pannello Dawarich con due caselle. Clicca su «Paesi».',
  'help.guide.dawarich-countries.step.2':
    'La finestra si apre sulla scheda «Paesi». Clicca su «Cerca i paesi»: TREK legge i paesi e le città coperti dalle tue registrazioni negli ultimi 12 mesi, un mese alla volta, quindi può volerci un momento. Ogni paese non ancora presente nel tuo Atlante viene elencato con la bandiera, il numero di città e il nome della prima città. Ogni paese è spuntato per impostazione predefinita. Clicca su una riga per escluderlo.',
  'help.guide.dawarich-countries.step.3':
    'Conferma con il pulsante in basso a destra, che diventa «Aggiungi 5 paesi» quando hai spuntato cinque righe. La finestra indica quanti paesi sono stati aggiunti. Quando la chiudi, la mappa è già aggiornata.',
  'help.guide.dawarich-countries.result':
    'I paesi confermati si colorano sulla mappa e vengono contati in «Paesi», registrati come provenienti da Dawarich. I paesi che hai segnato a mano non cambiano.',
  'help.guide.dawarich-countries.tip.1':
    "I paesi che l'Atlante mostra già come visitati, a mano, da un viaggio o da un controllo precedente, vengono esclusi, così i tuoi segni non cambiano mai. Un paese che avevi rimosso dall'Atlante viene aggiunto di nuovo se lo confermi qui.",
  'help.guide.dawarich-countries.tip.2':
    "Se TREK non riesce ad abbinare il nome di un paese, il nome viene elencato sotto le righe e non viene scartato. «Controlla di nuovo» interroga di nuovo Dawarich. La nota sotto l'elenco indica che sono stati controllati gli ultimi 12 mesi. Questo periodo non si può modificare.",
  // dawarich-wishes
  'help.guide.dawarich-wishes.title': 'Spuntare i desideri dalle tue registrazioni',
  'help.guide.dawarich-wishes.goal':
    'Scopri quali luoghi della tua lista desideri hai davvero raggiunto, e segnali come raggiunti con la data in cui ci sei arrivato.',
  'help.guide.dawarich-wishes.step.1':
    'Nel pannello Dawarich in fondo alla mappa, a sinistra delle statistiche, clicca su «Lista dei desideri».',
  'help.guide.dawarich-wishes.step.2':
    "La finestra si apre sulla scheda «Lista dei desideri». Clicca «Controlla la lista dei desideri»: TREK cerca nelle tue registrazioni ogni voce che ha delle coordinate. Ogni desiderio raggiunto compare con la distanza minima a cui sei arrivato, il tempo che ci sei rimasto e il giorno, ed è già spuntato. Quelli che avevi già spuntato riportano «Già spuntato». Sotto l'elenco, una nota indica quante voci non hanno coordinate e riporta anche la regola: un desiderio è raggiunto entro 250 m e dopo 20 minuti sul posto.",
  'help.guide.dawarich-wishes.step.3':
    'Conferma con il pulsante in basso a destra, che diventa «Spunta 2» quando hai selezionato due righe. Poi chiudi la finestra e apri la scheda «Lista desideri» del pannello accanto.',
  'help.guide.dawarich-wishes.result':
    'Ogni desiderio riceve una spunta verde con la data della sosta, non quella di oggi. Il tooltip indica «Spuntato dalle tue registrazioni Dawarich». Clicca la data per annullare.',
  'help.guide.dawarich-wishes.tip.1':
    "Passarci davanti non basta: devi essere vicino al luogo e restarci per un po'. Se ci sono più soste valide, viene usata la più lunga. Un desiderio senza coordinate non si può verificare, quindi aggiungi i luoghi con la ricerca in «Aggiungi luogo», non solo con il nome.",
  'help.guide.dawarich-wishes.tip.2':
    'Ogni controllo esamina fino a 50 voci, partendo da quelle non ancora spuntate. Se ce ne sono di più, TREK te lo segnala. Un desiderio già spuntato mantiene la sua data.',

  // ── Screen: collections ───────────────────────────────────────────────────────────────
  'help.ctx.collections.title': 'Raccolte',
  'help.ctx.collections.summary':
    '«Raccolte» è la tua libreria indipendente dai viaggi: liste con un nome dei luoghi che hai trovato e vuoi conservare, ciascuno con lo stato Idea, «Da visitare» o «Visitato» e, con Escursioni attivo, intere escursioni salvate da un viaggio. Luoghi ed escursioni vengono copiati da e verso i viaggi, mai collegati, quindi una lista e un viaggio non si modificano mai a vicenda.',
  'help.ctx.collections.bullet.1':
    "La colonna delle liste a sinistra mostra le tue liste, quelle condivise con te, gli inviti a cui non hai ancora risposto e «Tutti i salvati», che riunisce tutto il contenuto delle liste di cui sei proprietario. In cima ci sono «Nuova lista» e l'importazione da file.",
  'help.ctx.collections.bullet.2':
    "L'intestazione della lista aperta mostra colore, copertina, descrizione e link, i membri e, a destra, «Modifica» (solo per il proprietario), «Esporta» e «Condividi». Su una lista condivisa con te, il pulsante «Condividi» mostra «Condivisa».",
  'help.ctx.collections.bullet.3':
    "La riga dei filtri sopra i luoghi: il + per aggiungere un luogo, i menu a tendina «Stato», «Categoria», «Valutazione» e «Ordina», l'icona della casella di spunta per «Scegli» e l'icona della nuvola per «Importa da un viaggio». Il filtro per etichette compare in questa riga solo quando la mappa non è visibile.",
  'help.ctx.collections.bullet.4':
    'Le righe dei luoghi: foto, nome e indirizzo, etichette e categoria, e la pillola dello stato a destra. Un clic sulla pillola passa allo stato successivo.',
  'help.ctx.collections.bullet.5':
    'La mappa a destra: un segnaposto per ogni luogo con coordinate. La barra in alto contiene «Espandi mappa» («Mostra elenco» quando la mappa è a tutto schermo), il filtro per etichette con il pulsante per gestirle e la casella «Cerca luoghi». Clicca su un segnaposto per aprire quel luogo.',
  'help.ctx.collections.bullet.6':
    'La scheda di dettaglio: clicca su una riga per vedere copertina, categoria, stato, valutazione in stelle, etichette, descrizione e link. La fotocamera sulla copertina cambia la foto. In fondo ci sono «Modifica», «Copia nel viaggio», il pulsante di navigazione e «Rimuovi dalla lista».',
  // create-list
  'help.guide.create-list.title': 'Creare una lista',
  'help.guide.create-list.goal': 'Crea una nuova lista con nome, colore e copertina, pronta per i tuoi luoghi.',
  'help.guide.create-list.step.1': 'Clicca «Nuova lista» in cima alla barra laterale delle liste.',
  'help.guide.create-list.step.2':
    'Dai un nome alla lista e scegli un colore. Immagine di copertina, descrizione e link sono facoltativi: puoi aggiungerli in seguito con «Modifica».',
  'help.guide.create-list.step.3': 'Clicca su «Crea».',
  'help.guide.create-list.result':
    'La lista si apre vuota, con «Aggiungi un luogo» e «Importa da un viaggio» come i due modi per riempirla.',
  'help.guide.create-list.tip.1':
    "Come copertina puoi caricare un'immagine tua o sceglierne una con la ricerca Unsplash nella stessa finestra.",
  // add-place
  'help.guide.add-place.title': 'Aggiungere un luogo',
  'help.guide.add-place.goal':
    'Trova un luogo e salvalo nella lista aperta con nome, categoria, stato e note in un solo passaggio.',
  'help.guide.add-place.step.1':
    "Clicca sul + all'inizio della riga dei filtri sopra i luoghi. In una lista ancora vuota, clicca su «Aggiungi un luogo» al centro della pagina.",
  'help.guide.add-place.step.2':
    'Scrivi il luogo nel campo di ricerca e scegli un risultato. Nome, indirizzo e coordinate vengono compilati in base al risultato.',
  'help.guide.add-place.step.3':
    'Imposta lo stato e, se vuoi, una categoria, una descrizione e dei link, poi clicca «Aggiungi». La finestra resta aperta per il luogo successivo; «Annulla» la chiude.',
  'help.guide.add-place.result': 'Il luogo compare nella lista e, se ha coordinate, come segnaposto sulla mappa.',
  'help.guide.add-place.tip.1':
    "All'interno di un viaggio, «Salva nella raccolta» nel pannello del luogo o nel menu di un luogo aggiunge un luogo del viaggio a una lista senza uscire dal viaggio.",
  'help.guide.add-place.tip.2':
    "La lista deve essere tua oppure una in cui sei editore o amministratore; il + non c'è in «Tutti i salvati» né in una lista che puoi solo visualizzare.",
  // import-from-trip
  'help.guide.import-from-trip.title': 'Importare luoghi da un viaggio',
  'help.guide.import-from-trip.goal':
    'Aggiungi a una lista tutti i luoghi di un viaggio in una volta, invece di salvarli uno per uno.',
  'help.guide.import-from-trip.step.1':
    'Clicca il pulsante di importazione con la freccia e la nuvola nella riga dei filtri. In una lista vuota, lo stesso pulsante si trova accanto ad «Aggiungi un luogo».',
  'help.guide.import-from-trip.step.2': 'Scegli uno dei tuoi viaggi.',
  'help.guide.import-from-trip.step.3':
    "Spunta i luoghi che vuoi. Quelli già presenti nella lista sono in grigio. All'inizio sono selezionati i luoghi che non sono in nessun giorno del viaggio; se ogni luogo è già assegnato a un giorno, sono selezionati tutti i luoghi nuovi. «Solo nuovi» nasconde i luoghi già presenti nella lista.",
  'help.guide.import-from-trip.step.4':
    'Clicca «Importa». Il pulsante indica sempre quanti luoghi stanno per essere aggiunti.',
  'help.guide.import-from-trip.result':
    'I luoghi vengono copiati nella lista con nome, indirizzo, coordinate, descrizione e categoria. Il viaggio non cambia.',
  'help.guide.import-from-trip.tip.1':
    'TREK salta automaticamente i duplicati per nome o coordinate, quindi puoi importare due volte senza problemi.',
  'help.guide.import-from-trip.tip.2':
    "Nell'elenco dei luoghi di un viaggio, la modalità di selezione offre invece «Salva nella raccolta» per un gruppo di luoghi scelti a mano.",
  // place-status
  'help.guide.place-status.title': 'Impostare lo stato di un luogo',
  'help.guide.place-status.goal': "Tieni traccia di cosa è solo un'idea, cosa è tra i favoriti e dove sei già stato.",
  'help.guide.place-status.step.1':
    "Clicca l'etichetta di stato all'estremità destra della riga di un luogo. «Idea» diventa «Da visitare».",
  'help.guide.place-status.step.2': 'Cliccala di nuovo per «Visitato» e ancora una volta per tornare a «Idea».',
  'help.guide.place-status.result':
    'La pillola e il suo colore cambiano subito, e i conteggi nel filtro dello stato sopra la lista si aggiornano.',
  'help.guide.place-status.tip.1':
    'Lo stato esiste solo nelle Raccolte. Quando copi un luogo in un viaggio, lo stato non viene copiato.',
  'help.guide.place-status.tip.2':
    'Da un viaggio, «Salva nella raccolta» apre «Salva in una lista» con una pillola dello stato per ogni lista che contiene il luogo, e la barra di selezione del pannello dei luoghi offre «Segna come visitato nelle tue liste».',
  // place-detail
  'help.guide.place-detail.title': 'Aprire un luogo salvato',
  'help.guide.place-detail.goal':
    'Vedi tutto ciò che riguarda un luogo e cosa puoi farne: modificarlo, copiarlo in un viaggio, trovare la strada, rimuoverlo.',
  'help.guide.place-detail.step.1':
    'Clicca sulla riga di un luogo. La scheda di dettaglio si apre accanto alla lista e la mappa si sposta sul luogo.',
  'help.guide.place-detail.step.2':
    "In fondo ci sono «Modifica», «Copia nel viaggio», il pulsante di navigazione che apre il luogo in un'app di mappe, e «Rimuovi dalla lista». La fotocamera sulla copertina sostituisce la foto automatica con una tua.",
  'help.guide.place-detail.result':
    'Con «Modifica» puoi cambiare nome, categoria, etichette, indirizzo, coordinate, descrizione e link direttamente nella scheda.',
  'help.guide.place-detail.tip.1':
    "La copertina viene recuperata automaticamente se il luogo non ha un'immagine propria. Puoi caricare una tua immagine in formato JPG, PNG, GIF, WebP o HEIC fino a 20 MB. L'icona del cestino accanto alla fotocamera ripristina la foto automatica.",
  'help.guide.place-detail.tip.2':
    'Ogni membro, tu compreso, può lasciare una valutazione in stelle sotto lo stato; il filtro «Valutazione» nella riga dei filtri usa la media.',
  // labels
  'help.guide.labels.title': 'Raggruppare i luoghi con le etichette',
  'help.guide.labels.goal':
    'Assegna a una lista etichette proprie, come quartieri o giorni, oltre alle categorie comuni.',
  'help.guide.labels.step.1':
    'Clicca su «Aggiungi etichetta» accanto alle etichette sopra la mappa («Gestisci etichette» se la lista ne ha già). Quando la mappa non è visibile, il pulsante è alla fine della riga dei filtri.',
  'help.guide.labels.step.2':
    'Scrivi un nome, scegli un colore e clicca «Aggiungi etichetta». Nella stessa finestra puoi rinominare, ricolorare o eliminare le etichette esistenti.',
  'help.guide.labels.step.3':
    'Attiva «Scegli», spunta i luoghi e clicca su «Assegna etichetta» nella barra di selezione, poi scegli le etichette e conferma con «Assegna etichetta». Per un singolo luogo puoi aggiungere etichette anche con «Modifica» nella sua scheda di dettaglio.',
  'help.guide.labels.step.4':
    "Clicca su una o più etichette sopra la mappa per mostrare, nell'elenco e sulla mappa, solo i luoghi che hanno almeno una di queste etichette. Clicca di nuovo su un'etichetta per toglierla dal filtro.",
  'help.guide.labels.result':
    'I luoghi con etichette le mostrano nella loro riga; il filtro per etichette è disponibile per tutti i membri, compresi i visualizzatori.',
  'help.guide.labels.tip.1':
    "Le etichette appartengono alla lista in cui sono state create. Se sposti un luogo in un'altra lista, le sue etichette vengono rimosse.",
  'help.guide.labels.tip.2': 'Per gestire e assegnare etichette servono i permessi di modifica sulla lista.',
  // filter-select
  'help.guide.filter-select.title': 'Filtrare e selezionare i luoghi',
  'help.guide.filter-select.goal': 'Filtra la lista e modifica più luoghi insieme.',
  'help.guide.filter-select.step.1':
    'Usa i menu a tendina nella riga dei filtri: stato, categoria, valutazione minima e ordinamento. Stato e categoria indicano quanti luoghi corrispondono a ogni opzione.',
  'help.guide.filter-select.step.2':
    "Clicca sull'icona della casella di spunta, «Scegli», dopo i menu a tendina. Ogni riga riceve una casella di spunta e compare una barra di selezione.",
  'help.guide.filter-select.step.3':
    'Spunta i luoghi oppure usa «Seleziona tutto» per tutti i luoghi mostrati dal filtro, poi scegli «Assegna etichetta», «Sposta in lista», «Duplica in lista», «Copia nel viaggio» o «Elimina». Solo il proprietario o un amministratore della lista può usare Sposta ed Elimina.',
  'help.guide.filter-select.result':
    'Le azioni si applicano a tutta la selezione insieme. La × a destra chiude la modalità di selezione.',
  'help.guide.filter-select.tip.1':
    '«Seleziona tutto» seleziona solo i luoghi che corrispondono al filtro. Per agire su tutti i luoghi «Da visitare», filtra per «Da visitare» e clicca «Seleziona tutto».',
  // copy-to-trip
  'help.guide.copy-to-trip.title': 'Copiare luoghi in un viaggio',
  'help.guide.copy-to-trip.goal': 'Aggiungi luoghi salvati come tappe di uno dei tuoi viaggi.',
  'help.guide.copy-to-trip.step.1':
    'Attiva «Scegli» e spunta i luoghi, oppure apri un luogo e usa «Copia nel viaggio» nella sua scheda di dettaglio.',
  'help.guide.copy-to-trip.step.2': 'Clicca «Copia nel viaggio» nella barra di selezione.',
  'help.guide.copy-to-trip.step.3': "Scegli il viaggio. Se l'elenco è lungo, usa il campo di ricerca per filtrarlo.",
  'help.guide.copy-to-trip.result':
    "I luoghi vengono aggiunti all'elenco dei luoghi di quel viaggio con nome, descrizione, categoria, note, prezzo, coordinate, foto e tag. Nella raccolta non cambia nulla.",
  'help.guide.copy-to-trip.tip.1':
    'Possono farlo anche i visualizzatori di una lista condivisa. I luoghi vengono copiati dalla lista e la lista non cambia.',
  // share-list
  'help.guide.share-list.title': 'Condividere una lista con qualcuno',
  'help.guide.share-list.goal': 'Pianifica una lista insieme ad altre persone di questo TREK, in tempo reale.',
  'help.guide.share-list.step.1': 'Clicca su «Condividi» in cima alla tua lista.',
  'help.guide.share-list.step.2': "Seleziona l'utente e un ruolo: Visualizzatore, Editore o Admin.",
  'help.guide.share-list.step.3':
    "Clicca su «Invia invito». La persona risulta in attesa finché non accetta l'invito dalla sua barra delle liste o dalla notifica.",
  'help.guide.share-list.result':
    'Quando la persona accetta, la lista compare per lei in «Condivisa» e ogni modifica si sincronizza in tempo reale. Puoi continuare a modificare membri e ruoli nella stessa finestra.',
  'help.guide.share-list.tip.1':
    'I visualizzatori possono guardare, valutare e copiare luoghi nei propri viaggi. Gli editori aggiungono e modificano luoghi ed etichette. Gli amministratori possono anche spostare ed eliminare.',
  'help.guide.share-list.tip.2':
    'Solo il proprietario può invitare e rimuovere persone; un membro può uscire da solo da una lista condivisa.',
  // export-list
  'help.guide.export-list.title': 'Esportare una lista in un file',
  'help.guide.export-list.goal':
    "Passa una lista a qualcuno che usa un altro server TREK, oppure aprila in un'app di mappe.",
  'help.guide.export-list.step.1': 'Clicca su «Esporta» in cima alla lista.',
  'help.guide.export-list.step.2':
    'Scegli «Elenco TREK» per usare la lista in un altro TREK, con etichette e stato, oppure GPX per OsmAnd, Organic Maps, un Garmin e altre app che leggono i waypoint.',
  'help.guide.export-list.result': 'Il file viene scaricato. Qualsiasi membro di una lista condivisa può esportarla.',
  'help.guide.export-list.tip.1':
    'Un luogo senza coordinate non può diventare un waypoint GPX: viene escluso e TREK ti dice quanti luoghi sono rimasti fuori.',
  'help.guide.export-list.tip.2':
    'Valutazioni, membri e foto caricate non vengono esportati di proposito: appartengono a questa istanza di TREK, non alla lista.',
  // import-file
  'help.guide.import-file.title': 'Importare una lista da un file',
  'help.guide.import-file.goal':
    'Importa un file di lista TREK («Elenco TREK») o un file GPX, come nuova lista o in una lista esistente.',
  'help.guide.import-file.step.1':
    'Clicca sul pulsante di importazione con la freccia di caricamento accanto a «Nuova lista», nella barra delle liste.',
  'help.guide.import-file.step.2':
    'Scegli il file. Prima di importare qualsiasi cosa, TREK mostra cosa contiene: il nome, quanti luoghi e quante etichette.',
  'help.guide.import-file.step.3':
    'Lascia «Nuova lista» e, se vuoi, cambia il nome, poi clicca su «Importa». Oppure scegli «Aggiungi a una lista» per inserire i luoghi in una lista che puoi modificare, e clicca su «Aggiungi alla lista».',
  'help.guide.import-file.result':
    "La lista si apre con i luoghi importati. L'importazione in una lista aggiunge soltanto luoghi: quelli già presenti mantengono stato, note ed etichette.",
  'help.guide.import-file.tip.1':
    "Da un file GPX ogni waypoint con un nome diventa un luogo. Le tracce sono linee e vengono escluse, e l'anteprima indica quanti punti sono.",
  'help.guide.import-file.tip.2':
    'Un file che non è né un «Elenco TREK» né un GPX viene rifiutato e TREK ne indica il motivo. Se un singolo luogo non è leggibile, viene saltato solo quel luogo, non tutto il file.',
  // edit-list
  'help.guide.edit-list.title': 'Modificare o eliminare una lista',
  'help.guide.edit-list.goal':
    'Cambia nome, colore, copertina, descrizione o link di una lista, oppure elimina la lista.',
  'help.guide.edit-list.step.1': 'Clicca su «Modifica» in cima alla lista. Lo vede solo il proprietario.',
  'help.guide.edit-list.step.2':
    "Modifica ciò che vuoi e clicca su «Salva». L'icona del cestino in basso a sinistra, «Elimina lista», elimina la lista con tutti i suoi luoghi dopo la tua conferma.",
  'help.guide.edit-list.result': "L'intestazione in alto mostra subito il nuovo colore, la copertina e la descrizione.",
  'help.guide.edit-list.tip.1':
    "L'eliminazione di una lista è irreversibile. Se vuoi conservarne una copia, esportala prima.",
  // all-saved
  'help.guide.all-saved.title': 'Cercare in tutta la tua libreria',
  'help.guide.all-saved.goal': 'Visualizza in una volta i luoghi di tutte le liste che possiedi.',
  'help.guide.all-saved.step.1':
    "Clicca su «Tutti i salvati» nella barra delle liste: mostra in un'unica vista i luoghi di tutte le liste di cui sei proprietario o comproprietario.",
  'help.guide.all-saved.step.2':
    'Scrivi in «Cerca luoghi» sopra la mappa e usa i filtri come in qualsiasi lista. Anche «Scegli» funziona qui: puoi spostare, duplicare, copiare in un viaggio o eliminare luoghi di più liste.',
  'help.guide.all-saved.result':
    "Questa vista mostra insieme tutti i luoghi salvati. Qui non puoi aggiungere o importare luoghi, perché non c'è una singola lista a cui aggiungerli.",
  'help.guide.all-saved.tip.1':
    'Le etichette e le escursioni salvate appartengono a una sola lista, quindi in «Tutti i salvati» non sono disponibili.',

  // ── Screen: journey ───────────────────────────────────────────────────────────────────
  'help.ctx.journey.title': 'Diario di viaggio',
  'help.ctx.journey.summary':
    'Diario di viaggio è il tuo diario di viaggio fatto soprattutto di foto. Ogni diario è collegato a uno o più viaggi, e lo riempi giorno per giorno con voci che contengono racconto, foto, umore e meteo. Questa schermata elenca i tuoi diari; aprine uno per scrivere.',
  'help.ctx.journey.bullet.1':
    'Il banner in alto mostra il diario in corso, o il più recente, con il numero di voci, foto e luoghi. «Continua a scrivere» lo apre sulla data di oggi. Quando un viaggio è appena terminato, sopra compare il banner «Viaggio appena terminato», che propone di trasformare quel viaggio in un diario.',
  'help.ctx.journey.bullet.2':
    'Sotto «Tutti i diari» trovi una scheda per ogni diario, con copertina, stato, date e conteggi; il diario mostrato nel banner non compare di nuovo. Clicca su una scheda per aprirlo.',
  'help.ctx.journey.bullet.3':
    "L'ultima scheda della griglia, «Crea un nuovo diario», ne avvia uno a partire dai tuoi viaggi.",
  // create-journey
  'help.guide.create-journey.title': 'Creare un diario',
  'help.guide.create-journey.goal':
    'Inizia un diario per un viaggio, con i luoghi del viaggio già aggiunti come suggerimenti.',
  'help.guide.create-journey.step.1': "Clicca «Crea un nuovo diario», l'ultima scheda della griglia.",
  'help.guide.create-journey.step.2':
    'Dagli un nome e, se vuoi, un sottotitolo, poi spunta i viaggi a cui si riferisce. Il contatore indica quanti luoghi verranno aggiunti.',
  'help.guide.create-journey.step.3': 'Clicca su «Crea diario».',
  'help.guide.create-journey.result':
    'Il diario si apre. Ogni luogo dei viaggi collegati compare nella cronologia come suggerimento, una volta per ogni giorno in cui è in programma. Per ognuno puoi scrivere una voce.',
  'help.guide.create-journey.tip.1': 'Puoi collegare altri viaggi in seguito da «Impostazioni del diario».',
  'help.guide.create-journey.tip.2': 'Funziona anche un diario senza viaggi: in quel caso aggiungi le voci a mano.',
  // open-journey
  'help.guide.open-journey.title': 'Aprire un diario',
  'help.guide.open-journey.goal': 'Apri un diario e scopri da quale punto si apre.',
  'help.guide.open-journey.step.1':
    'Clicca una scheda. Ognuna mostra la copertina, le date e quante voci, foto e luoghi contiene il diario.',
  'help.guide.open-journey.result':
    "Un diario in corso si apre sulla data di oggi, oppure sull'ultima voce precedente se per oggi non hai ancora scritto nulla. Un diario concluso si apre dall'inizio.",
  'help.guide.open-journey.tip.1':
    'La copertina è la prima foto del diario, a meno che tu non ne imposti una in «Impostazioni del diario».',
  // continue-writing
  'help.guide.continue-writing.title': 'Continuare il diario in corso',
  'help.guide.continue-writing.goal': 'Apri direttamente la pagina di oggi del diario in corso.',
  'help.guide.continue-writing.step.1':
    "Clicca «Continua a scrivere» nel banner in alto. Mostra il diario in corso o, se non ce n'è uno, il più recente.",
  'help.guide.continue-writing.result':
    "Il diario si apre su oggi oppure, se non hai ancora scritto nulla, sull'ultima voce prima di oggi.",
  'help.guide.continue-writing.tip.1':
    'Quando un viaggio è appena terminato, sopra questo banner compare «Viaggio appena terminato»: «Crea diario» avvia un diario con quel viaggio già spuntato, «Ignora» nasconde la proposta in questo browser.',

  // ── Screen: journey-detail ────────────────────────────────────────────────────────────
  'help.ctx.journey-detail.title': 'Diario',
  'help.ctx.journey-detail.summary':
    "Un diario aperto: a sinistra la cronologia, giorno per giorno, e a destra la mappa con livelli attivabili per il programma, ciò che hai registrato, le voci e le foto. L'intestazione mostra i conteggi, Studio, l'interruttore dei suggerimenti e ⋯ per «Impostazioni del diario». Usa la barra degli strumenti sotto per aggiungere voci.",
  'help.ctx.journey-detail.bullet.1':
    "L'intestazione: freccia indietro e badge dello stato, copertina, titolo e sottotitolo, il numero di giorni, luoghi, voci e foto e, a destra, Studio, l'occhio che nasconde o mostra i suggerimenti e ⋯ per «Impostazioni del diario».",
  'help.ctx.journey-detail.bullet.2':
    'La barra degli strumenti: le schede «Cronologia» e «Galleria», «Cerca in questo diario» e «Aggiungi voce». In «Galleria», «Carica» prende il posto di «Aggiungi voce».',
  'help.ctx.journey-detail.bullet.3':
    '«Cronologia»: una sezione per giorno con il numero del giorno, il conteggio dei luoghi e un + per aggiungere una voce in quel giorno. Sotto, le schede delle voci con foto, umore, meteo e racconto, e le schede tratteggiate dei suggerimenti dai viaggi, ciascuna con una × per scartarla.',
  'help.ctx.journey-detail.bullet.4':
    'La mappa: la barra dei livelli in alto attiva o disattiva «Pianificato» (segnaposto vuoti e percorsi GPX tratteggiati dei viaggi), «Registrato» (percorsi continui conservati da Dawarich), «Voci» (segnaposto nei colori dei giorni, uniti in ordine di data da una sottile linea tratteggiata) e «Foto». La (i) accanto spiega ogni simbolo.',
  'help.ctx.journey-detail.bullet.5':
    '«Impostazioni del diario» (⋯): copertina, nome e sottotitolo, stato, tracce GPX, giorni registrati, luoghi dalle foto, campi delle voci, suggerimenti scartati, viaggi sincronizzati, contributori e quali membri di un viaggio hanno accesso, condivisione pubblica, archiviazione ed eliminazione.',
  'help.ctx.journey-detail.bullet.6':
    'In fondo a una cronologia lunga trovi «Torna in alto», un contatore dei giorni per saltare a qualsiasi giorno o voce, e «Vai all’ultima voce».',
  // add-entry
  'help.guide.add-entry.title': 'Scrivere una voce',
  'help.guide.add-entry.goal': 'Aggiungi il racconto di una giornata con titolo, testo, umore e meteo.',
  'help.guide.add-entry.step.1':
    "Clicca su «Aggiungi voce» nella barra degli strumenti, oppure sul + all'estremità destra dell'intestazione di un giorno per iniziare da quel giorno.",
  'help.guide.add-entry.step.2':
    'Dai un titolo alla voce e scrivi il testo. La barra sopra il testo aggiunge grassetto, corsivo, titoli, citazioni, link ed elenchi in Markdown.',
  'help.guide.add-entry.step.3':
    'Nella colonna di destra, controlla data e ora, cerca un luogo o usa la tua posizione attuale, e scegli un umore e il meteo.',
  'help.guide.add-entry.step.4': 'Clicca «Salva».',
  'help.guide.add-entry.result':
    "La voce compare nel suo giorno nella cronologia e come segnaposto sulla mappa. I conteggi nell'intestazione si aggiornano.",
  'help.guide.add-entry.tip.1': 'Quando scrivi in un suggerimento, usi lo stesso editor, con il luogo già impostato.',
  'help.guide.add-entry.tip.2':
    "Una voce con un luogo offre l'opzione «Escludi dal percorso»: la voce resta nel diario, ma non viene conteggiata nella distanza né nei paesi e non compare sulla mappa in Studio.",
  // entry-photos
  'help.guide.entry-photos.title': 'Aggiungere foto e video a una voce',
  'help.guide.entry-photos.goal': 'Aggiungi foto a un giorno; la prima diventa la copertina della voce.',
  'help.guide.entry-photos.step.1': 'Apri il menu di una voce con ⋯ sulla sua scheda e scegli «Modifica».',
  'help.guide.entry-photos.step.2':
    'Clicca su «Carica foto» e scegli i file. «Dalla galleria» prende immagini già presenti nella galleria del diario; External photos cerca le foto di quel giorno in una libreria Immich o Synology collegata.',
  'help.guide.entry-photos.step.3':
    "Passa il mouse su un'immagine e clicca «Metti 1°» per sceglierla come copertina, poi clicca «Salva».",
  'help.guide.entry-photos.result':
    'Le foto compaiono sulla scheda e nella galleria; la prima fa da miniatura ovunque.',
  'help.guide.entry-photos.tip.1':
    'I video si aggiungono a una voce allo stesso modo: mp4, m4v, webm o mov fino a 500 MB. Vengono salvati senza modifiche.',
  'help.guide.entry-photos.tip.2':
    "I file HEIC dell'iPhone vengono convertiti in JPEG durante il caricamento, e così perdono i metadati GPS e della fotocamera.",
  // suggestions
  'help.guide.suggestions.title': 'Usare o scartare i suggerimenti',
  'help.guide.suggestions.goal': 'Trasforma in voci i luoghi dei tuoi viaggi, e scarta quelli di cui non scriverai.',
  'help.guide.suggestions.step.1':
    "Un suggerimento è una scheda con il bordo tratteggiato e un pulsante «Aggiungi voce»: un luogo di un viaggio collegato, nel giorno in cui era pianificato. Cliccalo per aprire l'editor con luogo e giorno già impostati.",
  'help.guide.suggestions.step.2':
    "Clicca sulla × all'estremità destra di una scheda che non userai. La scheda viene tolta dalla cronologia ma non eliminata, e la sincronizzazione del viaggio non la proporrà più.",
  'help.guide.suggestions.step.3':
    "Hai cambiato idea? Apri «Impostazioni del diario» con ⋯ nell'intestazione: «Recupera i suggerimenti scartati» indica quanti sono e li ripristina tutti.",
  'help.guide.suggestions.result':
    "La cronologia mostra solo le voci che vuoi scrivere. L'icona dell'occhio nell'intestazione nasconde tutti i suggerimenti in un colpo solo mentre leggi.",
  'help.guide.suggestions.tip.1': 'Un luogo pianificato in due giorni genera un suggerimento in ciascuno dei due.',
  'help.guide.suggestions.tip.2': 'I suggerimenti non contano mai nelle statistiche, contano solo le voci scritte.',
  // add-on-day
  'help.guide.add-on-day.title': 'Aggiungere una voce in un giorno precedente',
  'help.guide.add-on-day.goal': 'Scrivi di un giorno passato senza dover correggere la data dopo.',
  'help.guide.add-on-day.step.1': "Clicca sul + all'estremità destra dell'intestazione di quel giorno.",
  'help.guide.add-on-day.step.2': "L'editor si apre con quella data già impostata. Scrivi e salva come al solito.",
  'help.guide.add-on-day.result': 'La voce viene aggiunta subito al giorno giusto.',
  'help.guide.add-on-day.tip.1':
    "Per cambiare l'ordine all'interno di un giorno, passa con il mouse su una voce: a sinistra compaiono «Sposta su» e «Sposta giù».",
  // pros-cons
  'help.guide.pros-cons.title': 'Aggiungere un giudizio',
  'help.guide.pros-cons.goal': 'Riassumi una giornata con ciò che è andato bene e ciò che non è andato.',
  'help.guide.pros-cons.step.1':
    "Nell'editor trovi «Pro e contro» sotto il racconto. Scrivi un punto in «Pro» o «Contro» e usa «Aggiungine un altro» per il successivo.",
  'help.guide.pros-cons.step.2':
    'Salva. Sulla scheda, «Mostra di più» apre il racconto e il giudizio sotto forma di due brevi elenchi.',
  'help.guide.pros-cons.result': 'Pollice su e pollice giù compaiono sotto il racconto, dove li vedi subito.',
  'help.guide.pros-cons.tip.1':
    'Se in un diario non usi i giudizi, puoi disattivare la sezione in «Campi della voce» nelle «Impostazioni del diario».',
  // search-journey
  'help.guide.search-journey.title': 'Trovare qualcosa in un diario lungo',
  'help.guide.search-journey.goal': 'Trova una voce senza scorrere settimane di contenuti.',
  'help.guide.search-journey.step.1':
    'Scrivi in «Cerca in questo diario» nella barra degli strumenti. La cronologia si filtra mentre scrivi, cercando in titoli, racconti, luoghi e tag. Accenti e maiuscole non contano.',
  'help.guide.search-journey.step.2':
    'Per saltare invece a un giorno, clicca sul contatore dei giorni in fondo alla cronologia, tra «Torna in alto» e «Vai all’ultima voce».',
  'help.guide.search-journey.result':
    'La cronologia scorre fino al giorno o alla voce che hai scelto, e la mappa si sposta lì. Finché non svuoti la casella di ricerca, vengono mostrate solo le voci corrispondenti.',
  'help.guide.search-journey.tip.1':
    'Un diario in corso si apre sulla pagina di oggi, quindi di solito la pagina attuale è già visibile.',
  'help.guide.search-journey.tip.2':
    "L'occhio nell'intestazione nasconde i suggerimenti, così vedi solo le voci che hai scritto.",
  // gallery-map
  'help.guide.gallery-map.title': 'Sfogliare la galleria e la mappa',
  'help.guide.gallery-map.goal': 'Guarda tutto il diario in foto e come luoghi sulla mappa.',
  'help.guide.gallery-map.step.1':
    'Passa a «Galleria» nella barra degli strumenti. Mostra tutte le foto di tutte le voci, più le immagini caricate direttamente nella galleria. Clicca una foto per aprirla a schermo intero.',
  'help.guide.gallery-map.step.2':
    '«Carica», a destra, aggiunge immagini alla galleria. Se hai collegato Immich o Synology, un pulsante con il nome della libreria ti permette di scegliere le immagini da lì.',
  'help.guide.gallery-map.result':
    'I segnaposto hanno il colore del loro giorno e sono uniti in ordine di data da una sottile linea tratteggiata. La barra dei livelli in cima alla mappa sceglie cosa mostrare.',
  'help.guide.gallery-map.tip.1':
    'Le tracce GPX di un viaggio compaiono come linee tratteggiate nel livello «Pianificato» della mappa. «Mostra tutte le tracce GPX dei viaggi», in «Impostazioni del diario», le disattiva.',
  'help.guide.gallery-map.tip.2':
    'Le foto della galleria con una posizione compaiono anche sulla mappa pubblica, se sono condivise sia «Galleria» sia «Mappa».',
  // entry-fields
  'help.guide.entry-fields.title': 'Disattivare i campi delle voci',
  'help.guide.entry-fields.goal': "Mostra nell'editor solo i campi che questo diario usa.",
  'help.guide.entry-fields.step.1':
    "Clicca su ⋯ in alto a destra nell'intestazione per aprire «Impostazioni del diario».",
  'help.guide.entry-fields.step.2': 'Sotto «Campi della voce», disattiva «Umore», «Meteo» o «Pro e contro».',
  'help.guide.entry-fields.result':
    "L'editor non mostra più questi campi. Non perdi nulla di quello che hai scritto: quando riattivi un campo, i valori salvati ricompaiono. Un diario condiviso nasconde gli stessi campi.",
  'help.guide.entry-fields.tip.1':
    'Le opzioni valgono per il singolo diario, quindi un viaggio di lavoro e una vacanza possono essere diversi.',
  // link-trip
  'help.guide.link-trip.title': 'Collegare un altro viaggio',
  'help.guide.link-trip.goal': 'Aggiungi al diario i luoghi di un secondo viaggio come suggerimenti.',
  'help.guide.link-trip.step.1': "Clicca su ⋯ in alto a destra nell'intestazione per aprire «Impostazioni del diario».",
  'help.guide.link-trip.step.2': 'Sotto «Viaggi sincronizzati», clicca su «Aggiungi viaggio».',
  'help.guide.link-trip.step.3': 'Cerca il viaggio per nome o destinazione e clicca su «Collega» accanto.',
  'help.guide.link-trip.result':
    'I suoi luoghi compaiono nella cronologia come suggerimenti nei rispettivi giorni e vengono aggiunti al livello «Pianificato» della mappa, insieme alle sue tracce GPX.',
  'help.guide.link-trip.tip.1':
    'Il cestino accanto a un viaggio collegato lo scollega dopo una conferma; le voci che hai scritto restano.',
  'help.guide.link-trip.tip.2':
    'Le voci di un giorno vengono conteggiate una sola volta, anche se quel giorno rientra in più viaggi.',
  // share-public
  'help.guide.share-public.title': 'Condividere il diario pubblicamente',
  'help.guide.share-public.goal': 'Dai un link di sola lettura a chi non ha un account TREK.',
  'help.guide.share-public.step.1':
    "Apri «Impostazioni del diario» con ⋯ nell'intestazione e scorri fino a «Condivisione pubblica».",
  'help.guide.share-public.step.2': 'Clicca su «Crea link di condivisione».',
  'help.guide.share-public.step.3':
    'Scegli cosa vedono i visitatori: «Cronologia», «Galleria» e «Mappa». Sotto «Mappa», «Programma del viaggio» aggiunge i luoghi e i percorsi pianificati, e «Percorsi registrati» aggiunge i percorsi dei giorni che hai registrato. «Copia» copia il link negli appunti.',
  'help.guide.share-public.result':
    'Chi ha il link vede solo le sezioni attive. Anche i campi che hai disattivato in «Campi della voce» restano nascosti.',
  'help.guide.share-public.tip.1':
    'Le foto compaiono sulla mappa pubblica solo se «Galleria» e «Mappa» sono entrambe attive. Con «Mappa» disattivata, il server rimuove le coordinate prima di inviare le foto.',
  'help.guide.share-public.tip.2': 'Clicca su «Elimina link» accanto a «Copia» per interrompere la condivisione.',
  // contributors
  'help.guide.contributors.title': 'Scrivere insieme',
  'help.guide.contributors.goal': 'Permetti a un altro viaggiatore di aggiungere le sue voci e le sue foto.',
  'help.guide.contributors.step.1': "Apri «Impostazioni del diario» con ⋯ nell'intestazione e cerca «Contributori».",
  'help.guide.contributors.step.2': "Clicca «Invita contributore» e cerca l'utente per nome o e-mail.",
  'help.guide.contributors.step.3': 'Scegli «Visualizzatore» o «Editore» e clicca su «Invita».',
  'help.guide.contributors.result':
    'Il diario compare nel loro elenco e le loro voci riportano il loro nome. Per rimuovere un contributore, clicca sulla × accanto al nome.',
  'help.guide.contributors.tip.1':
    "I contributori sono per le persone che usano questo TREK. Per tutti gli altri c'è il link pubblico.",
  // studio
  'help.guide.studio.title': 'Impaginare il diario come fotolibro',
  'help.guide.studio.goal': 'Trasforma il diario in pagine da stampare.',
  'help.guide.studio.step.1': "Clicca «Studio» nell'intestazione. L'editor grafico si apre sopra il diario.",
  'help.guide.studio.step.2':
    'Per tornare indietro, clicca × all’estremità destra della barra in alto. Torni al punto in cui eri.',
  'help.guide.studio.result':
    'La barra e i suoi pannelli sono a sinistra, la doppia pagina sul piano di lavoro e le proprietà a destra. Layout automatico costruisce il libro dalle tue voci. Esporta crea un PDF pronto per la stampa.',
  'help.guide.studio.tip.1': 'Lo Studio richiede una finestra larga almeno 1024 px e non è disponibile su telefono.',
  'help.guide.studio.tip.2':
    'Il libro ha gli stessi permessi del diario: chi può leggere il diario può aprire il libro, e chi può modificare il diario può salvarlo.',
  // archive-journey
  'help.guide.archive-journey.title': 'Archiviare o eliminare un diario',
  'help.guide.archive-journey.goal': 'Chiudi un diario concluso o eliminalo definitivamente.',
  'help.guide.archive-journey.step.1':
    "Clicca su ⋯ in alto a destra nell'intestazione per aprire «Impostazioni del diario».",
  'help.guide.archive-journey.step.2':
    'In fondo, «Archivia il viaggio» lo chiude e lo segna come archiviato; «Ripristina il viaggio» lo ripristina. «Elimina» lo cancella con tutte le voci e le foto, dopo una conferma.',
  'help.guide.archive-journey.result':
    'Un diario archiviato resta leggibile e condivisibile; semplicemente non si apre più sulla data di oggi.',
  'help.guide.archive-journey.tip.1': "L'eliminazione è irreversibile e non modifica i viaggi collegati al diario.",
  'help.guide.archive-journey.tip.2': 'Copertina, nome e sottotitolo si trovano nella stessa finestra, in alto.',
  'help.guide.journey-status.title': 'Impostare lo stato di un diario',
  'help.guide.journey-status.goal':
    'Segna tu un diario come bozza, in diretta o completato, invece di seguire le date dei suoi viaggi.',
  'help.guide.journey-status.step.1':
    "Clicca su ⋯ in alto a destra nell'intestazione del diario per aprire «Impostazioni del diario».",
  'help.guide.journey-status.step.2':
    'In «Stato» scegli «Bozza», «In diretta» o «Completato». La scelta viene salvata subito.',
  'help.guide.journey-status.result':
    "Il diario mantiene lo stato che hai scelto: «Bozza» e «Completato» compaiono come badge sulla scheda e nell'intestazione, mentre un diario «In diretta» viene mostrato nel banner in cima all'elenco dei diari.",
  'help.guide.journey-status.tip.1':
    '«Automatico» torna a usare le date dei viaggi collegati. Senza un viaggio collegato, un diario automatico resta in bozza.',
  'help.guide.journey-status.tip.2':
    'Uno stato impostato a mano resta finché non lo cambi, anche se le date del viaggio cambiano.',

  // ── Screen: journey-studio ────────────────────────────────────────────────────────────
  'help.ctx.journey-studio.title': 'Studio', // same-as-en
  'help.ctx.journey-studio.summary':
    'TREK Studio impagina un diario come fotolibro da stampare. Si apre sopra il diario: la barra e i suoi pannelli a sinistra, la doppia pagina su cui lavori al centro, le sue proprietà a destra. Layout automatico crea una prima bozza dalle tue voci, un tema dà al libro colori e caratteri, e l’assistente può progettare le pagine con te. Poi puoi spostare, ritagliare e modificare lo stile di tutto, e ogni passaggio si può annullare.',
  'help.ctx.journey-studio.bullet.1':
    'Barra in alto: a sinistra la copertina e il nome del diario. A destra, chi altro è nel libro e se è salvato, il formato pagina, annulla, ripeti e incolla, Layout automatico, l’assistente, la guida, Esporta e il pulsante che chiude Studio.',
  'help.ctx.journey-studio.bullet.2':
    'Barra a sinistra: Pagine, Contenuti (le foto e le voci del diario), Layout, Elementi (testo, forme, linee, cornici, icone e adesivi), Viaggio (cifre, mappe, paesi e segni ricavati dal diario) e, separate sotto, Tema e Livelli.',
  'help.ctx.journey-studio.bullet.3':
    'Area di lavoro: la doppia pagina corrente con abbondanza e margini di sicurezza, e sotto la barra dello zoom con Adatta alla vista, Vista libro e Scarica questa doppia pagina.',
  'help.ctx.journey-studio.bullet.4':
    'Proprietà a destra: tutto sull’elemento selezionato, da posizione, dimensioni e ritaglio a colori, effetti, ordine di sovrapposizione e blocco. Quando non è selezionato nulla, mostra lo sfondo della pagina, il tema, i numeri di pagina e il documento.',
  'help.ctx.journey-studio.bullet.5':
    'Il libro è impaginato come un libro stampato: copertina, una prima pagina singola di fronte all’interno bianco della copertina, le doppie pagine, un’ultima pagina singola e la quarta di copertina. I numeri di pagina partono dalla prima pagina e vengono stampati come appaiono.',
  'help.ctx.journey-studio.bullet.6':
    'Più persone possono impaginare insieme: ognuno vede i puntatori degli altri con il loro nome. Se salvi una versione che qualcun altro ha modificato, TREK segnala un conflitto invece di sovrascrivere il suo lavoro.',
  'help.ctx.journey-studio.bullet.7':
    'Tema: un unico aspetto per tutto il libro, con carta, inchiostro e tre colori d’accento, caratteri e motivi. Gli elementi collegati al tema lo seguono quando lo cambi.',
  'help.ctx.journey-studio.bullet.8':
    'Assistente: dove un amministratore ha configurato l’IA, il fumetto nella barra in alto apre un assistente che impagina pagine, scrive didascalie e ridisegna lo stile del libro con te. Ogni sua modifica è un passaggio annullabile.',
  // studio-auto-layout
  'help.guide.studio-auto-layout.title': 'Creare il libro automaticamente',
  'help.guide.studio-auto-layout.goal':
    'Ottieni con un clic una prima bozza completa a partire dalle voci e dalle foto del diario.',
  'help.guide.studio-auto-layout.step.1': 'Clicca «Impaginazione automatica» nella barra in alto.',
  'help.guide.studio-auto-layout.step.2':
    'Scegli «Tutto il libro»: sostituisce tutte le pagine e mantiene titolo e impostazioni della pagina. «Questa pagina» ricrea solo la doppia pagina sullo schermo, ed è disponibile solo per una doppia pagina creata da una voce.',
  'help.guide.studio-auto-layout.step.3':
    "Scorri le pagine nella barra laterale. Se preferivi la versione precedente, «Annulla» ripristina l'intero layout.",
  'help.guide.studio-auto-layout.result':
    'Una doppia pagina per voce, in ordine, con foto, titolo e testo già posizionati. Ogni elemento resta collegato alla sua voce e si aggiorna con essa finché non lo modifichi.',
  'help.guide.studio-auto-layout.tip.1':
    'Entrambe le voci sono normali passaggi annullabili, quindi puoi provarle e poi annullarle.',
  'help.guide.studio-auto-layout.tip.2':
    "Quando il layout automatico collega un elemento a una voce, l'elemento si aggiorna quando modifichi quella voce. Se modifichi l'elemento in Properties, il collegamento viene rimosso.",
  // studio-pages
  'help.guide.studio-pages.title': 'Aggiungere, spostare e rimuovere doppie pagine',
  'help.guide.studio-pages.goal': 'Modifica il libro pagina per pagina.',
  'help.guide.studio-pages.step.1':
    'Apri Pagine nella barra. Le miniature mostrano il libro in ordine: copertina, prima pagina, doppie pagine, ultima pagina e quarta di copertina. La prima e l’ultima pagina sono disegnate accanto all’interno bianco della loro copertina, come si apre il libro rilegato.',
  'help.guide.studio-pages.step.2':
    "«Aggiungi pagina» in basso aggiunge una nuova doppia pagina prima dell'ultima pagina. Il + tra due miniature ne inserisce una in quella posizione.",
  'help.guide.studio-pages.step.3':
    'Passa con il mouse su una miniatura per vederne le azioni: «Sposta prima», «Sposta dopo», «Duplica pagina» ed «Elimina pagina». Clicca su una miniatura per aprire quella doppia pagina sul piano di lavoro.',
  'help.guide.studio-pages.result':
    "La copertina, la prima e l'ultima pagina e la quarta di copertina restano al loro posto. Le nuove doppie pagine vengono sempre aggiunte in mezzo.",
  'help.guide.studio-pages.tip.1':
    "Book view, nella barra in alto, mostra l'intero libro in fogli, così come verrà rilegato.",
  'help.guide.studio-pages.tip.2':
    'I numeri di pagina si attivano sotto Document in Properties, senza nulla di selezionato.',
  // studio-layouts
  'help.guide.studio-layouts.title': 'Applicare un layout a una doppia pagina',
  'help.guide.studio-layouts.goal': 'Dai a una doppia pagina una disposizione già pronta di cornici per foto e testo.',
  'help.guide.studio-layouts.step.1':
    'Apri Layout nella barra. Prima ci sono le pagine progettate: copertine e doppie pagine intere nel tema del libro, che i chip di stile restringono a un solo aspetto. Le mie disposizioni e Predefinite seguono sotto, nella stessa griglia.',
  'help.guide.studio-layouts.step.2':
    'Cliccane uno. La doppia pagina sul piano di lavoro riceve le cornici di quel layout, e le foto e i testi già presenti vengono inseriti al loro interno.',
  'help.guide.studio-layouts.result':
    'Le cornici vuote sono segnaposto per i contenuti: trascinaci una foto da Content, oppure usa Add to this page.',
  'help.guide.studio-my-layouts.title': 'Salvare una pagina come disposizione personale',
  'help.guide.studio-my-layouts.goal': 'Riutilizza una disposizione che hai creato su altre pagine del libro.',
  'help.guide.studio-my-layouts.step.1': 'Disponi una pagina come preferisci, poi apri Layout nella barra.',
  'help.guide.studio-my-layouts.step.2':
    'Clicca Salva questa pagina come disposizione sotto Le mie disposizioni. La pagina compare come scheda nell’elenco.',
  'help.guide.studio-my-layouts.tip.1':
    'Clicca la tua disposizione su un’altra pagina per impaginarla allo stesso modo, con le sue foto e le sue parole.',
  'help.guide.studio-my-layouts.result':
    'Le tue disposizioni vengono salvate con il libro e proposte sulle pagine dello stesso tipo: quella di una copertina per le copertine, quella di una doppia pagina per le doppie pagine.',
  'help.guide.studio-layouts.tip.1': 'Un layout è un passaggio annullabile come tutti gli altri.',
  // studio-content
  'help.guide.studio-content.title': 'Inserire foto e voci in una pagina',
  'help.guide.studio-content.goal': 'Aggiungi alla doppia pagina le foto e le voci del diario.',
  'help.guide.studio-content.step.1':
    'Apri «Contenuto» nella barra laterale. «Foto» elenca tutte le immagini del diario, «Voci» elenca le voci con il loro testo.',
  'help.guide.studio-content.step.2':
    'Trascina una foto sulla doppia pagina o su una cornice vuota, oppure clicca su «Aggiungi a questa pagina» sotto. «Carica foto» aggiunge immagini che non sono ancora nel diario; «Da Immich» o «Da Synology» le prende da una libreria collegata.',
  'help.guide.studio-content.step.3':
    'Sotto una voce, «Titolo», «Racconto» e «Luogo» inseriscono quel testo nella pagina come elemento di testo. Data e coordinate vengono aggiunte come segni, e lì sono elencate anche le foto della voce.',
  'help.guide.studio-content.result':
    'Una foto rilasciata diventa un elemento foto. Il testo resta collegato alla voce finché non lo modifichi.',
  'help.guide.studio-theme.title': 'Dare un tema al libro',
  'help.guide.studio-theme.goal': 'Imposta colori e caratteri di tutto il libro in un colpo solo.',
  'help.guide.studio-theme.step.1':
    'Apri Tema nella barra. Ogni scheda mostra un tema come una piccola pagina: la sua carta, il suo carattere e i suoi tre colori d’accento.',
  'help.guide.studio-theme.step.2':
    'Clicca un tema per provarlo. Sotto le schede puoi cambiarne la tavolozza, scegliere altri caratteri e scegliere motivi e decorazioni.',
  'help.guide.studio-theme.step.3':
    'Clicca Applica al libro, oppure Applica a questa pagina per la doppia pagina sullo schermo.',
  'help.guide.studio-theme.tip.1':
    'Gli elementi collegati al tema ne prendono colori e caratteri e lo seguono quando lo cambi. Ridisegna anche ciò che non è ancora collegato collega prima il resto.',
  'help.guide.studio-theme.tip.2': 'Colori dalle foto crea una tavolozza dalle immagini del diario.',
  'help.guide.studio-theme.result':
    'Tutti i colori e i caratteri collegati del libro cambiano insieme, e applicare il tema è un unico passaggio annullabile.',
  'help.guide.studio-content.tip.1': 'La casella di ricerca in cima a Content filtra entrambi gli elenchi.',
  'help.guide.studio-content.tip.2':
    'Se trascini un file dal desktop sul piano di lavoro, TREK lo carica e lo posiziona in un solo passaggio.',
  // studio-elements
  'help.guide.studio-elements.title': 'Aggiungere testo, forme, icone e adesivi',
  'help.guide.studio-elements.goal': 'Aggiungi decorazioni a una doppia pagina, oltre a foto e racconti.',
  'help.guide.studio-elements.step.1':
    'Apri Elementi nella barra. Sei schede ordinano ciò che puoi aggiungere: Testo, Forme, Linee, Cornici, Icone e Adesivi.',
  'help.guide.studio-elements.step.2':
    'Clicca su uno stile di testo o un titolo disegnato, una forma, una linea, una cornice vuota, un’icona o un adesivo. Ognuno viene posto al centro della doppia pagina e poi puoi spostarlo.',
  'help.guide.studio-elements.result':
    'Fai doppio clic su un elemento di testo per scriverci; Properties contiene carattere, spessore, dimensione, spaziatura e allineamento.',
  'help.guide.studio-stickers.title': 'Decorare con gli adesivi',
  'help.guide.studio-stickers.goal': 'Aggiungi illustrazioni, da monumenti e cibo ad animali e frecce.',
  'help.guide.studio-stickers.step.1': 'Apri Elementi nella barra e scegli Adesivi.',
  'help.guide.studio-stickers.step.2':
    'Cerca una parola o sfoglia gli scaffali, poi clicca un adesivo per metterlo sulla doppia pagina.',
  'help.guide.studio-stickers.tip.1': 'Con un adesivo selezionato, Proprietà ricolora le sue parti e lo specchia.',
  'help.guide.studio-stickers.result': 'L’adesivo è un disegno, quindi resta nitido a qualsiasi dimensione.',
  'help.guide.studio-elements.tip.1':
    "Le cornici sono spazi vuoti per le foto: potrai inserirci un'immagine in seguito.",
  // studio-travel
  'help.guide.studio-travel.title': 'Aggiungere mappe, cifre, paesi e segni',
  'help.guide.studio-travel.goal': 'Trasforma il viaggio stesso in elementi progettati sulla pagina.',
  'help.guide.studio-travel.step.1':
    'Apri Viaggio nella barra. Quattro schede ordinano ciò che puoi aggiungere: Cifre, Mappe, Paesi e Segni.',
  'help.guide.studio-travel.step.2':
    'Ogni scheda mostra l’elemento con i numeri del tuo diario, nei colori del tema: un riepilogo come poster, biglietto, cartello stradale o contachilometri, una mappa con tappe numerate o ritagliata su un paese, un paese come timbro, cartolina o spilla, una data o una distanza come timbro, etichetta o nastro.',
  'help.guide.studio-travel.step.3':
    'Clicca una scheda. L’elemento viene messo al centro della doppia pagina e poi puoi spostarlo e ridimensionarlo.',
  'help.guide.studio-travel.result':
    'L’elemento compare sulla doppia pagina. Proprietà ne cambia l’aspetto, e ogni cifra, mappa e paese si aggiorna quando il diario cambia.',
  'help.guide.studio-text-effects.title': 'Aggiungere effetti al testo',
  'help.guide.studio-text-effects.goal':
    'Dai a un titolo un contorno, un’ombra, una curva o lettere riempite con un motivo.',
  'help.guide.studio-text-effects.step.1': 'Clicca un elemento di testo sulla pagina per selezionarlo.',
  'help.guide.studio-text-effects.step.2':
    'In Proprietà apri Effetti per aggiungere un contorno, un’ombra o un’evidenziazione, oppure riempire le lettere con una sfumatura o un motivo. Maiuscole e posizione curva la riga e la adatta alla sua cornice.',
  'help.guide.studio-text-effects.tip.1':
    'Adatta alla cornice riduce il testo finché non entra nella sua cornice, così un titolo lungo non esce mai.',
  'help.guide.studio-text-effects.result': 'L’effetto è disegnato insieme al testo, in stampa come a schermo.',
  'help.guide.studio-background.title': 'Cambiare lo sfondo della pagina',
  'help.guide.studio-background.goal':
    'Colora la pagina con un colore, una sfumatura o un motivo, oppure metti una foto sotto.',
  'help.guide.studio-background.step.1':
    'Clicca su una parte vuota della pagina in modo che nulla sia selezionato. Sfondo della pagina è in cima a Proprietà.',
  'help.guide.studio-background.step.2':
    'Scegli Carta, Pieno, Sfumatura o Motivo e un colore, oppure clicca su una foto sotto Foto come sfondo.',
  'help.guide.studio-background.tip.1': 'Applica a tutte le pagine dà lo stesso sfondo a ogni pagina del libro.',
  'help.guide.studio-background.result':
    'Lo sfondo arriva fino all’abbondanza, quindi si stampa fino al bordo della pagina.',
  'help.guide.studio-layers.title': 'Ordinare, nascondere e bloccare con i livelli',
  'help.guide.studio-layers.goal':
    'Vedi tutto ciò che c’è sulla doppia pagina in ordine di sovrapposizione e lavoraci direttamente.',
  'help.guide.studio-layers.step.1': 'Apri Livelli nella barra. La parte alta dell’elenco è il davanti della pagina.',
  'help.guide.studio-layers.step.2':
    'Trascina una riga per cambiarne l’ordine, usa l’occhio per nascondere un elemento e il lucchetto per tenerlo fermo. Seleziona più elementi e raggruppali per spostarli insieme.',
  'help.guide.studio-layers.tip.1': 'Fai doppio clic su una riga per dare all’elemento un nome tutto suo.',
  'help.guide.studio-layers.tip.2': 'Gli elementi nascosti non compaiono nel PDF.',
  'help.guide.studio-layers.result':
    'Le pagine affollate restano facili da modificare, e le parti finite non si spostano per sbaglio.',
  'help.guide.studio-travel.tip.1':
    'Sotto Mappe, Tappe elenca ogni tappa del percorso. Disattivane una per escluderla da mappe e cifre, per esempio il tuo aeroporto di casa.',
  'help.guide.studio-travel.tip.2':
    'Una mappa di un paese mostra solo le tappe di quel paese, così il paese riempie la pagina anche se il viaggio è iniziato con un lungo volo.',
  // studio-properties
  'help.guide.studio-properties.title': 'Modificare ciò che hai selezionato',
  'help.guide.studio-properties.goal':
    "Sposta, ritaglia, modifica lo stile e cambia l'ordine di sovrapposizione di un elemento con l'ispettore.",
  'help.guide.studio-properties.step.1':
    'Clicca un elemento della doppia pagina. Compaiono le maniglie per dimensione e rotazione; trascinalo per spostarlo.',
  'help.guide.studio-properties.step.2':
    "«Proprietà», a destra, mostra le impostazioni dell'elemento selezionato: posizione e dimensioni, «Ritaglia» con il punto focale che decide cosa resta nella cornice, «Riempi» o «Adatta», i filtri «Stile», «Raggio angoli», «Stile cornice», ordine di sovrapposizione e «Blocca».",
  'help.guide.studio-properties.step.3':
    '«Duplica» ed «Elimina» si trovano in cima al pannello delle proprietà. «Annulla» nella barra in alto annulla qualsiasi di queste modifiche.',
  'help.guide.studio-properties.result':
    'Non puoi selezionare né spostare sulla pagina un elemento bloccato. Così proteggi un layout finito mentre lavori sugli altri elementi.',
  'help.guide.studio-properties.tip.1':
    'Con Maiusc+clic selezioni più elementi e nel pannello delle proprietà li modifichi insieme.',
  'help.guide.studio-properties.tip.2':
    'Se modifichi un elemento posizionato dal layout automatico, non è più collegato alla voce e non segue le modifiche successive a quella voce.',
  // studio-format
  'help.guide.studio-format.title': 'Scegliere il formato di pagina',
  'help.guide.studio-format.goal': 'Imposta il formato di stampa del libro prima di creare il layout.',
  'help.guide.studio-format.step.1':
    'Clicca sul formato pagina nella barra in alto, accanto agli strumenti di modifica. Mostra il nome e la forma del formato.',
  'help.guide.studio-format.step.2':
    'Scegli «Quadrato 21 × 21 cm», «Quadrato 30 × 30 cm», A4 o A5 in orizzontale o in verticale, oppure inserisci larghezza e altezza personalizzate in millimetri. Sotto trovi abbondanza e margine di sicurezza.',
  'help.guide.studio-format.result':
    'Ogni doppia pagina viene disegnata in quel formato, con 3 mm di abbondanza e 5 mm di margine di sicurezza come impostazione predefinita.',
  'help.guide.studio-format.tip.1':
    "Prima cambia il formato, poi avvia «Impaginazione automatica», che usa il formato impostato al momento dell'avvio.",
  'help.guide.studio-format.tip.2':
    'Chiedi alla tipografia i valori di abbondanza e di margine di sicurezza e inseriscili.',
  // studio-export
  'help.guide.studio-export.title': 'Esportare il libro in PDF',
  'help.guide.studio-export.goal': 'Ottieni un file pronto per la stampa o da leggere sullo schermo.',
  'help.guide.studio-export.step.1': 'Clicca «Esporta» nella barra in alto.',
  'help.guide.studio-export.step.2':
    "Scegli «Pagine singole», una pagina per foglio in ordine di lettura, come richiesto dalle tipografie, oppure «Doppie pagine», due pagine alla volta come quando si apre il libro. «Segni di taglio» aggiunge l'abbondanza su ogni lato e mostra dove tagliare.",
  'help.guide.studio-export.step.3':
    'Clicca «Anteprima di stampa». Il browser apre le pagine. Scegli «Salva come PDF» per creare il file.',
  'help.guide.studio-export.result':
    'Un PDF con il numero di fogli indicato nella finestra, nel formato di pagina impostato.',
  'help.guide.studio-export.tip.1': 'Il PDF si può creare solo da desktop, come Studio stesso.',
  'help.guide.studio-export.tip.2':
    'Per una bozza di controllo, esporta «Doppie pagine» senza segni di taglio; per la tipografia, «Pagine singole» con i segni.',
  // studio-spread-file
  'help.guide.studio-spread-file.title': 'Riutilizzare una doppia pagina in un altro libro',
  'help.guide.studio-spread-file.goal': 'Copia un design che ti piace dal libro di un diario a quello di un altro.',
  'help.guide.studio-spread-file.step.1':
    "Con la doppia pagina nell'area di lavoro, clicca «Scarica questa doppia pagina» all'estremità destra della barra dello zoom. Il file contiene il design, non le foto.",
  'help.guide.studio-spread-file.step.2':
    "Nell'altro libro, apri «Pagine» e clicca «Importa» accanto ad «Aggiungi pagina», poi scegli il file.",
  'help.guide.studio-spread-file.result':
    'La doppia pagina viene importata con le sue cornici e i suoi stili di testo. Trascina nelle cornici le foto del nuovo diario.',
  'help.guide.studio-spread-file.tip.1':
    'Se un file non è un design di doppia pagina, TREK lo rifiuta e ne indica il motivo.',

  // ── Screen: settings (all tabs) ───────────────────────────────────────────────────────
  'help.ctx.settings.title': 'Impostazioni',
  'help.ctx.settings.summary':
    'Le tue impostazioni personali, con una scheda per argomento nella barra laterale a sinistra. La maggior parte degli interruttori ha effetto appena li cambi. Un modulo con il pulsante «Salva» salva solo quando clicchi su «Salva». Niente di ciò che cambi qui modifica TREK per gli altri.',
  'help.ctx.settings.bullet.1':
    "La barra laterale a sinistra: «Visualizzazione», «Aspetto», «Mappa», «Notifiche», «Integrazioni», Offline e Account. «Plugin» compare quando c'è un plugin attivo. «Informazioni» compare, a meno che il gestore non l'abbia nascosta. La versione è indicata in fondo.",
  'help.ctx.settings.bullet.2':
    "All'apertura c'è «Visualizzazione», con lingua, lingua dei nomi dei luoghi, unità di misura, formato dell'ora, inizio della settimana e valuta di visualizzazione, più il comportamento della mappa del viaggio. «Aspetto» contiene tema, colori, leggibilità, dimensione del testo e widget della dashboard.",
  'help.ctx.settings.bullet.3':
    '«Mappa» imposta il motore della mappa e il suo stile; «Notifiche» stabilisce quali eventi arrivano su quale canale; «Integrazioni» collega le librerie di foto, AirTrail, Dawarich e wanderer, e contiene chiavi API e MCP; «Offline» stabilisce cosa salva questo dispositivo.',
  'help.ctx.settings.bullet.4':
    "In «Account» trovi profilo, password, autenticazione a due fattori, passkey e l'opzione per eliminare l'account.",
  'help.ctx.settings-display.title': 'Visualizzazione',
  'help.ctx.settings-display.summary':
    "Cosa mostra TREK all'apertura, la lingua e le unità di misura, e il comportamento della mappa del viaggio e delle prenotazioni. Ogni modifica si applica subito.",
  'help.ctx.settings-display.bullet.1':
    '«Avvio»: «Pagina iniziale» apre la Dashboard o il «Viaggio attivo»; con «Viaggio attivo», «Scheda iniziale» sceglie la scheda con cui si apre quel viaggio.',
  'help.ctx.settings-display.bullet.2':
    'Lingua e regione: «Valuta di visualizzazione» (o «Valuta del viaggio» per non convertire), «Lingua», «Nomi dei luoghi», «Unità di Temperatura», «Unità di Distanza», «Formato Ora» e «La settimana inizia il».',
  'help.ctx.settings-display.bullet.3':
    "Viaggio e mappa: «Apri i luoghi in», «Data prima nei titoli dei giorni», «Etichette percorsi prenotati», «Mostra sempre i percorsi delle prenotazioni», «Segnaposti compatti per i luoghi non pianificati», «Esplora luoghi sulla mappa», «Nascondi codici di prenotazione» e «Ottimizza il percorso dall'alloggio».",
  'help.ctx.settings-appearance.title': 'Aspetto',
  'help.ctx.settings-appearance.summary':
    "L'aspetto di TREK per questo account: chiaro o scuro, colore d'accento, effetto vetro e animazioni, dimensione del testo e widget mostrati nella dashboard. Ogni modifica si applica subito, su tutti i dispositivi da cui accedi.",
  'help.ctx.settings-appearance.bullet.1':
    "Tema: «Modalità Colore» («Chiara», «Scuro» o «Automatica»), lo schema di colori e, con «Personalizzato», un tuo colore d'accento per la modalità chiara e per quella scura, con verifica del contrasto.",
  'help.ctx.settings-appearance.bullet.2':
    'Leggibilità, contrassegnata come «Sperimentale»: Trasparenza, «Riduci animazioni», Densità e «Dimensione testo», con un cursore per «Tutto» più uno ciascuno per Grande, Media, «Normale» e Piccola.',
  'help.ctx.settings-appearance.bullet.3':
    "«Widget dashboard»: interruttori separati per desktop («Sotto l'hero», «Barra laterale destra») e mobile («Sotto l'hero», «In fondo alla pagina»).",
  'help.ctx.settings-appearance.bullet.4':
    "«Ripristina predefiniti», sotto le schede, riporta l'intera scheda ai valori predefiniti.",
  'help.ctx.settings-map.title': 'Mappa',
  'help.ctx.settings-map.summary':
    'Quale motore disegna le mappe del planner e del diario, e con quale stile. Leaflet è la classica mappa raster, Mapbox GL aggiunge edifici e rilievi in 3D con un tuo token, MapLibre GL disegna le tile vettoriali di OpenFreeMap senza bisogno di token. Atlante usa sempre Leaflet.',
  'help.ctx.settings-map.bullet.1':
    '«Provider mappa»: Leaflet, Mapbox GL («Sperimentale») o MapLibre GL, ciascuno con una breve descrizione.',
  'help.ctx.settings-map.bullet.2':
    '«Modello Mappa» e «Chiave API CARTO» per Leaflet; «Stile mappa» per i due motori GL, più il «Token di accesso Mapbox» per Mapbox GL.',
  'help.ctx.settings-map.bullet.3':
    "Solo per Mapbox GL: «Edifici 3D e terreno» e «Modalità alta qualità». Sopra «Salva Mappa» c'è un'anteprima dal vivo. «Salva Mappa» salva la tua scelta.",
  'help.ctx.settings-notifications.title': 'Notifiche',
  'help.ctx.settings-notifications.summary':
    "Come TREK ti contatta fuori dall'app. In alto, una tabella con una riga per evento e una colonna per canale stabilisce cosa viene inviato dove. Sotto ci sono le schede per il webhook, ntfy, il push su questo dispositivo ed eventuali canali dei plugin.",
  'help.ctx.settings-notifications.bullet.1':
    "«Notifiche»: attiva o disattiva ogni evento per ciascun canale. Un lucchetto indica che l'amministratore lo ha disattivato per tutti.",
  'help.ctx.settings-notifications.bullet.2':
    '«URL webhook»: un webhook Discord, Slack o personalizzato, con «Testa» e «Salva».',
  'help.ctx.settings-notifications.bullet.3':
    'Ntfy: «Argomento Ntfy», e facoltativi «URL server Ntfy» e token di accesso, con «Testa» e «Salva».',
  'help.ctx.settings-notifications.bullet.4':
    '«Notifiche push su questo dispositivo»: «Attiva su questo dispositivo» vale solo per questo browser; «Invia test» invia una notifica di prova. Un canale di un plugin mostra «Configura» finché non viene configurato.',
  'help.ctx.settings-integrations.title': 'Integrazioni',
  'help.ctx.settings-integrations.summary':
    "Tutto ciò che si collega a TREK dall'esterno: librerie di foto per il diario, AirTrail per i voli, Dawarich per i luoghi in cui sei stato davvero, wanderer per i sentieri, chiavi API di sola lettura per altri software e MCP per i client di IA. Il collegamento a un altro servizio compare solo dopo che l'amministratore lo ha attivato.",
  'help.ctx.settings-integrations.bullet.1':
    'Immich e Synology Photos, AirTrail, Dawarich e wanderer: ogni scheda ha indirizzo e chiave, «Salva» e «Prova la connessione», e un badge «Connessa» o «Non connesso».',
  'help.ctx.settings-integrations.bullet.2':
    "«Chiavi API»: chiavi di sola lettura per l'API pubblica, ciascuna limitata alle aree che scegli, con l'endpoint da copiare.",
  'help.ctx.settings-integrations.bullet.3':
    "«Configurazione MCP»: l'«Endpoint MCP» e, sotto «Client OAuth 2.1», i tuoi client registrati, la «Configurazione client» da copiare e le «Sessioni OAuth attive» con «Revoca».",
  'help.ctx.settings-integrations.bullet.4':
    '«Token API»: il vecchio modo per collegarsi a MCP, contrassegnato come «Obsoleto»; usa invece i «Client OAuth 2.1».',
  'help.ctx.settings-offline.title': 'Offline', // same-as-en
  'help.ctx.settings-offline.summary':
    'Cosa salva TREK su questo dispositivo per aprire un viaggio anche senza connessione, e cosa succede quando una modifica fatta offline è in conflitto con una fatta altrove.',
  'help.ctx.settings-offline.bullet.1':
    '«Modalità offline»: «Forza la modalità offline» scarica prima tutto, poi lavora solo dalla cache e mette in coda le tue modifiche.',
  'help.ctx.settings-offline.bullet.2':
    "«Prepara per l'offline»: «Scarica per l'uso offline» scarica dati dei viaggi, documenti e tile della mappa; «Risincronizza ora» avvia manualmente una nuova sincronizzazione.",
  'help.ctx.settings-offline.bullet.3':
    '«Cosa archiviare offline»: «Archivia i tile della mappa offline» e un interruttore per ogni viaggio. Un viaggio concluso viene salvato solo se lo attivi.',
  'help.ctx.settings-offline.bullet.4':
    '«Conflitti di sincronizzazione» compare solo quando due modifiche sono in conflitto, con «La mia», «Mantieni le loro» e «Quando si verifica un conflitto». «Cache offline» conta i viaggi e le modifiche in attesa o non riuscite, con «Riprova», «Scarta» e «Svuota la cache».',
  'help.ctx.settings-account.title': 'Account', // same-as-en
  'help.ctx.settings-account.summary':
    'Il tuo account su questo TREK e il modo in cui accedi: immagine del profilo, nome utente ed email, password, autenticazione a due fattori e passkey. «Elimina account» si trova in fondo alla scheda Account.',
  'help.ctx.settings-account.bullet.1':
    "Account: clicca sulla fotocamera sull'immagine per caricarne una e sul cestino rosso per rimuoverla. «Nome utente» ed email si salvano con «Salva Profilo».",
  'help.ctx.settings-account.bullet.2':
    '«Cambia Password»: la password attuale, poi quella nuova due volte, con i requisiti che si spuntano mentre scrivi, infine «Aggiorna password». Se su questo TREK si accede solo tramite SSO, questa scheda non compare.',
  'help.ctx.settings-account.bullet.3':
    "«Autenticazione a due fattori (2FA)» con un'app di autenticazione e codici di backup; «Passkey» per accedere senza password.",
  'help.ctx.settings-account.bullet.4':
    "«Elimina account» si trova a sinistra in fondo alla scheda Account e chiede una conferma. L'unico amministratore non può eliminare se stesso.",
  // language-region
  'help.guide.language-region.title': 'Impostare lingua, unità di misura e valuta',
  'help.guide.language-region.goal': 'Usa TREK nella tua lingua e con i formati della tua regione.',
  'help.guide.language-region.step.1':
    'Sotto Lingua e regione, scegli una «Lingua» dalla riga di chip. TREK cambia lingua subito, su tutti i dispositivi da cui accedi.',
  'help.guide.language-region.step.2':
    "«Nomi dei luoghi» imposta la lingua usata da ricerca dei luoghi, suggerimenti e indirizzi; «Come l’app» segue la lingua dell'interfaccia.",
  'help.guide.language-region.result':
    'Date, distanze e importi compaiono nel formato che ti aspetti. In «Costi» gli importi vengono mostrati nella tua valuta di visualizzazione solo a scopo indicativo: gli importi inseriti non cambiano.',
  'help.guide.language-region.tip.1': '«Valuta del viaggio» mostra ogni viaggio nella sua valuta, senza conversioni.',
  'help.guide.language-region.tip.2': 'La lingua determina anche i nomi dei giorni e dei mesi in Ferie e nel diario.',
  // travel-map-prefs
  'help.guide.travel-map-prefs.title': 'Regolare la mappa del viaggio e i titoli dei giorni',
  'help.guide.travel-map-prefs.goal':
    "Scegli cosa mostra la mappa del viaggio e l'aspetto delle intestazioni dei giorni, per tutti i viaggi.",
  'help.guide.travel-map-prefs.step.1':
    "In Viaggio e mappa, «Apri i luoghi in» stabilisce quale app di mappe apre direttamente il pulsante di navigazione; «Chiedi ogni volta» ti fa scegliere l'app ogni volta. «Data prima nei titoli dei giorni» mostra per prima la data di calendario nell'intestazione di ogni giorno.",
  'help.guide.travel-map-prefs.step.2':
    "«Mostra sempre i percorsi delle prenotazioni» disegna sulla mappa ogni volo, treno e altra prenotazione; «Etichette percorsi prenotati» aggiunge a ogni estremità il nome della stazione o dell'aeroporto. «Segnaposti compatti per i luoghi non pianificati» rimpicciolisce i luoghi non ancora assegnati a un giorno, così le tappe pianificate si vedono meglio.",
  'help.guide.travel-map-prefs.result':
    'La mappa usa queste impostazioni in tutti i viaggi, finché non le cambi di nuovo.',
  'help.guide.travel-map-prefs.tip.1':
    "Queste impostazioni valgono per l'account, non per il singolo viaggio. Ogni membro di un viaggio condiviso vede le proprie scelte.",
  'help.guide.travel-map-prefs.tip.2':
    'Un amministratore può impostare i valori predefiniti per tutti; ciò che modifichi qui vale solo per te.',
  // startup
  'help.guide.startup.title': "Scegliere cosa mostra TREK all'apertura",
  'help.guide.startup.goal': 'Apri TREK sulla pagina che usi di più, invece che ogni volta sulla dashboard.',
  'help.guide.startup.step.1':
    'In cima a «Visualizzazione», sotto «Avvio», imposta «Pagina iniziale» su Dashboard o «Viaggio attivo».',
  'help.guide.startup.step.2':
    'Con «Viaggio attivo» compare «Scheda iniziale»: scegli la scheda con cui si apre quel viaggio.',
  'help.guide.startup.result': 'La prossima volta che apri TREK, si apre direttamente quella pagina.',
  'help.guide.startup.tip.1':
    'Per «Viaggio attivo» si intende il viaggio in corso oggi o il prossimo in programma, cioè lo stesso viaggio che la dashboard mostra in alto.',
  // theme-scheme
  'help.guide.theme-scheme.title': "Impostare il tema e il colore d'accento",
  'help.guide.theme-scheme.goal':
    'Scegli per TREK un aspetto chiaro, scuro o uguale a quello del dispositivo, nel colore che preferisci.',
  'help.guide.theme-scheme.step.1':
    "Sotto Tema, imposta «Modalità Colore» su «Chiara», «Scuro» o «Automatica». «Automatica» segue l'impostazione del dispositivo.",
  'help.guide.theme-scheme.step.2':
    'Scegli uno schema di colori: predefinito, contrasto elevato, indaco, verde acqua, rosa, ambra, viola oppure «Personalizzato».',
  'help.guide.theme-scheme.step.3':
    "Con «Personalizzato», scegli uno dei pallini colorati oppure imposta un tuo colore d'accento, separatamente per «Chiara» e «Scuro». La pillola accanto indica «Buon contrasto» o «Contrasto basso».",
  'help.guide.theme-scheme.result':
    "Pulsanti, link ed evidenziazioni usano il colore d'accento ovunque, su tutti i dispositivi da cui accedi.",
  'help.guide.theme-scheme.tip.1':
    "Nella barra di navigazione c'è anche un interruttore rapido chiaro/scuro, che imposta lo stesso tema.",
  'help.guide.theme-scheme.tip.2':
    'Se lo schema predefinito è difficile da leggere, scegli lo schema «Contrasto elevato».',
  // readability
  'help.guide.readability.title': 'Regolare leggibilità e dimensione del testo',
  'help.guide.readability.goal':
    'Riduci effetti di trasparenza e animazioni, aumenta gli spazi o ingrandisci il testo.',
  'help.guide.readability.step.1':
    'Sotto Leggibilità, Trasparenza sostituisce i pannelli trasparenti con superfici piene, «Riduci animazioni» riduce al minimo le animazioni, e Densità permette di scegliere tra Comoda e Compatta.',
  'help.guide.readability.step.2':
    '«Dimensione testo»: trascina «Tutto» per ridimensionare tutto il testo in una volta, oppure imposta Grande, Media, «Normale» e Piccola una per una. Ogni dimensione mostra un esempio, così vedi il risultato mentre trascini.',
  'help.guide.readability.result':
    "La modifica si applica subito a tutta l'app, compresi i pannelli della mappa e il diario.",
  'help.guide.readability.tip.1':
    "Alcune parti di TREK riducono già le animazioni quando il dispositivo è impostato per ridurre il movimento. «Riduci animazioni» le riduce anche nel resto dell'app.",
  'help.guide.readability.tip.2':
    'La dimensione del testo si applica tramite i livelli tipografici, quindi nulla viene tagliato: se il testo non ci sta più, va a capo.',
  // dashboard-widgets
  'help.guide.dashboard-widgets.title': 'Scegliere i widget della dashboard',
  'help.guide.dashboard-widgets.goal': 'Mostra solo i widget che usi, separatamente su desktop e su telefono.',
  'help.guide.dashboard-widgets.step.1':
    "Sotto «Widget dashboard», la sezione desktop elenca i widget di «Sotto l'hero» e di «Barra laterale destra». Disattivando «Barra laterale destra» si nasconde l'intera colonna e la dashboard viene centrata; i suoi widget restano attenuati finché non la riattivi.",
  'help.guide.dashboard-widgets.step.2':
    "Per la dashboard sul telefono ci sono interruttori dedicati: «Sotto l'hero» e «In fondo alla pagina».",
  'help.guide.dashboard-widgets.result':
    'La dashboard cambia subito. Se la barra laterale destra è disattivata, la dashboard viene centrata.',
  'help.guide.dashboard-widgets.tip.1':
    "I widget di un modulo compaiono solo se l'amministratore ha attivato quel modulo.",
  'help.guide.dashboard-widgets.tip.2':
    "La dashboard ricorda su ogni dispositivo la vista a griglia o a elenco e l'ordinamento.",
  // map-provider
  'help.guide.map-provider.title': 'Scegliere il motore e lo stile della mappa',
  'help.guide.map-provider.goal': 'Passa dalla mappa classica ai tile vettoriali o alla mappa 3D di Mapbox.',
  'help.guide.map-provider.step.1':
    'Sotto «Provider mappa», scegli Leaflet per la classica mappa 2D con qualsiasi tile raster, Mapbox GL per le tile vettoriali con edifici e rilievi in 3D, oppure MapLibre GL per le tile vettoriali di OpenFreeMap senza token.',
  'help.guide.map-provider.step.2':
    'Scegli un «Modello Mappa» per Leaflet o uno «Stile mappa» per un motore GL, oppure incolla un tuo URL. Mapbox GL richiede un «Token di accesso Mapbox», i modelli CARTO una «Chiave API CARTO»; il link sotto ogni campo indica dove ottenerli.',
  'help.guide.map-provider.step.3':
    "Con Mapbox GL, attiva «Edifici 3D e terreno» e, se il tuo dispositivo è abbastanza veloce, «Modalità alta qualità». Controlla l'anteprima, poi clicca su «Salva Mappa».",
  'help.guide.map-provider.result':
    "Le mappe del planner e del diario usano il motore che hai scelto. L'Atlante usa sempre Leaflet.",
  'help.guide.map-provider.tip.1': 'Senza token, Mapbox GL usa Leaflet invece di mostrare una mappa vuota.',
  'help.guide.map-provider.tip.2':
    'I tile della mappa salvati offline provengono dal provider attivo al momento del download.',
  // notification-channels
  'help.guide.notification-channels.title': 'Scegliere dove ricevere le notifiche',
  'help.guide.notification-channels.goal':
    'Ricevi promemoria dei viaggi e aggiornamenti sulla collaborazione sul telefono o in un altro strumento.',
  'help.guide.notification-channels.step.1':
    'Per un webhook, incolla un «URL webhook» di Discord, Slack o personalizzato, clicca su «Testa» e poi su «Salva».',
  'help.guide.notification-channels.step.2':
    'Per ntfy, compila «Argomento Ntfy» e, se hai un tuo server, aggiungi «URL server Ntfy» e un token di accesso. «Testa» invia subito un messaggio; «Salva» memorizza le impostazioni.',
  'help.guide.notification-channels.step.3':
    "Nella scheda «Notifiche» in alto, attiva o disattiva ogni evento per ciascun canale. Un lucchetto indica che l'amministratore l'ha disattivato per tutti. Un canale di un plugin mostra «Configura» finché non viene configurato; «Invia test» lo prova.",
  'help.guide.notification-channels.result':
    'Gli eventi vengono inviati tramite i canali che hai attivato. La colonna In-App stabilisce cosa mostra la campanella nella barra di navigazione.',
  'help.guide.notification-channels.tip.1':
    'Il «Promemoria» di un singolo viaggio, cioè quanti giorni prima della partenza, si imposta nel modulo di modifica del viaggio.',
  'help.guide.notification-channels.tip.2':
    "L'amministratore può preimpostare un server ntfy predefinito per tutti; l'argomento lo scegli comunque tu.",
  // photo-providers
  'help.guide.photo-providers.title': 'Collegare una libreria di foto',
  'help.guide.photo-providers.goal': 'Fai caricare al diario le foto del giorno da Immich o Synology Photos.',
  'help.guide.photo-providers.step.1':
    "In «Integrazioni», cerca la scheda di Immich o Synology Photos e inserisci i dati richiesti: l'«URL del server» con una «Chiave API» per Immich, oppure «Nome utente» e password per Synology Photos. Immich può anche copiare nella sua libreria le foto del diario quando le carichi.",
  'help.guide.photo-providers.step.2': 'Clicca su «Prova la connessione», poi su «Salva». Il badge diventa «Connessa».',
  'help.guide.photo-providers.result':
    "La scheda «Foto esterne» dell'editor delle voci cerca nella libreria collegata le foto del giorno della voce, a partire da quelle più vicine al luogo della voce.",
  'help.guide.photo-providers.tip.1':
    'Il collegamento vale solo per il tuo account: gli altri membri di un diario collegano le proprie librerie.',
  'help.guide.photo-providers.tip.2':
    "Funziona anche un provider le cui foto non hanno dati GPS. In quel caso l'elenco viene ordinato per data e ora.",
  // api-keys
  'help.guide.api-keys.title': 'Creare una chiave API',
  'help.guide.api-keys.goal': "Permetti ad altri software di leggere i tuoi viaggi tramite l'API pubblica.",
  'help.guide.api-keys.step.1':
    'Sotto «Chiavi API», clicca su «Crea chiave», assegna un «Nome» che indichi dove verrà usata e, sotto «Cosa può leggere questa chiave», lascia solo le aree necessarie. Clicca su «Crea».',
  'help.guide.api-keys.step.2':
    "Copia la chiave da «Chiave API creata»: viene mostrata una sola volta. Clicca su «Fatto». L'endpoint da chiamare è indicato sotto l'elenco.",
  'help.guide.api-keys.result':
    "I software con la chiave possono leggere le aree che hai scelto, senza mai modificare nulla. L'elenco mostra quando ogni chiave è stata creata e usata l'ultima volta, e il cestino la elimina.",
  'help.guide.api-keys.tip.1':
    'Usa una chiave per ogni strumento, così puoi revocarne una senza toccare gli altri strumenti.',
  'help.guide.api-keys.tip.2':
    'Per permettere a un client di IA di modificare i dati, usa invece MCP con OAuth; le chiavi API servono solo a leggere.',
  // mcp-oauth
  'help.guide.mcp-oauth.title': 'Collegare un assistente di IA tramite MCP',
  'help.guide.mcp-oauth.goal': 'Dai accesso ai tuoi viaggi a Claude, a un IDE o a un altro client MCP.',
  'help.guide.mcp-oauth.step.1': "Sotto «Configurazione MCP», copia l'«Endpoint MCP» per il tuo client.",
  'help.guide.mcp-oauth.step.2':
    'Sotto «Client OAuth 2.1», clicca su «Nuovo client» e scegli un preset rapido come Claude Desktop o Cursor, oppure compila tu «Nome applicazione», «URI di reindirizzamento» e «Ambiti consentiti»; per un server senza browser, scegli il client macchina (Machine client). Clicca su «Registra client» e copia il «Segreto client»: viene mostrato una sola volta.',
  'help.guide.mcp-oauth.step.3':
    'Ogni client ha «Rinnova segreto» ed «Elimina client». «Sessioni OAuth attive» elenca i client connessi, con «Revoca». Espandendo «Configurazione client» trovi uno snippet già pronto per i client che usano JSON.',
  'help.guide.mcp-oauth.result':
    'Il client può leggere e modificare, a tuo nome, ciò che i suoi ambiti consentono, e ogni azione compare con il tuo nome.',
  'help.guide.mcp-oauth.tip.1':
    "Gli ambiti limitano cosa può fare un client: concedi solo l'ambito di lettura finché non serve altro.",
  'help.guide.mcp-oauth.tip.2':
    "L'amministratore può disattivare MCP per tutta l'istanza. In quel caso questa sezione non compare.",
  // offline-prepare
  'help.guide.offline-prepare.title': 'Rendere disponibili i viaggi offline',
  'help.guide.offline-prepare.goal':
    'Salva i tuoi viaggi e le relative mappe su questo dispositivo prima di restare senza connessione.',
  'help.guide.offline-prepare.step.1':
    'Sotto «Cosa archiviare offline», lascia attivo «Archivia i tile della mappa offline» e attiva i viaggi che vuoi avere su questo dispositivo. Un viaggio concluso viene salvato solo se lo attivi.',
  'help.guide.offline-prepare.step.2':
    "Torna in alto e, sotto «Prepara per l'offline», clicca su «Scarica per l'uso offline». Vengono scaricati i dati dei viaggi, i documenti e i tile della mappa, e al termine vedi quanti viaggi sono stati salvati.",
  'help.guide.offline-prepare.step.3':
    '«Forza la modalità offline» esegue un ultimo download e poi lavora solo da questo dispositivo, così puoi verificare che ci sia tutto prima di partire.',
  'help.guide.offline-prepare.result':
    'I viaggi si aprono anche senza connessione. Le modifiche che fai vengono messe in coda e inviate quando torni online.',
  'help.guide.offline-prepare.tip.1':
    'I tile della mappa occupano più spazio di tutto il resto; disattivali per conservare solo i dati dei viaggi e i documenti.',
  'help.guide.offline-prepare.tip.2': 'Per un avvio offline più fluido, installa TREK come app dal browser.',
  // offline-conflicts
  'help.guide.offline-conflicts.title': 'Scegliere quale versione tenere in un conflitto di sincronizzazione',
  'help.guide.offline-conflicts.goal':
    'Scegli come TREK risolve un conflitto tra una modifica fatta offline e una fatta altrove.',
  'help.guide.offline-conflicts.step.1':
    'Quando una modifica fatta offline è in conflitto con una più recente, in cima alla scheda Offline compare «Conflitti di sincronizzazione». Per ogni modifica, clicca su «La mia» o «Mantieni le loro».',
  'help.guide.offline-conflicts.step.2':
    'Nella stessa scheda, «Quando si verifica un conflitto» stabilisce cosa fare la prossima volta: «Chiedimi ogni volta», «Mantieni sempre la mia versione» o «Mantieni sempre la versione del server».',
  'help.guide.offline-conflicts.result':
    'Con «Chiedimi ogni volta», un conflitto resta in «Conflitti di sincronizzazione» finché non scegli. Con le altre due opzioni, TREK lo risolve automaticamente.',
  'help.guide.offline-conflicts.tip.1':
    '«Svuota la cache» elimina solo la copia su questo dispositivo. Sul server non cambia nulla.',
  // profile
  'help.guide.profile.title': 'Modificare il profilo',
  'help.guide.profile.goal': 'Aggiorna nome, email e immagine del profilo.',
  'help.guide.profile.step.1':
    "Nella scheda Account, clicca sulla fotocamera sull'immagine per caricarne una; il cestino rosso la rimuove e torna a mostrare la tua iniziale.",
  'help.guide.profile.step.2': "Modifica «Nome utente» ed email sotto l'immagine.",
  'help.guide.profile.result': 'Nome e immagine si aggiornano subito ovunque, anche nei viaggi che condividi.',
  'help.guide.profile.tip.1':
    'Un account collegato tramite SSO mostra un badge SSO e «Collegato con» seguito dal provider.',
  // password
  'help.guide.password.title': 'Cambiare la password',
  'help.guide.password.goal': 'Imposta una nuova password.',
  'help.guide.password.step.1':
    "Sotto «Cambia Password», inserisci la «Password attuale», poi la «Nuova password» e di nuovo la stessa in «Conferma nuova password». L'elenco sotto spunta ogni requisito soddisfatto mentre scrivi.",
  'help.guide.password.step.2': 'Clicca «Aggiorna password».',
  'help.guide.password.result':
    'La nuova password vale subito. Tutti gli altri dispositivi vengono disconnessi, i tuoi token API MCP vengono eliminati e i client OAuth devono accedere di nuovo; questo dispositivo resta connesso.',
  'help.guide.password.tip.1':
    'Se su questo TREK si accede solo tramite SSO, non esiste una password TREK e manca la scheda «Cambia Password».',
  // mfa
  'help.guide.mfa.title': "Attivare l'autenticazione a due fattori",
  'help.guide.mfa.goal': "Proteggi l'account con un codice generato da un'app di autenticazione.",
  'help.guide.mfa.step.1': 'Sotto «Autenticazione a due fattori (2FA)», clicca su «Configura authenticator».',
  'help.guide.mfa.step.2':
    'Scansiona il codice QR con la tua app, oppure inserisci il codice segreto a mano, poi digita il codice a sei cifre che compare e clicca su «Abilita 2FA».',
  'help.guide.mfa.step.3':
    'Salva i codici di backup con «Copia codici», «Scarica TXT» o «Stampa / PDF», poi clicca su OK. Ogni codice si può usare una sola volta. Usa un codice quando non hai il telefono con te.',
  'help.guide.mfa.result': 'A ogni accesso, dopo la password ti viene chiesto un codice.',
  'help.guide.mfa.tip.1':
    'Per «Disabilita 2FA» servono la tua password e un codice attuale oppure un codice di backup non ancora usato.',
  'help.guide.mfa.tip.2':
    "L'amministratore può rendere la 2FA obbligatoria per tutti: in quel caso non puoi disattivarla qui.",
  // passkeys
  'help.guide.passkeys.title': 'Accedere con una passkey',
  'help.guide.passkeys.goal': "Usa l'impronta, il volto o il PIN del dispositivo al posto della password.",
  'help.guide.passkeys.step.1':
    'Sotto «Passkey», clicca su «Aggiungi una passkey», conferma la password attuale e assegna un nome che indichi il dispositivo, poi segui le istruzioni del dispositivo.',
  'help.guide.passkeys.step.2':
    "Ogni passkey indica se è «Sincronizzato» o legata a «Questo dispositivo», e quando è stata usata l'ultima volta. «Rinomina» ne cambia il nome, e il pulsante di eliminazione la rimuove dopo che hai inserito la password.",
  'help.guide.passkeys.result': 'La pagina di accesso propone la passkey. Puoi comunque accedere con la password.',
  'help.guide.passkeys.tip.1':
    'Una passkey è salvata sul dispositivo o nel suo gestore di password, quindi aggiungi una passkey per ogni dispositivo.',
  'help.guide.passkeys.tip.2':
    "Le passkey compaiono solo dopo che l'amministratore le ha attivate. Finché il server non ha un dominio WebAuthn, la scheda lo segnala invece di proporre «Aggiungi una passkey».",
  // delete-account
  'help.guide.delete-account.title': 'Eliminare il tuo account',
  'help.guide.delete-account.goal': 'Elimina il tuo account e i dati che appartengono solo a te.',
  'help.guide.delete-account.step.1':
    'Nella scheda Account, clicca su «Elimina account» a sinistra in fondo alla scheda, poi su «Elimina in modo permanente».',
  'help.guide.delete-account.result':
    'Il tuo account viene eliminato, insieme ai viaggi, ai luoghi e ai file di cui sei proprietario. I viaggi di proprietà di altri vengono mantenuti.',
  'help.guide.delete-account.tip.1':
    "Se sei l'unico amministratore, TREK mostra «Eliminazione impossibile»: prima nomina amministratore un altro utente.",
  'help.guide.delete-account.tip.2':
    "L'operazione è irreversibile. Esporta quello che vuoi conservare prima di confermare.",

  // ── Screen: admin (all tabs) ──────────────────────────────────────────────────────────
  'help.ctx.admin.title': 'Amministrazione',
  'help.ctx.admin.summary':
    "Impostazioni per l'intera istanza TREK, valide per tutti gli utenti: chi può accedere e come, cosa è attivo, dove vengono salvati i file, come il server contatta le persone e come viene eseguito il backup. Questa pagina è visibile solo agli amministratori. La barra laterale raggruppa le schede sotto «Utenti», Configurazione, «Integrazioni» e Manutenzione, e ogni scheda è una schermata separata.",
  'help.ctx.admin.bullet.1':
    "L'intestazione mostra a destra il numero di utenti, viaggi, luoghi e file. Sotto compare il banner «Aggiornamento disponibile» quando esiste una versione di TREK più recente.",
  'help.ctx.admin.bullet.2':
    '«Utenti» e «Impostazioni predefinite»: account, link di invito e permessi, più le impostazioni e la mappa con cui parte un nuovo account.',
  'help.ctx.admin.bullet.3':
    '«Personalizzazione», «Impostazioni», «Moduli», «Plugin» e «Archiviazione»: modelli per la valigia, categorie e vacanze scolastiche; accesso, passkey, 2FA, chiavi API e provider di ricerca; i moduli delle funzioni; i plugin di terze parti; dove vanno i caricamenti.',
  'help.ctx.admin.bullet.4':
    '«Notifiche», «Accesso MCP» e GitHub: i canali che gli utenti possono scegliere e le loro impostazioni iniziali, i token e le sessioni dei client di IA, e la cronologia delle versioni.',
  'help.ctx.admin.bullet.5':
    'Backup e audit: backup manuali e pianificati e registro degli eventi rilevanti per la sicurezza.',
  'help.ctx.admin-users.title': 'Utenti',
  'help.ctx.admin-users.summary':
    "Tutti gli account di questo TREK, con ruolo, email e ultima attività, i link di invito che permettono di registrarsi su un'istanza chiusa, e chi può fare cosa nei viaggi.",
  'help.ctx.admin-users.bullet.1':
    "La tabella: utente, email, ruolo, data di creazione e «Ultima Attività», con «Modifica Utente» ed «Elimina utente» in ogni riga. Un pallino verde sull'avatar indica che la persona è online in questo momento; la tua riga riporta «(Tu)».",
  'help.ctx.admin-users.bullet.2':
    "«Crea Utente», in alto a destra nella scheda «Utenti», aggiunge un account manualmente, con una password che comunichi tu all'utente.",
  'help.ctx.admin-users.bullet.3':
    'Sotto, «Link di Invito»: link di registrazione con un limite di utilizzi, una scadenza e, se vuoi, un viaggio a cui il nuovo utente si unisce al momento della registrazione.',
  'help.ctx.admin-users.bullet.4':
    'In fondo, «Impostazioni dei permessi»: per ogni azione, chi può eseguirla («Tutti», «Membri del viaggio», «Proprietario del viaggio» o «Solo amministratore»). Clicca su «Salva» in cima alla scheda per salvare.',
  'help.ctx.admin-defaults.title': 'Impostazioni predefinite',
  'help.ctx.admin-defaults.summary':
    "Le impostazioni di partenza di un nuovo account, così nessuno deve configurarle da zero: modalità colore, unità di misura, formato dell'ora, inizio della settimana, valuta di visualizzazione e codici di prenotazione oscurati, più la mappa, le sue chiavi e i server per il calcolo dei percorsi.",
  'help.ctx.admin-defaults.bullet.1':
    'A sinistra, «Impostazioni predefinite utente»: «Modalità Colore», «Unità di Temperatura», «Unità di Distanza», «Formato Ora», «La settimana inizia il», «Valuta di visualizzazione» e «Nascondi codici di prenotazione».',
  'help.ctx.admin-defaults.bullet.2':
    "A destra, la mappa: «Modello Mappa», «Chiave CARTO condivisa», «Motore di percorso proprio» e «Istanza Valhalla propria», un'anteprima, poi «Motore mappe» con «Stile mappa», «Token Mapbox condiviso», «Edifici & terreno in 3D» e «Modalità alta qualità».",
  'help.ctx.admin-config.title': 'Personalizzazione',
  'help.ctx.admin-config.summary':
    "Impostazioni condivise da tutti i viaggi dell'istanza: modelli per la valigia, le categorie per luoghi e raccolte, e il catalogo delle vacanze scolastiche usato da Ferie.",
  'help.ctx.admin-config.bullet.1':
    'Modelli lista valigia: liste con nome, composte da categorie ed elementi, da cui può partire la lista valigia di un viaggio.',
  'help.ctx.admin-config.bullet.2':
    '«Categorie»: nome, icona e colore delle categorie usate in tutto TREK, dal pannello del luogo a «Raccolte», ciascuna modificabile in una finestra con anteprima.',
  'help.ctx.admin-config.bullet.3':
    '«Vacanze scolastiche»: il catalogo di paesi e regioni con i rispettivi periodi di vacanza, che tutti possono scegliere in Ferie.',
  'help.ctx.admin-settings.title': 'Impostazioni',
  'help.ctx.admin-settings.summary':
    "Come accedono le persone e quali servizi esterni può usare il server. A sinistra: Metodi di autenticazione, «Accesso con passkey», «Richiedi autenticazione a due fattori (2FA)» e Single Sign-On (OIDC). A destra: «Tipi di File Consentiti» e «Chiavi API» con i provider di ricerca e di trasporto pubblico. In fondo c'è la «Zona pericolosa».",
  'help.ctx.admin-settings.bullet.1':
    'Metodi di autenticazione: Password Login, Password Registration e, una volta configurato OIDC, SSO Login e SSO Auto-Provisioning. «Richiedi autenticazione a due fattori (2FA)» ha una scheda tutta sua.',
  'help.ctx.admin-settings.bullet.2':
    '«Accesso con passkey»: «Abilita accesso con passkey», «Relying Party ID (dominio)» e «Origini consentite». Single Sign-On (OIDC): «Nome Visualizzato», «URL Emittente», un «URL di discovery (facoltativo)», «ID client» e «Segreto client».',
  'help.ctx.admin-settings.bullet.3':
    "«Chiavi API»: per prima c'è la TREK Places API, che non richiede chiavi. Sotto ci sono la «Chiave API Google Maps» (con «Testa» e «A cosa serve la chiave»), la chiave Unsplash e quella Amap, e un unico «Salva» in fondo alla scheda.",
  'help.ctx.admin-settings.bullet.4':
    '«Provider del trasporto pubblico» e «Provider per la ricerca di luoghi» scelgono il servizio che risponde alle ricerche di trasporti e di luoghi; «Registro delle ricerche di luoghi» registra quale risultato è stato scelto; «Tipi di File Consentiti» limita i caricamenti.',
  'help.ctx.admin-addons.title': 'Moduli',
  'help.ctx.admin-addons.summary':
    "I moduli di TREK, ognuno con il suo interruttore: Bagagli, Budget, Documenti, Ferie, Atlante, Collaborazione, Diario di viaggio, Raccolte, Viaggio su strada, MCP, AirTrail, Dawarich e Analisi con IA. Se un modulo è disattivato, la voce di menu, le pagine e l'API vengono rimosse per tutti.",
  'help.ctx.admin-addons.bullet.1':
    'Una casella per ogni modulo con il suo interruttore e, se presenti, righe aggiuntive per le sue opzioni.',
  'help.ctx.admin-addons.bullet.2':
    'Anche i provider di foto e di documenti compaiono qui come caselle, così puoi offrire Immich o Synology agli utenti.',
  'help.ctx.admin-addons.bullet.3': '«Tracciamento valigia» ha un interruttore proprio sotto le caselle.',
  'help.ctx.admin-plugins.title': 'Plugin',
  'help.ctx.admin-plugins.summary':
    "Plugin di terze parti che girano in un processo separato accanto a TREK, ognuno con i permessi richiesti all'installazione. Puoi installarli dal catalogo, caricare un pacchetto o collegare una cartella mentre sviluppi un plugin.",
  'help.ctx.admin-plugins.bullet.1':
    '«Installato» e «Scopri», con «Cerca plugin…» e i filtri «Tipo», «Stato» e «Ordina». Ogni riga mostra la versione, «Verificato», «Firmato» o «Non firmato», a cosa può accedere il plugin, un interruttore e un menu ⋯.',
  'help.ctx.admin-plugins.bullet.2':
    "Le due icone nell'intestazione della scheda: «Carica plugin» accetta un file .zip, .tgz o .tar.gz (oppure trascina un .zip sulla pagina); «Riscansiona» trova una cartella di plugin collegata per lo sviluppo.",
  'help.ctx.admin-plugins.bullet.3':
    'Host consentiti per ogni plugin: gli indirizzi che un plugin può contattare, perché le connessioni in uscita sono bloccate per impostazione predefinita.',
  'help.ctx.admin-storage.title': 'Archiviazione',
  'help.ctx.admin-storage.summary':
    'Dove vengono salvati i caricamenti: sul disco locale o in un bucket S3, con eventuale copia su altri backend. Ogni categoria di caricamento può usare un backend diverso, e non cambia nulla finché non clicchi su «Salva modifiche».',
  'help.ctx.admin-storage.bullet.1':
    'In alto, «Salute»: le scritture non riuscite verso una destinazione mirror, oppure «Nessun errore di replica registrato.».',
  'help.ctx.admin-storage.bullet.2':
    "«Backend»: nome, tipo, utilizzo e destinazione della replica, con «Testa», «Modifica» e «Rimuovi». «Calcola ora» calcola lo spazio occupato; un backend definito da una variabile d'ambiente è di sola lettura.",
  'help.ctx.admin-storage.bullet.3':
    '«Categorie»: documenti di viaggio, foto del diario, copertine, immagini del profilo, immagini dei luoghi, cache delle foto e backup, ciascuna assegnata a un backend.',
  'help.ctx.admin-notifications.title': 'Notifiche',
  'help.ctx.admin-notifications.summary':
    "I canali che l'istanza offre ai suoi utenti, e quelli su cui ricevi le notifiche come amministratore. Gli utenti scelgono i propri argomenti e URL in «Impostazioni»; tu decidi quali canali esistono e configuri l'email.",
  'help.ctx.admin-notifications.bullet.1':
    "«E-mail (SMTP)», Webhook, Ntfy e Web Push hanno ciascuno un interruttore che rende disponibile il canale agli utenti; per l'email servono anche le impostazioni del server. In-App è sempre attivo.",
  'help.ctx.admin-notifications.bullet.2':
    "«Promemoria viaggio»: se il server invia o meno il promemoria prima dell'inizio di un viaggio.",
  'help.ctx.admin-notifications.bullet.3':
    "«Webhook admin», «Ntfy admin» e la scheda «Notifiche»: dove vengono inviati gli eventi di amministrazione («Nuova versione disponibile», «Errore di replica dell'archiviazione», «Regione canoa richiesta»), ciascuno con un pulsante di prova.",
  'help.ctx.admin-mcp-tokens.title': 'Accesso MCP',
  'help.ctx.admin-mcp-tokens.summary':
    'Tutti i token e le sessioni OAuth dei client IA su questa istanza di TREK, per tutti gli utenti. Puoi revocarli singolarmente.',
  'help.ctx.admin-mcp-tokens.bullet.1':
    "«Sessioni OAuth»: il client, gli ambiti concessi, il proprietario e la data, con un'icona del cestino per revocarla.",
  'help.ctx.admin-mcp-tokens.bullet.2':
    '«Token API»: nome, proprietario, «Creato» e «Ultimo utilizzo», con un cestino per eliminarlo.',
  'help.ctx.admin-github.title': 'GitHub', // same-as-en
  'help.ctx.admin-github.summary':
    "Le novità di TREK: la cronologia delle versioni da GitHub, e se è disponibile una versione più recente della tua. L'aggiornamento vero e proprio avviene fuori dall'app, sull'host.",
  'help.ctx.admin-github.bullet.1':
    "«Cronologia rilasci» elenca le versioni in ordine cronologico con le relative note. La più recente ha l'etichetta «Ultimo», le pre-release riportano Pre-release, e GitHub apre la pagina delle versioni.",
  'help.ctx.admin-github.bullet.2':
    "«Aggiornamento disponibile» compare sotto l'intestazione della pagina quando esiste una versione più recente; «Come aggiornare» mostra i comandi per Docker o la guida all'aggiornamento per le altre installazioni.",
  'help.ctx.admin-backup.title': 'Backup', // same-as-en
  'help.ctx.admin-backup.summary':
    'Backup completi del database e dei caricamenti, eseguiti a mano o secondo una pianificazione, conservati sul server e scaricabili come un unico file. Usa «Ripristina» per ripristinare un backup.',
  'help.ctx.admin-backup.bullet.1':
    "«Backup dati»: «Crea backup» e «Carica backup» in cima alla scheda, e l'elenco dei backup con «Scarica», «Ripristina» e un'icona del cestino per eliminarli.",
  'help.ctx.admin-backup.bullet.2':
    "«Carica backup» ripristina da un file creato su un'altra istanza o in un giorno precedente, dopo la stessa richiesta di conferma di «Ripristina».",
  'help.ctx.admin-backup.bullet.3':
    "Backup automatico: attivo o disattivo, «Intervallo», «Esegui all'ora» e giorno, ed «Elimina i vecchi backup dopo» (da «1 giorno» a «Conserva per sempre»), da applicare con «Salva».",
  'help.ctx.admin-audit.title': 'Audit', // same-as-en
  'help.ctx.admin-audit.summary':
    'Il registro degli eventi amministrativi e rilevanti per la sicurezza: accessi riusciti e non riusciti, modifiche alla MFA, modifiche a utenti e impostazioni, backup e ripristini. In sola lettura, dal più recente.',
  'help.ctx.admin-audit.bullet.1': 'Una riga per ogni evento, con ora, utente, azione, risorsa, IP e dettagli.',
  'help.ctx.admin-audit.bullet.2':
    "«Aggiorna», nell'intestazione della scheda, ricarica l'elenco. Il badge accanto al titolo indica quante voci sono caricate sul totale, e «Carica altro» carica le voci più vecchie.",
  // create-user
  'help.guide.create-user.title': 'Creare un utente',
  'help.guide.create-user.goal': 'Aggiungi un account a mano, senza invito.',
  'help.guide.create-user.step.1': 'Clicca su «Crea Utente» in alto a destra nella scheda «Utenti».',
  'help.guide.create-user.step.2':
    "Inserisci «Nome utente», email e una password; l'elenco sotto la password mostra quali requisiti sono soddisfatti. Scegli il «Ruolo»: «Utente» o «Amministratore».",
  'help.guide.create-user.step.3': 'Clicca «Crea Utente».',
  'help.guide.create-user.result':
    "L'account compare nella tabella e può accedere subito. Comunica la password alla persona tramite un canale affidabile.",
  'help.guide.create-user.tip.1': 'Per una persona che deve scegliersi la password, è meglio un link di invito.',
  'help.guide.create-user.tip.2':
    'Un «Amministratore» vede questa pagina e può fare tutto. Cosa può fare un «Utente» nei viaggi si stabilisce più sotto, in «Impostazioni dei permessi».',
  // edit-user
  'help.guide.edit-user.title': 'Modificare i dati o la password di un utente',
  'help.guide.edit-user.goal':
    'Rinomina qualcuno, cambiagli il ruolo o aiutalo ad accedere di nuovo dopo che ha perso la password.',
  'help.guide.edit-user.step.1':
    "Clicca sulla matita («Modifica Utente») nella riga dell'utente. La finestra mostra in alto l'email dell'account.",
  'help.guide.edit-user.step.2':
    "Modifica «Nome utente», email o «Ruolo», oppure inserisci una «Nuova Password» (lasciala vuota per mantenere quella attuale), e clicca su «Salva». «Reimposta passkey», in fondo, rimuove tutte le passkey dell'account dopo la tua conferma.",
  'help.guide.edit-user.result':
    'La modifica si applica subito. Una nuova password disconnette anche la persona da tutti i dispositivi, quindi le vecchie sessioni smettono di funzionare.',
  'help.guide.edit-user.tip.1': "Se sei l'ultimo amministratore, non puoi toglierti il ruolo di amministratore.",
  'help.guide.edit-user.tip.2':
    'Reimpostando le passkey la password resta invariata; la persona aggiunge nuove passkey in Impostazioni, Account.',
  // invite-links
  'help.guide.invite-links.title': 'Invitare qualcuno con un link',
  'help.guide.invite-links.goal':
    "Permetti a una persona di registrarsi su un'istanza chiusa e, se vuoi, aggiungila a un viaggio.",
  'help.guide.invite-links.step.1': 'Clicca su «Crea Link» in alto a destra nella scheda «Link di Invito».',
  'help.guide.invite-links.step.2':
    'Scegli «Usi Max.» (da 1× a 5×, o ∞) e «Scade tra» (da 1d a 14d, o ∞), facoltativamente un viaggio in «Aggiungi a un viaggio (opzionale)», e clicca su «Crea & Copia».',
  'help.guide.invite-links.step.3':
    "Invia il link. Ogni riga mostra quante volte è stato usato, quando scade, il viaggio a cui aggiunge e chi l'ha creato, con accanto «Attivo», «Scaduto» o «Esaurito». «Copia link» lo copia di nuovo, e il cestino lo elimina.",
  'help.guide.invite-links.result':
    'Chi apre il link si registra con una propria password. Se è stato scelto un viaggio, entra subito a farne parte.',
  'help.guide.invite-links.tip.1':
    'I link di invito funzionano anche quando Password Registration è disattivato in «Impostazioni».',
  'help.guide.invite-links.tip.2':
    "Per una singola persona, l'impostazione più sicura è un link con un solo utilizzo e una scadenza breve.",
  // delete-user
  'help.guide.delete-user.title': 'Eliminare un utente',
  'help.guide.delete-user.goal': 'Rimuovi un account e tutto ciò che gli appartiene.',
  'help.guide.delete-user.step.1':
    "Clicca sul cestino («Elimina utente») nella riga dell'utente e conferma con «Elimina».",
  'help.guide.delete-user.result':
    "L'account viene eliminato, insieme a tutti i viaggi e i diari di cui è proprietario, anche quelli condivisi con altri. I viaggi di cui era solo membro restano ai rispettivi proprietari.",
  'help.guide.delete-user.tip.1': "L'operazione è irreversibile. Se hai dubbi, fai prima un backup.",
  'help.guide.delete-user.tip.2':
    "L'icona del cestino sulla tua riga non funziona: non puoi eliminare te stesso. Deve farlo un altro amministratore.",
  // permissions
  'help.guide.permissions.title': 'Stabilire chi può fare cosa',
  'help.guide.permissions.goal': 'Stabilisci, per ogni azione, quale ruolo può eseguirla su questa istanza di TREK.',
  'help.guide.permissions.step.1':
    "Sotto «Impostazioni dei permessi», cerca l'azione nel suo gruppo, ad esempio «Elimina viaggi» sotto «Gestione viaggi», e scegli chi può eseguirla: «Tutti», «Membri del viaggio», «Proprietario del viaggio» o «Solo amministratore». Una riga modificata viene contrassegnata come «personalizzato».",
  'help.guide.permissions.step.2':
    'Clicca su «Salva» in alto a destra nella scheda. «Ripristina predefiniti» riporta ogni riga al livello di base; anche in questo caso, clicca poi su «Salva».',
  'help.guide.permissions.result':
    'La regola si applica a tutti i viaggi insieme. Chi ha un livello inferiore non vede più i pulsanti e i menu corrispondenti.',
  'help.guide.permissions.tip.1':
    '«Proprietario del viaggio» è la persona che ha creato il viaggio; gli amministratori possono sempre fare tutto.',
  'help.guide.permissions.tip.2':
    "Ogni azione ha una riga propria: puoi ad esempio permettere ai membri di pianificare luoghi e giorni, ma lasciare l'eliminazione del viaggio solo al proprietario.",
  // default-map
  'help.guide.default-map.title': 'Impostare la mappa predefinita per i nuovi utenti',
  'help.guide.default-map.goal': 'Dai a ogni nuovo account una mappa funzionante senza bisogno di un token personale.',
  'help.guide.default-map.step.1':
    "Sotto «Mappa», scegli un «Modello Mappa» o incolla l'URL dei tile, e inserisci una «Chiave CARTO condivisa» se usi i tile CARTO. L'anteprima sotto mostra il risultato.",
  'help.guide.default-map.step.2':
    'Più in basso, scegli il «Motore mappe»: «Standard (gratuito)», Mapbox (3D) o MapLibre (OpenFreeMap). Per Mapbox e MapLibre scegli lo «Stile mappa»; per Mapbox aggiungi il «Token Mapbox condiviso» e scegli se attivare «Edifici & terreno in 3D» e «Modalità alta qualità».',
  'help.guide.default-map.result':
    'I nuovi account partono con queste impostazioni; chi ha già scelto una mappa in Impostazioni mantiene la propria.',
  'help.guide.default-map.tip.1':
    "Un token o una chiave inseriti qui vengono condivisi da tutti quelli che non ne hanno uno proprio, quindi tieni d'occhio la quota.",
  'help.guide.default-map.tip.2':
    'Usano queste impostazioni predefinite anche gli account esistenti che non hanno mai modificato nulla nella scheda della mappa.',
  // packing-templates
  'help.guide.packing-templates.title': 'Creare un modello di lista valigia',
  'help.guide.packing-templates.goal': 'Offri ai viaggi una lista valigia da cui partire invece di una lista vuota.',
  'help.guide.packing-templates.step.1': 'Clicca su «Nuovo modello», scrivi un nome e conferma con la spunta.',
  'help.guide.packing-templates.step.2':
    'Clicca sul nome del modello per aprirlo, poi su «Aggiungi categoria». Il + in cima a una categoria aggiunge elementi, e per un elemento basta un nome.',
  'help.guide.packing-templates.step.3':
    'Tutto viene salvato man mano. La matita rinomina un modello, una categoria o un elemento. Il cestino elimina subito un elemento; per un modello o una categoria chiede prima conferma, perché viene eliminato anche tutto il loro contenuto.',
  'help.guide.packing-templates.result':
    'Il modello è disponibile nella lista valigia di ogni viaggio; applicandolo, gli elementi vengono copiati, quindi ogni viaggio può modificarli liberamente.',
  'help.guide.packing-templates.tip.1':
    "Un modello per ogni tipo di viaggio (mare, città, trekking) funziona meglio di un'unica lista lunghissima.",
  'help.guide.packing-templates.tip.2': 'Eliminare un modello non modifica i viaggi in cui è già stato applicato.',
  'help.guide.packing-templates.tip.3':
    "«Salva come modello» nella lista valigia di un viaggio crea un modello con peso, quantità e borsa di ogni elemento. Qui compaiono accanto all'elemento e, quando applichi il modello, gli elementi finiscono nelle stesse borse.",
  // categories
  'help.guide.categories.title': 'Gestire le categorie',
  'help.guide.categories.goal': 'Stabilisci quali categorie possono avere luoghi e raccolte, e il loro aspetto.',
  'help.guide.categories.step.1':
    "Clicca su «Nuova categoria», scrivi il nome nella riga del titolo della finestra, scegli «Icona» e «Colore» e controlla l'«Anteprima». Clicca su «Crea».",
  'help.guide.categories.step.2':
    "Nell'elenco, la matita («Modifica») apre una categoria e «Aggiorna» la salva. Il cestino («Elimina») la rimuove dopo la tua conferma.",
  'help.guide.categories.result':
    'Le categorie valgono ovunque insieme: nel pannello dei luoghi, nei segnaposto della mappa, nelle Raccolte e nei filtri.',
  'help.guide.categories.tip.1':
    "I luoghi conservano l'identificativo della categoria, quindi rinominare una categoria la rinomina su tutti i luoghi.",
  'help.guide.categories.tip.2':
    "Se elimini una categoria, i suoi luoghi restano senza categoria. Se è importante, assegnali prima a un'altra categoria.",
  // school-holiday-catalog
  'help.guide.school-holiday-catalog.title': 'Gestire a mano le vacanze scolastiche',
  'help.guide.school-holiday-catalog.goal':
    'Gestisci le vacanze scolastiche di un paese o di una regione, che tutti possono scegliere in Ferie.',
  'help.guide.school-holiday-catalog.step.1':
    'Sotto «Vacanze scolastiche», scegli il «Paese», oppure clicca su + («Aggiungi paese»), inserisci il «Paese» e il suo «Codice paese (es. US)» e salva. «Aggiungi regione» aggiunge ogni zona che ha date proprie.',
  'help.guide.school-holiday-catalog.step.2':
    'Clicca su una regione per aprire «Regione o distretto scolastico»: clicca su «Aggiungi periodo», assegna a ogni periodo un «Nome delle vacanze», una «Data di inizio» e una «Data fine», e salva. Il cestino rimuove un periodo o una regione; un paese si può eliminare quando non ha più regioni.',
  'help.guide.school-holiday-catalog.result':
    "Gli utenti scelgono paese e regione nelle Impostazioni di Ferie e vedono i periodi nella griglia dell'anno.",
  'help.guide.school-holiday-catalog.tip.1':
    'Non si può eliminare una regione che qualcuno ha già scelto nel proprio calendario di Ferie.',
  // auth-methods
  'help.guide.auth-methods.title': 'Stabilire come accedono gli utenti',
  'help.guide.auth-methods.goal':
    "Attiva o disattiva l'accesso con password, l'SSO e la registrazione, e rendi obbligatoria la 2FA.",
  'help.guide.auth-methods.step.1':
    'Sotto Metodi di autenticazione, attiva o disattiva Password Login e Password Registration; ogni interruttore ha effetto subito. Con la registrazione disattivata, i nuovi account arrivano solo da link di invito, SSO o «Crea Utente».',
  'help.guide.auth-methods.step.2':
    '«Accesso SSO» e «Provisioning automatico SSO» richiedono che il Single Sign-On (OIDC) sia configurato più in basso; il provisioning automatico crea un account la prima volta che qualcuno accede tramite SSO.',
  'help.guide.auth-methods.step.3':
    'Attiva «Richiedi autenticazione a due fattori (2FA)» per obbligare chi non ha la 2FA a configurarla in «Impostazioni» prima di poter usare TREK.',
  'help.guide.auth-methods.result': 'La pagina di accesso offre esattamente i metodi che hai lasciato attivi.',
  'help.guide.auth-methods.tip.1':
    "TREK non ti permette di disattivare l'ultimo metodo di accesso: il suo interruttore diventa grigio e il suggerimento indica «At least one login method must remain enabled».",
  'help.guide.auth-methods.tip.2':
    'Se sul server è impostato OIDC_ONLY, gli interruttori della password sono bloccati e una nota lo segnala.',
  // oidc
  'help.guide.oidc.title': 'Collegare il single sign-on',
  'help.guide.oidc.goal': 'Permetti alle persone di accedere con il tuo identity provider.',
  'help.guide.oidc.step.1':
    "Sotto Single Sign-On (OIDC), inserisci il «Nome Visualizzato» del pulsante, l'«URL Emittente», l'«ID client» e il «Segreto client» forniti dal tuo provider. Compila «URL di discovery (facoltativo)» solo se il provider non lo pubblica all'indirizzo standard, come nel caso di Authentik. Clicca su «Salva».",
  'help.guide.oidc.step.2': 'Attiva «Accesso SSO» in «Metodi di autenticazione».',
  'help.guide.oidc.result':
    'La pagina di accesso mostra il pulsante SSO; con «Provisioning automatico SSO» attivo, chi accede per la prima volta riceve automaticamente un account.',
  'help.guide.oidc.tip.1':
    "L'URI di reindirizzamento richiesto dal provider è l'indirizzo della tua istanza TREK seguito dal percorso di callback OIDC indicato nella documentazione.",
  'help.guide.oidc.tip.2':
    'La mappatura dei claim stabilisce quali gruppi SSO diventano amministratori; consulta la pagina OIDC nella documentazione.',
  // instance-keys
  'help.guide.instance-keys.title': 'Inserire le chiavi API',
  'help.guide.instance-keys.goal':
    "Aggiungi per tutta l'istanza le foto e le valutazioni di Google, le copertine di Unsplash e la ricerca Amap.",
  'help.guide.instance-keys.step.1':
    'Sotto «Chiavi API», la TREK Places API in cima gestisce già la ricerca dei luoghi senza chiave. «Che cosa contiene» spiega cosa copre e cosa no.',
  'help.guide.instance-keys.step.2':
    'Per foto, valutazioni e orari di apertura, incolla una «Chiave API Google Maps» e clicca su «Testa»; il risultato è «Connessa» o «Non valida». Apri «A cosa serve la chiave» e attiva solo ciò che vuoi ti venga fatturato: «Foto dei luoghi», «Completamento automatico dei luoghi», «Dettagli del luogo», «Arricchimento luoghi» e «Cerca solo con Google», più un «Limite giornaliero di chiamate a Google».',
  'help.guide.instance-keys.step.3':
    'Incolla la «Chiave API Unsplash» per la ricerca delle copertine e la «Chiave API Amap (高德地图)» per la ricerca dei luoghi nella Cina continentale, poi clicca su «Salva» in fondo alla scheda.',
  'help.guide.instance-keys.result':
    'Gli utenti possono usare le funzioni senza chiavi proprie. Senza una chiave Google, la ricerca usa la TREK Places API e OpenStreetMap.',
  'help.guide.instance-keys.tip.1':
    "Se un utente ha una chiave personale in «Impostazioni», per lui TREK usa quella invece della chiave dell'istanza.",
  'help.guide.instance-keys.tip.2':
    "Le chiavi possono arrivare anche da variabili d'ambiente; in quel caso qui compaiono in sola lettura.",
  'help.guide.instance-keys.tip.3':
    '«Limite giornaliero di chiamate a Google» stabilisce quanto TREK può spendere al giorno con la chiave; il badge accanto al titolo conta le chiamate di oggi. Una volta raggiunto il limite, le ricerche usano OpenStreetMap fino al giorno successivo (UTC).',
  // places-transit
  'help.guide.places-transit.title': 'Scegliere i provider di ricerca e dei mezzi pubblici',
  'help.guide.places-transit.goal':
    'Scegli quale servizio risponde alle ricerche di luoghi e alle richieste di percorsi con i mezzi pubblici.',
  'help.guide.places-transit.step.1':
    'Sotto «Provider del trasporto pubblico», scegli «Transitous (gratuito)», che non richiede chiavi e funziona meglio in Europa, oppure Google, che usa la chiave Google. La scelta si salva subito.',
  'help.guide.places-transit.step.2':
    "Sotto «Provider per la ricerca di luoghi», scegli quale servizio interroga TREK quando l'indice TREK e OpenStreetMap non trovano nulla: «Automatico» (Google se c'è una chiave, poi Amap), Google Places, Amap (高德地图) o OpenStreetMap.",
  'help.guide.places-transit.result':
    'Tutti i campi di ricerca e tutti i percorsi con i mezzi pubblici di TREK usano questa scelta.',
  'help.guide.places-transit.tip.1':
    "Un'opzione senza la relativa chiave mostra qui un avviso. In quel caso la ricerca dei luoghi usa solo l'indice TREK e OpenStreetMap, e il trasporto pubblico solo Transitous.",
  'help.guide.places-transit.tip.2':
    'I percorsi con i mezzi pubblici di Google vengono fatturati a richiesta; Transitous no.',
  // file-types
  'help.guide.file-types.title': 'Limitare i tipi di file',
  'help.guide.file-types.goal': 'Decidi quali estensioni di file sono consentite per i caricamenti.',
  'help.guide.file-types.step.1':
    "Sotto «Tipi di File Consentiti», modifica l'elenco di estensioni separate da virgole, oppure inserisci * per consentire tutti i tipi, e clicca su «Salva».",
  'help.guide.file-types.result':
    'I caricamenti di qualsiasi altro tipo vengono rifiutati con un messaggio chiaro, nei documenti, nel diario e nelle copertine.',
  'help.guide.file-types.tip.1':
    "Lascia i formati immagine nell'elenco: anche copertine e foto del diario vengono controllate con lo stesso elenco.",
  // toggle-addon
  'help.guide.toggle-addon.title': 'Attivare o disattivare un modulo',
  'help.guide.toggle-addon.goal': 'Rendi disponibile un modulo a tutti oppure rimuovilo.',
  'help.guide.toggle-addon.step.1':
    "Clicca sull'interruttore nella casella del modulo. La voce di navigazione compare o scompare subito per tutti.",
  'help.guide.toggle-addon.step.2':
    'Alcune caselle hanno righe aggiuntive per le opzioni, come «Tracciamento valigia» sotto «Liste» o i provider di foto sotto «Diario di viaggio»; compaiono solo quando il modulo è attivo.',
  'help.guide.toggle-addon.result':
    'Quando disattivi un modulo, i suoi dati vengono conservati. Quando lo riattivi, i dati ricompaiono.',
  'help.guide.toggle-addon.tip.1':
    "Se disattivi MCP, vengono rimossi l'endpoint e le sezioni «Integrazioni» che ne dipendono.",
  'help.guide.toggle-addon.tip.2':
    'Ferie, Atlante e Diario di viaggio sono i moduli più richiesti dagli utenti; Documenti richiede spazio di archiviazione per i caricamenti.',
  // install-plugin
  'help.guide.install-plugin.title': 'Installare un plugin',
  'help.guide.install-plugin.goal':
    'Aggiungi un plugin di terze parti e concedigli esattamente i permessi che richiede.',
  'help.guide.install-plugin.step.1':
    "Apri «Scopri», trova un plugin con «Cerca plugin…» o con il filtro «Tipo», e clicca su «Installa». Per un file di pacchetto, clicca su «Carica plugin» (l'icona della nuvola in alto a destra nella scheda), oppure trascina il file .zip sulla pagina.",
  'help.guide.install-plugin.step.2':
    'Sotto «Installato», leggi la riga: a cosa può accedere il plugin, a quali host si connette e se è «Verificato» e «Firmato». Poi attiva «Abilita plugin»; la riga mostra «Attivo».',
  'help.guide.install-plugin.step.3':
    'Il menu ⋯ della riga offre «Riavvia», «Visualizza log errori», «Host consentiti» e «Cambia versione…», più i link al codice sorgente; «Elimina» disinstalla il plugin e i suoi dati. Una versione più recente compare come aggiornamento nella riga, e se richiede nuovi permessi resta disattivata finché non li approvi.',
  'help.guide.install-plugin.result':
    'Il plugin gira in un processo separato. Ciò che aggiunge, come widget, livelli della mappa o strumenti, compare dove il plugin lo prevede.',
  'help.guide.install-plugin.tip.1':
    '«Riscansiona» trova una cartella di plugin collegata per lo sviluppo, senza pacchetto.',
  'help.guide.install-plugin.tip.2':
    'Un plugin non firmato è contrassegnato come tale; installalo solo se ti fidi della sua provenienza.',
  // storage-backends
  'help.guide.storage-backends.title': 'Spostare i caricamenti su S3 o duplicarli',
  'help.guide.storage-backends.goal':
    'Salva i file su un object storage, oppure copia ogni caricamento su un secondo backend.',
  'help.guide.storage-backends.step.1':
    'Sotto «Backend», clicca su «Aggiungi backend», assegna un «Nome», scegli il «Tipo», «Locale» o S3, e compila i campi. Per conservare una copia altrove, spunta le «Destinazioni mirror». Clicca su «Applica», poi su «Testa» nella nuova riga per verificare la connessione.',
  'help.guide.storage-backends.step.2':
    'Sotto «Categorie», assegna a un backend ogni tipo di caricamento, ad esempio «Documenti di viaggio», «Foto del diario di viaggio» o «Backup».',
  'help.guide.storage-backends.step.3':
    'Clicca su «Salva modifiche» in fondo. Se una categoria ora punta a un altro backend, TREK chiede se vuoi «Sposta oggetti esistenti» o «Instrada solo le nuove scritture».',
  'help.guide.storage-backends.result':
    "I nuovi caricamenti vanno al backend assegnato. I file spostati vengono serviti da lì, e quelli che hai scelto di non spostare restano dov'erano.",
  'help.guide.storage-backends.tip.1':
    "Un backend configurato tramite variabili d'ambiente viene mostrato, ma non può essere modificato qui.",
  'help.guide.storage-backends.tip.2':
    'Una destinazione mirror riceve una copia di ogni nuova scrittura; «Sincronizza ora» nella riga copia ciò che era già archiviato. Una destinazione lenta rallenta tutti i caricamenti su quel backend.',
  // channels-instance
  'help.guide.channels-instance.title': 'Configurare i canali di notifica',
  'help.guide.channels-instance.goal': "Stabilisci quali canali possono scegliere gli utenti e configura l'e-mail.",
  'help.guide.channels-instance.step.1':
    "Attiva «E-mail (SMTP)» nell'intestazione della sua scheda, inserisci SMTP Host, SMTP Port, SMTP User, SMTP Password e From Address, e clicca su «Salva». «Invia email di prova» ti manda un'email. «Salta il controllo del certificato TLS» serve solo per un server di posta locale con un certificato proprio.",
  'help.guide.channels-instance.step.2':
    'Attiva Webhook, Ntfy e Web Push per renderli disponibili. Gli utenti inseriscono poi il proprio URL o argomento, oppure attivano il push sul singolo dispositivo, in «Impostazioni», «Notifiche».',
  'help.guide.channels-instance.step.3':
    "«Promemoria viaggio» attiva o disattiva il promemoria prima dell'inizio di un viaggio; In-App è sempre attivo.",
  'help.guide.channels-instance.result': 'La scheda «Notifiche» di ogni utente mostra i canali che hai attivato.',
  'help.guide.channels-instance.tip.1':
    "L'«URL server Ntfy» nella scheda «Ntfy admin» è anche il server predefinito per gli utenti, che possono comunque impostarne uno proprio.",
  'help.guide.channels-instance.tip.2':
    'I canali dei plugin compaiono automaticamente quando è attivo un plugin che li offre.',
  // admin-channels
  'help.guide.admin-channels.title': 'Ricevere gli eventi di amministrazione sul telefono',
  'help.guide.admin-channels.goal':
    'Ricevi notifiche sulle nuove versioni, sui mirror di archiviazione con errori e sulle richieste di regioni per la canoa.',
  'help.guide.admin-channels.step.1':
    "Sotto «Ntfy admin», inserisci l'«Argomento admin» e, se necessario, l'«URL server Ntfy» e un «Token di accesso (opzionale)»; sotto «Webhook admin», un URL. Clicca su «Salva» in ogni scheda.",
  'help.guide.admin-channels.step.2':
    'Clicca su «Invia Ntfy di test» o «Invia webhook di test» per verificare che arrivi un messaggio.',
  'help.guide.admin-channels.result':
    "Gli eventi di amministrazione arrivano a tutti gli amministratori nell'app e, se li hai attivati, anche all'argomento ntfy e al webhook degli amministratori.",
  'help.guide.admin-channels.tip.1':
    'Tieni il topic di amministrazione separato da quello personale, così i messaggi sui disservizi non si perdono tra quelli dei viaggi.',
  'help.guide.admin-channels.tip.2':
    "Il webhook e l'argomento degli amministratori sono separati dai tuoi canali personali in «Impostazioni», «Notifiche».",
  // mcp-tokens-admin
  'help.guide.mcp-tokens-admin.title': "Revocare l'accesso dei client IA",
  'help.guide.mcp-tokens-admin.goal':
    'Visualizza e revoca tutti i token e le sessioni dei client IA, per qualsiasi utente.',
  'help.guide.mcp-tokens-admin.step.1':
    'Sotto «Sessioni OAuth», trova il client per nome e proprietario; i chip mostrano gli ambiti concessi. Il cestino revoca la sessione dopo la tua conferma.',
  'help.guide.mcp-tokens-admin.step.2':
    'Sotto «Token API», lo stesso per i token: nome, proprietario, «Creato» e «Ultimo utilizzo». Il cestino elimina il token, e il client smette subito di funzionare.',
  'help.guide.mcp-tokens-admin.result': "L'utente del client deve collegarlo di nuovo. Nient'altro cambia.",
  'help.guide.mcp-tokens-admin.tip.1':
    'Gli ambiti indicano cosa può fare un client; un ambito di sola lettura si può mantenere senza rischi.',
  'help.guide.mcp-tokens-admin.tip.2':
    'Disattivando il modulo MCP si fermano subito tutti i client e questa scheda scompare, ma non viene eliminato nulla: i token tornano a funzionare quando lo riattivi.',
  // release-history
  'help.guide.release-history.title': "Controllare se c'è una nuova versione",
  'help.guide.release-history.goal': 'Scopri se il tuo TREK è aggiornato e cosa porta la prossima versione.',
  'help.guide.release-history.step.1':
    "Quando esiste una versione più recente, sotto l'intestazione della pagina compare «Aggiornamento disponibile» con la versione che stai usando. «Vedi su GitHub» apre la versione, e «Come aggiornare» mostra i comandi per Docker o la guida all'aggiornamento per le altre installazioni.",
  'help.guide.release-history.step.2':
    "«Cronologia rilasci» elenca tutte le versioni con le relative note. «Mostra dettagli» le espande, la versione più recente ha l'etichetta «Ultimo» e «Carica altro» mostra le versioni precedenti.",
  'help.guide.release-history.result':
    "L'aggiornamento si fa sull'host, scaricando la nuova immagine o compilando il nuovo tag; la cartella dei dati viene mantenuta.",
  'help.guide.release-history.tip.1': 'Prima di un aggiornamento fai un backup. La scheda «Backup» è accanto a questa.',
  'help.guide.release-history.tip.2':
    'Le versioni preliminari vengono mostrate ma non segnalate come aggiornamenti, a meno che tu non stia usando una versione preliminare.',
  // create-backup
  'help.guide.create-backup.title': 'Creare e ripristinare un backup',
  'help.guide.create-backup.goal':
    "Esegui il backup dell'intera istanza, conservane una copia altrove e potrai ripristinarla.",
  'help.guide.create-backup.step.1':
    'Sotto «Backup dati», clicca su «Crea backup» in alto a destra. Il database e i caricamenti vengono salvati in un unico file sul server.',
  'help.guide.create-backup.step.2':
    '«Scarica» conserva una copia fuori dal server; il cestino elimina i backup vecchi dopo la tua conferma.',
  'help.guide.create-backup.step.3':
    '«Ripristina» su un backup, oppure «Carica backup» con un file, sostituisce tutti i dati attuali quando clicchi su «Sì, ripristina» in «Ripristinare il backup?».',
  'help.guide.create-backup.result':
    "Un ripristino riporta utenti, viaggi, file e impostazioni esattamente com'erano al momento del backup.",
  'help.guide.create-backup.tip.1':
    "Il ripristino è l'unica azione qui che non si può annullare. Prima crea un backup aggiornato.",
  'help.guide.create-backup.tip.2':
    'I backup vengono salvati nella cartella dei dati. Copiali su un altro computer, così restano al sicuro anche se questo si guasta.',
  // auto-backup
  'help.guide.auto-backup.title': 'Pianificare i backup',
  'help.guide.auto-backup.goal': 'Fai eseguire al server i backup in automatico e fagli eliminare quelli vecchi.',
  'help.guide.auto-backup.step.1':
    "Sotto Backup automatico, attiva «Abilita auto-backup» e scegli l'«Intervallo» («Ogni ora», «Giornaliero», «Settimanale» o «Mensile»), «Esegui all'ora» e, per i backup settimanali o mensili, il «Giorno della settimana» o il «Giorno del mese».",
  'help.guide.auto-backup.step.2':
    'Sotto «Elimina i vecchi backup dopo», scegli per quanto tempo conservare un backup, da «1 giorno» a «Conserva per sempre», e clicca su «Salva».',
  'help.guide.auto-backup.result':
    "I backup compaiono nell'elenco secondo la pianificazione. Quelli più vecchi del periodo scelto vengono eliminati.",
  'help.guide.auto-backup.tip.1':
    "«Esegui all'ora» usa l'ora del server; l'indicazione sotto mostra il fuso orario del server.",
  'help.guide.auto-backup.tip.2':
    'Lo spazio sul server è limitato: di solito bastano 7 o 14 giorni, con una copia scaricata conservata altrove.',
  // audit-log
  'help.guide.audit-log.title': 'Leggere il registro di audit',
  'help.guide.audit-log.goal': 'Scopri chi ha fatto cosa e quando.',
  'help.guide.audit-log.step.1':
    'Leggi le righe, dalla più recente: «Ora», «Utente», «Azione», «Risorsa», IP e «Dettagli». Le azioni prendono il nome da ciò che è successo, come un accesso non riuscito, una modifica della MFA o un ripristino.',
  'help.guide.audit-log.step.2':
    "«Aggiorna», in alto a destra, ricarica l'elenco. Il badge accanto al titolo indica quante voci sono caricate sul totale, e «Carica altro» carica le voci più vecchie.",
  'help.guide.audit-log.result': 'Hai una traccia da mostrare a chiunque chieda perché qualcosa è cambiato.',
  'help.guide.audit-log.tip.1': 'Gli orari sono mostrati nel fuso orario del server.',
  'help.guide.audit-log.tip.2': "Il registro accetta solo aggiunte: niente qui si può modificare o eliminare dall'app.",
  // document-providers
  'help.guide.document-providers.title': 'Offrire un archivio di documenti',
  'help.guide.document-providers.goal': 'Stabilisci con quali archivi un viaggio può sincronizzare i suoi documenti.',
  'help.guide.document-providers.step.1':
    "La casella «Documenti» elenca gli archivi in righe: Paperless-ngx, Papra, Nextcloud, OpenCloud e Synology Drive. All'inizio sono tutti e cinque disattivati, e le righe compaiono solo quando «Documenti» è attivo.",
  'help.guide.document-providers.step.2':
    "Attiva l'interruttore nella riga di Nextcloud. Compare il messaggio «Modulo aggiornato» e da quel momento i proprietari dei viaggi trovano «Sincronizzazione documenti» nella scheda «File» dei loro viaggi, con Nextcloud sotto «Collega un provider».",
  'help.guide.document-providers.result':
    "L'archivio è disponibile in tutti i viaggi di questo TREK. Non viene collegato nulla finché il proprietario di un viaggio non lo collega.",
  'help.guide.document-providers.tip.1':
    'Qui decidi solo se un archivio può essere proposto. Indirizzo e credenziali appartengono al singolo viaggio e li inserisce il proprietario del viaggio nella scheda «File», mai nel pannello di amministrazione.',
  'help.guide.document-providers.tip.2':
    'Disattivando Documenti si disattivano anche tutti gli archivi, e non puoi attivare un archivio finché Documenti è disattivato: il server risponde «Attiva prima il modulo Documenti». Per un archivio sulla tua rete locale serve anche ALLOW_INTERNAL_NETWORK=true sul server.',

  // ── Screen: trip ──────────────────────────────────────────────────────────────────────
  'help.ctx.trip.title': 'Viaggio',
  'help.ctx.trip.summary':
    'Tutto ciò che riguarda un viaggio: il programma con giorni, mappa e luoghi, e le schede per escursioni, trasporti, prenotazioni, liste, costi, file, collaborazione e un eventuale diario collegato. Ognuna ha la propria schermata di aiuto, qui sotto.',
  'help.ctx.trip.bullet.1':
    'La barra delle schede sotto la barra superiore: «Pianificato», «Escursioni», «Trasporti», «Prenotazioni», «Liste», «Costi», «File», «Collaborazione» e, se hai collegato un diario, «Diario». Le schede presenti sul tuo TREK dipendono da moduli e plugin.',
  'help.ctx.trip.bullet.2':
    "«Pianificato» ha tre colonne: i giorni a sinistra, la mappa al centro, i luoghi a destra. Con il modulo Viaggio su strada, la colonna dei giorni inizia con un selettore «Giorni» e «Viaggio su strada»; con il modulo Escursioni, la colonna dei luoghi inizia con «Luoghi» ed «Escursioni». Prenotazioni e trasporti fanno parte del programma, sulle tappe e tra una tappa e l'altra; le schede le elencano.",
  'help.ctx.trip.bullet.3':
    '«Impostazioni del viaggio», la pillola accanto al nome del viaggio in alto a sinistra, apre le impostazioni del viaggio: «Persone» (membri e ospiti), «Condivisione» (il link pubblico di sola lettura e il link di invito) e «Diario».',
  'help.ctx.trip.bullet.4':
    'Titolo, date, copertina e valuta si modificano da «I miei Viaggi», con la matita sulla scheda del viaggio. Il nome del viaggio in alto a sinistra ti riporta lì.',
  'help.ctx.trip.bullet.5':
    "La linguetta sul bordo interno di una colonna la comprime, e la mappa occupa lo spazio libero. Una colonna compressa lascia una piccola casella nell'angolo in alto della mappa: cliccala per mostrare di nuovo la colonna. Trascina il sottile divisore accanto a una colonna per cambiarne la larghezza.",
  'help.ctx.trip.bullet.6':
    'La freccia di annullamento nella barra degli strumenti dei giorni annulla una alla volta le tue ultime modifiche al programma.',
  // add-member
  'help.guide.add-member.title': 'Aggiungere un membro',
  'help.guide.add-member.goal': 'Dai accesso a questo viaggio a una persona con un account TREK.',
  'help.guide.add-member.step.1':
    'Clicca su «Impostazioni del viaggio», la pillola accanto al nome del viaggio in alto a sinistra. Si apre su «Persone».',
  'help.guide.add-member.step.2':
    'Sotto «Invita utente», scegli la persona da «Seleziona utente...» e clicca su «Invita».',
  'help.guide.add-member.step.3':
    'La persona ora compare sotto «Accesso». Il badge «Proprietario» indica il proprietario. «Rimuovi accesso», alla fine di una riga, rimuove la persona dopo la tua conferma.',
  'help.guide.add-member.result':
    "Il membro può vedere e modificare il viaggio come te, nei limiti fissati dall'amministratore in «Impostazioni dei permessi».",
  'help.guide.add-member.tip.1':
    "Chi non compare nell'elenco non ha ancora un account TREK: aggiungilo come ospite oppure fallo registrare con un link di invito.",
  'help.guide.add-member.tip.2':
    'Il numero accanto ad «Accesso» indica le persone nel viaggio; gli ospiti sono elencati a parte, più sotto.',
  // trip-invite-link
  'help.guide.trip-invite-link.title': 'Invitare tramite link',
  'help.guide.trip-invite-link.goal': 'Permetti alle persone di unirsi al viaggio da sole.',
  'help.guide.trip-invite-link.step.1':
    'Clicca su «Impostazioni del viaggio» accanto al nome del viaggio e scegli «Condivisione» a sinistra. Sotto «Link di invito al viaggio», clicca su «Crea link di invito».',
  'help.guide.trip-invite-link.step.2':
    'Clicca «Copia» e invia il link. Chiunque abbia un account TREK e lo apra entra come membro.',
  'help.guide.trip-invite-link.step.3':
    '«Rigenera» sostituisce il link e quello vecchio smette di funzionare; «Disattiva» lo disabilita.',
  'help.guide.trip-invite-link.result': 'Chiunque apra il link entra nel viaggio e compare in «Accesso».',
  'help.guide.trip-invite-link.tip.1':
    'Chi non ha un account non può usarlo. Un amministratore crea link di registrazione in Amministrazione, Utenti, e può collegarne uno a questo viaggio.',
  'help.guide.trip-invite-link.tip.2':
    'Se hai inviato il link nella chat sbagliata, rigeneralo: il vecchio link smette subito di funzionare.',
  // add-guest
  'help.guide.add-guest.title': 'Aggiungere un ospite senza account',
  'help.guide.add-guest.goal': 'Aggiungi al viaggio una persona che non usa TREK.',
  'help.guide.add-guest.step.1':
    "Clicca su «Impostazioni del viaggio» accanto al nome del viaggio. In «Persone», «Ospiti» è l'ultima sezione, sotto «Accesso».",
  'help.guide.add-guest.step.2': 'Scrivi il nome in «Nome ospite» e clicca «Aggiungi ospite».',
  'help.guide.add-guest.result':
    "L'ospite può essere assegnato a costi, elementi della valigia e attività, ma non può accedere.",
  'help.guide.add-guest.tip.1':
    "«Rinomina» (la matita) cambia il nome di un ospite. «Rimuovi accesso» (il cestino) rimuove l'ospite dopo la tua conferma: le sue assegnazioni vengono eliminate, e la sua quota di ogni spesa viene ripartita tra gli altri partecipanti alla suddivisione.",
  'help.guide.add-guest.tip.2': "Se in seguito la persona crea un account, invitala come membro e rimuovi l'ospite.",
  // public-link
  'help.guide.public-link.title': 'Pubblicare un link in sola lettura',
  'help.guide.public-link.goal': 'Mostra il viaggio a chi non deve modificarlo.',
  'help.guide.public-link.step.1':
    'Clicca su «Impostazioni del viaggio» accanto al nome del viaggio e scegli «Condivisione» a sinistra.',
  'help.guide.public-link.step.2':
    'Nella scheda «Link pubblico», attiva ciò che il link può mostrare. «Mappa e programma» è sempre attivo; «Prenotazioni», «Bagagli», «Costi» e Chat sono a tua scelta.',
  'help.guide.public-link.step.3':
    'Sotto «Opzioni», «Solo trasporti e alloggi» esclude attività, note dei giorni e giorni vuoti. «Senza foto» esclude le foto dei luoghi.',
  'help.guide.public-link.result':
    'Chiunque abbia il link vede le parti scelte senza accedere, e non può modificare nulla.',
  'help.guide.public-link.tip.1':
    'Il link non è elencato da nessuna parte, ma chiunque lo abbia può aprirlo. Custodiscilo come una password.',
  'help.guide.public-link.tip.2': 'Per dare diritti di modifica, aggiungi invece la persona come membro.',
  // transfer-ownership
  'help.guide.transfer-ownership.title': 'Cedere il viaggio o uscirne',
  'help.guide.transfer-ownership.goal': "Nomina un'altra persona proprietaria o esci da un viaggio che non è tuo.",
  'help.guide.transfer-ownership.step.1':
    'Clicca su «Impostazioni del viaggio» accanto al nome del viaggio. Sotto «Accesso», clicca su «Rendi proprietario» (la corona) nella riga di un membro e conferma.',
  'help.guide.transfer-ownership.step.2':
    '«Abbandona viaggio» sulla tua riga ti toglie dal viaggio dopo la conferma. Se sei il proprietario, prima trasferisci la proprietà.',
  'help.guide.transfer-ownership.result':
    'Il nuovo proprietario gestisce i membri e può eliminare il viaggio; tu resti un membro normale.',
  'help.guide.transfer-ownership.tip.1':
    'Il proprietario è chi ha creato il viaggio, finché la proprietà non viene trasferita. Solo il proprietario può eliminare il viaggio.',
  'help.guide.transfer-ownership.tip.2':
    '«Rimuovi accesso» sulla riga di un altro membro funziona al contrario: il proprietario toglie quel membro dal viaggio.',
  // collapse-columns
  'help.guide.collapse-columns.title': 'Fare spazio alla mappa',
  'help.guide.collapse-columns.goal': 'Comprimi una colonna o allargala.',
  'help.guide.collapse-columns.step.1':
    "Clicca la linguetta sul bordo interno della colonna dei giorni, quella con l'icona del pannello, per comprimere la colonna; la mappa occupa lo spazio libero. La colonna dei luoghi ha la stessa linguetta.",
  'help.guide.collapse-columns.step.2':
    "Quando una colonna è compressa, nell'angolo in alto della mappa compare una piccola casella con l'icona del pannello, con il suggerimento «Pianificato» o «Luoghi». Cliccala per mostrare di nuovo la colonna.",
  'help.guide.collapse-columns.step.3':
    'Trascina il divisore sottile tra una colonna e la mappa per cambiare la larghezza della colonna.',
  'help.guide.collapse-columns.result':
    'Le larghezze vengono memorizzate. Alla prossima visita le colonne sono di nuovo aperte.',
  'help.guide.collapse-columns.tip.1': 'Puoi comprimere entrambe le colonne insieme per vedere solo la mappa.',
  'help.guide.collapse-columns.tip.2':
    "In una finestra stretta c'è spazio per una sola colonna: se ne apri una, l'altra si chiude. Sul telefono non ci sono colonne: per passare da una vista all'altra usa «Viaggio», «Pianificato» e «Luoghi» in alto.",
  // undo-change
  'help.guide.undo-change.title': "Annullare l'ultima modifica",
  'help.guide.undo-change.goal': "Annulla l'ultima modifica al programma.",
  'help.guide.undo-change.step.1':
    'Clicca la freccia Annulla nella barra degli strumenti sopra i giorni; il tooltip indica quale modifica verrà annullata.',
  'help.guide.undo-change.result': "Il programma torna com'era, e un breve messaggio indica cosa è stato annullato.",
  'help.guide.undo-change.tip.1':
    '«Annulla» riguarda il programma: aggiunta, assegnazione, rimozione, riordino, spostamento e blocco dei luoghi, svuotamento di un giorno, ottimizzazione di un percorso, eliminazione di luoghi, cambi di categoria e importazioni.',
  'help.guide.undo-change.tip.2':
    'Clicca di nuovo per tornare ancora più indietro: TREK conserva le tue ultime 30 modifiche a questo viaggio, dalla più recente, finché non esci dal viaggio.',
  'help.guide.clear-day.title': 'Svuotare un giorno',
  'help.guide.clear-day.goal': 'Togli in una volta tutti i luoghi da un giorno, ad esempio per ripianificarlo da zero.',
  'help.guide.clear-day.step.1': "Fai clic destro sull'intestazione del giorno nel programma.",
  'help.guide.clear-day.step.2': 'Scegli «Svuota giorno» e conferma.',
  'help.guide.clear-day.result':
    'Il giorno è vuoto e i suoi luoghi tornano nella lista come non pianificati. Con la freccia Annulla sopra i giorni li rimetti al loro posto.',
  'help.guide.clear-day.tip.1': 'Vengono rimossi solo i luoghi. Il giorno mantiene le sue note e le sue prenotazioni.',

  // ── Screen: trip-places ───────────────────────────────────────────────────────────────
  'help.ctx.trip-places.title': 'Luoghi',
  'help.ctx.trip-places.summary':
    'La colonna di destra del programma: tutti i luoghi del viaggio, pianificati o no, con ricerca, filtri e ordinamento, e i modi per aggiungere luoghi: con la ricerca, a mano o da una lista condivisa. «Luoghi» ed «Escursioni» in cima passano dai luoghi alle escursioni del viaggio.',
  'help.ctx.trip-places.bullet.1':
    "«Luoghi» ed «Escursioni», in cima alla colonna, cambiano l'elenco. All'apertura è attivo «Luoghi». «Escursioni» elenca le escursioni del viaggio e importa file GPX, KML e KMZ con «Importa GPX o KML»; un'escursione non compare nell'elenco dei luoghi.",
  'help.ctx.trip-places.bullet.2':
    '«Aggiungi Luogo/Attività» apre il modulo per un luogo da cercare o da inserire a mano. Quando un giorno è aperto, il pulsante diventa «Nuovo luogo», e «Al giorno» accanto crea il luogo direttamente in quel giorno.',
  'help.ctx.trip-places.bullet.3':
    "«Importa luoghi», il pulsante con l'icona accanto, offre «Importa lista» per una lista condivisa da Google Maps o Naver Maps. Se un amministratore ha disattivato il modulo Escursioni, offre anche «Importa file» per file .gpx, .kml e .kmz, e puoi trascinare un file sulla colonna.",
  'help.ctx.trip-places.bullet.4':
    "Sotto ci sono la ricerca, che cerca anche nelle descrizioni e nelle note, e accanto la casella «Scegli». La riga successiva contiene i filtri: «Mostra» passa tra «Tutti», «Non pianificati» e «Pianificato», ciascuno con il suo conteggio. Il pulsante dell'etichetta filtra per categoria, la stella per valutazione minima, il globo (quando il viaggio tocca più di un paese o regione) per paese o regione, e «Ordina per» imposta l'ordine dell'elenco.",
  'help.ctx.trip-places.bullet.5':
    'Una riga mostra immagine, nome e descrizione o indirizzo e, se qualcuno ha valutato il luogo, una stella con la valutazione media. Cliccala per i dettagli del luogo, trascinala su un giorno, oppure fai clic destro (o clicca su «Altre opzioni», i tre puntini) per «Modifica», «+ Giorno», «Apri sito web», Google Maps, «Salva nella raccolta» ed «Elimina».',
  'help.ctx.trip-places.bullet.6':
    'Con un giorno aperto, il + rotondo alla fine di una riga («+ Giorno») aggiunge il luogo a quel giorno. Compare su ogni luogo che non è ancora in quel giorno. «Pianificato» elenca allora solo quel giorno, e il chip «Viene mostrato solo il giorno aperto» te lo ricorda. La sua x, «Mostra tutto il viaggio», chiude il giorno.',
  // create-place
  'help.guide.create-place.title': 'Creare un luogo',
  'help.guide.create-place.goal':
    "Aggiungi a mano un luogo o un'attività, con tutti i dettagli che servono al programma.",
  'help.guide.create-place.step.1':
    'Clicca su «Aggiungi Luogo/Attività» in cima alla colonna dei luoghi («Nuovo luogo» quando un giorno è aperto). Il modulo si apre con il cursore nella ricerca.',
  'help.guide.create-place.step.2':
    'Scrivi il luogo in «Cerca luoghi…» e scegli un risultato. Il nome in cima alla finestra, «Indirizzo», «Latitudine», «Longitudine» e «Sito web» vengono compilati, e «Dettagli del luogo» a sinistra mostra immagini, orari di apertura e una descrizione. Su un TREK con chiave Google, «Non è il luogo giusto? Cerca invece con Google» sotto i risultati ripete la stessa ricerca con Google. Con Raccolte attivo, «Luoghi salvati» a destra propone allo stesso modo i luoghi delle tue liste.',
  'help.guide.create-place.step.3':
    "In «Dettagli del luogo», clicca su un'immagine sotto «Scegli un'immagine» per usarla come immagine del luogo. «Usa questo testo» copia la descrizione nel modulo.",
  'help.guide.create-place.step.4':
    "Controlla i campi del modulo. Il nome in cima alla finestra è l'unico campo obbligatorio. La pillola «Categoria» sotto assegna una delle categorie del viaggio, e il + accanto ne crea una nuova. «Indirizzo», «Latitudine» e «Longitudine» arrivano dalla ricerca oppure li inserisci tu. «Descrizione» e «Note» sono per i tuoi testi. «Sito web» accoglie il link, «Allega» sotto «File» aggiunge un documento, e «Telefono», email e «Aggiungi orari di apertura» servono per i dati che la ricerca non ha trovato.",
  'help.guide.create-place.step.5':
    "Clicca su «Aggiungi». Se nel viaggio c'è già un luogo con lo stesso nome o nella stessa posizione, TREK mostra un avviso e il pulsante diventa «Aggiungi comunque».",
  'help.guide.create-place.result':
    "Il luogo è nell'elenco e sulla mappa, tra i «Non pianificati» finché non lo assegni a un giorno.",
  'help.guide.create-place.tip.1':
    "Con il modulo Budget attivo, «Costi» in fondo al modulo apre l'editor dei costi per la spesa del luogo subito dopo il salvataggio. Un'immagine o un PDF incollato nella finestra viene allegato come file sotto «File».",
  'help.guide.create-place.tip.2':
    "Su ogni TREK i risultati di ricerca arrivano dall'indice TREK e da OpenStreetMap, e «Dettagli del luogo» viene compilato automaticamente da Wikipedia, Wikivoyage e Wikimedia. TREK interpella Google solo quando entrambi non trovano nulla, e solo Google fornisce le valutazioni.",
  'help.guide.create-place.tip.3':
    'Puoi creare un luogo anche dalla mappa: fai clic destro sul punto e il modulo si apre con coordinate e indirizzo già compilati.',
  // place-to-open-day
  'help.guide.place-to-open-day.title': 'Aggiungere un luogo direttamente al giorno aperto',
  'help.guide.place-to-open-day.goal': 'Crea o scegli un luogo e aggiungilo al giorno in un solo passaggio.',
  'help.guide.place-to-open-day.step.1':
    "Clicca sull'intestazione di un giorno nella colonna dei giorni. Il giorno si apre: la sua scheda viene evidenziata, e nella colonna dei luoghi compare il pulsante «Al giorno» accanto a «Nuovo luogo».",
  'help.guide.place-to-open-day.step.2':
    '«Al giorno» apre lo stesso modulo di «Nuovo luogo», ma il luogo viene aggiunto al giorno aperto appena clicchi su «Aggiungi».',
  'help.guide.place-to-open-day.step.3':
    'Per aggiungere al giorno aperto un luogo esistente, clicca sul + rotondo alla fine della sua riga («+ Giorno»), oppure fai clic destro e scegli «+ Giorno». Il + compare su ogni luogo che non è ancora in quel giorno.',
  'help.guide.place-to-open-day.step.4':
    'Funziona anche al contrario, senza aprire prima un giorno: trascina la riga del luogo fuori dalla colonna e rilasciala sulla scheda di un giorno. Se la rilasci tra due tappe, viene inserita esattamente lì.',
  'help.guide.place-to-open-day.result':
    'Il luogo compare in fondo al giorno; trascinalo in alto o in basso nella posizione giusta.',
  'help.guide.place-to-open-day.tip.1':
    'Il giorno aperto influisce anche sulla ricerca: quando un giorno è aperto, la mappa e la ricerca nei dintorni partono dai luoghi già presenti in quel giorno.',
  'help.guide.place-to-open-day.tip.2': "«Annulla» nella barra degli strumenti sopra i giorni annulla l'assegnazione.",
  // filter-places
  'help.guide.filter-places.title': "Trovare un luogo nell'elenco",
  'help.guide.filter-places.goal': 'Mostra nella colonna solo i luoghi che stai cercando.',
  'help.guide.filter-places.step.1':
    "«Mostra», il menu a tendina sotto la ricerca, passa tra «Tutti», «Non pianificati» (non ancora in nessun giorno) e «Pianificato» (in un giorno), ciascuno con il suo conteggio. Se il modulo Escursioni è disattivato e hai importato una traccia GPX, c'è anche «Tracce».",
  'help.guide.filter-places.step.2':
    "Scrivi in «Cerca» in alto. L'elenco si restringe mentre scrivi, per nome, indirizzo, descrizione e note; la x nel campo lo svuota.",
  'help.guide.filter-places.step.3':
    "Il pulsante dell'etichetta accanto a «Mostra» elenca le categorie: spuntane una o più, compresa «Nessuna categoria». Il pulsante indica quante ne hai spuntate, e «Cancella filtro» in fondo all'elenco le toglie tutte.",
  'help.guide.filter-places.step.4':
    'La stella accanto imposta una valutazione minima: 5+, 4+ e così via mostrano solo i luoghi con una valutazione media almeno pari a quella. I luoghi senza valutazione vengono nascosti.',
  'help.guide.filter-places.result':
    'Il numero su «Mostra» indica quanti luoghi corrispondono, e i filtri si combinano tra loro.',
  'help.guide.filter-places.tip.1':
    'Quando un giorno è aperto, «In programma» elenca solo quel giorno e lo segnala con «Viene mostrato solo il giorno aperto», con accanto «Mostra tutto il viaggio».',
  'help.guide.filter-places.tip.2':
    "Anche la mappa applica «Mostra», le categorie e la valutazione e, con un giorno aperto, «Pianificato» sulla mappa mostra solo quel giorno. La ricerca e il globo filtrano solo l'elenco.",
  // edit-place
  'help.guide.edit-place.title': 'Modificare un luogo',
  'help.guide.edit-place.goal': 'Correggi un nome, sposta il segnaposto, aggiungi un sito web o cambia la categoria.',
  'help.guide.edit-place.step.1':
    'Fai clic destro sulla riga e scegli «Modifica», oppure clicca su «Altre opzioni» alla fine della riga, oppure apri il luogo e clicca su «Modifica» nei suoi dettagli.',
  'help.guide.edit-place.step.2':
    "In «Modifica luogo» cambia ciò che ti serve: il nome e la pillola «Categoria» in cima alla finestra, «Indirizzo», «Latitudine» e «Longitudine», «Descrizione», «Note», «Sito web», «Telefono», email e orari di apertura. Se il luogo è in un solo giorno, o l'hai aperto da un giorno, il modulo ha anche «Inizio», «Fine» e «Note per questo giorno».",
  'help.guide.edit-place.step.3': 'Clicca su «Aggiorna».',
  'help.guide.edit-place.result':
    "La modifica vale ovunque compaia il luogo: nell'elenco, sulla mappa e in tutti i giorni in cui si trova.",
  'help.guide.edit-place.tip.1':
    '«Note per questo giorno» riguardano il luogo solo in quel giorno; «Note» riguardano il luogo in sé.',
  'help.guide.edit-place.tip.2':
    "Se la «Fine» è prima dell'«Inizio», «Aggiorna» è bloccato; «Sovrapposizione di orario con:» è solo un avviso che un'altra tappa del giorno ha lo stesso orario.",
  // delete-place
  'help.guide.delete-place.title': 'Eliminare un luogo',
  'help.guide.delete-place.goal': 'Rimuovi definitivamente un luogo dal viaggio.',
  'help.guide.delete-place.step.1':
    'Fai clic destro sulla riga e scegli «Elimina» (lo trovi anche in «Altre opzioni» alla fine della riga), oppure clicca su «Elimina» nei dettagli del luogo.',
  'help.guide.delete-place.step.2':
    "Clicca «Elimina» nella richiesta di conferma. Se nel luogo era prenotata una notte o se c'è una prenotazione collegata, la richiesta indica cosa verrà eliminato insieme al luogo.",
  'help.guide.delete-place.result':
    "Il luogo sparisce dall'elenco, dalla mappa e da tutti i giorni. «Annulla» nella barra degli strumenti sopra i giorni lo ripristina.",
  'help.guide.delete-place.tip.1':
    'Per togliere un luogo da un solo giorno, usa invece «Rimuovi dal giorno» su quella tappa.',
  'help.guide.delete-place.tip.2':
    'Per eliminare più luoghi insieme, clicca sulla spunta accanto alla ricerca per avviare una selezione.',
  // select-places
  'help.guide.select-places.title': 'Modificare o eliminare più luoghi insieme',
  'help.guide.select-places.goal': 'Modifica più luoghi insieme invece che uno alla volta.',
  'help.guide.select-places.step.1':
    'Clicca la spunta accanto al campo di ricerca. Sulle righe compaiono caselle rotonde e in fondo alla colonna appare una barra con le azioni.',
  'help.guide.select-places.step.2':
    'Clicca le righe per spuntarle. «Seleziona tutto», la doppia spunta nella barra, seleziona tutte le righe visibili con i filtri attuali.',
  'help.guide.select-places.step.3':
    'La barra conta i luoghi spuntati. «Cambia categoria» assegna a tutti la stessa categoria; «Salva nella raccolta» (con Raccolte attivo) li copia in una delle tue raccolte; «Elimina selezionati» li rimuove dopo una conferma.',
  'help.guide.select-places.step.4': 'Clicca su «Fatto», la X alla fine della barra, per terminare la selezione.',
  'help.guide.select-places.result':
    "La modifica vale per tutti i luoghi selezionati; un'eliminazione si può annullare dalla barra degli strumenti sopra i giorni.",
  'help.guide.select-places.tip.1':
    'I filtri restano attivi durante la selezione: filtra prima per «Non pianificati», poi «Seleziona tutto» selezionerà solo quei luoghi.',
  'help.guide.select-places.tip.2':
    "«Segna come visitato nelle tue liste» compare nella barra quando l'addon Raccolte è attivo: segna i luoghi come visitati nelle raccolte in cui sono salvati.",
  // import-places-file
  'help.guide.import-places-file.title': 'Importare luoghi da un file GPX, KML o KMZ',
  'help.guide.import-places-file.goal':
    'Se il modulo Escursioni è disattivato, importa come luoghi i segnaposto e i tracciati esportati da Google My Maps, Google Earth o da un tracker GPS.',
  'help.guide.import-places-file.step.1':
    "Clicca su «Importa luoghi», il pulsante con l'icona accanto al pulsante di aggiunta, e scegli «Importa file», oppure trascina il file in qualsiasi punto della colonna dei luoghi. Entrambe le opzioni ci sono solo se un amministratore ha disattivato il modulo Escursioni.",
  'help.guide.import-places-file.step.2':
    'Scegli il file o trascinalo nel riquadro. Per un GPX, spunta cosa importare: «Waypoint», «Percorsi», «Tracce (con geometria percorso)». Per KML e KMZ, spunta «Punti (Placemarks)» e «Percorsi (LineStrings)».',
  'help.guide.import-places-file.step.3':
    'Il riquadro accetta più file insieme, ma solo .gpx, .kml e .kmz. Qualsiasi altro tipo di file, o un file oltre i 10 MB, viene rifiutato nella finestra e non viene importato.',
  'help.guide.import-places-file.step.4':
    'Clicca su «Importa». Un messaggio indica quanti luoghi sono stati importati. Per un file KML o KMZ la finestra resta aperta con un riepilogo di ciò che è stato creato e di ciò che è stato saltato.',
  'help.guide.import-places-file.result':
    "I luoghi sono nell'elenco. Una traccia ha una linea colorata nella sua riga, viene disegnata sulla mappa e ha un filtro «Tracce» dedicato.",
  'help.guide.import-places-file.tip.1':
    'Un file troppo grande viene rifiutato e TREK indica il limite di dimensione: esportalo di nuovo senza foto oppure dividilo.',
  'help.guide.import-places-file.tip.2':
    "Puoi annullare l'intera importazione dalla barra degli strumenti sopra i giorni.",
  // import-places-list
  'help.guide.import-places-list.title': 'Importare una lista condivisa di Google Maps o Naver Maps',
  'help.guide.import-places-list.goal': 'Importa luoghi dal link di una lista condivisa.',
  'help.guide.import-places-list.step.1':
    "Clicca su «Importa luoghi», il pulsante con l'icona accanto al pulsante di aggiunta, e scegli «Importa lista».",
  'help.guide.import-places-list.step.2':
    "Sotto Provider, scegli «Lista Google» o «Lista Naver», poi incolla il link condiviso della lista in Link. Funziona anche un link di indicazioni stradali di Google Maps: le sue tappe diventano luoghi, nell'ordine del tragitto.",
  'help.guide.import-places-list.step.3': 'Clicca «Importa».',
  'help.guide.import-places-list.result':
    'Tutti i luoghi della lista sono nel viaggio, con il nome che hanno nella lista; i luoghi già presenti nel viaggio vengono saltati.',
  'help.guide.import-places-list.tip.1':
    'La lista deve essere condivisa pubblicamente; il link di una lista privata non importa nulla.',
  'help.guide.import-places-list.tip.2':
    'Se il tuo TREK ha una chiave Google, nella finestra compare «Arricchisci i luoghi con Google»: cerca ogni luogo importato e aggiunge foto, indirizzo e dettagli.',
  'help.guide.sort-places.title': 'Ordinare la lista dei luoghi',
  'help.guide.sort-places.goal': "Ordina l'elenco per nome, per valutazione o per ultima aggiunta o modifica.",
  'help.guide.sort-places.step.1':
    "Clicca su «Ordina per», il pulsante con le frecce alla fine della riga dei filtri. Una spunta indica l'ordinamento attuale, e il suggerimento del pulsante ne mostra il nome.",
  'help.guide.sort-places.step.2':
    "Scegli un ordinamento, ad esempio «Più votati», oppure ordina per nome. L'elenco si aggiorna subito.",
  'help.guide.sort-places.result':
    "L'elenco mostra i luoghi nell'ordine che hai scelto, finché non ne scegli un altro.",
  'help.guide.sort-places.tip.1':
    "Qualsiasi ordinamento diverso da «Aggiunti di recente» evidenzia il pulsante, così vedi subito che l'elenco è ordinato diversamente.",
  'help.guide.sort-places.tip.2':
    "L'ordinamento cambia solo l'elenco. I giorni mantengono il proprio ordine, e il browser ricorda l'ordinamento scelto.",
  'help.guide.place-by-hand.title': 'Aggiungere un luogo che la ricerca non trova',
  'help.guide.place-by-hand.goal':
    'Inserisci tu un luogo, con telefono, e-mail e orari di apertura, quando la ricerca non trova nulla.',
  'help.guide.place-by-hand.step.1':
    'Nella finestra del luogo, scrivi il nome nella ricerca e premi Invio. Se non trova nulla, la finestra te lo segnala e propone «Aggiungi a mano».',
  'help.guide.place-by-hand.step.2':
    'Clicca «Aggiungi a mano». Il testo che hai cercato diventa il nome e la finestra scorre fino ai campi dei contatti.',
  'help.guide.place-by-hand.step.3': 'Compila «Telefono» ed email, se li conosci.',
  'help.guide.place-by-hand.step.4':
    "Clicca su «Aggiungi orari di apertura» e imposta per ogni giorno l'orario di apertura e di chiusura. Il pulsante di copia applica a tutti i giorni gli orari del primo, e l'interruttore di un giorno lo segna come «Chiuso».",
  'help.guide.place-by-hand.step.5': 'Clicca su «Aggiungi».',
  'help.guide.place-by-hand.result':
    'Il luogo viene aggiunto alla lista. Nei suoi dettagli trovi telefono, e-mail e orari di apertura che hai inserito, come per un luogo trovato con la ricerca.',
  'help.guide.place-by-hand.tip.1':
    'Se modifichi un luogo che non ha orari propri, gli orari di apertura vengono copiati automaticamente da «Dettagli del luogo» a sinistra. Se ha già degli orari, un pulsante accanto ti permette di copiare quelli trovati.',
  'help.guide.place-by-hand.tip.2':
    'Gli orari che inserisci sostituiscono quelli trovati, così per un bar con orari stagionali vedi gli orari che conosci tu.',

  // ── Screen: trip-days ─────────────────────────────────────────────────────────────────
  'help.ctx.trip-days.title': 'Giorni',
  'help.ctx.trip-days.summary':
    'La colonna di sinistra del programma: una scheda per ogni giorno con le tappe in ordine, le note, le prenotazioni e i trasporti del giorno e il percorso tra le tappe. È qui che il viaggio prende davvero forma.',
  'help.ctx.trip-days.bullet.1':
    "L'intestazione in alto: «Esporta» (PDF, calendario, GPX) a sinistra; a destra la freccia di annullamento, «Espandi tutti i giorni» / «Comprimi tutti i giorni», «Riordina i giorni» e, quando una prenotazione ha un percorso da disegnare, «Mostra tutti i percorsi prenotati».",
  'help.ctx.trip-days.bullet.2':
    "La scheda di un giorno: una casella con il numero del giorno e le previsioni meteo, il titolo («Giorno 1» finché non gli dai un nome) e la data, e sotto le pillole per il pernottamento (verde al check-in, rossa al check-out, tratteggiata finché non è confermato; l'icona del biglietto apre la prenotazione) e per l'auto a noleggio. Clicca sull'intestazione per aprire il giorno, la freccia lo comprime e il + («Aggiungi al giorno») apre un menu: «Aggiungi luogo a questo giorno», «Aggiungi alloggio», «Aggiungi trasporto», «Trasporto pubblico» e «Aggiungi nota». Il clic destro sull'intestazione offre le stesse voci, più «Svuota giorno».",
  'help.ctx.trip-days.bullet.3':
    "All'interno di un giorno: le tappe in ordine, ciascuna con immagine, icona della categoria, nome, orario e descrizione, le prenotazioni collegate e chi partecipa; le note; le prenotazioni e i trasporti del giorno, colorati in base al tipo. Passa con il mouse su una tappa per vedere la maniglia di trascinamento, il lucchetto sull'immagine, le frecce, «Aggiungi prenotazione» e i tre puntini («Altre opzioni»). Puoi aprire il menu di tappe e note anche con il clic destro.",
  'help.ctx.trip-days.bullet.4':
    'Nel giorno aperto, appena ci sono due tappe, sotto compare la barra del percorso: «Percorso» mostra la giornata sulla mappa e la durata di ogni tratto tra le tappe, le tre icone impostano «Auto», «A piedi» o «Bicicletta» per la giornata, poi «Ottimizza», «Apri in Google Maps» e «Apri in CoMaps».',
  'help.ctx.trip-days.bullet.5':
    'Puoi aggiungere luoghi a un giorno in diversi modi: trascinando una riga dalla colonna dei luoghi, con «+ Giorno» su quella riga, con «Aggiungi luogo a questo giorno» dal + del giorno o in un giorno vuoto, oppure dai dettagli del luogo.',
  'help.ctx.trip-days.bullet.6':
    '«Costo totale», in fondo, somma le spese di «Costi» legate alle tappe e alle prenotazioni del giorno, ciascuna una sola volta, nella tua valuta di visualizzazione.',
  // read-day-plan
  'help.guide.read-day-plan.title': 'Leggere una giornata',
  'help.guide.read-day-plan.goal':
    'Scopri cosa indica ogni parte della scheda di un giorno prima di modificare qualcosa.',
  'help.guide.read-day-plan.step.1':
    "L'intestazione: una casella con il numero del giorno e le previsioni meteo, poi «Giorno 1» o il titolo che gli hai dato e la data. Sotto, le pillole per il pernottamento (verde al check-in, rossa al check-out, tratteggiata finché non è confermato; l'icona del biglietto apre la prenotazione) e per l'auto a noleggio. Clicca sull'intestazione per aprire il giorno (il pannello dei dettagli si apre sopra la mappa). Il + a destra («Aggiungi al giorno») aggiunge un luogo, un alloggio, un trasporto, un collegamento con il trasporto pubblico o una nota, e la freccia comprime la scheda.",
  'help.guide.read-day-plan.step.2':
    "Una tappa mostra immagine, icona della categoria e nome, poi l'ora se ha un «Inizio», e la descrizione. Sotto compaiono le «Note per questo giorno». Passando con il mouse sulla riga compaiono i comandi: la maniglia a sinistra serve a trascinarla, l'immagine diventa un lucchetto per l'ottimizzazione del percorso e all'estremità destra ci sono le frecce («Sposta su», «Sposta giù»), «Aggiungi prenotazione» e i tre puntini («Altre opzioni»).",
  'help.guide.read-day-plan.step.3':
    'Una prenotazione legata a una tappa compare sulla tappa come badge «Prenotazione», verde se confermata e ambra se in attesa, con orario e vettore. Clicca sul badge per aprire la prenotazione; il pulsante del percorso accanto ne disegna il tragitto. Un trasporto ha una riga propria, colorata in base al tipo, con orario e «Partenza» o «Arrivo». Clicca su una prenotazione per aprirne i dettagli; lì puoi modificarla con «Modifica».',
  'help.guide.read-day-plan.step.4':
    'Con «Percorso» attivo, il collegamento tra due tappe indica durata e lunghezza del tratto, nel mezzo di trasporto della giornata; cliccalo per cambiare il mezzo solo per quel tratto.',
  'help.guide.read-day-plan.step.5':
    'La barra del percorso sotto le tappe del giorno aperto: «Percorso» disegna il tragitto del giorno sulla mappa, le tre icone scelgono «Auto», «A piedi» o «Bicicletta», poi «Ottimizza» riordina le tappe, e «Apri in Google Maps» e «Apri in CoMaps» aprono la giornata in quelle app.',
  'help.guide.read-day-plan.result':
    'Ogni simbolo sulla scheda ha un significato; le guide qui sotto spiegano come modificarli uno per uno.',
  'help.guide.read-day-plan.tip.1':
    'Fai clic destro su una tappa, oppure clicca sui suoi tre puntini, per aprirne il menu: «Modifica», «Rimuovi dal giorno», «Escludi dal percorso», «Apri sito web», «Salva nella raccolta», «Elimina». Le app di navigazione sono nei dettagli del luogo, sotto «Navigazione».',
  'help.guide.read-day-plan.tip.2':
    'Passa il mouse su una tappa e alla fine della riga compare «Aggiungi prenotazione». Una prenotazione creata lì è collegata a questa tappa in questo giorno.',
  // place-onto-day
  'help.guide.place-onto-day.title': 'Aggiungere un luogo a un giorno',
  'help.guide.place-onto-day.goal': "Trasforma un luogo dell'elenco in una tappa di un giorno, nella posizione giusta.",
  'help.guide.place-onto-day.step.1':
    "Trascina una riga dalla colonna dei luoghi sulla scheda del giorno. Rilasciala tra due tappe per inserirla esattamente lì, oppure sull'intestazione del giorno per aggiungerla in fondo.",
  'help.guide.place-onto-day.step.2':
    'Senza trascinare: apri il giorno cliccando sulla sua intestazione, poi clicca sul + rotondo alla fine della riga del luogo («+ Giorno»), oppure fai clic destro sulla riga e scegli «+ Giorno».',
  'help.guide.place-onto-day.step.3':
    '«Aggiungi luogo a questo giorno», nel menu + del giorno o in un giorno vuoto, apre il modulo del luogo, e il nuovo luogo viene aggiunto subito al giorno.',
  'help.guide.place-onto-day.step.4':
    "Con un giorno aperto, «Aggiungi al giorno» nei dettagli di un luogo lo aggiunge a quel giorno; «Al giorno» nell'intestazione della colonna dei luoghi crea un nuovo luogo direttamente nel giorno aperto.",
  'help.guide.place-onto-day.result':
    'Ora il luogo è una tappa della giornata. Compare sulla mappa con il numero del giorno, e la colonna dei luoghi lo conta tra quelli «Pianificato».',
  'help.guide.place-onto-day.tip.1':
    "Un luogo può essere in più giorni: aggiungilo al secondo giorno dalla colonna dei luoghi. Se invece trascini una tappa dalla scheda di un giorno a un'altra, la sposti.",
  'help.guide.place-onto-day.tip.2': "La freccia di annullamento nell'intestazione annulla l'assegnazione.",
  'help.guide.place-onto-day.tip.3':
    'Non puoi rilasciare una tappa tra due voci con orari fissi o prima di una prenotazione che ha già un orario: il programma resta in ordine cronologico.',
  // reorder-stops
  'help.guide.reorder-stops.title': "Cambiare l'ordine delle tappe di un giorno",
  'help.guide.reorder-stops.goal': 'Sposta una tappa più in alto o più in basso, oppure in un altro giorno.',
  'help.guide.reorder-stops.step.1':
    'Passa con il mouse sulla tappa e trascinala per la maniglia nella nuova posizione della scheda.',
  'help.guide.reorder-stops.step.2':
    "In alternativa usa le frecce all'estremità destra della tappa evidenziata («Sposta su», «Sposta giù»): una posizione per ogni clic.",
  'help.guide.reorder-stops.step.3':
    'Trascina la tappa sulla scheda di un altro giorno per spostarla lì; viene tolta dal giorno precedente.',
  'help.guide.reorder-stops.step.4':
    "Se una tappa ha un orario fisso e lo spostamento rompe l'ordine della giornata, TREK chiede «Rimuovere l'orario?», perché è l'orario a stabilire la posizione della tappa. «Conferma» rimuove l'orario, così la tappa può andare ovunque. «Annulla» lascia la giornata com'era.",
  'help.guide.reorder-stops.result':
    'Il percorso e i tempi di spostamento si aggiornano subito in base al nuovo ordine.',
  'help.guide.reorder-stops.tip.1':
    'Una prenotazione con un orario fisso resta nella posizione data dal suo orario. Se la rilasci altrove nello stesso giorno, torna al suo posto. Se la trascini sulla scheda di un altro giorno, si sposta in quel giorno.',
  'help.guide.reorder-stops.tip.2':
    "«Ottimizza», nella barra del percorso, riordina l'intera giornata secondo il percorso più breve quando ci sono almeno tre tappe. Blocca prima una tappa per tenerla dov'è.",
  // set-stop-times
  'help.guide.set-stop-times.title': 'Assegnare un orario a una tappa',
  'help.guide.set-stop-times.goal':
    'Imposta quando inizia e finisce una tappa, così la giornata diventa un programma con orari.',
  'help.guide.set-stop-times.step.1':
    'Fai clic destro sulla tappa, oppure clicca i tre puntini, e scegli «Modifica». Se apri il modulo dal giorno, trovi «Inizio» e «Fine» per quel giorno subito sotto il luogo.',
  'help.guide.set-stop-times.step.2':
    "Inserisci «Inizio» e, se vuoi, «Fine». «Sovrapposizione di orario con:» avvisa che si sovrappone a un'altra tappa del giorno con orario. Se la «Fine» è prima dell'«Inizio», «Aggiorna» è bloccato.",
  'help.guide.set-stop-times.step.3':
    "Clicca «Aggiorna». La tappa riceve un badge con l'orario e si sposta nella posizione corrispondente del giorno.",
  'help.guide.set-stop-times.result':
    "Le tappe con orario mantengono la loro posizione nell'ordine; quelle senza orario si dispongono intorno.",
  'help.guide.set-stop-times.tip.1':
    "L'orario appartiene alla tappa in quel giorno; lo stesso luogo in un altro giorno può avere un orario diverso.",
  'help.guide.set-stop-times.tip.2':
    "Per spostare a mano una tappa con orario, trascinala. TREK chiede «Rimuovere l'orario?» e, quando clicchi su «Conferma», l'orario viene rimosso.",
  'help.guide.set-stop-times.tip.3':
    'Il campo «Note per questo giorno», nello stesso modulo, serve per informazioni valide solo per quel giorno, come la prenotazione di un tavolo o il numero di un biglietto.',
  // remove-from-day
  'help.guide.remove-from-day.title': 'Togliere una tappa da un giorno',
  'help.guide.remove-from-day.goal': 'Togli un luogo da un giorno senza eliminarlo dal viaggio.',
  'help.guide.remove-from-day.step.1':
    'Fai clic destro sulla tappa, oppure clicca sui suoi tre puntini, e scegli «Rimuovi dal giorno».',
  'help.guide.remove-from-day.step.2':
    'La tappa viene rimossa dal giorno. Il luogo resta nella colonna dei luoghi, in «Non pianificati» se non è in nessun altro giorno.',
  'help.guide.remove-from-day.result':
    'Il giorno, il suo percorso e il suo costo si aggiornano. La freccia di annullamento ripristina la tappa.',
  'help.guide.remove-from-day.tip.1':
    "«Elimina», nello stesso menu, rimuove il luogo dall'intero viaggio, da tutti i giorni.",
  'help.guide.remove-from-day.tip.2':
    '«Rimuovi dal giorno» si trova anche nel pannello dei dettagli del luogo, accanto ad «Aggiungi al giorno».',
  // lock-stop
  'help.guide.lock-stop.title': 'Bloccare una tappa',
  'help.guide.lock-stop.goal': 'Mantieni una tappa nella sua posizione quando il percorso viene ottimizzato.',
  'help.guide.lock-stop.step.1':
    "Passa il mouse sull'immagine della tappa e clicca il lucchetto: «Mantieni la posizione durante l'ottimizzazione del percorso».",
  'help.guide.lock-stop.step.2':
    'Ora «Ottimizza» riordina le altre tappe intorno a questa. Clicca di nuovo il lucchetto («Clicca per sbloccare») per sbloccarla.',
  'help.guide.lock-stop.result':
    "Il lucchetto compare sull'immagine; la tappa resta in quella posizione finché non la sblocchi.",
  'help.guide.lock-stop.tip.1':
    "Una tappa con orario fisso è bloccata dal suo orario: durante l'ottimizzazione non si sposta mai.",
  'help.guide.lock-stop.tip.2':
    'Il blocco dura solo finché non ricarichi la pagina. Dopo il ricaricamento tutte le tappe sono di nuovo sbloccate; restano fisse solo quelle con orario.',
  // day-note
  'help.guide.day-note.title': 'Aggiungere una nota a un giorno',
  'help.guide.day-note.goal': 'Salva nel giorno un promemoria, un numero di biglietto o un piano B.',
  'help.guide.day-note.step.1':
    "Clicca sul + nell'intestazione del giorno («Aggiungi al giorno») e scegli «Aggiungi nota».",
  'help.guide.day-note.step.2':
    "Scrivi il nome della nota in alto nella finestra, dove c'è scritto «Nota». È il nome che compare sulla scheda del giorno. Scrivi il resto in «Nota giornaliera»: la barra degli strumenti sopra formatta il testo (grassetto, elenchi, link, citazioni) e «Anteprima», a sinistra, mostra come apparirà la riga.",
  'help.guide.day-note.step.3':
    "Scegli un'«Icona» e un «Colore», così distingui facilmente la nota dalle tappe, poi clicca «Aggiungi».",
  'help.guide.day-note.step.4':
    'La nota compare nella giornata come una tappa: trascinala dove vuoi o usa le sue frecce. Cliccala per modificarla. «Elimina» si trova nella finestra e nel menu dei tre puntini o del clic destro, e prima chiede «Eliminare la nota?».',
  'help.guide.day-note.result': "La nota fa parte della giornata e del PDF, nel punto in cui l'hai trascinata.",
  'help.guide.day-note.tip.1': 'I link in una nota si aprono in una nuova scheda, e un singolo a capo resta un a capo.',
  'help.guide.day-note.tip.2':
    'Le note valgono per un singolo giorno. Una nota per tutto il viaggio va in «Collaborazione».',
  // day-route
  'help.guide.day-route.title': 'Mostrare e ottimizzare il percorso del giorno',
  'help.guide.day-route.goal':
    "Vedi il percorso tra le tappe, scegli come spostarti e lascia che TREK ottimizzi l'ordine.",
  'help.guide.day-route.step.1':
    'Apri il giorno e clicca su «Percorso» nella barra sotto le tappe: il percorso tra le tappe viene disegnato sulla mappa, e i collegamenti tra le tappe mostrano durata e distanza di ogni tratto.',
  'help.guide.day-route.step.2':
    'Le tre icone accanto impostano il mezzo della giornata: «Auto», «A piedi» o «Bicicletta». I tratti vengono ricalcolati. I plugin possono aggiungere altri mezzi.',
  'help.guide.day-route.step.3':
    'Clicca su un collegamento per cambiare il mezzo solo per quel tratto: scegli un mezzo, «Trasporto pubblico» per cercare un collegamento dove disponibile, oppure «Usa predefinito del giorno» per tornare al mezzo della giornata.',
  'help.guide.day-route.step.4':
    "«Ottimizza» (la freccia circolare) riordina le tappe secondo il percorso più breve, a partire da tre tappe. Le tappe con un lucchetto o un orario fisso restano al loro posto; se nel giorno c'è un alloggio, il percorso parte da lì.",
  'help.guide.day-route.step.5':
    "«Apri in Google Maps» o «Apri in CoMaps» apre l'intera giornata come percorso in quell'app, per navigare lungo il tragitto; CoMaps usa anche il mezzo impostato per la giornata.",
  'help.guide.day-route.result':
    "La giornata diventa un percorso con orari; «Costo totale» e le tratte si aggiornano quando cambi l'ordine.",
  'help.guide.day-route.tip.1':
    "Per impostazione predefinita i percorsi vengono calcolati con OSRM; l'amministratore può impostare un altro motore di calcolo in «Impostazioni predefinite».",
  'help.guide.day-route.tip.2':
    'Una tratta per cui non è stato possibile calcolare il percorso non mostra il tempo. Controlla che entrambe le tappe abbiano le coordinate.',
  'help.guide.day-route.tip.3': "La freccia Annulla annulla un'ottimizzazione.",
  // manage-days
  'help.guide.manage-days.title': 'Aggiungere, riordinare e rinominare i giorni',
  'help.guide.manage-days.goal': 'Modifica i giorni stessi, non solo i luoghi che contengono.',
  'help.guide.manage-days.step.1':
    "I giorni dipendono dalle date del viaggio. Modifica le date nel modulo di modifica del viaggio nella Dashboard: i giorni vengono aggiunti o rimossi all'inizio o alla fine. Prima di rimuovere un giorno con dei contenuti, un elenco mostra quali giorni verranno rimossi e cosa contengono.",
  'help.guide.manage-days.step.2':
    "«Riordina i giorni» nell'intestazione apre un elenco: trascina un giorno per la maniglia, oppure usa «Sposta su» e «Sposta giù», e il giorno si sposta con luoghi, note e prenotazioni. Sotto l'elenco, «Aggiungi» con la data successiva aggiunge un giorno dopo l'ultimo con data e allunga il viaggio di un giorno; «Senza data» aggiunge in fondo un giorno senza data. Un viaggio senza date ha solo «Aggiungi giorno».",
  'help.guide.manage-days.step.3':
    "«Elimina giorno», il cestino alla fine di una riga, chiede prima conferma. Elenca cosa verrà eliminato con il giorno: luoghi, note e prenotazioni, un soggiorno con check-in o check-out in quel giorno, e i giorni che verranno anticipati di una data. «Elimina giorno» lo rimuove, «Annulla» lo mantiene; l'ultimo giorno non si può eliminare.",
  'help.guide.manage-days.step.4':
    'Per rinominare un giorno, aprilo e clicca sulla matita accanto al titolo nel pannello dei dettagli sopra la mappa. Il nome sostituisce «Giorno 1» nella scheda e nel PDF.',
  'help.guide.manage-days.step.5':
    "«Espandi tutti i giorni» e «Comprimi tutti i giorni» nell'intestazione espandono o comprimono tutte le schede in una volta. Per comprimere una sola scheda, clicca sulla sua freccia.",
  'help.guide.manage-days.result':
    'Le date restano legate alla posizione: se sposti un giorno più in alto, prende la data precedente, e le sue tappe, note e prenotazioni si spostano con lui.',
  'help.guide.manage-days.tip.1':
    "Lo spostamento dei giorni si può annullare con la freccia di annullamento; l'eliminazione di un giorno no.",
  'help.guide.manage-days.tip.2':
    "«Costo totale», in fondo al programma, somma l'intero viaggio; la scheda «Costi» lo suddivide nel dettaglio.",
  // bookings-in-plan
  'help.guide.bookings-in-plan.title': 'Leggere prenotazioni e trasporti nel programma',
  'help.guide.bookings-in-plan.goal':
    'Scopri dove compare una prenotazione dopo averla creata e da quale schermata si crea.',
  'help.guide.bookings-in-plan.step.1':
    "Un trasporto (volo, treno, traghetto, autobus, auto) è una riga colorata in base al tipo, con l'orario e «Partenza» nel giorno in cui parte o «Arrivo» nel giorno in cui arriva; il globo accanto indica il fuso orario, e un volo con scalo ha una riga per ogni tratta. Per un collegamento con il trasporto pubblico, clicca sulla freccia per vederne le linee. Clicca su una riga per aprire la prenotazione; lì puoi modificarla con «Modifica».",
  'help.guide.bookings-in-plan.step.2':
    'Una prenotazione collegata a una tappa (un ristorante, un tour) compare su quella tappa come badge «Prenotazione», con il suo orario. Il badge è verde se confermata e ambra se in attesa. Una prenotazione con un giorno ma senza tappa ha una riga propria nel giorno.',
  'help.guide.bookings-in-plan.step.3':
    "Una notte in hotel è un alloggio: la sua pillola nell'intestazione del giorno è verde il giorno del check-in e rossa il giorno del check-out, e l'icona del biglietto apre la prenotazione. Il pannello dei dettagli del giorno lo elenca sotto «Alloggio», e il percorso di ognuno di quei giorni parte da lì.",
  'help.guide.bookings-in-plan.step.4':
    "Sulla mappa, il pulsante del percorso su una riga di prenotazione ne disegna il tragitto; «Mostra tutti i percorsi prenotati» nell'intestazione li disegna tutti.",
  'help.guide.bookings-in-plan.step.5':
    "Per creare: «Aggiungi prenotazione» su una tappa evidenziata, «Aggiungi trasporto» e «Trasporto pubblico» nel menu + del giorno, e le schede «Prenotazioni» e «Trasporti» per l'elenco completo, con importazione e file.",
  'help.guide.bookings-in-plan.result':
    'Ogni prenotazione compare una sola volta nel programma. Le schede mostrano le stesse prenotazioni sotto forma di elenco.',
  'help.guide.bookings-in-plan.tip.1':
    'Confermata e in attesa sono stati che imposti sulla prenotazione; il programma li mostra sulla tappa, e la scheda «Prenotazioni» le conta entrambe.',
  'help.guide.bookings-in-plan.tip.2':
    "Se rilasci una prenotazione con orario in un altro punto dello stesso giorno, torna nella posizione data dal suo orario. Se la trascini sulla scheda di un altro giorno, si sposta in quel giorno. Per cambiarne l'orario, modifica la prenotazione.",
  // export-plan
  'help.guide.export-plan.title': 'Esportare il programma',
  'help.guide.export-plan.goal': 'Esporta il programma come documento, nel calendario o su un dispositivo GPS.',
  'help.guide.export-plan.step.1': 'Clicca su «Esporta» a sinistra della barra di intestazione sopra i giorni.',
  'help.guide.export-plan.step.2':
    "«Documento»: PDF apre l'anteprima di stampa di tutti i giorni con tappe, note e prenotazioni, preceduta da una mappa panoramica del percorso; «Il mio programma in PDF» include solo ciò a cui partecipi. Nell'anteprima, «Interruzione di pagina per giorno» fa iniziare ogni giorno su una nuova pagina, «Note sui trasporti» aggiunge le note dei tuoi trasporti, e «Salva come PDF» lo scarica.",
  'help.guide.export-plan.step.3':
    'Calendario: «Scarica .ics» salva le prenotazioni in un file di calendario; «Abbonati al calendario» ti dà un link che la tua app di calendario aggiorna automaticamente.',
  'help.guide.export-plan.step.4':
    '«Mappe e GPS» (GPX): «Tutto il viaggio» esporta luoghi, percorsi dei giorni e tracce; «Solo i luoghi» solo i segnaposto; «Giorni come itinerari» un percorso per giorno, per mappe offline e dispositivi GPS.',
  'help.guide.export-plan.result': 'Il file viene scaricato; nel viaggio non cambia nulla.',
  'help.guide.export-plan.tip.1':
    "Per aprire un singolo giorno in un'app di mappe, usa la sua barra del percorso: «Apri in Google Maps» o «Apri in CoMaps».",
  'help.guide.export-plan.tip.2':
    '«Abbonati al calendario» richiede che i feed del calendario siano attivi nelle tue impostazioni e che tu abbia il permesso di condividere il viaggio; trovi una guida nella sezione Dashboard.',
  'help.guide.export-plan.tip.3':
    "Per esportare basta l'accesso in lettura: ogni membro del viaggio può esportare il PDF, il file .ics e il GPX.",

  // ── Screen: trip-place ────────────────────────────────────────────────────────────────
  'help.ctx.trip-place.title': 'Dettagli del luogo',
  'help.ctx.trip-place.summary':
    "La scheda che si apre sopra la mappa quando scegli un luogo: tutto ciò che il viaggio sa del luogo, le valutazioni in stelle di tutti, l'immagine e i file, e i pulsanti per aggiungerlo al giorno aperto, aprirlo in un'app di mappe o salvarlo in una lista.",
  'help.ctx.trip-place.bullet.1':
    "Clicca su una riga nella colonna dei luoghi, su una tappa in un giorno o su un segnaposto sulla mappa: la scheda si apre sopra la mappa. Se la apri da un giorno, la scheda sa a quale tappa ti riferisci e mostra anche i partecipanti e la prenotazione della tappa. Un'escursione (a piedi, in bici o una passeggiata dalla scheda «Escursioni») apre invece la propria scheda dell'escursione.",
  'help.ctx.trip-place.bullet.2':
    "L'intestazione mostra l'immagine rotonda, il nome, l'indirizzo su una riga e le etichette con le informazioni disponibili: aperto o chiuso, categoria, orario, prezzo, numero di telefono, email e coordinate. Clicca sull'immagine per usarne una tua o una foto tra i file del luogo. Fai doppio clic sul nome per rinominare il luogo. La X a destra chiude la scheda. Immagine, rinomina, «Modifica» ed «Elimina» sono disponibili solo per chi può modificare i luoghi.",
  'help.ctx.trip-place.bullet.3':
    'Sotto trovi le stelle che ogni viaggiatore ha dato al luogo, la descrizione, le note e, se la tappa le ha, le «Note per questo giorno».',
  'help.ctx.trip-place.bullet.4':
    "Seguono, se presenti, «Orari di apertura», «Colore del percorso», «Dati del percorso» e «File». «Carica», nel titolo «File», aggiunge file dal computer, e l'elenco mostra anche i file fissati a questa tappa e quelli della sua prenotazione, compresa la conferma di un hotel. I plugin possono aggiungere righe proprie più sotto.",
  'help.ctx.trip-place.bullet.5':
    'La riga in fondo: «Aggiungi al giorno» o «Rimuovi dal giorno» quando un giorno è aperto, poi «Navigazione» (o il nome della tua app di mappe, se ne hai scelta una in «Impostazioni»), «Apri sito web» e «Salva nella raccolta». A destra, il cestino rosso elimina il luogo e «Modifica» ne apre il modulo.',
  'help.ctx.trip-place.bullet.6':
    "Un luogo scelto dalla ricerca mostra ciò che l'indice TREK o OpenStreetMap sanno di lui: «Aperto» o «Chiuso» tra le pillole in alto, con un anello verde o rosso intorno all'immagine, in base all'ora locale del luogo; il numero di telefono, anche come pillola; più in basso gli «Orari di apertura», con gli orari di oggi nella riga e l'intera settimana con un clic; e il sito web sotto «Apri sito web». La valutazione di Google compare solo per i luoghi trovati tramite Google, su un TREK con una chiave Google. Orari di apertura, numero di telefono ed email che hai inserito tu nel modulo del luogo sostituiscono quelli trovati e determinano anche il colore dell'anello.",
  // read-place
  'help.guide.read-place.title': 'Cosa ti dice la scheda di un luogo',
  'help.guide.read-place.goal': "Leggi in un'unica scheda tutto ciò che il viaggio sa di un luogo.",
  'help.guide.read-place.step.1':
    'Nella colonna dei giorni, clicca sulla tappa che vuoi consultare. La scheda si apre sopra la mappa e la tappa resta evidenziata nel suo giorno.',
  'help.guide.read-place.step.2':
    "In alto: l'immagine rotonda, il nome e l'indirizzo su una riga; il suggerimento mostra l'indirizzo completo. Le pillole sotto indicano se in questo momento è «Aperto» o «Chiuso», in base all'ora locale del luogo, con un anello verde o rosso intorno all'immagine. Mostrano anche categoria, orario, numero di telefono ed email (cliccali per aprire l'app del telefono o della posta) e, su uno schermo largo, le coordinate esatte. La X a destra chiude la scheda.",
  'help.guide.read-place.step.3':
    "«Valutazione» è la prima sezione sotto l'intestazione: le stelle che ogni viaggiatore ha dato al luogo, con la media e il numero di voti. Finché nessuno ha votato, compare «Non ancora valutato».",
  'help.guide.read-place.step.4':
    'Poi la descrizione e, sotto, le note. Entrambe riportano il testo del modulo del luogo con la formattazione: elenchi, link e grassetto funzionano.',
  'help.guide.read-place.step.5':
    '«Partecipanti» mostra chi va a questa tappa. Partecipano tutti finché non rimuovi qualcuno.',
  'help.guide.read-place.step.6':
    "«Orari di apertura», più in basso: la riga mostra gli orari del giorno che stai guardando. Cliccala per vedere tutta la settimana, con quel giorno in grassetto. Accanto c'è «File».",
  'help.guide.read-place.result':
    'La scheda resta aperta finché non la chiudi con la X o scegli un altro luogo. Gli orari di apertura della settimana restano espansi, e la tappa a cui appartiene resta evidenziata nella colonna dei giorni.',
  'help.guide.read-place.tip.1':
    "Se scegli il luogo dalla colonna dei luoghi, la scheda mostra il luogo ma non la tappa: quindi niente partecipanti e solo le prenotazioni legate al luogo stesso, come il soggiorno di un hotel. Scegli la tappa all'interno del giorno per vedere tutto.",
  'help.guide.read-place.tip.2':
    'Se puoi modificare i luoghi, fai doppio clic sul nome per rinominare il luogo senza aprire il modulo. Invio salva, Esc annulla la modifica.',
  'help.guide.read-place.tip.3':
    'Un luogo inserito a mano ha solo i dati inseriti nel suo modulo. Clicca su «Modifica» e compila tu «Telefono», email e orari di apertura, oppure scegli il luogo tra i suggerimenti di «Cerca luoghi…» e clicca su «Aggiorna» per farli cercare. La valutazione di Google richiede una chiave Google.',
  // rate-place
  'help.guide.rate-place.title': 'Valutare un luogo',
  'help.guide.rate-place.goal': 'Assegna a un luogo le tue stelle, e vedi le valutazioni date da tutti gli altri.',
  'help.guide.rate-place.step.1':
    "Apri il luogo. La fila di stelle si trova subito sotto l'intestazione e mostra la media dei voti finora, con il numero di voti tra parentesi.",
  'help.guide.rate-place.step.2':
    'Clicca la stella che vuoi. Le stelle si riempiono mentre ci passi sopra con il puntatore, così vedi quale valutazione stai per dare.',
  'help.guide.rate-place.step.3':
    'Il tuo voto viene subito aggiunto alla media e le foto profilo accanto mostrano chi ha votato. Passa il mouse sulla riga per vedere le stelle di tutti.',
  'help.guide.rate-place.step.4':
    'La stessa media compare sulla riga del luogo nella colonna dei luoghi, così trovi facilmente i luoghi migliori nella lista.',
  'help.guide.rate-place.result':
    "Tutti i partecipanti al viaggio vedono le tue stelle sul luogo. La stella nella riga dei filtri sopra l'elenco ora permette di mostrare solo i luoghi con una valutazione minima.",
  'help.guide.rate-place.tip.1':
    'Ogni viaggiatore può dare una valutazione, anche in un viaggio in cui solo alcuni possono modificare i luoghi.',
  'help.guide.rate-place.tip.2':
    'Clicca sulla stella che hai già dato per togliere la tua valutazione. Se nessuno ha valutato il luogo, compare di nuovo «Non ancora valutato».',
  'help.guide.rate-place.tip.3':
    'Accanto alle stelle compaiono le foto profilo di massimo sei votanti. Il tooltip li elenca tutti ed evidenzia te.',
  // place-image
  'help.guide.place-image.title': 'Mettere una tua immagine su un luogo',
  'help.guide.place-image.goal': 'Sostituisci la miniatura automatica con una tua foto.',
  'help.guide.place-image.step.1': 'Apri il luogo dalla colonna dei luoghi.',
  'help.guide.place-image.step.2':
    "Punta l'immagine rotonda nell'intestazione: compare una fotocamera e il suggerimento indica «Carica immagine». Cliccala e scegli il file. Se il luogo ha già delle foto tra i suoi file, TREK ti chiede prima di scegliere: «Carica dal dispositivo», oppure una delle immagini sotto «Dai file allegati».",
  'help.guide.place-image.step.3':
    "In cima alla scheda ora compare la tua immagine, con una piccola X rossa nell'angolo.",
  'help.guide.place-image.step.4':
    'La stessa immagine compare anche nella riga del luogo nella colonna dei luoghi, e sul suo segnaposto sulla mappa.',
  'help.guide.place-image.result':
    'La tua immagine viene usata per il luogo ovunque: nella scheda, nella colonna dei luoghi, nella tappa del giorno, nel segnaposto sulla mappa e in un viaggio condiviso.',
  'help.guide.place-image.tip.1':
    "Sono accettati JPG, PNG, GIF e WebP; le foto HEIC dell'iPhone vengono convertite durante il caricamento.",
  'help.guide.place-image.tip.2':
    "La X nell'angolo rimuove la tua immagine e torna quella automatica. Il luogo non cambia.",
  'help.guide.place-image.tip.3':
    "Se non hai aggiunto un'immagine, TREK ne cerca una in base alle coordinate del luogo. Se non ne trova, mostra l'icona della categoria. Solo chi può modificare i luoghi può impostarne una.",
  // place-day-assign
  'help.guide.place-day-assign.title': 'Aggiungere il luogo al giorno aperto o toglierlo',
  'help.guide.place-day-assign.goal': 'Usa il pulsante sulla scheda invece di trascinare la riga nel pianificatore.',
  'help.guide.place-day-assign.step.1':
    "Clicca sull'intestazione di un giorno nella colonna dei giorni. Quel giorno diventa il giorno aperto, e la scheda si riferisce a lui.",
  'help.guide.place-day-assign.step.2':
    'Nella colonna dei luoghi, clicca su un luogo che non è in quel giorno. Si apre la sua scheda, e la riga in fondo offre «Aggiungi al giorno».',
  'help.guide.place-day-assign.step.3':
    'Clicca su «Aggiungi al giorno». La tappa viene aggiunta in fondo al giorno e il pulsante diventa «Rimuovi dal giorno».',
  'help.guide.place-day-assign.step.4':
    "La tappa ora è nel giorno, in fondo all'elenco. Trascinala in alto nella posizione giusta.",
  'help.guide.place-day-assign.step.5':
    '«Rimuovi dal giorno» toglie di nuovo la tappa dal giorno e la scheda torna a mostrare «Aggiungi al giorno».',
  'help.guide.place-day-assign.result': 'La tappa viene aggiunta al giorno o rimossa. Il luogo in sé non cambia.',
  'help.guide.place-day-assign.tip.1':
    "Il pulsante c'è solo quando è aperto un giorno. Senza un giorno aperto, non c'è un giorno a cui aggiungere il luogo.",
  'help.guide.place-day-assign.tip.2':
    'Se togli una tappa da un giorno, il luogo resta nel viaggio e nella colonna dei luoghi. «Elimina» lo rimuove ovunque.',
  'help.guide.place-day-assign.tip.3':
    'Una tappa aggiunta al giorno da una prenotazione di alloggio non mostra nessuno dei due pulsanti. Quella notte si aggiunge e si toglie nella sezione del pernottamento del giorno.',
  // place-participants
  'help.guide.place-participants.title': 'Indicare chi partecipa a questa tappa',
  'help.guide.place-participants.goal':
    'Scegli chi partecipa a una singola tappa senza cambiare chi fa parte del viaggio.',
  'help.guide.place-participants.step.1':
    "Clicca la tappa all'interno del giorno. Si apre la scheda e «Partecipanti» elenca tutte le persone del viaggio.",
  'help.guide.place-participants.step.2':
    'Clicca il chip di un viaggiatore per toglierlo da questa tappa. Quando ci passi sopra con il mouse, il nome appare barrato.',
  'help.guide.place-participants.step.3':
    'Appena manca qualcuno, compare un + tratteggiato. Cliccalo per vedere chi non partecipa alla tappa.',
  'help.guide.place-participants.step.4':
    'Clicca su un nome per aggiungere di nuovo quella persona. Quando sono state aggiunte di nuovo tutte, la tappa torna a essere di tutto il gruppo.',
  'help.guide.place-participants.result':
    'La tappa mostra solo i viaggiatori che hai scelto. Il resto del gruppo è libero in quel momento.',
  'help.guide.place-participants.tip.1':
    "«Partecipanti» compare solo quando è selezionata una tappa, quindi scegli il luogo all'interno del giorno, non nella colonna dei luoghi. Compare inoltre solo nei viaggi con più di un viaggiatore.",
  'help.guide.place-participants.tip.2':
    "Se non scegli nessuno, partecipano tutti. Per questo non puoi rimuovere l'ultimo viaggiatore da una tappa.",
  'help.guide.place-participants.tip.3':
    'Anche un ospite, che non ha un account proprio, può partecipare come chiunque altro.',
  // place-booking
  'help.guide.place-booking.title': 'La prenotazione di una tappa',
  'help.guide.place-booking.goal': 'Visualizza la prenotazione di una tappa, aprila e collegane una nuova.',
  'help.guide.place-booking.step.1':
    'Apri la tappa a cui appartiene la prenotazione. La scheda la elenca sotto «Prenotazioni» come piccola scheda a sé, con il nome della prenotazione e «Confermata» o «In attesa».',
  'help.guide.place-booking.step.2':
    'La scheda della prenotazione mostra «Data», «Ora» e «Codice prenotazione», le etichette con gli altri dettagli della prenotazione (numero di volo, binario, check-in) ed eventuali note.',
  'help.guide.place-booking.step.3': 'Clicca sulla scheda della prenotazione: la prenotazione si apre sopra la mappa.',
  'help.guide.place-booking.step.4':
    "«Modifica», in fondo alla prenotazione, apre il suo modulo. Lì, «Collega all'assegnazione del giorno» collega una prenotazione a una tappa, e mostra già questa tappa. Chiudi di nuovo il modulo.",
  'help.guide.place-booking.step.5':
    "Una nuova prenotazione per una tappa si crea dalla colonna dei giorni: passa il mouse sulla tappa e clicca «Aggiungi prenotazione», l'icona del biglietto in fondo alla riga. Il modulo si apre come «Nuova prenotazione», già collegato alla tappa.",
  'help.guide.place-booking.result':
    'La prenotazione è collegata alla tappa: compare sulla scheda e nel giorno, e i suoi file sono elencati anche qui in «File».',
  'help.guide.place-booking.tip.1':
    "Una prenotazione compare sulla tappa a cui è fissata, e la prenotazione di un hotel compare anche sull'hotel, ovunque lo apri. Una prenotazione senza tappa compare nella scheda «Prenotazioni».",
  'help.guide.place-booking.tip.2':
    'Più prenotazioni possono condividere la stessa tappa, ad esempio un pranzo e un tour che partono dallo stesso posto.',
  'help.guide.place-booking.tip.3':
    'Per un treno, un volo o un traghetto, «Modifica» apre invece il modulo del trasporto, lo stesso della scheda «Trasporti».',
  // place-files
  'help.guide.place-files.title': 'Tenere i biglietti di un luogo insieme al luogo',
  'help.guide.place-files.goal': 'Allega il biglietto, il voucher o la mappa al luogo a cui si riferiscono.',
  'help.guide.place-files.step.1':
    'Apri il luogo. «File» si trova sotto i dettagli, accanto a «Orari di apertura» se il luogo li ha, e mostra «File» finché il luogo non ne ha.',
  'help.guide.place-files.step.2': 'Clicca su «Carica» a destra del titolo «File» e scegli il file.',
  'help.guide.place-files.step.3': "Il pulsante indica quanti file ha il luogo, e l'elenco si apre automaticamente.",
  'help.guide.place-files.step.4': 'Ogni riga mostra nome e dimensione del file. Cliccala per aprire il file.',
  'help.guide.place-files.result':
    'Il file viene allegato al luogo e conteggiato sulla scheda. Compare anche nella scheda «File» del viaggio.',
  'help.guide.place-files.tip.1':
    "«File» elenca anche ciò che è fissato a questa tappa e ciò che è allegato alla sua prenotazione, così la conferma dell'hotel compare sull'hotel.",
  'help.guide.place-files.tip.2':
    "«Carica» accetta più file insieme, e una delle foto può diventare l'immagine del luogo.",
  'help.guide.place-files.tip.3':
    'Se non hai il permesso di caricare file, il pulsante «Carica» non compare; i file già presenti sul luogo restano visibili.',
  // place-navigation
  'help.guide.place-navigation.title': "Aprire un luogo in un'app di mappe o sul suo sito web",
  'help.guide.place-navigation.goal': "Apri il luogo nell'app di navigazione che usi per arrivarci.",
  'help.guide.place-navigation.step.1': 'Apri il luogo e clicca su «Navigazione» nella riga in fondo.',
  'help.guide.place-navigation.step.2':
    "L'elenco contiene le app di mappe adatte a questo luogo: Google Maps, Waze, Apple Maps, OpenStreetMap e CoMaps, più «Altra app di mappe» su Android.",
  'help.guide.place-navigation.step.3':
    "Clicca su quella che usi. Quando possibile, TREK invia all'app il luogo stesso e non solo le coordinate, così arrivi all'ingresso giusto.",
  'help.guide.place-navigation.step.4':
    '«Apri sito web», lì accanto, apre in una nuova scheda il sito del luogo, con orari e biglietti.',
  'help.guide.place-navigation.result':
    "L'app di mappe si apre sul luogo, il sito web si apre in una nuova scheda, e nel viaggio non cambia nulla. Se TREK è installato come app, si apre l'app di mappe invece di una nuova scheda.",
  'help.guide.place-navigation.tip.1':
    'Waze avvia subito la navigazione. Le altre app aprono il luogo e devi toccare ancora una volta per avviarla.',
  'help.guide.place-navigation.tip.2':
    'Le app proposte dipendono dal luogo e dal dispositivo: Apple Maps non è disponibile su Android, 高德地图 compare solo per i luoghi in Cina, e Waze, Apple Maps e CoMaps richiedono le coordinate del luogo. «Altra app di mappe» apre il luogo in qualsiasi app di mappe del tuo telefono Android.',
  'help.guide.place-navigation.tip.3':
    'Scegli una volta la tua app di mappe in «Impostazioni», sotto «Apri i luoghi in». Il pulsante mostrerà il suo nome e la aprirà subito. Succede lo stesso quando per un luogo è disponibile una sola app.',
  // place-to-collection
  'help.guide.place-to-collection.title': 'Salvare un luogo in una delle tue liste',
  'help.guide.place-to-collection.goal': 'Salva un luogo scoperto in questo viaggio per il prossimo.',
  'help.guide.place-to-collection.step.1':
    'Apri il luogo e clicca su «Salva nella raccolta» nella riga in fondo alla scheda.',
  'help.guide.place-to-collection.step.2':
    '«Salva in una lista» mostra tutte le liste di cui sei proprietario o che condividi. Un segnalibro pieno a destra indica le liste che contengono già questo luogo.',
  'help.guide.place-to-collection.step.3': 'Clicca la lista. Il luogo viene aggiunto subito.',
  'help.guide.place-to-collection.step.4':
    'Chiudi la finestra con la X: il pulsante nella scheda ora mostra «Salvato».',
  'help.guide.place-to-collection.result':
    'Il luogo è nella tua lista con immagine, note e indirizzo, pronto per il prossimo viaggio.',
  'help.guide.place-to-collection.tip.1':
    "Il pulsante compare solo se il modulo Raccolte è attivo; l'amministratore lo attiva in «Moduli».",
  'help.guide.place-to-collection.tip.2':
    "Un luogo può stare in più liste insieme, con uno stato diverso in ciascuna: un'idea in una, visitato in un'altra.",
  'help.guide.place-to-collection.tip.3':
    '«Segna come visitato», sotto il nome del luogo in cima al selettore, segna il luogo come visitato nella lista. Se il luogo si trova in più liste, il pulsante mostra «Visitato ovunque» e lo segna in tutte in una volta. «Vista» apre le tue liste in «Raccolte».',
  // place-track
  'help.guide.place-track.title': 'Leggere una traccia e darle un colore',
  'help.guide.place-track.goal':
    'Scopri quanto è lunga una camminata importata e quale linea sulla mappa le corrisponde.',
  'help.guide.place-track.step.1':
    'Nella colonna dei luoghi, la riga di una traccia mostra una breve linea del colore della traccia sulla mappa. Cliccala.',
  'help.guide.place-track.step.2':
    "«Dati del percorso» indica la lunghezza del tracciato, nell'unità di misura che hai impostato.",
  'help.guide.place-track.step.3':
    '«Colore del percorso», sopra, mostra il colore in uso. Clicca sulla riga per aprire i campioni di colore.',
  'help.guide.place-track.step.4':
    'Scegli un colore: la linea sulla mappa e il tratto nella riga cambiano di conseguenza.',
  'help.guide.place-track.step.5':
    'La casella tratteggiata a sinistra, «Colore automatico», riporta la traccia al colore predefinito. Il contagocce a destra apre il selettore di colori del sistema per scegliere qualsiasi altro colore.',
  'help.guide.place-track.result':
    'La traccia viene disegnata nel colore scelto: nella scheda, nella sua riga della colonna dei luoghi e sulla mappa.',
  'help.guide.place-track.tip.1':
    "Solo un luogo con un tracciato ha queste due sezioni: un luogo importato da un file GPX, KML o KMZ prima dell'arrivo di Escursioni, oppure su un TREK in cui Escursioni è disattivato. Con Escursioni attivo, un nuovo file GPX diventa un'escursione, che apre la propria scheda dell'escursione.",
  'help.guide.place-track.tip.2':
    "Una traccia registrata con l'altitudine mostra anche il punto più alto e quello più basso, i metri di salita e di discesa e il profilo altimetrico.",
  'help.guide.place-track.tip.3':
    "Un'importazione assegna un colore diverso a ogni traccia che aggiunge, così due camminate non hanno mai lo stesso colore.",
  // read-place
  'help.guide.read-place.step.7':
    "La riga in fondo raccoglie ciò che puoi fare da qui: aggiungere il luogo al giorno aperto o toglierlo, aprirlo in un'app di mappe o sul suo sito web, salvarlo in una lista e, a destra, eliminarlo (il cestino rosso) o modificarlo.",

  // ── Screen: trip-files ────────────────────────────────────────────────────────────────
  'help.ctx.trip-files.title': 'File',
  'help.ctx.trip-files.summary':
    'Tutti i documenti del viaggio in un unico elenco: biglietti, conferme, pass e immagini. Ognuno ha una nota, un collegamento al luogo o alla prenotazione a cui appartiene e un cestino da cui puoi ripristinarlo.',
  'help.ctx.trip-files.bullet.1':
    "«Trascina qui i file», il riquadro tratteggiato sotto la barra, accetta i file che ci rilasci sopra. Un clic sul riquadro apre la scelta dei file. Il riquadro indica i tipi di file accettati da questo TREK e il limite per file (Max 50 MB, salvo diversa impostazione dell'amministratore).",
  'help.ctx.trip-files.bullet.2':
    'La barra in alto contiene «File» e le schede di filtro «Tutti», PDF, «Immagini» e «Documenti», ciascuna con il suo conteggio. Una scheda con la stella compare dopo «Tutti» appena un file viene aggiunto ai preferiti, e una scheda «Note Collaborazione» compare in fondo appena una nota ha un allegato.',
  'help.ctx.trip-files.bullet.3':
    "Una riga mostra una miniatura o il tipo di file, chi l'ha caricato, il nome, la nota sotto, la dimensione e la data, e un badge per ogni collegamento: il luogo, la prenotazione o il trasporto con il suo nome (passaci sopra con il mouse per vedere «Programma giornaliero», «Prenotazione» o «Trasporti»), e «Da Note Collaborazione».",
  'help.ctx.trip-files.bullet.4':
    'Alla fine di una riga ci sono fino a cinque icone, ciascuna con il suo nome quando la punti: «Aggiungi ai preferiti», «Assegna» (la matita), «Aperto», «Scarica» ed «Elimina». «Elimina» non chiede conferma: il file va nel cestino, da cui puoi ripristinarlo. Offline, note, link, preferiti e cestino funzionano comunque e vengono inviati quando TREK torna online; servono una connessione solo per caricare file e rimuovere un ulteriore collegamento.',
  'help.ctx.trip-files.bullet.5':
    "Un'immagine o un video si apre a schermo intero, con i tasti freccia e una fila di miniature. Ogni altro documento si apre in una finestra con il nome in alto e, sotto, «Apri in una nuova scheda» e «Scarica». Un pass per il wallet viene scaricato subito.",
  'help.ctx.trip-files.bullet.6':
    "L'icona del cestino all'estremità destra della barra («Cestino») mostra i file eliminati. Lì puoi ripristinarli uno per uno o eliminarli definitivamente, mentre «Svuota cestino» nella barra li elimina tutti. «Sincronizzazione documenti» si trova a sinistra dell'icona del cestino quando il viaggio è collegato a un archivio di documenti, oppure, per il proprietario del viaggio o un amministratore, non appena un archivio viene attivato.",
  // files-upload
  'help.guide.files-upload.title': 'Aggiungere un documento al viaggio',
  'help.guide.files-upload.goal':
    'Carica nel viaggio un biglietto, una conferma o una foto dalla cartella dei download, così tutti i partecipanti possono aprirli.',
  'help.guide.files-upload.step.1':
    "Apri il viaggio e clicca «File» nella barra delle schede. Lì trovi l'elenco dei documenti del viaggio, con il riquadro di caricamento sopra.",
  'help.guide.files-upload.step.2':
    "Clicca su «Trascina qui i file» e scegli uno o più file. Vengono caricati uno dopo l'altro e, durante il caricamento, il riquadro mostra «Caricamento...». All'interno del riquadro, sotto «oppure clicca per sfogliare», trovi i tipi di file accettati da questo TREK e la dimensione massima di un file.",
  'help.guide.files-upload.step.3':
    "Al termine del caricamento dell'ultimo file, per quel file si apre automaticamente «Assegna file» (se il viaggio ha luoghi o prenotazioni), con il nome del file in cima alla finestra. «Aggiungi una nota...», sotto «Nota», aggiunge una nota al file, e gli elenchi sotto lo collegano a un luogo o a una prenotazione. Chiudi con la × in alto a destra; chiudendo non perdi nulla.",
  'help.guide.files-upload.step.4':
    "I nuovi file compaiono in cima all'elenco; sopra di loro ci sono solo i file preferiti. Una riga mostra chi ha caricato il file, il nome, la dimensione e la data. Un'immagine ha una miniatura, ogni altro file mostra il suo tipo.",
  'help.guide.files-upload.result':
    'I documenti sono nel viaggio, e chiunque possa vedere il viaggio può aprirli e scaricarli.',
  'help.guide.files-upload.tip.1':
    'Puoi anche trascinare un file dal desktop direttamente nel riquadro, che si evidenzia mentre il file ci passa sopra.',
  'help.guide.files-upload.tip.2':
    "Premi Ctrl+V per aggiungere all'elenco un'immagine dagli appunti, così non devi prima salvare lo screenshot di una prenotazione.",
  'help.guide.files-upload.tip.3':
    "Per caricare serve il permesso di caricare file; senza, il riquadro non compare proprio. Un tipo di file non presente nell'elenco viene rifiutato con un messaggio e non viene caricato nulla. Un file oltre il limite (50 MB, salvo diversa impostazione dell'amministratore) viene rifiutato prima dell'invio, e il messaggio indica il limite. Per caricare serve anche una connessione: offline, TREK te lo segnala e non carica nulla.",
  // files-link
  'help.guide.files-link.title': 'Collegare un documento a un luogo o a una prenotazione',
  'help.guide.files-link.goal': 'Trova facilmente il biglietto dal giorno a cui appartiene, non solo da questo elenco.',
  'help.guide.files-link.step.1':
    'Clicca sulla matita alla fine della riga («Assegna»). Si apre «Assegna file», con il nome del file in cima alla finestra.',
  'help.guide.files-link.step.2':
    "Sotto «Nota», «Aggiungi una nota...» accetta una riga, che poi compare sotto il nome del file nell'elenco. Viene salvata quando premi Invio o esci dal campo.",
  'help.guide.files-link.step.3':
    'Sotto «Luogo», a sinistra, vedi i luoghi del viaggio raggruppati per giorno con la data, e in fondo «Non assegnato» per i luoghi che non sono in nessun giorno. Cliccane uno per spuntarlo.',
  'help.guide.files-link.step.4':
    'In «Prenotazione e Trasporto», a destra, trovi le prenotazioni del viaggio. Clicca quella a cui appartiene il documento: anche lei riceve una spunta.',
  'help.guide.files-link.step.5':
    "Chiudi con la × in alto a destra. Qui non c'è un pulsante per salvare: ogni clic viene salvato subito.",
  'help.guide.files-link.result':
    'La riga mostra la nota e un badge per ogni collegamento: uno con il nome del luogo e uno con il nome del volo. Passando il mouse su un badge compare «Programma giornaliero» o «Trasporti». Il documento viene allegato anche al luogo e al volo.',
  'help.guide.files-link.tip.1':
    "Un file può avere più collegamenti, quindi la stessa conferma può appartenere sia alla prenotazione dell'hotel sia al luogo dell'hotel.",
  'help.guide.files-link.tip.2':
    'Clicca di nuovo su una voce spuntata per rimuovere quel collegamento; il file resta. Offline, la nota e le nuove spunte vengono salvate e inviate quando TREK torna online; solo la rimozione di un altro collegamento richiede una connessione.',
  'help.guide.files-link.tip.3':
    'Funziona anche al contrario: un documento allegato a un luogo o a una prenotazione compare anche in questo elenco, con lo stesso badge nella sua riga.',
  // files-star
  'help.guide.files-star.title': 'Tenere in cima i documenti importanti',
  'help.guide.files-star.goal':
    'Segna i pochi documenti che ti serviranno davvero, per ritrovarli subito in un lungo elenco.',
  'help.guide.files-star.step.1':
    'Clicca la stella alla fine di una riga («Aggiungi ai preferiti»). Diventa dorata, compare una seconda stella davanti al nome del file e, passandoci sopra con il mouse, il pulsante ora indica «Rimuovi dai preferiti».',
  'help.guide.files-star.step.2':
    "L'elenco viene riordinato: i file preferiti compaiono sopra tutti gli altri e, in ogni gruppo, i più recenti vengono prima.",
  'help.guide.files-star.step.3':
    'Ora nelle schede dei filtri della barra, subito dopo «Tutti», compare una stella con accanto il numero di file preferiti. Cliccala per vedere solo quei file.',
  'help.guide.files-star.result': "I file preferiti compaiono in cima all'elenco e una scheda mostra solo quelli.",
  'help.guide.files-star.tip.1':
    "La scheda con la stella esiste solo finché c'è un file tra i preferiti. Quando togli dai preferiti l'ultimo file, la scheda sparisce.",
  'help.guide.files-star.tip.2':
    "Per i preferiti serve lo stesso permesso di «Assegna», «Modificare metadati dei file». Un membro che non ce l'ha vede le stelle, ma per lui un clic su «Aggiungi ai preferiti» non ha effetto.",
  // files-filter
  'help.guide.files-filter.title': "Trovare un documento nell'elenco",
  'help.guide.files-filter.goal': 'Mostra solo il tipo di documento che stai cercando.',
  'help.guide.files-filter.step.1':
    'Le schede dei filtri si trovano nella barra in alto, accanto a «File»: «Tutti», «PDF», «Immagini» e «Documenti», ognuna con il numero di file.',
  'help.guide.files-filter.step.2': "Clicca «PDF»: l'elenco mostra solo i file PDF.",
  'help.guide.files-filter.step.3':
    "Altre due schede compaiono solo se il viaggio contiene file corrispondenti. Clicca «Note Collaborazione», che compare appena una nota nella scheda Collaborazione ha un allegato: l'elenco mostra solo quei file. Allo stesso modo compare una scheda con la stella, appena un file viene aggiunto ai preferiti.",
  'help.guide.files-filter.step.4': "«Tutti» mostra di nuovo l'intero elenco.",
  'help.guide.files-filter.result':
    "L'elenco mostra solo i file della scheda selezionata, e il conteggio su ogni scheda indica quanti sono.",
  'help.guide.files-filter.tip.1':
    'Qui non ci sono cartelle e non puoi rinominare i file. Per distinguere i documenti, usa la nota in «Assegna file», i collegamenti a luoghi e prenotazioni, e la stella.',
  'help.guide.files-filter.tip.2':
    "L'elenco mostra sempre prima i preferiti e poi i più recenti, quindi un documento caricato oggi compare sopra uno del mese scorso.",
  // files-preview
  'help.guide.files-preview.title': 'Leggere un documento senza uscire da TREK',
  'help.guide.files-preview.goal':
    "Guarda subito un biglietto o un'immagine e scaricali sul dispositivo quando ti servono.",
  'help.guide.files-preview.step.1':
    "Clicca sul nome o sulla miniatura di un'immagine. Si apre a schermo intero, con in alto a sinistra il nome del file e la sua posizione tra le immagini. Un video si apre allo stesso modo e viene riprodotto lì.",
  'help.guide.files-preview.step.2':
    "Usa le frecce rotonde ai lati, i tasti freccia sinistra e destra o la striscia di miniature in basso per scorrere tutte le immagini attualmente mostrate nell'elenco.",
  'help.guide.files-preview.step.3':
    "«Apri in una nuova scheda» e «Scarica» sono i pulsanti rotondi in alto a destra, accanto alla ×. Clicca sulla ×, premi Esc o clicca sullo sfondo scuro per chiudere l'immagine.",
  'help.guide.files-preview.step.4':
    "Un documento che non è un'immagine si apre invece in una finestra: il nome in alto, sotto «Apri in una nuova scheda» e «Scarica» come pillole e, per un PDF, la pagina stessa più in basso. La × in alto a destra, Esc o un clic fuori dalla finestra la chiude.",
  'help.guide.files-preview.step.5':
    'La freccia in fondo a una riga («Scarica») salva il file direttamente sul tuo dispositivo, senza aprirlo.',
  'help.guide.files-preview.result':
    'Il documento viene mostrato sullo schermo e con gli stessi due pulsanti puoi aprirlo in una scheda del browser o salvarlo sul disco.',
  'help.guide.files-preview.tip.1': 'Sui touch screen scorri le immagini con il dito invece di cliccare le frecce.',
  'help.guide.files-preview.tip.2':
    "Un pass per il wallet non apre mai un'anteprima. Viene scaricato subito, così il telefono può aprirlo nella sua app wallet.",
  'help.guide.files-preview.tip.3':
    '«Apri in una nuova scheda» e «Scarica» caricano il file con la tua sessione, quindi un link copiato dalla barra degli indirizzi non funziona per nessun altro.',
  // files-trash
  'help.guide.files-trash.title': 'Eliminare un documento e ripristinarlo',
  'help.guide.files-trash.goal': 'Elimina ciò che non serve più al viaggio, e ripristina i file che ti servono ancora.',
  'help.guide.files-trash.step.1':
    "Clicca sul cestino in fondo a una riga («Elimina»). Il file sparisce subito dall'elenco e compare il messaggio «Spostato nel cestino». Non viene chiesta conferma.",
  'help.guide.files-trash.step.2':
    "L'icona del cestino all'estremità destra della barra («Cestino») mostra i file eliminati. Il titolo della barra diventa «Cestino» e le schede dei filtri e il riquadro di caricamento vengono nascosti.",
  'help.guide.files-trash.step.3':
    'Le righe nel cestino sono in grigio e hanno due icone: «Ripristina», che recupera il file, ed «Elimina», che lo elimina definitivamente dopo una conferma.',
  'help.guide.files-trash.step.4':
    'Clicca «Ripristina». Compare il messaggio «File ripristinato» e il file esce dal cestino. Nota e collegamenti vengono mantenuti.',
  'help.guide.files-trash.step.5':
    "«Svuota cestino», nella barra accanto all'icona del cestino, elimina definitivamente tutto ciò che è ancora nel cestino. Prima il browser chiede una conferma. L'icona del cestino torna poi all'elenco dei file.",
  'help.guide.files-trash.result': "Il file è di nuovo nell'elenco, dov'era prima.",
  'help.guide.files-trash.tip.1':
    '«Elimina» su una riga non chiede conferma. Per questo esiste il cestino: nulla viene rimosso da TREK finché non lo elimini da qui. Tutto questo funziona anche offline, e le modifiche vengono inviate quando TREK torna online.',
  'help.guide.files-trash.tip.2':
    "Per eliminare e ripristinare un file serve il permesso di eliminare file. Un membro che non ce l'ha non vede né «Elimina» sulla riga né i pulsanti nel cestino.",
  'help.guide.files-trash.tip.3': 'Un file eliminato definitivamente dal cestino non si può più recuperare.',
  // files-sync
  'help.guide.files-sync.title': 'Sincronizzare i documenti con il tuo archivio',
  'help.guide.files-sync.goal':
    'Collega il viaggio al tuo archivio di documenti, così i file caricati qui vengono salvati lì e quelli salvati lì compaiono qui.',
  'help.guide.files-sync.step.1':
    "Clicca «Sincronizzazione documenti», accanto all'icona del cestino all'estremità destra della barra. Si apre la finestra con il nome del viaggio sotto il titolo. A sinistra, in «Collega un provider», trovi gli archivi attivati da un amministratore, ognuno con una riga che spiega come archivia i file: Paperless-ngx e Papra tramite tag, Nextcloud e Synology Drive in una cartella, OpenCloud in uno spazio. A destra compare «Ancora nessun collegamento».",
  'help.guide.files-sync.step.2':
    "Clicca il tuo archivio, in questo caso Nextcloud. Si apre una finestra più piccola per il collegamento, con il nome dell'archivio, che chiede i dati di accesso richiesti da quell'archivio.",
  'help.guide.files-sync.step.3':
    "Compila «Indirizzo» e le credenziali dell'archivio: un «Token API» per Paperless-ngx, una «Chiave API» e l'«ID organizzazione» per Papra, «Nome utente» e una «Password per applicazioni» per Nextcloud, «Nome utente» e un «Token applicativo» per OpenCloud, e per Synology Drive «Nome utente», password e, se l'account lo richiede, un «Codice a due fattori». Usa sempre una password per app o un token se l'archivio li offre, mai la password del tuo account. Nextcloud e Synology Drive accettano anche una «Cartella di base» facoltativa, in cui TREK cerca le cartelle dei viaggi, qui /Reisen. «Accetta un certificato autofirmato», in fondo, serve solo per un archivio nella tua rete con un certificato di quel tipo.",
  'help.guide.files-sync.step.4':
    "Clicca su «Prova la connessione». TREK si collega all'archivio con i dati inseriti, e in fondo compare «Raggiunto, accesso come» seguito dal nome dell'account. Se le credenziali vengono rifiutate o l'indirizzo non è raggiungibile, in fondo compare invece l'errore. In entrambi i casi non viene salvato nulla.",
  'help.guide.files-sync.step.5':
    "Clicca su «Connetti». La connessione viene salvata con il viaggio, e TREK chiede in quale punto dell'archivio si trovano i documenti del viaggio: il tag, la cartella o lo spazio che li contiene. Viene sincronizzato solo ciò che si trova lì. «Creane uno nuovo» lo crea quando clicchi su «Crea», con un nome ricavato dal titolo del viaggio. Sotto «Oppure usane uno che hai già» vedi quelli esistenti. Cliccane uno, qui la cartella Autumn in Japan.",
  'help.guide.files-sync.step.6':
    "La finestra si riapre: il tuo archivio compare a sinistra in «Questo viaggio» e il suo riquadro a destra mostra dove sincronizza, quando è stata l'ultima sincronizzazione e «Sincronizza ora». La prima sincronizzazione parte automaticamente; clicca «Sincronizza ora» per avviarne una in qualsiasi momento. Dopo una sincronizzazione, il badge «Non ancora sincronizzato» accanto al nome diventa un pallino verde, che al passaggio del mouse indica «Allineato». La barra di flusso mostra quanti documenti hanno TREK e l'archivio, con in mezzo le corsie «Verso l'archivio» e «Dall'archivio». Chiudi la finestra con la × in alto a destra.",
  'help.guide.files-sync.result':
    "I documenti già presenti nell'archivio compaiono in cima all'elenco, caricati a tuo nome, e ogni documento del viaggio si trova anche nell'archivio, tranne quelli di «Note Collaborazione». Da questo momento TREK controlla l'archivio in background e le modifiche nell'elenco vengono copiate nell'archivio.",
  'help.guide.files-sync.tip.1':
    "Solo il proprietario del viaggio o un amministratore dell'istanza può collegare un viaggio, perché le credenziali danno accesso all'intero account sull'archivio. Una volta collegato il viaggio, ogni membro vede «Sincronizzazione documenti» e può aprirla, leggere il riquadro e premere «Sincronizza ora».",
  'help.guide.files-sync.tip.2':
    "Per un archivio sulla tua rete locale serve ALLOW_INTERNAL_NETWORK=true sul server TREK, e l'indirizzo deve essere quello del computer nella rete, mai localhost. Altrimenti «Prova la connessione» risponde «Questo indirizzo non è consentito.».",
  'help.guide.files-sync.tip.3':
    "«Disconnetti», l'icona accanto a «Sincronizza ora», chiede conferma una volta. Poi chiude il collegamento e conserva tutti i documenti da entrambe le parti. Se colleghi una seconda volta un tag, una cartella o uno spazio, TREK li considera nuovi e reimporta tutto il contenuto. Quindi, dopo una disconnessione, collega uno spazio vuoto, non quello vecchio.",

  // ── Screen: trip-day-detail ───────────────────────────────────────────────────────────
  'help.ctx.trip-day-detail.title': 'Dettagli del giorno',
  'help.ctx.trip-day-detail.summary':
    "Il pannello che si apre sopra la mappa quando clicchi sull'intestazione di un giorno. Mostra la giornata nel suo insieme: nome e data, il meteo nel luogo in cui ti troverai, le prenotazioni di quel giorno e le notti prenotate.",
  'help.ctx.trip-day-detail.bullet.1':
    "Clicca sull'intestazione di un giorno nella colonna dei giorni: il pannello si apre al centro della mappa. Clicca di nuovo sulla stessa intestazione, o sulla X alla sua destra, per chiudere il pannello e deselezionare il giorno. Aprendo un luogo, dalla colonna dei luoghi o dalla mappa, il pannello si chiude e al suo posto compare il luogo.",
  'help.ctx.trip-day-detail.bullet.2':
    "L'intestazione mostra il nome e la data del giorno. La matita accanto al nome rinomina il giorno. La doppia freccia riduce il pannello a una barra sottile, così vedi di nuovo la mappa.",
  'help.ctx.trip-day-detail.bullet.3':
    "In alto vedi il meteo del giorno. «Previsioni per» indica il luogo a cui si riferisce la previsione: la prima tappa del giorno oppure l'hotel in cui ti svegli.",
  'help.ctx.trip-day-detail.bullet.4':
    '«Prenotazioni» elenca le prenotazioni di quel giorno, ciascuna con il tipo, la tappa a cui appartiene e gli orari. Verde indica confermata, ambra ancora in attesa, mentre un tragitto con il trasporto pubblico è blu e non ha uno stato. Un clic su una riga apre la prenotazione.',
  'help.ctx.trip-day-detail.bullet.5':
    "«Alloggio» mostra ogni notte prenotata in questo giorno, con check-in e check-out nei giorni in cui avvengono, la fascia oraria del check-in, l'orario del check-out e il numero di conferma. Se il soggiorno ha una prenotazione, sotto un riquadro «Prenotazione» la indica con «In attesa» o «Confermata». Cliccalo per aprire la prenotazione.",
  'help.ctx.trip-day-detail.bullet.6':
    "«Aggiungi alloggio» aggiunge un pernottamento in questo giorno: scegli la struttura tra i luoghi del viaggio, indica quali giorni copre e aggiungi orari e codice. Anche il + nell'intestazione di un giorno, con il suggerimento «Aggiungi al giorno», contiene «Aggiungi alloggio»: apre questo pannello con il modulo già aperto.",
  // day-panel
  'help.guide.day-panel.title': 'Aprire un giorno e vederne i dettagli',
  'help.guide.day-panel.goal': 'Guarda tutta la giornata, con meteo, prenotazioni e alloggio, senza lasciare la mappa.',
  'help.guide.day-panel.step.1':
    "Clicca l'intestazione di un giorno nella colonna dei giorni. Il giorno viene selezionato e i suoi dettagli si aprono al centro della mappa.",
  'help.guide.day-panel.step.2':
    "L'intestazione mostra il nome del giorno, «Giorno 1» finché non gliene dai uno, con la data sotto.",
  'help.guide.day-panel.step.3':
    "In alto c'è il meteo del giorno. «Previsioni per» indica il luogo a cui si riferisce: la prima tappa del giorno oppure l'hotel in cui hai dormito la notte prima.",
  'help.guide.day-panel.step.4':
    'Sotto, «Prenotazioni» elenca le prenotazioni di questo giorno, con i rispettivi orari.',
  'help.guide.day-panel.step.5':
    '«Alloggio» mostra le notti prenotate in questo giorno, con check-in e check-out nei giorni in cui avvengono.',
  'help.guide.day-panel.step.6':
    "La doppia freccia nell'intestazione riduce il pannello a una barra stretta. La X accanto chiude il pannello e deseleziona il giorno.",
  'help.guide.day-panel.result':
    'Quando riduci il pannello alla sua barra, la mappa resta libera e il giorno rimane selezionato. Quando lo chiudi, il giorno viene deselezionato e il programma resta invariato.',
  'help.guide.day-panel.tip.1':
    'Puoi ridurre il pannello anche cliccando in un punto qualsiasi della sua barra di intestazione. La doppia freccia è solo uno dei modi per farlo.',
  'help.guide.day-panel.tip.2':
    "Quando apri un luogo, dalla colonna dei luoghi o dalla mappa, il pannello del giorno si chiude e al suo posto compaiono i dettagli del luogo. Clicca di nuovo sull'intestazione del giorno per tornare al giorno.",
  // day-weather
  'help.guide.day-weather.title': 'Leggere il meteo del giorno',
  'help.guide.day-weather.goal': 'Consulta il meteo del luogo in cui ti trovi davvero quel giorno.',
  'help.guide.day-weather.step.1':
    "«Previsioni per» indica il luogo a cui si riferiscono i dati: la prima tappa del giorno oppure, in un giorno senza tappe, l'hotel in cui dormi la notte prima.",
  'help.guide.day-weather.step.2':
    'Il numero grande è la temperatura del giorno. Accanto ci sono la minima e la massima, e la descrizione delle condizioni meteo.',
  'help.guide.day-weather.step.3':
    "Le etichette alla sua destra indicano la probabilità di pioggia, la quantità prevista, il vento più forte, l'alba e il tramonto.",
  'help.guide.day-weather.step.4':
    'In fondo trovi la giornata ora per ora, ogni due ore: orario, icona, temperatura e probabilità di pioggia. Le ore oltre il 50 per cento sono evidenziate in blu.',
  'help.guide.day-weather.result':
    'Anche la scheda del giorno nella colonna dei giorni mostra il meteo in piccolo sotto il numero, così vedi al volo il meteo di tutto il viaggio.',
  'help.guide.day-weather.tip.1':
    "Gradi e vento seguono l'«Unità di Temperatura» in «Visualizzazione» nelle Impostazioni: se scegli °F Fahrenheit, la stessa previsione viene mostrata in °F e mph.",
  'help.guide.day-weather.tip.2':
    'Un giorno senza tappe localizzate e senza hotel della notte precedente non mostra alcun meteo: la previsione è sempre per un luogo, mai per il viaggio.',
  'help.guide.day-weather.tip.3':
    'Oltre i 16 giorni le previsioni non sono disponibili. I valori sono allora le medie degli anni precedenti per quella data, contrassegnati con Ø e accompagnati da una nota.',
  // rename-day
  'help.guide.rename-day.title': 'Dare un nome al giorno',
  'help.guide.rename-day.goal':
    'Dai a un giorno un nome come «Arrivo a Kyoto» o «Giorno di riposo» invece di «Giorno 5».',
  'help.guide.rename-day.step.1': "Apri il giorno. L'intestazione mostra «Giorno 5», con la data sotto.",
  'help.guide.rename-day.step.2': 'Clicca la matita accanto al nome.',
  'help.guide.rename-day.step.3': 'Il nome diventa un campo modificabile. Scrivi il nome che vuoi.',
  'help.guide.rename-day.step.4':
    'Premi Invio o clicca altrove. Esc annulla la modifica. Anche la scheda del giorno nella colonna dei giorni mostra il nome.',
  'help.guide.rename-day.result':
    'Il nome sostituisce «Giorno 5» nel pannello e nella scheda del giorno nella colonna dei giorni; la data non cambia.',
  'help.guide.rename-day.tip.1':
    "Se svuoti il campo e salvi, il giorno torna a chiamarsi «Giorno 5»: il numero compare quando non c'è un nome.",
  'help.guide.rename-day.tip.2':
    'Il nome appartiene al giorno, non alla data. Se riordini i giorni, il nome si sposta insieme a tutto il resto di quel giorno.',
  // add-accommodation
  'help.guide.add-accommodation.title': 'Prenotare un pernottamento in un giorno',
  'help.guide.add-accommodation.goal':
    "Aggiungi l'hotel al programma una sola volta, con i giorni del soggiorno, gli orari e il numero di conferma.",
  'help.guide.add-accommodation.step.1':
    'La struttura deve prima essere un luogo del viaggio. Creala nella colonna dei luoghi come qualsiasi altro luogo: il selettore propone solo luoghi già esistenti.',
  'help.guide.add-accommodation.step.2':
    'Apri il giorno del tuo arrivo e clicca su «Aggiungi alloggio» sotto «Alloggio».',
  'help.guide.add-accommodation.step.3':
    "«Applica ai giorni» stabilisce quali notti copre il soggiorno: «Inizio» è il giorno del check-in, «Fine» quello del check-out, e «Tutti» copre l'intero viaggio. In cima alla finestra vedi l'intervallo e il numero di notti.",
  'help.guide.add-accommodation.step.4':
    'Compila «Check-in», «Fino a» e «Check-out», e inserisci il numero di prenotazione in «Conferma». Tutti e quattro i campi possono restare vuoti.',
  'help.guide.add-accommodation.step.5':
    "Scegli la struttura sotto «Seleziona alloggio». «Categoria», sopra l'elenco, lo restringe a una sola categoria.",
  'help.guide.add-accommodation.step.6': 'Clicca «Salva».',
  'help.guide.add-accommodation.result':
    "Il soggiorno compare in ogni giorno che copre, con il check-in il primo giorno e il check-out l'ultimo. La struttura diventa una tappa del giorno del check-in, così la mappa mostra il percorso per arrivarci, e nella scheda «Prenotazioni» compare una prenotazione Hotel.",
  'help.guide.add-accommodation.tip.1':
    'Il selettore si apre sul giorno da cui sei partito, con il check-out il giorno dopo; puoi modificarli entrambi prima di salvare.',
  'help.guide.add-accommodation.tip.2':
    "Quando crei l'hotel, assegnagli la categoria Hotel. Così con un clic su «Categoria» sopra la lista vedi solo i tuoi hotel.",
  'help.guide.add-accommodation.tip.3':
    'Gli orari sono tutti facoltativi: un soggiorno senza check-in e senza codice copre comunque le sue notti e il suo percorso viene comunque disegnato.',
  // edit-accommodation
  'help.guide.edit-accommodation.title': 'Modificare o annullare una notte prenotata',
  'help.guide.edit-accommodation.goal': 'Sposta un soggiorno, correggine gli orari o toglilo dal programma.',
  'help.guide.edit-accommodation.step.1':
    'La scheda mostra la struttura e il suo indirizzo, il check-in o il check-out nei giorni in cui avvengono con gli orari, il numero di conferma e, sotto «Prenotazione», la prenotazione collegata.',
  'help.guide.edit-accommodation.step.2':
    'La matita alla sua destra, «Modifica alloggio», apre il soggiorno in modifica. Il titolo del popup ora è «Modifica alloggio».',
  'help.guide.edit-accommodation.step.3':
    'Correggi «Check-in», «Fino a», «Check-out» e «Conferma». Qui puoi cambiare anche i giorni sopra e la struttura sotto.',
  'help.guide.edit-accommodation.step.4': 'Clicca «Salva».',
  'help.guide.edit-accommodation.step.5':
    "La X accanto alla matita, «Rimuovi», elimina il soggiorno. Non chiede conferma, e viene eliminata anche la prenotazione dell'hotel collegata al soggiorno.",
  'help.guide.edit-accommodation.result':
    "La modifica vale subito per tutti i giorni del soggiorno e per la prenotazione dell'hotel nella scheda «Prenotazioni».",
  'help.guide.edit-accommodation.tip.1':
    "Le notti intermedie di un soggiorno non hanno l'etichetta «Check-in» né «Check-out»: ce l'hanno solo il primo e l'ultimo giorno del periodo.",
  'help.guide.edit-accommodation.tip.2':
    'Annullando un soggiorno elimini anche la tappa che aveva aggiunto al giorno del check-in e gli eventuali costi collegati alla prenotazione. Se è stato un errore, prenota di nuovo la notte.',
  // day-bookings
  'help.guide.day-bookings.title': 'Le prenotazioni del giorno in sintesi',
  'help.guide.day-bookings.goal': 'Vedi in un unico posto cosa è già prenotato per questo giorno e se è confermato.',
  'help.guide.day-bookings.step.1':
    '«Prenotazioni» elenca le prenotazioni del giorno: quelle con quella data e quelle fissate a una delle sue tappe. Una prenotazione fissata a una tappa di un altro giorno compare solo in quella tappa.',
  'help.guide.day-bookings.step.2':
    "Una riga mostra il tipo di prenotazione, il nome e, se appartiene a una tappa, il nome della tappa in grigio. Gli orari sono all'estremità destra, prima del pallino dello stato.",
  'help.guide.day-bookings.step.3':
    'Il colore indica lo stato di una prenotazione: verde è confermata, ambra ancora in attesa, e un tragitto con il trasporto pubblico è blu, senza stato. Gli hotel non sono in questo elenco: hanno una sezione propria più in basso.',
  'help.guide.day-bookings.step.4':
    "Clicca su una riga per aprire la prenotazione. La pillola nell'intestazione la passa da «In attesa» a «Confermata» e viceversa, e «Modifica» in fondo cambia il resto. Le nuove prenotazioni si creano nella scheda «Prenotazioni», i trasporti nella scheda «Trasporti».",
  'help.guide.day-bookings.result':
    "In questo elenco c'è tutto ciò che ha la data di quel giorno e tutto ciò che è collegato a una delle sue tappe.",
  'help.guide.day-bookings.tip.1':
    "Una prenotazione compare nel giorno della sua data. Se cambi la data nella scheda «Prenotazioni» o «Trasporti», la prenotazione si sposta automaticamente sull'altro giorno.",
  'help.guide.day-bookings.tip.2':
    "Se non c'è il blocco «Prenotazioni», il giorno non ha prenotazioni: il blocco viene nascosto anziché mostrato vuoto.",
  'help.guide.map-lock.title': 'Bloccare la mappa',
  'help.guide.map-lock.goal': "Tieni ferma la mappa mentre passi da un giorno o da un luogo all'altro.",
  'help.guide.map-lock.step.1':
    'Il lucchetto è il più alto dei due pulsanti rotondi in basso a sinistra della mappa; passandoci sopra compare «Blocca la vista della mappa». Cliccalo. Finché è chiuso, aprire un giorno o scegliere un luogo non sposta né ingrandisce più la mappa, e il pulsante mostra «Lascia che la mappa segua la selezione».',
  'help.guide.map-lock.result': "La mappa resta dove l'hai lasciata mentre lavori al programma.",
  'help.guide.map-lock.tip.1':
    "Clicca di nuovo sul lucchetto, che ora mostra «Lascia che la mappa segua la selezione», e la mappa torna a seguire ciò che scegli. Il lucchetto c'è solo sul computer; sul telefono la mappa segue sempre la selezione.",

  // ── Screen: trip-map ──────────────────────────────────────────────────────────────────
  'help.ctx.trip-map.title': 'Mappa',
  'help.ctx.trip-map.summary':
    'Il centro del programma: ogni luogo del viaggio come segnaposto, ogni escursione come linea, i percorsi che li collegano e, lungo i bordi della mappa, i pulsanti per bloccare la vista, passare al satellite, vedere tutto il viaggio in una volta e mostrare i luoghi nella zona che stai guardando.',
  'help.ctx.trip-map.bullet.1':
    "Un segnaposto è un luogo: mostra la foto del luogo, se c'è, altrimenti il colore e l'icona della sua categoria. Passa con il mouse su un segnaposto per vedere una scheda con immagine, nome e indirizzo, più valutazione e categoria se il luogo le ha. Trascina un segnaposto sulla scheda di un giorno per pianificare lì il luogo. Un soggiorno con prenotazione ancora in attesa appare sbiadito, con un anello tratteggiato.",
  'help.ctx.trip-map.bullet.2':
    'I segnaposto troppo vicini tra loro vengono raggruppati in un cerchio scuro con un numero. Clicca sul cerchio e la mappa ingrandisce sui segnaposto che contiene. Con «Segnaposti compatti per i luoghi non pianificati» attivo, in «Impostazioni» > «Visualizzazione» sotto Viaggio e mappa, i luoghi non ancora assegnati a un giorno diventano piccoli punti senza foto, così le tappe pianificate si vedono meglio.',
  'help.ctx.trip-map.bullet.3':
    'Clicca un segnaposto per aprire il luogo in una scheda in fondo alla mappa, con valutazione, file e azioni successive. Clicca un punto vuoto della mappa per chiudere la scheda.',
  'help.ctx.trip-map.bullet.4':
    "Con un giorno aperto nella colonna dei giorni, le sue tappe mostrano un piccolo badge bianco con il loro numero in quel giorno. Un luogo presente due volte nel giorno mostra entrambi i numeri. I filtri sopra l'elenco dei luoghi («Mostra», le categorie e la stella per la valutazione minima) filtrano anche i segnaposto sulla mappa.",
  'help.ctx.trip-map.bullet.5':
    'La riga di icone in alto cerca nella parte di mappa visibile: «Ristoranti», «Caffè», «Bar e vita notturna», «Alloggio», «Attrazioni», «Musei e cultura», «Natura e parchi» e «Attività». Le categorie aggiunte da un plugin seguono dopo un sottile divisore. Se la riga è più larga della mappa, la rotellina del mouse la fa scorrere lateralmente. «Cerca in questa zona» ripete la ricerca dopo che hai spostato la mappa.',
  'help.ctx.trip-map.bullet.6':
    "Fai clic destro in qualsiasi punto della mappa per aprire il modulo del luogo in quel punto, con l'indirizzo già cercato. In basso a sinistra ci sono due pulsanti rotondi: il lucchetto, «Blocca la vista della mappa», mantiene la vista ferma mentre passi tra giorni e luoghi, e il pulsante sotto, «Passa alla vista satellitare», sostituisce la mappa disegnata con le immagini satellitari.",
  'help.ctx.trip-map.bullet.7':
    "«Mostra tutto il viaggio», in basso a destra, disegna tutti i giorni di viaggio insieme ed elenca cosa comprende ogni giorno. L'icona del percorso sulla riga di una prenotazione disegna quella prenotazione, mentre quella nella barra degli strumenti sopra i giorni le disegna tutte. Clicca l'estremità di una prenotazione disegnata per aprirne i dettagli.",
  'help.ctx.trip-map.bullet.8':
    "Con il modulo Dawarich attivo, il pulsante rotondo Dawarich sotto «Mostra tutto il viaggio» mostra il percorso effettivamente registrato dal tuo telefono. «Mostra il percorso registrato» lo disegna come linea tratteggiata sotto il percorso pianificato, con un colore per ogni giorno. Se la linea non compare, l'etichetta del pulsante ne spiega il motivo.",
  // map-markers
  'help.guide.map-markers.title': 'Leggere la mappa',
  'help.guide.map-markers.goal': 'Scopri cosa significano segnaposto, badge e bolle sulla mappa.',
  'help.guide.map-markers.step.1':
    "La mappa mostra tutti i luoghi del viaggio. Dove i segnaposto sono troppo vicini per distinguerli, vengono raggruppati in un cerchio scuro con il loro numero all'interno. Clicca il cerchio e la mappa si ingrandisce su quei segnaposto oppure, al massimo zoom, li separa.",
  'help.guide.map-markers.step.2':
    "Un segnaposto mostra la foto del luogo, se c'è, altrimenti il colore e l'icona della sua categoria. Un soggiorno con prenotazione ancora in attesa appare sbiadito, con un anello tratteggiato. Passando con il mouse su un segnaposto, accanto si apre una scheda: la stessa foto più grande, nome e indirizzo, con valutazione e categoria se il luogo le ha.",
  'help.guide.map-markers.step.3':
    "Clicca su un segnaposto: il luogo si apre in una scheda nella parte bassa della mappa, con in alto immagine, nome e indirizzo, poi stelle, descrizione e file, compresi quelli della sua prenotazione. In fondo ci sono le azioni: «Aggiungi al giorno» quando un giorno è aperto («Rimuovi dal giorno» se il luogo c'è già), «Navigazione», «Apri sito web», «Salva nella raccolta» («Salvato» quando è già in una raccolta) e, a destra, il cestino e «Modifica». La X in alto, o un clic su un punto vuoto della mappa, chiude la scheda.",
  'help.guide.map-markers.step.4':
    "Apri un giorno nella colonna dei giorni e le sue tappe vengono numerate: il piccolo badge bianco nell'angolo del segnaposto indica la posizione della tappa nel giorno. Un luogo presente due volte nel giorno mostra entrambi i numeri. Quando non è aperto nessun giorno, i numeri non ci sono e nell'angolo compare invece la valutazione del luogo, se presente.",
  'help.guide.map-markers.step.5':
    'Trascina un segnaposto dalla mappa sulla scheda di un giorno nella colonna dei giorni e il luogo viene pianificato in quel giorno, come quando trascini la sua riga dalla lista dei luoghi.',
  'help.guide.map-markers.result':
    'Il viaggio non cambia: la mappa si limita a mostrarlo. Ogni segnaposto indica di quale luogo si tratta, in quale giorno e in che ordine.',
  'help.guide.map-markers.tip.1':
    'Se comprimi un giorno nella colonna dei giorni, le sue tappe spariscono dalla mappa. Espandi di nuovo il giorno per mostrarle.',
  'help.guide.map-markers.tip.2':
    "I filtri sopra l'elenco dei luoghi decidono anche cosa mostra la mappa: «Mostra» («Non pianificati», «Pianificato»), le categorie sotto il pulsante dell'etichetta e la valutazione minima sotto la stella riducono il numero di segnaposto. Il filtro per paese restringe solo l'elenco.",
  'help.guide.map-markers.tip.3':
    'Questa mappa non ha pulsanti di zoom: la rotellina ingrandisce e riduce, un doppio clic ingrandisce di un livello, e trascinando la mappa la sposti.',
  // map-nearby-places
  'help.guide.map-nearby-places.title': 'Trovare luoghi nei dintorni sulla mappa',
  'help.guide.map-nearby-places.goal':
    'Cerca ristoranti, attrazioni o un hotel nella zona visibile sulla mappa e aggiungine uno al viaggio.',
  'help.guide.map-nearby-places.step.1':
    "La riga di icone in cima alla mappa è la ricerca per categoria: «Ristoranti», «Caffè», «Bar e vita notturna», «Alloggio», «Attrazioni», «Musei e cultura», «Natura e parchi» e «Attività». Le categorie aggiunte da un plugin seguono dopo un sottile divisore; passa con il mouse su un'icona per vederne il nome.",
  'help.guide.map-nearby-places.step.2':
    "Clicca una categoria. TREK cerca quel tipo di luogo nella parte di mappa visibile e mette un segnaposto del colore della categoria per ogni risultato. Puoi attivare una sola categoria alla volta: cliccandone un'altra la sostituisci, cliccando quella attiva la disattivi.",
  'help.guide.map-nearby-places.step.3':
    'Quando sposti la mappa, sotto la riga compare un secondo pulsante: «Cerca in questa zona» ripete la stessa ricerca nella nuova area. Spostare la mappa non avvia da solo una nuova ricerca, così il numero di richieste resta basso.',
  'help.guide.map-nearby-places.step.4':
    'Tieni il puntatore su un segnaposto per vedere il nome di ciò che la ricerca ha trovato. Clicca sul segnaposto: si apre il modulo del luogo già compilato con i dettagli, cioè il nome in cima alla finestra, «Indirizzo», «Latitudine» e «Longitudine», e sito web e numero di telefono se la ricerca li ha trovati.',
  'help.guide.map-nearby-places.step.5':
    'Controlla cosa è stato compilato e aggiungi ciò che la ricerca non poteva sapere. La pillola della categoria sotto il nome è già impostata se il viaggio ha una categoria corrispondente, ad esempio ristorante per un ristorante; altrimenti mostra «Nessuna categoria» finché non ne scegli una. Aggiungi una «Descrizione» e delle note tue.',
  'help.guide.map-nearby-places.step.6':
    "Clicca «Aggiungi». Se nel viaggio c'è già un luogo con lo stesso nome o nello stesso punto, TREK te lo segnala e il pulsante diventa «Aggiungi comunque».",
  'help.guide.map-nearby-places.result':
    "Il luogo è nell'elenco dei luoghi e sulla mappa come segnaposto del viaggio, tra i «Non pianificati» finché non lo assegni a un giorno. I segnaposto della ricerca restano finché non disattivi la categoria.",
  'help.guide.map-nearby-places.tip.1':
    'La riga è nascosta se «Esplora luoghi sulla mappa» è disattivato in «Impostazioni» > «Visualizzazione», sotto Viaggio e mappa.',
  'help.guide.map-nearby-places.tip.2':
    "I risultati provengono dall'indice TREK Places e da OpenStreetMap, quindi è una delle poche funzioni del programma che richiede una connessione.",
  'help.guide.map-nearby-places.tip.3':
    "Una ricerca copre solo la zona visibile sullo schermo, quindi ingrandisci fino alla via che ti interessa. Una ricerca su un'intera città restituisce solo i primi sessanta risultati, senza un ordine preciso.",
  // map-add-place
  'help.guide.map-add-place.title': 'Creare un luogo con il clic destro sulla mappa',
  'help.guide.map-add-place.goal': 'Posiziona un luogo esattamente dove vuoi, senza doverlo cercare prima.',
  'help.guide.map-add-place.step.1':
    'Fai clic destro sul punto della mappa. Si apre il modulo del luogo con il titolo «Aggiungi Luogo/Attività».',
  'help.guide.map-add-place.step.2':
    '«Latitudine» e «Longitudine» sono già impostate su quel punto. TREK cerca le coordinate e compila «Indirizzo» con quello che trova. Se la ricerca trova un nome, TREK compila anche il nome in alto nella finestra. Non è ancora stato salvato nulla, quindi correggi quello che non va.',
  'help.guide.map-add-place.step.3':
    'Inserisci nel campo in cima alla finestra un nome facile da riconoscere. Scegli una categoria dalla pillola sotto, che mostra «Nessuna categoria» finché non ne scegli una. Poi aggiungi gli altri dettagli utili al programma: «Descrizione», «Note», «Sito web».',
  'help.guide.map-add-place.step.4':
    "Clicca su «Aggiungi». Il luogo viene aggiunto all'elenco come non pianificato, anche se un giorno è aperto: il clic destro sulla mappa imposta la posizione, non il giorno.",
  'help.guide.map-add-place.result':
    "Il luogo è nell'elenco e sulla mappa, tra i «Non pianificati» finché non lo assegni a un giorno.",
  'help.guide.map-add-place.tip.1':
    "L'indirizzo viene ricavato dalle coordinate, quindi può mostrare una via anziché un nome e in aperta campagna può restare vuoto. Puoi modificare entrambi i campi.",
  'help.guide.map-add-place.tip.2':
    'Sulle mappe MapLibre GL e Mapbox GL puoi fare lo stesso con il clic centrale e, sui touch screen, con una pressione prolungata.',
  // map-satellite
  'help.guide.map-satellite.title': 'Passare alla vista satellitare',
  'help.guide.map-satellite.goal': 'Passa dalla mappa disegnata alle immagini aeree e viceversa.',
  'help.guide.map-satellite.step.1':
    'Il selettore del livello di base è il più basso dei due pulsanti rotondi in basso a sinistra della mappa, sotto il lucchetto. La sua icona mostra sempre il livello a cui passerai, e il suggerimento lo indica: «Passa alla vista satellitare». Cliccalo.',
  'help.guide.map-satellite.step.2':
    'Ora la mappa mostra immagini aeree, abbastanza dettagliate da distinguere i singoli edifici, e non serve una chiave tua. Tutto ciò che TREK disegna resta in primo piano: segnaposto, percorso del giorno, tracce e percorsi delle prenotazioni.',
  'help.guide.map-satellite.step.3':
    'Ora il pulsante mostra «Passa alla vista mappa». Cliccalo per tornare alla mappa.',
  'help.guide.map-satellite.result': 'La mappa viene ridisegnata, e il livello scelto viene salvato nel tuo account.',
  'help.guide.map-satellite.tip.1':
    "La scelta viene salvata nel tuo account, non nel viaggio, quindi ogni viaggio si apre come l'hai lasciato, con qualunque motore di mappe.",
  'help.guide.map-satellite.tip.2':
    'Le immagini satellitari non hanno etichette: nomi delle vie, quartieri e numeri civici ci sono solo sulla mappa disegnata, quindi torna a quella quando cerchi un indirizzo.',
  // map-whole-trip
  'help.guide.map-whole-trip.title': "Vedere l'intero viaggio e le sue distanze",
  'help.guide.map-whole-trip.goal':
    'Mostra tutte le giornate di viaggio invece del solo giorno aperto, e scopri quanta strada fai ogni giorno.',
  'help.guide.map-whole-trip.step.1':
    'Il pulsante rotondo «Mostra tutto il viaggio» si trova in basso a destra sulla mappa. Cliccalo e tutti i giorni di viaggio vengono disegnati insieme, ognuno con il suo colore, così distingui facilmente i giorni vicini.',
  'help.guide.map-whole-trip.step.2':
    "La scheda sopra il pulsante elenca quei giorni: un pallino colorato, il nome del giorno, un'icona per ogni mezzo usato e la distanza percorsa. In alto c'è la «Distanza totale».",
  'help.guide.map-whole-trip.step.3':
    "Clicca un giorno nella scheda per selezionarlo: la sua riga si evidenzia e il giorno si apre nella colonna dei giorni. Usa la rotellina del mouse su una città per ingrandire: i giorni che passano per quella città compaiono uno accanto all'altro, ognuno con il suo colore.",
  'help.guide.map-whole-trip.step.4':
    'Il pulsante ora mostra «Nascondi tutto il viaggio». Cliccalo per tornare a vedere solo il giorno aperto.',
  'help.guide.map-whole-trip.result':
    'Ogni giornata di viaggio è disegnata con un colore diverso, e la scheda mostra cosa copre ogni giorno e il totale del viaggio.',
  'help.guide.map-whole-trip.tip.1':
    'Il totale viene calcolato pochi tratti alla volta. Finché è seguito da …, il numero è solo una somma parziale. Diventa definitivo quando tutti i tratti sono stati calcolati.',
  'help.guide.map-whole-trip.tip.2':
    'Se il router non riesce a calcolare un tratto, il tratto resta una linea retta e non viene conteggiato. La scheda lo segnala, così il totale non risulta più basso senza avviso.',
  'help.guide.map-whole-trip.tip.3':
    "Un giorno con meno di due tappe localizzate e senza tragitti da o verso l'alloggio non ha un percorso da disegnare, quindi non compare affatto nella scheda.",
  // map-booking-routes
  'help.guide.map-booking-routes.title': 'Mostrare sulla mappa il percorso di una prenotazione',
  'help.guide.map-booking-routes.goal':
    'Mostra sulla mappa i voli, i treni e i tragitti in auto che hai prenotato, e nascondili di nuovo.',
  'help.guide.map-booking-routes.step.1':
    "I percorsi delle prenotazioni sono nascosti finché non ne attivi uno. All'estremità destra della riga di un trasporto nella colonna dei giorni c'è una piccola icona del percorso: «Mostra percorsi prenotati».",
  'help.guide.map-booking-routes.step.2':
    "Cliccalo e la prenotazione compare sulla mappa: un volo come arco di cerchio massimo, un tragitto in auto lungo le strade reali, un treno come sequenza delle sue stazioni. Le prenotazioni confermate sono linee continue, quelle in attesa tratteggiate, e le estremità del percorso sono pillole blu con l'icona del mezzo.",
  'help.guide.map-booking-routes.step.3':
    "Clicca su una pillola di estremità: si aprono i dettagli della prenotazione, con stato, tipo e giorni come pillole nell'intestazione colorata, gli orari alle due estremità, gli altri dettagli sotto e, in fondo, «Sulla mappa», che disattiva di nuovo questo percorso, «Cambia percorso» per un collegamento con il trasporto pubblico, il cestino che elimina la prenotazione e «Modifica». La X nell'intestazione chiude i dettagli.",
  'help.guide.map-booking-routes.step.4':
    "L'icona del percorso nella barra degli strumenti sopra i giorni agisce sull'intero viaggio: «Mostra tutti i percorsi prenotati» disegna tutte le prenotazioni che hanno un percorso.",
  'help.guide.map-booking-routes.step.5':
    'Questa opzione sostituisce le scelte precedenti, quindi i percorsi che avevi attivato prenotazione per prenotazione vengono reimpostati. Premila di nuovo, ora «Nascondi tutti i percorsi prenotati», per nascondere tutti i percorsi delle prenotazioni.',
  'help.guide.map-booking-routes.result':
    'Le prenotazioni che hai scelto vengono disegnate sulla mappa e la scelta resta salvata per questo viaggio in questo browser finché non la cambi.',
  'help.guide.map-booking-routes.tip.1':
    "Le estremità mostrano il codice dell'aeroporto o il nome della stazione solo se «Etichette percorsi prenotati» è attivo in «Impostazioni» > «Visualizzazione», sotto Viaggio e mappa; altrimenti mostrano solo l'icona.",
  'help.guide.map-booking-routes.tip.2':
    "«Mostra sempre i percorsi delle prenotazioni», nella stessa sezione, li mostra fin dall'inizio in ogni viaggio in cui non l'hai ancora impostato tu.",
  'help.guide.map-booking-routes.tip.3':
    "Per essere disegnata, una prenotazione deve avere un punto di partenza e uno di arrivo con coordinate, quindi un hotel o un ristorante non ha l'icona del percorso.",
  // map-dawarich-trail
  'help.guide.map-dawarich-trail.title': 'Mostrare il percorso che hai fatto davvero',
  'help.guide.map-dawarich-trail.goal':
    "Mostra sulla mappa il percorso registrato da Dawarich sul tuo telefono, come linea tratteggiata accanto al percorso pianificato, e scopri giorno per giorno com'è andato davvero il viaggio.",
  'help.guide.map-dawarich-trail.step.1':
    'Il pulsante rotondo Dawarich si trova in basso a destra della mappa, sotto «Mostra tutto il viaggio». Passandoci sopra compare «Mostra il percorso registrato». Cliccalo. TREK richiede al tuo Dawarich i dati per le date del viaggio, e un anello gira intorno al pulsante mentre attende la risposta.',
  'help.guide.map-dawarich-trail.step.2':
    'Il percorso registrato compare come linea tratteggiata, con un colore per giorno, sotto il percorso pianificato, così il programma resta leggibile. Ora il pulsante mostra «Nascondi il percorso registrato». Ogni giorno termina alla mezzanotte locale. Se comprimi un giorno nella colonna dei giorni, la sua linea tratteggiata e le sue tappe spariscono dalla mappa.',
  'help.guide.map-dawarich-trail.step.3':
    'Clicca anche su «Mostra tutto il viaggio»: ogni giorno pianificato viene disegnato con una linea continua accanto alla registrazione tratteggiata. Dove le due linee coincidono, la giornata è andata come previsto. Dove la linea tratteggiata si allontana dal percorso pianificato, no.',
  'help.guide.map-dawarich-trail.result':
    'Sulla mappa vedi insieme ciò che avevi pianificato e ciò che hai fatto davvero, con linee tratteggiate e continue. La scheda sopra i pulsanti continua a elencare i giorni pianificati e le relative distanze.',
  'help.guide.map-dawarich-trail.tip.1':
    "L'attivazione viene salvata per ogni viaggio nel tuo account, quindi è la stessa in tutti i browser e su tutti i dispositivi. Finché il percorso è attivo, TREK interroga Dawarich ogni due minuti, così un viaggio in corso si aggiorna senza ricaricare la pagina. Il percorso non viene mai memorizzato: non è nel database di TREK, non è nei backup e non è disponibile offline.",
  'help.guide.map-dawarich-trail.tip.2':
    "L'etichetta del pulsante spiega perché la mappa è vuota: «Caricamento del percorso registrato…» durante il caricamento, «In queste date non è stato registrato nulla», «Impossibile caricare il percorso registrato» oppure, quando TREK è offline, «Il percorso registrato richiede una connessione».",
  // map-compass
  'help.guide.map-compass.title': 'Ruotare la mappa e ritrovare il nord',
  'help.guide.map-compass.goal': 'Ruota la mappa nella direzione in cui stai andando, e riportala a nord con un clic.',
  'help.guide.map-compass.step.1':
    'Ruota la mappa trascinando con il tasto destro, oppure tenendo premuto Ctrl e trascinando con il sinistro; su uno schermo touch, ruota con due dita. La bussola rotonda accanto alla riga di icone delle categorie in cima alla mappa ruota insieme: la sua freccia indica sempre il nord, quindi si inclina dello stesso angolo della mappa.',
  'help.guide.map-compass.step.2':
    "Clicca sulla bussola. Il pulsante, Reset north, riporta la mappa con il nord in alto, la rimette in piano e la freccia torna a puntare verso l'alto.",
  'help.guide.map-compass.result':
    'La mappa torna orientata a nord e senza inclinazione. Il viaggio non cambia: la bussola modifica solo la visualizzazione.',
  'help.guide.map-compass.tip.1':
    "La bussola c'è solo sulle mappe MapLibre GL e Mapbox GL; la mappa Leaflet non si può ruotare, quindi non ha la bussola. La mappa da usare si sceglie con «Provider mappa» in Impostazioni, sezione Mappa, e «Salva Mappa» salva la scelta.",
  'help.guide.map-compass.tip.2':
    "Il clic elimina anche l'inclinazione. Trascina in su o in giù con il tasto destro del mouse per inclinare la vista; «Ripristina nord» la rimette in piano e azzera la rotazione. Su Mapbox GL con «Edifici 3D e terreno» attivo, appiattisce anche la vista 3D finché non la inclini di nuovo.",

  // ── Screen: trip-collab ───────────────────────────────────────────────────────────────
  'help.ctx.trip-collab.title': 'Collaborazione',
  'help.ctx.trip-collab.summary':
    "La scheda in cui il gruppo pianifica insieme, con cinque schede: la chat a sinistra, «Note» e «Link» accanto, «Sondaggi» e «Cosa c'è dopo» sotto. Tutto ciò che scrivi qui compare subito sullo schermo degli altri membri, senza ricaricare la pagina.",
  'help.ctx.trip-collab.bullet.1':
    "La chat è il riquadro a sinistra. Scrivi in «Scrivi un messaggio...» e premi Invio; con Maiusc+Invio vai a capo. Lo smile aggiunge un'emoji e «Allega immagini» aggiunge fino a quattro immagini al messaggio.",
  'help.ctx.trip-collab.bullet.2':
    "Passa il mouse su un messaggio per «Rispondi» e, sui tuoi messaggi, «Elimina»; con il clic destro trovi le otto reazioni rapide. Al posto di un messaggio eliminato compare una nota che indica chi l'ha eliminato.",
  'help.ctx.trip-collab.bullet.3':
    "«Note» è l'area delle note condivise: «Nuova nota» nell'intestazione crea una nota, e l'ingranaggio accanto apre «Gestisci categorie» per nomi e colori. Quando esistono categorie, una riga di pillole sotto l'intestazione filtra le schede: «Tutti» o una sola categoria. La scheda di una nota mostra la categoria come pallino colorato e il link come pulsante rotondo, e i suoi tre puntini («Altre opzioni») contengono «Espandi», «Fissa», «Modifica» ed «Elimina».",
  'help.ctx.trip-collab.bullet.4':
    '«Link» raccoglie gli indirizzi web del viaggio. «Aggiungi link» richiede un titolo e un indirizzo http o https. «Modifica link», «Fissa link» ed «Elimina link» si trovano alla fine del chip, e i link fissati restano in cima.',
  'help.ctx.trip-collab.bullet.5':
    "Usa i sondaggi per prendere decisioni. «Nuovo sondaggio» pone una domanda con almeno due opzioni. Clicca un'opzione per votarla. Il lucchetto («Chiudi») e il cestino («Elimina») a destra nell'intestazione di un sondaggio terminano la votazione o eliminano il sondaggio.",
  'help.ctx.trip-collab.bullet.6':
    "«Cosa c'è dopo» elenca le tappe del viaggio ancora da fare, fino a otto, con orari e partecipanti. Legge solo il piano del giorno; gli orari si impostano lì.",
  // write-note
  'help.guide.write-note.title': 'Scrivere una nota condivisa',
  'help.guide.write-note.goal':
    'Metti ciò che serve a tutto il gruppo, come una regola, un indirizzo o un promemoria, dove tutti possano trovarlo.',
  'help.guide.write-note.step.1':
    "Clicca «Nuova nota» nell'intestazione del riquadro «Note». Si apre la finestra della nota, con il cursore già nel campo del titolo.",
  'help.guide.write-note.step.2':
    "Scrivi il titolo in «Titolo della nota», in alto nella finestra. È l'unico campo obbligatorio: «Crea» resta disattivato finché il titolo è vuoto, e premendo Invio nel titolo la nota viene creata subito.",
  'help.guide.write-note.step.3':
    '«Contenuto» contiene il testo e supporta il Markdown: una parola in grassetto, un elenco, un titolo. La scheda mostra le prime tre righe e «Espandi» nel suo menu apre la nota completa.',
  'help.guide.write-note.step.4':
    "Sotto «Categoria», scegli quella a cui appartiene la nota. Il suo colore viene usato subito per l'intestazione della finestra e poi per quella della scheda. La prima categoria è già selezionata. Le pillole sono le categorie esistenti; per crearne una nuova usa «Gestisci categorie». Finché il viaggio non ha categorie, questa riga non compare.",
  'help.guide.write-note.step.5':
    '«Sito web» accetta un link relativo alla nota. La scheda mostra allora in alto un pulsante rotondo che lo apre.',
  'help.guide.write-note.step.6':
    "Clicca su «Crea». Solo «Annulla» e la sua croce chiudono la finestra, quindi un clic all'esterno o Esc non ti fanno perdere ciò che hai scritto.",
  'help.guide.write-note.result':
    'La nota è una scheda nel pannello «Note», con la parte superiore nel colore della categoria, e tutti gli altri membri la vedono subito.',
  'help.guide.write-note.tip.1':
    "I tre puntini su una scheda («Altre opzioni») aprono «Espandi», «Fissa», «Modifica» ed «Elimina». «Fissa» tiene la nota in cima al pannello, con una cornice nel suo colore. Tutte le altre note sono ordinate per data dell'ultima modifica.",
  'help.guide.write-note.tip.2':
    "L'ingranaggio accanto a «Nuova nota» apre «Gestisci categorie». Lì puoi assegnare un colore a una categoria, rinominarla ovunque in una volta o aggiungerla prima che una nota la usi. Le modifiche si applicano solo quando clicchi «Salva».",
  'help.guide.write-note.tip.3':
    "«Allega file» aggiunge un documento alla nota, se puoi caricare file nel viaggio. «Allega» apre la scelta dei file, e puoi anche incollare un'immagine o un PDF nella finestra.",
  'help.guide.write-note.tip.4':
    'Le note hanno un interruttore proprio in «Moduli», sotto «Collaborazione»: un amministratore può disattivarle e lasciare attivi chat, link, sondaggi e «Prossimi passi».',
  // shared-links
  'help.guide.shared-links.title': 'Raccogliere i link del viaggio',
  'help.guide.shared-links.goal':
    "Tieni in un unico posto il portale delle prenotazioni, l'album condiviso e gli orari, così non devi cercarli nella chat.",
  'help.guide.shared-links.step.1':
    "Clicca su «Aggiungi link» nell'intestazione della scheda «Link». La finestra si apre con il cursore nel campo in alto.",
  'help.guide.shared-links.step.2':
    "Scrivi il nome in «Titolo del link», incolla l'indirizzo in «Collega» sotto, poi clicca su «Salva link».",
  'help.guide.shared-links.step.3':
    'Il chip mostra il nome e il sito a cui rimanda. Cliccalo per aprire la pagina in una nuova scheda.',
  'help.guide.shared-links.step.4':
    "I tre pulsanti rotondi alla fine sono «Modifica link», «Fissa link» ed «Elimina link». «Fissa link» sposta il chip all'inizio del pannello e lo mostra nel colore d'accento. «Elimina link» chiede prima una conferma, perché il link viene rimosso per tutti i membri.",
  'help.guide.shared-links.result':
    'Il link compare come chip nel pannello «Link», fissato in cima, e appare subito sullo schermo di tutti i membri.',
  'help.guide.shared-links.tip.1':
    'Sono accettati solo indirizzi http o https. Tutto il resto viene rifiutato e la finestra resta aperta con quello che hai scritto.',
  'help.guide.shared-links.tip.2':
    "Prima vengono i link fissati, poi i più recenti. L'iconcina accanto a un titolo è la favicon del sito, caricata dal sito stesso, quindi senza connessione il chip mostra una semplice icona di link.",
  'help.guide.shared-links.tip.3':
    '«Link» ha un interruttore proprio in «Moduli», sotto «Collaborazione», così un amministratore può disattivare il pannello senza toccare il resto della scheda.',
  // create-poll
  'help.guide.create-poll.title': 'Fare una domanda al gruppo',
  'help.guide.create-poll.goal':
    'Trasforma una domanda a cui nessuno risponde in chat in un sondaggio a cui tutti possono votare.',
  'help.guide.create-poll.step.1':
    "Clicca «Nuovo sondaggio» nell'intestazione del riquadro «Sondaggi». Si apre la finestra.",
  'help.guide.create-poll.step.2':
    'Scrivi la domanda in «Domanda». «Markdown supportato» sotto il campo significa che qui puoi usare il grassetto, andare a capo o creare un breve elenco.',
  'help.guide.create-poll.step.3':
    "Compila «Opzione 1» e «Opzione 2» in «Opzioni». Servono almeno due opzioni non vuote, e un'opzione può occupare più righe.",
  'help.guide.create-poll.step.4':
    "«Aggiungi opzione», sotto le opzioni, ne aggiunge una terza, una quarta e quante ne servono. La piccola X accanto a una riga, visibile quando ci sono più di due opzioni, rimuove quell'opzione.",
  'help.guide.create-poll.step.5':
    "«Scelta multipla» permette a ognuno di spuntare più opzioni. Se è disattivata, quando una persona sceglie un'opzione diversa il suo voto si sposta sulla nuova.",
  'help.guide.create-poll.step.6': 'Clicca su «Crea sondaggio».',
  'help.guide.create-poll.result':
    "Il sondaggio compare in cima al pannello «Sondaggi», aperto, con 0 voti nell'intestazione.",
  'help.guide.create-poll.tip.1': 'La domanda supporta il Markdown; le opzioni restano testo semplice.',
  'help.guide.create-poll.tip.2':
    '«Crea sondaggio» resta disattivato finché non ci sono una domanda e almeno due opzioni compilate.',
  'help.guide.create-poll.tip.3':
    "Una scadenza si può impostare solo nell'app per telefono. Un sondaggio con scadenza mostra il tempo rimanente in un chip ambra nell'intestazione e si chiude quando il tempo scade.",
  'help.guide.create-poll.tip.4':
    'I sondaggi hanno un interruttore proprio in «Moduli», sotto «Collaborazione»: un amministratore può disattivarli e lasciare attivi gli altri quattro pannelli.',
  // vote-poll
  'help.guide.vote-poll.title': 'Votare e leggere il risultato',
  'help.guide.vote-poll.goal': 'Vota, vedi i risultati del gruppo e cambia il tuo voto.',
  'help.guide.vote-poll.step.1':
    "Clicca sull'opzione che preferisci. Il suo cerchio mostra una spunta, l'opzione riceve una cornice nel colore d'accento e la barra dietro si allunga.",
  'help.guide.vote-poll.step.2':
    "Ora vedi il risultato completo: la barra mostra la quota, la percentuale è a destra e i cerchietti sono le persone che hanno scelto quell'opzione, fino a un massimo di tre.",
  'help.guide.vote-poll.step.3':
    "Hai cambiato idea? Clicca un'altra opzione. In un sondaggio senza «Scelta multipla» il tuo voto passa alla nuova opzione invece di aggiungerne un secondo.",
  'help.guide.vote-poll.step.4':
    "Il numero di voti compare in un chip sotto la domanda. Se clicchi l'opzione che hai già scelto, il tuo voto viene ritirato e il conteggio scende.",
  'help.guide.vote-poll.result':
    'La tua opzione è spuntata, le barre mostrano come ha votato il gruppo e i cerchietti indicano chi ha scelto cosa.',
  'help.guide.vote-poll.tip.1':
    "Le percentuali e chi ha votato cosa compaiono solo dopo che hai votato, oppure quando il sondaggio è chiuso. Il numero di voti nell'intestazione è visibile a tutti.",
  'help.guide.vote-poll.tip.2':
    "Un voto non è mai anonimo: passa con il mouse su uno dei cerchi di un'opzione per vedere il nome di chi ha votato.",
  // close-poll
  'help.guide.close-poll.title': 'Chiudere o eliminare un sondaggio',
  'help.guide.close-poll.goal':
    'Chiudi la votazione quando il gruppo ha deciso ed elimina i sondaggi che non servono più.',
  'help.guide.close-poll.step.1':
    "«Chiudi», il lucchetto a destra nell'intestazione del sondaggio, termina la votazione. Le opzioni non sono più cliccabili.",
  'help.guide.close-poll.step.2':
    "Un sondaggio chiuso si sposta in fondo al pannello, sotto il titolo «Chiuso» se sopra ci sono sondaggi aperti. Ha un chip «Chiuso» e mostra il risultato a tutti, che abbiano votato o no. L'opzione vincente è in grassetto su una barra verde; se è quella che hai scelto tu, la barra usa invece il tuo colore d'accento.",
  'help.guide.close-poll.step.3':
    "«Elimina», il cestino a destra nell'intestazione, elimina il sondaggio. In un sondaggio chiuso è l'unico pulsante, perché il lucchetto non c'è più. Non viene chiesta alcuna conferma e vengono eliminati anche i voti.",
  'help.guide.close-poll.result':
    'Un sondaggio eliminato sparisce dal pannello di tutti i membri. Un sondaggio solo chiuso resta visibile in fondo, con il suo risultato.',
  'help.guide.close-poll.tip.1':
    'La chiusura è definitiva: non si può riaprire. Se un sondaggio è stato chiuso per errore, bisogna crearlo di nuovo.',
  'help.guide.close-poll.tip.2':
    '«Elimina» rimuove per tutti il sondaggio e tutti i voti, subito e senza chiedere conferma.',
  // whats-next
  'help.guide.whats-next.title': "Leggere «Cosa c'è dopo»",
  'help.guide.whats-next.goal': 'Scopri cosa fa il gruppo dopo, senza aprire il programma.',
  'help.guide.whats-next.step.1':
    "Il riquadro elenca le prossime tappe del viaggio, fino a otto, in ordine cronologico, raggruppate per giorno: «Oggi», «Domani» o la data, con accanto il titolo del giorno se ne ha uno. L'intestazione indica quante sono.",
  'help.guide.whats-next.step.2':
    "A sinistra di ogni tappa c'è il suo orario: l'inizio, «a» e la fine, se la tappa ne ha una, oppure «Da definire» se l'orario non è ancora impostato.",
  'help.guide.whats-next.step.3':
    "Accanto trovi il nome, l'indirizzo e, come chip, le persone che partecipano alla tappa. Se non è assegnato nessuno, sono elencati tutti i partecipanti al viaggio.",
  'help.guide.whats-next.result':
    'Un elenco di ciò che ti aspetta, in sola lettura: segue il programma, e niente qui lo modifica.',
  'help.guide.whats-next.tip.1':
    'Qui non si imposta nulla. Gli orari vengono dal piano del giorno; quando li cambi lì, questo elenco si aggiorna subito.',
  'help.guide.whats-next.tip.2':
    "Compare solo ciò che hai ancora davanti: una tappa sparisce dall'elenco quando il suo orario di inizio è passato, una tappa di oggi senza orario resta fino alla fine della giornata, e alla fine del viaggio il pannello è vuoto.",
  'help.guide.whats-next.tip.3':
    "«Cosa c'è dopo» ha un interruttore proprio in «Moduli», sotto «Collaborazione». È un pannello per desktop: la scheda «Collaborazione» dell'app per telefono non lo mostra.",
  // trip-chat
  'help.guide.trip-chat.title': 'Scrivere al gruppo',
  'help.guide.trip-chat.goal':
    'Invia un messaggio, rispondi a un messaggio specifico, reagisci a un altro ed elimina i tuoi.',
  'help.guide.trip-chat.step.1':
    'Scrivi in «Scrivi un messaggio...» e premi Invio. La freccia rotonda accanto al campo fa la stessa cosa. Con Maiusc+Invio vai invece a capo.',
  'help.guide.trip-chat.step.2':
    "Lo smile apre il selettore di emoji, con «Faccine», «Reazioni» e «Viaggio». L'emoji scelta viene aggiunta al testo che stai scrivendo e non viene inviata da sola.",
  'help.guide.trip-chat.step.3':
    "Passa con il mouse sul messaggio di un'altra persona: nell'angolo compare un piccolo pulsante rotondo. È «Rispondi».",
  'help.guide.trip-chat.step.4':
    'Il messaggio a cui rispondi viene citato sopra la casella. Scrivi e invia il messaggio: la citazione viene inviata insieme. Clicca sulla croce della citazione per toglierla.',
  'help.guide.trip-chat.step.5':
    'Fai clic destro su un messaggio per vedere le otto reazioni rapide. La tua reazione compare sotto il messaggio. Clicca di nuovo sulla stessa reazione per toglierla.',
  'help.guide.trip-chat.step.6':
    "Sui tuoi messaggi, accanto a «Rispondi», c'è «Elimina», l'icona del cestino. Il messaggio viene eliminato subito e al suo posto compare una nota che dice che l'hai eliminato. L'operazione è irreversibile.",
  'help.guide.trip-chat.result':
    "La tua risposta è il messaggio più recente e in cima mostra il messaggio citato. La tua reazione compare sotto l'altro messaggio. Al posto del messaggio eliminato, una nota indica che l'hai eliminato tu.",
  'help.guide.trip-chat.tip.1':
    'Invio invia, Maiusc+Invio va a capo. Un messaggio composto solo da una a tre emoji viene mostrato in grande.',
  'help.guide.trip-chat.tip.2':
    'Con «Allega immagini» puoi aggiungere fino a quattro immagini a un messaggio. Puoi anche incollarle o trascinarle nel campo.',
  'help.guide.trip-chat.tip.3':
    'Un messaggio con un link mostra sotto una scheda di anteprima, recuperata dal tuo TREK, quindi un link a qualcosa che solo tu puoi raggiungere resta un semplice link.',
  'help.guide.trip-chat.tip.4':
    "La chat ha un interruttore proprio in «Moduli», sotto «Collaborazione»: un amministratore può disattivarla e lasciare attivi note, link, sondaggi e «Cosa c'è dopo».",

  // ── Screen: trip-lists ────────────────────────────────────────────────────────────────
  'help.ctx.trip-lists.title': 'Liste',
  'help.ctx.trip-lists.summary':
    'Due liste per un viaggio: la lista valigia, con chi porta cosa e quanto pesa, e la lista delle cose da fare prima e durante il viaggio. La scheda è visibile quando il modulo Liste è attivo.',
  'help.ctx.trip-lists.bullet.1':
    "«Lista valigia» e «Da fare», nella barra in alto, passano dall'una all'altra e indicano quanti elementi contiene ciascuna; i pulsanti all'estremità destra della barra si riferiscono a quella aperta.",
  'help.ctx.trip-lists.bullet.2':
    "La lista valigia è suddivisa in liste, ad esempio Documenti o Abbigliamento, con il nome che preferisci. Ogni lista è una scheda. La sua intestazione ha una maniglia per trascinare l'intera lista in un'altra posizione, un pallino colorato, un badge con gli elementi pronti sul totale, i tre puntini con «Rinomina», «Seleziona tutti», «Deseleziona tutti» ed «Elimina lista», e una freccia per chiudere la scheda. «Aggiungi lista», nella barra in alto, ne crea una nuova.",
  'help.ctx.trip-lists.bullet.3':
    "Ogni riga ha una maniglia di trascinamento, una casella di spunta e un nome, poi il piccolo avatar di chi porta l'elemento. Un elemento con quantità superiore a uno ha anche un contatore dei pezzi pronti, ad esempio 3/10, con un meno e un più. Seguono la quantità in un piccolo badge e, se «Tracciamento valigia» è attivo, il peso in grammi e un cerchio della borsa, poi il cestino e un menu a tre puntini con «Sposta nella lista», «Condivisione», «Rinomina» ed «Elimina». I comandi che una riga non usa restano attenuati finché non ci passi sopra con il mouse.",
  'help.ctx.trip-lists.bullet.4':
    "«Condivisa» e «La mia lista» dividono in due la lista valigia: quella che vedono tutti e la tua. «Tutti», «Aperto» e «Fatto» accanto filtrano quella aperta. «A-Z», all'estremità della riga, mostra gli elementi di ogni lista in ordine alfabetico, e un secondo clic torna al tuo ordine. La scheda dei progressi in alto conta ciò che è già in valigia.",
  'help.ctx.trip-lists.bullet.5':
    "«Applica modello» e «Salva come modello» riempiono una lista o la salvano, così non devi scriverla a mano. Le due icone successive, «Esporta» e «Importa», esportano la lista come stampa, PDF o file, e importano una lista. Il pulsante rosso all'estremità destra della scheda dei progressi indica quanti elementi sono spuntati e li rimuove.",
  'help.ctx.trip-lists.bullet.6':
    "«Da fare» ha una barra laterale propria: la scheda dei progressi, i filtri «Tutti», «Le mie attività», «Scaduta» e «Fatto», una riga per ogni lista e sotto «Aggiungi lista». Le attività sono raccolte in una scheda, la cui intestazione mostra il nome del filtro e l'ordinamento, «Priorità» o «Scadenza». Clicca su un'attività per aprirla nel pannello a destra. «Nuova attività» nella barra apre la finestra «Nuova attività».",
  // packing-categories
  'help.guide.packing-categories.title': 'Creare la lista valigia',
  'help.guide.packing-categories.goal':
    'Raggruppa in liste quello che porti, aggiungi elementi e scegli chi si occupa di ogni lista.',
  'help.guide.packing-categories.step.1':
    "Clicca «Aggiungi lista» nella barra sopra le liste. Si apre una piccola finestra. Scrivi il nome nella fascia in alto, dove c'è scritto «Nome della lista (es. Abbigliamento)», e clicca «Aggiungi».",
  'help.guide.packing-categories.step.2':
    "La nuova lista parte con una riga segnaposto che mostra solo tre puntini chiari. Clicca «Aggiungi articolo» in fondo alla riga, scrivi l'elemento in «Nome elemento...» e premi Invio: il primo elemento sostituisce il segnaposto e il campo resta aperto per il successivo.",
  'help.guide.packing-categories.step.3':
    "Rinomina una riga cliccando sul nome, oppure con «Rinomina» nei tre puntini all'estremità destra.",
  'help.guide.packing-categories.step.4':
    'Il cerchio tratteggiato con una persona, nella fascia superiore della lista, assegna membri del viaggio alla lista. Scegli un nome. Per togliere di nuovo quella persona, clicca sul chip che compare.',
  'help.guide.packing-categories.step.5':
    "I tre puntini accanto al conteggio aprono altre opzioni: «Rinomina», «Seleziona tutti», «Deseleziona tutti» ed «Elimina lista». «Elimina lista» elimina la lista e tutti i suoi elementi senza chiedere ulteriore conferma. La freccia all'estrema destra comprime la lista.",
  'help.guide.packing-categories.result':
    'La nuova lista compare nella griglia con i suoi elementi e il suo pallino colorato, e il badge conta quanto è già in valigia.',
  'help.guide.packing-categories.tip.1':
    "Una lista esiste solo attraverso i suoi elementi. Se elimini l'ultimo elemento, la riga diventa un segnaposto, così la lista mantiene posizione e colore; se elimini anche quella riga, la lista viene eliminata.",
  'help.guide.packing-categories.tip.2':
    'Quando assegni una persona a una lista, riceve una notifica sulla valigia. Questo non cambia chi può vedere gli elementi: lo imposti in «Condivisione», nel menu con i tre puntini di una riga.',
  'help.guide.packing-categories.tip.3':
    'Due liste possono avere lo stesso nome. TREK le distingue internamente, quindi i nomi restano come li hai scritti.',
  // check-off-packing
  'help.guide.check-off-packing.title': 'Spuntare gli elementi mentre fai la valigia',
  'help.guide.check-off-packing.goal':
    'Segna cosa hai messo in valigia, segui la barra dei progressi e rimuovi gli elementi già in valigia.',
  'help.guide.check-off-packing.step.1':
    'Clicca sulla casella a sinistra di una riga: il nome viene barrato e la barra dei progressi si aggiorna.',
  'help.guide.check-off-packing.step.2':
    'Il riquadro di avanzamento sopra le liste mostra quanti elementi sono già in valigia sul totale della lista, con un numero, una percentuale e una barra.',
  'help.guide.check-off-packing.step.3':
    "Per spuntare un'intera lista in una volta, usa «Seleziona tutti» e «Deseleziona tutti» nel menu con i tre puntini della sua intestazione.",
  'help.guide.check-off-packing.step.4':
    '«Tutti», «Aperto» e «Fatto», accanto a «Condivisa» e «La mia lista», filtrano la griglia. «Aperto» mostra solo quello che manca ancora, quindi una lista completata viene nascosta.',
  'help.guide.check-off-packing.step.5':
    "Il pulsante rosso «Rimuovi … spuntati», all'estremità destra della scheda dei progressi e con il numero di elementi spuntati, li elimina tutti in una volta dopo una conferma del browser.",
  'help.guide.check-off-packing.result':
    'Vengono elencati solo gli elementi ancora aperti e la barra in alto mostra a che punto sei con la valigia.',
  'help.guide.check-off-packing.tip.1': 'Un elemento spuntato si può comunque rinominare: clicca sul suo nome.',
  'help.guide.check-off-packing.tip.2':
    '«Seleziona tutti» e «Deseleziona tutti» agiscono su una lista alla volta, dai tre puntini di quella lista.',
  'help.guide.check-off-packing.tip.3':
    'Quando tutti gli elementi sono spuntati, al posto del contatore compare «Tutto in valigia!» e la barra diventa verde.',
  // apply-packing-template
  'help.guide.apply-packing-template.title': 'Applicare un modello di lista valigia',
  'help.guide.apply-packing-template.goal':
    'Aggiungi al viaggio una lista già pronta e salva la lista di questo viaggio per il prossimo.',
  'help.guide.apply-packing-template.step.1': 'Clicca «Applica modello» nella barra sopra la lista.',
  'help.guide.apply-packing-template.step.2':
    'Scegli un modello. Per ognuno vedi il nome e il numero di elementi che contiene.',
  'help.guide.apply-packing-template.step.3':
    'Gli elementi vengono aggiunti alla vista in cui ti trovi: «Condivisa» li aggiunge alla lista condivisa che vedono tutti, «La mia lista» alla tua lista personale.',
  'help.guide.apply-packing-template.step.4':
    'Per conservare la lista di questo viaggio per il prossimo, clicca su «Salva come modello». Si apre una piccola finestra: scrivi un nome nel campo in alto, dove compare «Nome modello», e clicca su «Salva».',
  'help.guide.apply-packing-template.result':
    'Le liste e gli elementi del modello vengono aggiunti al viaggio, accanto a quelli già presenti.',
  'help.guide.apply-packing-template.tip.1':
    'Un modello copia lista, quantità, peso e borsa di ogni elemento, e crea le borse che il viaggio non ha ancora. Le spunte non vengono copiate, e nulla di ciò che è già nella lista viene rimosso.',
  'help.guide.apply-packing-template.tip.2':
    "«Applica modello» c'è solo se esiste almeno un modello. Altrimenti il pulsante non compare.",
  'help.guide.apply-packing-template.tip.3':
    "«Salva come modello» compare solo per un amministratore dell'istanza e solo se la lista contiene elementi. Salva gli elementi condivisi e i tuoi, mai quelli privati degli altri membri.",
  // import-packing-list
  'help.guide.import-packing-list.title': "Incollare un'intera lista valigia",
  'help.guide.import-packing-list.goal':
    'Trasforma in un colpo solo in elementi della valigia una lista che hai già altrove.',
  'help.guide.import-packing-list.step.1':
    "Clicca su «Importa», l'icona con la freccia verso il basso all'estremità destra della barra sopra la lista.",
  'help.guide.import-packing-list.step.2':
    'Un elemento per riga: categoria, nome, peso in g (facoltativo), borsa (facoltativa), checked/unchecked (facoltativo). L\'esempio grigio nel riquadro mostra tutti e quattro i formati, e i numeri sul bordo sinistro contano le righe che scrivi. Funziona anche un elenco Markdown: un titolo dà il nome alla lista, e "- [ ]" e "- [x]" diventano elementi.',
  'help.guide.import-packing-list.step.3':
    'Oppure carica le righe da un file con «Carica CSV/TXT/MD», in basso a sinistra nella finestra. Accetta file .csv, .txt o .md e sostituisce il contenuto del riquadro.',
  'help.guide.import-packing-list.step.4':
    'Clicca «Importa 3» in basso a destra: il numero indica quante righe TREK ha riconosciuto.',
  'help.guide.import-packing-list.result':
    'Ogni riga diventa un elemento, nella lista indicata nel suo primo campo. Gli elementi già presenti non cambiano.',
  'help.guide.import-packing-list.tip.1':
    'Virgole, punti e virgola e tabulazioni separano i campi, mentre le virgolette doppie tengono unito un campo, così "Camicia, blu" resta un unico nome. Una riga con un solo valore è solo un nome. Una riga senza una lista propria finisce in «Altro». "3x" davanti a un nome imposta la quantità.',
  'help.guide.import-packing-list.tip.2':
    'Se il viaggio non ha ancora la borsa indicata nel quarto campo, TREK la crea. «Importa» e «Applica modello» sono i due modi per aggiungere pesi e borse a molti elementi in una volta.',
  // export-packing-list
  'help.guide.export-packing-list.title': 'Stampare o esportare la lista valigia',
  'help.guide.export-packing-list.goal':
    "Stampa la lista, salvala in PDF o esportala come file per un'altra app o per il prossimo viaggio.",
  'help.guide.export-packing-list.step.1':
    "Clicca su «Esporta», l'icona con la freccia verso l'alto nella barra sopra la lista, subito prima di «Importa».",
  'help.guide.export-packing-list.step.2':
    '«Checklist in Markdown (.md)» e «CSV per l’importazione (.csv)» salvano subito la lista come file.',
  'help.guide.export-packing-list.step.3':
    "Clicca «Stampa o salva come PDF». L'anteprima mostra la lista come pagina: in alto il viaggio, le date e quanto è già in valigia, poi ogni lista come riquadro, con una casella da spuntare per ogni elemento.",
  'help.guide.export-packing-list.step.4':
    "Clicca «Stampa o salva come PDF» sotto l'anteprima. Il browser apre la finestra di stampa: scegli una stampante oppure «Salva come PDF» per salvare un file.",
  'help.guide.export-packing-list.result':
    'La stampa e i file contengono la vista aperta, «Condivisa» o «La mia lista», con quantità, pesi e spunte.',
  'help.guide.export-packing-list.tip.1':
    'Il CSV è il formato letto da «Importa», valigie comprese, quindi puoi usarlo come tuo modello di lista valigia: importalo nel prossimo viaggio.',
  'help.guide.export-packing-list.tip.2':
    'Il file Markdown si apre come checklist in Obsidian, Notion o GitHub, e puoi importarlo di nuovo con «Importa».',
  // share-packing-item
  'help.guide.share-packing-item.title': 'Decidere chi vede un elemento e chi lo porta',
  'help.guide.share-packing-item.goal':
    'Sposta un elemento tra la lista comune del gruppo, la tua lista personale e le persone per cui lo porti.',
  'help.guide.share-packing-item.step.1':
    'Sopra le liste, «Condivisa» è la lista che vedono tutti e «La mia lista» è la tua. Per ciascuna è indicato il numero di elementi. Clicca «La mia lista» per vedere la tua.',
  'help.guide.share-packing-item.step.2':
    'Torna in «Condivisa», apri i tre puntini alla fine di una riga e clicca «Condivisione».',
  'help.guide.share-packing-item.step.3':
    "Ci sono tre livelli: «Condivisa», visibile a tutto il gruppo; «Personale», che vedi solo tu; e «Condividi con…», dove scegli le persone a cui è destinato l'elemento.",
  'help.guide.share-packing-item.step.4':
    'Un elemento «Personale» si trova solo in «La mia lista». Passa a «La mia lista» per trovarlo.',
  'help.guide.share-packing-item.step.5':
    "Apri di nuovo «Condivisione» e spunta un nome sotto «Condividi con…». L'elemento compare anche nella lista di quella persona, e la riga mostra un piccolo badge con il numero di persone con cui è condiviso.",
  'help.guide.share-packing-item.result': "L'elemento è nel livello che hai scelto, e la riga mostra chi lo porta.",
  'help.guide.share-packing-item.tip.1':
    'Solo chi porta un elemento può cambiarne la condivisione. Chi lo riceve in condivisione lo vede nella propria «La mia lista» con un piccolo badge a forma di mano, che mostra il tuo nome quando ci passa sopra con il mouse, e può spuntarlo.',
  'help.guide.share-packing-item.tip.2':
    "Su un elemento condiviso che porta qualcun altro, il menu con i tre puntini mostra, al posto di «Condivisione», altre due voci: «Posso portarlo anch'io», che ti aggiunge accanto a quella persona, e «Copia nella mia lista», che ne crea una copia privata per te.",
  'help.guide.share-packing-item.tip.3':
    'I nuovi elementi prendono la condivisione dalla vista in cui li aggiungi. Gli elementi aggiunti in «Condivisa» sono condivisi con tutti. Quelli aggiunti in «La mia lista» sono «Personale», a meno che ogni elemento di quella lista sia condiviso con le stesse persone: in quel caso anche il nuovo elemento viene condiviso con loro.',
  // packing-bags
  'help.guide.packing-bags.title': 'Pesare le valigie',
  'help.guide.packing-bags.goal':
    'Assegna un peso a ogni elemento, distribuisci gli elementi nelle valigie e mantieni ogni valigia entro il limite della compagnia aerea.',
  'help.guide.packing-bags.step.1':
    "Clicca il badge del peso prima del cerchio e inserisci il peso dell'elemento in grammi.",
  'help.guide.packing-bags.step.2': "Il cerchio dopo il peso è la borsa dell'elemento. Cliccalo.",
  'help.guide.packing-bags.step.3':
    "Se non c'è ancora una borsa, clicca su «Aggiungi valigia», scrivi un nome e premi Invio. La borsa viene creata e l'elemento viene messo al suo interno.",
  'help.guide.packing-bags.step.4':
    'La scheda «Valigie» compare a destra delle liste appena esiste una borsa. Ogni borsa mostra nome, chi la porta, una barra di riempimento, il numero di elementi e il peso. Sotto le borse ci sono «Non assegnato» e «Peso totale» e, più in basso, «In valigia»: il peso già messo in valigia, con una barra sottile che ne indica la quota.',
  'help.guide.packing-bags.step.5':
    'Clicca su «Imposta limite» accanto al peso della borsa e inserisci il limite in chilogrammi, come lo indicano le compagnie aeree.',
  'help.guide.packing-bags.step.6':
    'Il più tratteggiato alla fine della riga con il nome della borsa, subito prima della croce, apre «Assegna membri». Spunta i membri che portano la borsa: compaiono accanto al più, e «Per persona», in fondo alla scheda, elenca cosa porta ciascuno.',
  'help.guide.packing-bags.result':
    'La scheda «Valigie» a destra mostra il peso di ogni borsa rispetto al suo limite, cosa non è in nessuna borsa, cosa porta ciascuno, e il totale con la parte già in valigia.',
  'help.guide.packing-bags.tip.1':
    "Il campo del peso, il cerchio della valigia e il riquadro «Valigie» ci sono solo se un amministratore ha attivato «Tracciamento valigia» nell'addon Liste. Se la finestra è più stretta, le valigie si aprono invece dal pulsante «Valigie» sopra il riquadro di avanzamento.",
  'help.guide.packing-bags.tip.2':
    'Il server calcola il peso di una valigia sommando gli elementi di tutti i membri, compresi quelli che non vedi, quindi il valore corrisponde al peso reale.',
  'help.guide.packing-bags.tip.3':
    'Una valigia senza limite viene confrontata con quella più pesante, così puoi paragonare le barre. Se imposti un limite, la barra viene misurata rispetto a quel limite.',
  // create-todo
  'help.guide.create-todo.title': "Aggiungere un'attività",
  'help.guide.create-todo.goal': "Annota un'attività, con una lista, una priorità, una data e una persona assegnata.",
  'help.guide.create-todo.step.1': "Clicca su «Nuova attività» all'estremità destra della barra.",
  'help.guide.create-todo.step.2':
    'Si apre la finestra «Nuova attività», con il cursore in alto. Scrivi il nome nel campo «Nome attività», e aggiungi sotto «Descrizione» tutto ciò che vuoi ricordare.',
  'help.guide.create-todo.step.3':
    "«Lista» raggruppa l'attività. Scegline una oppure usa il + accanto per crearne una nuova in una piccola finestra.",
  'help.guide.create-todo.step.4': '«Priorità» ha quattro pulsanti: «Nessuno», «P1», «P2» e «P3», dal rosso al blu.',
  'help.guide.create-todo.step.5':
    "«Scadenza», accanto a «Lista», apre un calendario e «Assegnato a» assegna l'attività a una persona.",
  'help.guide.create-todo.step.6': 'Clicca «Crea attività».',
  'help.guide.create-todo.result':
    "L'attività è nella lista con priorità, scadenza e lista come badge e l'avatar della persona assegnata in fondo alla riga, e si apre nel pannello a destra.",
  'help.guide.create-todo.tip.1':
    'È obbligatorio solo il nome. Tutto il resto si può compilare in seguito dal pannello a destra.',
  'help.guide.create-todo.tip.2':
    'Se nella barra laterale è selezionata una lista, una nuova attività viene creata in quella lista.',
  'help.guide.create-todo.tip.3':
    "Premendo Invio nel campo del nome, l'attività viene creata subito, senza toccare gli altri campi.",
  // todo-filters
  'help.guide.todo-filters.title': "Trovare e modificare un'attività",
  'help.guide.todo-filters.goal': 'Mostra solo le attività che contano adesso, poi modifica quella che hai trovato.',
  'help.guide.todo-filters.step.1':
    '«Attività» nella barra laterale: «Tutti» mostra tutto ciò che è ancora aperto, «Le mie attività» quello che è assegnato a te, «Scaduta» le attività con una data passata e «Fatto» quelle completate. Per ognuna è indicato il numero. Clicca «Scaduta».',
  'help.guide.todo-filters.step.2':
    "Sotto «Liste» c'è una riga per ogni lista. Scegline una per mostrare quella lista, comprese le attività completate.",
  'help.guide.todo-filters.step.3':
    "L'ordinamento in cima alla lista cambia l'ordine di ciò che vedi: «Priorità» mette per prima la P1, «Scadenza» mette per prima la scadenza più vicina. Puoi usarne solo uno alla volta, e un secondo clic torna al tuo ordine.",
  'help.guide.todo-filters.step.4': "Clicca su un'attività per aprirla nel pannello a destra.",
  'help.guide.todo-filters.step.5':
    "Modifica ciò che ti serve: il nome, «Priorità», «Elenco», «Scadenza» o «Assegnato a». «Descrizione» mostra il testo con i link cliccabili; cliccaci dentro per modificarlo. Poi clicca su «Salva modifiche» in fondo al pannello. La casella nell'intestazione del pannello segna l'attività come completata, e «Elimina» accanto a «Salva modifiche» la elimina subito.",
  'help.guide.todo-filters.result':
    "L'elenco mostra solo le attività che hai filtrato e nel pannello a destra modifichi quella selezionata.",
  'help.guide.todo-filters.tip.1':
    'La riga di una lista conta solo le attività aperte, ma quando la selezioni vedi anche quelle completate. «Tutti», «Le mie attività» e «Scaduta» nascondono le attività completate; «Fatto» mostra solo quelle.',
  'help.guide.todo-filters.tip.2':
    "Nell'ordinamento, «Priorità» e «Scadenza» non si possono usare insieme. Finché uno dei due è attivo, non puoi trascinare le righe in un ordine personale.",

  // ── Screen: trip-bookings ─────────────────────────────────────────────────────────────
  'help.ctx.trip-bookings.title': 'Prenotazioni',
  'help.ctx.trip-bookings.summary':
    "Questa scheda contiene tutto ciò che è prenotato per il viaggio, tranne i trasporti: alloggi, tavoli, biglietti, tour e parcheggi. Ogni prenotazione è una scheda, una riga dell'elenco o una barra nella cronologia, con codice, documenti, viaggiatori e costo. Clicca su una prenotazione per aprirne i dettagli.",
  'help.ctx.trip-bookings.bullet.1':
    "«Prenotazione manuale», all'estremità destra della barra, apre «Nuova prenotazione». Crea sei tipi di prenotazione: «Alloggio», «Ristorante», «Evento», Tour, «Parcheggio» e «Altro». Voli, treni e altri trasporti si trovano nella scheda «Trasporti» e qui non compaiono mai.",
  'help.ctx.trip-bookings.bullet.2':
    "L'icona di download prima di «Prenotazione manuale», «Importa conferme di prenotazione», carica le conferme perché TREK le legga automaticamente: EML, PDF, PKPass, HTML o TXT, al massimo cinque file da 10 MB, e foto se il modello di IA legge le immagini. L'icona compare solo se il server è in grado di leggerle.",
  'help.ctx.trip-bookings.bullet.3':
    "«Cerca» trova titoli, tipi, luoghi, note, codici di prenotazione e viaggiatori. «Filtra», l'imbuto accanto, restringe la scheda per «Stato», per «Tipo» con il conteggio di ciascuno e, non appena una prenotazione indica delle persone, per «Viaggiatori». Il numero sull'imbuto indica quanti filtri sono attivi.",
  'help.ctx.trip-bookings.bullet.4':
    "Le tre icone dopo «Filtra» cambiano la vista: «Schede», «Elenco» e «Cronologia». «Opzioni di visualizzazione», i cursori accanto, raggruppa e ordina schede ed elenco o imposta le corsie della cronologia, e l'icona del foglio di calcolo che segue, «Esporta come foglio di calcolo (CSV)», scarica in un file ciò che la scheda mostra. Per impostazione predefinita le schede sono raggruppate in «Confermata» e «In attesa», e l'elenco per giorno. Clicca sul titolo di una sezione per comprimerla.",
  'help.ctx.trip-bookings.bullet.5':
    "Ogni scheda ha un'intestazione colorata in base allo stato, con il pallino dello stato (con un clic passi da «In attesa» a «Confermata»), il tipo, il titolo, la matita e il cestino. Sotto trovi i dettagli presenti nella prenotazione: «Data», «Ora», «Codice prenotazione», «Check-in» e «Check-out», «Posizione / Indirizzo», «Alloggio», «Collegata a» (la tappa nel programma), «Link», «Note», «Viaggiatori», «File» e i costi collegati.",
  'help.ctx.trip-bookings.bullet.6':
    "Un clic su una scheda, una riga o una barra apre il dettaglio della prenotazione, con in fondo «Sulla mappa» (se la prenotazione ha un luogo), il cestino e «Modifica». L'eliminazione chiede conferma una volta («Eliminare la prenotazione?», che ti avvisa se verranno eliminati anche dei costi). Poi vengono eliminate la prenotazione e le spese collegate e, per un alloggio, le sue notti vengono tolte dal piano del giorno.",
  // booking-views
  'help.guide.booking-views.title': 'Cambiare vista e aprire una prenotazione',
  'help.guide.booking-views.goal':
    'Visualizza le prenotazioni come schede, come elenco o su una cronologia e aprine una per vederne tutti i dettagli.',
  'help.guide.booking-views.step.1':
    'Le tre icone dopo «Filtra» nella barra sono le viste, e ognuna mostra il suo nome quando la punti: «Schede», «Elenco» e «Cronologia». La scheda si apre in «Schede», con una scheda per prenotazione nelle sezioni «Confermata» e «In attesa». Clicca su «Elenco», quella al centro.',
  'help.guide.booking-views.step.2':
    "«Elenco» mostra una riga per prenotazione sotto un titolo per ogni giorno, con giorno e ora a destra; con i tasti freccia passi da una riga all'altra. Clicca su «Cronologia», l'ultima delle tre.",
  'help.guide.booking-views.step.3':
    "«Cronologia» mostra le prenotazioni sui giorni del viaggio: una corsia per tipo e una barra dall'inizio alla fine di ciascuna. Una prenotazione in attesa ha il contorno tratteggiato. «Viaggio» adatta l'intero viaggio alla larghezza; clicca sul titolo di un giorno per vedere quel giorno ora per ora.",
  'help.guide.booking-views.step.4':
    "«Giorno» mostra una sola giornata su una scala oraria, e la lunghezza di ogni barra ne indica la durata. Le frecce accanto al nome del giorno passano al giorno precedente e a quello successivo. Mentre il viaggio è in corso, «Oggi» salta al giorno attuale, e il selettore «Viaggio» / «Giorno» a destra torna all'intero viaggio.",
  'help.guide.booking-views.step.5':
    'Passa il mouse su una barra per vederne giorno, orari e luogo, poi cliccala per aprire i dettagli della prenotazione. Una scheda in «Schede» e una riga in «Elenco» aprono la stessa finestra.',
  'help.guide.booking-views.step.6':
    "L'intestazione della vista dettagliata mostra il titolo e le etichette per lo stato (un clic lo cambia), il tipo, il giorno e il codice di prenotazione, con un pulsante per copiarlo. Sotto trovi gli orari in riquadri, poi il luogo, i viaggiatori, le note, i costi e i file, se presenti, e in fondo «Sulla mappa», il cestino e «Modifica».",
  'help.guide.booking-views.result':
    'La prenotazione si apre nella vista dettagliata: «Modifica» apre il modulo, «Sulla mappa» la mostra nel programma e «Chiudi» o Esc ti riportano alla vista di prima.',
  'help.guide.booking-views.tip.1':
    "«Opzioni di visualizzazione», l'icona con i cursori dopo le icone delle viste, ti permette di raggruppare e ordinare «Schede» ed «Elenco» con «Raggruppa per» e «Ordina per». In «Cronologia» propone «Una corsia per tipo» e «Mostra l'altra scheda». «Mostra l'altra scheda» mostra le voci della scheda Trasporti, attenuate, in una corsia sottile in alto. «Reimposta vista» ripristina i valori predefiniti e ogni scheda ricorda la sua vista in questo browser.",
  'help.guide.booking-views.tip.2':
    'Una prenotazione prima o dopo il viaggio, o senza data, non può comparire nella cronologia. Compare sotto il grafico come piccola scheda, in «Prima del viaggio», «Dopo il viaggio» o «Nessuna data».',
  'help.guide.booking-views.tip.3':
    'Lo stesso dettaglio si apre ovunque compaia una prenotazione: nella scheda «Trasporti», nel piano del giorno, nei dettagli di un giorno e in quelli di un luogo. Un clic sul titolo rinomina la prenotazione.',
  // create-booking
  'help.guide.create-booking.title': 'Creare una prenotazione',
  'help.guide.create-booking.goal':
    'Aggiungi a mano al viaggio un ristorante, un evento, un tour, un parcheggio o qualsiasi altra cosa.',
  'help.guide.create-booking.step.1':
    "Clicca «Prenotazione manuale» all'estremità destra della barra. Si apre «Nuova prenotazione», con il titolo e due etichette nell'intestazione in alto.",
  'help.guide.create-booking.step.2':
    "Clicca l'etichetta del tipo nella fascia in alto, che in una nuova prenotazione indica «Altro», e scegli il «Tipo di prenotazione». Da questa scheda puoi creare sei tipi: Alloggio, Ristorante, Evento, Tour, Parcheggio e Altro. Il modulo cambia in base alla scelta: solo «Alloggio» usa un intervallo di giorni invece delle date.",
  'help.guide.create-booking.step.3':
    "Scrivi il titolo nella fascia in alto, nel campo sopra le etichette. È l'unico campo obbligatorio e «Aggiungi» resta disattivato finché non inserisci qualcosa.",
  'help.guide.create-booking.step.4':
    "Imposta «Data» e «Ora di inizio», e «Data fine» e «Ora di fine» se la prenotazione ha una fine. I calendari propongono solo giorni compresi nel viaggio. Una data e un'ora di fine che non sono successive all'inizio compaiono in rosso e bloccano «Aggiungi». Un'ora di fine precedente all'ora di inizio senza data di fine dà solo un avviso: se la prenotazione termina il giorno dopo, imposta una data di fine.",
  'help.guide.create-booking.step.5':
    "Inserisci il «Codice prenotazione» della conferma, poi clicca sulla pillola dello stato nell'intestazione, accanto al tipo. Su una nuova prenotazione mostra «In attesa» e passa a «Confermata». Lo stato determina in quale sezione compare la scheda.",
  'help.guide.create-booking.step.6': 'Clicca su «Aggiungi» in fondo al modulo.',
  'help.guide.create-booking.result':
    "La prenotazione compare come scheda nella sua sezione. Il colore dell'intestazione indica lo stato, e la scheda mostra tipo, data, orari e codice. Tutti gli altri partecipanti al viaggio la vedono subito.",
  'help.guide.create-booking.tip.1':
    '«Posizione / Indirizzo» suggerisce indirizzi reali mentre scrivi; se ne scegli uno, sostituisce quello che hai scritto, mentre un indirizzo inserito da te resta invariato.',
  'help.guide.create-booking.tip.2':
    'In «Link» inserisci la pagina della prenotazione sul sito del fornitore. La scheda e la vista dettagliata la mostrano come link che si apre in una nuova scheda.',
  'help.guide.create-booking.tip.3':
    'Le note supportano il Markdown, quindi un elenco o una riga in grassetto vengono mostrati come tali sulla scheda e nella vista dettagliata.',
  // booking-hotel
  'help.guide.booking-hotel.title': 'Prenotare un alloggio',
  'help.guide.booking-hotel.goal':
    'Inserisci un alloggio in modo che valga sia come prenotazione sia come notti nel piano del giorno.',
  'help.guide.booking-hotel.step.1':
    "Clicca su «Prenotazione manuale» e scegli «Alloggio» con la pillola del tipo nella fascia superiore. I campi della data vengono sostituiti da una serie di campi per l'hotel.",
  'help.guide.booking-hotel.step.2':
    "Scegli l'hotel sotto «Alloggio». L'elenco contiene i luoghi del viaggio, escluse tracce importate ed escursioni. Quando ne scegli uno, il nome finisce nel titolo, se è vuoto, e l'indirizzo in «Posizione / Indirizzo».",
  'help.guide.booking-hotel.step.3':
    'Imposta «Da» e «A»: la prima notte e la mattina della partenza. Entrambi propongono i giorni del viaggio con le date, e TREK mantiene «A» dopo «Da».',
  'help.guide.booking-hotel.step.4':
    'Compila «Check-in», «Check-in fino a» e «Check-out», e il «Codice prenotazione» indicato nella conferma.',
  'help.guide.booking-hotel.step.5': 'Clicca «Aggiungi».',
  'help.guide.booking-hotel.result':
    "La scheda mostra l'intervallo di giorni in «Data», gli orari di check-in e check-out e l'indirizzo. Il soggiorno ora compare anche in quei giorni del programma.",
  'help.guide.booking-hotel.tip.1':
    "«Alloggio» è l'unico tipo senza «Data» e senza «Ora di inizio». Le sue date sono «Da» e «A», e scegli i giorni del viaggio, non date del calendario.",
  'help.guide.booking-hotel.tip.2':
    "Lascia vuoto «Alloggio» e scrivi invece l'indirizzo: il luogo viene cercato, creato e posizionato sulla mappa per te.",
  'help.guide.booking-hotel.tip.3':
    'Quando elimini la prenotazione, le sue notti vengono tolte anche dal piano del giorno.',
  // link-booking
  'help.guide.link-booking.title': 'Collegare una prenotazione al programma',
  'help.guide.link-booking.goal':
    'Collega una prenotazione alla sua tappa e al suo luogo, così la trovi dove ti serve.',
  'help.guide.link-booking.step.1':
    "Passa il mouse sulla scheda da collegare e clicca la matita nell'intestazione. Si apre «Modifica prenotazione».",
  'help.guide.link-booking.step.2':
    "Apri «Collega all'assegnazione del giorno». L'elenco mostra il tuo programma: un titolo per ogni giorno, poi le tappe di quel giorno, numerate e con i loro orari. Scegli la tappa a cui appartiene la prenotazione.",
  'help.guide.link-booking.step.3':
    '«Luogo / Attività» collega il luogo stesso. Sceglilo lì e, se sono vuoti, il titolo e «Posizione / Indirizzo» vengono compilati automaticamente.',
  'help.guide.link-booking.step.4': 'Clicca su «Aggiorna».',
  'help.guide.link-booking.result':
    'La scheda mostra il giorno e la tappa sotto «Collegata a», e nel piano del giorno la prenotazione compare con quella tappa.',
  'help.guide.link-booking.tip.1':
    "«Nessun collegamento (autonomo)», in cima all'elenco, toglie di nuovo il collegamento. Un alloggio non ha il selettore della tappa: è collegato tramite le sue notti.",
  'help.guide.link-booking.tip.2':
    'Se scegli una tappa in un giorno con data, il campo «Data», se vuoto, viene compilato automaticamente. Una data già impostata non cambia.',
  // booking-travelers
  'help.guide.booking-travelers.title': 'Indicare per chi è una prenotazione',
  'help.guide.booking-travelers.goal':
    'Indica per quali viaggiatori è una prenotazione e poi mostra solo le loro prenotazioni.',
  'help.guide.booking-travelers.step.1':
    'Apri la prenotazione con la matita sulla sua scheda. «Viaggiatori» si trova accanto a «Codice prenotazione». Finché non è assegnato nessuno, mostra «Assegna viaggiatori».',
  'help.guide.booking-travelers.step.2':
    "Cliccalo e scegli le persone a cui si riferisce questa prenotazione; nell'elenco ci sono anche gli ospiti con nome. Una persona selezionata riceve una spunta e il suo avatar compare nel campo. Clicca di nuovo sul nome per toglierla.",
  'help.guide.booking-travelers.step.3': 'Clicca su «Aggiorna».',
  'help.guide.booking-travelers.step.4':
    'Clicca su «Filtra» nella barra: sotto «Viaggiatori», clicca su una persona per vedere solo le sue prenotazioni. Puoi attivarne più di una insieme.',
  'help.guide.booking-travelers.result':
    'La scheda elenca le persone a cui si riferisce e «Filtra» restringe la vista alle prenotazioni delle persone che scegli.',
  'help.guide.booking-travelers.tip.1':
    'Sulla scheda e nella vista dettagliata i viaggiatori vengono solo mostrati e non puoi modificarli. Li imposti qui, nel modulo.',
  'help.guide.booking-travelers.tip.2':
    '«Viaggiatori» compare in «Filtra» quando il viaggio ha più di un membro e almeno una prenotazione indica qualcuno. La scelta resta finché non chiudi la scheda del browser.',
  // booking-files
  'help.guide.booking-files.title': 'Tenere il voucher insieme alla prenotazione',
  'help.guide.booking-files.goal': 'Allega la conferma, il biglietto o il pass alla prenotazione a cui si riferiscono.',
  'help.guide.booking-files.step.1':
    'Apri la prenotazione con la matita sulla sua scheda. «File» si trova accanto a «Collega»: lì clicca su «Allega file». Per una prenotazione già esistente, il documento viene caricato subito e TREK mostra «File caricato».',
  'help.guide.booking-files.step.2': 'Il documento compare con il suo nome, un pulsante per aprirlo e una X accanto.',
  'help.guide.booking-files.step.3':
    '«Collega file esistente» propone i documenti del viaggio non ancora collegati a questa prenotazione. Scegline uno e viene allegato senza doverlo ricaricare.',
  'help.guide.booking-files.step.4': 'Clicca «Aggiorna».',
  'help.guide.booking-files.result':
    "La scheda e la vista dei dettagli elencano i documenti sotto «File». Clicca su un documento per aprirlo. «Mostra nei file», sopra l'elenco nella vista dei dettagli, ti porta alla scheda «File».",
  'help.guide.booking-files.tip.1':
    'Se stai ancora creando la prenotazione, il documento viene caricato quando clicchi su «Aggiungi». Per caricare serve una connessione.',
  'help.guide.booking-files.tip.2':
    'La X accanto a un documento rimuove il collegamento, non il documento, che resta nella scheda «File» del viaggio.',
  'help.guide.booking-files.tip.3':
    "L'amministratore stabilisce quali tipi di file si possono allegare in «Tipi di File Consentiti». Per impostazione predefinita sono consentiti documenti, testo e immagini.",
  // booking-cost
  'help.guide.booking-cost.title': 'Trasformare il prezzo di una prenotazione in un costo',
  'help.guide.booking-cost.goal': 'Aggiungi a «Costi» il costo di una prenotazione, diviso tra chi la paga.',
  'help.guide.booking-cost.step.1':
    "Apri la prenotazione con la matita sulla sua scheda e vai in fondo al modulo. Sotto «Costi» trovi «Crea spesa» e «Collega spesa esistente», con la nota che indica che la prenotazione viene salvata e poi si apre l'editor dei costi.",
  'help.guide.booking-cost.step.2':
    "Clicca «Crea spesa». La prenotazione viene salvata, il modulo si chiude e l'editor dei Costi si apre su «Aggiungi spesa».",
  'help.guide.booking-cost.step.3':
    "Il nome nell'intestazione è già il titolo della prenotazione, e «Giorno» è già il giorno della prenotazione. Inserisci l'«Importo totale» e controlla la «Valuta» accanto.",
  'help.guide.booking-cost.step.4':
    "L'etichetta nell'intestazione è la «Categoria», già impostata su quella corrispondente al tipo di prenotazione. In «Chi ha pagato?» scegli chi ha pagato e in «Suddivisione» come dividere l'importo.",
  'help.guide.booking-cost.step.5': 'Clicca «Aggiungi spesa».',
  'help.guide.booking-cost.result':
    "La scheda mostra l'importo in fondo, il modulo della prenotazione elenca la spesa in «Spese collegate» e la stessa spesa compare nella scheda Costi, collegata a questa prenotazione.",
  'help.guide.booking-cost.tip.1':
    'La categoria dipende dal tipo: «Ristorante» diventa «Cibo e bevande», «Alloggio» diventa «Alloggio», «Parcheggio» diventa «Parcheggio», ed «Evento» e Tour diventano entrambi «Altro».',
  'help.guide.booking-cost.tip.2':
    'Una prenotazione può avere più spese. «Collega spesa esistente» propone le spese in «Costi» non ancora collegate a nulla. Su una spesa collegata, «Scollega, mantieni la spesa» toglie il collegamento e lascia la spesa in «Costi», mentre il cestino la elimina.',
  'help.guide.booking-cost.tip.3':
    "«Costi» compare nel modulo solo se il modulo Costi è attivo; l'amministratore lo attiva in «Moduli».",
  // filter-bookings
  'help.guide.filter-bookings.title': 'Trovare una prenotazione',
  'help.guide.filter-bookings.goal': 'Filtra una scheda lunga per parola, stato, tipo o persona.',
  'help.guide.filter-bookings.step.1':
    'Scrivi in «Cerca» nella barra. La ricerca include titoli, tipi, luoghi e indirizzi, note, codici di prenotazione e nomi dei viaggiatori, e i risultati si riducono man mano che scrivi. Esc svuota il campo.',
  'help.guide.filter-bookings.step.2':
    "Clicca «Filtra», l'imbuto accanto alla ricerca. Il pannello contiene «Stato», «Tipo» e, quando una prenotazione ha persone assegnate, «Viaggiatori».",
  'help.guide.filter-bookings.step.3':
    'Sotto «Stato», scegli «Confermata» o «In attesa» per vedere solo quelle; «Tutti» le mostra entrambe.',
  'help.guide.filter-bookings.step.4':
    'Sotto «Tipo», clicca su uno o più tipi per mostrare solo quelli. Ogni tipo indica quante prenotazioni contiene, e una spunta indica quelli selezionati.',
  'help.guide.filter-bookings.step.5':
    'Un numero su «Filtra» indica quanti filtri sono attivi, e un chip accanto alla ricerca mostra quante prenotazioni restano sul totale. Clicca sul chip, oppure su «Reimposta filtri» in fondo al pannello, per vedere di nuovo tutto.',
  'help.guide.filter-bookings.result':
    'La scheda mostra solo ciò che hai scelto, sia in «Schede» sia in «Elenco» e «Cronologia», e i filtri restano attivi per questo viaggio finché non chiudi la scheda del browser.',
  'help.guide.filter-bookings.tip.1':
    "«Tipo» compare solo se nella scheda ci sono più tipi diversi, ed elenca solo quelli presenti. Quindi, se nella scheda non c'è nessun tour, in «Tipo» non trovi l'opzione «Tour».",
  'help.guide.filter-bookings.tip.2':
    'Se nessuna prenotazione corrisponde al filtro, la scheda mostra «Nessun risultato con questi filtri», con «Reimposta filtri» subito sotto.',
  // import-booking-file
  'help.guide.import-booking-file.title': 'Importare una prenotazione dalla conferma',
  'help.guide.import-booking-file.goal':
    "Fai leggere a TREK la prenotazione dall'email o dal PDF inviato dal fornitore, così non devi riscriverla.",
  'help.guide.import-booking-file.step.1':
    "Clicca sull'icona di download nella barra, «Importa conferme di prenotazione»; il nome compare quando ci passi sopra con il mouse. Si apre la finestra con lo stesso nome.",
  'help.guide.import-booking-file.step.2':
    'Trascina le conferme nel riquadro, oppure clicca sul riquadro e selezionale: EML, PDF, PKPass, HTML e TXT, fino a cinque file da 10 MB ciascuno, e foto (JPG, PNG, WEBP) se il modello di IA è in grado di leggere le immagini. Il riquadro mostra i nomi dei file scelti.',
  'help.guide.import-booking-file.step.3':
    'Clicca su «Importa». La finestra si chiude subito, perché la lettura avviene in background.',
  'help.guide.import-booking-file.step.4':
    "Un riquadro in basso a destra mostra l'avanzamento sotto il nome del file. Resta visibile mentre navighi nell'app e anche dopo un ricaricamento. Quando la lettura è finita, «Analisi dei file in corso…» diventa una spunta e il riquadro propone «Importa». Cliccalo.",
  'help.guide.import-booking-file.step.5':
    "Ogni prenotazione trovata si apre in «Nuova prenotazione», una dopo l'altra, già compilata. Per un hotel trovi il nome come titolo e, se il luogo è nel viaggio, in «Alloggio» la sua «Posizione / Indirizzo», «Da» e «A» sulle notti, «Check-in» e «Check-out», il «Codice prenotazione», la conferma in «File» e, con Costi attivo, il prezzo come «Spesa collegata». Controlla i dati e clicca «Aggiungi».",
  'help.guide.import-booking-file.result':
    'La prenotazione compare come scheda in «In attesa», con le notti, il codice e la conferma in «File». Il soggiorno compare in quei giorni del programma. Se i Costi sono attivi, il prezzo viene aggiunto come spesa collegata alla prenotazione.',
  'help.guide.import-booking-file.tip.1':
    "L'icona di importazione compare solo se il server può leggere le conferme. Per questo serve l'estrattore oppure il modulo «Analisi con IA», che l'amministratore attiva in «Moduli». Una scheda senza prenotazioni lo mostra anche come pulsante «Importa da file».",
  'help.guide.import-booking-file.tip.2':
    "Se non è stato possibile leggere nulla, la scheda te lo segnala. Con «Analisi con IA» attiva, propone «Prova la lettura con l’IA», che invia gli stessi file direttamente al modello. Un'analisi completata resta disponibile per dieci minuti: avvia la revisione entro quel tempo.",
  'help.guide.import-booking-file.tip.3':
    "La conferma viene allegata solo se il suo tipo è tra i «Tipi di File Consentiti» nelle impostazioni di amministrazione. Il PDF è consentito per impostazione predefinita; un'email (EML) va aggiunta prima, altrimenti la prenotazione viene salvata senza allegato.",
  // edit-booking
  'help.guide.edit-booking.title': 'Modificare una prenotazione',
  'help.guide.edit-booking.goal':
    'Correggi un orario, aggiungi un codice arrivato dopo o passa una prenotazione da «In attesa» a «Confermata».',
  'help.guide.edit-booking.step.1':
    "Passa il mouse sulla scheda e clicca la matita nell'intestazione. Si apre «Modifica prenotazione» con tutti i dettagli della prenotazione.",
  'help.guide.edit-booking.step.2':
    "Modifica quello che serve, ad esempio il «Codice prenotazione» che l'operatore ti ha inviato in seguito.",
  'help.guide.edit-booking.step.3':
    "Clicca l'etichetta «In attesa» nella fascia in alto. Diventa «Confermata» e la fascia diventa verde.",
  'help.guide.edit-booking.step.4': 'Clicca su «Aggiorna».',
  'help.guide.edit-booking.result':
    'La scheda si sposta: una prenotazione confermata compare nella sezione «Confermata» con un pallino verde e la fascia superiore verde, e tutti i partecipanti al viaggio la vedono spostarsi.',
  'help.guide.edit-booking.tip.1':
    'Se non riesci a leggere un «Codice prenotazione», in «Impostazioni», sotto «Visualizzazione», è attivo «Nascondi codici di prenotazione». Passa con il mouse sul codice, o cliccalo, per leggerlo.',
  'help.guide.edit-booking.tip.2':
    "Se cambi il tipo, cambia anche la categoria della spesa collegata, a meno che tu non l'abbia scelta a mano nell'editor dei Costi.",
  'help.guide.edit-booking.tip.3':
    "Anche «Modifica» in fondo alla vista dettagliata di una prenotazione apre lo stesso modulo. Puoi cambiare lo stato anche senza modulo: clicca il pallino su una scheda o una riga, oppure l'etichetta dello stato nella vista dettagliata.",
  // delete-booking
  'help.guide.delete-booking.title': 'Eliminare una prenotazione',
  'help.guide.delete-booking.goal': 'Rimuovi dal viaggio una prenotazione cancellata.',
  'help.guide.delete-booking.step.1':
    "Punta la scheda e clicca sul cestino nell'intestazione. Il cestino in fondo al dettaglio di una prenotazione fa la stessa cosa.",
  'help.guide.delete-booking.step.2':
    '«Eliminare la prenotazione?» indica la prenotazione scelta e avvisa che verrà eliminata definitivamente. Se ci sono costi collegati, avvisa che verranno eliminati anche quelli.',
  'help.guide.delete-booking.step.3': 'Clicca su «Elimina».',
  'help.guide.delete-booking.result':
    "La scheda viene eliminata per tutti i partecipanti al viaggio. L'eliminazione di una prenotazione è irreversibile, quindi la richiesta di conferma è l'ultima occasione per annullare.",
  'help.guide.delete-booking.tip.1':
    'Eliminando una prenotazione elimini anche le spese collegate. Eliminando un alloggio ne rimuovi anche le notti dal programma dei giorni.',
  'help.guide.delete-booking.tip.2':
    'I documenti allegati restano nella scheda «File» del viaggio; viene rimosso solo il loro collegamento alla prenotazione.',

  // ── Screen: trip-costs ────────────────────────────────────────────────────────────────
  'help.ctx.trip-costs.title': 'Costi',
  'help.ctx.trip-costs.summary':
    "Le spese del viaggio: ogni uscita in un registro con le date o in una tabella, chi l'ha registrata e chi deve pagarla, nella valuta della ricevuta. La colonna di destra mostra chi deve pagare chi per pareggiare i conti.",
  'help.ctx.trip-costs.bullet.1':
    "La barra in alto mostra le date del viaggio e i viaggiatori tra cui vengono divisi i costi. Contiene anche «Cerca spese…», «Filtra» (l'imbuto), «Esporta CSV» (l'icona di download) e il selettore «Elenco» / «Tabella».",
  'help.ctx.trip-costs.bullet.2':
    "All'estremità destra, «Salda» registra in una volta tutti i trasferimenti aperti, «Scansiona ricevuta» compila una spesa da una foto se il modulo «Analisi con IA» è in grado di leggere le immagini, e «Aggiungi spesa» apre l'editor.",
  'help.ctx.trip-costs.bullet.3':
    'Quattro riquadri sotto la barra: «Devi» e «Ti devono» sono la tua parte del saldo, «Importo in sospeso» è quanto è registrato ma non ha ancora un pagante e «Spesa totale del viaggio» somma tutto, con «La tua quota» e «Hai pagato» sotto.',
  'help.ctx.trip-costs.bullet.4':
    "Il registro è raggruppato per giorno, dal più recente, e ogni giorno indica quante voci contiene e quanto è stato speso. Una riga mostra la categoria come linguetta colorata, il nome, i chip di chi ha pagato con le relative cifre e, sotto, «Suddivisione» con la quota di ogni viaggiatore (una spunta indica chi ha già saldato la sua), poi la nota e l'importo, più «hai prestato» o «hai preso in prestito» quando la suddivisione fa sì che gli altri ti debbano dei soldi o che tu li debba a loro.",
  'help.ctx.trip-costs.bullet.5':
    'La colonna di destra mostra i risultati: «Salda» elenca chi paga chi, «Saldi» mostra il credito o il debito di ogni viaggiatore, «Budget finale» quanto costa il viaggio a ciascuno e «Per categoria» come sono stati spesi i soldi.',
  'help.ctx.trip-costs.bullet.6':
    'Un pagamento registrato compare nello stesso registro come riga a sé, con una matita e «Annulla» accanto. Una spesa ha una matita e un cestino, e il cestino chiede conferma prima di eliminarla. Una spesa con ricevute ha accanto al nome un chip «Ricevuta» che le apre.',
  'help.ctx.trip-costs.bullet.7':
    "«Tabella» nella barra mostra le stesse spese come foglio di calcolo, raggruppate per categoria, con «Persone» e «Giorni» e l'importo per persona e per giorno. In questo caso «Riepilogo» sostituisce «Per categoria». I Costi ricordano la vista che hai scelto.",
  // add-expense
  'help.guide.add-expense.title': 'Aggiungere una spesa',
  'help.guide.add-expense.goal': "Registra quanto è costato qualcosa, chi l'ha pagato e con chi va diviso.",
  'help.guide.add-expense.step.1':
    "Clicca su «Aggiungi spesa» all'estremità destra della barra. Si apre l'editor, con la data di oggi, pagata da te e con tutti già inclusi nella suddivisione.",
  'help.guide.add-expense.step.2':
    'Scrivi a cosa si riferisce la spesa nel campo in cima alla finestra. Finché è vuoto, mostra «es. Cena, souvenir, benzina…». È il nome della spesa, e senza nome non puoi salvarla.',
  'help.guide.add-expense.step.3':
    "L'etichetta sotto il nome è la «Categoria»: «Cibo e bevande» finché non ne scegli un'altra. Le categorie sono quattordici e non si possono modificare. L'intestazione prende il colore della categoria scelta, così come la linguetta sulla riga e la sua barra in «Per categoria».",
  'help.guide.add-expense.step.4':
    "Inserisci l'importo della ricevuta in «Importo totale». «Valuta», accanto, è impostata inizialmente sulla valuta in cui sono mostrati i Costi; se la cambi, l'editor mostra l'importo convertito. «Giorno» è impostato su oggi e la spesa viene raggruppata sotto quel giorno nell'elenco.",
  'help.guide.add-expense.step.5':
    "In «Chi ha pagato?» clicca la persona che ha pagato davvero. «Tu» è preselezionato. «Nessuno ha ancora pagato» registra l'importo senza che nessuno lo debba, e «Hanno pagato più persone», nel selettore accanto al titolo, divide il conto tra più paganti.",
  'help.guide.add-expense.step.6':
    '«Suddivisione», più in basso, parte da «In parti uguali», con tutti spuntati e la quota di ciascuno accanto al nome. Lasciala così o modificala. Clicca «Aggiungi spesa» in fondo alla finestra per salvare.',
  'help.guide.add-expense.result':
    'La spesa compare nel registro sotto il suo giorno, viene conteggiata in «Spesa totale del viaggio», e la colonna dei conguagli ha ricalcolato chi deve quanto a chi.',
  'help.guide.add-expense.tip.1':
    'Se non modifichi i valori predefiniti, la spesa ha la data di oggi, risulta pagata da te e viene divisa in parti uguali tra tutti: basta inserire nome e importo.',
  'help.guide.add-expense.tip.2':
    "Il ± accanto all'importo trasforma la spesa in un rimborso. Un totale negativo indica che il denaro viene restituito, e la suddivisione si inverte.",
  'help.guide.add-expense.tip.3':
    "«Allega», accanto a «Ricevute e fatture» in fondo alla finestra, accetta immagini e PDF. Vengono caricati al salvataggio e archiviati nei «File» del viaggio, e accanto al nome nell'elenco compare un chip «Ricevuta».",
  // expense-payers
  'help.guide.expense-payers.title': 'Indicare chi ha pagato',
  'help.guide.expense-payers.goal': "Registra chi ha pagato una spesa: è l'altra metà del calcolo del saldo.",
  'help.guide.expense-payers.step.1':
    'Apri una spesa con la matita accanto alla riga e guarda «Chi ha pagato?». Nel selettore accanto al titolo è impostato «Ha pagato una sola persona»: ogni viaggiatore è un chip e quello evidenziato dal contorno è chi ha pagato. Clicca un altro chip per cambiarlo.',
  'help.guide.expense-payers.step.2':
    "«Nessuno ha ancora pagato», il chip tratteggiato dopo i viaggiatori, registra l'importo senza che nessuno debba qualcosa. La spesa viene comunque conteggiata in «Spesa totale del viaggio».",
  'help.guide.expense-payers.step.3':
    "«Hanno pagato più persone», l'altra opzione dello stesso selettore, elenca tutti i viaggiatori con una casella di spunta, e ogni persona spuntata riceve un campo per l'importo. Spunta chi ha pagato e inserisci quanto ha pagato ciascuno; la somma degli importi deve corrispondere al totale.",
  'help.guide.expense-payers.step.4':
    'Una spesa che nessuno ha pagato è contrassegnata come «Incompleto» nella sua riga e viene conteggiata nella scheda «Importo in sospeso», che somma le spese non ancora pagate da nessuno.',
  'help.guide.expense-payers.result':
    'Chi ha pagato determina chi viene rimborsato, la suddivisione determina chi paga, e «Saldi» è la differenza tra i due.',
  'help.guide.expense-payers.tip.1':
    '«Chi ha pagato?» e «Suddivisione» sono indipendenti: puoi pagare una cena a cui non hai partecipato ed essere incluso nella suddivisione di una che non hai pagato.',
  'help.guide.expense-payers.tip.2':
    "Con più paganti, gli importi devono corrispondere al totale. Quando spunti un altro pagante, il resto viene ridistribuito tra gli importi che non hai inserito tu. Finché gli importi non corrispondono, l'editor mostra il totale da raggiungere e non salva.",
  'help.guide.expense-payers.tip.3':
    "Se riporti una spesa a «Nessuno ha ancora pagato», non viene eliminata: l'importo resta in «Spesa totale del viaggio» e la riga diventa «Incompleto».",
  // split-expense
  'help.guide.split-expense.title': 'Dividere un conto tra i viaggiatori',
  'help.guide.split-expense.goal':
    'Decidi chi deve pagare una spesa: tutti in parti uguali, per importo, o voce per voce dalla ricevuta.',
  'help.guide.split-expense.step.1':
    "Nell'editor della spesa, «Suddivisione» elenca tutti i viaggiatori con una casella di spunta. Togli la spunta a un nome per escluderlo da questa spesa: il nome diventa grigio, perde la sua quota e non deve nulla.",
  'help.guide.split-expense.step.2':
    "«In parti uguali», nel selettore accanto al titolo, è l'impostazione predefinita: ogni viaggiatore spuntato riceve la stessa quota, indicata accanto al nome. I badge sotto l'elenco mostrano in quante persone si divide e a quanto ammonta ogni quota.",
  'help.guide.split-expense.step.3':
    '«Personalizzato» sostituisce le quote con campi per gli importi. Inserisci quanto deve ogni viaggiatore. Il badge sotto si aggiorna mentre scrivi e diventa verde con «La divisione corrisponde al totale». Finché gli importi non corrispondono al totale, non puoi salvare.',
  'help.guide.split-expense.step.4':
    '«Scontrino» divide la ricevuta riga per riga: «Aggiungi articolo», poi un nome e un prezzo per ogni riga e, accanto a «Diviso tra:», i viaggiatori che si dividono quella riga.',
  'help.guide.split-expense.step.5':
    '«Quota di ciascuno», sotto le righe, mostra quanto deve alla fine ogni viaggiatore, e «Importo totale» in alto è la somma delle righe. Clicca «Salva» in fondo alla finestra.',
  'help.guide.split-expense.result':
    "Tutti i saldi vengono calcolati dalla suddivisione. Viene salvata con la spesa, compare nella sua riga come «Suddivisione» con la quota di ogni viaggiatore e puoi modificarla in seguito senza cambiare nient'altro.",
  'help.guide.split-expense.tip.1':
    'Un viaggiatore a cui togli la spunta non deve nulla per questa spesa; gli altri pagano la loro quota.',
  'help.guide.split-expense.tip.2':
    '«In parti uguali» divide al centesimo esatto: il centesimo in più va ogni volta a una persona diversa, così non tocca sempre alla stessa.',
  'help.guide.split-expense.tip.3':
    "La modalità Ticket calcola da sola l'«Importo totale» e disattiva il campo: il totale è la somma delle righe della ricevuta.",
  'help.guide.split-expense.tip.4':
    'Una suddivisione personalizzata si può inserire anche in percentuale: imposta «Inserisci le quote come» su %, e prima di salvare la spesa la somma delle quote deve essere 100 %.',
  // expense-currency
  'help.guide.expense-currency.title': "Inserire una spesa in un'altra valuta",
  'help.guide.expense-currency.goal': "Inserisci l'importo della ricevuta e TREK salva il tasso di cambio.",
  'help.guide.expense-currency.step.1':
    "Apri «Aggiungi spesa». Scrivi il nome in alto nella finestra e inserisci in «Importo totale» l'importo esatto della ricevuta, non quello convertito.",
  'help.guide.expense-currency.step.2':
    "Apri «Valuta» accanto all'importo e scegli la valuta della ricevuta. L'elenco contiene tutti i codici che TREK conosce e puoi cercarli: scrivi le tre lettere.",
  'help.guide.expense-currency.step.3':
    "Sotto i campi compare una riga di badge: l'importo inserito e il suo valore attuale, indicato come «tasso in tempo reale». È solo un'anteprima, non il valore che viene salvato.",
  'help.guide.expense-currency.step.4':
    "Clicca su «Aggiungi spesa» in fondo alla finestra. Il tasso viene fissato in quel momento: la spesa mantiene il valore che aveva il giorno in cui l'hai inserita.",
  'help.guide.expense-currency.step.5':
    "Nel registro, la riga mostra entrambi gli importi sotto il nome: quello che hai inserito, una freccia e l'importo nella valuta del viaggio. Tutti i totali, i saldi e i conguagli della scheda «Costi» usano il secondo importo.",
  'help.guide.expense-currency.result':
    "La spesa mantiene l'importo e la valuta che hai inserito. Il registro li mostra entrambi, mentre totali e saldi del viaggio sono calcolati nella valuta del viaggio.",
  'help.guide.expense-currency.tip.1':
    'Il tasso viene fissato al momento del salvataggio, così un debito saldato non cambia se il cambio varia la settimana dopo. Viene salvato un nuovo tasso solo se cambi la valuta della spesa.',
  'help.guide.expense-currency.tip.2':
    '«Valuta di visualizzazione» nelle Impostazioni cambia solo il modo in cui vengono mostrati gli importi. Gli importi salvati non cambiano mai. Se il campo è vuoto, ogni viaggio viene mostrato nella sua valuta.',
  'help.guide.expense-currency.tip.3':
    'La valuta del viaggio si imposta nel viaggio stesso, in «Modifica Viaggio», e richiede il permesso «Modificare dettagli del viaggio». Se la cambi, tutti i tassi fissati vengono ricalcolati per la nuova valuta. Gli importi in sé non vengono convertiti.',
  // filter-costs
  'help.guide.filter-costs.title': 'Trovare una spesa o le spese di un giorno',
  'help.guide.filter-costs.goal': 'Filtra un lungo elenco di spese per vedere solo quello che cerchi.',
  'help.guide.filter-costs.step.1':
    'Scrivi in «Cerca spese…» nella barra. La ricerca filtra per nome della spesa mentre scrivi, ed Esc la svuota.',
  'help.guide.filter-costs.step.2':
    "«Filtra», l'imbuto accanto alla ricerca, apre i filtri. Il selettore in alto è la tua vista personale del registro: «Tutti», «Pagate da me» per le spese che hai pagato tu e «Mi devono» per quelle in cui hai pagato più della tua quota.",
  'help.guide.filter-costs.step.3':
    "In «Categoria» scegli una delle quattordici categorie per vedere solo le spese di quella categoria. L'imbuto indica quanti filtri sono attivi.",
  'help.guide.filter-costs.step.4':
    'In «Giorno» scegli uno dei giorni con spese. Un banner sostituisce le intestazioni dei giorni e mostra quel giorno per esteso, il numero di spese e il totale.',
  'help.guide.filter-costs.step.5':
    "«Esporta CSV», l'icona di download accanto all'imbuto, salva tutte le spese in un file, con l'importo originale, la sua valuta e l'importo convertito.",
  'help.guide.filter-costs.result':
    'Puoi combinare i filtri, e i gruppi dei giorni si aggiornano con i propri totali per le spese rimaste.',
  'help.guide.filter-costs.tip.1':
    'I pagamenti registrati non hanno né nome né categoria, quindi una ricerca o un filtro per categoria li nasconde, così come «Mi devono». Il filtro per giorno li mostra, sotto il giorno in cui è avvenuto il pagamento.',
  'help.guide.filter-costs.tip.2':
    '«Esporta CSV» esporta sempre tutte le spese, indipendentemente dai filtri a schermo, una riga per spesa.',
  'help.guide.filter-costs.tip.3':
    '«Reimposta filtri», in fondo al menu dei filtri quando un filtro è attivo, li disattiva tutti in una volta.',
  // settle-up
  'help.guide.settle-up.title': 'Vedere chi deve a chi e saldare i debiti',
  'help.guide.settle-up.goal':
    'Riduci tante spese condivise al minor numero di trasferimenti necessari per saldare tutti i debiti, e registra i trasferimenti quando li fate.',
  'help.guide.settle-up.step.1':
    "Il riquadro «Salda» nella colonna di destra elenca i trasferimenti che salderebbero tutti i debiti: chi paga chi, con due avatar e i nomi nel tooltip, e quanto. Il numero nell'intestazione indica quanti sono ancora aperti.",
  'help.guide.settle-up.step.2':
    '«Salda» accanto a un trasferimento lo registra come effettuato. Il trasferimento sparisce dal riquadro e i saldi si aggiornano.',
  'help.guide.settle-up.step.3':
    "Il trasferimento registrato è una riga nel registro, sotto il giorno in cui è avvenuto, contrassegnata come «Pagamento» con i due viaggiatori e l'importo.",
  'help.guide.settle-up.step.4':
    'Accanto a quella riga, la matita corregge un pagamento e «Annulla» lo cancella, e il trasferimento torna nella scheda «Salda».',
  'help.guide.settle-up.step.5':
    "«Aggiungi pagamento», nell'intestazione della scheda, registra un trasferimento che non segue un suggerimento. Scegli «Da» e «A», l'importo, la valuta e il giorno in cui è avvenuto, aggiungi se vuoi una «Nota», ad esempio come è stato pagato, poi clicca su «Aggiungi pagamento» in fondo alla finestra.",
  'help.guide.settle-up.step.6':
    '«Salda», nella barra in alto, registra in una volta tutti i trasferimenti aperti, senza chiedere conferma, ad esempio quando il gruppo salda tutti i debiti alla fine di un viaggio.',
  'help.guide.settle-up.result':
    'Ogni trasferimento registrato diventa una riga del registro e toglie una riga dal riquadro «Salda». Quando il riquadro mostra «Sono tutti in pari», il viaggio è interamente saldato.',
  'help.guide.settle-up.tip.1':
    'Il riquadro mostra il minor numero di trasferimenti, non tutti i debiti: se tre persone si devono soldi a vicenda in cerchio, bastano uno o due pagamenti.',
  'help.guide.settle-up.tip.2':
    '«Salda» registra solo il trasferimento, non invia denaro. Paga con il tuo solito metodo di pagamento, poi clicca «Salda».',
  'help.guide.settle-up.tip.3':
    'Un pagamento può avvenire in qualsiasi valuta, quindi saldare in euro un debito in yen è normale: la finestra ha un proprio selettore di valuta e fissa anche quel tasso.',
  // final-budget
  'help.guide.final-budget.title': 'Vedere quanto è costato il viaggio a ciascun viaggiatore',
  'help.guide.final-budget.goal': 'Consulta i dati per persona: il saldo di oggi e il costo reale per persona.',
  'help.guide.final-budget.step.1':
    "«Saldi» mostra la posizione di ogni viaggiatore: una barra verde verso destra se deve ricevere dei soldi, una barra rossa verso sinistra se deve darli, e l'importo accanto al nome.",
  'help.guide.final-budget.step.2':
    "«Budget finale», più in basso, risponde a un'altra domanda: non chi deve cosa in questo momento, ma quanto costa il viaggio a ciascun viaggiatore una volta saldati tutti i debiti.",
  'help.guide.final-budget.step.3':
    'Clicca un nome per vedere il calcolo: «Spese pagate» e sotto «Rimborsi netti» e «Rimborsi in sospeso».',
  'help.guide.final-budget.step.4':
    "Sotto le tre righe, per ogni viaggiatore c'è un elenco con le voci che compongono quella riga: le spese pagate da quel viaggiatore, i trasferimenti già registrati e quelli ancora aperti. Ogni elenco somma esattamente alla riga con lo stesso nome.",
  'help.guide.final-budget.result':
    '«Saldi» mostra chi oggi deve ricevere soldi e chi ne deve dare. «Budget finale» mostra quanto costa il viaggio a ciascuno di voi una volta saldati tutti i debiti.',
  'help.guide.final-budget.tip.1':
    'Registrare un pagamento non cambia il budget finale di nessuno. Sposta solo un importo dai rimborsi in sospeso ai rimborsi netti.',
  'help.guide.final-budget.tip.2':
    'Una spesa senza pagante resta fuori da entrambe le schede, così come resta fuori dai suggerimenti per saldare i conti.',
  // expense-from-booking
  'help.guide.expense-from-booking.title': 'Trasformare una prenotazione in una spesa',
  'help.guide.expense-from-booking.goal':
    'Associa il costo reale di un volo, un hotel o un luogo alla voce a cui appartiene.',
  'help.guide.expense-from-booking.step.1':
    'Trova la prenotazione nella scheda «Trasporti» o «Prenotazioni» e clicca sulla matita in cima alla sua scheda.',
  'help.guide.expense-from-booking.step.2':
    'Scorri fino a «Costi», verso la fine del modulo. Trovi «Crea spesa», che prima salva la prenotazione, e «Collega spesa esistente» per una spesa già presente nei Costi.',
  'help.guide.expense-from-booking.step.3':
    "Clicca su «Crea spesa». La prenotazione viene salvata, il modulo si chiude e si apre l'editor dei costi, con il titolo della prenotazione come nome, una categoria corrispondente al suo tipo e il giorno della prenotazione come giorno della spesa.",
  'help.guide.expense-from-booking.step.4':
    'Compila importo e valuta, chi ha pagato e la suddivisione come per qualsiasi spesa, poi clicca «Aggiungi spesa». Quando riapri la prenotazione, la spesa compare in «Spese collegate», con una matita per modificarla, «Scollega, mantieni la spesa» per rimuovere il collegamento mantenendo la spesa e un cestino per eliminarla.',
  'help.guide.expense-from-booking.result':
    'La prenotazione mostra il suo costo e la spesa è una normale riga nella scheda Costi, con un pagante, una suddivisione e una valuta come tutte le altre.',
  'help.guide.expense-from-booking.tip.1':
    "Eliminando la prenotazione vengono eliminate anche le spese collegate, e la richiesta di conferma te lo segnala. «Rimuovi spesa», nella sezione «Costi» della prenotazione, fa l'opposto: elimina la spesa e mantiene la prenotazione. «Scollega, mantieni la spesa» le mantiene entrambe.",
  'help.guide.expense-from-booking.tip.2':
    'Anche il modulo di un luogo ha la stessa sezione, e lì «Crea spesa» salva prima il luogo.',
  // costs-table
  'help.guide.costs-table.title': 'Pianificare i costi in una tabella',
  'help.guide.costs-table.goal':
    'Consulta e modifica le spese in una tabella, ordinate per categoria e calcolate per persona e per giorno.',
  'help.guide.costs-table.step.1':
    'Clicca «Tabella», la seconda icona del selettore «Elenco / Tabella» nella barra. Al posto del registro compare una tabella con le stesse spese, a cui si applicano anche ricerca e filtri.',
  'help.guide.costs-table.step.2':
    "La tabella è raggruppata per categoria. L'intestazione di ogni gruppo mostra il nome, il numero di spese e il subtotale; cliccala per comprimere il gruppo. Le colonne sono «Nome», «Data», «Totale», «Persone» e «Giorni», poi «Per persona», «Per giorno» e «P. p / gio.», calcolate dalle precedenti su sfondo grigio. Una riga «Totale» in fondo somma tutto.",
  'help.guide.costs-table.step.3':
    'Clicca una cella per modificarla direttamente: un nome, un totale, «Persone» o «Giorni». Scrivi, poi premi Invio o clicca altrove per salvare, oppure premi Esc per annullare; la data apre il calendario. «Per persona» e le altre colonne calcolate si aggiornano subito.',
  'help.guide.costs-table.step.4':
    "Un totale con il lucchetto non si può modificare qui: qualcuno l'ha già pagato oppure è stato inserito in un'altra valuta, e il tooltip indica quale dei due casi. Cliccandolo si apre invece la spesa, così i saldi e il tasso di cambio fissato restano corretti.",
  'help.guide.costs-table.step.5':
    "«Aggiungi spesa» alla fine di una categoria aggiunge una riga chiamata «Nuova voce», con la data dell'ultima voce di quella categoria. Il campo del nome è già aperto, così puoi modificarlo. Inserisci il totale allo stesso modo.",
  'help.guide.costs-table.step.6':
    'In questa vista, la colonna di destra mostra «Riepilogo» invece di «Per categoria». Somma le spese in quattro modi: «Categoria», «Giorno», «Pagante» (con «Ancora nessun pagante» per quelle non pagate) e «Stato», «Pagato» contro «Aperto».',
  'help.guide.costs-table.result':
    "Ogni spesa compare nella sua categoria con l'importo per persona e per giorno. Quando cambi un totale in una cella, le schede in alto e «Riepilogo» si aggiornano subito.",
  'help.guide.costs-table.tip.1':
    '«Costi» ricorda la vista in questo browser: si apre sulla tabella finché non clicchi di nuovo su «Elenco».',
  'help.guide.costs-table.tip.2':
    "Una spesa suddivisa con «Personalizzato» o «Scontrino» non ha un'unica quota a persona, quindi «Per persona» e «P. p / gio.» restano vuoti.",
  'help.guide.costs-table.tip.3':
    'Paganti, suddivisione, nota e ricevute si modificano nella spesa: «Altre opzioni» alla fine di una riga offre «Modifica» ed «Elimina» per rimuovere la riga.',

  // ── Screen: trip-transports ───────────────────────────────────────────────────────────
  'help.ctx.trip-transports.title': 'Trasporti',
  'help.ctx.trip-transports.summary':
    "Tutti i mezzi con cui ti sposti tra una tappa e l'altra: voli, treni, autobus, auto, taxi, biciclette, crociere, traghetti, funivie e i collegamenti di trasporto pubblico che TREK cerca per te. La scheda li elenca. Puoi anche crearli e consultarli nel programma, e compaiono sulla mappa.",
  'help.ctx.trip-transports.bullet.1':
    'La scheda mostra solo i tragitti. Alloggi, ristoranti, eventi e biglietti sono nella scheda «Prenotazioni», così la stessa voce non compare mai due volte.',
  'help.ctx.trip-transports.bullet.2':
    'La barra in alto contiene «Cerca», «Filtra» per stato, tipi e viaggiatori, le tre viste «Schede», «Elenco» e «Cronologia», «Opzioni di visualizzazione» ed «Esporta come foglio di calcolo (CSV)», che scarica ciò che è visibile. «Trasporti», a destra, aggiunge un tragitto a mano. Le icone che lo precedono, «Importa conferme di prenotazione» e «Importa da AirTrail», compaiono se il server è in grado di leggere le conferme o se è collegato un AirTrail. Se la scheda è vuota, le stesse azioni compaiono al centro come «Trasporti», «Importa da file» e AirTrail.',
  'help.ctx.trip-transports.bullet.3':
    '«Schede» è la vista con cui si apre la scheda: prima «Confermata», poi «In attesa». Puoi comprimere ogni sezione cliccando sul titolo. I collegamenti con il trasporto pubblico pianificati non hanno uno stato e compaiono tra i tragitti confermati in ordine di orario, a meno che «Opzioni di visualizzazione» non li metta in una sezione a parte, «Trasporto pubblico automatico». «Elenco» raggruppa per giorno, e «Cronologia» mostra ogni tragitto sui giorni del viaggio.',
  'help.ctx.trip-transports.bullet.4':
    'La fascia superiore di una scheda è colorata in base allo stato: verde per confermato, ambra per in attesa, blu per un collegamento pianificato. Mostra il pallino dello stato, il tipo, il titolo, la matita e il cestino. Sotto: data, ora, «Codice prenotazione», percorso e la compagnia aerea con il numero di volo, oppure il numero del treno, il binario e il posto. Clicca sulla scheda per aprirne i dettagli.',
  'help.ctx.trip-transports.bullet.5':
    "Puoi creare trasporti anche nel programma: il + nell'intestazione di un giorno (con il suggerimento «Aggiungi al giorno»), oppure il clic destro sull'intestazione, offre «Aggiungi trasporto» e «Trasporto pubblico». Il collegamento con la durata del tragitto tra due tappe apre la stessa ricerca per quel solo tratto.",
  'help.ctx.trip-transports.bullet.6':
    "Un trasporto con entrambe le estremità impostate disegna una linea sulla mappa. L'icona del percorso nella sua riga del piano del giorno e «Sulla mappa» nei suoi dettagli attivano quella linea. «Mostra tutti i percorsi prenotati», nella barra degli strumenti sopra i giorni, attiva o disattiva le linee dell'intero viaggio.",
  // transports-list
  'help.guide.transports-list.title': 'Leggere la scheda Trasporti',
  'help.guide.transports-list.goal': "Scopri cosa mostra l'elenco prima di modificarlo.",
  'help.guide.transports-list.step.1':
    '«Trasporti» è una scheda del viaggio, dopo «Pianificato» (ed «Escursioni», se quel modulo è attivo). Contiene solo i tragitti: hotel, ristoranti, eventi e biglietti sono nella scheda «Prenotazioni».',
  'help.guide.transports-list.step.2':
    "«Cerca», a sinistra della barra, filtra i tragitti mentre scrivi. «Filtra», l'imbuto accanto, apre le opzioni: «Stato» con «Tutti», «Confermata» e «In attesa», poi ogni tipo in uso con il relativo conteggio. Spunta uno o più tipi per mostrare solo quelli. Il numero sull'imbuto indica quanti filtri sono attivi, e la barra quanti tragitti sono visibili, ad esempio 1 di 4. «Reimposta filtri», in fondo al menu, mostra di nuovo tutti i tragitti.",
  'help.guide.transports-list.step.3':
    "«Schede», «Elenco» e «Cronologia», accanto, mostrano i trasporti come schede, come righe raggruppate per giorno o come barre sui giorni del viaggio. «Opzioni di visualizzazione», l'icona con i cursori, imposta «Raggruppa per» e «Ordina per» per «Schede» ed «Elenco» e le corsie per «Cronologia». «Reimposta vista» ripristina i valori predefiniti. In «Schede», «Trasporto pubblico in una sezione a parte» mostra i collegamenti pianificati in «Trasporto pubblico automatico».",
  'help.guide.transports-list.step.4':
    "Ogni scheda mostra tutti i dettagli. La fascia in alto è verde per «Confermata» e ambra per «In attesa», e mostra il pallino dello stato, il tipo e il titolo. Sotto, «Data» indica i giorni coperti con le relative date. Seguono «Ora», «Codice prenotazione», «Percorso» con l'icona del tipo tra le fermate e la compagnia aerea con il numero di volo, oppure il numero del treno, il binario e il posto. Clicca la scheda per aprirne i dettagli.",
  'help.guide.transports-list.step.5':
    "Clicca sul pallino dello stato per passare il tragitto da «In attesa» a «Confermata» o viceversa; il suggerimento indica in quale direzione, ad esempio «Imposta su In attesa». La matita nell'intestazione apre il modulo del trasporto, e il cestino lo elimina dopo la domanda «Eliminare la prenotazione?», che elenca cosa verrà eliminato, compresi i costi collegati.",
  'help.guide.transports-list.result':
    "Ogni scheda indica se il tragitto è prenotato, e con la barra puoi filtrare o ordinare l'elenco in qualsiasi momento.",
  'help.guide.transports-list.tip.1':
    'La scheda ricorda le tue impostazioni: vista, raggruppamento e ordinamento in questo browser, le sezioni compresse per ogni viaggio, e i filtri finché non chiudi la scheda del browser.',
  'help.guide.transports-list.tip.2':
    "«Importa conferme di prenotazione» e «Importa da AirTrail», le due icone prima di «Trasporti», compaiono solo se il server è in grado di leggere le conferme e se è collegata un'istanza AirTrail. Altrimenti l'elenco si compila a mano o con la ricerca dei mezzi pubblici.",
  // add-transport
  'help.guide.add-transport.title': 'Aggiungere un trasporto a un giorno',
  'help.guide.add-transport.goal':
    'Aggiungi il mezzo che ti porta da una tappa alla successiva nel giorno in cui viaggi.',
  'help.guide.add-transport.step.1':
    "Nell'intestazione del giorno del tragitto, clicca sul + con il suggerimento «Aggiungi al giorno» e scegli «Aggiungi trasporto». Lo stesso menu si apre con il clic destro sull'intestazione del giorno. Il modulo si apre con quel giorno già inserito.",
  'help.guide.add-transport.step.2':
    "La pillola del tipo nell'intestazione mostra il mezzo di trasporto, «Volo» per impostazione predefinita. Cliccala per scegliere «Volo», «Treno», «Autobus», «Auto», Taxi, «Bicicletta», «Crociera», «Traghetto», «Funivia» o «Altro», e il modulo si adatta: per un volo c'è un aeroporto a ogni scalo, per un treno una sequenza di stazioni, per una crociera «Imbarco», «Porto di scalo» e «Sbarco», per un'auto «Ritiro», «Riconsegna» e «Soste lungo il tragitto».",
  'help.guide.add-transport.step.3':
    "Scrivi il titolo direttamente nella fascia in alto, dove c'è il testo di esempio in grigio. È l'unico campo obbligatorio: finché non lo compili, la riga sotto mostra «Titolo *» e «Aggiungi» resta disattivato. Usa un titolo che riconosceresti sul tabellone delle partenze.",
  'help.guide.add-transport.step.4':
    'In «Percorso», «Da» e «A» accettano una stazione, un porto o un indirizzo. Prima che tu scriva vengono proposti i luoghi del viaggio. Scrivi almeno tre lettere per cercare e scegli un risultato. Un nome che scrivi senza sceglierlo dai risultati non viene salvato e non compare sulla mappa.',
  'help.guide.add-transport.step.5':
    "«Data» e «Ora di inizio» indicano quando inizia, «Data fine» e «Ora di fine» quando finisce; per un tragitto che arriva il giorno dopo, imposta lì il giorno successivo. «Codice prenotazione» e «Note», più in basso, sono facoltativi. Clicca sulla pillola «In attesa» nell'intestazione per passare a «Confermata».",
  'help.guide.add-transport.step.6': 'Clicca su «Aggiungi».',
  'help.guide.add-transport.result':
    'Il trasporto è una riga nel giorno, al suo orario tra le tappe, e una scheda nella scheda «Trasporti» sotto «In attesa» o «Confermata».',
  'help.guide.add-transport.tip.1':
    "La riga viene inserita in base all'orario di inizio, dopo l'ultima tappa che inizia prima. Trascinala dalla maniglia in un'altra posizione del giorno o su un altro giorno.",
  'help.guide.add-transport.tip.2':
    "Usa «Allega file» in «File» per aggiungere il biglietto. «Crea spesa» in «Costi» salva la prenotazione e apre l'editor dei Costi per inserire la tariffa.",
  'help.guide.add-transport.tip.3':
    '«Viaggiatori», il primo blocco del modulo, indica chi usa questo trasporto. Quando il viaggio ha più di un membro e un trasporto indica qualcuno, anche «Filtra» nella scheda propone «Viaggiatori», per vedere solo i trasporti di una persona.',
  // import-transport-file
  'help.guide.import-transport-file.title': 'Importare un volo dal biglietto elettronico',
  'help.guide.import-transport-file.goal':
    'Fai leggere a TREK un volo, un treno o un traghetto dal biglietto inviato dal vettore, e controllalo prima di salvarlo.',
  'help.guide.import-transport-file.step.1':
    "Nella barra della scheda «Trasporti», clicca sull'icona di download prima di «Trasporti», con il suggerimento «Importa conferme di prenotazione». Si apre la finestra con lo stesso nome, la stessa della scheda «Prenotazioni». Se la scheda è vuota, «Importa da file» al centro fa la stessa cosa.",
  'help.guide.import-transport-file.step.2':
    'Trascina il biglietto nel riquadro, oppure clicca sul riquadro e scegli il file: EML, PDF, PKPass, HTML e TXT, fino a cinque file da 10 MB ciascuno, e anche foto di un biglietto (JPG, PNG, WEBP) se il tuo server ha un modello di IA in grado di leggerle. Il riquadro mostra i nomi dei file scelti.',
  'help.guide.import-transport-file.step.3':
    'Clicca su «Importa». La finestra si chiude subito, e il file viene letto in background.',
  'help.guide.import-transport-file.step.4':
    "Una scheda in basso a destra mostra l'avanzamento sotto il nome del file. «Analisi dei file in corso…» diventa una spunta quando la lettura è terminata, e la scheda offre «Importa». Cliccalo.",
  'help.guide.import-transport-file.step.5':
    "Un volo si apre in «Aggiungi trasporto», già compilato: il tipo impostato su «Volo», compagnia aerea e numero di volo come titolo nell'intestazione, i due aeroporti in «Percorso» con «Partenza» e «Arrivo», con orari e fusi orari, «Compagnia aerea» e «N. volo», il «Codice prenotazione» e il biglietto in «File». Controlla i dati e clicca «Aggiungi».",
  'help.guide.import-transport-file.result':
    'Il volo compare come scheda in «In attesa» nella scheda Trasporti e come riga nel giorno della partenza, con il biglietto in «File». Se entrambi gli aeroporti sono noti, il volo viene mostrato come una curva sulla mappa.',
  'help.guide.import-transport-file.tip.1':
    "Le due schede usano la stessa importazione. Un file che contiene un volo e un hotel apre il volo in «Aggiungi trasporto» e poi l'hotel in «Nuova prenotazione», da qualunque scheda tu sia partito.",
  'help.guide.import-transport-file.tip.2':
    'Gli aeroporti vengono localizzati tramite il loro codice. Se non è stato possibile localizzare una stazione o un porto, il nome compare in ambra nel riquadro di importazione in basso a destra. Selezionalo a mano in «Percorso» prima di cliccare «Aggiungi», altrimenti il trasporto non compare sulla mappa.',
  // plan-transit
  'help.guide.plan-transit.title': 'Pianificare un collegamento con il trasporto pubblico',
  'help.guide.plan-transit.goal':
    'Fai cercare a TREK i treni e gli autobus reali tra due punti di una giornata, e inserisci nel programma quello che scegli.',
  'help.guide.plan-transit.step.1':
    "Clicca sul + nell'intestazione del giorno e scegli «Trasporto pubblico». La ricerca si apre per quel giorno: il giorno compare come pillola nell'intestazione, e «A mano» e «Automatico» lì accanto passano da questa ricerca al modulo normale.",
  'help.guide.plan-transit.step.2':
    "In «Da» e «A» puoi inserire una fermata o una stazione. Finché la casella è vuota, TREK propone l'alloggio del giorno, le stazioni e gli aeroporti delle prenotazioni del giorno e le tappe del giorno stesso. Quando scrivi due lettere, cerca invece tra le stazioni dell'orario. «Inverti», tra le due caselle, scambia «Da» e «A».",
  'help.guide.plan-transit.step.3':
    '«Partenza» o «Arrivo» con un orario indicano quando vuoi viaggiare; «Percorso migliore», «Meno cambi» o «Meno spostamenti a piedi» stabiliscono come ordinare i risultati.',
  'help.guide.plan-transit.step.4':
    'I chip sotto indicano i mezzi che si possono usare: Treno, Metropolitana, Tram, Autobus, Traghetto e Funivia. Disattivane uno per escluderlo; almeno uno resta attivo. Poi clicca «Cerca».',
  'help.guide.plan-transit.step.5':
    "Ogni risultato mostra partenza e arrivo, durata, numero di cambi e tratti a piedi, e le linee come badge, nei loro colori se l'orario li fornisce. Clicca un risultato per espanderlo e vedere ogni tratta, con le fermate dove sali e cambi, i binari e i percorsi a piedi tra una linea e l'altra.",
  'help.guide.plan-transit.step.6': 'Clicca «Aggiungi al giorno».',
  'help.guide.plan-transit.result':
    'Il collegamento è una riga nel giorno con i badge delle linee. Clicca sulla sua freccia per vedere ogni tratta. È anche una scheda blu nella scheda «Trasporti», tra i tragitti confermati.',
  'help.guide.plan-transit.tip.1':
    'I collegamenti provengono da Transitous, un servizio comunitario gratuito che usa i dati pubblici degli orari: senza chiave e senza account. Un amministratore può impostare la ricerca su Google.',
  'help.guide.plan-transit.tip.2':
    'Nessun risultato? I dati coprono una certa regione e un certo periodo. Prova un altro orario, attiva più mezzi o scegli una stazione invece del luogo stesso. Il messaggio indica il servizio che ha risposto. Un viaggio senza date non ha un giorno su cui cercare, quindi offre solo il modulo normale.',
  'help.guide.plan-transit.tip.3':
    "La stessa ricerca si apre per un singolo tratto: clicca sul collegamento con la durata del tragitto tra due tappe e scegli «Trasporto pubblico». «Da», «A» e l'orario di partenza sono già compilati.",
  // change-transit-route
  'help.guide.change-transit-route.title': 'Aprire e modificare un collegamento pianificato',
  'help.guide.change-transit-route.goal':
    'Leggi il collegamento riga per riga, rinominalo o cerca di nuovo il percorso.',
  'help.guide.change-transit-route.step.1':
    'Nella scheda Trasporti, un collegamento pianificato è una scheda con la fascia superiore blu, elencata in ordine cronologico insieme ai trasporti confermati. Se in «Opzioni di visualizzazione» è attivo «Trasporto pubblico in una sezione a parte», compare invece in «Trasporto pubblico automatico». Clicca la scheda: il collegamento si apre come prenotazione.',
  'help.guide.change-transit-route.step.2':
    "I riquadri in alto mostrano partenza e arrivo con le fermate, «Durata», «Cambi» e «A piedi». Sotto, «Itinerario» mostra il collegamento riga per riga, con orari, binari e tratti a piedi tra una linea e l'altra.",
  'help.guide.change-transit-route.step.3':
    '«Cambia percorso», in fondo alla prenotazione, riapre la ricerca già compilata con le due estremità di questo collegamento e il suo giorno.',
  'help.guide.change-transit-route.step.4':
    "Clicca su «Cerca», apri un altro collegamento e clicca su «Aggiungi al giorno»: sostituisce quello precedente. «Modifica», all'estrema destra in fondo alla prenotazione, apre invece il normale modulo del trasporto, dove puoi modificare «Codice prenotazione», viaggiatori, note e file.",
  'help.guide.change-transit-route.result':
    'Il tragitto ora usa il nuovo itinerario, e la sua scheda in «Trasporti» mostra le nuove linee e i nuovi orari.',
  'help.guide.change-transit-route.tip.1':
    "Clicca il titolo nell'intestazione della prenotazione per rinominare il collegamento senza cambiare il percorso. Le note si scrivono nel modulo del trasporto che si apre con «Modifica».",
  'help.guide.change-transit-route.tip.2':
    'Il cestino in fondo alla prenotazione elimina il collegamento dopo una conferma; il giorno mantiene le sue tappe.',
  // leg-travel-mode
  'help.guide.leg-travel-mode.title': 'Cambiare il mezzo di una tratta',
  'help.guide.leg-travel-mode.goal':
    'Imposta a piedi una tratta di una giornata in auto oppure pianificala con la ricerca dei mezzi pubblici.',
  'help.guide.leg-travel-mode.step.1':
    "I collegamenti tra le tappe compaiono solo quando il percorso del giorno è attivo. Clicca sull'intestazione del giorno per aprirlo, poi su «Percorso» nella barra sotto le tappe.",
  'help.guide.leg-travel-mode.step.2':
    "Ogni collegamento mostra durata e distanza di quel tratto, con l'icona del mezzo usato per calcolarlo: un'auto per la guida, un piede per il cammino, una bici per la bicicletta.",
  'help.guide.leg-travel-mode.step.3':
    'Clicca sul collegamento. Il menu offre «Auto», «A piedi» e «Bicicletta», «Trasporto pubblico» solo per questo tratto, e «Usa predefinito del giorno».',
  'help.guide.leg-travel-mode.step.4':
    'Scegli «A piedi». Cambia solo questo tratto; il resto della giornata mantiene il suo mezzo.',
  'help.guide.leg-travel-mode.result':
    "Il tratto mostra l'icona del piede e la durata a piedi, mentre gli altri tratti della giornata mantengono il mezzo del giorno.",
  'help.guide.leg-travel-mode.tip.1':
    'Il mezzo appartiene al tratto, non al giorno: i pulsanti «Auto», «A piedi» e «Bicicletta» della giornata non sovrascrivono mai un tratto impostato a mano. «Usa predefinito del giorno» fa tornare il tratto a seguire quei pulsanti.',
  'help.guide.leg-travel-mode.tip.2':
    '«Trasporto pubblico», nello stesso menu, apre la ricerca dei collegamenti proprio per questa tratta, con partenza, arrivo e orario di partenza già compilati.',
  'help.guide.leg-travel-mode.tip.3':
    'I tempi vengono calcolati da un router pubblico su strade e sentieri reali. Se il router non riesce a calcolare una tratta, la tratta resta una linea retta senza tempo indicato.',
  // edit-transport
  'help.guide.edit-transport.title': 'Modificare o eliminare un trasporto',
  'help.guide.edit-transport.goal':
    'Correggi un orario, un binario o un codice di prenotazione, oppure rimuovi il trasporto dal viaggio.',
  'help.guide.edit-transport.step.1':
    'Nel piano del giorno, un trasporto è una riga tra le tappe, colorata in base al tipo. Cliccala per aprire la prenotazione: in alto, come pillole, stato, tipo, giorni e «Codice prenotazione» (con un pulsante per copiarlo); sotto, gli orari di partenza e arrivo con i relativi aeroporti o stazioni.',
  'help.guide.edit-transport.step.2':
    "«Modifica», in fondo alla prenotazione, apre il modulo con cui è stata creata, con «Modifica trasporto» sopra il titolo nell'intestazione. Lì puoi cambiare tutto: titolo, pillole di stato e tipo, percorso, giorni e orari, «Codice prenotazione».",
  'help.guide.edit-transport.step.3':
    'Il percorso di un volo è una sequenza di aeroporti, quello di un treno di stazioni, quello di una crociera di porti. «Aggiungi scalo» («Aggiungi porto» per una crociera) ne inserisce un altro in mezzo, e ogni tratta mantiene i propri orari e il proprio numero di volo o di treno.',
  'help.guide.edit-transport.step.4':
    'Clicca su «Aggiorna». Per eliminare del tutto il trasporto, usa il cestino a sinistra della stessa barra, quello in fondo alla prenotazione o quello sulla sua scheda nella scheda «Trasporti», e conferma.',
  'help.guide.edit-transport.result':
    'La modifica compare ovunque ci sia il trasporto: nella scheda «Trasporti», nel giorno in cui si svolge e nella sua linea sulla mappa.',
  'help.guide.edit-transport.tip.1':
    'Lo stesso modulo si apre da due punti: da «Modifica» nella prenotazione che si apre da una riga del programma del giorno, e dalla matita sulla scheda nella scheda Trasporti. Anche un collegamento pianificato con i mezzi pubblici si apre come prenotazione: lì «Cambia percorso» riapre la ricerca e «Modifica» apre questo modulo.',
  'help.guide.edit-transport.tip.2':
    "Per spostare un trasporto in un altro giorno non serve il modulo: trascina la sua riga dalla scheda di un giorno a quella dell'altro.",
  // transport-on-map
  'help.guide.transport-on-map.title': 'Mostrare un trasporto sulla mappa',
  'help.guide.transport-on-map.goal':
    'Visualizza il percorso effettivo di un volo, di un tragitto in auto o di un collegamento.',
  'help.guide.transport-on-map.step.1':
    'Un trasporto con entrambe le estremità impostate mostra una piccola icona del percorso nella sua riga del piano del giorno. Cliccala: il suggerimento diventa «Nascondi percorsi prenotati».',
  'help.guide.transport-on-map.step.2':
    "Il percorso compare sulla mappa, con un indicatore a pillola a ciascuna estremità che mostra l'icona del mezzo.",
  'help.guide.transport-on-map.step.3':
    "Clicca su un indicatore di estremità: la prenotazione si apre sopra la mappa. L'intestazione mostra stato, tipo, giorni e «Codice prenotazione». Sotto ci sono gli orari con i relativi aeroporti o stazioni, la compagnia aerea e il numero di volo. Clicca su «Chiudi» nell'intestazione per chiuderla.",
  'help.guide.transport-on-map.step.4':
    "L'icona del percorso nella barra sopra i giorni agisce su tutto il viaggio insieme: «Mostra tutti i percorsi prenotati» e, per nasconderli di nuovo, «Nascondi tutti i percorsi prenotati».",
  'help.guide.transport-on-map.step.5':
    "Un collegamento con i mezzi pubblici pianificato non ha un'icona del percorso propria. Viene disegnato con l'interruttore «Percorso» del giorno, quindi «Nascondi tutti i percorsi prenotati» non lo nasconde finché il percorso di quel giorno è attivo.",
  'help.guide.transport-on-map.result':
    'I percorsi compaiono sulla mappa con un indicatore a ciascuna estremità e restano visibili finché non li disattivi.',
  'help.guide.transport-on-map.tip.1':
    'Voli, crociere e traghetti vengono disegnati come una curva. Auto, autobus, taxi e biciclette seguono le strade reali. Un treno o un collegamento pianificato passa per le stazioni in cui si ferma.',
  'help.guide.transport-on-map.tip.2':
    "Una prenotazione confermata è una linea continua, una in attesa una linea tratteggiata. L'impostazione «Etichette percorsi prenotati» mostra il codice dell'aeroporto o il nome della stazione negli indicatori alle estremità.",
  'help.guide.transport-on-map.tip.3':
    '«Mostra tutti i percorsi prenotati» non si aggiunge ai percorsi già visibili: sostituisce le impostazioni delle singole icone. Dopo averlo premuto, i percorsi sono tutti visibili o tutti nascosti.',
  // airtrail-import
  'help.guide.airtrail-import.title': 'Importare voli da AirTrail',
  'help.guide.airtrail-import.goal':
    'Importa in un colpo solo nel viaggio i voli che hai già in AirTrail e mantienili poi aggiornati da AirTrail.',
  'help.guide.airtrail-import.step.1':
    "Quando il modulo AirTrail è attivo e la tua istanza è collegata in «Integrazioni» nelle Impostazioni, nella barra della scheda Trasporti compare, prima di «Trasporti», l'icona di un aereo: «Importa da AirTrail». Cliccala.",
  'help.guide.airtrail-import.step.2':
    '«Importa da AirTrail» elenca i voli del tuo account in due gruppi. «Durante questo viaggio» contiene i voli con date comprese nel viaggio, già spuntati. «Altri voli» contiene tutti gli altri, non spuntati. Un volo già presente nel viaggio è in grigio e segnato come «Importato».',
  'help.guide.airtrail-import.step.3':
    'Ogni riga è una casella con compagnia aerea e numero di volo, i due aeroporti e la data. Clicca una riga per includere o escludere il volo. I voli in «Altri voli» vengono importati solo se li spunti.',
  'help.guide.airtrail-import.step.4':
    "I voli in coincidenza vengono raggruppati: ognuno parte, entro un giorno, dall'aeroporto in cui è atterrato il precedente. La casella sotto, «Importa come un unico volo con scalo in quell'aeroporto», è già spuntata. Lasciala spuntata per un'unica prenotazione con scalo, oppure togli la spunta per importare le tratte come voli separati.",
  'help.guide.airtrail-import.step.5':
    'Clicca sul pulsante in basso a destra, che mostra il numero di voli spuntati, ad esempio «Importa 2». Il messaggio successivo indica quanti voli sono stati importati.',
  'help.guide.airtrail-import.step.6':
    "I voli compaiono come schede sotto «Confermata», ciascuna con una pillola blu AirTrail accanto al titolo, e come righe nei giorni in cui si svolgono. Un volo con coincidenza è un'unica scheda, e il suo percorso passa per lo scalo.",
  'help.guide.airtrail-import.result':
    "I voli di AirTrail compaiono come schede nella scheda Trasporti e come righe nei rispettivi giorni, ognuno con l'etichetta AirTrail che ne indica la provenienza.",
  'help.guide.airtrail-import.tip.1':
    "Un volo già presente nel viaggio con lo stesso numero e la stessa data viene saltato, e un messaggio indica quanti voli sono stati saltati. La freccia Annulla nella barra degli strumenti sopra i giorni annulla l'intera importazione.",
  'help.guide.airtrail-import.tip.2':
    'AirTrail resta la fonte principale dei dati. TREK legge le modifiche quando apri il viaggio e in background ogni pochi minuti. Un volo eliminato in AirTrail mantiene la sua scheda in TREK e la sua etichetta diventa «Non sincronizzato». Le modifiche fatte in TREK vengono inviate ad AirTrail solo se in «Integrazioni» è attivo «Scrivi le modifiche su AirTrail».',
  'help.guide.airtrail-import.tip.3':
    "Un collegamento combinato non corrisponde a un singolo volo AirTrail sincronizzabile, quindi viene importato una sola volta: mantiene l'etichetta blu, che lo indica quando ci passi sopra con il mouse. Lo stesso succede a un volo sincronizzato quando gli aggiungi a mano uno scalo.",

  // ── Screen: trip-roadtrip ─────────────────────────────────────────────────────────────
  'help.ctx.trip-roadtrip.title': 'Viaggio su strada',
  'help.ctx.trip-roadtrip.summary':
    "Il programma visto come un unico viaggio in auto: gli stessi giorni e gli stessi luoghi, collegati come tappe con i tratti di guida in mezzo, in una sequenza nella colonna di sinistra e sulla mappa. Mostra distanza e tempo di guida, dove fare rifornimento e cosa c'è lungo la strada.",
  'help.ctx.trip-roadtrip.bullet.1':
    "«Giorni» e «Viaggio su strada», in cima alla colonna di sinistra, passano dal programma dei giorni al viaggio in auto. Non viene copiato né modificato nulla: «Giorni» mostra il programma esattamente com'era.",
  'help.ctx.trip-roadtrip.bullet.2':
    "In cima alla barra ci sono i totali del viaggio: «Distanza», «Tempo di guida» e «Tappe». Sotto c'è una scheda per ogni giorno con un tragitto in auto: numero e data del giorno in una casella, poi pillole con chilometri e tempo di guida, numero di soste, eventuali attraversamenti e un badge «Traccia». Un volo, un treno o un traghetto prenotato compare nella sequenza come scheda a sé.",
  'help.ctx.trip-roadtrip.bullet.3':
    "Una tappa numerata è un luogo per cui fai quella giornata. Una sosta lungo il tragitto, come rifornimento, ricarica o area di sosta, mostra l'icona del suo tipo invece di un numero e non viene conteggiata. Clicca su un numero per cambiare il tipo, clicca sul badge «Sosta» per impostare quanto ti fermi, e trascina una tappa per spostarla all'interno del giorno o in un altro giorno.",
  'help.ctx.trip-roadtrip.bullet.4':
    'Tra due tappe, una fascia di guida mostra distanza e tempo della tratta. Cliccala per «Percorsi per questa tratta», oppure clicca il percorso sulla mappa per far passare la tratta da un punto di passaggio.',
  'help.ctx.trip-roadtrip.bullet.5':
    "La colonna di destra diventa «Lungo il percorso»: scegli su una riga cosa cercare e il giorno, poi la larghezza del corridoio, e clicca su «Cerca». Il più su un risultato, «Aggiungi», lo inserisce nel tragitto nel punto in cui ci passi davvero, e l'icona del letto su un hotel aggiunge un pernottamento. «A mano» aggiunge un luogo che la ricerca non ha trovato, e i tre puntini accanto al titolo importano un percorso da Google Maps.",
  'help.ctx.trip-roadtrip.bullet.6':
    "Sotto, «Impostazioni di guida» contiene i limiti, l'auto e la sua autonomia, i tempi di guida giornalieri, cosa evitare, come viene disegnata la linea e se mostrare sulla mappa gli avvisi in corso. Le impostazioni appartengono al viaggio, così tutti pianificano con la stessa auto.",
  // roadtrip-mode
  'help.guide.roadtrip-mode.title': 'Vedere il viaggio come un unico percorso in auto',
  'help.guide.roadtrip-mode.goal': 'Passa il programma alla modalità viaggio su strada e scopri cosa mostra la barra.',
  'help.guide.roadtrip-mode.step.1':
    'Clicca su «Viaggio su strada» nel selettore «Giorni» / «Viaggio su strada» in cima alla colonna di sinistra. Il piano del giorno viene sostituito dal tragitto in auto, e la mappa mostra ogni giorno che ha un percorso.',
  'help.guide.roadtrip-mode.step.2':
    "La scheda in cima alla barra riassume l'intero viaggio: «Distanza», «Tempo di guida» e «Tappe». Resta fissa mentre scorri i giorni.",
  'help.guide.roadtrip-mode.step.3':
    "Sotto c'è una scheda per ogni giorno con un tragitto in auto; i giorni senza guida vengono omessi. L'intestazione della scheda mostra il numero del giorno con la data sotto, poi le pillole con distanza e durata della guida e il numero di soste del giorno.",
  'help.guide.roadtrip-mode.step.4':
    "All'interno della scheda, la giornata è una sequenza: una tappa numerata per ogni luogo, un tratto di guida tra una tappa e l'altra e l'orario di arrivo sul bordo destro. Un volo, un treno o un traghetto prenotato compare nella sequenza come scheda a sé.",
  'help.guide.roadtrip-mode.step.5':
    "Clicca sull'intestazione di un giorno per comprimerlo; la freccia alla fine ruota. Un giorno compresso viene nascosto anche sulla mappa. Clicca di nuovo sull'intestazione per mostrarlo.",
  'help.guide.roadtrip-mode.result':
    'La colonna di sinistra mostra il tragitto in auto e la mappa mostra tutti i suoi giorni. «Giorni» torna subito al programma, invariato.',
  'help.guide.roadtrip-mode.tip.1':
    'La scelta viene salvata nel tuo account per ogni viaggio, quindi dopo un ricaricamento, in un altro browser o su un altro dispositivo il viaggio si riapre nella vista «Viaggio su strada».',
  'help.guide.roadtrip-mode.tip.2':
    'Il selettore compare solo dopo che un amministratore ha attivato il modulo «Viaggio su strada» in «Moduli» nel pannello di amministrazione.',
  'help.guide.roadtrip-mode.tip.3':
    "Sul telefono non c'è il selettore: il modulo aggiunge una scheda «Viaggio su strada» accanto a «Pianificato».",
  // roadtrip-stops
  'help.guide.roadtrip-stops.title': 'Soste lungo il percorso e durata della permanenza',
  'help.guide.roadtrip-stops.goal':
    'Trasforma un luogo del tragitto in una sosta lungo il percorso, e imposta la durata di ogni sosta.',
  'help.guide.roadtrip-stops.step.1':
    'Clicca sul numero davanti a una tappa nella barra. La sua etichetta è «Trasforma in sosta lungo il percorso», e apre sotto una fila di dischi colorati con i tipi di sosta.',
  'help.guide.roadtrip-stops.step.2':
    "Scegli un tipo. Passa con il mouse su un disco per vederne il nome: «Alloggio», «Carburante», «Ricarica», «Area di sosta», «Campeggio», «Ristoro» o «Attrazioni». Il numero diventa l'icona di quel tipo e le tappe successive vengono rinumerate.",
  'help.guide.roadtrip-stops.step.3':
    "Una sosta lungo il percorso non è una destinazione, quindi l'intestazione del giorno conta una tappa in meno.",
  'help.guide.roadtrip-stops.step.4':
    "Clicca di nuovo l'icona, «Cambia il tipo di sosta», e scegli «Torna a essere una destinazione» per ridare il numero alla tappa.",
  'help.guide.roadtrip-stops.step.5':
    'Ogni sosta ha un badge «Sosta», che mostra un più finché non è pianificato nulla. Cliccalo per aprire «Tempo alla sosta».',
  'help.guide.roadtrip-stops.step.6':
    "Imposta la durata con il cursore, con i pulsanti meno e più o con uno dei valori predefiniti. «Partenza» cambia, mentre «Arrivo» resta all'ora in cui arrivi con l'auto. Poi clicca «Salva».",
  'help.guide.roadtrip-stops.result':
    'Il badge «Sosta» della tappa modificata mostra la nuova durata e tutti gli orari di arrivo successivi si spostano di conseguenza. Una tappa che hai trasformato in un altro tipo e poi riportato indietro torna a essere una destinazione numerata.',
  'help.guide.roadtrip-stops.tip.1':
    'La durata della sosta appartiene al luogo, non a una singola visita: un luogo pianificato in due giorni ha la stessa durata in entrambi.',
  'help.guide.roadtrip-stops.tip.2':
    'Le soste lungo il percorso compaiono anche in «Giorni». Disattivando «Mostra anche in Giorni», sotto «Soste di servizio» in «Impostazioni di guida», restano solo in «Viaggio su strada».',
  'help.guide.roadtrip-stops.tip.3': '«Nessuna sosta», nella stessa finestra, toglie di nuovo il tempo.',
  'help.guide.roadtrip-stops.tip.4':
    'Clicca una sosta lungo il percorso o una notte prenotata per aprirne la scheda sopra la mappa. Con «Viaggio su strada» attivo, «Modifica» apre la finestra compatta usata dalla ricerca invece del modulo del luogo, e «Altri dettagli» in quella finestra apre il modulo completo.',
  // roadtrip-corridor
  'help.guide.roadtrip-corridor.title': 'Trovare carburante, cibo e un posto per dormire lungo il percorso',
  'help.guide.roadtrip-corridor.goal':
    'Cerca lungo la strada che percorri davvero e aggiungi quello che trovi alla tratta giusta.',
  'help.guide.roadtrip-corridor.step.1':
    "In «Sto cercando», apri l'elenco e spunta ciò che ti serve. Puoi combinare «Carburante», «Ricarica», «Area di sosta», «Campeggio», «Alloggio», «Ristoro» e «Attrazioni»: l'elenco resta aperto per un'altra scelta e il campo mostra poi un'icona per ogni tipo.",
  'help.guide.roadtrip-corridor.step.2':
    'Scegli il giorno nel menu a tendina alla fine della stessa riga. Propone i giorni per cui la barra ha una scheda, e «Cerca» attende finché non è stato calcolato il percorso del giorno scelto.',
  'help.guide.roadtrip-corridor.step.3':
    'Sotto «Entro», scegli quanto lontano cercare da entrambi i lati della strada, 2 km, 5 km o 10 km, poi clicca su «Cerca».',
  'help.guide.roadtrip-corridor.step.4':
    "I risultati sono raggruppati per tipo, nell'ordine in cui li incontri. Per ognuno vedi quanto dista dal percorso e a che punto del tragitto della giornata si trova.",
  'help.guide.roadtrip-corridor.step.5':
    'Clicca su «Aggiungi», il più su un risultato. «Aggiungi come sosta» indica in quale giorno e in quale posizione verrà inserito, e chiede «Tipo di sosta» e «Tempo alla sosta»; per una colonnina di ricarica mostra anche «Disponibilità e tariffe». «Aggiungi» lo inserisce nel tragitto, mentre «Altri dettagli» apre invece il modulo completo del luogo.',
  'help.guide.roadtrip-corridor.result':
    "La sosta aggiunta compare sul percorso nel punto in cui ci passi, con l'icona del suo tipo. Il percorso della giornata viene ricalcolato passando dalla sosta, e l'elenco si svuota: cerca di nuovo per la sosta successiva.",
  'help.guide.roadtrip-corridor.tip.1':
    'La ricerca parte solo quando premi «Cerca»: ogni ricerca invia molte richieste a un servizio condiviso.',
  'help.guide.roadtrip-corridor.tip.2':
    "«Filtra per nome» filtra i risultati senza fare una nuova ricerca e «Svuota risultati» svuota l'elenco e rimuove i segnaposto. Clicca un risultato per vederlo sulla mappa.",
  'help.guide.roadtrip-corridor.tip.3':
    'Puoi anche trascinare un risultato dalla mappa sul percorso. Così scegli tu la tratta quando percorri la stessa strada due volte. «A mano», accanto a «Cerca», aggiunge un luogo che la ricerca non ha trovato, cercandolo per nome.',
  // roadtrip-via
  'help.guide.roadtrip-via.title': 'Far passare una tratta da un punto di passaggio',
  'help.guide.roadtrip-via.goal': 'Fai passare un tratto dalla strada che vuoi, senza aggiungere una sosta.',
  'help.guide.roadtrip-via.step.1':
    'Mostra sulla mappa il tratto che ti interessa: clicca su una tappa nella barra, poi chiudi la scheda che si apre sopra la mappa.',
  'help.guide.roadtrip-via.step.2':
    'Clicca sul percorso disegnato. Sul tratto cliccato viene aggiunto un punto di passaggio, e il tratto viene ricalcolato passando da lì.',
  'help.guide.roadtrip-via.step.3':
    "La sequenza si aggiorna: l'intestazione del giorno mostra la nuova distanza e il nuovo tempo di guida, e tutti gli arrivi dopo il punto di passaggio cambiano di conseguenza.",
  'help.guide.roadtrip-via.step.4':
    'Passa il mouse sulla maniglia per vedere cosa fa: «Trascina per modificare il percorso, clic destro per rimuovere». Trascinala in un altro punto e la tratta viene ridisegnata passando dal nuovo punto.',
  'help.guide.roadtrip-via.step.5':
    'Fai clic destro sulla maniglia per rimuoverla. La tratta torna a seguire il percorso diretto.',
  'help.guide.roadtrip-via.result':
    'La tratta segue la strada che hai scelto e distanza, tempo di guida e orari di arrivo del giorno vengono ricalcolati.',
  'help.guide.roadtrip-via.tip.1':
    'Un punto di passaggio non è una sosta: non ha numero, durata né orario di arrivo, e non viene conteggiato tra le soste del giorno.',
  'help.guide.roadtrip-via.tip.2':
    "Le maniglie compaiono solo dal livello di zoom 9, quindi su una mappa che mostra l'intero viaggio vedi la linea senza maniglie.",
  'help.guide.roadtrip-via.tip.3':
    'Un clic a più di due chilometri da qualsiasi tratto disegnato viene ignorato, così come un clic su un volo, un treno o un traghetto.',
  // roadtrip-alternatives
  'help.guide.roadtrip-alternatives.title': "Provare un'altra strada per una tratta",
  'help.guide.roadtrip-alternatives.goal':
    'Guarda i percorsi alternativi che il router propone per un tratto del viaggio e scegline uno.',
  'help.guide.roadtrip-alternatives.step.1':
    'Clicca una fascia di guida nella barra laterale, la riga tra due tappe che mostra distanza e tempo della tratta. La sua etichetta è «Altri percorsi».',
  'help.guide.roadtrip-alternatives.step.2':
    '«Percorsi per questa tratta» si apre sopra la mappa, con una voce per ogni strada e la sua lunghezza. La mappa disegna ogni strada con il tempo di guida: quella attuale in blu pieno, le altre in un blu più chiaro.',
  'help.guide.roadtrip-alternatives.step.3':
    'Passa con il mouse su una voce per evidenziare quella strada. «Attuale» è la strada che stai usando e «La più veloce» la più rapida; le altre indicano quanto sono più lente, o quale categoria di strada evitano.',
  'help.guide.roadtrip-alternatives.step.4':
    'Clicca su una voce per usare quel percorso, oppure su «Chiudi» per mantenere il percorso attuale.',
  'help.guide.roadtrip-alternatives.result':
    'Ora il tratto usa la strada che hai scelto, e cambiano anche la distanza nella colonna laterale e gli orari di arrivo successivi.',
  'help.guide.roadtrip-alternatives.tip.1':
    "Quando scegli un'altra strada, TREK la verifica prima con il router del viaggio su strada. Poi mantiene la tratta su quella strada con il minor numero possibile di punti di passaggio, sostituendo quelli che la tratta aveva già. Una strada che il router non riesce a seguire non viene salvata. Se scegli la strada proposta dal router, i punti di passaggio vengono di nuovo rimossi.",
  'help.guide.roadtrip-alternatives.tip.2':
    '«Senza autostrada», «Senza pedaggi» e «Senza traghetto» vengono da un secondo motore con un proprio modello di velocità, quindi i loro tempi non sono confrontabili con gli altri.',
  // roadtrip-limits
  'help.guide.roadtrip-limits.title': "Impostare l'auto e i limiti di guida",
  'help.guide.roadtrip-limits.goal': 'Indica a TREK che veicolo guidi e quanto vuoi guidare senza fare pause.',
  'help.guide.roadtrip-limits.step.1':
    '«Impostazioni di guida» si trova sotto la ricerca nella colonna di destra. I suoi badge mostrano cosa è impostato; cliccala per aprirla.',
  'help.guide.roadtrip-limits.step.2':
    'Sotto Guida, «Tratto più lungo di fila» e «Guida al giorno» sono in minuti. Un campo vuoto significa disattivato, e non viene segnalato nulla.',
  'help.guide.roadtrip-limits.step.3':
    'Sotto «Veicolo», indica cosa guidi. «Benzina» fa rifornimento solo alle soste carburante, «Elettrico» solo a quelle di ricarica, «Entrambi» a tutte e due.',
  'help.guide.roadtrip-limits.step.4':
    "Inserisci tu «Autonomia con un pieno», o «Autonomia per ricarica». Oppure apri «Calcola dai dati dell’auto», sotto «Riempi fino a»: usa «Serbatoio» e «Consumo», oppure «Batteria», «Consumo» e «Degrado batteria», e calcola l'autonomia.",
  'help.guide.roadtrip-limits.step.5':
    "«Evita se possibile», nella colonna di sinistra, è una preferenza, non un divieto: se in una giornata non c'è alternativa, la strada viene usata comunque e nell'intestazione del giorno compare una nota.",
  'help.guide.roadtrip-limits.step.6':
    'Clicca su «Chiudi». I badge della scheda mostrano cosa hai impostato, e la barra segnala ogni tratto e ogni giorno che supera un limite.',
  'help.guide.roadtrip-limits.result':
    'I badge del riquadro mostrano cosa è impostato, e ogni tratta o giorno oltre un limite ha un badge nella sequenza.',
  'help.guide.roadtrip-limits.tip.1':
    'Le impostazioni appartengono al viaggio, quindi tutti i partecipanti pianificano con la stessa auto e gli stessi limiti.',
  'help.guide.roadtrip-limits.tip.2':
    '«Riempi fino a» indica fino a che livello si riempie il serbatoio o la batteria a ogni sosta, perché in viaggio nessuno ricarica al 100 %. Una sosta di rifornimento o ricarica può avere un valore diverso tramite il badge della batteria nella sua riga.',
  'help.guide.roadtrip-limits.tip.3':
    "In «Linea del percorso», «Collega i giorni» calcola anche il tragitto dall'ultima tappa di un giorno alla prima del giorno successivo. «Inizia e termina ogni giorno al tuo alloggio» fa iniziare e finire ogni giorno nell'alloggio prenotato per quelle notti. «Un colore per giorno» mostra ogni giorno con il suo colore.",
  // roadtrip-day-window
  'help.guide.roadtrip-day-window.title': 'Impostare inizio e fine della giornata di guida',
  'help.guide.roadtrip-day-window.goal':
    "Smetti di guidare all'ora che scegli e stabilisci dove deve finire la giornata.",
  'help.guide.roadtrip-day-window.step.1':
    'Apri «Impostazioni di guida» nella colonna di destra e cerca «Orari giornalieri» nella colonna di sinistra della finestra.',
  'help.guide.roadtrip-day-window.step.2':
    'Imposta un «Inizio giornata». Da solo non ha effetto: servono entrambi gli orari, come indica la nota sotto.',
  'help.guide.roadtrip-day-window.step.3':
    "Imposta una «Fine giornata». Ora il tragitto si ferma a quell'ora e riprende la mattina dopo, indicato nella colonna laterale con una riga «Fine giornata» e una riga «Riprendi il viaggio».",
  'help.guide.roadtrip-day-window.step.4':
    "In «Fine giornata» scegli «Lungo il percorso» per fermarti sulla strada all'ora di fine, oppure «Nell'ultimo luogo» per fermarti prima del tragitto successivo che la supererebbe.",
  'help.guide.roadtrip-day-window.step.5':
    'Clicca su «Chiudi». La scheda «Impostazioni di guida» mostra i due orari in un badge.',
  'help.guide.roadtrip-day-window.result':
    "Il viaggio in auto viene diviso in giornate della durata che hai impostato, e quello che non ci sta continua in giorni calcolati dopo l'ultimo. I tuoi giorni e i loro luoghi non cambiano.",
  'help.guide.roadtrip-day-window.tip.1':
    'Se cancelli uno dei due orari, questa funzione si disattiva di nuovo. Gli orari che imposti tu su una tappa hanno sempre la precedenza.',
  'help.guide.roadtrip-day-window.tip.2':
    "Con gli orari di viaggio giornalieri impostati, i giorni sono sempre collegati: il tragitto dall'ultima tappa di un giorno alla prima del giorno successivo viene calcolato e conteggiato.",
  'help.guide.roadtrip-day-window.tip.3':
    'Anche ogni fine giornata è un indicatore sulla mappa: una luna con il numero del giorno. Trascinala lungo il percorso, o su un luogo, per terminare la giornata altrove. Con il clic destro ripristini la fine automatica. «Ripristina le fini giornata automatiche», in questa finestra, annulla tutte queste modifiche. Per terminare una giornata in una sosta, clicca sulla sosta e attiva «Termina la giornata qui» nella sua scheda.',
  // roadtrip-refuel
  'help.guide.roadtrip-refuel.title': 'Fare rifornimento prima che il serbatoio sia vuoto',
  'help.guide.roadtrip-refuel.goal':
    "Trova un posto per fare rifornimento nel tratto di percorso che l'auto riesce ancora a raggiungere, e aggiungilo al tragitto.",
  'help.guide.roadtrip-refuel.step.1':
    "Con un'autonomia impostata, la colonna laterale mostra una fascia sul tratto in cui finisce il carburante o la batteria: «Qui il serbatoio si esaurisce», oppure «Qui la batteria si esaurisce» per un'auto elettrica. Sotto vedi a che punto del tratto si trova.",
  'help.guide.roadtrip-refuel.step.2':
    "Il pulsante è l'icona della spia sulla fascia: «Cerca carburante» oppure, per un'auto elettrica, «Cerca una ricarica». Cerca lungo la strada prima di quel punto e, durante la ricerca, mostra «Ricerca lungo il percorso…».",
  'help.guide.roadtrip-refuel.step.3':
    "Vengono mostrate fino a tre stazioni, ognuna con la distanza dal percorso e l'autonomia che ti resterebbe.",
  'help.guide.roadtrip-refuel.step.4':
    'Il + su un risultato lo aggiunge come sosta per il rifornimento. «Aggiungi come sosta» si apre con tipo e orario già compilati e «Aggiungi» la inserisce nella tratta nel punto in cui il percorso ci passa davvero.',
  'help.guide.roadtrip-refuel.result':
    "La sosta compare sulla tratta giusta con la sua icona e l'autonomia viene ricalcolata a partire da lì. La fascia si sposta nel punto in cui ora il serbatoio si esaurisce, oppure sparisce se puoi arrivare a destinazione senza altre soste.",
  'help.guide.roadtrip-refuel.tip.1':
    "L'autonomia si calcola dall'ultima sosta di rifornimento o ricarica, anche tra un giorno e l'altro. Il tipo di veicolo stabilisce quali soste contano: «Benzina» solo il carburante, «Elettrico» solo la ricarica.",
  'help.guide.roadtrip-refuel.tip.2':
    'La ricerca considera la strada prima del punto in cui finisce il carburante, tiene una riserva e conta due volte la deviazione, quindi ogni posto proposto è davvero raggiungibile.',
  'help.guide.roadtrip-refuel.tip.3':
    'Se non ci sono risultati, puoi cercare di nuovo: la lampadina diventa «Riprova», perché la ricerca dei luoghi è un servizio condiviso che a volte va in timeout.',
  // roadtrip-track
  'help.guide.roadtrip-track.title': 'Far seguire a un giorno una traccia importata',
  'help.guide.roadtrip-track.goal':
    'Usa per il tragitto di un giorno una strada panoramica importata come traccia GPX o KML.',
  'help.guide.roadtrip-track.step.1':
    "Clicca il badge «Traccia» nell'intestazione di un giorno. La finestra si apre su quel giorno.",
  'help.guide.roadtrip-track.step.2':
    'Scegli una traccia. Per ognuna vedi la lunghezza e se segue il percorso di questo giorno oppure quanto dista. La traccia più vicina compare per prima.',
  'help.guide.roadtrip-track.step.3':
    "Clicca su «Segui questa traccia». TREK aggiunge punti di passaggio dove il tragitto si allontana di più dalla traccia e ricalcola il percorso, ripetendo l'operazione più volte.",
  'help.guide.roadtrip-track.step.4':
    'La finestra indica quanti punti di passaggio sono stati inseriti e quanto ora il tragitto resta vicino alla traccia, oppure che il tragitto seguiva già la traccia. «Elimina punti di passaggio», in basso a sinistra, li rimuove e il router ripianifica la giornata. Chiudendo la finestra la traccia resta.',
  'help.guide.roadtrip-track.result':
    'Il tragitto della giornata segue la traccia invece della strada che avrebbe scelto il router. Passa con il mouse sul badge «Traccia» per vedere il nome della traccia. Quando i punti di passaggio mantengono il tragitto sulla traccia, anche il badge risulta evidenziato.',
  'help.guide.roadtrip-track.tip.1':
    "La finestra elenca i luoghi del viaggio che hanno un tracciato: un GPX o KML importato con «Importa file» nella colonna dei luoghi sotto «Giorni», spuntando «Percorsi» o «Tracce (con geometria percorso)» per un GPX, o «Percorsi (LineStrings)» per un KML. «Importa file» è disponibile solo se il modulo Escursioni è disattivato; con Escursioni attivo, un GPX diventa un'escursione, che questa finestra non elenca. Finché il viaggio non ha una traccia, nessun giorno mostra il badge.",
  'help.guide.roadtrip-track.tip.2':
    'Seguire una traccia sostituisce i punti di passaggio che i tratti del giorno avevano già, quindi modella un tratto a mano dopo aver seguito la traccia, non prima.',
  'help.guide.dateless-trip.step.1': 'Clicca su «Nuovo Viaggio» e dai un nome al viaggio.',
  'help.guide.edit-trip.tip.2':
    'I compagni di viaggio che aggiungi o rimuovi qui vengono aggiornati subito, senza bisogno di cliccare su «Aggiorna».',
  'help.guide.trip-reminder.result':
    'Ricevi il promemoria il numero di giorni scelto prima della partenza, sugli stessi canali da cui ti arrivano le notifiche.',
  'help.guide.upcoming-reservations.step.1':
    'Cerca «Prossime prenotazioni» nella colonna di destra: mostra le sei prenotazioni più vicine di tutti i tuoi viaggi, a partire dalla prima, con data, ora e tipo.',
  'help.guide.half-company-holiday.step.1': 'Nella barra degli strumenti passa a «Ferie aziendali».',
  'help.guide.edit-holiday-calendar.result': 'La griglia e la legenda si aggiornano subito dopo ogni modifica.',
  'help.guide.person-color.result': 'Tutti i giorni registrati da quella persona ora compaiono nel nuovo colore.',
  'help.guide.answer-fusion-request.step.1':
    'Apri Ferie dopo aver ricevuto un invito: la finestra «Richiesta di unione» si apre da sola.',
  'help.guide.log-for-partner.step.1':
    'Nella scheda «Persone», clicca sul nome della persona. Il segno di spunta indica che è selezionata.',
  'help.guide.dissolve-fusion.step.1': 'Apri «Impostazioni».',
  'help.guide.country-places.step.2': 'Nella scheda, clicca sul badge «Luoghi», quello con il segnaposto.',
  'help.guide.search-place.tip.2': 'Se la regione è già segnata, il popup ti chiede invece se vuoi rimuoverla.',
  'help.guide.tour-activity-stats.step.4':
    'I badge a destra indicano su cosa si basano i totali: «In programma» per le escursioni conteggiate con la pianificazione del viaggio, «Registrato» per quelle con una traccia reale collegata. «Ancora da fare», «Senza giorno» e «Nessuna data» contano le escursioni non ancora incluse. La «i» spiega il criterio.',
  'help.guide.move-to-list.step.2':
    'Clicca su «Duplica in lista» per tenerli anche qui, oppure su «Sposta in lista» per toglierli da questa lista.',
  'help.guide.accept-list-invite.title': "Accettare l'invito a una lista",
  'help.guide.tour-collection-add-to-trip.step.3':
    'Sotto «Waypoint», scegli la casella con i waypoint per aggiungere partenza, tappe e arrivo nel loro ordine, oppure «Solo la linea» per aggiungere solo la linea salvata.',
  'help.guide.tour-collection-manage.step.1':
    "Apri una lista. Ogni escursione salvata mostra grado, tipo, il viaggio da cui è stata salvata, distanza, dislivello e numero di waypoint. Passa con il mouse sul nome del viaggio per vedere chi l'ha salvata.",
  'help.guide.entry-draft.step.1': "Nell'editor, attiva «Bozza» nella colonna di destra.",
  'help.guide.journey-map-layers.step.3':
    'Clicca su un segnaposto vuoto o su un puntino sulla mappa. Una scheda ti dice di cosa si tratta: un luogo pianificato con il suo giorno, oppure una sosta con «Apri la voce», che ti porta al resoconto del giorno corrispondente.',
  'help.guide.journey-keep-route.step.3': 'Clicca su «Salva percorso».',
  'help.guide.journey-day-stays.step.3':
    "Clicca su «Non è un luogo che ho visitato» sulla sosta che non ti interessa: la sosta viene tolta dall'elenco.",
  'help.guide.journey-take-over-day.step.3':
    "Se vuoi una sola voce per tutta la giornata, imposta «Voci» su «Resoconto del giorno»: un'unica voce elenca tutte le soste scelte con i rispettivi orari.",
  'help.guide.journey-auto-prepare.step.2':
    'Sotto «Giorni registrati», attiva «Prepara automaticamente i giorni registrati».',
  'help.guide.photo-location.step.2': 'Sotto «Foto», attiva «Posiziona le voci dalle loro foto».',
  'help.guide.link-trip.tip.3':
    "Se scrivi una voce in un giorno di un viaggio non ancora collegato, l'editor ti propone «Collega viaggio» direttamente nella voce.",
  'help.ctx.settings-plugins.summary':
    "Le tue impostazioni personali per i plugin installati dall'amministratore: le chiavi e le preferenze che ogni plugin ti chiede, e un registro di ciò che i plugin hanno fatto a tuo nome. La scheda compare solo quando c'è un plugin attivo.",
  'help.ctx.settings-about.bullet.3':
    'Su Ko-fi, Buy Me a Coffee e Discord puoi sostenere TREK o parlare con le persone che lo sviluppano.',
  'help.guide.language-region.step.3':
    'Imposta la «Valuta di visualizzazione», oppure lascia «Valuta del viaggio» per vedere ogni viaggio nella sua valuta. Poi scegli «Unità di Temperatura», «Unità di Distanza», «Formato Ora» e il giorno in cui inizia la settimana («La settimana inizia il»).',
  'help.guide.travel-map-prefs.step.3':
    "«Esplora luoghi sulla mappa» mostra la pillola delle categorie per trovare luoghi nelle vicinanze. «Nascondi codici di prenotazione» oscura i numeri di conferma finché non ci passi sopra con il mouse o li tocchi. «Ottimizza il percorso dall'alloggio» fa iniziare e finire la giornata al tuo hotel.",
  'help.guide.web-push-device.step.2':
    'Nella scheda «Notifiche» in alto, la colonna Push stabilisce quali eventi vengono inviati ai tuoi dispositivi.',
  'help.guide.connect-airtrail.goal': 'Fai importare e sincronizzare a TREK i voli dal tuo AirTrail.',
  'help.guide.connect-dawarich.goal': 'Fai leggere a TREK dal tuo Dawarich dove sei stato davvero.',
  'help.guide.tour-connect-wanderer.goal':
    'Fai leggere a TREK i sentieri del tuo wanderer, per importarli come escursioni.',
  'help.guide.tour-wanderer-watch.title': 'Ricevere un avviso quando i tuoi sentieri wanderer cambiano',
  'help.guide.plugin-settings.tip.2':
    'Un canale di un plugin sotto «Notifiche» ha un pulsante «Configura» che apre questa pagina.',
  'help.guide.default-user-settings.result':
    'I nuovi account, e chiunque non abbia mai modificato queste impostazioni, vedono le tue scelte.',
  'help.guide.own-routing-engine.goal':
    'Calcola i percorsi dei giorni e dei road trip con un tuo server OSRM o Valhalla, invece di quelli pubblici.',
  'help.guide.admin-passkeys.tip.1':
    'Se TREK non riesce ancora a determinare un dominio, un avviso lo segnala e le passkey restano nascoste finché non imposti APP_URL o il Relying Party ID.',
  'help.guide.rotate-jwt-secret.step.1':
    'In fondo alla scheda «Impostazioni», sotto «Zona pericolosa», clicca su «Rinnova» accanto a «Ruota il secret JWT».',
  'help.guide.storage-backends.tip.3':
    'TREK può scaricare di nuovo le cache delle foto, quindi duplicarle di solito spreca solo spazio.',
  'help.guide.admin-channels.step.3':
    "Nella scheda «Notifiche» qui sotto, scegli per ogni evento su quali canali inviarlo: «Nuova versione disponibile», «Errore di replica dell'archiviazione» e «Regione canoa richiesta». Ogni interruttore si salva subito.",
  'help.guide.notification-defaults.tip.1':
    "«Disattivato» è un'impostazione predefinita che ogni utente può comunque attivare; «Bloccato» la disattiva per tutti.",
  'help.ctx.notifications.bullet.4':
    "Accanto all'ora di ogni notifica, «Segna come letto» (la doppia spunta) ed «Elimina» (il cestino) agiscono solo su quella. «Segna tutto come letto» ed «Elimina tutto», in alto, agiscono sull'intero elenco.",
  'help.guide.read-notifications.tip.2':
    'Una notifica senza pulsante è solo informativa: leggila nel pannello e segnala lì come letta.',
  'help.guide.filter-notifications.result': "L'elenco mostra solo le notifiche ancora da leggere, dalla più recente.",
  'help.guide.delete-notifications.title': 'Eliminare le notifiche',
  'help.guide.notification-settings.goal':
    'Decidi quali eventi compaiono sotto la campanella e quali ti arrivano anche via email, webhook, ntfy o push.',
  'help.guide.public-link.step.4': 'Clicca su «Crea link», poi su «Copia», e invialo.',
  'help.guide.link-journal.step.2': 'Clicca su «Collega un diario» e scegli uno dei tuoi diari in «Scegli un diario».',
  'help.guide.dawarich-stays.title': 'Trasformare una sosta registrata in un luogo',
  'help.guide.dawarich-stays.tip.2':
    "Se elimini un luogo creato da una sosta, la sosta torna nell'elenco come in attesa.",
  'help.guide.leave-stop-off-route.goal':
    'Tieni una tappa nella giornata senza farci passare il percorso, per un luogo che attraversi a piedi o che vuoi solo vedere sulla mappa.',
  'help.guide.day-route.tip.4':
    'Per una tappa che vuoi nella giornata ma non nel percorso, scegli «Escludi dal percorso» nel suo menu.',
  'help.guide.move-booking-day.step.2':
    "Trascina la riga sull'intestazione della scheda di un altro giorno. Una prenotazione di un solo giorno si sposta interamente su quel giorno. Per una prenotazione su più giorni, la riga «Partenza» sposta il giorno di inizio e la riga «Arrivo» quello di fine.",
  'help.guide.place-image-from-file.title': 'Usare una foto allegata come immagine del luogo',
  'help.guide.place-image-from-file.tip.2':
    'Puoi scegliere anche una foto fissata alla tappa o allegata alla sua prenotazione.',
  'help.guide.place-own-hours.step.5':
    "Clicca su «Aggiorna». Ora la scheda mostra i tuoi orari sotto «Orari di apertura», e l'indicazione «Aperto» o «Chiuso» in alto si basa su questi.",
  'help.guide.confirm-stay-booking.step.3':
    'Clicca su «In attesa» in alto. Il suggerimento indica «Imposta su Confermata» e il pallino diventa verde.',
  'help.guide.map-nearby-places.tip.4':
    'Una categoria la cui ricerca non è riuscita ha un pallino rosso, e «Cerca in questa zona» diventa rosso con un segnale di avviso: cliccalo per riprovare.',
  'help.guide.tour-map-lines.tip.1':
    'Se chiudi un giorno nella colonna dei giorni, le sue escursioni e le sue tappe spariscono dalla mappa.',
  'help.guide.car-stops.step.3':
    "Inserisci un titolo nell'intestazione. Sotto «Percorso», scegli in «Da» dove ritiri l'auto e in «A» dove la riconsegni; ancora prima che scrivi ti vengono proposti i luoghi del viaggio. «Ritiro» e «Ora ritiro» indicano quando la ritiri, «Riconsegna» e «Ora riconsegna» quando la riconsegni.",
  'help.guide.transport-details.step.1':
    "Nella scheda «Trasporti», clicca su una scheda. I dettagli si aprono sopra la scheda, con l'intestazione dello stesso colore della scheda. Anche la riga di un trasporto nel piano del giorno apre gli stessi dettagli.",
  'help.guide.export-transports-csv.tip.2':
    'La scheda «Prenotazioni» ha la stessa icona e crea un file a parte, che termina con bookings.csv.',
  'help.guide.group-sort-bookings.step.2':
    'Sotto «Raggruppa per», scegli «Stato», «Giorno», «Tipo» o «Nessun raggruppamento». La scheda si suddivide subito in quelle sezioni.',
  'help.guide.export-bookings-csv.result':
    'Il browser scarica un file con il nome del viaggio e della scheda, ad esempio autumn-in-japan-bookings.csv, con una riga per ogni prenotazione mostrata nella scheda.',
  'help.guide.arrange-packing-list.result':
    "Le liste sono nell'ordine in cui le hai trascinate, e gli elementi sono in ordine dalla A alla Z finché non disattivi l'opzione. TREK salva comunque il tuo ordine personale.",
  'help.guide.count-packed-pieces.step.2':
    'Prima della quantità compare un contatore, 0/5, con un meno e un più. Clicca sul più per ogni pezzo che metti in borsa.',
  'help.guide.expense-receipts.step.4':
    "Nel registro, la riga ha ora un chip «Ricevuta» accanto al nome, con il numero tra parentesi se ce n'è più di una. Cliccalo per aprire la ricevuta.",
  'help.guide.final-budget.tip.3':
    'Chi ha lasciato il viaggio resta con una riga in «Saldi» e «Budget finale» finché deve ancora ricevere o restituire dei soldi.',
  'help.guide.files-sync-settings.step.2':
    'La barra del flusso mostra TREK e il tuo archivio con i documenti di ciascuno, e in mezzo due corsie: «Verso l’archivio» e «Dall’archivio». Clicca su «Verso l’archivio» per disattivarla: la corsia diventa grigia e la riga sotto le corsie indica «Solo in entrata». Cliccala di nuovo per riattivarla.',
  'help.guide.files-sync-settings.tip.4':
    'Solo il proprietario del viaggio o un amministratore può modificare queste impostazioni. Gli altri membri vedono la barra del flusso con una riga come «I documenti vanno in entrambe le direzioni», ma non «Impostazioni».',
  'help.guide.manage-notes.step.2':
    "«Espandi» apre la nota intera: il testo completo, il suo «Sito web» e i suoi «File». Clicca su un file per vederne l'anteprima. «Modifica», in fondo, passa direttamente all'editor; la croce in alto a destra richiude la nota.",
  'help.guide.note-categories.goal':
    'Organizza le note del gruppo in categorie con nome e colore, e mostrane una alla volta.',
  'help.guide.note-categories.tip.1':
    "Il cestino elimina solo le categorie che nessuna nota usa. Una categoria ancora in uso resta nell'elenco finché non sposti quelle note in un'altra categoria.",
  'help.guide.roadtrip-reorder.title': 'Riordinare una tappa o spostarla a un altro giorno',
  'help.guide.roadtrip-reorder.tip.3':
    'Per un orario che hai fissato TREK non chiede nulla: la barra ricalcola subito la giornata e segnala le tappe che non si riescono più a raggiungere in tempo.',
  'help.guide.roadtrip-overnight.step.3':
    'In cima alla finestra, «Pernottamento» aggiunge una notte e «Sosta» ne fa una tappa di una certa durata. Un hotel si apre con «Pernottamento», un campeggio con «Sosta». Per una notte serve solo il check-in, che puoi anche lasciare vuoto.',
  'help.guide.roadtrip-stop-fill.step.1':
    'Su una tappa di rifornimento o ricarica nella barra, clicca sul badge della batteria. Indica il livello fino a cui fai il pieno in quella tappa: sbiadito se usa il tuo valore «Riempi fino a», pieno se ha un valore proprio.',
  'help.guide.roadtrip-bookings.step.1':
    'Registra il tragitto come prenotazione di tipo «Volo», «Treno», «Traghetto», «Crociera» o «Autobus» nel suo giorno, con partenza e arrivo localizzati. Il viaggio in auto lo include automaticamente: la strada si ferma al terminal di partenza e riprende da quello di arrivo.',
  'help.guide.roadtrip-google-import.result':
    "Le tappe del percorso vengono aggiunte dopo l'ultima tappa di quel giorno, e il percorso nella barra e sulla mappa passa da lì.",
  'help.guide.roadtrip-hazards.step.3':
    "Gli avvisi compaiono sulla mappa come aree. Cliccane una per sapere di cosa si tratta, quale servizio l'ha segnalata e quando è stata aggiornata l'ultima volta.",
  'help.ctx.trip-tours.bullet.2':
    "In alto, «Importa GPX o KML» importa i file come escursioni. Il pulsante del filtro sotto (all'inizio «Tutti», con il numero di escursioni) restringe l'elenco per stato, origine, limite di percorso e tipo.",
  'help.guide.tour-show-list.step.2':
    "Ogni riga è un'escursione. La barra colorata è la sua linea sulla mappa, e la casella rotonda mostra il limite di percorso (da T1 a T6) per un'escursione a piedi pianificata in TREK, oppure l'icona del tipo. I badge sotto il nome indicano i giorni in cui è pianificata, il tempo, la distanza e la salita. In un'escursione di più giorni, la luna con un numero indica quante tappe ha.",
  'help.guide.tour-add-to-day.title': "Assegnare un'escursione a un giorno",
  'help.guide.tour-add-to-day.tip.2':
    "Se il viaggio finisce prima dell'ultima tappa, l'opzione indica l'ultima tappa che ci sta, e quelle successive restano senza giorno.",
  'help.guide.tour-day-times.step.3':
    'Clicca su «Aggiorna». Ora la riga mostra inizio → fine. Un orario di fine calcolato è più chiaro, con ≈ se è una stima, ≥ se una sosta non ha ancora un orario e +1 se va oltre la mezzanotte. Passaci sopra con il mouse per vedere come è stato calcolato.',
  'help.guide.tour-remove-from-day.goal': "Togli un'escursione dalla pianificazione senza eliminarla.",
  'help.guide.tour-filter-list.goal':
    'Riduci un lungo elenco alle escursioni che ti servono: non ancora pianificate, importate da un file, di un certo tipo.',
  'help.guide.tour-filter-list.result':
    "Nell'elenco restano solo le escursioni filtrate; le altre sono comunque ancora nel viaggio.",
  'help.guide.tour-hide-on-map.result':
    "Sulla mappa vedi solo le escursioni che vuoi, mentre quelle nascoste restano nell'elenco, attenuate.",
  'help.guide.tour-import-plan-tab.result':
    "La traccia è diventata un'escursione del viaggio: una riga nell'elenco con un badge GPX e una linea sulla mappa.",
  'help.guide.tour-detail-read.title': "Aprire un'escursione e leggerne la scheda",
  'help.guide.tour-detail-read.step.7': 'Chiudi la scheda con la X in alto, oppure premi Esc.',
  'help.guide.tour-rename-colour.goal':
    "Dai a un'escursione un nome facile da riconoscere e un colore della linea ben visibile sulla mappa.",
  'help.guide.tour-take-along.title': "Scaricare un'escursione sul telefono o sul GPS",
  'help.guide.tour-take-along.tip.4':
    "Nella scheda «Escursioni» lo stesso download si trova in cima alla colonna di sinistra. Se l'escursione ha modifiche non salvate, il download ti chiede prima di salvare.",
  'help.guide.tour-copy-keep.tip.1':
    "Sono entrambe copie: le modifiche successive all'escursione non cambiano né la copia né la versione salvata nella raccolta.",
  'help.guide.tour-packing-link.step.2':
    'Sotto «Collega a», scegli «Intera lista valigia» o una delle sue liste. Ogni riga mostra quanti elementi contiene.',
  'help.guide.tour-files.title': "Allegare file a un'escursione",
  'help.guide.tour-activity-link.title': 'Collegare la traccia che hai percorso davvero',
  'help.guide.tour-activity-link.tip.2':
    "Puoi collegare solo una traccia importata che non è stata usata per pianificare un'escursione, e ogni traccia a una sola escursione.",
  'help.guide.tour-activity-compare.step.4':
    "«Cambia», sotto la traccia, sceglie un'altra registrazione. «Scollega» la toglie dall'escursione, e la traccia resta nel viaggio come importazione.",
  'help.guide.tour-origin-check.step.3':
    "Un'escursione che hai disegnato nella scheda «Escursioni» mostra «pianificata in TREK», con il giorno in cui è stata creata («Creato»).",
  'help.ctx.trip-tour-planner.bullet.2':
    "La barra di sinistra è l'editor. Se non c'è nulla di aperto, propone «Pianifica nuova escursione». Un'escursione aperta mostra nome, tipo, waypoint, le schede del suo tipo e i dettagli, con «Scarta» e «Salva» in fondo.",
  'help.guide.tour-open-workspace.step.2':
    "La barra di sinistra è l'editor. Se non c'è nessuna escursione aperta, propone «Pianifica nuova escursione», che ne avvia una sulla mappa.",
  'help.guide.tour-open-workspace.tip.3':
    "Se apri un'altra escursione mentre nell'editor ci sono modifiche non salvate, TREK prima ti chiede se scartarle («Scarta modifiche») o continuare a modificare.",
  'help.guide.tour-draw-route.step.5':
    "Clicca sui punti successivi nell'ordine in cui li percorri. Ogni clic aggiunge il punto come nuovo arrivo e, a partire da due punti, TREK calcola il percorso lungo i sentieri.",
  'help.guide.tour-type-profile.goal':
    'Scegli il tipo di escursione e, per un giro in bici, il profilo, così il percorso segue le strade adatte.',
  'help.guide.tour-edit-points.title': 'Spostare, riordinare e rimuovere i punti',
  'help.guide.tour-edit-points.tip.1':
    "Il primo punto ha il badge «Inizio» e l'ultimo il badge «Fine». Se sposti un punto in cima o in fondo, diventa la partenza o l'arrivo.",
  'help.guide.tour-shaping-points.step.4':
    'Per trasformare una tappa in un punto di forma o viceversa, apri «Altre azioni» sulla sua riga e scegli «Rendilo un punto di forma» o «Rendilo una tappa».',
  'help.guide.tour-loop-reverse.step.2':
    "Ora l'ultima riga mostra «Ritorno alla partenza», e il percorso sulla mappa finisce dove è iniziato.",
  'help.guide.tour-leg-by-hand.step.1':
    'Apri «Altre azioni» sul punto da cui parte il tratto e scegli «Disegna a mano il tratto successivo».',
  'help.guide.tour-trip-places.goal':
    "Aggiungi come tappa dell'escursione un luogo che hai già pianificato nel viaggio.",
  'help.guide.tour-trip-places.result': "L'escursione ha una nuova tappa per il luogo del viaggio, con lo stesso nome.",
  'help.guide.tour-details-times.tip.2':
    "In un'escursione a piedi, «Dettagli» contiene anche «Difficoltà massima del sentiero» e «Scelta del percorso», spiegate nelle guide sulle escursioni a piedi. Una passeggiata urbana non ha «Pause»: al loro posto conta il tempo che passi alle tappe.",
  'help.guide.tour-save.step.4':
    "Ora l'escursione compare sotto «Escursioni di questo viaggio», non ancora assegnata a un giorno.",
  'help.guide.tour-edit-saved.step.2':
    'Modifica ciò che ti serve, come per una nuova escursione: sposta o aggiungi punti, cambia il tipo o modifica i dettagli, come qui la «Descrizione».',
  'help.guide.tour-summary-profile.goal':
    "Scopri quanto è lunga e ripida l'escursione, e in quale punto del percorso si trova ogni quota.",
  'help.guide.tour-summary-profile.result':
    "Sai quanto è lunga l'escursione, quanto dislivello ha, quanto dura e dove diventa ripida.",
  'help.guide.tour-list-manage.tip.1':
    'Nei totali ogni escursione conta una sola volta, anche se è su più giorni. Un totale preceduto da ≥ esclude alcune escursioni: passaci sopra con il mouse per vedere quante.',
  'help.guide.tour-delete.tip.1': "L'operazione è irreversibile, e nemmeno «Annulla» riporta indietro l'escursione.",
  'help.guide.tour-saved-elsewhere.step.3':
    'Se clicchi comunque su «Salva», si apre invece «Modificato nel frattempo» e non viene sovrascritto nulla.',
  'help.ctx.trip-tour-import.bullet.2':
    "«Anteprima dell'importazione» mostra su una mappa ogni traccia dei file, con distanza, salita, discesa e punti, prima di salvare qualsiasi cosa. Sotto «Importa come» indichi cosa sono le tracce.",
  'help.guide.tour-import-gpx.step.3':
    "Si apre l'«Anteprima dell'importazione», e non è ancora salvato nulla. La mappa mostra l'intero tracciato, e ogni traccia dei file è una riga numerata con distanza, salita, discesa e punti. Per una traccia registrata sono indicati anche quando è stata registrata e quanto è durata.",
  'help.guide.tour-import-gpx.result':
    "L'escursione si trova in «Escursioni di questo viaggio», non ancora assegnata a un giorno. Se è una sola, si apre subito sulla mappa come «Escursione GPX».",
  'help.guide.tour-view-import.tip.3': 'Un sentiero di wanderer si apre allo stesso modo, come «Escursione wanderer».',
  'help.guide.tour-plan-from-import.tip.1':
    '«Scarta» elimina il suggerimento. Non viene salvato nulla finché non salvi tu.',
  'help.guide.tour-restore-recorded.step.2': 'Clicca su «Ripristina la traccia registrata».',
  'help.guide.tour-take-over.step.2': 'Scegli «Riprendi un percorso da un altro viaggio».',
  'help.guide.tour-take-over.result':
    "Un messaggio conferma l'operazione e l'escursione si apre nell'editor, pronta da assegnare a un giorno.",
  'help.guide.tour-import-wanderer.tip.2':
    "L'importazione è una copia: le modifiche successive in wanderer non toccano l'escursione. «Controlla la fonte», in «Origine» dell'escursione, ti dice quando il sentiero è cambiato.",
  'help.ctx.trip-tour-map.bullet.3':
    "«Cerca luogo o indirizzo», in cima alla mappa, sposta la mappa su un paese, un rifugio o una vetta senza aggiungere nulla all'escursione.",
  'help.guide.tour-map-layers.result':
    "L'escursione appare sulla mappa più adatta, e la pillola indica quale è attiva.",
  'help.guide.tour-along-search.step.3':
    'Sotto «Entro questa distanza dal percorso», scegli quanto lontano dalla linea cercare: 250 m, 500 m, 1 km o 2 km.',
  'help.guide.tour-along-add-stop.goal':
    "Fai passare l'escursione da un punto panoramico, un rifugio o una sorgente che hai trovato lungo il percorso.",
  'help.guide.tour-along-add-stop.tip.3':
    "Un tratto in cui non puoi aggiungere una tappa (una via ferrata o un trasbordo inseriti come linea fissa, oppure un tratto disegnato a mano) resta attenuato nell'elenco, con il motivo accanto.",
  'help.guide.tour-3d-terrain.result':
    "Hai visto l'escursione sul terreno 3D con i tratti ripidi colorati, e per pianificare sei tornato alla mappa piatta.",
  'help.guide.tour-3d-flyover.step.3':
    "«Pausa» ferma il volo nel punto in cui si trova, e «Avvia il sorvolo» riprende da lì. «Ricomincia» torna all'inizio e riavvia il volo.",
  'help.guide.tour-map-overlays.step.1':
    "Apri un'escursione di sci nella scheda «Escursioni». Le piste sono visibili fin dall'inizio: il loro interruttore è la montagna innevata nella pillola in basso a sinistra, «Piste, anelli di fondo e impianti». Cliccala per nasconderle sulla mappa, e cliccala di nuovo per mostrarle.",
  'help.ctx.trip-tour-stages.title': 'Escursioni di più giorni',
  'help.guide.tour-multi-day.goal': 'Dividi un percorso in tappe, una per ogni giorno di cammino.',
  'help.guide.tour-multi-day.tip.2':
    'Per riunire due tappe, scegli «Togli fine tappa» nel menu della tappa con la luna. Anche eliminare quella tappa le riunisce, e un avviso ti propone «Annulla».',
  'help.guide.tour-stages-on-days.step.3':
    "Scegli «Tappe da questo giorno in poi»: la tappa 1 va in quel giorno e ogni tappa successiva nel giorno dopo. «Tour completo in questo giorno» mette invece l'intero percorso in quel solo giorno.",
  'help.guide.tour-stages-on-days.result':
    "Ogni tappa è nel suo giorno del viaggio, e la tappa che hai aperto è nell'editor.",
  'help.ctx.trip-tour-hike.bullet.6':
    "«Riepilogo dell'escursione», a destra, indica distanza, dislivello, tempo stimato di cammino o di corsa, pause e totale pianificato, con il profilo altimetrico sotto. «Salva», in fondo all'editor, salva l'escursione.",
  'help.guide.tour-hike-plan.step.6': 'Clicca su «Salva» in fondo alla colonna di sinistra.',
  'help.guide.tour-hike-trail-details.step.1':
    "Apri l'escursione da «Escursioni di questo viaggio» e cerca «Dettagli del sentiero» sotto la scheda «Waypoint». Attiva «Mostra lungo il percorso».",
  'help.guide.tour-hike-trail-details.tip.3':
    "La scheda non modifica l'escursione e richiede una connessione. Un'escursione importata mostra la stessa scheda nella sua vista, senza limite di percorso.",
  'help.guide.tour-hike-round.result':
    "L'escursione segue l'anello che hai scelto e torna al punto di partenza. «Anello scelto», in fondo alla mappa, offre «Annulla», e con «Salva» lo mantieni.",
  'help.guide.tour-hike-compare-ways.step.3':
    'I badge su una riga indicano di quanto è più lunga, più alta o più lenta rispetto al percorso attuale. Clicca su quella che preferisci.',
  'help.guide.tour-ferrata-add.step.1':
    "Con un'escursione aperta, clicca su «Vie ferrate» nella fila di pulsanti della mappa in basso a sinistra. Il badge indica quante vie ferrate sono visibili; se richiesto, ingrandisci la mappa.",
  'help.guide.tour-ferrata-add.tip.3':
    'Il tratto della via ferrata è evidenziato sul profilo altimetrico, così vedi a che punto della giornata lo raggiungi.',
  'help.guide.tour-run-plan.step.5': "Dai un nome alla corsa in «Nome dell'escursione» e clicca su «Salva».",
  'help.guide.tour-run-ways.step.1':
    'Apri la corsa da «Escursioni di questo viaggio» e attiva «Mostra lungo il percorso» in «Dettagli del sentiero», sotto la scheda «Waypoint».',
  'help.ctx.trip-tour-walk.bullet.1':
    "Il «Tipo di tour» «Passeggiata urbana / turistica» trasforma un'escursione in una passeggiata. I suoi punti sono tappe con un'«Etichetta», una durata di sosta e un'importanza. Una passeggiata non ha limite di difficoltà né il campo «Pause»: al loro posto contano le soste.",
  'help.guide.tour-walk-plan.step.2':
    'Aggiungi le tappe: verifica che «Aggiungi punto» sia attivo e clicca sulla mappa in corrispondenza di ciascuna, oppure clicca su «Luoghi del viaggio» per usare un luogo già presente nel viaggio.',
  'help.guide.tour-walk-plan.result':
    "La passeggiata elenca le sue tappe con le soste, e «Riepilogo dell'escursione» le somma. Assegnala a un giorno per vedere a che ora raggiungi ogni tappa.",
  'help.guide.tour-walk-sights.tip.1': 'Diventa una tappa della passeggiata, non un luogo del viaggio.',
  'help.guide.tour-walk-day-times.step.3':
    "Riapri la passeggiata nella scheda «Escursioni». In cima a «Waypoint», «Orari per» mostra il giorno e l'ora di partenza. Se la passeggiata è pianificata su più giorni, cliccalo per sceglierne un altro.",
  'help.guide.tour-walk-google-import.goal':
    'Incolla un percorso a piedi condiviso da Google Maps e carica le sue tappe come passeggiata.',
  'help.guide.tour-walk-google-import.result':
    "Nell'editor si apre una nuova passeggiata urbana con le tappe di Google Maps, pronta da salvare.",
  'help.guide.tour-walk-check-off.tip.2':
    'Anche la riga della passeggiata nel piano del giorno mostra il conteggio, ad esempio 3/7.',
  'help.ctx.trip-tour-bike.bullet.4':
    'Con il profilo MTB, la stessa scheda mostra i gradi dei sentieri (mtb:scale) dove i mappatori li hanno inseriti. Una strada senza grado ha difficoltà sconosciuta, non facile.',
  'help.guide.tour-bike-profile.step.6':
    "Inserisci un nome in «Nome dell'escursione», poi clicca su «Salva» in fondo alla barra di sinistra.",
  'help.guide.tour-bike-surfaces.goal':
    'Scopri quanta parte del percorso è su asfalto, su ghiaia o su fondo sconosciuto, e su quali tipi di strada passa.',
  'help.guide.tour-bike-surfaces.tip.3':
    "La scheda usa il percorso così come l'ha calcolato il router e non modifica nulla dell'escursione. Richiede una connessione: offline te lo segnala, e il percorso non ne risente.",
  'help.guide.tour-bike-mtb-grades.tip.1':
    '«Nessun grado nei dati» significa difficoltà sconosciuta, non facile. Il grado non dice nulla su quanto un sentiero sia adatto a te.',
  'help.ctx.trip-tour-ski.bullet.3':
    'Ogni punto che clicchi sulla mappa viene collegato al precedente lungo piste, impianti e sentieri. Sotto ogni punto il relativo tratto è elencato a chip, con le piste nel colore della loro difficoltà e i minuti. Un tratto che non si riesce a pianificare diventa rosso, spiega il motivo e propone una correzione oppure «Traccia dritto».',
  'help.guide.tour-ski-plan.step.4':
    'Verifica che «Aggiungi punto» sia attivo, poi clicca sulla mappa nel punto di partenza e in ogni posto che vuoi raggiungere, in ordine. Il router delle piste collega ogni punto al precedente lungo piste, impianti e sentieri.',
  'help.guide.tour-ski-options.title': 'Dire al router delle piste come scii',
  'help.guide.tour-ski-options.tip.2':
    '«Usa gli impianti» è attivo per impostazione predefinita per «Alpino» e Snowboard, disattivato per le altre discipline. «Escludi» e «Scendi in impianto se serve» compaiono solo quando si usano gli impianti.',
  'help.guide.tour-ski-fix-leg.tip.1':
    'Puoi anche trascinare il punto sulla mappa più vicino a una pista, un sentiero o un impianto. Quando lo rilasci, il tratto viene ricalcolato.',
  'help.guide.tour-ski-summary.step.2':
    '«Sciando», «In impianto», «Attesa» e «A piedi» indicano il tempo per ciascuna voce. «Piste», «Discesa sulle piste» e «Corse in impianto» indicano la lunghezza delle piste, il dislivello che scendi sciando e quanti impianti prendi.',
  'help.guide.tour-ski-pistes-layer.goal':
    'Visualizza piste, anelli di fondo e impianti intorno alla tua escursione di sci, e scopri cosa significano i loro colori.',
  'help.guide.tour-ski-import.title': 'Importare una traccia di sci e indicare di cosa si tratta',
  'help.guide.tour-ski-import.tip.1':
    'Una traccia importata resta così come è stata registrata: TREK non la allinea alle piste, e la sua scheda mostra «Tempo di sci» come «Non calcolato».',
  'help.ctx.trip-tour-paddle.bullet.3':
    "«Altre azioni» su un punto contiene gli strumenti per la pagaiata: pianificare il tratto successivo sull'acqua o disegnarlo a mano, «Trasporta l’imbarcazione da qui» e «Chiusa in questo punto».",
  'help.guide.tour-paddle-setup.step.3':
    "Sotto «Barca», scegli Kayak, «Canoa», SUP o «Altro». In base all'imbarcazione TREK suggerisce la velocità.",
  'help.guide.tour-paddle-setup.tip.4':
    '«Pagaiare comporta dei rischi», la riga in fondo alla colonna, apre «Sicurezza in acqua». Leggila almeno una volta prima della tua prima escursione.',
  'help.guide.tour-paddle-water-route.step.5':
    "Per pianificare in una volta tutti i tratti disegnati a mano, clicca su «Pianifica sull’acqua i tratti disegnati a mano», le onde nell'intestazione di «Waypoint».",
  'help.guide.tour-paddle-portage.step.1':
    "Punta la tappa in cui scendi dall'imbarcazione e clicca su «Altre azioni», i tre puntini.",
  'help.guide.tour-paddle-portage.result':
    'Il tratto è un trasbordo sulla mappa e nei waypoint, e la «Stima dei tempi» lo conta come trasporto.',
  'help.guide.tour-paddle-lock.tip.2':
    "Se un trasbordo aggira la chiusa, la chiusa appare attenuata con l'indicazione «Aggirata a piedi». Conta invece il tempo del trasbordo, e i minuti della chiusa non vengono inclusi.",
  'help.guide.tour-paddle-time.step.4':
    "Se l'escursione ha un trasbordo, la riga «Trasporto» ne conta il tempo. Clicca sulla velocità e inserisci a che velocità trasporti l'imbarcazione. «Sbarco e reimbarco» aggiunge i minuti a ogni trasbordo.",
  'help.guide.tour-paddle-wind.step.1':
    "Assegna l'escursione in pagaia a un giorno del viaggio. La scheda «Vento» nella colonna di sinistra mostra allora le previsioni di quel giorno nel punto di partenza.",
  'help.guide.tour-paddle-wind.result': 'Conosci il vento di quel giorno nel punto in cui metti in acqua, ora per ora.',
  'help.guide.tour-paddle-checklist.tip.1':
    'Per ogni ostacolo, scegli cosa farai: «Passare in pagaia», «Trasbordare», «Aggirare» o «Non coinvolto». «Successivo» ti porta alla voce aperta seguente.',
  'help.guide.tour-paddle-track-marks.step.1':
    'Nella scheda «Escursioni», clicca su «Aggiungi giro» nella colonna di destra, scegli «Importa GPX o KML» e seleziona il file.',
  'help.guide.tour-paddle-track-marks.tip.2':
    '«Scarta» elimina i segni che non hai salvato. La traccia registrata non viene mai ridisegnata.',
  'help.ctx.trip-tour-horse.bullet.4':
    'TREK non calcola il tempo a cavallo. Se vuoi un orario nella giornata, inseriscilo in «Dettagli» sotto «In programma».',
  'help.guide.tour-horse-plan.step.5':
    'Scegli una sezione sotto «Sezioni». Verifica il «Senso» in cui la percorri e cosa indica «Accesso a cavallo» lungo il tracciato.',
  'help.guide.tour-horse-plan.tip.5':
    "In un'uscita a cavallo non viene calcolato nessun percorso: un clic sulla linea disegnata non aggiunge punti di forma, e i punti alle estremità di una sezione restano dove li prevede il percorso.",
  'help.guide.tour-horse-gap.tip.1':
    'Una sezione manuale non è stata verificata da nessun router né da nessun percorso equestre. Guarda la mappa per capire dove passa davvero.',
  'help.guide.tour-horse-recorded.step.4':
    "L'uscita si apre nella colonna di sinistra. La scheda «Escursione registrata» mostra «Come registrato», «Nessun tempo a cavallo» e «Accesso non verificato». Punta un badge per leggerne il motivo.",
  'help.guide.dateless-trip.step.2':
    'Lascia vuoti «Data di inizio» e «Data di fine». Sotto compare il campo «Numero di giorni»: indica per quanti giorni vuoi pianificare.',
  'help.guide.trip-reminder.tip.1':
    'Solo il proprietario del viaggio (o un amministratore) vede la sezione «Promemoria». Se è in grigio, un amministratore deve prima attivare i promemoria dei viaggi in Admin, «Notifiche».',
  'help.guide.upcoming-reservations.step.2': 'Clicca su una prenotazione per aprire il viaggio a cui appartiene.',
  'help.guide.timezones-widget.tip.1':
    "L'elenco usa i nomi ufficiali dei fusi orari, come Europe/Lisbon o America/New_York: cerca quindi la città che compare nel nome.",
  'help.guide.half-company-holiday.step.2': 'Attiva «Mezza giornata» nella stessa barra degli strumenti.',
  'help.guide.edit-holiday-calendar.tip.1': "Ogni modifica viene salvata subito: non c'è un pulsante «Salva».",
  'help.guide.person-color.tip.1':
    'Lo stesso colore identifica la persona nella barra degli strumenti e nella scheda «Disponibilità».',
  'help.guide.answer-fusion-request.step.2':
    "Leggi cosa comporta l'unione: un solo calendario condiviso, voci che potete modificare l'uno per l'altro e impostazioni delle ferie in comune.",
  'help.guide.log-for-partner.step.2':
    'Controlla la barra degli strumenti: il primo pulsante ora mostra il nome e il colore di quella persona.',
  'help.guide.dissolve-fusion.step.2': 'In fondo, sotto «Sciogli unione», clicca su «Sciogli».',
  'help.guide.country-places.step.3':
    "La finestra elenca tutti i luoghi conteggiati per il paese, raggruppati per viaggio; se sono più di sei, «Cerca luoghi» in alto restringe l'elenco. Clicca su un luogo o sul titolo di un viaggio per aprire quel viaggio nel planner.",
  'help.guide.tour-activity-stats.step.5':
    "Clicca su «Mostra escursioni». Si apre «Le mie escursioni svolte» con i totali, la suddivisione «Per tipo» e tutte le escursioni del periodo con giorno, viaggio, distanza e dislivello. Anche qui le pillole nell'intestazione cambiano periodo e tipo.",
  'help.guide.move-to-list.step.3':
    'Scegli la lista di destinazione. Se le liste sono più di tre, una casella di ricerca in alto ti aiuta a trovarla.',
  'help.guide.accept-list-invite.goal':
    "Unisciti a una lista che qualcuno ha condiviso con te, oppure rifiuta l'invito.",
  'help.guide.tour-collection-add-to-trip.step.4':
    'Se vuoi, modifica «Nome nel viaggio», poi clicca su «Aggiungi a un viaggio».',
  'help.guide.tour-collection-manage.step.2':
    'Scrivi in «Cerca luoghi»: filtra per nome sia le escursioni sia i luoghi.',
  'help.guide.create-journey.tip.3':
    'Quando un viaggio è appena terminato, «Crea diario» nel banner «Viaggio appena terminato» in alto avvia un diario con quel viaggio già selezionato.',
  'help.guide.entry-draft.step.2': 'Clicca su «Salva». Ora la scheda mostra il badge «Bozza».',
  'help.guide.gallery-map.step.3':
    'Tornando a «Cronologia», la mappa a destra segue lo scorrimento: la voce visibile ha un anello nel colore del suo giorno. Clicca su un segnaposto per far scorrere la cronologia fino alla voce corrispondente.',
  'help.guide.journey-map-layers.tip.1':
    'Una linea colorata tratteggiata è il percorso GPX di un viaggio, cioè parte del programma; una linea continua è un percorso registrato in quel giorno.',
  'help.guide.journey-keep-route.tip.1':
    'Dove la registrazione si interrompe, si interrompe anche la linea: TREK disegna solo ciò che è stato registrato.',
  'help.guide.journey-day-stays.tip.1':
    'La riga compare solo a chi può modificare il diario e ha collegato un proprio Dawarich, e solo nei giorni in cui resta qualcosa da decidere.',
  'help.guide.journey-take-over-day.step.4':
    'Lascia attivo «Conserva anche il percorso del giorno» per mantenere anche il percorso, poi clicca sul pulsante «Riprendi», che indica quante bozze verranno create.',
  'help.guide.journey-auto-prepare.step.3':
    "La riga sotto indica quando sono state recuperate le tue soste l'ultima volta, oppure perché non ha funzionato. Clicca su «Recupera ora» per interrogare subito Dawarich.",
  'help.guide.photo-location.tip.1': 'I luoghi che hai impostato tu non vengono mai spostati.',
  'help.ctx.settings-plugins.bullet.1':
    '«Impostazioni plugin»: sotto trovi una scheda per ogni plugin che ha bisogno di dati da te, con i suoi campi e «Salva». Un campo segreto, una volta salvato, non viene più mostrato.',
  'help.guide.dashboard-widgets.step.3':
    "«Ripristina predefiniti», sotto le schede, riporta l'intera scheda «Aspetto» alle impostazioni originali.",
  'help.guide.web-push-device.result':
    'La scheda mostra «Attivo su questo dispositivo», e gli eventi attivati sotto Push ti arrivano anche quando TREK è chiuso.',
  'help.guide.connect-airtrail.step.1':
    'In «Integrazioni», cerca AirTrail e inserisci «URL istanza» e una «Chiave API». La chiave si crea in AirTrail, in Settings, Security.',
  'help.guide.connect-dawarich.step.1':
    'In «Integrazioni», cerca Dawarich e inserisci «Indirizzo dell’istanza» e la chiave API che trovi in Dawarich, in Account, API key.',
  'help.guide.tour-connect-wanderer.step.1':
    'In «Integrazioni», cerca wanderer e inserisci «URL istanza» e un «Token API». Il token si crea in wanderer, in Settings, Account, API tokens, e inizia con wanderer_key_.',
  'help.guide.tour-wanderer-watch.goal':
    'Fai controllare a TREK in background se i sentieri che hai importato sono cambiati.',
  'help.guide.mcp-oauth.tip.3':
    'I «Token API» funzionano ancora, ma sono contrassegnati come «Obsoleto»: passa a un client OAuth.',
  'help.guide.offline-conflicts.tip.2': 'La scelta vale solo per questo dispositivo.',
  'help.guide.default-user-settings.tip.1':
    "La scelta personale di un utente in «Impostazioni» ha sempre la precedenza; questi valori valgono per chi non ha modificato quell'impostazione.",
  'help.guide.own-routing-engine.step.1':
    "In «Impostazioni predefinite», sotto «Mappa», inserisci l'indirizzo del tuo server OSRM in «Motore di percorso proprio».",
  'help.guide.admin-passkeys.tip.2':
    'Se in seguito cambi il dominio, tutte le passkey già aggiunte smettono di funzionare.',
  'help.guide.instance-keys.tip.4':
    'La chiave Amap deve essere di tipo Web 服务 (servizio web), non una chiave JS API.',
  'help.guide.rotate-jwt-secret.step.2': "Leggi l'avviso e clicca su «Ruota ed esci».",
  'help.guide.notification-defaults.tip.2':
    'Un valore predefinito vale solo per chi non ha modificato personalmente quella cella.',
  'help.ctx.notifications.bullet.5':
    'In «Impostazioni», sotto «Notifiche», scegli quali eventi ricevere qui e quali via email, webhook, ntfy o push.',
  'help.guide.read-notifications.result':
    'Ti trovi nella schermata a cui si riferiva la notifica, e il numero sulla campanella scende di uno.',
  'help.guide.mark-notifications-read.title': 'Segnare le notifiche come lette',
  'help.guide.delete-notifications.goal': "Tieni l'elenco corto eliminando ciò che non ti serve più.",
  'help.guide.notification-settings.step.1': 'Clicca sul tuo nome in alto a destra.',
  'help.guide.public-link.step.5':
    'Finché il link esiste, puoi modificare le scelte. «Elimina link» disattiva il link.',
  'help.guide.link-journal.step.3':
    'Per ogni persona del viaggio, scegli «Nessun accesso», «Lettura» o «Modifica». «Tutti in lettura» e «Nessuno» le impostano tutte in una volta.',
  'help.guide.collapse-columns.tip.3': 'Quando il divisore è selezionato, puoi spostarlo anche con i tasti freccia.',
  'help.guide.edit-place.tip.3':
    'Se clicchi fuori dalla finestra, le modifiche non vanno perse: TREK chiede prima «Scartare le modifiche?», e «Continua a modificare» ti riporta al modulo.',
  'help.guide.dawarich-stays.goal':
    'Aggiungi, dopo averli controllati uno per uno, i luoghi in cui Dawarich ha registrato le tue soste durante il viaggio.',
  'help.guide.leave-stop-off-route.step.1':
    'Fai clic destro sulla tappa, oppure clicca sui suoi tre puntini, e scegli «Escludi dal percorso».',
  'help.guide.move-booking-day.step.3':
    "Ora la riga compare nel nuovo giorno, al suo orario. Se devi cambiare anche l'orario, apri la prenotazione.",
  'help.guide.place-image-from-file.goal':
    'Usa come immagine del luogo una foto già presente tra i suoi file, senza caricarla di nuovo.',
  'help.guide.place-image-from-file.tip.3': "L'immagine può cambiarla solo chi ha il permesso di modificare i luoghi.",
  'help.guide.place-own-hours.result':
    "La scheda mostra il tuo numero di telefono, la tua email e i tuoi orari di apertura, e l'anello intorno all'immagine è verde o rosso in base ai tuoi orari.",
  'help.guide.confirm-stay-booking.step.4':
    'Chiudi la prenotazione con la X in alto a destra. Sotto «Prenotazione», la scheda del soggiorno ora mostra «Confermata».',
  'help.guide.tour-map-lines.title': 'Trovare le escursioni sulla mappa',
  'help.guide.tour-map-lines.tip.2':
    "Nascondere un'escursione vale solo per te e viene salvato in questo browser per questo viaggio: l'escursione, i suoi giorni e il suo colore restano invariati per tutti. «Mostra tutti», sopra l'elenco «Escursioni», mostra di nuovo tutte le escursioni nascoste, e sulla mappa del telefono le escursioni sono sempre tutte visibili.",
  'help.guide.car-stops.step.4':
    'Sotto «Soste lungo il tragitto», clicca su «Aggiungi scalo» per ogni luogo in cui passi e sceglilo, aggiungendo un orario se vuoi. Una sosta senza luogo scelto viene rimossa al salvataggio.',
  'help.guide.transport-details.step.2':
    "Le pillole nell'intestazione mostrano stato, tipo, giorno e «Codice prenotazione». Clicca sulla pillola dello stato per passare da «In attesa» a «Confermata» e viceversa. La piccola icona di copia nella pillola del codice, «Copia codice prenotazione», copia il codice negli appunti.",
  'help.guide.group-sort-bookings.step.3':
    "Sotto «Ordina per», scegli «Data», «Titolo», «Tipo» o «Stato». La riga sotto inverte l'ordine: «Dalla prima all'ultima» o «Dall'ultima alla prima» per le date, «A-Z» o «Dalla Z alla A» per il resto.",
  'help.guide.booking-on-map.title': 'Trovare una prenotazione sulla mappa',
  'help.guide.export-bookings-csv.tip.1':
    'Le colonne sono «Tipo», «Titolo», «Stato», «Inizio», «Fine», «Da», «A», «Luogo», «Conferma» e «Note».',
  'help.guide.arrange-packing-list.tip.1':
    'Finché «A-Z» è attivo non puoi trascinare gli elementi, ma puoi comunque trascinare le liste intere.',
  'help.guide.count-packed-pieces.step.3':
    "Finché hai preparato solo una parte dei pezzi, il contatore è nel tuo colore d'accento e la casella di spunta ha un bordo dello stesso colore. Clicca sul meno per togliere un pezzo dal conteggio.",
  'help.guide.expense-receipts.step.5':
    "L'anteprima mostra la ricevuta, con «Apri in una nuova scheda» e «Scarica» in alto. Se ci sono più ricevute, i tasti freccia passano dall'una all'altra, ed Esc chiude l'anteprima.",
  'help.guide.files-sync-settings.step.3':
    'Clicca su «Impostazioni» sotto la barra del flusso per vedere le altre opzioni.',
  'help.guide.manage-notes.step.3':
    '«Fissa», nello stesso menu, tiene la nota in cima al pannello, con una cornice nel colore della sua categoria e una puntina accanto al titolo. «Rimuovi», nello stesso menu, riporta la nota nella sua posizione normale.',
  'help.guide.note-categories.step.1':
    "Clicca sull'ingranaggio accanto a «Nuova nota» nell'intestazione della scheda «Note». Si apre «Gestisci categorie», con una riga per ogni categoria: colore, nome, sei pallini di colore e un cestino.",
  'help.guide.note-categories.tip.2':
    'Una categoria senza note viene conservata solo nel tuo browser. Gli altri membri la vedono quando una nota viene assegnata a quella categoria.',
  'help.guide.roadtrip-reorder.goal':
    "Cambia l'ordine del tragitto, o sposta una tappa a un altro giorno, direttamente nella barra.",
  'help.guide.roadtrip-overnight.step.4':
    'Accanto, «Trova un alloggio» mostra il nome da copiare e i link ai siti di prenotazione: trivago o CHECK24 per un hotel, PiNCAMP o Pitchup per un campeggio. Controlla sul sito luogo, date e ospiti.',
  'help.guide.roadtrip-stop-fill.step.2':
    'Sotto «Riempie al», scegli un valore da 50 a 100. La riga sotto i pulsanti indica quanta strada puoi fare da qui con quel livello.',
  'help.guide.roadtrip-bookings.step.2':
    "Nella barra il tragitto è una scheda nel colore del suo tipo, con l'orario nella colonna dell'arrivo e i punti di partenza e arrivo sotto il titolo.",
  'help.guide.roadtrip-google-import.tip.1':
    'TREK calcola un proprio percorso tra le tappe, senza copiare il tracciato di Google.',
  'help.guide.roadtrip-hazards.result':
    'La mappa mostra gli avvisi in corso intorno al tuo viaggio, e il percorso non cambia.',
  'help.ctx.trip-tours.bullet.3':
    "Una riga: la barra colorata è la linea dell'escursione sulla mappa, la casella rotonda mostra il limite di percorso (da T1 a T6) o il tipo, un piccolo badge GPX o wanderer indica un'importazione, e i badge riportano giorni, tempo, distanza e salita. Una luna con un numero indica quante tappe ha un'escursione di più giorni.",
  'help.guide.tour-show-list.step.3': "Clicca su una riga: la scheda dell'escursione si apre sopra la mappa.",
  'help.guide.tour-add-to-day.goal':
    "Pianifica quando fare un'escursione, così compare nella giornata con la sua linea sulla mappa.",
  'help.guide.tour-add-to-day.tip.3':
    "Puoi aggiungere un'escursione a un giorno una sola volta. Se la trascini su un giorno che la contiene già, TREK mostra solo «Questa escursione è già in quel giorno.».",
  'help.guide.tour-day-times.step.4':
    "Se l'escursione finisce dopo l'inizio dell'impegno successivo della giornata, te lo segnala una nota sotto la riga, ad esempio «Ends at 13:30, after Lunch at Gostner Schwaige starts at 12:30». Non viene spostato nulla.",
  'help.guide.tour-remove-from-day.step.1':
    "Nella colonna dei giorni, punta la riga dell'escursione, clicca su «Altre opzioni» e scegli «Rimuovi dal giorno».",
  'help.guide.tour-filter-list.step.1':
    "Clicca sul pulsante del filtro sotto «Importa GPX o KML». Mostra lo stato per cui filtra, all'inizio «Tutti», con accanto il numero di escursioni.",
  'help.guide.tour-hide-on-map.title': "Nascondere la linea di un'escursione sulla mappa",
  'help.guide.tour-import-plan-tab.title': 'Importare una traccia dalla scheda «Pianificato»',
  'help.ctx.trip-tour-detail.title': "Dettagli dell'escursione",
  'help.guide.tour-detail-read.goal':
    "Vedi tutte le informazioni del viaggio su un'escursione: giorni, distanza e quote, profilo e origine.",
  'help.guide.tour-detail-read.tip.1':
    "Una pillola ambra «use with caution» indica che l'importazione ha quote o misure incomplete. Tienine conto quando leggi la salita e il profilo.",
  'help.guide.tour-rename-colour.step.1':
    "Apri la scheda dell'escursione e clicca sulla matita accanto al nome: il nome diventa un campo modificabile.",
  'help.guide.tour-take-along.goal':
    "Ottieni le indicazioni per arrivare alla partenza di un'escursione, apri la sua pagina sul web o scarica il percorso come file GPX.",
  'help.guide.tour-take-along.result':
    "Hai la strada per la partenza nella tua app di mappe e l'intero percorso in un file GPX.",
  'help.guide.tour-copy-keep.tip.2':
    "«Salva nella raccolta» nel menu di un'escursione nel piano del giorno apre la stessa finestra, quindi anche da lì il percorso viene salvato.",
  'help.guide.tour-packing-link.step.3': 'Clicca su «Collega».',
  'help.guide.tour-files.goal':
    "Aggiungi all'escursione una prenotazione, una mappa o una descrizione del percorso, e riaprila dalla scheda dell'escursione.",
  'help.guide.tour-activity-link.goal':
    "Collega una traccia GPX registrata a un'escursione pianificata senza modificare il programma.",
  'help.guide.tour-activity-link.tip.3':
    "«Tempo impiegato» va dal primo all'ultimo orario registrato nella traccia, pause comprese.",
  'help.guide.tour-activity-compare.tip.1':
    '«Confronta sulla mappa» è disponibile solo quando la scheda è affiancata alla mappa, non sul telefono.',
  'help.guide.tour-origin-check.tip.1':
    "Per un'escursione ripresa da un altro viaggio, sotto «Ripreso da» compaiono quel viaggio e l'escursione originale.",
  'help.ctx.trip-tour-planner.bullet.3':
    "«Escursioni di questo viaggio», la barra di destra, elenca tutte le escursioni, con il filtro e i «Totali del viaggio» sopra l'elenco. Quando un'escursione è aperta, «Riepilogo dell'escursione» in alto ne mostra distanza, dislivello, tempo e profilo altimetrico. Il più in alto, «Aggiungi giro», serve a pianificare, importare o riprendere un'escursione.",
  'help.guide.tour-open-workspace.step.3':
    "La barra di destra, «Escursioni di questo viaggio», elenca tutte le escursioni del viaggio, con il filtro e i «Totali del viaggio» sopra l'elenco.",
  'help.guide.tour-open-workspace.result':
    "La scheda «Escursioni»: l'editor a sinistra, le escursioni del viaggio a destra e la mappa al centro.",
  'help.guide.tour-draw-route.step.6':
    'Sotto «Waypoint» ogni punto ha una riga con il suo numero, che prende il nome del luogo appena questo viene caricato. Mentre TREK elabora, un piccolo pallino accanto a «Nuova escursione» ne mostra lo stato.',
  'help.guide.tour-type-profile.step.1':
    "Clicca su «Tipo di tour» sotto «Nome dell'escursione». Mostra il tipo attuale con una riga che spiega come viene pianificato.",
  'help.guide.tour-edit-points.goal':
    "Cambia il tracciato dell'escursione spostando i punti sulla mappa o nell'elenco.",
  'help.guide.tour-edit-points.tip.2':
    'Finché il nome del luogo non è caricato, la riga mostra le coordinate. «Annulla» e «Ripeti» non hanno scorciatoie da tastiera.',
  'help.guide.tour-shaping-points.tip.1': "La partenza e l'arrivo sono sempre tappe.",
  'help.guide.tour-loop-reverse.step.3':
    "Clicca su «Inverti direzione», lì accanto, per percorrere l'intera escursione in senso opposto.",
  'help.guide.tour-leg-by-hand.step.2':
    "Il tratto diventa una linea retta tratteggiata, e sotto la riga l'elenco mostra «Disegnato a mano, non calcolato», con la lunghezza.",
  'help.guide.tour-trip-places.step.1':
    'Clicca su «Luoghi del viaggio» accanto ad «Aggiungi punto», sotto «Waypoint». Sotto compaiono i luoghi del viaggio.',
  'help.guide.tour-details-times.title': "Dare un nome all'escursione e pianificarne i tempi",
  'help.guide.tour-details-times.tip.3':
    'Clicca sulla freccia accanto a «Dettagli» per chiudere la sezione. Si riapre da sola quando uno dei campi contiene un valore che «Salva» non accetta.',
  'help.guide.tour-save.tip.1':
    "«Scarta», accanto a «Salva», elimina le modifiche non salvate dopo una conferma. Un'escursione già salvata non cambia.",
  'help.guide.tour-edit-saved.step.3':
    "Clicca su «Salva». Compare «Escursione salvata», e l'escursione mantiene giorni, file e note.",
  'help.guide.tour-summary-profile.step.1':
    "«Riepilogo dell'escursione», in cima a «Escursioni di questo viaggio», indica «Distanza», «Dislivello positivo» e «Dislivello negativo» dell'escursione aperta nell'editor, il tempo stimato, le pause e il totale pianificato.",
  'help.guide.tour-list-manage.title': 'Gestire le escursioni del viaggio',
  'help.guide.tour-list-manage.tip.2':
    "Nel menu dei giorni, un giorno che contiene già l'escursione è in grigio. Per un'escursione di più giorni, TREK chiede se le tappe devono iniziare in quel giorno o se l'intera escursione va in quel giorno.",
  'help.guide.tour-delete.tip.2':
    'Per toglierla soltanto da un giorno, usa invece «Rimuovi dal giorno» nel menu del giorno.',
  'help.guide.tour-saved-elsewhere.step.4':
    "Scegli «Salva come nuovo tour» per tenerle entrambe, «Carica la più recente» per caricare l'altra versione, oppure «Sovrascrivi» per sostituire l'altra versione con la tua.",
  'help.ctx.trip-tour-import.bullet.3':
    "Un'importazione si apre come «Escursione GPX» o «Escursione wanderer»: la sua linea, il «Riepilogo dell'escursione» e il profilo altimetrico, esattamente come sono stati importati. Nell'elenco la sua riga ha il badge «Importazione GPX».",
  'help.guide.tour-import-gpx.step.4':
    "Sotto «Importa come», controlla cosa sono le tracce. «Escursione a piedi» è preimpostato. «Escursione in bici» e «Corsa» chiedono il profilo, «Uscita in pagaia» l'imbarcazione e il tipo di acqua, «Sci e inverno» la disciplina.",
  'help.guide.tour-view-import.title': 'Visualizzare una traccia importata',
  'help.guide.tour-view-import.result':
    'Vedi la traccia registrata esattamente come è stata importata, senza ricalcoli.',
  'help.guide.tour-plan-from-import.tip.2':
    'Se la scheda segnala che il suggerimento si discosta dalla traccia per tratti lunghi, controlla quelle parti sulla mappa prima di usarlo per pianificare.',
  'help.guide.tour-restore-recorded.step.3':
    'Conferma con «Ripristina la traccia registrata». I waypoint e la linea calcolata vengono rimossi, mentre giorni e note restano.',
  'help.guide.tour-take-over.step.3':
    "Trova l'escursione: scrivi in «Cerca per nome», oppure restringi l'elenco con i filtri «Viaggio» e «Tipo».",
  'help.guide.tour-import-wanderer.title': 'Importare un sentiero da wanderer',
  'help.guide.tour-import-wanderer.tip.3':
    "Un sentiero già presente nel viaggio è contrassegnato con «In questo viaggio» e offre «Apri l'escursione». Un sentiero modificato dopo l'importazione offre «Importa come nuova versione» accanto a quella vecchia.",
  'help.ctx.trip-tour-map.bullet.4':
    "«Lungo il percorso», una scheda nel pannello di sinistra, cerca punti panoramici, acqua, rifugi, posti dove mangiare e altro vicino al percorso, ed elenca i risultati. Puoi aggiungere un luogo dell'elenco all'escursione come tappa.",
  'help.guide.tour-map-layers.tip.1':
    "La mappa che scegli resta attiva per tutte le escursioni che apri, finché non ricarichi la pagina. Un'escursione il cui tipo non la prevede si apre su «Mappa», e la mappa della scheda «Pianificato» e l'impostazione in «Impostazioni» non cambiano.",
  'help.guide.tour-along-search.step.4':
    "Clicca su «Cerca lungo il percorso». TREK si limita a cercare: l'escursione non cambia.",
  'help.guide.tour-along-add-stop.step.1':
    "Clicca su un luogo nell'elenco «Lungo il percorso», oppure sul suo segnaposto sulla mappa. La sua scheda si apre sopra la mappa: cos'è, quanto dista dal percorso e a che punto dell'escursione si trova.",
  'help.guide.tour-3d-terrain.title': "Vedere un'escursione in 3D",
  'help.guide.tour-3d-terrain.tip.1':
    "«Panoramica», nella stessa riga, mostra di nuovo l'intero percorso dopo che hai spostato la vista.",
  'help.guide.tour-3d-flyover.step.4': "Clicca su «Panoramica» per vedere di nuovo l'intera escursione.",
  'help.guide.tour-map-overlays.step.2':
    "Clicca su «Legenda delle piste», il quadratino di pallini colorati accanto all'interruttore.",
  'help.ctx.trip-tour-stages.summary':
    "Un'escursione di più giorni è un unico percorso diviso in tappe, una per ogni giorno di viaggio. Qui stabilisci dove finisce ogni giornata, vedi le misure di ogni tappa e assegni le tappe ai giorni del viaggio.",
  'help.guide.tour-multi-day.step.1':
    "In «Escursioni di questo viaggio», clicca sull'escursione per aprirla nell'editor.",
  'help.guide.tour-multi-day.tip.3':
    'Il tempo di una tappa non comprende le pause. Un tempo nel colore di avviso, «Più di un giorno in movimento», supera un giorno.',
  'help.guide.tour-stages-on-days.step.4':
    'Clicca sul pulsante con la luna e il numero di tappe, «Mostra tappe», per visualizzarle.',
  'help.ctx.trip-tour-hike.title': 'Escursioni a piedi e corse',
  'help.guide.tour-hike-plan.title': "Pianificare un'escursione a piedi entro una difficoltà scelta",
  'help.guide.tour-hike-plan.result':
    "L'escursione compare in «Escursioni di questo viaggio» con distanza, dislivello e tempo di cammino, pronta da assegnare a un giorno.",
  'help.guide.tour-hike-trail-details.step.2':
    "Scegli cosa mostrare: SAC per la difficoltà escursionistica, «Fondo» o «Tipo di via». Il percorso sulla mappa usa gli stessi colori dell'elenco.",
  'help.guide.tour-hike-round.title': 'Trovare un anello di una certa lunghezza',
  'help.guide.tour-hike-round.tip.1':
    "Gli anelli rispettano la «Difficoltà massima del sentiero» dell'escursione; la pillola T nella scheda indica quale.",
  'help.guide.tour-hike-compare-ways.step.4':
    'Clicca su «Usa questo percorso». TREK verifica con il router che il percorso lo segua davvero.',
  'help.guide.tour-ferrata-add.step.2':
    'Clicca su una via ferrata sulla mappa, sulla sua linea tratteggiata o sul suo simbolo. La scheda mostra nome, difficoltà e lunghezza.',
  'help.guide.tour-ferrata-add.tip.4':
    '«Vedi su OpenStreetMap», nella scheda, apre i dati della via ferrata. Il badge diventa ambra quando non si riesce a caricare nulla, con il motivo nel suggerimento.',
  'help.guide.tour-run-plan.result':
    'La corsa compare in «Escursioni di questo viaggio» con il suo «Tempo di corsa (previsto)», e profilo e ritmo vengono salvati con lei.',
  'help.guide.tour-run-ways.step.2':
    'In cima alla scheda ora vedi quanta parte della corsa è su fondo non asfaltato e il sentiero classificato più difficile del percorso.',
  'help.ctx.trip-tour-walk.bullet.2':
    '«Waypoint» elenca le tappe in ordine. Un anello intorno al numero di una tappa la contrassegna come «Da non perdere» (pieno) o «Facoltativo» (tratteggiato), un piccolo scudo come «Protetta», e una pillola sotto il nome indica quanto ti fermi.',
  'help.guide.tour-walk-plan.step.3':
    'Punta una tappa in «Waypoint», clicca su «Altre azioni» accanto e scegli «Modifica tappa».',
  'help.guide.tour-walk-sights.title': 'Aggiungere attrazioni lungo una passeggiata urbana',
  'help.guide.tour-walk-sights.tip.2':
    'Dopo che modifichi il percorso, il pulsante mostra «Cerca di nuovo», perché i luoghi trovati si riferiscono al percorso precedente.',
  'help.guide.tour-walk-day-times.step.4':
    "Sotto ogni tappa vedi quando arrivi e quanto ti fermi. Compare un avviso se un luogo è chiuso a quell'ora o chiude durante la sosta.",
  'help.guide.tour-walk-google-import.step.1':
    'In «Escursioni di questo viaggio», clicca su «Aggiungi giro» (il + in alto) e scegli «Importa passeggiata da Google Maps».',
  'help.guide.tour-walk-check-off.title': 'Spuntare le tappe di una passeggiata durante la giornata',
  'help.guide.tour-walk-check-off.tip.3':
    'Se assegni una passeggiata a un giorno mentre sei offline, puoi spuntarla dopo la sincronizzazione.',
  'help.guide.tour-bike-profile.title': 'Pianificare un giro in bici adatto al tuo stile',
  'help.guide.tour-bike-profile.result':
    "L'escursione in bici è salvata e compare in «Escursioni di questo viaggio», calcolata per il suo profilo, con il tempo in sella nel «Riepilogo dell'escursione».",
  'help.guide.tour-bike-surfaces.step.1':
    "In «Escursioni di questo viaggio», a destra, clicca su un'escursione in bici per aprirla. Una volta calcolato il percorso, sotto «Waypoint» compare la scheda «Fondo e percorsi».",
  'help.guide.tour-bike-surfaces.tip.4':
    'Clicca sul titolo della scheda per chiuderla. In questo browser resta chiusa anche dopo aver ricaricato la pagina.',
  'help.guide.tour-bike-mtb-grades.tip.2':
    'Dove i mappatori hanno classificato le salite, sotto segue «Difficoltà in salita (mtb:scale:uphill)» con righe proprie.',
  'help.ctx.trip-tour-ski.bullet.4':
    "La scheda «Percorso sulle piste» sotto i waypoint suddivide la giornata in «Sciando», «In impianto», «Attesa» e «A piedi», con la lunghezza delle piste, il dislivello che scendi sciando e le risalite in impianto. «Tempo di sci» nel «Riepilogo dell'escursione» a destra fa il totale quando tutti i tratti sono pianificati.",
  'help.guide.tour-ski-plan.step.5':
    'Sotto ogni punto il relativo tratto è elencato a chip: ogni pista, impianto e tratto a piedi con il nome o il tipo, le piste con un pallino nel colore della loro difficoltà, e i minuti di ciascuno.',
  'help.guide.tour-ski-options.goal':
    'Imposta le piste più difficili, cosa preferire, il tuo ritmo e quali impianti usare, così i tratti sono adatti a te.',
  'help.guide.tour-ski-options.tip.3':
    '«Evita collegamenti ipotizzati» tiene il percorso lontano dai collegamenti che i dati della mappa si limitano a ipotizzare, come un tratto non mappato tra due piste.',
  'help.guide.tour-ski-fix-leg.tip.2':
    'Mentre i dati delle piste di una zona sono ancora in download, il planner attende e riprova automaticamente.',
  'help.guide.tour-ski-summary.step.3':
    "Nel «Riepilogo dell'escursione» a destra, «Tempo di sci» fa il totale. Il pallino informativo spiega come viene calcolato.",
  'help.guide.tour-ski-pistes-layer.step.1':
    "Quando è aperta un'escursione «Sci e inverno», la mappa mostra automaticamente le piste. L'interruttore con la montagna innevata, nella riga in basso a sinistra della mappa, le nasconde e le mostra; il suggerimento indica «Piste, anelli di fondo e impianti».",
  'help.guide.tour-ski-import.goal':
    'Importa una traccia registrata di sci, sci di fondo o ciaspole e assegnale la disciplina giusta.',
  'help.guide.tour-ski-import.tip.2':
    "Per modificarla come un'escursione pianificata, usa «Pianifica una versione modificabile» nella scheda «Versione modificabile». I punti vengono uniti con linee rette.",
  'help.ctx.trip-tour-paddle.bullet.4':
    "«Stima dei tempi» somma il tempo in acqua, il trasporto dell'imbarcazione, lo sbarco e il reimbarco, le chiuse e le pause, in base a velocità e minuti che puoi modificare.",
  'help.guide.tour-paddle-setup.step.4':
    "Sotto «Acqua», scegli «Fiume» o «Lago». Non puoi salvare l'escursione finché non hai scelto sia l'imbarcazione sia il tipo di acqua.",
  'help.guide.tour-paddle-setup.result':
    'Una nuova uscita in pagaia con imbarcazione, tipo di acqua e velocità, pronta per il primo punto sulla mappa.',
  'help.guide.tour-paddle-water-route.tip.1':
    "Dove mancano i dati sull'acqua, TREK li scarica automaticamente per la regione oppure li richiede a un amministratore, a seconda di come è configurata l'istanza. Il tratto mostra allora «Loading the water data» e viene pianificato automaticamente appena i dati sono disponibili, di solito in un tempo da uno a tre minuti.",
  'help.guide.tour-paddle-portage.step.2':
    'Scegli «Trasporta l’imbarcazione da qui». Il tratto fino al punto successivo diventa un trasbordo, tracciato sulla terraferma.',
  'help.guide.tour-paddle-lock.title': 'Aggiungere una chiusa e il relativo tempo di attesa',
  'help.guide.tour-paddle-lock.tip.3': '«Rimuovi la chiusa» si trova in fondo alla scheda aperta e in «Altre azioni».',
  'help.guide.tour-paddle-time.step.5':
    'Finché tutte le chiuse non hanno i loro tempi, la stima mostra «Incompleta» e una nota sotto le righe elenca cosa manca.',
  'help.guide.tour-paddle-wind.step.2':
    'Controlla la direzione del vento, il valore «Medio» e le «Raffiche». «Medio» è la media oraria più alta della giornata, «Raffiche» la raffica più forte.',
  'help.guide.tour-paddle-checklist.title': 'Controllare la lista degli ostacoli',
  'help.guide.tour-paddle-checklist.tip.2':
    '«Trasbordare» non pianifica automaticamente un trasbordo. Clicca su «Pianifica il trasbordo» per impostarlo sulla mappa.',
  'help.guide.tour-paddle-track-marks.step.2':
    "Nell'«Anteprima dell'importazione», imposta «Importa come» su «Uscita in pagaia», poi scegli «Barca» e «Acqua». Non puoi proseguire con l'importazione finché non li hai scelti entrambi.",
  'help.guide.tour-paddle-track-marks.tip.3':
    'Su una traccia registrata, la riga «Acqua» della «Stima dei tempi» ha una velocità propria: cliccala e inserisci la velocità a cui hai pagaiato.',
  'help.ctx.trip-tour-horse.bullet.5':
    "Un'uscita a cavallo importata da un file GPX resta esattamente come è stata registrata, e la sua scheda «Escursione registrata» indica cosa l'importazione non è riuscita a calcolare.",
  'help.guide.tour-horse-plan.step.6':
    "Clicca su «Prendi il tratto». Il tratto viene aggiunto all'uscita come badge con il nome del percorso nella scheda «Waypoint». Aggiungi altri tratti allo stesso modo.",
  'help.guide.tour-horse-gap.title': 'Colmare un vuoto tra percorsi equestri',
  'help.guide.tour-horse-gap.tip.2':
    "Anche i punti che clicchi sulla mappa vengono aggiunti all'uscita allo stesso modo, come tratti rettilinei non verificati.",
  'help.guide.tour-horse-recorded.result':
    "L'uscita è nel viaggio esattamente come l'hai percorsa, con distanza e quote prese dal file.",
  'help.guide.dateless-trip.step.3': 'Clicca su «Crea Nuovo Viaggio».',
  'help.guide.trip-reminder.tip.2':
    'Ogni nuovo viaggio ha già un promemoria 3 giorni prima della partenza. I canali su cui riceverlo si scelgono in «Impostazioni», «Notifiche».',
  'help.guide.upcoming-reservations.result':
    'Il viaggio si apre. Quando torni alla dashboard, il widget continua a mostrare le prossime prenotazioni.',
  'help.guide.entitlement.tip.2':
    'In un piano unito ognuno ha la propria riga, e puoi impostare anche la disponibilità degli altri.',
  'help.guide.half-company-holiday.step.3': 'Clicca sul giorno: metà della cella diventa ambra.',
  'help.guide.school-holidays.tip.2':
    'Passa con il mouse su un giorno di vacanza per vederne il nome sotto «Vacanze scolastiche».',
  'help.guide.answer-fusion-request.step.3':
    'Clicca su «Accetta e unisci» per unire i piani, oppure su «Rifiuta» per mantenere il tuo piano separato.',
  'help.guide.log-for-partner.step.3':
    'Clicca sui giorni da registrare, poi clicca di nuovo sul tuo nome in «Persone».',
  'help.guide.dissolve-fusion.result':
    'Ognuno torna al proprio piano con le proprie voci, e in «Persone» ci sei solo tu.',
  'help.guide.country-places.result': 'Il planner si apre sul viaggio a cui appartiene il luogo.',
  'help.guide.tour-activity-stats.step.6':
    "Per un'escursione che non hai fatto, clicca su «Escludi», il pulsante rotondo alla fine della riga. L'escursione resta nell'elenco, attenuata e contrassegnata come «Esclusa». Lo stesso pulsante, che ora mostra «Conta di nuovo», la rimette nel conteggio.",
  'help.guide.move-to-list.tip.1':
    'Le etichette appartengono a una sola lista, quindi un luogo spostato o duplicato non ha etichette nella nuova lista.',
  'help.guide.accept-list-invite.step.1':
    "Trova l'invito sotto «Inviti» nella barra delle liste. Se sei arrivato dalla notifica dell'invito, la scheda è in cima alla pagina e indica la lista e chi ti ha invitato.",
  'help.guide.tour-collection-add-to-trip.tip.1':
    "La nuova escursione non è ancora assegnata a nessun giorno e non aggiunge luoghi. Né la lista né l'escursione originale cambiano.",
  'help.guide.tour-collection-manage.step.3':
    "Clicca sul cestino alla fine della riga dell'escursione e conferma con «Togli dalla raccolta».",
  'help.ctx.journey-detail.bullet.7':
    "Con Dawarich collegato, l'intestazione di un giorno mostra anche «Riprendi la registrazione» (o la distanza del percorso salvato per quel giorno) e «Riprendi giornata». Nei giorni con soste in attesa, le soste sono raggruppate in un'unica riga alla fine del giorno.",
  'help.guide.entry-draft.tip.1':
    'I contributori vedono comunque una bozza. Solo il link pubblico la nasconde finché non disattivi «Bozza».',
  'help.guide.journey-map-layers.tip.2':
    'Un interruttore attenuato non ha ancora niente da mostrare, e il suggerimento ne spiega il motivo. La tua scelta viene ricordata per ogni diario in questo browser.',
  'help.guide.journey-keep-route.tip.2':
    "In seguito, clicca sulla distanza nell'intestazione del giorno per confrontare di nuovo con Dawarich: «Sostituisci» prende la nuova versione, «Rimuovi percorso» toglie dal diario il percorso del giorno.",
  'help.guide.journey-day-stays.tip.2':
    'Per una giornata piena, «Riprendi giornata» alla fine della riga gestisce tutte le soste in una volta.',
  'help.guide.journey-take-over-day.tip.1':
    'Non viene salvato nulla prima che tu clicchi su quel pulsante, e niente viene salvato due volte: una sosta già presente nel diario è contrassegnata e non si può scegliere di nuovo.',
  'help.guide.journey-auto-prepare.tip.1':
    'Vengono preparati solo i giorni dei viaggi collegati che hanno delle date, e nel diario non viene aggiunto nulla in automatico.',
  'help.guide.photo-location.result':
    'Una voce senza luogo prende la posizione in cui è stata scattata la sua prima foto con GPS, e compare sulla mappa.',
  'help.guide.contributors.tip.2':
    '«Tramite viaggi» elenca le persone che hanno accesso tramite un viaggio collegato. Il loro accesso si modifica nelle impostazioni di quel viaggio, non qui.',
  'help.ctx.settings-plugins.bullet.2':
    'Un plugin può aggiungere alla sua scheda delle «Azioni», che vengono eseguite dopo la tua conferma, e «Connetti» o «Disconnetti» quando accede a un altro servizio per conto tuo.',
  'help.guide.web-push-device.tip.1':
    "Il push funziona per singolo browser: ripeti l'operazione su ogni telefono e computer su cui vuoi ricevere le notifiche. «Disattiva su questo dispositivo» lo disattiva solo su quel dispositivo.",
  'help.guide.connect-airtrail.step.2':
    "«Consenti certificati autofirmati» serve solo per un'istanza affidabile nella tua rete. «Scrivi le modifiche su AirTrail» è disattivato per impostazione predefinita, quindi TREK si limita a leggere; attivalo per inviare le tue modifiche ad AirTrail.",
  'help.guide.connect-dawarich.step.2':
    "«Cerca automaticamente nuove soste» permette a TREK di controllare da solo. Se è disattivato, TREK legge Dawarich solo quando glielo chiedi. «Consenti certificato autofirmato» serve solo per un'istanza di cui il tuo server non si fida.",
  'help.guide.tour-connect-wanderer.step.2':
    "Attiva «Consenti un certificato autofirmato» solo per un'istanza nella tua rete.",
  'help.guide.tour-wanderer-watch.step.1':
    'Nella scheda wanderer, attiva «Controlla le modifiche ai miei sentieri». Prima devi aver salvato una connessione.',
  'help.guide.plugin-settings.title': 'Configurare un plugin per te',
  'help.guide.default-user-settings.tip.2':
    '«Valuta di visualizzazione» converte gli importi solo per la visualizzazione. Gli importi inseriti in «Costi» non cambiano.',
  'help.guide.own-routing-engine.step.2':
    "Per percorsi che evitano pedaggi, autostrade o traghetti, inserisci l'indirizzo del tuo Valhalla in «Istanza Valhalla propria». Ogni campo si salva quando lo lasci; poi riavvia il server TREK e ricarica la pagina.",
  'help.guide.admin-passkeys.tip.3':
    'Se un utente ha perso il dispositivo con le sue passkey, rimuovile con «Reimposta passkey» in «Modifica Utente».',
  'help.guide.rotate-jwt-secret.result':
    'È attivo un nuovo secret di firma, e tutti gli utenti, tu compreso, devono accedere di nuovo.',
  'help.guide.read-notifications.title': 'Leggere le notifiche',
  'help.guide.filter-notifications.title': 'Vedere tutte le notifiche o solo quelle non lette',
  'help.guide.mark-notifications-read.goal':
    "Togli l'evidenziazione e il numero sulla campanella dopo aver visto le novità.",
  'help.guide.delete-notifications.step.1':
    "Clicca su «Elimina», il cestino accanto all'ora di una notifica, per eliminare solo quella.",
  'help.guide.notification-settings.step.2': 'Clicca su «Impostazioni» nel menu.',
  'help.guide.public-link.tip.3': "Passa con il mouse su un'opzione per vedere cosa nasconde.",
  'help.guide.link-journal.step.4':
    'Leggi la nota gialla: indica chi riceverà il diario per la prima volta. Poi clicca su «Collega diario».',
  'help.guide.dawarich-stays.step.1':
    "Se Dawarich è collegato in «Impostazioni», «Integrazioni», sopra l'elenco dei luoghi compare «Da Dawarich». L'intestazione indica quando TREK ha controllato l'ultima volta e quante soste sono in attesa. Cliccala per aprire l'elenco.",
  'help.guide.leave-stop-off-route.step.2':
    'Accanto al nome compare il badge «Fuori percorso». La tappa resta nella giornata e sulla mappa, ma il percorso del giorno e i tempi dei tratti la saltano.',
  'help.guide.move-booking-day.result':
    'Nel programma la prenotazione appartiene al nuovo giorno, con lo stesso orario.',
  'help.guide.clear-day.tip.2': 'Questa voce del menu compare solo nei giorni che contengono dei luoghi.',
  'help.guide.place-image-from-file.step.1':
    'Apri un luogo che ha una foto tra i suoi «File». La sezione «File», verso il fondo della scheda, indica quanti file ha il luogo.',
  'help.guide.place-own-hours.title': 'Correggere orari di apertura, telefono o email di un luogo',
  'help.guide.place-own-hours.tip.1':
    'Gli orari che inserisci sostituiscono quelli trovati da TREK, così un bar con orari stagionali mostra le informazioni che conosci tu.',
  'help.guide.day-panel.tip.3':
    "Pianifichi in base al calendario? Attiva «Data prima nei titoli dei giorni» in «Impostazioni», sotto «Visualizzazione»: l'intestazione mostrerà prima la data, con sotto «Giorno 1» o il nome del giorno.",
  'help.guide.confirm-stay-booking.result':
    "La prenotazione dell'hotel è confermata, sia nella scheda del soggiorno sia nella scheda «Prenotazioni».",
  'help.guide.tour-map-lines.goal':
    'Distingui sulla mappa le escursioni del viaggio, aprine una dalla sua linea e nascondi quelle che al momento non ti servono.',
  'help.guide.tour-map-lines.tip.3':
    "«Escludi dal percorso», nel menu della riga dell'escursione nel piano del giorno, fa sì che il percorso della giornata non passi più dalla partenza e dall'arrivo dell'escursione. «Riaggiungi al percorso» li ricollega.",
  'help.guide.car-stops.step.5':
    "L'ordine delle soste determina il percorso. «Sposta su» e «Sposta giù», a sinistra di una sosta, lo modificano, e «Rimuovi sosta», la croce a destra, la elimina.",
  'help.guide.transport-details.step.3':
    'Le caselle sotto mostrano partenza e arrivo con le rispettive stazioni o aeroporti, poi il binario e il posto, se indicati. Un tragitto con fermate intermedie le elenca sotto «Percorso», e uno prenotato tratta per tratta riporta il codice di ogni tratta sotto «Codici per tratta». Seguono «Viaggiatori», «Note», «Costi» e «File»; «Mostra nei file» apre il biglietto nella scheda «File».',
  'help.guide.export-transports-csv.title': 'Esportare i trasporti in un foglio di calcolo',
  'help.guide.group-sort-bookings.step.4':
    'Clicca sul titolo di una sezione per comprimerla. Il numero accanto indica quante prenotazioni contiene, e un secondo clic la riapre.',
  'help.guide.booking-on-map.goal': 'Passa da una prenotazione al suo luogo nel programma e sulla mappa.',
  'help.guide.export-bookings-csv.tip.2':
    'Le colonne sono separate da punto e virgola, ed Excel apre il file con gli accenti corretti.',
  'help.guide.arrange-packing-list.tip.2':
    "TREK ricorda «A-Z» in questo browser, quindi anche la prossima volta la lista si apre in ordine alfabetico. Cambia solo ciò che vedi tu, mai l'ordine che vedono gli altri.",
  'help.guide.count-packed-pieces.step.4':
    "Quando il contatore raggiunge la quantità, l'elemento viene spuntato automaticamente e risulta in valigia.",
  'help.guide.expense-receipts.result':
    'La ricevuta è salvata con la spesa: il chip nella sua riga la apre, e il file si trova anche nei «File» del viaggio.',
  'help.guide.files-sync-settings.step.4':
    "Sotto «Quando un documento viene eliminato», scegli cosa succede alla copia dall'altra parte. «Mantieni entrambe le copie» lascia dov'è la copia nell'archivio. «Sposta nel cestino» la manda nel cestino dell'archivio quando il documento viene eliminato in TREK.",
  'help.ctx.trip-collab.bullet.7':
    'Qui tutto richiede una connessione. Offline, messaggi, note, link, sondaggi e voti non vengono salvati, e TREK mostra «This needs a connection. Try again once TREK is back online.». I membri che non possono modificare «Collaborazione» vedono tutto, ma non hanno «Nuova nota», «Aggiungi link» e «Nuovo sondaggio», e la casella dei messaggi è in grigio.',
  'help.guide.manage-notes.step.4':
    '«Modifica» apre la finestra della nota con tutti i campi compilati. Cambia ciò che ti serve, qui una riga in più sotto «Contenuto», e clicca su «Salva».',
  'help.guide.note-categories.step.2':
    'Scrivi un nome in «Nuova categoria...» in fondo e premi Invio o clicca sul più accanto. La nuova categoria riceve il colore successivo e una riga propria.',
  'help.guide.note-categories.tip.3':
    "Su una scheda, la categoria è solo il pallino colorato nell'intestazione. Passaci sopra con il mouse per vederne il nome.",
  'help.guide.roadtrip-reorder.step.1':
    "Trascina una tappa per la sua riga e rilasciala su un'altra tappa dello stesso giorno: prende il posto di quella tappa e il percorso della giornata viene ricalcolato nel nuovo ordine.",
  'help.guide.roadtrip-overnight.step.5':
    'Clicca su «Aggiungi». La notte viene prenotata da questo giorno al successivo, e il luogo viene aggiunto al tragitto come pernottamento di quel giorno.',
  'help.guide.roadtrip-stop-fill.step.3':
    'Per tornare alla tua impostazione per questa sosta, riapri il badge e clicca su «Usa il mio valore predefinito».',
  'help.guide.roadtrip-bookings.step.3':
    "La pillola «Check-in» o «Imbarco» indica entro quando devi arrivare al terminal: la partenza viene anticipata di quel tempo rispetto all'orario.",
  'help.guide.roadtrip-google-import.title': 'Importare un percorso da Google Maps',
  'help.guide.roadtrip-google-import.tip.2':
    'Il link deve contenere almeno due tappe che TREK riesce a localizzare, e al massimo 30.',
  'help.guide.roadtrip-hazards.tip.1':
    'Gli avvisi non sono chiusure stradali: il percorso non cambia mai a causa loro, e si tratta di segnalazioni in corso, non di previsioni per le tue date.',
  'help.ctx.trip-tours.bullet.4':
    "Passa con il mouse su una riga per vedere l'occhio («Nascondi sulla mappa») e il + rotondo («Aggiungi al giorno»). Trascina una riga su un giorno nella colonna di sinistra per pianificarla lì, oppure cliccala per aprire la scheda dell'escursione sopra la mappa.",
  'help.guide.tour-show-list.step.4':
    "La scheda mostra le misure dell'escursione e, sotto «Giorni del viaggio», i giorni in cui è pianificata. Per modificare il percorso, apri la scheda «Escursioni» e clicca sull'escursione sotto «Escursioni di questo viaggio».",
  'help.guide.tour-add-to-day.step.1':
    "Passa con il mouse sull'escursione nell'elenco e clicca sul + rotondo a destra della riga («Aggiungi al giorno»).",
  'help.guide.tour-add-to-day.tip.4':
    "Con un giorno aperto (clicca sulla sua intestazione), anche la scheda dell'escursione offre «Aggiungi al giorno» per quel giorno. La freccia di annullamento sopra i giorni annulla l'assegnazione.",
  'help.guide.tour-day-times.tip.1': 'Un orario di fine inserito da te sostituisce quello calcolato.',
  'help.guide.tour-remove-from-day.step.2':
    "L'escursione resta nell'elenco a destra. Il badge del giorno sparisce, e il filtro la conta di nuovo tra i «Non pianificati».",
  'help.guide.tour-filter-list.step.2':
    'Sotto «Stato», scegli «Non pianificati» per le escursioni non ancora assegnate a un giorno, oppure «Pianificato» per quelle già assegnate. Ogni riga indica quante escursioni corrispondono.',
  'help.guide.tour-hide-on-map.goal':
    'Nascondi dalla mappa le escursioni che al momento non ti servono, senza modificarle per nessuno.',
  'help.guide.tour-import-plan-tab.goal': 'Importa una traccia GPX o KML come escursione mentre pianifichi i giorni.',
  'help.ctx.trip-tour-detail.summary':
    "La scheda che si apre sopra la mappa quando scegli un'escursione nella scheda «Pianificato»: giorni, misure e profilo, origine, e i pulsanti per inviarla al telefono, copiarla, salvarla in una raccolta o collegarla alla lista valigia.",
  'help.guide.tour-detail-read.step.1':
    "In cima alla colonna di destra, passa da «Luoghi» a «Escursioni», poi clicca su un'escursione: la sua scheda si apre sopra la mappa. Anche la sua riga all'interno di un giorno, o la sua linea sulla mappa, apre la stessa scheda.",
  'help.guide.tour-detail-read.tip.2':
    "Un'uscita in pagaia non mostra quote né profilo: i suoi punti si trovano sulle rive, quindi le quote sarebbero sbagliate.",
  'help.guide.tour-rename-colour.step.2':
    'Scrivi il nuovo nome e clicca sul pulsante rotondo con la spunta, oppure premi Invio. Con Esc mantieni il nome precedente.',
  'help.guide.tour-take-along.step.1':
    "Apri la scheda dell'escursione. «Navigazione», in fondo alla scheda, apre la partenza dell'escursione in un'app di mappe e, se ce ne sono diverse, prima elenca le app. Ti porta alla partenza, non lungo il percorso.",
  'help.guide.tour-copy-keep.title': "Copiare un'escursione o salvarla in una raccolta",
  'help.guide.tour-copy-keep.tip.3':
    "Nella scheda «Escursioni», il segnalibro in cima alla colonna di sinistra fa lo stesso per l'escursione aperta. Se ci sono modifiche non salvate, ti chiede prima di salvare l'escursione.",
  'help.guide.tour-packing-link.step.4':
    'Ora la scheda mostra la lista, quanti elementi sono in valigia, una barra e i primi elementi. Quelli già in valigia sono barrati.',
  'help.guide.tour-files.step.1':
    "Apri la scheda dell'escursione e scorri fino a «File», in fondo. Clicca su «Carica» nell'intestazione della sezione e scegli uno o più file.",
  'help.guide.tour-activity-link.step.1':
    "Apri la scheda dell'escursione pianificata e scorri fino a «Traccia effettiva». Clicca su «Aggiungi traccia effettiva».",
  'help.guide.tour-activity-link.result':
    "La traccia è collegata all'escursione, e la scheda mostra affiancati il programma e ciò che hai fatto davvero.",
  'help.guide.tour-activity-compare.tip.2':
    "Nell'Atlante, le escursioni svolte contano la traccia collegata al posto dei valori pianificati.",
  'help.guide.tour-origin-check.tip.2':
    "Un'escursione da wanderer ha accanto alla fonte una freccia, «Apri in wanderer», e «Controlla la fonte» nell'intestazione della sezione. Il controllo chiede a wanderer se il sentiero è cambiato dopo l'importazione. «Importa come nuova istantanea» importa poi la nuova versione come escursione separata. Questa escursione mantiene i suoi giorni e le sue note.",
  'help.ctx.trip-tour-planner.bullet.4':
    'Quando «Aggiungi punto» è attivo («Posiziona punti» nella pillola della mappa), un clic sulla mappa inserisce un punto. Trascina un segnaposto per spostarlo, clicca sul percorso disegnato per aggiungere lì un punto di forma, e scegli un luogo del viaggio con «Luoghi del viaggio».',
  'help.guide.tour-open-workspace.step.4':
    "Il più in cima alla barra di destra, «Aggiungi giro», offre «Importa GPX o KML», «Importa passeggiata da Google Maps» e «Riprendi un percorso da un altro viaggio». Quando un'escursione è aperta, c'è anche «Pianifica nuova escursione».",
  'help.guide.tour-draw-route.title': 'Disegnare una nuova escursione',
  'help.guide.tour-draw-route.tip.1':
    'Quando «Posiziona punti» è attivo, il puntatore diventa un mirino. Disattivalo per trascinare la mappa senza aggiungere punti. In 3D parte disattivato, perché lì trascini la mappa per guardarti intorno.',
  'help.guide.tour-type-profile.step.2':
    "Scegli il tipo nell'elenco: «Escursione a piedi», «Passeggiata urbana / turistica», «Corsa», «Escursione in bici», «Uscita in pagaia», «Escursione a cavallo» o «Sci e inverno». Ognuno spiega cosa pianifica, e cambiando tipo il percorso viene ricalcolato.",
  'help.guide.tour-edit-points.step.1':
    'Trascina un segnaposto numerato sulla mappa nel punto giusto: il percorso viene ricalcolato passando dalla nuova posizione.',
  'help.guide.tour-edit-points.result':
    "I punti sono dove vuoi e nell'ordine che vuoi, e il percorso è stato ricalcolato.",
  'help.guide.tour-shaping-points.tip.2':
    "Un punto di forma non può chiudere una tappa di un'escursione di più giorni.",
  'help.guide.tour-loop-reverse.tip.1':
    "Quando l'escursione è già un anello, «Ritorno al punto di partenza» mostra «Il tour torna già alla partenza».",
  'help.guide.tour-leg-by-hand.step.3':
    'Per far ricalcolare il tratto al router, apri lo stesso menu e scegli «Calcola di nuovo il tratto successivo».',
  'help.guide.tour-trip-places.step.2':
    'Cerca tra i luoghi del viaggio, oppure guarda sotto «Vicino al tour»: i luoghi entro due chilometri dal percorso, dal più vicino, ciascuno con la sua distanza.',
  'help.guide.tour-details-times.goal':
    "Dai all'escursione un nome, una descrizione e un link, e aggiungi le pause al suo tempo.",
  'help.guide.tour-details-times.result': "Ora l'escursione ha il suo nome, le sue note e il tempo che hai previsto.",
  'help.guide.tour-save.tip.2':
    "«Torna alle escursioni», in cima alla barra, chiude l'editor e, se ci sono modifiche non salvate, prima te lo chiede.",
  'help.guide.tour-edit-saved.step.4':
    "Clicca su «Torna alle escursioni» per chiuderla. Se ci sono modifiche non salvate, prima ti chiede «Scartare le modifiche non salvate all'escursione?».",
  'help.guide.tour-summary-profile.step.2':
    'Il pallino informativo accanto al tempo stimato spiega come viene calcolato.',
  'help.guide.tour-list-manage.goal':
    "Vedi i totali delle escursioni del viaggio, assegnane una a un giorno e restringi l'elenco a quelle che ti servono.",
  'help.guide.tour-list-manage.tip.3':
    "Il cestino su una riga elimina l'escursione. La scheda «Pianificato» elenca le stesse escursioni quando la sua colonna di destra è impostata su «Escursioni».",
  'help.guide.tour-delete.tip.3':
    'Le escursioni si eliminano qui, nella scheda «Escursioni». Il cestino compare solo a chi può modificare i luoghi del viaggio.',
  'help.guide.tour-saved-elsewhere.tip.1':
    "«Salva come nuovo tour» dà alla tua copia il nome dell'escursione seguito da (my version).",
  'help.ctx.trip-tour-import.bullet.4':
    "«Versione modificabile» trasforma un'importazione in un'escursione con waypoint che puoi spostare. «Sostituisci l'importazione» conserva la traccia registrata, e la scheda «Traccia registrata» nell'editor ti riporta a quella.",
  'help.guide.tour-import-gpx.step.5':
    'Clicca su «Importa 1 escursione» (o «Importa 3 escursioni» per un file con tre tracce).',
  'help.guide.tour-view-import.goal':
    "Vedi tracciato, misure e quote di un'escursione importata, così come sono arrivati.",
  'help.guide.tour-plan-from-import.title': "Pianificare un'escursione modificabile da un'importazione",
  'help.guide.tour-plan-from-import.tip.3':
    "In un'importazione di pagaia o di sci i punti vengono uniti con linee rette, senza calcolare il percorso.",
  'help.guide.tour-restore-recorded.tip.1':
    "La scheda compare solo per un'escursione sostituita con «Sostituisci l'importazione» e poi salvata.",
  'help.guide.tour-take-over.step.4':
    "Clicca sull'escursione: a destra vedi la sua linea, le sue misure e il viaggio da cui proviene.",
  'help.guide.tour-import-wanderer.goal': 'Importa nel viaggio, come escursione, uno dei sentieri del tuo wanderer.',
  'help.guide.tour-import-wanderer.tip.4': '«Apri in wanderer» apre il sentiero sulla tua istanza.',
  'help.ctx.trip-tour-map.bullet.5':
    "In 3D il percorso appare sul terreno, colorato in base alla pendenza, con una legenda che ne riassume le pendenze e un sorvolo che lo segue dalla partenza all'arrivo.",
  'help.guide.tour-map-layers.tip.2':
    "«Escursionismo» e «Bicicletta» provengono da server gestiti da volontari e sono disponibili solo se il tuo amministratore li consente. Quando uno non risponde più, il suo segmento mostra un ! e puoi passare a un'altra mappa; la tua escursione non cambia.",
  'help.guide.tour-along-search.step.5':
    'I luoghi trovati vengono elencati con la distanza dal percorso e mostrati sulla mappa nel loro colore. Una stella indica quelli più noti, e «Nel tour» quelli che sono già una tappa. Ora il pulsante mostra «Cerca di nuovo».',
  'help.guide.tour-along-add-stop.step.2':
    '«Dove va» suggerisce il tratto in cui il luogo si inserisce meglio. Cliccalo per scegliere invece tra quali due tappe inserirlo, oppure «Come nuovo arrivo». Prima di qualsiasi modifica, la mappa mostra il nuovo percorso con una linea tratteggiata.',
  'help.guide.tour-3d-terrain.goal': "Guarda l'escursione sul paesaggio reale, colorata in base alla pendenza.",
  'help.guide.tour-3d-terrain.tip.2':
    "La mappa che hai scelto viene usata anche in 3D, così come le vie ferrate, le piste e i segnali nautici. Mentre modifichi un'escursione puoi trascinarne i punti sul terreno e, con «Posiziona punti» attivo, un clic ne aggiunge uno.",
  'help.guide.tour-3d-flyover.result':
    "Hai visto l'escursione dall'alto, dalla partenza all'arrivo, alla velocità che hai scelto.",
  'help.guide.tour-map-overlays.step.3':
    'La legenda spiega i colori: le piste da discesa da «Principiante» a Freeride, «Piste da fondo», «Sentieri invernali e da ciaspole», «Piste da slittino» e «Impianti di risalita». «Legenda completa su OpenSnowMap» mostra tutti i simboli. Premi Esc per chiuderla.',
  'help.ctx.trip-tour-stages.bullet.1':
    "«Giorni», nell'editor, imposta l'escursione aperta come «Un giorno» o «Più giorni». Se torni a un'escursione di un giorno, dopo la tua conferma vengono rimosse tutte le fini tappa, e il percorso resta invariato.",
  'help.guide.tour-multi-day.step.2':
    'Sotto «Giorni», clicca su «Più giorni». Una nota indica dove viene posizionata la fine della prima tappa.',
  'help.guide.tour-multi-day.tip.4':
    'Le tappe vengono salvate quando clicchi su «Salva». Se una modifica elimina una tappa assegnata a un giorno del viaggio, un avviso ti segnala che salvando verrà tolta da quel giorno.',
  'help.guide.tour-stages-on-days.step.5':
    'Ogni tappa mostra il giorno a cui è assegnata. Clicca sul giorno per spostare la tappa a un altro giorno, oppure scegli «Nessun giorno» per toglierla.',
  'help.ctx.trip-tour-hike.summary':
    "Un'escursione a piedi o una corsa aperta nella scheda «Escursioni»: l'editor a sinistra, la mappa al centro, il riepilogo dell'escursione e le altre escursioni del viaggio a destra. Un'escursione a piedi resta entro la difficoltà di sentiero che consenti, una corsa viene calcolata sul tuo ritmo, ed entrambe mostrano i dati di OpenStreetMap lungo il tracciato.",
  'help.guide.tour-hike-plan.goal':
    "Avvia un'escursione a piedi, imposta le tappe, scegli la difficoltà massima di sentiero che il percorso può usare e salvala.",
  'help.guide.tour-hike-plan.tip.1':
    "Una nuova escursione a piedi parte da T2 («Escursionismo di montagna»). T3 aggiunge l'avviso che questi sentieri possono essere esposti e richiedono passo sicuro e assenza di vertigini.",
  'help.guide.tour-hike-trail-details.step.3':
    "I badge riassumono: quanta parte del percorso è «Noto», il grado «Massimo noto» e, a parte, il «Limite di percorso» con cui è stata pianificata l'escursione.",
  'help.guide.tour-hike-round.goal':
    "Fatti suggerire da TREK degli anelli della lunghezza che vuoi, con partenza da una tappa dell'escursione.",
  'help.guide.tour-hike-round.tip.2':
    'Sono accettate distanze da 1 a 60 km, e vengono proposti anelli che si discostano al massimo del 20 % dalla lunghezza indicata.',
  'help.guide.tour-hike-compare-ways.result':
    "Solo quel tratto segue la via che hai scelto, mentre il resto dell'escursione resta com'era. «Percorso adottato», in fondo alla mappa, offre «Annulla».",
  'help.guide.tour-ferrata-add.step.3':
    'Clicca su «Aggiungi al giro». La via ferrata viene aggiunta alla fine del percorso come tratto a sé, con un punto a ciascuna estremità.',
  'help.guide.tour-run-plan.title': 'Pianificare una corsa al tuo ritmo',
  'help.guide.tour-run-plan.tip.1': 'Senza un ritmo non puoi salvare la corsa.',
  'help.guide.tour-run-ways.step.3':
    "Clicca su «Fondo», poi su un tipo di fondo nell'elenco per mostrare sulla mappa solo quei tratti.",
  'help.ctx.trip-tour-walk.bullet.3':
    "Quando la passeggiata è assegnata a un giorno con un orario di partenza, «Orari per» in cima a «Waypoint» indica quel giorno, e ogni tappa mostra l'orario di arrivo, la durata della sosta e cosa dicono gli orari di apertura.",
  'help.guide.tour-walk-plan.step.4':
    "Assegna alla tappa un'«Etichetta» e una «Sosta in minuti». Lascia vuota la sosta se non la conosci ancora, e inserisci 0 per un punto in cui passi soltanto.",
  'help.guide.tour-walk-sights.goal': 'Scegli un tema, cerca lungo la passeggiata e aggiungi un luogo come tappa.',
  'help.guide.tour-walk-sights.tip.3':
    'Orari di apertura e siti web provengono dalla fonte, quasi sempre OpenStreetMap. Controllali prima di partire.',
  'help.guide.tour-walk-day-times.tip.1':
    'Senza un orario di partenza la riga lo segnala: «Give the walk a time on this day to see arrivals and opening hours.».',
  'help.guide.tour-walk-google-import.step.2':
    'Incolla il link in «Link al percorso a piedi» e clicca su «Leggi il link».',
  'help.guide.tour-walk-check-off.goal':
    'Durante la giornata segna le tappe come visitate o saltate e vedi quanto cammino ti resta.',
  'help.guide.tour-walk-check-off.result':
    'Le tappe visitate sono spuntate, quelle saltate sono barrate, e il tempo rimanente considera solo ciò che hai ancora davanti.',
  'help.guide.tour-bike-profile.goal':
    'Avvia un giro in bici e fai calcolare a TREK il percorso per cicloturismo, bici da strada, gravel o MTB.',
  'help.guide.tour-bike-profile.tip.1':
    "Se in seguito cambi profilo, l'intero percorso viene ricalcolato per il nuovo profilo.",
  'help.guide.tour-bike-surfaces.step.2':
    "Il badge nell'intestazione della scheda indica la quota del percorso che risulta non asfaltata.",
  'help.guide.tour-bike-mtb-grades.title': 'Controllare le difficoltà dei sentieri di un giro in mountain bike',
  'help.guide.tour-bike-mtb-grades.tip.3':
    'Se non è stato possibile leggere le difficoltà, la scheda lo segnala. Clicca su «Riprova».',
  'help.ctx.trip-tour-ski.bullet.5':
    "Quando è aperta un'escursione «Sci e inverno», la mappa mostra le piste di OpenSnowMap, con «Legenda delle piste» accanto al loro interruttore. Sono tutti dati cartografici: niente qui indica se una pista o un impianto è aperto, com'è la neve o qualcosa sulle valanghe.",
  'help.guide.tour-ski-plan.step.6': "Dai un nome all'escursione in «Nome dell'escursione» e clicca su «Salva».",
  'help.guide.tour-ski-options.step.1':
    "In un'escursione «Sci e inverno», le opzioni del router si trovano sotto «Disciplina». Vedi solo quelle che riguardano la tua disciplina: «Sci di fondo», ad esempio, non ha «Piste più difficili».",
  'help.guide.tour-ski-options.result':
    "L'escursione viene ricalcolata entro i tuoi limiti, e la scheda «Percorso sulle piste» elenca le piste più difficili che ha evitato.",
  'help.guide.tour-ski-fix-leg.tip.3':
    'Offline, per ora i tratti vengono disegnati in linea retta. Una riga grigia sui sentieri estivi è una nota, non un errore.',
  'help.guide.tour-ski-summary.tip.1':
    '«Evitate» elenca le piste più difficili che il router ha evitato a causa del tuo limite «Piste più difficili».',
  'help.guide.tour-ski-pistes-layer.step.2':
    "Clicca su «Legenda delle piste», il pulsante con quattro pallini colorati accanto all'interruttore.",
  'help.guide.tour-ski-import.step.1':
    'Nella scheda «Escursioni», clicca su «Aggiungi giro» (il più sopra «Escursioni di questo viaggio»), scegli «Importa GPX o KML» e seleziona il file.',
  'help.guide.tour-ski-import.tip.3':
    'Puoi anche trascinare file GPX, KML o KMZ in qualsiasi punto della scheda «Escursioni» per aprire la stessa anteprima.',
  'help.ctx.trip-tour-paddle.bullet.5':
    "«Vento» mostra le previsioni alla partenza dell'escursione per il giorno in cui è pianificata. «Lista di controllo» elenca gli ostacoli del percorso salvato e cosa hai deciso per ciascuno.",
  'help.guide.tour-paddle-setup.step.5':
    'Su un lago, «Sui laghi» stabilisce il percorso: «In linea retta» è il più breve, «Vicino alla riva» resta vicino alla sponda, utile nelle giornate di vento.',
  'help.guide.tour-paddle-water-route.title': "Pianificare i tratti sull'acqua",
  'help.guide.tour-paddle-water-route.tip.2':
    "Dove il percorso trasporta l'imbarcazione intorno a uno sbarramento o passa da una chiusa, TREK inserisce un proprio punto, contrassegnato come «Rilevato». Se lo sposti o lo modifichi, diventa un tuo punto.",
  'help.guide.tour-paddle-portage.step.3':
    'Sotto il punto compare una scheda «Trasbordo» con la lunghezza e i minuti aggiuntivi. Cliccala per aprirla.',
  'help.guide.tour-paddle-lock.goal': "Aggiungi una chiusa all'escursione e includi nel tempo l'attesa e il passaggio.",
  'help.guide.tour-paddle-lock.result':
    "La chiusa è nell'escursione con i suoi minuti, e la «Stima dei tempi» li somma.",
  'help.guide.tour-paddle-time.tip.1':
    "TREK parte da 4 km/h in acqua, 2 km/h trasportando l'imbarcazione e 10 minuti per ogni trasbordo. Sono valori iniziali da adattare, non misurazioni.",
  'help.guide.tour-paddle-wind.step.3':
    "Le barre mostrano le ore del giorno, con le raffiche dietro il vento medio. Passa con il mouse su una barra per vedere valori e direzione di quell'ora.",
  'help.guide.tour-paddle-checklist.goal':
    'Scopri cosa si sa di sbarramenti, chiuse e regole di accesso lungo un percorso salvato, e decidi cosa fare in ciascun caso.',
  'help.guide.tour-paddle-checklist.tip.3':
    'Una voce contrassegnata con «Controlla di nuovo» è stata decisa prima che il percorso o i dati cambiassero. Decidi di nuovo, oppure scegli «Mantieni la decisione» o «Rimuovi la decisione». Le decisioni che non valgono più sono elencate sotto «Decisioni precedenti».',
  'help.guide.tour-paddle-track-marks.step.3': 'Clicca su «Importa 1 escursione».',
  'help.guide.tour-paddle-track-marks.result':
    'La traccia registrata comprende trasbordi e chiuse, e la sua «Stima dei tempi» li conteggia.',
  'help.guide.tour-horse-plan.title': "Pianificare un'uscita a cavallo lungo percorsi equestri",
  'help.guide.tour-horse-plan.step.7':
    "Dai un nome all'uscita in «Nome dell'escursione», poi clicca su «Salva» in fondo alla colonna di sinistra.",
  'help.guide.tour-horse-gap.goal': 'Prosegui con una sezione che inizia lontano dalla fine della tua uscita.',
  'help.guide.tour-horse-gap.tip.3':
    'Una sezione che inizia entro 25 m dalla fine della tua uscita prosegue direttamente da lì, e «Collegamento alla tua escursione» indica «Si collega alla fine della tua escursione».',
  'help.guide.tour-horse-recorded.tip.1':
    "La linea resta esattamente come l'ha registrata il file. Niente viene ricalcolato, e un'uscita registrata non ha una versione modificabile.",
  'help.guide.dateless-trip.result':
    'La scheda mostra «Idea» e «Nessuna data impostata», e il viaggio ha tanti giorni vuoti quanti ne hai indicati.',
  'help.guide.trip-reminder.title': 'Ricevere un promemoria prima di un viaggio',
  'help.guide.upcoming-reservations.tip.1':
    'Un soggiorno in hotel compare due volte, una per il check-in e una per il check-out.',
  'help.guide.half-company-holiday.result':
    "L'azienda ha mezza giornata libera, e un giorno di ferie registrato in quella data conta solo come mezza giornata.",
  'help.guide.edit-holiday-calendar.title': 'Modificare o rimuovere un calendario delle vacanze',
  'help.guide.answer-fusion-request.result':
    "Dopo «Accetta e unisci», entrambi i piani compaiono in un'unica griglia, ogni persona con il proprio colore.",
  'help.guide.log-for-partner.result':
    "I giorni compaiono nel colore dell'altra persona e vengono scalati dalla sua disponibilità, non dalla tua.",
  'help.guide.dissolve-fusion.tip.1':
    "«Annulla» in quella finestra lascia il piano com'è; le tue voci vengono comunque conservate.",
  'help.guide.country-places.tip.1':
    'Un luogo finito sotto il paese sbagliato di solito ha un indirizzo o delle coordinate errate. Apri da qui il suo viaggio e correggi il luogo lì.',
  'help.guide.tour-activity-stats.title': 'Vedere cosa hai fatto nelle tue escursioni',
  'help.guide.tour-activity-stats.result':
    "I totali nella finestra e nella scheda «Escursioni» non comprendono più l'escursione esclusa. Il percorso, i giorni e il viaggio restano invariati.",
  'help.guide.move-to-list.tip.2':
    'Lo spostamento toglie i luoghi dalla lista, quindi «Sposta in lista» è visibile solo al proprietario o a un amministratore. «Duplica in lista» funziona da qualsiasi lista che puoi aprire.',
  'help.guide.accept-list-invite.step.2': "Clicca su «Accetta» per unirti, oppure su «Rifiuta» per declinare l'invito.",
  'help.guide.tour-collection-add-to-trip.tip.2':
    "Se un'escursione è stata salvata senza la linea, devi aggiungerne anche i waypoint. La finestra te lo segnala e seleziona per te quell'opzione.",
  'help.guide.tour-collection-manage.tip.1':
    "Togliere un'escursione dalla lista non modifica le escursioni già create a partire da essa nei tuoi viaggi.",
  'help.guide.entry-draft.tip.2':
    'Quando riprendi un giorno da Dawarich, le sue voci sono bozze. Prima di condividere, controlla il badge.',
  'help.guide.journey-map-layers.result':
    'La mappa mostra solo i livelli che vuoi, e la legenda spiega ogni segnaposto, puntino e linea.',
  'help.guide.journey-keep-route.result':
    "L'intestazione del giorno mostra la distanza, e il percorso compare come linea continua nel livello «Registrato» della mappa per tutti i partecipanti al diario. Un link condiviso lo mostra solo se «Percorsi registrati» è attivo.",
  'help.guide.journey-day-stays.result':
    'Le soste su cui hai deciso spariscono dalla riga. Le voci che hai scritto compaiono nel loro giorno come tutte le altre, e puoi aggiungere foto e testo come al solito.',
  'help.guide.journey-take-over-day.tip.2':
    'Le bozze non compaiono nei link condivisi. Aggiungi foto e testo, poi disattiva «Bozza» in ogni voce.',
  'help.guide.journey-auto-prepare.tip.2':
    'Un puntino sul pulsante elenco di un giorno indica che il giorno non è ancora definitivo; il suggerimento spiega il motivo.',
  'help.ctx.settings-plugins.bullet.3':
    'In fondo, «Attività dei plugin» elenca ogni azione che un plugin ha eseguito per conto tuo, dalla più recente, con «Aggiorna».',
  'help.guide.language-region.tip.3':
    "«La settimana inizia il» stabilisce la prima colonna di ogni selettore di date; Ferie ha un'impostazione propria.",
  'help.guide.web-push-device.tip.2': 'Su iPhone e iPad, aggiungi prima TREK alla schermata Home e aprilo da lì.',
  'help.guide.connect-airtrail.step.3':
    'Clicca su «Salva», poi su «Prova la connessione». Ti dice quanti voli ha trovato, e il badge diventa «Connessa».',
  'help.guide.connect-dawarich.step.3':
    'Clicca su «Salva», poi su «Prova la connessione»: conta le soste degli ultimi 30 giorni. Una volta collegato, «Controlla ora» esegue subito un controllo, e «Disconnetti» a destra interrompe il collegamento.',
  'help.guide.tour-connect-wanderer.step.3':
    'Clicca su «Salva», poi su «Prova la connessione». Ti dice quanti dei tuoi sentieri puoi importare, e il badge diventa «Connessa».',
  'help.guide.tour-wanderer-watch.step.2':
    "Al massimo una volta al giorno, TREK legge la scheda sintetica di ogni sentiero che hai importato, e la riga indica quando ha controllato l'ultima volta. Se un sentiero potrebbe essere cambiato, ricevi una notifica e «Segnalazioni» lo conteggia: clicca su «Segnalazioni» per vedere ogni escursione come «Forse cambiato», «Cambiato» o «Non verificabile», e aprirla da lì.",
  'help.guide.plugin-settings.goal':
    'Fornisci a un plugin le tue chiavi e preferenze, e vedi cosa ha fatto per conto tuo.',
  'help.guide.own-routing-engine.result': 'I percorsi di tutti i viaggi vengono calcolati sui tuoi server.',
  'help.guide.admin-passkeys.title': "Offrire l'accesso con passkey",
  'help.guide.rotate-jwt-secret.tip.1': 'Verrai disconnesso anche tu, quindi accedi di nuovo subito dopo.',
  'help.guide.notification-defaults.title': 'Impostare le notifiche predefinite per gli utenti',
  'help.ctx.notifications.title': 'Notifiche',
  'help.guide.read-notifications.goal':
    "Scopri cosa è successo nei tuoi viaggi mentre non c'eri, e aprilo direttamente.",
  'help.guide.filter-notifications.goal': 'Scorri tutte le notifiche, oppure solo quelle che non hai ancora letto.',
  'help.guide.mark-notifications-read.step.1':
    "Clicca su «Segna come letto», la doppia spunta accanto all'ora di una notifica, per segnare solo quella.",
  'help.guide.delete-notifications.step.2':
    "«Elimina tutto», in alto, elimina l'intero elenco in una volta, dopo che una finestra ti ha chiesto conferma.",
  'help.guide.notification-settings.step.3':
    'Clicca su «Notifiche» nella barra laterale delle impostazioni. La prima scheda ha una riga per ogni evento, e la colonna In-App stabilisce cosa mostra la campanella.',
  'help.guide.link-journal.result':
    'Nella barra delle schede del viaggio compare la scheda «Diario». Tutte le persone a cui hai dato «Lettura» o «Modifica» possono aprire lì il diario, con aggiornamenti in tempo reale.',
  'help.guide.create-place.tip.4':
    "Anche un link copiato da Google Maps funziona nella ricerca: incollalo, premi Invio, e TREK ricava il luogo dal link. Quando il modulo ha una posizione, «Luoghi vicino a questo segnaposto», il mirino accanto alla ricerca, elenca cosa c'è nei dintorni.",
  'help.guide.dawarich-stays.step.2':
    "Le soste sono raggruppate per giorno, ciascuna con l'ora di arrivo e di partenza; l'icona di un indicatore segnala una sosta su cui Dawarich non era sicuro. Clicca su «Aggiungi come luogo», il segnaposto accanto alla sosta.",
  'help.guide.leave-stop-off-route.step.3':
    'Per includerla di nuovo nel percorso, apri lo stesso menu e scegli «Riaggiungi al percorso».',
  'help.guide.move-booking-day.tip.1':
    'Le righe sbiadite nei giorni intermedi di una prenotazione su più giorni non si possono trascinare, così come una singola tratta di un volo con scali.',
  'help.guide.place-image-from-file.step.2':
    "Clicca sull'immagine rotonda nell'intestazione. Poiché il luogo ha delle foto, una piccola finestra ti chiede da dove prendere l'immagine.",
  'help.guide.place-own-hours.goal':
    'Inserisci nella scheda gli orari che hai verificato di persona, quando quelli trovati sono sbagliati o mancano.',
  'help.guide.place-own-hours.tip.2':
    "Il numero di telefono e l'email compaiono come pillole nell'intestazione della scheda. Cliccane una per aprirla nell'app del telefono o della posta.",
  'help.guide.edit-accommodation.tip.3':
    'Con «Nascondi codici di prenotazione» attivo in «Impostazioni», sotto «Visualizzazione», il numero di conferma resta sfocato. Passaci sopra con il mouse o cliccalo per leggerlo.',
  'help.guide.confirm-stay-booking.tip.1': 'Clicca di nuovo sulla pillola e la prenotazione torna «In attesa».',
  'help.guide.map-markers.tip.4':
    'Con «Segnaposti compatti per i luoghi non pianificati» attivo, in «Impostazioni» > «Visualizzazione» sotto Viaggio e mappa, i luoghi non ancora assegnati a un giorno diventano piccoli punti senza foto né valutazione. Il luogo che selezioni viene sempre mostrato per intero.',
  'help.guide.tour-map-lines.step.1':
    "Ogni escursione del viaggio compare sulla mappa come una linea del suo colore, con il segnaposto nel punto di partenza. Se hai scelto un colore per l'escursione, la linea usa quello; altrimenti usa il colore della categoria.",
  'help.guide.car-stops.step.6': 'Clicca su «Aggiungi».',
  'help.guide.transport-details.step.4':
    'Clicca sul titolo per rinominare il tragitto senza aprire il modulo. «Rinomina» si apre con il nome già inserito: scrivi quello nuovo e clicca su «Salva».',
  'help.guide.export-transports-csv.goal':
    "Esporta da TREK i tragitti del viaggio in un file CSV, per un foglio di calcolo, un'agenzia di viaggi o una stampa.",
  'help.guide.group-sort-bookings.result':
    "Le prenotazioni compaiono nelle sezioni e nell'ordine che hai scelto, e questo browser ricorda la scelta per la prossima volta.",
  'help.guide.booking-on-map.step.1':
    'Clicca sulla scheda di una prenotazione che ha un luogo, collegato in «Luogo / Attività» o, per un soggiorno, in «Alloggio». Si apre il dettaglio.',
  'help.guide.export-bookings-csv.title': 'Esportare le prenotazioni in un foglio di calcolo',
  'help.guide.export-bookings-csv.tip.3':
    'Il pulsante compare appena la scheda contiene una prenotazione. La scheda «Trasporti» esporta le proprie voci allo stesso modo.',
  'help.guide.arrange-packing-list.title': 'Ordinare la lista valigia come preferisci',
  'help.guide.count-packed-pieces.result':
    "La riga mostra quanti pezzi sono già in valigia, e l'elemento viene spuntato quando metti dentro l'ultimo.",
  'help.guide.expense-receipts.title': 'Allegare una ricevuta a una spesa',
  'help.guide.expense-receipts.tip.1':
    "Nell'editor, un clic sul nome di un file elencato apre la stessa anteprima. In quel caso Esc chiude solo l'anteprima, non la spesa.",
  'help.guide.files-sync-settings.step.5':
    "«Quando entrambi i lati sono cambiati» stabilisce quale copia mantenere se un documento è stato modificato in entrambi i posti: «Chiedimelo», «Tieni la copia di TREK» o «Tieni la copia dell'archivio». «Sincronizza automaticamente» permette a TREK di controllare le modifiche in background; se è disattivato, la scheda mostra «In pausa» e la sincronizzazione parte solo con «Sincronizza ora». Ogni modifica qui viene salvata subito.",
  'help.guide.manage-notes.step.5':
    '«Elimina» chiede prima «Eliminare la nota?», perché la nota viene eliminata per tutti i membri, insieme ai suoi file. Clicca su «Elimina» per confermare.',
  'help.guide.note-categories.step.3':
    'Clicca sul nome di una categoria per rinominarla. Scrivi il nuovo nome e premi Invio; con Esc mantieni quello precedente.',
  'help.guide.roadtrip-reorder.step.2':
    'Per spostare una tappa a un altro giorno, rilasciala su una tappa nella scheda di quel giorno. Durante il trascinamento, un giorno con meno di due tappe compare come scheda tratteggiata in fondo alla barra, e puoi rilasciare la tappa anche lì.',
  'help.guide.roadtrip-corridor.tip.4':
    "Sotto il filtro, scegli una tappa del giorno, oppure «A metà tra due», per vedere solo ciò che si trova entro 25, 50 o 100 km da quel punto. Se nell'elenco ci sono colonnine di ricarica, «Qualsiasi presa» e «Qualsiasi potenza» le filtrano per tipo di presa e potenza.",
  'help.guide.roadtrip-overnight.result':
    'Il luogo compare nel tragitto come pernottamento di quel giorno, e il soggiorno è prenotato nel viaggio come qualsiasi altro.',
  'help.guide.roadtrip-stop-fill.result':
    "In questa sosta il serbatoio viene riempito fino al livello che hai scelto. L'autonomia successiva, compresa l'eventuale fascia «Qui il serbatoio si esaurisce», viene calcolata a partire da lì.",
  'help.guide.roadtrip-bookings.step.4': 'Clicca sulla scheda per aprire la prenotazione.',
  'help.guide.roadtrip-google-import.goal':
    'Trasforma un percorso pianificato in Google Maps in tappe di uno dei tuoi giorni.',
  'help.guide.roadtrip-google-import.tip.3':
    "L'importazione richiede una connessione e il permesso di modificare sia i luoghi sia i giorni.",
  'help.guide.roadtrip-hazards.tip.2':
    "DWD copre la Germania, GDACS segnala calamità in tutto il mondo. Un avviso indicato solo come punto significa che l'area interessata non è nota.",
  'help.ctx.trip-tours.bullet.5':
    "Nella colonna dei giorni un'escursione è una riga come una tappa. Con un «Inizio» mostra inizio → fine, con la fine calcolata in base al tempo dell'escursione, e «Altre opzioni» contiene «Modifica», «Rimuovi dal giorno», «Escludi dal percorso» e «Salva nella raccolta».",
  'help.guide.tour-show-list.step.5': "Clicca su «Luoghi» nello stesso selettore per tornare all'elenco dei luoghi.",
  'help.guide.tour-add-to-day.step.2':
    "Scegli il giorno. Il menu elenca tutti i giorni del viaggio con data e titolo; un giorno che contiene già l'escursione è in grigio.",
  'help.guide.tour-add-to-day.result':
    "L'escursione compare sotto il suo giorno, e la sua linea fa parte di quel giorno sulla mappa.",
  'help.guide.tour-day-times.tip.2':
    "Un giorno con una sola tappa di un'escursione di più giorni non ha un orario di fine calcolato, perché il tempo dell'escursione si riferisce all'intero percorso.",
  'help.guide.tour-remove-from-day.step.3':
    "In alternativa, clicca sull'intestazione del giorno per aprirlo, clicca sull'escursione nell'elenco e poi su «Rimuovi dal giorno» in fondo alla sua scheda.",
  'help.guide.tour-filter-list.step.3':
    "Se l'elenco contiene escursioni diverse, «Origine» (TREK, «Importazione GPX», wanderer), «Limite di percorso» (da T1 a T6) e «Tipo» («Escursione a piedi», «Escursione in bici» e così via) lo restringono ulteriormente. Clicca di nuovo su un valore spuntato per toglierlo.",
  'help.guide.tour-hide-on-map.step.1':
    "Punta un'escursione nell'elenco e clicca sull'occhio che compare a destra della riga («Nascondi sulla mappa»).",
  'help.guide.tour-import-plan-tab.step.1':
    'Nella scheda «Pianificato», clicca su «Escursioni» nel selettore in cima alla colonna di destra.',
  'help.ctx.trip-tour-detail.bullet.1':
    "Clicca su un'escursione nell'elenco «Escursioni» (prima imposta la colonna di destra su «Escursioni» invece di «Luoghi»), sulla sua riga in un giorno o sulla sua linea sulla mappa: la scheda si apre sopra la mappa. Mentre la scheda è aperta, puoi continuare a usare la mappa.",
  'help.guide.tour-detail-read.step.2':
    "L'intestazione mostra il nome dell'escursione e un riepilogo in pillole: il tipo di escursione, da dove proviene se è stata importata, il tempo previsto, la distanza, la salita e la discesa.",
  'help.guide.tour-detail-read.tip.3':
    "Alcune escursioni mostrano di più: una passeggiata urbana le sue tappe, un'uscita in pagaia i controlli e il vento, un'escursione già fatta la sua «Traccia effettiva», e un'escursione collegata a una lista la sua «Lista valigia».",
  'help.guide.tour-rename-colour.step.3':
    "Clicca sul pallino colorato nell'angolo della casella rotonda dell'escursione, «Colore della traccia». Sotto l'intestazione si apre la sezione «Colore della traccia».",
  'help.guide.tour-take-along.step.2':
    "Se l'escursione ha una pagina web, il pulsante accanto mostra il nome del sito (Komoot, AllTrails, Outdooractive o Wanderer) oppure «Sito web» per qualsiasi altro. Apre la pagina in una nuova scheda.",
  'help.guide.tour-copy-keep.goal':
    "Crea una variante di un'escursione in questo viaggio, oppure conservala in una delle tue raccolte per i prossimi viaggi.",
  'help.guide.tour-copy-keep.tip.4':
    '«Raccolta» è disponibile solo se il modulo Raccolte è attivo. Una lista di sola lettura non si può scegliere e, se non hai ancora liste, la finestra propone «Apri le raccolte».',
  'help.guide.tour-packing-link.step.5':
    'Clicca su «Apri la lista valigia» per spuntare gli elementi. TREK passa alla scheda «Liste», sulla lista valigia.',
  'help.guide.tour-files.step.2': "Ora la riga sotto indica quanti sono, e l'elenco si apre.",
  'help.guide.tour-activity-link.step.2':
    "Sotto «Svolto il», controlla il giorno in cui l'hai fatta. Scegli «Nessun giorno» se non appartiene a un giorno.",
  'help.guide.tour-activity-compare.title': 'Confrontare il programma con ciò che hai fatto',
  'help.guide.tour-activity-compare.result':
    'Puoi confrontare rapidamente la giornata con il programma, sulla scheda e sulla mappa.',
  'help.guide.tour-origin-check.tip.3':
    '«Nessuna connessione wanderer» significa che il tuo account non è ancora collegato. Collegalo in «Impostazioni», sotto «Integrazioni».',
  'help.ctx.trip-tour-planner.bullet.5':
    "«Cerca luogo o indirizzo», in cima alla mappa, sposta la mappa. La pillola in basso a sinistra passa tra le mappe disponibili per il tipo di escursione, come Topo o Satellite, e contiene gli interruttori dell'escursione aperta, come «Posiziona punti» e 3D.",
  'help.guide.tour-open-workspace.step.5':
    "«Cerca luogo o indirizzo», in cima alla mappa, sposta la mappa su un luogo, così puoi iniziare dalla zona dell'escursione.",
  'help.guide.tour-draw-route.goal':
    'Inserisci sulla mappa i punti di una nuova escursione e lascia che TREK calcoli il percorso tra di loro.',
  'help.guide.tour-draw-route.tip.2':
    'Topo o «Escursionismo» nella pillola della mappa mostrano i sentieri, così è più facile cliccarci sopra. Un punto troppo lontano da qualsiasi via percorribile per quel tipo riceve un avviso invece di un percorso.',
  'help.guide.tour-type-profile.step.3':
    "Per un'escursione in bici, sotto il tipo devi scegliere il «Profilo»: «Turismo», «Strada», Gravel o MTB. La riga sotto spiega cosa preferisce quel profilo.",
  'help.guide.tour-edit-points.step.2':
    'Clicca su una riga sotto «Waypoint» per selezionarne il punto: il segnaposto viene evidenziato sulla mappa.',
  'help.guide.tour-shaping-points.title': 'Modificare il percorso con un punto di forma',
  'help.guide.tour-shaping-points.tip.3':
    "In un'uscita a cavallo un clic sulla linea non aggiunge nulla, perché nessun router calcola il tracciato.",
  'help.guide.tour-loop-reverse.tip.2':
    "Rimuovi la riga «Ritorno alla partenza» per tornare a un'escursione di sola andata. Un tratto disegnato a mano resta disegnato a mano anche quando inverti l'escursione.",
  'help.guide.tour-leg-by-hand.step.4':
    '«Ricalcola il tratto successivo» chiede di nuovo al router solo quel tratto, senza toccare gli altri.',
  'help.guide.tour-trip-places.step.3':
    "Clicca su un luogo: viene aggiunto come nuovo arrivo dell'escursione, e l'elenco resta aperto per il successivo.",
  'help.guide.tour-details-times.step.1':
    "«Nome dell'escursione», in cima alla barra di sinistra, contiene il nome. In una nuova escursione il testo grigio, ad esempio «Escursione a piedi senza titolo», è solo un segnaposto: scrivi il tuo.",
  'help.guide.tour-save.title': "Salvare un'escursione",
  'help.guide.tour-save.tip.3':
    '«Salva» non funziona nemmeno se un campo contiene un valore non valido, come un sito web che non è un indirizzo. «Dettagli» si apre da solo per mostrartelo.',
  'help.guide.tour-edit-saved.tip.1': "«Salva» resta in grigio finché non modifichi l'escursione.",
  'help.guide.tour-summary-profile.step.3':
    'Muovi il puntatore lungo il «Profilo altimetrico»: mostra distanza e quota in quel punto, e un pallino indica la stessa posizione sulla mappa.',
  'help.guide.tour-list-manage.step.1':
    "«Totali del viaggio» si trova sopra l'elenco. Quando è compresso, mostra il numero di escursioni e quante sono «Pianificato» e «Non pianificati». La freccia a destra apre una riga per ogni tipo, con distanza, salita, discesa e tempi sommati.",
  'help.guide.tour-list-manage.result':
    'Vedi i totali delle escursioni mostrate dal filtro, e ogni escursione è nel giorno che volevi.',
  'help.guide.tour-delete.result': "L'escursione è sparita dall'elenco, dalla mappa e da tutti i giorni.",
  'help.guide.tour-saved-elsewhere.tip.2':
    "Lo stesso succede se hai modificato l'escursione su un altro dispositivo. Un'escursione che non hai modificato viene semplicemente ricaricata, e una nota lo segnala.",
  'help.ctx.trip-tour-import.bullet.5':
    'Una volta collegato wanderer in «Impostazioni», «Integrazioni», accanto a «Pianifica nuova escursione» compare un pulsante wanderer quando nessuna escursione è aperta. Elenca i tuoi sentieri da importare.',
  'help.guide.tour-import-gpx.tip.1':
    'Puoi anche trascinare i file dal computer e rilasciarli sulla scheda «Escursioni»: si apre la stessa anteprima.',
  'help.guide.tour-view-import.step.1':
    "Nella scheda «Escursioni», clicca su un'escursione con il badge «Importazione GPX» in «Escursioni di questo viaggio».",
  'help.guide.tour-plan-from-import.goal':
    'Ottieni da una traccia registrata dei waypoint che puoi spostare, e vedi quanto il nuovo percorso resta vicino alla traccia.',
  'help.guide.tour-plan-from-import.tip.4':
    "Un'«Escursione a cavallo» non ha una versione modificabile: resta come è stata percorsa.",
  'help.guide.tour-restore-recorded.tip.2':
    "Un'escursione creata con «Pianifica come nuova escursione» non ha una propria traccia registrata. L'importazione da cui deriva è ancora nell'elenco.",
  'help.guide.tour-take-over.step.5': 'Se vuoi, assegnale un altro nome in «Nome in questo viaggio».',
  'help.guide.tour-import-wanderer.step.1':
    'Nella scheda «Escursioni», senza escursioni aperte, clicca su wanderer accanto a «Pianifica nuova escursione».',
  'help.guide.tour-import-wanderer.result':
    "Il sentiero è diventato un'escursione del viaggio e si apre sulla mappa come «Escursione wanderer».",
  'help.guide.tour-map-layers.title': "Scegliere la mappa per un'escursione",
  'help.guide.tour-map-layers.tip.3':
    "Un'uscita in pagaia e una passeggiata urbana offrono solo «Mappa» e Satellite; una corsa, un'escursione di sci e un'uscita a cavallo offrono «Mappa», Topo e Satellite.",
  'help.guide.tour-along-search.result':
    "I luoghi lungo il percorso sono nell'elenco e sulla mappa, pronti da consultare.",
  'help.guide.tour-along-add-stop.step.3':
    "Clicca su «Aggiungi come sosta». Il badge accanto è una stima approssimativa della deviazione, misurata in linea d'aria.",
  'help.guide.tour-3d-terrain.step.1':
    "Apri un'escursione nella scheda «Escursioni» e clicca su 3D all'estremità della pillola in basso a sinistra. La mappa si inclina e mostra il terreno in 3D, con il percorso disegnato sopra.",
  'help.guide.tour-3d-terrain.tip.3':
    "Il paesaggio richiede una connessione: le quote provengono dai tile aperti del terreno di Mapzen. Un'uscita in pagaia viene disegnata nel suo colore senza pendenze, perché l'acqua è piatta.",
  'help.guide.tour-3d-flyover.tip.1':
    'Durante il sorvolo, usa la rotellina del mouse per ingrandire o ridurre; la visuale resta sul pallino. Non puoi trascinare la mappa finché non metti in pausa.',
  'help.guide.tour-map-overlays.step.4':
    "In un'uscita in pagaia la pillola offre invece «Segnali nautici». Cliccala per mostrare sull'acqua boe, fari e segnali portuali.",
  'help.ctx.trip-tour-stages.bullet.2':
    "«Termina la tappa qui», nel menu «Altre azioni» di una tappa, chiude una tappa in quel punto. «Waypoint» mostra allora un titolo «Tappa N» per ogni tappa, con distanza e tempo, e la sosta che chiude una tappa ha l'icona della luna.",
  'help.guide.tour-multi-day.step.3':
    'Punta la sosta in cui finisce il primo giorno, clicca su «Altre azioni» e scegli «Termina la tappa qui».',
  'help.guide.tour-multi-day.result':
    'Un unico percorso con le sue tappe, ciascuna misurata separatamente. Clicca su «Salva» per conservarle.',
  'help.guide.tour-stages-on-days.step.6':
    "La freccia accanto, «Apri questa tappa nel pianificatore», apre l'escursione nell'editor su quella tappa.",
  'help.ctx.trip-tour-hike.bullet.1':
    "«Tipo di tour», in cima all'editor, stabilisce come viene calcolato il percorso. «Escursione a piedi» usa sentieri fino alla «Difficoltà massima del sentiero» impostata in «Dettagli»; «Corsa» usa vie adatte alla corsa e chiede il tuo «Passo previsto».",
  'help.guide.tour-hike-plan.step.1':
    "Clicca su «Pianifica nuova escursione» in cima alla colonna di sinistra. L'editor si apre come «Nuova escursione».",
  'help.guide.tour-hike-plan.tip.2':
    'Da T4 in su, TREK chiede prima «Attivare il calcolo dei percorsi alpini?». Conferma solo se il percorso può attraversare terreno esposto o non segnalato; la domanda compare una volta per sessione di modifica.',
  'help.guide.tour-hike-trail-details.step.4':
    "Clicca su un grado nell'elenco per mostrare sulla mappa solo quei tratti. Cliccalo di nuovo per vedere l'intero percorso.",
  'help.guide.tour-hike-round.step.1':
    "Con l'escursione aperta, clicca su «Anello dalla partenza» nell'intestazione della scheda «Waypoint». Da un'altra tappa, apri le sue «Altre azioni» e scegli «Anello da qui».",
  'help.guide.tour-hike-round.tip.3':
    '«Cerca di nuovo» torna alla scelta della distanza, e «Annulla» chiude la scheda senza modificare nulla.',
  'help.guide.tour-hike-compare-ways.tip.1':
    'Questa funzione è disponibile solo per le escursioni a piedi, e solo per un tratto calcolato dal router, non per uno disegnato a mano.',
  'help.guide.tour-ferrata-add.step.4':
    'In «Waypoint», il tratto tra quei due punti mostra nome, difficoltà e lunghezza della via ferrata.',
  'help.guide.tour-run-plan.goal': 'Pianifica una corsa su vie adatte e ottieni il tempo in base al tuo ritmo.',
  'help.guide.tour-run-plan.tip.2':
    'Salite, discese e difficoltà tecnica del percorso non rientrano nel tempo: è solo distanza per ritmo.',
  'help.guide.tour-run-ways.result': 'Prima di partire sai quali tratti della corsa non sono su asfalto.',
  'help.ctx.trip-tour-walk.bullet.4':
    '«Lungo il percorso» trova attrazioni in base al «Tema del percorso» entro una certa distanza dal tracciato, e «Aggiungi come sosta» ne inserisce una nella passeggiata nel punto che scegli.',
  'help.guide.tour-walk-plan.step.5':
    "Imposta «Importanza» su «Normale», «Facoltativo» o «Da non perdere». Attiva «Protetta» per una tappa che deve restare dov'è quando in seguito viene proposta una modifica, poi clicca su «Salva».",
  'help.guide.tour-walk-sights.step.1':
    "Con una passeggiata urbana aperta, cerca «Lungo il percorso» nella colonna di sinistra e scegli un «Tema del percorso»: «Cultura e storia», «Parchi e panorami», «Cibo e vita locale» o «Un po' di tutto».",
  'help.guide.tour-walk-sights.result':
    "L'attrazione è diventata una tappa della passeggiata, inserita nel percorso tra le tappe che hai scelto.",
  'help.guide.tour-walk-day-times.tip.2':
    'Se una tappa non ha ancora una durata di sosta, gli orari di arrivo successivi vengono mostrati come i più anticipati possibili.',
  'help.guide.tour-walk-google-import.step.3':
    'Controlla «Tappe nel link». Una tappa senza posizione nel link viene contrassegnata ed esclusa.',
  'help.guide.tour-walk-check-off.step.1':
    'Nella scheda «Pianificato», clicca sulla passeggiata urbana nel suo giorno: la scheda si apre accanto alla mappa.',
  'help.ctx.trip-tour-bike.title': 'Giri in bici',
  'help.guide.tour-bike-profile.step.1':
    'Nella scheda «Escursioni», clicca su «Pianifica nuova escursione» in cima alla barra di sinistra.',
  'help.guide.tour-bike-profile.tip.2':
    'Un profilo serve solo a orientare il router. Non dice nulla sulla percorribilità di una strada: la scheda «Fondo e percorsi» mostra su cosa passa il percorso.',
  'help.guide.tour-bike-surfaces.step.3':
    "Sotto «Fondo», clicca su una riga, ad esempio Ghiaia o «Terreno naturale»: i relativi tratti vengono evidenziati sulla mappa. Clicca di nuovo sulla riga per togliere l'evidenziazione.",
  'help.guide.tour-bike-mtb-grades.goal':
    'Scopri quanto sono difficili i sentieri di un giro in MTB prima di percorrerli.',
  'help.guide.tour-bike-mtb-grades.tip.4':
    'Se cambi il «Profilo» da MTB a un altro, le sezioni con le difficoltà spariscono e il percorso viene ricalcolato per il nuovo profilo.',
  'help.guide.tour-ski-plan.title': "Pianificare un'escursione di sci o invernale",
  'help.guide.tour-ski-plan.tip.1':
    "Per «Sci di fondo», scegli anche la «Tecnica»: «Classica», Skating o «Sconosciuta». L'avviso sotto i campi indica cosa manca ancora.",
  'help.guide.tour-ski-options.step.2':
    'Apri «Piste più difficili» e scegli la difficoltà massima che vuoi sciare, da «Principiante» a «Esperto». Il valore predefinito è «Intermedia».',
  'help.guide.tour-ski-fix-leg.title': 'Correggere un tratto di sci che non è stato possibile pianificare',
  'help.guide.tour-ski-fix-leg.tip.4':
    "Finché non sono pianificati tutti i tratti, la scheda «Percorso sulle piste» indica che non c'è ancora un tempo di sci.",
  'help.guide.tour-ski-summary.tip.2':
    "«Tempo di sci» resta «Non calcolato» finché tutti i tratti non sono pianificati. Per dare comunque un tempo all'escursione, inserisci un totale pianificato nei suoi dettagli.",
  'help.guide.tour-ski-pistes-layer.step.3':
    'La legenda mostra le piste da discesa per difficoltà, le piste da fondo, i sentieri invernali e da ciaspole, le piste da slittino e gli impianti. «Legenda completa su OpenSnowMap» apre la legenda completa.',
  'help.guide.tour-ski-import.step.2':
    "Nell'«Anteprima dell'importazione», apri «Importa come» e scegli «Sci e inverno».",
  'help.guide.tour-ski-import.result':
    'La traccia è in «Escursioni di questo viaggio», con disciplina e tecnica indicate nella sua scheda «Traccia di sci».',
  'help.ctx.trip-tour-paddle.bullet.6':
    '«Pagaiare comporta dei rischi», la riga in fondo alla colonna di sinistra, apre «Sicurezza in acqua». La mappa offre «Mappa» e Satellite, con «Segnali nautici» come livello aggiuntivo.',
  'help.guide.tour-paddle-setup.step.6':
    "«Velocità di pagaiata» mostra in grigio la velocità suggerita per l'imbarcazione. Se ne inserisci una tua, il campo indica «Velocità propria»; il link sotto, «Usa quella suggerita», ripristina la velocità dell'imbarcazione.",
  'help.guide.tour-paddle-water-route.goal':
    'Fai pianificare a TREK un tratto lungo il fiume o il lago, e capisci le note su un tratto che non è riuscito a pianificare.',
  'help.guide.tour-paddle-water-route.tip.3':
    'Le note sotto un tratto pianificato segnalano acque bianche con il loro grado, uno «Scivolo per canoe» o una «Lacuna nei dati della mappa» colmata con una linea retta.',
  'help.guide.tour-paddle-portage.step.4':
    "Sotto «Percorso», «Segui il sentiero» usa una via mappata e «Linea retta» va dritto attraverso. TREK cerca il sentiero da solo e ti avvisa se non ce n'è uno senza una lunga deviazione.",
  'help.guide.tour-paddle-lock.step.1':
    'Punta la sosta in corrispondenza della chiusa e clicca su «Altre azioni», i tre puntini.',
  'help.guide.tour-paddle-time.title': "Leggere e regolare il tempo di un'uscita in pagaia",
  'help.guide.tour-paddle-time.tip.2': 'Corrente e vento non sono inclusi nella stima.',
  'help.guide.tour-paddle-wind.step.4':
    "Apri «Cosa significa il vento per chi pagaia» per sapere che effetto hanno su un'imbarcazione vento contrario, vento laterale, traversate in acque aperte e raffiche.",
  'help.guide.tour-paddle-checklist.step.1':
    "Salva l'uscita in pagaia, poi cerca «Lista di controllo» nella colonna di sinistra. Il badge nell'intestazione riassume a che punto è la lista.",
  'help.guide.tour-paddle-checklist.tip.4':
    'Gli ostacoli provengono dai dati OpenStreetMap delle regioni disponibili in TREK. Dove non ci sono dati, la scheda lo segnala, e sbarramenti, chiuse e trasbordi devi controllarli tu.',
  'help.guide.tour-paddle-track-marks.step.4':
    'Clicca sulla traccia in «Escursioni di questo viaggio». La colonna di sinistra la mostra così come è stata registrata, con la scheda «Trasbordi e chiuse».',
  'help.ctx.trip-tour-horse.title': 'Uscite a cavallo',
  'help.guide.tour-horse-plan.goal':
    "Componi un'uscita a cavallo con sezioni dei percorsi equestri segnalati nella vista mappa.",
  'help.guide.tour-horse-plan.result':
    "L'uscita segue le sezioni che hai scelto, ciascuna con il nome del percorso, il pallino dell'accesso e la lunghezza, e compare in «Escursioni di questo viaggio».",
  'help.guide.tour-horse-gap.step.1':
    "Con una sezione già nell'uscita, apri un altro percorso e scegli una sezione che non tocca la fine della tua uscita. Sotto «Collegamento alla tua escursione», un avviso indica quanto distano.",
  'help.guide.tour-horse-recorded.title': "Conservare un'uscita registrata da un file GPX",
  'help.guide.tour-horse-recorded.tip.2':
    'Un file senza quote mostra «Nessuna quota nel file» invece di una salita pari a zero.',
  'help.guide.dateless-trip.tip.1':
    'Quando sai quando partirai, apri il modulo con la matita sulla scheda e scegli le date. I giorni già pianificati mantengono il loro ordine e ricevono le date in quello stesso ordine.',
  'help.guide.trip-reminder.goal': 'Ricevi un promemoria qualche giorno prima della partenza.',
  'help.guide.upcoming-reservations.tip.2':
    '«In attesa» indica una prenotazione non ancora confermata. Le prenotazioni annullate e i viaggi archiviati non compaiono.',
  'help.guide.half-company-holiday.tip.1':
    'Le ferie già registrate in quel giorno vengono ridotte a mezza giornata. Chi registra quel giorno in seguito usa solo 0,5 giorni.',
  'help.guide.edit-holiday-calendar.goal':
    'Rinomina, cambia colore, sposta o elimina un calendario di festività o di vacanze scolastiche che hai aggiunto.',
  'help.guide.person-color.title': 'Cambiare il colore di una persona',
  'help.guide.answer-fusion-request.tip.1':
    "La richiesta resta aperta finché non rispondi. Se ci sono più richieste, le vedi una dopo l'altra.",
  'help.guide.log-for-partner.tip.1':
    '«Mezza giornata» e «Recupero / Flex» funzionano anche per la persona selezionata.',
  'help.guide.dissolve-fusion.tip.2':
    'Se vuoi solo far vedere i tuoi giorni a qualcuno, condividi invece il tuo calendario.',
  'help.guide.country-details.tip.2':
    'Clicca sul badge «Luoghi» per vedere tutti i luoghi conteggiati per il paese, raggruppati per viaggio.',
  'help.guide.country-places.tip.2':
    'Il badge compare solo se il paese ha dei luoghi propri. Un paese segnato solo a mano non ne ha.',
  'help.guide.tour-activity-stats.goal':
    "Consulta distanza, dislivello e numero di escursioni fatte in tutti i tuoi viaggi, per periodo e per tipo, ed escludi un'escursione che non hai fatto.",
  'help.guide.tour-activity-stats.tip.1':
    "Un'escursione viene conteggiata quando il suo ultimo giorno è passato. Un'escursione senza giorno, o solo in giorni senza data, non viene mai conteggiata. Per conteggiarla, assegnala a un giorno con data nel suo viaggio.",
  'help.guide.move-to-list.result':
    "I luoghi sono nell'altra lista, e una breve nota indica quanti sono stati spostati o duplicati.",
  'help.guide.accept-list-invite.tip.1':
    'Cosa puoi fare nella lista dipende dal ruolo che ti ha assegnato il proprietario: «Visualizzatore», «Editore» o Admin.',
  'help.guide.tour-collection-add-to-trip.title': "Aggiungere a un viaggio un'escursione di una lista",
  'help.guide.tour-collection-add-to-trip.tip.3':
    "Per salvare un'escursione in una lista, apri un'escursione salvata nel viaggio e clicca su «Raccolta» in fondo alla scheda.",
  'help.guide.tour-collection-manage.tip.2':
    'Il cestino è visibile solo al proprietario e agli amministratori della lista.',
  'help.guide.entry-draft.result':
    'La voce resta nella tua cronologia, contrassegnata come «Bozza», e non compare nel link condiviso.',
  'help.guide.journey-map-layers.title': 'Scegliere cosa mostra la mappa del diario',
  'help.guide.journey-keep-route.title': 'Conservare il percorso registrato in un giorno',
  'help.guide.journey-day-stays.title': 'Scrivere voci a partire dalle soste registrate da Dawarich',
  'help.guide.journey-take-over-day.title': "Riprendere un'intera giornata registrata",
  'help.guide.journey-take-over-day.result':
    'Ora il giorno ha una bozza per ogni sosta o gruppo unito, oppure un unico resoconto del giorno, e le sue soste non risultano più in sospeso.',
  'help.guide.journey-auto-prepare.result':
    'Mentre un viaggio collegato è in corso, le soste di ogni giorno compaiono in quel giorno, pronte per «Riprendi giornata».',
  'help.ctx.settings-about.title': 'Informazioni',
  'help.guide.web-push-device.tip.3':
    'Le notifiche push richiedono che TREK sia aperto tramite HTTPS. Se le notifiche sono bloccate, consentile nelle impostazioni del browser e riprova.',
  'help.guide.connect-airtrail.result':
    'Il badge mostra «Connessa», e la scheda «Trasporti» di un viaggio offre «Importa da AirTrail».',
  'help.guide.connect-dawarich.result':
    "Il badge mostra «Connessa», e il planner del viaggio, il diario e l'Atlante possono proporti ciò che Dawarich ha registrato.",
  'help.guide.tour-connect-wanderer.result':
    'Il badge mostra «Connessa», e dalla scheda «Escursioni» di un viaggio puoi cercare nel tuo wanderer e importarne i sentieri.',
  'help.guide.tour-wanderer-watch.result':
    "TREK controlla i sentieri che hai importato e ti avvisa quando uno potrebbe essere cambiato. Un'escursione cambia solo se accetti la modifica.",
  'help.guide.plugin-settings.step.1':
    'Apri «Plugin» nella barra laterale delle impostazioni. Sotto «Impostazioni plugin», ogni plugin che ha bisogno di impostazioni da te ha una scheda con i suoi campi: compilali e clicca su «Salva». Le azioni sulla scheda vengono eseguite dopo la tua conferma.',
  'help.guide.profile.step.3': 'Clicca su «Salva Profilo» a destra, in fondo alla scheda.',
  'help.guide.default-user-settings.title': 'Impostare le preferenze di partenza dei nuovi utenti',
  'help.guide.own-routing-engine.tip.1':
    'I server OSRM pubblici consentono circa una richiesta al secondo. Basta per un singolo giorno, ma per un road trip può risultare troppo lento.',
  'help.guide.admin-passkeys.goal':
    "Permetti alle persone di accedere con l'impronta digitale, il riconoscimento del volto o il PIN del dispositivo.",
  'help.guide.rotate-jwt-secret.tip.2':
    'Per disconnettere invece una sola persona, assegnale una «Nuova Password» in «Modifica Utente»: vengono chiuse solo le sue sessioni.',
  'help.guide.notification-defaults.goal':
    'Decidi le impostazioni iniziali delle notifiche di ogni utente, e blocca del tutto un canale per un determinato evento.',
  'help.ctx.notifications.summary':
    "Tutte le notifiche che TREK ti ha mostrato nell'app, dalla più recente: una prenotazione modificata da qualcuno, un nuovo messaggio nella chat di un viaggio, un calendario condiviso con te. La campanella in alto a destra mostra le dieci più recenti, questa pagina le mostra tutte.",
  'help.guide.read-notifications.step.1':
    'Clicca sulla campanella in alto a destra. Il numero rosso indica quante notifiche non hai ancora letto.',
  'help.guide.filter-notifications.step.1': 'Clicca sulla campanella in alto a destra.',
  'help.guide.mark-notifications-read.step.2':
    'Clicca su «Segna tutto come letto» in alto per segnare tutte le notifiche come lette in una volta.',
  'help.guide.delete-notifications.tip.1':
    "L'eliminazione rimuove la notifica solo per te. La prenotazione, il messaggio o la condivisione a cui si riferiva restano invariati.",
  'help.guide.notification-settings.tip.1':
    "Un lucchetto in una cella indica che l'amministratore ha disattivato quell'evento per tutti.",
  'help.guide.add-guest.tip.3':
    'Solo il proprietario del viaggio può aggiungere, rinominare e rimuovere gli ospiti. Un ospite che ha pagato una spesa non può essere rimosso finché non cambi chi ha pagato o elimini il pagamento.',
  'help.guide.link-journal.tip.1':
    'Puoi collegare solo i diari di cui sei proprietario. Un diario in cui puoi solo scrivere non si può collegare.',
  'help.ctx.trip-places.bullet.7':
    'La spunta accanto alla ricerca avvia una selezione. Con la barra in fondo alla colonna puoi assegnare a più righe una nuova categoria in una volta, aggiungerle a una raccolta, segnarle come visitate o eliminarle.',
  'help.guide.filter-places.step.5':
    "Quando il viaggio tocca più di un paese o regione, il globo filtra l'elenco per un solo paese, o per una regione al suo interno, ciascuno con il suo conteggio. «Cancella filtro» torna a «Tutti i paesi».",
  'help.guide.import-places-file.tip.3':
    'Quando Escursioni è attivo, come da impostazione predefinita, un file si importa tramite «Escursioni» in cima alla colonna, con «Importa GPX o KML», e le sue linee diventano escursioni. I segnaposto del file non vengono importati lì, perché le escursioni contengono solo linee.',
  'help.guide.dawarich-stays.step.3':
    'Controlla «Nome», «Arrivo» e «Partenza», scegli un «Giorno» oppure lascia «Non ancora assegnata a un giorno», aggiungi delle «Note» se vuoi e clicca su «Aggiungi luogo».',
  'help.guide.leave-stop-off-route.result':
    'La tappa fa ancora parte della giornata e del PDF; finché è contrassegnata come «Fuori percorso», il percorso va direttamente dalla tappa precedente a quella successiva.',
  'help.guide.move-booking-day.tip.2':
    "All'interno del suo giorno, una prenotazione con orario torna sempre nella posizione data dal suo orario.",
  'help.guide.place-image-from-file.step.3':
    'Sotto «Dai file allegati», clicca sulla foto che vuoi. «Carica dal dispositivo», sopra, ti permette invece di sceglierne una nuova dal computer.',
  'help.guide.place-own-hours.step.1':
    'Apri il luogo e clicca su «Modifica» in basso a destra nella scheda: si apre il modulo del luogo.',
  'help.guide.place-own-hours.tip.3':
    'Clicca su «Rimuovi orari di apertura», poi su «Aggiorna», per mostrare di nuovo nella scheda gli orari trovati automaticamente.',
  'help.guide.confirm-stay-booking.title': 'Confermare la prenotazione di un soggiorno',
  'help.guide.confirm-stay-booking.tip.2':
    'La stessa pillola funziona in tutte le prenotazioni, anche in quelle sotto «Prenotazioni» nel giorno.',
  'help.guide.map-lock.tip.2':
    'Questo browser ricorda il lucchetto per ogni viaggio. Quando apri un viaggio, la mappa lo inquadra comunque una volta, così non si apre mai su una zona vuota.',
  'help.guide.tour-map-lines.step.2':
    "Clicca sulla linea o sul segnaposto alla sua partenza. La scheda dell'escursione si apre nella parte bassa della mappa, e la sua linea viene disegnata più spessa e con un bordo bianco, così si distingue dalle altre. La X nell'intestazione della scheda la chiude.",
  'help.guide.car-stops.title': 'Pianificare un viaggio in auto con soste lungo il tragitto',
  'help.guide.car-stops.result':
    'Il viaggio in auto è una scheda in «Trasporti» e una riga nel suo giorno, e la sua linea sulla mappa va dal ritiro alla riconsegna passando da tutte le soste, nel loro ordine.',
  'help.guide.transport-details.step.5':
    "«Sulla mappa», in fondo ai dettagli, mostra la linea del tragitto e apre «Pianificato» nel suo giorno. «Modifica», all'estrema destra, apre il modulo completo, e il cestino accanto elimina il tragitto dopo la tua conferma.",
  'help.guide.export-transports-csv.step.1':
    "Se ti serve solo una parte dell'elenco, filtralo prima. «Cerca», «Filtra» e l'ordinamento sotto «Opzioni di visualizzazione» contano tutti: il file contiene ciò che la scheda mostra, nell'ordine in cui lo mostra.",
  'help.guide.group-sort-bookings.tip.1':
    '«Schede» ed «Elenco» hanno ciascuna il proprio raggruppamento: «Schede» parte da «Stato», «Elenco» da «Giorno». Un pallino su «Opzioni di visualizzazione» indica che qualcosa è diverso dal predefinito, e «Reimposta vista» in fondo al pannello ripristina il predefinito.',
  'help.guide.booking-on-map.step.2': 'Clicca su «Sulla mappa» in fondo ai dettagli.',
  'help.guide.export-bookings-csv.goal':
    'Esporta le prenotazioni del viaggio in un file CSV da aprire in Excel, Numbers o qualsiasi altro foglio di calcolo.',
  'help.guide.arrange-packing-list.goal':
    'Sposta liste intere e singoli elementi dove vuoi, oppure visualizza ogni lista in ordine alfabetico.',
  'help.guide.check-off-packing.tip.4':
    'Per un elemento con quantità superiore a uno, puoi anche segnare i pezzi in valigia uno alla volta. Vedi «Mettere in valigia più pezzi dello stesso elemento».',
  'help.guide.count-packed-pieces.tip.1':
    'Spuntando la casella metti in valigia tutti i pezzi in una volta, e togliendo la spunta li togli tutti.',
  'help.guide.expense-receipts.goal':
    'Conserva la ricevuta o la fattura insieme alla spesa a cui si riferisce, e riaprila dal registro.',
  'help.guide.expense-receipts.tip.2':
    'Il cestino accanto a una ricevuta la toglie dalla spesa quando salvi. Il file resta in «File»; eliminalo da lì per rimuoverlo del tutto.',
  'help.guide.files-sync.tip.4':
    "Se la scheda mostra un avviso giallo con «Riconnetti», l'archivio non accetta più le credenziali salvate. Clicca su «Riconnetti», inserisci una nuova password per app o un nuovo token, e la sincronizzazione riparte.",
  'help.guide.files-sync-settings.result':
    'Dalla prossima esecuzione, il viaggio si sincronizza solo nella direzione che hai scelto, ed eliminazioni e modifiche in conflitto vengono gestite secondo le regole che hai impostato.',
  'help.guide.manage-notes.result':
    "La nota sparisce dalla scheda «Note», per tutti i membri contemporaneamente. Una nota che hai solo fissato o modificato resta, e gli altri la vedono come l'hai lasciata.",
  'help.guide.note-categories.step.4':
    'I pallini colorati in una riga impostano il colore di quella categoria: Indaco, «Rosso», «Ambra», Smeraldo, «Blu» o Viola. Qui «Alloggio» diventa ambra.',
  'help.guide.roadtrip-reorder.step.3':
    "Da tastiera, seleziona una tappa e premi Alt con la freccia su o giù per spostarla di una posizione all'interno del suo giorno.",
  'help.guide.roadtrip-overnight.title': 'Pernottare lungo il percorso',
  'help.guide.roadtrip-overnight.tip.1':
    'La notte dura fino al giorno successivo. Per date diverse, modifica la prenotazione: cambia le date in «Giorni», insieme al resto del soggiorno.',
  'help.guide.roadtrip-stop-fill.tip.1':
    'Il badge compare solo nelle soste in cui la tua auto può rifornirsi: soste carburante per «Benzina», soste di ricarica per «Elettrico», entrambe per «Entrambi».',
  'help.guide.roadtrip-bookings.result':
    'Ogni tragitto prenotato compare nel viaggio in auto nel punto in cui avviene, e il percorso prima e dopo va e viene dai suoi terminal.',
  'help.guide.roadtrip-google-import.step.1':
    'Clicca sui tre puntini in cima a «Lungo il percorso» e scegli «Importa percorso Google Maps».',
  'help.guide.roadtrip-hazards.title': 'Mostrare sulla mappa gli avvisi in corso',
  'help.guide.roadtrip-hazards.tip.3':
    "I dati vengono aggiornati ogni dieci minuti e richiedono una connessione. Come le altre impostazioni di guida, l'interruttore viene salvato per il viaggio.",
  'help.ctx.trip-tours.bullet.6':
    "La modifica di un percorso e l'eliminazione di un'escursione si fanno nella scheda «Escursioni», sotto «Escursioni di questo viaggio».",
  'help.guide.tour-show-list.tip.1':
    "Clicca sulla linea di un'escursione sulla mappa: l'elenco evidenzia quell'escursione e scorre fino a lei.",
  'help.guide.tour-add-to-day.step.3':
    "Il messaggio «Aggiunta al giorno 10» lo conferma, la riga riceve un badge del giorno, e nella colonna di sinistra il giorno elenca l'escursione con tempo, distanza e salita.",
  'help.guide.tour-day-times.title': "Assegnare a un'escursione un orario di partenza nel suo giorno",
  'help.guide.tour-day-times.tip.3':
    "«Escludi dal percorso», nello stesso menu, mantiene l'escursione nel giorno ma la esclude dal percorso della giornata sulla mappa. «Riaggiungi al percorso» annulla l'operazione.",
  'help.guide.tour-remove-from-day.tip.1':
    "Un'escursione di più giorni si toglie un giorno alla volta, perché ogni giorno ha la propria tappa.",
  'help.guide.tour-filter-list.step.4':
    'Chiudi il menu. Ora il pulsante mostra lo stato, il numero di escursioni rimaste e +1 per ogni filtro aggiuntivo impostato.',
  'help.guide.tour-hide-on-map.step.2':
    "La linea dell'escursione sparisce dalla mappa. La riga resta nell'elenco, attenuata, e mostra un occhio barrato («Mostra sulla mappa»). Cliccalo per mostrare di nuovo la linea.",
  'help.guide.tour-import-plan-tab.step.2':
    "Clicca su «Importa GPX o KML» in cima all'elenco e scegli i file (GPX, KML o KMZ).",
  'help.ctx.trip-tour-detail.bullet.2':
    "L'intestazione mostra la casella rotonda dell'escursione, il nome con una matita per rinominarla, un pallino colorato per il colore della linea, e le pillole con tipo, origine, tempo previsto, distanza, salita e discesa. La X a destra chiude la scheda, così come il tasto Esc.",
  'help.guide.tour-detail-read.step.3':
    'Punta il tempo per vedere come è composto: tempo in movimento, pause e totale pianificato.',
  'help.guide.tour-detail-read.tip.4':
    "La scheda non modifica il percorso. Per spostare un punto o ridisegnare un tratto, apri la scheda «Escursioni» e clicca sull'escursione sotto «Escursioni di questo viaggio».",
  'help.guide.tour-rename-colour.step.4':
    "Scegli un colore. «Colore automatico», la prima casella, riporta la linea al colore predefinito, e «Scegli colore personalizzato», l'ultima, ti permette di scegliere qualsiasi colore. La linea sulla mappa e la striscia nell'elenco «Escursioni» cambiano subito.",
  'help.guide.tour-take-along.step.3':
    "Clicca su GPX per scaricare l'escursione salvata come file GPX: l'intero percorso con le quote disponibili, pronto per un'app di navigazione o un dispositivo GPS.",
  'help.guide.tour-copy-keep.step.1':
    "Apri la scheda dell'escursione e clicca su «Copia» in fondo. TREK crea una nuova escursione indipendente, senza i giorni, e l'originale resta com'è.",
  'help.guide.tour-copy-keep.result':
    'Il viaggio ha una seconda escursione da modificare liberamente, e la raccolta conserva una copia propria, pronta da aggiungere a un altro viaggio.',
  'help.guide.tour-packing-link.tip.1':
    "È solo un collegamento. Non viene copiato né spostato nulla, e gli elementi restano in «Liste». Se ne spunti uno lì, l'escursione lo mostra subito.",
  'help.guide.tour-files.step.3': 'Clicca su un file per aprirlo.',
  'help.guide.tour-activity-link.step.3':
    'Scegli la registrazione sotto «Traccia», oppure clicca su «Importa GPX» per caricare un nuovo file.',
  'help.guide.tour-activity-compare.goal':
    'Scopri dove la traccia effettiva si discosta dal programma, e cambiala o scollegala.',
  'help.guide.tour-origin-check.title': "Vedere da dove proviene un'escursione",
  'help.guide.tour-origin-check.result':
    "Sai da dove proviene l'escursione, quando è arrivata e se nel frattempo è cambiata.",
  'help.ctx.trip-tour-planner.bullet.6':
    "Una bozza non salvata viene conservata: riapri la scheda «Escursioni» e viene ripristinata, con l'indicazione «Bozza non salvata ripristinata». «Torna alle escursioni» e «Scarta» chiedono conferma prima di scartare le modifiche.",
  'help.guide.tour-open-workspace.step.6':
    "La pillola in basso a sinistra cambia la mappa, all'inizio «Mappa» o Satellite. Con un'escursione aperta offre le mappe del suo tipo, come Topo o «Escursionismo», e interruttori come «Posiziona punti» e 3D.",
  'help.guide.tour-draw-route.step.1':
    "Clicca su «Pianifica nuova escursione» in cima alla barra di sinistra. La barra diventa «Nuova escursione», un'escursione a piedi a meno che tu non scelga un altro tipo.",
  'help.guide.tour-draw-route.tip.3':
    'Se una bozza ha modifiche non salvate, «Pianifica nuova escursione» nel menu «Aggiungi giro» chiede prima «Iniziare una nuova escursione?», con «Scarta e inizia».',
  'help.guide.tour-type-profile.step.4':
    "Il percorso viene ricalcolato per il profilo, e «Riepilogo dell'escursione» a destra ne mostra distanza e tempo.",
  'help.guide.tour-edit-points.step.3':
    "Per cambiare l'ordine, punta una riga e trascinala per la maniglia che compare sul suo bordo sinistro.",
  'help.guide.tour-shaping-points.goal': 'Sposta il percorso su un altro sentiero senza aggiungere una tappa.',
  'help.guide.tour-shaping-points.result':
    "Il percorso passa dove l'hai trascinato, e le tappe hanno la stessa numerazione di prima.",
  'help.guide.tour-loop-reverse.tip.3':
    "In un'escursione a piedi, «Anello dalla partenza», lì accanto, cerca anelli della lunghezza che scegli.",
  'help.guide.tour-leg-by-hand.tip.1':
    'Nessun router ha verificato un tratto disegnato a mano: potrebbe attraversare acqua, terreni privati o una parete rocciosa.',
  'help.guide.tour-trip-places.step.4':
    'Sotto il nome, la riga indica «Luogo del viaggio». «Scollega dal luogo», in «Altre azioni», mantiene il punto ma toglie il collegamento.',
  'help.guide.tour-details-times.step.2':
    "Sotto «Dettagli», scrivi una «Descrizione» e aggiungi un «Sito web», se c'è.",
  'help.guide.tour-save.goal': "Conserva nel viaggio l'escursione che hai disegnato.",
  'help.guide.tour-save.result': "L'escursione è salvata nel viaggio, pronta da assegnare a un giorno.",
  'help.guide.tour-edit-saved.tip.2':
    "Una traccia GPX o KML importata si apre come «Escursione GPX», in sola visualizzazione. Lì, «Pianifica una versione modificabile» crea un'escursione che puoi modificare.",
  'help.guide.tour-summary-profile.step.4':
    '«Comprimi profilo altimetrico», la freccia accanto al titolo, nasconde il profilo; cliccala di nuovo per mostrarlo.',
  'help.guide.tour-list-manage.step.2':
    "Punta un'escursione e clicca sul più rotondo nella sua riga, «Aggiungi al giorno», per aprire i giorni del viaggio.",
  'help.guide.tour-delete.title': "Eliminare un'escursione",
  'help.guide.tour-saved-elsewhere.title': "Se l'escursione è stata salvata altrove",
  'help.guide.tour-saved-elsewhere.result': 'Nessuna modifica va persa, a meno che qualcuno non scelga di scartarla.',
  'help.guide.tour-import-gpx.title': 'Importare un file GPX, KML o KMZ come escursione',
  'help.guide.tour-import-gpx.tip.2':
    "Ogni traccia o percorso di un file diventa un'escursione a sé. Le tracce non vengono mai unite.",
  'help.guide.tour-view-import.step.2':
    "La colonna di sinistra la mostra come «Escursione GPX»: «Riepilogo dell'escursione» con distanza, quote e tempo registrato, e sotto il profilo altimetrico. La mappa ne mostra la linea.",
  'help.guide.tour-plan-from-import.step.1':
    "Apri l'escursione importata nella scheda «Escursioni». Nella scheda «Versione modificabile» a sinistra, clicca su «Pianifica una versione modificabile».",
  'help.guide.tour-plan-from-import.result':
    "Ora l'escursione ha waypoint che puoi trascinare, e la sua «Origine» indica «Ripianificato, traccia registrata conservata».",
  'help.guide.tour-restore-recorded.result':
    "L'escursione è di nuovo un'«Escursione GPX» e mostra la linea con cui è stata registrata.",
  'help.guide.tour-take-over.step.6': 'Clicca su «Riprendi».',
  'help.guide.tour-import-wanderer.step.2':
    "Scrivi in «Cerca sentieri». «Cerca in quest'area della mappa» mostra solo i sentieri nella parte di mappa visibile.",
  'help.ctx.trip-tour-map.title': "Mappa dell'escursione",
  'help.guide.tour-map-layers.goal':
    'Pianifica sulla mappa più adatta al tipo di escursione: curve di livello per le salite, sentieri segnalati o piste ciclabili, oppure immagini aeree.',
  'help.guide.tour-along-search.title': "Trovare luoghi lungo un'escursione",
  'help.guide.tour-along-search.tip.1':
    "Dopo che modifichi il percorso, le tipologie o la distanza, «Cerca di nuovo» viene evidenziato e segnala che l'elenco si riferisce al percorso precedente. Cliccalo per aggiornare l'elenco.",
  'help.guide.tour-along-add-stop.step.4':
    "Il percorso viene ricalcolato passando dal luogo, e «Lungo il percorso» indica quanta distanza e quanto tempo si sono aggiunti all'escursione. «Annulla», nella stessa riga, rimuove di nuovo la sosta.",
  'help.guide.tour-3d-terrain.step.2':
    "Il percorso è colorato in base alla pendenza. Clicca su «Pendenza» nella riga in basso per disegnarlo invece nel colore dell'escursione, e cliccalo di nuovo per tornare alle pendenze.",
  'help.guide.tour-3d-flyover.title': "Sorvolare un'escursione",
  'help.guide.tour-3d-flyover.tip.2':
    "Il sorvolo parte solo quando il paesaggio lungo tutto il percorso è stato caricato, così non si ferma a metà per caricare i dati della mappa. Punta l'anello per vedere quanto è stato caricato.",
  'help.guide.tour-map-overlays.result':
    'Le piste o i segnali nautici compaiono sopra la mappa, e la legenda li spiega.',
  'help.ctx.trip-tour-stages.bullet.3':
    "«Riepilogo dell'escursione» elenca tutte le tappe sotto «Tappe», dalla sosta in cui iniziano a quella in cui finiscono. Un clic su una tappa ne seleziona l'ultima sosta e segna il punto sul profilo altimetrico.",
  'help.guide.tour-multi-day.step.4':
    "Ora «Waypoint» si divide in Tappa 1 e Tappa 2, ciascuna con distanza e tempo. La sosta che chiude una tappa mostra l'icona della luna.",
  'help.guide.tour-stages-on-days.title': "Assegnare un'escursione di più giorni ai giorni del viaggio",
  'help.guide.tour-stages-on-days.tip.1':
    "Se il viaggio finisce prima dell'ultima tappa, l'opzione indica l'ultima tappa che ci sta. Le tappe successive restano senza giorno.",
  'help.ctx.trip-tour-hike.bullet.2':
    "«Waypoint» elenca le tappe in ordine. «Aggiungi punto» è attivo fin dall'inizio, quindi un clic sulla mappa inserisce la tappa successiva; «Luoghi del viaggio», lì accanto, trasforma in tappa un rifugio o un hotel del viaggio.",
  'help.guide.tour-hike-plan.step.2':
    'Apri «Tipo di tour» e scegli «Escursione a piedi»: a piedi, entro una difficoltà che imposti tu.',
  'help.guide.tour-hike-plan.tip.3':
    "«Scelta del percorso», sotto la difficoltà, imposta delle preferenze per il tracciato: «Evita salite ripide», «Evita le scale» ed «Evita i traghetti». Se non c'è alternativa, il percorso ci passa comunque.",
  'help.guide.tour-hike-trail-details.step.5':
    "Clicca su «Fondo» per vedere lo stesso percorso in base al terreno su cui cammini, dall'asfalto al terreno naturale e alla roccia.",
  'help.guide.tour-hike-round.step.2':
    "Sopra la mappa si apre la scheda «Escursione ad anello». Controlla la partenza sotto «Da» e inserisci la «Distanza» che vuoi. La pillola accanto mostra l'intervallo di lunghezze possibili per un anello.",
  'help.guide.tour-hike-compare-ways.title': "Confrontare alternative per un tratto di un'escursione",
  'help.guide.tour-hike-compare-ways.tip.2':
    "Se il router non conosce alternative, la scheda lo segnala. Se il router non riesce a seguire la via che hai scelto, il tratto resta com'è e la scheda te lo dice.",
  'help.guide.tour-ferrata-add.step.5':
    "«Riepilogo dell'escursione» a destra mostra il badge «Ferrata» con la sua difficoltà, e l'intestazione dell'editor avverte «Il percorso passa per una via ferrata».",
  'help.guide.tour-run-plan.step.1': 'Clicca su «Pianifica nuova escursione», apri «Tipo di tour» e scegli «Corsa».',
  'help.guide.tour-run-plan.tip.3': 'Se le tue distanze sono in miglia, anche il ritmo è espresso per miglio.',
  'help.guide.tour-run-ways.tip.1': 'Niente qui modifica il percorso o il tempo della corsa.',
  'help.ctx.trip-tour-walk.bullet.5':
    '«Aggiungi giro» in «Escursioni di questo viaggio» importa un percorso a piedi condiviso da Google Maps. Nella scheda «Pianificato», una passeggiata aperta dal suo giorno ti permette di spuntarne le tappe per quel giorno.',
  'help.guide.tour-walk-plan.step.6':
    "«Riepilogo dell'escursione» a destra mostra «Tempo stim.», «Soste» e «In programma», cioè la somma dei due. Clicca su «Salva» in fondo alla colonna di sinistra per conservare la passeggiata.",
  'help.guide.tour-walk-sights.step.2':
    'Il tema compila «Cosa cercare». Aprilo per attivare o disattivare le tipologie, e scegli fino a che distanza cercare in «Entro questa distanza dal percorso».',
  'help.guide.tour-walk-day-times.title': 'Vedere orari di arrivo e di apertura della giornata',
  'help.guide.tour-walk-day-times.tip.3':
    'Gli orari di apertura provengono da OpenStreetMap o dal luogo del viaggio a cui corrisponde la tappa, e la pillola accanto indica quale. Controllali prima di partire.',
  'help.guide.tour-walk-google-import.step.4':
    'Clicca su «Carica come passeggiata». TREK calcola da solo il percorso a piedi tra le tappe. Clicca su «Salva» per conservare la passeggiata.',
  'help.guide.tour-walk-check-off.step.2':
    'Scorri fino a «Tappe del percorso». Ogni tappa mostra quanto ti fermi e, se la passeggiata ha un orario di partenza, a che ora arrivi.',
  'help.ctx.trip-tour-bike.summary':
    "Un giro in bici aperto nell'editor della scheda «Escursioni»: il profilo per cui è calcolato, il tempo in sella, il tipo di fondo del percorso e, per un giro in mountain bike, la difficoltà dei sentieri.",
  'help.guide.tour-bike-profile.step.2': 'Apri il campo «Tipo di tour» e scegli «Escursione in bici».',
  'help.guide.tour-bike-profile.tip.3':
    'Se nessuna strada percorribile in bici arriva vicino a un punto, la barra mostra «No way for bikes reaches point N». Sposta il punto, oppure apri «Altre azioni» sul punto precedente e scegli «Disegna a mano il tratto successivo».',
  'help.guide.tour-bike-surfaces.step.4':
    'Sotto «Tipo di percorso», clicca su una riga come «Strada agricola o forestale» o «Strada trafficata» per vedere dove il percorso passa su quel tipo di via.',
  'help.guide.tour-bike-mtb-grades.step.1':
    "Apri il giro in bici nell'editor e verifica che il «Profilo» sia impostato su MTB. Le difficoltà dei sentieri vengono lette solo con quel profilo.",
  'help.ctx.trip-tour-ski.title': 'Escursioni di sci e invernali',
  'help.guide.tour-ski-plan.goal':
    "Pianifica una giornata sulle piste, un anello di fondo, un'escursione di scialpinismo o un'uscita con le ciaspole lungo piste, impianti e sentieri mappati.",
  'help.guide.tour-ski-plan.tip.2':
    'Il pallino informativo accanto a «Disciplina» spiega cosa fa TREK con le escursioni di sci. Né lì né altrove si dice qualcosa su neve, valanghe o apertura di piste, impianti e sentieri.',
  'help.guide.tour-ski-options.step.3':
    'Sotto «Preferisci», scegli «La più veloce», «Più sci» o «Più facile». Sotto «Ritmo», scegli «Tranquillo», «Normale» o «Sportivo»: cambia il tempo che il router assegna a ogni pista.',
  'help.guide.tour-ski-fix-leg.goal': 'Fai pianificare con un clic un tratto rosso, oppure traccialo in linea retta.',
  'help.guide.tour-ski-fix-leg.result':
    'Nessun tratto è più rosso: ognuno segue le piste o va dritto tra i suoi punti.',
  'help.guide.tour-ski-summary.tip.3':
    "Un'escursione salvata si apre così come è stata salvata. Sposta un punto o cambia un'opzione per ricalcolarla con i dati aggiornati delle piste.",
  'help.guide.tour-ski-pistes-layer.tip.1':
    "Se l'interruttore resta in grigio e indica «Ingrandisci la mappa per vedere le piste», ingrandisci sul comprensorio sciistico.",
  'help.guide.tour-ski-import.step.3':
    'Scegli la «Disciplina» e, per «Sci di fondo», la «Tecnica». Finché non lo fai, la finestra mostra «Choose a discipline to import the track as ski».',
  'help.ctx.trip-tour-paddle.title': 'Uscite in pagaia',
  'help.guide.tour-paddle-setup.title': "Pianificare un'uscita in pagaia",
  'help.guide.tour-paddle-setup.step.7':
    'Verifica che «Aggiungi punto» sia attivo, poi clicca sulla mappa: prima il punto in cui metti in acqua, poi gli eventuali punti lungo il tragitto e infine il punto di sbarco.',
  'help.guide.tour-paddle-water-route.step.1':
    "Un tratto disegnato a mano mostra «Disegnato a mano, non calcolato» sotto il suo punto, con la lunghezza. TREK mantiene la linea così come l'hai disegnata.",
  'help.guide.tour-paddle-water-route.tip.4':
    "Non puoi salvare finché c'è un tratto non pianificato. Prima pianificalo sull'acqua o disegnalo a mano.",
  'help.guide.tour-paddle-portage.step.5':
    'Sotto «Sbarco e reimbarco», inserisci i minuti che ti servono per scendere, scaricare e rimettere in acqua. Se lasci vuoto, TREK usa 10 minuti.',
  'help.guide.tour-paddle-lock.step.2':
    'Scegli «Chiusa in questo punto». Sotto il punto compare una scheda «Chiusa», contrassegnata con «Tempo mancante».',
  'help.guide.tour-paddle-time.goal':
    'Vedi come si sommano tempo in acqua, trasporto, chiuse e pause, e imposta i tuoi valori.',
  'help.guide.tour-paddle-time.tip.3':
    'Le pause e un tuo totale pianificato si impostano sotto «Dettagli». Con un totale pianificato, la scheda mostra «La tua durata pianificata» accanto alla stima.',
  'help.guide.tour-paddle-wind.tip.1':
    'Le previsioni sono disponibili solo per i prossimi 16 giorni. Per un giorno più lontano, la scheda indica da quale data saranno disponibili. Per un giorno passato, indica che è già passato.',
  'help.guide.tour-paddle-checklist.step.2':
    "La riga sotto indica quanto sono aggiornati i dati: «Aggiornamento OSM» per OpenStreetMap, «Recuperati» per quando TREK li ha letti, e «Dati sugli ostacoli» se non coprono l'intero percorso.",
  'help.guide.tour-paddle-checklist.tip.5':
    "Una lista di controllo non è un'approvazione di sicurezza né un'autorizzazione legale. La tua decisione non elimina un divieto o un terreno privato registrati in OpenStreetMap.",
  'help.guide.tour-paddle-track-marks.step.5':
    'Clicca su «Trasbordo», poi clicca sulla linea nel punto in cui sei sceso e in quello in cui hai rimesso in acqua.',
  'help.ctx.trip-tour-horse.summary':
    "Per un'uscita a cavallo non viene mai calcolato il percorso. Si compone di sezioni dei percorsi equestri segnalati presenti in OpenStreetMap, unite da tratti che disegni a mano, oppure resta esattamente come l'hai registrata.",
  'help.guide.tour-horse-plan.step.1':
    'Inquadra sulla mappa la zona in cui vuoi cavalcare, poi clicca su «Pianifica nuova escursione» in cima alla colonna di sinistra.',
  'help.guide.tour-horse-plan.tip.1':
    'Un percorso equestre non dà il permesso di percorrerlo. «Accesso a cavallo» mostra solo ciò che riportano i tag di OpenStreetMap. Rispetta sempre la segnaletica sul posto.',
  'help.guide.tour-horse-gap.step.2':
    'Attiva «Collega con un tratto manuale». Il vuoto viene colmato con una linea retta non verificata.',
  'help.guide.tour-horse-recorded.goal':
    "Importa un'uscita registrata con un dispositivo GPS o un'app, e conservala esattamente come l'hai percorsa.",
  'help.guide.tour-horse-recorded.tip.3':
    'Puoi anche trascinare il file in qualsiasi punto della scheda «Escursioni» per aprire la stessa anteprima.',
  'help.guide.create-trip.tip.3':
    'Sotto «Compagni di viaggio» puoi aggiungere persone che hanno già un account qui. Diventano membri del viaggio appena viene creato.',
  'help.guide.trip-reminder.step.1':
    'Clicca sulla matita nella scheda del viaggio. Per un nuovo viaggio, il modulo «Nuovo Viaggio» ha la stessa sezione.',
  'help.guide.company-holidays.tip.2':
    'Una giornata intera di ferie aziendali elimina le ferie già registrate in quel giorno, così nessuno consuma giorni di disponibilità.',
  'help.guide.half-company-holiday.tip.2':
    'Clicca di nuovo sul giorno con le stesse impostazioni per toglierlo, oppure con «Mezza giornata» disattivata per trasformarlo in una giornata intera di ferie aziendali.',
  'help.guide.edit-holiday-calendar.step.1':
    'Apri «Impostazioni» e cerca il calendario sotto «Festività pubbliche» o «Vacanze scolastiche».',
  'help.guide.person-color.goal': 'Assegna a te stesso o a chi pianifica con te un colore più facile da distinguere.',
  'help.guide.answer-fusion-request.tip.2':
    "In seguito ciascuno di voi può sciogliere l'unione, e le vostre voci vengono conservate.",
  'help.guide.log-for-partner.tip.2':
    "L'altra persona vede subito la modifica, e la sua riga in «Disponibilità» si aggiorna all'istante.",
  'help.guide.country-places.title': 'Vedere tutti i luoghi di un paese',
  'help.guide.tour-activity-stats.step.1':
    'Nel pannello in fondo alla mappa, apri la scheda «Escursioni» accanto a «Statistiche» e «Lista desideri».',
  'help.guide.tour-activity-stats.tip.2':
    "Collega la traccia che hai percorso davvero con «Aggiungi traccia effettiva» nei dettagli dell'escursione: qui i valori registrati sostituiranno quelli pianificati. Un'escursione pianificata su più giorni viene contata una volta sola.",
  'help.ctx.collections.bullet.7':
    "Escursioni salvate: le escursioni salvate da un viaggio sono le prime righe di una lista, con difficoltà, tipo, viaggio di provenienza e misure. «Aggiungi a un viaggio» crea una nuova escursione a partire da una di queste, e l'icona del cestino la toglie dalla lista.",
  'help.guide.move-to-list.title': "Spostare o duplicare luoghi in un'altra lista",
  'help.guide.copy-to-trip.tip.2': 'I luoghi già presenti nel viaggio vengono saltati, e TREK indica quanti.',
  'help.guide.accept-list-invite.tip.2':
    'Clicca su «Condivisa» in cima alla lista per vederne i membri. Da lì, «Abbandona lista» ti permette di uscire dalla lista.',
  'help.guide.tour-collection-add-to-trip.goal':
    "Crea una nuova escursione in uno dei tuoi viaggi a partire da un'escursione salvata in una lista, con o senza i suoi waypoint.",
  'help.guide.tour-collection-add-to-trip.result':
    "La finestra conferma che l'escursione ora appartiene a quel viaggio. «Apri il viaggio» ti porta lì, «Chiudi» ti lascia in «Raccolte».",
  'help.guide.tour-collection-manage.tip.3':
    'Le escursioni salvate compaiono solo nella loro lista, non in «Tutti i salvati».',
  'help.guide.search-journey.step.3':
    'Clicca su un giorno per scorrere fin lì, oppure sulla sua freccia per vedere le voci di quel giorno e sceglierne una.',
  'help.guide.journey-map-layers.goal':
    'Vedi la differenza tra il programma e ciò che è successo davvero, e attiva o disattiva i livelli.',
  'help.guide.journey-keep-route.goal':
    'Aggiungi alla mappa del diario il percorso reale di un giorno preso da Dawarich, e conservalo lì.',
  'help.guide.journey-day-stays.goal': 'Trasforma in voci, una alla volta, le soste registrate da Dawarich.',
  'help.guide.journey-take-over-day.goal':
    'Trasforma in un solo passaggio le soste di un giorno in bozze di voci, oppure in un unico resoconto del giorno.',
  'help.guide.journey-auto-prepare.title': 'Far preparare a TREK i giorni registrati',
  'help.guide.photo-location.title': 'Posizionare le voci dove sono state scattate le foto',
  'help.ctx.settings-about.summary':
    "Cos'è TREK, la versione installata su questo server e dove trovare il progetto: la documentazione, dove segnalare un bug e i modi per sostenere il progetto.",
  'help.guide.startup.tip.2': 'Una scheda iniziale che appartiene a un modulo disattivato apre invece il programma.',
  'help.guide.web-push-device.title': 'Ricevere notifiche push su questo dispositivo',
  'help.guide.connect-airtrail.tip.1': "La scheda compare solo se l'amministratore ha attivato il modulo AirTrail.",
  'help.guide.connect-dawarich.tip.1':
    'TREK si limita a suggerire voci, luoghi e paesi; non viene aggiunto nulla finché non confermi, e non viene scritto nulla su Dawarich.',
  'help.guide.tour-connect-wanderer.tip.1':
    "La scheda compare solo se l'amministratore consente wanderer nella sezione Escursioni.",
  'help.guide.tour-wanderer-watch.tip.1':
    "Una segnalazione non modifica mai un'escursione; il controllo della fonte dell'escursione mostra cosa è cambiato davvero.",
  'help.guide.api-keys.tip.3':
    'Invia la chiave come Authorization: Bearer o X-API-Key a /api/v1. Un account può avere fino a 10 chiavi.',
  'help.guide.plugin-settings.step.2':
    '«Attività dei plugin» elenca ogni azione che un plugin ha eseguito per conto tuo, dalla più recente; «Aggiorna» carica le ultime.',
  'help.ctx.admin-github.bullet.3':
    '«Informazioni»: Ko-fi, Buy Me a Coffee, Discord, «Segnala un bug», «Richiedi funzionalità» e il Wiki.',
  'help.guide.default-user-settings.goal':
    'Assegna a ogni account unità di misura, modalità colore e valuta adeguate, senza che nessuno debba aprire le impostazioni.',
  'help.guide.default-map.step.3':
    'Ogni campo si salva quando lo lasci. Il link «ripristina» accanto al nome di un campo riporta il valore predefinito di TREK.',
  'help.guide.own-routing-engine.tip.2':
    'Se imposti solo il tuo motore di percorso, non viene usato nemmeno il Valhalla pubblico. Il link «ripristina» accanto a un campo lo svuota di nuovo.',
  'help.guide.admin-passkeys.step.1':
    'Nella scheda «Impostazioni», sotto «Accesso con passkey», attiva «Abilita accesso con passkey».',
  'help.guide.storage-backends.step.4':
    '«Salute», in alto, elenca le scritture non riuscite verso una destinazione mirror. Se indica «Nessun errore di replica registrato.», funziona tutto.',
  'help.guide.channels-instance.tip.3':
    'Web Push richiede HTTPS. Su iPhone e iPad, gli utenti devono prima aggiungere TREK alla schermata Home.',
  'help.guide.notification-defaults.step.1':
    'Nella scheda «Notifiche», scorri fino a «Impostazioni predefinite per gli utenti» in fondo. Ogni riga è un evento, ogni colonna un canale.',
  'help.ctx.notifications.bullet.1':
    'La campanella in alto a destra indica quante notifiche non hai ancora letto. Cliccala per vedere le dieci più recenti, e clicca su «Vedi tutte le notifiche» in fondo per aprire questa pagina.',
  'help.guide.read-notifications.step.2':
    'Il pannello elenca le dieci notifiche più recenti. Ognuna indica chi ha fatto cosa e dove, e quelle non lette hanno lo sfondo colorato.',
  'help.guide.filter-notifications.step.2': 'In fondo al pannello, clicca su «Vedi tutte le notifiche».',
  'help.guide.mark-notifications-read.tip.1': 'Anche aprire una notifica con il suo pulsante la segna come letta.',
  'help.guide.delete-notifications.tip.2':
    'Una notifica eliminata non si può recuperare. Per nascondere una notifica ma conservarla, segnala come letta e usa «Non lette».',
  'help.guide.notification-settings.tip.2':
    'Non ci sono impostazioni per singolo viaggio: ogni interruttore vale per tutti i tuoi viaggi.',
  'help.guide.link-journal.title': 'Collegare un diario al viaggio',
  'help.guide.link-journal.tip.2':
    'Da quel momento, anche le persone a cui dai accesso vedono il diario nel proprio elenco dei diari.',
  'help.ctx.trip-places.bullet.8':
    "Con Dawarich collegato, «Da Dawarich» in cima all'elenco mostra le soste registrate da Dawarich durante il viaggio. «Aggiungi come luogo» trasforma una sosta in un luogo. «Non è un luogo che ho visitato» la toglie dall'elenco.",
  'help.guide.dawarich-stays.step.4':
    "Se una sosta non era una vera visita, clicca su «Non è un luogo che ho visitato», la x accanto, per toglierla. «Mostra … già gestiti», in fondo all'elenco, mostra le soste che hai aggiunto o tolto. «Ripristina» riporta nell'elenco una sosta tolta.",
  'help.guide.leave-stop-off-route.tip.1':
    "L'opzione è disponibile solo per le tappe con coordinate, e vale solo per questo giorno: lo stesso luogo in un altro giorno resta nel percorso.",
  'help.guide.move-booking-day.title': 'Spostare una prenotazione a un altro giorno',
  'help.guide.place-image-from-file.step.4':
    "Ora la foto è l'immagine del luogo. Clicca sulla piccola X rossa nell'angolo per toglierla.",
  'help.guide.place-own-hours.step.2': 'Sotto «Sito web», compila «Telefono» ed email, se li conosci.',
  'help.guide.add-accommodation.tip.4':
    "Più rapido: il + nell'intestazione del giorno, con il suggerimento «Aggiungi al giorno», contiene «Aggiungi alloggio». Apre il giorno con questo modulo già aperto.",
  'help.guide.confirm-stay-booking.goal':
    "Segna come confermata la prenotazione dell'hotel di un soggiorno, direttamente dal giorno.",
  'help.guide.map-whole-trip.tip.4':
    "La scelta di mostrare l'intero viaggio viene salvata nel tuo account per ogni viaggio, così il viaggio si apre allo stesso modo anche in un altro browser.",
  'help.guide.tour-map-lines.step.3':
    "Apri nella colonna dei giorni un giorno in cui c'è l'escursione: l'escursione entra nel percorso della giornata, che arriva al punto di partenza dell'escursione e prosegue dal suo arrivo.",
  'help.guide.car-stops.goal':
    "Indica per un'auto a noleggio o per la tua auto il ritiro, la riconsegna e i luoghi in cui ti fermi lungo la strada.",
  'help.guide.car-stops.tip.1':
    "Non esiste un tipo separato per il noleggio: sia un'auto a noleggio sia la tua auto sono di tipo «Auto».",
  'help.guide.transport-details.result':
    "«Pianificato» è aperto sul giorno del tragitto, con la sua linea disegnata sulla mappa e l'icona del percorso attiva nella sua riga.",
  'help.guide.export-transports-csv.step.2':
    "Clicca sull'icona del foglio di calcolo dopo «Opzioni di visualizzazione», con il suggerimento «Esporta come foglio di calcolo (CSV)».",
  'help.guide.group-sort-bookings.title': 'Raggruppare e ordinare le prenotazioni',
  'help.guide.group-sort-bookings.tip.2':
    "In «Cronologia» lo stesso pulsante contiene «Una corsia per tipo» e «Mostra l'altra scheda».",
  'help.guide.booking-on-map.result':
    'Il dettaglio si chiude e si apre la scheda «Pianificato» sul giorno della prenotazione, con il suo luogo selezionato sulla mappa.',
  'help.guide.export-bookings-csv.step.1':
    'Per esportare solo una parte della scheda, restringila prima con «Cerca» o «Filtra». Il file contiene esattamente ciò che la scheda mostra.',
  'help.guide.import-booking-file.tip.4':
    'Per leggere una conferma serve una connessione. Offline, «Importa» te lo segnala, e puoi riprovare quando TREK torna online.',
  'help.guide.arrange-packing-list.step.1':
    "Trascina la maniglia all'estremità sinistra dell'intestazione di una lista, prima del pallino colorato, e rilascia la lista su un'altra scheda. Un bordo nel tuo colore d'accento evidenzia la scheda di destinazione, e la lista prende il posto di quella scheda per tutti i partecipanti al viaggio.",
  'help.guide.count-packed-pieces.title': 'Mettere in valigia più pezzi dello stesso elemento',
  'help.guide.count-packed-pieces.tip.2':
    'Con «Tracciamento valigia» attivo, «In valigia» nella scheda «Valigie» conta solo i pezzi già conteggiati.',
  'help.guide.packing-bags.tip.4':
    'Il peso di una borsa portata da più persone viene diviso in parti uguali tra loro sotto «Per persona». Questo peso è sottolineato con una linea tratteggiata e, quando lo punti, mostra una nota che lo spiega.',
  'help.guide.expense-receipts.step.1':
    "Clicca sulla matita accanto alla riga della spesa. Si apre l'editor della spesa, con «Ricevute e fatture» verso il fondo.",
  'help.guide.expense-receipts.tip.3':
    'Per allegare servono una connessione e il permesso di caricare file, perché la ricevuta viene salvata tra i file del viaggio.',
  'help.guide.files-sync-settings.title': 'Scegliere la direzione di sincronizzazione dei documenti',
  'help.guide.files-sync-settings.tip.1':
    "Una corsia resta sempre attiva: cliccare sull'unica corsia ancora attiva non ha alcun effetto.",
  'help.guide.manage-notes.title': 'Leggere, fissare e modificare una nota',
  'help.guide.manage-notes.tip.1':
    '«Espandi» compare nel menu solo se la nota contiene del testo. Un membro che non può modificare «Collaborazione» vede solo «Espandi».',
  'help.guide.note-categories.step.5':
    'Clicca su «Salva». Tutte le note di una categoria rinominata o con un nuovo colore cambiano subito, per tutti i membri. «Annulla» scarta le modifiche.',
  'help.guide.trip-chat.tip.5':
    'La chat mostra prima i messaggi più recenti. «Carica messaggi precedenti», in cima alla chat, carica quelli meno recenti.',
  'help.guide.roadtrip-reorder.result':
    "Le tappe sono nell'ordine che hai scelto, e distanza, tempo di guida e orari di arrivo di ogni giorno modificato vengono ricalcolati.",
  'help.guide.roadtrip-overnight.goal':
    'Trova un posto dove dormire lungo la strada e aggiungi la notte al tragitto come prenotazione.',
  'help.guide.roadtrip-overnight.tip.2':
    'Se trasformi di nuovo una notte prenotata in «Sosta», da «Modifica» nella sua scheda, TREK chiede prima «Rimuovere il pernottamento?». «Rendi una pausa» elimina la notte, con la prenotazione e le eventuali spese collegate, e mantiene la sosta nel tragitto.',
  'help.guide.roadtrip-stop-fill.tip.2':
    'Se scegli il valore che la sosta ha già, la sosta torna al tuo valore predefinito.',
  'help.guide.roadtrip-bookings.tip.1':
    "L'orario al terminal viene anticipato rispetto all'orario ufficiale per tenere conto del check-in: un'ora per un volo o una crociera, mezz'ora per un traghetto, dieci minuti per un treno o un autobus.",
  'help.guide.roadtrip-google-import.step.2':
    'Incolla il link di un percorso condiviso da Google Maps e clicca su «Anteprima».',
  'help.guide.roadtrip-hazards.goal':
    'Visualizza sulla mappa gli avvisi meteo e le allerte per calamità lungo il tuo tragitto.',
  'help.ctx.trip-tours.title': 'Escursioni nel programma',
  'help.guide.tour-show-list.title': 'Mostrare le escursioni del viaggio nel programma',
  'help.guide.tour-show-list.tip.2':
    "Non hai ancora escursioni? «Importa GPX o KML» in cima all'elenco importa un file, e «Pianifica nuova escursione» nella scheda «Escursioni» ne crea una nuova.",
  'help.guide.tour-add-to-day.step.4':
    "Oppure trascina la riga fuori dall'elenco e rilasciala su un giorno nella colonna di sinistra. Se la rilasci tra due tappe, viene inserita lì.",
  'help.guide.tour-day-times.goal':
    "Scopri quando finisce un'escursione e se si sovrappone a ciò che segue in quella giornata.",
  'help.guide.tour-day-times.tip.4':
    "«Salva nella raccolta», nello stesso menu, salva l'escursione in una raccolta con il suo percorso, come il pulsante «Raccolta» della scheda.",
  'help.guide.tour-remove-from-day.tip.2':
    "In questi menu e nella scheda non c'è «Elimina». Le escursioni si eliminano nella scheda «Escursioni», con il cestino nella loro riga sotto «Escursioni di questo viaggio».",
  'help.guide.tour-filter-list.tip.1':
    '«Limite di percorso» è la difficoltà massima consentita durante la pianificazione del percorso, non la difficoltà misurata sul sentiero.',
  'help.guide.tour-hide-on-map.step.3':
    "Finché ci sono escursioni nascoste, una riga sopra l'elenco indica «Nascosto sulla mappa», con il loro numero. «Mostra tutti» le rimette tutte sulla mappa in una volta.",
  'help.guide.tour-import-plan-tab.step.3':
    "L'«Anteprima dell'importazione» mostra ogni traccia prima di salvare qualsiasi cosa. Sotto «Importa come», scegli il tipo («Escursione a piedi», «Escursione in bici» e così via), poi clicca su «Importa 1 escursione».",
  'help.ctx.trip-tour-detail.bullet.3':
    "Sotto si trovano «Giorni del viaggio», con una casella per ogni giorno in cui è pianificata l'escursione, le misure con il profilo altimetrico e poi, se presenti: le tappe di una passeggiata urbana, i controlli e il vento di un'uscita in pagaia, «Traccia effettiva», «Lista valigia», «Descrizione», «Note», «Origine» e «File».",
  'help.guide.tour-detail-read.step.4':
    "«Giorni del viaggio» mostra una casella con la data per ogni giorno in cui è pianificata l'escursione. Se indica che non è ancora in nessun giorno del viaggio, l'escursione non è ancora pianificata.",
  'help.guide.tour-detail-read.tip.5':
    "Sul telefono la scheda si apre come un pannello dal basso, per leggerla e per portare l'escursione con te.",
  'help.guide.tour-rename-colour.tip.1':
    "Nome e colore appartengono al viaggio, quindi li vedono tutti i partecipanti. Per nascondere un'escursione solo sulla tua mappa senza cambiarla per gli altri, usa l'occhio nell'elenco «Escursioni».",
  'help.guide.tour-take-along.tip.1':
    "Su un dispositivo che può condividere file, accanto a GPX compare «Condividi», che invia lo stesso file direttamente a un'altra app.",
  'help.guide.tour-copy-keep.step.2':
    "La copia si apre subito, con il nome dell'originale seguito da (copia). Clicca sulla matita per darle un nome proprio.",
  'help.guide.tour-packing-link.title': "Collegare un'escursione alla lista valigia",
  'help.guide.tour-packing-link.tip.2':
    "«Cambia», nell'intestazione della sezione, collega l'escursione a un'altra lista. «Rimuovi collegamento», in quella finestra, toglie il collegamento, e la lista resta invariata.",
  'help.guide.tour-files.tip.1': 'I file sono anche file del viaggio, quindi compaiono anche nella scheda «File».',
  'help.guide.tour-activity-link.step.4': 'Controlla i valori misurati sotto «Effettivo», poi clicca su «Collega».',
  'help.guide.tour-activity-compare.step.1':
    "Apri la scheda dell'escursione. «Piano ed effettivo» mette a confronto «Distanza», «Dislivello positivo», «Dislivello negativo» e «Tempo con pause» del programma con quelli della traccia, con la «Differenza».",
  'help.guide.tour-origin-check.goal':
    "Scopri se un'escursione è stata disegnata in TREK o importata, da quale file, e se è stata modificata da allora.",
  'help.ctx.trip-tour-planner.title': 'Escursioni',
  'help.guide.tour-open-workspace.title': 'Orientarsi nella scheda «Escursioni»',
  'help.guide.tour-open-workspace.step.7':
    "Clicca su un'escursione nella barra di destra. Un'escursione pianificata in TREK si apre nell'editor. Una traccia importata si apre invariata, come «Escursione GPX», in sola visualizzazione.",
  'help.guide.tour-draw-route.step.2':
    "Scrivi il punto di partenza dell'escursione in «Cerca luogo o indirizzo» e scegli il risultato: la mappa si sposta lì.",
  'help.guide.tour-draw-route.tip.4':
    "Una bozza non salvata viene conservata. Riapri la scheda «Escursioni» del viaggio e viene ripristinata, con l'indicazione «Bozza non salvata ripristinata».",
  'help.guide.tour-type-profile.tip.1':
    'Un cambio di tipo conta come un passaggio nella cronologia: «Annulla modifica al punto di passaggio», in cima alla barra, ripristina il tipo precedente e il suo percorso.',
  'help.guide.tour-edit-points.step.4':
    'In alternativa apri «Altre azioni» (i tre puntini) sulla riga e scegli «Sposta punto di passaggio in alto» o «Sposta punto di passaggio in basso».',
  'help.guide.tour-shaping-points.step.1':
    'Clicca sul percorso disegnato sulla mappa, nel punto in cui dovrebbe passare altrove. Lì compare un piccolo pallino: un punto di forma.',
  'help.guide.tour-loop-reverse.title': "Creare un anello o invertire l'escursione",
  'help.guide.tour-loop-reverse.result':
    'Un anello che finisce dove è iniziato, oppure la stessa escursione nel senso opposto.',
  'help.guide.tour-leg-by-hand.tip.2':
    'Un punto che nessun sentiero raggiunge mostra un avviso con «Mostra punto» e il suo numero. Sposta il punto su un sentiero, oppure disegna a mano il tratto fino a quel punto.',
  'help.guide.tour-trip-places.tip.1':
    "Un luogo già presente nell'escursione è contrassegnato con «Nel tour» e non si può scegliere due volte.",
  'help.guide.tour-details-times.step.3': 'Inserisci le «Pause», ad esempio 0:45. Vengono aggiunte al tempo stimato.',
  'help.guide.tour-save.step.1': "Scrivi un nome in «Nome dell'escursione». Senza nome, «Salva» resta in grigio.",
  'help.guide.tour-edit-saved.title': "Modificare un'escursione salvata",
  'help.guide.tour-edit-saved.tip.3':
    '«Scarica GPX» e «Tieni in una raccolta», in cima alla barra, funzionano dopo che hai salvato le modifiche.',
  'help.guide.tour-summary-profile.tip.1': "Clicca sul titolo della scheda per comprimere l'intero riepilogo.",
  'help.guide.tour-list-manage.step.3':
    "Scegli il giorno: l'escursione viene aggiunta a quel giorno, e la sua riga lo mostra.",
  'help.guide.tour-delete.goal': "Rimuovi definitivamente un'escursione dal viaggio.",
  'help.guide.tour-saved-elsewhere.goal':
    "Decidi cosa fare quando qualcun altro ha salvato l'escursione mentre la stavi modificando.",
  'help.ctx.trip-tour-import.title': 'Importare escursioni',
  'help.guide.tour-import-gpx.goal':
    "Trasforma una traccia di un orologio GPS, di un'app o di Google Earth in un'escursione del viaggio, controllandola prima di salvare.",
  'help.guide.tour-import-gpx.tip.3':
    "Una traccia già presente nel viaggio appare in grigio con l'indicazione «Già nel viaggio» e viene saltata.",
  'help.guide.tour-view-import.step.3': '«Torna alle escursioni», la freccia in alto a sinistra, la chiude.',
  'help.guide.tour-plan-from-import.step.2':
    "TREK ricava dei punti di controllo dalla traccia e ricalcola il percorso. La mappa mostra l'importazione con una linea punteggiata e il suggerimento con una linea continua, e la scheda ne confronta le lunghezze, la quota «Entro 50 m dalla traccia» e lo «Scostamento massimo».",
  'help.guide.tour-restore-recorded.title': 'Tornare alla traccia registrata',
  'help.guide.tour-take-over.title': "Riprendere un'escursione da un altro viaggio",
  'help.guide.tour-take-over.tip.1':
    "La copia è un'escursione separata. Non è ancora assegnata a nessun giorno, e le modifiche successive all'originale non toccano la copia, né viceversa. La sua «Origine» indica il viaggio da cui è stata ripresa.",
  'help.guide.tour-import-wanderer.step.3':
    'Clicca su un sentiero: compare sulla mappa, e la colonna mostra le misure del suo file GPX, la descrizione e se in wanderer è pubblico o privato.',
  'help.ctx.trip-tour-map.summary':
    "La mappa al centro della scheda «Escursioni», per l'escursione aperta: le mappe adatte al suo tipo, le piste o i segnali nautici sovrapposti, i luoghi lungo il percorso e la stessa escursione in 3D sul paesaggio reale.",
  'help.guide.tour-map-layers.step.1':
    "Apri la scheda «Escursioni» e clicca su un'escursione sotto «Escursioni di questo viaggio», a destra. Si apre nel planner, e la pillola in basso a sinistra della mappa elenca le mappe disponibili per quel tipo di escursione.",
  'help.guide.tour-along-search.goal':
    "Cerca punti panoramici, acqua, rifugi o un posto dove mangiare vicino al percorso dell'escursione che stai pianificando.",
  'help.guide.tour-along-search.tip.2':
    "In una passeggiata urbana, quattro temi sopra l'elenco selezionano per te le tipologie giuste.",
  'help.guide.tour-along-add-stop.result':
    "Ora l'escursione passa dal luogo, con la nuova distanza e il nuovo tempo in «Riepilogo dell'escursione». Salva l'escursione per conservare la modifica.",
  'help.guide.tour-3d-terrain.step.3':
    "Clicca sulla pillola «Distribuzione delle pendenze» a destra. Si espande e mostra quanta parte dell'escursione ha una pendenza inferiore al 5 %, dal 5 al 10 %, dal 10 al 18 %, dal 18 al 27 % e dal 27 % in su. Quando è compressa, mostra il punto più alto e il tratto più ripido.",
  'help.guide.tour-3d-flyover.goal':
    "Guarda l'intera escursione dalla partenza all'arrivo prima di percorrerla a piedi, in bici o con gli sci.",
  'help.guide.tour-3d-flyover.tip.3':
    'Con il volo in pausa, muoviti lungo il profilo altimetrico per spostare il pallino in quel punto. «Avvia il sorvolo» riprende da lì.',
  'help.guide.tour-map-overlays.tip.1':
    "Le piste sono dati cartografici, non informazioni in tempo reale: non dicono nulla su aperture, battitura, neve o valanghe. Se riduci lo zoom oltre il comprensorio, l'interruttore mostra «Ingrandisci la mappa per vedere le piste».",
  'help.ctx.trip-tour-stages.bullet.4':
    "In «Escursioni di questo viaggio», un'escursione di più giorni mostra una luna con il numero di tappe. Quel pulsante, «Mostra tappe», espande l'elenco delle tappe con il giorno di ciascuna e i totali di «Tour completo».",
  'help.guide.tour-multi-day.step.5':
    "«Riepilogo dell'escursione» elenca tutte le tappe sotto «Tappe». Cliccane una per vedere dove finisce: viene selezionata la sua ultima sosta e il profilo altimetrico segna il punto.",
  'help.guide.tour-stages-on-days.goal':
    "Assegna ogni tappa a un giorno diverso, oppure l'intera escursione a un solo giorno.",
  'help.guide.tour-stages-on-days.tip.2':
    "«Tour completo in questo giorno» è in grigio in un giorno che contiene già l'escursione. «Tappe da questo giorno in poi» funziona comunque e sostituisce in quel giorno l'escursione completa.",
  'help.ctx.trip-tour-hike.bullet.3':
    "L'intestazione della scheda «Waypoint» contiene gli strumenti per il percorso: «Inverti direzione», «Ritorno al punto di partenza» e, in un'escursione a piedi, «Anello dalla partenza». «Altre azioni» su una tappa contiene «Confronta i percorsi del tratto successivo».",
  'help.guide.tour-hike-plan.step.3': "Scrivi un nome in «Nome dell'escursione».",
  'help.guide.tour-hike-plan.tip.4':
    'Il tempo di cammino segue la regola della segnaletica escursionistica (DIN 33466) ed esclude le pause. Aggiungile in «Pause», sotto «Dettagli»: compariranno nel totale pianificato.',
  'help.guide.tour-hike-trail-details.result':
    "Sai quale difficoltà hanno le varie parti dell'escursione, su che fondo sono e dove si trovano sulla mappa.",
  'help.guide.tour-hike-round.step.3':
    "Clicca su «Cerca anelli». Anello A, Anello B e così via compaiono nell'elenco e sulla mappa, ciascuno con il suo colore.",
  'help.guide.tour-hike-compare-ways.goal':
    "Scopri quali altri sentieri potrebbe seguire un'escursione tra due tappe, e scegline uno.",
  'help.guide.tour-hike-compare-ways.tip.3': '«Annulla» chiude la scheda senza modificare il percorso.',
  'help.guide.tour-ferrata-add.result':
    "L'escursione segue la via ferrata sulla sua linea presa da OpenStreetMap. Clicca sulla mappa per proseguire dalla cima. Il router calcola solo il tratto fino alla via ferrata e quello successivo.",
  'help.guide.tour-run-plan.step.2':
    'Scegli un «Profilo»: «Corsa» per vie per lo più asfaltate in città, nei parchi e lungo i fiumi, «Corsa su sentiero» per strade forestali e sentieri naturali.',
  'help.guide.tour-run-plan.tip.4':
    '«Corsa su sentiero» usa sentieri fino al livello escursionistico di montagna (T2), mai più difficili.',
  'help.guide.tour-run-ways.tip.2':
    'Imposta il «Profilo» su «Corsa su sentiero» per far passare il percorso su più sentieri naturali, oppure su «Corsa» per restare su fondo compatto.',
  'help.guide.tour-walk-plan.title': 'Pianificare una passeggiata urbana di tappa in tappa',
  'help.guide.tour-walk-plan.tip.1':
    "L'anello intorno al numero di una tappa ne indica l'importanza: pieno per «Da non perdere», tratteggiato per «Facoltativo». Un piccolo scudo indica una tappa «Protetta».",
  'help.guide.tour-walk-sights.step.3':
    'Clicca su «Cerca lungo il percorso». Una stella davanti a un nome indica un luogo «Da non perdere», uno dei più noti della zona.',
  'help.guide.tour-walk-day-times.goal':
    "Scopri a che ora raggiungi ogni tappa nel giorno della passeggiata, e quali luoghi sono chiusi a quell'ora.",
  'help.guide.tour-walk-day-times.tip.4':
    "Due passeggiate nello stesso giorno: nella scheda «Pianificato», clicca sul tratto tra le due («Cambia mezzo di trasporto») e scegli «Trasporto pubblico». La ricerca parte da dove finisce la prima passeggiata, all'ora in cui finisce, e ti avvisa se un collegamento arriva dopo l'inizio della passeggiata successiva.",
  'help.guide.tour-walk-google-import.tip.1':
    'Viene letto solo un percorso pianificato a piedi. Prima di condividerlo, imposta Google Maps sulla modalità a piedi.',
  'help.guide.tour-walk-check-off.step.3':
    'Clicca su «Segna come visitato» su una tappa che hai visto, oppure su «Salta» su una che tralasci.',
  'help.ctx.trip-tour-bike.bullet.1':
    "«Profilo», sotto «Tipo di tour», indica per quale tipo di bici il router calcola il percorso: «Turismo», «Strada», Gravel o MTB. La riga sotto spiega cosa cerca il router, e cambiando profilo l'intero percorso viene ricalcolato.",
  'help.guide.tour-bike-profile.step.3':
    'Sotto «Profilo», scegli «Turismo», «Strada», Gravel o MTB. La riga sotto spiega cosa cerca il router con quel profilo.',
  'help.guide.tour-bike-profile.tip.4':
    "«Salva» resta in grigio finché l'escursione non ha un nome e non sono stati calcolati percorso e quote.",
  'help.guide.tour-bike-surfaces.result':
    "La mappa evidenzia i tratti della riga scelta, e sai su quali fondi passa il percorso. L'escursione resta invariata.",
  'help.guide.tour-bike-mtb-grades.step.2':
    'Nella scheda «Fondo e percorsi», leggi «Difficoltà del sentiero (mtb:scale)»: la quota del percorso da «S0, nessuna difficoltà particolare» fino a «S4 e oltre, terreno da esperti».',
  'help.ctx.trip-tour-ski.summary':
    "Un'escursione di tipo «Sci e inverno» nella scheda «Escursioni»: una giornata sulle piste, un anello di fondo, un'escursione di scialpinismo, un'uscita con le ciaspole o una passeggiata invernale. I tratti seguono piste, impianti e sentieri mappati in OpenStreetMap, calcolati dal router delle piste in base alla tua disciplina e ai tuoi limiti, e una traccia di sci registrata viene importata con la sua disciplina.",
  'help.guide.tour-ski-plan.step.1':
    'Nella scheda «Escursioni», clicca su «Pianifica nuova escursione» in cima alla barra di sinistra.',
  'help.guide.tour-ski-plan.tip.3':
    'Se in seguito cambi disciplina, i punti restano e i tratti vengono ricalcolati con le opzioni di quella disciplina.',
  'help.guide.tour-ski-options.step.4':
    'Usa gli interruttori: «Usa gli impianti», «Consenti percorsi freeride», «Scendi in impianto se serve» ed «Evita collegamenti ipotizzati». «Sci di fondo» aggiunge «Solo piste battute» e «Solo piste illuminate», e «Scialpinismo» aggiunge «Sali a bordo pista».',
  'help.guide.tour-ski-fix-leg.step.1':
    "Un tratto che il router non è riuscito a pianificare mostra una riga rossa sotto il suo punto con il motivo, ad esempio «Only a lift you left out joins these points», e la pista o l'impianto in questione.",
  'help.guide.tour-ski-summary.title': "Leggere il percorso sulle piste di un'escursione di sci",
  'help.guide.tour-ski-summary.tip.4':
    "In fondo alla scheda sono indicati i comprensori sciistici e la data dei dati cartografici usati per pianificare l'escursione.",
  'help.guide.tour-ski-pistes-layer.tip.2':
    "Se le piste non si caricano più, l'interruttore mostra un segnale di avviso. La mappa e il tuo percorso continuano a funzionare.",
  'help.guide.tour-ski-import.step.4': 'Clicca su «Importa 1 escursione».',
  'help.ctx.trip-tour-paddle.summary':
    "Un'uscita in kayak, canoa o SUP su un fiume o un lago. Indica l'imbarcazione e il tipo di acqua, segue il corso d'acqua dove TREK ha i dati, include nel tempo trasbordi e chiuse, e mostra il vento del giorno in cui pagai e cosa si sa degli ostacoli lungo il percorso.",
  'help.guide.tour-paddle-setup.goal':
    "Avvia un'uscita in kayak, canoa o SUP e indica l'imbarcazione, il tipo di acqua e la velocità.",
  'help.guide.tour-paddle-setup.tip.1':
    "Con «Barca» impostata su «Altro» non c'è una velocità suggerita. Inseriscine una, altrimenti il tempo in acqua resta vuoto.",
  'help.guide.tour-paddle-water-route.step.2':
    "Per far pianificare un singolo tratto sull'acqua, punta la sosta che lo precede e clicca su «Altre azioni», i tre puntini.",
  'help.guide.tour-paddle-water-route.result':
    "Ogni tratto segue l'acqua oppure è disegnato a mano di proposito, e un tratto che TREK non è riuscito a pianificare ne spiega il motivo.",
  'help.guide.tour-paddle-portage.tip.1':
    'Per percorrere comunque in pagaia il tratto, apri di nuovo «Altre azioni» sul punto e scegli «Torna a pagaiare su questo tratto». Torna a essere un tratto disegnato a mano.',
  'help.guide.tour-paddle-lock.step.3': 'Clicca sulla scheda «Chiusa» per aprirla.',
  'help.guide.tour-paddle-time.step.1':
    "«Stima dei tempi» si trova nella colonna di sinistra, sotto i waypoint. Il badge nell'intestazione è il totale, pause comprese.",
  'help.guide.tour-paddle-time.result': 'La stima tiene conto dei valori che hai inserito e indica cosa manca ancora.',
  'help.guide.tour-paddle-wind.tip.2':
    "Un'escursione su più giorni mostra nell'intestazione della scheda un chip per ogni giorno. Cliccane uno per vedere quel giorno.",
  'help.guide.tour-paddle-checklist.step.3':
    "Le voci seguono il percorso: sbarramenti, chiuse, rapide, punti d'imbarco e regole di accesso da OpenStreetMap, più i tuoi trasbordi e le tue chiuse, contrassegnati come «Personale».",
  'help.guide.tour-paddle-checklist.result':
    'Ogni voce del percorso ha una decisione, e hai letto la nota sulla sicurezza.',
  'help.guide.tour-paddle-track-marks.step.6':
    'Clicca su «Chiusa», poi clicca sulla linea nel punto in cui si trova la chiusa.',
  'help.ctx.trip-tour-horse.bullet.1':
    "Imposta «Tipo di tour» su «Escursione a cavallo» nell'editor: nella colonna di sinistra compare la scheda «Itinerari equestri». «Cerca nella vista» elenca gli itinerari presenti nella porzione di mappa visibile.",
  'help.guide.tour-horse-plan.step.2':
    "Clicca sul campo «Tipo di tour» sotto «Nome dell'escursione» e scegli «Escursione a cavallo». Sotto «Waypoint» compare la scheda «Itinerari equestri».",
  'help.guide.tour-horse-plan.tip.2':
    "TREK non calcola il tempo a cavallo per un'uscita. Se vuoi un orario nella giornata, inseriscilo in «Dettagli» sotto «In programma».",
  'help.guide.tour-horse-gap.step.3':
    "Clicca su «Prendi il tratto». Finché l'interruttore non è attivo, il pulsante resta in grigio.",
  'help.guide.tour-horse-recorded.step.1':
    'In «Escursioni di questo viaggio», clicca su «Aggiungi giro» (il +), scegli «Importa GPX o KML» e seleziona il file della tua uscita.',
  'help.guide.dateless-trip.title': 'Pianificare un viaggio senza date',
  'help.guide.trip-reminder.step.2':
    'Sotto «Promemoria», scegli 1, 3 o 9 giorni. Per un anticipo diverso, clicca su «Personalizzato» e inserisci un numero di giorni tra 1 e 30.',
  'help.guide.upcoming-reservations.title': 'Andare alle prossime prenotazioni',
  'help.guide.half-company-holiday.title': 'Segnare mezza giornata di ferie aziendali',
  'help.guide.edit-holiday-calendar.step.2':
    'Clicca sul quadratino del colore per sceglierne uno nuovo, oppure scrivi una nuova etichetta e premi Invio.',
  'help.guide.person-color.step.1': 'Nella scheda «Persone», clicca sul pallino colorato prima del nome.',
  'help.guide.answer-fusion-request.title': 'Rispondere a una richiesta di unione',
  'help.guide.log-for-partner.title': 'Registrare giorni per chi pianifica con te',
  'help.guide.dissolve-fusion.title': 'Smettere di pianificare insieme',
  'help.guide.country-places.goal':
    'Elenca i luoghi che TREK conteggia per un paese, per controllare cosa hai fatto lì o per trovare un luogo che TREK ha assegnato al paese sbagliato.',
  'help.guide.regions.tip.3':
    '«Aggiungi alla lista desideri» funziona anche per una regione, che viene mostrata con lo stesso tratteggio dei paesi nella lista desideri.',
  'help.guide.tour-activity-stats.step.2':
    'Scegli un periodo e un tipo con le due pillole a sinistra. «Periodo» offre «Da sempre», «Quest’anno», «Ultimi 12 mesi» e ogni anno precedente in cui hai delle escursioni; «Tipo» limita i numeri a un tipo di escursione, oppure «Tutti i tipi».',
  'help.guide.tour-activity-stats.tip.3':
    'Un giorno con partecipanti indicati conta solo per loro; un giorno senza partecipanti indicati conta per tutti i membri del viaggio. La scheda carica dati in tempo reale e richiede una connessione a internet.',
  'help.guide.move-to-list.goal':
    "Riorganizza le tue liste spostando i luoghi da una all'altra o copiandoli in una seconda lista.",
  'help.guide.accept-list-invite.result':
    'La lista compare sotto «Condivisa» nella barra e si apre con i suoi luoghi. Le modifiche dei membri compaiono in tempo reale.',
  'help.guide.tour-collection-add-to-trip.step.1':
    "Apri la lista. Le escursioni salvate sono le prime righe, sopra i luoghi. Clicca su «Aggiungi a un viaggio» sull'escursione, oppure sulla riga stessa.",
  'help.guide.tour-collection-manage.title': 'Trovare e rimuovere le escursioni salvate',
  'help.guide.tour-collection-manage.result': "L'escursione viene tolta dalla lista, e un breve messaggio lo conferma.",
  'help.guide.entry-draft.title': 'Conservare una voce come bozza',
  'help.guide.journey-map-layers.step.1':
    'In cima alla mappa, la barra dei livelli contiene «Pianificato», «Registrato», «Voci» e «Foto», ciascuno con il suo conteggio. Clicca su uno per nasconderlo o mostrarlo.',
  'help.guide.journey-keep-route.step.1':
    "Nell'intestazione del giorno, clicca sul pulsante Dawarich, «Riprendi la registrazione».",
  'help.guide.journey-day-stays.step.1':
    "Un giorno con soste da rivedere termina con una riga come «4 soste da Dawarich» e l'intervallo di tempo. Cliccala per vedere le soste.",
  'help.guide.journey-take-over-day.step.1':
    "Clicca su «Riprendi giornata» alla fine della riga delle soste del giorno, oppure sul pulsante elenco nell'intestazione del giorno, che indica quante soste sono in attesa.",
  'help.guide.journey-auto-prepare.goal':
    'Fai preparare automaticamente le soste di ogni giorno, pronte da rivedere, mentre un viaggio è in corso.',
  'help.guide.photo-location.goal': 'Posiziona le voci sulla mappa senza dover cercare un luogo per ciascuna.',
  'help.ctx.settings-about.bullet.1': 'La versione installata su questo server è indicata accanto al titolo.',
  'help.guide.readability.tip.3':
    'Leggibilità è contrassegnata come «Sperimentale». Se qualcosa non va, clicca su «Ripristina predefiniti» in fondo alla scheda per tornare alle impostazioni predefinite.',
  'help.guide.web-push-device.goal':
    'Ricevi le notifiche di TREK sul telefono o sul computer anche quando TREK è chiuso.',
  'help.guide.connect-airtrail.tip.2':
    "La chiave viene salvata in forma cifrata e non viene più mostrata; i puntini nel campo indicano che ce n'è una salvata.",
  'help.guide.connect-dawarich.tip.2':
    "Sotto i pulsanti, la scheda indica quando TREK ha controllato l'ultima volta e cosa non offre la tua versione di Dawarich.",
  'help.guide.tour-connect-wanderer.tip.2':
    "Per un'istanza con un indirizzo privato, l'amministratore potrebbe dover consentire le reti interne.",
  'help.guide.tour-wanderer-watch.tip.2':
    '«In pausa fino a» significa che wanderer non ha risposto; «Token rifiutato» significa che serve un test di connessione riuscito o un nuovo token.',
  'help.guide.plugin-settings.result':
    'Il plugin funziona con le tue impostazioni, e ogni azione che esegue per conto tuo è elencata in «Attività dei plugin».',
  'help.ctx.admin-defaults.bullet.3':
    "Il link «ripristina» accanto a un campo che hai impostato riporta il valore predefinito di TREK. L'impostazione personale di un utente ha sempre la precedenza su questi valori.",
  'help.ctx.admin-settings.bullet.5':
    '«Zona pericolosa»: «Ruota il secret JWT» disconnette tutti gli utenti, te compreso.',
  'help.guide.default-user-settings.step.1':
    'Sotto «Impostazioni predefinite utente», scegli «Modalità Colore» («Chiara», «Scuro» o «Automatica»), «Unità di Temperatura», «Unità di Distanza», «Formato Ora», «La settimana inizia il», la «Valuta di visualizzazione» e se «Nascondi codici di prenotazione» è attivo o «Disattivato». Ogni scelta si salva subito.',
  'help.guide.admin-passkeys.step.2':
    'Inserisci il «Relying Party ID (dominio)», ad esempio trek.example.org, e le «Origini consentite» da cui si raggiunge il tuo TREK, poi clicca su «Salva». Lasciali entrambi vuoti per usare APP_URL.',
  'help.guide.rotate-jwt-secret.title': 'Disconnettere tutti in una volta',
  'help.guide.notification-defaults.step.2':
    'Clicca su una cella per passare allo stato successivo: attivo, «Disattivato», «Bloccato». Il suggerimento indica lo stato successivo, e ogni clic si salva subito.',
  'help.ctx.notifications.bullet.2':
    "«Tutti» e «Non lette», in alto, passano da tutte le notifiche a quelle non ancora lette. L'elenco ne carica altre mentre scorri.",
  'help.guide.read-notifications.step.3':
    'Clicca sul pulsante sotto una notifica, qui «Vedi Vacay», per aprire ciò a cui si riferisce. In questo modo la notifica viene anche segnata come letta.',
  'help.guide.filter-notifications.step.3':
    'Clicca su «Non lette» per vedere solo le notifiche non ancora lette. «Tutti» le mostra di nuovo tutte.',
  'help.guide.mark-notifications-read.tip.2':
    "Segnare come letta cambia solo il colore di sfondo e il conteggio. La notifica resta nell'elenco finché non la elimini.",
  'help.guide.delete-notifications.result': "La notifica viene tolta dall'elenco e dalla campanella.",
  'help.guide.notification-settings.result':
    '«Impostazioni» è aperto su «Notifiche», con un interruttore per ogni evento e canale.',
  'help.guide.link-journal.goal': "Mostra uno dei tuoi diari all'interno del viaggio, alle persone che scegli.",
  'help.guide.link-journal.tip.3':
    "In seguito, «Diario» in «Impostazioni del viaggio» offre «Modifica l'accesso», «Cambia diario» e «Scollega». Scollegando, la scheda sparisce; le persone che hai aggiunto direttamente nel diario mantengono l'accesso.",
  'help.guide.dawarich-stays.result':
    'La sosta è diventata un luogo del viaggio, nel giorno che hai scelto o tra i «Non pianificati», e il pannello la segna come gestita.',
  'help.ctx.trip-days.bullet.7':
    'Mentre il viaggio è in corso, il programma si apre sul giorno di oggi e scorre fino a lì.',
  'help.guide.leave-stop-off-route.tip.2':
    '«Rimuovi dal giorno» toglie invece la tappa dalla giornata; «Escludi dal percorso» la mantiene nel programma.',
  'help.guide.move-booking-day.goal':
    'Sposta un trasporto o una prenotazione a un altro giorno direttamente dal programma, senza aprirne il modulo.',
  'help.guide.place-image-from-file.result':
    "La foto è diventata l'immagine del luogo nella scheda, nella colonna dei luoghi, nel giorno e sulla mappa.",
  'help.guide.place-own-hours.step.3':
    "Sotto, «Orari di apertura» mostra la settimana, una riga per giorno. Se TREK ha trovato gli orari del luogo, sono già compilati; altrimenti clicca prima su «Aggiungi orari di apertura». Inserisci l'orario di apertura e di chiusura di ogni giorno, e clicca su «Chiuso» nei giorni di chiusura.",
  'help.guide.add-accommodation.tip.5':
    'Le tracce GPX e i luoghi delle escursioni non vengono mai proposti come alloggio: solo i normali luoghi del viaggio.',
  'help.guide.confirm-stay-booking.step.1':
    'Apri il giorno del check-in. Nella scheda del soggiorno, sotto «Prenotazione», vedi la prenotazione Hotel di quella notte, con «In attesa» o «Confermata». Clicca su quel riquadro.',
  'help.guide.tour-map-lines.step.4':
    "Per togliere un'escursione dalla mappa, imposta la colonna di destra su «Escursioni», punta l'escursione e clicca sull'occhio, «Nascondi sulla mappa». La linea e il segnaposto spariscono dalla mappa, e la riga resta nell'elenco, attenuata, con un occhio barrato, «Mostra sulla mappa», che la fa ricomparire.",
  'help.guide.car-stops.step.1':
    "Nell'intestazione del giorno in cui ritiri l'auto, clicca sul + con il suggerimento «Aggiungi al giorno» e scegli «Aggiungi trasporto».",
  'help.guide.car-stops.tip.2': '«Sposta su» e «Sposta giù» compaiono solo quando il tragitto ha almeno due soste.',
  'help.guide.transport-details.title': 'Aprire un trasporto e usarne i dettagli',
  'help.guide.transport-details.tip.1':
    'Su un tragitto con la linea già visibile, cliccando di nuovo su «Sulla mappa» la linea si nasconde.',
  'help.guide.export-transports-csv.result':
    'Il browser salva un file con il nome del viaggio, ad esempio autumn-in-japan-transports.csv, con una riga per tragitto: «Tipo», «Titolo», «Stato», «Inizio», «Fine», «Da», «A», «Luogo», «Conferma» e «Note».',
  'help.guide.group-sort-bookings.goal':
    "Organizza le schede o l'elenco per stato, giorno o tipo, nell'ordine che preferisci.",
  'help.guide.booking-on-map.tip.1':
    "«Sulla mappa» c'è solo per le prenotazioni con un luogo. Scegline uno in «Luogo / Attività» nel modulo, e il pulsante compare.",
  'help.guide.export-bookings-csv.step.2':
    'Apri «Opzioni di visualizzazione», i cursori dopo le icone delle viste, e scegli un ordinamento sotto «Ordina per». Le righe lo seguono, una per prenotazione e senza sezioni.',
  'help.guide.edit-booking.tip.4':
    'Se hai modificato qualcosa, un clic fuori dal modulo o il tasto Esc chiedono «Scartare le modifiche?». «Continua a modificare» ti riporta al modulo.',
  'help.guide.arrange-packing-list.step.2':
    "All'interno di una lista, la maniglia a sinistra di una riga trascina quell'elemento in su o in giù. Una linea nel tuo colore d'accento sul bordo sinistro di una riga indica dove verrà inserito.",
  'help.guide.count-packed-pieces.goal':
    'Assegna una quantità a un elemento e segna i pezzi in valigia uno alla volta.',
  'help.guide.count-packed-pieces.tip.3': 'Con quantità uno non compare nessun contatore, solo la casella di spunta.',
  'help.guide.expense-receipts.step.2':
    'Clicca su «Allega» accanto a «Ricevute e fatture» e scegli la foto o il PDF; puoi anche sceglierne più di uno insieme. Ogni file viene elencato sotto il titolo, con un cestino per toglierlo.',
  'help.guide.files-sync-settings.goal':
    'Decidi se i documenti vengono solo importati dal tuo archivio, solo esportati verso di esso, o entrambe le cose, e cosa succede quando un documento viene eliminato o modificato in entrambi i posti.',
  'help.guide.files-sync-settings.tip.2':
    'Con «Chiedimelo», un documento modificato in entrambi i posti resta in «Da controllare», sotto la scheda. Clicca su Risolvi e scegli «Mantieni la versione di TREK», «Mantieni la versione del provider» o «Mantieni entrambe».',
  'help.guide.manage-notes.goal':
    'Apri una nota per intero, tieni in cima quella importante, e correggi o elimina ciò che non è più attuale.',
  'help.guide.manage-notes.tip.2':
    'Durante la modifica, la croce rossa su un file già allegato lo elimina subito, prima ancora che tu clicchi su «Salva», e il file non va nel cestino. Ogni file di una nota compare anche nella scheda «File» del viaggio.',
  'help.guide.note-categories.step.6':
    "Nella scheda «Note», le pillole sotto l'intestazione filtrano le schede. Clicca su una categoria per vedere solo le sue note; «Tutti», o di nuovo la stessa pillola, le mostra tutte.",
  'help.guide.roadtrip-reorder.tip.1':
    'Spostando una tappa qui, si sposta anche nel piano del giorno: «Giorni» mostra lo stesso ordine.',
  'help.guide.roadtrip-overnight.step.1':
    'In «Lungo il percorso», spunta «Alloggio» sotto «Sto cercando», oppure «Campeggio» per una piazzola, scegli il giorno in cui vuoi fermarti e clicca su «Cerca».',
  'help.guide.roadtrip-overnight.tip.3':
    'Con «Inizia e termina ogni giorno al tuo alloggio» attivo, sotto «Linea del percorso» in «Impostazioni di guida», il tragitto del giorno dopo parte da dove hai dormito.',
  'help.guide.roadtrip-stop-fill.title': 'Impostare il livello di rifornimento di una sosta',
  'help.guide.roadtrip-bookings.title': 'Includere nel viaggio in auto il volo, il treno o il traghetto',
  'help.guide.roadtrip-bookings.tip.2':
    'Un tavolo o un biglietto prenotato in una tappa compare come pillola su quella tappa; ciò che non appartiene a nessuna tappa è elencato sotto «Prenotato anche questo giorno».',
  'help.guide.roadtrip-google-import.step.3':
    'Controlla le tappe trovate. Ognuna mostra dove si trova; una tappa contrassegnata con «Location unresolved» viene saltata.',
  'help.guide.roadtrip-hazards.step.1': 'Apri «Impostazioni di guida» nella colonna di destra.',
  'help.ctx.trip-tours.summary':
    "La colonna di destra della scheda «Pianificato» in modalità «Escursioni»: tutte le escursioni del viaggio in un unico elenco, accanto ai giorni. Da qui assegni le escursioni ai giorni, filtri l'elenco, nascondi le linee sulla mappa e importi file GPX o KML. I percorsi si disegnano e si modificano nella scheda «Escursioni».",
  'help.guide.tour-show-list.goal':
    'Sostituisci la colonna dei luoghi con le escursioni del viaggio, per vederle e sceglierle accanto ai giorni.',
  'help.guide.tour-show-list.tip.3':
    "Con il modulo Escursioni attivo, le tracce non compaiono mai nell'elenco «Luoghi»: ogni traccia importata è un'escursione e compare qui.",
  'help.guide.tour-add-to-day.step.5':
    "Per un'escursione con tappe, lo stesso menu chiede poi come procedere. «Tappe da questo giorno in poi» mette la tappa 1 in quel giorno e ogni tappa successiva nel giorno dopo; «Tour completo in questo giorno» la mette tutta in quel solo giorno.",
  'help.guide.tour-day-times.step.1':
    "Nella colonna dei giorni, punta la riga dell'escursione, clicca su «Altre opzioni» (i tre puntini) e scegli «Modifica».",
  'help.guide.tour-day-times.result':
    "L'escursione compare nella cronologia del giorno con inizio e fine, come qualsiasi tappa con orario.",
  'help.guide.tour-remove-from-day.result':
    "Il giorno non elenca più l'escursione, e la sua riga nell'elenco non ha più il badge del giorno.",
  'help.guide.tour-filter-list.tip.2':
    "Una sezione compare solo se le escursioni differiscono su quell'aspetto, quindi un elenco breve può offrire solo «Stato».",
  'help.guide.tour-hide-on-map.tip.1':
    "Nascondere un'escursione vale solo per te e viene salvato in questo browser per questo viaggio: l'escursione, i suoi giorni e il suo colore non cambiano, e resta visibile sulle mappe degli altri.",
  'help.guide.tour-import-plan-tab.tip.1':
    'Una traccia già presente nel viaggio è contrassegnata con «Già nel viaggio» e non viene importata due volte.',
  'help.ctx.trip-tour-detail.bullet.4':
    "La riga in fondo: «Aggiungi al giorno» o «Rimuovi dal giorno» quando un giorno è aperto, «Navigazione» verso la partenza, la pagina web dell'escursione, GPX, «Condividi» se il tuo dispositivo può condividere file, «Raccolta» e «Copia».",
  'help.guide.tour-detail-read.step.5':
    "Seguono le misure: «Distanza», «Quota minima», «Quota massima», «Dislivello positivo» e «Dislivello negativo», sotto i tempi e il profilo altimetrico nel colore della linea dell'escursione.",
  'help.guide.tour-detail-read.result':
    "La scheda dell'escursione è aperta accanto al programma, e sai in quali giorni è pianificata, quanto è lunga e ripida e da dove proviene.",
  'help.guide.tour-rename-colour.tip.2':
    'La matita e il pallino funzionano solo per i membri che possono modificare i luoghi.',
  'help.guide.tour-take-along.tip.2':
    "Scegli un'app di mappe preferita in «Impostazioni»: «Navigazione» la aprirà subito invece di mostrare l'elenco.",
  'help.guide.tour-copy-keep.step.3':
    "Per conservare un'escursione per altri viaggi, aprila e clicca su «Raccolta» in fondo alla sua scheda.",
  'help.guide.tour-packing-link.goal':
    "Mostra direttamente nella scheda dell'escursione cosa mettere in valigia, dalla lista valigia del viaggio o da una delle sue liste.",
  'help.guide.tour-packing-link.tip.3':
    'Per collegare serve il permesso di modificare i luoghi. Gli altri vedono la lista collegata ma non possono cambiare il collegamento.',
  'help.guide.tour-files.tip.2':
    "«Carica» è visibile solo ai membri che possono modificare l'escursione e aggiungere file.",
  'help.guide.tour-activity-link.step.5':
    'Ora la traccia compare sotto «Traccia effettiva», con i suoi valori e il suo profilo accanto al programma.',
  'help.guide.tour-activity-compare.step.2':
    '«Distanza massima dal piano» indica la distanza maggiore tra la traccia e la linea pianificata, e «Fuori dal piano» quanta parte della traccia è passata lontano da quella linea.',
  'help.guide.tour-origin-check.step.1':
    "Apri la scheda dell'escursione e scorri fino a «Origine». «Origine» indica la provenienza: «Importazione GPX» con il nome del file, importazione KML o KMZ, oppure wanderer con il suo indirizzo.",
  'help.ctx.trip-tour-planner.summary':
    "Il planner delle escursioni del viaggio: l'editor a sinistra, tutte le escursioni del viaggio a destra e la mappa al centro. Qui disegni un'escursione punto per punto, ne calcoli il percorso su sentieri e strade reali, aggiungi i dettagli e la salvi nel viaggio.",
  'help.guide.tour-open-workspace.goal': 'Apri il planner delle escursioni e scopri a cosa serve ciascuna parte.',
  'help.guide.tour-open-workspace.tip.1':
    '«Comprimi», sulla linguetta al bordo interno di ogni barra, nasconde la barra per lasciare più spazio alla mappa; «Pianificato» ed «Escursioni di questo viaggio» mostrano di nuovo le barre. Trascina il bordo di una barra per allargarla o restringerla.',
  'help.guide.tour-draw-route.step.3':
    "Verifica che «Aggiungi punto» sotto «Waypoint» sia attivo (è lo stesso interruttore di «Posiziona punti» nella pillola della mappa), poi clicca sulla mappa nel punto di partenza dell'escursione.",
  'help.guide.tour-draw-route.result':
    'Un percorso numerato sulla mappa e i suoi punti sotto «Waypoint», pronti per ricevere un nome ed essere salvati.',
  'help.guide.tour-type-profile.tip.2':
    "Alcuni tipi richiedono altri dati prima di poter salvare: una «Corsa» il «Passo previsto», un'«Uscita in pagaia» l'imbarcazione e il tipo di acqua, un'escursione «Sci e inverno» la disciplina.",
  'help.guide.tour-edit-points.step.5':
    "«Rimuovi punto di passaggio», il cestino accanto, toglie il punto dall'escursione.",
  'help.guide.tour-shaping-points.step.2':
    'Trascina il pallino sul sentiero che deve seguire il percorso: il percorso viene ricalcolato passando da lì.',
  'help.guide.tour-loop-reverse.goal':
    "Fai terminare l'escursione al punto di partenza, oppure invertine la direzione.",
  'help.guide.tour-leg-by-hand.title': 'Disegnare un tratto a mano o ricalcolarlo',
  'help.guide.tour-leg-by-hand.result':
    'Il tratto è una linea retta dove hai scelto, contrassegnata come disegnata a mano, oppure viene ricalcolato.',
  'help.guide.tour-trip-places.tip.2':
    "Rimuovendo la tappa o scollegandola, il luogo resta nel viaggio com'è, giorni compresi.",
  'help.guide.tour-details-times.step.4':
    '«In programma» mostra il totale. Inserisci un tuo valore per sostituirlo; viene allora contrassegnato come «Valore manuale».',
  'help.guide.tour-save.step.2':
    'Aspetta che il pallino accanto a «Nuova escursione» sia sparito. Per salvare servono il percorso e tutte le sue quote.',
  'help.guide.tour-edit-saved.goal': "Apri un'escursione pianificata in precedenza, modificala e salvala di nuovo.",
  'help.guide.tour-edit-saved.result': "L'escursione salvata ora contiene le tue modifiche.",
  'help.guide.tour-summary-profile.tip.2':
    'Un percorso che passa per una via ferrata ha, sopra i valori, un badge di avviso con la difficoltà.',
  'help.guide.tour-list-manage.step.4':
    "Il pulsante sopra «Totali del viaggio» è il filtro. Mostra lo stato per cui filtra, all'inizio «Tutti», con il numero di escursioni.",
  'help.guide.tour-delete.step.1':
    "Punta l'escursione sotto «Escursioni di questo viaggio» e clicca sul cestino a destra della riga, «Elimina» seguito dal nome dell'escursione.",
  'help.guide.tour-saved-elsewhere.step.1':
    'Mentre modifichi, in cima alla barra compare «Questo tour è stato salvato altrove». Le tue modifiche vengono conservate finché non decidi.',
  'help.ctx.trip-tour-import.summary':
    "Qui importi nel viaggio escursioni che esistono già altrove: un file GPX, KML o KMZ di un orologio o di un'app, un'escursione di un altro tuo viaggio o un sentiero del tuo wanderer. Un'importazione viene conservata esattamente come è stata registrata, e puoi ricavarne una versione modificabile.",
  'help.guide.tour-import-gpx.step.1':
    'Apri la scheda «Escursioni» del viaggio. In cima a «Escursioni di questo viaggio», a destra, clicca sul + («Aggiungi giro»).',
  'help.guide.tour-import-gpx.tip.4':
    "Per un file KML o KMZ, sotto «Non importato» compare anche cos'altro conteneva oltre alle linee: segnaposto, aree e altri elementi.",
  'help.guide.tour-view-import.tip.1':
    "Un'importazione non si può modificare punto per punto. «Pianifica una versione modificabile», nella scheda «Versione modificabile» sopra, ne ricava un'escursione che puoi modificare.",
  'help.guide.tour-plan-from-import.step.3':
    "Clicca su «Sostituisci l'importazione» per ripianificare questa escursione al suo posto: giorni e note restano, e la traccia registrata viene conservata per poterla ripristinare. «Pianifica come nuova escursione» non modifica l'importazione e crea una seconda escursione accanto.",
  'help.guide.tour-restore-recorded.goal':
    "Annulla la ripianificazione di un'importazione e recupera la traccia originale, anche molto tempo dopo.",
  'help.guide.tour-take-over.goal':
    "Riusa un'escursione già pianificata o importata in un altro tuo viaggio, senza disegnarla di nuovo.",
  'help.guide.tour-take-over.tip.2':
    'Vengono elencati solo i tuoi altri viaggi, e solo le prime 100 escursioni. Usa la ricerca o i filtri per trovare le altre.',
  'help.guide.tour-import-wanderer.step.4': 'Clicca su «Importa nel viaggio».',
  'help.ctx.trip-tour-map.bullet.1':
    "La pillola in basso a sinistra della mappa contiene le mappe di base disponibili per il tipo dell'escursione aperta: «Mappa», Topo, «Escursionismo» per un'escursione a piedi, «Bicicletta» per un giro in bici, e Satellite. La scelta vale solo per il planner e non modifica mai l'impostazione della mappa in «Impostazioni».",
  'help.guide.tour-map-layers.step.2':
    'Clicca su Topo per avere curve di livello e rilievo ombreggiato, la mappa che mostra quanto è ripido il terreno. La mappa scelta resta evidenziata nella pillola.',
  'help.guide.tour-along-search.step.1':
    "Apri un'escursione nella scheda «Escursioni» e scorri il pannello di sinistra fino a «Lungo il percorso», sotto le tappe dell'escursione. La scheda compare quando l'escursione ha un percorso.",
  'help.guide.tour-along-search.tip.3':
    "I risultati provengono da OpenStreetMap e dall'indice dei luoghi di TREK, quindi la ricerca richiede una connessione. Se non trova nulla, «Widen to» prova la distanza successiva; se un server è occupato, «Riprova» mostra un conto alla rovescia finché puoi riprovare.",
  'help.guide.tour-along-add-stop.tip.1':
    "Il luogo diventa una tappa dell'escursione, non un luogo del viaggio, quindi non compare nell'elenco dei luoghi.",
  'help.guide.tour-3d-terrain.step.4':
    'Trascina il cursore «Rilievo» per rendere i rilievi fino a tre volte più alti, utile su terreni poco accidentati.',
  'help.guide.tour-3d-flyover.step.1':
    "Passa l'escursione in 3D. Mentre il paesaggio lungo il percorso si carica, un anello si riempie nel punto in cui compare il pulsante di riproduzione; quando è pieno, clicca su «Avvia il sorvolo». La visuale segue un pallino lungo il percorso, e il cursore sul profilo altimetrico in «Riepilogo dell'escursione» si sposta con esso.",
  'help.guide.tour-map-overlays.title': 'Mostrare piste o segnali nautici sopra la mappa',
  'help.guide.tour-map-overlays.tip.2':
    "L'interruttore delle piste c'è anche senza escursioni aperte, così puoi guardare un comprensorio prima di pianificare. In un'escursione a piedi, la pillola offre invece «Vie ferrate», con il numero di itinerari visibili.",
  'help.ctx.trip-tour-stages.bullet.5':
    "Il più sulla riga di un'escursione, «Aggiungi al giorno», assegna le tappe al viaggio una al giorno a partire dal giorno che scegli, oppure mette l'intera escursione in quel solo giorno.",
  'help.guide.tour-multi-day.step.6':
    "Per tornare a un'escursione di un giorno, clicca su «Un giorno» e conferma «Farne un giro di un giorno?» con «Togli le fini tappa». Il percorso resta invariato.",
  'help.guide.tour-stages-on-days.step.1':
    "In «Escursioni di questo viaggio», punta l'escursione di più giorni e clicca sul più, «Aggiungi al giorno».",
  'help.guide.tour-stages-on-days.tip.3':
    "Anche trascinando un'escursione di più giorni su un giorno nella scheda «Pianificato» compare la stessa domanda in una finestra, così come con «Aggiungi al giorno» nella scheda dell'escursione.",
  'help.ctx.trip-tour-hike.bullet.4':
    "«Dettagli del sentiero», sotto i waypoint, mostra per ogni tratto la difficoltà SAC, il fondo e il tipo di via secondo OpenStreetMap, e colora il percorso sulla mappa di conseguenza. Niente qui modifica l'escursione.",
  'help.guide.tour-hike-plan.step.4':
    "«Aggiungi punto» è attivo fin dall'inizio: clicca sulla mappa nel punto di partenza e in quello di arrivo dell'escursione. «Luoghi del viaggio», lì accanto, ti permette invece di scegliere un rifugio o un hotel del viaggio. Da due punti in poi, TREK calcola il percorso a piedi.",
  'help.guide.tour-hike-trail-details.title': "Vedere difficoltà, fondi e tipi di via lungo un'escursione",
  'help.guide.tour-hike-trail-details.tip.1':
    'Le vie senza un valore in OpenStreetMap sono elencate sotto «Sconosciuta», e sconosciuto non significa facile. Se alcune mostrano «Non interrogabile questa volta», clicca su «Riprova».',
  'help.guide.tour-hike-round.step.4':
    'Clicca su un anello per sceglierlo. La sua riga mostra distanza, dislivello e tempo, e quanto si discosta dalla distanza richiesta.',
  'help.guide.tour-hike-compare-ways.step.1':
    'Punta la tappa in cui inizia il tratto, clicca su «Altre azioni» nella sua riga e scegli «Confronta i percorsi del tratto successivo».',
  'help.guide.tour-ferrata-add.title': "Inserire una via ferrata in un'escursione",
  'help.guide.tour-ferrata-add.tip.1':
    'Una via ferrata richiede attrezzatura ed esperienza. Il suggerimento del badge indica quanta parte ne percorre il tracciato.',
  'help.guide.tour-run-plan.step.3':
    'Inserisci il tuo «Passo previsto» in minuti e secondi per chilometro, ad esempio 7:30.',
  'help.guide.tour-run-ways.title': 'Vedere su quali vie passa una corsa',
  'help.ctx.trip-tour-walk.title': 'Passeggiata urbana',
  'help.guide.tour-walk-plan.goal':
    'Componi una passeggiata turistica di tappa in tappa, indicando quanto ti fermi in ciascuna e quali sono importanti.',
  'help.guide.tour-walk-plan.tip.2':
    'Una passeggiata urbana non ha un limite di difficoltà né il campo «Pause»: al loro posto contano i tempi di sosta.',
  'help.guide.tour-walk-sights.step.4':
    "Clicca su un luogo nell'elenco: la sua scheda si apre sopra la mappa. Sotto «Dove va», scegli tra quali due tappe inserirlo.",
  'help.guide.tour-walk-day-times.step.1':
    'Assegna la passeggiata a un giorno: in «Escursioni di questo viaggio», clicca sul + rotondo nella sua riga («Aggiungi al giorno») e scegli il giorno.',
  'help.guide.tour-walk-day-times.result':
    'Puoi riordinare le tappe o cambiare i tempi di sosta finché ogni luogo è aperto quando ci arrivi.',
  'help.guide.tour-walk-google-import.tip.2':
    '«Usa un altro link» ti riporta al campo del link. Il caricamento sostituisce le modifiche non salvate nel planner, e la finestra te lo segnala prima.',
  'help.guide.tour-walk-check-off.step.4':
    "In cima all'elenco vedi quante tappe hai visitato e quanto cammino ti resta. «Annulla» su una tappa toglie il segno.",
  'help.ctx.trip-tour-bike.bullet.2':
    "Il «Riepilogo dell'escursione» a destra indica «Tempo in bici (stimato)», il tempo calcolato dal router per il profilo, salite comprese. Le pause non sono incluse.",
  'help.guide.tour-bike-profile.step.4':
    "Sotto «Waypoint», clicca su «Luoghi del viaggio» e scegli la partenza e l'arrivo, qui Hotel Alpenroyal e poi Hotel Greif. In alternativa, verifica che «Aggiungi punto» sia attivo e clicca sulla mappa. Da due punti in poi, TREK calcola il percorso.",
  'help.guide.tour-bike-profile.tip.5':
    "Se un amministratore consente la mappa CyclOSM, con un giro in bici aperto la riga dei livelli della mappa offre anche «Bicicletta». Se smette di caricarsi, passa a «Mappa». L'escursione non cambia.",
  'help.guide.tour-bike-surfaces.tip.1':
    '«Non nei dati» significa che OpenStreetMap non registra un fondo in quel punto. Il fondo è sconosciuto, non necessariamente buono.',
  'help.guide.tour-bike-mtb-grades.step.3':
    'Clicca sulla riga di una difficoltà per evidenziare quei sentieri sulla mappa.',
  'help.ctx.trip-tour-ski.bullet.1':
    "Per prima viene la «Disciplina», senza nessuna preselezione: «Alpino», Snowboard, «Sci di fondo», «Scialpinismo», «Ciaspole» o «Escursione invernale». «Sci di fondo» chiede anche la «Tecnica»: «Classica», Skating o «Sconosciuta». Senza una disciplina l'escursione non si può salvare.",
  'help.guide.tour-ski-plan.step.2': 'Apri «Tipo di tour» e scegli «Sci e inverno».',
  'help.guide.tour-ski-plan.tip.4':
    'Dove non ci sono dati sulle piste, un tratto è una linea retta tra i suoi punti. Per «Ciaspole» ed «Escursione invernale» può invece usare i sentieri estivi, e una nota grigia sul tratto lo segnala.',
  'help.guide.tour-ski-options.step.5':
    'Sotto «Escludi», premi ogni tipo di impianto che non vuoi usare: «Skilift», «Seggiovie aperte», «Cabinovie», «Funivie» o «Funicolari e treni». Quelli premuti appaiono barrati.',
  'help.guide.tour-ski-fix-leg.step.2':
    "Clicca sulla correzione proposta nella riga: «Consenti piste più difficili», «Consenti questo impianto», «Scendi in impianto», «Cambia tecnica» o «Cambia disciplina». L'opzione cambia e il tratto viene ricalcolato.",
  'help.guide.tour-ski-summary.goal':
    'Scopri come si suddivide la giornata tra sci, impianti, attese e tratti a piedi.',
  'help.guide.tour-ski-summary.result': 'Sai quanto tempo passi sulle piste, sugli impianti e in attesa agli impianti.',
  'help.guide.tour-ski-pistes-layer.tip.3':
    "Il livello contiene dati cartografici, non informazioni in tempo reale: non dice nulla su aperture, battitura, neve o valanghe. L'interruttore c'è anche senza escursioni aperte, così puoi guardare un comprensorio prima di pianificare.",
  'help.guide.tour-ski-import.step.5':
    'Clicca sulla traccia in «Escursioni di questo viaggio» per aprirla. Per correggere in seguito la disciplina, clicca su «Cambia» nella sua scheda «Traccia di sci».',
  'help.ctx.trip-tour-paddle.bullet.1':
    "Sotto «Tipo di tour», «Uscita in pagaia» chiede una «Barca» (Kayak, «Canoa», SUP o «Altro») e l'«Acqua» («Fiume» o «Lago»). L'escursione non si può salvare finché non li hai scelti entrambi.",
  'help.guide.tour-paddle-setup.step.1':
    'Nella scheda «Escursioni», clicca su «Pianifica nuova escursione» in cima alla colonna di sinistra.',
  'help.guide.tour-paddle-setup.tip.2':
    "La mappa di un'uscita in pagaia offre «Mappa» e Satellite, con i «Segnali nautici» di OpenSeaMap come livello aggiuntivo.",
  'help.guide.tour-paddle-water-route.step.3':
    'Scegli «Pianifica il tratto successivo sull’acqua». TREK calcola il tratto lungo il fiume o il lago da questo punto al successivo.',
  'help.guide.tour-paddle-portage.title': "Trasportare l'imbarcazione oltre un ostacolo",
  'help.guide.tour-paddle-portage.tip.2':
    "Sull'ultimo punto, «Trasporta l’imbarcazione da qui» si applica quando inserisci il punto successivo. La riga mostra «Trasbordo da qui», e la sua croce, «Niente trasbordo», annulla l'operazione.",
  'help.guide.tour-paddle-lock.step.4':
    'Inserisci i minuti per «Attesa» e per «Passaggio». Quando ci sono entrambi, la scheda mostra la somma.',
  'help.guide.tour-paddle-time.step.2':
    "La striscia mostra il percorso dalla partenza all'arrivo: l'acqua, i trasbordi in marrone e le chiuse come tacche. Gli ostacoli lungo il percorso sono segni che puoi cliccare per trovarli sulla mappa.",
  'help.guide.tour-paddle-wind.title': 'Controllare il vento per una giornata in pagaia',
  'help.guide.tour-paddle-wind.tip.3':
    'In una giornata ventosa con un attraversamento di lago, la scheda propone «Pianifica vicino alla riva», che pianifica i tratti sui laghi lungo la sponda.',
  'help.guide.tour-paddle-checklist.step.4':
    'Clicca su una voce: la mappa si sposta lì. Per un ostacolo, si apre la sua scheda con la tua decisione; per un tuo trasbordo o una tua chiusa, viene selezionato il punto.',
  'help.guide.tour-paddle-track-marks.title': 'Segnare trasbordi e chiuse su una traccia in pagaia registrata',
  'help.guide.tour-paddle-track-marks.step.7': 'Apri le schede, inserisci i minuti e clicca su «Salva».',
  'help.ctx.trip-tour-horse.bullet.2':
    'Un itinerario si apre in una finestra propria: scegli una sezione e il «Senso» in cui percorrerla, controlla «Accesso a cavallo», poi clicca su «Prendi il tratto».',
  'help.guide.tour-horse-plan.step.3':
    'Nella scheda «Itinerari equestri», clicca su «Cerca nella vista». Ogni itinerario equestre segnalato nella zona visibile viene elencato con la lunghezza del tratto visibile.',
  'help.guide.tour-horse-plan.tip.3':
    'Hai spostato la mappa dopo una ricerca? Il pulsante mostra «Cerca in questa vista». Se la zona visibile è troppo ampia, ti viene chiesto prima di ingrandire.',
  'help.guide.tour-horse-gap.step.4':
    'Nella scheda «Waypoint», il collegamento mostra «Manuale, non verificato», con la lunghezza. Puntalo per leggerne il motivo.',
  'help.guide.tour-horse-recorded.step.2':
    "Si apre l'«Anteprima dell'importazione», e non è ancora salvato nulla. Sotto «Importa come», imposta «Tipo di tour» su «Escursione a cavallo». Tre badge indicano cosa conserva l'importazione e cosa non calcola.",
  'help.guide.dateless-trip.goal': 'Inizia a pianificare anche se non sai ancora quando partirai.',
  'help.guide.trip-reminder.step.3': 'Clicca su «Aggiorna».',
  'help.guide.upcoming-reservations.goal':
    'Scopri le prossime prenotazioni di tutti i tuoi viaggi e apri il viaggio a cui appartengono.',
  'help.guide.log-day.tip.3':
    'Un giorno segnato come giornata intera di ferie aziendali non si può registrare. In una mezza giornata di ferie aziendali, un giorno di ferie vale solo 0,5.',
  'help.guide.half-company-holiday.goal':
    "Concedi a tutti un pomeriggio libero, ad esempio la vigilia di Natale, senza chiudere l'intera giornata.",
  'help.guide.public-holidays.tip.2': 'Passa con il mouse su una festività nella griglia per vederne il nome.',
  'help.guide.edit-holiday-calendar.step.3':
    'Cambia il paese o la regione negli elenchi, oppure clicca sul cestino per rimuovere il calendario.',
  'help.guide.person-color.step.2': 'Scegli un colore: viene salvato subito e la finestra si chiude.',
  'help.guide.answer-fusion-request.goal': 'Decidi se unire il tuo piano ferie a quello di chi ti ha invitato.',
  'help.guide.log-for-partner.goal':
    'Inserisci un giorno libero per una persona unita al tuo piano, ad esempio quando te lo chiede.',
  'help.guide.dissolve-fusion.goal': 'Dividi di nuovo un piano unito in piani separati.',
  'help.guide.country-places.step.1':
    'Cerca un paese che hai visitato e selezionalo: la sua scheda compare nel pannello in basso.',
  'help.guide.tour-activity-stats.step.3':
    "Leggi i numeri: la distanza, con il numero di escursioni nell'angolo, poi «Dislivello positivo» e «Dislivello negativo». Con «Tutti i tipi», seguono i tre tipi che hai fatto più spesso, ciascuno con conteggio e distanza.",
  'help.guide.move-to-list.step.1':
    "Clicca sull'icona della casella di spunta, «Scegli», nella riga dei filtri e spunta i luoghi.",
  'help.guide.tour-collection-add-to-trip.step.2':
    'Sotto «Nel viaggio», scegli il viaggio. I viaggi a cui non puoi aggiungere escursioni appaiono attenuati.',
  'help.guide.tour-collection-manage.goal':
    'Scopri quali escursioni contiene una lista e da dove provengono, e rimuovi quelle che non ti servono più.',
  'help.guide.entry-draft.goal': 'Scrivi subito una voce e nascondila dal diario condiviso finché non è pronta.',
  'help.guide.journey-map-layers.step.2':
    'Clicca sulla (i) alla fine della barra per la legenda della mappa: spiega ogni segnaposto, puntino e linea.',
  'help.guide.journey-keep-route.step.2':
    'Controlla «Fuso orario del giorno», che stabilisce dove inizia e finisce la giornata, e verifica la registrazione: distanza, intervallo di tempo, segmenti e interruzioni.',
  'help.guide.journey-day-stays.step.2':
    "Clicca su «Scrivi una voce di diario» su una sosta. La voce viene aggiunta a quel giorno all'ora di arrivo, con nome e posizione della sosta.",
  'help.guide.journey-take-over-day.step.2':
    'Spunta le soste da tenere e correggine i nomi. «Unisci in una voce», tra due soste spuntate, le unisce; «Tieni separate» le divide di nuovo.',
  'help.guide.journey-auto-prepare.step.1':
    "Clicca su ⋯ in alto a destra nell'intestazione per aprire «Impostazioni del diario».",
  'help.guide.photo-location.step.1':
    "Clicca su ⋯ in alto a destra nell'intestazione per aprire «Impostazioni del diario».",
  'help.guide.share-public.tip.3':
    'Le bozze non compaiono mai nel link, e i percorsi registrati compaiono solo nei giorni con una voce pubblicata.',
  'help.ctx.settings-plugins.title': 'Plugin',
  'help.ctx.settings-about.bullet.2':
    '«Segnala un bug» e «Richiedi funzionalità» aprono il progetto su GitHub; Wiki apre la documentazione.',
  'help.guide.map-provider.tip.3':
    'Su una mappa GL, tieni premuto il tasto destro e trascina per ruotarla e inclinarla; il clic con la rotellina aggiunge un luogo.',
  'help.guide.web-push-device.step.1':
    'Sotto «Notifiche push su questo dispositivo», clicca su «Attiva su questo dispositivo» e consenti le notifiche quando il browser lo chiede. «Invia test» verifica che ne arrivi una.',
  'help.guide.connect-airtrail.title': 'Collegare il tuo AirTrail',
  'help.guide.connect-dawarich.title': 'Collegare il tuo Dawarich',
  'help.guide.tour-connect-wanderer.title': 'Collegare il tuo wanderer',
  'help.guide.tour-connect-wanderer.tip.3': '«Disconnetti», a destra, rimuove di nuovo il token.',
  'help.guide.tour-wanderer-watch.tip.3':
    'I canali per queste segnalazioni si scelgono in «Notifiche», nella riga «wanderer: segnalazioni sui tuoi sentieri».',
  'help.guide.plugin-settings.tip.1':
    'Queste impostazioni valgono solo per te; gli altri membri configurano il plugin per conto proprio.',
  'help.guide.offline-conflicts.step.3':
    'Le modifiche che il server continua a rifiutare compaiono in «Cache offline» come «Modifiche non riuscite»: «Riprova» le invia di nuovo, «Scarta» mantiene la versione del server.',
  'help.ctx.admin-notifications.bullet.4':
    "In fondo, «Impostazioni predefinite per gli utenti»: per ogni evento e canale, attivo, «Disattivato» o «Bloccato» per tutti quelli che non l'hanno modificato.",
  'help.guide.default-user-settings.step.2':
    'Accanto al nome di un campo impostato compare il link «ripristina», che riporta il valore predefinito di TREK.',
  'help.guide.own-routing-engine.title': 'Usare i tuoi server per il calcolo dei percorsi',
  'help.guide.admin-passkeys.result':
    'La pagina di accesso offre «Accedi con una passkey», e gli utenti possono aggiungere passkey nelle proprie impostazioni.',
  'help.guide.rotate-jwt-secret.goal': 'Chiudi tutte le sessioni dopo una sospetta fuga di dati.',
  'help.guide.notification-defaults.result':
    'Chi non ha modificato una cella parte dalla tua scelta, e le celle bloccate compaiono con il lucchetto nelle sue impostazioni.',
  'help.ctx.notifications.bullet.3':
    'Ogni notifica indica chi ha fatto cosa e dove. Quelle non lette hanno lo sfondo colorato. Un pulsante sotto, come «Vedi viaggio» o «Vedi Vacay», ti porta lì e la segna come letta.',
  'help.guide.read-notifications.tip.1':
    'La campanella è presente in ogni schermata con la barra di navigazione, e il numero si aggiorna da solo quando arriva qualcosa di nuovo.',
  'help.guide.filter-notifications.tip.1':
    'La pagina carica le notifiche più vecchie mentre scorri verso il basso, quindi niente viene tagliato dopo la prima schermata.',
  'help.guide.mark-notifications-read.result':
    'Nessuna notifica ha più lo sfondo colorato, e il numero rosso sulla campanella è sparito.',
  'help.guide.notification-settings.title': 'Scegliere per cosa ricevere notifiche',
  'help.guide.link-journal.step.1':
    'Clicca su «Impostazioni del viaggio» accanto al nome del viaggio e scegli «Diario» a sinistra.',
  'help.guide.dawarich-stays.tip.1':
    'Non entra nulla nel viaggio finché non clicchi su «Aggiungi luogo». Un luogo aggiunto da una sosta lo indica nei suoi dettagli: «Aggiunto dalle tue registrazioni Dawarich».',
  'help.guide.leave-stop-off-route.title': 'Escludere una tappa dal percorso',
  'help.guide.move-booking-day.step.1':
    'Passa con il mouse sulla riga della prenotazione nel giorno: la maniglia a sinistra indica che si può trascinare.',
  'help.guide.place-image-from-file.tip.1': 'Vengono proposti solo file JPG, PNG, GIF e WebP; un biglietto in PDF no.',
  'help.guide.place-own-hours.step.4':
    'I pulsanti a destra di «Orari di apertura»: il pulsante di copia applica a tutti i giorni gli orari del lunedì, e la X rimuove i tuoi orari. Se TREK aveva trovato degli orari, «Prendi dai dettagli del luogo» li ripristina.',
  'help.guide.confirm-stay-booking.step.2':
    "La prenotazione si apre sopra il programma. La prima pillola dell'intestazione ne mostra lo stato.",
  'help.ctx.trip-map.bullet.9':
    "Ogni escursione del viaggio è una linea del suo colore, con un segnaposto nel punto di partenza. Clicca sulla linea per aprire la scheda dell'escursione. In un giorno con un'escursione, il percorso della giornata arriva alla partenza dell'escursione e prosegue dal suo arrivo. L'occhio accanto a un'escursione nell'elenco «Escursioni», «Nascondi sulla mappa», toglie la sua linea dalla tua mappa.",
  'help.guide.tour-map-lines.result':
    "Sulla mappa ci sono le escursioni che vuoi, ciascuna nel suo colore, e quella che hai nascosto appare attenuata nell'elenco «Escursioni».",
  'help.guide.car-stops.step.2':
    "Clicca sulla pillola del tipo nell'intestazione e scegli «Auto». Il modulo cambia: «Data» e «Ora di inizio» diventano «Ritiro» e «Ora ritiro», «Data fine» e «Ora di fine» diventano «Riconsegna» e «Ora riconsegna», e sotto «Da» e «A» compare «Soste lungo il tragitto».",
  'help.guide.transport-details.goal':
    'Vedi in un unico posto tutti i dettagli di un tragitto, copia il codice di prenotazione, rinominalo o trovalo sulla mappa.',
  'help.guide.transport-details.tip.2':
    'Esc o un clic fuori dai dettagli li chiude. Se è aperto «Rinomina» o la richiesta di eliminazione, si chiude prima quello.',
  'help.guide.export-transports-csv.tip.1':
    "L'icona compare nella barra solo se la scheda contiene almeno un tragitto.",
  'help.guide.group-sort-bookings.step.1':
    'In «Schede» o «Elenco», clicca su «Opzioni di visualizzazione», i cursori dopo le tre icone delle viste.',
  'help.guide.create-booking.tip.4':
    'Offline, la prenotazione viene salvata su questo dispositivo e si sincronizza quando torni online. I nuovi file richiedono una connessione, quindi rimuovili o salva più tardi. Se clicchi per errore fuori dal modulo, o premi Esc, TREK chiede «Scartare le modifiche?» prima che tu perda ciò che hai scritto.',
  'help.guide.booking-on-map.tip.2': 'Un soggiorno si apre sulla prima notte.',
  'help.guide.export-bookings-csv.step.3':
    "Clicca su «Esporta come foglio di calcolo (CSV)», l'icona del foglio di calcolo dopo «Opzioni di visualizzazione».",
  'help.guide.arrange-packing-list.step.3':
    "«A-Z», all'estrema destra della riga con «Condivisa» e «La mia lista», mostra gli elementi di ogni lista in ordine alfabetico, così vedi subito se qualcosa c'è già. Cliccalo di nuovo per tornare al tuo ordine.",
  'help.guide.count-packed-pieces.step.1':
    'Clicca sul badge della quantità in una riga, il piccolo numero seguito da una x, inserisci quanti pezzi porti, ad esempio 5, e premi Invio.',
  'help.guide.expense-receipts.step.3':
    'Clicca su «Salva» in fondo alla finestra. I file vengono caricati con la spesa e compaiono anche nei «File» del viaggio.',
  'help.guide.files-sync-settings.step.1':
    "Clicca su «Sincronizzazione documenti» all'estremità destra della barra. Con il viaggio collegato, a destra si apre la scheda del tuo archivio; se hai più archivi, clicca su quello che vuoi sotto «Questo viaggio» a sinistra.",
  'help.guide.files-sync-settings.tip.3':
    "«Aggiornamenti immediati», un link con «Copia» accanto, compare solo per gli archivi in cui TREK non può iscriversi automaticamente alle modifiche. Incolla il link nell'archivio e le modifiche arriveranno subito invece che al controllo successivo.",
  'help.guide.manage-notes.step.1':
    "Clicca sui tre puntini nell'intestazione della scheda di una nota («Altre opzioni»). Il menu contiene «Espandi», «Fissa», «Modifica» ed «Elimina».",
  'help.guide.note-categories.title': 'Organizzare le note in categorie',
  'help.guide.note-categories.result':
    'Le note mostrano i nuovi nomi e colori, e la scheda «Note» mostra solo la categoria scelta.',
  'help.guide.roadtrip-stops.tip.5':
    "Una tappa con un orario di fine nel piano del giorno dura fino a quell'ora. La sua finestra indica quando riparti, e «Rimuovi l’orario di fine» ti permette di nuovo di impostare tu la durata.",
  'help.guide.roadtrip-reorder.tip.2':
    'I tragitti prenotati e i relativi terminal restano dove li colloca la prenotazione; si possono trascinare solo i luoghi.',
  'help.guide.roadtrip-overnight.step.2':
    "Un hotel mostra l'icona di un letto invece del più. Cliccala, «Aggiungi come pernottamento», per aprire «Aggiungi come sosta» per la notte. Un campeggio ha il solito «Aggiungi».",
  'help.guide.roadtrip-stop-fill.goal':
    'Assegna a una singola sosta di rifornimento o ricarica un livello proprio, ad esempio 80 % a un caricatore rapido o 100 % durante la notte.',
  'help.guide.roadtrip-bookings.goal':
    'Scopri dove si inserisce nel viaggio in auto un tragitto prenotato, ed entro quando devi arrivare lì.',
  'help.guide.roadtrip-bookings.tip.3':
    'Un tragitto che non è in nessun giorno del viaggio non fa parte del viaggio in auto: una nota in cima alla barra lo segnala, con «Apri prenotazione» per assegnargli una data.',
  'help.guide.roadtrip-google-import.step.4':
    'Sotto «Giorno», scegli il giorno in cui inserire le tappe, poi clicca su «Importa».',
  'help.guide.roadtrip-hazards.step.2':
    'Sotto «Avvisi attuali», in fondo alla colonna di destra della finestra, attiva «Mostra zone di pericolo», poi clicca su «Chiudi».',
  'help.ctx.trip-tours.bullet.1':
    "Il selettore «Luoghi» / «Escursioni» in cima alla colonna di destra sostituisce l'elenco dei luoghi con quello delle escursioni. Compare solo se il modulo Escursioni è attivo, e in quel caso le escursioni non compaiono mai nell'elenco «Luoghi».",
  'help.guide.tour-show-list.step.1':
    'Nella scheda «Pianificato», clicca su «Escursioni» nel selettore in cima alla colonna di destra. Ora la colonna elenca le escursioni invece dei luoghi.',
  'help.guide.tour-show-list.result':
    'La colonna di destra elenca le escursioni del viaggio, e quella su cui hai cliccato è aperta nella sua scheda.',
  'help.guide.tour-add-to-day.tip.1':
    "Se trascini su un giorno un'escursione con tappe, una piccola finestra pone la stessa domanda. «Annulla» lascia il programma com'era.",
  'help.guide.tour-day-times.step.2':
    "Imposta «Inizio» e lascia vuoto «Fine». La riga sotto i campi indica l'orario di fine calcolato da TREK: l'inizio più il tempo dell'escursione.",
  'help.guide.tour-remove-from-day.title': "Togliere un'escursione da un giorno",
  'help.guide.tour-filter-list.title': "Filtrare l'elenco delle escursioni",
  'help.guide.tour-filter-list.tip.3':
    "Se non resta nulla, l'elenco mostra «No tour matches these filters», e «Reimposta filtri» li toglie tutti. I filtri cambiano solo ciò che mostra l'elenco, mai un'escursione o un giorno.",
  'help.guide.tour-hide-on-map.tip.2':
    "La mappa del telefono mostra sempre tutte le escursioni, e la scheda «Escursioni» non ha l'occhio: per nascondere un'escursione usa la scheda «Pianificato».",
  'help.guide.tour-import-plan-tab.tip.2':
    "Qui l'importazione resta nell'elenco e non si apre in un planner. Assegnala a un giorno con il suo + rotondo, oppure apri la scheda «Escursioni» per vederla lì.",
  'help.ctx.trip-tour-detail.bullet.5':
    "La scheda serve per consultare l'escursione e ciò che la accompagna. Il percorso si modifica nella scheda «Escursioni»: aprila e clicca sull'escursione sotto «Escursioni di questo viaggio». Anche l'eliminazione si fa lì, non qui.",
  'help.guide.tour-detail-read.step.6':
    'Scorri ancora per «Descrizione» e «Note», poi «Origine»: «pianificata in TREK», il file da cui è stata importata o il sentiero wanderer da cui proviene, con la data.',
  'help.guide.tour-rename-colour.title': "Rinominare un'escursione e cambiarne il colore",
  'help.guide.tour-rename-colour.result':
    "L'escursione mostra il nuovo nome ovunque nel viaggio, e la sua linea ha il colore che hai scelto.",
  'help.guide.tour-take-along.tip.3':
    "Il file arriva dal server, quindi serve una connessione. Un'escursione creata offline si può scaricare dopo la sincronizzazione.",
  'help.guide.tour-copy-keep.step.4':
    'Scegli la lista sotto «Raccolta», controlla «Nome nella raccolta» e clicca su «Tieni».',
  'help.guide.tour-packing-link.step.1':
    "Apri la scheda dell'escursione e scorri fino a «Lista valigia». Clicca su «Collega una lista valigia».",
  'help.guide.tour-packing-link.result':
    "Sei sulla lista valigia nella scheda «Liste», e la scheda dell'escursione mostra ogni elemento che spunti.",
  'help.guide.tour-files.result': "I file sono allegati all'escursione e si aprono dalla sua scheda.",
  'help.guide.tour-activity-link.tip.1':
    'Il programma resta invariato. La traccia è solo collegata, e «Scollega» toglie il collegamento.',
  'help.guide.tour-activity-compare.step.3':
    'Clicca su «Confronta sulla mappa» per mostrare la traccia effettiva con una linea punteggiata accanto al programma. «Termina il confronto» la toglie.',
  'help.guide.tour-origin-check.step.2':
    "«Importato» indica il giorno dell'importazione. «Qui» mostra lo stato attuale: «Come importato», «Modificato in TREK» oppure «Ripianificato, traccia registrata conservata».",
  'help.ctx.trip-tour-planner.bullet.1':
    "«Escursioni» compare nella barra delle schede del viaggio subito dopo «Pianificato», se il modulo Escursioni è attivo. La scheda c'è su computer e tablet; sul telefono, le escursioni si consultano e si assegnano ai giorni dalla scheda «Pianificato», ma non si disegnano.",
  'help.guide.tour-open-workspace.step.1':
    'Clicca su «Escursioni» nella barra delle schede del viaggio, subito dopo «Pianificato». La mappa occupa lo schermo, con una barra su ciascun lato.',
  'help.guide.tour-open-workspace.tip.2':
    'Trascina file GPX, KML o KMZ in qualsiasi punto di questa scheda per importarli come escursioni del viaggio.',
  'help.guide.tour-draw-route.step.4':
    'In fondo alla mappa compare «Punto posizionato». «Annulla» lì accanto rimuove il punto.',
  'help.guide.tour-type-profile.title': 'Scegliere il tipo di escursione',
  'help.guide.tour-type-profile.result':
    "Il percorso dell'escursione viene calcolato per il tipo e il profilo che hai scelto.",
  'help.guide.tour-edit-points.step.6':
    '«Annulla modifica al punto di passaggio» e «Ripeti modifica al punto di passaggio», in cima alla barra, annullano o ripetono le modifiche una alla volta.',
  'help.guide.tour-shaping-points.step.3':
    'Sotto «Waypoint» compare con il badge «Punto di forma» e senza numero, così le tappe mantengono la loro numerazione.',
  'help.guide.tour-loop-reverse.step.1':
    "Clicca su «Ritorno al punto di partenza» nell'intestazione della scheda «Waypoint». L'escursione riceve un ultimo tratto che torna al primo punto.",
  'help.guide.tour-leg-by-hand.goal':
    'Collega due punti con una linea retta dove il router non trova un percorso, oppure ricalcola un tratto.',
  'help.guide.tour-trip-places.title': 'Usare un luogo del viaggio come tappa',
  'help.guide.tour-trip-places.tip.3': 'Le altre escursioni del viaggio non vengono mai proposte come tappa.',
  'help.guide.tour-details-times.tip.1': 'I tempi si possono scrivere come 2:56, 2 h 56 o 176 minuti.',
  'help.guide.tour-save.step.3':
    'Clicca su «Salva» in fondo alla barra di sinistra. Compare «Escursione salvata», e il titolo della barra diventa «Modifica escursione».',
  'help.guide.tour-edit-saved.step.1':
    "Clicca sull'escursione sotto «Escursioni di questo viaggio». Si apre nella barra di sinistra come «Modifica escursione», e la mappa ne mostra il percorso.",
  'help.guide.tour-summary-profile.title': "Leggere il riepilogo e il profilo altimetrico dell'escursione",
  'help.guide.tour-summary-profile.tip.3':
    "Un'uscita in pagaia non mostra quote, perché sull'acqua le uniche quote disponibili sarebbero quelle delle rive.",
  'help.guide.tour-list-manage.step.5':
    'Scegli «Non pianificati» per le escursioni non ancora assegnate a un giorno, oppure restringi per «Origine», «Limite di percorso» o «Tipo». Ogni riga indica quante escursioni corrispondono, e i totali seguono il filtro.',
  'help.guide.tour-delete.step.2':
    "Leggi cosa viene eliminato insieme all'escursione: il percorso, i waypoint modificabili e le assegnazioni ai giorni. Clicca su «Elimina in modo permanente».",
  'help.guide.tour-saved-elsewhere.step.2':
    '«Carica la più recente» sostituisce le tue modifiche con la versione più recente, dopo una conferma.',
  'help.ctx.trip-tour-import.bullet.1':
    'Il + in cima a «Escursioni di questo viaggio» è «Aggiungi giro». Offre «Importa GPX o KML», «Importa passeggiata da Google Maps» e «Riprendi un percorso da un altro viaggio». Puoi anche trascinare file in qualsiasi punto della scheda «Escursioni».',
  'help.guide.tour-import-gpx.step.2':
    'Scegli «Importa GPX o KML» e seleziona uno o più file .gpx, .kml o .kmz, fino a 10 MB ciascuno.',
  'help.guide.tour-import-gpx.tip.5':
    'Per un file senza quote compare «Nessuna quota nel file». La linea e la distanza sono comunque corrette, ma salita e discesa restano sconosciute.',
  'help.guide.tour-view-import.tip.2':
    "L'icona di download nell'intestazione la salva di nuovo come file GPX, e il segnalibro la salva in una raccolta.",
  'help.guide.tour-plan-from-import.step.4':
    "L'escursione si apre nell'editor con i suoi waypoint. Modificala se vuoi, poi clicca su «Salva» in fondo alla colonna.",
  'help.guide.tour-restore-recorded.step.1':
    "In «Escursioni di questo viaggio», clicca sull'escursione che hai ripianificato. La scheda «Traccia registrata» nell'editor indica che la traccia registrata originale è conservata.",
  'help.guide.tour-take-over.step.1':
    "Apri la scheda «Escursioni» del viaggio in cui vuoi inserire l'escursione. In cima a «Escursioni di questo viaggio», clicca sul + («Aggiungi giro»).",
  'help.guide.tour-take-over.tip.3':
    "«Per riprendere un percorso serve una connessione.» Se nell'editor ci sono modifiche non salvate, la copia viene comunque aggiunta all'elenco ma non si apre, così il tuo lavoro resta aperto.",
  'help.guide.tour-import-wanderer.tip.1':
    "Il pulsante compare dopo aver collegato wanderer in «Impostazioni», «Integrazioni». Prima di allora, l'elenco propone «Collega nelle impostazioni».",
  'help.ctx.trip-tour-map.bullet.2':
    "Dopo il divisore, nella pillola ci sono gli interruttori del tipo di escursione: «Posiziona punti» mentre modifichi un'escursione, «Vie ferrate» per un'escursione a piedi, «Segnali nautici» per un'uscita in pagaia e le piste per un'escursione di sci. 3D, in fondo, mostra l'escursione sul paesaggio in 3D.",
  'help.guide.tour-map-layers.step.3':
    "In un'escursione a piedi, clicca su «Escursionismo» per vedere i sentieri segnalati con i loro numeri; un giro in bici offre invece «Bicicletta» per i percorsi ciclabili. Satellite mostra le immagini aeree, e «Mappa» torna alla mappa standard.",
  'help.guide.tour-along-search.step.2':
    "Clicca su «Cosa cercare» e spunta le tipologie che vuoi, fino a sei alla volta: «Punti panoramici», «Vette», «Rifugi e ripari», «Acqua potabile», «Ristoro» e altro. L'elenco propone ciò che è adatto al tipo di escursione, e all'inizio tre tipologie sono già spuntate.",
  'help.guide.tour-along-add-stop.title': "Aggiungere come tappa un luogo lungo l'escursione",
  'help.guide.tour-along-add-stop.tip.2':
    "Un luogo che diventa il nuovo arrivo è contrassegnato con «Allunga il giro»: il vecchio arrivo non è più l'arrivo, e l'escursione prosegue fino a questo luogo.",
  'help.guide.tour-3d-terrain.step.5':
    'Clicca di nuovo su 3D per tornare alla mappa piatta e continuare a pianificare.',
  'help.guide.tour-3d-flyover.step.2':
    "Sotto «Velocità», scegli 1×, 2× o 4×. A 1×, per la maggior parte delle escursioni il sorvolo dalla partenza all'arrivo dura circa 45 secondi.",
  'help.guide.tour-map-overlays.goal':
    "Mostra sulla mappa le piste e gli impianti da sci, oppure le boe e i segnali portuali, mentre pianifichi un'escursione di sci o un'uscita in pagaia.",
  'help.guide.tour-map-overlays.tip.3':
    'Quando un livello non si carica più, il suo interruttore mostra un ! con una spiegazione; la mappa e il tuo percorso continuano a funzionare anche senza.',
  'help.guide.tour-multi-day.title': "Pianificare un'escursione su più giorni",
  'help.guide.tour-multi-day.tip.1':
    "«Termina la tappa qui» funziona anche su un'escursione di un giorno, che diventa automaticamente di più giorni. La prima e l'ultima sosta e un punto di forma non possono chiudere una tappa.",
  'help.guide.tour-stages-on-days.step.2': 'Scegli il giorno in cui inizi la prima tappa.',
  'help.guide.tour-stages-on-days.tip.4':
    "Nel piano del giorno, ogni tappa compare come Tappa N con distanza e tempo propri. «Annulla», sopra i giorni nella scheda «Pianificato», annulla in un solo passaggio l'intera distribuzione.",
  'help.ctx.trip-tour-hike.bullet.5':
    "In un'escursione a piedi, «Vie ferrate» nella riga di pulsanti della mappa in basso a sinistra mostra le vie ferrate nei dintorni. La scheda di una via ferrata la aggiunge al percorso come tratto a sé.",
  'help.guide.tour-hike-plan.step.5':
    'Sotto «Dettagli», apri «Difficoltà massima del sentiero» e scegli fino a che difficoltà possono arrivare i sentieri, da T1 («Escursionismo») a T6 («Escursionismo alpino difficile»). Il percorso viene ricalcolato entro quel limite.',
  'help.guide.tour-hike-trail-details.goal':
    "Scopri cosa registra OpenStreetMap per le vie lungo un'escursione, e trova quei tratti sulla mappa.",
  'help.guide.tour-hike-trail-details.tip.2':
    "Una difficoltà superiore al limite dell'escursione mostra nella sua riga il badge «Oltre il limite».",
  'help.guide.tour-hike-round.step.5':
    'Clicca su «Scegli questo anello», poi su «Sostituisci» quando ti viene chiesto se sostituire il percorso pianificato.',
  'help.guide.tour-hike-compare-ways.step.2':
    'Sopra la mappa si apre «Altri percorsi per questo tratto», con «Percorso attuale» e «Altra via» A, B e così via. Ognuno compare sulla mappa nel proprio colore, e puntando una riga se ne evidenzia la linea.',
  'help.guide.tour-ferrata-add.goal':
    'Trova le vie ferrate intorno alla tua escursione e inseriscine una nel percorso.',
  'help.guide.tour-ferrata-add.tip.2':
    'Le vie ferrate sono disponibili solo nelle escursioni a piedi. Una via ferrata già inclusa nel percorso mostra «Parte del giro» nella sua scheda invece di «Aggiungi al giro».',
  'help.guide.tour-run-plan.step.4':
    'Imposta partenza e arrivo sulla mappa, oppure sceglili con «Luoghi del viaggio». Sotto il passo vedi il tempo di corsa: la distanza moltiplicata per il passo.',
  'help.guide.tour-run-ways.goal':
    'Controlla quanta parte di una corsa è su fondo non asfaltato e quanto diventano difficili i sentieri.',
  'help.ctx.trip-tour-walk.summary':
    'Un percorso a piedi di tappa in tappa, pianificato nella scheda «Escursioni»: quanto ti fermi a ogni tappa, quali sono importanti, le attrazioni lungo la strada e a che ora raggiungi ciascuna tappa nel giorno della passeggiata, confrontato con gli orari di apertura.',
  'help.guide.tour-walk-plan.step.1':
    'Clicca su «Pianifica nuova escursione» in cima alla colonna di sinistra, poi apri «Tipo di tour» e scegli «Passeggiata urbana / turistica».',
  'help.guide.tour-walk-plan.tip.3':
    '«Scollega dal luogo», in «Altre azioni» di una tappa, toglie solo il collegamento a un luogo del viaggio. Il luogo resta nel viaggio.',
  'help.guide.tour-walk-sights.step.5':
    'Clicca su «Aggiungi come sosta». Un avviso indica di quanto si allunga la passeggiata, con «Annulla» accanto.',
  'help.guide.tour-walk-day-times.step.2':
    'Assegnale un orario di partenza in quel giorno: nella scheda «Pianificato», fai clic destro sulla passeggiata nel giorno, scegli «Modifica» e inserisci un «Inizio».',
  'help.guide.tour-walk-google-import.title':
    'Trasformare un percorso a piedi di Google Maps in una passeggiata urbana',
  'help.guide.tour-walk-google-import.tip.3':
    'Vengono riprese solo le tappe, non la linea disegnata in Google Maps. Per seguire un link breve maps.app.goo.gl serve una connessione.',
  'help.guide.tour-walk-check-off.tip.1':
    "I segni vengono salvati per giorno: apri la passeggiata dal suo giorno nel programma, non dall'elenco delle escursioni.",
  'help.ctx.trip-tour-bike.bullet.3':
    'La scheda «Fondo e percorsi» sotto «Waypoint» mostra il terreno del percorso: i tipi di fondo, i tipi di via e la quota che risulta non asfaltata. Clicca su una riga per evidenziarne i tratti sulla mappa.',
  'help.guide.tour-bike-profile.step.5':
    "Leggi «Tempo in bici (stimato)» nel «Riepilogo dell'escursione» a destra. Passa con il mouse sul pallino informativo per vedere come viene calcolato.",
  'help.guide.tour-bike-surfaces.title': 'Vedere i tipi di fondo di un giro in bici',
  'help.guide.tour-bike-surfaces.tip.2':
    'Con il profilo «Strada», un avviso sopra le barre indica quanta parte risulta non asfaltata. «Mostra sulla mappa» evidenzia quei tratti.',
  'help.guide.tour-bike-mtb-grades.result':
    'La mappa evidenzia i sentieri della difficoltà scelta, e sai quali tratti del giro sono quelli impegnativi.',
  'help.ctx.trip-tour-ski.bullet.2':
    "Sotto la disciplina ci sono le opzioni del router delle piste, solo quelle che riguardano la tua disciplina: «Piste più difficili», «Preferisci», «Ritmo», interruttori come «Usa gli impianti», ed «Escludi» per i tipi di impianto che non vuoi usare. Ogni modifica ricalcola l'escursione.",
  'help.guide.tour-ski-plan.step.3':
    "Sotto «Disciplina», scegli cosa farai: «Alpino», Snowboard, «Sci di fondo», «Scialpinismo», «Ciaspole» o «Escursione invernale». Non c'è nessuna preselezione, e senza disciplina l'escursione non si può salvare.",
  'help.guide.tour-ski-plan.result':
    "Un'escursione «Sci e inverno» salvata in «Escursioni di questo viaggio», con i tratti lungo piste, impianti e sentieri mappati e il tempo calcolato nel «Riepilogo dell'escursione».",
  'help.guide.tour-ski-options.tip.1': "Ogni modifica ricalcola l'escursione, tratto per tratto.",
  'help.guide.tour-ski-fix-leg.step.3':
    'Se nessuna correzione va bene, clicca su «Traccia dritto»: il tratto diventa una linea retta tra i suoi due punti.',
  'help.guide.tour-ski-summary.step.1':
    'Sotto i waypoint, cerca la scheda «Percorso sulle piste». Clicca sul titolo per comprimerla o riaprirla.',
  'help.guide.tour-ski-pistes-layer.title': 'Mostrare le piste sulla mappa',
  'help.guide.tour-ski-pistes-layer.result': "Le piste compaiono sotto l'escursione, e puoi leggerne i colori.",
  'help.guide.tour-ski-import.step.6':
    'In «Classifica traccia di sci», scegli la disciplina o la tecnica corretta e clicca su «Salva».',
  'help.ctx.trip-tour-paddle.bullet.2':
    'Ogni punto mostra il suo ruolo con un badge: «Imbarco», «Sbarco», «Reimbarco» o «Sbarco finale». Sotto un punto vedi cosa viene dopo: un tratto disegnato a mano, un trasbordo, una chiusa, oppure il motivo per cui un tratto non è stato pianificato.',
  'help.guide.tour-paddle-setup.step.2':
    'Apri «Tipo di tour» e scegli «Uscita in pagaia», «In acqua, in kayak, canoa o SUP».',
  'help.guide.tour-paddle-setup.tip.3':
    "In un'uscita in pagaia, «Lungo il percorso» cerca innanzitutto «Punti di imbarco», «Noleggio barche» e «Acqua potabile».",
  'help.guide.tour-paddle-water-route.step.4':
    "Un tratto che TREK non è riuscito a pianificare diventa rosso e ne spiega il motivo, ad esempio che per la zona non ci sono ancora dati sull'acqua. Clicca su «Traccia dritto» per disegnarlo a mano per ora.",
  'help.guide.tour-paddle-portage.goal':
    "Segna un tratto in cui trasporti l'imbarcazione, così conta come tratto a terra, con il tempo per scendere e risalire.",
  'help.guide.tour-paddle-portage.tip.3':
    'Il trasporto viene calcolato a 2 km/h finché non imposti la tua «Velocità di trasporto» nella scheda «Stima dei tempi».',
  'help.guide.tour-paddle-lock.tip.1':
    'TREK non conosce gli orari delle chiuse. I tempi sono solo quelli che inserisci, quindi verifica tu gli orari della chiusa.',
  'help.guide.tour-paddle-time.step.3':
    'La riga «Acqua» è la distanza in acqua alla tua «Velocità di pagaiata». Puoi cambiare la velocità nel campo «Velocità di pagaiata» in cima alla colonna.',
  'help.guide.tour-paddle-wind.goal': "Vedi il vento previsto alla partenza dell'escursione nel giorno in cui pagai.",
  'help.guide.tour-paddle-wind.tip.4':
    "L'assenza di un valore di previsione non significa che sia sicuro. Verifica le condizioni sul posto.",
  'help.guide.tour-paddle-checklist.step.5':
    'In fondo alla colonna, clicca su «Pagaiare comporta dei rischi» per leggere «Sicurezza in acqua» prima di partire.',
  'help.guide.tour-paddle-track-marks.goal':
    "Importa una traccia in pagaia dal tuo orologio e aggiungi dove hai trasportato l'imbarcazione e dove sei passato da una chiusa.",
  'help.guide.tour-paddle-track-marks.tip.1':
    'Clicca esattamente sulla traccia: un clic troppo lontano dalla linea viene rifiutato, e la scheda lo segnala.',
  'help.ctx.trip-tour-horse.bullet.3':
    "Ogni sezione è un badge nella scheda «Waypoint» con il nome dell'itinerario, un pallino per l'accesso e la lunghezza. Un tratto non coperto da nessun itinerario equestre mostra «Manuale, non verificato».",
  'help.guide.tour-horse-plan.step.4':
    "Clicca su un itinerario nell'elenco: si apre su una mappa propria, con le sezioni numerate.",
  'help.guide.tour-horse-plan.tip.4':
    "«Annulla modifica al punto di passaggio», in cima alla colonna di sinistra, annulla un'intera sezione in un solo passaggio.",
  'help.guide.tour-horse-gap.result':
    "L'uscita non ha più interruzioni, e il tratto di collegamento è contrassegnato come disegnato a mano.",
  'help.guide.tour-horse-recorded.step.3': 'Clicca su «Importa 1 escursione».',
  'help.guide.dissolve-fusion.step.3': 'Conferma con «Sciogli» nella finestra di conferma.',
};

export default help;
