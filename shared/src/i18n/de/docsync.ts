import type { TranslationStrings } from '../types';

const docsync: TranslationStrings = {
  'docsync.title': 'Dokumentenabgleich',
  'docsync.noProviders': 'Es sind keine Dokumentenanbieter verfügbar',
  'docsync.noProvidersHint':
    'Ein Administrator dieser Instanz schaltet sie unter Administration, Addons, Dokumente frei.',
  'docsync.addProvider': 'Anbieter verbinden',
  'docsync.test': 'Verbindung testen',
  'docsync.connect.optional': 'Optional',
  'docsync.connected': 'Verbunden',
  'docsync.chooseFolder': 'Ordner wählen',
  'docsync.noFolders': 'Auf dieser Instanz wurde noch nichts gefunden.',
  'docsync.newFolderPlaceholder': 'Name des neuen Ordners',
  'docsync.syncNow': 'Jetzt abgleichen',
  'docsync.unlink': 'Trennen',
  'docsync.confirmUnlink': 'Die Dokumente bleiben in TREK und im Speicher. Nur die Verknüpfung dazwischen fällt weg.',
  'docsync.syncEnabled': 'Automatisch abgleichen',
  'docsync.deletePolicy': 'Wenn ein Dokument gelöscht wird',
  'docsync.deleteUnlink': 'Beide Kopien behalten',
  'docsync.deleteTrash': 'In den Papierkorb verschieben',
  'docsync.conflictPolicy': 'Wenn beide Seiten geändert wurden',
  'docsync.onConflict.manual': 'Mich fragen',
  'docsync.onConflict.trek_wins': 'Die TREK-Kopie behalten',
  'docsync.onConflict.provider_wins': 'Die Kopie im Speicher behalten',
  'docsync.webhookHint':
    'Trage diese URL bei deinem Anbieter ein, damit Änderungen sofort ankommen. Ohne sie fragt TREK in festen Abständen nach.',

  // Felder des Verbindungsformulars. Die Keys spiegeln die Spalte `label` in
  // document_provider_fields, die ein Key-Suffix speichert und keinen Text.
  'docsync.providerUrl': 'Adresse',
  'docsync.providerApiToken': 'API-Token',
  'docsync.providerApiKey': 'API-Schlüssel',
  'docsync.providerAppPassword': 'App-Passwort',
  'docsync.providerAppToken': 'App-Token',
  'docsync.providerUsername': 'Benutzername',
  'docsync.providerPassword': 'Passwort',
  'docsync.providerOrganization': 'Organisations-ID',
  'docsync.providerBasePath': 'Basisordner',
  'docsync.providerOTP': 'Zwei-Faktor-Code',
  'docsync.allowInsecureTls': 'Selbstsigniertes Zertifikat zulassen',

  'docsync.hintPaperlessToken': 'In Paperless unter My Profile anzulegen. Er trägt die vollen Rechte dieses Kontos.',
  'docsync.hintPapraKey':
    'In Papra unter API keys anzulegen. Papra-Schlüssel erreichen immer jede Organisation, der du angehörst.',
  'docsync.hintPapraOrg': 'Die org_…-ID aus der Adresszeile von Papra.',
  'docsync.hintNextcloudLogin': 'Dein Nextcloud-Anmeldename, nicht deine E-Mail-Adresse.',
  'docsync.hintNextcloudAppPassword':
    'Einstellungen, Sicherheit, Neues App-Passwort erstellen. Niemals dein Kontopasswort.',
  'docsync.hintOpenCloudToken': 'Wird in OpenCloud unter App-Tokens angelegt.',
  'docsync.hintBasePath': 'Wo TREK nach Reiseordnern sucht. Standard ist /TREK.',
  'docsync.hintSynologyUrl': 'Mit Port angeben, zum Beispiel https://nas.example.com:5001',
  'docsync.hintSynologyUser': 'Am besten ein eigenes DSM-Konto, das nur auf diesen freigegebenen Ordner zugreift.',
  'docsync.hintSynologyOtp': 'Nur einmal nötig, wenn das Konto Zwei-Faktor-Authentifizierung nutzt.',

  'docsync.linkState.never': 'Noch nicht abgeglichen',
  'docsync.linkState.ok': 'Im Gleichstand',
  'docsync.linkState.partial': 'Teilweise abgeglichen',
  'docsync.linkState.failed': 'Fehlgeschlagen',
  'docsync.linkState.needs_reauth': 'Erneut anmelden',
  'docsync.linkState.scope_lost': 'Ordner ist weg',
  'docsync.linkState.orphaned': 'Besitzer hat die Reise verlassen',

  'docsync.state.pending': 'Wartet',
  'docsync.state.synced': 'Abgeglichen',
  'docsync.state.conflict': 'Konflikt',
  'docsync.state.rejected_type': 'Dateityp nicht erlaubt',
  'docsync.state.too_large': 'Zu groß',
  'docsync.state.error': 'Fehler',
  'docsync.state.remote_missing': 'Beim Anbieter nicht vorhanden',
  'docsync.state.local_deleted': 'In TREK gelöscht',
  'docsync.state.scope_drift': 'Aus dem Ordner verschoben',

  'docsync.conflict.resolve': "{count} klären",

  'docsync.conflict.title': 'Beide Kopien wurden geändert',
  'docsync.conflict.keepTrek': 'Die TREK-Version behalten',
  'docsync.conflict.keepProvider': 'Die Version des Anbieters behalten',
  'docsync.conflict.keepBoth': 'Beide behalten',

  // Fehlergründe kommen als Codes an, nie als Text des Anbieters: der antwortet
  // englisch oder mit der HTML-Loginseite eines Proxys, und beides gehört nicht hierher.
  'docsync.error.unreachable': 'Der Anbieter war nicht erreichbar.',
  'docsync.error.tls_untrusted':
    'Das Zertifikat wurde abgelehnt. Lass selbstsignierte Zertifikate zu, wenn du dieser Instanz vertraust.',
  'docsync.error.unauthorized': 'Die Zugangsdaten wurden abgelehnt.',
  'docsync.error.forbidden': 'Dieses Konto darf das nicht.',
  'docsync.error.not_found': 'Beim Anbieter nicht gefunden.',
  'docsync.error.scope_missing': 'Den verbundenen Ordner gibt es nicht mehr.',
  'docsync.error.rate_limited': 'Der Anbieter bremst uns aus. TREK versucht es später noch einmal.',
  'docsync.error.too_large': 'Die Datei ist größer, als der Anbieter annimmt.',
  'docsync.error.unsupported_type': 'Der Anbieter nimmt diesen Dateityp nicht an.',
  'docsync.error.quota_exceeded': 'Beim Anbieter ist kein Speicher mehr frei.',
  'docsync.error.conflict': 'Das Dokument wurde auf beiden Seiten geändert.',
  'docsync.error.checksum_mismatch': 'Die Übertragung ist nicht unversehrt angekommen.',
  'docsync.error.provider_error': 'Der Anbieter hat einen Fehler gemeldet.',
  'docsync.error.timeout': 'Der Anbieter hat zu lange für eine Antwort gebraucht.',
  'docsync.error.ssrf_blocked': 'Diese Adresse ist nicht erlaubt.',
  'docsync.error.mass_delete_guard':
    'Es sind auf einen Schlag fast alle Dokumente verschwunden, deshalb wurde nichts geändert. Prüfe, ob der Ordner noch eingebunden ist.',
  'docsync.error.unknown': 'Da ist etwas schiefgelaufen.',

  // ── Der Dialog ─────────────────────────────────────────────────────────────
  'docsync.sidebar.connected': 'Diese Reise',
  'docsync.addAnother': 'Weiteren hinzufügen',
  'docsync.syncing': 'Wird abgeglichen',
  'docsync.card.pickFolder': 'Verbunden, jetzt Ordner wählen',

  'docsync.empty.title': 'Noch nichts verbunden',
  'docsync.empty.hintOwner':
    'Wähle links einen Speicher. TREK behält von allem eine eigene Kopie, es geht also nichts verloren, wenn er wegfällt.',
  'docsync.empty.hintMember': 'Das richtet der Besitzer der Reise ein. Die Dokumente bleiben so oder so in TREK.',

  // Wie das jeweilige Produkt ablegt. Steht vor dem Verbinden da, weil der
  // nächste Schritt genau danach fragt.
  'docsync.model.paperless': 'Legt nach Tag ab',
  'docsync.model.papra': 'Legt nach Tag ab, innerhalb einer Organisation',
  'docsync.model.nextcloud': 'Legt in einem Ordner ab',
  'docsync.model.opencloud': 'Legt in einem Space ab',
  'docsync.model.synologydrive': 'Legt in einem Ordner auf dem NAS ab',

  // ── Die Flussleiste ────────────────────────────────────────────────────────
  'docsync.flow.trek': 'TREK',
  'docsync.flow.toProvider': 'Raus zum Speicher',
  'docsync.flow.toTrek': 'Rein vom Speicher',
  'docsync.flow.documents': 'Dokumente',
  'docsync.flow.summary.both': 'Dokumente gehen in beide Richtungen.',
  'docsync.flow.summary.pull': 'Dokumente kommen nur herein.',
  'docsync.flow.summary.push': 'Dokumente gehen nur hinaus.',
  'docsync.flow.summaryEditable.both': 'Beide Richtungen. Spur antippen, um sie zu stoppen.',
  'docsync.flow.summaryEditable.pull': 'Kommt nur herein. Andere Spur antippen, um auch zu senden.',
  'docsync.flow.summaryEditable.push': 'Geht nur hinaus. Andere Spur antippen, um auch zu empfangen.',

  // ── Eine Verknüpfung ───────────────────────────────────────────────────────
  'docsync.binding.settings': 'Einstellungen',
  'docsync.binding.folder': 'Ordner',
  'docsync.binding.lastRun': 'Zuletzt gelaufen',
  'docsync.binding.autoOff': 'Pausiert',
  'docsync.binding.neverRun': 'noch nie gelaufen',
  'docsync.binding.deleteHint': 'Was mit der Kopie auf der anderen Seite geschieht.',
  'docsync.binding.conflictHint': 'Welche Kopie bleibt, wenn ein Dokument an beiden Orten bearbeitet wurde.',
  'docsync.binding.autoHint': 'Im Hintergrund nach Änderungen suchen.',
  'docsync.binding.webhookTitle': 'Sofortige Updates',
  'docsync.binding.copy': 'Kopieren',
  'docsync.binding.copied': 'Kopiert',

  // ── Verbinden ──────────────────────────────────────────────────────────────
  'docsync.connect.submit': 'Verbinden',
  'docsync.connect.testing': 'Verbindung wird versucht',
  'docsync.connect.okAs': 'Erreicht, angemeldet als {account}',
  'docsync.connect.insecureHint': 'Für eine Instanz im eigenen Netz mit selbstsigniertem Zertifikat.',
  'docsync.connect.about.paperless':
    'TREK legt diese Reise unter einem eigenen Tag ab und rührt den Rest deines Archivs nicht an.',
  'docsync.connect.about.papra':
    'Wähle die Organisation, zu der diese Reise gehört. TREK legt sie darin unter einem eigenen Tag ab.',
  'docsync.connect.about.nextcloud':
    'Nimm ein App-Passwort, nicht dein Kontopasswort: Es übersteht Zwei-Faktor und lässt sich einzeln widerrufen.',
  'docsync.connect.about.opencloud': 'TREK bekommt für diese Reise einen eigenen Space, getrennt von allem anderen.',
  'docsync.connect.about.synologydrive':
    'Am besten ein DSM-Konto, das nur an den freigegebenen Ordner dieser Reise kommt.',

  // ── Den Ablageort wählen ───────────────────────────────────────────────────
  'docsync.scope.title': 'Wo soll diese Reise in {provider} liegen?',
  'docsync.scope.intro':
    'Abgeglichen wird nur, was hier drin liegt. Alles andere in deinem Speicher bleibt außerhalb von TREK.',
  'docsync.scope.createTitle': 'Neu anlegen',
  'docsync.scope.createAction': 'Anlegen',
  'docsync.scope.pickTitle': 'Oder etwas Vorhandenes nehmen',
  'docsync.scope.search': 'Suchen',
  'docsync.scope.noMatch': 'Dazu passt nichts.',

  // ── Was jemand entscheiden muss ────────────────────────────────────────────
  'docsync.issues.title': 'Braucht einen Blick',
  'docsync.issues.conflict': 'An beiden Stellen geändert. Wähle, welche Fassung bleibt.',
  'docsync.issues.remote_missing': 'Im Speicher nicht mehr da. Die Kopie in TREK ist noch hier.',
  'docsync.issues.rejected_type': 'Dieser Dateityp ist hier nicht erlaubt.',
  'docsync.issues.too_large': 'Größer als das Limit.',
  'docsync.issues.error': 'Die Übertragung ist nicht durchgegangen.',

  'docsync.error.unknown_provider': 'Dieser Anbieter steht auf dieser Instanz nicht zur Verfügung.',
  'docsync.error.provider_disabled': 'Pausiert: Ein Administrator hat diesen Anbieter abgeschaltet. Der Abgleich läuft weiter, sobald er wieder eingeschaltet ist.',
};

export default docsync;
