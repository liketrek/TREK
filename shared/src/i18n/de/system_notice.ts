import type { TranslationStrings } from '../types';

const system_notice: TranslationStrings = {
  'system_notice.welcome_v1.title': 'Willkommen bei TREK',
  'system_notice.welcome_v1.body':
    'Dein All-in-one-Reiseplaner. Erstelle Reisepläne, teile sie mit Freunden und bleib organisiert – online und offline.',
  'system_notice.welcome_v1.cta_label': 'Reise planen',
  'system_notice.welcome_v1.hero_alt': 'Malerisches Reiseziel mit TREK-Planungs-UI',
  'system_notice.welcome_v1.highlight_plan': 'Tagesweise Reisepläne für jede Reise',
  'system_notice.welcome_v1.highlight_share': 'Gemeinsam mit Reisepartnern planen',
  'system_notice.welcome_v1.highlight_offline': 'Funktioniert offline auf dem Handy',
  'system_notice.dev_test_modal.title': '[Dev] Test notice',
  'system_notice.dev_test_modal.body': 'This is a dev-only test notice.',
  'system_notice.pager.prev': 'Vorherige Meldung',
  'system_notice.pager.next': 'Nächste Meldung',
  'system_notice.pager.counter': '{current} / {total}',
  'system_notice.pager.goto': 'Zu Meldung {n}',
  'system_notice.pager.position': 'Meldung {current} von {total}',
  'system_notice.v3_photos.title': 'Fotos wurden in 3.0 verschoben',
  'system_notice.v3_photos.body':
    '**Fotos** im Trip-Planer wurden entfernt. Deine Fotos sind sicher — TREK hat deine Immich- oder Synology-Bibliothek nie verändert.\n\nFotos befinden sich jetzt im **Journey**-Addon. Journey ist optional — falls es noch nicht verfügbar ist, bitte deinen Admin, es unter Admin → Addons zu aktivieren.',
  'system_notice.v3_journey.title': 'Neu: Journey — dein Reisetagebuch',
  'system_notice.v3_journey.body':
    'Dokumentiere deine Reisen als lebendige Geschichten mit Zeitachsen, Fotogalerien und interaktiven Karten.',
  'system_notice.v3_journey.cta_label': 'Journey öffnen',
  'system_notice.v3_journey.highlight_timeline': 'Zeitleiste und Galerie',
  'system_notice.v3_journey.highlight_photos': 'Import von Immich oder Synology',
  'system_notice.v3_journey.highlight_share': 'Öffentlich teilen — kein Login nötig',
  'system_notice.v3_journey.highlight_export': 'Als PDF-Fotobuch exportieren',
  'system_notice.v3_features.title': 'Weitere Highlights in 3.0',
  'system_notice.v3_features.body': 'Ein paar weitere Neuerungen in diesem Release.',
  'system_notice.v3_features.highlight_dashboard': 'Mobile-first Dashboard-Redesign',
  'system_notice.v3_features.highlight_offline': 'Vollständiger Offline-Modus als PWA',
  'system_notice.v3_features.highlight_search': 'Echtzeit-Autovervollständigung für Orte',
  'system_notice.v3_features.highlight_import': 'Orte aus KMZ/KML-Dateien importieren',
  'system_notice.v3_mcp.title': 'MCP: OAuth 2.1-Upgrade',
  'system_notice.v3_mcp.body':
    'Die MCP-Integration wurde vollständig überarbeitet. OAuth 2.1 ist jetzt die empfohlene Authentifizierungsmethode. Statische Tokens (trek_…) sind veraltet und werden in einer zukünftigen Version entfernt.',
  'system_notice.v3_mcp.highlight_oauth': 'OAuth 2.1 empfohlen (mcp-remote)',
  'system_notice.v3_mcp.highlight_scopes': '24 feingranulare Berechtigungs-Scopes',
  'system_notice.v3_mcp.highlight_deprecated': 'Statische trek_-Tokens veraltet',
  'system_notice.v3_mcp.highlight_tools': 'Erweitertes Toolset & Prompts',
  'system_notice.v3_thankyou.title': 'Ein persönliches Wort von mir',
  'system_notice.v3_thankyou.body':
    'Bevor du weiterklickst — einen Moment noch.\n\nTREK hat als Nebenprojekt für meine eigenen Reisen angefangen. Ich hätte nie gedacht, dass es jemals so weit kommt, dass 4.000 von euch damit ihre Abenteuer planen. Jeder Stern, jedes Issue, jeder Feature-Wunsch — ich lese sie alle, und sie halten mich am Laufen durch die späten Nächte zwischen Vollzeitjob und Studium.\n\nEins will ich euch sagen: TREK wird immer Open Source bleiben, immer self-hosted, immer eures. Kein Tracking, keine Abos, keine versteckten Haken. Einfach ein Tool, gebaut von jemandem, der das Reisen genauso liebt wie ihr.\n\nBesonderer Dank an [jubnl](https://github.com/jubnl) — du bist ein unglaublicher Mitstreiter geworden. So vieles, was 3.0 großartig macht, trägt deine Handschrift. Danke, dass du an dieses Projekt geglaubt hast, als es noch holprig war.\n\nUnd an jeden einzelnen von euch, der einen Bug gemeldet, einen String übersetzt, TREK mit Freunden geteilt oder einfach damit eine Reise geplant hat — **danke**. Ihr seid der Grund, warum es das hier gibt.\n\nAuf viele weitere Abenteuer zusammen.\n\n— Maurice\n\n---\n\n[Tritt der Community auf Discord bei](https://discord.gg/7Q6M6jDwzf)\n\nWenn TREK deine Reisen besser macht, hält ein [kleiner Kaffee](https://ko-fi.com/mauriceboe) die Lichter an.',
  'system_notice.v3014_whitespace_collision.title': 'Aktion erforderlich: Benutzerkontokonflikt',
  'system_notice.v3014_whitespace_collision.body':
    'Das 3.0.14-Upgrade hat einen oder mehrere Konflikte bei Benutzernamen oder E-Mail-Adressen festgestellt, die durch führende oder nachgestellte Leerzeichen in gespeicherten Konten verursacht wurden. Betroffene Konten wurden automatisch umbenannt. Prüfe die Serverprotokolle auf Zeilen, die mit **[migration] WHITESPACE COLLISION** beginnen, um die betroffenen Konten zu identifizieren.',
};
export default system_notice;
