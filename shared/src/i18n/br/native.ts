import type { TranslationStrings } from '../types';

const native: TranslationStrings = {
  'native.connect.title': 'Conectar ao TREK',
  'native.connect.hint': 'Digite o endereço em que você abre o TREK no navegador.',
  'native.connect.placeholder': 'trek.example.com',
  'native.connect.submit': 'Conectar',
  'native.connect.checking': 'Verificando…',
  'native.connect.errorInvalid': 'Isso não parece um endereço da web.',
  'native.connect.errorUnreachable': 'Nenhum servidor respondeu neste endereço. Verifique o endereço e sua conexão.',
  'native.connect.errorNotTrek': 'O servidor neste endereço não é o TREK.',
  'native.connect.errorTooOld': 'Este servidor TREK é antigo demais para o app. Ele precisa ser atualizado primeiro.',
  'native.offline.title': 'Servidor inacessível',
  'native.offline.hint': 'O TREK não conseguiu acessar {server}. Verifique sua conexão e tente novamente.',
  'native.offline.retry': 'Tentar novamente',
  'native.changeServer': 'Trocar de servidor',
  'native.login.failed': 'Não foi possível entrar. Tente novamente.',
  'native.handoff.title': 'Continuar no app',
  'native.handoff.hint': 'Você entrou como {name}. Abra o app TREK para concluir o login por lá.',
  'native.handoff.open': 'Abrir o app TREK',
  'native.handoff.switchAccount': 'Usar outra conta',
  'native.settings.server': 'Servidor',
  'native.settings.serverHint': 'Este app está conectado a {server}.',
};

export default native;
