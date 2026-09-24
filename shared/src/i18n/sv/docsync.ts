import type { TranslationStrings } from '../types';

const docsync: TranslationStrings = {
  'docsync.title': 'Dokumentsynkronisering',
  'docsync.noProviders': 'Inga dokumentleverantörer är tillgängliga',
  'docsync.noProvidersHint': 'En administratör för instansen slår på dem under Administration, Tillägg, Dokument.',
  'docsync.addProvider': 'Anslut en leverantör',
  'docsync.test': 'Testa anslutningen',
  'docsync.connect.optional': 'Valfritt',
  'docsync.connected': 'Ansluten',
  'docsync.chooseFolder': 'Välj mapp',
  'docsync.noFolders': 'Ingenting hittades på den här instansen än.',
  'docsync.newFolderPlaceholder': 'Namn på ny mapp',
  'docsync.syncNow': 'Synkronisera nu',
  'docsync.unlink': 'Koppla från',
  'docsync.confirmUnlink': 'Dokumenten finns kvar i TREK och i arkivet. Bara kopplingen mellan dem försvinner.',
  'docsync.syncEnabled': 'Synkronisera automatiskt',
  'docsync.deletePolicy': 'När ett dokument tas bort',
  'docsync.deleteUnlink': 'Behåll båda kopiorna',
  'docsync.deleteTrash': 'Flytta till papperskorgen',
  'docsync.conflictPolicy': 'När båda sidor ändrats',
  'docsync.onConflict.manual': 'Fråga mig',
  'docsync.onConflict.trek_wins': 'Behåll TREK-kopian',
  'docsync.onConflict.provider_wins': 'Behåll lagrets kopia',
  'docsync.webhookHint':
    'Klistra in den här URL:en hos din leverantör så kommer ändringar direkt. Utan den kontrollerar TREK med jämna mellanrum.',

  // Fält i anslutningsformuläret. Nycklarna speglar kolumnen `label` i
  // document_provider_fields, som lagrar ett nyckelsuffix i stället för text.
  'docsync.providerUrl': 'Adress',
  'docsync.providerApiToken': 'API-token',
  'docsync.providerApiKey': 'API-nyckel',
  'docsync.providerAppPassword': 'Applösenord',
  'docsync.providerAppToken': 'App-token',
  'docsync.providerUsername': 'Användarnamn',
  'docsync.providerPassword': 'Lösenord',
  'docsync.providerOrganization': 'Organisations-ID',
  'docsync.providerBasePath': 'Basmapp',
  'docsync.providerOTP': 'Tvåfaktorskod',
  'docsync.allowInsecureTls': 'Tillåt självsignerat certifikat',

  'docsync.hintPaperlessToken': 'Skapa en under My Profile i Paperless. Den bär kontots fulla rättigheter.',
  'docsync.hintPapraKey': 'Skapa en under API keys i Papra. Papra-nycklar når alltid alla organisationer du tillhör.',
  'docsync.hintPapraOrg': 'Det org_…-id som står i adressfältet i Papra.',
  'docsync.hintNextcloudLogin': 'Ditt inloggningsnamn i Nextcloud, inte din e-postadress.',
  'docsync.hintNextcloudAppPassword': 'Inställningar, Säkerhet, Skapa nytt applösenord. Aldrig ditt kontolösenord.',
  'docsync.hintOpenCloudToken': 'Skapas under apptokens i OpenCloud.',
  'docsync.hintBasePath': 'Där TREK letar efter resmappar. Standard är /TREK.',
  'docsync.hintSynologyUrl': 'Ta med porten, till exempel https://nas.example.com:5001',
  'docsync.hintSynologyUser': 'Helst ett eget DSM-konto med åtkomst till bara den här delade mappen.',
  'docsync.hintSynologyOtp': 'Behövs bara en gång, om kontot använder tvåfaktorsautentisering.',

  'docsync.linkState.never': 'Inte synkroniserad än',
  'docsync.linkState.ok': 'Synkroniserad',
  'docsync.linkState.partial': 'Delvis synkroniserad',
  'docsync.linkState.failed': 'Misslyckades',
  'docsync.linkState.needs_reauth': 'Logga in igen',
  'docsync.linkState.scope_lost': 'Mappen är borta',
  'docsync.linkState.orphaned': 'Ägaren lämnade resan',

  'docsync.state.pending': 'Väntar',
  'docsync.state.synced': 'Synkroniserad',
  'docsync.state.conflict': 'Konflikt',
  'docsync.state.rejected_type': 'Filtypen tillåts inte',
  'docsync.state.too_large': 'För stor',
  'docsync.state.error': 'Fel',
  'docsync.state.remote_missing': 'Saknas hos leverantören',
  'docsync.state.local_deleted': 'Borttagen i TREK',
  'docsync.state.scope_drift': 'Flyttad ut ur mappen',

  'docsync.conflict.resolve': "Lös {count}",

  'docsync.conflict.title': 'Båda kopiorna har ändrats',
  'docsync.conflict.keepTrek': 'Behåll TREK-versionen',
  'docsync.conflict.keepProvider': 'Behåll leverantörens version',
  'docsync.conflict.keepBoth': 'Behåll båda',

  // Felorsaker kommer som koder, aldrig som text från leverantören: den svarar på
  // engelska, eller med en proxys HTML-inloggningssida, och inget av det hör hemma här.
  'docsync.error.unreachable': 'Det gick inte att nå leverantören.',
  'docsync.error.tls_untrusted':
    'Certifikatet avvisades. Tillåt självsignerade certifikat om du litar på den här instansen.',
  'docsync.error.unauthorized': 'Uppgifterna avvisades.',
  'docsync.error.forbidden': 'Det här kontot får inte göra det.',
  'docsync.error.not_found': 'Hittades inte hos leverantören.',
  'docsync.error.scope_missing': 'Den anslutna mappen finns inte längre.',
  'docsync.error.rate_limited': 'Leverantören begränsar oss. TREK försöker igen senare.',
  'docsync.error.too_large': 'Filen är större än vad leverantören tar emot.',
  'docsync.error.unsupported_type': 'Leverantören tar inte emot den här filtypen.',
  'docsync.error.quota_exceeded': 'Leverantören har slut på utrymme.',
  'docsync.error.conflict': 'Dokumentet ändrades på båda sidor.',
  'docsync.error.checksum_mismatch': 'Överföringen kom inte fram hel.',
  'docsync.error.provider_error': 'Leverantören rapporterade ett fel.',
  'docsync.error.timeout': 'Leverantören tog för lång tid på sig att svara.',
  'docsync.error.ssrf_blocked': 'Den adressen är inte tillåten.',
  'docsync.error.mass_delete_guard':
    'Nästan alla dokument försvann på en gång, så ingenting ändrades. Kontrollera att mappen fortfarande är monterad.',
  'docsync.error.unknown': 'Något gick fel.',

  // ── Dialogen ───────────────────────────────────────────────────────────────
  'docsync.sidebar.connected': 'Den här resan',
  'docsync.addAnother': 'Lägg till en till',
  'docsync.syncing': 'Synkroniserar',
  'docsync.card.pickFolder': 'Ansluten, välj en mapp',

  'docsync.empty.title': 'Inget anslutet än',
  'docsync.empty.hintOwner':
    'Välj ett arkiv till vänster. TREK behåller en egen kopia av allt, så inget går förlorat om arkivet försvinner.',
  'docsync.empty.hintMember': 'Resans ägare ställer in det här. Dokumenten finns kvar i TREK oavsett.',

  // Hur varje produkt sorterar sina filer. Visas innan någon ansluter, eftersom
  // det är vad nästa steg kommer att fråga efter.
  'docsync.model.paperless': 'Sorterar efter tagg',
  'docsync.model.papra': 'Sorterar efter tagg, inom en organisation',
  'docsync.model.nextcloud': 'Sorterar i en mapp',
  'docsync.model.opencloud': 'Sorterar i en yta',
  'docsync.model.synologydrive': 'Sorterar i en mapp på NAS:en',

  // ── Flödesraden ────────────────────────────────────────────────────────────
  'docsync.flow.trek': 'TREK',
  'docsync.flow.toProvider': 'Ut till arkivet',
  'docsync.flow.toTrek': 'In från arkivet',
  'docsync.flow.documents': 'dokument',
  'docsync.flow.summary.both': 'Dokument går åt båda hållen.',
  'docsync.flow.summary.pull': 'Dokument kommer bara in.',
  'docsync.flow.summary.push': 'Dokument går bara ut.',
  'docsync.flow.summaryEditable.both': 'Går åt båda hållen. Tryck på ett spår för att stoppa det.',
  'docsync.flow.summaryEditable.pull': 'Kommer bara in. Tryck på andra spåret för att skicka ut också.',
  'docsync.flow.summaryEditable.push': 'Går bara ut. Tryck på andra spåret för att hämta in också.',

  // ── En koppling ────────────────────────────────────────────────────────────
  'docsync.binding.settings': 'Inställningar',
  'docsync.binding.folder': 'Mapp',
  'docsync.binding.lastRun': 'Senaste körning',
  'docsync.binding.autoOff': 'Pausad',
  'docsync.binding.neverRun': 'inte körd än',
  'docsync.binding.deleteHint': 'Vad som händer med kopian på andra sidan.',
  'docsync.binding.conflictHint': 'Vilken kopia som blir kvar när ett dokument redigerats på båda ställena.',
  'docsync.binding.autoHint': 'Leta efter ändringar i bakgrunden.',
  'docsync.binding.webhookTitle': 'Direkta uppdateringar',
  'docsync.binding.copy': 'Kopiera',
  'docsync.binding.copied': 'Kopierad',

  // ── Ansluta ────────────────────────────────────────────────────────────────
  'docsync.connect.submit': 'Anslut',
  'docsync.connect.testing': 'Försöker nå den',
  'docsync.connect.okAs': 'Nådde den, inloggad som {account}',
  'docsync.connect.insecureHint': 'För en instans i ditt eget nätverk med ett självsignerat certifikat.',
  'docsync.connect.about.paperless':
    'TREK lägger den här resan under en egen tagg och rör aldrig resten av ditt arkiv.',
  'docsync.connect.about.papra': 'Välj organisationen som resan hör till. TREK lägger den under en egen tagg där inne.',
  'docsync.connect.about.nextcloud':
    'Använd ett applösenord, inte ditt kontolösenord: det klarar tvåfaktor och kan återkallas för sig.',
  'docsync.connect.about.opencloud': 'TREK får en egen yta för den här resan, skild från allt annat.',
  'docsync.connect.about.synologydrive': 'Helst ett DSM-konto som bara når den delade mapp resan ska använda.',

  // ── Välja behållaren ───────────────────────────────────────────────────────
  'docsync.scope.title': 'Var ska den här resan ligga i {provider}?',
  'docsync.scope.intro': 'Bara det som ligger här synkroniseras. Allt annat i ditt arkiv hålls utanför TREK.',
  'docsync.scope.createTitle': 'Skapa en ny',
  'docsync.scope.createAction': 'Skapa',
  'docsync.scope.pickTitle': 'Eller använd en du redan har',
  'docsync.scope.search': 'Sök',
  'docsync.scope.noMatch': 'Inget matchar det.',

  // ── Sådant någon måste ta ställning till ───────────────────────────────────
  'docsync.issues.title': 'Behöver ses över',
  'docsync.issues.conflict': 'Ändrad på båda ställena. Välj vilken som ska behållas.',
  'docsync.issues.remote_missing': 'Borta från arkivet. TREK-kopian finns kvar.',
  'docsync.issues.rejected_type': 'Den här filtypen tillåts inte här.',
  'docsync.issues.too_large': 'Större än gränsen.',
  'docsync.issues.error': 'Överföringen gick inte igenom.',

  'docsync.error.unknown_provider': 'Den här leverantören är inte tillgänglig på den här instansen.',
  'docsync.error.provider_disabled': 'Pausad: en administratör har stängt av den här leverantören. Synkroniseringen fortsätter när den slås på igen.',
  'docsync.binding.reconnect': 'Anslut igen',
};

export default docsync;
