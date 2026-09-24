import type { TranslationStrings } from '../types';

const dawarich: TranslationStrings = {
  // ── Connection ─────────────────────────────────────────────────────────────
  'dawarich.title': 'Dawarich',
  'dawarich.intro':
    'Verbinde deine eigene Dawarich-Instanz, um zu sehen, wo du tatsächlich warst. TREK liest sie aus und schlägt Tagebucheinträge, Orte und Länder vor — nichts wird übernommen, bevor du es bestätigst, und nach Dawarich wird nichts zurückgeschrieben.',
  'dawarich.url': 'Adresse der Instanz',
  'dawarich.apiKey': 'API-Schlüssel',
  'dawarich.apiKeyPlaceholder': 'Deinen Dawarich-API-Schlüssel einfügen',
  'dawarich.apiKeyHint':
    'Zu finden in Dawarich unter Account → API key. Wird verschlüsselt gespeichert und nie wieder angezeigt.',
  'dawarich.allowInsecureTls': 'Selbstsigniertes Zertifikat zulassen',
  'dawarich.allowInsecureTlsHint':
    'Nur nötig, wenn deine Instanz ein Zertifikat nutzt, dem dein Server nicht vertraut.',
  'dawarich.syncEnabled': 'Automatisch nach neuen Aufenthalten suchen',
  'dawarich.syncEnabledHint': 'Aus bedeutet: TREK liest Dawarich nur, wenn du es anstößt.',
  'dawarich.test.button': 'Verbindung testen',
  'dawarich.test.success': 'Verbunden. {count} Aufenthalte in den letzten 30 Tagen gefunden.',
  'dawarich.test.failed': 'Dawarich war nicht erreichbar.',
  'dawarich.syncNow': 'Jetzt nachsehen',
  'dawarich.connected': 'Verbunden',
  'dawarich.notConnected': 'Nicht verbunden',
  'dawarich.disconnect': 'Trennen',
  'dawarich.lastSync': 'Zuletzt nachgesehen {when}',
  'dawarich.neverSynced': 'Noch nicht nachgesehen',
  'dawarich.syncPartial': 'einige Reisen konnten nicht gelesen werden',
  'dawarich.serverVersion': 'Dawarich {version}',

  'dawarich.toast.saved': 'Dawarich-Verbindung gespeichert',
  'dawarich.toast.saveError': 'Die Verbindung konnte nicht gespeichert werden',
  'dawarich.toast.disconnected': 'Dawarich getrennt',
  'dawarich.toast.synced': '{count} neue Aufenthalte gefunden',
  'dawarich.toast.syncError': 'Dawarich konnte nicht gelesen werden',
  'dawarich.toast.syncRunning': 'Es läuft bereits eine Prüfung',
  'dawarich.toast.acceptError': 'Das konnte nicht übernommen werden',
  'dawarich.toast.updateError': 'Dieser Vorschlag konnte nicht aktualisiert werden',
  'dawarich.toast.accepted.place': 'Zur Reise hinzugefügt',
  'dawarich.toast.accepted.journal': 'Ins Tagebuch übernommen',
  'dawarich.toast.accepted.bucket_list': 'Von deiner Wunschliste abgehakt',

  // ── What the connected instance can do ─────────────────────────────────────
  'dawarich.capability.visits': 'Aufenthalte',
  'dawarich.capability.track': 'aufgezeichnete Route',
  'dawarich.capability.locations': 'Abgleich mit der Wunschliste',
  'dawarich.capability.visitedCities': 'Länder und Städte',
  'dawarich.capability.missing': 'Diese Dawarich-Version bietet nicht: {features}.',

  // ── Failure reasons, as sentences the reader can act on ────────────────────
  'dawarich.error.unreachable': 'TREK konnte diese Adresse nicht erreichen.',
  'dawarich.error.unauthorized': 'Dawarich hat den API-Schlüssel abgelehnt.',
  'dawarich.error.forbidden': 'Dieser API-Schlüssel darf das nicht lesen.',
  'dawarich.error.not_found': 'Diese Dawarich-Version hat diesen Endpunkt nicht.',
  'dawarich.error.rate_limited':
    'Dawarich hat TREK gebeten, langsamer zu machen. Versuch es gleich noch einmal.',
  'dawarich.error.server_error': 'Dawarich hat mit einem Fehler geantwortet.',
  'dawarich.error.invalid_response': 'Diese Adresse hat mit etwas geantwortet, das kein Dawarich ist.',
  'dawarich.error.too_large': 'Dawarich hat mehr Daten geschickt, als TREK auf einmal liest.',
  'dawarich.error.not_connected': 'Es ist noch keine Dawarich-Instanz verbunden.',
  'dawarich.error.addon_disabled': 'Das Dawarich-Addon ist für diese Instanz abgeschaltet.',
  'dawarich.error.offline': 'Dafür braucht es eine Verbindung — TREK ist gerade offline.',
  'dawarich.error.invalid_url': 'TREK kann diese Adresse nicht verwenden.',
  'dawarich.warning.private_ip': 'Diese Adresse zeigt auf eine private IP ({ip}). Prüfe, ob das so gewollt ist — der Server braucht dafür eventuell ALLOW_INTERNAL_NETWORK=true.',
  'dawarich.error.unknown': 'Bei der Kommunikation mit Dawarich ist etwas schiefgelaufen.',

  // ── The recorded route on the map ──────────────────────────────────────────
  'dawarich.trail.show': 'Aufgezeichnete Route anzeigen',
  'dawarich.trail.hide': 'Aufgezeichnete Route ausblenden',
  'dawarich.trail.loading': 'Aufgezeichnete Route wird geladen…',
  'dawarich.trail.empty': 'An diesen Tagen wurde nichts aufgezeichnet',
  'dawarich.trail.offline': 'Die aufgezeichnete Route braucht eine Verbindung',
  'dawarich.trail.unavailable': 'Die aufgezeichnete Route konnte nicht geladen werden',

  // ── Suggestions ────────────────────────────────────────────────────────────
  'dawarich.duration.minutes': '{minutes} Min.',
  'dawarich.duration.hours': '{hours} Std.',
  'dawarich.duration.hoursMinutes': '{hours} Std. {minutes} Min.',
  'dawarich.checkedAgo': 'geprüft {ago}',

  'dawarich.badge.lowConfidence': 'Unsicher',
  'dawarich.badge.sourceChanged': 'In Dawarich geändert',
  'dawarich.badge.sourceMissing': 'In Dawarich nicht mehr da',

  'dawarich.suggestions.title': 'Aus Dawarich',
  'dawarich.suggestions.pending': '{count} warten auf dich',
  'dawarich.suggestions.loading': 'Dawarich wird gelesen…',
  'dawarich.suggestions.notConnected':
    'Verbinde Dawarich in den Einstellungen, um deine Aufenthalte hier zu sehen.',
  'dawarich.suggestions.unavailable': 'Dawarich konnte nicht gelesen werden.',
  'dawarich.suggestions.allHandled': 'Alles, was hier aufgezeichnet wurde, ist erledigt.',
  'dawarich.suggestions.asJournal': 'Tagebucheintrag schreiben',
  'dawarich.suggestions.asPlace': 'Als Ort hinzufügen',
  'dawarich.suggestions.dismiss': 'Da war ich nicht',
  'dawarich.suggestions.dismissed': 'Verworfen',
  'dawarich.suggestions.restore': 'Zurückholen',
  'dawarich.suggestions.showHandled': '{count} bereits erledigte anzeigen',
  'dawarich.suggestions.hideHandled': 'Bereits erledigte ausblenden',
  'dawarich.suggestions.matchesWish': 'Auf deiner Wunschliste: {name}',
  'dawarich.suggestions.acceptedAs.place': 'Als Ort hinzugefügt',
  'dawarich.suggestions.acceptedAs.journal': 'Im Tagebuch',
  'dawarich.suggestions.acceptedAs.bucket_list': 'Wunsch abgehakt',
  'dawarich.suggestions.sourceChanged':
    'Dieser Aufenthalt hat sich in Dawarich geändert, seit du ihn übernommen hast. Was du in TREK geschrieben hast, bleibt unberührt.',
  'dawarich.suggestions.sourceMissing':
    'Diesen Aufenthalt gibt es in Dawarich nicht mehr. Was du in TREK geschrieben hast, bleibt unberührt.',
  'dawarich.sourceStatus.suggested': 'Erkannt, nicht bestätigt',
  'dawarich.confidence.high': 'Sichere Erkennung',
  'dawarich.confidence.medium': 'Recht sichere Erkennung',
  'dawarich.confidence.low': 'Unsichere Erkennung',

  // ── The review step ────────────────────────────────────────────────────────
  'dawarich.accept.title.place': 'Diesen Aufenthalt als Ort hinzufügen',
  'dawarich.accept.title.journal': 'Tagebucheintrag schreiben',
  'dawarich.accept.title.bucket_list': 'Einen Wunsch abhaken',
  'dawarich.accept.confirm.place': 'Ort hinzufügen',
  'dawarich.accept.confirm.journal': 'Eintrag hinzufügen',
  'dawarich.accept.confirm.bucket_list': 'Abhaken',
  'dawarich.accept.recorded': 'Aufgezeichnet {from} bis {to}',
  'dawarich.accept.duration': '{minutes} Min.',
  'dawarich.accept.name': 'Name',
  'dawarich.accept.date': 'Datum',
  'dawarich.accept.from': 'Angekommen',
  'dawarich.accept.to': 'Aufgebrochen',
  'dawarich.accept.trip': 'Reise',
  'dawarich.accept.thisTrip': 'Diese Reise',
  'dawarich.accept.pickTrip': 'Reise auswählen',
  'dawarich.accept.day': 'Tag',
  'dawarich.accept.noDay': 'Noch keinem Tag zugeordnet',
  'dawarich.accept.journal': 'Tagebuch',
  'dawarich.accept.pickJournal': 'Tagebuch auswählen',
  'dawarich.accept.notes': 'Notizen',
  'dawarich.accept.story': 'Deine Geschichte',
  'dawarich.accept.storyPlaceholder': 'Was ist hier passiert?',
  'dawarich.accept.photosHint': 'Fotos kannst du dem Eintrag hinzufügen, sobald er angelegt ist.',

  // ── A place that came out of a recording ──────────────────────────────────
  'dawarich.place.fromDawarich': 'Aus deinen Dawarich-Aufzeichnungen übernommen',

  // ── Wishlist ───────────────────────────────────────────────────────────────
  'dawarich.bucket.title': 'Wunschliste mit Dawarich abgleichen',
  'dawarich.bucket.description':
    'Durchsucht deine Aufzeichnungen nach den Orten, die du erreichen wolltest. Ein Besuch braucht Nähe und verbrachte Zeit — Vorbeifahren zählt nicht.',
  'dawarich.bucket.scan': 'Wunschliste prüfen',
  'dawarich.bucket.scanning': 'Wird geprüft…',
  'dawarich.bucket.noMatches': 'Nichts von deiner Wunschliste taucht in deinen Aufzeichnungen auf.',
  'dawarich.bucket.alreadyVisited': 'Bereits abgehakt',
  'dawarich.bucket.confirm': '{count} abhaken',
  'dawarich.bucket.confirmed': '{count} Wünsche abgehakt',
  'dawarich.bucket.skipped': '{count} Einträge haben keine Koordinaten und konnten nicht geprüft werden.',
  'dawarich.bucket.truncated':
    'Es wurden nur die ersten Einträge geprüft. Starte den Abgleich für den Rest noch einmal.',
  'dawarich.bucket.visitedFrom': 'Anhand deiner Dawarich-Aufzeichnungen abgehakt',
  'dawarich.bucket.clearVisit': 'Rückgängig',

  // ── Atlas ──────────────────────────────────────────────────────────────────
  'dawarich.atlas.title': 'Länder aus Dawarich',
  'dawarich.atlas.description':
    'Länder, in denen du deinen Aufzeichnungen zufolge warst. Bestätige die, die in deinen Atlas sollen — nichts wird von allein übernommen, und was du von Hand markiert hast, bleibt deins.',
  'dawarich.atlas.load': 'Nach Ländern suchen',
  'dawarich.atlas.loading': 'Deine Aufzeichnungen werden gelesen…',
  'dawarich.atlas.empty': 'Deine Aufzeichnungen zeigen keine Länder, die TREK nicht schon hat.',
  'dawarich.atlas.cities': '{count} Städte',
  'dawarich.atlas.citiesOne': '1 Stadt',
  'dawarich.atlas.accept': '{count} Länder hinzufügen',
  'dawarich.atlas.accepted': '{count} Länder hinzugefügt',
  'dawarich.atlas.unresolved': 'TREK konnte diese keinem Land zuordnen: {names}.',
  'dawarich.atlas.source': 'Aus Dawarich',
  'dawarich.atlas.range': 'Betrachtet: {from} bis {to}',

  'dawarich.atlas.trigger': 'Wünsche und Länder aus deinen Aufzeichnungen',
  'dawarich.atlas.dialogSubtitle': 'Was deine Aufzeichnungen über deinen Atlas sagen',
  'dawarich.atlas.tab.wishes': 'Wunschliste',
  'dawarich.atlas.tab.countries': 'Länder',
  'dawarich.atlas.window': 'Angesehen wurden die letzten 12 Monate.',
  'dawarich.selected': '{count} ausgewählt',
  'dawarich.again': 'Erneut prüfen',
  'dawarich.bucket.metersAway': '{meters} m entfernt',
  'dawarich.bucket.kilometersAway': '{km} km entfernt',
  'dawarich.bucket.rule': 'Ein Wunsch gilt ab {meters} m Nähe und {minutes} Minuten vor Ort als erreicht.',

  'dawarich.journey.dayStays.one': '1 Aufenthalt von Dawarich',
  'dawarich.journey.dayStays.other': '{count} Aufenthalte von Dawarich',
};

export default dawarich;
