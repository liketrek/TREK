import type { TranslationStrings } from '../types';

const help: TranslationStrings = {
  'help.title': 'Hilfe & Doku',
  'help.search': 'Doku durchsuchen…',
  'help.contents': 'Inhalt',
  'help.noResults': 'Keine passenden Seiten.',
  'help.errorTitle': 'Seite konnte nicht geladen werden',
  'help.errorBody': 'Die Hilfe wird aus dem TREK-Wiki geladen. Prüf deine Verbindung und versuch es noch einmal.',

  // ── Hilfecenter (das Panel hinter dem ? in der Navigationsleiste) ─────────
  'help.center.button': 'Hilfe zu dieser Ansicht',
  'help.center.title': 'Hilfe',
  'help.center.onThisScreen': 'In dieser Ansicht',
  'help.center.screens': 'Ansichten',
  'help.center.thisScreen': 'Aktuell',
  'help.center.subScreens': '{count} Unterseiten',
  'help.center.subScreens.one': '{count} Unteransicht',
  'help.center.subScreensLabel': 'Unterseiten',
  'help.center.guidesCount': '{count} Anleitungen',
  'help.center.guidesCount.one': '{count} Anleitung',
  'help.center.goToScreen': 'Zu {screen} wechseln',
  'help.center.overview': 'Überblick',
  'help.center.howTo': 'Wie kann ich…',
  'help.center.searchPlaceholder': 'Anleitungen und Doku durchsuchen…',
  'help.center.searchEmpty': 'Keine Treffer für „{query}“.',
  'help.center.searchGuides': 'Anleitungen',
  'help.center.searchDocs': 'Doku',
  'help.center.searchError': 'Die Suche ist gerade nicht verfügbar.',
  'help.center.back': 'Zurück',
  'help.center.close': 'Hilfe schließen',
  'help.center.steps': '{count} Schritte',
  'help.center.steps.one': '{count} Schritt',
  'help.center.step': 'Schritt {n}',
  'help.center.stepsLabel': 'Schritte',
  'help.center.stepOf': 'Schritt {n} von {total}',
  'help.center.screenshot': 'Screenshot', // same-as-en
  'help.center.result': 'Das Ergebnis',
  'help.center.tips': 'Gut zu wissen',
  'help.center.related': 'Verwandte Themen',
  'help.center.openDocs': 'In Hilfe & Doku öffnen',
  'help.center.docsSection': 'In der Doku',
  'help.center.noContext': 'Für diese Ansicht gibt es noch keine Anleitung.',
  'help.center.noContextHint': 'Durchsuche die Doku oder sag uns, was du gesucht hast.',
  'help.center.feedback': 'Fehlt etwas?',
  'help.center.feedbackLink': 'Sag es uns auf GitHub',
  'help.center.discord': 'Auf Discord fragen',
  'help.center.quick': 'Kurz',
  'help.center.guide': 'Anleitung',
  'help.center.tour': 'Rundgang',
  'help.center.imageAlt': 'Schritt {n} von „{title}“',

  // ── Ansicht: Dashboard ────────────────────────────────────────────────────
  'help.ctx.dashboard.title': 'Dashboard', // same-as-en
  'help.ctx.dashboard.summary':
    'Dein Dashboard zeigt alle deine Reisen. Die Karte oben im Stil einer Bordkarte zeigt die Reise, die gerade läuft oder als Nächstes ansteht. Die Zeile darunter zählt, was du bisher bereist hast, und die Karten listen alle Reisen, die du planst, archiviert oder schon hinter dir hast.',
  'help.ctx.dashboard.bullet.1':
    'Bordkarte: die laufende oder nächste Reise mit Datum, Reisenden, Orten und Countdown. Klick darauf, um die Reise zu öffnen. Mit den vier Buttons oben rechts kannst du sie bearbeiten, duplizieren, archivieren oder löschen.',
  'help.ctx.dashboard.bullet.2':
    'Reisestatistik: besuchte Länder, Reisen, Tage unterwegs und geflogene Strecke, über alle deine Reisen hinweg.',
  'help.ctx.dashboard.bullet.3':
    'Reisekarten, gefiltert nach „Geplant“, „Archiviert“ und „Abgeschlossen“, als Raster oder Liste. Das Suchfeld darüber durchsucht alle Reisen auf einmal, nach Titel, Datum oder einem Ort der Reise. „Bearbeiten“, „Duplizieren“, „Archivieren“ und „Löschen“ findest du oben rechts im Foto jeder Karte.',
  'help.ctx.dashboard.bullet.4':
    'Rechts stehen die Widgets: Währungsrechner, Sammlungen (wenn das Add-on „Sammlungen“ aktiv ist), Weltzeituhren, anstehende Reservierungen und Widgets aus Plugins. Die eingebauten kannst du in den Einstellungen unter „Darstellung“ ausschalten.',
  'help.ctx.dashboard.bullet.5':
    'Über die Karte „Neue Reise“ und über den Button unten rechts legst du eine neue Reise an.',

  // create-trip
  'help.guide.create-trip.title': 'Reise anlegen',
  'help.guide.create-trip.goal': 'Leg eine neue Reise mit Name, Daten und Titelbild an.',
  'help.guide.create-trip.step.1':
    'Klick auf „Neue Reise“. Die Karte am Ende deiner Reisen und der Button unten rechts machen dasselbe.',
  'help.guide.create-trip.step.2':
    'Gib der Reise einen Namen. Mehr brauchst du nicht, alles andere kannst du später ergänzen.',
  'help.guide.create-trip.step.3':
    'Wähle ein Start- und ein Enddatum. TREK legt für jedes Datum einen Tag an, dein Reiseplan ist also gleich bereit zum Füllen. Noch keine Daten? Lass beide Felder leer und gib stattdessen die „Anzahl Tage“ ein.',
  'help.guide.create-trip.step.4':
    'Optional: Füg ein Titelfoto hinzu. Lade ein eigenes hoch, zieh es ins Feld, füg es ein oder such auf Unsplash nach deinem Reiseziel.',
  'help.guide.create-trip.step.5': 'Klick auf „Neue Reise erstellen“.',
  'help.guide.create-trip.result':
    'Die Reise erscheint auf deinem Dashboard. Ist es deine nächste Reise, wird sie oben in der Bordkarte angezeigt.',
  'help.guide.create-trip.tip.1':
    'Die Daten kannst du später noch ändern. Gibt es schon Buchungen, fragt TREK, ob sie mit den Tagen mitwandern sollen.',
  'help.guide.create-trip.tip.2':
    'In die Reisewährung, die du hier wählst, werden alle Kosten umgerechnet. Nimm am besten die Währung deines Reiseziels.',

  // edit-trip
  'help.guide.edit-trip.title': 'Reise bearbeiten',
  'help.guide.edit-trip.goal': 'Eine Reise umbenennen, ihre Daten ändern oder ihre Einstellungen anpassen.',
  'help.guide.edit-trip.step.1': 'Klick auf den Stift oben rechts auf der Reisekarte (oder auf der Bordkarte).',
  'help.guide.edit-trip.step.2':
    'Ändere, was nötig ist: Name, Beschreibung, Daten, Cover, Währung, Erinnerung oder Reisebegleiter.',
  'help.guide.edit-trip.step.3': 'Klick auf „Aktualisieren“.',
  'help.guide.edit-trip.result': 'Die Karte aktualisiert sich sofort, für alle Mitglieder der Reise.',
  'help.guide.edit-trip.tip.1':
    'Verschiebst du den Beginn einer Reise mit Buchungen, fragt TREK, ob die Buchungen mitverschoben werden sollen. Kürzt du eine Reise, listet TREK die Tage auf, die wegfallen würden, und was darauf geplant ist; gespeichert wird erst nach „Tage entfernen und speichern“.',

  // cover-image
  'help.guide.cover-image.title': 'Titelbild festlegen',
  'help.guide.cover-image.goal': 'Gib deiner Reise ein Bild für ihre Karte und die Bordkarte.',
  'help.guide.cover-image.step.1': 'Öffne das Bearbeitungsformular der Reise über den Stift auf ihrer Karte.',
  'help.guide.cover-image.step.2':
    'Zieh unter „Titelbild“ ein Foto in das Feld oder füge es ein, klick, um eins hochzuladen, oder gib ein Reiseziel ein und klick auf „Unsplash durchsuchen“.',
  'help.guide.cover-image.step.3': 'Wähle ein Foto und klick auf „Aktualisieren“.',
  'help.guide.cover-image.result':
    'Das Foto wird mit der Reise gespeichert und überall angezeigt, wo die Reise auftaucht.',
  'help.guide.cover-image.tip.1':
    'Fotos aus der Unsplash-Suche bekommen automatisch die Urheberangabe, eigene Uploads bleiben auf deinem Server.',

  // duplicate-trip
  'help.guide.duplicate-trip.title': 'Reise duplizieren',
  'help.guide.duplicate-trip.goal': 'Eine Reise als Vorlage für eine neue nutzen.',
  'help.guide.duplicate-trip.step.1': 'Klicke oben rechts auf der Karte auf das Duplizieren-Icon.',
  'help.guide.duplicate-trip.step.2': 'Lies, was kopiert wird und was nicht, und klick dann auf „Reise kopieren“.',
  'help.guide.duplicate-trip.result':
    'In deinem Dashboard erscheint eine Kopie mit dem Namen des Originals und „(Kopie)“ dahinter. Du kannst sie gleich umbenennen und neu datieren.',
  'help.guide.duplicate-trip.tip.1':
    'Tage, Orte, Touren und Roadtrip-Routen, Reservierungen, Budgetposten, Packlisten, To-dos und Tagesnotizen werden mitkopiert; Packlisten und To-dos sind danach wieder unabgehakt. Mitglieder, Chat, Umfragen, Dateien und Freigabelinks werden nicht übernommen.',

  // archive-trip
  'help.guide.archive-trip.title': 'Reise archivieren und wiederherstellen',
  'help.guide.archive-trip.goal':
    'Nimm eine Reise aus deiner Reiseliste, ohne sie zu löschen, und hol sie später zurück.',
  'help.guide.archive-trip.step.1': 'Klicke oben rechts auf der Karte auf das Archiv-Icon.',
  'help.guide.archive-trip.step.2': 'Stell den Filter über den Karten auf „Archiviert“, um sie wieder zu sehen.',
  'help.guide.archive-trip.step.3':
    'Klick auf der Karte auf „Wiederherstellen“. Die Reise kommt zurück zu „Geplant“ oder, wenn ihr Zeitraum schon vorbei ist, zu „Abgeschlossen“.',
  'help.guide.archive-trip.result':
    'Archivierte Reisen behalten alle Daten. Sie erscheinen nur nicht mehr im Dashboard und im Kalender-Feed aller Reisen.',

  // delete-trip
  'help.guide.delete-trip.title': 'Reise löschen',
  'help.guide.delete-trip.goal': 'Eine Reise endgültig entfernen.',
  'help.guide.delete-trip.step.1': 'Klick oben rechts auf der Karte auf das Papierkorb-Symbol.',
  'help.guide.delete-trip.step.2':
    'Bestätige mit „Löschen“. Der Dialog nennt den Namen der Reise, damit du sicher bist, die richtige zu löschen.',
  'help.guide.delete-trip.result':
    'Die Reise wird samt Tagen, Orten, Buchungen und Dateien gelöscht. Das lässt sich nicht rückgängig machen. Bist du unsicher, archiviere die Reise lieber.',

  // filter-and-view
  'help.guide.filter-and-view.title': 'Abgeschlossene Reisen finden, zwischen Raster und Liste wechseln',
  'help.guide.filter-and-view.goal':
    'Zeig beendete oder archivierte Reisen an und wähle die Ansicht, die dir am besten gefällt.',
  'help.guide.filter-and-view.step.1':
    'Nutze „Geplant“, „Archiviert“ und „Abgeschlossen“ über den Karten. Unter „Abgeschlossen“ stehen alle Reisen, deren Enddatum vorbei ist.',
  'help.guide.filter-and-view.step.2':
    'Klick auf das Listensymbol, um zur kompakten Liste zu wechseln, und noch einmal, um zum Raster zurückzukehren.',
  'help.guide.filter-and-view.result': 'Das Dashboard merkt sich dein Layout auf diesem Gerät.',

  // calendar-feed
  'help.guide.calendar-feed.title': 'Alle Reisen im Kalender abonnieren',
  'help.guide.calendar-feed.goal':
    'Die Tage und Buchungen aller aktiven Reisen in deiner Kalender-App sehen, immer auf dem aktuellen Stand.',
  'help.guide.calendar-feed.step.1': 'Klick auf das Kalendersymbol neben dem Ansichtsumschalter.',
  'help.guide.calendar-feed.step.2': 'Klicke auf „Kalenderabo aktivieren“. TREK erstellt einen privaten Feed-Link.',
  'help.guide.calendar-feed.step.3':
    'Klick auf „Zu Google Kalender hinzufügen“ oder „Zu Apple Kalender / Outlook hinzufügen“. Für jede andere Kalender-App öffnest du „Oder Link manuell kopieren“ und kopierst den Link von dort.',
  'help.guide.calendar-feed.result':
    'Alle aktiven Reisen erscheinen in deinem Kalender und werden automatisch aktualisiert. Archivierte Reisen und Reisen, die vor mehr als 90 Tagen geendet haben, sind nicht enthalten.',
  'help.guide.calendar-feed.tip.1':
    'Der Link ist geheim: Wer ihn hat, kann den Feed lesen. Ist er in falsche Hände geraten, bekommst du mit „Neu erzeugen“ einen neuen Link, und der alte funktioniert nicht mehr; „Ausschalten“ entfernt ihn ganz.',

  // widgets
  'help.guide.widgets.title': 'Dashboard-Widgets auswählen',
  'help.guide.widgets.goal': 'Blende die Statistikzeile und die Widgets rechts ein oder aus.',
  'help.guide.widgets.step.1': 'Öffne oben rechts das Menü hinter deinem Avatar und wähle „Einstellungen“.',
  'help.guide.widgets.step.2': 'Wechsle zum Tab „Darstellung“.',
  'help.guide.widgets.step.3':
    'Schalte unter „Dashboard-Widgets“ jedes Widget ein oder aus, getrennt für Desktop und Mobil. „Rechte Seitenleiste“ blendet die ganze rechte Spalte auf einmal aus.',
  'help.guide.widgets.step.4': 'Geh zurück zum Dashboard. Die Änderung gilt sofort.',
  'help.guide.widgets.result':
    'Blendest du Widgets aus, haben deine Reisen mehr Platz. Schaltest du die ganze rechte Seitenleiste aus, wird das Layout zentriert.',
  'help.guide.widgets.link': 'Einstellungen für „Darstellung“ öffnen',

  // currency-widget
  'help.guide.currency-widget.title': 'Währungen umrechnen',
  'help.guide.currency-widget.goal': 'Rechne einen Betrag mit aktuellen Kursen zwischen zwei Währungen um.',
  'help.guide.currency-widget.step.1': 'Gib den Betrag ein und wähle die beiden Währungen.',
  'help.guide.currency-widget.step.2':
    'Der Pfeil dazwischen tauscht die beiden Währungen, der Kreispfeil aktualisiert den Kurs.',
  'help.guide.currency-widget.result':
    'Dein Währungspaar wird in deinem Konto gespeichert und ist so auf jedem Gerät gleich.',
  'help.guide.currency-widget.tip.1':
    'Die Kurse stammen vom kostenlosen Dienst Frankfurter. Mit dem runden Pfeil in der Ecke des Widgets holst du die aktuellen Kurse.',

  // timezones-widget
  'help.guide.timezones-widget.title': 'Weltuhren hinzufügen',
  'help.guide.timezones-widget.goal': 'Behalte die Ortszeit an deinen Reisezielen im Blick.',
  'help.guide.timezones-widget.step.1':
    'Klicke im Widget „Zeitzonen“ auf +, suche eine Stadt, zum Beispiel Lissabon, und wähle sie aus der Liste.',
  'help.guide.timezones-widget.step.2':
    'Um eine Uhr zu entfernen, fahr mit der Maus darüber und klick rechts auf das ×, das dann erscheint.',
  'help.guide.timezones-widget.result': 'Deine Uhren werden in deinem Konto gespeichert.',
  'help.guide.search-trips.title': 'Reisen durchsuchen',
  'help.guide.search-trips.goal':
    'Eine Reise über ihren Namen, ein Datum oder einen dort geplanten Ort finden, auch archivierte Reisen.',
  'help.guide.search-trips.step.1':
    'Tipp über den Karten in „Trips oder Orte suchen“. Die Liste filtert schon beim Tippen, in geplanten, archivierten und abgeschlossenen Reisen gleichzeitig.',
  'help.guide.search-trips.step.2':
    'Passt eine Reise wegen eines ihrer Orte, steht dieser Ort unter dem Reisetitel. Klick auf das x im Feld oder drück Escape, um wieder alle Reisen zu sehen.',
  'help.guide.search-trips.result':
    'Das Dashboard zeigt nur die passenden Reisen. Leere das Suchfeld, um wieder alle Reisen zu sehen.',
  'help.guide.search-trips.tip.1':
    'Du kannst auch nach Datum suchen: Gib einen Monat mit Jahr ein, etwa Mai 2027 oder 2027-05, und du findest die Reisen in diesem Monat.',
  'help.guide.search-trips.tip.2':
    'Während einer Suche gilt der Schalter „Geplant“, „Archiviert“ und „Abgeschlossen“ nicht. So verschwindet keine Reise hinter dem falschen Filter.',

  // ── Screen: vacay ──────────────────────────────────────────────────────────
  'help.ctx.vacay.title': 'Vacay',
  'help.ctx.vacay.summary':
    'Vacay ist dein persönlicher Urlaubsplaner: Wie viele Urlaubstage hast du im Jahr, welche hast du eingetragen und wie viele sind noch übrig? Das Raster zeigt das ganze Jahr. In der Seitenleiste findest du die Jahresauswahl, die Personen, mit denen du planst, mit dir geteilte Kalender, die Legende und deinen Urlaubsanspruch.',
  'help.ctx.vacay.bullet.1':
    'Jahresübersicht: zwölf Monatskarten, eine Zelle pro Tag. Klick auf einen Tag, um ihn einzutragen oder zu entfernen. Ein kleiner blauer Punkt markiert Tage, an denen schon eine Reise liegt.',
  'help.ctx.vacay.bullet.2':
    'Werkzeugleiste unten: Mit dem ersten Button, der deinen Namen und deine Farbe zeigt, trägst du Urlaub ein; „Betriebsferien“ markiert Tage, an denen der ganze Betrieb frei hat. „Halbtag“ und „Ausgleich“ ändern, was ein Klick einträgt, und „Halbtag“ funktioniert auch bei Betriebsferien.',
  'help.ctx.vacay.bullet.3':
    'Urlaubsanspruch: „Tage“, „Genutzt“ und „Übrig“ für das gewählte Jahr, daneben Übertrag und Ausgleichstage. Mit einem Klick auf die Überschrift der Karte klappst du sie zu.',
  'help.ctx.vacay.bullet.4':
    '„Personen“ sind die Leute, die deinen Plan mit dir teilen, jede in ihrer eigenen Farbe. „Geteilte Kalender“ zeigen die freien Tage anderer als farbige Ringe. Bearbeiten kannst du sie nicht.',
  'help.ctx.vacay.bullet.5':
    'In den Einstellungen legst du Wochenenden, Wochenbeginn, Übertrag, dein Urlaubsjahr, Betriebsferien und die Kalender für Feiertage und Schulferien fest. Solange du mit jemandem zusammen planst, findest du dort auch „Fusion auflösen“.',
  // log-day
  'help.guide.log-day.title': 'Urlaubstag eintragen',
  'help.guide.log-day.goal': 'Trag einen freien Tag im Jahreskalender ein und sieh, wie sich dein Saldo ändert.',
  'help.guide.log-day.step.1':
    'Sieh dir die Werkzeugleiste unten an: Zeigt ihr erster Button deinen Namen in deiner Farbe, trägt ein Klick einen Urlaubstag für dich ein.',
  'help.guide.log-day.step.2':
    'Klick in einem beliebigen Monat auf einen Tag. Er wird in deiner Farbe eingefärbt, und „Verwendet“ steigt um einen Tag.',
  'help.guide.log-day.step.3': 'Klick noch einmal auf denselben Tag, um ihn wieder zu entfernen.',
  'help.guide.log-day.result':
    'Der Tag ist eingetragen. „Tage“, „Weg“ und „Rest“ aktualisieren sich sofort, und alle, die mit deinem Plan verbunden sind, sehen die Änderung direkt.',
  'help.guide.log-day.tip.1':
    'Solange in den Einstellungen „Wochenenden sperren“ eingeschaltet ist, kannst du keine Wochenendtage eintragen. Bereits eingetragene Wochenendtage kannst du aber weiterhin löschen.',
  'help.guide.log-day.tip.2':
    'Ein blauer Punkt in einer Zelle bedeutet, dass an diesem Tag eine deiner Reisen liegt. So siehst du, wo Urlaub und Reisen zusammenfallen.',
  // half-day
  'help.guide.half-day.title': 'Halben Tag eintragen',
  'help.guide.half-day.goal':
    'Einen Nachmittag freinehmen und dafür nur einen halben Tag deines Urlaubsanspruchs verbrauchen.',
  'help.guide.half-day.step.1':
    'Schalte in der Werkzeugleiste „Halbtag“ ein. Der orange Punkt kennzeichnet im Kalender einen halben Tag.',
  'help.guide.half-day.step.2':
    'Klick auf einen Tag. Er wird als 0,5 Tage gezählt und bekommt einen orangen Punkt in der Ecke.',
  'help.guide.half-day.step.3':
    'Schalte „Halbtag“ wieder aus, wenn du fertig bist. Klickst du auf einen halben Tag mit anderen Einstellungen, übernimmt er die aktuellen Einstellungen.',
  'help.guide.half-day.result':
    '„Weg“ steigt um 0,5. „Halbtag“ und „Ausgleich“ sind unabhängig voneinander, du kannst also auch einen halben Ausgleichstag eintragen.',
  'help.guide.half-day.tip.1':
    'Die Leiste zeigt immer die Markierung, die dein nächster Klick setzt. So kannst du vor dem Eintragen prüfen.',
  // comp-day
  'help.guide.comp-day.title': 'Ausgleich oder Gleitzeit eintragen',
  'help.guide.comp-day.goal': 'Freizeitausgleich nehmen, ohne Urlaubstage zu verbrauchen.',
  'help.guide.comp-day.step.1':
    'Schalte in der Werkzeugleiste „Ausgleich“ ein. Die schraffierte Scheibe kennzeichnet im Kalender einen Ausgleichstag.',
  'help.guide.comp-day.step.2':
    'Klick auf einen Tag. Statt einer vollen Fläche bekommt er diagonale Streifen in deiner Farbe.',
  'help.guide.comp-day.result':
    'Ausgleichstage werden neben den Kacheln zum Urlaubsanspruch gezählt und verringern „Rest“ nie.',
  'help.guide.comp-day.tip.1':
    'Dafür ist es gedacht: Überstunden, die du abfeierst, Gleitzeit oder ein Ausgleichstag. Also jede freie Zeit, die kein Urlaub ist.',
  // entitlement
  'help.guide.entitlement.title': 'Urlaubsanspruch festlegen',
  'help.guide.entitlement.goal': 'Vacay mitteilen, wie viele Urlaubstage du im Jahr hast.',
  'help.guide.entitlement.step.1':
    'Klick in der Seitenleiste in der Karte „Urlaubsanspruch“ auf die Kachel „Tage“ in deiner Zeile. Ist die Karte eingeklappt, klick auf ihre Überschrift, um sie aufzuklappen.',
  'help.guide.entitlement.step.2': 'Tipp deine Anzahl an Tagen ein und drück Enter. Mit Escape bleibt der alte Wert.',
  'help.guide.entitlement.result':
    '„Rest“ wird aus deinem Urlaubsanspruch, einem eventuellen Übertrag und den genommenen Tagen neu berechnet.',
  'help.guide.entitlement.tip.1':
    'Jedes Jahr hat seinen eigenen Urlaubsanspruch. Eine Änderung hier gilt also nur für das ausgewählte Jahr.',
  // years
  'help.guide.years.title': 'Jahre hinzufügen und wechseln',
  'help.guide.years.goal': 'Plane schon jetzt das nächste Jahr oder sieh dir das letzte an.',
  'help.guide.years.step.1':
    'Klick auf das + rechts neben der Jahreszahl, um das nächste Jahr hinzuzufügen, oder auf das + links für das vorherige.',
  'help.guide.years.step.2': 'Wechsle mit den Pfeilen oder den Jahres-Chips darunter zwischen den Jahren.',
  'help.guide.years.step.3':
    'Um ein Jahr zu entfernen, fahr mit der Maus über seinen Chip und klick auf das kleine Minus. Dabei werden auch alle Einträge des Jahres gelöscht, bestätige also mit Bedacht.',
  'help.guide.years.result':
    'Jedes Jahr hat seinen eigenen Urlaubsanspruch und seine eigenen Einträge. Der Übertrag verbindet ein Jahr mit dem nächsten.',
  // company-holidays
  'help.guide.company-holidays.title': 'Betriebsferien eintragen',
  'help.guide.company-holidays.goal':
    'Sperr Tage, an denen die ganze Firma frei hat, ohne sie vom Urlaubsanspruch abzuziehen.',
  'help.guide.company-holidays.step.1':
    'Öffne die Einstellungen und prüf, ob „Betriebsferien“ eingeschaltet ist. Standardmäßig ist es an. Nur dann zeigt die Werkzeugleiste den Modus an.',
  'help.guide.company-holidays.step.2': 'Stell zurück im Raster die Werkzeugleiste auf „Betriebsferien“ um.',
  'help.guide.company-holidays.step.3':
    'Klick auf die Tage. Sie werden bernsteinfarben und erscheinen in der Legende. Ein weiterer Klick auf einen Tag entfernt ihn wieder.',
  'help.guide.company-holidays.result':
    'Alle, die mit dem Plan verbunden sind, sehen die Betriebsferien, und sie ziehen nie etwas von „Rest“ ab.',
  'help.guide.company-holidays.tip.1':
    'Alle verbundenen Personen können Betriebsferien bearbeiten. Sprecht also ab, wer sie pflegt.',
  // public-holidays
  'help.guide.public-holidays.title': 'Feiertage anzeigen',
  'help.guide.public-holidays.goal': 'Die Feiertage deines Landes oder deiner Region ins Raster übernehmen.',
  'help.guide.public-holidays.step.1': 'Öffne die Einstellungen und schalte „Feiertage“ ein.',
  'help.guide.public-holidays.step.2':
    'Klick auf „Kalender hinzufügen“ und wähl das Land und, falls nötig, die Region. Gib dem Kalender bei Bedarf eine Farbe und ein Label und klick dann auf „Hinzufügen“.',
  'help.guide.public-holidays.step.3':
    'Schließ die Einstellungen. Die Feiertage erscheinen im Kalender und in der Legende.',
  'help.guide.public-holidays.result':
    'Feiertage werden in der Farbe des Kalenders markiert und nie vom Urlaubsanspruch abgezogen.',
  'help.guide.public-holidays.tip.1':
    'Du kannst mehrere Kalender hinzufügen, zum Beispiel für deine eigene Region und für die einer verbundenen Kollegin.',
  // school-holidays
  'help.guide.school-holidays.title': 'Schulferien anzeigen',
  'help.guide.school-holidays.goal': 'Die Schulferien deiner Region neben deinen eigenen freien Tagen sehen.',
  'help.guide.school-holidays.step.1': 'Öffne die „Einstellungen“ und schalte „Schulferien“ ein.',
  'help.guide.school-holidays.step.2':
    'Klick auf „Kalender hinzufügen“ und wähl das Land. Hat ein Land mehrere Ferienkalender, wähl zusätzlich die Region oder Gruppe und klick dann auf „Hinzufügen“.',
  'help.guide.school-holidays.step.3':
    'Schließ die Einstellungen. Schulferien sind im Kalender in seiner Farbe hinterlegt und haben am unteren Rand ihrer Tage einen Streifen.',
  'help.guide.school-holidays.result':
    'Schulferien werden nur im Kalender angezeigt und verringern nie den Urlaubsanspruch.',
  'help.guide.school-holidays.tip.1':
    'Deine Region fehlt? Die Administration kann Schulferien unter „Admin“, „Personalisierung“, „Schulferien“ von Hand pflegen.',
  // weekends
  'help.guide.weekends.title': 'Wochenenden sperren und Wochenbeginn festlegen',
  'help.guide.weekends.goal': 'Wochenenden nicht mitzählen und die Woche an deinem Wunschtag beginnen lassen.',
  'help.guide.weekends.step.1': 'Öffne die „Einstellungen“.',
  'help.guide.weekends.step.2':
    'Schalte „Wochenenden sperren“ ein und wähl dann unter „Wochenendtage“ die Tage, die für dich zum Wochenende zählen.',
  'help.guide.weekends.step.3': 'Wähle unter „Woche beginnt am“ entweder Mo oder So.',
  'help.guide.weekends.result':
    'Gesperrte Tage sind im Raster ausgegraut und lassen sich nicht versehentlich eintragen.',
  // leave-year
  'help.guide.leave-year.title': 'Urlaubsjahr festlegen',
  'help.guide.leave-year.goal':
    'Berechne deinen Urlaubsanspruch nach Geschäftsjahr oder ab deinem Eintrittsdatum statt von Januar bis Dezember.',
  'help.guide.leave-year.step.1': 'Öffne die Einstellungen und such „Urlaubsjahr“.',
  'help.guide.leave-year.step.2':
    'Wähle „Kalender“, „Geschäftsjahr“ (mit Monat und Tag des Beginns) oder „Eintrittsdatum“ (mit deinem Eintrittsdatum).',
  'help.guide.leave-year.result':
    'Urlaubsanspruch, genommene Tage und Übertrag werden für diesen Zeitraum berechnet, und das Raster beginnt mit dessen erstem Monat.',
  'help.guide.leave-year.tip.1':
    'Diese Einstellung ist persönlich: In einem gemeinsamen Plan behält jeder sein eigenes Urlaubsjahr und seine eigenen Zahlen.',
  // carry-over
  'help.guide.carry-over.title': 'Resturlaub übertragen',
  'help.guide.carry-over.goal': 'Was am Ende eines Zeitraums übrig ist, in den nächsten übertragen.',
  'help.guide.carry-over.step.1': 'Öffne die Einstellungen.',
  'help.guide.carry-over.step.2': 'Schalte „Urlaubsmitnahme“ ein.',
  'help.guide.carry-over.result':
    'Der übertragene Resturlaub wird über alle deine Jahre neu berechnet und unter dem Urlaubsanspruch angezeigt.',
  'help.guide.carry-over.tip.1': 'Schaltest du es aus, wird jeder Übertrag auf null zurückgesetzt.',
  // invite
  'help.guide.invite.title': 'Gemeinsam mit anderen planen',
  'help.guide.invite.goal':
    'Deinen Plan mit dem eines anderen TREK-Benutzers zusammenlegen, damit ihr beide eure freien Tage in einem Raster seht.',
  'help.guide.invite.step.1': 'Klick in der Karte „Personen“ auf das Personen-Symbol.',
  'help.guide.invite.step.2': 'Wähle den Benutzer aus und klicke auf „Einladung senden“.',
  'help.guide.invite.step.3':
    'Die Person bekommt eine Benachrichtigung und beim nächsten Öffnen von Vacay eine Fusionsanfrage. Bis dahin steht die Einladung auf „ausstehend“; fahr mit der Maus darüber, um sie zurückzuziehen.',
  'help.guide.invite.result':
    'Beide Pläne werden zusammengelegt: Jede Person hat eine Farbe, ihr könnt füreinander Tage eintragen, und alles wird live synchronisiert.',
  'help.guide.invite.tip.1':
    'Um eine Fusion rückgängig zu machen, klick in den Einstellungen auf „Auflösen“. Dann landen die Einträge aller wieder in ihrem eigenen Plan.',
  'help.guide.invite.tip.2':
    'Soll die andere Person deine Tage nur sehen, teile lieber deinen Kalender, statt ihn zusammenzuführen.',
  // share-calendar
  'help.guide.share-calendar.title': 'Kalender schreibgeschützt teilen',
  'help.guide.share-calendar.goal': 'Jemandem zeigen, wann du frei hast, ohne dass er deinen Plan ändern kann.',
  'help.guide.share-calendar.step.1': 'Klick in der Karte „Geteilte Kalender“ auf das Teilen-Symbol.',
  'help.guide.share-calendar.step.2': 'Wähle den Benutzer und klick auf „Teilen“. Bestätigen muss er nichts.',
  'help.guide.share-calendar.step.3':
    'Mit dir geteilte Kalender stehen oben in der Karte: Klick auf einen, um ihn aus- oder einzublenden, oder fahr mit der Maus darüber und klick auf das x, um ihn zu entfernen. Unter „Du teilst mit“ fährst du mit der Maus über einen Namen und klickst auf „Nicht mehr teilen“.',
  'help.guide.share-calendar.result':
    'Deine freien Tage erscheinen als farbiger Ring in ihrem Raster. Bearbeiten kann die Person nichts von dem, was du teilst.',
  'help.guide.share-calendar.tip.1':
    'Teilen und Zusammenlegen sind unabhängig voneinander: Du kannst deinen Plan mit einer Person zusammenlegen und deinen Kalender mit anderen teilen.',
  'help.guide.share-calendar.tip.2':
    'Fahr mit der Maus über einen Tag mit Ring, um zu sehen, wer frei hat und wie lange.',

  // ── Screen: atlas ─────────────────────────────────────────────────────────────────────
  'help.ctx.atlas.title': 'Atlas',
  'help.ctx.atlas.summary':
    'Der Atlas zeigt auf einer Weltkarte, wo du überall warst: Jedes Land, in das dich eine Reise geführt hat, ist eingefärbt, und Länder, die du vor TREK besucht hast, kannst du von Hand nachtragen. Zoom hinein, um Regionen zu sehen, führ eine Wunschliste mit Orten, die du noch sehen willst, und lies deine Zahlen im Glas-Panel unten ab.',
  'help.ctx.atlas.bullet.1':
    'Die Karte: Jedes besuchte Land hat seine feste Farbe, geplante Länder sind gestrichelt umrandet, Länder auf der Wunschliste schraffiert und alle anderen grau. Fahr mit der Maus über ein Land, um seine Reisen, Orte sowie den ersten und letzten Besuch zu sehen.',
  'help.ctx.atlas.bullet.2':
    'Suche oben: Tippe ein Land oder einen Ort ein. Bei einem Land, in dem du noch nicht warst, öffnet sich sein Popup; bei einem, in dem du schon warst, erscheint seine Karte im Panel. Wählst du einen Ort, springt die Karte in seine Region, sodass du sie markieren kannst.',
  'help.ctx.atlas.bullet.3':
    '„Geplante Länder anzeigen“ oben rechts blendet die Länder deiner anstehenden Reisen ein. Der Schalter erscheint nur, wenn es solche Reisen gibt.',
  'help.ctx.atlas.bullet.4':
    'Leiste unten: Im Tab „Statistik“ stehen Länder (daneben die geplanten), Regionen, Reisen, Orte, Städte, Tage, Kontinente, deine Serie und die Reisen dieses Jahres. Der Tab „Wunschliste“ zeigt, was noch vor dir liegt. Mit dem Add-on Touren gibt es außerdem einen Tab „Touren“ mit Distanz und Anstieg der Touren, die du gemacht hast.',
  'help.ctx.atlas.bullet.5':
    'Regionen: Zoomst du nah heran, zeigt die Karte Bundesstaaten und Provinzen. Jede davon kannst du anklicken, um sie zu markieren, die Markierung zu entfernen oder sie auf die Wunschliste zu setzen.',
  'help.ctx.atlas.bullet.6':
    'Dawarich: Ist das Addon verbunden, markiert ein Panel links neben der Statistik Wünsche als erledigt und ergänzt Länder aus deinen Aufzeichnungen, aber erst, wenn du es bestätigst.',
  // mark-country
  'help.guide.mark-country.title': 'Land als besucht markieren',
  'help.guide.mark-country.goal':
    'Trag ein Land nach, in dem du schon vor TREK warst, damit es auf der Karte und in deiner Zählung auftaucht.',
  'help.guide.mark-country.step.1': 'Gib das Land oben auf der Karte ins Suchfeld ein.',
  'help.guide.mark-country.step.2':
    'Wähle es aus der Liste. Die Karte springt zum Land, und ein Popup dazu öffnet sich.',
  'help.guide.mark-country.step.3': 'Wähle „Als besucht markieren“.',
  'help.guide.mark-country.result':
    'Das Land bekommt eine Farbe auf der Karte, und „Länder“ steigt um eins. Die Farbe bleibt dauerhaft: Markierst du weitere Länder, ändern sich die Farben der anderen nicht.',
  'help.guide.mark-country.tip.1':
    'Ein Klick auf ein graues Land auf der Karte öffnet dasselbe Popup. Bei kleinen Ländern ist die Suche zuverlässiger.',
  'help.guide.mark-country.tip.2':
    'Ein von Hand markiertes Land zählt immer als besucht, unabhängig von den Daten der Reisen dorthin.',
  // unmark-country
  'help.guide.unmark-country.title': 'Markiertes Land entfernen',
  'help.guide.unmark-country.goal': 'Entferne ein von Hand markiertes Land wieder von der Karte.',
  'help.guide.unmark-country.step.1':
    'Such das Land und wähle es aus oder klick es auf der Karte an. Bei einem selbst markierten Land fragt das Popup, ob du es entfernen willst.',
  'help.guide.unmark-country.step.2': 'Bestätige mit „Entfernen“.',
  'help.guide.unmark-country.result': 'Das Land wird wieder grau und zählt nicht mehr mit.',
  'help.guide.unmark-country.tip.1':
    'So lassen sich nur Länder entfernen, die du von Hand markiert hast. Ein Land mit Reisen oder Orten bleibt markiert, bis diese Reisen oder Orte entfernt sind. Bei einem von Hand markierten Land findest du „Entfernen“ auch in seiner Detailkarte im Panel.',
  // country-details
  'help.guide.country-details.title': 'Sehen, was du in einem Land erlebt hast',
  'help.guide.country-details.goal':
    'Öffne ein besuchtes Land und spring zu den Reisen, die dich dorthin geführt haben.',
  'help.guide.country-details.step.1': 'Gib im Suchfeld oben auf der Karte ein Land ein, in dem du schon warst.',
  'help.guide.country-details.step.2':
    'Wähle es aus. Die Karte schwenkt dorthin, und im Bereich unten erscheint eine Infokarte mit der Flagge, Badges für Orte, Reisen und besuchte Regionen sowie einem Chip für jede der ersten drei Reisen.',
  'help.guide.country-details.result': 'Klick auf den Chip einer Reise, um sie im Planer zu öffnen.',
  'help.guide.country-details.tip.1':
    'Fährst du auf der Karte mit der Maus über das Land, siehst du dieselben Zahlen und dazu den ersten und letzten Besuch.',
  // planned-countries
  'help.guide.planned-countries.title': 'Länder anzeigen, in die du reist',
  'help.guide.planned-countries.goal':
    'Die Länder deiner anstehenden Reisen auf der Karte zeigen, ohne sie als besucht zu zählen.',
  'help.guide.planned-countries.step.1':
    'Schalte oben rechts „Geplante Länder anzeigen“ ein. Die Zahl daneben zeigt, wie viele geplante Länder es gibt.',
  'help.guide.planned-countries.step.2':
    'Such ein geplantes Land und wähle es aus: Im Panel steht „Geplant“, und der Tooltip auf der Karte zeigt, wann du hinfährst.',
  'help.guide.planned-countries.result':
    'Geplante Länder erscheinen mit gestrichelter Umrandung, damit du sie nie mit schon besuchten verwechselst. Der Schalter merkt sich deine Auswahl.',
  'help.guide.planned-countries.tip.1':
    'Ein Land zählt als besucht, sobald die Reise dorthin begonnen hat. Auch eine laufende Reise zählt. Reisen ohne Datum fließen gar nicht in die Statistik ein.',
  'help.guide.planned-countries.tip.2': 'Den Schalter gibt es nur, solange du bevorstehende Reisen hast.',
  // regions
  'help.guide.regions.title': 'Region markieren',
  'help.guide.regions.goal':
    'Nicht nur Länder markieren, sondern auch die Bundesländer, Provinzen oder Präfekturen, in denen du warst.',
  'help.guide.regions.step.1':
    'Zoom so weit in ein Land hinein, bis die Grenzen seiner Bundesstaaten und Provinzen erscheinen. Wenn du das Land suchst und auswählst, springt die Karte nah genug heran.',
  'help.guide.regions.step.2':
    'Klick auf eine Region. Fährst du mit der Maus über eine Region, erscheint ihr Name. Das Popup zeigt die Region und ihr Land.',
  'help.guide.regions.step.3': 'Wähle „Als besucht markieren“.',
  'help.guide.regions.result':
    'Die Region wird in der Farbe des Landes eingefärbt. Markierst du eine Region, zählt auch das Land als besucht, falls es das noch nicht war.',
  'help.guide.regions.tip.1':
    'Klickst du auf eine besuchte Region, kannst du sie entfernen, egal ob du sie selbst markiert hast oder ob sie durch einen Ort hinzugekommen ist.',
  'help.guide.regions.tip.2':
    'Regionen, in denen du echte Orte hast, werden automatisch markiert. Darum musst du dich nicht kümmern.',
  // search-place
  'help.guide.search-place.title': 'Ort suchen und seine Region markieren',
  'help.guide.search-place.goal':
    'Bayern markieren, indem du nach München suchst, ohne wissen zu müssen, in welcher Region die Stadt liegt.',
  'help.guide.search-place.step.1':
    'Gib eine Stadt, eine Sehenswürdigkeit oder eine Adresse ins Suchfeld ein. Zuerst erscheinen Länder, darunter unter „Orte“ die passenden Orte.',
  'help.guide.search-place.step.2':
    'Wähle den Ort aus. Die Karte springt dorthin und ermittelt die Region, in der der Punkt liegt.',
  'help.guide.search-place.step.3':
    'Wähle für diese Region „Als besucht markieren“ oder „Zur Bucket List“, wenn du noch nicht dort warst.',
  'help.guide.search-place.result':
    'Die Region ist markiert und das Land auch. Bei Ländern ohne Regionsdaten im Kartenpaket wird stattdessen das Land selbst markiert.',
  'help.guide.search-place.tip.1':
    'Orte kommen aus derselben Suche wie überall in TREK und nutzen also den Anbieter, den deine Administration eingerichtet hat.',
  // bucket-country
  'help.guide.bucket-country.title': 'Land auf die Wunschliste setzen',
  'help.guide.bucket-country.goal':
    'Eine Wunschliste mit Ländern auf der Karte führen, getrennt von den Ländern, die du schon besucht hast.',
  'help.guide.bucket-country.step.1': 'Such das Land und wähle es aus, oder klick es auf der Karte an.',
  'help.guide.bucket-country.step.2': 'Wähle „Zur Bucket List“.',
  'help.guide.bucket-country.step.3':
    'Wähle Monat und Jahr, falls du schon weißt, wann, und bestätige mit „Zur Bucket List“.',
  'help.guide.bucket-country.result':
    'Das Land erscheint mit diagonalen Streifen in der Farbe, die es nach deinem Besuch bekommt, und steht im Tab „Wunschliste“ des Panels.',
  'help.guide.bucket-country.tip.1':
    'Steht das Land auf der Liste, bietet dasselbe Popup „Von der Wunschliste entfernen“ an.',
  'help.guide.bucket-country.tip.2':
    'Ein Eintrag pro Zieldatum: Dasselbe Land kann für zwei verschiedene Monate auf der Liste stehen, aber nicht zweimal für denselben Monat.',
  // bucket-place
  'help.guide.bucket-place.title': 'Ort zur Wunschliste hinzufügen',
  'help.guide.bucket-place.goal':
    'Eine Stadt, Sehenswürdigkeit oder Adresse, die du besuchen willst, mit Koordinaten und Zieldatum speichern.',
  'help.guide.bucket-place.step.1': 'Öffne im Panel unten den Tab „Wunschliste“.',
  'help.guide.bucket-place.step.2': 'Klick auf „Ort hinzufügen“.',
  'help.guide.bucket-place.step.3':
    'Gib den Namen ein und klick auf die Suche. Wähle den passenden Treffer, damit der Ort Koordinaten bekommt. Du kannst auch nur einen Namen eingeben und die Suche weglassen.',
  'help.guide.bucket-place.step.4': 'Wähle bei Bedarf Monat und Jahr und klick auf „Hinzufügen“.',
  'help.guide.bucket-place.result':
    'Der Ort steht mit seinem Zieldatum ganz oben auf deiner Wunschliste. Fährst du mit der Maus darüber, erscheint das ×, mit dem du ihn wieder entfernst.',
  'help.guide.bucket-place.tip.1':
    'Dawarich kann einen Wunsch später nur dann als erledigt markieren, wenn er Koordinaten hat. Das passiert, sobald deine Aufzeichnungen zeigen, dass du dort warst.',
  // stats
  'help.guide.stats.title': 'Deine Statistik verstehen',
  'help.guide.stats.goal': 'Verstehen, was die Zahlen im Panel zählen und was nicht.',
  'help.guide.stats.step.1':
    '„Länder“ ist die Zahl der verschiedenen Länder, in denen du tatsächlich warst; geplante stehen darunter, zählen aber nicht mit. „Regionen“ zählt die Bundesstaaten und Provinzen, in denen du warst. „Trips“, „Orte“ und „Tage“ sind Summen über alle deine Reisen. „Städte“ wird aus den Adressen deiner Orte ermittelt und ist daher eine Schätzung.',
  'help.guide.stats.step.2':
    'Die Kontinente zeigen die besuchten Länder pro Kontinent. „Antarktis“ erscheint in der Zeile, sobald du dort warst. Danach folgen deine Serie (aufeinanderfolgende Jahre mit mindestens einer Reise) und wie viele Reisen du dieses Jahr gemacht hast.',
  'help.guide.stats.result':
    'Die Zahlen aktualisieren sich automatisch, während du deine Reisen planst. Hier musst du nichts pflegen.',
  'help.guide.stats.tip.1':
    'Städte werden aus dem Adresstext übernommen, nicht nachgeschlagen. Eine kurze Adresse wie „Osteria Francescana, Italy“ oder eine, die mit einer Präfektur endet, kann deshalb als Region statt als Stadt zählen.',
  'help.guide.stats.tip.2':
    'Von Hand markierte Länder zählen bei „Länder“ und bei den Kontinenten mit, bringen aber keine Reisen, Orte oder Tage ein.',
  // dawarich-countries
  'help.guide.dawarich-countries.title': 'Länder aus deinen Aufzeichnungen hinzufügen',
  'help.guide.dawarich-countries.goal':
    'Mit Dawarich herausfinden, in welchen Ländern du im letzten Jahr warst, und die bestätigten auf die Karte übernehmen.',
  'help.guide.dawarich-countries.step.1':
    'Ist das Dawarich-Addon verbunden, erscheint unten auf der Karte links neben der Statistik ein Dawarich-Panel mit zwei Kacheln. Klick auf „Länder“.',
  'help.guide.dawarich-countries.step.2':
    'Der Dialog öffnet sich im Tab „Länder“. Klick auf „Nach Ländern suchen“: TREK liest Monat für Monat die Länder und Städte aus, die deine Aufzeichnungen der letzten 12 Monate abdecken, das kann also einen Moment dauern. Jedes Land, das noch nicht in deinem Atlas ist, erscheint mit Flagge, Anzahl der Städte und dem Namen der ersten Stadt. Alle Länder sind vorab angehakt. Klick auf eine Zeile, um ein Land auszulassen.',
  'help.guide.dawarich-countries.step.3':
    'Bestätige mit dem Button unten rechts; sind fünf Zeilen angehakt, heißt er „5 Länder hinzufügen“. Der Dialog zeigt, wie viele hinzugefügt wurden. Wenn du ihn schließt, ist die Karte schon aktualisiert.',
  'help.guide.dawarich-countries.result':
    'Die bestätigten Länder werden auf der Karte eingefärbt und unter „Länder“ gezählt, mit Dawarich als Quelle. Von Hand markierte Länder bleiben unverändert.',
  'help.guide.dawarich-countries.tip.1':
    'Länder, die der Atlas schon als besucht zeigt, ob von Hand, durch eine Reise oder durch eine frühere Prüfung, werden ausgelassen. Deine eigenen Markierungen ändern sich also nie. Ein Land, das du früher aus dem Atlas entfernt hast, kommt wieder dazu, wenn du es hier bestätigst.',
  'help.guide.dawarich-countries.tip.2':
    'Kann TREK einen Ländernamen nicht zuordnen, wird er unter den Zeilen aufgeführt und nicht verworfen. „Erneut prüfen“ fragt Dawarich noch einmal ab. Der Hinweis unter der Liste nennt die letzten 12 Monate als geprüften Zeitraum. Diesen Zeitraum kannst du nicht ändern.',
  // dawarich-wishes
  'help.guide.dawarich-wishes.title': 'Wünsche anhand deiner Aufzeichnungen abhaken',
  'help.guide.dawarich-wishes.goal':
    'Herausfinden, welche Orte deiner Wunschliste du tatsächlich erreicht hast, und sie mit dem Datum als erreicht markieren.',
  'help.guide.dawarich-wishes.step.1':
    'Klick im Dawarich-Panel unten auf der Karte, links neben der Statistik, auf „Wunschliste“.',
  'help.guide.dawarich-wishes.step.2':
    'Der Dialog öffnet sich im Tab „Wunschliste“. Klick auf „Wunschliste prüfen“: TREK durchsucht deine Aufzeichnungen nach jedem Eintrag mit Koordinaten. Ein erreichter Wunsch erscheint mit der Angabe, wie nah du gekommen bist, wie lange du geblieben bist und an welchem Tag, und ist vorab angehakt. Bei einem bereits abgehakten steht „Bereits abgehakt“. Unter der Liste zählt ein Hinweis die Einträge ohne Koordinaten und nennt auch die Regel: Ein Wunsch gilt als erreicht, wenn du ihm auf 250 m nahe kommst und 20 Minuten vor Ort bist.',
  'help.guide.dawarich-wishes.step.3':
    'Bestätige mit dem Button unten rechts, der bei zwei angehakten Zeilen „2 abhaken“ heißt. Schließ dann den Dialog und öffne im Panel daneben den Tab „Wunschliste“.',
  'help.guide.dawarich-wishes.result':
    'Jeder Wunsch bekommt ein grünes Häkchen mit dem Datum des Aufenthalts, nicht dem heutigen. Der Tooltip lautet „Anhand deiner Dawarich-Aufzeichnungen abgehakt“. Ein Klick auf das Datum macht es rückgängig.',
  'help.guide.dawarich-wishes.tip.1':
    'Vorbeifahren zählt nicht: Du musst in der Nähe des Ortes gewesen und eine Weile geblieben sein. Kommen mehrere Aufenthalte infrage, zählt der längste. Ein Wunsch ohne Koordinaten lässt sich nicht prüfen. Leg Orte deshalb über die Suche in „Ort hinzufügen“ an, nicht nur mit dem Namen.',
  'help.guide.dawarich-wishes.tip.2':
    'Eine Prüfung sieht sich bis zu 50 Einträge an, zuerst die noch nicht abgehakten. Gibt es mehr, sagt TREK dir Bescheid. Ein bereits abgehakter Wunsch behält sein eigenes Datum.',

  // ── Screen: collections ───────────────────────────────────────────────────────────────
  'help.ctx.collections.title': 'Sammlungen',
  'help.ctx.collections.summary':
    'Sammlungen ist deine Bibliothek außerhalb aller Reisen: benannte Listen mit Orten, die du gefunden hast und behalten willst, jeder mit dem Status „Idee“, „Will hin“ oder „Besucht“, und, wenn Touren eingeschaltet ist, ganze Touren, die du aus einer Reise übernommen hast. Orte und Touren werden in Reisen hinein- und aus ihnen herauskopiert, nie verknüpft: Eine Liste und eine Reise ändern sich also nie gegenseitig.',
  'help.ctx.collections.bullet.1':
    'Die Listenspalte links zeigt deine eigenen Listen, die mit dir geteilten, noch nicht beantwortete Einladungen und „Alle gespeicherten“, wo alles aus deinen eigenen Listen zusammenkommt. Ganz oben findest du „Neue Liste“ und den Dateiimport.',
  'help.ctx.collections.bullet.2':
    'Kopfbereich der geöffneten Liste: Farbe, Cover, Beschreibung und Links, die Mitglieder und rechts „Bearbeiten“ (nur für den Besitzer), „Exportieren“ und „Teilen“. Bei einer Liste, die mit dir geteilt wurde, steht statt „Teilen“ dort „Geteilt“.',
  'help.ctx.collections.bullet.3':
    'Filterzeile über den Orten: das + zum Hinzufügen eines Ortes, die Dropdowns „Status“, „Kategorie“, „Bewertung“ und „Sortieren“, das Häkchen-Symbol für „Wählen“ und das Wolken-Symbol für „Aus einer Reise übernehmen“. Der Label-Filter kommt nur dazu, wenn gerade keine Karte angezeigt wird.',
  'help.ctx.collections.bullet.4':
    'Ortszeilen: Foto, Name und Adresse, Labels und Kategorie, und rechts der Status-Chip, der mit jedem Klick zum nächsten Status springt.',
  'help.ctx.collections.bullet.5':
    'Karte rechts: ein Pin pro Ort mit Koordinaten. In ihrer oberen Leiste findest du „Karte vergrößern“ (bzw. „Liste zeigen“, sobald die Karte den ganzen Platz einnimmt), den Label-Filter mit dem Button zum Verwalten der Labels und das Feld „Orte suchen“. Ein Klick auf einen Pin öffnet den Ort.',
  'help.ctx.collections.bullet.6':
    'Detailblatt: Klick auf eine Zeile, um Cover, Kategorie, Status, Sternebewertung, Labels, Beschreibung und Links zu sehen. Mit der Kamera auf dem Cover änderst du das Foto; unten findest du „Bearbeiten“, „In Reise kopieren“, den Navigations-Button und „Aus Liste entfernen“.',
  // create-list
  'help.guide.create-list.title': 'Liste erstellen',
  'help.guide.create-list.goal': 'Leg eine neue Liste mit Namen, Farbe und Titelbild an, bereit für deine Orte.',
  'help.guide.create-list.step.1': 'Klick oben in der Listen-Seitenleiste auf „Neue Liste“.',
  'help.guide.create-list.step.2':
    'Gib der Liste einen Namen und wähle eine Farbe. Titelbild, Beschreibung und Links sind optional und lassen sich später über „Bearbeiten“ ergänzen.',
  'help.guide.create-list.step.3': 'Klick auf „Erstellen“.',
  'help.guide.create-list.result':
    'Die Liste öffnet sich leer, und du kannst sie auf zwei Wegen füllen: mit „Ort hinzufügen“ oder „Aus einer Reise übernehmen“.',
  'help.guide.create-list.tip.1':
    'Als Cover kannst du ein eigenes Bild hochladen oder im selben Dialog eines über die Unsplash-Suche finden.',
  // add-place
  'help.guide.add-place.title': 'Ort hinzufügen',
  'help.guide.add-place.goal':
    'Such einen Ort und speichere ihn in einem Schritt mit Name, Kategorie, Status und Notizen in der geöffneten Liste.',
  'help.guide.add-place.step.1':
    'Klick auf das + am Anfang der Filterzeile über den Orten. Ist die Liste noch leer, klick in der Mitte der Seite auf „Ort hinzufügen“.',
  'help.guide.add-place.step.2':
    'Gib den Ort ins Suchfeld ein und wähle einen Treffer. Name, Adresse und Koordinaten werden daraus übernommen.',
  'help.guide.add-place.step.3':
    'Setz den Status und bei Bedarf Kategorie, Beschreibung und Links und klick dann auf „Hinzufügen“. Der Dialog bleibt für den nächsten Ort geöffnet, „Abbrechen“ schließt ihn.',
  'help.guide.add-place.result': 'Der Ort erscheint in der Liste und, wenn er Koordinaten hat, als Pin auf der Karte.',
  'help.guide.add-place.tip.1':
    'Innerhalb einer Reise legst du mit „In Sammlung speichern“ im Ortsinspektor oder im Menü eines Ortes einen Ort der Reise auf eine Liste, ohne die Reise zu verlassen.',
  'help.guide.add-place.tip.2':
    'Die Liste muss dir gehören, oder du musst dort Bearbeiter oder Admin sein. Unter „Alle gespeicherten“ und in Listen, die du nur ansehen darfst, gibt es das + nicht.',
  // import-from-trip
  'help.guide.import-from-trip.title': 'Orte aus einer Reise übernehmen',
  'help.guide.import-from-trip.goal':
    'Alle Orte einer Reise auf einmal in eine Liste übernehmen, statt sie einzeln zu speichern.',
  'help.guide.import-from-trip.step.1':
    'Klick in der Filterzeile auf den Import-Button mit dem Wolkenpfeil. Bei einer leeren Liste findest du ihn neben „Ort hinzufügen“.',
  'help.guide.import-from-trip.step.2': 'Wähle eine deiner Reisen.',
  'help.guide.import-from-trip.step.3':
    'Hak die Orte an, die du willst. Orte, die schon auf der Liste stehen, sind ausgegraut. Vorausgewählt sind die Orte, die an keinem Tag der Reise eingeplant sind, oder alle neuen Orte, wenn jeder Ort schon einem Tag zugeordnet ist. „Nur neue“ blendet aus, was du schon hast.',
  'help.guide.import-from-trip.step.4':
    'Klick auf „Importieren“. Der Button zeigt immer an, wie viele Orte hinzugefügt werden.',
  'help.guide.import-from-trip.result':
    'Die Orte werden mit Name, Adresse, Koordinaten, Beschreibung und Kategorie in die Liste kopiert. Die Reise bleibt unverändert.',
  'help.guide.import-from-trip.tip.1':
    'TREK überspringt Duplikate nach Name oder Koordinaten automatisch, du kannst also ruhig zweimal importieren.',
  'help.guide.import-from-trip.tip.2':
    'In der Ortsliste einer Reise bietet dir der Auswahlmodus stattdessen „In Sammlung speichern“ an, für Orte, die du selbst auswählst.',
  // place-status
  'help.guide.place-status.title': 'Status eines Ortes festlegen',
  'help.guide.place-status.goal':
    'Im Blick behalten, was nur eine Idee ist, was in der engeren Auswahl steht und wo du schon warst.',
  'help.guide.place-status.step.1': 'Klick auf den Status rechts in der Zeile eines Ortes. Aus „Idee“ wird „Will hin“.',
  'help.guide.place-status.step.2': 'Ein weiterer Klick setzt ihn auf „Besucht“, noch einer wieder auf „Idee“.',
  'help.guide.place-status.result':
    'Das Badge und seine Farbe ändern sich sofort, und die Zahlen im Statusfilter über der Liste werden aktualisiert.',
  'help.guide.place-status.tip.1':
    'Den Status gibt es nur in Sammlungen. Kopierst du einen Ort in eine Reise, wird sein Status nicht übernommen.',
  'help.guide.place-status.tip.2':
    'Aus einer Reise heraus öffnet „In Sammlung speichern“ das Fenster „In Liste speichern“, mit einem Status-Chip für jede Liste, in der der Ort steht. Außerdem bietet die Auswahlleiste im Ortsbereich „In deinen Listen als besucht markieren“.',
  // place-detail
  'help.guide.place-detail.title': 'Gespeicherten Ort öffnen',
  'help.guide.place-detail.goal':
    'Alles über einen Ort sehen und direkt damit arbeiten: bearbeiten, in eine Reise kopieren, den Weg finden, entfernen.',
  'help.guide.place-detail.step.1':
    'Klick auf die Zeile eines Ortes. Die Detailansicht öffnet sich neben der Liste, und die Karte springt zum Ort.',
  'help.guide.place-detail.step.2':
    'Unten findest du „Bearbeiten“, „In Reise kopieren“, den Navigations-Button, der den Ort in einer Karten-App öffnet, und „Aus Liste entfernen“. Mit der Kamera auf dem Cover ersetzt du das automatische Foto durch ein eigenes.',
  'help.guide.place-detail.result':
    'Mit „Bearbeiten“ kannst du Name, Kategorie, Labels, Adresse, Koordinaten, Beschreibung und Links direkt in der Detailansicht ändern.',
  'help.guide.place-detail.tip.1':
    'Hat der Ort kein eigenes Bild, wird das Titelbild automatisch geladen. Eigene Bilder kannst du als JPG, PNG, GIF, WebP oder HEIC mit bis zu 20 MB hochladen. Der Papierkorb neben der Kamera stellt wieder das automatische Foto ein.',
  'help.guide.place-detail.tip.2':
    'Jedes Mitglied, auch du, kann unter dem Status Sterne vergeben; der Filter „Bewertung“ in der Filterzeile nutzt den Durchschnitt.',
  // labels
  'help.guide.labels.title': 'Orte mit Labels gruppieren',
  'help.guide.labels.goal':
    'Gib einer Liste zusätzlich zu den gemeinsamen Kategorien eigene Labels, etwa Stadtviertel oder Tage.',
  'help.guide.labels.step.1':
    'Klicke neben den Labels über der Karte auf „Label hinzufügen“ (sobald die Liste Labels enthält, heißt es „Labels verwalten“). Ist keine Karte zu sehen, findest du es am Ende der Filterzeile.',
  'help.guide.labels.step.2':
    'Gib einen Namen ein, wähle eine Farbe und klick auf „Label hinzufügen“. Im selben Dialog kannst du bestehende Labels umbenennen, umfärben oder löschen.',
  'help.guide.labels.step.3':
    'Schalt „Wählen“ ein, hak die Orte an und klick in der Auswahlleiste auf „Label zuweisen“. Wähl dann die Labels und bestätige mit „Label zuweisen“. Einem einzelnen Ort kannst du Labels auch über „Bearbeiten“ in seinem Detailblatt geben.',
  'help.guide.labels.step.4':
    'Klick über der Karte auf ein oder mehrere Labels, um Liste und Karte auf Orte mit einem dieser Labels einzugrenzen. Klick erneut auf ein Label, um es wieder abzuwählen.',
  'help.guide.labels.result':
    'Orte mit Labels zeigen diese in ihrer Zeile. Den Label-Filter können alle Mitglieder nutzen, auch Betrachter.',
  'help.guide.labels.tip.1':
    'Labels gehören zu der Liste, in der sie angelegt wurden. Verschiebst du einen Ort in eine andere Liste, verliert er seine Labels.',
  'help.guide.labels.tip.2': 'Zum Verwalten und Zuweisen von Labels brauchst du Bearbeitungsrechte für die Liste.',
  // filter-select
  'help.guide.filter-select.title': 'Orte filtern und auswählen',
  'help.guide.filter-select.goal': 'Filtere die Liste und bearbeite viele Orte auf einmal.',
  'help.guide.filter-select.step.1':
    'Nutz die Auswahlmenüs in der Filterzeile: Status, Kategorie, Mindestbewertung und Sortierung. Bei Status und Kategorie siehst du, wie viele Orte nach jeder Auswahl übrig bleiben.',
  'help.guide.filter-select.step.2':
    'Klicke hinter den Dropdowns auf das Häkchen-Icon „Wählen“. Jede Zeile bekommt ein Kästchen, und eine Auswahlleiste erscheint.',
  'help.guide.filter-select.step.3':
    'Hak Orte an oder nimm „Alle auswählen“ für alles, was der Filter übrig lässt. Wähl dann „Label zuweisen“, „In Liste verschieben“, „In Liste duplizieren“, „In Reise kopieren“ oder „Löschen“. Verschieben und Löschen dürfen nur der Besitzer oder ein Admin der Liste.',
  'help.guide.filter-select.result':
    'Die Aktionen gelten für die ganze Auswahl auf einmal. Mit dem × rechts beendest du den Auswahlmodus.',
  'help.guide.filter-select.tip.1':
    '„Alle auswählen“ wählt nur die Orte aus, die zum Filter passen. Willst du alle Orte mit „Will hin“ bearbeiten, filtere nach „Will hin“ und klick auf „Alle auswählen“.',
  // copy-to-trip
  'help.guide.copy-to-trip.title': 'Orte in eine Reise kopieren',
  'help.guide.copy-to-trip.goal': 'Gespeicherte Orte als Stopps zu einer deiner Reisen hinzufügen.',
  'help.guide.copy-to-trip.step.1':
    'Schalte „Wählen“ ein und hak die Orte an, oder öffne einen Ort und nutze „In Reise kopieren“ in seiner Detailansicht.',
  'help.guide.copy-to-trip.step.2': 'Klick in der Auswahlleiste auf „In Reise kopieren“.',
  'help.guide.copy-to-trip.step.3': 'Wähle die Reise. Bei einer langen Liste hilft das Suchfeld beim Filtern.',
  'help.guide.copy-to-trip.result':
    'Die Orte werden mit Name, Beschreibung, Kategorie, Notizen, Preis, Koordinaten, Foto und Tags in die Ortsliste dieser Reise übernommen. An der Sammlung ändert sich nichts.',
  'help.guide.copy-to-trip.tip.1':
    'Das können auch Betrachter einer geteilten Liste. Dabei werden die Orte aus der Liste kopiert, die Liste selbst bleibt unverändert.',
  // share-list
  'help.guide.share-list.title': 'Liste mit anderen teilen',
  'help.guide.share-list.goal': 'Eine Liste live mit anderen auf diesem TREK planen.',
  'help.guide.share-list.step.1': 'Klick oben in deiner Liste auf „Teilen“.',
  'help.guide.share-list.step.2': 'Wähle den Benutzer und eine Rolle: „Betrachter“, „Bearbeiter“ oder „Admin“.',
  'help.guide.share-list.step.3':
    'Klick auf „Einladung senden“. Die Person wird als ausstehend angezeigt, bis sie die Einladung in ihrer Listenleiste oder über die Benachrichtigung annimmt.',
  'help.guide.share-list.result':
    'Sobald die Einladung angenommen ist, erscheint die Liste dort unter „Geteilt“, und jede Änderung wird live synchronisiert. Mitglieder und ihre Rollen kannst du weiterhin im selben Dialog bearbeiten.',
  'help.guide.share-list.tip.1':
    'Betrachter können ansehen, bewerten und Orte in ihre eigenen Reisen kopieren. Bearbeiter fügen Orte und Labels hinzu und bearbeiten sie. Admins können außerdem verschieben und löschen.',
  'help.guide.share-list.tip.2':
    'Nur der Besitzer kann Leute einladen und entfernen. Mitglieder können eine geteilte Liste aber selbst verlassen.',
  // export-list
  'help.guide.export-list.title': 'Liste als Datei exportieren',
  'help.guide.export-list.goal':
    'Eine Liste an jemanden auf einem anderen TREK-Server weitergeben oder in einer Karten-App öffnen.',
  'help.guide.export-list.step.1': 'Klick oben in der Liste auf „Exportieren“.',
  'help.guide.export-list.step.2':
    'Wähle „TREK-Liste“, um die Liste samt Labels und Status in einem anderen TREK zu nutzen, oder GPX für OsmAnd, Organic Maps, ein Garmin-Gerät und andere Apps, die Wegpunkte lesen.',
  'help.guide.export-list.result':
    'Die Datei wird heruntergeladen. Jedes Mitglied einer geteilten Liste darf sie exportieren.',
  'help.guide.export-list.tip.1':
    'Ein Ort ohne Koordinaten kann kein GPX-Wegpunkt sein. Er wird ausgelassen, und TREK sagt dir, wie viele Orte das betrifft.',
  'help.guide.export-list.tip.2':
    'Bewertungen, Mitglieder und hochgeladene Fotos werden bewusst nicht exportiert: Sie gehören zu dieser TREK-Instanz, nicht zur Liste.',
  // import-file
  'help.guide.import-file.title': 'Liste aus einer Datei importieren',
  'help.guide.import-file.goal':
    'Eine TREK-Listendatei oder GPX-Datei importieren, als neue Liste oder in eine bestehende.',
  'help.guide.import-file.step.1':
    'Klick in der Listenleiste neben „Neue Liste“ auf den Import-Button mit dem Upload-Pfeil.',
  'help.guide.import-file.step.2':
    'Wähle die Datei aus. Bevor TREK etwas importiert, zeigt es dir den Inhalt der Datei: den Namen, die Anzahl der Orte und die Anzahl der Labels.',
  'help.guide.import-file.step.3':
    'Lass „Neue Liste“ ausgewählt und ändere den Namen, wenn du magst, dann klicke auf Importieren. Oder wähle „Zu einer Liste hinzufügen“, um die Orte in eine Liste zu legen, die du bearbeiten darfst, und klicke auf Hinzufügen.',
  'help.guide.import-file.result':
    'Die Liste öffnet sich mit den importierten Orten. Ein Import in eine Liste fügt nur Orte hinzu. Bereits vorhandene Orte behalten Status, Notizen und Labels.',
  'help.guide.import-file.tip.1':
    'Aus einer GPX-Datei wird jeder benannte Wegpunkt zu einem Ort. Tracks sind Linien und werden ausgelassen; die Vorschau zeigt, wie viele Punkte das waren.',
  'help.guide.import-file.tip.2':
    'Eine Datei, die weder eine TREK-Liste noch eine GPX-Datei ist, lehnt TREK ab und nennt den Grund. Lässt sich ein einzelner Ort nicht lesen, wird nur dieser übersprungen, nicht die ganze Datei.',
  // edit-list
  'help.guide.edit-list.title': 'Liste bearbeiten oder löschen',
  'help.guide.edit-list.goal':
    'Name, Farbe, Cover, Beschreibung oder Links einer Liste ändern oder die Liste entfernen.',
  'help.guide.edit-list.step.1': 'Klick oben in der Liste auf „Bearbeiten“. Das sieht nur der Eigentümer.',
  'help.guide.edit-list.step.2':
    'Ändere, was du möchtest, und klick auf „Speichern“. Mit dem Papierkorb unten links, „Liste löschen“, entfernst du die Liste nach einer Rückfrage samt allen Orten darin.',
  'help.guide.edit-list.result':
    'Der Kopfbereich zeigt die neue Farbe, das neue Cover und die neue Beschreibung sofort.',
  'help.guide.edit-list.tip.1':
    'Das Löschen einer Liste lässt sich nicht rückgängig machen. Exportiere sie vorher, wenn du eine Kopie behalten willst.',
  // all-saved
  'help.guide.all-saved.title': 'Deine ganze Sammlung durchsuchen',
  'help.guide.all-saved.goal': 'Sieh die Orte aus all deinen Listen auf einen Blick.',
  'help.guide.all-saved.step.1':
    'Klick in der Listenleiste auf „Alle gespeicherten“. Dort siehst du die Orte aller Listen zusammen, die dir allein oder gemeinsam mit anderen gehören.',
  'help.guide.all-saved.step.2':
    'Tipp in „Orte suchen“ über der Karte und nutz die Filter wie in jeder Liste. Auch „Wählen“ funktioniert hier: listenübergreifend verschieben, duplizieren, in eine Reise kopieren oder löschen.',
  'help.guide.all-saved.result':
    'Diese Ansicht zeigt alle deine gespeicherten Orte zusammen. Hinzufügen oder importieren kannst du hier nichts, weil es keine einzelne Liste gibt, in die die Orte kommen könnten.',
  'help.guide.all-saved.tip.1':
    'Labels und behaltene Touren gehören immer zu einer bestimmten Liste, deshalb gibt es beides unter „Alle gespeicherten“ nicht.',

  // ── Screen: journey ───────────────────────────────────────────────────────────────────
  'help.ctx.journey.title': 'Journey', // same-as-en
  'help.ctx.journey.summary':
    'Journey ist dein Reisetagebuch, bei dem die Fotos im Mittelpunkt stehen. Jede Journey ist mit einer oder mehreren Reisen verknüpft, und du füllst sie Tag für Tag mit Einträgen aus Geschichte, Fotos, Stimmung und Wetter. Hier siehst du alle deine Journeys; öffne eine, um zu schreiben.',
  'help.ctx.journey.bullet.1':
    'Das Banner oben zeigt die laufende Journey oder deine letzte, mit der Zahl ihrer Einträge, Fotos und Orte. „Weiterschreiben“ öffnet sie beim heutigen Tag. Ist eine Reise gerade zu Ende gegangen, bietet darüber ein Banner „Trip gerade beendet“ an, aus dieser Reise eine Journey zu machen.',
  'help.ctx.journey.bullet.2':
    'Unter „Alle Journeys“ steht pro Journey eine Karte mit Cover, Status, Zeitraum und Zählern; die Journey aus dem Banner taucht dort nicht noch einmal auf. Klick auf eine Karte, um sie zu öffnen.',
  'help.ctx.journey.bullet.3':
    'Mit der letzten Karte im Raster, „Neue Journey erstellen“, legst du eine Journey aus deinen Reisen an.',
  // create-journey
  'help.guide.create-journey.title': 'Journey erstellen',
  'help.guide.create-journey.goal':
    'Leg ein Reisetagebuch zu einer Reise an, in dem die Orte der Reise schon als Vorschläge bereitstehen.',
  'help.guide.create-journey.step.1': 'Klick auf „Neue Journey erstellen“, die letzte Karte im Raster.',
  'help.guide.create-journey.step.2':
    'Gib ihr einen Namen und bei Bedarf einen Untertitel und hak dann die Reisen an, zu denen sie gehört. Der Zähler zeigt, wie viele Orte hinzukommen.',
  'help.guide.create-journey.step.3': 'Klick auf „Journey erstellen“.',
  'help.guide.create-journey.result':
    'Das Tagebuch öffnet sich. Jeder Ort der verknüpften Reisen erscheint im Zeitstrahl als Vorschlag, einmal für jeden Tag, an dem er geplant ist. Zu jedem kannst du einen Eintrag schreiben.',
  'help.guide.create-journey.tip.1': 'Weitere Reisen kannst du später in den „Journey-Einstellungen“ verknüpfen.',
  'help.guide.create-journey.tip.2': 'Eine Journey ohne Reisen geht auch; dann legst du die Einträge von Hand an.',
  // open-journey
  'help.guide.open-journey.title': 'Journey öffnen',
  'help.guide.open-journey.goal': 'Öffne ein Reisetagebuch und sieh, an welcher Stelle es startet.',
  'help.guide.open-journey.step.1':
    'Klick auf eine Karte. Jede zeigt das Titelbild, die Daten und wie viele Einträge, Fotos und Orte die Journey enthält.',
  'help.guide.open-journey.result':
    'Eine laufende Journey öffnet sich beim heutigen Tag, oder beim letzten Eintrag davor, wenn für heute noch nichts geschrieben ist. Eine abgeschlossene Journey öffnet sich am Anfang.',
  'help.guide.open-journey.tip.1':
    'Als Cover dient das erste Foto der Journey, außer du legst in den „Journey-Einstellungen“ ein anderes fest.',
  // continue-writing
  'help.guide.continue-writing.title': 'Aktuelle Journey weiterschreiben',
  'help.guide.continue-writing.goal': 'Die heutige Seite deiner laufenden Journey direkt öffnen.',
  'help.guide.continue-writing.step.1':
    'Klick oben im Banner auf „Weiterschreiben“. Dort steht die laufende Journey oder, wenn gerade keine läuft, die neueste.',
  'help.guide.continue-writing.result':
    'Das Reisetagebuch öffnet sich beim heutigen Tag oder, wenn noch nichts geschrieben ist, beim letzten Eintrag vor heute.',
  'help.guide.continue-writing.tip.1':
    'Ist eine Reise gerade zu Ende gegangen, erscheint darüber das Banner „Trip gerade beendet“: „Journey erstellen“ legt eine Journey an, in der diese Reise schon angehakt ist, „Schließen“ blendet das Angebot in diesem Browser aus.',

  // ── Screen: journey-detail ────────────────────────────────────────────────────────────
  'help.ctx.journey-detail.title': 'Tagebuch',
  'help.ctx.journey-detail.summary':
    'Eine geöffnete Journey: links der Zeitstrahl, Tag für Tag, rechts die Karte mit zuschaltbaren Ebenen für Plan, Aufgezeichnetes, Einträge und Fotos. In der Kopfzeile stehen die Zähler, „Studio“, der Schalter für Vorschläge und ⋯ für die Journey-Einstellungen; über die Werkzeugleiste darunter fügst du Einträge hinzu.',
  'help.ctx.journey-detail.bullet.1':
    'Kopfzeile: Zurück-Pfeil und Status-Badge, Cover, Titel und Untertitel, die Anzahl der Tage, Orte, Einträge und Fotos, rechts „Studio“, das Auge zum Ein- und Ausblenden der Vorschläge und ⋯ für die Journey-Einstellungen.',
  'help.ctx.journey-detail.bullet.2':
    'Werkzeugleiste: die Tabs „Zeitstrahl“ und „Galerie“, „In dieser Reise suchen“ und „Eintrag hinzufügen“. In der Galerie steht an dessen Stelle „Hochladen“.',
  'help.ctx.journey-detail.bullet.3':
    'Zeitstrahl: ein Abschnitt pro Tag mit Tagesnummer, Anzahl der Orte und einem +, mit dem du an diesem Tag einen Eintrag hinzufügst. Darunter die Eintragskarten mit Fotos, Stimmung, Wetter und Geschichte sowie die gestrichelten Vorschlagskarten aus den Reisen, jede mit einem × zum Verwerfen.',
  'help.ctx.journey-detail.bullet.4':
    'Karte: Über die Ebenenleiste oben steuerst du Planung (hohle Pins und die gestrichelten GPX-Routen der Reisen), Aufgezeichnet (durchgezogene Routen, die aus Dawarich übernommen wurden), Einträge (Pins in den Tagesfarben, in Datumsreihenfolge mit einer dünnen gestrichelten Linie verbunden) und Fotos. Das (i) daneben erklärt jede Markierung.',
  'help.ctx.journey-detail.bullet.5':
    'Journey-Einstellungen (⋯): Cover, Name und Untertitel, Status, GPX-Tracks, aufgezeichnete Tage, Orte aus Fotos, Eintragsfelder, verworfene Vorschläge, synchronisierte Reisen, Mitwirkende und wer über eine Reise Zugang bekommt, öffentliches Teilen, Archivieren und Löschen.',
  'help.ctx.journey-detail.bullet.6':
    'Bei einem langen Zeitstrahl schweben unten „Nach oben“, eine Tagesanzeige, über die du zu jedem Tag oder Eintrag springst, und „Zum letzten Eintrag“.',
  // add-entry
  'help.guide.add-entry.title': 'Eintrag schreiben',
  'help.guide.add-entry.goal': 'Die Geschichte eines Tages mit Titel, Text, Stimmung und Wetter festhalten.',
  'help.guide.add-entry.step.1':
    'Klicke in der Werkzeugleiste auf „Eintrag hinzufügen“ oder auf das + am rechten Ende einer Tageskopfzeile, um direkt an diesem Tag zu beginnen.',
  'help.guide.add-entry.step.2':
    'Gib dem Eintrag einen Titel und schreib deinen Text. Über die Leiste über dem Text fügst du Fett, Kursiv, Überschriften, Zitate, Links und Listen in Markdown ein.',
  'help.guide.add-entry.step.3':
    'Prüf in der rechten Spalte Datum und Uhrzeit, such einen Ort oder nimm deinen aktuellen Standort und wähl eine Stimmung und das Wetter.',
  'help.guide.add-entry.step.4': 'Klick auf „Speichern“.',
  'help.guide.add-entry.result':
    'Der Eintrag erscheint an seinem Tag im Zeitstrahl und als Stecknadel auf der Karte. Die Zahlen in der Kopfzeile werden aktualisiert.',
  'help.guide.add-entry.tip.1':
    'Schreibst du in einen Vorschlag, nutzt du denselben Editor, nur ist der Ort schon eingetragen.',
  'help.guide.add-entry.tip.2':
    'Bei einem Eintrag mit Ort gibt es „Aus der Route herausnehmen“: Der Eintrag bleibt im Journal, zählt aber nicht zur Distanz und zu den Ländern und erscheint nicht auf der Karte im Studio.',
  // entry-photos
  'help.guide.entry-photos.title': 'Fotos und Videos zu einem Eintrag hinzufügen',
  'help.guide.entry-photos.goal': 'Fotos zu einem Tag hinzufügen; das erste wird zum Cover des Eintrags.',
  'help.guide.entry-photos.step.1': 'Öffne über das ⋯ auf der Karte eines Eintrags sein Menü und wähle „Bearbeiten“.',
  'help.guide.entry-photos.step.2':
    'Klick auf „Fotos hochladen“ und wähle die Dateien aus. „Aus Galerie“ übernimmt Bilder, die schon in der Galerie der Journey sind; „External photos“ durchsucht eine verbundene Immich- oder Synology-Bibliothek nach Fotos dieses Tages.',
  'help.guide.entry-photos.step.3':
    'Fahr mit der Maus über ein Bild und klick auf „Als 1. setzen“, um das Cover festzulegen. Klick dann auf „Speichern“.',
  'help.guide.entry-photos.result':
    'Die Fotos erscheinen auf der Karte und in der Galerie. Das erste dient überall als Vorschaubild.',
  'help.guide.entry-photos.tip.1':
    'Videos fügst du genauso hinzu: mp4, m4v, webm oder mov bis 500 MB. Sie werden unverändert gespeichert.',
  'help.guide.entry-photos.tip.2':
    'HEIC-Dateien vom iPhone werden beim Hochladen in JPEG umgewandelt. Dabei gehen GPS- und Kameradaten verloren.',
  // suggestions
  'help.guide.suggestions.title': 'Vorschläge übernehmen oder verwerfen',
  'help.guide.suggestions.goal':
    'Aus den Orten deiner Reisen Einträge machen und die verwerfen, über die du nicht schreiben willst.',
  'help.guide.suggestions.step.1':
    'Ein Vorschlag ist eine Karte mit gestricheltem Rand und dem Button „Eintrag hinzufügen“: ein Ort aus einer verknüpften Reise an dem Tag, für den er geplant war. Klick darauf, und der Editor öffnet sich mit bereits eingetragenem Ort und Tag.',
  'help.guide.suggestions.step.2':
    'Klick auf das × am rechten Rand einer Karte, die du nicht brauchst. Sie verschwindet aus dem Zeitstrahl, ohne gelöscht zu werden, und der Reiseabgleich schlägt sie nicht noch einmal vor.',
  'help.guide.suggestions.step.3':
    'Doch anders entschieden? Öffne mit ⋯ in der Kopfzeile die Journey-Einstellungen: „Verworfene Vorschläge zurückholen“ zeigt, wie viele es sind, und holt sie alle zurück.',
  'help.guide.suggestions.result':
    'In der Zeitleiste steht nur, was du wirklich schreiben willst. Mit dem Auge in der Kopfzeile blendest du beim Lesen alle Vorschläge auf einmal aus.',
  'help.guide.suggestions.tip.1': 'Ist ein Ort an zwei Tagen geplant, gibt es an jedem dieser Tage einen Vorschlag.',
  'help.guide.suggestions.tip.2': 'Vorschläge zählen nie in der Statistik, nur geschriebene Einträge.',
  // add-on-day
  'help.guide.add-on-day.title': 'Eintrag für einen früheren Tag hinzufügen',
  'help.guide.add-on-day.goal': 'Schreib über einen vergangenen Tag, ohne danach das Datum korrigieren zu müssen.',
  'help.guide.add-on-day.step.1': 'Klick auf das + am rechten Ende der Kopfzeile dieses Tages.',
  'help.guide.add-on-day.step.2':
    'Der Editor öffnet sich mit diesem Datum. Schreib wie gewohnt und klick auf „Speichern“.',
  'help.guide.add-on-day.result': 'Der Eintrag erscheint sofort am richtigen Tag.',
  'help.guide.add-on-day.tip.1':
    'Um die Reihenfolge innerhalb eines Tages zu ändern, fahr mit der Maus über einen Eintrag: Links davon erscheinen „Nach oben“ und „Nach unten“.',
  // pros-cons
  'help.guide.pros-cons.title': 'Fazit hinzufügen',
  'help.guide.pros-cons.goal': 'Einen Tag mit dem zusammenfassen, was toll war und was nicht.',
  'help.guide.pros-cons.step.1':
    'Im Editor findest du „Pro & Contra“ unter der Geschichte. Gib einen Punkt bei „Pro“ oder „Contra“ ein und füge mit „Weiteren hinzufügen“ den nächsten hinzu.',
  'help.guide.pros-cons.step.2':
    'Speichere. Auf der Karte klappt „Mehr anzeigen“ die Geschichte und das Urteil als zwei kurze Listen auf.',
  'help.guide.pros-cons.result':
    'Daumen hoch und Daumen runter erscheinen unter dem Text, sodass du sie auf einen Blick siehst.',
  'help.guide.pros-cons.tip.1':
    'Brauchst du in einer Journey kein Fazit, kannst du den Abschnitt in den Journey-Einstellungen unter „Felder im Eintrag“ ausschalten.',
  // search-journey
  'help.guide.search-journey.title': 'In einem langen Tagebuch etwas finden',
  'help.guide.search-journey.goal': 'Einen Eintrag finden, ohne durch Wochen von Einträgen zu scrollen.',
  'help.guide.search-journey.step.1':
    'Tipp in der Werkzeugleiste in „In dieser Reise suchen“. Der Zeitstrahl filtert schon beim Tippen, über Titel, Geschichten, Orte und Tags. Akzente sowie Groß- und Kleinschreibung spielen keine Rolle.',
  'help.guide.search-journey.step.2':
    'Um stattdessen zu springen, klick auf die Tageszahl, die unten am Zeitstrahl eingeblendet ist, zwischen „Nach oben“ und „Zum letzten Eintrag“.',
  'help.guide.search-journey.result':
    'Der Zeitstrahl scrollt zu dem Tag oder Eintrag, den du gewählt hast, und die Karte zieht mit. Solange etwas im Suchfeld steht, siehst du nur die passenden Einträge.',
  'help.guide.search-journey.tip.1':
    'Eine laufende Journey öffnet sich auf der Seite des heutigen Tages, die aktuelle Seite siehst du also meist schon.',
  'help.guide.search-journey.tip.2':
    'Das Auge in der Kopfzeile blendet die Vorschläge aus, sodass du nur noch liest, was du selbst geschrieben hast.',
  // gallery-map
  'help.guide.gallery-map.title': 'Galerie und Karte durchstöbern',
  'help.guide.gallery-map.goal': 'Sieh dir die ganze Journey als Bilder und als Orte auf der Karte an.',
  'help.guide.gallery-map.step.1':
    'Wechsle in der Werkzeugleiste zu „Galerie“. Dort siehst du alle Fotos aller Einträge und die Bilder, die direkt in die Galerie hochgeladen wurden. Klick auf ein Bild, um es in der Lightbox zu öffnen.',
  'help.guide.gallery-map.step.2':
    'Mit „Hochladen“ rechts fügst du der Galerie Bilder hinzu. Ist Immich oder Synology verbunden, holst du sie über einen Button mit dem Namen der Bibliothek direkt von dort.',
  'help.guide.gallery-map.result':
    'Die Pins haben die Farbe ihres Tages und sind in Datumsreihenfolge durch eine dünne gestrichelte Linie verbunden; über die Ebenenleiste oben auf der Karte wählst du, was angezeigt wird.',
  'help.guide.gallery-map.tip.1':
    'Die GPX-Tracks einer Reise erscheinen gestrichelt mit der Ebene „Planung“ der Karte; mit „Alle GPX-Tracks der Reisen anzeigen“ in den Journey-Einstellungen schaltest du sie aus.',
  'help.guide.gallery-map.tip.2':
    'Galeriefotos mit Standort erscheinen auch auf der öffentlichen Karte, wenn sowohl „Galerie“ als auch „Karte“ geteilt sind.',
  // entry-fields
  'help.guide.entry-fields.title': 'Felder im Eintrag ausblenden',
  'help.guide.entry-fields.goal': 'Im Editor nur die Felder anzeigen, die diese Journey nutzt.',
  'help.guide.entry-fields.step.1':
    'Klicke oben rechts in der Kopfzeile auf ⋯, um die Journey-Einstellungen zu öffnen.',
  'help.guide.entry-fields.step.2':
    'Schalte unter „Felder im Eintrag“ die Felder „Stimmung“, „Wetter“ oder „Pro & Contra“ aus.',
  'help.guide.entry-fields.result':
    'Der Editor zeigt diese Felder nicht mehr an. Verloren geht nichts: Schaltest du ein Feld wieder ein, erscheinen die gespeicherten Inhalte wieder. Auch eine geteilte Journey blendet diese Felder aus.',
  'help.guide.entry-fields.tip.1':
    'Die Schalter gelten pro Journey, eine Dienstreise und ein Urlaub können sich also unterscheiden.',
  // link-trip
  'help.guide.link-trip.title': 'Weitere Reise verknüpfen',
  'help.guide.link-trip.goal': 'Füg die Orte einer zweiten Reise als Vorschläge zum Tagebuch hinzu.',
  'help.guide.link-trip.step.1': 'Klicke oben rechts in der Kopfzeile auf ⋯, um die Journey-Einstellungen zu öffnen.',
  'help.guide.link-trip.step.2': 'Klick unter „Verknüpfte Trips“ auf „Trip hinzufügen“.',
  'help.guide.link-trip.step.3': 'Such die Reise nach Name oder Reiseziel und klick daneben auf „Verknüpfen“.',
  'help.guide.link-trip.result':
    'Ihre Orte erscheinen als Vorschläge an den passenden Tagen im Zeitstrahl und landen zusammen mit ihren GPX-Tracks in der Kartenebene „Planung“.',
  'help.guide.link-trip.tip.1':
    'Mit dem Mülleimer neben einer verknüpften Reise hebst du die Verknüpfung nach einer Rückfrage auf; Einträge, die du geschrieben hast, bleiben erhalten.',
  'help.guide.link-trip.tip.2': 'Einträge mit einem Tag zählen nur einmal, egal wie viele Reisen diesen Tag abdecken.',
  // share-public
  'help.guide.share-public.title': 'Journey öffentlich teilen',
  'help.guide.share-public.goal': 'Leuten ohne TREK-Konto einen Link zum Ansehen geben.',
  'help.guide.share-public.step.1':
    'Öffne mit ⋯ in der Kopfzeile die Journey-Einstellungen und scroll zu „Öffentlicher Link“.',
  'help.guide.share-public.step.2': 'Klick auf „Link erstellen“.',
  'help.guide.share-public.step.3':
    'Wähl, was Besucher sehen: „Zeitstrahl“, „Galerie“ und „Karte“. Unter „Karte“ blendet „Reiseplanung“ die geplanten Orte und Routen ein, „Aufgezeichnete Strecken“ die Tage, die du aufgezeichnet hast. „Kopieren“ legt den Link in deine Zwischenablage.',
  'help.guide.share-public.result':
    'Wer den Link hat, sieht die freigegebenen Bereiche und sonst nichts. Felder, die du unter „Felder im Eintrag“ ausgeschaltet hast, bleiben auch dort verborgen.',
  'help.guide.share-public.tip.1':
    'Fotos erscheinen nur dann auf der öffentlichen Karte, wenn „Galerie“ und „Karte“ beide aktiv sind. Ist „Karte“ aus, entfernt der Server die Koordinaten, bevor er die Fotos ausliefert.',
  'help.guide.share-public.tip.2': 'Mit „Link löschen“ neben „Kopieren“ beendest du das Teilen.',
  // contributors
  'help.guide.contributors.title': 'Gemeinsam schreiben',
  'help.guide.contributors.goal': 'Lass Mitreisende eigene Einträge und Fotos hinzufügen.',
  'help.guide.contributors.step.1':
    'Öffne die Journey-Einstellungen über ⋯ in der Kopfzeile und such den Bereich „Mitwirkende“.',
  'help.guide.contributors.step.2': 'Klick auf „Mitwirkenden einladen“ und such die Person nach Name oder E-Mail.',
  'help.guide.contributors.step.3': 'Wähl „Betrachter“ oder „Bearbeiter“ und klick auf „Einladen“.',
  'help.guide.contributors.result':
    'Die Journey erscheint in ihrer Liste, und ihre Einträge zeigen ihren Namen. Um jemanden zu entfernen, klick auf das × daneben.',
  'help.guide.contributors.tip.1':
    'Mitwirkende sind für Leute auf diesem TREK gedacht. Für alle anderen gibt es den öffentlichen Link.',
  // studio
  'help.guide.studio.title': 'Journey als Fotobuch gestalten',
  'help.guide.studio.goal': 'Aus dem Tagebuch druckbare Seiten machen.',
  'help.guide.studio.step.1': 'Klick in der Kopfzeile auf „Studio“. Der Designer öffnet sich über der Journey.',
  'help.guide.studio.step.2':
    'Zurück geht es mit einem Klick auf × am rechten Ende der oberen Leiste. Du landest wieder dort, wo du warst.',
  'help.guide.studio.result':
    'Links sind die Leiste und ihre Bereiche, die Doppelseite liegt auf der Arbeitsfläche, und rechts stehen die Eigenschaften. Automatisch anordnen baut das Buch aus deinen Einträgen. Exportieren erzeugt ein druckfertiges PDF.',
  'help.guide.studio.tip.1':
    'Studio braucht ein mindestens 1024 px breites Fenster und steht auf dem Smartphone nicht zur Verfügung.',
  'help.guide.studio.tip.2':
    'Für das Buch gelten dieselben Rechte wie für die Journey: Wer die Journey lesen darf, kann das Buch öffnen, und wer sie bearbeiten darf, kann es speichern.',
  // archive-journey
  'help.guide.archive-journey.title': 'Journey archivieren oder löschen',
  'help.guide.archive-journey.goal': 'Eine fertige Journey abschließen oder eine endgültig löschen.',
  'help.guide.archive-journey.step.1':
    'Klicke oben rechts in der Kopfzeile auf ⋯, um die Journey-Einstellungen zu öffnen.',
  'help.guide.archive-journey.step.2':
    'Ganz unten beendest du sie mit „Reise archivieren“ und markierst sie als archiviert. Mit „Reise wiederherstellen“ holst du sie zurück. „Löschen“ entfernt sie nach einer Rückfrage samt allen Einträgen und Fotos.',
  'help.guide.archive-journey.result':
    'Eine archivierte Journey bleibt lesbar und teilbar, sie öffnet sich nur nicht mehr beim heutigen Tag.',
  'help.guide.archive-journey.tip.1':
    'Löschen lässt sich nicht rückgängig machen und ändert nichts an den Reisen, mit denen die Journey verknüpft war.',
  'help.guide.archive-journey.tip.2': 'Titelbild, Name und Untertitel findest du im selben Dialog ganz oben.',
  'help.guide.journey-status.title': 'Status einer Journey festlegen',
  'help.guide.journey-status.goal':
    'Eine Journey selbst als Entwurf, live oder abgeschlossen markieren, statt dass sich der Status nach den Daten ihrer Reisen richtet.',
  'help.guide.journey-status.step.1':
    'Klick oben rechts in der Kopfzeile der Journey auf ⋯, um die Journey-Einstellungen zu öffnen.',
  'help.guide.journey-status.step.2':
    'Wähle unter „Status“ „Entwurf“, „Live“ oder „Abgeschlossen“. Die Auswahl wird sofort gespeichert.',
  'help.guide.journey-status.result':
    'Die Journey behält den gewählten Status: „Entwurf“ und „Abgeschlossen“ erscheinen als Badge auf ihrer Karte und in ihrer Kopfzeile, und eine Live-Journey steht als Banner oben in der Journey-Liste.',
  'help.guide.journey-status.tip.1':
    '„Automatisch“ richtet sich wieder nach den Daten der verknüpften Reisen. Ohne verknüpfte Reise bleibt eine automatische Journey ein Entwurf.',
  'help.guide.journey-status.tip.2':
    'Ein von Hand gesetzter Status bleibt, bis du ihn änderst, auch wenn sich die Reisedaten ändern.',

  // ── Screen: journey-studio ────────────────────────────────────────────────────────────
  'help.ctx.journey-studio.title': 'Studio', // same-as-en
  'help.ctx.journey-studio.summary':
    'TREK Studio gestaltet eine Journey als Fotobuch, das du drucken kannst. Es öffnet sich über dem Tagebuch: Links sind die Leiste und ihre Bereiche, in der Mitte die Doppelseite, an der du arbeitest, und rechts ihre Eigenschaften. Automatisch anordnen erstellt aus deinen Einträgen einen ersten Entwurf, ein Thema gibt dem Buch Farben und Schriften, und der Assistent kann mit dir Seiten gestalten. Danach kannst du alles verschieben, zuschneiden und neu gestalten und jeden Schritt rückgängig machen.',
  'help.ctx.journey-studio.bullet.1':
    'Obere Leiste: links Titelbild und Name der Journey. Rechts siehst du, wer sonst noch im Buch ist und ob es gespeichert ist, dazu Seitenformat, Rückgängig, Wiederholen und Einfügen, Automatisch anordnen, den Assistenten, die Hilfe, Exportieren und die Schaltfläche, die Studio schließt.',
  'help.ctx.journey-studio.bullet.2':
    'Leiste links: Seiten, Inhalte (die Fotos und Einträge der Journey), Layouts, Elemente (Text, Formen, Linien, Rahmen, Symbole und Sticker), Reise (Zahlen, Karten, Länder und Marken aus der Journey) und, abgesetzt darunter, Thema und Ebenen.',
  'help.ctx.journey-studio.bullet.3':
    'Arbeitsfläche: die aktuelle Doppelseite mit Anschnitt und Sicherheitsabstand, darunter die Zoomleiste mit Einpassen, Buchansicht und Diese Doppelseite herunterladen.',
  'help.ctx.journey-studio.bullet.4':
    'Eigenschaften rechts: alles zum ausgewählten Element, von Position, Größe und Ausschnitt bis zu Farben, Effekten, Stapelreihenfolge und Sperre. Ist nichts ausgewählt, zeigt der Bereich den Seitenhintergrund, das Thema, die Seitenzahlen und das Dokument.',
  'help.ctx.journey-studio.bullet.5':
    'Das Buch ist aufgebaut wie ein gedrucktes Buch: Cover, eine einzelne erste Seite gegenüber der leeren Innenseite des Covers, die Doppelseiten, eine einzelne letzte Seite und die Rückseite. Die Seitenzahlen beginnen bei der ersten Seite und werden so gedruckt, wie sie angezeigt werden.',
  'help.ctx.journey-studio.bullet.6':
    'Mehrere Personen können gleichzeitig gestalten: Alle sehen die Mauszeiger der anderen mit Namen. Speicherst du eine Version, die jemand anderes inzwischen geändert hat, zeigt TREK einen Konflikt an, statt dessen Arbeit zu überschreiben.',
  'help.ctx.journey-studio.bullet.7':
    'Thema: ein Look für das ganze Buch, mit Papier, Tinte und drei Akzentfarben, Schriften und Motiven. Mit dem Thema verknüpfte Elemente folgen ihm, wenn du es änderst.',
  'help.ctx.journey-studio.bullet.8':
    'Assistent: Wo ein Administrator KI eingerichtet hat, öffnet die Sprechblase in der oberen Leiste einen Assistenten, der mit dir Seiten gestaltet, Bildunterschriften schreibt und das Buch neu stylt. Jede seiner Änderungen ist ein Schritt, den du rückgängig machen kannst.',
  // studio-auto-layout
  'help.guide.studio-auto-layout.title': 'Buch automatisch erstellen',
  'help.guide.studio-auto-layout.goal':
    'Mit einem Klick einen vollständigen ersten Entwurf aus den Einträgen und Fotos des Tagebuchs erhalten.',
  'help.guide.studio-auto-layout.step.1': 'Klick in der oberen Leiste auf „Automatisch anordnen“.',
  'help.guide.studio-auto-layout.step.2':
    'Wähle „Das ganze Buch“: Damit werden alle Seiten ersetzt, Titel und Seiteneinstellungen bleiben erhalten. „Diese Seite“ baut nur die angezeigte Doppelseite neu auf. Diese Option gibt es nur bei Doppelseiten, die aus einem Eintrag entstanden sind.',
  'help.guide.studio-auto-layout.step.3':
    'Sieh dir die Seitenleiste an. Gefiel dir die vorherige Version besser, macht „Rückgängig“ das ganze Layout rückgängig.',
  'help.guide.studio-auto-layout.result':
    'Eine Doppelseite pro Eintrag, in der richtigen Reihenfolge, mit bereits platzierten Fotos, Titel und Text. Jedes Element bleibt mit seinem Eintrag verknüpft und aktualisiert sich mit ihm, bis du es bearbeitest.',
  'help.guide.studio-auto-layout.tip.1':
    'Beide Einträge sind normale Schritte zum Rückgängigmachen, du kannst sie also ausprobieren und wieder zurücknehmen.',
  'help.guide.studio-auto-layout.tip.2':
    'Verknüpft „Automatisch anordnen“ ein Element mit einem Eintrag, aktualisiert sich das Element, wenn du den Eintrag bearbeitest. Änderst du das Element in „Eigenschaften“, wird die Verknüpfung aufgehoben.',
  // studio-pages
  'help.guide.studio-pages.title': 'Doppelseiten hinzufügen, verschieben und entfernen',
  'help.guide.studio-pages.goal': 'Bearbeite das Buch Seite für Seite.',
  'help.guide.studio-pages.step.1':
    'Öffne in der Leiste Seiten. Die Vorschaubilder zeigen das Buch der Reihe nach: Cover, erste Seite, Doppelseiten, letzte Seite und Rückseite. Die erste und die letzte Seite sind neben der leeren Innenseite ihres Covers gezeichnet, so wie sich das gebundene Buch aufschlägt.',
  'help.guide.studio-pages.step.2':
    '„Seite hinzufügen“ unten fügt vor der letzten Seite eine neue Doppelseite ein. Das + zwischen zwei Miniaturen fügt eine an genau dieser Stelle ein.',
  'help.guide.studio-pages.step.3':
    'Fahr mit der Maus über ein Vorschaubild, um seine Aktionen zu sehen: „Nach vorne“, „Nach hinten“, „Seite duplizieren“ und „Seite löschen“. Klick auf ein Vorschaubild, um diese Doppelseite auf der Arbeitsfläche zu öffnen.',
  'help.guide.studio-pages.result':
    'Cover, erste und letzte Seite und Rückseite bleiben an ihrem Platz. Neue Doppelseiten werden immer dazwischen eingefügt.',
  'help.guide.studio-pages.tip.1':
    '„Buchansicht“ in der oberen Leiste zeigt das ganze Buch als Bögen, so wie es gebunden wird.',
  'help.guide.studio-pages.tip.2':
    'Die „Seitenzahlen“ schaltest du in „Eigenschaften“ unter „Dokument“ ein, während nichts ausgewählt ist.',
  // studio-layouts
  'help.guide.studio-layouts.title': 'Layout auf eine Doppelseite anwenden',
  'help.guide.studio-layouts.goal': 'Gib einer Doppelseite eine fertige Anordnung aus Foto- und Textrahmen.',
  'help.guide.studio-layouts.step.1':
    'Öffne in der Leiste Layouts. Zuerst kommen gestaltete Seiten: ganze Cover und Doppelseiten im Thema des Buchs, die du mit den Stilchips auf einen Look eingrenzt. Meine Anordnungen und Vorgefertigt folgen darunter, im selben Raster.',
  'help.guide.studio-layouts.step.2':
    'Klick eines an. Die Doppelseite auf der Arbeitsfläche bekommt die Rahmen dieses Layouts, und deine vorhandenen Fotos und Texte werden darin platziert.',
  'help.guide.studio-layouts.result':
    'Leere Rahmen sind Platzhalter für Inhalte: Zieh ein Foto aus „Inhalt“ hinein oder nutze „Auf diese Seite setzen“.',
  'help.guide.studio-my-layouts.title': 'Eine Seite als eigene Anordnung speichern',
  'help.guide.studio-my-layouts.goal':
    'Verwende eine Anordnung wieder, die du auf anderen Seiten des Buchs gebaut hast.',
  'help.guide.studio-my-layouts.step.1':
    'Ordne eine Seite so an, wie du sie willst, und öffne dann in der Leiste Layouts.',
  'help.guide.studio-my-layouts.step.2':
    'Klick unter Meine Anordnungen auf Diese Seite als Anordnung speichern. Die Seite erscheint als Karte in der Liste.',
  'help.guide.studio-my-layouts.tip.1':
    'Klick auf deine Anordnung auf einer anderen Seite, um diese Seite genauso anzuordnen, mit ihren eigenen Fotos und Texten.',
  'help.guide.studio-my-layouts.result':
    'Deine Anordnungen werden mit dem Buch gespeichert und auf Seiten derselben Art angeboten: die eines Covers für Cover, die einer Doppelseite für Doppelseiten.',
  'help.guide.studio-layouts.tip.1': 'Ein Layout lässt sich wie jeder andere Schritt rückgängig machen.',
  // studio-content
  'help.guide.studio-content.title': 'Fotos und Einträge auf eine Seite bringen',
  'help.guide.studio-content.goal': 'Füg der Doppelseite Fotos und Einträge aus der Journey hinzu.',
  'help.guide.studio-content.step.1':
    'Öffne in der Seitenleiste „Inhalt“. Unter „Fotos“ stehen alle Bilder der Journey, unter „Einträge“ die Einträge mit ihrem Text.',
  'help.guide.studio-content.step.2':
    'Zieh ein Foto auf die Doppelseite oder in einen leeren Rahmen, oder klick darunter auf „Auf diese Seite setzen“. Mit „Fotos hochladen“ fügst du Bilder hinzu, die noch nicht in der Journey sind; mit „Aus Immich“ oder „Aus Synology“ wählst du sie aus einer verbundenen Bibliothek.',
  'help.guide.studio-content.step.3':
    'Unter einem Eintrag setzen „Titel“, „Text“ und „Ort“ den jeweiligen Text als Textelement auf die Seite. Datum und Koordinaten kommen als Markierungen dazu, und auch die Fotos des Eintrags sind dort aufgelistet.',
  'help.guide.studio-content.result':
    'Ein abgelegtes Foto wird zum Fotoelement. Text bleibt mit dem Eintrag verknüpft, bis du ihn bearbeitest.',
  'help.guide.studio-theme.title': 'Dem Buch ein Thema geben',
  'help.guide.studio-theme.goal': 'Lege Farben und Schriften des ganzen Buchs in einem Zug fest.',
  'help.guide.studio-theme.step.1':
    'Öffne in der Leiste Thema. Jede Karte zeigt ein Thema als kleine Seite: Papier, Schrift und die drei Akzentfarben.',
  'help.guide.studio-theme.step.2':
    'Klick auf ein Thema, um es auszuprobieren. Unter den Karten kannst du die Palette ändern, andere Schriften wählen sowie Motive und Dekor festlegen.',
  'help.guide.studio-theme.step.3':
    'Klick auf Auf das Buch anwenden oder auf Auf diese Seite anwenden für die Doppelseite auf dem Bildschirm.',
  'help.guide.studio-theme.tip.1':
    'Mit dem Thema verknüpfte Elemente übernehmen seine Farben und Schriften und folgen, wenn du es änderst. Auch noch nicht Verknüpftes neu gestalten verknüpft zuerst den Rest.',
  'help.guide.studio-theme.tip.2': 'Farben aus den Fotos erstellt eine Palette aus den Bildern der Journey.',
  'help.guide.studio-theme.result':
    'Alle verknüpften Farben und Schriften im Buch ändern sich auf einmal, und das Anwenden des Themas ist ein einziger Rückgängig-Schritt.',
  'help.guide.studio-content.tip.1': 'Das Suchfeld oben in „Inhalt“ filtert beide Listen.',
  'help.guide.studio-content.tip.2':
    'Ziehst du eine Datei vom Desktop auf die Arbeitsfläche, lädt TREK sie hoch und platziert sie in einem Schritt.',
  // studio-elements
  'help.guide.studio-elements.title': 'Text, Formen, Symbole und Sticker hinzufügen',
  'help.guide.studio-elements.goal': 'Schmück eine Doppelseite zusätzlich zu Fotos und Texten aus.',
  'help.guide.studio-elements.step.1':
    'Öffne in der Leiste Elemente. Sechs Tabs sortieren, was du hinzufügen kannst: Text, Formen, Linien, Rahmen, Symbole und Sticker.',
  'help.guide.studio-elements.step.2':
    'Klick auf einen Textstil oder einen gestalteten Titel, eine Form, eine Linie, einen leeren Rahmen, ein Symbol oder einen Sticker. Jedes Element landet in der Mitte der Doppelseite, und du kannst es danach verschieben.',
  'help.guide.studio-elements.result':
    'Doppelklick auf ein Textelement, um darin zu schreiben. Unter „Eigenschaften“ findest du Schriftart, Schnitt, Größe, Abstand und Ausrichtung.',
  'help.guide.studio-stickers.title': 'Mit Stickern dekorieren',
  'help.guide.studio-stickers.goal':
    'Füge Illustrationen hinzu, von Sehenswürdigkeiten und Essen bis zu Tieren und Pfeilen.',
  'help.guide.studio-stickers.step.1': 'Öffne in der Leiste Elemente und wähle Sticker.',
  'help.guide.studio-stickers.step.2':
    'Suche nach einem Wort oder stöber in den Regalen, dann klick auf einen Sticker, um ihn auf der Doppelseite zu platzieren.',
  'help.guide.studio-stickers.tip.1': 'Bei ausgewähltem Sticker färbt Eigenschaften seine Teile um und spiegelt ihn.',
  'help.guide.studio-stickers.result': 'Der Sticker ist eine Zeichnung und bleibt deshalb in jeder Größe scharf.',
  'help.guide.studio-elements.tip.1': 'Rahmen sind leere Platzhalter für Fotos: Zieh später ein Bild hinein.',
  // studio-travel
  'help.guide.studio-travel.title': 'Karten, Zahlen, Länder und Marken hinzufügen',
  'help.guide.studio-travel.goal': 'Verwandle die Journey selbst in gestaltete Elemente auf der Seite.',
  'help.guide.studio-travel.step.1':
    'Öffne in der Leiste Reise. Vier Tabs sortieren, was du hinzufügen kannst: Zahlen, Karten, Länder und Marken.',
  'help.guide.studio-travel.step.2':
    'Jede Karte zeigt das Element mit den eigenen Zahlen deiner Journey, in den Farben des Themas: eine Zusammenfassung als Poster, Ticket, Verkehrsschild oder Kilometerzähler, eine Karte mit nummerierten Stationen oder auf ein Land zugeschnitten, ein Land als Stempel, Postkarte oder Pin, ein Datum oder eine Strecke als Stempel, Anhänger oder Banner.',
  'help.guide.studio-travel.step.3':
    'Klick auf eine Karte. Das Element landet in der Mitte der Doppelseite, und du kannst es danach verschieben und seine Größe ändern.',
  'help.guide.studio-travel.result':
    'Das Element erscheint auf der Doppelseite. Eigenschaften ändert sein Aussehen, und jede Zahl, Karte und jedes Land wird aktualisiert, wenn sich die Journey ändert.',
  'help.guide.studio-text-effects.title': 'Effekte für Text hinzufügen',
  'help.guide.studio-text-effects.goal':
    'Gib einer Überschrift eine Kontur, einen Schatten, eine Biegung oder mit einem Muster gefüllte Buchstaben.',
  'help.guide.studio-text-effects.step.1': 'Klick auf ein Textelement auf der Seite, um es auszuwählen.',
  'help.guide.studio-text-effects.step.2':
    'Öffne in den Eigenschaften Effekte, um eine Kontur, einen Schatten oder eine Hervorhebung hinzuzufügen oder die Buchstaben mit einem Verlauf oder Muster zu füllen. Schreibweise und Position biegt die Zeile und passt sie an ihren Rahmen an.',
  'help.guide.studio-text-effects.tip.1':
    'An Rahmen anpassen verkleinert den Text, bis er in seinen Rahmen passt, damit ein langer Titel nie überläuft.',
  'help.guide.studio-text-effects.result':
    'Der Effekt wird mit dem Text gezeichnet, im Druck genauso wie am Bildschirm.',
  'help.guide.studio-background.title': 'Seitenhintergrund ändern',
  'help.guide.studio-background.goal':
    'Färbe die Seite mit einer Farbe, einem Verlauf oder einem Muster, oder lege ein Foto darunter.',
  'help.guide.studio-background.step.1':
    'Klick auf eine leere Stelle der Seite, damit nichts ausgewählt ist. Seitenhintergrund steht oben in den Eigenschaften.',
  'help.guide.studio-background.step.2':
    'Wähle Papier, Einfarbig, Verlauf oder Muster und eine Farbe, oder klick unter Foto als Hintergrund auf ein Foto.',
  'help.guide.studio-background.tip.1': 'Auf alle Seiten anwenden gibt jeder Seite des Buchs denselben Hintergrund.',
  'help.guide.studio-background.result':
    'Der Hintergrund reicht in den Anschnitt, sodass er bis zum Seitenrand gedruckt wird.',
  'help.guide.studio-layers.title': 'Mit Ebenen anordnen, ausblenden und sperren',
  'help.guide.studio-layers.goal': 'Sieh alles auf der Doppelseite in Stapelreihenfolge und bearbeite es dort.',
  'help.guide.studio-layers.step.1': 'Öffne in der Leiste Ebenen. Oben in der Liste ist die Vorderseite der Seite.',
  'help.guide.studio-layers.step.2':
    'Zieh eine Zeile, um die Reihenfolge zu ändern, blende ein Element mit dem Auge aus und halte es mit dem Schloss an seinem Platz. Wähle mehrere aus und gruppiere sie, um sie gemeinsam zu bewegen.',
  'help.guide.studio-layers.tip.1': 'Doppelklick auf eine Zeile gibt dem Element einen eigenen Namen.',
  'help.guide.studio-layers.tip.2': 'Ausgeblendete Elemente fehlen im PDF.',
  'help.guide.studio-layers.result':
    'Auch volle Seiten bleiben leicht zu bearbeiten, und fertige Teile lassen sich nicht versehentlich verschieben.',
  'help.guide.studio-travel.tip.1':
    'Unter Karten listet Stationen jede Station der Route auf. Schalte eine aus, um sie aus Karten und Zahlen auszulassen, zum Beispiel deinen Heimatflughafen.',
  'help.guide.studio-travel.tip.2':
    'Eine Länderkarte zeigt nur die Stationen dieses Landes, sodass das Land die Seite füllt, auch wenn die Journey mit einem langen Flug begann.',
  // studio-properties
  'help.guide.studio-properties.title': 'Auswahl bearbeiten',
  'help.guide.studio-properties.goal':
    'Ein Element im Inspektor verschieben, zuschneiden, gestalten und in der Ebenenreihenfolge anordnen.',
  'help.guide.studio-properties.step.1':
    'Klick auf ein Element auf der Doppelseite. Es erscheinen Anfasser für Größe und Drehung; zieh das Element, um es zu verschieben.',
  'help.guide.studio-properties.step.2':
    'Rechts unter „Eigenschaften“ stehen die Einstellungen des ausgewählten Elements: Position und Größe, „Ausschnitt“ mit dem Fokuspunkt, der bestimmt, was im Rahmen sichtbar bleibt, „Füllen“ oder „Einpassen“, Look-Filter, Eckenradius, Rahmenstil, Stapelreihenfolge und „Sperren“.',
  'help.guide.studio-properties.step.3':
    '„Duplizieren“ und „Löschen“ findest du oben im Inspektor. Mit „Rückgängig“ in der oberen Leiste machst du jede dieser Änderungen rückgängig.',
  'help.guide.studio-properties.result':
    'Ein gesperrtes Element kannst du auf der Seite weder auswählen noch verschieben. So bleibt ein fertiges Layout geschützt, während du an den anderen Elementen arbeitest.',
  'help.guide.studio-properties.tip.1':
    'Mit Umschalt und Klick wählst du mehrere Elemente aus. Der Inspektor bearbeitet sie dann gemeinsam.',
  'help.guide.studio-properties.tip.2':
    'Bearbeitest du ein Element, das das automatische Layout platziert hat, ist es nicht mehr mit dem Eintrag verknüpft und übernimmt spätere Änderungen daran nicht mehr.',
  // studio-format
  'help.guide.studio-format.title': 'Seitenformat wählen',
  'help.guide.studio-format.goal': 'Das Druckformat des Buches festlegen, bevor du das Layout erstellst.',
  'help.guide.studio-format.step.1':
    'Klick in der oberen Leiste neben den Bearbeitungswerkzeugen auf das Seitenformat. Es zeigt Name und Form des Formats.',
  'help.guide.studio-format.step.2':
    'Wähle „Quadratisch 21 × 21 cm“, „Quadratisch 30 × 30 cm“, A4 oder A5 im Quer- oder Hochformat oder gib eine eigene Breite und Höhe in Millimetern ein. Anschnitt und Sicherheitsabstand stehen darunter.',
  'help.guide.studio-format.result':
    'Jede Doppelseite wird in dieser Größe dargestellt, standardmäßig mit 3 mm Anschnitt und 5 mm Sicherheitsabstand.',
  'help.guide.studio-format.tip.1':
    'Ändere zuerst das Format und starte dann „Automatisch anordnen“. Dabei wird das Format genutzt, das zu diesem Zeitpunkt eingestellt ist.',
  'help.guide.studio-format.tip.2':
    'Frag deine Druckerei nach ihren Werten für Anschnitt und Sicherheitsabstand und trag diese ein.',
  // studio-export
  'help.guide.studio-export.title': 'Buch als PDF exportieren',
  'help.guide.studio-export.goal': 'Eine druckfertige Datei erhalten oder eine zum Lesen am Bildschirm.',
  'help.guide.studio-export.step.1': 'Klick in der oberen Leiste auf „Exportieren“.',
  'help.guide.studio-export.step.2':
    'Wähle „Einzelseiten“, eine Seite pro Blatt in Lesereihenfolge, wie es eine Druckerei braucht, oder „Doppelseiten“, immer zwei Seiten so, wie das Buch aufgeschlagen wird. „Beschnittmarken“ fügt an jeder Kante den Anschnitt hinzu und zeigt, wo geschnitten wird.',
  'help.guide.studio-export.step.3':
    'Klick auf „Druckansicht“. Dein Browser öffnet die Seiten. Wähle „Als PDF speichern“, um die Datei zu erstellen.',
  'help.guide.studio-export.result':
    'Ein PDF mit so vielen Bögen, wie der Dialog angekündigt hat, im eingestellten Seitenformat.',
  'help.guide.studio-export.tip.1':
    'Das PDF kannst du nur am Desktop erstellen, genau wie Studio selbst nur dort läuft.',
  'help.guide.studio-export.tip.2':
    'Für einen Probedruck exportierst du „Doppelseiten“ ohne Schnittmarken, für die Druckerei „Einzelseiten“ mit Schnittmarken.',
  // studio-spread-file
  'help.guide.studio-spread-file.title': 'Doppelseite in einem anderen Buch wiederverwenden',
  'help.guide.studio-spread-file.goal':
    'Übernimm ein gelungenes Design aus dem Buch einer Journey in das Buch einer anderen.',
  'help.guide.studio-spread-file.step.1':
    'Ist die Doppelseite auf der Arbeitsfläche, klick rechts in der Zoomleiste auf „Diese Doppelseite herunterladen“. Die Datei enthält das Design, nicht die Fotos.',
  'help.guide.studio-spread-file.step.2':
    'Öffne im anderen Buch „Seiten“, klick neben „Seite hinzufügen“ auf „Importieren“ und wähle die Datei aus.',
  'help.guide.studio-spread-file.result':
    'Die Doppelseite wird mit ihren Rahmen und Textstilen importiert. Zieh die Fotos der neuen Journey in die Rahmen.',
  'help.guide.studio-spread-file.tip.1':
    'Ist eine Datei kein Doppelseiten-Design, lehnt TREK sie ab und nennt den Grund.',

  // ── Screen: settings (all tabs) ───────────────────────────────────────────────────────
  'help.ctx.settings.title': 'Einstellungen',
  'help.ctx.settings.summary':
    'Deine persönlichen Einstellungen, mit einem Tab pro Thema in der Seitenleiste links. Die meisten Schalter wirken sofort, sobald du sie umlegst; ein Formular mit „Speichern“-Button übernimmt Änderungen erst nach dem Klick darauf. Nichts hier ändert etwas am TREK anderer Leute.',
  'help.ctx.settings.bullet.1':
    'Seitenleiste links: „Allgemein“, „Darstellung“, „Karte“, „Benachrichtigungen“, „Integrationen“, „Offline“ und „Konto“. „Plugins“ erscheint, sobald ein Plugin aktiv ist, „Über“ überall dort, wo der Betreiber es nicht ausgeblendet hat, und ganz unten steht die Version.',
  'help.ctx.settings.bullet.2':
    'Unter Allgemein legst du fest, womit TREK startet: Sprache, Sprache der Ortsnamen, Einheiten, Zeitformat, Wochenbeginn und Anzeigewährung, dazu das Verhalten der Reisekarte. Unter Darstellung findest du Theme, Farben, Lesbarkeit, Schriftgröße und die Dashboard-Widgets.',
  'help.ctx.settings.bullet.3':
    '„Karte“ wählt die Engine und ihren Stil. Unter „Benachrichtigungen“ legst du fest, welche Ereignisse über welchen Kanal kommen. „Integrationen“ verbindet Fotobibliotheken, AirTrail, Dawarich und wanderer und enthält API-Schlüssel und MCP. Unter „Offline“ legst du fest, was dieses Gerät speichert.',
  'help.ctx.settings.bullet.4':
    'Unter „Konto“ findest du dein Profil, dein Passwort, die Zwei-Faktor-Authentifizierung, Passkeys und die Option, dein Konto zu löschen.',
  'help.ctx.settings-display.title': 'Allgemein',
  'help.ctx.settings-display.summary':
    'Womit TREK startet, welche Sprache und Einheiten es verwendet und wie sich Reisekarte und Buchungen verhalten. Jede Änderung gilt sofort.',
  'help.ctx.settings-display.bullet.1':
    'Start: Unter „Startseite“ legst du fest, ob TREK mit dem Dashboard oder der aktiven Reise startet; bei „Aktive Reise“ wählst du unter „Start-Tab“, mit welchem Tab sich diese Reise öffnet.',
  'help.ctx.settings-display.bullet.2':
    'Sprache & Region: „Anzeigewährung“ (oder „Reisewährung“, wenn nicht umgerechnet werden soll), „Sprache“, „Ortsnamen“, „Temperatureinheit“, „Entfernungseinheit“, „Zeitformat“ und „Woche beginnt am“.',
  'help.ctx.settings-display.bullet.3':
    'Reise & Karte: „Orte öffnen in“, „Datum zuerst in Tagesüberschriften“, „Orts-Labels auf Buchungsrouten“, „Buchungsrouten immer anzeigen“, „Kompakte Markierungen für ungeplante Orte“, „Orte auf der Karte entdecken“, „Buchungscodes verbergen“ und „Route ab der Unterkunft optimieren“.',
  'help.ctx.settings-appearance.title': 'Darstellung',
  'help.ctx.settings-appearance.summary':
    'So sieht TREK in deinem Konto aus: hell oder dunkel, Akzentfarbe, Glas und Animationen, Textgröße und welche Widgets das Dashboard zeigt. Alles wirkt sofort, auf jedem Gerät, auf dem du angemeldet bist.',
  'help.ctx.settings-appearance.bullet.1':
    'Theme: „Farbmodus“ Hell, Dunkel oder Automatisch, das „Farbschema“ und mit „Individuell“ deine eigene Akzentfarbe für Hell und Dunkel, samt Kontrastprüfung.',
  'help.ctx.settings-appearance.bullet.2':
    '„Lesbarkeit“, als „Experimentell“ markiert: „Transparenz“, „Bewegung reduzieren“, „Dichte“ und „Schriftgröße“ mit einem Regler für „Alles“ und je einem für „Groß“, „Mittel“, „Normal“ und „Klein“.',
  'help.ctx.settings-appearance.bullet.3':
    'Dashboard-Widgets: getrennte Schalter für Desktop („Unter dem Hero“, „Rechte Seitenleiste“) und Mobil („Unter dem Hero“, „Seitenende“).',
  'help.ctx.settings-appearance.bullet.4': '„Auf Standard zurücksetzen“ unter den Karten setzt den ganzen Tab zurück.',
  'help.ctx.settings-map.title': 'Karte',
  'help.ctx.settings-map.summary':
    'Welche Engine die Karten im Reiseplaner und im Journal zeichnet und in welchem Stil. Leaflet ist die klassische Rasterkarte, Mapbox GL ergänzt mit deinem eigenen Token 3D-Gebäude und Gelände, MapLibre GL zeichnet OpenFreeMap-Vektorkacheln ganz ohne Token. Atlas nutzt immer Leaflet.',
  'help.ctx.settings-map.bullet.1':
    'Kartenanbieter: Leaflet, Mapbox GL (Experimentell) oder MapLibre GL, jede Kachel mit einer kurzen Beschreibung.',
  'help.ctx.settings-map.bullet.2':
    '„Karten-Vorlage“ und „CARTO-API-Key“ für Leaflet; „Kartenstil“ für die beiden GL-Engines, dazu das „Mapbox Access Token“ für Mapbox GL.',
  'help.ctx.settings-map.bullet.3':
    'Nur bei Mapbox GL: „3D-Gebäude & Terrain“ und „Hochqualitäts-Modus“. Über „Karte speichern“ siehst du eine Live-Vorschau; der Button speichert deine Auswahl.',
  'help.ctx.settings-notifications.title': 'Benachrichtigungen',
  'help.ctx.settings-notifications.summary':
    'Wo TREK dich außerhalb der App erreicht. Oben legst du fest, was wohin geht: eine Zeile pro Ereignis, eine Spalte pro Kanal. Darunter folgen die Karten für den Webhook, ntfy, Push auf diesem Gerät und alle Plugin-Kanäle.',
  'help.ctx.settings-notifications.bullet.1':
    'Benachrichtigungen: Schalte jedes Ereignis pro Kanal ein oder aus. Ein Schloss bedeutet, dass der Admin es für alle abgeschaltet hat.',
  'help.ctx.settings-notifications.bullet.2':
    'Webhook-URL: ein Discord-, Slack- oder eigener Webhook, mit Test und Speichern.',
  'help.ctx.settings-notifications.bullet.3':
    'Ntfy: „Ntfy-Thema“, optional „Ntfy-Server-URL“ und „Zugriffstoken“, dazu „Test“ und „Speichern“.',
  'help.ctx.settings-notifications.bullet.4':
    '„Push-Benachrichtigungen auf diesem Gerät“: „Für dieses Gerät einschalten“ gilt nur für diesen Browser, „Test senden“ probiert es aus. Ein Plugin-Kanal zeigt „Einrichten“, bis er eingerichtet ist.',
  'help.ctx.settings-integrations.title': 'Integrationen',
  'help.ctx.settings-integrations.summary':
    'Alles, was TREK mit anderen Diensten verbindet: Fotobibliotheken für das Journal, AirTrail für Flüge, Dawarich für die Orte, an denen du tatsächlich warst, wanderer für Trails, schreibgeschützte API-Schlüssel für andere Software und MCP für KI-Clients. Eine Verbindung zu einem anderen Dienst erscheint erst, wenn der Admin sie freigeschaltet hat.',
  'help.ctx.settings-integrations.bullet.1':
    'Immich und Synology Photos, AirTrail, Dawarich und wanderer: Jede Karte hat Felder für Adresse und Schlüssel, die Buttons „Speichern“ und „Verbindung testen“ sowie ein Badge „Verbunden“ oder „Nicht verbunden“.',
  'help.ctx.settings-integrations.bullet.2':
    'API-Schlüssel: Schlüssel mit reinem Lesezugriff für die öffentliche API, jeweils auf die Bereiche beschränkt, die du wählst, dazu der Endpunkt zum Kopieren.',
  'help.ctx.settings-integrations.bullet.3':
    'MCP-Konfiguration: der „MCP-Endpunkt“ und unter „OAuth 2.1-Clients“ deine registrierten Clients, die „Client-Konfiguration“ zum Kopieren und die „Aktiven OAuth-Sessions“ mit „Widerrufen“.',
  'help.ctx.settings-integrations.bullet.4':
    'API-Tokens: der alte Zugang zu MCP, als „Veraltet“ markiert; nutze stattdessen „OAuth 2.1-Clients“.',
  'help.ctx.settings-offline.title': 'Offline', // same-as-en
  'help.ctx.settings-offline.summary':
    'Was TREK auf diesem Gerät speichert, damit sich eine Reise auch ohne Verbindung öffnen lässt, und was passiert, wenn eine Offline-Änderung mit einer Änderung von woanders kollidiert.',
  'help.ctx.settings-offline.bullet.1':
    'Offline-Modus: „Offline-Modus erzwingen“ lädt zuerst alles herunter, arbeitet danach nur noch aus dem Cache und sammelt deine Änderungen in einer Warteschlange.',
  'help.ctx.settings-offline.bullet.2':
    'Für Offline vorbereiten: „Für Offline-Nutzung herunterladen“ lädt Reisedaten, Dokumente und Kartenkacheln; „Jetzt neu synchronisieren“ startet den Abgleich von Hand.',
  'help.ctx.settings-offline.bullet.3':
    'Was offline gespeichert wird: „Kartenkacheln offline speichern“ und ein Schalter pro Reise. Eine abgeschlossene Reise wird nur gespeichert, wenn du ihren Schalter einschaltest.',
  'help.ctx.settings-offline.bullet.4':
    'Der Bereich „Synchronisierungskonflikte“ erscheint nur, solange eine Änderung kollidiert, und bietet „Meine behalten“, „Server behalten“ und „Bei einem Konflikt“. Der Bereich „Offline-Cache“ zeigt die Zahl der Reisen und der ausstehenden oder fehlgeschlagenen Änderungen, mit „Erneut versuchen“, „Verwerfen“ und „Cache leeren“.',
  'help.ctx.settings-account.title': 'Konto',
  'help.ctx.settings-account.summary':
    'Wer du auf diesem TREK bist und wie du dich anmeldest: Profilbild, Benutzername und E-Mail, Passwort, Zwei-Faktor-Authentifizierung und Passkeys. „Löschen“ für dein Konto findest du unten in der Karte „Konto“.',
  'help.ctx.settings-account.bullet.1':
    'Konto: Mit der Kamera auf dem Bild lädst du ein Profilbild hoch, der rote Papierkorb entfernt es. „Benutzername“ und „E-Mail“ sicherst du mit „Speichern“.',
  'help.ctx.settings-account.bullet.2':
    'Passwort ändern: das aktuelle Passwort, zweimal das neue (die Regeln werden beim Tippen abgehakt), dann „Passwort aktualisieren“. Meldet sich diese TREK-Instanz nur über SSO an, fehlt die Karte.',
  'help.ctx.settings-account.bullet.3':
    'Zwei-Faktor-Authentifizierung (2FA) mit Authenticator-App und Backup-Codes, Passkeys für die Anmeldung ohne Passwort.',
  'help.ctx.settings-account.bullet.4':
    '„Löschen“ links unten in der Karte „Konto“ löscht das Konto nach einer Bestätigung. Der einzige Administrator kann sich nicht selbst löschen.',
  // language-region
  'help.guide.language-region.title': 'Sprache, Einheiten und Währung festlegen',
  'help.guide.language-region.goal': 'TREK in deiner Sprache und mit den Formaten deiner Region nutzen.',
  'help.guide.language-region.step.1':
    'Wähl unter „Sprache & Region“ bei „Sprache“ einen der Chips. TREK wechselt sofort, auf jedem Gerät, auf dem du angemeldet bist.',
  'help.guide.language-region.step.2':
    '„Ortsnamen“ legt fest, in welcher Sprache Ortssuche, Vorschläge und Adressen erscheinen; „Wie die App“ übernimmt die Sprache der Oberfläche.',
  'help.guide.language-region.result':
    'Datumsangaben, Entfernungen und Beträge erscheinen so, wie du es gewohnt bist. In „Kosten“ werden Beträge in deiner Anzeigewährung angezeigt, nur zur Ansicht: Was eingegeben wurde, bleibt unverändert.',
  'help.guide.language-region.tip.1': 'Mit „Reisewährung“ bleibt jede Reise in ihrer eigenen Währung, ohne Umrechnung.',
  'help.guide.language-region.tip.2':
    'Die Sprache legt auch die Tages- und Monatsnamen in Vacay und im Reisetagebuch fest.',
  // travel-map-prefs
  'help.guide.travel-map-prefs.title': 'Reisekarte und Tagesüberschriften anpassen',
  'help.guide.travel-map-prefs.goal':
    'Für alle Reisen festlegen, was die Reisekarte zeigt und wie die Tage überschrieben sind.',
  'help.guide.travel-map-prefs.step.1':
    'Unter „Reise & Karte“ legst du mit „Orte öffnen in“ fest, welche Karten-App der Navigations-Button direkt öffnet; mit „Jedes Mal fragen“ kannst du jedes Mal unter allen Apps wählen. „Datum zuerst in Tagesüberschriften“ stellt das Kalenderdatum an den Anfang jeder Tagesüberschrift.',
  'help.guide.travel-map-prefs.step.2':
    '„Buchungsrouten immer anzeigen“ zeichnet jeden Flug, jeden Zug und jede andere Buchung auf die Karte; „Orts-Labels auf Buchungsrouten“ schreibt an beide Enden den Namen des Bahnhofs oder Flughafens. „Kompakte Markierungen für ungeplante Orte“ verkleinert die Orte, die noch keinem Tag zugeordnet sind, damit die geplanten Halte hervortreten.',
  'help.guide.travel-map-prefs.result':
    'Die Reisekarte nutzt diese Einstellungen für alle Reisen, bis du sie wieder änderst.',
  'help.guide.travel-map-prefs.tip.1':
    'Diese Einstellungen gelten pro Konto, nicht pro Reise. In einer geteilten Reise sieht jedes Mitglied seine eigenen.',
  'help.guide.travel-map-prefs.tip.2':
    'Ein Admin kann die Standards für alle festlegen. Was du hier umstellst, gilt für dich.',
  // startup
  'help.guide.startup.title': 'Festlegen, womit TREK startet',
  'help.guide.startup.goal':
    'TREK auf der Seite öffnen, die du am häufigsten nutzt, statt jedes Mal auf dem Dashboard.',
  'help.guide.startup.step.1':
    'Stell oben in „Allgemein“ unter „Start“ die „Startseite“ auf „Dashboard“ oder „Aktive Reise“.',
  'help.guide.startup.step.2':
    'Bei „Aktive Reise“ erscheint „Start-Tab“: Wähl den Tab, mit dem sich diese Reise öffnet.',
  'help.guide.startup.result': 'Wenn du TREK das nächste Mal öffnest, landest du direkt dort.',
  'help.guide.startup.tip.1':
    '„Aktive Reise“ ist die Reise, die heute läuft, oder die nächste anstehende, also dieselbe, die das Dashboard hervorhebt.',
  // theme-scheme
  'help.guide.theme-scheme.title': 'Design und Akzentfarbe festlegen',
  'help.guide.theme-scheme.goal':
    'TREK hell, dunkel oder passend zu deinem Gerät darstellen, in deiner Lieblingsfarbe.',
  'help.guide.theme-scheme.step.1':
    'Stell unter „Theme“ den „Farbmodus“ auf „Hell“, „Dunkel“ oder „Automatisch“. „Automatisch“ richtet sich nach deinem Gerät.',
  'help.guide.theme-scheme.step.2':
    'Wähle ein „Farbschema“: „Standard“, „Hoher Kontrast“, „Indigo“, „Türkis“, „Rosé“, „Bernstein“, „Violett“ oder „Individuell“.',
  'help.guide.theme-scheme.step.3':
    'Wähle bei „Individuell“ einen der Farbpunkte oder lege deine eigene Akzentfarbe getrennt für „Hell“ und „Dunkel“ fest. Die Anzeige daneben meldet „Guter Kontrast“ oder „Niedriger Kontrast“.',
  'help.guide.theme-scheme.result':
    'Buttons, Links und Hervorhebungen nutzen überall die Akzentfarbe, auf jedem Gerät, auf dem du dich anmeldest.',
  'help.guide.theme-scheme.tip.1':
    'In der Navigationsleiste gibt es außerdem einen Schnellschalter für Hell und Dunkel. Er stellt dasselbe Design ein.',
  'help.guide.theme-scheme.tip.2': 'Ist der Standard schwer lesbar, wähle das Farbschema „Hoher Kontrast“.',
  // readability
  'help.guide.readability.title': 'Lesbarkeit und Textgröße anpassen',
  'help.guide.readability.goal': 'Weniger Glaseffekt und Animationen, mehr Abstand oder größere Schrift.',
  'help.guide.readability.step.1':
    'Unter „Lesbarkeit“ macht „Transparenz“ aus den Glasflächen deckende Flächen, „Bewegung reduzieren“ minimiert Animationen, und bei „Dichte“ wählst du „Komfortabel“ oder „Kompakt“.',
  'help.guide.readability.step.2':
    'Schriftgröße: Zieh den Regler „Alles“, um alle Texte auf einmal zu skalieren, oder stell „Groß“, „Mittel“, „Normal“ und „Klein“ einzeln ein. Zu jeder Größe gibt es ein Beispiel, so siehst du das Ergebnis schon beim Ziehen.',
  'help.guide.readability.result':
    'Die Änderung gilt sofort in der ganzen App, auch in den Kartenpanels und im Tagebuch.',
  'help.guide.readability.tip.1':
    'Teile von TREK reduzieren Animationen schon von selbst, wenn dein Gerät weniger Bewegung wünscht; „Bewegung reduzieren“ fährt auch den Rest herunter.',
  'help.guide.readability.tip.2':
    'Die Textgröße wird über die Typografiestufen angewendet, deshalb wird nichts abgeschnitten; was nicht mehr passt, bricht um.',
  // dashboard-widgets
  'help.guide.dashboard-widgets.title': 'Dashboard-Widgets auswählen',
  'help.guide.dashboard-widgets.goal': 'Zeig nur die Widgets an, die du nutzt, getrennt für Desktop und Smartphone.',
  'help.guide.dashboard-widgets.step.1':
    'Unter „Dashboard-Widgets“ listet Desktop die Widgets für „Unter dem Hero“ und „Rechte Seitenleiste“ auf. Schaltest du „Rechte Seitenleiste“ aus, wird die ganze Spalte ausgeblendet und das Dashboard zentriert; ihre Widgets sind ausgegraut, bis du sie wieder einschaltest.',
  'help.guide.dashboard-widgets.step.2':
    'Für das Dashboard auf dem Handy gibt es unter „Mobil“ eigene Schalter: „Unter dem Hero“ und „Seitenende“.',
  'help.guide.dashboard-widgets.result':
    'Das Dashboard ändert sich sofort. Ist die rechte Seitenleiste aus, wird das Dashboard zentriert.',
  'help.guide.dashboard-widgets.tip.1':
    'Widgets eines Addons erscheinen nur, solange der Admin das Addon aktiviert hat.',
  'help.guide.dashboard-widgets.tip.2':
    'Das Dashboard selbst merkt sich pro Gerät, ob du die Raster- oder Listenansicht nutzt und wie sortiert ist.',
  // map-provider
  'help.guide.map-provider.title': 'Karten-Engine und Kartenstil wählen',
  'help.guide.map-provider.goal': 'Zwischen der klassischen Karte, Vektorkacheln und der 3D-Karte von Mapbox wechseln.',
  'help.guide.map-provider.step.1':
    'Wähl unter „Kartenanbieter“ Leaflet für die klassische 2D-Karte mit beliebigen Rasterkacheln, Mapbox GL für Vektorkacheln mit 3D-Gebäuden und Gelände oder MapLibre GL für Vektorkacheln von OpenFreeMap, ganz ohne Token.',
  'help.guide.map-provider.step.2':
    'Wähle eine „Karten-Vorlage“ für Leaflet oder einen „Kartenstil“ für eine GL-Engine, oder füge eine eigene URL ein. Mapbox GL braucht ein Mapbox Access Token, CARTO-Vorlagen einen CARTO-API-Key; über den Link unter dem jeweiligen Feld bekommst du einen.',
  'help.guide.map-provider.step.3':
    'Schalte bei Mapbox GL „3D-Gebäude & Terrain“ ein und, wenn dein Gerät es schafft, den „Hochqualitäts-Modus“. Prüf die Vorschau und klick dann auf „Karte speichern“.',
  'help.guide.map-provider.result':
    'Die Karten im Reiseplaner und im Journal werden mit der gewählten Engine gezeichnet; der Atlas nutzt immer Leaflet.',
  'help.guide.map-provider.tip.1': 'Ohne Token weicht Mapbox GL auf Leaflet aus, statt gar nichts anzuzeigen.',
  'help.guide.map-provider.tip.2':
    'Offline gespeicherte Kartenkacheln stammen von dem Anbieter, der beim Herunterladen aktiv ist.',
  // notification-channels
  'help.guide.notification-channels.title': 'Benachrichtigungswege einrichten',
  'help.guide.notification-channels.goal':
    'Erhalte Reiseerinnerungen und Neuigkeiten aus der Zusammenarbeit auf dem Smartphone oder in einem anderen Tool.',
  'help.guide.notification-channels.step.1':
    'Für einen Webhook fügst du eine Discord-, Slack- oder eigene Webhook-URL ein, klickst auf „Test“ und dann auf „Speichern“.',
  'help.guide.notification-channels.step.2':
    'Trag für ntfy das „Ntfy-Thema“ ein. Betreibst du einen eigenen Server, ergänze seine „Ntfy-Server-URL“ und ein „Zugriffstoken“. „Test senden“ schickt sofort eine Nachricht, „Speichern“ übernimmt die Einstellung.',
  'help.guide.notification-channels.step.3':
    'Schalte in der Karte „Benachrichtigungen“ oben jedes Ereignis pro Kanal ein oder aus. Ein Schloss bedeutet, dass der Admin es für alle abgeschaltet hat. Ein Plugin-Kanal zeigt „Einrichten“, bis er eingerichtet ist; mit „Test senden“ probierst du ihn aus.',
  'help.guide.notification-channels.result':
    'Ereignisse werden über die Kanäle verschickt, die du dafür eingeschaltet hast; die Spalte „In-App“ bestimmt, was die Glocke in der Navigationsleiste anzeigt.',
  'help.guide.notification-channels.tip.1':
    'Die eigene Erinnerung einer Reise, also wie viele Tage vor der Abreise, legst du im Bearbeitungsformular der Reise fest.',
  'help.guide.notification-channels.tip.2':
    'Der Admin kann für alle einen Standard-ntfy-Server vorgeben; dein Topic wählst du trotzdem selbst.',
  // photo-providers
  'help.guide.photo-providers.title': 'Fotobibliothek verbinden',
  'help.guide.photo-providers.goal': 'Das Tagebuch die Fotos des Tages aus Immich oder Synology Photos laden lassen.',
  'help.guide.photo-providers.step.1':
    'Such unter „Integrationen“ die Karte von Immich oder Synology Photos und gib ein, was verlangt wird: für Immich die „Server-URL“ mit einem „API-Schlüssel“, für Synology Photos „Benutzername“ und „Passwort“. Immich kann Journey-Fotos beim Hochladen auch zurück in deine Bibliothek spiegeln.',
  'help.guide.photo-providers.step.2':
    'Klick auf „Verbindung testen“ und dann auf „Speichern“. Das Badge zeigt jetzt „Verbunden“.',
  'help.guide.photo-providers.result':
    'Der Tab „External photos“ im Eintragseditor durchsucht die verbundene Bibliothek nach Fotos vom Tag des Eintrags, die dem Ort des Eintrags nächsten zuerst.',
  'help.guide.photo-providers.tip.1':
    'Die Verbindung gilt nur für dein Konto. Andere Mitglieder einer Journey verbinden ihre eigenen Mediatheken.',
  'help.guide.photo-providers.tip.2':
    'Auch ein Anbieter ohne GPS-Daten in den Fotos funktioniert. Die Liste wird dann nach Zeit sortiert.',
  // api-keys
  'help.guide.api-keys.title': 'API-Schlüssel erstellen',
  'help.guide.api-keys.goal': 'Andere Software deine Reisen über die öffentliche API lesen lassen.',
  'help.guide.api-keys.step.1':
    'Klick unter „API-Schlüssel“ auf „Schlüssel erstellen“, gib ihm einen Namen, an dem du erkennst, wo er genutzt wird, und lass unter „Was dieser Schlüssel lesen darf“ nur die Bereiche aktiv, die er braucht. Klick auf „Erstellen“.',
  'help.guide.api-keys.step.2':
    'Kopier den Schlüssel aus „API-Schlüssel erstellt“: Er wird nur einmal angezeigt. Klick auf „Fertig“; den Endpunkt, den du aufrufst, findest du unter der Liste.',
  'help.guide.api-keys.result':
    'Programme mit dem Schlüssel können die gewählten Bereiche lesen, aber nie etwas ändern. Die Liste zeigt, wann jeder Schlüssel erstellt und zuletzt genutzt wurde, und das Papierkorb-Icon löscht ihn.',
  'help.guide.api-keys.tip.1':
    'Nimm für jedes Tool einen eigenen Schlüssel. So kannst du einen widerrufen, ohne die anderen Tools zu beeinträchtigen.',
  'help.guide.api-keys.tip.2':
    'Soll ein KI-Client Dinge ändern können, nimm stattdessen MCP mit OAuth; API-Schlüssel können nur lesen.',
  // mcp-oauth
  'help.guide.mcp-oauth.title': 'KI-Assistenten über MCP verbinden',
  'help.guide.mcp-oauth.goal': 'Claude, einer IDE oder einem anderen MCP-Client Zugriff auf deine Reisen geben.',
  'help.guide.mcp-oauth.step.1': 'Kopier unter „MCP-Konfiguration“ den „MCP-Endpunkt“ für deinen Client.',
  'help.guide.mcp-oauth.step.2':
    'Klicke unter „OAuth 2.1-Clients“ auf „Neuer Client“ und wähle eine Schnellvorlage wie Claude Desktop oder Cursor, oder fülle „Anwendungsname“, „Redirect-URIs“ und „Erlaubte Berechtigungen“ selbst aus; für einen Server ohne Browser wählst du „Maschine“. Klicke auf „Client registrieren“ und kopiere das Client-Secret: Es wird nur einmal angezeigt.',
  'help.guide.mcp-oauth.step.3':
    'Jeder Client hat „Secret erneuern“ und „Client löschen“. „Aktive OAuth-Sessions“ zeigt, was gerade angemeldet ist, jeweils mit „Widerrufen“. „Client-Konfiguration“ klappt ein fertiges Snippet für Clients auf, die JSON verwenden.',
  'help.guide.mcp-oauth.result':
    'Der Client kann in deinem Namen lesen und ändern, was seine Berechtigungen erlauben, und jede Aktion erscheint unter deinem Namen.',
  'help.guide.mcp-oauth.tip.1':
    'Berechtigungen begrenzen, was ein Client darf. Gib einem Client nur Lesezugriff, bis er mehr braucht.',
  'help.guide.mcp-oauth.tip.2':
    'Die Administration kann MCP für die ganze Instanz abschalten. Dann wird dieser Abschnitt nicht angezeigt.',
  // offline-prepare
  'help.guide.offline-prepare.title': 'Reisen offline verfügbar machen',
  'help.guide.offline-prepare.goal':
    'Deine Reisen samt Karten auf diesem Gerät speichern, bevor du keine Verbindung mehr hast.',
  'help.guide.offline-prepare.step.1':
    'Lass unter „Was offline gespeichert wird“ die Option „Kartenkacheln offline speichern“ eingeschaltet und schalte die Reisen ein, die du auf diesem Gerät haben willst. Eine beendete Reise wird nur gespeichert, wenn du sie einschaltest.',
  'help.guide.offline-prepare.step.2':
    'Klick wieder oben unter „Für Offline vorbereiten“ auf „Für Offline-Nutzung herunterladen“. TREK lädt Reisedaten, Dokumente und Kartenkacheln herunter und zeigt an, wie viele Reisen gespeichert wurden.',
  'help.guide.offline-prepare.step.3':
    '„Offline-Modus erzwingen“ lädt noch einmal alles herunter und arbeitet danach nur noch mit den Daten auf diesem Gerät. So kannst du prüfen, ob alles da ist, bevor du losfährst.',
  'help.guide.offline-prepare.result':
    'Die Reisen öffnen sich auch ohne Verbindung. Deine Änderungen landen in einer Warteschlange und werden gesendet, sobald du wieder online bist.',
  'help.guide.offline-prepare.tip.1':
    'Kartenkacheln brauchen den meisten Platz; schalte sie aus, wenn du nur Reisedaten und Dokumente offline haben willst.',
  'help.guide.offline-prepare.tip.2':
    'Installiere TREK über den Browser als App, dann klappt der Offline-Start am reibungslosesten.',
  // offline-conflicts
  'help.guide.offline-conflicts.title': 'Bei einem Synchronisierungskonflikt entscheiden, welche Version bleibt',
  'help.guide.offline-conflicts.goal':
    'Leg fest, wie TREK einen Konflikt zwischen einer Offline-Änderung und einer Änderung von woanders auflöst.',
  'help.guide.offline-conflicts.step.1':
    'Kollidiert eine Änderung, die du offline gemacht hast, mit einer neueren, erscheint oben unter „Offline“ der Bereich „Synchronisierungskonflikte“. Klick bei jeder Änderung auf „Meine behalten“ oder „Server behalten“.',
  'help.guide.offline-conflicts.step.2':
    'In derselben Karte legst du unter „Bei einem Konflikt“ fest, was beim nächsten Mal passiert: „Jedes Mal nachfragen“, „Immer meine Version behalten“ oder „Immer die Server-Version behalten“.',
  'help.guide.offline-conflicts.result':
    'Mit „Jedes Mal nachfragen“ wartet ein Konflikt unter „Synchronisierungskonflikte“, bis du entscheidest. Mit den beiden anderen Optionen wird er automatisch gelöst.',
  'help.guide.offline-conflicts.tip.1':
    '„Cache leeren“ entfernt nur die Kopie auf diesem Gerät. Auf dem Server ändert sich nichts.',
  // profile
  'help.guide.profile.title': 'Profil ändern',
  'help.guide.profile.goal': 'Name, E-Mail und Profilbild aktualisieren.',
  'help.guide.profile.step.1':
    'Klick in der Karte „Konto“ auf die Kamera an deinem Bild, um ein Foto hochzuladen; der rote Papierkorb entfernt es wieder, und es erscheint wieder dein Anfangsbuchstabe.',
  'help.guide.profile.step.2': 'Ändere „Benutzername“ und „E-Mail“ unter dem Bild.',
  'help.guide.profile.result': 'Dein Name und dein Bild ändern sich überall gleichzeitig, auch in geteilten Reisen.',
  'help.guide.profile.tip.1': 'Ein über SSO verknüpftes Konto trägt ein SSO-Badge und „Verknüpft mit“ samt Anbieter.',
  // password
  'help.guide.password.title': 'Passwort ändern',
  'help.guide.password.goal': 'Ein neues Passwort festlegen.',
  'help.guide.password.step.1':
    'Gib unter „Passwort ändern“ dein „Aktuelles Passwort“ ein, dann das „Neue Passwort“ und dasselbe noch einmal unter „Neues Passwort bestätigen“. Die Liste darunter hakt beim Tippen jede erfüllte Regel ab.',
  'help.guide.password.step.2': 'Klick auf „Passwort aktualisieren“.',
  'help.guide.password.result':
    'Das neue Passwort gilt sofort. Alle anderen Geräte werden abgemeldet, deine MCP-API-Tokens werden gelöscht, und OAuth-Clients müssen sich neu anmelden; auf diesem Gerät bleibst du angemeldet.',
  'help.guide.password.tip.1':
    'Läuft die Anmeldung bei diesem TREK nur über SSO, gibt es kein TREK-Passwort und keine Karte „Passwort ändern“.',
  // mfa
  'help.guide.mfa.title': 'Zwei-Faktor-Authentifizierung einschalten',
  'help.guide.mfa.goal': 'Schütze dein Konto mit einem Code aus einer Authenticator-App.',
  'help.guide.mfa.step.1': 'Klick unter „Zwei-Faktor-Authentifizierung (2FA)“ auf „Authenticator einrichten“.',
  'help.guide.mfa.step.2':
    'Scanne den QR-Code mit deiner App oder gib den Schlüssel von Hand ein. Tipp dann den sechsstelligen Code aus der App ein und klick auf „2FA aktivieren“.',
  'help.guide.mfa.step.3':
    'Sichere die Backup-Codes mit „Codes kopieren“, „TXT herunterladen“ oder „Drucken / PDF“ und klick dann auf „OK“. Jeder Code funktioniert genau einmal, falls du dein Handy nicht zur Hand hast.',
  'help.guide.mfa.result': 'Bei jeder Anmeldung wird nach dem Passwort ein Code abgefragt.',
  'help.guide.mfa.tip.1':
    'Für „2FA deaktivieren“ brauchst du dein Passwort und einen aktuellen Code oder einen unbenutzten Backup-Code.',
  'help.guide.mfa.tip.2':
    'Der Admin kann 2FA für alle verpflichtend machen; dann lässt es sich hier nicht ausschalten.',
  // passkeys
  'help.guide.passkeys.title': 'Mit Passkey anmelden',
  'help.guide.passkeys.goal':
    'Melde dich mit Fingerabdruck, Gesichtserkennung oder PIN deines Geräts statt mit Passwort an.',
  'help.guide.passkeys.step.1':
    'Klicke unter „Passkeys“ auf „Passkey hinzufügen“, bestätige dein aktuelles Passwort, gib dem Passkey einen Namen, an dem du das Gerät erkennst, und folge dann der Aufforderung deines Geräts.',
  'help.guide.passkeys.step.2':
    'Bei jedem Passkey siehst du, ob er „Abgeglichen“ oder an „Dieses Gerät“ gebunden ist und wann er zuletzt genutzt wurde. Mit „Umbenennen“ änderst du seinen Namen, und der Löschen-Button entfernt ihn, nachdem du dein Passwort eingegeben hast.',
  'help.guide.passkeys.result':
    'Die Anmeldeseite bietet den Passkey an. Mit deinem Passwort kannst du dich weiterhin anmelden.',
  'help.guide.passkeys.tip.1':
    'Ein Passkey wird auf dem Gerät oder in dessen Passwort-Manager gespeichert. Leg deshalb für jedes Gerät einen eigenen an.',
  'help.guide.passkeys.tip.2':
    'Passkeys erscheinen erst, wenn der Admin sie eingeschaltet hat. Solange für den Server keine WebAuthn-Domain eingerichtet ist, weist die Karte darauf hin, statt „Passkey hinzufügen“ anzubieten.',
  // delete-account
  'help.guide.delete-account.title': 'Konto löschen',
  'help.guide.delete-account.goal': 'Dein Konto und die Daten, die nur dir gehören, entfernen.',
  'help.guide.delete-account.step.1':
    'Klick in der Karte „Konto“ unten links auf „Löschen“ und dann auf „Endgültig löschen“.',
  'help.guide.delete-account.result':
    'Dein Konto ist gelöscht, und mit ihm die Reisen, Orte und Dateien, die dir gehören. Reisen, die anderen gehören, bleiben bei ihnen.',
  'help.guide.delete-account.tip.1':
    'Bist du der einzige Administrator, meldet TREK „Löschung nicht möglich“. Mach dann zuerst einen anderen Benutzer zum Admin.',
  'help.guide.delete-account.tip.2':
    'Das lässt sich nicht rückgängig machen. Exportiere vor dem Bestätigen alles, was du behalten willst.',

  // ── Screen: admin (all tabs) ──────────────────────────────────────────────────────────
  'help.ctx.admin.title': 'Administration',
  'help.ctx.admin.summary':
    'Die Instanz, auf der TREK für alle läuft: wer sich anmelden darf und wie, was eingeschaltet ist, wo Dateien liegen, wie der Server die Leute erreicht und wie er gesichert wird. Nur Admins sehen diese Seite. Die Seitenleiste gruppiert die Tabs unter „Benutzer“, „Konfiguration“, „Integrationen“ und „Wartung“, und jeder Tab ist eine eigene Ansicht.',
  'help.ctx.admin.bullet.1':
    'Rechts in der Kopfzeile stehen die Zahlen der Benutzer, Reisen, Orte und Dateien. Darunter erscheint das Banner „Update verfügbar“, sobald es eine neuere TREK-Version gibt.',
  'help.ctx.admin.bullet.2':
    '„Benutzer“ und „Benutzer-Standards“: Konten, Einladungslinks und Berechtigungen sowie die Einstellungen und die Karte, mit denen ein neues Konto startet.',
  'help.ctx.admin.bullet.3':
    'Personalisierung, Einstellungen, Add-ons, Plugins und Speicher: Packvorlagen, Kategorien und Schulferien; Anmeldung, Passkeys, 2FA, API-Schlüssel und Suchanbieter; die Funktionsmodule; Plugins von Drittanbietern; der Speicherort für Uploads.',
  'help.ctx.admin.bullet.4':
    'Benachrichtigungen, MCP-Zugang und GitHub: die Kanäle, die Benutzer wählen dürfen, und die Vorgaben, mit denen sie starten, die Tokens und Sitzungen von KI-Clients sowie der Update-Verlauf.',
  'help.ctx.admin.bullet.5':
    'Backup und Audit: Backups auf Abruf und nach Zeitplan sowie das Protokoll sicherheitsrelevanter Ereignisse.',
  'help.ctx.admin-users.title': 'Benutzer',
  'help.ctx.admin-users.summary':
    'Alle Konten auf diesem TREK mit Rolle, E-Mail und letzter Aktivität, die Einladungslinks, mit denen sich Leute auf einer geschlossenen Instanz registrieren können, und wer in Reisen was darf.',
  'help.ctx.admin-users.bullet.1':
    'Die Tabelle zeigt Benutzer, E-Mail, Rolle, Erstellt und Zuletzt aktiv, in jeder Zeile mit „Benutzer bearbeiten“ und „Benutzer löschen“. Ein grüner Punkt am Avatar bedeutet, dass die Person gerade online ist; deine eigene Zeile ist mit „(Du)“ markiert.',
  'help.ctx.admin-users.bullet.2':
    'Mit „Benutzer anlegen“ oben rechts in der Karte „Benutzer“ legst du ein Konto von Hand an, mit einem Passwort, das du der Person mitteilst.',
  'help.ctx.admin-users.bullet.3':
    '„Einladungslinks“ darunter: Registrierungslinks mit Nutzungslimit, Ablaufdatum und auf Wunsch einer Reise, der neue Benutzer direkt nach der Registrierung beitreten.',
  'help.ctx.admin-users.bullet.4':
    '„Berechtigungseinstellungen“ unten: Für jede Aktion legst du fest, wer sie ausführen darf („Alle“, „Reise-Mitglieder“, „Reise-Eigentümer“ oder „Nur Administrator“), und speicherst mit „Speichern“ oben in der Karte.',
  'help.ctx.admin-defaults.title': 'Benutzer-Standards',
  'help.ctx.admin-defaults.summary':
    'Womit ein neues Konto startet, damit niemand erst alles einrichten muss: Farbmodus, Einheiten, Zeitformat, Wochenbeginn, Anzeigewährung und verborgene Buchungscodes, dazu die Karte, ihre Schlüssel und die Routing-Server.',
  'help.ctx.admin-defaults.bullet.1':
    'Links die Standard-Benutzereinstellungen: „Farbmodus“, „Temperatureinheit“, „Entfernungseinheit“, „Zeitformat“, „Woche beginnt am“, „Anzeigewährung“ und „Buchungscodes verbergen“.',
  'help.ctx.admin-defaults.bullet.2':
    'Karte rechts: „Karten-Vorlage“, „Gemeinsamer CARTO-Key“, „Eigene Routing-Instanz“ und „Eigene Valhalla-Instanz“, eine Vorschau, danach „Kartendienst“ mit „Kartenstil“, „Gemeinsames Mapbox-Token“, „3D-Gebäude & Gelände“ und „Hochqualitätsmodus“.',
  'help.ctx.admin-config.title': 'Personalisierung',
  'help.ctx.admin-config.summary':
    'Einstellungen, die alle Reisen der Instanz gemeinsam nutzen: Packvorlagen, die Kategorien für Orte und Sammlungen und der Schulferienkatalog, den Vacay verwendet.',
  'help.ctx.admin-config.bullet.1':
    '„Packvorlagen“: benannte Listen mit Kategorien und Einträgen, mit denen die Packliste einer Reise starten kann.',
  'help.ctx.admin-config.bullet.2':
    'Kategorien: Name, Icon und Farbe der Kategorien, die überall in TREK verwendet werden, vom Ortsinspektor bis zu den Sammlungen; jede bearbeitest du in einem Dialog mit Vorschau.',
  'help.ctx.admin-config.bullet.3':
    'Schulferien: der Katalog der Länder und Regionen mit ihren Ferienzeiten, aus dem alle in Vacay wählen können.',
  'help.ctx.admin-settings.title': 'Einstellungen',
  'help.ctx.admin-settings.summary':
    'Wie sich Leute anmelden und mit welchen Diensten der Server Verbindung aufnehmen darf. Links: „Authentifizierungsmethoden“, „Passkey-Anmeldung“, „Zwei-Faktor-Authentifizierung (2FA) für alle verlangen“ und „Single Sign-On (OIDC)“. Rechts: „Erlaubte Dateitypen“ und „API-Schlüssel“ mit den Such- und ÖPNV-Anbietern. Ganz unten liegt die „Gefahrenzone“.',
  'help.ctx.admin-settings.bullet.1':
    'Authentifizierungsmethoden: Passwort-Anmeldung, Passwort-Registrierung und, sobald OIDC eingerichtet ist, SSO-Anmeldung und SSO-Auto-Provisionierung. „Zwei-Faktor-Authentifizierung (2FA) für alle verlangen“ hat eine eigene Karte.',
  'help.ctx.admin-settings.bullet.2':
    'Passkey-Anmeldung: „Passkey-Anmeldung aktivieren“, „Relying Party ID (Domain)“ und „Erlaubte Origins“. Single Sign-On (OIDC): „Anzeigename“, „Issuer-URL“, eine optionale „Discovery-URL“, „Client-ID“ und „Client-Secret“.',
  'help.ctx.admin-settings.bullet.3':
    'API-Schlüssel: Ganz oben steht die TREK Places API, die keinen Schlüssel braucht. Darunter folgen der Google Maps API-Schlüssel (mit „Test“ und „Wofür der Schlüssel genutzt wird“), der Unsplash- und der Amap-Schlüssel und unten in der Karte ein gemeinsamer „Speichern“-Button.',
  'help.ctx.admin-settings.bullet.4':
    '„Verkehrsanbieter“ und „Anbieter für die Ortssuche“ legen fest, wer ÖPNV- und Ortssuchen beantwortet; „Ortssuche protokollieren“ hält fest, welches Ergebnis gewählt wurde; „Erlaubte Dateitypen“ schränkt Uploads ein.',
  'help.ctx.admin-addons.title': 'Add-ons',
  'help.ctx.admin-addons.summary':
    'Die Funktionsmodule von TREK, jedes mit eigenem Schalter: Packliste, Budget, Dokumente, Vacay, Atlas, Collab, Journey, Sammlungen, Roadtrip, MCP, AirTrail, Dawarich und die KI-Verarbeitung. Aus heißt: Navigationseintrag, Routen und API sind für alle entfernt.',
  'help.ctx.admin-addons.bullet.1':
    'Eine Kachel pro Addon mit Schalter und, falls vorhanden, Unterzeilen für seine Optionen.',
  'help.ctx.admin-addons.bullet.2':
    'Auch Foto- und Dokumentanbieter erscheinen hier als Kacheln, damit du den Benutzern zum Beispiel Immich oder Synology anbieten kannst.',
  'help.ctx.admin-addons.bullet.3': '„Gepäck-Tracking“ hat unter den Kacheln einen eigenen Schalter.',
  'help.ctx.admin-plugins.title': 'Plugins', // same-as-en
  'help.ctx.admin-plugins.summary':
    'Plugins von Drittanbietern, die in einem eigenen Prozess neben TREK laufen, jedes mit den Berechtigungen, die es bei der Installation angefordert hat. Installiere aus dem Katalog, lade ein Paket hoch oder verknüpfe einen Ordner, während du ein Plugin entwickelst.',
  'help.ctx.admin-plugins.bullet.1':
    '„Installiert“ und „Entdecken“, mit „Plugins durchsuchen…“ und den Filtern Typ, Status und Sortieren. Jede Zeile zeigt die Version, „Geprüft“, „Signiert“ oder „Unsigniert“, worauf das Plugin zugreifen darf, einen Schalter und ein ⋯-Menü.',
  'help.ctx.admin-plugins.bullet.2':
    'Die zwei Icons oben in der Karte: „Plugin hochladen“ nimmt eine .zip-, .tgz- oder .tar.gz-Datei an (oder du ziehst eine .zip auf die Seite). „Neu scannen“ erkennt einen Plugin-Ordner, der für die Entwicklung verlinkt ist.',
  'help.ctx.admin-plugins.bullet.3':
    'Erlaubte Hosts pro Plugin: die Adressen, die ein Plugin aufrufen darf, denn ausgehende Verbindungen sind standardmäßig gesperrt.',
  'help.ctx.admin-storage.title': 'Speicher',
  'help.ctx.admin-storage.summary':
    'Wo Uploads gespeichert werden: auf der lokalen Festplatte oder in einem S3-Bucket, optional zusätzlich auf weitere Backends kopiert. Jede Upload-Kategorie kann auf einem anderen Backend landen, und es ändert sich nichts, bis du auf „Änderungen speichern“ klickst.',
  'help.ctx.admin-storage.bullet.1':
    '„Gesundheit“ oben: die fehlgeschlagenen Schreibvorgänge auf ein Spiegelziel oder „Keine Replikatfehler aufgezeichnet.“',
  'help.ctx.admin-storage.bullet.2':
    'Backends: Name, Typ, Nutzung und „Gespiegelt nach“, mit „Test“, „Bearbeiten“ und „Entfernen“. „Jetzt berechnen“ ermittelt, was gespeichert ist; ein Backend, das über eine Umgebungsvariable festgelegt ist, ist schreibgeschützt.',
  'help.ctx.admin-storage.bullet.3':
    'Kategorien: Reisedokumente, Journey-Fotos, Cover, Profilbilder, Ortsbilder, die Foto-Caches und Backups, jeweils einem Backend zugeordnet.',
  'help.ctx.admin-notifications.title': 'Benachrichtigungen',
  'help.ctx.admin-notifications.summary':
    'Die Kanäle, die die Instanz ihren Benutzern anbietet, und die, über die du als Admin benachrichtigt wirst. Benutzer wählen ihre eigenen Topics und URLs unter „Einstellungen“; du legst fest, welche Kanäle es gibt, und richtest E-Mail ein.',
  'help.ctx.admin-notifications.bullet.1':
    'E-Mail (SMTP), Webhook, Ntfy und Web Push haben je einen Schalter, mit dem du den Kanal für Benutzer freigibst; für E-Mail brauchst du außerdem die Servereinstellungen. In-App ist immer aktiv.',
  'help.ctx.admin-notifications.bullet.2':
    '„Reiseerinnerungen“: ob der Server vor Reisebeginn eine Erinnerung verschickt.',
  'help.ctx.admin-notifications.bullet.3':
    'Admin-Webhook, Admin-Ntfy und die Karte „Benachrichtigungen“: Hier legst du fest, wohin Admin-Ereignisse („Neue Version verfügbar“, „Speicher-Replik-Fehler“, „Paddel-Region angefragt“) gehen, jeweils mit einem Test-Button.',
  'help.ctx.admin-mcp-tokens.title': 'MCP-Zugang',
  'help.ctx.admin-mcp-tokens.summary':
    'Alle Tokens und OAuth-Sitzungen, die KI-Clients für diese TREK-Instanz haben, über alle Benutzer hinweg. Du kannst jeden davon widerrufen.',
  'help.ctx.admin-mcp-tokens.bullet.1':
    'OAuth-Sitzungen: der Client, die ihm gewährten Scopes, sein Besitzer und das Datum, dazu ein Papierkorb, mit dem du den Zugang widerrufst.',
  'help.ctx.admin-mcp-tokens.bullet.2':
    '„API-Tokens“: Name, Besitzer, „Erstellt“ und „Zuletzt verwendet“, dazu ein Papierkorb, der das Token löscht.',
  'help.ctx.admin-github.title': 'GitHub',
  'help.ctx.admin-github.summary':
    'Was es Neues in TREK gibt: die Versionshistorie von GitHub und ob es eine neuere Version als deine gibt. Das Update selbst läuft nicht in der App, sondern auf dem Host.',
  'help.ctx.admin-github.bullet.1':
    '„Update-Verlauf“ zeigt die Versionen als Zeitleiste mit ihren Versionshinweisen; die neueste ist mit „Aktuell“ markiert, Vorabversionen mit „Vorabversion“, und „GitHub“ öffnet die Release-Seite.',
  'help.ctx.admin-github.bullet.2':
    '„Update verfügbar“ erscheint unter der Kopfzeile der Seite, sobald es eine neuere Version gibt. „Update-Anleitung“ zeigt die Befehle für Docker oder die Anleitung für andere Installationen.',
  'help.ctx.admin-backup.title': 'Backup', // same-as-en
  'help.ctx.admin-backup.summary':
    'Vollständige Backups der Datenbank und der Uploads, manuell oder nach Zeitplan erstellt, auf dem Server gespeichert und als eine Datei herunterladbar. Mit „Wiederherstellen“ spielst du ein Backup zurück.',
  'help.ctx.admin-backup.bullet.1':
    'Datensicherung: „Backup erstellen“ und „Backup hochladen“ oben in der Karte sowie die Liste der Backups mit „Herunterladen“, „Wiederherstellen“ und einem Papierkorb.',
  'help.ctx.admin-backup.bullet.2':
    '„Backup hochladen“ stellt aus einer Datei wieder her, die auf einer anderen Instanz oder an einem früheren Tag erstellt wurde; vorher kommt dieselbe Rückfrage wie bei „Wiederherstellen“.',
  'help.ctx.admin-backup.bullet.3':
    'Auto-Backup: an oder aus, „Intervall“, „Ausführung um“ (Stunde) und Tag sowie „Alte Backups löschen nach“ (von „1 Tag“ bis „Immer behalten“). Übernommen wird alles mit „Speichern“.',
  'help.ctx.admin-audit.title': 'Audit', // same-as-en
  'help.ctx.admin-audit.summary':
    'Das Protokoll sicherheitsrelevanter und administrativer Ereignisse: Anmeldungen und Fehlversuche, MFA-Änderungen, Änderungen an Benutzern und Einstellungen, Backups und Wiederherstellungen. Nur lesbar, die neuesten Einträge zuerst.',
  'help.ctx.admin-audit.bullet.1': 'Eine Zeile pro Ereignis mit Zeit, Benutzer, Aktion, Ressource, IP und Details.',
  'help.ctx.admin-audit.bullet.2':
    '„Aktualisieren“ im Kopf der Karte lädt neu. Das Badge neben dem Titel zeigt, wie viele Einträge von der Gesamtzahl geladen sind, und „Mehr laden“ holt ältere Einträge.',
  // create-user
  'help.guide.create-user.title': 'Benutzer anlegen',
  'help.guide.create-user.goal': 'Leg ein Konto von Hand an, ohne Einladung.',
  'help.guide.create-user.step.1': 'Klick oben rechts in der Karte „Benutzer“ auf „Benutzer anlegen“.',
  'help.guide.create-user.step.2':
    'Gib „Benutzername“, „E-Mail“ und ein „Passwort“ ein; die Checkliste unter dem Passwort hakt die Regeln ab, die es erfüllen muss. Wähle die „Rolle“: „Benutzer“ oder „Administrator“.',
  'help.guide.create-user.step.3': 'Klick auf „Benutzer anlegen“.',
  'help.guide.create-user.result':
    'Das Konto erscheint in der Tabelle und kann sich sofort anmelden. Gib das Passwort über einen vertrauenswürdigen Kanal an die Person weiter.',
  'help.guide.create-user.tip.1': 'Soll jemand sein Passwort selbst wählen, ist ein Einladungslink die bessere Wahl.',
  'help.guide.create-user.tip.2':
    'Ein Administrator sieht diese Seite und darf alles. Was ein Benutzer in Reisen darf, legst du weiter unten unter „Berechtigungseinstellungen“ fest.',
  // edit-user
  'help.guide.edit-user.title': 'Daten oder Passwort eines Benutzers ändern',
  'help.guide.edit-user.goal':
    'Jemanden umbenennen, befördern oder zurückstufen oder nach einem vergessenen Passwort wieder Zugang geben.',
  'help.guide.edit-user.step.1':
    'Klicke in der Zeile des Benutzers auf den Stift („Benutzer bearbeiten“). Oben im Dialog steht die E-Mail-Adresse des Kontos.',
  'help.guide.edit-user.step.2':
    'Ändere „Benutzername“, „E-Mail“ oder „Rolle“ oder gib ein „Neues Passwort“ ein (leer lassen, um das aktuelle zu behalten), und klick auf „Speichern“. „Passkeys zurücksetzen“ ganz unten entfernt nach einer Rückfrage alle Passkeys des Kontos.',
  'help.guide.edit-user.result':
    'Die Änderung gilt sofort. Bei einem neuen Passwort wird die Person außerdem auf allen Geräten abgemeldet, eine alte Sitzung funktioniert dann nicht mehr.',
  'help.guide.edit-user.tip.1':
    'Solange du der letzte Admin bist, kannst du dir die Admin-Rolle nicht selbst entziehen.',
  'help.guide.edit-user.tip.2':
    'Beim Zurücksetzen der Passkeys bleibt das Passwort erhalten; die Person legt unter „Einstellungen“, „Konto“ neue Passkeys an.',
  // invite-links
  'help.guide.invite-links.title': 'Per Link einladen',
  'help.guide.invite-links.goal':
    'Lass jemanden sich auf einer geschlossenen Instanz registrieren und füg die Person auf Wunsch gleich einer Reise hinzu.',
  'help.guide.invite-links.step.1': 'Klick oben rechts in der Karte „Einladungslinks“ auf „Link erstellen“.',
  'help.guide.invite-links.step.2':
    'Wähle „Max. Nutzungen“ (1× bis 5× oder ∞) und „Gültig für“ (1d bis 14d oder ∞), optional unter „Zu Trip hinzufügen (optional)“ eine Reise, und klicke auf „Erstellen & kopieren“.',
  'help.guide.invite-links.step.3':
    'Verschick den Link. Jede Zeile zeigt, wie oft er genutzt wurde, wann er abläuft, zu welcher Reise er hinzufügt und wer ihn erstellt hat, daneben „Aktiv“, „Abgelaufen“ oder „Aufgebraucht“. „Link kopieren“ kopiert ihn noch einmal, und der Papierkorb löscht ihn.',
  'help.guide.invite-links.result':
    'Wer den Link öffnet, registriert sich mit einem eigenen Passwort. Wurde eine Reise ausgewählt, tritt die Person ihr sofort bei.',
  'help.guide.invite-links.tip.1':
    'Einladungslinks funktionieren auch dann, wenn „Password Registration“ unter „Einstellungen“ ausgeschaltet ist.',
  'help.guide.invite-links.tip.2':
    'Für eine einzelne Person ist ein Link mit einer Nutzung und kurzer Gültigkeit die sicherste Wahl.',
  // delete-user
  'help.guide.delete-user.title': 'Benutzer löschen',
  'help.guide.delete-user.goal': 'Ein Konto mit allem, was dazugehört, entfernen.',
  'help.guide.delete-user.step.1':
    'Klick in der Zeile des Benutzers auf den Papierkorb („Benutzer löschen“) und bestätige mit „Löschen“.',
  'help.guide.delete-user.result':
    'Das Konto ist gelöscht, und mit ihm jede Reise und Journey, die ihm gehört, auch Reisen, die es mit anderen geteilt hat. Reisen, in denen es nur Mitglied war, bleiben bei ihren Besitzern.',
  'help.guide.delete-user.tip.1':
    'Das lässt sich nicht rückgängig machen. Erstelle vorher ein Backup, wenn du unsicher bist.',
  'help.guide.delete-user.tip.2':
    'In deiner eigenen Zeile funktioniert der Papierkorb nicht: Du kannst dich nicht selbst löschen. Das muss ein anderer Admin übernehmen.',
  // permissions
  'help.guide.permissions.title': 'Festlegen, wer was darf',
  'help.guide.permissions.goal': 'Leg für jede Aktion fest, welche Rolle sie in dieser TREK-Instanz ausführen darf.',
  'help.guide.permissions.step.1':
    'Such unter „Berechtigungseinstellungen“ die Aktion in ihrer Gruppe, etwa „Reisen löschen“ unter „Reiseverwaltung“, und wähl aus, wer sie ausführen darf: „Alle“, „Reise-Mitglieder“, „Reise-Eigentümer“ oder „Nur Administrator“. Eine geänderte Zeile wird als „angepasst“ markiert.',
  'help.guide.permissions.step.2':
    'Klick oben rechts in der Karte auf „Speichern“. „Auf Standard zurücksetzen“ setzt jede Zeile auf ihre Standardstufe zurück; klick auch danach auf „Speichern“.',
  'help.guide.permissions.result':
    'Die Regel gilt sofort für alle Reisen. Wer unter der Stufe liegt, sieht die zugehörigen Buttons und Menüs nicht mehr.',
  'help.guide.permissions.tip.1':
    '„Reise-Eigentümer“ ist die Person, die die Reise erstellt hat; Admins dürfen immer alles.',
  'help.guide.permissions.tip.2':
    'Jede Aktion hat eine eigene Zeile. So kannst du zum Beispiel Mitglieder Orte und Tage planen lassen, das Löschen der Reise aber dem Eigentümer vorbehalten.',
  // default-map
  'help.guide.default-map.title': 'Kartenstandards für neue Benutzer festlegen',
  'help.guide.default-map.goal':
    'Jedem neuen Konto eine funktionierende Karte geben, ohne dass es ein eigenes Token braucht.',
  'help.guide.default-map.step.1':
    'Wähle unter „Karte“ eine „Karten-Vorlage“ oder füge eine Kachel-URL ein, und trag unter „Gemeinsamer CARTO-Key“ einen Schlüssel ein, wenn du CARTO-Kacheln nutzt. Die Vorschau darunter zeigt das Ergebnis.',
  'help.guide.default-map.step.2':
    'Wähl weiter unten den „Kartendienst“: „Standard (kostenlos)“, „Mapbox (3D)“ oder „MapLibre (OpenFreeMap)“. Wähl bei Mapbox und MapLibre den „Kartenstil“; trag bei Mapbox das „Gemeinsame Mapbox-Token“ ein und entscheide dich für oder gegen „3D-Gebäude & Gelände“ und den „Hochqualitätsmodus“.',
  'help.guide.default-map.result':
    'Neue Konten starten mit diesen Einstellungen; wer unter „Einstellungen“ eine eigene Karte festgelegt hat, behält sie.',
  'help.guide.default-map.tip.1':
    'Ein hier eingetragenes Token oder ein Schlüssel wird von allen genutzt, die keinen eigenen haben, also behalte das Kontingent im Blick.',
  'help.guide.default-map.tip.2':
    'Bestehende Konten, die im Karten-Tab nie etwas geändert haben, nutzen diese Standards ebenfalls.',
  // packing-templates
  'help.guide.packing-templates.title': 'Packvorlage erstellen',
  'help.guide.packing-templates.goal': 'Gib Reisen eine Packliste als Ausgangspunkt statt einer leeren.',
  'help.guide.packing-templates.step.1': 'Klick auf „Neue Vorlage“, gib einen Namen ein und bestätige mit dem Häkchen.',
  'help.guide.packing-templates.step.2':
    'Klick auf den Namen der Vorlage, um sie zu öffnen, und dann auf „Kategorie hinzufügen“. Mit dem + im Kopf einer Kategorie fügst du Einträge hinzu; ein Eintrag braucht nur einen Namen.',
  'help.guide.packing-templates.step.3':
    'Alles wird direkt gespeichert. Mit dem Stift benennst du eine Vorlage, eine Kategorie oder einen Eintrag um. Der Papierkorb entfernt einen Eintrag sofort; bei einer Vorlage oder Kategorie fragt er vorher nach, weil alles darin mitgelöscht wird.',
  'help.guide.packing-templates.result':
    'Die Vorlage steht auf der Packliste jeder Reise zur Auswahl. Beim Anwenden werden die Einträge kopiert, jede Reise kann sie also frei ändern.',
  'help.guide.packing-templates.tip.1':
    'Eine Vorlage pro Reiseart (Strand, Stadt, Wandern) funktioniert besser als eine sehr lange Liste.',
  'help.guide.packing-templates.tip.2':
    'Das Löschen einer Vorlage ändert nichts an Reisen, in denen sie schon angewendet wurde.',
  'help.guide.packing-templates.tip.3':
    '„Als Vorlage speichern“ auf der Packliste einer Reise erstellt eine Vorlage mit Gewicht, Menge und Tasche jedes Eintrags. Diese Angaben stehen hier neben dem Eintrag und verteilen die Einträge genauso auf die Taschen, wenn du die Vorlage anwendest.',
  // categories
  'help.guide.categories.title': 'Kategorien verwalten',
  'help.guide.categories.goal': 'Leg fest, welche Kategorien Orte und Sammlungen haben können und wie sie aussehen.',
  'help.guide.categories.step.1':
    'Klick auf „Neue Kategorie“, tipp den Namen in die Titelzeile des Dialogs, wähl ein „Symbol“ und eine „Farbe“ und sieh dir die „Vorschau“ an. Klick auf „Erstellen“.',
  'help.guide.categories.step.2':
    'In der Liste öffnet der Stift („Bearbeiten“) eine Kategorie, „Aktualisieren“ speichert sie. Der Papierkorb („Löschen“) entfernt sie nach einer Bestätigung.',
  'help.guide.categories.result':
    'Die Kategorien gelten sofort überall: im Orts-Inspektor, bei den Stecknadeln auf der Karte, in den Sammlungen und in den Filtern.',
  'help.guide.categories.tip.1':
    'Orte behalten die ID ihrer Kategorie. Benennst du eine Kategorie um, ändert sich ihr Name also bei jedem Ort.',
  'help.guide.categories.tip.2':
    'Löschst du eine Kategorie, haben ihre Orte keine Kategorie mehr. Ist dir das wichtig, ordne sie vorher einer anderen Kategorie zu.',
  // school-holiday-catalog
  'help.guide.school-holiday-catalog.title': 'Schulferien von Hand pflegen',
  'help.guide.school-holiday-catalog.goal':
    'Die Schulferien eines Landes oder einer Region pflegen, damit alle sie in Vacay auswählen können.',
  'help.guide.school-holiday-catalog.step.1':
    'Wähl unter „Schulferien“ das Land, oder klick auf + („Land hinzufügen“), gib Land und „Ländercode (z. B. US)“ ein und klick auf „Speichern“. Mit „Region hinzufügen“ legst du jeden Landesteil an, der eigene Ferientermine hat.',
  'help.guide.school-holiday-catalog.step.2':
    'Klick auf eine Region, um „Region oder Schulbezirk“ zu öffnen. Klick dort auf „Ferienzeitraum hinzufügen“, trag für jeden Zeitraum „Name der Ferien“, „Startdatum“ und „Enddatum“ ein und speichere. Der Papierkorb entfernt einen Zeitraum oder eine Region; ein Land kannst du löschen, sobald es keine Regionen mehr hat.',
  'help.guide.school-holiday-catalog.result':
    'Benutzer finden Land und Region in Vacay unter „Einstellungen“ und sehen die Zeiträume in ihrer Jahresübersicht.',
  'help.guide.school-holiday-catalog.tip.1':
    'Eine Region, die jemand schon in seinem Vacay-Kalender gewählt hat, lässt sich nicht löschen.',
  // auth-methods
  'help.guide.auth-methods.title': 'Anmeldemethoden festlegen',
  'help.guide.auth-methods.goal':
    'Schalte Anmeldung per Passwort, SSO und Registrierung ein oder aus und mach 2FA zur Pflicht.',
  'help.guide.auth-methods.step.1':
    'Schalte unter „Authentifizierungsmethoden“ die „Passwort-Anmeldung“ und die „Passwort-Registrierung“ ein oder aus; jeder Schalter wirkt sofort. Ist die Registrierung aus, entstehen neue Konten nur noch über Einladungslinks, SSO oder „Benutzer anlegen“.',
  'help.guide.auth-methods.step.2':
    '„SSO Login“ und „SSO Auto-Provisioning“ setzen voraus, dass unten Single Sign-On (OIDC) eingerichtet ist. Auto-Provisioning legt ein Konto an, wenn sich jemand zum ersten Mal per SSO anmeldet.',
  'help.guide.auth-methods.step.3':
    'Schalt „Zwei-Faktor-Authentifizierung (2FA) für alle verlangen“ ein. Dann muss jeder ohne 2FA sie erst in den Einstellungen einrichten, bevor er TREK nutzen kann.',
  'help.guide.auth-methods.result': 'Die Anmeldeseite bietet genau die Methoden an, die du aktiviert gelassen hast.',
  'help.guide.auth-methods.tip.1':
    'TREK lässt dich die letzte Anmeldemöglichkeit nicht ausschalten: Ihr Schalter wird grau, und der Tooltip zeigt „Mindestens eine Anmeldemethode muss aktiviert bleiben“.',
  'help.guide.auth-methods.tip.2':
    'Ist auf dem Server OIDC_ONLY gesetzt, sind die Passwort-Schalter gesperrt, und ein Hinweis weist darauf hin.',
  // oidc
  'help.guide.oidc.title': 'Single Sign-On einrichten',
  'help.guide.oidc.goal': 'Anmeldung über deinen Identitätsanbieter ermöglichen.',
  'help.guide.oidc.step.1':
    'Gib unter „Single Sign-On (OIDC)“ den „Anzeigename“ für den Button sowie „Issuer-URL“, „Client-ID“ und „Client-Secret“ deines Anbieters ein. Fülle „Discovery-URL (optional)“ nur aus, wenn dein Anbieter sie nicht unter der üblichen Adresse veröffentlicht, wie etwa Authentik. Klicke auf Speichern.',
  'help.guide.oidc.step.2': 'Schalte unter „Authentication Methods“ die Option „SSO Login“ ein.',
  'help.guide.oidc.result':
    'Auf der Anmeldeseite erscheint der SSO-Button. Ist „SSO Auto-Provisioning“ eingeschaltet, bekommen neue Nutzer bei der ersten Anmeldung automatisch ein Konto.',
  'help.guide.oidc.tip.1':
    'Die Redirect-URI für deinen Anbieter ist die Adresse deiner TREK-Instanz plus der OIDC-Callback-Pfad aus der Doku.',
  'help.guide.oidc.tip.2':
    'Das Claim-Mapping legt fest, welche SSO-Gruppen Admins werden. Mehr dazu auf der OIDC-Seite in der Doku.',
  // instance-keys
  'help.guide.instance-keys.title': 'API-Schlüssel eintragen',
  'help.guide.instance-keys.goal':
    'Google-Fotos und -Bewertungen, Unsplash-Cover und die Amap-Suche für die ganze Instanz hinzufügen.',
  'help.guide.instance-keys.step.1':
    'Unter „API-Schlüssel“ steht ganz oben die TREK Places API, die die Ortssuche schon ohne jeden Schlüssel beantwortet. „Was drin ist“ zeigt, was sie abdeckt und was nicht.',
  'help.guide.instance-keys.step.2':
    'Für Fotos, Bewertungen und Öffnungszeiten fügst du einen „Google Maps API-Schlüssel“ ein und klickst auf „Test“; das Ergebnis lautet „Verbunden“ oder „Ungültig“. Öffne „Wofür der Schlüssel genutzt wird“ und schalte nur ein, was dir berechnet werden darf: „Ortsfotos“, „Orts-Autovervollständigung“, „Ortsdetails“, „Ortsanreicherung“ und „Nur mit Google suchen“, dazu ein „Tageslimit für Google-Aufrufe“.',
  'help.guide.instance-keys.step.3':
    'Füge den Unsplash-API-Schlüssel für die Cover-Suche und den Amap (高德地图) API-Key für die Ortssuche in Festlandchina ein und klicke dann unten in der Karte auf Speichern.',
  'help.guide.instance-keys.result':
    'Benutzer können die Funktionen nutzen, ohne eigene Schlüssel zu hinterlegen. Ohne Google-Schlüssel läuft die Suche über die TREK Places API und OpenStreetMap.',
  'help.guide.instance-keys.tip.1':
    'Hat ein Benutzer unter „Einstellungen“ einen eigenen Schlüssel hinterlegt, verwendet TREK für ihn diesen statt des Instanzschlüssels.',
  'help.guide.instance-keys.tip.2':
    'Schlüssel können auch aus Umgebungsvariablen stammen; diese erscheinen hier schreibgeschützt.',
  'help.guide.instance-keys.tip.3':
    '„Tageslimit für Google-Aufrufe“ begrenzt, wie viel TREK pro Tag über den Schlüssel ausgeben darf; das Badge neben dem Titel zählt die heutigen Aufrufe. Ist das Limit erreicht, laufen Suchen bis zum nächsten Tag (UTC) über OpenStreetMap.',
  // places-transit
  'help.guide.places-transit.title': 'Such- und ÖPNV-Anbieter wählen',
  'help.guide.places-transit.goal': 'Leg fest, welcher Dienst Ortssuchen und ÖPNV-Routenanfragen beantwortet.',
  'help.guide.places-transit.step.1':
    'Wähl unter „Verkehrsanbieter“ entweder „Transitous (kostenlos)“, das ohne Schlüssel auskommt und in Europa die beste Abdeckung hat, oder Google, das den Google-Schlüssel nutzt. Die Auswahl wird sofort gespeichert.',
  'help.guide.places-transit.step.2':
    'Wähle unter „Anbieter für die Ortssuche“, wer gefragt wird, wenn der TREK-Index und OpenStreetMap nichts finden: „Automatisch“ (Google, wenn ein Schlüssel hinterlegt ist, danach Amap), „Google Places“, „Amap (高德地图)“ oder „OpenStreetMap“.',
  'help.guide.places-transit.result': 'Alle Suchfelder und ÖPNV-Routen in TREK nutzen diese Auswahl.',
  'help.guide.places-transit.tip.1':
    'Fehlt für eine Auswahl der Schlüssel, erscheint hier eine Warnung: Die Ortssuche nutzt dann weiter den TREK-Index und OpenStreetMap, der ÖPNV weiter Transitous.',
  'help.guide.places-transit.tip.2': 'ÖPNV-Routen von Google werden pro Anfrage abgerechnet, Transitous nicht.',
  // file-types
  'help.guide.file-types.title': 'Dateitypen einschränken',
  'help.guide.file-types.goal': 'Festlegen, welche Dateiendungen beim Hochladen erlaubt sind.',
  'help.guide.file-types.step.1':
    'Bearbeite unter „Erlaubte Dateitypen“ die kommagetrennte Liste der Dateiendungen oder gib * ein, um alle Typen zu erlauben, und klick auf „Speichern“.',
  'help.guide.file-types.result':
    'Uploads aller anderen Dateitypen werden mit einer klaren Meldung abgelehnt, bei Dokumenten, im Tagebuch und bei Covern.',
  'help.guide.file-types.tip.1':
    'Lass die Bildformate in der Liste: Titelbilder und Journey-Fotos werden gegen dieselbe Liste geprüft.',
  // toggle-addon
  'help.guide.toggle-addon.title': 'Addon ein- oder ausschalten',
  'help.guide.toggle-addon.goal': 'Stell ein Funktionsmodul für alle bereit oder entferne es.',
  'help.guide.toggle-addon.step.1':
    'Klick auf den Schalter in der Kachel des Addons. Der Menüpunkt erscheint oder verschwindet sofort für alle.',
  'help.guide.toggle-addon.step.2':
    'Manche Kacheln haben Unterzeilen für ihre Optionen, etwa „Gepäck-Tracking“ unter „Listen“ oder die Fotoanbieter unter „Journey“. Sie erscheinen nur, solange das Addon aktiv ist.',
  'help.guide.toggle-addon.result':
    'Schaltest du ein Addon aus, bleiben seine Daten erhalten. Schaltest du es wieder ein, sind die Daten wieder da.',
  'help.guide.toggle-addon.tip.1':
    'Schaltest du MCP aus, verschwinden der Endpunkt und die davon abhängigen Bereiche unter „Integrationen“.',
  'help.guide.toggle-addon.tip.2':
    'Vacay, Atlas und Journey sind die meistgefragten Addons. „Dokumente“ braucht Speicherplatz für Uploads.',
  // install-plugin
  'help.guide.install-plugin.title': 'Plugin installieren',
  'help.guide.install-plugin.goal':
    'Füg ein Plugin eines Drittanbieters hinzu und gib ihm genau die Berechtigungen, die es anfordert.',
  'help.guide.install-plugin.step.1':
    'Öffne „Entdecken“, such ein Plugin über „Plugins durchsuchen…“ oder den Filter „Typ“ und klick auf „Installieren“. Für eine Paketdatei klick auf „Plugin hochladen“ (das Wolken-Symbol oben rechts in der Karte) oder zieh die .zip-Datei auf die Seite.',
  'help.guide.install-plugin.step.2':
    'Sieh dir unter „Installiert“ die Zeile an: worauf das Plugin zugreifen darf, mit welchen Hosts es sich verbindet und ob es „Geprüft“ und „Signiert“ ist. Schalte dann „Plugin aktivieren“ ein; die Zeile zeigt „Aktiv“.',
  'help.guide.install-plugin.step.3':
    'Im ⋯-Menü der Zeile findest du „Neu starten“, „Fehlerprotokoll ansehen“, „Erlaubte Hosts“ und „Version wechseln…“ sowie die Links zum Quellcode; „Löschen“ deinstalliert das Plugin samt seinen Daten. Eine neuere Version wird in der Zeile als Update angezeigt, und eine, die neue Rechte verlangt, bleibt deaktiviert, bis du sie genehmigst.',
  'help.guide.install-plugin.result':
    'Das Plugin läuft in einem eigenen Prozess. Alles, was es hinzufügt, etwa Widgets, Kartenebenen oder Tools, erscheint dort, wo das Plugin es vorsieht.',
  'help.guide.install-plugin.tip.1':
    '„Neu scannen“ findet auch einen Plugin-Ordner, der für die Entwicklung ohne Paket verlinkt ist.',
  'help.guide.install-plugin.tip.2':
    'Ein nicht signiertes Plugin ist entsprechend gekennzeichnet. Installiere es nur, wenn du seiner Quelle vertraust.',
  // storage-backends
  'help.guide.storage-backends.title': 'Uploads zu S3 verschieben oder spiegeln',
  'help.guide.storage-backends.goal':
    'Dateien in einem Objektspeicher ablegen oder jeden Upload auf ein zweites Backend kopieren.',
  'help.guide.storage-backends.step.1':
    'Klick unter „Backends“ auf „Backend hinzufügen“, gib ihm einen Namen, wähl den Typ („Lokal“ oder S3) und füll die zugehörigen Felder aus. Soll zusätzlich woanders eine Kopie liegen, hak die „Spiegelziele“ an. Klick auf „Übernehmen“ und dann in der neuen Zeile auf „Test“, um die Verbindung zu prüfen.',
  'help.guide.storage-backends.step.2':
    'Ordne unter „Kategorien“ jeder Upload-Art, etwa „Reisedokumente“, „Journey-Fotos“ oder „Backups“, ein Backend zu.',
  'help.guide.storage-backends.step.3':
    'Klick unten auf „Änderungen speichern“. Zeigt eine Kategorie jetzt auf ein anderes Ziel, fragt TREK, ob es „Vorhandene Objekte verschieben“ oder „Nur neue Schreibvorgänge umleiten“ soll.',
  'help.guide.storage-backends.result':
    'Neue Uploads landen im zugewiesenen Backend. Verschobene Dateien werden von dort ausgeliefert, und was du nicht verschieben wolltest, bleibt, wo es war.',
  'help.guide.storage-backends.tip.1':
    'Ein über Umgebungsvariablen konfiguriertes Backend wird angezeigt, lässt sich hier aber nicht bearbeiten.',
  'help.guide.storage-backends.tip.2':
    'Ein Spiegelziel bekommt eine Kopie von allem, was neu geschrieben wird; „Jetzt abgleichen“ in der Zeile kopiert, was schon vorher gespeichert war. Ein langsames Ziel bremst jeden Upload auf diesem Backend.',
  // channels-instance
  'help.guide.channels-instance.title': 'Benachrichtigungskanäle einrichten',
  'help.guide.channels-instance.goal': 'Leg fest, welche Kanäle Benutzer wählen dürfen, und richte E-Mail ein.',
  'help.guide.channels-instance.step.1':
    'Schalte „E-Mail (SMTP)“ im Kopf der Karte ein, gib „SMTP-Host“, „SMTP-Port“, „SMTP-Benutzer“, „SMTP-Passwort“ und die „Absenderadresse“ ein und klick auf „Speichern“. „Test-E-Mail senden“ schickt dir eine Testmail. „TLS-Zertifikatsprüfung überspringen“ ist nur für einen lokalen Mailserver mit eigenem Zertifikat gedacht.',
  'help.guide.channels-instance.step.2':
    'Schalte Webhook, Ntfy und Web Push ein, um sie anzubieten. Benutzer tragen dann in den Einstellungen unter „Benachrichtigungen“ ihre eigene URL oder ihr Thema ein oder schalten Push pro Gerät ein.',
  'help.guide.channels-instance.step.3':
    '„Reiseerinnerungen“ schaltet die Erinnerung vor Reisebeginn ein oder aus; „In-App“ ist immer an.',
  'help.guide.channels-instance.result':
    'Im Tab „Benachrichtigungen“ sehen alle Benutzer die Kanäle, die du eingeschaltet hast.',
  'help.guide.channels-instance.tip.1':
    'Die „Ntfy-Server-URL“ in der Karte „Admin-Ntfy“ ist zugleich der Standardserver für neue Benutzer; sie können aber weiterhin einen eigenen eintragen.',
  'help.guide.channels-instance.tip.2':
    'Plugin-Kanäle erscheinen automatisch, sobald ein Plugin mit dieser Fähigkeit aktiv ist.',
  // admin-channels
  'help.guide.admin-channels.title': 'Admin-Ereignisse aufs Handy bekommen',
  'help.guide.admin-channels.goal':
    'Über neue Versionen, ausfallende Speicher-Spiegel und Anfragen nach Paddel-Regionen informiert werden.',
  'help.guide.admin-channels.step.1':
    'Gib unter „Admin-Ntfy“ das Admin-Thema und bei Bedarf die Ntfy-Server-URL und ein Zugriffstoken (optional) ein, unter „Admin-Webhook“ eine URL. Klicke in jeder Karte auf Speichern.',
  'help.guide.admin-channels.step.2':
    'Klick auf „Test-Ntfy senden“ oder „Test-Webhook senden“, um zu sehen, ob eine Nachricht ankommt.',
  'help.guide.admin-channels.result':
    'Admin-Ereignisse erreichen jeden Admin in der App und, sofern du sie eingeschaltet hast, auch das Admin-ntfy-Thema und den Webhook.',
  'help.guide.admin-channels.tip.1':
    'Halte das Admin-Topic von deinem persönlichen getrennt, damit Ausfallmeldungen nicht zwischen Reisenachrichten untergehen.',
  'help.guide.admin-channels.tip.2':
    'Der Admin-Webhook und das Admin-Thema sind unabhängig von deinen eigenen Kanälen in den Einstellungen unter „Benachrichtigungen“.',
  // mcp-tokens-admin
  'help.guide.mcp-tokens-admin.title': 'KI-Zugriff widerrufen',
  'help.guide.mcp-tokens-admin.goal':
    'Sieh alle Tokens und Sitzungen, die KI-Clients für beliebige Benutzer haben, und widerrufe sie.',
  'help.guide.mcp-tokens-admin.step.1':
    'Such unter „OAuth-Sitzungen“ den Client nach Name und Besitzer; seine Chips zeigen die Scopes, die ihm gewährt wurden. Mit dem Papierkorb widerrufst du die Sitzung nach einer Bestätigung.',
  'help.guide.mcp-tokens-admin.step.2':
    'Unter „API-Tokens“ dasselbe für Tokens: Name, Besitzer, „Erstellt“ und „Zuletzt verwendet“. Das Papierkorb-Icon löscht das Token, und der Client verliert sofort den Zugriff.',
  'help.guide.mcp-tokens-admin.result': 'Der Benutzer des Clients muss ihn neu verbinden. Sonst ändert sich nichts.',
  'help.guide.mcp-tokens-admin.tip.1':
    'Die Berechtigungen zeigen dir, was ein Client tun könnte; eine reine Leseberechtigung kannst du bedenkenlos behalten.',
  'help.guide.mcp-tokens-admin.tip.2':
    'Schaltest du das Add-on MCP aus, werden alle Clients sofort gestoppt und dieser Tab ausgeblendet, gelöscht wird aber nichts: Sobald es wieder an ist, funktionieren die Tokens wieder.',
  // release-history
  'help.guide.release-history.title': 'Nach neuem Release suchen',
  'help.guide.release-history.goal': 'Wissen, ob dein TREK aktuell ist und was die nächste Version bringt.',
  'help.guide.release-history.step.1':
    'Gibt es eine neuere Version, erscheint unter der Kopfzeile „Update verfügbar“ zusammen mit der Version, die bei dir läuft. „Auf GitHub ansehen“ öffnet das Release, und „Update-Anleitung“ zeigt die Befehle für Docker oder die Anleitung für andere Installationen.',
  'help.guide.release-history.step.2':
    '„Update-Verlauf“ listet jedes Release mit seinen Release Notes auf. „Details anzeigen“ klappt sie auf, das neueste Release trägt das Label „Aktuell“, und „Mehr laden“ zeigt ältere Releases.',
  'help.guide.release-history.result':
    'Aktualisiert wird auf dem Host, indem du das neue Image ziehst oder den neuen Tag baust. Das Datenverzeichnis bleibt erhalten.',
  'help.guide.release-history.tip.1': 'Mach vor jedem Update ein Backup. Der Tab „Backup“ liegt gleich daneben.',
  'help.guide.release-history.tip.2':
    'Vorabversionen werden angezeigt, aber nicht als Update angekündigt, es sei denn, du nutzt selbst eine Vorabversion.',
  // create-backup
  'help.guide.create-backup.title': 'Backup erstellen und wiederherstellen',
  'help.guide.create-backup.goal':
    'Die ganze Instanz sichern, eine Kopie an einem anderen Ort aufbewahren und sie bei Bedarf wiederherstellen können.',
  'help.guide.create-backup.step.1':
    'Klick unter „Datensicherung“ oben rechts auf „Backup erstellen“. Dabei werden die Datenbank und die Uploads in eine Datei auf dem Server gepackt.',
  'help.guide.create-backup.step.2':
    'Mit „Herunterladen“ sicherst du eine Kopie außerhalb des Servers; der Mülleimer löscht alte Backups, nachdem du bestätigt hast.',
  'help.guide.create-backup.step.3':
    '„Wiederherstellen“ bei einem Backup oder „Backup hochladen“ mit einer Datei ersetzt alle aktuellen Daten, sobald du im Dialog „Backup wiederherstellen?“ auf „Ja, wiederherstellen“ klickst.',
  'help.guide.create-backup.result':
    'Beim Wiederherstellen kommen Benutzer, Reisen, Dateien und Einstellungen genau so zurück, wie sie in diesem Backup waren.',
  'help.guide.create-backup.tip.1':
    'Das Wiederherstellen ist hier die einzige Aktion, die sich nicht rückgängig machen lässt. Erstelle vorher ein frisches Backup.',
  'help.guide.create-backup.tip.2':
    'Backups werden im Datenverzeichnis gespeichert. Kopiere sie auf einen anderen Rechner, damit sie sicher sind, falls dieser hier ausfällt.',
  // auto-backup
  'help.guide.auto-backup.title': 'Backups planen',
  'help.guide.auto-backup.goal': 'Den Server automatisch sichern und alte Backups aufräumen lassen.',
  'help.guide.auto-backup.step.1':
    'Schalte unter „Auto-Backup“ die Option „Auto-Backup aktivieren“ ein und wähle das „Intervall“ (Stündlich, Täglich, Wöchentlich oder Monatlich), die Uhrzeit unter „Ausführung um“ und bei wöchentlich oder monatlich den „Wochentag“ bzw. den „Tag des Monats“.',
  'help.guide.auto-backup.step.2':
    'Wähl unter „Alte Backups löschen nach“, wie lange ein Backup aufbewahrt wird, von „1 Tag“ bis „Immer behalten“, und klick auf „Speichern“.',
  'help.guide.auto-backup.result':
    'Backups erscheinen nach Zeitplan in der Liste, und ältere werden gelöscht, sobald sie das gewählte Alter überschreiten.',
  'help.guide.auto-backup.tip.1':
    '„Ausführung um“ bezieht sich auf die Serverzeit; der Hinweis dazu nennt die Zeitzone des Servers.',
  'help.guide.auto-backup.tip.2':
    'Der Speicherplatz auf dem Server ist begrenzt: 7 oder 14 Tage reichen meist, wenn du zusätzlich eine heruntergeladene Kopie woanders aufbewahrst.',
  // audit-log
  'help.guide.audit-log.title': 'Audit-Protokoll lesen',
  'help.guide.audit-log.goal': 'Finde heraus, wer wann was getan hat.',
  'help.guide.audit-log.step.1':
    'Lies die Zeilen, die neueste steht oben: Zeit, Benutzer, Aktion, Ressource, IP und Details. Die Aktionen sind nach dem benannt, was passiert ist, etwa ein fehlgeschlagener Login, eine MFA-Änderung oder eine Wiederherstellung.',
  'help.guide.audit-log.step.2':
    '„Aktualisieren“ oben rechts lädt neu. Das Badge neben dem Titel zeigt, wie viele Einträge von der Gesamtzahl geladen sind, und „Mehr laden“ holt ältere Einträge.',
  'help.guide.audit-log.result':
    'Du hast einen Nachweis, den du jedem zeigen kannst, der wissen will, warum sich etwas geändert hat.',
  'help.guide.audit-log.tip.1': 'Zeiten werden in der Zeitzone des Servers angezeigt.',
  'help.guide.audit-log.tip.2':
    'Das Protokoll wird nur ergänzt; in der App lässt sich hier nichts bearbeiten oder löschen.',
  // document-providers
  'help.guide.document-providers.title': 'Dokumentenspeicher anbieten',
  'help.guide.document-providers.goal': 'Leg fest, mit welchen Speichern eine Reise ihre Dokumente abgleichen kann.',
  'help.guide.document-providers.step.1':
    'In der Kachel „Dokumente“ stehen die Speicherdienste als Zeilen: Paperless-ngx, Papra, Nextcloud, OpenCloud und Synology Drive. Anfangs sind alle fünf ausgeschaltet, und die Zeilen erscheinen nur, solange „Dokumente“ selbst aktiv ist.',
  'help.guide.document-providers.step.2':
    'Schalte in der Zeile „Nextcloud“ den Schalter ein. Die Meldung „Addon aktualisiert“ erscheint, und ab jetzt finden Reise-Eigentümer im Tab „Dateien“ ihrer Reisen den „Dokumentenabgleich“, mit Nextcloud unter „Anbieter verbinden“.',
  'help.guide.document-providers.result':
    'Der Speicherdienst steht in jeder Reise dieses TREK zur Verfügung. Verbunden ist aber nichts, bis ein Reise-Eigentümer die Verbindung herstellt.',
  'help.guide.document-providers.tip.1':
    'Hier wird nur entschieden, ob ein Speicherdienst angeboten werden darf. Adresse und Zugangsdaten gehören zu einer Reise und werden vom Reise-Eigentümer im Tab „Dateien“ der Reise eingetragen, nie im Admin-Bereich.',
  'help.guide.document-providers.tip.2':
    'Schaltest du „Dokumente“ aus, werden auch alle Speicher ausgeschaltet. Solange „Dokumente“ aus ist, lässt sich kein Speicher einschalten: Der Server antwortet dann mit Enable the Documents addon first. Ein Speicher in deinem eigenen Netzwerk braucht außerdem ALLOW_INTERNAL_NETWORK=true auf dem Server.',

  // ── Screen: trip ──────────────────────────────────────────────────────────────────────
  'help.ctx.trip.title': 'Reise',
  'help.ctx.trip.summary':
    'Eine Reise mit allem, was dazugehört: der Plan mit Tagen, Karte und Orten sowie die Tabs für Touren, Transporte, Buchungen, Listen, Kosten, Dateien, Zusammenarbeit und ein verknüpftes Tagebuch. Zu jedem davon gibt es unter diesem einen eigenen Hilfebildschirm.',
  'help.ctx.trip.bullet.1':
    'Die Tab-Leiste unter der oberen Leiste: Planung, Touren, Transporte, Buchungen, Listen, Kosten, Dateien, Collab und, sobald ein Tagebuch verknüpft ist, Tagebuch. Welche Tabs es auf deinem TREK gibt, hängt von den Add-ons und Plugins ab.',
  'help.ctx.trip.bullet.2':
    '„Planung“ hat drei Spalten: links die Tage, in der Mitte die Karte, rechts die Orte. Mit dem Add-on Roadtrip beginnt die Tagesspalte mit einem Umschalter zwischen „Tage“ und „Roadtrip“, mit dem Add-on Touren beginnt die Ortsspalte mit „Orte“ und „Touren“. Buchungen und Transporte stehen direkt im Plan, am jeweiligen Halt und zwischen den Halten; die Tabs listen sie auf.',
  'help.ctx.trip.bullet.3':
    '„Reiseeinstellungen“, der Button neben dem Reisenamen oben links, öffnet die Einstellungen der Reise: „Personen“ (Mitglieder und Gäste), „Wird geteilt“ (der schreibgeschützte öffentliche Link und der Einladungslink) und „Tagebuch“.',
  'help.ctx.trip.bullet.4':
    'Titel, Daten, Titelbild und Währung bearbeitest du unter „Meine Reisen“ mit dem Stift auf der Reisekarte. Ein Klick auf den Namen der Reise oben links bringt dich dorthin zurück.',
  'help.ctx.trip.bullet.5':
    'Mit dem Tab am inneren Rand einer Spalte klappst du sie weg, und die Karte nutzt den frei gewordenen Platz. Eine eingeklappte Spalte hinterlässt oben in der Ecke der Karte eine kleine Kachel, mit der du sie zurückholst. Mit dem schmalen Trenner neben einer Spalte änderst du ihre Breite.',
  'help.ctx.trip.bullet.6':
    'Der Rückgängig-Pfeil in der Werkzeugleiste der Tage macht deine letzten Änderungen am Plan Schritt für Schritt rückgängig.',
  // add-member
  'help.guide.add-member.title': 'Mitglied hinzufügen',
  'help.guide.add-member.goal': 'Gib jemandem mit TREK-Konto Zugriff auf diese Reise.',
  'help.guide.add-member.step.1':
    'Klick oben links neben dem Namen der Reise auf „Reiseeinstellungen“. Der Dialog öffnet sich bei „Personen“.',
  'help.guide.add-member.step.2':
    'Wähle unter „Benutzer einladen“ die Person in „Benutzer auswählen…“ aus und klicke auf Einladen.',
  'help.guide.add-member.step.3':
    'Die Person steht jetzt unter „Zugriff“. Das Badge „Besitzer“ kennzeichnet den Besitzer. Mit „Zugriff entfernen“ am Ende einer Zeile nimmst du der Person nach einer Rückfrage den Zugriff wieder.',
  'help.guide.add-member.result':
    'Das Mitglied kann die Reise wie du sehen und bearbeiten, im Rahmen der Stufen, die die Administration unter „Berechtigungseinstellungen“ festgelegt hat.',
  'help.guide.add-member.tip.1':
    'Fehlt jemand in der Liste, hat die Person noch kein TREK-Konto: Füg sie als Gast hinzu oder lass sie sich über einen Einladungslink registrieren.',
  'help.guide.add-member.tip.2':
    'Die Zahl neben „Zugriff“ zählt die Personen in der Reise; Gäste stehen separat darunter.',
  // trip-invite-link
  'help.guide.trip-invite-link.title': 'Per Link einladen',
  'help.guide.trip-invite-link.goal': 'Andere selbst der Reise beitreten lassen.',
  'help.guide.trip-invite-link.step.1':
    'Klick neben dem Namen der Reise auf „Reiseeinstellungen“ und wähl links „Wird geteilt“. Klick unter „Trip-Einladungslink“ auf „Einladungslink erstellen“.',
  'help.guide.trip-invite-link.step.2':
    'Klick auf „Kopieren“ und verschick den Link. Wer ein TREK-Konto hat und den Link öffnet, tritt als Mitglied bei.',
  'help.guide.trip-invite-link.step.3':
    '„Neu erzeugen“ ersetzt den Link, der alte funktioniert dann nicht mehr. „Deaktivieren“ schaltet ihn ab.',
  'help.guide.trip-invite-link.result': 'Wer den Link öffnet, tritt der Reise bei und steht dann unter „Zugriff“.',
  'help.guide.trip-invite-link.tip.1':
    'Ohne Konto lässt sich der Link nicht nutzen. Ein Admin erstellt unter „Admin“, „Benutzer“ Registrierungslinks und kann einen davon mit dieser Reise verknüpfen.',
  'help.guide.trip-invite-link.tip.2':
    'Hast du den Link in den falschen Chat geschickt, erzeuge ihn neu: Der alte Link funktioniert dann sofort nicht mehr.',
  // add-guest
  'help.guide.add-guest.title': 'Gast ohne Konto hinzufügen',
  'help.guide.add-guest.goal': 'Jemanden zur Reise hinzufügen, der TREK nicht nutzt.',
  'help.guide.add-guest.step.1':
    'Klick neben dem Reisenamen auf „Reiseeinstellungen“. Unter „Personen“ findest du „Gäste“ ganz unten, unter „Zugriff“.',
  'help.guide.add-guest.step.2': 'Gib den Namen bei „Name des Gasts“ ein und klick auf „Gast hinzufügen“.',
  'help.guide.add-guest.result':
    'Du kannst den Gast Kosten, Packlisten-Einträgen und Aufgaben zuweisen, anmelden kann er sich aber nicht.',
  'help.guide.add-guest.tip.1':
    '„Umbenennen“ (der Stift) ändert den Namen eines Gastes. „Zugriff entfernen“ (der Papierkorb) entfernt den Gast nach einer Bestätigung: Seine Zuweisungen werden gelöscht, und sein Anteil an jeder Ausgabe wird auf die anderen Beteiligten dieser Aufteilung verteilt.',
  'help.guide.add-guest.tip.2': 'Bekommt die Person später ein Konto, lade sie als Mitglied ein und entferne den Gast.',
  // public-link
  'help.guide.public-link.title': 'Schreibgeschützten Link veröffentlichen',
  'help.guide.public-link.goal': 'Die Reise Leuten zeigen, die sie nicht bearbeiten sollen.',
  'help.guide.public-link.step.1':
    'Klick neben dem Namen der Reise auf „Reiseeinstellungen“ und wähl links „Wird geteilt“.',
  'help.guide.public-link.step.2':
    'Schalte in der Karte „Öffentlicher Link“ ein, was der Link zeigen darf. „Karte & Plan“ ist immer an; „Buchungen“, „Packliste“, „Kosten“ und „Chat“ wählst du selbst.',
  'help.guide.public-link.step.3':
    'Unter Optionen lässt „Nur Transport und Unterkünfte“ Aktivitäten, Tagesnotizen und leere Tage weg. „Ohne Fotos“ lässt die Fotos der Orte weg.',
  'help.guide.public-link.result':
    'Wer den Link hat, sieht die ausgewählten Bereiche ohne Anmeldung und kann nichts ändern.',
  'help.guide.public-link.tip.1':
    'Der Link ist nirgends aufgeführt, aber jeder, der ihn hat, kann ihn öffnen. Behandle ihn so vertraulich wie ein Passwort.',
  'help.guide.public-link.tip.2': 'Soll die Person bearbeiten dürfen, füge sie stattdessen als Mitglied hinzu.',
  // transfer-ownership
  'help.guide.transfer-ownership.title': 'Reise übergeben oder verlassen',
  'help.guide.transfer-ownership.goal':
    'Mach jemand anderen zum Besitzer oder verlass eine Reise, die nicht dir gehört.',
  'help.guide.transfer-ownership.step.1':
    'Klicke neben dem Namen der Reise auf „Reiseeinstellungen“. Klicke unter „Zugriff“ in der Zeile eines Mitglieds auf „Zum Eigentümer machen“ (die Krone) und bestätige.',
  'help.guide.transfer-ownership.step.2':
    'Mit „Reise verlassen“ in deiner eigenen Zeile trittst du nach einer Bestätigung aus der Reise aus; als Besitzer musst du sie vorher abgeben.',
  'help.guide.transfer-ownership.result':
    'Der neue Besitzer verwaltet die Mitglieder und kann die Reise löschen. Du bleibst normales Mitglied.',
  'help.guide.transfer-ownership.tip.1':
    'Eigentümer ist die Person, die die Reise erstellt hat, bis die Eigentümerschaft übertragen wird. Nur der Eigentümer kann die Reise löschen.',
  'help.guide.transfer-ownership.tip.2':
    '„Zugriff entfernen“ in der Zeile eines anderen Mitglieds wirkt andersherum: Damit entfernt der Eigentümer dieses Mitglied aus der Reise.',
  // collapse-columns
  'help.guide.collapse-columns.title': 'Platz für die Karte schaffen',
  'help.guide.collapse-columns.goal': 'Eine Spalte einklappen oder breiter machen.',
  'help.guide.collapse-columns.step.1':
    'Klick auf die Lasche mit dem Panel-Symbol an der Innenkante der Tage-Spalte, um die Spalte einzuklappen. Die Karte nutzt dann den frei gewordenen Platz. Die Orte-Spalte hat dieselbe Lasche.',
  'help.guide.collapse-columns.step.2':
    'Eine eingeklappte Spalte hinterlässt oben in der Ecke der Karte eine kleine Kachel mit dem Panel-Icon; ihr Tooltip lautet „Planung“ oder „Orte“. Klicke darauf, um die Spalte wieder einzublenden.',
  'help.guide.collapse-columns.step.3':
    'Zieh den schmalen Trenner zwischen Spalte und Karte, um die Breite der Spalte zu ändern.',
  'help.guide.collapse-columns.result':
    'Die Breiten werden gespeichert. Beim nächsten Besuch sind die Spalten wieder ausgeklappt.',
  'help.guide.collapse-columns.tip.1': 'Du kannst beide Spalten gleichzeitig einklappen, um nur die Karte zu sehen.',
  'help.guide.collapse-columns.tip.2':
    'In einem schmalen Fenster passt nur eine Spalte: Öffnest du eine, klappt die andere zu. Auf dem Handy gibt es keine Spalten; dort wechselst du oben mit „Reise“, „Planung“ und „Orte“ zwischen den Ansichten.',
  // undo-change
  'help.guide.undo-change.title': 'Letzte Änderung rückgängig machen',
  'help.guide.undo-change.goal': 'Deine letzte Änderung am Plan rückgängig machen.',
  'help.guide.undo-change.step.1':
    'Klick auf den Rückgängig-Pfeil in der Leiste über den Tagen; sein Tooltip nennt die Änderung, die er rückgängig macht.',
  'help.guide.undo-change.result':
    'Der Plan ist wieder wie vorher, und eine kurze Meldung zeigt, was rückgängig gemacht wurde.',
  'help.guide.undo-change.tip.1':
    '„Rückgängig“ gilt für den Plan: Orte hinzufügen, zuweisen, entfernen, umsortieren, verschieben und sperren, einen Tag leeren, eine Route optimieren, Orte löschen, Kategorien ändern und Importe.',
  'help.guide.undo-change.tip.2':
    'Klick erneut, um weiter zurückzugehen: TREK merkt sich deine letzten 30 Änderungen an dieser Reise, die neueste zuerst, bis du die Reise verlässt.',
  'help.guide.clear-day.title': 'Tag leeren',
  'help.guide.clear-day.goal': 'Alle Orte auf einmal von einem Tag entfernen, zum Beispiel um den Tag neu zu planen.',
  'help.guide.clear-day.step.1': 'Klick im Plan mit der rechten Maustaste auf die Kopfzeile des Tages.',
  'help.guide.clear-day.step.2': 'Wähle „Tag leeren“ und bestätige.',
  'help.guide.clear-day.result':
    'Der Tag ist leer, und seine Orte stehen wieder als ungeplant in der Liste. Mit dem Rückgängig-Pfeil über den Tagen holst du sie zurück.',
  'help.guide.clear-day.tip.1': 'Entfernt werden nur die Orte. Notizen und Buchungen bleiben am Tag.',

  // ── Screen: trip-places ───────────────────────────────────────────────────────────────
  'help.ctx.trip-places.title': 'Orte',
  'help.ctx.trip-places.summary':
    'Die rechte Spalte der Planung: alle Orte der Reise, ob eingeplant oder nicht, mit Suche, Filtern und Sortierung, dazu die Möglichkeiten, Orte hinzuzufügen: über die Suche, von Hand oder aus einer geteilten Liste. Mit „Orte“ und „Touren“ ganz oben wechselst du zwischen den Orten und den Touren der Reise.',
  'help.ctx.trip-places.bullet.1':
    'Mit „Orte“ und „Touren“ oben in der Spalte wechselst du die Liste. Beim Öffnen ist „Orte“ ausgewählt. „Touren“ zeigt die Touren der Reise und holt mit „GPX oder KML importieren“ GPX-, KML- und KMZ-Dateien herein; Touren erscheinen nicht in der Ortsliste.',
  'help.ctx.trip-places.bullet.2':
    '„Ort/Aktivität hinzufügen“ öffnet das Formular für einen Ort, den du suchst oder eintippst. Ist ein Tag geöffnet, heißt der Button „Neuer Ort“, und „Zum Tag“ daneben legt den Ort direkt an diesem Tag an.',
  'help.ctx.trip-places.bullet.3':
    '„Orte importieren“, der Icon-Button daneben, bietet „Listenimport“ für eine Liste an, die aus Google Maps oder Naver Maps geteilt wurde. Hat ein Administrator das Add-on Touren abgeschaltet, gibt es dort auch „Dateimport“ für .gpx-, .kml- und .kmz-Dateien, und du kannst eine Datei direkt auf die Spalte ziehen.',
  'help.ctx.trip-places.bullet.4':
    'Darunter die Suche, die auch Beschreibungen und Notizen durchsucht, und daneben das Häkchen „Wählen“. Die Zeile darunter enthält die Filter: „Anzeigen“ wechselt zwischen „Alle“, „Ungeplant“ und „Geplant“, jeweils mit Anzahl. Der Etikett-Button filtert nach Kategorie, der Stern nach Mindestbewertung, der Globus nach Land oder Region (sobald die Reise mehr als ein Land oder eine Region umfasst), und „Sortieren nach“ legt die Reihenfolge der Liste fest.',
  'help.ctx.trip-places.bullet.5':
    'Eine Zeile zeigt Bild, Name und Beschreibung oder Adresse sowie einen Stern mit der Durchschnittsbewertung, sobald jemand den Ort bewertet hat. Klick darauf, um die Details des Ortes zu sehen, zieh die Zeile auf einen Tag oder klick sie mit rechts an (oder klick auf „Weitere Optionen“, die drei Punkte), um „Bearbeiten“, „+ Tag“, „Webseite öffnen“, „Google Maps“, „In Sammlung speichern“ und „Löschen“ zu erreichen.',
  'help.ctx.trip-places.bullet.6':
    'Ist ein Tag geöffnet, legt das runde + am Ende einer Zeile („+ Tag“) den Ort auf diesen Tag. Es erscheint bei jedem Ort, der noch nicht an diesem Tag eingeplant ist. „Geplant“ listet dann nur diesen Tag, und der Chip „Nur der geöffnete Tag wird angezeigt“ weist darauf hin; sein x („Ganze Reise anzeigen“) schließt den Tag wieder.',
  // create-place
  'help.guide.create-place.title': 'Ort anlegen',
  'help.guide.create-place.goal':
    'Trag einen Ort oder eine Aktivität von Hand ein, mit allen Angaben, die der Plan braucht.',
  'help.guide.create-place.step.1':
    'Klick oben in der Ortsspalte auf „Ort/Aktivität hinzufügen“ (bei geöffnetem Tag „Neuer Ort“). Das Formular öffnet sich, und der Cursor steht im Suchfeld.',
  'help.guide.create-place.step.2':
    'Tippe den Ort in „Orte durchsuchen…“ ein und wähle ein Ergebnis. Der Name oben im Dialog, Adresse, Breitengrad, Längengrad und Webseite werden ausgefüllt, und „Ortsdetails“ links zeigt Bilder, Öffnungszeiten und eine Beschreibung. Hat dein TREK einen Google-Schlüssel, führt „Nicht der richtige Ort? Stattdessen bei Google suchen“ unter den Ergebnissen dieselbe Suche über Google aus. Sind Sammlungen eingeschaltet, bietet dir „Gespeicherte Orte“ rechts die Orte aus deinen Listen auf dieselbe Weise an.',
  'help.guide.create-place.step.3':
    'Klick in „Ortsdetails“ unter „Bild auswählen“ auf ein Bild, um es als Bild des Ortes zu verwenden. „Text übernehmen“ kopiert die Beschreibung ins Formular.',
  'help.guide.create-place.step.4':
    'Prüf, was im Formular steht. Der Name im Kopf des Dialogs ist das einzige Pflichtfeld. Mit dem Chip „Kategorie“ darunter wählst du eine Kategorie der Reise, das + daneben legt eine neue an. „Adresse“, „Breitengrad“ und „Längengrad“ kommen aus der Suche, oder du tippst sie ein. „Beschreibung“ und „Notizen“ füllst du selbst. In „Webseite“ kommt der Link, „Anhängen“ unter „Dateien“ fügt ein Dokument hinzu, und in „Telefon“, „E-Mail“ und „Öffnungszeiten hinzufügen“ trägst du ein, was die Suche nicht kannte.',
  'help.guide.create-place.step.5':
    'Klick auf „Hinzufügen“. Gibt es in der Reise schon einen Ort mit demselben Namen oder an derselben Stelle, zeigt TREK eine Warnung, und der Button heißt dann „Trotzdem hinzufügen“.',
  'help.guide.create-place.result':
    'Der Ort steht in der Liste und auf der Karte, unter „Ungeplant“, bis er einem Tag zugeordnet wird.',
  'help.guide.create-place.tip.1':
    'Ist das Add-on Budget aktiv, öffnet „Kosten“ unten im Formular direkt nach dem Speichern den Kosten-Editor für die Ausgabe dieses Ortes. Ein Bild oder PDF, das du in den Dialog einfügst, wird wie eine Datei unter „Dateien“ angehängt.',
  'help.guide.create-place.tip.2':
    'Die Suchergebnisse liefern auf jedem TREK der TREK-Index und OpenStreetMap, und die „Ortsdetails“ werden automatisch aus Wikipedia, Wikivoyage und Wikimedia gefüllt. Google fragt TREK nur, wenn beide nichts finden, und nur Google liefert Bewertungen.',
  'help.guide.create-place.tip.3':
    'Du kannst einen Ort auch auf der Karte anlegen: Klick mit der rechten Maustaste auf die Stelle, und das Formular öffnet sich mit bereits eingetragenen Koordinaten und Adresse.',
  // place-to-open-day
  'help.guide.place-to-open-day.title': 'Ort direkt zum geöffneten Tag hinzufügen',
  'help.guide.place-to-open-day.goal':
    'Leg einen Ort an oder wähle einen aus und füg ihn in einem Schritt dem Tag hinzu.',
  'help.guide.place-to-open-day.step.1':
    'Klick in der Tagesspalte auf die Kopfzeile eines Tages. Der Tag ist jetzt geöffnet: Seine Karte ist hervorgehoben, und in der Ortsspalte erscheint neben „Neuer Ort“ der Button „Zum Tag“.',
  'help.guide.place-to-open-day.step.2':
    '„Zum Tag“ öffnet dasselbe Formular wie „Neuer Ort“, nur landet der Ort direkt auf dem geöffneten Tag, sobald du auf „Hinzufügen“ klickst.',
  'help.guide.place-to-open-day.step.3':
    'Einen vorhandenen Ort legst du mit dem runden + am Ende seiner Zeile („+ Tag“) oder per Rechtsklick und „+ Tag“ auf den geöffneten Tag. Das + erscheint bei jedem Ort, der noch nicht an diesem Tag eingeplant ist.',
  'help.guide.place-to-open-day.step.4':
    'Es geht auch andersherum, ohne vorher einen Tag zu öffnen: Zieh die Zeile des Ortes aus der Spalte auf eine Tageskarte. Legst du sie zwischen zwei Halten ab, landet der Ort genau dort.',
  'help.guide.place-to-open-day.result':
    'Der Ort steht ganz unten im Tag. Zieh ihn nach oben oder unten an die richtige Stelle.',
  'help.guide.place-to-open-day.tip.1':
    'Der geöffnete Tag wirkt sich auch auf die Suche aus: Ist ein Tag offen, gehen die Karte und die Umgebungssuche von den Orten aus, die schon an diesem Tag geplant sind.',
  'help.guide.place-to-open-day.tip.2': '„Rückgängig“ in der Leiste über den Tagen macht die Zuordnung rückgängig.',
  // filter-places
  'help.guide.filter-places.title': 'Ort in der Liste finden',
  'help.guide.filter-places.goal': 'In der Spalte nur die Orte anzeigen, die du suchst.',
  'help.guide.filter-places.step.1':
    'Mit „Anzeigen“, dem Dropdown unter der Suche, wechselst du zwischen „Alle“, „Ungeplant“ (noch keinem Tag zugeordnet) und „Geplant“ (einem Tag zugeordnet), jeweils mit Anzahl. Ist das Add-on Touren aus und wurde ein GPX-Track importiert, kommt „Strecken“ dazu.',
  'help.guide.filter-places.step.2':
    'Tipp oben in „Suchen“. Die Liste wird schon beim Tippen eingegrenzt, nach Name, Adresse, Beschreibung und Notizen. Das x im Feld leert es.',
  'help.guide.filter-places.step.3':
    'Der Button mit dem Etikett-Symbol neben „Anzeigen“ listet die Kategorien auf: Hak eine oder mehrere an, auch „Keine Kategorie“ ist dabei. Der Button zeigt, wie viele angehakt sind, und „Filter zurücksetzen“ unten in der Liste hebt alle wieder auf.',
  'help.guide.filter-places.step.4':
    'Mit dem Stern daneben legst du eine Mindestbewertung fest: 5+, 4+ und so weiter zeigen nur Orte, deren Durchschnittsbewertung mindestens so hoch ist. Orte ohne Bewertung fallen heraus.',
  'help.guide.filter-places.result':
    'Die Zahl auf „Anzeigen“ zeigt, wie viele Orte passen. Du kannst die Filter kombinieren.',
  'help.guide.filter-places.tip.1':
    'Ist ein Tag geöffnet, zeigt „Geplant“ nur diesen Tag und weist darauf hin: „Nur der geöffnete Tag wird angezeigt“, daneben „Ganze Reise anzeigen“.',
  'help.guide.filter-places.tip.2':
    'Auch die Karte richtet sich nach „Anzeigen“, den Kategorien und der Bewertung, und bei geöffnetem Tag zeigt „Geplant“ auf der Karte nur diesen Tag. Die Suche und der Globus filtern nur die Liste.',
  // edit-place
  'help.guide.edit-place.title': 'Ort bearbeiten',
  'help.guide.edit-place.goal':
    'Korrigiere einen Namen, verschieb die Stecknadel, ergänze eine Website oder ändere die Kategorie.',
  'help.guide.edit-place.step.1':
    'Klicke mit der rechten Maustaste auf die Zeile und wähle Bearbeiten, klicke am Ende der Zeile auf „Weitere Optionen“, oder öffne den Ort und klicke in seinen Details auf Bearbeiten.',
  'help.guide.edit-place.step.2':
    'Ändere in „Ort bearbeiten“, was du brauchst: den Namen und die Pille „Kategorie“ oben im Dialog, „Adresse“, „Breitengrad“ und „Längengrad“, „Beschreibung“, „Notizen“, „Webseite“, „Telefon“, „E-Mail“ und die Öffnungszeiten. Ist der Ort genau einem Tag zugeordnet oder hast du ihn von einem Tag aus geöffnet, enthält das Formular außerdem „Start“, „Ende“ und „Notizen für diesen Tag“.',
  'help.guide.edit-place.step.3': 'Klick auf „Aktualisieren“.',
  'help.guide.edit-place.result':
    'Die Änderung gilt überall, wo der Ort vorkommt: in der Liste, auf der Karte und an jedem Tag, an dem er eingeplant ist.',
  'help.guide.edit-place.tip.1':
    '„Notizen für diesen Tag“ gehören zum Ort an genau diesem Tag, „Notizen“ zum Ort selbst.',
  'help.guide.edit-place.tip.2':
    'Liegt das „Ende“ vor dem Beginn, lässt sich nicht aktualisieren; „Zeitliche Überschneidung mit:“ warnt nur, dass ein anderer Stopp des Tages dieselbe Uhrzeit hat.',
  // delete-place
  'help.guide.delete-place.title': 'Ort löschen',
  'help.guide.delete-place.goal': 'Entferne einen Ort endgültig aus der Reise.',
  'help.guide.delete-place.step.1':
    'Klick mit rechts auf die Zeile und wähl „Löschen“ (das geht auch über „Weitere Optionen“ am Ende der Zeile), oder klick in den Details des Ortes auf „Löschen“.',
  'help.guide.delete-place.step.2':
    'Klick in der Rückfrage auf „Löschen“. Wurde an diesem Ort eine Übernachtung gebucht oder ist eine Buchung damit verknüpft, nennt die Rückfrage, was mitgelöscht wird.',
  'help.guide.delete-place.result':
    'Der Ort verschwindet aus der Liste, von der Karte und von allen Tagen. Mit „Rückgängig“ in der Leiste über den Tagen holst du ihn zurück.',
  'help.guide.delete-place.tip.1':
    'Willst du einen Ort nur von einem Tag entfernen, nutze stattdessen „Vom Tag entfernen“ bei diesem Stopp.',
  'help.guide.delete-place.tip.2':
    'Um mehrere Orte auf einmal zu löschen, klick auf das Häkchen neben der Suche und starte so eine Auswahl.',
  // select-places
  'help.guide.select-places.title': 'Mehrere Orte auf einmal ändern oder löschen',
  'help.guide.select-places.goal': 'Bearbeite viele Orte auf einmal statt einzeln.',
  'help.guide.select-places.step.1':
    'Klick auf den Haken neben dem Suchfeld. Die Zeilen bekommen runde Kontrollkästchen, und unten in der Spalte erscheint eine Leiste mit den Aktionen.',
  'help.guide.select-places.step.2':
    'Klick auf die Zeilen, um sie anzuhaken. „Alle auswählen“, der doppelte Haken in der Leiste, wählt alle Zeilen aus, die die Filter anzeigen.',
  'help.guide.select-places.step.3':
    'Die Leiste zeigt, wie viele Orte angehakt sind. „Kategorie ändern“ gibt allen dieselbe Kategorie; „In Sammlung speichern“ (wenn Sammlungen eingeschaltet sind) kopiert sie in eine deiner Sammlungen; „Auswahl löschen“ entfernt sie nach einer Bestätigung.',
  'help.guide.select-places.step.4': 'Klick auf „Fertig“, das X am Ende der Leiste, um die Auswahl zu beenden.',
  'help.guide.select-places.result':
    'Die Änderung gilt für alle ausgewählten Orte. Ein Löschen kannst du über die Leiste über den Tagen rückgängig machen.',
  'help.guide.select-places.tip.1':
    'Die Filter wirken auch während der Auswahl: Filtere zuerst auf „Ungeplant“, dann wählt „Alle auswählen“ nur diese Orte aus.',
  'help.guide.select-places.tip.2':
    '„In deinen Listen als besucht markieren“ erscheint in der Leiste, wenn das Addon „Sammlungen“ aktiv ist: Damit markierst du die Orte in den Sammlungen, in denen sie gespeichert sind, als besucht.',
  // import-places-file
  'help.guide.import-places-file.title': 'Orte aus einer GPX-, KML- oder KMZ-Datei importieren',
  'help.guide.import-places-file.goal':
    'Ist das Add-on Touren ausgeschaltet, die Pins und Pfade, die Google My Maps, Google Earth oder ein GPS-Tracker exportiert hat, als Orte importieren.',
  'help.guide.import-places-file.step.1':
    'Klicke auf „Orte importieren“, den Icon-Button neben dem Hinzufügen-Button, und wähle „Dateimport“, oder zieh die Datei irgendwo auf die Ortsspalte. Beides gibt es nur, wenn ein Administrator das Add-on Touren ausgeschaltet hat.',
  'help.guide.import-places-file.step.2':
    'Wähl die Datei aus oder zieh sie in das Feld. Hak bei einer GPX-Datei an, was importiert werden soll: „Wegpunkte“, „Strecken“, „Tracks (mit Streckenverlauf)“. Bei KML und KMZ hakst du „Punkte (Placemarks)“ und „Pfade (LineStrings)“ an.',
  'help.guide.import-places-file.step.3':
    'Du kannst mehrere Dateien auf einmal ablegen, aber nur .gpx, .kml und .kmz. Andere Dateiarten und Dateien über 10 MB lehnt der Dialog ab, sie werden nicht importiert.',
  'help.guide.import-places-file.step.4':
    'Klick auf „Importieren“. Eine Meldung zeigt, wie viele Orte importiert wurden. Bei einer KML- oder KMZ-Datei bleibt der Dialog offen und fasst zusammen, was angelegt und was übersprungen wurde.',
  'help.guide.import-places-file.result':
    'Die Orte stehen in der Liste. Ein Track hat in seiner Zeile einen farbigen Strich, wird auf der Karte eingezeichnet und bekommt einen eigenen Filter „Strecken“.',
  'help.guide.import-places-file.tip.1':
    'Eine zu große Datei lehnt TREK ab und nennt die Größengrenze. Exportiere sie noch einmal ohne Fotos oder teile sie auf.',
  'help.guide.import-places-file.tip.2':
    'Den ganzen Import kannst du in der Werkzeugleiste über den Tagen rückgängig machen.',
  // import-places-list
  'help.guide.import-places-list.title': 'Geteilte Liste aus Google Maps oder Naver Maps importieren',
  'help.guide.import-places-list.goal': 'Importiere Orte über den Link einer geteilten Liste.',
  'help.guide.import-places-list.step.1':
    'Klick auf „Orte importieren“, den Icon-Button neben dem Hinzufügen-Button, und wähl „Listenimport“.',
  'help.guide.import-places-list.step.2':
    'Wähl unter „Anbieter“ „Google Liste“ oder „Naver Liste“ und füg dann den Freigabelink der Liste unter „Link“ ein. Ein Google-Maps-Routenlink geht auch: Seine Stopps werden zu Orten, in der Reihenfolge der Fahrt.',
  'help.guide.import-places-list.step.3': 'Klick auf „Importieren“.',
  'help.guide.import-places-list.result':
    'Alle Orte der Liste sind jetzt in der Reise, mit demselben Namen wie in der Liste. Orte, die schon in der Reise sind, werden übersprungen.',
  'help.guide.import-places-list.tip.1':
    'Die Liste muss öffentlich geteilt sein; über den Link einer privaten Liste wird nichts importiert.',
  'help.guide.import-places-list.tip.2':
    '„Orte über Google anreichern“ erscheint im Dialog, wenn dein TREK einen Google-Schlüssel hat: Damit wird jeder importierte Ort nachgeschlagen und um Fotos, Adresse und Details ergänzt.',
  'help.guide.sort-places.title': 'Orteliste sortieren',
  'help.guide.sort-places.goal':
    'Die Liste nach Name, nach Bewertung oder nach zuletzt hinzugefügt bzw. geändert sortieren.',
  'help.guide.sort-places.step.1':
    'Klick auf „Sortieren nach“, den Pfeil-Button am Ende der Filterzeile. Ein Haken zeigt die aktuelle Reihenfolge, und der Tooltip des Buttons nennt sie.',
  'help.guide.sort-places.step.2':
    'Wähl eine Reihenfolge, zum Beispiel „Beste Bewertung“, oder sortiere nach Name. Die Liste ordnet sich sofort neu.',
  'help.guide.sort-places.result':
    'Die Liste zeigt die Orte in der gewählten Reihenfolge, bis du eine andere auswählst.',
  'help.guide.sort-places.tip.1':
    'Bei jeder Sortierung außer „Zuletzt hinzugefügt“ ist der Button hervorgehoben, damit du sofort siehst, dass die Liste anders sortiert ist.',
  'help.guide.sort-places.tip.2':
    'Das Sortieren ändert nur die Liste. Die Tage behalten ihre eigene Reihenfolge, und dein Browser merkt sich die Sortierung, die du gewählt hast.',
  'help.guide.place-by-hand.title': 'Ort hinzufügen, den die Suche nicht kennt',
  'help.guide.place-by-hand.goal':
    'Trag einen Ort mit Telefon, E-Mail und Öffnungszeiten selbst ein, wenn die Ortssuche nichts findet.',
  'help.guide.place-by-hand.step.1':
    'Gib im Ortsdialog den Namen in die Suche ein und drück Enter. Findet die Suche nichts, sagt dir der Dialog das und bietet „Selbst anlegen“ an.',
  'help.guide.place-by-hand.step.2':
    'Klick auf „Selbst anlegen“. Dein Suchbegriff wird zum Namen, und der Dialog scrollt zu den Kontaktfeldern.',
  'help.guide.place-by-hand.step.3': 'Trag „Telefon“ und „E-Mail“ ein, wenn du sie kennst.',
  'help.guide.place-by-hand.step.4':
    'Klick auf „Öffnungszeiten hinzufügen“ und leg für jeden Tag fest, wann der Ort öffnet und schließt. Der Kopieren-Button übernimmt die Zeiten des ersten Tages für alle Tage, und mit dem Schalter eines Tages markierst du ihn als „Geschlossen“.',
  'help.guide.place-by-hand.step.5': 'Klick auf „Hinzufügen“.',
  'help.guide.place-by-hand.result':
    'Der Ort wird zur Liste hinzugefügt. In seinen Details stehen Telefon, E-Mail und Öffnungszeiten, die du eingetragen hast, genau wie bei einem Ort aus der Suche.',
  'help.guide.place-by-hand.tip.1':
    'Bearbeitest du einen Ort ohne eigene Öffnungszeiten, übernimmt er sie automatisch aus den „Ortsdetails“ links. Hat er schon Öffnungszeiten, kannst du die nachgeschlagenen mit einem Button daneben übernehmen.',
  'help.guide.place-by-hand.tip.2':
    'Selbst eingetragene Öffnungszeiten ersetzen die nachgeschlagenen. Ein Café mit saisonalen Öffnungszeiten zeigt so die Zeiten, die du kennst.',

  // ── Screen: trip-days ─────────────────────────────────────────────────────────────────
  'help.ctx.trip-days.title': 'Tage',
  'help.ctx.trip-days.summary':
    'Die linke Spalte des Plans: eine Karte pro Tag mit den Stopps in ihrer Reihenfolge, den Notizen, den Buchungen und Transporten des Tages und der Route zwischen den Stopps. Hier planst du die eigentliche Reise.',
  'help.ctx.trip-days.bullet.1':
    'Die Kopfleiste oben: links „Exportieren“ (PDF, Kalender, GPX), rechts der Rückgängig-Pfeil, „Alle Tage ausklappen“ / „Alle Tage einklappen“, „Tage neu anordnen“ und „Alle Buchungsrouten anzeigen“, sobald eine Buchung eine Route hat, die sich zeichnen lässt.',
  'help.ctx.trip-days.bullet.2':
    'Eine Tageskarte: eine Kachel mit Tagesnummer und Wettervorhersage, der Titel („Tag 1“, bis du ihn benennst) und das Datum, darunter Chips für die Unterkunft der Nacht (grün beim Check-in, rot beim Check-out, gestrichelt, solange sie nicht bestätigt ist; ihr Ticket-Symbol öffnet die Buchung) und für einen Mietwagen. Ein Klick auf den Kopf öffnet den Tag, der Pfeil klappt ihn zu, und das + („Zum Tag hinzufügen“) öffnet ein Menü: „Ort zu diesem Tag“, „Unterkunft hinzufügen“, „Transport hinzufügen“, „ÖPNV“ und „Notiz hinzufügen“. Ein Rechtsklick auf den Kopf bietet dasselbe, dazu „Tag leeren“.',
  'help.ctx.trip-days.bullet.3':
    'In einem Tag: die Stopps der Reihe nach, jeweils mit Bild, Kategorie-Icon, Name, Zeit und Beschreibung, den zugehörigen Buchungen und wer mitkommt; Notizen; die Buchungen und Transporte des Tages, farbig nach Typ. Fährst du mit der Maus über einen Stopp, erscheinen der Griff zum Ziehen, das Schloss auf dem Bild, die Pfeile, „Buchung hinzufügen“ und die drei Punkte („Weitere Optionen“); Stopps und Notizen öffnen ihr Menü auch per Rechtsklick.',
  'help.ctx.trip-days.bullet.4':
    'Hat der geöffnete Tag mindestens zwei Halte, erscheint darunter die Routenleiste: „Route“ zeichnet den Tag auf die Karte und zeigt die Dauer jedes Abschnitts zwischen den Halten, mit den drei Icons stellst du für den Tag „Auto“, „Zu Fuß“ oder „Fahrrad“ ein, danach folgen „Optimieren“, „In Google Maps öffnen“ und „In CoMaps öffnen“.',
  'help.ctx.trip-days.bullet.5':
    'Orte kannst du auf verschiedene Arten zu einem Tag hinzufügen: eine Zeile aus der Ortsspalte ziehen, „+ Tag“ in dieser Zeile nutzen, „Ort zu diesem Tag“ über das + des Tages oder an einem leeren Tag wählen oder die Details des Ortes verwenden.',
  'help.ctx.trip-days.bullet.6':
    '„Gesamtkosten“ unten summiert die Ausgaben aus „Kosten“, die zu den Halten und Buchungen des Tages gehören, jede nur einmal und in deiner Anzeigewährung.',
  // read-day-plan
  'help.guide.read-day-plan.title': 'Einen Tag verstehen',
  'help.guide.read-day-plan.goal': 'Verstehen, was jeder Teil einer Tageskarte bedeutet, bevor du etwas änderst.',
  'help.guide.read-day-plan.step.1':
    'Der Kopf: eine Kachel mit der Tagesnummer und der Wettervorhersage, dann „Tag 1“ oder der Titel, den du dem Tag gegeben hast, und das Datum. Darunter Badges für die Unterkunft der Nacht (grün beim Check-in, rot beim Check-out, gestrichelt, solange sie nicht bestätigt ist; das Ticket darauf öffnet die Buchung) und für einen Mietwagen. Klicke auf den Kopf, um den Tag zu öffnen (seine Details öffnen sich über der Karte). Mit dem + rechts („Zum Tag hinzufügen“) fügst du einen Ort, einen Aufenthalt, einen Transport, eine ÖPNV-Verbindung oder eine Notiz hinzu, und der Pfeil klappt die Karte ein.',
  'help.guide.read-day-plan.step.2':
    'Ein Halt: Bild, Kategorie-Icon und Name, dann die Uhrzeit, sobald er einen Start hat, und seine Beschreibung; darunter stehen die Notizen für diesen Tag. Fährst du mit der Maus über die Zeile, erscheinen die Bedienelemente: Am Griff links ziehst du sie, das Bild wird zu einem Schloss für die Routenoptimierung, und ganz rechts findest du die Pfeile („Nach oben“, „Nach unten“), „Buchung hinzufügen“ und die drei Punkte („Weitere Optionen“).',
  'help.guide.read-day-plan.step.3':
    'Eine Buchung an einem Halt erscheint dort als Badge „Reservierung“, grün, wenn sie bestätigt ist, und bernsteinfarben, solange sie aussteht, jeweils mit Uhrzeit und Anbieter. Klick auf das Badge, um die Buchung zu öffnen; der Routen-Button daneben zeichnet ihre Route. Ein Transport hat eine eigene Zeile, eingefärbt nach seinem Typ, mit Uhrzeit und „Abreise“ oder „Ankunft“. Klick auf eine Buchung, um ihre Details zu öffnen; dort änderst du sie mit „Bearbeiten“.',
  'help.guide.read-day-plan.step.4':
    'Ist „Route“ eingeschaltet, zeigt die Verbindung zwischen zwei Halten, wie lange der Abschnitt im Reisemodus des Tages dauert und wie weit er ist; klick darauf, um den Modus nur für diesen einen Abschnitt zu ändern.',
  'help.guide.read-day-plan.step.5':
    'Die Routenleiste unter den Stopps des geöffneten Tages: „Route“ zeichnet den Weg des Tages auf die Karte, mit den drei Icons wählst du „Auto“, „Zu Fuß“ oder „Fahrrad“, „Optimieren“ sortiert die Stopps neu, und „In Google Maps öffnen“ und „In CoMaps öffnen“ öffnen den Tag in der jeweiligen App.',
  'help.guide.read-day-plan.result':
    'Jedes Symbol auf der Karte hat eine Bedeutung. Wie du es jeweils änderst, erklären die Anleitungen unten.',
  'help.guide.read-day-plan.tip.1':
    'Ein Rechtsklick auf einen Halt oder ein Klick auf seine drei Punkte öffnet sein Menü: „Bearbeiten“, „Aus Tag entfernen“, „Aus der Route nehmen“, „Webseite öffnen“, „In Sammlung speichern“, „Löschen“. Die Navigations-Apps findest du in den Details des Ortes unter „Navigation“.',
  'help.guide.read-day-plan.tip.2':
    'Fährst du mit der Maus über einen Stopp, erscheint am Ende der Zeile „Buchung hinzufügen“. Eine dort angelegte Reservierung ist mit diesem Stopp an diesem Tag verknüpft.',
  // place-onto-day
  'help.guide.place-onto-day.title': 'Ort einem Tag hinzufügen',
  'help.guide.place-onto-day.goal':
    'Einen Ort aus der Liste als Stopp eines Tages einplanen, an der richtigen Stelle der Reihenfolge.',
  'help.guide.place-onto-day.step.1':
    'Zieh eine Zeile aus der Ortsspalte auf die Tageskarte. Leg sie zwischen zwei Halten ab, um sie genau dort einzufügen, oder auf den Tageskopf, um sie ans Ende zu hängen.',
  'help.guide.place-onto-day.step.2':
    'Ohne Ziehen: Öffne den Tag mit einem Klick auf seinen Kopf und klick dann auf das runde + am Ende der Zeile des Orts („+ Tag“), oder klick mit der rechten Maustaste auf die Zeile und wähl „+ Tag“.',
  'help.guide.place-onto-day.step.3':
    '„Ort zu diesem Tag“ im +-Menü des Tages oder an einem leeren Tag öffnet das Ortsformular, und der neue Ort wird sofort zum Tag hinzugefügt.',
  'help.guide.place-onto-day.step.4':
    'Ist ein Tag geöffnet, legt „Zum Tag hinzufügen“ in den Details eines Ortes ihn auf diesen Tag; „Zum Tag“ oben in der Ortsspalte legt einen neuen Ort direkt am geöffneten Tag an.',
  'help.guide.place-onto-day.result':
    'Der Ort ist jetzt ein Stopp des Tages. Er erscheint auf der Karte mit der Nummer des Tages, und die Ortsspalte zählt ihn unter „Geplant“.',
  'help.guide.place-onto-day.tip.1':
    'Ein Ort kann an mehreren Tagen eingeplant sein: Füge ihn aus der Ortsspalte zum zweiten Tag hinzu. Ziehst du einen Stopp dagegen von einer Tageskarte auf eine andere, wird er verschoben.',
  'help.guide.place-onto-day.tip.2': 'Mit dem Rückgängig-Pfeil in der Kopfleiste machst du die Zuweisung rückgängig.',
  'help.guide.place-onto-day.tip.3':
    'Zwischen zwei Einträge mit festen Uhrzeiten oder vor eine Buchung mit Uhrzeit kannst du keinen Stopp ziehen. So bleibt der Plan zeitlich geordnet.',
  // reorder-stops
  'help.guide.reorder-stops.title': 'Reihenfolge eines Tages ändern',
  'help.guide.reorder-stops.goal': 'Verschieb einen Stopp nach oben, nach unten oder auf einen anderen Tag.',
  'help.guide.reorder-stops.step.1':
    'Fahr mit der Maus über den Halt und zieh ihn am Griff an die neue Position in der Karte.',
  'help.guide.reorder-stops.step.2':
    'Oder nutz die Pfeile am rechten Ende des Halts, über dem die Maus steht („Nach oben“, „Nach unten“): ein Schritt pro Klick.',
  'help.guide.reorder-stops.step.3':
    'Zieh den Stopp auf eine andere Tageskarte, um ihn dorthin zu verschieben; vom bisherigen Tag wird er entfernt.',
  'help.guide.reorder-stops.step.4':
    'Hat ein Stopp eine feste Uhrzeit und würde das Verschieben die Reihenfolge des Tages durcheinanderbringen, fragt TREK „Uhrzeit entfernen?“, denn die Uhrzeit hat seinen Platz bestimmt: Bestätigen entfernt die Uhrzeit, und du kannst den Stopp überall hinlegen; Abbrechen lässt den Tag, wie er war.',
  'help.guide.reorder-stops.result': 'Route und Fahrzeiten passen sich sofort an die neue Reihenfolge an.',
  'help.guide.reorder-stops.tip.1':
    'Eine Buchung mit fester Uhrzeit bleibt an der Stelle, die ihre Uhrzeit vorgibt: Legst du sie woanders in ihrem Tag ab, springt sie zurück. Ziehst du sie auf eine andere Tageskarte, verschiebt sie sich auf diesen Tag.',
  'help.guide.reorder-stops.tip.2':
    '„Optimieren“ in der Routenleiste sortiert ab drei Halten den ganzen Tag nach dem kürzesten Weg; sperr vorher einen Halt, damit er an seiner Stelle bleibt.',
  // set-stop-times
  'help.guide.set-stop-times.title': 'Uhrzeit für einen Stopp festlegen',
  'help.guide.set-stop-times.goal':
    'Festlegen, wann ein Stopp beginnt und endet, damit der Tag wie ein Zeitplan funktioniert.',
  'help.guide.set-stop-times.step.1':
    'Klick mit der rechten Maustaste auf den Stopp oder auf seine drei Punkte und wähle „Bearbeiten“. Öffnest du das Formular vom Tag aus, findest du direkt unter dem Ort Start und „Ende“ für diesen Tag.',
  'help.guide.set-stop-times.step.2':
    'Trag den Start und bei Bedarf das „Ende“ ein. „Zeitliche Überschneidung mit:“ warnt dich, wenn sich ein anderer Stopp des Tages mit Uhrzeit überschneidet. Liegt das Ende vor dem Start, lässt sich „Aktualisieren“ nicht anklicken.',
  'help.guide.set-stop-times.step.3':
    'Klick auf „Aktualisieren“. Der Stopp bekommt ein Zeit-Abzeichen und rückt an die Stelle im Tag, die zu seiner Uhrzeit passt.',
  'help.guide.set-stop-times.result':
    'Stopps mit Uhrzeit behalten ihren Platz in der Reihenfolge, Stopps ohne Uhrzeit werden um sie herum einsortiert.',
  'help.guide.set-stop-times.tip.1':
    'Die Uhrzeit gehört zum Stopp an diesem Tag; derselbe Ort kann an einem anderen Tag eine andere Uhrzeit haben.',
  'help.guide.set-stop-times.tip.2':
    'Willst du einen Stopp mit Uhrzeit von Hand verschieben, zieh ihn. TREK fragt „Uhrzeit entfernen?“, und wenn du auf „Bestätigen“ klickst, wird die Uhrzeit entfernt.',
  'help.guide.set-stop-times.tip.3':
    '„Notizen für diesen Tag“ im selben Formular sind für Infos, die nur an diesem Tag gelten, etwa eine Tischreservierung oder eine Ticketnummer.',
  // remove-from-day
  'help.guide.remove-from-day.title': 'Stopp aus einem Tag entfernen',
  'help.guide.remove-from-day.goal': 'Nimm einen Ort aus einem Tag, ohne ihn aus der Reise zu löschen.',
  'help.guide.remove-from-day.step.1':
    'Klick mit der rechten Maustaste auf den Halt oder auf seine drei Punkte und wähl „Aus Tag entfernen“.',
  'help.guide.remove-from-day.step.2':
    'Der Stopp wird aus dem Tag entfernt. Der Ort bleibt in der Orte-Spalte, unter „Ungeplant“, wenn er an keinem anderen Tag eingeplant ist.',
  'help.guide.remove-from-day.result':
    'Der Tag, seine Route und seine Kosten werden aktualisiert. Mit dem Rückgängig-Pfeil holst du den Stopp zurück.',
  'help.guide.remove-from-day.tip.1': '„Löschen“ im selben Menü entfernt den Ort aus der ganzen Reise, an allen Tagen.',
  'help.guide.remove-from-day.tip.2':
    '„Vom Tag entfernen“ findest du auch in den Details des Ortes, neben „Zum Tag hinzufügen“.',
  // lock-stop
  'help.guide.lock-stop.title': 'Stopp fixieren',
  'help.guide.lock-stop.goal': 'Halte einen Stopp an seiner Position, wenn die Route optimiert wird.',
  'help.guide.lock-stop.step.1':
    'Fahr mit der Maus über das Bild des Stopps und klick auf das Schloss: „Position bei Routenoptimierung beibehalten“.',
  'help.guide.lock-stop.step.2':
    '„Optimieren“ ordnet jetzt die anderen Stopps um ihn herum an. Klick noch einmal auf das Schloss („Klicken zum Entsperren“), um ihn wieder freizugeben.',
  'help.guide.lock-stop.result':
    'Auf dem Bild erscheint das Schloss, und der Stopp bleibt an seiner Position, bis du ihn entsperrst.',
  'help.guide.lock-stop.tip.1':
    'Ein Stopp mit fester Uhrzeit ist durch seine Uhrzeit fixiert und wird beim Optimieren nie verschoben.',
  'help.guide.lock-stop.tip.2':
    'Die Sperre gilt nur, bis du die Seite neu lädst. Danach sind alle Stopps wieder entsperrt; nur Stopps mit Uhrzeit bleiben fixiert.',
  // day-note
  'help.guide.day-note.title': 'Notiz zu einem Tag hinzufügen',
  'help.guide.day-note.goal': 'Speichere eine Erinnerung, eine Ticketnummer oder einen Plan B direkt am Tag.',
  'help.guide.day-note.step.1':
    'Klicke auf das + im Kopf des Tages („Zum Tag hinzufügen“) und wähle „Notiz hinzufügen“.',
  'help.guide.day-note.step.2':
    'Gib oben im Dialog bei „Notiz“ den Namen der Notiz ein. Dieser Name erscheint auf der Tageskarte. Den Rest schreibst du unter „Tagesnotiz“: Mit der Werkzeugleiste darüber formatierst du den Text (Fett, Listen, Links, Zitate), und die „Vorschau“ links zeigt, wie die Zeile aussehen wird.',
  'help.guide.day-note.step.3':
    'Wähle ein „Symbol“ und eine „Farbe“, damit sich die Notiz gut von den Stopps abhebt, und klick dann auf „Hinzufügen“.',
  'help.guide.day-note.step.4':
    'Die Notiz steht im Tag wie ein Halt: Zieh sie an ihren Platz oder nutz ihre Pfeile. Klick darauf, um sie zu bearbeiten. „Löschen“ findest du im Dialog sowie unter ihren drei Punkten oder im Rechtsklick-Menü; vorher fragt TREK „Notiz löschen?“.',
  'help.guide.day-note.result':
    'Die Notiz gehört zum Tag und erscheint im PDF, genau an der Stelle, an die du sie gezogen hast.',
  'help.guide.day-note.tip.1':
    'Links in einer Notiz öffnen sich in einem neuen Tab, und ein einfacher Zeilenumbruch bleibt erhalten.',
  'help.guide.day-note.tip.2': 'Notizen gelten jeweils für einen Tag. Eine Notiz für die ganze Reise gehört in Collab.',
  // day-route
  'help.guide.day-route.title': 'Route des Tages anzeigen und optimieren',
  'help.guide.day-route.goal':
    'Die Route zwischen den Stopps sehen, das Verkehrsmittel wählen und TREK die Reihenfolge sortieren lassen.',
  'help.guide.day-route.step.1':
    'Öffne den Tag und klicke in der Routenleiste unter seinen Stopps auf „Route“: Der Weg zwischen den Stopps wird auf der Karte eingezeichnet, und die Verbindungen zwischen den Stopps zeigen Zeit und Distanz jedes Abschnitts.',
  'help.guide.day-route.step.2':
    'Mit den drei Icons daneben legst du die Fortbewegungsart des Tages fest: „Auto“, „Zu Fuß“ oder „Fahrrad“. Die Abschnitte werden neu berechnet. Plugins können eigene Fortbewegungsarten ergänzen.',
  'help.guide.day-route.step.3':
    'Klick auf eine Verbindungslinie, um das Verkehrsmittel nur für diesen Abschnitt zu ändern: Wähl ein Verkehrsmittel, „ÖPNV“, um dort, wo es angeboten wird, eine Verbindung zu suchen, oder „Tages-Standard verwenden“, um wieder die Einstellung des Tages zu übernehmen.',
  'help.guide.day-route.step.4':
    '„Optimieren“ (der runde Pfeil) sortiert die Halte ab drei Halten nach dem kürzesten Weg. Halte mit Schloss oder fester Uhrzeit behalten ihren Platz; gibt es an dem Tag eine Unterkunft, beginnt die Route dort.',
  'help.guide.day-route.step.5':
    '„In Google Maps öffnen“ oder „In CoMaps öffnen“ öffnet den ganzen Tag als Route in der jeweiligen App, zum Navigieren unterwegs; CoMaps übernimmt dabei die Fortbewegungsart des Tages.',
  'help.guide.day-route.result':
    'Der Tag ist eine Route mit Uhrzeiten; „Gesamtkosten“ und die Etappen aktualisieren sich, wenn sich die Reihenfolge ändert.',
  'help.guide.day-route.tip.1':
    'Routen kommen standardmäßig von OSRM. Die Administration kann unter „Benutzer-Standards“ einen anderen Routing-Dienst einstellen.',
  'help.guide.day-route.tip.2':
    'Konnte für eine Etappe keine Route berechnet werden, wird keine Zeit angezeigt. Prüf, ob beide Stopps Koordinaten haben.',
  'help.guide.day-route.tip.3': 'Mit dem Rückgängig-Pfeil machst du eine Optimierung rückgängig.',
  // manage-days
  'help.guide.manage-days.title': 'Tage hinzufügen, sortieren und umbenennen',
  'help.guide.manage-days.goal': 'Die Tage selbst ändern, nicht nur die Orte darauf.',
  'help.guide.manage-days.step.1':
    'Die Tage ergeben sich aus den Daten der Reise. Änderst du die Daten im Bearbeitungsformular der Reise im Dashboard, kommen an den Enden Tage hinzu oder fallen weg. Bevor ein Tag mit Inhalt wegfällt, zeigt dir eine Liste, welche Tage wegfallen und was darauf geplant ist.',
  'help.guide.manage-days.step.2':
    '„Tage neu anordnen“ im Kopfbereich öffnet eine Liste: Zieh einen Tag am Griff oder nutz „Nach oben“ und „Nach unten“; seine Orte, Notizen und Buchungen wandern mit. Unter der Liste hängt „Mit dem nächsten Datum“ einen Tag nach dem letzten datierten an und verlängert die Reise um einen Tag; „Ohne Datum“ hängt einen Tag ohne Datum an. Eine Reise ohne Daten hat nur „Tag hinzufügen“.',
  'help.guide.manage-days.step.3':
    '„Tag löschen“, der Papierkorb am Ende einer Zeile, fragt zuerst nach und listet auf, was mit dem Tag verschwindet: seine Orte, Notizen und Buchungen, ein Aufenthalt, der an diesem Tag beginnt oder endet, und die Tage, die um ein Datum nach vorn rücken. „Tag löschen“ entfernt ihn, Abbrechen behält ihn; den letzten Tag kannst du nicht löschen.',
  'help.guide.manage-days.step.4':
    'Um einen Tag umzubenennen, öffne ihn und klick im Detailpanel über der Karte auf den Stift neben seinem Titel. Der Name ersetzt „Tag 1“ auf der Karte und im PDF.',
  'help.guide.manage-days.step.5':
    'Mit „Alle Tage ausklappen“ und „Alle Tage einklappen“ in der Kopfleiste klappst du alle Karten auf einmal auf oder zu; eine einzelne Karte klappst du mit ihrem Pfeil.',
  'help.guide.manage-days.result':
    'Die Daten bleiben an der Position: Schiebst du einen Tag nach oben, bekommt er das frühere Datum, und seine Stopps, Notizen und Buchungen wandern mit.',
  'help.guide.manage-days.tip.1':
    'Das Verschieben von Tagen kannst du mit dem Rückgängig-Pfeil zurücknehmen, das Löschen eines Tages nicht.',
  'help.guide.manage-days.tip.2':
    '„Gesamtkosten“ unten im Plan summiert die ganze Reise; der Tab „Kosten“ schlüsselt sie auf.',
  // bookings-in-plan
  'help.guide.bookings-in-plan.title': 'Buchungen und Transporte im Plan verstehen',
  'help.guide.bookings-in-plan.goal': 'Sieh, wo eine Buchung erscheint, sobald es sie gibt, und wo du sie anlegst.',
  'help.guide.bookings-in-plan.step.1':
    'Ein Transport (Flug, Zug, Fähre, Bus, Auto) ist eine Zeile in der Farbe seines Typs, mit Uhrzeit und „Abreise“ am Tag der Abfahrt oder „Ankunft“ am Tag der Ankunft; der Globus daneben nennt die Zeitzone, und ein Flug mit Zwischenlandung bekommt eine Zeile pro Teilstrecke. Bei einer ÖPNV-Verbindung klappst du mit dem Pfeil die Linien auf. Klicke auf eine Zeile, um die Buchung zu öffnen; dort änderst du sie mit Bearbeiten.',
  'help.guide.bookings-in-plan.step.2':
    'Eine mit einem Stopp verknüpfte Reservierung (ein Restaurant, eine Tour) erscheint an diesem Stopp als Abzeichen „Reservierung“ mit ihrer Uhrzeit. Das Abzeichen ist grün, wenn sie bestätigt ist, und gelb, solange sie aussteht. Eine Buchung mit Tag, aber ohne Stopp hat im Tag eine eigene Zeile.',
  'help.guide.bookings-in-plan.step.3':
    'Eine Hotelnacht ist eine Unterkunft: Ihre Pille im Tageskopf ist am Check-in-Tag grün und am Check-out-Tag rot, und über ihr Ticket öffnest du die Buchung. Im Detailpanel des Tages steht sie unter „Unterkunft“, und an jedem dieser Tage beginnt die Route dort.',
  'help.guide.bookings-in-plan.step.4':
    'Auf der Karte: Der Routen-Button in einer Buchungszeile zeichnet ihre Route, „Alle Buchungsrouten anzeigen“ in der Kopfleiste zeichnet alle.',
  'help.guide.bookings-in-plan.step.5':
    'Anlegen: „Buchung hinzufügen“ an einem Halt, über dem die Maus steht, „Transport hinzufügen“ und „ÖPNV“ im +-Menü des Tages, und die Tabs „Buchungen“ und „Transporte“ für die vollständige Liste mit Import und Dateien.',
  'help.guide.bookings-in-plan.result':
    'Jede Buchung steht genau einmal im Plan. Die Tabs zeigen dieselben Buchungen als Liste.',
  'help.guide.bookings-in-plan.tip.1':
    '„Bestätigt“ oder „Ausstehend“ legst du als Status an der Buchung fest; der Plan zeigt ihn am Stopp, der Tab „Buchungen“ zählt beide.',
  'help.guide.bookings-in-plan.tip.2':
    'Legst du eine Buchung mit Uhrzeit woanders in ihrem Tag ab, springt sie an die Stelle zurück, die ihre Uhrzeit vorgibt; ziehst du sie auf eine andere Tageskarte, verschiebt sie sich auf diesen Tag. Die Uhrzeit änderst du in der Buchung.',
  // export-plan
  'help.guide.export-plan.title': 'Plan exportieren',
  'help.guide.export-plan.goal': 'Den Plan als Dokument, in deinen Kalender oder auf ein GPS-Gerät exportieren.',
  'help.guide.export-plan.step.1': 'Klick in der Kopfleiste über den Tagen links auf „Exportieren“.',
  'help.guide.export-plan.step.2':
    'Unter „Dokument“ öffnet „PDF“ die Druckansicht aller Tage mit ihren Halten, Notizen und Buchungen, eingeleitet von einer Routenübersichtskarte; „Mein Plan als PDF“ enthält nur das, woran du teilnimmst. In der Ansicht beginnt mit „Seitenumbruch pro Tag“ jeder Tag auf einer neuen Seite, „Notizen zu Transporten“ fügt die Notizen deiner Transporte hinzu, und „Als PDF speichern“ lädt die Datei herunter.',
  'help.guide.export-plan.step.3':
    '„Kalender“: „.ics herunterladen“ speichert die Buchungen als Kalenderdatei; „Kalender abonnieren“ liefert einen Link, den deine Kalender-App automatisch aktualisiert.',
  'help.guide.export-plan.step.4':
    'Karten & GPS (GPX): „Ganze Reise“ exportiert Orte, Tagesrouten und Tracks, „Nur Orte“ nur die Pins, „Tage als Routen“ eine Route pro Tag, für Offline-Karten und GPS-Geräte.',
  'help.guide.export-plan.result': 'Die Datei wird heruntergeladen. An der Reise ändert sich nichts.',
  'help.guide.export-plan.tip.1':
    'Um einen einzelnen Tag in einer Karten-App zu öffnen, nutze seine Routenleiste: „In Google Maps öffnen“ oder „In CoMaps öffnen“.',
  'help.guide.export-plan.tip.2':
    '„Kalender abonnieren“ setzt voraus, dass Kalender-Feeds in deinen Einstellungen eingeschaltet sind und du die Reise teilen darfst. Eine Anleitung dazu findest du beim Dashboard.',
  'help.guide.export-plan.tip.3':
    'Exportieren zählt als Lesen: Jedes Mitglied der Reise kann das PDF, die .ics-Datei und die GPX-Datei exportieren.',

  // ── Screen: trip-place ────────────────────────────────────────────────────────────────
  'help.ctx.trip-place.title': 'Ortsdetails',
  'help.ctx.trip-place.summary':
    'Die Infokarte, die sich über der Karte öffnet, wenn du einen Ort wählst: alles, was die Reise über ihn weiß, die Sterne, die alle vergeben haben, sein Bild und seine Dateien sowie die Buttons, mit denen du ihn auf den geöffneten Tag legst, in einer Karten-App öffnest oder in einer Liste speicherst.',
  'help.ctx.trip-place.bullet.1':
    'Klick auf eine Zeile in der Ortsspalte, auf einen Halt in einem Tag oder auf einen Marker auf der Karte, und die Ortskarte öffnet sich über der Karte. Wählst du den Ort in einem Tag aus, weiß die Ortskarte, welchen Halt du meinst, und zeigt deshalb auch die Teilnehmer und die Buchung dieses Halts. Eine Tour (eine Wanderung, eine Fahrt oder ein Spaziergang aus dem Tab „Touren“) öffnet stattdessen eine eigene Tourkarte.',
  'help.ctx.trip-place.bullet.2':
    'Im Kopf stehen das runde Bild, der Name, die Adresse in einer Zeile und Badges für alles, was bekannt ist: geöffnet oder geschlossen, Kategorie, Zeit, Preis, Telefonnummer, E-Mail und Koordinaten. Klick auf das Bild, um ein eigenes Bild oder ein Foto aus den Dateien des Ortes zu verwenden, doppelklick auf den Namen, um den Ort direkt umzubenennen; das X rechts schließt die Karte. Bild, Umbenennen, „Bearbeiten“ und „Löschen“ gibt es nur für Reisende, die Orte ändern dürfen.',
  'help.ctx.trip-place.bullet.3':
    'Darunter: die Sterne, die die Mitreisenden dem Ort gegeben haben, Beschreibung und Notizen und, falls vorhanden, „Notizen für diesen Tag“ für den Stopp.',
  'help.ctx.trip-place.bullet.4':
    'Danach folgen, sofern vorhanden, „Öffnungszeiten“, „Streckenfarbe“, „Streckendaten“ und „Dateien“. Mit „Hochladen“ in der Überschrift „Dateien“ fügst du Dateien von deinem Computer hinzu; die Liste zeigt außerdem die Dateien, die an diesen Halt angeheftet sind, und die seiner Buchung, etwa die Bestätigung eines Hotels. Plugins können darunter eigene Zeilen ergänzen.',
  'help.ctx.trip-place.bullet.5':
    'Die Reihe unten: „Zum Tag hinzufügen“ oder „Vom Tag entfernen“, solange ein Tag geöffnet ist, dann „Navigation“ (oder der Name deiner Karten-App, sobald du in den Einstellungen eine gewählt hast), „Webseite öffnen“ und „In Sammlung speichern“. Rechts löscht der rote Mülleimer den Ort, und Bearbeiten öffnet sein Formular.',
  'help.ctx.trip-place.bullet.6':
    'Bei einem Ort aus der Suche siehst du, was der TREK-Index oder OpenStreetMap über ihn wissen: „Offen“ oder „Geschlossen“ unter den Pillen oben, mit grünem oder rotem Ring um das Bild, gemessen an der Ortszeit des Ortes; seine Telefonnummer ebenfalls als Pille; weiter unten „Öffnungszeiten“ mit den Zeiten des Tages in der Zeile und der ganzen Woche nach einem Klick; und seine Webseite hinter „Webseite öffnen“. Die Google-Bewertung erscheint nur bei einem Ort, der über Google gefunden wurde, auf einem TREK mit Google-Schlüssel. Öffnungszeiten, Telefonnummer und E-Mail, die du selbst ins Formular des Ortes eingetragen hast, haben Vorrang vor den abgerufenen Daten und bestimmen auch den Ring.',
  // read-place
  'help.guide.read-place.title': 'Was die Karte über einen Ort verrät',
  'help.guide.read-place.goal': 'Alles, was die Reise über einen Ort weiß, auf einer Karte sehen.',
  'help.guide.read-place.step.1':
    'Klick in der Tagesspalte auf den Stopp, der dich interessiert. Die Karte öffnet sich über der Karte, und der Stopp bleibt in seinem Tag markiert.',
  'help.guide.read-place.step.2':
    'Der Kopf: das runde Bild, der Name und die Adresse in einer Zeile; der Tooltip zeigt die vollständige Adresse. Die Chips darunter zeigen, ob der Ort gerade „Offen“ oder „Geschlossen“ ist, nach seiner Ortszeit, passend dazu mit einem grünen oder roten Ring um das Bild. Außerdem zeigen sie Kategorie, Uhrzeit, Telefonnummer und E-Mail (ein Klick darauf öffnet deine Telefon- oder Mail-App) und auf einem breiten Bildschirm die genauen Koordinaten. Mit dem X rechts schließt du die Karte wieder.',
  'help.guide.read-place.step.3':
    '„Bewertung“ ist der erste Abschnitt unter der Kopfzeile: die Sterne, die alle Mitreisenden dem Ort gegeben haben, mit Durchschnitt und Anzahl der Stimmen. Solange niemand abgestimmt hat, steht dort „Noch nicht bewertet“.',
  'help.guide.read-place.step.4':
    'Dann folgen die Beschreibung und darunter die Notizen. Beides ist der Text aus dem Formular des Ortes, mit Formatierung: Listen, Links und Fettdruck funktionieren.',
  'help.guide.read-place.step.5':
    'Unter „Teilnehmer“ siehst du, wer zu diesem Stopp mitkommt. Dabei sind alle, bis du jemanden entfernst.',
  'help.guide.read-place.step.6':
    'Weiter unten „Öffnungszeiten“: Die Zeile zeigt die Zeiten des gerade angezeigten Tages. Klick darauf, um die ganze Woche zu sehen, der Tag ist fett hervorgehoben. Daneben findest du „Dateien“.',
  'help.guide.read-place.result':
    'Die Karte bleibt offen, bis du sie mit dem X schließt oder einen anderen Ort wählst. Die Öffnungszeiten der Woche bleiben ausgeklappt, und der zugehörige Stopp bleibt in der Tagesspalte markiert.',
  'help.guide.read-place.tip.1':
    'Wählst du den Ort in der Ortsspalte aus, kennt die Infokarte nur den Ort, nicht den Stopp. Sie zeigt dann keine Teilnehmer und nur die Buchungen, die zum Ort selbst gehören, etwa den Aufenthalt in einem Hotel. Wähle den Stopp im Tag, um alles zu sehen.',
  'help.guide.read-place.tip.2':
    'Wenn du Orte ändern darfst, doppelklicke auf den Namen, um den Ort umzubenennen, ohne das Formular zu öffnen. Enter speichert, Escape verwirft die Änderung.',
  'help.guide.read-place.tip.3':
    'Ein von Hand eingegebener Ort kennt nur, was in seinem Formular steht. Klick auf „Bearbeiten“ und trag „Telefon“, „E-Mail“ und die Öffnungszeiten selbst ein, oder wähl den Ort aus den Vorschlägen unter „Orte durchsuchen…“ und klick auf „Aktualisieren“, damit TREK sie nachschlägt. Für die Google-Bewertung brauchst du einen Google-Schlüssel.',
  // rate-place
  'help.guide.rate-place.title': 'Ort bewerten',
  'help.guide.rate-place.goal': 'Einem Ort eigene Sterne geben und die Bewertungen der anderen sehen.',
  'help.guide.rate-place.step.1':
    'Öffne den Ort. Die Sternzeile steht direkt unter der Kopfzeile und zeigt den Durchschnitt der bisherigen Stimmen, mit der Anzahl in Klammern.',
  'help.guide.rate-place.step.2':
    'Klick auf den gewünschten Stern. Fährst du mit der Maus darüber, füllen sich die Sterne, so siehst du vorab, welche Bewertung du vergibst.',
  'help.guide.rate-place.step.3':
    'Deine Bewertung fließt sofort in den Durchschnitt ein, und die Gesichter daneben zeigen, wer abgestimmt hat. Fahr mit der Maus über die Zeile, um die Sterne aller zu sehen.',
  'help.guide.rate-place.step.4':
    'Derselbe Durchschnitt steht in der Zeile des Ortes in der Orte-Spalte. So findest du die besten Orte in der Liste schnell.',
  'help.guide.rate-place.result':
    'Alle in der Reise sehen deine Sterne am Ort. Mit dem Stern in der Filterzeile über der Liste kannst du jetzt nur Orte ab einer Mindestbewertung anzeigen.',
  'help.guide.rate-place.tip.1':
    'Alle Mitreisenden dürfen bewerten, auch in einer Reise, in der nur einige Orte ändern dürfen.',
  'help.guide.rate-place.tip.2':
    'Klick auf den Stern, den du bereits vergeben hast, um deine Bewertung zu entfernen. Hat niemand den Ort bewertet, steht dort wieder „Noch nicht bewertet“.',
  'help.guide.rate-place.tip.3':
    'Bis zu sechs Abstimmende werden als Gesichter neben den Sternen angezeigt. Der Tooltip listet alle auf und hebt dich hervor.',
  // place-image
  'help.guide.place-image.title': 'Eigenes Bild für einen Ort festlegen',
  'help.guide.place-image.goal': 'Ersetze das automatische Vorschaubild durch ein eigenes Foto.',
  'help.guide.place-image.step.1': 'Öffne den Ort in der Orte-Spalte.',
  'help.guide.place-image.step.2':
    'Fahr mit der Maus über das runde Bild im Kopf: Eine Kamera erscheint, und der Tooltip zeigt „Bild hochladen“. Klick darauf und wähl deine Datei. Hat der Ort unter seinen Dateien schon Fotos, wirst du zuerst gefragt: „Vom Gerät hochladen“ oder eines der Bilder unter „Aus angehängten Dateien“.',
  'help.guide.place-image.step.3':
    'Oben auf der Karte siehst du jetzt dein Bild, mit einem kleinen roten X in der Ecke.',
  'help.guide.place-image.step.4':
    'Dasselbe Bild erscheint auch in der Zeile des Ortes in der Ortsspalte und an seinem Marker auf der Karte.',
  'help.guide.place-image.result':
    'Dein Bild wird überall für den Ort verwendet: auf der Karte, in der Ortsspalte, beim Stopp im Tag, am Marker auf der Karte und in einer geteilten Reise.',
  'help.guide.place-image.tip.1':
    'Unterstützt werden JPG, PNG, GIF und WebP, und ein HEIC-Bild vom iPhone wird beim Hochladen umgewandelt.',
  'help.guide.place-image.tip.2':
    'Mit dem X in der Ecke entfernst du dein Bild, dann erscheint wieder das automatische. Der Ort selbst bleibt unverändert.',
  'help.guide.place-image.tip.3':
    'Hast du kein eigenes Bild gesetzt, sucht TREK anhand der Koordinaten des Ortes eines heraus und zeigt sonst das Icon der Kategorie. Nur Reisende, die Orte ändern dürfen, können ein Bild setzen.',
  // place-day-assign
  'help.guide.place-day-assign.title': 'Ort zum geöffneten Tag hinzufügen oder entfernen',
  'help.guide.place-day-assign.goal':
    'Nutze den Button auf der Karte, statt die Zeile quer durch den Planer zu ziehen.',
  'help.guide.place-day-assign.step.1':
    'Klick in der Tagesspalte auf die Kopfzeile eines Tages. Dieser Tag ist jetzt geöffnet, und die Karte bezieht sich auf ihn.',
  'help.guide.place-day-assign.step.2':
    'Klick in der Ortsspalte auf einen Ort, der nicht an diesem Tag eingeplant ist. Seine Karte öffnet sich, und in der unteren Zeile steht „Zum Tag hinzufügen“.',
  'help.guide.place-day-assign.step.3':
    'Klick auf „Zum Tag hinzufügen“. Der Stopp wird am Ende des Tages eingefügt, und der Button heißt jetzt „Vom Tag entfernen“.',
  'help.guide.place-day-assign.step.4':
    'Der Stopp steht jetzt im Tag, am Ende der Liste. Zieh ihn nach oben an die richtige Stelle.',
  'help.guide.place-day-assign.step.5':
    '„Vom Tag entfernen“ nimmt den Stopp wieder aus dem Tag, und auf der Karte steht wieder „Zum Tag hinzufügen“.',
  'help.guide.place-day-assign.result':
    'Der Stopp wird dem Tag hinzugefügt oder daraus entfernt. Der Ort selbst bleibt unverändert.',
  'help.guide.place-day-assign.tip.1':
    'Den Button gibt es nur, solange ein Tag geöffnet ist. Ohne geöffneten Tag gibt es keinen Tag, dem der Ort hinzugefügt werden könnte.',
  'help.guide.place-day-assign.tip.2':
    'Entfernst du einen Stopp von einem Tag, bleibt der Ort in der Reise und in der Ortsspalte. „Löschen“ entfernt ihn überall.',
  'help.guide.place-day-assign.tip.3':
    'Ein Stopp, den eine Unterkunftsbuchung zum Tag hinzugefügt hat, zeigt keinen der beiden Buttons. Diese Nacht fügst du im Übernachtungsblock des Tages hinzu oder entfernst sie dort.',
  // place-participants
  'help.guide.place-participants.title': 'Festlegen, wer zu diesem Stopp mitkommt',
  'help.guide.place-participants.goal':
    'Festlegen, wer zu einem Stopp mitkommt, ohne zu ändern, wer an der Reise teilnimmt.',
  'help.guide.place-participants.step.1':
    'Klick im Tag auf den Stopp. Die Karte öffnet sich, und unter „Teilnehmer“ stehen alle, die an der Reise teilnehmen.',
  'help.guide.place-participants.step.2':
    'Klick auf den Chip eines Mitreisenden, um ihn aus diesem Stopp zu entfernen. Fährst du mit der Maus über den Chip, wird der Name durchgestrichen.',
  'help.guide.place-participants.step.3':
    'Sobald jemand fehlt, erscheint ein gestricheltes +. Klick darauf, um zu sehen, wer nicht bei diesem Stopp dabei ist.',
  'help.guide.place-participants.step.4':
    'Klick auf einen Namen, um die Person wieder hinzuzufügen. Sind wieder alle dabei, gehört der Stopp wieder der ganzen Gruppe.',
  'help.guide.place-participants.result':
    'Der Stopp zeigt nur die ausgewählten Mitreisenden. Der Rest der Gruppe hat zu dieser Zeit frei.',
  'help.guide.place-participants.tip.1':
    '„Teilnehmer“ erscheint nur, wenn ein Stopp ausgewählt ist. Wähle den Ort also im Tag aus, nicht in der Ortsspalte. Außerdem erscheint es nur in Reisen mit mehr als einem Mitreisenden.',
  'help.guide.place-participants.tip.2':
    'Ist niemand ausgewählt, kommen alle mit. Deshalb kannst du den letzten Mitreisenden nicht von einem Stopp entfernen.',
  'help.guide.place-participants.tip.3': 'Auch ein Gast ohne eigenes Konto kann wie alle anderen Teilnehmer sein.',
  // place-booking
  'help.guide.place-booking.title': 'Buchung an einem Stopp',
  'help.guide.place-booking.goal': 'Sieh die Buchung zu einem Stopp, öffne sie und verknüpf eine neue damit.',
  'help.guide.place-booking.step.1':
    'Öffne den Stopp, zu dem die Buchung gehört. Die Karte führt sie unter „Buchungen“ als eigene kleine Karte auf, mit dem Namen der Buchung und „Bestätigt“ oder „Ausstehend“.',
  'help.guide.place-booking.step.2':
    'Auf der Buchungskarte stehen „Datum“, „Zeit“ und „Buchungscode“, Badges für weitere Angaben der Buchung (eine Flugnummer, ein Gleis, Check-in) und alle Notizen zur Buchung.',
  'help.guide.place-booking.step.3': 'Klick auf die Buchungskarte. Die Buchung öffnet sich über der Karte.',
  'help.guide.place-booking.step.4':
    '„Bearbeiten“ unten in der Buchung öffnet ihr eigenes Formular. Dort verknüpft „Mit Tagesplanung verknüpfen“ eine Buchung mit einem Stopp, und es zeigt bereits diesen Stopp. Schließ das Formular wieder.',
  'help.guide.place-booking.step.5':
    'Eine neue Buchung für einen Stopp legst du in der Tagesspalte an: Fahr mit der Maus über den Stopp und klick auf „Buchung hinzufügen“, das Ticketsymbol an seinem Ende. Das Formular öffnet sich als „Neue Buchung“, bereits mit dem Stopp verknüpft.',
  'help.guide.place-booking.result':
    'Die Buchung ist mit dem Stopp verknüpft: Sie erscheint auf der Karte und im Tag, und ihre Dateien stehen auch hier unter „Dateien“.',
  'help.guide.place-booking.tip.1':
    'Eine Buchung erscheint an dem Halt, an den sie angeheftet ist, und eine Hotelbuchung außerdem überall, wo du das Hotel öffnest. Eine Buchung ohne Halt findest du im Tab „Buchungen“.',
  'help.guide.place-booking.tip.2':
    'Mehrere Buchungen können zu einem Stopp gehören, zum Beispiel ein Mittagessen und eine Tour, die am selben Ort beginnen.',
  'help.guide.place-booking.tip.3':
    'Bei einem Zug, einem Flug oder einer Fähre öffnet Bearbeiten stattdessen das Transportformular, das auch der Tab Transporte nutzt.',
  // place-files
  'help.guide.place-files.title': 'Tickets direkt beim Ort ablegen',
  'help.guide.place-files.goal': 'Ticket, Gutschein oder Karte an den Ort hängen, zu dem sie gehören.',
  'help.guide.place-files.step.1':
    'Öffne den Ort. „Dateien“ steht unter seinen Details, neben den Öffnungszeiten, falls der Ort welche hat, und heißt „Dateien“, solange der Ort noch keine hat.',
  'help.guide.place-files.step.2':
    'Klick rechts neben der Überschrift „Dateien“ auf „Hochladen“ und wähl die Datei aus.',
  'help.guide.place-files.step.3':
    'Der Button zeigt, wie viele Dateien der Ort hat, und die Liste öffnet sich automatisch.',
  'help.guide.place-files.step.4': 'Jede Zeile zeigt Name und Größe der Datei. Klick darauf, um die Datei zu öffnen.',
  'help.guide.place-files.result':
    'Die Datei hängt am Ort und wird auf der Karte mitgezählt. Außerdem erscheint sie im Tab „Dateien“ der Reise.',
  'help.guide.place-files.tip.1':
    '„Dateien“ zeigt auch, was an diesen Halt angeheftet ist und was zu seiner Buchung gehört. So erscheint eine Hotelbestätigung direkt beim Hotel.',
  'help.guide.place-files.tip.2':
    'Beim Hochladen kannst du mehrere Dateien auf einmal wählen, und ein Foto darunter kann zum Bild des Ortes werden.',
  'help.guide.place-files.tip.3':
    'Darfst du keine Dateien hochladen, fehlt der Button „Hochladen“. Dateien, die schon am Ort hängen, siehst du trotzdem.',
  // place-navigation
  'help.guide.place-navigation.title': 'Ort in einer Karten-App oder auf seiner Website öffnen',
  'help.guide.place-navigation.goal': 'Öffne den Ort in der Navigations-App, mit der du hinkommst.',
  'help.guide.place-navigation.step.1': 'Öffne den Ort und klick in der unteren Zeile auf „Navigation“.',
  'help.guide.place-navigation.step.2':
    'Die Liste zeigt die Karten-Apps, die zu diesem Ort passen: Google Maps, Waze, Apple Maps, OpenStreetMap und CoMaps, auf Android außerdem „Andere Karten-App“.',
  'help.guide.place-navigation.step.3':
    'Klick auf die App, die du nutzt. Wo möglich, übergibt TREK der App den Ort selbst und nicht nur seine Koordinaten, damit du am richtigen Eingang ankommst.',
  'help.guide.place-navigation.step.4':
    '„Webseite öffnen“ daneben öffnet die Website des Ortes mit Öffnungszeiten und Tickets in einem neuen Tab.',
  'help.guide.place-navigation.result':
    'Die Karten-App öffnet sich mit dem Ort, die Webseite in einem eigenen Tab, und an der Reise ändert sich nichts. Ist TREK als App installiert, übernimmt die Karten-App statt eines neuen Tabs.',
  'help.guide.place-navigation.tip.1':
    'Waze startet die Navigation sofort. Die anderen Apps öffnen den Ort, und du tippst noch einmal, um die Navigation zu starten.',
  'help.guide.place-navigation.tip.2':
    'Welche Apps angeboten werden, hängt vom Ort und von deinem Gerät ab: Apple Maps fehlt auf Android, 高德地图 erscheint nur bei Orten in China, und Waze, Apple Maps und CoMaps brauchen die Koordinaten des Orts. „Andere Karten-App“ übergibt den Ort an die Karten-App, die auf deinem Android-Handy installiert ist.',
  'help.guide.place-navigation.tip.3':
    'Wähle deine Karten-App einmal in den Einstellungen unter „Orte öffnen in“; dann trägt der Button ihren Namen und öffnet sie direkt. Das macht er auch, wenn für einen Ort nur eine App infrage kommt.',
  // place-to-collection
  'help.guide.place-to-collection.title': 'Ort in einer deiner Listen speichern',
  'help.guide.place-to-collection.goal': 'Speichere einen Ort, den du auf dieser Reise entdeckt hast, für die nächste.',
  'help.guide.place-to-collection.step.1':
    'Öffne den Ort und klick in der Leiste unten auf der Karte auf „In Sammlung speichern“.',
  'help.guide.place-to-collection.step.2':
    '„In Liste speichern“ zeigt alle Listen, die dir gehören oder die mit dir geteilt sind. Ein ausgefülltes Lesezeichen rechts markiert die Listen, in denen dieser Ort schon ist.',
  'help.guide.place-to-collection.step.3': 'Klick auf die Liste. Der Ort wird sofort hinzugefügt.',
  'help.guide.place-to-collection.step.4':
    'Schließ den Dialog mit dem X; der Button in der Karte zeigt jetzt „Gespeichert“.',
  'help.guide.place-to-collection.result':
    'Der Ort ist mit Bild, Notizen und Adresse in deiner Liste, bereit für die nächste Reise.',
  'help.guide.place-to-collection.tip.1':
    'Den Button gibt es nur, solange das Addon „Sammlungen“ aktiv ist. Das schaltet der Admin unter „Addons“ ein.',
  'help.guide.place-to-collection.tip.2':
    'Ein Ort kann gleichzeitig in mehreren Listen sein, mit jeweils eigenem Status: in der einen als Idee, in der anderen als besucht.',
  'help.guide.place-to-collection.tip.3':
    '„Als besucht markieren“, unter dem Namen des Ortes oben in der Auswahl, hakt ihn in der Liste ab; ist der Ort in mehreren deiner Listen, heißt der Button „Überall als besucht“ und hakt ihn überall auf einmal ab. „Ansicht“ öffnet deine Listen in „Sammlungen“.',
  // place-track
  'help.guide.place-track.title': 'Track verstehen und ihm eine eigene Farbe geben',
  'help.guide.place-track.goal':
    'Sieh, wie lang eine importierte Wanderung ist und welche Linie auf der Karte zu ihr gehört.',
  'help.guide.place-track.step.1':
    'In der Orte-Spalte zeigt die Zeile eines Tracks einen kurzen Strich in der Farbe, die der Track auf der Karte hat. Klick darauf.',
  'help.guide.place-track.step.2': '„Streckendaten“ zeigt die Länge des Weges in der eingestellten Einheit.',
  'help.guide.place-track.step.3':
    'Darüber zeigt „Streckenfarbe“ die aktuelle Farbe. Klick auf die Zeile, um die Farbauswahl zu öffnen.',
  'help.guide.place-track.step.4':
    'Wähle eine Farbe. Die Linie auf der Karte und der Strich in der Zeile ändern sich mit.',
  'help.guide.place-track.step.5':
    'Das gestrichelte Feld links, „Automatische Farbe“, gibt dem Track wieder seine Standardfarbe. Die Pipette rechts öffnet die Farbauswahl deines Systems für jede andere Farbe.',
  'help.guide.place-track.result':
    'Der Track wird in der gewählten Farbe angezeigt: auf der Karte des Ortes, in seiner Zeile in der Ortsspalte und auf der Karte.',
  'help.guide.place-track.tip.1':
    'Diese zwei Blöcke hat nur ein Ort mit einem Pfad: einer, der vor Einführung der Touren aus einer GPX-, KML- oder KMZ-Datei importiert wurde, oder einer auf einem TREK, auf dem „Touren“ ausgeschaltet ist. Ist „Touren“ eingeschaltet, wird eine neue GPX-Datei zu einer Tour, die eine eigene Tourkarte öffnet.',
  'help.guide.place-track.tip.2':
    'Wurde ein Track mit Höhendaten aufgezeichnet, siehst du außerdem den höchsten und tiefsten Punkt, die Höhenmeter im Auf- und Abstieg und das Höhenprofil der Wanderung.',
  'help.guide.place-track.tip.3':
    'Beim Import bekommt jeder neue Track eine eigene Farbe. Zwei Wanderungen haben also nie dieselbe Farbe.',
  // read-place
  'help.guide.read-place.step.7':
    'In der Zeile unten findest du, was du von hier aus tun kannst: den Ort auf den geöffneten Tag legen oder von ihm entfernen, ihn in einer Karten-App oder auf seiner Webseite öffnen, ihn in einer Liste speichern und rechts löschen (der rote Papierkorb) oder bearbeiten.',

  // ── Screen: trip-files ────────────────────────────────────────────────────────────────
  'help.ctx.trip-files.title': 'Dateien',
  'help.ctx.trip-files.summary':
    'Alle Dokumente der Reise in einer Liste: Tickets, Bestätigungen, Pässe und Bilder. Jedes hat eine Notiz, eine Verknüpfung zum zugehörigen Ort oder zur Buchung und einen Papierkorb, aus dem du es wiederherstellen kannst.',
  'help.ctx.trip-files.bullet.1':
    '„Dateien hier ablegen“, das gestrichelte Feld unter der Leiste, nimmt die Dateien auf; ein Klick darauf öffnet die Dateiauswahl. Darin stehen die Dateitypen, die dieses TREK annimmt, und die Größengrenze pro Datei (Max. 50 MB, sofern ein Administrator nichts anderes festgelegt hat).',
  'help.ctx.trip-files.bullet.2':
    'In der Leiste oben stehen „Dateien“ und die Filtertabs „Alle“, „PDFs“, „Bilder“ und „Dokumente“, jeweils mit Anzahl. Sobald eine Datei markiert ist, erscheint hinter „Alle“ ein Stern-Tab, und sobald eine Notiz einen Anhang hat, am Ende ein Tab „Collab Notizen“.',
  'help.ctx.trip-files.bullet.3':
    'Eine Zeile zeigt ein Vorschaubild oder den Dateityp, wer die Datei hochgeladen hat, den Namen, die Notiz darunter, die Größe und das Datum sowie ein Badge pro Verknüpfung: den Ort, die Buchung oder den Transport mit Namen (fährst du mit der Maus darüber, steht dort „Tagesplan“, „Buchung“ oder „Transport“) und „Aus Collab Notizen“.',
  'help.ctx.trip-files.bullet.4':
    'Am Ende einer Zeile stehen bis zu fünf Icons, deren Namen erscheinen, wenn du mit der Maus darüberfährst: „Markieren“, „Zuweisen“ (der Stift), „Öffnen“, „Herunterladen“ und „Löschen“. „Löschen“ fragt nicht nach: Die Datei kommt in den Papierkorb und lässt sich von dort wiederherstellen. Offline funktionieren Notizen, Verknüpfungen, Sterne und der Papierkorb weiterhin und werden übertragen, sobald TREK wieder online ist; nur das Hochladen und das Entfernen einer weiteren Verknüpfung brauchen eine Verbindung.',
  'help.ctx.trip-files.bullet.5':
    'Ein Bild oder Video öffnet sich im Vollbild, mit Pfeiltasten-Navigation und einer Reihe von Vorschaubildern. Jedes andere Dokument öffnet sich in einem Dialog, oben mit seinem Namen und darunter „In neuem Tab öffnen“ und „Herunterladen“. Ein Wallet-Pass wird direkt heruntergeladen.',
  'help.ctx.trip-files.bullet.6':
    'Das Papierkorbsymbol rechts in der Leiste („Papierkorb“) zeigt die gelöschten Dateien. Dort kannst du jede einzeln wiederherstellen oder endgültig löschen, und „Papierkorb leeren“ in der Leiste löscht alle. „Dokumentenabgleich“ steht links neben dem Papierkorbsymbol, wenn die Reise mit einem Speicherdienst verbunden ist, oder für den Reise-Eigentümer oder einen Administrator, sobald ein Speicherdienst eingeschaltet ist.',
  // files-upload
  'help.guide.files-upload.title': 'Dokument zur Reise hinzufügen',
  'help.guide.files-upload.goal':
    'Lade ein Ticket, eine Bestätigung oder ein Foto aus deinem Download-Ordner in die Reise hoch, damit alle in der Reise es öffnen können.',
  'help.guide.files-upload.step.1':
    'Öffne die Reise und klick in der Tab-Leiste auf „Dateien“. Dort stehen die Dokumente der Reise, darüber das Feld zum Hochladen.',
  'help.guide.files-upload.step.2':
    'Klicke auf „Dateien hier ablegen“ und wähle eine oder mehrere Dateien. Sie werden nacheinander hochgeladen, und solange das läuft, zeigt das Feld „Wird hochgeladen...“. Im Feld stehen unter „oder klicken zum Auswählen“ die Dateitypen, die dieses TREK annimmt, und die maximale Dateigröße.',
  'help.guide.files-upload.step.3':
    'Ist die letzte Datei hochgeladen, öffnet sich automatisch „Datei zuweisen“ (sofern die Reise Orte oder Buchungen hat), mit dem Dateinamen oben im Dialog. Über „Notiz hinzufügen...“ unter „Notiz“ versiehst du die Datei mit einer Notiz, und mit den Listen darunter verknüpfst du sie mit einem Ort oder einer Buchung. Schließ den Dialog mit dem × oben rechts; dabei geht nichts verloren.',
  'help.guide.files-upload.step.4':
    'Die neuen Dateien erscheinen oben in der Liste; nur markierte Dateien stehen noch darüber. Jede Zeile zeigt, wer die Datei hochgeladen hat, den Namen, die Größe und das Datum. Bilder bekommen ein Vorschaubild, alle anderen Dateien zeigen ihren Typ.',
  'help.guide.files-upload.result':
    'Die Dokumente sind in der Reise, und alle, die die Reise sehen können, können sie öffnen und herunterladen.',
  'help.guide.files-upload.tip.1':
    'Du kannst eine Datei auch direkt vom Desktop auf das Feld ziehen. Solange die Datei darüber ist, wird das Feld hervorgehoben.',
  'help.guide.files-upload.tip.2':
    'Mit Strg+V fügst du ein Bild aus der Zwischenablage direkt in die Liste ein. So musst du einen Screenshot einer Buchung nicht erst speichern.',
  'help.guide.files-upload.tip.3':
    'Zum Hochladen brauchst du die Berechtigung dafür; ohne sie fehlt das Feld ganz. Ein Dateityp, der nicht auf der Liste steht, wird mit einer Meldung abgelehnt, und es wird nichts hochgeladen. Eine Datei über dem Limit (50 MB, sofern ein Administrator nichts anderes festgelegt hat) wird abgelehnt, bevor überhaupt etwas gesendet wird, und die Meldung nennt das Limit. Außerdem brauchst du eine Verbindung: Offline weist TREK darauf hin und lädt nichts hoch.',
  // files-link
  'help.guide.files-link.title': 'Dokument mit einem Ort oder einer Buchung verknüpfen',
  'help.guide.files-link.goal': 'Mach das Ticket auch über den zugehörigen Tag auffindbar, nicht nur über diese Liste.',
  'help.guide.files-link.step.1':
    'Klick auf den Stift am Ende der Zeile („Zuweisen“). „Datei zuweisen“ öffnet sich, mit dem Dateinamen oben im Dialog.',
  'help.guide.files-link.step.2':
    'Unter „Notiz“ kannst du bei „Notiz hinzufügen...“ eine Zeile eingeben, die dann in der Liste unter dem Dateinamen steht. Sie wird gespeichert, sobald du Enter drückst oder das Feld verlässt.',
  'help.guide.files-link.step.3':
    'Links unter „Ort“ siehst du die Orte der Reise, nach Tag mit Datum gruppiert, und am Ende „Nicht zugewiesen“ für Orte ohne Tag. Klick auf einen Ort, um ihn anzuhaken.',
  'help.guide.files-link.step.4':
    'Rechts unter „Buchung“ und „Transport“ stehen die Buchungen der Reise. Klick auf die, zu der das Dokument gehört; auch sie bekommt ein Häkchen.',
  'help.guide.files-link.step.5':
    'Schließ mit dem × oben rechts. Einen Speichern-Button gibt es hier nicht: Jeder Klick wurde sofort gespeichert.',
  'help.guide.files-link.result':
    'Die Zeile zeigt die Notiz und ein Abzeichen pro Verknüpfung: eins mit dem Namen des Ortes und eins mit dem Namen des Flugs. Fährst du mit der Maus über ein Abzeichen, steht dort „Tagesplan“ oder „Transport“. Das Dokument hängt jetzt auch am Ort und am Flug.',
  'help.guide.files-link.tip.1':
    'Eine Datei kann mehrere Verknüpfungen gleichzeitig haben. Dieselbe Bestätigung kann also zur Buchung des Hotels und zum Ort des Hotels gehören.',
  'help.guide.files-link.tip.2':
    'Klickst du einen angehakten Eintrag erneut an, wird diese Verknüpfung entfernt, die Datei selbst bleibt. Offline warten die Notiz und neue Häkchen und werden gesendet, sobald TREK wieder online ist; nur das Entfernen einer weiteren Verknüpfung braucht eine Verbindung.',
  'help.guide.files-link.tip.3':
    'Das funktioniert auch andersherum: Ein Dokument, das an einem Ort oder einer Buchung hängt, steht ebenfalls in dieser Liste, mit demselben Badge in seiner Zeile.',
  // files-star
  'help.guide.files-star.title': 'Wichtige Dokumente oben halten',
  'help.guide.files-star.goal':
    'Die wenigen Dokumente markieren, die du wirklich brauchst, damit du sie in einer langen Liste schnell findest.',
  'help.guide.files-star.step.1':
    'Klick auf den Stern am Ende einer Zeile („Markieren“). Er wird golden, vor dem Dateinamen erscheint ein zweiter Stern, und fährst du mit der Maus über den Button, steht dort jetzt „Markierung entfernen“.',
  'help.guide.files-star.step.2':
    'Die Liste wird neu sortiert: Markierte Dateien stehen über allen anderen, innerhalb jeder Gruppe die neuesten zuerst.',
  'help.guide.files-star.step.3':
    'In den Filter-Tabs der Leiste erscheint jetzt direkt nach „Alle“ ein Stern mit der Anzahl der markierten Dateien. Klick darauf, um nur diese Dateien zu sehen.',
  'help.guide.files-star.result':
    'Markierte Dateien stehen oben in der Liste, und ein Tab zeigt nur die markierten Dateien.',
  'help.guide.files-star.tip.1':
    'Den Stern-Tab gibt es nur, solange eine Datei markiert ist. Entfernst du die Markierung der letzten Datei, verschwindet der Tab.',
  'help.guide.files-star.tip.2':
    'Zum Markieren brauchst du dasselbe Recht wie zum Zuweisen, „Datei-Metadaten bearbeiten“. Mitglieder ohne dieses Recht sehen die Sterne, aber ein Klick auf „Markieren“ bewirkt bei ihnen nichts.',
  // files-filter
  'help.guide.files-filter.title': 'Dokument in der Liste finden',
  'help.guide.files-filter.goal': 'Nur die Art von Dokumenten anzeigen, die du suchst.',
  'help.guide.files-filter.step.1':
    'Die Filter-Tabs findest du oben in der Leiste neben „Dateien“: „Alle“, PDFs, „Bilder“ und „Dokumente“, jeweils mit der Anzahl der Dateien.',
  'help.guide.files-filter.step.2': 'Klick auf „PDFs“: Die Liste zeigt nur noch die PDF-Dateien.',
  'help.guide.files-filter.step.3':
    'Zwei weitere Tabs erscheinen nur, wenn die Reise passende Dateien hat. Klick auf „Collab Notizen“. Dieser Tab erscheint, sobald eine Notiz im Tab „Collab“ einen Anhang hat, und die Liste zeigt dann nur diese Dateien. Genauso erscheint ein Stern-Tab, sobald eine Datei markiert ist.',
  'help.guide.files-filter.step.4': '„Alle“ zeigt wieder die ganze Liste.',
  'help.guide.files-filter.result':
    'Die Liste zeigt nur die Dateien des gewählten Tabs, und die Zahl an jedem Tab gibt an, wie viele es sind.',
  'help.guide.files-filter.tip.1':
    'Ordner gibt es hier nicht, und umbenennen kannst du Dateien auch nicht. Um Dokumente auseinanderzuhalten, nutze die Notiz in „Datei zuweisen“, die Verknüpfungen mit Orten und Buchungen und den Stern.',
  'help.guide.files-filter.tip.2':
    'Die Liste ist immer so sortiert: zuerst markierte Dateien, dann die neuesten. Ein heute hochgeladenes Dokument steht also über einem vom letzten Monat.',
  // files-preview
  'help.guide.files-preview.title': 'Dokument lesen, ohne TREK zu verlassen',
  'help.guide.files-preview.goal':
    'Sieh dir ein Ticket oder Bild sofort an und lade es auf dein Gerät herunter, wenn du es dort brauchst.',
  'help.guide.files-preview.step.1':
    'Klick auf den Namen oder das Vorschaubild eines Bildes. Es öffnet sich im Vollbild; oben links stehen der Dateiname und die Position unter den Bildern. Ein Video öffnet sich genauso und wird dort abgespielt.',
  'help.guide.files-preview.step.2':
    'Mit den runden Pfeilen an den Seiten, den Pfeiltasten links und rechts oder der Miniaturleiste unten blätterst du durch alle Bilder, die die Liste gerade zeigt.',
  'help.guide.files-preview.step.3':
    '„In neuem Tab öffnen“ und „Herunterladen“ sind die runden Buttons oben rechts neben dem ×. Klick auf das ×, drück Escape oder klick auf den dunklen Hintergrund, um das Bild zu schließen.',
  'help.guide.files-preview.step.4':
    'Ein Dokument, das kein Bild ist, öffnet sich stattdessen in einem Dialog: oben sein Name, darunter „In neuem Tab öffnen“ und „Herunterladen“ als Badges und bei einem PDF darunter die Seite selbst. Das × oben rechts, Escape oder ein Klick neben den Dialog schließt ihn.',
  'help.guide.files-preview.step.5':
    'Der Pfeil am Ende einer Zeile („Herunterladen“) speichert die Datei direkt auf deinem Gerät, ohne sie vorher zu öffnen.',
  'help.guide.files-preview.result':
    'Das Dokument wird auf dem Bildschirm angezeigt, und mit denselben zwei Buttons öffnest du es in einem Browser-Tab oder speicherst es auf deiner Festplatte.',
  'help.guide.files-preview.tip.1': 'Auf Touchscreens wischst du durch die Bilder, statt auf die Pfeile zu klicken.',
  'help.guide.files-preview.tip.2':
    'Wallet-Pässe öffnen nie eine Vorschau. Sie werden sofort heruntergeladen, damit dein Smartphone sie in der Wallet-App öffnen kann.',
  'help.guide.files-preview.tip.3':
    '„In neuem Tab öffnen“ und „Herunterladen“ laden die Datei beide mit deiner Sitzung. Ein aus der Adressleiste kopierter Link funktioniert für andere also nicht.',
  // files-trash
  'help.guide.files-trash.title': 'Dokument löschen und wiederherstellen',
  'help.guide.files-trash.goal':
    'Löschen, was die Reise nicht mehr braucht, und Dateien wiederherstellen, die du doch noch brauchst.',
  'help.guide.files-trash.step.1':
    'Klick auf den Papierkorb am Ende einer Zeile („Löschen“). Die Datei verschwindet sofort aus der Liste, und die Meldung „In den Papierkorb verschoben“ erscheint. Eine Rückfrage gibt es nicht.',
  'help.guide.files-trash.step.2':
    'Das Papierkorbsymbol rechts in der Leiste („Papierkorb“) zeigt die gelöschten Dateien. Der Titel der Leiste lautet dann „Papierkorb“, und die Filtertabs und das Upload-Feld sind ausgeblendet.',
  'help.guide.files-trash.step.3':
    'Zeilen im Papierkorb sind ausgegraut und haben zwei Symbole: „Wiederherstellen“ holt die Datei zurück, „Löschen“ entfernt sie nach einer Rückfrage endgültig.',
  'help.guide.files-trash.step.4':
    'Klick auf „Wiederherstellen“. Die Meldung „Datei wiederhergestellt“ erscheint, und die Datei verschwindet aus dem Papierkorb. Notiz und Verknüpfungen bleiben erhalten.',
  'help.guide.files-trash.step.5':
    '„Papierkorb leeren“ in der Leiste neben dem Papierkorb-Symbol löscht alles endgültig, was noch im Papierkorb liegt. Der Browser fragt vorher einmal nach. Das Papierkorb-Symbol wechselt zurück zu den Dateien.',
  'help.guide.files-trash.result': 'Die Datei steht wieder an ihrer alten Stelle in der Liste.',
  'help.guide.files-trash.tip.1':
    '„Löschen“ in einer Zeile fragt nicht nach, und genau dafür gibt es den Papierkorb: Nichts wird endgültig aus TREK entfernt, bevor du es hier bestätigst. Das alles funktioniert auch offline und wird übertragen, sobald TREK wieder online ist.',
  'help.guide.files-trash.tip.2':
    'Zum Löschen und Wiederherstellen brauchst du das Recht, Dateien zu löschen. Mitglieder ohne dieses Recht sehen weder „Löschen“ in der Zeile noch die Buttons im Papierkorb.',
  'help.guide.files-trash.tip.3': 'Eine im Papierkorb endgültig gelöschte Datei lässt sich nicht wiederherstellen.',
  // files-sync
  'help.guide.files-sync.title': 'Dokumente mit deinem Speicherdienst abgleichen',
  'help.guide.files-sync.goal':
    'Verbinde die Reise mit deinem eigenen Dokumentenspeicher, damit hier hochgeladene Dateien dort gespeichert werden und dort gespeicherte hier erscheinen.',
  'help.guide.files-sync.step.1':
    'Klick auf „Dokumentenabgleich“ neben dem Papierkorb-Symbol rechts in der Leiste. Der Dialog öffnet sich, unter dem Titel steht der Name der Reise. Links unter „Anbieter verbinden“ stehen die Speicher, die die Administration eingeschaltet hat, jeweils mit einer Zeile dazu, wie sie Dateien ablegen: Paperless-ngx und Papra per Tag, Nextcloud und Synology Drive in einem Ordner, OpenCloud in einem Space. Rechts steht „Noch nichts verbunden“.',
  'help.guide.files-sync.step.2':
    'Klick auf deinen Speicher, hier Nextcloud. Ein kleinerer Dialog für die Verbindung öffnet sich. Er trägt den Namen des Speichers und fragt die Anmeldedaten ab, die dieser Speicher braucht.',
  'help.guide.files-sync.step.3':
    'Trag die „Adresse“ und die Zugangsdaten des Speicherdienstes ein: ein „API-Token“ für Paperless-ngx, einen „API-Schlüssel“ und die „Organisations-ID“ für Papra, „Benutzername“ und ein „App-Passwort“ für Nextcloud, „Benutzername“ und ein „App-Token“ für OpenCloud und für Synology Drive „Benutzername“, „Passwort“ und, falls das Konto einen verlangt, einen „Zwei-Faktor-Code“. Nutze ein App-Passwort oder Token, wo immer der Dienst eines anbietet, nie dein Kontopasswort. Nextcloud und Synology Drive akzeptieren außerdem einen optionalen „Basisordner“, in dem TREK nach Reiseordnern sucht, hier /Reisen. „Selbstsigniertes Zertifikat zulassen“ ganz unten ist nur für einen Dienst in deinem eigenen Netzwerk mit einem solchen Zertifikat gedacht.',
  'help.guide.files-sync.step.4':
    'Klick auf „Verbindung testen“. TREK verbindet sich mit deinen Angaben mit dem Speicherdienst, und in der Fußzeile steht „Erreicht, angemeldet als“ und der Kontoname. Werden die Zugangsdaten abgelehnt oder ist die Adresse nicht erreichbar, steht das stattdessen dort. In beiden Fällen wird nichts gespeichert.',
  'help.guide.files-sync.step.5':
    'Klick auf „Verbinden“. Die Verbindung wird mit der Reise gespeichert, und TREK fragt, wo im Speicherdienst die Dokumente der Reise liegen sollen: in welchem Tag, Ordner oder Space. Abgeglichen wird nur, was dort liegt. „Neu anlegen“ erstellt ihn, sobald du auf „Erstellen“ klickst, mit einem Namen aus dem Reisetitel. Unter „Oder etwas Vorhandenes nehmen“ siehst du die bestehenden. Klick einen an, hier den Ordner Autumn in Japan.',
  'help.guide.files-sync.step.6':
    'Der Dialog öffnet sich erneut: Dein Speicherdienst steht links unter „Diese Reise“, und seine Karte rechts zeigt, wohin abgeglichen wird, wann der letzte Abgleich lief, und „Jetzt abgleichen“. Der erste Abgleich startet automatisch; mit „Jetzt abgleichen“ startest du jederzeit einen neuen. Nach einem Abgleich wird aus dem Badge „Noch nicht abgeglichen“ neben dem Namen ein grüner Punkt, der beim Darüberfahren „Im Gleichstand“ zeigt. Der Flussbalken zeigt, wie viele Dokumente TREK und der Speicherdienst jeweils haben, dazwischen die Spuren „Raus zum Speicher“ und „Rein vom Speicher“. Schließ den Dialog mit dem × oben rechts.',
  'help.guide.files-sync.result':
    'Die Dokumente, die schon im Speicher lagen, erscheinen oben in der Liste, hochgeladen in deinem Namen. Jedes Dokument der Reise liegt auch im Speicher, außer denen aus „Collab Notizen“. Ab jetzt prüft TREK den Speicher im Hintergrund, und Änderungen in der Liste werden in den Speicher übernommen.',
  'help.guide.files-sync.tip.1':
    'Nur der Besitzer der Reise oder ein Instanz-Admin kann eine Reise verbinden, denn die Zugangsdaten geben Zugriff auf das ganze Konto beim Speicher. Ist die Reise verbunden, sehen alle Mitglieder „Dokumentenabgleich“, können ihn öffnen, die Karte lesen und auf „Jetzt abgleichen“ klicken.',
  'help.guide.files-sync.tip.2':
    'Ein Speicher in deinem eigenen Netzwerk braucht ALLOW_INTERNAL_NETWORK=true auf dem TREK-Server, und seine Adresse muss die Netzwerkadresse des Rechners sein, nie localhost. Sonst antwortet „Verbindung testen“ mit „Diese Adresse ist nicht erlaubt.“',
  'help.guide.files-sync.tip.3':
    '„Trennen“, das Symbol neben „Jetzt abgleichen“, fragt einmal nach. Dann wird die Verbindung beendet, und alle Dokumente bleiben auf beiden Seiten erhalten. Verbindest du einen Tag, Ordner oder Space ein zweites Mal, behandelt TREK ihn als neu und importiert alles darin erneut. Verbinde nach dem Trennen also einen leeren, nicht den alten.',

  // ── Screen: trip-day-detail ───────────────────────────────────────────────────────────
  'help.ctx.trip-day-detail.title': 'Tagesdetails',
  'help.ctx.trip-day-detail.summary':
    'Das Panel, das sich über der Karte öffnet, wenn du auf die Kopfzeile eines Tages klickst. Es zeigt den Tag im Überblick: Name und Datum, das Wetter dort, wo du sein wirst, die Buchungen des Tages und die dafür gebuchten Nächte.',
  'help.ctx.trip-day-detail.bullet.1':
    'Klick in der Tagesspalte auf die Kopfzeile eines Tages, und das Panel öffnet sich über der Kartenmitte. Ein weiterer Klick auf dieselbe Kopfzeile oder auf das X rechts schließt es und hebt die Auswahl des Tages auf. Öffnest du einen Ort, aus der Ortsspalte oder auf der Karte, schließt sich das Panel, und stattdessen erscheint der Ort.',
  'help.ctx.trip-day-detail.bullet.2':
    'In der Kopfzeile stehen Name und Datum des Tages. Mit dem Stift neben dem Namen benennst du den Tag um. Der Doppelpfeil klappt das Panel zu einer schmalen Leiste ein, damit du die Karte wieder siehst.',
  'help.ctx.trip-day-detail.bullet.3':
    'Ganz oben siehst du das Wetter des Tages. „Vorhersage für“ zeigt, für welchen Ort die Vorhersage gilt: den ersten Stopp des Tages oder das Hotel, in dem du morgens aufwachst.',
  'help.ctx.trip-day-detail.bullet.4':
    '„Reservierungen“ listet die Buchungen dieses Tages, jeweils mit Art, zugehörigem Halt und Uhrzeiten. Grün bedeutet bestätigt, Gelb noch ausstehend; ÖPNV-Fahrten sind blau und haben keinen Status. Ein Klick auf eine Zeile öffnet die Buchung.',
  'help.ctx.trip-day-detail.bullet.5':
    'Unterkunft zeigt jede Nacht, die für diesen Tag gebucht ist, mit Check-in und Check-out an den jeweiligen Tagen, dem Check-in-Zeitraum, der Check-out-Zeit und der Bestätigungsnummer. Gehört zur Unterkunft eine Buchung, nennt darunter ein Feld „Reservierung“ die Buchung mit „Ausstehend“ oder „Bestätigt“. Klicke darauf, um die Buchung zu öffnen.',
  'help.ctx.trip-day-detail.bullet.6':
    '„Unterkunft hinzufügen“ bucht eine Nacht an diesem Tag: Wähl die Unterkunft aus den Orten der Reise, gib an, welche Tage sie abdeckt, und trag Zeiten und Code ein. Auch das + im Kopf eines Tages (Tooltip „Zum Tag hinzufügen“) bietet „Unterkunft hinzufügen“: Es öffnet dieses Panel mit bereits geöffnetem Formular.',
  // day-panel
  'help.guide.day-panel.title': 'Tag öffnen und Details ansehen',
  'help.guide.day-panel.goal':
    'Sieh einen ganzen Tag mit Wetter, Buchungen und Unterkunft, ohne die Karte zu verlassen.',
  'help.guide.day-panel.step.1':
    'Klick in der Tage-Spalte auf die Kopfzeile eines Tages. Der Tag wird ausgewählt, und seine Details öffnen sich mittig über der Karte.',
  'help.guide.day-panel.step.2':
    'Die Kopfzeile zeigt den Namen des Tages, „Tag 1“, bis du ihm einen Namen gibst, und darunter das Datum.',
  'help.guide.day-panel.step.3':
    'Ganz oben steht das Wetter des Tages. „Vorhersage für“ zeigt, für welchen Ort es gilt: den ersten Stopp des Tages oder das Hotel, in dem du die Nacht davor verbracht hast.',
  'help.guide.day-panel.step.4': 'Darunter listet „Reservierungen“ die Buchungen dieses Tages mit ihren Uhrzeiten auf.',
  'help.guide.day-panel.step.5':
    '„Unterkunft“ zeigt die über diesen Tag gebuchten Nächte, mit „Check-in“ und „Check-out“ an den jeweiligen Tagen.',
  'help.guide.day-panel.step.6':
    'Der Doppelpfeil in der Kopfzeile klappt das Panel zu einer schmalen Leiste ein. Das X daneben schließt das Panel und hebt die Auswahl des Tages auf.',
  'help.guide.day-panel.result':
    'Klappst du das Panel zur Leiste ein, ist die Karte frei und der Tag bleibt ausgewählt. Schließt du es, wird die Auswahl aufgehoben und der Plan bleibt, wie er war.',
  'help.guide.day-panel.tip.1':
    'Ein Klick irgendwo auf die Kopfleiste des Panels klappt es ebenfalls ein. Der Pfeil ist nur eine Möglichkeit dafür.',
  'help.guide.day-panel.tip.2':
    'Öffnest du einen Ort aus der Ortsspalte oder auf der Karte, schließt sich das Panel des Tages, und stattdessen erscheinen die Details des Ortes. Klick wieder auf die Kopfzeile des Tages, um den Tag zurückzuholen.',
  // day-weather
  'help.guide.day-weather.title': 'Wetter des Tages ablesen',
  'help.guide.day-weather.goal': 'Das Wetter für den Ort sehen, an dem du an diesem Tag tatsächlich bist.',
  'help.guide.day-weather.step.1':
    '„Vorhersage für“ zeigt den Ort, für den die Werte gelten: den ersten Stopp des Tages oder, an einem Tag ohne Stopp, das Hotel, in dem du die Nacht davor verbringst.',
  'help.guide.day-weather.step.2':
    'Die große Zahl ist die Tagestemperatur. Daneben stehen Tiefst- und Höchstwert und die Wetterlage in Worten.',
  'help.guide.day-weather.step.3':
    'Die Badges rechts daneben zeigen die Regenwahrscheinlichkeit, die Regenmenge, den stärksten Wind sowie Sonnenaufgang und Sonnenuntergang.',
  'help.guide.day-weather.step.4':
    'Ganz unten siehst du den Tag im Zwei-Stunden-Takt: Uhrzeit, Symbol, Temperatur und Regenwahrscheinlichkeit. Stunden über 50 Prozent sind blau hinterlegt.',
  'help.guide.day-weather.result':
    'Auch die Tageskarte in der Tage-Spalte zeigt das Wetter klein unter ihrer Nummer. So siehst du das Wetter der ganzen Reise auf einen Blick.',
  'help.guide.day-weather.tip.1':
    'Grad und Wind richten sich nach der „Temperatureinheit“ unter „Allgemein“ in den Einstellungen: Wählst du °F Fahrenheit, wird dieselbe Vorhersage in °F und mph angezeigt.',
  'help.guide.day-weather.tip.2':
    'Ein Tag ohne Stopp mit Standort und ohne Hotel aus der Nacht davor zeigt gar kein Wetter: Die Vorhersage gilt immer für einen Ort, nie für die ganze Reise.',
  'help.guide.day-weather.tip.3':
    'Mehr als 16 Tage im Voraus gibt es keine Vorhersage. Dann zeigt TREK die Durchschnittswerte früherer Jahre für dieses Datum. Sie sind mit Ø gekennzeichnet, und ein Hinweis darunter erklärt das.',
  // rename-day
  'help.guide.rename-day.title': 'Tag benennen',
  'help.guide.rename-day.goal': 'Einem Tag einen Namen wie „Ankunft in Kyoto“ oder „Ruhetag“ statt „Tag 5“ geben.',
  'help.guide.rename-day.step.1': 'Öffne den Tag. In der Kopfzeile steht „Tag 5“, darunter das Datum.',
  'help.guide.rename-day.step.2': 'Klick auf den Stift neben dem Namen.',
  'help.guide.rename-day.step.3': 'Der Name wird zum Eingabefeld. Gib den gewünschten Namen ein.',
  'help.guide.rename-day.step.4':
    'Drück Enter oder klick irgendwo anders hin. Mit Escape verwirfst du die Änderung. Auch die Tageskarte in der Tagesspalte zeigt den Namen.',
  'help.guide.rename-day.result':
    'Der Name ersetzt „Tag 5“ im Panel und auf der Tageskarte in der Tagesspalte; das Datum bleibt gleich.',
  'help.guide.rename-day.tip.1':
    'Leerst du das Feld und speicherst, heißt der Tag wieder „Tag 5“: Ohne Namen wird die Nummer angezeigt.',
  'help.guide.rename-day.tip.2':
    'Der Name gehört zum Tag, nicht zu seinem Datum. Sortierst du die Tage um, wandert der Name mit allem anderen dieses Tages mit.',
  // add-accommodation
  'help.guide.add-accommodation.title': 'Übernachtung für einen Tag buchen',
  'help.guide.add-accommodation.goal':
    'Trag das Hotel einmal in den Plan ein, mit den Tagen, für die es gilt, den Zeiten und der Bestätigungsnummer.',
  'help.guide.add-accommodation.step.1':
    'Die Unterkunft muss zuerst ein Ort der Reise sein. Leg sie wie jeden anderen Ort in der Orte-Spalte an: Die Auswahl bietet nur Orte an, die es schon gibt.',
  'help.guide.add-accommodation.step.2':
    'Öffne deinen Anreisetag und klick unter „Unterkunft“ auf „Unterkunft hinzufügen“.',
  'help.guide.add-accommodation.step.3':
    '„Auf Tage anwenden“ legt fest, welche Nächte der Aufenthalt umfasst: „Beginn“ ist der Check-in-Tag, „Ende“ der Check-out-Tag, und „Alle“ umfasst die ganze Reise. Oben im Dialog siehst du den Zeitraum und die Anzahl der Nächte.',
  'help.guide.add-accommodation.step.4':
    'Füll „Check-in“, „Bis“ und „Check-out“ aus und trag die Buchungsnummer unter „Bestätigung“ ein. Alle vier Felder dürfen leer bleiben.',
  'help.guide.add-accommodation.step.5':
    'Wähle die Unterkunft unter „Unterkunft auswählen“. Mit „Kategorie“ über der Liste grenzt du sie auf eine Kategorie ein.',
  'help.guide.add-accommodation.step.6': 'Klick auf „Speichern“.',
  'help.guide.add-accommodation.result':
    'Der Aufenthalt erscheint an jedem Tag, den er umfasst, mit Check-in am ersten und Check-out am letzten Tag. Die Unterkunft wird am Check-in-Tag zu einem Halt, sodass die Karte den Weg dorthin zeichnet, und im Tab „Buchungen“ erscheint eine Hotelbuchung.',
  'help.guide.add-accommodation.tip.1':
    'Die Auswahl startet mit dem Tag, von dem du kommst, und dem Check-out am Folgetag. Beides kannst du vor dem Speichern ändern.',
  'help.guide.add-accommodation.tip.2':
    'Gib dem Hotel beim Anlegen die Kategorie „Hotel“. Dann zeigt „Kategorie“ über der Liste mit einem Klick nur deine Hotels.',
  'help.guide.add-accommodation.tip.3':
    'Alle Zeiten sind optional: Auch ein Aufenthalt ohne Check-in und ohne Code gilt für seine Nächte, und seine Route wird trotzdem gezeichnet.',
  // edit-accommodation
  'help.guide.edit-accommodation.title': 'Gebuchte Nacht ändern oder stornieren',
  'help.guide.edit-accommodation.goal':
    'Einen Aufenthalt verschieben, seine Zeiten korrigieren oder ihn aus dem Plan entfernen.',
  'help.guide.edit-accommodation.step.1':
    'Die Karte zeigt die Unterkunft und ihre Adresse, Check-in oder Check-out mit Uhrzeit an den jeweiligen Tagen, die Bestätigungsnummer und unter „Reservierung“ die zugehörige Buchung.',
  'help.guide.edit-accommodation.step.2':
    'Der Stift rechts daneben, „Unterkunft bearbeiten“, öffnet den Aufenthalt erneut. Das Popup heißt jetzt „Unterkunft bearbeiten“.',
  'help.guide.edit-accommodation.step.3':
    'Korrigiere „Check-in“, „Bis“, „Check-out“ und „Bestätigung“. Auch die Tage darüber und die Unterkunft darunter kannst du hier ändern.',
  'help.guide.edit-accommodation.step.4': 'Klick auf „Speichern“.',
  'help.guide.edit-accommodation.step.5':
    'Das X neben dem Stift, „Entfernen“, beendet den Aufenthalt. Es gibt keine Rückfrage, und die zugehörige Hotelbuchung wird mit entfernt.',
  'help.guide.edit-accommodation.result':
    'Die Änderung gilt sofort für jeden Tag des Aufenthalts und ebenso für die Hotelbuchung im Tab „Buchungen“.',
  'help.guide.edit-accommodation.tip.1':
    'Nächte mitten in einem Aufenthalt tragen weder „Check-in“ noch „Check-out“. Diese Kennzeichnung haben nur der erste und der letzte Tag des Zeitraums.',
  'help.guide.edit-accommodation.tip.2':
    'Stornierst du einen Aufenthalt, werden auch der Stopp, den er am Check-in-Tag angelegt hat, und alle mit der Buchung verknüpften Kosten entfernt. War das ein Versehen, buch die Nacht einfach neu.',
  // day-bookings
  'help.guide.day-bookings.title': 'Buchungen des Tages auf einen Blick',
  'help.guide.day-bookings.goal': 'Auf einen Blick sehen, was für diesen Tag schon gebucht und ob es bestätigt ist.',
  'help.guide.day-bookings.step.1':
    '„Reservierungen“ listet die Buchungen des Tages: die, die auf diesen Tag datiert sind, und die, die an einen seiner Halte geheftet sind. Eine Buchung, die an einen Halt an einem anderen Tag geheftet ist, erscheint nur bei diesem Halt.',
  'help.guide.day-bookings.step.2':
    'Jede Zeile zeigt die Art der Buchung, ihren Namen und, falls sie zu einem Stopp gehört, diesen Stopp in Grau dahinter. Rechts stehen die Uhrzeiten, vor dem Statuspunkt.',
  'help.guide.day-bookings.step.3':
    'Die Farbe zeigt den Stand einer Buchung: Grün heißt bestätigt, Gelb noch ausstehend, und ÖPNV-Fahrten sind blau, ohne Status. Hotels stehen nicht in dieser Liste, sie haben weiter unten einen eigenen Block.',
  'help.guide.day-bookings.step.4':
    'Klicke auf eine Zeile, um die Buchung zu öffnen. Mit dem Badge in ihrem Kopf schaltest du zwischen „Ausstehend“ und „Bestätigt“ um, Bearbeiten unten ändert den Rest. Neue Buchungen legst du im Tab Buchungen an, Transporte im Tab Transporte.',
  'help.guide.day-bookings.result':
    'Alles, was auf diesen Tag datiert oder mit einem seiner Stopps verknüpft ist, steht in dieser Liste.',
  'help.guide.day-bookings.tip.1':
    'Eine Buchung erscheint an dem Tag, der ihrem Datum entspricht. Änderst du das Datum im Tab „Buchungen“ oder „Transporte“, wandert sie automatisch auf den anderen Tag.',
  'help.guide.day-bookings.tip.2':
    'Fehlt der Block „Reservierungen“, hat der Tag keine Buchungen: Er wird dann ausgeblendet statt leer angezeigt.',
  'help.guide.map-lock.title': 'Karte sperren',
  'help.guide.map-lock.goal': 'Halte die Karte fest, während du dich durch Tage und Orte klickst.',
  'help.guide.map-lock.step.1':
    'Das Schloss ist der obere der beiden runden Buttons unten links auf der Karte; fährst du darüber, steht dort „Kartenansicht fixieren“. Klick darauf. Solange es geschlossen ist, zoomt oder verschiebt sich die Karte nicht mehr, wenn du einen Tag öffnest oder einen Ort wählst, und der Button heißt jetzt „Karte der Auswahl folgen lassen“.',
  'help.guide.map-lock.result': 'Die Karte bleibt, wo du sie gelassen hast, während du den Plan durchgehst.',
  'help.guide.map-lock.tip.1':
    'Klicke noch einmal auf das Schloss, jetzt „Karte der Auswahl folgen lassen“, und die Karte folgt wieder dem, was du auswählst. Das Schloss gibt es nur am Computer; auf dem Handy folgt die Karte immer.',

  // ── Screen: trip-map ──────────────────────────────────────────────────────────────────
  'help.ctx.trip-map.title': 'Karte',
  'help.ctx.trip-map.summary':
    'Die Mitte des Plans: jeder Ort der Reise als Pin, jede Tour als Linie, die Routen dazwischen und an den Kartenrändern die Schalter, mit denen du die Ansicht sperrst, auf Satellit wechselst, die ganze Reise auf einmal zeigst oder die Orte rund um den Stadtteil einblendest, den du gerade ansiehst.',
  'help.ctx.trip-map.bullet.1':
    'Ein Pin steht für einen Ort: mit seinem eigenen Foto, falls er eins hat, sonst in seiner Kategoriefarbe mit dem Kategorie-Symbol. Fährst du mit der Maus darüber, erscheint eine Karte mit Bild, Name und Adresse, dazu Bewertung und Kategorie, sofern vorhanden. Zieh einen Pin auf eine Tageskarte, um den Ort dort einzuplanen. Eine Unterkunft, deren Buchung noch aussteht, erscheint blass mit gestricheltem Ring.',
  'help.ctx.trip-map.bullet.2':
    'Pins, die so nah beieinanderliegen, dass man sie nicht unterscheiden kann, werden zu einem dunklen Kreis mit einer Zahl zusammengefasst. Klicke auf den Kreis, und die Karte zoomt auf die enthaltenen Pins. Ist „Kompakte Markierungen für ungeplante Orte“ eingeschaltet (Einstellungen > Allgemein, unter „Reise & Karte“), erscheinen Orte, die noch keinem Tag zugeordnet sind, als kleine Punkte ohne Foto, damit die geplanten Stopps hervorstechen.',
  'help.ctx.trip-map.bullet.3':
    'Klick auf eine Stecknadel, um den Ort in einer Karte unten auf der Landkarte zu öffnen, mit Bewertung, Dateien und den nächsten Aktionen. Ein Klick auf eine freie Stelle der Karte schließt sie wieder.',
  'help.ctx.trip-map.bullet.4':
    'Ist in der Tagesspalte ein Tag geöffnet, tragen seine Halte ein kleines weißes Badge mit ihrer Nummer an diesem Tag; ein Ort, der zweimal am Tag vorkommt, trägt beide Nummern. Die Filter über der Ortsliste („Anzeigen“, die Kategorien und der Stern für eine Mindestbewertung) grenzen auch die Pins auf der Karte ein.',
  'help.ctx.trip-map.bullet.5':
    'Die Symbolleiste oben durchsucht den sichtbaren Kartenausschnitt: Restaurants, Cafés, Bars & Nachtleben, Unterkunft, Sehenswürdigkeiten, Museen & Kultur, Natur & Parks und Aktivitäten. Kategorien aus Plugins folgen nach einem dünnen Trennstrich, und ist die Leiste breiter als die Karte, scrollst du sie mit dem Mausrad seitwärts. „Diesen Bereich durchsuchen“ startet die Suche neu, nachdem du die Karte verschoben hast.',
  'help.ctx.trip-map.bullet.6':
    'Ein Rechtsklick irgendwo auf der Karte öffnet das Ortsformular für diese Stelle, die Adresse ist schon ermittelt. Unten links gibt es zwei runde Buttons: Das Schloss, „Kartenansicht fixieren“, hält den Kartenausschnitt fest, während du dich durch Tage und Orte klickst, und der Button darunter, „Zur Satellitenansicht wechseln“, ersetzt die gezeichnete Karte durch Luftbilder.',
  'help.ctx.trip-map.bullet.7':
    '„Ganze Reise anzeigen“ unten rechts zeichnet alle Reisetage auf einmal und listet auf, welche Strecke jeder Tag abdeckt. Das Routensymbol in der Zeile einer Buchung zeichnet diese Buchung, das Routensymbol in der Werkzeugleiste über den Tagen alle Buchungen. Klick auf das Ende einer gezeichneten Buchung, um ihre Details zu öffnen.',
  'help.ctx.trip-map.bullet.8':
    'Ist das Dawarich-Addon aktiv, zeigt der runde Dawarich-Button unter „Ganze Reise anzeigen“ die Route, die dein Handy tatsächlich aufgezeichnet hat. „Aufgezeichnete Route anzeigen“ legt sie als gestrichelte Linie unter die geplante Route, in einer Farbe pro Tag. Erscheint keine Linie, nennt die Beschriftung des Buttons den Grund.',
  // map-markers
  'help.guide.map-markers.title': 'Karte verstehen',
  'help.guide.map-markers.goal': 'Verstehen, was jeder Pin, jedes Badge und jede Blase auf der Karte bedeutet.',
  'help.guide.map-markers.step.1':
    'Die Karte zeigt alle Orte der Reise. Liegen Pins zu dicht beieinander, um sie zu unterscheiden, werden sie zu einem dunklen Kreis mit der Anzahl der Pins zusammengefasst. Klick auf den Kreis, und die Karte zoomt auf diese Pins oder fächert sie bei der stärksten Zoomstufe auf.',
  'help.guide.map-markers.step.2':
    'Ein Pin zeigt das Foto des Ortes, wenn es eines gibt, sonst die Kategoriefarbe mit dem Kategorie-Icon. Ein Aufenthalt, dessen Buchung noch aussteht, erscheint blass mit gestricheltem Ring. Lässt du den Mauszeiger auf einem Pin ruhen, öffnet sich daneben eine Karte: dasselbe Foto in groß, Name und Adresse sowie Bewertung und Kategorie, sofern der Ort welche hat.',
  'help.guide.map-markers.step.3':
    'Klick auf einen Pin, und der Ort öffnet sich in einer Infokarte unten über der Karte: oben Bild, Name und Adresse, darunter die Sterne, die Beschreibung und die Dateien, auch die seiner Buchung. Unten findest du, was du als Nächstes damit tun kannst: „Zum Tag hinzufügen“, solange ein Tag geöffnet ist („Vom Tag entfernen“, wenn der Ort schon an diesem Tag ist), „Navigation“, „Webseite öffnen“, „In Sammlung speichern“ („Gespeichert“, sobald er in einer Sammlung ist) und rechts den Papierkorb und „Bearbeiten“. Mit dem X oben oder einem Klick auf eine leere Stelle der Karte schließt du sie wieder.',
  'help.guide.map-markers.step.4':
    'Öffnest du in der Tage-Spalte einen Tag, werden seine Stopps nummeriert: Das kleine weiße Abzeichen an der Ecke einer Stecknadel zeigt die Position des Stopps im Tag. Kommt ein Ort zweimal im Tag vor, zeigt er beide Nummern. Ist kein Tag geöffnet, gibt es keine Nummern. Dann steht in der Ecke die Bewertung des Ortes, falls er eine hat.',
  'help.guide.map-markers.step.5':
    'Zieh eine Stecknadel von der Karte auf eine Tageskarte in der Tage-Spalte, und der Ort ist für diesen Tag eingeplant, genau wie beim Ziehen seiner Zeile aus der Orteliste.',
  'help.guide.map-markers.result':
    'An der Reise hat sich nichts geändert: Die Karte zeigt die Reise nur an. Jede Stecknadel zeigt, um welchen Ort es geht, an welchem Tag er liegt und an welcher Stelle.',
  'help.guide.map-markers.tip.1':
    'Klappst du einen Tag in der Tagesspalte ein, werden seine Stopps auf der Karte ausgeblendet. Klapp ihn wieder auf, um sie anzuzeigen.',
  'help.guide.map-markers.tip.2':
    'Die Filter über der Ortsliste bestimmen auch, was auf der Karte erscheint: „Anzeigen“ („Ungeplant“, „Geplant“), die Kategorien unter dem Button mit dem Etikett-Symbol und eine Mindestbewertung unter dem Stern blenden Pins aus. Der Länderfilter wirkt nur auf die Liste.',
  'help.guide.map-markers.tip.3':
    'Diese Karte hat keine Zoom-Buttons: Mit dem Mausrad zoomst du, ein Doppelklick zoomt eine Stufe hinein, und durch Ziehen verschiebst du die Karte.',
  // map-nearby-places
  'help.guide.map-nearby-places.title': 'Orte in der Umgebung auf der Karte finden',
  'help.guide.map-nearby-places.goal':
    'Im angezeigten Stadtteil nach Restaurants, Sehenswürdigkeiten oder einem Hotel suchen und eines davon zur Reise hinzufügen.',
  'help.guide.map-nearby-places.step.1':
    'Die Icon-Reihe oben auf der Karte ist die Kategoriesuche: Restaurants, Cafés, Bars & Nachtleben, Unterkunft, Sehenswürdigkeiten, Museen & Kultur, Natur & Parks und Aktivitäten. Kategorien aus Plugins folgen nach einem schmalen Trenner; fahr mit der Maus über ein Icon, um seinen Namen zu sehen.',
  'help.guide.map-nearby-places.step.2':
    'Klick auf eine Kategorie. TREK sucht im sichtbaren Kartenausschnitt nach Orten dieser Art und setzt für jeden Treffer eine Stecknadel in der Farbe der Kategorie. Es ist immer nur eine Kategorie aktiv: Ein Klick auf eine andere ersetzt sie, ein Klick auf die aktive schaltet sie aus.',
  'help.guide.map-nearby-places.step.3':
    'Verschiebst du die Karte, erscheint unter der Zeile ein zweiter Button: „Diesen Bereich durchsuchen“ startet dieselbe Suche für den neuen Ausschnitt. Das Verschieben allein löst keine neue Suche aus. So bleibt die Zahl der Anfragen gering.',
  'help.guide.map-nearby-places.step.4':
    'Fahr mit dem Mauszeiger über einen Pin, um zu sehen, was gefunden wurde. Klick darauf, und das Ortsformular öffnet sich bereits ausgefüllt: der Name im Kopf des Dialogs, „Adresse“, „Breitengrad“ und „Längengrad“ sowie Webseite und Telefonnummer, sofern die Suche sie gefunden hat.',
  'help.guide.map-nearby-places.step.5':
    'Prüf, was automatisch ausgefüllt wurde, und ergänze, was die Suche nicht wissen konnte. Die Kategorie unter dem Namen ist schon gesetzt, wenn die Reise eine passende Kategorie hat, etwa „Restaurant“ für ein Restaurant; sonst steht dort „Keine Kategorie“, bis du eine wählst. Füg eine „Beschreibung“ und eigene Notizen hinzu.',
  'help.guide.map-nearby-places.step.6':
    'Klick auf „Hinzufügen“. Gibt es in der Reise schon einen Ort mit gleichem Namen oder an derselben Stelle, weist TREK dich darauf hin, und der Button wird zu „Trotzdem hinzufügen“.',
  'help.guide.map-nearby-places.result':
    'Der Ort steht in der Ortsliste und als eigener Pin der Reise auf der Karte, unter „Ungeplant“, bis du ihn einem Tag zuordnest. Die Suchpins bleiben, bis du die Kategorie ausschaltest.',
  'help.guide.map-nearby-places.tip.1':
    'Die Reihe fehlt, wenn „Orte auf der Karte entdecken“ unter Einstellungen > Allgemein im Bereich „Reise & Karte“ ausgeschaltet ist.',
  'help.guide.map-nearby-places.tip.2':
    'Die Ergebnisse stammen aus dem TREK-Ortsindex und von OpenStreetMap. Das ist also eine der wenigen Funktionen im Plan, die eine Verbindung braucht.',
  'help.guide.map-nearby-places.tip.3':
    'Eine Suche umfasst nur den sichtbaren Kartenausschnitt, zoom also auf die Straße, die dich interessiert. Eine Suche über eine ganze Stadt liefert nur die ersten sechzig Ergebnisse, ohne klare Reihenfolge.',
  // map-add-place
  'help.guide.map-add-place.title': 'Ort per Rechtsklick auf die Karte anlegen',
  'help.guide.map-add-place.goal': 'Setz einen Ort genau dorthin, wo du ihn haben willst, ohne ihn vorher zu suchen.',
  'help.guide.map-add-place.step.1':
    'Klick mit der rechten Maustaste auf die Stelle auf der Karte. Das Ortsformular öffnet sich mit der Überschrift „Ort/Aktivität hinzufügen“.',
  'help.guide.map-add-place.step.2':
    '„Breitengrad“ und „Längengrad“ sind schon auf diesen Punkt gesetzt. TREK schlägt die Koordinaten nach und trägt unter „Adresse“ ein, was es dort findet. Findet die Suche einen Namen, trägt TREK ihn auch oben im Dialog ein. Gespeichert ist noch nichts, korrigiere also, was nicht stimmt.',
  'help.guide.map-add-place.step.3':
    'Gib oben im Dialog einen Namen ein, unter dem du den Ort wiedererkennst. Wähle darunter eine Kategorie; bis dahin steht dort „Keine Kategorie“. Ergänze dann alles Weitere für den Plan: „Beschreibung“, „Notizen“, „Website“.',
  'help.guide.map-add-place.step.4':
    'Klick auf „Hinzufügen“. Der Ort kommt als ungeplant in die Liste, auch wenn ein Tag geöffnet ist: Ein Rechtsklick auf die Karte legt den Standort fest, nicht den Tag.',
  'help.guide.map-add-place.result':
    'Der Ort steht in der Liste und auf der Karte, unter „Ungeplant“, bis du ihn einem Tag zuordnest.',
  'help.guide.map-add-place.tip.1':
    'Die Adresse wird anhand der Koordinaten ermittelt. Sie kann daher eher eine Straße als einen Namen zeigen und in freier Landschaft auch leer sein. Du kannst beide Felder überschreiben.',
  'help.guide.map-add-place.tip.2':
    'Auf den Karten von MapLibre GL und Mapbox GL geht das auch mit der mittleren Maustaste, auf Touchscreens durch langes Drücken.',
  // map-satellite
  'help.guide.map-satellite.title': 'Zur Satellitenansicht wechseln',
  'help.guide.map-satellite.goal': 'Wechsle von der normalen Karte zu Luftbildern und zurück.',
  'help.guide.map-satellite.step.1':
    'Der Schalter für die Grundkarte ist der untere der beiden runden Buttons unten links auf der Karte, unter dem Schloss. Sein Symbol zeigt immer die Ansicht, zu der er wechselt, und der Tooltip nennt sie: „Zur Satellitenansicht wechseln“. Klick darauf.',
  'help.guide.map-satellite.step.2':
    'Die Karte zeigt jetzt Luftbilder. Sie sind so detailliert, dass du einzelne Gebäude erkennst, und du brauchst keinen eigenen Schlüssel. Alles, was TREK zeichnet, bleibt obendrauf: die Pins, die Route des Tages, die Tracks und die Buchungsrouten.',
  'help.guide.map-satellite.step.3':
    'Der Button heißt jetzt „Zur Kartenansicht wechseln“. Klick darauf, um zur Kartenansicht zurückzukehren.',
  'help.guide.map-satellite.result':
    'Die Karte wird neu gezeichnet, und die gewählte Ebene wird in deinem Konto gespeichert.',
  'help.guide.map-satellite.tip.1':
    'Die Auswahl wird in deinem Konto gespeichert, nicht in der Reise. So öffnet sich jede Reise so, wie du sie verlassen hast, egal welchen Karten-Renderer du nutzt.',
  'help.guide.map-satellite.tip.2':
    'Satellitenbilder haben keine Beschriftung: Straßennamen, Stadtteile und Hausnummern gibt es nur auf der normalen Karte. Schalte also zurück, wenn du eine Adresse suchst.',
  // map-whole-trip
  'help.guide.map-whole-trip.title': 'Ganze Reise und Entfernungen ansehen',
  'help.guide.map-whole-trip.goal':
    'Statt nur des geöffneten Tages alle Reisetage anzeigen und sehen, wie weit du an jedem Tag unterwegs bist.',
  'help.guide.map-whole-trip.step.1':
    'Der runde Button „Ganze Reise anzeigen“ sitzt unten rechts auf der Karte. Klick darauf, und alle Reisetage werden auf einmal gezeichnet, jeder in seiner eigenen Farbe, damit du benachbarte Tage unterscheiden kannst.',
  'help.guide.map-whole-trip.step.2':
    'Die Karte über dem Button listet diese Tage auf: ein Farbpunkt, der Name des Tages, ein Symbol für jedes Verkehrsmittel an diesem Tag und die zurückgelegte Strecke. Ganz oben steht die „Gesamtstrecke“.',
  'help.guide.map-whole-trip.step.3':
    'Klick in der Karte auf einen Tag, um ihn auszuwählen: Seine Zeile wird hinterlegt, und der Tag öffnet sich in der Tage-Spalte. Dreh das Mausrad über einer Stadt, um hineinzuzoomen. Die Tage, die durch die Stadt führen, erscheinen nebeneinander, jeder in seiner Farbe.',
  'help.guide.map-whole-trip.step.4':
    'Der Button heißt jetzt „Ganze Reise ausblenden“. Klick darauf, um wieder nur den geöffneten Tag zu sehen.',
  'help.guide.map-whole-trip.result':
    'Jeder Reisetag erscheint in seiner eigenen Farbe, und die Karte zeigt, was jeder Tag abdeckt und was die Reise insgesamt ergibt.',
  'help.guide.map-whole-trip.tip.1':
    'Die Summe wird etappenweise berechnet. Solange dahinter … steht, ist die Zahl nur eine Teilsumme. Endgültig ist sie, wenn alle Etappen berechnet sind.',
  'help.guide.map-whole-trip.tip.2':
    'Kann der Router eine Etappe nicht berechnen, bleibt sie eine gerade Linie und wird nicht mitgezählt. Die Karte weist darauf hin, damit die Summe nicht unbemerkt zu niedrig wirkt.',
  'help.guide.map-whole-trip.tip.3':
    'Ein Tag mit weniger als zwei Stopps mit Standort und ohne Fahrt zum oder vom Hotel hat keine Route und erscheint deshalb gar nicht in der Karte.',
  // map-booking-routes
  'help.guide.map-booking-routes.title': 'Route einer Buchung auf der Karte anzeigen',
  'help.guide.map-booking-routes.goal':
    'Zeig deine gebuchten Flüge, Züge und Autofahrten auf der Karte an und blende sie wieder aus.',
  'help.guide.map-booking-routes.step.1':
    'Buchungsrouten sind ausgeschaltet, bis du eine einschaltest. Rechts in der Zeile eines Transports in der Tage-Spalte findest du ein kleines Routensymbol: „Buchungsrouten anzeigen“.',
  'help.guide.map-booking-routes.step.2':
    'Klick darauf, und die Buchung erscheint auf der Karte: ein Flug als Großkreisbogen, eine Autofahrt entlang der echten Straßen, ein Zug als Kette seiner Bahnhöfe. „Bestätigt“ wird durchgezogen dargestellt, „Ausstehend“ gestrichelt, und die Enden der Route sind blaue Badges mit dem Symbol des Verkehrsmittels.',
  'help.guide.map-booking-routes.step.3':
    'Klick auf eine der Endmarken, und die Details der Buchung öffnen sich: Status, Typ und Tage als Badges im farbigen Kopf, die Zeiten an beiden Enden, der Rest darunter. Unten stehen „Auf Karte“, das diese Route wieder ausblendet, „Route ändern“ bei einer ÖPNV-Verbindung, der Papierkorb zum Löschen der Buchung und „Bearbeiten“. Das X im Kopf schließt die Details.',
  'help.guide.map-booking-routes.step.4':
    'Das Routensymbol in der Leiste über den Tagen wirkt auf die ganze Reise: „Alle Buchungsrouten anzeigen“ zeichnet jede Buchung, die eine Route hat.',
  'help.guide.map-booking-routes.step.5':
    'Das ersetzt deine bisherige Auswahl, einzeln eingeschaltete Buchungsrouten werden also zurückgesetzt. Klick erneut, jetzt heißt der Button „Alle Buchungsrouten ausblenden“, um alle Buchungsrouten auszublenden.',
  'help.guide.map-booking-routes.result':
    'Die gewünschten Buchungen werden auf der Karte gezeichnet, und die Auswahl bleibt für diese Reise in diesem Browser erhalten, bis du sie änderst.',
  'help.guide.map-booking-routes.tip.1':
    'Den Flughafencode oder den Namen des Bahnhofs zeigen die Enden nur, wenn „Orts-Labels auf Buchungsrouten“ unter Einstellungen > Allgemein im Bereich „Reise & Karte“ eingeschaltet ist; sonst zeigen sie nur das Icon.',
  'help.guide.map-booking-routes.tip.2':
    '„Buchungsrouten immer anzeigen“ im selben Abschnitt zeigt sie von Anfang an auf jeder Reise, bei der du noch keine eigene Wahl getroffen hast.',
  'help.guide.map-booking-routes.tip.3':
    'Damit eine Buchung gezeichnet werden kann, braucht sie Start und Ziel mit Koordinaten. Hotels oder Restaurants haben deshalb kein Routensymbol.',
  // map-dawarich-trail
  'help.guide.map-dawarich-trail.title': 'Tatsächlich zurückgelegte Route anzeigen',
  'help.guide.map-dawarich-trail.goal':
    'Zeig die Route, die Dawarich auf deinem Smartphone aufgezeichnet hat, als gestrichelte Linie neben deiner geplanten Route auf der Karte und sieh Tag für Tag, wie die Reise wirklich verlaufen ist.',
  'help.guide.map-dawarich-trail.step.1':
    'Der runde Dawarich-Button sitzt unten rechts auf der Karte, unter „Ganze Reise anzeigen“. Fährst du mit der Maus darüber, steht dort „Aufgezeichnete Route anzeigen“. Klick darauf. TREK fragt bei deinem Dawarich die Daten für den Reisezeitraum ab, und ein Ring dreht sich um den Button, solange TREK auf die Antwort wartet.',
  'help.guide.map-dawarich-trail.step.2':
    'Die aufgezeichnete Route erscheint als gestrichelte Linie, in einer Farbe pro Tag, unter der geplanten Route, damit der Plan lesbar bleibt. Der Button heißt jetzt „Aufgezeichnete Route ausblenden“. Jeder Tag endet um Mitternacht Ortszeit. Klappst du einen Tag in der Tagesspalte ein, werden seine gestrichelte Linie und seine Stopps auf der Karte ausgeblendet.',
  'help.guide.map-dawarich-trail.step.3':
    'Klick zusätzlich auf „Ganze Reise anzeigen“, dann wird jeder geplante Tag als durchgezogene Linie neben der gestrichelten Aufzeichnung gezeichnet. Wo beide Linien übereinstimmen, lief der Tag wie geplant. Wo die gestrichelte Linie von der geplanten Route abweicht, nicht.',
  'help.guide.map-dawarich-trail.result':
    'Geplantes und tatsächlich Erlebtes siehst du zusammen auf der Karte, als gestrichelte und durchgezogene Linien. Die Karte über den Buttons listet weiterhin die geplanten Tage und ihre Entfernungen.',
  'help.guide.map-dawarich-trail.tip.1':
    'Ob die Route an oder aus ist, wird pro Reise in deinem Konto gespeichert und gilt damit in jedem Browser und auf jedem Gerät. Solange sie eingeschaltet ist, fragt TREK alle zwei Minuten neu bei Dawarich an, sodass sich eine laufende Reise ohne Neuladen der Seite aktualisiert. Die Route selbst wird nie gespeichert: Sie steht weder in der Datenbank von TREK noch in Backups und ist offline nicht verfügbar.',
  'help.guide.map-dawarich-trail.tip.2':
    'Die Beschriftung des Buttons verrät, warum die Karte leer ist: „Aufgezeichnete Route wird geladen…“ während des Ladens, „An diesen Tagen wurde nichts aufgezeichnet“, „Die aufgezeichnete Route konnte nicht geladen werden“ oder „Die aufgezeichnete Route braucht eine Verbindung“, wenn TREK offline ist.',
  // map-compass
  'help.guide.map-compass.title': 'Karte drehen und wieder nach Norden ausrichten',
  'help.guide.map-compass.goal':
    'Die Karte in deine Fahrtrichtung drehen und sie mit einem Klick wieder nach Norden ausrichten.',
  'help.guide.map-compass.step.1':
    'Dreh die Karte, indem du mit gedrückter rechter Maustaste ziehst oder Strg gedrückt hältst und mit der linken ziehst; auf einem Touchscreen drehst du mit zwei Fingern. Der runde Kompass neben der Reihe der Kategoriesymbole oben auf der Karte dreht sich mit: Sein Pfeil zeigt immer nach Norden und neigt sich also um denselben Winkel wie die Karte.',
  'help.guide.map-compass.step.2':
    'Klick auf den Kompass. Der Button „Reset north“ dreht die Karte zurück, sodass Norden oben ist, macht die Ansicht wieder flach, und der Pfeil zeigt wieder nach oben.',
  'help.guide.map-compass.result':
    'Die Karte ist wieder nach Norden ausgerichtet und flach. An der Reise hat sich nichts geändert: Der Kompass ändert nur die Ansicht.',
  'help.guide.map-compass.tip.1':
    'Den Kompass gibt es nur auf den Karten von MapLibre GL und Mapbox GL. Die Leaflet-Karte lässt sich nicht drehen und hat deshalb keinen. Welche Karte du nutzt, legst du in den Einstellungen unter „Karte“ bei „Kartenanbieter“ fest, mit „Karte speichern“ übernimmst du die Auswahl.',
  'help.guide.map-compass.tip.2':
    'Der Klick hebt auch die Neigung auf. Zieh mit der rechten Maustaste nach oben oder unten, um die Ansicht zu neigen. „Reset north“ richtet sie wieder flach aus und setzt die Drehung zurück. Auf Mapbox GL mit eingeschaltetem „3D-Gebäude & Terrain“ wird dabei auch die 3D-Ansicht flach, bis du sie wieder neigst.',

  // ── Screen: trip-collab ───────────────────────────────────────────────────────────────
  'help.ctx.trip-collab.title': 'Collab', // same-as-en
  'help.ctx.trip-collab.summary':
    'Der Tab, in dem die Gruppe gemeinsam plant, mit fünf Karten: links der Chat, daneben „Notizen“ und „Links“, darunter „Umfragen“ und „Nächstes“. Alles, was hier geschrieben wird, erscheint sofort bei allen anderen Mitgliedern, ohne Neuladen.',
  'help.ctx.trip-collab.bullet.1':
    'Der Chat ist die linke Karte. Schreib in „Nachricht eingeben...“ und drück Enter; Umschalt und Enter erzeugen eine neue Zeile. Mit dem Smiley fügst du ein Emoji ein, und „Bilder anhängen“ hängt bis zu vier Bilder an die Nachricht.',
  'help.ctx.trip-collab.bullet.2':
    'Fahr mit der Maus über eine Nachricht, um „Antworten“ und bei deinen eigenen Nachrichten „Löschen“ zu sehen. Per Rechtsklick erreichst du die acht Schnellreaktionen. Statt einer gelöschten Nachricht steht ein Hinweis, wer sie gelöscht hat.',
  'help.ctx.trip-collab.bullet.3':
    '„Notizen“ ist der gemeinsame Notizblock: „Neue Notiz“ in der Kopfzeile legt eine Notiz an, das Zahnrad daneben öffnet „Kategorien verwalten“ für Namen und Farben. Sobald es Kategorien gibt, filtert eine Reihe von Chips unter der Kopfzeile die Karten: „Alle“ oder eine Kategorie. Eine Notizkarte zeigt ihre Kategorie als farbigen Punkt und ihren Link als runden Button, und ihre drei Punkte („Weitere Optionen“) enthalten „Erweitern“, „Anheften“, „Bearbeiten“ und „Löschen“.',
  'help.ctx.trip-collab.bullet.4':
    'Unter „Links“ sammelst du die Webadressen der Reise. „Link hinzufügen“ braucht einen Titel und eine http- oder https-Adresse. „Link bearbeiten“, „Link anheften“ und „Link löschen“ findest du am Ende des Chips. Angeheftete Links bleiben vorne.',
  'help.ctx.trip-collab.bullet.5':
    'Mit Umfragen trefft ihr Entscheidungen. „Neue Umfrage“ stellt eine Frage mit mindestens zwei Optionen. Klick auf eine Option, um dafür abzustimmen. Das Schloss („Schließen“) und der Papierkorb („Löschen“) rechts in der Kopfzeile einer Umfrage beenden die Abstimmung oder löschen die Umfrage.',
  'help.ctx.trip-collab.bullet.6':
    '„Nächstes“ listet die noch anstehenden Stopps der Reise auf, bis zu acht, mit Uhrzeit und den Personen, die dabei sind. Es liest nur den Tagesplan aus; die Uhrzeiten legst du dort fest.',
  // write-note
  'help.guide.write-note.title': 'Gemeinsame Notiz schreiben',
  'help.guide.write-note.goal':
    'Was die ganze Gruppe braucht, etwa eine Regel, eine Adresse oder eine Erinnerung, dort ablegen, wo alle es finden.',
  'help.guide.write-note.step.1':
    'Klick in der Kopfzeile der Karte „Notizen“ auf „Neue Notiz“. Der Notizdialog öffnet sich, der Cursor steht schon im Titelfeld.',
  'help.guide.write-note.step.2':
    'Gib oben im Dialog bei „Notiztitel“ den Titel ein. Er ist das einzige Pflichtfeld: „Erstellen“ bleibt ausgegraut, bis der Titel Text enthält, und Enter im Titelfeld legt die Notiz sofort an.',
  'help.guide.write-note.step.3':
    '„Inhalt“ enthält den Text und unterstützt Markdown: ein fettes Wort, eine Liste, eine Überschrift. Die Karte zeigt die ersten drei Zeilen, „Erweitern“ in ihrem Menü öffnet die ganze Notiz.',
  'help.guide.write-note.step.4':
    'Wähle unter „Kategorie“ die Kategorie, zu der die Notiz gehört; ihre Farbe färbt jetzt den Kopf des Dialogs und später den Kopf der Karte. Die erste Kategorie ist bereits ausgewählt. Zur Auswahl stehen die vorhandenen Kategorien, eine neue legst du unter „Kategorien verwalten“ an. Solange die Reise noch keine Kategorien hat, fehlt diese Zeile.',
  'help.guide.write-note.step.5':
    'Unter „Website“ trägst du einen Link ein, der zur Notiz gehört. Die Karte zeigt dann oben einen runden Link-Button, der ihn öffnet.',
  'help.guide.write-note.step.6':
    'Klick auf „Erstellen“. Nur „Abbrechen“ und das Kreuz schließen den Dialog, ein Klick daneben oder Esc löscht also nicht, was du geschrieben hast.',
  'help.guide.write-note.result':
    'Die Notiz erscheint als Karte im Bereich „Notizen“, oben in der Farbe ihrer Kategorie, und alle anderen Mitglieder sehen sie sofort.',
  'help.guide.write-note.tip.1':
    'Die drei Punkte auf einer Karte („Weitere Optionen“) öffnen „Erweitern“, „Anheften“, „Bearbeiten“ und „Löschen“. „Anheften“ hält die Notiz oben im Bereich, mit einem Rahmen in ihrer Farbe. Alle anderen Notizen sind nach ihrer letzten Änderung sortiert.',
  'help.guide.write-note.tip.2':
    'Das Zahnrad neben „Neue Notiz“ öffnet „Kategorien verwalten“. Dort kannst du einer Kategorie eine Farbe geben, sie überall auf einmal umbenennen oder sie anlegen, bevor eine Notiz sie nutzt. Geändert wird erst, wenn du auf „Speichern“ klickst.',
  'help.guide.write-note.tip.3':
    'Mit „Dateien anhängen“ hängst du ein Dokument an die Notiz, sofern du Dateien in die Reise hochladen darfst. „Anhängen“ öffnet die Dateiauswahl; ein Bild oder PDF kannst du auch einfach in den Dialog einfügen.',
  'help.guide.write-note.tip.4':
    '„Notizen“ hat unter „Addons“ einen eigenen Schalter, unterhalb von Collab: Ein Admin kann die Notizen abschalten und Chat, Links, Umfragen und „Was kommt als Nächstes“ weiterlaufen lassen.',
  // shared-links
  'help.guide.shared-links.title': 'Links der Reise sammeln',
  'help.guide.shared-links.goal':
    'Halte Buchungsportal, geteiltes Album und Fahrplan an einem Ort, damit du nicht im Chat danach suchen musst.',
  'help.guide.shared-links.step.1':
    'Klick in der Kopfzeile der Karte „Links“ auf „Link hinzufügen“. Der Dialog öffnet sich, und der Cursor steht im obersten Feld.',
  'help.guide.shared-links.step.2':
    'Gib bei „Linktitel“ den Namen ein, füge darunter bei „Verknüpfen“ die Adresse ein und klick auf „Link speichern“.',
  'help.guide.shared-links.step.3':
    'Der Chip zeigt den Namen und die verlinkte Website. Klick darauf, um die Seite in einem neuen Tab zu öffnen.',
  'help.guide.shared-links.step.4':
    'Die drei runden Buttons am Ende sind „Link bearbeiten“, „Link anheften“ und „Link löschen“. „Link anheften“ schiebt den Chip an den Anfang des Bereichs und zeigt ihn in der Akzentfarbe. „Link löschen“ fragt vorher nach, weil der Link für alle Mitglieder entfernt wird.',
  'help.guide.shared-links.result':
    'Der Link erscheint als Chip im Links-Panel, vorne angeheftet, und ist sofort bei allen Mitgliedern zu sehen.',
  'help.guide.shared-links.tip.1':
    'Es werden nur http- oder https-Adressen angenommen. Alles andere wird abgelehnt, und der Dialog bleibt mit deiner Eingabe geöffnet.',
  'help.guide.shared-links.tip.2':
    'Angeheftete Links stehen zuerst, dann die neuesten. Das kleine Symbol neben einem Titel ist das Favicon der Website, direkt von ihr geladen. Ohne Internet zeigt der Chip stattdessen ein einfaches Link-Symbol.',
  'help.guide.shared-links.tip.3':
    '„Links“ hat unter „Addons“ einen eigenen Schalter, unterhalb von Collab. Ein Admin kann den Bereich also ausschalten, ohne den Rest des Tabs anzutasten.',
  // create-poll
  'help.guide.create-poll.title': 'Die Gruppe fragen',
  'help.guide.create-poll.goal':
    'Aus einer Frage, die im Chat niemand beantwortet, eine Umfrage machen, bei der alle abstimmen können.',
  'help.guide.create-poll.step.1':
    'Klick in der Kopfzeile der Karte „Umfragen“ auf „Neue Umfrage“. Der Dialog öffnet sich.',
  'help.guide.create-poll.step.2':
    'Schreib die Frage unter „Frage“. „Markdown wird unterstützt“ unter dem Feld bedeutet, dass Fettdruck, Zeilenumbrüche und kurze Listen hier funktionieren.',
  'help.guide.create-poll.step.3':
    'Füll unter „Optionen“ die Felder „Option 1“ und „Option 2“ aus. Du brauchst mindestens zwei nicht leere Optionen, und eine Option darf mehrere Zeilen haben.',
  'help.guide.create-poll.step.4':
    '„Option hinzufügen“ darunter fügt eine dritte, vierte und so viele weitere Optionen hinzu, wie du brauchst. Das kleine Kreuz neben einer Zeile, das ab mehr als zwei Optionen erscheint, entfernt diese Option.',
  'help.guide.create-poll.step.5':
    'Mit „Mehrfachauswahl“ kann jeder mehr als eine Option ankreuzen. Ist sie aus, wandert die Stimme einer Person zur neuen Option, wenn sie sich umentscheidet.',
  'help.guide.create-poll.step.6': 'Klick auf „Umfrage erstellen“.',
  'help.guide.create-poll.result':
    'Die Umfrage erscheint oben im Bereich „Umfragen“, offen und mit 0 Stimmen in der Kopfzeile.',
  'help.guide.create-poll.tip.1': 'Die Frage wird als Markdown dargestellt, die Optionen bleiben reiner Text.',
  'help.guide.create-poll.tip.2':
    '„Umfrage erstellen“ bleibt ausgegraut, bis es eine Frage und mindestens zwei Optionen mit Text gibt.',
  'help.guide.create-poll.tip.3':
    'Eine Frist lässt sich nur in der Smartphone-App setzen. Eine Umfrage mit Frist zeigt die verbleibende Zeit in einem bernsteinfarbenen Chip in der Kopfzeile und wird geschlossen, sobald die Zeit abgelaufen ist.',
  'help.guide.create-poll.tip.4':
    '„Umfragen“ hat unter „Addons“ einen eigenen Schalter, unterhalb von Collab: Ein Admin kann die Umfragen abschalten und die anderen vier Panels eingeschaltet lassen.',
  // vote-poll
  'help.guide.vote-poll.title': 'Abstimmen und Ergebnis ansehen',
  'help.guide.vote-poll.goal': 'Abstimmen, die Ergebnisse der Gruppe sehen und deine Stimme ändern.',
  'help.guide.vote-poll.step.1':
    'Klick auf die gewünschte Option. Ihr Kreis zeigt ein Häkchen, die Option bekommt einen Rahmen in der Akzentfarbe, und der Balken dahinter wächst.',
  'help.guide.vote-poll.step.2':
    'Jetzt siehst du das ganze Ergebnis: Der Balken zeigt den Anteil, rechts steht der Prozentwert, und die kleinen Kreise sind die Personen, die diese Option gewählt haben, bis zu drei.',
  'help.guide.vote-poll.step.3':
    'Umentschieden? Klick auf eine andere Option. Bei einer Umfrage ohne „Mehrfachauswahl“ wandert deine Stimme zur neuen Option, statt dass eine zweite dazukommt.',
  'help.guide.vote-poll.step.4':
    'Die Anzahl der Stimmen steht in einem Chip unter der Frage. Klickst du auf die Option, die du schon gewählt hast, wird deine Stimme entfernt und die Zahl sinkt.',
  'help.guide.vote-poll.result':
    'Deine Option ist angehakt, die Balken zeigen, wie die Gruppe abgestimmt hat, und die Kreise zeigen, wer welche Option gewählt hat.',
  'help.guide.vote-poll.tip.1':
    'Die Prozente und wer wofür gestimmt hat, siehst du erst, wenn du selbst abgestimmt hast oder die Umfrage geschlossen ist. Die Anzahl der Stimmen in der Kopfzeile sehen alle.',
  'help.guide.vote-poll.tip.2':
    'Abstimmungen sind nie anonym: Fahr mit der Maus über einen der Kreise bei einer Option, um zu sehen, wer dafür gestimmt hat.',
  // close-poll
  'help.guide.close-poll.title': 'Umfrage schließen oder entfernen',
  'help.guide.close-poll.goal':
    'Die Abstimmung beenden, sobald die Gruppe entschieden hat, und eine Umfrage löschen, die niemand mehr braucht.',
  'help.guide.close-poll.step.1':
    '„Schließen“, das Schloss rechts in der Kopfzeile einer Umfrage, beendet die Abstimmung. Die Optionen lassen sich dann nicht mehr anklicken.',
  'help.guide.close-poll.step.2':
    'Eine geschlossene Umfrage rutscht ans Ende des Bereichs, unter die Überschrift „Geschlossen“, wenn darüber noch offene Umfragen stehen. Sie trägt einen Chip „Geschlossen“ und zeigt allen das Ergebnis, egal ob sie abgestimmt haben. Die Gewinneroption steht fett auf einem grünen Balken; hast du genau diese gewählt, bleibt der Balken stattdessen in deiner Akzentfarbe.',
  'help.guide.close-poll.step.3':
    '„Löschen“, der Papierkorb rechts in der Kopfzeile, löscht die Umfrage. Bei einer geschlossenen Umfrage ist er der einzige Button, weil das Schloss fehlt. Es gibt keine Rückfrage, und die Stimmen werden mitgelöscht.',
  'help.guide.close-poll.result':
    'Eine gelöschte Umfrage verschwindet bei allen Mitgliedern aus dem Panel. Eine nur geschlossene Umfrage bleibt unten mit ihrem Ergebnis sichtbar.',
  'help.guide.close-poll.tip.1':
    'Das Schließen lässt sich nicht rückgängig machen, wieder öffnen geht nicht. Eine versehentlich geschlossene Umfrage musst du neu stellen.',
  'help.guide.close-poll.tip.2':
    '„Löschen“ entfernt die Umfrage samt allen Stimmen für alle, sofort und ohne Rückfrage.',
  // whats-next
  'help.guide.whats-next.title': '„Nächstes“ verstehen',
  'help.guide.whats-next.goal': 'Sehen, was die Gruppe als Nächstes vorhat, ohne den Plan zu öffnen.',
  'help.guide.whats-next.step.1':
    'Die Karte zeigt die nächsten Stopps der Reise, bis zu acht, zeitlich sortiert und nach Tagen gegliedert: „Heute“, „Morgen“ oder das Datum, daneben der Titel des Tages, falls vorhanden. Die Kopfzeile zeigt die Anzahl.',
  'help.guide.whats-next.step.2':
    'Links neben jedem Stopp steht seine Zeit: Beginn, „bis“ und Ende, falls der Stopp eins hat, oder TBD, wenn noch keine Zeit festgelegt ist.',
  'help.guide.whats-next.step.3':
    'Daneben stehen Name, Adresse und als Chips die Personen bei diesem Stopp. Ist niemand zugewiesen, werden alle aus der Reise aufgeführt.',
  'help.guide.whats-next.result':
    'Eine reine Leseliste mit allem, was als Nächstes kommt: Sie folgt dem Plan und ändert nichts daran.',
  'help.guide.whats-next.tip.1':
    'Hier stellst du nichts ein. Die Uhrzeiten kommen aus dem Tagesplan; änderst du sie dort, wird diese Liste sofort aktualisiert.',
  'help.guide.whats-next.tip.2':
    'Aufgelistet wird nur, was noch vor dir liegt: Ein Halt verschwindet, sobald seine Startzeit vorbei ist, ein Halt von heute ohne Uhrzeit bleibt bis zum Ende des Tages, und am Ende einer Reise ist das Panel leer.',
  'help.guide.whats-next.tip.3':
    '„Nächstes“ hat unter „Addons“ einen eigenen Schalter, unterhalb von Collab. Es ist ein Desktop-Bereich: Im Collab-Tab der Handy-App erscheint es nicht.',
  // trip-chat
  'help.guide.trip-chat.title': 'Mit der Gruppe chatten',
  'help.guide.trip-chat.goal':
    'Schreib eine Nachricht, antworte gezielt auf eine Nachricht, reagiere auf eine andere und lösche deine eigene.',
  'help.guide.trip-chat.step.1':
    'Schreib in „Nachricht eingeben...“ und drück Enter. Der runde Pfeil neben dem Feld macht dasselbe. Mit Umschalt und Enter beginnst du stattdessen eine neue Zeile.',
  'help.guide.trip-chat.step.2':
    'Der Smiley öffnet die Emoji-Auswahl mit Smileys, Reactions und Travel. Das gewählte Emoji wird in deinen Text eingefügt und nicht einzeln gesendet.',
  'help.guide.trip-chat.step.3':
    'Fahr mit der Maus über die Nachricht einer anderen Person: In ihrer Ecke erscheint ein kleiner runder Button. Das ist „Antworten“.',
  'help.guide.trip-chat.step.4':
    'Die Nachricht, auf die du antwortest, steht als Zitat über dem Eingabefeld. Schreib deine Nachricht und schick sie ab, das Zitat wird mitgesendet. Mit dem Kreuz am Zitat entfernst du es.',
  'help.guide.trip-chat.step.5':
    'Klick mit der rechten Maustaste auf eine Nachricht, um die acht Schnellreaktionen zu sehen. Deine Reaktion erscheint unter der Nachricht. Klick erneut auf dieselbe Reaktion, um sie zu entfernen.',
  'help.guide.trip-chat.step.6':
    'Bei deinen eigenen Nachrichten steht neben „Antworten“ „Löschen“, das Papierkorbsymbol. Damit wird die Nachricht sofort gelöscht, und ein Hinweis zeigt, dass du sie gelöscht hast. Das lässt sich nicht rückgängig machen.',
  'help.guide.trip-chat.result':
    'Deine Antwort ist die neueste Nachricht, oben darin die zitierte Nachricht. Deine Reaktion erscheint unter der anderen Nachricht. Statt der gelöschten Nachricht steht ein Hinweis, dass du sie gelöscht hast.',
  'help.guide.trip-chat.tip.1':
    'Enter sendet, Umschalt und Enter beginnt eine neue Zeile. Nachrichten mit nur ein bis drei Emojis werden groß angezeigt.',
  'help.guide.trip-chat.tip.2':
    'Mit „Bilder anhängen“ fügst du einer Nachricht bis zu vier Bilder hinzu. Du kannst sie auch einfügen oder ins Feld ziehen.',
  'help.guide.trip-chat.tip.3':
    'Enthält eine Nachricht einen Link, erscheint darunter eine Vorschaukarte. Die lädt dein eigenes TREK, ein Link zu etwas, das nur du erreichst, bleibt also ein einfacher Link.',
  'help.guide.trip-chat.tip.4':
    'Der Chat hat unter „Addons“ einen eigenen Schalter, unterhalb von Collab: Ein Admin kann ihn ausschalten und Notizen, Links, Umfragen und „Nächstes“ trotzdem aktiv lassen.',

  // ── Screen: trip-lists ────────────────────────────────────────────────────────────────
  'help.ctx.trip-lists.title': 'Listen',
  'help.ctx.trip-lists.summary':
    'Zwei Listen für eine Reise: die Packliste, mit wer was mitbringt und wie viel es wiegt, und die Aufgabenliste mit allem, was vor und während der Reise erledigt werden muss. Der Tab erscheint, solange das Addon „Listen“ eingeschaltet ist.',
  'help.ctx.trip-lists.bullet.1':
    'Mit „Packliste“ und „Aufgaben“ in der Leiste oben wechselst du zwischen beiden und siehst, wie viel jeweils drauf ist. Die Buttons am rechten Ende der Leiste gehören zu der Liste, die gerade offen ist.',
  'help.ctx.trip-lists.bullet.2':
    'Die Packliste ist in Listen unterteilt, etwa Dokumente, Kleidung oder wie auch immer du sie nennst. Jede ist eine Karte mit einer Kopfleiste. Darin findest du einen Griff, mit dem du die ganze Liste an die Stelle einer anderen ziehst, einen Farbpunkt, ein Badge mit gepackt von gesamt, drei Punkte mit „Umbenennen“, „Alle abhaken“, „Alle Haken entfernen“ und „Liste löschen“ sowie einen Pfeil, der die Karte zuklappt. „Liste hinzufügen“ in der Leiste darüber legt eine neue an.',
  'help.ctx.trip-lists.bullet.3':
    'Eine Zeile besteht aus einem Griff, einem Kästchen und einem Namen, danach als kleiner Avatar, wer den Eintrag mitbringt. Ein Eintrag mit einer Menge über eins bekommt außerdem einen Gepackt-Zähler wie 3/10 mit Minus und Plus. Danach folgen die Menge als kleines Badge und, solange „Gepäck-Tracking“ an ist, das Gewicht in Gramm und ein Taschenkreis, dann der Papierkorb und drei Punkte mit „In Liste verschieben“, „Wird geteilt“, „Umbenennen“ und „Löschen“. Was eine Zeile nicht nutzt, bleibt abgeblendet, bis du mit der Maus darauf zeigst.',
  'help.ctx.trip-lists.bullet.4':
    '„Geteilt“ und „Meine Liste“ teilen die Packliste in zwei Teile: den gemeinsamen Bestand, den alle sehen, und deine eigene Liste. „Alle“, „Offen“ und „Fertig“ daneben filtern die gerade geöffnete. „A bis Z“ ganz am Ende der Zeile sortiert die Einträge jeder Liste nach Namen, ein zweiter Klick stellt deine eigene Reihenfolge wieder her. Die Fortschrittskarte darüber zeigt, was schon gepackt ist.',
  'help.ctx.trip-lists.bullet.5':
    'Mit „Vorlage anwenden“ und „Als Vorlage speichern“ füllst du eine Liste oder speicherst sie, ohne etwas abtippen zu müssen. Die beiden Symbole dahinter, „Exportieren“ und „Importieren“, geben die Liste als Ausdruck, PDF oder Datei aus bzw. importieren eine Liste. Der rote Button rechts in der Fortschrittskarte zeigt, wie viele Einträge abgehakt sind, und entfernt sie.',
  'help.ctx.trip-lists.bullet.6':
    '„Aufgaben“ hat eine eigene Seitenleiste: die Fortschrittskarte, die Filter „Alle“, „Meine Aufgaben“, „Überfällig“ und „Erledigt“, eine Zeile pro Liste und darunter „Liste hinzufügen“. Die Aufgaben stehen in einer Karte, deren Kopfzeile den Filternamen und die Sortierung zeigt, „Priorität“ oder „Fällig am“. Klick auf eine Aufgabe, um sie rechts im Detailbereich zu öffnen. „Neue Aufgabe hinzufügen“ in der Leiste öffnet den Dialog „Neue Aufgabe“.',
  // packing-categories
  'help.guide.packing-categories.title': 'Packliste anlegen',
  'help.guide.packing-categories.goal':
    'Sortiere, was du mitnimmst, in Listen, füg Einträge hinzu und leg fest, wer für welche Liste zuständig ist.',
  'help.guide.packing-categories.step.1':
    'Klick in der Leiste über den Listen auf „Liste hinzufügen“. Ein kleiner Dialog öffnet sich. Gib oben bei „Listenname (z. B. Kleidung)“ den Namen ein und klick auf „Hinzufügen“.',
  'help.guide.packing-categories.step.2':
    'Die neue Liste beginnt mit einer Platzhalterzeile, die nur drei blasse Punkte zeigt. Klick unten in der Zeile auf „Artikel hinzufügen“, gib den Eintrag bei „Artikelname...“ ein und drück Enter: Der erste Eintrag ersetzt den Platzhalter, und das Feld bleibt für den nächsten offen.',
  'help.guide.packing-categories.step.3':
    'Eine Zeile benennst du um, indem du auf ihren Namen klickst oder über „Umbenennen“ im Drei-Punkte-Menü rechts.',
  'help.guide.packing-categories.step.4':
    'Mit dem gestrichelten Kreis mit Personensymbol oben in der Liste weist du ihr Reisemitglieder zu. Wähle einen Namen. Um die Person wieder zu entfernen, klick auf den Chip, der erscheint.',
  'help.guide.packing-categories.step.5':
    'Die drei Punkte neben dem Zähler öffnen weitere Optionen: „Umbenennen“, „Alle abhaken“, „Alle Haken entfernen“ und „Liste löschen“. „Liste löschen“ löscht die Liste samt allen Einträgen ohne weitere Rückfrage. Der Pfeil ganz rechts klappt die Liste ein.',
  'help.guide.packing-categories.result':
    'Die neue Liste erscheint im Raster, mit ihren Einträgen darunter und ihrem Farbpunkt, und ihr Badge zählt, was schon gepackt ist.',
  'help.guide.packing-categories.tip.1':
    'Eine Liste besteht nur aus ihren Einträgen. Löschst du den letzten Eintrag, wird die Zeile zum Platzhalter, damit die Liste Position und Farbe behält. Löschst du auch diese Zeile, ist die Liste gelöscht.',
  'help.guide.packing-categories.tip.2':
    'Weist du jemandem eine Liste zu, bekommt die Person eine Benachrichtigung zum Packen. Wer die Einträge sehen kann, ändert sich dadurch nicht. Das legst du unter „Wird geteilt“ im Drei-Punkte-Menü einer Zeile fest.',
  'help.guide.packing-categories.tip.3':
    'Zwei Listen dürfen gleich heißen. TREK unterscheidet sie intern, die Namen bleiben also genau so, wie du sie eingegeben hast.',
  // check-off-packing
  'help.guide.check-off-packing.title': 'Beim Packen abhaken',
  'help.guide.check-off-packing.goal':
    'Abhaken, was schon im Gepäck ist, den Fortschritt verfolgen und die gepackten Einträge entfernen.',
  'help.guide.check-off-packing.step.1':
    'Klick auf das Kästchen links in einer Zeile. Der Name wird durchgestrichen, und der Fortschrittsbalken aktualisiert sich.',
  'help.guide.check-off-packing.step.2':
    'Die Fortschrittskarte über den Listen zeigt, wie viele von allen Einträgen gepackt sind, als Zahl, als Prozentwert und als Balken.',
  'help.guide.check-off-packing.step.3':
    'Um eine ganze Liste auf einmal abzuhaken, findest du unter den drei Punkten in ihrer Kopfzeile „Alle abhaken“ und „Alle Haken entfernen“.',
  'help.guide.check-off-packing.step.4':
    '„Alle“, „Offen“ und „Fertig“ neben „Geteilt“ und „Meine Liste“ filtern das Raster. „Offen“ zeigt nur, was noch fehlt, eine fertig gepackte Liste wird also ausgeblendet.',
  'help.guide.check-off-packing.step.5':
    'Der rote Button „Entfernen … abgehakt“ am rechten Ende der Fortschrittskarte zeigt die Zahl der angehakten Einträge und löscht sie alle auf einmal, nachdem du im Browser einmal bestätigt hast.',
  'help.guide.check-off-packing.result':
    'Nur offene Einträge werden angezeigt, und der Balken darüber zeigt, wie weit du mit dem Packen bist.',
  'help.guide.check-off-packing.tip.1':
    'Auch einen abgehakten Eintrag kannst du noch umbenennen: Klick auf seinen Namen.',
  'help.guide.check-off-packing.tip.2':
    '„Alle abhaken“ und „Alle Haken entfernen“ wirken immer nur auf eine Liste, über deren eigenes Drei-Punkte-Menü.',
  'help.guide.check-off-packing.tip.3':
    'Ist alles abgehakt, steht statt des Zählers „Alles gepackt!“, und der Balken wird grün.',
  // apply-packing-template
  'help.guide.apply-packing-template.title': 'Packvorlage anwenden',
  'help.guide.apply-packing-template.goal':
    'Füg der Reise eine fertige Liste hinzu und speichere die Liste dieser Reise für die nächste.',
  'help.guide.apply-packing-template.step.1': 'Klick in der Leiste über der Liste auf „Vorlage anwenden“.',
  'help.guide.apply-packing-template.step.2':
    'Wähle eine Vorlage. Jede Zeile zeigt ihren Namen und wie viele Einträge sie enthält.',
  'help.guide.apply-packing-template.step.3':
    'Die Einträge landen in der Ansicht, in der du gerade bist: „Geteilt“ fügt sie der gemeinsamen Liste hinzu, die alle sehen, „Meine Liste“ deiner eigenen Liste.',
  'help.guide.apply-packing-template.step.4':
    'Willst du die Liste dieser Reise für die nächste behalten, klick auf „Als Vorlage speichern“. Ein kleiner Dialog öffnet sich. Gib oben im Feld „Vorlagenname“ einen Namen ein und klick auf „Speichern“.',
  'help.guide.apply-packing-template.result':
    'Die Listen und Einträge der Vorlage werden zur Reise hinzugefügt, zusätzlich zu dem, was schon da war.',
  'help.guide.apply-packing-template.tip.1':
    'Eine Vorlage übernimmt für jeden Eintrag Liste, Menge, Gewicht und Tasche und legt Taschen an, die es in der Reise noch nicht gibt. Haken werden nicht übernommen, und nichts, was schon auf der Liste steht, wird entfernt.',
  'help.guide.apply-packing-template.tip.2':
    '„Vorlage anwenden“ gibt es erst, wenn eine Vorlage existiert. Ohne Vorlage erscheint der Button gar nicht.',
  'help.guide.apply-packing-template.tip.3':
    '„Als Vorlage speichern“ sehen nur Instanz-Admins, und nur solange die Liste Einträge hat. Gespeichert werden die gemeinsamen Einträge und deine eigenen, nie die privaten Einträge anderer Mitglieder.',
  // import-packing-list
  'help.guide.import-packing-list.title': 'Ganze Packliste einfügen',
  'help.guide.import-packing-list.goal':
    'Mach aus einer Liste, die du schon woanders hast, auf einen Schlag Packlisten-Einträge.',
  'help.guide.import-packing-list.step.1':
    'Klick auf „Importieren“, das Symbol mit dem Pfeil nach unten am rechten Ende der Leiste über der Liste.',
  'help.guide.import-packing-list.step.2':
    'Ein Eintrag pro Zeile: Kategorie, Name, Gewicht in g (optional), Gepäckstück (optional), checked/unchecked (optional). Das graue Beispiel im Feld zeigt alle vier Formate, und die Zahlen am linken Rand zählen deine Zeilen. Auch eine Markdown-Liste funktioniert: Eine Überschrift gibt der Liste ihren Namen, und „- [ ]“ und „- [x]“ werden zu Einträgen.',
  'help.guide.import-packing-list.step.3':
    'Oder lade die Zeilen mit „CSV/TXT/MD laden“ unten links im Dialog aus einer Datei. Das funktioniert mit .csv-, .txt- und .md-Dateien und ersetzt den Inhalt des Feldes.',
  'help.guide.import-packing-list.step.4':
    'Klick unten rechts auf „3 importieren“; die Zahl darauf zählt die Zeilen, die TREK verstanden hat.',
  'help.guide.import-packing-list.result':
    'Jede Zeile wird zu einem Eintrag in der Liste, die im ersten Feld steht. Bereits vorhandene Einträge bleiben unverändert.',
  'help.guide.import-packing-list.tip.1':
    'Kommas, Semikolons und Tabs trennen Felder, und doppelte Anführungszeichen halten ein Feld zusammen: "Shirt, blau" bleibt ein Name. Eine Zeile mit nur einem Wert ist einfach ein Name. Eine Zeile ohne eigene Liste landet in „Other“. "3x" vor einem Namen legt die Menge fest.',
  'help.guide.import-packing-list.tip.2':
    'Eine im vierten Feld genannte Tasche wird angelegt, falls die Reise sie noch nicht hat. „Importieren“ und „Vorlage anwenden“ sind die beiden Wege, Gewichte und Taschen in großer Zahl zu übernehmen.',
  // export-packing-list
  'help.guide.export-packing-list.title': 'Packliste drucken oder exportieren',
  'help.guide.export-packing-list.goal':
    'Die Liste drucken, als PDF speichern oder als Datei für eine andere App oder die nächste Reise exportieren.',
  'help.guide.export-packing-list.step.1':
    'Klick auf „Exportieren“, das Symbol mit dem Pfeil nach oben in der Leiste über der Liste, direkt vor „Importieren“.',
  'help.guide.export-packing-list.step.2':
    '„Markdown-Checkliste (.md)“ und „CSV für den Import (.csv)“ speichern die Liste sofort als Datei.',
  'help.guide.export-packing-list.step.3':
    'Klick auf „Drucken oder als PDF speichern“. Die Vorschau zeigt die Liste als Seite: oben die Reise, ihr Zeitraum und wie viel gepackt ist, dann jede Liste als Karte und jeden Eintrag mit einem Kästchen zum Abhaken.',
  'help.guide.export-packing-list.step.4':
    'Klick unter der Vorschau auf „Drucken oder als PDF speichern“. Der Browser öffnet seinen Druckdialog: Wähle einen Drucker oder „Als PDF speichern“, um eine Datei zu speichern.',
  'help.guide.export-packing-list.result':
    'Ausdruck und Dateien enthalten die gerade geöffnete Ansicht, „Geteilt“ oder „Meine Liste“, mit Mengen, Gewichten und Häkchen.',
  'help.guide.export-packing-list.tip.1':
    'Die CSV-Datei hat genau das Format, das „Importieren“ liest, inklusive Gepäckstücke. Du kannst sie also als eigene Packvorlage nutzen und in die nächste Reise importieren.',
  'help.guide.export-packing-list.tip.2':
    'Die Markdown-Datei öffnet sich in Obsidian, Notion oder GitHub als Checkliste, und du kannst sie über „Importieren“ wieder einlesen.',
  // share-packing-item
  'help.guide.share-packing-item.title': 'Festlegen, wer einen Eintrag sieht und wer ihn mitbringt',
  'help.guide.share-packing-item.goal':
    'Einen Eintrag zwischen dem gemeinsamen Pool der Gruppe, deiner eigenen Liste und den Personen verschieben, für die du ihn mitbringst.',
  'help.guide.share-packing-item.step.1':
    'Über den Listen ist „Geteilt“ die Liste, die alle sehen, und „Meine Liste“ deine eigene. Bei beiden steht, wie viele Einträge sie haben. Klick auf „Meine Liste“, um deine zu sehen.',
  'help.guide.share-packing-item.step.2':
    'Öffne wieder unter „Geteilt“ die drei Punkte am Ende einer Zeile und klick auf „Wird geteilt“.',
  'help.guide.share-packing-item.step.3':
    'Es gibt drei Stufen: „Geteilt“, für alle in der Gruppe sichtbar, „Persönlich“, nur für dich sichtbar, und „Mit Personen teilen…“, wo du auswählst, für wen der Eintrag gilt.',
  'help.guide.share-packing-item.step.4':
    'Ein persönlicher Eintrag steht nur in „Meine Liste“. Wechsle dorthin, um ihn zu finden.',
  'help.guide.share-packing-item.step.5':
    'Öffne „Wird geteilt“ erneut und hak unter „Mit Personen teilen…“ einen Namen an. Der Eintrag erscheint dann auch auf der Liste dieser Person, und die Zeile bekommt ein kleines Badge mit der Zahl der Personen, mit denen er geteilt ist.',
  'help.guide.share-packing-item.result':
    'Der Eintrag steht in der gewählten Stufe, und die Zeile zeigt, wer ihn mitbringt.',
  'help.guide.share-packing-item.tip.1':
    'Nur wer einen Eintrag mitbringt, kann ändern, mit wem er geteilt wird. Wer ihn von dir geteilt bekommt, sieht ihn in seiner eigenen „Meine Liste“ mit einem kleinen Hand-Badge, das beim Darüberfahren deinen Namen zeigt, und kann ihn abhaken.',
  'help.guide.share-packing-item.tip.2':
    'Bei einem geteilten Eintrag, den jemand anderes mitbringt, zeigt das Drei-Punkte-Menü statt „Wird geteilt“ zwei andere Punkte: „Bring ich auch mit“, womit du dich dazustellst, und „In meine Liste kopieren“, womit du eine private Kopie anlegst.',
  'help.guide.share-packing-item.tip.3':
    'Neue Einträge übernehmen die Ansicht, in der du sie hinzufügst. Fügst du sie in „Geteilt“ hinzu, landen sie im gemeinsamen Pool. Fügst du sie in „Meine Liste“ hinzu, sind sie „Persönlich“, es sei denn, alle Einträge dieser Liste sind mit denselben Leuten geteilt: Dann wird auch der neue mit ihnen geteilt.',
  // packing-bags
  'help.guide.packing-bags.title': 'Gepäck wiegen',
  'help.guide.packing-bags.goal':
    'Gib jedem Eintrag ein Gewicht, verteil die Einträge auf Gepäckstücke und bleib bei jedem unter dem Limit der Airline.',
  'help.guide.packing-bags.step.1':
    'Klick auf das Gewichts-Abzeichen vor dem Kreis und gib das Gewicht des Eintrags in Gramm ein.',
  'help.guide.packing-bags.step.2':
    'Der Kreis hinter dem Gewicht steht für das Gepäckstück des Eintrags. Klick darauf.',
  'help.guide.packing-bags.step.3':
    'Gibt es noch kein Gepäckstück, klick auf „Gepäck hinzufügen“, gib einen Namen ein und drück Enter. Das Gepäckstück wird angelegt, und der Eintrag kommt direkt hinein.',
  'help.guide.packing-bags.step.4':
    'Die Karte „Gepäck“ erscheint rechts neben den Listen, sobald es eine Tasche gibt. Jede Tasche zeigt ihren Namen, wer sie trägt, einen Füllbalken, die Zahl der Einträge darin und ihr Gewicht. Unter den Taschen folgen „Nicht zugewiesen“ und „Gesamtgewicht“, darunter „Gepackt“: das schon gepackte Gewicht mit einem dünnen Balken für seinen Anteil.',
  'help.guide.packing-bags.step.5':
    'Klick neben dem Gewicht des Gepäckstücks auf „Limit setzen“ und gib das Limit in Kilogramm ein, so wie es die Airline angibt.',
  'help.guide.packing-bags.step.6':
    'Das gestrichelte Plus am Ende der Namenszeile der Tasche, direkt vor dem Kreuz, öffnet „Mitglieder zuweisen“. Hake an, wer die Tasche trägt: Die Personen erscheinen neben dem Plus, und „Pro Person“ unten auf der Karte listet, was jede von ihnen trägt.',
  'help.guide.packing-bags.result':
    'Die Karte „Gepäck“ rechts zeigt das Gewicht jeder Tasche im Vergleich zu ihrem Limit, was in keiner Tasche steckt, was jede Person trägt, und die Gesamtsumme samt dem bereits gepackten Anteil.',
  'help.guide.packing-bags.tip.1':
    'Das Gewichtsfeld, der Gepäckkreis und die Karte „Gepäck“ gibt es nur, solange ein Admin „Gepäck-Tracking“ beim Addon „Listen“ eingeschaltet hat. In einem schmaleren Fenster öffnest du das Gepäck stattdessen über den Button „Gepäck“ über der Fortschrittskarte.',
  'help.guide.packing-bags.tip.2':
    'Der Server berechnet das Gewicht eines Gepäckstücks aus den Einträgen aller Mitglieder, auch aus denen, die du nicht siehst. Die Zahl ist also das tatsächliche Gewicht.',
  'help.guide.packing-bags.tip.3':
    'Ein Gepäckstück ohne Limit wird mit dem schwersten verglichen, damit sich die Balken vergleichen lassen. Gibst du ihm ein Limit, wird sein Balken stattdessen daran gemessen.',
  // create-todo
  'help.guide.create-todo.title': 'Aufgabe hinzufügen',
  'help.guide.create-todo.goal': 'Eine Aufgabe notieren, mit Liste, Priorität, Datum und zuständiger Person.',
  'help.guide.create-todo.step.1': 'Klick rechts in der Leiste auf „Neue Aufgabe hinzufügen“.',
  'help.guide.create-todo.step.2':
    'Der Dialog „Neue Aufgabe“ öffnet sich, der Cursor steht oben. Gib den Namen ins Feld „Aufgabenname“ ein und unter „Beschreibung“ alles, was du dir merken willst.',
  'help.guide.create-todo.step.3':
    '„Liste“ ordnet die Aufgabe einer Gruppe zu. Wähle eine aus oder leg über das Plus daneben in einem kleinen Dialog eine neue an.',
  'help.guide.create-todo.step.4': 'Für die Priorität gibt es vier Buttons: „Keine“, P1, P2 und P3, von Rot bis Blau.',
  'help.guide.create-todo.step.5':
    '„Fällig am“ neben „Liste“ öffnet einen Kalender, und über „Zuständig“ weist du die Aufgabe einer Person zu.',
  'help.guide.create-todo.step.6': 'Klick auf „Aufgabe erstellen“.',
  'help.guide.create-todo.result':
    'Die Aufgabe steht in der Liste, mit Priorität, Fälligkeitsdatum und Liste als Badges und dem Avatar der zuständigen Person am Zeilenende, und sie öffnet sich rechts im Detailbereich.',
  'help.guide.create-todo.tip.1':
    'Nur der Name ist Pflicht. Alles andere kannst du später rechts im Detailbereich ergänzen.',
  'help.guide.create-todo.tip.2':
    'Ist in der Seitenleiste eine Liste ausgewählt, landet eine neue Aufgabe direkt in dieser Liste.',
  'help.guide.create-todo.tip.3': 'Enter im Namensfeld legt die Aufgabe sofort an, ohne die anderen Felder anzurühren.',
  // todo-filters
  'help.guide.todo-filters.title': 'Aufgabe finden und ändern',
  'help.guide.todo-filters.goal':
    'Zeig nur die Aufgaben, die gerade wichtig sind, und bearbeite dann die gefundene Aufgabe.',
  'help.guide.todo-filters.step.1':
    '„Aufgaben“ in der Seitenleiste: „Alle“ zeigt alles, was noch offen ist, „Meine Aufgaben“ alles, was dir zugewiesen ist, „Überfällig“ Aufgaben mit einem Datum in der Vergangenheit und „Fertig“ erledigte Aufgaben. Jeder Eintrag zeigt seine Anzahl. Klick auf „Überfällig“.',
  'help.guide.todo-filters.step.2':
    'Unter „Listen“ steht für jede Liste eine Zeile. Wähle eine aus, um diese Liste anzuzeigen, erledigte Aufgaben inklusive.',
  'help.guide.todo-filters.step.3':
    'Die Sortierung oben in der Liste ändert die Reihenfolge der angezeigten Aufgaben: „Priorität“ stellt P1 nach vorne, „Fällig am“ die nächste Frist. Du kannst immer nur eine der beiden nutzen, und ein zweiter Klick stellt deine eigene Reihenfolge wieder her.',
  'help.guide.todo-filters.step.4': 'Klick auf eine Aufgabe, um sie rechts im Detailbereich zu öffnen.',
  'help.guide.todo-filters.step.5':
    'Ändere, was nötig ist: den Namen, „Priorität“, „Liste“, „Fällig am“ oder „Zuständig“. „Beschreibung“ zeigt den Text mit klickbaren Links; klick hinein, um ihn zu bearbeiten. Klick dann unten im Bereich auf „Änderungen speichern“. Mit dem Kästchen oben im Bereich hakst du die Aufgabe ab, und „Löschen“ neben „Änderungen speichern“ löscht sie sofort.',
  'help.guide.todo-filters.result':
    'Die Liste zeigt nur die gewünschten Aufgaben, und im Detailbereich rechts bearbeitest du die ausgewählte.',
  'help.guide.todo-filters.tip.1':
    'Eine Listenzeile zählt nur die offenen Aufgaben. Wählst du sie aus, siehst du aber auch die erledigten. „Alle“, „Meine Aufgaben“ und „Überfällig“ blenden erledigte Aufgaben aus, „Fertig“ zeigt nur erledigte.',
  'help.guide.todo-filters.tip.2':
    '„Priorität“ und „Fällig am“ lassen sich in der Sortierung nicht kombinieren. Solange eins davon aktiv ist, kannst du die Zeilen nicht per Drag-and-drop selbst ordnen.',

  // ── Screen: trip-bookings ─────────────────────────────────────────────────────────────
  'help.ctx.trip-bookings.title': 'Buchungen',
  'help.ctx.trip-bookings.summary':
    'Hier steht alles, was für die Reise gebucht ist, außer Transporten: Unterkünfte, Tischreservierungen, Tickets, Touren und Parkplätze. Jede Buchung ist eine Karte, eine Listenzeile oder ein Balken im Zeitstrahl, mit Code, Dokumenten, Reisenden und Kosten. Klick auf eine Buchung, um ihre Details zu öffnen.',
  'help.ctx.trip-bookings.bullet.1':
    '„Manuelle Buchung“ rechts in der Leiste öffnet „Neue Buchung“. Damit legst du sechs Arten von Buchungen an: „Unterkunft“, „Restaurant“, „Veranstaltung“, „Tour“, „Parken“ und „Andere“. Flüge, Züge und andere Verkehrsmittel gehören in den Tab „Transporte“ und erscheinen hier nie.',
  'help.ctx.trip-bookings.bullet.2':
    'Das Download-Symbol vor „Manuelle Buchung“, „Buchungsbestätigungen importieren“, gibt Bestätigungen an den Parser weiter: EML, PDF, PKPass, HTML oder TXT, höchstens fünf Dateien mit je bis zu 10 MB, und Fotos, wenn das KI-Modell Bilder lesen kann. Das Symbol erscheint nur, wenn der Server die Dateien auslesen kann.',
  'help.ctx.trip-bookings.bullet.3':
    '„Suchen“ durchsucht Titel, Typen, Orte, Notizen, Buchungscodes und Reisende. „Filtern“, der Trichter daneben, grenzt den Tab nach „Status“ ein, nach „Typ“ mit einer Anzahl pro Typ und nach „Reisende“, sobald eine Buchung Personen nennt. Eine Zahl am Trichter zeigt, wie viele Filter aktiv sind.',
  'help.ctx.trip-bookings.bullet.4':
    'Die drei Symbole nach „Filter“ wechseln die Ansicht: „Karten“, „Liste“ und „Zeitstrahl“. „Ansicht anpassen“, die Regler daneben, gruppiert und sortiert Karten und Liste oder legt die Spuren des Zeitstrahls fest. Das Tabellen-Symbol dahinter, „Als Tabelle exportieren (CSV)“, lädt herunter, was der Tab gerade zeigt. Karten sind standardmäßig nach „Bestätigt“ und „Ausstehend“ gruppiert, die Liste nach Tag, und ein Klick auf die Überschrift eines Abschnitts klappt ihn zu.',
  'help.ctx.trip-bookings.bullet.5':
    'Jede Karte hat eine Kopfzeile in der Farbe ihres Status, mit dem Statuspunkt (ein Klick wechselt zwischen „Ausstehend“ und „Bestätigt“), dem Typ, dem Titel, dem Stift und dem Papierkorb. Darunter stehen die Angaben, die die Buchung hat: Datum, Zeit, Buchungscode, Check-in und Check-out, Ort / Adresse, Unterkunft, „Verknüpft mit“ (der Stopp im Plan), Link, Notizen, Reisende, Dateien und die verknüpften Kosten.',
  'help.ctx.trip-bookings.bullet.6':
    'Ein Klick auf eine Karte, eine Zeile oder einen Balken öffnet die Details der Buchung, unten mit „Auf Karte“ (wenn die Buchung einen Ort hat), dem Papierkorb und „Bearbeiten“. Vor dem Löschen fragt TREK einmal nach („Buchung löschen?“, mit Hinweis, wenn Kosten mitgelöscht werden); dann ist die Buchung samt verknüpfter Ausgaben weg, und bei einer Unterkunft verschwinden ihre Nächte aus dem Tagesplan.',
  // booking-views
  'help.guide.booking-views.title': 'Ansicht wechseln und Buchung öffnen',
  'help.guide.booking-views.goal':
    'Sieh die Buchungen als Karten, als Liste oder auf einem Zeitstrahl und öffne eine, um alle Details zu sehen.',
  'help.guide.booking-views.step.1':
    'Die drei Symbole nach „Filtern“ in der Leiste sind die Ansichten; zeigst du auf eines, erscheint sein Name: „Karten“, „Liste“ und „Zeitstrahl“. Der Tab öffnet sich mit „Karten“, einer Karte pro Buchung in den Abschnitten „Bestätigt“ und „Ausstehend“. Klick auf „Liste“, das mittlere Symbol.',
  'help.guide.booking-views.step.2':
    '„Liste“ zeigt jede Buchung als Zeile unter einer Überschrift pro Tag, mit Tag und Uhrzeit rechts; mit den Pfeiltasten springst du von Zeile zu Zeile. Klick auf „Zeitstrahl“, das letzte der drei Symbole.',
  'help.guide.booking-views.step.3':
    '„Zeitstrahl“ zeigt die Buchungen über die Tage der Reise: eine Spur pro Typ und ein Balken vom Beginn bis zum Ende jeder Buchung. Ausstehende Buchungen sind gestrichelt umrandet. „Reise“ passt die ganze Reise in die Breite ein; klick auf die Überschrift eines Tages, um ihn stundengenau zu sehen.',
  'help.guide.booking-views.step.4':
    '„Tag“ zeigt einen Tag auf einer Stundenskala, und die Balken werden so lang wie ihre Zeiten. Mit den Pfeilen neben dem Namen des Tages wechselst du zum Tag davor oder danach. Solange die Reise läuft, springt „Heute“ zum aktuellen Tag, und mit dem Umschalter zwischen „Reise“ und „Tag“ rechts kommst du zurück zur ganzen Reise.',
  'help.guide.booking-views.step.5':
    'Fahr mit der Maus über einen Balken, um Tag, Uhrzeiten und Ort zu sehen, und klick dann darauf, um die Details der Buchung zu öffnen. Eine Karte in „Karten“ und eine Zeile in „Liste“ öffnen dasselbe Popup.',
  'help.guide.booking-views.step.6':
    'Die Kopfzeile der Detailansicht zeigt den Titel und Labels für den Status (ein Klick wechselt ihn), den Typ, den Tag und den Buchungscode, mit einem Button zum Kopieren. Darunter stehen die Zeiten als Kacheln, dann Ort, Reisende, Notizen, Kosten und Dateien, sofern vorhanden, und ganz unten „Auf Karte“, der Papierkorb und „Bearbeiten“.',
  'help.guide.booking-views.result':
    'Die Buchung öffnet sich in der Detailansicht: „Bearbeiten“ öffnet ihr Formular, „Auf Karte“ zeigt sie im Plan, und „Schließen“ oder Esc bringt dich zurück zur vorherigen Ansicht.',
  'help.guide.booking-views.tip.1':
    'Mit „Ansicht anpassen“, dem Schieberegler-Symbol hinter den Ansichtssymbolen, gruppierst und sortierst du „Karten“ und „Liste“ über „Gruppieren nach“ und „Sortieren nach“. Im „Zeitstrahl“ gibt es dort „Eine Spur pro Typ“ und „Anderen Tab einblenden“. „Anderen Tab einblenden“ zeigt die Einträge des Tabs „Transporte“ abgeblendet in einer schmalen Spur oben. „Ansicht zurücksetzen“ stellt die Standards wieder her, und jeder Tab merkt sich seine Ansicht in diesem Browser.',
  'help.guide.booking-views.tip.2':
    'Buchungen vor oder nach der Reise oder ohne Datum können nicht im Zeitstrahl erscheinen. Sie stehen unter dem Diagramm als kleine Karte unter „Vor der Reise“, „Nach der Reise“ oder „Kein Datum“.',
  'help.guide.booking-views.tip.3':
    'Dieselben Details öffnen sich überall, wo eine Buchung auftaucht: im Tab „Transporte“, im Tagesplan, in den Details eines Tages und in denen eines Ortes. Ein Klick auf den Titel benennt die Buchung um.',
  // create-booking
  'help.guide.create-booking.title': 'Buchung anlegen',
  'help.guide.create-booking.goal':
    'Ein Restaurant, eine Veranstaltung, eine Tour, einen Parkplatz oder etwas anderes von Hand zur Reise hinzufügen.',
  'help.guide.create-booking.step.1':
    'Klick rechts in der Leiste auf „Manuelle Buchung“. „Neue Buchung“ öffnet sich, oben mit dem Titel und zwei Labels in einer Kopfzeile.',
  'help.guide.create-booking.step.2':
    'Klick oben in der Kopfzeile auf das Typ-Label, das bei einer neuen Buchung „Andere“ zeigt, und wähle die „Art der Buchung“. In diesem Tab legst du sechs Typen an: Unterkunft, Restaurant, Veranstaltung, Tour, Parken und Andere. Das Formular passt sich deiner Wahl an: Nur „Unterkunft“ nutzt einen Zeitraum aus Tagen statt einzelner Daten.',
  'help.guide.create-booking.step.3':
    'Gib den Titel oben in der Kopfzeile ein, im Feld über den Labels. Er ist das einzige Pflichtfeld, und „Hinzufügen“ bleibt ausgegraut, bis du etwas eingibst.',
  'help.guide.create-booking.step.4':
    'Leg „Datum“ und „Startzeit“ fest und, wenn die Buchung ein Ende hat, „Enddatum“ und „Endzeit“. Die Kalender bieten nur Tage innerhalb der Reise an. Liegen Enddatum und Endzeit nicht nach dem Start, werden sie rot markiert, und „Hinzufügen“ ist gesperrt. Eine Endzeit vor der Startzeit ohne Enddatum löst nur eine Warnung aus: Endet die Buchung am nächsten Tag, trag ein Enddatum ein.',
  'help.guide.create-booking.step.5':
    'Trag den „Buchungscode“ aus der Bestätigung ein und klick dann oben neben dem Typ auf das Status-Badge. Bei einer neuen Buchung steht dort „Ausstehend“, nach dem Klick „Bestätigt“. Der Status bestimmt, in welchem Abschnitt die Karte erscheint.',
  'help.guide.create-booking.step.6': 'Klick unten im Formular auf „Hinzufügen“.',
  'help.guide.create-booking.result':
    'Die Buchung erscheint als Karte in ihrem Abschnitt. Die Farbe der Kopfzeile zeigt den Status, und die Karte zeigt Typ, Datum, Uhrzeiten und Code. Alle anderen in der Reise sehen sie sofort.',
  'help.guide.create-booking.tip.1':
    '„Ort / Adresse“ schlägt beim Tippen echte Adressen vor. Wählst du eine aus, ersetzt sie deine Eingabe; eine selbst eingetippte Adresse bleibt unverändert.',
  'help.guide.create-booking.tip.2':
    'Trag unter „Link“ die Seite der Buchung beim Anbieter ein. Auf der Karte und in der Detailansicht erscheint sie als Link, der sich in einem neuen Tab öffnet.',
  'help.guide.create-booking.tip.3':
    'Notizen unterstützen Markdown. Listen und fette Zeilen erscheinen auf der Karte und in der Detailansicht also auch als Liste oder Fettdruck.',
  // booking-hotel
  'help.guide.booking-hotel.title': 'Unterkunft buchen',
  'help.guide.booking-hotel.goal':
    'Eine Unterkunft eintragen, damit sie gleichzeitig als Buchung und als Übernachtungen im Tagesplan zählt.',
  'help.guide.booking-hotel.step.1':
    'Klick auf „Manuelle Buchung“ und wähle oben über das Typ-Badge „Unterkunft“. Statt der Datumsfelder erscheint ein Block mit Hotelfeldern.',
  'help.guide.booking-hotel.step.2':
    'Wähl das Hotel unter „Unterkunft“. Die Liste enthält die Orte der Reise, ohne importierte Tracks und Touren. Wählst du eins aus, landet sein Name in einem leeren Titel und seine Adresse in „Ort / Adresse“.',
  'help.guide.booking-hotel.step.3':
    'Leg „Von“ und „Bis“ fest: die erste Nacht und den Morgen deiner Abreise. Beide bieten die Tage der Reise mit Datum an, und TREK sorgt dafür, dass „Bis“ nach „Von“ liegt.',
  'help.guide.booking-hotel.step.4':
    'Füll „Check-in“, „Check-in bis“ und „Check-out“ aus und trag den „Buchungscode“ aus der Bestätigung ein.',
  'help.guide.booking-hotel.step.5': 'Klick auf „Hinzufügen“.',
  'help.guide.booking-hotel.result':
    'Die Karte zeigt unter „Datum“ den Zeitraum, die Check-in- und Check-out-Zeiten und die Adresse. Der Aufenthalt erscheint jetzt auch an diesen Tagen im Plan.',
  'help.guide.booking-hotel.tip.1':
    '„Unterkunft“ ist der einzige Typ ohne „Datum“ und „Startzeit“. Seine Daten sind „Von“ und „Bis“, und du wählst Tage der Reise, keine Kalenderdaten.',
  'help.guide.booking-hotel.tip.2':
    'Lass „Unterkunft“ leer und gib stattdessen die Adresse ein: TREK sucht den Ort, legt ihn an und setzt einen Pin auf der Karte.',
  'help.guide.booking-hotel.tip.3': 'Löschst du die Buchung, werden auch ihre Nächte aus dem Tagesplan entfernt.',
  // link-booking
  'help.guide.link-booking.title': 'Buchung mit dem Plan verknüpfen',
  'help.guide.link-booking.goal':
    'Eine Buchung mit ihrem Stopp und ihrem Ort verknüpfen, damit sie dort erscheint, wo du sie brauchst.',
  'help.guide.link-booking.step.1':
    'Fahr mit der Maus über die Karte, die du verknüpfen willst, und klick auf den Stift in ihrer Kopfzeile. „Reservierung bearbeiten“ öffnet sich.',
  'help.guide.link-booking.step.2':
    'Öffne „Mit Tagesplanung verknüpfen“. Die Liste zeigt deinen Plan: eine Überschrift für jeden Tag, darunter die Stopps des Tages, nummeriert und mit ihren Zeiten. Wähle den Stopp, zu dem die Buchung gehört.',
  'help.guide.link-booking.step.3':
    '„Ort / Aktivität“ verknüpft den Ort selbst. Wählst du ihn dort aus, werden Titel und „Ort / Adresse“ ausgefüllt, sofern sie leer sind.',
  'help.guide.link-booking.step.4': 'Klick auf „Aktualisieren“.',
  'help.guide.link-booking.result':
    'Die Karte zeigt unter „Verknüpft mit“ den Tag und den Stopp, und die Buchung erscheint bei diesem Stopp im Tagesplan.',
  'help.guide.link-booking.tip.1':
    '„Keine Verknüpfung“ oben in der Liste hebt die Verknüpfung wieder auf. Bei einer Unterkunft gibt es keine Stopp-Auswahl: Sie ist über ihre Nächte verknüpft.',
  'help.guide.link-booking.tip.2':
    'Wählst du einen Stopp an einem Tag mit Datum, wird ein leeres „Datum“ automatisch ausgefüllt. Ein bereits gesetztes Datum bleibt unverändert.',
  // booking-travelers
  'help.guide.booking-travelers.title': 'Festlegen, für wen eine Buchung ist',
  'help.guide.booking-travelers.goal':
    'Leg fest, für welche Reisenden eine Buchung gilt, und zeig dann nur ihre Buchungen an.',
  'help.guide.booking-travelers.step.1':
    'Öffne die Buchung mit dem Stift auf ihrer Karte. „Reisende“ steht neben dem Buchungscode und zeigt „Reisende zuweisen“, solange niemand der Buchung zugewiesen ist.',
  'help.guide.booking-travelers.step.2':
    'Klick darauf und wähle die Personen aus, für die diese Buchung gilt; auch benannte Gäste stehen in der Liste. Ausgewählte Personen bekommen ein Häkchen, und ihr Avatar erscheint im Feld. Klick erneut auf den Namen, um die Person wieder zu entfernen.',
  'help.guide.booking-travelers.step.3': 'Klick auf „Aktualisieren“.',
  'help.guide.booking-travelers.step.4':
    'Klick in der Leiste auf „Filtern“: Unter „Reisende“ klickst du eine Person an, um nur ihre Buchungen zu sehen. Es können mehrere gleichzeitig aktiv sein.',
  'help.guide.booking-travelers.result':
    'Die Karte zeigt die Personen, für die die Buchung gilt, und „Filtern“ grenzt den Tab auf die Buchungen der ausgewählten Personen ein.',
  'help.guide.booking-travelers.tip.1':
    'Auf der Karte und in der Detailansicht werden die Reisenden nur angezeigt, ändern kannst du sie dort nicht. Das machst du hier im Formular.',
  'help.guide.booking-travelers.tip.2':
    '„Reisende“ erscheint im Filter, sobald die Reise mehr als ein Mitglied hat und mindestens eine Buchung jemanden nennt. Deine Auswahl bleibt, bis du den Browser-Tab schließt.',
  // booking-files
  'help.guide.booking-files.title': 'Beleg bei der Buchung ablegen',
  'help.guide.booking-files.goal': 'Bestätigung, Ticket oder Pass an die zugehörige Buchung hängen.',
  'help.guide.booking-files.step.1':
    'Öffne die Buchung mit dem Stift auf ihrer Karte. „Dateien“ steht neben „Verknüpfen“; klick dort auf „Datei anhängen“. Bei einer bereits bestehenden Buchung wird das Dokument sofort hochgeladen, und TREK zeigt „Datei hochgeladen“.',
  'help.guide.booking-files.step.2':
    'Das Dokument erscheint mit seinem Namen, einem Button zum Öffnen und einem X daneben.',
  'help.guide.booking-files.step.3':
    '„Vorhandene verknüpfen“ bietet die Dokumente der Reise an, die noch nicht an dieser Buchung hängen. Wähle eines aus, und es wird angehängt, ohne erneut hochgeladen zu werden.',
  'help.guide.booking-files.step.4': 'Klick auf „Aktualisieren“.',
  'help.guide.booking-files.result':
    'Karte und Details listen die Dokumente unter „Dateien“ auf; ein Klick auf eins öffnet es. „In Dateien zeigen“ über der Liste in den Details bringt dich zum Tab „Dateien“.',
  'help.guide.booking-files.tip.1':
    'Legst du eine Buchung gerade erst an, wartet das Dokument und wird hochgeladen, sobald du auf „Hinzufügen“ klickst. Zum Hochladen brauchst du eine Verbindung.',
  'help.guide.booking-files.tip.2':
    'Das X neben einem Dokument entfernt nur die Verknüpfung, nicht das Dokument. Es bleibt im Tab „Dateien“ der Reise.',
  'help.guide.booking-files.tip.3':
    'Welche Dateitypen sich anhängen lassen, legt die Administration unter „Erlaubte Dateitypen“ fest. Standardmäßig sind Dokumente, Texte und Bilder erlaubt.',
  // booking-cost
  'help.guide.booking-cost.title': 'Aus dem Preis einer Buchung eine Ausgabe machen',
  'help.guide.booking-cost.goal':
    'Die Kosten einer Buchung unter „Kosten“ erfassen, aufgeteilt auf die Personen, die dafür zahlen.',
  'help.guide.booking-cost.step.1':
    'Öffne die Buchung mit dem Stift auf ihrer Karte und scroll ans Ende des Formulars. Unter „Kosten“ findest du „Ausgabe erstellen“ und „Bestehende Ausgabe verknüpfen“ mit dem Hinweis, dass die Buchung zuerst gespeichert und dann der Kosteneditor geöffnet wird.',
  'help.guide.booking-cost.step.2':
    'Klick auf „Ausgabe erstellen“. Die Buchung wird gespeichert, ihr Formular schließt sich, und der Kosteneditor öffnet sich als „Ausgabe hinzufügen“.',
  'help.guide.booking-cost.step.3':
    'Als Name im Kopfbereich steht schon der Titel der Buchung, und unter „Tag“ ist schon ihr Tag eingetragen. Trag den „Gesamtbetrag“ ein und prüf daneben die „Währung“.',
  'help.guide.booking-cost.step.4':
    'Das Label in der Kopfzeile ist die Kategorie. Sie ist schon passend zum Buchungstyp gesetzt. Wähle unter „Wer hat bezahlt?“, wer gezahlt hat, und unter „Aufteilen“, wie der Betrag geteilt wird.',
  'help.guide.booking-cost.step.5': 'Klick auf „Ausgabe hinzufügen“.',
  'help.guide.booking-cost.result':
    'Die Karte zeigt den Betrag unten, im Formular der Buchung steht die Ausgabe unter „Verknüpfte Ausgaben“, und dieselbe Ausgabe erscheint mit dieser Buchung verknüpft im Tab „Kosten“.',
  'help.guide.booking-cost.tip.1':
    'Die Kategorie hängt vom Typ ab: Aus „Restaurant“ wird „Essen & Trinken“, aus „Unterkunft“ wird „Unterkunft“, aus „Parken“ wird „Parken“, und „Veranstaltung“ und „Tour“ werden beide zu „Andere“.',
  'help.guide.booking-cost.tip.2':
    'Eine Buchung kann mehrere Ausgaben haben. „Bestehende Ausgabe verknüpfen“ bietet die Ausgaben unter „Kosten“ an, die noch nirgends verknüpft sind. Bei einer verknüpften Ausgabe hebt „Lösen, Ausgabe behalten“ die Verknüpfung auf und behält die Ausgabe unter „Kosten“, der Papierkorb löscht sie dagegen.',
  'help.guide.booking-cost.tip.3':
    '„Kosten“ erscheint nur im Formular, solange das Addon „Kosten“ aktiv ist. Das schaltet der Administrator unter „Addons“.',
  // filter-bookings
  'help.guide.filter-bookings.title': 'Buchung finden',
  'help.guide.filter-bookings.goal': 'Filtere einen langen Tab nach Stichwort, Status, Typ oder Person.',
  'help.guide.filter-bookings.step.1':
    'Gib in der Leiste etwas bei „Suchen“ ein. Durchsucht werden Titel, Typen, Orte und Adressen, Notizen, Buchungscodes und die Namen der Reisenden. Schon beim Tippen werden die Ergebnisse weniger. Mit Esc leerst du das Feld.',
  'help.guide.filter-bookings.step.2':
    'Klick auf „Filtern“, den Trichter neben der Suche. Das Panel enthält „Status“, „Typ“ und, sobald einer Buchung Personen zugewiesen sind, „Reisende“.',
  'help.guide.filter-bookings.step.3':
    'Wähle unter „Status“ „Bestätigt“ oder „Ausstehend“, um nur diese zu sehen; „Alle“ zeigt beide.',
  'help.guide.filter-bookings.step.4':
    'Klick unter „Typ“ einen oder mehrere Typen an, um nur diese anzuzeigen. Bei jedem Typ steht, wie viele Buchungen er hat, und ein Häkchen markiert die ausgewählten.',
  'help.guide.filter-bookings.step.5':
    'Eine Zahl an „Filtern“ zeigt, wie viele Filter aktiv sind, und ein Chip neben der Suche zeigt, wie viele von allen Buchungen übrig sind. Klick auf den Chip oder unten im Panel auf „Filter zurücksetzen“, um wieder alles zu sehen.',
  'help.guide.filter-bookings.result':
    'Der Tab zeigt nur deine Auswahl, in „Karten“, „Liste“ und „Zeitstrahl“ gleichermaßen, und die Filter bleiben für diese Reise erhalten, bis du den Browser-Tab schließt.',
  'help.guide.filter-bookings.tip.1':
    '„Typ“ erscheint nur, wenn der Tab mehr als einen Typ enthält, und bietet nur die Typen an, die im Tab vorkommen. Gibt es im Tab keine Tour, fehlt also auch die Option „Tour“.',
  'help.guide.filter-bookings.tip.2':
    'Passt nichts zum Filter, zeigt der Tab „Nichts passt zu diesen Filtern“ und direkt darunter „Filter zurücksetzen“.',
  // import-booking-file
  'help.guide.import-booking-file.title': 'Buchung aus der Bestätigung importieren',
  'help.guide.import-booking-file.goal':
    'TREK die Buchung aus der E-Mail oder dem PDF des Anbieters auslesen lassen, damit du nichts abtippen musst.',
  'help.guide.import-booking-file.step.1':
    'Klick in der Leiste auf das Download-Symbol „Buchungsbestätigungen importieren“; der Name erscheint, wenn du mit der Maus darüberfährst. Der gleichnamige Dialog öffnet sich.',
  'help.guide.import-booking-file.step.2':
    'Zieh die Bestätigungen auf das Feld, oder klick darauf und wähl sie aus: EML, PDF, PKPass, HTML und TXT, bis zu fünf Dateien mit je 10 MB, und Fotos (JPG, PNG, WEBP), wenn das KI-Modell Bilder lesen kann. Die gewählten Dateien werden im Feld mit Namen angezeigt.',
  'help.guide.import-booking-file.step.3':
    'Klick auf „Importieren“. Der Dialog schließt sich sofort, weil das Auslesen im Hintergrund läuft.',
  'help.guide.import-booking-file.step.4':
    'Eine Karte unten rechts zeigt unter dem Dateinamen den Fortschritt. Sie bleibt sichtbar, während du dich durch die App bewegst, und auch nach dem Neuladen. Aus „Dateien werden verarbeitet…“ wird ein Häkchen, sobald das Auslesen fertig ist, und die Karte bietet „Importieren“ an. Klick darauf.',
  'help.guide.import-booking-file.step.5':
    'Jede gefundene Buchung öffnet sich nacheinander in „Neue Buchung“, schon ausgefüllt. Bei einem Hotel sind das der Name als Titel und, falls der Ort in der Reise ist, unter „Unterkunft“ Ort / Adresse, „Von“ und „Bis“ für die Nächte, Check-in und Check-out, der Buchungscode, die Bestätigung unter „Dateien“ und, wenn „Kosten“ aktiv ist, der Preis als „Verknüpfte Ausgabe“. Prüf alles und klick auf „Hinzufügen“.',
  'help.guide.import-booking-file.result':
    'Die Buchung erscheint als Karte unter „Ausstehend“, mit ihren Nächten, dem Buchungscode und der Bestätigung unter „Dateien“. Der Aufenthalt erscheint an diesen Tagen im Plan. Ist „Kosten“ aktiv, wird der Preis als mit der Buchung verknüpfte Ausgabe angelegt.',
  'help.guide.import-booking-file.tip.1':
    'Das Import-Symbol erscheint nur, wenn der Server Bestätigungen auslesen kann. Dafür braucht es entweder den Extraktor oder das Addon „KI-Auswertung“, das die Administration unter „Addons“ einschaltet. Ein Tab ohne Buchungen zeigt den Import außerdem als Button „Aus Datei importieren“.',
  'help.guide.import-booking-file.tip.2':
    'Konnte nichts ausgelesen werden, steht das auf der Karte. Ist „KI-Auswertung“ aktiv, bietet sie „Mit KI auslesen“ an und schickt dieselben Dateien direkt an das Modell. Ein fertiges Ergebnis wird zehn Minuten lang aufbewahrt; starte die Prüfung innerhalb dieser Zeit.',
  'help.guide.import-booking-file.tip.3':
    'Die Bestätigung wird nur angehängt, wenn ihr Dateityp in den Admin-Einstellungen unter „Erlaubte Dateitypen“ steht. PDF ist standardmäßig erlaubt; eine Mail (EML) muss erst hinzugefügt werden, sonst wird die Buchung ohne sie gespeichert.',
  // edit-booking
  'help.guide.edit-booking.title': 'Buchung ändern',
  'help.guide.edit-booking.goal':
    'Eine Uhrzeit korrigieren, einen später eingetroffenen Code ergänzen oder eine Buchung von „Ausstehend“ auf „Bestätigt“ setzen.',
  'help.guide.edit-booking.step.1':
    'Fahr mit der Maus über die Karte und klick auf den Stift in ihrer Kopfzeile. „Reservierung bearbeiten“ öffnet sich mit allen Angaben zur Buchung.',
  'help.guide.edit-booking.step.2':
    'Ändere, was nötig ist, zum Beispiel den Buchungscode, den der Anbieter nachgereicht hat.',
  'help.guide.edit-booking.step.3':
    'Klick oben in der Kopfzeile auf das Label „Ausstehend“. Es wechselt zu „Bestätigt“, und die Kopfzeile wird grün.',
  'help.guide.edit-booking.step.4': 'Klick auf „Aktualisieren“.',
  'help.guide.edit-booking.result':
    'Die Karte wandert: Eine bestätigte Buchung erscheint im Abschnitt „Bestätigt“ mit grünem Punkt und grünem Streifen oben, und alle in der Reise sehen, wie sie wandert.',
  'help.guide.edit-booking.tip.1':
    'Kannst du einen „Buchungscode“ nicht lesen, ist in den „Einstellungen“ unter „Allgemein“ die Option „Buchungscodes verbergen“ aktiv. Fahr mit der Maus über den Code oder klick darauf, um ihn zu lesen.',
  'help.guide.edit-booking.tip.2':
    'Änderst du den Typ, ändert sich auch die Kategorie einer verknüpften Ausgabe, außer du hast im Kosteneditor von Hand eine Kategorie gewählt.',
  'help.guide.edit-booking.tip.3':
    '„Bearbeiten“ unten in der Detailansicht einer Buchung öffnet dasselbe Formular. Den Status kannst du auch ohne Formular wechseln: per Klick auf den Punkt einer Karte oder Zeile oder auf das Status-Label in der Detailansicht.',
  // delete-booking
  'help.guide.delete-booking.title': 'Buchung löschen',
  'help.guide.delete-booking.goal': 'Entferne eine stornierte Buchung aus der Reise.',
  'help.guide.delete-booking.step.1':
    'Zeig auf die Karte und klick oben auf den Papierkorb. Der Papierkorb unten in den Details einer Buchung macht dasselbe.',
  'help.guide.delete-booking.step.2':
    '„Buchung löschen?“ nennt die gewählte Buchung und weist darauf hin, dass sie endgültig gelöscht wird. Sind Kosten mit ihr verknüpft, steht dort auch, dass diese mitgelöscht werden.',
  'help.guide.delete-booking.step.3': 'Klick auf „Löschen“.',
  'help.guide.delete-booking.result':
    'Die Karte wird für alle in der Reise gelöscht. Das Löschen einer Buchung lässt sich nicht rückgängig machen, die Sicherheitsabfrage ist also deine letzte Gelegenheit zum Abbrechen.',
  'help.guide.delete-booking.tip.1':
    'Löschst du eine Buchung, werden auch die damit verknüpften Ausgaben entfernt. Löschst du eine Unterkunft, verschwinden auch ihre Nächte aus dem Tagesplan.',
  'help.guide.delete-booking.tip.2':
    'Angehängte Dokumente bleiben im Tab „Dateien“ der Reise. Entfernt wird nur ihre Verknüpfung zur Buchung.',

  // ── Screen: trip-costs ────────────────────────────────────────────────────────────────
  'help.ctx.trip-costs.title': 'Kosten',
  'help.ctx.trip-costs.summary':
    'Das Geld der Reise: jede Ausgabe in einem Kassenbuch nach Datum oder in einer Tabelle, wer sie eingetragen hat und wer dafür aufkommt, in der Währung des Belegs. Die rechte Spalte zeigt, wer wem wie viel zahlen muss, damit alles ausgeglichen ist.',
  'help.ctx.trip-costs.bullet.1':
    'Die Leiste oben zeigt den Reisezeitraum und die Reisenden, auf die die Kosten aufgeteilt werden. Außerdem findest du dort „Ausgaben suchen…“, „Filtern“ (den Trichter), „CSV exportieren“ (das Download-Symbol) und den Umschalter „Liste“ / „Tabelle“.',
  'help.ctx.trip-costs.bullet.2':
    'Rechts in der Leiste erfasst „Ausgleichen“ alle offenen Überweisungen auf einmal, „Beleg scannen“ füllt eine Ausgabe anhand eines Fotos aus, wenn das Addon „KI-Auswertung“ Bilder lesen kann, und „Ausgabe hinzufügen“ öffnet den Editor.',
  'help.ctx.trip-costs.bullet.3':
    'Vier Karten unter der Leiste: „Du schuldest“ und „Dir wird geschuldet“ zeigen deine Seite der Abrechnung, „Ausstehender Betrag“ ist das, was erfasst ist, aber noch keinen Zahler hat, und „Gesamtausgaben“ rechnet alles zusammen, darunter „Dein Anteil“ und „Du zahltest“.',
  'help.ctx.trip-costs.bullet.4':
    'Die Ausgabenliste ist nach Tagen gruppiert, der neueste zuerst; über jedem Tag stehen die Zahl der Einträge und die Summe der Ausgaben. Eine Zeile zeigt die Kategorie als farbigen Reiter, den Namen, die Zahler-Chips mit dem, was jeder bezahlt hat, darunter „Aufteilen“ mit dem Anteil jedes Reisenden (ein Haken zeigt, wer seinen Anteil bezahlt hat), dann die Notiz und den Betrag, dazu „du hast geliehen“ oder „du hast geborgt“, wenn du durch die Aufteilung im Plus oder im Minus bist.',
  'help.ctx.trip-costs.bullet.5':
    'Die rechte Spalte zeigt die Ergebnisse: „Ausgleichen“ listet, wer wem wie viel zahlt, „Salden“ zeigt das Plus oder Minus jedes Reisenden, „Endbudget“, was die Reise jeden Einzelnen kostet, und „Nach Kategorie“, wofür das Geld ausgegeben wurde.',
  'help.ctx.trip-costs.bullet.6':
    'Eine erfasste Zahlung steht als eigene Zeile im selben Verlauf, daneben Stift und „Rückgängig“. Eine Ausgabe hat Stift und Papierkorb; der Papierkorb fragt nach, bevor er die Ausgabe löscht. Hat eine Ausgabe Belege, steht neben ihrem Namen ein Chip „Beleg“, der sie öffnet.',
  'help.ctx.trip-costs.bullet.7':
    '„Tabelle“ in der Leiste zeigt dieselben Ausgaben als Tabelle, nach Kategorie gruppiert, mit „Personen“ und „Tage“ sowie dem Betrag pro Person und pro Tag. „Übersicht“ ersetzt dann „Nach Kategorie“. „Kosten“ merkt sich die gewählte Ansicht.',
  // add-expense
  'help.guide.add-expense.title': 'Ausgabe hinzufügen',
  'help.guide.add-expense.goal': 'Festhalten, was etwas gekostet hat, wer es bezahlt hat und mit wem es geteilt wird.',
  'help.guide.add-expense.step.1':
    'Klick rechts in der Leiste auf „Ausgabe hinzufügen“. Der Editor öffnet sich mit dem heutigen Datum, dir als Zahler und allen Reisenden in der Aufteilung.',
  'help.guide.add-expense.step.2':
    'Gib oben im Dialog ein, wofür die Ausgabe war. Solange das Feld leer ist, steht dort „z.B. Abendessen, Souvenirs, Benzin…“. Das ist der Name der Ausgabe, und ohne ihn kannst du die Ausgabe nicht speichern.',
  'help.guide.add-expense.step.3':
    'Das Badge unter dem Namen ist die „Kategorie“; bis du eine andere wählst, steht dort „Essen & Trinken“. Es gibt vierzehn Kategorien, und sie lassen sich nicht ändern. Die Kopfzeile nimmt die Farbe der gewählten Kategorie an, ebenso die Markierung in der Zeile und ihr Balken in „Nach Kategorie“.',
  'help.guide.add-expense.step.4':
    'Trag den Betrag vom Beleg unter „Gesamtbetrag“ ein. Die „Währung“ daneben ist anfangs die, in der „Kosten“ angezeigt wird. Änderst du sie, zeigt der Editor den umgerechneten Betrag. „Tag“ steht anfangs auf heute, und unter diesem Tag erscheint die Ausgabe in der Liste.',
  'help.guide.add-expense.step.5':
    'Klick unter „Wer hat bezahlt?“ auf die Person, die tatsächlich bezahlt hat. „Du“ ist vorausgewählt. „Noch niemand bezahlt“ erfasst den Betrag, ohne dass jemand etwas schuldet, und „Mehrere haben bezahlt“ im Schalter neben der Überschrift teilt die Rechnung auf mehrere Zahler auf.',
  'help.guide.add-expense.step.6':
    '„Aufteilen“ darunter steht anfangs auf „Gleichmäßig“, alle sind angehakt und der Anteil steht neben jedem Namen. Lass es so oder ändere es. Klick unten im Dialog auf „Ausgabe hinzufügen“, um zu speichern.',
  'help.guide.add-expense.result':
    'Die Ausgabe steht im Kassenbuch unter ihrem Tag und fließt in „Gesamtausgaben“ ein, und die Ausgleichsspalte hat neu berechnet, wer wem etwas schuldet.',
  'help.guide.add-expense.tip.1':
    'Änderst du die Vorgaben nicht, ist die Ausgabe auf heute datiert, von dir bezahlt und gleichmäßig auf alle aufgeteilt: Du musst nur Name und Betrag eintragen.',
  'help.guide.add-expense.tip.2':
    'Das ± neben dem Betrag macht aus der Ausgabe eine Erstattung. Ein negativer Betrag bedeutet, dass Geld zurückgezahlt wird, und die Aufteilung kehrt sich um.',
  'help.guide.add-expense.tip.3':
    '„Anhängen“ neben „Belege & Rechnungen“ unten im Dialog nimmt Bilder und PDFs an. Sie werden beim Speichern hochgeladen und landen in den Dateien der Reise, und in der Liste erscheint neben dem Namen ein Chip „Beleg“.',
  // expense-payers
  'help.guide.expense-payers.title': 'Festlegen, wer bezahlt hat',
  'help.guide.expense-payers.goal':
    'Halte fest, wer eine Ausgabe bezahlt hat. Das ist die andere Hälfte der Ausgleichsrechnung.',
  'help.guide.expense-payers.step.1':
    'Öffne eine Ausgabe mit dem Stift neben ihrer Zeile und sieh dir „Wer hat bezahlt?“ an. Im Schalter neben der Überschrift ist „Eine Person hat bezahlt“ voreingestellt: Jeder Reisende ist ein Chip, der umrandete Chip ist die Person, die bezahlt hat. Klick auf einen anderen Chip, um das zu ändern.',
  'help.guide.expense-payers.step.2':
    '„Noch niemand bezahlt“, der gestrichelte Chip hinter den Reisenden, erfasst den Betrag, ohne dass jemand etwas schuldet. Die Ausgabe zählt trotzdem zu den „Gesamtausgaben“.',
  'help.guide.expense-payers.step.3':
    '„Mehrere haben bezahlt“, die andere Option dieses Schalters, listet alle Reisenden mit einem Kästchen zum Anhaken auf, und jede angehakte Person bekommt ein Betragsfeld. Hak an, wer bezahlt hat, und trag ein, wie viel jede Person gezahlt hat. Die Beträge müssen zusammen den Gesamtbetrag ergeben.',
  'help.guide.expense-payers.step.4':
    'Eine Ausgabe, die noch niemand bezahlt hat, wird in ihrer Zeile als „Offen“ markiert und in der Karte „Ausstehender Betrag“ gezählt, die alle Ausgaben ohne Zahler zusammenrechnet.',
  'help.guide.expense-payers.result':
    'Wer bezahlt hat, bestimmt, wer Geld zurückbekommt, die Aufteilung bestimmt, wer zahlt, und „Salden“ ist die Differenz aus beidem.',
  'help.guide.expense-payers.tip.1':
    '„Wer hat bezahlt?“ und „Aufteilen“ sind unabhängig voneinander: Du kannst ein Abendessen bezahlen, bei dem du nicht dabei warst, und an einem beteiligt sein, das du nicht bezahlt hast.',
  'help.guide.expense-payers.tip.2':
    'Bei mehreren Zahlern müssen die Beträge zusammen die Gesamtsumme ergeben. Hakst du einen weiteren Zahler an, wird der Rest neu auf die Beträge verteilt, die du nicht selbst eingegeben hast. Solange die Summe nicht stimmt, zeigt der Editor die nötige Gesamtsumme an und speichert nicht.',
  'help.guide.expense-payers.tip.3':
    'Setzt du eine Ausgabe auf „Noch niemand bezahlt“ zurück, wird sie nicht entfernt: Der Betrag bleibt in den „Gesamtausgaben“, und die Zeile wird als „Offen“ markiert.',
  // split-expense
  'help.guide.split-expense.title': 'Rechnung unter den Reisenden aufteilen',
  'help.guide.split-expense.goal':
    'Festlegen, wer für eine Ausgabe aufkommt: alle zu gleichen Teilen, nach Betrag oder Posten für Posten laut Beleg.',
  'help.guide.split-expense.step.1':
    'Im Ausgabeneditor listet „Aufteilen“ alle Reisenden mit einem Kästchen zum Anhaken auf. Entfernst du den Haken bei einem Namen, ist die Person bei dieser Ausgabe nicht dabei: Der Name wird grau, verliert seinen Anteil und schuldet nichts.',
  'help.guide.split-expense.step.2':
    '„Gleichmäßig“ im Schalter neben der Überschrift ist die Voreinstellung: Alle angehakten Reisenden bekommen denselben Anteil, der neben ihrem Namen steht. Die Badges unter der Liste zeigen, auf wie viele Personen aufgeteilt wird und wie hoch jeder Anteil ist.',
  'help.guide.split-expense.step.3':
    '„Individuell“ ersetzt die Anteile durch Betragsfelder. Gib ein, was jeder Reisende schuldet. Das Badge darunter aktualisiert sich beim Tippen und wird bei „Aufteilung passt zur Summe“ grün. Solange die Beträge nicht zur Summe passen, kannst du nicht speichern.',
  'help.guide.split-expense.step.4':
    '„Beleg“ teilt die Rechnung Position für Position auf: „Artikel hinzufügen“, dann pro Position Name und Preis, und neben „Aufteilen auf:“ die Reisenden, die sich diese Position teilen.',
  'help.guide.split-expense.step.5':
    '„Anteil pro Person“ unter den Positionen zeigt, was jeder Reisende am Ende schuldet, und der „Gesamtbetrag“ oben ist die Summe der Positionen. Klick unten im Dialog auf „Speichern“.',
  'help.guide.split-expense.result':
    'Aus der Aufteilung berechnen sich alle Salden. Sie wird mit der Ausgabe gespeichert, steht in ihrer Zeile als „Aufteilen“ mit dem Anteil jedes Reisenden und lässt sich später ändern, ohne dass sich sonst etwas ändert.',
  'help.guide.split-expense.tip.1':
    'Wer keinen Haken hat, schuldet für diese eine Ausgabe nichts. Die anderen zahlen ihren Anteil.',
  'help.guide.split-expense.tip.2':
    '„Gleichmäßig“ teilt auf den Cent genau: Der übrige Cent geht bei jeder Ausgabe an eine andere Person, damit nicht immer dieselbe ihn zahlt.',
  'help.guide.split-expense.tip.3':
    'Im Beleg-Modus berechnet TREK den „Gesamtbetrag“ selbst und graut das Feld aus: Er ist die Summe der Positionen auf dem Beleg.',
  'help.guide.split-expense.tip.4':
    'Eine individuelle Aufteilung kannst du auch in Prozent eingeben: Stell „Anteile eingeben als“ auf %. Die Anteile müssen zusammen 100 % ergeben, bevor sich die Ausgabe speichern lässt.',
  // expense-currency
  'help.guide.expense-currency.title': 'Ausgabe in einer anderen Währung eintragen',
  'help.guide.expense-currency.goal': 'Trag den Betrag vom Beleg ein, TREK speichert den Wechselkurs.',
  'help.guide.expense-currency.step.1':
    'Öffne „Ausgabe hinzufügen“. Gib oben im Dialog den Namen ein und trag unter „Gesamtbetrag“ genau den Betrag vom Beleg ein, nicht einen umgerechneten.',
  'help.guide.expense-currency.step.2':
    'Öffne „Währung“ neben dem Betrag und wähle die Währung des Belegs. Die Liste enthält alle Codes, die TREK kennt, und lässt sich durchsuchen: Gib einfach die drei Buchstaben ein.',
  'help.guide.expense-currency.step.3':
    'Unter den Feldern erscheint eine Reihe von Badges: dein eingegebener Betrag und sein aktueller Wert, markiert mit „Live-Kurs“. Das ist nur eine Vorschau, gespeichert wird nicht dieser Wert.',
  'help.guide.expense-currency.step.4':
    'Klick unten im Dialog auf „Ausgabe hinzufügen“. Der Kurs wird in diesem Moment festgeschrieben: Die Ausgabe behält den Wert, den sie an dem Tag hatte, an dem du sie eingetragen hast.',
  'help.guide.expense-currency.step.5':
    'Im Kassenbuch zeigt die Zeile unter dem Namen beide Beträge: deinen eingegebenen, einen Pfeil und den Betrag in der Reisewährung. Alle Summen, Salden und Ausgleiche im Tab „Kosten“ rechnen mit dem zweiten Betrag.',
  'help.guide.expense-currency.result':
    'Die Ausgabe behält den eingegebenen Betrag und die Währung. Das Kassenbuch zeigt beides, und Summen und Salden der Reise werden in der Reisewährung berechnet.',
  'help.guide.expense-currency.tip.1':
    'Der Kurs wird beim Speichern festgeschrieben. Eine beglichene Schuld ändert sich also nicht, wenn sich der Wechselkurs eine Woche später ändert. Einen neuen Kurs speichert TREK nur, wenn du die Währung der Ausgabe änderst.',
  'help.guide.expense-currency.tip.2':
    'Die „Anzeigewährung“ in den Einstellungen ändert nur die Darstellung der Beträge. Die gespeicherten Beträge ändern sich nie. Ist sie leer, wird jede Reise in ihrer eigenen Währung angezeigt.',
  'help.guide.expense-currency.tip.3':
    'Die Reisewährung legst du an der Reise selbst fest, unter „Reise bearbeiten“. Dafür brauchst du die Berechtigung „Reisedetails bearbeiten“. Änderst du sie, werden alle festgeschriebenen Kurse für die neue Währung neu berechnet. Die Beträge selbst werden nicht umgerechnet.',
  // filter-costs
  'help.guide.filter-costs.title': 'Ausgabe oder Ausgaben eines Tages finden',
  'help.guide.filter-costs.goal': 'Eine lange Liste von Ausgaben so filtern, dass nur das übrig bleibt, was du suchst.',
  'help.guide.filter-costs.step.1':
    'Tipp in der Leiste in „Ausgaben suchen…“. Die Suche gleicht schon beim Tippen mit dem Namen der Ausgabe ab, und Esc leert das Feld wieder.',
  'help.guide.filter-costs.step.2':
    '„Filtern“, der Trichter neben der Suche, öffnet die Filter. Der Schalter oben ist deine eigene Sicht auf das Kassenbuch: „Alle“, „Von mir bezahlt“ für das, was du bezahlt hast, und „Mir geschuldet“ für die Ausgaben, bei denen du mehr als deinen Anteil gezahlt hast.',
  'help.guide.filter-costs.step.3':
    'Wähle unter „Kategorie“ eine der vierzehn Kategorien, dann werden nur deren Ausgaben angezeigt. Am Trichter siehst du, wie viele Filter aktiv sind.',
  'help.guide.filter-costs.step.4':
    'Wähle unter „Tag“ einen der Tage mit Ausgaben. Ein Banner ersetzt die Tagesüberschriften und zeigt diesen Tag ausgeschrieben, die Anzahl seiner Ausgaben und seine Summe.',
  'help.guide.filter-costs.step.5':
    '„CSV exportieren“, das Download-Symbol neben dem Trichter, speichert alle Ausgaben in einer Datei, mit Originalbetrag, Währung und umgerechnetem Betrag.',
  'help.guide.filter-costs.result':
    'Du kannst die Filter kombinieren, und die Tagesgruppen zeigen ihre Summen für die verbleibenden Ausgaben.',
  'help.guide.filter-costs.tip.1':
    'Erfasste Zahlungen haben keinen Namen und keine Kategorie, deshalb blenden eine Suche oder ein Kategoriefilter sie aus, ebenso „Mir geschuldet“. Der Tagesfilter zeigt sie weiter an, unter dem Tag der Zahlung.',
  'help.guide.filter-costs.tip.2':
    '„CSV exportieren“ exportiert immer alle Ausgaben, unabhängig von den Filtern auf dem Bildschirm, mit einer Zeile pro Ausgabe.',
  'help.guide.filter-costs.tip.3':
    '„Filter zurücksetzen“ unten im Filtermenü, das erscheint, sobald ein Filter aktiv ist, schaltet alle Filter auf einmal aus.',
  // settle-up
  'help.guide.settle-up.title': 'Sehen, wer wem etwas schuldet, und die Schulden begleichen',
  'help.guide.settle-up.goal':
    'Mach aus vielen geteilten Ausgaben möglichst wenige Überweisungen, die alle Schulden begleichen, und trag sie ein, sobald sie erledigt sind.',
  'help.guide.settle-up.step.1':
    'Die Karte „Ausgleichen“ in der rechten Spalte zeigt die Überweisungen, mit denen alle Schulden beglichen wären: wer wem wie viel zahlt, dargestellt als zwei Avatare mit den Namen im Tooltip. Die Zahl in der Kopfzeile zeigt, wie viele noch offen sind.',
  'help.guide.settle-up.step.2':
    '„Ausgleichen“ neben einer Überweisung markiert sie als erledigt. Die Überweisung verschwindet von der Karte, und die Salden werden aktualisiert.',
  'help.guide.settle-up.step.3':
    'Die erfasste Überweisung erscheint als Zeile im Kassenbuch unter dem Tag, an dem sie stattfand, markiert mit „Zahlung“, den beiden Reisenden und dem Betrag.',
  'help.guide.settle-up.step.4':
    'Neben dieser Zeile korrigierst du eine Zahlung mit dem Stift oder machst sie mit „Rückgängig“ rückgängig. Die Überweisung erscheint dann wieder in der Karte „Ausgleichen“.',
  'help.guide.settle-up.step.5':
    'Mit „Zahlung hinzufügen“ im Kopf der Karte erfasst du eine Überweisung, die keinem Vorschlag folgt. Wähle „Von“ und „Bis“, den Betrag, die Währung und den Tag der Zahlung, füge bei Bedarf eine Notiz hinzu, etwa wie bezahlt wurde, und klicke dann unten im Dialog auf „Zahlung hinzufügen“.',
  'help.guide.settle-up.step.6':
    '„Ausgleichen“ in der Leiste oben erfasst alle offenen Überweisungen auf einmal und ohne Rückfrage, etwa wenn die Gruppe am Ende der Reise alle Schulden begleicht.',
  'help.guide.settle-up.result':
    'Jede erfasste Überweisung erscheint als Zeile im Kassenbuch und entfernt eine Zeile aus der Karte „Ausgleichen“. Zeigt die Karte „Alle quitt“, ist die Reise vollständig bezahlt.',
  'help.guide.settle-up.tip.1':
    'Die Karte zeigt die wenigsten nötigen Überweisungen, nicht jede einzelne Schuld: Schulden sich drei Personen reihum etwas, bleiben am Ende ein oder zwei Zahlungen.',
  'help.guide.settle-up.tip.2':
    '„Ausgleichen“ hält eine Überweisung nur fest und überweist kein Geld. Zahl wie gewohnt und klick dann auf „Ausgleichen“.',
  'help.guide.settle-up.tip.3':
    'Eine Zahlung kann in jeder Währung erfolgen, eine Schuld in Yen mit Euro zu begleichen ist also ganz normal: Der Dialog hat eine eigene Währungsauswahl und schreibt auch diesen Kurs fest.',
  // final-budget
  'help.guide.final-budget.title': 'Sehen, was die Reise jeden Einzelnen gekostet hat',
  'help.guide.final-budget.goal':
    'Die Zahlen für jede Person sehen: den aktuellen Saldo und die tatsächlichen Kosten pro Person.',
  'help.guide.final-budget.step.1':
    '„Salden“ zeigt den Stand aller Reisenden: einen grünen Balken nach rechts, wenn die Reise ihnen etwas schuldet, einen roten nach links, wenn sie der Reise etwas schulden, und den Betrag neben dem Namen.',
  'help.guide.final-budget.step.2':
    '„Endbudget“ darunter beantwortet eine andere Frage: nicht, wer gerade wem was schuldet, sondern was die Reise jeden Reisenden kostet, wenn alles zurückgezahlt ist.',
  'help.guide.final-budget.step.3':
    'Klick auf einen Namen, um die Rechnung zu sehen: „Bezahlte Ausgaben“, darunter „Rückzahlungen netto“ und „Ausstehende Rückzahlungen“.',
  'help.guide.final-budget.step.4':
    'Unter den drei Zeilen steht beim Namen jedes Reisenden eine Liste mit den Posten, aus denen sich die jeweilige Zeile zusammensetzt: die von dieser Person bezahlten Ausgaben, die bereits erfassten und die noch offenen Überweisungen. Jede Liste ergibt in Summe genau die gleichnamige Zeile.',
  'help.guide.final-budget.result':
    '„Salden“ zeigt, wer heute Geld bekommt und wer Geld schuldet. „Endbudget“ zeigt, was die Reise jeden von euch kostet, sobald alles zurückgezahlt ist.',
  'help.guide.final-budget.tip.1':
    'Eine erfasste Zahlung ändert niemandes Endbudget. Sie verschiebt nur einen Betrag von den offenen Erstattungen zu den Netto-Erstattungen.',
  'help.guide.final-budget.tip.2':
    'Eine Ausgabe ohne Zahler fließt in keine der beiden Karten ein, genauso wenig wie in die Ausgleichsvorschläge.',
  // expense-from-booking
  'help.guide.expense-from-booking.title': 'Aus einer Buchung eine Ausgabe machen',
  'help.guide.expense-from-booking.goal':
    'Was ein Flug, ein Hotel oder ein Ort tatsächlich gekostet hat, an den passenden Eintrag hängen.',
  'help.guide.expense-from-booking.step.1':
    'Such die Buchung im Tab „Transporte“ oder „Buchungen“ und klick oben auf ihrer Karte auf den Stift.',
  'help.guide.expense-from-booking.step.2':
    'Scroll zu „Kosten“ gegen Ende des Formulars. Dort gibt es „Ausgabe erstellen“, das zuerst die Buchung speichert, und „Bestehende Ausgabe verknüpfen“ für eine Ausgabe, die schon unter „Kosten“ steht.',
  'help.guide.expense-from-booking.step.3':
    'Klick auf „Ausgabe erstellen“. Die Buchung wird gespeichert, das Formular schließt sich, und der Kosten-Editor öffnet sich: Der Titel der Buchung ist als Name eingetragen, ihr Typ einer passenden Kategorie zugeordnet und ihr Tag als Tag der Ausgabe gesetzt.',
  'help.guide.expense-from-booking.step.4':
    'Trag wie bei jeder Ausgabe Betrag und Währung, Zahler und Aufteilung ein und klick auf „Ausgabe hinzufügen“. Öffnest du die Buchung erneut, steht die Ausgabe unter „Verknüpfte Ausgaben“, mit einem Stift zum Bearbeiten, „Lösen, Ausgabe behalten“, um nur die Verknüpfung zu entfernen, und einem Papierkorb zum Löschen.',
  'help.guide.expense-from-booking.result':
    'Die Buchung zeigt ihre Kosten, und die Ausgabe ist eine ganz normale Zeile im Tab „Kosten“, mit Zahler, Aufteilung und Währung wie jede andere.',
  'help.guide.expense-from-booking.tip.1':
    'Wenn du die Buchung löschst, werden ihre verknüpften Ausgaben mitgelöscht, und die Rückfrage davor weist darauf hin. „Ausgabe entfernen“ im Block „Kosten“ der Buchung macht es umgekehrt: Die Ausgabe wird gelöscht, die Buchung bleibt. „Lösen, Ausgabe behalten“ behält beides.',
  'help.guide.expense-from-booking.tip.2':
    'Auch ein Ort hat diesen Block in seinem Formular; dort speichert „Ausgabe erstellen“ zuerst den Ort.',
  // costs-table
  'help.guide.costs-table.title': 'Kosten in einer Tabelle planen',
  'help.guide.costs-table.goal':
    'Die Ausgaben als Tabelle ansehen und ändern, nach Kategorie sortiert und pro Person und Tag berechnet.',
  'help.guide.costs-table.step.1':
    'Klick auf „Tabelle“, das zweite Symbol des Umschalters „Liste“ / „Tabelle“ in der Leiste. Statt des Kassenbuchs erscheint eine Tabelle mit denselben Ausgaben, und Suche und Filter gelten auch für sie.',
  'help.guide.costs-table.step.2':
    'Die Tabelle ist nach Kategorie gruppiert. Im Kopf jeder Gruppe stehen ihr Name, die Anzahl ihrer Ausgaben und ihre Zwischensumme; ein Klick auf den Kopf klappt die Gruppe zu. Die Spalten sind „Name“, „Datum“, „Gesamt“, „Personen“ und „Tage“, danach „Pro Person“, „Pro Tag“ und „P. p / Tag“, die daraus berechnet werden und grau hinterlegt sind. Die Zeile „Gesamt“ unten addiert alles.',
  'help.guide.costs-table.step.3':
    'Klick auf eine Zelle, um sie direkt zu ändern: einen Namen, eine Summe, „Personen“ oder „Tage“. Tipp den Wert ein und speichere mit Enter oder einem Klick daneben, mit Esc brichst du ab. Beim Datum öffnet sich der Kalender. „Pro Person“ und die anderen berechneten Spalten aktualisieren sich sofort.',
  'help.guide.costs-table.step.4':
    'Eine Summe mit Schloss kannst du hier nicht ändern: Jemand hat sie bezahlt oder sie wurde in einer anderen Währung erfasst, der Tooltip sagt dir, was zutrifft. Ein Klick darauf öffnet stattdessen die Ausgabe, damit Salden und festgeschriebener Wechselkurs korrekt bleiben.',
  'help.guide.costs-table.step.5':
    '„Ausgabe hinzufügen“ am Ende einer Kategorie fügt ihr eine Zeile namens „Neuer Eintrag“ hinzu, mit dem Datum des letzten Eintrags dort. Das Namensfeld ist schon geöffnet, damit du es ändern kannst. Die Summe trägst du genauso ein.',
  'help.guide.costs-table.step.6':
    'In dieser Ansicht zeigt die rechte Spalte „Übersicht“ statt „Nach Kategorie“. Sie summiert die Ausgaben auf vier Arten: nach „Kategorie“, nach „Tag“, nach „Zahler“, wobei unbezahlte unter „Noch kein Zahler“ stehen, und nach „Status“, also „Bezahlt“ gegenüber „Offen“.',
  'help.guide.costs-table.result':
    'Jede Ausgabe steht in ihrer Kategorie, mit ihrem Betrag pro Person und pro Tag. Änderst du eine Summe in einer Zelle, werden die Karten oben und die „Übersicht“ sofort aktualisiert.',
  'help.guide.costs-table.tip.1':
    '„Kosten“ merkt sich die Ansicht in diesem Browser: Es öffnet sich mit der Tabelle, bis du wieder auf „Liste“ klickst.',
  'help.guide.costs-table.tip.2':
    'Bei einer Ausgabe mit der Aufteilung „Individuell“ oder „Beleg“ gibt es keinen einheitlichen Anteil pro Person, deshalb bleiben „Pro Person“ und „P. p / Tag“ leer.',
  'help.guide.costs-table.tip.3':
    'Zahler, Aufteilung, Notiz und Belege bearbeitest du in der Ausgabe selbst: Unter „Weitere Optionen“ am Ende einer Zeile findest du „Bearbeiten“ und „Löschen“, um die Zeile zu entfernen.',

  // ── Screen: trip-transports ───────────────────────────────────────────────────────────
  'help.ctx.trip-transports.title': 'Transporte',
  'help.ctx.trip-transports.summary':
    'Alles, womit du von Stopp zu Stopp kommst: Flüge, Züge, Busse, Autos, Taxis, Fahrräder, Kreuzfahrten, Fähren, Seilbahnen und die ÖPNV-Verbindungen, die TREK für dich heraussucht. Der Tab listet sie auf; angelegt und angezeigt werden sie auch im Plan, und auf der Karte sind sie eingezeichnet.',
  'help.ctx.trip-transports.bullet.1':
    'Der Tab enthält nur die Fahrten. Unterkünfte, Restaurants, Veranstaltungen und Tickets findest du im Tab „Buchungen“, so erscheint derselbe Eintrag nie doppelt.',
  'help.ctx.trip-transports.bullet.2':
    'Die Leiste oben enthält „Suchen“, „Filter“ für Status, Typen und Reisende, die drei Ansichten „Karten“, „Liste“ und „Zeitstrahl“, „Ansicht anpassen“ und „Als Tabelle exportieren (CSV)“, das herunterlädt, was gerade angezeigt wird. „Transport“ rechts fügt eine Fahrt von Hand hinzu. Die Symbole davor, „Buchungsbestätigungen importieren“ und „Aus AirTrail importieren“, erscheinen, wenn der Server Bestätigungen lesen kann oder AirTrail verbunden ist. Ist der Tab leer, stehen dieselben Aktionen in der Mitte als „Transport“, „Aus Datei importieren“ und „AirTrail“.',
  'help.ctx.trip-transports.bullet.3':
    '„Karten“ ist die Ansicht, mit der sich der Tab öffnet: zuerst „Bestätigt“, dann „Ausstehend“. Jeden Abschnitt kannst du per Klick auf seine Überschrift einklappen. Die geplanten ÖPNV-Verbindungen haben keinen Status und stehen zeitlich sortiert zwischen den bestätigten Fahrten, außer du gibst ihnen über „Ansicht anpassen“ einen eigenen Abschnitt, „Automatische ÖPNV-Verbindungen“. „Liste“ gruppiert nach Tagen, und „Zeitstrahl“ zeigt alle Fahrten über die Reisetage hinweg.',
  'help.ctx.trip-transports.bullet.4':
    'Der obere Streifen einer Karte ist nach Status eingefärbt: grün für bestätigt, gelb für ausstehend, blau für eine geplante Verbindung. Er zeigt den Statuspunkt, den Typ, den Titel, den Stift und den Papierkorb. Darunter stehen „Datum“, „Zeit“, „Buchungscode“, „Route“ und die Fluggesellschaft mit Flugnummer oder die Zugnummer mit Gleis und Sitzplatz. Klick auf die Karte, um ihre Details zu öffnen.',
  'help.ctx.trip-transports.bullet.5':
    'Transporte legst du auch im Plan an: Das + im Kopf eines Tages (Tooltip „Zum Tag hinzufügen“) oder ein Rechtsklick auf den Kopf bietet „Transport hinzufügen“ und „ÖPNV“ an. Die Fahrzeitanzeige zwischen zwei Halten öffnet dieselbe Suche für genau diesen Abschnitt.',
  'help.ctx.trip-transports.bullet.6':
    'Hat ein Transport Start und Ziel, zeichnet er eine Linie auf die Karte. Das Routensymbol in seiner Zeile im Tagesplan und „Auf Karte“ in seinen Details blenden diese Linie ein. „Alle Buchungsrouten anzeigen“ in der Leiste über den Tagen blendet die Linien der ganzen Reise ein oder aus.',
  // transports-list
  'help.guide.transports-list.title': 'Tab „Transporte“ verstehen',
  'help.guide.transports-list.goal': 'Versteh, was die Liste zeigt, bevor du etwas daran änderst.',
  'help.guide.transports-list.step.1':
    'Transporte ist ein Tab der Reise, nach Planung (und Touren, wenn dieses Add-on aktiv ist). Er enthält nur die Fahrten: Hotels, Restaurants, Veranstaltungen und Tickets findest du im Tab Buchungen.',
  'help.guide.transports-list.step.2':
    'Mit „Suchen“ links in der Leiste grenzt du die Fahrten schon beim Tippen ein. „Filter“, der Trichter daneben, öffnet die Auswahl: „Status“ mit „Alle“, „Bestätigt“ und „Ausstehend“, darunter jeder verwendete Typ mit seiner Anzahl. Hak einen oder mehrere Typen an, um nur diese anzuzeigen. Eine Zahl am Trichter zeigt, wie viele Filter aktiv sind, und die Leiste nennt, wie viele Fahrten angezeigt werden, etwa „1 von 4“. „Filter zurücksetzen“ unten im Menü zeigt wieder alles an.',
  'help.guide.transports-list.step.3':
    'Mit „Karten“, „Liste“ und „Zeitstrahl“ daneben zeigst du die Transporte als Karten, als nach Tagen gruppierte Zeilen oder als Balken über die Reisetage. „Ansicht anpassen“, das Schieberegler-Symbol, legt für Karten und Liste „Gruppieren nach“ und „Sortieren nach“ fest und für den Zeitstrahl die Bahnen. „Ansicht zurücksetzen“ stellt die Standards wieder her. In „Karten“ zeigt „ÖPNV als eigener Abschnitt“ die geplanten Verbindungen unter „Automatische ÖPNV-Verbindungen“.',
  'help.guide.transports-list.step.4':
    'Jede Karte zeigt alle Details. Die Kopfzeile ist grün bei „Bestätigt“ und gelb bei „Ausstehend“ und zeigt Statuspunkt, Typ und Titel. Darunter nennt „Datum“ die Tage, über die sich der Transport erstreckt, mit ihren Daten. Dann folgen Zeit, Buchungscode, die Route mit dem Symbol des Typs zwischen den Stopps sowie Fluggesellschaft und Flugnummer oder Zugnummer, Gleis und Sitzplatz. Klick auf die Karte, um ihre Details zu öffnen.',
  'help.guide.transports-list.step.5':
    'Klick auf den Statuspunkt, um die Fahrt zwischen „Ausstehend“ und „Bestätigt“ umzuschalten; der Tooltip sagt dir, wohin, etwa „Auf Ausstehend setzen“. Der Stift in der Kopfleiste öffnet das Formular des Transports. Der Papierkorb löscht ihn nach der Rückfrage „Buchung löschen?“, die auflistet, was mit gelöscht wird, auch verknüpfte Kosten.',
  'help.guide.transports-list.result':
    'Jede Karte zeigt, ob die Fahrt gebucht ist, und mit der Leiste kannst du die Liste jederzeit filtern oder sortieren.',
  'help.guide.transports-list.tip.1':
    'Der Tab merkt sich deine Einstellungen: Ansicht, Gruppierung und Sortierung in diesem Browser, die eingeklappten Abschnitte pro Reise und die Filter, bis du den Browser-Tab schließt.',
  'help.guide.transports-list.tip.2':
    '„Buchungsbestätigungen importieren“ und „Aus AirTrail importieren“, die beiden Symbole vor „Transport“, erscheinen nur, wenn der Server Bestätigungen auslesen kann bzw. eine AirTrail-Instanz verbunden ist. Ohne sie füllst du die Liste von Hand oder über die ÖPNV-Suche.',
  // add-transport
  'help.guide.add-transport.title': 'Transport zu einem Tag hinzufügen',
  'help.guide.add-transport.goal':
    'Trag die Verbindung von einem Stopp zum nächsten an dem Tag ein, an dem sie stattfindet.',
  'help.guide.add-transport.step.1':
    'Klick im Kopf des Tages, an dem die Fahrt stattfindet, auf das + (Tooltip „Zum Tag hinzufügen“) und wähl „Transport hinzufügen“. Ein Rechtsklick auf den Kopf des Tages öffnet dasselbe Menü. Im Formular ist der Tag schon eingetragen.',
  'help.guide.add-transport.step.2':
    'Die Typ-Auswahl im Kopfbereich zeigt, womit du unterwegs bist, zu Beginn „Flug“. Klicke darauf, um Flug, Zug, Bus, Auto, Taxi, Fahrrad, Kreuzfahrt, Fähre, Seilbahn oder Andere zu wählen, und das Formular passt sich an: Ein Flug bekommt an jedem Stopp einen Flughafen, ein Zug eine Folge von Bahnhöfen, eine Kreuzfahrt „Einschiffung“, „Anlaufhafen“ und „Ausschiffung“, ein Auto „Abholung“, „Rückgabe“ und „Stopps unterwegs“.',
  'help.guide.add-transport.step.3':
    'Gib den Titel direkt oben in der Kopfzeile ein, wo der graue Beispieltext steht. Er ist das einzige Pflichtfeld: Solange er fehlt, steht darunter „Titel *“ und „Hinzufügen“ bleibt grau. Nimm einen Titel, den du auf einer Abfahrtstafel wiedererkennen würdest.',
  'help.guide.add-transport.step.4':
    'Unter „Route“ trägst du bei „Von“ und „Nach“ einen Bahnhof, einen Hafen oder eine Adresse ein. Die Orte der Reise werden dir schon vor dem Tippen angeboten. Gib mindestens drei Buchstaben ein, um zu suchen, und wähle einen Treffer. Ein Name, den du nur eintippst und nicht aus den Treffern auswählst, wird nicht gespeichert, und auf der Karte erscheint nichts.',
  'help.guide.add-transport.step.5':
    '„Datum“ und „Startzeit“ legen fest, wann die Fahrt beginnt, „Enddatum“ und „Endzeit“, wann sie endet. Kommst du erst am nächsten Tag an, stell dort den nächsten Tag ein. „Buchungscode“ und „Notizen“ weiter unten sind optional. Klick oben auf das Badge „Ausstehend“, um es auf „Bestätigt“ umzustellen.',
  'help.guide.add-transport.step.6': 'Klick auf „Hinzufügen“.',
  'help.guide.add-transport.result':
    'Der Transport steht als Zeile im Tag, zu seiner Uhrzeit zwischen den Stopps, und als Karte im Tab „Transporte“ unter „Ausstehend“ oder „Bestätigt“.',
  'help.guide.add-transport.tip.1':
    'Die Zeile wird nach ihrer Startzeit einsortiert, hinter dem letzten Stopp, der früher beginnt. Zieh sie am Griff an eine andere Stelle des Tages oder auf einen anderen Tag.',
  'help.guide.add-transport.tip.2':
    'Mit „Datei anhängen“ unter „Dateien“ fügst du das Ticket hinzu. „Ausgabe erstellen“ unter „Kosten“ speichert die Buchung und öffnet den Kosten-Editor für den Fahrpreis.',
  'help.guide.add-transport.tip.3':
    'Unter „Reisende“, dem ersten Block im Formular, legst du fest, wer mit diesem Transport reist. Hat die Reise mehr als ein Mitglied und nennt ein Transport jemanden, bietet der Filter im Tab auch „Reisende“ an. Damit siehst du nur die Transporte einer Person.',
  // import-transport-file
  'help.guide.import-transport-file.title': 'Flug aus dem E-Ticket importieren',
  'help.guide.import-transport-file.goal':
    'Einen Flug, Zug oder eine Fähre von TREK aus dem Ticket des Anbieters auslesen lassen und vor dem Speichern prüfen.',
  'help.guide.import-transport-file.step.1':
    'Klicke in der Leiste des Tabs Transporte auf das Download-Icon vor „Transport“; sein Tooltip lautet „Buchungsbestätigungen importieren“. Es öffnet sich der gleichnamige Dialog, derselbe wie im Tab Buchungen. Ist der Tab leer, kommst du auch über „Aus Datei importieren“ in der Mitte dorthin.',
  'help.guide.import-transport-file.step.2':
    'Zieh das Ticket auf das Feld oder klick darauf und wähl es aus: EML, PDF, PKPass, HTML und TXT, bis zu fünf Dateien mit je 10 MB, und Fotos eines Tickets (JPG, PNG, WEBP), wenn dein Server ein KI-Modell hat, das sie auslesen kann. Die gewählten Dateien werden im Feld mit Namen angezeigt.',
  'help.guide.import-transport-file.step.3':
    'Klick auf „Importieren“. Der Dialog schließt sich sofort, und die Datei wird im Hintergrund ausgelesen.',
  'help.guide.import-transport-file.step.4':
    'Eine Karte unten rechts zeigt unter dem Dateinamen den Fortschritt. Aus „Dateien werden verarbeitet…“ wird ein Häkchen, sobald das Auslesen fertig ist, und die Karte bietet „Importieren“ an. Klick darauf.',
  'help.guide.import-transport-file.step.5':
    'Ein Flug öffnet sich in „Transport hinzufügen“, schon ausgefüllt: das Typ-Badge auf „Flug“, Fluggesellschaft und Flugnummer als Titel oben, beide Flughäfen unter „Route“ mit „Abreise“ und „Ankunft“, ihren Uhrzeiten und Zeitzonen, „Fluggesellschaft“ und „Flugnr.“, der „Buchungscode“ und das Ticket unter „Dateien“. Prüf alles und klick auf „Hinzufügen“.',
  'help.guide.import-transport-file.result':
    'Der Flug erscheint als Karte unter „Ausstehend“ im Tab „Transporte“ und als Zeile am Abflugtag, mit dem Ticket unter „Dateien“. Sind beide Flughäfen bekannt, wird der Flug als Bogen auf der Karte gezeichnet.',
  'help.guide.import-transport-file.tip.1':
    'Beide Tabs nutzen denselben Import. Enthält eine Datei einen Flug und ein Hotel, öffnet sich zuerst der Flug in „Transport hinzufügen“ und dann das Hotel in „Neue Buchung“, egal in welchem Tab du angefangen hast.',
  'help.guide.import-transport-file.tip.2':
    'Flughäfen werden über ihren Code platziert. Konnte ein Bahnhof oder Hafen nicht gefunden werden, steht sein Name gelb auf der Import-Karte unten rechts. Wähle ihn unter „Route“ von Hand aus, bevor du auf „Hinzufügen“ klickst, sonst erscheint der Transport nicht auf der Karte.',
  // plan-transit
  'help.guide.plan-transit.title': 'ÖPNV-Verbindung planen',
  'help.guide.plan-transit.goal':
    'TREK die echten Züge und Busse zwischen zwei Punkten eines Tages suchen lassen und die gewählte Verbindung in den Plan übernehmen.',
  'help.guide.plan-transit.step.1':
    'Klick auf das + in der Kopfzeile des Tages und wähle „ÖPNV“. Die Suche öffnet sich für diesen Tag: Der Tag erscheint oben als Badge, und „Selbst“ und „Automatisch“ daneben wechseln zwischen dieser Suche und dem normalen Formular.',
  'help.guide.plan-transit.step.2':
    'In „Von“ und „Bis“ gehört eine Haltestelle oder ein Bahnhof. Solange das Feld leer ist, werden dir die Unterkunft des Tages, die Bahnhöfe und Flughäfen aus den Buchungen des Tages und die Halte des Tages vorgeschlagen. Sobald du zwei Buchstaben tippst, wird stattdessen in den Haltestellen des Fahrplans gesucht. „Tauschen“ zwischen den beiden Feldern dreht die Verbindung um.',
  'help.guide.plan-transit.step.3':
    '„Abfahrt“ oder „Ankunft“ mit einer Uhrzeit legt fest, wann du fahren willst, und „Beste Route“, „Wenige Umstiege“ oder „Wenig Fußweg“, wie die Ergebnisse sortiert werden.',
  'help.guide.plan-transit.step.4':
    'Die Chips darunter zeigen, welche Verkehrsmittel genutzt werden dürfen: Zug, U-Bahn, Tram, Bus, Fähre und Seilbahn. Schalte eines aus, um es auszuschließen, mindestens eines bleibt aktiv. Klick dann auf „Suchen“.',
  'help.guide.plan-transit.step.5':
    'Jedes Ergebnis zeigt Abfahrt und Ankunft, Fahrtdauer, Anzahl der Umstiege, Fußweg und die Linien als Abzeichen, in ihren eigenen Farben, sofern der Fahrplan sie liefert. Klick auf ein Ergebnis, um jeden Abschnitt aufzuklappen, mit den Haltestellen zum Ein- und Umsteigen, den Gleisen und den Fußwegen zwischen den Linien.',
  'help.guide.plan-transit.step.6': 'Klick auf „Zum Tag hinzufügen“.',
  'help.guide.plan-transit.result':
    'Die Verbindung steht als Zeile im Tag, mit den Badges ihrer Linien. Klick auf den Pfeil, um jeden Abschnitt zu sehen. Außerdem erscheint sie im Tab „Transporte“ als blaue Karte zwischen den bestätigten Fahrten.',
  'help.guide.plan-transit.tip.1':
    'Die Verbindungen stammen von Transitous, einem kostenlosen Community-Dienst mit öffentlichen Fahrplandaten: kein Schlüssel, kein Konto. Ein Admin kann die Suche stattdessen auf Google umstellen.',
  'help.guide.plan-transit.tip.2':
    'Nichts gefunden? Die Fahrplandaten gelten für eine bestimmte Region und einen bestimmten Zeitraum. Versuch es mit einer anderen Uhrzeit, schalte mehr Verkehrsmittel ein oder wähl einen Bahnhof statt des Ortes selbst. Die Meldung nennt den Dienst, der geantwortet hat. Eine Reise ohne Daten hat keinen Tag für die Suche und bietet deshalb nur das normale Formular an.',
  'help.guide.plan-transit.tip.3':
    'Dieselbe Suche gibt es auch für eine einzelne Etappe: Klick zwischen zwei Stopps auf die Verbindung mit der Fahrzeit und wähle „ÖPNV“. „Von“, „Nach“ und die Abfahrtszeit sind dann schon ausgefüllt.',
  // change-transit-route
  'help.guide.change-transit-route.title': 'Geplante Verbindung öffnen und ändern',
  'help.guide.change-transit-route.goal':
    'Lies die Verbindung Linie für Linie, benenne sie um oder such die Route neu.',
  'help.guide.change-transit-route.step.1':
    'Im Tab „Transporte“ ist eine geplante Verbindung eine Karte mit blauer Kopfzeile, zeitlich einsortiert zwischen den bestätigten Transporten. Ist unter „Ansicht anpassen“ die Option „ÖPNV als eigener Abschnitt“ eingeschaltet, steht sie stattdessen unter „Automatische ÖPNV-Verbindungen“. Klick auf die Karte. Die Verbindung öffnet sich als Buchung.',
  'help.guide.change-transit-route.step.2':
    'Die Kacheln oben zeigen Abfahrt und Ankunft mit ihren Haltestellen, „Dauer“, „Umstiege“ und „Zu Fuß“. Darunter zeigt „Verbindung“ die Fahrt Linie für Linie, mit Zeiten, Gleisen und den Fußwegen zwischen den Linien.',
  'help.guide.change-transit-route.step.3':
    '„Route ändern“ unten in der Buchung öffnet die Suche erneut, schon ausgefüllt mit Start und Ziel dieser Verbindung und ihrem Tag.',
  'help.guide.change-transit-route.step.4':
    'Klick auf „Suchen“, öffne eine andere Verbindung und klick auf „Zum Tag hinzufügen“; sie ersetzt die alte. „Bearbeiten“ ganz rechts unten in der Buchung öffnet stattdessen das normale Transportformular, in dem du „Buchungscode“, Reisende, Notizen und Dateien bearbeiten kannst.',
  'help.guide.change-transit-route.result':
    'Die Fahrt nutzt jetzt die neue Verbindung, und ihre Karte im Tab „Transporte“ zeigt die neuen Linien und Zeiten.',
  'help.guide.change-transit-route.tip.1':
    'Klick auf den Titel oben in der Buchung, um die Verbindung umzubenennen, ohne die Route zu ändern. Notizen schreibst du im Transportformular, das sich über „Bearbeiten“ öffnet.',
  'help.guide.change-transit-route.tip.2':
    'Mit dem Papierkorb unten in der Buchung löschst du die Verbindung nach einer Rückfrage. Die Stopps des Tages bleiben erhalten.',
  // leg-travel-mode
  'help.guide.leg-travel-mode.title': 'Verkehrsmittel für eine Etappe ändern',
  'help.guide.leg-travel-mode.goal':
    'Stell eine Etappe eines Autotages auf Fußweg um oder plane sie mit der ÖPNV-Suche.',
  'help.guide.leg-travel-mode.step.1':
    'Die Verbindungen zwischen den Stopps erscheinen erst, wenn die Route des Tages eingeschaltet ist. Klick auf die Kopfzeile des Tages, um ihn zu öffnen, und dann in der Leiste unter seinen Stopps auf „Route“.',
  'help.guide.leg-travel-mode.step.2':
    'Jede Verbindung nennt Dauer und Distanz dieses Abschnitts, mit dem Icon des Verkehrsmittels, für das er berechnet wurde: ein Auto für „Auto“, ein Fuß für „Zu Fuß“, ein Rad für „Fahrrad“.',
  'help.guide.leg-travel-mode.step.3':
    'Klick auf die Verbindung. Im Menü stehen „Auto“, „Zu Fuß“ und „Fahrrad“, „ÖPNV“ für diesen einen Abschnitt und „Tages-Standard verwenden“.',
  'help.guide.leg-travel-mode.step.4':
    'Wähle „Zu Fuß“. Nur diese Etappe ändert sich, der Rest des Tages behält sein Verkehrsmittel.',
  'help.guide.leg-travel-mode.result':
    'Die Etappe zeigt das Fußgängersymbol und ihre Gehzeit, die übrigen Etappen des Tages behalten das Verkehrsmittel des Tages.',
  'help.guide.leg-travel-mode.tip.1':
    'Das Verkehrsmittel gehört zum Abschnitt, nicht zum Tag: Die Buttons „Auto“, „Zu Fuß“ und „Fahrrad“ für den ganzen Tag überschreiben nie einen Abschnitt, den du von Hand eingestellt hast. „Tages-Standard verwenden“ übergibt den Abschnitt wieder an diese Buttons.',
  'help.guide.leg-travel-mode.tip.2':
    '„ÖPNV“ im selben Menü öffnet die Verbindungssuche für genau diese Etappe, mit Start, Ziel und Abfahrtszeit schon ausgefüllt.',
  'help.guide.leg-travel-mode.tip.3':
    'Die Zeiten stammen von einem öffentlichen Routing-Dienst, der echte Straßen und Fußwege nutzt. Kann er eine Etappe nicht berechnen, bleibt sie eine gerade Linie ohne Zeitangabe.',
  // edit-transport
  'help.guide.edit-transport.title': 'Transport ändern oder löschen',
  'help.guide.edit-transport.goal':
    'Korrigiere eine Zeit, ein Gleis oder einen Buchungscode oder entferne den Transport aus der Reise.',
  'help.guide.edit-transport.step.1':
    'Im Tagesplan ist ein Transport eine Zeile zwischen den Halten, eingefärbt nach seinem Typ. Klick darauf, um die Buchung zu öffnen: Oben stehen als Pillen Status, Typ, Tage und „Buchungscode“ (mit einem Button zum Kopieren), darunter Abfahrts- und Ankunftszeit mit den jeweiligen Flughäfen oder Bahnhöfen.',
  'help.guide.edit-transport.step.2':
    '„Bearbeiten“ unten in der Buchung öffnet das Formular, mit dem sie angelegt wurde; oben über dem Titel steht „Transport bearbeiten“. Dort kannst du alles ändern: den Titel, die Badges für Status und Typ, die Route, die Tage und Uhrzeiten und den „Buchungscode“.',
  'help.guide.edit-transport.step.3':
    'Die Route eines Flugs besteht aus einer Folge von Flughäfen, die eines Zugs aus Bahnhöfen, die einer Kreuzfahrt aus Häfen. „Zwischenstopp hinzufügen“ (bei einer Kreuzfahrt „Hafen hinzufügen“) fügt einen weiteren dazwischen ein, und jeder Abschnitt behält seine eigenen Zeiten und seine eigene Flug- oder Zugnummer.',
  'help.guide.edit-transport.step.4':
    'Klick auf „Aktualisieren“. Um den Transport ganz zu entfernen, nutze den Papierkorb links in derselben Leiste, den Papierkorb unten in der Buchung oder den auf seiner Karte im Tab „Transporte“ und bestätige.',
  'help.guide.edit-transport.result':
    'Die Änderung erscheint überall, wo der Transport vorkommt: im Tab „Transporte“, an seinem Tag und in seiner Linie auf der Karte.',
  'help.guide.edit-transport.tip.1':
    'Dasselbe Formular öffnest du auf zwei Wegen: über „Bearbeiten“ in der Buchung, die sich aus einer Zeile im Tagesplan öffnet, und über den Stift auf der Karte im Tab „Transporte“. Auch eine geplante ÖPNV-Verbindung öffnet sich als Buchung; dort öffnet „Route ändern“ die Suche erneut und „Bearbeiten“ dieses Formular.',
  'help.guide.edit-transport.tip.2':
    'Um einen Transport auf einen anderen Tag zu verschieben, brauchst du das Formular nicht: Zieh seine Zeile einfach von einer Tageskarte auf die andere.',
  // transport-on-map
  'help.guide.transport-on-map.title': 'Transport auf der Karte anzeigen',
  'help.guide.transport-on-map.goal':
    'Sieh den tatsächlichen Verlauf eines Flugs, einer Autofahrt oder einer Verbindung.',
  'help.guide.transport-on-map.step.1':
    'Hat ein Transport Start und Ziel, zeigt seine Zeile im Tagesplan ein kleines Routensymbol. Klick darauf; sein Tooltip wechselt zu „Buchungsrouten ausblenden“.',
  'help.guide.transport-on-map.step.2':
    'Die Route erscheint auf der Karte, mit einem Badge an jedem Ende, das das Symbol des Verkehrsmittels zeigt.',
  'help.guide.transport-on-map.step.3':
    'Klick auf einen Endpunkt, und die Buchung öffnet sich über der Karte. Oben stehen Status, Typ, Tage und „Buchungscode“, darunter die Uhrzeiten mit Flughäfen oder Bahnhöfen, die Fluggesellschaft und die Flugnummer. Klick oben auf „Schließen“, um sie zu schließen.',
  'help.guide.transport-on-map.step.4':
    'Das Routensymbol in der Leiste über den Tagen wirkt auf die ganze Reise: „Alle Buchungsrouten anzeigen“ und „Alle Buchungsrouten ausblenden“, um sie wieder auszublenden.',
  'help.guide.transport-on-map.step.5':
    'Eine geplante ÖPNV-Verbindung hat kein eigenes Routensymbol. Sie wird über den Schalter „Route“ des Tages gezeichnet. „Alle Buchungsrouten ausblenden“ blendet sie deshalb nicht aus, solange die Route dieses Tages eingeschaltet ist.',
  'help.guide.transport-on-map.result':
    'Die Routen erscheinen auf der Karte mit einer Markierung an jedem Ende und bleiben sichtbar, bis du sie ausschaltest.',
  'help.guide.transport-on-map.tip.1':
    'Flüge, Kreuzfahrten und Fähren werden als Bogen gezeichnet. Auto, Bus, Taxi und Fahrrad folgen den echten Straßen. Züge und geplante Verbindungen verlaufen über die Bahnhöfe, an denen sie halten.',
  'help.guide.transport-on-map.tip.2':
    'Eine bestätigte Buchung erscheint als durchgezogene Linie, eine ausstehende als gestrichelte. Mit der Einstellung „Orts-Labels auf Buchungsrouten“ stehen Flughafencode oder Bahnhofsname an den Endpunkten.',
  'help.guide.transport-on-map.tip.3':
    '„Alle Buchungsrouten anzeigen“ ergänzt die bereits angezeigten Routen nicht, sondern ersetzt, was du über die einzelnen Symbole eingestellt hast. Danach sind alle Routen entweder ein- oder ausgeblendet.',
  // airtrail-import
  'help.guide.airtrail-import.title': 'Flüge aus AirTrail importieren',
  'help.guide.airtrail-import.goal':
    'Die Flüge, die du schon in AirTrail hast, auf einmal in die Reise importieren und sie danach über AirTrail aktuell halten.',
  'help.guide.airtrail-import.step.1':
    'Ist das AirTrail-Addon eingeschaltet und deine Instanz in den Einstellungen unter „Integrationen“ verbunden, zeigt die Leiste im Tab „Transporte“ vor „Transport“ ein Flugzeugsymbol: „Aus AirTrail importieren“. Klick darauf.',
  'help.guide.airtrail-import.step.2':
    '„Aus AirTrail importieren“ zeigt die Flüge deines Kontos in zwei Gruppen: „Während dieser Reise“ enthält die Flüge im Reisezeitraum, bereits angehakt, „Weitere Flüge“ den Rest, nicht angehakt. Flüge, die schon in der Reise sind, sind ausgegraut und als „Importiert“ markiert.',
  'help.guide.airtrail-import.step.3':
    'Jede Zeile ist ein Kontrollkästchen mit Fluggesellschaft und Flugnummer, den beiden Flughäfen und dem Datum. Klick auf eine Zeile, um den Flug ein- oder auszuschließen. Flüge unter „Weitere Flüge“ werden nur importiert, wenn du sie anhakst.',
  'help.guide.airtrail-import.step.4':
    'Anschlussflüge werden zusammengefasst: Jeder startet innerhalb eines Tages an dem Flughafen, an dem der vorherige gelandet ist. Das Häkchen darunter, „Als einen Flug mit Zwischenstopp in diesem Flughafen importieren“, ist schon gesetzt. Lass es gesetzt für eine Buchung mit Zwischenstopp, oder entferne es, um die Teilstrecken als einzelne Flüge zu importieren.',
  'help.guide.airtrail-import.step.5':
    'Klick unten rechts auf den Button, der die Zahl der angehakten Flüge zeigt, etwa „2 importieren“. Die Meldung danach nennt, wie viele Flüge importiert wurden.',
  'help.guide.airtrail-import.step.6':
    'Die Flüge erscheinen als Karten unter „Bestätigt“, jede mit einem blauen AirTrail-Badge neben dem Titel, und als Zeilen an den Tagen, an denen sie stattfinden. Ein Anschlussflug ist eine einzige Karte, seine Route führt über den Umsteigeflughafen.',
  'help.guide.airtrail-import.result':
    'Die Flüge aus AirTrail erscheinen als Karten im Tab „Transporte“ und als Zeilen an ihren Tagen, jeweils mit dem AirTrail-Badge, das ihre Herkunft zeigt.',
  'help.guide.airtrail-import.tip.1':
    'Flüge, die mit gleicher Nummer und gleichem Datum schon in der Reise sind, werden übersprungen. Eine Meldung sagt dir, wie viele es waren. Mit dem Rückgängig-Pfeil in der Werkzeugleiste über den Tagen machst du den ganzen Import rückgängig.',
  'help.guide.airtrail-import.tip.2':
    'AirTrail bleibt die maßgebliche Datenquelle. TREK übernimmt die Änderungen, wenn du die Reise öffnest, und alle paar Minuten im Hintergrund. Wird ein Flug in AirTrail gelöscht, bleibt seine Karte in TREK erhalten, ihr Label wechselt aber zu „Nicht synchronisiert“. Änderungen in TREK gehen nur dann zurück an AirTrail, wenn unter „Integrationen“ die Option „Änderungen zurück nach AirTrail schreiben“ eingeschaltet ist.',
  'help.guide.airtrail-import.tip.3':
    'Eine zusammengefasste Verbindung ist kein einzelner AirTrail-Flug, der synchronisiert werden kann. Sie wird deshalb nur einmalig importiert: Sie behält das blaue Label, und beim Darüberfahren mit der Maus siehst du einen Hinweis darauf. Dasselbe passiert mit einem synchronisierten Flug, wenn du ihm von Hand einen Zwischenstopp hinzufügst.',

  // ── Screen: trip-roadtrip ─────────────────────────────────────────────────────────────
  'help.ctx.trip-roadtrip.title': 'Roadtrip',
  'help.ctx.trip-roadtrip.summary':
    'Der Plan als eine durchgehende Fahrt: dieselben Tage und Orte, als Stopps verbunden, mit den Fahrten dazwischen, in einer Leiste in der linken Spalte und auf der Karte. Du siehst Entfernung und Fahrzeit, wo du tanken musst und was an der Strecke liegt.',
  'help.ctx.trip-roadtrip.bullet.1':
    'Mit „Tage“ und „Roadtrip“ oben in der linken Spalte wechselst du zwischen Tagesplan und Fahrt. Dabei wird nichts kopiert und nichts geändert: „Tage“ zeigt den Plan genau so, wie er war.',
  'help.ctx.trip-roadtrip.bullet.2':
    'Oben in der Leiste stehen die Summen für die ganze Reise: „Distanz“, „Fahrzeit“ und „Stationen“. Darunter folgt für jeden Tag mit Fahrt eine Karte: Nummer und Datum des Tages auf einer Kachel, dann Badges mit Kilometern und Fahrzeit, der Zahl der Halte und dem, was unterwegs überquert wird, sowie ein Badge „Spur“. Ein gebuchter Flug, Zug oder eine gebuchte Fähre steht als eigene Karte in der Abfolge.',
  'help.ctx.trip-roadtrip.bullet.3':
    'Ein nummerierter Halt ist ein Ort, um den es an diesem Tag geht. Ein Halt unterwegs, etwa zum Tanken, zum Laden oder an einem Rastplatz, zeigt statt einer Nummer das Icon seiner Art und wird nicht mitgezählt. Klicke auf eine Nummer, um zu ändern, welche Art von Halt es ist, auf das Badge „Aufenthalt“, um die Dauer festzulegen, und zieh einen Halt, um ihn innerhalb seines Tages oder auf einen anderen Tag zu verschieben.',
  'help.ctx.trip-roadtrip.bullet.4':
    'Zwischen zwei Stopps zeigt ein Fahrtbalken Strecke und Dauer der Etappe. Klick darauf für „Wege für diese Etappe“ oder klick auf die Route auf der Karte, um die Etappe über einen Zwischenpunkt zu führen.',
  'help.ctx.trip-roadtrip.bullet.5':
    'Die rechte Spalte wird zu „Auf der Strecke“: Wähl in einer Zeile, wonach du suchst und für welchen Tag, dann, wie breit der Korridor sein soll, und klick auf „Suchen“. Das Plus an einem Treffer, „Hinzufügen“, setzt ihn genau an der Stelle in die Fahrt, an der du tatsächlich vorbeikommst, und das Bett an einem Hotel bucht die Nacht. Mit „Selbst“ fügst du etwas hinzu, das die Suche nicht gefunden hat, und über die drei Punkte neben dem Titel importierst du eine Google-Maps-Route.',
  'help.ctx.trip-roadtrip.bullet.6':
    '„Fahreinstellungen“ darunter enthält die Limits, das Auto und seine Reichweite, die täglichen Fahrzeiten, was gemieden werden soll, wie die Linie gezeichnet wird und ob aktuelle Warnungen auf der Karte erscheinen. Die Einstellungen gehören zur Reise, damit alle mit demselben Auto planen.',
  // roadtrip-mode
  'help.guide.roadtrip-mode.title': 'Reise als eine durchgehende Fahrt ansehen',
  'help.guide.roadtrip-mode.goal': 'Den Plan in den Roadtrip-Modus schalten und verstehen, was die Leiste anzeigt.',
  'help.guide.roadtrip-mode.step.1':
    'Klick oben in der linken Spalte im Umschalter „Tage“ / „Roadtrip“ auf „Roadtrip“. Statt des Tagesplans siehst du jetzt die Fahrt, und die Karte zeigt jeden Tag, der eine Route hat.',
  'help.guide.roadtrip-mode.step.2':
    'Die Karte oben in der Leiste zeigt die Summen für die ganze Reise: „Distanz“, „Fahrzeit“ und „Stationen“. Sie bleibt stehen, während die Tage darunter durchscrollen.',
  'help.guide.roadtrip-mode.step.3':
    'Darunter folgt für jeden Tag mit einer Fahrt eine Karte; Tage ohne Fahrt fehlen. Im Kopf jeder Karte stehen die Nummer des Tages mit dem Datum darunter, dann Badges für Distanz und Dauer der Fahrt und für die Zahl der Stopps an diesem Tag.',
  'help.guide.roadtrip-mode.step.4':
    'In der Karte ist der Tag eine Kette: ein nummerierter Halt pro Ort, zwischen je zwei Halten ein Fahrtband und am rechten Rand die Ankunftszeit. Ein gebuchter Flug, Zug oder eine gebuchte Fähre steht als eigene Karte in der Kette.',
  'help.guide.roadtrip-mode.step.5':
    'Klick auf den Kopf eines Tages, um ihn einzuklappen; der Pfeil am Ende dreht sich mit. Ein eingeklappter Tag verschwindet auch von der Karte. Ein weiterer Klick auf den Kopf klappt ihn wieder auf.',
  'help.guide.roadtrip-mode.result':
    'Die linke Spalte zeigt die Fahrt und die Karte alle ihre Tage. „Tage“ bringt dich direkt zurück zum Plan, unverändert.',
  'help.guide.roadtrip-mode.tip.1':
    'Die Auswahl wird pro Reise in deinem Konto gespeichert. Nach dem Neuladen, in einem anderen Browser oder auf einem anderen Gerät öffnet sich die Reise also wieder in der Roadtrip-Ansicht.',
  'help.guide.roadtrip-mode.tip.2':
    'Der Schalter erscheint erst, wenn ein Admin in der Administration unter „Addons“ das Addon „Roadtrip“ eingeschaltet hat.',
  'help.guide.roadtrip-mode.tip.3':
    'Auf dem Smartphone gibt es keinen Schalter: Das Addon bringt einen eigenen Tab „Roadtrip“ neben „Planung“ mit.',
  // roadtrip-stops
  'help.guide.roadtrip-stops.title': 'Zwischenstopps und Aufenthaltsdauer',
  'help.guide.roadtrip-stops.goal':
    'Einen Ort auf der Strecke zum Zwischenstopp machen und festlegen, wie lange jeder Stopp dauert.',
  'help.guide.roadtrip-stops.step.1':
    'Klick in der Leiste auf die Nummer vor einem Stopp. Sie heißt „Zum Halt unterwegs machen“ und öffnet darunter die Arten von Stopps als Reihe farbiger Kreise.',
  'help.guide.roadtrip-stops.step.2':
    'Wähle eine Art. Fahr mit der Maus über einen Kreis, um seinen Namen zu sehen: „Unterkunft“, „Kraftstoff“, „Laden“, „Rastplatz“, „Campingplatz“, „Essen“ oder „Sehenswürdigkeiten“. Statt der Nummer erscheint das Symbol dieser Art, und die Stopps darunter werden neu nummeriert.',
  'help.guide.roadtrip-stops.step.3':
    'Ein Halt unterwegs ist kein Ziel, deshalb zählt die Kopfzeile des Tages einen Stopp weniger.',
  'help.guide.roadtrip-stops.step.4':
    'Klick noch einmal auf das Symbol, „Art des Halts ändern“, und wähle „Wieder zum Ziel machen“, damit der Stopp seine Nummer zurückbekommt.',
  'help.guide.roadtrip-stops.step.5':
    'Jeder Halt hat ein Badge „Aufenthalt“, das ein Plus zeigt, solange nichts geplant ist. Klick darauf, um „Aufenthalt an diesem Stopp“ zu öffnen.',
  'help.guide.roadtrip-stops.step.6':
    'Stell die Dauer mit dem Schieberegler, mit den Plus- und Minus-Buttons oder mit einer der Vorgaben ein. „Abfahrt“ ändert sich mit, „Ankunft“ bleibt bei der Ankunftszeit der Fahrt. Klick dann auf „Speichern“.',
  'help.guide.roadtrip-stops.result':
    'Das Abzeichen „Aufenthalt“ des geänderten Stopps zeigt die neue Dauer, und alle späteren Ankunftszeiten verschieben sich entsprechend. Ein Stopp, dessen Art du geändert und wieder zurückgesetzt hast, ist wieder ein nummeriertes Ziel.',
  'help.guide.roadtrip-stops.tip.1':
    'Die Aufenthaltsdauer gehört zum Ort, nicht zu einem einzelnen Besuch: Ist ein Ort an zwei Tagen geplant, gilt an beiden dieselbe Dauer.',
  'help.guide.roadtrip-stops.tip.2':
    'Halte unterwegs erscheinen auch unter „Tage“. Schaltest du in den „Fahreinstellungen“ unter „Service Stops“ die Option „Auch in Days anzeigen“ aus, erscheinen sie nur im Roadtrip.',
  'help.guide.roadtrip-stops.tip.3': '„Kein Aufenthalt“ im selben Dialog entfernt die Dauer wieder.',
  'help.guide.roadtrip-stops.tip.4':
    'Klick auf einen Halt unterwegs oder eine gebuchte Nacht, um seine Karte über der Karte zu öffnen. Ist „Roadtrip“ aktiv, öffnet „Bearbeiten“ dort statt des Ortsformulars den kompakten Dialog der Suche, und „Mehr Details“ in diesem Dialog öffnet das vollständige Formular.',
  // roadtrip-corridor
  'help.guide.roadtrip-corridor.title': 'Tankstellen, Essen und Übernachtung entlang der Route finden',
  'help.guide.roadtrip-corridor.goal':
    'Such entlang der Strecke, die du wirklich fährst, und füg Treffer der richtigen Etappe hinzu.',
  'help.guide.roadtrip-corridor.step.1':
    'Öffne unter „Gesucht wird“ die Liste und hak an, was du brauchst. „Kraftstoff“, „Laden“, „Rastplatz“, „Campingplatz“, „Unterkunft“, „Essen“ und „Sehenswürdigkeiten“ lassen sich kombinieren: Die Liste bleibt für eine weitere Auswahl offen, und das Feld zeigt danach für jede Art ein Symbol.',
  'help.guide.roadtrip-corridor.step.2':
    'Wähle den Tag im Auswahlmenü am Ende derselben Zeile. Es bietet die Tage an, für die die Leiste eine Karte hat, und „Suchen“ wartet, bis die Route für den gewählten Tag berechnet ist.',
  'help.guide.roadtrip-corridor.step.3':
    'Wähle unter „Im Umkreis“, wie weit links und rechts der Straße gesucht werden soll, 2 km, 5 km oder 10 km, und klick dann auf „Suchen“.',
  'help.guide.roadtrip-corridor.step.4':
    'Die Treffer werden nach Art gruppiert, in der Reihenfolge, in der du an ihnen vorbeikommst. Bei jedem steht, wie weit er von der Route entfernt ist und an welcher Stelle des Tages er liegt.',
  'help.guide.roadtrip-corridor.step.5':
    'Klick bei einem Treffer auf „Hinzufügen“, das Plus. „Als Stopp hinzufügen“ zeigt, an welchem Tag und an welcher Stelle er landet, und fragt nach „Art des Stopps“ und „Aufenthalt an diesem Stopp“; bei einer Ladesäule siehst du außerdem „Verfügbarkeit und Tarife“. „Hinzufügen“ nimmt ihn in die Fahrt auf, „Mehr Details“ öffnet stattdessen das vollständige Ortsformular.',
  'help.guide.roadtrip-corridor.result':
    'Der hinzugefügte Stopp erscheint mit dem Symbol seiner Art an der Stelle der Route, an der du vorbeikommst. Die Route des Tages wird über den Stopp neu berechnet, und die Liste wird geleert: Such für den nächsten Stopp erneut.',
  'help.guide.roadtrip-corridor.tip.1':
    'Gesucht wird erst, wenn du auf „Suchen“ klickst: Eine Suche schickt viele Anfragen an einen gemeinsam genutzten Dienst.',
  'help.guide.roadtrip-corridor.tip.2':
    '„Nach Name filtern“ filtert die Ergebnisse ohne neue Suche, „Ergebnisse löschen“ leert die Liste und entfernt die Stecknadeln. Klick auf einen Treffer, um ihn auf der Karte zu zeigen.',
  'help.guide.roadtrip-corridor.tip.3':
    'Du kannst einen Treffer auch von der Karte auf die Route ziehen. So wählst du die Etappe selbst, wenn du dieselbe Straße zweimal fährst. „Selbst“ neben „Suchen“ fügt einen Ort hinzu, den die Suche nicht gefunden hat, indem es ihn über den Namen nachschlägt.',
  // roadtrip-via
  'help.guide.roadtrip-via.title': 'Etappe über einen Zwischenpunkt führen',
  'help.guide.roadtrip-via.goal': 'Eine Etappe über die gewünschte Straße führen, ohne einen Stopp hinzuzufügen.',
  'help.guide.roadtrip-via.step.1':
    'Zeig die gewünschte Etappe auf der Karte an: Klick in der Leiste auf einen Stopp und schließ dann die Karte, die sich über der Karte öffnet.',
  'help.guide.roadtrip-via.step.2':
    'Klick auf die gezeichnete Route. Auf der angeklickten Etappe wird ein Wegpunkt gesetzt, und die Etappe wird über ihn neu berechnet.',
  'help.guide.roadtrip-via.step.3':
    'Die Leiste wird aktualisiert: Die Kopfzeile des Tages zeigt die neue Entfernung und Fahrzeit, und alle Ankunftszeiten nach dem Wegpunkt ändern sich mit.',
  'help.guide.roadtrip-via.step.4':
    'Fahr mit der Maus über den Ziehpunkt, um zu sehen, was er kann: Ziehen ändert den Routenverlauf, Rechtsklick entfernt ihn. Zieh ihn an eine andere Stelle, und die Etappe wird über den neuen Punkt neu berechnet.',
  'help.guide.roadtrip-via.step.5':
    'Klick mit der rechten Maustaste auf den Ziehpunkt, um ihn zu entfernen. Die Etappe nimmt dann wieder die direkte Route.',
  'help.guide.roadtrip-via.result':
    'Die Etappe folgt der gewählten Straße, und Strecke, Fahrzeit und Ankunftszeiten des Tages werden neu berechnet.',
  'help.guide.roadtrip-via.tip.1':
    'Ein Wegpunkt ist kein Stopp: Er hat keine Nummer, keine Aufenthaltsdauer und keine Ankunftszeit und zählt nicht zu den Stopps des Tages.',
  'help.guide.roadtrip-via.tip.2':
    'Die Anfasser erscheinen erst ab Zoomstufe 9. Zeigt die Karte die ganze Reise, siehst du die Linie also ohne sie.',
  'help.guide.roadtrip-via.tip.3':
    'Ein Klick, der mehr als zwei Kilometer von jeder gezeichneten Etappe entfernt ist, wird ignoriert, ebenso ein Klick auf einen Flug, einen Zug oder eine Fähre.',
  // roadtrip-alternatives
  'help.guide.roadtrip-alternatives.title': 'Andere Strecke für eine Etappe ausprobieren',
  'help.guide.roadtrip-alternatives.goal':
    'Sieh dir die Alternativrouten für einen Abschnitt der Fahrt an und wähle eine aus.',
  'help.guide.roadtrip-alternatives.step.1':
    'Klick in der Seitenleiste auf einen Fahrtbalken, die Zeile zwischen zwei Stopps mit Strecke und Dauer der Etappe. Er ist mit „Andere Wege“ beschriftet.',
  'help.guide.roadtrip-alternatives.step.2':
    '„Wege für diese Etappe“ öffnet sich über der Karte, mit einem Eintrag pro Straße samt Länge. Die Karte zeichnet jede Straße mit ihrer Fahrzeit: deine aktuelle Straße in kräftigem Blau, die anderen in hellerem Blau.',
  'help.guide.roadtrip-alternatives.step.3':
    'Fahr mit der Maus über einen Eintrag, um diese Strecke hervorzuheben. „Aktuell“ ist die Strecke, die du gerade nutzt, „Schnellste“ die schnellste. Die übrigen zeigen, wie viel länger sie dauern oder welche Straßenklasse sie meiden.',
  'help.guide.roadtrip-alternatives.step.4':
    'Klick auf einen Eintrag, um diese Strecke zu nehmen, oder auf „Schließen“, um bei der aktuellen zu bleiben.',
  'help.guide.roadtrip-alternatives.result':
    'Die Etappe nutzt jetzt die gewählte Strecke, und auch die Entfernung in der Seitenspalte und die folgenden Ankunftszeiten ändern sich.',
  'help.guide.roadtrip-alternatives.tip.1':
    'Wählst du eine andere Strecke, prüft TREK sie zuerst mit dem Router des Roadtrips. Dann hält es die Etappe mit so wenigen Wegpunkten wie nötig auf dieser Strecke und ersetzt dabei alle Wegpunkte, die die Etappe schon hatte. Eine Strecke, der der Router nicht folgen kann, wird nicht gespeichert. Wählst du die Strecke des Routers selbst, verschwinden die Wegpunkte wieder.',
  'help.guide.roadtrip-alternatives.tip.2':
    '„Ohne Autobahn“, „Ohne Maut“ und „Ohne Fähre“ stammen von einem zweiten Routing-Dienst mit eigenem Geschwindigkeitsmodell. Ihre Zeiten lassen sich daher nicht mit den anderen vergleichen.',
  // roadtrip-limits
  'help.guide.roadtrip-limits.title': 'Auto und Fahrgrenzen festlegen',
  'help.guide.roadtrip-limits.goal':
    'Sag TREK, mit welchem Fahrzeug du unterwegs bist und wie weit du ohne Pause fahren willst.',
  'help.guide.roadtrip-limits.step.1':
    'Die „Fahreinstellungen“ findest du unter der Suche in der rechten Spalte. Ihre Badges zeigen, was eingestellt ist; klick darauf, um sie zu öffnen.',
  'help.guide.roadtrip-limits.step.2':
    'Unter „Auto“ werden „Längste Fahrt am Stück“ und „Fahrzeit pro Tag“ in Minuten angegeben. Ein leeres Feld bedeutet aus, dann wird nichts markiert.',
  'help.guide.roadtrip-limits.step.3':
    'Gib unter „Fahrzeug“ an, womit du fährst. Bei „Sprit“ wird nur an Tankstopps nachgefüllt, bei „Strom“ nur an Ladestopps, bei „Beides“ an beiden.',
  'help.guide.roadtrip-limits.step.4':
    'Gib „Reichweite pro Tankfüllung“ oder „Reichweite pro Ladung“ selbst ein. Oder öffne unter „Tanken bis“ den Bereich „Aus den Fahrzeugdaten rechnen“: Er nimmt Tankinhalt und Verbrauch oder Akkukapazität, Verbrauch und Akku-Alterung und rechnet die Reichweite aus.',
  'help.guide.roadtrip-limits.step.5':
    '„Möglichst meiden“ in der linken Spalte ist eine Präferenz, kein Verbot: An einem Tag ohne Ausweichroute wird die Straße trotzdem genutzt, und der Tageskopf weist darauf hin.',
  'help.guide.roadtrip-limits.step.6':
    'Klick auf „Schließen“. Die Badges der Karte zeigen, was eingestellt ist, und die Leiste markiert jeden Abschnitt und jeden Tag, der das Limit überschreitet.',
  'help.guide.roadtrip-limits.result':
    'Die Badges der Karte zeigen, was eingestellt ist, und jede Etappe und jeder Tag über einem Limit bekommt in der Leiste ein Badge.',
  'help.guide.roadtrip-limits.tip.1':
    'Die Einstellungen gehören zur Reise. Alle Mitreisenden planen also mit demselben Auto und denselben Grenzen.',
  'help.guide.roadtrip-limits.tip.2':
    '„Tanken bis“ legt fest, wie voll an einem Stopp getankt oder geladen wird, denn unterwegs lädt niemand auf 100 %. Ein Tank- oder Ladestopp kann das über das Batterie-Badge in seiner Zeile überschreiben.',
  'help.guide.roadtrip-limits.tip.3':
    'Unter „Routenlinie“ berechnet „Tage verbinden“ auch die Fahrt vom letzten Stopp eines Tages zum ersten Stopp des nächsten. „Jeden Tag an der Unterkunft beginnen und beenden“ lässt jeden Tag an der für diese Nächte gebuchten Unterkunft beginnen und enden. „Farbe je Tag“ zeigt jeden Tag in einer eigenen Farbe.',
  // roadtrip-day-window
  'help.guide.roadtrip-day-window.title': 'Beginn und Ende des Fahrtages festlegen',
  'help.guide.roadtrip-day-window.goal':
    'Zu einer selbst gewählten Uhrzeit mit dem Fahren aufhören und festlegen, wo der Tag enden soll.',
  'help.guide.roadtrip-day-window.step.1':
    'Öffne in der rechten Spalte „Fahreinstellungen“; „Tägliche Reisezeiten“ findest du in der linken Spalte des Dialogs.',
  'help.guide.roadtrip-day-window.step.2':
    'Leg einen „Tagesbeginn“ fest. Allein bewirkt er nichts: Es braucht beide Uhrzeiten, wie der Hinweis darunter erklärt.',
  'help.guide.roadtrip-day-window.step.3':
    'Leg ein „Tagesende“ fest. Die Fahrt endet jetzt zu dieser Uhrzeit und geht am nächsten Morgen weiter, in der Seitenspalte als Zeile „Tagesende“ und Zeile „Weiterfahrt“ angezeigt.',
  'help.guide.roadtrip-day-window.step.4':
    'Wähle unter „Tagesende planen“ entweder „Auf der Strecke“, um zur Endzeit unterwegs anzuhalten, oder „Am letzten Ort“, um vor der nächsten Fahrt anzuhalten, die die Endzeit überschreiten würde.',
  'help.guide.roadtrip-day-window.step.5':
    'Klick auf „Schließen“. Die Karte „Fahreinstellungen“ zeigt die beiden Uhrzeiten jetzt als Badge.',
  'help.guide.roadtrip-day-window.result':
    'Die Fahrt wird in Reisetage der eingestellten Länge aufgeteilt. Was nicht hineinpasst, geht an berechneten Tagen nach dem letzten weiter. Deine Tage und ihre Orte bleiben unverändert.',
  'help.guide.roadtrip-day-window.tip.1':
    'Leerst du eine der beiden Zeiten, ist die Funktion wieder ausgeschaltet. Zeiten, die du selbst an einem Stopp festgelegt hast, haben immer Vorrang.',
  'help.guide.roadtrip-day-window.tip.2':
    'Sind tägliche Reisezeiten festgelegt, sind die Tage immer verbunden: Die Fahrt vom letzten Stopp eines Tages zum ersten des nächsten wird berechnet und mitgezählt.',
  'help.guide.roadtrip-day-window.tip.3':
    'Jedes Tagesende ist auch als Marker auf der Karte zu sehen: ein Mond mit der Tagesnummer. Zieh ihn entlang der Route oder auf einen Ort, um den Tag woanders enden zu lassen; ein Rechtsklick darauf stellt das automatische Tagesende wieder her, und „Automatische Tagesenden wiederherstellen“ in diesem Dialog setzt alle auf einmal zurück. Soll ein Tag an einem bestimmten Halt enden, klick auf den Halt und schalte in seiner Karte „Tag hier beenden“ ein.',
  // roadtrip-refuel
  'help.guide.roadtrip-refuel.title': 'Tanken, bevor der Tank leer ist',
  'help.guide.roadtrip-refuel.goal':
    'Auf dem Streckenabschnitt, den das Auto noch erreicht, eine Tankmöglichkeit finden und zur Fahrt hinzufügen.',
  'help.guide.roadtrip-refuel.step.1':
    'Ist eine Reichweite eingestellt, zeigt die Seitenspalte auf der Etappe, wo Kraftstoff oder Akku zur Neige gehen, ein Band: „Hier ist der Tank leer“ oder, bei einem Elektroauto, „Batterie ist hier leer“. Darunter siehst du, wie weit das in der Etappe ist.',
  'help.guide.roadtrip-refuel.step.2':
    'Das Lampensymbol auf dem Band ist der Button: „Tankstelle suchen“ oder bei einem Elektroauto „Ladesäule suchen“. Er sucht entlang der Strecke vor diesem Punkt und zeigt währenddessen „Suche entlang der Strecke…“.',
  'help.guide.roadtrip-refuel.step.3':
    'Es werden bis zu drei Tankstellen angezeigt, jeweils mit Entfernung zur Route und der Reichweite, die dir dann noch bliebe.',
  'help.guide.roadtrip-refuel.step.4':
    'Mit dem Plus an einem Angebot fügst du es als Tankstopp hinzu. „Als Stopp hinzufügen“ öffnet sich mit bereits ausgefüllter Art und Zeit, und „Hinzufügen“ setzt den Stopp an der Stelle auf die Etappe, an der die Route tatsächlich vorbeiführt.',
  'help.guide.roadtrip-refuel.result':
    'Der Stopp erscheint mit eigenem Symbol auf der richtigen Etappe, und die Reichweite wird ab diesem Stopp neu berechnet. Der Balken rückt an die Stelle, an der der Tank jetzt leer wäre, oder verschwindet, wenn du das Ende der Fahrt ohne weiteren Stopp erreichst.',
  'help.guide.roadtrip-refuel.tip.1':
    'Die Reichweite zählt ab dem letzten Tank- oder Ladestopp, auch über mehrere Tage. Dein Fahrzeugtyp entscheidet, welche Stopps zählen: bei „Sprit“ nur Tankstopps, bei „Strom“ nur Ladestopps.',
  'help.guide.roadtrip-refuel.tip.2':
    'Die Suche betrachtet die Strecke vor dem Punkt, an dem der Tank leer wäre, hält eine Reserve ein und rechnet den Umweg doppelt. So ist jeder angebotene Ort wirklich erreichbar.',
  'help.guide.roadtrip-refuel.tip.3':
    'Gibt es keine Ergebnisse, kannst du erneut suchen: Die Lampe wird zu „Erneut versuchen“, denn die Ortssuche ist ein gemeinsam genutzter Dienst, bei dem es manchmal zu Zeitüberschreitungen kommt.',
  // roadtrip-track
  'help.guide.roadtrip-track.title': 'Einen Tag einer importierten Spur folgen lassen',
  'help.guide.roadtrip-track.goal':
    'Nutze eine Panoramastrecke, die du als GPX- oder KML-Track importiert hast, für die Fahrt eines Tages.',
  'help.guide.roadtrip-track.step.1':
    'Klick in der Kopfzeile eines Tages auf das Abzeichen „Spur“. Der Dialog öffnet sich für diesen Tag.',
  'help.guide.roadtrip-track.step.2':
    'Wähle eine Spur. Jede zeigt ihre Länge und ob sie der Route dieses Tages folgt oder wie weit sie entfernt ist. Die nächstgelegene Spur steht oben.',
  'help.guide.roadtrip-track.step.3':
    'Klick auf „Dieser Spur folgen“. TREK setzt Wegpunkte dort, wo die Route am weitesten von der Spur abweicht, berechnet sie neu und wiederholt das mehrmals.',
  'help.guide.roadtrip-track.step.4':
    'Der Dialog zeigt, wie viele Via-Punkte gesetzt wurden und wie nah die Fahrt jetzt am Track bleibt, oder dass sie dem Track schon folgte. „Via-Punkte verwerfen“ unten links entfernt sie wieder und überlässt den Tag erneut dem Router. Wenn du den Dialog schließt, bleibt der Track erhalten.',
  'help.guide.roadtrip-track.result':
    'Die Fahrt des Tages folgt der Spur statt der Straße, die der Router gewählt hätte. Fahr mit der Maus über das Badge „Spur“, um den Namen der Spur zu sehen. Halten Wegpunkte die Fahrt auf der Spur, wird das Badge zusätzlich hervorgehoben.',
  'help.guide.roadtrip-track.tip.1':
    'Der Dialog listet die Orte der Reise, die einen Streckenverlauf haben: eine GPX- oder KML-Datei, importiert über „Dateimport“ in der Ortsspalte unter „Tage“, bei GPX mit „Strecken“ oder „Tracks (mit Streckenverlauf)“ angehakt, bei KML mit „Pfade (LineStrings)“. „Dateimport“ gibt es nur, solange das Add-on Touren ausgeschaltet ist; ist Touren an, wird eine GPX-Datei zur Tour, und die listet dieser Dialog nicht. Solange die Reise keinen Track enthält, trägt kein Tag das Badge.',
  'help.guide.roadtrip-track.tip.2':
    'Folgst du einer Spur, werden die bisherigen Wegpunkte der Etappen des Tages ersetzt. Passe eine Etappe also erst nach der Spur von Hand an, nicht vorher.',
  'help.guide.dateless-trip.step.1': 'Klick auf „Neue Reise“ und gib der Reise einen Namen.',
  'help.guide.edit-trip.tip.2':
    'Reisebegleiter, die du hier hinzufügst oder entfernst, werden sofort übernommen, auch ohne „Aktualisieren“.',
  'help.guide.trip-reminder.result':
    'Du bekommst die Erinnerung die gewählte Anzahl Tage vor Reisebeginn, über die Kanäle, auf denen du Benachrichtigungen erhältst.',
  'help.guide.upcoming-reservations.step.1':
    'In der rechten Spalte findest du „Anstehende Reservierungen“. Dort stehen die nächsten sechs Buchungen aus all deinen Reisen, die früheste zuerst, jeweils mit Datum, Uhrzeit und Typ.',
  'help.guide.half-company-holiday.step.1': 'Stell die Werkzeugleiste auf „Betriebsferien“ um.',
  'help.guide.edit-holiday-calendar.result': 'Raster und Legende übernehmen jede Änderung sofort.',
  'help.guide.person-color.result': 'Alle Tage, die die Person eingetragen hat, erscheinen in der neuen Farbe.',
  'help.guide.answer-fusion-request.step.1':
    'Öffne Vacay, nachdem dich jemand eingeladen hat. Der Dialog „Fusionsanfrage“ öffnet sich automatisch.',
  'help.guide.log-for-partner.step.1':
    'Klick in der Karte „Personen“ auf den Namen der Person. Ein Häkchen zeigt, dass sie ausgewählt ist.',
  'help.guide.dissolve-fusion.step.1': 'Öffne die Einstellungen.',
  'help.guide.country-places.step.2': 'Klick in der Karte auf das Badge „Orte“, das mit der Stecknadel.',
  'help.guide.search-place.tip.2':
    'Ist die Region schon markiert, fragt das Popup stattdessen, ob du sie entfernen willst.',
  'help.guide.tour-activity-stats.step.4':
    'Die Badges rechts zeigen, worauf die Summen beruhen: „Geplant“ für Touren, die über deine Reiseplanung zählen, „Aufgezeichnet“ für Touren mit verknüpfter tatsächlicher Strecke. „Noch offen“, „Ohne Tag“ und „Kein Datum“ zählen die Touren, die noch nicht mitzählen. Das i erklärt die Regel.',
  'help.guide.move-to-list.step.2':
    'Klick auf „In Liste duplizieren“, wenn sie auch hier bleiben sollen, oder auf „In Liste verschieben“, um sie aus dieser Liste zu entfernen.',
  'help.guide.accept-list-invite.title': 'Einladung zu einer Liste annehmen',
  'help.guide.tour-collection-add-to-trip.step.3':
    'Wähl unter „Wegpunkte“ die Kachel mit den Wegpunkten, um Start, Stopps und Ende in ihrer Reihenfolge zu übernehmen, oder „Nur die Linie“, wenn nur die gespeicherte Linie übernommen werden soll.',
  'help.guide.tour-collection-manage.step.1':
    'Öffne eine Liste. Bei jeder gespeicherten Tour siehst du Schwierigkeitsgrad, Typ, die Reise, aus der sie stammt, Distanz und Anstieg sowie die Zahl ihrer Wegpunkte. Fahr mit der Maus über den Reisenamen, um zu sehen, wer sie gespeichert hat.',
  'help.guide.entry-draft.step.1': 'Schalt im Editor in der rechten Spalte „Entwurf“ ein.',
  'help.guide.journey-map-layers.step.3':
    'Klick auf der Karte auf einen hohlen Pin oder einen kleinen Punkt. Ein Infofenster zeigt, was es ist: ein geplanter Ort mit seinem Tag oder ein Aufenthalt mit „Eintrag öffnen“, das dich zum zugehörigen Tagesbericht bringt.',
  'help.guide.journey-keep-route.step.3': 'Klick auf „Strecke speichern“.',
  'help.guide.journey-day-stays.step.3':
    'Klick bei einem Aufenthalt, den du nicht willst, auf „Da war ich nicht“. Er verschwindet aus der Zeile.',
  'help.guide.journey-take-over-day.step.3':
    'Lieber ein Eintrag für den ganzen Tag? Stell „Einträge“ auf „Tagesbericht“: Dann listet ein einziger Eintrag alle gewählten Aufenthalte mit ihren Zeiten auf.',
  'help.guide.journey-auto-prepare.step.2':
    'Schalt unter „Aufgezeichnete Tage“ die Option „Aufgezeichnete Tage automatisch vorbereiten“ ein.',
  'help.guide.photo-location.step.2': 'Schalt unter „Fotos“ die Option „Einträge über ihre Fotos verorten“ ein.',
  'help.guide.link-trip.tip.3':
    'Du schreibst einen Eintrag zu einem Tag einer Reise, die noch nicht verknüpft ist? Dann bietet dir der Editor direkt dort „Trip verknüpfen“ an.',
  'help.ctx.settings-plugins.summary':
    'Deine persönlichen Einstellungen für die Plugins, die der Admin installiert hat: die Schlüssel und Präferenzen, die jedes Plugin von dir braucht, und ein Protokoll dessen, was Plugins in deinem Namen getan haben. Der Tab erscheint nur, solange ein Plugin aktiv ist.',
  'help.ctx.settings-about.bullet.3':
    'Über Ko-fi, Buy Me a Coffee und Discord kannst du TREK unterstützen oder die Leute dahinter kennenlernen.',
  'help.guide.language-region.step.3':
    'Leg die „Anzeigewährung“ fest oder behalte „Reisewährung“, damit jede Reise in ihrer eigenen Währung angezeigt wird. Wähl dann „Temperatureinheit“, „Entfernungseinheit“, „Zeitformat“ und unter „Woche beginnt am“ den ersten Wochentag.',
  'help.guide.travel-map-prefs.step.3':
    '„Orte auf der Karte entdecken“ blendet die Kategorie-Pille ein, mit der du Orte in der Nähe findest. „Buchungscodes verbergen“ macht Bestätigungsnummern unkenntlich, bis du mit der Maus darüberfährst oder sie antippst. „Route ab der Unterkunft optimieren“ lässt jeden Tag an deinem Hotel beginnen und enden.',
  'help.guide.web-push-device.step.2':
    'In der Karte „Benachrichtigungen“ oben legst du in der Spalte „Push“ fest, welche Ereignisse auf deinen Geräten ankommen.',
  'help.guide.connect-airtrail.goal':
    'TREK die Flüge aus deinem eigenen AirTrail importieren und synchronisieren lassen.',
  'help.guide.connect-dawarich.goal': 'TREK aus deinem eigenen Dawarich lesen lassen, wo du tatsächlich warst.',
  'help.guide.tour-connect-wanderer.goal':
    'TREK die Trails aus deinem eigenen wanderer lesen lassen, damit du sie als Touren importieren kannst.',
  'help.guide.tour-wanderer-watch.title': 'Benachrichtigung bei Änderungen an deinen wanderer-Trails',
  'help.guide.plugin-settings.tip.2':
    'Ein Plugin-Kanal unter „Benachrichtigungen“ bringt dich über „Einrichten“ hierher.',
  'help.guide.default-user-settings.result':
    'Neue Konten und alle, die diese Einstellungen nie geändert haben, bekommen deine Auswahl.',
  'help.guide.own-routing-engine.goal':
    'Tage und Roadtrips über einen eigenen OSRM- oder Valhalla-Server routen statt über die öffentlichen.',
  'help.guide.admin-passkeys.tip.1':
    'Lässt sich noch keine Domain ermitteln, weist eine Warnung darauf hin. Passkeys bleiben dann ausgeblendet, bis du APP_URL oder die Relying-Party-ID festlegst.',
  'help.guide.rotate-jwt-secret.step.1':
    'Klick unten im Tab „Einstellungen“ unter „Gefahrenzone“ neben „JWT-Secret erneuern“ auf „Erneuern“.',
  'help.guide.storage-backends.tip.3':
    'Die Foto-Caches lassen sich jederzeit neu abrufen. Sie zu spiegeln, kostet daher meist nur unnötig Platz.',
  'help.guide.admin-channels.step.3':
    'Wähl in der Karte „Benachrichtigungen“ darunter für jedes Ereignis, über welche Kanäle es verschickt wird: „Neue Version verfügbar“, „Speicher-Replik-Fehler“ und „Paddel-Region angefragt“. Jeder Schalter wird sofort gespeichert.',
  'help.guide.notification-defaults.tip.1':
    '„Aus“ ist eine Voreinstellung, die jeder Benutzer selbst wieder einschalten kann. „Gesperrt“ schaltet das Ereignis für alle ab.',
  'help.ctx.notifications.bullet.4':
    'Neben der Uhrzeit jeder Benachrichtigung findest du „Als gelesen markieren“ (der doppelte Haken) und „Löschen“ (der Papierkorb); beides gilt nur für diese eine. „Alle als gelesen markieren“ und „Alle löschen“ oben gelten für die ganze Liste.',
  'help.guide.read-notifications.tip.2':
    'Eine Benachrichtigung ohne Button ist nur eine Info. Lies sie im Panel und markiere sie dort als gelesen.',
  'help.guide.filter-notifications.result': 'Die Liste zeigt nur noch Ungelesenes, das Neueste zuerst.',
  'help.guide.delete-notifications.title': 'Benachrichtigungen löschen',
  'help.guide.notification-settings.goal':
    'Festlegen, welche Ereignisse unter der Glocke erscheinen und welche dich zusätzlich per E-Mail, Webhook, ntfy oder Push erreichen.',
  'help.guide.public-link.step.4': 'Klick auf „Link erstellen“, dann auf „Kopieren“, und verschick den Link.',
  'help.guide.link-journal.step.2':
    'Klick auf „Journal verknüpfen“ und wähl unter „Tagebuch auswählen“ eins deiner Tagebücher.',
  'help.guide.dawarich-stays.title': 'Aus einem aufgezeichneten Aufenthalt einen Ort machen',
  'help.guide.dawarich-stays.tip.2':
    'Löschst du einen Ort, der aus einem Aufenthalt entstanden ist, taucht der Aufenthalt wieder als wartend in der Liste auf.',
  'help.guide.leave-stop-off-route.goal':
    'Einen Halt im Tag behalten, ohne dass die Route dorthin führt, für einen Ort, an dem du zu Fuß vorbeikommst oder den du nur auf der Karte sehen willst.',
  'help.guide.day-route.tip.4':
    'Ein Halt, der zum Tag gehören soll, aber nicht auf dem Weg liegt: Wähl in seinem Menü „Aus der Route nehmen“.',
  'help.guide.move-booking-day.step.2':
    'Zieh die Zeile auf den Kopf einer anderen Tageskarte. Eine eintägige Buchung wandert komplett dorthin. Bei einer Buchung über mehrere Tage verschiebt die Zeile „Abreise“ den Starttag und die Zeile „Ankunft“ den Endtag.',
  'help.guide.place-image-from-file.title': 'Ein angehängtes Foto als Bild des Ortes verwenden',
  'help.guide.place-image-from-file.tip.2':
    'Auch ein Foto, das am Halt angeheftet oder an seine Buchung angehängt ist, wird angeboten.',
  'help.guide.place-own-hours.step.5':
    'Klick auf „Aktualisieren“. Die Karte zeigt jetzt unter „Öffnungszeiten“ deine Zeiten, und „Offen“ oder „Geschlossen“ oben richtet sich danach.',
  'help.guide.confirm-stay-booking.step.3':
    'Klick oben auf „Ausstehend“. Der Tooltip lautet „Auf Bestätigt setzen“, und der Punkt wird grün.',
  'help.guide.map-nearby-places.tip.4':
    'Ist die Suche in einer Kategorie fehlgeschlagen, bekommt sie einen roten Punkt, und „Diesen Bereich durchsuchen“ wird rot mit einem Warnzeichen: Klick darauf, um es noch einmal zu versuchen.',
  'help.guide.tour-map-lines.tip.1':
    'Klappst du einen Tag in der Tagesspalte zu, verschwinden seine Touren zusammen mit seinen Halten von der Karte.',
  'help.guide.car-stops.step.3':
    'Tipp oben in der Kopfleiste einen Titel ein. Wähl unter „Route“ bei „Von“, wo du das Auto abholst, und bei „Bis“, wo du es zurückgibst; die Orte der Reise werden dir schon vor dem Tippen vorgeschlagen. „Abholung“ und „Abholzeit“ geben an, wann du es abholst, „Rückgabe“ und „Rückgabezeit“, wann du es zurückgibst.',
  'help.guide.transport-details.step.1':
    'Klick im Tab „Transporte“ auf eine Karte. Die Details öffnen sich über dem Tab, mit einer Kopfleiste in der Farbe der Karte. Über die Zeile eines Transports im Tagesplan öffnest du dieselben Details.',
  'help.guide.export-transports-csv.tip.2':
    'Der Tab „Buchungen“ hat dasselbe Icon und erzeugt eine eigene Datei, deren Name auf bookings.csv endet.',
  'help.guide.group-sort-bookings.step.2':
    'Wähl unter „Gruppieren nach“ „Status“, „Tag“, „Typ“ oder „Nicht gruppieren“. Der Tab ordnet sich sofort in diese Abschnitte.',
  'help.guide.export-bookings-csv.result':
    'Dein Browser lädt eine Datei herunter, die nach Reise und Tab benannt ist, zum Beispiel herbst-in-japan-bookings.csv, mit einer Zeile für jede Buchung, die im Tab angezeigt wurde.',
  'help.guide.arrange-packing-list.result':
    'Die Listen stehen in der Reihenfolge, in die du sie gezogen hast, und die Einträge sind von A bis Z sortiert, bis du das ausschaltest. Deine eigene Reihenfolge bleibt im Hintergrund erhalten.',
  'help.guide.count-packed-pieces.step.2':
    'Vor der Menge erscheint ein Zähler: 0/5, mit Minus und Plus. Klick für jedes Stück, das in die Tasche kommt, auf das Plus.',
  'help.guide.expense-receipts.step.4':
    'Zurück im Verlauf steht neben dem Namen der Zeile ein Chip „Beleg“, bei mehreren Belegen mit der Anzahl in Klammern. Klick darauf, um den Beleg zu öffnen.',
  'help.guide.final-budget.tip.3':
    'Wer die Reise verlassen hat, behält eine Zeile in „Salden“ und „Endbudget“, solange mit ihm noch Geld abzurechnen ist.',
  'help.guide.files-sync-settings.step.2':
    'Die Flussleiste zeigt TREK und deinen Speicher mit den Dokumenten auf beiden Seiten, dazwischen zwei Bahnen: „Raus zum Speicher“ und „Rein vom Speicher“. Klick auf „Raus zum Speicher“, um diese Richtung abzuschalten. Die Bahn wird ausgegraut, und unter den Bahnen steht „Nur eingehend“. Klick noch einmal darauf, um sie wieder einzuschalten.',
  'help.guide.files-sync-settings.tip.4':
    'Ändern kann das nur der Besitzer der Reise oder ein Administrator. Andere Mitglieder sehen die Flussleiste mit einem Hinweis wie „Dokumente wandern in beide Richtungen“, aber keine Einstellungen.',
  'help.guide.manage-notes.step.2':
    '„Erweitern“ öffnet die ganze Notiz: den vollständigen Text, ihre Webseite und ihre Dateien; ein Klick auf eine Datei zeigt eine Vorschau. „Bearbeiten“ unten wechselt direkt in den Editor, das Kreuz oben rechts schließt die Notiz wieder.',
  'help.guide.note-categories.goal':
    'Die Notizen der Gruppe in benannte, farbige Kategorien einteilen und jeweils nur eine Kategorie anzeigen.',
  'help.guide.note-categories.tip.1':
    'Mit dem Papierkorb entfernst du nur Kategorien, die keine Notiz verwendet. Eine Kategorie, der noch Notizen zugeordnet sind, bleibt in der Liste, bis diese Notizen in eine andere verschoben sind.',
  'help.guide.roadtrip-reorder.title': 'Einen Halt verschieben oder auf einen anderen Tag legen',
  'help.guide.roadtrip-reorder.tip.3':
    'Eine Zeit, die du festgelegt hast, löst keine Rückfrage aus: Die Leiste berechnet den Tag sofort neu und markiert einen Halt, den sie nicht mehr rechtzeitig erreicht.',
  'help.guide.roadtrip-overnight.step.3':
    'Oben im Dialog bucht „Übernachten“ eine Nacht, und „Pause“ macht daraus einen Halt für eine gewisse Zeit. Ein Hotel öffnet sich mit „Übernachten“, ein Campingplatz mit „Pause“. Für eine Nacht brauchst du nur den Check-in, und den darfst du auch leer lassen.',
  'help.guide.roadtrip-stop-fill.step.1':
    'Klick bei einem Tank- oder Ladehalt in der Leiste auf das Batterie-Badge. Es zeigt, bis wohin an diesem Halt getankt oder geladen wird: blass, solange es deinem Wert bei „Tanken bis“ folgt, kräftig, sobald der Halt einen eigenen Wert hat.',
  'help.guide.roadtrip-bookings.step.1':
    'Buch die Fahrt als Flug-, Zug-, Fähren-, Kreuzfahrt- oder Busbuchung an ihrem Tag, mit verorteten Start- und Zielpunkten. Die Autofahrt berücksichtigt sie automatisch: Die Straße endet am Terminal, von dem es losgeht, und beginnt dort wieder, wo du ankommst.',
  'help.guide.roadtrip-google-import.result':
    'Die Halte der Route werden hinter dem letzten Halt dieses Tages eingefügt, und Leiste und Karte führen die Fahrt durch sie hindurch.',
  'help.guide.roadtrip-hazards.step.3':
    'Die Warnungen erscheinen als Flächen auf der Karte. Klick auf eine, um zu sehen, worum es geht, welcher Dienst sie gemeldet hat und wann sie zuletzt aktualisiert wurde.',
  'help.ctx.trip-tours.bullet.2':
    'Oben holst du mit „GPX oder KML importieren“ Dateien als Touren herein. Der Filter-Button darunter (anfangs „Alle“, mit der Anzahl der Touren) grenzt die Liste nach Status, Quelle, Routenlimit und Typ ein.',
  'help.guide.tour-show-list.step.2':
    'Jede Zeile ist eine Tour. Der farbige Balken entspricht ihrer Linie auf der Karte, und die runde Kachel zeigt das Routenlimit (T1 bis T6) einer in TREK geplanten Wanderung oder das Icon ihres Typs. Die Badges unter dem Namen nennen die Tage, an denen sie eingeplant ist, ihre Dauer, Distanz und ihren Anstieg; der Mond mit einer Zahl neben einer Mehrtagestour zeigt die Anzahl ihrer Etappen.',
  'help.guide.tour-add-to-day.title': 'Eine Tour einem Tag zuordnen',
  'help.guide.tour-add-to-day.tip.2':
    'Endet die Reise vor der letzten Etappe, zeigt die Auswahl, bis zu welcher Etappe es passt; die Etappen danach bleiben ohne Tag.',
  'help.guide.tour-day-times.step.3':
    'Klick auf „Aktualisieren“. In der Zeile steht jetzt Start → Ende. Ein berechnetes Ende ist heller dargestellt: mit ≈ bei einer Schätzung, mit ≥, solange ein Aufenthalt noch keine Zeit hat, und mit +1 nach Mitternacht. Zeig darauf, um zu sehen, wie es berechnet wurde.',
  'help.guide.tour-remove-from-day.goal': 'Eine Tour aus der Planung nehmen, ohne sie zu löschen.',
  'help.guide.tour-filter-list.goal':
    'Eine lange Liste auf die Touren eingrenzen, die du suchst: noch nicht geplant, aus einer Datei oder von einem bestimmten Typ.',
  'help.guide.tour-filter-list.result':
    'In der Liste stehen nur die Touren, nach denen du gefiltert hast; die anderen gehören weiterhin zur Reise.',
  'help.guide.tour-hide-on-map.result':
    'Auf deiner Karte sind nur die Touren zu sehen, die du willst. Die ausgeblendeten bleiben gedimmt in der Liste.',
  'help.guide.tour-import-plan-tab.result':
    'Der Track ist jetzt eine Tour der Reise: eine Zeile mit GPX-Badge in der Liste und eine Linie auf der Karte.',
  'help.guide.tour-detail-read.title': 'Eine Tour öffnen und ihre Karte lesen',
  'help.guide.tour-detail-read.step.7': 'Schließ die Karte mit dem X oben oder drück Escape.',
  'help.guide.tour-rename-colour.goal':
    'Einer Tour einen Namen geben, den du wiedererkennst, und eine Linienfarbe, die auf der Karte auffällt.',
  'help.guide.tour-take-along.title': 'Eine Tour aufs Handy oder GPS-Gerät übertragen',
  'help.guide.tour-take-along.tip.4':
    'Im Tab „Touren“ findest du denselben Download oben in der linken Spalte. Hat die Tour ungespeicherte Änderungen, wartet er und bittet dich, zuerst zu speichern.',
  'help.guide.tour-copy-keep.tip.1':
    'Beides sind Kopien: Spätere Änderungen an der Tour wirken sich weder auf die Kopie noch auf die in der Sammlung gespeicherte Version aus.',
  'help.guide.tour-packing-link.step.2':
    'Wähl unter „Verknüpfen mit“ entweder „Ganze Packliste“ oder eine ihrer Listen. Jede Zeile zeigt, wie viele Einträge sie enthält.',
  'help.guide.tour-files.title': 'Dateien zu einer Tour ablegen',
  'help.guide.tour-activity-link.title': 'Den tatsächlich zurückgelegten Track verknüpfen',
  'help.guide.tour-activity-link.tip.2':
    'Verknüpfen lässt sich nur ein Import, auf dessen Grundlage nicht geplant wurde, und jeder Track nur mit einer Tour.',
  'help.guide.tour-activity-compare.step.4':
    'Mit „Ändern“ unten am Track wählst du eine andere Aufzeichnung. „Trennen“ löst sie von der Tour, und der Track bleibt als Import in der Reise.',
  'help.guide.tour-origin-check.step.3':
    'Bei einer Tour, die du im Tab „Touren“ gezeichnet hast, steht „in TREK geplant“, dazu unter „Erstellt“ der Tag, an dem sie angelegt wurde.',
  'help.ctx.trip-tour-planner.bullet.2':
    'Die linke Leiste ist der Editor. Ist nichts geöffnet, bietet sie „Neue Tour planen“ an. Eine geöffnete Tour zeigt dort Namen, Typ, Wegpunkte, die Karten ihres Typs und ihre Details, unten „Verwerfen“ und „Speichern“.',
  'help.guide.tour-open-workspace.step.2':
    'Die linke Leiste ist der Editor. Ist keine Tour geöffnet, bietet sie „Neue Tour planen“ an; damit beginnst du eine Tour auf der Karte.',
  'help.guide.tour-open-workspace.tip.3':
    'Öffnest du eine andere Tour, während im Editor ungespeicherte Änderungen sind, fragt TREK zuerst nach: „Änderungen verwerfen“ oder weiter bearbeiten.',
  'help.guide.tour-draw-route.step.5':
    'Klick die nächsten Stellen in der Reihenfolge an, in der du sie gehst. Jeder Klick fügt den Punkt als neues Ende hinzu, und ab zwei Punkten plant TREK die Route entlang der Wege.',
  'help.guide.tour-type-profile.goal':
    'Den Tourtyp wählen, bei einer Radtour auch das Profil, damit die Route den passenden Wegen folgt.',
  'help.guide.tour-edit-points.title': 'Punkte verschieben, umordnen und entfernen',
  'help.guide.tour-edit-points.tip.1':
    'Der erste Punkt hat das Badge „Start“, der letzte „Ende“. Verschiebst du einen Punkt ganz nach oben oder unten, wird er zum Start oder Ende.',
  'help.guide.tour-shaping-points.step.4':
    'Um einen Halt in einen Formpunkt umzuwandeln oder umgekehrt, öffne in seiner Zeile „Weitere Aktionen“ und wähl „Zum Formpunkt machen“ oder „Zum Halt machen“.',
  'help.guide.tour-loop-reverse.step.2':
    'In der letzten Zeile steht jetzt „Zurück zum Start“, und die Route auf der Karte endet dort, wo sie begonnen hat.',
  'help.guide.tour-leg-by-hand.step.1':
    'Öffne „Weitere Aktionen“ an dem Punkt, an dem der Abschnitt beginnt, und wähl „Nächsten Abschnitt von Hand zeichnen“.',
  'help.guide.tour-trip-places.goal':
    'Einen Ort, den du schon in der Reise geplant hast, als Halt zur Tour hinzufügen.',
  'help.guide.tour-trip-places.result': 'Ein Halt, der für den Ort aus der Reise steht und dessen Namen trägt.',
  'help.guide.tour-details-times.tip.2':
    'Bei einer Wanderung findest du unter „Details“ außerdem „Maximale Wegschwierigkeit“ und „Routenwahl“; beides erklären die Anleitungen zum Wandern. Ein Stadtspaziergang hat keine „Pausen“: Dort übernehmen die Aufenthalte an den Halten diese Rolle.',
  'help.guide.tour-save.step.4': 'Die Tour steht jetzt unter „Touren dieser Reise“, noch ohne Tag.',
  'help.guide.tour-edit-saved.step.2':
    'Ändere, was nötig ist, wie bei einer neuen Tour: Punkte verschieben oder hinzufügen, den Typ wechseln oder die Details bearbeiten, hier die Beschreibung.',
  'help.guide.tour-summary-profile.goal':
    'Sehen, wie lang und wie steil die Tour ist und wo auf der Route welche Höhe erreicht wird.',
  'help.guide.tour-summary-profile.result':
    'Du weißt, wie lang die Tour ist, wie viele Höhenmeter sie hat, wie lange sie dauert und wo sie steil wird.',
  'help.guide.tour-list-manage.tip.1':
    'Jede Tour zählt in den Summen nur einmal, auch wenn sie an mehreren Tagen eingeplant ist. Steht ≥ vor einer Summe, fehlen darin einige Touren; zeig darauf, um zu sehen, wie viele.',
  'help.guide.tour-delete.tip.1':
    'Das lässt sich nicht rückgängig machen, auch „Rückgängig“ holt eine gelöschte Tour nicht zurück.',
  'help.guide.tour-saved-elsewhere.step.3':
    'Klickst du trotzdem auf „Speichern“, öffnet sich stattdessen „Inzwischen geändert“, und nichts wird überschrieben.',
  'help.ctx.trip-tour-import.bullet.2':
    'Die „Import-Vorschau“ zeigt jeden Track der Dateien auf einer Karte, mit Distanz, Aufstieg, Abstieg und Punkten, bevor etwas gespeichert wird. Unter „Importieren als“ legst du fest, was die Tracks sind.',
  'help.guide.tour-import-gpx.step.3':
    'Die „Import-Vorschau“ öffnet sich, gespeichert ist noch nichts. Die Karte zeigt den gesamten Verlauf, und jeder Track der Dateien steht als nummerierte Zeile mit Distanz, Aufstieg, Abstieg und Punkten da. Bei einem aufgezeichneten Track siehst du außerdem, wann er entstanden ist und wie lange er gedauert hat.',
  'help.guide.tour-import-gpx.result':
    'Die Tour steht unter „Touren dieser Reise“, noch ohne Tag. Eine einzelne Tour öffnet sich direkt auf der Karte als GPX-Tour.',
  'help.guide.tour-view-import.tip.3': 'Ein Trail aus wanderer öffnet sich genauso, als wanderer-Tour.',
  'help.guide.tour-plan-from-import.tip.1':
    'Mit „Verwerfen“ verwirfst du den Vorschlag. Gespeichert wird erst, wenn du speicherst.',
  'help.guide.tour-restore-recorded.step.2': 'Klick auf „Aufgezeichnete Strecke wiederherstellen“.',
  'help.guide.tour-take-over.step.2': 'Wähl „Tour aus anderer Reise übernehmen“.',
  'help.guide.tour-take-over.result':
    'Eine Meldung bestätigt die Übernahme, und die Tour öffnet sich im Editor. Du kannst sie jetzt einem Tag zuordnen.',
  'help.guide.tour-import-wanderer.tip.2':
    'Der Import ist eine Kopie: Spätere Änderungen in wanderer wirken sich nicht auf die Tour aus. Mit „Quelle prüfen“ unter „Herkunft“ der Tour erfährst du, wann sich der Trail geändert hat.',
  'help.ctx.trip-tour-map.bullet.3':
    'Mit „Ort oder Adresse suchen“ oben auf der Karte springst du zu einer Stadt, einer Hütte oder einem Gipfel, ohne der Tour etwas hinzuzufügen.',
  'help.guide.tour-map-layers.result':
    'Die Tour wird auf der passenden Karte angezeigt, und die Pille zeigt, welche gerade eingeschaltet ist.',
  'help.guide.tour-along-search.step.3':
    'Wähl unter „In diesem Abstand zur Route“, wie weit von der Linie entfernt gesucht wird: 250 m, 500 m, 1 km oder 2 km.',
  'help.guide.tour-along-add-stop.goal':
    'Die Tour an einem Aussichtspunkt, einer Hütte oder einer Quelle vorbeiführen, die du entlang der Route gefunden hast.',
  'help.guide.tour-along-add-stop.tip.3':
    'Ein Abschnitt, in den sich kein Halt einfügen lässt (ein Klettersteig oder eine Portage, die als feste Linie angelegt ist, oder ein von Hand gezeichneter Abschnitt), bleibt gedimmt in der Liste, mit dem Grund daneben.',
  'help.guide.tour-3d-terrain.result':
    'Du hast die Tour in der Landschaft gesehen, die steilen Abschnitte farbig markiert, und für die Planung ist wieder die flache Karte da.',
  'help.guide.tour-3d-flyover.step.3':
    '„Pause“ hält den Flug an, wo er gerade ist, und „Flug abspielen“ setzt ihn dort fort. „Von vorn“ springt an den Anfang zurück und startet den Flug erneut.',
  'help.guide.tour-map-overlays.step.1':
    'Öffne eine Skitour im Tab „Touren“. Die Pisten sind von Anfang an eingeblendet: Ihr Schalter ist der verschneite Berg in der Pille unten links, „Pisten, Loipen und Lifte“. Klick darauf, um sie auszublenden, und noch einmal, um sie wieder einzublenden.',
  'help.ctx.trip-tour-stages.title': 'Mehrtagestouren',
  'help.guide.tour-multi-day.goal': 'Eine Route in Etappen aufteilen, eine für jeden Tag, an dem du unterwegs bist.',
  'help.guide.tour-multi-day.tip.2':
    'Um zwei Etappen wieder zusammenzufügen, wähl im Menü des Halts mit dem Mond „Etappenende entfernen“. Auch wenn du diesen Halt entfernst, werden sie zusammengefügt; ein Hinweis bietet dann „Rückgängig“ an.',
  'help.guide.tour-stages-on-days.step.3':
    'Wähl „Etappen ab diesem Tag“: Etappe 1 kommt auf diesen Tag, jede weitere Etappe auf den jeweils folgenden Tag. „Ganze Tour an diesem Tag“ legt stattdessen die ganze Route auf diesen einen Tag.',
  'help.guide.tour-stages-on-days.result':
    'Jede Etappe ist ihrem Reisetag zugeordnet, und die Etappe, die du geöffnet hast, ist im Editor offen.',
  'help.ctx.trip-tour-hike.bullet.6':
    'Die „Tourenübersicht“ rechts zeigt Distanz, Anstieg, die geschätzte Geh- oder Laufzeit, Pausen und die geplante Gesamtzeit, darunter das Höhenprofil. Mit „Speichern“ unten im Editor sicherst du die Tour.',
  'help.guide.tour-hike-plan.step.6': 'Klick unten in der linken Spalte auf „Speichern“.',
  'help.guide.tour-hike-trail-details.step.1':
    'Öffne die Wanderung aus „Touren dieser Reise“ und such unter der Karte „Wegpunkte“ den Bereich „Wegdetails“. Schalt „Entlang der Route zeigen“ ein.',
  'help.guide.tour-hike-trail-details.tip.3':
    'Die Karte ändert nichts an der Tour und braucht eine Internetverbindung. Eine importierte Wanderung zeigt dieselbe Karte in ihrer Ansicht, nur ohne Routenlimit.',
  'help.guide.tour-hike-round.result':
    'Die Wanderung folgt der gewählten Runde zurück zum Start. Unten auf der Karte bietet „Runde übernommen“ ein „Rückgängig“, und mit „Speichern“ sicherst du sie.',
  'help.guide.tour-hike-compare-ways.step.3':
    'Die Badges einer Zeile zeigen, wie viel länger, höher oder langsamer dieser Weg als der aktuelle ist. Klick auf den, den du willst.',
  'help.guide.tour-ferrata-add.step.1':
    'Klick bei geöffneter Wanderung in der Reihe der Kartenbuttons unten links auf „Klettersteige“. Das Badge zeigt die Anzahl der Klettersteige im Ausschnitt; zoom hinein, wenn es dich dazu auffordert.',
  'help.guide.tour-ferrata-add.tip.3':
    'Der Abschnitt auf dem Klettersteig ist im Höhenprofil farbig hinterlegt, damit du siehst, an welcher Stelle des Tages er kommt.',
  'help.guide.tour-run-plan.step.5': 'Gib dem Lauf unter „Name der Tour“ einen Namen und klick auf „Speichern“.',
  'help.guide.tour-run-ways.step.1':
    'Öffne den Lauf aus „Touren dieser Reise“ und schalt unter „Wegdetails“, unterhalb der Karte „Wegpunkte“, die Option „Entlang der Route zeigen“ ein.',
  'help.ctx.trip-tour-walk.bullet.1':
    'Mit dem Tourtyp „Stadt- und Spaziergang“ wird aus einer Tour ein Spaziergang. Seine Punkte sind Halte mit „Bezeichnung“, Aufenthaltsdauer und Wichtigkeit. Ein Spaziergang hat kein Wanderlimit und kein Feld „Pausen“: Die Aufenthalte übernehmen diese Rolle.',
  'help.guide.tour-walk-plan.step.2':
    'Füge die Halte hinzu: Prüf, ob „Punkt hinzufügen“ eingeschaltet ist, und klick für jeden Halt auf die Karte, oder klick auf „Reise-Orte“, um einen Ort zu übernehmen, den die Reise schon hat.',
  'help.guide.tour-walk-plan.result':
    'Der Spaziergang listet seine Halte mit ihren Aufenthalten auf, und die „Tourenübersicht“ rechnet sie zusammen. Ordne ihn einem Tag zu, um zu sehen, wann du welchen Halt erreichst.',
  'help.guide.tour-walk-sights.tip.1': 'Er wird zu einem Halt des Spaziergangs, nicht zu einem Ort der Reise.',
  'help.guide.tour-walk-day-times.step.3':
    'Öffne den Spaziergang erneut im Tab „Touren“. Oben unter „Wegpunkte“ nennt „Zeiten für“ den Tag und seine Startzeit. Ist der Spaziergang an mehreren Tagen eingeplant, klick darauf, um einen anderen Tag zu wählen.',
  'help.guide.tour-walk-google-import.goal':
    'Eine aus Google Maps geteilte Fußroute einfügen und ihre Halte als Spaziergang übernehmen.',
  'help.guide.tour-walk-google-import.result':
    'Im Editor öffnet sich ein neuer Stadtspaziergang mit den Halten aus Google Maps, bereit zum Speichern.',
  'help.guide.tour-walk-check-off.tip.2':
    'Auch die Zeile des Spaziergangs im Tagesplan zeigt die Zahl, zum Beispiel 3/7.',
  'help.ctx.trip-tour-bike.bullet.4':
    'Beim MTB-Profil zeigt dieselbe Karte die Schwierigkeitsgrade der Trails (mtb:scale), sofern Kartierer sie eingetragen haben. Ein Weg ohne Angabe ist unbekannt, nicht leicht.',
  'help.guide.tour-bike-profile.step.6':
    'Gib unter „Name der Tour“ einen Namen ein und klick unten in der linken Leiste auf „Speichern“.',
  'help.guide.tour-bike-surfaces.goal':
    'Herausfinden, wie viel der Route asphaltiert, geschottert oder unbekannt ist und über welche Wegarten sie führt.',
  'help.guide.tour-bike-surfaces.tip.3':
    'Die Karte wertet die Route so aus, wie der Router sie geplant hat, und ändert nichts an der Tour. Sie braucht eine Internetverbindung; offline weist sie darauf hin, und die Route bleibt unverändert.',
  'help.guide.tour-bike-mtb-grades.tip.1':
    '„Keine Angabe in den Daten“ heißt unbekannt, nicht leicht. Ein Schwierigkeitsgrad sagt nichts darüber, ob ein Trail zu dir passt.',
  'help.ctx.trip-tour-ski.bullet.3':
    'Jeder Punkt, den du auf der Karte anklickst, wird über Pisten, Lifte und Wege mit dem vorherigen verbunden. Unter jedem Punkt steht sein Abschnitt als Chips, Pisten in der Farbe ihres Schwierigkeitsgrads, jeweils mit Minuten. Lässt sich ein Abschnitt nicht planen, wird er rot, nennt den Grund und bietet eine Lösung oder „Gerade zeichnen“ an.',
  'help.guide.tour-ski-plan.step.4':
    'Prüf, ob „Punkt hinzufügen“ eingeschaltet ist, und klick dann der Reihe nach auf die Karte: dort, wo du startest, und an jeder Stelle, die du erreichen willst. Der Pisten-Router verbindet jeden Punkt über Pisten, Lifte und Wege mit dem vorherigen.',
  'help.guide.tour-ski-options.title': 'Dem Pisten-Router sagen, wie du Ski fährst',
  'help.guide.tour-ski-options.tip.2':
    '„Lifte nutzen“ ist bei „Alpin“ und „Snowboard“ standardmäßig an, bei den anderen Disziplinen aus. „Auslassen“ und „Bei Bedarf mit dem Lift ins Tal“ erscheinen nur, wenn Lifte genutzt werden.',
  'help.guide.tour-ski-fix-leg.tip.1':
    'Du kannst den Punkt auf der Karte auch näher an eine Piste, einen Weg oder einen Lift ziehen. Sobald du loslässt, wird der Abschnitt neu geplant.',
  'help.guide.tour-ski-summary.step.2':
    '„Skifahren“, „Im Lift“, „Warten“ und „Zu Fuß“ zeigen jeweils die Zeit dafür. „Pisten“, „Abfahrt auf Pisten“ und „Liftfahrten“ zeigen die Länge der Pisten, die Höhenmeter, die du auf ihnen abfährst, und wie viele Lifte du nimmst.',
  'help.guide.tour-ski-pistes-layer.goal':
    'Die Pisten, Loipen und Lifte rund um deine Skitour sehen und verstehen, was ihre Farben bedeuten.',
  'help.guide.tour-ski-import.title': 'Einen Ski-Track importieren und angeben, was es war',
  'help.guide.tour-ski-import.tip.1':
    'Ein importierter Track bleibt so, wie er aufgezeichnet wurde: TREK legt ihn nicht auf die Pisten, und seine Karte zeigt bei „Skizeit“ „Nicht berechnet“.',
  'help.ctx.trip-tour-paddle.bullet.3':
    'Unter „Weitere Aktionen“ an einem Punkt findest du die Paddel-Werkzeuge: den nächsten Abschnitt auf dem Wasser planen oder von Hand zeichnen, „Ab hier umtragen“ und „Schleuse an diesem Punkt“.',
  'help.guide.tour-paddle-setup.step.3':
    'Wähl unter „Boot“ „Kajak“, „Kanadier“, „SUP“ oder „Andere“. Nach dem Boot richtet sich die Geschwindigkeit, die TREK vorschlägt.',
  'help.guide.tour-paddle-setup.tip.4':
    '„Paddeln hat Risiken“, die Zeile unten in der Spalte, öffnet „Sicherheit beim Paddeln“. Lies das einmal vor deiner ersten Tour.',
  'help.guide.tour-paddle-water-route.step.5':
    'Um alle von Hand gezeichneten Abschnitte auf einmal zu planen, klick auf „Von Hand gezeichnete Abschnitte auf dem Wasser planen“, die Wellen im Kopf von „Wegpunkte“.',
  'help.guide.tour-paddle-portage.step.1':
    'Zeig auf den Halt, an dem du aussteigst, und klick auf „Weitere Aktionen“, die drei Punkte.',
  'help.guide.tour-paddle-portage.result':
    'Der Abschnitt ist jetzt auf der Karte und in den Wegpunkten eine Portage, und die „Zeitschätzung“ rechnet ihn als Tragen.',
  'help.guide.tour-paddle-lock.tip.2':
    'Führt eine Portage um die Schleuse herum, wird die Schleuse mit „Umtragen, es zählt die Portage“ gedimmt, und ihre Minuten fallen weg.',
  'help.guide.tour-paddle-time.step.4':
    'Gehört eine Portage zur Tour, erfasst die Zeile „Tragen“ das Umtragen. Klick auf ihre Geschwindigkeit und gib ein, wie schnell du das Boot trägst. „Aus- und Einsetzen“ rechnet an jeder Portage die angegebenen Minuten dazu.',
  'help.guide.tour-paddle-wind.step.1':
    'Ordne die Paddeltour einem Tag der Reise zu. Die Karte „Wind“ in der linken Spalte zeigt dann die Vorhersage für diesen Tag am Startpunkt der Tour.',
  'help.guide.tour-paddle-wind.result': 'Du kennst den Wind des Tages an deiner Einsatzstelle, Stunde für Stunde.',
  'help.guide.tour-paddle-checklist.tip.1':
    'Wähl für jedes Hindernis, was du tun wirst: „Durchfahren“, „Umtragen“, „Umfahren“ oder „Nicht betroffen“. „Nächstes“ bringt dich zum nächsten offenen Eintrag.',
  'help.guide.tour-paddle-track-marks.step.1':
    'Klick im Tab „Touren“ in der rechten Spalte auf „Tour hinzufügen“, wähl „GPX oder KML importieren“ und dann die Datei.',
  'help.guide.tour-paddle-track-marks.tip.2':
    '„Verwerfen“ entfernt die Marken, die du noch nicht gespeichert hast. Der aufgezeichnete Track selbst wird nie neu gezeichnet.',
  'help.ctx.trip-tour-horse.bullet.4':
    'TREK berechnet keine Reitzeit. Wenn du am Tag eine Zeit sehen willst, gib sie in den Details unter „Geplant“ ein.',
  'help.guide.tour-horse-plan.step.5':
    'Wähl unter „Bereiche“ einen Abschnitt. Prüf die „Richtung“, in der du ihn reitest, und was „Reitzugang“ entlang des Abschnitts angibt.',
  'help.guide.tour-horse-plan.tip.5':
    'Bei einem Ritt wird nichts geroutet: Ein Klick auf die gezeichnete Linie fügt keinen Formpunkt ein, und die Punkte an den Enden eines Abschnitts bleiben dort, wo die Route sie vorsieht.',
  'help.guide.tour-horse-gap.tip.1':
    'Einen manuellen Abschnitt hat weder ein Router noch eine Reitroute geprüft. Sieh auf der Karte nach, wo er tatsächlich verläuft.',
  'help.guide.tour-horse-recorded.step.4':
    'Der Ausritt öffnet sich in der linken Spalte. Die Karte „Aufgezeichneter Ausritt“ zeigt „Wie aufgezeichnet“, „Keine Reitzeit“ und „Zugang nicht geprüft“. Zeig auf ein Badge, um den Grund zu lesen.',
  'help.guide.dateless-trip.step.2':
    'Lass „Startdatum“ und „Enddatum“ leer. Darunter erscheint das Feld „Anzahl Tage“: Gib ein, für wie viele Tage du planen willst.',
  'help.guide.trip-reminder.tip.1':
    'Nur der Besitzer der Reise (oder ein Administrator) sieht den Bereich „Erinnerung“. Ist er ausgegraut, muss ein Administrator die Reiseerinnerungen erst unter „Admin“, „Benachrichtigungen“ einschalten.',
  'help.guide.upcoming-reservations.step.2': 'Klick auf eine Buchung, um die zugehörige Reise zu öffnen.',
  'help.guide.timezones-widget.tip.1':
    'Die Liste verwendet die offiziellen Zeitzonennamen wie Europe/Lisbon oder America/New_York. Such also nach der Stadt, die im Namen steht.',
  'help.guide.half-company-holiday.step.2': 'Schalte in derselben Werkzeugleiste „Halbtag“ ein.',
  'help.guide.edit-holiday-calendar.tip.1':
    'Jede Änderung wird sofort gespeichert, einen Button „Speichern“ gibt es nicht.',
  'help.guide.person-color.tip.1':
    'An derselben Farbe erkennst du die Person in der Werkzeugleiste und in der Karte „Urlaubsanspruch“.',
  'help.guide.answer-fusion-request.step.2':
    'Lies, was Fusionieren bedeutet: ein gemeinsamer Kalender, Einträge, die ihr gegenseitig bearbeiten könnt, und gemeinsame Ferieneinstellungen.',
  'help.guide.log-for-partner.step.2':
    'Sieh in die Werkzeugleiste: Der erste Button zeigt jetzt Name und Farbe der anderen Person.',
  'help.guide.dissolve-fusion.step.2': 'Klick unten unter „Fusion auflösen“ auf „Auflösen“.',
  'help.guide.country-places.step.3':
    'Der Dialog listet alle Orte, die für das Land zählen, nach Reisen gruppiert. Sind es mehr als sechs, kannst du die Liste oben mit „Orte suchen“ eingrenzen. Klick auf einen Ort oder eine Reiseüberschrift, um diese Reise im Planer zu öffnen.',
  'help.guide.tour-activity-stats.step.5':
    'Klick auf „Touren anzeigen“. „Meine Touraktivitäten“ öffnet sich mit den Summen, der Aufteilung „Nach Art“ und allen Touren des Zeitraums, jeweils mit Tag, Reise, Distanz und Anstieg. Auch hier änderst du Zeitraum und Typ über die Chips in der Kopfleiste.',
  'help.guide.move-to-list.step.3':
    'Wähl die Liste, in die sie verschoben werden. Bei mehr als drei Listen kannst du sie oben über ein Suchfeld eingrenzen.',
  'help.guide.accept-list-invite.goal':
    'Einer Liste beitreten, die jemand mit dir geteilt hat, oder die Einladung ablehnen.',
  'help.guide.tour-collection-add-to-trip.step.4':
    'Ändere bei Bedarf „Name in der Reise“ und klick dann auf „In eine Reise übernehmen“.',
  'help.guide.tour-collection-manage.step.2':
    'Tipp etwas in „Orte suchen“ ein. Das Feld filtert die Touren zusammen mit den Orten nach Namen.',
  'help.guide.create-journey.tip.3':
    'Ist eine Reise gerade zu Ende gegangen, erscheint oben das Banner „Trip gerade beendet“. „Journey erstellen“ darin legt eine Journey an, in der diese Reise schon angehakt ist.',
  'help.guide.entry-draft.step.2': 'Klick auf „Speichern“. Die Karte trägt jetzt das Badge „Entwurf“.',
  'help.guide.gallery-map.step.3':
    'Zurück im „Zeitstrahl“ folgt die Karte rechts deinem Scrollen: Der Eintrag, den du gerade siehst, ist in seiner Tagesfarbe umrandet, und ein Klick auf einen Pin scrollt den Zeitstrahl zu dessen Eintrag.',
  'help.guide.journey-map-layers.tip.1':
    'Eine gestrichelte farbige Linie ist die GPX-Route einer Reise und gehört zum Plan. Eine durchgezogene Linie ist eine Strecke, die an diesem Tag aufgezeichnet wurde.',
  'help.guide.journey-keep-route.tip.1':
    'Wo die Aufzeichnung endet, endet auch die Linie. Es wird kein Weg gezeichnet, der nicht aufgezeichnet wurde.',
  'help.guide.journey-day-stays.tip.1':
    'Die Zeile erscheint nur für Personen, die das Journal bearbeiten dürfen und ein eigenes Dawarich verbunden haben, und nur an Tagen, an denen noch etwas zu entscheiden ist.',
  'help.guide.journey-take-over-day.step.4':
    'Lass „Tagesstrecke mitspeichern“ eingeschaltet, um auch die Strecke zu übernehmen, und klick dann auf „Übernehmen“. Der Button zeigt an, wie viele Entwürfe angelegt werden.',
  'help.guide.journey-auto-prepare.step.3':
    'Die Zeile darunter zeigt, wann deine Aufenthalte zuletzt abgerufen wurden oder warum es nicht geklappt hat. „Jetzt abrufen“ fragt Dawarich sofort ab.',
  'help.guide.photo-location.tip.1': 'Orte, die du selbst gesetzt hast, werden nie verschoben.',
  'help.ctx.settings-plugins.bullet.1':
    '„Plugin-Einstellungen“: Darunter folgt für jedes Plugin, das Angaben von dir braucht, eine Karte mit seinen Feldern und „Speichern“. Ein geheimes Feld wird nach dem Speichern nicht mehr angezeigt.',
  'help.guide.dashboard-widgets.step.3':
    '„Auf Standard zurücksetzen“ unter den Karten setzt den ganzen Tab „Darstellung“ auf den Auslieferungszustand zurück.',
  'help.guide.web-push-device.result':
    'Auf der Karte steht „Für dieses Gerät eingeschaltet“, und die Ereignisse, die du unter „Push“ eingeschaltet hast, kommen auch an, wenn TREK geschlossen ist.',
  'help.guide.connect-airtrail.step.1':
    'Such unter „Integrationen“ AirTrail und gib die „Instanz-URL“ und einen API-Schlüssel ein. Den Schlüssel erstellst du in AirTrail unter „Einstellungen“, „Sicherheit“.',
  'help.guide.connect-dawarich.step.1':
    'Such unter „Integrationen“ Dawarich und gib die „Adresse der Instanz“ und den API-Schlüssel ein, den du in Dawarich unter „Konto“, „API-Schlüssel“ findest.',
  'help.guide.tour-connect-wanderer.step.1':
    'Such unter „Integrationen“ wanderer und gib die „Instanz-URL“ und ein API-Token ein. Das Token erstellst du in wanderer unter „Einstellungen“, „Konto“, „API-Tokens“, es beginnt mit wanderer_key_.',
  'help.guide.tour-wanderer-watch.goal':
    'TREK im Hintergrund prüfen lassen, ob sich deine importierten Trails geändert haben.',
  'help.guide.mcp-oauth.tip.3':
    'API-Tokens funktionieren weiterhin, sind aber als „Veraltet“ markiert. Steig auf einen OAuth-Client um.',
  'help.guide.offline-conflicts.tip.2': 'Diese Auswahl gilt nur für dieses Gerät.',
  'help.guide.default-user-settings.tip.1':
    'Was ein Benutzer selbst unter „Einstellungen“ wählt, hat immer Vorrang. Diese Standards gelten für alle, die die Einstellung nicht geändert haben.',
  'help.guide.own-routing-engine.step.1':
    'Gib in „Benutzer-Standards“ unter „Karte“ bei „Eigene Routing-Instanz“ die Adresse deines OSRM-Servers ein.',
  'help.guide.admin-passkeys.tip.2':
    'Änderst du die Domain später, funktionieren alle Passkeys, die bereits hinzugefügt wurden, nicht mehr.',
  'help.guide.instance-keys.tip.4':
    'Der Amap-Schlüssel muss ein Schlüssel vom Typ Web 服务 (Webdienst) sein, kein JS-API-Schlüssel.',
  'help.guide.rotate-jwt-secret.step.2': 'Lies die Warnung und klick auf „Erneuern und abmelden“.',
  'help.guide.notification-defaults.tip.2':
    'Ein Standard gilt nur für Leute, die diese Zelle nicht selbst geändert haben.',
  'help.ctx.notifications.bullet.5':
    'Welche Ereignisse dich hier erreichen und welche per E-Mail, Webhook, ntfy oder Push, legst du in den Einstellungen unter Benachrichtigungen fest.',
  'help.guide.read-notifications.result':
    'Du landest auf der Seite, um die es in der Benachrichtigung ging, und die Zahl an der Glocke sinkt um eins.',
  'help.guide.mark-notifications-read.title': 'Benachrichtigungen als gelesen markieren',
  'help.guide.delete-notifications.goal': 'Die Liste kurz halten, indem du entfernst, was du nicht mehr brauchst.',
  'help.guide.notification-settings.step.1': 'Klick oben rechts auf deinen Namen.',
  'help.guide.public-link.step.5':
    'Du kannst die Auswahl ändern, solange der Link besteht. „Link löschen“ deaktiviert ihn.',
  'help.guide.link-journal.step.3':
    'Wähl für jede Person der Reise „Kein Zugriff“, „Lesen“ oder „Bearbeiten“. „Alle lesen“ und „Niemand“ setzen alle auf einmal.',
  'help.guide.collapse-columns.tip.3':
    'Sobald der Trenner den Fokus hat, lässt er sich auch mit den Pfeiltasten verschieben.',
  'help.guide.edit-place.tip.3':
    'Ein Klick neben den Dialog verwirft deine Änderungen nicht einfach: TREK fragt erst „Änderungen verwerfen?“, und „Weiter bearbeiten“ bringt dich zurück zum Formular.',
  'help.guide.dawarich-stays.goal':
    'Die Orte übernehmen, an denen du dich laut Dawarich während der Reise aufgehalten hast, nachdem du jeden einzeln geprüft hast.',
  'help.guide.leave-stop-off-route.step.1':
    'Klick mit der rechten Maustaste auf den Halt oder auf seine drei Punkte und wähl „Aus der Route nehmen“.',
  'help.guide.move-booking-day.step.3':
    'Die Zeile steht jetzt am neuen Tag, zu ihrer bisherigen Uhrzeit. Öffne die Buchung, wenn sich auch die Uhrzeit ändern soll.',
  'help.guide.place-image-from-file.goal':
    'Ein Foto, das schon bei den Dateien des Ortes liegt, als dessen Bild verwenden, ohne es erneut hochzuladen.',
  'help.guide.place-image-from-file.tip.3': 'Nur Reisende, die Orte bearbeiten dürfen, können das Bild ändern.',
  'help.guide.place-own-hours.result':
    'Die Karte zeigt deine Telefonnummer, deine E-Mail und deine Öffnungszeiten, und der Ring um das Bild ist je nach deinen Öffnungszeiten grün oder rot.',
  'help.guide.confirm-stay-booking.step.4':
    'Schließ die Buchung mit dem X oben rechts. Unter „Reservierung“ steht auf der Karte des Aufenthalts jetzt „Bestätigt“.',
  'help.guide.tour-map-lines.title': 'Deine Touren auf der Karte finden',
  'help.guide.tour-map-lines.tip.2':
    'Das Ausblenden gilt nur für dich und wird in diesem Browser für diese Reise gespeichert: Die Tour, ihre Tage und ihre Farbe bleiben für alle unverändert. „Alle einblenden“ über der Liste „Touren“ holt alle ausgeblendeten Touren zurück, und auf dem Handy zeigt die Karte immer alle Touren.',
  'help.guide.car-stops.step.4':
    'Klick unter „Stopps unterwegs“ für jeden Ort, durch den die Fahrt führt, auf „Zwischenstopp hinzufügen“ und wähl ihn aus, auf Wunsch mit Uhrzeit. Ein Zwischenstopp ohne ausgewählten Ort wird beim Speichern verworfen.',
  'help.guide.transport-details.step.2':
    'Die Chips im Kopf zeigen Status, Typ, Tag und „Buchungscode“. Ein Klick auf den Status-Chip wechselt zwischen „Ausstehend“ und „Bestätigt“. Das kleine Kopier-Symbol im Code-Chip, „Buchungscode kopieren“, legt den Code für den Check-in-Schalter in die Zwischenablage.',
  'help.guide.group-sort-bookings.step.3':
    'Wähl unter „Sortieren nach“ „Datum“, „Titel“, „Typ“ oder „Status“. Die Zeile darunter dreht die Reihenfolge um: „Früheste zuerst“ oder „Späteste zuerst“ bei Datum, „A bis Z“ oder „Z bis A“ bei allem anderen.',
  'help.guide.booking-on-map.title': 'Eine Buchung auf der Karte finden',
  'help.guide.export-bookings-csv.tip.1':
    'Die Spalten heißen Typ, Titel, Status, Start, Ende, Von, Bis, Ort, Bestätigung und Notizen.',
  'help.guide.arrange-packing-list.tip.1':
    'Solange „A bis Z“ aktiv ist, lassen sich Einträge nicht verschieben, ganze Listen aber schon.',
  'help.guide.count-packed-pieces.step.3':
    'Solange erst ein Teil der Stücke eingepackt ist, steht der Zähler in deiner Akzentfarbe, und das Kästchen bekommt einen Rand in dieser Farbe. Mit dem Minus nimmst du ein Stück wieder heraus.',
  'help.guide.expense-receipts.step.5':
    'Die Vorschau zeigt den Beleg, oben mit „In neuem Tab öffnen“ und „Herunterladen“. Bei mehreren Belegen wechselst du mit den Pfeiltasten, und Esc schließt die Vorschau.',
  'help.guide.files-sync-settings.step.3':
    'Klick unter der Ablaufleiste auf „Einstellungen“, um die übrigen Optionen aufzuklappen.',
  'help.guide.manage-notes.step.3':
    '„Anheften“ im selben Menü hält die Notiz oben im Panel, eingerahmt in der Farbe ihrer Kategorie und mit einer Nadel neben dem Titel. „Loslösen“ an derselben Stelle reiht sie wieder normal ein.',
  'help.guide.note-categories.step.1':
    'Klick in der Kopfzeile der Karte „Notizen“ auf das Zahnrad neben „Neue Notiz“. „Kategorien verwalten“ öffnet sich mit einer Zeile pro Kategorie: ihre Farbe, ihr Name, sechs Farbpunkte und ein Papierkorb.',
  'help.guide.note-categories.tip.2':
    'Eine Kategorie ohne Notizen wird nur in deinem Browser gespeichert. Die anderen Mitglieder sehen sie erst, wenn eine Notiz in ihr abgelegt ist.',
  'help.guide.roadtrip-reorder.goal':
    'Die Reihenfolge der Fahrt ändern oder einen Halt auf einen anderen Tag verschieben, direkt in der Leiste.',
  'help.guide.roadtrip-overnight.step.4':
    '„Unterkunft finden“ daneben bietet den Namen zum Kopieren und Links zu Buchungsseiten: trivago oder CHECK24 für ein Hotel, PiNCAMP oder Pitchup für einen Campingplatz. Prüf auf der Seite Ort, Daten und Gäste.',
  'help.guide.roadtrip-stop-fill.step.2':
    'Wähl unter „Tankt auf“ einen Wert von 50 bis 100. Die Zeile unter den Buttons zeigt, wie weit du damit von hier aus kommst.',
  'help.guide.roadtrip-bookings.step.2':
    'In der Leiste erscheint die Fahrt als Karte in der Farbe ihres Typs, mit den Fahrplanzeiten in der Ankunftsspalte und Start und Ziel unter dem Titel.',
  'help.guide.roadtrip-google-import.tip.1':
    'TREK berechnet zwischen den Halten eine eigene Route; Googles Straßenverlauf wird nicht übernommen.',
  'help.guide.roadtrip-hazards.result':
    'Die Karte zeigt die aktuellen Warnungen rund um deine Reise, und die Route bleibt unverändert.',
  'help.ctx.trip-tours.bullet.3':
    'Eine Zeile: Der farbige Balken ist die Linie der Tour auf der Karte, die runde Kachel zeigt das Routing-Limit (T1 bis T6) oder den Typ, ein kleines Badge „GPX“ oder „wanderer“ kennzeichnet einen Import, und die Badges zeigen Tage, Zeit, Distanz und Aufstieg. Ein Mond mit einer Zahl gibt die Anzahl der Etappen einer Mehrtagestour an.',
  'help.guide.tour-show-list.step.3': 'Klick auf eine Zeile. Die Infokarte der Tour öffnet sich über der Karte.',
  'help.guide.tour-add-to-day.goal':
    'Planen, wann du eine Tour machst, damit sie im Tag steht und ihre Linie auf der Karte erscheint.',
  'help.guide.tour-add-to-day.tip.3':
    'Eine Tour kann nur einmal auf einem Tag liegen. Ziehst du sie auf einen Tag, an dem sie schon ist, erscheint nur der Hinweis „Diese Tour ist schon an diesem Tag.“',
  'help.guide.tour-day-times.step.4':
    'Endet die Tour erst, nachdem der nächste Eintrag des Tages beginnt, weist eine Zeile darunter darauf hin, zum Beispiel „Endet um 13:30, nachdem Mittagessen in der Gostner Schwaige um 12:30 beginnt“. Verschoben wird nichts.',
  'help.guide.tour-remove-from-day.step.1':
    'Zeig in der Tagesspalte auf die Zeile der Tour, klick auf „Weitere Optionen“ und wähl „Aus Tag entfernen“.',
  'help.guide.tour-filter-list.step.1':
    'Klick auf den Filter-Button unter „GPX oder KML importieren“. Er zeigt den Status, nach dem er gerade filtert, anfangs „Alle“, mit der Anzahl der Touren daneben.',
  'help.guide.tour-hide-on-map.title': 'Die Linie einer Tour auf der Karte ausblenden',
  'help.guide.tour-import-plan-tab.title': 'Einen Track aus dem Tab „Planung“ importieren',
  'help.ctx.trip-tour-detail.title': 'Tourdetails',
  'help.guide.tour-detail-read.goal':
    'Alles sehen, was die Reise über eine Tour weiß: ihre Tage, ihre Werte, ihr Profil und ihre Herkunft.',
  'help.guide.tour-detail-read.tip.1':
    'Ein bernsteinfarbener Chip „mit Vorsicht verwenden“ bedeutet, dass beim Import Höhen oder Messwerte unvollständig waren. Lies Aufstieg und Profil mit diesem Wissen.',
  'help.guide.tour-rename-colour.step.1':
    'Öffne die Infokarte der Tour und klick auf den Stift neben ihrem Namen. Der Name wird zu einem Eingabefeld.',
  'help.guide.tour-take-along.goal':
    'Zum Startpunkt einer Tour kommen, ihre Seite im Web öffnen oder ihre Route als GPX-Datei mitnehmen.',
  'help.guide.tour-take-along.result':
    'Du hast den Weg zum Startpunkt in deiner Karten-App und die ganze Route als GPX-Datei.',
  'help.guide.tour-copy-keep.tip.2':
    '„In Sammlung speichern“ im Menü einer Tour im Tagesplan öffnet denselben Dialog, die Route wird also auch dort mitgespeichert.',
  'help.guide.tour-packing-link.step.3': 'Klick auf „Verknüpfen“.',
  'help.guide.tour-files.goal':
    'Eine Buchung, eine Karte oder eine Wegbeschreibung bei der Tour ablegen und über ihre Infokarte wieder öffnen.',
  'help.guide.tour-activity-link.goal':
    'Einen aufgezeichneten GPX-Track bei einer geplanten Tour ablegen, ohne den Plan zu ändern.',
  'help.guide.tour-activity-link.tip.3':
    '„Benötigte Zeit“ reicht vom ersten bis zum letzten Zeitstempel im Track, Pausen eingeschlossen.',
  'help.guide.tour-activity-compare.tip.1':
    '„Auf der Karte vergleichen“ gibt es nur, wenn die Infokarte neben der Karte steht, nicht auf dem Handy.',
  'help.guide.tour-origin-check.tip.1':
    'Bei einer Tour, die aus einer anderen Reise übernommen wurde, stehen diese Reise und die Tour unter „Übernommen aus“.',
  'help.ctx.trip-tour-planner.bullet.3':
    '„Touren dieser Reise“, die rechte Leiste, listet alle Touren, darüber der Filter und „Umfang der Reise“. Ist eine Tour geöffnet, zeigt die „Tourenübersicht“ oben ihre Distanz, ihren Anstieg, ihre Dauer und ihr Höhenprofil. Mit dem Plus oben, „Tour hinzufügen“, planst, importierst oder übernimmst du eine Tour.',
  'help.guide.tour-open-workspace.step.3':
    'Die rechte Leiste, „Touren dieser Reise“, listet alle Touren der Reise, darüber der Filter und „Umfang der Reise“.',
  'help.guide.tour-open-workspace.result':
    'Der Tab „Touren“: links der Editor, rechts die Touren der Reise, dazwischen die Karte.',
  'help.guide.tour-draw-route.step.6':
    'Unter „Wegpunkte“ bekommt jeder Punkt eine Zeile mit seiner Nummer und, sobald der Name geladen ist, dem Namen des Ortes. Während TREK arbeitet, zeigt ein kleiner Punkt neben „Neue Tour“, was gerade passiert.',
  'help.guide.tour-type-profile.step.1':
    'Klick unter „Name der Tour“ auf „Tourtyp“. Dort siehst du den aktuellen Typ und eine Zeile dazu, wie er geplant wird.',
  'help.guide.tour-edit-points.goal':
    'Den Verlauf der Tour ändern, indem du ihre Punkte auf der Karte oder in der Liste verschiebst.',
  'help.guide.tour-edit-points.tip.2':
    'Eine Zeile zeigt die Koordinaten, bis der Ortsname geladen ist. Für „Rückgängig“ und „Wiederherstellen“ gibt es kein Tastenkürzel.',
  'help.guide.tour-shaping-points.tip.1': 'Start und Ziel sind immer Halte.',
  'help.guide.tour-loop-reverse.step.3':
    'Klick daneben auf „Richtung umkehren“, um die ganze Tour in umgekehrter Richtung zu gehen.',
  'help.guide.tour-leg-by-hand.step.2':
    'Der Abschnitt wird zu einer gestrichelten Geraden, und unter der Zeile steht in der Liste „Von Hand gezeichnet, nicht geroutet“ mit seiner Länge.',
  'help.guide.tour-trip-places.step.1':
    'Klick unter „Wegpunkte“ neben „Punkt hinzufügen“ auf „Reise-Orte“. Darunter klappen die Orte der Reise auf.',
  'help.guide.tour-details-times.title': 'Tour benennen und Zeit planen',
  'help.guide.tour-details-times.tip.3':
    '„Details“ klappst du mit dem Pfeil daneben zu. Der Bereich öffnet sich von selbst, wenn eines seiner Felder einen Wert enthält, den „Speichern“ nicht akzeptiert.',
  'help.guide.tour-save.tip.1':
    '„Verwerfen“ neben „Speichern“ verwirft nach einer Rückfrage die ungespeicherten Änderungen. Eine gespeicherte Tour bleibt davon unberührt.',
  'help.guide.tour-edit-saved.step.3':
    'Klick auf „Speichern“. Es erscheint „Tour gespeichert“, und die Tour behält ihre Tage, Dateien und Notizen.',
  'help.guide.tour-summary-profile.step.1':
    'Die „Tourenübersicht“ oben in „Touren dieser Reise“ zeigt „Distanz“, „Aufstieg“ und „Abstieg“ der Tour im Editor, ihre geschätzte Dauer, die Pausen und die geplante Gesamtzeit.',
  'help.guide.tour-list-manage.title': 'Die Touren der Reise organisieren',
  'help.guide.tour-list-manage.tip.2':
    'Ein Tag, an dem die Tour schon liegt, ist im Tagesmenü ausgegraut. Bei einer Mehrtagestour wirst du gefragt, ob die Etappen ab diesem Tag verteilt werden oder die ganze Tour auf diesen Tag kommt.',
  'help.guide.tour-delete.tip.2':
    'Willst du sie nur von einem Tag nehmen, nutz stattdessen „Aus Tag entfernen“ im Menü des Tages.',
  'help.guide.tour-saved-elsewhere.step.4':
    'Wähl „Als neue Tour speichern“, um beide zu behalten, „Neuere laden“, um die andere Version zu übernehmen, oder „Überschreiben“, um sie bewusst durch deine zu ersetzen.',
  'help.ctx.trip-tour-import.bullet.3':
    'Ein Import öffnet sich als GPX-Tour oder wanderer-Tour, so wie er hereinkam: mit Linie, „Tourenübersicht“ und Höhenprofil. Seine Zeile in der Liste trägt das Badge „GPX-Import“.',
  'help.guide.tour-import-gpx.step.4':
    'Prüf unter „Importieren als“, um welche Art von Track es sich handelt. Voreingestellt ist „Wanderung“. Bei „Radtour“ oder „Lauf“ wirst du nach dem Profil gefragt, bei „Paddeltour“ nach Boot und Gewässer, bei „Ski & Winter“ nach der Disziplin.',
  'help.guide.tour-view-import.title': 'Einen importierten Track ansehen',
  'help.guide.tour-view-import.result':
    'Du siehst den aufgezeichneten Track genau so, wie er importiert wurde, ohne dass etwas neu berechnet wurde.',
  'help.guide.tour-plan-from-import.tip.2':
    'Weist die Infokarte darauf hin, dass der Vorschlag über längere Strecken vom Track abweicht, prüf diese Abschnitte auf der Karte, bevor du damit planst.',
  'help.guide.tour-restore-recorded.step.3':
    'Bestätige mit „Aufgezeichnete Strecke wiederherstellen“. Die Wegpunkte und die geroutete Linie werden entfernt, Tage und Notizen bleiben erhalten.',
  'help.guide.tour-take-over.step.3':
    'Such die Tour: Tipp etwas in „Nach Name suchen“ ein oder grenz die Liste mit den Filtern „Reise“ und „Typ“ ein.',
  'help.guide.tour-import-wanderer.title': 'Einen Trail aus wanderer importieren',
  'help.guide.tour-import-wanderer.tip.3':
    'Ein Trail, der schon in der Reise ist, ist mit „In dieser Reise“ markiert und bietet „Tour öffnen“ an. Hat er sich seitdem geändert, bietet er neben der alten Version „Als neue Version importieren“ an.',
  'help.ctx.trip-tour-map.bullet.4':
    '„Entlang der Tour“, eine Karte im linken Panel, sucht nahe der Route nach Aussichtspunkten, Wasser, Hütten, Essen und mehr und listet die Treffer auf. Einen Ort aus der Liste kannst du als Halt zur Tour hinzufügen.',
  'help.guide.tour-map-layers.tip.1':
    'Die gewählte Karte bleibt für jede Tour erhalten, die du öffnest, bis du die Seite neu lädst. Eine Tour, deren Typ diese Karte nicht anbietet, öffnet sich mit „Karte“. Die Karte im Tab „Planung“ und die Einstellung unter „Einstellungen“ bleiben unverändert.',
  'help.guide.tour-along-search.step.4':
    'Klick auf „Entlang der Tour suchen“. TREK sucht nur, an der Tour ändert sich nichts.',
  'help.guide.tour-along-add-stop.step.1':
    'Klick in der Liste „Entlang der Tour“ auf einen Ort oder auf seinen Pin auf der Karte. Über der Karte öffnet sich seine Infokarte: was er ist, wie weit er von der Route entfernt ist und an welcher Stelle der Tour er liegt.',
  'help.guide.tour-3d-terrain.title': 'Eine Tour in 3D sehen',
  'help.guide.tour-3d-terrain.tip.1':
    '„Gesamtübersicht“ in derselben Zeile zeigt wieder die ganze Route, nachdem du die Ansicht verschoben hast.',
  'help.guide.tour-3d-flyover.step.4': 'Klick auf „Gesamtübersicht“, um wieder die ganze Tour ins Bild zu holen.',
  'help.guide.tour-map-overlays.step.2':
    'Klick auf „Pistenlegende“, das kleine Quadrat aus farbigen Punkten neben dem Schalter.',
  'help.ctx.trip-tour-stages.summary':
    'Eine Mehrtagestour ist eine Route, die in Etappen aufgeteilt ist, eine für jeden Tag, an dem du unterwegs bist. Hier legst du fest, wo jeder Tag endet, siehst die Werte jeder Etappe und verteilst die Etappen auf die Tage der Reise.',
  'help.guide.tour-multi-day.step.1': 'Klick in „Touren dieser Reise“ auf die Tour, um sie im Editor zu öffnen.',
  'help.guide.tour-multi-day.tip.3':
    'Die Zeit einer Etappe zählt ohne Pausen. Steht eine Zeit in der Warnfarbe („Mehr als ein Tag unterwegs“), ist sie länger als ein Tag.',
  'help.guide.tour-stages-on-days.step.4':
    'Klick auf den Aufklapp-Button mit dem Mond und der Anzahl der Etappen, „Etappen zeigen“, um sie aufzuklappen.',
  'help.ctx.trip-tour-hike.title': 'Wanderungen und Läufe',
  'help.guide.tour-hike-plan.title': 'Eine Wanderung bis zu einer festgelegten Schwierigkeit planen',
  'help.guide.tour-hike-plan.result':
    'Die Wanderung steht mit Distanz, Anstieg und Gehzeit unter „Touren dieser Reise“ und kann auf einen Tag gelegt werden.',
  'help.guide.tour-hike-trail-details.step.2':
    'Wähl, was angezeigt wird: „SAC“ für die Wanderskala, „Belag“ oder „Wegtyp“. Die Route auf der Karte erscheint in denselben Farben wie die Liste.',
  'help.guide.tour-hike-round.title': 'Eine Rundwanderung mit ungefähr gewünschter Länge finden',
  'help.guide.tour-hike-round.tip.1':
    'Rundwanderungen halten sich an die „Maximale Wegschwierigkeit“ der Wanderung; welche das ist, zeigt der T-Chip in der Karte.',
  'help.guide.tour-hike-compare-ways.step.4':
    'Klick auf „Diesen Weg nehmen“. TREK prüft mit dem Router, ob die Route wirklich diesem Weg folgt.',
  'help.guide.tour-ferrata-add.step.2':
    'Klick auf der Karte auf einen Klettersteig, auf seine gestrichelte Linie oder sein Schild. Seine Infokarte zeigt Name, Schwierigkeitsgrad und Länge.',
  'help.guide.tour-ferrata-add.tip.4':
    '„In OpenStreetMap ansehen“ in der Infokarte öffnet die Daten des Klettersteigs. Kann nichts geladen werden, wird das Badge bernsteinfarben, und der Tooltip nennt den Grund.',
  'help.guide.tour-run-plan.result':
    'Der Lauf steht mit seiner „Laufzeit (geplant)“ unter „Touren dieser Reise“, Profil und Tempo werden mitgespeichert.',
  'help.guide.tour-run-ways.step.2':
    'Oben in der Karte siehst du jetzt, wie viel des Laufs unbefestigt ist und welcher Weg darauf am schwierigsten bewertet ist.',
  'help.ctx.trip-tour-walk.bullet.2':
    '„Wegpunkte“ listet die Halte der Reihe nach. Ein Ring um die Nummer eines Halts markiert ihn als „Unbedingt besuchen“ (durchgezogen) oder „Optional“ (gestrichelt), ein kleines Schild als „Geschützt“, und ein Chip unter seinem Namen zeigt die Aufenthaltsdauer.',
  'help.guide.tour-walk-plan.step.3':
    'Zeig in „Wegpunkte“ auf einen Halt, klick daneben auf „Weitere Aktionen“ und wähl „Station bearbeiten“.',
  'help.guide.tour-walk-sights.title': 'Sehenswürdigkeiten entlang eines Stadtspaziergangs hinzufügen',
  'help.guide.tour-walk-sights.tip.2':
    'Nachdem du die Route geändert hast, heißt der Button „Erneut suchen“, weil die gefundenen Orte noch zur alten Route gehören.',
  'help.guide.tour-walk-day-times.step.4':
    'Unter jedem Halt siehst du, wann du ankommst und wie lange du bleibst. Eine Warnung erscheint, wenn ein Ort zu dieser Zeit geschlossen ist oder während deines Aufenthalts schließt.',
  'help.guide.tour-walk-google-import.step.1':
    'Klick in „Touren dieser Reise“ auf „Tour hinzufügen“ (das + oben) und wähl „Walk aus Google Maps importieren“.',
  'help.guide.tour-walk-check-off.title': 'Die Halte eines Spaziergangs am Tag abhaken',
  'help.guide.tour-walk-check-off.tip.3':
    'Einen Spaziergang, den du offline auf einen Tag gelegt hast, kannst du abhaken, sobald er synchronisiert ist.',
  'help.guide.tour-bike-profile.title': 'Eine Radtour passend zu deinem Fahrstil planen',
  'help.guide.tour-bike-profile.result':
    'Die Radtour ist gespeichert und steht unter „Touren dieser Reise“, passend zu ihrem Profil geroutet und mit ihrer Fahrzeit in der „Tourenübersicht“.',
  'help.guide.tour-bike-surfaces.step.1':
    'Klick rechts in „Touren dieser Reise“ auf eine Radtour, um sie zu öffnen. Sobald ihre Route berechnet ist, erscheint unter „Wegpunkte“ die Karte „Belag und Wege“.',
  'help.guide.tour-bike-surfaces.tip.4':
    'Klick auf den Titel der Karte, um sie zuzuklappen. In diesem Browser bleibt sie auch nach dem Neuladen zugeklappt.',
  'help.guide.tour-bike-mtb-grades.tip.2':
    'Wo Mapper die Anstiege bewertet haben, folgt darunter „Bergauf-Schwierigkeit (mtb:scale:uphill)“ mit eigenen Zeilen.',
  'help.ctx.trip-tour-ski.bullet.4':
    'Die Karte „Pistenroute“ unter den Wegpunkten teilt den Tag in „Skifahren“, „Im Lift“, „Warten“ und „Zu Fuß“ auf, mit der Länge der Abfahrten, den dabei abgefahrenen Höhenmetern und den Liftfahrten. „Skizeit“ in der „Tourenübersicht“ rechts zählt alles zusammen, sobald jeder Abschnitt geplant ist.',
  'help.guide.tour-ski-plan.step.5':
    'Unter jedem Punkt ist sein Abschnitt als Chips aufgeführt: jede Piste, jeder Lift und jedes Stück zu Fuß mit Namen oder Art, Pisten mit einem Punkt in der Farbe ihres Schwierigkeitsgrads, und jeweils die Minuten.',
  'help.guide.tour-ski-options.goal':
    'Die schwierigsten Pisten, deine Vorlieben, dein Tempo und die gewünschten Lifte festlegen, damit die Abschnitte zu dir passen.',
  'help.guide.tour-ski-options.tip.3':
    '„Vermutete Verbindungen meiden“ hält die Route von Übergängen fern, die die Kartendaten nur vermuten, etwa einem nicht kartierten Stück zwischen zwei Pisten.',
  'help.guide.tour-ski-fix-leg.tip.2':
    'Solange die Pistendaten für ein Gebiet noch geladen werden, wartet der Planer und fragt dann von selbst noch einmal an.',
  'help.guide.tour-ski-summary.step.3':
    'In der „Tourenübersicht“ rechts zählt „Skizeit“ alles zusammen. Der Info-Punkt daneben erklärt, wie sie berechnet wird.',
  'help.guide.tour-ski-pistes-layer.step.1':
    'Solange eine Tour vom Typ „Ski & Winter“ geöffnet ist, zeigt die Karte automatisch die Pisten. Der Schalter mit dem verschneiten Berg in der Reihe unten links auf der Karte blendet sie aus und wieder ein; sein Tooltip lautet „Pisten, Loipen und Lifte“.',
  'help.guide.tour-ski-import.goal':
    'Einen aufgezeichneten Ski-, Langlauf- oder Schneeschuh-Track importieren und ihm die richtige Disziplin zuweisen.',
  'help.guide.tour-ski-import.tip.2':
    'Willst du ihn wie eine geplante Tour bearbeiten, nutz „Bearbeitbare Version planen“ in seiner Karte „Bearbeitbare Version“. Seine Punkte werden dabei mit geraden Linien verbunden.',
  'help.ctx.trip-tour-paddle.bullet.4':
    '„Zeitschätzung“ rechnet die Zeit auf dem Wasser, das Tragen, das Aus- und Einsetzen, die Schleusen und die Pausen zusammen, auf Basis von Geschwindigkeiten und Minuten, die du ändern kannst.',
  'help.guide.tour-paddle-setup.step.4':
    'Wähl unter „Gewässer“ „Fluss“ oder „See“. Solange nicht Boot und Gewässer gewählt sind, lässt sich die Tour nicht speichern.',
  'help.guide.tour-paddle-setup.result':
    'Eine neue Paddeltour mit Boot, Gewässer und Geschwindigkeit, bereit für den ersten Punkt auf der Karte.',
  'help.guide.tour-paddle-water-route.tip.1':
    'Fehlen die Gewässerdaten, holt TREK sie für die Region selbst oder fragt einen Admin danach, je nachdem, wie die Instanz eingerichtet ist. Der Abschnitt zeigt dann „Wasserdaten werden geladen“ und plant sich von selbst, sobald sie da sind, meist innerhalb von ein bis drei Minuten.',
  'help.guide.tour-paddle-portage.step.2':
    'Wähl „Ab hier umtragen“. Die Strecke bis zum nächsten Punkt wird zur Portage und an Land gezeichnet.',
  'help.guide.tour-paddle-lock.title': 'Schleuse mit Wartezeit hinzufügen',
  'help.guide.tour-paddle-lock.tip.3':
    '„Schleuse entfernen“ findest du unten in der geöffneten Karte und unter „Weitere Aktionen“.',
  'help.guide.tour-paddle-time.step.5':
    'Solange nicht alle Schleusen ihre Zeiten haben, zeigt die Schätzung „Unvollständig“, und ein Hinweis unter den Zeilen nennt, was fehlt.',
  'help.guide.tour-paddle-wind.step.2':
    'Lies ab, woher der Wind kommt, sowie „Mittel“ und „Böen“. „Mittel“ ist der stärkste Stundenmittelwert des Tages, „Böen“ die stärkste Böe.',
  'help.guide.tour-paddle-checklist.title': 'Die Hindernis-Checkliste durchgehen',
  'help.guide.tour-paddle-checklist.tip.2':
    '„Umtragen“ plant nicht automatisch eine Portage. Klick auf „Portage planen“, um sie auf der Karte anzulegen.',
  'help.guide.tour-paddle-track-marks.step.2':
    'Stell in der „Import-Vorschau“ „Importieren als“ auf „Paddeltour“ und wähl dann „Boot“ und „Gewässer“. Der Import wartet, bis beides gewählt ist.',
  'help.guide.tour-paddle-track-marks.tip.3':
    'Bei einem aufgezeichneten Track hat die Zeile „Gewässer“ in der „Zeitschätzung“ eine eigene Geschwindigkeit: Klick darauf und gib ein, wie schnell du gepaddelt bist.',
  'help.ctx.trip-tour-horse.bullet.5':
    'Ein aus einer GPX-Datei importierter Ausritt bleibt so, wie er aufgezeichnet wurde, und seine Karte „Aufgezeichneter Ausritt“ zeigt, was der Import nicht berechnet hat.',
  'help.guide.tour-horse-plan.step.6':
    'Klick auf „Abschnitt übernehmen“. Der Abschnitt kommt als Badge mit dem Namen der Route in der Karte „Wegpunkte“ zum Ritt dazu. Weitere Abschnitte übernimmst du genauso.',
  'help.guide.tour-horse-gap.title': 'Eine Lücke zwischen Reitrouten überbrücken',
  'help.guide.tour-horse-gap.tip.2':
    'Punkte, die du auf der Karte anklickst, kommen genauso zum Ritt dazu, als gerade, ungeprüfte Abschnitte.',
  'help.guide.tour-horse-recorded.result':
    'Der Ritt steht so in der Reise, wie du ihn geritten bist, mit Distanz und Höhen aus der Datei.',
  'help.guide.dateless-trip.step.3': 'Klick auf „Neue Reise erstellen“.',
  'help.guide.trip-reminder.tip.2':
    'Eine neue Reise hat automatisch eine Erinnerung 3 Tage vor der Abreise. Über welche Kanäle sie dich erreicht, legst du in den Einstellungen unter „Benachrichtigungen“ fest.',
  'help.guide.upcoming-reservations.result':
    'Die Reise öffnet sich. Zurück im Dashboard zeigt dir das Widget weiterhin, was als Nächstes ansteht.',
  'help.guide.entitlement.tip.2':
    'In einem fusionierten Plan hat jede Person eine eigene Zeile, und du kannst auch den Urlaubsanspruch der anderen festlegen.',
  'help.guide.half-company-holiday.step.3': 'Klick auf den Tag. Die Zelle wird zur Hälfte bernsteinfarben.',
  'help.guide.school-holidays.tip.2':
    'Fahr mit der Maus über einen Ferientag, dann siehst du unter „Schulferien“ den Namen der Ferien.',
  'help.guide.answer-fusion-request.step.3':
    'Klick auf „Annehmen & Fusionieren“, um die Pläne zusammenzuführen, oder auf „Ablehnen“, wenn dein Plan nur deiner bleiben soll.',
  'help.guide.log-for-partner.step.3':
    'Klick auf die Tage, die du eintragen willst, und klick danach unter „Personen“ wieder auf deinen eigenen Namen.',
  'help.guide.dissolve-fusion.result':
    'Alle haben wieder ihren eigenen Plan mit ihren eigenen Einträgen, und unter „Personen“ stehst nur noch du.',
  'help.guide.country-places.result': 'Der Planer öffnet die Reise, zu der der Ort gehört.',
  'help.guide.tour-activity-stats.step.6':
    'Ist eine Tour ausgefallen, klick auf „Auslassen“, den runden Button am Ende ihrer Zeile. Die Tour bleibt ausgegraut in der Liste und ist als „Ausgelassen“ markiert; derselbe Button heißt jetzt „Wieder mitzählen“ und holt sie zurück.',
  'help.guide.move-to-list.tip.1':
    'Labels gehören immer zu einer Liste. Ein verschobener oder duplizierter Ort kommt deshalb ohne sie an.',
  'help.guide.accept-list-invite.step.1':
    'Du findest die Einladung in der Listenleiste unter „Einladungen“. Bist du über die Benachrichtigung gekommen, steht die Karte schon oben auf der Seite. Darauf siehst du, um welche Liste es geht und von wem die Einladung kommt.',
  'help.guide.tour-collection-add-to-trip.tip.1':
    'Die neue Tour liegt an noch keinem Tag und fügt keine Orte hinzu. Weder die Liste noch die ursprüngliche Tour ändert sich.',
  'help.guide.tour-collection-manage.step.3':
    'Klick auf den Papierkorb am Ende der Tourzeile und bestätige mit „Aus der Sammlung entfernen“.',
  'help.ctx.journey-detail.bullet.7':
    'Ist Dawarich verbunden, zeigt eine Tageskopfzeile außerdem „Aufzeichnung übernehmen“ (oder die Distanz der Strecke, die der Tag behalten hat) und „Tag übernehmen“. Wartende Aufenthalte eines Tages stehen gesammelt in einer Zeile an seinem Ende.',
  'help.guide.entry-draft.tip.1':
    'Mitwirkende sehen einen Entwurf trotzdem; nur im öffentlichen Link fehlt er, bis du „Entwurf“ ausschaltest.',
  'help.guide.journey-map-layers.tip.2':
    'Ist ein Schalter ausgegraut, gibt es für ihn noch nichts anzuzeigen; der Tooltip erklärt, warum. Deine Auswahl wird pro Journey in diesem Browser gespeichert.',
  'help.guide.journey-keep-route.tip.2':
    'Klick später in der Tageskopfzeile auf die Distanz, um erneut mit Dawarich zu vergleichen: „Ersetzen“ übernimmt die neue Version, „Strecke entfernen“ nimmt den Tag aus der Journey.',
  'help.guide.journey-day-stays.tip.2':
    'An einem vollen Tag übernimmst du mit „Tag übernehmen“ am Ende der Zeile alle Aufenthalte auf einmal.',
  'help.guide.journey-take-over-day.tip.1':
    'Erst dieser Button schreibt etwas, und nichts landet doppelt: Ein Aufenthalt, der schon im Journal steht, ist markiert und lässt sich nicht noch einmal auswählen.',
  'help.guide.journey-auto-prepare.tip.1':
    'Vorbereitet werden nur Tage verknüpfter Reisen mit Datum, und von selbst wird nichts ins Journal geschrieben.',
  'help.guide.photo-location.result':
    'Ein Eintrag ohne Ort bekommt den Aufnahmeort seines ersten Fotos mit GPS-Daten und erscheint auf der Karte.',
  'help.guide.contributors.tip.2':
    '„Über Reisen“ zeigt die Personen, die über eine verknüpfte Reise Zugriff haben; ihren Zugriff änderst du in den Einstellungen dieser Reise, nicht hier.',
  'help.ctx.settings-plugins.bullet.2':
    'Ein Plugin kann seiner Karte Aktionen hinzufügen, die erst nach deiner Bestätigung ausgeführt werden, und „Verbinden“ oder „Trennen“, wenn es sich für dich bei einem anderen Dienst anmeldet.',
  'help.guide.web-push-device.tip.1':
    'Push gilt pro Browser: Wiederhol das auf jedem Handy und Computer, auf dem du Benachrichtigungen bekommen willst. „Für dieses Gerät ausschalten“ beendet es nur dort.',
  'help.guide.connect-airtrail.step.2':
    '„Selbstsignierte Zertifikate erlauben“ ist nur für eine vertrauenswürdige Instanz in deinem eigenen Netzwerk gedacht. „Änderungen zurück nach AirTrail schreiben“ ist standardmäßig aus, TREK liest also nur; schalte es ein, wenn deine Änderungen zurück an AirTrail gehen sollen.',
  'help.guide.connect-dawarich.step.2':
    'Mit „Automatisch nach neuen Aufenthalten suchen“ sieht TREK von selbst nach; ist es aus, liest TREK Dawarich nur, wenn du es anstößt. „Selbstsigniertes Zertifikat zulassen“ brauchst du nur für eine Instanz, der dein Server nicht vertraut.',
  'help.guide.tour-connect-wanderer.step.2':
    'Schalte „Selbstsigniertes Zertifikat zulassen“ nur für eine Instanz in deinem eigenen Netzwerk ein.',
  'help.guide.tour-wanderer-watch.step.1':
    'Schalte in der Karte „wanderer“ die Option „Meine Trails auf Änderungen prüfen“ ein. Dafür muss schon eine Verbindung gespeichert sein.',
  'help.guide.plugin-settings.title': 'Ein Plugin für dich einrichten',
  'help.guide.default-user-settings.tip.2':
    '„Anzeigewährung“ rechnet Beträge nur für die Anzeige um. Die Beträge, die unter „Kosten“ eingetragen sind, bleiben unverändert.',
  'help.guide.own-routing-engine.step.2':
    'Für Routen ohne Maut, Autobahnen oder Fähren trägst du unter „Eigene Valhalla-Instanz“ die Adresse deiner Valhalla-Instanz ein. Jedes Feld wird gespeichert, sobald du es verlässt; starte danach den TREK-Server neu und lade die Seite neu.',
  'help.guide.admin-passkeys.tip.3':
    'Hat jemand das Gerät mit seinen Passkeys verloren, entfernst du sie unter „Benutzer bearbeiten“ mit „Passkeys zurücksetzen“.',
  'help.guide.rotate-jwt-secret.result':
    'Ein neues Signatur-Secret ist aktiv, und alle Benutzer, auch du, müssen sich neu anmelden.',
  'help.guide.read-notifications.title': 'Benachrichtigungen lesen',
  'help.guide.filter-notifications.title': 'Alle oder nur ungelesene Benachrichtigungen anzeigen',
  'help.guide.mark-notifications-read.goal':
    'Die Hervorhebung und die Zahl an der Glocke entfernen, sobald du gesehen hast, was neu ist.',
  'help.guide.delete-notifications.step.1':
    'Klick auf „Löschen“, den Papierkorb neben der Uhrzeit einer Benachrichtigung, um nur diese eine zu entfernen.',
  'help.guide.notification-settings.step.2': 'Klick im Menü auf „Einstellungen“.',
  'help.guide.public-link.tip.3': 'Fahr mit der Maus über eine Option, um zu sehen, was sie weglässt.',
  'help.guide.link-journal.step.4':
    'Lies den gelben Hinweis: Er zeigt, wer das Journal zum ersten Mal bekommt. Klick dann auf „Journal verknüpfen“.',
  'help.guide.dawarich-stays.step.1':
    'Ist Dawarich in den Einstellungen unter „Integrationen“ verbunden, steht „Aus Dawarich“ oben in der Ortsliste. Die Kopfzeile zeigt, wann TREK zuletzt nachgesehen hat und wie viele Aufenthalte warten. Klick darauf, um die Liste zu öffnen.',
  'help.guide.leave-stop-off-route.step.2':
    'Neben dem Namen erscheint das Badge „Nicht auf der Route“. Der Halt bleibt im Tag und auf der Karte, aber die Route des Tages und ihre Abschnittszeiten lassen ihn aus.',
  'help.guide.move-booking-day.result': 'Die Buchung gehört im Plan jetzt zum neuen Tag, die Uhrzeit bleibt gleich.',
  'help.guide.clear-day.tip.2': 'Der Eintrag erscheint nur bei Tagen, an denen Orte eingeplant sind.',
  'help.guide.place-image-from-file.step.1':
    'Öffne einen Ort, der unter seinen Dateien ein Foto hat. Der Bereich „Dateien“ unten auf der Karte zeigt, wie viele Dateien der Ort hat.',
  'help.guide.place-own-hours.title': 'Öffnungszeiten, Telefon oder E-Mail eines Ortes korrigieren',
  'help.guide.place-own-hours.tip.1':
    'Selbst eingetragene Zeiten haben Vorrang vor den abgerufenen. So zeigt ein Café mit saisonalen Öffnungszeiten, was du weißt.',
  'help.guide.day-panel.tip.3':
    'Du planst lieber nach Kalender? Schalte in den Einstellungen unter „Allgemein“ die Option „Datum zuerst in Tagesüberschriften“ ein. Dann steht oben das Datum und darunter „Tag 1“ oder der Name des Tages.',
  'help.guide.confirm-stay-booking.result':
    'Die Hotelbuchung ist bestätigt, sowohl auf der Karte des Aufenthalts als auch im Tab „Buchungen“.',
  'help.guide.tour-map-lines.goal':
    'Die Touren der Reise auf der Karte unterscheiden, eine über ihre Linie öffnen und die, die du gerade nicht brauchst, ausblenden.',
  'help.guide.tour-map-lines.tip.3':
    '„Aus der Route nehmen“ im Menü der Tourzeile im Tagesplan sorgt dafür, dass die Route des Tages nicht mehr bis zu Start und Ziel der Tour führt; „Wieder in die Route aufnehmen“ verbindet sie wieder.',
  'help.guide.car-stops.step.5':
    'Die Reihenfolge der Stopps ergibt die Route. Mit „Nach oben“ und „Nach unten“ links an einem Stopp änderst du sie, „Stopp entfernen“, das Kreuz rechts, nimmt ihn heraus.',
  'help.guide.transport-details.step.3':
    'Die Kacheln darunter zeigen Abfahrt und Ankunft mit Bahnhöfen oder Flughäfen, dann Gleis und Sitzplatz, falls angegeben. Hat eine Fahrt Zwischenhalte, stehen sie unter „Route“; ist sie abschnittsweise gebucht, steht der Code jedes Abschnitts unter „Codes pro Abschnitt“. Danach folgen „Reisende“, „Notizen“, „Kosten“ und „Dateien“; „In Dateien zeigen“ öffnet das Ticket im Tab „Dateien“.',
  'help.guide.export-transports-csv.title': 'Die Transporte als Tabelle exportieren',
  'help.guide.group-sort-bookings.step.4':
    'Klick auf die Überschrift eines Abschnitts, um ihn zuzuklappen. Die Zahl daneben zeigt, wie viele Buchungen darin sind; ein zweiter Klick klappt ihn wieder auf.',
  'help.guide.booking-on-map.goal': 'Von einer Buchung zu ihrem Ort im Plan und auf der Karte springen.',
  'help.guide.export-bookings-csv.tip.2':
    'Die Spalten sind durch Semikolons getrennt, und Excel zeigt Akzente in der Datei korrekt an.',
  'help.guide.arrange-packing-list.tip.2':
    'TREK merkt sich „A bis Z“ in diesem Browser, die Liste ist also auch beim nächsten Mal sortiert. Das ändert nur deine Ansicht, nie die Reihenfolge, die die anderen sehen.',
  'help.guide.count-packed-pieces.step.4':
    'Sobald der Zähler die Menge erreicht, hakt sich der Eintrag selbst ab und gilt als gepackt.',
  'help.guide.expense-receipts.result':
    'Der Beleg bleibt bei der Ausgabe: Der Chip in ihrer Zeile öffnet ihn, und die Datei liegt außerdem in den Dateien der Reise.',
  'help.guide.files-sync-settings.step.4':
    'Wähl unter „Wenn ein Dokument gelöscht wird“, was mit der Kopie auf der anderen Seite passiert. „Beide Kopien behalten“ lässt die Kopie im Speicher, wo sie ist. „In den Papierkorb verschieben“ schiebt sie in den Papierkorb des Speichers, sobald das Dokument in TREK gelöscht wird.',
  'help.ctx.trip-collab.bullet.7':
    'Alles hier braucht eine Verbindung. Offline werden Nachrichten, Notizen, Links, Umfragen und Stimmen nicht gespeichert, und TREK meldet „Das braucht eine Verbindung. Versuche es erneut, sobald TREK wieder online ist.“ Mitglieder, die Collab nicht bearbeiten dürfen, können alles lesen, sehen aber weder „Neue Notiz“ noch „Link hinzufügen“ noch „Neue Umfrage“, und das Nachrichtenfeld ist ausgegraut.',
  'help.guide.manage-notes.step.4':
    '„Bearbeiten“ öffnet den Notizdialog mit allen bisherigen Angaben. Ändere, was nötig ist, hier eine weitere Zeile unter „Inhalt“, und klick auf „Speichern“.',
  'help.guide.note-categories.step.2':
    'Tipp unten einen Namen in das Feld „Neue Kategorie …“ und drück Enter oder klick auf das Plus daneben. Die neue Kategorie bekommt die nächste Farbe und eine eigene Zeile.',
  'help.guide.note-categories.tip.3':
    'Auf einer Karte zeigt nur der farbige Punkt im Kopf die Kategorie. Zeig auf den Punkt, um ihren Namen zu sehen.',
  'help.guide.roadtrip-reorder.step.1':
    'Zieh einen Halt an seiner Zeile auf einen anderen Halt desselben Tages. Er nimmt dessen Platz ein, und die Route des Tages wird in der neuen Reihenfolge neu berechnet.',
  'help.guide.roadtrip-overnight.step.5':
    'Klick auf „Hinzufügen“. Die Übernachtung wird von diesem Tag bis zum nächsten gebucht, und der Ort kommt als Übernachtung dieses Tages in die Fahrt.',
  'help.guide.roadtrip-stop-fill.step.3':
    'Soll für den Stopp wieder deine eigene Einstellung gelten, öffne das Badge erneut und klick auf „Meinen Standard nehmen“.',
  'help.guide.roadtrip-bookings.step.3':
    'Der Chip „Check-in“ oder „Einstieg“ zeigt, bis wann dich die Fahrt zum Terminal bringen muss: Die Abfahrt wird um diese Zeit vor die Fahrplanzeit gelegt.',
  'help.guide.roadtrip-google-import.title': 'Eine Route aus Google Maps importieren',
  'help.guide.roadtrip-google-import.tip.2':
    'Der Link muss mindestens zwei und höchstens 30 Stopps enthalten, die TREK verorten kann.',
  'help.guide.roadtrip-hazards.tip.1':
    'Warnungen sind keine Straßensperrungen: Die Route ändert sich deswegen nie, und es sind aktuelle Hinweise, keine Vorhersage für deinen Reisezeitraum.',
  'help.ctx.trip-tours.bullet.4':
    'Zeigst du auf eine Zeile, erscheinen ihr Auge („Auf der Karte ausblenden“) und ihr rundes + („Zum Tag hinzufügen“). Zieh eine Zeile auf einen Tag in der linken Spalte, um sie dort einzuplanen, oder klick darauf, um die Detailkarte der Tour über der Karte zu öffnen.',
  'help.guide.tour-show-list.step.4':
    'Die Karte zeigt die Kennzahlen der Tour und unter „Reisetage“ die Tage, an denen sie eingeplant ist. Um die Route selbst zu ändern, öffne den Tab „Touren“ und klick unter „Touren dieser Reise“ auf die Tour.',
  'help.guide.tour-add-to-day.step.1':
    'Zeig in der Liste auf die Tour und klick auf das runde + rechts in ihrer Zeile („Zum Tag hinzufügen“).',
  'help.guide.tour-add-to-day.tip.4':
    'Ist ein Tag geöffnet (klick dazu auf seine Kopfzeile), bietet die Detailkarte der Tour auch „Zum Tag hinzufügen“ für diesen Tag an. Mit dem Rückgängig-Pfeil über den Tagen machst du die Zuweisung rückgängig.',
  'help.guide.tour-day-times.tip.1': 'Eine selbst eingetragene Endzeit hat Vorrang vor der berechneten.',
  'help.guide.tour-remove-from-day.step.2':
    'Die Tour bleibt rechts in der Liste. Ihr Badge „Tag“ ist verschwunden, und der Filter zählt sie wieder unter „Ungeplant“.',
  'help.guide.tour-filter-list.step.2':
    'Wähl unter „Status“ „Ungeplant“ für Touren, die noch an keinem Tag liegen, oder „Geplant“ für die, die schon eingeplant sind. Jede Zeile zeigt, wie viele Touren dann übrig bleiben.',
  'help.guide.tour-hide-on-map.goal':
    'Touren, die du gerade nicht brauchst, von der Karte ausblenden, ohne sie für andere zu ändern.',
  'help.guide.tour-import-plan-tab.goal': 'Einen GPX- oder KML-Track als Tour importieren, während du die Tage planst.',
  'help.ctx.trip-tour-detail.summary':
    'Die Detailkarte, die sich über der Karte öffnet, wenn du im Tab „Planung“ eine Tour wählst: ihre Tage, Kennzahlen und Höhenprofil, ihre Herkunft und die Buttons, mit denen du sie aufs Handy schickst, kopierst, in einer Sammlung ablegst oder mit der Packliste verknüpfst.',
  'help.guide.tour-detail-read.step.1':
    'Wechsle oben in der rechten Spalte von „Orte“ zu „Touren“ und klick auf eine Tour. Ihre Detailkarte öffnet sich über der Karte. Auch ihre Zeile in einem Tag oder ihre Linie auf der Karte öffnet diese Detailkarte.',
  'help.guide.tour-detail-read.tip.2':
    'Eine Paddeltour zeigt keine Höhen und kein Profil: Ihre Punkte liegen an den Ufern, die Höhenangaben wären also nicht aussagekräftig.',
  'help.guide.tour-rename-colour.step.2':
    'Tipp den neuen Namen ein und klick auf den runden Haken oder drück Enter. Mit Escape bleibt der alte Name.',
  'help.guide.tour-take-along.step.1':
    'Öffne die Detailkarte der Tour. „Navigation“ unten öffnet den Startpunkt der Tour in einer Karten-App; gibt es mehrere Apps, wählst du zuerst eine aus. Die Navigation führt dich zum Start, nicht die Route entlang.',
  'help.guide.tour-copy-keep.title': 'Eine Tour kopieren oder in einer Sammlung ablegen',
  'help.guide.tour-copy-keep.tip.3':
    'Im Tab „Touren“ macht das Lesezeichen oben in der linken Spalte dasselbe für die geöffnete Tour. Hat sie ungespeicherte Änderungen, wirst du zuerst gebeten, die Tour zu speichern.',
  'help.guide.tour-packing-link.step.4':
    'Die Karte zeigt jetzt die Liste, wie viele ihrer Einträge gepackt sind, einen Fortschrittsbalken und die ersten Einträge. Gepackte sind durchgestrichen.',
  'help.guide.tour-files.step.1':
    'Öffne die Detailkarte der Tour und scroll ganz nach unten zu „Dateien“. Klick oben im Abschnitt auf „Hochladen“ und wähl eine oder mehrere Dateien.',
  'help.guide.tour-activity-link.step.1':
    'Öffne die Detailkarte der geplanten Tour und scroll zu „Ist-Track“. Klick auf „Ist-Track hinzufügen“.',
  'help.guide.tour-activity-link.result':
    'Der Track ist mit der Tour verknüpft, und die Karte zeigt Plan und tatsächlichen Verlauf nebeneinander.',
  'help.guide.tour-activity-compare.tip.2':
    'Für die Touraktivitäten im Atlas zählt ein verknüpfter Track statt der geplanten Werte.',
  'help.guide.tour-origin-check.tip.2':
    'Bei einer Tour aus wanderer steht neben der Quelle ein Pfeil, „In wanderer öffnen“, und oben im Abschnitt „Quelle prüfen“. Die Prüfung fragt bei wanderer nach, ob sich der Trail seit dem Import geändert hat. „Als neuen Snapshot importieren“ legt die neue Version dann neben diese Tour, die ihre Tage und Notizen behält.',
  'help.ctx.trip-tour-planner.bullet.4':
    'Solange „Punkt hinzufügen“ aktiv ist („Punkte setzen“ im Chip auf der Karte), setzt ein Klick auf die Karte einen Punkt. Zieh einen Pin, um ihn zu verschieben, klick auf die gezeichnete Route, um dort einen Formpunkt einzufügen, und wähl mit „Reise-Orte“ einen Ort der Reise.',
  'help.guide.tour-open-workspace.step.4':
    'Das Plus oben in der rechten Leiste, „Tour hinzufügen“, bietet „GPX oder KML importieren“, „Walk aus Google Maps importieren“ und „Tour aus anderer Reise übernehmen“. Ist eine Tour geöffnet, gibt es dort auch „Neue Tour planen“.',
  'help.guide.tour-draw-route.title': 'Eine neue Tour zeichnen',
  'help.guide.tour-draw-route.tip.1':
    'Solange „Punkte setzen“ aktiv ist, wird der Mauszeiger zum Fadenkreuz. Schalte es aus, um die Karte zu verschieben, ohne Punkte zu setzen. In 3D ist es anfangs aus, weil man dort zum Umsehen ständig zieht.',
  'help.guide.tour-type-profile.step.2':
    'Wähl den Typ in der Liste: „Wanderung“, „Stadt- und Spaziergang“, „Lauf“, „Radtour“, „Paddeltour“, „Ausritt“ oder „Ski & Winter“. Bei jedem steht, wofür er plant, und ein neuer Typ plant die Route neu.',
  'help.guide.tour-edit-points.step.1':
    'Zieh einen nummerierten Pin auf der Karte an die gewünschte Stelle. Die Route wird über den neuen Punkt neu geplant.',
  'help.guide.tour-edit-points.result':
    'Die Punkte liegen dort und in der Reihenfolge, wie du es willst, und die Route ist neu geplant.',
  'help.guide.tour-shaping-points.tip.2': 'Ein Formpunkt kann keine Etappe einer Mehrtagestour beenden.',
  'help.guide.tour-loop-reverse.tip.1':
    'Sobald die Tour eine Runde ist, zeigt „Zurück zum Start“ den Hinweis „Die Tour führt schon zum Start zurück“.',
  'help.guide.tour-leg-by-hand.step.3':
    'Soll wieder der Router übernehmen, öffne dasselbe Menü und wähl „Nächsten Abschnitt wieder routen“.',
  'help.guide.tour-trip-places.step.2':
    'Nutz „Orte der Reise durchsuchen“ oder schau unter „Nahe der Tour“: Dort stehen die Orte im Umkreis von zwei Kilometern um die Route, die nächsten zuerst, jeweils mit Entfernung.',
  'help.guide.tour-details-times.goal':
    'Der Tour einen Namen, eine Beschreibung und einen Link geben und Pausen in ihre Zeit einrechnen.',
  'help.guide.tour-details-times.result':
    'Die Tour hat ihren Namen, ihre Notizen und die Zeit, die du dafür einplanst.',
  'help.guide.tour-save.tip.2':
    '„Zurück zu den Touren“ oben in der Leiste schließt den Editor und fragt vorher nach, wenn es ungespeicherte Änderungen gibt.',
  'help.guide.tour-edit-saved.step.4':
    'Klick auf „Zurück zu den Touren“, um ihn zu schließen. Bei ungespeicherten Änderungen fragt er zuerst „Ungespeicherte Änderungen an der Tour verwerfen?“',
  'help.guide.tour-summary-profile.step.2':
    'Der Info-Punkt neben der geschätzten Zeit erklärt, wie sie berechnet wird.',
  'help.guide.tour-list-manage.goal':
    'Sehen, was die Touren der Reise zusammen ergeben, eine Tour auf einen Tag legen und die Liste auf das Nötige eingrenzen.',
  'help.guide.tour-list-manage.tip.3':
    'Der Papierkorb in einer Zeile löscht die Tour. Der Tab „Planung“ listet dieselben Touren, wenn seine rechte Spalte auf „Touren“ steht.',
  'help.guide.tour-delete.tip.3':
    'Touren löschst du hier, im Tab „Touren“. Den Papierkorb sehen nur Reisende, die die Orte der Reise bearbeiten dürfen.',
  'help.guide.tour-saved-elsewhere.tip.1':
    '„Als neue Tour speichern“ benennt deine Kopie nach der Tour und hängt „(my version)“ an.',
  'help.ctx.trip-tour-import.bullet.4':
    '„Bearbeitbare Version“ macht aus einem Import eine Tour mit verschiebbaren Wegpunkten. „Import ersetzen“ behält den aufgezeichneten Track, und über die Karte „Aufgezeichnete Strecke“ im Editor kommst du zu ihm zurück.',
  'help.guide.tour-import-gpx.step.5':
    'Klick auf „1 Tour importieren“ (oder „3 Touren importieren“ bei einer Datei mit drei Tracks).',
  'help.guide.tour-view-import.goal':
    'Verlauf, Kennzahlen und Höhen einer importierten Tour so sehen, wie sie importiert wurde.',
  'help.guide.tour-plan-from-import.title': 'Aus einem Import eine bearbeitbare Tour planen',
  'help.guide.tour-plan-from-import.tip.3':
    'Ein Paddel- oder Ski-Import wird nicht geroutet, sondern mit geraden Linien zwischen seinen Punkten verbunden.',
  'help.guide.tour-restore-recorded.tip.1':
    'Die Karte gibt es nur bei einer Tour, die mit „Import ersetzen“ neu geplant und gespeichert wurde.',
  'help.guide.tour-take-over.step.4':
    'Klick auf die Tour. Rechts siehst du ihre Linie, ihre Kennzahlen und die Reise, aus der sie stammt.',
  'help.guide.tour-import-wanderer.goal':
    'Einen Trail aus deiner eigenen wanderer-Instanz als Tour in die Reise holen.',
  'help.guide.tour-import-wanderer.tip.4': '„In wanderer öffnen“ öffnet den Trail auf deiner Instanz.',
  'help.ctx.trip-tour-map.bullet.5':
    'In 3D liegt die Route auf dem Gelände und ist nach ihrer Steigung eingefärbt, mit einer Legende, die die Steigungsstufen zusammenfasst, und einem Überflug vom Start bis zum Ziel.',
  'help.guide.tour-map-layers.tip.2':
    '„Wandern“ und „Fahrrad“ kommen von ehrenamtlich betriebenen Servern und stehen nur zur Verfügung, solange dein Admin sie erlaubt. Antwortet einer nicht mehr, zeigt sein Feld ein „!“, und du kannst auf eine andere Karte wechseln; deine Tour bleibt unverändert.',
  'help.guide.tour-along-search.step.5':
    'Die gefundenen Orte stehen mit ihrer Entfernung zur Route in der Liste und erscheinen in ihrer Farbe auf der Karte. Ein Stern markiert die bekanntesten, „In der Tour“ die, die schon ein Halt sind. Der Button heißt jetzt „Erneut suchen“.',
  'help.guide.tour-along-add-stop.step.2':
    '„Wo es hinkommt“ schlägt den Abschnitt vor, in den der Ort am besten passt. Klick darauf, um stattdessen selbst zu wählen, zwischen welchen zwei Halten er eingefügt wird, oder „Als neues Ziel“. Die Karte zeigt den neuen Weg gestrichelt, bevor sich etwas ändert.',
  'help.guide.tour-3d-terrain.goal': 'Die Tour in der echten Landschaft ansehen, nach Steigung eingefärbt.',
  'help.guide.tour-3d-terrain.tip.2':
    'Die gewählte Karte kommt mit in die 3D-Ansicht, ebenso Klettersteige, Pisten und Seezeichen. Beim Bearbeiten einer Tour kannst du ihre Punkte auf dem Gelände verschieben, und ist „Punkte setzen“ aktiv, fügt ein Klick einen Punkt hinzu.',
  'help.guide.tour-3d-flyover.result':
    'Du hast die Tour vom Start bis zum Ziel aus der Luft gesehen, in der gewählten Geschwindigkeit.',
  'help.guide.tour-map-overlays.step.3':
    'Die Legende erklärt die Farben: die Abfahrten von „Anfänger“ bis Freeride, „Loipen“, „Winter- und Schneeschuhwege“, „Rodelbahnen“ sowie „Lifte und Bahnen“. „Ganze Legende bei OpenSnowMap“ zeigt alle Symbole. Mit Escape schließt du die Legende.',
  'help.ctx.trip-tour-stages.bullet.1':
    'Unter „Tage“ im Editor machst du die geöffnete Tour zur „Tagestour“ oder „Mehrtagestour“. Wechselst du zurück zur Tagestour, entfallen nach einer Bestätigung alle Etappenenden; die Route bleibt unverändert.',
  'help.guide.tour-multi-day.step.2':
    'Klick unter „Tage“ auf „Mehrtagestour“. Ein Hinweis zeigt, wo das erste Etappenende liegt.',
  'help.guide.tour-multi-day.tip.4':
    'Etappen werden erst gespeichert, wenn du auf „Speichern“ klickst. Fällt durch eine Änderung eine Etappe weg, die an einem Reisetag eingeplant ist, weist ein Hinweis darauf hin, dass sie beim Speichern von diesem Tag entfernt wird.',
  'help.guide.tour-stages-on-days.step.5':
    'Jede Etappe zeigt den Tag, an dem sie eingeplant ist. Klick auf den Tag, um die Etappe auf einen anderen zu legen, oder wähl „Ohne Tag“, um sie von ihrem Tag zu entfernen.',
  'help.ctx.trip-tour-hike.summary':
    'Eine Wanderung oder ein Lauf, geöffnet im Tab „Touren“: links der Editor, in der Mitte die Karte, rechts die Übersicht der Tour und die anderen Touren der Reise. Eine Wanderung bleibt innerhalb der Wegschwierigkeit, die du zulässt, ein Lauf wird nach deinem eigenen Tempo berechnet, und beide zeigen, was OpenStreetMap entlang der Strecke verzeichnet.',
  'help.guide.tour-hike-plan.goal':
    'Eine Wanderung anlegen, ihre Halte setzen, die höchste Wegschwierigkeit für die Route wählen und sie speichern.',
  'help.guide.tour-hike-plan.tip.1':
    'Eine neue Wanderung beginnt mit T2 (Bergwandern). Bei T3 erscheint eine Warnung, dass solche Wege ausgesetzt sein können und Trittsicherheit und Schwindelfreiheit erfordern.',
  'help.guide.tour-hike-trail-details.step.3':
    'Die Badges fassen es zusammen: wie viel der Route „Bekannt“ ist, der „Höchste bekannte“ Grad und, davon abgesetzt, die „Routing-Grenze“, mit der die Wanderung geplant wurde.',
  'help.guide.tour-hike-round.goal':
    'TREK Runden in der gewünschten Länge vorschlagen lassen, ausgehend von einem Halt einer Wanderung.',
  'help.guide.tour-hike-round.tip.2':
    'Möglich sind Längen von 1 bis 60 km; angeboten werden Runden, die höchstens 20 % von deiner Wunschlänge abweichen.',
  'help.guide.tour-hike-compare-ways.result':
    'Dieser eine Abschnitt folgt dem gewählten Weg, der Rest der Wanderung bleibt, wie er war. Unter „Weg übernommen“ unten auf der Karte findest du „Rückgängig“.',
  'help.guide.tour-ferrata-add.step.3':
    'Klick auf „In die Tour übernehmen“. Der Klettersteig wird am Ende der Route als eigener Abschnitt angehängt, mit einem Punkt an jedem Ende.',
  'help.guide.tour-run-plan.title': 'Einen Lauf in deinem eigenen Tempo planen',
  'help.guide.tour-run-plan.tip.1': 'Ohne Tempo lässt sich der Lauf nicht speichern.',
  'help.guide.tour-run-ways.step.3':
    'Klick auf „Belag“ und dann in der Liste auf einen Belag, damit nur diese Abschnitte auf der Karte erscheinen.',
  'help.ctx.trip-tour-walk.bullet.3':
    'Liegt der Spaziergang an einem Tag mit Startzeit, nennt „Zeiten für“ oben unter „Wegpunkte“ diesen Tag, und bei jedem Halt stehen Ankunft, Aufenthalt und was die Öffnungszeiten dazu sagen.',
  'help.guide.tour-walk-plan.step.4':
    'Gib dem Halt eine „Bezeichnung“ und unter „Aufenthalt in Minuten“ eine Dauer. Lass das Feld leer, solange du sie noch nicht weißt, und trag 0 ein für einen Punkt, an dem du nur vorbeikommst.',
  'help.guide.tour-walk-sights.goal':
    'Ein Thema wählen, entlang des Spaziergangs suchen und einen Ort als Halt übernehmen.',
  'help.guide.tour-walk-sights.tip.3':
    'Öffnungszeiten und Webseiten stammen aus der Quelle, meist OpenStreetMap. Prüf sie, bevor du losgehst.',
  'help.guide.tour-walk-day-times.tip.1':
    'Ohne Startzeit steht in der Zeile: „Gib dem Spaziergang an diesem Tag eine Zeit, um Ankünfte und Öffnungszeiten zu sehen.“',
  'help.guide.tour-walk-google-import.step.2': 'Füg den Link unter „Link zur Fußroute“ ein und klick auf „Link lesen“.',
  'help.guide.tour-walk-check-off.goal':
    'Halte am Tag selbst als besucht oder übersprungen markieren und sehen, wie viel Weg noch vor dir liegt.',
  'help.guide.tour-walk-check-off.result':
    'Besuchte Halte sind abgehakt, übersprungene durchgestrichen, und die Restzeit zählt nur, was noch vor dir liegt.',
  'help.guide.tour-bike-profile.goal':
    'Eine Radtour anlegen und von TREK für Touring, Rennrad, Gravel oder MTB routen lassen.',
  'help.guide.tour-bike-profile.tip.1':
    'Wechselst du das Profil später, wird die ganze Route für das neue Profil neu geplant.',
  'help.guide.tour-bike-surfaces.step.2':
    'Das Badge in der Kopfzeile der Karte zeigt, welcher Anteil der Route nachweislich unbefestigt ist.',
  'help.guide.tour-bike-mtb-grades.title': 'Wegschwierigkeiten einer Mountainbike-Tour prüfen',
  'help.guide.tour-bike-mtb-grades.tip.3':
    'Konnten die Schwierigkeitsgrade nicht gelesen werden, zeigt die Karte einen Hinweis. Klick auf „Erneut versuchen“.',
  'help.ctx.trip-tour-ski.bullet.5':
    'Solange eine Tour vom Typ „Ski & Winter“ geöffnet ist, zeigt die Karte die Pisten von OpenSnowMap, mit „Pistenlegende“ neben ihrem Schalter. Das alles sind Kartendaten: Nichts davon sagt, ob eine Piste oder ein Lift geöffnet ist, wie der Schnee ist oder wie es um Lawinen steht.',
  'help.guide.tour-ski-plan.step.6': 'Gib der Tour unter „Name der Tour“ einen Namen und klick auf „Speichern“.',
  'help.guide.tour-ski-options.step.1':
    'In einer Tour vom Typ „Ski & Winter“ stehen die Router-Optionen unter „Disziplin“. Du siehst nur die, die deine Disziplin nutzt: „Langlauf“ hat zum Beispiel keine Option „Schwerste Pisten“.',
  'help.guide.tour-ski-options.result':
    'Die Tour wird innerhalb deiner Grenzen neu geplant, und die Karte „Pistenroute“ listet die schwereren Pisten auf, die sie meidet.',
  'help.guide.tour-ski-fix-leg.tip.3':
    'Offline werden die Abschnitte vorerst als gerade Linien gezeichnet. Eine graue Zeile zu Sommerwegen ist ein Hinweis, kein Fehler.',
  'help.guide.tour-ski-summary.tip.1':
    '„Gemieden“ listet die schwereren Pisten, die der Router wegen deiner Grenze unter „Schwerste Pisten“ umgangen hat.',
  'help.guide.tour-ski-pistes-layer.step.2':
    'Klick auf „Pistenlegende“, den Button mit vier farbigen Punkten neben dem Schalter.',
  'help.guide.tour-ski-import.step.1':
    'Klick im Tab „Touren“ auf „Tour hinzufügen“ (das Plus über „Touren dieser Reise“), wähl „GPX oder KML importieren“ und dann die Datei.',
  'help.guide.tour-ski-import.tip.3':
    'Du kannst GPX-, KML- oder KMZ-Dateien auch einfach irgendwo auf den Tab „Touren“ ziehen; dann öffnet sich dieselbe Vorschau.',
  'help.ctx.trip-tour-paddle.bullet.5':
    '„Wind“ zeigt die Vorhersage am Startpunkt der Tour für den Tag, an dem sie geplant ist. „Prüfliste“ zeigt die Hindernisse auf der gespeicherten Route und was du jeweils entschieden hast.',
  'help.guide.tour-paddle-setup.step.5':
    'Auf einem See bestimmt „Über Seen“ die Linie: „Direkt“ ist am kürzesten, „Ufernah“ bleibt für windige Tage dicht am Ufer.',
  'help.guide.tour-paddle-water-route.title': 'Die Abschnitte auf dem Wasser planen',
  'help.guide.tour-paddle-water-route.tip.2':
    'Wo der Router um ein Wehr herumträgt oder durch eine Schleuse fährt, setzt TREK dort selbst einen Punkt, markiert als „Erkannt“. Verschiebst oder änderst du ihn, wird er zu deinem eigenen.',
  'help.guide.tour-paddle-portage.step.3':
    'Unter dem Punkt erscheint die Karte „Umtragen“ mit Länge und zusätzlichen Minuten. Klick darauf, um sie zu öffnen.',
  'help.guide.tour-paddle-lock.goal': 'Eine Schleuse in die Tour aufnehmen und Wartezeit und Durchfahrt einrechnen.',
  'help.guide.tour-paddle-lock.result':
    'Die Schleuse ist mit ihren Minuten in der Tour, und die „Zeitschätzung“ rechnet sie ein.',
  'help.guide.tour-paddle-time.tip.1':
    'TREK rechnet anfangs mit 4 km/h auf dem Wasser, 2 km/h beim Tragen und 10 Minuten pro Umtragestelle. Das sind Startwerte zum Anpassen, keine Messwerte.',
  'help.guide.tour-paddle-wind.step.3':
    'Die Balken zeigen die Stunden des Tages, die Böen hinter dem Mittelwert. Zeig auf einen Balken, um Werte und Richtung für diese Stunde zu sehen.',
  'help.guide.tour-paddle-checklist.goal':
    'Sehen, was über Wehre, Schleusen und Zugangsregeln auf einer gespeicherten Route bekannt ist, und für jede Stelle entscheiden, was du tust.',
  'help.guide.tour-paddle-checklist.tip.3':
    'Ein Eintrag mit „Erneut prüfen“ wurde entschieden, bevor sich die Route oder die Daten geändert haben. Entscheide ihn neu oder wähl „Entscheidung behalten“ oder „Entscheidung entfernen“. Entscheidungen, die nicht mehr gelten, stehen unter „Frühere Entscheidungen“.',
  'help.guide.tour-paddle-track-marks.step.3': 'Klick auf „1 Tour importieren“.',
  'help.guide.tour-paddle-track-marks.result':
    'Der aufgezeichnete Track enthält seine Umtragestellen und Schleusen, und seine „Zeitschätzung“ rechnet sie ein.',
  'help.guide.tour-horse-plan.title': 'Einen Ausritt entlang von Reitrouten planen',
  'help.guide.tour-horse-plan.step.7':
    'Gib dem Ausritt unter „Name der Tour“ einen Namen und klick dann unten in der linken Spalte auf „Speichern“.',
  'help.guide.tour-horse-gap.goal': 'Mit einem Abschnitt weitermachen, der nicht am Ende deines Ausritts beginnt.',
  'help.guide.tour-horse-gap.tip.3':
    'Beginnt ein Abschnitt höchstens 25 m vom Ende deines Ausritts entfernt, schließt er direkt daran an, und unter „Anschluss an deinen Ausritt“ steht „Schließt ans Ende deines Ausritts an“.',
  'help.guide.tour-horse-recorded.tip.1':
    'Die Linie bleibt genau, wie die Datei sie aufgezeichnet hat. Nichts wird neu geroutet, und ein aufgezeichneter Ausritt hat keine bearbeitbare Version.',
  'help.guide.dateless-trip.result':
    'Die Karte zeigt „Idee“ und „Freie Planung“, und die Reise hat so viele leere Tage, wie du angegeben hast.',
  'help.guide.trip-reminder.title': 'Vor einer Reise erinnert werden',
  'help.guide.upcoming-reservations.tip.1':
    'Ein Hotelaufenthalt erscheint zweimal: einmal zum Check-in und einmal zum Check-out.',
  'help.guide.half-company-holiday.result':
    'Der Betrieb hat einen halben Tag frei, und ein Urlaubstag an diesem Tag zählt nur als halber Tag.',
  'help.guide.edit-holiday-calendar.title': 'Ferienkalender ändern oder entfernen',
  'help.guide.answer-fusion-request.result':
    'Nach „Annehmen & Fusionieren“ stehen beide Pläne in einem Raster, jede Person in ihrer eigenen Farbe.',
  'help.guide.log-for-partner.result':
    'Die Tage erscheinen in der Farbe der anderen Person und werden von deren Urlaubsanspruch abgezogen, nicht von deinem.',
  'help.guide.dissolve-fusion.tip.1':
    'Mit Abbrechen in diesem Fenster bleibt der Plan, wie er ist; deine Einträge bleiben so oder so erhalten.',
  'help.guide.country-places.tip.1':
    'Steht ein Ort unter dem falschen Land, hat er meist eine falsche Adresse oder falsche Koordinaten. Öffne von hier aus seine Reise und korrigiere den Ort dort.',
  'help.guide.tour-activity-stats.title': 'Sehen, was du auf deinen Touren gemacht hast',
  'help.guide.tour-activity-stats.result':
    'Die Summen im Dialog und im Tab „Touren“ enthalten die ausgelassene Tour nicht mehr. Ihre Route, ihre Tage und die Reise bleiben unverändert.',
  'help.guide.move-to-list.tip.2':
    'Beim Verschieben verschwinden die Orte aus der Liste, deshalb sehen nur der Besitzer der Liste oder ein Admin „In Liste verschieben“. „In Liste duplizieren“ geht aus jeder Liste, die du öffnen kannst.',
  'help.guide.accept-list-invite.step.2':
    'Klicke auf Annehmen, um beizutreten, oder auf Ablehnen, wenn du nicht möchtest.',
  'help.guide.tour-collection-add-to-trip.tip.2':
    'Eine Tour, die ohne Linie behalten wurde, muss ihre Wegpunkte mitnehmen; der Dialog weist darauf hin und wählt das für dich aus.',
  'help.guide.tour-collection-manage.tip.1':
    'Wenn du eine Tour aus der Liste entfernst, bleiben die Touren, die du daraus schon in deinen Reisen angelegt hast, unberührt.',
  'help.guide.entry-draft.tip.2':
    'Ein aus Dawarich übernommener Tag kommt als Entwürfe an. Achte also vor dem Teilen auf das Badge.',
  'help.guide.journey-map-layers.result':
    'Die Karte zeigt nur die Ebenen, die du sehen willst, und jeden Pin, jeden Punkt und jede Linie findest du in der Legende erklärt.',
  'help.guide.journey-keep-route.result':
    'Die Tageskopfzeile zeigt die Distanz, und die Strecke erscheint für alle in der Journey als durchgezogene Linie auf der Kartenebene „Aufgezeichnet“. Ein geteilter Link zeigt sie nur, wenn „Aufgezeichnete Strecken“ eingeschaltet ist.',
  'help.guide.journey-day-stays.result':
    'Die Aufenthalte, über die du entschieden hast, verschwinden aus der Zeile; deine Einträge stehen wie alle anderen an ihrem Tag, und du kannst wie gewohnt Fotos und Text hinzufügen.',
  'help.guide.journey-take-over-day.tip.2':
    'Entwürfe erscheinen nicht in geteilten Links. Füge Fotos und Text hinzu und schalte dann in jedem Eintrag „Entwurf“ aus.',
  'help.guide.journey-auto-prepare.tip.2':
    'Ein Punkt am Listen-Button eines Tages bedeutet, dass der Tag noch nicht fertig ist; der Tooltip verrät, warum.',
  'help.ctx.settings-plugins.bullet.3':
    '„Plugin-Aktivität“ ganz unten listet jede Aktion, die ein Plugin in deinem Namen ausgeführt hat, die neueste zuerst; mit „Aktualisieren“ lädst du die Liste neu.',
  'help.guide.language-region.tip.3':
    '„Woche beginnt am“ legt die erste Spalte jeder Datumsauswahl fest; Vacay hat dafür eine eigene Einstellung.',
  'help.guide.web-push-device.tip.2':
    'Füge TREK auf iPhone und iPad zuerst zum Home-Bildschirm hinzu und öffne es von dort.',
  'help.guide.connect-airtrail.step.3':
    'Klicke auf Speichern und dann auf „Verbindung testen“. TREK zeigt an, wie viele Flüge gefunden wurden, und das Badge wechselt zu „Verbunden“.',
  'help.guide.connect-dawarich.step.3':
    'Klicke auf Speichern und dann auf „Verbindung testen“: Der Test zählt die Aufenthalte der letzten 30 Tage. Sobald die Verbindung steht, prüft „Jetzt nachsehen“ sofort, und „Trennen“ rechts beendet die Verbindung.',
  'help.guide.tour-connect-wanderer.step.3':
    'Klicke auf Speichern und dann auf „Verbindung testen“. TREK zeigt an, wie viele deiner Trails du importieren kannst, und das Badge wechselt zu „Verbunden“.',
  'help.guide.tour-wanderer-watch.step.2':
    'Höchstens einmal am Tag liest TREK die Kurzinfo jedes importierten Trails, und in der Zeile steht, wann zuletzt geprüft wurde. Wenn sich ein Trail geändert haben könnte, bekommst du eine Benachrichtigung, und „Hinweise“ zählt ihn mit: Klicke auf „Hinweise“, um jede Tour als „Möglicherweise geändert“, „Geändert“ oder „Nicht prüfbar“ zu sehen, und öffne sie von dort.',
  'help.guide.plugin-settings.goal':
    'Einem Plugin eigene Schlüssel und Einstellungen geben und sehen, was es in deinem Namen getan hat.',
  'help.guide.own-routing-engine.result': 'Routen werden in allen Reisen auf deinen Servern berechnet.',
  'help.guide.admin-passkeys.title': 'Anmeldung per Passkey anbieten',
  'help.guide.rotate-jwt-secret.tip.1': 'Auch du wirst abgemeldet, melde dich also direkt danach wieder an.',
  'help.guide.notification-defaults.title': 'Benachrichtigungs-Standards für Benutzer festlegen',
  'help.ctx.notifications.title': 'Benachrichtigungen',
  'help.guide.read-notifications.goal':
    'Sehen, was in deinen Reisen passiert ist, während du woanders warst, und direkt dorthin springen.',
  'help.guide.filter-notifications.goal':
    'Alle Benachrichtigungen von TREK durchgehen oder nur die, die du noch nicht gelesen hast.',
  'help.guide.mark-notifications-read.step.1':
    'Klicke auf „Als gelesen markieren“, den Doppelhaken neben der Uhrzeit einer Benachrichtigung, um nur diese eine zu markieren.',
  'help.guide.delete-notifications.step.2':
    '„Alle löschen“ oben leert die ganze Liste auf einmal, nachdem du in einem Fenster bestätigt hast, dass du sicher bist.',
  'help.guide.notification-settings.step.3':
    'Klicke in der Seitenleiste der Einstellungen auf „Benachrichtigungen“. Die erste Karte dort hat eine Zeile pro Ereignis, und die Spalte „In-App“ bestimmt, was in der Glocke erscheint.',
  'help.guide.link-journal.result':
    'In der Tab-Leiste der Reise erscheint der Tab „Tagebuch“, und alle, denen du „Lesen“ oder „Bearbeiten“ gegeben hast, öffnen das Tagebuch direkt dort, live.',
  'help.guide.create-place.tip.4':
    'Auch ein aus Google Maps kopierter Link funktioniert in der Suche: Füge ihn ein, drück Enter, und TREK liest den Ort daraus aus. Sobald das Formular eine Position hat, listet „Orte in der Nähe dieser Markierung“, das Fadenkreuz neben der Suche, auf, was in der Umgebung liegt.',
  'help.guide.dawarich-stays.step.2':
    'Die Aufenthalte sind nach Tag gruppiert, jeweils mit Ankunfts- und Abfahrtszeit; ein Messuhr-Symbol markiert Aufenthalte, bei denen Dawarich unsicher war. Klicke auf „Als Ort hinzufügen“, die Stecknadel neben einem Aufenthalt.',
  'help.guide.leave-stop-off-route.step.3':
    'Um ihn wieder in die Route aufzunehmen, öffne dasselbe Menü und wähle „Wieder in die Route aufnehmen“.',
  'help.guide.move-booking-day.tip.1':
    'Die blassen Zeilen an den Tagen zwischen Beginn und Ende einer mehrtägigen Buchung lassen sich nicht ziehen, ebenso wenig ein einzelner Abschnitt eines Flugs mit Zwischenlandungen.',
  'help.guide.place-image-from-file.step.2':
    'Klicke auf das runde Bild im Kopfbereich. Da der Ort Fotos hat, fragt dich ein kleines Fenster, woher das Bild kommen soll.',
  'help.guide.place-own-hours.goal':
    'Selbst geprüfte Öffnungszeiten auf die Karte setzen, wenn die abgerufenen falsch sind oder fehlen.',
  'help.guide.place-own-hours.tip.2':
    'Telefonnummer und E-Mail erscheinen als Buttons im Kopfbereich der Karte: Ein Klick übergibt sie an deine Telefon- oder Mail-App.',
  'help.guide.edit-accommodation.tip.3':
    'Ist in den Einstellungen unter „Allgemein“ die Option „Buchungscodes verbergen“ an, bleibt die Bestätigungsnummer unscharf. Fahr mit der Maus darüber oder klicke darauf, um sie zu lesen.',
  'help.guide.confirm-stay-booking.tip.1': 'Klickst du noch einmal auf das Badge, ist die Buchung wieder „Ausstehend“.',
  'help.guide.map-markers.tip.4':
    'Ist „Kompakte Markierungen für ungeplante Orte“ eingeschaltet (Einstellungen > Allgemein, unter „Reise & Karte“), erscheinen Orte, die noch keinem Tag zugeordnet sind, als kleine Punkte ohne Foto und Bewertung. Der Ort, den du auswählst, wird immer vollständig angezeigt.',
  'help.guide.tour-map-lines.step.1':
    'Jede Tour der Reise wird als Linie in ihrer Farbe auf der Karte eingezeichnet, mit einem Pin am Startpunkt. Hast du für die Tour eine Farbe gewählt, gilt diese; sonst übernimmt die Linie die Farbe ihrer Kategorie.',
  'help.guide.car-stops.step.6': 'Klicke auf Hinzufügen.',
  'help.guide.transport-details.step.4':
    'Klicke auf den Titel, um die Fahrt umzubenennen, ohne das Formular zu öffnen. „Umbenennen“ öffnet sich mit dem aktuellen Namen: Tipp den neuen ein und klicke auf Speichern.',
  'help.guide.export-transports-csv.goal':
    'Die Fahrten der Reise als CSV-Datei aus TREK exportieren, für eine Tabellenkalkulation, ein Reisebüro oder zum Ausdrucken.',
  'help.guide.group-sort-bookings.result':
    'Die Buchungen stehen in den Abschnitten und in der Reihenfolge, die du gewählt hast, und dieser Browser merkt sich die Auswahl für den nächsten Besuch.',
  'help.guide.booking-on-map.step.1':
    'Klicke auf die Karte einer Buchung mit Ort, also mit einer Verknüpfung unter „Ort / Aktivität“ oder, bei einem Aufenthalt, unter „Unterkunft“. Die Details öffnen sich.',
  'help.guide.export-bookings-csv.title': 'Buchungen als Tabelle exportieren',
  'help.guide.export-bookings-csv.tip.3':
    'Der Button erscheint, sobald der Tab eine Buchung enthält. Der Tab „Transporte“ exportiert seine Einträge auf dieselbe Weise.',
  'help.guide.arrange-packing-list.title': 'Packliste nach deinen Wünschen sortieren',
  'help.guide.count-packed-pieces.result':
    'Die Zeile zeigt, wie viele Stücke schon gepackt sind, und der Eintrag wird abgehakt, sobald das letzte drin ist.',
  'help.guide.expense-receipts.title': 'Beleg an eine Ausgabe anhängen',
  'help.guide.expense-receipts.tip.1':
    'Im Editor öffnet ein Klick auf den Namen einer aufgelisteten Datei dieselbe Vorschau. Esc schließt dann nur die Vorschau, nicht die Ausgabe.',
  'help.guide.files-sync-settings.step.5':
    '„Wenn beide Seiten geändert wurden“ legt fest, welche Kopie gilt, wenn ein Dokument an beiden Stellen bearbeitet wurde: „Mich fragen“, „Die TREK-Kopie behalten“ oder „Die Kopie im Speicher behalten“. Mit „Automatisch abgleichen“ sucht TREK im Hintergrund nach Änderungen; ist es aus, steht auf der Karte „Pausiert“, und abgeglichen wird nur über „Jetzt abgleichen“. Jede Änderung hier wird sofort gespeichert.',
  'help.guide.manage-notes.step.5':
    '„Löschen“ fragt zuerst nach („Notiz löschen?“), denn die Notiz verschwindet für alle Mitglieder, und ihre Dateien werden mitgelöscht. Klicke zum Bestätigen auf „Löschen“.',
  'help.guide.note-categories.step.3':
    'Klicke auf den Namen einer Kategorie, um sie umzubenennen. Tipp den neuen Namen ein und drück Enter; mit Esc bleibt der alte.',
  'help.guide.roadtrip-reorder.step.2':
    'Um einen Stopp auf einen anderen Tag zu verschieben, zieh ihn auf einen Stopp in der Karte dieses Tages. Während du ziehst, erscheint ein Tag mit weniger als zwei Stopps als gestrichelte Karte am Ende der Leiste, und auch dort kannst du ablegen.',
  'help.guide.roadtrip-corridor.tip.4':
    'Wähle unter dem Filter einen Stopp des Tages oder „Halbwegs“ zwischen zwei Stopps, um nur zu behalten, was im Umkreis von 25, 50 oder 100 km um diesen Punkt liegt. Sind Ladestationen in der Liste, grenzt du sie mit „Alle Stecker“ und „Beliebige Leistung“ nach Stecker und Leistung ein.',
  'help.guide.roadtrip-overnight.result':
    'Der Ort ist auf der Fahrt als Übernachtung dieses Tages eingetragen, und der Aufenthalt ist in der Reise wie jeder andere gebucht.',
  'help.guide.roadtrip-stop-fill.result':
    'Am Stopp wird bis zu dem gewählten Wert getankt, und die Reichweite danach, samt einem eventuellen Band „Hier ist der Tank leer“, wird von dort aus berechnet.',
  'help.guide.roadtrip-bookings.step.4': 'Klicke auf die Karte, um die Buchung zu öffnen.',
  'help.guide.roadtrip-google-import.goal':
    'Eine in Google Maps geplante Route in Stopps an einem deiner Tage umwandeln.',
  'help.guide.roadtrip-google-import.tip.3':
    'Für den Import brauchst du eine Internetverbindung und die Berechtigung, Orte und Tage zu bearbeiten.',
  'help.guide.roadtrip-hazards.tip.2':
    'Der DWD deckt Deutschland ab, GDACS meldet Katastrophen weltweit. Ist eine Warnung nur als Punkt eingezeichnet, ist ihr betroffenes Gebiet unbekannt.',
  'help.ctx.trip-tours.bullet.5':
    'In der Tagesspalte erscheint eine Tour als Zeile wie ein Stopp. Mit einer Startzeit steht dort Start → Ende, wobei das Ende aus der Dauer der Tour berechnet wird, und „Weitere Optionen“ enthält „Bearbeiten“, „Vom Tag entfernen“, „Aus der Route nehmen“ und „In Sammlung speichern“.',
  'help.guide.tour-show-list.step.5': 'Klicke im selben Umschalter auf „Orte“, um wieder die Ortsliste zu sehen.',
  'help.guide.tour-add-to-day.step.2':
    'Wähle den Tag. Das Menü listet jeden Tag der Reise mit Datum und Titel; ein Tag, der die Tour schon enthält, ist ausgegraut.',
  'help.guide.tour-add-to-day.result':
    'Die Tour steht unter ihrem Tag, und ihre Linie gehört auf der Karte zu diesem Tag.',
  'help.guide.tour-day-times.tip.2':
    'Ein Tag mit einer Etappe einer Mehrtagestour bekommt kein berechnetes Ende, weil sich die Dauer der Tour auf die ganze Route bezieht.',
  'help.guide.tour-remove-from-day.step.3':
    'Oder klicke auf die Kopfzeile des Tages, um ihn zu öffnen, klicke in der Liste auf die Tour und dann unten auf ihrer Karte auf „Vom Tag entfernen“.',
  'help.guide.tour-filter-list.step.3':
    'Wenn die Liste verschiedene Touren enthält, kannst du sie mit „Quelle“ (TREK, GPX-Import, wanderer), „Routing-Grenze“ (T1 bis T6) und „Typ“ (Wanderung, Radtour und so weiter) weiter eingrenzen. Klicke noch einmal auf einen angehakten Wert, um ihn abzuwählen.',
  'help.guide.tour-hide-on-map.step.1':
    'Fahr in der Liste mit der Maus über eine Tour und klicke auf das Auge, das rechts in ihrer Zeile erscheint („Auf der Karte ausblenden“).',
  'help.guide.tour-import-plan-tab.step.1':
    'Klicke im Tab „Planung“ oben in der rechten Spalte im Umschalter auf „Touren“.',
  'help.ctx.trip-tour-detail.bullet.1':
    'Klicke in der Liste „Touren“ auf eine Tour (schalte die rechte Spalte vorher von „Orte“ auf „Touren“ um), auf ihre Zeile in einem Tag oder auf ihre Linie auf der Karte, und ihre Infokarte öffnet sich über der Karte. Die Karte lässt sich weiter bedienen, solange die Infokarte offen ist.',
  'help.guide.tour-detail-read.step.2':
    'Im Kopfbereich stehen der Name der Tour und eine Zusammenfassung als Badges: die Art der Tour, bei importierten Touren die Herkunft, die geplante Dauer, die Distanz, der Aufstieg und der Abstieg.',
  'help.guide.tour-detail-read.tip.3':
    'Manche Touren zeigen noch mehr: ein Stadtspaziergang seine Stationen, eine Paddeltour ihre Prüfungen und den Wind, eine schon absolvierte Tour ihren „Ist-Track“ und eine mit einer Liste verknüpfte Tour ihre „Packliste“.',
  'help.guide.tour-rename-colour.step.3':
    'Klicke auf den farbigen Punkt an der Ecke der runden Kachel der Tour („Streckenfarbe“). Unter dem Kopfbereich öffnet sich der Abschnitt „Streckenfarbe“.',
  'help.guide.tour-take-along.step.2':
    'Hat die Tour eine Webseite, trägt der Button daneben den Namen der Seite (Komoot, AllTrails, Outdooractive oder Wanderer), bei allen anderen „Webseite“. Er öffnet die Seite in einem neuen Tab.',
  'help.guide.tour-copy-keep.goal':
    'Eine Variante einer Tour in dieser Reise anlegen oder sie für spätere Reisen in einer deiner Sammlungen aufheben.',
  'help.guide.tour-copy-keep.tip.4':
    '„Sammlung“ gibt es nur, solange das Add-on „Sammlungen“ eingeschaltet ist. Eine Liste, die du nur lesen darfst, kannst du nicht wählen, und gibt es noch keine Liste, bietet der Dialog „Sammlungen öffnen“ an.',
  'help.guide.tour-packing-link.step.5':
    'Klicke auf „Packliste öffnen“, um Dinge abzuhaken. TREK wechselt in den Tab „Listen“ zur Packliste.',
  'help.guide.tour-files.step.2': 'Die Zeile darunter zeigt jetzt ihre Anzahl, und die Liste klappt auf.',
  'help.guide.tour-activity-link.step.2':
    'Hake unter „Durchgeführt am“ den Tag an, an dem du die Tour gemacht hast. Wähle „Ohne Tag“, wenn sie zu keinem Tag gehört.',
  'help.guide.tour-activity-compare.title': 'Plan und tatsächliche Tour vergleichen',
  'help.guide.tour-activity-compare.result':
    'Du siehst auf einen Blick, wie der Tag im Vergleich zum Plan gelaufen ist, auf der Infokarte und auf der Karte.',
  'help.guide.tour-origin-check.tip.3':
    '„Keine wanderer-Verbindung“ heißt, dass dein Konto noch nicht verbunden ist. Verbinde es in den Einstellungen unter „Integrationen“.',
  'help.ctx.trip-tour-planner.bullet.5':
    '„Ort oder Adresse suchen“ oben auf der Karte verschiebt den Kartenausschnitt. Die Leiste unten links schaltet zwischen den Karten um, die der Tourtyp anbietet, etwa Topo oder Satellit, und enthält die Schalter der geöffneten Tour, etwa „Punkte setzen“ und 3D.',
  'help.guide.tour-open-workspace.step.5':
    '„Ort oder Adresse suchen“ oben auf der Karte bringt dich zu einem Ort, damit du dort beginnen kannst, wo die Tour liegt.',
  'help.guide.tour-draw-route.goal':
    'Die Punkte einer neuen Tour auf der Karte setzen und TREK die Route dazwischen berechnen lassen.',
  'help.guide.tour-draw-route.tip.2':
    'Topo oder Wandern in der Kartenleiste zeigen die Wege, so triffst du sie leichter beim Klicken. Liegt ein Punkt zu weit von jedem Weg entfernt, den der Tourtyp nutzen kann, bekommst du statt einer Route einen Hinweis.',
  'help.guide.tour-type-profile.step.3':
    'Bei einer Radtour wählst du unter dem Typ das „Profil“: Touring, Rennrad, Gravel oder MTB. Die Zeile darunter erklärt, was das Profil bevorzugt.',
  'help.guide.tour-edit-points.step.2':
    'Klicke unter „Wegpunkte“ auf eine Zeile, um ihren Punkt auszuwählen. Sein Pin wird auf der Karte hervorgehoben.',
  'help.guide.tour-shaping-points.title': 'Route mit einem Formpunkt lenken',
  'help.guide.tour-shaping-points.tip.3':
    'Bei einem Ausritt fügt ein Klick auf die Linie nichts hinzu, weil kein Router die Strecke formt.',
  'help.guide.tour-loop-reverse.tip.2':
    'Entferne die Zeile „Zurück zum Start“, damit die Tour wieder nur in eine Richtung führt. Ein von Hand gezeichneter Abschnitt bleibt von Hand gezeichnet, wenn du die Tour umkehrst.',
  'help.guide.tour-leg-by-hand.step.4':
    '„Nächsten Abschnitt neu berechnen“ lässt den Router genau diesen einen Abschnitt noch einmal berechnen, ohne die anderen zu verändern.',
  'help.guide.tour-trip-places.step.3':
    'Klicke auf einen Ort. Er wird als neues Ende der Tour angehängt, und die Liste bleibt für den nächsten Ort offen.',
  'help.guide.tour-details-times.step.1':
    'In „Name der Tour“ oben in der linken Leiste steht der Name. Bei einer neuen Tour ist der graue Text dort, zum Beispiel „Wanderung ohne Titel“, nur ein Platzhalter: Tipp einfach deinen eigenen Namen ein.',
  'help.guide.tour-save.title': 'Tour speichern',
  'help.guide.tour-save.tip.3':
    'Speichern geht auch erst, wenn kein Feld mehr einen ungültigen Wert hat, etwa eine Webseite, die keine gültige Adresse ist. Die Details öffnen sich dann von selbst und zeigen das Feld.',
  'help.guide.tour-edit-saved.tip.1': 'Speichern bleibt ausgegraut, solange du die Tour nicht geändert hast.',
  'help.guide.tour-summary-profile.step.3':
    'Fahr mit dem Zeiger über das „Höhenprofil“. Es zeigt dir Distanz und Höhe an dieser Stelle, und ein Punkt markiert dieselbe Stelle auf der Karte.',
  'help.guide.tour-list-manage.step.1':
    '„Umfang der Reise“ steht über der Liste. Zugeklappt zeigt es die Zahl der Touren und wie viele davon „Geplant“ und „Ungeplant“ sind; der Pfeil rechts klappt eine Zeile pro Typ mit summierter Distanz, Aufstieg, Abstieg und Zeiten auf.',
  'help.guide.tour-list-manage.result':
    'Die Summen für alles, was der Filter zeigt, und jede Tour an dem Tag, an dem du sie haben wolltest.',
  'help.guide.tour-delete.result': 'Die Tour ist aus der Liste, von der Karte und aus allen Tagen verschwunden.',
  'help.guide.tour-saved-elsewhere.tip.2':
    'Dasselbe passiert, wenn du die Tour auf einem anderen Gerät geändert hast. Hast du die Tour hier nicht geändert, wird sie einfach neu geladen, und ein Hinweis informiert dich darüber.',
  'help.ctx.trip-tour-import.bullet.5':
    'Ist wanderer in den Einstellungen unter „Integrationen“ verbunden, steht neben „Neue Tour planen“ ein Button „wanderer“, solange keine Tour geöffnet ist. Er listet deine eigenen Trails zum Importieren auf.',
  'help.guide.tour-import-gpx.tip.1':
    'Du kannst die Dateien auch einfach von deinem Computer auf den Tab „Touren“ ziehen und dort loslassen. Es öffnet sich dieselbe Vorschau.',
  'help.guide.tour-view-import.step.1':
    'Klicke im Tab „Touren“ unter „Touren dieser Reise“ auf eine Tour mit dem Badge „GPX-Import“.',
  'help.guide.tour-plan-from-import.goal':
    'Aus einem aufgezeichneten Track verschiebbare Wegpunkte machen und sehen, wie nah die neue Route am Original bleibt.',
  'help.guide.tour-plan-from-import.tip.4':
    'Ein Ausritt hat keine bearbeitbare Version: Er bleibt so, wie er geritten wurde.',
  'help.guide.tour-restore-recorded.tip.2':
    'Eine Tour, die mit „Als neue Tour planen“ entstanden ist, hat keinen eigenen aufgezeichneten Track. Der Import, aus dem sie stammt, steht weiterhin in der Liste.',
  'help.guide.tour-take-over.step.5': 'Gib ihr unter „Name in dieser Reise“ einen anderen Namen, wenn du möchtest.',
  'help.guide.tour-import-wanderer.step.1':
    'Klicke im Tab „Touren“, solange keine Tour geöffnet ist, neben „Neue Tour planen“ auf „wanderer“.',
  'help.guide.tour-import-wanderer.result':
    'Der Trail ist jetzt eine Tour der Reise und öffnet sich auf der Karte als wanderer-Tour.',
  'help.guide.tour-map-layers.title': 'Karte für eine Tour wählen',
  'help.guide.tour-map-layers.tip.3':
    'Paddeltouren und Stadtspaziergänge bieten nur Karte und Satellit; Läufe, Skitouren und Ausritte bieten Karte, Topo und Satellit.',
  'help.guide.tour-along-search.result':
    'Die Orte entlang der Route erscheinen in der Liste und auf der Karte, und du kannst sie dir ansehen.',
  'help.guide.tour-along-add-stop.step.3':
    'Klicke auf „Als Stopp hinzufügen“. Das Badge daneben schätzt grob den Umweg, gemessen in Luftlinie.',
  'help.guide.tour-3d-terrain.step.1':
    'Öffne im Tab „Touren“ eine Tour und klicke am Ende der Leiste unten links auf 3D. Die Karte kippt in eine Landschaftsansicht, und die Route liegt darüber.',
  'help.guide.tour-3d-terrain.tip.3':
    'Für die Landschaft brauchst du eine Internetverbindung: Die Höhendaten stammen aus den offenen Geländekacheln von Mapzen. Eine Paddeltour wird in ihrer eigenen Farbe ohne Steigungen gezeichnet, denn Wasser ist flach.',
  'help.guide.tour-3d-flyover.tip.1':
    'Dreh während des Flugs am Mausrad, um näher heran- oder weiter herauszuzoomen; die Kamera bleibt auf dem Punkt. Die Karte lässt sich erst verschieben, wenn du pausierst.',
  'help.guide.tour-map-overlays.step.4':
    'Bei einer Paddeltour bietet die Leiste stattdessen „Seezeichen“ an. Klicke darauf, um Bojen, Baken und Hafenzeichen auf dem Wasser einzublenden.',
  'help.ctx.trip-tour-stages.bullet.2':
    '„Etappe hier beenden“ im Menü „Weitere Aktionen“ eines Stopps beendet an diesem Stopp eine Etappe. „Wegpunkte“ zeigt dann über jeder Etappe „Etappe N“ mit Distanz und Dauer, und der Stopp am Ende einer Etappe trägt einen Mond.',
  'help.guide.tour-multi-day.step.3':
    'Fahr mit der Maus über den Stopp, an dem der erste Tag endet, klicke auf „Weitere Aktionen“ und wähle „Etappe hier beenden“.',
  'help.guide.tour-multi-day.result':
    'Eine Route mit ihren Etappen, jede einzeln vermessen. Klicke auf Speichern, um sie zu behalten.',
  'help.guide.tour-stages-on-days.step.6':
    'Der Pfeil daneben („Diese Etappe im Planer öffnen“) öffnet die Tour im Editor bei dieser Etappe.',
  'help.ctx.trip-tour-hike.bullet.1':
    '„Tourtyp“ oben im Editor bestimmt, wie die Route geplant wird. Eine Wanderung führt über Wege bis zu der Schwierigkeit, die unter „Details“ bei „Maximale Wegschwierigkeit“ eingestellt ist; ein Lauf nutzt Wege, auf denen man gut laufen kann, und fragt unter „Geplante Pace“ nach deinem Tempo.',
  'help.guide.tour-hike-plan.step.1':
    'Klicke oben in der linken Spalte auf „Neue Tour planen“. Der Editor öffnet sich als „Neue Tour“.',
  'help.guide.tour-hike-plan.tip.2':
    'Ab T4 fragt TREK zuerst „Alpine Routenplanung aktivieren?“. Bestätige nur, wenn die Route durch ausgesetztes oder unmarkiertes Gelände führen darf; die Frage kommt einmal pro Bearbeitungssitzung.',
  'help.guide.tour-hike-trail-details.step.4':
    'Klicke in der Liste auf eine Schwierigkeitsstufe, um nur diese Abschnitte auf der Karte zu zeigen. Klicke noch einmal darauf, um wieder die ganze Route zu sehen.',
  'help.guide.tour-hike-round.step.1':
    'Klicke bei geöffneter Wanderung im Kopf der Karte „Wegpunkte“ auf „Rundtour ab dem Start“. Für einen anderen Stopp öffnest du dessen Menü „Weitere Aktionen“ und wählst „Rundtour ab hier“.',
  'help.guide.tour-hike-round.tip.3':
    '„Erneut suchen“ führt zurück zur Distanzeingabe, und Abbrechen schließt die Karte, ohne etwas zu ändern.',
  'help.guide.tour-hike-compare-ways.tip.1':
    'Das gibt es nur bei Wanderungen und nur für einen Abschnitt, den der Router geplant hat, nicht für einen von Hand gezeichneten.',
  'help.guide.tour-ferrata-add.step.4':
    'In „Wegpunkte“ zeigt der Abschnitt zwischen diesen beiden Punkten Namen, Schwierigkeitsgrad und Länge des Klettersteigs.',
  'help.guide.tour-run-plan.goal':
    'Einen Lauf auf laufbaren Wegen planen und die Dauer aus deiner Pace berechnen lassen.',
  'help.guide.tour-run-plan.tip.2':
    'Anstiege, Abstiege und wie technisch der Weg ist, fließen nicht in die Zeit ein: Sie ist einfach Distanz mal Pace.',
  'help.guide.tour-run-ways.result': 'Du weißt schon vor dem Start, wo der Lauf den Asphalt verlässt.',
  'help.ctx.trip-tour-walk.bullet.4':
    '„Entlang der Tour“ findet Sehenswürdigkeiten passend zum „Thema des Walks“ in einem bestimmten Abstand zur Route, und mit „Als Stopp hinzufügen“ planst du eine davon an der gewünschten Stelle in den Spaziergang ein.',
  'help.guide.tour-walk-plan.step.5':
    'Stell die „Wichtigkeit“ auf „Standard“, „Optional“ oder „Unbedingt besuchen“. Schalte „Geschützt“ für einen Stopp ein, den spätere Änderungsvorschläge an seiner Stelle lassen müssen, und klicke dann auf Speichern.',
  'help.guide.tour-walk-sights.step.1':
    'Bei geöffnetem Stadtspaziergang findest du „Entlang der Tour“ in der linken Spalte. Wähle dort ein „Thema des Walks“: „Kultur und Geschichte“, „Parks und Aussicht“, „Essen und lokales Leben“ oder „Gemischt“.',
  'help.guide.tour-walk-sights.result':
    'Die Sehenswürdigkeit ist jetzt ein Stopp des Spaziergangs, eingeplant in die Route zwischen den Stopps, die du gewählt hast.',
  'help.guide.tour-walk-day-times.tip.2':
    'Hat ein Stopp noch keine Aufenthaltsdauer, gelten die Ankunftszeiten danach nur als frühestmögliche.',
  'help.guide.tour-walk-google-import.step.3':
    'Prüfe „Stationen im Link“. Ein Stopp, für den der Link keine Position liefert, wird markiert und ausgelassen.',
  'help.guide.tour-walk-check-off.step.1':
    'Klicke im Tab „Planung“ an seinem Tag auf den Stadtspaziergang. Seine Infokarte öffnet sich neben der Karte.',
  'help.ctx.trip-tour-bike.title': 'Radtouren',
  'help.guide.tour-bike-profile.step.1': 'Klicke im Tab „Touren“ oben in der linken Leiste auf „Neue Tour planen“.',
  'help.guide.tour-bike-profile.tip.2':
    'Ein Profil steuert nur den Router. Ob ein Weg befahrbar ist, sagt es nicht: Die Karte „Belag und Wege“ zeigt, worauf die Route verläuft.',
  'help.guide.tour-bike-surfaces.step.3':
    'Klicke unter „Belag“ auf eine Zeile wie Gravel oder Naturboden. Die passenden Abschnitte werden auf der Karte hervorgehoben. Klicke erneut auf die Zeile, um die Hervorhebung aufzuheben.',
  'help.guide.tour-bike-mtb-grades.goal': 'Sehen, wie schwierig die Trails einer MTB-Tour sind, bevor du sie fährst.',
  'help.guide.tour-bike-mtb-grades.tip.4':
    'Stellst du das „Profil“ von MTB auf ein anderes um, verschwinden die Abschnitte zu den Schwierigkeitsgraden. Die Route wird dann für das neue Profil neu geplant.',
  'help.guide.tour-ski-plan.title': 'Ski- und Wintertour planen',
  'help.guide.tour-ski-plan.tip.1':
    'Wähle bei Langlauf zusätzlich die „Technik“: „Klassisch“, „Skating“ oder „Unbekannt“. Der Hinweis unter den Feldern zeigt, was noch fehlt.',
  'help.guide.tour-ski-options.step.2':
    'Öffne „Schwerste Pisten“ und wähle den höchsten Schwierigkeitsgrad, den du fahren willst, von „Anfänger“ bis „Experte“. Standard ist „Mittel“.',
  'help.guide.tour-ski-fix-leg.title': 'Nicht planbaren Skiabschnitt reparieren',
  'help.guide.tour-ski-fix-leg.tip.4':
    'Solange nicht jeder Abschnitt geplant ist, zeigt die Karte „Pistenroute“ an, dass es noch keine Skizeit gibt.',
  'help.guide.tour-ski-summary.tip.2':
    '„Skizeit“ bleibt auf „Nicht berechnet“, bis jeder Abschnitt geplant ist. Wenn die Tour trotzdem eine Zeit haben soll, trag in ihren Details eine geplante Gesamtzeit ein.',
  'help.guide.tour-ski-pistes-layer.step.3':
    'Die Legende zeigt die Abfahrten nach Schwierigkeit, die Loipen, die Winter- und Schneeschuhwege, die Rodelbahnen und die Lifte. „Ganze Legende bei OpenSnowMap“ öffnet die vollständige Legende.',
  'help.guide.tour-ski-import.step.2':
    'Öffne in der „Import-Vorschau“ das Feld „Importieren als“ und wähle „Ski & Winter“.',
  'help.guide.tour-ski-import.result':
    'Der Track steht in „Touren dieser Reise“, Disziplin und Technik siehst du auf seiner Karte „Skistrecke“.',
  'help.ctx.trip-tour-paddle.bullet.6':
    '„Paddeln hat Risiken“, die Zeile unten in der linken Spalte, öffnet „Sicherheit beim Paddeln“. Die Karte bietet Karte und Satellit, dazu „Seezeichen“ als Überlagerung.',
  'help.guide.tour-paddle-setup.step.6':
    '„Paddeltempo“ zeigt den Vorschlag für das Boot in Grau. Gibst du ein eigenes Tempo ein, steht am Feld „Eigenes Tempo“; der Link darunter, „Den vorgeschlagenen nehmen“, übernimmt wieder das Tempo des Bootes.',
  'help.guide.tour-paddle-water-route.goal':
    'TREK einen Abschnitt entlang des Flusses oder Sees planen lassen und verstehen, was dir ein nicht planbarer Abschnitt mitteilt.',
  'help.guide.tour-paddle-water-route.tip.3':
    'Hinweise unter einem geplanten Abschnitt markieren „Wildwasser“ mit seinem Schwierigkeitsgrad, eine „Bootsgasse“ oder eine „Lücke in den Kartendaten“, die mit einer geraden Linie überbrückt wurde.',
  'help.guide.tour-paddle-portage.step.4':
    'Unter „Route“ trägst du mit „Dem Weg folgen“ entlang eines kartierten Weges um, mit „Gerade Linie“ direkt querfeldein. TREK sucht den Weg selbstständig und meldet, wenn es keinen ohne langen Umweg gibt.',
  'help.guide.tour-paddle-lock.step.1':
    'Fahr mit der Maus über den Stopp an der Schleuse und klicke auf „Weitere Aktionen“, die drei Punkte.',
  'help.guide.tour-paddle-time.title': 'Zeit einer Paddeltour ablesen und anpassen',
  'help.guide.tour-paddle-time.tip.2': 'Strömung und Wind fließen nicht in die Schätzung ein.',
  'help.guide.tour-paddle-wind.step.4':
    'Öffne „Was Wind beim Paddeln bedeutet“, um zu lesen, wie sich Gegenwind, Seitenwind, offene Querungen und Böen auf ein Boot auswirken.',
  'help.guide.tour-paddle-checklist.step.1':
    'Speichere die Paddeltour und such dann „Prüfliste“ in der linken Spalte. Das Badge in ihrer Kopfzeile zeigt, wie weit die Liste abgearbeitet ist.',
  'help.guide.tour-paddle-checklist.tip.4':
    'Hindernisse stammen aus den OpenStreetMap-Daten der Regionen, die TREK vorhält. Wo es keine Daten gibt, weist die Karte darauf hin, und du prüfst Wehre, Schleusen und Portagen selbst.',
  'help.guide.tour-paddle-track-marks.step.4':
    'Klicke in „Touren dieser Reise“ auf den Track. Die linke Spalte zeigt ihn so, wie er aufgezeichnet wurde, mit der Karte „Portagen und Schleusen“.',
  'help.ctx.trip-tour-horse.title': 'Ausritte',
  'help.guide.tour-horse-plan.goal':
    'Einen Ausritt aus Abschnitten der ausgeschilderten Reitrouten in der Kartenansicht zusammenstellen.',
  'help.guide.tour-horse-plan.result':
    'Der Ausritt folgt den übernommenen Abschnitten, jeweils mit Namen der Route, Zugangspunkt und Länge, und steht unter „Touren dieser Reise“.',
  'help.guide.tour-horse-gap.step.1':
    'Ist schon ein Abschnitt im Ausritt, öffne eine andere Route und wähle einen Abschnitt, der nicht an das Ende deines Ausritts anschließt. Unter „Anschluss an deinen Ausritt“ zeigt ein Hinweis, wie weit sie auseinanderliegen.',
  'help.guide.tour-horse-recorded.title': 'Aufgezeichneten Ausritt aus einer GPX-Datei behalten',
  'help.guide.tour-horse-recorded.tip.2':
    'Eine Datei ohne Höhendaten zeigt „Keine Höhen in der Datei“ statt eines Aufstiegs von null.',
  'help.guide.dateless-trip.tip.1':
    'Sobald du weißt, wann du reist, öffne mit dem Stift auf der Karte das Formular und wähl die Daten. Deine geplanten Tage behalten ihre Reihenfolge und bekommen der Reihe nach ein Datum.',
  'help.guide.trip-reminder.goal': 'Ein paar Tage vor der Abreise erinnert werden.',
  'help.guide.upcoming-reservations.tip.2':
    '„Ausstehend“ kennzeichnet eine Buchung, die noch nicht bestätigt ist. Stornierte Buchungen und archivierte Reisen erscheinen hier nicht.',
  'help.guide.half-company-holiday.tip.1':
    'Urlaub, der an diesem Tag schon eingetragen ist, wird auf einen halben Tag gekürzt, und wer ihn später einträgt, verbraucht nur 0,5 Tage.',
  'help.guide.edit-holiday-calendar.goal':
    'Einen von dir hinzugefügten Feiertags- oder Schulferienkalender umbenennen, umfärben, verschieben oder löschen.',
  'help.guide.person-color.title': 'Farbe einer Person ändern',
  'help.guide.answer-fusion-request.tip.1':
    'Die Anfrage bleibt offen, bis du antwortest. Mehrere Anfragen erscheinen nacheinander.',
  'help.guide.log-for-partner.tip.1': '„Halbtag“ und „Ausgleich“ funktionieren auch für die gewählte Person.',
  'help.guide.dissolve-fusion.tip.2': 'Wenn jemand nur deine Tage sehen soll, teil stattdessen deinen Kalender.',
  'help.guide.country-details.tip.2':
    'Klick auf das Badge „Orte“, um alle Orte zu sehen, die für das Land gezählt werden, nach Reise gruppiert.',
  'help.guide.country-places.tip.2':
    'Das Badge erscheint nur, wenn das Land eigene Orte hat. Ein Land, das du nur von Hand markiert hast, hat keine.',
  'help.guide.tour-activity-stats.goal':
    'Distanz, Anstieg und Anzahl deiner Touren über alle Reisen ablesen, nach Zeitraum und Typ, und eine ausgefallene Tour herausnehmen.',
  'help.guide.tour-activity-stats.tip.1':
    'Eine Tour zählt, sobald ihr letzter Tag vorbei ist. Eine Tour, die an keinem Tag liegt oder nur an Tagen ohne Datum, zählt nie: Leg sie in ihrer Reise auf einen Tag mit Datum.',
  'help.guide.move-to-list.result':
    'Die Orte stehen jetzt auf der anderen Liste, und ein kurzer Hinweis zeigt, wie viele verschoben oder dupliziert wurden.',
  'help.guide.accept-list-invite.tip.1':
    'Was du auf der Liste darfst, hängt von der Rolle ab, die dir der Besitzer gegeben hat: Betrachter, Bearbeiter oder Admin.',
  'help.guide.tour-collection-add-to-trip.title': 'Tour aus der Sammlung in eine Reise übernehmen',
  'help.guide.tour-collection-add-to-trip.tip.3':
    'Um eine Tour in einer Liste aufzuheben, öffne eine gespeicherte Tour in der Reise und klick in ihrer Fußzeile auf „Sammlung“.',
  'help.guide.tour-collection-manage.tip.2': 'Den Papierkorb sehen nur der Besitzer und die Admins der Liste.',
  'help.guide.entry-draft.result':
    'Der Eintrag bleibt als „Entwurf“ markiert in deinem Zeitstrahl und erscheint nicht unter dem geteilten Link.',
  'help.guide.journey-map-layers.title': 'Wählen, was die Journey-Karte zeigt',
  'help.guide.journey-keep-route.title': 'Die aufgezeichnete Strecke eines Tages behalten',
  'help.guide.journey-day-stays.title': 'Einträge aus den Aufenthalten schreiben, die Dawarich aufgezeichnet hat',
  'help.guide.journey-take-over-day.title': 'Einen ganzen aufgezeichneten Tag übernehmen',
  'help.guide.journey-take-over-day.result':
    'Der Tag enthält einen Entwurf pro Aufenthalt oder zusammengefasster Gruppe oder einen einzigen Tagesbericht, und seine Aufenthalte sind nicht mehr offen.',
  'help.guide.journey-auto-prepare.result':
    'Solange eine verknüpfte Reise läuft, liegen die Aufenthalte jedes Tages an ihrem Tag bereit für „Tag übernehmen“.',
  'help.ctx.settings-about.title': 'Über',
  'help.guide.web-push-device.tip.3':
    'Push funktioniert nur, wenn TREK über HTTPS geöffnet ist. Sind Benachrichtigungen blockiert, erlaub sie in den Browsereinstellungen und versuch es noch einmal.',
  'help.guide.connect-airtrail.result':
    'Das Badge zeigt „Verbunden“, und im Tab „Transporte“ einer Reise gibt es jetzt „Aus AirTrail importieren“.',
  'help.guide.connect-dawarich.result':
    'Das Badge zeigt „Verbunden“, und Reiseplaner, Journal und Atlas können dir anbieten, was Dawarich aufgezeichnet hat.',
  'help.guide.tour-connect-wanderer.result':
    'Das Badge zeigt „Verbunden“, und im Tab „Touren“ einer Reise kannst du dein wanderer durchsuchen und dessen Trails importieren.',
  'help.guide.tour-wanderer-watch.result':
    'TREK behält deine importierten Trails im Blick und meldet sich, wenn sich einer geändert haben könnte. An einer Tour ändert sich nichts, bis du die Änderung übernimmst.',
  'help.guide.plugin-settings.step.1':
    'Öffne in der Seitenleiste der Einstellungen „Plugins“. Unter „Plugin-Einstellungen“ hat jedes Plugin, das Angaben von dir braucht, eine Karte mit seinen Feldern: Füll sie aus und klick auf „Speichern“. Aktionen auf der Karte laufen erst, nachdem du sie bestätigt hast.',
  'help.guide.profile.step.3': 'Klick rechts in der Fußzeile der Karte auf „Speichern“.',
  'help.guide.default-user-settings.title': 'Voreinstellungen für neue Benutzer festlegen',
  'help.guide.own-routing-engine.tip.1':
    'Die öffentlichen OSRM-Server erlauben etwa eine Anfrage pro Sekunde: genug für einen Tag, knapp für einen Roadtrip.',
  'help.guide.admin-passkeys.goal': 'Anmeldung per Fingerabdruck, Gesichtserkennung oder Geräte-PIN ermöglichen.',
  'help.guide.rotate-jwt-secret.tip.2':
    'Willst du stattdessen nur eine einzelne Person aussperren, gib ihr unter „Benutzer bearbeiten“ ein „Neues Passwort“; das beendet nur ihre Sitzungen.',
  'help.guide.notification-defaults.goal':
    'Festlegen, mit welchen Benachrichtigungseinstellungen jeder Benutzer startet, und einen Kanal für ein Ereignis komplett sperren.',
  'help.ctx.notifications.summary':
    'Alles, was TREK dir in der App mitgeteilt hat, das Neueste zuerst: eine Buchung, die jemand geändert hat, eine neue Nachricht in einem Reise-Chat, ein Kalender, den jemand mit dir geteilt hat. Die Glocke oben rechts zeigt die zehn neuesten, diese Seite alle.',
  'help.guide.read-notifications.step.1':
    'Klick oben rechts auf die Glocke. Die rote Zahl darauf zeigt, wie viele Benachrichtigungen du noch nicht gelesen hast.',
  'help.guide.filter-notifications.step.1': 'Klick oben rechts auf die Glocke.',
  'help.guide.mark-notifications-read.step.2':
    'Klick oben auf „Alle als gelesen markieren“, um alle Benachrichtigungen auf einmal als gelesen zu markieren.',
  'help.guide.delete-notifications.tip.1':
    'Beim Löschen verschwindet die Benachrichtigung nur für dich. Die Buchung, Nachricht oder Freigabe, um die es ging, bleibt unverändert.',
  'help.guide.notification-settings.tip.1':
    'Ein Schloss in einer Zelle bedeutet, dass der Admin dieses Ereignis für alle ausgeschaltet hat.',
  'help.guide.add-guest.tip.3':
    'Nur der Besitzer der Reise kann Gäste hinzufügen, umbenennen und entfernen. Ein Gast, der eine Ausgabe bezahlt hat, bleibt, bis du den Zahler änderst oder die Zahlung löschst.',
  'help.guide.link-journal.tip.1':
    'Verknüpfen kannst du nur Journale, die dir gehören. Eines, in dem du nur mitschreibst, kannst du nicht teilen.',
  'help.ctx.trip-places.bullet.7':
    'Das Häkchen neben der Suche startet eine Auswahl: Über die Leiste unten in der Spalte bekommen mehrere Zeilen auf einmal eine neue Kategorie, landen in einer Sammlung, werden als besucht markiert oder gelöscht.',
  'help.guide.filter-places.step.5':
    'Sobald die Reise mehr als ein Land oder eine Region umfasst, kannst du die Liste mit dem Globus auf ein Land oder eine Region darin eingrenzen, jeweils mit Anzahl. „Filter zurücksetzen“ stellt wieder „Alle Länder“ ein.',
  'help.guide.import-places-file.tip.3':
    'Ist „Touren“ eingeschaltet, wie bei TREK ab Werk, importierst du eine Datei über „Touren“ oben in der Spalte mit „GPX oder KML importieren“, und ihre Linien werden zu Touren. Die Pins darin werden dort nicht importiert, weil Touren nur aus Linien bestehen.',
  'help.guide.dawarich-stays.step.3':
    'Prüf „Name“, „Angekommen“ und „Aufgebrochen“, wähl einen Tag oder lass „Noch keinem Tag zugeordnet“ stehen, ergänz bei Bedarf „Notizen“ und klick auf „Ort hinzufügen“.',
  'help.guide.leave-stop-off-route.result':
    'Der Halt bleibt Teil des Tages und des PDFs; solange er als „Nicht auf der Route“ markiert ist, führt die Route direkt vom Halt davor zum Halt danach.',
  'help.guide.move-booking-day.tip.2':
    'Innerhalb ihres eigenen Tages springt eine Buchung mit Uhrzeit an die Stelle zurück, die ihre Uhrzeit vorgibt.',
  'help.guide.place-image-from-file.step.3':
    'Klick unter „Aus angehängten Dateien“ auf das gewünschte Foto. Mit „Vom Gerät hochladen“ darüber wählst du stattdessen ein neues Foto von deinem Computer.',
  'help.guide.place-own-hours.step.1':
    'Öffne den Ort und klick unten rechts in der Karte auf „Bearbeiten“. Das Formular des Ortes öffnet sich.',
  'help.guide.place-own-hours.tip.3':
    'Mit „Öffnungszeiten entfernen“ und anschließend „Aktualisieren“ erscheinen wieder die abgerufenen Öffnungszeiten auf der Karte.',
  'help.guide.confirm-stay-booking.title': 'Buchung eines Aufenthalts bestätigen',
  'help.guide.confirm-stay-booking.tip.2':
    'Dieselbe Pille funktioniert in jeder Buchung, auch in denen unter „Reservierungen“ am Tag.',
  'help.guide.map-lock.tip.2':
    'Dieser Browser merkt sich die Sperre für jede Reise. Beim Öffnen einer Reise wird ihr Ausschnitt trotzdem einmal eingepasst, damit die Karte nie leer startet.',
  'help.guide.tour-map-lines.step.2':
    'Klick auf die Linie oder auf den Pin an ihrem Anfang. Die Tourkarte öffnet sich unten über der Karte, und die Linie wird breiter und mit weißem Rand gezeichnet, damit du sie zwischen den anderen verfolgen kannst. Das X oben in der Tourkarte schließt sie wieder.',
  'help.guide.car-stops.title': 'Eine Fahrt mit Stopps unterwegs planen',
  'help.guide.car-stops.result':
    'Die Fahrt erscheint als Karte im Tab „Transporte“ und als Zeile an ihrem Tag, und ihre Linie auf der Karte führt von der Abholung der Reihe nach über jeden Stopp bis zur Rückgabe.',
  'help.guide.transport-details.step.5':
    '„Auf Karte“ unten in den Details blendet die Linie der Fahrt ein und bringt dich in der „Planung“ zu ihrem Tag. „Bearbeiten“ ganz rechts öffnet das vollständige Formular, und der Papierkorb daneben löscht die Fahrt nach einer Rückfrage.',
  'help.guide.export-transports-csv.step.1':
    'Grenz die Liste zuerst ein, wenn du nur einen Teil brauchst. „Suchen“, „Filter“ und die Sortierung unter „Ansicht anpassen“ wirken sich alle aus: Die Datei enthält, was der Tab zeigt, in derselben Reihenfolge.',
  'help.guide.group-sort-bookings.tip.1':
    '„Karten“ und „Liste“ haben jeweils eine eigene Gruppierung: „Karten“ startet nach Status, „Liste“ nach Tag. Ein Punkt an „Ansicht anpassen“ zeigt, dass etwas vom Standard abweicht, und „Ansicht zurücksetzen“ unten im Panel stellt den Standard wieder her.',
  'help.guide.booking-on-map.step.2': 'Klick unten in den Details auf „Auf Karte“.',
  'help.guide.export-bookings-csv.goal':
    'Die Buchungen der Reise als CSV-Datei exportieren, um sie in Excel, Numbers oder einer anderen Tabellenkalkulation zu öffnen.',
  'help.guide.arrange-packing-list.goal':
    'Ganze Listen und einzelne Einträge dorthin verschieben, wo du sie haben willst, oder jede Liste nach Namen sortiert ansehen.',
  'help.guide.check-off-packing.tip.4':
    'Bei einem Eintrag mit einer Menge über eins kannst du die Stücke auch einzeln abzählen, siehe „Mehrere Stücke einer Sache packen“.',
  'help.guide.count-packed-pieces.tip.1':
    'Hakst du das Kästchen an, sind alle Stücke auf einmal gepackt; entfernst du den Haken, sind alle wieder ausgepackt.',
  'help.guide.expense-receipts.goal':
    'Den Beleg oder die Rechnung bei der passenden Ausgabe ablegen und aus dem Hauptbuch wieder öffnen.',
  'help.guide.expense-receipts.tip.2':
    'Mit dem Papierkorb neben einem Beleg löst du ihn beim Speichern von der Ausgabe. Die Datei selbst bleibt unter „Dateien“; um sie ganz loszuwerden, lösch sie dort.',
  'help.guide.files-sync.tip.4':
    'Zeigt die Karte einen gelben Hinweis mit „Neu verbinden“, akzeptiert der Speicher die gespeicherte Anmeldung nicht mehr. Klick auf „Neu verbinden“ und gib ein neues App-Passwort oder Token ein, dann läuft der Abgleich weiter.',
  'help.guide.files-sync-settings.result':
    'Ab dem nächsten Lauf gleicht die Reise nur noch in der gewählten Richtung ab, und für Löschungen und doppelte Bearbeitungen gelten die Regeln, die du festgelegt hast.',
  'help.guide.manage-notes.result':
    'Die Notiz ist aus der Karte „Notizen“ verschwunden, für alle Mitglieder gleichzeitig. Eine Notiz, die du nur angeheftet oder geändert hast, bleibt, und die anderen sehen sie so, wie du sie hinterlassen hast.',
  'help.guide.note-categories.step.4':
    'Mit den Farbpunkten in einer Zeile legst du die Farbe dieser Kategorie fest: Indigo, Rot, Bernstein, Smaragd, Blau oder Violett. Hier wird „Unterkunft“ bernsteinfarben.',
  'help.guide.roadtrip-reorder.step.3':
    'Mit der Tastatur: Setz den Fokus auf einen Halt und drück Alt zusammen mit Pfeil nach oben oder unten, um ihn innerhalb seines Tages um eine Position zu verschieben.',
  'help.guide.roadtrip-overnight.title': 'Unterwegs auf der Route übernachten',
  'help.guide.roadtrip-overnight.tip.1':
    'Die Übernachtung reicht bis zum nächsten Tag. Andere Daten gehören zur Buchung: Ändere sie unter „Tage“ zusammen mit dem Rest des Aufenthalts.',
  'help.guide.roadtrip-stop-fill.tip.1':
    'Das Badge tragen nur Halte, an denen dein Auto tankt oder lädt: Tankstopps bei „Sprit“, Ladestopps bei „Strom“, beides bei „Beides“.',
  'help.guide.roadtrip-bookings.result':
    'Jede gebuchte Fahrt steht an der Stelle der Autofahrt, an der sie stattfindet, und die Strecken davor und danach führen zu ihren Terminals hin und von ihnen weg.',
  'help.guide.roadtrip-google-import.step.1':
    'Klick oben in „Auf der Strecke“ auf die drei Punkte und wähl „Google-Maps-Route importieren“.',
  'help.guide.roadtrip-hazards.title': 'Aktuelle Warnungen auf der Karte anzeigen',
  'help.guide.roadtrip-hazards.tip.3':
    'Die Feeds werden alle zehn Minuten aktualisiert und brauchen eine Internetverbindung. Wie die übrigen Fahreinstellungen gilt der Schalter pro Reise.',
  'help.ctx.trip-tours.bullet.6':
    'Routen ändern und Touren löschen kannst du im Tab „Touren“ unter „Touren dieser Reise“.',
  'help.guide.tour-show-list.tip.1':
    'Klickst du auf der Karte auf die Linie einer Tour, markiert die Liste diese Tour und scrollt zu ihr.',
  'help.guide.tour-add-to-day.step.3':
    '„Zu Tag 10 hinzugefügt“ bestätigt den Schritt, die Zeile bekommt ein Badge „Tag“, und in der linken Spalte erscheint die Tour unter dem Tag mit Zeit, Distanz und Aufstieg.',
  'help.guide.tour-day-times.title': 'Einer Tour an ihrem Tag eine Startzeit geben',
  'help.guide.tour-day-times.tip.3':
    '„Aus der Route nehmen“ im selben Menü lässt die Tour am Tag, nimmt sie aber aus der Tagesroute auf der Karte heraus. „Wieder in die Route aufnehmen“ macht das rückgängig.',
  'help.guide.tour-remove-from-day.tip.1':
    'Eine Mehrtagestour entfernst du Tag für Tag: Jeder Tag enthält seine eigene Etappe.',
  'help.guide.tour-filter-list.step.4':
    'Schließ das Menü. Der Button zeigt jetzt den Status, die Zahl der verbleibenden Touren und +1 für jeden weiteren Filter, den du gesetzt hast.',
  'help.guide.tour-hide-on-map.step.2':
    'Die Linie der Tour verschwindet von der Karte. Ihre Zeile bleibt abgeblendet in der Liste und zeigt weiter ein durchgestrichenes Auge („Auf der Karte einblenden“), mit dem du sie zurückholst.',
  'help.guide.tour-import-plan-tab.step.2':
    'Klick oben in der Liste auf „GPX oder KML importieren“ und wähl deine Dateien (GPX, KML oder KMZ).',
  'help.ctx.trip-tour-detail.bullet.2':
    'Im Kopf stehen die runde Kachel der Tour, ihr Name mit einem Stift zum Umbenennen, ein farbiger Punkt für die Farbe ihrer Linie und Pillen für Typ, Herkunft, geplante Zeit, Distanz, Aufstieg und Abstieg. Das X rechts schließt die Karte, ebenso Escape.',
  'help.guide.tour-detail-read.step.3':
    'Halt den Mauszeiger auf die Zeit, um zu sehen, wie sie sich zusammensetzt: Zeit in Bewegung, Pausen und geplante Gesamtzeit.',
  'help.guide.tour-detail-read.tip.4':
    'Die Karte ändert die Route nicht. Um einen Punkt zu verschieben oder einen Abschnitt neu zu zeichnen, öffne den Tab „Touren“ und klick unter „Touren dieser Reise“ auf die Tour.',
  'help.guide.tour-rename-colour.step.4':
    'Wähl eine Farbe. „Automatische Farbe“, das erste Feld, gibt der Linie ihre übliche Farbe zurück, und mit „Eigene Farbe wählen“, dem letzten, nimmst du eine beliebige Farbe. Die Linie auf der Karte und der Streifen in der Tourenliste passen sich sofort an.',
  'help.guide.tour-take-along.step.3':
    'Klick auf „GPX“, um die gespeicherte Tour als GPX-Datei herunterzuladen: die ganze Route mit allen vorhandenen Höhenangaben, bereit für eine Navigations-App oder ein GPS-Gerät.',
  'help.guide.tour-copy-keep.step.1':
    'Öffne die Tourkarte und klick unten auf „Kopieren“. TREK legt eine neue, unabhängige Tour ohne ihre Tage an, und das Original bleibt unverändert.',
  'help.guide.tour-copy-keep.result':
    'Die Reise hat jetzt eine zweite Tour, die du frei ändern kannst, und die Sammlung hat ihre eigene Kopie, die du in eine andere Reise übernehmen kannst.',
  'help.guide.tour-packing-link.tip.1':
    'Es ist nur eine Verknüpfung. Nichts wird kopiert oder verschoben, und die Einträge bleiben in „Listen“. Hakst du dort einen ab, zeigt die Tour das sofort.',
  'help.guide.tour-files.step.3': 'Klicke auf eine Datei, um sie zu öffnen.',
  'help.guide.tour-activity-link.step.3':
    'Wähl die Aufzeichnung unter „Spur“, oder klick auf „GPX importieren“, um eine neue Datei hinzuzufügen.',
  'help.guide.tour-activity-compare.goal':
    'Sehen, wo die tatsächliche Spur vom Plan abweicht, und sie ändern oder die Verknüpfung trennen.',
  'help.guide.tour-origin-check.title': 'Herkunft einer Tour prüfen',
  'help.guide.tour-origin-check.result':
    'Du weißt, woher die Tour stammt, wann sie hinzukam und ob sie noch unverändert ist.',
  'help.ctx.trip-tour-planner.bullet.6':
    'Ein ungespeicherter Entwurf bleibt erhalten: Öffnest du den Tab „Touren“ erneut, wird er wiederhergestellt und als „Ungespeicherter Entwurf wiederhergestellt“ markiert. „Zurück zu den Touren“ und „Verwerfen“ fragen nach, bevor sie Änderungen verwerfen.',
  'help.guide.tour-open-workspace.step.6':
    'Mit der Pille unten links wechselst du die Karte, anfangs zwischen „Karte“ und „Satellit“. Ist eine Tour geöffnet, bietet sie die passenden Karten für deren Typ an, etwa „Topo“ oder „Wandern“, und Schalter wie „Punkte setzen“ und „3D“.',
  'help.guide.tour-draw-route.step.1':
    'Klick oben in der linken Leiste auf „Neue Tour planen“. Die Leiste wird zu „Neue Tour“, einer Wanderung, solange du keinen anderen Typ wählst.',
  'help.guide.tour-draw-route.tip.3':
    'Hat ein Entwurf ungespeicherte Änderungen, fragt „Neue Tour planen“ im Menü „Tour hinzufügen“ zuerst nach: „Neue Tour beginnen?“, mit „Verwerfen und neu“.',
  'help.guide.tour-type-profile.step.4':
    'Die Route wird für das Profil neu geplant, und die „Tourenübersicht“ rechts zeigt ihre Distanz und Dauer.',
  'help.guide.tour-edit-points.step.3':
    'Um die Reihenfolge zu ändern, zeig auf eine Zeile und zieh sie am Griff, der an ihrem linken Rand erscheint.',
  'help.guide.tour-shaping-points.goal': 'Die Route auf einen anderen Weg ziehen, ohne einen Halt hinzuzufügen.',
  'help.guide.tour-shaping-points.result':
    'Die Route verläuft dort, wo du sie hingezogen hast, und die Halte sind nummeriert wie vorher.',
  'help.guide.tour-loop-reverse.tip.3':
    'Bei einer Wanderung sucht „Rundtour ab dem Start“ daneben nach Rundwanderungen in einer Länge, die du wählst.',
  'help.guide.tour-leg-by-hand.tip.1':
    'Einen von Hand gezeichneten Abschnitt hat kein Router geprüft: Er kann über Wasser, Privatgrund oder eine Felskante führen.',
  'help.guide.tour-trip-places.step.4':
    'In seiner Zeile steht unter dem Namen „Ort der Reise“. „Vom Ort lösen“ unter „Weitere Aktionen“ behält den Punkt, entfernt aber die Verknüpfung.',
  'help.guide.tour-details-times.step.2':
    'Schreib unter „Details“ eine Beschreibung und füg eine Webseite hinzu, falls es eine gibt.',
  'help.guide.tour-save.goal': 'Die gezeichnete Tour in der Reise speichern.',
  'help.guide.tour-save.result': 'Die Tour ist in der Reise gespeichert und kann auf einen Tag gelegt werden.',
  'help.guide.tour-edit-saved.tip.2':
    'Ein importierter GPX- oder KML-Track öffnet sich als „GPX-Tour“ zum Ansehen. Mit „Bearbeitbare Version planen“ machst du daraus eine Tour, die du ändern kannst.',
  'help.guide.tour-summary-profile.step.4':
    '„Höhenprofil einklappen“, der Pfeil neben dem Titel, klappt das Profil zu; ein weiterer Klick klappt es wieder auf.',
  'help.guide.tour-list-manage.step.2':
    'Zeig auf eine Tour und klick auf das runde Plus in ihrer Zeile („Zum Tag hinzufügen“), um die Tage der Reise einzublenden.',
  'help.guide.tour-delete.title': 'Tour löschen',
  'help.guide.tour-saved-elsewhere.title': 'Wenn die Tour anderswo gespeichert wurde',
  'help.guide.tour-saved-elsewhere.result': 'Keine Änderung geht verloren, ohne dass vorher jemand entschieden hat.',
  'help.guide.tour-import-gpx.title': 'GPX-, KML- oder KMZ-Datei als Tour importieren',
  'help.guide.tour-import-gpx.tip.2':
    'Jeder Track und jede Route in einer Datei wird zu einer eigenen Tour. Tracks werden nie zusammengeführt.',
  'help.guide.tour-view-import.step.2':
    'Die linke Spalte zeigt sie als „GPX-Tour“: die „Tourenübersicht“ mit Distanz, Höhen und aufgezeichneter Zeit, darunter das Höhenprofil. Auf der Karte erscheint ihre Linie.',
  'help.guide.tour-plan-from-import.step.1':
    'Öffne die importierte Tour im Tab „Touren“. Klick links in der Karte „Bearbeitbare Version“ auf „Bearbeitbare Version planen“.',
  'help.guide.tour-plan-from-import.result':
    'Die Tour hat jetzt Wegpunkte, die du ziehen kannst, und unter „Herkunft“ steht „Überplant, Originalspur gesichert“.',
  'help.guide.tour-restore-recorded.result': 'Die Tour ist wieder eine GPX-Tour und zeigt die aufgezeichnete Linie.',
  'help.guide.tour-take-over.step.6': 'Klick auf „Übernehmen“.',
  'help.guide.tour-import-wanderer.step.2':
    'Tipp deinen Suchbegriff in „Trails durchsuchen“. „In diesem Kartenausschnitt suchen“ zeigt nur die Trails, die in den sichtbaren Kartenausschnitt hineinreichen.',
  'help.ctx.trip-tour-map.title': 'Tourkarte',
  'help.guide.tour-map-layers.goal':
    'Auf der Karte planen, die sich für die Art der Tour am besten eignet: Höhenlinien für die Anstiege, markierte Wege oder Radrouten oder Luftbilder.',
  'help.guide.tour-along-search.title': 'Orte entlang einer Tour finden',
  'help.guide.tour-along-search.tip.1':
    'Änderst du die Route, die Arten oder die Entfernung, wird „Erneut suchen“ hervorgehoben und zeigt an, dass die Liste noch für die alte Route gilt. Klick darauf, um die Liste zu aktualisieren.',
  'help.guide.tour-along-add-stop.step.4':
    'Die Route wird über den Ort neu geplant, und „Entlang der Tour“ zeigt, wie viel Distanz und Zeit dazugekommen sind. „Rückgängig“ in derselben Zeile nimmt den Halt wieder heraus.',
  'help.guide.tour-3d-terrain.step.2':
    'Die Route ist nach Steigung eingefärbt. Klick in der Leiste unten auf „Steigung“, um sie stattdessen in der Farbe der Tour zu zeichnen, und noch einmal, um die Steigungsfarben zurückzuholen.',
  'help.guide.tour-3d-flyover.title': 'Eine Tour abfliegen',
  'help.guide.tour-3d-flyover.tip.2':
    'Der Flug startet erst, wenn die Landschaft entlang der ganzen Route geladen ist, damit er nie mittendrin auf eine Kachel warten muss. Halt den Mauszeiger auf den Ring, um den Ladefortschritt zu sehen.',
  'help.guide.tour-map-overlays.result':
    'Die Pisten oder Seezeichen werden über die Karte gelegt, und die Legende erklärt, wie du sie liest.',
  'help.ctx.trip-tour-stages.bullet.3':
    'Die „Tourenübersicht“ listet unter „Etappen“ jede Etappe auf, vom Halt, an dem sie beginnt, bis zu dem, an dem sie endet. Ein Klick auf eine Etappe wählt ihren letzten Halt aus und markiert die Stelle im Höhenprofil.',
  'help.guide.tour-multi-day.step.4':
    '„Wegpunkte“ ist jetzt in „Etappe 1“ und „Etappe 2“ aufgeteilt, jeweils mit Distanz und Zeit. Der Halt am Ende einer Etappe trägt einen Mond.',
  'help.guide.tour-stages-on-days.title': 'Mehrtagestour auf die Tage der Reise verteilen',
  'help.guide.tour-stages-on-days.tip.1':
    'Endet die Reise vor der letzten Etappe, zeigt die Auswahl, bis zu welcher Etappe die Tage reichen. Die Etappen danach bleiben ohne Tag.',
  'help.ctx.trip-tour-hike.bullet.2':
    '„Wegpunkte“ listet die Halte der Reihe nach. „Punkt hinzufügen“ ist von Anfang an aktiv, ein Klick auf die Karte setzt also den nächsten; mit „Reise-Orte“ daneben machst du eine Hütte oder ein Hotel der Reise zum Halt.',
  'help.guide.tour-hike-plan.step.2':
    'Öffne „Tourtyp“ und wähl „Wanderung“: zu Fuß, bis zu einer Schwierigkeit, die du festlegst.',
  'help.guide.tour-hike-plan.tip.3':
    '„Routenwahl“ unter der Schwierigkeit gewichtet den Weg: „Steigungen meiden“, „Treppen meiden“ und „Fähren meiden“. Gibt es keinen anderen Weg, führt die Route trotzdem dort entlang.',
  'help.guide.tour-hike-trail-details.step.5':
    'Klick auf „Belag“, um dieselbe Route nach dem Untergrund aufzuschlüsseln, von Asphalt bis Naturboden und Fels.',
  'help.guide.tour-hike-round.step.2':
    'Die Karte „Rundtour“ erscheint über der Landkarte. Prüf den Start unter „Von“ und gib die gewünschte „Distanz“ ein. Die Pille daneben zeigt, in welchem Bereich die Länge einer Runde liegen darf.',
  'help.guide.tour-hike-compare-ways.title': 'Alternative Wege für einen Abschnitt einer Wanderung vergleichen',
  'help.guide.tour-hike-compare-ways.tip.2':
    'Kennt der Router keinen anderen Weg, zeigt die Karte das an. Hält er sich nicht an den gewählten Weg, bleibt der Abschnitt unverändert, und die Karte weist dich darauf hin.',
  'help.guide.tour-ferrata-add.step.5':
    'Die „Tourenübersicht“ rechts zeigt das Badge „Klettersteig“ mit seiner Schwierigkeit, und oben im Editor erscheint die Warnung „Die Route führt über einen Klettersteig“.',
  'help.guide.tour-run-plan.step.1': 'Klick auf „Neue Tour planen“, öffne „Tourtyp“ und wähl „Lauf“.',
  'help.guide.tour-run-plan.tip.3': 'Sind deine Distanzen in Meilen, wird auch das Tempo pro Meile angegeben.',
  'help.guide.tour-run-ways.tip.1': 'Nichts hiervon ändert die Route oder die Zeit des Laufs.',
  'help.ctx.trip-tour-walk.bullet.5':
    '„Tour hinzufügen“ in „Touren dieser Reise“ liest eine Fußroute ein, die aus Google Maps geteilt wurde. Öffnest du einen Spaziergang im Tab „Planung“ von seinem Tag aus, kannst du seine Halte für diesen Tag abhaken.',
  'help.guide.tour-walk-plan.step.6':
    'Die „Tourenübersicht“ rechts zeigt „Gesch. Gehzeit“, „Aufenthalte“ und „Geplant“, die Summe aus beiden. Klick unten in der linken Spalte auf „Speichern“, um den Spaziergang zu behalten.',
  'help.guide.tour-walk-sights.step.2':
    'Das Thema füllt „Wonach suchen“ vor. Öffne es, um Arten an- oder abzuhaken, und leg unter „In diesem Abstand zur Route“ fest, wie weit gesucht wird.',
  'help.guide.tour-walk-day-times.title': 'Ankunfts- und Öffnungszeiten für den Tag sehen',
  'help.guide.tour-walk-day-times.tip.3':
    'Die Öffnungszeiten stammen aus OpenStreetMap oder vom Ort der Reise, für den ein Halt steht; die Pille daneben zeigt, woher. Prüf sie, bevor du losgehst.',
  'help.guide.tour-walk-google-import.step.4':
    'Klick auf „Als Walk laden“. TREK plant den Fußweg zwischen den Halten selbst. Klick auf „Speichern“, um den Spaziergang zu behalten.',
  'help.guide.tour-walk-check-off.step.2':
    'Scroll zu „Stationen“. Jeder Halt zeigt seine Aufenthaltsdauer und, wenn eine Startzeit gesetzt ist, wann du dort ankommst.',
  'help.ctx.trip-tour-bike.summary':
    'Eine Radtour, die im Editor im Tab „Touren“ geöffnet ist: das Profil, für das sie geroutet wird, ihre Fahrzeit, auf welchem Untergrund die Route verläuft und, bei einer Mountainbike-Tour, wie schwierig ihre Trails eingestuft sind.',
  'help.guide.tour-bike-profile.step.2': 'Öffne das Feld „Tourtyp“ und wähl „Radtour“.',
  'help.guide.tour-bike-profile.tip.3':
    'Führt kein für Räder befahrbarer Weg in die Nähe eines Punktes, steht in der Leiste „Kein Weg für Räder erreicht Punkt N“. Verschieb den Punkt, oder öffne „Weitere Aktionen“ am Punkt davor und wähl „Nächsten Abschnitt von Hand zeichnen“.',
  'help.guide.tour-bike-surfaces.step.4':
    'Klick unter „Wegart“ auf eine Zeile wie „Wirtschaftsweg“ oder „Straße mit Verkehr“, um zu sehen, wo die Route darauf verläuft.',
  'help.guide.tour-bike-mtb-grades.step.1':
    'Öffne die Radtour im Editor und prüf, ob „Profil“ auf „MTB“ steht. Trail-Schwierigkeiten werden nur bei diesem Profil ausgewertet.',
  'help.ctx.trip-tour-ski.title': 'Ski- & Wintertouren',
  'help.guide.tour-ski-plan.goal':
    'Einen Tag auf den Pisten, eine Langlaufrunde, eine Skitour oder eine Schneeschuhwanderung entlang der kartierten Pisten, Lifte und Wege planen.',
  'help.guide.tour-ski-plan.tip.2':
    'Der Info-Punkt neben „Disziplin“ erklärt, was TREK mit Skitouren macht. Weder dort noch sonst irgendwo hier gibt es Angaben zu Schnee, Lawinen oder dazu, ob Pisten, Lifte und Wege geöffnet sind.',
  'help.guide.tour-ski-options.step.3':
    'Wähl unter „Bevorzugen“ „Schnellste“, „Am meisten Skifahren“ oder „Am leichtesten“. Wähl unter „Tempo“ „Gemütlich“, „Normal“ oder „Sportlich“: Davon hängt ab, wie viel Zeit der Router für jede Abfahrt ansetzt.',
  'help.guide.tour-ski-fix-leg.goal':
    'Einen roten Abschnitt mit einem Klick planen lassen oder als gerade Linie zeichnen.',
  'help.guide.tour-ski-fix-leg.result':
    'Kein Abschnitt ist mehr rot: Jeder folgt den Pisten oder verläuft gerade zwischen seinen Punkten.',
  'help.guide.tour-ski-summary.tip.3':
    'Eine gespeicherte Tour öffnet sich so, wie sie gespeichert wurde. Verschieb einen Punkt oder ändere eine Option, um sie mit den aktuellen Pistendaten neu zu planen.',
  'help.guide.tour-ski-pistes-layer.tip.1':
    'Bleibt der Schalter blass und zeigt „Hineinzoomen, um die Pisten zu sehen“, zoom näher an das Skigebiet heran.',
  'help.guide.tour-ski-import.step.3':
    'Wähl die „Disziplin“ und bei „Langlauf“ die „Technik“. Bis dahin zeigt der Dialog „Wähle eine Disziplin, um den Track als Ski zu importieren“.',
  'help.ctx.trip-tour-paddle.title': 'Paddeltouren',
  'help.guide.tour-paddle-setup.title': 'Paddeltour planen',
  'help.guide.tour-paddle-setup.step.7':
    'Prüf, ob „Punkt hinzufügen“ aktiv ist, und klick dann auf die Karte: zuerst auf deine Einstiegsstelle, dann auf Punkte unterwegs und zuletzt auf deine Ausstiegsstelle.',
  'help.guide.tour-paddle-water-route.step.1':
    'Unter dem Punkt eines von Hand gezeichneten Abschnitts steht „Von Hand gezeichnet, nicht geroutet“ mit seiner Länge. TREK behält die Linie so, wie du sie gezeichnet hast.',
  'help.guide.tour-paddle-water-route.tip.4':
    'Solange ein Abschnitt nicht geplant ist, kannst du nicht speichern. Plane ihn auf dem Wasser oder zeichne ihn von Hand.',
  'help.guide.tour-paddle-portage.step.5':
    'Gib unter „Aus und ein“ die Minuten ein, die du zum Aussteigen, Ausladen und Wiedereinsetzen brauchst. Lässt du das Feld leer, werden 10 Minuten angesetzt.',
  'help.guide.tour-paddle-lock.step.2':
    'Wähl „Schleuse an diesem Punkt“. Unter dem Punkt erscheint eine Karte „Schleuse“ mit dem Hinweis „Zeit fehlt“.',
  'help.guide.tour-paddle-time.goal':
    'Sehen, wie sich die Zeit auf dem Wasser, das Tragen, die Schleusen und die Pausen zusammenrechnen, und eigene Werte festlegen.',
  'help.guide.tour-paddle-time.tip.3':
    'Pausen und eine eigene geplante Gesamtzeit legst du unter „Details“ fest. Mit eigener Gesamtzeit zeigt die Karte neben der Schätzung „Deine geplante Dauer“.',
  'help.guide.tour-paddle-wind.tip.1':
    'Vorhersagen gibt es nur für die nächsten 16 Tage. Bei einem späteren Tag steht dort, ab wann es eine gibt, bei einem vergangenen Tag, dass er vorbei ist.',
  'help.guide.tour-paddle-checklist.step.2':
    'Die Zeile darunter zeigt, wie aktuell die Daten sind: „OSM-Stand“ für den Stand von OpenStreetMap, „Abgerufen“ für den Zeitpunkt, zu dem TREK sie gelesen hat, und „Hindernisdaten“, falls sie nicht die ganze Route abdecken.',
  'help.guide.tour-paddle-checklist.tip.5':
    'Eine Prüfliste ist keine Sicherheits- oder rechtliche Freigabe. Eine Entscheidung hebt weder ein Verbot noch Privatgrund auf, die in OpenStreetMap verzeichnet sind.',
  'help.guide.tour-paddle-track-marks.step.5':
    'Klick auf „Umtragen“ und dann auf die Stellen der Linie, an denen du ausgestiegen und wieder eingesetzt hast.',
  'help.ctx.trip-tour-horse.summary':
    'Ein Ausritt wird nie geroutet. Er setzt sich aus Abschnitten der ausgeschilderten Reitrouten in OpenStreetMap zusammen, verbunden durch Strecken, die du von Hand zeichnest, oder er bleibt genau so, wie du ihn aufgezeichnet hast.',
  'help.guide.tour-horse-plan.step.1':
    'Hol das Gebiet, in dem du reiten willst, auf der Karte ins Bild und klick dann oben in der linken Spalte auf „Neue Tour planen“.',
  'help.guide.tour-horse-plan.tip.1':
    'Dass ein Weg eine Reitroute ist, heißt nicht, dass du dort reiten darfst. „Reitzugang“ zeigt nur, was in OpenStreetMap eingetragen ist; maßgeblich sind die Schilder vor Ort.',
  'help.guide.tour-horse-gap.step.2':
    'Schalte „Mit manuellem Abschnitt verbinden“ ein. Die Lücke wird als gerade, ungeprüfte Linie gezeichnet.',
  'help.guide.tour-horse-recorded.goal':
    'Einen Ritt importieren, den du mit einem GPS-Gerät oder einer App aufgezeichnet hast, und ihn genau so behalten, wie du geritten bist.',
  'help.guide.tour-horse-recorded.tip.3':
    'Du kannst die Datei auch an einer beliebigen Stelle im Tab „Touren“ ablegen, um dieselbe Vorschau zu öffnen.',
  'help.guide.create-trip.tip.3':
    'Unter „Reisebegleiter“ kannst du Leute hinzufügen, die hier schon ein Konto haben. Sie gehören zur Reise, sobald sie erstellt ist.',
  'help.guide.trip-reminder.step.1':
    'Klick auf den Stift auf der Karte der Reise. Bei einer neuen Reise findest du denselben Block im Formular „Neue Reise“.',
  'help.guide.company-holidays.tip.2':
    'Ein ganzer Betriebsferientag entfernt jeden Urlaub, der an diesem Tag schon eingetragen ist. So verbraucht niemand Urlaubsanspruch dafür.',
  'help.guide.half-company-holiday.tip.2':
    'Klick mit denselben Einstellungen noch einmal auf den Tag, um ihn zu löschen, oder mit ausgeschaltetem „Halbtag“, um daraus einen ganzen Betriebsferientag zu machen.',
  'help.guide.edit-holiday-calendar.step.1':
    'Öffne die Einstellungen. Den Kalender findest du unter „Feiertage“ oder „Schulferien“.',
  'help.guide.person-color.goal':
    'Dir selbst oder jemandem, mit dem du planst, eine Farbe geben, die sich besser unterscheiden lässt.',
  'help.guide.answer-fusion-request.tip.2':
    'Jeder von euch kann die Fusion später wieder auflösen, eure Einträge bleiben dabei erhalten.',
  'help.guide.log-for-partner.tip.2':
    'Die Person sieht die Änderung live, und ihre Zeile „Urlaubsanspruch“ wird sofort aktualisiert.',
  'help.guide.country-places.title': 'Alle Orte in einem Land anzeigen',
  'help.guide.tour-activity-stats.step.1':
    'Öffne in der Leiste unten auf der Karte den Tab „Touren“ neben „Statistik“ und „Wunschliste“.',
  'help.guide.tour-activity-stats.tip.2':
    'Verknüpfe in den Details der Tour mit „Ist-Track hinzufügen“ den Track, den du tatsächlich gegangen bist. Dann ersetzen seine aufgezeichneten Werte hier die geplanten. Eine Tour, die auf mehrere Tage verteilt ist, zählt nur einmal.',
  'help.ctx.collections.bullet.7':
    'Behaltene Touren: Touren, die du aus einer Reise behalten hast, stehen ganz oben in einer Liste, mit Schwierigkeitsgrad, Typ, der Reise, aus der sie stammen, und ihren Kennzahlen. „In eine Reise übernehmen“ macht daraus eine neue Tour, der Papierkorb entfernt sie aus der Liste.',
  'help.guide.move-to-list.title': 'Orte in eine andere Liste verschieben oder duplizieren',
  'help.guide.copy-to-trip.tip.2':
    'Orte, die schon in der Reise sind, werden übersprungen, und TREK zeigt dir, wie viele es waren.',
  'help.guide.accept-list-invite.tip.2':
    'Klick im Kopfbereich der Liste auf „Geteilt“, um ihre Mitglieder zu sehen. Mit „Liste verlassen“ trittst du dort wieder aus.',
  'help.guide.tour-collection-add-to-trip.goal':
    'Aus einer Tour, die in einer Liste gespeichert ist, eine neue Tour in einer deiner Reisen machen, mit oder ohne Wegpunkte.',
  'help.guide.tour-collection-add-to-trip.result':
    'Der Dialog bestätigt, dass die Tour jetzt zu dieser Reise gehört. „Reise öffnen“ bringt dich dorthin, mit „Schließen“ bleibst du in den Sammlungen.',
  'help.guide.tour-collection-manage.tip.3':
    'Behaltene Touren erscheinen nur in ihrer eigenen Liste, nicht unter „Alle gespeicherten“.',
  'help.guide.search-journey.step.3':
    'Klick auf einen Tag, um dorthin zu springen, oder auf seinen Pfeil, um die Einträge dieses Tages aufzulisten und einen davon auszuwählen.',
  'help.guide.journey-map-layers.goal':
    'Den Plan von dem unterscheiden, was wirklich passiert ist, und Ebenen ein- und ausblenden.',
  'help.guide.journey-keep-route.goal':
    'Die tatsächliche Strecke eines Tages aus Dawarich dauerhaft auf die Journey-Karte übernehmen.',
  'help.guide.journey-day-stays.goal':
    'Orte, an denen du dich laut Dawarich aufgehalten hast, einzeln in Einträge umwandeln.',
  'help.guide.journey-take-over-day.goal':
    'Die Aufenthalte eines Tages in einem Schritt in Entwurfseinträge oder einen Tagesbericht umwandeln.',
  'help.guide.journey-auto-prepare.title': 'Aufgezeichnete Tage von TREK vorbereiten lassen',
  'help.guide.photo-location.title': 'Einträge an den Aufnahmeort ihrer Fotos setzen',
  'help.ctx.settings-about.summary':
    'Was TREK ist, welche Version auf diesem Server läuft und wo du das Projekt findest: die Dokumentation, die Stelle zum Melden von Bugs und die Möglichkeiten, das Projekt zu unterstützen.',
  'help.guide.startup.tip.2':
    'Gehört der Start-Tab zu einem Add-on, das du ausgeschaltet hast, öffnet sich stattdessen die Planung.',
  'help.guide.web-push-device.title': 'Push-Benachrichtigungen auf diesem Gerät erhalten',
  'help.guide.connect-airtrail.tip.1': 'Die Karte erscheint nur, wenn der Admin das Add-on AirTrail eingeschaltet hat.',
  'help.guide.connect-dawarich.tip.1':
    'TREK schlägt Einträge, Orte und Länder nur vor: Nichts wird hinzugefügt, bevor du es bestätigst, und nichts wird an Dawarich zurückgeschrieben.',
  'help.guide.tour-connect-wanderer.tip.1':
    'Die Karte erscheint nur, wenn der Admin wanderer unter „Touren“ erlaubt hat.',
  'help.guide.tour-wanderer-watch.tip.1':
    'Ein Hinweis ändert nie eine Tour; was sich wirklich geändert hat, zeigt die Quellenprüfung der Tour.',
  'help.guide.api-keys.tip.3':
    'Schick den Schlüssel als Authorization: Bearer oder X-API-Key an /api/v1. Ein Konto kann bis zu 10 Schlüssel haben.',
  'help.guide.plugin-settings.step.2':
    '„Plugin-Aktivität“ listet jede Aktion, die ein Plugin in deinem Namen ausgeführt hat, die neueste zuerst; „Aktualisieren“ lädt die aktuellen Einträge.',
  'help.ctx.admin-github.bullet.3':
    'Über: Ko-fi, Buy Me a Coffee, Discord, „Bug melden“, „Feature vorschlagen“ und das Wiki.',
  'help.guide.default-user-settings.goal':
    'Allen Konten sinnvolle Einheiten, Farbmodus und Währung vorgeben, ohne dass jemand die Einstellungen öffnen muss.',
  'help.guide.default-map.step.3':
    'Jedes Feld wird gespeichert, sobald du es verlässt. Über den Link zum Zurücksetzen neben dem Feldnamen stellst du den Standardwert von TREK wieder her.',
  'help.guide.own-routing-engine.tip.2':
    'Ist nur deine eigene Routing-Instanz eingetragen, wird auch das öffentliche Valhalla nicht genutzt. Der Link zum Zurücksetzen neben einem Feld leert es wieder.',
  'help.guide.admin-passkeys.step.1':
    'Aktiviere im Tab „Einstellungen“ unter „Passkey-Anmeldung“ den Schalter „Passkey-Anmeldung aktivieren“.',
  'help.guide.storage-backends.step.4':
    '„Gesundheit“ oben listet fehlgeschlagene Schreibvorgänge auf ein Spiegelziel. Steht dort „Keine Replikatfehler aufgezeichnet“, ist alles in Ordnung.',
  'help.guide.channels-instance.tip.3':
    'Web Push braucht HTTPS. Auf iPhone und iPad müssen Nutzer TREK zuerst zum Home-Bildschirm hinzufügen.',
  'help.guide.notification-defaults.step.1':
    'Scroll im Tab „Benachrichtigungen“ ganz nach unten zu „Vorgaben für Nutzer“. Jede Zeile ist ein Ereignis, jede Spalte ein Kanal.',
  'help.ctx.notifications.bullet.1':
    'Die Glocke oben rechts zeigt, wie viele ungelesene Benachrichtigungen du hast. Klick darauf für die neuesten zehn und unten auf „Alle Benachrichtigungen anzeigen“ für diese Seite.',
  'help.guide.read-notifications.step.2':
    'Das Panel zeigt deine neuesten zehn. Jede sagt dir, wer was wo gemacht hat, ungelesene sind farbig hinterlegt.',
  'help.guide.filter-notifications.step.2': 'Klick unten im Panel auf „Alle Benachrichtigungen anzeigen“.',
  'help.guide.mark-notifications-read.tip.1':
    'Öffnest du eine Benachrichtigung über ihren Button, wird sie ebenfalls als gelesen markiert.',
  'help.guide.delete-notifications.tip.2':
    'Gelöschte Benachrichtigungen lassen sich nicht wiederherstellen. Willst du eine nur aus dem Blick haben, aber behalten, markier sie als gelesen und nutz „Ungelesen“.',
  'help.guide.notification-settings.tip.2':
    'Es gibt keine Einstellungen pro Reise: Ein Schalter gilt für alle deine Reisen.',
  'help.guide.link-journal.title': 'Ein Journal mit der Reise verknüpfen',
  'help.guide.link-journal.tip.2':
    'Wem du Zugriff gibst, der findet das Journal ab dann auch in seiner eigenen Journey-Liste.',
  'help.ctx.trip-places.bullet.8':
    'Ist Dawarich verbunden, stehen oben in der Liste unter „Aus Dawarich“ die Aufenthalte, die es während der Reise aufgezeichnet hat. „Als Ort hinzufügen“ macht aus einem Aufenthalt einen Ort, „Da war ich nicht“ legt ihn beiseite.',
  'help.guide.dawarich-stays.step.4':
    'War ein Aufenthalt kein Besuch, entfernst du ihn mit „Da war ich nicht“, dem x daneben. „Anzeigen … schon erledigt“ unten in der Liste zeigt, was du übernommen oder beiseitegelegt hast, und mit „Zurückholen“ holst du einen beiseitegelegten Aufenthalt zurück.',
  'help.guide.leave-stop-off-route.tip.1':
    'Den Eintrag gibt es nur bei Halten mit Koordinaten, und die Einstellung gilt nur für diesen Tag: Derselbe Ort an einem anderen Tag wird weiterhin in die Route einbezogen.',
  'help.guide.move-booking-day.title': 'Eine Buchung auf einen anderen Tag verschieben',
  'help.guide.place-image-from-file.step.4':
    'Das Foto ist jetzt das Bild des Ortes. Mit dem kleinen roten X in seiner Ecke entfernst du es wieder.',
  'help.guide.place-own-hours.step.2':
    'Trag unterhalb von „Webseite“ „Telefon“ und „E-Mail“ ein, soweit du sie kennst.',
  'help.guide.add-accommodation.tip.4':
    'Schneller geht es über das + im Tageskopf mit dem Tooltip „Zum Tag hinzufügen“: Dort findest du „Unterkunft hinzufügen“. Damit öffnet sich der Tag, und das Formular ist gleich offen.',
  'help.guide.confirm-stay-booking.goal':
    'Die Hotelbuchung zu einem Aufenthalt direkt vom Tag aus als bestätigt markieren.',
  'help.guide.map-whole-trip.tip.4':
    'Ob die ganze Reise angezeigt wird, speichert TREK pro Reise in deinem Konto. So öffnet sich die Reise auch in einem anderen Browser genauso.',
  'help.guide.tour-map-lines.step.3':
    'Öffne in der Tagesspalte einen Tag, an dem die Tour liegt, und sie wird Teil der Tagesroute: Die Route führt zum Start der Tour und geht an ihrem Ende weiter.',
  'help.guide.car-stops.goal':
    'Für einen Mietwagen oder dein eigenes Auto Abholung, Rückgabe und die Orte festlegen, an denen du unterwegs hältst.',
  'help.guide.car-stops.tip.1':
    'Einen eigenen Typ für Mietwagen gibt es nicht: Mietwagen und eigenes Auto sind beide ein „Auto“.',
  'help.guide.transport-details.result':
    'Die Planung ist am Tag der Fahrt geöffnet, ihre Linie ist auf der Karte eingezeichnet und das Routen-Symbol in ihrer Zeile eingeschaltet.',
  'help.guide.export-transports-csv.step.2':
    'Klick nach „Ansicht anpassen“ auf das Tabellen-Symbol mit dem Tooltip „Als Tabelle exportieren (CSV)“.',
  'help.guide.group-sort-bookings.title': 'Buchungen gruppieren und sortieren',
  'help.guide.group-sort-bookings.tip.2':
    'Im „Zeitstrahl“ findest du unter demselben Button „Eine Spur pro Typ“ und „Anderen Tab einblenden“.',
  'help.guide.booking-on-map.result':
    'Die Details schließen sich, und der Tab „Planung“ öffnet sich am Tag der Buchung, ihr Ort ist auf der Karte ausgewählt.',
  'help.guide.export-bookings-csv.step.1':
    'Willst du nur einen Teil des Tabs exportieren, grenz ihn vorher mit „Suchen“ oder „Filter“ ein. Die Datei enthält genau das, was der Tab anzeigt.',
  'help.guide.import-booking-file.tip.4':
    'Zum Auslesen einer Bestätigung brauchst du eine Verbindung. Offline weist „Importieren“ darauf hin, und du versuchst es noch einmal, sobald TREK wieder online ist.',
  'help.guide.arrange-packing-list.step.1':
    'Fass den Griff am linken Ende der Kopfleiste einer Liste an, vor ihrem Farbpunkt, und zieh die Liste auf eine andere Karte. Ein Rahmen in deiner Akzentfarbe zeigt, wo sie landet, und die Liste nimmt für alle in der Reise den Platz dieser Karte ein.',
  'help.guide.count-packed-pieces.title': 'Mehrere Exemplare eines Gegenstands packen',
  'help.guide.count-packed-pieces.tip.2':
    'Ist „Gepäck-Tracking“ eingeschaltet, zählt „Gepackt“ in der Karte „Gepäck“ nur die Stücke, die schon mitgezählt sind.',
  'help.guide.packing-bags.tip.4':
    'Tragen mehrere Leute eine Tasche, wird ihr Gewicht unter „Pro Person“ gleichmäßig auf sie verteilt. Solche Gewichte sind gepunktet unterstrichen und zeigen einen Hinweis dazu, wenn du mit der Maus darüberfährst.',
  'help.guide.expense-receipts.step.1':
    'Klick auf den Stift neben der Zeile der Ausgabe. Der Editor öffnet sich, weiter unten findest du „Belege & Rechnungen“.',
  'help.guide.expense-receipts.tip.3':
    'Zum Anhängen brauchst du eine Verbindung und die Berechtigung, Dateien hochzuladen, denn ein Beleg wird als Datei der Reise gespeichert.',
  'help.guide.files-sync-settings.title': 'Festlegen, in welche Richtung Dokumente übertragen werden',
  'help.guide.files-sync-settings.tip.1':
    'Eine Bahn bleibt immer aktiv: Ein Klick auf die einzige noch aktive Bahn ändert nichts.',
  'help.guide.manage-notes.title': 'Eine Notiz lesen, anheften und bearbeiten',
  'help.guide.manage-notes.tip.1':
    '„Erweitern“ steht nur im Menü, wenn die Notiz Text enthält. Mitglieder, die Collab nicht bearbeiten dürfen, sehen nur „Erweitern“.',
  'help.guide.note-categories.step.5':
    'Klick auf „Speichern“. Alle Notizen einer umbenannten oder umgefärbten Kategorie übernehmen die Änderung sofort, für alle Mitglieder. „Abbrechen“ verwirft deine Änderungen.',
  'help.guide.trip-chat.tip.5':
    'Der Chat zeigt die neuesten Nachrichten zuerst. Mit „Ältere Nachrichten laden“ ganz oben holst du die vorherigen dazu.',
  'help.guide.roadtrip-reorder.result':
    'Die Halte stehen dort, wo du sie abgelegt hast, und Distanz, Fahrzeit und Ankunftszeiten jedes betroffenen Tages werden neu berechnet.',
  'help.guide.roadtrip-overnight.goal':
    'Unterwegs einen Schlafplatz finden und die Übernachtung in die Fahrt einbuchen.',
  'help.guide.roadtrip-overnight.tip.2':
    'Stellst du eine gebuchte Nacht über „Bearbeiten“ in ihrer Karte wieder auf „Pause“, fragt TREK zuerst „Übernachtung aufheben?“. „Als Pause behalten“ entfernt die Nacht samt Buchung und allen damit verknüpften Ausgaben, der Halt bleibt aber Teil der Fahrt.',
  'help.guide.roadtrip-stop-fill.tip.2':
    'Wählst du den Wert, den der Halt schon hat, gilt für ihn ebenfalls wieder dein Standard.',
  'help.guide.roadtrip-bookings.tip.1':
    'Der Halt am Terminal wird um die Check-in-Zeit vor die Abfahrt laut Fahrplan gelegt: eine Stunde bei Flug oder Kreuzfahrt, eine halbe Stunde bei einer Fähre, zehn Minuten bei Zug oder Bus.',
  'help.guide.roadtrip-google-import.step.2':
    'Füg den Link einer Route ein, die du in Google Maps geteilt hast, und klick auf „Vorschau“.',
  'help.guide.roadtrip-hazards.goal':
    'Wetterwarnungen und Katastrophenmeldungen rund um deine Fahrt auf der Karte sehen.',
  'help.ctx.trip-tours.title': 'Touren im Plan',
  'help.guide.tour-show-list.title': 'Touren der Reise im Plan anzeigen',
  'help.guide.tour-show-list.tip.2':
    'Noch keine Touren? „GPX oder KML importieren“ oben in der Liste holt eine Datei herein, und mit „Neue Tour planen“ im Tab „Touren“ zeichnest du eine neue.',
  'help.guide.tour-add-to-day.step.4':
    'Oder zieh die Zeile aus der Liste auf einen Tag in der linken Spalte. Legst du sie zwischen zwei Halten ab, landet sie genau dort.',
  'help.guide.tour-day-times.goal':
    'Sehen, wann eine Tour endet und ob sie mit dem kollidiert, was an dem Tag als Nächstes kommt.',
  'help.guide.tour-day-times.tip.4':
    '„In Sammlung speichern“ im selben Menü legt die Tour samt Route in einer Sammlung ab, genau wie der Button „Sammlung“ auf der Karte.',
  'help.guide.tour-remove-from-day.tip.2':
    'In diesen Menüs und auf der Karte gibt es kein „Löschen“. Gelöscht wird eine Tour im Tab „Touren“, mit dem Papierkorb in ihrer Zeile unter „Touren dieser Reise“.',
  'help.guide.tour-filter-list.tip.1':
    '„Routing-Grenze“ ist die höchste Schwierigkeit, die bei der Planung der Route erlaubt war, nicht die auf dem Weg gemessene.',
  'help.guide.tour-hide-on-map.step.3':
    'Solange eine Tour ausgeblendet ist, steht über der Liste „Auf der Karte ausgeblendet“ mit der Anzahl. „Alle einblenden“ holt alle Touren auf einmal zurück.',
  'help.guide.tour-import-plan-tab.step.3':
    'Die Import-Vorschau zeigt jeden Track, bevor etwas gespeichert wird. Wähl unter „Importieren als“ den Typ („Wanderung“, „Radtour“ usw.) und klick dann auf „1 Tour importieren“.',
  'help.ctx.trip-tour-detail.bullet.3':
    'Darunter folgen „Reisetage“ mit einer Kachel für jeden Tag, an dem die Tour liegt, die Kennzahlen mit dem Höhenprofil und dann, soweit vorhanden: die Stationen eines Stadtspaziergangs, die Prüfpunkte und der Wind einer Paddeltour, „Ist-Track“, „Packliste“, „Beschreibung“, „Notizen“, „Herkunft“ und „Dateien“.',
  'help.guide.tour-detail-read.step.4':
    '„Reisetage“ zeigt für jeden Tag, an dem die Tour liegt, eine Kachel mit Datum. Steht dort „Noch an keinem Tag der Reise“, ist sie noch nicht eingeplant.',
  'help.guide.tour-detail-read.tip.5':
    'Auf dem Handy schiebt sich die Karte von unten ins Bild, zum Lesen und um die Tour mitzunehmen.',
  'help.guide.tour-rename-colour.tip.1':
    'Name und Farbe gehören zur Reise, also sehen sie alle Mitglieder. Willst du eine Tour nur auf deiner eigenen Karte ausblenden, ohne etwas für andere zu ändern, nutz das Auge in der Liste „Touren“.',
  'help.guide.tour-take-along.tip.1':
    'Auf Geräten, die Dateien teilen können, erscheint neben GPX auch „Teilen“ und gibt dieselbe Datei direkt an eine andere App weiter.',
  'help.guide.tour-copy-keep.step.2':
    'Die Kopie öffnet sich sofort, mit dem Namen des Originals und „(Kopie)“ dahinter. Klick auf den Stift, um ihr einen eigenen Namen zu geben.',
  'help.guide.tour-packing-link.title': 'Eine Tour mit der Packliste verknüpfen',
  'help.guide.tour-packing-link.tip.2':
    '„Ändern“ im Kopf des Abschnitts verknüpft die Tour mit einer anderen Liste. „Verknüpfung entfernen“ in diesem Dialog hebt die Verknüpfung auf, die Liste bleibt dabei unverändert.',
  'help.guide.tour-files.tip.1': 'Die Dateien gehören auch zur Reise und erscheinen deshalb auch im Tab „Dateien“.',
  'help.guide.tour-activity-link.step.4': 'Prüf unter „Ist“, was gemessen wurde, und klick dann auf „Verknüpfen“.',
  'help.guide.tour-activity-compare.step.1':
    'Öffne die Karte der Tour. „Planung und Ist“ stellt „Distanz“, „Aufstieg“, „Abstieg“ und „Zeit mit Pausen“ aus der Planung den Werten des Tracks gegenüber, samt „Unterschied“.',
  'help.guide.tour-origin-check.goal':
    'Herausfinden, ob eine Tour in TREK gezeichnet oder importiert wurde, aus welcher Datei sie stammt und ob sie seitdem geändert wurde.',
  'help.ctx.trip-tour-planner.title': 'Touren',
  'help.guide.tour-open-workspace.title': 'Im Tab „Touren“ zurechtfinden',
  'help.guide.tour-open-workspace.step.7':
    'Klick in der rechten Leiste auf eine Tour. Eine in TREK geplante Tour öffnet sich im Editor, ein importierter Track unverändert als „GPX-Tour“ zum Ansehen.',
  'help.guide.tour-draw-route.step.2':
    'Gib in „Ort oder Adresse suchen“ ein, wo die Tour beginnt, und wähl das Ergebnis. Die Karte springt dorthin.',
  'help.guide.tour-draw-route.tip.4':
    'Ein ungespeicherter Entwurf geht nicht verloren. Öffnest du den Tab „Touren“ der Reise erneut, wird er wiederhergestellt und mit „Ungespeicherter Entwurf wiederhergestellt“ gekennzeichnet.',
  'help.guide.tour-type-profile.tip.1':
    'Eine Typänderung ist ein Schritt im Verlauf: „Wegpunkt-Änderung rückgängig machen“ im Kopf der Leiste holt den alten Typ samt Route zurück.',
  'help.guide.tour-edit-points.step.4':
    'Oder öffne in der Zeile „Weitere Aktionen“ (die drei Punkte) und wähl „Wegpunkt nach oben verschieben“ oder „Wegpunkt nach unten verschieben“.',
  'help.guide.tour-shaping-points.step.1':
    'Klick auf der Karte an der Stelle auf die gezeichnete Route, an der sie anders verlaufen soll. Dort erscheint ein kleiner Punkt: ein Formpunkt.',
  'help.guide.tour-loop-reverse.title': 'Rundtour daraus machen oder Richtung umkehren',
  'help.guide.tour-loop-reverse.result':
    'Eine Runde, die dort endet, wo sie begonnen hat, oder dieselbe Tour in umgekehrter Richtung.',
  'help.guide.tour-leg-by-hand.tip.2':
    'Liegt ein Punkt an keinem Weg, erscheint ein Hinweis mit „Punkt zeigen“ und seiner Nummer. Verschieb den Punkt auf einen Weg oder zeichne den Abschnitt dorthin von Hand.',
  'help.guide.tour-trip-places.tip.1':
    'Ein Ort, der schon in der Tour ist, ist mit „In der Tour“ markiert und lässt sich nicht zweimal auswählen.',
  'help.guide.tour-details-times.step.3':
    'Gib unter „Pausen“ eine Dauer ein, etwa 0:45. Sie wird zur geschätzten Zeit addiert.',
  'help.guide.tour-save.step.1': 'Gib unter „Name der Tour“ einen Namen ein. Ohne Namen bleibt „Speichern“ ausgegraut.',
  'help.guide.tour-edit-saved.title': 'Eine gespeicherte Tour ändern',
  'help.guide.tour-edit-saved.tip.3':
    '„GPX herunterladen“ und „In einer Sammlung behalten“ im Kopf der Leiste funktionieren, sobald die Änderungen gespeichert sind.',
  'help.guide.tour-summary-profile.tip.1': 'Ein Klick auf den Titel der Karte klappt die ganze Übersicht ein.',
  'help.guide.tour-list-manage.step.3': 'Wähl den Tag. Die Tour wird dort eingeplant, und ihre Zeile zeigt den Tag an.',
  'help.guide.tour-delete.goal': 'Eine Tour endgültig aus der Reise entfernen.',
  'help.guide.tour-saved-elsewhere.goal':
    'Entscheiden, was passiert, wenn jemand anderes die Tour gespeichert hat, während du sie bearbeitet hast.',
  'help.ctx.trip-tour-import.title': 'Touren importieren',
  'help.guide.tour-import-gpx.goal':
    'Einen Track von einer GPS-Uhr, aus einer App oder aus Google Earth in eine Tour der Reise umwandeln und vor dem Speichern prüfen.',
  'help.guide.tour-import-gpx.tip.3':
    'Ein Track, den die Reise schon hat, ist als Schon in der Reise ausgegraut und wird übersprungen.',
  'help.guide.tour-view-import.step.3': '„Zurück zu den Touren“, der Pfeil oben links, schließt sie wieder.',
  'help.guide.tour-plan-from-import.step.2':
    'TREK übernimmt Kontrollpunkte aus dem Track und berechnet die Route neu. Auf der Karte ist der Import gepunktet und der Vorschlag durchgezogen eingezeichnet, und die Vergleichskarte zeigt die beiden Längen, den Anteil „Im Umkreis von 50 m“ um den Track und die „Größte Abweichung“.',
  'help.guide.tour-restore-recorded.title': 'Zum aufgezeichneten Track zurückkehren',
  'help.guide.tour-take-over.title': 'Eine Tour aus einer anderen Reise übernehmen',
  'help.guide.tour-take-over.tip.1':
    'Die Kopie ist eine eigenständige Tour: Sie liegt noch an keinem Tag, und spätere Änderungen am Original oder an der Kopie wirken sich nicht auf die jeweils andere aus. Unter „Herkunft“ steht die Reise, aus der sie übernommen wurde.',
  'help.guide.tour-import-wanderer.step.3':
    'Klick auf einen Trail. Er wird auf der Karte eingezeichnet, und die Spalte zeigt die Werte aus seiner GPX-Datei, seine Beschreibung und ob er in wanderer öffentlich oder privat ist.',
  'help.ctx.trip-tour-map.summary':
    'Die Karte in der Mitte des Tabs „Touren“ für die geöffnete Tour: die passenden Karten für ihren Typ, darübergelegte Pisten oder Seezeichen, die Orte entlang der Route und dieselbe Tour in 3D in der echten Landschaft.',
  'help.guide.tour-map-layers.step.1':
    'Öffne den Tab „Touren“ und klick rechts unter „Touren dieser Reise“ auf eine Tour. Sie öffnet sich im Planer, und der Button unten links auf der Karte listet die Karten auf, die es für diese Art von Tour gibt.',
  'help.guide.tour-along-search.goal':
    'Aussichtspunkte, Wasser, Hütten oder etwas zu essen in der Nähe der Route suchen, die du gerade planst.',
  'help.guide.tour-along-search.tip.2':
    'Bei einem Stadtspaziergang wählen vier Themen über der Liste die passenden Kategorien für dich aus.',
  'help.guide.tour-along-add-stop.result':
    'Die Tour führt jetzt am Ort vorbei, Distanz und Zeit sind in der „Tourenübersicht“ aktualisiert. Speichere die Tour, damit die Änderung erhalten bleibt.',
  'help.guide.tour-3d-terrain.step.3':
    'Klick rechts auf „Steigungsanteile“. Aufgeklappt zeigt es, wie viel der Tour unter 5 %, 5 bis 10 %, 10 bis 18 %, 18 bis 27 % und ab 27 % verläuft; zugeklappt zeigt es den höchsten Punkt und den steilsten Abschnitt.',
  'help.guide.tour-3d-flyover.goal':
    'Die ganze Tour vom Start bis zum Ziel ansehen, bevor du sie gehst, fährst oder auf Ski zurücklegst.',
  'help.guide.tour-3d-flyover.tip.3':
    'Ist der Flug pausiert, fahr am Höhenprofil entlang, und der Punkt springt an diese Stelle; „Flug abspielen“ setzt den Flug von dort fort.',
  'help.guide.tour-map-overlays.tip.1':
    'Die Pisten sind Kartendaten, kein Live-Bericht: Sie sagen nichts darüber, was geöffnet oder präpariert ist, und nichts über Schnee oder Lawinen. Bist du weiter herausgezoomt als das Skigebiet, steht am Schalter „Hineinzoomen, um die Pisten zu sehen“.',
  'help.ctx.trip-tour-stages.bullet.4':
    'In „Touren dieser Reise“ zeigt eine Mehrtagestour einen Mond mit der Zahl ihrer Etappen. Dieser Button, „Etappen zeigen“, klappt die Etappen mit ihrem jeweiligen Tag und die Summen für „Ganze Tour“ auf.',
  'help.guide.tour-multi-day.step.5':
    'Die „Tourenübersicht“ listet unter „Etappen“ jede Etappe auf. Klick auf eine, um zu sehen, wo sie endet: Ihr letzter Halt wird ausgewählt, und das Höhenprofil markiert die Stelle.',
  'help.guide.tour-stages-on-days.goal': 'Jede Etappe auf einen eigenen Tag legen oder die ganze Tour auf einen Tag.',
  'help.guide.tour-stages-on-days.tip.2':
    '„Ganze Tour an diesem Tag“ ist an einem Tag ausgegraut, an dem die Tour schon liegt. „Etappen ab diesem Tag“ funktioniert dort trotzdem und ersetzt die ganze Tour.',
  'help.ctx.trip-tour-hike.bullet.3':
    'Im Kopf der Karte „Wegpunkte“ liegen die Routenwerkzeuge: „Richtung umkehren“, „Zurück zum Start“ und bei Wanderungen „Rundtour ab dem Start“. Unter „Weitere Aktionen“ an einem Halt findest du „Wege für den nächsten Abschnitt vergleichen“.',
  'help.guide.tour-hike-plan.step.3': 'Gib unter „Name der Tour“ einen Namen ein.',
  'help.guide.tour-hike-plan.tip.4':
    'Die Gehzeit folgt der Regel für Wanderwegweiser (DIN 33466) und enthält keine Pausen. Trag sie in den Details unter „Pausen“ ein, dann erscheinen sie in der geplanten Gesamtzeit.',
  'help.guide.tour-hike-trail-details.result':
    'Du weißt, welche Abschnitte der Wanderung wie eingestuft sind, welchen Belag sie haben und wo sie auf der Karte liegen.',
  'help.guide.tour-hike-round.step.3':
    'Klick auf „Runden suchen“. Runde A, Runde B usw. erscheinen in der Liste und auf der Karte, jede in einer eigenen Farbe.',
  'help.guide.tour-hike-compare-ways.goal':
    'Sehen, welche anderen Wege eine Wanderung zwischen zwei Halten nehmen könnte, und einen davon übernehmen.',
  'help.guide.tour-hike-compare-ways.tip.3': '„Abbrechen“ schließt die Karte und lässt die Route unverändert.',
  'help.guide.tour-ferrata-add.result':
    'Die Wanderung führt auf ihrer eigenen Linie aus OpenStreetMap über den Klettersteig hinauf. Klick auf die Karte, um vom Ausstieg aus weiterzuplanen; der Router plant nur den Weg dorthin und von dort weiter.',
  'help.guide.tour-run-plan.step.2':
    'Wähl ein „Profil“: „Laufen“ für überwiegend befestigte Wege in der Stadt, in Parks und an Flüssen, „Trailrunning“ für Forstwege und naturbelassene Pfade.',
  'help.guide.tour-run-plan.tip.4': '„Trailrunning“ nutzt Pfade bis zum Bergweg (T2), nie schwierigere.',
  'help.guide.tour-run-ways.tip.2':
    'Stell das „Profil“ auf „Trailrunning“, damit die Route mehr naturbelassene Pfade nutzt, oder auf „Laufen“, damit sie auf festem Untergrund bleibt.',
  'help.guide.tour-walk-plan.title': 'Einen Stadtspaziergang von Halt zu Halt planen',
  'help.guide.tour-walk-plan.tip.1':
    'Der Ring um die Nummer eines Halts zeigt, wie wichtig er ist: durchgezogen für „Unbedingt besuchen“, gestrichelt für „Optional“. Ein kleines Schild markiert einen Halt, der auf „Geschützt“ steht.',
  'help.guide.tour-walk-sights.step.3':
    'Klick auf „Entlang der Tour suchen“. Ein Stern vor dem Namen markiert ein Highlight, also einen der bekanntesten Orte in der Gegend.',
  'help.guide.tour-walk-day-times.goal':
    'Wissen, wann du am Tag des Spaziergangs welchen Halt erreichst und welche Orte dann geschlossen sind.',
  'help.guide.tour-walk-day-times.tip.4':
    'Zwei Spaziergänge an einem Tag: Klick im Tab „Planung“ auf den Abschnitt dazwischen („Verkehrsmittel ändern“) und wähl „ÖPNV“. Die Suche startet dort, wo der erste Spaziergang endet, und zu der Zeit, zu der er endet, und warnt, wenn eine Verbindung erst nach dem Start des nächsten Spaziergangs ankommt.',
  'help.guide.tour-walk-google-import.tip.1':
    'Nur zu Fuß geplante Routen werden übernommen. Stell Google Maps auf „Zu Fuß“, bevor du die Route teilst.',
  'help.guide.tour-walk-check-off.step.3':
    'Klick bei einem Halt, den du gesehen hast, auf „Als besucht markieren“, oder bei einem, den du auslässt, auf „Überspringen“.',
  'help.ctx.trip-tour-bike.bullet.1':
    '„Profil“ unter „Tourtyp“ legt fest, für welche Art des Fahrens der Router plant: Touring, Rennrad, Gravel oder MTB. Die Zeile darunter erklärt, worauf der Router achtet, und wenn du das Profil änderst, wird die ganze Route neu geplant.',
  'help.guide.tour-bike-profile.step.3':
    'Wähl unter „Profil“ Touring, Rennrad, Gravel oder MTB. Die Zeile darunter erklärt, worauf der Router bei diesem Profil achtet.',
  'help.guide.tour-bike-profile.tip.4':
    '„Speichern“ bleibt ausgegraut, bis die Tour einen Namen hat und Route und Höhen berechnet sind.',
  'help.guide.tour-bike-surfaces.result':
    'Die Karte hebt die Abschnitte der gewählten Zeile hervor, und du weißt, auf welchem Untergrund die Route verläuft. Die Tour selbst bleibt unverändert.',
  'help.guide.tour-bike-mtb-grades.step.2':
    'Lies in der Karte „Belag und Wege“ die „Trail-Schwierigkeit (mtb:scale)“ ab: den Anteil der Route von „S0, keine besonderen Schwierigkeiten“ bis „S4 und mehr, Expertengelände“.',
  'help.ctx.trip-tour-ski.summary':
    'Eine Tour vom Typ „Ski & Winter“ im Tab „Touren“: ein Tag auf der Piste, eine Langlaufrunde, eine Skitour, eine Schneeschuhwanderung oder ein Winterspaziergang. Die Abschnitte folgen den Pisten, Liften und Wegen aus OpenStreetMap und werden vom Pisten-Router für deine Disziplin und deine Grenzen geplant. Ein aufgezeichneter Ski-Track wird mit seiner Disziplin importiert.',
  'help.guide.tour-ski-plan.step.1': 'Klick im Tab „Touren“ oben in der linken Leiste auf „Neue Tour planen“.',
  'help.guide.tour-ski-plan.tip.3':
    'Änderst du die Disziplin später, bleiben deine Punkte erhalten, und die Abschnitte werden mit den Optionen dieser Disziplin neu geplant.',
  'help.guide.tour-ski-options.step.4':
    'Nutz die Schalter „Lifte nutzen“, „Freeride-Routen erlauben“, „Bei Bedarf mit dem Lift ins Tal“ und „Vermutete Verbindungen meiden“. Bei „Langlauf“ kommen „Nur gespurte Loipen“ und „Nur beleuchtete Loipen“ dazu, bei „Skitour“ „Am Pistenrand aufsteigen“.',
  'help.guide.tour-ski-fix-leg.step.1':
    'Konnte der Router einen Abschnitt nicht planen, steht unter seinem Punkt eine rote Zeile mit dem Grund, zum Beispiel „Nur ein Lift, den du ausgelassen hast, verbindet diese Punkte“, und mit der betroffenen Piste oder dem betroffenen Lift.',
  'help.guide.tour-ski-summary.title': 'Die Pistenroute einer Skitour lesen',
  'help.guide.tour-ski-summary.tip.4':
    'Unten auf der Karte stehen die Skigebiete und das Datum der Kartendaten, mit denen die Tour geplant wurde.',
  'help.guide.tour-ski-pistes-layer.tip.2':
    'Laden die Pisten nicht mehr, zeigt der Schalter ein Warnsymbol. Karte und Route funktionieren trotzdem weiter.',
  'help.guide.tour-ski-import.step.4': 'Klick auf „1 Tour importieren“.',
  'help.ctx.trip-tour-paddle.summary':
    'Eine Kajak-, Kanu- oder SUP-Tour auf einem Fluss oder See. Sie nennt Boot und Gewässer, folgt dem Wasser, wo TREK die Daten dafür hat, rechnet Portagen und Schleusen in ihre Zeit ein und zeigt den Wind an dem Tag, an dem du paddelst, sowie das, was über Hindernisse unterwegs bekannt ist.',
  'help.guide.tour-paddle-setup.goal':
    'Eine Kajak-, Kanu- oder SUP-Tour anlegen und angeben, womit du paddelst, auf welchem Gewässer und wie schnell.',
  'help.guide.tour-paddle-setup.tip.1':
    'Steht „Boot“ auf „Andere“, gibt es keine vorgeschlagene Geschwindigkeit. Gib selbst eine ein, sonst bleibt die Zeit auf dem Wasser offen.',
  'help.guide.tour-paddle-water-route.step.2':
    'Soll ein Abschnitt auf dem Wasser geplant werden, zeig auf den Halt davor und klick auf „Weitere Aktionen“, die drei Punkte.',
  'help.guide.tour-paddle-water-route.result':
    'Jeder Abschnitt folgt dem Wasser oder ist bewusst von Hand gezeichnet, und bei einem Abschnitt, den TREK nicht planen konnte, steht der Grund dabei.',
  'help.guide.tour-paddle-portage.tip.1':
    'Willst du die Strecke doch paddeln, öffne am Punkt erneut „Weitere Aktionen“ und wähl „Diese Strecke wieder paddeln“. Sie wird dann wieder ein von Hand gezeichneter Abschnitt.',
  'help.guide.tour-paddle-lock.step.3': 'Klick auf die Karte „Schleuse“, um sie zu öffnen.',
  'help.guide.tour-paddle-time.step.1':
    '„Zeitschätzung“ findest du in der linken Spalte unter den Wegpunkten. Das Badge in der Kopfzeile zeigt die Gesamtzeit inklusive Pausen.',
  'help.guide.tour-paddle-time.result':
    'Die Schätzung berücksichtigt, was du eingegeben hast, und nennt, was noch fehlt.',
  'help.guide.tour-paddle-wind.tip.2':
    'Bei einer mehrtägigen Tour steht in der Kopfzeile der Karte für jeden Tag ein Chip „Tag“. Klick darauf, um diesen Tag anzuzeigen.',
  'help.guide.tour-paddle-checklist.step.3':
    'Die Einträge folgen der Route: Wehre, Schleusen, Stromschnellen, Einsatzstellen und Zugangsregeln aus OpenStreetMap sowie deine eigenen Portagen und Schleusen, markiert mit „Eigene“.',
  'help.guide.tour-paddle-checklist.result':
    'Für jeden Eintrag auf der Route hast du eine Entscheidung getroffen, und du hast den Sicherheitshinweis gelesen.',
  'help.guide.tour-paddle-track-marks.step.6':
    'Klick auf „Schleuse“ und dann auf die Stelle der Linie, an der die Schleuse liegt.',
  'help.ctx.trip-tour-horse.bullet.1':
    'Stell im Editor den „Tourtyp“ auf „Ausritt“, dann erscheint in der linken Spalte die Karte „Reitrouten“. „Im Kartenausschnitt suchen“ listet die Routen im aktuellen Kartenausschnitt auf.',
  'help.guide.tour-horse-plan.step.2':
    'Klick unter „Name der Tour“ auf das Feld „Tourtyp“ und wähl „Ausritt“. Unter „Wegpunkte“ erscheint die Karte „Reitrouten“.',
  'help.guide.tour-horse-plan.tip.2':
    'Für einen Ausritt berechnet TREK keine Reitzeit. Trag in den Details unter „Geplant“ eine ein, wenn der Ausritt eine Zeit im Tagesplan haben soll.',
  'help.guide.tour-horse-gap.step.3':
    'Klick auf „Abschnitt übernehmen“. Solange der Schalter nicht eingeschaltet ist, bleibt der Button ausgegraut.',
  'help.guide.tour-horse-recorded.step.1':
    'Klick in „Touren dieser Reise“ auf „Tour hinzufügen“ (das +), wähl „GPX oder KML importieren“ und dann die Datei deines Ausritts.',
  'help.guide.dateless-trip.title': 'Eine Reise ohne Datum planen',
  'help.guide.trip-reminder.step.2':
    'Wähl unter „Erinnerung“ 1, 3 oder 9 Tage. Für eine andere Vorlaufzeit klick auf „Individuell“ und gib eine Zahl zwischen 1 und 30 Tagen ein.',
  'help.guide.upcoming-reservations.title': 'Zu deinen nächsten Buchungen springen',
  'help.guide.half-company-holiday.title': 'Einen halben Betriebsferientag markieren',
  'help.guide.edit-holiday-calendar.step.2':
    'Klick auf das Farbquadrat, um eine neue Farbe zu wählen, oder gib ein neues Label ein und drück Enter.',
  'help.guide.person-color.step.1': 'Klick in der Karte „Personen“ auf den farbigen Punkt vor dem Namen.',
  'help.guide.answer-fusion-request.title': 'Eine Fusionsanfrage beantworten',
  'help.guide.log-for-partner.title': 'Tage für jemanden eintragen, mit dem du planst',
  'help.guide.dissolve-fusion.title': 'Gemeinsames Planen beenden',
  'help.guide.country-places.goal':
    'Die Orte anzeigen, die TREK einem Land zuordnet, um zu sehen, was du dort gemacht hast, oder einen Ort zu finden, der im falschen Land gelandet ist.',
  'help.guide.regions.tip.3':
    '„Zur Bucket List“ funktioniert auch bei Regionen. Sie werden dann genauso schraffiert wie ein Wunschland.',
  'help.guide.tour-activity-stats.step.2':
    'Wähl mit den beiden Auswahlfeldern links einen Zeitraum und einen Typ. „Zeitraum“ bietet „Gesamt“, „Dieses Jahr“, „Letzte 12 Monate“ und jedes frühere Jahr, in dem du Touren hast; „Typ“ beschränkt die Zahlen auf eine Tourart oder zeigt „Alle Typen“.',
  'help.guide.tour-activity-stats.tip.3':
    'Ein Tag mit eingetragenen Teilnehmern zählt nur für diese; ein Tag ohne Teilnehmer zählt für alle in der Reise. Der Tab zeigt Live-Daten und braucht eine Verbindung.',
  'help.guide.move-to-list.goal':
    'Deine Listen neu ordnen, indem du Orte zwischen ihnen verschiebst oder in eine zweite Liste kopierst.',
  'help.guide.accept-list-invite.result':
    'Die Liste erscheint in der Leiste unter „Geteilt“ und öffnet sich mit ihren Orten. Änderungen der anderen Mitglieder siehst du live.',
  'help.guide.tour-collection-add-to-trip.step.1':
    'Öffne die Liste. Behaltene Touren stehen ganz oben, über den Orten. Klick bei der Tour auf „In eine Reise übernehmen“ oder direkt auf die Zeile.',
  'help.guide.tour-collection-manage.title': 'Behaltene Touren finden und entfernen',
  'help.guide.tour-collection-manage.result':
    'Die Tour ist aus der Liste entfernt, und ein kurzer Hinweis bestätigt das.',
  'help.guide.entry-draft.title': 'Einen Eintrag als Entwurf speichern',
  'help.guide.journey-map-layers.step.1':
    'Oben auf der Karte zeigt die Ebenenleiste „Planung“, „Aufgezeichnet“, „Einträge“ und „Fotos“, jeweils mit Anzahl. Klick auf eine Ebene, um sie aus- oder einzublenden.',
  'help.guide.journey-keep-route.step.1':
    'Klick in der Kopfzeile des Tages auf den Dawarich-Button „Aufzeichnung übernehmen“.',
  'help.guide.journey-day-stays.step.1':
    'Hat ein Tag offene Aufenthalte, endet er mit einer Zeile wie „4 Aufenthalte aus Dawarich“ und dem Zeitraum. Klick darauf, um die Aufenthalte aufzuklappen.',
  'help.guide.journey-take-over-day.step.1':
    'Klick am Ende der Aufenthaltszeile des Tages auf „Tag übernehmen“ oder in der Kopfzeile des Tages auf den Listen-Button, der anzeigt, wie viele Aufenthalte warten.',
  'help.guide.journey-auto-prepare.goal':
    'Die Aufenthalte jedes Tages ohne Nachfrage zur Durchsicht vorbereiten lassen, solange eine Reise läuft.',
  'help.guide.photo-location.goal': 'Einträge auf die Karte bringen, ohne für jeden einzeln einen Ort zu suchen.',
  'help.ctx.settings-about.bullet.1': 'Neben dem Titel steht die Version, die auf diesem Server läuft.',
  'help.guide.readability.tip.3':
    '„Lesbarkeit“ ist als „Experimentell“ markiert. Sieht etwas seltsam aus, stellt „Auf Standard zurücksetzen“ unten im Tab alles wieder her.',
  'help.guide.web-push-device.goal':
    'TREK-Benachrichtigungen auf deinem Handy oder Computer erhalten, auch wenn TREK geschlossen ist.',
  'help.guide.connect-airtrail.tip.2':
    'Der Schlüssel wird verschlüsselt gespeichert und nie wieder angezeigt; Punkte im Feld bedeuten, dass einer gespeichert ist.',
  'help.guide.connect-dawarich.tip.2':
    'Unter den Buttons zeigt die Karte, wann TREK zuletzt geprüft hat und was deine Dawarich-Version nicht bietet.',
  'help.guide.tour-connect-wanderer.tip.2':
    'Liegt eine Instanz unter einer privaten Adresse, muss der Admin eventuell interne Netzwerke erlauben.',
  'help.guide.tour-wanderer-watch.tip.2':
    '„Pausiert bis“ bedeutet, dass wanderer nicht geantwortet hat; „Token abgelehnt“ bedeutet, dass das Token einen erfolgreichen Verbindungstest braucht oder ersetzt werden muss.',
  'help.guide.plugin-settings.result':
    'Das Plugin arbeitet mit deinen Einstellungen, und jeder Schritt, den es für dich ausführt, erscheint unter „Plugin-Aktivität“.',
  'help.ctx.admin-defaults.bullet.3':
    'Über den Link zum Zurücksetzen neben einem geänderten Feld stellst du den TREK-Standard wieder her. Die eigenen Einstellungen der Benutzer haben immer Vorrang.',
  'help.ctx.admin-settings.bullet.5': 'Gefahrenzone: „JWT-Secret erneuern“ meldet alle Benutzer ab, auch dich.',
  'help.guide.default-user-settings.step.1':
    'Wähl unter „Standard-Benutzereinstellungen“ den „Farbmodus“ (Hell, Dunkel oder Automatisch), „Temperatureinheit“, „Entfernungseinheit“, „Zeitformat“, „Woche beginnt am“, die „Anzeigewährung“ und ob „Buchungscodes verbergen“ auf „Ein“ oder „Aus“ steht. Jede Auswahl wird sofort gespeichert.',
  'help.guide.admin-passkeys.step.2':
    'Gib die „Relying Party ID (Domain)“ ein, etwa trek.example.org, und unter „Erlaubte Origins“ die Adressen, unter denen dein TREK erreichbar ist. Klick dann auf „Speichern“. Lässt du beide leer, wird APP_URL verwendet.',
  'help.guide.rotate-jwt-secret.title': 'Alle auf einmal abmelden',
  'help.guide.notification-defaults.step.2':
    'Klick auf eine Zelle, um sie weiterzuschalten: „An“, „Aus“, „Gesperrt“. Der Tooltip zeigt den nächsten Zustand, und jeder Klick wird sofort gespeichert.',
  'help.ctx.notifications.bullet.2':
    'Mit „Alle“ und „Ungelesen“ oben wechselst du zwischen allen Benachrichtigungen und nur den ungelesenen. Beim Scrollen lädt die Liste weitere nach.',
  'help.guide.read-notifications.step.3':
    'Klick auf den Button unter einer Benachrichtigung, hier „Vacay ansehen“, um zu öffnen, worum es geht. Damit wird sie auch als gelesen markiert.',
  'help.guide.filter-notifications.step.3':
    'Klick auf „Ungelesen“, um nur die ungelesenen Benachrichtigungen zu sehen. „Alle“ zeigt wieder sämtliche an.',
  'help.guide.mark-notifications-read.tip.2':
    'Als gelesen markieren ändert nur die Hervorhebung und die Anzahl. Die Benachrichtigung bleibt in der Liste, bis du sie löschst.',
  'help.guide.delete-notifications.result':
    'Die Benachrichtigung ist aus der Liste und aus dem Glockenmenü verschwunden.',
  'help.guide.notification-settings.result':
    'Die Einstellungen sind bei „Benachrichtigungen“ geöffnet, mit einem Schalter pro Ereignis und Kanal.',
  'help.guide.link-journal.goal':
    'Eines deiner Journey-Journale in der Reise anzeigen, für die Personen, die du auswählst.',
  'help.guide.link-journal.tip.3':
    'Später findest du in den Reiseeinstellungen unter „Tagebuch“ die Optionen „Zugriff bearbeiten“, „Journal wechseln“ und „Trennen“. Beim Trennen verschwindet der Tab; wen du im Journal selbst hinzugefügt hast, behält den Zugriff.',
  'help.guide.dawarich-stays.result':
    'Der Aufenthalt ist jetzt ein Ort der Reise, am gewählten Tag oder unter „Ungeplant“, und das Panel führt ihn als erledigt.',
  'help.ctx.trip-days.bullet.7': 'Solange die Reise läuft, öffnet sich der Plan beim heutigen Tag und scrollt dorthin.',
  'help.guide.leave-stop-off-route.tip.2':
    '„Aus Tag entfernen“ nimmt den Halt dagegen ganz aus dem Tag; „Aus der Route nehmen“ lässt ihn im Plan.',
  'help.guide.move-booking-day.goal':
    'Einen Transport oder eine Buchung direkt im Plan auf einen anderen Tag verschieben, ohne das Formular zu öffnen.',
  'help.guide.place-image-from-file.result':
    'Das Foto ist jetzt das Bild des Orts: in seiner Detailansicht, in der Ortsspalte, im Tag und auf der Karte.',
  'help.guide.place-own-hours.step.3':
    'Darunter zeigt „Öffnungszeiten“ die Woche, eine Zeile pro Tag. Hat TREK Zeiten für den Ort gefunden, sind sie schon eingetragen; andernfalls klick zuerst auf „Öffnungszeiten hinzufügen“. Gib für jeden Tag ein, wann geöffnet und wann geschlossen wird, und klick bei Tagen ohne Öffnung auf „Geschlossen“.',
  'help.guide.add-accommodation.tip.5':
    'GPX-Tracks und Tourorte werden nie als Unterkunft angeboten, nur normale Orte der Reise.',
  'help.guide.confirm-stay-booking.step.1':
    'Öffne den Tag, an dem du eincheckst. In der Karte der Unterkunft steht unter „Reservierung“ die Hotelbuchung, die mit der Übernachtung angelegt wurde, mit „Ausstehend“ oder „Bestätigt“. Klick auf dieses Feld.',
  'help.guide.tour-map-lines.step.4':
    'Um eine Tour von der Karte zu nehmen, stell die rechte Spalte auf „Touren“, fahr mit der Maus über die Tour und klick auf das Auge, „Auf der Karte ausblenden“. Linie und Pin verschwinden von der Karte, die Zeile bleibt abgeblendet in der Liste, mit einem durchgestrichenen Auge, „Auf der Karte einblenden“, das die Tour zurückholt.',
  'help.guide.car-stops.step.1':
    'Klick im Kopf des Tages, an dem du das Auto abholst, auf das + (Tooltip „Zum Tag hinzufügen“) und wähl „Transport hinzufügen“.',
  'help.guide.car-stops.tip.2':
    '„Nach oben“ und „Nach unten“ erscheinen erst, wenn die Fahrt mindestens zwei Stopps hat.',
  'help.guide.transport-details.title': 'Einen Transport öffnen und seine Details nutzen',
  'help.guide.transport-details.tip.1':
    'Klickst du bei einer Fahrt, deren Linie angezeigt wird, noch einmal auf „Auf Karte“, wird die Linie wieder ausgeblendet.',
  'help.guide.export-transports-csv.result':
    'Dein Browser speichert eine Datei, die nach der Reise benannt ist, etwa herbst-in-japan-transports.csv, mit einer Zeile pro Fahrt: Typ, Titel, Status, Start, Ende, Von, Bis, Ort, Bestätigung und Notizen.',
  'help.guide.group-sort-bookings.goal':
    'Die Karten oder die Liste nach Status, Tag oder Typ anordnen, in der Reihenfolge, die du möchtest.',
  'help.guide.booking-on-map.tip.1':
    '„Auf Karte“ gibt es nur bei Buchungen mit einem Ort. Wähl im Formular unter „Ort / Aktivität“ einen aus, dann erscheint der Button.',
  'help.guide.export-bookings-csv.step.2':
    'Öffne „Ansicht anpassen“ (das Regler-Symbol neben den Ansichts-Icons) und wähl unter „Sortieren nach“ eine Reihenfolge. Die Zeilen folgen dieser Reihenfolge, eine Zeile pro Buchung und ohne Abschnitte.',
  'help.guide.edit-booking.tip.4':
    'Hast du etwas geändert und klickst versehentlich neben das Formular oder drückst Escape, fragt TREK „Änderungen verwerfen?“. Mit „Weiter bearbeiten“ kommst du zurück zum Formular.',
  'help.guide.arrange-packing-list.step.2':
    'Innerhalb einer Liste ziehst du einen Eintrag am Griff links in der Zeile nach oben oder unten. Eine Linie in deiner Akzentfarbe am linken Rand einer Zeile zeigt, wo er landet.',
  'help.guide.count-packed-pieces.goal': 'Einem Eintrag eine Menge geben und beim Packen Stück für Stück mitzählen.',
  'help.guide.count-packed-pieces.tip.3': 'Bei einer Menge von eins gibt es keinen Zähler; dann reicht das Kästchen.',
  'help.guide.expense-receipts.step.2':
    'Klick neben „Belege & Rechnungen“ auf „Anhängen“ und wähl das Foto oder das PDF; du kannst auch mehrere auf einmal wählen. Jede Datei erscheint unter der Überschrift, mit einem Papierkorb, um sie wieder zu entfernen.',
  'help.guide.files-sync-settings.goal':
    'Festlegen, ob Dokumente nur aus deinem Speicher geholt, nur dorthin übertragen oder in beide Richtungen abgeglichen werden, und was passiert, wenn ein Dokument gelöscht oder an beiden Stellen geändert wird.',
  'help.guide.files-sync-settings.tip.2':
    'Bei „Mich fragen“ wartet ein Dokument, das an beiden Stellen bearbeitet wurde, unter „Braucht einen Blick“ unterhalb der Karte. Klick auf „Lösen“ und wähl „Die TREK-Version behalten“, „Die Version des Anbieters behalten“ oder „Beide behalten“.',
  'help.guide.manage-notes.goal':
    'Eine Notiz vollständig öffnen, die wichtigste oben halten und Veraltetes korrigieren oder entfernen.',
  'help.guide.manage-notes.tip.2':
    'Beim Bearbeiten löscht das rote Kreuz an einer bereits angehängten Datei diese sofort, noch bevor du auf „Speichern“ klickst, und sie landet nicht im Papierkorb. Alle Dateien einer Notiz findest du auch im Tab „Dateien“ der Reise.',
  'help.guide.note-categories.step.6':
    'Zurück in der Karte „Notizen“ filtern die Chips unter der Kopfzeile die Karten. Klick auf eine Kategorie, um nur ihre Notizen zu sehen; „Alle“ oder ein erneuter Klick auf denselben Chip zeigt wieder alle.',
  'help.guide.roadtrip-reorder.tip.1':
    'Verschiebst du hier einen Halt, verschiebt er sich auch im Tagesplan: „Tage“ zeigt dieselbe Reihenfolge.',
  'help.guide.roadtrip-overnight.step.1':
    'Hak in „Auf der Strecke“ unter „Gesucht wird“ die Option „Unterkunft“ an (oder „Campingplatz“ für einen Stellplatz), wähl den Tag, an dem du anhalten willst, und klick auf „Suchen“.',
  'help.guide.roadtrip-overnight.tip.3':
    'Ist in den „Fahreinstellungen“ unter „Routenlinie“ die Option „Jeden Tag an der Unterkunft beginnen und beenden“ eingeschaltet, startet die Fahrt am nächsten Tag dort, wo du übernachtet hast.',
  'help.guide.roadtrip-stop-fill.title': 'Für einen Halt angeben, wie voll es dort ist',
  'help.guide.roadtrip-bookings.title': 'Flug, Zug oder Fähre unterwegs rechtzeitig erreichen',
  'help.guide.roadtrip-bookings.tip.2':
    'Ein an einem Halt gebuchter Tisch oder ein Ticket erscheint als Badge an diesem Halt; was zu keinem Halt gehört, steht unter „Außerdem an diesem Tag gebucht“.',
  'help.guide.roadtrip-google-import.step.3':
    'Prüf die gefundenen Halte. Bei jedem steht, wo er liegt; ein Halt mit dem Hinweis „Ort nicht aufgelöst“ wird übersprungen.',
  'help.guide.roadtrip-hazards.step.1': 'Öffne „Fahreinstellungen“ in der rechten Spalte.',
  'help.ctx.trip-tours.summary':
    'Die rechte Spalte des Tabs „Planung“ im Modus „Touren“: alle Touren der Reise in einer Liste, neben den Tagen. Hier legst du Touren auf Tage, filterst die Liste, blendest Linien auf der Karte aus und importierst GPX- oder KML-Dateien. Routen zeichnest und änderst du im Tab „Touren“.',
  'help.guide.tour-show-list.goal':
    'Statt der Ortsspalte die Touren der Reise anzeigen, um sie neben den Tagen zu sehen und auszuwählen.',
  'help.guide.tour-show-list.tip.3':
    'Ist das Add-on Touren eingeschaltet, erscheinen Tracks nie in der Ortsliste: Jeder importierte Track ist eine Tour und steht hier.',
  'help.guide.tour-add-to-day.step.5':
    'Bei einer Tour mit Etappen folgt im selben Menü eine weitere Frage. „Etappen ab diesem Tag“ legt Etappe 1 auf diesen Tag und jede weitere Etappe auf den jeweils nächsten Tag; „Ganze Tour an diesem Tag“ legt die komplette Tour auf diesen einen Tag.',
  'help.guide.tour-day-times.step.1':
    'Fahr in der Tagesspalte mit der Maus über die Zeile der Tour, klick auf „Weitere Optionen“ (die drei Punkte) und wähl „Bearbeiten“.',
  'help.guide.tour-day-times.result':
    'Die Tour steht mit Start und Ende im Zeitstrahl des Tages, wie jeder Halt mit Uhrzeit.',
  'help.guide.tour-remove-from-day.result':
    'Der Tag führt die Tour nicht mehr, und ihre Zeile in der Liste hat kein Badge „Tag“ mehr.',
  'help.guide.tour-filter-list.tip.2':
    'Ein Abschnitt erscheint nur, wenn sich die Touren darin unterscheiden; bei einer kurzen Liste gibt es deshalb vielleicht nur „Status“.',
  'help.guide.tour-hide-on-map.tip.1':
    'Das Ausblenden gilt nur für dich und wird in diesem Browser für diese Reise gespeichert: Tour, Tage und Farbe bleiben unverändert, und auf den Karten der anderen bleibt die Tour sichtbar.',
  'help.guide.tour-import-plan-tab.tip.1':
    'Ein Track, der schon in der Reise ist, wird als „Schon in der Reise“ markiert und nicht doppelt importiert.',
  'help.ctx.trip-tour-detail.bullet.4':
    'Die Leiste unten: „Zum Tag hinzufügen“ oder „Vom Tag entfernen“, solange ein Tag geöffnet ist, „Navigation“ zum Start, die Webseite der Tour, „GPX“, „Teilen“, wenn dein Gerät Dateien teilen kann, „Sammlung“ und „Kopieren“.',
  'help.guide.tour-detail-read.step.5':
    'Darunter folgen die Werte: „Distanz“, „Niedrigster Punkt“, „Höchster Punkt“, „Aufstieg“ und „Abstieg“, darunter die Zeiten und das Höhenprofil in der Farbe der Tourlinie.',
  'help.guide.tour-detail-read.result':
    'Die Karte der Tour ist neben dem Plan geöffnet, und du siehst, an welchen Tagen sie liegt, wie lang und wie steil sie ist und woher sie stammt.',
  'help.guide.tour-rename-colour.tip.2':
    'Stift und Punkt funktionieren nur für Mitglieder, die Orte bearbeiten dürfen.',
  'help.guide.tour-take-along.tip.2':
    'Wählst du in den Einstellungen eine bevorzugte Karten-App, öffnet „Navigation“ direkt diese App, statt eine Auswahl anzuzeigen.',
  'help.guide.tour-copy-keep.step.3':
    'Um eine Tour für andere Reisen aufzuheben, öffne sie und klick unten in ihrer Karte auf „Sammlung“.',
  'help.guide.tour-packing-link.goal':
    'Direkt in der Karte einer Tour zeigen, was du dafür einpacken musst, aus der Packliste der Reise oder einer ihrer Listen.',
  'help.guide.tour-packing-link.tip.3':
    'Zum Verknüpfen brauchst du das Recht, Orte zu bearbeiten. Alle anderen sehen die verknüpfte Liste, können die Verknüpfung aber nicht ändern.',
  'help.guide.tour-files.tip.2': '„Hochladen“ sehen nur Mitglieder, die die Tour ändern und Dateien hinzufügen dürfen.',
  'help.guide.tour-activity-link.step.5':
    'Der Track steht jetzt unter „Ist-Track“, mit eigenen Werten und eigenem Profil neben der Planung.',
  'help.guide.tour-activity-compare.step.2':
    '„Größter Abstand zur Planung“ zeigt, wie weit der Track von der geplanten Linie abwich, und „Abseits der Planung“, wie viel davon neben dieser Linie verlief.',
  'help.guide.tour-origin-check.step.1':
    'Öffne die Karte der Tour und scroll zu „Herkunft“. „Quelle“ zeigt, woher sie stammt: „GPX-Import“ mit dem Dateinamen, KML- oder KMZ-Import oder wanderer mit seiner Adresse.',
  'help.ctx.trip-tour-planner.summary':
    'Der Tourenplaner der Reise: links der Editor, rechts alle Touren der Reise und dazwischen die Karte. Hier zeichnest du eine Tour Punkt für Punkt, lässt sie entlang echter Wege und Straßen routen, ergänzt die Details und speicherst sie in der Reise.',
  'help.guide.tour-open-workspace.goal': 'Den Tourenplaner öffnen und verstehen, wofür die einzelnen Bereiche da sind.',
  'help.guide.tour-open-workspace.tip.1':
    '„Einklappen“ am Reiter am inneren Rand jeder Leiste klappt sie weg und schafft mehr Platz für die Karte; „Planung“ und „Touren dieser Reise“ holen die Leisten zurück. Zieh am Rand einer Leiste, um sie breiter oder schmaler zu machen.',
  'help.guide.tour-draw-route.step.3':
    'Prüf, ob „Punkt hinzufügen“ unter „Wegpunkte“ eingeschaltet ist (das ist derselbe Schalter wie „Punkte setzen“ in der Leiste auf der Karte), und klick dann auf die Stelle der Karte, an der die Tour beginnt.',
  'help.guide.tour-draw-route.result':
    'Eine nummerierte Route auf der Karte und ihre Punkte unter „Wegpunkte“, bereit zum Benennen und Speichern.',
  'help.guide.tour-type-profile.tip.2':
    'Manche Typen brauchen weitere Angaben, bevor du sie speichern kannst: ein „Lauf“ die „Geplante Pace“, eine „Paddeltour“ Boot und Gewässer, eine Tour „Ski & Winter“ die Disziplin.',
  'help.guide.tour-edit-points.step.5': '„Wegpunkt entfernen“, der Papierkorb daneben, nimmt den Punkt aus der Tour.',
  'help.guide.tour-shaping-points.step.2':
    'Zieh den Punkt auf den Weg, den die Route nehmen soll. Die Route wird dann über diesen Punkt neu geplant.',
  'help.guide.tour-loop-reverse.goal': 'Die Tour zum Startpunkt zurückführen oder in umgekehrter Richtung gehen.',
  'help.guide.tour-leg-by-hand.title': 'Einen Abschnitt von Hand zeichnen oder neu planen',
  'help.guide.tour-leg-by-hand.result':
    'Der Abschnitt verläuft dort, wo du es gewählt hast, als gerade Linie und ist als von Hand gezeichnet markiert, oder er wird neu geroutet.',
  'help.guide.tour-trip-places.tip.2':
    'Entfernst du den Halt oder löst die Verknüpfung, bleibt der Ort unverändert in der Reise, samt seinen Tagen.',
  'help.guide.tour-details-times.step.4':
    '„Geplant“ zeigt die Gesamtzeit. Gib einen eigenen Wert ein, um sie zu überschreiben; sie wird dann als „Manuell angepasst“ markiert.',
  'help.guide.tour-save.step.2':
    'Warte, bis der Punkt neben „Neue Tour“ verschwunden ist. Zum Speichern müssen die Route und alle Höhenangaben vorliegen.',
  'help.guide.tour-edit-saved.goal': 'Eine früher geplante Tour öffnen, ändern und erneut speichern.',
  'help.guide.tour-edit-saved.result': 'Die gespeicherte Tour enthält deine Änderungen.',
  'help.guide.tour-summary-profile.tip.2':
    'Führt eine Route über einen Klettersteig, erscheint über den Zahlen ein Warn-Badge mit dessen Schwierigkeitsgrad.',
  'help.guide.tour-list-manage.step.4':
    'Der Button über „Umfang der Reise“ ist der Filter. Er zeigt den gewählten Status, anfangs „Alle“, und die Zahl der Touren.',
  'help.guide.tour-delete.step.1':
    'Fahr unter „Touren dieser Reise“ mit der Maus über die Tour und klick rechts in ihrer Zeile auf den Papierkorb („Löschen“ mit dem Namen der Tour).',
  'help.guide.tour-saved-elsewhere.step.1':
    'Während du bearbeitest, erscheint oben in der Leiste „Diese Tour wurde woanders gespeichert“. Deine Änderungen bleiben erhalten, bis du dich entscheidest.',
  'help.ctx.trip-tour-import.summary':
    'Touren, die es schon anderswo gibt, holst du hier in die Reise: eine GPX-, KML- oder KMZ-Datei von einer Uhr oder App, eine Tour aus einer deiner anderen Reisen oder einen Trail aus deinem eigenen wanderer. Ein Import bleibt genau so erhalten, wie er aufgezeichnet wurde, und du kannst daraus eine bearbeitbare Version planen.',
  'help.guide.tour-import-gpx.step.1':
    'Öffne den Tab „Touren“ der Reise. Klick rechts oben in „Touren dieser Reise“ auf das + („Tour hinzufügen“).',
  'help.guide.tour-import-gpx.tip.4':
    'Bei einer KML- oder KMZ-Datei steht unter „Nicht importiert“ außerdem, was sie neben den Linien enthielt: Pins, Flächen und andere Elemente.',
  'help.guide.tour-view-import.tip.1':
    'Einen Import kannst du nicht Punkt für Punkt bearbeiten. Mit „Bearbeitbare Version planen“ in der Karte „Bearbeitbare Version“ darüber machst du daraus eine Tour, die du ändern kannst.',
  'help.guide.tour-plan-from-import.step.3':
    'Klick auf „Import ersetzen“, um diese Tour direkt neu zu planen: Tage und Notizen bleiben erhalten, und der aufgezeichnete Track wird aufbewahrt, damit du zu ihm zurückkehren kannst. „Als neue Tour planen“ lässt den Import unverändert und legt daneben eine zweite Tour an.',
  'help.guide.tour-restore-recorded.goal':
    'Einen überplanten Import rückgängig machen und den ursprünglichen Track zurückholen, auch lange danach.',
  'help.guide.tour-take-over.goal':
    'Eine Tour, die du in einer anderen Reise schon geplant oder importiert hast, wiederverwenden, ohne sie neu zu zeichnen.',
  'help.guide.tour-take-over.tip.2':
    'Es werden nur deine anderen Reisen angezeigt, und nur die ersten 100 Touren. Mit Suche oder Filter findest du die übrigen.',
  'help.guide.tour-import-wanderer.step.4': 'Klick auf „In die Reise importieren“.',
  'help.ctx.trip-tour-map.bullet.1':
    'Die Leiste unten links auf der Karte enthält die Grundkarten, die der Typ der geöffneten Tour anbietet: „Karte“, „Topo“, „Wandern“ bei einer Wanderung, „Fahrrad“ bei einer Radtour und „Satellit“. Diese Auswahl gilt nur im Planer und ändert nie die Karteneinstellung in den Einstellungen.',
  'help.guide.tour-map-layers.step.2':
    'Klick auf „Topo“ für Höhenlinien und Schummerung, also die Karte, die zeigt, wie steil das Gelände ist. Die gewählte Karte bleibt in der Leiste hervorgehoben.',
  'help.guide.tour-along-search.step.1':
    'Öffne eine Tour im Tab „Touren“ und scroll im linken Bereich nach unten zu „Entlang der Tour“, unter den Halten der Tour. Dieser Abschnitt erscheint, sobald die Tour eine Route hat.',
  'help.guide.tour-along-search.tip.3':
    'Die Ergebnisse stammen aus OpenStreetMap und dem Ortsindex von TREK, deshalb braucht die Suche eine Verbindung. Wird nichts gefunden, sucht „Erweitern auf“ im nächstgrößeren Umkreis; ist ein Server ausgelastet, zählt „Erneut versuchen“ herunter, bis sich ein neuer Versuch lohnt.',
  'help.guide.tour-along-add-stop.tip.1':
    'Der Ort wird ein Halt der Tour, kein Ort der Reise, und erscheint deshalb nicht in der Ortsliste.',
  'help.guide.tour-3d-terrain.step.4':
    'Zieh den Regler „Relief“, um die Hügel bis zu dreimal so hoch darzustellen; das hilft bei flachem Gelände.',
  'help.guide.tour-3d-flyover.step.1':
    'Schalte die Tour auf 3D. Während die Landschaft entlang der Route lädt, füllt sich an der Stelle des Abspielbuttons ein Ring; ist er voll, klick auf „Flug abspielen“. Die Kamera folgt einem Punkt entlang der Route, und der Cursor im Höhenprofil der „Tourenübersicht“ läuft mit.',
  'help.guide.tour-map-overlays.title': 'Pisten oder Seezeichen auf der Karte einblenden',
  'help.guide.tour-map-overlays.tip.2':
    'Der Pisten-Schalter ist auch ohne geöffnete Tour da, sodass du dir ein Skigebiet ansehen kannst, bevor du etwas planst. Bei einer Wanderung bietet die Leiste stattdessen „Klettersteige“ an, mit der Zahl der Routen im Ausschnitt.',
  'help.ctx.trip-tour-stages.bullet.5':
    'Das Plus in der Zeile einer Tour, „Zum Tag hinzufügen“, verteilt die Etappen ab dem gewählten Tag auf die Reise, eine pro Tag, oder legt die ganze Tour auf diesen einen Tag.',
  'help.guide.tour-multi-day.step.6':
    'Um wieder eine Tagestour daraus zu machen, klick auf „Tagestour“ und bestätige „Zur Tagestour machen?“ mit „Etappenenden entfernen“. Die Route bleibt, wie sie ist.',
  'help.guide.tour-stages-on-days.step.1':
    'Fahr in „Touren dieser Reise“ mit der Maus über die Mehrtagestour und klick auf das Plus, „Zum Tag hinzufügen“.',
  'help.guide.tour-stages-on-days.tip.3':
    'Ziehst du eine Mehrtagestour im Tab „Planung“ auf einen Tag, kommt dieselbe Frage in einem Dialog, ebenso bei „Zum Tag hinzufügen“ in der Karte der Tour.',
  'help.ctx.trip-tour-hike.bullet.4':
    '„Wegdetails“ unter den Wegpunkten liest für jeden Abschnitt den SAC-Grad, den Belag und die Wegart aus OpenStreetMap und färbt die Route auf der Karte danach ein. Die Tour selbst ändert sich dadurch nicht.',
  'help.guide.tour-hike-plan.step.4':
    '„Punkt hinzufügen“ ist von Anfang an eingeschaltet: Klick auf die Karte, wo die Wanderung beginnt und wo sie endet. Mit „Reise-Orte“ daneben wählst du stattdessen eine Hütte oder ein Hotel der Reise. Ab zwei Punkten berechnet TREK die Wanderroute.',
  'help.guide.tour-hike-trail-details.title': 'Schwierigkeit, Belag und Wegart entlang einer Wanderung ansehen',
  'help.guide.tour-hike-trail-details.tip.1':
    'Wege, für die OpenStreetMap keinen Wert hat, stehen unter „Unbekannt“, und unbekannt heißt nicht leicht. Steht bei manchen „Diesmal nicht abfragbar“, klick auf „Erneut versuchen“.',
  'help.guide.tour-hike-round.step.4':
    'Klick auf eine Runde, um sie auszuwählen. Ihre Zeile zeigt Distanz, Anstieg und Zeit und wie weit sie von deiner Wunschdistanz abweicht.',
  'help.guide.tour-hike-compare-ways.step.1':
    'Fahr mit der Maus über den Halt, an dem der Abschnitt beginnt, klick in seiner Zeile auf „Weitere Aktionen“ und wähl „Wege für den nächsten Abschnitt vergleichen“.',
  'help.guide.tour-ferrata-add.title': 'Einen Klettersteig in eine Wanderung einbauen',
  'help.guide.tour-ferrata-add.tip.1':
    'Ein Klettersteig erfordert Ausrüstung und Erfahrung. Der Tooltip des Badges zeigt, wie viel der Route über den Klettersteig führt.',
  'help.guide.tour-run-plan.step.3':
    'Gib unter „Geplante Pace“ Minuten und Sekunden pro Kilometer ein, zum Beispiel 7:30.',
  'help.guide.tour-run-ways.title': 'Sehen, auf welchem Untergrund ein Lauf verläuft',
  'help.ctx.trip-tour-walk.title': 'Stadtspaziergang',
  'help.guide.tour-walk-plan.goal':
    'Einen Sightseeing-Spaziergang aus Halten zusammenstellen, mit der Aufenthaltsdauer an jedem Halt und dem Hinweis, welche davon wichtig sind.',
  'help.guide.tour-walk-plan.tip.2':
    'Ein Stadtspaziergang hat kein Wanderlimit und kein Feld „Pausen“: Die Aufenthalte übernehmen diese Rolle.',
  'help.guide.tour-walk-sights.step.4':
    'Klick in der Liste auf einen Ort. Seine Detailkarte öffnet sich über der Karte: Wähl unter „Wo es hinkommt“ die beiden Halte, zwischen denen er eingefügt wird.',
  'help.guide.tour-walk-day-times.step.1':
    'Leg den Spaziergang auf einen Tag: Klick in „Touren dieser Reise“ auf das runde + in seiner Zeile („Zum Tag hinzufügen“) und wähl den Tag.',
  'help.guide.tour-walk-day-times.result':
    'Du kannst Halte umsortieren oder Aufenthalte ändern, bis jeder Ort bei deiner Ankunft geöffnet hat.',
  'help.guide.tour-walk-google-import.tip.2':
    '„Anderen Link nehmen“ bringt dich zurück zum Eingabefeld. Das Laden ersetzt ungespeicherte Änderungen im Planer; der Dialog warnt dich vorher.',
  'help.guide.tour-walk-check-off.step.4':
    'Oben in der Liste siehst du, wie viele Halte du besucht hast und wie lange du noch zu Fuß unterwegs bist. „Zurücknehmen“ an einem Halt macht die Markierung rückgängig.',
  'help.ctx.trip-tour-bike.bullet.2':
    'Die „Tourenübersicht“ rechts zeigt die „Fahrzeit (geschätzt)“: die vom Router für das Profil berechnete Zeit, Anstiege eingerechnet. Pausen sind nicht enthalten.',
  'help.guide.tour-bike-profile.step.4':
    'Klick unter „Wegpunkte“ auf „Reise-Orte“ und wähl Start und Ziel, hier Hotel Alpenroyal und dann Hotel Greif. Du kannst auch prüfen, ob „Punkt hinzufügen“ eingeschaltet ist, und auf die Karte klicken. Ab zwei Punkten berechnet TREK die Route.',
  'help.guide.tour-bike-profile.tip.5':
    'Hat ein Admin die Karte CyclOSM freigegeben, bietet die Kartenauswahl bei geöffneter Radtour auch „Fahrrad“ an. Lädt sie nicht mehr, wechsle zu „Karte“. Die Tour bleibt unverändert.',
  'help.guide.tour-bike-surfaces.tip.1':
    '„Nicht in den Daten“ bedeutet, dass OpenStreetMap dort keinen Belag erfasst hat. Der Belag ist unbekannt, nicht automatisch gut.',
  'help.guide.tour-bike-mtb-grades.step.3':
    'Klick auf die Zeile eines Schwierigkeitsgrads, um die passenden Trails auf der Karte hervorzuheben.',
  'help.ctx.trip-tour-ski.bullet.1':
    'Zuerst kommt die „Disziplin“, und nichts ist vorausgewählt: „Alpin“, „Snowboard“, „Langlauf“, „Skitour“, „Schneeschuh“ oder „Winterwandern“. Bei „Langlauf“ wird außerdem die „Technik“ abgefragt: „Klassisch“, „Skating“ oder „Unbekannt“. Ohne Disziplin lässt sich die Tour nicht speichern.',
  'help.guide.tour-ski-plan.step.2': 'Öffne „Tourtyp“ und wähl „Ski & Winter“.',
  'help.guide.tour-ski-plan.tip.4':
    'Wo die Pistendaten nicht ausreichen, verläuft ein Abschnitt als gerade Linie zwischen seinen Punkten. Bei Schneeschuh und Winterwandern kann er stattdessen über Sommerwege führen; darauf weist ein grauer Hinweis am Abschnitt hin.',
  'help.guide.tour-ski-options.step.5':
    'Klick unter „Auslassen“ auf jede Liftart, die du nicht nutzen willst: „Schlepplifte“, „Offene Sessellifte“, „Gondelbahnen“, „Seilbahnen“ oder „Standseilbahnen und Züge“. Ausgewählte Liftarten werden durchgestrichen.',
  'help.guide.tour-ski-fix-leg.step.2':
    'Klick auf die Lösung, die die Zeile vorschlägt: „Schwerere Pisten erlauben“, „Diesen Lift erlauben“, „Mit dem Lift ins Tal“, „Technik wechseln“ oder „Disziplin wechseln“. Die Einstellung ändert sich, und der Abschnitt wird neu geplant.',
  'help.guide.tour-ski-summary.goal': 'Sehen, wie sich der Tag auf Abfahrten, Lifte, Warten und Gehen verteilt.',
  'help.guide.tour-ski-summary.result':
    'Du weißt, wie viel Zeit du an dem Tag auf den Pisten, in den Liften und beim Anstehen verbringst.',
  'help.guide.tour-ski-pistes-layer.tip.3':
    'Die Ebene zeigt kartierte Daten, keinen Live-Bericht: Sie sagt nichts darüber, was geöffnet oder präpariert ist, und nichts über Schnee oder Lawinen. Der Schalter ist auch ohne geöffnete Tour da, sodass du dir ein Skigebiet ansehen kannst, bevor du planst.',
  'help.guide.tour-ski-import.step.5':
    'Klick in „Touren dieser Reise“ auf den Track, um ihn zu öffnen. Um die Disziplin später zu korrigieren, klick in seiner Karte „Skistrecke“ auf „Ändern“.',
  'help.ctx.trip-tour-paddle.bullet.1':
    'Unter „Tourtyp“ verlangt „Paddeltour“ ein „Boot“ (Kajak, Kanadier, SUP oder Andere) und das „Gewässer“ (Fluss oder See). Erst wenn beides gewählt ist, lässt sich die Tour speichern.',
  'help.guide.tour-paddle-setup.step.1': 'Klick im Tab „Touren“ oben in der linken Spalte auf „Neue Tour planen“.',
  'help.guide.tour-paddle-setup.tip.2':
    'Die Karte einer Paddeltour bietet „Karte“ und „Satellit“ sowie „Seezeichen“ von OpenSeaMap als Overlay.',
  'help.guide.tour-paddle-water-route.step.3':
    'Wähl „Nächsten Abschnitt auf dem Wasser planen“. TREK plant den Abschnitt von diesem Punkt bis zum nächsten entlang des Flusses oder Sees.',
  'help.guide.tour-paddle-portage.title': 'Das Boot um ein Hindernis herumtragen',
  'help.guide.tour-paddle-portage.tip.2':
    'Am letzten Punkt wartet „Ab hier umtragen“ auf den nächsten Punkt, den du setzt. Die Zeile zeigt dann „Umtragen ab hier“, und ihr Kreuz, „Doch nicht umtragen“, macht es rückgängig.',
  'help.guide.tour-paddle-lock.step.4':
    'Gib die Minuten für „Warten“ und „Durchfahrt“ ein. Sobald beide eingetragen sind, zeigt die Schleusenkarte die Summe.',
  'help.guide.tour-paddle-time.step.2':
    'Der Streifen zeigt die Route vom Start bis zum Ziel: das Wasser, die Umtragestellen in Braun und die Schleusen als Striche. Hindernisse auf der Route sind Markierungen, die du anklicken kannst, um sie auf der Karte zu finden.',
  'help.guide.tour-paddle-wind.title': 'Den Wind für einen Paddeltag prüfen',
  'help.guide.tour-paddle-wind.tip.3':
    'An einem windigen Tag mit Seequerung bietet die Windkarte „Ufernah planen“ an; damit führt die Route über die Seen am Ufer entlang.',
  'help.guide.tour-paddle-checklist.step.4':
    'Klick auf einen Eintrag. Die Karte springt dorthin: Bei einem Hindernis öffnet sich seine Karte mit deiner Entscheidung, bei einer eigenen Umtragestelle oder Schleuse wird ihr Punkt ausgewählt.',
  'help.guide.tour-paddle-track-marks.title':
    'Umtragestellen und Schleusen auf einem aufgezeichneten Paddeltrack markieren',
  'help.guide.tour-paddle-track-marks.step.7': 'Öffne die Karten, gib die Minuten ein und klick auf „Speichern“.',
  'help.ctx.trip-tour-horse.bullet.2':
    'Eine Route öffnet sich in einem eigenen Dialog: Wähl einen Abschnitt und die „Richtung“, in der du ihn reitest, prüf den „Reitzugang“ und klick dann auf „Abschnitt übernehmen“.',
  'help.guide.tour-horse-plan.step.3':
    'Klick in der Karte „Reitrouten“ auf „Im Kartenausschnitt suchen“. Dort erscheinen alle ausgeschilderten Reitrouten im Ausschnitt mit ihrer Länge.',
  'help.guide.tour-horse-plan.tip.3':
    'Hast du die Karte nach einer Suche verschoben, heißt der Button „Diesen Ausschnitt durchsuchen“. Ist der Ausschnitt zu groß, wirst du gebeten, zuerst hineinzuzoomen.',
  'help.guide.tour-horse-gap.step.4':
    'In der Karte „Wegpunkte“ steht bei der Verbindung „Manuell, ungeprüft“ und ihre Länge. Fahr mit der Maus darüber, um den Grund zu sehen.',
  'help.guide.tour-horse-recorded.step.2':
    'Die „Import-Vorschau“ öffnet sich, gespeichert ist noch nichts. Stell unter „Importieren als“ den „Tourtyp“ auf „Ausritt“. Drei Badges zeigen, was der Import übernimmt und was er nicht berechnet.',
  'help.guide.dateless-trip.goal': 'Mit der Planung anfangen, bevor du weißt, wann du reist.',
  'help.guide.trip-reminder.step.3': 'Klicke auf Aktualisieren.',
  'help.guide.upcoming-reservations.goal':
    'Über alle deine Reisen hinweg sehen, was als Nächstes gebucht ist, und die zugehörige Reise öffnen.',
  'help.guide.log-day.tip.3':
    'Einen Tag, der ganz als Betriebsferientag markiert ist, kannst du nicht eintragen. An einem halben Betriebsferientag zählt ein Urlaubstag nur 0,5.',
  'help.guide.half-company-holiday.goal':
    'Allen einen freien Nachmittag geben, zum Beispiel an Heiligabend, ohne gleich den ganzen Tag freizugeben.',
  'help.guide.public-holidays.tip.2': 'Fahre im Raster mit der Maus über einen Feiertag, um seinen Namen zu sehen.',
  'help.guide.edit-holiday-calendar.step.3':
    'Ändere in den Auswahllisten das Land oder die Region, oder klicke auf den Mülleimer, um den Kalender zu entfernen.',
  'help.guide.person-color.step.2': 'Wähle eine Farbe. Sie wird sofort gespeichert, und der Dialog schließt sich.',
  'help.guide.answer-fusion-request.goal':
    'Entscheiden, ob du deinen Urlaubsplan mit jemandem zusammenführst, der dich eingeladen hat.',
  'help.guide.log-for-partner.goal':
    'Einen freien Tag für eine Person eintragen, die mit deinem Plan fusioniert ist, zum Beispiel wenn sie dich darum bittet.',
  'help.guide.dissolve-fusion.goal': 'Einen fusionierten Plan wieder in getrennte Pläne aufteilen.',
  'help.guide.country-places.step.1':
    'Suche ein Land, in dem du warst, und wähle es aus. Im Panel unten erscheint seine Karte.',
  'help.guide.tour-activity-stats.step.3':
    'Lies die Zahlen ab: die Distanz, in ihrer Ecke die Zahl der Touren, dann Aufstieg und Abstieg. Bei „Alle Typen“ folgen die drei Typen, die du am häufigsten gemacht hast, jeweils mit Anzahl und Distanz.',
  'help.guide.move-to-list.step.1': 'Klicke in der Filterzeile auf das Häkchen-Icon „Wählen“ und hake die Orte an.',
  'help.guide.tour-collection-add-to-trip.step.2':
    'Wähle unter „In die Reise“ die Reise aus. Reisen, denen du keine Touren hinzufügen darfst, sind ausgegraut.',
  'help.guide.tour-collection-manage.goal':
    'Sehen, welche Touren eine Liste enthält und woher sie stammen, und die aussortieren, die du nicht mehr brauchst.',
  'help.guide.entry-draft.goal':
    'Einen Eintrag schon jetzt schreiben und ihn aus der geteilten Journey heraushalten, bis er fertig ist.',
  'help.guide.journey-map-layers.step.2':
    'Klicke auf das (i) am Ende der Leiste, um die Kartenlegende zu öffnen: Sie erklärt jeden Pin, jeden Punkt und jede Linie.',
  'help.guide.journey-keep-route.step.2':
    'Prüfe „Zeitzone des Tages“, die festlegt, wann der Tag beginnt und endet, und sieh dir die Aufzeichnung an: Distanz, Zeitspanne, Teilstücke und Lücken.',
  'help.guide.journey-day-stays.step.2':
    'Klicke bei einem Aufenthalt auf „Tagebucheintrag schreiben“. Der Eintrag wird an diesem Tag zur Ankunftszeit angelegt, mit dem Namen und der Position des Aufenthalts.',
  'help.guide.journey-take-over-day.step.2':
    'Hake die Aufenthalte an, die du behalten willst, und korrigiere ihre Namen. „Zu einem Eintrag verbinden“ zwischen zwei angehakten Aufenthalten fasst sie zusammen, „Getrennt lassen“ trennt sie wieder.',
  'help.guide.journey-auto-prepare.step.1':
    'Klicke oben rechts in der Kopfzeile auf ⋯, um die Journey-Einstellungen zu öffnen.',
  'help.guide.photo-location.step.1':
    'Klicke oben rechts in der Kopfzeile auf ⋯, um die Journey-Einstellungen zu öffnen.',
  'help.guide.share-public.tip.3':
    'Entwürfe erscheinen nie über den Link, und aufgezeichnete Strecken sind nur an Tagen mit einem veröffentlichten Eintrag zu sehen.',
  'help.ctx.settings-plugins.title': 'Plugin-Einstellungen',
  'help.ctx.settings-about.bullet.2':
    '„Bug melden“ und „Feature vorschlagen“ öffnen das Projekt auf GitHub; „Wiki“ führt zur Dokumentation.',
  'help.guide.map-provider.tip.3':
    'Auf einer GL-Karte drehst und kippst du die Karte, indem du mit der rechten Maustaste ziehst; ein Klick mit der mittleren Maustaste fügt einen Ort hinzu.',
  'help.guide.web-push-device.step.1':
    'Klicke unter „Push-Benachrichtigungen auf diesem Gerät“ auf „Für dieses Gerät einschalten“ und erlaube Benachrichtigungen, wenn der Browser fragt. Mit „Test senden“ prüfst du, ob eine ankommt.',
  'help.guide.connect-airtrail.title': 'Deine AirTrail-Instanz verbinden',
  'help.guide.connect-dawarich.title': 'Deine Dawarich-Instanz verbinden',
  'help.guide.tour-connect-wanderer.title': 'Deine wanderer-Instanz verbinden',
  'help.guide.tour-connect-wanderer.tip.3': '„Trennen“ rechts entfernt das Token wieder.',
  'help.guide.tour-wanderer-watch.tip.3':
    'Über welche Kanäle dich die Hinweise erreichen, legst du unter Benachrichtigungen in der Zeile „wanderer: Hinweise zu deinen Trails“ fest.',
  'help.guide.plugin-settings.tip.1':
    'Diese Einstellungen gehören nur dir; andere Mitglieder richten das Plugin für sich selbst ein.',
  'help.guide.offline-conflicts.step.3':
    'Änderungen, die der Server wiederholt ablehnt, erscheinen unter „Offline-Cache“ als „Fehlgeschlagene Änderungen“: „Erneut versuchen“ sendet sie noch einmal, „Verwerfen“ behält die Version auf dem Server.',
  'help.ctx.admin-notifications.bullet.4':
    '„Vorgaben für Nutzer“ ganz unten: pro Ereignis und Kanal An, Aus oder Gesperrt für alle, die die Einstellung nicht selbst geändert haben.',
  'help.guide.default-user-settings.step.2':
    'Neben dem Namen eines Feldes, das du festgelegt hast, erscheint ein Link zum Zurücksetzen; er stellt den eingebauten Standardwert von TREK wieder her.',
  'help.guide.own-routing-engine.title': 'Eigene Routing-Server nutzen',
  'help.guide.admin-passkeys.result':
    'Auf der Anmeldeseite gibt es „Mit Passkey anmelden“, und alle können in ihren Einstellungen Passkeys hinzufügen.',
  'help.guide.rotate-jwt-secret.goal': 'Nach einem vermuteten Leak alle Sitzungen beenden.',
  'help.guide.notification-defaults.result':
    'Wer eine Zelle nicht selbst geändert hat, startet mit deiner Auswahl, und gesperrte Zellen erscheinen in den Einstellungen der Nutzer als gesperrt.',
  'help.ctx.notifications.bullet.3':
    'Jede Benachrichtigung sagt, wer was wo gemacht hat. Ungelesene sind farbig hinterlegt. Ein Button darunter, etwa „Reise ansehen“ oder „Vacay ansehen“, bringt dich dorthin und markiert sie als gelesen.',
  'help.guide.read-notifications.tip.1':
    'Die Glocke ist auf jedem Bildschirm mit Navigationsleiste zu sehen, und die Zahl daran aktualisiert sich von selbst, wenn etwas Neues eingeht.',
  'help.guide.filter-notifications.tip.1':
    'Beim Herunterscrollen lädt die Seite ältere Benachrichtigungen nach, nach dem ersten Bildschirm ist also nicht Schluss.',
  'help.guide.mark-notifications-read.result':
    'Nichts ist mehr farbig hinterlegt, und die rote Zahl an der Glocke ist verschwunden.',
  'help.guide.notification-settings.title': 'Festlegen, worüber du benachrichtigt wirst',
  'help.guide.link-journal.step.1':
    'Klicke neben dem Namen der Reise auf „Reiseeinstellungen“ und wähle links „Tagebuch“.',
  'help.guide.dawarich-stays.tip.1':
    'In die Reise kommt erst etwas, wenn du auf „Ort hinzufügen“ klickst. Bei einem Ort, der aus einem Aufenthalt übernommen wurde, steht das in den Details: „Aus deinen Dawarich-Aufzeichnungen übernommen“.',
  'help.guide.leave-stop-off-route.title': 'Einen Halt aus der Route herausnehmen',
  'help.guide.move-booking-day.step.1':
    'Fahre mit der Maus über die Zeile der Buchung im Tag: Der Griff links zeigt, dass du sie ziehen kannst.',
  'help.guide.place-image-from-file.tip.1':
    'Angeboten werden nur JPG-, PNG-, GIF- und WebP-Dateien, ein PDF-Ticket also nicht.',
  'help.guide.place-own-hours.step.4':
    'Die Buttons rechts neben „Öffnungszeiten“: Der Kopier-Button überträgt die Zeiten vom Montag auf alle Tage, und das X entfernt deine Zeiten wieder. Hat TREK selbst Öffnungszeiten gefunden, holt „Aus den Ortsdetails übernehmen“ sie zurück.',
  'help.guide.confirm-stay-booking.step.2':
    'Die Buchung öffnet sich über dem Plan. Das erste Badge in ihrem Kopf zeigt ihren Status.',
  'help.ctx.trip-map.bullet.9':
    'Jede Tour der Reise ist eine Linie in ihrer Farbe, mit einem Pin am Startpunkt. Klicke auf die Linie, um die Karte der Tour zu öffnen. An einem Tag mit einer Tour führt die Route des Tages bis zum Start der Tour und vom Ende der Tour weiter. Mit dem Auge neben einer Tour in der Liste Touren („Auf der Karte ausblenden“) nimmst du ihre Linie von deiner Karte.',
  'help.guide.tour-map-lines.result':
    'Die Touren, die du sehen willst, sind auf der Karte, jede in ihrer Farbe, und die ausgeblendete steht ausgegraut in der Liste Touren.',
  'help.guide.car-stops.step.2':
    'Klicke oben im Kopfbereich auf das Typ-Badge und wähle Auto. Das Formular passt sich an: Aus „Datum“ und „Startzeit“ werden „Abholung“ und „Abholzeit“, aus „Enddatum“ und „Endzeit“ werden „Rückgabe“ und „Rückgabezeit“, und unter „Von“ und „Bis“ erscheint „Stopps unterwegs“.',
  'help.guide.transport-details.goal':
    'Alles zu einer Fahrt auf einen Blick lesen, ihren Buchungscode kopieren, sie umbenennen oder auf der Karte zu ihr springen.',
  'help.guide.transport-details.tip.2':
    'Escape oder ein Klick neben die Details schließt sie. Ist gerade „Umbenennen“ oder die Löschfrage offen, wird zuerst diese geschlossen.',
  'help.guide.export-transports-csv.tip.1':
    'Das Icon erscheint nur in der Leiste, solange der Tab mindestens eine Fahrt enthält.',
  'help.guide.group-sort-bookings.step.1':
    'Klicke in der Ansicht Karten oder Liste auf „Ansicht anpassen“, die Regler hinter den drei Ansichts-Icons.',
  'help.guide.create-booking.tip.4':
    'Offline wird die Buchung auf diesem Gerät gespeichert und synchronisiert, sobald du wieder online bist. Neue Dateien brauchen eine Verbindung, entferne sie also oder speichere später. Klickst du versehentlich neben das Formular oder drückst Escape, fragt TREK „Änderungen verwerfen?“, bevor etwas von deinen Eingaben verloren geht.',
  'help.guide.booking-on-map.tip.2': 'Ein Aufenthalt öffnet sich bei seiner ersten Nacht.',
  'help.guide.export-bookings-csv.step.3':
    'Klicke auf „Als Tabelle exportieren (CSV)“, das Tabellen-Icon hinter „Ansicht anpassen“.',
  'help.guide.arrange-packing-list.step.3':
    '„A bis Z“ ganz rechts in der Reihe mit „Geteilt“ und „Meine Liste“ sortiert die Einträge jeder Liste nach Namen, sodass du auf einen Blick siehst, ob etwas schon darauf steht. Klicke noch einmal darauf, um zu deiner eigenen Reihenfolge zurückzukehren.',
  'help.guide.count-packed-pieces.step.1':
    'Klicke in einer Zeile auf das Mengen-Badge, die kleine Zahl mit einem x dahinter, gib ein, wie viele du mitnimmst, zum Beispiel 5, und drücke Enter.',
  'help.guide.expense-receipts.step.3':
    'Klicke unten im Dialog auf Speichern. Die Dateien werden mit der Ausgabe hochgeladen und landen außerdem in den Dateien der Reise.',
  'help.guide.files-sync-settings.step.1':
    'Klicke am rechten Ende der Leiste auf „Dokumentenabgleich“. Ist die Reise verbunden, öffnet sich rechts die Karte deines Speichers; hast du mehrere Speicher, klicke links unter „Diese Reise“ auf den gewünschten.',
  'help.guide.files-sync-settings.tip.3':
    '„Sofortige Updates“, ein Link mit „Kopieren“ daneben, gibt es nur bei Speichern, bei denen sich TREK nicht selbst für Änderungen registrieren kann. Hinterlege den Link beim Speicher, dann kommen Änderungen sofort an statt erst bei der nächsten Prüfung.',
  'help.guide.manage-notes.step.1':
    'Klicke im Kopf einer Notizkarte auf die drei Punkte („Weitere Optionen“). Das Menü enthält Erweitern, Anheften, Bearbeiten und Löschen.',
  'help.guide.note-categories.title': 'Notizen in Kategorien sortieren',
  'help.guide.note-categories.result':
    'Die Notizen haben die neuen Namen und Farben, und die Karte „Notizen“ zeigt nur die gewählte Kategorie.',
  'help.guide.roadtrip-stops.tip.5':
    'Hat ein Halt im Tagesplan eine Endzeit, bleibst du bis dahin dort. Sein Dialog zeigt, wann die Fahrt weitergeht, und mit „Endzeit entfernen“ legst du die Dauer wieder selbst fest.',
  'help.guide.roadtrip-reorder.tip.2':
    'Gebuchte Fahrten und ihre Start- und Zielpunkte bleiben dort, wo die Buchung sie vorsieht; ziehen lassen sich nur Orte.',
  'help.guide.roadtrip-overnight.step.2':
    'Bei einem Hotel steht statt des Plus ein Bett. Klicke darauf („Als Übernachtung hinzufügen“), um „Als Stopp für die Nacht hinzufügen“ zu öffnen. Ein Campingplatz hat das gewohnte Hinzufügen.',
  'help.guide.roadtrip-stop-fill.goal':
    'Einem einzelnen Tank- oder Ladestopp einen eigenen Füllstand geben, etwa 80 % am Schnelllader oder 100 % über Nacht.',
  'help.guide.roadtrip-bookings.goal':
    'Sehen, wo eine gebuchte Fahrt im Ablauf der Autofahrt liegt und bis wann du auf der Straße dort sein musst.',
  'help.guide.roadtrip-bookings.tip.3':
    'Eine Fahrt, die an keinem Tag der Reise liegt, wird nicht angefahren: Ein Hinweis oben in der Leiste nennt sie, mit „Buchung öffnen“, um ihr ein Datum zu geben.',
  'help.guide.roadtrip-google-import.step.4':
    'Wähle unter „Tag“ den Tag, an dem die Halte liegen sollen, und klicke dann auf Importieren.',
  'help.guide.roadtrip-hazards.step.2':
    'Schalte unter „Aktuelle Warnungen“, unten in der rechten Spalte des Dialogs, „Gefahrengebiete anzeigen“ ein und klicke dann auf Schließen.',
  'help.ctx.trip-tours.bullet.1':
    'Mit dem Schalter „Orte“ und „Touren“ oben in der rechten Spalte wechselst du zwischen der Ortsliste und den Touren. Es gibt ihn nur, solange das Add-on Touren aktiv ist; Touren erscheinen dann nie in der Ortsliste.',
  'help.guide.tour-show-list.step.1':
    'Klicke im Tab Planung im Schalter oben in der rechten Spalte auf Touren. Die Spalte zeigt jetzt die Touren statt der Orte.',
  'help.guide.tour-show-list.result':
    'Die rechte Spalte zeigt die Touren der Reise, und die angeklickte ist in ihrer Karte geöffnet.',
  'help.guide.tour-add-to-day.tip.1':
    'Ziehst du eine Tour mit Etappen auf einen Tag, fragt ein kleiner Dialog dasselbe. Abbrechen lässt den Plan unverändert.',
  'help.guide.tour-day-times.step.2':
    'Gib einen Start ein und lass „Ende“ leer. Die Zeile unter den Feldern zeigt das Ende, das TREK daraus berechnet: Start plus Dauer der Tour.',
  'help.guide.tour-remove-from-day.title': 'Eine Tour von einem Tag entfernen',
  'help.guide.tour-filter-list.title': 'Die Tourenliste filtern',
  'help.guide.tour-filter-list.tip.3':
    'Bleibt nichts übrig, zeigt die Liste „Keine Tour passt zu diesen Filtern“, und „Filter zurücksetzen“ hebt alle auf. Filter ändern nur, was die Liste anzeigt, nie eine Tour oder einen Tag.',
  'help.guide.tour-hide-on-map.tip.2':
    'Die Karte auf dem Handy zeigt immer alle Touren, und im Tab Touren gibt es kein Auge: Ausblenden geht hier im Tab Planung.',
  'help.guide.tour-import-plan-tab.tip.2':
    'Die importierte Tour bleibt hier in der Liste und öffnet sich nicht in einem Planer. Lege sie mit ihrem runden + auf einen Tag, oder öffne den Tab Touren, um sie dort anzusehen.',
  'help.ctx.trip-tour-detail.bullet.5':
    'Die Karte ist zum Lesen da und für alles, was zu einer Tour gehört. Die Route selbst änderst du im Tab Touren: Öffne ihn und klicke unter „Touren dieser Reise“ auf die Tour. Auch gelöscht wird eine Tour dort, nicht hier.',
  'help.guide.tour-detail-read.step.6':
    'Scrolle weiter zu Beschreibung und Notizen, dann zu „Herkunft“: „in TREK geplant“, die Datei, aus der sie importiert wurde, oder der wanderer-Trail, aus dem sie stammt, jeweils mit Datum.',
  'help.guide.tour-rename-colour.title': 'Eine Tour umbenennen und ihre Farbe ändern',
  'help.guide.tour-rename-colour.result':
    'Die Tour trägt überall in der Reise ihren neuen Namen, und ihre Linie erscheint in der gewählten Farbe.',
  'help.guide.tour-take-along.tip.3':
    'Die Datei kommt vom Server, dafür brauchst du also eine Verbindung. Eine offline erstellte Tour kannst du herunterladen, sobald sie synchronisiert ist.',
  'help.guide.tour-copy-keep.step.4':
    'Wähle unter „Sammlung“ die Liste, prüfe „Name in der Sammlung“ und klicke auf Behalten.',
  'help.guide.tour-packing-link.step.1':
    'Öffne die Karte der Tour und scrolle zu „Packliste“. Klicke auf „Packliste verknüpfen“.',
  'help.guide.tour-packing-link.result':
    'Du bist auf der Packliste im Tab Listen, und die Karte der Tour übernimmt jeden Haken, den du setzt.',
  'help.guide.tour-files.result': 'Die Dateien gehören zur Tour und lassen sich aus ihrer Karte öffnen.',
  'help.guide.tour-activity-link.tip.1':
    'Der Plan bleibt, wie er ist. Der Track wird nur verknüpft, und „Trennen“ löst ihn wieder.',
  'help.guide.tour-activity-compare.step.3':
    'Klicke auf „Auf der Karte vergleichen“, um den tatsächlichen Track gepunktet neben dem Plan anzuzeigen. „Vergleich beenden“ blendet ihn wieder aus.',
  'help.guide.tour-origin-check.step.2':
    '„Importiert“ nennt den Tag, an dem sie importiert wurde. „Hier“ zeigt den aktuellen Stand: „Wie importiert“, „In TREK bearbeitet“ oder „Überplant, Originalspur gesichert“.',
  'help.ctx.trip-tour-planner.bullet.1':
    'Touren steht in der Tab-Leiste der Reise direkt nach Planung, solange das Add-on Touren aktiv ist. Den Tab gibt es auf Computer und Tablet; auf dem Handy kannst du Touren im Tab Planung ansehen und auf Tage legen, aber nicht zeichnen.',
  'help.guide.tour-open-workspace.step.1':
    'Klicke in der Tab-Leiste der Reise auf Touren, direkt nach Planung. Die Karte füllt den Bildschirm, links und rechts mit je einer Leiste.',
  'help.guide.tour-open-workspace.tip.2':
    'Ziehe GPX-, KML- oder KMZ-Dateien irgendwo auf diesen Tab, um sie als Touren der Reise zu importieren.',
  'help.guide.tour-draw-route.step.4':
    'Unten an der Karte erscheint „Punkt gesetzt“. Mit Rückgängig daneben entfernst du den Punkt wieder.',
  'help.guide.tour-type-profile.title': 'Festlegen, was für eine Tour es ist',
  'help.guide.tour-type-profile.result': 'Die Tour wird für den gewählten Typ und das gewählte Profil geroutet.',
  'help.guide.tour-edit-points.step.6':
    'Mit „Wegpunkt-Änderung rückgängig machen“ und „Wegpunkt-Änderung wiederholen“ oben in der Leiste gehst du Schritt für Schritt durch jede Änderung.',
  'help.guide.tour-shaping-points.step.3':
    'Unter Wegpunkte steht er mit dem Badge „Formpunkt“ und ohne Nummer, sodass die Halte ihre Nummern behalten.',
  'help.guide.tour-loop-reverse.step.1':
    'Klicke oben in der Karte „Wegpunkte“ auf „Zurück zum Start“. Die Tour bekommt einen letzten Abschnitt zurück zu ihrem ersten Punkt.',
  'help.guide.tour-leg-by-hand.goal':
    'Zwei Punkte mit einer geraden Linie verbinden, wo der Router keinen Weg findet, oder einen Abschnitt neu berechnen lassen.',
  'help.guide.tour-trip-places.title': 'Einen Ort der Reise als Halt nutzen',
  'help.guide.tour-trip-places.tip.3': 'Die anderen Touren der Reise werden nie als Halt angeboten.',
  'help.guide.tour-details-times.tip.1': 'Zeiten kannst du als 2:56, 2 h 56 oder 176 Minuten eingeben.',
  'help.guide.tour-save.step.3':
    'Klicke unten in der linken Leiste auf Speichern. Es erscheint „Tour gespeichert“, und die Leiste wird zu „Tour bearbeiten“.',
  'help.guide.tour-edit-saved.step.1':
    'Klicke unter „Touren dieser Reise“ auf die Tour. Sie öffnet sich in der linken Leiste als „Tour bearbeiten“, und die Karte zeigt ihre Route.',
  'help.guide.tour-summary-profile.title': 'Die Tourenübersicht und das Höhenprofil lesen',
  'help.guide.tour-summary-profile.tip.3':
    'Eine Paddeltour zeigt keine Höhen: Auf dem Wasser würden sie nur die Höhe der Ufer wiedergeben.',
  'help.guide.tour-list-manage.step.5':
    'Wähle „Ungeplant“ für die Touren, die noch keinem Tag zugeordnet sind, oder filtere nach Quelle, Routing-Grenze oder Typ. Jede Zeile zeigt, wie viele Touren darunter fallen, und die Summen richten sich nach dem Filter.',
  'help.guide.tour-delete.step.2':
    'Lies, was mitgelöscht wird: die Route, die bearbeitbaren Wegpunkte und die Tageszuordnungen. Klicke auf „Endgültig löschen“.',
  'help.guide.tour-saved-elsewhere.step.2':
    '„Neuere laden“ ersetzt nach einer Bestätigung deine Änderungen durch die neuere Version.',
  'help.ctx.trip-tour-import.bullet.1':
    'Das + oben in „Touren dieser Reise“ ist „Tour hinzufügen“. Es bietet „GPX oder KML importieren“, „Walk aus Google Maps importieren“ und „Tour aus anderer Reise übernehmen“. Dateien kannst du auch einfach irgendwo auf den Tab Touren ziehen.',
  'help.guide.tour-import-gpx.step.2':
    'Wähle „GPX oder KML importieren“ und dann eine oder mehrere .gpx-, .kml- oder .kmz-Dateien, jeweils bis zu 10 MB.',
  'help.guide.tour-import-gpx.tip.5':
    'Bei einer Datei ohne Höhen steht „Keine Höhen in der Datei“. Linie und Distanz stimmen trotzdem, aber Aufstieg und Abstieg bleiben unbekannt.',
  'help.guide.tour-view-import.tip.2':
    'Das Download-Icon im Kopf speichert sie wieder als GPX-Datei, und mit dem Lesezeichen legst du sie in einer Sammlung ab.',
  'help.guide.tour-plan-from-import.step.4':
    'Die Tour öffnet sich mit ihren Wegpunkten im Editor. Ändere sie, wenn du magst, und klicke dann unten in der Spalte auf Speichern.',
  'help.guide.tour-restore-recorded.step.1':
    'Klicke in „Touren dieser Reise“ auf die Tour, die du überplant hast. Die Karte „Aufgezeichnete Strecke“ im Editor zeigt, dass der ursprünglich aufgezeichnete Track erhalten bleibt.',
  'help.guide.tour-take-over.step.1':
    'Öffne den Tab Touren der Reise, in die die Tour soll. Klicke oben in „Touren dieser Reise“ auf das + („Tour hinzufügen“).',
  'help.guide.tour-take-over.tip.3':
    'Zum Übernehmen einer Tour braucht es eine Verbindung. Hast du im Editor ungespeicherte Änderungen, landet die Kopie trotzdem in der Liste, öffnet sich aber nicht über deiner Arbeit.',
  'help.guide.tour-import-wanderer.tip.1':
    'Den Button gibt es, sobald wanderer unter Einstellungen > Integrationen verbunden ist. Vorher bietet die Liste „In den Einstellungen verbinden“ an.',
  'help.ctx.trip-tour-map.bullet.2':
    'Nach dem Trennstrich in der Schalterleiste folgen die Schalter für den Tourtyp: „Punkte setzen“, während du eine Tour bearbeitest, „Klettersteige“ bei einer Wanderung, „Seezeichen“ bei einer Paddeltour und die Pisten bei einer Skitour. „3D“ am Ende legt die Tour aufs Gelände.',
  'help.guide.tour-map-layers.step.3':
    'Klicke bei einer Wanderung auf „Wandern“, um die markierten Wege und ihre Nummern zu sehen; bei einer Radtour gibt es stattdessen „Fahrrad“ für die Radrouten. „Satellit“ zeigt Luftbilder, und „Karte“ bringt dich zur Standardkarte zurück.',
  'help.guide.tour-along-search.step.2':
    'Klicke auf „Wonach suchen“ und hake die gewünschten Arten an, bis zu sechs gleichzeitig: Aussichtspunkte, Gipfel, Hütten und Unterstände, Trinkwasser, Essen und mehr. Die Liste bietet an, was zum Tourtyp passt, und bei einer neuen Tour sind schon drei davon angehakt.',
  'help.guide.tour-along-add-stop.title': 'Einen Ort entlang der Tour als Halt hinzufügen',
  'help.guide.tour-along-add-stop.tip.2':
    '„Als neues Ziel“ ist mit „Verlängert die Tour“ markiert: Das bisherige Ende ist dann nicht mehr das Ende, und die Tour führt weiter bis zu diesem Ort.',
  'help.guide.tour-3d-terrain.step.5':
    'Klicke noch einmal auf 3D, um zur flachen Karte zurückzukehren und weiterzuplanen.',
  'help.guide.tour-3d-flyover.step.2':
    'Wähle unter Tempo 1×, 2× oder 4×. Bei 1× dauert der Flug bei den meisten Touren etwa 45 Sekunden vom Start bis zum Ende.',
  'help.guide.tour-map-overlays.goal':
    'Beim Planen einer Ski- oder Paddeltour die Skipisten und Lifte oder die Bojen und Hafenzeichen über die Karte legen.',
  'help.guide.tour-map-overlays.tip.3':
    'Lädt eine Ebene nicht mehr, zeigt ihr Schalter ein ! und einen Hinweis darauf; Karte und Route funktionieren ohne sie weiter.',
  'help.guide.tour-multi-day.title': 'Eine Tour über mehrere Tage planen',
  'help.guide.tour-multi-day.tip.1':
    '„Etappe hier beenden“ funktioniert auch bei einer Tagestour: Die Tour wird dadurch automatisch zur Mehrtagestour. Am ersten und am letzten Halt sowie an einem Formpunkt lässt sich keine Etappe beenden.',
  'help.guide.tour-stages-on-days.step.2': 'Wähle den Tag, an dem du zur ersten Etappe aufbrichst.',
  'help.guide.tour-stages-on-days.tip.4':
    'Im Tagesplan erscheint jede Etappe als „Etappe N“ mit eigener Distanz und Zeit. Rückgängig über den Tagen im Tab Planung macht die ganze Verteilung in einem Schritt rückgängig.',
  'help.ctx.trip-tour-hike.bullet.5':
    'Bei einer Wanderung zeigt „Klettersteige“ in der Reihe der Kartenbuttons unten links die Klettersteige in der Umgebung. Über ihre Karten fügst du einen davon als eigenen Abschnitt zur Route hinzu.',
  'help.guide.tour-hike-plan.step.5':
    'Öffne unter Details „Maximale Wegschwierigkeit“ und wähle, wie schwer die Wege werden dürfen, von T1 (Wandern) bis T6 (Schwieriges Alpinwandern). Die Route wird dann innerhalb dieser Grenze neu geplant.',
  'help.guide.tour-hike-trail-details.goal':
    'Nachlesen, was OpenStreetMap über die Wege einer Wanderung verzeichnet, und diese Abschnitte auf der Karte finden.',
  'help.guide.tour-hike-trail-details.tip.2':
    'Liegt ein Schwierigkeitsgrad über der Grenze der Wanderung, trägt seine Zeile das Badge „Über der Grenze“.',
  'help.guide.tour-hike-round.step.5':
    'Klicke auf „Diese Runde nehmen“ und dann auf Ersetzen, wenn du gefragt wirst, ob die geplante Route ersetzt werden soll.',
  'help.guide.tour-hike-compare-ways.step.2':
    '„Andere Wege für diesen Abschnitt“ öffnet sich über der Karte mit „Aktueller Weg“ und Weg A, Weg B und so weiter. Jeder Weg ist in seiner Farbe auf der Karte eingezeichnet, und zeigst du auf eine Zeile, leuchtet ihre Linie auf.',
  'help.guide.tour-ferrata-add.goal':
    'Die Klettersteige rund um deine Wanderung finden und einen davon zum Teil der Route machen.',
  'help.guide.tour-ferrata-add.tip.2':
    'Klettersteige gibt es nur bei Wanderungen. Führt die Route schon über einen Klettersteig, zeigt seine Karte „Teil der Tour“ statt „In die Tour übernehmen“.',
  'help.guide.tour-run-plan.step.4':
    'Setze Start und Ende auf der Karte, oder wähle sie über „Reise-Orte“. Unter der Pace ergibt sich aus Distanz mal Pace die Laufzeit.',
  'help.guide.tour-run-ways.goal': 'Prüfen, wie viel eines Laufs unbefestigt ist und wie schwierig die Wege werden.',
  'help.ctx.trip-tour-walk.summary':
    'Eine Tour zu Fuß von Halt zu Halt, im Tab Touren geplant: wie lange du an jedem Halt bleibst, welche Halte wichtig sind, die Sehenswürdigkeiten am Weg und wann du am Tag des Spaziergangs jeden Halt erreichst, abgeglichen mit den Öffnungszeiten.',
  'help.guide.tour-walk-plan.step.1':
    'Klicke oben in der linken Spalte auf „Neue Tour planen“, öffne dann „Tourtyp“ und wähle „Stadt- und Spaziergang“.',
  'help.guide.tour-walk-plan.tip.3':
    '„Vom Ort lösen“ unter „Weitere Aktionen“ eines Halts hebt nur die Verknüpfung mit einem Ort der Reise auf. Der Ort selbst bleibt in der Reise.',
  'help.guide.tour-walk-sights.step.5':
    'Klicke auf „Als Stopp hinzufügen“. Ein Hinweis zeigt, wie viel länger der Spaziergang dadurch wird, daneben steht Rückgängig.',
  'help.guide.tour-walk-day-times.step.2':
    'Gib ihm an diesem Tag eine Startzeit: Klicke im Tab Planung mit der rechten Maustaste auf den Spaziergang im Tag, wähle Bearbeiten und gib einen Start ein.',
  'help.guide.tour-walk-google-import.title': 'Eine Google-Maps-Fußroute in einen Stadtspaziergang verwandeln',
  'help.guide.tour-walk-google-import.tip.3':
    'Übernommen werden nur die Halte, nicht die in Google Maps gezeichnete Linie. Um einen kurzen maps.app.goo.gl-Link aufzulösen, braucht es eine Verbindung.',
  'help.guide.tour-walk-check-off.tip.1':
    'Markierungen gehören zum Tag: Öffne den Spaziergang über seinen Tag im Plan, nicht über die Tourenliste.',
  'help.ctx.trip-tour-bike.bullet.3':
    'Die Karte „Belag und Wege“ unter Wegpunkte zeigt, worüber die Route führt: die Beläge, die Wegarten und den Anteil, der bekanntermaßen unbefestigt ist. Klicke auf eine Zeile, um die zugehörigen Abschnitte auf der Karte hervorzuheben.',
  'help.guide.tour-bike-profile.step.5':
    'Lies in der Tourenübersicht rechts die „Fahrzeit (geschätzt)“ ab. Halte den Mauszeiger auf den Info-Punkt daneben, um zu sehen, wie sie berechnet wird.',
  'help.guide.tour-bike-surfaces.title': 'Sehen, worüber eine Radtour führt',
  'help.guide.tour-bike-surfaces.tip.2':
    'Beim Profil Rennrad zeigt eine Warnung über den Balken, wie viel der Strecke bekanntermaßen unbefestigt ist. „Auf der Karte einblenden“ markiert diese Abschnitte.',
  'help.guide.tour-bike-mtb-grades.result':
    'Die Karte markiert die Trails mit der gewählten Schwierigkeit, und du weißt, welche Abschnitte der Tour die schweren sind.',
  'help.ctx.trip-tour-ski.bullet.2':
    'Unter der Disziplin stehen die Optionen des Pisten-Routers, und zwar nur die, die zu deiner Disziplin passen: „Schwerste Pisten“, „Bevorzugen“, „Tempo“, Schalter wie „Lifte nutzen“ und „Auslassen“ für die Liftarten, die du nicht nehmen willst. Jede Änderung plant die Tour neu.',
  'help.guide.tour-ski-plan.step.3':
    'Wähle unter Disziplin, was du vorhast: Alpin, Snowboard, Langlauf, Skitour, Schneeschuh oder Winterwandern. Vorausgewählt ist nichts, und ohne Auswahl lässt sich die Tour nicht speichern.',
  'help.guide.tour-ski-plan.result':
    'Eine gespeicherte Tour vom Typ „Ski & Winter“ in „Touren dieser Reise“, deren Abschnitte den kartierten Pisten, Liften und Wegen folgen und deren Zeit in der Tourenübersicht berechnet ist.',
  'help.guide.tour-ski-options.tip.1': 'Jede Änderung plant die Tour neu, Abschnitt für Abschnitt.',
  'help.guide.tour-ski-fix-leg.step.3':
    'Passt dir keine der Lösungen, klicke auf „Gerade zeichnen“. Der Abschnitt wird dann eine gerade Linie zwischen seinen beiden Punkten.',
  'help.guide.tour-ski-summary.step.1':
    'Unter den Wegpunkten findest du die Karte „Pistenroute“. Klicke auf ihren Titel, um sie zu- oder wieder aufzuklappen.',
  'help.guide.tour-ski-pistes-layer.title': 'Pisten auf der Karte anzeigen',
  'help.guide.tour-ski-pistes-layer.result':
    'Die Pisten sind unter der Tour eingezeichnet, und du kannst ihre Farben erkennen.',
  'help.guide.tour-ski-import.step.6':
    'Wähle in „Skistrecke einordnen“ die passende Disziplin oder Technik und klicke auf Speichern.',
  'help.ctx.trip-tour-paddle.bullet.2':
    'Jeder Punkt zeigt seine Rolle als Badge: Einstieg, Ausstieg, Wiedereinstieg oder Endausstieg. Unter einem Punkt steht, was danach kommt: ein von Hand gezeichneter Abschnitt, eine Portage, eine Schleuse oder der Grund, warum ein Abschnitt nicht geplant werden konnte.',
  'help.guide.tour-paddle-setup.step.2':
    'Öffne „Tourtyp“ und wähle „Paddeltour“ („Auf dem Wasser, mit Kajak, Kanadier oder SUP“).',
  'help.guide.tour-paddle-setup.tip.3':
    'Bei einer Paddeltour sucht „Entlang der Tour“ zuerst nach Einsetzstellen, Bootsverleih und Trinkwasser.',
  'help.guide.tour-paddle-water-route.step.4':
    'Einen Abschnitt, den TREK nicht planen konnte, färbt TREK rot und nennt den Grund, zum Beispiel dass es für das Gebiet noch keine Gewässerdaten gibt. Klicke auf „Gerade zeichnen“, um ihn vorerst von Hand zu zeichnen.',
  'help.guide.tour-paddle-portage.goal':
    'Eine Strecke markieren, auf der du das Boot trägst, damit sie als Landstrecke zählt, samt Zeit zum Aus- und Wiedereinsteigen.',
  'help.guide.tour-paddle-portage.tip.3':
    'Fürs Tragen rechnet TREK mit 2 km/h, bis du in der Karte „Zeitschätzung“ dein eigenes Tragetempo einstellst.',
  'help.guide.tour-paddle-lock.tip.1':
    'TREK kennt keine Schleusenzeiten. Die Zeiten sind nur das, was du eingibst, prüfe die Betriebszeiten der Schleuse also selbst.',
  'help.guide.tour-paddle-time.step.3':
    'Die Zeile „Gewässer“ ist die Strecke auf dem Wasser bei deinem Paddeltempo. Ändere das Tempo im Feld „Paddeltempo“ oben in der Spalte.',
  'help.guide.tour-paddle-wind.goal':
    'Den vorhergesagten Wind am Startpunkt der Tour für den Tag sehen, an dem du paddelst.',
  'help.guide.tour-paddle-wind.tip.4': 'Keine dieser Zahlen ist eine Entwarnung. Prüfe die Bedingungen vor Ort.',
  'help.guide.tour-paddle-checklist.step.5':
    'Klicke unten in der Spalte auf „Paddeln hat Risiken“, um vor dem Aufbruch „Sicherheit beim Paddeln“ zu lesen.',
  'help.guide.tour-paddle-track-marks.goal':
    'Einen Paddeltrack von deiner Uhr importieren und eintragen, wo du getragen und wo du geschleust hast.',
  'help.guide.tour-paddle-track-marks.tip.1':
    'Klicke genau auf den Track: Ein Klick zu weit neben der Linie wird abgelehnt, und die Karte weist darauf hin.',
  'help.ctx.trip-tour-horse.bullet.3':
    'Jeder Abschnitt ist ein Badge in der Karte „Wegpunkte“ mit dem Namen der Route, einem Punkt, der den Zugang anzeigt, und seiner Länge. Eine Strecke, die keine Reitroute abdeckt, ist als „Manuell, ungeprüft“ gekennzeichnet.',
  'help.guide.tour-horse-plan.step.4':
    'Klicke in der Liste auf eine Route. Sie öffnet sich auf einer eigenen Karte mit nummerierten Abschnitten.',
  'help.guide.tour-horse-plan.tip.4':
    '„Wegpunkt-Änderung rückgängig machen“ oben in der linken Spalte nimmt einen ganzen Abschnitt in einem Schritt zurück.',
  'help.guide.tour-horse-gap.result':
    'Der Ritt geht ohne Lücke weiter, und die überbrückte Strecke ist als von Hand gezeichnet markiert.',
  'help.guide.tour-horse-recorded.step.3': 'Klicke auf 1 Tour importieren.',
  'help.guide.dissolve-fusion.step.3': 'Bestätige die Rückfrage mit „Auflösen“.',
};

export default help;
