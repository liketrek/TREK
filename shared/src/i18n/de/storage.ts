import type { TranslationStrings } from '../types';

const storage: TranslationStrings = {
  'storage.field.root': 'Stammverzeichnis',
  'storage.help.root': 'Absoluter Pfad auf dem Server, unter dem dieser Backend-Dienst seine Objekte speichert.',
  'storage.field.endpoint': 'Endpunkt-URL',
  'storage.help.endpoint':
    'Basis-URL des S3-kompatiblen Dienstes, z. B. https://s3.example.com oder http://127.0.0.1:9000.',
  'storage.field.bucket': 'Bucket', // same-as-en
  'storage.field.accessKeyId': 'Zugriffsschlüssel-ID',
  'storage.field.secretAccessKey': 'Geheimer Zugriffsschlüssel',
  'storage.field.region': 'Region', // same-as-en
  'storage.help.region': 'Belasse die Standardeinstellung, sofern dein Anbieter keine bestimmte Region verlangt.',
  'storage.field.keyPrefix': 'Schlüsselpräfix',
  'storage.help.keyPrefix': 'Optionales Präfix, das jedem Objektschlüssel vorangestellt wird, z. B. trek/prod.',
  'storage.field.retries': 'Wiederholungsversuche',
  'storage.field.timeoutMs': 'Zeitlimit (ms)',
  'storage.field.primary': 'Primäres Backend',
  'storage.field.replicas': 'Repliken',
  'storage.title': 'Speicher',
  'storage.description':
    'Wo TREK hochgeladene Dateien, Fotos und Backups aufbewahrt. Es ändert sich nichts, bis du speicherst.',
  'storage.loading': 'Wird geladen…',
  'storage.saved': 'Speicherkonfiguration gespeichert',
  'storage.save': 'Änderungen speichern',
  'storage.unsaved': 'Ungespeicherte Änderungen',
  'storage.saveConflict':
    'Die Speicherkonfiguration hat sich seit dem Laden geändert, deshalb wurden Ihre Änderungen nicht gespeichert. Verwerfen Sie sie und laden Sie die gespeicherten Einstellungen neu, um von vorn zu beginnen.',
  'storage.discardAndReload': 'Meine Änderungen verwerfen und neu laden',
  'storage.configError.banner':
    'Die gespeicherten Speichereinstellungen konnten nicht geladen werden — durch Speichern werden sie ersetzt: {error}',
  'storage.backends.title': 'Backends', // same-as-en
  'storage.backends.add': 'Backend hinzufügen',
  'storage.backends.usedBy': 'Verwendet von: {categories}',
  'storage.backends.unused': 'Keiner Kategorie zugewiesen',
  'storage.backends.envReadOnly': 'Durch eine Umgebungsvariable definiert (schreibgeschützt)',
  'storage.source.built-in': 'Integriert',
  'storage.source.env': 'Umgebung',
  'storage.source.settings': 'Einstellungen',
  'storage.type.local': 'Lokal',
  'storage.type.s3': 'S3',
  'storage.type.mirror': 'Spiegel',
  'storage.actions.test': 'Testen',
  'storage.actions.edit': 'Bearbeiten',
  'storage.actions.remove': 'Entfernen',
  'storage.test.running': 'Wird getestet…',
  'storage.test.ok': 'Verbindung erfolgreich',
  'storage.test.failed': 'Test fehlgeschlagen',
  'storage.remove.title': 'Backend entfernen',
  'storage.remove.body':
    '{name} aus der Konfiguration entfernen? Der Server lehnt das Speichern ab, wenn noch etwas davon abhängt.',
  'storage.remove.stillAssigned': 'Noch zugewiesen zu: {categories}',
  'storage.form.addTitle': 'Backend hinzufügen',
  'storage.form.editTitle': 'Backend bearbeiten',
  'storage.form.name': 'Name', // same-as-en
  'storage.form.type': 'Typ',
  'storage.form.apply': 'Übernehmen',
  'storage.form.cancel': 'Abbrechen',
  'storage.form.duplicateName': 'Ein Backend namens {name} existiert bereits',
  'storage.categories.title': 'Kategorien',
  'storage.categories.default': 'Standard',
  'storage.categories.reassignWarning':
    'Vorhandene Objekte werden nicht verschoben: Neue Objekte gehen an das neu zugewiesene Backend, alte bleiben, wo sie sind.',
  'storage.category.files': 'Reisedokumente',
  'storage.category.journey': 'Journey-Fotos',
  'storage.category.covers': 'Titelbilder',
  'storage.category.avatars': 'Profilbilder',
  'storage.category.places': 'Ortsbilder',
  'storage.category.photos-google': 'Google-Fotocache',
  'storage.category.photos-trek': 'TREK-Fotocache',
  'storage.category.backups': 'Backups', // same-as-en

  // What each category stores — rendered under the label in the category map.
  'storage.categoryDesc.files':
    'Dateianhänge, die zu Reisen hochgeladen wurden — Tickets, PDFs, Buchungsbestätigungen und im Reise-Chat geteilte Dateien.',
  'storage.categoryDesc.journey': 'Fotos und Vorschaubilder, die an Journey-Einträge angehängt sind.',
  'storage.categoryDesc.covers': 'Titelbilder von Reisen und Sammlungen, einschließlich Titelbildern von Unsplash.',
  'storage.categoryDesc.avatars': 'Profilbilder von Benutzerkonten.',
  'storage.categoryDesc.places': 'Bilder, die an Orte und Sammlungsorte angehängt sind — hochgeladen oder importiert.',
  'storage.categoryDesc.photos-google':
    'Zwischengespeicherte Kopien von Google-Places-Fotos — können erneut abgerufen werden, ein Verlust ist unbedenklich.',
  'storage.categoryDesc.photos-trek':
    'Zwischengespeicherte Fotos vom TREK-Fotodienst, der von Fotos (Memories) verwendet wird — können erneut abgerufen werden, ein Verlust ist unbedenklich.',
  'storage.categoryDesc.backups': 'Server-Backup-Archive, erstellt vom Backup-Panel oder nach Zeitplan.',
  'storage.health.title': 'Zustand',
  'storage.health.allClear': 'Keine Replikatfehler aufgezeichnet.',
  'storage.health.seedFile':
    'Eine storage-config.json-Seed-Datei ist vorhanden, wird aber ignoriert — Konfigurationszeilen existieren bereits. Verwalte den Speicher hier.',
  'storage.health.failureLine': '{op} von {key} auf {backend} fehlgeschlagen: {error}',

  // Replicas-on-primary mirror UX (2026-08-20 spec)
  'storage.mirror.targets': 'Spiegelziele',
  'storage.mirror.targetsHelp': 'Jeder Schreibvorgang auf diesem Backend wird auch auf jedes ausgewählte Ziel kopiert.',
  'storage.mirror.latencyNote':
    'Repliken werden bei jedem Upload nacheinander geschrieben — ein langsames oder nicht erreichbares Ziel verlangsamt jeden Upload jeder Kategorie auf diesem Backend.',
  'storage.mirror.mirroredTo': 'Gespiegelt auf: {targets}',
  'storage.mirror.replicaOf': 'Replik von: {primaries}',
  'storage.mirror.cacheWarning':
    'Nicht empfohlen: Diese Kategorie enthält erneut abrufbare Inhalte — sie zu replizieren ist meist verschwendet.',
  'storage.mirror.degenerate.duplicate-mirror':
    'Ein zweiter Spiegel umschließt {primary} — das Panel verwaltet nur den ersten; entferne diesen, um die Spiegelung ab {primary} zu verwalten.',
  'storage.mirror.degenerate.env-primary':
    'Umschließt ein durch Umgebungsvariable definiertes Backend — hier nicht bearbeitbar.',
  'storage.mirror.degenerate.missing-primary': 'Verweist auf ein Backend, das nicht mehr existiert.',
  'storage.remove.usedAsReplicaBy': 'Als Replik verwendet von: {primaries}',

  // Backfill + usage (backfill/stats/notifications spec)
  'storage.sync.now': 'Jetzt synchronisieren',
  'storage.sync.running': 'Synchronisiere… {done}/{total}',
  'storage.sync.counts': '{copied} kopiert · {skipped} übersprungen · {failed} fehlgeschlagen',
  'storage.sync.cancel': 'Synchronisierung abbrechen',
  'storage.sync.done': 'Synchronisierung abgeschlossen: {copied} kopiert, {deleted} gelöscht, {failed} fehlgeschlagen',
  'storage.sync.cancelled': 'Synchronisierung abgebrochen',
  'storage.sync.error': 'Synchronisierung fehlgeschlagen: {error}',
  'storage.sync.prompt': 'Vorhandene Objekte wurden noch nicht repliziert — jetzt synchronisieren?',
  'storage.sync.dismiss': 'Verwerfen',
  'storage.usage.line': '{count} Objekte · {size}',
  'storage.usage.line.one': '{count} Objekt · {size}',
  'storage.usage.computed': 'Nutzung berechnet {age}',
  'storage.usage.never': 'Nutzung noch nicht berechnet',
  'storage.usage.refresh': 'Aktualisieren',
  'storage.usage.compute': 'Jetzt berechnen',
  'storage.usage.legacyNote': 'enthält die alte Fotobibliothek',

  // Category migration (copy → flip → delta sweep)
  'storage.migrate.promptTitle': 'Vorhandene Objekte auf das neue Backend verschieben?',
  'storage.migrate.promptLine': '{category}: {count} Objekte ({size}) von {from} nach {to}',
  'storage.migrate.promptLine.one': '{category}: {count} Objekt ({size}) von {from} nach {to}',
  'storage.migrate.promptLineUnknown':
    '{category}: unbekannte Größe (Nutzung noch nicht gescannt) von {from} nach {to}',
  'storage.migrate.move': 'Vorhandene Objekte verschieben',
  'storage.migrate.routeOnly': 'Nur neue Schreibvorgänge umleiten',
  'storage.migrate.running': 'Verschiebe {category}… {done}/{total}',
  'storage.migrate.done': 'Verschieben abgeschlossen: {copied} kopiert, {skipped} übersprungen',
  'storage.migrate.doneFailures': '{failed} fehlgeschlagen — diese Objekte wurden nicht auf das neue Backend kopiert',
  'storage.migrate.failed': 'Verschieben fehlgeschlagen: {error} — die Kategorie wurde nicht umgestellt',
  'storage.migrate.cancelled': 'Verschieben abgebrochen — nichts wurde umgestellt',
  'storage.migrate.reclaimable': '{count} Objekte ({size}) verbleiben auf {from}, manuell freigeben',
  'storage.migrate.reclaimable.one': '{count} Objekt ({size}) verbleibt auf {from}, manuell freigeben',
  'storage.migrate.cancel': 'Verschieben abbrechen',
  'storage.migrate.promptCancel': 'Abbrechen',
  'storage.migrate.queued': 'In Warteschlange: {categories}',
  'storage.migrate.queueDropped':
    'Die nächste Verschiebung konnte nicht gestartet werden — die verbleibende Warteschlange wurde geleert: {categories}',
  'storage.reclaim.title': 'Nicht mehr genutzte Dateien',
  'storage.reclaim.hint':
    'Jede Nacht sucht TREK nach hochgeladenen Dateien, die keine Reise, kein Ort, kein Reisetagebuch, keine Sammlung und kein Nutzer mehr verwendet, etwa nach dem Löschen einer Reise.',
  'storage.reclaim.check': 'Jetzt prüfen',
  'storage.reclaim.checked': 'Letzte Prüfung: {age}',
  'storage.reclaim.never': 'Noch nicht geprüft',
  'storage.reclaim.delete': 'Nicht mehr genutzte Dateien löschen',
  'storage.reclaim.deleteHint':
    'Aus: Die nächtliche Prüfung berichtet nur. An: Eine Datei, die eine Woche lang nichts mehr verwendet, wird gelöscht. Was du in TREK löschst, wird so oder so sofort entfernt.',
  'storage.reclaim.freeable': 'Kann freigegeben werden',
  'storage.reclaim.waiting': 'Seit weniger als einer Woche ungenutzt',
  'storage.reclaim.deleted': 'Bei der letzten nächtlichen Bereinigung freigegeben',
  'storage.reclaim.nothing': 'Keine ungenutzten Dateien gefunden.',
  'storage.reclaim.stopped':
    'Die letzte Prüfung wurde vorzeitig beendet, weil währenddessen die Datenbank wiederhergestellt wurde.',
  'storage.reclaim.skip.sources_missing': 'Übersprungen: Nicht jeder Teil von TREK konnte gefragt werden',
  'storage.reclaim.skip.shared_location': 'Übersprungen: teilt den Speicherort mit einer anderen Kategorie',
  'storage.reclaim.skip.list_failed': 'Übersprungen: Die Dateien konnten nicht aufgelistet werden',
  'storage.reclaim.skip.source_failed': 'Übersprungen: Eine Abfrage ist fehlgeschlagen',
  'storage.reclaim.running': 'Wird geprüft…',
  'storage.reclaim.stoppedFailed':
    'Die letzte Prüfung wurde nach einem Fehler abgebrochen. Sie läuft heute Nacht erneut.',
  'storage.reclaim.skip.foreign_install': 'Übersprungen: Eine andere TREK-Installation nutzt diesen Speicher',
  'storage.reclaim.skip.owner_unknown': 'Übersprungen: TREK konnte diesen Speicher nicht als eigenen markieren',
  'storage.reclaim.skip.delete_failed': 'Abgebrochen: Der Speicher hat ein Löschen verweigert',
  'storage.reclaim.skip.interrupted': 'Vorzeitig beendet, die Zahlen sind unvollständig',
  'storage.reclaim.confirmNeeded':
    'Mehr als ein Fünftel dieser Dateien wirkt ungenutzt. Hier wird nichts gelöscht, bis du bestätigst, dass das so stimmt.',
  'storage.reclaim.confirm': 'Bestätigen',
  'storage.reclaim.confirmed': 'Bestätigt. Die nächtliche Bereinigung darf diese Dateien jetzt löschen.',
  'storage.reclaim.error.reclaim_busy': 'Gerade läuft eine andere Speicheraufgabe. Versuch es gleich noch einmal.',
  'storage.reclaim.error.reclaim_demo': 'Auf einer Demo-Instanz nicht verfügbar.',
  'storage.reclaim.error.reclaim_nothing_to_confirm': 'Es gibt nichts mehr zu bestätigen. Starte zuerst eine Prüfung.',
};
export default storage;
