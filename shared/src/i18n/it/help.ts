import type { TranslationStrings } from '../types';

// English fallback until 'it' is translated.
const help: TranslationStrings = {
  'help.title': 'Help & Docs',
  'help.search': 'Search docs…',
  'help.contents': 'Contents',
  'help.noResults': 'No matching pages.',
  'help.errorTitle': "Couldn't load this page",
  'help.errorBody': 'The help content is fetched from the TREK wiki. Check your connection and try again.',

  // center
  'help.center.button': 'Aiuto per questa schermata',
  'help.center.title': 'Aiuto',
  'help.center.onThisScreen': 'In questa schermata',
  'help.center.screens': 'Schermate',
  'help.center.thisScreen': 'Questa schermata',
  'help.center.subScreens': 'Sottoschermate: {count}',
  'help.center.subScreensLabel': 'Sottoschermate',
  'help.center.guidesCount': '{count} guide',
  'help.center.goToScreen': 'Vai a {screen}',
  'help.center.overview': 'Panoramica',
  'help.center.howTo': 'Come faccio a…',
  'help.center.searchPlaceholder': 'Cerca in guide e documentazione…',
  'help.center.searchEmpty': 'Nessun risultato per «{query}».',
  'help.center.searchGuides': 'Guide',
  'help.center.searchDocs': 'Documentazione',
  'help.center.searchError': 'La ricerca non è disponibile al momento.',
  'help.center.back': 'Indietro',
  'help.center.close': "Chiudi l'aiuto",
  'help.center.steps': '{count} passaggi',
  'help.center.step': 'Passaggio {n}',
  'help.center.stepsLabel': 'Passaggi',
  'help.center.stepOf': 'Passaggio {n} di {total}',
  'help.center.screenshot': 'Schermata',
  'help.center.result': 'Cosa ottieni',
  'help.center.tips': 'Buono a sapersi',
  'help.center.related': 'Correlati',
  'help.center.openDocs': 'Apri in Aiuto e documentazione',
  'help.center.docsSection': 'Nella documentazione',
  'help.center.noContext': "Non c'è ancora una guida per questa schermata.",
  'help.center.noContextHint': 'Cerca nella documentazione o dicci cosa stavi cercando.',
  'help.center.feedback': 'Manca qualcosa?',
  'help.center.feedbackLink': 'Diccelo su GitHub',
  'help.center.discord': 'Chiedi su Discord',
  'help.center.quick': 'Rapido',
  'help.center.guide': 'Guida',
  'help.center.tour': 'Dimostrazione',
  'help.center.imageAlt': 'Passaggio {n} di «{title}»',

  // ctx
  'help.ctx.dashboard.title': 'Dashboard',
  'help.ctx.dashboard.summary':
    "La dashboard è la porta d'ingresso a ogni viaggio. La carta d'imbarco in alto mette in evidenza il viaggio in corso o il prossimo, la riga sotto conta quanto hai già viaggiato, e le schede elencano tutto ciò che stai pianificando, hai archiviato o hai già concluso.",
  'help.ctx.dashboard.bullet.1':
    "Carta d'imbarco: il viaggio in corso o il prossimo, con date, viaggiatori, luoghi e un conto alla rovescia. Cliccala per aprire il viaggio.",
  'help.ctx.dashboard.bullet.2':
    'Statistiche: paesi visitati, viaggi, giorni in viaggio e distanza in volo, su tutti i tuoi viaggi.',
  'help.ctx.dashboard.bullet.3':
    'Schede dei viaggi, filtrate per Pianificati, Archiviati e Completato, a griglia o a elenco. Passa il mouse su una scheda per modificare, duplicare, archiviare ed eliminare.',
  'help.ctx.dashboard.bullet.4':
    'Widget a destra: convertitore di valute, orologi mondiali, prenotazioni imminenti e collezioni. Ognuno può essere disattivato.',
  'help.ctx.dashboard.bullet.5':
    'La scheda «Nuovo Viaggio» e il pulsante in basso a destra avviano entrambi un nuovo viaggio.',

  // create-trip
  'help.guide.create-trip.title': 'Creare un viaggio',
  'help.guide.create-trip.goal': 'Iniziare un nuovo viaggio con nome, date e foto di copertina.',
  'help.guide.create-trip.step.1':
    'Clicca «Nuovo Viaggio». La scheda in fondo ai tuoi viaggi e il pulsante in basso a destra fanno la stessa cosa.',
  'help.guide.create-trip.step.2':
    "Dai un nome al viaggio. È l'unico campo obbligatorio; tutto il resto si può aggiungere dopo.",
  'help.guide.create-trip.step.3':
    "Scegli una data di inizio e una di fine. TREK crea un giorno per ogni data, così l'itinerario è pronto da riempire.",
  'help.guide.create-trip.step.4':
    'Facoltativo: aggiungi una foto di copertina. Carica la tua, trascinane una o cerca la destinazione su Unsplash.',
  'help.guide.create-trip.step.5': 'Clicca «Crea Nuovo Viaggio».',
  'help.guide.create-trip.result':
    "Il viaggio compare nella dashboard. Se è il prossimo, prende il posto sulla carta d'imbarco in alto.",
  'help.guide.create-trip.tip.1':
    'Le date si possono cambiare in seguito. Se esistono già prenotazioni, TREK chiede se spostarle insieme ai giorni.',
  'help.guide.create-trip.tip.2':
    'La valuta del viaggio scelta qui è quella in cui viene convertita ogni spesa. Scegli la valuta della destinazione.',

  // edit-trip
  'help.guide.edit-trip.title': 'Modificare un viaggio',
  'help.guide.edit-trip.goal': 'Rinominare un viaggio, cambiarne le date o regolarne le impostazioni.',
  'help.guide.edit-trip.step.1':
    "Passa il mouse sulla scheda del viaggio (o sulla carta d'imbarco) e clicca la matita.",
  'help.guide.edit-trip.step.2':
    'Cambia ciò che serve: nome, descrizione, date, copertina, valuta, promemoria o membri.',
  'help.guide.edit-trip.step.3': 'Clicca «Aggiorna».',
  'help.guide.edit-trip.result': 'La scheda si aggiorna subito, per ogni membro del viaggio.',
  'help.guide.edit-trip.tip.1':
    'Spostare le date di un viaggio che ha già prenotazioni apre un secondo passaggio che chiede se anche le prenotazioni devono spostarsi.',

  // cover-image
  'help.guide.cover-image.title': 'Impostare una foto di copertina',
  'help.guide.cover-image.goal': "Dare al viaggio un'immagine che compaia sulla scheda e sulla carta d'imbarco.",
  'help.guide.cover-image.step.1': 'Apri il modulo di modifica del viaggio con la matita sulla sua scheda.',
  'help.guide.cover-image.step.2':
    'In «Immagine di copertina», trascina una foto, clicca per caricarne una o scrivi una destinazione nella ricerca Unsplash.',
  'help.guide.cover-image.step.3': 'Scegli una foto e clicca «Aggiorna».',
  'help.guide.cover-image.result': 'La foto viene salvata con il viaggio e compare ovunque il viaggio sia elencato.',
  'help.guide.cover-image.tip.1':
    'Le foto dalla ricerca Unsplash vengono attribuite automaticamente; i tuoi caricamenti restano sul tuo server.',

  // duplicate-trip
  'help.guide.duplicate-trip.title': 'Duplicare un viaggio',
  'help.guide.duplicate-trip.goal': 'Riutilizzare un viaggio come modello per uno nuovo.',
  'help.guide.duplicate-trip.step.1': "Passa il mouse sulla scheda e clicca l'icona di duplicazione.",
  'help.guide.duplicate-trip.step.2': 'Leggi cosa verrà copiato e cosa no, poi conferma.',
  'help.guide.duplicate-trip.result': "Accanto all'originale compare una copia, pronta da rinominare e ridatare.",
  'help.guide.duplicate-trip.tip.1':
    'Giorni, luoghi, prenotazioni, voci di budget, liste bagagli e note dei giorni vengono copiati. Membri, chat, sondaggi, file e link di condivisione no.',

  // archive-trip
  'help.guide.archive-trip.title': 'Archiviare e ripristinare un viaggio',
  'help.guide.archive-trip.goal': 'Mettere da parte un viaggio senza eliminarlo e recuperarlo più avanti.',
  'help.guide.archive-trip.step.1': 'Passa il mouse sulla scheda e clicca «Archivia».',
  'help.guide.archive-trip.step.2': 'Imposta il filtro sopra le schede su «Archiviati» per rivederlo.',
  'help.guide.archive-trip.step.3': 'Clicca «Ripristina» sulla scheda per riportarlo in «Pianificati».',
  'help.guide.archive-trip.result':
    'I viaggi archiviati conservano tutto. Smettono solo di ingombrare la dashboard e il feed calendario di tutti i viaggi.',

  // delete-trip
  'help.guide.delete-trip.title': 'Eliminare un viaggio',
  'help.guide.delete-trip.goal': 'Rimuovere un viaggio per sempre.',
  'help.guide.delete-trip.step.1': 'Passa il mouse sulla scheda e clicca il cestino.',
  'help.guide.delete-trip.step.2':
    'Conferma. La finestra riporta il nome del viaggio, così sai di avere quello giusto.',
  'help.guide.delete-trip.result':
    'Il viaggio, i suoi giorni, luoghi, prenotazioni e file spariscono. Non si può annullare: nel dubbio, archivia.',

  // filter-and-view
  'help.guide.filter-and-view.title': 'Trovare i viaggi completati, passare da griglia a elenco',
  'help.guide.filter-and-view.goal': 'Vedere i viaggi conclusi o archiviati e scegliere il layout che preferisci.',
  'help.guide.filter-and-view.step.1':
    'Usa «Pianificati», «Archiviati» e «Completato» sopra le schede. Completato è ogni viaggio la cui data di fine è passata.',
  'help.guide.filter-and-view.step.2':
    "Clicca l'icona elenco per passare a un elenco compatto; cliccala di nuovo per la griglia.",
  'help.guide.filter-and-view.result': 'La dashboard ricorda il tuo layout su questo dispositivo.',

  // calendar-feed
  'help.guide.calendar-feed.title': 'Iscriversi a tutti i viaggi nel calendario',
  'help.guide.calendar-feed.goal':
    'Vedere giorni e prenotazioni di ogni viaggio attivo nella tua app di calendario, sempre sincronizzati.',
  'help.guide.calendar-feed.step.1': "Clicca l'icona del calendario accanto al selettore di vista.",
  'help.guide.calendar-feed.step.2': 'Clicca «Enable calendar subscription». TREK genera un link privato al feed.',
  'help.guide.calendar-feed.step.3':
    'Aggiungi il feed con uno dei pulsanti (Google, Apple, Outlook) o copia il link in qualsiasi app di calendario che si iscrive a URL.',
  'help.guide.calendar-feed.result':
    'Ogni viaggio attivo compare nel tuo calendario e si aggiorna da solo. Restano fuori i viaggi archiviati e quelli conclusi da più di 90 giorni.',
  'help.guide.calendar-feed.tip.1':
    'Il link è un segreto. Chiunque lo abbia può leggere il feed; revocalo dalla stessa finestra se dovesse trapelare.',

  // widgets
  'help.guide.widgets.title': 'Scegliere i widget della dashboard',
  'help.guide.widgets.goal': 'Mostrare o nascondere la riga delle statistiche e i widget a destra.',
  'help.guide.widgets.step.1': 'Apri il menu del tuo avatar in alto a destra e scegli «Impostazioni».',
  'help.guide.widgets.step.2': 'Passa alla scheda «Appearance».',
  'help.guide.widgets.step.3':
    'Sotto «Dashboard widgets», attiva o disattiva ogni widget. Desktop e mobile si impostano separatamente.',
  'help.guide.widgets.step.4': 'Torna alla dashboard. La modifica è immediata.',
  'help.guide.widgets.result':
    "I widget nascosti lasciano spazio ai tuoi viaggi; disattiva l'intera colonna destra per centrare il layout.",
  'help.guide.widgets.link': "Apri le impostazioni dell'aspetto",

  // currency-widget
  'help.guide.currency-widget.title': 'Convertire valute',
  'help.guide.currency-widget.goal': 'Convertire un importo tra due valute con i tassi attuali.',
  'help.guide.currency-widget.step.1': "Digita l'importo e scegli le due valute.",
  'help.guide.currency-widget.step.2': 'La freccia in mezzo scambia la coppia; la freccia circolare aggiorna il tasso.',
  'help.guide.currency-widget.result':
    'La tua coppia di valute viene ricordata nel tuo account, quindi è la stessa su ogni dispositivo.',
  'help.guide.currency-widget.tip.1':
    'I tassi arrivano dalla Banca centrale europea e si aggiornano una volta al giorno.',

  // timezones-widget
  'help.guide.timezones-widget.title': 'Aggiungere orologi mondiali',
  'help.guide.timezones-widget.goal': "Tenere d'occhio l'ora locale delle tue destinazioni.",
  'help.guide.timezones-widget.step.1': 'Clicca + nel widget «Fusi orari» e cerca una città.',
  'help.guide.timezones-widget.step.2': 'Rimuovi un orologio con la × accanto.',
  'help.guide.timezones-widget.result': 'I tuoi orologi vengono salvati con il tuo account.',

  // ── Screen: vacay ──────────────────────────────────────────────────────────
  'help.ctx.vacay.title': 'Vacay',
  'help.ctx.vacay.summary':
    "Vacay è il tuo pianificatore personale delle ferie: quanti giorni hai nell'anno, quali hai registrato e quanti restano. La griglia mostra l'intero anno a colpo d'occhio; la barra laterale contiene il selettore dell'anno, le persone con cui pianifichi, i calendari condivisi con te, la legenda e le tue ferie spettanti.",
  'help.ctx.vacay.bullet.1':
    'Griglia annuale: dodici schede mensili, una cella per giorno. Clicca un giorno per registrarlo o cancellarlo. Un puntino blu segna i giorni già coperti da un viaggio.',
  'help.ctx.vacay.bullet.2':
    'Barra in basso: modalità Ferie o Ferie aziendali, più gli interruttori Mezza giornata e Recupero / Flex che cambiano cosa registra un clic.',
  'help.ctx.vacay.bullet.3':
    "Disponibilità: i tuoi giorni dell'anno, quanti usati e quanti restano, con il riporto dal periodo precedente.",
  'help.ctx.vacay.bullet.4':
    'Persone sono chi si è fuso col tuo piano, ognuno col suo colore. Calendari condivisi sono anelli in sola lettura dei giorni liberi degli altri.',
  'help.ctx.vacay.bullet.5':
    'Le Impostazioni coprono weekend, inizio settimana, riporto, il tuo anno di ferie, ferie aziendali e calendari di festività o vacanze scolastiche.',
  // log-day
  'help.guide.log-day.title': 'Registrare un giorno di ferie',
  'help.guide.log-day.goal': 'Segnare un giorno libero nella griglia e vedere il saldo seguirlo.',
  'help.guide.log-day.step.1':
    'Guarda la barra in basso: il pulsante a sinistra, nel tuo colore, significa che un clic registra un giorno di ferie per te.',
  'help.guide.log-day.step.2':
    'Clicca un giorno in una scheda mensile. Si riempie del tuo colore e Usati conta un giorno in più.',
  'help.guide.log-day.step.3': 'Clicca di nuovo lo stesso giorno per cancellarlo.',
  'help.guide.log-day.result':
    'Il giorno è registrato, Giorni, Usati e Rimanenti si aggiornano subito, e chi è fuso col tuo piano lo vede dal vivo.',
  'help.guide.log-day.tip.1': 'I weekend non si possono registrare finché Blocca weekend è attivo nelle Impostazioni.',
  'help.guide.log-day.tip.2':
    'Un punto blu in una cella significa che uno dei tuoi viaggi copre quel giorno: così vedi dove ferie e viaggi coincidono.',
  // half-day
  'help.guide.half-day.title': 'Registrare una mezza giornata',
  'help.guide.half-day.goal': 'Prendersi un pomeriggio senza spendere un giorno intero di ferie.',
  'help.guide.half-day.step.1':
    'Attiva Mezza giornata nella barra. Il suo punto arancione è il segno che una mezza giornata riceve nella griglia.',
  'help.guide.half-day.step.2': "Clicca un giorno. Viene registrato come 0,5 e porta il punto arancione nell'angolo.",
  'help.guide.half-day.step.3':
    'Disattiva Mezza giornata quando hai finito; cliccare una mezza giornata con altre impostazioni la converte sul posto.',
  'help.guide.half-day.result':
    'Usati cresce di 0,5. Mezza giornata e Recupero / Flex sono indipendenti, quindi è possibile anche mezza giornata di recupero.',
  'help.guide.half-day.tip.1':
    'La barra mostra sempre il segno che il prossimo clic metterà, così puoi controllare prima di registrare.',
  // comp-day
  'help.guide.comp-day.title': 'Registrare recupero o flex',
  'help.guide.comp-day.goal': 'Prendere tempo compensativo che non costa giorni di ferie.',
  'help.guide.comp-day.step.1':
    "Attiva Recupero / Flex nella barra. Il disco tratteggiato è l'aspetto di un giorno di recupero nella griglia.",
  'help.guide.comp-day.step.2':
    'Clicca un giorno. Si riempie di un tratteggio diagonale nel tuo colore invece di un blocco pieno.',
  'help.guide.comp-day.result':
    'I giorni di recupero sono contati accanto alle tessere delle ferie e non riducono mai Rimanenti.',
  'help.guide.comp-day.tip.1':
    'Straordinari recuperati, flessibilità, un giorno di compensazione: tutto ciò che è libero ma non ferie va qui.',
  // entitlement
  'help.guide.entitlement.title': 'Impostare le ferie spettanti',
  'help.guide.entitlement.goal': "Dire a Vacay quanti giorni di ferie hai nell'anno.",
  'help.guide.entitlement.step.1': 'Nella barra laterale, clicca la tessera Giorni sotto Disponibilità.',
  'help.guide.entitlement.step.2': 'Digita il numero di giorni e premi Invio.',
  'help.guide.entitlement.result':
    "Rimanenti viene ricalcolato dalle ferie spettanti, dall'eventuale riporto e dai giorni usati.",
  'help.guide.entitlement.tip.1':
    "Ogni anno ha le sue ferie spettanti, quindi una modifica qui riguarda solo l'anno selezionato.",
  // years
  'help.guide.years.title': 'Aggiungere e cambiare anno',
  'help.guide.years.goal': "Pianificare già l'anno prossimo, o rivedere quello passato.",
  'help.guide.years.step.1':
    "Clicca il + a destra dell'anno per aggiungere il successivo, o il + a sinistra per il precedente.",
  'help.guide.years.step.2': "Passa da un anno all'altro con le frecce o con le etichette degli anni sotto.",
  'help.guide.years.step.3':
    'Per rimuovere un anno, passa il mouse sulla sua etichetta e clicca il piccolo meno. Le sue voci se ne vanno con lui, quindi conferma con attenzione.',
  'help.guide.years.result': 'Ogni anno conserva le proprie ferie spettanti e le proprie voci; il riporto li collega.',
  // company-holidays
  'help.guide.company-holidays.title': 'Segnare le ferie aziendali',
  'help.guide.company-holidays.goal':
    "Bloccare i giorni in cui tutta l'azienda è chiusa senza intaccare le ferie di nessuno.",
  'help.guide.company-holidays.step.1':
    'Apri le Impostazioni e verifica che Ferie aziendali sia attivo. Lo è di default; la barra offre la modalità solo finché lo è.',
  'help.guide.company-holidays.step.2': 'Tornato nella griglia, porta la barra in modalità Ferie aziendali.',
  'help.guide.company-holidays.step.3': 'Clicca i giorni. Diventano ambra e compaiono nella legenda.',
  'help.guide.company-holidays.result':
    'Le ferie aziendali sono visibili a tutti quelli fusi nel piano e non riducono mai Rimanenti.',
  'help.guide.company-holidays.tip.1':
    'Qualsiasi persona fusa può modificare le ferie aziendali: accordatevi su chi le mantiene.',
  // public-holidays
  'help.guide.public-holidays.title': 'Mostrare le festività',
  'help.guide.public-holidays.goal': 'Mettere sulla griglia le festività del tuo paese o della tua regione.',
  'help.guide.public-holidays.step.1': 'Apri le Impostazioni e attiva Festività pubbliche.',
  'help.guide.public-holidays.step.2':
    "Clicca Aggiungi calendario, poi scegli il paese e, dove conta, la regione. Dagli un colore e un'etichetta se vuoi.",
  'help.guide.public-holidays.step.3': 'Chiudi le Impostazioni. Le festività compaiono nella griglia e nella legenda.',
  'help.guide.public-holidays.result':
    'Le festività sono segnate nel colore del calendario e non contano mai contro le tue ferie.',
  'help.guide.public-holidays.tip.1':
    'Puoi aggiungere più calendari, ad esempio la tua regione e quella di un collega fuso.',
  // school-holidays
  'help.guide.school-holidays.title': 'Mostrare le vacanze scolastiche',
  'help.guide.school-holidays.goal': 'Vedere le vacanze scolastiche della tua regione accanto ai tuoi giorni liberi.',
  'help.guide.school-holidays.step.1': 'Apri le Impostazioni e attiva School Holidays.',
  'help.guide.school-holidays.step.2':
    'Clicca Aggiungi calendario e scegli il paese. Dove un paese divide il suo calendario, scegli anche la regione o il gruppo.',
  'help.guide.school-holidays.step.3':
    'Chiudi le Impostazioni. Ogni periodo riceve una banda colorata in basso nei suoi giorni.',
  'help.guide.school-holidays.result':
    'Le vacanze scolastiche sono puramente visive: non riducono le ferie di nessuno.',
  'help.guide.school-holidays.tip.1':
    "Manca la regione? L'amministratore può gestire le vacanze scolastiche a mano in Admin, Personalizzazione, Vacanze scolastiche.",
  // weekends
  'help.guide.weekends.title': "Bloccare i weekend e impostare l'inizio settimana",
  'help.guide.weekends.goal':
    'Tenere i weekend fuori dal conteggio e iniziare la settimana dal giorno a cui sei abituato.',
  'help.guide.weekends.step.1': 'Apri le Impostazioni.',
  'help.guide.weekends.step.2': 'Attiva Blocca weekend e scegli quali giorni contano come weekend.',
  'help.guide.weekends.step.3': 'Sotto La settimana inizia il, scegli lunedì o domenica.',
  'help.guide.weekends.result':
    'I giorni bloccati sono in grigio nella griglia e non si possono registrare per sbaglio.',
  // leave-year
  'help.guide.leave-year.title': 'Impostare il tuo anno di ferie',
  'help.guide.leave-year.goal':
    'Contare le ferie su un anno fiscale o dalla data di assunzione invece che da gennaio a dicembre.',
  'help.guide.leave-year.step.1': 'Apri le Impostazioni e trova Anno delle ferie.',
  'help.guide.leave-year.step.2':
    'Scegli Anno solare, Anno fiscale (con mese e giorno di inizio) o Assunzione (con la data in cui sei stato assunto).',
  'help.guide.leave-year.result':
    'Ferie spettanti, giorni usati e riporto seguono quel periodo, e la griglia inizia dal suo primo mese.',
  'help.guide.leave-year.tip.1':
    'Questa impostazione è personale: in un piano fuso ognuno mantiene il proprio anno di ferie e i propri numeri.',
  // carry-over
  'help.guide.carry-over.title': 'Riportare i giorni non usati',
  'help.guide.carry-over.goal': 'Aggiungere ciò che resta alla fine di un periodo a quello successivo.',
  'help.guide.carry-over.step.1': 'Apri le Impostazioni.',
  'help.guide.carry-over.step.2': 'Attiva Riporto.',
  'help.guide.carry-over.result':
    "L'importo riportato viene ricalcolato su tutti i tuoi anni e mostrato sotto le ferie spettanti.",
  'help.guide.carry-over.tip.1': 'Disattivarlo azzera ogni saldo di riporto.',
  // invite
  'help.guide.invite.title': 'Pianificare insieme a qualcuno',
  'help.guide.invite.goal':
    'Fondere il tuo piano con un altro utente TREK per vedere i giorni liberi di entrambi in una sola griglia.',
  'help.guide.invite.step.1': "Clicca l'icona della persona nel pannello Persone.",
  'help.guide.invite.step.2': "Scegli l'utente e invia l'invito.",
  'help.guide.invite.step.3': "Riceve una notifica e accetta. Fino ad allora l'invito risulta in attesa.",
  'help.guide.invite.result':
    "I due piani si fondono: ogni persona ha un colore, potete registrare giorni l'uno per l'altro, e tutto si sincronizza dal vivo.",
  'help.guide.invite.tip.1':
    'Per annullare una fusione, usa Sciogli nelle Impostazioni. Le voci di ognuno tornano al proprio piano.',
  'help.guide.invite.tip.2':
    "Se l'altra persona deve solo vedere i tuoi giorni, condividi il calendario invece di fondere.",
  // share-calendar
  'help.guide.share-calendar.title': 'Condividere il calendario in sola lettura',
  'help.guide.share-calendar.goal': 'Far vedere a qualcuno quando sei libero senza dargli voce sul tuo piano.',
  'help.guide.share-calendar.step.1': "Clicca l'icona di condivisione nel pannello Calendari condivisi.",
  'help.guide.share-calendar.step.2': "Scegli l'utente e clicca Condividi. Non serve alcuna accettazione.",
  'help.guide.share-calendar.step.3':
    "I calendari condivisi con te compaiono nello stesso pannello; l'occhio ne nasconde uno, Interrompi condivisione revoca il tuo.",
  'help.guide.share-calendar.result':
    'I tuoi giorni liberi compaiono come un anello colorato nella sua griglia. Nulla di ciò che condividi può essere modificato da lì.',
  'help.guide.share-calendar.tip.1':
    'Condivisione e fusione sono indipendenti: puoi essere fuso con una persona e condividere con altre.',
  'help.guide.share-calendar.tip.2': 'Passa il mouse su un giorno con anello per vedere chi è libero e per quanto.',

  // ── Screen: atlas ─────────────────────────────────────────────────────────────────────
  'help.ctx.atlas.title': 'Atlas',
  'help.ctx.atlas.summary':
    'L’Atlas è la tua impronta di viaggio su una mappa del mondo: ogni paese in cui un viaggio ti ha portato è colorato, e quelli visitati prima di TREK li aggiungi a mano. Ingrandisci per le regioni, tieni una lista desideri dei luoghi che vuoi ancora vedere e leggi i tuoi numeri nel pannello di vetro in basso.',
  'help.ctx.atlas.bullet.1':
    'La mappa: i paesi visitati portano un colore che resta loro, quelli pianificati hanno un contorno tratteggiato, quelli della lista desideri un tratteggio diagonale, tutto il resto è grigio. Passa sopra un paese per vedere viaggi, luoghi e prima e ultima visita.',
  'help.ctx.atlas.bullet.2':
    'Ricerca in alto: digita un paese o un luogo. Scegliere un paese fa volare la mappa lì e apre la sua finestra; scegliere un luogo atterra nella sua regione, così puoi segnarla.',
  'help.ctx.atlas.bullet.3':
    'Mostra i paesi in programma, in alto a destra: rivela i paesi dei tuoi prossimi viaggi. L’interruttore compare solo finché ne hai.',
  'help.ctx.atlas.bullet.4':
    'Pannello in basso: la scheda Statistiche con paesi, viaggi, luoghi, città, giorni, continenti e la tua serie; la scheda Lista desideri con ciò che ti aspetta ancora.',
  'help.ctx.atlas.bullet.5':
    'Regioni: dal livello di zoom 5 la mappa passa a stati e province, ognuno cliccabile per segnarlo o rimuoverlo.',
  'help.ctx.atlas.bullet.6':
    'Dawarich: con l’addon collegato, un pannello a sinistra delle statistiche spunta desideri e aggiunge paesi dalle tue registrazioni, mai senza la tua conferma.',
  // mark-country
  'help.guide.mark-country.title': 'Segnare un paese come visitato',
  'help.guide.mark-country.goal':
    'Aggiungi un paese in cui sei stato prima di TREK, così mappa e conteggio lo includono.',
  'help.guide.mark-country.step.1': 'Digita il paese nella casella di ricerca in cima alla mappa.',
  'help.guide.mark-country.step.2':
    'Scegli il paese dalla lista. La mappa vola lì e si apre una finestra per quel paese.',
  'help.guide.mark-country.step.3': 'Scegli Segna come visitato.',
  'help.guide.mark-country.result':
    'Il paese prende il suo colore sulla mappa e Paesi conta uno in più. Quel colore è permanente: segnare altri paesi non rimescola mai gli altri.',
  'help.guide.mark-country.tip.1':
    'Cliccare un paese grigio sulla mappa apre la stessa finestra; la ricerca è la via sicura per i paesi piccoli.',
  'help.guide.mark-country.tip.2':
    'Un paese segnato a mano conta sempre come visitato, qualunque siano le date di un viaggio che ci va.',
  // unmark-country
  'help.guide.unmark-country.title': 'Rimuovere un paese che hai segnato',
  'help.guide.unmark-country.goal': 'Togli di nuovo dalla mappa un paese segnato a mano.',
  'help.guide.unmark-country.step.1':
    'Cerca il paese e scegli, oppure cliccalo sulla mappa. Per un paese segnato da te la finestra chiede se rimuoverlo.',
  'help.guide.unmark-country.step.2': 'Conferma con Rimuovi.',
  'help.guide.unmark-country.result': 'Il paese torna grigio ed esce dal tuo conteggio.',
  'help.guide.unmark-country.tip.1':
    'Solo i paesi segnati a mano si rimuovono così. Un paese con viaggi o luoghi resta finché li ha; Rimuovi sta anche nella sua scheda di dettaglio nel pannello quando è stato segnato a mano.',
  // country-details
  'help.guide.country-details.title': 'Vedere cosa hai fatto in un paese',
  'help.guide.country-details.goal': 'Apri un paese visitato e salta ai viaggi che ti hanno portato lì.',
  'help.guide.country-details.step.1': 'Cerca un paese che hai visitato.',
  'help.guide.country-details.step.2':
    'Scegli il paese. La mappa vola lì e il pannello in basso aggiunge una scheda con bandiera, luoghi, viaggi e un chip per viaggio.',
  'help.guide.country-details.result': 'Clicca un chip di viaggio per aprire quel viaggio nel pianificatore.',
  'help.guide.country-details.tip.1':
    'Passando sopra il paese sulla mappa vedi gli stessi numeri più la prima e l’ultima visita.',
  // planned-countries
  'help.guide.planned-countries.title': 'Mostrare i paesi in cui andrai',
  'help.guide.planned-countries.goal':
    'Porta sulla mappa i paesi dei tuoi prossimi viaggi senza contarli come visitati.',
  'help.guide.planned-countries.step.1':
    'Attiva Mostra i paesi in programma, in alto a destra. Il numero accanto dice quanti aspettano.',
  'help.guide.planned-countries.step.2':
    'Cerca un paese pianificato e scegli: il pannello dice In programma e il tooltip della mappa mostra quando parti.',
  'help.guide.planned-countries.result':
    'I paesi pianificati compaiono con contorno tratteggiato, così non sembrano mai un posto dove sei già stato. L’interruttore ricorda la tua scelta.',
  'help.guide.planned-countries.tip.1':
    'Un paese conta come visitato appena il viaggio lì è iniziato; anche un viaggio in corso conta. I viaggi senza date restano del tutto fuori dalle statistiche.',
  'help.guide.planned-countries.tip.2': 'L’interruttore esiste solo finché hai viaggi in arrivo.',
  // regions
  'help.guide.regions.title': 'Segnare una regione',
  'help.guide.regions.goal': 'Più fine dei paesi: segna gli stati, le province o le prefetture in cui sei stato.',
  'help.guide.regions.step.1':
    'Ingrandisci un paese finché compaiono le sue regioni, dal livello di zoom 5. Cercare il paese e sceglierlo ti porta abbastanza vicino.',
  'help.guide.regions.step.2':
    'Clicca una regione. Passandoci sopra compare il nome; la finestra mostra la regione e il suo paese.',
  'help.guide.regions.step.3': 'Scegli Segna come visitato.',
  'help.guide.regions.result':
    'La regione si riempie del colore del paese. Segnare una regione conta anche il paese come visitato se non lo era già.',
  'help.guide.regions.tip.1':
    'Cliccare una regione visitata offre Rimuovi, che l’abbia segnata tu o che ce l’abbia messa un luogo.',
  'help.guide.regions.tip.2': 'Le regioni in cui hai luoghi reali vengono segnate per te; lì non c’è nulla da fare.',
  // search-place
  'help.guide.search-place.title': 'Trovare un luogo e segnare la sua regione',
  'help.guide.search-place.goal': 'Segna la Baviera cercando Monaco, senza sapere in quale regione si trova una città.',
  'help.guide.search-place.step.1':
    'Digita una città, un monumento o un indirizzo nella casella di ricerca. I paesi vengono prima; i luoghi corrispondenti compaiono sotto, sotto Luoghi.',
  'help.guide.search-place.step.2': 'Scegli il luogo. La mappa vola lì e capisce in quale regione si trova il punto.',
  'help.guide.search-place.step.3':
    'Scegli Segna come visitato per quella regione, oppure Aggiungi alla lista desideri se ti aspetta ancora.',
  'help.guide.search-place.result':
    'La regione è segnata, e con lei il paese. I paesi senza dati regionali nel pacchetto mappe ripiegano sul paese stesso.',
  'help.guide.search-place.tip.1':
    'I luoghi vengono dalla stessa ricerca usata ovunque in TREK, quindi seguono il provider impostato dal tuo admin.',
  // bucket-country
  'help.guide.bucket-country.title': 'Mettere un paese nella lista desideri',
  'help.guide.bucket-country.goal':
    'Tieni una lista desideri di paesi direttamente sulla mappa, separata da quelli in cui sei stato.',
  'help.guide.bucket-country.step.1': 'Cerca il paese e scegli, oppure cliccalo sulla mappa.',
  'help.guide.bucket-country.step.2': 'Scegli Aggiungi alla lista desideri.',
  'help.guide.bucket-country.step.3':
    'Scegli mese e anno se sai già quando, poi conferma con Aggiungi alla lista desideri.',
  'help.guide.bucket-country.result':
    'Il paese è disegnato con un tratteggio diagonale nel colore che avrà quando ci arriverai, e compare nella scheda Lista desideri del pannello.',
  'help.guide.bucket-country.tip.1':
    'La stessa finestra offre Rimuovi dalla lista desideri una volta che il paese è in lista.',
  'help.guide.bucket-country.tip.2':
    'Una voce per data obiettivo: lo stesso paese può stare in lista per due mesi diversi, ma non due volte per lo stesso.',
  // bucket-place
  'help.guide.bucket-place.title': 'Aggiungere un luogo alla lista desideri',
  'help.guide.bucket-place.goal':
    'Salva una città, un’attrazione o un indirizzo che sogni, con coordinate e data obiettivo.',
  'help.guide.bucket-place.step.1': 'Apri la scheda Lista desideri nel pannello in basso.',
  'help.guide.bucket-place.step.2': 'Clicca Aggiungi luogo.',
  'help.guide.bucket-place.step.3':
    'Digita il nome e premi il pulsante di ricerca; scegli il risultato così il luogo ha le coordinate. Anche digitare un nome e saltare la ricerca funziona.',
  'help.guide.bucket-place.step.4': 'Scegli mese e anno se vuoi e clicca Aggiungi.',
  'help.guide.bucket-place.result':
    'Il luogo sta in cima alla tua lista desideri con la sua data obiettivo; la × accanto lo rimuove.',
  'help.guide.bucket-place.tip.1':
    'Un desiderio con coordinate è ciò che Dawarich potrà spuntare per te più avanti, quando le tue registrazioni mostrano che eri lì.',
  // stats
  'help.guide.stats.title': 'Leggere le tue statistiche',
  'help.guide.stats.goal': 'Sapere cosa contano i numeri nel pannello, e cosa no.',
  'help.guide.stats.step.1':
    'Paesi è il numero di paesi distinti in cui sei stato davvero; quelli pianificati sono mostrati accanto, non dentro. Viaggi, Luoghi e Giorni sono totali su tutti i tuoi viaggi. Città è ricavato dagli indirizzi dei tuoi luoghi, quindi è una stima.',
  'help.guide.stats.step.2':
    'I continenti mostrano i paesi visitati per continente; l’Antartide entra nella riga appena ci sei stato. Poi la tua serie, anni consecutivi con almeno un viaggio, e quanti viaggi hai fatto quest’anno.',
  'help.guide.stats.result': 'I numeri seguono i tuoi viaggi mentre li pianifichi; qui non c’è nulla da mantenere.',
  'help.guide.stats.tip.1':
    'Le città si leggono dal testo dell’indirizzo, non si cercano, quindi un indirizzo corto come «Osteria Francescana, Italy» o uno che finisce su una prefettura può dare una regione anziché una città.',
  'help.guide.stats.tip.2':
    'I paesi segnati a mano contano in Paesi e nei continenti, ma non portano viaggi, luoghi o giorni.',
  // dawarich-countries
  'help.guide.dawarich-countries.title': 'Aggiungere paesi dalle tue registrazioni',
  'help.guide.dawarich-countries.goal':
    'Lascia che Dawarich dica in quali paesi sei stato nell’ultimo anno, e metti sulla mappa quelli che confermi.',
  'help.guide.dawarich-countries.step.1':
    'Con l’addon Dawarich collegato, un pannello Dawarich sta in fondo alla mappa, a sinistra delle statistiche, con due riquadri. Clicca Paesi.',
  'help.guide.dawarich-countries.step.2':
    'La finestra si apre sulla sua scheda Paesi. Clicca Cerca i paesi: TREK legge i paesi e le città che le tue registrazioni coprono negli ultimi 12 mesi, un mese alla volta, quindi dagli un momento. Ogni paese che il tuo Atlas non ha ancora è elencato con la bandiera, quante città e il nome della prima, e parte spuntato; clicca una riga per lasciarla fuori.',
  'help.guide.dawarich-countries.step.3':
    'Conferma con il pulsante in basso a destra, che dice Aggiungi 5 paesi quando cinque righe sono spuntate. La finestra dice quanti sono stati aggiunti; chiudila e la mappa si è riletta.',
  'help.guide.dawarich-countries.result':
    'I paesi confermati portano un colore sulla mappa e contano in Paesi, annotati come provenienti da Dawarich. Ciò che hai segnato a mano resta intatto.',
  'help.guide.dawarich-countries.tip.1':
    'I paesi che l’Atlas mostra già come visitati, a mano, da un viaggio o da un controllo precedente, sono lasciati fuori, così i tuoi segni non vengono mai rietichettati. Un paese che avevi tolto dall’Atlas torna quando lo confermi qui.',
  'help.guide.dawarich-countries.tip.2':
    'Un nome di paese che TREK non riesce ad abbinare è elencato sotto le righe invece di essere scartato, e Controlla di nuovo interroga Dawarich un’altra volta. La nota sotto l’elenco dice che Sono stati esaminati gli ultimi 12 mesi; quella finestra è fissa.',
  // dawarich-wishes
  'help.guide.dawarich-wishes.title': 'Spuntare desideri dalle tue registrazioni',
  'help.guide.dawarich-wishes.goal':
    'Scopri quali luoghi della tua lista desideri hai davvero raggiunto, e spuntali nel giorno in cui è successo.',
  'help.guide.dawarich-wishes.step.1':
    'Nel pannello Dawarich in fondo alla mappa, a sinistra delle statistiche, clicca Lista dei desideri.',
  'help.guide.dawarich-wishes.step.2':
    'La finestra si apre sulla sua scheda Lista dei desideri. Clicca Controlla la lista dei desideri: TREK scorre le tue registrazioni per ogni voce che ha coordinate. Un desiderio che hai raggiunto è elencato con quanto ti sei avvicinato, quanto sei rimasto e il giorno, e parte spuntato; uno che avevi già spuntato dice Già spuntato. Sotto l’elenco una nota conta le voci senza coordinate, e lì sta anche la regola: Un desiderio è raggiunto entro 250 m e dopo 20 minuti sul posto.',
  'help.guide.dawarich-wishes.step.3':
    'Conferma con il pulsante in basso a destra, che dice Spunta 2 quando due righe sono spuntate. Poi chiudi la finestra e apri la scheda Lista desideri del pannello accanto.',
  'help.guide.dawarich-wishes.result':
    'Ogni desiderio porta una spunta verde con la data della sosta, non quella di oggi; il suo tooltip dice Spuntato dalle tue registrazioni Dawarich, e un clic sulla data la annulla.',
  'help.guide.dawarich-wishes.tip.1':
    'Passarci davanti non conta: la regola richiede sia vicinanza sia tempo, e tra più soste che valgono vince la più lunga. Un desiderio senza coordinate non si può controllare, quindi aggiungi i luoghi attraverso la ricerca in Aggiungi luogo invece che con il solo nome.',
  'help.guide.dawarich-wishes.tip.2':
    'Un controllo guarda fino a 50 voci, prima quelle non ancora spuntate, e lo dice quando ce n’erano di più. Un desiderio che era già spuntato tiene la propria data.',

  // ── Screen: collections ───────────────────────────────────────────────────────────────
  'help.ctx.collections.title': 'Raccolte',
  'help.ctx.collections.summary':
    'Collections è la tua libreria di luoghi fuori da qualsiasi viaggio: liste con un nome, fatte di luoghi che hai trovato e vuoi tenere, ogni luogo con uno stato Idea, Da visitare o Visitato. I luoghi vengono copiati dentro e fuori dai viaggi, mai collegati, così una lista e un viaggio non si modificano mai a vicenda.',
  'help.ctx.collections.bullet.1':
    'Barra delle liste a sinistra: le tue liste, quelle condivise con te, gli inviti in attesa di un sì, Tutti i salvati come unione di tutto ciò che possiedi, e Nuova lista più l’importazione da file in cima.',
  'help.ctx.collections.bullet.2':
    'Intestazione della lista aperta: colore, copertina, descrizione e link, i membri, e a destra le azioni Modifica, Esporta e Condividi.',
  'help.ctx.collections.bullet.3':
    'Riga dei filtri sopra i luoghi: stato, categoria, valutazione e ordinamento, il filtro per etichetta, il + per aggiungere un luogo, l’importazione da un viaggio e Scegli per le azioni in blocco.',
  'help.ctx.collections.bullet.4':
    'Righe dei luoghi: avatar, nome e indirizzo, etichette e categoria, e a destra la pillola di stato che cambia con un clic.',
  'help.ctx.collections.bullet.5':
    'Mappa a destra: un segnaposto per ogni luogo con coordinate, il selettore lista o mappa, la casella di ricerca e il filtro per etichetta. Cliccare un segnaposto apre quel luogo.',
  'help.ctx.collections.bullet.6':
    'Scheda di dettaglio: clicca una riga per copertina, categoria, etichette, stato, descrizione e link, con Modifica, Copia nel viaggio e Rimuovi dalla lista.',
  // create-list
  'help.guide.create-list.title': 'Creare una lista',
  'help.guide.create-list.goal': 'Avvia una nuova lista con un nome, un colore e una copertina, pronta per i luoghi.',
  'help.guide.create-list.step.1': 'Clicca Nuova lista in cima alla barra delle liste.',
  'help.guide.create-list.step.2':
    'Dai un nome alla lista e scegli un colore. Immagine di copertina, descrizione e link sono facoltativi; puoi aggiungerli più tardi con Modifica.',
  'help.guide.create-list.step.3': 'Clicca Crea.',
  'help.guide.create-list.result':
    'La lista si apre vuota, con Aggiungi un luogo e Importa da un viaggio come i due modi per riempirla.',
  'help.guide.create-list.tip.1':
    'La copertina può essere un caricamento tuo o un’immagine trovata con la ricerca Unsplash nella stessa finestra.',
  // add-place
  'help.guide.add-place.title': 'Aggiungere un luogo',
  'help.guide.add-place.goal':
    'Trova un luogo e salvalo nella lista aperta con nome, categoria, stato e note in un colpo solo.',
  'help.guide.add-place.step.1': 'Clicca il + nella riga dei filtri sopra i luoghi.',
  'help.guide.add-place.step.2':
    'Digita il luogo nel campo di ricerca e scegli un risultato. Nome, indirizzo e coordinate si compilano da lì.',
  'help.guide.add-place.step.3':
    'Imposta lo stato e, se vuoi, una categoria, una descrizione e dei link, poi clicca Aggiungi. La finestra resta aperta per il luogo successivo; Annulla la chiude.',
  'help.guide.add-place.result': 'Il luogo compare nella lista e, se ha coordinate, come segnaposto sulla mappa.',
  'help.guide.add-place.tip.1':
    'Da dentro un viaggio, Salva nella raccolta nell’ispettore del luogo o nel menu del luogo mette un luogo del viaggio in una lista senza uscire dal viaggio.',
  'help.guide.add-place.tip.2':
    'La lista deve essere tua o una in cui sei editore o admin; il + non c’è su Tutti i salvati né su una lista che puoi solo guardare.',
  // import-from-trip
  'help.guide.import-from-trip.title': 'Importare luoghi da un viaggio',
  'help.guide.import-from-trip.goal':
    'Porta in una lista tutti i luoghi di un viaggio in una volta invece di salvarli uno per uno.',
  'help.guide.import-from-trip.step.1':
    'Clicca il pulsante di importazione con la freccia sulla nuvola nella riga dei filtri. Su una lista vuota la stessa azione sta accanto a Aggiungi un luogo.',
  'help.guide.import-from-trip.step.2': 'Scegli uno dei tuoi viaggi.',
  'help.guide.import-from-trip.step.3':
    'Spunta i luoghi che vuoi. Quelli già nella lista sono in grigio; quelli che nessun giorno del viaggio contiene partono già selezionati. Solo nuovi nasconde ciò che hai già.',
  'help.guide.import-from-trip.step.4': 'Clicca Importa. Il pulsante dice sempre quanti stanno per essere aggiunti.',
  'help.guide.import-from-trip.result':
    'I luoghi vengono copiati nella lista con nome, indirizzo, coordinate, descrizione e categoria. Il viaggio resta com’era.',
  'help.guide.import-from-trip.tip.1':
    'I duplicati per nome o coordinate vengono saltati in automatico, quindi importare due volte non fa danni.',
  'help.guide.import-from-trip.tip.2':
    'Nell’elenco dei luoghi di un viaggio, la modalità di selezione offre invece Salva nella raccolta per un insieme di luoghi scelti a mano.',
  // place-status
  'help.guide.place-status.title': 'Impostare lo stato di un luogo',
  'help.guide.place-status.goal': 'Tieni traccia di cos’è un’idea, cosa è in lista ristretta e dove sei già stato.',
  'help.guide.place-status.step.1':
    'Clicca la pillola di stato all’estremità destra di una riga. Idea diventa Da visitare.',
  'help.guide.place-status.step.2': 'Cliccala di nuovo per Visitato, e ancora una volta per ricominciare da Idea.',
  'help.guide.place-status.result':
    'La pillola e il suo colore cambiano subito; il filtro di stato sopra la lista conta di pari passo.',
  'help.guide.place-status.tip.1':
    'Lo stato è una cosa di Collections: copiare un luogo in un viaggio non lo porta con sé.',
  'help.guide.place-status.tip.2':
    'Da un viaggio, Salva nella raccolta mostra una pillola di stato per ogni lista in cui c’è il luogo, e il pannello dei luoghi ha l’azione Segna come visitato per una selezione.',
  // place-detail
  'help.guide.place-detail.title': 'Aprire un luogo salvato',
  'help.guide.place-detail.goal': 'Vedi tutto di un luogo e agisci: modifica, copia in un viaggio, rimuovi.',
  'help.guide.place-detail.step.1':
    'Clicca una riga. La scheda di dettaglio si apre accanto alla lista e la mappa si sposta sul luogo.',
  'help.guide.place-detail.step.2':
    'In fondo ci sono Modifica, Copia nel viaggio e Rimuovi dalla lista; la fotocamera sulla copertina sostituisce la foto automatica con una tua.',
  'help.guide.place-detail.result':
    'Modifica sblocca nome, categoria, etichette, indirizzo, coordinate, descrizione e link direttamente nella scheda.',
  'help.guide.place-detail.tip.1':
    'La copertina viene recuperata in automatico quando il luogo non ha un’immagine propria. Il tuo caricamento può essere JPG, PNG, GIF o WebP fino a 20 MB.',
  'help.guide.place-detail.tip.2':
    'I membri di una lista condivisa possono anche lasciare qui una valutazione a stelle, e il filtro per valutazione nella riga dei filtri usa la media.',
  // labels
  'help.guide.labels.title': 'Raggruppare luoghi con le etichette',
  'help.guide.labels.goal':
    'Dai a una lista etichette tutte sue, come quartieri o giorni, oltre alle categorie comuni.',
  'help.guide.labels.step.1': 'Apri il gestore delle etichette dal controllo etichette nella riga dei filtri.',
  'help.guide.labels.step.2':
    'Digita un nome, scegli un colore e clicca Aggiungi etichetta. Rinomina, ricolora o elimina le etichette esistenti nella stessa finestra.',
  'help.guide.labels.step.3':
    'Attiva Scegli, spunta i luoghi e clicca Assegna etichetta nella barra di selezione. Un singolo luogo prende etichette anche con Modifica sulla sua scheda di dettaglio.',
  'help.guide.labels.step.4':
    'Scegli una o più etichette nella riga dei filtri per restringere lista e mappa ai luoghi che ne portano almeno una.',
  'help.guide.labels.result':
    'I luoghi etichettati mostrano le loro etichette sulla riga; il filtro per etichetta c’è per ogni membro, visualizzatori compresi.',
  'help.guide.labels.tip.1':
    'Le etichette appartengono alla sola lista in cui sono state create. Spostare un luogo in un’altra lista le fa cadere.',
  'help.guide.labels.tip.2': 'Gestire e assegnare etichette richiede i diritti di modifica sulla lista.',
  // filter-select
  'help.guide.filter-select.title': 'Filtrare e selezionare luoghi',
  'help.guide.filter-select.goal': 'Restringi la lista e agisci su molti luoghi in una volta.',
  'help.guide.filter-select.step.1':
    'Usa i menu a tendina nella riga dei filtri: stato, categoria, valutazione minima e ordinamento. Ognuno mostra quanti luoghi lascerebbe.',
  'help.guide.filter-select.step.2': 'Clicca Scegli. Ogni riga riceve una casella e compare una barra di selezione.',
  'help.guide.filter-select.step.3':
    'Spunta i luoghi o usa Seleziona tutto per tutto ciò che è filtrato al momento, poi scegli Assegna etichetta, Sposta in lista, Duplica in lista, Copia nel viaggio o Elimina.',
  'help.guide.filter-select.result':
    'Le azioni valgono per l’intera selezione in una volta. La × a destra esce dalla modalità di selezione.',
  'help.guide.filter-select.tip.1':
    'Seleziona tutto segue il filtro, quindi filtrare per Da visitare e selezionare tutto è la via rapida per agire sulla lista ristretta.',
  // copy-to-trip
  'help.guide.copy-to-trip.title': 'Copiare luoghi in un viaggio',
  'help.guide.copy-to-trip.goal': 'Trasforma i luoghi salvati in tappe di uno dei tuoi viaggi.',
  'help.guide.copy-to-trip.step.1':
    'Attiva Scegli e spunta i luoghi, oppure apri un luogo e usa Copia nel viaggio sulla sua scheda di dettaglio.',
  'help.guide.copy-to-trip.step.2': 'Clicca Copia nel viaggio nella barra di selezione.',
  'help.guide.copy-to-trip.step.3': 'Scegli il viaggio. La casella di ricerca restringe una lista lunga.',
  'help.guide.copy-to-trip.result':
    'I luoghi finiscono nell’elenco dei luoghi di quel viaggio con nome, descrizione, categoria, note, prezzo, coordinate, foto e tag. Nella raccolta non cambia nulla.',
  'help.guide.copy-to-trip.tip.1':
    'Anche i visualizzatori di una lista condivisa possono farlo; copia fuori dalla lista, non la modifica.',
  // share-list
  'help.guide.share-list.title': 'Condividere una lista con qualcuno',
  'help.guide.share-list.goal': 'Pianifica una lista insieme ad altre persone su questo TREK, dal vivo.',
  'help.guide.share-list.step.1': 'Clicca Condividi nell’intestazione della tua lista.',
  'help.guide.share-list.step.2': 'Seleziona l’utente e un ruolo: Visualizzatore, Editore o Admin.',
  'help.guide.share-list.step.3':
    'Clicca Invia invito. La persona compare come invito in sospeso finché non accetta l’invito nella sua barra delle liste.',
  'help.guide.share-list.result':
    'Una volta accettato, la lista compare per lei sotto Condivisa e ogni modifica si sincronizza dal vivo. Membri e ruoli restano modificabili nella stessa finestra.',
  'help.guide.share-list.tip.1':
    'I visualizzatori possono guardare, valutare e copiare luoghi nei propri viaggi. Gli editori aggiungono e modificano luoghi ed etichette. Gli admin possono anche eliminare.',
  'help.guide.share-list.tip.2':
    'Solo il proprietario invita e rimuove persone; un membro può lasciare da sé una lista condivisa.',
  // export-list
  'help.guide.export-list.title': 'Esportare una lista come file',
  'help.guide.export-list.goal': 'Passa una lista a qualcuno su un altro TREK, o portala in un’app di mappe.',
  'help.guide.export-list.step.1': 'Clicca Esporta nell’intestazione della lista.',
  'help.guide.export-list.step.2':
    'Scegli Elenco TREK per un altro TREK, con etichette e stato, oppure GPX per OsmAnd, Organic Maps, un Garmin e altre app che leggono waypoint.',
  'help.guide.export-list.result': 'Il file viene scaricato. Qualsiasi membro di una lista condivisa può esportarla.',
  'help.guide.export-list.tip.1':
    'Un luogo senza coordinate non può essere un waypoint GPX; viene lasciato fuori e TREK ti dice quanti sono stati.',
  'help.guide.export-list.tip.2':
    'Valutazioni, membri e foto caricate restano indietro di proposito; appartengono a questo TREK, non alla lista.',
  // import-file
  'help.guide.import-file.title': 'Importare una lista da un file',
  'help.guide.import-file.goal':
    'Porta dentro un file Elenco TREK o un file GPX, come nuova lista o in una che hai già.',
  'help.guide.import-file.step.1':
    'Clicca il pulsante di importazione con la freccia di caricamento accanto a Nuova lista nella barra delle liste.',
  'help.guide.import-file.step.2':
    'Scegli il file. TREK mostra cosa contiene prima che succeda qualsiasi cosa: il nome, quanti luoghi e quante etichette.',
  'help.guide.import-file.step.3':
    'Lascia Nuova lista e cambia il nome se vuoi, oppure scegli Aggiungi a una lista per mettere i luoghi in una lista che puoi modificare, poi clicca Importa.',
  'help.guide.import-file.result':
    'Atterri sulla lista con i luoghi importati. Aggiungi a una lista si limita sempre ad aggiungere; i luoghi già presenti tengono stato, note ed etichette.',
  'help.guide.import-file.tip.1':
    'Da un GPX ogni waypoint con un nome diventa un luogo; le tracce sono linee e restano fuori, e l’anteprima dice quanti punti erano.',
  'help.guide.import-file.tip.2':
    'Un file che non è né un Elenco TREK né un GPX viene rifiutato con un motivo; un singolo luogo illeggibile viene saltato, non l’intero file.',
  // edit-list
  'help.guide.edit-list.title': 'Modificare o eliminare una lista',
  'help.guide.edit-list.goal':
    'Cambia nome, colore, copertina, descrizione o link di una lista, oppure rimuovi la lista.',
  'help.guide.edit-list.step.1': 'Clicca Modifica nell’intestazione della lista. Solo il proprietario lo vede.',
  'help.guide.edit-list.step.2':
    'Cambia ciò che vuoi e clicca Salva. Elimina lista in basso a sinistra rimuove la lista con tutti i suoi luoghi, dopo una conferma.',
  'help.guide.edit-list.result': 'L’intestazione prende subito il nuovo colore, la copertina e la descrizione.',
  'help.guide.edit-list.tip.1': 'Eliminare una lista non si può annullare. Esportala prima se vuoi tenerne una copia.',
  // all-saved
  'help.guide.all-saved.title': 'Cercare in tutta la tua libreria',
  'help.guide.all-saved.goal': 'Guarda in una volta tutte le liste che possiedi.',
  'help.guide.all-saved.step.1':
    'Clicca Tutti i salvati nella barra delle liste. Unisce i luoghi di ogni lista che possiedi o di cui sei comproprietario.',
  'help.guide.all-saved.step.2':
    'Usa la casella di ricerca e i filtri come su qualsiasi lista; Scegli funziona anche qui per copiare in un viaggio.',
  'help.guide.all-saved.result':
    'Una sola vista su tutti i tuoi luoghi salvati, senza aggiungere né importare, perché non c’è una singola lista in cui metterli.',
  'help.guide.all-saved.tip.1':
    'Le etichette sono per lista, quindi il filtro per etichetta non è offerto su Tutti i salvati.',

  // ── Screen: journey ───────────────────────────────────────────────────────────────────
  'help.ctx.journey.title': 'Diario di viaggio',
  'help.ctx.journey.summary':
    'Diario di viaggio è il tuo diario con le foto in primo piano. Ogni diario è legato a uno o più viaggi e cresce giorno dopo giorno da voci con racconto, foto, umore e meteo. Questa schermata elenca i tuoi diari; aprine uno per scrivere.',
  'help.ctx.journey.bullet.1':
    'Il banner in alto mostra il diario in corso, o il più recente, con i suoi conteggi di voci, foto e luoghi. Continua a scrivere lo apre su oggi.',
  'help.ctx.journey.bullet.2':
    'Sotto, una scheda per diario con copertina, sottotitolo, date e conteggi. Clicca una scheda per aprirla.',
  'help.ctx.journey.bullet.3': 'L’ultima scheda della griglia, Crea un nuovo diario, ne avvia uno dai tuoi viaggi.',
  // create-journey
  'help.guide.create-journey.title': 'Creare un diario',
  'help.guide.create-journey.goal':
    'Iniziare un diario per un viaggio, con i luoghi del viaggio già in attesa come suggerimenti.',
  'help.guide.create-journey.step.1': 'Clicca Crea un nuovo diario, l’ultima scheda della griglia.',
  'help.guide.create-journey.step.2':
    'Dagli un nome e, se vuoi, un sottotitolo, poi spunta i viaggi a cui appartiene. Il contatore dice quanti luoghi entreranno.',
  'help.guide.create-journey.step.3': 'Clicca Crea diario.',
  'help.guide.create-journey.result':
    'Il diario si apre. Ogni luogo dei viaggi collegati sta nella cronologia come suggerimento, uno per ogni giorno in cui si trova, pronto per essere scritto.',
  'help.guide.create-journey.tip.1': 'Altri viaggi si possono collegare più tardi da Impostazioni del diario.',
  'help.guide.create-journey.tip.2': 'Un diario senza viaggi funziona lo stesso; le voci le aggiungi allora a mano.',
  // open-journey
  'help.guide.open-journey.title': 'Aprire un diario',
  'help.guide.open-journey.goal': 'Entrare in un diario, e sapere dove si apre.',
  'help.guide.open-journey.step.1':
    'Clicca una scheda. Ognuna mostra la copertina, le date e quante voci, foto e luoghi contiene il diario.',
  'help.guide.open-journey.result':
    'Un diario in corso si apre su oggi, o sull’ultima voce prima di oggi quando non è ancora scritto nulla; uno concluso si apre all’inizio.',
  'help.guide.open-journey.tip.1':
    'La copertina è la prima foto del diario, a meno che tu ne imposti una in Impostazioni del diario.',
  // continue-writing
  'help.guide.continue-writing.title': 'Continuare il diario in corso',
  'help.guide.continue-writing.goal': 'Saltare dritto alla pagina di oggi del diario che stai vivendo.',
  'help.guide.continue-writing.step.1':
    'Clicca Continua a scrivere nel banner in alto. Mostra il diario in corso, o il più recente quando non ce n’è uno.',
  'help.guide.continue-writing.result':
    'Il diario si apre su oggi, o sull’ultima voce prima di oggi quando non è ancora scritto nulla.',
  'help.guide.continue-writing.tip.1':
    'Il banner offre anche un suggerimento per un viaggio che non ha ancora un diario; Ignora lo nasconde.',

  // ── Screen: journey-detail ────────────────────────────────────────────────────────────
  'help.ctx.journey-detail.title': 'Diario',
  'help.ctx.journey-detail.summary':
    'Un diario aperto: la cronologia a sinistra, giorno per giorno, e la mappa a destra con ogni voce e i luoghi dei viaggi collegati. Tutto ciò che aggiunge al diario sta in alto; l’intestazione contiene i conteggi, Studio, l’interruttore dei suggerimenti e Impostazioni del diario.',
  'help.ctx.journey-detail.bullet.1':
    'Intestazione: copertina, titolo e sottotitolo, i conteggi di giorni, luoghi, voci e foto, e a destra Studio, l’interruttore dei suggerimenti e Impostazioni del diario.',
  'help.ctx.journey-detail.bullet.2':
    'Barra degli strumenti: le schede Cronologia e Galleria, Cerca in questo diario e Aggiungi voce.',
  'help.ctx.journey-detail.bullet.3':
    'Cronologia: una sezione per giorno con un + per aggiungere una voce in quel giorno; schede delle voci con foto, umore, meteo e racconto; suggerimenti dai viaggi in uno stile più chiaro, con Scarta questo suggerimento.',
  'help.ctx.journey-detail.bullet.4':
    'Mappa: le voci come segnaposti, uniti in ordine di data da una linea tratteggiata, i luoghi dei viaggi e le tracce GPX importate in quei viaggi.',
  'help.ctx.journey-detail.bullet.5':
    'Impostazioni del diario: copertina, nome e sottotitolo, tracce sulla mappa, campi della voce, suggerimenti scartati, viaggi collegati, contributori, condivisione pubblica, archiviazione ed eliminazione.',
  'help.ctx.journey-detail.bullet.6':
    'Due pulsanti rotondi fluttuano su una cronologia lunga: torna in cima e salta all’ultima voce.',
  // add-entry
  'help.guide.add-entry.title': 'Scrivere una voce',
  'help.guide.add-entry.goal': 'Aggiungere il racconto di un giorno con titolo, testo, umore e meteo.',
  'help.guide.add-entry.step.1':
    'Clicca Aggiungi voce nella barra degli strumenti, o il + nell’intestazione di un giorno per iniziare in quel giorno.',
  'help.guide.add-entry.step.2':
    'Dai un nome al momento e scrivi il racconto. La barra sopra il testo aggiunge grassetto, corsivo, titoli, citazioni, link ed elenchi in Markdown.',
  'help.guide.add-entry.step.3':
    'Scegli un umore e il meteo, controlla la data e fissa un luogo se vuoi: cerca un luogo o usa la tua posizione attuale.',
  'help.guide.add-entry.step.4': 'Clicca Salva.',
  'help.guide.add-entry.result':
    'La voce compare nel suo giorno nella cronologia e come segnaposto sulla mappa. I suoi conteggi si aggiornano nell’intestazione.',
  'help.guide.add-entry.tip.1': 'Scrivere in un suggerimento è lo stesso editor, con il luogo già impostato.',
  'help.guide.add-entry.tip.2':
    'I tag in fondo sono testo libero, gioiello nascosto o miglior pasto, e la ricerca li trova.',
  // entry-photos
  'help.guide.entry-photos.title': 'Aggiungere foto e video a una voce',
  'help.guide.entry-photos.goal': 'Mettere immagini su un giorno; la prima diventa la copertina della voce.',
  'help.guide.entry-photos.step.1': 'Apri il menu di una voce con il ⋯ sulla sua scheda e scegli Modifica.',
  'help.guide.entry-photos.step.2':
    'Clicca Carica foto e scegli i file. Dalla galleria prende immagini già nella galleria del diario; External photos cerca quel giorno in una libreria Immich o Synology collegata.',
  'help.guide.entry-photos.step.3': 'Passa sopra un’immagine per Metti 1° e scegliere la copertina, poi clicca Salva.',
  'help.guide.entry-photos.result': 'Le foto compaiono sulla scheda e nella galleria; la prima è la miniatura ovunque.',
  'help.guide.entry-photos.tip.1':
    'I video vanno su una voce allo stesso modo: mp4, m4v, webm o mov fino a 500 MB, salvati così come caricati.',
  'help.guide.entry-photos.tip.2':
    'I file HEIC di un iPhone vengono convertiti in JPEG al caricamento, il che elimina i loro metadati GPS e della fotocamera.',
  // suggestions
  'help.guide.suggestions.title': 'Usare o scartare i suggerimenti',
  'help.guide.suggestions.goal':
    'Trasformare i luoghi dei tuoi viaggi in voci, e togliere di mezzo quelli di cui non scriverai.',
  'help.guide.suggestions.step.1':
    'Un suggerimento è una scheda più chiara con il nome del luogo in corsivo. Cliccalo per aprire l’editor con luogo e giorno già impostati.',
  'help.guide.suggestions.step.2':
    'Clicca Scarta questo suggerimento su una scheda che non userai. Lascia la cronologia senza essere eliminata, e la sincronizzazione del viaggio non la proporrà di nuovo.',
  'help.guide.suggestions.step.3':
    'Cambiato idea? Impostazioni del diario mostra quanti sono scartati, e Recupera i suggerimenti scartati li riporta tutti.',
  'help.guide.suggestions.result':
    'La cronologia contiene solo ciò che intendi scrivere; l’interruttore nell’intestazione nasconde tutti i suggerimenti in una volta mentre leggi.',
  'help.guide.suggestions.tip.1': 'Un luogo tenuto su due giorni dà un suggerimento su ciascuno di essi.',
  'help.guide.suggestions.tip.2': 'I suggerimenti non contano mai nelle statistiche; contano solo le voci scritte.',
  // add-on-day
  'help.guide.add-on-day.title': 'Aggiungere una voce in un giorno precedente',
  'help.guide.add-on-day.goal': 'Scrivere di un giorno già passato senza correggere la data dopo.',
  'help.guide.add-on-day.step.1': 'Clicca il + nell’intestazione di quel giorno.',
  'help.guide.add-on-day.step.2': 'L’editor si apre con quella data impostata. Scrivi e Salva come al solito.',
  'help.guide.add-on-day.result': 'La voce finisce subito nel giorno giusto.',
  'help.guide.add-on-day.tip.1': 'Dentro un giorno, le frecce nel menu di una voce la spostano prima o dopo.',
  // pros-cons
  'help.guide.pros-cons.title': 'Aggiungere un verdetto',
  'help.guide.pros-cons.goal': 'Riassumere un giorno con ciò che è stato fantastico e ciò che non lo è stato.',
  'help.guide.pros-cons.step.1':
    'Nell’editor, trova Pro e contro sotto il racconto. Scrivi un punto in Pro o Contro e usa Aggiungi un altro per il successivo.',
  'help.guide.pros-cons.step.2': 'Salva. Il verdetto compare sulla scheda come due brevi elenchi.',
  'help.guide.pros-cons.result': 'Pollice su e pollice giù a colpo d’occhio, sotto il racconto.',
  'help.guide.pros-cons.tip.1':
    'Un diario che non usa i verdetti può spegnere la sezione sotto Campi della voce in Impostazioni del diario.',
  // search-journey
  'help.guide.search-journey.title': 'Trovare qualcosa in un diario lungo',
  'help.guide.search-journey.goal': 'Arrivare alla voce che intendi senza scorrere settimane.',
  'help.guide.search-journey.step.1':
    'Scrivi in Cerca in questo diario nella barra degli strumenti. La cronologia si filtra mentre scrivi, su titoli, racconti, luoghi e tag. Accenti e maiuscole non contano.',
  'help.guide.search-journey.step.2':
    'L’interruttore dei suggerimenti nell’intestazione nasconde le schede non scritte mentre leggi. Quando la cronologia è lunga, due pulsanti rotondi fluttuano sopra il suo bordo inferiore: torna in cima e salta all’ultima voce.',
  'help.guide.search-journey.result': 'Restano solo le voci corrispondenti; svuota la casella per rivedere tutto.',
  'help.guide.search-journey.tip.1':
    'Un diario in corso si apre su oggi, quindi la pagina attuale di solito è già in vista.',
  'help.guide.search-journey.tip.2': 'Contano anche i tag: cercare gioiello nascosto trova ogni voce con quel tag.',
  // gallery-map
  'help.guide.gallery-map.title': 'Sfogliare la galleria e la mappa',
  'help.guide.gallery-map.goal': 'Vedere tutto il diario come immagini, e come luoghi sulla mappa.',
  'help.guide.gallery-map.step.1':
    'Passa a Galleria nella barra degli strumenti: ogni foto di ogni voce, più le immagini caricate direttamente nella galleria. Cliccane una per la lightbox.',
  'help.guide.gallery-map.step.2':
    'La mappa a destra mostra le voci come segnaposti in ordine di data, i luoghi dei viaggi collegati e ogni traccia GPX importata in quei viaggi, nel colore che ha nel pianificatore.',
  'help.guide.gallery-map.result':
    'Passa sopra una traccia per il suo nome. La linea tratteggiata tra le voci la disegna TREK; una traccia è il percorso che hai davvero registrato.',
  'help.guide.gallery-map.tip.1': 'Le tracce si possono spegnere per un diario sotto Impostazioni del diario.',
  'help.guide.gallery-map.tip.2':
    'Le foto della galleria con una posizione compaiono anche sulla mappa pubblica, quando Galleria e Mappa sono entrambe condivise.',
  // entry-fields
  'help.guide.entry-fields.title': 'Spegnere i campi della voce',
  'help.guide.entry-fields.goal': 'Limitare l’editor a ciò che questo diario usa.',
  'help.guide.entry-fields.step.1': 'Apri Impostazioni del diario dall’intestazione.',
  'help.guide.entry-fields.step.2': 'Sotto Campi della voce, spegni Umore, Meteo o Pro e contro.',
  'help.guide.entry-fields.result':
    'L’editor smette di chiederli. Nulla di scritto va perso: riaccendere un campo riporta in vista i valori salvati, e un diario condiviso nasconde gli stessi campi.',
  'help.guide.entry-fields.tip.1':
    'Gli interruttori sono per diario, quindi un viaggio di lavoro e una vacanza possono differire.',
  // link-trip
  'help.guide.link-trip.title': 'Collegare un altro viaggio',
  'help.guide.link-trip.goal': 'Portare i luoghi di un secondo viaggio nel diario come suggerimenti.',
  'help.guide.link-trip.step.1': 'Apri Impostazioni del diario dall’intestazione.',
  'help.guide.link-trip.step.2': 'Sotto i viaggi collegati, clicca Aggiungi viaggio.',
  'help.guide.link-trip.step.3': 'Scegli il viaggio.',
  'help.guide.link-trip.result':
    'I suoi luoghi arrivano nella cronologia come suggerimenti nei loro giorni, e le sue tracce GPX si aggiungono alla mappa.',
  'help.guide.link-trip.tip.1':
    'La × accanto a un viaggio collegato lo scollega di nuovo; le voci che hai scritto restano.',
  'help.guide.link-trip.tip.2': 'Le voci di un giorno contano una volta sola, per quanti viaggi coprano quel giorno.',
  // share-public
  'help.guide.share-public.title': 'Condividere il diario pubblicamente',
  'help.guide.share-public.goal': 'Dare a chi non ha un account TREK un link di sola lettura.',
  'help.guide.share-public.step.1': 'Apri Impostazioni del diario e trova Condivisione pubblica.',
  'help.guide.share-public.step.2': 'Clicca Crea link di condivisione.',
  'help.guide.share-public.step.3':
    'Scegli cosa vedono i visitatori: Cronologia, Galleria e Mappa sono interruttori separati. Copia mette il link negli appunti.',
  'help.guide.share-public.result':
    'Chiunque abbia il link vede le sezioni attive e nient’altro; i campi che hai spento in Campi della voce restano nascosti anche lì.',
  'help.guide.share-public.tip.1':
    'Le foto compaiono sulla mappa pubblica solo quando Galleria e Mappa sono entrambe attive; con Mappa spenta le loro coordinate vengono rimosse prima di lasciare il server.',
  'help.guide.share-public.tip.2': 'Elimina il link nello stesso punto per terminare la condivisione.',
  // contributors
  'help.guide.contributors.title': 'Scrivere insieme',
  'help.guide.contributors.goal': 'Lasciare che un compagno di viaggio aggiunga le proprie voci e foto.',
  'help.guide.contributors.step.1': 'Apri Impostazioni del diario e scorri fino ai contributori.',
  'help.guide.contributors.step.2': 'Clicca Invita contributore e cerca l’utente per nome o email.',
  'help.guide.contributors.step.3': 'Scegli un ruolo e conferma.',
  'help.guide.contributors.result':
    'Il diario compare nel suo elenco e le sue voci portano il suo nome. Rimuovi un contributore con la × accanto a lui.',
  'help.guide.contributors.tip.1':
    'I contributori sono per le persone su questo TREK. Per tutti gli altri c’è il link pubblico.',
  // studio
  'help.guide.studio.title': 'Impaginare il diario come un fotolibro',
  'help.guide.studio.goal': 'Trasformare il diario in pagine stampabili.',
  'help.guide.studio.step.1': 'Clicca Studio nell’intestazione. Il designer si apre sopra il diario.',
  'help.guide.studio.step.2':
    'Il nome del diario a sinistra della barra in alto è la via del ritorno; ti riporta dov’eri.',
  'help.guide.studio.result':
    'La striscia delle pagine a sinistra, la doppia pagina sul banco di lavoro, le proprietà a destra. Auto layout costruisce il libro dalle tue voci; Export produce un PDF pronto per la stampa.',
  'help.guide.studio.tip.1': 'Studio ha bisogno di una finestra larga almeno 1024 px e non è offerto sul telefono.',
  'help.guide.studio.tip.2':
    'Il libro eredita l’accesso del diario: chi può leggere il diario può aprirlo, chi può modificarlo può salvare.',
  // archive-journey
  'help.guide.archive-journey.title': 'Archiviare o eliminare un diario',
  'help.guide.archive-journey.goal': 'Chiudere un diario concluso, o rimuoverne uno per sempre.',
  'help.guide.archive-journey.step.1': 'Apri Impostazioni del diario.',
  'help.guide.archive-journey.step.2':
    'In fondo, Archivia il viaggio lo termina e lo segna come archiviato; Ripristina il viaggio lo riporta. Elimina lo rimuove con tutte le voci e le foto, dopo una conferma.',
  'help.guide.archive-journey.result':
    'Un diario archiviato resta leggibile e condivisibile; solo non si apre più su oggi.',
  'help.guide.archive-journey.tip.1':
    'L’eliminazione non si può annullare, e non tocca i viaggi a cui il diario era collegato.',
  'help.guide.archive-journey.tip.2': 'Copertina, nome e sottotitolo stanno nello stesso dialogo, in cima.',

  // ── Screen: journey-studio ────────────────────────────────────────────────────────────
  'help.ctx.journey-studio.title': 'Studio',
  'help.ctx.journey-studio.summary':
    'TREK Studio impagina un diario di viaggio come un libro fotografico stampabile. Si apre sopra il diario: l’elenco delle pagine e i contenuti a sinistra, la doppia pagina su cui stai lavorando al centro, le sue proprietà a destra. Auto layout costruisce una prima bozza dalle tue voci; tutto ciò che segue è tuo da spostare, ritagliare e ristilizzare, con un annulla per ogni passo.',
  'help.ctx.journey-studio.bullet.1':
    'Barra in alto: Back to the journey, Book view, Undo e Redo, Page format, Auto layout ed Export. Il segno Salvato accanto al titolo ti dice quando il libro è archiviato.',
  'help.ctx.journey-studio.bullet.2':
    'Colonna a sinistra con cinque sezioni: Pages, Content (le foto e le voci del diario), Elements (testo, forme, linee, griglie, cornici, icone), Viaggio (mappe, paesi, bandiere e contrassegni costruiti dal diario) e Layouts.',
  'help.ctx.journey-studio.bullet.3':
    'Piano di lavoro: la doppia pagina corrente con abbondanza e margini di sicurezza, la barra dello zoom sotto, Fit to view e Scarica questa doppia pagina a destra.',
  'help.ctx.journey-studio.bullet.4':
    'Properties a destra: posizione e dimensioni, ritaglio e punto focale, riempi o adatta, look, angoli, cornice, ordine di sovrapposizione e blocco di ciò che è selezionato; numeri di pagina e documento quando non lo è nulla.',
  'help.ctx.journey-studio.bullet.5':
    'Il libro ha la forma di uno rilegato: copertina, una prima pagina singola, le doppie pagine, un’ultima pagina singola e la quarta di copertina. I numeri di pagina contano dalla prima pagina e si stampano come mostrati.',
  'help.ctx.journey-studio.bullet.6':
    'Più persone possono progettare insieme: ognuno vede i puntatori degli altri con i loro nomi, e un salvataggio su una versione che qualcun altro ha cambiato torna come conflitto invece di sovrascrivere il suo lavoro.',
  // studio-auto-layout
  'help.guide.studio-auto-layout.title': 'Costruire il libro automaticamente',
  'help.guide.studio-auto-layout.goal':
    'Ottieni con un clic una prima bozza completa dalle voci e dalle foto del diario.',
  'help.guide.studio-auto-layout.step.1': 'Clicca Auto layout nella barra in alto.',
  'help.guide.studio-auto-layout.step.2':
    'Scegli Tutto il libro: sostituisce ogni pagina, mantenendo il tuo titolo e l’impostazione della pagina. Questa pagina ricostruisce solo quella sullo schermo, ed è offerta su una doppia pagina nata da una voce.',
  'help.guide.studio-auto-layout.step.3':
    'Scorri l’elenco delle pagine. Undo riporta indietro l’intero layout se preferivi quello che avevi.',
  'help.guide.studio-auto-layout.result':
    'Una doppia pagina per voce, in ordine, con foto, titolo e racconto sistemati per te. Ogni elemento continua a seguire la sua voce finché non lo modifichi.',
  'help.guide.studio-auto-layout.tip.1':
    'Entrambe le opzioni sono normali passi di annulla, quindi provale liberamente.',
  'help.guide.studio-auto-layout.tip.2':
    'Un elemento che Auto layout ha legato a una voce segue le modifiche a quella voce finché non lo tocchi in Properties; quello spezza il legame.',
  // studio-pages
  'help.guide.studio-pages.title': 'Aggiungere, spostare e rimuovere doppie pagine',
  'help.guide.studio-pages.goal': 'Dai forma al libro pagina per pagina.',
  'help.guide.studio-pages.step.1':
    'Apri Pages nella colonna. Le miniature sono il libro in ordine: copertina, prima pagina, doppie pagine, ultima pagina, quarta di copertina.',
  'help.guide.studio-pages.step.2':
    'Aggiungi pagina in basso ne mette una nuova prima dell’ultima pagina; il + tra due miniature ne inserisce una proprio lì.',
  'help.guide.studio-pages.step.3':
    'Passa sopra una miniatura per le sue azioni: Sposta prima, Sposta dopo, Duplica pagina ed Elimina pagina. Clicca una miniatura per aprire quella doppia pagina sul piano di lavoro.',
  'help.guide.studio-pages.result':
    'Copertina, prima e ultima pagina e quarta di copertina restano dove sono; le nuove doppie pagine finiscono sempre in mezzo.',
  'help.guide.studio-pages.tip.1': 'Book view nella barra in alto mostra tutto il libro in fogli, come sarà rilegato.',
  'help.guide.studio-pages.tip.2':
    'I numeri di pagina si attivano sotto Documento in Properties, senza nulla selezionato.',
  // studio-layouts
  'help.guide.studio-layouts.title': 'Applicare un layout a una doppia pagina',
  'help.guide.studio-layouts.goal': 'Dai a una doppia pagina una disposizione pronta di cornici per foto e testo.',
  'help.guide.studio-layouts.step.1':
    'Apri Layouts nella colonna. Tredici layout per doppie pagine, e un set a parte per copertina, retro e pagine singole.',
  'help.guide.studio-layouts.step.2':
    'Cliccane uno. La doppia pagina sul piano di lavoro prende le sue cornici; foto e testo che avevi già vengono versati dentro.',
  'help.guide.studio-layouts.result':
    'Le cornici vuote aspettano contenuto: trascina una foto da Content su una, o usa Add to this page.',
  'help.guide.studio-layouts.tip.1': 'Un layout è un passo di annulla come qualsiasi altro.',
  // studio-content
  'help.guide.studio-content.title': 'Mettere foto e voci su una pagina',
  'help.guide.studio-content.goal': 'Porta il materiale del diario stesso sulla doppia pagina.',
  'help.guide.studio-content.step.1':
    'Apri Content nella colonna. Photos elenca ogni immagine del diario; Entries elenca le voci con il loro testo.',
  'help.guide.studio-content.step.2':
    'Trascina una foto sulla doppia pagina, o su una cornice vuota, oppure clicca Add to this page sotto di essa. Carica foto aggiunge immagini che non sono ancora nel diario.',
  'help.guide.studio-content.step.3':
    'Sotto una voce, Title, Story e Place mettono quel testo sulla pagina come elemento di testo; Data e le coordinate arrivano come contrassegni, e le foto della voce sono elencate proprio lì.',
  'help.guide.studio-content.result':
    'Una foto rilasciata diventa un elemento foto; il testo continua a seguire la voce finché non lo modifichi.',
  'help.guide.studio-content.tip.1': 'La casella di ricerca in cima a Content filtra entrambi gli elenchi.',
  'help.guide.studio-content.tip.2':
    'Rilasciare un file dal desktop sul piano di lavoro lo carica e lo posiziona in un colpo solo.',
  // studio-elements
  'help.guide.studio-elements.title': 'Aggiungere testo, forme e icone',
  'help.guide.studio-elements.goal': 'Decora una doppia pagina oltre foto e racconti.',
  'help.guide.studio-elements.step.1': 'Apri Elements nella colonna.',
  'help.guide.studio-elements.step.2':
    'Clicca uno stile di testo per un titolo o una didascalia, una forma, una linea, una griglia, una cornice vuota con uno stile di cornice, o un’icona dalla libreria con ricerca. Ognuno atterra al centro della doppia pagina, pronto da spostare.',
  'help.guide.studio-elements.result':
    'Fai doppio clic su un elemento di testo per scriverci; Properties contiene carattere, peso, dimensione, spaziatura e allineamento.',
  'help.guide.studio-elements.tip.1': 'Le cornici sono spazi foto vuoti: rilasciaci un’immagine più tardi.',
  // studio-travel
  'help.guide.studio-travel.title': 'Aggiungere una mappa, bandiere e numeri',
  'help.guide.studio-travel.goal': 'Trasforma il viaggio stesso in numeri sulla pagina.',
  'help.guide.studio-travel.step.1': 'Apri Viaggio nella colonna.',
  'help.guide.studio-travel.step.2':
    'Scegli cosa aggiungere: una mappa del percorso delle voci, sagome dei paesi, un elenco o una griglia dei paesi, bandiere, un contrassegno di data, giorno o distanza, o un riepilogo dell’intero viaggio. Ognuno è costruito dai dati del diario e si aggiorna con essi.',
  'help.guide.studio-travel.result':
    'L’elemento compare sulla doppia pagina; Properties ne regola lo stile, e per la mappa l’area.',
  'help.guide.studio-travel.tip.1':
    'I contrassegni seguono la voce da cui è nata la doppia pagina, quindi un contrassegno di data su una doppia pagina impaginata automaticamente mostra già quel giorno.',
  // studio-properties
  'help.guide.studio-properties.title': 'Modificare ciò che hai selezionato',
  'help.guide.studio-properties.goal': 'Sposta, ritaglia, stilizza e sovrapponi un elemento con l’ispettore.',
  'help.guide.studio-properties.step.1':
    'Clicca un elemento sulla doppia pagina. Compaiono le maniglie per dimensione e rotazione; trascinalo per spostarlo.',
  'help.guide.studio-properties.step.2':
    'Properties a destra segue la selezione: posizione e dimensioni, Crop con il punto focale che decide cosa resta nella cornice, Fill o Fit, i filtri Look, il raggio in Corner, lo stile in Cornice, l’ordine di sovrapposizione e Lock.',
  'help.guide.studio-properties.step.3':
    'Duplica e Delete stanno in cima all’ispettore; Undo nella barra in alto annulla qualsiasi di queste modifiche.',
  'help.guide.studio-properties.result':
    'Un elemento bloccato non si può più afferrare sulla pagina, il che tiene al sicuro un layout finito mentre ci lavori intorno.',
  'help.guide.studio-properties.tip.1': 'Maiusc-clic seleziona più elementi; l’ispettore li modifica poi insieme.',
  'help.guide.studio-properties.tip.2':
    'Modificare un elemento posizionato da Auto layout spezza il suo legame con la voce; smette di seguire le modifiche successive a quella voce.',
  // studio-format
  'help.guide.studio-format.title': 'Scegliere il formato di pagina',
  'help.guide.studio-format.goal':
    'Imposta la dimensione a cui sarà stampato il libro, prima che il layout ne dipenda.',
  'help.guide.studio-format.step.1': 'Clicca Page format nella barra in alto.',
  'help.guide.studio-format.step.2':
    'Scegli Square 21 × 21 cm, Square 30 × 30 cm, A4 o A5 landscape o portrait, oppure inserisci larghezza e altezza personalizzate in millimetri. Abbondanza e Sicurezza stanno subito sotto.',
  'help.guide.studio-format.result':
    'Ogni doppia pagina è disegnata a quella dimensione, con 3 mm di abbondanza e 5 mm di margine di sicurezza come impostazione predefinita.',
  'help.guide.studio-format.tip.1':
    'Cambia prima il formato, poi lancia Auto layout; il layout è costruito per la dimensione che trova.',
  'help.guide.studio-format.tip.2':
    'Chiedi alla tua tipografia i suoi valori di abbondanza e sicurezza e inserisci quelli.',
  // studio-export
  'help.guide.studio-export.title': 'Esportare il libro come PDF',
  'help.guide.studio-export.goal': 'Ottieni un file pronto per la stampa, o uno da leggere a schermo.',
  'help.guide.studio-export.step.1': 'Clicca Export nella barra in alto.',
  'help.guide.studio-export.step.2':
    'Scegli Pagine singole, una pagina per foglio in ordine di lettura, ciò che vuole una tipografia, oppure Doppie pagine, due pagine alla volta come si apre il libro. Segni di taglio aggiunge l’abbondanza su ogni bordo e segna dove tagliare.',
  'help.guide.studio-export.step.3':
    'Clicca Anteprima di stampa. Il browser apre le pagine e Salva come PDF le trasforma nel file.',
  'help.guide.studio-export.result':
    'Un PDF con tanti fogli quanti ne ha annunciati la finestra, nel formato di pagina che hai impostato.',
  'help.guide.studio-export.tip.1': 'Creare il PDF è solo per desktop, come Studio stesso.',
  'help.guide.studio-export.tip.2':
    'Per una bozza, esporta Doppie pagine senza segni di taglio; per la tipografia, Pagine singole con i segni.',
  // studio-spread-file
  'help.guide.studio-spread-file.title': 'Riutilizzare una doppia pagina in un altro libro',
  'help.guide.studio-spread-file.goal': 'Porta un design che ti piace dal libro di un diario a un altro.',
  'help.guide.studio-spread-file.step.1':
    'Con la doppia pagina sul piano di lavoro, clicca Scarica questa doppia pagina all’estremità destra della barra dello zoom. Il file contiene il design, non le fotografie.',
  'help.guide.studio-spread-file.step.2':
    'Nell’altro libro, apri Pages e clicca Importa accanto ad Aggiungi pagina, poi scegli il file.',
  'help.guide.studio-spread-file.result':
    'La doppia pagina arriva con le sue cornici e i suoi stili di testo; rilascia le foto del nuovo diario nelle cornici.',
  'help.guide.studio-spread-file.tip.1':
    'Un file che non è un design di doppia pagina viene rifiutato con una motivazione.',

  // ── Screen: settings (all tabs) ───────────────────────────────────────────────────────
  'help.ctx.settings.title': 'Impostazioni',
  'help.ctx.settings.summary':
    'Le tue impostazioni personali, una scheda per argomento nella barra laterale a sinistra. La maggior parte degli interruttori si applica nel momento in cui li sposti; un modulo con un pulsante Salva in fondo lo aspetta. Niente qui cambia il TREK di qualcun altro.',
  'help.ctx.settings.bullet.1':
    'Barra laterale a sinistra: Visualizzazione, Appearance, Mappa, Notifiche, Integrazioni, Offline e Account. Plugin compare appena ne è installato uno, Informazioni ovunque l’admin non l’abbia tolto.',
  'help.ctx.settings.bullet.2':
    'Visualizzazione è lingua, unità, valuta e con cosa si apre l’app; Appearance è tema, colori, dimensione del testo e i widget della dashboard.',
  'help.ctx.settings.bullet.3':
    'Mappa sceglie il renderer e il suo stile; Notifiche i canali che ti raggiungono; Integrazioni librerie foto, chiavi API e MCP; Offline ciò che l’app tiene su questo dispositivo.',
  'help.ctx.settings.bullet.4':
    'Account contiene profilo, password, autenticazione a due fattori, passkey e l’eliminazione del tuo account.',
  'help.ctx.settings-display.title': 'Visualizzazione',
  'help.ctx.settings-display.summary':
    'Lingua, unità e valuta, come si comportano mappa e prenotazioni, e con cosa si apre TREK. Ogni modifica qui si applica subito.',
  'help.ctx.settings-display.bullet.1':
    'Language & region: la lingua dell’interfaccia, il formato dell’ora, il primo giorno della settimana, la valuta di visualizzazione, e le unità di distanza e temperatura.',
  'help.ctx.settings-display.bullet.2':
    'Travel & map: i percorsi delle prenotazioni sempre sulla mappa, la pillola Esplora luoghi, l’ottimizzazione del percorso dal tuo alloggio, i codici di prenotazione nascosti e i percorsi delle prenotazioni etichettati.',
  'help.ctx.settings-display.bullet.3':
    'Avvio: se TREK si apre sulla dashboard o sul viaggio attivo, e quale scheda di un viaggio compare per prima.',
  'help.ctx.settings-appearance.title': 'Appearance',
  'help.ctx.settings-appearance.summary':
    'Come appare TREK su questo account: chiaro o scuro, il colore d’accento, vetro e movimento, dimensione del testo, e quali widget mostra la dashboard. Tutto si applica dal vivo, su ogni dispositivo in cui accedi.',
  'help.ctx.settings-appearance.bullet.1':
    'Theme: Chiara, Scura o Automatica, e il Color scheme con un Custom accent tutto tuo.',
  'help.ctx.settings-appearance.bullet.2':
    'Readability: Transparency, Reduce motion, Density e Text size, con dimensioni avanzate per livello.',
  'help.ctx.settings-appearance.bullet.3':
    'Dashboard widgets: un interruttore per widget, separatamente per Desktop e Mobile.',
  'help.ctx.settings-appearance.bullet.4': 'Reset to defaults in fondo rimette tutto a posto.',
  'help.ctx.settings-map.title': 'Mappa',
  'help.ctx.settings-map.summary':
    'Quale motore disegna le mappe e in che stile. Leaflet è la classica mappa raster, MapLibre disegna tile vettoriali senza alcun token, Mapbox aggiunge edifici 3D e terreno con il tuo token.',
  'help.ctx.settings-map.bullet.1':
    'Provider mappa: Leaflet, MapLibre o Mapbox, ognuno con una riga su cosa gli serve.',
  'help.ctx.settings-map.bullet.2':
    'Stile mappa e Modello Mappa: l’aspetto dei tile, più il token o la chiave che un provider richiede.',
  'help.ctx.settings-map.bullet.3':
    'Modalità alta qualità per l’antialiasing e la proiezione a globo; Salva Mappa scrive la scelta.',
  'help.ctx.settings-notifications.title': 'Notifiche',
  'help.ctx.settings-notifications.summary':
    'Dove TREK ti raggiunge fuori dall’app: notifiche push su questo dispositivo, un argomento ntfy, un webhook o un canale fornito da un plugin. Sotto i canali, una riga per evento decide cosa va dove.',
  'help.ctx.settings-notifications.bullet.1':
    'ntfy: l’argomento, un server tuo opzionale e un token di accesso opzionale, con Testa per inviarne uno subito.',
  'help.ctx.settings-notifications.bullet.2': 'Webhook: un URL che riceve ogni evento come JSON, con Testa.',
  'help.ctx.settings-notifications.bullet.3':
    'Notifiche push su questo dispositivo: Attiva su questo dispositivo vale solo per il browser che stai usando, quindi ripetilo su ogni telefono o computer. Invia test li raggiunge tutti.',
  'help.ctx.settings-notifications.bullet.4':
    'Le righe delle preferenze: per evento, quale canale è attivo. I canali dei plugin mostrano Configura finché non sono impostati.',
  'help.ctx.settings-integrations.title': 'Integrazioni',
  'help.ctx.settings-integrations.summary':
    'Tutto ciò che si collega a TREK dall’esterno: librerie foto per il diario, chiavi API per gli script, e l’endpoint MCP con i suoi token e client OAuth per gli assistenti IA.',
  'help.ctx.settings-integrations.bullet.1':
    'Provider foto: Immich e Synology Photos, ognuno con il suo URL e la sua chiave, Test connessione e Salva.',
  'help.ctx.settings-integrations.bullet.2':
    'Chiavi API: chiavi personali per script e altri strumenti che chiamano l’API di TREK a tuo nome.',
  'help.ctx.settings-integrations.bullet.3':
    'Configurazione MCP: l’endpoint, una configurazione client pronta da copiare, e i token API.',
  'help.ctx.settings-integrations.bullet.4':
    'Client OAuth 2.1: app che accedono tramite TREK, con URI di reindirizzamento, ambiti consentiti, client macchina e le sessioni attive.',
  'help.ctx.settings-offline.title': 'Offline',
  'help.ctx.settings-offline.summary':
    'Cosa TREK tiene su questo dispositivo perché un viaggio si apra anche senza connessione, e cosa succede quando una modifica fatta offline si scontra con una fatta altrove.',
  'help.ctx.settings-offline.bullet.1':
    'Modalità offline: Forza la modalità offline fa comportare l’app come se la rete fosse sparita, per test o su una connessione a consumo.',
  'help.ctx.settings-offline.bullet.2':
    "Prepara per l'offline: Scarica per l'uso offline scarica ora i tuoi viaggi e i loro tile della mappa.",
  'help.ctx.settings-offline.bullet.3':
    'Cosa archiviare offline: tile della mappa attivi o no, e un interruttore per viaggio.',
  'help.ctx.settings-offline.bullet.4':
    'Conflitti di sincronizzazione e Cache offline: la strategia per gli scontri, il conteggio delle modifiche in sospeso e fallite, Risincronizza ora e Svuota la cache.',
  'help.ctx.settings-account.title': 'Account',
  'help.ctx.settings-account.summary':
    'Chi sei su questo TREK e come accedi: profilo e avatar, password, autenticazione a due fattori, passkey, e in fondo a tutto l’eliminazione dell’account.',
  'help.ctx.settings-account.bullet.1': 'Profilo: nome utente, email e avatar, salvati con Salva Profilo.',
  'help.ctx.settings-account.bullet.2':
    'Cambia Password: password attuale, nuova password due volte, Aggiorna password.',
  'help.ctx.settings-account.bullet.3':
    'Autenticazione a due fattori (2FA) con un’app authenticator e codici di backup; Passkey per accedere senza password.',
  'help.ctx.settings-account.bullet.4':
    'Elimina account in fondo, dietro una conferma. L’ultimo admin non può eliminare sé stesso.',
  // language-region
  'help.guide.language-region.title': 'Impostare lingua, unità e valuta',
  'help.guide.language-region.goal': 'Fai parlare TREK la tua lingua e contare come te.',
  'help.guide.language-region.step.1':
    'Scegli la lingua dell’interfaccia in Language & region. TREK cambia subito, su ogni dispositivo in cui accedi.',
  'help.guide.language-region.step.2':
    'Sotto, scegli il formato dell’ora, il giorno con cui inizia la settimana in ogni selettore di date, la valuta di visualizzazione, e le unità di distanza e temperatura.',
  'help.guide.language-region.result':
    'Date, distanze e soldi si leggono come ti aspetti; la valuta propria di un viaggio resta accanto agli importi convertiti.',
  'help.guide.language-region.tip.1':
    'La valuta di visualizzazione serve per i totali tra viaggi; ogni viaggio mantiene la valuta che gli hai dato.',
  'help.guide.language-region.tip.2': 'La lingua imposta anche i nomi di giorni e mesi in Vacay e nel diario.',
  // travel-map-prefs
  'help.guide.travel-map-prefs.title': 'Regolare come si comportano mappa e prenotazioni',
  'help.guide.travel-map-prefs.goal': 'Decidi cosa mostra la mappa del viaggio per impostazione predefinita.',
  'help.guide.travel-map-prefs.step.1':
    "In Travel & map, Mostra sempre i percorsi delle prenotazioni tiene voli e treni sulla mappa anche quando il loro giorno non è aperto; Esplora luoghi sulla mappa mostra la pillola per trovare luoghi; Ottimizza il percorso dall'alloggio fa partire il percorso da dove dormi.",
  'help.guide.travel-map-prefs.step.2':
    'Nascondi codici di prenotazione nasconde i numeri di conferma finché non ci passi sopra; Etichette percorsi prenotati scrive il nome della prenotazione lungo il suo percorso.',
  'help.guide.travel-map-prefs.result':
    'La mappa del viaggio segue queste scelte su ogni viaggio, finché non le cambi di nuovo.',
  'help.guide.travel-map-prefs.tip.1':
    'Valgono per account, non per viaggio. I membri di un viaggio condiviso vedono ciascuno le proprie scelte.',
  // startup
  'help.guide.startup.title': 'Scegliere con cosa si apre TREK',
  'help.guide.startup.goal': 'Atterra dove lavori di più, non ogni volta sulla dashboard.',
  'help.guide.startup.step.1': 'Sotto Avvio, imposta Pagina iniziale su Dashboard o Viaggio attivo.',
  'help.guide.startup.step.2':
    'Scheda iniziale sceglie quale scheda di un viaggio compare per prima quando ne apri uno.',
  'help.guide.startup.result': 'Il prossimo accesso e il prossimo tocco sul logo portano dritti lì.',
  'help.guide.startup.tip.1': 'Viaggio attivo è il viaggio in corso oggi, o il prossimo quando non ce n’è nessuno.',
  // theme-scheme
  'help.guide.theme-scheme.title': 'Impostare il tema e il colore d’accento',
  'help.guide.theme-scheme.goal': 'Rendi TREK chiaro, scuro o come il tuo dispositivo, nel colore che ti piace.',
  'help.guide.theme-scheme.step.1':
    'Sotto Theme, scegli Chiara, Scura o Automatica. Automatica segue il tuo dispositivo.',
  'help.guide.theme-scheme.step.2':
    'Scegli un Color scheme: Default, High contrast, Indigo, Teal, Rose, Amber, Violet o Custom.',
  'help.guide.theme-scheme.step.3':
    'Con Custom, scegli un accento dai preset o inserisci il tuo. Un controllo del contrasto accanto dice se il testo resta leggibile sopra.',
  'help.guide.theme-scheme.result':
    'Pulsanti, link ed evidenziazioni prendono l’accento ovunque, su ogni dispositivo in cui accedi.',
  'help.guide.theme-scheme.tip.1':
    'Anche la barra di navigazione ha un interruttore rapido chiaro o scuro; imposta lo stesso tema.',
  'help.guide.theme-scheme.tip.2':
    'High contrast è lo schema da scegliere quando il predefinito si legge troppo tenue.',
  // readability
  'help.guide.readability.title': 'Regolare leggibilità e dimensione del testo',
  'help.guide.readability.goal': 'Meno vetro, meno movimento, più spazio o caratteri più grandi.',
  'help.guide.readability.step.1':
    'Sotto Readability, Transparency passa i pannelli di vetro a superfici piene, Reduce motion riduce al minimo le animazioni, e Density sceglie Comfortable o Compact.',
  'help.guide.readability.step.2':
    'Text size scala Everything in una volta; Advanced text sizes lascia che titoli, sottotitoli, corpo e didascalie differiscano.',
  'help.guide.readability.result': 'Tutta l’app segue subito, compresi i pannelli della mappa e il diario.',
  'help.guide.readability.tip.1': 'Reduce motion segue anche l’impostazione del tuo sistema quando lo lasci stare.',
  'help.guide.readability.tip.2':
    'La dimensione del testo passa per i livelli tipografici, così niente viene tagliato; una dimensione che non ci sta più va a capo.',
  // dashboard-widgets
  'help.guide.dashboard-widgets.title': 'Scegliere i widget della dashboard',
  'help.guide.dashboard-widgets.goal': 'Mostra solo i widget che usi, separatamente su desktop e sul telefono.',
  'help.guide.dashboard-widgets.step.1':
    'Sotto Dashboard widgets, attiva o disattiva ogni widget per Desktop e per Mobile: la barra laterale destra nel suo insieme, valuta, raccolte, fusi orari, prenotazioni in arrivo, paesi dell’Atlas e i numeri di viaggio.',
  'help.guide.dashboard-widgets.step.2': 'Reset to defaults in fondo riporta l’intera scheda a com’era all’origine.',
  'help.guide.dashboard-widgets.result':
    'La dashboard si riorganizza subito; con la barra laterale destra spenta si centra.',
  'help.guide.dashboard-widgets.tip.1': 'I widget di un addon compaiono solo finché l’admin tiene quell’addon attivo.',
  'help.guide.dashboard-widgets.tip.2':
    'La dashboard stessa ricorda la tua vista a griglia o a elenco e l’ordinamento per dispositivo.',
  // map-provider
  'help.guide.map-provider.title': 'Scegliere il motore e lo stile della mappa',
  'help.guide.map-provider.goal': 'Passa dalla mappa classica ai tile vettoriali o alla mappa 3D di Mapbox.',
  'help.guide.map-provider.step.1':
    'Sotto Provider mappa, scegli Leaflet per la classica mappa 2D con qualsiasi tile raster, MapLibre per i tile vettoriali OpenFreeMap senza token, o Mapbox per tile vettoriali con edifici 3D e terreno.',
  'help.guide.map-provider.step.2':
    'Scegli uno Stile mappa o un Modello Mappa per l’aspetto. Mapbox richiede un Token di accesso Mapbox, alcuni stili raster una Chiave API CARTO; il link accanto al campo porta dove ottenerne una.',
  'help.guide.map-provider.step.3':
    'Modalità alta qualità aggiunge antialiasing e la proiezione a globo. Clicca Salva Mappa.',
  'help.guide.map-provider.result':
    'Ogni mappa in TREK, viaggi, Atlas, Raccolte e il diario, è disegnata dal motore che hai scelto.',
  'help.guide.map-provider.tip.1': 'Senza token, Mapbox ripiega sulla mappa predefinita invece di non mostrare nulla.',
  'help.guide.map-provider.tip.2':
    'I tile della mappa che archivi offline vengono dal provider attivo quando li scarichi.',
  // notification-channels
  'help.guide.notification-channels.title': 'Impostare dove ti raggiungono le notifiche',
  'help.guide.notification-channels.goal':
    'Ricevi promemoria di viaggio ed eventi di collaborazione sul telefono o in un altro strumento.',
  'help.guide.notification-channels.step.1':
    'Sotto Notifiche, compila un Argomento Ntfy; aggiungi il tuo URL server Ntfy (opzionale) e un Token di accesso (opzionale) se ne gestisci uno. Testa invia subito un messaggio.',
  'help.guide.notification-channels.step.2':
    'Oppure indica un URL webhook che riceve ogni evento come JSON, e provalo allo stesso modo con Testa.',
  'help.guide.notification-channels.step.3':
    'Nelle righe sotto, attiva o disattiva ogni evento per canale. Un canale di plugin dice Configura finché non è impostato nelle impostazioni del plugin; Invia test ne prova uno.',
  'help.guide.notification-channels.result':
    'Gli eventi escono dai canali attivi. La campanella nella barra di navigazione continua comunque a mostrarli nell’app.',
  'help.guide.notification-channels.tip.1':
    'Le preferenze per viaggio stanno sul viaggio stesso, nelle sue impostazioni di notifica.',
  'help.guide.notification-channels.tip.2':
    'L’admin può precompilare un server ntfy predefinito per tutti; l’argomento lo scegli comunque tu.',
  // photo-providers
  'help.guide.photo-providers.title': 'Collegare una libreria foto',
  'help.guide.photo-providers.goal': 'Lascia che il diario prenda le foto del giorno da Immich o Synology Photos.',
  'help.guide.photo-providers.step.1':
    'Sotto Integrazioni, trova la sezione del provider e inserisci il suo URL e la chiave API. Immich offre anche di rispecchiare i caricamenti del diario nella libreria.',
  'help.guide.photo-providers.step.2': 'Clicca Test connessione, poi Salva.',
  'help.guide.photo-providers.result':
    'La scheda External photos dell’editor delle voci cerca nella libreria collegata il giorno della voce, prima le più vicine alla posizione della voce.',
  'help.guide.photo-providers.tip.1':
    'La connessione è tua: gli altri membri di un diario collegano le proprie librerie.',
  'help.guide.photo-providers.tip.2':
    'Un provider senza dati GPS nelle foto funziona lo stesso; l’elenco è allora in ordine di tempo.',
  // api-keys
  'help.guide.api-keys.title': 'Creare una chiave API',
  'help.guide.api-keys.goal': 'Lascia che uno script o un altro strumento chiami l’API di TREK come te.',
  'help.guide.api-keys.step.1': 'Sotto Chiavi API, clicca Crea chiave e dalle un nome che dica dove verrà usata.',
  'help.guide.api-keys.step.2':
    'Copia la chiave dalla finestra: viene mostrata una volta sola. Elimina una chiave dall’elenco quando lo strumento non ne ha più bisogno.',
  'help.guide.api-keys.result':
    'Le richieste con quella chiave agiscono con i tuoi permessi; l’elenco mostra quando ogni chiave è stata creata e usata l’ultima volta.',
  'help.guide.api-keys.tip.1': 'Una chiave per strumento rende la revoca indolore.',
  'help.guide.api-keys.tip.2':
    'Per un assistente IA usa invece MCP con OAuth; le chiavi API sono per semplici client HTTP.',
  // mcp-oauth
  'help.guide.mcp-oauth.title': 'Collegare un assistente IA via MCP',
  'help.guide.mcp-oauth.goal': 'Dai a Claude, a un IDE o a un altro client MCP l’accesso ai tuoi viaggi.',
  'help.guide.mcp-oauth.step.1':
    'Sotto Configurazione MCP, copia l’Endpoint MCP, o l’intera Configurazione client per un client che accetta uno snippet JSON.',
  'help.guide.mcp-oauth.step.2':
    'I client che accedono tramite browser usano OAuth 2.1: Nuovo client sotto Client OAuth 2.1, con i suoi URI di reindirizzamento, gli Ambiti consentiti e, per un server senza browser, Client macchina.',
  'help.guide.mcp-oauth.step.3':
    'Rinnova segreto ed Elimina client stanno su ogni client; Sessioni OAuth attive elenca cosa è connesso e ti permette di revocarlo. Token API con Crea nuovo token è la via d’accesso più vecchia.',
  'help.guide.mcp-oauth.result':
    'Il client può leggere e modificare ciò che i suoi ambiti consentono, come te, e ogni azione compare a tuo nome.',
  'help.guide.mcp-oauth.tip.1':
    'Gli ambiti sono la rete di sicurezza: dai a un client solo l’ambito di lettura finché non gli serve di più.',
  'help.guide.mcp-oauth.tip.2': 'L’admin può spegnere MCP per l’intera istanza; allora questa sezione non c’è.',
  // offline-prepare
  'help.guide.offline-prepare.title': 'Portare i viaggi offline',
  'help.guide.offline-prepare.goal':
    'Tieni i tuoi viaggi e le loro mappe su questo dispositivo prima che la connessione cada.',
  'help.guide.offline-prepare.step.1':
    'Sotto Cosa archiviare offline, lascia attivo Archivia i tile della mappa offline e attiva i viaggi che vuoi su questo dispositivo.',
  'help.guide.offline-prepare.step.2':
    "Clicca Scarica per l'uso offline sotto Prepara per l'offline. Scarica i viaggi e i tile intorno ai loro luoghi.",
  'help.guide.offline-prepare.step.3':
    'Forza la modalità offline sotto Modalità offline ti lascia controllare che ci sia tutto prima di partire.',
  'help.guide.offline-prepare.result':
    'I viaggi si aprono senza connessione; le modifiche che fai aspettano in coda ed escono alla riconnessione.',
  'help.guide.offline-prepare.tip.1':
    'I tile occupano più spazio di tutto: la sezione Cache offline mostra cosa è archiviato, per viaggio.',
  'help.guide.offline-prepare.tip.2': 'Installa TREK come app dal browser per l’avvio offline più fluido.',
  // offline-conflicts
  'help.guide.offline-conflicts.title': 'Decidere chi vince in un conflitto di sincronizzazione',
  'help.guide.offline-conflicts.goal': 'Scegli come TREK risolve una modifica fatta offline contro una fatta altrove.',
  'help.guide.offline-conflicts.step.1':
    'Sotto Conflitti di sincronizzazione, scegli Chiedimi ogni volta, Mantieni sempre la mia versione o Mantieni sempre la versione del server.',
  'help.guide.offline-conflicts.step.2':
    'Cache offline mostra viaggi, modifiche in sospeso e fallite e conflitti; Risincronizza ora spinge la coda, Svuota la cache svuota il dispositivo.',
  'help.guide.offline-conflicts.result':
    'Con Chiedimi, un conflitto mostra entrambe le versioni e ti lascia scegliere; con le altre due si risolve in silenzio.',
  'help.guide.offline-conflicts.tip.1':
    'Svuota la cache rimuove solo la copia su questo dispositivo; niente sul server viene toccato.',
  // profile
  'help.guide.profile.title': 'Modificare il tuo profilo',
  'help.guide.profile.goal': 'Aggiorna nome, email e immagine.',
  'help.guide.profile.step.1':
    'Sotto Account, modifica Nome utente ed Email. L’avatar accetta un tuo caricamento; rimuovilo per tornare alle iniziali.',
  'help.guide.profile.step.2': 'Clicca Salva Profilo.',
  'help.guide.profile.result': 'Nome e immagine si aggiornano ovunque in una volta, anche sui viaggi che condividi.',
  'help.guide.profile.tip.1': 'Un account che accede tramite OIDC lo mostra qui; l’email arriva allora dal provider.',
  // password
  'help.guide.password.title': 'Cambiare la tua password',
  'help.guide.password.goal': 'Imposta una nuova password.',
  'help.guide.password.step.1': 'Sotto Cambia Password, inserisci la password attuale, poi la nuova due volte.',
  'help.guide.password.step.2': 'Clicca Aggiorna password.',
  'help.guide.password.result': 'La nuova password vale dal prossimo accesso; le altre sessioni restano connesse.',
  'help.guide.password.tip.1': 'Un account che accede tramite OIDC non ha una password TREK da cambiare.',
  // mfa
  'help.guide.mfa.title': 'Attivare l’autenticazione a due fattori',
  'help.guide.mfa.goal': 'Proteggi l’account con un codice da un’app authenticator.',
  'help.guide.mfa.step.1': 'Sotto Autenticazione a due fattori (2FA), clicca Configura authenticator.',
  'help.guide.mfa.step.2':
    'Scansiona il codice QR con la tua app, o inserisci il segreto a mano, poi digita il codice a sei cifre che mostra e clicca Abilita 2FA.',
  'help.guide.mfa.step.3':
    'Salva i codici di backup: copiali, scaricali o stampali. Ognuno vale una volta, quando non hai il telefono a portata di mano.',
  'help.guide.mfa.result': 'Ogni accesso chiede un codice dopo la password.',
  'help.guide.mfa.tip.1': 'Disabilita 2FA richiede la tua password e un codice corrente.',
  'help.guide.mfa.tip.2': 'L’admin può imporre la 2FA a tutti; allora non si può disattivare qui.',
  // passkeys
  'help.guide.passkeys.title': 'Accedere con una passkey',
  'help.guide.passkeys.goal': 'Usa impronta, volto o PIN del tuo dispositivo al posto di una password.',
  'help.guide.passkeys.step.1':
    'Sotto Passkey, clicca Aggiungi una passkey e conferma con il tuo dispositivo. Dalle un nome che dica quale dispositivo è.',
  'help.guide.passkeys.step.2':
    'L’elenco mostra ogni passkey con il nome e l’ultimo utilizzo; il pulsante elimina ne rimuove una.',
  'help.guide.passkeys.result': 'La pagina di accesso propone la passkey; la password resta come riserva.',
  'help.guide.passkeys.tip.1':
    'Una passkey vive sul dispositivo o nel suo gestore di password, quindi aggiungine una per dispositivo.',
  'help.guide.passkeys.tip.2':
    'Le passkey richiedono HTTPS; su un’istanza in semplice HTTP la sezione spiega perché non sono disponibili.',
  // delete-account
  'help.guide.delete-account.title': 'Eliminare il tuo account',
  'help.guide.delete-account.goal': 'Rimuovi il tuo account e i dati che sono solo tuoi.',
  'help.guide.delete-account.step.1': 'In fondo a tutto in Account, clicca Elimina account e conferma.',
  'help.guide.delete-account.result':
    'Il tuo account, i tuoi viaggi e i tuoi diari spariscono; i viaggi che condividi con altri restano a loro.',
  'help.guide.delete-account.tip.1':
    'L’ultimo admin di un’istanza non può eliminare sé stesso; prima rendi admin qualcun altro.',
  'help.guide.delete-account.tip.2': 'Non si torna indietro. Esporta ciò che vuoi tenere prima di confermare.',

  // ── Screen: admin (all tabs) ──────────────────────────────────────────────────────────
  'help.ctx.admin.title': 'Amministrazione',
  'help.ctx.admin.summary':
    'L’istanza dietro il TREK di tutti: chi può accedere e come, cosa è attivo, dove vivono i file, come il server raggiunge le persone e come viene salvato. Solo gli admin vedono questa pagina; ogni scheda è una schermata a sé nella barra laterale.',
  'help.ctx.admin.bullet.1':
    'Le quattro card in alto contano utenti, viaggi, luoghi e file; un banner sopra annuncia una release più recente di TREK.',
  'help.ctx.admin.bullet.2':
    'Utenti e Impostazioni predefinite: account, link di invito e le impostazioni della mappa con cui parte un nuovo account.',
  'help.ctx.admin.bullet.3':
    'Personalizzazione, Impostazioni, Moduli e Plugin: modelli lista valigia, categorie e vacanze scolastiche; metodi di accesso e chiavi API; i moduli funzionali; plugin di terze parti.',
  'help.ctx.admin.bullet.4':
    'Archiviazione, Notifiche, Accesso MCP e GitHub: dove vanno i caricamenti, i canali dell’intera istanza, token e sessioni dei client IA, e la cronologia dei rilasci.',
  'help.ctx.admin.bullet.5':
    'Backup e Audit: backup su richiesta e pianificati, e il registro degli eventi rilevanti per la sicurezza.',
  'help.ctx.admin-users.title': 'Utenti',
  'help.ctx.admin-users.summary':
    'Ogni account di questo TREK, con ruolo, email e ultimo accesso, e i link di invito che permettono alle persone di registrarsi su un’istanza chiusa.',
  'help.ctx.admin-users.bullet.1':
    'La tabella: nome utente, email, ruolo, data di creazione, ultimo accesso e le azioni per riga. Tu sei contrassegnato come te.',
  'help.ctx.admin-users.bullet.2': 'Crea Utente in alto aggiunge un account a mano, con una password che consegni tu.',
  'help.ctx.admin-users.bullet.3':
    'Link di Invito sotto: link di registrazione monouso con un limite di utilizzi, una scadenza e, se vuoi, un viaggio a cui il nuovo utente si unisce all’arrivo.',
  'help.ctx.admin-users.bullet.4':
    'Impostazioni dei permessi in fondo: per ogni azione, chi può farla, Tutti, Membri del viaggio, Proprietario del viaggio o Solo amministratore.',
  'help.ctx.admin-defaults.title': 'Impostazioni predefinite',
  'help.ctx.admin-defaults.summary':
    'Le impostazioni con cui parte un nuovo account, così nessuno deve prima cercare la scheda della mappa: motore mappe, stile, token e qualità.',
  'help.ctx.admin-defaults.bullet.1':
    'Motore mappe, stile e token Mapbox, chiave CARTO e qualità Mapbox, esattamente come li imposterebbe un utente sotto Impostazioni, Mappa.',
  'help.ctx.admin-defaults.bullet.2':
    'Ripristina per campo riporta la scelta di TREK; l’impostazione personale di un utente vince sempre su queste.',
  'help.ctx.admin-config.title': 'Personalizzazione',
  'help.ctx.admin-config.summary':
    'Ciò che ogni viaggio dell’istanza condivide: modelli lista valigia, l’insieme di categorie per luoghi e raccolte, e il catalogo delle vacanze scolastiche da cui attinge Vacay.',
  'help.ctx.admin-config.bullet.1':
    'Modelli lista valigia: liste con nome di categorie e oggetti da cui può partire la lista valigia di un viaggio.',
  'help.ctx.admin-config.bullet.2':
    'Categorie: nome, icona e colore delle categorie usate in tutto TREK, dall’ispettore dei luoghi alle Raccolte.',
  'help.ctx.admin-config.bullet.3':
    'Vacanze scolastiche: il catalogo di paesi e regioni, per i posti che i feed integrati non coprono.',
  'help.ctx.admin-settings.title': 'Impostazioni',
  'help.ctx.admin-settings.summary':
    'Come entrano le persone e con cosa può parlare il server: metodi di accesso e registrazione, SSO, passkey, regola sui due fattori, le chiavi API per mappe, luoghi e immagini, i provider di ricerca e trasporto, e i tipi di file che i caricamenti possono avere.',
  'help.ctx.admin-settings.bullet.1':
    'Authentication Methods: Password Login, Password Registration, SSO Login, SSO Auto-Provisioning e Richiedi autenticazione a due fattori (2FA).',
  'help.ctx.admin-settings.bullet.2':
    'Single Sign-On (OIDC) con emittente, client e nome visualizzato; Accesso con passkey con Relying Party ID e origini.',
  'help.ctx.admin-settings.bullet.3':
    'Chiavi API: Google Maps, Unsplash e Amap, ognuna con Testa; A cosa serve la chiave restringe la chiave Google alle funzioni che vuoi pagare.',
  'help.ctx.admin-settings.bullet.4':
    'Provider per la ricerca di luoghi e Provider del trasporto pubblico scelgono chi risponde a ricerche e percorsi; Tipi di File Consentiti limita i caricamenti.',
  'help.ctx.admin-addons.title': 'Moduli',
  'help.ctx.admin-addons.summary':
    'I moduli funzionali di TREK, ognuno con un interruttore: Liste, Costi, Documenti, Vacay, Atlas, Collaborazione, Diario di viaggio, Raccolte, Viaggio su strada, MCP, AirTrail, Dawarich e l’analisi con IA. Spento significa che la voce di navigazione, le route e l’API spariscono per tutti.',
  'help.ctx.admin-addons.bullet.1':
    'Un riquadro per modulo con il suo interruttore e, dove ne ha, sotto-righe per le sue opzioni.',
  'help.ctx.admin-addons.bullet.2':
    'Anche i provider di foto e di documenti compaiono qui come riquadri, così Immich o Synology possono essere offerti agli utenti.',
  'help.ctx.admin-addons.bullet.3': 'Tracciamento valigia ha il proprio interruttore sotto i riquadri.',
  'help.ctx.admin-plugins.title': 'Plugin',
  'help.ctx.admin-plugins.summary':
    'Plugin di terze parti che girano in un processo proprio accanto a TREK, ognuno con i permessi chiesti all’installazione. Installa dal catalogo, carica un pacchetto, o collega una cartella mentre ne sviluppi uno.',
  'help.ctx.admin-plugins.bullet.1':
    'La lista: ogni plugin installato con versione, stato, firma e i permessi che ha; attiva, disattiva, aggiorna o disinstalla per riga.',
  'help.ctx.admin-plugins.bullet.2':
    'Carica plugin prende un file pacchetto; Riscansiona rileva una cartella plugin collegata per lo sviluppo.',
  'help.ctx.admin-plugins.bullet.3':
    'Host consentiti per plugin: gli indirizzi che un plugin può chiamare, dato che le connessioni in uscita sono negate per impostazione predefinita.',
  'help.ctx.admin-storage.title': 'Archiviazione',
  'help.ctx.admin-storage.summary':
    'Dove vivono i caricamenti: il disco locale, un bucket S3, o un mirror che scrive su entrambi. Ogni categoria di caricamento può andare su un backend diverso, e Stato dice se ogni backend risponde.',
  'help.ctx.admin-storage.bullet.1':
    'Backend: nome e tipo di ciascuno, con Testa, Modifica e Rimuovi; uno impostato dall’ambiente qui è in sola lettura.',
  'help.ctx.admin-storage.bullet.2':
    'Categorie: copertine, documenti, foto del diario e il resto, ognuna assegnata a un backend; cambiarne una propone di spostare i file esistenti.',
  'help.ctx.admin-storage.bullet.3':
    'Stato: un controllo per backend, e il file seme che prova che la configurazione è quella che il server vede.',
  'help.ctx.admin-notifications.title': 'Notifiche',
  'help.ctx.admin-notifications.summary':
    'I canali che l’istanza offre ai suoi utenti, e quelli che raggiungono te come admin. Gli utenti scelgono i propri topic e URL sotto Impostazioni; tu decidi cosa esiste e configuri l’email.',
  'help.ctx.admin-notifications.bullet.1':
    'In-App, Email (SMTP), Ntfy, Webhook e Web Push: un pannello ciascuno, con un interruttore che offre il canale agli utenti e la configurazione lato server di cui ha bisogno.',
  'help.ctx.admin-notifications.bullet.2':
    'Promemoria viaggio: se il server invia il promemoria prima che un viaggio inizi.',
  'help.ctx.admin-notifications.bullet.3':
    'Ntfy admin e Webhook admin: dove vanno gli eventi admin come un backup fallito o una nuova release, con Testa.',
  'help.ctx.admin-mcp-tokens.title': 'Accesso MCP',
  'help.ctx.admin-mcp-tokens.summary':
    'Ogni token e sessione OAuth che i client IA detengono verso questo TREK, per tutti gli utenti, con il potere di revocarne qualsiasi.',
  'help.ctx.admin-mcp-tokens.bullet.1': 'Token API: chi l’ha creato, quando è stato usato l’ultima volta, ed Elimina.',
  'help.ctx.admin-mcp-tokens.bullet.2': 'Sessioni OAuth: il client, l’utente e gli scope concessi, e Revoca.',
  'help.ctx.admin-github.title': 'GitHub',
  'help.ctx.admin-github.summary':
    'Cosa c’è di nuovo in TREK: la cronologia dei rilasci da GitHub, la versione che usi, e se ne è uscita una più recente. L’aggiornamento vero e proprio avviene fuori dall’app, sull’host.',
  'help.ctx.admin-github.bullet.1':
    'Cronologia rilasci elenca le release con le loro note; la più recente porta Ultimo, e la tua versione è contrassegnata.',
  'help.ctx.admin-github.bullet.2':
    'Aggiornamento disponibile compare nell’intestazione appena esiste una release più recente, con le istruzioni per aggiornare Docker e le altre installazioni.',
  'help.ctx.admin-backup.title': 'Backup',
  'help.ctx.admin-backup.summary':
    'Backup completi del database e dei caricamenti, fatti a mano o pianificati, conservati sul server e scaricabili come un unico file. Ripristina ne rimette uno al suo posto.',
  'help.ctx.admin-backup.bullet.1':
    'Backup dati: Crea backup, e la lista di quelli esistenti con Scarica, Ripristina ed elimina.',
  'help.ctx.admin-backup.bullet.2': 'Carica backup porta un file fatto su un’altra istanza o in un giorno precedente.',
  'help.ctx.admin-backup.bullet.3': 'Auto-Backup: acceso o spento, intervallo, ora e giorno, e quanti conservarne.',
  'help.ctx.admin-audit.title': 'Audit',
  'help.ctx.admin-audit.summary':
    'Il registro degli eventi amministrativi e rilevanti per la sicurezza: accessi e fallimenti, modifiche MFA, modifiche a utenti e impostazioni, backup e ripristini. Sola lettura, il più recente per primo.',
  'help.ctx.admin-audit.bullet.1': 'Una riga per evento con ora, utente, azione, risorsa, IP e dettagli.',
  'help.ctx.admin-audit.bullet.2': 'Aggiorna ricarica; Carica altro va più indietro.',
  // create-user
  'help.guide.create-user.title': 'Creare un utente',
  'help.guide.create-user.goal': 'Aggiungi un account a mano, senza invito.',
  'help.guide.create-user.step.1': 'Clicca Crea Utente in cima alla scheda Utenti.',
  'help.guide.create-user.step.2':
    'Inserisci Nome utente, Email e una Password, e scegli il Ruolo: Utente o Amministratore.',
  'help.guide.create-user.step.3': 'Clicca Crea Utente.',
  'help.guide.create-user.result':
    'L’account compare nella tabella e può accedere subito; consegna la password su un canale di cui ti fidi.',
  'help.guide.create-user.tip.1':
    'Per una persona che deve scegliere la propria password, un link di invito è la via d’ingresso migliore.',
  'help.guide.create-user.tip.2':
    'Gli admin vedono questa pagina e il registro di audit; tutto il resto è uguale per entrambi i ruoli.',
  // edit-user
  'help.guide.edit-user.title': 'Cambiare ruolo o password di un utente',
  'help.guide.edit-user.goal': 'Promuovi qualcuno, retrocedilo, o fallo rientrare dopo una password persa.',
  'help.guide.edit-user.step.1':
    'Clicca la matita nella riga dell’utente. Modifica Utente si apre con i dettagli dell’account.',
  'help.guide.edit-user.step.2':
    'Cambia il Ruolo, imposta una Nuova Password, o clicca Reimposta passkey quando la persona ha perso il dispositivo su cui stavano le sue passkey, poi Salva.',
  'help.guide.edit-user.result':
    'La modifica vale dalla richiesta successiva; una nuova password funziona dal prossimo accesso.',
  'help.guide.edit-user.tip.1': 'Non puoi toglierti il ruolo admin finché sei l’ultimo admin.',
  'help.guide.edit-user.tip.2':
    'Reimpostare le passkey mantiene la password; la persona aggiunge nuove passkey sotto Impostazioni, Account.',
  // invite-links
  'help.guide.invite-links.title': 'Invitare qualcuno con un link',
  'help.guide.invite-links.goal':
    'Lascia che una persona si registri su un’istanza chiusa e, se vuoi, atterri in un viaggio.',
  'help.guide.invite-links.step.1': 'Sotto Link di Invito, clicca Crea Link.',
  'help.guide.invite-links.step.2':
    'Imposta Usi Max. e Scade tra, facoltativamente Aggiungi a un viaggio (opzionale), e clicca Crea & Copia.',
  'help.guide.invite-links.step.3':
    'Invia il link. Ogni riga mostra quante volte è stato usato e chi l’ha creato; Copia link lo copia di nuovo, e i link esauriti o scaduti sono contrassegnati.',
  'help.guide.invite-links.result':
    'Chi apre il link si registra con la propria password e, se è stato scelto un viaggio, vi si unisce subito.',
  'help.guide.invite-links.tip.1':
    'I link di invito funzionano anche quando Password Registration è spento sotto Impostazioni.',
  'help.guide.invite-links.tip.2':
    'Un link con un solo uso e una scadenza breve è l’impostazione più sicura per una singola persona.',
  // delete-user
  'help.guide.delete-user.title': 'Eliminare un utente',
  'help.guide.delete-user.goal': 'Rimuovi un account e tutto ciò che appartiene solo a lui.',
  'help.guide.delete-user.step.1': 'Clicca l’icona del cestino nella riga dell’utente e conferma Elimina utente.',
  'help.guide.delete-user.result':
    'L’account, i suoi viaggi e i suoi diari spariscono; i viaggi condivisi con altri restano ai membri rimasti.',
  'help.guide.delete-user.tip.1': 'Non si può annullare. Fai prima un backup se non sei sicuro.',
  'help.guide.delete-user.tip.2': 'L’ultimo admin non può essere eliminato; rendi prima admin qualcun altro.',
  // permissions
  'help.guide.permissions.title': 'Decidere chi può fare cosa',
  'help.guide.permissions.goal': 'Imposta, per ogni azione, quale ruolo può eseguirla su questo TREK.',
  'help.guide.permissions.step.1':
    'Sotto Impostazioni dei permessi, trova l’azione nel suo gruppo, per esempio Eliminare viaggi sotto Gestione viaggi, e scegli il livello: Tutti, Membri del viaggio, Proprietario del viaggio o Solo amministratore. Una riga modificata è contrassegnata come personalizzato.',
  'help.guide.permissions.step.2': 'Clicca Salva. Ripristina predefiniti riporta ogni riga al livello integrato.',
  'help.guide.permissions.result':
    'La regola vale per tutti i viaggi in una volta; i pulsanti e i menu delle persone sotto il livello spariscono.',
  'help.guide.permissions.tip.1':
    'Proprietario del viaggio è la persona che ha creato il viaggio; gli admin possono sempre fare tutto.',
  'help.guide.permissions.tip.2':
    'Abbassa un livello invece di eliminare un membro: un membro che non può modificare può comunque leggere e commentare.',
  // default-map
  'help.guide.default-map.title': 'Impostare la mappa predefinita per i nuovi utenti',
  'help.guide.default-map.goal': 'Dai a ogni nuovo account una mappa funzionante senza un token personale.',
  'help.guide.default-map.step.1':
    'Sotto Mappa, scegli il Motore mappe e, per Mapbox o MapLibre, lo Stile mappa, il Token Mapbox condiviso e la Modalità alta qualità; per una mappa raster il Modello Mappa e la Chiave CARTO condivisa.',
  'help.guide.default-map.step.2':
    'Accanto a ogni campo che hai cambiato, ripristina riporta la scelta di TREK. Impostazioni predefinite utente a sinistra fa lo stesso per Modalità Colore, unità e valuta.',
  'help.guide.default-map.result':
    'I nuovi account partono con queste; chi ha impostato la propria mappa sotto Impostazioni tiene la sua.',
  'help.guide.default-map.tip.1':
    'Un token inserito qui è condiviso da tutti quelli che non ne hanno uno proprio, quindi tieni d’occhio la sua quota.',
  'help.guide.default-map.tip.2':
    'Anche gli account esistenti che non hanno mai toccato la scheda della mappa seguono queste impostazioni.',
  // packing-templates
  'help.guide.packing-templates.title': 'Costruire un modello lista valigia',
  'help.guide.packing-templates.goal': 'Dai ai viaggi una lista valigia da cui partire invece di una vuota.',
  'help.guide.packing-templates.step.1': 'Clicca Nuovo modello, digita un nome e conferma con la spunta.',
  'help.guide.packing-templates.step.2':
    'Apri il modello e clicca Aggiungi categoria; sotto ogni categoria, il + aggiunge oggetti, e a un oggetto basta un nome.',
  'help.guide.packing-templates.step.3':
    'Tutto si salva man mano. La matita rinomina un modello, una categoria o un oggetto, il cestino lo elimina.',
  'help.guide.packing-templates.result':
    'Il modello viene offerto sulla lista valigia di ogni viaggio; applicarlo copia gli oggetti, così un viaggio può cambiarli liberamente.',
  'help.guide.packing-templates.tip.1':
    'Un modello per tipo di viaggio, mare, città, trekking, batte un’unica lista gigante.',
  'help.guide.packing-templates.tip.2': 'Eliminare un modello non tocca i viaggi che l’hanno già applicato.',
  // categories
  'help.guide.categories.title': 'Gestire l’insieme delle categorie',
  'help.guide.categories.goal': 'Decidi quali categorie possono portare luoghi e raccolte, e che aspetto hanno.',
  'help.guide.categories.step.1':
    'Clicca Nuova categoria, dalle un nome, scegli un’icona e un colore; l’Anteprima mostra il risultato. Clicca Crea.',
  'help.guide.categories.step.2':
    'Passa sopra una categoria nella lista per modificarla o eliminarla. L’eliminazione chiede conferma.',
  'help.guide.categories.result':
    'L’insieme vale ovunque in una volta: l’ispettore dei luoghi, i pin sulla mappa, Raccolte e i filtri.',
  'help.guide.categories.tip.1':
    'I luoghi mantengono l’id della categoria, quindi rinominare una categoria la rinomina su ogni luogo.',
  'help.guide.categories.tip.2':
    'Una categoria eliminata lascia i suoi luoghi senza categoria; riassegnali prima se conta.',
  // school-holiday-catalog
  'help.guide.school-holiday-catalog.title': 'Gestire le vacanze scolastiche a mano',
  'help.guide.school-holiday-catalog.goal':
    'Copri un paese o una regione che i feed integrati delle vacanze non coprono.',
  'help.guide.school-holiday-catalog.step.1':
    'Sotto Vacanze scolastiche, clicca Aggiungi paese, inserisci il Paese e il suo Codice paese (es. US), e Salva; poi Aggiungi regione per ogni sua parte che differisce.',
  'help.guide.school-holiday-catalog.step.2':
    'Clicca una regione per aprire Regione o distretto scolastico: Aggiungi periodo, dai a ognuno un Nome delle vacanze, una Data di inizio e una Data di fine, e Salva. Il cestino rimuove un periodo, una regione o, quando non ha più regioni, un paese.',
  'help.guide.school-holiday-catalog.result':
    'Gli utenti trovano paese e regione sotto Impostazioni in Vacay e vedono i periodi sulla loro griglia annuale.',
  'help.guide.school-holiday-catalog.tip.1':
    'Le regioni dei feed integrati non si possono modificare qui; aggiungi accanto una regione manuale se una data è sbagliata.',
  // auth-methods
  'help.guide.auth-methods.title': 'Decidere come accedono le persone',
  'help.guide.auth-methods.goal': 'Apri o chiudi l’accesso con password, l’SSO e la registrazione, e richiedi la 2FA.',
  'help.guide.auth-methods.step.1':
    'Sotto Authentication Methods, accendi o spegni Password Login e Password Registration. Registrazione spenta significa nuovi account solo tramite link di invito, SSO o a mano.',
  'help.guide.auth-methods.step.2':
    'SSO Login e SSO Auto-Provisioning richiedono un Single Sign-On (OIDC) configurato più in basso; l’auto-provisioning crea un account la prima volta che qualcuno accede tramite SSO.',
  'help.guide.auth-methods.step.3':
    'Richiedi autenticazione a due fattori (2FA) fa configurare un’app di autenticazione a ogni accesso con password al login successivo. Accesso con passkey richiede il Relying Party ID e le origini da cui il tuo TREK è raggiunto.',
  'help.guide.auth-methods.result': 'La pagina di accesso offre esattamente i metodi che hai lasciato accesi.',
  'help.guide.auth-methods.tip.1':
    'Un avviso compare prima che ti chiudi fuori: almeno una via d’ingresso per gli admin resta accesa.',
  'help.guide.auth-methods.tip.2': 'I valori impostati tramite variabili d’ambiente compaiono qui in sola lettura.',
  // oidc
  'help.guide.oidc.title': 'Collegare il single sign-on',
  'help.guide.oidc.goal': 'Lascia che le persone accedano con il tuo identity provider.',
  'help.guide.oidc.step.1':
    'Sotto Single Sign-On (OIDC), inserisci il Nome Visualizzato per il pulsante e l’URL Emittente, il Client ID e il Client Secret del tuo provider, poi Salva.',
  'help.guide.oidc.step.2': 'Accendi SSO Login sotto Authentication Methods.',
  'help.guide.oidc.result':
    'La pagina di accesso mostra il pulsante SSO; con SSO Auto-Provisioning acceso, chi entra per la prima volta riceve un account in automatico.',
  'help.guide.oidc.tip.1':
    'L’URI di redirect di cui il tuo provider ha bisogno è l’indirizzo del tuo TREK più il percorso di callback OIDC indicato nella documentazione.',
  'help.guide.oidc.tip.2':
    'Il mapping dei claim decide quali gruppi SSO diventano admin; vedi la pagina OIDC nella documentazione.',
  // instance-keys
  'help.guide.instance-keys.title': 'Inserire le chiavi API',
  'help.guide.instance-keys.goal':
    'Sblocca la ricerca di luoghi Google, le copertine Unsplash e Amap per tutta l’istanza.',
  'help.guide.instance-keys.step.1':
    'Sotto Chiavi API, incolla la Chiave API Google Maps e clicca Testa; il campo dice se la chiave risponde.',
  'help.guide.instance-keys.step.2':
    'Sotto A cosa serve la chiave, accendi solo le funzioni che vuoi far addebitare a quella chiave: completamento automatico, dettagli, foto, arricchimento, il registro delle ricerche.',
  'help.guide.instance-keys.step.3':
    'Chiave API Unsplash alimenta la ricerca delle copertine; Chiave API Amap (高德地图) la ricerca di luoghi in Cina. Testa ognuna allo stesso modo.',
  'help.guide.instance-keys.result':
    'Gli utenti ottengono le funzioni senza chiavi proprie; senza una chiave Google, TREK cerca tramite lo stack gratuito OpenStreetMap e la TREK Places API.',
  'help.guide.instance-keys.tip.1':
    'La chiave personale di un utente sotto Impostazioni vince sulla chiave dell’istanza per quell’utente.',
  'help.guide.instance-keys.tip.2':
    'Le chiavi possono arrivare anche da variabili d’ambiente; quelle compaiono qui in sola lettura.',
  // places-transit
  'help.guide.places-transit.title': 'Scegliere i provider di ricerca e trasporto',
  'help.guide.places-transit.goal': 'Decidi chi risponde alle ricerche di luoghi e ai percorsi con i mezzi pubblici.',
  'help.guide.places-transit.step.1':
    'Sotto Provider per la ricerca di luoghi, scegli Automatico, Google Places, Amap (高德地图) o OpenStreetMap. Automatico usa la migliore chiave disponibile.',
  'help.guide.places-transit.step.2':
    'Sotto Provider del trasporto pubblico, scegli Transitous (gratuito), mondiale e senza chiave, o Google, che richiede la chiave Google.',
  'help.guide.places-transit.result': 'Ogni casella di ricerca e ogni percorso con i mezzi in TREK segue la scelta.',
  'help.guide.places-transit.tip.1': 'Un provider senza la sua chiave mostra qui un avviso e ripiega su OpenStreetMap.',
  'help.guide.places-transit.tip.2': 'I percorsi con i mezzi di Google si pagano per richiesta; Transitous no.',
  // file-types
  'help.guide.file-types.title': 'Limitare i tipi di file',
  'help.guide.file-types.goal': 'Decidi quali estensioni di file possono avere i caricamenti.',
  'help.guide.file-types.step.1':
    'Sotto Tipi di File Consentiti, modifica la lista di estensioni separate da virgola e salva.',
  'help.guide.file-types.result':
    'I caricamenti di qualsiasi altro tipo vengono rifiutati con un messaggio chiaro, nei documenti, nel diario e nelle copertine.',
  'help.guide.file-types.tip.1':
    'Tieni i tipi immagine nella lista; copertine e foto del diario passano dallo stesso controllo.',
  // toggle-addon
  'help.guide.toggle-addon.title': 'Accendere o spegnere un modulo',
  'help.guide.toggle-addon.goal': 'Offri un modulo funzionale a tutti, o toglilo.',
  'help.guide.toggle-addon.step.1':
    'Sposta l’interruttore sul riquadro del modulo. La voce di navigazione compare o sparisce per tutti in una volta.',
  'help.guide.toggle-addon.step.2':
    'Alcuni riquadri portano sotto-righe per le loro opzioni, come Tracciamento valigia sotto Liste o i provider di foto sotto Diario di viaggio; compaiono solo finché il modulo è acceso.',
  'help.guide.toggle-addon.result': 'I dati di un modulo spento vengono conservati; riaccenderlo li mostra di nuovo.',
  'help.guide.toggle-addon.tip.1': 'MCP spento rimuove l’endpoint e le sezioni Integrazioni che ne dipendono.',
  'help.guide.toggle-addon.tip.2':
    'Vacay, Atlas e Diario di viaggio sono i moduli che gli utenti chiedono di più; Documenti richiede spazio di archiviazione per i caricamenti.',
  // install-plugin
  'help.guide.install-plugin.title': 'Installare un plugin',
  'help.guide.install-plugin.goal': 'Aggiungi un plugin di terze parti e dagli esattamente i permessi che chiede.',
  'help.guide.install-plugin.step.1':
    'Apri Scopri, scegli un plugin e clicca Installa; oppure clicca Carica plugin e scegli un pacchetto .zip o .tar.gz.',
  'help.guide.install-plugin.step.2':
    'Tornato sotto Installato, leggi la riga: cosa può leggere o scrivere il plugin, gli host che chiama e se è firmato. Accendi Abilita plugin.',
  'help.guide.install-plugin.step.3':
    'Il menu della riga offre Riavvia, Visualizza log errori, Host consentiti e Cambia versione…; Elimina lo disinstalla. Un aggiornamento viene offerto sulla riga quando esiste una versione più recente, e uno che chiede nuovi diritti resta spento finché non li approvi.',
  'help.guide.install-plugin.result':
    'Il plugin gira in un processo proprio; ciò che aggiunge, widget, livelli mappa, strumenti, compare dove il plugin lo dichiara.',
  'help.guide.install-plugin.tip.1':
    'Riscansiona rileva una cartella plugin collegata per lo sviluppo senza pacchetto.',
  'help.guide.install-plugin.tip.2':
    'Un plugin non firmato è contrassegnato come tale; installalo solo se ti fidi della sua fonte.',
  // storage-backends
  'help.guide.storage-backends.title': 'Spostare i caricamenti su S3 o un mirror',
  'help.guide.storage-backends.goal': 'Tieni i file su uno storage a oggetti, o sia su disco che su bucket.',
  'help.guide.storage-backends.step.1':
    'Sotto Backend, clicca Aggiungi backend, dagli un Nome, scegli il Tipo, Locale, S3 o Mirror, compila i campi e Applica. Testa verifica la connessione, Salva modifiche la scrive.',
  'help.guide.storage-backends.step.2':
    'Sotto Categorie, assegna ogni categoria di caricamento a un backend. Cambiarne una chiede se Sposta oggetti esistenti o Instrada solo le nuove scritture.',
  'help.guide.storage-backends.step.3': 'Stato in alto controlla ogni backend; una voce rossa indica cosa è fallito.',
  'help.guide.storage-backends.result':
    'I nuovi caricamenti vanno sul backend assegnato; i file spostati vengono serviti da lì.',
  'help.guide.storage-backends.tip.1':
    'Un backend configurato tramite variabili d’ambiente viene mostrato ma non si può modificare qui.',
  'help.guide.storage-backends.tip.2':
    'Un mirror scrive su entrambe le destinazioni e legge dalla prima; usalo per migrare senza fermi.',
  // channels-instance
  'help.guide.channels-instance.title': 'Configurare i canali di notifica',
  'help.guide.channels-instance.goal': 'Decidi quali canali possono scegliere gli utenti, e configura l’email.',
  'help.guide.channels-instance.step.1':
    'Sotto Email (SMTP), inserisci SMTP Host, SMTP Port, SMTP User, SMTP Password e la From Address; Invia email di prova manda una mail a te.',
  'help.guide.channels-instance.step.2':
    'Accendi Web Push, Ntfy e Webhook per offrirli; gli utenti poi attivano il push per ogni dispositivo, oppure inseriscono il proprio topic o URL, sotto Impostazioni, Notifiche.',
  'help.guide.channels-instance.step.3':
    'Promemoria viaggio comanda il promemoria prima che un viaggio inizi; In-App è sempre acceso e qui viene solo spiegato.',
  'help.guide.channels-instance.result': 'La scheda Notifiche di ogni utente mostra i canali che hai acceso.',
  'help.guide.channels-instance.tip.1':
    'Un server ntfy predefinito inserito qui è precompilato per gli utenti; possono comunque indicare il proprio.',
  'help.guide.channels-instance.tip.2':
    'I canali dei plugin compaiono da soli appena è attivo un plugin con quella capacità.',
  // admin-channels
  'help.guide.admin-channels.title': 'Ricevere gli eventi admin sul telefono',
  'help.guide.admin-channels.goal': 'Vieni a sapere di backup falliti, nuove release e altri eventi dell’istanza.',
  'help.guide.admin-channels.step.1':
    'Sotto Ntfy admin, inserisci un topic e, se serve, server e token; sotto Webhook admin un URL.',
  'help.guide.admin-channels.step.2':
    'Clicca Invia Ntfy di test o Invia webhook di test per vedere arrivare un messaggio.',
  'help.guide.admin-channels.result': 'Gli eventi admin vanno lì oltre che alla campanella in-app di ogni admin.',
  'help.guide.admin-channels.tip.1':
    'Tieni il topic admin separato da quello personale, così un guasto non affoga nel chiacchiericcio dei viaggi.',
  // mcp-tokens-admin
  'help.guide.mcp-tokens-admin.title': 'Revocare l’accesso delle IA',
  'help.guide.mcp-tokens-admin.goal':
    'Vedi e taglia ogni token e sessione che un client IA detiene, per qualsiasi utente.',
  'help.guide.mcp-tokens-admin.step.1':
    'Sotto Token API, trova il token per utente e nome; il cestino lo elimina e il client si ferma subito.',
  'help.guide.mcp-tokens-admin.step.2':
    'Sotto Sessioni OAuth, lo stesso per i client via browser: client, utente e data, e il cestino revoca la sessione.',
  'help.guide.mcp-tokens-admin.result': 'Il client deve essere ricollegato dal suo utente; nient’altro cambia.',
  'help.guide.mcp-tokens-admin.tip.1':
    'Gli scope ti dicono cosa poteva fare un client; uno scope di sola lettura è innocuo da lasciare.',
  'help.guide.mcp-tokens-admin.tip.2': 'Spegnere il modulo MCP revoca tutto in una volta.',
  // release-history
  'help.guide.release-history.title': 'Controllare se c’è una nuova release',
  'help.guide.release-history.goal': 'Sappi se il tuo TREK è aggiornato e cosa porta la prossima versione.',
  'help.guide.release-history.step.1':
    'Quando esiste una release più recente, Aggiornamento disponibile compare in cima alla pagina admin; Vedi su GitHub la apre, e Come aggiornare spiega l’aggiornamento per Docker e per le altre installazioni.',
  'help.guide.release-history.step.2':
    'Cronologia rilasci elenca ogni release con le sue note; Mostra dettagli le espande, la più recente porta Ultimo, e Carica altro va più indietro.',
  'help.guide.release-history.result':
    'L’aggiornamento avviene sull’host, scaricando la nuova immagine o compilando il nuovo tag; la directory dei dati resta.',
  'help.guide.release-history.tip.1': 'Fai un backup prima di un aggiornamento; la scheda Backup è accanto.',
  'help.guide.release-history.tip.2':
    'Le pre-release vengono mostrate ma non annunciate come aggiornamenti, a meno che tu non ne usi una.',
  // create-backup
  'help.guide.create-backup.title': 'Fare e ripristinare un backup',
  'help.guide.create-backup.goal':
    'Fotografa l’intera istanza, tieni una copia altrove, e sii in grado di rimetterla al suo posto.',
  'help.guide.create-backup.step.1':
    'Sotto Backup dati, clicca Crea backup. Impacchetta il database e i caricamenti in un unico file sul server.',
  'help.guide.create-backup.step.2':
    'Scarica tiene una copia fuori dalla macchina; il cestino elimina quelli vecchi per liberare spazio.',
  'help.guide.create-backup.step.3':
    'Ripristina su un backup, o Carica backup con un file, sostituisce i dati attuali dopo che Ripristinare il backup? ha chiesto una volta.',
  'help.guide.create-backup.result':
    'Un ripristino riporta utenti, viaggi, file e impostazioni allo stato di quel backup; tutti vengono disconnessi.',
  'help.guide.create-backup.tip.1':
    'Il ripristino è l’unica azione qui che non si può annullare. Fai prima un backup fresco.',
  'help.guide.create-backup.tip.2':
    'I backup vivono nella directory dei dati; è una copia su un’altra macchina a renderli un vero backup.',
  // auto-backup
  'help.guide.auto-backup.title': 'Pianificare i backup',
  'help.guide.auto-backup.goal': 'Lascia che il server si salvi da solo e tenga solo gli ultimi.',
  'help.guide.auto-backup.step.1':
    "Sotto Auto-Backup, accendi Abilita auto-backup e scegli l’Intervallo, Esegui all'ora e, per settimanale o mensile, il Giorno della settimana o il Giorno del mese.",
  'help.guide.auto-backup.step.2':
    'Elimina i vecchi backup dopo imposta per quanto tempo un backup viene conservato; quelli più vecchi se ne vanno quando ne viene fatto uno nuovo.',
  'help.guide.auto-backup.result':
    'I backup compaiono nella lista secondo il piano; un fallimento raggiunge i canali admin.',
  'help.guide.auto-backup.tip.1': 'Gli orari seguono il fuso orario del server, mostrato nella scheda Audit.',
  'help.guide.auto-backup.tip.2': 'Lo spazio sul server è finito; tenerne da tre a cinque di solito basta.',
  // audit-log
  'help.guide.audit-log.title': 'Leggere il registro di audit',
  'help.guide.audit-log.goal': 'Scopri chi ha fatto cosa, e quando.',
  'help.guide.audit-log.step.1':
    'Leggi le righe: ora, utente, azione, risorsa, IP e dettagli, il più recente per primo. Le azioni prendono il nome da ciò che è successo, come un accesso fallito, una modifica MFA o un ripristino.',
  'help.guide.audit-log.step.2': 'Aggiorna ricarica la parte in alto; Carica altro va più indietro.',
  'help.guide.audit-log.result': 'Una traccia che puoi consegnare a chiunque chieda perché qualcosa è cambiato.',
  'help.guide.audit-log.tip.1': 'Gli orari sono mostrati nel fuso orario del server, indicato sopra la tabella.',
  'help.guide.audit-log.tip.2':
    'Il registro è in sola aggiunta; niente qui può essere modificato o eliminato dall’app.',
  // document-providers
  'help.guide.document-providers.title': 'Offrire un archivio di documenti',
  'help.guide.document-providers.goal': 'Decidi con quali archivi un viaggio può tenere allineati i suoi documenti.',
  'help.guide.document-providers.step.1':
    'Il riquadro Documenti porta gli archivi come sotto-righe: Paperless-ngx, Papra, Nextcloud, OpenCloud e Synology Drive. Tutti e cinque partono spenti, e le righe ci sono solo finché Documenti stesso è acceso.',
  'help.guide.document-providers.step.2':
    'Sposta l’interruttore sulla riga Nextcloud. Il messaggio dice Modulo aggiornato, e da ora in poi i proprietari dei viaggi trovano Sincronizzazione documenti nella scheda File dei loro viaggi, con Nextcloud sotto Collega un provider.',
  'help.guide.document-providers.result':
    'L’archivio è offerto su ogni viaggio di questo TREK; nulla è collegato finché un proprietario di viaggio non lo fa.',
  'help.guide.document-providers.tip.1':
    'Qui si decide solo se un archivio può essere offerto. L’indirizzo e le credenziali appartengono a un viaggio e vengono inseriti nella sua scheda File dal proprietario del viaggio, mai nel pannello di amministrazione.',
  'help.guide.document-providers.tip.2':
    'Spegnere Documenti spegne con sé ogni archivio, e un archivio non si può accendere finché Documenti è spento: il server risponde Enable the Documents addon first. Un archivio sulla tua rete ha bisogno anche di ALLOW_INTERNAL_NETWORK=true sul server.',

  // ── Screen: trip ──────────────────────────────────────────────────────────────────────
  'help.ctx.trip.title': 'Viaggio',
  'help.ctx.trip.summary':
    'Un viaggio, tutto intero: il programma con i suoi giorni, la mappa e i luoghi, e le schede per trasporti, prenotazioni, liste, costi, file e collaborazione. Ognuna di queste ha la sua schermata di aiuto sotto questa.',
  'help.ctx.trip.bullet.1':
    'La barra delle schede: Programma, Trasporti, Prenotazioni, Liste, Costi, File e Collaborazione. Addon e plugin decidono quali schede esistono sul tuo TREK.',
  'help.ctx.trip.bullet.2':
    'Programma è tre colonne: i giorni a sinistra, la mappa al centro, i luoghi a destra. Prenotazioni e trasporti vivono dentro il programma, alla tappa e tra le tappe; le schede li elencano.',
  'help.ctx.trip.bullet.3':
    'Condividi in alto a destra apre le persone del viaggio: membri, ospiti, il link di invito e il link pubblico in sola lettura.',
  'help.ctx.trip.bullet.4':
    'Titolo, date, copertina e valuta si modificano da I miei viaggi, con la matita sulla scheda del viaggio.',
  'help.ctx.trip.bullet.5':
    'I chevron sul bordo interno di una colonna la ripiegano e la mappa prende lo spazio; il divisore sottile accanto a una colonna ne cambia la larghezza.',
  'help.ctx.trip.bullet.6':
    'La freccia di annullamento nella barra degli strumenti dei giorni ritira l’ultima modifica al programma.',
  // add-member
  'help.guide.add-member.title': 'Aggiungere un membro',
  'help.guide.add-member.goal': 'Dai a qualcuno con un account TREK l’accesso a questo viaggio.',
  'help.guide.add-member.step.1': 'Clicca Condividi in alto a destra.',
  'help.guide.add-member.step.2': 'Sotto Invita utente, scegli la persona dalla lista e clicca Invita.',
  'help.guide.add-member.step.3':
    'La persona compare ora sotto Accesso. La corona segna il proprietario; l’icona in fondo a una riga rimuove di nuovo l’accesso.',
  'help.guide.add-member.result':
    'Il membro vede e modifica il viaggio come te, entro i livelli che l’admin ha impostato sotto Impostazioni dei permessi.',
  'help.guide.add-member.tip.1':
    'Chi manca dalla lista non ha ancora un account TREK: aggiungilo come ospite, o lascia che si registri tramite un link di invito.',
  'help.guide.add-member.tip.2':
    'Il numero accanto ad Accesso conta le persone nel viaggio; gli ospiti sono elencati a parte, sotto.',
  // trip-invite-link
  'help.guide.trip-invite-link.title': 'Invitare tramite link',
  'help.guide.trip-invite-link.goal': 'Lascia che le persone entrino nel viaggio da sole.',
  'help.guide.trip-invite-link.step.1':
    'Clicca Condividi, poi sotto Link di invito al viaggio clicca Crea link di invito.',
  'help.guide.trip-invite-link.step.2':
    'Clicca Copia e invia il link. Chiunque abbia un account TREK e lo apra entra come membro.',
  'help.guide.trip-invite-link.step.3': 'Rigenera sostituisce il link e rende inutile il vecchio; Disattiva lo spegne.',
  'help.guide.trip-invite-link.result': 'Chi apre il link è nel viaggio e compare sotto Accesso.',
  'help.guide.trip-invite-link.tip.1':
    'Chi non ha un account non può usarlo. Un admin distribuisce link di registrazione sotto Amministrazione, Utenti, e può legarne uno a questo viaggio.',
  'help.guide.trip-invite-link.tip.2':
    'Rigenera quando un link è finito nella chat sbagliata: il vecchio smette subito di funzionare.',
  // add-guest
  'help.guide.add-guest.title': 'Aggiungere un ospite senza account',
  'help.guide.add-guest.goal': 'Conta qualcuno che non usa TREK.',
  'help.guide.add-guest.step.1': 'Clicca Condividi e scorri fino a Ospiti.',
  'help.guide.add-guest.step.2': 'Digita il nome in Nome ospite e clicca Aggiungi ospite.',
  'help.guide.add-guest.result':
    'L’ospite può essere assegnato a costi, oggetti della valigia e attività, ma non può accedere.',
  'help.guide.add-guest.tip.1':
    'La matita rinomina un ospite; l’icona in fondo alla riga lo rimuove insieme alle sue quote e assegnazioni.',
  'help.guide.add-guest.tip.2': 'Se la persona ottiene un account più tardi, invitala come membro e rimuovi l’ospite.',
  // public-link
  'help.guide.public-link.title': 'Pubblicare un link in sola lettura',
  'help.guide.public-link.goal': 'Mostra il viaggio a persone che non devono modificarlo.',
  'help.guide.public-link.step.1':
    'Clicca Condividi; a destra, sotto Link pubblico, spunta ciò che il link può mostrare. Mappa e programma è sempre attivo; Prenotazioni, Valigia, Costi e Chat li scegli tu.',
  'help.guide.public-link.step.2': 'Clicca Crea link, poi Copia.',
  'help.guide.public-link.step.3': 'Le spunte si possono cambiare finché il link esiste; Elimina link lo ferma.',
  'help.guide.public-link.result':
    'Chiunque abbia il link vede le parti scelte senza accedere e non può cambiare nulla.',
  'help.guide.public-link.tip.1':
    'Il link non è elencato da nessuna parte; chi lo ha può aprirlo, quindi trattalo come una password.',
  'help.guide.public-link.tip.2': 'Per i diritti di modifica, aggiungi invece la persona come membro.',
  // transfer-ownership
  'help.guide.transfer-ownership.title': 'Cedere il viaggio o abbandonarlo',
  'help.guide.transfer-ownership.goal': 'Rendi proprietario qualcun altro, o esci da un viaggio che non è tuo.',
  'help.guide.transfer-ownership.step.1':
    'Clicca Condividi. Sotto Accesso, la corona sulla riga di un membro rende quella persona il proprietario; conferma la domanda.',
  'help.guide.transfer-ownership.step.2':
    'Abbandona viaggio sulla tua riga ti toglie dal viaggio; come proprietario, cedilo prima.',
  'help.guide.transfer-ownership.result':
    'Il nuovo proprietario gestisce i membri e può eliminare il viaggio; tu resti un membro normale.',
  'help.guide.transfer-ownership.tip.1':
    'Il proprietario è chi ha creato il viaggio, finché non viene ceduto; eliminare il viaggio spetta solo a lui.',
  'help.guide.transfer-ownership.tip.2':
    'Rimuovi accesso su un’altra riga è lo stesso pulsante al contrario: il proprietario toglie un membro.',
  // collapse-columns
  'help.guide.collapse-columns.title': 'Fare spazio alla mappa',
  'help.guide.collapse-columns.goal': 'Ripiega una colonna o dalle più larghezza.',
  'help.guide.collapse-columns.step.1':
    'Clicca il chevron sul bordo interno della colonna dei giorni per ripiegarla; la mappa prende lo spazio. La colonna dei luoghi ha lo stesso chevron.',
  'help.guide.collapse-columns.step.2': 'Clicca di nuovo il chevron per riportare la colonna.',
  'help.guide.collapse-columns.step.3':
    'Trascina il divisore sottile tra una colonna e la mappa per cambiare la larghezza della colonna.',
  'help.guide.collapse-columns.result':
    'Le larghezze vengono ricordate; le colonne tornano aperte alla prossima visita.',
  'help.guide.collapse-columns.tip.1': 'Entrambe le colonne si possono ripiegare insieme per una vista di sola mappa.',
  'help.guide.collapse-columns.tip.2':
    'Su un telefono non ci sono colonne: Programma e Luoghi sono i due pulsanti in fondo alla mappa.',
  // undo-change
  'help.guide.undo-change.title': 'Annullare l’ultima modifica',
  'help.guide.undo-change.goal': 'Ritira ciò che hai appena fatto al programma.',
  'help.guide.undo-change.step.1':
    'Clicca la freccia di annullamento nella barra degli strumenti sopra i giorni; il suo tooltip nomina la modifica che ritirerà.',
  'help.guide.undo-change.result':
    'Il programma è tornato com’era, e la freccia diventa grigia fino alla prossima modifica.',
  'help.guide.undo-change.tip.1':
    'L’annullamento copre il programma: assegnare, rimuovere, riordinare e spostare luoghi, ottimizzare un percorso, eliminare luoghi, cambi di categoria e importazioni.',
  'help.guide.undo-change.tip.2':
    'È profondo un solo passo: solo l’ultima modifica può essere ritirata, e una nuova modifica la sostituisce.',

  // ── Screen: trip-places ───────────────────────────────────────────────────────────────
  'help.ctx.trip-places.title': 'Luoghi',
  'help.ctx.trip-places.summary':
    'La colonna di destra del programma: ogni luogo del viaggio, pianificato o no, con ricerca e filtri, e i modi per far entrare i luoghi, a mano, da un file o da una lista condivisa.',
  'help.ctx.trip-places.bullet.1':
    'Aggiungi Luogo/Attività in alto apre il modulo per un luogo che digiti o cerchi. Finché un giorno è aperto il pulsante dice Nuovo luogo, e Al giorno accanto crea il luogo direttamente su quel giorno.',
  'help.ctx.trip-places.bullet.2':
    'Importa file accetta file .gpx, .kml e .kmz; Importa lista accetta una lista condivisa di Google Maps o Naver Maps. Un file si può anche semplicemente lasciar cadere sulla colonna.',
  'help.ctx.trip-places.bullet.3':
    'Il menu a tendina passa tra Tutti, Non pianificati, Pianificati e, una volta importata una traccia, Tracce; sotto stanno la ricerca, il filtro di categoria e la stella per una valutazione minima.',
  'help.ctx.trip-places.bullet.4':
    'Una riga mostra immagine, nome e descrizione o indirizzo. Cliccala per i dettagli del luogo, trascinala su un giorno, oppure fai clic destro per Modifica, + Giorno, Apri sito web, Google Maps, Salva nella raccolta ed Elimina.',
  'help.ctx.trip-places.bullet.5':
    'Con un giorno aperto, un + in fondo a una riga non pianificata mette il luogo su quel giorno, e Pianificati elenca solo quel giorno, con Mostra tutto il viaggio per allargare di nuovo.',
  'help.ctx.trip-places.bullet.6':
    'La spunta all’estremità destra della riga dei filtri avvia una selezione: più righe insieme ricevono una nuova categoria, finiscono in una raccolta o vengono eliminate.',
  // create-place
  'help.guide.create-place.title': 'Creare un luogo',
  'help.guide.create-place.goal':
    'Aggiungi a mano un luogo o un’attività, con tutto ciò che il programma deve saperne.',
  'help.guide.create-place.step.1':
    'Clicca Aggiungi Luogo/Attività in cima alla colonna dei luoghi (Nuovo luogo finché un giorno è aperto). Il modulo si apre.',
  'help.guide.create-place.step.2':
    'Digita il luogo in Cerca luoghi... in alto e scegli un risultato. Nome, Indirizzo, Latitudine, Longitudine e Sito web si riempiono, e Dettagli del luogo a sinistra mostra immagini, gli orari di apertura e una descrizione. Su un TREK con chiave Google, Non è il posto giusto? Cerca su Google sta sotto la lista e rilancia la stessa ricerca tramite Google.',
  'help.guide.create-place.step.3':
    'In Dettagli del luogo, un clic su un’immagine sotto Scegli un’immagine la rende l’immagine del luogo; Usa questo testo porta la descrizione nel modulo.',
  'help.guide.create-place.step.4':
    'Controlla i campi: Nome è obbligatorio; Descrizione e Note sono tue; Indirizzo, Latitudine e Longitudine arrivano dalla ricerca o si digitano; Categoria sceglie una delle categorie del viaggio, e il + accanto ne crea una nuova sul momento; Sito web prende il link.',
  'help.guide.create-place.step.5':
    'Clicca Aggiungi. Se un luogo con lo stesso nome è già nel viaggio, il modulo lo dice e il pulsante diventa Aggiungi comunque.',
  'help.guide.create-place.result':
    'Il luogo è nella lista e sulla mappa, sotto Non pianificati finché non viene messo su un giorno.',
  'help.guide.create-place.tip.1':
    'File e Costi in fondo al modulo allegano un documento al luogo, o aprono l’editor dei Costi per la sua spesa subito dopo il salvataggio.',
  'help.guide.create-place.tip.2':
    'L’indice di TREK e OpenStreetMap rispondono alla ricerca su ogni TREK, e Dettagli del luogo si riempie da Wikipedia, Wikivoyage e Wikimedia. Google viene interrogato solo dove entrambi restano vuoti, e solo lui porta le valutazioni.',
  'help.guide.create-place.tip.3':
    'Un luogo può anche partire dalla mappa: fai clic destro sul punto, e il modulo si apre con coordinate e indirizzo già compilati.',
  // place-to-open-day
  'help.guide.place-to-open-day.title': 'Aggiungere un luogo direttamente al giorno aperto',
  'help.guide.place-to-open-day.goal': 'Salta il secondo passo: crea o scegli il luogo e mettilo subito sul giorno.',
  'help.guide.place-to-open-day.step.1':
    'Clicca l’intestazione di un giorno nella colonna dei giorni. Il giorno è aperto: la sua scheda è evidenziata, e la colonna dei luoghi guadagna il pulsante Al giorno.',
  'help.guide.place-to-open-day.step.2':
    'Al giorno apre lo stesso modulo di Nuovo luogo, solo che il luogo finisce sul giorno aperto nel momento in cui clicchi Aggiungi.',
  'help.guide.place-to-open-day.step.3':
    'Un luogo che esiste già va sul giorno aperto con il + in fondo alla sua riga, oppure con clic destro, + Giorno.',
  'help.guide.place-to-open-day.step.4':
    'Funziona anche al contrario, e senza aprire prima un giorno: trascina la riga del luogo fuori dalla colonna e lasciala su una scheda di giorno. Lasciata tra due tappe, finisce esattamente lì.',
  'help.guide.place-to-open-day.result':
    'Il luogo è elencato sotto il giorno, in fondo; trascinalo su o giù dove gli spetta.',
  'help.guide.place-to-open-day.tip.1':
    'Il giorno aperto guida anche la ricerca: con un giorno aperto, la mappa e la ricerca nei dintorni partono da dove quel giorno passa già.',
  'help.guide.place-to-open-day.tip.2': 'Annulla nella barra degli strumenti sopra i giorni ritira l’assegnazione.',
  // filter-places
  'help.guide.filter-places.title': 'Trovare un luogo nella lista',
  'help.guide.filter-places.goal': 'Restringi la colonna ai luoghi che cerchi.',
  'help.guide.filter-places.step.1':
    'Il menu a tendina in alto passa tra Tutti, Non pianificati (non ancora su un giorno), Pianificati (su un giorno) e Tracce (tracce GPX importate), ognuno con il suo conteggio.',
  'help.guide.filter-places.step.2': 'Digita in Cerca luoghi...; la lista si restringe mentre scrivi.',
  'help.guide.filter-places.step.3':
    'Tutte le categorie apre una lista in cui spuntare una o più categorie, Nessuna categoria compresa; Cancella filtro, in fondo, la azzera.',
  'help.guide.filter-places.step.4':
    'La stella accanto imposta una valutazione minima: 5+, 4+ e così via mostrano solo i luoghi che hai valutato almeno così in alto.',
  'help.guide.filter-places.result':
    'Il conteggio sopra le righe dice quanti luoghi corrispondono; i filtri si combinano.',
  'help.guide.filter-places.tip.1':
    'Con un giorno aperto, Pianificati elenca solo quel giorno e lo dice: Viene mostrato solo il giorno aperto, con Mostra tutto il viaggio accanto.',
  'help.guide.filter-places.tip.2':
    'Anche la mappa si restringe al giorno aperto; Tutti nella lista mostra comunque ogni luogo del viaggio.',
  // edit-place
  'help.guide.edit-place.title': 'Modificare un luogo',
  'help.guide.edit-place.goal': 'Correggi un nome, sposta il segnaposto, aggiungi un sito web o cambia la categoria.',
  'help.guide.edit-place.step.1':
    'Fai clic destro sulla riga e scegli Modifica, oppure apri il luogo e clicca Modifica nei suoi dettagli.',
  'help.guide.edit-place.step.2':
    'Cambia ciò che ti serve: Nome, Descrizione, Note, Indirizzo, Latitudine e Longitudine, Categoria, Sito web. Aperto da un giorno, il modulo ha anche Note per questo giorno e Inizio e Fine per quel giorno.',
  'help.guide.edit-place.step.3': 'Clicca Aggiorna.',
  'help.guide.edit-place.result':
    'La modifica vale ovunque il luogo compaia: nella lista, sulla mappa e in ogni giorno su cui sta.',
  'help.guide.edit-place.tip.1':
    'Note per questo giorno appartiene al luogo in quel solo giorno; Note appartiene al luogo stesso.',
  'help.guide.edit-place.tip.2':
    'Una Fine prima dell’Inizio blocca Aggiorna; Sovrapposizione di orario con: avverte solo che un’altra tappa del giorno ha la stessa ora.',
  // delete-place
  'help.guide.delete-place.title': 'Eliminare un luogo',
  'help.guide.delete-place.goal': 'Togli un luogo dal viaggio per sempre.',
  'help.guide.delete-place.step.1':
    'Fai clic destro sulla riga e scegli Elimina, oppure clicca Elimina nei dettagli del luogo.',
  'help.guide.delete-place.step.2':
    'Conferma. Se al luogo era prenotata una notte, o se una prenotazione è collegata ad esso, la domanda dice cosa se ne va insieme.',
  'help.guide.delete-place.result':
    'Il luogo è sparito dalla lista, dalla mappa e da ogni giorno; Annulla nella barra degli strumenti sopra i giorni lo riporta.',
  'help.guide.delete-place.tip.1':
    'Per togliere un luogo da un solo giorno, usa invece Rimuovi dal giorno su quella tappa.',
  'help.guide.delete-place.tip.2': 'Più luoghi insieme: la spunta accanto ai filtri avvia una selezione.',
  // select-places
  'help.guide.select-places.title': 'Modificare o eliminare più luoghi insieme',
  'help.guide.select-places.goal': 'Metti in ordine la lista in un colpo solo invece che luogo per luogo.',
  'help.guide.select-places.step.1':
    'Clicca la spunta all’estremità destra della riga dei filtri. Le righe ricevono caselle e compare una barra con le azioni.',
  'help.guide.select-places.step.2':
    'Spunta le righe, oppure Seleziona tutto nella barra; la barra conta ciò che è selezionato.',
  'help.guide.select-places.step.3':
    'Change category dà a tutti un’unica categoria; Salva nella raccolta li copia in una delle tue raccolte; Elimina selezionati li rimuove dopo una conferma.',
  'help.guide.select-places.step.4': 'Clicca di nuovo la spunta per uscire dalla selezione.',
  'help.guide.select-places.result':
    'La modifica vale per ogni luogo selezionato; un’eliminazione si può annullare dalla barra degli strumenti sopra i giorni.',
  'help.guide.select-places.tip.1':
    'I filtri continuano a funzionare mentre selezioni: filtra prima su Non pianificati, poi Seleziona tutto prende esattamente quelli.',
  'help.guide.select-places.tip.2':
    'Segna come visitato nelle tue liste compare nella barra quando l’addon Raccolte è attivo: spunta i luoghi nelle raccolte in cui sono salvati.',
  // import-places-file
  'help.guide.import-places-file.title': 'Importare luoghi da un file GPX, KML o KMZ',
  'help.guide.import-places-file.goal':
    'Porta dentro ciò che Google My Maps, Google Earth o un tracker GPS ha esportato.',
  'help.guide.import-places-file.step.1':
    'Clicca Importa file, oppure lascia cadere il file in un punto qualsiasi della colonna dei luoghi.',
  'help.guide.import-places-file.step.2':
    'Scegli il file o trascinalo nel riquadro. Per un GPX, spunta cosa importare: Waypoint, Percorsi, Tracce (con geometria percorso); per KML e KMZ, Punti (Placemarks) e Percorsi (LineStrings).',
  'help.guide.import-places-file.step.3':
    'Il riquadro accetta più file alla volta, e solo .gpx, .kml e .kmz. Un altro tipo di file, o uno oltre i 10 MB, viene rifiutato nella finestra e non importato.',
  'help.guide.import-places-file.step.4':
    'Clicca Importa. Un messaggio dice quanti luoghi sono entrati; con un file KML o KMZ la finestra resta aperta con un riepilogo di ciò che è stato creato e di ciò che è stato saltato.',
  'help.guide.import-places-file.result':
    'I luoghi sono nella lista; una traccia porta un segno di percorso sulla sua riga, si disegna sulla mappa e ottiene il proprio filtro Tracce.',
  'help.guide.import-places-file.tip.1':
    'Un file troppo grande viene rifiutato con il limite di dimensione; esportalo di nuovo senza foto, oppure dividilo.',
  'help.guide.import-places-file.tip.2':
    'L’importazione si può annullare per intero dalla barra degli strumenti sopra i giorni.',
  // import-places-list
  'help.guide.import-places-list.title': 'Importare una lista condivisa di Google Maps o Naver Maps',
  'help.guide.import-places-list.goal': 'Trasforma il link di una lista condivisa in luoghi.',
  'help.guide.import-places-list.step.1': 'Clicca Importa lista e scegli Lista Google o Lista Naver.',
  'help.guide.import-places-list.step.2':
    'Incolla il link condiviso della lista. Va bene anche un link di indicazioni di Google Maps: le sue tappe diventano luoghi, nell’ordine di percorrenza.',
  'help.guide.import-places-list.step.3': 'Clicca Importa.',
  'help.guide.import-places-list.result':
    'Ogni luogo della lista è nel viaggio, con il nome che ha nella lista; i luoghi già nel viaggio vengono saltati.',
  'help.guide.import-places-list.tip.1':
    'La lista deve essere condivisa pubblicamente; il link di una lista privata non importa nulla.',
  'help.guide.import-places-list.tip.2':
    'Arricchisci i luoghi con Google compare nella finestra quando il tuo TREK ha una chiave Google: cerca ogni luogo importato e completa foto, indirizzo e dettagli.',

  // ── Screen: trip-days ─────────────────────────────────────────────────────────────────
  'help.ctx.trip-days.title': 'Giorni',
  'help.ctx.trip-days.summary':
    'La colonna di sinistra del programma: una scheda per giorno con le sue tappe in ordine, le note, le prenotazioni e i trasporti del giorno e il percorso tra le tappe. È qui che il viaggio viene davvero pianificato.',
  'help.ctx.trip-days.bullet.1':
    'La barra in alto: Esporta (PDF, calendario, GPX), Expand all days / Collapse all days, la freccia Annulla, Riordina i giorni e Mostra tutti i percorsi prenotati.',
  'help.ctx.trip-days.bullet.2':
    'Una scheda del giorno: numero, meteo, titolo, data e il costo del giorno nell’intestazione; clicca l’intestazione per aprire il giorno, la freccia la richiude. Trasporto pubblico, Aggiungi trasporto e Aggiungi nota stanno anch’essi nell’intestazione.',
  'help.ctx.trip-days.bullet.3':
    'Dentro un giorno: le tappe in ordine, ognuna con immagine, nome, orario e un lucchetto sull’immagine; le note; le prenotazioni che appartengono al giorno; e tra le tappe il tempo di viaggio di ogni tratta.',
  'help.ctx.trip-days.bullet.4':
    'Sotto le tappe la barra del percorso: Percorso disegna il giorno sulla mappa, Ottimizza ordina le tappe, In auto / A piedi imposta il mezzo di trasporto del giorno, Apri in Google Maps e Apri in CoMaps passano il giorno ad altre app.',
  'help.ctx.trip-days.bullet.5':
    'I luoghi arrivano su un giorno trascinando una riga dalla colonna dei luoghi, con il + di quella riga, con Aggiungi luogo a questo giorno su un giorno vuoto, oppure dai dettagli del luogo.',
  'help.ctx.trip-days.bullet.6':
    'Costo totale, in fondo, somma ogni tappa e ogni prenotazione con un prezzo, nella valuta del viaggio.',
  // read-day-plan
  'help.guide.read-day-plan.title': 'Leggere un giorno',
  'help.guide.read-day-plan.goal':
    'Sapere che cosa dice ogni parte di una scheda del giorno prima di cambiare qualcosa.',
  'help.guide.read-day-plan.step.1':
    'L’intestazione: il numero del giorno, le previsioni per il giorno, Giorno 1 o il titolo che gli hai dato, la data e il costo del giorno. Clicca l’intestazione per aprire il giorno (i suoi Dettagli del giorno si aprono sopra la mappa); la freccia a destra chiude e riapre la scheda.',
  'help.guide.read-day-plan.step.2':
    'Una tappa: la maniglia a sinistra la trascina, l’immagine porta un lucchetto per l’ottimizzazione del percorso, poi il nome, la descrizione e, se ci sono, le Note per questo giorno. Un contrassegno di orario mostra Inizio e Fine quando la tappa li ha; le frecce che compaiono alla sua estremità destra la spostano su o giù.',
  'help.guide.read-day-plan.step.3':
    'Una prenotazione nel giorno: una prenotazione su una tappa la segna Prenotazione confermata o Prenotazione in attesa, e un trasporto compare come Partenza o Arrivo con il suo orario e il suo tragitto, con un piccolo interruttore che disegna quel percorso sulla mappa.',
  'help.guide.read-day-plan.step.4':
    'Tra due tappe il connettore dice quanto dura la tratta e quanto è lunga, nel mezzo di trasporto del giorno; cliccalo per cambiare il mezzo di quella sola tratta.',
  'help.guide.read-day-plan.step.5':
    'La barra del percorso alla fine: Percorso disegna la strada del giorno sulla mappa, Ottimizza riordina le tappe, i pulsanti del mezzo scelgono In auto o A piedi, Apri in Google Maps e Apri in CoMaps aprono il giorno lì.',
  'help.guide.read-day-plan.result':
    'Ogni simbolo sulla scheda ha un significato; le guide qui sotto cambiano ognuno di essi.',
  'help.guide.read-day-plan.tip.1':
    'Fai clic destro su una tappa per il suo menu: Modifica, Rimuovi dal giorno, Apri sito web, le app di navigazione (Google Maps, Waze, Apple Maps, OpenStreetMap, CoMaps), Salva nella raccolta, Elimina.',
  'help.guide.read-day-plan.tip.2':
    'Passa il mouse su una tappa e alla sua estremità compare Aggiungi prenotazione: una prenotazione creata lì è legata a questa tappa in questo giorno.',
  // place-onto-day
  'help.guide.place-onto-day.title': 'Mettere un luogo su un giorno',
  'help.guide.place-onto-day.goal':
    'Trasformare un luogo della lista in una tappa del giorno, dove gli spetta nell’ordine.',
  'help.guide.place-onto-day.step.1':
    'Trascina una riga dalla colonna dei luoghi sulla scheda del giorno. Lasciala tra due tappe per metterla esattamente lì, oppure in un punto qualsiasi della scheda per aggiungerla in fondo.',
  'help.guide.place-onto-day.step.2':
    'Senza trascinare: apri il giorno cliccando la sua intestazione, poi clicca il + alla fine della riga del luogo, oppure fai clic destro sulla riga e scegli + Giorno.',
  'help.guide.place-onto-day.step.3':
    'Su un giorno vuoto, Aggiungi luogo a questo giorno apre il modulo del luogo, e il nuovo luogo finisce subito sul giorno.',
  'help.guide.place-onto-day.step.4':
    'Dai dettagli di un luogo, Aggiungi al giorno chiede quale giorno; dall’intestazione del giorno, Al giorno nella colonna dei luoghi crea un nuovo luogo sul giorno aperto.',
  'help.guide.place-onto-day.result':
    'Il luogo è una tappa del giorno, sulla mappa con il numero del giorno, e la colonna dei luoghi lo conta sotto Pianificati.',
  'help.guide.place-onto-day.tip.1':
    'Un luogo può stare su più giorni: mettilo sul secondo giorno dalla colonna dei luoghi. Trascinare una tappa da una scheda del giorno a un’altra la sposta invece di copiarla.',
  'help.guide.place-onto-day.tip.2': 'La freccia Annulla nella barra annulla l’assegnazione.',
  'help.guide.place-onto-day.tip.3':
    'Una tappa non si può lasciar cadere tra due voci con orari fissi, né prima di una prenotazione che ha già un orario; il programma mantiene la sua cronologia.',
  // reorder-stops
  'help.guide.reorder-stops.title': 'Cambiare l’ordine di un giorno',
  'help.guide.reorder-stops.goal': 'Spostare una tappa su o giù, oppure su un altro giorno.',
  'help.guide.reorder-stops.step.1': 'Trascina la tappa per la sua maniglia nella nuova posizione dentro la scheda.',
  'help.guide.reorder-stops.step.2':
    'Oppure usa le frecce all’estremità destra della tappa: un passo su o giù per ogni clic.',
  'help.guide.reorder-stops.step.3':
    'Trascina la tappa su un’altra scheda del giorno per spostarla lì; lascia il giorno di prima.',
  'help.guide.reorder-stops.step.4':
    'Una tappa con un orario fisso chiede Rimuovere l’orario? quando lo spostamento romperebbe l’ordine del giorno, perché era l’orario a decidere il suo posto: Conferma toglie l’orario e la lascia andare ovunque.',
  'help.guide.reorder-stops.result': 'Il percorso e i tempi di viaggio seguono subito il nuovo ordine.',
  'help.guide.reorder-stops.tip.1':
    'Le prenotazioni con un orario fisso non possono essere riordinate; restano dove il loro orario le mette.',
  'help.guide.reorder-stops.tip.2':
    'Ottimizza nella barra del percorso ordina tutto il giorno secondo la strada più breve; blocca prima una tappa per tenerla dov’è.',
  // set-stop-times
  'help.guide.set-stop-times.title': 'Dare un orario a una tappa',
  'help.guide.set-stop-times.goal':
    'Fissare quando una tappa inizia e finisce, così il giorno si legge come un orario.',
  'help.guide.set-stop-times.step.1':
    'Fai clic destro sulla tappa e scegli Modifica. Aperto dal giorno, il modulo ha Inizio e Fine in fondo.',
  'help.guide.set-stop-times.step.2':
    'Inserisci Inizio e, se vuoi, Fine. Sovrapposizione di orario con: avvisa che un’altra tappa del giorno con orario si sovrappone; una Fine prima dell’Inizio blocca Aggiorna.',
  'help.guide.set-stop-times.step.3':
    'Clicca Aggiorna. La tappa riceve un contrassegno di orario e si sposta dove il suo orario la colloca nel giorno.',
  'help.guide.set-stop-times.result':
    'Le tappe con orario mantengono il loro posto nell’ordine; le tappe senza orario si dispongono intorno a esse.',
  'help.guide.set-stop-times.tip.1':
    'L’orario appartiene alla tappa in quel giorno; lo stesso luogo in un altro giorno può avere un altro orario.',
  'help.guide.set-stop-times.tip.2':
    'Per spostare a mano una tappa con orario, trascinala: la domanda Rimuovere l’orario? toglie l’orario per strada, non appena clicchi Conferma.',
  'help.guide.set-stop-times.tip.3':
    'Il campo Note per questo giorno, nello stesso modulo, tiene quello che vale solo in questo giorno, un tavolo prenotato, un numero di biglietto.',
  // remove-from-day
  'help.guide.remove-from-day.title': 'Togliere una tappa da un giorno',
  'help.guide.remove-from-day.goal': 'Togliere un luogo dalla pianificazione senza cancellarlo dal viaggio.',
  'help.guide.remove-from-day.step.1': 'Fai clic destro sulla tappa e scegli Rimuovi dal giorno.',
  'help.guide.remove-from-day.step.2':
    'La tappa non è più nel giorno; il luogo resta nella colonna dei luoghi, sotto Non pianificati se non sta su nessun altro giorno.',
  'help.guide.remove-from-day.result':
    'Il giorno, il suo percorso e il suo costo si aggiornano; la freccia Annulla riporta indietro la tappa.',
  'help.guide.remove-from-day.tip.1':
    'Elimina, nello stesso menu, toglie il luogo da tutto il viaggio, ogni giorno compreso.',
  'help.guide.remove-from-day.tip.2':
    'Rimuovi dal giorno sta anche nel pannello dei dettagli del luogo, accanto ad Aggiungi al giorno.',
  // lock-stop
  'help.guide.lock-stop.title': 'Bloccare una tappa al suo posto',
  'help.guide.lock-stop.goal': 'Tenere una tappa dov’è quando il percorso viene ottimizzato.',
  'help.guide.lock-stop.step.1':
    'Passa il mouse sull’immagine della tappa e clicca il lucchetto: Mantieni la posizione durante l’ottimizzazione del percorso.',
  'help.guide.lock-stop.step.2':
    'Ottimizza ora dispone le altre tappe intorno a essa; clicca di nuovo il lucchetto (Clicca per sbloccare) per liberarla.',
  'help.guide.lock-stop.result':
    'Il lucchetto si vede sull’immagine; la tappa mantiene la sua posizione finché non la sblocchi.',
  'help.guide.lock-stop.tip.1':
    'Una tappa con un orario fisso è bloccata dal suo orario; durante l’ottimizzazione non si muove mai.',
  'help.guide.lock-stop.tip.2':
    'Il blocco dura per questa visita: dopo un ricaricamento ogni tappa è di nuovo libera, restano ferme solo le tappe con orario.',
  // day-note
  'help.guide.day-note.title': 'Aggiungere una nota a un giorno',
  'help.guide.day-note.goal': 'Tenere un promemoria, un numero di biglietto o un piano B dentro il giorno.',
  'help.guide.day-note.step.1': 'Clicca Aggiungi nota nell’intestazione del giorno.',
  'help.guide.day-note.step.2':
    'Dalle un nome sotto Nota, è quello che si vede nel giorno, e scrivi il resto sotto Nota giornaliera. La barra degli strumenti sopra formatta il testo (Grassetto, Elenco puntato, Link, Citazione), e Anteprima, a sinistra, mostra come verrà la nota nel giorno.',
  'help.guide.day-note.step.3': 'Scegli un’Icona e un Colore, così la nota si distingue dalle tappe, poi Aggiungi.',
  'help.guide.day-note.step.4':
    'La nota sta nel giorno come una tappa: trascinala al suo posto, fai clic destro per Modifica ed Elimina.',
  'help.guide.day-note.result':
    'La nota fa parte del giorno, anche nel PDF; una nota con un orario si ordina con le tappe con orario.',
  'help.guide.day-note.tip.1':
    'Una nota con un orario può sostituire un trasporto per cui non hai una prenotazione: «08:15 S3 dalla stazione centrale».',
  'help.guide.day-note.tip.2': 'Le note valgono per un giorno; una nota per tutto il viaggio sta in Collaborazione.',
  // day-route
  'help.guide.day-route.title': 'Mostrare e ottimizzare il percorso del giorno',
  'help.guide.day-route.goal':
    'Vedere la strada tra le tappe, scegliere come viaggi e lasciare che TREK ordini la sequenza.',
  'help.guide.day-route.step.1':
    'Apri il giorno e clicca Percorso nella barra del percorso: la strada tra le tappe si disegna sulla mappa, e i connettori tra le tappe mostrano il tempo e la distanza di ogni tratta.',
  'help.guide.day-route.step.2':
    'In auto e A piedi accanto impostano il mezzo di trasporto del giorno; le tratte si ricalcolano. I plugin possono aggiungere mezzi propri.',
  'help.guide.day-route.step.3':
    'Clicca un connettore per cambiare il mezzo di quella sola tratta: scegli un mezzo, oppure Usa predefinito del giorno per tornare a quello del giorno.',
  'help.guide.day-route.step.4':
    'Ottimizza riordina le tappe secondo la strada più breve. Le tappe con un lucchetto o con un orario fisso mantengono il loro posto; con un alloggio nel giorno, il percorso parte da lì.',
  'help.guide.day-route.step.5':
    'Apri in Google Maps o Apri in CoMaps apre tutto il giorno come itinerario in quell’app, per navigare durante il viaggio.',
  'help.guide.day-route.result':
    'Il giorno è un percorso con orari; Costo totale e le tratte si aggiornano quando l’ordine cambia.',
  'help.guide.day-route.tip.1':
    'I percorsi arrivano da OSRM in modo predefinito; l’amministratore può puntare TREK su un altro motore di calcolo in Impostazioni predefinite.',
  'help.guide.day-route.tip.2':
    'Una tratta che non si è potuta calcolare non mostra un tempo; controlla che entrambe le tappe abbiano le coordinate.',
  'help.guide.day-route.tip.3': 'La freccia Annulla annulla un’ottimizzazione.',
  // manage-days
  'help.guide.manage-days.title': 'Aggiungere, riordinare e rinominare i giorni',
  'help.guide.manage-days.goal': 'Dare forma ai giorni stessi, non solo a quello che ci sta sopra.',
  'help.guide.manage-days.step.1':
    'I giorni nascono dalle date del viaggio; cambia le date sulla scheda del viaggio in Dashboard e i giorni vengono aggiunti o tolti alle estremità. Prima che un giorno con dei contenuti venga tolto, una lista dice quali giorni se ne vanno e cosa portano.',
  'help.guide.manage-days.step.2':
    'Riordina i giorni nella barra apre una lista: Sposta su e Sposta giù spostano un giorno con tutto ciò che porta, ed Elimina giorno, il cestino accanto, lo toglie. Sotto la lista, il pulsante con la data successiva aggiunge un giorno subito dopo l’ultimo con data e allunga il viaggio di un giorno; Senza data aggiunge in fondo un giorno senza data.',
  'help.guide.manage-days.step.3':
    'Elimina giorno chiede prima: la lista mostra cosa se ne va con il giorno, i suoi luoghi, note e prenotazioni, un alloggio con check-in o check-out quel giorno e i giorni che avanzano di una data. Elimina giorno lo toglie, Annulla lo tiene; l’ultimo giorno non si può eliminare.',
  'help.guide.manage-days.step.4':
    'Per rinominare un giorno, aprilo e clicca la matita accanto al suo titolo nei Dettagli del giorno sopra la mappa; il nome sostituisce Giorno 1 nella scheda e nel PDF.',
  'help.guide.manage-days.step.5':
    'Expand all days e Collapse all days nella barra chiudono tutte le schede in una volta; una singola scheda si chiude con la sua freccia.',
  'help.guide.manage-days.result':
    'Le date restano legate alla posizione: un giorno spostato in su prende la data precedente, e le sue tappe, note e prenotazioni viaggiano con lui.',
  'help.guide.manage-days.tip.1': 'Spostare i giorni si può annullare dalla barra; eliminare un giorno no.',
  'help.guide.manage-days.tip.2':
    'Il costo nell’intestazione di un giorno somma le tappe e le prenotazioni di quel giorno che portano un prezzo.',
  // bookings-in-plan
  'help.guide.bookings-in-plan.title': 'Leggere prenotazioni e trasporti nel programma',
  'help.guide.bookings-in-plan.goal':
    'Sapere dove compare una prenotazione una volta che esiste, e quale schermata la crea.',
  'help.guide.bookings-in-plan.step.1':
    'Un trasporto (Volo, Treno, Traghetto, Autobus, Auto) compare nel giorno in cui parte come Partenza e nel giorno in cui arriva come Arrivo, con orario e tragitto; uno che dura più giorni copre i giorni in mezzo.',
  'help.guide.bookings-in-plan.step.2':
    'Una prenotazione legata a una tappa (un Ristorante, un Tour) segna quella tappa Prenotazione confermata o Prenotazione in attesa; una prenotazione con un giorno ma senza tappa è una riga a sé nel giorno.',
  'help.guide.bookings-in-plan.step.3':
    'Una notte in hotel è un alloggio: sta nei Dettagli del giorno sotto Alloggio, dal Check-in al Check-out, e il percorso di ciascuno di quei giorni parte da lì.',
  'help.guide.bookings-in-plan.step.4':
    'Sulla mappa, l’interruttore su una riga di trasporto disegna il suo percorso; Mostra tutti i percorsi prenotati nella barra li disegna tutti.',
  'help.guide.bookings-in-plan.step.5':
    'Per crearle: Aggiungi prenotazione su una tappa con il mouse sopra, Aggiungi trasporto e Trasporto pubblico nell’intestazione del giorno, e le schede Prenotazioni e Trasporti per la lista completa con importazione e file.',
  'help.guide.bookings-in-plan.result':
    'Una prenotazione, un posto nel programma; le schede sono le stesse prenotazioni sotto forma di lista.',
  'help.guide.bookings-in-plan.tip.1':
    'Confermata e In attesa è uno stato che imposti sulla prenotazione; il programma lo mostra sulla tappa, la scheda Prenotazioni le conta entrambe.',
  'help.guide.bookings-in-plan.tip.2':
    'Un trasporto con un orario fisso non si può trascinare; cambia invece il suo orario nella prenotazione.',
  // export-plan
  'help.guide.export-plan.title': 'Esportare il programma',
  'help.guide.export-plan.goal': 'Portarsi via il programma come documento, nel calendario o su un GPS.',
  'help.guide.export-plan.step.1': 'Clicca Esporta nella barra sopra i giorni.',
  'help.guide.export-plan.step.2':
    'Documento: PDF apre la vista di stampa di ogni giorno con le sue tappe, note e prenotazioni; Interruzione di pagina per giorno fa iniziare ogni giorno su una pagina nuova, Salva come PDF lo scarica.',
  'help.guide.export-plan.step.3':
    'Calendario: Scarica .ics salva le prenotazioni come file di calendario; Abbonati al calendario dà un link che la tua app di calendario aggiorna da sola.',
  'help.guide.export-plan.step.4':
    'Mappe e GPS · GPX: Tutto il viaggio esporta luoghi, percorsi dei giorni e tracce; Solo i luoghi i punti; Giorni come itinerari un itinerario per giorno, per mappe offline e dispositivi GPS.',
  'help.guide.export-plan.result': 'Il file viene scaricato; nel viaggio non cambia nulla.',
  'help.guide.export-plan.tip.1':
    'Un singolo giorno va in un’app di mappe dalla sua barra del percorso: Apri in Google Maps o Apri in CoMaps.',
  'help.guide.export-plan.tip.2':
    'Abbonati al calendario richiede i feed di calendario attivati nelle tue impostazioni; Dashboard ha una guida per farlo.',
  'help.guide.export-plan.tip.3': 'Esportare è leggere: ogni membro del viaggio può farlo.',

  // ── Screen: trip-place ────────────────────────────────────────────────────────────────
  'help.ctx.trip-place.title': 'Dettagli del luogo',
  'help.ctx.trip-place.summary':
    'Il riquadro che si apre sopra la mappa quando scegli un luogo: tutto ciò che il viaggio sa di lui, le stelle che gli ha dato ognuno, la sua immagine e i suoi file, e i pulsanti che lo mettono sul giorno aperto, in una lista o in una app di mappe.',
  'help.ctx.trip-place.bullet.1':
    'Clicca una riga nella colonna dei luoghi, una tappa dentro un giorno o un marcatore sulla mappa, e il riquadro si apre sopra la mappa. Sceglierlo dentro un giorno dice al riquadro quale tappa intendi, ed è questo che porta con sé i partecipanti della tappa e la sua prenotazione.',
  'help.ctx.trip-place.bullet.2':
    'La testata porta l’immagine rotonda, il nome, la categoria, l’indirizzo e le coordinate. Clicca l’immagine per usarne una tua, fai doppio clic sul nome per rinominare il luogo sul posto, e la X a destra chiude il riquadro.',
  'help.ctx.trip-place.bullet.3':
    'Sotto: il prezzo se ne ha uno, le stelle che ogni viaggiatore ha dato al luogo, la descrizione e le note, e Note per questo giorno quando la tappa ne porta.',
  'help.ctx.trip-place.bullet.4':
    'Seguono Orari di apertura, Colore del percorso, Dati del percorso e File, per quanto si applicano. File prende qualunque cosa dalle tue cartelle ed elenca anche ciò che è appeso alla prenotazione di questa tappa.',
  'help.ctx.trip-place.bullet.5':
    'La riga in fondo: Aggiungi al giorno o Rimuovi dal giorno finché un giorno è aperto, poi Salva nella raccolta, Navigazione, Apri sito web, Modifica ed Elimina.',
  'help.ctx.trip-place.bullet.6':
    'Un luogo scelto dalla ricerca porta ciò che l’indice TREK o OpenStreetMap sanno di lui: un anello verde Aperto o rosso Chiuso intorno all’immagine, giudicato con l’orologio del luogo stesso, il numero di telefono sotto le stelle, Orari di apertura più in basso con la riga del giorno sulla riga e tutta la settimana dietro un clic, e il suo sito dietro Apri sito web. La valutazione di Google si vede solo su un luogo trovato tramite Google, su un TREK con una chiave Google.',
  // read-place
  'help.guide.read-place.title': 'Che cosa il riquadro ti dice di un luogo',
  'help.guide.read-place.goal': 'Leggi tutto ciò che il viaggio sa di un luogo, in un unico riquadro.',
  'help.guide.read-place.step.1':
    'Nella colonna dei giorni, clicca la tappa che vuoi leggere. Il riquadro si apre sopra la mappa e la tappa resta segnata nel suo giorno.',
  'help.guide.read-place.step.2':
    'La testata: l’immagine rotonda, il nome, l’indirizzo e le coordinate esatte. Un anello verde con Aperto, o rosso con Chiuso, intorno all’immagine dice se il luogo è aperto in questo momento, secondo il suo orologio, appena TREK conosce i suoi orari. La X a destra richiude il riquadro.',
  'help.guide.read-place.step.3':
    'Sotto, le stelle che ogni viaggiatore ha dato al luogo, con la media e quanti hanno votato. Non ancora valutato finché nessuno lo ha fatto. Subito sotto, il numero di telefono dove il luogo ne ha uno: un clic sopra passa il numero alla tua app del telefono.',
  'help.guide.read-place.step.4':
    'Poi la descrizione e, sotto, le note. Entrambe sono il testo del modulo del luogo, reso: elenchi, link e grassetto funzionano.',
  'help.guide.read-place.step.5': 'Partecipanti dice chi va a questa tappa. Ci sono tutti finché non togli qualcuno.',
  'help.guide.read-place.step.6':
    'Orari di apertura, più in basso: la riga porta gli orari del giorno che stai guardando, e un clic sopra apre tutta la settimana con quel giorno in grassetto. File sta accanto.',
  'help.guide.read-place.result':
    'Il riquadro resta aperto finché non lo chiudi con la X o scegli un altro luogo, gli orari della settimana restano aperti, e la tappa a cui appartiene resta segnata nella colonna dei giorni.',
  'help.guide.read-place.tip.1':
    'Scelto dalla colonna dei luoghi, il riquadro conosce il luogo ma non una tappa, quindi non mostra né partecipanti né prenotazione. Scegli invece la tappa dentro il giorno e ci sono entrambi.',
  'help.guide.read-place.tip.2':
    'Fai doppio clic sul nome per rinominare il luogo senza aprire il modulo. Invio salva, Esc annulla la modifica.',
  'help.guide.read-place.tip.3':
    'Un luogo digitato a mano non mostra nulla di tutto questo: il riquadro conosce solo ciò che contiene il suo modulo. Aprilo con Modifica, sceglilo tra i suggerimenti sotto Cerca luoghi... e clicca Aggiorna, e gli orari, il numero di telefono e il sito arrivano con lui. La valutazione di Google richiede una chiave Google.',
  // rate-place
  'help.guide.rate-place.title': 'Valutare un luogo',
  'help.guide.rate-place.goal': 'Dai a un luogo le tue stelle, e guarda quelle che gli hanno dato tutti gli altri.',
  'help.guide.rate-place.step.1':
    'Apri il luogo. La riga delle stelle sta subito sotto la testata e porta la media dei voti finora, con il loro numero tra parentesi.',
  'help.guide.rate-place.step.2':
    'Clicca la stella che intendi. Le stelle si riempiono mentre le percorri, così vedi che cosa stai per dare.',
  'help.guide.rate-place.step.3':
    'Il tuo voto entra subito nella media, e i volti accanto sono chi ha votato. Lascia il puntatore sulla riga per vedere le stelle di tutti.',
  'help.guide.rate-place.step.4':
    'La stessa media sta sulla riga del luogo nella colonna dei luoghi, così quelli buoni spiccano nella lista.',
  'help.guide.rate-place.result':
    'Le tue stelle sono sul luogo, visibili a tutto il viaggio, e la stella nella riga dei filtri sopra la lista può ora tenere solo i luoghi che raggiungono una soglia.',
  'help.guide.rate-place.tip.1':
    'Ogni viaggiatore può valutare, anche in un viaggio in cui solo alcuni hanno il permesso Aggiungere / modificare / eliminare luoghi.',
  'help.guide.rate-place.tip.2':
    'Clicca la stella che hai già dato per ritirare il tuo voto. Se non vota più nessuno, il luogo torna a dire Non ancora valutato.',
  'help.guide.rate-place.tip.3':
    'Accanto alle stelle stanno fino a sei votanti come volti; il tooltip li nomina tutti, e segna il tuo.',
  // place-image
  'help.guide.place-image.title': 'Mettere una tua immagine su un luogo',
  'help.guide.place-image.goal': 'Sostituisci la miniatura automatica con una foto tua.',
  'help.guide.place-image.step.1': 'Apri il luogo dalla colonna dei luoghi.',
  'help.guide.place-image.step.2':
    'Lascia il puntatore sull’immagine rotonda nella testata: compare una fotocamera e il tooltip dice Carica immagine. Cliccala e scegli il tuo file.',
  'help.guide.place-image.step.3': 'La testata mostra ora la tua immagine, con una piccola X rossa al suo angolo.',
  'help.guide.place-image.step.4':
    'La stessa immagine sta sulla riga del luogo nella colonna dei luoghi, e sul suo marcatore sulla mappa.',
  'help.guide.place-image.result':
    'La tua immagine è l’immagine del luogo ovunque: il riquadro, la colonna dei luoghi, la tappa nel giorno, il marcatore sulla mappa e un viaggio condiviso.',
  'help.guide.place-image.tip.1':
    'JPG, PNG, GIF e WebP vengono accettati, e un HEIC da un iPhone viene convertito all’ingresso.',
  'help.guide.place-image.tip.2':
    'La X all’angolo rimuove di nuovo la tua immagine e torna quella automatica. Il luogo stesso resta intatto.',
  'help.guide.place-image.tip.3':
    'Senza una tua immagine TREK ne cerca una dalle coordinate del luogo, e ripiega sull’icona della categoria.',
  // place-day-assign
  'help.guide.place-day-assign.title': 'Mettere il luogo sul giorno aperto, o toglierlo',
  'help.guide.place-day-assign.goal': 'Usa il pulsante del riquadro invece di trascinare la riga per il pianificatore.',
  'help.guide.place-day-assign.step.1':
    'Clicca l’intestazione di un giorno nella colonna dei giorni. Quel giorno ora è quello aperto, e il riquadro lavora su di lui.',
  'help.guide.place-day-assign.step.2':
    'Clicca nella colonna dei luoghi un luogo che non è su quel giorno. Il suo riquadro si apre e la riga in fondo offre Aggiungi al giorno.',
  'help.guide.place-day-assign.step.3':
    'Clicca Aggiungi al giorno. La tappa finisce in fondo al giorno e il pulsante diventa Rimuovi dal giorno.',
  'help.guide.place-day-assign.step.4':
    'La tappa ora è nel giorno, ultima nella lista. Trascinala in su fino al suo posto.',
  'help.guide.place-day-assign.step.5':
    'Rimuovi dal giorno toglie di nuovo quella tappa dal giorno, e il riquadro offre ancora Aggiungi al giorno.',
  'help.guide.place-day-assign.result':
    'Il giorno porta la tappa, o non la porta più, e il luogo stesso resta intatto in entrambi i casi.',
  'help.guide.place-day-assign.tip.1':
    'Il pulsante esiste solo finché un giorno è aperto. Senza un giorno il riquadro non ha nulla a cui aggiungere il luogo.',
  'help.guide.place-day-assign.tip.2':
    'Togliere una tappa da un giorno lascia il luogo nel viaggio e nella colonna dei luoghi. Elimina è ciò che lo toglie ovunque.',
  'help.guide.place-day-assign.tip.3':
    'Una tappa che una prenotazione di alloggio ha messo sul giorno non offre nessuno dei due pulsanti: quella notte si aggiunge e si toglie nel blocco Alloggio del giorno.',
  // place-participants
  'help.guide.place-participants.title': 'Dire chi va a questa tappa',
  'help.guide.place-participants.goal': 'Dividi il gruppo per una tappa senza dividere il viaggio.',
  'help.guide.place-participants.step.1':
    'Clicca la tappa dentro il giorno. Il riquadro si apre e Partecipanti elenca tutti quelli del viaggio.',
  'help.guide.place-participants.step.2':
    'Clicca il nome di un viaggiatore per toglierlo da questa tappa. Il nome viene barrato mentre ci passi sopra.',
  'help.guide.place-participants.step.3':
    'Un + tratteggiato compare non appena qualcuno manca. Cliccalo per vedere chi non è sulla tappa.',
  'help.guide.place-participants.step.4':
    'Clicca un nome per rimetterlo. Con tutti di nuovo dentro, la tappa torna a essere di tutto il gruppo.',
  'help.guide.place-participants.result':
    'La tappa porta i viaggiatori che hai scelto, e il resto del gruppo ha quel pomeriggio per sé.',
  'help.guide.place-participants.tip.1':
    'Partecipanti compare solo con una tappa selezionata, quindi scegli il luogo dentro il giorno e non nella colonna dei luoghi, e solo in un viaggio con più di un viaggiatore.',
  'help.guide.place-participants.tip.2':
    'Nessuno scelto vuol dire che vanno tutti, ed è per questo che l’ultimo viaggiatore rimasto su una tappa non si può togliere.',
  'help.guide.place-participants.tip.3':
    'Un ospite, che non ha un account suo, può essere partecipante come chiunque altro.',
  // place-booking
  'help.guide.place-booking.title': 'La prenotazione su una tappa',
  'help.guide.place-booking.goal':
    'Leggi la prenotazione che appartiene a una tappa, aprila, e appendine una nuova a quella tappa.',
  'help.guide.place-booking.step.1':
    'Apri la tappa a cui appartiene la prenotazione. Il riquadro mostra una striscia con Confermata o In attesa e il nome della prenotazione.',
  'help.guide.place-booking.step.2':
    'La striscia porta la Data, l’Ora e il Codice prenotazione, e tutte le note che la prenotazione ha.',
  'help.guide.place-booking.step.3': 'Clicca la striscia. Il modulo della prenotazione si apre sopra.',
  'help.guide.place-booking.step.4':
    'Collega all’assegnazione del giorno è ciò che appende una prenotazione a una tappa, e qui nomina già questa. Richiudi il modulo.',
  'help.guide.place-booking.step.5':
    'Una nuova prenotazione per una tappa parte dalla colonna dei giorni: passa sulla tappa e clicca il + alla sua estremità. Il modulo si apre come Nuova prenotazione, già collegata a quella tappa.',
  'help.guide.place-booking.result':
    'La prenotazione è appesa alla tappa: sta sul riquadro, sta nel giorno, e i suoi file sono elencati anche qui sotto File.',
  'help.guide.place-booking.tip.1':
    'La striscia si mostra solo per la tappa a cui la prenotazione è appesa. Una prenotazione senza tappa vive nella scheda Pren.',
  'help.guide.place-booking.tip.2':
    'Più prenotazioni possono condividere una tappa: il pranzo e il tour che parte dalla stessa porta.',
  'help.guide.place-booking.tip.3':
    'Un treno, un volo o un traghetto apre invece il modulo di trasporto, lo stesso che usa la scheda Trasporti.',
  // place-files
  'help.guide.place-files.title': 'Tenere i biglietti di un luogo con il luogo',
  'help.guide.place-files.goal': 'Metti il biglietto, il voucher o la mappa di un luogo dove lo cercherai.',
  'help.guide.place-files.step.1':
    'Apri il luogo. File sta ai piedi del riquadro e dice File finché il luogo non ne ha.',
  'help.guide.place-files.step.2': 'Clicca Carica accanto e scegli il file.',
  'help.guide.place-files.step.3': 'Il pulsante conta ciò che il luogo tiene, e la lista si apre da sola.',
  'help.guide.place-files.step.4': 'Ogni riga è il nome del file con la sua dimensione. Cliccala per aprire il file.',
  'help.guide.place-files.result':
    'Il file sta sul luogo, contato nel riquadro, ed è anche nella scheda File del viaggio.',
  'help.guide.place-files.tip.1':
    'File elenca anche ciò che è appeso alla prenotazione di questa tappa, così una conferma d’albergo compare sull’albergo.',
  'help.guide.place-files.tip.2': 'Carica prende più file alla volta.',
  'help.guide.place-files.tip.3':
    'Senza il permesso Caricare file il pulsante Carica non c’è; i file già sul luogo restano.',
  // place-navigation
  'help.guide.place-navigation.title': 'Aprire un luogo in una app di mappe o sul suo sito',
  'help.guide.place-navigation.goal': 'Consegna il luogo alla app che davvero ti ci porta.',
  'help.guide.place-navigation.step.1': 'Apri il luogo e clicca Navigazione nella riga in fondo.',
  'help.guide.place-navigation.step.2':
    'La lista sono le app di mappe che vanno bene per questo luogo: Google Maps, Waze, Apple Maps, OpenStreetMap e CoMaps.',
  'help.guide.place-navigation.step.3':
    'Clicca quella che usi. TREK le passa il luogo stesso dove può, non solo un paio di coordinate, così arrivi all’ingresso giusto.',
  'help.guide.place-navigation.step.4':
    'Apri sito web accanto apre la pagina propria del luogo, i suoi orari e i suoi biglietti, in una nuova scheda.',
  'help.guide.place-navigation.result':
    'La app di mappe si apre sul luogo, il sito in una scheda tutta sua, e nel viaggio non cambia nulla.',
  'help.guide.place-navigation.tip.1':
    'Waze parte subito con la navigazione. Le altre aprono il luogo, e partire da lì è un tocco in più.',
  'help.guide.place-navigation.tip.2':
    'Quali app vengono offerte dipende dal luogo e dal tuo dispositivo: Apple Maps resta fuori su Android, 高德地图 esce solo per un luogo in Cina, e Waze, Apple Maps e CoMaps hanno bisogno delle coordinate del luogo.',
  'help.guide.place-navigation.tip.3':
    'Quando si applica una sola app, il pulsante porta il nome di quella app e la apre subito.',
  // place-to-collection
  'help.guide.place-to-collection.title': 'Salvare un luogo in una delle tue liste',
  'help.guide.place-to-collection.goal': 'Tieni per il prossimo viaggio un luogo che hai trovato in questo.',
  'help.guide.place-to-collection.step.1': 'Apri il luogo e clicca Salva nella raccolta in fondo al riquadro.',
  'help.guide.place-to-collection.step.2':
    'Salva in una lista mostra ogni lista che possiedi o che condividi. Una spunta segna quelle che hanno già questo luogo.',
  'help.guide.place-to-collection.step.3': 'Clicca la lista. Il luogo ci sta dentro subito.',
  'help.guide.place-to-collection.step.4': 'Chiudi, e il pulsante nel riquadro dice Salvato.',
  'help.guide.place-to-collection.result':
    'Il luogo è nella tua lista con la sua immagine, le sue note e il suo indirizzo, pronto per il prossimo viaggio.',
  'help.guide.place-to-collection.tip.1':
    'Il pulsante c’è solo finché il modulo Raccolte è acceso, cosa che l’amministratore fa sotto Moduli.',
  'help.guide.place-to-collection.tip.2':
    'Un luogo può stare in più liste alla volta, con uno stato suo in ognuna: un’Idea in una, Visitato in un’altra.',
  'help.guide.place-to-collection.tip.3':
    'Segna come visitato, accanto al nome del luogo nel selettore, lo spunta nella lista; con il luogo in più liste tue la pillola dice Visitato ovunque e le fa tutte in una volta.',
  // place-track
  'help.guide.place-track.title': 'Leggere una traccia e darle un colore suo',
  'help.guide.place-track.goal':
    'Guarda quanto è lunga una camminata importata, e distingui la sua linea dalle altre sulla mappa.',
  'help.guide.place-track.step.1':
    'Nella colonna dei luoghi, la riga di una traccia porta un breve tratto nel colore in cui è disegnata la sua linea. Cliccala.',
  'help.guide.place-track.step.2':
    'Dati del percorso dà la lunghezza del cammino, nell’Unità di Distanza che hai impostato.',
  'help.guide.place-track.step.3':
    'Colore del percorso sopra mostra il colore in uso. Clicca la riga per aprire i campioni.',
  'help.guide.place-track.step.4': 'Scegli un colore. La linea sulla mappa e il tratto sulla riga cambiano con lui.',
  'help.guide.place-track.step.5':
    'La cella tratteggiata a sinistra, Colore automatico, restituisce alla traccia il colore che eredita; il contagocce a destra apre il selettore di colore del tuo sistema per qualunque altro.',
  'help.guide.place-track.result':
    'La traccia è disegnata nel colore che hai scelto, nel riquadro, sulla sua riga nella colonna dei luoghi e sulla mappa.',
  'help.guide.place-track.tip.1':
    'Solo un luogo che porta un cammino, importato da un file GPX, KML o KMZ, ha questi due blocchi.',
  'help.guide.place-track.tip.2':
    'Una traccia registrata con le quote mostra anche il suo punto più alto e più basso, i metri in salita e in discesa, e il profilo della camminata.',
  'help.guide.place-track.tip.3':
    'Un import dà a ogni traccia che porta dentro un colore suo, così due camminate non arrivano mai nello stesso.',
  // read-place
  'help.guide.read-place.step.7':
    'La riga in fondo è ciò che puoi fare da qui: togliere il luogo dal giorno aperto o mettercelo, salvarlo in una lista, aprirlo in una app di mappe, modificarlo o eliminarlo.',

  // ── Screen: trip-files ────────────────────────────────────────────────────────────────
  'help.ctx.trip-files.title': 'File',
  'help.ctx.trip-files.summary':
    'Ogni documento del viaggio in un unico elenco: biglietti, conferme, pass e immagini, ognuno con una nota, un collegamento al luogo o alla prenotazione a cui appartiene, e un cestino da cui può tornare fuori.',
  'help.ctx.trip-files.bullet.1':
    'Trascina qui i file, in alto, prende i file; un clic sul riquadro apre la finestra di scelta dei file. La riga sotto elenca i tipi di file che questo TREK accetta e il limite di 50 MB per file.',
  'help.ctx.trip-files.bullet.2':
    'Le schede dicono cosa mostra l’elenco: Tutti, PDF, Immagini e Documenti, ognuna con il suo conteggio. Una scheda con la stella si aggiunge appena un file finisce tra i preferiti, Note Collaborazione appena una nota porta un allegato.',
  'help.ctx.trip-files.bullet.3':
    'Una riga porta chi l’ha caricato, il nome, la nota sotto, la dimensione e la data, e un contrassegno per ogni collegamento: Programma giornaliero e il luogo, Prenotazione o Trasporto e la prenotazione, Da Note Collaborazione.',
  'help.ctx.trip-files.bullet.4':
    'In fondo a una riga stanno Aggiungi ai preferiti, Assegna, Apri, Scarica ed Elimina. Elimina non chiede: il file va nel cestino, da dove può essere riportato indietro.',
  'help.ctx.trip-files.bullet.5':
    'Un’immagine o un video si apre a schermo intero, con i tasti freccia e una striscia di miniature; ogni altro documento si apre in un’anteprima sopra la pagina, con Apri in una nuova scheda e Scarica. Un pass per il wallet viene scaricato subito.',
  'help.ctx.trip-files.bullet.6':
    'Cestino all’estremità destra porta l’elenco sui file eliminati, dove ognuno viene ripristinato o eliminato per sempre e Svuota cestino li toglie tutti. Dove un amministratore ha collegato un archivio di documenti, accanto sta Sincronizzazione documenti.',
  // files-upload
  'help.guide.files-upload.title': 'Mettere un documento nel viaggio',
  'help.guide.files-upload.goal':
    'Porta un biglietto, una conferma o una foto dalla tua cartella dei download nel viaggio, dove tutti quelli che ci sono possono raggiungerli.',
  'help.guide.files-upload.step.1':
    'Apri il viaggio e clicca File nella barra delle schede. Lì sono elencati i documenti del viaggio, con il riquadro di caricamento sopra.',
  'help.guide.files-upload.step.2':
    'Clicca Trascina qui i file e scegli uno o più file. Vengono caricati uno dopo l’altro e nel riquadro si legge Caricamento... finché dura. La riga sotto il riquadro dice quali tipi accetta questo TREK, e che un file può pesare al massimo 50 MB.',
  'help.guide.files-upload.step.3':
    'Appena l’ultimo file è caricato, Assegna file si apre da solo per lui. Aggiungi una nota... dà al file una riga tutta sua, e gli elenchi sotto lo legano a un luogo o a una prenotazione. Chiudilo con la ×; chiudendolo non si perde nulla.',
  'help.guide.files-upload.step.4':
    'I nuovi file stanno in cima all’elenco. Una riga mostra chi l’ha caricato, il nome, la dimensione e la data; un’immagine riceve una miniatura, ogni altro file il suo tipo.',
  'help.guide.files-upload.result':
    'I documenti sono nel viaggio, e chiunque possa vedere il viaggio può aprirli e scaricarli.',
  'help.guide.files-upload.tip.1':
    'Un file si può anche trascinare dalla scrivania direttamente sul riquadro, che si illumina finché il file gli sta sopra.',
  'help.guide.files-upload.tip.2':
    'Un’immagine negli appunti entra nell’elenco con Ctrl+V, così uno screenshot di una prenotazione non va mai salvato prima.',
  'help.guide.files-upload.tip.3':
    'Caricare richiede il diritto Caricare file; senza di quello il riquadro non c’è proprio. Un tipo che non è nell’elenco viene rifiutato con un messaggio e non viene caricato nulla. Un file oltre 50 MB viene scartato dal riquadro stesso, prima che parta qualcosa.',
  // files-link
  'help.guide.files-link.title': 'Legare un documento a un luogo o a una prenotazione',
  'help.guide.files-link.goal': 'Rendi il biglietto trovabile dal giorno a cui appartiene, non solo da questo elenco.',
  'help.guide.files-link.step.1':
    'Clicca Assegna, la matita in fondo alla riga. Si apre Assegna file, con il nome del file.',
  'help.guide.files-link.step.2':
    'Sotto Nota, Aggiungi una nota... prende una riga, che poi sta sotto il nome del file nell’elenco. Viene salvata nel momento in cui esci dal campo.',
  'help.guide.files-link.step.3':
    'Sotto Luogo stanno i luoghi del viaggio, raggruppati per il giorno in cui si trovano, con Non assegnato in fondo per quelli che non stanno in nessun giorno. Cliccane uno e riceve un segno di spunta.',
  'help.guide.files-link.step.4':
    'Sotto Prenotazione e Trasporto stanno le prenotazioni del viaggio. Clicca quella a cui appartiene il documento; anche lei riceve la sua spunta.',
  'help.guide.files-link.step.5':
    'Chiudi con la ×. Qui non c’è un pulsante di salvataggio: ogni clic è stato scritto mentre lo facevi.',
  'help.guide.files-link.result':
    'La riga porta la nota e un contrassegno per ogni collegamento, Programma giornaliero e il nome del luogo, Trasporto e il nome del volo, e il documento è appeso anche al luogo e al volo.',
  'help.guide.files-link.tip.1':
    'Un file può tenere più collegamenti insieme, così la stessa conferma appartiene all’hotel e alla notte che copre.',
  'help.guide.files-link.tip.2': 'Cliccare di nuovo una voce spuntata toglie quel collegamento; il file in sé resta.',
  'help.guide.files-link.tip.3':
    'Funziona anche al contrario: un documento allegato a un luogo o a una prenotazione sta anche in questo elenco, con lo stesso contrassegno sulla sua riga.',
  // files-star
  'help.guide.files-star.title': 'Tenere in alto i documenti importanti',
  'help.guide.files-star.goal':
    'Tira fuori i due o tre fogli che ti serviranno davvero da un elenco che cresce per tutto il viaggio.',
  'help.guide.files-star.step.1':
    'Clicca Aggiungi ai preferiti in fondo a una riga. La stella si riempie di giallo, una seconda stella compare davanti al nome del file, e il pulsante ora dice Rimuovi dai preferiti.',
  'help.guide.files-star.step.2':
    'L’elenco si riordina: i file tra i preferiti stanno sopra tutti gli altri, i più recenti per primi dentro ogni gruppo.',
  'help.guide.files-star.step.3':
    'In alto una stella si è aggiunta alle schede, con il numero di file preferiti dietro. Cliccala per vedere solo quelli.',
  'help.guide.files-star.result':
    'I fogli che ti servono allo sportello stanno in cima all’elenco, e una scheda non mostra altro.',
  'help.guide.files-star.tip.1':
    'La scheda con la stella esiste solo finché qualcosa è tra i preferiti. Togli dai preferiti l’ultimo file e la scheda se ne va con lui.',
  'help.guide.files-star.tip.2':
    'Mettere tra i preferiti conta come una modifica: un membro che può solo leggere i file del viaggio vede le stelle ma non può metterle.',
  // files-filter
  'help.guide.files-filter.title': 'Trovare un documento nell’elenco',
  'help.guide.files-filter.goal': 'Restringi un elenco che contiene tutto all’unico tipo di foglio che cerchi.',
  'help.guide.files-filter.step.1':
    'Le schede sopra l’elenco sono Tutti, PDF, Immagini e Documenti, ognuna con il numero di file dietro.',
  'help.guide.files-filter.step.2': 'Clicca PDF: l’elenco tiene i file PDF e nient’altro.',
  'help.guide.files-filter.step.3':
    'Altre due schede vanno e vengono con ciò che c’è nel viaggio. Clicca Note Collaborazione, che c’è appena una nota nella scheda Collaborazione porta un allegato: la lista tiene quei file e nient’altro. Una stella si aggiunge alla fila allo stesso modo, appena un file finisce tra i preferiti.',
  'help.guide.files-filter.step.4': 'Tutti riporta l’elenco intero.',
  'help.guide.files-filter.result':
    'L’elenco mostra solo ciò che la scheda nomina, e il conteggio su ogni scheda dice quanti sono.',
  'help.guide.files-filter.tip.1':
    'Qui non ci sono cartelle e non si rinomina nulla: la nota in Assegna file, i collegamenti a luoghi e prenotazioni, e la stella sono ciò per cui un documento viene ordinato.',
  'help.guide.files-filter.tip.2':
    'L’elenco stesso mette sempre prima i preferiti, poi i più recenti, così un documento caricato oggi sta sopra a uno del mese scorso.',
  // files-preview
  'help.guide.files-preview.title': 'Leggere un documento senza uscire da TREK',
  'help.guide.files-preview.goal':
    'Guarda un biglietto o un’immagine sul posto, e portali sulla tua macchina quando ti servono lì.',
  'help.guide.files-preview.step.1':
    'Clicca il nome di un’immagine o la sua miniatura. Si apre a schermo intero, con il nome del file e la sua posizione tra le immagini nell’intestazione.',
  'help.guide.files-preview.step.2':
    'Le frecce tonde ai lati, i tasti freccia sinistra e destra e la striscia di miniature in basso scorrono tutte le immagini che l’elenco sta mostrando in quel momento.',
  'help.guide.files-preview.step.3':
    'Apri in una nuova scheda e Scarica stanno nell’intestazione; la × o Esc richiude l’immagine.',
  'help.guide.files-preview.step.4':
    'Un documento che non è un’immagine si apre invece in un’anteprima sopra la pagina, con gli stessi due pulsanti nella sua intestazione. Questa si chiude con la × o con un clic di fianco.',
  'help.guide.files-preview.step.5':
    'Scarica in fondo a una riga salva il file direttamente sulla tua macchina, senza aprire prima nulla.',
  'help.guide.files-preview.result':
    'Il documento è sullo schermo, e gli stessi due pulsanti lo mettono in una scheda del browser o sul tuo disco.',
  'help.guide.files-preview.tip.1': 'Su uno schermo touch scorri le immagini con il dito invece di cliccare le frecce.',
  'help.guide.files-preview.tip.2':
    'Un pass per il wallet non apre mai un’anteprima: viene scaricato subito, così il telefono può passarlo alla sua app wallet.',
  'help.guide.files-preview.tip.3':
    'Apri in una nuova scheda e Scarica prendono entrambi il file con la tua sessione, così un link copiato dalla barra degli indirizzi non serve a nessun altro.',
  // files-trash
  'help.guide.files-trash.title': 'Buttare via un documento, e riprenderlo',
  'help.guide.files-trash.goal':
    'Fai pulizia di ciò che al viaggio non serve più, senza perdere niente che invece ti serviva.',
  'help.guide.files-trash.step.1':
    'Clicca Elimina in fondo a una riga. Il file lascia subito l’elenco e il messaggio dice Spostato nel cestino. Niente chiede prima.',
  'help.guide.files-trash.step.2':
    'Cestino all’estremità destra della barra degli strumenti porta l’elenco su ciò che è stato buttato. L’intestazione dice Cestino e le schede dei filtri spariscono.',
  'help.guide.files-trash.step.3':
    'Una riga buttata è in grigio e le restano due pulsanti: Ripristina, che riporta indietro il file, ed Elimina, che lo toglie per sempre dopo una domanda.',
  'help.guide.files-trash.step.4':
    'Clicca Ripristina. Il messaggio dice File ripristinato e la riga lascia il cestino, con la sua nota e i suoi collegamenti ancora addosso.',
  'help.guide.files-trash.step.5':
    'Svuota cestino in alto toglie per sempre tutto ciò che resta qui, e il browser chiede una volta prima di farlo. Cestino torna ai file.',
  'help.guide.files-trash.result': 'Il file è di nuovo nell’elenco dov’era, come se niente fosse.',
  'help.guide.files-trash.tip.1':
    'Elimina su una riga non chiede prima, ed è per questo che c’è il cestino: niente lascia TREK finché non lo dici qui dentro.',
  'help.guide.files-trash.tip.2':
    'Buttare via un file e riprenderlo richiede il diritto Eliminare file. Un membro che non ce l’ha non vede né Elimina sulla riga né i pulsanti nel cestino.',
  'help.guide.files-trash.tip.3': 'Un file eliminato per sempre nel cestino non può essere riportato indietro.',
  // files-sync
  'help.guide.files-sync.title': 'Tenere i documenti allineati con il tuo archivio di documenti',
  'help.guide.files-sync.goal':
    'Lega il viaggio al tuo archivio di documenti, così che ciò che viene caricato qui finisca lì e ciò che viene archiviato lì compaia qui.',
  'help.guide.files-sync.step.1':
    'Clicca Sincronizzazione documenti, accanto a Cestino all’estremità destra della barra degli strumenti. La finestra si apre con il nome del viaggio sotto il titolo. A sinistra, sotto Collega un provider, stanno gli archivi che un amministratore ha acceso, ognuno con una riga su come archivia: Paperless-ngx e Papra per tag, Nextcloud e Synology Drive in una cartella, OpenCloud in uno spazio. A destra si legge Ancora nessun collegamento.',
  'help.guide.files-sync.step.2':
    'Clicca il tuo archivio, qui Nextcloud. Si apre una finestra più piccola per la connessione, con il nome dell’archivio, che chiede le credenziali con cui si accede a quell’archivio.',
  'help.guide.files-sync.step.3':
    'Compila Indirizzo e l’accesso proprio dell’archivio: un Token API per Paperless-ngx, una Chiave API e l’ID organizzazione per Papra, Nome utente e una Password per applicazioni per Nextcloud, Nome utente e un Token applicativo per OpenCloud, e per Synology Drive Nome utente, Password e, se l’account lo chiede, un Codice a due fattori. Usa una password per applicazioni o un token ovunque l’archivio ne offra uno, mai la password del tuo account. Nextcloud e Synology Drive accettano anche una Cartella di base facoltativa, dove TREK cerca le cartelle dei viaggi, qui /Reisen. Accetta un certificato autofirmato in fondo è solo per un archivio sulla tua rete con un certificato del genere.',
  'help.guide.files-sync.step.4':
    'Clicca Prova la connessione. TREK raggiunge l’archivio con ciò che hai digitato e il piè di pagina dice Raggiunto, accesso come seguito dal nome dell’account. Credenziali rifiutate o un indirizzo irraggiungibile vengono nominati lì al loro posto, e in entrambi i casi non viene salvato nulla.',
  'help.guide.files-sync.step.5':
    'Clicca Connetti. La connessione viene salvata con il viaggio e TREK chiede dove deve stare il viaggio nell’archivio: il tag, la cartella o lo spazio che ne contiene i documenti. Solo ciò che sta lì dentro viene sincronizzato. Creane uno nuovo lo crea con Crea, con un nome precompilato dal titolo del viaggio; sotto Oppure usane uno che hai già stanno quelli che esistono già. Cliccane uno, qui la cartella Autumn in Japan.',
  'help.guide.files-sync.step.6':
    'La finestra è tornata: il tuo archivio sta sotto Questo viaggio a sinistra, e la sua scheda a destra porta dove sincronizza, quando è girata l’ultima volta e Sincronizza ora. Una prima esecuzione parte da sola; Sincronizza ora ne lancia una quando vuoi. Finita un’esecuzione, il contrassegno Non ancora sincronizzato accanto al nome lascia il posto a un punto verde, Allineato quando ci punti sopra, e la barra di flusso conta i documenti che TREK e l’archivio tengono ciascuno, con le corsie Verso l’archivio e Dall’archivio in mezzo. Chiudi la finestra con la ×.',
  'help.guide.files-sync.result':
    'I documenti che erano già lì stanno in cima all’elenco, caricati a tuo nome, e ogni documento del viaggio è anche nell’archivio. Da ora in poi TREK controlla l’archivio in secondo piano e l’archivio segue l’elenco.',
  'help.guide.files-sync.tip.1':
    'Solo il proprietario del viaggio o un amministratore dell’istanza può legare un viaggio, perché le credenziali raggiungono tutto quell’account nell’archivio. Ogni membro può aprire Sincronizzazione documenti, leggere la scheda e premere Sincronizza ora.',
  'help.guide.files-sync.tip.2':
    'Un archivio sulla tua rete ha bisogno di ALLOW_INTERNAL_NETWORK=true sul server TREK, e il suo indirizzo dev’essere quello della macchina in rete, mai localhost. Senza, Prova la connessione risponde Questo indirizzo non è consentito.',
  'help.guide.files-sync.tip.3':
    'Disconnetti sulla scheda chiude l’abbinamento e tiene ogni documento da entrambe le parti. Un tag, una cartella o uno spazio legato una seconda volta è trattato come nuovo, e tutto ciò che contiene entra di nuovo, quindi dopo un Disconnetti lega uno vuoto invece del vecchio.',

  // ── Screen: trip-day-detail ───────────────────────────────────────────────────────────
  'help.ctx.trip-day-detail.title': 'Dettagli del giorno',
  'help.ctx.trip-day-detail.summary':
    'Il pannello che l’intestazione di un giorno apre sopra la mappa: il giorno per intero, il suo nome e la sua data, il meteo dove sarai, le prenotazioni che cadono su di esso e le notti prenotate per esso.',
  'help.ctx.trip-day-detail.bullet.1':
    'Clicca l’intestazione di un giorno nella colonna dei giorni e il pannello si apre sopra il centro della mappa. La stessa intestazione di nuovo, o la croce alla sua destra, lo chiude e lascia andare il giorno.',
  'help.ctx.trip-day-detail.bullet.2':
    'L’intestazione porta il nome del giorno e la sua data. La matita accanto al nome rinomina il giorno, il doppio chevron ripiega il pannello in una barra sottile così la mappa torna libera.',
  'help.ctx.trip-day-detail.bullet.3':
    'In cima, il meteo del giorno. Previsioni per nomina il luogo a cui si riferisce: la prima tappa del giorno, o l’alloggio in cui ti svegli.',
  'help.ctx.trip-day-detail.bullet.4':
    'Prenotazioni elenca le prenotazioni di quel giorno, ognuna con il suo tipo, la tappa a cui appartiene e i suoi orari. Verde vuol dire confermata, ambra ancora in attesa; è solo una lettura, le prenotazioni si cambiano nella scheda Prenotazioni.',
  'help.ctx.trip-day-detail.bullet.5':
    'Alloggio mostra ogni notte prenotata su questo giorno, con Check-in e Check-out nei giorni in cui avvengono, la finestra di check-in, l’ora di check-out e il numero di conferma.',
  'help.ctx.trip-day-detail.bullet.6':
    'Aggiungi alloggio prenota una notte su questo giorno: scegli la struttura tra i luoghi del viaggio, indica quali giorni copre, e aggiungi gli orari e il codice.',
  // day-panel
  'help.guide.day-panel.title': 'Aprire un giorno e leggerne i dettagli',
  'help.guide.day-panel.goal':
    'Vedere un giorno per intero, il suo meteo, le sue prenotazioni e dove dormi, senza lasciare la mappa.',
  'help.guide.day-panel.step.1':
    'Clicca l’intestazione di un giorno nella colonna dei giorni. Il giorno viene selezionato e i suoi dettagli si aprono sopra il centro della mappa.',
  'help.guide.day-panel.step.2':
    'L’intestazione nomina il giorno, Giorno 1 finché non gli dai un nome, con la sua data sotto.',
  'help.guide.day-panel.step.3':
    'In cima, il meteo del giorno. Previsioni per dice a quale luogo si riferisce: la prima tappa del giorno, o l’alloggio in cui ti svegli.',
  'help.guide.day-panel.step.4':
    'Prenotazioni sotto elenca le prenotazioni che cadono su questo giorno, con i loro orari.',
  'help.guide.day-panel.step.5':
    'Alloggio mostra le notti prenotate su questo giorno, con Check-in e Check-out nei giorni in cui avvengono.',
  'help.guide.day-panel.step.6':
    'Il doppio chevron nell’intestazione ripiega il pannello in una barra sottile. La croce accanto chiude il pannello e lascia andare il giorno.',
  'help.guide.day-panel.result':
    'Ripiegato nella sua barra il pannello lascia libera la mappa e tiene il giorno selezionato; chiuso, il giorno è deselezionato e il programma è come prima.',
  'help.guide.day-panel.tip.1':
    'Anche cliccare in un punto qualsiasi della barra di intestazione del pannello lo ripiega. Il chevron ne è soltanto il pulsante.',
  'help.guide.day-panel.tip.2':
    'Aprire un luogo dalla colonna dei luoghi mette i dettagli del luogo al posto del pannello. Chiudili e il giorno torna.',
  // day-weather
  'help.guide.day-weather.title': 'Leggere il meteo del giorno',
  'help.guide.day-weather.goal': 'Sapere come sarà il giorno là dove ti trovi davvero quel giorno.',
  'help.guide.day-weather.step.1':
    'Previsioni per nomina il luogo a cui si riferiscono i numeri: la prima tappa del giorno o, in un giorno senza tappe, l’alloggio in cui ti svegli.',
  'help.guide.day-weather.step.2':
    'Il numero grande è la temperatura del giorno, accanto la minima e la massima, e la condizione a parole.',
  'help.guide.day-weather.step.3':
    'I chip sotto: la probabilità di pioggia, quanta ne cade, il vento più forte, e alba e tramonto.',
  'help.guide.day-weather.step.4':
    'In fondo, il giorno ora per ora, ogni due ore: l’ora, l’icona, la temperatura e la probabilità di pioggia. Un’ora oltre il 50 per cento è ombreggiata di blu.',
  'help.guide.day-weather.result':
    'Il riquadro del giorno nella colonna dei giorni porta lo stesso meteo in piccolo sotto il suo numero, così l’intero viaggio si legge a colpo d’occhio.',
  'help.guide.day-weather.tip.1':
    'Gradi e vento seguono Unità di Temperatura, sotto Visualizzazione nelle Impostazioni: scegli °F Fahrenheit e la stessa previsione viene data in °F e mph.',
  'help.guide.day-weather.tip.2':
    'Un giorno senza tappe localizzate e senza un alloggio in cui svegliarsi non mostra alcun meteo: la previsione è sempre per un luogo, mai per il viaggio.',
  'help.guide.day-weather.tip.3':
    'Oltre i 16 giorni non c’è previsione da avere. I numeri sono allora le medie degli anni passati per quella data, contrassegnate con Ø e segnalate come tali qui sotto.',
  // rename-day
  'help.guide.rename-day.title': 'Dare un nome al giorno',
  'help.guide.rename-day.goal':
    'Chiamare un giorno per quello che è, Arrivo a Kyoto o Giorno di riposo, invece di Giorno 5.',
  'help.guide.rename-day.step.1': 'Apri il giorno. La sua intestazione dice Giorno 5, con la data sotto.',
  'help.guide.rename-day.step.2': 'Clicca la matita accanto al nome.',
  'help.guide.rename-day.step.3': 'Il nome diventa un campo. Digita il nome che vuoi.',
  'help.guide.rename-day.step.4':
    'Premi Invio, o clicca semplicemente altrove; Esc butta via la modifica. Anche il riquadro del giorno nella colonna dei giorni porta il nome.',
  'help.guide.rename-day.result':
    'Il nome sostituisce Giorno 5 nel pannello e sul riquadro del giorno nella colonna dei giorni; la data resta dov’era.',
  'help.guide.rename-day.tip.1':
    'Svuota il campo e salva, e il giorno torna a essere Giorno 5: il numero è ciò che compare quando non c’è un nome.',
  'help.guide.rename-day.tip.2':
    'Il nome appartiene al giorno, non alla sua data. Riordina i giorni e il nome viaggia con tutto il resto di quel giorno.',
  // add-accommodation
  'help.guide.add-accommodation.title': 'Prenotare una notte su un giorno',
  'help.guide.add-accommodation.goal':
    'Mettere l’hotel nel programma una volta sola, con i giorni che copre, i suoi orari e il suo numero di conferma.',
  'help.guide.add-accommodation.step.1':
    'La struttura deve prima essere un luogo del viaggio. Creala nella colonna dei luoghi come faresti con qualsiasi altro luogo: il selettore offre solo ciò che c’è già.',
  'help.guide.add-accommodation.step.2': 'Apri il giorno del tuo arrivo e clicca Aggiungi alloggio sotto Alloggio.',
  'help.guide.add-accommodation.step.3':
    'Applica ai giorni dice quali notti copre il soggiorno: il giorno di check-in a sinistra, il giorno di check-out a destra. Tutti prende l’intero viaggio.',
  'help.guide.add-accommodation.step.4':
    'Compila Check-in, Fino a e Check-out, e metti il numero della prenotazione sotto Conferma. Tutti e quattro possono restare vuoti.',
  'help.guide.add-accommodation.step.5':
    'Scegli la struttura tra i luoghi del viaggio. I chip sopra la lista la restringono a una sola categoria.',
  'help.guide.add-accommodation.step.6': 'Clicca Salva.',
  'help.guide.add-accommodation.result':
    'Il soggiorno compare su ogni giorno che copre, Check-in sul primo e Check-out sull’ultimo. La struttura diventa una tappa del giorno di check-in, così la mappa disegna la via fin lì, e nella scheda Prenotazioni compare una prenotazione di tipo Alloggio.',
  'help.guide.add-accommodation.tip.1':
    'Il selettore si apre sul giorno da cui sei venuto, con il check-out il giorno dopo; entrambi si possono spostare prima di salvare.',
  'help.guide.add-accommodation.tip.2':
    'Dai all’hotel la categoria Hotel del viaggio quando lo crei e i chip sopra la lista la restringono ai tuoi hotel con un clic.',
  'help.guide.add-accommodation.tip.3':
    'Gli orari sono tutti facoltativi: un soggiorno senza check-in e senza codice copre comunque le sue notti e disegna comunque il suo percorso.',
  // edit-accommodation
  'help.guide.edit-accommodation.title': 'Cambiare o cancellare una notte prenotata',
  'help.guide.edit-accommodation.goal':
    'Spostare un soggiorno, correggerne gli orari, o toglierlo di nuovo dal programma.',
  'help.guide.edit-accommodation.step.1':
    'Su ogni giorno del soggiorno il riquadro mostra la struttura, la finestra di check-in, l’ora di check-out e il numero di conferma.',
  'help.guide.edit-accommodation.step.2':
    'La matita alla sua destra riapre il soggiorno. La finestra ora si intitola Modifica alloggio.',
  'help.guide.edit-accommodation.step.3':
    'Correggi la riga di campi: Check-in, Fino a, Check-out e Conferma. I giorni sopra e la struttura sotto si cambiano anche qui.',
  'help.guide.edit-accommodation.step.4': 'Clicca Salva.',
  'help.guide.edit-accommodation.step.5':
    'La croce accanto alla matita pone fine al soggiorno. Non chiede nulla, e la prenotazione di tipo Alloggio che gli appartiene se ne va con lui.',
  'help.guide.edit-accommodation.result':
    'La modifica raggiunge in un colpo solo ogni giorno che il soggiorno copre, e con essa la prenotazione di tipo Alloggio nella scheda Prenotazioni.',
  'help.guide.edit-accommodation.tip.1':
    'Una notte in mezzo a un soggiorno non porta né l’etichetta Check-in né Check-out: le portano solo il primo e l’ultimo giorno dell’intervallo.',
  'help.guide.edit-accommodation.tip.2':
    'Cancellare un soggiorno porta via anche la tappa che aveva messo sul giorno di check-in e ogni costo legato alla sua prenotazione. Prenota di nuovo la notte se è stato un errore.',
  // day-bookings
  'help.guide.day-bookings.title': 'Le prenotazioni del giorno a colpo d’occhio',
  'help.guide.day-bookings.goal':
    'Vedere in un solo posto che cosa è già prenotato per questo giorno e se è confermato.',
  'help.guide.day-bookings.step.1':
    'Prenotazioni elenca le prenotazioni del giorno: quelle datate su di esso, e quelle legate a una delle sue tappe.',
  'help.guide.day-bookings.step.2':
    'Una riga mostra di che tipo di prenotazione si tratta, il suo nome e, quando appartiene a una tappa, quella tappa dopo un punto. I suoi orari stanno all’estremità destra.',
  'help.guide.day-bookings.step.3':
    'Il colore dice a che punto è una prenotazione: una riga verde è confermata, una ambra è ancora in attesa. Gli alloggi non sono in questa lista, hanno il loro blocco più sotto.',
  'help.guide.day-bookings.step.4':
    'La lista si limita a leggere le prenotazioni. Una prenotazione si crea e si cambia nella scheda Prenotazioni.',
  'help.guide.day-bookings.result':
    'Tutto ciò che è datato sul giorno, e tutto ciò che è legato a una delle sue tappe, sta in questa sola lista.',
  'help.guide.day-bookings.tip.1':
    'Una prenotazione finisce su un giorno per la sua data. Cambia la data nella scheda Prenotazioni e passa all’altro giorno da sola.',
  'help.guide.day-bookings.tip.2':
    'Nessun blocco Prenotazioni vuol dire che il giorno non ha prenotazioni: viene nascosto invece che mostrato vuoto.',

  // ── Screen: trip-map ──────────────────────────────────────────────────────────────────
  'help.ctx.trip-map.title': 'Mappa',
  'help.ctx.trip-map.summary':
    'Il centro del programma: ogni luogo del viaggio come segnaposto, i percorsi che li uniscono e gli interruttori lungo i bordi della mappa per il satellite, per tutto il viaggio insieme e per i luoghi intorno alla zona che stai guardando.',
  'help.ctx.trip-map.bullet.1':
    'Un segnaposto è un luogo: la sua foto quando ce l’ha, altrimenti il colore della sua categoria con l’icona della categoria. Poggiaci sopra il puntatore per una scheda con il nome e l’indirizzo, più la categoria e la valutazione quando il luogo le porta. Trascina un segnaposto su una scheda del giorno per pianificare lì il luogo.',
  'help.ctx.trip-map.bullet.2':
    'I segnaposto troppo vicini per distinguersi si ripiegano in una bolla scura con un conteggio. Clicca la bolla e la mappa si avvicina a ciò che c’è dentro.',
  'help.ctx.trip-map.bullet.3':
    'Clicca un segnaposto per aprire il luogo sotto la mappa, con la sua valutazione, i suoi file e cosa farne poi; clicca un punto vuoto della mappa per lasciarlo andare di nuovo.',
  'help.ctx.trip-map.bullet.4':
    'Con un giorno aperto nella colonna dei giorni, le sue tappe portano un piccolo distintivo bianco con il loro numero in quel giorno, e un luogo pianificato su due giorni porta entrambi i numeri, uniti da ·.',
  'help.ctx.trip-map.bullet.5':
    'La riga di icone in alto cerca nella parte di mappa che vedi: Ristoranti, Caffè, Bar e vita notturna, Alloggi, Attrazioni, Musei e cultura, Natura e parchi e Attività. Cerca in questa zona la rilancia dopo che hai spostato la mappa.',
  'help.ctx.trip-map.bullet.6':
    'Un clic destro in un punto qualsiasi della mappa apre il modulo del luogo in quel punto, con l’indirizzo già cercato. Il pulsante rotondo in basso a sinistra scambia la mappa disegnata con le immagini aeree.',
  'help.ctx.trip-map.bullet.7':
    'Mostra tutto il viaggio, in basso a destra, disegna ogni giornata di spostamento insieme alle altre ed elenca cosa copre ciascuna; l’icona del percorso sulla riga di una prenotazione disegna quella prenotazione, e quella nella barra degli strumenti sopra i giorni le disegna tutte.',
  // map-markers
  'help.guide.map-markers.title': 'Leggere la mappa',
  'help.guide.map-markers.goal': 'Sapere cosa ti dice ogni segnaposto, distintivo e bolla sulla mappa.',
  'help.guide.map-markers.step.1':
    'La mappa porta ogni luogo del viaggio. Dove i segnaposto stanno troppo vicini per distinguersi, si ripiegano in una bolla scura che porta il numero al suo interno; clicca la bolla e la mappa si avvicina a ciò che c’era dentro, oppure, allo zoom più profondo, apre i segnaposto a ventaglio.',
  'help.guide.map-markers.step.2':
    'Un segnaposto è la foto del luogo quando ce l’ha, altrimenti il colore della sua categoria con l’icona della categoria. Poggiaci sopra il puntatore e una scheda dà il nome e l’indirizzo, con la categoria e la valutazione quando il luogo le porta.',
  'help.guide.map-markers.step.3':
    'Clicca un segnaposto e il luogo si apre in una scheda sotto la mappa: le sue coordinate, la sua valutazione, i suoi file, e in fondo che cosa farne poi, tra cui Navigazione, Modifica ed Elimina, con Aggiungi al giorno finché un giorno è aperto. Clicca un punto vuoto della mappa per lasciarlo andare di nuovo.',
  'help.guide.map-markers.step.4':
    'Apri un giorno nella colonna dei giorni e le sue tappe vengono numerate: il piccolo distintivo bianco all’angolo di un segnaposto è il posto di quella tappa nel giorno. Un luogo pianificato su due giorni porta entrambi i numeri, uniti da ·. Senza un giorno aperto non ci sono numeri, e l’angolo porta invece la valutazione.',
  'help.guide.map-markers.step.5':
    'Trascina un segnaposto dalla mappa su una scheda del giorno nella colonna dei giorni e il luogo è pianificato in quel giorno, esattamente come trascinando la sua riga fuori dalla lista dei luoghi.',
  'help.guide.map-markers.result':
    'Nel viaggio non è cambiato nulla: la mappa ne è una vista, e ogni segnaposto dice quale luogo, quale giorno e in che ordine.',
  'help.guide.map-markers.tip.1':
    'Un giorno richiuso nella colonna dei giorni si porta via dalla mappa le sue tappe; riapri il giorno e sono di nuovo lì.',
  'help.guide.map-markers.tip.2':
    'Il filtro sopra la lista dei luoghi decide anche cosa disegna la mappa: scegli Non pianificati e restano solo i luoghi ancora senza giorno.',
  'help.guide.map-markers.tip.3':
    'Questa mappa non ha pulsanti di zoom: la rotellina ingrandisce, un doppio clic avvicina di un passo, e trascinare la mappa stessa la sposta.',
  // map-nearby-places
  'help.guide.map-nearby-places.title': 'Trovare luoghi intorno a te sulla mappa',
  'help.guide.map-nearby-places.goal':
    'Lascia che la mappa cerchi ristoranti, attrazioni o un hotel nella zona che stai guardando, e portane uno nel viaggio.',
  'help.guide.map-nearby-places.step.1':
    'La riga di icone in cima alla mappa è la ricerca per categoria: Ristoranti, Caffè, Bar e vita notturna, Alloggi, Attrazioni, Musei e cultura, Natura e parchi e Attività.',
  'help.guide.map-nearby-places.step.2':
    'Clicca una categoria. TREK cerca quel tipo di luogo nella parte di mappa che vedi e posa un segnaposto nel colore della categoria per ogni risultato. Una categoria alla volta: cliccarne un’altra la scambia, e cliccare quella attiva la spegne.',
  'help.guide.map-nearby-places.step.3':
    'Sposta la mappa e sotto la riga compare un secondo pulsante: Cerca in questa zona rilancia la stessa ricerca per la nuova vista. Spostarla da sola non cerca mai di nuovo, e così le richieste restano poche.',
  'help.guide.map-nearby-places.step.4':
    'I segnaposto portano il nome di ciò che è stato trovato. Cliccane uno e il modulo del luogo si apre già compilato da esso: Nome, Indirizzo, Latitudine e Longitudine, e il sito web e il numero di telefono dove OpenStreetMap li ha.',
  'help.guide.map-nearby-places.step.5':
    'Controlla cosa è stato compilato e aggiungi ciò che la ricerca non poteva sapere: una Descrizione, una Categoria, note tue.',
  'help.guide.map-nearby-places.step.6':
    'Clicca Aggiungi. Se un luogo con lo stesso nome è già nel viaggio, il modulo lo dice e il pulsante diventa Aggiungi comunque.',
  'help.guide.map-nearby-places.result':
    'Il luogo è nella lista dei luoghi e sulla mappa come uno dei segnaposto propri del viaggio, sotto Non pianificati finché non lo metti su un giorno. I segnaposto della ricerca restano finché non spegni la categoria.',
  'help.guide.map-nearby-places.tip.1':
    'La riga non c’è quando Esplora luoghi sulla mappa è spento nelle Impostazioni, sotto Travel & map.',
  'help.guide.map-nearby-places.tip.2':
    'Le risposte arrivano dall’indice dei luoghi di TREK e da OpenStreetMap, quindi è una delle poche cose del programma che ha bisogno di una connessione.',
  'help.guide.map-nearby-places.tip.3':
    'Una ricerca copre ciò che è sullo schermo, quindi avvicinati alla via di cui stai chiedendo: una città intera risponde con i primi sessanta risultati e con poco ordine.',
  // map-add-place
  'help.guide.map-add-place.title': 'Creare un luogo con un clic destro sulla mappa',
  'help.guide.map-add-place.goal': 'Metti un luogo esattamente dove lo vuoi, senza cercarlo prima.',
  'help.guide.map-add-place.step.1':
    'Fai clic destro sul punto della mappa che intendi. Il modulo del luogo si apre, con il titolo Aggiungi Luogo/Attività.',
  'help.guide.map-add-place.step.2':
    'Latitudine e Longitudine sono già su quel punto, e TREK cerca le coordinate e riempie Indirizzo con ciò che trova lì, e anche Nome quando la ricerca ne dà uno. Non è ancora salvato niente, quindi sovrascrivi tutto ciò che è sbagliato.',
  'help.guide.map-add-place.step.3':
    'Dagli un Nome che riconoscerai, e il resto di ciò che il programma deve sapere: Descrizione, Note, Categoria, Sito web.',
  'help.guide.map-add-place.step.4':
    'Clicca Aggiungi. Il luogo finisce nella lista come non pianificato anche con un giorno aperto: un clic destro sulla mappa dice dove, non quando.',
  'help.guide.map-add-place.result':
    'Il luogo è nella lista e sulla mappa, sotto Non pianificati finché non lo metti su un giorno.',
  'help.guide.map-add-place.tip.1':
    'L’indirizzo viene da una ricerca delle coordinate, quindi può leggersi come una via invece che come un nome, e in aperta campagna può tornare vuoto. Tutti e due i campi sono tuoi da sovrascrivere.',
  'help.guide.map-add-place.tip.2':
    'Sulle mappe MapLibre GL e Mapbox GL un clic centrale fa lo stesso, e su uno schermo touch una pressione lunga.',
  // map-satellite
  'help.guide.map-satellite.title': 'Passare al satellite',
  'help.guide.map-satellite.goal': 'Scambia la mappa disegnata con le immagini aeree, e torna indietro.',
  'help.guide.map-satellite.step.1':
    'Il pulsante rotondo in basso a sinistra della mappa è l’interruttore del livello di base. La sua icona mostra sempre il livello verso cui passerebbe, e passandoci sopra dice quale: Passa alla vista satellitare. Cliccalo.',
  'help.guide.map-satellite.step.2':
    'Ora la mappa è immagine aerea, abbastanza dettagliata da distinguere un singolo edificio e senza una chiave tua. Tutto ciò che TREK disegna resta sopra: i segnaposto, il percorso del giorno, le tracce e i percorsi prenotati.',
  'help.guide.map-satellite.step.3':
    'Il pulsante ora dice Passa alla vista mappa. Cliccalo per tornare alla mappa disegnata.',
  'help.guide.map-satellite.result':
    'La mappa è di nuovo disegnata, e il livello su cui l’hai lasciata viene ricordato nel tuo account.',
  'help.guide.map-satellite.tip.1':
    'La scelta resta sul tuo account e non sul viaggio, quindi ogni viaggio si apre come lo hai lasciato, qualunque motore di mappe tu usi.',
  'help.guide.map-satellite.tip.2':
    'Le immagini non portano scritte: i nomi delle vie, i quartieri e i numeri civici stanno sulla mappa disegnata, quindi torna indietro quando cerchi un indirizzo.',
  // map-whole-trip
  'help.guide.map-whole-trip.title': 'Vedere tutto il viaggio e le sue distanze',
  'help.guide.map-whole-trip.goal':
    'Scambia l’unico giorno aperto con ogni giornata di spostamento del viaggio, e leggi quanto lontano arriva ciascuna.',
  'help.guide.map-whole-trip.step.1':
    'Il pulsante rotondo Mostra tutto il viaggio sta in basso a destra della mappa. Cliccalo e ogni giornata di spostamento del viaggio viene disegnata insieme alle altre, ciascuna nel proprio colore sopra un bordo bianco, così i giorni vicini restano distinti.',
  'help.guide.map-whole-trip.step.2':
    'La scheda sopra il pulsante elenca quelle giornate: un punto colorato, il nome del giorno, un’icona per ogni modo in cui lo percorri, e la distanza che copre. Distanza totale sta in cima.',
  'help.guide.map-whole-trip.step.3':
    'Clicca un giorno nella scheda per selezionarlo, come se lo scegliessi nella colonna dei giorni: la mappa inquadra quel giorno, e le sue tappe riprendono i loro numeri.',
  'help.guide.map-whole-trip.step.4':
    'Il pulsante ora dice Nascondi tutto il viaggio. Premilo per tornare all’unico giorno aperto.',
  'help.guide.map-whole-trip.result':
    'Ogni giornata di spostamento è disegnata nel proprio colore, e la scheda dice cosa copre ciascuna e a quanto arriva il viaggio.',
  'help.guide.map-whole-trip.tip.1':
    'Il totale arriva poche tratte per volta. Finché lo segue un …, il numero è ancora una somma parziale; si ferma una volta che ogni tratta ha risposto.',
  'help.guide.map-whole-trip.tip.2':
    'Una tratta che il router rifiuta resta una linea dritta e non conta nulla, e la scheda lo dice invece di mostrare in silenzio un numero troppo basso.',
  'help.guide.map-whole-trip.tip.3':
    'Un giorno con meno di due tappe localizzate non ha un percorso da disegnare, quindi resta del tutto fuori dalla scheda.',
  // map-booking-routes
  'help.guide.map-booking-routes.title': 'Mostrare il percorso di una prenotazione sulla mappa',
  'help.guide.map-booking-routes.goal':
    'Disegna sulla mappa i voli, i treni e i tragitti in auto che hai prenotato, e toglili di nuovo.',
  'help.guide.map-booking-routes.step.1':
    'I percorsi prenotati sono spenti finché non ne chiedi uno. Sulla riga di una prenotazione nella colonna dei giorni sta una piccola icona di percorso: Mostra percorsi prenotati.',
  'help.guide.map-booking-routes.step.2':
    'Cliccala e la prenotazione compare sulla mappa: un volo come arco di cerchio massimo, un tragitto in auto lungo le strade vere, un treno come la catena delle sue stazioni. Confermata è disegnata continua, In attesa tratteggiata, e le estremità del percorso sono pillole blu con l’icona del trasporto.',
  'help.guide.map-booking-routes.step.3':
    'Clicca una pillola di estremità e si apre la prenotazione dietro di essa, con i suoi orari, il suo riferimento e il punto da cui parte. Chiudi la mette via di nuovo.',
  'help.guide.map-booking-routes.step.4':
    'L’icona del percorso nella barra degli strumenti sopra i giorni fa tutto il viaggio in una volta: Mostra tutti i percorsi prenotati disegna ogni prenotazione che ne ha uno.',
  'help.guide.map-booking-routes.step.5':
    'È un foglio pulito e non uno strato sopra, quindi ciò che avevi scelto prenotazione per prenotazione viene lasciato cadere. Premila di nuovo, ora che dice Nascondi tutti i percorsi prenotati, e la mappa è pulita.',
  'help.guide.map-booking-routes.result':
    'Le prenotazioni che hai chiesto sono disegnate sulla mappa, e la scelta resta per questo viaggio in questo browser finché non la cambi.',
  'help.guide.map-booking-routes.tip.1':
    'Le estremità portano il codice dell’aeroporto o il nome della stazione solo quando Etichette percorsi prenotati è attivo nelle Impostazioni, sotto Travel & map; altrimenti mostrano solo l’icona.',
  'help.guide.map-booking-routes.tip.2':
    'Mostra sempre i percorsi delle prenotazioni, nelle stesse impostazioni, li disegna fin dall’inizio su ogni viaggio per cui non hai già deciso.',
  'help.guide.map-booking-routes.tip.3':
    'Una prenotazione ha bisogno di due estremità con coordinate prima di poter essere disegnata, quindi un hotel o un ristorante non porta l’icona del percorso.',
  'help.ctx.trip-map.bullet.8':
    'Con l’addon Dawarich acceso, il pulsante rotondo Dawarich sotto Mostra tutto il viaggio disegna il percorso che il tuo telefono ha davvero registrato: Mostra il percorso registrato lo posa tratteggiato sotto il percorso pianificato, un colore per giorno, e l’etichetta del pulsante dice perché non c’è una linea quando non c’è.',
  // map-dawarich-trail
  'help.guide.map-dawarich-trail.title': 'Mostrare il percorso che hai davvero fatto',
  'help.guide.map-dawarich-trail.goal':
    'Posa sulla mappa il percorso che Dawarich ha registrato sul tuo telefono, tratteggiato accanto a quello che avevi pianificato, e leggi il viaggio giorno per giorno com’è andato davvero.',
  'help.guide.map-dawarich-trail.step.1':
    'Il pulsante rotondo Dawarich sta in basso a destra della mappa, sotto Mostra tutto il viaggio; passandoci sopra dice Mostra il percorso registrato. Cliccalo. TREK chiede al tuo Dawarich le date del viaggio, e un anello gira intorno al pulsante mentre la risposta è in arrivo.',
  'help.guide.map-dawarich-trail.step.2':
    'Il percorso registrato arriva come linea tratteggiata, un colore per giorno, disegnata sotto il percorso pianificato così che il programma resti leggibile. Il pulsante ora dice Nascondi il percorso registrato. I giorni sono tagliati alla mezzanotte locale, e un giorno richiuso nella colonna dei giorni toglie dalla mappa la sua linea tratteggiata insieme alle sue tappe.',
  'help.guide.map-dawarich-trail.step.3':
    'Clicca anche Mostra tutto il viaggio e ogni giorno pianificato è disegnato a linea continua accanto alla registrazione tratteggiata. Dove le due corrono insieme, il giorno è andato come previsto; dove la linea tratteggiata si allontana è dove non lo è.',
  'help.guide.map-dawarich-trail.result':
    'Ciò che avevi pianificato e ciò che hai fatto davvero sono insieme sulla mappa, tratteggiato contro continuo, e la scheda sopra i pulsanti elenca ancora i giorni pianificati e le loro distanze.',
  'help.guide.map-dawarich-trail.tip.1':
    'Acceso o spento viene ricordato per viaggio per questa sessione del browser. Finché il percorso è acceso, TREK interroga di nuovo Dawarich ogni due minuti, così un viaggio in corso si aggiorna senza ricaricare; il percorso in sé non viene mai salvato, quindi non è nel database di TREK, non è nei backup e non c’è offline.',
  'help.guide.map-dawarich-trail.tip.2':
    'L’etichetta del pulsante spiega una mappa vuota: Caricamento del percorso registrato… mentre è in arrivo, In queste date non è stato registrato nulla, Impossibile caricare il percorso registrato, oppure Il percorso registrato richiede una connessione quando TREK è offline.',
  // map-compass
  'help.guide.map-compass.title': 'Ruotare la mappa e ritrovare il nord',
  'help.guide.map-compass.goal':
    'Ruota la mappa perché guardi nella direzione in cui vai, e riportala a nord con un clic.',
  'help.guide.map-compass.step.1':
    'Ruota la mappa trascinando con il tasto destro, oppure tieni premuto Ctrl e trascina con il sinistro; su uno schermo touch, ruota con due dita. La bussola rotonda accanto alla riga di icone di categoria in cima alla mappa ruota con lei: la sua freccia punta sempre a nord, quindi si inclina tanto quanto hai ruotato.',
  'help.guide.map-compass.step.2':
    'Clicca la bussola. Reset north, così si chiama il pulsante, riporta dolcemente la mappa con il nord in alto e a una vista piatta, e la freccia torna dritta.',
  'help.guide.map-compass.result':
    'La mappa è di nuovo orientata a nord e piatta, e nulla del viaggio è cambiato: la bussola muove solo la camera.',
  'help.guide.map-compass.tip.1':
    'La bussola esiste solo sulle mappe MapLibre GL e Mapbox GL; la mappa Leaflet non si può ruotare, quindi non ce l’ha. Provider mappa in Impostazioni, sotto Mappa, decide quale usi, e Salva Mappa tiene la scelta.',
  'help.guide.map-compass.tip.2':
    'Il clic toglie anche l’inclinazione: un trascinamento su o giù con il tasto destro inclina la vista, e Reset north la rimette in piano insieme alla rotazione. Su Mapbox GL con Edifici 3D e terreno acceso, questo appiattisce anche la vista 3D, finché non la inclini di nuovo.',

  // ── Screen: trip-collab ───────────────────────────────────────────────────────────────
  'help.ctx.trip-collab.title': 'Collaborazione',
  'help.ctx.trip-collab.summary':
    'La scheda in cui il gruppo pianifica insieme: la chat a sinistra, accanto le note condivise e i link, sotto i sondaggi e alla fine Cosa c’è dopo. Tutto quello che si scrive qui è subito sullo schermo di ogni altro membro, senza ricaricare.',
  'help.ctx.trip-collab.bullet.1':
    'La chat è la colonna di sinistra. Scrivi in Scrivi un messaggio... e premi Enter; Shift e Enter vanno a capo. Lo smiley inserisce un emoji, Allega immagini attacca fino a quattro immagini al messaggio.',
  'help.ctx.trip-collab.bullet.2':
    'Passa il mouse su un messaggio per Rispondi e, sui tuoi, Elimina; con il clic destro escono le otto reazioni rapide. Un messaggio eliminato lascia una riga che dice che lo hai eliminato.',
  'help.ctx.trip-collab.bullet.3':
    'Note è il blocco condiviso: Nuova nota ne scrive una, e l’ingranaggio accanto apre Gestisci categorie per i loro nomi e colori. Una scheda porta Espandi, Fissa, Modifica ed Elimina.',
  'help.ctx.trip-collab.bullet.4':
    'Link raccoglie gli indirizzi su cui gira il viaggio. Aggiungi link prende un titolo e un indirizzo http o https; Modifica link, Fissa link ed Elimina link stanno in fondo al chip, e i link fissati restano davanti.',
  'help.ctx.trip-collab.bullet.5':
    'Sondaggi decide le cose. Nuovo sondaggio pone una domanda con almeno due opzioni; un clic su un’opzione è il tuo voto, Chiudi termina la votazione ed Elimina toglie il sondaggio.',
  'help.ctx.trip-collab.bullet.6':
    'Cosa c’è dopo elenca le tappe del viaggio ancora davanti, fino a otto, con i loro orari e le persone che ci sono. Legge solo il programma del giorno; gli orari si impostano lì.',
  // write-note
  'help.guide.write-note.title': 'Scrivere una nota condivisa',
  'help.guide.write-note.goal':
    'Metti quello che serve a tutto il gruppo, una regola, un indirizzo, un promemoria, dove ognuno lo ritrova.',
  'help.guide.write-note.step.1': 'Clicca Nuova nota in cima al pannello Note. Si apre il modulo.',
  'help.guide.write-note.step.2':
    'Titolo della nota è il nome che porta la scheda. È l’unica cosa su cui il modulo insiste: Crea resta grigio finché è vuoto.',
  'help.guide.write-note.step.3':
    'Il riquadro grande sotto contiene il testo e accetta Markdown: una parola in grassetto, un elenco, un titolo. La scheda mostra le prime righe, ed Espandi su di essa apre tutta la nota.',
  'help.guide.write-note.step.4':
    'Sotto Categoria scegli quella a cui appartiene la nota; il suo colore diventa il colore della scheda. Le pillole sono le categorie che esistono già, e una nuova si crea sotto Gestisci categorie.',
  'help.guide.write-note.step.5':
    'Sito web prende un link che appartiene alla nota. La scheda porta allora un riquadro Link che lo apre.',
  'help.guide.write-note.step.6': 'Clicca Crea.',
  'help.guide.write-note.result':
    'La nota è una scheda nel pannello Note, nel colore della sua categoria, ed è già sullo schermo di ogni altro membro.',
  'help.guide.write-note.tip.1':
    'Fissa su una scheda la tiene in cima al pannello; tutto quello che sta sotto è ordinato per ultima modifica.',
  'help.guide.write-note.tip.2':
    'L’ingranaggio accanto a Nuova nota apre Gestisci categorie: lì una categoria riceve il suo colore, viene rinominata ovunque in una volta, oppure viene aggiunta prima che qualche nota la usi.',
  'help.guide.write-note.tip.3':
    'Allega file attacca un documento alla nota. Allega apre il selettore di file, e un’immagine o un PDF si possono anche semplicemente incollare nel modulo.',
  'help.guide.write-note.tip.4':
    'Note è un interruttore a sé sotto Moduli, sotto Collaborazione: un amministratore può spegnerlo e lasciare accesi Chat, Link, Sondaggi e Prossimi passi.',
  // shared-links
  'help.guide.shared-links.title': 'Raccogliere i link del viaggio',
  'help.guide.shared-links.goal':
    'Tieni il portale delle prenotazioni, l’album condiviso e gli orari in un posto solo invece di cercarli scorrendo la chat.',
  'help.guide.shared-links.step.1': 'Clicca Aggiungi link in cima al pannello Link.',
  'help.guide.shared-links.step.2':
    'Dai un nome al link in Titolo del link, incolla l’indirizzo nel campo sotto, poi clicca Salva link.',
  'help.guide.shared-links.step.3':
    'Il chip mostra il nome e il sito a cui punta. Un clic su di esso apre la pagina in una nuova scheda del browser.',
  'help.guide.shared-links.step.4':
    'I tre pulsantini in fondo sono Modifica link, Fissa link ed Elimina link. Fissa link sposta il chip all’inizio del pannello; Elimina link non chiede nulla.',
  'help.guide.shared-links.result':
    'Il link è un chip nel pannello Link, fissato all’inizio, e sullo schermo di ogni membro nello stesso momento.',
  'help.guide.shared-links.tip.1':
    'Vengono accettati solo indirizzi http e https; il campo rifiuta tutto il resto prima di salvare.',
  'help.guide.shared-links.tip.2':
    'I link fissati vengono per primi, poi i più recenti. L’iconcina accanto a un titolo è la favicon del sito, presa dal sito stesso, quindi senza internet il chip mostra al suo posto un semplice simbolo di link.',
  'help.guide.shared-links.tip.3':
    'Link è un interruttore a sé sotto Moduli, sotto Collaborazione, quindi un amministratore può spegnere il pannello senza toccare il resto della scheda.',
  // create-poll
  'help.guide.create-poll.title': 'Chiedere al gruppo',
  'help.guide.create-poll.goal':
    'Trasforma una domanda a cui nella chat non risponde nessuno in un sondaggio che tutti possono spuntare.',
  'help.guide.create-poll.step.1': 'Clicca Nuovo sondaggio in cima al pannello Sondaggi.',
  'help.guide.create-poll.step.2':
    'Scrivi la domanda. Markdown supportato sotto il riquadro significa che qui funzionano una parola in grassetto, un a capo o un breve elenco.',
  'help.guide.create-poll.step.3': 'Compila Opzione 1 e Opzione 2. Due opzioni con qualcosa dentro sono il minimo.',
  'help.guide.create-poll.step.4':
    '+ Aggiungi opzione ne aggiunge una terza, una quarta, quante ne servono; la crocetta accanto a una riga ne toglie una.',
  'help.guide.create-poll.step.5':
    'Scelta multipla lascia che ognuno spunti più di un’opzione. Lasciata spenta, un voto si sposta quando qualcuno sceglie altro.',
  'help.guide.create-poll.step.6': 'Clicca Crea sondaggio.',
  'help.guide.create-poll.result':
    'Il sondaggio sta in cima al pannello Sondaggi, aperto, e non ha ancora votato nessuno.',
  'help.guide.create-poll.tip.1': 'La domanda viene resa come Markdown; le opzioni restano testo semplice.',
  'help.guide.create-poll.tip.2':
    'Crea sondaggio resta grigio finché non ci sono una domanda e almeno due opzioni con qualcosa dentro.',
  'help.guide.create-poll.tip.3':
    'Una scadenza si può impostare solo nell’app per telefono. Un sondaggio che ne ha una mostra qui il tempo rimasto in un chip ambra e conta come chiuso appena scade.',
  'help.guide.create-poll.tip.4':
    'Sondaggi è un interruttore a sé sotto Moduli, sotto Collaborazione: un amministratore può spegnerlo e lasciare accesi gli altri quattro pannelli.',
  // vote-poll
  'help.guide.vote-poll.title': 'Votare e leggere il risultato',
  'help.guide.vote-poll.goal': 'Dai il tuo voto, guarda a che punto è il gruppo e cambia idea.',
  'help.guide.vote-poll.step.1': 'Clicca l’opzione che vuoi. Il suo cerchio si riempie e la barra dietro cresce.',
  'help.guide.vote-poll.step.2':
    'Ora tutto il risultato è leggibile: la barra è la quota, la percentuale sta a destra, e i cerchietti sono le persone che hanno scelto quell’opzione.',
  'help.guide.vote-poll.step.3':
    'Cambiato idea? Clicca un’altra opzione. In un sondaggio senza Scelta multipla il tuo voto si sposta invece di aggiungerne un secondo.',
  'help.guide.vote-poll.step.4':
    'Sotto la domanda sta quanti voti ha il sondaggio. Un clic sull’opzione che hai già scelto ritira il tuo voto, e il contatore scende.',
  'help.guide.vote-poll.result':
    'La tua spunta è su un’opzione, le barre mostrano come è diviso il gruppo, e i cerchi dicono chi ha scelto cosa.',
  'help.guide.vote-poll.tip.1':
    'Le barre e le percentuali compaiono solo dopo che hai votato tu, o una volta chiuso il sondaggio, così nessuno viene condizionato dai risultati parziali.',
  'help.guide.vote-poll.tip.2':
    'Un voto non è mai anonimo: passa il mouse su uno dei cerchi di un’opzione per il nome che c’è dietro.',
  // close-poll
  'help.guide.close-poll.title': 'Chiudere un sondaggio o toglierlo',
  'help.guide.close-poll.goal':
    'Ferma la votazione una volta che il gruppo ha deciso, e togli di mezzo un sondaggio che non serve più a nessuno.',
  'help.guide.close-poll.step.1':
    'Chiudi, il lucchetto nell’angolo di un sondaggio, termina la votazione. Le opzioni non accettano più clic.',
  'help.guide.close-poll.step.2':
    'Un sondaggio chiuso scende sotto il titolo Chiusi in fondo al pannello, porta un distintivo Chiuso e mostra a tutti il risultato, che abbiano votato o no. L’opzione vincente è tinta di verde.',
  'help.guide.close-poll.step.3':
    'Elimina, il cestino nello stesso angolo, toglie il sondaggio. Niente chiede due volte, e i voti se ne vanno con lui.',
  'help.guide.close-poll.result':
    'Il sondaggio è sparito dal pannello di ogni membro. Quello che hai solo chiuso resta leggibile in fondo, con il suo risultato.',
  'help.guide.close-poll.tip.1':
    'Chiudere non si annulla: una riapertura non c’è. Un sondaggio chiuso per sbaglio va rifatto.',
  'help.guide.close-poll.tip.2':
    'Elimina toglie a tutti il sondaggio e ogni voto che contiene, subito e senza domande.',
  // whats-next
  'help.guide.whats-next.title': 'Leggere Cosa c’è dopo',
  'help.guide.whats-next.goal': 'Guarda cosa fa il gruppo dopo senza aprire il programma.',
  'help.guide.whats-next.step.1':
    'Il pannello elenca le tappe del viaggio ancora davanti, fino a otto, in ordine di orario, sotto un titolo per giorno: Oggi, Domani o la data.',
  'help.guide.whats-next.step.2':
    'A sinistra di una riga sta il suo orario: l’inizio, a, e la fine quando la tappa ce l’ha, oppure TBD quando non è ancora impostato nessun orario.',
  'help.guide.whats-next.step.3':
    'I chip sotto il nome sono le persone su quella tappa. Se non è stato scelto nessuno, sono elencati tutti quelli del viaggio.',
  'help.guide.whats-next.result':
    'Un elenco di quello che arriva, da leggere soltanto: segue il programma, e niente qui lo cambia.',
  'help.guide.whats-next.tip.1':
    'Qui non si imposta niente. Gli orari vengono dal programma del giorno; cambiali lì e questo elenco segue subito.',
  'help.guide.whats-next.tip.2':
    'Viene elencato solo quello che è ancora davanti: una tappa il cui orario è passato esce, e alla fine di un viaggio il pannello è vuoto.',
  'help.guide.whats-next.tip.3':
    'Prossimi passi è un interruttore a sé sotto Moduli, sotto Collaborazione, ed è un pannello da desktop: la scheda Collaborazione dell’app per telefono non lo offre.',
  // trip-chat
  'help.guide.trip-chat.title': 'Parlare con il gruppo',
  'help.guide.trip-chat.goal': 'Dì qualcosa, rispondi a un messaggio preciso, reagisci a un altro e ritira il tuo.',
  'help.guide.trip-chat.step.1':
    'Scrivi in Scrivi un messaggio... e premi Enter. La freccia blu accanto al riquadro fa lo stesso; Shift e Enter vanno invece a capo.',
  'help.guide.trip-chat.step.2':
    'Lo smiley apre il selettore di emoji, con dentro Smileys, Reactions e Travel. Quello che scegli si aggiunge a ciò che stai scrivendo, non viene inviato da solo.',
  'help.guide.trip-chat.step.3':
    'Passa il mouse sul messaggio di qualcun altro: nel suo angolo compare un pulsantino rotondo. Quello è Rispondi.',
  'help.guide.trip-chat.step.4':
    'Il messaggio a cui rispondi è citato sopra il riquadro. Scrivi e invia, e la citazione viaggia nella tua bolla; la crocetta sulla citazione la lascia cadere.',
  'help.guide.trip-chat.step.5':
    'Clic destro su un messaggio per le otto reazioni rapide. La tua sta sotto la bolla, e un secondo clic sulla stessa la ritira.',
  'help.guide.trip-chat.step.6':
    'I tuoi messaggi portano Elimina accanto a Rispondi. Toglie il messaggio e lascia una riga che dice che lo hai eliminato: non si torna indietro.',
  'help.guide.trip-chat.result':
    'La tua risposta sta sotto il messaggio che cita, una reazione è appesa a un terzo, e quello che hai ritirato lascia una sola riga che lo dice.',
  'help.guide.trip-chat.tip.1':
    'Enter invia, Shift e Enter vanno a capo. Un messaggio fatto solo di emoji viene mostrato grande.',
  'help.guide.trip-chat.tip.2':
    'Allega immagini prende fino a quattro immagini per un messaggio; si possono anche solo incollare o lasciar cadere sul riquadro.',
  'help.guide.trip-chat.tip.3':
    'Un messaggio che contiene un link riceve sotto una scheda di anteprima, presa dal tuo TREK, quindi un link a qualcosa che raggiungi solo tu resta un link semplice.',
  'help.guide.trip-chat.tip.4':
    'Chat è un interruttore a sé sotto Moduli, sotto Collaborazione: un amministratore può spegnerla e lasciare accesi Note, Link, Sondaggi e Prossimi passi.',

  // ── Screen: trip-lists ────────────────────────────────────────────────────────────────
  'help.ctx.trip-lists.title': 'Liste',
  'help.ctx.trip-lists.summary':
    'Due liste per un viaggio: la lista valigia, con chi porta cosa e quanto pesa, e la lista di tutto quello che deve succedere prima e durante. La scheda c’è finché l’addon Liste è attivo.',
  'help.ctx.trip-lists.bullet.1':
    'Lista di imballaggio e Da fare in alto passano dall’una all’altra e contano che cosa c’è in ciascuna; i pulsanti a destra appartengono a quella aperta.',
  'help.ctx.trip-lists.bullet.2':
    'La lista valigia è raggruppata in liste, Documenti, Abbigliamento, comunque tu le chiami, ognuna con un punto colorato, un contatore di quanto è in valigia sul totale e tre puntini con Rinomina, Seleziona tutti, Deseleziona tutti ed Elimina lista. Aggiungi lista, nella barra sopra, ne crea una nuova.',
  'help.ctx.trip-lists.bullet.3':
    'Una riga è una casella e un nome, poi, come piccoli contrassegni, chi porta l’elemento, la quantità e il peso in grammi, e un cerchio della valigia finché Tracciamento valigia è attivo, poi il cestino e tre puntini con Sposta nella lista, Condivisione, Rinomina ed Elimina. Ciò che una riga non usa resta attenuato finché non ci passi sopra, e la maniglia a sinistra la trascina su o giù dentro la sua lista.',
  'help.ctx.trip-lists.bullet.4':
    'Condiviso e La mia lista dividono la lista valigia in due: il fondo comune che vedono tutti, e la tua. Tutti, Da fare e Fatto restringono quella aperta, e la barra sopra conta che cosa è in valigia.',
  'help.ctx.trip-lists.bullet.5':
    'Applica modello e Salva come modello riempiono o conservano una lista senza digitarla, e le due icone accanto esportano la lista, come stampa, come PDF o come file, e ne importano una. Il pulsante rosso vicino alla barra di avanzamento dice quanti elementi sono spuntati e li porta via.',
  'help.ctx.trip-lists.bullet.6':
    'Da fare ha una barra laterale propria: la scheda di avanzamento, i filtri Tutti, Le mie attività, Scaduta e Fatto, una riga per lista e sotto Aggiungi lista. Le attività stanno in una scheda la cui intestazione nomina il filtro e contiene l’ordinamento, Priorità o Scadenza. Un clic su un’attività la apre nel pannello a destra, e Nuova attività apre il modulo Nuova attività sopra il centro dello schermo.',
  // packing-categories
  'help.guide.packing-categories.title': 'Costruire la lista valigia',
  'help.guide.packing-categories.goal':
    'Raggruppa in liste quello che porti, riempile di elementi e indica chi si occupa di ogni lista.',
  'help.guide.packing-categories.step.1':
    'Clicca Aggiungi lista nella barra sopra le liste, digita il nome in Nome della lista (es. Abbigliamento) e clicca Aggiungi.',
  'help.guide.packing-categories.step.2':
    'La nuova lista parte con una riga vuota. Clicca Aggiungi elemento, digita l’elemento in Nome elemento... e premi Invio; il campo resta aperto per il successivo.',
  'help.guide.packing-categories.step.3':
    'Rinomina una riga cliccandone il nome, oppure con Rinomina nei tre puntini alla sua estremità destra.',
  'help.guide.packing-categories.step.4':
    'Il cerchio tratteggiato nell’intestazione della lista assegna membri del viaggio alla lista. Scegli un nome; il chip che compare rimuove di nuovo quella persona con un clic.',
  'help.guide.packing-categories.step.5':
    'I tre puntini in fondo all’intestazione tengono il resto: Rinomina, Seleziona tutti, Deseleziona tutti ed Elimina lista, che porta via la lista e tutto quello che contiene senza chiedere di nuovo.',
  'help.guide.packing-categories.result':
    'La nuova lista sta nella griglia con i suoi elementi sotto e il suo punto colorato, e il suo contatore dice quanto è già in valigia.',
  'help.guide.packing-categories.tip.1':
    'Una lista non è altro che i suoi elementi. Elimina l’ultimo e la riga diventa un segnaposto, così la lista tiene il suo posto e il suo colore; elimina anche quella riga e la lista sparisce.',
  'help.guide.packing-categories.tip.2':
    'Assegnare qualcuno a una lista gli manda una notifica sulla valigia. Non cambia chi può vedere gli elementi, quella è Condivisione, nei tre puntini di una riga.',
  'help.guide.packing-categories.tip.3':
    'Due liste possono portare lo stesso nome. TREK le tiene distinte internamente, quindi i nomi restano come li hai digitati.',
  // check-off-packing
  'help.guide.check-off-packing.title': 'Spuntare mentre fai la valigia',
  'help.guide.check-off-packing.goal':
    'Segna che cosa è già dentro, guarda la barra e porta via gli elementi in valigia.',
  'help.guide.check-off-packing.step.1':
    'Clicca la casella a sinistra di una riga. Il nome viene barrato e la barra si muove.',
  'help.guide.check-off-packing.step.2':
    'La barra sopra conta quello che è in valigia rispetto a tutto quello che sta sulla lista, come numero e come percentuale.',
  'help.guide.check-off-packing.step.3':
    'Una lista intera in un colpo: i tre puntini nella sua intestazione tengono Seleziona tutti e Deseleziona tutti.',
  'help.guide.check-off-packing.step.4':
    'Tutti, Da fare e Fatto restringono la griglia. Da fare lascia solo quello che manca ancora, quindi una lista del tutto in valigia ne esce.',
  'help.guide.check-off-packing.step.5':
    'Rimuovi 3 spuntati accanto alla barra di avanzamento elimina tutti gli elementi spuntati in una volta, dopo una conferma del browser.',
  'help.guide.check-off-packing.result':
    'Resta elencato solo quello che è ancora aperto, e la barra sopra dice a che punto è la valigia.',
  'help.guide.check-off-packing.tip.1': 'Un elemento spuntato si può comunque rinominare: clicca il suo nome.',
  'help.guide.check-off-packing.tip.2':
    'Seleziona tutti e Deseleziona tutti agiscono su una lista alla volta, dai tre puntini di quella lista.',
  'help.guide.check-off-packing.tip.3':
    'Quando ogni elemento è spuntato, il contatore viene sostituito da Tutto in valigia! e la barra diventa verde.',
  // apply-packing-template
  'help.guide.apply-packing-template.title': 'Applicare un modello di valigia',
  'help.guide.apply-packing-template.goal':
    'Porta nel viaggio una lista già pronta, e conserva la lista di questo viaggio per il prossimo.',
  'help.guide.apply-packing-template.step.1': 'Clicca Applica modello nella barra sopra la lista.',
  'help.guide.apply-packing-template.step.2': 'Scegli un modello. Ogni riga lo nomina e dice quanti elementi contiene.',
  'help.guide.apply-packing-template.step.3':
    'Gli elementi finiscono nella vista in cui sei: Condiviso li mette nel fondo comune che vedono tutti, La mia lista li rende tuoi.',
  'help.guide.apply-packing-template.step.4':
    'Conservare la lista di questo viaggio per il prossimo: Salva come modello apre una finestra, digita un nome e clicca Salva.',
  'help.guide.apply-packing-template.result':
    'Le liste e gli elementi del modello sono nel viaggio, accanto a quello che c’era già.',
  'help.guide.apply-packing-template.tip.1':
    'Un modello porta solo nomi e liste. Quantità, pesi, valigie e quello che è già spuntato restano indietro.',
  'help.guide.apply-packing-template.tip.2':
    'Applica modello c’è solo una volta che esiste un modello. Senza, il pulsante non compare affatto.',
  'help.guide.apply-packing-template.tip.3':
    'Salva come modello compare solo per un amministratore dell’istanza, e solo finché la lista ha elementi. Salva il fondo comune più i tuoi elementi, mai quelli privati di un altro membro.',
  // import-packing-list
  'help.guide.import-packing-list.title': 'Incollare dentro un’intera lista valigia',
  'help.guide.import-packing-list.goal':
    'Trasforma in un colpo solo una lista che hai già altrove in elementi della valigia.',
  'help.guide.import-packing-list.step.1':
    'Clicca il pulsante di importazione con la freccia in giù nella barra sopra la lista.',
  'help.guide.import-packing-list.step.2':
    'Un elemento per riga: Categoria, Nome, Peso in g (opzionale), Borsa (opzionale), checked/unchecked (opzionale). L’esempio grigio nel riquadro mostra tutte e quattro le forme. Funziona anche un elenco in Markdown: un titolo dà il nome alla lista, e "- [ ]" e "- [x]" diventano elementi.',
  'help.guide.import-packing-list.step.3':
    'Oppure carica le righe da un file con Carica CSV/TXT/MD. Accetta un .csv, un .txt o un .md e sostituisce quello che sta nel riquadro.',
  'help.guide.import-packing-list.step.4': 'Clicca Importa. Il pulsante conta le righe che ha capito.',
  'help.guide.import-packing-list.result':
    'Ogni riga diventa un elemento, nella lista che nomina il suo primo campo, e niente di quello che c’era già viene toccato.',
  'help.guide.import-packing-list.tip.1':
    'Virgole, punti e virgola e tabulazioni separano i campi allo stesso modo, e le virgolette tengono insieme un campo, così «Camicia, blu» resta un solo nome. Una riga con un unico valore è solo un nome, una riga senza una lista propria finisce in Altro, e "3x" davanti a un nome imposta la quantità.',
  'help.guide.import-packing-list.tip.2':
    'Una borsa nominata nel quarto campo viene creata se il viaggio non ce l’ha ancora. Questo è l’unico posto che carica pesi e valigie in blocco; un modello porta solo nomi e liste.',
  // export-packing-list
  'help.guide.export-packing-list.title': 'Stampare o esportare la lista valigia',
  'help.guide.export-packing-list.goal':
    'Porta la lista con te su carta, come PDF o come file per un’altra app o per il prossimo viaggio.',
  'help.guide.export-packing-list.step.1':
    'Clicca il pulsante di esportazione con la freccia in su nella barra sopra la lista.',
  'help.guide.export-packing-list.step.2':
    'Checklist in Markdown (.md) e CSV per l’importazione (.csv) salvano subito la lista come file.',
  'help.guide.export-packing-list.step.3':
    'Clicca Stampa o salva come PDF. L’anteprima mostra la lista come una pagina: in alto il viaggio e le sue date, poi ogni lista come una scheda con una casella da spuntare.',
  'help.guide.export-packing-list.step.4':
    'Clicca Stampa o salva come PDF sotto l’anteprima. Il browser apre la sua finestra di stampa: scegli una stampante, oppure Salva come PDF per tenere un file.',
  'help.guide.export-packing-list.result':
    'La stampa e i file contengono la vista aperta, Condiviso o La mia lista, con quantità, pesi e spunte.',
  'help.guide.export-packing-list.tip.1':
    'Il CSV è il formato che legge Importa, valigie comprese, quindi funziona come un tuo modello di valigia: importalo nel prossimo viaggio.',
  'help.guide.export-packing-list.tip.2':
    'Il file Markdown si apre come checklist in Obsidian, Notion o GitHub, e rientra allo stesso modo tramite Importa.',
  // share-packing-item
  'help.guide.share-packing-item.title': 'Decidere chi vede un elemento e chi lo porta',
  'help.guide.share-packing-item.goal':
    'Sposta un elemento tra il fondo comune del gruppo, la tua lista e le persone per cui lo porti.',
  'help.guide.share-packing-item.step.1':
    'Condiviso sopra le liste è il fondo comune che vedono tutti, La mia lista è la tua, e ognuna conta quello che contiene. Clicca La mia lista per guardare la tua.',
  'help.guide.share-packing-item.step.2':
    'Di nuovo in Condiviso, apri i tre puntini alla fine di una riga e clicca Condivisione.',
  'help.guide.share-packing-item.step.3':
    'Tre livelli: Condiviso, nel fondo comune del gruppo e visibile a tutti; Personale, che vedi solo tu; e Condividi con…, dove scegli le persone che l’elemento copre.',
  'help.guide.share-packing-item.step.4': 'Un elemento Personale sta solo su La mia lista. Passa di là per trovarlo.',
  'help.guide.share-packing-item.step.5':
    'Apri di nuovo Condivisione e spunta un nome sotto Condividi con…. L’elemento compare anche sulla lista di quella persona, e la riga riceve un piccolo contrassegno che conta le persone con cui è condiviso.',
  'help.guide.share-packing-item.result': 'L’elemento sta nel livello che hai scelto, e la riga dice chi lo porta.',
  'help.guide.share-packing-item.tip.1':
    'Solo chi porta un elemento ne cambia la condivisione. Chi l’ha ricevuto da te lo vede sulla sua La mia lista, segnato con il tuo nome, e può spuntarlo.',
  'help.guide.share-packing-item.tip.2':
    'Su un elemento portato da qualcun altro ottieni invece due pulsanti diversi: Posso portarlo anch’io, che ti mette accanto, e Copia nella mia lista, che ne fa una copia privata tua.',
  'help.guide.share-packing-item.tip.3':
    'I nuovi elementi ereditano la vista in cui li aggiungi. Aggiunti in La mia lista sono Personale, aggiunti in Condiviso vanno nel fondo comune.',
  // packing-bags
  'help.guide.packing-bags.title': 'Pesare le valigie',
  'help.guide.packing-bags.goal':
    'Metti un peso su ogni elemento, smista gli elementi nelle valigie e tieni ogni valigia sotto il limite della compagnia aerea.',
  'help.guide.packing-bags.step.1':
    'Clicca il contrassegno del peso prima del cerchio e digita il peso dell’elemento in grammi.',
  'help.guide.packing-bags.step.2': 'Il cerchio in fondo alla riga è la sua valigia. Cliccalo.',
  'help.guide.packing-bags.step.3':
    'Nessuna valigia ancora: Aggiungi valigia, un nome, Invio. La valigia viene creata e l’elemento ci finisce dentro subito.',
  'help.guide.packing-bags.step.4':
    'Il pannello Valigie compare a destra appena esiste una valigia: nome, peso, una barra di riempimento, chi la porta e quanti elementi contiene, poi Non assegnato e Peso totale.',
  'help.guide.packing-bags.step.5':
    'Clicca Imposta limite e digita il limite in chilogrammi, come lo indicano le compagnie aeree.',
  'help.guide.packing-bags.step.6': 'Il segno più tratteggiato accanto al nome di una valigia dice chi la porta.',
  'help.guide.packing-bags.result':
    'Il pannello Valigie a destra mostra il peso di ogni valigia rispetto al suo limite, quello che non sta in nessuna, e il totale.',
  'help.guide.packing-bags.tip.1':
    'Il campo del peso, il cerchio della valigia e il pannello Valigie esistono solo finché un amministratore tiene Tracciamento valigia acceso sotto l’addon Liste.',
  'help.guide.packing-bags.tip.2':
    'Il peso di una valigia viene sommato sul server su tutti gli elementi di ogni membro, compresi quelli che non puoi vedere, quindi il numero è davvero quanto pesa la valigia.',
  'help.guide.packing-bags.tip.3':
    'Una valigia senza limite viene disegnata rispetto alla valigia più pesante, così le barre restano confrontabili. Dalle un limite e la barra si legge rispetto a quello.',
  // create-todo
  'help.guide.create-todo.title': 'Aggiungere un’attività',
  'help.guide.create-todo.goal':
    'Annota qualcosa che deve succedere, con una lista, una priorità, una data e un nome accanto.',
  'help.guide.create-todo.step.1': 'Clicca Nuova attività in alto a destra.',
  'help.guide.create-todo.step.2':
    'Dalle un nome in Nome attività, e metti sotto Descrizione tutto quello che vale la pena ricordare.',
  'help.guide.create-todo.step.3':
    'Lista raggruppa l’attività. Scegline una, oppure usa il segno più accanto per dare un nome a una nuova in una piccola finestra.',
  'help.guide.create-todo.step.4': 'Priorità sono quattro pulsanti: Nessuna, P1, P2 e P3, dal rosso al blu.',
  'help.guide.create-todo.step.5': 'Scadenza apre un calendario, e Assegnato a mette un nome sull’attività.',
  'help.guide.create-todo.step.6': 'Clicca Crea attività.',
  'help.guide.create-todo.result':
    'L’attività è nella lista con i suoi distintivi, la priorità, la scadenza, la lista e la persona a cui è assegnata, e si apre nel pannello a destra.',
  'help.guide.create-todo.tip.1':
    'Solo il nome è obbligatorio. Tutto il resto si può riempire dopo dal pannello a destra.',
  'help.guide.create-todo.tip.2':
    'Con una lista selezionata nella barra laterale, una nuova attività parte in quella lista.',
  'help.guide.create-todo.tip.3': 'Invio nel campo del nome crea l’attività subito, senza toccare gli altri campi.',
  // todo-filters
  'help.guide.todo-filters.title': 'Trovare e cambiare un’attività',
  'help.guide.todo-filters.goal':
    'Riduci la lista delle attività a quello che conta adesso, poi modifica l’attività su cui sei finito.',
  'help.guide.todo-filters.step.1':
    'Attività nella barra laterale: Tutti è tutto quello che è ancora aperto, Le mie attività quello che tocca a te, Scaduta quello che ha una data passata, Fatto quello che è finito. Ognuno porta il suo conteggio; clicca Scaduta.',
  'help.guide.todo-filters.step.2':
    'Sotto Liste sta una riga per lista. Sceglierne una mostra quella lista, attività finite comprese.',
  'help.guide.todo-filters.step.3':
    'L’ordinamento nell’intestazione della lista riordina quello che è sullo schermo: Priorità mette P1 per primo, Scadenza mette la scadenza più vicina per prima. Solo uno dei due alla volta, e un secondo clic torna al tuo ordine.',
  'help.guide.todo-filters.step.4': 'Clicca un’attività per aprirla nel pannello a destra.',
  'help.guide.todo-filters.step.5':
    'Cambia quello che ti serve, Descrizione, Priorità, Lista, Scadenza o Assegnato a, poi Salva modifiche. La casella nell’intestazione del pannello spunta l’attività, ed Elimina la porta via all’istante.',
  'help.guide.todo-filters.result':
    'La lista mostra solo le attività che hai chiesto, e il pannello a destra modifica quella che hai scelto.',
  'help.guide.todo-filters.tip.1':
    'Una riga di lista conta solo quello che è ancora aperto, ma selezionarla mostra anche le attività finite. Tutti, Le mie attività e Scaduta nascondono quello che è fatto; Fatto non mostra altro.',
  'help.guide.todo-filters.tip.2':
    'Priorità e Scadenza nell’ordinamento si escludono, e finché uno dei due è attivo le righe non si possono più trascinare in un ordine tuo.',

  // ── Screen: trip-bookings ─────────────────────────────────────────────────────────────
  'help.ctx.trip-bookings.title': 'Prenotazioni',
  'help.ctx.trip-bookings.summary':
    'La scheda che raccoglie tutto ciò che è prenotato per il viaggio e non serve a spostarsi: gli alloggi, i tavoli, i biglietti, i tour, i parcheggi. Ogni prenotazione è una scheda in In attesa o in Confermata, con il suo codice, il suo documento, i suoi viaggiatori e il suo costo.',
  'help.ctx.trip-bookings.bullet.1':
    'Prenotazione manuale in alto a destra apre il modulo. I sei generi che crea sono Alloggio, Ristorante, Evento, Tour, Parcheggio e Altro; voli, treni e il resto vivono nella scheda Trasporti e qui non compaiono mai.',
  'help.ctx.trip-bookings.bullet.2':
    'Importa da file consegna una conferma all’analisi: EML, PDF, PKPass, HTML o TXT, cinque file da 10 MB al massimo. Il pulsante c’è solo se il server sa leggerli.',
  'help.ctx.trip-bookings.bullet.3':
    'I chip accanto al titolo filtrano per genere, ognuno con il proprio conteggio, e Tutti riporta indietro tutto. Non appena una prenotazione nomina delle persone, la fila di avatar accanto ai chip restringe la scheda a una di loro.',
  'help.ctx.trip-bookings.bullet.4':
    'Le schede delle prenotazioni stanno in due sezioni, In attesa e Confermata, ognuna con il suo conteggio. Un clic sul titolo di una sezione la ripiega, e se è aperta viene ricordato per questo viaggio.',
  'help.ctx.trip-bookings.bullet.5':
    'Una scheda porta il punto di stato, il genere, il titolo, le date e gli orari, il Codice prenotazione, Posizione / Indirizzo, ciò a cui la prenotazione è collegata, il suo Link, le Note, i File e i Viaggiatori.',
  'help.ctx.trip-bookings.bullet.6':
    'La matita su una scheda riapre lo stesso modulo; il cestino chiede una volta e poi la prenotazione è sparita. Con un alloggio se ne vanno anche le sue notti nel Programma giornaliero e la sua spesa collegata.',
  // create-booking
  'help.guide.create-booking.title': 'Creare una prenotazione',
  'help.guide.create-booking.goal':
    'Metti a mano nel viaggio un ristorante, un evento, un tour, un posto auto o qualsiasi altra cosa.',
  'help.guide.create-booking.step.1':
    'Clicca Prenotazione manuale in alto a destra nella scheda. Si apre Nuova prenotazione.',
  'help.guide.create-booking.step.2':
    'Scegli il Tipo di prenotazione dall’elenco in cima al modulo, accanto a Viaggiatori. Alloggio, Ristorante, Evento, Tour, Parcheggio e Altro sono i sei che questa scheda crea, e il modulo cambia con la scelta: solo Alloggio scambia le sue date con un intervallo di giorni.',
  'help.guide.create-booking.step.3':
    'Digita il Titolo. È l’unico campo su cui il modulo insiste, e Aggiungi resta morto finché non c’è qualcosa.',
  'help.guide.create-booking.step.4':
    'Imposta Data e Ora di inizio, e Data fine e Ora di fine se la prenotazione ha una fine. I calendari offrono solo i giorni dentro il viaggio, e una fine che non è successiva all’inizio lo dice in rosso e blocca Aggiungi.',
  'help.guide.create-booking.step.5':
    'Inserisci il Codice prenotazione dalla conferma e imposta Stato. In attesa o Confermata decide in quale delle due sezioni finisce la scheda.',
  'help.guide.create-booking.step.6': 'Clicca Aggiungi.',
  'help.guide.create-booking.result':
    'La prenotazione è una scheda nella sua sezione, con il suo chip di genere, le sue date e il suo codice, e tutti gli altri nel viaggio la vedono comparire.',
  'help.guide.create-booking.tip.1':
    'Posizione / Indirizzo propone indirizzi veri mentre digiti; sceglierne uno sostituisce ciò che avevi scritto, e un indirizzo digitato da te resta com’è.',
  'help.guide.create-booking.tip.2':
    'Link prende la pagina della prenotazione presso il fornitore. La scheda ne fa un collegamento che si apre in una nuova scheda del browser.',
  'help.guide.create-booking.tip.3':
    'Le Note sono Markdown, quindi un elenco o una riga in grassetto vengono resi come tali sulla scheda.',
  // booking-hotel
  'help.guide.booking-hotel.title': 'Prenotare un alloggio',
  'help.guide.booking-hotel.goal':
    'Inserisci un alloggio perché valga insieme come prenotazione e come notti nel Programma giornaliero.',
  'help.guide.booking-hotel.step.1':
    'Clicca Prenotazione manuale e scegli Alloggio. I campi della data se ne vanno e un blocco di campi d’albergo prende il loro posto.',
  'help.guide.booking-hotel.step.2':
    'Scegli l’albergo sotto Alloggio. La lista sono i luoghi del viaggio, e sceglierne uno scrive il suo nome in Titolo e il suo indirizzo in Posizione / Indirizzo.',
  'help.guide.booking-hotel.step.3':
    'Imposta Da e A: la prima notte e la mattina in cui parti. Entrambi offrono i giorni del viaggio con le loro date, e i due si tengono in ordine a vicenda.',
  'help.guide.booking-hotel.step.4':
    'Compila Check-in, Check-in fino a e Check-out, e il Codice prenotazione dalla conferma.',
  'help.guide.booking-hotel.step.5': 'Clicca Aggiungi.',
  'help.guide.booking-hotel.result':
    'La scheda porta un intervallo di giorni invece di una data, con gli orari di check-in e check-out e l’indirizzo, e lo stesso soggiorno ora sta su quei giorni del programma.',
  'help.guide.booking-hotel.tip.1':
    'Alloggio è l’unico tipo senza Data e senza Ora di inizio. Le sue date sono Da e A, e sono giorni del viaggio invece che un calendario.',
  'help.guide.booking-hotel.tip.2':
    'Lascia Alloggio vuoto e digita invece l’indirizzo: il luogo viene cercato, creato e messo sulla mappa per te.',
  'help.guide.booking-hotel.tip.3': 'Eliminare la prenotazione porta via con sé le notti dal Programma giornaliero.',
  // link-booking
  'help.guide.link-booking.title': 'Legare una prenotazione al programma',
  'help.guide.link-booking.goal':
    'Aggancia una prenotazione alla tappa e al luogo a cui appartiene, così spunta dove ti servirà.',
  'help.guide.link-booking.step.1': 'Clicca la matita sulla scheda che vuoi collegare. Si apre Modifica prenotazione.',
  'help.guide.link-booking.step.2':
    'Apri Collega all’assegnazione del giorno. La lista è il tuo programma: un titolo per giorno, poi le tappe di quel giorno, numerate e con i loro orari. Scegli quella a cui la prenotazione appartiene.',
  'help.guide.link-booking.step.3':
    'Luogo / Attività collega il luogo stesso. Scegli lì, e Titolo e Posizione / Indirizzo si riempiono ovunque tu li abbia lasciati vuoti.',
  'help.guide.link-booking.step.4': 'Clicca Aggiorna.',
  'help.guide.link-booking.result':
    'La scheda nomina il giorno e la tappa sotto Collega all’assegnazione del giorno, e la prenotazione viaggia insieme a quella tappa nel Programma giornaliero.',
  'help.guide.link-booking.tip.1':
    'Nessun collegamento (autonomo) in cima alla lista toglie di nuovo il collegamento. Alloggio non ha nessun selettore di tappa: si collega tramite le sue notti.',
  'help.guide.link-booking.tip.2':
    'Scegliere una tappa in un giorno con data riempie per te una Data vuota. Una data che hai già impostato viene lasciata stare.',
  // booking-travelers
  'help.guide.booking-travelers.title': 'Dire per chi è una prenotazione',
  'help.guide.booking-travelers.goal': 'Segna i viaggiatori che una prenotazione copre, e poi vedi solo le loro.',
  'help.guide.booking-travelers.step.1':
    'Apri la prenotazione con la matita. Viaggiatori sta in cima al modulo, accanto a Tipo di prenotazione, e dice Assegna viaggiatori finché nessuno è sulla prenotazione.',
  'help.guide.booking-travelers.step.2':
    'Cliccalo e scegli le persone per cui è questa prenotazione; anche gli ospiti con nome sono nell’elenco. Una scelta riceve una spunta e il suo avatar nel campo. Clicca di nuovo il nome per toglierla.',
  'help.guide.booking-travelers.step.3': 'Clicca Aggiorna.',
  'help.guide.booking-travelers.step.4':
    'In alto nella barra degli strumenti, accanto ai chip di genere, clicca l’avatar di un viaggiatore per vedere solo le sue prenotazioni.',
  'help.guide.booking-travelers.result':
    'La scheda elenca le persone per cui è, e la fila di avatar restringe la scheda delle prenotazioni a una di loro.',
  'help.guide.booking-travelers.tip.1':
    'Sulla scheda i viaggiatori vengono solo mostrati, mai cambiati. Si impostano qui, nel modulo.',
  'help.guide.booking-travelers.tip.2':
    'La fila di avatar compare non appena il viaggio ha più di un membro e almeno una prenotazione nomina qualcuno. Ciò che scegli dura per questa sessione del browser.',
  // booking-files
  'help.guide.booking-files.title': 'Tenere il voucher con la prenotazione',
  'help.guide.booking-files.goal': 'Allega la conferma, il biglietto o il pass alla prenotazione a cui appartengono.',
  'help.guide.booking-files.step.1':
    'Apri la prenotazione con la matita, scendi fino a File e clicca Allega file. Su una prenotazione che esiste già il documento sale subito e TREK dice File caricato.',
  'help.guide.booking-files.step.2':
    'Il documento è elencato con il suo nome, con un pulsante per aprirlo e una X accanto.',
  'help.guide.booking-files.step.3':
    'Collega file esistente offre i documenti del viaggio che non stanno ancora su questa prenotazione. Scegline uno e viene allegato senza caricare di nuovo nulla.',
  'help.guide.booking-files.step.4': 'Clicca Aggiorna.',
  'help.guide.booking-files.result': 'La scheda elenca i documenti sotto File, e un clic su uno di essi lo apre.',
  'help.guide.booking-files.tip.1':
    'Su una prenotazione che stai ancora creando il documento aspetta e sale nel momento in cui clicchi Aggiungi.',
  'help.guide.booking-files.tip.2':
    'La X accanto a un documento toglie il collegamento, non il documento. Resta nella scheda File del viaggio.',
  'help.guide.booking-files.tip.3':
    'Quali generi di file si possono allegare è la lista Tipi di File Consentiti dell’amministratore; documenti, testo e immagini sono permessi di serie.',
  // booking-cost
  'help.guide.booking-cost.title': 'Trasformare il prezzo di una prenotazione in un costo',
  'help.guide.booking-cost.goal': 'Porta ciò che una prenotazione costa nei Costi, diviso fra le persone che pagano.',
  'help.guide.booking-cost.step.1':
    'Apri la prenotazione e vai in fondo al modulo. Sotto Costi stanno Crea spesa e Collega spesa esistente, con la nota Salva la prenotazione e poi apre l’editor dei costi.',
  'help.guide.booking-cost.step.2':
    'Clicca Crea spesa. La prenotazione viene salvata, il suo modulo si chiude e l’editor dei Costi si apre.',
  'help.guide.booking-cost.step.3':
    'Per cosa era? è già il titolo della prenotazione. Inserisci l’Importo totale e controlla la Valuta e il Giorno.',
  'help.guide.booking-cost.step.4':
    'Categoria è quella che il tipo di prenotazione implica. Imposta Chi ha pagato? e come l’importo viene diviso.',
  'help.guide.booking-cost.step.5': 'Clicca Aggiungi spesa.',
  'help.guide.booking-cost.result':
    'Il modulo della prenotazione ora elenca la spesa sotto Spese collegate con il suo importo, e la stessa spesa sta nella scheda Costi, legata a questa prenotazione.',
  'help.guide.booking-cost.tip.1':
    'La categoria segue il tipo: Ristorante diventa Cibo e bevande, Alloggio diventa Alloggio, Parcheggio diventa Parcheggio, ed Evento e Tour finiscono entrambi in Altro.',
  'help.guide.booking-cost.tip.2':
    'Una prenotazione può portare più spese. Collega spesa esistente offre quelle in Costi che non appartengono ancora a nulla. Su una collegata, Scollega, mantieni la spesa la stacca e la lascia in Costi, mentre il cestino la rimuove.',
  'help.guide.booking-cost.tip.3':
    'Costi sta nel modulo solo finché l’addon Costi è attivo, che l’amministratore accende sotto Moduli.',
  // filter-bookings
  'help.guide.filter-bookings.title': 'Trovare una prenotazione',
  'help.guide.filter-bookings.goal': 'Restringi una scheda lunga al genere, alla persona o allo stato che cerchi.',
  'help.guide.filter-bookings.step.1':
    'I chip accanto al titolo sono i generi che questo viaggio usa davvero, ognuno con il numero che contiene. Tutti è la scheda intera.',
  'help.guide.filter-bookings.step.2':
    'Clicca un chip per tenere solo quel genere. Cliccane un secondo e restano entrambi.',
  'help.guide.filter-bookings.step.3': 'Tutti rimette tutto.',
  'help.guide.filter-bookings.step.4':
    'Gli avatar accanto ai chip filtrano per viaggiatore, una persona o diverse insieme.',
  'help.guide.filter-bookings.step.5':
    'In attesa e Confermata sono le due sezioni, ognuna con il suo conteggio. Clicca un titolo per ripiegarne una; è ancora ripiegata quando torni.',
  'help.guide.filter-bookings.result':
    'La scheda mostra solo ciò che hai scelto, ed è ancora scelto quando ci torni in questa sessione del browser.',
  'help.guide.filter-bookings.tip.1':
    'I chip offrono solo i generi che il viaggio ha, quindi un viaggio senza un solo tour non ha il chip Tour.',
  'help.guide.filter-bookings.tip.2':
    'Un filtro che non trova nulla lascia la scheda vuota con Nessun luogo trovato. La formulazione è quella della lista dei luoghi; il senso è lo stesso.',
  // import-booking-file
  'help.guide.import-booking-file.title': 'Leggere una prenotazione dalla sua conferma',
  'help.guide.import-booking-file.goal':
    'Lascia che TREK tiri fuori la prenotazione dalla mail o dal PDF che il fornitore ha mandato, invece di digitarla di nuovo.',
  'help.guide.import-booking-file.step.1':
    'Clicca Importa da file nella barra degli strumenti. Si apre Importa conferme di prenotazione.',
  'help.guide.import-booking-file.step.2':
    'Lascia cadere le conferme sul riquadro, oppure cliccalo e sceglile: EML, PDF, PKPass, HTML e TXT, fino a cinque file da 10 MB ciascuno. Quelle che hai scelto sono nominate sul riquadro.',
  'help.guide.import-booking-file.step.3':
    'Clicca Importa. La finestra si chiude subito, perché la lettura avviene in secondo piano.',
  'help.guide.import-booking-file.step.4':
    'Una scheda in basso a destra racconta l’esecuzione sotto il nome del file, e ti segue attraverso l’app e attraverso un ricaricamento. Analisi dei file in corso… diventa una spunta quando la lettura è finita, e la scheda offre Importa. Cliccalo.',
  'help.guide.import-booking-file.result':
    'La prenotazione è una scheda in In attesa con le sue notti, il suo codice e la conferma sotto File, il soggiorno sta su quei giorni del programma, e con Costi attivo il prezzo è una spesa legata a lei.',
  'help.guide.import-booking-file.tip.1':
    'Importa da file c’è solo se il server sa leggere le conferme, e questo richiede o l’estrattore o il modulo Analisi con IA. Quello l’amministratore lo accende sotto Moduli.',
  'help.guide.import-booking-file.tip.2':
    'Se non si è potuto leggere nulla la scheda lo dice e offre Try AI parsing, che manda gli stessi file dritti al modello. Un’analisi finita viene tenuta per dieci minuti; avvia la revisione dentro quella finestra.',
  'help.guide.import-booking-file.tip.3':
    'La conferma viene allegata solo se il suo tipo è tra i Tipi di File Consentiti delle impostazioni di amministrazione. PDF c’è di default; una mail, EML, va aggiunta prima, altrimenti la prenotazione viene salvata senza.',
  // edit-booking
  'help.guide.edit-booking.title': 'Cambiare una prenotazione',
  'help.guide.edit-booking.goal':
    'Correggi un orario, aggiungi il codice arrivato più tardi, o sposta una prenotazione da In attesa a Confermata.',
  'help.guide.edit-booking.step.1':
    'Clicca la matita nell’intestazione della scheda. Modifica prenotazione si apre con tutto ciò che la prenotazione sa.',
  'help.guide.edit-booking.step.2':
    'Cambia ciò che va cambiato, qui il Codice prenotazione che l’operatore ha finalmente mandato.',
  'help.guide.edit-booking.step.3': 'Metti Stato su Confermata.',
  'help.guide.edit-booking.step.4': 'Clicca Aggiorna.',
  'help.guide.edit-booking.result':
    'La scheda si sposta: una prenotazione confermata sta nella sezione Confermata dietro un punto verde, e tutti nel viaggio la vedono spostarsi.',
  'help.guide.edit-booking.tip.1':
    'Un Codice prenotazione che non riesci a leggere è Nascondi codici di prenotazione nelle Impostazioni, sotto Visualizzazione. Passaci sopra, o cliccalo, ed è leggibile.',
  'help.guide.edit-booking.tip.2':
    'Cambia il tipo e la categoria di una spesa collegata lo segue, a meno che tu non avessi scelto una categoria a mano nell’editor dei Costi.',
  'help.guide.edit-booking.tip.3':
    'Un alloggio si modifica anche qui: i suoi giorni Da e A stanno nello stesso modulo.',
  // delete-booking
  'help.guide.delete-booking.title': 'Eliminare una prenotazione',
  'help.guide.delete-booking.goal': 'Togli dal viaggio una prenotazione saltata.',
  'help.guide.delete-booking.step.1': 'Clicca il cestino nell’intestazione della scheda.',
  'help.guide.delete-booking.step.2':
    'Eliminare la prenotazione? nomina quella che hai scelto e dice che verrà eliminata in modo permanente.',
  'help.guide.delete-booking.step.3': 'Clicca Conferma.',
  'help.guide.delete-booking.result':
    'La scheda è sparita, per tutti nel viaggio. Una prenotazione non ha un annulla, quindi la domanda è l’ultima fermata.',
  'help.guide.delete-booking.tip.1':
    'Eliminare una prenotazione di alloggio toglie anche le sue notti dal Programma giornaliero e rimuove la spesa che era collegata a essa.',
  'help.guide.delete-booking.tip.2':
    'I documenti che erano allegati restano nella scheda File del viaggio; se ne va solo il loro collegamento con la prenotazione.',
  // import-booking-file
  'help.guide.import-booking-file.step.5':
    'Ogni prenotazione trovata si apre in Nuova prenotazione, una dopo l’altra, già compilata. Per un hotel è il nome in Titolo e, quando il viaggio ha il luogo, sotto Alloggio, la sua Posizione / Indirizzo, Da e A sulle sue notti, Check-in e Check-out, il Codice prenotazione, la conferma sotto File e, con Costi attivo, il prezzo come Spesa collegata. Controllala e clicca Aggiungi.',

  // ── Screen: trip-costs ────────────────────────────────────────────────────────────────
  'help.ctx.trip-costs.title': 'Costi',
  'help.ctx.trip-costs.summary':
    'Il denaro del viaggio: ogni spesa in un registro datato, chi l’ha anticipata e chi la deve, nella valuta in cui era la ricevuta, e, nella colonna di destra, chi deve pagare chi perché torni tutto in pari.',
  'help.ctx.trip-costs.bullet.1':
    'Quattro schede in alto: Devi e Ti devono sono il tuo lato del conguaglio, Importo in sospeso è ciò che è registrato ma non ha ancora un pagante, e Spesa totale del viaggio somma tutto, con La tua quota e Hai pagato sotto.',
  'help.ctx.trip-costs.bullet.2':
    'Aggiungi spesa in alto a destra apre l’editor; Salda accanto registra in una volta sola tutti i trasferimenti aperti.',
  'help.ctx.trip-costs.bullet.3':
    'Il registro è raggruppato per giorno, il più recente per primo, con il totale di quel giorno a destra. Una riga porta la categoria come linguetta colorata, il nome, i segnalini dei paganti, la nota e l’importo, più hai prestato o hai preso in prestito quando la divisione ti lascia in attivo o in passivo su quella spesa.',
  'help.ctx.trip-costs.bullet.4':
    'Sopra la lista stanno Cerca spese…, un filtro di categoria, un filtro di giorno, il selettore Tutte / Pagate da me / Mi devono e il pulsante Esporta CSV.',
  'help.ctx.trip-costs.bullet.5':
    'La colonna di destra è la risposta: Salda elenca chi paga chi, Saldi mostra l’attivo o il passivo di ogni viaggiatore, Budget finale quanto il viaggio costa a ciascuno di loro, e Per categoria dove sono finiti i soldi.',
  'help.ctx.trip-costs.bullet.6':
    'Un pagamento registrato sta nello stesso registro come riga a sé, con Modifica e Annulla accanto; una spesa ha una matita e un cestino, e il cestino la elimina senza chiedere.',
  // add-expense
  'help.guide.add-expense.title': 'Aggiungere una spesa',
  'help.guide.add-expense.goal': 'Registra quanto è costato qualcosa, chi l’ha pagato e con chi è diviso.',
  'help.guide.add-expense.step.1':
    'Clicca Aggiungi spesa in alto a destra nella scheda Costi. L’editor si apre, datato oggi, con tutti già nella divisione.',
  'help.guide.add-expense.step.2':
    'Scrivi per cosa era in Per cosa era?, l’unico campo che deve essere compilato, e la cifra della ricevuta in Importo totale.',
  'help.guide.add-expense.step.3':
    'Valuta e Giorno stanno sotto l’importo. Valuta parte da quella del viaggio; cambiala e l’editor mostra quanto vale l’importo nella valuta del viaggio. Giorno parte da oggi ed è il giorno sotto cui il registro raggruppa la spesa.',
  'help.guide.add-expense.step.4':
    'Scegli una Categoria. Ce ne sono quattordici e non si possono modificare: quella che scegli è la linguetta colorata della riga e la barra in Per categoria.',
  'help.guide.add-expense.step.5':
    'Sotto Chi ha pagato?, scegli la persona che ha davvero anticipato i soldi. Tu è preselezionato; Nessuno ha ancora pagato registra l’importo senza che nessuno lo debba, e Hanno pagato più persone divide il conto tra più paganti.',
  'help.guide.add-expense.step.6':
    'Split parte da Equally con tutti inclusi, e accanto a ogni nome c’è la quota che ne risulta. Clicca Aggiungi spesa per salvare.',
  'help.guide.add-expense.result':
    'La spesa è nel registro sotto il suo giorno, conteggiata in Spesa totale del viaggio, e la colonna del conguaglio ha ricalcolato chi deve a chi.',
  'help.guide.add-expense.tip.1':
    'Lasciata com’è quando si apre, la spesa è nella valuta del viaggio, datata oggi e divisa in parti uguali tra tutti: davvero da compilare ci sono solo il nome e l’importo.',
  'help.guide.add-expense.tip.2':
    'Il ± accanto all’importo trasforma la spesa in un rimborso. Un totale negativo restituisce denaro invece di prenderlo, e la divisione va al contrario.',
  'help.guide.add-expense.tip.3':
    'Allega ricevuta / fattura in fondo accetta immagini e PDF. Vengono caricati quando salvi, finiscono nei File del viaggio, e accanto al nome nella lista compare un segnalino Ricevute.',
  // expense-payers
  'help.guide.expense-payers.title': 'Dire chi ha pagato il conto',
  'help.guide.expense-payers.goal':
    'Registra chi ha anticipato i soldi per una spesa, l’altra metà del calcolo del conguaglio.',
  'help.guide.expense-payers.step.1':
    'Apri una spesa con la matita accanto alla sua riga e guarda Chi ha pagato?. Ha pagato una sola persona è l’impostazione predefinita: il menu a tendina nomina l’unica persona che ha anticipato i soldi.',
  'help.guide.expense-payers.step.2':
    'Nessuno ha ancora pagato, la prima voce di quel menu a tendina, registra l’importo senza che nessuno debba nulla. La spesa conta comunque in Spesa totale del viaggio.',
  'help.guide.expense-payers.step.3':
    'Hanno pagato più persone, il link accanto all’etichetta, apre una riga per viaggiatore. Includi quelli che hanno pagato e scrivi quanto ha messo ciascuno; gli importi devono sommare al totale.',
  'help.guide.expense-payers.step.4':
    'Una spesa che nessuno ha pagato è contrassegnata Incompleto sulla sua riga e conteggiata nella scheda Importo in sospeso, dove si raccoglie la spesa registrata ma non saldata.',
  'help.guide.expense-payers.result':
    'Chi ha pagato decide chi viene rimborsato, la divisione decide chi paga, e Saldi è la differenza tra i due.',
  'help.guide.expense-payers.tip.1':
    'Chi ha pagato? e Split sono indipendenti: puoi pagare una cena a cui non eri, ed essere incluso nella divisione di una che non hai pagato.',
  'help.guide.expense-payers.tip.2':
    'Con più paganti gli importi devono sommare al totale. Includine un altro e gli altri si riorganizzano attorno a lui; finché non corrispondono, l’editor dice a quanto devono sommare e rifiuta di salvare.',
  'help.guide.expense-payers.tip.3':
    'Togliere un pagante non toglie la spesa: l’importo resta in Spesa totale del viaggio e la riga diventa Incompleto.',
  // split-expense
  'help.guide.split-expense.title': 'Dividere un conto tra i viaggiatori',
  'help.guide.split-expense.goal':
    'Decidi chi deve per una spesa: tutti in parti uguali, per importo, o riga per riga dalla ricevuta.',
  'help.guide.split-expense.step.1':
    'Nell’editor della spesa, Split elenca ogni viaggiatore. Clicca un nome per lasciarlo fuori da questa spesa; un viaggiatore escluso indica Escluso e non deve nulla per essa.',
  'help.guide.split-expense.step.2':
    'Equally è l’impostazione predefinita: ogni viaggiatore incluso riceve la stessa quota, e la riga sotto la lista dice in quante parti è divisa e a quanto ammonta ciascuna quota.',
  'help.guide.split-expense.step.3':
    'Custom sostituisce le quote con campi importo. Scrivi quanto deve ogni viaggiatore; la riga sotto conta man mano e diventa verde su La divisione corrisponde al totale. Non salva finché non corrisponde.',
  'help.guide.split-expense.step.4':
    'Ticket divide la ricevuta riga per riga: Aggiungi articolo, poi un nome e un prezzo per riga, e sotto Diviso tra: i viaggiatori che si dividono quella riga.',
  'help.guide.split-expense.step.5':
    'Quota di ciascuno sotto le righe mostra quanto deve alla fine ogni viaggiatore, e Importo totale in alto è la somma delle righe. Clicca Salva.',
  'help.guide.split-expense.result':
    'La divisione è ciò da cui è costruito ogni saldo. Viene salvata con la spesa e si può cambiare più tardi senza toccare nient’altro.',
  'help.guide.split-expense.tip.1':
    'Un viaggiatore che lasci fuori indica Escluso e non deve nulla per questa singola spesa; gli altri si prendono la sua quota.',
  'help.guide.split-expense.tip.2':
    'Equally è preciso al centesimo: il centesimo che avanza ruota di spesa in spesa, così non è sempre la stessa persona a pagarlo.',
  'help.guide.split-expense.tip.3':
    'La modalità Ticket somma da sé Importo totale e disattiva il campo: le righe della ricevuta sono il totale.',
  // expense-currency
  'help.guide.expense-currency.title': 'Inserire una spesa in un’altra valuta',
  'help.guide.expense-currency.goal':
    'Inserisci quello che dice davvero la ricevuta e lascia che sia TREK a tenere il tasso.',
  'help.guide.expense-currency.step.1':
    'Apri Aggiungi spesa e compila nome e importo esattamente come dice la ricevuta, la cifra stessa e non una sua conversione.',
  'help.guide.expense-currency.step.2':
    'Apri Valuta e scegli la valuta della ricevuta. La lista porta ogni codice che TREK conosce ed è ricercabile: digita le tre lettere.',
  'help.guide.expense-currency.step.3':
    'Sotto i campi compare una riga con quanto vale l’importo in questo momento, contrassegnata tasso in tempo reale. È un’anteprima, non ciò che viene salvato.',
  'help.guide.expense-currency.step.4':
    'Clicca Aggiungi spesa. Il tasso viene congelato sul posto: da qui in poi questa spesa vale quello che valeva il giorno in cui l’hai inserita.',
  'help.guide.expense-currency.step.5':
    'Nel registro la riga porta entrambe le cifre sotto il nome: quello che hai digitato, una freccia, e quanto conta nella valuta del viaggio. Ogni totale, saldo e conguaglio qui sopra usa la seconda.',
  'help.guide.expense-currency.result':
    'La spesa mantiene l’importo e la valuta che hai digitato. Il registro mostra entrambi, e i totali e i saldi del viaggio restano nella valuta del viaggio.',
  'help.guide.expense-currency.tip.1':
    'Il tasso viene congelato nel momento in cui salvi, così un debito saldato non si riapre perché il mercato si è mosso la settimana dopo. Solo cambiare la valuta della spesa ne congela uno nuovo.',
  'help.guide.expense-currency.tip.2':
    'Valuta di visualizzazione in Impostazioni cambia solo quello che leggi; gli importi salvati non si muovono mai. Lasciata vuota, ogni viaggio è mostrato nella sua valuta.',
  'help.guide.expense-currency.tip.3':
    'La valuta del viaggio sta sul viaggio stesso, sotto Modifica Viaggio, e richiede il permesso Modificare dettagli del viaggio. Cambiarla riancora ogni tasso congelato invece di ridenominare gli importi.',
  // filter-costs
  'help.guide.filter-costs.title': 'Trovare una spesa, o le spese di un giorno',
  'help.guide.filter-costs.goal': 'Restringi un registro lungo a ciò che cerchi davvero.',
  'help.guide.filter-costs.step.1': 'Scrivi in Cerca spese…, sopra la lista. Cerca nel nome della spesa mentre digiti.',
  'help.guide.filter-costs.step.2':
    'Tutte le categorie apre le quattordici categorie. Scegline una e restano solo le spese di quella categoria.',
  'help.guide.filter-costs.step.3':
    'Tutti i giorni elenca ogni giorno in cui è stato speso qualcosa. Scegline uno e un banner sostituisce le intestazioni dei giorni con quel giorno, quante spese contiene e il suo totale.',
  'help.guide.filter-costs.step.4':
    'Il selettore Tutte / Pagate da me / Mi devono è la tua vista del registro: ciò per cui hai anticipato dei soldi, e ciò che devi ancora recuperare.',
  'help.guide.filter-costs.step.5':
    'Esporta CSV in fondo alla riga scrive ogni spesa in un file, con l’importo originale, la sua valuta e l’importo convertito.',
  'help.guide.filter-costs.result':
    'I filtri si combinano, e i gruppi dei giorni si ridisegnano con i propri totali per quello che resta.',
  'help.guide.filter-costs.tip.1':
    'I pagamenti registrati non hanno né nome né categoria, quindi una ricerca o un filtro di categoria li nasconde. Il filtro di giorno li mantiene, sotto il giorno in cui il pagamento è stato registrato.',
  'help.guide.filter-costs.tip.2':
    'Esporta CSV esporta sempre tutte le spese, qualunque cosa sia filtrata sullo schermo, una riga per spesa.',
  // settle-up
  'help.guide.settle-up.title': 'Capire chi deve a chi, e saldare',
  'help.guide.settle-up.goal':
    'Trasforma un mucchio di spese condivise nel minor numero di trasferimenti che mettono tutti in pari, e registrali man mano che avvengono.',
  'help.guide.settle-up.step.1':
    'La scheda Salda nella colonna di destra elenca i trasferimenti che metterebbero tutti in pari: chi paga chi, e quanto. Il numero accanto al titolo è quanti sono ancora aperti.',
  'help.guide.settle-up.step.2':
    'Salda accanto a un trasferimento lo registra come fatto. Il flusso sparisce dalla scheda e i saldi si ridisegnano.',
  'help.guide.settle-up.step.3':
    'Il trasferimento registrato è una riga nel registro, sotto il giorno in cui è avvenuto, contrassegnata Pagamento con i due viaggiatori e l’importo.',
  'help.guide.settle-up.step.4':
    'Accanto a quella riga la matita corregge un pagamento e Annulla lo ritira, e il trasferimento torna nella scheda Salda.',
  'help.guide.settle-up.step.5':
    'Aggiungi pagamento nell’intestazione della scheda registra un trasferimento che non ha seguito un suggerimento. Scegli Da e A, l’Importo, la sua valuta e il giorno in cui è avvenuto.',
  'help.guide.settle-up.step.6':
    'Salda nell’intestazione in cima allo schermo registra in una volta sola tutti i trasferimenti aperti, come un gruppo che si mette in pari alla fine di un viaggio.',
  'help.guide.settle-up.result':
    'Ogni trasferimento registrato è una riga nel registro e una riga in meno sulla scheda Salda. Quando la scheda dice Sono tutti in pari, il viaggio è saldato.',
  'help.guide.settle-up.tip.1':
    'La scheda mostra il minor numero di trasferimenti, non ogni debito: tre persone che si devono in cerchio si riducono a uno o due pagamenti.',
  'help.guide.settle-up.tip.2':
    'Salda registra un trasferimento, non sposta denaro. Mandalo con il mezzo che usi, poi cliccalo.',
  'help.guide.settle-up.tip.3':
    'Un pagamento può essere fatto in qualsiasi valuta, quindi pagare in euro un debito in yen è normale: la finestra ha il proprio selettore di valuta e congela anche quel tasso.',
  // final-budget
  'help.guide.final-budget.title': 'Vedere quanto il viaggio è costato a ogni viaggiatore',
  'help.guide.final-budget.goal':
    'Leggi il lato per persona del registro: il saldo di oggi, e il costo reale a persona.',
  'help.guide.final-budget.step.1':
    'Saldi mostra la posizione di ogni viaggiatore: una barra verde verso destra se il viaggio gli deve, una barra rossa verso sinistra se lui deve al viaggio, e l’importo accanto al nome.',
  'help.guide.final-budget.step.2':
    'Budget finale sotto risponde a un’altra domanda: non chi deve cosa adesso, ma quanto il viaggio costa a ogni viaggiatore una volta che tutto è stato restituito.',
  'help.guide.final-budget.step.3':
    'Clicca un nome per aprire il conto: Spese pagate, poi Rimborsi netti e Rimborsi in sospeso sotto.',
  'help.guide.final-budget.step.4':
    'Sotto ogni riga stanno le righe di cui è fatta: le spese che quel viaggiatore ha pagato, i trasferimenti già registrati e quelli ancora aperti. La loro somma fa esattamente la riga sopra.',
  'help.guide.final-budget.result':
    'Saldi è chi oggi è in attivo o in passivo; Budget finale è quanto il viaggio finisce per costare a ciascuno di voi una volta che tutto è stato restituito.',
  'help.guide.final-budget.tip.1':
    'Registrare un pagamento non cambia il budget finale di nessuno. Sposta soltanto un importo dai rimborsi in sospeso ai rimborsi netti.',
  'help.guide.final-budget.tip.2':
    'Una spesa senza pagante resta fuori da entrambe le schede, allo stesso modo in cui resta fuori dai suggerimenti di conguaglio.',
  // expense-from-booking
  'help.guide.expense-from-booking.title': 'Trasformare una prenotazione in una spesa',
  'help.guide.expense-from-booking.goal':
    'Allega quanto sono costati davvero un volo, un hotel o un luogo alla scheda a cui appartengono.',
  'help.guide.expense-from-booking.step.1':
    'Apri la prenotazione nella scheda Trasporti o Prenotazioni e clicca la sua matita.',
  'help.guide.expense-from-booking.step.2':
    'Scorri fino al blocco Costi in fondo al modulo. Offre Crea spesa, che salva prima la prenotazione, e Collega spesa esistente per una che è già nella scheda Costi.',
  'help.guide.expense-from-booking.step.3':
    'Clicca Crea spesa. La prenotazione viene salvata, il modulo si chiude, e l’editor dei Costi si apre con il titolo della prenotazione come nome e il suo tipo già abbinato a una categoria.',
  'help.guide.expense-from-booking.step.4':
    'Compila l’importo e la sua valuta, chi ha pagato e la divisione come per qualsiasi spesa, e salva. Riaprendo la prenotazione la si vede sotto Spese collegate, con una matita per modificarla, Scollega, mantieni la spesa per staccarla e un cestino per rimuoverla.',
  'help.guide.expense-from-booking.result':
    'La prenotazione porta il suo costo, e la spesa è una riga ordinaria nella scheda Costi, con un pagante, una divisione e una valuta come ogni altra.',
  'help.guide.expense-from-booking.tip.1':
    'Eliminare la prenotazione elimina con sé le spese collegate. Rimuovi spesa nel blocco Costi della prenotazione fa il contrario: la spesa va via, la prenotazione resta. Scollega, mantieni la spesa le tiene entrambe.',
  'help.guide.expense-from-booking.tip.2':
    'Un luogo ha lo stesso blocco nel suo modulo, dove Crea spesa salva prima il luogo.',

  // ── Screen: trip-transports ───────────────────────────────────────────────────────────
  'help.ctx.trip-transports.title': 'Trasporti',
  'help.ctx.trip-transports.summary':
    'Tutto ciò che ti porta tra una tappa e l’altra: voli, treni, autobus, auto, taxi, biciclette, crociere, traghetti e i collegamenti di trasporto pubblico che TREK cerca per te. La scheda ne è l’elenco; si creano e si leggono anche nel programma, e si disegnano sulla mappa.',
  'help.ctx.trip-transports.bullet.1':
    'La scheda tiene solo i tragitti. Alloggi, ristoranti, eventi e biglietti vivono in Prenotazioni, così la stessa voce non compare mai due volte.',
  'help.ctx.trip-transports.bullet.2':
    'La barra degli strumenti li conta tutti sotto Tutti e dà a ogni tipo in uso un chip proprio con il proprio conteggio, Volo, Treno, Auto, Trasporto pubblico. Trasporto, a destra, ne aggiunge uno a mano.',
  'help.ctx.trip-transports.bullet.3':
    'Le schede arrivano in tre gruppi, ciascuno richiudibile dal suo titolo: Trasporto pubblico automatico per i collegamenti pianificati dalla ricerca, poi In attesa, poi Confermata.',
  'help.ctx.trip-transports.bullet.4':
    'Una scheda porta lo stato, il tipo, i giorni che copre, gli orari, il Codice prenotazione, l’itinerario e la Compagnia aerea con il N. volo, oppure il N. treno, il Binario e il Posto. La matita la apre, il cestino la elimina dopo una domanda.',
  'help.ctx.trip-transports.bullet.5':
    'I trasporti nascono anche nel programma: ogni intestazione di giorno ha un più per Aggiungi trasporto e un pulsante tram per Trasporto pubblico, e il connettore del tempo di viaggio tra due tappe apre la stessa ricerca per quella sola tratta.',
  'help.ctx.trip-transports.bullet.6':
    'Un trasporto con entrambi gli estremi impostati disegna una linea sulla mappa. L’icona del percorso sulla sua riga nel programma del giorno accende quella linea, e Mostra tutti i percorsi prenotati nella barra sopra i giorni commuta l’intero viaggio.',
  // transports-list
  'help.guide.transports-list.title': 'Leggere la scheda Trasporti',
  'help.guide.transports-list.goal': 'Sapere cosa ti dice l’elenco prima di cambiarci qualcosa.',
  'help.guide.transports-list.step.1':
    'Trasporti è la seconda scheda del viaggio. Tiene solo i tragitti: hotel, ristoranti, eventi e biglietti stanno in Prenotazioni.',
  'help.guide.transports-list.step.2':
    'La barra degli strumenti conta ogni trasporto sotto Tutti e dà a ogni tipo in uso un chip proprio con il proprio conteggio. Clicca un chip per tenere solo quel tipo, cliccalo di nuovo per lasciarlo andare. Più chip possono essere attivi insieme, e Tutti li azzera.',
  'help.guide.transports-list.step.3':
    'Trasporto pubblico automatico è un gruppo a sé, i collegamenti pianificati dalla ricerca di trasporto pubblico. In attesa e Confermata tengono tutto ciò che è stato inserito a mano. La freccia accanto a un titolo richiude un gruppo.',
  'help.guide.transports-list.step.4':
    'Una scheda dice tutto: il punto di stato con In attesa o Confermata, il tipo, i giorni che copre con le loro date, gli orari, il Codice prenotazione, l’itinerario, e la Compagnia aerea con il N. volo, oppure il N. treno, il Binario e il Posto.',
  'help.guide.transports-list.step.5':
    'La matita apre il trasporto per modificarlo, il cestino lo elimina, dopo una domanda che nomina ciò che se ne va.',
  'help.guide.transports-list.result':
    'L’elenco è ristretto a ciò che cercavi, e ogni scheda dice a colpo d’occhio se il tragitto è prenotato.',
  'help.guide.transports-list.tip.1':
    'I chip e i gruppi richiusi vengono ricordati per viaggio, così la scheda si riapre come l’hai lasciata.',
  'help.guide.transports-list.tip.2':
    'Importa da file e AirTrail si affiancano a Trasporto nella barra degli strumenti solo quando il server sa leggere le conferme di prenotazione e quando un’istanza AirTrail è collegata. Senza di loro l’elenco si riempie a mano e con la ricerca di trasporto pubblico.',
  // add-transport
  'help.guide.add-transport.title': 'Aggiungere un trasporto a un giorno',
  'help.guide.add-transport.goal':
    'Mettere il tragitto che ti porta da una tappa alla successiva nel giorno in cui avviene.',
  'help.guide.add-transport.step.1':
    'Ogni intestazione di giorno porta quattro piccoli pulsanti a destra. Clicca il più, il cui suggerimento dice Aggiungi trasporto. Il modulo si apre con Data già impostata su quel giorno.',
  'help.guide.add-transport.step.2':
    'Tipo di prenotazione sceglie cosa prendi: Volo, Treno, Autobus, Auto, Taxi, Bicicletta, Crociera, Traghetto o Altro. Il modulo segue. Un volo riceve un aeroporto su ogni tratta, un treno una catena di stazioni, un’auto le parole Ritiro e Riconsegna e Soste lungo il tragitto.',
  'help.guide.add-transport.step.3':
    'Titolo è l’unico campo che deve essere compilato; Aggiungi resta grigio senza. Scrivi ciò che riconosceresti su un tabellone.',
  'help.guide.add-transport.step.4':
    'Da e A cercano una stazione, un porto o un indirizzo. Digita almeno tre lettere e scegli un risultato dall’elenco. Un nome solo digitato non porta coordinate, quindi non disegna nulla sulla mappa.',
  'help.guide.add-transport.step.5':
    'Data e Ora di inizio dicono quando parte, Data fine e Ora di fine quando è finito; un tragitto che arriva il giorno dopo lì prende il giorno successivo. Codice prenotazione, Stato con In attesa o Confermata, e Note sono facoltativi.',
  'help.guide.add-transport.step.6': 'Clicca Aggiungi.',
  'help.guide.add-transport.result':
    'Il trasporto è una riga sul giorno, al suo orario tra le tappe, e, nella scheda Trasporti, una scheda sotto In attesa o Confermata.',
  'help.guide.add-transport.tip.1':
    'La riga arriva dove la mette il suo orario di inizio, dopo l’ultima tappa che comincia prima. La sua maniglia la trascina in qualsiasi altro punto del giorno, o su un altro giorno.',
  'help.guide.add-transport.tip.2':
    'Allega file sotto File prende il biglietto, e Crea spesa sotto Costi salva la prenotazione e apre l’editor dei Costi per la tariffa.',
  'help.guide.add-transport.tip.3':
    'Viaggiatori segna chi è su questo tragitto. Appena un trasporto ha viaggiatori, la barra della scheda fa crescere i loro avatar e filtra l’elenco per loro.',
  // plan-transit
  'help.guide.plan-transit.title': 'Pianificare un collegamento di trasporto pubblico',
  'help.guide.plan-transit.goal':
    'Lasciare che TREK cerchi i treni e gli autobus reali tra due punti di un giorno e metta nel programma quello che scegli.',
  'help.guide.plan-transit.step.1':
    'Nell’intestazione del giorno, clicca il pulsante tram, Trasporto pubblico. La ricerca si apre per quel giorno.',
  'help.guide.plan-transit.step.2':
    'Da e A prendono una fermata o una stazione. Finché la casella è vuota vengono offerte le tappe proprie del giorno e gli alloggi del viaggio; digitando due lettere si cercano invece le stazioni dell’orario. Inverti tra le due caselle gira il collegamento.',
  'help.guide.plan-transit.step.3':
    'Partenza o Arrivo con un orario dice quando vuoi viaggiare, e Percorso migliore, Meno cambi o Meno spostamenti a piedi dice come devono essere ordinate le risposte.',
  'help.guide.plan-transit.step.4':
    'I chip sotto dicono quali mezzi si possono usare: Treno, Metropolitana, Tram, Autobus, Traghetto e Funivia. Spegnine uno per lasciarlo fuori, almeno uno resta acceso. Poi clicca Cerca.',
  'help.guide.plan-transit.step.5':
    'Ogni risultato dà partenza e arrivo, quanto dura, quanti cambi e quanto si cammina, e le linee nei loro colori. Cliccane uno per aprirlo fermata per fermata, con i binari e i tratti a piedi tra le linee.',
  'help.guide.plan-transit.step.6': 'Clicca Aggiungi al giorno.',
  'help.guide.plan-transit.result':
    'Il collegamento è una riga sul giorno con le sue linee, i suoi cambi e il suo tempo a piedi, e una scheda nella scheda Trasporti sotto Trasporto pubblico automatico.',
  'help.guide.plan-transit.tip.1':
    'I collegamenti vengono da Transitous, un servizio comunitario libero sui dati pubblici degli orari: nessuna chiave, nessun account. Un amministratore può puntare la ricerca su Google al suo posto.',
  'help.guide.plan-transit.tip.2':
    'Non hai trovato nulla? I dati coprono una regione e un periodo. Prova un altro orario, accendi più mezzi, oppure scegli una stazione invece del luogo stesso. Il messaggio nomina il servizio che ha risposto.',
  'help.guide.plan-transit.tip.3':
    'La stessa ricerca si apre per una sola tratta: clicca il connettore del tempo di viaggio tra due tappe e scegli Trasporto pubblico. Da, A e l’orario di partenza sono già compilati per te.',
  // change-transit-route
  'help.guide.change-transit-route.title': 'Aprire e cambiare un collegamento pianificato',
  'help.guide.change-transit-route.goal':
    'Leggere il collegamento fermata per fermata, rinominarlo, oppure cercare di nuovo il percorso.',
  'help.guide.change-transit-route.step.1':
    'Nella scheda Trasporti i collegamenti pianificati stanno sotto Trasporto pubblico automatico. Clicca la scheda.',
  'help.guide.change-transit-route.step.2':
    'Durata, Cambi e A piedi stanno in alto. Itinerario sotto di essi percorre il collegamento fermata per fermata, con i binari e i tratti a piedi tra le linee.',
  'help.guide.change-transit-route.step.3':
    'Cambia percorso rilancia la ricerca, già compilata con i due estremi di questo collegamento e con il suo giorno.',
  'help.guide.change-transit-route.step.4':
    'Scegli un altro collegamento e clicca Aggiungi al giorno; prende il posto del vecchio. Modifica dettagli, accanto a Cambia percorso, apre invece il normale modulo di trasporto, dove stanno il Codice prenotazione, lo Stato, i viaggiatori e i file.',
  'help.guide.change-transit-route.result':
    'Il viaggio in trasporto pubblico porta il nuovo itinerario, e la sua scheda nella scheda Trasporti mostra le nuove linee e i nuovi orari.',
  'help.guide.change-transit-route.tip.1':
    'Il titolo del viaggio in trasporto pubblico è solo testo: la matita accanto lo rinomina senza toccare il percorso. Note sotto accettano il markdown e hanno una linguetta Modifica e una linguetta Anteprima.',
  'help.guide.change-transit-route.tip.2':
    'Elimina ai piedi del viaggio in trasporto pubblico toglie il collegamento dal viaggio; il giorno mantiene le sue tappe.',
  // leg-travel-mode
  'help.guide.leg-travel-mode.title': 'Cambiare come si percorre una tratta',
  'help.guide.leg-travel-mode.goal':
    'Fare a piedi una tratta di un giorno che per il resto è in auto, oppure affidare quella tratta alla ricerca di trasporto pubblico.',
  'help.guide.leg-travel-mode.step.1':
    'I connettori tra le tappe compaiono solo quando il percorso del giorno è acceso. Clicca il giorno per aprirlo, poi Percorso sotto le sue tappe.',
  'help.guide.leg-travel-mode.step.2':
    'Ogni connettore nomina il tempo di viaggio e la distanza di quella tratta, con l’icona del mezzo con cui è stata calcolata: un’auto per la guida, un piede per il cammino.',
  'help.guide.leg-travel-mode.step.3':
    'Clicca il connettore. Il menu offre In auto e A piedi, Trasporto pubblico, e Usa predefinito del giorno.',
  'help.guide.leg-travel-mode.step.4':
    'Scegli A piedi. Cambia solo questa tratta; il resto del giorno mantiene il proprio mezzo.',
  'help.guide.leg-travel-mode.result':
    'La tratta mostra l’icona del piede e il suo tempo a piedi, e le altre tratte del giorno mantengono il mezzo del giorno.',
  'help.guide.leg-travel-mode.tip.1':
    'Il mezzo appartiene alla tratta, non al giorno: i pulsanti In auto e A piedi dell’intero giorno non sovrascrivono mai una tratta che hai impostato a mano. Usa predefinito del giorno restituisce loro la tratta.',
  'help.guide.leg-travel-mode.tip.2':
    'Trasporto pubblico nello stesso menu apre la ricerca dei collegamenti per esattamente questa tratta, con entrambi gli estremi e l’orario di partenza già compilati.',
  'help.guide.leg-travel-mode.tip.3':
    'I tempi vengono da un router pubblico su strade e sentieri pedonali reali. Una tratta a cui non sa rispondere mantiene la sua linea retta e non mostra alcun tempo.',
  // edit-transport
  'help.guide.edit-transport.title': 'Cambiare o eliminare un trasporto',
  'help.guide.edit-transport.goal':
    'Sistemare un orario, un binario o un codice di prenotazione, oppure togliere il tragitto dal viaggio.',
  'help.guide.edit-transport.step.1':
    'Nel programma del giorno un trasporto è una riga colorata tra le tappe. Cliccala.',
  'help.guide.edit-transport.step.2':
    'Il modulo è quello che l’ha creato, con Modifica trasporto nella barra del titolo. Tutto si può cambiare: il tipo, l’itinerario, i giorni e gli orari, il Codice prenotazione, lo Stato.',
  'help.guide.edit-transport.step.3':
    'L’itinerario di un volo è una catena di aeroporti, quello di un treno una catena di stazioni. Aggiungi scalo ne mette un altro in mezzo, e ogni tratta mantiene i propri orari e il proprio numero di volo o di treno.',
  'help.guide.edit-transport.step.4':
    'Clicca Aggiorna. Per togliere del tutto il trasporto, usa il cestino sulla sua scheda nella scheda Trasporti e conferma.',
  'help.guide.edit-transport.result':
    'La modifica si vede ovunque compaia il trasporto: nella scheda Trasporti, nel giorno in cui avviene, e nella sua linea sulla mappa.',
  'help.guide.edit-transport.tip.1':
    'Lo stesso modulo si apre da entrambi i lati, dalla matita sulla scheda nella scheda Trasporti e dalla riga propria del trasporto nel programma del giorno. Un collegamento di trasporto pubblico pianificato è l’eccezione: la sua riga apre il viaggio in trasporto pubblico, e Modifica dettagli porta da lì a questo modulo.',
  'help.guide.edit-transport.tip.2':
    'Spostare un trasporto a un altro giorno non ha affatto bisogno del modulo: trascina la sua riga da una scheda del giorno a quella dopo.',
  // transport-on-map
  'help.guide.transport-on-map.title': 'Disegnare un trasporto sulla mappa',
  'help.guide.transport-on-map.goal': 'Vedere dove passa davvero un volo, un tragitto in auto o un collegamento.',
  'help.guide.transport-on-map.step.1':
    'Un trasporto con entrambi gli estremi impostati porta una piccola icona del percorso sulla sua riga nel programma del giorno. Cliccala; la sua etichetta diventa Nascondi percorsi prenotati.',
  'help.guide.transport-on-map.step.2':
    'Il percorso viene disegnato sulla mappa, con un indicatore a pillola a ogni estremo che porta l’icona del trasporto.',
  'help.guide.transport-on-map.step.3':
    'Clicca un indicatore di estremità per leggere la prenotazione senza lasciare la mappa: gli orari, la Compagnia aerea e il N. volo, il Codice prenotazione e l’indirizzo. Chiudi mette via il foglio.',
  'help.guide.transport-on-map.step.4':
    'L’icona del percorso nella barra sopra i giorni fa l’intero viaggio in una volta: Mostra tutti i percorsi prenotati, e Nascondi tutti i percorsi prenotati per ripulirli di nuovo.',
  'help.guide.transport-on-map.step.5':
    'Un collegamento di trasporto pubblico pianificato non ha un’icona propria. Viene disegnato con l’interruttore Percorso del giorno, ed è per questo che Nascondi tutti i percorsi prenotati non lo toglie finché il percorso di quel giorno è ancora acceso.',
  'help.guide.transport-on-map.result':
    'I percorsi sono sulla mappa con un indicatore a ogni estremo, e restano lì finché non li spegni di nuovo.',
  'help.guide.transport-on-map.tip.1':
    'Un volo, una crociera e un traghetto si disegnano come una curva, un’auto, un autobus, un taxi e una bicicletta seguono le strade reali, e un treno o un collegamento pianificato passa per le stazioni in cui ferma.',
  'help.guide.transport-on-map.tip.2':
    'Una prenotazione confermata è una linea continua, una in attesa è tratteggiata. L’impostazione Etichette percorsi prenotati scrive il codice dell’aeroporto o il nome della stazione negli indicatori alle estremità.',
  'help.guide.transport-on-map.tip.3':
    'Mostra tutti i percorsi prenotati è una tabula rasa, non un livello: scarta ciò che avevano impostato le singole icone, quindi premerlo due volte ti lascia con tutto acceso o tutto spento.',
  // import-transport-file
  'help.guide.import-transport-file.title': 'Leggere un volo dal suo biglietto elettronico',
  'help.guide.import-transport-file.goal':
    'Lascia che TREK tiri fuori un volo, un treno o un traghetto dal biglietto che il vettore ha mandato, e controllalo prima che venga salvato.',
  'help.guide.import-transport-file.step.1':
    'Clicca Importa da file nella barra degli strumenti della scheda Trasporti, accanto a Trasporto. Si apre Importa conferme di prenotazione, la stessa finestra che ha la scheda Prenotazioni.',
  'help.guide.import-transport-file.step.2':
    'Lascia cadere il biglietto sul riquadro, oppure cliccalo e scegli il file: EML, PDF, PKPass, HTML e TXT, fino a cinque file da 10 MB ciascuno. I file che hai scelto sono nominati sul riquadro.',
  'help.guide.import-transport-file.step.3':
    'Clicca Importa. La finestra si chiude subito; la lettura avviene in secondo piano.',
  'help.guide.import-transport-file.step.4':
    'Una scheda in basso a destra racconta l’esecuzione sotto il nome del file. Analisi dei file in corso… diventa una spunta quando la lettura è finita, e la scheda offre Importa. Cliccalo.',
  'help.guide.import-transport-file.step.5':
    'Un volo si apre in Aggiungi trasporto, già compilato: Tipo di prenotazione su Volo, la compagnia e il numero di volo in Titolo, entrambi gli aeroporti sotto Itinerario con Partenza e Arrivo, i loro orari e i loro fusi orari, Compagnia aerea e N. volo, il Codice prenotazione e il biglietto sotto File. Controllalo e clicca Aggiungi.',
  'help.guide.import-transport-file.result':
    'Il volo è una scheda in In attesa nella scheda Trasporti e una riga nel giorno in cui parte, con il biglietto sotto File, e con entrambi gli aeroporti noti disegna la sua curva sulla mappa.',
  'help.guide.import-transport-file.tip.1':
    'Le due schede condividono un solo import: un file che contiene un volo e un hotel apre il volo in Aggiungi trasporto e l’hotel in Nuova prenotazione, uno dopo l’altro, qualunque sia la scheda da cui sei partito.',
  'help.guide.import-transport-file.tip.2':
    'Gli aeroporti sono posizionati dal loro codice. Una stazione o un porto che la lettura non è riuscita a localizzare è nominato in ambra sulla scheda; sceglilo a mano sotto Itinerario prima di cliccare Aggiungi, altrimenti il trasporto non disegna nulla sulla mappa.',
  // airtrail-import
  'help.guide.airtrail-import.title': 'Importare voli da AirTrail',
  'help.guide.airtrail-import.goal':
    'Porta nel viaggio in un colpo solo i voli che tieni già in AirTrail, e lascia che da lì in poi seguano AirTrail.',
  'help.guide.airtrail-import.step.1':
    'Con l’addon AirTrail acceso e la tua istanza collegata sotto Integrazioni in Impostazioni, la barra degli strumenti della scheda Trasporti porta un pulsante AirTrail accanto a Trasporto. Cliccalo.',
  'help.guide.airtrail-import.step.2':
    'Importa da AirTrail elenca i voli del tuo account in due gruppi. Durante questo viaggio tiene quelli datati dentro il viaggio, già spuntati; Altri voli tiene il resto, non spuntati. Un volo che è già nel viaggio è in grigio e segnato Importato.',
  'help.guide.airtrail-import.step.3':
    'Ogni riga è una casella con la compagnia e il numero di volo, i due aeroporti e la data. Clicca una riga per prendere il volo o lasciarlo fuori; quelli sotto Altri voli entrano solo se li spunti.',
  'help.guide.airtrail-import.step.4':
    'I voli che si collegano, ciascuno in partenza entro un giorno dall’aeroporto in cui è atterrato il precedente, sono incorniciati insieme. La casella sotto, Importa come un unico volo con scalo a quell’aeroporto, è già spuntata: lasciala per una sola prenotazione con scalo, oppure togli la spunta per importare le tratte come voli separati.',
  'help.guide.airtrail-import.step.5':
    'Clicca Importa. Il pulsante conta i voli spuntati, e il messaggio dopo dice quanti sono entrati.',
  'help.guide.airtrail-import.step.6':
    'I voli sono schede sotto Confermata, ognuna con un distintivo blu AirTrail accanto al suo stato, e righe nei giorni in cui volano. Un collegamento unito è una sola scheda, con il suo itinerario che passa per lo scalo.',
  'help.guide.airtrail-import.result':
    'I voli da AirTrail sono schede nella scheda Trasporti e righe nei loro giorni, ognuna con il distintivo AirTrail che dice da dove viene.',
  'help.guide.airtrail-import.tip.1':
    'Un volo che è già nel viaggio con lo stesso numero e la stessa data viene saltato, e un messaggio dice quanti lo sono stati. Annulla nella barra degli strumenti sopra i giorni ritira l’intero import.',
  'help.guide.airtrail-import.tip.2':
    'AirTrail resta la fonte di verità. TREK legge le sue modifiche quando apri il viaggio e ogni pochi minuti in secondo piano; un volo eliminato lì tiene la sua scheda, con il distintivo passato a Non sincronizzato. Le modifiche fatte in TREK tornano indietro solo con Scrivi le modifiche su AirTrail acceso sotto Integrazioni.',
  'help.guide.airtrail-import.tip.3':
    'Un collegamento unito non ha un singolo volo AirTrail da seguire, quindi è un import una tantum: tiene il distintivo blu, e passando sopra il distintivo lo si legge. Lo stesso succede a un volo sincronizzato a cui dai uno scalo a mano.',

  // ── Screen: trip-roadtrip ─────────────────────────────────────────────────────────────
  'help.ctx.trip-roadtrip.title': 'Viaggio su strada',
  'help.ctx.trip-roadtrip.summary':
    'Il programma letto come un solo tragitto in auto: gli stessi giorni e gli stessi luoghi, incatenati in soste con la guida in mezzo, in un elenco lungo la colonna di sinistra e sulla mappa. Dice quanto è lontano e quanto dura, dove finisce il serbatoio e cosa c’è lungo la strada.',
  'help.ctx.trip-roadtrip.bullet.1':
    'Giorni e Viaggio su strada in cima alla colonna di sinistra passano dal programma dei giorni al tragitto in auto. Niente viene copiato e niente viene cambiato: Giorni restituisce il programma esattamente com’era.',
  'help.ctx.trip-roadtrip.bullet.2':
    'La testa dell’elenco somma il viaggio: Distanza, Tempo di guida e Soste. Sotto arriva un riquadro per giorno, con i chilometri propri del giorno, per quante soste è fatto, quello che sfora, e un distintivo Traccia.',
  'help.ctx.trip-roadtrip.bullet.3':
    'Una sosta numerata è un luogo per cui il giorno esiste. Una sosta lungo il percorso, carburante, ricarica, un’area di sosta, porta l’icona del suo tipo al posto di un numero e non viene contata. Clicca un numero per cambiare cos’è, e il distintivo Sosta per dire quanto dura.',
  'help.ctx.trip-roadtrip.bullet.4':
    'Tra due soste una fascia di guida dà la tratta come distanza e tempo. Cliccala per Percorsi per questa tratta, oppure clicca il percorso disegnato sulla mappa per piegare la tratta attraverso un punto di passaggio.',
  'help.ctx.trip-roadtrip.bullet.5':
    'La colonna di destra diventa Lungo il percorso: scegli un giorno, cosa cercare e quanto è largo il corridoio, poi Cerca. Aggiungi mette un risultato nel tragitto nel punto in cui viene davvero passato.',
  'help.ctx.trip-roadtrip.bullet.6':
    'Le Impostazioni di guida sotto tengono i limiti, l’auto e la sua autonomia, gli orari giornalieri, cosa evitare e come viene disegnata la linea. Appartengono al viaggio, quindi tutti pianificano con la stessa auto.',
  // roadtrip-mode
  'help.guide.roadtrip-mode.title': 'Leggere il viaggio come un solo tragitto in auto',
  'help.guide.roadtrip-mode.goal': 'Porta il programma in modalità viaggio su strada e leggi cosa ti dice l’elenco.',
  'help.guide.roadtrip-mode.step.1':
    'Clicca Viaggio su strada nel selettore Giorni e Viaggio su strada in cima alla colonna di sinistra. Il programma dei giorni viene sostituito dal tragitto in auto, e la mappa disegna ogni giorno per cui il percorso è stato calcolato.',
  'help.guide.roadtrip-mode.step.2': 'La testa dell’elenco somma tutto il viaggio: Distanza, Tempo di guida e Soste.',
  'help.guide.roadtrip-mode.step.3':
    'Sotto arriva un riquadro per giorno. La sua intestazione porta numero e data del giorno, la guida come distanza e tempo, e per quante soste è fatto il giorno.',
  'help.guide.roadtrip-mode.step.4':
    'Dentro il riquadro il giorno è una catena: una sosta numerata per luogo, una fascia di guida tra ogni coppia, e l’orario di arrivo sul bordo destro.',
  'help.guide.roadtrip-mode.step.5':
    'Clicca l’intestazione di un giorno per ripiegarlo. Un giorno ripiegato sparisce anche dalla mappa; clicca di nuovo l’intestazione per riportarlo.',
  'help.guide.roadtrip-mode.result':
    'La colonna di sinistra è il tragitto in auto e la mappa ne mostra ogni giorno. Giorni torna dritto al programma, immutato.',
  'help.guide.roadtrip-mode.tip.1':
    'La scelta viene ricordata per viaggio finché la scheda del browser resta aperta, quindi un ricaricamento torna sul tragitto in auto.',
  'help.guide.roadtrip-mode.tip.2':
    'Il selettore esiste solo una volta che un amministratore ha acceso il modulo Viaggio su strada, sotto Moduli nell’Amministrazione.',
  'help.guide.roadtrip-mode.tip.3':
    'Sul telefono non c’è selettore: il modulo aggiunge una scheda Viaggio su strada tutta sua accanto a Programma.',
  // roadtrip-stops
  'help.guide.roadtrip-stops.title': 'Le soste lungo il percorso, e quanto ti fermi',
  'help.guide.roadtrip-stops.goal':
    'Trasforma un luogo del tragitto in una sosta lungo il percorso, e indica quanto dura ogni sosta.',
  'help.guide.roadtrip-stops.step.1':
    'Clicca il numero davanti a una sosta nell’elenco. La sua etichetta è Trasforma in sosta lungo il percorso, e apre Tipo di sosta.',
  'help.guide.roadtrip-stops.step.2':
    'Scegli un tipo: Alloggi, Carburante, Ricarica, Area di sosta, Campeggio, Ristoro o Da vedere. Il numero diventa l’icona di quel tipo e le soste sotto vengono rinumerate.',
  'help.guide.roadtrip-stops.step.3':
    'Una sosta lungo il percorso non è una destinazione, quindi l’intestazione del giorno conta una sosta in meno.',
  'help.guide.roadtrip-stops.step.4':
    'Clicca di nuovo l’icona, Cambia il tipo di sosta, e scegli Torna a essere una destinazione per ridare il suo numero alla sosta.',
  'help.guide.roadtrip-stops.step.5': 'Ogni sosta porta un distintivo Sosta. Cliccalo per aprire Tempo alla sosta.',
  'help.guide.roadtrip-stops.step.6':
    'Imposta la durata con il cursore, con i pulsanti meno e più o con uno dei valori pronti, guarda cosa fanno Arrivo e Partenza, poi clicca Salva.',
  'help.guide.roadtrip-stops.result':
    'La sosta a cui hai dato un tempo porta l’ora sul suo distintivo Sosta e ogni arrivo dopo di lei si è spostato, e quella che hai mandato a un tipo e indietro è di nuovo una destinazione numerata.',
  'help.guide.roadtrip-stops.tip.1':
    'Una permanenza appartiene al luogo, non a una visita: in un luogo pianificato in due giorni ci si ferma lo stesso tempo in entrambi.',
  'help.guide.roadtrip-stops.tip.2':
    'Le soste lungo il percorso compaiono anche sotto Giorni. Spegnere Mostra anche in Giorni, sotto Soste di servizio nelle Impostazioni di guida, le tiene solo nel Viaggio su strada.',
  'help.guide.roadtrip-stops.tip.3': 'Nessuna sosta, nella stessa finestra, toglie di nuovo quel tempo.',
  // roadtrip-corridor
  'help.guide.roadtrip-corridor.title': 'Trovare carburante, cibo e un letto lungo il percorso',
  'help.guide.roadtrip-corridor.goal':
    'Cerca sulla strada che percorri davvero, e metti quel che trovi sulla tratta giusta.',
  'help.guide.roadtrip-corridor.step.1':
    'Scegli il giorno in cima a Lungo il percorso. Vengono offerti solo i giorni con il percorso calcolato.',
  'help.guide.roadtrip-corridor.step.2':
    'Sotto Sto cercando, spunta ciò che ti serve. Carburante, Ricarica, Area di sosta, Campeggio, Alloggi, Ristoro e Da vedere si possono combinare.',
  'help.guide.roadtrip-corridor.step.3':
    'Sotto Entro, scegli quanto cercare ai due lati della strada, 2 km, 5 km o 10 km, poi clicca Cerca.',
  'help.guide.roadtrip-corridor.step.4':
    'I risultati tornano raggruppati per tipo, nell’ordine in cui li passi, ognuno con il punto del giorno in cui si trova e quanto è fuori percorso.',
  'help.guide.roadtrip-corridor.step.5':
    'Aggiungi su un risultato apre Aggiungi come sosta. Dice su quale giorno e in quale posizione finisce la sosta, chiede il tipo e il tempo alla sosta, e Aggiungi la mette nel tragitto.',
  'help.guide.roadtrip-corridor.result':
    'I risultati sono elencati nell’ordine in cui li passi e disegnati sulla mappa, e quello che hai aggiunto sta nel tragitto nel punto in cui viene davvero passato.',
  'help.guide.roadtrip-corridor.tip.1':
    'Non si cerca niente finché non premi Cerca: una sola esecuzione sono molte richieste a un servizio condiviso.',
  'help.guide.roadtrip-corridor.tip.2':
    'Filtra per nome restringe quello che è tornato senza chiedere di nuovo, e Svuota risultati svuota l’elenco e i suoi segnaposti. Clicca un risultato per portarlo in vista sulla mappa.',
  'help.guide.roadtrip-corridor.tip.3':
    'Un risultato si può anche trascinare dalla mappa sul percorso disegnato, ed è così che scegli tu la tratta dove la stessa strada viene percorsa due volte. Aggiungi a mano, accanto a Cerca, cerca invece un luogo per nome.',
  // roadtrip-via
  'help.guide.roadtrip-via.title': 'Piegare una tratta attraverso un punto di passaggio',
  'help.guide.roadtrip-via.goal': 'Manda una tratta sulla strada che vuoi davvero, senza aggiungerle una sosta.',
  'help.guide.roadtrip-via.step.1':
    'Porta in vista la tratta che ti interessa: clicca una sosta nell’elenco, poi chiudi il riquadro che si apre sopra la mappa.',
  'help.guide.roadtrip-via.step.2':
    'Clicca il percorso disegnato. Un punto di passaggio viene posato sulla tratta che hai cliccato, e la tratta viene ricalcolata passando per lui.',
  'help.guide.roadtrip-via.step.3':
    'L’elenco segue: l’intestazione del giorno porta la nuova distanza e il nuovo tempo di guida, e ogni arrivo dopo il punto di passaggio si sposta con lui.',
  'help.guide.roadtrip-via.step.4':
    'Passa sopra la maniglia e dice cosa sa fare: Trascina per rimodellare il percorso, clic destro per rimuovere. Trascinala altrove e la tratta viene ridisegnata per il nuovo punto.',
  'help.guide.roadtrip-via.step.5':
    'Fai clic destro sulla maniglia per toglierla. La tratta torna a fare la strada diretta.',
  'help.guide.roadtrip-via.result':
    'La tratta segue la strada che hai scelto, e distanza, tempo di guida e arrivi del giorno vengono ricalcolati per lei.',
  'help.guide.roadtrip-via.tip.1':
    'Un punto di passaggio non è una sosta: non ha numero, né permanenza, né orario di arrivo, e non conta tra le soste del giorno.',
  'help.guide.roadtrip-via.tip.2':
    'Le maniglie vengono disegnate dal livello di zoom 9, quindi una mappa adattata a tutto il viaggio mostra la linea senza di esse.',
  'help.guide.roadtrip-via.tip.3':
    'Un clic a più di due chilometri da qualsiasi tratta disegnata viene ignorato, e così un clic su un volo, un treno o un traghetto.',
  // roadtrip-alternatives
  'help.guide.roadtrip-alternatives.title': 'Provare un altro modo di percorrere una tratta',
  'help.guide.roadtrip-alternatives.goal': 'Guarda cos’altro offre il router per un tratto, e prendilo.',
  'help.guide.roadtrip-alternatives.step.1':
    'Clicca una fascia di guida nell’elenco, la riga tra due soste che dà la tratta come distanza e tempo. La sua etichetta è Altri percorsi.',
  'help.guide.roadtrip-alternatives.step.2':
    'Percorsi per questa tratta si apre sopra la mappa, una voce per strada, ognuna disegnata sulla mappa con il suo colore.',
  'help.guide.roadtrip-alternatives.step.3':
    'Passa sopra una voce per accendere quella strada. Attuale è la strada che si sta percorrendo e La più veloce la più rapida; le altre dicono quanto sono più lente, o quale classe di strada lasciano fuori.',
  'help.guide.roadtrip-alternatives.step.4':
    'Clicca una voce per fare quella strada, oppure Chiudi per tenere quella su cui sei.',
  'help.guide.roadtrip-alternatives.result':
    'La tratta fa la strada che hai scelto, e la distanza nell’elenco e gli arrivi successivi cambiano con lei.',
  'help.guide.roadtrip-alternatives.tip.1':
    'Scegliere un’altra strada posa un punto di passaggio sulla tratta e sostituisce quelli che aveva già; scegliere la strada propria del router li toglie di nuovo.',
  'help.guide.roadtrip-alternatives.tip.2':
    'Senza autostrada, Senza pedaggi e Senza traghetto vengono da un secondo motore con un suo modello di velocità, quindi i loro tempi non sono confrontabili con gli altri.',
  // roadtrip-limits
  'help.guide.roadtrip-limits.title': 'Impostare l’auto e i limiti di guida',
  'help.guide.roadtrip-limits.goal': 'Indica a TREK cosa guidi e quanto sei disposto a guidare di fila.',
  'help.guide.roadtrip-limits.step.1':
    'Impostazioni di guida sta sotto la ricerca nella colonna di destra. I suoi distintivi dicono cosa è impostato; cliccala per aprirla.',
  'help.guide.roadtrip-limits.step.2':
    'Sotto Guida, Tratto più lungo di fila e Guida al giorno sono in minuti. Un campo vuoto vale off, e non viene segnalato niente.',
  'help.guide.roadtrip-limits.step.3':
    'Sotto Veicolo, indica cosa guidi. Benzina fa il pieno solo alle soste carburante, Elettrico solo a quelle di ricarica, Entrambi a tutte e due.',
  'help.guide.roadtrip-limits.step.4':
    'Scrivi tu stesso Autonomia con un pieno, oppure Autonomia per ricarica. Calcola dai dati dell’auto sotto prende Serbatoio e Consumo, o Batteria e Consumo, e fa il conto.',
  'help.guide.roadtrip-limits.step.5':
    'Evita se possibile è una preferenza, non un divieto: un giorno senza alternative usa comunque quella strada, e lo dice nella sua intestazione.',
  'help.guide.roadtrip-limits.step.6':
    'Chiudi la finestra. Il riquadro dice cosa è impostato, e l’elenco segna ogni tratta e ogni giorno che sfora.',
  'help.guide.roadtrip-limits.result':
    'I distintivi del riquadro dicono cosa è impostato, e ogni tratta e ogni giorno oltre un limite porta un distintivo nell’elenco.',
  'help.guide.roadtrip-limits.tip.1':
    'Le impostazioni appartengono al viaggio, quindi tutti quelli che ci sono pianificano con la stessa auto e gli stessi limiti.',
  'help.guide.roadtrip-limits.tip.2':
    'Riempi fino a dice quanto riempie una sosta, perché nessuno carica al 100 % per strada. Una sosta carburante o di ricarica può scavalcarlo per sé.',
  'help.guide.roadtrip-limits.tip.3':
    'Linea del percorso decide come viene disegnato il tragitto: Collega i giorni calcola la notte tra due giorni, e Un colore per giorno dà a ogni giorno il suo.',
  // roadtrip-day-window
  'help.guide.roadtrip-day-window.title': 'Dare un inizio e una fine alla giornata di guida',
  'help.guide.roadtrip-day-window.goal':
    'Smetti di guidare a un’ora che scegli tu, e indica dove deve finire la giornata.',
  'help.guide.roadtrip-day-window.step.1':
    'Apri Impostazioni di guida nella colonna di destra e trova Orari giornalieri.',
  'help.guide.roadtrip-day-window.step.2':
    'Imposta un Inizio giornata. Da solo non fa niente: servono entrambi gli orari, come dice la nota sotto.',
  'help.guide.roadtrip-day-window.step.3':
    'Imposta una Fine giornata. Il tragitto ora si ferma a quell’ora e porta il resto al mattino dopo, come una riga Fine giornata e una riga Riprendi il viaggio nell’elenco.',
  'help.guide.roadtrip-day-window.step.4':
    'Sotto Fine giornata, scegli Lungo il percorso per fermarti sulla strada all’ora di fine, oppure Nell’ultimo luogo per fermarti prima che il tragitto successivo la superi.',
  'help.guide.roadtrip-day-window.step.5':
    'Chiudi la finestra. Il riquadro Impostazioni di guida porta i due orari come distintivo.',
  'help.guide.roadtrip-day-window.result':
    'Il tragitto viene tagliato in giornate di strada della lunghezza che hai impostato, e quel che non entra continua su giorni calcolati dopo l’ultimo. I tuoi giorni e i loro luoghi non vengono cambiati.',
  'help.guide.roadtrip-day-window.tip.1':
    'Svuotare uno dei due orari spegne di nuovo tutto. Gli orari che hai fissato tu su una sosta hanno sempre la precedenza.',
  'help.guide.roadtrip-day-window.tip.2':
    'Con gli orari giornalieri impostati i giorni sono sempre collegati: il tragitto dall’ultima sosta di un giorno alla prima del giorno dopo viene calcolato e contato.',
  'help.guide.roadtrip-day-window.tip.3':
    'Ogni fine giornata è anche un segno sulla mappa, una luna con il numero del giorno. Trascinala lungo il percorso, o su un luogo, per far finire la giornata altrove; fai clic destro per rimettere la fine automatica, e Ripristina le fini giornata automatiche in questa finestra annulla tutto.',
  // roadtrip-refuel
  'help.guide.roadtrip-refuel.title': 'Fare rifornimento prima che il serbatoio si esaurisca',
  'help.guide.roadtrip-refuel.goal':
    'Trova dove fare rifornimento sul tratto che l’auto riesce ancora a raggiungere, e mettilo nel tragitto.',
  'help.guide.roadtrip-refuel.step.1':
    'Con un’autonomia impostata, l’elenco disegna una fascia attraverso la tratta nel punto in cui finisce: Qui il serbatoio si esaurisce, e sotto quanto dentro la tratta cade quel punto.',
  'help.guide.roadtrip-refuel.step.2':
    'La lampadina sulla fascia è il pulsante. Cerca carburante guarda lungo la strada che hai già percorso, con Ricerca lungo il percorso… mentre lo fa.',
  'help.guide.roadtrip-refuel.step.3':
    'Tornano fino a tre stazioni, ognuna con quanto è fuori percorso e quanta autonomia lascerebbe di riserva.',
  'help.guide.roadtrip-refuel.step.4':
    'Il più su un’offerta la aggiunge come sosta carburante. Aggiungi come sosta si apre con tipo e tempo già compilati, e Aggiungi la mette sulla tratta nel punto in cui viene davvero passata.',
  'help.guide.roadtrip-refuel.result':
    'La sosta è sulla tratta giusta con la sua icona, l’autonomia riparte da lei, e la fascia è sparita.',
  'help.guide.roadtrip-refuel.tip.1':
    'L’autonomia conta dall’ultima sosta carburante o di ricarica, anche tra giorni diversi. Cosa guidi decide quali soste contano: Benzina solo il carburante, Elettrico solo la ricarica.',
  'help.guide.roadtrip-refuel.tip.2':
    'La ricerca guarda la strada prima del punto a secco, tiene una riserva e conta la deviazione due volte, quindi tutto quello che offre è davvero raggiungibile.',
  'help.guide.roadtrip-refuel.tip.3':
    'Una risposta vuota non è un vicolo cieco: la lampadina diventa Riprova, perché la ricerca dei luoghi è un servizio condiviso che ogni tanto va in timeout.',
  // roadtrip-track
  'help.guide.roadtrip-track.title': 'Far seguire a un giorno una traccia importata',
  'help.guide.roadtrip-track.goal':
    'Metti il tragitto di un giorno su una strada panoramica che hai importato come traccia GPX o KML.',
  'help.guide.roadtrip-track.step.1':
    'Clicca il distintivo Traccia nell’intestazione di un giorno. La finestra si apre su quel giorno.',
  'help.guide.roadtrip-track.step.2':
    'Scegli una traccia. Ognuna dice quanto è lunga e se corre lungo questo giorno oppure quanto dista, la più vicina per prima.',
  'help.guide.roadtrip-track.step.3':
    'Clicca Segui questa traccia. TREK posa punti di passaggio dove il tragitto si allontana di più dalla traccia, e ricalcola, giro dopo giro.',
  'help.guide.roadtrip-track.step.4':
    'Dice quanti punti di passaggio ha posato e quanto vicino resta ora il tragitto. Il pulsante sotto toglie di nuovo quei punti di passaggio e ridà il giorno al router; chiudere la finestra tiene la traccia.',
  'help.guide.roadtrip-track.result':
    'Il tragitto del giorno segue la traccia invece della strada scelta dal router, e il suo distintivo Traccia è acceso e nomina quella traccia quando ci punti sopra.',
  'help.guide.roadtrip-track.tip.1':
    'Importa il file sotto Giorni con Importa file, spuntando Percorsi o Tracce. Finché il viaggio non ne ha una, nessun giorno porta il distintivo.',
  'help.guide.roadtrip-track.tip.2':
    'Seguire una traccia sostituisce i punti di passaggio che le tratte del giorno avevano già, quindi modella una tratta a mano dopo la traccia, non prima.',
};

export default help;
