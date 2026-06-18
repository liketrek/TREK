import type { TranslationStrings } from '../types';

const oauth: TranslationStrings = {
  'oauth.scope.group.trips': 'Viagens',
  'oauth.scope.group.places': 'Locais',
  'oauth.scope.group.atlas': 'Atlas',
  'oauth.scope.group.packing': 'Bagagem',
  'oauth.scope.group.todos': 'Tarefas',
  'oauth.scope.group.budget': 'Orçamento',
  'oauth.scope.group.reservations': 'Reservas',
  'oauth.scope.group.collab': 'Colaboração',
  'oauth.scope.group.notifications': 'Notificações',
  'oauth.scope.group.vacay': 'Férias',
  'oauth.scope.group.geo': 'Geo',
  'oauth.scope.group.weather': 'Clima',
  'oauth.scope.group.journey': 'Jornada',
  'oauth.scope.trips:read.label': 'Ver viagens e itinerários',
  'oauth.scope.trips:read.description': 'Ler viagens, dias, notas e membros',
  'oauth.scope.trips:write.label': 'Editar viagens e itinerários',
  'oauth.scope.trips:write.description': 'Criar e atualizar viagens, dias, notas e gerenciar membros',
  'oauth.scope.trips:delete.label': 'Excluir viagens',
  'oauth.scope.trips:delete.description': 'Excluir viagens permanentemente — esta ação é irreversível',
  'oauth.scope.trips:share.label': 'Gerenciar links de compartilhamento',
  'oauth.scope.trips:share.description': 'Criar, atualizar e revogar links de compartilhamento públicos',
  'oauth.scope.places:read.label': 'Ver locais e dados do mapa',
  'oauth.scope.places:read.description': 'Ler locais, atribuições de dias, tags e categorias',
  'oauth.scope.places:write.label': 'Gerenciar locais',
  'oauth.scope.places:write.description': 'Criar, atualizar e excluir locais, atribuições e tags',
  'oauth.scope.atlas:read.label': 'Ver Atlas',
  'oauth.scope.atlas:read.description': 'Ler países visitados, regiões e lista de desejos',
  'oauth.scope.atlas:write.label': 'Gerenciar Atlas',
  'oauth.scope.atlas:write.description': 'Marcar países e regiões como visitados, gerenciar lista de desejos',
  'oauth.scope.packing:read.label': 'Ver listas de bagagem',
  'oauth.scope.packing:read.description': 'Ler itens, malas e responsáveis por categoria',
  'oauth.scope.packing:write.label': 'Gerenciar listas de bagagem',
  'oauth.scope.packing:write.description': 'Adicionar, atualizar, excluir, marcar e reordenar itens e malas',
  'oauth.scope.todos:read.label': 'Ver listas de tarefas',
  'oauth.scope.todos:read.description': 'Ler tarefas da viagem e responsáveis por categoria',
  'oauth.scope.todos:write.label': 'Gerenciar listas de tarefas',
  'oauth.scope.todos:write.description': 'Criar, atualizar, marcar, excluir e reordenar tarefas',
  'oauth.scope.budget:read.label': 'Ver orçamento',
  'oauth.scope.budget:read.description': 'Ler itens de orçamento e detalhamento de despesas',
  'oauth.scope.budget:write.label': 'Gerenciar orçamento',
  'oauth.scope.budget:write.description': 'Criar, atualizar e excluir itens de orçamento',
  'oauth.scope.reservations:read.label': 'Ver reservas',
  'oauth.scope.reservations:read.description': 'Ler reservas e detalhes de acomodação',
  'oauth.scope.reservations:write.label': 'Gerenciar reservas',
  'oauth.scope.reservations:write.description': 'Criar, atualizar, excluir e reordenar reservas',
  'oauth.scope.collab:read.label': 'Ver colaboração',
  'oauth.scope.collab:read.description': 'Ler notas colaborativas, enquetes e mensagens',
  'oauth.scope.collab:write.label': 'Gerenciar colaboração',
  'oauth.scope.collab:write.description': 'Criar, atualizar e excluir notas, enquetes e mensagens',
  'oauth.scope.notifications:read.label': 'Ver notificações',
  'oauth.scope.notifications:read.description': 'Ler notificações e contagens não lidas',
  'oauth.scope.notifications:write.label': 'Gerenciar notificações',
  'oauth.scope.notifications:write.description': 'Marcar notificações como lidas e respondê-las',
  'oauth.scope.vacay:read.label': 'Ver planos de férias',
  'oauth.scope.vacay:read.description': 'Ler dados de planejamento de férias, entradas e estatísticas',
  'oauth.scope.vacay:write.label': 'Gerenciar planos de férias',
  'oauth.scope.vacay:write.description': 'Criar e gerenciar entradas de férias, feriados e planos de equipe',
  'oauth.scope.geo:read.label': 'Mapas e geocodificação',
  'oauth.scope.geo:read.description': 'Pesquisar locais, resolver URLs de mapa e geocodificar coordenadas',
  'oauth.scope.weather:read.label': 'Previsão do tempo',
  'oauth.scope.weather:read.description': 'Obter previsão do tempo para locais e datas da viagem',
  'oauth.scope.journey:read.label': 'Ver jornadas',
  'oauth.scope.journey:read.description': 'Ler jornadas, entradas e lista de colaboradores',
  'oauth.scope.journey:write.label': 'Gerenciar jornadas',
  'oauth.scope.journey:write.description': 'Criar, atualizar e excluir jornadas e suas entradas',
  'oauth.scope.journey:share.label': 'Gerenciar links de jornadas',
  'oauth.scope.journey:share.description':
    'Criar, atualizar e revogar links de compartilhamento públicos para jornadas',
  'oauth.authorize.authorizing': 'Authorizing…', // en-fallback
  'oauth.authorize.loading': 'Loading…', // en-fallback
  'oauth.authorize.errorTitle': 'Authorization Error', // en-fallback
  'oauth.authorize.loginTitle': 'Sign in to continue', // en-fallback
  'oauth.authorize.loginDescription': '{client} wants access to your TREK account. Please sign in first.', // en-fallback
  'oauth.authorize.loginButton': 'Sign in to TREK', // en-fallback
  'oauth.authorize.requestLabel': 'Authorization Request', // en-fallback
  'oauth.authorize.requestDescription': 'This application is requesting access to your TREK account.', // en-fallback
  'oauth.authorize.trustNote': 'Only grant access to applications you trust. Your data stays on your server.', // en-fallback
  'oauth.authorize.selectScope': 'Select at least one scope', // en-fallback
  'oauth.authorize.approveOneScope': 'Approve ({count} scope)', // en-fallback
  'oauth.authorize.approveManyScopes': 'Approve ({count} scopes)', // en-fallback
  'oauth.authorize.approveAccess': 'Approve Access', // en-fallback
  'oauth.authorize.deny': 'Deny', // en-fallback
  'oauth.authorize.choosePermissions': 'Choose which permissions to grant', // en-fallback
  'oauth.authorize.permissionsRequested': 'Permissions requested', // en-fallback
  'oauth.authorize.alwaysIncluded': 'Always included', // en-fallback
  'oauth.authorize.alwaysTool.listTrips': 'List your trips so the AI can discover trip IDs', // en-fallback
  'oauth.authorize.alwaysTool.getTripSummary': 'Read a trip overview needed to use any other tool', // en-fallback
};
export default oauth;
