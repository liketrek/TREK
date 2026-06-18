import type { TranslationStrings } from '../types';

const system_notice: TranslationStrings = {
  'system_notice.welcome_v1.title': 'Benvenuto su TREK',
  'system_notice.welcome_v1.body':
    'Il tuo pianificatore di viaggi tutto in uno. Crea itinerari, condividi viaggi con gli amici e rimani organizzato — online e offline.',
  'system_notice.welcome_v1.cta_label': 'Pianifica un viaggio',
  'system_notice.welcome_v1.hero_alt': "Destinazione di viaggio panoramica con l'interfaccia TREK",
  'system_notice.welcome_v1.highlight_plan': 'Itinerari giorno per giorno',
  'system_notice.welcome_v1.highlight_share': 'Collabora con i tuoi compagni di viaggio',
  'system_notice.welcome_v1.highlight_offline': 'Funziona offline su mobile',
  'system_notice.dev_test_modal.title': '[Dev] Test notice',
  'system_notice.dev_test_modal.body': 'This is a dev-only test notice.',
  'system_notice.pager.prev': 'Avviso precedente',
  'system_notice.pager.next': 'Avviso successivo',
  'system_notice.pager.counter': '{current} / {total}',
  'system_notice.pager.goto': "Vai all'avviso {n}",
  'system_notice.pager.position': 'Avviso {current} di {total}',
  'system_notice.v3_photos.title': 'Le foto sono spostate nella 3.0',
  'system_notice.v3_photos.body':
    '**Foto** nel Pianificatore di Viaggio sono state rimosse. Le tue foto sono al sicuro — TREK non ha mai modificato la tua libreria Immich o Synology.\n\nLe foto ora si trovano nel componente aggiuntivo **Journey**. Journey è opzionale — se non è ancora disponibile, chiedi al tuo admin di abilitarlo in Admin → Addon.',
  'system_notice.v3_journey.title': 'Scopri Journey — diario di viaggio',
  'system_notice.v3_journey.body':
    'Documenta i tuoi viaggi come storie ricche con cronologie, gallerie fotografiche e mappe interattive.',
  'system_notice.v3_journey.cta_label': 'Apri Journey',
  'system_notice.v3_journey.highlight_timeline': 'Cronologia e galleria giornaliera',
  'system_notice.v3_journey.highlight_photos': 'Importa da Immich o Synology',
  'system_notice.v3_journey.highlight_share': 'Condividi pubblicamente — senza accesso',
  'system_notice.v3_journey.highlight_export': 'Esporta come libro fotografico PDF',
  'system_notice.v3_features.title': 'Altri punti salienti nel 3.0',
  'system_notice.v3_features.body': 'Altre novità da conoscere in questa versione.',
  'system_notice.v3_features.highlight_dashboard': 'Dashboard ridisegnata mobile-first',
  'system_notice.v3_features.highlight_offline': 'Modalità offline completa come PWA',
  'system_notice.v3_features.highlight_search': 'Completamento automatico luoghi in tempo reale',
  'system_notice.v3_features.highlight_import': 'Importa luoghi da file KMZ/KML',
  'system_notice.v3_mcp.title': 'MCP: aggiornamento OAuth 2.1',
  'system_notice.v3_mcp.body':
    "L'integrazione MCP è stata completamente rinnovata. OAuth 2.1 è ora il metodo di autenticazione consigliato. I token statici (trek_…) sono deprecati e verranno rimossi in una versione futura.",
  'system_notice.v3_mcp.highlight_oauth': 'OAuth 2.1 consigliato (mcp-remote)',
  'system_notice.v3_mcp.highlight_scopes': '24 scope di autorizzazione granulari',
  'system_notice.v3_mcp.highlight_deprecated': 'Token statici trek_ deprecati',
  'system_notice.v3_mcp.highlight_tools': 'Strumenti e prompt estesi',
  'system_notice.v3_thankyou.title': 'Una nota personale da parte mia',
  'system_notice.v3_thankyou.body':
    "Prima di andare avanti — voglio prendermi un momento.\n\nTREK è nato come un progetto secondario che ho costruito per i miei viaggi. Non avrei mai immaginato che sarebbe cresciuto fino a diventare qualcosa di cui 4.000 di voi si fidano per pianificare le proprie avventure. Ogni stella, ogni issue, ogni richiesta di funzionalità — le leggo tutte, e sono loro a tenermi in piedi nelle notti tarde tra un lavoro a tempo pieno e l'università.\n\nVoglio che sappiate: TREK sarà sempre open source, sempre self-hosted, sempre vostro. Nessun tracciamento, nessun abbonamento, nessuna fregatura. Solo uno strumento creato da qualcuno che ama viaggiare tanto quanto voi.\n\nUn ringraziamento speciale a [jubnl](https://github.com/jubnl) — sei diventato un collaboratore incredibile. Molto di ciò che rende la 3.0 fantastica porta la tua impronta. Grazie per aver creduto in questo progetto quando era ancora acerbo.\n\nE a ognuno di voi che ha segnalato un bug, tradotto una stringa, condiviso TREK con un amico o semplicemente lo ha usato per pianificare un viaggio — **grazie**. Voi siete il motivo per cui tutto questo esiste.\n\nA molte altre avventure insieme.\n\n— Maurice\n\n---\n\n[Unisciti alla community su Discord](https://discord.gg/7Q6M6jDwzf)\n\nSe TREK rende i tuoi viaggi migliori, un [piccolo caffè](https://ko-fi.com/mauriceboe) aiuta sempre a tenere le luci accese.",
  'system_notice.v3014_whitespace_collision.title': 'Azione richiesta: conflitto di account utente',
  'system_notice.v3014_whitespace_collision.body':
    "L'aggiornamento 3.0.14 ha rilevato uno o più conflitti di nome utente o e-mail causati da spazi iniziali o finali nei valori memorizzati. Gli account interessati sono stati rinominati automaticamente. Controlla i log del server per le righe che iniziano con **[migration] WHITESPACE COLLISION** per identificare quali account richiedono revisione.",
};
export default system_notice;
