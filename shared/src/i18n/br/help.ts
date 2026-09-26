import type { TranslationStrings } from '../types';

// English fallback until 'br' is translated.
const help: TranslationStrings = {
  'help.title': 'Help & Docs',
  'help.search': 'Search docs…',
  'help.contents': 'Contents',
  'help.noResults': 'No matching pages.',
  'help.errorTitle': "Couldn't load this page",
  'help.errorBody': 'The help content is fetched from the TREK wiki. Check your connection and try again.',

  // center
  'help.center.button': 'Ajuda para esta tela',
  'help.center.title': 'Ajuda',
  'help.center.onThisScreen': 'Nesta tela',
  'help.center.screens': 'Telas',
  'help.center.thisScreen': 'Esta tela',
  'help.center.subScreens': 'Subtelas: {count}',
  'help.center.subScreensLabel': 'Subtelas',
  'help.center.guidesCount': '{count} guias',
  'help.center.goToScreen': 'Ir para {screen}',
  'help.center.overview': 'Visão geral',
  'help.center.howTo': 'Como faço para…',
  'help.center.searchPlaceholder': 'Buscar em guias e documentação…',
  'help.center.searchEmpty': 'Nada encontrado para “{query}”.',
  'help.center.searchGuides': 'Guias',
  'help.center.searchDocs': 'Documentação',
  'help.center.searchError': 'A busca não está disponível no momento.',
  'help.center.back': 'Voltar',
  'help.center.close': 'Fechar ajuda',
  'help.center.steps': '{count} passos',
  'help.center.step': 'Passo {n}',
  'help.center.stepsLabel': 'Passos',
  'help.center.stepOf': 'Passo {n} de {total}',
  'help.center.screenshot': 'Captura',
  'help.center.result': 'O resultado',
  'help.center.tips': 'Bom saber',
  'help.center.related': 'Relacionado',
  'help.center.openDocs': 'Abrir em Ajuda e documentação',
  'help.center.docsSection': 'Na documentação',
  'help.center.noContext': 'Ainda não há guia para esta tela.',
  'help.center.noContextHint': 'Busque na documentação ou conte para nós o que você procurava.',
  'help.center.feedback': 'Falta alguma coisa?',
  'help.center.feedbackLink': 'Conte para nós no GitHub',
  'help.center.discord': 'Pergunte no Discord',
  'help.center.quick': 'Rápido',
  'help.center.guide': 'Guia',
  'help.center.tour': 'Demonstração',
  'help.center.imageAlt': 'Passo {n} de “{title}”',

  // ctx
  'help.ctx.dashboard.title': 'Painel',
  'help.ctx.dashboard.summary':
    'O painel é a porta de entrada de todas as suas viagens. O cartão de embarque no topo destaca a viagem em andamento ou a próxima, a linha abaixo conta o quanto você já viajou, e os cartões listam tudo o que você está planejando, arquivou ou já concluiu.',
  'help.ctx.dashboard.bullet.1':
    'Cartão de embarque: a viagem em andamento ou a próxima, com datas, viajantes, lugares e uma contagem regressiva. Clique nele para abrir a viagem.',
  'help.ctx.dashboard.bullet.2':
    'Estatísticas: países visitados, viagens, dias na estrada e distância voada, somando todas as suas viagens.',
  'help.ctx.dashboard.bullet.3':
    'Cartões de viagem, filtrados por Planejadas, Arquivada e Concluído, em grade ou lista. Passe o mouse em um cartão para editar, duplicar, arquivar e excluir.',
  'help.ctx.dashboard.bullet.4':
    'Widgets à direita: conversor de moedas, relógios mundiais, próximas reservas e coleções. Cada um pode ser desligado.',
  'help.ctx.dashboard.bullet.5': 'O cartão “Nova viagem” e o botão no canto inferior direito iniciam uma nova viagem.',

  // create-trip
  'help.guide.create-trip.title': 'Criar uma viagem',
  'help.guide.create-trip.goal': 'Começar uma nova viagem com nome, datas e foto de capa.',
  'help.guide.create-trip.step.1':
    'Clique em “Nova viagem”. O cartão no fim das suas viagens e o botão no canto inferior direito fazem a mesma coisa.',
  'help.guide.create-trip.step.2':
    'Dê um nome à viagem. É o único campo obrigatório; todo o resto pode ser adicionado depois.',
  'help.guide.create-trip.step.3':
    'Escolha a data de início e de fim. O TREK cria um dia por data, então seu roteiro já fica pronto para preencher.',
  'help.guide.create-trip.step.4':
    'Opcional: adicione uma foto de capa. Envie a sua, arraste uma ou busque o destino no Unsplash.',
  'help.guide.create-trip.step.5': 'Clique em “Criar nova viagem”.',
  'help.guide.create-trip.result':
    'A viagem aparece no seu painel. Se for a próxima, ela assume o cartão de embarque no topo.',
  'help.guide.create-trip.tip.1':
    'As datas podem ser alteradas depois. Se já houver reservas, o TREK pergunta se elas devem ser movidas junto com os dias.',
  'help.guide.create-trip.tip.2':
    'A moeda da viagem escolhida aqui é aquela para a qual cada gasto é convertido. Escolha a moeda do destino.',

  // edit-trip
  'help.guide.edit-trip.title': 'Editar uma viagem',
  'help.guide.edit-trip.goal': 'Renomear uma viagem, mudar as datas ou ajustar as configurações.',
  'help.guide.edit-trip.step.1': 'Passe o mouse no cartão da viagem (ou no cartão de embarque) e clique no lápis.',
  'help.guide.edit-trip.step.2': 'Mude o que precisar: nome, descrição, datas, capa, moeda, lembrete ou membros.',
  'help.guide.edit-trip.step.3': 'Clique em “Atualizar”.',
  'help.guide.edit-trip.result': 'O cartão é atualizado na hora, para todos os membros da viagem.',
  'help.guide.edit-trip.tip.1':
    'Mover as datas de uma viagem que já tem reservas abre um segundo passo perguntando se as reservas também devem ser movidas.',

  // cover-image
  'help.guide.cover-image.title': 'Definir uma foto de capa',
  'help.guide.cover-image.goal': 'Dar à viagem uma imagem que aparece no cartão e no cartão de embarque.',
  'help.guide.cover-image.step.1': 'Abra o formulário de edição da viagem pelo lápis no cartão dela.',
  'help.guide.cover-image.step.2':
    'Em “Imagem de capa”, solte uma foto, clique para enviar uma ou digite um destino na busca do Unsplash.',
  'help.guide.cover-image.step.3': 'Escolha uma foto e clique em “Atualizar”.',
  'help.guide.cover-image.result': 'A foto é salva com a viagem e aparece em todo lugar onde a viagem é listada.',
  'help.guide.cover-image.tip.1':
    'Fotos da busca do Unsplash recebem crédito automaticamente; seus próprios envios ficam no seu servidor.',

  // duplicate-trip
  'help.guide.duplicate-trip.title': 'Duplicar uma viagem',
  'help.guide.duplicate-trip.goal': 'Reaproveitar uma viagem como modelo para uma nova.',
  'help.guide.duplicate-trip.step.1': 'Passe o mouse no cartão e clique no ícone de duplicar.',
  'help.guide.duplicate-trip.step.2': 'Leia o que será copiado e o que não será, depois confirme.',
  'help.guide.duplicate-trip.result':
    'Uma cópia aparece ao lado da original, pronta para ser renomeada e receber novas datas.',
  'help.guide.duplicate-trip.tip.1':
    'Dias, lugares, reservas, itens do orçamento, listas de bagagem e notas dos dias vêm junto. Membros, chat, enquetes, arquivos e links de compartilhamento não.',

  // archive-trip
  'help.guide.archive-trip.title': 'Arquivar e restaurar uma viagem',
  'help.guide.archive-trip.goal': 'Guardar uma viagem sem excluir e trazê-la de volta depois.',
  'help.guide.archive-trip.step.1': 'Passe o mouse no cartão e clique em “Arquivar”.',
  'help.guide.archive-trip.step.2': 'Mude o filtro acima dos cartões para “Arquivada” para vê-la de novo.',
  'help.guide.archive-trip.step.3': 'Clique em “Restaurar” no cartão para devolvê-la a “Planejadas”.',
  'help.guide.archive-trip.result':
    'Viagens arquivadas mantêm tudo. Elas só deixam de ocupar o painel e o feed de calendário de todas as viagens.',

  // delete-trip
  'help.guide.delete-trip.title': 'Excluir uma viagem',
  'help.guide.delete-trip.goal': 'Remover uma viagem de vez.',
  'help.guide.delete-trip.step.1': 'Passe o mouse no cartão e clique na lixeira.',
  'help.guide.delete-trip.step.2':
    'Confirme. A caixa de diálogo mostra o nome da viagem, para você ter certeza de que é a certa.',
  'help.guide.delete-trip.result':
    'A viagem, seus dias, lugares, reservas e arquivos somem. Não dá para desfazer; na dúvida, arquive.',

  // filter-and-view
  'help.guide.filter-and-view.title': 'Encontrar viagens concluídas, alternar entre grade e lista',
  'help.guide.filter-and-view.goal': 'Ver viagens concluídas ou arquivadas e escolher o layout que você prefere.',
  'help.guide.filter-and-view.step.1':
    'Use “Planejadas”, “Arquivada” e “Concluído” acima dos cartões. Concluído é toda viagem cuja data de fim já passou.',
  'help.guide.filter-and-view.step.2': 'Clique no ícone de lista para uma lista compacta; clique de novo para a grade.',
  'help.guide.filter-and-view.result': 'O painel lembra o seu layout neste dispositivo.',

  // calendar-feed
  'help.guide.calendar-feed.title': 'Assinar todas as viagens no seu calendário',
  'help.guide.calendar-feed.goal':
    'Ver os dias e reservas de cada viagem ativa no seu app de calendário, sempre sincronizados.',
  'help.guide.calendar-feed.step.1': 'Clique no ícone de calendário ao lado do seletor de visualização.',
  'help.guide.calendar-feed.step.2': 'Clique em “Enable calendar subscription”. O TREK gera um link privado do feed.',
  'help.guide.calendar-feed.step.3':
    'Adicione o feed com um dos botões (Google, Apple, Outlook) ou copie o link em qualquer app de calendário que assine URLs.',
  'help.guide.calendar-feed.result':
    'Cada viagem ativa aparece no seu calendário e se atualiza sozinha. Viagens arquivadas e as que terminaram há mais de 90 dias ficam de fora.',
  'help.guide.calendar-feed.tip.1':
    'O link é um segredo. Quem o tiver pode ler o feed; revogue-o na mesma caixa de diálogo se ele vazar.',

  // widgets
  'help.guide.widgets.title': 'Escolher os widgets do painel',
  'help.guide.widgets.goal': 'Mostrar ou ocultar a linha de estatísticas e os widgets à direita.',
  'help.guide.widgets.step.1': 'Abra o menu do seu avatar no canto superior direito e escolha “Configurações”.',
  'help.guide.widgets.step.2': 'Vá para a aba “Appearance”.',
  'help.guide.widgets.step.3':
    'Em “Dashboard widgets”, ligue ou desligue cada widget. Desktop e celular são configurados separadamente.',
  'help.guide.widgets.step.4': 'Volte ao painel. A mudança vale na hora.',
  'help.guide.widgets.result':
    'Widgets ocultos liberam espaço para as suas viagens; desligue toda a coluna da direita para centralizar o layout.',
  'help.guide.widgets.link': 'Abrir as configurações de aparência',

  // currency-widget
  'help.guide.currency-widget.title': 'Converter moedas',
  'help.guide.currency-widget.goal': 'Converter um valor entre duas moedas com as cotações atuais.',
  'help.guide.currency-widget.step.1': 'Digite o valor e escolha as duas moedas.',
  'help.guide.currency-widget.step.2': 'A seta entre elas troca o par; a seta circular atualiza a cotação.',
  'help.guide.currency-widget.result':
    'Seu par de moedas fica salvo na sua conta, então é o mesmo em todos os dispositivos.',
  'help.guide.currency-widget.tip.1': 'As cotações vêm do Banco Central Europeu e são atualizadas uma vez por dia.',

  // timezones-widget
  'help.guide.timezones-widget.title': 'Adicionar relógios mundiais',
  'help.guide.timezones-widget.goal': 'Ficar de olho na hora local dos seus destinos.',
  'help.guide.timezones-widget.step.1': 'Clique em + no widget “Fusos horários” e busque uma cidade.',
  'help.guide.timezones-widget.step.2': 'Remova um relógio com o × ao lado.',
  'help.guide.timezones-widget.result': 'Seus relógios ficam salvos com a sua conta.',

  // ── Screen: vacay ──────────────────────────────────────────────────────────
  'help.ctx.vacay.title': 'Vacay',
  'help.ctx.vacay.summary':
    'O Vacay é o seu planejador pessoal de férias: quantos dias você tem no ano, quais já registrou e quantos restam. A grade mostra o ano inteiro de relance; a barra lateral reúne o seletor de ano, as pessoas com quem você planeja, calendários compartilhados com você, a legenda e o seu saldo.',
  'help.ctx.vacay.bullet.1':
    'Grade anual: doze cartões de mês, uma célula por dia. Clique em um dia para registrar ou apagar. Um pontinho azul marca os dias que uma viagem já cobre.',
  'help.ctx.vacay.bullet.2':
    'Barra inferior: modo Férias ou Feriado da empresa, mais as chaves Meio dia e Banco de horas que mudam o que um clique registra.',
  'help.ctx.vacay.bullet.3':
    'Direito: seus dias do ano, quantos foram usados e quantos restam, com o saldo transferido do período anterior.',
  'help.ctx.vacay.bullet.4':
    'Pessoas são quem está fundido ao seu plano, cada uma com sua cor. Calendários compartilhados são anéis somente leitura das folgas de outras pessoas.',
  'help.ctx.vacay.bullet.5':
    'As configurações cobrem fins de semana, início da semana, transferência de saldo, seu ano de férias, feriados da empresa e calendários de feriados ou férias escolares.',
  // log-day
  'help.guide.log-day.title': 'Registrar um dia de férias',
  'help.guide.log-day.goal': 'Marcar uma folga na grade do ano e ver o saldo acompanhar.',
  'help.guide.log-day.step.1':
    'Olhe a barra inferior: o botão da esquerda, na sua cor, significa que um clique registra um dia de férias para você.',
  'help.guide.log-day.step.2':
    'Clique em um dia em qualquer cartão de mês. Ele se preenche com a sua cor e Usados conta um dia a mais.',
  'help.guide.log-day.step.3': 'Clique de novo no mesmo dia para apagar.',
  'help.guide.log-day.result':
    'O dia fica registrado, Dias, Usados e Restantes atualizam na hora, e quem estiver fundido ao seu plano vê ao vivo.',
  'help.guide.log-day.tip.1':
    'Fins de semana não podem ser registrados enquanto Bloquear fins de semana estiver ligado nas Configurações.',
  'help.guide.log-day.tip.2':
    'Um ponto azul em uma célula significa que uma das suas viagens cobre aquele dia, então você vê onde férias e viagem coincidem.',
  // half-day
  'help.guide.half-day.title': 'Registrar meio dia',
  'help.guide.half-day.goal': 'Tirar uma tarde sem gastar um dia inteiro de saldo.',
  'help.guide.half-day.step.1': 'Ligue Meio dia na barra. O ponto laranja é a marca que um meio dia recebe na grade.',
  'help.guide.half-day.step.2': 'Clique em um dia. Ele é registrado como 0,5 e leva o ponto laranja no canto.',
  'help.guide.half-day.step.3':
    'Desligue Meio dia quando terminar; clicar em um meio dia com outras configurações o converte no lugar.',
  'help.guide.half-day.result':
    'Usados cresce 0,5. Meio dia e Banco de horas são independentes, então meio dia de compensação também é possível.',
  'help.guide.half-day.tip.1':
    'A barra sempre mostra a marca que o próximo clique vai colocar, para você conferir antes de registrar.',
  // comp-day
  'help.guide.comp-day.title': 'Registrar compensação ou flex',
  'help.guide.comp-day.goal': 'Tirar folga compensatória que não custa dias de férias.',
  'help.guide.comp-day.step.1':
    'Ligue Banco de horas na barra. O disco hachurado é a aparência de um dia de compensação na grade.',
  'help.guide.comp-day.step.2':
    'Clique em um dia. Ele se preenche com listras diagonais na sua cor em vez de um bloco sólido.',
  'help.guide.comp-day.result':
    'Dias de compensação são contados ao lado dos cartões de saldo e nunca reduzem Restantes.',
  'help.guide.comp-day.tip.1':
    'Horas extras compensadas, banco de horas, um dia de folga compensatória: tudo que é folga mas não férias entra aqui.',
  // entitlement
  'help.guide.entitlement.title': 'Definir seu saldo de férias',
  'help.guide.entitlement.goal': 'Dizer ao Vacay quantos dias de férias você tem no ano.',
  'help.guide.entitlement.step.1': 'Na barra lateral, clique no cartão Dias em Direito.',
  'help.guide.entitlement.step.2': 'Digite seu número de dias e pressione Enter.',
  'help.guide.entitlement.result':
    'Restantes é recalculado a partir do seu saldo, de qualquer transferência e dos dias usados.',
  'help.guide.entitlement.tip.1': 'Cada ano tem seu próprio saldo, então uma mudança aqui afeta só o ano selecionado.',
  // years
  'help.guide.years.title': 'Adicionar e trocar de ano',
  'help.guide.years.goal': 'Já planejar o ano que vem, ou rever o anterior.',
  'help.guide.years.step.1':
    'Clique no + à direita do ano para adicionar o próximo, ou no + à esquerda para o anterior.',
  'help.guide.years.step.2': 'Troque de ano com as setas ou com as fichas de ano logo abaixo.',
  'help.guide.years.step.3':
    'Para remover um ano, passe o mouse na ficha dele e clique no pequeno menos. As entradas dele vão junto, então confirme com cuidado.',
  'help.guide.years.result': 'Cada ano mantém seu próprio saldo e suas entradas; a transferência liga um ao outro.',
  // company-holidays
  'help.guide.company-holidays.title': 'Marcar feriados da empresa',
  'help.guide.company-holidays.goal':
    'Bloquear os dias em que a empresa inteira está de folga sem gastar o saldo de ninguém.',
  'help.guide.company-holidays.step.1':
    'Abra as Configurações e confira se Feriados da empresa está ligado. É o padrão; a barra só oferece o modo enquanto estiver ligado.',
  'help.guide.company-holidays.step.2': 'De volta à grade, coloque a barra no modo Feriado da empresa.',
  'help.guide.company-holidays.step.3': 'Clique nos dias. Eles ficam âmbar e aparecem na legenda.',
  'help.guide.company-holidays.result':
    'Feriados da empresa são visíveis para todos que estão fundidos ao plano e nunca reduzem Restantes.',
  'help.guide.company-holidays.tip.1':
    'Qualquer pessoa fundida pode editar os feriados da empresa, então combinem quem cuida deles.',
  // public-holidays
  'help.guide.public-holidays.title': 'Mostrar feriados',
  'help.guide.public-holidays.goal': 'Colocar na grade os feriados do seu país ou região.',
  'help.guide.public-holidays.step.1': 'Abra as Configurações e ligue Feriados nacionais.',
  'help.guide.public-holidays.step.2':
    'Clique em Adicionar calendário, escolha o país e, quando fizer diferença, a região. Dê uma cor e um rótulo se quiser.',
  'help.guide.public-holidays.step.3': 'Feche as Configurações. Os feriados aparecem na grade e na legenda.',
  'help.guide.public-holidays.result': 'Feriados são marcados na cor do calendário e nunca contam contra o seu saldo.',
  'help.guide.public-holidays.tip.1':
    'Você pode adicionar vários calendários, por exemplo a sua região e a de um colega fundido.',
  // school-holidays
  'help.guide.school-holidays.title': 'Mostrar férias escolares',
  'help.guide.school-holidays.goal': 'Ver as férias escolares da sua região ao lado das suas próprias folgas.',
  'help.guide.school-holidays.step.1': 'Abra as Configurações e ligue School Holidays.',
  'help.guide.school-holidays.step.2':
    'Clique em Adicionar calendário e escolha o país. Onde um país divide o calendário, escolha também a região ou o grupo.',
  'help.guide.school-holidays.step.3':
    'Feche as Configurações. Cada período recebe uma faixa colorida na parte de baixo dos seus dias.',
  'help.guide.school-holidays.result': 'Férias escolares são puramente visuais: nunca reduzem o saldo de ninguém.',
  'help.guide.school-holidays.tip.1':
    'Falta a sua região? O administrador pode manter férias escolares à mão em Admin, Personalização, Férias escolares.',
  // weekends
  'help.guide.weekends.title': 'Bloquear fins de semana e definir o início da semana',
  'help.guide.weekends.goal':
    'Manter os fins de semana fora da contagem e começar a semana no dia a que você está acostumado.',
  'help.guide.weekends.step.1': 'Abra as Configurações.',
  'help.guide.weekends.step.2': 'Ligue Bloquear fins de semana e escolha quais dias contam como seu fim de semana.',
  'help.guide.weekends.step.3': 'Em Semana começa em, escolha segunda ou domingo.',
  'help.guide.weekends.result': 'Dias bloqueados ficam acinzentados na grade e não podem ser registrados por engano.',
  // leave-year
  'help.guide.leave-year.title': 'Definir seu ano de férias',
  'help.guide.leave-year.goal':
    'Contar seu saldo por ano fiscal ou a partir da data de contratação em vez de janeiro a dezembro.',
  'help.guide.leave-year.step.1': 'Abra as Configurações e encontre Ano de férias.',
  'help.guide.leave-year.step.2':
    'Escolha Calendário, Fiscal (com o mês e o dia em que começa) ou Admissão (com a data em que você foi contratado).',
  'help.guide.leave-year.result':
    'Saldo, dias usados e transferência seguem esse período, e a grade começa pelo primeiro mês dele.',
  'help.guide.leave-year.tip.1':
    'Esta configuração é pessoal: em um plano fundido cada um mantém seu próprio ano de férias e seus números.',
  // carry-over
  'help.guide.carry-over.title': 'Transferir dias não usados',
  'help.guide.carry-over.goal': 'Somar o que sobra no fim de um período ao seguinte.',
  'help.guide.carry-over.step.1': 'Abra as Configurações.',
  'help.guide.carry-over.step.2': 'Ligue Acúmulo.',
  'help.guide.carry-over.result': 'O valor transferido é recalculado em todos os seus anos e mostrado abaixo do saldo.',
  'help.guide.carry-over.tip.1': 'Desligar zera todos os saldos transferidos.',
  // invite
  'help.guide.invite.title': 'Planejar junto com alguém',
  'help.guide.invite.goal':
    'Fundir seu plano com outro usuário do TREK para verem as folgas um do outro em uma só grade.',
  'help.guide.invite.step.1': 'Clique no ícone de pessoa no painel Pessoas.',
  'help.guide.invite.step.2': 'Escolha o usuário e envie o convite.',
  'help.guide.invite.step.3': 'A pessoa recebe uma notificação e aceita. Até lá o convite aparece como pendente.',
  'help.guide.invite.result':
    'Os dois planos se fundem: cada pessoa tem uma cor, vocês podem registrar dias um para o outro, e tudo sincroniza ao vivo.',
  'help.guide.invite.tip.1':
    'Para desfazer uma fusão, use Encerrar nas Configurações. As entradas de cada um voltam para o próprio plano.',
  'help.guide.invite.tip.2': 'Se a outra pessoa só precisa ver seus dias, compartilhe seu calendário em vez de fundir.',
  // share-calendar
  'help.guide.share-calendar.title': 'Compartilhar seu calendário somente leitura',
  'help.guide.share-calendar.goal': 'Deixar alguém ver quando você está de folga sem dar voz no seu plano.',
  'help.guide.share-calendar.step.1': 'Clique no ícone de compartilhar no painel Calendários compartilhados.',
  'help.guide.share-calendar.step.2': 'Escolha o usuário e clique em Compartilhar. Não precisa de aceite.',
  'help.guide.share-calendar.step.3':
    'Calendários compartilhados com você aparecem no mesmo painel; o olho esconde um, Parar de compartilhar revoga o seu.',
  'help.guide.share-calendar.result':
    'Suas folgas aparecem como um anel colorido na grade da outra pessoa. Nada do que você compartilha pode ser editado por lá.',
  'help.guide.share-calendar.tip.1':
    'Compartilhar e fundir são independentes: você pode estar fundido com uma pessoa e compartilhar com outras.',
  'help.guide.share-calendar.tip.2': 'Passe o mouse em um dia com anel para ver quem está de folga e por quanto tempo.',

  // ── Screen: atlas ─────────────────────────────────────────────────────────────────────
  'help.ctx.atlas.title': 'Atlas',
  'help.ctx.atlas.summary':
    'O Atlas é a sua pegada de viagem num mapa-múndi: cada país aonde uma viagem te levou está colorido, e os que você visitou antes do TREK você adiciona à mão. Aproxime o zoom para ver regiões, mantenha uma lista de desejos de lugares que ainda quer ver e leia seus números no painel de vidro embaixo.',
  'help.ctx.atlas.bullet.1':
    'O mapa: países visitados têm uma cor que é deles, países planejados têm contorno tracejado, países da lista de desejos têm hachura diagonal, todo o resto é cinza. Passe o mouse sobre um país para ver viagens, lugares e primeira e última visita.',
  'help.ctx.atlas.bullet.2':
    'Busca no topo: digite um país ou um lugar. Escolher um país voa até lá e abre a janela dele; escolher um lugar pousa na região dele para que você possa marcá-la.',
  'help.ctx.atlas.bullet.3':
    'Mostrar países planejados, no canto superior direito: revela os países das suas próximas viagens. A chave só aparece enquanto você tiver alguma.',
  'help.ctx.atlas.bullet.4':
    'Painel embaixo: a aba Estatísticas com países, viagens, lugares, cidades, dias, continentes e sua sequência; a aba Lista de desejos com o que ainda está por vir.',
  'help.ctx.atlas.bullet.5':
    'Regiões: a partir do nível de zoom 5 o mapa passa a estados e províncias, cada um clicável para marcar ou remover.',
  'help.ctx.atlas.bullet.6':
    'Dawarich: com o addon conectado, um painel à esquerda das estatísticas dá baixa em desejos e adiciona países dos seus registros, nunca sem a sua confirmação.',
  // mark-country
  'help.guide.mark-country.title': 'Marcar um país como visitado',
  'help.guide.mark-country.goal':
    'Adicione um país onde você esteve antes do TREK, para que o mapa e a sua contagem o incluam.',
  'help.guide.mark-country.step.1': 'Digite o país na caixa de busca no topo do mapa.',
  'help.guide.mark-country.step.2': 'Escolha-o na lista. O mapa voa até lá e abre uma janela para esse país.',
  'help.guide.mark-country.step.3': 'Escolha Marcar como visitado.',
  'help.guide.mark-country.result':
    'O país ganha a sua cor no mapa e Países conta um a mais. Essa cor é permanente: marcar mais países nunca embaralha o resto.',
  'help.guide.mark-country.tip.1':
    'Clicar num país cinza no mapa abre a mesma janela; a busca é o caminho seguro para países pequenos.',
  'help.guide.mark-country.tip.2':
    'Um país marcado à mão sempre conta como visitado, sejam quais forem as datas de qualquer viagem para lá.',
  // unmark-country
  'help.guide.unmark-country.title': 'Remover um país que você marcou',
  'help.guide.unmark-country.goal': 'Tire de novo do mapa um país marcado à mão.',
  'help.guide.unmark-country.step.1':
    'Busque o país e escolha-o, ou clique nele no mapa. Para um país que você mesmo marcou, a janela pergunta se deve removê-lo.',
  'help.guide.unmark-country.step.2': 'Confirme com Remover.',
  'help.guide.unmark-country.result': 'O país volta a ficar cinza e sai da sua contagem.',
  'help.guide.unmark-country.tip.1':
    'Só países marcados à mão podem ser removidos assim. Um país com viagens ou lugares fica enquanto eles existirem; Remover também está no cartão de detalhe dele no painel quando foi marcado à mão.',
  // country-details
  'help.guide.country-details.title': 'Ver o que você fez num país',
  'help.guide.country-details.goal': 'Abra um país visitado e pule para as viagens que te levaram até lá.',
  'help.guide.country-details.step.1': 'Busque um país que você visitou.',
  'help.guide.country-details.step.2':
    'Escolha-o. O mapa voa até lá e o painel embaixo ganha um cartão com a bandeira, lugares, viagens e um chip por viagem.',
  'help.guide.country-details.result': 'Clique num chip de viagem para abrir essa viagem no planejador.',
  'help.guide.country-details.tip.1':
    'Passar o mouse sobre o país no mapa mostra os mesmos números mais a primeira e a última visita.',
  // planned-countries
  'help.guide.planned-countries.title': 'Mostrar os países para onde você vai',
  'help.guide.planned-countries.goal':
    'Traga para o mapa os países das suas próximas viagens sem contá-los como visitados.',
  'help.guide.planned-countries.step.1':
    'Ative Mostrar países planejados, no canto superior direito. O número ao lado diz quantos estão esperando.',
  'help.guide.planned-countries.step.2':
    'Busque um país planejado e escolha-o: o painel diz Planejado e a dica no mapa mostra quando você vai.',
  'help.guide.planned-countries.result':
    'Países planejados aparecem com contorno tracejado, para nunca parecerem um lugar onde você já esteve. A chave lembra a sua escolha.',
  'help.guide.planned-countries.tip.1':
    'Um país conta como visitado assim que a viagem para lá começou; uma viagem em andamento também conta. Viagens sem datas ficam totalmente fora das estatísticas.',
  'help.guide.planned-countries.tip.2': 'A chave só existe enquanto você tiver viagens futuras.',
  // regions
  'help.guide.regions.title': 'Marcar uma região',
  'help.guide.regions.goal': 'Mais fino que países: marque os estados, províncias ou prefeituras onde você esteve.',
  'help.guide.regions.step.1':
    'Aproxime o zoom num país até as regiões dele aparecerem, a partir do nível 5. Buscar o país e escolhê-lo te leva perto o bastante.',
  'help.guide.regions.step.2':
    'Clique numa região. Ao passar o mouse aparece o nome; a janela mostra a região e o país dela.',
  'help.guide.regions.step.3': 'Escolha Marcar como visitado.',
  'help.guide.regions.result':
    'A região se preenche com a cor do país. Marcar uma região também conta o país como visitado se ainda não era.',
  'help.guide.regions.tip.1':
    'Clicar numa região visitada oferece Remover, tenha você a marcado ou um lugar a colocado lá.',
  'help.guide.regions.tip.2': 'Regiões onde você tem lugares reais são marcadas para você; ali não há nada a fazer.',
  // search-place
  'help.guide.search-place.title': 'Encontrar um lugar e marcar a região dele',
  'help.guide.search-place.goal': 'Marque a Baviera buscando Munique, sem saber em que região fica uma cidade.',
  'help.guide.search-place.step.1':
    'Digite uma cidade, um ponto turístico ou um endereço na caixa de busca. Os países vêm primeiro; os lugares correspondentes aparecem abaixo, sob Lugares.',
  'help.guide.search-place.step.2': 'Escolha o lugar. O mapa voa até lá e descobre em que região o ponto está.',
  'help.guide.search-place.step.3':
    'Escolha Marcar como visitado para essa região, ou Adicionar à lista de desejos se ela ainda está por vir.',
  'help.guide.search-place.result':
    'A região fica marcada, e com ela o país. Países sem dados de região no pacote de mapas recorrem ao próprio país.',
  'help.guide.search-place.tip.1':
    'Os lugares vêm da mesma busca usada em todo o TREK, então seguem o provedor que o seu admin configurou.',
  // bucket-country
  'help.guide.bucket-country.title': 'Colocar um país na lista de desejos',
  'help.guide.bucket-country.goal':
    'Mantenha uma lista de desejos de países direto no mapa, separada dos que você já visitou.',
  'help.guide.bucket-country.step.1': 'Busque o país e escolha-o, ou clique nele no mapa.',
  'help.guide.bucket-country.step.2': 'Escolha Adicionar à lista de desejos.',
  'help.guide.bucket-country.step.3':
    'Escolha mês e ano se já souber quando, e confirme com Adicionar à lista de desejos.',
  'help.guide.bucket-country.result':
    'O país é desenhado com hachura diagonal na cor que terá quando você chegar lá, e aparece na aba Lista de desejos do painel.',
  'help.guide.bucket-country.tip.1':
    'A mesma janela oferece Remover da lista de desejos assim que o país está na lista.',
  'help.guide.bucket-country.tip.2':
    'Uma entrada por data alvo: o mesmo país pode estar na lista para dois meses diferentes, mas não duas vezes para o mesmo.',
  // bucket-place
  'help.guide.bucket-place.title': 'Adicionar um lugar à lista de desejos',
  'help.guide.bucket-place.goal':
    'Guarde uma cidade, um ponto turístico ou um endereço com que você sonha, com coordenadas e data alvo.',
  'help.guide.bucket-place.step.1': 'Abra a aba Lista de desejos no painel embaixo.',
  'help.guide.bucket-place.step.2': 'Clique em Adicionar lugar.',
  'help.guide.bucket-place.step.3':
    'Digite o nome e pressione o botão de busca; escolha o resultado para que o lugar tenha coordenadas. Digitar só um nome e pular a busca também funciona.',
  'help.guide.bucket-place.step.4': 'Escolha mês e ano se quiser e clique em Adicionar.',
  'help.guide.bucket-place.result':
    'O lugar fica no topo da sua lista de desejos com a data alvo; o × ao lado o remove de novo.',
  'help.guide.bucket-place.tip.1':
    'Um desejo com coordenadas é o que o Dawarich pode dar baixa para você depois, quando seus registros mostrarem que você esteve lá.',
  // stats
  'help.guide.stats.title': 'Ler as suas estatísticas',
  'help.guide.stats.goal': 'Saber o que os números do painel contam, e o que não contam.',
  'help.guide.stats.step.1':
    'Países é o número de países distintos onde você realmente esteve; os planejados aparecem ao lado, não dentro. Viagens, Lugares e Dias são totais de todas as suas viagens. Cidades é deduzido dos endereços dos seus lugares, portanto é uma estimativa.',
  'help.guide.stats.step.2':
    'Os continentes mostram países visitados por continente; a Antártida entra na fila assim que você tiver estado lá. Depois a sua sequência, anos consecutivos com pelo menos uma viagem, e quantas viagens você fez este ano.',
  'help.guide.stats.result':
    'Os números acompanham as suas viagens conforme você as planeja; aqui nada precisa de manutenção.',
  'help.guide.stats.tip.1':
    'As cidades são lidas do texto do endereço, não consultadas, então um endereço curto como “Osteria Francescana, Italy” ou um que termina numa prefeitura pode dar uma região em vez de uma cidade.',
  'help.guide.stats.tip.2':
    'Países marcados à mão contam em Países e nos continentes, mas não trazem viagens, lugares nem dias.',
  // dawarich-countries
  'help.guide.dawarich-countries.title': 'Adicionar países a partir das suas gravações',
  'help.guide.dawarich-countries.goal':
    'Deixe o Dawarich dizer em quais países você esteve no último ano, e ponha no mapa os que você confirmar.',
  'help.guide.dawarich-countries.step.1':
    'Com o addon Dawarich conectado, um painel Dawarich fica embaixo do mapa, à esquerda das estatísticas, com dois blocos. Clique em Países.',
  'help.guide.dawarich-countries.step.2':
    'A janela abre na aba Países. Clique em Procurar países: o TREK lê os países e cidades que as suas gravações cobrem nos últimos 12 meses, um mês de cada vez, então dê um instante. Cada país que o seu Atlas ainda não tem aparece na lista com a bandeira, quantas cidades e a primeira delas pelo nome, e começa marcado; clique numa linha para deixá-la de fora.',
  'help.guide.dawarich-countries.step.3':
    'Confirme com o botão no canto inferior direito, que diz Adicionar 5 países quando cinco linhas estão marcadas. A janela diz quantos foram adicionados; feche-a e o mapa já se releu.',
  'help.guide.dawarich-countries.result':
    'Os países confirmados carregam uma cor no mapa e contam em Países, registrados como vindos do Dawarich. O que você marcou à mão fica intocado.',
  'help.guide.dawarich-countries.tip.1':
    'Países que o Atlas já mostra como visitados, à mão, por uma viagem ou por uma conferência anterior, ficam de fora, então as suas próprias marcações nunca são rerotuladas. Um país que você tirou do Atlas antes volta quando você o confirma aqui.',
  'help.guide.dawarich-countries.tip.2':
    'Um nome de país que o TREK não consegue casar aparece abaixo das linhas em vez de ser descartado, e Verificar de novo pergunta ao Dawarich mais uma vez. A nota abaixo da lista diz que foram analisados os últimos 12 meses; essa janela é fixa.',
  // dawarich-wishes
  'help.guide.dawarich-wishes.title': 'Riscar desejos a partir das suas gravações',
  'help.guide.dawarich-wishes.goal':
    'Descubra quais lugares da sua lista de desejos você realmente alcançou, e risque-os no dia em que aconteceu.',
  'help.guide.dawarich-wishes.step.1':
    'No painel Dawarich embaixo do mapa, à esquerda das estatísticas, clique em Lista de desejos.',
  'help.guide.dawarich-wishes.step.2':
    'A janela abre na aba Lista de desejos. Clique em Conferir lista de desejos: o TREK vasculha as suas gravações atrás de cada entrada que tem coordenadas. Um desejo que você alcançou aparece na lista com o quanto você chegou perto, quanto tempo ficou e o dia, e começa marcado; um que você já riscou diz Já riscado. Abaixo da lista, uma nota conta as entradas sem coordenadas, e a regra também está lá: Um desejo conta como alcançado a até 250 m e após 20 minutos no local.',
  'help.guide.dawarich-wishes.step.3':
    'Confirme com o botão no canto inferior direito, que diz Riscar 2 quando duas linhas estão marcadas. Depois feche a janela e abra a aba Lista de desejos do painel ao lado.',
  'help.guide.dawarich-wishes.result':
    'Cada desejo carrega um tique verde com a data da estadia, não a de hoje; a dica dele diz Riscado a partir das suas gravações do Dawarich, e um clique na data desfaz isso.',
  'help.guide.dawarich-wishes.tip.1':
    'Passar de carro não conta: a regra exige proximidade e tempo, e entre várias estadias que se qualificam vence a mais longa. Um desejo sem coordenadas não pode ser conferido, então adicione lugares pela busca em Adicionar lugar em vez de só pelo nome.',
  'help.guide.dawarich-wishes.tip.2':
    'Uma conferência olha até 50 entradas, primeiro as ainda não riscadas, e avisa quando havia mais. Um desejo que já estava riscado mantém a própria data.',

  // ── Screen: collections ───────────────────────────────────────────────────────────────
  'help.ctx.collections.title': 'Coleções',
  'help.ctx.collections.summary':
    'Collections é a sua biblioteca de lugares fora de qualquer viagem: listas com nome de lugares que você encontrou e quer guardar, cada lugar com um status Ideia, Quero ir ou Visitado. Os lugares são copiados para dentro e para fora das viagens, nunca vinculados, então uma lista e uma viagem nunca alteram uma à outra.',
  'help.ctx.collections.bullet.1':
    'Barra de listas à esquerda: suas próprias listas, as compartilhadas com você, convites esperando um sim, Todos os salvos como a união de tudo o que é seu, e Nova lista mais a importação de arquivo no topo.',
  'help.ctx.collections.bullet.2':
    'Cabeçalho da lista aberta: sua cor, capa, descrição e links, os membros, e as ações Editar, Exportar e Compartilhar à direita.',
  'help.ctx.collections.bullet.3':
    'Linha de filtros acima dos lugares: status, categoria, avaliação e ordenação, o filtro de rótulos, o + para adicionar um lugar, a importação de uma viagem e Escolher para ações em massa.',
  'help.ctx.collections.bullet.4':
    'Linhas de lugares: avatar, nome e endereço, rótulos e categoria, e a pílula de status à direita, que alterna com um clique.',
  'help.ctx.collections.bullet.5':
    'Mapa à direita: um pino por lugar com coordenadas, o alternador lista ou mapa, a caixa de busca e o filtro de rótulos. Clicar num pino abre esse lugar.',
  'help.ctx.collections.bullet.6':
    'Ficha de detalhes: clique numa linha para ver capa, categoria, rótulos, status, descrição e links, com Editar, Copiar para viagem e Remover da lista.',
  // create-list
  'help.guide.create-list.title': 'Criar uma lista',
  'help.guide.create-list.goal': 'Comece uma nova lista com nome, com uma cor e uma capa, pronta para receber lugares.',
  'help.guide.create-list.step.1': 'Clique em Nova lista no topo da barra de listas.',
  'help.guide.create-list.step.2':
    'Dê um nome à lista e escolha uma cor. Imagem de capa, descrição e links são opcionais; você pode adicioná-los depois com Editar.',
  'help.guide.create-list.step.3': 'Clique em Criar.',
  'help.guide.create-list.result':
    'A lista abre vazia, com Adicionar um lugar e Importar de uma viagem como as duas formas de preenchê-la.',
  'help.guide.create-list.tip.1':
    'A capa pode ser um upload seu ou uma imagem encontrada pela busca do Unsplash no mesmo diálogo.',
  // add-place
  'help.guide.add-place.title': 'Adicionar um lugar',
  'help.guide.add-place.goal':
    'Encontre um lugar e salve-o na lista aberta com nome, categoria, status e notas de uma vez.',
  'help.guide.add-place.step.1': 'Clique no + na linha de filtros acima dos lugares.',
  'help.guide.add-place.step.2':
    'Digite o lugar no campo de busca e escolha um resultado. Nome, endereço e coordenadas são preenchidos a partir dele.',
  'help.guide.add-place.step.3':
    'Defina o status e, se quiser, uma categoria, uma descrição e links, depois clique em Adicionar. O diálogo continua aberto para o próximo lugar; Cancelar o fecha.',
  'help.guide.add-place.result': 'O lugar aparece na lista e, quando tem coordenadas, como um pino no mapa.',
  'help.guide.add-place.tip.1':
    'De dentro de uma viagem, Salvar na Coleção no inspetor do lugar ou no menu do lugar coloca um lugar da viagem numa lista sem sair da viagem.',
  'help.guide.add-place.tip.2':
    'A lista precisa ser sua ou uma em que você é editor ou administrador; o + não está em Todos os salvos nem numa lista que você só visualiza.',
  // import-from-trip
  'help.guide.import-from-trip.title': 'Importar lugares de uma viagem',
  'help.guide.import-from-trip.goal':
    'Traga os lugares de uma viagem inteira para uma lista de uma vez, em vez de salvá-los um por um.',
  'help.guide.import-from-trip.step.1':
    'Clique no botão de importar com a seta de nuvem na linha de filtros. Numa lista vazia a mesma ação fica ao lado de Adicionar um lugar.',
  'help.guide.import-from-trip.step.2': 'Escolha uma das suas viagens.',
  'help.guide.import-from-trip.step.3':
    'Marque os lugares que quiser. Os que já estão na lista aparecem em cinza; os que nenhum dia da viagem contém começam selecionados. Apenas novos esconde o que você já tem.',
  'help.guide.import-from-trip.step.4':
    'Clique em Importar. O botão sempre diz quantos estão prestes a ser adicionados.',
  'help.guide.import-from-trip.result':
    'Os lugares são copiados para a lista com nome, endereço, coordenadas, descrição e categoria. A viagem fica como estava.',
  'help.guide.import-from-trip.tip.1':
    'Duplicatas por nome ou coordenadas são puladas automaticamente, então importar duas vezes não faz mal.',
  'help.guide.import-from-trip.tip.2':
    'Dentro da lista de lugares de uma viagem, o modo de seleção oferece em vez disso Salvar na Coleção para um conjunto de lugares escolhidos a dedo.',
  // place-status
  'help.guide.place-status.title': 'Definir o status de um lugar',
  'help.guide.place-status.goal': 'Acompanhe o que é ideia, o que está na lista curta e onde você já esteve.',
  'help.guide.place-status.step.1':
    'Clique na pílula de status na ponta direita de uma linha de lugar. Ideia vira Quero ir.',
  'help.guide.place-status.step.2': 'Clique de novo para Visitado, e mais uma vez para recomeçar em Ideia.',
  'help.guide.place-status.result':
    'A pílula e a cor dela mudam na hora; o filtro de status acima da lista acompanha a contagem.',
  'help.guide.place-status.tip.1': 'Status é coisa do Collections: copiar um lugar para uma viagem não o leva junto.',
  'help.guide.place-status.tip.2':
    'De uma viagem, Salvar na Coleção mostra uma pílula de status por lista em que o lugar está, e o painel de lugares tem a ação Marcar como visitado para uma seleção.',
  // place-detail
  'help.guide.place-detail.title': 'Abrir um lugar salvo',
  'help.guide.place-detail.goal': 'Veja tudo sobre um lugar e aja: editar, copiar para uma viagem, remover.',
  'help.guide.place-detail.step.1':
    'Clique numa linha de lugar. A ficha de detalhes abre ao lado da lista e o mapa se desloca até o lugar.',
  'help.guide.place-detail.step.2':
    'Embaixo ficam Editar, Copiar para viagem e Remover da lista; a câmera na capa troca a foto automática por uma sua.',
  'help.guide.place-detail.result':
    'Editar libera nome, categoria, rótulos, endereço, coordenadas, descrição e links direto na ficha.',
  'help.guide.place-detail.tip.1':
    'A capa é buscada automaticamente quando o lugar não tem imagem própria. Seu upload pode ser JPG, PNG, GIF ou WebP até 20 MB.',
  'help.guide.place-detail.tip.2':
    'Membros de uma lista compartilhada também podem deixar aqui uma avaliação em estrelas, e o filtro de avaliação na linha de filtros usa a média.',
  // labels
  'help.guide.labels.title': 'Agrupar lugares com rótulos',
  'help.guide.labels.goal': 'Dê a uma lista rótulos próprios, como bairros ou dias, além das categorias comuns.',
  'help.guide.labels.step.1': 'Abra o gerenciador de rótulos pelo controle de rótulos na linha de filtros.',
  'help.guide.labels.step.2':
    'Digite um nome, escolha uma cor e clique em Adicionar rótulo. Renomeie, recolora ou exclua rótulos existentes no mesmo diálogo.',
  'help.guide.labels.step.3':
    'Ative Escolher, marque os lugares e clique em Atribuir rótulo na barra de seleção. Um único lugar também recebe rótulos por Editar na ficha de detalhes dele.',
  'help.guide.labels.step.4':
    'Escolha um ou mais rótulos na linha de filtros para restringir a lista e o mapa aos lugares que carregam qualquer um deles.',
  'help.guide.labels.result':
    'Lugares rotulados mostram seus rótulos na linha; o filtro de rótulos está lá para todo membro, inclusive visualizadores.',
  'help.guide.labels.tip.1':
    'Rótulos pertencem à única lista em que foram criados. Mover um lugar para outra lista os descarta.',
  'help.guide.labels.tip.2': 'Gerenciar e atribuir rótulos exige direitos de edição na lista.',
  // filter-select
  'help.guide.filter-select.title': 'Filtrar e selecionar lugares',
  'help.guide.filter-select.goal': 'Restrinja a lista e aja sobre muitos lugares de uma vez.',
  'help.guide.filter-select.step.1':
    'Use os menus na linha de filtros: status, categoria, avaliação mínima e ordem. Cada um mostra quantos lugares deixaria.',
  'help.guide.filter-select.step.2':
    'Clique em Escolher. Cada linha ganha uma caixa de seleção e aparece uma barra de seleção.',
  'help.guide.filter-select.step.3':
    'Marque lugares ou use Selecionar tudo para tudo o que está filtrado no momento, depois escolha Atribuir rótulo, Mover para lista, Duplicar em lista, Copiar para viagem ou Excluir.',
  'help.guide.filter-select.result':
    'As ações valem para toda a seleção de uma vez. O × à direita sai do modo de seleção.',
  'help.guide.filter-select.tip.1':
    'Selecionar tudo segue o filtro, então filtrar por Quero ir e selecionar tudo é o jeito rápido de agir sobre a lista curta.',
  // copy-to-trip
  'help.guide.copy-to-trip.title': 'Copiar lugares para uma viagem',
  'help.guide.copy-to-trip.goal': 'Transforme lugares salvos em paradas de uma das suas viagens.',
  'help.guide.copy-to-trip.step.1':
    'Ative Escolher e marque os lugares, ou abra um lugar e use Copiar para viagem na ficha de detalhes dele.',
  'help.guide.copy-to-trip.step.2': 'Clique em Copiar para viagem na barra de seleção.',
  'help.guide.copy-to-trip.step.3': 'Escolha a viagem. A caixa de busca encurta uma lista longa.',
  'help.guide.copy-to-trip.result':
    'Os lugares caem na lista de lugares dessa viagem com nome, descrição, categoria, notas, preço, coordenadas, foto e tags. Nada muda na coleção.',
  'help.guide.copy-to-trip.tip.1':
    'Visualizadores de uma lista compartilhada também podem fazer isso; copia para fora da lista, não a altera.',
  // share-list
  'help.guide.share-list.title': 'Compartilhar uma lista com alguém',
  'help.guide.share-list.goal': 'Planeje uma lista junto com outras pessoas deste TREK, ao vivo.',
  'help.guide.share-list.step.1': 'Clique em Compartilhar no cabeçalho da sua lista.',
  'help.guide.share-list.step.2': 'Selecione o usuário e um papel: Visualizador, Editor ou Administrador.',
  'help.guide.share-list.step.3':
    'Clique em Enviar convite. A pessoa aparece como convite pendente até aceitar o convite na barra de listas dela.',
  'help.guide.share-list.result':
    'Depois de aceito, a lista aparece para ela em Compartilhada e toda alteração sincroniza ao vivo. Membros e seus papéis continuam editáveis no mesmo diálogo.',
  'help.guide.share-list.tip.1':
    'Visualizadores podem olhar, avaliar e copiar lugares para as próprias viagens. Editores adicionam e editam lugares e rótulos. Administradores também podem excluir.',
  'help.guide.share-list.tip.2':
    'Só o dono convida e remove pessoas; um membro pode sair de uma lista compartilhada por conta própria.',
  // export-list
  'help.guide.export-list.title': 'Exportar uma lista como arquivo',
  'help.guide.export-list.goal': 'Entregue uma lista a alguém em outro TREK, ou leve-a para um app de mapas.',
  'help.guide.export-list.step.1': 'Clique em Exportar no cabeçalho da lista.',
  'help.guide.export-list.step.2':
    'Escolha Lista do TREK para outro TREK, com rótulos e status, ou GPX para OsmAnd, Organic Maps, um Garmin e outros apps que leem waypoints.',
  'help.guide.export-list.result': 'O arquivo é baixado. Qualquer membro de uma lista compartilhada pode exportá-la.',
  'help.guide.export-list.tip.1':
    'Um lugar sem coordenadas não pode ser um waypoint GPX; ele fica de fora e o TREK diz quantos ficaram.',
  'help.guide.export-list.tip.2':
    'Avaliações, membros e fotos enviadas ficam para trás de propósito; pertencem a este TREK, não à lista.',
  // import-file
  'help.guide.import-file.title': 'Importar uma lista de um arquivo',
  'help.guide.import-file.goal':
    'Traga um arquivo de Lista do TREK ou um arquivo GPX, como nova lista ou para uma que você já tem.',
  'help.guide.import-file.step.1':
    'Clique no botão de importar com a seta de upload ao lado de Nova lista na barra de listas.',
  'help.guide.import-file.step.2':
    'Escolha o arquivo. O TREK mostra o que há nele antes de qualquer coisa acontecer: o nome, quantos lugares e rótulos.',
  'help.guide.import-file.step.3':
    'Mantenha Nova lista e mude o nome se quiser, ou escolha Adicionar a uma lista para colocar os lugares numa lista que você pode editar, depois clique em Importar.',
  'help.guide.import-file.result':
    'Você cai na lista com os lugares importados. Adicionar a uma lista apenas adiciona; lugares que já estavam lá mantêm status, notas e rótulos.',
  'help.guide.import-file.tip.1':
    'De um GPX, cada waypoint com nome vira um lugar; tracks são linhas e ficam de fora, e a prévia diz quantos pontos eram.',
  'help.guide.import-file.tip.2':
    'Um arquivo que não é nem Lista do TREK nem GPX é recusado com um motivo; um único lugar ilegível é pulado, não o arquivo inteiro.',
  // edit-list
  'help.guide.edit-list.title': 'Editar ou excluir uma lista',
  'help.guide.edit-list.goal': 'Mude o nome, a cor, a capa, a descrição ou os links de uma lista, ou remova a lista.',
  'help.guide.edit-list.step.1': 'Clique em Editar no cabeçalho da lista. Só o dono vê.',
  'help.guide.edit-list.step.2':
    'Mude o que quiser e clique em Salvar. Excluir lista, embaixo à esquerda, remove a lista com todos os seus lugares, após uma confirmação.',
  'help.guide.edit-list.result': 'O cabeçalho assume a nova cor, capa e descrição na hora.',
  'help.guide.edit-list.tip.1': 'Excluir uma lista não pode ser desfeito. Exporte-a antes se quiser guardar uma cópia.',
  // all-saved
  'help.guide.all-saved.title': 'Buscar em toda a sua biblioteca',
  'help.guide.all-saved.goal': 'Olhe de uma vez todas as listas que são suas.',
  'help.guide.all-saved.step.1':
    'Clique em Todos os salvos na barra de listas. Ele une os lugares de toda lista de que você é dono ou coproprietário.',
  'help.guide.all-saved.step.2':
    'Use a caixa de busca e os filtros como em qualquer lista; Escolher também funciona aqui para copiar para uma viagem.',
  'help.guide.all-saved.result':
    'Uma só visão sobre todos os seus lugares salvos, sem adicionar nem importar, já que não há uma lista única onde colocá-los.',
  'help.guide.all-saved.tip.1': 'Rótulos são por lista, então o filtro de rótulos não é oferecido em Todos os salvos.',

  // ── Screen: journey ───────────────────────────────────────────────────────────────────
  'help.ctx.journey.title': 'Jornada',
  'help.ctx.journey.summary':
    'Jornada é o seu diário de viagem com as fotos em primeiro lugar. Cada jornada está ligada a uma ou mais viagens e cresce dia a dia a partir de entradas com relato, fotos, humor e clima. Esta tela lista suas jornadas; abra uma para escrever.',
  'help.ctx.journey.bullet.1':
    'O banner no topo mostra a jornada em andamento, ou a mais recente, com suas contagens de entradas, fotos e lugares. Continuar escrevendo abre a jornada no dia de hoje.',
  'help.ctx.journey.bullet.2':
    'Abaixo, um cartão por jornada com capa, subtítulo, datas e contagens. Clique num cartão para abri-la.',
  'help.ctx.journey.bullet.3':
    'O último cartão da grade, Criar uma nova jornada, começa uma a partir das suas viagens.',
  // create-journey
  'help.guide.create-journey.title': 'Criar uma jornada',
  'help.guide.create-journey.goal':
    'Começar um diário para uma viagem, com os lugares da viagem já esperando como sugestões.',
  'help.guide.create-journey.step.1': 'Clique em Criar uma nova jornada, o último cartão da grade.',
  'help.guide.create-journey.step.2':
    'Dê um nome a ela e, se quiser, um subtítulo, depois marque as viagens às quais ela pertence. O contador diz quantos lugares vão entrar.',
  'help.guide.create-journey.step.3': 'Clique em Criar jornada.',
  'help.guide.create-journey.result':
    'O diário abre. Cada lugar das viagens vinculadas fica na linha do tempo como sugestão, uma por dia em que ele está, pronta para ser escrita.',
  'help.guide.create-journey.tip.1': 'Mais viagens podem ser vinculadas depois em Configurações da jornada.',
  'help.guide.create-journey.tip.2': 'Uma jornada sem viagens também funciona; você então adiciona as entradas à mão.',
  // open-journey
  'help.guide.open-journey.title': 'Abrir uma jornada',
  'help.guide.open-journey.goal': 'Entrar num diário, e saber onde ele abre.',
  'help.guide.open-journey.step.1':
    'Clique num cartão. Cada um mostra a capa, as datas e quantas entradas, fotos e lugares a jornada tem.',
  'help.guide.open-journey.result':
    'Uma jornada em andamento abre no dia de hoje, ou na última entrada antes de hoje quando ainda não há nada escrito; uma concluída abre no início.',
  'help.guide.open-journey.tip.1':
    'A capa é a primeira foto da jornada, a menos que você defina uma em Configurações da jornada.',
  // continue-writing
  'help.guide.continue-writing.title': 'Continuar a jornada em andamento',
  'help.guide.continue-writing.goal': 'Ir direto para a página de hoje da jornada em que você está.',
  'help.guide.continue-writing.step.1':
    'Clique em Continuar escrevendo no banner do topo. Ele mostra a jornada em andamento, ou a mais recente quando não há nenhuma.',
  'help.guide.continue-writing.result':
    'O diário abre no dia de hoje, ou na última entrada antes de hoje quando ainda não há nada escrito.',
  'help.guide.continue-writing.tip.1':
    'O banner também oferece uma sugestão para uma viagem que ainda não tem jornada; Dispensar esconde essa sugestão.',

  // ── Screen: journey-detail ────────────────────────────────────────────────────────────
  'help.ctx.journey-detail.title': 'Diário',
  'help.ctx.journey-detail.summary':
    'Uma jornada aberta: a linha do tempo à esquerda, dia a dia, e o mapa à direita com cada entrada e os lugares das viagens vinculadas. Tudo o que acrescenta ao diário fica no topo; o cabeçalho tem as contagens, Studio, a chave de sugestões e Configurações da jornada.',
  'help.ctx.journey-detail.bullet.1':
    'Cabeçalho: capa, título e subtítulo, as contagens de dias, lugares, entradas e fotos, e à direita Studio, a chave de sugestões e Configurações da jornada.',
  'help.ctx.journey-detail.bullet.2':
    'Barra de ferramentas: as abas Linha do tempo e Galeria, Buscar nesta viagem e Adicionar entrada.',
  'help.ctx.journey-detail.bullet.3':
    'Linha do tempo: uma seção por dia com um + para adicionar uma entrada naquele dia; cartões de entrada com fotos, humor, clima e relato; sugestões das viagens num estilo mais claro, com Descartar esta sugestão.',
  'help.ctx.journey-detail.bullet.4':
    'Mapa: as entradas como pinos, ligados em ordem de data por uma linha tracejada, os lugares das viagens e as trilhas GPX importadas nessas viagens.',
  'help.ctx.journey-detail.bullet.5':
    'Configurações da jornada: capa, nome e subtítulo, trilhas no mapa, campos do registro, sugestões descartadas, viagens vinculadas, colaboradores, compartilhamento público, arquivar e excluir.',
  'help.ctx.journey-detail.bullet.6':
    'Dois botões redondos flutuam sobre uma linha do tempo longa: voltar ao topo e pular para a última entrada.',
  // add-entry
  'help.guide.add-entry.title': 'Escrever uma entrada',
  'help.guide.add-entry.goal': 'Adicionar o relato de um dia com título, texto, humor e clima.',
  'help.guide.add-entry.step.1':
    'Clique em Adicionar entrada na barra de ferramentas, ou no + do cabeçalho de um dia para começar naquele dia.',
  'help.guide.add-entry.step.2':
    'Dê um nome ao momento e escreva o relato. A barra acima do texto adiciona negrito, itálico, títulos, citações, links e listas em Markdown.',
  'help.guide.add-entry.step.3':
    'Escolha um humor e o clima, confira a data e fixe uma localização se quiser: busque um lugar ou use sua posição atual.',
  'help.guide.add-entry.step.4': 'Clique em Salvar.',
  'help.guide.add-entry.result':
    'A entrada aparece no seu dia na linha do tempo e como pino no mapa. Suas contagens são atualizadas no cabeçalho.',
  'help.guide.add-entry.tip.1': 'Escrever numa sugestão é o mesmo editor, com o lugar já definido.',
  'help.guide.add-entry.tip.2':
    'As tags no rodapé são texto livre, joia escondida ou melhor refeição, e a busca as encontra.',
  // entry-photos
  'help.guide.entry-photos.title': 'Adicionar fotos e vídeos a uma entrada',
  'help.guide.entry-photos.goal': 'Colocar imagens num dia; a primeira vira a capa da entrada.',
  'help.guide.entry-photos.step.1': 'Abra o menu de uma entrada com o ⋯ no cartão dela e escolha Editar.',
  'help.guide.entry-photos.step.2':
    'Clique em Enviar fotos e escolha os arquivos. Da galeria pega imagens que já estão na galeria da jornada; External photos busca aquele dia numa biblioteca Immich ou Synology conectada.',
  'help.guide.entry-photos.step.3':
    'Passe o mouse sobre uma imagem para Tornar 1º e escolher a capa, depois clique em Salvar.',
  'help.guide.entry-photos.result': 'As fotos aparecem no cartão e na galeria; a primeira é a miniatura em todo lugar.',
  'help.guide.entry-photos.tip.1':
    'Vídeos entram numa entrada do mesmo jeito: mp4, m4v, webm ou mov até 500 MB, guardados como foram enviados.',
  'help.guide.entry-photos.tip.2':
    'Arquivos HEIC de um iPhone são convertidos para JPEG no envio, o que remove os metadados de GPS e da câmera.',
  // suggestions
  'help.guide.suggestions.title': 'Usar ou descartar as sugestões',
  'help.guide.suggestions.goal':
    'Transformar os lugares das suas viagens em entradas, e tirar do caminho aqueles sobre os quais você não vai escrever.',
  'help.guide.suggestions.step.1':
    'Uma sugestão é um cartão mais claro com o nome do lugar em itálico. Clique nele para abrir o editor com o lugar e o dia já definidos.',
  'help.guide.suggestions.step.2':
    'Clique em Descartar esta sugestão num cartão que você não vai usar. Ele sai da linha do tempo sem ser excluído, e a sincronização da viagem não o oferece de novo.',
  'help.guide.suggestions.step.3':
    'Mudou de ideia? Configurações da jornada mostra quantas estão descartadas, e Trazer de volta as sugestões descartadas devolve todas.',
  'help.guide.suggestions.result':
    'A linha do tempo contém só o que você pretende escrever; a chave no cabeçalho esconde todas as sugestões de uma vez enquanto você lê.',
  'help.guide.suggestions.tip.1': 'Um lugar mantido por dois dias gera uma sugestão em cada um deles.',
  'help.guide.suggestions.tip.2': 'Sugestões nunca contam nas estatísticas; só entradas escritas contam.',
  // add-on-day
  'help.guide.add-on-day.title': 'Adicionar uma entrada num dia anterior',
  'help.guide.add-on-day.goal': 'Escrever sobre um dia que já passou sem corrigir a data depois.',
  'help.guide.add-on-day.step.1': 'Clique no + do cabeçalho daquele dia.',
  'help.guide.add-on-day.step.2': 'O editor abre com aquela data definida. Escreva e Salvar como sempre.',
  'help.guide.add-on-day.result': 'A entrada cai direto no dia certo.',
  'help.guide.add-on-day.tip.1': 'Dentro de um dia, as setas no menu de uma entrada a movem para antes ou para depois.',
  // pros-cons
  'help.guide.pros-cons.title': 'Adicionar um veredito',
  'help.guide.pros-cons.goal': 'Resumir um dia com o que foi ótimo e o que não foi.',
  'help.guide.pros-cons.step.1':
    'No editor, encontre Prós e contras abaixo do relato. Digite um ponto em Prós ou Contras e use Adicionar outro para o próximo.',
  'help.guide.pros-cons.step.2': 'Salvar. O veredito aparece no cartão como duas listas curtas.',
  'help.guide.pros-cons.result': 'Joinha para cima e joinha para baixo num relance, abaixo do relato.',
  'help.guide.pros-cons.tip.1':
    'Uma jornada que não usa vereditos pode desligar a seção em Campos do registro, em Configurações da jornada.',
  // search-journey
  'help.guide.search-journey.title': 'Encontrar algo num diário longo',
  'help.guide.search-journey.goal': 'Chegar à entrada que você quer sem rolar por semanas.',
  'help.guide.search-journey.step.1':
    'Digite em Buscar nesta viagem na barra de ferramentas. A linha do tempo filtra enquanto você digita, em títulos, relatos, lugares e tags. Acentos e maiúsculas não importam.',
  'help.guide.search-journey.step.2':
    'A chave de sugestões no cabeçalho esconde os cartões não escritos enquanto você lê. Quando a linha do tempo fica longa, dois botões redondos flutuam acima da borda inferior: voltar ao topo e pular para a última entrada.',
  'help.guide.search-journey.result': 'Só as entradas correspondentes ficam; limpe a caixa para ver tudo de novo.',
  'help.guide.search-journey.tip.1':
    'Uma jornada em andamento abre no dia de hoje, então a página atual geralmente já está à vista.',
  'help.guide.search-journey.tip.2': 'Tags também contam: buscar joia escondida encontra toda entrada com essa tag.',
  // gallery-map
  'help.guide.gallery-map.title': 'Navegar pela galeria e pelo mapa',
  'help.guide.gallery-map.goal': 'Ver a jornada inteira como imagens, e como lugares no mapa.',
  'help.guide.gallery-map.step.1':
    'Mude para Galeria na barra de ferramentas: cada foto de cada entrada, mais as imagens enviadas diretamente para a galeria. Clique numa delas para o lightbox.',
  'help.guide.gallery-map.step.2':
    'O mapa à direita mostra as entradas como pinos em ordem de data, os lugares das viagens vinculadas e qualquer trilha GPX importada nessas viagens, na cor que ela tem no planejador.',
  'help.guide.gallery-map.result':
    'Passe o mouse sobre uma trilha para ver o nome. A linha tracejada entre as entradas é desenhada pelo TREK; uma trilha é a rota que você realmente gravou.',
  'help.guide.gallery-map.tip.1': 'As trilhas podem ser desligadas para uma jornada em Configurações da jornada.',
  'help.guide.gallery-map.tip.2':
    'Fotos da galeria com localização aparecem também no mapa público, quando Galeria e Mapa estão ambos compartilhados.',
  // entry-fields
  'help.guide.entry-fields.title': 'Desligar campos do registro',
  'help.guide.entry-fields.goal': 'Limitar o editor ao que esta jornada usa.',
  'help.guide.entry-fields.step.1': 'Abra Configurações da jornada pelo cabeçalho.',
  'help.guide.entry-fields.step.2': 'Em Campos do registro, desligue Humor, Clima ou Prós e contras.',
  'help.guide.entry-fields.result':
    'O editor para de pedir esses campos. Nada do que foi escrito se perde: religar um campo traz os valores guardados de volta à vista, e uma jornada compartilhada esconde os mesmos campos.',
  'help.guide.entry-fields.tip.1':
    'As chaves são por jornada, então uma viagem de trabalho e umas férias podem ser diferentes.',
  // link-trip
  'help.guide.link-trip.title': 'Vincular outra viagem',
  'help.guide.link-trip.goal': 'Trazer os lugares de uma segunda viagem para o diário como sugestões.',
  'help.guide.link-trip.step.1': 'Abra Configurações da jornada pelo cabeçalho.',
  'help.guide.link-trip.step.2': 'Abaixo das viagens vinculadas, clique em Adicionar viagem.',
  'help.guide.link-trip.step.3': 'Escolha a viagem.',
  'help.guide.link-trip.result':
    'Os lugares dela chegam à linha do tempo como sugestões nos seus dias, e as trilhas GPX dela entram no mapa.',
  'help.guide.link-trip.tip.1':
    'O × ao lado de uma viagem vinculada desfaz o vínculo; as entradas que você escreveu ficam.',
  'help.guide.link-trip.tip.2': 'Entradas de um dia contam só uma vez, por mais viagens que cubram aquele dia.',
  // share-public
  'help.guide.share-public.title': 'Compartilhar a jornada publicamente',
  'help.guide.share-public.goal': 'Dar a pessoas sem conta no TREK um link somente leitura.',
  'help.guide.share-public.step.1': 'Abra Configurações da jornada e encontre Compartilhamento público.',
  'help.guide.share-public.step.2': 'Clique em Criar link de compartilhamento.',
  'help.guide.share-public.step.3':
    'Escolha o que os visitantes veem: Linha do tempo, Galeria e Mapa são chaves separadas. Copiar coloca o link na sua área de transferência.',
  'help.guide.share-public.result':
    'Quem tiver o link vê as seções ativadas e nada mais; campos que você desligou em Campos do registro ficam escondidos ali também.',
  'help.guide.share-public.tip.1':
    'As fotos aparecem no mapa público só quando Galeria e Mapa estão ambos ligados; com Mapa desligado, as coordenadas delas são removidas antes de saírem do servidor.',
  'help.guide.share-public.tip.2': 'Exclua o link no mesmo lugar para encerrar o compartilhamento.',
  // contributors
  'help.guide.contributors.title': 'Escrever juntos',
  'help.guide.contributors.goal': 'Deixar um companheiro de viagem adicionar as próprias entradas e fotos.',
  'help.guide.contributors.step.1': 'Abra Configurações da jornada e role até os colaboradores.',
  'help.guide.contributors.step.2': 'Clique em Convidar colaborador e busque o usuário por nome ou e-mail.',
  'help.guide.contributors.step.3': 'Escolha um papel e confirme.',
  'help.guide.contributors.result':
    'A jornada aparece na lista dele e as entradas dele levam o nome dele. Remova um colaborador com o × ao lado.',
  'help.guide.contributors.tip.1':
    'Colaboradores são para pessoas neste TREK. Para todos os outros existe o link público.',
  // studio
  'help.guide.studio.title': 'Diagramar a jornada como um álbum de fotos',
  'help.guide.studio.goal': 'Transformar o diário em páginas para impressão.',
  'help.guide.studio.step.1': 'Clique em Studio no cabeçalho. O designer abre por cima da jornada.',
  'help.guide.studio.step.2':
    'O nome da jornada à esquerda da barra superior é o caminho de volta; ele deixa você onde estava.',
  'help.guide.studio.result':
    'A faixa de páginas à esquerda, a página dupla na bancada, as propriedades à direita. Auto layout monta o álbum a partir das suas entradas; Export gera um PDF pronto para impressão.',
  'help.guide.studio.tip.1':
    'O Studio precisa de uma janela com pelo menos 1024 px de largura e não é oferecido no celular.',
  'help.guide.studio.tip.2':
    'O álbum herda o acesso da jornada: quem pode ler a jornada pode abri-lo, quem pode editar pode salvar.',
  // archive-journey
  'help.guide.archive-journey.title': 'Arquivar ou excluir uma jornada',
  'help.guide.archive-journey.goal': 'Encerrar uma jornada concluída, ou remover uma de vez.',
  'help.guide.archive-journey.step.1': 'Abra Configurações da jornada.',
  'help.guide.archive-journey.step.2':
    'Lá embaixo, Arquivar Jornada a encerra e a marca como arquivada; Restaurar Jornada a traz de volta. Excluir a remove com todas as entradas e fotos, após uma confirmação.',
  'help.guide.archive-journey.result':
    'Uma jornada arquivada continua legível e compartilhável; ela só não abre mais no dia de hoje.',
  'help.guide.archive-journey.tip.1':
    'Excluir não pode ser desfeito, e não mexe nas viagens às quais a jornada estava vinculada.',
  'help.guide.archive-journey.tip.2': 'Capa, nome e subtítulo ficam no mesmo diálogo, no topo.',

  // ── Screen: journey-studio ────────────────────────────────────────────────────────────
  'help.ctx.journey-studio.title': 'Studio',
  'help.ctx.journey-studio.summary':
    'O TREK Studio diagrama uma jornada como um livro de fotos para impressão. Ele abre por cima do diário: a lista de páginas e o conteúdo à esquerda, a página dupla em que você está trabalhando no centro, as propriedades dela à direita. Auto layout monta um primeiro rascunho a partir das suas entradas; tudo depois disso é seu para mover, recortar e restilizar, com desfazer para cada passo.',
  'help.ctx.journey-studio.bullet.1':
    'Barra superior: Back to the journey, Book view, Undo e Redo, Page format, Auto layout e Export. A marca Salvo ao lado do título diz quando o livro está armazenado.',
  'help.ctx.journey-studio.bullet.2':
    'Coluna à esquerda com cinco seções: Pages, Content (as fotos e entradas da jornada), Elements (texto, formas, linhas, grades, molduras, ícones), Viagem (mapas, países, bandeiras e marcadores montados a partir da jornada) e Layouts.',
  'help.ctx.journey-studio.bullet.3':
    'Bancada: a página dupla atual com sangria e margens de segurança, a barra de zoom embaixo, Fit to view e Baixar esta página dupla à direita.',
  'help.ctx.journey-studio.bullet.4':
    'Properties à direita: posição e tamanho, recorte e ponto focal, preencher ou ajustar, look, cantos, moldura, ordem de empilhamento e bloqueio do que estiver selecionado; números de página e o documento quando nada estiver.',
  'help.ctx.journey-studio.bullet.5':
    'O livro tem a forma de um encadernado: capa, uma primeira página avulsa, as páginas duplas, uma última página avulsa e a contracapa. Os números de página contam a partir da primeira página e são impressos como aparecem.',
  'help.ctx.journey-studio.bullet.6':
    'Várias pessoas podem projetar ao mesmo tempo: cada uma vê os ponteiros das outras com seus nomes, e salvar sobre uma versão que outra pessoa alterou volta como um conflito em vez de sobrescrever o trabalho dela.',
  // studio-auto-layout
  'help.guide.studio-auto-layout.title': 'Montar o livro automaticamente',
  'help.guide.studio-auto-layout.goal':
    'Consiga com um clique um primeiro rascunho completo a partir das entradas e fotos do diário.',
  'help.guide.studio-auto-layout.step.1': 'Clique em Auto layout na barra superior.',
  'help.guide.studio-auto-layout.step.2':
    'Escolha O livro inteiro: ele substitui todas as páginas, mantendo seu título e a configuração de página. Esta página refaz só a que está na tela, e é oferecida numa página dupla que veio de uma entrada.',
  'help.guide.studio-auto-layout.step.3':
    'Percorra a lista de páginas. Undo desfaz o layout inteiro se você preferia o que tinha.',
  'help.guide.studio-auto-layout.result':
    'Uma página dupla por entrada, em ordem, com fotos, título e história posicionados para você. Cada elemento continua seguindo sua entrada até você editá-lo.',
  'help.guide.studio-auto-layout.tip.1': 'As duas opções são passos normais de desfazer, então experimente à vontade.',
  'help.guide.studio-auto-layout.tip.2':
    'Um elemento que o Auto layout vinculou a uma entrada acompanha as edições dessa entrada até você mexer nele em Properties; isso rompe o vínculo.',
  // studio-pages
  'help.guide.studio-pages.title': 'Adicionar, mover e remover páginas duplas',
  'help.guide.studio-pages.goal': 'Dê forma ao livro página por página.',
  'help.guide.studio-pages.step.1':
    'Abra Pages na coluna. As miniaturas são o livro em ordem: capa, primeira página, páginas duplas, última página, contracapa.',
  'help.guide.studio-pages.step.2':
    'Adicionar página, embaixo, coloca uma nova antes da última página; o + entre duas miniaturas insere uma bem ali.',
  'help.guide.studio-pages.step.3':
    'Passe o mouse sobre uma miniatura para ver as ações: Mover para antes, Mover para depois, Duplicar página e Excluir página. Clique numa miniatura para abrir essa página dupla na bancada.',
  'help.guide.studio-pages.result':
    'A capa, a primeira e a última página e a contracapa ficam onde estão; páginas duplas novas sempre caem entre elas.',
  'help.guide.studio-pages.tip.1':
    'Book view na barra superior mostra o livro inteiro em folhas, do jeito que será encadernado.',
  'help.guide.studio-pages.tip.2':
    'Os números de página são ligados em Documento, em Properties, sem nada selecionado.',
  // studio-layouts
  'help.guide.studio-layouts.title': 'Aplicar um layout a uma página dupla',
  'help.guide.studio-layouts.goal': 'Dê a uma página dupla um arranjo pronto de molduras de foto e texto.',
  'help.guide.studio-layouts.step.1':
    'Abra Layouts na coluna. Treze layouts de página dupla e um conjunto à parte para a capa, a contracapa e as páginas avulsas.',
  'help.guide.studio-layouts.step.2':
    'Clique em um. A página dupla na bancada assume as molduras dele; fotos e texto que você já tinha são despejados nelas.',
  'help.guide.studio-layouts.result':
    'Molduras vazias esperam conteúdo: arraste uma foto de Content para uma delas, ou use Add to this page.',
  'help.guide.studio-layouts.tip.1': 'Um layout é um passo de desfazer como qualquer outro.',
  // studio-content
  'help.guide.studio-content.title': 'Colocar fotos e entradas numa página',
  'help.guide.studio-content.goal': 'Traga o material da própria jornada para a página dupla.',
  'help.guide.studio-content.step.1':
    'Abra Content na coluna. Photos lista cada imagem da jornada; Entries lista as entradas com seu texto.',
  'help.guide.studio-content.step.2':
    'Arraste uma foto para a página dupla, ou para uma moldura vazia, ou clique em Add to this page abaixo dela. Enviar fotos adiciona imagens que ainda não estão na jornada.',
  'help.guide.studio-content.step.3':
    'Sob uma entrada, Title, Story e Place colocam esse texto na página como elemento de texto; Data e as coordenadas vêm como marcadores, e as fotos da entrada ficam listadas ali mesmo.',
  'help.guide.studio-content.result':
    'Uma foto solta vira um elemento de foto; o texto continua seguindo a entrada até você editá-lo.',
  'help.guide.studio-content.tip.1': 'A caixa de busca no topo de Content filtra as duas listas.',
  'help.guide.studio-content.tip.2':
    'Soltar um arquivo da sua área de trabalho na bancada envia e posiciona de uma vez.',
  // studio-elements
  'help.guide.studio-elements.title': 'Adicionar texto, formas e ícones',
  'help.guide.studio-elements.goal': 'Decore uma página dupla além de fotos e histórias.',
  'help.guide.studio-elements.step.1': 'Abra Elements na coluna.',
  'help.guide.studio-elements.step.2':
    'Clique num estilo de texto para um título ou uma legenda, uma forma, uma linha, uma grade, uma moldura vazia com um estilo de moldura, ou um ícone da biblioteca pesquisável. Cada um cai no centro da página dupla, pronto para mover.',
  'help.guide.studio-elements.result':
    'Dê um clique duplo num elemento de texto para digitar nele; Properties guarda fonte, peso, tamanho, espaçamento e alinhamento.',
  'help.guide.studio-elements.tip.1': 'Molduras são espaços de foto vazios: solte uma imagem nelas depois.',
  // studio-travel
  'help.guide.studio-travel.title': 'Adicionar um mapa, bandeiras e números',
  'help.guide.studio-travel.goal': 'Transforme a própria jornada em números na página.',
  'help.guide.studio-travel.step.1': 'Abra Viagem na coluna.',
  'help.guide.studio-travel.step.2':
    'Escolha o que adicionar: um mapa do trajeto das entradas, contornos de países, uma lista ou grade de países, bandeiras, um marcador de data, dia ou distância, ou um resumo da viagem inteira. Cada um é montado a partir dos dados da jornada e se atualiza com eles.',
  'help.guide.studio-travel.result':
    'O elemento aparece na página dupla; Properties ajusta o estilo dele, e no mapa a área.',
  'help.guide.studio-travel.tip.1':
    'Marcadores seguem a entrada de onde a página dupla veio, então um marcador de data numa página dupla diagramada automaticamente já mostra aquele dia.',
  // studio-properties
  'help.guide.studio-properties.title': 'Editar o que você selecionou',
  'help.guide.studio-properties.goal': 'Mova, recorte, estilize e empilhe um elemento com o inspetor.',
  'help.guide.studio-properties.step.1':
    'Clique num elemento na página dupla. Aparecem alças para tamanho e rotação; arraste-o para mover.',
  'help.guide.studio-properties.step.2':
    'Properties à direita acompanha a seleção: posição e tamanho, Crop com o ponto focal que decide o que fica na moldura, Fill ou Fit, os filtros de Look, o raio em Corner, o estilo em Moldura, a ordem de empilhamento e Lock.',
  'help.guide.studio-properties.step.3':
    'Duplicar e Delete ficam no topo do inspetor; Undo na barra superior reverte qualquer um deles.',
  'help.guide.studio-properties.result':
    'Um elemento bloqueado não pode mais ser agarrado na página, o que mantém um layout pronto a salvo enquanto você trabalha ao redor.',
  'help.guide.studio-properties.tip.1': 'Shift+clique seleciona vários elementos; o inspetor então edita todos juntos.',
  'help.guide.studio-properties.tip.2':
    'Editar um elemento que o Auto layout posicionou rompe o vínculo dele com a entrada; ele para de seguir mudanças posteriores nessa entrada.',
  // studio-format
  'help.guide.studio-format.title': 'Escolher o formato de página',
  'help.guide.studio-format.goal': 'Defina o tamanho em que o livro será impresso, antes que o layout dependa dele.',
  'help.guide.studio-format.step.1': 'Clique em Page format na barra superior.',
  'help.guide.studio-format.step.2':
    'Escolha Square 21 × 21 cm, Square 30 × 30 cm, A4 ou A5 landscape ou portrait, ou informe largura e altura próprias em milímetros. Sangria e Segurança ficam logo abaixo.',
  'help.guide.studio-format.result':
    'Cada página dupla é desenhada nesse tamanho, com 3 mm de sangria e 5 mm de margem de segurança por padrão.',
  'help.guide.studio-format.tip.1':
    'Mude o formato primeiro, depois rode o Auto layout; o layout é montado para o tamanho que ele encontra.',
  'help.guide.studio-format.tip.2': 'Pergunte à sua gráfica os valores de sangria e segurança dela e informe esses.',
  // studio-export
  'help.guide.studio-export.title': 'Exportar o livro como PDF',
  'help.guide.studio-export.goal': 'Consiga um arquivo pronto para impressão, ou um para ler na tela.',
  'help.guide.studio-export.step.1': 'Clique em Export na barra superior.',
  'help.guide.studio-export.step.2':
    'Escolha Páginas avulsas, uma página por folha em ordem de leitura, que é o que uma gráfica quer, ou Páginas duplas, duas páginas por vez do jeito que o livro abre. Marcas de corte acrescenta a sangria em cada borda e marca onde cortar.',
  'help.guide.studio-export.step.3':
    'Clique em Visualizar impressão. Seu navegador abre as páginas e Salvar como PDF as transforma no arquivo.',
  'help.guide.studio-export.result':
    'Um PDF com tantas folhas quanto o diálogo anunciou, no formato de página que você definiu.',
  'help.guide.studio-export.tip.1': 'Gerar o PDF é só no desktop, como o próprio Studio.',
  'help.guide.studio-export.tip.2':
    'Para uma prova, exporte Páginas duplas sem marcas de corte; para a gráfica, Páginas avulsas com elas.',
  // studio-spread-file
  'help.guide.studio-spread-file.title': 'Reutilizar uma página dupla em outro livro',
  'help.guide.studio-spread-file.goal': 'Leve um design de que você gosta do livro de uma jornada para outro.',
  'help.guide.studio-spread-file.step.1':
    'Com a página dupla na bancada, clique em Baixar esta página dupla na ponta direita da barra de zoom. O arquivo guarda o design, não as fotografias.',
  'help.guide.studio-spread-file.step.2':
    'No outro livro, abra Pages e clique em Importar ao lado de Adicionar página, depois escolha o arquivo.',
  'help.guide.studio-spread-file.result':
    'A página dupla chega com suas molduras e estilos de texto; solte as fotos da nova jornada nas molduras.',
  'help.guide.studio-spread-file.tip.1': 'Um arquivo que não é um design de página dupla é recusado com um motivo.',

  // ── Screen: settings (all tabs) ───────────────────────────────────────────────────────
  'help.ctx.settings.title': 'Configurações',
  'help.ctx.settings.summary':
    'Suas configurações pessoais, uma aba por assunto na barra lateral à esquerda. A maioria das chaves vale no momento em que você as vira; um formulário com um botão Salvar embaixo espera por ele. Nada aqui muda o TREK de mais ninguém.',
  'help.ctx.settings.bullet.1':
    'Barra lateral à esquerda: Exibição, Appearance, Mapa, Notificações, Integrações, Offline e Conta. Plugins aparece assim que um estiver instalado, Sobre onde quer que o admin não o tenha tirado.',
  'help.ctx.settings.bullet.2':
    'Exibição é idioma, unidades, moeda e com o que o app abre; Appearance é tema, cores, tamanho do texto e os widgets do painel.',
  'help.ctx.settings.bullet.3':
    'Mapa escolhe o renderizador e seu estilo; Notificações os canais que chegam até você; Integrações bibliotecas de fotos, chaves de API e MCP; Offline o que o app guarda neste dispositivo.',
  'help.ctx.settings.bullet.4':
    'Conta guarda seu perfil, senha, autenticação em duas etapas, passkeys e a exclusão da sua conta.',
  'help.ctx.settings-display.title': 'Exibição',
  'help.ctx.settings-display.summary':
    'Idioma, unidades e moeda, como o mapa e as reservas se comportam, e com o que o TREK abre. Cada mudança aqui vale na hora.',
  'help.ctx.settings-display.bullet.1':
    'Language & region: o idioma da interface, o formato de hora, o primeiro dia da semana, a moeda de exibição, e as unidades de distância e temperatura.',
  'help.ctx.settings-display.bullet.2':
    'Travel & map: rotas de reserva sempre no mapa, a pílula Explorar lugares, otimização de rota a partir da sua hospedagem, códigos de reserva ocultos e rotas de reserva com rótulo.',
  'help.ctx.settings-display.bullet.3':
    'Inicialização: se o TREK abre no painel ou na viagem ativa, e qual aba de uma viagem aparece primeiro.',
  'help.ctx.settings-appearance.title': 'Appearance',
  'help.ctx.settings-appearance.summary':
    'Como o TREK aparece nesta conta: claro ou escuro, a cor de destaque, vidro e movimento, tamanho do texto, e quais widgets o painel mostra. Tudo vale ao vivo, em cada dispositivo em que você entra.',
  'help.ctx.settings-appearance.bullet.1':
    'Theme: Claro, Escuro ou Automático, e o Color scheme com um Custom accent só seu.',
  'help.ctx.settings-appearance.bullet.2':
    'Readability: Transparency, Reduce motion, Density e Text size, com tamanhos avançados por nível.',
  'help.ctx.settings-appearance.bullet.3':
    'Dashboard widgets: uma chave por widget, separadamente para Desktop e Mobile.',
  'help.ctx.settings-appearance.bullet.4': 'Reset to defaults embaixo põe tudo de volta no lugar.',
  'help.ctx.settings-map.title': 'Mapa',
  'help.ctx.settings-map.summary':
    'Qual motor desenha os mapas e em que estilo. Leaflet é o mapa raster clássico, MapLibre desenha blocos vetoriais sem nenhum token, Mapbox adiciona prédios 3D e terreno com o seu próprio token.',
  'help.ctx.settings-map.bullet.1':
    'Provedor de mapa: Leaflet, MapLibre ou Mapbox, cada um com uma linha sobre o que precisa.',
  'help.ctx.settings-map.bullet.2':
    'Estilo do mapa e Modelo de mapa: o visual dos blocos, mais o token ou a chave que um provedor pede.',
  'help.ctx.settings-map.bullet.3':
    'Modo alta qualidade para antialiasing e a projeção de globo; Salvar mapa grava a escolha.',
  'help.ctx.settings-notifications.title': 'Notificações',
  'help.ctx.settings-notifications.summary':
    'Onde o TREK alcança você fora do app: notificações push neste dispositivo, um tópico ntfy, um webhook ou um canal que um plugin fornece. Abaixo dos canais, uma linha por evento decide o que vai para onde.',
  'help.ctx.settings-notifications.bullet.1':
    'ntfy: o tópico, um servidor próprio opcional e um token de acesso opcional, com Testar para enviar um na hora.',
  'help.ctx.settings-notifications.bullet.2': 'Webhook: uma URL que recebe cada evento como JSON, com Testar.',
  'help.ctx.settings-notifications.bullet.3':
    'Notificações push neste dispositivo: Ativar neste dispositivo vale só para o navegador que você está usando, então repita em cada celular ou computador. Enviar teste chega a todos eles.',
  'help.ctx.settings-notifications.bullet.4':
    'As linhas de preferências: por evento, qual canal está ligado. Canais de plugin mostram Configurar até serem configurados.',
  'help.ctx.settings-integrations.title': 'Integrações',
  'help.ctx.settings-integrations.summary':
    'Tudo que se conecta ao TREK de fora: bibliotecas de fotos para a jornada, chaves de API para scripts, e o endpoint MCP com seus tokens e clientes OAuth para assistentes de IA.',
  'help.ctx.settings-integrations.bullet.1':
    'Provedores de fotos: Immich e Synology Photos, cada um com sua URL e chave, Testar conexão e Salvar.',
  'help.ctx.settings-integrations.bullet.2':
    'Chaves de API: chaves pessoais para scripts e outras ferramentas que chamam a API do TREK em seu nome.',
  'help.ctx.settings-integrations.bullet.3':
    'Configuração MCP: o endpoint, uma configuração de cliente pronta para copiar, e os tokens de API.',
  'help.ctx.settings-integrations.bullet.4':
    'Clientes OAuth 2.1: apps que fazem login pelo TREK, com URIs de redirecionamento, escopos permitidos, clientes de máquina e as sessões ativas.',
  'help.ctx.settings-offline.title': 'Offline',
  'help.ctx.settings-offline.summary':
    'O que o TREK guarda neste dispositivo para uma viagem ainda abrir sem conexão, e o que acontece quando uma mudança feita offline colide com uma feita em outro lugar.',
  'help.ctx.settings-offline.bullet.1':
    'Modo offline: Forçar modo offline faz o app se comportar como se a rede tivesse sumido, para testar ou numa conexão com franquia.',
  'help.ctx.settings-offline.bullet.2':
    'Preparar para uso offline: Baixar para uso offline busca agora suas viagens e os blocos de mapa delas.',
  'help.ctx.settings-offline.bullet.3':
    'O que armazenar offline: blocos do mapa ligados ou não, e uma chave por viagem.',
  'help.ctx.settings-offline.bullet.4':
    'Conflitos de sincronização e Cache offline: a estratégia para colisões, a contagem de mudanças pendentes e com falha, Sincronizar agora e Limpar cache.',
  'help.ctx.settings-account.title': 'Conta',
  'help.ctx.settings-account.summary':
    'Quem você é neste TREK e como entra: perfil e avatar, senha, autenticação em duas etapas, passkeys, e lá embaixo a exclusão da conta.',
  'help.ctx.settings-account.bullet.1': 'Perfil: nome de usuário, e-mail e avatar, salvos com Salvar perfil.',
  'help.ctx.settings-account.bullet.2': 'Alterar senha: senha atual, senha nova duas vezes, Atualizar senha.',
  'help.ctx.settings-account.bullet.3':
    'Autenticação em duas etapas (2FA) com um app autenticador e códigos de backup; Passkeys para entrar sem senha.',
  'help.ctx.settings-account.bullet.4':
    'Excluir conta embaixo, atrás de uma confirmação. O último admin não pode excluir a si mesmo.',
  // language-region
  'help.guide.language-region.title': 'Definir idioma, unidades e moeda',
  'help.guide.language-region.goal': 'Faça o TREK falar sua língua e contar do seu jeito.',
  'help.guide.language-region.step.1':
    'Escolha o idioma da interface em Language & region. O TREK muda na hora, em cada dispositivo em que você entra.',
  'help.guide.language-region.step.2':
    'Abaixo, escolha o formato de hora, o dia em que a semana começa em todos os seletores de data, a moeda de exibição, e as unidades de distância e temperatura.',
  'help.guide.language-region.result':
    'Datas, distâncias e dinheiro aparecem do jeito que você espera; a moeda própria de uma viagem continua ao lado dos valores convertidos.',
  'help.guide.language-region.tip.1':
    'A moeda de exibição é para totais entre viagens; cada viagem mantém a moeda que você deu a ela.',
  'help.guide.language-region.tip.2': 'O idioma também define os nomes de dias e meses no Vacay e na jornada.',
  // travel-map-prefs
  'help.guide.travel-map-prefs.title': 'Ajustar como o mapa e as reservas se comportam',
  'help.guide.travel-map-prefs.goal': 'Decida o que o mapa da viagem mostra por padrão.',
  'help.guide.travel-map-prefs.step.1':
    'Em Travel & map, Sempre mostrar rotas de reserva mantém voos e trens no mapa mesmo quando o dia deles não está aberto; Explorar lugares no mapa mostra a pílula para encontrar lugares; Otimizar rota a partir da hospedagem começa a rota onde você dorme.',
  'help.guide.travel-map-prefs.step.2':
    'Ocultar códigos de reserva esconde os números de confirmação até você passar o mouse; Rótulos das rotas de reservas escreve o nome da reserva ao longo da rota dela.',
  'help.guide.travel-map-prefs.result':
    'O mapa da viagem segue isso em todas as viagens, até você virar as chaves de volta.',
  'help.guide.travel-map-prefs.tip.1':
    'Isso é por conta, não por viagem. Cada membro de uma viagem compartilhada vê as próprias escolhas.',
  // startup
  'help.guide.startup.title': 'Escolher com o que o TREK abre',
  'help.guide.startup.goal': 'Chegue onde você mais trabalha, não no painel toda vez.',
  'help.guide.startup.step.1': 'Em Inicialização, defina Página inicial como Painel ou Viagem ativa.',
  'help.guide.startup.step.2': 'Aba inicial escolhe qual aba de uma viagem aparece primeiro quando você abre uma.',
  'help.guide.startup.result': 'O próximo login e o próximo toque no logo vão direto para lá.',
  'help.guide.startup.tip.1': 'Viagem ativa é a viagem em andamento hoje, ou a próxima quando não há nenhuma.',
  // theme-scheme
  'help.guide.theme-scheme.title': 'Definir o tema e a cor de destaque',
  'help.guide.theme-scheme.goal': 'Deixe o TREK claro, escuro ou igual ao seu dispositivo, na cor que você gosta.',
  'help.guide.theme-scheme.step.1':
    'Em Theme, escolha Claro, Escuro ou Automático. Automático segue o seu dispositivo.',
  'help.guide.theme-scheme.step.2':
    'Escolha um Color scheme: Default, High contrast, Indigo, Teal, Rose, Amber, Violet ou Custom.',
  'help.guide.theme-scheme.step.3':
    'Com Custom, escolha um destaque entre os predefinidos ou informe o seu. Uma checagem de contraste ao lado diz se o texto continua legível sobre ele.',
  'help.guide.theme-scheme.result':
    'Botões, links e realces assumem o destaque em todo lugar, em cada dispositivo em que você entra.',
  'help.guide.theme-scheme.tip.1':
    'A barra de navegação também tem uma chave rápida claro ou escuro; ela define o mesmo tema.',
  'help.guide.theme-scheme.tip.2': 'High contrast é o esquema para escolher quando o padrão parece suave demais.',
  // readability
  'help.guide.readability.title': 'Ajustar legibilidade e tamanho do texto',
  'help.guide.readability.goal': 'Menos vidro, menos movimento, mais espaço ou letras maiores.',
  'help.guide.readability.step.1':
    'Em Readability, Transparency troca os painéis de vidro por superfícies sólidas, Reduce motion reduz as animações ao mínimo, e Density escolhe Comfortable ou Compact.',
  'help.guide.readability.step.2':
    'Text size escala Everything de uma vez; Advanced text sizes deixa títulos, subtítulos, corpo e legendas diferirem.',
  'help.guide.readability.result': 'O app inteiro acompanha na hora, incluindo os painéis do mapa e a jornada.',
  'help.guide.readability.tip.1': 'Reduce motion também segue a configuração do seu sistema quando você não mexe nela.',
  'help.guide.readability.tip.2':
    'O tamanho do texto é aplicado pelos níveis tipográficos, então nada é cortado; um tamanho que não cabe mais quebra a linha.',
  // dashboard-widgets
  'help.guide.dashboard-widgets.title': 'Escolher os widgets do painel',
  'help.guide.dashboard-widgets.goal': 'Mostre só os widgets que você usa, separadamente no desktop e no celular.',
  'help.guide.dashboard-widgets.step.1':
    'Em Dashboard widgets, ligue ou desligue cada widget para Desktop e para Mobile: a barra lateral direita como um todo, moeda, coleções, fusos horários, próximas reservas, países do Atlas e os números de viagem.',
  'help.guide.dashboard-widgets.step.2': 'Reset to defaults embaixo devolve a aba inteira ao jeito que veio.',
  'help.guide.dashboard-widgets.result':
    'O painel se reorganiza na hora; com a barra lateral direita desligada, ele se centraliza.',
  'help.guide.dashboard-widgets.tip.1': 'Widgets de um addon só aparecem enquanto o admin tiver esse addon ligado.',
  'help.guide.dashboard-widgets.tip.2':
    'O próprio painel lembra sua visão em grade ou lista e a ordenação por dispositivo.',
  // map-provider
  'help.guide.map-provider.title': 'Escolher o motor e o estilo do mapa',
  'help.guide.map-provider.goal': 'Alterne entre o mapa clássico, blocos vetoriais e o mapa 3D do Mapbox.',
  'help.guide.map-provider.step.1':
    'Em Provedor de mapa, escolha Leaflet para o mapa 2D clássico com quaisquer blocos raster, MapLibre para blocos vetoriais do OpenFreeMap sem token, ou Mapbox para blocos vetoriais com prédios 3D e terreno.',
  'help.guide.map-provider.step.2':
    'Escolha um Estilo do mapa ou um Modelo de mapa para o visual. O Mapbox precisa de um Token de acesso Mapbox, alguns estilos raster de uma Chave de API do CARTO; o link ao lado do campo leva aonde conseguir uma.',
  'help.guide.map-provider.step.3':
    'Modo alta qualidade adiciona antialiasing e a projeção de globo. Clique em Salvar mapa.',
  'help.guide.map-provider.result':
    'Todo mapa no TREK, viagens, Atlas, Coleções e a jornada, é desenhado pelo motor que você escolheu.',
  'help.guide.map-provider.tip.1': 'Sem token, o Mapbox recorre ao mapa padrão em vez de não mostrar nada.',
  'help.guide.map-provider.tip.2':
    'Os blocos de mapa que você armazena offline vêm do provedor ativo quando você os baixa.',
  // notification-channels
  'help.guide.notification-channels.title': 'Configurar onde as notificações chegam até você',
  'help.guide.notification-channels.goal':
    'Receba lembretes de viagem e eventos de colaboração no seu celular ou em outra ferramenta.',
  'help.guide.notification-channels.step.1':
    'Em Notificações, preencha um Tópico Ntfy; adicione sua própria URL do servidor Ntfy (opcional) e um Token de acesso (opcional) se você mantém um. Testar envia uma mensagem na hora.',
  'help.guide.notification-channels.step.2':
    'Ou informe uma URL do webhook que recebe cada evento como JSON, e teste do mesmo jeito com Testar.',
  'help.guide.notification-channels.step.3':
    'Nas linhas abaixo, ligue ou desligue cada evento por canal. Um canal de plugin diz Configurar até ser configurado nas configurações do plugin; Enviar teste experimenta um.',
  'help.guide.notification-channels.result':
    'Os eventos saem pelos canais que estão ligados. O sino na barra de navegação continua mostrando eles no app de qualquer jeito.',
  'help.guide.notification-channels.tip.1':
    'Preferências por viagem ficam na própria viagem, nas configurações de notificação dela.',
  'help.guide.notification-channels.tip.2':
    'O admin pode preencher um servidor ntfy padrão para todo mundo; você ainda escolhe o seu próprio tópico.',
  // photo-providers
  'help.guide.photo-providers.title': 'Conectar uma biblioteca de fotos',
  'help.guide.photo-providers.goal': 'Deixe a jornada puxar as fotos do dia do Immich ou do Synology Photos.',
  'help.guide.photo-providers.step.1':
    'Em Integrações, encontre a seção do provedor e informe a URL e a chave de API dele. O Immich também oferece espelhar os uploads da jornada de volta na biblioteca.',
  'help.guide.photo-providers.step.2': 'Clique em Testar conexão e depois em Salvar.',
  'help.guide.photo-providers.result':
    'A aba External photos do editor de entrada busca na biblioteca conectada o dia da entrada, as mais próximas do local da entrada primeiro.',
  'help.guide.photo-providers.tip.1':
    'A conexão é sua: outros membros de uma jornada conectam as próprias bibliotecas.',
  'help.guide.photo-providers.tip.2':
    'Um provedor sem dados de GPS nas fotos funciona mesmo assim; a lista fica então em ordem de tempo.',
  // api-keys
  'help.guide.api-keys.title': 'Criar uma chave de API',
  'help.guide.api-keys.goal': 'Deixe um script ou outra ferramenta chamar a API do TREK como você.',
  'help.guide.api-keys.step.1':
    'Em Chaves de API, clique em Criar chave e dê a ela um nome que diga onde vai ser usada.',
  'help.guide.api-keys.step.2':
    'Copie a chave do diálogo: ela é mostrada uma vez só. Exclua uma chave da lista quando a ferramenta não precisar mais dela.',
  'help.guide.api-keys.result':
    'Requisições com essa chave agem com as suas permissões; a lista mostra quando cada chave foi criada e usada pela última vez.',
  'help.guide.api-keys.tip.1': 'Uma chave por ferramenta torna a revogação indolor.',
  'help.guide.api-keys.tip.2':
    'Para um assistente de IA, use MCP com OAuth no lugar; chaves de API são para clientes HTTP simples.',
  // mcp-oauth
  'help.guide.mcp-oauth.title': 'Conectar um assistente de IA por MCP',
  'help.guide.mcp-oauth.goal': 'Dê ao Claude, a um IDE ou a outro cliente MCP acesso às suas viagens.',
  'help.guide.mcp-oauth.step.1':
    'Em Configuração MCP, copie o Endpoint MCP, ou a Configuração do cliente inteira para um cliente que aceita um trecho JSON.',
  'help.guide.mcp-oauth.step.2':
    'Clientes que fazem login pelo navegador usam OAuth 2.1: Novo cliente em Clientes OAuth 2.1, com suas URIs de redirecionamento, os Escopos permitidos e, para um servidor sem navegador, Cliente de máquina.',
  'help.guide.mcp-oauth.step.3':
    'Renovar segredo e Excluir cliente ficam em cada cliente; Sessões OAuth ativas lista o que está logado e deixa você revogar. Tokens de API com Criar novo token é o caminho antigo de entrada.',
  'help.guide.mcp-oauth.result':
    'O cliente pode ler e alterar o que os escopos dele permitem, como você, e cada ação aparece com o seu nome.',
  'help.guide.mcp-oauth.tip.1':
    'Escopos são a rede de segurança: dê a um cliente só o escopo de leitura até ele precisar de mais.',
  'help.guide.mcp-oauth.tip.2': 'O admin pode desligar o MCP para a instância inteira; aí esta seção não está lá.',
  // offline-prepare
  'help.guide.offline-prepare.title': 'Levar viagens para o offline',
  'help.guide.offline-prepare.goal': 'Tenha suas viagens e os mapas delas neste dispositivo antes de a conexão cair.',
  'help.guide.offline-prepare.step.1':
    'Em O que armazenar offline, deixe Armazenar blocos do mapa offline ligado e ligue as viagens que você quer neste dispositivo.',
  'help.guide.offline-prepare.step.2':
    'Clique em Baixar para uso offline em Preparar para uso offline. Isso busca as viagens e os blocos ao redor dos lugares delas.',
  'help.guide.offline-prepare.step.3':
    'Forçar modo offline em Modo offline deixa você conferir se está tudo lá antes de sair.',
  'help.guide.offline-prepare.result':
    'As viagens abrem sem conexão; as mudanças que você faz esperam numa fila e saem ao reconectar.',
  'help.guide.offline-prepare.tip.1':
    'Blocos ocupam mais espaço: a seção Cache offline mostra o que está armazenado, por viagem.',
  'help.guide.offline-prepare.tip.2': 'Instale o TREK como app pelo navegador para o início offline mais suave.',
  // offline-conflicts
  'help.guide.offline-conflicts.title': 'Decidir o que vence num conflito de sincronização',
  'help.guide.offline-conflicts.goal':
    'Escolha como o TREK resolve uma mudança feita offline contra uma feita em outro lugar.',
  'help.guide.offline-conflicts.step.1':
    'Em Conflitos de sincronização, escolha Perguntar sempre, Sempre manter a minha versão ou Sempre manter a versão do servidor.',
  'help.guide.offline-conflicts.step.2':
    'Cache offline mostra viagens, mudanças pendentes e com falha e conflitos; Sincronizar agora empurra a fila, Limpar cache esvazia o dispositivo.',
  'help.guide.offline-conflicts.result':
    'Com Perguntar, um conflito mostra as duas versões e deixa você escolher; com as outras duas ele é resolvido em silêncio.',
  'help.guide.offline-conflicts.tip.1': 'Limpar cache remove só a cópia neste dispositivo; nada no servidor é tocado.',
  // profile
  'help.guide.profile.title': 'Alterar seu perfil',
  'help.guide.profile.goal': 'Atualize seu nome, e-mail e foto.',
  'help.guide.profile.step.1':
    'Em Conta, edite Nome de usuário e E-mail. O avatar aceita um upload seu; remova-o para voltar às iniciais.',
  'help.guide.profile.step.2': 'Clique em Salvar perfil.',
  'help.guide.profile.result':
    'Seu nome e sua foto são atualizados em todo lugar de uma vez, inclusive nas viagens que você compartilha.',
  'help.guide.profile.tip.1': 'Uma conta que entra por OIDC mostra isso aqui; o e-mail então vem do provedor.',
  // password
  'help.guide.password.title': 'Alterar sua senha',
  'help.guide.password.goal': 'Defina uma senha nova.',
  'help.guide.password.step.1': 'Em Alterar senha, informe sua senha atual e depois a nova duas vezes.',
  'help.guide.password.step.2': 'Clique em Atualizar senha.',
  'help.guide.password.result': 'A senha nova vale no próximo login; as outras sessões continuam logadas.',
  'help.guide.password.tip.1': 'Uma conta que entra por OIDC não tem senha do TREK para alterar.',
  // mfa
  'help.guide.mfa.title': 'Ativar a autenticação em duas etapas',
  'help.guide.mfa.goal': 'Proteja a conta com um código de um app autenticador.',
  'help.guide.mfa.step.1': 'Em Autenticação em duas etapas (2FA), clique em Configurar autenticador.',
  'help.guide.mfa.step.2':
    'Escaneie o código QR com o seu app, ou informe o segredo à mão, depois digite o código de seis dígitos que ele mostra e clique em Ativar 2FA.',
  'help.guide.mfa.step.3':
    'Guarde os códigos de backup: copie, baixe ou imprima. Cada um funciona uma vez, quando você não tem o celular à mão.',
  'help.guide.mfa.result': 'Todo login pede um código depois da senha.',
  'help.guide.mfa.tip.1': 'Desativar 2FA exige sua senha e um código atual.',
  'help.guide.mfa.tip.2': 'O admin pode exigir 2FA de todo mundo; aí não dá para desligar aqui.',
  // passkeys
  'help.guide.passkeys.title': 'Entrar com uma passkey',
  'help.guide.passkeys.goal': 'Use a digital, o rosto ou o PIN do seu dispositivo em vez de uma senha.',
  'help.guide.passkeys.step.1':
    'Em Passkeys, clique em Adicionar uma passkey e confirme com o seu dispositivo. Dê a ela um nome que diga qual dispositivo é.',
  'help.guide.passkeys.step.2':
    'A lista mostra cada passkey com o nome e quando foi usada pela última vez; o botão de excluir remove uma.',
  'help.guide.passkeys.result': 'A página de login oferece a passkey; a senha continua como reserva.',
  'help.guide.passkeys.tip.1':
    'Uma passkey vive no dispositivo ou no gerenciador de senhas dele, então adicione uma por dispositivo.',
  'help.guide.passkeys.tip.2':
    'Passkeys precisam de HTTPS; numa instância em HTTP puro a seção explica por que elas não estão disponíveis.',
  // delete-account
  'help.guide.delete-account.title': 'Excluir sua conta',
  'help.guide.delete-account.goal': 'Remova sua conta e os dados que são só seus.',
  'help.guide.delete-account.step.1': 'Lá embaixo em Conta, clique em Excluir conta e confirme.',
  'help.guide.delete-account.result':
    'Sua conta, suas próprias viagens e suas jornadas somem; viagens que você compartilha com outros ficam com eles.',
  'help.guide.delete-account.tip.1':
    'O último admin de uma instância não pode excluir a si mesmo; torne outra pessoa admin antes.',
  'help.guide.delete-account.tip.2': 'Não dá para desfazer. Exporte o que quiser guardar antes de confirmar.',

  // ── Screen: admin (all tabs) ──────────────────────────────────────────────────────────
  'help.ctx.admin.title': 'Administração',
  'help.ctx.admin.summary':
    'A instância por trás do TREK de todo mundo: quem pode entrar e como, o que está ligado, onde os arquivos ficam, como o servidor chega até as pessoas e como ele é salvo em backup. Só admins veem esta página; cada aba é uma tela própria na barra lateral.',
  'help.ctx.admin.bullet.1':
    'Os quatro cartões no topo contam usuários, viagens, lugares e arquivos; um banner acima deles anuncia uma versão mais nova do TREK.',
  'help.ctx.admin.bullet.2':
    'Usuários e Padrões do usuário: contas, links de convite e as configurações de mapa com que uma conta nova começa.',
  'help.ctx.admin.bullet.3':
    'Personalização, Configurações, Complementos e Plugins: modelos de mala, categorias e férias escolares; métodos de login e chaves de API; os módulos de funções; plugins de terceiros.',
  'help.ctx.admin.bullet.4':
    'Armazenamento, Notificações, Acesso MCP e GitHub: para onde vão os uploads, os canais de toda a instância, tokens e sessões de clientes de IA, e o histórico de versões.',
  'help.ctx.admin.bullet.5':
    'Backup e Auditoria: backups sob demanda e agendados, e o registro de eventos relevantes para a segurança.',
  'help.ctx.admin-users.title': 'Usuários',
  'help.ctx.admin-users.summary':
    'Cada conta deste TREK, com função, e-mail e último login, e os links de convite que deixam as pessoas se registrarem numa instância fechada.',
  'help.ctx.admin-users.bullet.1':
    'A tabela: nome de usuário, e-mail, função, data de criação, último login e as ações por linha. Você aparece marcado como você.',
  'help.ctx.admin-users.bullet.2': 'Criar usuário no topo adiciona uma conta à mão, com uma senha que você entrega.',
  'help.ctx.admin-users.bullet.3':
    'Links de convite abaixo: links de registro de uso único com limite de usos, validade e, se quiser, uma viagem à qual o novo usuário entra ao chegar.',
  'help.ctx.admin-users.bullet.4':
    'Configurações de Permissões no fim: por ação, quem pode fazê-la, Todos, Membros da viagem, Dono da viagem ou Apenas administrador.',
  'help.ctx.admin-defaults.title': 'Padrões do usuário',
  'help.ctx.admin-defaults.summary':
    'As configurações com que uma conta nova começa, para que ninguém precise procurar primeiro a aba do mapa: motor de mapas, estilo, tokens e qualidade.',
  'help.ctx.admin-defaults.bullet.1':
    'Motor de mapas, estilo e token do Mapbox, chave CARTO e qualidade do Mapbox, exatamente como um usuário os definiria em Configurações, Mapa.',
  'help.ctx.admin-defaults.bullet.2':
    'Redefinir por campo devolve a escolha do próprio TREK; a configuração própria de um usuário sempre vence estas.',
  'help.ctx.admin-config.title': 'Personalização',
  'help.ctx.admin-config.summary':
    'O que toda viagem da instância compartilha: modelos de mala, o conjunto de categorias para lugares e coleções, e o catálogo de férias escolares de onde o Vacay bebe.',
  'help.ctx.admin-config.bullet.1':
    'Modelos de mala: listas nomeadas de categorias e itens das quais a lista de mala de uma viagem pode partir.',
  'help.ctx.admin-config.bullet.2':
    'Categorias: nome, ícone e cor das categorias usadas em todo o TREK, do inspetor de lugares às Coleções.',
  'help.ctx.admin-config.bullet.3':
    'Férias escolares: o catálogo de países e regiões, para lugares que as fontes embutidas não cobrem.',
  'help.ctx.admin-settings.title': 'Configurações',
  'help.ctx.admin-settings.summary':
    'Como as pessoas entram e com o que o servidor pode falar: métodos de login e registro, SSO, passkeys, política de dois fatores, as chaves de API para mapas, lugares e imagens, os provedores de busca e transporte, e os tipos de arquivo que os uploads podem ter.',
  'help.ctx.admin-settings.bullet.1':
    'Authentication Methods: Password Login, Password Registration, SSO Login, SSO Auto-Provisioning e Exigir autenticação em dois fatores (2FA).',
  'help.ctx.admin-settings.bullet.2':
    'Login Único (OIDC) com emissor, cliente e nome exibido; Login com passkey com Relying Party ID e origens.',
  'help.ctx.admin-settings.bullet.3':
    'Chaves de API: Google Maps, Unsplash e Amap, cada uma com Testar; Para que a chave é usada restringe a chave do Google às funções que você quer pagar.',
  'help.ctx.admin-settings.bullet.4':
    'Provedor de busca de lugares e Provedor de transporte público escolhem quem responde buscas e rotas; Tipos de arquivo permitidos limita os uploads.',
  'help.ctx.admin-addons.title': 'Complementos',
  'help.ctx.admin-addons.summary':
    'Os módulos de funções do TREK, cada um com uma chave: Listas, Custos, Documentos, Vacay, Atlas, Colab, Jornada, Coleções, Viagem de carro, MCP, AirTrail, Dawarich e a análise por IA. Desligado significa que a entrada de navegação, as rotas e a API somem para todo mundo.',
  'help.ctx.admin-addons.bullet.1':
    'Um bloco por complemento com sua chave e, onde houver, sublinhas para as opções dele.',
  'help.ctx.admin-addons.bullet.2':
    'Provedores de fotos e provedores de documentos também aparecem aqui como blocos, para que Immich ou Synology possam ser oferecidos aos usuários.',
  'help.ctx.admin-addons.bullet.3': 'Rastreamento de malas tem sua própria chave abaixo dos blocos.',
  'help.ctx.admin-plugins.title': 'Plugins',
  'help.ctx.admin-plugins.summary':
    'Plugins de terceiros que rodam em processo próprio ao lado do TREK, cada um com as permissões que pediu na instalação. Instale do catálogo, envie um pacote ou vincule uma pasta enquanto desenvolve um.',
  'help.ctx.admin-plugins.bullet.1':
    'A lista: cada plugin instalado com versão, status, assinatura e as permissões que tem; ativar, desativar, atualizar ou desinstalar por linha.',
  'help.ctx.admin-plugins.bullet.2':
    'Enviar plugin recebe um arquivo de pacote; Reescanear detecta uma pasta de plugin vinculada para desenvolvimento.',
  'help.ctx.admin-plugins.bullet.3':
    'Hosts permitidos por plugin: os endereços que um plugin pode chamar, já que a saída é negada por padrão.',
  'help.ctx.admin-storage.title': 'Armazenamento',
  'help.ctx.admin-storage.summary':
    'Onde os uploads ficam: o disco local, um bucket S3, ou um espelho que grava nos dois. Cada categoria de upload pode ir para um backend diferente, e Integridade diz se cada backend responde.',
  'help.ctx.admin-storage.bullet.1':
    'Backends: nome e tipo de cada um, com Testar, Editar e Remover; um definido pelo ambiente é somente leitura aqui.',
  'help.ctx.admin-storage.bullet.2':
    'Categorias: capas, documentos, fotos da jornada e o resto, cada uma atribuída a um backend; mudar uma oferece mover os arquivos existentes.',
  'help.ctx.admin-storage.bullet.3':
    'Integridade: uma verificação por backend, e o arquivo semente que prova que a configuração é a que o servidor vê.',
  'help.ctx.admin-notifications.title': 'Notificações',
  'help.ctx.admin-notifications.summary':
    'Os canais que a instância oferece aos usuários, e os que chegam até você como admin. Os usuários escolhem seus próprios tópicos e URLs em Configurações; você decide o que existe e configura o e-mail.',
  'help.ctx.admin-notifications.bullet.1':
    'In-App, Email (SMTP), Ntfy, Webhook e Web Push: um painel para cada, com uma chave que oferece o canal aos usuários e a configuração do lado do servidor de que ele precisa.',
  'help.ctx.admin-notifications.bullet.2':
    'Lembretes de viagem: se o servidor envia o lembrete antes de uma viagem começar.',
  'help.ctx.admin-notifications.bullet.3':
    'Ntfy de admin e Webhook de admin: para onde vão eventos de admin como um backup que falhou ou uma versão nova, com Testar.',
  'help.ctx.admin-mcp-tokens.title': 'Acesso MCP',
  'help.ctx.admin-mcp-tokens.summary':
    'Cada token e sessão OAuth que clientes de IA têm neste TREK, de todos os usuários, com o poder de revogar qualquer um deles.',
  'help.ctx.admin-mcp-tokens.bullet.1': 'Tokens de API: quem criou, quando foi usado pela última vez, e Excluir.',
  'help.ctx.admin-mcp-tokens.bullet.2': 'Sessões OAuth: o cliente, o usuário e os escopos concedidos, e Revogar.',
  'help.ctx.admin-github.title': 'GitHub',
  'help.ctx.admin-github.summary':
    'O que há de novo no TREK: o histórico de versões do GitHub, a versão que você roda, e se saiu uma mais nova. A atualização em si acontece fora do app, no host.',
  'help.ctx.admin-github.bullet.1':
    'Histórico de versões lista as versões com suas notas; a mais nova leva Mais recente, e a sua está marcada.',
  'help.ctx.admin-github.bullet.2':
    'Atualização disponível aparece no cabeçalho assim que existe uma versão mais nova, com como atualizar no Docker e em outras instalações.',
  'help.ctx.admin-backup.title': 'Backup',
  'help.ctx.admin-backup.summary':
    'Backups completos do banco de dados e dos uploads, feitos à mão ou por agendamento, guardados no servidor e baixáveis como um único arquivo. Restaurar coloca um de volta.',
  'help.ctx.admin-backup.bullet.1':
    'Backup de dados: Criar backup, e a lista dos existentes com Baixar, Restaurar e excluir.',
  'help.ctx.admin-backup.bullet.2': 'Enviar backup traz um arquivo feito em outra instância ou num dia anterior.',
  'help.ctx.admin-backup.bullet.3': 'Backup automático: ligado ou desligado, intervalo, hora e dia, e quantos manter.',
  'help.ctx.admin-audit.title': 'Auditoria',
  'help.ctx.admin-audit.summary':
    'O registro de eventos administrativos e relevantes para a segurança: logins e falhas, mudanças de MFA, mudanças de usuários e configurações, backups e restaurações. Somente leitura, o mais novo primeiro.',
  'help.ctx.admin-audit.bullet.1': 'Uma linha por evento com hora, usuário, ação, recurso, IP e detalhes.',
  'help.ctx.admin-audit.bullet.2': 'Atualizar recarrega; Carregar mais volta mais atrás.',
  // create-user
  'help.guide.create-user.title': 'Criar um usuário',
  'help.guide.create-user.goal': 'Adicione uma conta à mão, sem convite.',
  'help.guide.create-user.step.1': 'Clique em Criar usuário no topo da aba Usuários.',
  'help.guide.create-user.step.2':
    'Informe Nome de usuário, E-mail e uma Senha, e escolha a Função: Usuário ou Administrador.',
  'help.guide.create-user.step.3': 'Clique em Criar usuário.',
  'help.guide.create-user.result':
    'A conta aparece na tabela e já pode entrar; entregue a senha por um canal em que você confia.',
  'help.guide.create-user.tip.1':
    'Para alguém que deve escolher a própria senha, um link de convite é o caminho melhor.',
  'help.guide.create-user.tip.2':
    'Admins veem esta página e o registro de auditoria; todo o resto é igual para as duas funções.',
  // edit-user
  'help.guide.edit-user.title': 'Mudar a função ou a senha de um usuário',
  'help.guide.edit-user.goal': 'Promova alguém, rebaixe, ou traga a pessoa de volta depois de uma senha perdida.',
  'help.guide.edit-user.step.1': 'Clique no lápis na linha do usuário. Editar usuário abre com os dados da conta.',
  'help.guide.edit-user.step.2':
    'Mude a Função, defina uma Nova senha, ou clique em Redefinir passkeys quando a pessoa perdeu o dispositivo onde estavam as passkeys, e depois Salvar.',
  'help.guide.edit-user.result':
    'A mudança vale na próxima requisição; uma senha nova funciona a partir do próximo login.',
  'help.guide.edit-user.tip.1': 'Você não pode tirar a função de admin de si mesmo enquanto for o último admin.',
  'help.guide.edit-user.tip.2':
    'Redefinir passkeys mantém a senha; a pessoa adiciona passkeys novas em Configurações, Conta.',
  // invite-links
  'help.guide.invite-links.title': 'Convidar alguém com um link',
  'help.guide.invite-links.goal':
    'Deixe uma pessoa se registrar numa instância fechada e, se quiser, cair direto numa viagem.',
  'help.guide.invite-links.step.1': 'Em Links de convite, clique em Criar link.',
  'help.guide.invite-links.step.2':
    'Defina Máx. usos e Expira após, opcionalmente Adicionar à viagem (opcional), e clique em Criar e copiar.',
  'help.guide.invite-links.step.3':
    'Envie o link. Cada linha mostra quantas vezes ele foi usado e quem o criou; Copiar link copia de novo, e links esgotados ou expirados ficam marcados.',
  'help.guide.invite-links.result':
    'Quem abre o link se registra com a própria senha e, com uma viagem escolhida, entra nela na hora.',
  'help.guide.invite-links.tip.1':
    'Links de convite funcionam mesmo com Password Registration desligado em Configurações.',
  'help.guide.invite-links.tip.2': 'Um link com um uso e validade curta é o padrão mais seguro para uma única pessoa.',
  // delete-user
  'help.guide.delete-user.title': 'Excluir um usuário',
  'help.guide.delete-user.goal': 'Remova uma conta e tudo que só pertence a ela.',
  'help.guide.delete-user.step.1': 'Clique no ícone de lixeira na linha do usuário e confirme Excluir usuário.',
  'help.guide.delete-user.result':
    'A conta, as viagens dela e as jornadas dela somem; viagens compartilhadas com outros ficam com os membros restantes.',
  'help.guide.delete-user.tip.1': 'Não dá para desfazer. Faça um backup antes se não tiver certeza.',
  'help.guide.delete-user.tip.2': 'O último admin não pode ser excluído; torne outra pessoa admin antes.',
  // permissions
  'help.guide.permissions.title': 'Decidir quem pode fazer o quê',
  'help.guide.permissions.goal': 'Defina, por ação, qual função tem permissão para fazê-la neste TREK.',
  'help.guide.permissions.step.1':
    'Em Configurações de Permissões, encontre a ação no grupo dela, por exemplo Excluir viagens em Gerenciamento de Viagens, e escolha o nível: Todos, Membros da viagem, Dono da viagem ou Apenas administrador. Uma linha alterada aparece marcada como personalizado.',
  'help.guide.permissions.step.2': 'Clique em Salvar. Restaurar padrões devolve cada linha ao nível embutido.',
  'help.guide.permissions.result':
    'A regra vale para todas as viagens de uma vez; os botões e menus de quem está abaixo do nível somem.',
  'help.guide.permissions.tip.1': 'Dono da viagem é a pessoa que criou a viagem; admins sempre podem fazer tudo.',
  'help.guide.permissions.tip.2':
    'Abaixe um nível em vez de excluir um membro: um membro que não pode editar ainda consegue ler e comentar.',
  // default-map
  'help.guide.default-map.title': 'Definir o mapa padrão para usuários novos',
  'help.guide.default-map.goal': 'Dê a cada conta nova um mapa que funciona sem token pessoal.',
  'help.guide.default-map.step.1':
    'Em Mapa, escolha o Motor de mapas e, para Mapbox ou MapLibre, o Estilo do mapa, o Token compartilhado do Mapbox e o Modo de alta qualidade; para um mapa raster, o Modelo de mapa e a Chave CARTO compartilhada.',
  'help.guide.default-map.step.2':
    'Ao lado de qualquer campo que você mudou, redefinir devolve a escolha do próprio TREK. Configurações padrão do usuário à esquerda faz o mesmo para Tema de cores, unidades e a moeda.',
  'help.guide.default-map.result':
    'Contas novas começam com isso; quem definiu o próprio mapa em Configurações mantém o seu.',
  'help.guide.default-map.tip.1':
    'Um token informado aqui é compartilhado por todos que não têm um próprio, então fique de olho na cota dele.',
  'help.guide.default-map.tip.2': 'Contas existentes que nunca mexeram na aba do mapa também seguem esses padrões.',
  // packing-templates
  'help.guide.packing-templates.title': 'Montar um modelo de mala',
  'help.guide.packing-templates.goal': 'Dê às viagens uma lista de mala para começar em vez de uma vazia.',
  'help.guide.packing-templates.step.1': 'Clique em Novo modelo, digite um nome e confirme com o tique.',
  'help.guide.packing-templates.step.2':
    'Abra o modelo e clique em Adicionar categoria; sob cada categoria, o + adiciona itens, e um item só precisa de um nome.',
  'help.guide.packing-templates.step.3':
    'Tudo é salvo conforme você faz. O lápis renomeia um modelo, uma categoria ou um item, a lixeira exclui.',
  'help.guide.packing-templates.result':
    'O modelo é oferecido na lista de mala de toda viagem; aplicá-lo copia os itens, então uma viagem pode mudá-los à vontade.',
  'help.guide.packing-templates.tip.1':
    'Um modelo por tipo de viagem, praia, cidade, trilha, é melhor que uma lista gigante.',
  'help.guide.packing-templates.tip.2': 'Excluir um modelo não mexe nas viagens que já o aplicaram.',
  // categories
  'help.guide.categories.title': 'Gerenciar o conjunto de categorias',
  'help.guide.categories.goal': 'Decida quais categorias lugares e coleções podem ter, e como elas aparecem.',
  'help.guide.categories.step.1':
    'Clique em Nova categoria, dê um nome, escolha um ícone e uma cor; a Pré-visualização mostra o resultado. Clique em Criar.',
  'help.guide.categories.step.2':
    'Passe o mouse sobre uma categoria na lista para editar ou excluir. Excluir pede confirmação.',
  'help.guide.categories.result':
    'O conjunto vale em todo lugar de uma vez: o inspetor de lugares, os pinos do mapa, Coleções e os filtros.',
  'help.guide.categories.tip.1':
    'Os lugares mantêm o id da categoria, então renomear uma categoria a renomeia em todo lugar.',
  'help.guide.categories.tip.2':
    'Uma categoria excluída deixa seus lugares sem nenhuma; reatribua antes se isso importar.',
  // school-holiday-catalog
  'help.guide.school-holiday-catalog.title': 'Manter férias escolares à mão',
  'help.guide.school-holiday-catalog.goal': 'Cubra um país ou região que as fontes de férias embutidas não cobrem.',
  'help.guide.school-holiday-catalog.step.1':
    'Em Férias escolares, clique em Adicionar país, informe o País e seu Código do país (ex.: US), e Salvar; depois Adicionar região para cada parte dele que é diferente.',
  'help.guide.school-holiday-catalog.step.2':
    'Clique numa região para abrir Região ou distrito escolar: Adicionar período, dê a cada um um Nome das férias, Data inicial e Data final, e Salvar. A lixeira remove um período, uma região ou, quando não restam regiões, um país.',
  'help.guide.school-holiday-catalog.result':
    'Os usuários encontram o país e a região em Configurações no Vacay e veem os períodos na grade anual deles.',
  'help.guide.school-holiday-catalog.tip.1':
    'Regiões das fontes embutidas não podem ser editadas aqui; adicione uma região manual ao lado se uma data estiver errada.',
  // auth-methods
  'help.guide.auth-methods.title': 'Decidir como as pessoas entram',
  'help.guide.auth-methods.goal': 'Abra ou feche o login por senha, o SSO e o registro, e exija 2FA.',
  'help.guide.auth-methods.step.1':
    'Em Authentication Methods, ligue ou desligue Password Login e Password Registration. Registro desligado significa contas novas só por links de convite, SSO ou à mão.',
  'help.guide.auth-methods.step.2':
    'SSO Login e SSO Auto-Provisioning precisam de um Login Único (OIDC) configurado abaixo; o provisionamento automático cria uma conta na primeira vez que alguém entra pelo SSO.',
  'help.guide.auth-methods.step.3':
    'Exigir autenticação em dois fatores (2FA) faz todo login por senha configurar um autenticador no próximo acesso. Login com passkey precisa do Relying Party ID e das origens pelas quais seu TREK é acessado.',
  'help.guide.auth-methods.result': 'A página de login oferece exatamente os métodos que você deixou ligados.',
  'help.guide.auth-methods.tip.1':
    'Um aviso aparece antes de você se trancar do lado de fora: pelo menos um caminho de entrada para admins continua ligado.',
  'help.guide.auth-methods.tip.2': 'Valores definidos por variáveis de ambiente aparecem aqui como somente leitura.',
  // oidc
  'help.guide.oidc.title': 'Conectar o login único',
  'help.guide.oidc.goal': 'Deixe as pessoas entrarem com o seu provedor de identidade.',
  'help.guide.oidc.step.1':
    'Em Login Único (OIDC), informe o Nome exibido do botão e a URL do emissor, o Client ID e o Client Secret do seu provedor, e depois Salvar.',
  'help.guide.oidc.step.2': 'Ligue SSO Login em Authentication Methods.',
  'help.guide.oidc.result':
    'A página de login mostra o botão de SSO; com SSO Auto-Provisioning ligado, quem entra pela primeira vez ganha uma conta automaticamente.',
  'help.guide.oidc.tip.1':
    'A URI de redirecionamento que o seu provedor precisa é o endereço do seu TREK mais o caminho de callback do OIDC da documentação.',
  'help.guide.oidc.tip.2':
    'O mapeamento de claims decide quais grupos do SSO viram admins; veja a página do OIDC na documentação.',
  // instance-keys
  'help.guide.instance-keys.title': 'Informar as chaves de API',
  'help.guide.instance-keys.goal':
    'Libere a busca de lugares do Google, capas do Unsplash e o Amap para a instância inteira.',
  'help.guide.instance-keys.step.1':
    'Em Chaves de API, cole a Chave da API Google Maps e clique em Testar; o campo diz se a chave responde.',
  'help.guide.instance-keys.step.2':
    'Em Para que a chave é usada, ligue só as funções que você quer cobradas nessa chave: autocompletar, detalhes, fotos, enriquecimento, o registro de pesquisas.',
  'help.guide.instance-keys.step.3':
    'Chave de API do Unsplash alimenta a busca de capas; Chave de API do Amap (高德地图) a busca de lugares na China. Teste cada uma do mesmo jeito.',
  'help.guide.instance-keys.result':
    'Os usuários ganham as funções sem chaves próprias; sem chave do Google, o TREK busca pela pilha gratuita do OpenStreetMap e pela TREK Places API.',
  'help.guide.instance-keys.tip.1':
    'A chave pessoal de um usuário em Configurações vence a chave da instância para esse usuário.',
  'help.guide.instance-keys.tip.2':
    'Chaves também podem vir de variáveis de ambiente; essas aparecem aqui como somente leitura.',
  // places-transit
  'help.guide.places-transit.title': 'Escolher os provedores de busca e transporte',
  'help.guide.places-transit.goal': 'Decida quem responde buscas de lugares e rotas de transporte público.',
  'help.guide.places-transit.step.1':
    'Em Provedor de busca de lugares, escolha Automático, Google Places, Amap (高德地图) ou OpenStreetMap. Automático usa a melhor chave que existir.',
  'help.guide.places-transit.step.2':
    'Em Provedor de transporte público, escolha Transitous (grátis), mundial e sem chave, ou Google, que precisa da chave do Google.',
  'help.guide.places-transit.result': 'Toda caixa de busca e toda rota de transporte público no TREK segue a escolha.',
  'help.guide.places-transit.tip.1': 'Um provedor sem a chave dele mostra um aviso aqui e recorre ao OpenStreetMap.',
  'help.guide.places-transit.tip.2': 'Rotas de transporte do Google são cobradas por requisição; o Transitous não.',
  // file-types
  'help.guide.file-types.title': 'Limitar os tipos de arquivo',
  'help.guide.file-types.goal': 'Decida quais extensões de arquivo os uploads podem ter.',
  'help.guide.file-types.step.1':
    'Em Tipos de arquivo permitidos, edite a lista de extensões separadas por vírgula e salve.',
  'help.guide.file-types.result':
    'Uploads de qualquer outro tipo são recusados com uma mensagem clara, nos documentos, no diário e nas capas.',
  'help.guide.file-types.tip.1':
    'Mantenha os tipos de imagem na lista; capas e fotos da jornada passam pela mesma verificação.',
  // toggle-addon
  'help.guide.toggle-addon.title': 'Ligar ou desligar um complemento',
  'help.guide.toggle-addon.goal': 'Ofereça um módulo de funções a todo mundo, ou tire-o.',
  'help.guide.toggle-addon.step.1':
    'Vire a chave no bloco do complemento. A entrada de navegação aparece ou some para todo mundo de uma vez.',
  'help.guide.toggle-addon.step.2':
    'Alguns blocos têm sublinhas para suas opções, como Rastreamento de malas sob Listas ou os provedores de fotos sob Jornada; elas só aparecem enquanto o complemento está ligado.',
  'help.guide.toggle-addon.result':
    'Os dados de um complemento desligado são mantidos; ligá-lo de novo os mostra outra vez.',
  'help.guide.toggle-addon.tip.1': 'MCP desligado remove o endpoint e as seções de Integrações que dependem dele.',
  'help.guide.toggle-addon.tip.2':
    'Vacay, Atlas e Jornada são os complementos que os usuários mais pedem; Documentos precisa de armazenamento para uploads.',
  // install-plugin
  'help.guide.install-plugin.title': 'Instalar um plugin',
  'help.guide.install-plugin.goal': 'Adicione um plugin de terceiros e dê a ele exatamente as permissões que pede.',
  'help.guide.install-plugin.step.1':
    'Abra Descobrir, escolha um plugin e clique em Instalar; ou clique em Enviar plugin e escolha um pacote .zip ou .tar.gz.',
  'help.guide.install-plugin.step.2':
    'De volta em Instalado, leia a linha: o que o plugin pode ler ou gravar, os hosts que ele chama e se está assinado. Ligue Ativar plugin.',
  'help.guide.install-plugin.step.3':
    'O menu da linha oferece Reiniciar, Ver registro de erros, Hosts permitidos e Alterar versão…; Excluir desinstala. Uma atualização é oferecida na linha quando existe uma versão mais nova, e uma que pede novos direitos fica desligada até você aprová-los.',
  'help.guide.install-plugin.result':
    'O plugin roda em processo próprio; o que ele adiciona, widgets, camadas de mapa, ferramentas, aparece onde o plugin declara.',
  'help.guide.install-plugin.tip.1':
    'Reescanear detecta uma pasta de plugin vinculada para desenvolvimento sem pacote.',
  'help.guide.install-plugin.tip.2': 'Um plugin sem assinatura é marcado como tal; instale só quando confiar na fonte.',
  // storage-backends
  'help.guide.storage-backends.title': 'Mover uploads para o S3 ou um espelho',
  'help.guide.storage-backends.goal':
    'Mantenha arquivos em armazenamento de objetos, ou em disco e bucket ao mesmo tempo.',
  'help.guide.storage-backends.step.1':
    'Em Backends, clique em Adicionar backend, dê um Nome, escolha o Tipo, Local, S3 ou Espelho, preencha os campos e Aplicar. Testar verifica a conexão, Salvar alterações grava.',
  'help.guide.storage-backends.step.2':
    'Em Categorias, atribua cada categoria de upload a um backend. Mudar uma pergunta se deve Mover objetos existentes ou Apenas rotear novas gravações.',
  'help.guide.storage-backends.step.3':
    'Integridade no topo verifica cada backend; uma entrada vermelha nomeia o que falhou.',
  'help.guide.storage-backends.result':
    'Uploads novos vão para o backend atribuído; arquivos movidos são servidos de lá.',
  'help.guide.storage-backends.tip.1':
    'Um backend configurado por variáveis de ambiente é mostrado, mas não pode ser editado aqui.',
  'help.guide.storage-backends.tip.2':
    'Um espelho grava nos dois destinos e lê do primeiro; use-o para migrar sem tempo parado.',
  // channels-instance
  'help.guide.channels-instance.title': 'Configurar os canais de notificação',
  'help.guide.channels-instance.goal': 'Decida quais canais os usuários podem escolher, e configure o e-mail.',
  'help.guide.channels-instance.step.1':
    'Em Email (SMTP), informe SMTP Host, SMTP Port, SMTP User, SMTP Password e a From Address; Enviar e-mail de teste manda um e-mail para você.',
  'help.guide.channels-instance.step.2':
    'Ligue Web Push, Ntfy e Webhook para oferecê-los; os usuários então ativam o push em cada dispositivo, ou informam o próprio tópico ou URL, em Configurações, Notificações.',
  'help.guide.channels-instance.step.3':
    'Lembretes de viagem controla o lembrete antes de uma viagem começar; In-App está sempre ligado e aqui só é explicado.',
  'help.guide.channels-instance.result': 'A aba Notificações de cada usuário mostra os canais que você ligou.',
  'help.guide.channels-instance.tip.1':
    'Um servidor ntfy padrão informado aqui vem preenchido para os usuários; eles ainda podem indicar o próprio.',
  'help.guide.channels-instance.tip.2':
    'Canais de plugins aparecem sozinhos assim que um plugin com essa capacidade está ativo.',
  // admin-channels
  'help.guide.admin-channels.title': 'Receber eventos de admin no celular',
  'help.guide.admin-channels.goal': 'Saiba de backups que falharam, versões novas e outros eventos da instância.',
  'help.guide.admin-channels.step.1':
    'Em Ntfy de admin, informe um tópico e, se precisar, servidor e token; em Webhook de admin, uma URL.',
  'help.guide.admin-channels.step.2':
    'Clique em Enviar Ntfy de teste ou Enviar webhook de teste para ver uma mensagem chegar.',
  'help.guide.admin-channels.result': 'Eventos de admin vão para lá além do sino no app de cada admin.',
  'help.guide.admin-channels.tip.1':
    'Mantenha o tópico de admin separado do seu pessoal, para que uma queda não se afogue na conversa das viagens.',
  // mcp-tokens-admin
  'help.guide.mcp-tokens-admin.title': 'Revogar acesso de IA',
  'help.guide.mcp-tokens-admin.goal': 'Veja e corte cada token e sessão que um cliente de IA tem, de qualquer usuário.',
  'help.guide.mcp-tokens-admin.step.1':
    'Em Tokens de API, encontre o token por usuário e nome; a lixeira o exclui e o cliente para na hora.',
  'help.guide.mcp-tokens-admin.step.2':
    'Em Sessões OAuth, o mesmo para clientes baseados em navegador: cliente, usuário e data, e a lixeira revoga a sessão.',
  'help.guide.mcp-tokens-admin.result': 'O cliente precisa ser conectado de novo pelo usuário dele; nada mais muda.',
  'help.guide.mcp-tokens-admin.tip.1':
    'Os escopos dizem o que um cliente podia fazer; um escopo somente leitura é inofensivo de deixar.',
  'help.guide.mcp-tokens-admin.tip.2': 'Desligar o complemento MCP revoga tudo de uma vez.',
  // release-history
  'help.guide.release-history.title': 'Verificar se há uma versão nova',
  'help.guide.release-history.goal': 'Saiba se o seu TREK está atualizado e o que a próxima versão traz.',
  'help.guide.release-history.step.1':
    'Quando existe uma versão mais nova, Atualização disponível aparece no topo da página de admin; Ver no GitHub abre, e Como atualizar explica a atualização para Docker e para outras instalações.',
  'help.guide.release-history.step.2':
    'Histórico de versões lista cada versão com suas notas; Mostrar detalhes expande, a mais nova leva Mais recente, e Carregar mais volta mais atrás.',
  'help.guide.release-history.result':
    'A atualização acontece no host, puxando a imagem nova ou construindo a tag nova; o diretório de dados fica.',
  'help.guide.release-history.tip.1': 'Faça um backup antes de atualizar; a aba Backup fica ao lado.',
  'help.guide.release-history.tip.2':
    'Pré-lançamentos são mostrados, mas não anunciados como atualizações, a menos que você rode um.',
  // create-backup
  'help.guide.create-backup.title': 'Fazer e restaurar um backup',
  'help.guide.create-backup.goal':
    'Tire um retrato da instância inteira, guarde uma cópia em outro lugar, e consiga colocá-la de volta.',
  'help.guide.create-backup.step.1':
    'Em Backup de dados, clique em Criar backup. Ele empacota o banco de dados e os uploads em um único arquivo no servidor.',
  'help.guide.create-backup.step.2':
    'Baixar guarda uma cópia fora da máquina; a lixeira exclui os antigos para liberar espaço.',
  'help.guide.create-backup.step.3':
    'Restaurar em um backup, ou Enviar backup com um arquivo, substitui os dados atuais depois que Restaurar backup? pergunta uma vez.',
  'help.guide.create-backup.result':
    'Uma restauração traz de volta usuários, viagens, arquivos e configurações como estavam nesse backup; todo mundo é desconectado.',
  'help.guide.create-backup.tip.1':
    'Restaurar é a única ação aqui que não pode ser desfeita. Faça um backup novo antes.',
  'help.guide.create-backup.tip.2':
    'Os backups ficam no diretório de dados; uma cópia em outra máquina é o que faz deles um backup.',
  // auto-backup
  'help.guide.auto-backup.title': 'Agendar backups',
  'help.guide.auto-backup.goal': 'Deixe o servidor fazer backup sozinho e manter só os últimos.',
  'help.guide.auto-backup.step.1':
    'Em Backup automático, ligue Ativar backup automático e escolha o Intervalo, Executar no horário e, para semanal ou mensal, o Dia da semana ou Dia do mês.',
  'help.guide.auto-backup.step.2':
    'Excluir backups antigos após define por quanto tempo um backup é mantido; os mais antigos vão embora quando um novo é feito.',
  'help.guide.auto-backup.result':
    'Os backups aparecem na lista conforme o agendamento; uma falha chega aos canais de admin.',
  'help.guide.auto-backup.tip.1': 'Os horários seguem o fuso horário do servidor, mostrado na aba Auditoria.',
  'help.guide.auto-backup.tip.2': 'O espaço no servidor é finito; manter de três a cinco costuma bastar.',
  // audit-log
  'help.guide.audit-log.title': 'Ler o registro de auditoria',
  'help.guide.audit-log.goal': 'Descubra quem fez o quê, e quando.',
  'help.guide.audit-log.step.1':
    'Leia as linhas: hora, usuário, ação, recurso, IP e detalhes, o mais novo primeiro. As ações têm o nome do que aconteceu, como uma falha de login, uma mudança de MFA ou uma restauração.',
  'help.guide.audit-log.step.2': 'Atualizar recarrega o topo; Carregar mais volta mais atrás.',
  'help.guide.audit-log.result': 'Um rastro que você pode entregar a quem perguntar por que algo mudou.',
  'help.guide.audit-log.tip.1': 'Os horários são mostrados no fuso horário do servidor, indicado acima da tabela.',
  'help.guide.audit-log.tip.2': 'O registro é só de acréscimo; nada aqui pode ser editado ou excluído pelo app.',
  // document-providers
  'help.guide.document-providers.title': 'Oferecer um repositório de documentos',
  'help.guide.document-providers.goal': 'Decida com quais repositórios uma viagem pode manter os documentos em dia.',
  'help.guide.document-providers.step.1':
    'O bloco Documentos carrega os repositórios como linhas na sua prateleira: Paperless-ngx, Papra, Nextcloud, OpenCloud e Synology Drive. Os cinco começam desligados, e a prateleira só existe enquanto Documentos estiver ligado.',
  'help.guide.document-providers.step.2':
    'Vire a chave na linha Nextcloud. A mensagem diz Complemento atualizado, e a partir de agora os donos de viagem encontram Sincronização de documentos na aba Arquivos das suas viagens, com Nextcloud em Conectar um provedor.',
  'help.guide.document-providers.result':
    'O repositório está em oferta em toda viagem deste TREK; nada fica conectado até um dono de viagem fazer isso.',
  'help.guide.document-providers.tip.1':
    'Aqui só se decide se um repositório pode ser oferecido. O endereço e as credenciais pertencem a uma viagem e são digitados na aba Arquivos dela pelo dono da viagem, nunca no painel de administração.',
  'help.guide.document-providers.tip.2':
    'Desligar Documentos desliga todos os repositórios junto, e um repositório não pode ser ligado enquanto Documentos estiver desligado: o servidor responde Enable the Documents addon first. Um repositório na sua própria rede também precisa de ALLOW_INTERNAL_NETWORK=true no servidor.',

  // ── Screen: trip ──────────────────────────────────────────────────────────────────────
  'help.ctx.trip.title': 'Viagem',
  'help.ctx.trip.summary':
    'Uma viagem, inteira: o plano com seus dias, mapa e lugares, e as abas de transportes, reservas, listas, custos, arquivos e colaboração. Cada uma delas é uma tela de ajuda própria abaixo desta.',
  'help.ctx.trip.bullet.1':
    'A barra de abas: Plano, Transportes, Reservas, Listas, Custos, Arquivos e Colab. Addons e plugins decidem quais abas existem no seu TREK.',
  'help.ctx.trip.bullet.2':
    'Plano são três colunas: os dias à esquerda, o mapa no meio, os lugares à direita. Reservas e transportes vivem dentro do plano, na parada e entre paradas; as abas os listam.',
  'help.ctx.trip.bullet.3':
    'Compartilhar, no canto superior direito, abre as pessoas da viagem: membros, convidados, o link de convite e o link público somente leitura.',
  'help.ctx.trip.bullet.4':
    'Título, datas, capa e moeda são editados em Minhas viagens, com o lápis no cartão da viagem.',
  'help.ctx.trip.bullet.5':
    'Os chevrons na borda interna de uma coluna a recolhem e o mapa ocupa o espaço; o divisor fino ao lado de uma coluna muda a largura dela.',
  'help.ctx.trip.bullet.6': 'A seta de desfazer na barra de ferramentas dos dias reverte a última alteração no plano.',
  // add-member
  'help.guide.add-member.title': 'Adicionar um membro',
  'help.guide.add-member.goal': 'Dê a alguém com conta no TREK acesso a esta viagem.',
  'help.guide.add-member.step.1': 'Clique em Compartilhar no canto superior direito.',
  'help.guide.add-member.step.2': 'Em Convidar usuário, escolha a pessoa na lista e clique em Convidar.',
  'help.guide.add-member.step.3':
    'A pessoa agora aparece em Acesso. A coroa marca o proprietário; o ícone no fim de uma linha remove o acesso de novo.',
  'help.guide.add-member.result':
    'O membro vê e edita a viagem como você, dentro dos níveis que o admin definiu em Configurações de Permissões.',
  'help.guide.add-member.tip.1':
    'Quem falta na lista ainda não tem conta no TREK: adicione a pessoa como convidado, ou deixe que ela se registre por um link de convite.',
  'help.guide.add-member.tip.2':
    'O número ao lado de Acesso conta as pessoas na viagem; os convidados são listados à parte, abaixo.',
  // trip-invite-link
  'help.guide.trip-invite-link.title': 'Convidar por link',
  'help.guide.trip-invite-link.goal': 'Deixe as pessoas entrarem na viagem por conta própria.',
  'help.guide.trip-invite-link.step.1':
    'Clique em Compartilhar e depois, em Link de convite da viagem, clique em Criar link de convite.',
  'help.guide.trip-invite-link.step.2':
    'Clique em Copiar e envie o link. Qualquer pessoa com conta no TREK que o abrir entra como membro.',
  'help.guide.trip-invite-link.step.3':
    'Gerar novamente substitui o link e torna o antigo inútil; Desativar o desliga.',
  'help.guide.trip-invite-link.result': 'Quem abrir o link está na viagem e aparece em Acesso.',
  'help.guide.trip-invite-link.tip.1':
    'Alguém sem conta não consegue usá-lo. Um admin distribui links de registro em Administração, Usuários, e pode vincular um a esta viagem.',
  'help.guide.trip-invite-link.tip.2':
    'Gere novamente quando um link foi parar no chat errado: o antigo para de funcionar na hora.',
  // add-guest
  'help.guide.add-guest.title': 'Adicionar um convidado sem conta',
  'help.guide.add-guest.goal': 'Conte com alguém que não usa o TREK.',
  'help.guide.add-guest.step.1': 'Clique em Compartilhar e role até Convidados.',
  'help.guide.add-guest.step.2': 'Digite o nome em Nome do convidado e clique em Adicionar convidado.',
  'help.guide.add-guest.result':
    'O convidado pode ser atribuído a custos, itens da mala e tarefas, mas não consegue fazer login.',
  'help.guide.add-guest.tip.1':
    'O lápis renomeia um convidado; o ícone no fim da linha o remove junto com suas partes e atribuições.',
  'help.guide.add-guest.tip.2': 'Se a pessoa criar uma conta depois, convide-a como membro e remova o convidado.',
  // public-link
  'help.guide.public-link.title': 'Publicar um link somente leitura',
  'help.guide.public-link.goal': 'Mostre a viagem a pessoas que não devem editá-la.',
  'help.guide.public-link.step.1':
    'Clique em Compartilhar; à direita, em Link público, marque o que o link pode mostrar. Mapa e plano está sempre ligado; Reservas, Mala, Custos e Chat são escolha sua.',
  'help.guide.public-link.step.2': 'Clique em Criar link e depois em Copiar.',
  'help.guide.public-link.step.3': 'As marcações podem ser mudadas enquanto o link existir; Excluir link o encerra.',
  'help.guide.public-link.result':
    'Qualquer pessoa com o link vê as partes escolhidas sem fazer login e não consegue mudar nada.',
  'help.guide.public-link.tip.1':
    'O link não é listado em lugar nenhum; quem o tem consegue abri-lo, então trate-o como uma senha.',
  'help.guide.public-link.tip.2': 'Para direitos de edição, adicione a pessoa como membro em vez disso.',
  // transfer-ownership
  'help.guide.transfer-ownership.title': 'Passar a viagem adiante ou sair dela',
  'help.guide.transfer-ownership.goal': 'Torne outra pessoa o proprietário, ou saia de uma viagem que não é sua.',
  'help.guide.transfer-ownership.step.1':
    'Clique em Compartilhar. Em Acesso, a coroa na linha de um membro torna essa pessoa o proprietário; confirme a pergunta.',
  'help.guide.transfer-ownership.step.2':
    'Sair da viagem na sua própria linha tira você da viagem; como proprietário, passe-a adiante primeiro.',
  'help.guide.transfer-ownership.result':
    'O novo proprietário gerencia os membros e pode excluir a viagem; você continua como membro comum.',
  'help.guide.transfer-ownership.tip.1':
    'O proprietário é quem criou a viagem, até que ela seja passada adiante; excluir a viagem cabe só a ele.',
  'help.guide.transfer-ownership.tip.2':
    'Remover acesso em outra linha é o mesmo botão ao contrário: o proprietário tira um membro.',
  // collapse-columns
  'help.guide.collapse-columns.title': 'Abrir espaço para o mapa',
  'help.guide.collapse-columns.goal': 'Recolha uma coluna ou dê mais largura a ela.',
  'help.guide.collapse-columns.step.1':
    'Clique no chevron na borda interna da coluna dos dias para recolhê-la; o mapa ocupa o espaço. A coluna dos lugares tem o mesmo chevron.',
  'help.guide.collapse-columns.step.2': 'Clique no chevron de novo para trazer a coluna de volta.',
  'help.guide.collapse-columns.step.3':
    'Arraste o divisor fino entre uma coluna e o mapa para mudar a largura da coluna.',
  'help.guide.collapse-columns.result': 'As larguras são lembradas; as colunas voltam abertas na próxima visita.',
  'help.guide.collapse-columns.tip.1': 'As duas colunas podem ser recolhidas ao mesmo tempo para uma visão só do mapa.',
  'help.guide.collapse-columns.tip.2':
    'No celular não há colunas: Plano e Lugares são os dois botões na parte de baixo do mapa.',
  // undo-change
  'help.guide.undo-change.title': 'Desfazer a última alteração',
  'help.guide.undo-change.goal': 'Reverta o que você acabou de fazer no plano.',
  'help.guide.undo-change.step.1':
    'Clique na seta de desfazer na barra de ferramentas acima dos dias; a dica dela nomeia a alteração que vai reverter.',
  'help.guide.undo-change.result': 'O plano volta a ser como era, e a seta fica cinza até a próxima alteração.',
  'help.guide.undo-change.tip.1':
    'Desfazer cobre o plano: atribuir, remover, reordenar e mover lugares, otimizar uma rota, excluir lugares, mudanças de categoria e importações.',
  'help.guide.undo-change.tip.2':
    'Tem um passo só de profundidade: apenas a última alteração pode ser revertida, e uma nova alteração a substitui.',

  // ── Screen: trip-places ───────────────────────────────────────────────────────────────
  'help.ctx.trip-places.title': 'Lugares',
  'help.ctx.trip-places.summary':
    'A coluna direita do plano: cada lugar da viagem, planejado ou não, com busca e filtros, e os jeitos de trazer lugares, à mão, de um arquivo ou de uma lista compartilhada.',
  'help.ctx.trip-places.bullet.1':
    'Adicionar lugar/atividade no topo abre o formulário de um lugar que você digita ou busca. Enquanto um dia está aberto o botão diz Novo local, e Para o dia, ao lado, cria o lugar direto nesse dia.',
  'help.ctx.trip-places.bullet.2':
    'Importar arquivo aceita arquivos .gpx, .kml e .kmz; Importar lista aceita uma lista compartilhada do Google Maps ou do Naver Maps. Um arquivo também pode simplesmente ser solto sobre a coluna.',
  'help.ctx.trip-places.bullet.3':
    'O menu suspenso alterna entre Todos, Não planejados, Planejados e, assim que uma trilha é importada, Trilhas; abaixo dele ficam a busca, o filtro de categoria e a estrela para uma avaliação mínima.',
  'help.ctx.trip-places.bullet.4':
    'Uma linha mostra imagem, nome e descrição ou endereço. Clique nela para ver os detalhes do lugar, arraste-a para um dia, ou clique com o botão direito para Editar, + Dia, Abrir site, Google Maps, Salvar na Coleção e Excluir.',
  'help.ctx.trip-places.bullet.5':
    'Com um dia aberto, um + no fim de uma linha não planejada põe o lugar nesse dia, e Planejados lista só esse dia, com Mostrar a viagem inteira para alargar de novo.',
  'help.ctx.trip-places.bullet.6':
    'O tique na ponta direita da linha de filtros inicia uma seleção: várias linhas de uma vez recebem uma nova categoria, vão para uma coleção ou são excluídas.',
  // create-place
  'help.guide.create-place.title': 'Criar um lugar',
  'help.guide.create-place.goal':
    'Adicione um lugar ou uma atividade à mão, com tudo o que o plano precisa saber sobre ele.',
  'help.guide.create-place.step.1':
    'Clique em Adicionar lugar/atividade no topo da coluna de lugares (Novo local enquanto um dia está aberto). O formulário abre.',
  'help.guide.create-place.step.2':
    'Digite o lugar em Buscar lugares... no topo e escolha um resultado. Nome, Endereço, Latitude, Longitude e Site se preenchem, e Detalhes do lugar, à esquerda, mostra imagens, o horário de funcionamento e uma descrição sobre ele. Num TREK com chave do Google, Não é o lugar certo? Pesquisar no Google fica embaixo da lista e refaz a mesma busca pelo Google.',
  'help.guide.create-place.step.3':
    'Em Detalhes do lugar, um clique numa imagem sob Escolher uma imagem a torna a imagem do lugar; Usar este texto leva a descrição para o formulário.',
  'help.guide.create-place.step.4':
    'Confira os campos: Nome é obrigatório; Descrição e Notas são suas; Endereço, Latitude e Longitude vêm da busca ou são digitados; Categoria escolhe uma das categorias da viagem, e o + ao lado cria uma nova na hora; Site recebe o link.',
  'help.guide.create-place.step.5':
    'Clique em Adicionar. Se já houver um lugar com o mesmo nome na viagem, o formulário avisa e o botão vira Adicionar mesmo assim.',
  'help.guide.create-place.result': 'O lugar está na lista e no mapa, em Não planejados até ser posto em um dia.',
  'help.guide.create-place.tip.1':
    'Arquivos e Custos no fim do formulário anexam um documento ao lugar, ou abrem o editor de Custos para a despesa dele logo depois de salvar.',
  'help.guide.create-place.tip.2':
    'O índice do TREK e o OpenStreetMap respondem à busca em qualquer TREK, e Detalhes do lugar se preenche com Wikipédia, Wikivoyage e Wikimedia. O Google só é consultado onde os dois vêm vazios, e só ele traz as avaliações.',
  'help.guide.create-place.tip.3':
    'Um lugar também pode começar no mapa: clique com o botão direito no ponto, e o formulário abre com as coordenadas e o endereço preenchidos.',
  // place-to-open-day
  'help.guide.place-to-open-day.title': 'Adicionar um lugar direto ao dia aberto',
  'help.guide.place-to-open-day.goal': 'Pule o segundo passo: crie ou escolha o lugar e ponha ele no dia de uma vez.',
  'help.guide.place-to-open-day.step.1':
    'Clique no cabeçalho de um dia na coluna dos dias. O dia está aberto: o cartão dele fica destacado, e a coluna de lugares ganha o botão Para o dia.',
  'help.guide.place-to-open-day.step.2':
    'Para o dia abre o mesmo formulário que Novo local, só que o lugar cai no dia aberto no momento em que você clica em Adicionar.',
  'help.guide.place-to-open-day.step.3':
    'Um lugar que já existe vai para o dia aberto com o + no fim da linha dele, ou com o botão direito, + Dia.',
  'help.guide.place-to-open-day.step.4':
    'O caminho inverso também funciona, e sem abrir um dia antes: arraste a linha do lugar para fora da coluna e solte-a em um cartão de dia. Solto entre duas paradas, ele fica exatamente ali.',
  'help.guide.place-to-open-day.result':
    'O lugar fica listado sob o dia, no fim; arraste-o para cima ou para baixo até onde ele pertence.',
  'help.guide.place-to-open-day.tip.1':
    'O dia aberto também guia a busca: com um dia aberto, o mapa e a busca por perto partem de onde esse dia já passa.',
  'help.guide.place-to-open-day.tip.2': 'Desfazer na barra de ferramentas acima dos dias reverte a atribuição.',
  // filter-places
  'help.guide.filter-places.title': 'Achar um lugar na lista',
  'help.guide.filter-places.goal': 'Estreite a coluna até os lugares que você procura.',
  'help.guide.filter-places.step.1':
    'O menu suspenso do topo alterna entre Todos, Não planejados (ainda em nenhum dia), Planejados (em um dia) e Trilhas (trilhas GPX importadas), cada um com sua contagem.',
  'help.guide.filter-places.step.2': 'Digite em Buscar lugares...; a lista estreita enquanto você digita.',
  'help.guide.filter-places.step.3':
    'Todas as categorias abre uma lista para marcar uma ou mais categorias, Sem categoria entre elas; Limpar filtro, no fim dela, a reinicia.',
  'help.guide.filter-places.step.4':
    'A estrela ao lado define uma avaliação mínima: 5+, 4+ e assim por diante mostram só lugares que você avaliou pelo menos tão alto.',
  'help.guide.filter-places.result': 'A contagem acima das linhas diz quantos lugares batem; os filtros se combinam.',
  'help.guide.filter-places.tip.1':
    'Com um dia aberto, Planejados lista só esse dia e avisa: Mostrando apenas o dia aberto, com Mostrar a viagem inteira ao lado.',
  'help.guide.filter-places.tip.2':
    'O mapa também estreita para o dia aberto; Todos na lista continua mostrando cada lugar da viagem.',
  // edit-place
  'help.guide.edit-place.title': 'Alterar um lugar',
  'help.guide.edit-place.goal': 'Corrija um nome, mova o pino, acrescente um site ou troque a categoria.',
  'help.guide.edit-place.step.1':
    'Clique com o botão direito na linha e escolha Editar, ou abra o lugar e clique em Editar nos detalhes dele.',
  'help.guide.edit-place.step.2':
    'Mude o que precisar: Nome, Descrição, Notas, Endereço, Latitude e Longitude, Categoria, Site. Aberto a partir de um dia, o formulário tem também Notas para este dia e Início e Fim para aquele dia.',
  'help.guide.edit-place.step.3': 'Clique em Atualizar.',
  'help.guide.edit-place.result':
    'A alteração vale em todo lugar em que ele aparece: a lista, o mapa e cada dia em que ele está.',
  'help.guide.edit-place.tip.1':
    'Notas para este dia pertence ao lugar naquele único dia; Notas pertence ao lugar em si.',
  'help.guide.edit-place.tip.2':
    'Um Fim antes do Início bloqueia Atualizar; Sobreposição de horário com: só avisa que outra parada do dia tem o mesmo horário.',
  // delete-place
  'help.guide.delete-place.title': 'Excluir um lugar',
  'help.guide.delete-place.goal': 'Tire um lugar da viagem de vez.',
  'help.guide.delete-place.step.1':
    'Clique com o botão direito na linha e escolha Excluir, ou clique em Excluir nos detalhes do lugar.',
  'help.guide.delete-place.step.2':
    'Confirme. Se uma noite foi reservada no lugar, ou se uma reserva está ligada a ele, a pergunta diz o que vai junto.',
  'help.guide.delete-place.result':
    'O lugar some da lista, do mapa e de cada dia; Desfazer na barra de ferramentas acima dos dias o traz de volta.',
  'help.guide.delete-place.tip.1': 'Para tirar um lugar de um dia só, use em vez disso Remover do dia naquela parada.',
  'help.guide.delete-place.tip.2': 'Vários lugares de uma vez: o tique ao lado dos filtros inicia uma seleção.',
  // select-places
  'help.guide.select-places.title': 'Alterar ou excluir vários lugares de uma vez',
  'help.guide.select-places.goal': 'Arrume a lista de uma só vez em vez de lugar por lugar.',
  'help.guide.select-places.step.1':
    'Clique no tique na ponta direita da linha de filtros. As linhas ganham caixas de seleção e aparece uma barra com as ações.',
  'help.guide.select-places.step.2':
    'Marque as linhas, ou use Selecionar tudo na barra; a barra conta o que está selecionado.',
  'help.guide.select-places.step.3':
    'Change category dá a todos uma mesma categoria; Salvar na Coleção os copia para uma das suas coleções; Excluir seleção os remove depois de uma confirmação.',
  'help.guide.select-places.step.4': 'Clique no tique de novo para sair da seleção.',
  'help.guide.select-places.result':
    'A alteração vale para cada lugar selecionado; uma exclusão pode ser desfeita na barra de ferramentas acima dos dias.',
  'help.guide.select-places.tip.1':
    'Os filtros continuam valendo enquanto você seleciona: filtre primeiro por Não planejados, e aí Selecionar tudo pega exatamente esses.',
  'help.guide.select-places.tip.2':
    'Marcar como visitado nas suas listas aparece na barra quando o addon Coleções está ligado: ele marca os lugares nas coleções em que estão salvos.',
  // import-places-file
  'help.guide.import-places-file.title': 'Importar lugares de um arquivo GPX, KML ou KMZ',
  'help.guide.import-places-file.goal': 'Traga o que o Google My Maps, o Google Earth ou um rastreador GPS exportou.',
  'help.guide.import-places-file.step.1':
    'Clique em Importar arquivo, ou solte o arquivo em qualquer ponto da coluna de lugares.',
  'help.guide.import-places-file.step.2':
    'Escolha o arquivo ou arraste-o para a caixa. Para um GPX, marque o que importar: Pontos de caminho, Rotas, Trilhas (com geometria de percurso); para KML e KMZ, Pontos (Placemarks) e Caminhos (LineStrings).',
  'help.guide.import-places-file.step.3':
    'A caixa aceita vários arquivos de uma vez, e só .gpx, .kml e .kmz. Outro tipo de arquivo, ou um acima de 10 MB, é recusado na janela e não é importado.',
  'help.guide.import-places-file.step.4':
    'Clique em Importar. Uma mensagem diz quantos lugares entraram; com um arquivo KML ou KMZ a janela continua aberta com um resumo do que foi criado e do que foi pulado.',
  'help.guide.import-places-file.result':
    'Os lugares estão na lista; uma trilha carrega um marcador de rota na linha dela, se desenha no mapa e ganha o próprio filtro Trilhas.',
  'help.guide.import-places-file.tip.1':
    'Um arquivo grande demais é recusado com o limite de tamanho; exporte de novo sem fotos, ou divida o arquivo.',
  'help.guide.import-places-file.tip.2':
    'A importação pode ser desfeita inteira na barra de ferramentas acima dos dias.',
  // import-places-list
  'help.guide.import-places-list.title': 'Importar uma lista compartilhada do Google Maps ou do Naver Maps',
  'help.guide.import-places-list.goal': 'Transforme o link de uma lista compartilhada em lugares.',
  'help.guide.import-places-list.step.1': 'Clique em Importar lista e escolha Lista Google ou Lista Naver.',
  'help.guide.import-places-list.step.2':
    'Cole o link compartilhado da lista. Um link de rotas do Google Maps também serve: as paradas dele viram lugares, na ordem do trajeto.',
  'help.guide.import-places-list.step.3': 'Clique em Importar.',
  'help.guide.import-places-list.result':
    'Cada lugar da lista está na viagem, com o nome que tem na lista; os lugares que já estão na viagem são pulados.',
  'help.guide.import-places-list.tip.1':
    'A lista precisa estar compartilhada publicamente; o link de uma lista privada não importa nada.',
  'help.guide.import-places-list.tip.2':
    'Enriquecer lugares via Google aparece na janela quando o seu TREK tem uma chave do Google: ele consulta cada lugar importado e completa fotos, endereço e detalhes.',

  // ── Screen: trip-days ─────────────────────────────────────────────────────────────────
  'help.ctx.trip-days.title': 'Dias',
  'help.ctx.trip-days.summary':
    'A coluna esquerda do plano: um cartão por dia com suas paradas em ordem, as notas, as reservas e os transportes do dia, e a rota entre as paradas. É aqui que a viagem é realmente planejada.',
  'help.ctx.trip-days.bullet.1':
    'A barra de ferramentas no topo: Exportar (PDF, calendário, GPX), Expand all days / Collapse all days, a seta Desfazer, Reordenar dias e Mostrar todas as rotas de reservas.',
  'help.ctx.trip-days.bullet.2':
    'Um cartão de dia: número, clima, título, data e o custo do dia no cabeçalho; clique no cabeçalho para abrir o dia, a setinha o dobra. Transporte público, Adicionar transporte e Adicionar nota também ficam no cabeçalho.',
  'help.ctx.trip-days.bullet.3':
    'Dentro de um dia: as paradas em ordem, cada uma com imagem, nome, horário e um cadeado sobre a imagem; as notas; as reservas que pertencem ao dia; e entre as paradas o tempo de viagem de cada trecho.',
  'help.ctx.trip-days.bullet.4':
    'Sob as paradas, a barra de rota: Rota desenha o dia no mapa, Otimizar ordena as paradas, De carro / A pé define o meio de transporte do dia, Abrir no Google Maps e Abrir no CoMaps entregam o dia.',
  'help.ctx.trip-days.bullet.5':
    'Os lugares chegam a um dia arrastando uma linha da coluna de lugares, com o + dessa linha, com Adicionar local a este dia num dia vazio, ou a partir dos detalhes do lugar.',
  'help.ctx.trip-days.bullet.6': 'Custo total, embaixo, soma cada parada e cada reserva com preço, na moeda da viagem.',
  // read-day-plan
  'help.guide.read-day-plan.title': 'Ler um dia',
  'help.guide.read-day-plan.goal': 'Saber o que cada parte de um cartão de dia diz antes de mudar qualquer coisa.',
  'help.guide.read-day-plan.step.1':
    'O cabeçalho: o número do dia, a previsão para o dia, Dia 1 ou o título que você deu, a data e o custo do dia. Clique no cabeçalho para abrir o dia (os Detalhes do dia se abrem sobre o mapa); a setinha à direita dobra e desdobra o cartão.',
  'help.guide.read-day-plan.step.2':
    'Uma parada: a alça à esquerda a arrasta, a imagem carrega um cadeado para a otimização da rota, depois o nome, a descrição e, se houver, as Notas para este dia. Um selo de horário mostra Início e Fim quando a parada os tem; as setas que aparecem na ponta direita a sobem ou a descem.',
  'help.guide.read-day-plan.step.3':
    'Uma reserva no dia: uma reserva numa parada marca a parada como Reserva confirmada ou Reserva pendente, e um transporte aparece como Partida ou Chegada com seu horário e seu trajeto, com um pequeno botão que desenha essa rota no mapa.',
  'help.guide.read-day-plan.step.4':
    'Entre duas paradas, o conector diz quanto tempo o trecho leva e qual é a distância, no meio de transporte do dia; clique nele para mudar o meio só daquele trecho.',
  'help.guide.read-day-plan.step.5':
    'A barra de rota no fim: Rota desenha o caminho do dia no mapa, Otimizar reordena as paradas, os botões de modo escolhem De carro ou A pé, Abrir no Google Maps e Abrir no CoMaps abrem o dia lá.',
  'help.guide.read-day-plan.result': 'Cada símbolo do cartão tem um significado; os guias abaixo mudam cada um deles.',
  'help.guide.read-day-plan.tip.1':
    'Clique com o botão direito numa parada para ver o menu dela: Editar, Remover do dia, Abrir site, os apps de navegação (Google Maps, Waze, Apple Maps, OpenStreetMap, CoMaps), Salvar na Coleção, Excluir.',
  'help.guide.read-day-plan.tip.2':
    'Passe o mouse sobre uma parada e Adicionar reserva aparece na ponta dela: uma reserva criada ali fica presa a esta parada neste dia.',
  // place-onto-day
  'help.guide.place-onto-day.title': 'Pôr um lugar em um dia',
  'help.guide.place-onto-day.goal': 'Transformar um lugar da lista numa parada do dia, onde ele cabe na ordem.',
  'help.guide.place-onto-day.step.1':
    'Arraste uma linha da coluna de lugares até o cartão do dia. Solte-a entre duas paradas para pô-la exatamente ali, ou em qualquer ponto do cartão para acrescentá-la no fim.',
  'help.guide.place-onto-day.step.2':
    'Sem arrastar: abra o dia clicando no cabeçalho, depois clique no + no fim da linha do lugar, ou clique com o botão direito na linha e escolha + Dia.',
  'help.guide.place-onto-day.step.3':
    'Num dia vazio, Adicionar local a este dia abre o formulário de lugar, e o novo lugar cai no dia na hora.',
  'help.guide.place-onto-day.step.4':
    'A partir dos detalhes de um lugar, Adicionar ao dia pergunta qual dia; a partir do cabeçalho do dia, Para o dia na coluna de lugares cria um lugar novo no dia aberto.',
  'help.guide.place-onto-day.result':
    'O lugar é uma parada do dia, no mapa com o número do dia, e a coluna de lugares o conta em Planejados.',
  'help.guide.place-onto-day.tip.1':
    'Um lugar pode estar em vários dias: ponha-o no segundo dia a partir da coluna de lugares. Arrastar uma parada de um cartão de dia para outro a move, em vez de copiar.',
  'help.guide.place-onto-day.tip.2': 'A seta Desfazer na barra de ferramentas desfaz a atribuição.',
  'help.guide.place-onto-day.tip.3':
    'Uma parada não pode ser solta entre duas entradas com horários fixos, nem antes de uma reserva que já tem horário; o plano mantém a cronologia.',
  // reorder-stops
  'help.guide.reorder-stops.title': 'Mudar a ordem de um dia',
  'help.guide.reorder-stops.goal': 'Subir ou descer uma parada, ou levá-la para outro dia.',
  'help.guide.reorder-stops.step.1': 'Arraste a parada pela alça até a nova posição no cartão.',
  'help.guide.reorder-stops.step.2':
    'Ou use as setas na ponta direita da parada: um passo para cima ou para baixo por clique.',
  'help.guide.reorder-stops.step.3':
    'Arraste a parada para outro cartão de dia para movê-la para lá; ela sai do dia antigo.',
  'help.guide.reorder-stops.step.4':
    'Uma parada com horário fixo pergunta Remover horário? quando mover ela quebraria a ordem do dia, porque o horário decidia o lugar dela: Confirmar tira o horário e a deixa ir para qualquer ponto.',
  'help.guide.reorder-stops.result': 'A rota e os tempos de viagem seguem a nova ordem na hora.',
  'help.guide.reorder-stops.tip.1':
    'Reservas com horário fixo não podem ser reordenadas; ficam onde o horário delas as põe.',
  'help.guide.reorder-stops.tip.2':
    'Otimizar, na barra de rota, ordena o dia inteiro pelo caminho mais curto; trave antes uma parada para mantê-la onde está.',
  // set-stop-times
  'help.guide.set-stop-times.title': 'Dar um horário a uma parada',
  'help.guide.set-stop-times.goal': 'Fixar quando uma parada começa e termina, para o dia se ler como uma programação.',
  'help.guide.set-stop-times.step.1':
    'Clique com o botão direito na parada e escolha Editar. Aberto a partir do dia, o formulário tem Início e Fim embaixo.',
  'help.guide.set-stop-times.step.2':
    'Preencha Início e, se quiser, Fim. Sobreposição de horário com: avisa que outra parada do dia com horário se sobrepõe; um Fim antes do Início bloqueia Atualizar.',
  'help.guide.set-stop-times.step.3':
    'Clique em Atualizar. A parada ganha um selo de horário e vai para onde o horário dela cabe no dia.',
  'help.guide.set-stop-times.result':
    'Paradas com horário mantêm o lugar na ordem; paradas sem horário se organizam em volta delas.',
  'help.guide.set-stop-times.tip.1':
    'O horário pertence à parada naquele dia; o mesmo lugar em outro dia pode ter outro horário.',
  'help.guide.set-stop-times.tip.2':
    'Para mover à mão uma parada com horário, arraste-a: a pergunta Remover horário? tira o horário no caminho, assim que você clica em Confirmar.',
  'help.guide.set-stop-times.tip.3':
    'O campo Notas para este dia, no mesmo formulário, guarda o que vale só neste dia, uma mesa reservada, um número de ingresso.',
  // remove-from-day
  'help.guide.remove-from-day.title': 'Tirar uma parada de um dia',
  'help.guide.remove-from-day.goal': 'Desplanejar um lugar sem excluí-lo da viagem.',
  'help.guide.remove-from-day.step.1': 'Clique com o botão direito na parada e escolha Remover do dia.',
  'help.guide.remove-from-day.step.2':
    'A parada saiu do dia; o lugar continua na coluna de lugares, em Não planejados se não estiver em nenhum outro dia.',
  'help.guide.remove-from-day.result':
    'O dia, sua rota e seu custo se atualizam; a seta Desfazer traz a parada de volta.',
  'help.guide.remove-from-day.tip.1': 'Excluir, no mesmo menu, tira o lugar da viagem inteira, em todos os dias.',
  'help.guide.remove-from-day.tip.2':
    'Remover do dia também fica no painel de detalhes do lugar, ao lado de Adicionar ao dia.',
  // lock-stop
  'help.guide.lock-stop.title': 'Travar uma parada no lugar',
  'help.guide.lock-stop.goal': 'Manter uma parada onde está quando a rota é otimizada.',
  'help.guide.lock-stop.step.1':
    'Passe o mouse sobre a imagem da parada e clique no cadeado: Manter posição durante a otimização da rota.',
  'help.guide.lock-stop.step.2':
    'Otimizar agora ordena as outras paradas em volta dela; clique no cadeado de novo (Clique para desbloquear) para soltá-la.',
  'help.guide.lock-stop.result': 'O cadeado aparece na imagem; a parada mantém a posição até você destravá-la.',
  'help.guide.lock-stop.tip.1':
    'Uma parada com horário fixo está travada pelo horário; ela nunca se move durante a otimização.',
  'help.guide.lock-stop.tip.2':
    'A trava vale para esta visita: depois de recarregar, cada parada está livre de novo, só as paradas com horário continuam fixas.',
  // day-note
  'help.guide.day-note.title': 'Adicionar uma nota a um dia',
  'help.guide.day-note.goal': 'Guardar um lembrete, um número de ingresso ou um plano B dentro do dia.',
  'help.guide.day-note.step.1': 'Clique em Adicionar nota no cabeçalho do dia.',
  'help.guide.day-note.step.2':
    'Dê um nome em Nota, é isso que aparece no dia, e escreva o resto em Nota do dia. A barra de ferramentas acima formata o texto (Negrito, Lista com marcadores, Link, Citação), e Pré-visualização, à esquerda, mostra como a nota vai ficar no dia.',
  'help.guide.day-note.step.3': 'Escolha um Ícone e uma Cor, para a nota se destacar das paradas, e então Adicionar.',
  'help.guide.day-note.step.4':
    'A nota fica no dia como uma parada: arraste-a para o lugar certo, clique com o botão direito para Editar e Excluir.',
  'help.guide.day-note.result':
    'A nota faz parte do dia, no PDF também; uma nota com horário se ordena junto com as paradas com horário.',
  'help.guide.day-note.tip.1':
    'Uma nota com horário pode fazer as vezes de um transporte para o qual você não tem reserva: “08:15 S3 da estação central”.',
  'help.guide.day-note.tip.2': 'As notas são por dia; uma nota para a viagem inteira pertence ao Colab.',
  // day-route
  'help.guide.day-route.title': 'Mostrar e otimizar a rota do dia',
  'help.guide.day-route.goal':
    'Ver o caminho entre as paradas, escolher como você viaja e deixar o TREK ordenar a sequência.',
  'help.guide.day-route.step.1':
    'Abra o dia e clique em Rota na barra de rota: o caminho entre as paradas é desenhado no mapa, e os conectores entre as paradas mostram o tempo e a distância de cada trecho.',
  'help.guide.day-route.step.2':
    'De carro e A pé, ao lado, definem o meio de transporte do dia; os trechos são recalculados. Plugins podem acrescentar meios próprios.',
  'help.guide.day-route.step.3':
    'Clique num conector para mudar o meio só daquele trecho: escolha um meio, ou Usar padrão do dia para voltar ao do dia.',
  'help.guide.day-route.step.4':
    'Otimizar reordena as paradas pelo caminho mais curto. Paradas com cadeado ou com horário fixo mantêm o lugar; com uma hospedagem no dia, a rota começa ali.',
  'help.guide.day-route.step.5':
    'Abrir no Google Maps ou Abrir no CoMaps abre o dia inteiro como rota naquele aplicativo, para navegar no caminho.',
  'help.guide.day-route.result':
    'O dia é uma rota com horários; Custo total e os trechos se atualizam conforme a ordem muda.',
  'help.guide.day-route.tip.1':
    'As rotas vêm do OSRM por padrão; o administrador pode apontar o TREK para outro motor de rotas em Padrões do usuário.',
  'help.guide.day-route.tip.2':
    'Um trecho que não pôde ser calculado não mostra tempo; confira se as duas paradas têm coordenadas.',
  'help.guide.day-route.tip.3': 'A seta Desfazer desfaz uma otimização.',
  // manage-days
  'help.guide.manage-days.title': 'Adicionar, reordenar e renomear dias',
  'help.guide.manage-days.goal': 'Dar forma aos dias em si, não só ao que está neles.',
  'help.guide.manage-days.step.1':
    'Os dias vêm das datas da viagem; mude as datas no cartão da viagem no Painel e os dias são acrescentados ou retirados nas pontas. Antes que um dia com conteúdo seja retirado, uma lista mostra quais dias saem e o que há neles.',
  'help.guide.manage-days.step.2':
    'Reordenar dias, na barra de ferramentas, abre uma lista: Mover para cima e Mover para baixo deslocam um dia com tudo o que há nele, e Excluir dia, a lixeira ao lado, o remove. Abaixo da lista, o botão com a próxima data acrescenta um dia logo depois do último com data e estende a viagem em um dia; Sem data acrescenta um dia sem data no fim.',
  'help.guide.manage-days.step.3':
    'Excluir dia pergunta antes: a lista mostra o que sai junto com o dia, seus lugares, notas e reservas, uma hospedagem com check-in ou check-out nesse dia e os dias que avançam uma data. Excluir dia o remove, Cancelar o mantém; o último dia não pode ser excluído.',
  'help.guide.manage-days.step.4':
    'Para renomear um dia, abra-o e clique no lápis ao lado do título nos Detalhes do dia sobre o mapa; o nome substitui Dia 1 no cartão e no PDF.',
  'help.guide.manage-days.step.5':
    'Expand all days e Collapse all days, na barra de ferramentas, dobram todos os cartões de uma vez; um cartão sozinho dobra com a própria setinha.',
  'help.guide.manage-days.result':
    'As datas ficam com a posição: um dia que sobe assume a data anterior, e suas paradas, notas e reservas viajam junto.',
  'help.guide.manage-days.tip.1': 'Mover dias pode ser desfeito pela barra de ferramentas; excluir um dia, não.',
  'help.guide.manage-days.tip.2':
    'O custo no cabeçalho de um dia soma as paradas e reservas daquele dia que carregam um preço.',
  // bookings-in-plan
  'help.guide.bookings-in-plan.title': 'Ler reservas e transportes no plano',
  'help.guide.bookings-in-plan.goal': 'Saber onde uma reserva aparece depois que existe, e qual tela a cria.',
  'help.guide.bookings-in-plan.step.1':
    'Um transporte (Voo, Trem, Balsa, Ônibus, Carro) aparece no dia em que parte como Partida e no dia em que chega como Chegada, com horário e trajeto; um de vários dias se estende pelos dias no meio.',
  'help.guide.bookings-in-plan.step.2':
    'Uma reserva presa a uma parada (um Restaurante, um Passeio) marca aquela parada como Reserva confirmada ou Reserva pendente; uma reserva com dia mas sem parada vira uma linha própria no dia.',
  'help.guide.bookings-in-plan.step.3':
    'Uma noite de hotel é uma hospedagem: fica nos Detalhes do dia em Hospedagem, do Check-in ao Check-out, e a rota de cada um desses dias começa ali.',
  'help.guide.bookings-in-plan.step.4':
    'No mapa, o botão numa linha de transporte desenha a rota dele; Mostrar todas as rotas de reservas, na barra de ferramentas, desenha todas.',
  'help.guide.bookings-in-plan.step.5':
    'Para criar: Adicionar reserva numa parada sob o mouse, Adicionar transporte e Transporte público no cabeçalho do dia, e as abas Reservas e Transportes para a lista completa com importação e arquivos.',
  'help.guide.bookings-in-plan.result':
    'Uma reserva, um lugar no plano; as abas são as mesmas reservas em forma de lista.',
  'help.guide.bookings-in-plan.tip.1':
    'Confirmada e Pendente é um status que você põe na reserva; o plano o mostra na parada, a aba Reservas conta as duas.',
  'help.guide.bookings-in-plan.tip.2':
    'Um transporte com horário fixo não pode ser arrastado; em vez disso, mude o horário dele na reserva.',
  // export-plan
  'help.guide.export-plan.title': 'Exportar o plano',
  'help.guide.export-plan.goal': 'Levar o plano junto como documento, para o seu calendário ou para um GPS.',
  'help.guide.export-plan.step.1': 'Clique em Exportar na barra de ferramentas acima dos dias.',
  'help.guide.export-plan.step.2':
    'Documento: PDF abre a visualização de impressão de cada dia com suas paradas, notas e reservas; Quebra de página por dia começa cada dia numa página nova, Salvar como PDF baixa o arquivo.',
  'help.guide.export-plan.step.3':
    'Calendário: Baixar .ics salva as reservas como arquivo de calendário; Assinar calendário dá um link que o seu aplicativo de calendário atualiza sozinho.',
  'help.guide.export-plan.step.4':
    'Mapas e GPS · GPX: Viagem inteira exporta lugares, rotas dos dias e trilhas; Somente lugares, os pontos; Dias como rotas, uma rota por dia, para mapas offline e aparelhos de GPS.',
  'help.guide.export-plan.result': 'O arquivo é baixado; nada muda na viagem.',
  'help.guide.export-plan.tip.1':
    'Um dia sozinho vai para um aplicativo de mapas pela barra de rota dele: Abrir no Google Maps ou Abrir no CoMaps.',
  'help.guide.export-plan.tip.2':
    'Assinar calendário precisa dos feeds de calendário ligados nas suas configurações; o Painel tem um guia para isso.',
  'help.guide.export-plan.tip.3': 'Exportar é ler: todo membro da viagem pode fazer isso.',

  // ── Screen: trip-place ────────────────────────────────────────────────────────────────
  'help.ctx.trip-place.title': 'Detalhes do lugar',
  'help.ctx.trip-place.summary':
    'O painel que abre sobre o mapa quando você escolhe um lugar: tudo o que a viagem sabe dele, as estrelas que cada um deu, a imagem e os arquivos dele, e os botões que o põem no dia aberto, numa lista ou num aplicativo de mapas.',
  'help.ctx.trip-place.bullet.1':
    'Clique numa linha da coluna de lugares, numa parada dentro de um dia ou num marcador do mapa, e o painel abre sobre o mapa. Escolhê-lo dentro de um dia diz ao painel de qual parada você fala, e é isso que traz junto os participantes da parada e a reserva dela.',
  'help.ctx.trip-place.bullet.2':
    'O cabeçalho traz a imagem redonda, o nome, a categoria, o endereço e as coordenadas. Clique na imagem para usar uma sua, dê um duplo clique no nome para renomear o lugar na hora, e o X à direita fecha o painel.',
  'help.ctx.trip-place.bullet.3':
    'Abaixo dele: o preço se houver, as estrelas que cada viajante deu ao lugar, a descrição e as notas, e Notas para este dia quando a parada tem alguma.',
  'help.ctx.trip-place.bullet.4':
    'Horário de funcionamento, Cor da trilha, Dados da trilha e Arquivos vêm em seguida, conforme se apliquem. Arquivos aceita qualquer coisa das suas pastas e também lista o que está preso à reserva desta parada.',
  'help.ctx.trip-place.bullet.5':
    'A linha de baixo: Adicionar ao dia ou Remover do dia enquanto um dia está aberto, depois Salvar na Coleção, Navegação, Abrir site, Editar e Excluir.',
  'help.ctx.trip-place.bullet.6':
    'Um lugar escolhido na busca carrega o que o índice do TREK ou o OpenStreetMap sabem dele: um anel verde Aberto ou vermelho Fechado em volta da imagem, julgado pelo relógio do próprio lugar, o telefone abaixo das estrelas, Horário de funcionamento mais abaixo com a linha do dia na fileira e a semana inteira atrás de um clique, e o site dele atrás de Abrir site. A avaliação do Google só aparece num lugar encontrado pelo Google, num TREK com uma chave do Google.',
  // read-place
  'help.guide.read-place.title': 'O que o painel conta sobre um lugar',
  'help.guide.read-place.goal': 'Leia tudo o que a viagem sabe de um lugar, num painel só.',
  'help.guide.read-place.step.1':
    'Na coluna dos dias, clique na parada que você quer ler. O painel abre sobre o mapa e a parada continua marcada no dia dela.',
  'help.guide.read-place.step.2':
    'O cabeçalho: a imagem redonda, o nome, o endereço e as coordenadas exatas. Um anel verde com Aberto, ou vermelho com Fechado, em volta da imagem diz se o lugar está aberto agora, pelo relógio dele, assim que o TREK conhece o horário. O X à direita fecha o painel de novo.',
  'help.guide.read-place.step.3':
    'Abaixo, as estrelas que cada viajante deu ao lugar, com a média e quantos votaram. Ainda sem avaliações enquanto ninguém votou. Logo abaixo, o telefone, onde o lugar tem um: um clique nele entrega o número ao seu aplicativo de telefone.',
  'help.guide.read-place.step.4':
    'Depois a descrição e, abaixo dela, as notas. As duas são o texto do formulário do lugar, renderizado: listas, links e negrito funcionam.',
  'help.guide.read-place.step.5': 'Participantes diz quem vai a esta parada. Estão todos dentro até você tirar alguém.',
  'help.guide.read-place.step.6':
    'Horário de funcionamento, mais abaixo: a linha carrega o horário do dia que você está vendo, e um clique nela desdobra a semana inteira com esse dia em negrito. Arquivos fica ao lado.',
  'help.guide.read-place.result':
    'O painel fica aberto até você fechá-lo com o X ou escolher outro lugar, o horário da semana continua desdobrado, e a parada a que ele pertence continua marcada na coluna dos dias.',
  'help.guide.read-place.tip.1':
    'Escolhido pela coluna de lugares, o painel conhece o lugar mas não uma parada, então não mostra participantes nem reserva. Escolha a parada dentro do dia e os dois aparecem.',
  'help.guide.read-place.tip.2':
    'Dê um duplo clique no nome para renomear o lugar sem abrir o formulário. Enter salva, Esc descarta a mudança.',
  'help.guide.read-place.tip.3':
    'Um lugar digitado à mão não mostra nada disso: o painel só conhece o que o formulário dele guarda. Abra-o com Editar, escolha-o nas sugestões abaixo de Buscar lugares… e clique em Atualizar, e o horário, o telefone e o site vêm junto. A avaliação do Google precisa de uma chave do Google.',
  // rate-place
  'help.guide.rate-place.title': 'Avaliar um lugar',
  'help.guide.rate-place.goal': 'Dê a um lugar as suas estrelas, e veja o que todos os outros deram.',
  'help.guide.rate-place.step.1':
    'Abra o lugar. A linha de estrelas fica logo abaixo do cabeçalho e traz a média dos votos até agora, com o número deles entre parênteses.',
  'help.guide.rate-place.step.2':
    'Clique na estrela que você quer. As estrelas se enchem enquanto você passa por elas, então você vê o que está prestes a dar.',
  'help.guide.rate-place.step.3':
    'Seu voto entra na média na hora, e os rostos ao lado são quem votou. Deixe o ponteiro sobre a linha para ver as estrelas de cada um.',
  'help.guide.rate-place.step.4':
    'A mesma média fica na linha do lugar na coluna de lugares, assim os bons se destacam na lista.',
  'help.guide.rate-place.result':
    'Suas estrelas ficam no lugar à vista da viagem inteira, e a estrela da linha de filtros acima da lista já pode deixar só os lugares que alcançam um mínimo.',
  'help.guide.rate-place.tip.1':
    'Todo viajante pode avaliar, mesmo numa viagem em que só alguns têm a permissão Adicionar / editar / excluir lugares.',
  'help.guide.rate-place.tip.2':
    'Clique na estrela que você já deu para retirar seu voto. Sem ninguém votando, o lugar volta a dizer Ainda sem avaliações.',
  'help.guide.rate-place.tip.3':
    'Cabem até seis votantes como rostos ao lado das estrelas; a dica nomeia todos eles, e marca o seu.',
  // place-image
  'help.guide.place-image.title': 'Pôr a sua própria imagem num lugar',
  'help.guide.place-image.goal': 'Troque a miniatura automática por uma foto sua.',
  'help.guide.place-image.step.1': 'Abra o lugar pela coluna de lugares.',
  'help.guide.place-image.step.2':
    'Deixe o ponteiro sobre a imagem redonda do cabeçalho: aparece uma câmera e a dica diz Enviar imagem. Clique nela e escolha o seu arquivo.',
  'help.guide.place-image.step.3': 'O cabeçalho mostra agora a sua imagem, com um X vermelho pequeno no canto.',
  'help.guide.place-image.step.4':
    'A mesma imagem fica na linha do lugar na coluna de lugares, e no marcador dele no mapa.',
  'help.guide.place-image.result':
    'A sua imagem é a imagem do lugar em toda parte: o painel, a coluna de lugares, a parada no dia, o marcador no mapa e uma viagem compartilhada.',
  'help.guide.place-image.tip.1': 'JPG, PNG, GIF e WebP são aceitos, e um HEIC de iPhone é convertido na entrada.',
  'help.guide.place-image.tip.2':
    'O X do canto tira a sua imagem de novo e a automática volta. O lugar em si fica intocado.',
  'help.guide.place-image.tip.3':
    'Sem uma imagem sua, o TREK procura uma a partir das coordenadas do lugar, e recorre ao ícone da categoria.',
  // place-day-assign
  'help.guide.place-day-assign.title': 'Pôr o lugar no dia aberto, ou tirá-lo',
  'help.guide.place-day-assign.goal': 'Use o botão do próprio painel em vez de arrastar a linha pelo planejador.',
  'help.guide.place-day-assign.step.1':
    'Clique no cabeçalho de um dia na coluna dos dias. Esse dia agora é o aberto, e o painel trabalha com ele.',
  'help.guide.place-day-assign.step.2':
    'Clique na coluna de lugares num lugar que não está nesse dia. O painel dele abre e a linha de baixo oferece Adicionar ao dia.',
  'help.guide.place-day-assign.step.3':
    'Clique em Adicionar ao dia. A parada cai no fim do dia e o botão vira Remover do dia.',
  'help.guide.place-day-assign.step.4':
    'A parada está no dia agora, a última da lista. Arraste-a para cima até o lugar dela.',
  'help.guide.place-day-assign.step.5':
    'Remover do dia tira essa parada do dia de novo, e o painel oferece Adicionar ao dia mais uma vez.',
  'help.guide.place-day-assign.result':
    'O dia carrega a parada, ou não a carrega mais, e o lugar em si fica intocado nos dois casos.',
  'help.guide.place-day-assign.tip.1':
    'O botão só existe enquanto um dia está aberto. Sem um dia, o painel não tem a que adicionar o lugar.',
  'help.guide.place-day-assign.tip.2':
    'Tirar uma parada de um dia deixa o lugar na viagem e na coluna de lugares. Excluir é o que o remove de toda parte.',
  'help.guide.place-day-assign.tip.3':
    'Uma parada que uma reserva de hospedagem pôs no dia não oferece nenhum dos dois botões: essa noite é adicionada e removida no bloco Hospedagem do dia.',
  // place-participants
  'help.guide.place-participants.title': 'Dizer quem vai a esta parada',
  'help.guide.place-participants.goal': 'Divida o grupo para uma parada sem dividir a viagem.',
  'help.guide.place-participants.step.1':
    'Clique na parada dentro do dia. O painel abre e Participantes lista todo mundo da viagem.',
  'help.guide.place-participants.step.2':
    'Clique no nome de um viajante para tirá-lo desta parada. O nome fica riscado quando você passa por cima.',
  'help.guide.place-participants.step.3':
    'Um + tracejado aparece assim que alguém falta. Clique nele para ver quem não está na parada.',
  'help.guide.place-participants.step.4':
    'Clique num nome para devolvê-lo. Com todos de volta, a parada é do grupo inteiro outra vez.',
  'help.guide.place-participants.result':
    'A parada leva os viajantes que você escolheu, e o resto do grupo tem aquela tarde para si.',
  'help.guide.place-participants.tip.1':
    'Participantes só aparece com uma parada selecionada, então escolha o lugar dentro do dia e não na coluna de lugares, e só numa viagem com mais de um viajante.',
  'help.guide.place-participants.tip.2':
    'Ninguém escolhido quer dizer que vão todos, e é por isso que o último viajante que sobra numa parada não pode ser tirado.',
  'help.guide.place-participants.tip.3':
    'Um convidado, que não tem conta própria, pode ser participante como qualquer outro.',
  // place-booking
  'help.guide.place-booking.title': 'A reserva de uma parada',
  'help.guide.place-booking.goal': 'Leia a reserva que pertence a uma parada, abra-a, e prenda uma nova a ela.',
  'help.guide.place-booking.step.1':
    'Abra a parada a que a reserva pertence. O painel mostra uma faixa com Confirmada ou Pendente e o nome da reserva.',
  'help.guide.place-booking.step.2':
    'A faixa traz a Data, a Hora e o Código da reserva, e as notas que a reserva tiver.',
  'help.guide.place-booking.step.3': 'Clique na faixa. O formulário da própria reserva abre sobre ela.',
  'help.guide.place-booking.step.4':
    'Vincular à atribuição do dia é o que prende uma reserva a uma parada, e aqui já nomeia esta. Feche o formulário de novo.',
  'help.guide.place-booking.step.5':
    'Uma reserva nova para uma parada começa na coluna dos dias: passe o ponteiro pela parada e clique no + no fim dela. O formulário abre como Nova reserva, já vinculada a ela.',
  'help.guide.place-booking.result':
    'A reserva fica presa à parada: está no painel, está no dia, e os arquivos dela também aparecem aqui sob Arquivos.',
  'help.guide.place-booking.tip.1':
    'A faixa só aparece na parada a que a reserva está presa. Uma reserva sem parada mora na aba Reservas.',
  'help.guide.place-booking.tip.2':
    'Várias reservas podem dividir uma parada: o almoço e o passeio que sai da mesma porta.',
  'help.guide.place-booking.tip.3':
    'Um trem, um voo ou uma balsa abre em vez disso o formulário de transporte, o mesmo que a aba Transportes usa.',
  // place-files
  'help.guide.place-files.title': 'Guardar os ingressos de um lugar junto do lugar',
  'help.guide.place-files.goal': 'Ponha o ingresso, o voucher ou o mapa de um lugar onde você vai procurar por ele.',
  'help.guide.place-files.step.1':
    'Abra o lugar. Arquivos fica no pé do painel e diz Arquivos enquanto o lugar não tem nenhum.',
  'help.guide.place-files.step.2': 'Clique em Enviar ao lado e escolha o arquivo.',
  'help.guide.place-files.step.3': 'O botão conta o que o lugar guarda, e a lista se abre sozinha.',
  'help.guide.place-files.step.4':
    'Cada linha é o nome do arquivo com o tamanho dele. Clique nela para abrir o arquivo.',
  'help.guide.place-files.result':
    'O arquivo fica no lugar, contado no painel, e também está na aba Arquivos da viagem.',
  'help.guide.place-files.tip.1':
    'Arquivos lista também o que está preso à reserva desta parada, então uma confirmação de hotel aparece no hotel.',
  'help.guide.place-files.tip.2': 'Enviar aceita vários arquivos de uma vez.',
  'help.guide.place-files.tip.3':
    'Sem a permissão Enviar arquivos o botão Enviar não está lá; os arquivos que já estão no lugar continuam.',
  // place-navigation
  'help.guide.place-navigation.title': 'Abrir um lugar num aplicativo de mapas ou no site dele',
  'help.guide.place-navigation.goal': 'Entregue o lugar ao aplicativo que vai mesmo te levar até lá.',
  'help.guide.place-navigation.step.1': 'Abra o lugar e clique em Navegação na linha de baixo.',
  'help.guide.place-navigation.step.2':
    'A lista são os aplicativos de mapas que servem para este lugar: Google Maps, Waze, Apple Maps, OpenStreetMap e CoMaps.',
  'help.guide.place-navigation.step.3':
    'Clique no que você usa. O TREK entrega a ele o lugar em si onde dá, não só um par de coordenadas, assim você chega na entrada certa.',
  'help.guide.place-navigation.step.4':
    'Abrir site, ao lado, abre a página do próprio lugar, os horários e os ingressos dele, numa nova aba.',
  'help.guide.place-navigation.result':
    'O aplicativo de mapas abre no lugar, o site numa aba própria, e nada muda na viagem.',
  'help.guide.place-navigation.tip.1':
    'O Waze começa a navegar na hora. Os outros abrem o lugar, e partir dali é mais um toque.',
  'help.guide.place-navigation.tip.2':
    'Quais aplicativos são oferecidos depende do lugar e do seu aparelho: o Apple Maps fica de fora no Android, o 高德地图 só aparece para um lugar na China, e Waze, Apple Maps e CoMaps precisam das coordenadas do lugar.',
  'help.guide.place-navigation.tip.3': 'Quando só um aplicativo serve, o botão leva o nome dele e o abre direto.',
  // place-to-collection
  'help.guide.place-to-collection.title': 'Salvar um lugar numa das suas listas',
  'help.guide.place-to-collection.goal': 'Guarde para a próxima viagem um lugar que você achou nesta.',
  'help.guide.place-to-collection.step.1': 'Abra o lugar e clique em Salvar na Coleção no fim do painel.',
  'help.guide.place-to-collection.step.2':
    'Salvar na lista mostra todas as listas que são suas ou que você compartilha. Um tique marca as que já têm este lugar.',
  'help.guide.place-to-collection.step.3': 'Clique na lista. O lugar entra nela na hora.',
  'help.guide.place-to-collection.step.4': 'Feche, e o botão do painel diz Salvo.',
  'help.guide.place-to-collection.result':
    'O lugar está na sua lista com a imagem, as notas e o endereço dele, pronto para a próxima viagem.',
  'help.guide.place-to-collection.tip.1':
    'O botão só está lá enquanto o complemento Coleções estiver ligado, o que o administrador liga em Complementos.',
  'help.guide.place-to-collection.tip.2':
    'Um lugar pode estar em várias listas ao mesmo tempo, com um status próprio em cada uma: uma Ideia numa, Visitado noutra.',
  'help.guide.place-to-collection.tip.3':
    'Marcar como visitado, ao lado do nome do lugar no seletor, o marca na lista; com o lugar em várias das suas listas a pílula diz Visitado em todas e resolve todas de uma vez.',
  // place-track
  'help.guide.place-track.title': 'Ler uma trilha e dar a ela uma cor própria',
  'help.guide.place-track.goal':
    'Veja o comprimento de uma caminhada importada, e distinga a linha dela das outras no mapa.',
  'help.guide.place-track.step.1':
    'Na coluna de lugares, a linha de uma trilha traz um traço curto na cor em que o traçado dela é desenhado. Clique nela.',
  'help.guide.place-track.step.2':
    'Dados da trilha dá o comprimento do caminho, na Unidade de distância que você definiu.',
  'help.guide.place-track.step.3': 'Cor da trilha, acima, mostra a cor em uso. Clique na linha para abrir as amostras.',
  'help.guide.place-track.step.4': 'Escolha uma cor. O traçado no mapa e o traço da linha mudam junto.',
  'help.guide.place-track.step.5':
    'A célula tracejada à esquerda, Cor automática, devolve à trilha a cor que ela herda; o conta-gotas à direita abre o seletor de cores do seu sistema para qualquer outra.',
  'help.guide.place-track.result':
    'A trilha é desenhada na cor que você escolheu, no painel, na linha dela na coluna de lugares e no mapa.',
  'help.guide.place-track.tip.1':
    'Só um lugar que carrega um caminho, importado de um arquivo GPX, KML ou KMZ, tem esses dois blocos.',
  'help.guide.place-track.tip.2':
    'Uma trilha gravada com altitudes mostra também o ponto mais alto e o mais baixo, os metros de subida e de descida, e o perfil da caminhada.',
  'help.guide.place-track.tip.3':
    'Uma importação dá a cada trilha que traz uma cor própria, assim duas caminhadas nunca chegam na mesma.',
  // read-place
  'help.guide.read-place.step.7':
    'A linha de baixo é o que você pode fazer daqui: tirar o lugar do dia aberto ou pô-lo nele, salvá-lo numa lista, abri-lo num aplicativo de mapas, editá-lo ou excluí-lo.',

  // ── Screen: trip-files ────────────────────────────────────────────────────────────────
  'help.ctx.trip-files.title': 'Arquivos',
  'help.ctx.trip-files.summary':
    'Todo documento da viagem em uma lista: passagens, confirmações, passes e fotos, cada um com uma nota, um vínculo ao lugar ou à reserva a que pertence, e uma lixeira de onde pode voltar.',
  'help.ctx.trip-files.bullet.1':
    'Solte os arquivos aqui, no topo, recebe os arquivos; um clique na caixa abre o seletor de arquivos. A linha embaixo dela lista os tipos de arquivo que este TREK aceita e o limite de 50 MB por arquivo.',
  'help.ctx.trip-files.bullet.2':
    'As abas dizem o que a lista mostra: Todos, PDFs, Imagens e Documentos, cada uma com a sua contagem. Uma aba de estrela entra assim que um arquivo é favoritado, Notas Colab assim que uma nota carrega um anexo.',
  'help.ctx.trip-files.bullet.3':
    'Uma linha traz quem a enviou, o nome, a nota embaixo, o tamanho e a data, e um selo por vínculo: Plano do dia e o lugar, Reserva ou Transporte e a reserva, Das notas Colab.',
  'help.ctx.trip-files.bullet.4':
    'No fim de uma linha ficam Favoritar, Atribuir, Abrir, Baixar e Excluir. Excluir não pergunta: o arquivo vai para a lixeira, de onde pode ser trazido de volta.',
  'help.ctx.trip-files.bullet.5':
    'Uma imagem ou um vídeo abre em tela cheia, com as teclas de seta e uma faixa de miniaturas; qualquer outro documento abre numa prévia sobre a página, com Abrir em nova aba e Baixar. Um passe de wallet é baixado na hora.',
  'help.ctx.trip-files.bullet.6':
    'Lixeira, na ponta direita, passa a lista para os arquivos excluídos, onde cada um é restaurado ou excluído para sempre e Esvaziar lixeira tira todos. Onde um administrador conectou um repositório de documentos, Sincronização de documentos fica ao lado.',
  // files-upload
  'help.guide.files-upload.title': 'Colocar um documento na viagem',
  'help.guide.files-upload.goal':
    'Tire uma passagem, uma confirmação ou uma foto da sua pasta de downloads e ponha na viagem, onde todo mundo que está nela pode alcançá-los.',
  'help.guide.files-upload.step.1':
    'Abra a viagem e clique em Arquivos na barra de abas. Os documentos da viagem estão listados ali, com a caixa de envio acima deles.',
  'help.guide.files-upload.step.2':
    'Clique em Solte os arquivos aqui e escolha um ou vários arquivos. Eles são enviados um depois do outro e a caixa mostra Enviando... enquanto isso corre. A linha embaixo da caixa diz quais tipos este TREK aceita, e que um arquivo pode ter no máximo 50 MB.',
  'help.guide.files-upload.step.3':
    'Assim que o último arquivo sobe, Atribuir arquivo abre sozinho para ele. Adicione uma nota... dá ao arquivo uma linha própria, e as listas abaixo o prendem a um lugar ou a uma reserva. Feche com o ×; fechando não se perde nada.',
  'help.guide.files-upload.step.4':
    'Os arquivos novos ficam no topo da lista. Uma linha mostra quem o enviou, o nome, o tamanho e a data; uma imagem ganha uma miniatura, qualquer outro arquivo o seu tipo.',
  'help.guide.files-upload.result':
    'Os documentos estão na viagem, e todo mundo que enxerga a viagem pode abri-los e baixá-los.',
  'help.guide.files-upload.tip.1':
    'Um arquivo também pode ser arrastado da área de trabalho direto para a caixa, que acende enquanto o arquivo está sobre ela.',
  'help.guide.files-upload.tip.2':
    'Uma imagem na área de transferência entra na lista com Ctrl+V, então uma captura de tela de uma reserva nunca precisa ser salva antes.',
  'help.guide.files-upload.tip.3':
    'Enviar precisa do direito Enviar arquivos; sem ele a caixa nem aparece. Um tipo que não está na lista é recusado com uma mensagem e nada é enviado. Um arquivo acima de 50 MB a própria caixa descarta, antes de mandar qualquer coisa.',
  // files-link
  'help.guide.files-link.title': 'Prender um documento a um lugar ou a uma reserva',
  'help.guide.files-link.goal':
    'Deixe a passagem encontrável a partir do dia a que pertence, e não só a partir desta lista.',
  'help.guide.files-link.step.1':
    'Clique em Atribuir, o lápis no fim da linha. Atribuir arquivo abre, com o nome do arquivo.',
  'help.guide.files-link.step.2':
    'Em Nota, Adicione uma nota... aceita uma linha, que depois fica sob o nome do arquivo na lista. Ela é salva no momento em que você sai do campo.',
  'help.guide.files-link.step.3':
    'Em Lugar estão os lugares da viagem, agrupados pelo dia em que estão, com Não atribuído no fim para os que não estão em nenhum dia. Clique em um e ele ganha um tique.',
  'help.guide.files-link.step.4':
    'Em Reserva e Transporte estão as reservas da viagem. Clique naquela a que o documento pertence; ela também ganha o seu tique.',
  'help.guide.files-link.step.5':
    'Feche com o ×. Aqui não há botão de salvar: cada clique foi escrito no momento em que você o fez.',
  'help.guide.files-link.result':
    'A linha traz a nota e um selo por vínculo, Plano do dia e o nome do lugar, Transporte e o nome do voo, e o documento fica pendurado também no lugar e no voo.',
  'help.guide.files-link.tip.1':
    'Um arquivo pode ter vários vínculos ao mesmo tempo, então a mesma confirmação pertence ao hotel e à noite que ela cobre.',
  'help.guide.files-link.tip.2': 'Clicar de novo numa entrada marcada tira esse vínculo; o arquivo em si fica.',
  'help.guide.files-link.tip.3':
    'Funciona também ao contrário: um documento anexado a um lugar ou a uma reserva está nesta lista também, com o mesmo selo na sua linha.',
  // files-star
  'help.guide.files-star.title': 'Manter os documentos importantes no topo',
  'help.guide.files-star.goal':
    'Puxe os dois ou três papéis de que você vai precisar mesmo de uma lista que cresce a viagem inteira.',
  'help.guide.files-star.step.1':
    'Clique em Favoritar no fim de uma linha. A estrela se enche de amarelo, uma segunda estrela aparece na frente do nome do arquivo, e o botão passa a dizer Remover favorito.',
  'help.guide.files-star.step.2':
    'A lista se reordena: os arquivos favoritados ficam acima de todos os outros, os mais novos primeiro dentro de cada grupo.',
  'help.guide.files-star.step.3':
    'No topo uma estrela entrou nas abas, com o número de arquivos favoritados atrás dela. Clique nela para ver só esses.',
  'help.guide.files-star.result':
    'Os papéis de que você precisa no balcão ficam no topo da lista, e uma aba não mostra mais nada.',
  'help.guide.files-star.tip.1':
    'A aba de estrela só existe enquanto algo está favoritado. Remova o favorito do último arquivo e a aba vai junto.',
  'help.guide.files-star.tip.2':
    'Favoritar conta como uma edição: um membro que só pode ler os arquivos da viagem vê as estrelas, mas não consegue pô-las.',
  // files-filter
  'help.guide.files-filter.title': 'Achar um documento na lista',
  'help.guide.files-filter.goal': 'Reduza uma lista com tudo ao único tipo de papel que você procura.',
  'help.guide.files-filter.step.1':
    'As abas acima da lista são Todos, PDFs, Imagens e Documentos, cada uma com o número de arquivos atrás.',
  'help.guide.files-filter.step.2': 'Clique em PDFs: a lista fica com os arquivos PDF e nada mais.',
  'help.guide.files-filter.step.3':
    'Mais duas abas vêm e vão conforme o que há na viagem. Clique em Notas Colab, que está ali assim que uma nota na aba Colab carrega um anexo: a lista fica com esses arquivos e nada mais. Uma estrela entra na fileira do mesmo jeito, assim que um arquivo é favoritado.',
  'help.guide.files-filter.step.4': 'Todos traz a lista inteira de volta.',
  'help.guide.files-filter.result': 'A lista mostra só o que a aba nomeia, e a contagem em cada aba diz quantos são.',
  'help.guide.files-filter.tip.1':
    'Aqui não há pastas nem renomear: a nota em Atribuir arquivo, os vínculos a lugares e reservas, e a estrela são o que ordena um documento.',
  'help.guide.files-filter.tip.2':
    'A própria lista fica sempre com os favoritados primeiro, depois os mais novos primeiro, então um documento enviado hoje fica acima de um do mês passado.',
  // files-preview
  'help.guide.files-preview.title': 'Ler um documento sem sair do TREK',
  'help.guide.files-preview.goal':
    'Olhe uma passagem ou uma imagem na hora, e leve para a sua máquina quando precisar dela lá.',
  'help.guide.files-preview.step.1':
    'Clique no nome de uma imagem ou na miniatura dela. Ela abre em tela cheia, com o nome do arquivo e a posição dela entre as imagens no cabeçalho.',
  'help.guide.files-preview.step.2':
    'As setas redondas nas laterais, as teclas de seta esquerda e direita e a faixa de miniaturas embaixo percorrem todas as imagens que a lista está mostrando naquele momento.',
  'help.guide.files-preview.step.3':
    'Abrir em nova aba e Baixar ficam no cabeçalho; o × ou Esc fecha a imagem de novo.',
  'help.guide.files-preview.step.4':
    'Um documento que não é imagem abre numa prévia sobre a página, com os mesmos dois botões no cabeçalho dela. Essa fecha no × ou num clique ao lado.',
  'help.guide.files-preview.step.5':
    'Baixar no fim de uma linha salva o arquivo direto na sua máquina, sem abrir nada antes.',
  'help.guide.files-preview.result':
    'O documento está na tela, e os mesmos dois botões o põem numa aba do navegador ou no seu disco.',
  'help.guide.files-preview.tip.1': 'Numa tela de toque você desliza pelas imagens em vez de clicar nas setas.',
  'help.guide.files-preview.tip.2':
    'Um passe de wallet nunca abre prévia: ele é baixado na hora, para o telefone entregá-lo ao aplicativo de wallet.',
  'help.guide.files-preview.tip.3':
    'Abrir em nova aba e Baixar buscam os dois o arquivo com a sua sessão, então um link copiado da barra de endereços não serve para mais ninguém.',
  // files-trash
  'help.guide.files-trash.title': 'Jogar um documento fora, e trazer de volta',
  'help.guide.files-trash.goal': 'Limpe o que a viagem não precisa mais, sem perder nada de que você precisava afinal.',
  'help.guide.files-trash.step.1':
    'Clique em Excluir no fim de uma linha. O arquivo sai da lista na hora e a mensagem diz Movido para a lixeira. Nada pergunta antes.',
  'help.guide.files-trash.step.2':
    'Lixeira, na ponta direita da barra de ferramentas, passa a lista para o que foi jogado fora. O título diz Lixeira e as abas de filtro somem.',
  'help.guide.files-trash.step.3':
    'Uma linha jogada fora fica cinza e tem só dois botões: Restaurar, que traz o arquivo de volta, e Excluir, que o tira para sempre depois de uma pergunta.',
  'help.guide.files-trash.step.4':
    'Clique em Restaurar. A mensagem diz Arquivo restaurado e a linha sai da lixeira, com a nota e os vínculos ainda nela.',
  'help.guide.files-trash.step.5':
    'Esvaziar lixeira no topo tira para sempre tudo o que ainda está aqui, e o navegador pergunta uma vez antes de fazer isso. Lixeira volta para os arquivos.',
  'help.guide.files-trash.result': 'O arquivo está de volta na lista onde estava, como se nada tivesse acontecido.',
  'help.guide.files-trash.tip.1':
    'Excluir numa linha não pergunta antes, e é para isso que a lixeira serve: nada sai do TREK até você dizer isso aqui dentro.',
  'help.guide.files-trash.tip.2':
    'Jogar um arquivo fora e trazer de volta precisa do direito Excluir arquivos. Um membro sem ele não vê nem Excluir na linha nem os botões na lixeira.',
  'help.guide.files-trash.tip.3': 'Um arquivo excluído para sempre na lixeira não pode ser trazido de volta.',
  // files-sync
  'help.guide.files-sync.title': 'Manter os documentos em dia com o seu repositório de documentos',
  'help.guide.files-sync.goal':
    'Amarre a viagem ao seu próprio repositório de documentos, para que o que é enviado aqui chegue lá e o que é arquivado lá apareça aqui.',
  'help.guide.files-sync.step.1':
    'Clique em Sincronização de documentos, ao lado de Lixeira na ponta direita da barra de ferramentas. A janela abre com o nome da viagem sob o título. À esquerda, em Conectar um provedor, ficam os repositórios que um administrador ligou, cada um com uma linha sobre como arquiva: Paperless-ngx e Papra por etiqueta, Nextcloud e Synology Drive em uma pasta, OpenCloud em um espaço. À direita lê-se Nada conectado ainda.',
  'help.guide.files-sync.step.2':
    'Clique no seu repositório, aqui Nextcloud. Uma janela menor abre para a conexão, com o nome do repositório, e pede os dados com que se faz login nesse repositório.',
  'help.guide.files-sync.step.3':
    'Preencha Endereço e o login próprio do repositório: um Token de API para o Paperless-ngx, uma Chave de API e o ID da organização para o Papra, Nome de usuário e uma Senha de aplicativo para o Nextcloud, Nome de usuário e um Token de aplicativo para o OpenCloud e, para o Synology Drive, Nome de usuário, Senha e, se a conta pedir, um Código de dois fatores. Use uma senha ou um token de aplicativo sempre que o repositório oferecer, nunca a senha da sua conta. Nextcloud e Synology Drive aceitam também uma Pasta base opcional, onde o TREK procura as pastas das viagens, aqui /Reisen. Aceitar certificado autoassinado, embaixo, é só para um repositório na sua própria rede com um certificado desses.',
  'help.guide.files-sync.step.4':
    'Clique em Testar conexão. O TREK acessa o repositório com o que você digitou e o rodapé diz Acessado, conectado como seguido do nome da conta. Credenciais recusadas ou um endereço que não pode ser alcançado aparecem ali no lugar, e nada é salvo em nenhum dos casos.',
  'help.guide.files-sync.step.5':
    'Clique em Conectar. A conexão é salva com a viagem e o TREK pergunta onde a viagem deve ficar no repositório: a etiqueta, a pasta ou o espaço que guarda os documentos dela. Só o que está ali dentro é sincronizado. Em Criar um novo, ele é criado ao clicar em Criar, com um nome pré-preenchido a partir do título da viagem; em Ou use um que você já tem ficam os que já existem. Clique em um, aqui a pasta Autumn in Japan.',
  'help.guide.files-sync.step.6':
    'A janela está de volta: o seu repositório fica em Esta viagem à esquerda, e o cartão dele à direita carrega para onde sincroniza, quando rodou pela última vez e Sincronizar agora. Uma primeira execução começa sozinha; Sincronizar agora roda uma quando você quiser. Assim que uma execução termina, o selo Ainda não sincronizado ao lado do nome dá lugar a um ponto verde, Em sincronia quando você aponta para ele, e a barra de fluxo conta os documentos que o TREK e o repositório têm cada um, com as faixas Saída para o repositório e Entrada do repositório entre eles. Feche a janela com o ×.',
  'help.guide.files-sync.result':
    'Os documentos que já estavam lá ficam no topo da lista, enviados em seu nome, e todo documento da viagem está no repositório também. A partir de agora o TREK verifica o repositório em segundo plano, e o repositório acompanha a lista.',
  'help.guide.files-sync.tip.1':
    'Só o dono da viagem ou um administrador da instância pode amarrar uma viagem, já que as credenciais alcançam aquela conta inteira no repositório. Todo membro pode abrir Sincronização de documentos, ler o cartão e apertar Sincronizar agora.',
  'help.guide.files-sync.tip.2':
    'Um repositório na sua própria rede precisa de ALLOW_INTERNAL_NETWORK=true no servidor do TREK, e o endereço dele tem de ser o endereço da máquina na rede, nunca localhost. Sem isso, Testar conexão responde Esse endereço não é permitido.',
  'help.guide.files-sync.tip.3':
    'Desconectar no cartão encerra o pareamento e mantém todos os documentos dos dois lados. Uma etiqueta, pasta ou espaço amarrado uma segunda vez é tratado como novo, e tudo o que está dentro entra de novo, então depois de um Desconectar amarre um que esteja vazio em vez do antigo.',

  // ── Screen: trip-day-detail ───────────────────────────────────────────────────────────
  'help.ctx.trip-day-detail.title': 'Detalhes do dia',
  'help.ctx.trip-day-detail.summary':
    'O painel que o cabeçalho de um dia abre sobre o mapa: o dia inteiro, seu nome e sua data, o tempo onde você vai estar, as reservas que caem nele e as noites reservadas para ele.',
  'help.ctx.trip-day-detail.bullet.1':
    'Clique no cabeçalho de um dia na coluna dos dias e o painel abre sobre o meio do mapa. O mesmo cabeçalho de novo, ou o xis à direita dele, fecha o painel e solta o dia.',
  'help.ctx.trip-day-detail.bullet.2':
    'O cabeçalho traz o nome do dia e sua data. O lápis ao lado do nome renomeia o dia, o chevron duplo recolhe o painel numa barra estreita para o mapa ficar livre de novo.',
  'help.ctx.trip-day-detail.bullet.3':
    'No topo, o tempo do dia. Previsão para nomeia o lugar a que ela se refere: a primeira parada do dia, ou a hospedagem em que você acorda.',
  'help.ctx.trip-day-detail.bullet.4':
    'Reservas lista as reservas daquele dia, cada uma com seu tipo, a parada a que pertence e seus horários. Verde quer dizer confirmada, âmbar ainda pendente; é só uma leitura, as reservas se mudam na aba Reservas.',
  'help.ctx.trip-day-detail.bullet.5':
    'Hospedagem mostra cada noite reservada sobre este dia, com Check-in e Check-out nos dias em que acontecem, a janela de check-in, o horário de check-out e o número de confirmação.',
  'help.ctx.trip-day-detail.bullet.6':
    'Adicionar hospedagem reserva uma noite neste dia: escolha o estabelecimento entre os lugares da viagem, diga quais dias ela cobre, e acrescente os horários e o código.',
  // day-panel
  'help.guide.day-panel.title': 'Abrir um dia e ler os detalhes dele',
  'help.guide.day-panel.goal': 'Ver um dia inteiro, o tempo, as reservas e onde você dorme, sem sair do mapa.',
  'help.guide.day-panel.step.1':
    'Clique no cabeçalho de um dia na coluna dos dias. O dia fica selecionado e os detalhes dele abrem sobre o meio do mapa.',
  'help.guide.day-panel.step.2':
    'O cabeçalho nomeia o dia, Dia 1 enquanto você não der um nome a ele, com a data embaixo.',
  'help.guide.day-panel.step.3':
    'No topo, o tempo do dia. Previsão para diz a que lugar ela se refere: a primeira parada do dia, ou a hospedagem em que você acorda.',
  'help.guide.day-panel.step.4': 'Reservas, logo abaixo, lista as reservas que caem neste dia, com os horários delas.',
  'help.guide.day-panel.step.5':
    'Hospedagem mostra as noites reservadas sobre este dia, com Check-in e Check-out nos dias em que acontecem.',
  'help.guide.day-panel.step.6':
    'O chevron duplo do cabeçalho recolhe o painel numa barra estreita. O xis ao lado fecha o painel e solta o dia.',
  'help.guide.day-panel.result':
    'Recolhido na barra, o painel deixa o mapa livre e mantém o dia selecionado; fechado, o dia é desmarcado e o plano fica como estava.',
  'help.guide.day-panel.tip.1':
    'Clicar em qualquer ponto da barra de cabeçalho do painel também o recolhe. O chevron é só o botão disso.',
  'help.guide.day-panel.tip.2':
    'Abrir um lugar pela coluna dos lugares põe os detalhes do lugar no espaço do painel. Feche-os e o dia volta.',
  // day-weather
  'help.guide.day-weather.title': 'Ler o tempo do dia',
  'help.guide.day-weather.goal': 'Saber como o dia vai ser onde você realmente está naquele dia.',
  'help.guide.day-weather.step.1':
    'Previsão para nomeia o lugar a que os números se referem: a primeira parada do dia ou, num dia sem nenhuma, a hospedagem em que você acorda.',
  'help.guide.day-weather.step.2':
    'O número grande é a temperatura do dia, ao lado dele a mínima e a máxima, e a condição por extenso.',
  'help.guide.day-weather.step.3':
    'Os chips abaixo: a probabilidade de chuva, quanta chuva cai, o vento mais forte, e o nascer e o pôr do sol.',
  'help.guide.day-weather.step.4':
    'Embaixo, o dia hora a hora, de duas em duas horas: o horário, o ícone, a temperatura e a probabilidade de chuva. Uma hora acima de 50 por cento fica sombreada de azul.',
  'help.guide.day-weather.result':
    'O cartão do dia na coluna dos dias traz o mesmo tempo em letra pequena sob o número dele, de modo que a viagem inteira se lê de relance.',
  'help.guide.day-weather.tip.1':
    'Os graus e o vento seguem Unidade de temperatura, em Exibição nas Configurações: escolha °F Fahrenheit e a mesma previsão sai em °F e mph.',
  'help.guide.day-weather.tip.2':
    'Um dia sem parada localizada e sem hospedagem para acordar não mostra tempo nenhum: a previsão é sempre para um lugar, nunca para a viagem.',
  'help.guide.day-weather.tip.3':
    'Além de 16 dias não há previsão a obter. Os números são então as médias de anos anteriores para aquela data, marcados com Ø, e logo abaixo está dito que é assim.',
  // rename-day
  'help.guide.rename-day.title': 'Dar um nome ao dia',
  'help.guide.rename-day.goal': 'Chamar um dia pelo que ele é, Chegada em Kyoto ou Dia de descanso, em vez de Dia 5.',
  'help.guide.rename-day.step.1': 'Abra o dia. O cabeçalho dele diz Dia 5, com a data embaixo.',
  'help.guide.rename-day.step.2': 'Clique no lápis ao lado do nome.',
  'help.guide.rename-day.step.3': 'O nome vira um campo. Digite o nome que quiser.',
  'help.guide.rename-day.step.4':
    'Aperte Enter, ou simplesmente clique em outro lugar; Esc joga a alteração fora. O cartão do dia na coluna dos dias também traz o nome.',
  'help.guide.rename-day.result':
    'O nome substitui Dia 5 no painel e no cartão do dia na coluna dos dias; a data fica onde estava.',
  'help.guide.rename-day.tip.1':
    'Esvazie o campo e salve, e o dia volta a ser Dia 5: o número é o que aparece quando não há nome.',
  'help.guide.rename-day.tip.2':
    'O nome pertence ao dia, não à data dele. Reordene os dias e ele viaja junto com tudo o mais daquele dia.',
  // add-accommodation
  'help.guide.add-accommodation.title': 'Reservar uma noite num dia',
  'help.guide.add-accommodation.goal':
    'Pôr o hotel no plano uma vez só, com os dias que ele cobre, os horários e o número de confirmação.',
  'help.guide.add-accommodation.step.1':
    'O estabelecimento precisa ser primeiro um lugar da viagem. Crie-o na coluna dos lugares como faria com qualquer outro lugar: o seletor só oferece o que já está lá.',
  'help.guide.add-accommodation.step.2': 'Abra o dia da sua chegada e clique em Adicionar hospedagem, sob Hospedagem.',
  'help.guide.add-accommodation.step.3':
    'Aplicar aos dias diz que noites a estadia cobre: o dia de check-in à esquerda, o dia de check-out à direita. Todos pega a viagem inteira.',
  'help.guide.add-accommodation.step.4':
    'Preencha Check-in, Até e Check-out, e ponha o número da reserva em Confirmação. Os quatro podem ficar vazios.',
  'help.guide.add-accommodation.step.5':
    'Escolha o estabelecimento entre os lugares da viagem. Os chips acima da lista a estreitam a uma categoria.',
  'help.guide.add-accommodation.step.6': 'Clique em Salvar.',
  'help.guide.add-accommodation.result':
    'A estadia aparece em cada dia que cobre, Check-in no primeiro e Check-out no último. O estabelecimento vira uma parada no dia de check-in, então o mapa desenha o caminho até lá, e na aba Reservas surge uma reserva do tipo Hospedagem.',
  'help.guide.add-accommodation.tip.1':
    'O seletor abre no dia de onde você veio, com o check-out no dia seguinte; os dois podem ser movidos antes de salvar.',
  'help.guide.add-accommodation.tip.2':
    'Dê ao hotel a categoria Hotel da viagem ao criá-lo e os chips acima da lista a estreitam aos seus hotéis num clique.',
  'help.guide.add-accommodation.tip.3':
    'Os horários são todos opcionais: uma estadia sem check-in e sem código cobre as noites dela do mesmo jeito e desenha a rota dela do mesmo jeito.',
  // edit-accommodation
  'help.guide.edit-accommodation.title': 'Alterar ou cancelar uma noite reservada',
  'help.guide.edit-accommodation.goal': 'Mover uma estadia, corrigir os horários dela, ou tirá-la do plano de novo.',
  'help.guide.edit-accommodation.step.1':
    'Em cada dia da estadia o cartão mostra o estabelecimento, a janela de check-in, o horário de check-out e o número de confirmação.',
  'help.guide.edit-accommodation.step.2':
    'O lápis à direita dele reabre a estadia. A janela agora diz Editar hospedagem.',
  'help.guide.edit-accommodation.step.3':
    'Corrija a fileira de campos: Check-in, Até, Check-out e Confirmação. Os dias acima dela e o estabelecimento abaixo também se mudam aqui.',
  'help.guide.edit-accommodation.step.4': 'Clique em Salvar.',
  'help.guide.edit-accommodation.step.5':
    'O xis ao lado do lápis encerra a estadia. Ele não pergunta nada, e a reserva do tipo Hospedagem que pertence a ela vai junto.',
  'help.guide.edit-accommodation.result':
    'A alteração alcança de uma vez cada dia que a estadia cobre, e com ela a reserva do tipo Hospedagem na aba Reservas.',
  'help.guide.edit-accommodation.tip.1':
    'Uma noite no meio de uma estadia não traz o rótulo Check-in nem o rótulo Check-out: só o primeiro e o último dia do intervalo os trazem.',
  'help.guide.edit-accommodation.tip.2':
    'Cancelar uma estadia leva também a parada que ela pôs no dia de check-in e qualquer custo preso à reserva dela. Reserve a noite de novo se foi engano.',
  // day-bookings
  'help.guide.day-bookings.title': 'As reservas do dia de relance',
  'help.guide.day-bookings.goal': 'Ver num lugar só o que já está reservado para este dia e se está confirmado.',
  'help.guide.day-bookings.step.1':
    'Reservas lista as reservas do dia: as datadas nele, e as que estão penduradas numa das paradas dele.',
  'help.guide.day-bookings.step.2':
    'Uma linha mostra que tipo de reserva é, o nome dela e, quando pertence a uma parada, essa parada depois de um ponto. Os horários dela ficam na ponta direita.',
  'help.guide.day-bookings.step.3':
    'A cor diz como está uma reserva: uma linha verde está confirmada, uma âmbar ainda está pendente. As hospedagens não estão nesta lista, elas têm o bloco próprio logo abaixo.',
  'help.guide.day-bookings.step.4': 'A lista só lê as reservas. Uma reserva é criada e alterada na aba Reservas.',
  'help.guide.day-bookings.result':
    'Tudo o que está datado no dia, e tudo o que está pendurado numa das paradas dele, está nesta única lista.',
  'help.guide.day-bookings.tip.1':
    'Uma reserva cai num dia pela data dela mesma. Mude a data na aba Reservas e ela se muda sozinha para o outro dia.',
  'help.guide.day-bookings.tip.2':
    'Não haver bloco Reservas quer dizer que o dia não tem reservas: ele é escondido em vez de mostrado vazio.',

  // ── Screen: trip-map ──────────────────────────────────────────────────────────────────
  'help.ctx.trip-map.title': 'Mapa',
  'help.ctx.trip-map.summary':
    'O meio do plano: cada lugar da viagem como um pino, as rotas que os ligam e os botões nas bordas do mapa para o satélite, para a viagem inteira de uma vez e para os lugares em volta da parte da cidade que você está vendo.',
  'help.ctx.trip-map.bullet.1':
    'Um pino é um lugar: a foto dele quando tem uma, senão a cor da categoria dele com o ícone da categoria. Deixe o ponteiro sobre ele para ver um cartão com o nome e o endereço, mais a categoria e a avaliação quando o lugar as tem. Arraste um pino até um cartão do dia para planejar o lugar ali.',
  'help.ctx.trip-map.bullet.2':
    'Pinos próximos demais para se distinguir se juntam numa bolha escura com uma contagem. Clique na bolha e o mapa se aproxima do que está dentro.',
  'help.ctx.trip-map.bullet.3':
    'Clique num pino para abrir o lugar embaixo do mapa, com a avaliação dele, os arquivos dele e o que fazer com ele em seguida; clique num pedaço vazio do mapa para soltá-lo de novo.',
  'help.ctx.trip-map.bullet.4':
    'Com um dia aberto na coluna dos dias, as paradas dele levam um pequeno selo branco com o número delas naquele dia, e um lugar planejado em dois dias leva os dois números, unidos por ·.',
  'help.ctx.trip-map.bullet.5':
    'A fileira de ícones no topo busca na parte do mapa que você vê: Restaurantes, Cafés, Bares e vida noturna, Hospedagem, Pontos turísticos, Museus e cultura, Natureza e parques e Atividades. Pesquisar nesta área roda a busca de novo depois que você move o mapa.',
  'help.ctx.trip-map.bullet.6':
    'Um clique com o botão direito em qualquer ponto do mapa abre o formulário de lugar naquele ponto, com o endereço já consultado. O botão redondo no canto inferior esquerdo troca o mapa desenhado por imagens aéreas.',
  'help.ctx.trip-map.bullet.7':
    'Mostrar a viagem inteira, no canto inferior direito, desenha todos os dias de deslocamento de uma vez e lista o que cada um cobre; o ícone de rota na linha de uma reserva desenha aquela reserva, e o da barra de ferramentas acima dos dias desenha todas.',
  // map-markers
  'help.guide.map-markers.title': 'Ler o mapa',
  'help.guide.map-markers.goal': 'Saber o que cada pino, selo e bolha do mapa está dizendo.',
  'help.guide.map-markers.step.1':
    'O mapa carrega cada lugar da viagem. Onde os pinos ficam próximos demais para se distinguir, eles se juntam numa bolha escura que leva o número que há dentro dela; clique na bolha e o mapa se aproxima do que estava dentro, ou, no zoom mais profundo, abre os pinos em leque.',
  'help.guide.map-markers.step.2':
    'Um pino é a foto do próprio lugar quando ele tem uma, senão a cor da categoria dele com o ícone da categoria. Deixe o ponteiro sobre ele e um cartão dá o nome e o endereço, com a categoria e a avaliação quando o lugar as tem.',
  'help.guide.map-markers.step.3':
    'Clique num pino e o lugar abre num cartão embaixo do mapa: as coordenadas, a avaliação, os arquivos, e na parte de baixo o que fazer com ele em seguida, entre eles Navegação, Editar e Excluir, com Adicionar ao dia enquanto um dia está aberto. Clique num pedaço vazio do mapa para soltá-lo de novo.',
  'help.guide.map-markers.step.4':
    'Abra um dia na coluna dos dias e as paradas dele ganham número: o pequeno selo branco no canto de um pino é o lugar daquela parada no dia. Um lugar planejado em dois dias leva os dois números, unidos por ·. Sem um dia aberto não há números, e o canto leva a avaliação no lugar deles.',
  'help.guide.map-markers.step.5':
    'Arraste um pino do mapa até um cartão do dia na coluna dos dias e o lugar fica planejado naquele dia, exatamente como arrastar a linha dele para fora da lista de lugares.',
  'help.guide.map-markers.result':
    'Nada na viagem mudou: o mapa é uma vista dela, e cada pino diz qual lugar, qual dia e em que ordem.',
  'help.guide.map-markers.tip.1':
    'Um dia recolhido na coluna dos dias leva as paradas dele para fora do mapa junto; abra o dia de novo e elas voltam.',
  'help.guide.map-markers.tip.2':
    'O filtro acima da lista de lugares decide também o que o mapa desenha: escolha Não planejados e só ficam nele os lugares que ainda estão sem dia.',
  'help.guide.map-markers.tip.3':
    'Este mapa não tem botões de zoom: a rodinha aproxima e afasta, um clique duplo aproxima um passo, e arrastar o próprio mapa o move.',
  // map-nearby-places
  'help.guide.map-nearby-places.title': 'Achar lugares em volta de você no mapa',
  'help.guide.map-nearby-places.goal':
    'Deixe o mapa procurar restaurantes, pontos turísticos ou um hotel na parte da cidade que você está vendo, e leve um deles para a viagem.',
  'help.guide.map-nearby-places.step.1':
    'A fileira de ícones no topo do mapa é a busca por categoria: Restaurantes, Cafés, Bares e vida noturna, Hospedagem, Pontos turísticos, Museus e cultura, Natureza e parques e Atividades.',
  'help.guide.map-nearby-places.step.2':
    'Clique numa categoria. O TREK procura esse tipo de lugar na parte do mapa que você vê e solta um pino na cor da categoria para cada resultado. Uma categoria por vez: clicar em outra troca, e clicar na que está ligada desliga.',
  'help.guide.map-nearby-places.step.3':
    'Mova o mapa e um segundo botão aparece embaixo da fileira: Pesquisar nesta área roda a mesma busca para a nova vista. Mover sozinho nunca busca de novo, o que mantém baixo o número de requisições.',
  'help.guide.map-nearby-places.step.4':
    'Os pinos levam o nome do que foi encontrado. Clique em um e o formulário de lugar abre já preenchido a partir dele: Nome, Endereço, Latitude e Longitude, e o site e o telefone onde o OpenStreetMap os tem.',
  'help.guide.map-nearby-places.step.5':
    'Confira o que foi preenchido e acrescente o que a busca não tinha como saber: uma Descrição, uma Categoria, notas suas.',
  'help.guide.map-nearby-places.step.6':
    'Clique em Adicionar. Se já houver um lugar com o mesmo nome na viagem, o formulário avisa e o botão vira Adicionar mesmo assim.',
  'help.guide.map-nearby-places.result':
    'O lugar está na lista de lugares e no mapa como um dos pinos próprios da viagem, em Não planejados até você pô-lo em um dia. Os pinos da busca ficam até você desligar a categoria.',
  'help.guide.map-nearby-places.tip.1':
    'A fileira some quando Explorar lugares no mapa está desligado em Configurações, em Travel & map.',
  'help.guide.map-nearby-places.tip.2':
    'As respostas vêm do índice de lugares do TREK e do OpenStreetMap, então essa é uma das poucas coisas do plano que precisa de conexão.',
  'help.guide.map-nearby-places.tip.3':
    'Uma busca cobre o que está na tela, então aproxime o zoom na rua sobre a qual você está perguntando: uma cidade inteira responde com os primeiros sessenta resultados e com pouca ordem entre eles.',
  // map-add-place
  'help.guide.map-add-place.title': 'Criar um lugar com o botão direito no mapa',
  'help.guide.map-add-place.goal': 'Ponha um lugar exatamente onde você quer, sem procurá-lo antes.',
  'help.guide.map-add-place.step.1':
    'Clique com o botão direito no ponto do mapa que você quer. O formulário de lugar abre, com o título Adicionar lugar/atividade.',
  'help.guide.map-add-place.step.2':
    'Latitude e Longitude já estão naquele ponto, e o TREK consulta as coordenadas e preenche Endereço com o que encontra ali, e também Nome quando a consulta tem um a dar. Nada foi salvo ainda, então sobrescreva o que estiver errado.',
  'help.guide.map-add-place.step.3':
    'Dê a ele um Nome que você reconheça, e o resto do que o plano deve saber: Descrição, Notas, Categoria, Site.',
  'help.guide.map-add-place.step.4':
    'Clique em Adicionar. O lugar cai na lista como não planejado mesmo com um dia aberto: um clique com o botão direito no mapa diz onde, não quando.',
  'help.guide.map-add-place.result': 'O lugar está na lista e no mapa, em Não planejados até você pô-lo em um dia.',
  'help.guide.map-add-place.tip.1':
    'O endereço vem de uma consulta das coordenadas, então ele pode se ler como uma rua e não como um nome, e em campo aberto pode voltar vazio. Os dois campos são seus para sobrescrever.',
  'help.guide.map-add-place.tip.2':
    'Nos mapas MapLibre GL e Mapbox GL um clique com o botão do meio faz o mesmo, e numa tela sensível ao toque um toque longo.',
  // map-satellite
  'help.guide.map-satellite.title': 'Mudar para satélite',
  'help.guide.map-satellite.goal': 'Troque o mapa desenhado por imagens aéreas, e volte.',
  'help.guide.map-satellite.step.1':
    'O botão redondo no canto inferior esquerdo do mapa é o alternador da camada base. O ícone dele mostra sempre a camada para a qual ele iria, e passar o ponteiro diz qual: Mudar para vista de satélite. Clique nele.',
  'help.guide.map-satellite.step.2':
    'O mapa agora é imagem aérea, com detalhe suficiente para distinguir um único prédio e sem nenhuma chave sua. Tudo o que o TREK desenha fica por cima: os pinos, a rota do dia, as trilhas e as rotas de reservas.',
  'help.guide.map-satellite.step.3':
    'O botão agora diz Mudar para vista de mapa. Clique nele para voltar ao mapa desenhado.',
  'help.guide.map-satellite.result':
    'O mapa está desenhado de novo, e a camada em que você o deixou fica lembrada na sua conta.',
  'help.guide.map-satellite.tip.1':
    'A escolha fica na sua conta e não na viagem, então cada viagem abre do jeito que você deixou, seja qual for o renderizador de mapas que você use.',
  'help.guide.map-satellite.tip.2':
    'As imagens não trazem escrita: nomes de rua, bairros e números ficam no mapa desenhado, então volte para ele quando estiver procurando um endereço.',
  // map-whole-trip
  'help.guide.map-whole-trip.title': 'Ver a viagem inteira e as distâncias dela',
  'help.guide.map-whole-trip.goal':
    'Troque o único dia aberto por todos os dias de deslocamento da viagem, e leia até onde cada um vai.',
  'help.guide.map-whole-trip.step.1':
    'O botão redondo Mostrar a viagem inteira fica no canto inferior direito do mapa. Clique nele e todos os dias de deslocamento da viagem são desenhados de uma vez, cada um na cor dele sobre um contorno branco, para que dias vizinhos continuem separados.',
  'help.guide.map-whole-trip.step.2':
    'O cartão acima do botão lista esses dias: um ponto colorido, o nome do dia, um ícone para cada modo em que você o percorre, e a distância que ele cobre. Distância total fica no topo.',
  'help.guide.map-whole-trip.step.3':
    'Clique num dia do cartão para selecioná-lo, o mesmo que escolhê-lo na coluna dos dias: o mapa enquadra aquele dia, e as paradas dele recebem os números de volta.',
  'help.guide.map-whole-trip.step.4':
    'O botão agora diz Ocultar a viagem inteira. Aperte-o para voltar ao único dia aberto.',
  'help.guide.map-whole-trip.result':
    'Cada dia de deslocamento está desenhado na cor dele, e o cartão diz o que cada um cobre e quanto a viagem soma.',
  'help.guide.map-whole-trip.tip.1':
    'O total chega uns poucos trechos por vez. Enquanto um … vier depois dele, o número ainda é uma soma parcial; ele se assenta assim que cada trecho responde.',
  'help.guide.map-whole-trip.tip.2':
    'Um trecho que o roteador recusa fica como uma linha reta e não conta nada, e o cartão avisa em vez de ficar calado com um número baixo.',
  'help.guide.map-whole-trip.tip.3':
    'Um dia com menos de duas paradas localizadas não tem rota para desenhar, então fica de fora do cartão por completo.',
  // map-booking-routes
  'help.guide.map-booking-routes.title': 'Mostrar a rota de uma reserva no mapa',
  'help.guide.map-booking-routes.goal':
    'Desenhe no mapa os voos, trens e trajetos de carro que você reservou, e tire-os de lá de novo.',
  'help.guide.map-booking-routes.step.1':
    'As rotas de reservas ficam desligadas até você pedir uma. Na linha de uma reserva, na coluna dos dias, fica um pequeno ícone de rota: Mostrar rotas de reservas.',
  'help.guide.map-booking-routes.step.2':
    'Clique nele e a reserva aparece no mapa: um voo como um arco de círculo máximo, um trajeto de carro pelas estradas reais, um trem como a corrente das estações dele. Confirmada é desenhada contínua, Pendente tracejada, e as pontas da rota são pílulas azuis com o ícone do transporte.',
  'help.guide.map-booking-routes.step.3':
    'Clique numa pílula de ponta e a reserva por trás dela abre, com os horários, a referência e de onde ela parte. Fechar guarda tudo de novo.',
  'help.guide.map-booking-routes.step.4':
    'O ícone de rota na barra de ferramentas acima dos dias faz a viagem inteira de uma vez: Mostrar todas as rotas de reservas desenha todas as reservas que têm uma.',
  'help.guide.map-booking-routes.step.5':
    'É um recomeço limpo e não uma camada por cima, então o que você escolheu reserva a reserva é descartado. Aperte de novo, agora dizendo Ocultar todas as rotas de reservas, e o mapa fica limpo.',
  'help.guide.map-booking-routes.result':
    'As reservas que você pediu estão desenhadas no mapa, e a escolha fica guardada para esta viagem neste navegador até você mudá-la.',
  'help.guide.map-booking-routes.tip.1':
    'As pontas levam o código do aeroporto ou o nome da estação só quando Rótulos das rotas de reservas está ligado em Configurações, em Travel & map; do contrário mostram só o ícone.',
  'help.guide.map-booking-routes.tip.2':
    'Sempre mostrar rotas de reserva, nas mesmas configurações, desenha as rotas desde o início em toda viagem sobre a qual você ainda não decidiu.',
  'help.guide.map-booking-routes.tip.3':
    'Uma reserva precisa de duas pontas com coordenadas antes de poder ser desenhada, então um hotel ou um restaurante não leva ícone de rota.',
  'help.ctx.trip-map.bullet.8':
    'Com o addon Dawarich ligado, o botão redondo Dawarich abaixo de Mostrar a viagem inteira desenha a rota que o seu celular realmente gravou: Mostrar rota gravada a põe tracejada sob a rota planejada, uma cor por dia, e o rótulo do botão diz por que não há linha quando não há nenhuma.',
  // map-dawarich-trail
  'help.guide.map-dawarich-trail.title': 'Mostrar a rota que você realmente percorreu',
  'help.guide.map-dawarich-trail.goal':
    'Ponha sobre o mapa a rota que o Dawarich gravou no seu celular, tracejada ao lado da que você planejou, e leia a viagem dia a dia como ela realmente foi.',
  'help.guide.map-dawarich-trail.step.1':
    'O botão redondo Dawarich fica no canto inferior direito do mapa, abaixo de Mostrar a viagem inteira; passar o mouse sobre ele diz Mostrar rota gravada. Clique nele. O TREK pede ao seu Dawarich as datas da viagem, e um anel gira em volta do botão enquanto a resposta está a caminho.',
  'help.guide.map-dawarich-trail.step.2':
    'A rota gravada chega como uma linha tracejada, uma cor por dia, desenhada por baixo da rota planejada para que o plano continue legível. O botão agora diz Ocultar rota gravada. Os dias são cortados à meia-noite local, e um dia recolhido na coluna dos dias tira a linha tracejada dele do mapa junto com as paradas.',
  'help.guide.map-dawarich-trail.step.3':
    'Clique também em Mostrar a viagem inteira e cada dia planejado é desenhado em linha cheia ao lado da gravação tracejada. Onde as duas correm juntas, o dia foi como planejado; onde a linha tracejada se desvia é onde não foi.',
  'help.guide.map-dawarich-trail.result':
    'O que você planejou e o que realmente fez estão juntos no mapa, tracejado contra cheio, e o cartão acima dos botões ainda lista os dias planejados e as distâncias deles.',
  'help.guide.map-dawarich-trail.tip.1':
    'Ligado ou desligado é lembrado por viagem nesta sessão do navegador. Enquanto a rota está ligada, o TREK pergunta ao Dawarich de novo a cada dois minutos, então uma viagem em andamento se atualiza sem recarregar; a rota em si nunca é armazenada, então não está no banco de dados do TREK, nem nos backups, nem disponível offline.',
  'help.guide.map-dawarich-trail.tip.2':
    'O rótulo do botão explica um mapa vazio: Carregando a rota gravada… enquanto ela está a caminho, Nada foi gravado nessas datas, Não foi possível carregar a rota gravada, ou A rota gravada precisa de conexão quando o TREK está offline.',
  // map-compass
  'help.guide.map-compass.title': 'Girar o mapa e encontrar o norte de novo',
  'help.guide.map-compass.goal':
    'Gire o mapa para ficar de frente para onde você vai, e volte-o para o norte com um clique.',
  'help.guide.map-compass.step.1':
    'Gire o mapa arrastando com o botão direito, ou segure Ctrl e arraste com o botão esquerdo; numa tela de toque, gire com dois dedos. A bússola redonda ao lado da fileira de ícones de categoria no topo do mapa gira junto: a seta dela sempre aponta para o norte, então ela inclina tanto quanto você girou.',
  'help.guide.map-compass.step.2':
    'Clique na bússola. Reset north, como o botão se chama, leva o mapa suavemente de volta ao norte no topo e a uma vista plana, e a seta fica de pé de novo.',
  'help.guide.map-compass.result':
    'O mapa está de novo com o norte para cima e plano, e nada mudou na viagem: a bússola só move a câmera.',
  'help.guide.map-compass.tip.1':
    'A bússola só existe nos mapas MapLibre GL e Mapbox GL; o mapa Leaflet não gira, então não tem uma. Provedor de mapa em Configurações, em Mapa, decide qual você usa, e Salvar mapa guarda a escolha.',
  'help.guide.map-compass.tip.2':
    'O clique também tira a inclinação: arrastar com o botão direito para cima ou para baixo inclina a vista, e Reset north a nivela junto com o giro. No Mapbox GL com Prédios 3D & terreno ligado, isso achata a vista 3D também, até você inclinar de novo.',

  // ── Screen: trip-collab ───────────────────────────────────────────────────────────────
  'help.ctx.trip-collab.title': 'Colab',
  'help.ctx.trip-collab.summary':
    'A aba onde o grupo planeja junto: o chat à esquerda, as notas compartilhadas e os links ao lado, as enquetes embaixo e Próximos passos no fim. Tudo o que é escrito aqui está na hora na tela de todos os outros membros, sem recarregar.',
  'help.ctx.trip-collab.bullet.1':
    'O chat é a coluna da esquerda. Escreva em Digite uma mensagem... e aperte Enter; Shift e Enter criam uma nova linha. O smiley insere um emoji, Anexar imagens pendura até quatro fotos na mensagem.',
  'help.ctx.trip-collab.bullet.2':
    'Passe o mouse sobre uma mensagem para Responder e, nas suas, Excluir; o clique com o botão direito abre as oito reações rápidas. Uma mensagem excluída deixa uma linha dizendo que você a excluiu.',
  'help.ctx.trip-collab.bullet.3':
    'Notas é o bloco compartilhado: Nova nota escreve uma, e a engrenagem ao lado abre Gerenciar categorias para os nomes e as cores delas. Um cartão traz Expandir, Fixar, Editar e Excluir.',
  'help.ctx.trip-collab.bullet.4':
    'Links reúne os endereços em que a viagem se apoia. Adicionar link recebe um título e um endereço http ou https; Editar link, Fixar link e Excluir link ficam no fim da ficha, e os links fixados continuam na frente.',
  'help.ctx.trip-collab.bullet.5':
    'Enquetes decide as coisas. Nova enquete faz uma pergunta com pelo menos duas opções; um clique numa opção é o seu voto, Encerrar termina a votação e Excluir tira a enquete.',
  'help.ctx.trip-collab.bullet.6':
    'Próximos passos lista as paradas da viagem que ainda estão por vir, até oito delas, com seus horários e as pessoas que vão nelas. Ele só lê o plano do dia; os horários são definidos lá.',
  // write-note
  'help.guide.write-note.title': 'Escrever uma nota compartilhada',
  'help.guide.write-note.goal':
    'Ponha o que o grupo inteiro precisa, uma regra, um endereço, um lembrete, onde todo mundo encontra de novo.',
  'help.guide.write-note.step.1': 'Clique em Nova nota no topo do painel Notas. O formulário abre.',
  'help.guide.write-note.step.2':
    'Título da nota é o nome que o cartão carrega. É a única coisa que o formulário exige: Criar fica cinza enquanto estiver vazio.',
  'help.guide.write-note.step.3':
    'A caixa grande embaixo guarda o texto e aceita Markdown: uma palavra em negrito, uma lista, um título. O cartão mostra as primeiras linhas, e Expandir nele abre a nota inteira.',
  'help.guide.write-note.step.4':
    'Em Categoria, escolha aquela a que a nota pertence; a cor dela vira a cor do cartão. As pílulas são as categorias que já existem, e uma nova é criada em Gerenciar categorias.',
  'help.guide.write-note.step.5':
    'Site recebe um link que pertence à nota. O cartão passa então a trazer um bloco Link que o abre.',
  'help.guide.write-note.step.6': 'Clique em Criar.',
  'help.guide.write-note.result':
    'A nota é um cartão no painel Notas, na cor da categoria dela, e já está na tela de todos os outros membros.',
  'help.guide.write-note.tip.1':
    'Fixar num cartão o mantém no topo do painel; tudo abaixo dele é ordenado pela última alteração.',
  'help.guide.write-note.tip.2':
    'A engrenagem ao lado de Nova nota abre Gerenciar categorias: ali uma categoria ganha sua cor, é renomeada em todo lugar de uma vez, ou é criada antes que qualquer nota a use.',
  'help.guide.write-note.tip.3':
    'Anexar arquivos pendura um documento na nota. Anexar abre o seletor de arquivos, e uma imagem ou um PDF também podem ser simplesmente colados no formulário.',
  'help.guide.write-note.tip.4':
    'Notas é um interruptor próprio em Complementos, abaixo de Colab: um administrador pode desligá-las e deixar o Chat, os Links, as Enquetes e Próximos passos funcionando.',
  // shared-links
  'help.guide.shared-links.title': 'Reunir os links da viagem',
  'help.guide.shared-links.goal':
    'Mantenha o portal de reservas, o álbum compartilhado e os horários num lugar só, em vez de procurá-los rolando o chat.',
  'help.guide.shared-links.step.1': 'Clique em Adicionar link no topo do painel Links.',
  'help.guide.shared-links.step.2':
    'Dê um nome ao link em Título do link, cole o endereço no campo de baixo e clique em Salvar link.',
  'help.guide.shared-links.step.3':
    'A ficha mostra o nome e o site para o qual aponta. Um clique nela abre a página numa nova aba.',
  'help.guide.shared-links.step.4':
    'Os três botõezinhos no fim dela são Editar link, Fixar link e Excluir link. Fixar link leva a ficha para a frente do painel; Excluir link não pergunta nada.',
  'help.guide.shared-links.result':
    'O link é uma ficha no painel Links, fixada na frente, e na tela de todos os membros ao mesmo tempo.',
  'help.guide.shared-links.tip.1':
    'Só endereços http e https são aceitos; o campo recusa qualquer outra coisa antes de salvar.',
  'help.guide.shared-links.tip.2':
    'Os links fixados vêm primeiro, depois os mais novos. O ícone pequeno ao lado de um título é o favicon do próprio site, buscado no site em si, então sem internet a ficha mostra um símbolo de link simples no lugar.',
  'help.guide.shared-links.tip.3':
    'Links é um interruptor próprio em Complementos, abaixo de Colab, então um administrador pode desligar o painel sem mexer no resto da aba.',
  // create-poll
  'help.guide.create-poll.title': 'Perguntar ao grupo',
  'help.guide.create-poll.goal':
    'Transforme uma pergunta que ninguém responde no chat numa enquete que todo mundo pode marcar.',
  'help.guide.create-poll.step.1': 'Clique em Nova enquete no topo do painel Enquetes.',
  'help.guide.create-poll.step.2':
    'Escreva a pergunta. Suporta Markdown embaixo da caixa quer dizer que uma palavra em negrito, uma quebra de linha ou uma lista curta funcionam aqui.',
  'help.guide.create-poll.step.3': 'Preencha Opção 1 e Opção 2. Duas opções com algo dentro são o mínimo.',
  'help.guide.create-poll.step.4':
    '+ Adicionar opção põe uma terceira, uma quarta, quantas você precisar; a cruzinha ao lado de uma linha tira uma de volta.',
  'help.guide.create-poll.step.5':
    'Múltipla escolha deixa cada um marcar mais de uma opção. Deixada desligada, um voto muda de lugar quando alguém escolhe outra coisa.',
  'help.guide.create-poll.step.6': 'Clique em Criar enquete.',
  'help.guide.create-poll.result': 'A enquete fica no topo do painel Enquetes, aberta, e ninguém votou ainda.',
  'help.guide.create-poll.tip.1': 'A pergunta é exibida como Markdown; as opções continuam texto simples.',
  'help.guide.create-poll.tip.2':
    'Criar enquete fica cinza até haver uma pergunta e pelo menos duas opções com algo dentro.',
  'help.guide.create-poll.tip.3':
    'Um prazo só pode ser definido no aplicativo de celular. Uma enquete que tem um mostra aqui o tempo restante numa ficha âmbar e conta como encerrada assim que ele acaba.',
  'help.guide.create-poll.tip.4':
    'Enquetes é um interruptor próprio em Complementos, abaixo de Colab: um administrador pode desligá-las e deixar os outros quatro painéis funcionando.',
  // vote-poll
  'help.guide.vote-poll.title': 'Votar e ler o resultado',
  'help.guide.vote-poll.goal': 'Dê o seu voto, veja como está o grupo e mude de ideia.',
  'help.guide.vote-poll.step.1': 'Clique na opção que você quer. O círculo dela se preenche e a barra atrás cresce.',
  'help.guide.vote-poll.step.2':
    'Agora o resultado inteiro se lê: a barra é a fatia, a porcentagem fica à direita, e os círculos pequenos são as pessoas que escolheram aquela opção.',
  'help.guide.vote-poll.step.3':
    'Mudou de ideia? Clique em outra opção. Numa enquete sem Múltipla escolha o seu voto muda de lugar em vez de somar um segundo.',
  'help.guide.vote-poll.step.4':
    'Sob a pergunta está quantos votos a enquete tem. Um clique na opção que você já escolheu tira o seu voto de volta, e o contador cai.',
  'help.guide.vote-poll.result':
    'A sua marca está numa opção, as barras mostram como o grupo se divide, e os círculos dizem quem escolheu o quê.',
  'help.guide.vote-poll.tip.1':
    'As barras e as porcentagens só aparecem depois que você mesmo votou, ou quando a enquete está encerrada, para que ninguém seja influenciado pelo placar.',
  'help.guide.vote-poll.tip.2':
    'Um voto nunca é anônimo: passe o mouse sobre um dos círculos de uma opção para ver o nome por trás.',
  // close-poll
  'help.guide.close-poll.title': 'Encerrar uma enquete ou removê-la',
  'help.guide.close-poll.goal':
    'Pare a votação assim que o grupo decidir, e tire do caminho uma enquete de que ninguém precisa mais.',
  'help.guide.close-poll.step.1':
    'Encerrar, o cadeado no canto de uma enquete, termina a votação. As opções param de aceitar cliques.',
  'help.guide.close-poll.step.2':
    'Uma enquete encerrada desce para baixo do título Encerradas no fim do painel, usa um selo Encerrada e mostra o resultado a todos, tendo votado ou não. A opção vencedora fica tingida de verde.',
  'help.guide.close-poll.step.3':
    'Excluir, a lixeira no mesmo canto, tira a enquete. Nada pergunta duas vezes, e os votos vão junto.',
  'help.guide.close-poll.result':
    'A enquete sumiu do painel de todos os membros. Uma que você só encerrou continua legível lá embaixo, com o resultado dela.',
  'help.guide.close-poll.tip.1':
    'Encerrar não pode ser desfeito: não existe reabrir. Uma enquete encerrada sem querer precisa ser feita de novo.',
  'help.guide.close-poll.tip.2': 'Excluir tira a enquete e cada voto nela de todo mundo, na hora e sem perguntar.',
  // whats-next
  'help.guide.whats-next.title': 'Ler Próximos passos',
  'help.guide.whats-next.goal': 'Veja o que o grupo faz a seguir sem abrir o plano.',
  'help.guide.whats-next.step.1':
    'O painel lista as paradas da viagem que ainda estão por vir, até oito delas, em ordem de horário, sob um título por dia: Hoje, Amanhã ou a data.',
  'help.guide.whats-next.step.2':
    'À esquerda de uma linha fica o horário dela: o começo, até, e o fim quando a parada tem um, ou TBD quando nenhum horário foi definido ainda.',
  'help.guide.whats-next.step.3':
    'As fichas embaixo do nome são as pessoas naquela parada. Se ninguém foi escolhido, todo mundo da viagem é listado.',
  'help.guide.whats-next.result': 'Uma lista do que vem, só para ler: ela segue o plano, e nada aqui o muda.',
  'help.guide.whats-next.tip.1':
    'Aqui nada é definido. Os horários vêm do plano do dia; mude-os lá e esta lista segue na hora.',
  'help.guide.whats-next.tip.2':
    'Só é listado o que ainda está por vir: uma parada cujo horário já passou sai, e no fim de uma viagem o painel fica vazio.',
  'help.guide.whats-next.tip.3':
    'Próximos passos é um interruptor próprio em Complementos, abaixo de Colab, e é um painel de desktop: a aba Colab do aplicativo de celular não o oferece.',
  // trip-chat
  'help.guide.trip-chat.title': 'Falar com o grupo',
  'help.guide.trip-chat.goal': 'Diga algo, responda a uma mensagem específica, reaja a outra e desfaça a sua.',
  'help.guide.trip-chat.step.1':
    'Escreva em Digite uma mensagem... e aperte Enter. A seta azul ao lado da caixa faz o mesmo; Shift e Enter criam uma nova linha em vez disso.',
  'help.guide.trip-chat.step.2':
    'O smiley abre o seletor de emoji, com Smileys, Reactions e Travel dentro. O que você escolhe é somado ao que está escrevendo, não é enviado sozinho.',
  'help.guide.trip-chat.step.3':
    'Passe o mouse sobre a mensagem de outra pessoa: no canto dela aparece um botãozinho redondo. Esse é Responder.',
  'help.guide.trip-chat.step.4':
    'A mensagem a que você responde fica citada acima da caixa. Escreva e envie, e a citação viaja junto no seu balão; a cruz na citação a descarta.',
  'help.guide.trip-chat.step.5':
    'Clique com o botão direito numa mensagem para as oito reações rápidas. A sua fica embaixo do balão, e um segundo clique na mesma a tira de volta.',
  'help.guide.trip-chat.step.6':
    'Suas próprias mensagens trazem Excluir ao lado de Responder. Isso tira a mensagem e deixa uma linha dizendo que você a excluiu: não há volta.',
  'help.guide.trip-chat.result':
    'Sua resposta fica embaixo da mensagem que ela cita, uma reação está pendurada numa terceira, e a que você desfez deixa uma única linha dizendo isso.',
  'help.guide.trip-chat.tip.1':
    'Enter envia, Shift e Enter criam uma nova linha. Uma mensagem que é só emoji é mostrada grande.',
  'help.guide.trip-chat.tip.2':
    'Anexar imagens aceita até quatro fotos para uma mensagem; elas também podem ser simplesmente coladas ou soltas na caixa.',
  'help.guide.trip-chat.tip.3':
    'Uma mensagem com um link dentro ganha um cartão de prévia embaixo, buscado pelo seu próprio TREK, então um link para algo que só você alcança continua um link simples.',
  'help.guide.trip-chat.tip.4':
    'Chat é um interruptor próprio em Complementos, abaixo de Colab: um administrador pode desligá-lo e deixar as Notas, os Links, as Enquetes e Próximos passos funcionando.',

  // ── Screen: trip-lists ────────────────────────────────────────────────────────────────
  'help.ctx.trip-lists.title': 'Listas',
  'help.ctx.trip-lists.summary':
    'Duas listas para uma viagem: a lista de mala, com quem leva o quê e quanto pesa, e a lista de tarefas com tudo o que precisa acontecer antes e durante. A aba está lá enquanto o addon Listas estiver ligado.',
  'help.ctx.trip-lists.bullet.1':
    'Lista de bagagem e A fazer no topo alternam entre as duas e contam o que há em cada uma; os botões à direita pertencem à que estiver aberta.',
  'help.ctx.trip-lists.bullet.2':
    'A lista de mala é agrupada em listas, Documentos, Roupas, como você quiser chamá-las, cada uma com um ponto colorido, um contador de guardados sobre o total e três pontinhos com Renomear, Marcar todos, Desmarcar todos e Excluir lista. Adicionar lista, na barra acima, cria uma nova.',
  'help.ctx.trip-lists.bullet.3':
    'Uma linha é uma caixinha e um nome, depois quem leva o item, a quantidade e o peso em gramas como pequenas etiquetas e um círculo de mala enquanto Rastreamento de malas estiver ligado, e então a lixeira e três pontinhos com Mover para lista, Compartilhar, Renomear e Excluir. O que uma linha não usa fica esmaecido até você apontar para ele, e a alça à esquerda a arrasta para cima ou para baixo dentro da sua lista.',
  'help.ctx.trip-lists.bullet.4':
    'Compartilhado e Minha lista partem a lista de mala em duas: o fundo comum que todos veem, e a sua. Todos, Abertos e Prontos estreitam a que estiver aberta, e a barra acima conta o que já está na mala.',
  'help.ctx.trip-lists.bullet.5':
    'Aplicar modelo e Salvar como modelo preenchem ou guardam uma lista sem digitá-la, e os dois ícones ao lado exportam a lista, como impressão, PDF ou arquivo, e importam uma. O botão vermelho ao lado da barra de progresso diz quantos itens estão marcados e os retira.',
  'help.ctx.trip-lists.bullet.6':
    'A fazer tem uma barra lateral própria: o cartão de progresso, os filtros Todos, Minhas tarefas, Atrasada e Concluído, uma linha por lista e Adicionar lista embaixo delas. As tarefas ficam num cartão cujo cabeçalho nomeia o filtro e traz a ordenação, Prioridade ou Data de vencimento. Um clique numa tarefa a abre no painel da direita, e Nova tarefa abre o formulário Nova tarefa sobre o meio da tela.',
  // packing-categories
  'help.guide.packing-categories.title': 'Montar a lista de mala',
  'help.guide.packing-categories.goal':
    'Agrupe em listas o que você vai levar, encha-as de itens e diga quem cuida de cada lista.',
  'help.guide.packing-categories.step.1':
    'Clique em Adicionar lista na barra acima das listas, digite o nome em Nome da lista (ex: Roupas) e clique em Adicionar.',
  'help.guide.packing-categories.step.2':
    'A lista nova começa com uma linha vazia. Clique em Adicionar item, digite o item em Nome do item... e aperte Enter; o campo fica aberto para o próximo.',
  'help.guide.packing-categories.step.3':
    'Renomeie uma linha clicando no nome dela, ou com Renomear nos três pontinhos na ponta direita dela.',
  'help.guide.packing-categories.step.4':
    'O círculo tracejado no cabeçalho da lista atribui membros da viagem à lista. Escolha um nome; a etiqueta que aparece tira essa pessoa de novo com um clique.',
  'help.guide.packing-categories.step.5':
    'Os três pontinhos no fim do cabeçalho guardam o resto: Renomear, Marcar todos, Desmarcar todos e Excluir lista, que leva a lista e tudo o que há nela sem perguntar de novo.',
  'help.guide.packing-categories.result':
    'A lista nova fica na grade com seus itens embaixo e seu ponto colorido, e seu contador conta o que já está guardado.',
  'help.guide.packing-categories.tip.1':
    'Uma lista é só os seus itens. Exclua o último e a linha vira um espaço reservado para que a lista mantenha seu lugar e sua cor; exclua também essa linha e a lista some.',
  'help.guide.packing-categories.tip.2':
    'Atribuir alguém a uma lista envia a essa pessoa uma notificação de bagagem. Não muda quem pode ver os itens, isso é Compartilhar, nos três pontinhos de uma linha.',
  'help.guide.packing-categories.tip.3':
    'Duas listas podem levar o mesmo nome. O TREK as mantém separadas internamente, então os nomes ficam do jeito que você digitou.',
  // check-off-packing
  'help.guide.check-off-packing.title': 'Ir marcando enquanto arruma a mala',
  'help.guide.check-off-packing.goal': 'Marque o que já está na mala, acompanhe a barra e retire os itens guardados.',
  'help.guide.check-off-packing.step.1':
    'Clique na caixinha à esquerda de uma linha. O nome fica riscado e a barra se move.',
  'help.guide.check-off-packing.step.2':
    'A barra acima conta o que está na mala contra tudo o que há na lista, como número e como porcentagem.',
  'help.guide.check-off-packing.step.3':
    'Uma lista inteira de uma vez: os três pontinhos no cabeçalho dela guardam Marcar todos e Desmarcar todos.',
  'help.guide.check-off-packing.step.4':
    'Todos, Abertos e Prontos estreitam a grade. Abertos deixa só o que ainda falta, então uma lista totalmente guardada sai dela.',
  'help.guide.check-off-packing.step.5':
    'Remover 3 marcado(s) ao lado da barra de progresso exclui todos os itens marcados de uma vez, depois de uma confirmação do navegador.',
  'help.guide.check-off-packing.result':
    'Fica listado só o que continua em aberto, e a barra acima diz a que ponto está a arrumação.',
  'help.guide.check-off-packing.tip.1': 'Um item marcado ainda pode ser renomeado: clique no nome dele.',
  'help.guide.check-off-packing.tip.2':
    'Marcar todos e Desmarcar todos agem numa lista por vez, a partir dos três pontinhos daquela lista.',
  'help.guide.check-off-packing.tip.3':
    'Quando todo item está marcado, o contador é substituído por Tudo na mala! e a barra fica verde.',
  // apply-packing-template
  'help.guide.apply-packing-template.title': 'Aplicar um modelo de mala',
  'help.guide.apply-packing-template.goal':
    'Traga uma lista pronta para a viagem, e guarde a lista desta viagem para a próxima.',
  'help.guide.apply-packing-template.step.1': 'Clique em Aplicar modelo na barra acima da lista.',
  'help.guide.apply-packing-template.step.2': 'Escolha um modelo. Cada linha o nomeia e diz quantos itens ele tem.',
  'help.guide.apply-packing-template.step.3':
    'Os itens caem na visão em que você está: Compartilhado os põe no fundo comum que todos veem, Minha lista os torna seus.',
  'help.guide.apply-packing-template.step.4':
    'Guardar a lista desta viagem para a próxima: Salvar como modelo abre uma janela, digite um nome e clique em Salvar.',
  'help.guide.apply-packing-template.result':
    'As listas e os itens do modelo estão na viagem, ao lado do que já havia.',
  'help.guide.apply-packing-template.tip.1':
    'Um modelo leva só nomes e listas. Quantidades, pesos, malas e o que já está marcado ficam para trás.',
  'help.guide.apply-packing-template.tip.2':
    'Aplicar modelo só está lá depois que existe um modelo. Sem nenhum, o botão não aparece.',
  'help.guide.apply-packing-template.tip.3':
    'Salvar como modelo aparece só para um administrador da instância, e só enquanto a lista tem itens. Ele salva o fundo comum mais os seus próprios itens, nunca os particulares de outro membro.',
  // import-packing-list
  'help.guide.import-packing-list.title': 'Colar uma lista de mala inteira',
  'help.guide.import-packing-list.goal':
    'Transforme de uma só vez uma lista que você já tem em outro lugar em itens de mala.',
  'help.guide.import-packing-list.step.1': 'Clique no botão de importar com a seta para baixo na barra acima da lista.',
  'help.guide.import-packing-list.step.2':
    'Um item por linha: Categoria, Nome, Peso em g (opcional), Bolsa (opcional), checked/unchecked (opcional). O exemplo cinza na caixa mostra as quatro formas. Uma lista em Markdown também funciona: um título dá nome à lista, e "- [ ]" e "- [x]" viram itens.',
  'help.guide.import-packing-list.step.3':
    'Ou carregue as linhas de um arquivo com Carregar CSV/TXT/MD. Ele aceita um .csv, um .txt ou um .md e substitui o que estiver na caixa.',
  'help.guide.import-packing-list.step.4': 'Clique em Importar. O botão conta as linhas que entendeu.',
  'help.guide.import-packing-list.result':
    'Cada linha vira uma entrada, na lista que o seu primeiro campo nomeia, e nada do que já estava lá é tocado.',
  'help.guide.import-packing-list.tip.1':
    'Vírgulas, pontos e vírgulas e tabulações separam campos, e as aspas mantêm um campo inteiro, de modo que “Camisa, azul” continua sendo um nome só. Uma linha com um único valor é só um nome, uma linha sem lista própria cai em Outros, e "3x" antes de um nome define a quantidade.',
  'help.guide.import-packing-list.tip.2':
    'Uma bolsa nomeada no quarto campo é criada se a viagem ainda não a tiver. Este é o único lugar que carrega pesos e malas em massa; um modelo traz só nomes e listas.',
  // export-packing-list
  'help.guide.export-packing-list.title': 'Imprimir ou exportar a lista de mala',
  'help.guide.export-packing-list.goal':
    'Leve a lista no papel, em PDF ou como arquivo para outro app ou para a próxima viagem.',
  'help.guide.export-packing-list.step.1': 'Clique no botão de exportar com a seta para cima na barra acima da lista.',
  'help.guide.export-packing-list.step.2':
    'Checklist em Markdown (.md) e CSV para importação (.csv) salvam a lista como arquivo na hora.',
  'help.guide.export-packing-list.step.3':
    'Clique em Imprimir ou salvar como PDF. A pré-visualização mostra a lista como uma página: a viagem e as datas no topo, depois cada lista como um cartão com uma caixinha para marcar.',
  'help.guide.export-packing-list.step.4':
    'Clique em Imprimir ou salvar como PDF abaixo da pré-visualização. O navegador abre a caixa de diálogo de impressão: escolha uma impressora, ou Salvar como PDF para guardar um arquivo.',
  'help.guide.export-packing-list.result':
    'A impressão e os arquivos trazem a visão que estiver aberta, Compartilhado ou Minha lista, com as quantidades, os pesos e as marcações.',
  'help.guide.export-packing-list.tip.1':
    'O CSV é o formato que Importar lê, malas incluídas, então ele serve como um modelo de mala seu: importe-o na próxima viagem.',
  'help.guide.export-packing-list.tip.2':
    'O arquivo Markdown abre como checklist no Obsidian, no Notion ou no GitHub, e volta pelo Importar do mesmo jeito.',
  // share-packing-item
  'help.guide.share-packing-item.title': 'Decidir quem vê um item e quem o leva',
  'help.guide.share-packing-item.goal':
    'Mova um item entre o fundo comum do grupo, a sua própria lista e as pessoas para quem você o leva.',
  'help.guide.share-packing-item.step.1':
    'Compartilhado acima das listas é o fundo comum que todos veem, Minha lista é a sua, e cada uma conta o que há nela. Clique em Minha lista para ver a sua.',
  'help.guide.share-packing-item.step.2':
    'De volta em Compartilhado, abra os três pontinhos no fim de uma linha e clique em Compartilhar.',
  'help.guide.share-packing-item.step.3':
    'Três níveis: Compartilhado, no fundo comum do grupo e visível para todos; Pessoal, que só você vê; e Compartilhar com…, onde você escolhe as pessoas que o item cobre.',
  'help.guide.share-packing-item.step.4': 'Um item Pessoal fica só em Minha lista. Troque de visão para encontrá-lo.',
  'help.guide.share-packing-item.step.5':
    'Abra Compartilhar de novo e marque um nome em Compartilhar com…. O item aparece também na lista daquela pessoa, e a linha ganha uma pequena etiqueta contando com quantas pessoas ele é compartilhado.',
  'help.guide.share-packing-item.result': 'O item fica no nível que você escolheu, e a linha diz quem o leva.',
  'help.guide.share-packing-item.tip.1':
    'Só quem leva um item muda o compartilhamento dele. Quem recebeu o item de você o vê na própria Minha lista, marcado com o seu nome, e pode marcá-lo.',
  'help.guide.share-packing-item.tip.2':
    'Num item que outra pessoa leva você recebe dois outros botões no lugar: Eu também posso levar, que põe você ao lado dela, e Copiar para minha lista, que faz uma cópia particular sua.',
  'help.guide.share-packing-item.tip.3':
    'Itens novos herdam a visão em que você os adiciona. Adicionados em Minha lista são Pessoal, adicionados em Compartilhado vão para o fundo comum.',
  // packing-bags
  'help.guide.packing-bags.title': 'Pesar as malas',
  'help.guide.packing-bags.goal':
    'Ponha um peso em cada item, separe os itens nas malas e mantenha cada mala abaixo do limite da companhia aérea.',
  'help.guide.packing-bags.step.1': 'Clique na etiqueta de peso antes do círculo e digite o peso do item em gramas.',
  'help.guide.packing-bags.step.2': 'O círculo no fim da linha é a mala dela. Clique nele.',
  'help.guide.packing-bags.step.3':
    'Nenhuma mala ainda: Adicionar mala, um nome, Enter. A mala é criada e o item entra direto nela.',
  'help.guide.packing-bags.step.4':
    'O painel Malas aparece à direita assim que existe uma mala: nome, peso, uma barra de preenchimento, quem a carrega e quantos itens há nela, depois Sem mala e Peso total.',
  'help.guide.packing-bags.step.5':
    'Clique em Definir limite e digite o limite em quilos, do jeito que as companhias aéreas informam.',
  'help.guide.packing-bags.step.6': 'O sinal de mais tracejado ao lado do nome de uma mala diz quem a carrega.',
  'help.guide.packing-bags.result':
    'O painel Malas à direita mostra o peso de cada mala contra o seu limite, o que não está em mala nenhuma, e o total.',
  'help.guide.packing-bags.tip.1':
    'O campo de peso, o círculo da mala e o painel Malas só existem enquanto um administrador mantém Rastreamento de malas ligado sob o addon Listas.',
  'help.guide.packing-bags.tip.2':
    'O peso de uma mala é somado no servidor sobre os itens de todos os membros, inclusive os que você não pode ver, então o número é mesmo o que a mala pesa.',
  'help.guide.packing-bags.tip.3':
    'Uma mala sem limite é desenhada contra a mala mais pesada, para que as barras continuem comparáveis. Dê um limite a ela e a barra passa a se medir por ele.',
  // create-todo
  'help.guide.create-todo.title': 'Adicionar uma tarefa',
  'help.guide.create-todo.goal':
    'Anote algo que precisa acontecer, com uma lista, uma prioridade, uma data e um nome ao lado.',
  'help.guide.create-todo.step.1': 'Clique em Nova tarefa no canto superior direito.',
  'help.guide.create-todo.step.2':
    'Dê um nome a ela em Nome da tarefa, e ponha em Descrição tudo o que valer a pena lembrar.',
  'help.guide.create-todo.step.3':
    'Lista agrupa a tarefa. Escolha uma, ou use o sinal de mais ao lado para dar nome a uma nova numa pequena caixa de diálogo.',
  'help.guide.create-todo.step.4': 'Prioridade são quatro botões: Nenhuma, P1, P2 e P3, do vermelho ao azul.',
  'help.guide.create-todo.step.5': 'Data de vencimento abre um calendário, e Atribuído a põe um nome na tarefa.',
  'help.guide.create-todo.step.6': 'Clique em Criar tarefa.',
  'help.guide.create-todo.result':
    'A tarefa está na lista com seus selos, a prioridade, a data de vencimento, a lista e a pessoa a quem foi atribuída, e ela abre no painel da direita.',
  'help.guide.create-todo.tip.1':
    'Só o nome é obrigatório. Todo o resto pode ser preenchido depois pelo painel da direita.',
  'help.guide.create-todo.tip.2': 'Com uma lista selecionada na barra lateral, uma tarefa nova começa nessa lista.',
  'help.guide.create-todo.tip.3': 'Enter no campo do nome cria a tarefa na hora, sem tocar nos outros campos.',
  // todo-filters
  'help.guide.todo-filters.title': 'Encontrar e mudar uma tarefa',
  'help.guide.todo-filters.goal':
    'Corte a lista de tarefas até o que importa agora, e então edite a tarefa em que você parou.',
  'help.guide.todo-filters.step.1':
    'Tarefas na barra lateral: Todos é tudo o que continua em aberto, Minhas tarefas o que está com você, Atrasada o que tem data no passado, Concluído o que está pronto. Cada um leva a sua contagem; clique em Atrasada.',
  'help.guide.todo-filters.step.2':
    'Sob Listas fica uma linha por lista. Escolher uma mostra aquela lista, tarefas concluídas inclusive.',
  'help.guide.todo-filters.step.3':
    'A ordenação no cabeçalho da lista reordena o que está na tela: Prioridade põe P1 primeiro, Data de vencimento põe o prazo mais próximo primeiro. Só um dos dois por vez, e um segundo clique volta para a sua própria ordem.',
  'help.guide.todo-filters.step.4': 'Clique numa tarefa para abri-la no painel da direita.',
  'help.guide.todo-filters.step.5':
    'Mude o que precisar, Descrição, Prioridade, Lista, Data de vencimento ou Atribuído a, depois Salvar alterações. A caixa no cabeçalho do painel marca a tarefa como feita, e Excluir a leva embora na hora.',
  'help.guide.todo-filters.result':
    'A lista mostra só as tarefas que você pediu, e o painel da direita edita a que você escolheu.',
  'help.guide.todo-filters.tip.1':
    'Uma linha de lista conta só o que continua em aberto, mas selecioná-la mostra também as tarefas concluídas. Todos, Minhas tarefas e Atrasada escondem o que está pronto; Concluído não mostra mais nada.',
  'help.guide.todo-filters.tip.2':
    'Prioridade e Data de vencimento na ordenação se excluem, e enquanto um dos dois estiver ligado as linhas não podem mais ser arrastadas para uma ordem sua.',

  // ── Screen: trip-bookings ─────────────────────────────────────────────────────────────
  'help.ctx.trip-bookings.title': 'Reservas',
  'help.ctx.trip-bookings.summary':
    'A aba que guarda tudo o que foi reservado para a viagem e não é um jeito de se deslocar: as hospedagens, as mesas, os ingressos, os passeios, os estacionamentos. Cada reserva é um cartão em Pendente ou em Confirmada, com seu código, seu documento, seus viajantes e seu custo.',
  'help.ctx.trip-bookings.bullet.1':
    'Reserva manual, no canto superior direito, abre o formulário. Os seis tipos que ela cria são Hospedagem, Restaurante, Evento, Passeio, Estacionamento e Outro; voos, trens e o resto vivem na aba Transportes e nunca aparecem aqui.',
  'help.ctx.trip-bookings.bullet.2':
    'Importar de arquivo entrega uma confirmação à análise: EML, PDF, PKPass, HTML ou TXT, no máximo cinco arquivos de 10 MB. O botão só está lá quando o servidor sabe lê-los.',
  'help.ctx.trip-bookings.bullet.3':
    'Os chips ao lado do título filtram por tipo, cada um com sua própria contagem, e Todos traz tudo de volta. Assim que uma reserva nomeia pessoas, a fileira de avatares ao lado dos chips estreita a aba para uma delas.',
  'help.ctx.trip-bookings.bullet.4':
    'Os cartões ficam em duas seções, Pendente e Confirmada, cada uma com sua contagem. Um clique no título de uma seção a recolhe, e se ela está aberta fica guardado para esta viagem.',
  'help.ctx.trip-bookings.bullet.5':
    'Um cartão carrega o ponto de status, o tipo, o título, as datas e os horários, o Código da reserva, o Local / endereço, aquilo a que a reserva está vinculada, seu Link, suas Notas, seus Arquivos e seus Viajantes.',
  'help.ctx.trip-bookings.bullet.6':
    'O lápis de um cartão abre o mesmo formulário de novo; a lixeira pergunta uma vez e então a reserva some. Numa hospedagem, as noites dela no Plano do dia e a despesa vinculada vão junto.',
  // create-booking
  'help.guide.create-booking.title': 'Criar uma reserva',
  'help.guide.create-booking.goal':
    'Coloque à mão na viagem um restaurante, um evento, um passeio, uma vaga de estacionamento ou qualquer outra coisa.',
  'help.guide.create-booking.step.1': 'Clique em Reserva manual no canto superior direito da aba. Nova reserva abre.',
  'help.guide.create-booking.step.2':
    'Escolha o Tipo de reserva na lista no topo do formulário, ao lado de Viajantes. Hospedagem, Restaurante, Evento, Passeio, Estacionamento e Outro são os seis que esta aba cria, e o formulário muda com a escolha: só Hospedagem troca suas datas por um intervalo de dias.',
  'help.guide.create-booking.step.3':
    'Digite o Título. É o único campo em que o formulário insiste, e Adicionar fica morto até ter algo.',
  'help.guide.create-booking.step.4':
    'Defina Data e Horário de início, e Data final e Horário de término se a reserva tiver um fim. Os calendários só oferecem dias dentro da viagem, e um fim que não é posterior ao início diz isso em vermelho e bloqueia Adicionar.',
  'help.guide.create-booking.step.5':
    'Coloque o Código da reserva da confirmação e defina o Status. Pendente ou Confirmada decide em qual das duas seções o cartão aterrissa.',
  'help.guide.create-booking.step.6': 'Clique em Adicionar.',
  'help.guide.create-booking.result':
    'A reserva é um cartão na sua seção, com seu chip de tipo, suas datas e seu código, e todos os outros na viagem a veem aparecer.',
  'help.guide.create-booking.tip.1':
    'Local / endereço oferece endereços reais enquanto você digita; escolher um substitui o que você escreveu, e um endereço digitado por você fica como está.',
  'help.guide.create-booking.tip.2':
    'Link recebe a página da reserva no fornecedor. O cartão transforma isso num link que abre numa nova aba.',
  'help.guide.create-booking.tip.3':
    'As Notas são Markdown, então uma lista ou uma linha em negrito é exibida como tal no cartão.',
  // booking-hotel
  'help.guide.booking-hotel.title': 'Reservar uma hospedagem',
  'help.guide.booking-hotel.goal':
    'Coloque uma hospedagem para que ela conte ao mesmo tempo como reserva e como noites no Plano do dia.',
  'help.guide.booking-hotel.step.1':
    'Clique em Reserva manual e escolha Hospedagem. Os campos de data somem e um bloco de campos de hotel toma o lugar deles.',
  'help.guide.booking-hotel.step.2':
    'Escolha o hotel em Hospedagem. A lista são os lugares da própria viagem, e escolher um escreve o nome dele em Título e o endereço dele em Local / endereço.',
  'help.guide.booking-hotel.step.3':
    'Defina De e Até: a primeira noite e a manhã em que você vai embora. Os dois oferecem os dias da viagem com suas datas, e mantêm um ao outro em ordem.',
  'help.guide.booking-hotel.step.4':
    'Preencha Check-in, Check-in até e Check-out, e o Código da reserva da confirmação.',
  'help.guide.booking-hotel.step.5': 'Clique em Adicionar.',
  'help.guide.booking-hotel.result':
    'O cartão carrega um intervalo de dias em vez de uma data, com os horários de check-in e check-out e o endereço, e a mesma estadia agora fica naqueles dias do plano.',
  'help.guide.booking-hotel.tip.1':
    'Hospedagem é o único tipo sem Data e sem Horário de início. As datas dela são De e Até, e são dias da viagem em vez de um calendário.',
  'help.guide.booking-hotel.tip.2':
    'Deixe Hospedagem vazio e digite o endereço no lugar: o lugar é buscado, criado e fixado no mapa para você.',
  'help.guide.booking-hotel.tip.3': 'Excluir a reserva leva junto as noites do Plano do dia.',
  // link-booking
  'help.guide.link-booking.title': 'Amarrar uma reserva ao plano',
  'help.guide.link-booking.goal':
    'Pendure uma reserva na parada e no lugar aos quais ela pertence, para que apareça onde você vai querer.',
  'help.guide.link-booking.step.1': 'Clique no lápis do cartão que você quer vincular. Editar reserva abre.',
  'help.guide.link-booking.step.2':
    'Abra Vincular à atribuição do dia. A lista é o seu plano: um título por dia, depois as paradas daquele dia, numeradas e com seus horários. Escolha aquela a que a reserva pertence.',
  'help.guide.link-booking.step.3':
    'Local / Atividade vincula o lugar em si. Escolha ali, e Título e Local / endereço se preenchem onde você os deixou vazios.',
  'help.guide.link-booking.step.4': 'Clique em Atualizar.',
  'help.guide.link-booking.result':
    'O cartão nomeia o dia e a parada em Vincular à atribuição do dia, e a reserva viaja junto com aquela parada no Plano do dia.',
  'help.guide.link-booking.tip.1':
    'Sem vínculo (avulsa), no topo da lista, tira o vínculo de novo. Hospedagem não tem seletor de parada nenhum: ela se vincula pelas suas noites.',
  'help.guide.link-booking.tip.2':
    'Escolher uma parada num dia com data preenche uma Data vazia para você. Uma data que você já definiu fica intocada.',
  // booking-travelers
  'help.guide.booking-travelers.title': 'Dizer para quem é uma reserva',
  'help.guide.booking-travelers.goal': 'Marque os viajantes que uma reserva cobre e depois veja só as deles.',
  'help.guide.booking-travelers.step.1':
    'Abra a reserva com o lápis. Viajantes fica no topo do formulário, ao lado de Tipo de reserva, e mostra Atribuir viajantes enquanto ninguém estiver na reserva.',
  'help.guide.booking-travelers.step.2':
    'Clique nele e escolha as pessoas para quem esta reserva é; convidados com nome também estão na lista. Quem é escolhido ganha um tique e seu avatar no campo. Clique no nome de novo para tirar.',
  'help.guide.booking-travelers.step.3': 'Clique em Atualizar.',
  'help.guide.booking-travelers.step.4':
    'Lá em cima na barra de ferramentas, ao lado dos chips de tipo, clique no avatar de um viajante para ver só as reservas dele.',
  'help.guide.booking-travelers.result':
    'O cartão lista as pessoas para quem ele é, e a fileira de avatares estreita a aba para uma delas.',
  'help.guide.booking-travelers.tip.1':
    'No cartão os viajantes só são mostrados, nunca alterados. Eles são definidos aqui, no formulário.',
  'help.guide.booking-travelers.tip.2':
    'A fileira de avatares aparece assim que a viagem tem mais de um membro e pelo menos uma reserva nomeia alguém. O que você escolhe dura esta sessão do navegador.',
  // booking-files
  'help.guide.booking-files.title': 'Guardar o comprovante com a reserva',
  'help.guide.booking-files.goal': 'Anexe a confirmação, o bilhete ou o passe à reserva a que pertencem.',
  'help.guide.booking-files.step.1':
    'Abra a reserva com o lápis, desça até Arquivos e clique em Anexar arquivo. Numa reserva que já existe o documento sobe na hora e o TREK diz Arquivo enviado.',
  'help.guide.booking-files.step.2': 'O documento é listado pelo nome, com um botão para abri-lo e um X ao lado.',
  'help.guide.booking-files.step.3':
    'Vincular arquivo existente oferece os documentos da viagem que ainda não estão nesta reserva. Escolha um e ele é anexado sem enviar nada de novo.',
  'help.guide.booking-files.step.4': 'Clique em Atualizar.',
  'help.guide.booking-files.result': 'O cartão lista os documentos em Arquivos, e um clique em um deles o abre.',
  'help.guide.booking-files.tip.1':
    'Numa reserva que você ainda está criando o documento espera e sobe no momento em que você clica em Adicionar.',
  'help.guide.booking-files.tip.2':
    'O X ao lado de um documento tira o vínculo, não o documento. Ele fica na aba Arquivos da viagem.',
  'help.guide.booking-files.tip.3':
    'Quais tipos de arquivo podem ser anexados é a lista Tipos de arquivo permitidos do administrador; documentos, texto e imagens são permitidos de fábrica.',
  // booking-cost
  'help.guide.booking-cost.title': 'Transformar o preço de uma reserva em custo',
  'help.guide.booking-cost.goal': 'Leve o que uma reserva custa para os Custos, dividido entre as pessoas que pagam.',
  'help.guide.booking-cost.step.1':
    'Abra a reserva e vá até o pé do formulário. Sob Custos estão Criar despesa e Vincular despesa existente, com a nota Salva a reserva e depois abre o editor de despesas.',
  'help.guide.booking-cost.step.2':
    'Clique em Criar despesa. A reserva é salva, o formulário dela fecha e o editor de Custos abre.',
  'help.guide.booking-cost.step.3':
    'Para que foi? já é o título da reserva. Coloque o Valor total e confira a Moeda e o Dia.',
  'help.guide.booking-cost.step.4':
    'Categoria é a que o tipo de reserva sugere. Defina Quem pagou? e como o valor é dividido.',
  'help.guide.booking-cost.step.5': 'Clique em Adicionar despesa.',
  'help.guide.booking-cost.result':
    'O formulário da reserva agora lista a despesa em Despesas vinculadas com o valor dela, e a mesma despesa está na aba Custos, amarrada a esta reserva.',
  'help.guide.booking-cost.tip.1':
    'A categoria segue o tipo: Restaurante vira Comida e bebida, Hospedagem vira Hospedagem, Estacionamento vira Estacionamento, e Evento e Passeio caem os dois em Outros.',
  'help.guide.booking-cost.tip.2':
    'Uma reserva pode levar várias despesas. Vincular despesa existente oferece as de Custos que ainda não pertencem a nada. Em uma vinculada, Desvincular, manter a despesa a solta e a deixa em Custos, enquanto a lixeira a remove.',
  'help.guide.booking-cost.tip.3':
    'Custos só está no formulário enquanto o complemento Custos estiver ligado, o que o administrador liga em Complementos.',
  // filter-bookings
  'help.guide.filter-bookings.title': 'Encontrar uma reserva',
  'help.guide.filter-bookings.goal': 'Reduza uma aba longa ao tipo, à pessoa ou ao estado que você procura.',
  'help.guide.filter-bookings.step.1':
    'Os chips ao lado do título são os tipos que esta viagem realmente usa, cada um com o número que contém. Todos é a aba inteira.',
  'help.guide.filter-bookings.step.2':
    'Clique num chip para ficar só com aquele tipo. Clique num segundo e os dois ficam.',
  'help.guide.filter-bookings.step.3': 'Todos devolve tudo.',
  'help.guide.filter-bookings.step.4':
    'Os avatares ao lado dos chips filtram por viajante, uma pessoa ou várias de uma vez.',
  'help.guide.filter-bookings.step.5':
    'Pendente e Confirmada são as duas seções, cada uma com sua contagem. Clique num título para recolher uma; ela continua recolhida quando você volta.',
  'help.guide.filter-bookings.result':
    'A aba mostra só o que você escolheu, e continua escolhido quando você volta a ela nesta sessão do navegador.',
  'help.guide.filter-bookings.tip.1':
    'Os chips só oferecem os tipos que a viagem tem, então uma viagem sem um único passeio não tem chip Passeio.',
  'help.guide.filter-bookings.tip.2':
    'Um filtro que não casa com nada deixa a aba vazia com Nenhum lugar encontrado. A redação é a da lista de lugares; o sentido é o mesmo.',
  // import-booking-file
  'help.guide.import-booking-file.title': 'Ler uma reserva da confirmação dela',
  'help.guide.import-booking-file.goal':
    'Deixe o TREK tirar a reserva do e-mail ou do PDF que o fornecedor mandou, em vez de digitá-la de novo.',
  'help.guide.import-booking-file.step.1':
    'Clique em Importar de arquivo na barra de ferramentas. Importar confirmações de reserva abre.',
  'help.guide.import-booking-file.step.2':
    'Solte as confirmações na caixa, ou clique nela e escolha-as: EML, PDF, PKPass, HTML e TXT, até cinco arquivos de 10 MB cada. As que você escolheu aparecem pelo nome na caixa.',
  'help.guide.import-booking-file.step.3':
    'Clique em Importar. A janela fecha na hora, porque a leitura acontece em segundo plano.',
  'help.guide.import-booking-file.step.4':
    'Um cartão no canto inferior direito relata a execução sob o nome do arquivo, e ele segue você pelo aplicativo e por um recarregamento. Analisando arquivos… vira um tique quando a leitura termina, e o cartão oferece Importar. Clique nele.',
  'help.guide.import-booking-file.result':
    'A reserva é um cartão em Pendente com as noites, o código e a confirmação em Arquivos, a estadia fica naqueles dias do plano, e com Custos ligado o preço é uma despesa presa a ela.',
  'help.guide.import-booking-file.tip.1':
    'Importar de arquivo só está lá quando o servidor sabe ler confirmações, e isso pede ou o extrator ou o complemento Análise por IA. Esse o administrador liga em Complementos.',
  'help.guide.import-booking-file.tip.2':
    'Se nada pôde ser lido, o cartão diz isso e oferece Try AI parsing, que manda os mesmos arquivos direto para o modelo. Uma análise terminada fica guardada por dez minutos; comece a revisão dentro desse prazo.',
  'help.guide.import-booking-file.tip.3':
    'A confirmação só é anexada quando o tipo dela está nos Tipos de arquivo permitidos das configurações de administração. PDF já vem de fábrica; um e-mail, EML, precisa ser adicionado antes, ou a reserva é salva sem ela.',
  // edit-booking
  'help.guide.edit-booking.title': 'Alterar uma reserva',
  'help.guide.edit-booking.goal':
    'Corrija um horário, acrescente o código que chegou depois, ou passe uma reserva de Pendente para Confirmada.',
  'help.guide.edit-booking.step.1':
    'Clique no lápis no cabeçalho do cartão. Editar reserva abre com tudo o que a reserva sabe.',
  'help.guide.edit-booking.step.2':
    'Mude o que precisa mudar, aqui o Código da reserva que o operador finalmente mandou.',
  'help.guide.edit-booking.step.3': 'Ponha Status em Confirmada.',
  'help.guide.edit-booking.step.4': 'Clique em Atualizar.',
  'help.guide.edit-booking.result':
    'O cartão se muda: uma reserva confirmada fica na seção Confirmada atrás de um ponto verde, e todos na viagem a veem mudar de lugar.',
  'help.guide.edit-booking.tip.1':
    'Um Código da reserva que você não consegue ler é Ocultar códigos de reserva nas Configurações, em Exibição. Passe o mouse por cima, ou clique nele, e ele fica legível.',
  'help.guide.edit-booking.tip.2':
    'Mude o tipo e a categoria de uma despesa vinculada acompanha, a não ser que você tivesse escolhido uma categoria à mão no editor de Custos.',
  'help.guide.edit-booking.tip.3':
    'Uma hospedagem também é editada aqui: os dias De e Até dela estão no mesmo formulário.',
  // delete-booking
  'help.guide.delete-booking.title': 'Excluir uma reserva',
  'help.guide.delete-booking.goal': 'Tire da viagem uma reserva que não deu certo.',
  'help.guide.delete-booking.step.1': 'Clique na lixeira no cabeçalho do cartão.',
  'help.guide.delete-booking.step.2':
    'Excluir reserva? nomeia a que você escolheu e diz que ela será excluída permanentemente.',
  'help.guide.delete-booking.step.3': 'Clique em Confirmar.',
  'help.guide.delete-booking.result':
    'O cartão sumiu, para todos na viagem. Uma reserva não tem desfazer, então a pergunta é a última parada.',
  'help.guide.delete-booking.tip.1':
    'Excluir uma reserva de hospedagem também tira as noites dela do Plano do dia e remove a despesa que estava vinculada a ela.',
  'help.guide.delete-booking.tip.2':
    'Os documentos que estavam anexados ficam na aba Arquivos da viagem; só o vínculo deles com a reserva some.',
  // import-booking-file
  'help.guide.import-booking-file.step.5':
    'Cada reserva encontrada abre em Nova reserva, uma após a outra, já preenchida. Para um hotel, isso é o nome em Título e, quando a viagem tem o lugar, em Hospedagem, o Local / endereço dele, De e Até nas noites dele, Check-in e Check-out, o Código da reserva, a confirmação em Arquivos e, com Custos ligado, o preço como Despesa vinculada. Confira e clique em Adicionar.',

  // ── Screen: trip-costs ────────────────────────────────────────────────────────────────
  'help.ctx.trip-costs.title': 'Custos',
  'help.ctx.trip-costs.summary':
    'O dinheiro da viagem: cada despesa num registro com data, quem a adiantou e quem deve por ela, na moeda em que estava o comprovante, e, na coluna da direita, quem precisa pagar quem para tudo ficar quitado de novo.',
  'help.ctx.trip-costs.bullet.1':
    'Quatro cartões no topo: Você deve e Devem a você são o seu lado do acerto, Valor pendente é o que está registrado mas ainda não tem pagador, e Gasto total da viagem soma tudo, com Sua parte e Você pagou abaixo.',
  'help.ctx.trip-costs.bullet.2':
    'Adicionar despesa, no canto superior direito, abre o editor; Acertar contas, ao lado, registra de uma vez todas as transferências em aberto.',
  'help.ctx.trip-costs.bullet.3':
    'O registro é agrupado por dia, o mais recente primeiro, com o total daquele dia à direita. Uma linha traz a categoria como aba colorida, o nome, as fichas dos pagadores, a nota e o valor, mais você emprestou ou você pegou emprestado quando a divisão deixa você por cima ou por baixo nela.',
  'help.ctx.trip-costs.bullet.4':
    'Acima da lista ficam Buscar despesas…, um filtro de categoria, um filtro de dia, o seletor Todas / Pagas por mim / Devem a mim e o botão Exportar CSV.',
  'help.ctx.trip-costs.bullet.5':
    'A coluna da direita é a resposta: Acertar contas lista quem paga quem, Saldos mostra o excedente ou o déficit de cada viajante, Orçamento final o que a viagem custa a cada um deles, e Por categoria para onde foi o dinheiro.',
  'help.ctx.trip-costs.bullet.6':
    'Um pagamento registrado fica no mesmo registro como uma linha própria, com Editar e Desfazer ao lado; uma despesa tem um lápis e uma lixeira, e a lixeira a exclui sem perguntar.',
  // add-expense
  'help.guide.add-expense.title': 'Adicionar uma despesa',
  'help.guide.add-expense.goal': 'Registre quanto algo custou, quem pagou e com quem é dividido.',
  'help.guide.add-expense.step.1':
    'Clique em Adicionar despesa no canto superior direito da aba Custos. O editor abre, com a data de hoje e com todo mundo já na divisão.',
  'help.guide.add-expense.step.2':
    'Digite para que foi em Para que foi?, o único campo que precisa ser preenchido, e o número do comprovante em Valor total.',
  'help.guide.add-expense.step.3':
    'Moeda e Dia ficam abaixo do valor. Moeda começa na moeda da viagem; troque-a e o editor mostra quanto o valor vale na moeda da viagem. Dia começa em hoje e é o dia sob o qual o registro agrupa a despesa.',
  'help.guide.add-expense.step.4':
    'Escolha uma Categoria. São catorze e não podem ser alteradas: a que você escolher é a aba colorida da linha e a barra em Por categoria.',
  'help.guide.add-expense.step.5':
    'Em Quem pagou?, escolha a pessoa que realmente adiantou o dinheiro. Você vem pré-selecionado; Ninguém pagou ainda registra o valor sem que ninguém deva por ele, e Várias pessoas pagaram divide a conta entre vários pagadores.',
  'help.guide.add-expense.step.6':
    'Split começa em Equally com todo mundo incluído, e ao lado de cada nome está a parte que sai. Clique em Adicionar despesa para salvar.',
  'help.guide.add-expense.result':
    'A despesa está no registro sob o seu dia, contada em Gasto total da viagem, e a coluna de acerto recalculou quem deve a quem.',
  'help.guide.add-expense.tip.1':
    'Do jeito que abre, a despesa fica na moeda da viagem, com a data de hoje e dividida em partes iguais entre todos: só o nome e o valor precisam mesmo ser preenchidos.',
  'help.guide.add-expense.tip.2':
    'O ± ao lado do valor transforma a despesa num reembolso. Um total negativo devolve dinheiro em vez de tirá-lo, e a divisão corre ao contrário.',
  'help.guide.add-expense.tip.3':
    'Anexar comprovante / nota, embaixo, aceita imagens e PDFs. Eles são enviados quando você salva, vão parar nos Arquivos da viagem, e ao lado do nome na lista aparece uma ficha Comprovantes.',
  // expense-payers
  'help.guide.expense-payers.title': 'Dizer quem pagou a conta',
  'help.guide.expense-payers.goal':
    'Registre quem tirou do próprio bolso numa despesa, a outra metade da conta do acerto.',
  'help.guide.expense-payers.step.1':
    'Abra uma despesa com o lápis ao lado da sua linha e olhe Quem pagou?. Uma pessoa pagou é o padrão: o menu suspenso nomeia a única pessoa que adiantou o dinheiro.',
  'help.guide.expense-payers.step.2':
    'Ninguém pagou ainda, a primeira entrada desse menu suspenso, registra o valor sem que ninguém deva nada. A despesa conta mesmo assim em Gasto total da viagem.',
  'help.guide.expense-payers.step.3':
    'Várias pessoas pagaram, o link ao lado do rótulo, abre uma linha por viajante. Inclua quem pagou e digite quanto cada um colocou; os valores precisam somar o total.',
  'help.guide.expense-payers.step.4':
    'Uma despesa que ninguém pagou é marcada como Pendente na sua linha e contada no cartão Valor pendente, onde se junta o gasto registrado mas não acertado.',
  'help.guide.expense-payers.result':
    'Quem pagou decide quem recebe de volta, a divisão decide quem paga, e Saldos é a diferença entre os dois.',
  'help.guide.expense-payers.tip.1':
    'Quem pagou? e Split são independentes: você pode pagar um jantar em que não esteve, e entrar na divisão de um que não pagou.',
  'help.guide.expense-payers.tip.2':
    'Com vários pagadores os valores precisam somar o total. Inclua mais um e os outros se reorganizam em torno dele; enquanto não baterem, o editor diz quanto precisam somar e se recusa a salvar.',
  'help.guide.expense-payers.tip.3':
    'Remover um pagador não remove a despesa: o valor continua em Gasto total da viagem e a linha passa a Pendente.',
  // split-expense
  'help.guide.split-expense.title': 'Dividir uma conta entre os viajantes',
  'help.guide.split-expense.goal':
    'Decida quem deve por uma despesa: todos em partes iguais, por valor, ou linha a linha do comprovante.',
  'help.guide.split-expense.step.1':
    'No editor da despesa, Split lista cada viajante. Clique num nome para deixá-lo de fora desta despesa; um viajante excluído aparece como Fora e não deve nada por ela.',
  'help.guide.split-expense.step.2':
    'Equally é o padrão: cada viajante incluído recebe a mesma parte, e a linha abaixo da lista diz entre quantos é dividido e quanto sai cada parte.',
  'help.guide.split-expense.step.3':
    'Custom troca as partes por campos de valor. Digite quanto cada viajante deve; a linha abaixo vai somando e fica verde em A divisão bate com o total. Não salva enquanto não bater.',
  'help.guide.split-expense.step.4':
    'Ticket divide o comprovante linha a linha: Adicionar item, depois um nome e um preço por linha, e sob Dividindo entre: os viajantes que compartilham aquela linha.',
  'help.guide.split-expense.step.5':
    'Parte de cada um, abaixo das linhas, mostra quanto cada viajante acaba devendo, e Valor total, no topo, é somado a partir das linhas. Clique em Salvar.',
  'help.guide.split-expense.result':
    'A divisão é aquilo de que cada saldo é construído. Ela é salva junto com a despesa e pode ser alterada depois sem mexer em mais nada.',
  'help.guide.split-expense.tip.1':
    'Um viajante que você deixa de fora aparece como Fora e não deve nada por essa despesa; os outros assumem a parte dele.',
  'help.guide.split-expense.tip.2':
    'Equally fecha até o centavo: o centavo que sobra gira de despesa em despesa, para que não seja sempre a mesma pessoa a pagá-lo.',
  'help.guide.split-expense.tip.3':
    'O modo Ticket soma Valor total sozinho e deixa o campo cinza: as linhas do comprovante são o total.',
  // expense-currency
  'help.guide.expense-currency.title': 'Lançar uma despesa em outra moeda',
  'help.guide.expense-currency.goal': 'Lance o que o comprovante realmente diz e deixe o TREK guardar a taxa.',
  'help.guide.expense-currency.step.1':
    'Abra Adicionar despesa e preencha o nome e o valor exatamente como diz o comprovante, o número em si e não uma conversão dele.',
  'help.guide.expense-currency.step.2':
    'Abra Moeda e escolha a moeda do comprovante. A lista traz todos os códigos que o TREK conhece e é pesquisável: digite as três letras.',
  'help.guide.expense-currency.step.3':
    'Abaixo dos campos aparece uma linha com quanto o valor vale agora, marcada como taxa ao vivo. É uma prévia, não o que fica guardado.',
  'help.guide.expense-currency.step.4':
    'Clique em Adicionar despesa. A taxa é congelada na hora: daí em diante esta despesa vale o que valia no dia em que você a lançou.',
  'help.guide.expense-currency.step.5':
    'No registro a linha traz os dois números sob o nome: o que você digitou, uma seta, e quanto conta na moeda da viagem. Todo total, saldo e acerto acima usa o segundo.',
  'help.guide.expense-currency.result':
    'A despesa mantém o valor e a moeda que você digitou. O registro mostra os dois, e os totais e saldos da viagem continuam na moeda da viagem.',
  'help.guide.expense-currency.tip.1':
    'A taxa é congelada no momento em que você salva, para que uma dívida acertada não reabra porque o mercado se mexeu na semana seguinte. Só mudar a moeda da despesa congela uma nova.',
  'help.guide.expense-currency.tip.2':
    'Moeda de exibição em Configurações muda só o que você lê; os valores guardados nunca se mexem. Deixada vazia, cada viagem é mostrada na sua própria moeda.',
  'help.guide.expense-currency.tip.3':
    'A moeda da viagem fica na própria viagem, em Editar viagem, e exige o direito Editar detalhes da viagem. Alterá-la reancora cada taxa congelada em vez de redenominar os valores.',
  // filter-costs
  'help.guide.filter-costs.title': 'Encontrar uma despesa, ou os gastos de um dia',
  'help.guide.filter-costs.goal': 'Reduza um registro longo ao que você realmente procura.',
  'help.guide.filter-costs.step.1':
    'Digite em Buscar despesas…, acima da lista. Ele procura no nome da despesa enquanto você digita.',
  'help.guide.filter-costs.step.2':
    'Todas as categorias abre as catorze categorias. Escolha uma e só ficam as despesas daquela categoria.',
  'help.guide.filter-costs.step.3':
    'Todos os dias lista cada dia em que algo foi gasto. Escolha um e um aviso substitui os cabeçalhos de dia por aquele dia, quantas despesas ele tem e o seu total.',
  'help.guide.filter-costs.step.4':
    'O seletor Todas / Pagas por mim / Devem a mim é a sua própria visão do registro: aquilo em que você adiantou dinheiro, e aquilo que ainda está para receber de volta.',
  'help.guide.filter-costs.step.5':
    'Exportar CSV, no fim da linha, escreve cada despesa num arquivo, com o valor original, a sua moeda e o valor convertido.',
  'help.guide.filter-costs.result':
    'Os filtros se combinam, e os grupos de dia são redesenhados com os seus próprios totais para o que sobra.',
  'help.guide.filter-costs.tip.1':
    'Pagamentos registrados não têm nome nem categoria, então uma busca ou um filtro de categoria os esconde. O filtro de dia os mantém, sob o dia em que o pagamento foi registrado.',
  'help.guide.filter-costs.tip.2':
    'Exportar CSV exporta sempre todas as despesas, seja o que for que esteja filtrado na tela, uma linha por despesa.',
  // settle-up
  'help.guide.settle-up.title': 'Descobrir quem deve a quem, e acertar',
  'help.guide.settle-up.goal':
    'Transforme um monte de despesas compartilhadas no menor número de transferências que deixam todo mundo quite, e registre-as conforme acontecem.',
  'help.guide.settle-up.step.1':
    'O cartão Acertar contas, na coluna da direita, lista as transferências que deixariam todo mundo quite: quem paga quem, e quanto. O número ao lado do título é quantas ainda estão em aberto.',
  'help.guide.settle-up.step.2':
    'Acertar, ao lado de uma transferência, registra-a como feita. O fluxo some do cartão e os saldos são redesenhados.',
  'help.guide.settle-up.step.3':
    'A transferência registrada é uma linha no registro, sob o dia em que aconteceu, marcada como Pagamento com os dois viajantes e o valor.',
  'help.guide.settle-up.step.4':
    'Ao lado dessa linha o lápis corrige um pagamento e Desfazer o retira, e a transferência volta ao cartão Acertar contas.',
  'help.guide.settle-up.step.5':
    'Adicionar pagamento, no cabeçalho do cartão, registra uma transferência que não seguiu uma sugestão. Escolha De e Para, o Valor, a sua moeda e o dia em que aconteceu.',
  'help.guide.settle-up.step.6':
    'Acertar contas, no cabeçalho no alto da tela, registra de uma vez todas as transferências em aberto, como um grupo que fica quite no fim de uma viagem.',
  'help.guide.settle-up.result':
    'Cada transferência registrada é uma linha no registro e uma linha a menos no cartão Acertar contas. Quando o cartão diz Todos quitados, a viagem está paga.',
  'help.guide.settle-up.tip.1':
    'O cartão mostra o menor número de transferências, não cada dívida: três pessoas que se devem em círculo se reduzem a um ou dois pagamentos.',
  'help.guide.settle-up.tip.2':
    'Acertar registra uma transferência, não move dinheiro. Envie pelo meio que você usa e depois clique.',
  'help.guide.settle-up.tip.3':
    'Um pagamento pode ser feito em qualquer moeda, então pagar em euros uma dívida em ienes é normal: a caixa de diálogo tem o seu próprio seletor de moeda e congela essa taxa também.',
  // final-budget
  'help.guide.final-budget.title': 'Ver quanto a viagem custou a cada viajante',
  'help.guide.final-budget.goal': 'Leia o lado por pessoa do registro: o saldo de hoje, e o custo real por pessoa.',
  'help.guide.final-budget.step.1':
    'Saldos mostra a posição de cada viajante: uma barra verde para a direita se a viagem deve a ele, uma barra vermelha para a esquerda se ele deve à viagem, e o valor ao lado do nome.',
  'help.guide.final-budget.step.2':
    'Orçamento final, abaixo dele, responde a outra pergunta: não quem deve o quê agora, mas quanto a viagem custa a cada viajante depois que tudo foi devolvido.',
  'help.guide.final-budget.step.3':
    'Clique num nome para abrir a conta: Despesas pagas, depois Reembolsos líquidos e Reembolsos pendentes abaixo.',
  'help.guide.final-budget.step.4':
    'Sob cada linha ficam as linhas de que ela é feita: as despesas que aquele viajante pagou, as transferências já registradas e as que ainda estão em aberto. Elas somam exatamente a linha acima.',
  'help.guide.final-budget.result':
    'Saldos é quem está por cima ou por baixo hoje; Orçamento final é quanto a viagem acaba custando a cada um de vocês depois que tudo é devolvido.',
  'help.guide.final-budget.tip.1':
    'Registrar um pagamento não muda o orçamento final de ninguém. Só move um valor dos reembolsos pendentes para os reembolsos líquidos.',
  'help.guide.final-budget.tip.2':
    'Uma despesa sem pagador fica de fora dos dois cartões, do mesmo jeito que fica de fora das sugestões de acerto.',
  // expense-from-booking
  'help.guide.expense-from-booking.title': 'Transformar uma reserva numa despesa',
  'help.guide.expense-from-booking.goal':
    'Anexe o que um voo, um hotel ou um lugar realmente custou ao registro a que pertence.',
  'help.guide.expense-from-booking.step.1': 'Abra a reserva na aba Transportes ou Reservas e clique no lápis dela.',
  'help.guide.expense-from-booking.step.2':
    'Role até o bloco Custos no fim do formulário. Ele oferece Criar despesa, que salva a reserva primeiro, e Vincular despesa existente para uma que já está na aba Custos.',
  'help.guide.expense-from-booking.step.3':
    'Clique em Criar despesa. A reserva é salva, o formulário fecha, e o editor de Custos abre com o título da reserva como nome e o seu tipo já associado a uma categoria.',
  'help.guide.expense-from-booking.step.4':
    'Preencha o valor e a moeda dele, quem pagou e a divisão como em qualquer despesa, e salve. Ao reabrir a reserva, ela aparece em Despesas vinculadas, com um lápis para editar, Desvincular, manter a despesa para soltar e uma lixeira para remover.',
  'help.guide.expense-from-booking.result':
    'A reserva carrega o seu custo, e a despesa é uma linha comum na aba Custos, com pagador, divisão e moeda como qualquer outra.',
  'help.guide.expense-from-booking.tip.1':
    'Excluir a reserva exclui junto as despesas vinculadas. Remover despesa, no bloco Custos da reserva, faz o contrário: a despesa sai, a reserva fica. Desvincular, manter a despesa mantém as duas.',
  'help.guide.expense-from-booking.tip.2':
    'Um lugar tem o mesmo bloco no seu formulário, onde Criar despesa salva o lugar primeiro.',

  // ── Screen: trip-transports ───────────────────────────────────────────────────────────
  'help.ctx.trip-transports.title': 'Transportes',
  'help.ctx.trip-transports.summary':
    'Tudo o que leva você entre as paradas: voos, trens, ônibus, carros, táxis, bicicletas, cruzeiros, balsas e as conexões de transporte público que o TREK busca para você. A aba é a lista delas; também são criadas e lidas no plano, e desenhadas no mapa.',
  'help.ctx.trip-transports.bullet.1':
    'A aba guarda só os trajetos. Hospedagem, restaurantes, eventos e ingressos vivem em Reservas, então a mesma entrada nunca aparece duas vezes.',
  'help.ctx.trip-transports.bullet.2':
    'A barra de ferramentas conta todos em Todos e dá a cada tipo em uso um chip próprio com a própria contagem, Voo, Trem, Carro, Transporte público. Transporte, à direita, adiciona um à mão.',
  'help.ctx.trip-transports.bullet.3':
    'Os cartões vêm em três grupos, cada um recolhível pelo título: Transporte público automático para as conexões que a busca planejou, depois Pendente, depois Confirmada.',
  'help.ctx.trip-transports.bullet.4':
    'Um cartão carrega o status, o tipo, os dias que abrange, os horários, o Código da reserva, a rota e a Companhia aérea com o Nº do voo, ou o Nº do trem, a Plataforma e o Assento. O lápis o abre, a lixeira o exclui depois de uma pergunta.',
  'help.ctx.trip-transports.bullet.5':
    'Os transportes também nascem no plano: todo cabeçalho de dia tem um mais para Adicionar transporte e um botão de bonde para Transporte público, e o conector de tempo de viagem entre duas paradas abre a mesma busca para aquele único trecho.',
  'help.ctx.trip-transports.bullet.6':
    'Um transporte com as duas pontas definidas desenha uma linha no mapa. O ícone de rota na linha dele no plano do dia acende essa linha, e Mostrar todas as rotas de reservas, na barra acima dos dias, alterna a viagem inteira.',
  // transports-list
  'help.guide.transports-list.title': 'Ler a aba Transportes',
  'help.guide.transports-list.goal': 'Saber o que a lista diz antes de mudar qualquer coisa nela.',
  'help.guide.transports-list.step.1':
    'Transportes é a segunda aba da viagem. Guarda só os trajetos: hotéis, restaurantes, eventos e ingressos estão em Reservas.',
  'help.guide.transports-list.step.2':
    'A barra de ferramentas conta cada transporte em Todos e dá a cada tipo em uso um chip próprio com a própria contagem. Clique num chip para ficar só com aquele tipo, clique de novo para soltá-lo. Vários chips podem estar ligados ao mesmo tempo, e Todos limpa tudo.',
  'help.guide.transports-list.step.3':
    'Transporte público automático é um grupo à parte, as conexões que a busca de transporte público planejou. Pendente e Confirmada guardam tudo o que foi lançado à mão. A seta ao lado de um título recolhe um grupo.',
  'help.guide.transports-list.step.4':
    'Um cartão diz tudo: o ponto de status com Pendente ou Confirmada, o tipo, os dias que abrange com suas datas, os horários, o Código da reserva, a rota, e a Companhia aérea com o Nº do voo, ou o Nº do trem, a Plataforma e o Assento.',
  'help.guide.transports-list.step.5':
    'O lápis abre o transporte para edição, a lixeira o exclui, depois de uma pergunta que nomeia o que vai embora.',
  'help.guide.transports-list.result':
    'A lista fica reduzida ao que você procurava, e cada cartão diz num relance se o trajeto está reservado.',
  'help.guide.transports-list.tip.1':
    'Os chips e os grupos recolhidos são lembrados por viagem, então a aba abre de novo do jeito que você deixou.',
  'help.guide.transports-list.tip.2':
    'Importar de arquivo e AirTrail só se juntam a Transporte na barra de ferramentas quando o servidor sabe ler confirmações de reserva e quando há uma instância do AirTrail conectada. Sem eles, a lista se enche à mão e pela busca de transporte público.',
  // add-transport
  'help.guide.add-transport.title': 'Adicionar um transporte a um dia',
  'help.guide.add-transport.goal': 'Pôr o trajeto que leva você de uma parada à seguinte no dia em que ele acontece.',
  'help.guide.add-transport.step.1':
    'Todo cabeçalho de dia traz quatro botões pequenos à direita. Clique no mais, cuja dica diz Adicionar transporte. O formulário abre com Data já marcada nesse dia.',
  'help.guide.add-transport.step.2':
    'Tipo de reserva escolhe o que você vai pegar: Voo, Trem, Ônibus, Carro, Táxi, Bicicleta, Cruzeiro, Balsa ou Outro. O formulário acompanha. Um voo ganha um aeroporto em cada trecho, um trem uma cadeia de estações, um carro as palavras Retirada e Devolução e Paradas pelo caminho.',
  'help.guide.add-transport.step.3':
    'Título é o único campo que precisa ser preenchido; Adicionar fica cinza sem ele. Escreva o que você reconheceria num painel de embarque.',
  'help.guide.add-transport.step.4':
    'De e Para buscam uma estação, um porto ou um endereço. Digite ao menos três letras e escolha um resultado da lista. Um nome apenas digitado não carrega coordenadas, então não desenha nada no mapa.',
  'help.guide.add-transport.step.5':
    'Data e Horário de início dizem quando ele corre, Data final e Horário de término quando ele acaba; um trajeto que chega no dia seguinte toma ali o dia seguinte. Código da reserva, Status com Pendente ou Confirmada, e Notas são opcionais.',
  'help.guide.add-transport.step.6': 'Clique em Adicionar.',
  'help.guide.add-transport.result':
    'O transporte é uma linha no dia, no seu horário entre as paradas, e um cartão na aba Transportes sob Pendente ou Confirmada.',
  'help.guide.add-transport.tip.1':
    'A linha cai onde o horário de início a coloca, depois da última parada que começa mais cedo. A alça dela a arrasta para qualquer outro ponto do dia, ou para outro dia.',
  'help.guide.add-transport.tip.2':
    'Anexar arquivo, em Arquivos, recebe a passagem, e Criar despesa, em Custos, salva a reserva e abre o editor de Custos para a tarifa.',
  'help.guide.add-transport.tip.3':
    'Viajantes marca quem está nesse trajeto. Assim que um transporte tem viajantes, a barra de ferramentas da aba faz crescer os avatares deles e filtra a lista por eles.',
  // plan-transit
  'help.guide.plan-transit.title': 'Planejar uma conexão de transporte público',
  'help.guide.plan-transit.goal':
    'Deixar o TREK buscar os trens e ônibus reais entre dois pontos de um dia e pôr no plano o que você escolher.',
  'help.guide.plan-transit.step.1':
    'No cabeçalho do dia, clique no botão de bonde, Transporte público. A busca abre para aquele dia.',
  'help.guide.plan-transit.step.2':
    'De e Para aceitam uma parada ou uma estação. Com a caixa ainda vazia, são oferecidas as paradas do próprio dia e as hospedagens da viagem; ao digitar duas letras, são buscadas as estações da tabela de horários. Inverter, entre as duas caixas, vira a conexão ao contrário.',
  'help.guide.plan-transit.step.3':
    'Partida ou Chegada com um horário diz quando você quer viajar, e Melhor rota, Menos baldeações ou Menos caminhada diz como as respostas devem ser ordenadas.',
  'help.guide.plan-transit.step.4':
    'Os chips abaixo dizem quais modos podem ser usados: Trem, Metrô, Bonde, Ônibus, Barca e Teleférico. Desligue um para deixá-lo de fora, pelo menos um fica ligado. Depois clique em Buscar.',
  'help.guide.plan-transit.step.5':
    'Cada resultado dá partida e chegada, quanto tempo leva, quantas baldeações e quanta caminhada, e as linhas nas próprias cores. Clique num para abri-lo parada por parada, com as plataformas e as caminhadas entre as linhas.',
  'help.guide.plan-transit.step.6': 'Clique em Adicionar ao dia.',
  'help.guide.plan-transit.result':
    'A conexão é uma linha no dia com as suas linhas de transporte, as suas baldeações e o seu tempo a pé, e um cartão na aba Transportes sob Transporte público automático.',
  'help.guide.plan-transit.tip.1':
    'As conexões vêm do Transitous, um serviço comunitário livre sobre dados públicos de horários: sem chave, sem conta. Um administrador pode apontar a busca para o Google no lugar.',
  'help.guide.plan-transit.tip.2':
    'Nada encontrado? Os feeds cobrem uma região e um período. Tente outro horário, ligue mais modos, ou escolha uma estação em vez do lugar em si. A mensagem nomeia o serviço que respondeu.',
  'help.guide.plan-transit.tip.3':
    'A mesma busca abre para um único trecho: clique no conector de tempo de viagem entre duas paradas e escolha Transporte público. De, Para e o horário de partida já vêm preenchidos.',
  // change-transit-route
  'help.guide.change-transit-route.title': 'Abrir e mudar uma conexão planejada',
  'help.guide.change-transit-route.goal': 'Ler a conexão parada por parada, renomeá-la, ou buscar o trajeto de novo.',
  'help.guide.change-transit-route.step.1':
    'Na aba Transportes, as conexões planejadas ficam sob Transporte público automático. Clique no cartão.',
  'help.guide.change-transit-route.step.2':
    'Duração, Baldeações e A pé ficam no topo. Itinerário, abaixo, percorre a conexão parada por parada, com as plataformas e as caminhadas entre as linhas.',
  'help.guide.change-transit-route.step.3':
    'Alterar trajeto roda a busca de novo, já preenchida com as duas pontas desta conexão e com o dia dela.',
  'help.guide.change-transit-route.step.4':
    'Escolha outra conexão e clique em Adicionar ao dia; ela toma o lugar da antiga. Editar detalhes, ao lado de Alterar trajeto, abre em vez disso o formulário de transporte comum, onde ficam o Código da reserva, o Status, os viajantes e os arquivos.',
  'help.guide.change-transit-route.result':
    'A viagem de transporte público carrega o novo itinerário, e o cartão dela na aba Transportes mostra as novas linhas e horários.',
  'help.guide.change-transit-route.tip.1':
    'O título da viagem de transporte público é só texto: o lápis ao lado o renomeia sem tocar no trajeto. Notas, abaixo, aceitam markdown e têm uma aba Editar e uma aba Prévia.',
  'help.guide.change-transit-route.tip.2':
    'Excluir, no pé da viagem de transporte público, remove a conexão da viagem; o dia mantém as paradas.',
  // leg-travel-mode
  'help.guide.leg-travel-mode.title': 'Mudar como um trecho é percorrido',
  'help.guide.leg-travel-mode.goal':
    'Fazer a pé um trecho de um dia que no resto é de carro, ou entregar esse trecho à busca de transporte público.',
  'help.guide.leg-travel-mode.step.1':
    'Os conectores entre as paradas só aparecem quando a rota do dia está ligada. Clique no dia para abri-lo, depois em Rota abaixo das paradas.',
  'help.guide.leg-travel-mode.step.2':
    'Cada conector nomeia o tempo de viagem e a distância daquele trecho, com o ícone do meio em que ele foi calculado: um carro para dirigir, um pé para caminhar.',
  'help.guide.leg-travel-mode.step.3':
    'Clique no conector. O menu oferece De carro e A pé, Transporte público, e Usar padrão do dia.',
  'help.guide.leg-travel-mode.step.4': 'Escolha A pé. Só este trecho muda; o resto do dia mantém o seu meio.',
  'help.guide.leg-travel-mode.result':
    'O trecho mostra o ícone do pé e o seu tempo a pé, e os outros trechos do dia mantêm o meio do dia.',
  'help.guide.leg-travel-mode.tip.1':
    'O meio pertence ao trecho, não ao dia: os botões De carro e A pé do dia inteiro nunca sobrescrevem um trecho que você definiu à mão. Usar padrão do dia devolve o trecho a eles.',
  'help.guide.leg-travel-mode.tip.2':
    'Transporte público, no mesmo menu, abre a busca de conexões para exatamente este trecho, com as duas pontas e o horário de partida já preenchidos.',
  'help.guide.leg-travel-mode.tip.3':
    'Os tempos vêm de um roteador público sobre estradas e calçadas reais. Um trecho que ele não consegue responder mantém a linha reta e não mostra tempo.',
  // edit-transport
  'help.guide.edit-transport.title': 'Mudar ou excluir um transporte',
  'help.guide.edit-transport.goal':
    'Corrigir um horário, uma plataforma ou um código de reserva, ou tirar o trajeto da viagem.',
  'help.guide.edit-transport.step.1':
    'No plano do dia, um transporte é uma linha colorida entre as paradas. Clique nela.',
  'help.guide.edit-transport.step.2':
    'O formulário é o mesmo que o criou, com Editar transporte na barra de título. Tudo pode mudar: o tipo, a rota, os dias e horários, o Código da reserva, o Status.',
  'help.guide.edit-transport.step.3':
    'A rota de um voo é uma cadeia de aeroportos, a de um trem uma cadeia de estações. Adicionar parada põe mais uma no meio, e cada trecho mantém os próprios horários e o próprio número de voo ou de trem.',
  'help.guide.edit-transport.step.4':
    'Clique em Atualizar. Para remover o transporte de vez, use a lixeira no cartão dele na aba Transportes e confirme.',
  'help.guide.edit-transport.result':
    'A mudança aparece em todo lugar onde o transporte está: na aba Transportes, no dia em que ele corre, e na linha dele no mapa.',
  'help.guide.edit-transport.tip.1':
    'O mesmo formulário abre dos dois lados, pelo lápis no cartão da aba Transportes e pela linha do próprio transporte no plano do dia. Uma conexão de transporte público planejada é a exceção: a linha dela abre a viagem de transporte público, e Editar detalhes leva de lá a este formulário.',
  'help.guide.edit-transport.tip.2':
    'Mover um transporte para outro dia não precisa do formulário: arraste a linha dele de um cartão de dia para o seguinte.',
  // transport-on-map
  'help.guide.transport-on-map.title': 'Desenhar um transporte no mapa',
  'help.guide.transport-on-map.goal': 'Ver por onde um voo, um trajeto de carro ou uma conexão passa de verdade.',
  'help.guide.transport-on-map.step.1':
    'Um transporte com as duas pontas definidas traz um pequeno ícone de rota na linha dele no plano do dia. Clique nele; o rótulo vira Ocultar rotas de reservas.',
  'help.guide.transport-on-map.step.2':
    'A rota é desenhada no mapa, com um marcador em forma de pílula em cada ponta levando o ícone do transporte.',
  'help.guide.transport-on-map.step.3':
    'Clique num marcador de ponta para ler a reserva sem sair do mapa: os horários, a Companhia aérea e o Nº do voo, o Código da reserva e o endereço. Fechar guarda a folha.',
  'help.guide.transport-on-map.step.4':
    'O ícone de rota na barra acima dos dias faz a viagem inteira de uma vez: Mostrar todas as rotas de reservas, e Ocultar todas as rotas de reservas para limpar de novo.',
  'help.guide.transport-on-map.step.5':
    'Uma conexão de transporte público planejada não tem ícone próprio. Ela é desenhada pelo botão Rota do dia, e por isso Ocultar todas as rotas de reservas não a limpa enquanto a rota daquele dia ainda estiver ligada.',
  'help.guide.transport-on-map.result':
    'As rotas estão no mapa com um marcador em cada ponta, e ficam ali até você desligá-las de novo.',
  'help.guide.transport-on-map.tip.1':
    'Um voo, um cruzeiro e uma balsa desenham uma curva, um carro, um ônibus, um táxi e uma bicicleta seguem as estradas reais, e um trem ou uma conexão planejada passa pelas estações em que para.',
  'help.guide.transport-on-map.tip.2':
    'Uma reserva confirmada é uma linha cheia, uma pendente é tracejada. O ajuste Rótulos das rotas de reservas escreve o código do aeroporto ou o nome da estação nos marcadores das pontas.',
  'help.guide.transport-on-map.tip.3':
    'Mostrar todas as rotas de reservas é começar do zero, não é uma camada: descarta o que os ícones avulsos tinham definido, então apertar duas vezes deixa você com tudo ligado ou tudo desligado.',
  // import-transport-file
  'help.guide.import-transport-file.title': 'Ler um voo a partir do e-ticket',
  'help.guide.import-transport-file.goal':
    'Deixe o TREK tirar um voo, um trem ou uma balsa do bilhete que a companhia mandou, e confira antes de salvar.',
  'help.guide.import-transport-file.step.1':
    'Clique em Importar de arquivo na barra de ferramentas da aba Transportes, ao lado de Transporte. Importar confirmações de reserva abre, a mesma janela que a aba Reservas tem.',
  'help.guide.import-transport-file.step.2':
    'Solte o bilhete na caixa, ou clique nela e escolha-o: EML, PDF, PKPass, HTML e TXT, até cinco arquivos de 10 MB cada. Os arquivos que você escolheu aparecem pelo nome na caixa.',
  'help.guide.import-transport-file.step.3':
    'Clique em Importar. A janela fecha na hora; a leitura acontece em segundo plano.',
  'help.guide.import-transport-file.step.4':
    'Um cartão no canto inferior direito relata a execução sob o nome do arquivo. Analisando arquivos… vira um tique quando a leitura termina, e o cartão oferece Importar. Clique nele.',
  'help.guide.import-transport-file.step.5':
    'Um voo abre em Adicionar transporte, já preenchido: Tipo de reserva em Voo, a companhia aérea e o número do voo em Título, os dois aeroportos em Rota com Partida e Chegada, seus horários e fusos, Companhia aérea e Nº do voo, o Código da reserva e o bilhete em Arquivos. Confira e clique em Adicionar.',
  'help.guide.import-transport-file.result':
    'O voo é um cartão em Pendente na aba Transportes e uma linha no dia em que parte, com o bilhete em Arquivos, e com os dois aeroportos conhecidos ele desenha a sua curva no mapa.',
  'help.guide.import-transport-file.tip.1':
    'As duas abas compartilham uma só importação: um arquivo que contém um voo e um hotel abre o voo em Adicionar transporte e o hotel em Nova reserva, um após o outro, seja qual for a aba de onde você partiu.',
  'help.guide.import-transport-file.tip.2':
    'Aeroportos são posicionados pelo código. Uma estação ou um porto que a leitura não conseguiu localizar aparece em âmbar no cartão; escolha-o à mão em Rota antes de clicar em Adicionar, ou o transporte não desenha nada no mapa.',
  // airtrail-import
  'help.guide.airtrail-import.title': 'Importar voos do AirTrail',
  'help.guide.airtrail-import.goal':
    'Traga os voos que você já mantém no AirTrail para a viagem de uma vez, e deixe-os seguir o AirTrail daí em diante.',
  'help.guide.airtrail-import.step.1':
    'Com o addon AirTrail ligado e a sua instância conectada em Integrações nas Configurações, a barra de ferramentas da aba Transportes carrega um botão AirTrail ao lado de Transporte. Clique nele.',
  'help.guide.airtrail-import.step.2':
    'Importar do AirTrail lista os voos da sua conta em dois grupos. Durante esta viagem guarda os datados dentro da viagem, já marcados; Outros voos guarda o resto, desmarcados. Um voo que já está na viagem fica acinzentado e marcado como Importado.',
  'help.guide.airtrail-import.step.3':
    'Cada linha é uma caixa de seleção com a companhia aérea e o número do voo, os dois aeroportos e a data. Clique numa linha para incluir o voo ou deixá-lo de fora; os de Outros voos só entram quando você os marca.',
  'help.guide.airtrail-import.step.4':
    'Voos que se conectam, cada um partindo do aeroporto em que o anterior pousou dentro de um dia, são emoldurados juntos. A caixa abaixo, Importar como um único voo com escala naquele aeroporto, já está ligada: deixe-a ligada para uma reserva com escala, ou desligue-a para importar os trechos como voos separados.',
  'help.guide.airtrail-import.step.5':
    'Clique em Importar. O botão conta os voos marcados, e a mensagem depois diz quantos entraram.',
  'help.guide.airtrail-import.step.6':
    'Os voos são cartões em Confirmada, cada um com um selo azul AirTrail ao lado do status, e linhas nos dias em que ocorrem. Uma conexão unida é um cartão só, com a rota passando pela escala.',
  'help.guide.airtrail-import.result':
    'Os voos do AirTrail são cartões na aba Transportes e linhas nos seus dias, cada um com o selo AirTrail que diz de onde veio.',
  'help.guide.airtrail-import.tip.1':
    'Um voo que já está na viagem com o mesmo número e a mesma data é pulado, e uma mensagem diz quantos foram. Desfazer na barra de ferramentas acima dos dias reverte a importação inteira.',
  'help.guide.airtrail-import.tip.2':
    'O AirTrail continua sendo a fonte da verdade. O TREK lê as mudanças dele quando você abre a viagem e a cada poucos minutos em segundo plano; um voo excluído lá mantém o cartão, com o selo mudado para Não sincronizado. Edições feitas no TREK só voltam com Gravar alterações de volta no AirTrail ligado em Integrações.',
  'help.guide.airtrail-import.tip.3':
    'Uma conexão unida não tem um único voo do AirTrail para seguir, então é uma importação única: ela mantém o selo azul, e passar o mouse sobre o selo diz isso. O mesmo acontece com um voo sincronizado ao qual você dá uma escala à mão.',

  // ── Screen: trip-roadtrip ─────────────────────────────────────────────────────────────
  'help.ctx.trip-roadtrip.title': 'Viagem de carro',
  'help.ctx.trip-roadtrip.summary':
    'O plano lido como um único trajeto: os mesmos dias e os mesmos lugares, encadeados em paradas com a direção entre elas, numa lista ao longo da coluna esquerda e no mapa. Ele diz quanto falta e quanto demora, onde o tanque acaba, e o que existe à beira da estrada.',
  'help.ctx.trip-roadtrip.bullet.1':
    'Dias e Viagem de carro no topo da coluna esquerda alternam entre o plano dos dias e o trajeto. Nada é copiado e nada é alterado: Dias devolve o plano exatamente como estava.',
  'help.ctx.trip-roadtrip.bullet.2':
    'A cabeça da lista soma a viagem: Distância, Tempo de direção e Paradas. Abaixo vem um cartão por dia, com os quilômetros do próprio dia, para quantas paradas ele existe, o que ele ultrapassa, e um selo Trilha.',
  'help.ctx.trip-roadtrip.bullet.3':
    'Uma parada numerada é um lugar para o qual o dia existe. Uma parada no caminho, combustível, carregamento, uma área de descanso, usa o ícone do seu tipo em vez de um número e não é contada. Clique num número para mudar o que ele é, e no selo Parada para dizer quanto tempo leva.',
  'help.ctx.trip-roadtrip.bullet.4':
    'Entre duas paradas, uma faixa de condução dá o trecho em distância e tempo. Clique nela para Rotas para este trecho, ou clique na rota desenhada no mapa para dobrar o trecho por um ponto de passagem.',
  'help.ctx.trip-roadtrip.bullet.5':
    'A coluna direita vira Ao longo da rota: escolha um dia, o que procurar e a largura do corredor, e então Buscar. Adicionar põe um resultado no trajeto no ponto em que ele é realmente passado.',
  'help.ctx.trip-roadtrip.bullet.6':
    'As Configurações de direção abaixo guardam os limites, o carro e sua autonomia, os horários diários, o que evitar e como a linha é desenhada. Elas pertencem à viagem, então todo mundo planeja com o mesmo carro.',
  // roadtrip-mode
  'help.guide.roadtrip-mode.title': 'Ler a viagem como um único trajeto',
  'help.guide.roadtrip-mode.goal': 'Passe o plano para o modo viagem de carro e leia o que a lista conta.',
  'help.guide.roadtrip-mode.step.1':
    'Clique em Viagem de carro no seletor Dias e Viagem de carro no topo da coluna esquerda. O plano dos dias é substituído pelo trajeto, e o mapa desenha cada dia com rota calculada.',
  'help.guide.roadtrip-mode.step.2': 'A cabeça da lista soma a viagem inteira: Distância, Tempo de direção e Paradas.',
  'help.guide.roadtrip-mode.step.3':
    'Abaixo vem um cartão por dia. O cabeçalho traz o número e a data do dia, a direção em distância e tempo, e para quantas paradas o dia existe.',
  'help.guide.roadtrip-mode.step.4':
    'Dentro do cartão o dia é uma corrente: uma parada numerada por lugar, uma faixa de condução entre cada par, e o horário de chegada na borda direita.',
  'help.guide.roadtrip-mode.step.5':
    'Clique no cabeçalho de um dia para recolhê-lo. Um dia recolhido também sai do mapa; clique no cabeçalho de novo para trazê-lo de volta.',
  'help.guide.roadtrip-mode.result':
    'A coluna esquerda é o trajeto e o mapa mostra cada dia dele. Dias volta direto ao plano, sem mudanças.',
  'help.guide.roadtrip-mode.tip.1':
    'A escolha é lembrada por viagem enquanto a aba do navegador estiver aberta, então um recarregamento volta ao trajeto.',
  'help.guide.roadtrip-mode.tip.2':
    'O seletor só existe depois que um administrador liga o complemento Viagem de carro, em Complementos na Administração.',
  'help.guide.roadtrip-mode.tip.3':
    'No celular não há seletor: o complemento acrescenta uma aba Viagem de carro própria ao lado de Plano.',
  // roadtrip-stops
  'help.guide.roadtrip-stops.title': 'Paradas no caminho, e quanto tempo você fica',
  'help.guide.roadtrip-stops.goal':
    'Transforme um lugar do trajeto numa parada no caminho, e diga quanto tempo leva cada parada.',
  'help.guide.roadtrip-stops.step.1':
    'Clique no número na frente de uma parada na lista. O rótulo dele é Tornar uma parada no caminho, e ele abre Tipo de parada.',
  'help.guide.roadtrip-stops.step.2':
    'Escolha um tipo: Hospedagem, Combustível, Carregamento, Área de descanso, Camping, Comida ou Pontos turísticos. O número vira o ícone desse tipo e as paradas abaixo são renumeradas.',
  'help.guide.roadtrip-stops.step.3':
    'Uma parada no caminho não é um destino, então o cabeçalho do dia conta uma parada a menos.',
  'help.guide.roadtrip-stops.step.4':
    'Clique no ícone de novo, Alterar o tipo de parada, e escolha Voltar a ser um destino para devolver o número à parada.',
  'help.guide.roadtrip-stops.step.5': 'Cada parada traz um selo Parada. Clique nele para abrir Tempo nesta parada.',
  'help.guide.roadtrip-stops.step.6':
    'Defina a duração com o controle deslizante, com os botões menos e mais ou com um dos valores prontos, veja o que Chegada e Partida fazem, e então clique em Salvar.',
  'help.guide.roadtrip-stops.result':
    'A parada a que você deu tempo traz a hora no selo Parada dela e toda chegada depois dela se moveu junto, e a que você mandou para um tipo e de volta é de novo um destino numerado.',
  'help.guide.roadtrip-stops.tip.1':
    'Uma permanência pertence ao lugar, não a uma visita: um lugar planejado em dois dias tem o mesmo tempo nos dois.',
  'help.guide.roadtrip-stops.tip.2':
    'Paradas no caminho também aparecem em Dias. Desligar Mostrar também em Dias, dentro de Paradas de serviço nas Configurações de direção, as mantém só na Viagem de carro.',
  'help.guide.roadtrip-stops.tip.3': 'Sem permanencia, na mesma janela, tira esse tempo de novo.',
  // roadtrip-corridor
  'help.guide.roadtrip-corridor.title': 'Achar combustível, comida e cama ao longo da rota',
  'help.guide.roadtrip-corridor.goal':
    'Busque na estrada que você realmente dirige, e ponha o que encontrar no trecho certo.',
  'help.guide.roadtrip-corridor.step.1':
    'Escolha o dia no topo de Ao longo da rota. Só os dias com rota calculada são oferecidos.',
  'help.guide.roadtrip-corridor.step.2':
    'Em Procurando por, marque o que você precisa. Combustível, Carregamento, Área de descanso, Camping, Hospedagem, Comida e Pontos turísticos podem ser combinados.',
  'help.guide.roadtrip-corridor.step.3':
    'Em Num raio de, escolha a que distância procurar dos dois lados da estrada, 2 km, 5 km ou 10 km, e então clique em Buscar.',
  'help.guide.roadtrip-corridor.step.4':
    'Os resultados voltam agrupados por tipo, na ordem em que você passa por eles, cada um com o ponto do dia em que fica e a que distância está da rota.',
  'help.guide.roadtrip-corridor.step.5':
    'Adicionar num resultado abre Adicionar como parada. Ali está em que dia e em que posição a parada cai, pede o tipo e o tempo na parada, e Adicionar a põe no trajeto.',
  'help.guide.roadtrip-corridor.result':
    'Os resultados são listados na ordem em que você passa por eles e desenhados no mapa, e o que você adicionou fica no trajeto no ponto em que ele é realmente passado.',
  'help.guide.roadtrip-corridor.tip.1':
    'Nada é buscado até você apertar Buscar: uma execução são muitas requisições a um serviço compartilhado.',
  'help.guide.roadtrip-corridor.tip.2':
    'Filtrar por nome estreita o que voltou sem perguntar de novo, e Limpar resultados esvazia a lista e seus alfinetes. Clique num resultado para trazê-lo à vista no mapa.',
  'help.guide.roadtrip-corridor.tip.3':
    'Um resultado também pode ser arrastado do mapa até a rota desenhada, que é como você mesmo escolhe o trecho onde a mesma estrada é percorrida duas vezes. Adicionar manualmente, ao lado de Buscar, procura em vez disso um lugar pelo nome.',
  // roadtrip-via
  'help.guide.roadtrip-via.title': 'Dobrar um trecho por um ponto de passagem',
  'help.guide.roadtrip-via.goal':
    'Mande um trecho pela estrada que você realmente quer, sem acrescentar uma parada a ele.',
  'help.guide.roadtrip-via.step.1':
    'Traga à vista o trecho que você quer: clique numa parada da lista e feche o cartão que abre sobre o mapa.',
  'help.guide.roadtrip-via.step.2':
    'Clique na rota desenhada. Um ponto de passagem é largado no trecho em que você clicou, e o trecho é recalculado passando por ele.',
  'help.guide.roadtrip-via.step.3':
    'A lista acompanha: o cabeçalho do dia traz a nova distância e o novo tempo de direção, e toda chegada depois do ponto de passagem se move junto.',
  'help.guide.roadtrip-via.step.4':
    'Passe o mouse sobre a alça e ela diz o que sabe fazer: Arraste para remodelar a rota, clique com o botão direito para remover. Arraste-a para outro lugar e o trecho é redesenhado pelo ponto novo.',
  'help.guide.roadtrip-via.step.5':
    'Clique com o botão direito na alça para tirá-la. O trecho volta a seguir o caminho direto.',
  'help.guide.roadtrip-via.result':
    'O trecho segue a estrada que você escolheu, e a distância, o tempo de direção e as chegadas do dia são recalculados para ela.',
  'help.guide.roadtrip-via.tip.1':
    'Um ponto de passagem não é uma parada: não tem número, nem permanência, nem horário de chegada, e não conta entre as paradas do dia.',
  'help.guide.roadtrip-via.tip.2':
    'As alças são desenhadas a partir do nível de zoom 9, então um mapa ajustado à viagem inteira mostra a linha sem elas.',
  'help.guide.roadtrip-via.tip.3':
    'Um clique a mais de dois quilômetros de qualquer trecho desenhado é ignorado, e um clique num voo, num trem ou numa barca também.',
  // roadtrip-alternatives
  'help.guide.roadtrip-alternatives.title': 'Testar outro jeito de dirigir um trecho',
  'help.guide.roadtrip-alternatives.goal': 'Veja o que mais o roteador oferece para um pedaço, e pegue.',
  'help.guide.roadtrip-alternatives.step.1':
    'Clique numa faixa de condução da lista, a linha entre duas paradas que dá o trecho em distância e tempo. O rótulo dela é Outras rotas.',
  'help.guide.roadtrip-alternatives.step.2':
    'Rotas para este trecho abre sobre o mapa, uma entrada por estrada, cada uma desenhada no mapa na sua própria cor.',
  'help.guide.roadtrip-alternatives.step.3':
    'Passe o mouse sobre uma entrada para acender aquela estrada. Atual é a estrada por onde se vai e Mais rápida a mais veloz; as outras dizem quanto são mais lentas, ou que classe de estrada deixam de fora.',
  'help.guide.roadtrip-alternatives.step.4':
    'Clique numa entrada para ir por ali, ou em Fechar para ficar com a estrada em que você está.',
  'help.guide.roadtrip-alternatives.result':
    'O trecho segue a estrada que você escolheu, e a distância na lista e as chegadas seguintes mudam junto.',
  'help.guide.roadtrip-alternatives.tip.1':
    'Escolher outra estrada põe um ponto de passagem no trecho e substitui os que ele já tinha; escolher a estrada do próprio roteador tira todos de novo.',
  'help.guide.roadtrip-alternatives.tip.2':
    'Sem rodovia, Sem pedagio e Sem balsa vêm de um segundo motor com seu próprio modelo de velocidade, então os tempos deles não são comparáveis com os outros.',
  // roadtrip-limits
  'help.guide.roadtrip-limits.title': 'Definir o carro e os limites de direção',
  'help.guide.roadtrip-limits.goal': 'Diga ao TREK o que você dirige e quanto está disposto a dirigir de uma vez.',
  'help.guide.roadtrip-limits.step.1':
    'Configurações de direção fica abaixo da busca na coluna direita. Os selos dizem o que está definido; clique para abrir.',
  'help.guide.roadtrip-limits.step.2':
    'Em Condução, Trecho mais longo seguido e Condução por dia são em minutos. Um campo vazio significa desligado, e nada é sinalizado.',
  'help.guide.roadtrip-limits.step.3':
    'Em Veículo, diga o que você dirige. Combustível só reabastece em paradas de combustível, Elétrico só nas de carregamento, Ambos nas duas.',
  'help.guide.roadtrip-limits.step.4':
    'Digite Autonomia por tanque, ou Autonomia por carga, você mesmo. Calcular pelos dados do carro abaixo pega Tanque e Consumo, ou Bateria e Consumo, e faz a conta.',
  'help.guide.roadtrip-limits.step.5':
    'Evitar quando possível é uma preferência, não uma proibição: um dia sem jeito de desviar usa a estrada mesmo assim, e diz isso no cabeçalho.',
  'help.guide.roadtrip-limits.step.6':
    'Feche a janela. O cartão diz o que está definido, e a lista marca cada trecho e cada dia que passa do limite.',
  'help.guide.roadtrip-limits.result':
    'Os selos do cartão dizem o que está definido, e cada trecho e cada dia acima de um limite traz um selo na lista.',
  'help.guide.roadtrip-limits.tip.1':
    'As configurações pertencem à viagem, então todo mundo nela planeja com o mesmo carro e os mesmos limites.',
  'help.guide.roadtrip-limits.tip.2':
    'Abastecer até diz o quanto uma parada abastece, porque ninguém carrega até 100 % na estrada. Uma parada de combustível ou de carregamento pode sobrescrever isso para si.',
  'help.guide.roadtrip-limits.tip.3':
    'Linha da rota decide como o trajeto é desenhado: Conectar os dias calcula a noite entre dois dias, e Uma cor por dia dá a cada dia a sua.',
  // roadtrip-day-window
  'help.guide.roadtrip-day-window.title': 'Dar um começo e um fim ao dia de direção',
  'help.guide.roadtrip-day-window.goal': 'Pare de dirigir na hora que você escolher, e diga onde o dia deve terminar.',
  'help.guide.roadtrip-day-window.step.1':
    'Abra Configurações de direção na coluna direita e encontre Horários diários.',
  'help.guide.roadtrip-day-window.step.2':
    'Defina um Início do dia. Sozinho ele não faz nada: as duas horas são necessárias, como diz a nota abaixo delas.',
  'help.guide.roadtrip-day-window.step.3':
    'Defina um Fim do dia. O trajeto agora para nessa hora e leva o resto para a manhã seguinte, como uma linha Fim do dia e uma linha Continuar viagem na lista.',
  'help.guide.roadtrip-day-window.step.4':
    'Em Encerrar o dia, escolha No trajeto para pausar na estrada na hora final, ou No último local para parar antes que o próximo trecho passe dela.',
  'help.guide.roadtrip-day-window.step.5':
    'Feche a janela. O cartão Configurações de direção traz os dois horários como selo.',
  'help.guide.roadtrip-day-window.result':
    'O trajeto é cortado em dias de viagem do tamanho que você definiu, e o que não cabe continua em dias calculados depois do último. Seus dias e os lugares deles não são alterados.',
  'help.guide.roadtrip-day-window.tip.1':
    'Limpar qualquer uma das duas horas desliga tudo de novo. Horários que você mesmo fixou numa parada sempre têm prioridade.',
  'help.guide.roadtrip-day-window.tip.2':
    'Com horários diários definidos os dias ficam sempre conectados: o trajeto da última parada de um dia até a primeira do dia seguinte é calculado e contado.',
  'help.guide.roadtrip-day-window.tip.3':
    'Cada fim de dia também é um marcador no mapa, uma lua com o número do dia. Arraste-o pela rota, ou até um lugar, para terminar o dia em outro ponto; clique com o botão direito para devolver o fim automático, e Restaurar fins de dia automáticos nesta janela desfaz tudo.',
  // roadtrip-refuel
  'help.guide.roadtrip-refuel.title': 'Abastecer antes que o tanque acabe',
  'help.guide.roadtrip-refuel.goal':
    'Encontre onde abastecer no trecho que o carro ainda alcança, e ponha isso no trajeto.',
  'help.guide.roadtrip-refuel.step.1':
    'Com uma autonomia definida, a lista desenha uma faixa atravessando o trecho onde ela acaba: Aqui o tanque acaba, e embaixo a que distância dentro do trecho isso cai.',
  'help.guide.roadtrip-refuel.step.2':
    'A lâmpada na faixa é o botão. Buscar combustível olha ao longo da estrada que você já dirigiu, com Procurando ao longo da rota… enquanto faz isso.',
  'help.guide.roadtrip-refuel.step.3':
    'Voltam até três postos, cada um com a que distância está da rota e quanta autonomia deixaria de sobra.',
  'help.guide.roadtrip-refuel.step.4':
    'O mais numa oferta a acrescenta como parada de abastecimento. Adicionar como parada abre com o tipo e o tempo já preenchidos, e Adicionar a põe no trecho no ponto em que ela é realmente passada.',
  'help.guide.roadtrip-refuel.result':
    'A parada fica no trecho certo com o ícone dela, a autonomia conta de novo a partir dela, e a faixa sumiu.',
  'help.guide.roadtrip-refuel.tip.1':
    'A autonomia conta a partir da última parada de combustível ou de carregamento, atravessando dias. O que você dirige decide quais paradas contam: Combustível só combustível, Elétrico só carregamento.',
  'help.guide.roadtrip-refuel.tip.2':
    'A busca olha a estrada antes do ponto seco, guarda uma reserva e conta o desvio duas vezes, então tudo que ela oferece é mesmo alcançável.',
  'help.guide.roadtrip-refuel.tip.3':
    'Uma resposta vazia não é um beco sem saída: a lâmpada vira Tentar de novo, porque a busca de lugares é um serviço compartilhado que às vezes expira.',
  // roadtrip-track
  'help.guide.roadtrip-track.title': 'Fazer um dia seguir uma trilha importada',
  'help.guide.roadtrip-track.goal':
    'Ponha o trajeto de um dia numa estrada bonita que você importou como trilha GPX ou KML.',
  'help.guide.roadtrip-track.step.1': 'Clique no selo Trilha no cabeçalho de um dia. A janela abre nesse dia.',
  'help.guide.roadtrip-track.step.2':
    'Escolha uma trilha. Cada uma diz o comprimento dela e se acompanha este dia ou a que distância fica, a mais próxima primeiro.',
  'help.guide.roadtrip-track.step.3':
    'Clique em Seguir esta trilha. O TREK larga pontos de passagem onde o trajeto mais se afasta da trilha, e recalcula, rodada após rodada.',
  'help.guide.roadtrip-track.step.4':
    'Ele diz quantos pontos de passagem colocou e quão perto o trajeto fica agora. O botão embaixo dele tira esses pontos de passagem de novo e devolve o dia ao roteador; fechar a janela mantém a trilha.',
  'help.guide.roadtrip-track.result':
    'O trajeto do dia segue a trilha em vez da estrada que o roteador escolheu, e o selo Trilha dele está aceso e nomeia essa trilha quando você aponta para ele.',
  'help.guide.roadtrip-track.tip.1':
    'Importe o arquivo em Dias com Importar arquivo, com Rotas ou Trilhas marcados. Enquanto a viagem não tiver nenhuma, nenhum dia traz o selo.',
  'help.guide.roadtrip-track.tip.2':
    'Seguir uma trilha substitui os pontos de passagem que os trechos do dia já tinham, então molde um trecho à mão depois da trilha, não antes.',
};

export default help;
