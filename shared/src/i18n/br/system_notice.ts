import type { TranslationStrings } from '../types';

const system_notice: TranslationStrings = {
  'system_notice.welcome_v1.title': 'Bem-vindo ao TREK',
  'system_notice.welcome_v1.body':
    'Seu planejador de viagens tudo-em-um. Crie roteiros, compartilhe viagens com amigos e fique organizado — online ou offline.',
  'system_notice.welcome_v1.cta_label': 'Planejar uma viagem',
  'system_notice.welcome_v1.hero_alt': 'Destino de viagem pitoresco com a interface do TREK',
  'system_notice.welcome_v1.highlight_plan': 'Roteiros dia a dia para qualquer viagem',
  'system_notice.welcome_v1.highlight_share': 'Colabore com seus companheiros de viagem',
  'system_notice.welcome_v1.highlight_offline': 'Funciona offline no celular',
  'system_notice.dev_test_modal.title': '[Dev] Test notice',
  'system_notice.dev_test_modal.body': 'This is a dev-only test notice.',
  'system_notice.thank_you_support.title': 'Obrigado por usar o TREK',
  'system_notice.thank_you_support.body':
    'Um obrigado rápido por instalar o TREK — isso significa muito para mim, de verdade.\n\nSou um desenvolvedor solo e construo o TREK no meu tempo livre. Tudo começou como uma ferramentinha só para as minhas próprias viagens, e confesso que fico maravilhado com o apoio e o interesse da comunidade desde então. O TREK é feito com muito carinho da minha parte — mas também graças aos muitos colaboradores externos incríveis que ajudaram a moldá-lo.\n\n**O TREK é open source e totalmente gratuito — e vai continuar assim para sempre. Sem planos pagos, sem assinaturas, sem pegadinhas. Eu prometo.**\n\nSe o TREK é útil para você e você quiser apoiar o seu desenvolvimento, um cafezinho ajuda muito a me manter construindo — sem nenhuma pressão, mas cada xícara mantém as noites longas em pé.\n\nObrigado por estar aqui.\n\n— Maurice',
  'system_notice.thank_you_support.highlight_opensource': '100% open source no GitHub',
  'system_notice.thank_you_support.highlight_free': 'Gratuito para sempre — nunca planos pagos',
  'system_notice.thank_you_support.highlight_community': 'Construído junto com a comunidade',
  'system_notice.thank_you_support.cta_bmc': 'Buy Me a Coffee',
  'system_notice.thank_you_support.cta_kofi': 'Apoiar no Ko-fi',
  'system_notice.pager.prev': 'Aviso anterior',
  'system_notice.pager.next': 'Próximo aviso',
  'system_notice.pager.counter': '{current} / {total}',
  'system_notice.pager.goto': 'Ir para o aviso {n}',
  'system_notice.pager.position': 'Aviso {current} de {total}',
  'system_notice.v3_photos.title': 'Fotos foram movidas na versão 3.0',
  'system_notice.v3_photos.body':
    '**Fotos** no Planejador de Viagens foram removidas. Suas fotos estão seguras — o TREK nunca modificou sua biblioteca Immich ou Synology.\n\nAs fotos agora vivem no addon **Journey**. Journey é opcional — se ainda não estiver disponível, peça ao seu admin para ativá-lo em Admin → Addons.',
  'system_notice.v3_journey.title': 'Conheça o Journey — diário de viagem',
  'system_notice.v3_journey.body':
    'Documente suas viagens como histórias ricas com cronologias, galerias de fotos e mapas interativos.',
  'system_notice.v3_journey.cta_label': 'Abrir Journey',
  'system_notice.v3_journey.highlight_timeline': 'Linha do tempo e galeria diária',
  'system_notice.v3_journey.highlight_photos': 'Importar do Immich ou Synology',
  'system_notice.v3_journey.highlight_share': 'Compartilhar publicamente — sem login',
  'system_notice.v3_journey.highlight_export': 'Exportar como álbum de fotos PDF',
  'system_notice.v3_features.title': 'Mais destaques na versão 3.0',
  'system_notice.v3_features.body': 'Algumas outras novidades que vale a pena conhecer nesta versão.',
  'system_notice.v3_features.highlight_dashboard': 'Redesign do painel mobile-first',
  'system_notice.v3_features.highlight_offline': 'Modo offline completo como PWA',
  'system_notice.v3_features.highlight_search': 'Autocompleção de lugares em tempo real',
  'system_notice.v3_features.highlight_import': 'Importar lugares de arquivos KMZ/KML',
  'system_notice.v3_mcp.title': 'MCP: atualização OAuth 2.1',
  'system_notice.v3_mcp.body':
    'A integração MCP foi completamente reformulada. OAuth 2.1 agora é o método de autenticação recomendado. Tokens estáticos (trek_…) foram descontinuados e serão removidos em uma versão futura.',
  'system_notice.v3_mcp.highlight_oauth': 'OAuth 2.1 recomendado (mcp-remote)',
  'system_notice.v3_mcp.highlight_scopes': '24 escopos de permissão granulares',
  'system_notice.v3_mcp.highlight_deprecated': 'Tokens estáticos trek_ descontinuados',
  'system_notice.v3_mcp.highlight_tools': 'Conjunto de ferramentas e prompts expandido',
  'system_notice.v3_thankyou.title': 'Uma nota pessoal minha',
  'system_notice.v3_thankyou.body':
    'Antes de seguir em frente — quero fazer uma pausa.\n\nO TREK começou como um projeto paralelo que criei para minhas próprias viagens. Nunca imaginei que cresceria a ponto de 4.000 de vocês confiarem nele para planejar suas aventuras. Cada estrela, cada issue, cada pedido de recurso — eu leio todos, e eles me mantêm firme nas noites longas entre um trabalho em tempo integral e a universidade.\n\nQuero que saibam: o TREK sempre será open source, sempre self-hosted, sempre de vocês. Sem rastreamento, sem assinaturas, sem pegadinhas. Apenas uma ferramenta feita por alguém que ama viajar tanto quanto vocês.\n\nAgradecimento especial ao [jubnl](https://github.com/jubnl) — você se tornou um colaborador incrível. Muito do que torna a versão 3.0 especial tem a sua marca. Obrigado por acreditar neste projeto quando ele ainda era bem cru.\n\nE a cada um de vocês que reportou um bug, traduziu uma string, compartilhou o TREK com um amigo ou simplesmente o usou para planejar uma viagem — **obrigado**. Vocês são a razão de tudo isso existir.\n\nQue venham muitas mais aventuras juntos.\n\n— Maurice\n\n---\n\n[Junte-se à comunidade no Discord](https://discord.gg/7Q6M6jDwzf)\n\nSe o TREK torna suas viagens melhores, um [cafezinho](https://ko-fi.com/mauriceboe) sempre mantém as luzes acesas.',
  'system_notice.v3014_whitespace_collision.title': 'Ação necessária: conflito de conta de usuário',
  'system_notice.v3014_whitespace_collision.body':
    'A atualização 3.0.14 detectou um ou mais conflitos de nome de usuário ou e-mail causados por espaços em branco no início ou fim dos valores armazenados. As contas afetadas foram renomeadas automaticamente. Verifique os logs do servidor por linhas começando com **[migration] WHITESPACE COLLISION** para identificar quais contas precisam de revisão.',
  // The release modal. One stable set of keys: each big release swaps the copy in place.
  'system_notice.release_notes.eyebrow': 'Atualização instalada',
  'system_notice.release_notes.headline': 'Três coisas que o TREK agora faz sozinho.',
  'system_notice.release_notes.intro':
    'Uma API de lugares própria, viagens de carro planejadas de ponta a ponta e o seu histórico de localização de volta nas suas mãos.',
  'system_notice.release_notes.features_label': 'Os destaques',
  'system_notice.release_notes.features_aside': 'E não é só isso',
  'system_notice.release_notes.feature_places_title': 'TREK Places API',
  'system_notice.release_notes.feature_places_body':
    'O primeiro planejador de viagens open source que hospeda a própria API de lugares. 73,6 milhões de lugares, reconstruídos todo mês. Sem chave, sem cota.',
  'system_notice.release_notes.feature_roadtrip_title': 'Addon Viagem de carro',
  'system_notice.release_notes.feature_roadtrip_body':
    'O modo viagem de carro planeja o próprio trajeto: a rota, a distância, as horas de direção e as paradas. É um addon, desligado até que um admin o ative.',
  'system_notice.release_notes.feature_dawarich_title': 'Integração Dawarich',
  'system_notice.release_notes.feature_dawarich_body':
    'A alternativa self-hosted ao Google Timeline, agora visível dentro do TREK. O TREK lê, e apenas lê. Nada nunca é gravado de volta.',
  'system_notice.release_notes.footnote': 'E ainda uma longa lista de mudanças menores em todo o resto do TREK.',
  'system_notice.release_notes.notes_label': 'Notas da versão',
  'system_notice.release_notes.note_eyebrow': 'Uma nota do mantenedor',
  'system_notice.release_notes.note_title': 'Vocês são a razão de eu continuar construindo o TREK.',
  'system_notice.release_notes.note_body':
    'O TREK começou como uma ferramentinha para as minhas próprias viagens, escrita depois do trabalho porque eu queria um jeito melhor de planejá-las. E nunca parou de crescer de verdade. Quase tudo o que vocês usam foi construído tarde da noite, nos fins de semana, em trens, ao lado de um trabalho em tempo integral, e foram muitas as noites em que me perguntei, em silêncio, se alguém lá fora algum dia chegaria a abri-lo.',
  'system_notice.release_notes.promise_label': 'A promessa',
  'system_notice.release_notes.promise_lead': 'O TREK continua gratuito, para sempre.',
  'system_notice.release_notes.promise_text':
    'Cada recurso, cada atualização, para todo mundo. Sem planos pagos, sem assinaturas, sem pegadinhas.',
  'system_notice.release_notes.note_body_after':
    'E aí vocês abriram. Em poucos meses eram milhares: estrelas, relatos de bugs, traduções para idiomas que eu não falo, pull requests de pessoas que nunca conheci. Até hoje a primeira coisa que faço toda manhã é olhar o repositório, e ainda não parece totalmente real.',
  'system_notice.release_notes.note_closing': 'Obrigado por estarem aqui. Um abraço, Maurice.',
  'system_notice.release_notes.support_lead':
    'O TREK é gratuito e sempre vai ser, mas servidores, domínios e muitas noites em claro não são.',
  'system_notice.release_notes.support_text':
    'Se o TREK ganhou um lugar nas suas viagens, me pague um café e ajude a fazer a próxima versão acontecer.',
  'system_notice.release_notes.cta_bmc': 'Buy me a coffee',
  'system_notice.release_notes.cta_kofi': 'Apoiar no Ko-fi',
};
export default system_notice;
