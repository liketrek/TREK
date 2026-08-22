import type { TranslationStrings } from '../types';

const storage: TranslationStrings = {
  'storage.field.root': 'Stammverzeichnis',
  'storage.help.root': 'Absoluter Pfad auf dem Server, unter dem dieser Backend-Dienst seine Objekte speichert.',
  'storage.field.endpoint': 'Endpunkt-URL',
  'storage.help.endpoint':
    'Basis-URL des S3-kompatiblen Dienstes, z. B. https://s3.example.com oder http://127.0.0.1:9000.',
  'storage.field.bucket': 'Bucket',
  'storage.field.accessKeyId': 'Zugriffsschlüssel-ID',
  'storage.field.secretAccessKey': 'Geheimer Zugriffsschlüssel',
  'storage.field.region': 'Region',
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
  'storage.backends.title': 'Backends',
  'storage.backends.add': 'Backend hinzufügen',
  'storage.backends.usedBy': 'Verwendet von: {categories}',
  'storage.backends.unused': 'Keiner Kategorie zugewiesen',
  'storage.backends.envReadOnly': 'Durch eine Umgebungsvariable definiert — schreibgeschützt',
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
  'storage.form.name': 'Name',
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
  'storage.category.backups': 'Backups',

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
  'storage.usage.line': '{objects} Objekte · {size}',
  'storage.usage.computed': 'Nutzung berechnet {age}',
  'storage.usage.never': 'Nutzung noch nicht berechnet',
  'storage.usage.refresh': 'Aktualisieren',
  'storage.usage.compute': 'Jetzt berechnen',
  'storage.usage.legacyNote': 'enthält die alte Fotobibliothek',

  // Category migration (copy → flip → delta sweep)
  'storage.migrate.promptTitle': 'Vorhandene Objekte auf das neue Backend verschieben?',
  'storage.migrate.promptLine': '{category}: {objects} Objekte ({size}) von {from} nach {to}',
  'storage.migrate.promptLineUnknown':
    '{category}: unbekannte Größe (Nutzung noch nicht gescannt) von {from} nach {to}',
  'storage.migrate.move': 'Vorhandene Objekte verschieben',
  'storage.migrate.routeOnly': 'Nur neue Schreibvorgänge umleiten',
  'storage.migrate.running': 'Verschiebe {category}… {done}/{total}',
  'storage.migrate.done': 'Verschieben abgeschlossen: {copied} kopiert, {skipped} übersprungen',
  'storage.migrate.doneFailures': '{failed} fehlgeschlagen — diese Objekte wurden nicht auf das neue Backend kopiert',
  'storage.migrate.failed': 'Verschieben fehlgeschlagen: {error} — die Kategorie wurde nicht umgestellt',
  'storage.migrate.cancelled': 'Verschieben abgebrochen — nichts wurde umgestellt',
  'storage.migrate.reclaimable': '{objects} Objekte ({size}) verbleiben auf {from} — manuell freigeben',
  'storage.migrate.cancel': 'Verschieben abbrechen',
  'storage.migrate.promptCancel': 'Abbrechen',
  'storage.migrate.queued': 'In Warteschlange: {categories}',
  'storage.migrate.queueDropped': 'Die nächste Verschiebung konnte nicht gestartet werden — die verbleibende Warteschlange wurde geleert: {categories}',
};
export default storage;
