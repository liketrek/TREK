import type { TranslationStrings } from '../types';

const wandererWatch: TranslationStrings = {
  'wanderer.watch.label': 'Verificar mudanças nas minhas trilhas',
  'wanderer.watch.hint': 'Uma notificação quando uma trilha importada pode ter mudado.',
  'wanderer.watch.info':
    'No máximo uma vez por dia, o TREK lê o registro curto de cada trilha que você importou, nunca o arquivo GPX. Ele só avisa: incorporar uma mudança é decisão sua, pela verificação da fonte do passeio.',
  'wanderer.watch.notConnected': 'Conecte o wanderer primeiro',
  'wanderer.watch.on': 'Verificação em segundo plano ativada',
  'wanderer.watch.off': 'Verificação em segundo plano desativada',
  'wanderer.watch.failed': 'Não foi possível alterar a verificação em segundo plano',
  'wanderer.watch.lastRun': 'Última verificação {date}',
  'wanderer.watch.neverRun': 'Ainda não verificado',
  'wanderer.watch.paused': 'Pausado até {time}',
  'wanderer.watch.pausedHint':
    'O wanderer não respondeu. Depois de cada falha, o TREK espera mais antes de perguntar de novo.',
  'wanderer.watch.blocked': 'Token recusado',
  'wanderer.watch.blockedHint':
    'O wanderer recusou o token da API. A verificação volta quando um teste de conexão passar ou um novo token for salvo.',
  'wanderer.watch.hints': 'Avisos',
  'wanderer.watch.hintsCount': '{count} avisos abertos',
  'wanderer.watch.hintsCount.one': '{count} aviso aberto',
  'wanderer.watch.empty': 'Nenhum aviso aberto',
  'wanderer.watch.dialogTitle': 'Avisos sobre suas trilhas',
  'wanderer.watch.openTour': 'Abrir o passeio',
  'wanderer.watch.checkedAt': 'Verificado {date}',
  'wanderer.watch.noticeLabel': 'Verificação em segundo plano',
  'wanderer.watch.state.possible_change': 'Pode ter mudado',
  'wanderer.watch.state.changed': 'Alterado',
  'wanderer.watch.state.unverifiable': 'Não verificável',
  'wanderer.watch.stateHint.possible_change':
    'O wanderer mudou o carimbo de data da trilha. Só a verificação da fonte mostra se o conteúdo é diferente.',
  'wanderer.watch.stateHint.changed':
    'O registro do wanderer mostra outro nome ou outra descrição. A verificação da fonte mostra tudo o que mudou.',
  'wanderer.watch.stateHint.unverifiable':
    'O TREK não conseguiu avaliar esta trilha, então nada é dito sobre se ela mudou.',
  'wanderer.watch.reason.unavailable': 'Trilha inacessível',
  'wanderer.watch.reason.no_change_time': 'Sem carimbo de data',
};
export default wandererWatch;
