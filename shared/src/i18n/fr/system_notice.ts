import type { TranslationStrings } from '../types';

const system_notice: TranslationStrings = {
  'system_notice.welcome_v1.title': 'Bienvenue sur TREK',
  'system_notice.welcome_v1.body':
    'Votre planificateur de voyage tout-en-un. Créez des itinéraires, partagez vos voyages et restez organisé — en ligne ou hors ligne.',
  'system_notice.welcome_v1.cta_label': 'Planifier un voyage',
  'system_notice.welcome_v1.hero_alt': "Destination de voyage pittoresque avec l'interface TREK",
  'system_notice.welcome_v1.highlight_plan': 'Itinéraires jour par jour',
  'system_notice.welcome_v1.highlight_share': 'Collaborez avec vos partenaires',
  'system_notice.welcome_v1.highlight_offline': 'Fonctionne hors ligne sur mobile',
  'system_notice.dev_test_modal.title': '[Dev] Test notice',
  'system_notice.dev_test_modal.body': 'This is a dev-only test notice.',
  'system_notice.thank_you_support.title': "Merci d'utiliser TREK",
  'system_notice.thank_you_support.body':
    "Un petit mot pour te remercier d'avoir installé TREK — ça compte vraiment beaucoup pour moi.\n\nJe suis développeur en solo et je construis TREK sur mon temps libre. Au départ, c'était juste un petit outil pour mes propres voyages, et je suis honnêtement bluffé par le soutien et l'intérêt de la communauté depuis. TREK est fait avec beaucoup de cœur de mon côté — mais aussi grâce aux nombreux et formidables contributeurs externes qui ont aidé à lui donner forme.\n\n**TREK est open source et entièrement gratuit — et le restera pour toujours. Pas de formules payantes, pas d'abonnements, aucun piège. Promis.**\n\nSi TREK t'est utile et que tu souhaites soutenir son développement, un petit café m'aide sincèrement à continuer — sans aucune pression, mais chaque tasse fait avancer les nuits blanches.\n\nMerci d'être là.\n\n— Maurice",
  'system_notice.thank_you_support.highlight_opensource': '100 % open source sur GitHub',
  'system_notice.thank_you_support.highlight_free': 'Gratuit pour toujours — jamais de formules payantes',
  'system_notice.thank_you_support.highlight_community': 'Construit avec la communauté',
  'system_notice.thank_you_support.cta_bmc': 'Buy Me a Coffee',
  'system_notice.thank_you_support.cta_kofi': 'Soutenir sur Ko-fi',
  'system_notice.pager.prev': 'Avis précédent',
  'system_notice.pager.next': 'Avis suivant',
  'system_notice.pager.counter': '{current} / {total}',
  'system_notice.pager.goto': "Aller à l'avis {n}",
  'system_notice.pager.position': 'Avis {current} sur {total}',
  'system_notice.v3_photos.title': 'Les photos ont bougé dans 3.0',
  'system_notice.v3_photos.body':
    "**Photos** dans le planificateur ont été supprimées. Tes photos sont en sécurité — TREK n'a jamais modifié ta bibliothèque Immich ou Synology.\n\nLes photos vivent désormais dans l'addon **Journey**. Journey est optionnel — s'il n'est pas encore disponible, demande à ton admin de l'activer dans Admin → Modules.",
  'system_notice.v3_journey.title': 'Découvrez Journey — journal de voyage',
  'system_notice.v3_journey.body':
    'Documente tes voyages sous forme de récits enrichis avec chronologies, galeries photos et cartes interactives.',
  'system_notice.v3_journey.cta_label': 'Ouvrir Journey',
  'system_notice.v3_journey.highlight_timeline': 'Chronologie et galerie par jour',
  'system_notice.v3_journey.highlight_photos': 'Import depuis Immich ou Synology',
  'system_notice.v3_journey.highlight_share': 'Partage public — sans connexion requise',
  'system_notice.v3_journey.highlight_export': 'Export en livre photo PDF',
  'system_notice.v3_features.title': 'Plus de nouveautés en 3.0',
  'system_notice.v3_features.body': 'Quelques autres choses à savoir sur cette version.',
  'system_notice.v3_features.highlight_dashboard': 'Tableau de bord repensé mobile-first',
  'system_notice.v3_features.highlight_offline': 'Mode hors ligne complet en PWA',
  'system_notice.v3_features.highlight_search': 'Autocomplétion des lieux en temps réel',
  'system_notice.v3_features.highlight_import': 'Importer des lieux depuis KMZ/KML',
  'system_notice.v3_mcp.title': 'MCP : mise à niveau OAuth 2.1',
  'system_notice.v3_mcp.body':
    "L'intégration MCP a été entièrement repensée. OAuth 2.1 est désormais la méthode d'authentification recommandée. Les tokens statiques (trek_…) sont dépréciés et seront supprimés dans une future version.",
  'system_notice.v3_mcp.highlight_oauth': 'OAuth 2.1 recommandé (mcp-remote)',
  'system_notice.v3_mcp.highlight_scopes': '24 scopes de permissions granulaires',
  'system_notice.v3_mcp.highlight_deprecated': 'Tokens statiques trek_ dépréciés',
  'system_notice.v3_mcp.highlight_tools': 'Outils et prompts étendus',
  'system_notice.v3_thankyou.title': 'Un mot personnel de ma part',
  'system_notice.v3_thankyou.body':
    "Avant de continuer — je veux prendre un instant.\n\nTREK a commencé comme un projet perso que j'ai construit pour mes propres voyages. Je n'aurais jamais imaginé qu'il grandirait au point que 4 000 d'entre vous lui fassent confiance pour planifier vos aventures. Chaque étoile, chaque issue, chaque demande de fonctionnalité — je les lis toutes, et ce sont elles qui me font tenir pendant les nuits blanches entre un travail à temps plein et l'université.\n\nJe veux que vous sachiez : TREK sera toujours open source, toujours auto-hébergé, toujours à vous. Pas de tracking, pas d'abonnements, pas de conditions cachées. Juste un outil construit par quelqu'un qui aime voyager autant que vous.\n\nUn merci tout particulier à [jubnl](https://github.com/jubnl) — tu es devenu un collaborateur incroyable. Une grande partie de ce qui rend la 3.0 géniale porte ton empreinte. Merci d'avoir cru en ce projet quand il était encore brut.\n\nEt à chacun d'entre vous qui a signalé un bug, traduit une chaîne, partagé TREK avec un ami ou simplement l'a utilisé pour planifier un voyage — **merci**. Vous êtes la raison pour laquelle tout ceci existe.\n\nÀ de nombreuses autres aventures ensemble.\n\n— Maurice\n\n---\n\n[Rejoins la communauté sur Discord](https://discord.gg/7Q6M6jDwzf)\n\nSi TREK rend tes voyages meilleurs, un [petit café](https://ko-fi.com/mauriceboe) aide toujours à garder les lumières allumées.",
  'system_notice.v3014_whitespace_collision.title': 'Action requise : conflit de compte utilisateur',
  'system_notice.v3014_whitespace_collision.body':
    "La mise à niveau 3.0.14 a détecté un ou plusieurs conflits de nom d'utilisateur ou d'adresse e-mail causés par des espaces en début ou en fin de valeur dans les comptes enregistrés. Les comptes concernés ont été renommés automatiquement. Consultez les journaux du serveur pour les lignes commençant par **[migration] WHITESPACE COLLISION** afin d'identifier les comptes nécessitant une vérification.",
};
export default system_notice;
