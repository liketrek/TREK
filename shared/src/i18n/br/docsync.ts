import type { TranslationStrings } from '../types';

const docsync: TranslationStrings = {
  'docsync.title': 'Sincronização de documentos',
  'docsync.noProviders': 'Nenhum provedor de documentos está disponível',
  'docsync.noProvidersHint': 'Um administrador da instância ativa isso em Admin, Complementos, Documentos.',
  'docsync.addProvider': 'Conectar um provedor',
  'docsync.test': 'Testar conexão',
  'docsync.connect.optional': 'Opcional',
  'docsync.connected': 'Conectado',
  'docsync.chooseFolder': 'Escolher pasta',
  'docsync.noFolders': 'Nada encontrado nesta instância ainda.',
  'docsync.newFolderPlaceholder': 'Nome da nova pasta',
  'docsync.syncNow': 'Sincronizar agora',
  'docsync.unlink': 'Desconectar',
  'docsync.confirmUnlink': 'Os documentos continuam no TREK e no repositório. Só o vínculo entre eles acaba.',
  'docsync.syncEnabled': 'Sincronizar automaticamente',
  'docsync.deletePolicy': 'Quando um documento é excluído',
  'docsync.deleteUnlink': 'Manter as duas cópias',
  'docsync.deleteTrash': 'Mover para a lixeira',
  'docsync.conflictPolicy': 'Quando os dois lados mudaram',
  'docsync.onConflict.manual': 'Perguntar',
  'docsync.onConflict.trek_wins': 'Manter a cópia do TREK',
  'docsync.onConflict.provider_wins': 'Manter a cópia do armazenamento',
  'docsync.webhookHint':
    'Cole esta URL no seu provedor para que as mudanças cheguem na hora. Sem isso, o TREK verifica em intervalos.',

  // Campos do formulário de conexão. As chaves espelham a coluna `label` de
  // document_provider_fields, que guarda um sufixo de chave, não o texto.
  'docsync.providerUrl': 'Endereço',
  'docsync.providerApiToken': 'Token de API',
  'docsync.providerApiKey': 'Chave de API',
  'docsync.providerAppPassword': 'Senha de aplicativo',
  'docsync.providerAppToken': 'Token de aplicativo',
  'docsync.providerUsername': 'Nome de usuário',
  'docsync.providerPassword': 'Senha',
  'docsync.providerOrganization': 'ID da organização',
  'docsync.providerBasePath': 'Pasta base',
  'docsync.providerOTP': 'Código de dois fatores',
  'docsync.allowInsecureTls': 'Aceitar certificado autoassinado',

  'docsync.hintPaperlessToken': 'Crie um em Meu perfil no Paperless. Ele carrega todos os direitos daquela conta.',
  'docsync.hintPapraKey':
    'Crie uma em Chaves de API no Papra. As chaves do Papra sempre alcançam todas as organizações às quais você pertence.',
  'docsync.hintPapraOrg': 'O id org_… que aparece na barra de endereços do Papra.',
  'docsync.hintNextcloudLogin': 'Seu nome de login do Nextcloud, não seu endereço de e-mail.',
  'docsync.hintNextcloudAppPassword':
    'Configurações, Segurança, Criar nova senha de aplicativo. Nunca a senha da sua conta.',
  'docsync.hintOpenCloudToken': 'Criado em tokens de aplicativo no OpenCloud.',
  'docsync.hintBasePath': 'Onde o TREK procura as pastas das viagens. O padrão é /TREK.',
  'docsync.hintSynologyUrl': 'Inclua a porta, por exemplo https://nas.example.com:5001',
  'docsync.hintSynologyUser': 'De preferência uma conta DSM dedicada com acesso apenas a esta pasta compartilhada.',
  'docsync.hintSynologyOtp': 'Necessário só uma vez, se a conta usa autenticação de dois fatores.',

  'docsync.linkState.never': 'Ainda não sincronizado',
  'docsync.linkState.ok': 'Em sincronia',
  'docsync.linkState.partial': 'Sincronizado em parte',
  'docsync.linkState.failed': 'Falhou',
  'docsync.linkState.needs_reauth': 'Entre novamente',
  'docsync.linkState.scope_lost': 'A pasta sumiu',
  'docsync.linkState.orphaned': 'O dono saiu da viagem',

  'docsync.state.pending': 'Aguardando',
  'docsync.state.synced': 'Sincronizado',
  'docsync.state.conflict': 'Conflito',
  'docsync.state.rejected_type': 'Tipo não permitido',
  'docsync.state.too_large': 'Grande demais',
  'docsync.state.error': 'Erro',
  'docsync.state.remote_missing': 'Não está no provedor',
  'docsync.state.local_deleted': 'Excluído no TREK',
  'docsync.state.scope_drift': 'Saiu da pasta',

  'docsync.conflict.resolve': "Resolver {count}",

  'docsync.conflict.title': 'As duas cópias mudaram',
  'docsync.conflict.keepTrek': 'Manter a versão do TREK',
  'docsync.conflict.keepProvider': 'Manter a versão do provedor',
  'docsync.conflict.keepBoth': 'Manter as duas',

  // Os motivos de falha viajam como códigos, nunca como texto do outro lado: um
  // provedor responde em inglês, ou com a página de login HTML de um proxy, e
  // nenhum dos dois cabe aqui.
  'docsync.error.unreachable': 'Não foi possível acessar o provedor.',
  'docsync.error.tls_untrusted':
    'O certificado foi recusado. Permita certificados autoassinados se você confia nesta instância.',
  'docsync.error.unauthorized': 'As credenciais foram recusadas.',
  'docsync.error.forbidden': 'Esta conta não tem permissão para fazer isso.',
  'docsync.error.not_found': 'Não encontrado no provedor.',
  'docsync.error.scope_missing': 'A pasta conectada não existe mais.',
  'docsync.error.rate_limited': 'O provedor está limitando o ritmo. O TREK vai tentar de novo mais tarde.',
  'docsync.error.too_large': 'O arquivo é maior do que o provedor aceita.',
  'docsync.error.unsupported_type': 'O provedor não aceita esse tipo de arquivo.',
  'docsync.error.quota_exceeded': 'O provedor está sem espaço.',
  'docsync.error.conflict': 'O documento mudou dos dois lados.',
  'docsync.error.checksum_mismatch': 'A transferência não chegou intacta.',
  'docsync.error.provider_error': 'O provedor relatou um erro.',
  'docsync.error.timeout': 'O provedor demorou demais para responder.',
  'docsync.error.ssrf_blocked': 'Esse endereço não é permitido.',
  'docsync.error.mass_delete_guard':
    'Quase todos os documentos sumiram de uma vez, então nada foi alterado. Verifique se a pasta ainda está montada.',
  'docsync.error.unknown': 'Algo deu errado.',

  // ── A janela ───────────────────────────────────────────────────────────────
  'docsync.sidebar.connected': 'Esta viagem',
  'docsync.addAnother': 'Adicionar outro',
  'docsync.syncing': 'Sincronizando',
  'docsync.card.pickFolder': 'Conectado, escolha uma pasta',

  'docsync.empty.title': 'Nada conectado ainda',
  'docsync.empty.hintOwner':
    'Escolha um repositório à esquerda. O TREK guarda a própria cópia de tudo, então nada se perde se ele sumir.',
  'docsync.empty.hintMember': 'Quem é dono da viagem configura isso. Os documentos ficam no TREK de todo jeito.',

  // Como cada produto organiza as coisas. Aparece antes de alguém conectar,
  // porque é o que a próxima tela vai pedir.
  'docsync.model.paperless': 'Arquiva por etiqueta',
  'docsync.model.papra': 'Arquiva por etiqueta, dentro de uma organização',
  'docsync.model.nextcloud': 'Arquiva em uma pasta',
  'docsync.model.opencloud': 'Arquiva em um espaço',
  'docsync.model.synologydrive': 'Arquiva em uma pasta no NAS',

  // ── A barra de fluxo ───────────────────────────────────────────────────────
  'docsync.flow.trek': 'TREK',
  'docsync.flow.toProvider': 'Saída para o repositório',
  'docsync.flow.toTrek': 'Entrada do repositório',
  'docsync.flow.documents': 'documentos',
  'docsync.flow.summary.both': 'Os documentos vão e voltam.',
  'docsync.flow.summary.pull': 'Os documentos só entram.',
  'docsync.flow.summary.push': 'Os documentos só saem.',
  'docsync.flow.summaryEditable.both': 'Indo e voltando. Toque em uma faixa para parar.',
  'docsync.flow.summaryEditable.pull': 'Só entrando. Toque na outra faixa para enviar também.',
  'docsync.flow.summaryEditable.push': 'Só saindo. Toque na outra faixa para receber também.',

  // ── Um vínculo ─────────────────────────────────────────────────────────────
  'docsync.binding.settings': 'Configurações',
  'docsync.binding.folder': 'Pasta',
  'docsync.binding.lastRun': 'Última execução',
  'docsync.binding.autoOff': 'Pausado',
  'docsync.binding.neverRun': 'ainda não executado',
  'docsync.binding.deleteHint': 'O que acontece com a cópia do outro lado.',
  'docsync.binding.conflictHint': 'Qual cópia fica quando um documento foi editado nos dois lugares.',
  'docsync.binding.autoHint': 'Procurar mudanças em segundo plano.',
  'docsync.binding.webhookTitle': 'Atualizações na hora',
  'docsync.binding.copy': 'Copiar',
  'docsync.binding.copied': 'Copiado',

  // ── Conectando ─────────────────────────────────────────────────────────────
  'docsync.connect.submit': 'Conectar',
  'docsync.connect.testing': 'Tentando acessar',
  'docsync.connect.okAs': 'Acessado, conectado como {account}',
  'docsync.connect.insecureHint': 'Para uma instância na sua própria rede com certificado autoassinado.',
  'docsync.connect.about.paperless': 'O TREK arquiva esta viagem na etiqueta dela e nunca mexe no resto do seu acervo.',
  'docsync.connect.about.papra':
    'Escolha a organização a que esta viagem pertence. O TREK a arquiva na etiqueta dela dentro dessa organização.',
  'docsync.connect.about.nextcloud':
    'Use uma senha de aplicativo, não a senha da sua conta: ela sobrevive ao dois fatores e pode ser revogada sozinha.',
  'docsync.connect.about.opencloud': 'O TREK ganha um espaço próprio para esta viagem, separado de todo o resto.',
  'docsync.connect.about.synologydrive':
    'De preferência uma conta DSM que alcance só a pasta compartilhada que esta viagem deve usar.',

  // ── Escolhendo o destino ───────────────────────────────────────────────────
  'docsync.scope.title': 'Onde esta viagem deve ficar no {provider}?',
  'docsync.scope.intro': 'Só o que está aqui dentro é sincronizado. Todo o resto do seu repositório fica fora do TREK.',
  'docsync.scope.createTitle': 'Criar um novo',
  'docsync.scope.createAction': 'Criar',
  'docsync.scope.pickTitle': 'Ou use um que você já tem',
  'docsync.scope.search': 'Buscar',
  'docsync.scope.noMatch': 'Nada corresponde a isso.',

  // ── Coisas que alguém precisa decidir ──────────────────────────────────────
  'docsync.issues.title': 'Precisa de atenção',
  'docsync.issues.conflict': 'Mudou nos dois lugares. Escolha qual manter.',
  'docsync.issues.remote_missing': 'Sumiu do repositório. A cópia do TREK continua aqui.',
  'docsync.issues.rejected_type': 'Este tipo de arquivo não é permitido aqui.',
  'docsync.issues.too_large': 'Maior que o limite.',
  'docsync.issues.error': 'A transferência não foi concluída.',

  'docsync.error.unknown_provider': 'Este provedor não está disponível nesta instância.',
  'docsync.error.provider_disabled': 'Pausado: um administrador desativou este provedor. A sincronização continua assim que ele for reativado.',
  'docsync.binding.reconnect': 'Voltar a ligar',
};

export default docsync;
