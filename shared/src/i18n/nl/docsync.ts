import type { TranslationStrings } from '../types';

const docsync: TranslationStrings = {
  'docsync.title': 'Documentsynchronisatie',
  'docsync.noProviders': 'Er zijn geen documentaanbieders beschikbaar',
  'docsync.noProvidersHint': 'Een beheerder van deze instantie zet ze aan onder Beheer, Add-ons, Documenten.',
  'docsync.addProvider': 'Aanbieder koppelen',
  'docsync.test': 'Verbinding testen',
  'docsync.connect.optional': 'Optioneel',
  'docsync.connected': 'Verbonden',
  'docsync.chooseFolder': 'Map kiezen',
  'docsync.noFolders': 'Nog niets gevonden op deze instantie.',
  'docsync.newFolderPlaceholder': 'Naam van de nieuwe map',
  'docsync.syncNow': 'Nu synchroniseren',
  'docsync.unlink': 'Verbinding verbreken',
  'docsync.confirmUnlink': 'Documenten blijven in TREK en in de opslag. Alleen de koppeling ertussen verdwijnt.',
  'docsync.syncEnabled': 'Automatisch synchroniseren',
  'docsync.deletePolicy': 'Als een document wordt verwijderd',
  'docsync.deleteUnlink': 'Beide kopieën behouden',
  'docsync.deleteTrash': 'Naar de prullenbak verplaatsen',
  'docsync.conflictPolicy': 'Als beide kanten zijn gewijzigd',
  'docsync.onConflict.manual': 'Vraag het mij',
  'docsync.onConflict.trek_wins': 'De TREK-kopie behouden',
  'docsync.onConflict.provider_wins': 'De kopie in de opslag behouden',
  'docsync.webhookHint':
    'Plak deze URL bij je aanbieder, dan komen wijzigingen meteen binnen. Zonder die URL kijkt TREK op vaste tijden.',

  // Velden van het verbindingsformulier. De keys volgen de kolom `label` in
  // document_provider_fields, die een key-achtervoegsel bewaart en geen tekst.
  'docsync.providerUrl': 'Adres',
  'docsync.providerApiToken': 'API-token',
  'docsync.providerApiKey': 'API-sleutel',
  'docsync.providerAppPassword': 'App-wachtwoord',
  'docsync.providerAppToken': 'App-token',
  'docsync.providerUsername': 'Gebruikersnaam',
  'docsync.providerPassword': 'Wachtwoord',
  'docsync.providerOrganization': 'Organisatie-ID',
  'docsync.providerBasePath': 'Basismap',
  'docsync.providerOTP': 'Tweestapscode',
  'docsync.allowInsecureTls': 'Zelfondertekend certificaat toestaan',

  'docsync.hintPaperlessToken':
    'Maak er een aan in Paperless onder My Profile. Hij draagt alle rechten van dat account.',
  'docsync.hintPapraKey':
    'Maak er een aan in Papra onder API keys. Papra-sleutels reiken altijd tot elke organisatie waar je bij hoort.',
  'docsync.hintPapraOrg': 'De org_…-id uit de adresbalk van Papra.',
  'docsync.hintNextcloudLogin': 'Je Nextcloud-inlognaam, niet je e-mailadres.',
  'docsync.hintNextcloudAppPassword':
    'Instellingen, Beveiliging, Nieuw app-wachtwoord aanmaken. Nooit je accountwachtwoord.',
  'docsync.hintOpenCloudToken': 'Wordt in OpenCloud aangemaakt onder app-tokens.',
  'docsync.hintBasePath': 'Waar TREK naar reismappen zoekt. Standaard /TREK.',
  'docsync.hintSynologyUrl': 'Vermeld de poort, bijvoorbeeld https://nas.example.com:5001',
  'docsync.hintSynologyUser': 'Het beste een apart DSM-account dat alleen bij deze gedeelde map kan.',
  'docsync.hintSynologyOtp': 'Maar één keer nodig, als het account tweestapsverificatie gebruikt.',

  'docsync.linkState.never': 'Nog niet gesynchroniseerd',
  'docsync.linkState.ok': 'Synchroon',
  'docsync.linkState.partial': 'Deels gesynchroniseerd',
  'docsync.linkState.failed': 'Mislukt',
  'docsync.linkState.needs_reauth': 'Opnieuw aanmelden',
  'docsync.linkState.scope_lost': 'De map is weg',
  'docsync.linkState.orphaned': 'Eigenaar heeft de reis verlaten',

  'docsync.state.pending': 'Wacht',
  'docsync.state.synced': 'Gesynchroniseerd',
  'docsync.state.conflict': 'Conflict',
  'docsync.state.rejected_type': 'Bestandstype niet toegestaan',
  'docsync.state.too_large': 'Te groot',
  'docsync.state.error': 'Fout',
  'docsync.state.remote_missing': 'Ontbreekt bij de aanbieder',
  'docsync.state.local_deleted': 'Verwijderd in TREK',
  'docsync.state.scope_drift': 'Buiten de map verplaatst',

  'docsync.conflict.resolve': "{count} oplossen",

  'docsync.conflict.title': 'Beide kopieën zijn gewijzigd',
  'docsync.conflict.keepTrek': 'De TREK-versie behouden',
  'docsync.conflict.keepProvider': 'De versie van de aanbieder behouden',
  'docsync.conflict.keepBoth': 'Allebei behouden',

  // Foutredenen komen als code binnen, nooit als tekst van de aanbieder: die
  // antwoordt in het Engels of met de HTML-inlogpagina van een proxy, en geen van beide hoort hier.
  'docsync.error.unreachable': 'De aanbieder was niet bereikbaar.',
  'docsync.error.tls_untrusted':
    'Het certificaat is geweigerd. Sta zelfondertekende certificaten toe als je deze instantie vertrouwt.',
  'docsync.error.unauthorized': 'De inloggegevens zijn geweigerd.',
  'docsync.error.forbidden': 'Dit account mag dat niet.',
  'docsync.error.not_found': 'Niet gevonden bij de aanbieder.',
  'docsync.error.scope_missing': 'De gekoppelde map bestaat niet meer.',
  'docsync.error.rate_limited': 'De aanbieder remt ons af. TREK probeert het later opnieuw.',
  'docsync.error.too_large': 'Het bestand is groter dan de aanbieder accepteert.',
  'docsync.error.unsupported_type': 'De aanbieder accepteert dit bestandstype niet.',
  'docsync.error.quota_exceeded': 'De aanbieder heeft geen ruimte meer.',
  'docsync.error.conflict': 'Het document is aan beide kanten gewijzigd.',
  'docsync.error.checksum_mismatch': 'De overdracht is niet intact aangekomen.',
  'docsync.error.provider_error': 'De aanbieder meldde een fout.',
  'docsync.error.timeout': 'De aanbieder deed er te lang over om te antwoorden.',
  'docsync.error.ssrf_blocked': 'Dat adres is niet toegestaan.',
  'docsync.error.mass_delete_guard':
    'De meeste documenten verdwenen in één keer, dus er is niets gewijzigd. Controleer of de map nog gekoppeld is.',
  'docsync.error.unknown': 'Er ging iets mis.',

  // ── Het venster ────────────────────────────────────────────────────────────
  'docsync.sidebar.connected': 'Deze reis',
  'docsync.addAnother': 'Nog een toevoegen',
  'docsync.syncing': 'Bezig met synchroniseren',
  'docsync.card.pickFolder': 'Verbonden, kies een map',

  'docsync.empty.title': 'Nog niets verbonden',
  'docsync.empty.hintOwner':
    'Kies links een opslag. TREK houdt van alles een eigen kopie, dus er gaat niets verloren als die wegvalt.',
  'docsync.empty.hintMember': 'De eigenaar van de reis stelt dit in. Documenten blijven hoe dan ook in TREK.',

  // Hoe elk product dingen opbergt. Staat er al voordat iemand verbindt, want het
  // is wat het volgende scherm gaat vragen.
  'docsync.model.paperless': 'Ordent op tag',
  'docsync.model.papra': 'Ordent op tag, binnen een organisatie',
  'docsync.model.nextcloud': 'Ordent in een map',
  'docsync.model.opencloud': 'Ordent in een ruimte',
  'docsync.model.synologydrive': 'Ordent in een map op de NAS',

  // ── De stroombalk ──────────────────────────────────────────────────────────
  'docsync.flow.trek': 'TREK',
  'docsync.flow.toProvider': 'Naar de opslag',
  'docsync.flow.toTrek': 'Uit de opslag',
  'docsync.flow.documents': 'documenten',
  'docsync.flow.summary.both': 'Documenten gaan beide kanten op.',
  'docsync.flow.summary.pull': 'Documenten komen alleen binnen.',
  'docsync.flow.summary.push': 'Documenten gaan alleen naar buiten.',
  'docsync.flow.summaryEditable.both': 'Gaat beide kanten op. Tik op een baan om die te stoppen.',
  'docsync.flow.summaryEditable.pull': 'Komt alleen binnen. Tik op de andere baan om ook te versturen.',
  'docsync.flow.summaryEditable.push': 'Gaat alleen naar buiten. Tik op de andere baan om ook op te halen.',

  // ── Eén koppeling ──────────────────────────────────────────────────────────
  'docsync.binding.settings': 'Instellingen',
  'docsync.binding.folder': 'Map',
  'docsync.binding.lastRun': 'Laatst uitgevoerd',
  'docsync.binding.autoOff': 'Gepauzeerd',
  'docsync.binding.neverRun': 'nog niet uitgevoerd',
  'docsync.binding.deleteHint': 'Wat er met de kopie aan de andere kant gebeurt.',
  'docsync.binding.conflictHint': 'Welke kopie blijft als een document op beide plekken is bewerkt.',
  'docsync.binding.autoHint': 'Op de achtergrond op wijzigingen controleren.',
  'docsync.binding.webhookTitle': 'Directe updates',
  'docsync.binding.copy': 'Kopiëren',
  'docsync.binding.copied': 'Gekopieerd',

  // ── Verbinden ──────────────────────────────────────────────────────────────
  'docsync.connect.submit': 'Verbinden',
  'docsync.connect.testing': 'Bezig met verbinden',
  'docsync.connect.okAs': 'Bereikt, aangemeld als {account}',
  'docsync.connect.insecureHint': 'Voor een instantie op je eigen netwerk met een zelfondertekend certificaat.',
  'docsync.connect.about.paperless': 'TREK zet deze reis onder een eigen tag en komt nooit aan de rest van je archief.',
  'docsync.connect.about.papra':
    'Kies de organisatie waar deze reis bij hoort. TREK zet hem daarbinnen onder een eigen tag.',
  'docsync.connect.about.nextcloud':
    'Gebruik een app-wachtwoord, niet je accountwachtwoord: het blijft werken met tweestapsverificatie en je kunt het los intrekken.',
  'docsync.connect.about.opencloud': 'TREK krijgt een eigen ruimte voor deze reis, los van al het andere.',
  'docsync.connect.about.synologydrive': 'Het beste een DSM-account dat alleen bij de gedeelde map van deze reis kan.',

  // ── De plek kiezen ─────────────────────────────────────────────────────────
  'docsync.scope.title': 'Waar moet deze reis in {provider} komen te staan?',
  'docsync.scope.intro': 'Alleen wat hierin staat wordt gesynchroniseerd. De rest van je opslag blijft buiten TREK.',
  'docsync.scope.createTitle': 'Een nieuwe maken',
  'docsync.scope.createAction': 'Aanmaken',
  'docsync.scope.pickTitle': 'Of gebruik er een die je al hebt',
  'docsync.scope.search': 'Zoeken',
  'docsync.scope.noMatch': 'Niets komt daarmee overeen.',

  // ── Dingen waar iemand over moet beslissen ─────────────────────────────────
  'docsync.issues.title': 'Vraagt om aandacht',
  'docsync.issues.conflict': 'Op beide plekken gewijzigd. Kies welke je behoudt.',
  'docsync.issues.remote_missing': 'Weg uit de opslag. De kopie in TREK staat er nog.',
  'docsync.issues.rejected_type': 'Dit bestandstype is hier niet toegestaan.',
  'docsync.issues.too_large': 'Groter dan de limiet.',
  'docsync.issues.error': 'De overdracht is niet gelukt.',

  'docsync.error.unknown_provider': 'Deze aanbieder is niet beschikbaar op deze instantie.',
  'docsync.error.provider_disabled': 'Gepauzeerd: een beheerder heeft deze aanbieder uitgeschakeld. De synchronisatie gaat verder zodra hij weer aanstaat.',
};

export default docsync;
