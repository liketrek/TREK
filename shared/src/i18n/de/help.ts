import type { TranslationStrings } from '../types';

const help: TranslationStrings = {
  'help.title': 'Hilfe & Doku',
  'help.search': 'Doku durchsuchen…',
  'help.contents': 'Inhalt',
  'help.noResults': 'Keine passenden Seiten.',
  'help.errorTitle': 'Seite konnte nicht geladen werden',
  'help.errorBody': 'Die Hilfe-Inhalte kommen aus dem TREK-Wiki. Prüfe deine Verbindung und versuch es erneut.',

  // ── Hilfecenter (das Panel hinter dem ? in der Navigationsleiste) ─────────
  'help.center.button': 'Hilfe zu dieser Ansicht',
  'help.center.title': 'Hilfe',
  'help.center.onThisScreen': 'Auf dieser Ansicht',
  'help.center.screens': 'Ansichten',
  'help.center.thisScreen': 'Diese Ansicht',
  'help.center.subScreens': 'Unteransichten: {count}',
  'help.center.subScreensLabel': 'Unteransichten',
  'help.center.guidesCount': '{count} Anleitungen',
  'help.center.goToScreen': 'Zu {screen} wechseln',
  'help.center.overview': 'Überblick',
  'help.center.howTo': 'Wie kann ich…',
  'help.center.searchPlaceholder': 'Anleitungen und Doku durchsuchen…',
  'help.center.searchEmpty': 'Nichts gefunden für „{query}".',
  'help.center.searchGuides': 'Anleitungen',
  'help.center.searchDocs': 'Doku',
  'help.center.searchError': 'Die Suche ist gerade nicht verfügbar.',
  'help.center.back': 'Zurück',
  'help.center.close': 'Hilfe schließen',
  'help.center.steps': '{count} Schritte',
  'help.center.step': 'Schritt {n}',
  'help.center.stepsLabel': 'Schritte',
  'help.center.stepOf': 'Schritt {n} von {total}',
  'help.center.screenshot': 'Screenshot',
  'help.center.result': 'Das Ergebnis',
  'help.center.tips': 'Gut zu wissen',
  'help.center.related': 'Verwandt',
  'help.center.openDocs': 'In Hilfe & Doku öffnen',
  'help.center.docsSection': 'In der Doku',
  'help.center.noContext': 'Für diese Ansicht gibt es noch keine Anleitung.',
  'help.center.noContextHint': 'Durchsuche die Doku oder sag uns, wonach du gesucht hast.',
  'help.center.feedback': 'Fehlt etwas?',
  'help.center.feedbackLink': 'Sag es uns auf GitHub',
  'help.center.discord': 'Auf Discord fragen',
  'help.center.quick': 'Kurz',
  'help.center.guide': 'Anleitung',
  'help.center.tour': 'Rundgang',
  'help.center.imageAlt': 'Schritt {n} von „{title}"',

  // ── Ansicht: Dashboard ────────────────────────────────────────────────────
  'help.ctx.dashboard.title': 'Dashboard',
  'help.ctx.dashboard.summary':
    'Das Dashboard ist die Eingangstür zu jeder Reise. Die Bordkarte oben zeigt die Reise, die gerade läuft oder als Nächstes ansteht, die Reihe darunter zählt, was du bisher bereist hast, und die Karten listen alles, was du planst, archiviert hast oder schon hinter dir hast.',
  'help.ctx.dashboard.bullet.1':
    'Bordkarte: die laufende oder nächste Reise mit Daten, Mitreisenden, Orten und Countdown. Ein Klick öffnet die Reise.',
  'help.ctx.dashboard.bullet.2':
    'Reisestatistik: besuchte Länder, Reisen, Tage unterwegs und geflogene Distanz, über alle deine Reisen.',
  'help.ctx.dashboard.bullet.3':
    'Reisekarten, gefiltert nach Geplant, Archiviert und Abgeschlossen, als Raster oder Liste. Fahr über eine Karte für Bearbeiten, Duplizieren, Archivieren und Löschen.',
  'help.ctx.dashboard.bullet.4':
    'Widgets rechts: Währungsrechner, Weltuhren, anstehende Buchungen und Sammlungen. Jedes davon lässt sich abschalten.',
  'help.ctx.dashboard.bullet.5': 'Die Karte „Neue Reise“ und der Button unten rechts starten beide eine neue Reise.',

  // create-trip
  'help.guide.create-trip.title': 'Eine Reise anlegen',
  'help.guide.create-trip.goal': 'Eine neue Reise mit Name, Daten und Titelbild starten.',
  'help.guide.create-trip.step.1':
    'Klick auf „Neue Reise“. Die Karte am Ende deiner Reisen und der Button unten rechts tun dasselbe.',
  'help.guide.create-trip.step.2':
    'Gib der Reise einen Namen. Das ist das einzige Pflichtfeld, alles andere kannst du später ergänzen.',
  'help.guide.create-trip.step.3':
    'Wähle Start- und Enddatum. TREK legt pro Datum einen Tag an, dein Reiseplan ist damit bereit zum Befüllen.',
  'help.guide.create-trip.step.4':
    'Optional: ein Titelbild. Lade ein eigenes hoch, zieh eines hinein oder such auf Unsplash nach dem Reiseziel.',
  'help.guide.create-trip.step.5': 'Klick auf „Neue Reise erstellen“.',
  'help.guide.create-trip.result':
    'Die Reise erscheint auf deinem Dashboard. Ist sie deine nächste, übernimmt sie die Bordkarte oben.',
  'help.guide.create-trip.tip.1':
    'Die Daten lassen sich später ändern. Gibt es schon Buchungen, fragt TREK, ob sie mit den Tagen verschoben werden sollen.',
  'help.guide.create-trip.tip.2':
    'Die Reisewährung, die du hier wählst, ist die, in die jede Ausgabe umgerechnet wird. Nimm die Währung des Reiseziels.',

  // edit-trip
  'help.guide.edit-trip.title': 'Eine Reise bearbeiten',
  'help.guide.edit-trip.goal': 'Eine Reise umbenennen, die Daten ändern oder die Einstellungen anpassen.',
  'help.guide.edit-trip.step.1': 'Fahr über die Reisekarte (oder die Bordkarte) und klick auf den Stift.',
  'help.guide.edit-trip.step.2':
    'Ändere, was du brauchst: Name, Beschreibung, Daten, Titelbild, Währung, Erinnerung oder Mitglieder.',
  'help.guide.edit-trip.step.3': 'Klick auf „Aktualisieren“.',
  'help.guide.edit-trip.result': 'Die Karte aktualisiert sich sofort, für jedes Mitglied der Reise.',
  'help.guide.edit-trip.tip.1':
    'Verschiebst du die Daten einer Reise, die schon Buchungen hat, folgt ein zweiter Schritt mit der Frage, ob die Buchungen mitwandern sollen.',

  // cover-image
  'help.guide.cover-image.title': 'Ein Titelbild setzen',
  'help.guide.cover-image.goal': 'Einer Reise ein Bild geben, das auf der Karte und der Bordkarte erscheint.',
  'help.guide.cover-image.step.1': 'Öffne das Bearbeiten-Formular der Reise über den Stift auf ihrer Karte.',
  'help.guide.cover-image.step.2':
    'Unter „Titelbild“ ein Foto hineinziehen, zum Hochladen klicken oder ein Reiseziel in die Unsplash-Suche tippen.',
  'help.guide.cover-image.step.3': 'Foto auswählen und auf „Aktualisieren“ klicken.',
  'help.guide.cover-image.result':
    'Das Foto wird mit der Reise gespeichert und überall angezeigt, wo die Reise gelistet ist.',
  'help.guide.cover-image.tip.1':
    'Fotos aus der Unsplash-Suche werden automatisch mit Urheber versehen, eigene Uploads bleiben auf deinem Server.',

  // duplicate-trip
  'help.guide.duplicate-trip.title': 'Eine Reise duplizieren',
  'help.guide.duplicate-trip.goal': 'Eine Reise als Vorlage für eine neue wiederverwenden.',
  'help.guide.duplicate-trip.step.1': 'Fahr über die Karte und klick auf das Duplizieren-Symbol.',
  'help.guide.duplicate-trip.step.2': 'Lies, was kopiert wird und was nicht, dann bestätige.',
  'help.guide.duplicate-trip.result': 'Eine Kopie erscheint neben dem Original, bereit zum Umbenennen und Umdatieren.',
  'help.guide.duplicate-trip.tip.1':
    'Tage, Orte, Buchungen, Budgetposten, Packlisten und Tagesnotizen kommen mit. Mitglieder, Chat, Umfragen, Dateien und Freigabelinks nicht.',

  // archive-trip
  'help.guide.archive-trip.title': 'Eine Reise archivieren und wiederherstellen',
  'help.guide.archive-trip.goal': 'Eine Reise beiseitelegen, ohne sie zu löschen, und später zurückholen.',
  'help.guide.archive-trip.step.1': 'Fahr über die Karte und klick auf „Archivieren“.',
  'help.guide.archive-trip.step.2': 'Stell den Filter über den Karten auf „Archiviert“, um sie wiederzusehen.',
  'help.guide.archive-trip.step.3':
    'Klick auf der Karte auf „Wiederherstellen“, um sie zurück nach „Geplant“ zu holen.',
  'help.guide.archive-trip.result':
    'Archivierte Reisen behalten alles. Sie räumen nur das Dashboard und den Kalender-Feed aller Reisen frei.',

  // delete-trip
  'help.guide.delete-trip.title': 'Eine Reise löschen',
  'help.guide.delete-trip.goal': 'Eine Reise endgültig entfernen.',
  'help.guide.delete-trip.step.1': 'Fahr über die Karte und klick auf den Papierkorb.',
  'help.guide.delete-trip.step.2': 'Bestätige. Der Dialog nennt die Reise beim Namen, damit du die richtige erwischst.',
  'help.guide.delete-trip.result':
    'Die Reise, ihre Tage, Orte, Buchungen und Dateien sind weg. Es gibt kein Zurück, im Zweifel lieber archivieren.',

  // filter-and-view
  'help.guide.filter-and-view.title': 'Abgeschlossene Reisen finden, Raster und Liste wechseln',
  'help.guide.filter-and-view.goal': 'Beendete oder archivierte Reisen sehen und das Layout wählen, das dir liegt.',
  'help.guide.filter-and-view.step.1':
    'Nutze „Geplant“, „Archiviert“ und „Abgeschlossen“ über den Karten. Abgeschlossen ist jede Reise, deren Enddatum vorbei ist.',
  'help.guide.filter-and-view.step.2':
    'Klick auf das Listen-Symbol für eine kompakte Liste, noch einmal für das Raster.',
  'help.guide.filter-and-view.result': 'Das Dashboard merkt sich dein Layout auf diesem Gerät.',

  // calendar-feed
  'help.guide.calendar-feed.title': 'Alle Reisen im Kalender abonnieren',
  'help.guide.calendar-feed.goal':
    'Tage und Buchungen jeder aktiven Reise in deiner Kalender-App sehen, immer synchron.',
  'help.guide.calendar-feed.step.1': 'Klick auf das Kalender-Symbol neben dem Ansichts-Umschalter.',
  'help.guide.calendar-feed.step.2': 'Klick auf „Enable calendar subscription“. TREK erzeugt einen privaten Feed-Link.',
  'help.guide.calendar-feed.step.3':
    'Füge den Feed mit einem der Buttons hinzu (Google, Apple, Outlook) oder kopiere den Link in jede Kalender-App, die URLs abonniert.',
  'help.guide.calendar-feed.result':
    'Jede aktive Reise erscheint in deinem Kalender und aktualisiert sich von selbst. Archivierte Reisen und Reisen, die vor mehr als 90 Tagen endeten, bleiben außen vor.',
  'help.guide.calendar-feed.tip.1':
    'Der Link ist ein Geheimnis. Wer ihn hat, kann den Feed lesen; im selben Dialog kannst du ihn zurückziehen, falls er durchsickert.',

  // widgets
  'help.guide.widgets.title': 'Dashboard-Widgets auswählen',
  'help.guide.widgets.goal': 'Die Statistikreihe und die Widgets rechts ein- oder ausblenden.',
  'help.guide.widgets.step.1': 'Öffne das Avatar-Menü oben rechts und wähle „Einstellungen“.',
  'help.guide.widgets.step.2': 'Wechsle zum Tab „Erscheinungsbild“.',
  'help.guide.widgets.step.3':
    'Unter „Dashboard-Widgets“ jedes Widget ein- oder ausschalten. Desktop und Mobil werden getrennt eingestellt.',
  'help.guide.widgets.step.4': 'Zurück zum Dashboard. Die Änderung gilt sofort.',
  'help.guide.widgets.result':
    'Ausgeblendete Widgets machen Platz für deine Reisen; schaltest du die ganze rechte Spalte ab, wird das Layout zentriert.',
  'help.guide.widgets.link': 'Erscheinungsbild-Einstellungen öffnen',

  // currency-widget
  'help.guide.currency-widget.title': 'Währungen umrechnen',
  'help.guide.currency-widget.goal': 'Einen Betrag mit aktuellen Kursen zwischen zwei Währungen umrechnen.',
  'help.guide.currency-widget.step.1': 'Betrag eintippen und die beiden Währungen wählen.',
  'help.guide.currency-widget.step.2': 'Der Pfeil dazwischen tauscht das Paar, der Kreispfeil holt den Kurs neu.',
  'help.guide.currency-widget.result': 'Dein Währungspaar wird in deinem Konto gemerkt und ist auf jedem Gerät gleich.',
  'help.guide.currency-widget.tip.1':
    'Die Kurse kommen von der Europäischen Zentralbank und werden einmal täglich aktualisiert.',

  // timezones-widget
  'help.guide.timezones-widget.title': 'Weltuhren hinzufügen',
  'help.guide.timezones-widget.goal': 'Die Ortszeit an deinen Reisezielen im Blick behalten.',
  'help.guide.timezones-widget.step.1': 'Klick im Widget „Zeitzonen“ auf + und such nach einer Stadt.',
  'help.guide.timezones-widget.step.2': 'Eine Uhr entfernst du mit dem × daneben.',
  'help.guide.timezones-widget.result': 'Deine Uhren werden mit deinem Konto gespeichert.',

  // ── Screen: vacay ──────────────────────────────────────────────────────────
  'help.ctx.vacay.title': 'Vacay',
  'help.ctx.vacay.summary':
    'Vacay ist dein persönlicher Urlaubsplaner: wie viele Urlaubstage du im Jahr hast, welche du eingetragen hast und was übrig ist. Das Raster zeigt das ganze Jahr auf einen Blick; in der Seitenleiste liegen Jahresauswahl, die Personen, mit denen du planst, geteilte Kalender, die Legende und dein Urlaubsanspruch.',
  'help.ctx.vacay.bullet.1':
    'Jahresraster: zwölf Monatskarten, eine Zelle pro Tag. Klick auf einen Tag, um ihn einzutragen oder zu löschen. Ein kleiner blauer Punkt markiert Tage, die schon eine Reise abdeckt.',
  'help.ctx.vacay.bullet.2':
    'Leiste unten: Modus Urlaub oder Betriebsferien, dazu die Schalter Halbtag und Ausgleich, die ändern, was ein Klick einträgt.',
  'help.ctx.vacay.bullet.3':
    'Urlaubsanspruch: deine Tage für das Jahr, wie viele weg sind und wie viele übrig, inklusive Mitnahme aus der Vorperiode.',
  'help.ctx.vacay.bullet.4':
    'Personen sind Leute, die mit deinem Plan verschmolzen sind, jede in ihrer Farbe. Geteilte Kalender sind Nur-Lese-Ringe der freien Tage anderer.',
  'help.ctx.vacay.bullet.5':
    'Einstellungen regeln Wochenenden, Wochenbeginn, Urlaubsmitnahme, dein Urlaubsjahr, Betriebsferien sowie Feiertags- und Schulferienkalender.',
  // log-day
  'help.guide.log-day.title': 'Einen Urlaubstag eintragen',
  'help.guide.log-day.goal': 'Einen freien Tag im Jahresraster markieren und zusehen, wie der Saldo folgt.',
  'help.guide.log-day.step.1':
    'Schau auf die Leiste unten: Der linke Button in deiner Farbe heißt, ein Klick trägt einen Urlaubstag für dich ein.',
  'help.guide.log-day.step.2':
    'Klick auf einen Tag in einer Monatskarte. Er füllt sich mit deiner Farbe, und „Weg“ zählt einen Tag mehr.',
  'help.guide.log-day.step.3': 'Klick denselben Tag noch einmal, um ihn zu löschen.',
  'help.guide.log-day.result':
    'Der Tag ist eingetragen, Tage, Weg und Rest aktualisieren sich sofort, und alle, die mit deinem Plan verschmolzen sind, sehen es live.',
  'help.guide.log-day.tip.1':
    'Wochenenden lassen sich nicht eintragen, solange in den Einstellungen „Wochenenden sperren“ an ist.',
  'help.guide.log-day.tip.2':
    'Ein blauer Punkt in einer Zelle heißt, eine deiner Reisen deckt diesen Tag ab. So siehst du, wo Urlaub und Reise zusammenpassen.',
  // half-day
  'help.guide.half-day.title': 'Einen halben Tag eintragen',
  'help.guide.half-day.goal': 'Einen Nachmittag freinehmen, ohne einen ganzen Urlaubstag zu verbrauchen.',
  'help.guide.half-day.step.1':
    'Schalte in der Leiste „Halbtag“ ein. Der orange Punkt ist die Markierung, die ein halber Tag im Raster bekommt.',
  'help.guide.half-day.step.2':
    'Klick auf einen Tag. Er wird als 0,5 eingetragen und trägt den orangen Punkt in der Ecke.',
  'help.guide.half-day.step.3':
    'Schalte „Halbtag“ danach wieder aus; ein Klick auf einen halben Tag mit anderen Einstellungen wandelt ihn an Ort und Stelle um.',
  'help.guide.half-day.result':
    '„Weg“ wächst um 0,5. Halbtag und Ausgleich sind unabhängig, also geht auch ein halber Ausgleichstag.',
  'help.guide.half-day.tip.1':
    'Die Leiste zeigt immer die Markierung, die dein nächster Klick setzt. So kannst du vor dem Eintragen prüfen.',
  // comp-day
  'help.guide.comp-day.title': 'Ausgleich oder Gleitzeit eintragen',
  'help.guide.comp-day.goal': 'Freizeitausgleich nehmen, der keine Urlaubstage kostet.',
  'help.guide.comp-day.step.1':
    'Schalte in der Leiste „Ausgleich“ ein. Die schraffierte Scheibe ist das Aussehen eines Ausgleichstags im Raster.',
  'help.guide.comp-day.step.2':
    'Klick auf einen Tag. Er füllt sich mit einer diagonalen Schraffur in deiner Farbe statt mit einer vollen Fläche.',
  'help.guide.comp-day.result': 'Ausgleichstage werden neben den Anspruchskacheln gezählt und verringern „Rest“ nie.',
  'help.guide.comp-day.tip.1':
    'Abgefeierte Überstunden, Gleitzeit, ein freier Tag als Ausgleich: alles, was frei ist, aber kein Urlaub, gehört hierher.',
  // entitlement
  'help.guide.entitlement.title': 'Deinen Urlaubsanspruch setzen',
  'help.guide.entitlement.goal': 'Vacay sagen, wie viele Urlaubstage du im Jahr hast.',
  'help.guide.entitlement.step.1': 'Klick in der Seitenleiste auf die Kachel „Tage“ unter Urlaubsanspruch.',
  'help.guide.entitlement.step.2': 'Tipp deine Anzahl Tage ein und drück Enter.',
  'help.guide.entitlement.result':
    '„Rest“ wird neu berechnet aus deinem Anspruch, einer eventuellen Mitnahme und den verbrauchten Tagen.',
  'help.guide.entitlement.tip.1':
    'Jedes Jahr hat seinen eigenen Anspruch, eine Änderung hier betrifft nur das gewählte Jahr.',
  // years
  'help.guide.years.title': 'Jahre hinzufügen und wechseln',
  'help.guide.years.goal': 'Schon das nächste Jahr planen oder auf das letzte zurückschauen.',
  'help.guide.years.step.1':
    'Klick auf das + rechts neben der Jahreszahl für das nächste Jahr oder auf das + links für das vorherige.',
  'help.guide.years.step.2': 'Wechsle zwischen den Jahren mit den Pfeilen oder den Jahres-Chips darunter.',
  'help.guide.years.step.3':
    'Zum Entfernen eines Jahres fahr über seinen Chip und klick auf das kleine Minus. Seine Einträge gehen mit, also bestätige mit Bedacht.',
  'help.guide.years.result':
    'Jedes Jahr behält seinen eigenen Anspruch und seine Einträge; die Urlaubsmitnahme verbindet sie.',
  // company-holidays
  'help.guide.company-holidays.title': 'Betriebsferien markieren',
  'help.guide.company-holidays.goal':
    'Tage sperren, an denen die ganze Firma frei hat, ohne jemandes Anspruch anzutasten.',
  'help.guide.company-holidays.step.1':
    'Öffne die Einstellungen und prüf, dass „Betriebsferien“ an ist. Das ist die Voreinstellung; die Leiste bietet den Modus nur an, solange es an ist.',
  'help.guide.company-holidays.step.2': 'Zurück im Raster stellst du die Leiste auf den Modus „Betriebsferien“.',
  'help.guide.company-holidays.step.3':
    'Klick auf die Tage. Sie werden bernsteinfarben und tauchen in der Legende auf.',
  'help.guide.company-holidays.result':
    'Betriebsferien sehen alle, die mit dem Plan verschmolzen sind, und sie verringern „Rest“ nie.',
  'help.guide.company-holidays.tip.1':
    'Jede verschmolzene Person kann Betriebsferien bearbeiten, also einigt euch, wer sie pflegt.',
  // public-holidays
  'help.guide.public-holidays.title': 'Feiertage anzeigen',
  'help.guide.public-holidays.goal': 'Die Feiertage deines Landes oder deiner Region ins Raster holen.',
  'help.guide.public-holidays.step.1': 'Öffne die Einstellungen und schalte „Feiertage“ ein.',
  'help.guide.public-holidays.step.2':
    'Klick auf „Kalender hinzufügen“, wähl das Land und, wo es darauf ankommt, die Region. Farbe und Beschriftung nach Belieben.',
  'help.guide.public-holidays.step.3':
    'Schließ die Einstellungen. Die Feiertage erscheinen im Raster und in der Legende.',
  'help.guide.public-holidays.result':
    'Feiertage werden in der Farbe des Kalenders markiert und zählen nie gegen deinen Anspruch.',
  'help.guide.public-holidays.tip.1':
    'Du kannst mehrere Kalender anlegen, etwa deine eigene Region und die einer verschmolzenen Kollegin.',
  // school-holidays
  'help.guide.school-holidays.title': 'Schulferien anzeigen',
  'help.guide.school-holidays.goal': 'Die Schulferien deiner Region neben deinen eigenen freien Tagen sehen.',
  'help.guide.school-holidays.step.1': 'Öffne die Einstellungen und schalte „Schulferien“ ein.',
  'help.guide.school-holidays.step.2':
    'Klick auf „Kalender hinzufügen“ und wähl das Land. Wo ein Land seinen Kalender aufteilt, wähl auch die Region oder Gruppe.',
  'help.guide.school-holidays.step.3':
    'Schließ die Einstellungen. Jede Ferienzeit bekommt ein farbiges Band am unteren Rand ihrer Tage.',
  'help.guide.school-holidays.result': 'Schulferien sind rein visuell: Sie verringern niemandes Anspruch.',
  'help.guide.school-holidays.tip.1':
    'Region fehlt? Dein Administrator kann Schulferien von Hand pflegen unter Admin, Personalisierung, Schulferien.',
  // weekends
  'help.guide.weekends.title': 'Wochenenden sperren und Wochenbeginn setzen',
  'help.guide.weekends.goal':
    'Wochenenden aus der Zählung halten und die Woche an dem Tag beginnen, den du gewohnt bist.',
  'help.guide.weekends.step.1': 'Öffne die Einstellungen.',
  'help.guide.weekends.step.2': 'Schalte „Wochenenden sperren“ ein und wähl, welche Tage als dein Wochenende gelten.',
  'help.guide.weekends.step.3': 'Unter „Woche beginnt am“ wählst du Montag oder Sonntag.',
  'help.guide.weekends.result':
    'Gesperrte Tage sind im Raster ausgegraut und lassen sich nicht aus Versehen eintragen.',
  // leave-year
  'help.guide.leave-year.title': 'Dein Urlaubsjahr festlegen',
  'help.guide.leave-year.goal':
    'Den Anspruch über ein Geschäftsjahr oder ab Eintrittsdatum zählen statt von Januar bis Dezember.',
  'help.guide.leave-year.step.1': 'Öffne die Einstellungen und such „Urlaubsjahr“.',
  'help.guide.leave-year.step.2':
    'Wähl Kalenderjahr, Geschäftsjahr (mit Monat und Tag des Beginns) oder Eintrittsdatum (mit dem Datum, an dem du angefangen hast).',
  'help.guide.leave-year.result':
    'Anspruch, verbrauchte Tage und Mitnahme folgen dieser Periode, und das Raster beginnt mit ihrem ersten Monat.',
  'help.guide.leave-year.tip.1':
    'Diese Einstellung ist persönlich: In einem verschmolzenen Plan behält jeder sein eigenes Urlaubsjahr und seine Zahlen.',
  // carry-over
  'help.guide.carry-over.title': 'Resturlaub mitnehmen',
  'help.guide.carry-over.goal': 'Was am Ende einer Periode übrig ist, der nächsten gutschreiben.',
  'help.guide.carry-over.step.1': 'Öffne die Einstellungen.',
  'help.guide.carry-over.step.2': 'Schalte „Urlaubsmitnahme“ ein.',
  'help.guide.carry-over.result':
    'Der mitgenommene Betrag wird über alle deine Jahre neu berechnet und unter dem Anspruch angezeigt.',
  'help.guide.carry-over.tip.1': 'Ausschalten setzt jeden Mitnahme-Saldo auf null zurück.',
  // invite
  'help.guide.invite.title': 'Gemeinsam mit jemandem planen',
  'help.guide.invite.goal':
    'Deinen Plan mit einem anderen TREK-Nutzer verschmelzen, damit ihr eure freien Tage in einem Raster seht.',
  'help.guide.invite.step.1': 'Klick auf das Personen-Symbol im Panel „Personen“.',
  'help.guide.invite.step.2': 'Wähl den Nutzer und schick die Einladung.',
  'help.guide.invite.step.3':
    'Die Person bekommt eine Benachrichtigung und nimmt an. Bis dahin steht die Einladung als ausstehend da.',
  'help.guide.invite.result':
    'Beide Pläne verschmelzen: Jede Person hat eine Farbe, ihr könnt füreinander Tage eintragen, und alles synchronisiert sich live.',
  'help.guide.invite.tip.1':
    'Zum Rückgängigmachen nutzt du „Auflösen“ unter „Fusion auflösen“ in den Einstellungen. Die Einträge jeder Person kehren in ihren eigenen Plan zurück.',
  'help.guide.invite.tip.2':
    'Soll die andere Person deine Tage nur sehen, teil deinen Kalender, statt zu verschmelzen.',
  // share-calendar
  'help.guide.share-calendar.title': 'Deinen Kalender nur zum Lesen teilen',
  'help.guide.share-calendar.goal': 'Jemanden sehen lassen, wann du frei hast, ohne Mitsprache an deinem Plan.',
  'help.guide.share-calendar.step.1': 'Klick auf das Teilen-Symbol im Panel „Geteilte Kalender“.',
  'help.guide.share-calendar.step.2': 'Wähl den Nutzer und klick auf „Teilen“. Eine Annahme ist nicht nötig.',
  'help.guide.share-calendar.step.3':
    'Mit dir geteilte Kalender erscheinen im selben Panel; das Auge blendet einen aus, „Nicht mehr teilen“ zieht deinen zurück.',
  'help.guide.share-calendar.result':
    'Deine freien Tage erscheinen als farbiger Ring in ihrem Raster. Nichts, was du teilst, kann von dort bearbeitet werden.',
  'help.guide.share-calendar.tip.1':
    'Teilen und Fusion sind unabhängig: Du kannst mit einer Person verschmolzen sein und mit anderen teilen.',
  'help.guide.share-calendar.tip.2': 'Fahr über einen umringten Tag, um zu sehen, wer frei hat und wie lange.',

  // ── Screen: atlas ─────────────────────────────────────────────────────────────────────
  'help.ctx.atlas.title': 'Atlas',
  'help.ctx.atlas.summary':
    'Der Atlas ist dein Reise-Fußabdruck auf einer Weltkarte: Jedes Land, in das dich eine Reise geführt hat, ist eingefärbt, und die Länder von vor TREK trägst du von Hand nach. Zoom hinein für Regionen, führe eine Wunschliste mit Orten, die du noch sehen willst, und lies deine Zahlen im Glas-Panel unten ab.',
  'help.ctx.atlas.bullet.1':
    'Die Karte: Besuchte Länder tragen eine Farbe, die ihnen bleibt, geplante Länder haben eine gestrichelte Kontur, Länder der Wunschliste eine Schraffur, alles andere ist grau. Fahr über ein Land für seine Reisen, Orte sowie ersten und letzten Besuch.',
  'help.ctx.atlas.bullet.2':
    'Suche oben: Tipp ein Land oder einen Ort ein. Ein Land fliegt die Karte an und öffnet sein Popup; ein Ort landet in seiner Region, damit du die markieren kannst.',
  'help.ctx.atlas.bullet.3':
    'Geplante Länder anzeigen, oben rechts: blendet die Länder deiner kommenden Reisen ein. Der Schalter erscheint nur, solange du welche hast.',
  'help.ctx.atlas.bullet.4':
    'Panel unten: der Tab Statistik mit Ländern, Reisen, Orten, Städten, Tagen, Kontinenten und deiner Serie; der Tab Wunschliste mit allem, was noch vor dir liegt.',
  'help.ctx.atlas.bullet.5':
    'Regionen: Ab Zoomstufe 5 wechselt die Karte zu Bundesländern und Provinzen, jede einzeln anklickbar zum Markieren oder Entfernen.',
  'help.ctx.atlas.bullet.6':
    'Dawarich: Mit verbundenem Addon hakt ein Panel links neben der Statistik Wünsche ab und ergänzt Länder aus deinen Aufzeichnungen, nie ohne deine Bestätigung.',
  // mark-country
  'help.guide.mark-country.title': 'Ein Land als besucht markieren',
  'help.guide.mark-country.goal': 'Trag ein Land nach, in dem du vor TREK warst, damit Karte und Zähler es mitnehmen.',
  'help.guide.mark-country.step.1': 'Tipp das Land in das Suchfeld oben auf der Karte.',
  'help.guide.mark-country.step.2':
    'Wähl es aus der Liste. Die Karte fliegt hin und ein Popup für das Land öffnet sich.',
  'help.guide.mark-country.step.3': 'Wähl Als besucht markieren.',
  'help.guide.mark-country.result':
    'Das Land bekommt seine Farbe auf der Karte und Länder zählt eins mehr. Die Farbe ist dauerhaft: Weitere Länder zu markieren mischt die übrigen nie neu.',
  'help.guide.mark-country.tip.1':
    'Ein Klick auf ein graues Land auf der Karte öffnet dasselbe Popup; die Suche ist der sichere Weg bei kleinen Ländern.',
  'help.guide.mark-country.tip.2':
    'Ein von Hand markiertes Land zählt immer als besucht, egal welche Daten eine Reise dorthin hat.',
  // unmark-country
  'help.guide.unmark-country.title': 'Ein markiertes Land entfernen',
  'help.guide.unmark-country.goal': 'Nimm ein von Hand markiertes Land wieder von der Karte.',
  'help.guide.unmark-country.step.1':
    'Such das Land und wähl es, oder klick es auf der Karte an. Bei einem selbst markierten Land fragt das Popup, ob es entfernt werden soll.',
  'help.guide.unmark-country.step.2': 'Bestätige mit Entfernen.',
  'help.guide.unmark-country.result': 'Das Land wird wieder grau und verlässt deinen Zähler.',
  'help.guide.unmark-country.tip.1':
    'Nur von Hand markierte Länder lassen sich so entfernen. Ein Land mit Reisen oder Orten bleibt, solange die es tun; Entfernen steht auch in seiner Detailkarte im Panel, wenn es von Hand markiert wurde.',
  // country-details
  'help.guide.country-details.title': 'Sehen, was du in einem Land gemacht hast',
  'help.guide.country-details.goal':
    'Öffne ein besuchtes Land und spring zu den Reisen, die dich dorthin gebracht haben.',
  'help.guide.country-details.step.1': 'Such ein Land, das du besucht hast.',
  'help.guide.country-details.step.2':
    'Wähl es. Die Karte fliegt hin und das Panel unten bekommt eine Karte mit Flagge, Orten, Reisen und einem Chip pro Reise.',
  'help.guide.country-details.result': 'Klick auf einen Reise-Chip, um die Reise im Planer zu öffnen.',
  'help.guide.country-details.tip.1':
    'Fährst du auf der Karte über das Land, siehst du dieselben Zahlen plus ersten und letzten Besuch.',
  // planned-countries
  'help.guide.planned-countries.title': 'Die Länder zeigen, in die du fährst',
  'help.guide.planned-countries.goal':
    'Hol die Länder deiner kommenden Reisen auf die Karte, ohne sie als besucht zu zählen.',
  'help.guide.planned-countries.step.1':
    'Schalte Geplante Länder anzeigen oben rechts ein. Die Zahl daneben sagt, wie viele warten.',
  'help.guide.planned-countries.step.2':
    'Such ein geplantes Land und wähl es: Das Panel sagt Geplant, und der Tooltip auf der Karte zeigt, wann es losgeht.',
  'help.guide.planned-countries.result':
    'Geplante Länder erscheinen mit gestrichelter Kontur, damit sie nie aussehen wie ein Ort, an dem du schon warst. Der Schalter merkt sich deine Wahl.',
  'help.guide.planned-countries.tip.1':
    'Ein Land zählt als besucht, sobald die Reise dorthin begonnen hat; eine laufende Reise zählt auch. Reisen ohne Datum bleiben ganz aus der Statistik.',
  'help.guide.planned-countries.tip.2': 'Der Schalter existiert nur, solange du kommende Reisen hast.',
  // regions
  'help.guide.regions.title': 'Eine Region markieren',
  'help.guide.regions.goal':
    'Feiner als Länder: Markiere die Bundesländer, Provinzen oder Präfekturen, in denen du warst.',
  'help.guide.regions.step.1':
    'Zoom in ein Land, bis seine Regionen erscheinen, ab Zoomstufe 5. Das Land zu suchen und zu wählen fliegt dich nah genug heran.',
  'help.guide.regions.step.2': 'Klick eine Region an. Beim Überfahren steht ihr Name; das Popup zeigt Region und Land.',
  'help.guide.regions.step.3': 'Wähl Als besucht markieren.',
  'help.guide.regions.result':
    'Die Region füllt sich mit der Farbe des Landes. Eine Region zu markieren zählt auch das Land als besucht, falls es das noch nicht war.',
  'help.guide.regions.tip.1':
    'Ein Klick auf eine besuchte Region bietet Entfernen an, ob du sie markiert hast oder ein Ort sie dorthin gesetzt hat.',
  'help.guide.regions.tip.2': 'Regionen mit echten Orten werden für dich markiert; da gibt es nichts zu tun.',
  // search-place
  'help.guide.search-place.title': 'Einen Ort finden und seine Region markieren',
  'help.guide.search-place.goal':
    'Markiere Bayern, indem du nach München suchst, ohne zu wissen, in welcher Region eine Stadt liegt.',
  'help.guide.search-place.step.1':
    'Tipp eine Stadt, eine Sehenswürdigkeit oder eine Adresse in das Suchfeld. Länder kommen zuerst; die passenden Orte stehen darunter unter Orte.',
  'help.guide.search-place.step.2':
    'Wähl den Ort. Die Karte fliegt hin und ermittelt, in welcher Region der Punkt liegt.',
  'help.guide.search-place.step.3':
    'Wähl Als besucht markieren für diese Region, oder Zur Bucket List, wenn sie noch vor dir liegt.',
  'help.guide.search-place.result':
    'Die Region ist markiert, und mit ihr das Land. Länder ohne Regionsdaten im Kartenpaket fallen auf das Land selbst zurück.',
  'help.guide.search-place.tip.1':
    'Orte kommen aus derselben Suche wie überall in TREK, folgen also dem Anbieter, den dein Admin eingerichtet hat.',
  // bucket-country
  'help.guide.bucket-country.title': 'Ein Land auf die Wunschliste setzen',
  'help.guide.bucket-country.goal':
    'Führe eine Wunschliste von Ländern direkt auf der Karte, getrennt von denen, in denen du warst.',
  'help.guide.bucket-country.step.1': 'Such das Land und wähl es, oder klick es auf der Karte an.',
  'help.guide.bucket-country.step.2': 'Wähl Zur Bucket List.',
  'help.guide.bucket-country.step.3':
    'Wähl Monat und Jahr, wenn du schon weißt, wann, und bestätige mit Zur Bucket List.',
  'help.guide.bucket-country.result':
    'Das Land wird schraffiert gezeichnet, in der Farbe, die es tragen wird, sobald du dort warst, und erscheint im Tab Wunschliste des Panels.',
  'help.guide.bucket-country.tip.1':
    'Dasselbe Popup bietet Von der Wunschliste entfernen, sobald das Land auf der Liste steht.',
  'help.guide.bucket-country.tip.2':
    'Ein Eintrag pro Zieldatum: Dasselbe Land kann für zwei verschiedene Monate auf der Liste stehen, aber nicht zweimal für denselben.',
  // bucket-place
  'help.guide.bucket-place.title': 'Einen Ort zur Wunschliste hinzufügen',
  'help.guide.bucket-place.goal':
    'Speichere eine Stadt, eine Sehenswürdigkeit oder eine Adresse, von der du träumst, mit Koordinaten und Zieldatum.',
  'help.guide.bucket-place.step.1': 'Öffne den Tab Wunschliste im Panel unten.',
  'help.guide.bucket-place.step.2': 'Klick auf Ort hinzufügen.',
  'help.guide.bucket-place.step.3':
    'Tipp den Namen ein und drück den Suchknopf; wähl den Treffer, damit der Ort Koordinaten bekommt. Nur einen Namen zu tippen und die Suche zu überspringen geht auch.',
  'help.guide.bucket-place.step.4': 'Wähl nach Belieben Monat und Jahr und klick auf Hinzufügen.',
  'help.guide.bucket-place.result':
    'Der Ort steht oben auf deiner Wunschliste mit seinem Zieldatum; das × daneben entfernt ihn wieder.',
  'help.guide.bucket-place.tip.1':
    'Ein Wunsch mit Koordinaten ist das, was Dawarich später für dich abhaken kann, sobald deine Aufzeichnungen zeigen, dass du dort warst.',
  // stats
  'help.guide.stats.title': 'Deine Statistik lesen',
  'help.guide.stats.goal': 'Wissen, was die Zahlen im Panel zählen, und was nicht.',
  'help.guide.stats.step.1':
    'Länder ist die Zahl verschiedener Länder, in denen du wirklich warst; geplante stehen daneben, nicht darin. Reisen, Orte und Tage sind Summen über alle deine Reisen. Städte wird aus den Adressen deiner Orte abgeleitet, ist also eine Schätzung.',
  'help.guide.stats.step.2':
    'Die Kontinente zeigen besuchte Länder pro Kontinent; Antarktis kommt in die Reihe, sobald du dort warst. Dann deine Serie, aufeinanderfolgende Jahre mit mindestens einer Reise, und wie viele Reisen du dieses Jahr gemacht hast.',
  'help.guide.stats.result':
    'Die Zahlen folgen deinen Reisen, während du sie planst; hier muss nichts gepflegt werden.',
  'help.guide.stats.tip.1':
    'Städte werden aus dem Adresstext gelesen, nicht nachgeschlagen, also kann eine kurze Adresse wie „Osteria Francescana, Italy“ oder eine, die auf einer Präfektur endet, eine Region statt einer Stadt ergeben.',
  'help.guide.stats.tip.2':
    'Von Hand markierte Länder zählen bei Länder und den Kontinenten, bringen aber keine Reisen, Orte oder Tage mit.',
  // dawarich-countries
  'help.guide.dawarich-countries.title': 'Länder aus deinen Aufzeichnungen hinzufügen',
  'help.guide.dawarich-countries.goal':
    'Lass Dawarich sagen, in welchen Ländern du im letzten Jahr warst, und bring die, die du bestätigst, auf die Karte.',
  'help.guide.dawarich-countries.step.1':
    'Mit verbundenem Dawarich-Addon sitzt unten auf der Karte, links neben der Statistik, ein Dawarich-Panel mit zwei Kacheln. Klick auf Länder.',
  'help.guide.dawarich-countries.step.2':
    'Der Dialog öffnet sich auf seinem Tab Länder. Klick auf Nach Ländern suchen: TREK liest die Länder und Städte, die deine Aufzeichnungen in den letzten 12 Monaten abdecken, Monat für Monat, also gib ihm einen Moment. Jedes Land, das dein Atlas noch nicht hat, steht mit seiner Flagge, der Zahl der Städte und der ersten davon mit Namen in der Liste und ist von Anfang an angehakt; klick eine Zeile an, um sie auszulassen.',
  'help.guide.dawarich-countries.step.3':
    'Bestätige mit dem Knopf unten rechts, der 5 Länder hinzufügen heißt, wenn fünf Zeilen angehakt sind. Der Dialog sagt, wie viele hinzugekommen sind; schließ ihn, und die Karte hat sich neu eingelesen.',
  'help.guide.dawarich-countries.result':
    'Die bestätigten Länder tragen auf der Karte eine Farbe und zählen unter Länder, vermerkt als aus Dawarich stammend. Was du von Hand markiert hast, bleibt unangetastet.',
  'help.guide.dawarich-countries.tip.1':
    'Länder, die der Atlas schon als besucht zeigt, von Hand, aus einer Reise oder aus einer früheren Prüfung, werden ausgelassen, damit deine eigenen Markierungen nie umetikettiert werden. Ein Land, das du früher aus dem Atlas entfernt hast, kommt zurück, wenn du es hier bestätigst.',
  'help.guide.dawarich-countries.tip.2':
    'Ein Ländername, den TREK nicht zuordnen kann, wird unter den Zeilen aufgeführt statt verworfen, und Erneut prüfen fragt Dawarich noch einmal. Die Notiz unter der Liste sagt: Angesehen wurden die letzten 12 Monate. Dieses Fenster ist fest.',
  // dawarich-wishes
  'help.guide.dawarich-wishes.title': 'Wünsche aus deinen Aufzeichnungen abhaken',
  'help.guide.dawarich-wishes.goal':
    'Finde heraus, welche Orte auf deiner Wunschliste du tatsächlich erreicht hast, und hak sie an dem Tag ab, an dem es passiert ist.',
  'help.guide.dawarich-wishes.step.1':
    'Klick im Dawarich-Panel unten auf der Karte, links neben der Statistik, auf Wunschliste.',
  'help.guide.dawarich-wishes.step.2':
    'Der Dialog öffnet sich auf seinem Tab Wunschliste. Klick auf Wunschliste prüfen: TREK durchsucht deine Aufzeichnungen nach jedem Eintrag, der Koordinaten hat. Ein Wunsch, den du erreicht hast, steht mit der Nähe, der Dauer und dem Tag in der Liste und ist von Anfang an angehakt; einer, den du schon abgehakt hast, sagt Bereits abgehakt. Unter der Liste zählt eine Notiz die Einträge ohne Koordinaten, und die Regel steht auch dort: Ein Wunsch gilt ab 250 m Nähe und 20 Minuten vor Ort als erreicht.',
  'help.guide.dawarich-wishes.step.3':
    'Bestätige mit dem Knopf unten rechts, der 2 abhaken heißt, wenn zwei Zeilen angehakt sind. Dann schließ den Dialog und öffne den Tab Wunschliste im Panel daneben.',
  'help.guide.dawarich-wishes.result':
    'Jeder Wunsch trägt ein grünes Häkchen mit dem Datum des Aufenthalts, nicht dem von heute; sein Tooltip sagt Anhand deiner Dawarich-Aufzeichnungen abgehakt, und ein Klick auf das Datum macht es rückgängig.',
  'help.guide.dawarich-wishes.tip.1':
    'Vorbeifahren zählt nicht: Die Regel braucht Nähe und Zeit zugleich, und von mehreren Aufenthalten, die passen, gewinnt der längste. Ein Wunsch ohne Koordinaten lässt sich nicht prüfen, also leg Orte über die Suche in Ort hinzufügen an statt nur mit dem Namen.',
  'help.guide.dawarich-wishes.tip.2':
    'Eine Prüfung sieht sich bis zu 50 Einträge an, die noch nicht abgehakten zuerst, und sagt es, wenn es mehr waren. Ein Wunsch, der schon abgehakt war, behält sein eigenes Datum.',

  // ── Screen: collections ───────────────────────────────────────────────────────────────
  'help.ctx.collections.title': 'Sammlungen',
  'help.ctx.collections.summary':
    'Collections ist deine Ortebibliothek außerhalb jeder Reise: benannte Listen mit Orten, die du gefunden hast und behalten willst, jeder Ort mit dem Status Idee, Will hin oder Besucht. Orte werden in Reisen hinein- und wieder herauskopiert, nie verknüpft, sodass eine Liste und eine Reise einander nie verändern.',
  'help.ctx.collections.bullet.1':
    'Listenleiste links: deine eigenen Listen, die mit dir geteilten, Einladungen, die auf ein Ja warten, Alle gespeicherten als Summe von allem, was dir gehört, sowie Neue Liste und der Dateiimport ganz oben.',
  'help.ctx.collections.bullet.2':
    'Kopfbereich der offenen Liste: ihre Farbe, ihr Cover, Beschreibung und Links, die Mitglieder sowie rechts die Aktionen Bearbeiten, Exportieren und Teilen.',
  'help.ctx.collections.bullet.3':
    'Filterzeile über den Orten: Status, Kategorie, Bewertung und Sortierung, der Label-Filter, das + zum Hinzufügen eines Orts, die Übernahme aus einer Reise und Wählen für Massenaktionen.',
  'help.ctx.collections.bullet.4':
    'Ortszeilen: Avatar, Name und Adresse, Labels und Kategorie sowie rechts die Status-Pille, die mit einem Klick weiterschaltet.',
  'help.ctx.collections.bullet.5':
    'Karte rechts: ein Pin je Ort mit Koordinaten, der Umschalter zwischen Liste und Karte, das Suchfeld und der Label-Filter. Ein Klick auf einen Pin öffnet diesen Ort.',
  'help.ctx.collections.bullet.6':
    'Detailblatt: Klick auf eine Zeile für Cover, Kategorie, Labels, Status, Beschreibung und Links, mit Bearbeiten, In Reise kopieren und Aus Liste entfernen.',
  // create-list
  'help.guide.create-list.title': 'Eine Liste anlegen',
  'help.guide.create-list.goal': 'Leg eine neue benannte Liste an, mit Farbe und Cover, bereit für Orte.',
  'help.guide.create-list.step.1': 'Klick auf Neue Liste oben in der Listenleiste.',
  'help.guide.create-list.step.2':
    'Gib der Liste einen Namen und wähl eine Farbe. Coverbild, Beschreibung und Links sind optional; du kannst sie später über Bearbeiten ergänzen.',
  'help.guide.create-list.step.3': 'Klick auf Erstellen.',
  'help.guide.create-list.result':
    'Die Liste öffnet sich leer, mit Ort hinzufügen und Aus einer Reise übernehmen als den zwei Wegen, sie zu füllen.',
  'help.guide.create-list.tip.1':
    'Das Cover kann ein eigener Upload sein oder ein Bild aus der Unsplash-Suche im selben Dialog.',
  // add-place
  'help.guide.add-place.title': 'Einen Ort hinzufügen',
  'help.guide.add-place.goal':
    'Find einen Ort und speichere ihn in einem Zug mit Name, Kategorie, Status und Notizen in der offenen Liste.',
  'help.guide.add-place.step.1': 'Klick auf das + in der Filterzeile über den Orten.',
  'help.guide.add-place.step.2':
    'Tipp den Ort in das Suchfeld und wähl ein Ergebnis. Name, Adresse und Koordinaten füllen sich daraus.',
  'help.guide.add-place.step.3':
    'Setz den Status und, wenn du magst, Kategorie, Beschreibung und Links, dann klick auf Hinzufügen. Der Dialog bleibt für den nächsten Ort offen; Abbrechen schließt ihn.',
  'help.guide.add-place.result': 'Der Ort erscheint in der Liste und, wenn er Koordinaten hat, als Pin auf der Karte.',
  'help.guide.add-place.tip.1':
    'Aus einer Reise heraus legt In Sammlung speichern im Ort-Inspektor oder im Ortsmenü einen Reiseort auf eine Liste, ohne die Reise zu verlassen.',
  'help.guide.add-place.tip.2':
    'Die Liste muss dir gehören oder eine sein, in der du Bearbeiter oder Admin bist; auf Alle gespeicherten oder einer Liste, die du nur ansiehst, gibt es das + nicht.',
  // import-from-trip
  'help.guide.import-from-trip.title': 'Orte aus einer Reise übernehmen',
  'help.guide.import-from-trip.goal':
    'Hol die Orte einer ganzen Reise auf einmal auf eine Liste, statt sie einzeln zu speichern.',
  'help.guide.import-from-trip.step.1':
    'Klick auf den Übernehmen-Button mit dem Wolkenpfeil in der Filterzeile. Auf einer leeren Liste sitzt dieselbe Aktion neben Ort hinzufügen.',
  'help.guide.import-from-trip.step.2': 'Wähl eine deiner Reisen.',
  'help.guide.import-from-trip.step.3':
    'Hak die Orte ab, die du willst. Orte, die schon auf der Liste sind, sind ausgegraut; die, die in keinem Tag der Reise stecken, sind vorab ausgewählt. Nur neue blendet aus, was du schon hast.',
  'help.guide.import-from-trip.step.4': 'Klick auf Übernehmen. Der Button sagt immer, wie viele gleich hinzukommen.',
  'help.guide.import-from-trip.result':
    'Die Orte werden mit Name, Adresse, Koordinaten, Beschreibung und Kategorie auf die Liste kopiert. Die Reise bleibt, wie sie war.',
  'help.guide.import-from-trip.tip.1':
    'Dubletten nach Name oder Koordinaten werden automatisch übersprungen, zweimal übernehmen schadet also nicht.',
  'help.guide.import-from-trip.tip.2':
    'In der Ortsliste einer Reise bietet der Auswahlmodus stattdessen In Sammlung speichern für eine handverlesene Menge von Orten.',
  // place-status
  'help.guide.place-status.title': 'Den Status eines Orts setzen',
  'help.guide.place-status.goal':
    'Behalt im Blick, was eine Idee ist, was auf der Shortlist steht und wo du schon warst.',
  'help.guide.place-status.step.1':
    'Klick auf die Status-Pille am rechten Ende einer Ortszeile. Aus Idee wird Will hin.',
  'help.guide.place-status.step.2':
    'Klick noch einmal für Besucht und ein weiteres Mal, um wieder bei Idee anzufangen.',
  'help.guide.place-status.result': 'Pille und Farbe wechseln sofort; der Statusfilter über der Liste zählt mit.',
  'help.guide.place-status.tip.1':
    'Der Status gehört zu Collections: Einen Ort in eine Reise zu kopieren nimmt ihn nicht mit.',
  'help.guide.place-status.tip.2':
    'Aus einer Reise zeigt In Sammlung speichern eine Status-Pille je Liste, auf der der Ort liegt, und das Orte-Panel hat für eine Auswahl die Aktion Als besucht markieren.',
  // place-detail
  'help.guide.place-detail.title': 'Einen gespeicherten Ort öffnen',
  'help.guide.place-detail.goal': 'Sieh alles zu einem Ort und handle: bearbeiten, in eine Reise kopieren, entfernen.',
  'help.guide.place-detail.step.1':
    'Klick auf eine Ortszeile. Das Detailblatt öffnet sich neben der Liste und die Karte schwenkt zum Ort.',
  'help.guide.place-detail.step.2':
    'Unten sitzen Bearbeiten, In Reise kopieren und Aus Liste entfernen; die Kamera auf dem Cover tauscht das automatische Foto gegen ein eigenes.',
  'help.guide.place-detail.result':
    'Bearbeiten schaltet Name, Kategorie, Labels, Adresse, Koordinaten, Beschreibung und Links direkt im Blatt frei.',
  'help.guide.place-detail.tip.1':
    'Das Cover wird automatisch geholt, wenn der Ort kein eigenes Bild hat. Dein eigener Upload darf JPG, PNG, GIF oder WebP bis 20 MB sein.',
  'help.guide.place-detail.tip.2':
    'Mitglieder einer geteilten Liste können hier auch eine Sternebewertung hinterlassen, und der Bewertungsfilter in der Filterzeile nutzt den Durchschnitt.',
  // labels
  'help.guide.labels.title': 'Orte mit Labels gruppieren',
  'help.guide.labels.goal':
    'Gib einer Liste eigene Labels, etwa Stadtviertel oder Tage, jenseits der gemeinsamen Kategorien.',
  'help.guide.labels.step.1': 'Öffne die Labelverwaltung über das Label-Element in der Filterzeile.',
  'help.guide.labels.step.2':
    'Tipp einen Namen ein, wähl eine Farbe und klick auf Label hinzufügen. Umbenennen, umfärben oder löschen kannst du bestehende Labels im selben Dialog.',
  'help.guide.labels.step.3':
    'Schalte Wählen ein, hak die Orte ab und klick in der Auswahlleiste auf Label zuweisen. Ein einzelner Ort nimmt Labels auch über Bearbeiten auf seinem Detailblatt an.',
  'help.guide.labels.step.4':
    'Wähl ein oder mehrere Labels in der Filterzeile, um Liste und Karte auf Orte einzugrenzen, die eines davon tragen.',
  'help.guide.labels.result':
    'Gelabelte Orte zeigen ihre Labels in der Zeile; der Label-Filter steht jedem Mitglied offen, auch Betrachtern.',
  'help.guide.labels.tip.1':
    'Labels gehören zu der einen Liste, in der sie angelegt wurden. Einen Ort in eine andere Liste zu verschieben streift sie ab.',
  'help.guide.labels.tip.2': 'Labels verwalten und zuweisen braucht Bearbeitungsrechte auf der Liste.',
  // filter-select
  'help.guide.filter-select.title': 'Orte filtern und auswählen',
  'help.guide.filter-select.goal': 'Grenz die Liste ein und bearbeite viele Orte auf einmal.',
  'help.guide.filter-select.step.1':
    'Nutz die Dropdowns in der Filterzeile: Status, Kategorie, Mindestbewertung und Sortierung. Jedes zeigt, wie viele Orte es übrig ließe.',
  'help.guide.filter-select.step.2':
    'Klick auf Wählen. Jede Zeile bekommt ein Kästchen und eine Auswahlleiste erscheint.',
  'help.guide.filter-select.step.3':
    'Hak Orte ab oder nimm Alle auswählen für alles, was gerade gefiltert ist, dann wähl Label zuweisen, In Liste verschieben, In Liste duplizieren, In Reise kopieren oder Löschen.',
  'help.guide.filter-select.result':
    'Die Aktionen gelten für die ganze Auswahl auf einmal. Das × rechts verlässt den Auswahlmodus.',
  'help.guide.filter-select.tip.1':
    'Alle auswählen folgt dem Filter, also ist auf Will hin filtern und alle auswählen der schnelle Weg, die Shortlist zu bearbeiten.',
  // copy-to-trip
  'help.guide.copy-to-trip.title': 'Orte in eine Reise kopieren',
  'help.guide.copy-to-trip.goal': 'Mach aus gespeicherten Orten Stationen auf einer deiner Reisen.',
  'help.guide.copy-to-trip.step.1':
    'Schalte Wählen ein und hak die Orte ab, oder öffne einen Ort und nutz In Reise kopieren auf seinem Detailblatt.',
  'help.guide.copy-to-trip.step.2': 'Klick in der Auswahlleiste auf In Reise kopieren.',
  'help.guide.copy-to-trip.step.3': 'Wähl die Reise. Das Suchfeld grenzt eine lange Liste ein.',
  'help.guide.copy-to-trip.result':
    'Die Orte landen in der Ortsliste dieser Reise mit Name, Beschreibung, Kategorie, Notizen, Preis, Koordinaten, Foto und Tags. In der Sammlung ändert sich nichts.',
  'help.guide.copy-to-trip.tip.1':
    'Betrachter einer geteilten Liste können das auch; es kopiert aus der Liste heraus, es verändert sie nicht.',
  // share-list
  'help.guide.share-list.title': 'Eine Liste mit jemandem teilen',
  'help.guide.share-list.goal': 'Plan eine Liste live zusammen mit anderen Leuten auf diesem TREK.',
  'help.guide.share-list.step.1': 'Klick auf Teilen im Kopfbereich deiner Liste.',
  'help.guide.share-list.step.2': 'Wähl den Nutzer und eine Rolle: Betrachter, Bearbeiter oder Admin.',
  'help.guide.share-list.step.3':
    'Klick auf Einladung senden. Die Person steht als ausstehende Einladung, bis sie die Einladung in ihrer Listenleiste annimmt.',
  'help.guide.share-list.result':
    'Nach dem Annehmen erscheint die Liste bei ihr unter Geteilt und jede Änderung synchronisiert live. Mitglieder und ihre Rollen bleiben im selben Dialog bearbeitbar.',
  'help.guide.share-list.tip.1':
    'Betrachter können schauen, bewerten und Orte in eigene Reisen kopieren. Bearbeiter fügen Orte und Labels hinzu und bearbeiten sie. Admins dürfen auch löschen.',
  'help.guide.share-list.tip.2':
    'Nur der Besitzer lädt Leute ein und entfernt sie; ein Mitglied kann eine geteilte Liste selbst verlassen.',
  // export-list
  'help.guide.export-list.title': 'Eine Liste als Datei exportieren',
  'help.guide.export-list.goal':
    'Gib eine Liste an jemanden auf einem anderen TREK weiter oder nimm sie in eine Karten-App mit.',
  'help.guide.export-list.step.1': 'Klick auf Exportieren im Kopfbereich der Liste.',
  'help.guide.export-list.step.2':
    'Wähl TREK-Liste für ein anderes TREK, mit Labels und Status, oder GPX für OsmAnd, Organic Maps, ein Garmin und andere Apps, die Wegpunkte lesen.',
  'help.guide.export-list.result':
    'Die Datei wird heruntergeladen. Jedes Mitglied einer geteilten Liste darf sie exportieren.',
  'help.guide.export-list.tip.1':
    'Ein Ort ohne Koordinaten kann kein GPX-Wegpunkt sein; er bleibt außen vor und TREK sagt dir, wie viele das waren.',
  'help.guide.export-list.tip.2':
    'Bewertungen, Mitglieder und hochgeladene Fotos bleiben absichtlich zurück; sie gehören zu diesem TREK, nicht zur Liste.',
  // import-file
  'help.guide.import-file.title': 'Eine Liste aus einer Datei importieren',
  'help.guide.import-file.goal':
    'Hol eine TREK-Listendatei oder eine GPX-Datei herein, als neue Liste oder in eine, die du hast.',
  'help.guide.import-file.step.1':
    'Klick auf den Import-Button mit dem Upload-Pfeil neben Neue Liste in der Listenleiste.',
  'help.guide.import-file.step.2':
    'Wähl die Datei. TREK zeigt, was drinsteckt, bevor etwas passiert: den Namen, wie viele Orte und Labels.',
  'help.guide.import-file.step.3':
    'Lass Neue Liste stehen und ändere den Namen, wenn du magst, oder wähl Zu einer Liste hinzufügen, um die Orte in eine Liste zu legen, die du bearbeiten kannst, dann klick auf Importieren.',
  'help.guide.import-file.result':
    'Du landest auf der Liste mit den importierten Orten. Zu einer Liste hinzufügen fügt immer nur hinzu; Orte, die schon da sind, behalten Status, Notizen und Labels.',
  'help.guide.import-file.tip.1':
    'Aus einer GPX wird jeder benannte Wegpunkt ein Ort; Tracks sind Linien und bleiben außen vor, und die Vorschau sagt, wie viele Punkte das waren.',
  'help.guide.import-file.tip.2':
    'Eine Datei, die weder TREK-Liste noch GPX ist, wird mit Begründung abgelehnt; ein einzelner unlesbarer Ort wird übersprungen, nicht die ganze Datei.',
  // edit-list
  'help.guide.edit-list.title': 'Eine Liste bearbeiten oder löschen',
  'help.guide.edit-list.goal':
    'Ändere Name, Farbe, Cover, Beschreibung oder Links einer Liste, oder entferne die Liste.',
  'help.guide.edit-list.step.1': 'Klick auf Bearbeiten im Kopfbereich der Liste. Nur der Besitzer sieht es.',
  'help.guide.edit-list.step.2':
    'Ändere, was du magst, und klick auf Speichern. Liste löschen unten links entfernt die Liste mit all ihren Orten, nach einer Bestätigung.',
  'help.guide.edit-list.result': 'Der Kopfbereich übernimmt neue Farbe, Cover und Beschreibung sofort.',
  'help.guide.edit-list.tip.1':
    'Eine Liste zu löschen lässt sich nicht rückgängig machen. Exportier sie vorher, wenn du eine Kopie behalten willst.',
  // all-saved
  'help.guide.all-saved.title': 'Deine ganze Bibliothek durchsuchen',
  'help.guide.all-saved.goal': 'Schau über alle Listen, die dir gehören, auf einmal.',
  'help.guide.all-saved.step.1':
    'Klick auf Alle gespeicherten in der Listenleiste. Es vereint die Orte jeder Liste, die dir gehört oder die du mitbesitzt.',
  'help.guide.all-saved.step.2':
    'Nutz das Suchfeld und die Filter wie auf jeder Liste; Wählen geht auch hier, zum Kopieren in eine Reise.',
  'help.guide.all-saved.result':
    'Eine Ansicht über all deine gespeicherten Orte, ohne Hinzufügen oder Importieren, weil es keine einzelne Liste gibt, auf die sie könnten.',
  'help.guide.all-saved.tip.1': 'Labels sind je Liste, also gibt es den Label-Filter auf Alle gespeicherten nicht.',

  // ── Screen: journey ───────────────────────────────────────────────────────────────────
  'help.ctx.journey.title': 'Journey',
  'help.ctx.journey.summary':
    'Journey ist dein Reisetagebuch mit den Fotos im Mittelpunkt. Jede Journey hängt an einer oder mehreren Reisen und wächst Tag für Tag aus Einträgen mit Geschichte, Fotos, Stimmung und Wetter. Diese Ansicht listet deine Journeys; öffne eine, um zu schreiben.',
  'help.ctx.journey.bullet.1':
    'Das Banner oben zeigt die laufende Journey oder deine neueste, mit ihren Zahlen zu Einträgen, Fotos und Orten. Weiterschreiben öffnet sie auf dem heutigen Tag.',
  'help.ctx.journey.bullet.2':
    'Darunter eine Karte je Journey mit Cover, Untertitel, Daten und Zahlen. Klick auf eine Karte, um sie zu öffnen.',
  'help.ctx.journey.bullet.3': 'Die letzte Karte im Raster, Neue Journey erstellen, startet eine aus deinen Reisen.',
  // create-journey
  'help.guide.create-journey.title': 'Eine Journey erstellen',
  'help.guide.create-journey.goal':
    'Ein Tagebuch für eine Reise anlegen, in dem die Orte der Reise schon als Vorschläge warten.',
  'help.guide.create-journey.step.1': 'Klick auf Neue Journey erstellen, die letzte Karte im Raster.',
  'help.guide.create-journey.step.2':
    'Gib ihr einen Namen und, wenn du magst, einen Untertitel, dann hak die Reisen an, zu denen sie gehört. Der Zähler sagt, wie viele Orte hereinkommen.',
  'help.guide.create-journey.step.3': 'Klick auf Journey erstellen.',
  'help.guide.create-journey.result':
    'Das Tagebuch öffnet sich. Jeder Ort der verknüpften Reisen steht als Vorschlag im Zeitstrahl, einer je Tag, an dem er liegt, bereit zum Beschreiben.',
  'help.guide.create-journey.tip.1': 'Weitere Reisen lassen sich später in den Journey-Einstellungen verknüpfen.',
  'help.guide.create-journey.tip.2': 'Eine Journey ohne Reisen geht auch; Einträge legst du dann von Hand an.',
  // open-journey
  'help.guide.open-journey.title': 'Eine Journey öffnen',
  'help.guide.open-journey.goal': 'In ein Tagebuch hineinkommen und wissen, wo es aufgeht.',
  'help.guide.open-journey.step.1':
    'Klick auf eine Karte. Jede zeigt das Cover, die Daten und wie viele Einträge, Fotos und Orte die Journey enthält.',
  'help.guide.open-journey.result':
    'Eine laufende Journey öffnet sich auf dem heutigen Tag, oder auf dem letzten Eintrag davor, wenn heute noch nichts geschrieben ist; eine abgeschlossene öffnet sich am Anfang.',
  'help.guide.open-journey.tip.1':
    'Das Cover ist das erste Foto der Journey, solange du in den Journey-Einstellungen keins festlegst.',
  // continue-writing
  'help.guide.continue-writing.title': 'Die laufende Journey weiterschreiben',
  'help.guide.continue-writing.goal': 'Direkt auf die heutige Seite der Journey springen, auf der du gerade bist.',
  'help.guide.continue-writing.step.1':
    'Klick im Banner oben auf Weiterschreiben. Es zeigt die laufende Journey, oder die neueste, wenn keine läuft.',
  'help.guide.continue-writing.result':
    'Das Tagebuch öffnet sich auf dem heutigen Tag, oder auf dem letzten Eintrag davor, wenn heute noch nichts geschrieben ist.',
  'help.guide.continue-writing.tip.1':
    'Das Banner schlägt außerdem eine Reise vor, die noch keine Journey hat; Schließen blendet diesen Vorschlag aus.',

  // ── Screen: journey-detail ────────────────────────────────────────────────────────────
  'help.ctx.journey-detail.title': 'Tagebuch',
  'help.ctx.journey-detail.summary':
    'Eine geöffnete Journey: links der Zeitstrahl, Tag für Tag, rechts die Karte mit jedem Eintrag und den Orten der verknüpften Reisen. Alles, was etwas zum Tagebuch hinzufügt, sitzt oben; der Kopf trägt die Zahlen, Studio, den Vorschläge-Schalter und die Journey-Einstellungen.',
  'help.ctx.journey-detail.bullet.1':
    'Kopf: Cover, Titel und Untertitel, die Zahlen zu Tagen, Orten, Einträgen und Fotos, und rechts Studio, der Vorschläge-Schalter und die Journey-Einstellungen.',
  'help.ctx.journey-detail.bullet.2':
    'Werkzeugleiste: die Tabs Zeitstrahl und Galerie, In dieser Reise suchen und Eintrag hinzufügen.',
  'help.ctx.journey-detail.bullet.3':
    'Zeitstrahl: ein Abschnitt je Tag mit einem + für einen Eintrag an diesem Tag; Eintragskarten mit Fotos, Stimmung, Wetter und Geschichte; Vorschläge aus den Reisen heller dargestellt, mit Diesen Vorschlag verwerfen.',
  'help.ctx.journey-detail.bullet.4':
    'Karte: Einträge als Pins, in Datumsreihenfolge durch eine gestrichelte Linie verbunden, die Orte der Reisen und alle GPX-Tracks, die in diese Reisen importiert wurden.',
  'help.ctx.journey-detail.bullet.5':
    'Journey-Einstellungen: Cover, Name und Untertitel, Tracks auf der Karte, Felder im Eintrag, verworfene Vorschläge, verknüpfte Reisen, Mitwirkende, öffentliches Teilen, Archivieren und Löschen.',
  'help.ctx.journey-detail.bullet.6':
    'Über einem langen Zeitstrahl schweben zwei runde Buttons: zurück nach oben und zum letzten Eintrag springen.',
  // add-entry
  'help.guide.add-entry.title': 'Einen Eintrag schreiben',
  'help.guide.add-entry.goal': 'Die Geschichte eines Tages mit Titel, Text, Stimmung und Wetter hinzufügen.',
  'help.guide.add-entry.step.1':
    'Klick in der Werkzeugleiste auf Eintrag hinzufügen, oder auf das + in einem Tageskopf, um an diesem Tag zu beginnen.',
  'help.guide.add-entry.step.2':
    'Gib dem Moment einen Namen und schreib die Geschichte. Die Leiste über dem Text fügt Fett, Kursiv, Überschriften, Zitate, Links und Listen in Markdown ein.',
  'help.guide.add-entry.step.3':
    'Wähl eine Stimmung und das Wetter, prüf das Datum und setz, wenn du magst, einen Ort: such einen Ort oder nimm deine aktuelle Position.',
  'help.guide.add-entry.step.4': 'Klick auf Speichern.',
  'help.guide.add-entry.result':
    'Der Eintrag erscheint an seinem Tag im Zeitstrahl und als Pin auf der Karte. Seine Zahlen im Kopf werden aktualisiert.',
  'help.guide.add-entry.tip.1': 'In einen Vorschlag zu schreiben ist derselbe Editor, nur mit schon gesetztem Ort.',
  'help.guide.add-entry.tip.2': 'Tags unten sind Freitext, Geheimtipp oder bestes Essen, und die Suche findet sie.',
  // entry-photos
  'help.guide.entry-photos.title': 'Fotos und Videos an einen Eintrag hängen',
  'help.guide.entry-photos.goal': 'Bilder auf einen Tag legen; das erste wird das Cover des Eintrags.',
  'help.guide.entry-photos.step.1': 'Öffne das Menü eines Eintrags über das ⋯ auf seiner Karte und wähl Bearbeiten.',
  'help.guide.entry-photos.step.2':
    'Klick auf Fotos hochladen und wähl die Dateien. Aus Galerie nimmt Bilder, die schon in der Galerie der Journey liegen; External photos durchsucht eine verbundene Immich- oder Synology-Bibliothek nach diesem Tag.',
  'help.guide.entry-photos.step.3':
    'Fahr über ein Bild und klick auf Als 1. setzen, um das Cover zu wählen, dann auf Speichern.',
  'help.guide.entry-photos.result':
    'Die Fotos erscheinen auf der Karte und in der Galerie; das erste ist überall das Vorschaubild.',
  'help.guide.entry-photos.tip.1':
    'Videos kommen genauso an einen Eintrag: mp4, m4v, webm oder mov bis 500 MB, gespeichert wie hochgeladen.',
  'help.guide.entry-photos.tip.2':
    'HEIC-Dateien vom iPhone werden beim Hochladen zu JPEG umgewandelt, dabei gehen GPS- und Kameradaten verloren.',
  // suggestions
  'help.guide.suggestions.title': 'Vorschläge nutzen oder verwerfen',
  'help.guide.suggestions.goal':
    'Die Orte deiner Reisen zu Einträgen machen und die wegräumen, über die du nichts schreiben wirst.',
  'help.guide.suggestions.step.1':
    'Ein Vorschlag ist eine hellere Karte mit dem Ortsnamen in Kursiv. Klick darauf, um den Editor mit schon gesetztem Ort und Tag zu öffnen.',
  'help.guide.suggestions.step.2':
    'Klick auf Diesen Vorschlag verwerfen bei einer Karte, die du nicht brauchst. Sie verlässt den Zeitstrahl, ohne gelöscht zu werden, und der Reise-Abgleich bietet sie nicht noch einmal an.',
  'help.guide.suggestions.step.3':
    'Anders überlegt? Die Journey-Einstellungen zeigen, wie viele verworfen sind, und Verworfene Vorschläge zurückholen bringt sie alle zurück.',
  'help.guide.suggestions.result':
    'Der Zeitstrahl enthält nur, was du wirklich schreiben willst; der Schalter im Kopf blendet beim Lesen alle Vorschläge auf einmal aus.',
  'help.guide.suggestions.tip.1': 'Ein Ort, der über zwei Tage geht, ergibt an jedem davon einen Vorschlag.',
  'help.guide.suggestions.tip.2': 'Vorschläge zählen nie in der Statistik; nur geschriebene Einträge zählen.',
  // add-on-day
  'help.guide.add-on-day.title': 'Einen Eintrag an einem früheren Tag hinzufügen',
  'help.guide.add-on-day.goal':
    'Über einen Tag schreiben, der schon vorbei ist, ohne hinterher das Datum zu korrigieren.',
  'help.guide.add-on-day.step.1': 'Klick auf das + im Kopf dieses Tages.',
  'help.guide.add-on-day.step.2': 'Der Editor öffnet sich mit diesem Datum. Schreib und Speichern wie gewohnt.',
  'help.guide.add-on-day.result': 'Der Eintrag landet sofort am richtigen Tag.',
  'help.guide.add-on-day.tip.1':
    'Innerhalb eines Tages verschieben die Pfeile im Menü eines Eintrags ihn nach vorn oder hinten.',
  // pros-cons
  'help.guide.pros-cons.title': 'Ein Fazit hinzufügen',
  'help.guide.pros-cons.goal': 'Einen Tag zusammenfassen mit dem, was toll war und was nicht.',
  'help.guide.pros-cons.step.1':
    'Im Editor findest du Pro & Contra unter der Geschichte. Tipp einen Punkt in Pro oder Contra und nimm Hinzufügen für den nächsten.',
  'help.guide.pros-cons.step.2': 'Speichern. Das Fazit erscheint auf der Karte als zwei kurze Listen.',
  'help.guide.pros-cons.result': 'Daumen hoch und Daumen runter auf einen Blick, unter der Geschichte.',
  'help.guide.pros-cons.tip.1':
    'Eine Journey ohne Fazit kann den Abschnitt in den Journey-Einstellungen unter Felder im Eintrag abschalten.',
  // search-journey
  'help.guide.search-journey.title': 'Etwas in einem langen Tagebuch finden',
  'help.guide.search-journey.goal': 'Zum gemeinten Eintrag kommen, ohne durch Wochen zu scrollen.',
  'help.guide.search-journey.step.1':
    'Tipp in der Werkzeugleiste in In dieser Reise suchen. Der Zeitstrahl filtert beim Tippen über Titel, Geschichten, Orte und Tags. Akzente und Groß- und Kleinschreibung spielen keine Rolle.',
  'help.guide.search-journey.step.2':
    'Der Vorschläge-Schalter im Kopf blendet beim Lesen die ungeschriebenen Karten aus. Wird der Zeitstrahl lang, schweben zwei runde Buttons über seiner Unterkante: zurück nach oben und zum letzten Eintrag springen.',
  'help.guide.search-journey.result': 'Nur passende Einträge bleiben; leer das Feld, um wieder alles zu sehen.',
  'help.guide.search-journey.tip.1':
    'Eine laufende Journey öffnet sich auf dem heutigen Tag, die aktuelle Seite ist also meist schon im Blick.',
  'help.guide.search-journey.tip.2': 'Tags zählen mit: Die Suche nach Geheimtipp findet jeden Eintrag mit diesem Tag.',
  // gallery-map
  'help.guide.gallery-map.title': 'Galerie und Karte durchstöbern',
  'help.guide.gallery-map.goal': 'Die ganze Journey als Bilder sehen, und als Orte auf der Karte.',
  'help.guide.gallery-map.step.1':
    'Wechsle in der Werkzeugleiste zu Galerie: jedes Foto jedes Eintrags, plus Bilder, die direkt in die Galerie hochgeladen wurden. Klick auf eins für die Lightbox.',
  'help.guide.gallery-map.step.2':
    'Die Karte rechts zeigt die Einträge als Pins in Datumsreihenfolge, die Orte der verknüpften Reisen und jeden GPX-Track, der in diese Reisen importiert wurde, in der Farbe, die er im Planer hat.',
  'help.guide.gallery-map.result':
    'Fahr über einen Track für seinen Namen. Die gestrichelte Linie zwischen Einträgen zeichnet TREK; ein Track ist die Route, die du tatsächlich aufgezeichnet hast.',
  'help.guide.gallery-map.tip.1': 'Tracks lassen sich je Journey in den Journey-Einstellungen abschalten.',
  'help.guide.gallery-map.tip.2':
    'Galeriefotos mit Standort erscheinen auch auf der öffentlichen Karte, wenn Galerie und Karte beide geteilt sind.',
  // entry-fields
  'help.guide.entry-fields.title': 'Felder im Eintrag abschalten',
  'help.guide.entry-fields.goal': 'Den Editor auf das beschränken, was diese Journey nutzt.',
  'help.guide.entry-fields.step.1': 'Öffne die Journey-Einstellungen über den Kopf.',
  'help.guide.entry-fields.step.2': 'Schalte unter Felder im Eintrag Stimmung, Wetter oder Pro & Contra ab.',
  'help.guide.entry-fields.result':
    'Der Editor fragt nicht mehr danach. Nichts Geschriebenes geht verloren: Ein Feld wieder einschalten holt die gespeicherten Werte zurück, und eine geteilte Journey blendet dieselben Felder aus.',
  'help.guide.entry-fields.tip.1':
    'Die Schalter gelten je Journey, eine Dienstreise und ein Urlaub dürfen sich also unterscheiden.',
  // link-trip
  'help.guide.link-trip.title': 'Eine weitere Reise verknüpfen',
  'help.guide.link-trip.goal': 'Die Orte einer zweiten Reise als Vorschläge ins Tagebuch holen.',
  'help.guide.link-trip.step.1': 'Öffne die Journey-Einstellungen über den Kopf.',
  'help.guide.link-trip.step.2': 'Klick unter den verknüpften Reisen auf Trip hinzufügen.',
  'help.guide.link-trip.step.3': 'Wähl die Reise.',
  'help.guide.link-trip.result':
    'Ihre Orte kommen als Vorschläge an ihren Tagen in den Zeitstrahl, und ihre GPX-Tracks auf die Karte.',
  'help.guide.link-trip.tip.1':
    'Das × neben einer verknüpften Reise löst sie wieder; Einträge, die du geschrieben hast, bleiben.',
  'help.guide.link-trip.tip.2': 'Einträge mit einem Tag zählen nur einmal, egal wie viele Reisen diesen Tag abdecken.',
  // share-public
  'help.guide.share-public.title': 'Die Journey öffentlich teilen',
  'help.guide.share-public.goal': 'Leuten ohne TREK-Konto einen Nur-Lesen-Link geben.',
  'help.guide.share-public.step.1': 'Öffne die Journey-Einstellungen und such den Abschnitt Öffentlicher Link.',
  'help.guide.share-public.step.2': 'Klick auf Link erstellen.',
  'help.guide.share-public.step.3':
    'Wähl, was Besucher sehen: Zeitstrahl, Galerie und Karte sind getrennte Schalter. Kopieren legt den Link in deine Zwischenablage.',
  'help.guide.share-public.result':
    'Wer den Link hat, sieht die freigegebenen Bereiche und sonst nichts; Felder, die du unter Felder im Eintrag abgeschaltet hast, bleiben auch dort verborgen.',
  'help.guide.share-public.tip.1':
    'Fotos erscheinen auf der öffentlichen Karte nur, wenn Galerie und Karte beide an sind; ist Karte aus, werden ihre Koordinaten entfernt, bevor sie den Server verlassen.',
  'help.guide.share-public.tip.2': 'Lösch den Link an derselben Stelle, um das Teilen zu beenden.',
  // contributors
  'help.guide.contributors.title': 'Gemeinsam schreiben',
  'help.guide.contributors.goal': 'Jemanden, der mitreist, eigene Einträge und Fotos hinzufügen lassen.',
  'help.guide.contributors.step.1': 'Öffne die Journey-Einstellungen und scroll zu den Mitwirkenden.',
  'help.guide.contributors.step.2': 'Klick auf Mitwirkenden einladen und such die Person nach Name oder E-Mail.',
  'help.guide.contributors.step.3': 'Wähl eine Rolle und bestätige.',
  'help.guide.contributors.result':
    'Die Journey erscheint in ihrer Liste, und ihre Einträge tragen ihren Namen. Entferne jemanden über das × daneben.',
  'help.guide.contributors.tip.1':
    'Mitwirkende sind für Leute auf diesem TREK. Für alle anderen gibt es den öffentlichen Link.',
  // studio
  'help.guide.studio.title': 'Die Journey als Fotobuch gestalten',
  'help.guide.studio.goal': 'Das Tagebuch in druckbare Seiten verwandeln.',
  'help.guide.studio.step.1': 'Klick im Kopf auf Studio. Der Designer öffnet sich über der Journey.',
  'help.guide.studio.step.2':
    'Der Name der Journey links in der oberen Leiste ist der Weg zurück; er bringt dich dorthin, wo du warst.',
  'help.guide.studio.result':
    'Links die Seitenleiste, in der Mitte die Doppelseite auf der Werkbank, rechts die Eigenschaften. Automatisch anordnen baut das Buch aus deinen Einträgen; Exportieren erzeugt ein druckfertiges PDF.',
  'help.guide.studio.tip.1':
    'Studio braucht ein Fenster von mindestens 1024 px Breite und wird auf dem Handy nicht angeboten.',
  'help.guide.studio.tip.2':
    'Das Buch erbt den Zugriff der Journey: Wer die Journey lesen darf, darf es öffnen, wer sie bearbeiten darf, darf speichern.',
  // archive-journey
  'help.guide.archive-journey.title': 'Eine Journey archivieren oder löschen',
  'help.guide.archive-journey.goal': 'Eine abgeschlossene Journey schließen oder eine endgültig entfernen.',
  'help.guide.archive-journey.step.1': 'Öffne die Journey-Einstellungen.',
  'help.guide.archive-journey.step.2':
    'Ganz unten beendet Reise archivieren sie und markiert sie als archiviert; Reise wiederherstellen holt sie zurück. Löschen entfernt sie mit allen Einträgen und Fotos, nach einer Bestätigung.',
  'help.guide.archive-journey.result':
    'Eine archivierte Journey bleibt lesbar und teilbar; sie öffnet sich nur nicht mehr auf dem heutigen Tag.',
  'help.guide.archive-journey.tip.1':
    'Löschen lässt sich nicht rückgängig machen, und es rührt die Reisen nicht an, mit denen die Journey verknüpft war.',
  'help.guide.archive-journey.tip.2': 'Cover, Name und Untertitel liegen im selben Dialog, ganz oben.',

  // ── Screen: journey-studio ────────────────────────────────────────────────────────────
  'help.ctx.journey-studio.title': 'Studio',
  'help.ctx.journey-studio.summary':
    'TREK Studio legt eine Journey als druckbares Fotobuch an. Es öffnet sich über dem Tagebuch: links die Leiste mit den Seiten und Inhalten, in der Mitte die Doppelseite, an der du gerade arbeitest, rechts ihre Eigenschaften. Automatisch anordnen baut aus deinen Einträgen einen ersten Entwurf; alles danach gehört dir zum Verschieben, Zuschneiden und Umgestalten, mit Rückgängig für jeden Schritt.',
  'help.ctx.journey-studio.bullet.1':
    'Obere Leiste: Zurück zur Journey, Buchansicht, Rückgängig und Wiederherstellen, Seitenformat, Automatisch anordnen und Exportieren. Der Vermerk Gespeichert neben dem Titel zeigt dir, wann das Buch gespeichert ist.',
  'help.ctx.journey-studio.bullet.2':
    'Leiste links mit fünf Bereichen: Seiten, Inhalte (die Fotos und Einträge der Journey), Elemente (Text, Formen, Linien, Raster, Rahmen, Symbole), Reise (Karten, Länder, Flaggen und Marken aus der Journey) und Layouts.',
  'help.ctx.journey-studio.bullet.3':
    'Arbeitsfläche: die aktuelle Doppelseite mit Anschnitt und Schutzzone, darunter die Zoomleiste, Einpassen und rechts Diese Doppelseite herunterladen.',
  'help.ctx.journey-studio.bullet.4':
    'Eigenschaften rechts: Position und Größe, Ausschnitt und Fokuspunkt, Füllen oder Einpassen, Look, Ecken, Rahmen, Stapelreihenfolge und Sperre der Auswahl; Seitenzahlen und das Dokument, wenn nichts ausgewählt ist.',
  'help.ctx.journey-studio.bullet.5':
    'Das Buch hat die Form eines gebundenen: Cover, eine einzelne erste Seite, die Doppelseiten, eine einzelne letzte Seite und die Rückseite. Seitenzahlen zählen ab der ersten Seite und werden so gedruckt, wie sie angezeigt werden.',
  'help.ctx.journey-studio.bullet.6':
    'Mehrere Leute können gleichzeitig gestalten: Jeder sieht die Zeiger der anderen mit ihren Namen, und ein Speichern auf einer Version, die jemand anderes geändert hat, kommt als Konflikt zurück, statt dessen Arbeit zu überschreiben.',
  // studio-auto-layout
  'help.guide.studio-auto-layout.title': 'Das Buch automatisch bauen',
  'help.guide.studio-auto-layout.goal':
    'Hol dir mit einem Klick einen kompletten ersten Entwurf aus den Einträgen und Fotos des Tagebuchs.',
  'help.guide.studio-auto-layout.step.1': 'Klick in der oberen Leiste auf Automatisch anordnen.',
  'help.guide.studio-auto-layout.step.2':
    'Wähl Das ganze Buch: Es ersetzt jede Seite und behält deinen Titel und die Seiteneinstellungen. Diese Seite baut nur die auf dem Bildschirm neu und wird auf einer Doppelseite angeboten, die aus einem Eintrag entstanden ist.',
  'help.guide.studio-auto-layout.step.3':
    'Geh die Seitenleiste durch. Rückgängig nimmt das ganze Layout zurück, wenn dir das vorherige lieber war.',
  'help.guide.studio-auto-layout.result':
    'Eine Doppelseite pro Eintrag, in Reihenfolge, mit Fotos, Titel und Text für dich platziert. Jedes Element folgt seinem Eintrag weiter, bis du es bearbeitest.',
  'help.guide.studio-auto-layout.tip.1': 'Beide Einträge sind normale Rückgängig-Schritte, also probier sie ruhig aus.',
  'help.guide.studio-auto-layout.tip.2':
    'Ein Element, das Automatisch anordnen an einen Eintrag gebunden hat, geht Änderungen an diesem Eintrag mit, bis du es in Eigenschaften anfasst; das löst die Verbindung.',
  // studio-pages
  'help.guide.studio-pages.title': 'Doppelseiten hinzufügen, verschieben und entfernen',
  'help.guide.studio-pages.goal': 'Gib dem Buch Seite für Seite seine Form.',
  'help.guide.studio-pages.step.1':
    'Öffne Seiten in der Leiste. Die Vorschaubilder sind das Buch in Reihenfolge: Cover, erste Seite, Doppelseiten, letzte Seite, Rückseite.',
  'help.guide.studio-pages.step.2':
    'Seite hinzufügen unten setzt eine neue vor die letzte Seite; das + zwischen zwei Vorschaubildern fügt genau dort eine ein.',
  'help.guide.studio-pages.step.3':
    'Fahr über ein Vorschaubild für seine Aktionen: Nach vorne, Nach hinten, Seite duplizieren und Seite löschen. Klick auf ein Vorschaubild, um diese Doppelseite auf der Arbeitsfläche zu öffnen.',
  'help.guide.studio-pages.result':
    'Cover, erste und letzte Seite und Rückseite bleiben, wo sie sind; neue Doppelseiten landen immer dazwischen.',
  'help.guide.studio-pages.tip.1':
    'Buchansicht in der oberen Leiste zeigt das ganze Buch als Blätter, so wie es gebunden wird.',
  'help.guide.studio-pages.tip.2':
    'Seitenzahlen schaltest du unter Dokument in Eigenschaften ein, ohne dass etwas ausgewählt ist.',
  // studio-layouts
  'help.guide.studio-layouts.title': 'Ein Layout auf eine Doppelseite anwenden',
  'help.guide.studio-layouts.goal': 'Gib einer Doppelseite eine fertige Anordnung aus Foto- und Textrahmen.',
  'help.guide.studio-layouts.step.1':
    'Öffne Layouts in der Leiste. Dreizehn Layouts für Doppelseiten und ein eigener Satz für Cover, Rückseite und die Einzelseiten.',
  'help.guide.studio-layouts.step.2':
    'Klick eines an. Die Doppelseite auf der Arbeitsfläche übernimmt seine Rahmen; Fotos und Texte, die du schon hattest, fließen hinein.',
  'help.guide.studio-layouts.result':
    'Leere Rahmen warten auf Inhalt: Zieh ein Foto aus Inhalte darauf oder nutz Auf diese Seite setzen.',
  'help.guide.studio-layouts.tip.1': 'Ein Layout ist ein Rückgängig-Schritt wie jeder andere.',
  // studio-content
  'help.guide.studio-content.title': 'Fotos und Einträge auf eine Seite bringen',
  'help.guide.studio-content.goal': 'Hol das eigene Material der Journey auf die Doppelseite.',
  'help.guide.studio-content.step.1':
    'Öffne Inhalte in der Leiste. Fotos listet jedes Bild der Journey; Einträge listet die Einträge mit ihrem Text.',
  'help.guide.studio-content.step.2':
    'Zieh ein Foto auf die Doppelseite oder auf einen leeren Rahmen, oder klick darunter auf Auf diese Seite setzen. Fotos hochladen ergänzt Bilder, die noch nicht in der Journey sind.',
  'help.guide.studio-content.step.3':
    'Unter einem Eintrag setzen Titel, Text und Ort diesen Text als Textelement auf die Seite; Datum und die Koordinaten kommen als Marken, und die Fotos des Eintrags sind gleich dort aufgelistet.',
  'help.guide.studio-content.result':
    'Ein abgelegtes Foto wird zum Fotoelement; Text folgt dem Eintrag weiter, bis du ihn bearbeitest.',
  'help.guide.studio-content.tip.1': 'Das Suchfeld oben in Inhalte filtert beide Listen.',
  'help.guide.studio-content.tip.2':
    'Eine Datei vom Desktop auf die Arbeitsfläche zu ziehen lädt sie hoch und platziert sie in einem Zug.',
  // studio-elements
  'help.guide.studio-elements.title': 'Text, Formen und Symbole hinzufügen',
  'help.guide.studio-elements.goal': 'Gestalte eine Doppelseite über Fotos und Texte hinaus.',
  'help.guide.studio-elements.step.1': 'Öffne Elemente in der Leiste.',
  'help.guide.studio-elements.step.2':
    'Klick auf einen Textstil für Überschrift oder Bildunterschrift, eine Form, eine Linie, ein Raster, einen leeren Rahmen mit Rahmenstil oder ein Symbol aus der durchsuchbaren Bibliothek. Jedes landet in der Mitte der Doppelseite, bereit zum Verschieben.',
  'help.guide.studio-elements.result':
    'Doppelklick auf ein Textelement, um hineinzuschreiben; Eigenschaften hält Schrift, Schriftschnitt, Größe, Abstand und Ausrichtung.',
  'help.guide.studio-elements.tip.1': 'Rahmen sind leere Fotoplätze: Leg später ein Bild hinein.',
  // studio-travel
  'help.guide.studio-travel.title': 'Karte, Flaggen und Zahlen hinzufügen',
  'help.guide.studio-travel.goal': 'Bring die Reise selbst als Zahlen auf die Seite.',
  'help.guide.studio-travel.step.1': 'Öffne Reise in der Leiste.',
  'help.guide.studio-travel.step.2':
    'Wähl, was du hinzufügen willst: eine Routenkarte der Einträge, Länder als Umrisse, eine Länderliste oder ein Ländergitter, Flaggen, eine Marke für Datum, Tageszähler oder Distanz oder eine Übersicht der ganzen Reise. Jedes entsteht aus den Daten der Journey und aktualisiert sich mit ihnen.',
  'help.guide.studio-travel.result':
    'Das Element erscheint auf der Doppelseite; Eigenschaften stellt seinen Stil ein, bei der Karte auch den Ausschnitt.',
  'help.guide.studio-travel.tip.1':
    'Marken folgen dem Eintrag, aus dem die Doppelseite entstanden ist, deshalb zeigt eine Datumsmarke auf einer automatisch angeordneten Doppelseite schon diesen Tag.',
  // studio-properties
  'help.guide.studio-properties.title': 'Deine Auswahl bearbeiten',
  'help.guide.studio-properties.goal': 'Verschieb, beschneid, gestalte und staple ein Element über Eigenschaften.',
  'help.guide.studio-properties.step.1':
    'Klick ein Element auf der Doppelseite an. Griffe erscheinen für Größe und Drehung; zieh es, um es zu verschieben.',
  'help.guide.studio-properties.step.2':
    'Eigenschaften rechts folgt der Auswahl: Position und Größe, Ausschnitt mit dem Fokuspunkt, der entscheidet, was im Rahmen bleibt, Füllen oder Einpassen, Look-Filter, Ecke für den Radius, Rahmen für den Stil, Stapelreihenfolge und Sperren.',
  'help.guide.studio-properties.step.3':
    'Duplizieren und Löschen sitzen oben in Eigenschaften; Rückgängig in der oberen Leiste macht alles davon rückgängig.',
  'help.guide.studio-properties.result':
    'Ein gesperrtes Element lässt sich auf der Seite nicht mehr greifen; so bleibt ein fertiges Layout sicher, während du drumherum arbeitest.',
  'help.guide.studio-properties.tip.1':
    'Shift-Klick wählt mehrere Elemente; Eigenschaften bearbeitet sie dann gemeinsam.',
  'help.guide.studio-properties.tip.2':
    'Ein Element zu bearbeiten, das Automatisch anordnen platziert hat, löst seine Verbindung zum Eintrag; es folgt späteren Änderungen an diesem Eintrag nicht mehr.',
  // studio-format
  'help.guide.studio-format.title': 'Das Seitenformat wählen',
  'help.guide.studio-format.goal': 'Leg die Größe fest, in der das Buch gedruckt wird, bevor das Layout davon abhängt.',
  'help.guide.studio-format.step.1': 'Klick in der oberen Leiste auf Seitenformat.',
  'help.guide.studio-format.step.2':
    'Wähl Quadratisch 21 × 21 cm, Quadratisch 30 × 30 cm, A4 oder A5 quer oder hoch, oder gib unter Eigenes Format Breite und Höhe in Millimetern ein. Anschnitt und Schutzzone sitzen darunter.',
  'help.guide.studio-format.result':
    'Jede Doppelseite wird in dieser Größe gezeichnet, standardmäßig mit 3 mm Anschnitt und 5 mm Schutzzone.',
  'help.guide.studio-format.tip.1':
    'Ändere erst das Format, dann starte Automatisch anordnen; das Layout wird für die Größe gebaut, die es vorfindet.',
  'help.guide.studio-format.tip.2':
    'Frag deine Druckerei nach ihren Werten für Anschnitt und Schutzzone und trag die ein.',
  // studio-export
  'help.guide.studio-export.title': 'Das Buch als PDF exportieren',
  'help.guide.studio-export.goal': 'Hol dir eine druckfertige Datei oder eine zum Lesen am Bildschirm.',
  'help.guide.studio-export.step.1': 'Klick in der oberen Leiste auf Exportieren.',
  'help.guide.studio-export.step.2':
    'Wähl Einzelseiten, eine Seite pro Blatt in Lesereihenfolge, was eine Druckerei will, oder Doppelseiten, zwei Seiten auf einmal, so wie sich das Buch öffnet. Beschnittmarken ergänzen den Anschnitt an jeder Kante und markieren, wo geschnitten wird.',
  'help.guide.studio-export.step.3':
    'Klick auf Druckansicht. Dein Browser öffnet die Seiten, und Als PDF sichern macht daraus die Datei.',
  'help.guide.studio-export.result':
    'Ein PDF mit so vielen Blättern, wie der Dialog angekündigt hat, im Seitenformat, das du gesetzt hast.',
  'help.guide.studio-export.tip.1': 'Das PDF entsteht nur am Desktop, wie Studio selbst.',
  'help.guide.studio-export.tip.2':
    'Für einen Korrekturabzug exportier Doppelseiten ohne Beschnittmarken; für die Druckerei Einzelseiten mit.',
  // studio-spread-file
  'help.guide.studio-spread-file.title': 'Eine Doppelseite in einem anderen Buch wiederverwenden',
  'help.guide.studio-spread-file.goal':
    'Nimm ein Design, das dir gefällt, aus dem Buch einer Journey ins Buch einer anderen mit.',
  'help.guide.studio-spread-file.step.1':
    'Mit der Doppelseite auf der Arbeitsfläche klick rechts am Ende der Zoomleiste auf Diese Doppelseite herunterladen. Die Datei enthält das Design, nicht die Fotos.',
  'help.guide.studio-spread-file.step.2':
    'Öffne im anderen Buch Seiten und klick neben Seite hinzufügen auf Importieren, dann wähl die Datei.',
  'help.guide.studio-spread-file.result':
    'Die Doppelseite kommt mit ihren Rahmen und Textstilen an; leg die Fotos der neuen Journey in die Rahmen.',
  'help.guide.studio-spread-file.tip.1': 'Eine Datei, die kein Doppelseiten-Design ist, wird mit Begründung abgelehnt.',

  // ── Screen: settings (all tabs) ───────────────────────────────────────────────────────
  'help.ctx.settings.title': 'Einstellungen',
  'help.ctx.settings.summary':
    'Deine persönlichen Einstellungen, ein Tab pro Thema in der Seitenleiste links. Die meisten Schalter greifen in dem Moment, in dem du sie umlegst; ein Formular mit einem Speichern-Button unten wartet darauf. Nichts hier verändert das TREK von jemand anderem.',
  'help.ctx.settings.bullet.1':
    'Seitenleiste links: Allgemein, Erscheinungsbild, Karte, Mitteilungen, Integrationen, Offline und Konto. Plugins erscheint, sobald eines installiert ist, Über dort, wo der Admin es nicht entfernt hat.',
  'help.ctx.settings.bullet.2':
    'Allgemein ist Sprache, Einheiten, Währung und womit die App öffnet; Erscheinungsbild ist Theme, Farben, Textgröße und die Dashboard-Widgets.',
  'help.ctx.settings.bullet.3':
    'Karte wählt den Renderer und seinen Stil; Mitteilungen die Kanäle, die dich erreichen; Integrationen Fotobibliotheken, API-Schlüssel und MCP; Offline, was die App auf diesem Gerät behält.',
  'help.ctx.settings.bullet.4':
    'Konto hält dein Profil, Passwort, Zwei-Faktor-Authentifizierung, Passkeys und das Löschen deines Kontos.',
  'help.ctx.settings-display.title': 'Allgemein',
  'help.ctx.settings-display.summary':
    'Sprache, Einheiten und Währung, wie sich Karte und Buchungen verhalten, und womit TREK öffnet. Jede Änderung hier greift sofort.',
  'help.ctx.settings-display.bullet.1':
    'Sprache & Region: die Sprache der Oberfläche, das Zeitformat, der erste Tag der Woche, die Anzeigewährung sowie Entfernungs- und Temperatureinheit.',
  'help.ctx.settings-display.bullet.2':
    'Reise & Karte: Buchungsrouten immer auf der Karte, die Pille zum Entdecken von Orten, Routenoptimierung ab deiner Unterkunft, verborgene Buchungscodes und beschriftete Buchungsrouten.',
  'help.ctx.settings-display.bullet.3':
    'Start: ob TREK auf dem Dashboard oder auf der aktiven Reise öffnet, und welcher Tab einer Reise zuerst kommt.',
  'help.ctx.settings-appearance.title': 'Erscheinungsbild',
  'help.ctx.settings-appearance.summary':
    'Wie TREK auf diesem Konto aussieht: hell oder dunkel, die Akzentfarbe, Glas und Bewegung, Textgröße, und welche Widgets das Dashboard zeigt. Alles greift live, auf jedem Gerät, auf dem du dich anmeldest.',
  'help.ctx.settings-appearance.bullet.1':
    'Theme: Hell, Dunkel oder Automatisch, und das Farbschema mit Eigene Akzentfarbe für eine Farbe von dir.',
  'help.ctx.settings-appearance.bullet.2':
    'Lesbarkeit: Transparenz, Bewegung reduzieren, Dichte und Textgröße, mit erweiterten Größen pro Stufe.',
  'help.ctx.settings-appearance.bullet.3':
    'Dashboard-Widgets: ein Schalter pro Widget, getrennt für Desktop und Mobil.',
  'help.ctx.settings-appearance.bullet.4': 'Auf Standard zurücksetzen unten stellt alles wieder her.',
  'help.ctx.settings-map.title': 'Karte',
  'help.ctx.settings-map.summary':
    'Welche Engine die Karten zeichnet und in welchem Stil. Leaflet ist die klassische Rasterkarte, MapLibre zeichnet Vektorkacheln ganz ohne Token, Mapbox ergänzt 3D-Gebäude und Gelände mit deinem eigenen Token.',
  'help.ctx.settings-map.bullet.1':
    'Kartenanbieter: Leaflet, MapLibre oder Mapbox, jeder mit einer Zeile dazu, was er braucht.',
  'help.ctx.settings-map.bullet.2':
    'Kartenstil und Karten-Vorlage: das Aussehen der Kacheln, plus den Token oder Key, den ein Anbieter verlangt.',
  'help.ctx.settings-map.bullet.3':
    'Hochqualitäts-Modus für Antialiasing und die Globus-Projektion; Karte speichern schreibt die Wahl.',
  'help.ctx.settings-notifications.title': 'Mitteilungen',
  'help.ctx.settings-notifications.summary':
    'Wo TREK dich außerhalb der App erreicht: Push-Benachrichtigungen auf diesem Gerät, ein ntfy-Thema, ein Webhook oder ein Kanal, den ein Plugin bereitstellt. Unter den Kanälen entscheidet eine Zeile pro Ereignis, was wohin geht.',
  'help.ctx.settings-notifications.bullet.1':
    'ntfy: das Thema, optional ein eigener Server und ein optionaler Zugriffstoken, mit Testen, um sofort eine Nachricht zu schicken.',
  'help.ctx.settings-notifications.bullet.2': 'Webhook: eine URL, die jedes Ereignis als JSON empfängt, mit Testen.',
  'help.ctx.settings-notifications.bullet.3':
    'Push-Benachrichtigungen auf diesem Gerät: Für dieses Gerät einschalten gilt nur für den Browser, den du gerade nutzt, also wiederhole es auf jedem Handy oder Computer. Test senden erreicht alle.',
  'help.ctx.settings-notifications.bullet.4':
    'Die Zeilen mit den Präferenzen: pro Ereignis, welcher Kanal an ist. Plugin-Kanäle zeigen Einrichten, bis sie eingerichtet sind.',
  'help.ctx.settings-integrations.title': 'Integrationen',
  'help.ctx.settings-integrations.summary':
    'Alles, was von außen an TREK andockt: Fotobibliotheken für die Journey, API-Schlüssel für Skripte und der MCP-Endpunkt mit seinen Tokens und OAuth-Clients für KI-Assistenten.',
  'help.ctx.settings-integrations.bullet.1':
    'Foto-Anbieter: Immich und Synology Photos, jeder mit seiner URL und seinem Key, Verbindung testen und Speichern.',
  'help.ctx.settings-integrations.bullet.2':
    'API-Schlüssel: persönliche Schlüssel für Skripte und andere Tools, die die TREK-API in deinem Namen aufrufen.',
  'help.ctx.settings-integrations.bullet.3':
    'MCP-Konfiguration: der Endpunkt, eine fertige Client-Konfiguration zum Kopieren und die API-Tokens.',
  'help.ctx.settings-integrations.bullet.4':
    'OAuth 2.1-Clients: Apps, die sich über TREK anmelden, mit Redirect-URIs, erlaubten Berechtigungen, maschinellen Clients und den aktiven Sessions.',
  'help.ctx.settings-offline.title': 'Offline',
  'help.ctx.settings-offline.summary':
    'Was TREK auf diesem Gerät behält, damit eine Reise auch ohne Verbindung öffnet, und was passiert, wenn eine offline gemachte Änderung mit einer von anderswo kollidiert.',
  'help.ctx.settings-offline.bullet.1':
    'Offline-Modus: Offline-Modus erzwingen lässt die App so tun, als wäre das Netz weg, zum Testen oder bei einer getakteten Verbindung.',
  'help.ctx.settings-offline.bullet.2':
    'Für Offline vorbereiten: Für Offline-Nutzung herunterladen holt deine Reisen und ihre Kartenkacheln jetzt.',
  'help.ctx.settings-offline.bullet.3':
    'Was offline gespeichert wird: Kartenkacheln an oder aus, und ein Schalter pro Reise.',
  'help.ctx.settings-offline.bullet.4':
    'Synchronisierungskonflikte und Offline-Cache: die Strategie bei Kollisionen, die Zahl der ausstehenden und fehlgeschlagenen Änderungen, Jetzt neu synchronisieren und Cache leeren.',
  'help.ctx.settings-account.title': 'Konto',
  'help.ctx.settings-account.summary':
    'Wer du auf diesem TREK bist und wie du dich anmeldest: Profil und Avatar, Passwort, Zwei-Faktor-Authentifizierung, Passkeys und ganz unten das Löschen des Kontos.',
  'help.ctx.settings-account.bullet.1': 'Profil: Benutzername, E-Mail und Avatar, gesichert mit Speichern.',
  'help.ctx.settings-account.bullet.2':
    'Passwort ändern: aktuelles Passwort, neues Passwort zweimal, Passwort aktualisieren.',
  'help.ctx.settings-account.bullet.3':
    'Zwei-Faktor-Authentifizierung (2FA) mit einer Authenticator-App und Backup-Codes; Passkeys für die Anmeldung ohne Passwort.',
  'help.ctx.settings-account.bullet.4':
    'Der Button Löschen ganz unten entfernt dein Konto, hinter einer Bestätigung. Der letzte Admin kann sich nicht selbst löschen.',
  // language-region
  'help.guide.language-region.title': 'Sprache, Einheiten und Währung festlegen',
  'help.guide.language-region.goal': 'Lass TREK deine Sprache sprechen und so rechnen wie du.',
  'help.guide.language-region.step.1':
    'Wähl die Sprache der Oberfläche unter Sprache & Region. TREK wechselt sofort, auf jedem Gerät, auf dem du dich anmeldest.',
  'help.guide.language-region.step.2':
    'Darunter wählst du das Zeitformat, den Tag, mit dem jeder Datumswähler die Woche beginnt, die Anzeigewährung sowie Entfernungs- und Temperatureinheit.',
  'help.guide.language-region.result':
    'Daten, Entfernungen und Geld lesen sich so, wie du es erwartest; die eigene Währung einer Reise steht weiterhin neben umgerechneten Beträgen.',
  'help.guide.language-region.tip.1':
    'Die Anzeigewährung ist für Summen über Reisen hinweg; jede Reise behält die Währung, die du ihr gegeben hast.',
  'help.guide.language-region.tip.2':
    'Die Sprache bestimmt auch die Tages- und Monatsnamen in Vacay und in der Journey.',
  // travel-map-prefs
  'help.guide.travel-map-prefs.title': 'Einstellen, wie sich Karte und Buchungen verhalten',
  'help.guide.travel-map-prefs.goal': 'Leg fest, was die Reisekarte standardmäßig zeigt.',
  'help.guide.travel-map-prefs.step.1':
    'Unter Reise & Karte hält Buchungsrouten immer anzeigen Flüge und Züge auf der Karte, auch wenn ihr Tag nicht geöffnet ist; Orte auf der Karte entdecken zeigt die Pille zum Finden von Orten; Route ab der Unterkunft optimieren startet die Route dort, wo du schläfst.',
  'help.guide.travel-map-prefs.step.2':
    'Buchungscodes verbergen versteckt Bestätigungsnummern, bis du darüberfährst; Orts-Labels auf Buchungsrouten schreibt den Namen der Buchung an ihre Route.',
  'help.guide.travel-map-prefs.result': 'Die Reisekarte folgt dem auf jeder Reise, bis du es wieder umlegst.',
  'help.guide.travel-map-prefs.tip.1':
    'Das gilt pro Konto, nicht pro Reise. Mitglieder einer geteilten Reise sehen jeweils ihre eigene Wahl.',
  // startup
  'help.guide.startup.title': 'Wählen, womit TREK öffnet',
  'help.guide.startup.goal': 'Lande dort, wo du am meisten arbeitest, nicht jedes Mal auf dem Dashboard.',
  'help.guide.startup.step.1': 'Setz unter Start die Startseite auf Dashboard oder Aktive Reise.',
  'help.guide.startup.step.2': 'Start-Tab bestimmt, welcher Tab einer Reise zuerst kommt, wenn du eine öffnest.',
  'help.guide.startup.result': 'Die nächste Anmeldung und der nächste Tipp auf das Logo führen direkt dorthin.',
  'help.guide.startup.tip.1': 'Aktive Reise meint die Reise, die heute läuft, oder die nächste, wenn keine läuft.',
  // theme-scheme
  'help.guide.theme-scheme.title': 'Theme und Akzentfarbe festlegen',
  'help.guide.theme-scheme.goal': 'Mach TREK hell, dunkel oder wie dein Gerät, in der Farbe, die dir gefällt.',
  'help.guide.theme-scheme.step.1': 'Wähl unter Theme Hell, Dunkel oder Automatisch. Automatisch folgt deinem Gerät.',
  'help.guide.theme-scheme.step.2':
    'Wähl ein Farbschema: Standard, Hoher Kontrast, Indigo, Türkis, Rosé, Bernstein, Violett oder Eigene.',
  'help.guide.theme-scheme.step.3':
    'Mit Eigene wählst du einen Akzent aus den Vorgaben oder gibst deinen eigenen ein. Eine Kontrastprüfung daneben sagt, ob Text darauf lesbar bleibt.',
  'help.guide.theme-scheme.result':
    'Buttons, Links und Hervorhebungen nehmen den Akzent überall an, auf jedem Gerät, auf dem du dich anmeldest.',
  'help.guide.theme-scheme.tip.1':
    'Die Navigationsleiste hat auch einen schnellen Hell-Dunkel-Schalter; er setzt dasselbe Theme.',
  'help.guide.theme-scheme.tip.2': 'Hoher Kontrast ist das Schema der Wahl, wenn der Standard zu weich wirkt.',
  // readability
  'help.guide.readability.title': 'Lesbarkeit und Textgröße anpassen',
  'help.guide.readability.goal': 'Weniger Glas, weniger Bewegung, mehr Platz oder größere Schrift.',
  'help.guide.readability.step.1':
    'Unter Lesbarkeit schaltet Transparenz die Glas-Panels auf feste Flächen, Bewegung reduzieren minimiert Animationen, und Dichte wählt Komfortabel oder Kompakt.',
  'help.guide.readability.step.2':
    'Textgröße skaliert Alles auf einmal; Erweiterte Textgrößen lässt Titel, Untertitel, Fließtext und Bildunterschriften voneinander abweichen.',
  'help.guide.readability.result': 'Die ganze App folgt sofort, inklusive der Karten-Panels und der Journey.',
  'help.guide.readability.tip.1':
    'Bewegung reduzieren folgt auch der Einstellung deines Systems, wenn du es in Ruhe lässt.',
  'help.guide.readability.tip.2':
    'Die Textgröße wird über die Typografie-Stufen angewendet, sodass nichts abgeschnitten wird; eine Größe, die nicht mehr passt, bricht um.',
  // dashboard-widgets
  'help.guide.dashboard-widgets.title': 'Die Dashboard-Widgets wählen',
  'help.guide.dashboard-widgets.goal':
    'Zeig nur die Widgets, die du nutzt, getrennt auf dem Desktop und auf dem Handy.',
  'help.guide.dashboard-widgets.step.1':
    'Schalte unter Dashboard-Widgets jedes Widget für Desktop und für Mobil an oder aus: die rechte Seitenleiste als Ganzes, Währung, Sammlungen, Zeitzonen, anstehende Reservierungen, Atlas-Länder und die Reisezahlen.',
  'help.guide.dashboard-widgets.step.2':
    'Auf Standard zurücksetzen unten bringt den ganzen Tab zurück in den Auslieferungszustand.',
  'help.guide.dashboard-widgets.result':
    'Das Dashboard ordnet sich sofort neu; ohne rechte Seitenleiste zentriert es sich.',
  'help.guide.dashboard-widgets.tip.1': 'Widgets eines Addons erscheinen nur, solange der Admin dieses Addon an hat.',
  'help.guide.dashboard-widgets.tip.2':
    'Das Dashboard selbst merkt sich deine Raster- oder Listenansicht und die Sortierung pro Gerät.',
  // map-provider
  'help.guide.map-provider.title': 'Karten-Engine und Stil wählen',
  'help.guide.map-provider.goal': 'Wechsle zwischen der klassischen Karte, Vektorkacheln und der 3D-Karte von Mapbox.',
  'help.guide.map-provider.step.1':
    'Wähl unter Kartenanbieter Leaflet für die klassische 2D-Karte mit beliebigen Rasterkacheln, MapLibre für OpenFreeMap-Vektorkacheln ohne Token oder Mapbox für Vektorkacheln mit 3D-Gebäuden und Gelände.',
  'help.guide.map-provider.step.2':
    'Wähl einen Kartenstil oder eine Karten-Vorlage für das Aussehen. Mapbox braucht einen Mapbox Access Token, manche Rasterstile einen CARTO-API-Key; der Link neben dem Feld führt dorthin, wo du einen bekommst.',
  'help.guide.map-provider.step.3':
    'Hochqualitäts-Modus ergänzt Antialiasing und die Globus-Projektion. Klick auf Karte speichern.',
  'help.guide.map-provider.result':
    'Jede Karte in TREK, Reisen, Atlas, Sammlungen und Journey, wird von der Engine gezeichnet, die du gewählt hast.',
  'help.guide.map-provider.tip.1': 'Ohne Token fällt Mapbox auf die Standardkarte zurück, statt nichts zu zeigen.',
  'help.guide.map-provider.tip.2':
    'Die Kartenkacheln, die du offline speicherst, kommen vom Anbieter, der beim Herunterladen aktiv ist.',
  // notification-channels
  'help.guide.notification-channels.title': 'Einrichten, wo dich Mitteilungen erreichen',
  'help.guide.notification-channels.goal':
    'Bekomm Reise-Erinnerungen und Ereignisse aus der Zusammenarbeit aufs Handy oder in ein anderes Tool.',
  'help.guide.notification-channels.step.1':
    'Trag unter Mitteilungen ein Ntfy-Thema ein; ergänze eine eigene Ntfy-Server-URL (optional) und einen Zugriffstoken (optional), wenn du einen Server betreibst. Testen schickt sofort eine Nachricht.',
  'help.guide.notification-channels.step.2':
    'Oder gib eine Webhook-URL an, die jedes Ereignis als JSON empfängt, und prüf sie mit Testen genauso.',
  'help.guide.notification-channels.step.3':
    'In den Zeilen darunter schaltest du jedes Ereignis pro Kanal an oder aus. Ein Plugin-Kanal sagt Einrichten, bis er in den Einstellungen des Plugins eingerichtet ist; Test senden probiert einen aus.',
  'help.guide.notification-channels.result':
    'Ereignisse gehen über die Kanäle raus, die an sind. Die Glocke in der Navigationsleiste zeigt sie in der App trotzdem weiter.',
  'help.guide.notification-channels.tip.1':
    'Einstellungen pro Reise liegen auf der Reise selbst, unter ihren Mitteilungseinstellungen.',
  'help.guide.notification-channels.tip.2':
    'Der Admin kann einen Standard-ntfy-Server für alle vorbelegen; dein Thema wählst du trotzdem selbst.',
  // photo-providers
  'help.guide.photo-providers.title': 'Eine Fotobibliothek verbinden',
  'help.guide.photo-providers.goal': 'Lass die Journey die Fotos des Tages aus Immich oder Synology Photos ziehen.',
  'help.guide.photo-providers.step.1':
    'Such unter Integrationen den Abschnitt des Anbieters und trag seine URL und seinen API-Key ein. Immich bietet auch an, Journey-Uploads zurück in die Bibliothek zu spiegeln.',
  'help.guide.photo-providers.step.2': 'Klick auf Verbindung testen, dann auf Speichern.',
  'help.guide.photo-providers.result':
    'Der Tab External photos im Eintrags-Editor durchsucht die verbundene Bibliothek nach dem Tag des Eintrags, die nächsten zum Ort des Eintrags zuerst.',
  'help.guide.photo-providers.tip.1':
    'Die Verbindung gehört dir: andere Mitglieder einer Journey verbinden ihre eigenen Bibliotheken.',
  'help.guide.photo-providers.tip.2':
    'Ein Anbieter ohne GPS-Daten in seinen Fotos funktioniert trotzdem; die Liste ist dann zeitlich sortiert.',
  // api-keys
  'help.guide.api-keys.title': 'Einen API-Schlüssel erstellen',
  'help.guide.api-keys.goal': 'Lass ein Skript oder ein anderes Tool die TREK-API als dich aufrufen.',
  'help.guide.api-keys.step.1':
    'Klick unter API-Schlüssel auf Schlüssel erstellen und gib ihm einen Namen, der sagt, wo er verwendet wird.',
  'help.guide.api-keys.step.2':
    'Kopier den Schlüssel aus dem Dialog: er wird nur einmal gezeigt. Lösch einen Schlüssel aus der Liste, wenn das Tool ihn nicht mehr braucht.',
  'help.guide.api-keys.result':
    'Anfragen mit diesem Schlüssel handeln mit deinen Berechtigungen; die Liste zeigt, wann jeder Schlüssel erstellt und zuletzt benutzt wurde.',
  'help.guide.api-keys.tip.1': 'Ein Schlüssel pro Tool macht das Zurückziehen schmerzlos.',
  'help.guide.api-keys.tip.2':
    'Für einen KI-Assistenten nimm stattdessen MCP mit OAuth; API-Schlüssel sind für einfache HTTP-Clients.',
  // mcp-oauth
  'help.guide.mcp-oauth.title': 'Einen KI-Assistenten über MCP verbinden',
  'help.guide.mcp-oauth.goal': 'Gib Claude, einer IDE oder einem anderen MCP-Client Zugriff auf deine Reisen.',
  'help.guide.mcp-oauth.step.1':
    'Kopier unter MCP-Konfiguration den MCP-Endpunkt, oder die ganze Client-Konfiguration für einen Client, der einen JSON-Schnipsel nimmt.',
  'help.guide.mcp-oauth.step.2':
    'Clients, die sich über den Browser anmelden, nutzen OAuth 2.1: Neuer Client unter OAuth 2.1-Clients, mit seinen Redirect-URIs, Erlaubte Berechtigungen und, für einen Server ohne Browser, Maschineller Client.',
  'help.guide.mcp-oauth.step.3':
    'Secret erneuern und Client löschen sitzen an jedem Client; Aktive OAuth-Sessions listet, was angemeldet ist, und lässt dich es widerrufen. API-Tokens mit Neuen Token erstellen ist der ältere Weg hinein.',
  'help.guide.mcp-oauth.result':
    'Der Client kann lesen und ändern, was seine Berechtigungen erlauben, als du, und jede Aktion erscheint unter deinem Namen.',
  'help.guide.mcp-oauth.tip.1':
    'Berechtigungen sind das Sicherheitsnetz: gib einem Client nur die Leseberechtigung, bis er mehr braucht.',
  'help.guide.mcp-oauth.tip.2':
    'Der Admin kann MCP für die ganze Instanz abschalten; dann ist dieser Abschnitt nicht da.',
  // offline-prepare
  'help.guide.offline-prepare.title': 'Reisen offline mitnehmen',
  'help.guide.offline-prepare.goal': 'Hab deine Reisen und ihre Karten auf diesem Gerät, bevor die Verbindung abreißt.',
  'help.guide.offline-prepare.step.1':
    'Lass unter Was offline gespeichert wird Kartenkacheln offline speichern an und schalte die Reisen an, die du auf diesem Gerät haben willst.',
  'help.guide.offline-prepare.step.2':
    'Klick unter Für Offline vorbereiten auf Für Offline-Nutzung herunterladen. Das holt die Reisen und die Kacheln rund um ihre Orte.',
  'help.guide.offline-prepare.step.3':
    'Offline-Modus erzwingen unter Offline-Modus lässt dich prüfen, ob alles da ist, bevor du losfährst.',
  'help.guide.offline-prepare.result':
    'Die Reisen öffnen ohne Verbindung; Änderungen, die du machst, warten in einer Warteschlange und gehen beim Wiederverbinden raus.',
  'help.guide.offline-prepare.tip.1':
    'Kacheln brauchen den meisten Platz: der Abschnitt Offline-Cache zeigt, was gespeichert ist, pro Reise.',
  'help.guide.offline-prepare.tip.2': 'Installier TREK aus dem Browser als App für den flüssigsten Offline-Start.',
  // offline-conflicts
  'help.guide.offline-conflicts.title': 'Entscheiden, was bei einem Synchronisierungskonflikt gewinnt',
  'help.guide.offline-conflicts.goal': 'Wähl, wie TREK eine offline gemachte Änderung gegen eine von anderswo auflöst.',
  'help.guide.offline-conflicts.step.1':
    'Wähl unter Synchronisierungskonflikte Jedes Mal nachfragen, Immer meine Version behalten oder Immer die Server-Version behalten.',
  'help.guide.offline-conflicts.step.2':
    'Offline-Cache zeigt Reisen, ausstehende und fehlgeschlagene Änderungen und Konflikte; Jetzt neu synchronisieren schiebt die Warteschlange raus, Cache leeren leert das Gerät.',
  'help.guide.offline-conflicts.result':
    'Mit Nachfragen zeigt ein Konflikt beide Versionen und lässt dich wählen; mit den anderen beiden wird er still aufgelöst.',
  'help.guide.offline-conflicts.tip.1':
    'Cache leeren entfernt nur die Kopie auf diesem Gerät; auf dem Server wird nichts angerührt.',
  // profile
  'help.guide.profile.title': 'Dein Profil ändern',
  'help.guide.profile.goal': 'Aktualisiere Name, E-Mail und Bild.',
  'help.guide.profile.step.1':
    'Bearbeite unter Konto Benutzername und E-Mail. Der Avatar nimmt einen eigenen Upload; entfern ihn, um zu den Initialen zurückzukehren.',
  'help.guide.profile.step.2': 'Klick auf Speichern.',
  'help.guide.profile.result': 'Name und Bild aktualisieren sich überall auf einmal, auch auf Reisen, die du teilst.',
  'help.guide.profile.tip.1':
    'Ein Konto, das sich über OIDC anmeldet, zeigt das hier; die E-Mail kommt dann vom Anbieter.',
  // password
  'help.guide.password.title': 'Dein Passwort ändern',
  'help.guide.password.goal': 'Setz ein neues Passwort.',
  'help.guide.password.step.1': 'Gib unter Passwort ändern dein aktuelles Passwort ein, dann zweimal das neue.',
  'help.guide.password.step.2': 'Klick auf Passwort aktualisieren.',
  'help.guide.password.result':
    'Das neue Passwort gilt ab der nächsten Anmeldung; andere Sitzungen bleiben angemeldet.',
  'help.guide.password.tip.1': 'Ein Konto, das sich über OIDC anmeldet, hat kein TREK-Passwort zum Ändern.',
  // mfa
  'help.guide.mfa.title': 'Zwei-Faktor-Authentifizierung einschalten',
  'help.guide.mfa.goal': 'Schütz das Konto mit einem Code aus einer Authenticator-App.',
  'help.guide.mfa.step.1': 'Klick unter Zwei-Faktor-Authentifizierung (2FA) auf Authenticator einrichten.',
  'help.guide.mfa.step.2':
    'Scann den QR-Code mit deiner App oder gib das Secret von Hand ein, dann tipp den sechsstelligen Code ein, den sie zeigt, und klick auf 2FA aktivieren.',
  'help.guide.mfa.step.3':
    'Sichere die Backup-Codes: kopieren, herunterladen oder drucken. Jeder gilt einmal, wenn du kein Handy zur Hand hast.',
  'help.guide.mfa.result': 'Jede Anmeldung fragt nach dem Passwort nach einem Code.',
  'help.guide.mfa.tip.1': '2FA deaktivieren braucht dein Passwort und einen aktuellen Code.',
  'help.guide.mfa.tip.2': 'Der Admin kann 2FA für alle vorschreiben; dann lässt es sich hier nicht abschalten.',
  // passkeys
  'help.guide.passkeys.title': 'Mit einem Passkey anmelden',
  'help.guide.passkeys.goal': 'Nutz Fingerabdruck, Gesicht oder PIN deines Geräts statt eines Passworts.',
  'help.guide.passkeys.step.1':
    'Klick unter Passkeys auf Passkey hinzufügen und bestätige mit deinem Gerät. Gib ihm einen Namen, der sagt, welches Gerät es ist.',
  'help.guide.passkeys.step.2':
    'Die Liste zeigt jeden Passkey mit Namen und letzter Nutzung; der Löschen-Button entfernt einen.',
  'help.guide.passkeys.result': 'Die Anmeldeseite bietet den Passkey an; das Passwort bleibt als Rückfall.',
  'help.guide.passkeys.tip.1':
    'Ein Passkey lebt auf dem Gerät oder in dessen Passwort-Manager, also leg einen pro Gerät an.',
  'help.guide.passkeys.tip.2':
    'Passkeys brauchen HTTPS; auf einer reinen HTTP-Instanz erklärt der Abschnitt, warum sie nicht verfügbar sind.',
  // delete-account
  'help.guide.delete-account.title': 'Dein Konto löschen',
  'help.guide.delete-account.goal': 'Entfern dein Konto und die Daten, die nur dir gehören.',
  'help.guide.delete-account.step.1': 'Klick ganz unten in Konto auf Löschen und bestätige.',
  'help.guide.delete-account.result':
    'Dein Konto, deine eigenen Reisen und deine Journeys sind weg; Reisen, die du mit anderen teilst, bleiben bei ihnen.',
  'help.guide.delete-account.tip.1':
    'Der letzte Admin einer Instanz kann sich nicht selbst löschen; mach vorher jemand anderen zum Admin.',
  'help.guide.delete-account.tip.2': 'Es gibt kein Zurück. Exportier, was du behalten willst, bevor du bestätigst.',

  // ── Screen: admin (all tabs) ──────────────────────────────────────────────────────────
  'help.ctx.admin.title': 'Administration',
  'help.ctx.admin.summary':
    'Die Instanz hinter dem TREK aller: wer sich wie anmelden darf, was eingeschaltet ist, wo Dateien liegen, wie der Server die Leute erreicht und wie er gesichert wird. Nur Admins sehen diese Seite; jeder Tab ist eine eigene Ansicht in der Seitenleiste.',
  'help.ctx.admin.bullet.1':
    'Die vier Karten oben zählen Benutzer, Reisen, Orte und Dateien; ein Banner darüber kündigt ein neueres TREK-Release an.',
  'help.ctx.admin.bullet.2':
    'Benutzer und Benutzer-Standards: Konten, Einladungslinks und die Karteneinstellungen, mit denen ein neues Konto startet.',
  'help.ctx.admin.bullet.3':
    'Personalisierung, Einstellungen, Addons und Plugins: Packvorlagen, Kategorien und Schulferien; Anmeldemethoden und API-Schlüssel; die Funktionsmodule; Plugins von Dritten.',
  'help.ctx.admin.bullet.4':
    'Speicher, Benachrichtigungen, MCP-Zugang und GitHub: wohin Uploads gehen, die instanzweiten Kanäle, Tokens und Sitzungen von KI-Clients und der Release-Verlauf.',
  'help.ctx.admin.bullet.5':
    'Backup und Audit: Sicherungen auf Abruf und nach Zeitplan, und das Protokoll sicherheitsrelevanter Ereignisse.',
  'help.ctx.admin-users.title': 'Benutzer',
  'help.ctx.admin-users.summary':
    'Jedes Konto auf diesem TREK, mit Rolle, E-Mail und letzter Anmeldung, und die Einladungslinks, über die sich Leute auf einer geschlossenen Instanz registrieren können.',
  'help.ctx.admin-users.bullet.1':
    'Die Tabelle: Benutzername, E-Mail, Rolle, Erstellungsdatum, letzter Login und die Aktionen pro Zeile. Du selbst bist als du markiert.',
  'help.ctx.admin-users.bullet.2':
    'Benutzer anlegen oben legt ein Konto von Hand an, mit einem Passwort, das du weitergibst.',
  'help.ctx.admin-users.bullet.3':
    'Einladungslinks darunter: einmalige Registrierungslinks mit Nutzungslimit, Ablauf und, wenn du magst, einer Reise, der der neue Benutzer bei Ankunft beitritt.',
  'help.ctx.admin-users.bullet.4':
    'Berechtigungseinstellungen ganz unten: pro Aktion, wer sie ausführen darf, Alle, Reise-Mitglieder, Reise-Eigentümer oder Nur Administrator.',
  'help.ctx.admin-defaults.title': 'Benutzer-Standards',
  'help.ctx.admin-defaults.summary':
    'Die Einstellungen, mit denen ein neues Konto startet, damit niemand erst den Karten-Tab suchen muss: Kartendienst, Stil, Tokens und Qualität.',
  'help.ctx.admin-defaults.bullet.1':
    'Kartendienst, Mapbox-Stil und -Token, CARTO-Key und Mapbox-Qualität, genau so, wie ein Benutzer sie unter Einstellungen, Karte setzen würde.',
  'help.ctx.admin-defaults.bullet.2':
    'Neben jedem Feld holt zurücksetzen die eingebaute Vorgabe von TREK zurück; die eigene Einstellung eines Benutzers gewinnt immer gegen diese.',
  'help.ctx.admin-config.title': 'Personalisierung',
  'help.ctx.admin-config.summary':
    'Was jede Reise auf der Instanz teilt: Packvorlagen, der Kategoriensatz für Orte und Sammlungen und der Schulferienkatalog, aus dem Vacay schöpft.',
  'help.ctx.admin-config.bullet.1':
    'Packvorlagen: benannte Listen aus Kategorien und Einträgen, mit denen die Packliste einer Reise starten kann.',
  'help.ctx.admin-config.bullet.2':
    'Kategorien: Name, Icon und Farbe der Kategorien, die überall in TREK gelten, vom Orts-Inspektor bis zu den Sammlungen.',
  'help.ctx.admin-config.bullet.3':
    'Schulferien: der Katalog der Länder und Regionen, für Orte, die die eingebauten Feeds nicht abdecken.',
  'help.ctx.admin-settings.title': 'Einstellungen',
  'help.ctx.admin-settings.summary':
    'Wie Leute reinkommen und womit der Server reden darf: Anmelde- und Registrierungsmethoden, SSO, Passkeys, die Zwei-Faktor-Regel, die API-Schlüssel für Karten, Orte und Bilder, die Such- und Verkehrsanbieter und die Dateitypen, die Uploads haben dürfen.',
  'help.ctx.admin-settings.bullet.1':
    'Authentication Methods: Password Login, Password Registration, SSO Login, SSO Auto-Provisioning und Zwei-Faktor-Authentifizierung (2FA) für alle verlangen.',
  'help.ctx.admin-settings.bullet.2':
    'Single Sign-On (OIDC) mit Issuer, Client und Anzeigename; Passkey-Anmeldung mit Relying Party ID und Origins.',
  'help.ctx.admin-settings.bullet.3':
    'API-Schlüssel: Google Maps, Unsplash und Amap, jeder mit Test; Wofür der Schlüssel genutzt wird grenzt den Google-Schlüssel auf die Funktionen ein, für die du zahlen willst.',
  'help.ctx.admin-settings.bullet.4':
    'Anbieter für die Ortssuche und Verkehrsanbieter legen fest, wer Suchen und Routen beantwortet; Erlaubte Dateitypen begrenzt Uploads.',
  'help.ctx.admin-addons.title': 'Addons',
  'help.ctx.admin-addons.summary':
    'Die Funktionsmodule von TREK, jedes mit einem Schalter: Listen, Kosten, Dokumente, Vacay, Atlas, Collab, Journey, Sammlungen, Roadtrip, MCP, AirTrail, Dawarich und das KI-Parsing. Aus heißt: Navigationseintrag, Routen und API sind für alle weg.',
  'help.ctx.admin-addons.bullet.1':
    'Eine Kachel pro Addon mit seinem Schalter und, wo es welche hat, Unterzeilen für seine Optionen.',
  'help.ctx.admin-addons.bullet.2':
    'Foto-Anbieter und Dokument-Anbieter erscheinen hier ebenfalls als Kacheln, damit Immich oder Synology den Benutzern angeboten werden kann.',
  'help.ctx.admin-addons.bullet.3': 'Gepäck-Tracking hat seinen eigenen Schalter unter den Kacheln.',
  'help.ctx.admin-plugins.title': 'Plugins',
  'help.ctx.admin-plugins.summary':
    'Plugins von Dritten, die in einem eigenen Prozess neben TREK laufen, jedes mit den Berechtigungen, die es bei der Installation angefragt hat. Installiere aus dem Katalog, lade ein Paket hoch oder verknüpfe einen Ordner, während du eines entwickelst.',
  'help.ctx.admin-plugins.bullet.1':
    'Die Liste: jedes installierte Plugin mit Version, Status, Signatur und seinen Berechtigungen; pro Zeile aktivieren, deaktivieren, aktualisieren oder deinstallieren.',
  'help.ctx.admin-plugins.bullet.2':
    'Plugin hochladen nimmt eine Paketdatei; Neu scannen findet einen Plugin-Ordner, der zur Entwicklung verknüpft ist.',
  'help.ctx.admin-plugins.bullet.3':
    'Erlaubte Hosts pro Plugin: die Adressen, die ein Plugin aufrufen darf, denn ausgehende Verbindungen sind standardmäßig gesperrt.',
  'help.ctx.admin-storage.title': 'Speicher',
  'help.ctx.admin-storage.summary':
    'Wo Uploads liegen: auf der lokalen Platte, in einem S3-Bucket oder in einem Spiegel, der in beide schreibt. Jede Upload-Kategorie kann auf ein anderes Backend gehen, und Zustand sagt, ob jedes Backend antwortet.',
  'help.ctx.admin-storage.bullet.1':
    'Backends: Name und Typ von jedem, mit Testen, Bearbeiten und Entfernen; eines, das über die Umgebung gesetzt ist, ist hier schreibgeschützt.',
  'help.ctx.admin-storage.bullet.2':
    'Kategorien: Cover, Dokumente, Journey-Fotos und der Rest, jede einem Backend zugewiesen; eine zu ändern bietet an, die vorhandenen Dateien zu verschieben.',
  'help.ctx.admin-storage.bullet.3':
    'Zustand: eine Prüfung pro Backend und die Seed-Datei, die belegt, dass die Konfiguration die ist, die der Server sieht.',
  'help.ctx.admin-notifications.title': 'Benachrichtigungen',
  'help.ctx.admin-notifications.summary':
    'Die Kanäle, die die Instanz ihren Benutzern anbietet, und die, die dich als Admin erreichen. Benutzer wählen ihre eigenen Themen und URLs unter Einstellungen; du entscheidest, was es gibt, und richtest E-Mail ein.',
  'help.ctx.admin-notifications.bullet.1':
    'In-App, Email (SMTP), Ntfy, Webhook und Web Push: je ein Panel, mit einem Schalter, der den Kanal den Benutzern anbietet, und der serverseitigen Konfiguration, die er braucht.',
  'help.ctx.admin-notifications.bullet.2': 'Reiseerinnerungen: ob der Server die Erinnerung vor Reisebeginn schickt.',
  'help.ctx.admin-notifications.bullet.3':
    'Admin-Ntfy und Admin-Webhook: wohin Admin-Ereignisse wie ein fehlgeschlagenes Backup oder ein neues Release gehen, mit Test.',
  'help.ctx.admin-mcp-tokens.title': 'MCP-Zugang',
  'help.ctx.admin-mcp-tokens.summary':
    'Jedes Token und jede OAuth-Sitzung, die KI-Clients gegenüber diesem TREK halten, über alle Benutzer hinweg, mit der Möglichkeit, jede davon zu widerrufen.',
  'help.ctx.admin-mcp-tokens.bullet.1': 'API-Tokens: wer es erstellt hat, wann es zuletzt benutzt wurde, und Löschen.',
  'help.ctx.admin-mcp-tokens.bullet.2':
    'OAuth-Sitzungen: der Client, der Benutzer und die gewährten Scopes, und Widerrufen.',
  'help.ctx.admin-github.title': 'GitHub',
  'help.ctx.admin-github.summary':
    'Was neu ist in TREK: der Release-Verlauf von GitHub, die Version, die du betreibst, und ob eine neuere draußen ist. Das Update selbst passiert außerhalb der App, auf dem Host.',
  'help.ctx.admin-github.bullet.1':
    'Update-Verlauf listet die Releases mit ihren Notizen; das neueste trägt Aktuell, und deine Version ist markiert.',
  'help.ctx.admin-github.bullet.2':
    'Update verfügbar erscheint im Kopfbereich, sobald ein neueres Release existiert, mit einer Anleitung fürs Update bei Docker und anderen Installationen.',
  'help.ctx.admin-backup.title': 'Backup',
  'help.ctx.admin-backup.summary':
    'Vollständige Sicherungen der Datenbank und der Uploads, von Hand oder nach Zeitplan, auf dem Server aufbewahrt und als eine Datei herunterladbar. Wiederherstellen spielt eine zurück.',
  'help.ctx.admin-backup.bullet.1':
    'Datensicherung: Backup erstellen und die Liste der vorhandenen mit Herunterladen, Wiederherstellen und Löschen.',
  'help.ctx.admin-backup.bullet.2':
    'Backup hochladen bringt eine Datei von einer anderen Instanz oder einem früheren Tag herein.',
  'help.ctx.admin-backup.bullet.3':
    'Auto-Backup: an oder aus, Intervall, Stunde und Tag, und wie viele aufbewahrt werden.',
  'help.ctx.admin-audit.title': 'Audit',
  'help.ctx.admin-audit.summary':
    'Das Protokoll sicherheitsrelevanter und administrativer Ereignisse: Anmeldungen und Fehlversuche, MFA-Änderungen, Benutzer- und Einstellungsänderungen, Backups und Wiederherstellungen. Nur lesbar, Neuestes zuerst.',
  'help.ctx.admin-audit.bullet.1': 'Eine Zeile pro Ereignis mit Zeit, Benutzer, Aktion, Ressource, IP und Details.',
  'help.ctx.admin-audit.bullet.2': 'Aktualisieren lädt neu; Mehr laden geht weiter zurück.',
  // create-user
  'help.guide.create-user.title': 'Einen Benutzer anlegen',
  'help.guide.create-user.goal': 'Leg ein Konto von Hand an, ohne Einladung.',
  'help.guide.create-user.step.1': 'Klick oben im Tab Benutzer auf Benutzer anlegen.',
  'help.guide.create-user.step.2':
    'Gib Benutzername, E-Mail und ein Passwort ein und wähl die Rolle: Benutzer oder Administrator.',
  'help.guide.create-user.step.3': 'Klick auf Benutzer anlegen.',
  'help.guide.create-user.result':
    'Das Konto erscheint in der Tabelle und kann sich sofort anmelden; gib das Passwort über einen Kanal weiter, dem du vertraust.',
  'help.guide.create-user.tip.1':
    'Für jemanden, der sein Passwort selbst wählen soll, ist ein Einladungslink der bessere Weg hinein.',
  'help.guide.create-user.tip.2':
    'Admins sehen diese Seite und das Audit-Protokoll; alles andere ist für beide Rollen gleich.',
  // edit-user
  'help.guide.edit-user.title': 'Rolle oder Passwort eines Benutzers ändern',
  'help.guide.edit-user.goal':
    'Befördere jemanden, stuf ihn zurück oder hol ihn nach einem verlorenen Passwort wieder rein.',
  'help.guide.edit-user.step.1':
    'Klick auf den Stift in der Zeile des Benutzers. Benutzer bearbeiten öffnet sich mit den Details des Kontos.',
  'help.guide.edit-user.step.2':
    'Ändere die Rolle, setz ein Neues Passwort oder klick auf Passkeys zurücksetzen, wenn die Person das Gerät mit ihren Passkeys verloren hat, dann Speichern.',
  'help.guide.edit-user.result':
    'Die Änderung greift bei der nächsten Anfrage; ein neues Passwort gilt ab der nächsten Anmeldung.',
  'help.guide.edit-user.tip.1': 'Du kannst dir die Admin-Rolle nicht selbst nehmen, solange du der letzte Admin bist.',
  'help.guide.edit-user.tip.2':
    'Passkeys zurücksetzen behält das Passwort; die Person fügt neue Passkeys unter Einstellungen, Konto hinzu.',
  // invite-links
  'help.guide.invite-links.title': 'Jemanden per Link einladen',
  'help.guide.invite-links.goal':
    'Lass eine Person sich auf einer geschlossenen Instanz registrieren und, wenn du magst, direkt in einer Reise landen.',
  'help.guide.invite-links.step.1': 'Klick unter Einladungslinks auf Link erstellen.',
  'help.guide.invite-links.step.2':
    'Setz Max. Nutzungen und Gültig für, optional Zu Trip hinzufügen (optional), und klick auf Erstellen & kopieren.',
  'help.guide.invite-links.step.3':
    'Schick den Link. Jede Zeile zeigt, wie oft er genutzt wurde und wer ihn erstellt hat; Link kopieren kopiert ihn erneut, und aufgebrauchte oder abgelaufene Links sind markiert.',
  'help.guide.invite-links.result':
    'Wer den Link öffnet, registriert sich mit eigenem Passwort und tritt, wenn eine Reise gewählt ist, ihr sofort bei.',
  'help.guide.invite-links.tip.1':
    'Einladungslinks funktionieren auch, wenn Password Registration unter Einstellungen ausgeschaltet ist.',
  'help.guide.invite-links.tip.2':
    'Ein Link mit einer Nutzung und kurzer Gültigkeit ist der sicherste Standard für eine einzelne Person.',
  // delete-user
  'help.guide.delete-user.title': 'Einen Benutzer löschen',
  'help.guide.delete-user.goal': 'Entfern ein Konto und alles, was nur ihm gehört.',
  'help.guide.delete-user.step.1':
    'Klick auf das Papierkorb-Symbol in der Zeile des Benutzers und bestätige Benutzer löschen.',
  'help.guide.delete-user.result':
    'Das Konto, seine eigenen Reisen und seine Journeys sind weg; mit anderen geteilte Reisen bleiben bei den übrigen Mitgliedern.',
  'help.guide.delete-user.tip.1': 'Es gibt kein Zurück. Mach vorher ein Backup, wenn du nicht sicher bist.',
  'help.guide.delete-user.tip.2': 'Der letzte Admin lässt sich nicht löschen; mach vorher jemand anderen zum Admin.',
  // permissions
  'help.guide.permissions.title': 'Festlegen, wer was darf',
  'help.guide.permissions.goal': 'Leg pro Aktion fest, welche Rolle sie auf diesem TREK ausführen darf.',
  'help.guide.permissions.step.1':
    'Such unter Berechtigungseinstellungen die Aktion in ihrer Gruppe, etwa Reisen löschen unter Reiseverwaltung, und wähl die Stufe: Alle, Reise-Mitglieder, Reise-Eigentümer oder Nur Administrator. Eine geänderte Zeile ist als angepasst markiert.',
  'help.guide.permissions.step.2':
    'Klick auf Speichern. Auf Standard zurücksetzen bringt jede Zeile zurück auf die eingebaute Stufe.',
  'help.guide.permissions.result':
    'Die Regel gilt sofort für alle Reisen; die Buttons und Menüs der Leute unterhalb der Stufe verschwinden.',
  'help.guide.permissions.tip.1':
    'Reise-Eigentümer meint die Person, die die Reise angelegt hat; Admins dürfen immer alles.',
  'help.guide.permissions.tip.2':
    'Senk lieber eine Stufe, statt ein Mitglied zu löschen: Wer nicht bearbeiten darf, kann trotzdem lesen und kommentieren.',
  // default-map
  'help.guide.default-map.title': 'Die Karten-Standards für neue Benutzer setzen',
  'help.guide.default-map.goal': 'Gib jedem neuen Konto eine funktionierende Karte ohne eigenes Token.',
  'help.guide.default-map.step.1':
    'Wähl unter Karte den Kartendienst und, für Mapbox oder MapLibre, Kartenstil, Gemeinsames Mapbox-Token und Hochqualitätsmodus; für eine Rasterkarte Karten-Vorlage und Gemeinsamer CARTO-Key.',
  'help.guide.default-map.step.2':
    'Neben jedem Feld, das du geändert hast, holt zurücksetzen die eingebaute Vorgabe von TREK zurück. Standard-Benutzereinstellungen links tut dasselbe für Farbmodus, Einheiten und die Währung.',
  'help.guide.default-map.result':
    'Neue Konten starten damit; wer unter Einstellungen eine eigene Karte gesetzt hat, behält seine.',
  'help.guide.default-map.tip.1':
    'Ein hier eingetragenes Token teilen sich alle, die kein eigenes haben, also behalte sein Kontingent im Blick.',
  'help.guide.default-map.tip.2':
    'Bestehende Konten, die den Karten-Tab nie angefasst haben, folgen diesen Standards ebenfalls.',
  // packing-templates
  'help.guide.packing-templates.title': 'Eine Packvorlage bauen',
  'help.guide.packing-templates.goal': 'Gib Reisen eine Packliste zum Starten statt einer leeren.',
  'help.guide.packing-templates.step.1': 'Klick auf Neue Vorlage, tipp einen Namen ein und bestätige mit dem Haken.',
  'help.guide.packing-templates.step.2':
    'Öffne die Vorlage und klick auf Kategorie hinzufügen; unter jeder Kategorie fügt das + Einträge hinzu, und ein Eintrag braucht nur einen Namen.',
  'help.guide.packing-templates.step.3':
    'Alles speichert sich laufend. Der Stift benennt eine Vorlage, eine Kategorie oder einen Eintrag um, der Papierkorb löscht sie.',
  'help.guide.packing-templates.result':
    'Die Vorlage wird auf der Packliste jeder Reise angeboten; sie anzuwenden kopiert die Einträge, also kann eine Reise sie frei ändern.',
  'help.guide.packing-templates.tip.1':
    'Eine Vorlage pro Reiseart, Strand, Stadt, Wandern, schlägt eine riesige Liste.',
  'help.guide.packing-templates.tip.2':
    'Eine Vorlage zu löschen rührt Reisen nicht an, die sie schon angewendet haben.',
  // categories
  'help.guide.categories.title': 'Den Kategoriensatz verwalten',
  'help.guide.categories.goal': 'Leg fest, welche Kategorien Orte und Sammlungen tragen können und wie sie aussehen.',
  'help.guide.categories.step.1':
    'Klick auf Neue Kategorie, gib ihr einen Namen, wähl ein Icon und eine Farbe; die Vorschau zeigt das Ergebnis. Klick auf Erstellen.',
  'help.guide.categories.step.2':
    'Fahr über eine Kategorie in der Liste, um sie zu bearbeiten oder zu löschen. Löschen fragt nach Bestätigung.',
  'help.guide.categories.result':
    'Der Satz gilt überall auf einmal: im Orts-Inspektor, auf den Karten-Pins, in den Sammlungen und in den Filtern.',
  'help.guide.categories.tip.1':
    'Orte behalten ihre Kategorie-ID, also benennt das Umbenennen einer Kategorie sie auf jedem Ort um.',
  'help.guide.categories.tip.2':
    'Eine gelöschte Kategorie lässt ihre Orte ohne eine zurück; weise sie vorher neu zu, wenn das wichtig ist.',
  // school-holiday-catalog
  'help.guide.school-holiday-catalog.title': 'Schulferien von Hand pflegen',
  'help.guide.school-holiday-catalog.goal':
    'Deck ein Land oder eine Region ab, die die eingebauten Ferien-Feeds nicht kennen.',
  'help.guide.school-holiday-catalog.step.1':
    'Klick unter Schulferien auf Land hinzufügen, gib Land und Ländercode (z. B. US) ein und Speichern; dann Region hinzufügen für jeden Teil davon, der abweicht.',
  'help.guide.school-holiday-catalog.step.2':
    'Klick auf eine Region, um Region oder Schulbezirk zu öffnen: Ferienzeitraum hinzufügen, gib jedem Name der Ferien, Startdatum und Enddatum und Speichern. Der Papierkorb entfernt einen Zeitraum, eine Region oder, sobald es keine Regionen mehr hat, ein Land.',
  'help.guide.school-holiday-catalog.result':
    'Benutzer finden Land und Region unter Einstellungen in Vacay und sehen die Zeiträume auf ihrem Jahresraster.',
  'help.guide.school-holiday-catalog.tip.1':
    'Regionen aus den eingebauten Feeds lassen sich hier nicht bearbeiten; leg daneben eine manuelle Region an, wenn ein Datum falsch ist.',
  // auth-methods
  'help.guide.auth-methods.title': 'Festlegen, wie sich Leute anmelden',
  'help.guide.auth-methods.goal': 'Öffne oder schließe Passwort-Anmeldung, SSO und Registrierung und verlange 2FA.',
  'help.guide.auth-methods.step.1':
    'Schalte unter Authentication Methods Password Login und Password Registration an oder aus. Registrierung aus heißt: neue Konten nur über Einladungslinks, SSO oder von Hand.',
  'help.guide.auth-methods.step.2':
    'SSO Login und SSO Auto-Provisioning brauchen ein unten konfiguriertes Single Sign-On (OIDC); Auto-Provisioning legt ein Konto an, wenn sich jemand zum ersten Mal über SSO anmeldet.',
  'help.guide.auth-methods.step.3':
    'Zwei-Faktor-Authentifizierung (2FA) für alle verlangen lässt jede Passwort-Anmeldung beim nächsten Login einen Authenticator einrichten. Passkey-Anmeldung braucht die Relying Party ID und die Origins, unter denen dein TREK erreichbar ist.',
  'help.guide.auth-methods.result': 'Die Anmeldeseite bietet genau die Methoden an, die du angelassen hast.',
  'help.guide.auth-methods.tip.1':
    'Eine Warnung erscheint, bevor du dich aussperrst: mindestens ein Weg hinein bleibt für Admins an.',
  'help.guide.auth-methods.tip.2': 'Werte, die über Umgebungsvariablen gesetzt sind, erscheinen hier schreibgeschützt.',
  // oidc
  'help.guide.oidc.title': 'Single Sign-On anbinden',
  'help.guide.oidc.goal': 'Lass Leute sich mit deinem Identitätsanbieter anmelden.',
  'help.guide.oidc.step.1':
    'Gib unter Single Sign-On (OIDC) den Anzeigename für den Button sowie Issuer URL, Client ID und Client Secret von deinem Anbieter ein, dann Speichern.',
  'help.guide.oidc.step.2': 'Schalte SSO Login unter Authentication Methods an.',
  'help.guide.oidc.result':
    'Die Anmeldeseite zeigt den SSO-Button; mit eingeschaltetem SSO Auto-Provisioning bekommen Erstnutzer automatisch ein Konto.',
  'help.guide.oidc.tip.1':
    'Die Redirect-URI, die dein Anbieter braucht, ist die Adresse deines TREK plus der OIDC-Callback-Pfad aus der Doku.',
  'help.guide.oidc.tip.2':
    'Das Claim-Mapping entscheidet, welche SSO-Gruppen Admins werden; siehe die OIDC-Seite in der Doku.',
  // instance-keys
  'help.guide.instance-keys.title': 'Die API-Schlüssel eintragen',
  'help.guide.instance-keys.goal': 'Schalte Google-Ortssuche, Unsplash-Cover und Amap für die ganze Instanz frei.',
  'help.guide.instance-keys.step.1':
    'Füg unter API-Schlüssel den Google Maps API-Schlüssel ein und klick auf Test; das Feld sagt, ob der Schlüssel antwortet.',
  'help.guide.instance-keys.step.2':
    'Schalte unter Wofür der Schlüssel genutzt wird nur die Funktionen an, die über diesen Schlüssel abgerechnet werden sollen: Autovervollständigung, Details, Fotos, Anreicherung, das Suchprotokoll.',
  'help.guide.instance-keys.step.3':
    'Unsplash-API-Schlüssel treibt die Cover-Suche an; Amap (高德地图) API-Key die Ortssuche in China. Teste jeden genauso.',
  'help.guide.instance-keys.result':
    'Benutzer bekommen die Funktionen ohne eigene Schlüssel; ohne Google-Schlüssel sucht TREK über den freien OpenStreetMap-Stack und die TREK Places API.',
  'help.guide.instance-keys.tip.1':
    'Der persönliche Schlüssel eines Benutzers unter Einstellungen gewinnt für diesen Benutzer gegen den Instanz-Schlüssel.',
  'help.guide.instance-keys.tip.2':
    'Schlüssel können auch aus Umgebungsvariablen kommen; die erscheinen hier schreibgeschützt.',
  // places-transit
  'help.guide.places-transit.title': 'Such- und Verkehrsanbieter wählen',
  'help.guide.places-transit.goal': 'Leg fest, wer Ortssuchen und ÖPNV-Routen beantwortet.',
  'help.guide.places-transit.step.1':
    'Wähl unter Anbieter für die Ortssuche Automatisch, Google Places, Amap (高德地图) oder OpenStreetMap. Automatisch nimmt den besten Schlüssel, der da ist.',
  'help.guide.places-transit.step.2':
    'Wähl unter Verkehrsanbieter Transitous (kostenlos), weltweit und ohne Schlüssel, oder Google, das den Google-Schlüssel braucht.',
  'help.guide.places-transit.result': 'Jedes Suchfeld und jede ÖPNV-Route in TREK folgt der Wahl.',
  'help.guide.places-transit.tip.1':
    'Ein Anbieter ohne seinen Schlüssel zeigt hier eine Warnung und fällt auf OpenStreetMap zurück.',
  'help.guide.places-transit.tip.2': 'Google-Verkehrsrouten werden pro Anfrage abgerechnet; Transitous nicht.',
  // file-types
  'help.guide.file-types.title': 'Die Dateitypen begrenzen',
  'help.guide.file-types.goal': 'Leg fest, welche Dateiendungen Uploads haben dürfen.',
  'help.guide.file-types.step.1':
    'Bearbeite unter Erlaubte Dateitypen die kommagetrennte Liste der Endungen und speichere.',
  'help.guide.file-types.result':
    'Uploads jedes anderen Typs werden mit einer klaren Meldung abgelehnt, in den Dokumenten, im Journal und bei den Covern.',
  'help.guide.file-types.tip.1':
    'Behalte Bildtypen in der Liste; Cover und Journey-Fotos gehen durch dieselbe Prüfung.',
  // toggle-addon
  'help.guide.toggle-addon.title': 'Ein Addon an- oder ausschalten',
  'help.guide.toggle-addon.goal': 'Biete allen ein Funktionsmodul an, oder nimm es weg.',
  'help.guide.toggle-addon.step.1':
    'Leg den Schalter auf der Kachel des Addons um. Der Navigationseintrag erscheint oder verschwindet für alle auf einmal.',
  'help.guide.toggle-addon.step.2':
    'Manche Kacheln tragen Unterzeilen für ihre Optionen, etwa Gepäck-Tracking unter Listen oder die Foto-Anbieter unter Journey; sie erscheinen nur, solange das Addon an ist.',
  'help.guide.toggle-addon.result':
    'Daten eines ausgeschalteten Addons bleiben erhalten; wieder einschalten zeigt sie erneut.',
  'help.guide.toggle-addon.tip.1':
    'MCP aus entfernt den Endpunkt und die Integrationen-Abschnitte, die davon abhängen.',
  'help.guide.toggle-addon.tip.2':
    'Vacay, Atlas und Journey sind die Addons, nach denen Benutzer am meisten fragen; Dokumente braucht Speicher für Uploads.',
  // install-plugin
  'help.guide.install-plugin.title': 'Ein Plugin installieren',
  'help.guide.install-plugin.goal':
    'Füg ein Plugin von Dritten hinzu und gib ihm genau die Berechtigungen, die es verlangt.',
  'help.guide.install-plugin.step.1':
    'Öffne Entdecken, wähl ein Plugin und klick auf Installieren; oder klick auf Plugin hochladen und wähl ein .zip- oder .tar.gz-Paket.',
  'help.guide.install-plugin.step.2':
    'Zurück unter Installiert lies die Zeile: was das Plugin lesen oder schreiben darf, welche Hosts es aufruft und ob es signiert ist. Schalte Plugin aktivieren an.',
  'help.guide.install-plugin.step.3':
    'Das Menü der Zeile bietet Neu starten, Fehlerprotokoll ansehen, Erlaubte Hosts und Version wechseln…; Löschen deinstalliert es. Ein Update wird in der Zeile angeboten, sobald eine neuere Version existiert, und eines, das neue Rechte verlangt, bleibt aus, bis du sie genehmigst.',
  'help.guide.install-plugin.result':
    'Das Plugin läuft in seinem eigenen Prozess; was es hinzufügt, Widgets, Kartenebenen, Tools, erscheint dort, wo das Plugin es deklariert.',
  'help.guide.install-plugin.tip.1': 'Neu scannen findet einen zur Entwicklung verknüpften Plugin-Ordner ohne Paket.',
  'help.guide.install-plugin.tip.2':
    'Ein unsigniertes Plugin ist als solches markiert; installiere es nur, wenn du seiner Quelle vertraust.',
  // storage-backends
  'help.guide.storage-backends.title': 'Uploads auf S3 oder einen Spiegel verlegen',
  'help.guide.storage-backends.goal': 'Halte Dateien auf Objektspeicher, oder auf Platte und Bucket zugleich.',
  'help.guide.storage-backends.step.1':
    'Klick unter Backends auf Backend hinzufügen, füll Name aus, wähl den Typ, Lokal, S3 oder Spiegel, füll die übrigen Felder aus und klick auf Übernehmen. Testen prüft die Verbindung, Änderungen speichern schreibt sie.',
  'help.guide.storage-backends.step.2':
    'Weis unter Kategorien jede Upload-Kategorie einem Backend zu. Eine zu ändern fragt, ob Vorhandene Objekte verschieben oder Nur neue Schreibvorgänge umleiten.',
  'help.guide.storage-backends.step.3':
    'Zustand oben prüft jedes Backend; ein roter Eintrag nennt, was fehlgeschlagen ist.',
  'help.guide.storage-backends.result':
    'Neue Uploads gehen auf das zugewiesene Backend; verschobene Dateien werden von dort ausgeliefert.',
  'help.guide.storage-backends.tip.1':
    'Ein über Umgebungsvariablen konfiguriertes Backend wird angezeigt, lässt sich hier aber nicht bearbeiten.',
  'help.guide.storage-backends.tip.2':
    'Ein Spiegel schreibt in beide Ziele und liest vom ersten; nutz ihn, um ohne Ausfallzeit zu migrieren.',
  // channels-instance
  'help.guide.channels-instance.title': 'Die Benachrichtigungskanäle einrichten',
  'help.guide.channels-instance.goal': 'Leg fest, welche Kanäle Benutzer wählen dürfen, und richte E-Mail ein.',
  'help.guide.channels-instance.step.1':
    'Trag unter Email (SMTP) SMTP Host, SMTP Port, SMTP User, SMTP Password und die From Address ein; Test-E-Mail senden schickt eine Mail an dich.',
  'help.guide.channels-instance.step.2':
    'Schalte Web Push, Ntfy und Webhook an, um sie anzubieten; Benutzer schalten dann unter Einstellungen, Mitteilungen Push pro Gerät ein oder tragen ihr eigenes Thema oder ihre URL ein.',
  'help.guide.channels-instance.step.3':
    'Reiseerinnerungen schaltet die Erinnerung vor Reisebeginn; In-App ist immer an und wird hier nur erklärt.',
  'help.guide.channels-instance.result':
    'Der Tab Mitteilungen jedes Benutzers zeigt die Kanäle, die du angeschaltet hast.',
  'help.guide.channels-instance.tip.1':
    'Ein hier eingetragener Standard-ntfy-Server ist für Benutzer vorbelegt; sie können trotzdem ihren eigenen nennen.',
  'help.guide.channels-instance.tip.2':
    'Plugin-Kanäle erscheinen von selbst, sobald ein Plugin mit dieser Fähigkeit aktiv ist.',
  // admin-channels
  'help.guide.admin-channels.title': 'Admin-Ereignisse aufs Handy bekommen',
  'help.guide.admin-channels.goal':
    'Erfahre von fehlgeschlagenen Backups, neuen Releases und anderen Instanz-Ereignissen.',
  'help.guide.admin-channels.step.1':
    'Trag unter Admin-Ntfy ein Thema und, falls nötig, Server und Token ein; unter Admin-Webhook eine URL.',
  'help.guide.admin-channels.step.2':
    'Klick auf Test-Ntfy senden oder Test-Webhook senden, um eine Nachricht ankommen zu sehen.',
  'help.guide.admin-channels.result': 'Admin-Ereignisse gehen dorthin, zusätzlich zur In-App-Glocke jedes Admins.',
  'help.guide.admin-channels.tip.1':
    'Halte das Admin-Thema getrennt von deinem persönlichen, damit ein Ausfall nicht im Reise-Geplauder untergeht.',
  // mcp-tokens-admin
  'help.guide.mcp-tokens-admin.title': 'KI-Zugriff widerrufen',
  'help.guide.mcp-tokens-admin.goal':
    'Sieh und kappe jedes Token und jede Sitzung, die ein KI-Client hält, für jeden Benutzer.',
  'help.guide.mcp-tokens-admin.step.1':
    'Such unter API-Tokens das Token nach Benutzer und Name; der Papierkorb löscht es und der Client stoppt sofort.',
  'help.guide.mcp-tokens-admin.step.2':
    'Unter OAuth-Sitzungen dasselbe für browserbasierte Clients: Client, Benutzer und Datum, und der Papierkorb widerruft die Sitzung.',
  'help.guide.mcp-tokens-admin.result':
    'Der Client muss von seinem Benutzer neu verbunden werden; sonst ändert sich nichts.',
  'help.guide.mcp-tokens-admin.tip.1':
    'Scopes sagen dir, was ein Client tun konnte; einen Nur-Lese-Scope stehen zu lassen ist harmlos.',
  'help.guide.mcp-tokens-admin.tip.2': 'Das MCP-Addon auszuschalten widerruft alles auf einmal.',
  // release-history
  'help.guide.release-history.title': 'Nach einem neuen Release schauen',
  'help.guide.release-history.goal': 'Wisse, ob dein TREK aktuell ist und was die nächste Version bringt.',
  'help.guide.release-history.step.1':
    'Wenn ein neueres Release existiert, erscheint Update verfügbar oben auf der Admin-Seite; Auf GitHub ansehen öffnet es, und Update-Anleitung erklärt das Update für Docker und andere Installationen.',
  'help.guide.release-history.step.2':
    'Update-Verlauf listet jedes Release mit seinen Notizen; Details anzeigen klappt sie auf, das neueste trägt Aktuell, und Mehr laden geht weiter zurück.',
  'help.guide.release-history.result':
    'Das Update passiert auf dem Host, durch Ziehen des neuen Images oder Bauen des neuen Tags; das Datenverzeichnis bleibt.',
  'help.guide.release-history.tip.1': 'Mach vor einem Update ein Backup; der Tab Backup liegt gleich nebenan.',
  'help.guide.release-history.tip.2':
    'Pre-Releases werden angezeigt, aber nicht als Update angekündigt, es sei denn, du betreibst eines.',
  // create-backup
  'help.guide.create-backup.title': 'Ein Backup machen und wiederherstellen',
  'help.guide.create-backup.goal':
    'Sichere die ganze Instanz, bewahre eine Kopie woanders auf und sei in der Lage, sie zurückzuspielen.',
  'help.guide.create-backup.step.1':
    'Klick unter Datensicherung auf Backup erstellen. Es packt die Datenbank und die Uploads in eine Datei auf dem Server.',
  'help.guide.create-backup.step.2':
    'Herunterladen holt eine Kopie von der Maschine; der Papierkorb löscht alte, um Platz zu schaffen.',
  'help.guide.create-backup.step.3':
    'Wiederherstellen bei einem Backup, oder Backup hochladen mit einer Datei, ersetzt die aktuellen Daten, nachdem Backup wiederherstellen? einmal gefragt hat.',
  'help.guide.create-backup.result':
    'Eine Wiederherstellung bringt Benutzer, Reisen, Dateien und Einstellungen auf den Stand dieses Backups zurück; alle werden abgemeldet.',
  'help.guide.create-backup.tip.1':
    'Wiederherstellen ist die eine Aktion hier, die sich nicht rückgängig machen lässt. Mach vorher ein frisches Backup.',
  'help.guide.create-backup.tip.2':
    'Backups liegen im Datenverzeichnis; erst eine Kopie auf einer anderen Maschine macht sie zu einem Backup.',
  // auto-backup
  'help.guide.auto-backup.title': 'Backups planen',
  'help.guide.auto-backup.goal': 'Lass den Server sich selbst sichern und nur die letzten paar behalten.',
  'help.guide.auto-backup.step.1':
    'Schalte unter Auto-Backup Auto-Backup aktivieren an und wähl Intervall, Ausführung um und, für wöchentlich oder monatlich, Wochentag oder Tag des Monats.',
  'help.guide.auto-backup.step.2':
    'Alte Backups löschen nach legt fest, wie lange ein Backup aufbewahrt wird; ältere gehen, wenn ein neues entsteht.',
  'help.guide.auto-backup.result':
    'Backups erscheinen nach Zeitplan in der Liste; ein Fehlschlag erreicht die Admin-Kanäle.',
  'help.guide.auto-backup.tip.1': 'Zeiten folgen der Zeitzone des Servers, die im Tab Audit steht.',
  'help.guide.auto-backup.tip.2': 'Speicher auf dem Server ist endlich; drei bis fünf zu behalten reicht meistens.',
  // audit-log
  'help.guide.audit-log.title': 'Das Audit-Protokoll lesen',
  'help.guide.audit-log.goal': 'Finde heraus, wer was gemacht hat, und wann.',
  'help.guide.audit-log.step.1':
    'Lies die Zeilen: Zeit, Benutzer, Aktion, Ressource, IP und Details, Neuestes zuerst. Aktionen sind nach dem benannt, was passiert ist, etwa ein fehlgeschlagener Login, eine MFA-Änderung oder eine Wiederherstellung.',
  'help.guide.audit-log.step.2': 'Aktualisieren lädt den Anfang neu; Mehr laden geht weiter zurück.',
  'help.guide.audit-log.result': 'Eine Spur, die du jedem geben kannst, der fragt, warum sich etwas geändert hat.',
  'help.guide.audit-log.tip.1': 'Zeiten werden in der Zeitzone des Servers gezeigt, die über der Tabelle steht.',
  'help.guide.audit-log.tip.2':
    'Das Protokoll ist nur anhängend; nichts hier lässt sich aus der App heraus bearbeiten oder löschen.',
  // document-providers
  'help.guide.document-providers.title': 'Einen Dokumentenspeicher anbieten',
  'help.guide.document-providers.goal': 'Entscheide, mit welchen Speichern eine Reise ihre Dokumente abgleichen darf.',
  'help.guide.document-providers.step.1':
    'Die Kachel Dokumente trägt die Speicher als Unterzeilen: Paperless-ngx, Papra, Nextcloud, OpenCloud und Synology Drive. Alle fünf sind anfangs ausgeschaltet, und die Zeilen sind nur da, solange Dokumente selbst an ist.',
  'help.guide.document-providers.step.2':
    'Leg den Schalter in der Zeile Nextcloud um. Die Meldung lautet Addon aktualisiert, und von nun an finden Reisebesitzer Dokumentenabgleich im Tab Dateien ihrer Reisen, mit Nextcloud unter Anbieter verbinden.',
  'help.guide.document-providers.result':
    'Der Speicher wird auf jeder Reise dieses TREK angeboten; verbunden ist nichts, bis ein Reisebesitzer es tut.',
  'help.guide.document-providers.tip.1':
    'Hier wird nur entschieden, ob ein Speicher angeboten werden darf. Die Adresse und die Zugangsdaten gehören zu einer Reise und werden von deren Besitzer in ihrem Tab Dateien eingetragen, nie im Admin-Bereich.',
  'help.guide.document-providers.tip.2':
    'Dokumente auszuschalten schaltet jeden Speicher mit aus, und ein Speicher lässt sich nicht einschalten, solange Dokumente aus ist: Der Server antwortet Enable the Documents addon first. Ein Speicher in deinem eigenen Netz braucht außerdem ALLOW_INTERNAL_NETWORK=true auf dem Server.',

  // ── Screen: trip ──────────────────────────────────────────────────────────────────────
  'help.ctx.trip.title': 'Reise',
  'help.ctx.trip.summary':
    'Eine Reise, alles an einem Ort: der Plan mit seinen Tagen, der Karte und den Orten, dazu die Tabs für Transport, Buchungen, Listen, Kosten, Dateien und Zusammenarbeit. Jeder davon ist eine eigene Hilfeseite unter dieser hier.',
  'help.ctx.trip.bullet.1':
    'Die Tab-Leiste: Karte, Transport, Buchungen, Listen, Kosten, Dateien und Collab. Addons und Plugins entscheiden, welche Tabs es auf deinem TREK gibt.',
  'help.ctx.trip.bullet.2':
    'Der Tab Karte hat drei Spalten: links die Tage, in der Mitte die Karte, rechts die Orte. Buchungen und Transporte leben im Plan, am Stopp und zwischen den Stopps; die Tabs listen sie auf.',
  'help.ctx.trip.bullet.3':
    'Teilen oben rechts öffnet die Leute der Reise: Mitglieder, Gäste, den Einladungslink und den öffentlichen Nur-Lese-Link.',
  'help.ctx.trip.bullet.4':
    'Titel, Daten, Cover und Währung bearbeitest du unter Meine Trips, mit dem Stift auf der Reisekarte.',
  'help.ctx.trip.bullet.5':
    'Die Chevrons an der Innenkante einer Spalte klappen sie weg, und die Karte nimmt den Platz; der schmale Trenner neben einer Spalte ändert ihre Breite.',
  'help.ctx.trip.bullet.6':
    'Der Rückgängig-Pfeil in der Werkzeugleiste der Tage nimmt die letzte Änderung am Plan zurück.',
  // add-member
  'help.guide.add-member.title': 'Ein Mitglied hinzufügen',
  'help.guide.add-member.goal': 'Gib jemandem mit TREK-Konto Zugriff auf diese Reise.',
  'help.guide.add-member.step.1': 'Klick oben rechts auf Teilen.',
  'help.guide.add-member.step.2': 'Wähl unter Benutzer einladen die Person aus der Liste und klick auf Einladen.',
  'help.guide.add-member.step.3':
    'Die Person erscheint jetzt unter Zugriff. Die Krone markiert den Eigentümer; das Symbol am Ende einer Zeile entfernt den Zugriff wieder.',
  'help.guide.add-member.result':
    'Das Mitglied sieht und bearbeitet die Reise wie du, innerhalb der Stufen, die der Admin unter Berechtigungseinstellungen festgelegt hat.',
  'help.guide.add-member.tip.1':
    'Wer in der Liste fehlt, hat noch kein TREK-Konto: Trag die Person als Gast ein, oder lass sie sich über einen Einladungslink registrieren.',
  'help.guide.add-member.tip.2': 'Die Zahl neben Zugriff zählt die Leute in der Reise; Gäste stehen separat darunter.',
  // trip-invite-link
  'help.guide.trip-invite-link.title': 'Per Link einladen',
  'help.guide.trip-invite-link.goal': 'Lass Leute der Reise selbst beitreten.',
  'help.guide.trip-invite-link.step.1':
    'Klick auf Teilen, dann unter Trip-Einladungslink auf Einladungslink erstellen.',
  'help.guide.trip-invite-link.step.2':
    'Klick auf Kopieren und verschick den Link. Wer ein TREK-Konto hat und ihn öffnet, tritt als Mitglied bei.',
  'help.guide.trip-invite-link.step.3':
    'Neu generieren ersetzt den Link und macht den alten unbrauchbar; Deaktivieren schaltet ihn ab.',
  'help.guide.trip-invite-link.result': 'Wer den Link öffnet, ist in der Reise und taucht unter Zugriff auf.',
  'help.guide.trip-invite-link.tip.1':
    'Wer kein Konto hat, kann ihn nicht nutzen. Ein Admin verteilt Registrierungslinks unter Administration, Benutzer, und kann einen an diese Reise binden.',
  'help.guide.trip-invite-link.tip.2':
    'Generier neu, wenn ein Link im falschen Chat gelandet ist: Der alte hört sofort auf zu funktionieren.',
  // add-guest
  'help.guide.add-guest.title': 'Einen Gast ohne Konto hinzufügen',
  'help.guide.add-guest.goal': 'Zähl jemanden mit, der TREK nicht nutzt.',
  'help.guide.add-guest.step.1': 'Klick auf Teilen und scroll zu Gäste.',
  'help.guide.add-guest.step.2': 'Tipp den Namen in Name des Gasts und klick auf Gast hinzufügen.',
  'help.guide.add-guest.result':
    'Der Gast lässt sich Kosten, Packlisten-Einträgen und Aufgaben zuweisen, kann sich aber nicht anmelden.',
  'help.guide.add-guest.tip.1':
    'Der Stift benennt einen Gast um; das Symbol am Ende der Zeile entfernt ihn samt seiner Anteile und Zuweisungen.',
  'help.guide.add-guest.tip.2': 'Bekommt die Person später ein Konto, lad sie als Mitglied ein und entfern den Gast.',
  // public-link
  'help.guide.public-link.title': 'Einen Nur-Lese-Link veröffentlichen',
  'help.guide.public-link.goal': 'Zeig die Reise Leuten, die sie nicht bearbeiten sollen.',
  'help.guide.public-link.step.1':
    'Klick auf Teilen; rechts unter Öffentlicher Link hakst du an, was der Link zeigen darf. Karte & Plan ist immer an; Buchungen, Packliste, Kosten und Chat sind deine Wahl.',
  'help.guide.public-link.step.2': 'Klick auf Link erstellen, dann auf Kopieren.',
  'help.guide.public-link.step.3': 'Die Haken lassen sich ändern, solange der Link besteht; Link löschen beendet ihn.',
  'help.guide.public-link.result': 'Wer den Link hat, sieht die gewählten Teile ohne Anmeldung und kann nichts ändern.',
  'help.guide.public-link.tip.1':
    'Der Link ist nirgends gelistet; wer ihn hat, kann ihn öffnen, also behandle ihn wie ein Passwort.',
  'help.guide.public-link.tip.2': 'Für Bearbeitungsrechte füg die Person stattdessen als Mitglied hinzu.',
  // transfer-ownership
  'help.guide.transfer-ownership.title': 'Die Reise übergeben oder verlassen',
  'help.guide.transfer-ownership.goal':
    'Mach jemand anderen zum Eigentümer, oder steig aus einer Reise aus, die nicht deine ist.',
  'help.guide.transfer-ownership.step.1':
    'Klick auf Teilen. Unter Zugriff macht die Krone in der Zeile eines Mitglieds diese Person zum Eigentümer; bestätige die Rückfrage.',
  'help.guide.transfer-ownership.step.2':
    'Reise verlassen in deiner eigenen Zeile nimmt dich aus der Reise; als Eigentümer übergib sie vorher.',
  'help.guide.transfer-ownership.result':
    'Der neue Eigentümer verwaltet die Mitglieder und kann die Reise löschen; du bleibst normales Mitglied.',
  'help.guide.transfer-ownership.tip.1':
    'Eigentümer ist, wer die Reise erstellt hat, bis sie übergeben wird; die Reise löschen darf allein der Eigentümer.',
  'help.guide.transfer-ownership.tip.2':
    'Zugriff entfernen in einer anderen Zeile ist derselbe Button in die andere Richtung: Der Eigentümer nimmt ein Mitglied heraus.',
  // collapse-columns
  'help.guide.collapse-columns.title': 'Platz für die Karte schaffen',
  'help.guide.collapse-columns.goal': 'Klapp eine Spalte weg oder gib ihr mehr Breite.',
  'help.guide.collapse-columns.step.1':
    'Klick auf den Chevron an der Innenkante der Tage-Spalte, um sie einzuklappen; die Karte nimmt den Platz. Die Orte-Spalte hat denselben Chevron.',
  'help.guide.collapse-columns.step.2': 'Klick noch einmal auf den Chevron, um die Spalte zurückzuholen.',
  'help.guide.collapse-columns.step.3':
    'Zieh den schmalen Trenner zwischen einer Spalte und der Karte, um die Breite der Spalte zu ändern.',
  'help.guide.collapse-columns.result':
    'Die Breiten werden gemerkt; die Spalten kommen beim nächsten Besuch offen zurück.',
  'help.guide.collapse-columns.tip.1': 'Beide Spalten lassen sich zugleich wegklappen, für eine reine Kartenansicht.',
  'help.guide.collapse-columns.tip.2':
    'Auf dem Handy gibt es keine Spalten: Planung und Orte sind die zwei Buttons unten an der Karte.',
  // undo-change
  'help.guide.undo-change.title': 'Die letzte Änderung rückgängig machen',
  'help.guide.undo-change.goal': 'Nimm zurück, was du gerade am Plan gemacht hast.',
  'help.guide.undo-change.step.1':
    'Klick auf den Rückgängig-Pfeil in der Werkzeugleiste über den Tagen; sein Tooltip nennt die Änderung, die er zurücknimmt.',
  'help.guide.undo-change.result':
    'Der Plan ist wieder wie vorher, und der Pfeil bleibt grau bis zur nächsten Änderung.',
  'help.guide.undo-change.tip.1':
    'Rückgängig deckt den Plan ab: Orte zuweisen, entfernen, umsortieren und verschieben, eine Route optimieren, Orte löschen, Kategoriewechsel und Importe.',
  'help.guide.undo-change.tip.2':
    'Es geht nur einen Schritt tief: Nur die letzte Änderung lässt sich zurücknehmen, und eine neue Änderung ersetzt sie.',

  // ── Screen: trip-places ───────────────────────────────────────────────────────────────
  'help.ctx.trip-places.title': 'Orte',
  'help.ctx.trip-places.summary':
    'Die rechte Spalte des Plans: jeder Ort der Reise, geplant oder nicht, mit Suche und Filtern, dazu die Wege, Orte hereinzuholen, von Hand, aus einer Datei oder aus einer geteilten Liste.',
  'help.ctx.trip-places.bullet.1':
    'Ort/Aktivität hinzufügen oben öffnet das Formular für einen Ort, den du eintippst oder suchst. Solange ein Tag geöffnet ist, heißt der Knopf Neuer Ort, und Zum Tag daneben legt den Ort direkt auf diesem Tag an.',
  'help.ctx.trip-places.bullet.2':
    'Dateimport nimmt .gpx-, .kml- und .kmz-Dateien; Listenimport nimmt eine geteilte Liste aus Google Maps oder Naver Maps. Eine Datei lässt sich auch einfach auf die Spalte fallen lassen.',
  'help.ctx.trip-places.bullet.3':
    'Das Auswahlmenü wechselt zwischen Alle, Ungeplant, Geplant und, sobald ein Track importiert wurde, Tracks; darunter sitzen die Suche, der Kategoriefilter und der Stern für eine Mindestbewertung.',
  'help.ctx.trip-places.bullet.4':
    'Eine Zeile zeigt Bild, Name und Beschreibung oder Adresse. Klick sie für die Ortsdetails an, zieh sie auf einen Tag, oder öffne mit Rechtsklick Bearbeiten, + Tag, Webseite öffnen, Google Maps, In Sammlung speichern und Löschen.',
  'help.ctx.trip-places.bullet.5':
    'Bei geöffnetem Tag legt ein + am Ende einer ungeplanten Zeile den Ort auf diesen Tag, und Geplant listet nur diesen Tag, mit Ganze Reise anzeigen zum Aufweiten.',
  'help.ctx.trip-places.bullet.6':
    'Der Haken am rechten Ende der Filterzeile startet eine Auswahl: mehrere Zeilen auf einmal bekommen eine neue Kategorie, wandern in eine Sammlung oder werden gelöscht.',
  // create-place
  'help.guide.create-place.title': 'Einen Ort anlegen',
  'help.guide.create-place.goal':
    'Trag einen Ort oder eine Aktivität von Hand ein, mit allem, was der Plan darüber wissen muss.',
  'help.guide.create-place.step.1':
    'Klick oben in der Orte-Spalte auf Ort/Aktivität hinzufügen (Neuer Ort, solange ein Tag geöffnet ist). Das Formular öffnet sich.',
  'help.guide.create-place.step.2':
    'Tipp den Ort oben in Ortssuche... ein und wähl ein Ergebnis. Name, Adresse, Breitengrad, Längengrad und Website füllen sich, und Ortsdetails links zeigt Bilder, Öffnungszeiten und eine Beschreibung dazu. Auf einem TREK mit Google-Schlüssel steht unter der Liste Nicht der richtige Ort? Stattdessen bei Google suchen und schickt dieselbe Suche noch einmal über Google.',
  'help.guide.create-place.step.3':
    'In den Ortsdetails macht ein Klick auf ein Bild unter Bild auswählen es zum Bild des Ortes; Text übernehmen trägt die Beschreibung ins Formular.',
  'help.guide.create-place.step.4':
    'Prüf die Felder: Name ist Pflicht; Beschreibung und Notizen gehören dir; Adresse, Breitengrad und Längengrad kommen aus der Suche oder werden getippt; Kategorie wählt eine der Kategorien der Reise, und das + daneben legt auf der Stelle eine neue an; Website nimmt den Link.',
  'help.guide.create-place.step.5':
    'Klick auf Hinzufügen. Liegt schon ein Ort gleichen Namens in der Reise, sagt das Formular es, und der Knopf wird zu Trotzdem hinzufügen.',
  'help.guide.create-place.result':
    'Der Ort steht in der Liste und auf der Karte, unter Ungeplant, bis er auf einen Tag gelegt wird.',
  'help.guide.create-place.tip.1':
    'Dateien und Kosten unten im Formular hängen ein Dokument an den Ort oder öffnen gleich nach dem Speichern den Kosten-Editor für seine Ausgabe.',
  'help.guide.create-place.tip.2':
    'Der TREK-Index und OpenStreetMap beantworten die Suche auf jedem TREK, und Ortsdetails füllt sich aus Wikipedia, Wikivoyage und Wikimedia. Google wird nur dort gefragt, wo beide leer bleiben, und nur Google bringt Bewertungen.',
  'help.guide.create-place.tip.3':
    'Ein Ort kann auch auf der Karte beginnen: Rechtsklick auf die Stelle, und das Formular öffnet sich mit eingetragenen Koordinaten und Adresse.',
  // place-to-open-day
  'help.guide.place-to-open-day.title': 'Einen Ort direkt auf den geöffneten Tag legen',
  'help.guide.place-to-open-day.goal':
    'Spar dir den zweiten Schritt: Leg den Ort an oder wähl ihn, und er liegt sofort auf dem Tag.',
  'help.guide.place-to-open-day.step.1':
    'Klick in der Tage-Spalte auf die Kopfzeile eines Tages. Der Tag ist geöffnet: Seine Karte ist hervorgehoben, und die Orte-Spalte bekommt den Knopf Zum Tag.',
  'help.guide.place-to-open-day.step.2':
    'Zum Tag öffnet dasselbe Formular wie Neuer Ort, nur landet der Ort in dem Moment auf dem geöffneten Tag, in dem du auf Hinzufügen klickst.',
  'help.guide.place-to-open-day.step.3':
    'Ein Ort, den es schon gibt, kommt mit dem + am Ende seiner Zeile auf den geöffneten Tag, oder per Rechtsklick über + Tag.',
  'help.guide.place-to-open-day.step.4':
    'Andersherum geht es auch, und ohne vorher einen Tag zu öffnen: Zieh die Zeile des Ortes aus der Spalte und lass sie auf einer Tageskarte los. Zwischen zwei Stopps abgelegt, landet er genau dort.',
  'help.guide.place-to-open-day.result':
    'Der Ort steht unter dem Tag, ganz am Ende; zieh ihn hoch oder runter an seinen Platz.',
  'help.guide.place-to-open-day.tip.1':
    'Der geöffnete Tag steuert auch die Suche: Ist ein Tag offen, starten die Karte und die Umkreissuche dort, wo dieser Tag ohnehin hinführt.',
  'help.guide.place-to-open-day.tip.2': 'Rückgängig in der Werkzeugleiste über den Tagen nimmt die Zuordnung zurück.',
  // filter-places
  'help.guide.filter-places.title': 'Einen Ort in der Liste finden',
  'help.guide.filter-places.goal': 'Eng die Spalte auf die Orte ein, die du suchst.',
  'help.guide.filter-places.step.1':
    'Das Auswahlmenü oben wechselt zwischen Alle, Ungeplant (noch auf keinem Tag), Geplant (auf einem Tag) und Tracks (importierte GPX-Tracks), jeweils mit seiner Anzahl.',
  'help.guide.filter-places.step.2': 'Tipp in Orte suchen...; die Liste wird mit jedem Zeichen enger.',
  'help.guide.filter-places.step.3':
    'Alle Kategorien öffnet eine Liste, in der du eine oder mehrere Kategorien ankreuzt, Keine Kategorie darunter; Filter zurücksetzen an ihrem Ende setzt sie zurück.',
  'help.guide.filter-places.step.4':
    'Der Stern daneben setzt eine Mindestbewertung: 5+, 4+ und so weiter zeigen nur Orte, die du mindestens so hoch bewertet hast.',
  'help.guide.filter-places.result':
    'Die Zahl über den Zeilen sagt, wie viele Orte passen; die Filter greifen zusammen.',
  'help.guide.filter-places.tip.1':
    'Bei geöffnetem Tag listet Geplant nur diesen Tag und sagt es auch: Nur der geöffnete Tag wird angezeigt, mit Ganze Reise anzeigen daneben.',
  'help.guide.filter-places.tip.2':
    'Die Karte engt sich ebenfalls auf den geöffneten Tag ein; Alle in der Liste zeigt weiterhin jeden Ort der Reise.',
  // edit-place
  'help.guide.edit-place.title': 'Einen Ort ändern',
  'help.guide.edit-place.goal':
    'Korrigier einen Namen, verschieb den Pin, ergänz eine Website oder wechsel die Kategorie.',
  'help.guide.edit-place.step.1':
    'Rechtsklick auf die Zeile und Bearbeiten wählen, oder den Ort öffnen und in seinen Details auf Bearbeiten klicken.',
  'help.guide.edit-place.step.2':
    'Ändere, was du brauchst: Name, Beschreibung, Notizen, Adresse, Breitengrad und Längengrad, Kategorie, Website. Von einem Tag aus geöffnet, hat das Formular zusätzlich Notizen für diesen Tag sowie Startzeit und Ende für diesen Tag.',
  'help.guide.edit-place.step.3': 'Klick auf Aktualisieren.',
  'help.guide.edit-place.result':
    'Die Änderung gilt überall, wo der Ort auftaucht: in der Liste, auf der Karte und an jedem Tag, an dem er hängt.',
  'help.guide.edit-place.tip.1':
    'Notizen für diesen Tag gehören zum Ort an diesem einen Tag; Notizen gehören zum Ort selbst.',
  'help.guide.edit-place.tip.2':
    'Ein Ende vor der Startzeit blockiert Aktualisieren; Zeitliche Überschneidung mit: warnt nur, dass ein anderer Stopp des Tages dieselbe Zeit hat.',
  // delete-place
  'help.guide.delete-place.title': 'Einen Ort löschen',
  'help.guide.delete-place.goal': 'Nimm einen Ort endgültig aus der Reise.',
  'help.guide.delete-place.step.1':
    'Rechtsklick auf die Zeile und Löschen wählen, oder in den Ortsdetails auf Löschen klicken.',
  'help.guide.delete-place.step.2':
    'Bestätige. Wurde an dem Ort eine Nacht gebucht oder hängt eine Buchung daran, sagt die Frage, was mitgeht.',
  'help.guide.delete-place.result':
    'Der Ort ist aus der Liste, von der Karte und von jedem Tag verschwunden; Rückgängig in der Werkzeugleiste über den Tagen holt ihn zurück.',
  'help.guide.delete-place.tip.1':
    'Um einen Ort nur von einem Tag zu nehmen, nutz stattdessen Vom Tag entfernen an diesem Stopp.',
  'help.guide.delete-place.tip.2': 'Mehrere Orte auf einmal: Der Haken neben den Filtern startet eine Auswahl.',
  // select-places
  'help.guide.select-places.title': 'Mehrere Orte auf einmal ändern oder löschen',
  'help.guide.select-places.goal': 'Räum die Liste in einem Zug auf, statt Ort für Ort.',
  'help.guide.select-places.step.1':
    'Klick auf den Haken am rechten Ende der Filterzeile. Die Zeilen bekommen Kästchen, und eine Leiste mit den Aktionen erscheint.',
  'help.guide.select-places.step.2':
    'Hak die Zeilen an, oder nutz Alle auswählen in der Leiste; die Leiste zählt, was ausgewählt ist.',
  'help.guide.select-places.step.3':
    'Kategorie ändern gibt allen eine Kategorie; In Sammlung speichern kopiert sie in eine deiner Sammlungen; Auswahl löschen entfernt sie nach einer Bestätigung.',
  'help.guide.select-places.step.4': 'Klick noch einmal auf den Haken, um die Auswahl zu verlassen.',
  'help.guide.select-places.result':
    'Die Änderung gilt für jeden ausgewählten Ort; ein Löschen lässt sich über die Werkzeugleiste über den Tagen rückgängig machen.',
  'help.guide.select-places.tip.1':
    'Die Filter arbeiten weiter, während du auswählst: Filter erst auf Ungeplant, dann erwischt Alle auswählen genau diese.',
  'help.guide.select-places.tip.2':
    'In deinen Listen als besucht markieren erscheint in der Leiste, wenn das Addon Sammlungen an ist: Es hakt die Orte in den Sammlungen ab, in denen sie gespeichert sind.',
  // import-places-file
  'help.guide.import-places-file.title': 'Orte aus einer GPX-, KML- oder KMZ-Datei importieren',
  'help.guide.import-places-file.goal':
    'Hol herein, was Google My Maps, Google Earth oder ein GPS-Tracker exportiert hat.',
  'help.guide.import-places-file.step.1':
    'Klick auf Dateimport, oder lass die Datei irgendwo auf der Orte-Spalte fallen.',
  'help.guide.import-places-file.step.2':
    'Wähl die Datei oder zieh sie in das Feld. Bei einer GPX hakst du an, was importiert wird: Wegpunkte, Routen, Tracks (mit Streckenverlauf); bei KML und KMZ Punkte (Placemarks) und Pfade (LineStrings).',
  'help.guide.import-places-file.step.3':
    'Das Feld nimmt mehrere Dateien auf einmal, und nur .gpx, .kml und .kmz. Eine andere Art von Datei, oder eine über 10 MB, wird im Dialog abgelehnt und nicht importiert.',
  'help.guide.import-places-file.step.4':
    'Klick auf Importieren. Eine Meldung sagt, wie viele Orte hereingekommen sind; bei einer KML- oder KMZ-Datei bleibt der Dialog offen und zeigt eine Zusammenfassung, was angelegt und was übersprungen wurde.',
  'help.guide.import-places-file.result':
    'Die Orte stehen in der Liste; ein Track trägt in seiner Zeile eine Routenmarkierung, zeichnet sich auf der Karte und bekommt seinen eigenen Filter Tracks.',
  'help.guide.import-places-file.tip.1':
    'Eine zu große Datei wird mit der Größengrenze abgelehnt; exportier sie noch einmal ohne Fotos, oder teil sie auf.',
  'help.guide.import-places-file.tip.2':
    'Der Import lässt sich als Ganzes über die Werkzeugleiste über den Tagen rückgängig machen.',
  // import-places-list
  'help.guide.import-places-list.title': 'Eine geteilte Liste aus Google Maps oder Naver Maps importieren',
  'help.guide.import-places-list.goal': 'Mach aus dem Link einer geteilten Liste Orte.',
  'help.guide.import-places-list.step.1': 'Klick auf Listenimport und wähl Google Liste oder Naver Liste.',
  'help.guide.import-places-list.step.2':
    'Füg den geteilten Link der Liste ein. Ein Routenlink von Google Maps geht auch: Seine Stopps werden zu Orten, in der Reihenfolge der Fahrt.',
  'help.guide.import-places-list.step.3': 'Klick auf Importieren.',
  'help.guide.import-places-list.result':
    'Jeder Ort der Liste ist in der Reise, benannt wie in der Liste; Orte, die schon in der Reise sind, werden übersprungen.',
  'help.guide.import-places-list.tip.1':
    'Die Liste muss öffentlich geteilt sein; der Link einer privaten Liste importiert nichts.',
  'help.guide.import-places-list.tip.2':
    'Orte über Google anreichern erscheint im Dialog, wenn dein TREK einen Google-Schlüssel hat: Es schlägt jeden importierten Ort nach und ergänzt Fotos, Adresse und Details.',

  // ── Screen: trip-days ─────────────────────────────────────────────────────────────────
  'help.ctx.trip-days.title': 'Tage',
  'help.ctx.trip-days.summary':
    'Die linke Spalte des Plans: eine Karte pro Tag mit den Stopps in ihrer Reihenfolge, den Notizen, den Buchungen und Transporten des Tages und der Route zwischen den Stopps. Hier wird die Reise wirklich geplant.',
  'help.ctx.trip-days.bullet.1':
    'Die Leiste oben: Exportieren (PDF, Kalender, GPX), Alle Tage ausklappen / Alle Tage einklappen, der Rückgängig-Pfeil, Tage neu anordnen und Alle Buchungsrouten anzeigen.',
  'help.ctx.trip-days.bullet.2':
    'Eine Tageskarte: Nummer, Wetter, Titel, Datum und die Kosten des Tages im Kopf; ein Klick auf den Kopf öffnet den Tag, der Pfeil daneben klappt sie zu. Öffentliche Verkehrsmittel, Transport hinzufügen und Notiz hinzufügen sitzen ebenfalls im Kopf.',
  'help.ctx.trip-days.bullet.3':
    'Im Tag: die Stopps in ihrer Reihenfolge, jeder mit Bild, Name, Uhrzeit und einem Schloss auf dem Bild; Notizen; Buchungen, die zum Tag gehören; und zwischen den Stopps die Fahrzeit jeder Etappe.',
  'help.ctx.trip-days.bullet.4':
    'Unter den Stopps die Routenleiste: Route zeichnet den Tag auf die Karte, Optimieren sortiert die Stopps, Auto / Fußweg setzt das Verkehrsmittel des Tages, In Google Maps öffnen und In CoMaps öffnen geben den Tag weiter.',
  'help.ctx.trip-days.bullet.5':
    'Orte kommen auf einen Tag, indem du eine Zeile aus der Orte-Spalte ziehst, über das + in dieser Zeile, über Ort zu diesem Tag auf einem leeren Tag oder aus den Ortsdetails.',
  'help.ctx.trip-days.bullet.6':
    'Gesamtkosten unten zählt jeden Stopp und jede Buchung mit einem Preis zusammen, in der Währung der Reise.',
  // read-day-plan
  'help.guide.read-day-plan.title': 'Einen Tag lesen',
  'help.guide.read-day-plan.goal': 'Wisse, was jeder Teil einer Tageskarte sagt, bevor du etwas änderst.',
  'help.guide.read-day-plan.step.1':
    'Der Kopf: die Tagesnummer, die Vorhersage für den Tag, Tag 1 oder der Titel, den du vergeben hast, das Datum und die Kosten des Tages. Klick auf den Kopf, um den Tag zu öffnen (seine Tagesdetails öffnen sich über der Karte); der Pfeil rechts klappt die Karte zu und wieder auf.',
  'help.guide.read-day-plan.step.2':
    'Ein Stopp: der Griff links zieht ihn, das Bild trägt ein Schloss für die Routenoptimierung, dann der Name, die Beschreibung und, wenn gesetzt, die Notizen für diesen Tag. Ein Zeit-Abzeichen zeigt Startzeit und Ende, wenn der Stopp sie hat; die Pfeile, die an seinem rechten Ende erscheinen, schieben ihn nach oben oder nach unten.',
  'help.guide.read-day-plan.step.3':
    'Eine Buchung am Tag: eine Reservierung an einem Stopp markiert den Stopp als Reservierung bestätigt oder Reservierung ausstehend, und ein Transport erscheint als Abflug oder Ankunft mit seiner Zeit und seiner Strecke, mit einem kleinen Schalter, der diese Route auf der Karte zeichnet.',
  'help.guide.read-day-plan.step.4':
    'Zwischen zwei Stopps sagt das Verbindungsstück, wie lange die Etappe dauert und wie weit sie ist, im Verkehrsmittel des Tages; klick es an, um das Verkehrsmittel für diese eine Etappe zu ändern.',
  'help.guide.read-day-plan.step.5':
    'Die Routenleiste am Ende: Route zeichnet den Weg des Tages auf die Karte, Optimieren sortiert die Stopps neu, die Modusknöpfe wählen Auto oder Fußweg, In Google Maps öffnen und In CoMaps öffnen öffnen den Tag dort.',
  'help.guide.read-day-plan.result':
    'Jedes Symbol auf der Karte hat eine Bedeutung; die Anleitungen unten ändern jedes davon.',
  'help.guide.read-day-plan.tip.1':
    'Rechtsklick auf einen Stopp öffnet sein Menü: Bearbeiten, Aus Tag entfernen, Webseite öffnen, die Navigations-Apps (Google Maps, Waze, Apple Maps, OpenStreetMap, CoMaps), In Sammlung speichern, Löschen.',
  'help.guide.read-day-plan.tip.2':
    'Fahr über einen Stopp, und an seinem Ende erscheint Buchung hinzufügen: eine dort angelegte Reservierung hängt an diesem Stopp an diesem Tag.',
  // place-onto-day
  'help.guide.place-onto-day.title': 'Einen Ort auf einen Tag legen',
  'help.guide.place-onto-day.goal':
    'Mach aus einem Ort der Liste einen Stopp des Tages, dort, wo er in die Reihenfolge gehört.',
  'help.guide.place-onto-day.step.1':
    'Zieh eine Zeile aus der Orte-Spalte auf die Tageskarte. Lass sie zwischen zwei Stopps fallen, um sie genau dorthin zu setzen, oder irgendwo auf der Karte, um sie anzuhängen.',
  'help.guide.place-onto-day.step.2':
    'Ohne Ziehen: öffne den Tag mit einem Klick auf seinen Kopf, dann klick auf das + am Ende der Zeile des Ortes, oder klick mit der rechten Maustaste auf die Zeile und wähl + Tag.',
  'help.guide.place-onto-day.step.3':
    'Auf einem leeren Tag öffnet Ort zu diesem Tag das Ortsformular, und der neue Ort landet sofort auf dem Tag.',
  'help.guide.place-onto-day.step.4':
    'Aus den Ortsdetails fragt Zum Tag hinzufügen, welcher Tag es sein soll; bei einem über seinen Kopf geöffneten Tag legt Zum Tag in der Orte-Spalte einen neuen Ort auf dem geöffneten Tag an.',
  'help.guide.place-onto-day.result':
    'Der Ort ist ein Stopp des Tages, auf der Karte mit der Nummer des Tages, und die Orte-Spalte zählt ihn unter Geplant.',
  'help.guide.place-onto-day.tip.1':
    'Ein Ort kann auf mehreren Tagen liegen: leg ihn aus der Orte-Spalte auf den zweiten Tag. Zieht man einen Stopp von einer Tageskarte auf eine andere, wandert er stattdessen.',
  'help.guide.place-onto-day.tip.2': 'Der Rückgängig-Pfeil in der Leiste nimmt die Zuordnung zurück.',
  'help.guide.place-onto-day.tip.3':
    'Ein Stopp lässt sich nicht zwischen zwei Einträge mit festen Uhrzeiten fallen lassen, auch nicht vor eine Buchung, die schon eine Uhrzeit hat; der Plan behält seine Chronologie.',
  // reorder-stops
  'help.guide.reorder-stops.title': 'Die Reihenfolge eines Tages ändern',
  'help.guide.reorder-stops.goal': 'Schieb einen Stopp nach oben oder nach unten, oder auf einen anderen Tag.',
  'help.guide.reorder-stops.step.1': 'Zieh den Stopp am Griff an seine neue Stelle in der Karte.',
  'help.guide.reorder-stops.step.2':
    'Oder nimm die Pfeile am rechten Ende des Stopps: ein Schritt nach oben oder nach unten pro Klick.',
  'help.guide.reorder-stops.step.3':
    'Zieh den Stopp auf eine andere Tageskarte, um ihn dorthin zu verschieben; er verlässt den alten Tag.',
  'help.guide.reorder-stops.step.4':
    'Ein Stopp mit fester Uhrzeit fragt Uhrzeit entfernen?, wenn das Verschieben die zeitliche Reihenfolge des Tages verletzen würde, denn die Uhrzeit hat seinen Platz bestimmt: Bestätigen nimmt die Uhrzeit weg, und der Stopp darf überall hin.',
  'help.guide.reorder-stops.result': 'Route und Fahrzeiten folgen der neuen Reihenfolge sofort.',
  'help.guide.reorder-stops.tip.1':
    'Buchungen mit fester Uhrzeit können nicht verschoben werden; sie sitzen dort, wo ihre Uhrzeit sie hinstellt.',
  'help.guide.reorder-stops.tip.2':
    'Optimieren in der Routenleiste ordnet den ganzen Tag nach dem kürzesten Weg; sperr einen Stopp vorher, damit er bleibt, wo er ist.',
  // set-stop-times
  'help.guide.set-stop-times.title': 'Einem Stopp eine Uhrzeit geben',
  'help.guide.set-stop-times.goal':
    'Leg fest, wann ein Stopp beginnt und endet, damit der Tag sich wie ein Zeitplan liest.',
  'help.guide.set-stop-times.step.1':
    'Rechtsklick auf den Stopp und Bearbeiten wählen. Vom Tag aus geöffnet, hat das Formular unten Startzeit und Ende.',
  'help.guide.set-stop-times.step.2':
    'Trag Startzeit und, wenn du magst, Ende ein. Zeitliche Überschneidung mit: warnt, dass ein anderer Stopp des Tages mit Uhrzeit überlappt; ein Ende vor der Startzeit blockiert Aktualisieren.',
  'help.guide.set-stop-times.step.3':
    'Klick auf Aktualisieren. Der Stopp bekommt ein Zeit-Abzeichen und rückt dorthin, wo seine Uhrzeit im Tag hingehört.',
  'help.guide.set-stop-times.result':
    'Stopps mit Uhrzeit behalten ihren Platz in der Reihenfolge; Stopps ohne Uhrzeit sortieren sich um sie herum.',
  'help.guide.set-stop-times.tip.1':
    'Die Uhrzeit gehört zum Stopp an diesem Tag; derselbe Ort kann an einem anderen Tag eine andere Uhrzeit haben.',
  'help.guide.set-stop-times.tip.2':
    'Um einen Stopp mit Uhrzeit von Hand zu verschieben, zieh ihn: Die Frage Uhrzeit entfernen? nimmt die Uhrzeit unterwegs weg, sobald du auf Bestätigen klickst.',
  'help.guide.set-stop-times.tip.3':
    'Das Feld Notizen für diesen Tag im selben Formular hält fest, was nur an diesem Tag gilt, ein reservierter Tisch, eine Ticketnummer.',
  // remove-from-day
  'help.guide.remove-from-day.title': 'Einen Stopp von einem Tag nehmen',
  'help.guide.remove-from-day.goal': 'Einen Ort aus der Planung nehmen, ohne ihn aus der Reise zu löschen.',
  'help.guide.remove-from-day.step.1': 'Rechtsklick auf den Stopp und Aus Tag entfernen wählen.',
  'help.guide.remove-from-day.step.2':
    'Der Stopp ist aus dem Tag verschwunden; der Ort bleibt in der Orte-Spalte, unter Ungeplant, wenn er auf keinem anderen Tag liegt.',
  'help.guide.remove-from-day.result':
    'Der Tag, seine Route und seine Kosten rechnen sich neu; der Rückgängig-Pfeil holt den Stopp zurück.',
  'help.guide.remove-from-day.tip.1': 'Löschen im selben Menü nimmt den Ort aus der ganzen Reise, an jedem Tag.',
  'help.guide.remove-from-day.tip.2': 'Vom Tag entfernen sitzt auch in den Ortsdetails, neben Zum Tag hinzufügen.',
  // lock-stop
  'help.guide.lock-stop.title': 'Einen Stopp festhalten',
  'help.guide.lock-stop.goal': 'Halt einen Stopp dort, wo er ist, wenn die Route optimiert wird.',
  'help.guide.lock-stop.step.1':
    'Fahr über das Bild des Stopps und klick auf das Schloss: Position bei Routenoptimierung beibehalten.',
  'help.guide.lock-stop.step.2':
    'Optimieren sortiert nun die anderen Stopps um ihn herum; klick noch einmal auf das Schloss (Klicken zum Entsperren), um ihn freizugeben.',
  'help.guide.lock-stop.result':
    'Das Schloss zeigt sich auf dem Bild; der Stopp behält seine Position, bis du ihn entsperrst.',
  'help.guide.lock-stop.tip.1':
    'Ein Stopp mit fester Uhrzeit ist durch seine Uhrzeit gesperrt; er bewegt sich bei der Optimierung nie.',
  'help.guide.lock-stop.tip.2':
    'Das Schloss hält für diesen Besuch: nach dem Neuladen ist jeder Stopp wieder frei, nur Stopps mit Uhrzeit bleiben fest.',
  // day-note
  'help.guide.day-note.title': 'Eine Notiz zu einem Tag schreiben',
  'help.guide.day-note.goal': 'Halt eine Erinnerung, eine Ticketnummer oder einen Plan B direkt im Tag fest.',
  'help.guide.day-note.step.1': 'Klick auf Notiz hinzufügen im Kopf des Tages.',
  'help.guide.day-note.step.2':
    'Gib ihr unter Notiz einen Namen, das ist, was im Tag zu sehen ist, und schreib den Rest unter Tagesnotiz. Die Werkzeugleiste darüber formatiert den Text (Fett, Aufzählung, Link, Zitat), und Vorschau links zeigt, wie die Notiz im Tag aussehen wird.',
  'help.guide.day-note.step.3':
    'Wähl ein Symbol und eine Farbe, damit sich die Notiz von den Stopps abhebt, und dann Hinzufügen.',
  'help.guide.day-note.step.4':
    'Die Notiz sitzt im Tag wie ein Stopp: zieh sie an ihre Stelle, öffne mit Rechtsklick Bearbeiten und Löschen.',
  'help.guide.day-note.result':
    'Die Notiz ist Teil des Tages, auch im PDF; eine Notiz mit Uhrzeit sortiert sich zu den Stopps mit Uhrzeit.',
  'help.guide.day-note.tip.1':
    'Eine Notiz mit Uhrzeit kann für einen Transport einstehen, für den du keine Buchung hast: „08:15 S3 ab Hauptbahnhof“.',
  'help.guide.day-note.tip.2': 'Notizen gelten pro Tag; eine Notiz für die ganze Reise gehört in Collab.',
  // day-route
  'help.guide.day-route.title': 'Die Route des Tages zeigen und optimieren',
  'help.guide.day-route.goal':
    'Sieh den Weg zwischen den Stopps, wähl, wie du reist, und lass TREK die Reihenfolge sortieren.',
  'help.guide.day-route.step.1':
    'Öffne den Tag und klick auf Route in der Routenleiste: der Weg zwischen den Stopps wird auf die Karte gezeichnet, und die Verbindungsstücke zwischen den Stopps zeigen Zeit und Entfernung jeder Etappe.',
  'help.guide.day-route.step.2':
    'Auto und Fußweg daneben setzen das Verkehrsmittel des Tages; die Etappen rechnen sich neu. Plugins können eigene Verkehrsmittel ergänzen.',
  'help.guide.day-route.step.3':
    'Klick auf ein Verbindungsstück, um das Verkehrsmittel dieser einen Etappe zu ändern: wähl eines, oder Tages-Standard verwenden, um auf das des Tages zurückzufallen.',
  'help.guide.day-route.step.4':
    'Optimieren sortiert die Stopps nach dem kürzesten Weg neu. Stopps mit einem Schloss oder einer festen Uhrzeit behalten ihren Platz; liegt eine Unterkunft auf dem Tag, beginnt die Route dort.',
  'help.guide.day-route.step.5':
    'In Google Maps öffnen oder In CoMaps öffnen öffnet den ganzen Tag als Route in dieser App, zum Navigieren unterwegs.',
  'help.guide.day-route.result':
    'Der Tag ist eine Route mit Zeiten; Gesamtkosten und die Etappen ändern sich mit der Reihenfolge.',
  'help.guide.day-route.tip.1':
    'Routen kommen standardmäßig von OSRM; die Administration kann TREK unter Benutzer-Standards auf einen anderen Routing-Dienst zeigen lassen.',
  'help.guide.day-route.tip.2':
    'Eine Etappe, die nicht berechnet werden konnte, zeigt keine Zeit; prüf, ob beide Stopps Koordinaten haben.',
  'help.guide.day-route.tip.3': 'Der Rückgängig-Pfeil nimmt eine Optimierung zurück.',
  // manage-days
  'help.guide.manage-days.title': 'Tage anlegen, ordnen und benennen',
  'help.guide.manage-days.goal': 'Form die Tage selbst, nicht nur das, was auf ihnen liegt.',
  'help.guide.manage-days.step.1':
    'Die Tage kommen aus den Daten der Reise; änder die Daten auf der Reisekarte im Dashboard, und Tage kommen an den Enden dazu oder fallen weg. Bevor ein Tag mit Inhalt wegfällt, zeigt eine Liste, welche Tage gehen und was auf ihnen liegt.',
  'help.guide.manage-days.step.2':
    'Tage neu anordnen in der Leiste öffnet eine Liste: Nach oben und Nach unten verschieben einen Tag mit allem, was auf ihm liegt, Tag löschen, der Papierkorb daneben, entfernt ihn. Unter der Liste fügt der Button mit dem nächsten Datum einen Tag direkt nach dem letzten datierten ein und verlängert die Reise um einen Tag; Ohne Datum hängt einen Tag ohne Datum an.',
  'help.guide.manage-days.step.3':
    'Tag löschen fragt zuerst nach: Es listet, was mit dem Tag geht, seine Orte, Notizen und Buchungen, eine Unterkunft mit Check-in oder Check-out an diesem Tag und die Tage, die ein Datum nach vorn rücken. Tag löschen entfernt ihn, Abbrechen behält ihn; den letzten Tag kann man nicht löschen.',
  'help.guide.manage-days.step.4':
    'Um einen Tag umzubenennen, öffne ihn und klick auf den Stift neben seinem Titel in den Tagesdetails über der Karte; der Name ersetzt Tag 1 in der Karte und im PDF.',
  'help.guide.manage-days.step.5':
    'Alle Tage ausklappen und Alle Tage einklappen in der Leiste klappen jede Karte auf einmal; eine einzelne Karte klappt mit ihrem Pfeil.',
  'help.guide.manage-days.result':
    'Die Daten bleiben an der Position: ein Tag, der nach oben rückt, bekommt das frühere Datum, seine Stopps, Notizen und Buchungen wandern mit.',
  'help.guide.manage-days.tip.1':
    'Das Verschieben von Tagen lässt sich über die Leiste rückgängig machen, das Löschen eines Tages nicht.',
  'help.guide.manage-days.tip.2':
    'Die Kosten im Kopf eines Tages zählen die Stopps und Buchungen dieses Tages zusammen, die einen Preis tragen.',
  // bookings-in-plan
  'help.guide.bookings-in-plan.title': 'Buchungen und Transporte im Plan lesen',
  'help.guide.bookings-in-plan.goal':
    'Wisse, wo eine Buchung auftaucht, sobald es sie gibt, und welcher Bildschirm sie anlegt.',
  'help.guide.bookings-in-plan.step.1':
    'Ein Transport (Flug, Zug, Fähre, Bus, Auto) erscheint am Tag der Abreise als Abflug und am Tag der Ankunft als Ankunft, mit Zeit und Strecke; ein mehrtägiger spannt sich über die Tage dazwischen.',
  'help.guide.bookings-in-plan.step.2':
    'Eine Reservierung an einem Stopp (ein Restaurant, eine Tour) markiert diesen Stopp als Reservierung bestätigt oder Reservierung ausstehend; eine Buchung mit einem Tag, aber ohne Stopp, ist eine eigene Zeile im Tag.',
  'help.guide.bookings-in-plan.step.3':
    'Eine Nacht im Hotel ist eine Unterkunft: sie sitzt in den Tagesdetails unter Unterkunft, von Check-in bis Check-out, und die Route jedes dieser Tage beginnt dort.',
  'help.guide.bookings-in-plan.step.4':
    'Auf der Karte zeichnet der Schalter in einer Transportzeile dessen Route; Alle Buchungsrouten anzeigen in der Leiste zeichnet sie alle.',
  'help.guide.bookings-in-plan.step.5':
    'Anlegen: Buchung hinzufügen an einem Stopp, über den du fährst, Transport hinzufügen und Öffentliche Verkehrsmittel im Kopf des Tages, und die Reiter Buchungen und Transport für die ganze Liste mit Import und Dateien.',
  'help.guide.bookings-in-plan.result':
    'Eine Buchung, ein Platz im Plan; die Reiter sind dieselben Buchungen als Liste.',
  'help.guide.bookings-in-plan.tip.1':
    'Bestätigt und Ausstehend ist ein Status, den du an der Buchung setzt; der Plan zeigt ihn am Stopp, der Reiter Buchungen zählt beide.',
  'help.guide.bookings-in-plan.tip.2':
    'Ein Transport mit fester Uhrzeit lässt sich nicht ziehen; änder stattdessen seine Uhrzeit in der Buchung.',
  // export-plan
  'help.guide.export-plan.title': 'Den Plan exportieren',
  'help.guide.export-plan.goal': 'Nimm den Plan als Dokument mit, in deinen Kalender oder auf ein GPS-Gerät.',
  'help.guide.export-plan.step.1': 'Klick auf Exportieren in der Leiste über den Tagen.',
  'help.guide.export-plan.step.2':
    'Dokument: PDF öffnet die Druckansicht jedes Tages mit seinen Stopps, Notizen und Buchungen; Seitenumbruch pro Tag beginnt jeden Tag auf einer neuen Seite, Als PDF speichern lädt es herunter.',
  'help.guide.export-plan.step.3':
    'Kalender: .ics herunterladen sichert die Buchungen als Kalenderdatei; Kalender abonnieren gibt dir einen Link, den deine Kalender-App von selbst aktualisiert.',
  'help.guide.export-plan.step.4':
    'Karten & GPS · GPX: Ganze Reise exportiert Orte, Tagesrouten und Tracks; Nur Orte die Punkte; Tage als Routen eine Route pro Tag, für Offline-Karten und GPS-Geräte.',
  'help.guide.export-plan.result': 'Die Datei wird heruntergeladen; in der Reise ändert sich nichts.',
  'help.guide.export-plan.tip.1':
    'Ein einzelner Tag geht aus seiner Routenleiste in eine Karten-App: In Google Maps öffnen oder In CoMaps öffnen.',
  'help.guide.export-plan.tip.2':
    'Kalender abonnieren braucht eingeschaltete Kalender-Feeds in deinen Einstellungen; das Dashboard hat eine Anleitung dafür.',
  'help.guide.export-plan.tip.3': 'Exportieren ist Lesen: jedes Mitglied der Reise kann es.',

  // ── Screen: trip-place ────────────────────────────────────────────────────────────────
  'help.ctx.trip-place.title': 'Ortsdetails',
  'help.ctx.trip-place.summary':
    'Die Ansicht, die sich über der Karte öffnet, wenn du einen Ort wählst: alles, was die Reise über ihn weiß, die Sterne von allen, sein Bild und seine Dateien, und die Knöpfe, die ihn auf den geöffneten Tag, in eine Liste oder in eine Karten-App bringen.',
  'help.ctx.trip-place.bullet.1':
    'Klick auf eine Zeile in der Orte-Spalte, auf einen Stopp in einem Tag oder auf einen Marker auf der Karte, und die Ortsdetails öffnen sich über der Karte. Wählst du den Ort in einem Tag, wissen die Details, welchen Stopp du meinst, und genau das bringt die Teilnehmer des Stopps und seine Buchung mit.',
  'help.ctx.trip-place.bullet.2':
    'Der Kopf trägt das runde Bild, den Namen, die Kategorie, die Adresse und die Koordinaten. Klick auf das Bild, um ein eigenes zu nehmen, doppelklick auf den Namen, um den Ort auf der Stelle umzubenennen, und das X rechts schließt die Ansicht.',
  'help.ctx.trip-place.bullet.3':
    'Darunter: der Preis, falls er einen hat, die Sterne, die jeder Mitreisende dem Ort gegeben hat, die Beschreibung und die Notizen, und Notizen für diesen Tag, wenn der Stopp welche trägt.',
  'help.ctx.trip-place.bullet.4':
    'Öffnungszeiten, Streckenfarbe, Streckendaten und Dateien folgen, soweit sie zutreffen. Dateien nimmt alles aus deinen Ordnern und listet außerdem, was an der Buchung dieses Stopps hängt.',
  'help.ctx.trip-place.bullet.5':
    'Die Zeile ganz unten: Zum Tag hinzufügen oder Vom Tag entfernen, solange ein Tag geöffnet ist, dann In Sammlung speichern, Navigation, Webseite öffnen, Bearbeiten und Löschen.',
  'help.ctx.trip-place.bullet.6':
    'Ein Ort, der aus der Suche gewählt wurde, trägt, was der TREK-Index oder OpenStreetMap über ihn wissen: einen grünen Ring mit Geöffnet oder einen roten mit Geschlossen um das Bild, nach der Uhr des Ortes beurteilt, die Telefonnummer unter den Sternen, Öffnungszeiten weiter unten mit der Zeile des Tages auf der Zeile und der ganzen Woche hinter einem Klick, und seine Webseite hinter Webseite öffnen. Googles Bewertung zeigt sich nur bei einem Ort, der über Google gefunden wurde, auf einem TREK mit Google-Schlüssel.',
  // read-place
  'help.guide.read-place.title': 'Was die Ortsdetails über einen Ort sagen',
  'help.guide.read-place.goal': 'Lies alles, was die Reise über einen Ort weiß, in einer Ansicht.',
  'help.guide.read-place.step.1':
    'Klick in der Tage-Spalte den Stopp an, den du lesen willst. Die Ortsdetails öffnen sich über der Karte, und der Stopp bleibt in seinem Tag markiert.',
  'help.guide.read-place.step.2':
    'Der Kopf: das runde Bild, der Name, die Adresse und die genauen Koordinaten. Ein grüner Ring mit Geöffnet oder ein roter mit Geschlossen um das Bild sagt, ob der Ort gerade offen hat, nach seiner eigenen Uhr, sobald TREK seine Zeiten kennt. Das X rechts schließt die Ansicht wieder.',
  'help.guide.read-place.step.3':
    'Darunter die Sterne, die jeder Mitreisende dem Ort gegeben hat, mit dem Durchschnitt und der Zahl der Stimmen. Noch nicht bewertet, solange niemand gestimmt hat. Gleich darunter die Telefonnummer, wo der Ort eine hat: Ein Klick darauf reicht die Nummer an deine Telefon-App weiter.',
  'help.guide.read-place.step.4':
    'Dann die Beschreibung und darunter die Notizen. Beides ist der Text aus dem Formular des Ortes, gerendert: Listen, Links und Fettes funktionieren.',
  'help.guide.read-place.step.5':
    'Teilnehmer sagt, wer zu diesem Stopp mitgeht. Alle sind dabei, bis du jemanden herausnimmst.',
  'help.guide.read-place.step.6':
    'Öffnungszeiten, weiter unten: Die Zeile trägt die Zeiten des Tages, den du gerade ansiehst, und ein Klick darauf klappt die ganze Woche auf, mit diesem Tag in Fett. Dateien steht daneben.',
  'help.guide.read-place.result':
    'Die Ortsdetails bleiben offen, bis du sie mit dem X schließt oder einen anderen Ort wählst, die Zeiten der Woche bleiben aufgeklappt, und der Stopp, zu dem sie gehören, bleibt in der Tage-Spalte markiert.',
  'help.guide.read-place.tip.1':
    'Aus der Orte-Spalte heraus gewählt, kennen die Details den Ort, aber keinen Stopp, und zeigen deshalb weder Teilnehmer noch Buchung. Wähl stattdessen den Stopp im Tag, dann ist beides da.',
  'help.guide.read-place.tip.2':
    'Ein Doppelklick auf den Namen benennt den Ort um, ohne das Formular zu öffnen. Enter speichert, Escape verwirft die Änderung.',
  'help.guide.read-place.tip.3':
    'Ein von Hand eingetippter Ort zeigt nichts davon: Die Details kennen nur, was sein Formular enthält. Öffne ihn mit Bearbeiten, wähl ihn aus den Vorschlägen unter Ortssuche... und klick auf Aktualisieren, dann kommen die Öffnungszeiten, die Telefonnummer und die Webseite mit. Googles Bewertung braucht einen Google-Schlüssel.',
  // rate-place
  'help.guide.rate-place.title': 'Einen Ort bewerten',
  'help.guide.rate-place.goal': 'Gib einem Ort deine eigenen Sterne, und sieh, was alle anderen ihm gegeben haben.',
  'help.guide.rate-place.step.1':
    'Öffne den Ort. Die Sternzeile sitzt direkt unter dem Kopf und trägt den Durchschnitt der bisherigen Stimmen, mit ihrer Zahl in Klammern.',
  'help.guide.rate-place.step.2':
    'Klick den Stern an, den du meinst. Die Sterne füllen sich, während du über sie fährst, du siehst also, was du gleich vergibst.',
  'help.guide.rate-place.step.3':
    'Deine Stimme zählt sofort in den Durchschnitt, und die Gesichter daneben sind die, die gestimmt haben. Bleib mit dem Zeiger auf der Zeile, um die Sterne von allen zu sehen.',
  'help.guide.rate-place.step.4':
    'Derselbe Durchschnitt steht auf der Zeile des Ortes in der Orte-Spalte, so fallen die guten in der Liste auf.',
  'help.guide.rate-place.result':
    'Deine Sterne stehen am Ort, für die ganze Reise sichtbar, und der Stern in der Filterzeile über der Liste kann jetzt nur noch die Orte zeigen, die eine Untergrenze erreichen.',
  'help.guide.rate-place.tip.1':
    'Jeder Mitreisende darf bewerten, auch auf einer Reise, auf der nur einige das Recht Orte hinzufügen / bearbeiten / löschen haben.',
  'help.guide.rate-place.tip.2':
    'Klick den Stern, den du schon gegeben hast, noch einmal an, um deine Stimme zurückzunehmen. Stimmt niemand mehr, steht am Ort wieder Noch nicht bewertet.',
  'help.guide.rate-place.tip.3':
    'Bis zu sechs Stimmen passen als Gesichter neben die Sterne; der Tooltip nennt alle und markiert deine.',
  // place-image
  'help.guide.place-image.title': 'Ein eigenes Bild auf einen Ort legen',
  'help.guide.place-image.goal': 'Ersetz das automatische Vorschaubild durch ein eigenes Foto.',
  'help.guide.place-image.step.1': 'Öffne den Ort aus der Orte-Spalte.',
  'help.guide.place-image.step.2':
    'Bleib mit dem Zeiger auf dem runden Bild im Kopf: Eine Kamera erscheint, und der Tooltip sagt Bild hochladen. Klick sie an und wähl deine Datei.',
  'help.guide.place-image.step.3': 'Der Kopf zeigt jetzt dein Bild, mit einem kleinen roten X an seiner Ecke.',
  'help.guide.place-image.step.4':
    'Dasselbe Bild steht auf der Zeile des Ortes in der Orte-Spalte und auf seinem Marker auf der Karte.',
  'help.guide.place-image.result':
    'Dein Bild ist überall das Bild des Ortes: in den Ortsdetails, in der Orte-Spalte, am Stopp im Tag, auf dem Marker auf der Karte und in einer geteilten Reise.',
  'help.guide.place-image.tip.1':
    'JPG, PNG, GIF und WebP werden genommen, und ein HEIC vom iPhone wird beim Hochladen umgewandelt.',
  'help.guide.place-image.tip.2':
    'Das X an der Ecke entfernt dein Bild wieder, und das automatische kommt zurück. Der Ort selbst bleibt unberührt.',
  'help.guide.place-image.tip.3':
    'Ohne eigenes Bild sucht TREK eines über die Koordinaten des Ortes und fällt sonst auf das Symbol der Kategorie zurück.',
  // place-day-assign
  'help.guide.place-day-assign.title': 'Den Ort auf den geöffneten Tag legen oder von ihm nehmen',
  'help.guide.place-day-assign.goal': 'Nimm den Knopf in den Ortsdetails, statt die Zeile durch den Plan zu ziehen.',
  'help.guide.place-day-assign.step.1':
    'Klick in der Tage-Spalte auf die Kopfzeile eines Tages. Dieser Tag ist jetzt der geöffnete, und die Ortsdetails beziehen sich auf ihn.',
  'help.guide.place-day-assign.step.2':
    'Klick in der Orte-Spalte auf einen Ort, der nicht an diesem Tag liegt. Seine Details öffnen sich, und die Zeile ganz unten bietet Zum Tag hinzufügen an.',
  'help.guide.place-day-assign.step.3':
    'Klick auf Zum Tag hinzufügen. Der Stopp landet am Ende des Tages, und der Knopf wird zu Vom Tag entfernen.',
  'help.guide.place-day-assign.step.4':
    'Der Stopp liegt jetzt im Tag, als letzter in der Liste. Zieh ihn hoch an seinen Platz.',
  'help.guide.place-day-assign.step.5':
    'Vom Tag entfernen nimmt diesen Stopp wieder vom Tag, und die Ortsdetails bieten erneut Zum Tag hinzufügen an.',
  'help.guide.place-day-assign.result':
    'Der Tag trägt den Stopp, oder trägt ihn nicht mehr, und der Ort selbst bleibt so oder so unberührt.',
  'help.guide.place-day-assign.tip.1':
    'Den Knopf gibt es nur, solange ein Tag geöffnet ist. Ohne einen Tag haben die Ortsdetails nichts, worauf sie den Ort legen könnten.',
  'help.guide.place-day-assign.tip.2':
    'Einen Stopp von einem Tag zu nehmen lässt den Ort in der Reise und in der Orte-Spalte. Löschen ist das, was ihn überall entfernt.',
  'help.guide.place-day-assign.tip.3':
    'Ein Stopp, den eine Unterkunftsbuchung auf den Tag gelegt hat, bietet keinen der beiden Knöpfe: Diese Nacht wird im Block Unterkunft des Tages hinzugefügt und entfernt.',
  // place-participants
  'help.guide.place-participants.title': 'Sagen, wer zu diesem Stopp mitgeht',
  'help.guide.place-participants.goal': 'Teil die Gruppe für einen Stopp, ohne die Reise zu teilen.',
  'help.guide.place-participants.step.1':
    'Klick den Stopp im Tag an. Die Ortsdetails öffnen sich, und Teilnehmer listet alle in der Reise auf.',
  'help.guide.place-participants.step.2':
    'Klick auf den Namen eines Mitreisenden, um ihn aus diesem Stopp zu nehmen. Der Name wird durchgestrichen, während du darüber fährst.',
  'help.guide.place-participants.step.3':
    'Ein gestricheltes + erscheint, sobald jemand fehlt. Klick es an, um zu sehen, wer nicht am Stopp ist.',
  'help.guide.place-participants.step.4':
    'Klick auf einen Namen, um die Person zurückzuholen. Sind alle zurück, gehört der Stopp wieder der ganzen Gruppe.',
  'help.guide.place-participants.result':
    'Der Stopp trägt die Mitreisenden, die du gewählt hast, und der Rest der Gruppe hat diesen Nachmittag für sich.',
  'help.guide.place-participants.tip.1':
    'Teilnehmer erscheint nur mit einem gewählten Stopp, wähl den Ort also im Tag statt in der Orte-Spalte, und nur auf einer Reise mit mehr als einem Mitreisenden.',
  'help.guide.place-participants.tip.2':
    'Niemand gewählt heißt, alle gehen mit; darum lässt sich der letzte Mitreisende, der an einem Stopp übrig ist, nicht herausnehmen.',
  'help.guide.place-participants.tip.3': 'Ein Gast, der kein eigenes Konto hat, kann Teilnehmer sein wie jeder andere.',
  // place-booking
  'help.guide.place-booking.title': 'Die Buchung an einem Stopp',
  'help.guide.place-booking.goal': 'Lies die Buchung, die zu einem Stopp gehört, öffne sie, und häng eine neue an ihn.',
  'help.guide.place-booking.step.1':
    'Öffne den Stopp, zu dem die Buchung gehört. Die Ortsdetails zeigen einen Streifen mit Bestätigt oder Ausstehend und dem Namen der Buchung.',
  'help.guide.place-booking.step.2':
    'Der Streifen trägt Datum, Uhrzeit und Buchungscode, dazu alle Notizen, die die Buchung hat.',
  'help.guide.place-booking.step.3': 'Klick auf den Streifen. Das Formular der Buchung öffnet sich darauf.',
  'help.guide.place-booking.step.4':
    'Mit Tagesplanung verknüpfen ist das, was eine Buchung an einen Stopp hängt, und hier nennt es schon diesen. Schließ das Formular wieder.',
  'help.guide.place-booking.step.5':
    'Eine neue Buchung für einen Stopp beginnt in der Tage-Spalte: Fahr über den Stopp und klick auf das + an seinem Ende. Das Formular öffnet sich als Neue Buchung, schon mit ihm verknüpft.',
  'help.guide.place-booking.result':
    'Die Buchung hängt am Stopp: Sie steht in den Ortsdetails, sie steht im Tag, und ihre Dateien sind hier ebenfalls unter Dateien gelistet.',
  'help.guide.place-booking.tip.1':
    'Der Streifen erscheint nur bei dem Stopp, an dem die Buchung hängt. Eine Buchung ohne Stopp lebt im Tab Buchung.',
  'help.guide.place-booking.tip.2':
    'Mehrere Buchungen können sich einen Stopp teilen: das Mittagessen und die Tour, die an derselben Tür startet.',
  'help.guide.place-booking.tip.3':
    'Ein Zug, ein Flug oder eine Fähre öffnet stattdessen das Transportformular, dasselbe, das der Tab Transport nutzt.',
  // place-files
  'help.guide.place-files.title': 'Die Tickets eines Ortes beim Ort behalten',
  'help.guide.place-files.goal':
    'Leg das Ticket, den Gutschein oder die Karte für einen Ort dorthin, wo du danach suchen wirst.',
  'help.guide.place-files.step.1':
    'Öffne den Ort. Dateien sitzt am Fuß der Ortsdetails und heißt Dateien, solange der Ort keine hat.',
  'help.guide.place-files.step.2': 'Klick daneben auf Hochladen und wähl die Datei.',
  'help.guide.place-files.step.3': 'Der Knopf zählt, was der Ort hält, und die Liste öffnet sich von selbst.',
  'help.guide.place-files.step.4':
    'Jede Zeile ist der Name der Datei mit ihrer Größe. Klick sie an, um die Datei zu öffnen.',
  'help.guide.place-files.result':
    'Die Datei sitzt am Ort, in den Ortsdetails gezählt, und sie steht auch im Tab Dateien der Reise.',
  'help.guide.place-files.tip.1':
    'Dateien listet auch, was an der Buchung dieses Stopps hängt, so taucht eine Hotelbestätigung am Hotel auf.',
  'help.guide.place-files.tip.2': 'Hochladen nimmt mehrere Dateien auf einmal.',
  'help.guide.place-files.tip.3':
    'Ohne das Recht Dateien hochladen gibt es den Knopf Hochladen nicht; Dateien, die schon am Ort hängen, bleiben.',
  // place-navigation
  'help.guide.place-navigation.title': 'Einen Ort in einer Karten-App oder auf seiner Webseite öffnen',
  'help.guide.place-navigation.goal': 'Übergib den Ort an die App, die dich wirklich hinbringt.',
  'help.guide.place-navigation.step.1': 'Öffne den Ort und klick in der Zeile ganz unten auf Navigation.',
  'help.guide.place-navigation.step.2':
    'Die Liste sind die Karten-Apps, die zu diesem Ort passen: Google Maps, Waze, Apple Maps, OpenStreetMap und CoMaps.',
  'help.guide.place-navigation.step.3':
    'Klick die an, die du nutzt. TREK übergibt ihr den Ort selbst, wo es geht, nicht nur ein Koordinatenpaar, so landest du am richtigen Eingang.',
  'help.guide.place-navigation.step.4':
    'Webseite öffnen daneben öffnet die eigene Seite des Ortes, seine Zeiten und seine Tickets, in einem neuen Tab.',
  'help.guide.place-navigation.result':
    'Die Karten-App öffnet sich auf dem Ort, die Webseite in einem eigenen Tab, und in der Reise ändert sich nichts.',
  'help.guide.place-navigation.tip.1':
    'Waze navigiert sofort los. Die anderen öffnen den Ort, und von dort zu starten ist ein Tipp mehr.',
  'help.guide.place-navigation.tip.2':
    'Welche Apps angeboten werden, hängt vom Ort und von deinem Gerät ab: Apple Maps fällt auf Android weg, 高德地图 kommt nur bei einem Ort in China auf, und Waze, Apple Maps und CoMaps brauchen die Koordinaten des Ortes.',
  'help.guide.place-navigation.tip.3': 'Passt nur eine App, trägt der Knopf deren Namen und öffnet sie sofort.',
  // place-to-collection
  'help.guide.place-to-collection.title': 'Einen Ort in einer deiner Listen speichern',
  'help.guide.place-to-collection.goal': 'Heb einen Ort, den du auf dieser Reise gefunden hast, für die nächste auf.',
  'help.guide.place-to-collection.step.1':
    'Öffne den Ort und klick unten in den Ortsdetails auf In Sammlung speichern.',
  'help.guide.place-to-collection.step.2':
    'In Liste speichern zeigt jede Liste, die dir gehört oder die du teilst. Ein Haken markiert die, die diesen Ort schon halten.',
  'help.guide.place-to-collection.step.3': 'Klick auf die Liste. Der Ort ist sofort darin.',
  'help.guide.place-to-collection.step.4': 'Schließ das Fenster, und der Knopf in den Ortsdetails heißt Gespeichert.',
  'help.guide.place-to-collection.result':
    'Der Ort liegt in deiner Liste, mit Bild, Notizen und Adresse, bereit für die nächste Reise.',
  'help.guide.place-to-collection.tip.1':
    'Den Knopf gibt es nur, solange das Addon Sammlungen an ist, das der Admin unter Addons einschaltet.',
  'help.guide.place-to-collection.tip.2':
    'Ein Ort kann in mehreren Listen zugleich liegen, mit eigenem Status in jeder: in einer eine Idee, in der anderen Besucht.',
  'help.guide.place-to-collection.tip.3':
    'Als besucht markieren, neben dem Namen des Ortes in der Auswahl, hakt ihn in der Liste ab; liegt der Ort in mehreren deiner Listen, heißt die Pille Überall als besucht und erledigt alle auf einmal.',
  // place-track
  'help.guide.place-track.title': 'Einen Track lesen und ihm eine eigene Farbe geben',
  'help.guide.place-track.goal':
    'Sieh, wie lang eine importierte Wanderung ist, und unterscheide ihre Linie von den anderen auf der Karte.',
  'help.guide.place-track.step.1':
    'Die Zeile eines Tracks in der Orte-Spalte trägt einen kurzen Strich in der Farbe, in der seine Linie gezeichnet ist. Klick sie an.',
  'help.guide.place-track.step.2':
    'Streckendaten gibt die Länge des Wegs, in der Entfernungseinheit, die du eingestellt hast.',
  'help.guide.place-track.step.3':
    'Streckenfarbe darüber zeigt die Farbe, die gerade gilt. Klick die Zeile an, um die Farbfelder zu öffnen.',
  'help.guide.place-track.step.4':
    'Wähl eine Farbe. Die Linie auf der Karte und der Strich auf der Zeile ändern sich mit.',
  'help.guide.place-track.step.5':
    'Das gestrichelte Feld links, Automatische Farbe, gibt dem Track die Farbe zurück, die er erbt; die Pipette rechts öffnet die Farbauswahl deines Systems für alles andere.',
  'help.guide.place-track.result':
    'Der Track ist in der Farbe gezeichnet, die du gewählt hast, in den Ortsdetails, auf seiner Zeile in der Orte-Spalte und auf der Karte.',
  'help.guide.place-track.tip.1':
    'Nur ein Ort, der einen Weg trägt, einen aus einer GPX-, KML- oder KMZ-Datei importierten, hat diese beiden Blöcke.',
  'help.guide.place-track.tip.2':
    'Ein mit Höhen aufgezeichneter Track zeigt außerdem seinen höchsten und tiefsten Punkt, die Höhenmeter hinauf und hinunter und das Profil der Wanderung.',
  'help.guide.place-track.tip.3':
    'Ein Import gibt jedem Track, den er hereinholt, eine eigene Farbe, so kommen zwei Wanderungen nie in derselben an.',
  // read-place
  'help.guide.read-place.step.7':
    'Die Zeile ganz unten ist, was du von hier aus tun kannst: den Ort vom geöffneten Tag nehmen oder darauf legen, ihn in einer Liste speichern, ihn in einer Karten-App öffnen, ihn bearbeiten oder löschen.',

  // ── Screen: trip-files ────────────────────────────────────────────────────────────────
  'help.ctx.trip-files.title': 'Dateien',
  'help.ctx.trip-files.summary':
    'Jedes Dokument der Reise in einer Liste: Tickets, Bestätigungen, Pässe und Bilder, jedes mit einer Notiz, einer Verknüpfung zu dem Ort oder der Buchung, zu der es gehört, und einem Papierkorb, aus dem es wieder herauskommt.',
  'help.ctx.trip-files.bullet.1':
    'Dateien hier ablegen, oben, nimmt die Dateien an; ein Klick auf das Feld öffnet die Dateiauswahl. Die Zeile darunter nennt die Dateitypen, die dieses TREK annimmt, und die Grenze von 50 MB pro Datei.',
  'help.ctx.trip-files.bullet.2':
    'Die Reiter sagen, was die Liste zeigt: Alle, PDFs, Bilder und Dokumente, jeder mit seiner Anzahl. Ein Stern-Reiter kommt dazu, sobald eine Datei markiert ist, Collab Notizen, sobald eine Notiz einen Anhang trägt.',
  'help.ctx.trip-files.bullet.3':
    'Eine Zeile trägt, wer sie hochgeladen hat, den Namen, die Notiz darunter, die Größe und das Datum, und ein Abzeichen je Verknüpfung: Tagesplan und den Ort, Buchung oder Transport und die Buchung, Aus Collab Notizen.',
  'help.ctx.trip-files.bullet.4':
    'Am Ende einer Zeile sitzen Markieren, Zuweisen, Öffnen, Herunterladen und Löschen. Löschen fragt nicht: Die Datei geht in den Papierkorb, aus dem sie zurückgeholt werden kann.',
  'help.ctx.trip-files.bullet.5':
    'Ein Bild oder ein Video öffnet sich im Vollbild, mit den Pfeiltasten und einem Streifen kleiner Vorschaubilder; jedes andere Dokument öffnet sich in einer Vorschau über der Seite, mit In neuem Tab öffnen und Herunterladen. Ein Wallet-Pass wird sofort heruntergeladen.',
  'help.ctx.trip-files.bullet.6':
    'Papierkorb am rechten Ende schaltet die Liste auf die gelöschten Dateien um, wo jede wiederhergestellt oder endgültig gelöscht wird und Papierkorb leeren alle entfernt. Wo ein Administrator einen Dokumentenspeicher verbunden hat, sitzt Dokumentenabgleich daneben.',
  // files-upload
  'help.guide.files-upload.title': 'Ein Dokument in die Reise legen',
  'help.guide.files-upload.goal':
    'Hol ein Ticket, eine Bestätigung oder ein Foto aus deinem Download-Ordner in die Reise, wo alle Beteiligten drankommen.',
  'help.guide.files-upload.step.1':
    'Öffne die Reise und klick in der Reiterleiste auf Dateien. Dort stehen die Dokumente der Reise, mit dem Feld zum Hochladen darüber.',
  'help.guide.files-upload.step.2':
    'Klick auf Dateien hier ablegen und wähl eine oder mehrere Dateien. Sie werden nacheinander hochgeladen, und im Feld steht Wird hochgeladen..., solange es läuft. Die Zeile unter dem Feld sagt, welche Typen dieses TREK nimmt und dass eine Datei höchstens 50 MB haben darf.',
  'help.guide.files-upload.step.3':
    'Sobald die letzte Datei oben ist, öffnet sich Datei zuweisen von selbst dafür. Notiz hinzufügen... gibt der Datei eine eigene Zeile, und die Listen darunter binden sie an einen Ort oder eine Buchung. Schließ es mit dem ×; durch das Schließen geht nichts verloren.',
  'help.guide.files-upload.step.4':
    'Die neuen Dateien stehen oben in der Liste. Eine Zeile zeigt, wer sie hochgeladen hat, den Namen, die Größe und das Datum; ein Bild bekommt ein Vorschaubild, jede andere Datei ihren Typ.',
  'help.guide.files-upload.result':
    'Die Dokumente sind in der Reise, und jeder, der die Reise sehen kann, kann sie öffnen und herunterladen.',
  'help.guide.files-upload.tip.1':
    'Eine Datei lässt sich auch vom Desktop direkt auf das Feld ziehen, das aufleuchtet, solange die Datei darüber schwebt.',
  'help.guide.files-upload.tip.2':
    'Ein Bild in der Zwischenablage kommt mit Ctrl+V in die Liste, sodass ein Screenshot einer Buchung nie erst gespeichert werden muss.',
  'help.guide.files-upload.tip.3':
    'Hochladen braucht das Recht Dateien hochladen; ohne das ist das Feld gar nicht da. Ein Typ, der nicht auf der Liste steht, wird mit einer Meldung abgelehnt, und nichts wird hochgeladen. Eine Datei über 50 MB lässt das Feld selbst fallen, noch bevor etwas gesendet wird.',
  // files-link
  'help.guide.files-link.title': 'Ein Dokument an einen Ort oder eine Buchung binden',
  'help.guide.files-link.goal':
    'Mach das Ticket von dem Tag aus auffindbar, zu dem es gehört, nicht nur aus dieser Liste.',
  'help.guide.files-link.step.1':
    'Klick auf Zuweisen, den Stift am Ende der Zeile. Datei zuweisen öffnet sich, benannt nach der Datei.',
  'help.guide.files-link.step.2':
    'Unter Notiz nimmt Notiz hinzufügen... eine Zeile auf, die dann in der Liste unter dem Namen der Datei steht. Sie wird in dem Moment gespeichert, in dem du das Feld verlässt.',
  'help.guide.files-link.step.3':
    'Unter Ort stehen die Orte der Reise, gruppiert nach dem Tag, auf dem sie liegen, mit Nicht zugewiesen am Ende für die ohne Tag. Klick einen an, und er bekommt einen Haken.',
  'help.guide.files-link.step.4':
    'Unter Buchung und Transport stehen die Buchungen der Reise. Klick die an, zu der das Dokument gehört; auch sie bekommt ihren Haken.',
  'help.guide.files-link.step.5':
    'Schließ mit dem ×. Einen Speichern-Knopf gibt es hier nicht: Jeder Klick wurde geschrieben, während du ihn gemacht hast.',
  'help.guide.files-link.result':
    'Die Zeile trägt die Notiz und ein Abzeichen je Verknüpfung, Tagesplan und den Namen des Ortes, Transport und den Namen des Fluges, und das Dokument hängt auch am Ort und am Flug.',
  'help.guide.files-link.tip.1':
    'Eine Datei kann mehrere Verknüpfungen auf einmal halten, sodass dieselbe Bestätigung zum Hotel und zu der Nacht gehört, die sie abdeckt.',
  'help.guide.files-link.tip.2':
    'Ein erneuter Klick auf einen angehakten Eintrag nimmt diese Verknüpfung weg; die Datei selbst bleibt.',
  'help.guide.files-link.tip.3':
    'Es geht auch andersherum: Ein Dokument, das an einem Ort oder an einer Buchung hängt, steht auch in dieser Liste, mit demselben Abzeichen an seiner Zeile.',
  // files-star
  'help.guide.files-star.title': 'Die wichtigen Dokumente oben halten',
  'help.guide.files-star.goal':
    'Hol die zwei, drei Papiere, die du wirklich brauchst, aus einer Liste heraus, die die ganze Reise lang wächst.',
  'help.guide.files-star.step.1':
    'Klick am Ende einer Zeile auf Markieren. Der Stern füllt sich gelb, ein zweiter Stern erscheint vor dem Namen der Datei, und der Knopf heißt jetzt Markierung entfernen.',
  'help.guide.files-star.step.2':
    'Die Liste sortiert sich neu: Markierte Dateien stehen über allen anderen, innerhalb jeder Gruppe die neuesten zuerst.',
  'help.guide.files-star.step.3':
    'Oben ist ein Stern zu den Reitern dazugekommen, mit der Zahl der markierten Dateien dahinter. Klick ihn an, um nur diese zu sehen.',
  'help.guide.files-star.result':
    'Die Papiere, die du am Schalter brauchst, stehen oben in der Liste, und ein Reiter zeigt nichts anderes.',
  'help.guide.files-star.tip.1':
    'Den Stern-Reiter gibt es nur, solange etwas markiert ist. Nimm die Markierung der letzten Datei weg, und der Reiter geht mit.',
  'help.guide.files-star.tip.2':
    'Markieren zählt als Bearbeitung: Ein Mitglied, das die Dateien der Reise nur lesen darf, sieht die Sterne, kann sie aber nicht setzen.',
  // files-filter
  'help.guide.files-filter.title': 'Ein Dokument in der Liste finden',
  'help.guide.files-filter.goal': 'Schränke eine Liste mit allem auf die eine Art Papier ein, die du suchst.',
  'help.guide.files-filter.step.1':
    'Die Reiter über der Liste sind Alle, PDFs, Bilder und Dokumente, jeder mit der Zahl der Dateien dahinter.',
  'help.guide.files-filter.step.2': 'Klick auf PDFs: Die Liste behält die PDF-Dateien und sonst nichts.',
  'help.guide.files-filter.step.3':
    'Zwei weitere Reiter kommen und gehen mit dem, was in der Reise liegt. Klick auf Collab Notizen, der da ist, sobald eine Notiz im Reiter Collab einen Anhang trägt: Die Liste behält diese Dateien und sonst nichts. Ein Stern reiht sich genauso ein, sobald eine Datei markiert ist.',
  'help.guide.files-filter.step.4': 'Alle holt die ganze Liste zurück.',
  'help.guide.files-filter.result':
    'Die Liste zeigt nur, was der Reiter nennt, und die Zahl an jedem Reiter sagt, wie viele das sind.',
  'help.guide.files-filter.tip.1':
    'Ordner gibt es hier nicht und Umbenennen auch nicht: Die Notiz in Datei zuweisen, die Verknüpfungen zu Orten und Buchungen und der Stern sind das, wonach ein Dokument sortiert wird.',
  'help.guide.files-filter.tip.2':
    'Die Liste selbst steht immer markiert zuerst, dann neueste zuerst, sodass ein heute hochgeladenes Dokument über einem vom letzten Monat steht.',
  // files-preview
  'help.guide.files-preview.title': 'Ein Dokument lesen, ohne TREK zu verlassen',
  'help.guide.files-preview.goal':
    'Sieh dir ein Ticket oder ein Bild an Ort und Stelle an und hol es auf deinen eigenen Rechner, wenn du es dort brauchst.',
  'help.guide.files-preview.step.1':
    'Klick auf den Namen eines Bildes oder auf sein Vorschaubild. Es öffnet sich im Vollbild, mit dem Namen der Datei und ihrer Stelle in den Bildern in der Kopfzeile.',
  'help.guide.files-preview.step.2':
    'Die runden Pfeile an den Seiten, die Pfeiltasten links und rechts und der Streifen mit Vorschaubildern unten führen durch jedes Bild, das die Liste gerade zeigt.',
  'help.guide.files-preview.step.3':
    'In neuem Tab öffnen und Herunterladen sitzen in der Kopfzeile; das × oder Escape schließt das Bild wieder.',
  'help.guide.files-preview.step.4':
    'Ein Dokument, das kein Bild ist, öffnet sich stattdessen in einer Vorschau über der Seite, mit denselben zwei Knöpfen in ihrer Kopfzeile. Diese schließt sich mit dem × oder mit einem Klick daneben.',
  'help.guide.files-preview.step.5':
    'Herunterladen am Ende einer Zeile speichert die Datei direkt auf deinem Rechner, ohne vorher etwas zu öffnen.',
  'help.guide.files-preview.result':
    'Das Dokument ist auf dem Bildschirm, und dieselben zwei Knöpfe legen es in einen Browser-Tab oder auf deine Festplatte.',
  'help.guide.files-preview.tip.1':
    'Auf einem Touchscreen wischst du durch die Bilder, statt auf die Pfeile zu klicken.',
  'help.guide.files-preview.tip.2':
    'Ein Wallet-Pass öffnet nie eine Vorschau: Er wird sofort heruntergeladen, damit das Telefon ihn an seine Wallet-App geben kann.',
  'help.guide.files-preview.tip.3':
    'In neuem Tab öffnen und Herunterladen holen die Datei beide mit deiner Sitzung, sodass ein aus der Adresszeile kopierter Link für andere nichts nützt.',
  // files-trash
  'help.guide.files-trash.title': 'Ein Dokument wegwerfen und zurückholen',
  'help.guide.files-trash.goal':
    'Räum weg, was die Reise nicht mehr braucht, ohne etwas zu verlieren, das du doch noch brauchst.',
  'help.guide.files-trash.step.1':
    'Klick am Ende einer Zeile auf Löschen. Die Datei verlässt die Liste sofort, und die Meldung lautet In den Papierkorb verschoben. Nichts fragt vorher.',
  'help.guide.files-trash.step.2':
    'Papierkorb am rechten Ende der Werkzeugleiste schaltet die Liste auf das um, was weggeworfen wurde. Die Überschrift lautet Papierkorb, und die Filterreiter sind weg.',
  'help.guide.files-trash.step.3':
    'Eine weggeworfene Zeile ist ausgegraut und hat noch zwei Knöpfe: Wiederherstellen, das die Datei zurückholt, und Löschen, das sie nach einer Rückfrage endgültig entfernt.',
  'help.guide.files-trash.step.4':
    'Klick auf Wiederherstellen. Die Meldung lautet Datei wiederhergestellt, und die Zeile verlässt den Papierkorb, mit ihrer Notiz und ihren Verknüpfungen noch daran.',
  'help.guide.files-trash.step.5':
    'Papierkorb leeren oben entfernt alles, was noch hier liegt, endgültig, und der Browser fragt einmal, bevor er das tut. Papierkorb schaltet zurück zu den Dateien.',
  'help.guide.files-trash.result': 'Die Datei ist wieder in der Liste, wo sie war, als wäre nichts gewesen.',
  'help.guide.files-trash.tip.1':
    'Löschen an einer Zeile fragt nicht vorher, und dafür ist der Papierkorb da: Nichts verlässt TREK, bevor du es hier drin sagst.',
  'help.guide.files-trash.tip.2':
    'Eine Datei wegwerfen und zurückholen braucht das Recht Dateien löschen. Ein Mitglied ohne dieses Recht sieht weder Löschen an der Zeile noch die Knöpfe im Papierkorb.',
  'help.guide.files-trash.tip.3': 'Eine im Papierkorb endgültig gelöschte Datei kann nicht zurückgeholt werden.',
  // files-sync
  'help.guide.files-sync.title': 'Die Dokumente mit deinem Dokumentenspeicher im Gleichstand halten',
  'help.guide.files-sync.goal':
    'Binde die Reise an deinen eigenen Dokumentenspeicher, damit, was hier hochgeladen wird, dort landet, und was dort abgelegt wird, hier auftaucht.',
  'help.guide.files-sync.step.1':
    'Klick auf Dokumentenabgleich, neben Papierkorb am rechten Ende der Werkzeugleiste. Der Dialog öffnet sich mit dem Namen der Reise unter seinem Titel. Links, unter Anbieter verbinden, stehen die Speicher, die ein Administrator eingeschaltet hat, jeder mit einer Zeile dazu, wie er ablegt: Paperless-ngx und Papra nach Tag, Nextcloud und Synology Drive in einem Ordner, OpenCloud in einem Space. Rechts steht Noch nichts verbunden.',
  'help.guide.files-sync.step.2':
    'Klick auf deinen Speicher, hier Nextcloud. Ein kleinerer Dialog für die Verbindung öffnet sich, benannt nach dem Speicher, und fragt nach dem, womit sich dieser Speicher anmeldet.',
  'help.guide.files-sync.step.3':
    'Füll Adresse und die Anmeldung des Speichers aus: einen API-Token bei Paperless-ngx, einen API-Schlüssel und die Organisations-ID bei Papra, Benutzername und ein App-Passwort bei Nextcloud, Benutzername und einen App-Token bei OpenCloud und bei Synology Drive Benutzername, Passwort und, wenn das Konto einen verlangt, einen Zwei-Faktor-Code. Nimm ein App-Passwort oder einen Token, wo immer der Speicher einen anbietet, nie dein Kontopasswort. Nextcloud und Synology Drive nehmen außerdem einen freiwilligen Basisordner, in dem TREK nach Reiseordnern sucht, hier /Reisen. Selbstsigniertes Zertifikat zulassen ganz unten ist nur für einen Speicher in deinem eigenen Netz mit so einem Zertifikat.',
  'help.guide.files-sync.step.4':
    'Klick auf Verbindung testen. TREK erreicht den Speicher mit dem, was du getippt hast, und die Fußzeile lautet Erreicht, angemeldet als, gefolgt vom Namen des Kontos. Abgewiesene Zugangsdaten oder eine nicht erreichbare Adresse werden dort stattdessen benannt, und gespeichert wird so oder so nichts.',
  'help.guide.files-sync.step.5':
    'Klick auf Verbinden. Die Verbindung wird mit der Reise gespeichert, und TREK fragt, wo die Reise im Speicher liegen soll: der Tag, der Ordner oder der Space, der ihre Dokumente hält. Nur, was dort liegt, wird abgeglichen. Neu anlegen legt ihn mit Anlegen an, mit einem aus dem Reisetitel vorausgefüllten Namen; unter Oder etwas Vorhandenes nehmen steht, was es schon gibt. Klick eins an, hier den Ordner Autumn in Japan.',
  'help.guide.files-sync.step.6':
    'Der Dialog ist zurück: Dein Speicher steht links unter Diese Reise, und seine Karte rechts trägt, wohin er abgleicht, wann er zuletzt gelaufen ist, und Jetzt abgleichen. Ein erster Lauf startet von selbst; Jetzt abgleichen startet einen, wann immer du willst. Ist ein Lauf durch, weicht das Abzeichen Noch nicht abgeglichen neben dem Namen einem grünen Punkt, Im Gleichstand, wenn du darauf zeigst, und der Flussbalken zählt die Dokumente, die TREK und der Speicher jeweils halten, mit den Spuren Raus zum Speicher und Rein vom Speicher dazwischen. Schließ den Dialog mit dem ×.',
  'help.guide.files-sync.result':
    'Die Dokumente, die schon dort lagen, stehen oben in der Liste, in deinem Namen hochgeladen, und jedes Dokument der Reise liegt auch im Speicher. Von nun an prüft TREK den Speicher im Hintergrund, und der Speicher folgt der Liste.',
  'help.guide.files-sync.tip.1':
    'Nur der Besitzer der Reise oder ein Instanz-Administrator kann eine Reise binden, denn die Zugangsdaten reichen an das ganze Konto beim Speicher heran. Jedes Mitglied kann Dokumentenabgleich öffnen, die Karte lesen und Jetzt abgleichen drücken.',
  'help.guide.files-sync.tip.2':
    'Ein Speicher in deinem eigenen Netz braucht ALLOW_INTERNAL_NETWORK=true auf dem TREK-Server, und seine Adresse muss die Adresse der Maschine im Netz sein, nie localhost. Ohne das antwortet Verbindung testen mit Diese Adresse ist nicht erlaubt.',
  'help.guide.files-sync.tip.3':
    'Trennen auf der Karte beendet die Paarung und behält jedes Dokument auf beiden Seiten. Ein zum zweiten Mal gebundener Tag, Ordner oder Space gilt als neu, und alles darin kommt noch einmal herein, also binde nach einem Trennen lieber einen leeren als den alten.',

  // ── Screen: trip-day-detail ───────────────────────────────────────────────────────────
  'help.ctx.trip-day-detail.title': 'Tagesdetails',
  'help.ctx.trip-day-detail.summary':
    'Das Panel, das die Kopfzeile eines Tages über der Karte öffnet: der Tag als Ganzes, sein Name und sein Datum, das Wetter dort, wo du sein wirst, die Buchungen, die auf ihn fallen, und die Nächte, die für ihn gebucht sind.',
  'help.ctx.trip-day-detail.bullet.1':
    'Klick in der Tage-Spalte auf die Kopfzeile eines Tages, und das Panel öffnet sich über der Mitte der Karte. Dieselbe Kopfzeile noch einmal, oder das X an ihrem rechten Rand, schließt es und lässt den Tag wieder los.',
  'help.ctx.trip-day-detail.bullet.2':
    'Die Kopfzeile trägt den Namen des Tages und sein Datum. Der Stift neben dem Namen benennt den Tag um, der Doppelchevron klappt das Panel zu einem schmalen Balken zusammen, damit die Karte wieder frei ist.',
  'help.ctx.trip-day-detail.bullet.3':
    'Ganz oben das Wetter des Tages. Vorhersage für nennt den Ort, für den es gilt: der erste Stopp des Tages oder das Hotel, in dem du aufwachst.',
  'help.ctx.trip-day-detail.bullet.4':
    'Reservierungen listet die Buchungen dieses Tages, jede mit ihrer Art, dem Stopp, zu dem sie gehört, und ihren Zeiten. Grün heißt bestätigt, bernsteinfarben noch ausstehend; es ist nur eine Anzeige, geändert werden Buchungen unter Buchungen.',
  'help.ctx.trip-day-detail.bullet.5':
    'Unterkunft zeigt jede Nacht, die über diesem Tag gebucht ist, mit Check-in und Check-out an den Tagen, an denen sie stattfinden, dem Check-in-Fenster, der Check-out-Zeit und der Bestätigungsnummer.',
  'help.ctx.trip-day-detail.bullet.6':
    'Unterkunft hinzufügen bucht eine Nacht auf diesem Tag: wähl das Haus aus den Orten der Reise, sag, welche Tage sie abdeckt, und trag die Zeiten und den Code nach.',
  // day-panel
  'help.guide.day-panel.title': 'Einen Tag öffnen und seine Details lesen',
  'help.guide.day-panel.goal':
    'Einen Tag ganz sehen, sein Wetter, seine Buchungen und wo du schläfst, ohne die Karte zu verlassen.',
  'help.guide.day-panel.step.1':
    'Klick in der Tage-Spalte auf die Kopfzeile eines Tages. Der Tag wird ausgewählt und seine Details öffnen sich über der Mitte der Karte.',
  'help.guide.day-panel.step.2':
    'Die Kopfzeile nennt den Tag, Tag 1, solange du ihm keinen Namen gibst, mit seinem Datum darunter.',
  'help.guide.day-panel.step.3':
    'Ganz oben das Wetter des Tages. Vorhersage für sagt, für welchen Ort es gilt: der erste Stopp des Tages oder das Hotel, in dem du aufwachst.',
  'help.guide.day-panel.step.4':
    'Reservierungen darunter listet die Buchungen, die auf diesen Tag fallen, mit ihren Zeiten.',
  'help.guide.day-panel.step.5':
    'Unterkunft zeigt die Nächte, die über diesem Tag gebucht sind, mit Check-in und Check-out an den Tagen, an denen sie stattfinden.',
  'help.guide.day-panel.step.6':
    'Der Doppelchevron in der Kopfzeile klappt das Panel zu einem schmalen Balken zusammen. Das X daneben schließt das Panel und lässt den Tag wieder los.',
  'help.guide.day-panel.result':
    'Zum Balken geklappt lässt das Panel die Karte frei und hält den Tag ausgewählt; geschlossen ist die Auswahl aufgehoben und der Plan wie zuvor.',
  'help.guide.day-panel.tip.1':
    'Ein Klick irgendwo auf den Kopfbalken des Panels klappt es ebenfalls zusammen. Der Chevron ist nur der Knopf dafür.',
  'help.guide.day-panel.tip.2':
    'Öffnest du aus der Orte-Spalte einen Ort, treten dessen Ortsdetails an die Stelle des Panels. Schließ sie, und der Tag ist wieder da.',
  // day-weather
  'help.guide.day-weather.title': 'Das Wetter des Tages lesen',
  'help.guide.day-weather.goal': 'Wissen, wie der Tag dort wird, wo du an diesem Tag tatsächlich bist.',
  'help.guide.day-weather.step.1':
    'Vorhersage für nennt den Ort, für den die Zahlen gelten: der erste Stopp des Tages oder, an einem Tag ohne Stopp, das Hotel, in dem du aufwachst.',
  'help.guide.day-weather.step.2':
    'Die große Zahl ist die Temperatur des Tages, daneben der Tiefst- und der Höchstwert und die Wetterlage in Worten.',
  'help.guide.day-weather.step.3':
    'Die Chips darunter: die Regenwahrscheinlichkeit, wie viel Niederschlag fällt, der stärkste Wind sowie Sonnenaufgang und Sonnenuntergang.',
  'help.guide.day-weather.step.4':
    'Ganz unten der Tag Stunde für Stunde, jede zweite Stunde: die Zeit, das Symbol, die Temperatur und die Regenwahrscheinlichkeit. Eine Stunde über 50 Prozent ist blau hinterlegt.',
  'help.guide.day-weather.result':
    'Die Tageskarte in der Tage-Spalte trägt dasselbe Wetter klein unter ihrer Nummer, sodass die ganze Reise auf einen Blick lesbar ist.',
  'help.guide.day-weather.tip.1':
    'Grad und Wind folgen Temperatureinheit unter Allgemein in den Einstellungen: wähl °F Fahrenheit, und dieselbe Vorhersage wird in °F und mph ausgegeben.',
  'help.guide.day-weather.tip.2':
    'Ein Tag ohne verorteten Stopp und ohne Hotel zum Aufwachen zeigt gar kein Wetter: die Vorhersage gilt immer einem Ort, nie der Reise.',
  'help.guide.day-weather.tip.3':
    'Weiter als 16 Tage voraus gibt es keine Vorhersage. Die Zahlen sind dann die Durchschnittswerte früherer Jahre für dieses Datum, mit Ø gekennzeichnet, und darunter steht es auch so.',
  // rename-day
  'help.guide.rename-day.title': 'Dem Tag einen Namen geben',
  'help.guide.rename-day.goal': 'Einen Tag nennen, was er ist, Ankunft in Kyoto oder Ruhetag, statt Tag 5.',
  'help.guide.rename-day.step.1': 'Öffne den Tag. In seiner Kopfzeile steht Tag 5, mit dem Datum darunter.',
  'help.guide.rename-day.step.2': 'Klick auf den Stift neben dem Namen.',
  'help.guide.rename-day.step.3': 'Der Name wird zu einem Feld. Tipp den Namen ein, den du willst.',
  'help.guide.rename-day.step.4':
    'Drück Enter, oder klick einfach woandershin; Escape verwirft die Änderung. Die Tageskarte in der Tage-Spalte trägt den Namen ebenfalls.',
  'help.guide.rename-day.result':
    'Der Name ersetzt Tag 5 im Panel und auf der Tageskarte in der Tage-Spalte; das Datum bleibt, wo es war.',
  'help.guide.rename-day.tip.1':
    'Leer das Feld und speicher, und der Tag heißt wieder Tag 5: die Nummer ist das, was ohne Namen steht.',
  'help.guide.rename-day.tip.2':
    'Der Name gehört dem Tag, nicht seinem Datum. Sortier die Tage um, und er wandert mit allem anderen dieses Tages mit.',
  // add-accommodation
  'help.guide.add-accommodation.title': 'Eine Nacht auf einem Tag buchen',
  'help.guide.add-accommodation.goal':
    'Das Hotel einmal in den Plan setzen, mit den Tagen, die es abdeckt, seinen Zeiten und seiner Bestätigungsnummer.',
  'help.guide.add-accommodation.step.1':
    'Das Haus muss zuerst ein Ort der Reise sein. Leg es in der Orte-Spalte an wie jeden anderen Ort: die Auswahl bietet nur an, was schon da ist.',
  'help.guide.add-accommodation.step.2':
    'Öffne den Tag deiner Ankunft und klick unter Unterkunft auf Unterkunft hinzufügen.',
  'help.guide.add-accommodation.step.3':
    'Auf Tage anwenden sagt, welche Nächte der Aufenthalt abdeckt: links der Check-in-Tag, rechts der Check-out-Tag. Alle nimmt die ganze Reise.',
  'help.guide.add-accommodation.step.4':
    'Füll Check-in, Bis und Check-out aus und trag die Nummer der Buchung unter Bestätigung ein. Alle vier dürfen leer bleiben.',
  'help.guide.add-accommodation.step.5':
    'Wähl das Haus aus den Orten der Reise. Die Chips über der Liste engen sie auf eine Kategorie ein.',
  'help.guide.add-accommodation.step.6': 'Klick auf Speichern.',
  'help.guide.add-accommodation.result':
    'Der Aufenthalt erscheint an jedem Tag, den er abdeckt, Check-in am ersten und Check-out am letzten. Das Haus wird zum Stopp am Check-in-Tag, sodass die Karte den Weg dorthin zeichnet, und unter Buchungen taucht eine Buchung vom Typ Unterkunft auf.',
  'help.guide.add-accommodation.tip.1':
    'Die Auswahl öffnet auf dem Tag, von dem du kamst, mit Check-out am Tag darauf; beide lassen sich vor dem Speichern verschieben.',
  'help.guide.add-accommodation.tip.2':
    'Gib dem Hotel beim Anlegen die Kategorie Hotel der Reise, dann engen die Chips über der Liste sie mit einem Klick auf deine Hotels ein.',
  'help.guide.add-accommodation.tip.3':
    'Die Zeiten sind alle optional: ein Aufenthalt ohne Check-in und ohne Code deckt seine Nächte trotzdem ab und zeichnet trotzdem seine Route.',
  // edit-accommodation
  'help.guide.edit-accommodation.title': 'Eine gebuchte Nacht ändern oder stornieren',
  'help.guide.edit-accommodation.goal':
    'Einen Aufenthalt verschieben, seine Zeiten korrigieren oder ihn wieder aus dem Plan nehmen.',
  'help.guide.edit-accommodation.step.1':
    'An jedem Tag des Aufenthalts zeigt die Karte des Aufenthalts das Haus, das Check-in-Fenster, die Check-out-Zeit und die Bestätigungsnummer.',
  'help.guide.edit-accommodation.step.2':
    'Der Stift an ihrem rechten Rand öffnet den Aufenthalt wieder. Das Fenster heißt jetzt Unterkunft bearbeiten.',
  'help.guide.edit-accommodation.step.3':
    'Korrigier die Reihe der Felder: Check-in, Bis, Check-out und Bestätigung. Die Tage darüber und das Haus darunter lassen sich hier ebenfalls ändern.',
  'help.guide.edit-accommodation.step.4': 'Klick auf Speichern.',
  'help.guide.edit-accommodation.step.5':
    'Das X neben dem Stift beendet den Aufenthalt. Es fragt nichts, und die Buchung vom Typ Unterkunft, die zu ihm gehört, geht mit.',
  'help.guide.edit-accommodation.result':
    'Die Änderung erreicht jeden Tag, den der Aufenthalt abdeckt, auf einmal, und die Buchung vom Typ Unterkunft unter Buchungen mit.',
  'help.guide.edit-accommodation.tip.1':
    'Eine Nacht mitten in einem Aufenthalt trägt weder das Label Check-in noch Check-out: nur der erste und der letzte Tag der Spanne tun das.',
  'help.guide.edit-accommodation.tip.2':
    'Mit dem Aufenthalt verschwinden auch der Stopp, den er auf den Check-in-Tag gesetzt hat, und alle Kosten, die an seiner Buchung hängen. War es ein Versehen, buch die Nacht einfach neu.',
  // day-bookings
  'help.guide.day-bookings.title': 'Die Buchungen des Tages auf einen Blick',
  'help.guide.day-bookings.goal':
    'An einer Stelle sehen, was für diesen Tag schon gebucht ist und ob es bestätigt ist.',
  'help.guide.day-bookings.step.1':
    'Reservierungen listet die Buchungen des Tages: die, die auf ihn datiert sind, und die, die an einem seiner Stopps hängen.',
  'help.guide.day-bookings.step.2':
    'Eine Zeile zeigt, welche Art von Buchung es ist, ihren Namen und, wenn sie zu einem Stopp gehört, diesen Stopp nach einem Punkt. Ihre Zeiten stehen am rechten Ende.',
  'help.guide.day-bookings.step.3':
    'Die Farbe sagt, wo eine Buchung steht: eine grüne Zeile ist bestätigt, eine bernsteinfarbene noch ausstehend. Unterkünfte stehen nicht in dieser Liste, sie haben ihren eigenen Block darunter.',
  'help.guide.day-bookings.step.4':
    'Die Liste gibt die Buchungen nur wieder. Angelegt und geändert wird eine Buchung unter Buchungen.',
  'help.guide.day-bookings.result':
    'Alles, was auf den Tag datiert ist, und alles, was an einem seiner Stopps hängt, steht in dieser einen Liste.',
  'help.guide.day-bookings.tip.1':
    'Eine Buchung landet über ihr eigenes Datum auf einem Tag. Änder das Datum unter Buchungen, und sie wandert von selbst auf den anderen Tag.',
  'help.guide.day-bookings.tip.2':
    'Kein Block Reservierungen heißt, der Tag hat keine Buchungen: er wird ausgeblendet statt leer gezeigt.',

  // ── Screen: trip-map ──────────────────────────────────────────────────────────────────
  'help.ctx.trip-map.title': 'Karte',
  'help.ctx.trip-map.summary':
    'Die Mitte des Plans: jeder Ort der Reise als Pin, die Routen, die sie verbinden, und die Schalter an den Rändern der Karte für Satellit, für die ganze Reise auf einmal und für die Orte rund um den Stadtteil, den du gerade ansiehst.',
  'help.ctx.trip-map.bullet.1':
    'Ein Pin ist ein Ort: sein eigenes Foto, wenn er eines hat, sonst die Farbe seiner Kategorie mit dem Kategorie-Symbol. Halt den Zeiger darauf, und ein Kärtchen zeigt seinen Namen und seine Adresse, dazu seine Kategorie und seine Bewertung, wo der Ort sie trägt. Zieh einen Pin auf eine Tageskarte, um den Ort dort einzuplanen.',
  'help.ctx.trip-map.bullet.2':
    'Pins, die zu dicht beieinander liegen, um sie auseinanderzuhalten, fallen zu einer dunklen Blase mit einer Zahl zusammen. Klick die Blase an, und die Karte zoomt auf das, was darin steckt.',
  'help.ctx.trip-map.bullet.3':
    'Klick einen Pin an, und der Ort öffnet sich unter der Karte, mit seiner Bewertung, seinen Dateien und dem, was als Nächstes damit geht; ein Klick auf eine leere Stelle der Karte schließt ihn wieder.',
  'help.ctx.trip-map.bullet.4':
    'Ist in der Tage-Spalte ein Tag geöffnet, tragen seine Stopps ein kleines weißes Abzeichen mit ihrer Nummer an diesem Tag, und ein Ort, der an zwei Tagen geplant ist, trägt beide Nummern, verbunden durch ·.',
  'help.ctx.trip-map.bullet.5':
    'Die Symbolreihe oben durchsucht den Kartenausschnitt, den du siehst: Restaurants, Cafés, Bars & Nachtleben, Unterkünfte, Sehenswürdigkeiten, Museen & Kultur, Natur & Parks und Aktivitäten. Diesen Bereich durchsuchen startet sie erneut, nachdem du die Karte bewegt hast.',
  'help.ctx.trip-map.bullet.6':
    'Ein Rechtsklick irgendwo auf der Karte öffnet das Ortsformular an dieser Stelle, mit bereits nachgeschlagener Adresse. Der runde Knopf unten links tauscht die gezeichnete Karte gegen Luftbilder.',
  'help.ctx.trip-map.bullet.7':
    'Ganze Reise anzeigen unten rechts zeichnet jeden Reisetag auf einmal und listet auf, was jeder abdeckt; das Routensymbol in der Zeile einer Buchung zeichnet diese Buchung, und das in der Werkzeugleiste über den Tagen zeichnet alle.',
  // map-markers
  'help.guide.map-markers.title': 'Die Karte lesen',
  'help.guide.map-markers.goal': 'Wissen, was dir jeder Pin, jedes Abzeichen und jede Blase auf der Karte sagt.',
  'help.guide.map-markers.step.1':
    'Die Karte trägt jeden Ort der Reise. Wo Pins zu dicht beieinander sitzen, um sie auseinanderzuhalten, fallen sie zu einer dunklen Blase zusammen, die die Zahl darin trägt; klick die Blase an, und die Karte zoomt auf das, was darin war, oder fächert die Pins bei der tiefsten Zoomstufe auf.',
  'help.guide.map-markers.step.2':
    'Ein Pin ist das eigene Foto des Ortes, wenn er eines hat, sonst die Farbe seiner Kategorie mit dem Kategorie-Symbol. Halt den Zeiger darauf, und ein Kärtchen nennt seinen Namen und seine Adresse, dazu seine Kategorie und seine Bewertung, wo der Ort sie trägt.',
  'help.guide.map-markers.step.3':
    'Klick einen Pin an, und der Ort öffnet sich in einem Kärtchen unter der Karte: seine Koordinaten, seine Bewertung, seine Dateien und am unteren Rand, was als Nächstes mit ihm geschehen soll, darunter Navigation, Bearbeiten und Löschen, und Zum Tag hinzufügen, solange ein Tag geöffnet ist. Ein Klick auf eine leere Stelle der Karte schließt ihn wieder.',
  'help.guide.map-markers.step.4':
    'Öffne in der Tage-Spalte einen Tag, und seine Stopps werden nummeriert: Das kleine weiße Abzeichen an der Ecke eines Pins ist der Platz dieses Stopps im Tag. Ein Ort, der an zwei Tagen geplant ist, trägt beide Nummern, verbunden durch ·. Ohne geöffneten Tag gibt es keine Nummern, und die Ecke trägt stattdessen die Bewertung.',
  'help.guide.map-markers.step.5':
    'Zieh einen Pin von der Karte auf eine Tageskarte in der Tage-Spalte, und der Ort ist an diesem Tag eingeplant, genau wie wenn du seine Zeile aus der Orte-Liste ziehst.',
  'help.guide.map-markers.result':
    'An der Reise hat sich nichts geändert: Die Karte ist eine Ansicht davon, und jeder Pin sagt, welcher Ort, welcher Tag und in welcher Reihenfolge.',
  'help.guide.map-markers.tip.1':
    'Ein Tag, der in der Tage-Spalte zugeklappt ist, nimmt seine Stopps von der Karte mit; klapp den Tag wieder auf, und sie sind zurück.',
  'help.guide.map-markers.tip.2':
    'Der Filter über der Orte-Liste entscheidet auch, was die Karte zeichnet: Wähl Ungeplant, und es bleiben nur die Orte darauf, die noch keinen Tag haben.',
  'help.guide.map-markers.tip.3':
    'Auf dieser Karte gibt es keine Zoom-Knöpfe: Das Mausrad zoomt, ein Doppelklick zoomt eine Stufe hinein, und das Ziehen der Karte selbst verschiebt sie.',
  // map-nearby-places
  'help.guide.map-nearby-places.title': 'Orte in deiner Umgebung auf der Karte finden',
  'help.guide.map-nearby-places.goal':
    'Lass die Karte im Stadtteil, den du gerade ansiehst, nach Restaurants, Sehenswürdigkeiten oder einem Hotel suchen, und hol einen davon in die Reise.',
  'help.guide.map-nearby-places.step.1':
    'Die Symbolreihe oben auf der Karte ist die Kategoriesuche: Restaurants, Cafés, Bars & Nachtleben, Unterkünfte, Sehenswürdigkeiten, Museen & Kultur, Natur & Parks und Aktivitäten.',
  'help.guide.map-nearby-places.step.2':
    'Klick eine Kategorie an. TREK sucht diese Art von Ort in dem Kartenausschnitt, den du siehst, und setzt für jeden Treffer einen Pin in der Farbe der Kategorie. Immer nur eine Kategorie: Ein Klick auf eine andere tauscht sie aus, und ein Klick auf die eingeschaltete schaltet sie aus.',
  'help.guide.map-nearby-places.step.3':
    'Bewegst du die Karte, erscheint unter der Reihe ein zweiter Knopf: Diesen Bereich durchsuchen startet dieselbe Suche für den neuen Ausschnitt. Bewegen allein sucht nie von selbst neu, das hält die Zahl der Anfragen niedrig.',
  'help.guide.map-nearby-places.step.4':
    'Die Pins tragen den Namen dessen, was gefunden wurde. Klick einen an, und das Ortsformular öffnet sich schon daraus ausgefüllt: Name, Adresse, Breitengrad und Längengrad sowie Website und Telefonnummer, wo OpenStreetMap sie hat.',
  'help.guide.map-nearby-places.step.5':
    'Prüf, was ausgefüllt wurde, und ergänz, was die Suche nicht wissen konnte: eine Beschreibung, eine Kategorie, eigene Notizen.',
  'help.guide.map-nearby-places.step.6':
    'Klick auf Hinzufügen. Liegt schon ein Ort gleichen Namens in der Reise, sagt das Formular es, und der Knopf wird zu Trotzdem hinzufügen.',
  'help.guide.map-nearby-places.result':
    'Der Ort steht in der Orte-Liste und auf der Karte als einer der eigenen Pins der Reise, unter Ungeplant, bis du ihn auf einen Tag legst. Die Such-Pins bleiben, bis du die Kategorie ausschaltest.',
  'help.guide.map-nearby-places.tip.1':
    'Die Reihe fehlt, wenn Orte auf der Karte entdecken in den Einstellungen unter Reise & Karte aus ist.',
  'help.guide.map-nearby-places.tip.2':
    'Die Antworten kommen aus dem TREK-Ortsindex und von OpenStreetMap, also ist das eines der wenigen Dinge im Plan, die eine Verbindung brauchen.',
  'help.guide.map-nearby-places.tip.3':
    'Eine Suche deckt ab, was auf dem Bildschirm steht, also zoom auf die Straße, nach der du fragst: Eine ganze Stadt antwortet mit den ersten sechzig Treffern und wenig Ordnung darin.',
  // map-add-place
  'help.guide.map-add-place.title': 'Einen Ort per Rechtsklick auf die Karte anlegen',
  'help.guide.map-add-place.goal': 'Setz einen Ort genau dorthin, wo du ihn willst, ohne ihn vorher zu suchen.',
  'help.guide.map-add-place.step.1':
    'Rechtsklick auf die Stelle der Karte, die du meinst. Das Ortsformular öffnet sich, überschrieben mit Ort/Aktivität hinzufügen.',
  'help.guide.map-add-place.step.2':
    'Breitengrad und Längengrad stehen schon auf dieser Stelle, und TREK schlägt die Koordinaten nach und füllt Adresse mit dem, was es dort findet, und auch Name, wo die Suche einen hergibt. Gespeichert ist noch nichts, überschreib also, was nicht stimmt.',
  'help.guide.map-add-place.step.3':
    'Gib ihm einen Namen, den du wiedererkennst, und den Rest, den der Plan wissen soll: Beschreibung, Notizen, Kategorie, Website.',
  'help.guide.map-add-place.step.4':
    'Klick auf Hinzufügen. Der Ort landet auch bei geöffnetem Tag ungeplant in der Liste: Ein Rechtsklick auf die Karte sagt wo, nicht wann.',
  'help.guide.map-add-place.result':
    'Der Ort steht in der Liste und auf der Karte, unter Ungeplant, bis du ihn auf einen Tag legst.',
  'help.guide.map-add-place.tip.1':
    'Die Adresse kommt aus einem Nachschlagen der Koordinaten, sie kann sich also eher wie eine Straße als wie ein Name lesen, und über freiem Land kann sie leer zurückkommen. Beide Felder darfst du überschreiben.',
  'help.guide.map-add-place.tip.2':
    'Auf den Karten von MapLibre GL und Mapbox GL tut ein Klick mit der mittleren Maustaste dasselbe, und auf einem Touchscreen ein langes Drücken.',
  // map-satellite
  'help.guide.map-satellite.title': 'Auf Satellit umschalten',
  'help.guide.map-satellite.goal': 'Tausch die gezeichnete Karte gegen Luftbilder und wieder zurück.',
  'help.guide.map-satellite.step.1':
    'Der runde Knopf unten links auf der Karte ist der Umschalter für die Grundebene. Sein Symbol zeigt immer die Ebene, zu der er wechseln würde, und wenn du darauf zeigst, sagt er welche: Zur Satellitenansicht wechseln. Klick ihn an.',
  'help.guide.map-satellite.step.2':
    'Die Karte ist jetzt ein Luftbild, tief genug, um ein einzelnes Gebäude zu erkennen, und ohne eigenen Schlüssel. Alles, was TREK zeichnet, bleibt darüber: die Pins, die Route des Tages, die Tracks und die Buchungsrouten.',
  'help.guide.map-satellite.step.3':
    'Der Knopf heißt jetzt Zur Kartenansicht wechseln. Klick ihn an, um zur gezeichneten Karte zurückzugehen.',
  'help.guide.map-satellite.result':
    'Die Karte ist wieder gezeichnet, und die Ebene, auf der du sie gelassen hast, wird in deinem Konto gemerkt.',
  'help.guide.map-satellite.tip.1':
    'Die Wahl hängt an deinem Konto und nicht an der Reise, also öffnet sich jede Reise so, wie du sie verlassen hast, mit welchem Karten-Renderer auch immer.',
  'help.guide.map-satellite.tip.2':
    'Die Luftbilder tragen keine Schrift: Straßennamen, Stadtteile und Hausnummern stehen auf der gezeichneten Karte, schalt also zurück, wenn du eine Adresse suchst.',
  // map-whole-trip
  'help.guide.map-whole-trip.title': 'Die ganze Reise und ihre Entfernungen sehen',
  'help.guide.map-whole-trip.goal':
    'Tausch den einen geöffneten Tag gegen jeden Reisetag der Reise und lies ab, wie weit jeder führt.',
  'help.guide.map-whole-trip.step.1':
    'Der runde Knopf Ganze Reise anzeigen sitzt unten rechts auf der Karte. Klick ihn an, und jeder Reisetag der Reise wird auf einmal gezeichnet, jeder in seiner eigenen Farbe über einer weißen Umrandung, damit benachbarte Tage auseinanderbleiben.',
  'help.guide.map-whole-trip.step.2':
    'Das Kärtchen über dem Knopf listet diese Tage auf: ein Farbpunkt, der Name des Tages, ein Symbol für jede Art, wie du ihn zurücklegst, und die Strecke, die er abdeckt. Gesamtstrecke steht ganz oben.',
  'help.guide.map-whole-trip.step.3':
    'Klick im Kärtchen einen Tag an, um ihn zu wählen, genau wie in der Tage-Spalte: Die Karte rückt diesen Tag ins Bild, und seine Stopps bekommen ihre Nummern zurück.',
  'help.guide.map-whole-trip.step.4':
    'Der Knopf heißt jetzt Ganze Reise ausblenden. Drück ihn, um auf den einen geöffneten Tag zurückzugehen.',
  'help.guide.map-whole-trip.result':
    'Jeder Reisetag ist in seiner eigenen Farbe gezeichnet, und das Kärtchen sagt, was jeder abdeckt und worauf die Reise kommt.',
  'help.guide.map-whole-trip.tip.1':
    'Die Summe kommt immer nur ein paar Etappen auf einmal herein. Solange ein … darauf folgt, ist die Zahl noch eine Teilsumme; sie steht fest, sobald jede Etappe geantwortet hat.',
  'help.guide.map-whole-trip.tip.2':
    'Eine Etappe, die der Router verweigert, bleibt eine gerade Linie und zählt nichts, und das Kärtchen sagt es, statt still zu niedrig zu stehen.',
  'help.guide.map-whole-trip.tip.3':
    'Ein Tag mit weniger als zwei verorteten Stopps hat keine Route zu zeichnen und fehlt deshalb ganz im Kärtchen.',
  // map-booking-routes
  'help.guide.map-booking-routes.title': 'Die Route einer Buchung auf der Karte zeigen',
  'help.guide.map-booking-routes.goal':
    'Zeichne die Flüge, Züge und Fahrten, die du gebucht hast, auf die Karte und nimm sie wieder herunter.',
  'help.guide.map-booking-routes.step.1':
    'Buchungsrouten sind aus, bis du eine anforderst. In der Zeile einer Buchung in der Tage-Spalte sitzt ein kleines Routensymbol: Buchungsrouten anzeigen.',
  'help.guide.map-booking-routes.step.2':
    'Klick es an, und die Buchung erscheint auf der Karte: ein Flug als Großkreisbogen, eine Fahrt entlang der echten Straßen, ein Zug als Kette seiner Bahnhöfe. Bestätigt wird durchgezogen gezeichnet, Ausstehend gestrichelt, und die Enden der Route sind blaue Pillen mit dem Symbol des Transports.',
  'help.guide.map-booking-routes.step.3':
    'Klick eine Endpille an, und die Buchung dahinter öffnet sich, mit ihren Zeiten, ihrer Referenz und dem Ort, an dem sie beginnt. Schließen räumt sie wieder weg.',
  'help.guide.map-booking-routes.step.4':
    'Das Routensymbol in der Werkzeugleiste über den Tagen macht die ganze Reise auf einmal: Alle Buchungsrouten anzeigen zeichnet jede Buchung, die eine hat.',
  'help.guide.map-booking-routes.step.5':
    'Es ist ein sauberer Anfang und keine Ebene obendrauf, was du also Buchung für Buchung gewählt hast, fällt weg. Drück es noch einmal, jetzt Alle Buchungsrouten ausblenden, und die Karte ist leer.',
  'help.guide.map-booking-routes.result':
    'Die Buchungen, die du angefordert hast, sind auf der Karte gezeichnet, und die Wahl bleibt für diese Reise in diesem Browser, bis du sie änderst.',
  'help.guide.map-booking-routes.tip.1':
    'Die Enden tragen den Flughafencode oder den Namen des Bahnhofs nur, wenn Orts-Labels auf Buchungsrouten in den Einstellungen unter Reise & Karte an ist; sonst zeigen sie nur das Symbol.',
  'help.guide.map-booking-routes.tip.2':
    'Buchungsrouten immer anzeigen, in denselben Einstellungen, zeichnet sie von Anfang an auf jeder Reise, über die du nicht schon entschieden hast.',
  'help.guide.map-booking-routes.tip.3':
    'Eine Buchung braucht zwei Enden mit Koordinaten, bevor sie gezeichnet werden kann, ein Hotel oder ein Restaurant trägt also kein Routensymbol.',
  'help.ctx.trip-map.bullet.8':
    'Mit eingeschaltetem Dawarich-Addon zeichnet der runde Dawarich-Knopf unter Ganze Reise anzeigen die Route, die dein Telefon tatsächlich aufgezeichnet hat: Aufgezeichnete Route anzeigen legt sie gestrichelt unter die geplante Route, eine Farbe pro Tag, und die Beschriftung des Knopfes sagt, warum keine Linie da ist, wenn keine da ist.',
  // map-dawarich-trail
  'help.guide.map-dawarich-trail.title': 'Die Route zeigen, die du tatsächlich zurückgelegt hast',
  'help.guide.map-dawarich-trail.goal':
    'Leg die Route, die Dawarich auf deinem Telefon aufgezeichnet hat, über die Karte, gestrichelt neben die geplante, und lies die Reise Tag für Tag so, wie sie wirklich gelaufen ist.',
  'help.guide.map-dawarich-trail.step.1':
    'Der runde Dawarich-Knopf sitzt unten rechts auf der Karte, unter Ganze Reise anzeigen; hältst du den Zeiger darauf, sagt er Aufgezeichnete Route anzeigen. Klick ihn an. TREK fragt dein Dawarich nach den Daten der Reise, und ein Ring dreht sich um den Knopf, solange die Antwort unterwegs ist.',
  'help.guide.map-dawarich-trail.step.2':
    'Die aufgezeichnete Route landet als gestrichelte Linie, eine Farbe pro Tag, unter die geplante Route gezeichnet, damit der Plan lesbar bleibt. Der Knopf heißt jetzt Aufgezeichnete Route ausblenden. Tage werden um Mitternacht Ortszeit getrennt, und ein in der Tage-Spalte zugeklappter Tag nimmt seine gestrichelte Linie mitsamt seinen Stopps von der Karte.',
  'help.guide.map-dawarich-trail.step.3':
    'Klick zusätzlich auf Ganze Reise anzeigen, und jeder geplante Tag wird durchgezogen neben die gestrichelte Aufzeichnung gezeichnet. Wo beide zusammenlaufen, lief der Tag wie geplant; wo die gestrichelte Linie abschweift, tat er es nicht.',
  'help.guide.map-dawarich-trail.result':
    'Was du geplant und was du tatsächlich getan hast, liegt zusammen auf der Karte, gestrichelt gegen durchgezogen, und das Kärtchen über den Knöpfen listet weiter die geplanten Tage und ihre Entfernungen.',
  'help.guide.map-dawarich-trail.tip.1':
    'An oder aus wird pro Reise für diese Browser-Sitzung gemerkt. Solange die Route an ist, fragt TREK Dawarich alle zwei Minuten erneut, sodass eine laufende Reise ohne Neuladen aufholt; die Route selbst wird nie gespeichert, sie ist also weder in der Datenbank von TREK noch in Backups noch offline da.',
  'help.guide.map-dawarich-trail.tip.2':
    'Die Beschriftung des Knopfes erklärt eine leere Karte: Aufgezeichnete Route wird geladen…, solange sie unterwegs ist, An diesen Tagen wurde nichts aufgezeichnet, Die aufgezeichnete Route konnte nicht geladen werden, oder Die aufgezeichnete Route braucht eine Verbindung, wenn TREK offline ist.',
  // map-compass
  'help.guide.map-compass.title': 'Die Karte drehen und Norden wiederfinden',
  'help.guide.map-compass.goal':
    'Dreh die Karte in die Richtung, in die du unterwegs bist, und lass sie mit einem Klick zurück nach Norden schnappen.',
  'help.guide.map-compass.step.1':
    'Dreh die Karte mit gedrückter rechter Maustaste, oder halt Ctrl und zieh mit der linken; auf einem Touchscreen dreh mit zwei Fingern. Der runde Kompass neben der Reihe der Kategorie-Symbole oben auf der Karte dreht sich mit: Sein Pfeil zeigt immer nach Norden, er neigt sich also so weit, wie du gedreht hast.',
  'help.guide.map-compass.step.2':
    'Klick auf den Kompass. Reset north, so heißt der Knopf, führt die Karte sanft zurück auf Norden oben und in eine flache Ansicht, und der Pfeil steht wieder aufrecht.',
  'help.guide.map-compass.result':
    'Die Karte ist wieder genordet und eben, und an der Reise hat sich nichts geändert: Der Kompass bewegt nur die Kamera.',
  'help.guide.map-compass.tip.1':
    'Den Kompass gibt es nur auf den Karten MapLibre GL und Mapbox GL; die Leaflet-Karte lässt sich nicht drehen, also hat sie keinen. Kartenanbieter in den Einstellungen, unter Karte, entscheidet, welche du benutzt, und Karte speichern behält die Wahl.',
  'help.guide.map-compass.tip.2':
    'Der Klick nimmt auch die Neigung heraus: Ein Ziehen mit der rechten Maustaste nach oben oder unten kippt die Ansicht, und Reset north richtet sie mitsamt der Drehung wieder gerade. Auf Mapbox GL mit eingeschaltetem 3D-Gebäude & Terrain macht das auch die 3D-Ansicht flach, bis du sie erneut kippst.',

  // ── Screen: trip-collab ───────────────────────────────────────────────────────────────
  'help.ctx.trip-collab.title': 'Collab',
  'help.ctx.trip-collab.summary':
    'Der Tab, in dem die Gruppe gemeinsam plant: links der Chat, daneben die gemeinsamen Notizen und Links, darunter die Umfragen und am Ende Nächste. Alles, was hier geschrieben wird, steht sofort auf dem Bildschirm jedes anderen Mitglieds, ohne Neuladen.',
  'help.ctx.trip-collab.bullet.1':
    'Der Chat ist die linke Spalte. Schreib in Nachricht eingeben... und drück Enter; Shift und Enter machen eine neue Zeile. Das Smiley setzt ein Emoji ein, Bilder anhängen hängt bis zu vier Bilder an die Nachricht.',
  'help.ctx.trip-collab.bullet.2':
    'Fahr über eine Nachricht für Antworten und, bei deiner eigenen, Löschen; mit Rechtsklick kommen die acht schnellen Reaktionen. Eine gelöschte Nachricht hinterlässt eine Zeile, die sagt, dass du sie gelöscht hast.',
  'help.ctx.trip-collab.bullet.3':
    'Notizen ist der gemeinsame Block: Neue Notiz schreibt eine, und das Zahnrad daneben öffnet Kategorien verwalten für ihre Namen und Farben. Eine Karte trägt Erweitern, Anheften, Bearbeiten und Löschen.',
  'help.ctx.trip-collab.bullet.4':
    'Links sammelt die Adressen, auf denen die Reise läuft. Link hinzufügen nimmt einen Titel und eine http- oder https-Adresse; Link bearbeiten, Link anheften und Link löschen sitzen am Ende des Chips, und angeheftete Links bleiben vorn.',
  'help.ctx.trip-collab.bullet.5':
    'Umfragen entscheiden Dinge. Neue Umfrage stellt eine Frage mit mindestens zwei Optionen; ein Klick auf eine Option ist deine Stimme, Schließen beendet die Abstimmung und Löschen entfernt die Umfrage.',
  'help.ctx.trip-collab.bullet.6':
    'Nächste listet die Stopps der Reise, die noch bevorstehen, bis zu acht davon, mit ihren Uhrzeiten und den Leuten, die dabei sind. Es liest nur den Tagesplan; die Zeiten werden dort gesetzt.',
  // write-note
  'help.guide.write-note.title': 'Eine gemeinsame Notiz schreiben',
  'help.guide.write-note.goal':
    'Leg das, was die ganze Gruppe braucht, eine Regel, eine Adresse, eine Erinnerung, dorthin, wo es jeder wiederfindet.',
  'help.guide.write-note.step.1': 'Klick oben im Notizen-Panel auf Neue Notiz. Das Formular öffnet sich.',
  'help.guide.write-note.step.2':
    'Notiztitel ist der Name, den die Karte trägt. Er ist das Einzige, worauf das Formular besteht: Erstellen bleibt grau, solange nichts darin steht.',
  'help.guide.write-note.step.3':
    'Das große Feld darunter hält den Text und nimmt Markdown: ein fettes Wort, eine Liste, eine Überschrift. Die Karte zeigt die ersten Zeilen, und Erweitern darauf öffnet die ganze Notiz.',
  'help.guide.write-note.step.4':
    'Wähl unter Kategorie die, zu der die Notiz gehört; ihre Farbe wird zur Farbe der Karte. Die Pillen sind die Kategorien, die es schon gibt, und eine neue entsteht unter Kategorien verwalten.',
  'help.guide.write-note.step.5':
    'Website nimmt einen Link, der zur Notiz gehört. Die Karte trägt dann eine Kachel Link, die ihn öffnet.',
  'help.guide.write-note.step.6': 'Klick auf Erstellen.',
  'help.guide.write-note.result':
    'Die Notiz ist eine Karte im Notizen-Panel, in der Farbe ihrer Kategorie, und sie steht schon auf dem Bildschirm jedes anderen Mitglieds.',
  'help.guide.write-note.tip.1':
    'Anheften auf einer Karte hält sie oben im Panel; alles darunter ist danach sortiert, wann es zuletzt geändert wurde.',
  'help.guide.write-note.tip.2':
    'Das Zahnrad neben Neue Notiz öffnet Kategorien verwalten: dort bekommt eine Kategorie ihre Farbe, wird überall auf einmal umbenannt oder wird angelegt, bevor eine Notiz sie benutzt.',
  'help.guide.write-note.tip.3':
    'Dateien anhängen hängt ein Dokument an die Notiz. Anhängen öffnet die Dateiauswahl, und ein Bild oder ein PDF lässt sich auch einfach ins Formular einfügen.',
  'help.guide.write-note.tip.4':
    'Notizen ist ein eigener Schalter unter Addons, unter Collab: ein Admin kann sie ausschalten und den Chat, die Links, die Umfragen und Was kommt als Nächstes laufen lassen.',
  // shared-links
  'help.guide.shared-links.title': 'Die Links der Reise sammeln',
  'help.guide.shared-links.goal':
    'Halt das Buchungsportal, das geteilte Album und den Fahrplan an einem Ort, statt den Chat danach abzusuchen.',
  'help.guide.shared-links.step.1': 'Klick oben im Links-Panel auf Link hinzufügen.',
  'help.guide.shared-links.step.2':
    'Gib dem Link in Linktitel einen Namen, füg die Adresse in das Feld darunter ein und klick dann auf Link speichern.',
  'help.guide.shared-links.step.3':
    'Der Chip zeigt den Namen und die Seite, auf die er zeigt. Ein Klick darauf öffnet die Seite in einem neuen Tab.',
  'help.guide.shared-links.step.4':
    'Die drei kleinen Knöpfe an seinem Ende sind Link bearbeiten, Link anheften und Link löschen. Link anheften schiebt den Chip an den Anfang des Panels; Link löschen fragt nichts.',
  'help.guide.shared-links.result':
    'Der Link ist ein Chip im Links-Panel, vorn angeheftet, und sofort auf dem Bildschirm jedes Mitglieds.',
  'help.guide.shared-links.tip.1':
    'Nur http- und https-Adressen werden genommen; das Feld weist alles andere ab, bevor es speichert.',
  'help.guide.shared-links.tip.2':
    'Angeheftete Links kommen zuerst, dann die neuesten. Das kleine Symbol neben einem Titel ist das eigene Favicon der Seite, von der Seite selbst geholt, ohne Internet zeigt der Chip also stattdessen ein einfaches Link-Zeichen.',
  'help.guide.shared-links.tip.3':
    'Links ist ein eigener Schalter unter Addons, unter Collab, ein Admin kann das Panel also ausschalten, ohne den Rest des Tabs anzurühren.',
  // create-poll
  'help.guide.create-poll.title': 'Die Gruppe fragen',
  'help.guide.create-poll.goal':
    'Mach aus einer Frage, die im Chat niemand beantwortet, eine Umfrage, die jeder ankreuzen kann.',
  'help.guide.create-poll.step.1': 'Klick oben im Umfragen-Panel auf Neue Umfrage.',
  'help.guide.create-poll.step.2':
    'Schreib die Frage. Markdown wird unterstützt unter dem Feld heißt: ein fettes Wort, ein Zeilenumbruch oder eine kurze Liste funktionieren hier.',
  'help.guide.create-poll.step.3': 'Füll Option 1 und Option 2 aus. Zwei Optionen mit Inhalt sind das Minimum.',
  'help.guide.create-poll.step.4':
    '+ Option hinzufügen fügt eine dritte an, eine vierte, so viele wie du brauchst; das kleine Kreuz neben einer Zeile nimmt eine wieder weg.',
  'help.guide.create-poll.step.5':
    'Mehrfachauswahl lässt jeden mehr als eine Option ankreuzen. Bleibt sie aus, wandert eine Stimme mit, wenn jemand etwas anderes wählt.',
  'help.guide.create-poll.step.6': 'Klick auf Umfrage erstellen.',
  'help.guide.create-poll.result': 'Die Umfrage steht oben im Umfragen-Panel, offen, und noch hat niemand abgestimmt.',
  'help.guide.create-poll.tip.1': 'Die Frage wird als Markdown gerendert; die Optionen bleiben einfacher Text.',
  'help.guide.create-poll.tip.2':
    'Umfrage erstellen bleibt grau, bis es eine Frage und mindestens zwei Optionen mit Inhalt gibt.',
  'help.guide.create-poll.tip.3':
    'Eine Frist lässt sich nur in der Handy-App setzen. Eine Umfrage, die eine hat, zeigt hier die verbleibende Zeit in einem bernsteinfarbenen Chip und gilt als geschlossen, sobald sie abläuft.',
  'help.guide.create-poll.tip.4':
    'Umfragen ist ein eigener Schalter unter Addons, unter Collab: ein Admin kann sie ausschalten und die anderen vier Panels laufen lassen.',
  // vote-poll
  'help.guide.vote-poll.title': 'Abstimmen und das Ergebnis lesen',
  'help.guide.vote-poll.goal': 'Gib deine Stimme ab, sieh, wo die Gruppe steht, und ändere deine Meinung.',
  'help.guide.vote-poll.step.1':
    'Klick die Option an, die du willst. Ihr Kreis füllt sich und der Balken dahinter wächst.',
  'help.guide.vote-poll.step.2':
    'Jetzt ist das ganze Ergebnis lesbar: der Balken ist der Anteil, der Prozentwert steht rechts, und die kleinen Kreise sind die Leute, die diese Option gewählt haben.',
  'help.guide.vote-poll.step.3':
    'Meinung geändert? Klick eine andere Option an. In einer Umfrage ohne Mehrfachauswahl wandert deine Stimme mit, statt eine zweite dazuzulegen.',
  'help.guide.vote-poll.step.4':
    'Unter der Frage steht, wie viele Stimmen die Umfrage hat. Ein Klick auf die Option, die du schon gewählt hast, nimmt deine Stimme wieder heraus, und der Zähler fällt.',
  'help.guide.vote-poll.result':
    'Dein Haken sitzt auf einer Option, die Balken zeigen, wie die Gruppe geteilt ist, und die Kreise sagen, wer was gewählt hat.',
  'help.guide.vote-poll.tip.1':
    'Die Balken und die Prozentwerte erscheinen erst, wenn du selbst abgestimmt hast oder die Umfrage geschlossen ist, damit niemand vom Zwischenstand beeinflusst wird.',
  'help.guide.vote-poll.tip.2':
    'Eine Stimme ist nie anonym: fahr über einen der Kreise an einer Option für den Namen dahinter.',
  // close-poll
  'help.guide.close-poll.title': 'Eine Umfrage schließen oder entfernen',
  'help.guide.close-poll.goal':
    'Beende die Abstimmung, sobald die Gruppe entschieden hat, und räum eine Umfrage weg, die niemand mehr braucht.',
  'help.guide.close-poll.step.1':
    'Schließen, das Schloss in der Ecke einer Umfrage, beendet die Abstimmung. Die Optionen nehmen keine Klicks mehr an.',
  'help.guide.close-poll.step.2':
    'Eine geschlossene Umfrage sinkt unter die Überschrift Geschlossen am Ende des Panels, trägt ein Abzeichen Geschlossen und zeigt jedem das Ergebnis, ob er abgestimmt hat oder nicht. Die Gewinneroption ist grün eingefärbt.',
  'help.guide.close-poll.step.3':
    'Löschen, der Papierkorb in derselben Ecke, entfernt die Umfrage. Nichts fragt ein zweites Mal, und die Stimmen gehen mit.',
  'help.guide.close-poll.result':
    'Die Umfrage ist aus dem Panel jedes Mitglieds verschwunden. Eine, die du nur geschlossen hast, bleibt unten lesbar, mit ihrem Ergebnis.',
  'help.guide.close-poll.tip.1':
    'Schließen lässt sich nicht rückgängig machen: ein Wiederöffnen gibt es nicht. Eine versehentlich geschlossene Umfrage muss neu gestellt werden.',
  'help.guide.close-poll.tip.2':
    'Löschen nimmt die Umfrage und jede Stimme darin allen weg, sofort und ohne Nachfrage.',
  // whats-next
  'help.guide.whats-next.title': 'Nächste lesen',
  'help.guide.whats-next.goal': 'Sieh, was die Gruppe als Nächstes tut, ohne den Plan zu öffnen.',
  'help.guide.whats-next.step.1':
    'Das Panel listet die Stopps der Reise, die noch bevorstehen, bis zu acht davon, in zeitlicher Reihenfolge, unter einer Überschrift pro Tag: Heute, Morgen oder das Datum.',
  'help.guide.whats-next.step.2':
    'Links in einer Zeile steht ihre Zeit: der Anfang, bis, und das Ende, wenn der Stopp eines hat, oder TBD, wenn noch keine Zeit darauf gesetzt ist.',
  'help.guide.whats-next.step.3':
    'Die Chips unter dem Namen sind die Leute an diesem Stopp. Ist niemand dafür gewählt, sind alle aus der Reise aufgeführt.',
  'help.guide.whats-next.result':
    'Eine Liste dessen, was kommt, nur zum Lesen: sie folgt dem Plan, und nichts hier ändert ihn.',
  'help.guide.whats-next.tip.1':
    'Hier wird nichts gesetzt. Die Zeiten kommen aus dem Tagesplan; änder sie dort, und diese Liste folgt sofort.',
  'help.guide.whats-next.tip.2':
    'Aufgeführt wird nur, was noch bevorsteht: ein Stopp, dessen Zeit vorbei ist, fällt heraus, und am Ende einer Reise ist das Panel leer.',
  'help.guide.whats-next.tip.3':
    'Was kommt als Nächstes ist ein eigener Schalter unter Addons, unter Collab, und es ist ein Panel für den Desktop: der Collab-Tab der Handy-App bietet es nicht.',
  // trip-chat
  'help.guide.trip-chat.title': 'Mit der Gruppe reden',
  'help.guide.trip-chat.goal':
    'Sag etwas, antworte auf eine bestimmte Nachricht, reagier auf eine andere und nimm deine eigene zurück.',
  'help.guide.trip-chat.step.1':
    'Schreib in Nachricht eingeben... und drück Enter. Der blaue Pfeil neben dem Feld tut dasselbe; Shift und Enter machen stattdessen eine neue Zeile.',
  'help.guide.trip-chat.step.2':
    'Das Smiley öffnet die Emoji-Auswahl, mit Smileys, Reactions und Travel darin. Was du wählst, wird an das gehängt, was du gerade schreibst, es wird nicht für sich allein gesendet.',
  'help.guide.trip-chat.step.3':
    'Fahr über die Nachricht von jemand anderem: an ihrer Ecke erscheint ein kleiner runder Knopf. Das ist Antworten.',
  'help.guide.trip-chat.step.4':
    'Die Nachricht, auf die du antwortest, steht als Zitat über dem Feld. Schreib und sende, und das Zitat reist in deiner Blase mit; das Kreuz am Zitat verwirft es wieder.',
  'help.guide.trip-chat.step.5':
    'Rechtsklick auf eine Nachricht öffnet die acht schnellen Reaktionen. Deine sitzt unter der Blase, und ein zweiter Klick auf dieselbe nimmt sie zurück.',
  'help.guide.trip-chat.step.6':
    'Deine eigenen Nachrichten tragen Löschen neben Antworten. Es nimmt die Nachricht weg und hinterlässt eine Zeile, die sagt, dass du sie gelöscht hast: zurück geht es nicht.',
  'help.guide.trip-chat.result':
    'Deine Antwort sitzt unter der Nachricht, die sie zitiert, eine Reaktion hängt an einer dritten, und die, die du zurückgenommen hast, hinterlässt eine einzige Zeile, die das sagt.',
  'help.guide.trip-chat.tip.1':
    'Enter sendet, Shift und Enter machen eine neue Zeile. Eine Nachricht, die nur aus Emoji besteht, wird groß angezeigt.',
  'help.guide.trip-chat.tip.2':
    'Bilder anhängen nimmt bis zu vier Bilder für eine Nachricht; sie lassen sich auch einfach einfügen oder auf das Feld fallen lassen.',
  'help.guide.trip-chat.tip.3':
    'Eine Nachricht mit einem Link darin bekommt darunter eine Vorschaukarte, geholt von deinem eigenen TREK, ein Link auf etwas, das nur du erreichst, bleibt also ein einfacher Link.',
  'help.guide.trip-chat.tip.4':
    'Chat ist ein eigener Schalter unter Addons, unter Collab: ein Admin kann ihn ausschalten und die Notizen, die Links, die Umfragen und Was kommt als Nächstes laufen lassen.',

  // ── Screen: trip-lists ────────────────────────────────────────────────────────────────
  'help.ctx.trip-lists.title': 'Listen',
  'help.ctx.trip-lists.summary':
    'Zwei Listen für eine Reise: die Packliste, mit wer was mitbringt und was es wiegt, und die Aufgabenliste mit allem, was vorher und unterwegs passieren muss. Der Tab ist da, solange das Addon Listen an ist.',
  'help.ctx.trip-lists.bullet.1':
    'Packliste und Aufgaben oben wechseln zwischen beiden und zählen, was in jeder steckt; die Knöpfe rechts gehören zu der, die gerade offen ist.',
  'help.ctx.trip-lists.bullet.2':
    'Die Packliste ist in Listen gruppiert, Dokumente, Kleidung, wie du sie auch nennst, jede mit einem Farbpunkt, einem Gepackt-von-Gesamt-Zähler und drei Punkten mit Umbenennen, Alle abhaken, Alle Haken entfernen und Liste löschen. Liste hinzufügen in der Leiste darüber legt eine neue an.',
  'help.ctx.trip-lists.bullet.3':
    'Eine Zeile ist ein Kästchen und ein Name, dann als kleine Abzeichen, wer den Eintrag mitbringt, die Menge und das Gewicht in Gramm, dazu ein Gepäck-Kreis, solange Gepäck-Tracking an ist, dann der Papierkorb und drei Punkte mit In Liste verschieben, Teilen, Umbenennen und Löschen. Was eine Zeile nicht nutzt, bleibt gedimmt, bis du darauf zeigst, und der Griff links zieht sie innerhalb ihrer Liste nach oben oder unten.',
  'help.ctx.trip-lists.bullet.4':
    'Gemeinsam und Meine Liste teilen die Packliste in zwei: den Pool, den alle sehen, und deine eigene. Alle, Offen und Erledigt engen die gerade offene ein, und der Balken darüber zählt, was gepackt ist.',
  'help.ctx.trip-lists.bullet.5':
    'Vorlage anwenden und Als Vorlage speichern füllen oder bewahren eine Liste, ohne sie abzutippen, und die zwei Symbole daneben exportieren die Liste, als Ausdruck, als PDF oder als Datei, und importieren eine. Der rote Knopf neben dem Fortschrittsbalken nennt, wie viele Einträge abgehakt sind, und räumt sie weg.',
  'help.ctx.trip-lists.bullet.6':
    'Aufgaben hat eine eigene Seitenleiste: die Fortschrittskarte, die Filter Alle, Meine Aufgaben, Überfällig und Erledigt, eine Zeile pro Liste und darunter Liste hinzufügen. Die Aufgaben sitzen in einer Karte, deren Kopf den Filter nennt und die Sortierung trägt, Priorität oder Fällig am. Ein Klick auf eine Aufgabe öffnet sie im Panel rechts, und Neue Aufgabe hinzufügen öffnet das Formular Neue Aufgabe über der Mitte des Bildschirms.',
  // packing-categories
  'help.guide.packing-categories.title': 'Die Packliste aufbauen',
  'help.guide.packing-categories.goal':
    'Gruppier, was du mitnimmst, in Listen, füll sie mit Einträgen und sag, wer sich um welche Liste kümmert.',
  'help.guide.packing-categories.step.1':
    'Klick in der Leiste über den Listen auf Liste hinzufügen, tipp den Namen in Listenname (z. B. Kleidung) und klick auf Hinzufügen.',
  'help.guide.packing-categories.step.2':
    'Die neue Liste beginnt mit einer leeren Zeile. Klick auf Eintrag hinzufügen, tipp den Eintrag in Artikelname... und drück Enter; das Feld bleibt für den nächsten offen.',
  'help.guide.packing-categories.step.3':
    'Eine Zeile benennst du mit einem Klick auf ihren Namen um, oder mit Umbenennen in den drei Punkten an ihrem rechten Ende.',
  'help.guide.packing-categories.step.4':
    'Der gestrichelte Kreis in der Listenkopfzeile weist der Liste Reisemitglieder zu. Wähl einen Namen; der Chip, der erscheint, entfernt die Person mit einem Klick wieder.',
  'help.guide.packing-categories.step.5':
    'Die drei Punkte am Ende der Kopfzeile halten den Rest: Umbenennen, Alle abhaken, Alle Haken entfernen und Liste löschen, das die Liste mit allem darin nimmt, ohne noch einmal zu fragen.',
  'help.guide.packing-categories.result':
    'Die neue Liste sitzt im Raster mit ihren Einträgen darunter und ihrem Farbpunkt, und ihr Zähler zählt, was schon gepackt ist.',
  'help.guide.packing-categories.tip.1':
    'Eine Liste ist nur ihre Einträge. Lösch den letzten, und die Zeile wird zu einem Platzhalter, damit die Liste ihren Platz und ihre Farbe behält; lösch auch diese Zeile, und die Liste ist weg.',
  'help.guide.packing-categories.tip.2':
    'Jemanden einer Liste zuzuweisen schickt ihm eine Pack-Benachrichtigung. Es ändert nicht, wer die Einträge sehen kann, das ist Teilen, in den drei Punkten einer Zeile.',
  'help.guide.packing-categories.tip.3':
    'Zwei Listen dürfen denselben Namen tragen. TREK hält sie intern auseinander, die Namen bleiben also so, wie du sie getippt hast.',
  // check-off-packing
  'help.guide.check-off-packing.title': 'Beim Packen abhaken',
  'help.guide.check-off-packing.goal':
    'Markier, was in der Tasche ist, beobachte den Balken und räum die gepackten Einträge weg.',
  'help.guide.check-off-packing.step.1':
    'Klick auf das Kästchen links an einer Zeile. Der Name wird durchgestrichen und der Balken bewegt sich.',
  'help.guide.check-off-packing.step.2':
    'Der Balken darüber zählt, was gepackt ist, gegen alles auf der Liste, als Zahl und als Prozentwert.',
  'help.guide.check-off-packing.step.3':
    'Eine ganze Liste auf einmal: die drei Punkte in ihrer Kopfzeile halten Alle abhaken und Alle Haken entfernen.',
  'help.guide.check-off-packing.step.4':
    'Alle, Offen und Erledigt engen das Raster ein. Offen lässt nur, was noch fehlt, eine vollständig gepackte Liste fällt also heraus.',
  'help.guide.check-off-packing.step.5':
    '3 abgehakte entfernen neben dem Fortschrittsbalken löscht alle abgehakten Einträge auf einmal, nach einer Bestätigung durch den Browser.',
  'help.guide.check-off-packing.result':
    'Nur was noch offen ist, steht da, und der Balken darüber sagt, wie weit das Packen ist.',
  'help.guide.check-off-packing.tip.1':
    'Ein abgehakter Eintrag lässt sich trotzdem umbenennen: Klick auf seinen Namen.',
  'help.guide.check-off-packing.tip.2':
    'Alle abhaken und Alle Haken entfernen wirken auf je eine Liste, aus den drei Punkten dieser Liste.',
  'help.guide.check-off-packing.tip.3':
    'Wenn jeder Eintrag abgehakt ist, ersetzt Alles gepackt! den Zähler, und der Balken wird grün.',
  // apply-packing-template
  'help.guide.apply-packing-template.title': 'Eine Packvorlage anwenden',
  'help.guide.apply-packing-template.goal':
    'Hol eine fertige Liste in die Reise, und bewahr die Liste dieser Reise für die nächste auf.',
  'help.guide.apply-packing-template.step.1': 'Klick auf Vorlage anwenden in der Leiste über der Liste.',
  'help.guide.apply-packing-template.step.2':
    'Wähl eine Vorlage. Jede Zeile nennt sie und sagt, wie viele Einträge sie hält.',
  'help.guide.apply-packing-template.step.3':
    'Die Einträge landen in der Ansicht, in der du bist: Gemeinsam legt sie in den Pool, den alle sehen, Meine Liste macht sie zu deinen.',
  'help.guide.apply-packing-template.step.4':
    'Die Liste dieser Reise für die nächste aufbewahren: Als Vorlage speichern öffnet einen Dialog, tipp einen Namen und klick auf Speichern.',
  'help.guide.apply-packing-template.result':
    'Die Listen und Einträge der Vorlage sind in der Reise, neben dem, was schon da war.',
  'help.guide.apply-packing-template.tip.1':
    'Eine Vorlage trägt nur Namen und Listen. Mengen, Gewichte, Gepäck und was schon abgehakt ist, bleiben zurück.',
  'help.guide.apply-packing-template.tip.2':
    'Vorlage anwenden ist erst da, sobald eine Vorlage existiert. Ohne eine erscheint der Knopf gar nicht.',
  'help.guide.apply-packing-template.tip.3':
    'Als Vorlage speichern erscheint nur für einen Instanz-Admin, und nur solange die Liste Einträge hat. Es speichert den gemeinsamen Pool plus deine eigenen Einträge, nie die privaten eines anderen Mitglieds.',
  // import-packing-list
  'help.guide.import-packing-list.title': 'Eine ganze Packliste hineinkopieren',
  'help.guide.import-packing-list.goal': 'Mach aus einer Liste, die du anderswo schon hast, in einem Zug Packeinträge.',
  'help.guide.import-packing-list.step.1':
    'Klick auf den Import-Knopf mit dem Pfeil nach unten in der Leiste über der Liste.',
  'help.guide.import-packing-list.step.2':
    'Ein Eintrag pro Zeile: Kategorie, Name, Gewicht in g (optional), Tasche (optional), checked/unchecked (optional). Das graue Beispiel im Feld zeigt alle vier Formen. Auch eine Markdown-Liste geht: Eine Überschrift benennt die Liste, und "- [ ]" und "- [x]" werden zu Einträgen.',
  'help.guide.import-packing-list.step.3':
    'Oder lad die Zeilen mit CSV/TXT/MD laden aus einer Datei. Es nimmt eine .csv, eine .txt oder eine .md und ersetzt, was im Feld steht.',
  'help.guide.import-packing-list.step.4': 'Klick auf Importieren. Der Knopf zählt die Zeilen, die er verstanden hat.',
  'help.guide.import-packing-list.result':
    'Jede Zeile wird ein Eintrag, in der Liste, die ihr erstes Feld nennt, und nichts, was schon da war, wird angerührt.',
  'help.guide.import-packing-list.tip.1':
    'Kommas, Semikolons und Tabs trennen Felder gleichermaßen, und Anführungszeichen halten ein Feld zusammen, sodass „Hemd, blau“ ein Name bleibt. Eine Zeile mit einem einzigen Wert ist nur ein Name, eine Zeile ohne eigene Liste landet in Sonstiges, und "3x" vor einem Namen setzt die Menge.',
  'help.guide.import-packing-list.tip.2':
    'Ein im vierten Feld genanntes Gepäckstück wird angelegt, wenn die Reise es noch nicht hat. Nur hier kommen Gewichte und Gepäck in Masse herein; eine Vorlage bringt nur Namen und Listen.',
  // export-packing-list
  'help.guide.export-packing-list.title': 'Die Packliste drucken oder exportieren',
  'help.guide.export-packing-list.goal':
    'Nimm die Liste auf Papier mit, als PDF oder als Datei für eine andere App oder die nächste Reise.',
  'help.guide.export-packing-list.step.1':
    'Klick auf den Export-Knopf mit dem Pfeil nach oben in der Leiste über der Liste.',
  'help.guide.export-packing-list.step.2':
    'Markdown-Checkliste (.md) und CSV für den Import (.csv) speichern die Liste sofort als Datei.',
  'help.guide.export-packing-list.step.3':
    'Klick auf Drucken oder als PDF speichern. Die Vorschau zeigt die Liste als Seite: oben die Reise und ihr Zeitraum, dann jede Liste als Karte mit einem Kästchen zum Abhaken.',
  'help.guide.export-packing-list.step.4':
    'Klick unter der Vorschau auf Drucken oder als PDF speichern. Der Browser öffnet seinen Druckdialog: Wähl einen Drucker, oder Als PDF speichern, um eine Datei zu behalten.',
  'help.guide.export-packing-list.result':
    'Der Ausdruck und die Dateien enthalten die Ansicht, die gerade offen ist, Gemeinsam oder Meine Liste, mit Mengen, Gewichten und Haken.',
  'help.guide.export-packing-list.tip.1':
    'Die CSV ist das Format, das Importieren liest, Gepäck inklusive, und taugt damit als deine eigene Packvorlage: Importier sie in die nächste Reise.',
  'help.guide.export-packing-list.tip.2':
    'Die Markdown-Datei öffnet sich in Obsidian, Notion oder GitHub als Checkliste und kommt über Importieren genauso wieder herein.',
  // share-packing-item
  'help.guide.share-packing-item.title': 'Festlegen, wer einen Eintrag sieht und wer ihn mitbringt',
  'help.guide.share-packing-item.goal':
    'Verschieb einen Eintrag zwischen dem Gruppen-Pool, deiner eigenen Liste und den Leuten, für die du ihn mitbringst.',
  'help.guide.share-packing-item.step.1':
    'Gemeinsam über den Listen ist der Pool, den alle sehen, Meine Liste ist deine eigene, und jede zählt, was in ihr steckt. Klick auf Meine Liste, um deine anzusehen.',
  'help.guide.share-packing-item.step.2':
    'Zurück in Gemeinsam, öffne die drei Punkte am Ende einer Zeile und klick auf Teilen.',
  'help.guide.share-packing-item.step.3':
    'Drei Stufen: Gemeinsam, im Gruppen-Pool und für alle sichtbar; Persönlich, das nur du siehst; und Mit Personen teilen…, wo du die Leute wählst, für die der Eintrag gilt.',
  'help.guide.share-packing-item.step.4':
    'Ein persönlicher Eintrag steht nur auf Meine Liste. Wechsle hinüber, um ihn zu finden.',
  'help.guide.share-packing-item.step.5':
    'Öffne Teilen noch einmal und hak unter Mit Personen teilen… einen Namen an. Der Eintrag erscheint auch auf der Liste dieser Person, und die Zeile bekommt ein kleines Abzeichen, das zählt, mit wie vielen Leuten er geteilt ist.',
  'help.guide.share-packing-item.result':
    'Der Eintrag sitzt in der Stufe, die du gewählt hast, und die Zeile sagt, wer ihn mitbringt.',
  'help.guide.share-packing-item.tip.1':
    'Nur wer einen Eintrag mitbringt, ändert dessen Teilen. Wem du ihn geteilt hast, sieht ihn auf seiner eigenen Meine Liste, mit deinem Namen markiert, und kann ihn abhaken.',
  'help.guide.share-packing-item.tip.2':
    'Bei einem Eintrag, den jemand anderes mitbringt, bekommst du stattdessen zwei andere Knöpfe: Bring ich auch mit, das dich daneben stellt, und In meine Liste kopieren, das eine eigene private Kopie macht.',
  'help.guide.share-packing-item.tip.3':
    'Neue Einträge erben die Ansicht, in der du sie anlegst. In Meine Liste angelegt sind sie persönlich, in Gemeinsam angelegt gehen sie in den Pool.',
  // packing-bags
  'help.guide.packing-bags.title': 'Das Gepäck wiegen',
  'help.guide.packing-bags.goal':
    'Gib jedem Eintrag ein Gewicht, sortier die Einträge in Gepäckstücke und halt jedes unter seinem Airline-Limit.',
  'help.guide.packing-bags.step.1':
    'Klick auf das Gewichts-Abzeichen vor dem Kreis und tipp das Gewicht des Eintrags in Gramm.',
  'help.guide.packing-bags.step.2': 'Der Kreis am Ende der Zeile ist ihr Gepäckstück. Klick ihn an.',
  'help.guide.packing-bags.step.3':
    'Noch kein Gepäckstück: Gepäck hinzufügen, ein Name, Enter. Das Gepäckstück wird angelegt und der Eintrag wandert direkt hinein.',
  'help.guide.packing-bags.step.4':
    'Das Panel Gepäck erscheint rechts, sobald ein Gepäckstück existiert: Name, Gewicht, ein Füllbalken, wer es trägt und wie viele Einträge darin sind, dann Nicht zugeordnet und Gesamtgewicht.',
  'help.guide.packing-bags.step.5':
    'Klick auf Limit setzen und tipp das Limit in Kilogramm, so wie Airlines es angeben.',
  'help.guide.packing-bags.step.6': 'Das gestrichelte Plus neben dem Namen eines Gepäckstücks sagt, wer es trägt.',
  'help.guide.packing-bags.result':
    'Das Panel Gepäck rechts zeigt das Gewicht jedes Gepäckstücks gegen sein Limit, was in keinem steckt, und die Summe.',
  'help.guide.packing-bags.tip.1':
    'Das Gewichtsfeld, der Gepäck-Kreis und das Panel Gepäck existieren nur, solange ein Admin Gepäck-Tracking unter dem Addon Listen eingeschaltet hat.',
  'help.guide.packing-bags.tip.2':
    'Das Gewicht eines Gepäckstücks wird auf dem Server über die Einträge aller Mitglieder summiert, auch über die, die du nicht sehen kannst, die Zahl ist also wirklich das, was das Gepäckstück wiegt.',
  'help.guide.packing-bags.tip.3':
    'Ein Gepäckstück ohne Limit wird gegen das schwerste gezeichnet, damit die Balken vergleichbar bleiben. Gib ihm ein Limit, und der Balken misst sich stattdessen daran.',
  // create-todo
  'help.guide.create-todo.title': 'Eine Aufgabe anlegen',
  'help.guide.create-todo.goal':
    'Schreib auf, was passieren muss, mit einer Liste, einer Priorität, einem Datum und einem Namen dazu.',
  'help.guide.create-todo.step.1': 'Klick oben rechts auf Neue Aufgabe hinzufügen.',
  'help.guide.create-todo.step.2':
    'Benenne sie in Aufgabenname, und schreib alles, was du dir merken willst, unter Beschreibung.',
  'help.guide.create-todo.step.3':
    'Liste gruppiert die Aufgabe. Wähl eine, oder benenn über das Plus daneben in einem kleinen Dialog eine neue.',
  'help.guide.create-todo.step.4': 'Priorität sind vier Knöpfe: Keine, P1, P2 und P3, von Rot bis Blau.',
  'help.guide.create-todo.step.5': 'Fällig am öffnet einen Kalender, und Zuständig setzt einen Namen auf die Aufgabe.',
  'help.guide.create-todo.step.6': 'Klick auf Aufgabe erstellen.',
  'help.guide.create-todo.result':
    'Die Aufgabe steht in der Liste mit ihren Abzeichen, der Priorität, dem Fälligkeitsdatum, der Liste und der Person, der sie zugewiesen ist, und sie öffnet sich im Panel rechts.',
  'help.guide.create-todo.tip.1':
    'Nur der Name ist Pflicht. Alles andere lässt sich später im Panel rechts nachtragen.',
  'help.guide.create-todo.tip.2':
    'Ist in der Seitenleiste eine Liste gewählt, startet eine neue Aufgabe in dieser Liste.',
  'help.guide.create-todo.tip.3': 'Enter im Namensfeld legt die Aufgabe sofort an, ohne die anderen Felder anzurühren.',
  // todo-filters
  'help.guide.todo-filters.title': 'Eine Aufgabe finden und ändern',
  'help.guide.todo-filters.goal':
    'Kürz die Aufgabenliste auf das, was jetzt zählt, und bearbeite dann die Aufgabe, bei der du gelandet bist.',
  'help.guide.todo-filters.step.1':
    'Aufgaben in der Seitenleiste: Alle ist alles noch Offene, Meine Aufgaben was auf dich läuft, Überfällig was ein Datum in der Vergangenheit hat, Erledigt was fertig ist. Jeder trägt seinen Zähler; klick auf Überfällig.',
  'help.guide.todo-filters.step.2':
    'Unter Listen sitzt eine Zeile pro Liste. Eine davon zu wählen zeigt diese Liste, erledigte Aufgaben eingeschlossen.',
  'help.guide.todo-filters.step.3':
    'Die Sortierung im Kopf der Liste ordnet um, was auf dem Schirm ist: Priorität stellt P1 nach vorn, Fällig am die nächste Frist. Immer nur eins von beiden, und ein zweiter Klick führt zurück zu deiner eigenen Reihenfolge.',
  'help.guide.todo-filters.step.4': 'Klick auf eine Aufgabe, um sie im Panel rechts zu öffnen.',
  'help.guide.todo-filters.step.5':
    'Änder, was du brauchst, Beschreibung, Priorität, Liste, Fällig am oder Zuständig, dann Speichern. Das Kästchen im Kopf des Panels hakt die Aufgabe ab, und Löschen nimmt sie sofort weg.',
  'help.guide.todo-filters.result':
    'Die Liste zeigt nur die Aufgaben, nach denen du gefragt hast, und das Panel rechts bearbeitet die, die du gewählt hast.',
  'help.guide.todo-filters.tip.1':
    'Eine Listenzeile zählt nur, was noch offen ist, aber sie auszuwählen zeigt auch die erledigten Aufgaben. Alle, Meine Aufgaben und Überfällig verbergen, was erledigt ist; Erledigt zeigt nichts anderes.',
  'help.guide.todo-filters.tip.2':
    'Priorität und Fällig am in der Sortierung schließen sich aus, und solange eins von beiden an ist, lassen sich die Zeilen nicht mehr in eine eigene Reihenfolge ziehen.',

  // ── Screen: trip-bookings ─────────────────────────────────────────────────────────────
  'help.ctx.trip-bookings.title': 'Buchungen',
  'help.ctx.trip-bookings.summary':
    'Der Tab für alles, was für die Reise gebucht ist und kein Weg von A nach B ist: die Unterkünfte, die Tische, die Tickets, die Touren, die Parkplätze. Jede Buchung ist eine Karte in Ausstehend oder in Bestätigt, mit ihrem Code, ihrem Dokument, ihren Reisenden und ihren Kosten.',
  'help.ctx.trip-bookings.bullet.1':
    'Manuelle Buchung oben rechts öffnet das Formular. Die sechs Arten, die es anlegt, sind Unterkunft, Restaurant, Veranstaltung, Tour, Parkplatz und Sonstiges; Flüge, Züge und der Rest wohnen im Tab Transport und tauchen hier nie auf.',
  'help.ctx.trip-bookings.bullet.2':
    'Aus Datei importieren gibt eine Bestätigung an die Auswertung weiter: EML, PDF, PKPass, HTML oder TXT, höchstens fünf Dateien mit je 10 MB. Den Knopf gibt es nur, wenn der Server sie lesen kann.',
  'help.ctx.trip-bookings.bullet.3':
    'Die Chips neben der Überschrift filtern nach Art, jeder mit seiner eigenen Zahl, und Alle holt alles zurück. Sobald eine Buchung Personen nennt, engt die Reihe der Avatare neben den Chips den Tab auf eine von ihnen ein.',
  'help.ctx.trip-bookings.bullet.4':
    'Die Karten stehen in zwei Abschnitten, Ausstehend und Bestätigt, jeder mit seiner Zahl. Ein Klick auf eine Abschnittsüberschrift klappt sie weg, und ob sie offen ist, wird für diese Reise gemerkt.',
  'help.ctx.trip-bookings.bullet.5':
    'Eine Karte trägt den Statuspunkt, die Art, den Titel, die Daten und Uhrzeiten, den Buchungscode, Ort / Adresse, womit die Buchung verknüpft ist, ihren Link, Notizen, Dateien und Reisende.',
  'help.ctx.trip-bookings.bullet.6':
    'Der Stift auf einer Karte öffnet dasselbe Formular wieder; der Papierkorb fragt einmal, und dann ist die Buchung weg. Bei einer Unterkunft gehen ihre Nächte im Tagesplan und ihre verknüpfte Ausgabe mit.',
  // create-booking
  'help.guide.create-booking.title': 'Eine Buchung anlegen',
  'help.guide.create-booking.goal':
    'Trag ein Restaurant, eine Veranstaltung, eine Tour, einen Parkplatz oder sonst etwas von Hand in die Reise ein.',
  'help.guide.create-booking.step.1': 'Klick oben rechts im Tab auf Manuelle Buchung. Neue Buchung öffnet sich.',
  'help.guide.create-booking.step.2':
    'Wähl die Art der Buchung aus der Liste oben im Formular, neben Reisende. Unterkunft, Restaurant, Veranstaltung, Tour, Parkplatz und Sonstiges sind die sechs, die dieser Tab anlegt, und das Formular ändert sich mit der Wahl: nur Unterkunft tauscht ihre Daten gegen eine Spanne von Tagen.',
  'help.guide.create-booking.step.3':
    'Tipp den Titel ein. Es ist das eine Feld, auf dem das Formular besteht, und Hinzufügen bleibt tot, bis dort etwas steht.',
  'help.guide.create-booking.step.4':
    'Setz Datum und Startzeit, und Enddatum und Endzeit, wenn die Buchung ein Ende hat. Die Kalender bieten nur Tage innerhalb der Reise an, und ein Ende, das nicht nach dem Start liegt, sagt das in Rot und sperrt Hinzufügen.',
  'help.guide.create-booking.step.5':
    'Trag den Buchungscode aus der Bestätigung ein und setz Status. Ausstehend oder Bestätigt entscheidet, in welchem der beiden Abschnitte die Karte landet.',
  'help.guide.create-booking.step.6': 'Klick auf Hinzufügen.',
  'help.guide.create-booking.result':
    'Die Buchung ist eine Karte in ihrem Abschnitt, mit ihrem Chip für die Art, ihren Daten und ihrem Code, und alle anderen in der Reise sehen sie auftauchen.',
  'help.guide.create-booking.tip.1':
    'Ort / Adresse schlägt beim Tippen echte Adressen vor; eine davon zu wählen ersetzt, was du geschrieben hast, und eine selbst getippte Adresse bleibt, wie sie ist.',
  'help.guide.create-booking.tip.2':
    'Link nimmt die eigene Seite der Buchung beim Anbieter auf. Die Karte macht daraus einen Link, der sich in einem neuen Tab öffnet.',
  'help.guide.create-booking.tip.3':
    'Notizen sind Markdown, eine Liste oder eine fette Zeile wird auf der Karte also auch als solche dargestellt.',
  // booking-hotel
  'help.guide.booking-hotel.title': 'Eine Unterkunft buchen',
  'help.guide.booking-hotel.goal':
    'Trag eine Unterkunft ein, damit sie zugleich als Buchung und als Nächte im Tagesplan zählt.',
  'help.guide.booking-hotel.step.1':
    'Klick auf Manuelle Buchung und wähl Unterkunft. Die Datumsfelder verschwinden, und ein Block mit Hotelfeldern tritt an ihre Stelle.',
  'help.guide.booking-hotel.step.2':
    'Wähl das Hotel unter Unterkunft. Die Liste sind die eigenen Orte der Reise, und eines zu wählen schreibt seinen Namen in Titel und seine Adresse in Ort / Adresse.',
  'help.guide.booking-hotel.step.3':
    'Setz Von und Bis: die erste Nacht und den Morgen, an dem du abreist. Beide bieten die Tage der Reise mit ihren Daten an, und die zwei halten einander in der Reihenfolge.',
  'help.guide.booking-hotel.step.4':
    'Füll Check-in, Check-in bis und Check-out aus, dazu den Buchungscode aus der Bestätigung.',
  'help.guide.booking-hotel.step.5': 'Klick auf Hinzufügen.',
  'help.guide.booking-hotel.result':
    'Die Karte trägt eine Spanne von Tagen statt eines Datums, mit den Zeiten für Check-in und Check-out und der Adresse, und derselbe Aufenthalt sitzt jetzt auf diesen Tagen des Plans.',
  'help.guide.booking-hotel.tip.1':
    'Unterkunft ist die eine Art ohne Datum und ohne Startzeit. Ihre Daten sind Von und Bis, und das sind Tage der Reise statt eines Kalenders.',
  'help.guide.booking-hotel.tip.2':
    'Lass Unterkunft leer und tipp stattdessen die Adresse: der Ort wird für dich gesucht, angelegt und auf der Karte gesetzt.',
  'help.guide.booking-hotel.tip.3': 'Die Buchung zu löschen nimmt die Nächte aus dem Tagesplan mit.',
  // link-booking
  'help.guide.link-booking.title': 'Eine Buchung an den Plan binden',
  'help.guide.link-booking.goal':
    'Häng eine Buchung an den Stopp und den Ort, zu dem sie gehört, damit sie dort auftaucht, wo du sie brauchen wirst.',
  'help.guide.link-booking.step.1':
    'Klick auf den Stift der Karte, die du verknüpfen willst. Reservierung bearbeiten öffnet sich.',
  'help.guide.link-booking.step.2':
    'Öffne Mit Tagesplanung verknüpfen. Die Liste ist dein Plan: eine Überschrift je Tag, dann die Stopps dieses Tages, nummeriert und mit ihren Zeiten. Wähl den, zu dem die Buchung gehört.',
  'help.guide.link-booking.step.3':
    'Ort / Aktivität verknüpft den Ort selbst. Wähl ihn dort, und Titel und Ort / Adresse füllen sich überall dort, wo du sie leer gelassen hast.',
  'help.guide.link-booking.step.4': 'Klick auf Aktualisieren.',
  'help.guide.link-booking.result':
    'Die Karte nennt den Tag und den Stopp unter Mit Tagesplanung verknüpfen, und die Buchung fährt mit diesem Stopp im Tagesplan mit.',
  'help.guide.link-booking.tip.1':
    'Keine Verknüpfung oben in der Liste nimmt die Verknüpfung wieder weg. Unterkunft hat gar keine Auswahl für Stopps: sie verknüpft sich über ihre Nächte.',
  'help.guide.link-booking.tip.2':
    'Einen Stopp an einem datierten Tag zu wählen füllt ein leeres Datum für dich. Ein Datum, das du schon gesetzt hast, bleibt unangetastet.',
  // booking-travelers
  'help.guide.booking-travelers.title': 'Sagen, für wen eine Buchung ist',
  'help.guide.booking-travelers.goal': 'Markier die Reisenden, die eine Buchung abdeckt, und sieh dann nur ihre.',
  'help.guide.booking-travelers.step.1':
    'Öffne die Buchung mit dem Stift. Reisende steht oben im Formular, neben Art der Buchung, und zeigt Reisende zuweisen, solange niemand auf der Buchung ist.',
  'help.guide.booking-travelers.step.2':
    'Klick darauf und wähl die Personen, für die diese Buchung ist; benannte Gäste stehen auch in der Liste. Eine gewählte bekommt einen Haken und ihren Avatar im Feld. Klick den Namen noch einmal an, um sie wieder wegzunehmen.',
  'help.guide.booking-travelers.step.3': 'Klick auf Aktualisieren.',
  'help.guide.booking-travelers.step.4':
    'Oben in der Werkzeugleiste, neben den Chips für die Art, klick den Avatar einer reisenden Person an, um nur ihre Buchungen zu sehen.',
  'help.guide.booking-travelers.result':
    'Die Karte listet die Personen auf, für die sie ist, und die Reihe der Avatare engt den Tab auf eine von ihnen ein.',
  'help.guide.booking-travelers.tip.1':
    'Auf der Karte werden die Reisenden nur gezeigt, nie geändert. Gesetzt werden sie hier, im Formular.',
  'help.guide.booking-travelers.tip.2':
    'Die Reihe der Avatare erscheint, sobald die Reise mehr als ein Mitglied hat und mindestens eine Buchung jemanden nennt. Was du wählst, hält für diese Browser-Sitzung.',
  // booking-files
  'help.guide.booking-files.title': 'Den Beleg bei der Buchung behalten',
  'help.guide.booking-files.goal': 'Häng die Bestätigung, das Ticket oder den Pass an die Buchung, zu der sie gehören.',
  'help.guide.booking-files.step.1':
    'Öffne die Buchung mit dem Stift, geh hinunter zu Dateien und klick auf Datei anhängen. Bei einer Buchung, die es schon gibt, geht das Dokument sofort hoch, und TREK sagt Datei hochgeladen.',
  'help.guide.booking-files.step.2':
    'Das Dokument steht mit seinem Namen da, mit einem Knopf zum Öffnen und einem X daneben.',
  'help.guide.booking-files.step.3':
    'Vorhandene verknüpfen bietet die Dokumente der Reise an, die noch nicht an dieser Buchung hängen. Wähl eines, und es wird angehängt, ohne dass etwas noch einmal hochgeladen wird.',
  'help.guide.booking-files.step.4': 'Klick auf Aktualisieren.',
  'help.guide.booking-files.result':
    'Die Karte listet die Dokumente unter Dateien auf, und ein Klick auf eines davon öffnet es.',
  'help.guide.booking-files.tip.1':
    'Bei einer Buchung, die du noch anlegst, wartet das Dokument und geht in dem Moment hoch, in dem du auf Hinzufügen klickst.',
  'help.guide.booking-files.tip.2':
    'Das X neben einem Dokument nimmt die Verknüpfung weg, nicht das Dokument. Es bleibt im Tab Dateien der Reise.',
  'help.guide.booking-files.tip.3':
    'Welche Arten von Dateien angehängt werden dürfen, steht unter Erlaubte Dateitypen beim Administrator; Dokumente, Text und Bilder sind von Haus aus erlaubt.',
  // booking-cost
  'help.guide.booking-cost.title': 'Den Preis einer Buchung zu Kosten machen',
  'help.guide.booking-cost.goal':
    'Bring das, was eine Buchung kostet, in die Kosten, aufgeteilt zwischen den Leuten, die dafür zahlen.',
  'help.guide.booking-cost.step.1':
    'Öffne die Buchung und geh ans Ende des Formulars. Unter Kosten stehen Ausgabe erstellen und Bestehende Ausgabe verknüpfen, mit dem Hinweis Speichert die Buchung und öffnet dann den Kosten-Editor.',
  'help.guide.booking-cost.step.2':
    'Klick auf Ausgabe erstellen. Die Buchung wird gespeichert, ihr Formular schließt sich, und der Kosten-Editor öffnet sich.',
  'help.guide.booking-cost.step.3':
    'Wofür war es? ist schon der Titel der Buchung. Trag den Gesamtbetrag ein und prüf Währung und Tag.',
  'help.guide.booking-cost.step.4':
    'Kategorie ist die, die die Art der Buchung nahelegt. Setz Wer hat bezahlt? und wie der Betrag aufgeteilt wird.',
  'help.guide.booking-cost.step.5': 'Klick auf Ausgabe hinzufügen.',
  'help.guide.booking-cost.result':
    'Im Formular der Buchung steht die Ausgabe jetzt unter Verknüpfte Ausgaben mit ihrem Betrag, und dieselbe Ausgabe steht im Tab Kosten, an diese Buchung gebunden.',
  'help.guide.booking-cost.tip.1':
    'Die Kategorie folgt der Art: Restaurant wird zu Essen & Trinken, Unterkunft wird zu Unterkunft, Parkplatz wird zu Parken, und Veranstaltung und Tour landen beide in Sonstiges.',
  'help.guide.booking-cost.tip.2':
    'Eine Buchung kann mehrere Ausgaben tragen. Bestehende Ausgabe verknüpfen bietet die Ausgaben aus Kosten an, die noch nirgends hängen. Bei einer verknüpften löst Lösen, Ausgabe behalten die Verbindung und lässt sie in Kosten stehen, während der Papierkorb sie entfernt.',
  'help.guide.booking-cost.tip.3':
    'Kosten steht nur im Formular, solange das Addon Kosten an ist, das der Administrator unter Addons schaltet.',
  // filter-bookings
  'help.guide.filter-bookings.title': 'Eine Buchung finden',
  'help.guide.filter-bookings.goal':
    'Eng einen langen Tab auf die Art, die Person oder den Zustand ein, den du suchst.',
  'help.guide.filter-bookings.step.1':
    'Die Chips neben der Überschrift sind die Arten, die diese Reise wirklich nutzt, jeder mit der Zahl, die er hält. Alle ist der ganze Tab.',
  'help.guide.filter-bookings.step.2':
    'Klick einen Chip an, um nur diese Art zu behalten. Klick einen zweiten an, und beide bleiben.',
  'help.guide.filter-bookings.step.3': 'Alle holt alles zurück.',
  'help.guide.filter-bookings.step.4':
    'Die Avatare neben den Chips filtern nach reisender Person, eine oder mehrere auf einmal.',
  'help.guide.filter-bookings.step.5':
    'Ausstehend und Bestätigt sind die beiden Abschnitte, jeder mit seiner Zahl. Klick eine Überschrift an, um einen wegzuklappen; er ist noch zugeklappt, wenn du zurückkommst.',
  'help.guide.filter-bookings.result':
    'Der Tab zeigt nur, was du gewählt hast, und es ist immer noch gewählt, wenn du in dieser Browser-Sitzung zu ihm zurückkommst.',
  'help.guide.filter-bookings.tip.1':
    'Die Chips bieten nur die Arten an, die die Reise hat, eine Reise ohne eine einzige Tour hat also keinen Chip Tour.',
  'help.guide.filter-bookings.tip.2':
    'Ein Filter, der auf nichts passt, lässt den Tab leer zurück, mit Keine Orte gefunden. Die Formulierung ist die der Orteliste; der Sinn ist derselbe.',
  // import-booking-file
  'help.guide.import-booking-file.title': 'Eine Buchung aus ihrer Bestätigung lesen',
  'help.guide.import-booking-file.goal':
    'Lass TREK die Buchung aus der Mail oder dem PDF ziehen, die der Anbieter geschickt hat, statt sie noch einmal zu tippen.',
  'help.guide.import-booking-file.step.1':
    'Klick in der Werkzeugleiste auf Aus Datei importieren. Buchungsbestätigungen importieren öffnet sich.',
  'help.guide.import-booking-file.step.2':
    'Lass die Bestätigungen auf das Feld fallen, oder klick es an und wähl sie aus: EML, PDF, PKPass, HTML und TXT, bis zu fünf Dateien mit je 10 MB. Die, die du gewählt hast, stehen mit Namen auf dem Feld.',
  'help.guide.import-booking-file.step.3':
    'Klick auf Importieren. Der Dialog schließt sich sofort, denn das Lesen passiert im Hintergrund.',
  'help.guide.import-booking-file.step.4':
    'Eine Karte unten rechts berichtet unter dem Namen der Datei vom Lauf, und sie folgt dir durch die App und durch ein Neuladen. Dateien werden verarbeitet… wird zu einem Häkchen, wenn das Lesen fertig ist, und die Karte bietet Importieren an. Klick darauf.',
  'help.guide.import-booking-file.result':
    'Die Buchung ist eine Karte unter Ausstehend mit ihren Nächten, ihrem Code und der Bestätigung unter Dateien, der Aufenthalt sitzt auf diesen Tagen des Plans, und bei eingeschaltetem Kosten ist der Preis eine Ausgabe, die an ihr hängt.',
  'help.guide.import-booking-file.tip.1':
    'Aus Datei importieren gibt es nur, wenn der Server Bestätigungen lesen kann, und dafür braucht es entweder die eingebaute Auswertung oder das Addon KI-Auswertung. Dieses schaltet der Administrator unter Addons.',
  'help.guide.import-booking-file.tip.2':
    'Konnte nichts gelesen werden, sagt die Karte das und bietet Try AI parsing an, was dieselben Dateien direkt an das Modell schickt. Eine fertige Auswertung wird zehn Minuten lang aufbewahrt; starte die Durchsicht innerhalb dieser Zeit.',
  'help.guide.import-booking-file.tip.3':
    'Die Bestätigung wird nur angehängt, wenn ihr Typ unter Erlaubte Dateitypen in den Admin-Einstellungen steht. PDF ist von Haus aus dabei; eine Mail, EML, muss erst hinzugefügt werden, sonst wird die Buchung ohne sie gespeichert.',
  // edit-booking
  'help.guide.edit-booking.title': 'Eine Buchung ändern',
  'help.guide.edit-booking.goal':
    'Korrigier eine Uhrzeit, trag den Code nach, der später kam, oder hol eine Buchung von Ausstehend nach Bestätigt.',
  'help.guide.edit-booking.step.1':
    'Klick auf den Stift im Kopf der Karte. Reservierung bearbeiten öffnet sich mit allem, was die Buchung weiß.',
  'help.guide.edit-booking.step.2':
    'Änder, was zu ändern ist, hier den Buchungscode, den der Anbieter endlich geschickt hat.',
  'help.guide.edit-booking.step.3': 'Setz Status auf Bestätigt.',
  'help.guide.edit-booking.step.4': 'Klick auf Aktualisieren.',
  'help.guide.edit-booking.result':
    'Die Karte wandert: eine bestätigte Buchung steht im Abschnitt Bestätigt hinter einem grünen Punkt, und alle in der Reise sehen sie wandern.',
  'help.guide.edit-booking.tip.1':
    'Ein Buchungscode, den du nicht lesen kannst, ist Buchungscodes verbergen in den Einstellungen, unter Allgemein. Fahr darüber oder klick ihn an, und er ist lesbar.',
  'help.guide.edit-booking.tip.2':
    'Änder die Art, und die Kategorie einer verknüpften Ausgabe zieht mit, es sei denn, du hattest im Kosten-Editor eine Kategorie von Hand gewählt.',
  'help.guide.edit-booking.tip.3':
    'Eine Unterkunft wird auch hier bearbeitet: ihre Tage Von und Bis stehen im selben Formular.',
  // delete-booking
  'help.guide.delete-booking.title': 'Eine Buchung löschen',
  'help.guide.delete-booking.goal': 'Nimm eine geplatzte Buchung aus der Reise.',
  'help.guide.delete-booking.step.1': 'Klick auf den Papierkorb im Kopf der Karte.',
  'help.guide.delete-booking.step.2':
    'Buchung löschen? nennt die, die du gewählt hast, und sagt, dass sie unwiderruflich gelöscht wird.',
  'help.guide.delete-booking.step.3': 'Klick auf Bestätigen.',
  'help.guide.delete-booking.result':
    'Die Karte ist weg, für alle in der Reise. Eine Buchung hat kein Rückgängig, die Frage ist also die letzte Station.',
  'help.guide.delete-booking.tip.1':
    'Eine Unterkunftsbuchung zu löschen nimmt auch ihre Nächte aus dem Tagesplan und entfernt die Ausgabe, die mit ihr verknüpft war.',
  'help.guide.delete-booking.tip.2':
    'Angehängte Dokumente bleiben im Tab Dateien der Reise; nur ihre Verknüpfung zur Buchung geht.',
  // import-booking-file
  'help.guide.import-booking-file.step.5':
    'Jede gefundene Buchung öffnet sich in Neue Buchung, eine nach der anderen, schon ausgefüllt. Bei einem Hotel ist das der Name in Titel und, wenn die Reise den Ort hat, unter Unterkunft, sein Ort / Adresse, Von und Bis auf seinen Nächten, Check-in und Check-out, der Buchungscode, die Bestätigung unter Dateien und, bei eingeschaltetem Kosten, der Preis als Verknüpfte Ausgabe. Prüf sie und klick auf Hinzufügen.',

  // ── Screen: trip-costs ────────────────────────────────────────────────────────────────
  'help.ctx.trip-costs.title': 'Kosten',
  'help.ctx.trip-costs.summary':
    'Das Geld der Reise: jede Ausgabe in einem datierten Journal, wer sie ausgelegt hat und wer dafür schuldet, in der Währung, in der der Beleg war, und in der rechten Spalte, wer wem zahlen muss, damit es wieder aufgeht.',
  'help.ctx.trip-costs.bullet.1':
    'Vier Karten oben: Du schuldest und Dir wird geschuldet sind deine eigene Seite der Abrechnung, Ausstehender Betrag ist, was erfasst ist, aber noch keinen Zahler hat, und Gesamtausgaben zählt alles zusammen, mit Dein Anteil und Du zahltest darunter.',
  'help.ctx.trip-costs.bullet.2':
    'Ausgabe hinzufügen oben rechts öffnet den Editor; Ausgleichen daneben verbucht alle offenen Überweisungen auf einmal.',
  'help.ctx.trip-costs.bullet.3':
    'Das Journal ist nach Tagen gruppiert, das Neueste zuerst, mit der Summe des Tages rechts. Eine Zeile trägt die Kategorie als farbigen Reiter, den Namen, die Zahler-Chips, die Notiz und den Betrag, dazu ausgelegt oder geliehen, wenn dich die Aufteilung auf dieser Ausgabe ins Plus oder ins Minus bringt.',
  'help.ctx.trip-costs.bullet.4':
    'Über der Liste sitzen Ausgaben suchen…, ein Kategoriefilter, ein Tagesfilter, der Schalter Alle / Von mir bezahlt / Mir geschuldet und der Knopf CSV exportieren.',
  'help.ctx.trip-costs.bullet.5':
    'Die rechte Spalte ist die Antwort: Ausgleichen listet, wer wem zahlt, Salden zeigt den Überschuss oder das Minus jedes Reisenden, Endbudget, was die Reise jeden von ihnen kostet, und Nach Kategorie, wohin das Geld gegangen ist.',
  'help.ctx.trip-costs.bullet.6':
    'Eine verbuchte Zahlung steht im selben Journal als eigene Zeile, mit Bearbeiten und Rückgängig daneben; eine Ausgabe hat einen Stift und einen Papierkorb, und der Papierkorb löscht sie ohne Nachfrage.',
  // add-expense
  'help.guide.add-expense.title': 'Eine Ausgabe hinzufügen',
  'help.guide.add-expense.goal': 'Halt fest, was etwas gekostet hat, wer es bezahlt hat und mit wem es geteilt wird.',
  'help.guide.add-expense.step.1':
    'Klick oben rechts im Reiter Kosten auf Ausgabe hinzufügen. Der Editor öffnet sich, auf heute datiert, und alle sind schon in der Aufteilung.',
  'help.guide.add-expense.step.2':
    'Tipp in Wofür war es? ein, wofür es war, das einzige Feld, das ausgefüllt sein muss, und in Gesamtbetrag die Zahl vom Beleg.',
  'help.guide.add-expense.step.3':
    'Währung und Tag sitzen unter dem Betrag. Währung beginnt bei der Währung der Reise; änderst du sie, zeigt der Editor, was der Betrag in der Reisewährung wert ist. Tag beginnt bei heute und ist der Tag, unter dem das Journal die Ausgabe gruppiert.',
  'help.guide.add-expense.step.4':
    'Wähl eine Kategorie. Es gibt vierzehn davon, und sie lassen sich nicht ändern: die gewählte ist der farbige Reiter in der Zeile und der Balken in Nach Kategorie.',
  'help.guide.add-expense.step.5':
    'Wähl unter Wer hat bezahlt? die Person, die das Geld tatsächlich ausgelegt hat. Du ist vorausgewählt; Noch niemand bezahlt erfasst den Betrag, ohne dass jemand dafür schuldet, und Mehrere haben bezahlt teilt die Rechnung auf mehrere Zahler auf.',
  'help.guide.add-expense.step.6':
    'Aufteilen beginnt bei Gleichmäßig mit allen dabei, und an jedem Namen steht der Anteil, der dabei herauskommt. Klick auf Ausgabe hinzufügen zum Speichern.',
  'help.guide.add-expense.result':
    'Die Ausgabe steht im Journal unter ihrem Tag, zählt in Gesamtausgaben mit, und die Ausgleichsspalte hat neu berechnet, wer wem schuldet.',
  'help.guide.add-expense.tip.1':
    'So, wie sich der Editor öffnet, steht die Ausgabe in der Währung der Reise, auf heute datiert und gleichmäßig auf alle aufgeteilt: wirklich ausgefüllt sein müssen nur der Name und der Betrag.',
  'help.guide.add-expense.tip.2':
    'Das ± neben dem Betrag macht aus der Ausgabe eine Erstattung. Eine negative Summe gibt Geld zurück, statt es zu nehmen, und die Aufteilung läuft andersherum.',
  'help.guide.add-expense.tip.3':
    'Beleg / Rechnung anhängen unten nimmt Bilder und PDFs. Sie werden beim Speichern hochgeladen, landen in den Dateien der Reise, und neben dem Namen in der Liste erscheint ein Belege-Chip.',
  // expense-payers
  'help.guide.expense-payers.title': 'Sagen, wer die Rechnung bezahlt hat',
  'help.guide.expense-payers.goal':
    'Halt fest, wer für eine Ausgabe in Vorleistung gegangen ist, die andere Hälfte der Ausgleichsrechnung.',
  'help.guide.expense-payers.step.1':
    'Öffne eine Ausgabe mit dem Stift neben ihrer Zeile und sieh dir Wer hat bezahlt? an. Eine Person hat bezahlt ist die Voreinstellung: Das Auswahlmenü nennt die eine Person, die das Geld ausgelegt hat.',
  'help.guide.expense-payers.step.2':
    'Noch niemand bezahlt, der erste Eintrag dieses Auswahlmenüs, erfasst den Betrag, ohne dass jemand etwas schuldet. Die Ausgabe zählt trotzdem in Gesamtausgaben mit.',
  'help.guide.expense-payers.step.3':
    'Mehrere haben bezahlt, der Link neben der Beschriftung, öffnet eine Zeile pro Reisendem. Bezieh die ein, die bezahlt haben, und tipp ein, was jeder von ihnen beigesteuert hat; die Beträge müssen zusammen die Gesamtsumme ergeben.',
  'help.guide.expense-payers.step.4':
    'Eine Ausgabe, die niemand bezahlt hat, wird in ihrer Zeile als Offen markiert und in die Karte Ausstehender Betrag gezählt, wo sich erfasste, aber nicht ausgeglichene Ausgaben sammeln.',
  'help.guide.expense-payers.result':
    'Wer bezahlt hat, entscheidet, wer zurückbekommt, die Aufteilung entscheidet, wer zahlt, und Salden ist der Unterschied zwischen beidem.',
  'help.guide.expense-payers.tip.1':
    'Wer hat bezahlt? und Aufteilen sind unabhängig voneinander: Du kannst ein Abendessen bezahlen, bei dem du nicht warst, und in eines aufgeteilt werden, das du nicht bezahlt hast.',
  'help.guide.expense-payers.tip.2':
    'Bei mehreren Zahlenden müssen die Beträge zusammen die Gesamtsumme ergeben. Bezieh einen weiteren ein, und die anderen ordnen sich darum herum neu; solange sie nicht passen, sagt der Editor, worauf sie sich summieren müssen, und speichert nicht.',
  'help.guide.expense-payers.tip.3':
    'Einen Zahler zu entfernen entfernt nicht die Ausgabe: Der Betrag bleibt in Gesamtausgaben, und die Zeile wird Offen.',
  // split-expense
  'help.guide.split-expense.title': 'Eine Rechnung unter den Reisenden aufteilen',
  'help.guide.split-expense.goal':
    'Entscheide, wer für eine Ausgabe schuldet: alle gleichmäßig, nach Betrag oder Zeile für Zeile vom Beleg.',
  'help.guide.split-expense.step.1':
    'Im Ausgaben-Editor listet Aufteilen jeden Reisenden. Klick einen Namen an, um ihn aus dieser Ausgabe herauszunehmen; ein herausgenommener Reisender steht als Nicht dabei und schuldet nichts dafür.',
  'help.guide.split-expense.step.2':
    'Gleichmäßig ist die Voreinstellung: Jeder einbezogene Reisende bekommt denselben Anteil, und die Zeile unter der Liste sagt, auf wie viele aufgeteilt wird und wie viel auf jeden entfällt.',
  'help.guide.split-expense.step.3':
    'Individuell tauscht die Anteile gegen Betragsfelder. Tipp ein, was jeder Reisende schuldet; die Zeile darunter zählt mit und wird bei Aufteilung passt zur Summe grün. Solange es nicht passt, wird nicht gespeichert.',
  'help.guide.split-expense.step.4':
    'Beleg teilt die Rechnung Zeile für Zeile auf: Artikel hinzufügen, dann pro Zeile ein Name und ein Preis, und unter Aufteilen auf: die Reisenden, die sich diese Zeile teilen.',
  'help.guide.split-expense.step.5':
    'Anteil pro Person unter den Zeilen zeigt, was jeder Reisende am Ende schuldet, und Gesamtbetrag oben wird aus den Zeilen summiert. Klick auf Speichern.',
  'help.guide.split-expense.result':
    'Die Aufteilung ist das, woraus jeder Saldo gebaut wird. Sie wird mit der Ausgabe gespeichert und lässt sich später ändern, ohne dass sonst etwas angefasst wird.',
  'help.guide.split-expense.tip.1':
    'Ein Reisender, den du herauslässt, steht als Nicht dabei und schuldet nichts für diese eine Ausgabe; die anderen übernehmen seinen Anteil.',
  'help.guide.split-expense.tip.2':
    'Gleichmäßig geht bis auf den Cent auf: Der übrige Cent wandert von Ausgabe zu Ausgabe, damit ihn nicht immer derselbe zahlt.',
  'help.guide.split-expense.tip.3':
    'Der Beleg-Modus summiert Gesamtbetrag selbst und legt das Feld grau: Die Zeilen des Belegs sind die Summe.',
  // expense-currency
  'help.guide.expense-currency.title': 'Eine Ausgabe in einer anderen Währung eintragen',
  'help.guide.expense-currency.goal': 'Trag ein, was wirklich auf dem Beleg steht, und lass TREK den Kurs halten.',
  'help.guide.expense-currency.step.1':
    'Öffne Ausgabe hinzufügen und trag Namen und Betrag genau so ein, wie der Beleg es sagt, die Zahl selbst und nicht eine Umrechnung davon.',
  'help.guide.expense-currency.step.2':
    'Öffne Währung und wähl die Währung des Belegs. Die Liste trägt jeden Code, den TREK kennt, und ist durchsuchbar: Tipp die drei Buchstaben.',
  'help.guide.expense-currency.step.3':
    'Unter den Feldern erscheint eine Zeile mit dem, was der Betrag gerade wert ist, markiert mit Live-Kurs. Sie ist eine Vorschau, nicht das, was gespeichert wird.',
  'help.guide.expense-currency.step.4':
    'Klick auf Ausgabe hinzufügen. Der Kurs wird auf der Stelle eingefroren: Von hier an ist diese Ausgabe wert, was sie an dem Tag wert war, an dem du sie eingetragen hast.',
  'help.guide.expense-currency.step.5':
    'Im Journal trägt die Zeile beide Zahlen unter dem Namen: was du getippt hast, einen Pfeil und das, was es in der Währung der Reise zählt. Jede Summe, jeder Saldo und jeder Ausgleich darüber nutzt die zweite.',
  'help.guide.expense-currency.result':
    'Die Ausgabe behält den Betrag und die Währung, die du getippt hast. Das Journal zeigt beides, und die Summen und Salden der Reise bleiben in der Währung der Reise.',
  'help.guide.expense-currency.tip.1':
    'Der Kurs wird in dem Moment eingefroren, in dem du speicherst, damit eine ausgeglichene Schuld nicht wieder aufgeht, weil der Markt eine Woche später gelaufen ist. Nur wenn du die Währung der Ausgabe änderst, wird ein neuer eingefroren.',
  'help.guide.expense-currency.tip.2':
    'Anzeigewährung in den Einstellungen ändert nur, was du liest; die gespeicherten Beträge bewegen sich nie. Bleibt sie leer, wird jede Reise in ihrer eigenen Währung gezeigt.',
  'help.guide.expense-currency.tip.3':
    'Die Währung der Reise selbst sitzt an der Reise, unter Reise bearbeiten, und braucht das Recht Reisedetails bearbeiten. Sie zu ändern verankert jeden eingefrorenen Kurs neu, statt die Beträge umzurechnen.',
  // filter-costs
  'help.guide.filter-costs.title': 'Eine Ausgabe finden, oder die Ausgaben eines Tages',
  'help.guide.filter-costs.goal': 'Grenz ein langes Journal auf das ein, was du wirklich suchst.',
  'help.guide.filter-costs.step.1':
    'Tipp über der Liste in Ausgaben suchen… ein. Gesucht wird im Namen der Ausgabe, während du tippst.',
  'help.guide.filter-costs.step.2':
    'Alle Kategorien öffnet die vierzehn Kategorien. Wähl eine, und nur die Ausgaben dieser Kategorie bleiben.',
  'help.guide.filter-costs.step.3':
    'Alle Tage listet jeden Tag, an dem etwas ausgegeben wurde. Wähl einen, und ein Banner ersetzt die Tagesüberschriften durch diesen Tag, wie viele Ausgaben er enthält und seine Summe.',
  'help.guide.filter-costs.step.4':
    'Der Schalter Alle / Von mir bezahlt / Mir geschuldet ist dein eigener Blick auf das Journal: wofür du Geld ausgelegt hast und wofür du noch in Vorleistung bist.',
  'help.guide.filter-costs.step.5':
    'CSV exportieren am Ende der Zeile schreibt jede Ausgabe in eine Datei, mit dem ursprünglichen Betrag, seiner Währung und dem umgerechneten Betrag.',
  'help.guide.filter-costs.result':
    'Die Filter greifen ineinander, und die Tagesgruppen zeichnen sich mit ihren eigenen Summen für das neu, was übrig bleibt.',
  'help.guide.filter-costs.tip.1':
    'Verbuchte Zahlungen tragen weder Namen noch Kategorie, deshalb blendet eine Suche oder ein Kategoriefilter sie aus. Der Tagesfilter behält sie, unter dem Tag, an dem die Zahlung verbucht wurde.',
  'help.guide.filter-costs.tip.2':
    'CSV exportieren exportiert immer jede Ausgabe, egal was auf dem Bildschirm gefiltert ist, eine Zeile pro Ausgabe.',
  // settle-up
  'help.guide.settle-up.title': 'Herausfinden, wer wem schuldet, und es ausgleichen',
  'help.guide.settle-up.goal':
    'Mach aus einem Haufen geteilter Ausgaben die wenigsten Überweisungen, die alle gleichstellen, und verbuch sie, wenn sie passieren.',
  'help.guide.settle-up.step.1':
    'Die Karte Ausgleichen in der rechten Spalte listet die Überweisungen, die alle gleichstellen würden: wer wem zahlt und wie viel. Die Zahl neben dem Titel ist, wie viele davon noch offen sind.',
  'help.guide.settle-up.step.2':
    'Ausgleichen neben einer Überweisung verbucht sie als erledigt. Die Überweisung verschwindet aus der Karte, und die Salden zeichnen sich neu.',
  'help.guide.settle-up.step.3':
    'Die verbuchte Überweisung ist eine Zeile im Journal, unter dem Tag, an dem sie passiert ist, markiert mit Zahlung, mit den beiden Reisenden und dem Betrag.',
  'help.guide.settle-up.step.4':
    'Neben dieser Zeile korrigiert der Stift eine Zahlung und Rückgängig nimmt sie zurück, und die Überweisung kehrt in die Karte Ausgleichen zurück.',
  'help.guide.settle-up.step.5':
    'Zahlung hinzufügen in der Kopfzeile der Karte verbucht eine Überweisung, die keinem Vorschlag gefolgt ist. Wähl Von und An, den Betrag, seine Währung und den Tag, an dem sie passiert ist.',
  'help.guide.settle-up.step.6':
    'Ausgleichen in der Kopfzeile oben auf dem Bildschirm verbucht alle offenen Überweisungen auf einmal, so wie eine Gruppe am Ende einer Reise quitt macht.',
  'help.guide.settle-up.result':
    'Jede verbuchte Überweisung ist eine Zeile im Journal und eine Zeile weniger auf der Karte Ausgleichen. Steht auf der Karte Alle quitt, ist die Reise bezahlt.',
  'help.guide.settle-up.tip.1':
    'Die Karte zeigt die wenigsten Überweisungen, nicht jede Schuld: Drei Leute, die sich im Kreis schulden, fallen auf eine oder zwei Zahlungen zusammen.',
  'help.guide.settle-up.tip.2':
    'Ausgleichen verbucht eine Überweisung, es bewegt kein Geld. Schick sie, womit auch immer du sonst zahlst, und klick dann darauf.',
  'help.guide.settle-up.tip.3':
    'Eine Zahlung kann in jeder Währung erfolgen, eine Yen-Schuld in Euro zu bezahlen ist also normal: Der Dialog hat seine eigene Währungsauswahl und friert auch diesen Kurs ein.',
  // final-budget
  'help.guide.final-budget.title': 'Sehen, was die Reise jeden Reisenden gekostet hat',
  'help.guide.final-budget.goal':
    'Lies die Seite des Journals pro Person: den Saldo von heute und die echten Kosten pro Person.',
  'help.guide.final-budget.step.1':
    'Salden zeigt die Position jedes Reisenden: ein grüner Balken nach rechts, wenn die Reise ihm schuldet, ein roter Balken nach links, wenn er ihr schuldet, und der Betrag neben dem Namen.',
  'help.guide.final-budget.step.2':
    'Endbudget darunter beantwortet eine andere Frage: nicht, wer gerade was schuldet, sondern was die Reise jeden Reisenden kostet, sobald alles zurückgezahlt ist.',
  'help.guide.final-budget.step.3':
    'Klick einen Namen an, um die Rechnung zu öffnen: Bezahlte Ausgaben, darunter Rückzahlungen netto und Ausstehende Rückzahlungen.',
  'help.guide.final-budget.step.4':
    'Unter jeder Zeile sitzen die Zeilen, aus denen sie besteht: die Ausgaben, die dieser Reisende bezahlt hat, die schon verbuchten Überweisungen und die noch offenen. Sie ergeben zusammen genau die Zeile darüber.',
  'help.guide.final-budget.result':
    'Salden ist, wer heute im Plus oder im Minus ist; Endbudget ist, was die Reise am Ende jeden von euch kostet, sobald alles zurückgezahlt ist.',
  'help.guide.final-budget.tip.1':
    'Eine Zahlung zu verbuchen ändert niemandes Endbudget. Es verschiebt nur einen Betrag von den ausstehenden Rückzahlungen zu den Rückzahlungen netto.',
  'help.guide.final-budget.tip.2':
    'Eine Ausgabe ohne Zahler bleibt aus beiden Karten heraus, genauso wie sie aus den Ausgleichsvorschlägen herausbleibt.',
  // expense-from-booking
  'help.guide.expense-from-booking.title': 'Aus einer Buchung eine Ausgabe machen',
  'help.guide.expense-from-booking.goal':
    'Häng das, was ein Flug, ein Hotel oder ein Ort tatsächlich gekostet hat, an den Eintrag, zu dem es gehört.',
  'help.guide.expense-from-booking.step.1':
    'Öffne die Buchung im Reiter Transport oder Buchungen und klick auf ihren Stift.',
  'help.guide.expense-from-booking.step.2':
    'Scroll zum Block Kosten unten im Formular. Er bietet Ausgabe erstellen an, das die Buchung zuerst speichert, und Bestehende Ausgabe verknüpfen für eine, die schon in Kosten steht.',
  'help.guide.expense-from-booking.step.3':
    'Klick auf Ausgabe erstellen. Die Buchung wird gespeichert, das Formular schließt sich, und der Kosten-Editor öffnet sich mit dem Titel der Buchung als Namen und ihrem Typ, der schon einer Kategorie zugeordnet ist.',
  'help.guide.expense-from-booking.step.4':
    'Trag den Betrag und seine Währung ein, wer bezahlt hat, und die Aufteilung wie bei jeder Ausgabe, und speichere. Öffnest du die Buchung jetzt wieder, steht sie unter Verknüpfte Ausgaben, mit einem Stift zum Bearbeiten, Lösen, Ausgabe behalten zum Abkoppeln und einem Papierkorb zum Entfernen.',
  'help.guide.expense-from-booking.result':
    'Die Buchung trägt ihre Kosten, und die Ausgabe ist eine ganz normale Zeile im Reiter Kosten, mit Zahler, Aufteilung und Währung wie jede andere.',
  'help.guide.expense-from-booking.tip.1':
    'Die Buchung zu löschen löscht ihre verknüpften Ausgaben mit. Ausgabe entfernen im Block Kosten der Buchung macht das Gegenteil: Die Ausgabe geht, die Buchung bleibt. Lösen, Ausgabe behalten behält beides.',
  'help.guide.expense-from-booking.tip.2':
    'Ein Ort hat denselben Block in seinem Formular, wobei Ausgabe erstellen dort zuerst den Ort speichert.',

  // ── Screen: trip-transports ───────────────────────────────────────────────────────────
  'help.ctx.trip-transports.title': 'Transport',
  'help.ctx.trip-transports.summary':
    'Alles, was dich zwischen den Stopps befördert: Flüge, Züge, Busse, Autos, Taxis, Fahrräder, Kreuzfahrten, Fähren und die ÖPNV-Verbindungen, die TREK für dich heraussucht. Der Tab ist ihre Liste; angelegt und gelesen werden sie auch im Plan, und auf der Karte gezeichnet.',
  'help.ctx.trip-transports.bullet.1':
    'Der Tab hält nur die Fahrten. Unterkünfte, Restaurants, Events und Tickets leben unter Buchungen, damit derselbe Eintrag nie zweimal auftaucht.',
  'help.ctx.trip-transports.bullet.2':
    'Die Werkzeugleiste zählt alle unter Alle und gibt jedem benutzten Typ einen eigenen Chip mit eigener Zahl, Flug, Zug, Auto, ÖPNV. Transport rechts legt einen von Hand an.',
  'help.ctx.trip-transports.bullet.3':
    'Die Karten kommen in drei Gruppen, jede über ihre Überschrift zusammenklappbar: Automatische ÖPNV-Verbindungen für die Verbindungen aus der Suche, dann Ausstehend, dann Bestätigt.',
  'help.ctx.trip-transports.bullet.4':
    'Eine Karte trägt den Status, den Typ, die Tage, über die sie geht, die Zeiten, den Buchungscode, die Route und die Fluggesellschaft samt Flugnr. oder die Zugnr., das Gleis und den Sitzplatz. Der Stift öffnet sie, der Papierkorb löscht sie nach einer Rückfrage.',
  'help.ctx.trip-transports.bullet.5':
    'Transporte entstehen auch im Plan: jeder Tageskopf hat ein Plus für Transport hinzufügen und einen Tram-Knopf für Öffentliche Verkehrsmittel, und das Fahrzeit-Verbindungsstück zwischen zwei Stopps öffnet dieselbe Suche für genau diese Etappe.',
  'help.ctx.trip-transports.bullet.6':
    'Ein Transport mit beiden Enden zeichnet eine Linie auf der Karte. Das Routen-Symbol in seiner Zeile im Tagesplan schaltet diese Linie an, und Alle Buchungsrouten anzeigen in der Leiste über den Tagen schaltet die ganze Reise um.',
  // transports-list
  'help.guide.transports-list.title': 'Den Tab Transport lesen',
  'help.guide.transports-list.goal': 'Wissen, was dir die Liste sagt, bevor du etwas daran änderst.',
  'help.guide.transports-list.step.1':
    'Transport ist der zweite Tab der Reise. Er hält nur die Fahrten: Hotels, Restaurants, Events und Tickets stehen unter Buchungen.',
  'help.guide.transports-list.step.2':
    'Die Werkzeugleiste zählt jeden Transport unter Alle und gibt jedem benutzten Typ einen eigenen Chip mit eigener Zahl. Klick einen Chip an, um nur diesen Typ zu behalten, klick ihn noch einmal, um ihn loszulassen. Mehrere Chips können zugleich an sein, und Alle räumt sie ab.',
  'help.guide.transports-list.step.3':
    'Automatische ÖPNV-Verbindungen ist eine eigene Gruppe, die Verbindungen aus der ÖPNV-Suche. Ausstehend und Bestätigt halten alles von Hand Eingetragene. Der Pfeil neben einer Überschrift klappt eine Gruppe weg.',
  'help.guide.transports-list.step.4':
    'Eine Karte sagt alles: der Statuspunkt mit Ausstehend oder Bestätigt, der Typ, die Tage, über die sie geht, mit ihren Daten, die Zeiten, der Buchungscode, die Route und die Fluggesellschaft samt Flugnr. oder die Zugnr., das Gleis und der Sitzplatz.',
  'help.guide.transports-list.step.5':
    'Der Stift öffnet den Transport zum Bearbeiten, der Papierkorb löscht ihn, nach einer Rückfrage, die nennt, was verschwindet.',
  'help.guide.transports-list.result':
    'Die Liste ist auf das eingeengt, was du gesucht hast, und jede Karte sagt auf einen Blick, ob die Fahrt gebucht ist.',
  'help.guide.transports-list.tip.1':
    'Die Chips und die zugeklappten Gruppen werden pro Reise gemerkt, der Tab geht also wieder so auf, wie du ihn verlassen hast.',
  'help.guide.transports-list.tip.2':
    'Aus Datei importieren und AirTrail gesellen sich nur dann zu Transport in der Leiste, wenn der Server Buchungsbestätigungen lesen kann und wenn eine AirTrail-Instanz verbunden ist. Ohne sie füllt sich die Liste von Hand und über die ÖPNV-Suche.',
  // add-transport
  'help.guide.add-transport.title': 'Einen Transport zu einem Tag hinzufügen',
  'help.guide.add-transport.goal':
    'Trag die Fahrt, die dich von einem Stopp zum nächsten bringt, in den Tag ein, an dem sie stattfindet.',
  'help.guide.add-transport.step.1':
    'Jeder Tageskopf trägt rechts vier kleine Knöpfe. Klick auf das Plus, dessen Tooltip Transport hinzufügen lautet. Das Formular öffnet sich, Datum steht schon auf diesem Tag.',
  'help.guide.add-transport.step.2':
    'Art der Buchung wählt, womit du fährst: Flug, Zug, Bus, Auto, Taxi, Fahrrad, Kreuzfahrt, Fähre oder Sonstiges. Das Formular folgt. Ein Flug bekommt auf jeder Etappe einen Flughafen, ein Zug eine Kette von Bahnhöfen, ein Auto die Wörter Abholung und Rückgabe und Stopps unterwegs.',
  'help.guide.add-transport.step.3':
    'Titel ist das einzige Feld, das gefüllt sein muss; Hinzufügen bleibt ohne ihn grau. Schreib hinein, was du auf einer Anzeigetafel wiedererkennen würdest.',
  'help.guide.add-transport.step.4':
    'Von und Nach suchen einen Bahnhof, einen Hafen oder eine Adresse. Tipp mindestens drei Buchstaben und wähl ein Ergebnis aus der Liste. Ein nur getippter Name trägt keine Koordinaten, zeichnet also nichts auf der Karte.',
  'help.guide.add-transport.step.5':
    'Datum und Startzeit sagen, wann sie läuft, Enddatum und Endzeit, wann sie vorbei ist; eine Fahrt, die am nächsten Tag ankommt, nimmt dort den nächsten Tag. Buchungscode, Status mit Ausstehend oder Bestätigt und Notizen sind freiwillig.',
  'help.guide.add-transport.step.6': 'Klick auf Hinzufügen.',
  'help.guide.add-transport.result':
    'Der Transport ist eine Zeile am Tag, zu seiner Zeit zwischen den Stopps, und eine Karte im Tab Transport unter Ausstehend oder Bestätigt.',
  'help.guide.add-transport.tip.1':
    'Die Zeile landet dort, wo ihre Startzeit sie hinsetzt, hinter dem letzten Stopp, der früher beginnt. Ihr Griff zieht sie an jede andere Stelle des Tages oder auf einen anderen Tag.',
  'help.guide.add-transport.tip.2':
    'Datei anhängen unter Dateien nimmt das Ticket, und Ausgabe erstellen unter Kosten speichert die Buchung und öffnet den Kosten-Editor für den Fahrpreis.',
  'help.guide.add-transport.tip.3':
    'Reisende markiert, wer auf dieser Fahrt dabei ist. Sobald ein Transport Reisende hat, wachsen der Leiste des Tabs ihre Avatare, und sie filtert die Liste danach.',
  // plan-transit
  'help.guide.plan-transit.title': 'Eine ÖPNV-Verbindung planen',
  'help.guide.plan-transit.goal':
    'Lass TREK die echten Züge und Busse zwischen zwei Punkten eines Tages heraussuchen und die, die du wählst, in den Plan setzen.',
  'help.guide.plan-transit.step.1':
    'Klick im Tageskopf auf den Tram-Knopf, Öffentliche Verkehrsmittel. Die Suche öffnet sich für diesen Tag.',
  'help.guide.plan-transit.step.2':
    'Von und Nach nehmen eine Haltestelle oder einen Bahnhof. Solange das Feld leer ist, werden die eigenen Stopps des Tages und die Unterkünfte der Reise angeboten; ab zwei Buchstaben wird stattdessen in den Stationen des Fahrplans gesucht. Tauschen zwischen den beiden Feldern dreht die Verbindung um.',
  'help.guide.plan-transit.step.3':
    'Abfahrt oder Ankunft mit einer Uhrzeit sagt, wann du fahren willst, und Beste Route, Wenige Umstiege oder Wenig Fußweg sagt, wie die Antworten sortiert werden sollen.',
  'help.guide.plan-transit.step.4':
    'Die Chips darunter sagen, welche Verkehrsmittel benutzt werden dürfen: Zug, U-Bahn, Tram, Bus, Fähre und Seilbahn. Schalt eines aus, um es wegzulassen, mindestens eines bleibt an. Dann klick auf Suchen.',
  'help.guide.plan-transit.step.5':
    'Jedes Ergebnis gibt Abfahrt und Ankunft, wie lange es dauert, wie viele Umstiege und wie viel Fußweg, und die Linien in ihren eigenen Farben. Klick eines an, um es Halt für Halt aufzuklappen, mit den Gleisen und den Fußwegen zwischen den Linien.',
  'help.guide.plan-transit.step.6': 'Klick auf Zum Tag hinzufügen.',
  'help.guide.plan-transit.result':
    'Die Verbindung ist eine Zeile am Tag mit ihren Linien, ihren Umstiegen und ihrem Fußweg, und eine Karte im Tab Transport unter Automatische ÖPNV-Verbindungen.',
  'help.guide.plan-transit.tip.1':
    'Die Verbindungen kommen von Transitous, einem freien Gemeinschaftsdienst auf öffentlichen Fahrplandaten: kein Schlüssel, kein Konto. Ein Admin kann die Suche stattdessen auf Google richten.',
  'help.guide.plan-transit.tip.2':
    'Nichts gefunden? Die Fahrplandaten decken eine Region und einen Zeitraum ab. Probier eine andere Uhrzeit, schalt mehr Verkehrsmittel an, oder wähl einen Bahnhof statt des Ortes selbst. Die Meldung nennt den Dienst, der geantwortet hat.',
  'help.guide.plan-transit.tip.3':
    'Dieselbe Suche öffnet sich für eine einzelne Etappe: klick auf das Fahrzeit-Verbindungsstück zwischen zwei Stopps und wähl Öffentliche Verkehrsmittel. Von, Nach und die Abfahrtszeit sind schon für dich ausgefüllt.',
  // change-transit-route
  'help.guide.change-transit-route.title': 'Eine geplante Verbindung öffnen und ändern',
  'help.guide.change-transit-route.goal':
    'Die Verbindung Halt für Halt lesen, sie umbenennen, oder die Route neu heraussuchen lassen.',
  'help.guide.change-transit-route.step.1':
    'Im Tab Transport sitzen die geplanten Verbindungen unter Automatische ÖPNV-Verbindungen. Klick die Karte an.',
  'help.guide.change-transit-route.step.2':
    'Dauer, Umstiege und Fußweg stehen oben. Verbindung darunter geht die Fahrt Halt für Halt durch, mit den Gleisen und den Fußwegen zwischen den Linien.',
  'help.guide.change-transit-route.step.3':
    'Route ändern startet die Suche noch einmal, schon gefüllt mit den beiden Enden dieser Verbindung und ihrem Tag.',
  'help.guide.change-transit-route.step.4':
    'Wähl eine andere Verbindung und klick auf Zum Tag hinzufügen; sie tritt an die Stelle der alten. Details bearbeiten, neben Route ändern, öffnet stattdessen das gewöhnliche Transport-Formular, in dem der Buchungscode, der Status, die Reisenden und die Dateien liegen.',
  'help.guide.change-transit-route.result':
    'Die Fahrt trägt die neue Verbindung, und ihre Karte im Tab Transport zeigt die neuen Linien und Zeiten.',
  'help.guide.change-transit-route.tip.1':
    'Der Titel der Fahrt ist nur Text: der Stift daneben benennt sie um, ohne die Route anzurühren. Notizen darunter nehmen Markdown und haben einen Tab Bearbeiten und einen Tab Vorschau.',
  'help.guide.change-transit-route.tip.2':
    'Löschen am Fuß der Fahrt nimmt die Verbindung aus der Reise; der Tag behält seine Stopps.',
  // leg-travel-mode
  'help.guide.leg-travel-mode.title': 'Ändern, wie eine Etappe zurückgelegt wird',
  'help.guide.leg-travel-mode.goal':
    'Eine Etappe eines sonst gefahrenen Tages zu Fuß gehen, oder sie der ÖPNV-Suche übergeben.',
  'help.guide.leg-travel-mode.step.1':
    'Die Verbindungsstücke zwischen den Stopps erscheinen erst, wenn die Route des Tages an ist. Klick den Tag an, um ihn zu öffnen, dann Route unter seinen Stopps.',
  'help.guide.leg-travel-mode.step.2':
    'Jedes Verbindungsstück nennt Fahrzeit und Entfernung dieser Etappe, mit dem Symbol des Verkehrsmittels, in dem sie berechnet wurde: ein Auto fürs Fahren, ein Fuß fürs Gehen.',
  'help.guide.leg-travel-mode.step.3':
    'Klick auf das Verbindungsstück. Das Menü bietet Auto und Fußweg, Öffentliche Verkehrsmittel und Tages-Standard verwenden.',
  'help.guide.leg-travel-mode.step.4':
    'Wähl Fußweg. Nur diese Etappe ändert sich; der Rest des Tages behält sein eigenes Verkehrsmittel.',
  'help.guide.leg-travel-mode.result':
    'Die Etappe zeigt das Fuß-Symbol und ihre Gehzeit, und die übrigen Etappen des Tages behalten das Verkehrsmittel des Tages.',
  'help.guide.leg-travel-mode.tip.1':
    'Das Verkehrsmittel gehört der Etappe, nicht dem Tag: die Knöpfe Auto und Fußweg des ganzen Tages überschreiben nie eine Etappe, die du von Hand gesetzt hast. Tages-Standard verwenden gibt ihnen die Etappe zurück.',
  'help.guide.leg-travel-mode.tip.2':
    'Öffentliche Verkehrsmittel im selben Menü öffnet die Verbindungssuche für genau diese Etappe, mit beiden Enden und der Abfahrtszeit schon ausgefüllt.',
  'help.guide.leg-travel-mode.tip.3':
    'Die Zeiten kommen von einem öffentlichen Router über echte Straßen und Fußwege. Eine Etappe, die er nicht beantworten kann, behält ihre gerade Linie und zeigt keine Zeit.',
  // edit-transport
  'help.guide.edit-transport.title': 'Einen Transport ändern oder löschen',
  'help.guide.edit-transport.goal':
    'Eine Zeit, ein Gleis oder einen Buchungscode richten, oder die Fahrt aus der Reise nehmen.',
  'help.guide.edit-transport.step.1':
    'Im Tagesplan ist ein Transport eine farbige Zeile zwischen den Stopps. Klick sie an.',
  'help.guide.edit-transport.step.2':
    'Das Formular ist dasselbe, das ihn angelegt hat, mit Transport bearbeiten in der Titelzeile. Alles lässt sich ändern: der Typ, die Route, die Tage und Zeiten, der Buchungscode, der Status.',
  'help.guide.edit-transport.step.3':
    'Die Route eines Fluges ist eine Kette von Flughäfen, die eines Zuges eine Kette von Bahnhöfen. Zwischenstopp hinzufügen setzt einen weiteren dazwischen, und jede Etappe behält ihre eigenen Zeiten und ihre eigene Flug- oder Zugnummer.',
  'help.guide.edit-transport.step.4':
    'Klick auf Aktualisieren. Um den Transport ganz zu entfernen, nimm den Papierkorb auf seiner Karte im Tab Transport und bestätige.',
  'help.guide.edit-transport.result':
    'Die Änderung zeigt sich überall, wo der Transport auftaucht: im Tab Transport, an dem Tag, an dem er läuft, und in seiner Linie auf der Karte.',
  'help.guide.edit-transport.tip.1':
    'Dasselbe Formular öffnet sich von beiden Seiten, über den Stift auf der Karte im Tab Transport und über die eigene Zeile des Transports im Tagesplan. Eine geplante ÖPNV-Verbindung ist die Ausnahme: ihre Zeile öffnet die Fahrtansicht, und Details bearbeiten führt von dort zu diesem Formular.',
  'help.guide.edit-transport.tip.2':
    'Einen Transport auf einen anderen Tag zu verschieben braucht das Formular gar nicht: zieh seine Zeile von einer Tageskarte auf die nächste.',
  // transport-on-map
  'help.guide.transport-on-map.title': 'Einen Transport auf der Karte zeichnen',
  'help.guide.transport-on-map.goal': 'Sehen, wo ein Flug, eine Fahrt oder eine Verbindung wirklich langgeht.',
  'help.guide.transport-on-map.step.1':
    'Ein Transport mit beiden Enden trägt ein kleines Routen-Symbol in seiner Zeile im Tagesplan. Klick es an; seine Beschriftung wird zu Buchungsrouten ausblenden.',
  'help.guide.transport-on-map.step.2':
    'Die Route wird auf der Karte gezeichnet, mit einem Pillen-Marker an jedem Ende, der das Symbol des Transports trägt.',
  'help.guide.transport-on-map.step.3':
    'Klick einen Endmarker an, um die Buchung zu lesen, ohne die Karte zu verlassen: die Zeiten, die Fluggesellschaft samt Flugnr., den Buchungscode und die Adresse. Schließen räumt das Blatt weg.',
  'help.guide.transport-on-map.step.4':
    'Das Routen-Symbol in der Leiste über den Tagen macht die ganze Reise auf einmal: Alle Buchungsrouten anzeigen, und Alle Buchungsrouten ausblenden, um sie wieder abzuräumen.',
  'help.guide.transport-on-map.step.5':
    'Eine geplante ÖPNV-Verbindung hat kein eigenes Symbol. Sie wird über den Schalter Route des Tages gezeichnet, und darum räumt Alle Buchungsrouten ausblenden sie nicht weg, solange die Route dieses Tages noch an ist.',
  'help.guide.transport-on-map.result':
    'Die Routen liegen auf der Karte, mit einem Marker an jedem Ende, und bleiben dort, bis du sie wieder ausschaltest.',
  'help.guide.transport-on-map.tip.1':
    'Ein Flug, eine Kreuzfahrt und eine Fähre zeichnen sich als Bogen, ein Auto, ein Bus, ein Taxi und ein Fahrrad folgen den echten Straßen, und ein Zug oder eine geplante Verbindung läuft durch die Bahnhöfe, die er anfährt.',
  'help.guide.transport-on-map.tip.2':
    'Eine bestätigte Buchung ist eine durchgezogene Linie, eine ausstehende eine gestrichelte. Die Einstellung Orts-Labels auf Buchungsrouten schreibt den Flughafencode oder den Bahnhofsnamen in die Endmarker.',
  'help.guide.transport-on-map.tip.3':
    'Alle Buchungsrouten anzeigen macht reinen Tisch, es ist keine Ebene: es verwirft, was die einzelnen Symbole gesetzt hatten, zweimal drücken lässt dich also mit allem an oder allem aus zurück.',
  // import-transport-file
  'help.guide.import-transport-file.title': 'Einen Flug aus seinem E-Ticket lesen',
  'help.guide.import-transport-file.goal':
    'Lass TREK einen Flug, einen Zug oder eine Fähre aus dem Ticket ziehen, das die Gesellschaft geschickt hat, und prüf ihn, bevor er gespeichert wird.',
  'help.guide.import-transport-file.step.1':
    'Klick in der Werkzeugleiste des Tabs Transport auf Aus Datei importieren, neben Transport. Buchungsbestätigungen importieren öffnet sich, derselbe Dialog, den der Tab Buchungen hat.',
  'help.guide.import-transport-file.step.2':
    'Lass das Ticket auf das Feld fallen, oder klick es an und wähl es aus: EML, PDF, PKPass, HTML und TXT, bis zu fünf Dateien mit je 10 MB. Die Dateien, die du gewählt hast, stehen mit Namen auf dem Feld.',
  'help.guide.import-transport-file.step.3':
    'Klick auf Importieren. Der Dialog schließt sich sofort; das Lesen passiert im Hintergrund.',
  'help.guide.import-transport-file.step.4':
    'Eine Karte unten rechts berichtet unter dem Namen der Datei vom Lauf. Dateien werden verarbeitet… wird zu einem Häkchen, wenn das Lesen fertig ist, und die Karte bietet Importieren an. Klick darauf.',
  'help.guide.import-transport-file.step.5':
    'Ein Flug öffnet sich in Transport hinzufügen, schon ausgefüllt: Art der Buchung auf Flug, die Fluggesellschaft und die Flugnummer in Titel, beide Flughäfen unter Route mit Abreise und Ankunft, ihren Zeiten und ihren Zeitzonen, Fluggesellschaft und Flugnr., der Buchungscode und das Ticket unter Dateien. Prüf ihn und klick auf Hinzufügen.',
  'help.guide.import-transport-file.result':
    'Der Flug ist eine Karte unter Ausstehend im Tab Transport und eine Zeile an dem Tag, an dem er abgeht, mit dem Ticket unter Dateien, und mit beiden bekannten Flughäfen zeichnet er seinen Bogen auf die Karte.',
  'help.guide.import-transport-file.tip.1':
    'Die beiden Tabs teilen sich einen Import: Eine Datei, die einen Flug und ein Hotel enthält, öffnet den Flug in Transport hinzufügen und das Hotel in Neue Buchung, eins nach dem anderen, egal von welchem Tab du gestartet bist.',
  'help.guide.import-transport-file.tip.2':
    'Flughäfen werden über ihren Code platziert. Ein Bahnhof oder ein Hafen, den das Lesen nicht verorten konnte, steht bernsteinfarben auf der Karte; wähl ihn von Hand unter Route, bevor du auf Hinzufügen klickst, sonst zeichnet der Transport nichts auf die Karte.',
  // airtrail-import
  'help.guide.airtrail-import.title': 'Flüge aus AirTrail importieren',
  'help.guide.airtrail-import.goal':
    'Hol die Flüge, die du schon in AirTrail führst, in einem Rutsch in die Reise, und lass sie von da an AirTrail folgen.',
  'help.guide.airtrail-import.step.1':
    'Mit eingeschaltetem AirTrail-Addon und deiner unter Integrationen in den Einstellungen verbundenen Instanz trägt die Werkzeugleiste des Tabs Transport einen Knopf AirTrail neben Transport. Klick ihn an.',
  'help.guide.airtrail-import.step.2':
    'Aus AirTrail importieren listet die Flüge deines Kontos in zwei Gruppen. Während dieser Reise hält die, die in die Reise datiert sind, schon angehakt; Weitere Flüge hält den Rest, nicht angehakt. Ein Flug, der schon in der Reise ist, ist ausgegraut und als Importiert markiert.',
  'help.guide.airtrail-import.step.3':
    'Jede Zeile ist ein Kästchen mit Fluggesellschaft und Flugnummer, den beiden Flughäfen und dem Datum. Klick eine Zeile an, um den Flug mitzunehmen oder auszulassen; die unter Weitere Flüge kommen nur mit, wenn du sie anhakst.',
  'help.guide.airtrail-import.step.4':
    'Flüge, die aneinander anschließen, jeder innerhalb eines Tages von dem Flughafen abgehend, an dem der vorige gelandet ist, werden zusammen eingerahmt. Das Häkchen darunter, Als einen Flug mit Zwischenstopp in diesem Flughafen importieren, ist schon gesetzt: Lass es stehen für eine Buchung mit Stopp, oder nimm es weg, um die Etappen als getrennte Flüge zu importieren.',
  'help.guide.airtrail-import.step.5':
    'Klick auf Importieren. Der Knopf zählt die angehakten Flüge mit, und die Meldung danach sagt, wie viele hereingekommen sind.',
  'help.guide.airtrail-import.step.6':
    'Die Flüge sind Karten unter Bestätigt, jede mit einem blauen AirTrail-Abzeichen neben ihrem Status, und Zeilen an den Tagen, an denen sie gehen. Eine zusammengefasste Verbindung ist eine Karte, mit ihrer Route durch den Zwischenstopp.',
  'help.guide.airtrail-import.result':
    'Die Flüge aus AirTrail sind Karten im Tab Transport und Zeilen an ihren Tagen, jede mit dem AirTrail-Abzeichen, das sagt, woher sie kam.',
  'help.guide.airtrail-import.tip.1':
    'Ein Flug, der unter derselben Nummer und demselben Datum schon in der Reise ist, wird übersprungen, und eine Meldung sagt, wie viele das waren. Rückgängig in der Werkzeugleiste über den Tagen nimmt den ganzen Import zurück.',
  'help.guide.airtrail-import.tip.2':
    'AirTrail bleibt die Quelle der Wahrheit. TREK liest seine Änderungen, wenn du die Reise öffnest, und alle paar Minuten im Hintergrund; ein dort gelöschter Flug behält seine Karte, mit dem Abzeichen auf Nicht synchronisiert. Änderungen in TREK wandern nur zurück, wenn Änderungen zurück nach AirTrail schreiben unter Integrationen eingeschaltet ist.',
  'help.guide.airtrail-import.tip.3':
    'Eine zusammengefasste Verbindung hat keinen einzelnen AirTrail-Flug, dem sie folgen könnte, also ist sie ein einmaliger Import: Sie behält das blaue Abzeichen, und wer den Zeiger darauf hält, liest das dort. Dasselbe passiert mit einem synchronisierten Flug, dem du von Hand einen Stopp gibst.',

  // ── Screen: trip-roadtrip ─────────────────────────────────────────────────────────────
  'help.ctx.trip-roadtrip.title': 'Roadtrip',
  'help.ctx.trip-roadtrip.summary':
    'Der Plan als eine einzige Fahrt gelesen: dieselben Tage und dieselben Orte, zu Stopps verkettet, mit der Fahrt dazwischen, in einer Leiste in der linken Spalte und auf der Karte. Sie sagt, wie weit und wie lange, wo der Tank leer ist und was an der Straße liegt.',
  'help.ctx.trip-roadtrip.bullet.1':
    'Tage und Roadtrip oben in der linken Spalte wechseln zwischen dem Tagesplan und der Fahrt. Nichts wird kopiert und nichts verändert: Tage gibt den Plan genau so zurück, wie er war.',
  'help.ctx.trip-roadtrip.bullet.2':
    'Der Kopf der Leiste summiert die Reise: Strecke, Fahrzeit und Stopps. Darunter kommt eine Kachel je Tag, mit den eigenen Kilometern des Tages, für wie viele Stopps er da ist, was er überschreitet, und dem Abzeichen Spur.',
  'help.ctx.trip-roadtrip.bullet.3':
    'Ein nummerierter Stopp ist ein Ort, für den der Tag da ist. Ein Halt unterwegs, Tanken, Laden, ein Rastplatz, trägt statt einer Nummer das Symbol seiner Art und zählt nicht mit. Klick eine Nummer an, um zu ändern, was sie ist, und das Abzeichen Dauer, um zu sagen, wie lange er dauert.',
  'help.ctx.trip-roadtrip.bullet.4':
    'Zwischen zwei Stopps gibt ein Fahrband die Etappe als Strecke und Zeit an. Klick es für Wege für diese Etappe an, oder klick die gezeichnete Route auf der Karte an, um die Etappe über einen Zwischenpunkt zu biegen.',
  'help.ctx.trip-roadtrip.bullet.5':
    'Die rechte Spalte wird zu Entlang der Route: wähl einen Tag, was gesucht wird und wie breit der Korridor ist, dann Suchen. Übernehmen setzt einen Treffer an der Stelle in die Fahrt, an der er wirklich passiert wird.',
  'help.ctx.trip-roadtrip.bullet.6':
    'Die Fahreinstellungen darunter halten die Grenzen, das Fahrzeug und seine Reichweite, die täglichen Reisezeiten, was gemieden wird und wie die Linie gezeichnet wird. Sie gehören zur Reise, also plant jeder mit demselben Fahrzeug.',
  // roadtrip-mode
  'help.guide.roadtrip-mode.title': 'Die Reise als eine Fahrt lesen',
  'help.guide.roadtrip-mode.goal': 'Schalt den Plan in den Roadtrip-Modus und lies, was die Leiste dir sagt.',
  'help.guide.roadtrip-mode.step.1':
    'Klick Roadtrip im Schalter Tage und Roadtrip oben in der linken Spalte an. Der Tagesplan wird durch die Fahrt ersetzt, und die Karte zeichnet jeden Tag, der geroutet ist.',
  'help.guide.roadtrip-mode.step.2': 'Der Kopf der Leiste summiert die ganze Reise: Strecke, Fahrzeit und Stopps.',
  'help.guide.roadtrip-mode.step.3':
    'Darunter kommt eine Kachel je Tag. Ihre Kopfzeile trägt Nummer und Datum des Tages, die Fahrt als Strecke und Zeit, und für wie viele Stopps der Tag da ist.',
  'help.guide.roadtrip-mode.step.4':
    'In der Kachel ist der Tag eine Kette: ein nummerierter Stopp je Ort, ein Fahrband zwischen je zweien, und die Ankunftszeit am rechten Rand.',
  'help.guide.roadtrip-mode.step.5':
    'Klick die Kopfzeile eines Tages an, um ihn einzuklappen. Ein eingeklappter Tag verschwindet auch von der Karte; klick die Kopfzeile noch einmal an, um ihn zurückzuholen.',
  'help.guide.roadtrip-mode.result':
    'Die linke Spalte ist die Fahrt, und die Karte zeigt jeden ihrer Tage. Tage schaltet direkt zurück zum Plan, unverändert.',
  'help.guide.roadtrip-mode.tip.1':
    'Die Wahl wird je Reise gemerkt, solange der Browser-Tab offen ist, ein Neuladen kommt also wieder in der Fahrt an.',
  'help.guide.roadtrip-mode.tip.2':
    'Den Schalter gibt es erst, wenn ein Admin das Addon Roadtrip eingeschaltet hat, unter Addons in der Administration.',
  'help.guide.roadtrip-mode.tip.3':
    'Auf dem Handy gibt es keinen Schalter: das Addon setzt einen eigenen Reiter Roadtrip neben Karte.',
  // roadtrip-stops
  'help.guide.roadtrip-stops.title': 'Halte unterwegs, und wie lange du bleibst',
  'help.guide.roadtrip-stops.goal':
    'Mach aus einem Ort auf der Fahrt einen Halt unterwegs und sag, wie lange jeder Stopp dauert.',
  'help.guide.roadtrip-stops.step.1':
    'Klick die Nummer vor einem Stopp in der Leiste an. Ihre Beschriftung ist Zum Halt unterwegs machen, und sie öffnet Art des Stopps.',
  'help.guide.roadtrip-stops.step.2':
    'Wähl eine Art: Unterkünfte, Tanken, Laden, Rastplatz, Campingplatz, Essen oder Sehenswertes. Die Nummer wird zum Symbol dieser Art, und die Stopps darunter werden neu nummeriert.',
  'help.guide.roadtrip-stops.step.3':
    'Ein Halt unterwegs ist kein Ziel, also zählt die Kopfzeile des Tages einen Stopp weniger.',
  'help.guide.roadtrip-stops.step.4':
    'Klick das Symbol noch einmal an, Art des Halts ändern, und wähl Wieder zum Ziel machen, um dem Stopp seine Nummer zurückzugeben.',
  'help.guide.roadtrip-stops.step.5':
    'Jeder Stopp trägt ein Abzeichen Dauer. Klick es an, um Aufenthalt an diesem Stopp zu öffnen.',
  'help.guide.roadtrip-stops.step.6':
    'Stell die Länge mit dem Schieber ein, mit den Knöpfen minus und plus oder mit einer der Voreinstellungen, sieh zu, was Ankunft und Abfahrt tun, und klick dann Speichern.',
  'help.guide.roadtrip-stops.result':
    'Der Stopp, dem du eine Zeit gegeben hast, trägt die Stunde auf seinem Abzeichen Dauer, und jede Ankunft danach ist mitgewandert; und der, den du zu einer Art und wieder zurück geschickt hast, ist wieder ein nummeriertes Ziel.',
  'help.guide.roadtrip-stops.tip.1':
    'Ein Aufenthalt gehört zum Ort, nicht zu einem Besuch: an einem Ort, der an zwei Tagen geplant ist, steht man an beiden gleich lang.',
  'help.guide.roadtrip-stops.tip.2':
    'Halte unterwegs erscheinen auch unter Tage. Schaltest du Auch in Days anzeigen aus, unter Service Stops in den Fahreinstellungen, bleiben sie nur im Roadtrip.',
  'help.guide.roadtrip-stops.tip.3': 'Kein Aufenthalt, im selben Dialog, nimmt die Zeit wieder weg.',
  // roadtrip-corridor
  'help.guide.roadtrip-corridor.title': 'Tanken, Essen und ein Bett entlang der Route finden',
  'help.guide.roadtrip-corridor.goal':
    'Durchsuch die Straße, die du wirklich fährst, und setz auf die richtige Etappe, was du findest.',
  'help.guide.roadtrip-corridor.step.1':
    'Wähl oben in Entlang der Route den Tag. Angeboten werden nur Tage, die geroutet sind.',
  'help.guide.roadtrip-corridor.step.2':
    'Hak unter Gesucht wird an, was du brauchst. Tanken, Laden, Rastplatz, Campingplatz, Unterkünfte, Essen und Sehenswertes lassen sich kombinieren.',
  'help.guide.roadtrip-corridor.step.3':
    'Wähl unter Im Umkreis, wie weit beidseits der Straße gesucht wird, 2 km, 5 km oder 10 km, und klick dann Suchen.',
  'help.guide.roadtrip-corridor.step.4':
    'Die Treffer kommen nach Art gruppiert zurück, in der Reihenfolge, in der du sie passierst, jeder mit dem Punkt im Tag, an dem er liegt, und dem Abstand zur Route.',
  'help.guide.roadtrip-corridor.step.5':
    'Übernehmen an einem Treffer öffnet Als Stopp hinzufügen. Dort steht, auf welchem Tag und an welcher Position der Stopp landet, es fragt nach der Art und nach dem Aufenthalt, und Übernehmen setzt ihn in die Fahrt.',
  'help.guide.roadtrip-corridor.result':
    'Die Treffer stehen in der Reihenfolge, in der du sie passierst, und sind auf der Karte gezeichnet, und der übernommene sitzt in der Fahrt an der Stelle, an der er wirklich passiert wird.',
  'help.guide.roadtrip-corridor.tip.1':
    'Gesucht wird erst, wenn du Suchen drückst: ein Lauf sind viele Anfragen an einen geteilten Dienst.',
  'help.guide.roadtrip-corridor.tip.2':
    'Nach Name filtern engt ein, was zurückkam, ohne neu zu fragen, und Ergebnisse löschen leert die Liste und ihre Nadeln. Klick einen Treffer an, um ihn auf der Karte in den Blick zu holen.',
  'help.guide.roadtrip-corridor.tip.3':
    'Ein Treffer lässt sich auch von der Karte auf die gezeichnete Route ziehen, so wählst du die Etappe selbst, wo dieselbe Straße zweimal gefahren wird. Selbst hinzufügen, neben Suchen, sucht stattdessen einen Ort über den Namen.',
  // roadtrip-via
  'help.guide.roadtrip-via.title': 'Eine Etappe über einen Zwischenpunkt biegen',
  'help.guide.roadtrip-via.goal':
    'Schick eine Etappe über die Straße, die du wirklich willst, ohne ihr einen Stopp hinzuzufügen.',
  'help.guide.roadtrip-via.step.1':
    'Hol die gewünschte Etappe in den Blick: klick einen Stopp in der Leiste an und schließ dann die Kachel, die sich über der Karte öffnet.',
  'help.guide.roadtrip-via.step.2':
    'Klick die gezeichnete Route an. Auf der angeklickten Etappe wird ein Zwischenpunkt gesetzt, und die Etappe wird neu über ihn geroutet.',
  'help.guide.roadtrip-via.step.3':
    'Die Leiste zieht nach: die Kopfzeile des Tages trägt die neue Strecke und Fahrzeit, und jede Ankunft nach dem Zwischenpunkt wandert mit.',
  'help.guide.roadtrip-via.step.4':
    'Fahr über den Griff, und er sagt, was er kann: Ziehen formt die Route um, Rechtsklick entfernt. Zieh ihn woandershin, und die Etappe wird über die neue Stelle neu gezeichnet.',
  'help.guide.roadtrip-via.step.5':
    'Klick mit rechts auf den Griff, um ihn wegzunehmen. Die Etappe fährt wieder den direkten Weg.',
  'help.guide.roadtrip-via.result':
    'Die Etappe folgt der Straße, die du gewählt hast, und Strecke, Fahrzeit und Ankünfte des Tages werden dafür neu gerechnet.',
  'help.guide.roadtrip-via.tip.1':
    'Ein Zwischenpunkt ist kein Stopp: er hat keine Nummer, keinen Aufenthalt und keine Ankunftszeit, und er zählt nicht zu den Stopps des Tages.',
  'help.guide.roadtrip-via.tip.2':
    'Die Griffe werden ab Zoomstufe 9 gezeichnet, eine auf die ganze Reise eingepasste Karte zeigt die Linie also ohne sie.',
  'help.guide.roadtrip-via.tip.3':
    'Ein Klick weiter als zwei Kilometer von jeder gezeichneten Etappe wird ignoriert, und ein Klick auf einen Flug, einen Zug oder eine Fähre ebenso.',
  // roadtrip-alternatives
  'help.guide.roadtrip-alternatives.title': 'Einen anderen Weg für eine Etappe ausprobieren',
  'help.guide.roadtrip-alternatives.goal': 'Sieh, was der Router sonst noch für ein Stück anbietet, und nimm es.',
  'help.guide.roadtrip-alternatives.step.1':
    'Klick ein Fahrband in der Leiste an, die Zeile zwischen zwei Stopps, die die Etappe als Strecke und Zeit angibt. Ihre Beschriftung ist Andere Wege.',
  'help.guide.roadtrip-alternatives.step.2':
    'Wege für diese Etappe öffnet sich über der Karte, ein Eintrag je Straße, jede in ihrer eigenen Farbe auf der Karte gezeichnet.',
  'help.guide.roadtrip-alternatives.step.3':
    'Fahr über einen Eintrag, um diese Straße aufleuchten zu lassen. Aktuell ist die Straße, die gerade gefahren wird, und Schnellste die schnellste; die übrigen sagen, wie viel länger sie brauchen oder welche Straßenklasse sie auslassen.',
  'help.guide.roadtrip-alternatives.step.4':
    'Klick einen Eintrag an, um so zu fahren, oder Schließen, um bei der Straße zu bleiben, auf der du bist.',
  'help.guide.roadtrip-alternatives.result':
    'Die Etappe fährt die Straße, die du gewählt hast, und die Strecke in der Leiste und die Ankünfte danach ändern sich mit.',
  'help.guide.roadtrip-alternatives.tip.1':
    'Eine andere Straße zu wählen setzt einen Zwischenpunkt auf die Etappe und ersetzt alle, die sie schon hatte; die eigene Straße des Routers zu wählen nimmt sie wieder weg.',
  'help.guide.roadtrip-alternatives.tip.2':
    'Ohne Autobahn, Ohne Maut und Ohne Fähre kommen von einem zweiten Router mit eigenem Geschwindigkeitsmodell, ihre Zeiten sind also nicht mit den anderen vergleichbar.',
  // roadtrip-limits
  'help.guide.roadtrip-limits.title': 'Das Fahrzeug und die Fahrgrenzen setzen',
  'help.guide.roadtrip-limits.goal': 'Sag TREK, womit du fährst und wie weit du am Stück fahren willst.',
  'help.guide.roadtrip-limits.step.1':
    'Die Fahreinstellungen sitzen unter der Suche in der rechten Spalte. Ihre Abzeichen sagen, was gesetzt ist; klick sie an, um sie zu öffnen.',
  'help.guide.roadtrip-limits.step.2':
    'Unter Fahren sind Längste Fahrt am Stück und Fahrzeit pro Tag Minuten. Ein leeres Feld heißt aus, und nichts wird markiert.',
  'help.guide.roadtrip-limits.step.3':
    'Sag unter Fahrzeug, womit du fährst. Sprit füllt nur an Tankstopps nach, Strom nur an Ladestopps, Beides an beiden.',
  'help.guide.roadtrip-limits.step.4':
    'Tipp Reichweite pro Tankfüllung, oder Reichweite pro Ladung, selbst ein. Aus den Fahrzeugdaten rechnen darunter nimmt Tankinhalt und Verbrauch, oder Akkukapazität und Verbrauch, und rechnet es aus.',
  'help.guide.roadtrip-limits.step.5':
    'Möglichst meiden ist ein Wunsch, kein Verbot: ein Tag ohne Weg drumherum nutzt die Straße trotzdem und sagt das in seiner Kopfzeile.',
  'help.guide.roadtrip-limits.step.6':
    'Schließ den Dialog. Die Kachel sagt, was gesetzt ist, und die Leiste markiert jede Etappe und jeden Tag, der darüber geht.',
  'help.guide.roadtrip-limits.result':
    'Die Abzeichen der Kachel sagen, was gesetzt ist, und jede Etappe und jeder Tag über einer Grenze trägt ein Abzeichen in der Leiste.',
  'help.guide.roadtrip-limits.tip.1':
    'Die Einstellungen gehören zur Reise, also plant jeder auf ihr mit demselben Fahrzeug und denselben Grenzen.',
  'help.guide.roadtrip-limits.tip.2':
    'Tanken bis sagt, wie voll ein Stopp tankt, denn unterwegs lädt niemand auf 100 %. Ein Tank- oder Ladestopp kann das für sich überschreiben.',
  'help.guide.roadtrip-limits.tip.3':
    'Die Routenlinie entscheidet, wie die Fahrt gezeichnet wird: Tage verbinden routet die Nacht zwischen zwei Tagen, und Farbe je Tag gibt jedem Tag seine eigene.',
  // roadtrip-day-window
  'help.guide.roadtrip-day-window.title': 'Dem Fahrtag einen Anfang und ein Ende geben',
  'help.guide.roadtrip-day-window.goal':
    'Hör zu einer Uhrzeit auf zu fahren, die du wählst, und sag, wo der Tag enden soll.',
  'help.guide.roadtrip-day-window.step.1':
    'Öffne die Fahreinstellungen in der rechten Spalte und such den Abschnitt Tägliche Reisezeiten.',
  'help.guide.roadtrip-day-window.step.2':
    'Setz einen Tagesbeginn. Allein tut er nichts: es braucht beide Zeiten, wie der Hinweis darunter sagt.',
  'help.guide.roadtrip-day-window.step.3':
    'Setz ein Tagesende. Die Fahrt hält nun zu dieser Uhrzeit und trägt den Rest auf den nächsten Morgen, als Zeile Tagesende und Zeile Weiterfahrt in der Leiste.',
  'help.guide.roadtrip-day-window.step.4':
    'Wähl unter Tagesende planen die Option Auf der Strecke, um zur Endzeit auf der Straße zu pausieren, oder Am letzten Ort, um zu halten, bevor die nächste Fahrt sie überschreiten würde.',
  'help.guide.roadtrip-day-window.step.5':
    'Schließ den Dialog. Die Kachel Fahreinstellungen trägt die beiden Zeiten als Abzeichen.',
  'help.guide.roadtrip-day-window.result':
    'Die Fahrt wird in Reisetage der Länge zerschnitten, die du gesetzt hast, und was nicht hineinpasst, läuft auf gerechneten Tagen nach dem letzten weiter. Deine Tage und ihre Orte werden nicht verändert.',
  'help.guide.roadtrip-day-window.tip.1':
    'Eine der beiden Zeiten zu leeren schaltet das Ganze wieder aus. Zeiten, die du selbst an einem Stopp gesetzt hast, gehen immer vor.',
  'help.guide.roadtrip-day-window.tip.2':
    'Mit gesetzten täglichen Reisezeiten sind die Tage immer verbunden: die Fahrt vom letzten Stopp eines Tages zum ersten des nächsten wird geroutet und mitgezählt.',
  'help.guide.roadtrip-day-window.tip.3':
    'Jedes Tagesende ist auch eine Markierung auf der Karte, ein Mond mit der Tagesnummer. Zieh ihn entlang der Route oder auf einen Ort, um den Tag woanders enden zu lassen; ein Rechtsklick stellt das automatische Ende wieder her, und Automatische Tagesenden wiederherstellen in diesem Dialog setzt alles zurück.',
  // roadtrip-refuel
  'help.guide.roadtrip-refuel.title': 'Tanken, bevor der Tank leer ist',
  'help.guide.roadtrip-refuel.goal':
    'Finde auf dem Stück, das das Fahrzeug noch erreicht, eine Stelle zum Tanken und setz sie in die Fahrt.',
  'help.guide.roadtrip-refuel.step.1':
    'Ist eine Reichweite gesetzt, zeichnet die Leiste ein Band quer über die Etappe, wo sie ausgeht: Hier ist der Tank leer, und darunter, wie weit in der Etappe das ist.',
  'help.guide.roadtrip-refuel.step.2':
    'Die Lampe auf dem Band ist der Knopf. Tankstelle suchen sucht entlang der Straße, die du schon gefahren bist, und zeigt dabei Suche entlang der Strecke…',
  'help.guide.roadtrip-refuel.step.3':
    'Bis zu drei Stationen kommen zurück, jede mit ihrem Abstand zur Route und damit, wie viel Reichweite sie übrig ließe.',
  'help.guide.roadtrip-refuel.step.4':
    'Das Plus an einem Angebot übernimmt es als Tankstopp. Als Stopp hinzufügen öffnet sich mit Art und Aufenthalt schon ausgefüllt, und Übernehmen setzt es an der Stelle auf die Etappe, an der es wirklich passiert wird.',
  'help.guide.roadtrip-refuel.result':
    'Der Stopp sitzt mit eigenem Symbol auf der richtigen Etappe, die Reichweite zählt ab ihm neu, und das Band ist weg.',
  'help.guide.roadtrip-refuel.tip.1':
    'Die Reichweite zählt ab dem letzten Tank- oder Ladestopp, über Tage hinweg. Womit du fährst entscheidet, welche Stopps zählen: Sprit nur Tanken, Strom nur Laden.',
  'help.guide.roadtrip-refuel.tip.2':
    'Die Suche schaut auf die Straße vor dem trockenen Punkt, hält eine Reserve zurück und zählt den Umweg doppelt, alles was sie anbietet ist also wirklich erreichbar.',
  'help.guide.roadtrip-refuel.tip.3':
    'Eine leere Antwort ist keine Sackgasse: die Lampe wird zu Nochmal, denn die Ortssuche ist ein geteilter Dienst, der durchaus in eine Zeitüberschreitung läuft.',
  // roadtrip-track
  'help.guide.roadtrip-track.title': 'Einen Tag einer importierten Spur folgen lassen',
  'help.guide.roadtrip-track.goal':
    'Leg die Fahrt eines Tages auf eine schöne Strecke, die du als GPX- oder KML-Spur importiert hast.',
  'help.guide.roadtrip-track.step.1':
    'Klick das Abzeichen Spur in der Kopfzeile eines Tages an. Der Dialog öffnet sich auf diesem Tag.',
  'help.guide.roadtrip-track.step.2':
    'Wähl eine Spur. Jede sagt, wie lang sie ist und ob sie an diesem Tag entlangläuft oder wie weit sie abseits liegt, die nächste zuerst.',
  'help.guide.roadtrip-track.step.3':
    'Klick Dieser Spur folgen an. TREK setzt Zwischenpunkte dort, wo die Fahrt am weitesten von der Spur abweicht, und routet neu, Runde um Runde.',
  'help.guide.roadtrip-track.step.4':
    'Es sagt, wie viele Zwischenpunkte es gesetzt hat und wie nah die Fahrt nun bleibt. Der Knopf darunter entfernt diese Zwischenpunkte wieder und gibt den Tag dem Router zurück; den Dialog zu schließen behält die Spur.',
  'help.guide.roadtrip-track.result':
    'Die Fahrt des Tages folgt der Spur statt der Straße, die der Router gewählt hat, und ihr Abzeichen Spur leuchtet und nennt diese Spur, wenn du darauf zeigst.',
  'help.guide.roadtrip-track.tip.1':
    'Importier die Datei unter Tage mit Dateimport, und hak dabei Routen oder Tracks an. Solange die Reise keine trägt, trägt kein Tag das Abzeichen.',
  'help.guide.roadtrip-track.tip.2':
    'Einer Spur zu folgen ersetzt die Zwischenpunkte, die die Etappen des Tages schon hatten, form eine Etappe also nach der Spur von Hand, nicht davor.',
};

export default help;
