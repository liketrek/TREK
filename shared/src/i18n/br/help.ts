import type { TranslationStrings } from '../types';

// English fallback until 'br' is translated.
const help: TranslationStrings = {
  'help.title': 'Ajuda e documentação',
  'help.search': 'Pesquisar na documentação…',
  'help.contents': 'Conteúdo',
  'help.noResults': 'Nenhuma página encontrada.',
  'help.errorTitle': 'Não foi possível carregar esta página',
  'help.errorBody': 'O conteúdo da ajuda é carregado da wiki do TREK. Verifique sua conexão e tente de novo.',

  // center
  'help.center.button': 'Ajuda para esta tela',
  'help.center.title': 'Ajuda',
  'help.center.onThisScreen': 'Nesta tela',
  'help.center.screens': 'Telas',
  'help.center.thisScreen': 'Atual',
  'help.center.subScreens': '{count} subtelas',
  'help.center.subScreens.one': '{count} subtela',
  'help.center.subScreensLabel': 'Subtelas',
  'help.center.guidesCount': '{count} guias',
  'help.center.guidesCount.one': '{count} guia',
  'help.center.goToScreen': 'Ir para {screen}',
  'help.center.overview': 'Visão geral',
  'help.center.howTo': 'Como faço para…',
  'help.center.searchPlaceholder': 'Buscar em guias e documentação…',
  'help.center.searchEmpty': 'Nenhum resultado para “{query}”.',
  'help.center.searchGuides': 'Guias',
  'help.center.searchDocs': 'Documentação',
  'help.center.searchError': 'A busca não está disponível no momento.',
  'help.center.back': 'Voltar',
  'help.center.close': 'Fechar a ajuda',
  'help.center.steps': '{count} passos',
  'help.center.steps.one': '{count} passo',
  'help.center.step': 'Passo {n}',
  'help.center.stepsLabel': 'Passos',
  'help.center.stepOf': 'Passo {n} de {total}',
  'help.center.screenshot': 'Captura de tela',
  'help.center.result': 'O que você consegue',
  'help.center.tips': 'Bom saber',
  'help.center.related': 'Relacionados',
  'help.center.openDocs': 'Abrir em Ajuda e documentação',
  'help.center.docsSection': 'Na documentação',
  'help.center.noContext': 'Ainda não há guia para esta tela.',
  'help.center.noContextHint': 'Pesquise na documentação ou conte para a gente o que você estava procurando.',
  'help.center.feedback': 'Sentiu falta de algo?',
  'help.center.feedbackLink': 'Conte para a gente no GitHub',
  'help.center.discord': 'Pergunte no Discord',
  'help.center.quick': 'Rápido',
  'help.center.guide': 'Guia',
  'help.center.tour': 'Tour guiado',
  'help.center.imageAlt': 'Passo {n} de “{title}”',

  // ctx
  'help.ctx.dashboard.title': 'Painel',
  'help.ctx.dashboard.summary':
    'O painel mostra todas as suas viagens. O cartão no topo, com cara de cartão de embarque, mostra a viagem em andamento ou a próxima. A linha abaixo dele soma o quanto você já viajou, e os cartões listam todas as viagens que você está planejando, arquivou ou já concluiu.',
  'help.ctx.dashboard.bullet.1':
    'Cartão de embarque: a viagem em andamento ou a próxima, com datas, viajantes, lugares e contagem regressiva. Clique nele para abrir a viagem. Os quatro botões no canto superior direito servem para editar, duplicar, arquivar ou excluir a viagem.',
  'help.ctx.dashboard.bullet.2':
    'Estatísticas de viagem: países visitados, viagens, dias na estrada e distância voada, somando todas as suas viagens.',
  'help.ctx.dashboard.bullet.3':
    'Cartões de viagem, filtrados por Planejado, Arquivada e Concluído, em grade ou em lista. A caixa de busca acima deles pesquisa todas as suas viagens de uma vez, por título, data ou um lugar da viagem. Os botões para editar, duplicar, arquivar e excluir uma viagem ficam no canto superior direito da foto de cada cartão.',
  'help.ctx.dashboard.bullet.4':
    'Widgets à direita: conversor de moedas, Coleções (quando o complemento Coleções está ativado), relógios mundiais, próximas reservas e widgets de plugins. Os widgets nativos podem ser desativados em Configurações, Aparência.',
  'help.ctx.dashboard.bullet.5':
    'Tanto o cartão “Nova viagem” quanto o botão no canto inferior direito criam uma nova viagem.',

  // create-trip
  'help.guide.create-trip.title': 'Criar uma viagem',
  'help.guide.create-trip.goal': 'Crie uma nova viagem com nome, datas e foto de capa.',
  'help.guide.create-trip.step.1':
    'Clique em “Nova viagem”. O cartão no fim das suas viagens e o botão no canto inferior direito fazem a mesma coisa.',
  'help.guide.create-trip.step.2':
    'Dê um nome à viagem. É o único campo obrigatório; todo o resto pode ser adicionado depois.',
  'help.guide.create-trip.step.3':
    'Escolha uma data de início e uma de término. O TREK cria um dia para cada data, e você já pode começar a planejar o roteiro. Ainda não tem datas? Deixe as duas em branco e informe o “Número de dias”.',
  'help.guide.create-trip.step.4':
    'Opcional: adicione uma foto de capa. Envie a sua, arraste ou cole uma imagem, ou pesquise o destino no Unsplash.',
  'help.guide.create-trip.step.5': 'Clique em “Criar nova viagem”.',
  'help.guide.create-trip.result':
    'A viagem aparece no seu painel. Se for a sua próxima viagem, ela aparece no cartão de embarque no topo.',
  'help.guide.create-trip.tip.1':
    'Dá para mudar as datas depois. Se já houver reservas, o TREK pergunta se elas devem acompanhar os dias.',
  'help.guide.create-trip.tip.2':
    'Todos os custos são convertidos para a moeda da viagem que você escolher aqui. Escolha a moeda do destino.',

  // edit-trip
  'help.guide.edit-trip.title': 'Editar uma viagem',
  'help.guide.edit-trip.goal': 'Renomeie uma viagem, mude as datas ou ajuste as configurações dela.',
  'help.guide.edit-trip.step.1':
    'Clique no lápis no canto superior direito do cartão da viagem (ou do cartão de embarque).',
  'help.guide.edit-trip.step.2':
    'Altere o que precisar: nome, descrição, datas, capa, moeda, lembrete ou companheiros de viagem.',
  'help.guide.edit-trip.step.3': 'Clique em Atualizar.',
  'help.guide.edit-trip.result': 'O cartão é atualizado na hora, para todos os membros da viagem.',
  'help.guide.edit-trip.tip.1':
    'Se você mudar o início de uma viagem que tem reservas, o TREK pergunta se as reservas também devem mudar. Ao encurtar uma viagem, ele lista os dias que seriam removidos e o que está planejado neles. A alteração só é salva depois que você clica em “Remover dias e salvar”.',

  // cover-image
  'help.guide.cover-image.title': 'Definir uma foto de capa',
  'help.guide.cover-image.goal': 'Dê à viagem uma imagem que aparece no cartão dela e no cartão de embarque.',
  'help.guide.cover-image.step.1': 'Abra o formulário de edição da viagem pelo lápis no cartão dela.',
  'help.guide.cover-image.step.2':
    'Em “Imagem de capa”, solte ou cole uma foto, clique para enviar uma, ou digite um destino e clique em “Buscar no Unsplash”.',
  'help.guide.cover-image.step.3': 'Escolha uma foto e clique em “Atualizar”.',
  'help.guide.cover-image.result': 'A foto fica salva na viagem e aparece em todos os lugares onde a viagem é listada.',
  'help.guide.cover-image.tip.1':
    'As fotos da busca do Unsplash recebem o crédito automaticamente; as imagens que você envia ficam no seu servidor.',

  // duplicate-trip
  'help.guide.duplicate-trip.title': 'Duplicar uma viagem',
  'help.guide.duplicate-trip.goal': 'Reaproveite uma viagem como modelo para uma nova.',
  'help.guide.duplicate-trip.step.1': 'Clique no ícone de duplicar no canto superior direito do cartão.',
  'help.guide.duplicate-trip.step.2': 'Leia o que será copiado e o que não será, e clique em “Copiar viagem”.',
  'help.guide.duplicate-trip.result':
    'Uma cópia aparece no seu painel, com o nome da original seguido de (cópia). Você pode renomeá-la e mudar as datas.',
  'help.guide.duplicate-trip.tip.1':
    'São copiados dias, lugares, passeios e rotas de viagem de carro, reservas, itens de orçamento, listas de mala, tarefas e notas dos dias; listas de mala e tarefas vêm desmarcadas. Membros, chat, enquetes, arquivos e links de compartilhamento não são copiados.',

  // archive-trip
  'help.guide.archive-trip.title': 'Arquivar e restaurar uma viagem',
  'help.guide.archive-trip.goal': 'Tire uma viagem da sua lista sem excluí-la e restaure-a depois.',
  'help.guide.archive-trip.step.1': 'Clique no ícone de arquivar no canto superior direito do cartão.',
  'help.guide.archive-trip.step.2': 'Para vê-la de novo, mude o filtro acima dos cartões para “Arquivada”.',
  'help.guide.archive-trip.step.3':
    'Clique em Restaurar no cartão para devolvê-la a Planejado, ou a Concluído se as datas já passaram.',
  'help.guide.archive-trip.result':
    'Viagens arquivadas mantêm todos os dados. Elas só deixam de aparecer no painel e no feed de calendário com todas as viagens.',

  // delete-trip
  'help.guide.delete-trip.title': 'Excluir uma viagem',
  'help.guide.delete-trip.goal': 'Remova uma viagem de vez.',
  'help.guide.delete-trip.step.1': 'Clique no ícone de lixeira no canto superior direito do cartão.',
  'help.guide.delete-trip.step.2':
    'Confirme com Excluir. A janela mostra o nome da viagem, para você ter certeza de que é a certa.',
  'help.guide.delete-trip.result':
    'A viagem e os dias, lugares, reservas e arquivos dela são excluídos. Não dá para desfazer, então, na dúvida, arquive a viagem.',

  // filter-and-view
  'help.guide.filter-and-view.title': 'Encontrar viagens concluídas e alternar entre grade e lista',
  'help.guide.filter-and-view.goal': 'Veja viagens concluídas ou arquivadas e escolha o layout que preferir.',
  'help.guide.filter-and-view.step.1':
    'Use “Planejado”, “Arquivada” e “Concluído” acima dos cartões. Em “Concluído” ficam todas as viagens cuja data final já passou.',
  'help.guide.filter-and-view.step.2':
    'Clique no ícone de lista para ver uma lista compacta; clique de novo para voltar à grade.',
  'help.guide.filter-and-view.result': 'O painel lembra o seu layout neste dispositivo.',

  // calendar-feed
  'help.guide.calendar-feed.title': 'Assinar todas as viagens no seu calendário',
  'help.guide.calendar-feed.goal':
    'Veja os dias e as reservas de todas as viagens ativas no seu app de calendário, sempre sincronizados.',
  'help.guide.calendar-feed.step.1': 'Clique no ícone de calendário ao lado do seletor de visualização.',
  'help.guide.calendar-feed.step.2':
    'Clique em “Ativar assinatura do calendário”. O TREK cria um link de feed privado.',
  'help.guide.calendar-feed.step.3':
    'Clique em “Adicionar ao Google Agenda” ou “Adicionar ao Calendário da Apple / Outlook”. Para qualquer outro app de calendário, abra “Ou copie um link manualmente” e copie o link dali.',
  'help.guide.calendar-feed.result':
    'Toda viagem ativa aparece no seu calendário e é atualizada automaticamente. Viagens arquivadas e viagens que terminaram há mais de 90 dias ficam de fora.',
  'help.guide.calendar-feed.tip.1':
    'Mantenha o link em segredo: quem tiver o link consegue ler o feed. Se outras pessoas tiverem acesso a ele, “Gerar novamente” cria um link novo, e o antigo para de funcionar. Desativar remove o link de vez.',

  // widgets
  'help.guide.widgets.title': 'Escolher os widgets do painel',
  'help.guide.widgets.goal': 'Mostre ou oculte a linha de estatísticas e os widgets à direita.',
  'help.guide.widgets.step.1': 'Abra o menu do seu avatar no canto superior direito e escolha Configurações.',
  'help.guide.widgets.step.2': 'Vá para a aba Aparência.',
  'help.guide.widgets.step.3':
    'Em “Widgets do painel”, ative ou desative cada widget, separadamente para computador e celular. “Barra lateral direita” desativa a coluna da direita inteira de uma vez.',
  'help.guide.widgets.step.4': 'Volte ao painel. A mudança vale na hora.',
  'help.guide.widgets.result':
    'Ao ocultar widgets, suas viagens ganham mais espaço. Desative a barra lateral direita inteira para centralizar o layout.',
  'help.guide.widgets.link': 'Abrir as configurações de Aparência',

  // currency-widget
  'help.guide.currency-widget.title': 'Converter moedas',
  'help.guide.currency-widget.goal': 'Converta um valor entre duas moedas com as cotações atuais.',
  'help.guide.currency-widget.step.1': 'Digite o valor e escolha as duas moedas.',
  'help.guide.currency-widget.step.2': 'A seta entre elas inverte o par; a seta circular atualiza a cotação.',
  'help.guide.currency-widget.result':
    'Seu par de moedas fica salvo na sua conta, então é o mesmo em todos os dispositivos.',
  'help.guide.currency-widget.tip.1':
    'As cotações vêm do serviço gratuito Frankfurter. A seta circular no canto do widget busca as mais recentes.',

  // timezones-widget
  'help.guide.timezones-widget.title': 'Adicionar relógios mundiais',
  'help.guide.timezones-widget.goal': 'Veja a hora local nos seus destinos.',
  'help.guide.timezones-widget.step.1':
    'Clique em + no widget “Fusos horários”, pesquise uma cidade, Lisboa, por exemplo, e escolha-a na lista.',
  'help.guide.timezones-widget.step.2':
    'Para remover um relógio, passe o mouse sobre ele e clique no × que aparece à direita.',
  'help.guide.timezones-widget.result': 'Seus relógios ficam salvos na sua conta.',
  'help.guide.search-trips.title': 'Buscar nas suas viagens',
  'help.guide.search-trips.goal':
    'Encontre uma viagem pelo nome, por uma data ou por um lugar planejado nela, inclusive viagens arquivadas.',
  'help.guide.search-trips.step.1':
    'Digite em “Buscar viagens ou lugares”, acima dos cartões. A lista é filtrada enquanto você digita, entre viagens planejadas, arquivadas e concluídas ao mesmo tempo.',
  'help.guide.search-trips.step.2':
    'Se uma viagem aparecer por causa de um dos lugares dela, esse lugar é mostrado abaixo do título. Clique no x da caixa, ou pressione Esc, para ver todas as viagens de novo.',
  'help.guide.search-trips.result':
    'O painel mostra só as viagens que correspondem à busca. Limpe a caixa de busca para ver todas de novo.',
  'help.guide.search-trips.tip.1':
    'Você também pode buscar por data: digite um mês e um ano, por exemplo maio 2027, ou 2027-05, para encontrar as viagens daquele mês.',
  'help.guide.search-trips.tip.2':
    'Enquanto uma busca está ativa, o seletor “Planejado”, “Arquivada” e “Concluído” não é aplicado, então nenhuma viagem fica escondida por causa do filtro errado.',

  // ── Screen: vacay ──────────────────────────────────────────────────────────
  'help.ctx.vacay.title': 'Férias',
  'help.ctx.vacay.summary':
    'O Férias é o seu planejador pessoal de folgas: quantos dias de férias você tem no ano, quais já registrou e quantos restam. A grade mostra o ano inteiro. A barra lateral traz o seletor de ano, as pessoas com quem você planeja, os calendários compartilhados com você, a legenda e o seu direito.',
  'help.ctx.vacay.bullet.1':
    'Grade do ano: doze cartões de mês, com uma célula por dia. Clique em um dia para registrá-lo ou desmarcá-lo. Um pontinho azul marca os dias que uma viagem já cobre.',
  'help.ctx.vacay.bullet.2':
    'Barra de ferramentas na parte de baixo: o primeiro botão, com seu nome e sua cor, registra férias; “Feriado da empresa” marca os dias de folga da empresa inteira. “Meio dia” e “Banco de horas” mudam o que um clique registra, e “Meio dia” também funciona para feriados da empresa.',
  'help.ctx.vacay.bullet.3':
    'Direito: Dias, Usados e Restantes do ano selecionado, com o saldo transferido e os dias de banco de horas ao lado. Clique no título do cartão para recolhê-lo.',
  'help.ctx.vacay.bullet.4':
    'Pessoas são quem compartilha o seu plano, cada uma com a própria cor. “Calendários compartilhados” mostram as folgas de outras pessoas como anéis coloridos. Você não pode editá-los.',
  'help.ctx.vacay.bullet.5':
    'As configurações reúnem fins de semana, início da semana, saldo transferido, seu ano de férias, feriados da empresa, calendários de feriados e de férias escolares e, enquanto você planeja junto com alguém, “Encerrar fusão”.',
  // log-day
  'help.guide.log-day.title': 'Registrar um dia de férias',
  'help.guide.log-day.goal': 'Marque uma folga na grade do ano e veja seu saldo ser atualizado.',
  'help.guide.log-day.step.1':
    'Confira o primeiro botão da barra de ferramentas, na parte de baixo. Quando ele mostra o seu nome e a sua cor, um clique em um dia registra um dia de férias para você.',
  'help.guide.log-day.step.2':
    'Clique em um dia em qualquer cartão de mês. O dia fica pintado com a sua cor, e “Usados” aumenta um dia.',
  'help.guide.log-day.step.3': 'Clique de novo no mesmo dia para desmarcá-lo.',
  'help.guide.log-day.result':
    'O dia fica registrado. Dias, Usados e Restantes são atualizados na hora, e todos que estão fundidos ao seu plano veem a mudança imediatamente.',
  'help.guide.log-day.tip.1':
    'Fins de semana não podem ser registrados enquanto “Bloquear fins de semana” estiver ativado nas Configurações. Um dia de fim de semana registrado antes ainda pode ser desmarcado.',
  'help.guide.log-day.tip.2':
    'Um ponto azul em uma célula indica que uma das suas viagens cobre esse dia, para você ver onde férias e viagens coincidem.',
  // half-day
  'help.guide.half-day.title': 'Registrar meio dia',
  'help.guide.half-day.goal': 'Tire uma tarde de folga e use só meio dia do seu saldo.',
  'help.guide.half-day.step.1': 'Ative “Meio dia” na barra de ferramentas. O ponto laranja marca um meio dia na grade.',
  'help.guide.half-day.step.2': 'Clique em um dia. Ele é registrado como 0,5 e ganha um ponto laranja no canto.',
  'help.guide.half-day.step.3':
    'Desligue “Meio dia” quando terminar. Se você clicar em um meio dia com outras configurações, ele passa a usar as configurações atuais.',
  'help.guide.half-day.result':
    'Usados aumenta 0,5. “Meio dia” e “Banco de horas” são independentes, então você também pode registrar meio dia de banco de horas.',
  'help.guide.half-day.tip.1':
    'A barra de ferramentas sempre mostra a marcação que o próximo clique vai aplicar, para você conferir antes de registrar.',
  // comp-day
  'help.guide.comp-day.title': 'Registrar banco de horas ou folga compensatória',
  'help.guide.comp-day.goal': 'Tire uma folga compensatória sem gastar dias de férias.',
  'help.guide.comp-day.step.1':
    'Ative “Banco de horas” na barra de ferramentas. O disco hachurado marca um dia de compensação na grade.',
  'help.guide.comp-day.step.2':
    'Clique em um dia. Ele fica preenchido com listras diagonais na sua cor, em vez de uma cor sólida.',
  'help.guide.comp-day.result':
    'Os dias de folga compensatória são contados ao lado dos cartões de saldo e nunca reduzem “Restantes”.',
  'help.guide.comp-day.tip.1':
    'Use isto para horas extras tiradas como folga, banco de horas ou folga compensatória: qualquer folga que não seja férias.',
  // entitlement
  'help.guide.entitlement.title': 'Definir o seu direito',
  'help.guide.entitlement.goal': 'Informe ao Férias quantos dias de férias você tem no ano.',
  'help.guide.entitlement.step.1':
    'No cartão Direito da barra lateral, clique no bloco Dias da sua linha. Se o cartão estiver recolhido, clique no título para abri-lo.',
  'help.guide.entitlement.step.2':
    'Digite o seu número de dias e pressione Enter. Pressione Esc para manter o valor anterior.',
  'help.guide.entitlement.result':
    '“Restantes” é recalculado com base no seu saldo, nos dias transferidos e nos dias que você já usou.',
  'help.guide.entitlement.tip.1':
    'Cada ano tem sua própria cota de dias, então uma alteração aqui vale só para o ano selecionado.',
  // years
  'help.guide.years.title': 'Adicionar e trocar de ano',
  'help.guide.years.goal': 'Planeje já o ano que vem ou consulte o ano passado.',
  'help.guide.years.step.1':
    'Clique no + à direita do ano para adicionar o ano seguinte, ou no + à esquerda para o anterior.',
  'help.guide.years.step.2': 'Troque de ano com as setas ou com os chips de ano logo abaixo.',
  'help.guide.years.step.3':
    'Para remover um ano, passe o mouse sobre o chip dele e clique no pequeno menos. Isso também exclui todos os lançamentos do ano, então confirme com cuidado.',
  'help.guide.years.result':
    'Cada ano tem seu próprio saldo e seus próprios registros. A transferência de saldo liga um ano ao seguinte.',
  // company-holidays
  'help.guide.company-holidays.title': 'Marcar os feriados da empresa',
  'help.guide.company-holidays.goal':
    'Bloqueie os dias em que a empresa toda folga, sem descontar do saldo de ninguém.',
  'help.guide.company-holidays.step.1':
    'Abra as Configurações e confira se “Feriados da empresa” está ligado. Ele vem ligado por padrão. A barra de ferramentas só mostra o modo enquanto ele estiver ligado.',
  'help.guide.company-holidays.step.2': 'De volta à grade, mude a barra de ferramentas para “Feriado da empresa”.',
  'help.guide.company-holidays.step.3':
    'Clique nos dias. Eles ficam âmbar e aparecem na legenda. Clique de novo em um dia para desmarcá-lo.',
  'help.guide.company-holidays.result':
    'Todos que estão fundidos ao plano veem os feriados da empresa, e eles nunca reduzem Restantes.',
  'help.guide.company-holidays.tip.1':
    'Qualquer pessoa fundida ao plano pode editar os feriados da empresa, então combinem quem vai cuidar deles.',
  // public-holidays
  'help.guide.public-holidays.title': 'Mostrar os feriados',
  'help.guide.public-holidays.goal': 'Coloque na grade os feriados do seu país ou da sua região.',
  'help.guide.public-holidays.step.1': 'Abra as Configurações e ative “Feriados nacionais”.',
  'help.guide.public-holidays.step.2':
    'Clique em “Adicionar calendário” e escolha o país e, se necessário, a região. Você também pode definir uma cor e um rótulo. Depois, clique em Adicionar.',
  'help.guide.public-holidays.step.3': 'Feche as Configurações. Os feriados aparecem na grade e na legenda.',
  'help.guide.public-holidays.result':
    'Os feriados aparecem marcados na cor do calendário e nunca descontam do seu saldo de férias.',
  'help.guide.public-holidays.tip.1':
    'Você pode adicionar vários calendários, por exemplo o da sua região e o de um colega fundido ao plano.',
  // school-holidays
  'help.guide.school-holidays.title': 'Mostrar as férias escolares',
  'help.guide.school-holidays.goal': 'Veja as férias escolares da sua região ao lado das suas folgas.',
  'help.guide.school-holidays.step.1': 'Abra as Configurações e ative “School Holidays”.',
  'help.guide.school-holidays.step.2':
    'Clique em “Adicionar calendário” e escolha o país. Se o país tiver calendários separados, escolha também a região ou o grupo e clique em Adicionar.',
  'help.guide.school-holidays.step.3':
    'Feche as Configurações. As férias escolares aparecem sombreadas na cor do calendário, com uma barra colorida na parte de baixo dos dias.',
  'help.guide.school-holidays.result':
    'As férias escolares só aparecem no calendário: nunca reduzem a cota de ninguém.',
  'help.guide.school-holidays.tip.1':
    'Sua região não aparece? O administrador pode cadastrar as férias escolares manualmente em Administrador, Personalização, “Férias escolares”.',
  // weekends
  'help.guide.weekends.title': 'Bloquear fins de semana e definir o início da semana',
  'help.guide.weekends.goal': 'Deixe os fins de semana fora da contagem e comece a semana no dia que preferir.',
  'help.guide.weekends.step.1': 'Abra as Configurações.',
  'help.guide.weekends.step.2':
    'Ative “Bloquear fins de semana” e, em “Dias de fim de semana”, escolha os dias que contam como seu fim de semana.',
  'help.guide.weekends.step.3': 'Em “Semana começa em”, escolha Seg ou Dom.',
  'help.guide.weekends.result': 'Os dias bloqueados ficam cinza na grade e não podem ser registrados por engano.',
  // leave-year
  'help.guide.leave-year.title': 'Definir o seu ano de férias',
  'help.guide.leave-year.goal':
    'Conte sua cota por ano fiscal ou a partir da data de contratação, em vez de janeiro a dezembro.',
  'help.guide.leave-year.step.1': 'Abra as Configurações e procure “Ano de férias”.',
  'help.guide.leave-year.step.2':
    'Escolha “Calendário”, “Fiscal” (com o mês e o dia em que ele começa) ou “Admissão” (com a data em que você foi contratado).',
  'help.guide.leave-year.result':
    'O direito, os dias usados e o saldo transferido passam a ser contados nesse período, e a grade começa pelo primeiro mês dele.',
  'help.guide.leave-year.tip.1':
    'Esta configuração é pessoal: em um plano fundido, cada um mantém o próprio ano de férias e os próprios números.',
  // carry-over
  'help.guide.carry-over.title': 'Transferir dias não usados',
  'help.guide.carry-over.goal': 'Some o que sobrou no fim de um período ao período seguinte.',
  'help.guide.carry-over.step.1': 'Abra as Configurações.',
  'help.guide.carry-over.step.2': 'Ative “Acúmulo”.',
  'help.guide.carry-over.result':
    'O saldo transferido é recalculado em todos os seus anos e aparece abaixo do saldo de férias.',
  'help.guide.carry-over.tip.1': 'Desativar zera todos os saldos transferidos.',
  // invite
  'help.guide.invite.title': 'Planejar junto com alguém',
  'help.guide.invite.goal':
    'Una o seu plano ao de outro usuário do TREK, para que vocês dois vejam as folgas em uma só grade.',
  'help.guide.invite.step.1': 'Clique no ícone de pessoa no cartão Pessoas.',
  'help.guide.invite.step.2': 'Escolha o usuário e clique em “Enviar convite”.',
  'help.guide.invite.step.3':
    'A pessoa recebe uma notificação e um “Pedido de fusão” na próxima vez que abrir o Férias. Até lá, o convite aparece como pendente; passe o mouse sobre ele para cancelar.',
  'help.guide.invite.result':
    'Os dois planos se juntam: cada pessoa tem uma cor, vocês podem registrar dias um para o outro e tudo é sincronizado em tempo real.',
  'help.guide.invite.tip.1':
    'Para desfazer uma fusão, clique em Encerrar nas Configurações. Os lançamentos de cada um voltam para o próprio plano.',
  'help.guide.invite.tip.2':
    'Se a outra pessoa só deve ver seus dias, compartilhe seu calendário em vez de fundir os calendários.',
  // share-calendar
  'help.guide.share-calendar.title': 'Compartilhar seu calendário só para leitura',
  'help.guide.share-calendar.goal': 'Deixe alguém ver quando você está de folga, sem poder mudar o seu plano.',
  'help.guide.share-calendar.step.1': 'Clique no ícone de compartilhar no cartão “Calendários compartilhados”.',
  'help.guide.share-calendar.step.2': 'Escolha o usuário e clique em Compartilhar. Não é preciso aceitar.',
  'help.guide.share-calendar.step.3':
    'Os calendários compartilhados com você aparecem no topo do cartão: clique em um para ocultá-lo ou mostrá-lo, ou passe o mouse sobre ele e clique no x para removê-lo. Em “Você compartilha com”, passe o mouse sobre um nome e clique em “Parar de compartilhar”.',
  'help.guide.share-calendar.result':
    'Suas folgas aparecem como um anel colorido na grade da outra pessoa. Ela não pode editar nada do que você compartilha.',
  'help.guide.share-calendar.tip.1':
    'Compartilhar e unir são coisas independentes: você pode estar unido a uma pessoa e compartilhar com outras.',
  'help.guide.share-calendar.tip.2':
    'Passe o mouse sobre um dia com um anel para ver quem está de folga e por quanto tempo.',

  // ── Screen: atlas ─────────────────────────────────────────────────────────────────────
  'help.ctx.atlas.title': 'Atlas', // same-as-en
  'help.ctx.atlas.summary':
    'O Atlas mostra num mapa-múndi por onde você já viajou: todo país para onde uma viagem te levou fica colorido, e você pode adicionar manualmente os países que visitou antes de usar o TREK. Aproxime o mapa para ver as regiões, mantenha uma lista de desejos com os lugares que ainda quer conhecer e confira seus números no painel de vidro na parte de baixo.',
  'help.ctx.atlas.bullet.1':
    'O mapa: cada país visitado tem uma cor fixa própria, os países planejados têm contorno tracejado, os da lista de desejos têm linhas diagonais, e todos os outros ficam cinza. Passe o mouse sobre um país para ver as viagens, os lugares e a primeira e a última visita.',
  'help.ctx.atlas.bullet.2':
    'Busca no topo: digite um país ou um lugar. Um país que você não visitou abre o pop-up dele. Para um país que você já visitou, o cartão dele aparece no painel. Se você escolher um lugar, o mapa abre a região dele para você marcá-la.',
  'help.ctx.atlas.bullet.3':
    '“Mostrar países planejados”, no canto superior direito: exibe os países das suas próximas viagens. O interruptor só aparece se você tiver alguma.',
  'help.ctx.atlas.bullet.4':
    'Painel inferior: a aba Estatísticas, com países (e os planejados ao lado), regiões, viagens, lugares, cidades, dias, continentes, sua sequência e as viagens deste ano; a aba “Lista de desejos”, com os lugares que você ainda quer visitar; e, com o complemento Passeios, uma aba Passeios com a distância e a subida dos passeios que você já fez.',
  'help.ctx.atlas.bullet.5':
    'Regiões: com bastante zoom, o mapa mostra estados e províncias. Clique em um para marcá-lo, desmarcá-lo ou adicioná-lo à lista de desejos.',
  'help.ctx.atlas.bullet.6':
    'Dawarich: com o complemento conectado, um painel à esquerda das estatísticas marca desejos como realizados e adiciona países a partir das suas gravações. Ele só faz isso depois que você confirma.',
  // mark-country
  'help.guide.mark-country.title': 'Marcar um país como visitado',
  'help.guide.mark-country.goal':
    'Adicione um país que você visitou antes de usar o TREK, para que ele entre no mapa e na sua contagem.',
  'help.guide.mark-country.step.1': 'Digite o país na caixa de busca no topo do mapa.',
  'help.guide.mark-country.step.2':
    'Escolha o país na lista. O mapa vai até ele e abre uma janela com os dados do país.',
  'help.guide.mark-country.step.3': 'Escolha “Marcar como visitado”.',
  'help.guide.mark-country.result':
    'O país ganha uma cor no mapa, e a contagem de Países aumenta em um. Essa cor é fixa: quando você marca mais países, as cores dos outros não mudam.',
  'help.guide.mark-country.tip.1':
    'Clicar em um país cinza no mapa abre o mesmo pop-up. Para países pequenos, a busca é mais confiável.',
  'help.guide.mark-country.tip.2':
    'Um país que você marca manualmente sempre conta como visitado, independentemente das datas das viagens para lá.',
  // unmark-country
  'help.guide.unmark-country.title': 'Remover um país que você marcou',
  'help.guide.unmark-country.goal': 'Tire do mapa um país que você marcou manualmente.',
  'help.guide.unmark-country.step.1':
    'Busque o país e selecione, ou clique nele no mapa. Se foi você que marcou o país, a janela pergunta se quer removê-lo.',
  'help.guide.unmark-country.step.2': 'Confirme com Remover.',
  'help.guide.unmark-country.result': 'O país volta a ficar cinza e deixa de ser contado.',
  'help.guide.unmark-country.tip.1':
    'Só países marcados manualmente podem ser removidos assim. Um país com viagens ou lugares continua marcado até essas viagens ou lugares serem removidos. Para um país marcado manualmente, Remover também fica no cartão de detalhes dele, no painel.',
  // country-details
  'help.guide.country-details.title': 'Ver o que você fez em um país',
  'help.guide.country-details.goal': 'Abra um país visitado e vá para as viagens que levaram você até lá.',
  'help.guide.country-details.step.1': 'Digite um país que você visitou na caixa de busca no topo do mapa.',
  'help.guide.country-details.step.2':
    'Selecione-o. O mapa vai até lá, e um cartão aparece no painel inferior. O cartão mostra a bandeira do país, selos com os lugares, as viagens e as regiões visitadas, e um chip para cada uma das três primeiras viagens.',
  'help.guide.country-details.result': 'Clique no chip de uma viagem para abri-la no planejador.',
  'help.guide.country-details.tip.1':
    'Ao passar o mouse sobre o país no mapa, você vê os mesmos números e também a primeira e a última visita.',
  // planned-countries
  'help.guide.planned-countries.title': 'Mostrar os países para onde você vai',
  'help.guide.planned-countries.goal':
    'Mostre no mapa os países das suas próximas viagens sem contá-los como visitados.',
  'help.guide.planned-countries.step.1':
    'Ative “Mostrar países planejados”, no canto superior direito. O número ao lado mostra quantos países planejados existem.',
  'help.guide.planned-countries.step.2':
    'Busque um país planejado e selecione: o painel mostra “Planejado” e a dica do mapa mostra quando você vai.',
  'help.guide.planned-countries.result':
    'Os países planejados aparecem com contorno tracejado, para nunca se confundirem com países que você já visitou. A chave guarda a sua escolha.',
  'help.guide.planned-countries.tip.1':
    'Um país conta como visitado assim que a viagem até lá começa. Viagens em andamento também contam. Viagens sem datas ficam totalmente fora das estatísticas.',
  'help.guide.planned-countries.tip.2': 'A chave só aparece enquanto você tiver viagens futuras.',
  // regions
  'help.guide.regions.title': 'Marcar uma região',
  'help.guide.regions.goal': 'Marque os estados, províncias ou prefeituras em que você esteve, não só os países.',
  'help.guide.regions.step.1':
    'Aproxime o zoom em um país até aparecerem as fronteiras dos estados e províncias. Se você pesquisar o país e selecioná-lo, o mapa já chega perto o bastante.',
  'help.guide.regions.step.2':
    'Clique em uma região. Ao passar o mouse sobre uma região, o nome dela aparece. O pop-up mostra a região e o país.',
  'help.guide.regions.step.3': 'Escolha “Marcar como visitado”.',
  'help.guide.regions.result':
    'A região é preenchida com a cor do país. Marcar uma região também conta o país como visitado, se ele ainda não estava.',
  'help.guide.regions.tip.1':
    'Ao clicar em uma região visitada, aparece a opção “Remover”, seja ela marcada por você ou adicionada por causa de um lugar.',
  'help.guide.regions.tip.2':
    'As regiões onde você tem lugares reais são marcadas automaticamente. Você não precisa fazer nada por elas.',
  // search-place
  'help.guide.search-place.title': 'Encontrar um lugar e marcar a região dele',
  'help.guide.search-place.goal':
    'Marque a Baviera pesquisando por Munique, sem precisar saber em que região fica cada cidade.',
  'help.guide.search-place.step.1':
    'Digite uma cidade, um ponto turístico ou um endereço na caixa de busca. Os países aparecem primeiro; os lugares correspondentes vêm abaixo, em Lugares.',
  'help.guide.search-place.step.2': 'Selecione o lugar. O mapa vai até lá e identifica em que região o ponto fica.',
  'help.guide.search-place.step.3':
    'Escolha “Marcar como visitado” para essa região, ou “Adicionar à lista de desejos” se você ainda não esteve lá.',
  'help.guide.search-place.result':
    'A região é marcada, e o país também. Para países sem dados de região no pacote do mapa, o próprio país é marcado.',
  'help.guide.search-place.tip.1':
    'Os lugares vêm da mesma busca usada no resto do TREK, então usam o provedor que o seu administrador configurou.',
  // bucket-country
  'help.guide.bucket-country.title': 'Colocar um país na lista de desejos',
  'help.guide.bucket-country.goal':
    'Mantenha no mapa uma lista de desejos de países, separada dos países que você já visitou.',
  'help.guide.bucket-country.step.1': 'Pesquise o país e selecione-o, ou clique nele no mapa.',
  'help.guide.bucket-country.step.2': 'Escolha “Adicionar à lista de desejos”.',
  'help.guide.bucket-country.step.3':
    'Escolha o mês e o ano, se já souber quando, e confirme em “Adicionar à lista de desejos”.',
  'help.guide.bucket-country.result':
    'O país aparece com linhas diagonais na cor que vai ter depois que você visitá-lo, e entra na aba “Lista de desejos” do painel.',
  'help.guide.bucket-country.tip.1':
    'Quando o país já está na lista, a mesma janela oferece “Remover da lista de desejos”.',
  'help.guide.bucket-country.tip.2':
    'Uma entrada por data prevista: o mesmo país pode estar na lista para dois meses diferentes, mas não duas vezes para o mesmo mês.',
  // bucket-place
  'help.guide.bucket-place.title': 'Adicionar um lugar à lista de desejos',
  'help.guide.bucket-place.goal':
    'Guarde uma cidade, uma atração ou um endereço que você quer visitar, com coordenadas e uma data prevista.',
  'help.guide.bucket-place.step.1': 'Abra a aba “Lista de desejos” no painel inferior.',
  'help.guide.bucket-place.step.2': 'Clique em “Adicionar lugar”.',
  'help.guide.bucket-place.step.3':
    'Digite o nome e clique no botão de busca; escolha o resultado certo para que o lugar receba coordenadas. Você também pode digitar só o nome e pular a busca.',
  'help.guide.bucket-place.step.4': 'Se quiser, escolha mês e ano, e clique em “Adicionar”.',
  'help.guide.bucket-place.result':
    'O lugar aparece no topo da sua lista de desejos com a data prevista. Passe o mouse sobre ele para ver o × que o remove.',
  'help.guide.bucket-place.tip.1':
    'O Dawarich só consegue marcar um desejo como realizado depois se o desejo tiver coordenadas. Ele faz isso assim que seus registros mostrarem que você esteve lá.',
  // stats
  'help.guide.stats.title': 'Ler as suas estatísticas',
  'help.guide.stats.goal': 'Entenda o que os números do painel contam e o que eles não contam.',
  'help.guide.stats.step.1':
    'Países é o número de países diferentes em que você realmente esteve. Os países planejados aparecem abaixo do número e não entram nele. Regiões conta os estados e províncias em que você esteve. Viagens, Lugares e Dias são totais de todas as suas viagens. Cidades é calculado a partir dos endereços dos seus lugares, então é uma estimativa.',
  'help.guide.stats.step.2':
    'Os continentes mostram os países visitados por continente. A Antártida aparece na fileira depois que você a visitar. Em seguida vêm a sua sequência (anos seguidos com pelo menos uma viagem) e quantas viagens você fez neste ano.',
  'help.guide.stats.result':
    'Os números se atualizam sozinhos conforme você planeja suas viagens. Não é preciso manter nada aqui.',
  'help.guide.stats.tip.1':
    'As cidades são tiradas do texto do endereço, sem consulta. Por isso, um endereço curto como “Osteria Francescana, Italy”, ou um que termina numa prefeitura, pode ser contado como região em vez de cidade.',
  'help.guide.stats.tip.2':
    'Países marcados manualmente contam em “Países” e nos continentes, mas não somam viagens, lugares nem dias.',
  // dawarich-countries
  'help.guide.dawarich-countries.title': 'Adicionar países a partir dos seus registros',
  'help.guide.dawarich-countries.goal':
    'Use o Dawarich para descobrir em quais países você esteve no último ano e adicione ao mapa os que você confirmar.',
  'help.guide.dawarich-countries.step.1':
    'Com o complemento Dawarich conectado, um painel do Dawarich com dois blocos aparece na parte de baixo do mapa, à esquerda das estatísticas. Clique em Países.',
  'help.guide.dawarich-countries.step.2':
    'A janela abre na aba Países. Clique em “Procurar países”: o TREK lê os países e cidades cobertos pelas suas gravações nos últimos 12 meses, um mês de cada vez, então pode demorar um pouco. Cada país que o seu Atlas ainda não tem aparece listado com a bandeira, o número de cidades e o nome da primeira cidade. Todos vêm marcados por padrão. Clique em uma linha para deixá-la de fora.',
  'help.guide.dawarich-countries.step.3':
    'Confirme no botão do canto inferior direito, que mostra “Adicionar 5 países” quando cinco linhas estão marcadas. A janela informa quantos foram adicionados. Quando você a fecha, o mapa já está atualizado.',
  'help.guide.dawarich-countries.result':
    'Os países confirmados ganham cor no mapa e entram na contagem de Países, registrados como vindos do Dawarich. Os países que você marcou manualmente não mudam.',
  'help.guide.dawarich-countries.tip.1':
    'Países que o Atlas já mostra como visitados, seja manualmente, por uma viagem ou por uma verificação anterior, ficam de fora, então suas próprias marcações nunca mudam. Um país que você removeu do Atlas antes volta a ser adicionado quando você o confirma aqui.',
  'help.guide.dawarich-countries.tip.2':
    'Se o TREK não conseguir associar o nome de um país, esse nome aparece abaixo das linhas e não é descartado. “Verificar de novo” consulta o Dawarich outra vez. A observação abaixo da lista informa que foram verificados os últimos 12 meses. Não dá para mudar esse período.',
  // dawarich-wishes
  'help.guide.dawarich-wishes.title': 'Marcar desejos como realizados a partir das suas gravações',
  'help.guide.dawarich-wishes.goal':
    'Descubra quais lugares da sua lista de desejos você realmente visitou e marque-os como realizados, com a data da visita.',
  'help.guide.dawarich-wishes.step.1':
    'No painel do Dawarich, na parte de baixo do mapa, à esquerda das estatísticas, clique em “Lista de desejos”.',
  'help.guide.dawarich-wishes.step.2':
    'A janela abre na aba “Lista de desejos”. Clique em “Conferir lista de desejos”: o TREK procura nas suas gravações cada item que tem coordenadas. Um desejo alcançado aparece na lista com a distância a que você chegou, quanto tempo ficou e o dia, e já vem marcado. Um que você já riscou mostra “Já riscado”. Abaixo da lista, uma nota informa quantos itens não têm coordenadas e mostra também a regra: um desejo conta como alcançado a até 250 m e depois de 20 minutos no local.',
  'help.guide.dawarich-wishes.step.3':
    'Confirme com o botão no canto inferior direito, que mostra “Riscar 2” quando duas linhas estão marcadas. Depois feche a janela e abra a aba “Lista de desejos” do painel ao lado.',
  'help.guide.dawarich-wishes.result':
    'Cada desejo ganha um visto verde com a data da estadia, não a de hoje. A dica dele diz “Riscado a partir das suas gravações do Dawarich”. Clique na data para desfazer.',
  'help.guide.dawarich-wishes.tip.1':
    'Só passar de carro não conta: você precisa ficar perto do lugar e permanecer lá por um tempo. Se várias estadias se qualificarem, vale a mais longa. Um desejo sem coordenadas não pode ser verificado, então adicione lugares pela busca em “Adicionar lugar”, e não só pelo nome.',
  'help.guide.dawarich-wishes.tip.2':
    'Cada verificação analisa até 50 entradas, começando pelas que ainda não foram marcadas. Se houver mais, o TREK avisa. Um desejo que já estava marcado mantém a própria data.',

  // ── Screen: collections ───────────────────────────────────────────────────────────────
  'help.ctx.collections.title': 'Coleções',
  'help.ctx.collections.summary':
    'Coleções é a sua biblioteca fora de qualquer viagem: listas com nome dos lugares que você encontrou e quer guardar, cada um com o status Ideia, “Quero ir” ou Visitado e, com Passeios ativado, passeios inteiros que você guardou de uma viagem. Lugares e passeios são copiados para as viagens e a partir delas, nunca vinculados, então uma lista e uma viagem nunca alteram uma à outra.',
  'help.ctx.collections.bullet.1':
    'A coluna de listas, à esquerda, mostra as suas listas, as compartilhadas com você, os convites ainda sem resposta e “Todos os salvos”, que reúne tudo o que está nas listas de que você é dono. “Nova lista” e a importação de arquivo ficam no topo.',
  'help.ctx.collections.bullet.2':
    'O cabeçalho da lista aberta mostra cor, capa, descrição e links, os membros e, à direita, Editar (só para o proprietário), Exportar e Compartilhar. Em uma lista compartilhada com você, o botão Compartilhar aparece como Compartilhada.',
  'help.ctx.collections.bullet.3':
    'Fileira de filtros acima dos lugares: o + para adicionar um lugar, os menus Status, Categoria, Avaliação e Ordenar, o ícone de caixa de seleção para Escolher e o ícone de nuvem para “Importar de uma viagem”. O filtro de rótulos só aparece nessa fileira quando não há mapa na tela.',
  'help.ctx.collections.bullet.4':
    'Linhas de lugares: foto, nome e endereço, rótulos e categoria, e a pílula de status à direita. Um clique na pílula muda para o próximo status.',
  'help.ctx.collections.bullet.5':
    'Mapa à direita: um alfinete para cada lugar com coordenadas. A barra superior tem “Ampliar mapa” (“Mostrar lista” quando o mapa ocupa tudo), o filtro de rótulos com o botão para gerenciá-los e a caixa “Buscar lugares”. Clique em um alfinete para abrir o lugar.',
  'help.ctx.collections.bullet.6':
    'Ficha de detalhes: clique em uma linha para ver capa, categoria, status, avaliação em estrelas, rótulos, descrição e links. A câmera na capa troca a foto. Embaixo ficam Editar, “Copiar para viagem”, o botão de navegação e “Remover da lista”.',
  // create-list
  'help.guide.create-list.title': 'Criar uma lista',
  'help.guide.create-list.goal': 'Crie uma nova lista com nome, cor e capa, pronta para receber lugares.',
  'help.guide.create-list.step.1': 'Clique em “Nova lista” no topo da barra lateral de listas.',
  'help.guide.create-list.step.2':
    'Dê um nome à lista e escolha uma cor. Imagem de capa, descrição e links são opcionais; você pode adicioná-los depois em “Editar”.',
  'help.guide.create-list.step.3': 'Clique em Criar.',
  'help.guide.create-list.result':
    'A lista abre vazia, com “Adicionar um lugar” e “Importar de uma viagem” como as duas formas de preenchê-la.',
  'help.guide.create-list.tip.1':
    'A capa pode ser uma imagem sua ou uma encontrada pela busca do Unsplash, na mesma janela.',
  // add-place
  'help.guide.add-place.title': 'Adicionar um lugar',
  'help.guide.add-place.goal':
    'Encontre um lugar e salve-o na lista aberta com nome, categoria, status e notas de uma só vez.',
  'help.guide.add-place.step.1':
    'Clique no + no começo da fileira de filtros acima dos lugares. Em uma lista ainda vazia, clique em “Adicionar um lugar”, no meio da página.',
  'help.guide.add-place.step.2':
    'Digite o lugar no campo de busca e escolha um resultado. Nome, endereço e coordenadas são preenchidos a partir dele.',
  'help.guide.add-place.step.3':
    'Defina o status e, se quiser, uma categoria, uma descrição e links. Depois clique em “Adicionar”. A janela continua aberta para o próximo lugar; “Cancelar” fecha a janela.',
  'help.guide.add-place.result': 'O lugar aparece na lista e, quando tem coordenadas, como alfinete no mapa.',
  'help.guide.add-place.tip.1':
    'De dentro de uma viagem, “Salvar na Coleção”, nos detalhes do lugar ou no menu de um lugar, coloca um lugar da viagem em uma lista sem sair da viagem.',
  'help.guide.add-place.tip.2':
    'A lista precisa ser sua ou uma em que você é editor ou administrador; o + não aparece em “Todos os salvos” nem em listas que você só visualiza.',
  // import-from-trip
  'help.guide.import-from-trip.title': 'Importar lugares de uma viagem',
  'help.guide.import-from-trip.goal':
    'Traga todos os lugares de uma viagem para uma lista de uma vez, em vez de salvar um por um.',
  'help.guide.import-from-trip.step.1':
    'Clique no botão de importar, o da seta na nuvem, na linha de filtros. Numa lista vazia, o mesmo botão fica ao lado de “Adicionar um lugar”.',
  'help.guide.import-from-trip.step.2': 'Escolha uma das suas viagens.',
  'help.guide.import-from-trip.step.3':
    'Marque os lugares que você quer. Os que já estão na lista aparecem em cinza. Os lugares que não estão em nenhum dia da viagem já vêm selecionados. Se todos os lugares já estiverem em algum dia, todos os novos vêm selecionados. “Apenas novos” oculta os lugares que a lista já tem.',
  'help.guide.import-from-trip.step.4': 'Clique em “Importar”. O botão sempre mostra quantos itens serão adicionados.',
  'help.guide.import-from-trip.result':
    'Os lugares são copiados para a lista com nome, endereço, coordenadas, descrição e categoria. A viagem não muda.',
  'help.guide.import-from-trip.tip.1':
    'O TREK ignora automaticamente as duplicatas por nome ou coordenadas, então não tem problema importar duas vezes.',
  'help.guide.import-from-trip.tip.2':
    'Na lista de lugares de uma viagem, o modo de seleção oferece “Salvar na Coleção” para um conjunto de lugares escolhidos a dedo.',
  // place-status
  'help.guide.place-status.title': 'Definir o status de um lugar',
  'help.guide.place-status.goal': 'Saiba o que ainda é ideia, o que está na lista de favoritos e onde você já esteve.',
  'help.guide.place-status.step.1':
    'Clique no selo de status na ponta direita da linha do lugar. “Ideia” passa para “Quero ir”.',
  'help.guide.place-status.step.2': 'Clique de novo para “Visitado” e mais uma vez para voltar a “Ideia”.',
  'help.guide.place-status.result':
    'A pílula e a cor dela mudam na hora, e as contagens do filtro de status acima da lista são atualizadas.',
  'help.guide.place-status.tip.1':
    'O status só existe nas Coleções. Ao copiar um lugar para uma viagem, o status não é copiado.',
  'help.guide.place-status.tip.2':
    'A partir de uma viagem, “Salvar na Coleção” abre “Salvar na lista” com uma pílula de status para cada lista em que o lugar está, e a barra de seleção do painel de lugares tem “Marcar como visitado nas suas listas”.',
  // place-detail
  'help.guide.place-detail.title': 'Abrir um lugar salvo',
  'help.guide.place-detail.goal':
    'Veja tudo sobre um lugar e o que dá para fazer com ele: editar, copiar para uma viagem, ver o caminho, remover.',
  'help.guide.place-detail.step.1':
    'Clique na linha de um lugar. A ficha de detalhes abre ao lado da lista, e o mapa vai até o lugar.',
  'help.guide.place-detail.step.2':
    'Embaixo ficam Editar, “Copiar para viagem”, o botão de navegação, que abre o lugar em um app de mapas, e “Remover da lista”. A câmera na capa troca a foto automática por uma foto sua.',
  'help.guide.place-detail.result':
    'Em “Editar”, você muda o nome, a categoria, os rótulos, o endereço, as coordenadas, a descrição e os links direto na ficha.',
  'help.guide.place-detail.tip.1':
    'A capa é buscada automaticamente quando o lugar não tem imagem própria. Sua própria imagem pode ser JPG, PNG, GIF, WebP ou HEIC de até 20 MB. O ícone de lixeira ao lado da câmera volta para a foto automática.',
  'help.guide.place-detail.tip.2':
    'Todos os membros, inclusive você, podem dar uma avaliação em estrelas abaixo do status; o filtro Avaliação, na fileira de filtros, usa a média.',
  // labels
  'help.guide.labels.title': 'Agrupar lugares com rótulos',
  'help.guide.labels.goal':
    'Crie rótulos próprios para uma lista, como bairros ou dias, além das categorias compartilhadas.',
  'help.guide.labels.step.1':
    'Clique em “Adicionar rótulo” ao lado dos rótulos acima do mapa (“Gerenciar rótulos” quando a lista já tem algum). Quando não há mapa na tela, o botão fica no fim da fileira de filtros.',
  'help.guide.labels.step.2':
    'Digite um nome, escolha uma cor e clique em “Adicionar rótulo”. Na mesma janela você pode renomear, mudar a cor ou excluir rótulos existentes.',
  'help.guide.labels.step.3':
    'Ative Escolher, marque os lugares e clique em “Atribuir rótulo” na barra de seleção; depois escolha os rótulos e confirme com “Atribuir rótulo”. Para um único lugar, você também pode adicionar rótulos por Editar, na ficha de detalhes dele.',
  'help.guide.labels.step.4':
    'Clique em um ou mais rótulos acima do mapa para mostrar, na lista e no mapa, só os lugares que tenham algum desses rótulos. Clique de novo em um rótulo para tirá-lo do filtro.',
  'help.guide.labels.result':
    'Os lugares com rótulo mostram os rótulos na linha; o filtro de rótulos está disponível para todos os membros, inclusive visualizadores.',
  'help.guide.labels.tip.1':
    'Os rótulos pertencem à lista em que foram criados. Se você mover um lugar para outra lista, os rótulos dele são removidos.',
  'help.guide.labels.tip.2': 'Gerenciar e atribuir rótulos exige permissão de edição na lista.',
  // filter-select
  'help.guide.filter-select.title': 'Filtrar e selecionar lugares',
  'help.guide.filter-select.goal': 'Filtre a lista e altere vários lugares de uma vez.',
  'help.guide.filter-select.step.1':
    'Use os menus da fileira de filtros: status, categoria, avaliação mínima e ordenação. Status e categoria mostram quantos lugares correspondem a cada opção.',
  'help.guide.filter-select.step.2':
    'Clique no ícone de caixa de seleção, Escolher, depois dos menus. Cada linha ganha uma caixa de seleção, e uma barra de seleção aparece.',
  'help.guide.filter-select.step.3':
    'Marque os lugares ou use “Selecionar tudo” para todos os que o filtro mostra e escolha “Atribuir rótulo”, “Mover para lista”, “Duplicar em lista”, “Copiar para viagem” ou Excluir. Só o dono ou um administrador da lista pode mover e excluir.',
  'help.guide.filter-select.result':
    'As ações valem para toda a seleção de uma vez. O × à direita encerra o modo de seleção.',
  'help.guide.filter-select.tip.1':
    '“Selecionar tudo” seleciona só os lugares que correspondem ao filtro. Para agir sobre todos os seus lugares “Quero ir”, filtre por “Quero ir” e clique em “Selecionar tudo”.',
  // copy-to-trip
  'help.guide.copy-to-trip.title': 'Copiar lugares para uma viagem',
  'help.guide.copy-to-trip.goal': 'Adicione lugares salvos como paradas em uma das suas viagens.',
  'help.guide.copy-to-trip.step.1':
    'Ative Escolher e marque os lugares, ou abra um lugar e use “Copiar para viagem” na ficha de detalhes dele.',
  'help.guide.copy-to-trip.step.2': 'Clique em “Copiar para viagem” na barra de seleção.',
  'help.guide.copy-to-trip.step.3': 'Escolha a viagem. Use a caixa de busca para filtrar uma lista longa.',
  'help.guide.copy-to-trip.result':
    'Os lugares entram na lista de lugares dessa viagem com nome, descrição, categoria, notas, preço, coordenadas, foto e tags. Nada muda na coleção.',
  'help.guide.copy-to-trip.tip.1':
    'Quem só visualiza uma lista compartilhada também pode fazer isso. Os lugares da lista são copiados, e a lista não muda.',
  // share-list
  'help.guide.share-list.title': 'Compartilhar uma lista com alguém',
  'help.guide.share-list.goal': 'Planeje uma lista junto com outras pessoas deste TREK, em tempo real.',
  'help.guide.share-list.step.1': 'Clique em Compartilhar no cabeçalho da sua lista.',
  'help.guide.share-list.step.2': 'Selecione o usuário e uma função: Visualizador, Editor ou Administrador.',
  'help.guide.share-list.step.3':
    'Clique em “Enviar convite”. A pessoa aparece como pendente até aceitar o convite no painel de listas dela ou pela notificação.',
  'help.guide.share-list.result':
    'Depois que a pessoa aceitar, a lista aparece para ela em “Compartilhada”, e todas as alterações sincronizam ao vivo. Você continua podendo editar os membros e as funções deles na mesma janela.',
  'help.guide.share-list.tip.1':
    'Visualizadores podem ver, avaliar e copiar lugares para as próprias viagens. Editores adicionam e editam lugares e rótulos. Administradores também podem mover e excluir.',
  'help.guide.share-list.tip.2':
    'Só o dono pode convidar e remover pessoas; um membro pode sair sozinho de uma lista compartilhada.',
  // export-list
  'help.guide.export-list.title': 'Exportar uma lista como arquivo',
  'help.guide.export-list.goal': 'Passe uma lista para alguém em outro servidor TREK ou abra-a em um app de mapas.',
  'help.guide.export-list.step.1': 'Clique em Exportar no cabeçalho da lista.',
  'help.guide.export-list.step.2':
    'Escolha “Lista do TREK” para usar a lista em outro TREK, com rótulos e status, ou GPX para OsmAnd, Organic Maps, Garmin e outros apps que leem waypoints.',
  'help.guide.export-list.result': 'O arquivo é baixado. Qualquer membro de uma lista compartilhada pode exportá-la.',
  'help.guide.export-list.tip.1':
    'Um lugar sem coordenadas não pode virar waypoint GPX. Ele fica de fora, e o TREK informa quantos ficaram.',
  'help.guide.export-list.tip.2':
    'Avaliações, membros e fotos enviadas não são exportados, de propósito: eles pertencem a este TREK, não à lista.',
  // import-file
  'help.guide.import-file.title': 'Importar uma lista de um arquivo',
  'help.guide.import-file.goal':
    'Importe um arquivo de lista do TREK ou um arquivo GPX, como lista nova ou para uma lista existente.',
  'help.guide.import-file.step.1':
    'Clique no botão de importar, com a seta de envio, ao lado de “Nova lista” no painel de listas.',
  'help.guide.import-file.step.2':
    'Escolha o arquivo. Antes de importar qualquer coisa, o TREK mostra o que há nele: o nome, quantos lugares e quantos rótulos.',
  'help.guide.import-file.step.3':
    'Mantenha “Nova lista” e mude o nome, se quiser, e clique em Importar. Ou escolha “Adicionar a uma lista” para colocar os lugares em uma lista que você pode editar e clique em “Adicionar à lista”.',
  'help.guide.import-file.result':
    'A lista abre com os lugares importados. Importar para uma lista só adiciona lugares. Os que já estavam lá mantêm status, notas e rótulos.',
  'help.guide.import-file.tip.1':
    'Num GPX, cada waypoint com nome vira um lugar. Trilhas são linhas e ficam de fora, e a prévia mostra quantos pontos eram.',
  'help.guide.import-file.tip.2':
    'Um arquivo que não é nem uma lista do TREK nem um GPX é recusado, e o TREK mostra o motivo. Se um único lugar não puder ser lido, só ele é ignorado, não o arquivo inteiro.',
  // edit-list
  'help.guide.edit-list.title': 'Editar ou excluir uma lista',
  'help.guide.edit-list.goal': 'Mude o nome, a cor, a capa, a descrição ou os links de uma lista, ou remova a lista.',
  'help.guide.edit-list.step.1': 'Clique em Editar no cabeçalho da lista. Só o dono vê esse botão.',
  'help.guide.edit-list.step.2':
    'Altere o que quiser e clique em Salvar. O ícone de lixeira no canto inferior esquerdo, “Excluir lista”, apaga a lista e todos os lugares dela depois que você confirma.',
  'help.guide.edit-list.result': 'O cabeçalho no topo mostra na hora a nova cor, a capa e a descrição.',
  'help.guide.edit-list.tip.1': 'Excluir uma lista não pode ser desfeito. Exporte antes se quiser guardar uma cópia.',
  // all-saved
  'help.guide.all-saved.title': 'Buscar em toda a sua biblioteca',
  'help.guide.all-saved.goal': 'Veja de uma vez os lugares de todas as listas que são suas.',
  'help.guide.all-saved.step.1':
    'Clique em “Todos os salvos” no painel de listas. Ali aparecem juntos os lugares de todas as listas de que você é dono ou coproprietário.',
  'help.guide.all-saved.step.2':
    'Digite em “Buscar lugares”, acima do mapa, e use os filtros como em qualquer lista. Escolher também funciona aqui: mover, duplicar, copiar para uma viagem ou excluir em várias listas.',
  'help.guide.all-saved.result':
    'Esta visualização reúne todos os seus lugares salvos. Aqui não dá para adicionar nem importar lugares, porque não existe uma lista única para recebê-los.',
  'help.guide.all-saved.tip.1':
    'Rótulos e passeios guardados pertencem a uma lista só, então nenhum dos dois aparece em “Todos os salvos”.',

  // ── Screen: journey ───────────────────────────────────────────────────────────────────
  'help.ctx.journey.title': 'Jornada',
  'help.ctx.journey.summary':
    'A Jornada é o seu diário de viagem centrado em fotos. Cada jornada está vinculada a uma ou mais viagens, e você a preenche dia a dia com entradas que têm relato, fotos, humor e clima. Esta tela lista as suas jornadas; abra uma para escrever.',
  'help.ctx.journey.bullet.1':
    'O banner no topo mostra a jornada em andamento, ou a mais recente, com as contagens de entradas, fotos e lugares. “Continuar escrevendo” a abre no dia de hoje. Quando uma viagem acabou de terminar, um banner “A viagem acabou de terminar”, acima dele, oferece transformar essa viagem em uma jornada.',
  'help.ctx.journey.bullet.2':
    'Abaixo de “Todas as jornadas” há um cartão por jornada, com capa, status, datas e contagens; a jornada exibida no banner não aparece de novo ali. Clique em um cartão para abri-la.',
  'help.ctx.journey.bullet.3':
    'O último cartão da grade, “Criar uma nova jornada”, começa uma jornada a partir das suas viagens.',
  // create-journey
  'help.guide.create-journey.title': 'Criar uma jornada',
  'help.guide.create-journey.goal':
    'Comece um diário para uma viagem, com os lugares dela já adicionados como sugestões.',
  'help.guide.create-journey.step.1': 'Clique em “Criar uma nova jornada”, o último cartão da grade.',
  'help.guide.create-journey.step.2':
    'Dê um nome e, se quiser, um subtítulo. Depois marque as viagens que fazem parte dela. O contador mostra quantos lugares serão adicionados.',
  'help.guide.create-journey.step.3': 'Clique em “Criar jornada”.',
  'help.guide.create-journey.result':
    'O diário abre. Cada lugar das viagens vinculadas aparece na linha do tempo como sugestão, uma vez para cada dia em que está planejado. Você pode escrever um registro para cada um.',
  'help.guide.create-journey.tip.1': 'Você pode vincular mais viagens depois, em “Configurações da jornada”.',
  'help.guide.create-journey.tip.2':
    'Uma jornada sem viagens também funciona; nesse caso, você adiciona as entradas manualmente.',
  // open-journey
  'help.guide.open-journey.title': 'Abrir uma jornada',
  'help.guide.open-journey.goal': 'Abra um diário e veja em que ponto ele abre.',
  'help.guide.open-journey.step.1':
    'Clique em um cartão. Cada um mostra a capa, as datas e quantas entradas, fotos e lugares a jornada tem.',
  'help.guide.open-journey.result':
    'Uma jornada em andamento abre no dia de hoje, ou na última entrada antes de hoje se ainda não houver nada escrito hoje. Uma jornada concluída abre no início.',
  'help.guide.open-journey.tip.1':
    'A capa é a primeira foto da jornada, a menos que você defina outra em “Configurações da jornada”.',
  // continue-writing
  'help.guide.continue-writing.title': 'Continuar a jornada atual',
  'help.guide.continue-writing.goal': 'Abra direto a página de hoje da jornada que você está fazendo.',
  'help.guide.continue-writing.step.1':
    'Clique em “Continuar escrevendo” no banner do topo. Ele mostra a jornada em andamento ou, se não houver nenhuma, a mais recente.',
  'help.guide.continue-writing.result':
    'O diário abre no dia de hoje ou, se ainda não houver nada escrito hoje, na última entrada antes dele.',
  'help.guide.continue-writing.tip.1':
    'Quando uma viagem acabou de terminar, um banner “A viagem acabou de terminar” aparece acima deste: “Criar jornada” começa uma jornada com essa viagem marcada, e Dispensar esconde a sugestão neste navegador.',

  // ── Screen: journey-detail ────────────────────────────────────────────────────────────
  'help.ctx.journey-detail.title': 'Diário',
  'help.ctx.journey-detail.summary':
    'Uma jornada aberta: a linha do tempo à esquerda, dia a dia, e o mapa à direita, com camadas que você liga e desliga para o plano, o que foi gravado, as entradas e as fotos. O cabeçalho mostra as contagens, o Studio, o interruptor de sugestões e o ⋯ para “Configurações da jornada”. Use a barra de ferramentas logo abaixo para adicionar entradas.',
  'help.ctx.journey-detail.bullet.1':
    'Cabeçalho: seta de voltar e selo de status, capa, título e subtítulo, as contagens de dias, lugares, entradas e fotos e, à direita, o Studio, o olho que oculta ou mostra as sugestões e o ⋯ para “Configurações da jornada”.',
  'help.ctx.journey-detail.bullet.2':
    'Barra de ferramentas: as abas “Linha do tempo” e Galeria, “Buscar nesta viagem” e “Adicionar entrada”. Na Galeria, Enviar aparece no lugar de “Adicionar entrada”.',
  'help.ctx.journey-detail.bullet.3':
    'Linha do tempo: uma seção por dia, com o número, a contagem de lugares e um + para adicionar uma entrada nesse dia. Abaixo, os cartões das entradas com fotos, humor, clima e relato, e os cartões tracejados de sugestão das viagens, cada um com um × para dispensá-lo.',
  'help.ctx.journey-detail.bullet.4':
    'Mapa: a barra de camadas no topo liga e desliga Planejado (alfinetes vazados e as rotas GPX tracejadas das viagens), Gravado (rotas contínuas mantidas do Dawarich), Entradas (alfinetes nas cores dos dias, ligados em ordem de data por uma linha fina tracejada) e Fotos. O (i) ao lado explica cada símbolo.',
  'help.ctx.journey-detail.bullet.5':
    '“Configurações da jornada” (⋯): capa, nome e subtítulo, status, trilhas GPX, dias gravados, lugares a partir das fotos, campos de entrada, sugestões dispensadas, viagens sincronizadas, colaboradores e quais membros de uma viagem têm acesso, compartilhamento público, arquivar e excluir.',
  'help.ctx.journey-detail.bullet.6':
    'No fim de uma linha do tempo longa, você encontra “Voltar ao topo”, um contador de dias que leva a qualquer dia ou entrada e “Ir para a última entrada”.',
  // add-entry
  'help.guide.add-entry.title': 'Escrever uma entrada',
  'help.guide.add-entry.goal': 'Adicione o relato de um dia, com título, texto, humor e clima.',
  'help.guide.add-entry.step.1':
    'Clique em “Adicionar entrada” na barra de ferramentas, ou no + na ponta direita do cabeçalho de um dia para começar nesse dia.',
  'help.guide.add-entry.step.2':
    'Dê um título à entrada e escreva o texto. A barra de ferramentas acima do texto adiciona negrito, itálico, títulos, citações, links e listas em Markdown.',
  'help.guide.add-entry.step.3':
    'Na coluna da direita, confira a data e a hora, pesquise um local ou use sua posição atual, e escolha um humor e o clima.',
  'help.guide.add-entry.step.4': 'Clique em “Salvar”.',
  'help.guide.add-entry.result':
    'A entrada aparece no dia dela na linha do tempo e como um pino no mapa. Os contadores do cabeçalho são atualizados.',
  'help.guide.add-entry.tip.1':
    'Quando você escreve a partir de uma sugestão, usa o mesmo editor, com o lugar já definido.',
  'help.guide.add-entry.tip.2':
    'Uma entrada com lugar tem a opção “Deixar fora da rota”: a entrada continua no diário, mas não entra na distância nem nos países e não aparece no mapa do Studio.',
  // entry-photos
  'help.guide.entry-photos.title': 'Adicionar fotos e vídeos a uma entrada',
  'help.guide.entry-photos.goal': 'Adicione fotos a um dia; a primeira vira a capa da entrada.',
  'help.guide.entry-photos.step.1': 'Abra o menu de uma entrada pelo ⋯ no cartão dela e escolha Editar.',
  'help.guide.entry-photos.step.2':
    'Clique em “Enviar fotos” e escolha os arquivos. “Da galeria” usa imagens que já estão na galeria da jornada; Fotos externas pesquisa as fotos daquele dia em uma biblioteca Immich ou Synology conectada.',
  'help.guide.entry-photos.step.3':
    'Passe o mouse sobre uma foto e clique em “Tornar 1º” para escolher a capa. Depois clique em “Salvar”.',
  'help.guide.entry-photos.result':
    'As fotos aparecem no cartão e na galeria; a primeira vira a miniatura em todos os lugares.',
  'help.guide.entry-photos.tip.1':
    'Vídeos são adicionados a um registro do mesmo jeito: mp4, m4v, webm ou mov de até 500 MB. Eles são guardados sem alterações.',
  'help.guide.entry-photos.tip.2':
    'Arquivos HEIC do iPhone são convertidos para JPEG no envio, o que remove os metadados de GPS e da câmera.',
  // suggestions
  'help.guide.suggestions.title': 'Usar ou dispensar as sugestões',
  'help.guide.suggestions.goal':
    'Transforme os lugares das suas viagens em entradas e dispense aqueles sobre os quais não vai escrever.',
  'help.guide.suggestions.step.1':
    'Uma sugestão é um cartão com borda tracejada e um botão “Adicionar entrada”: um lugar de uma viagem vinculada, no dia em que foi planejado. Clique nele para abrir o editor com o lugar e o dia já definidos.',
  'help.guide.suggestions.step.2':
    'Clique no × na ponta direita de um cartão que você não vai usar. O cartão sai da linha do tempo, mas não é excluído, e a sincronização da viagem não o sugere de novo.',
  'help.guide.suggestions.step.3':
    'Mudou de ideia? Abra “Configurações da jornada” pelo ⋯ no cabeçalho: “Trazer de volta as sugestões descartadas” mostra quantas são e devolve todas.',
  'help.guide.suggestions.result':
    'A linha do tempo mostra só as entradas que você quer escrever. O ícone de olho no cabeçalho oculta todas as sugestões de uma vez enquanto você lê.',
  'help.guide.suggestions.tip.1': 'Um lugar planejado em dois dias gera uma sugestão em cada um desses dias.',
  'help.guide.suggestions.tip.2': 'Sugestões nunca entram nas estatísticas, só os registros escritos.',
  // add-on-day
  'help.guide.add-on-day.title': 'Adicionar um registro num dia anterior',
  'help.guide.add-on-day.goal': 'Escreva sobre um dia que já passou sem precisar corrigir a data depois.',
  'help.guide.add-on-day.step.1': 'Clique no + na ponta direita do cabeçalho desse dia.',
  'help.guide.add-on-day.step.2': 'O editor abre já com essa data. Escreva e clique em “Salvar” como de costume.',
  'help.guide.add-on-day.result': 'A entrada é adicionada na hora ao dia certo.',
  'help.guide.add-on-day.tip.1':
    'Para mudar a ordem dentro de um dia, passe o mouse sobre uma entrada: “Mover para cima” e “Mover para baixo” aparecem à esquerda dela.',
  // pros-cons
  'help.guide.pros-cons.title': 'Adicionar um veredito',
  'help.guide.pros-cons.goal': 'Resuma um dia com o que foi ótimo e o que não foi.',
  'help.guide.pros-cons.step.1':
    'No editor, procure “Prós e contras” abaixo do relato. Digite um ponto em “Prós” ou “Contras” e use “Adicionar outro” para o próximo.',
  'help.guide.pros-cons.step.2': 'Salve. No cartão, “Mostrar mais” abre o relato e o veredito como duas listas curtas.',
  'help.guide.pros-cons.result':
    'Os polegares para cima e para baixo aparecem abaixo do relato, onde você os vê rapidinho.',
  'help.guide.pros-cons.tip.1':
    'Se uma jornada não usa vereditos, você pode desativar a seção em “Campos do registro”, nas Configurações da jornada.',
  // search-journey
  'help.guide.search-journey.title': 'Encontrar algo em um diário longo',
  'help.guide.search-journey.goal': 'Encontre uma entrada sem precisar rolar por semanas de registros.',
  'help.guide.search-journey.step.1':
    'Digite em “Buscar nesta viagem”, na barra de ferramentas. A linha do tempo é filtrada enquanto você digita, por títulos, relatos, lugares e tags. Acentos e maiúsculas não fazem diferença.',
  'help.guide.search-journey.step.2':
    'Para ir direto a um dia, clique no contador de dias no fim da linha do tempo, entre “Voltar ao topo” e “Ir para a última entrada”.',
  'help.guide.search-journey.result':
    'A linha do tempo rola até o dia ou a entrada escolhidos, e o mapa vai até lá. Só as entradas correspondentes aparecem até você limpar a caixa de busca.',
  'help.guide.search-journey.tip.1':
    'Uma jornada em andamento abre na página de hoje, então a página atual geralmente já está à vista.',
  'help.guide.search-journey.tip.2':
    'O olho no cabeçalho oculta as sugestões, para você ver só as entradas que escreveu.',
  // gallery-map
  'help.guide.gallery-map.title': 'Navegar pela galeria e pelo mapa',
  'help.guide.gallery-map.goal': 'Veja a jornada inteira em fotos e como lugares no mapa.',
  'help.guide.gallery-map.step.1':
    'Mude para “Galeria” na barra de ferramentas. Ali aparecem todas as fotos de todas as entradas, além das imagens enviadas direto para a galeria. Clique em uma para abri-la no lightbox.',
  'help.guide.gallery-map.step.2':
    'Enviar, à direita, adiciona fotos à galeria. Com Immich ou Synology conectado, um botão com o nome da biblioteca permite escolher fotos de lá.',
  'help.guide.gallery-map.result':
    'Os alfinetes têm a cor do dia deles e são ligados em ordem de data por uma linha fina tracejada. A barra de camadas no topo do mapa define o que é desenhado.',
  'help.guide.gallery-map.tip.1':
    'As trilhas GPX de uma viagem aparecem na camada Planejado do mapa como linhas tracejadas. “Mostrar todas as trilhas GPX das viagens”, em “Configurações da jornada”, as desativa.',
  'help.guide.gallery-map.tip.2':
    'As fotos da galeria com localização também aparecem no mapa público, quando “Galeria” e “Mapa” estão compartilhados.',
  // entry-fields
  'help.guide.entry-fields.title': 'Desativar campos das entradas',
  'help.guide.entry-fields.goal': 'Mostre no editor só os campos que esta jornada usa.',
  'help.guide.entry-fields.step.1':
    'Clique em ⋯ no canto superior direito do cabeçalho para abrir “Configurações da jornada”.',
  'help.guide.entry-fields.step.2': 'Em “Campos do registro”, desative Humor, Clima ou “Prós e contras”.',
  'help.guide.entry-fields.result':
    'O editor deixa de mostrar esses campos. Nada do que você escreveu se perde: quando você reativa um campo, os valores salvos voltam a aparecer. Uma jornada compartilhada oculta os mesmos campos.',
  'help.guide.entry-fields.tip.1':
    'As opções valem por jornada, então uma viagem a trabalho e umas férias podem ser diferentes.',
  // link-trip
  'help.guide.link-trip.title': 'Vincular outra viagem',
  'help.guide.link-trip.goal': 'Adicione ao diário os lugares de uma segunda viagem como sugestões.',
  'help.guide.link-trip.step.1':
    'Clique em ⋯ no canto superior direito do cabeçalho para abrir “Configurações da jornada”.',
  'help.guide.link-trip.step.2': 'Em “Viagens sincronizadas”, clique em “Adicionar viagem”.',
  'help.guide.link-trip.step.3': 'Pesquise a viagem pelo nome ou destino e clique em Vincular ao lado dela.',
  'help.guide.link-trip.result':
    'Os lugares da viagem aparecem na linha do tempo como sugestões nos respectivos dias e entram na camada Planejado do mapa, junto com as trilhas GPX.',
  'help.guide.link-trip.tip.1':
    'A lixeira ao lado de uma viagem vinculada a desvincula depois de pedir confirmação; as entradas que você escreveu continuam.',
  'help.guide.link-trip.tip.2': 'Entradas com dia contam só uma vez, não importa quantas viagens cubram esse dia.',
  // share-public
  'help.guide.share-public.title': 'Compartilhar a jornada publicamente',
  'help.guide.share-public.goal': 'Dê um link somente leitura para pessoas sem conta no TREK.',
  'help.guide.share-public.step.1':
    'Abra “Configurações da jornada” pelo ⋯ no cabeçalho e role até “Compartilhamento público”.',
  'help.guide.share-public.step.2': 'Clique em “Criar link de compartilhamento”.',
  'help.guide.share-public.step.3':
    'Escolha o que os visitantes veem: “Linha do tempo”, Galeria e Mapa. Em Mapa, “Plano da viagem” adiciona os lugares e as rotas planejados, e “Rotas gravadas” adiciona as rotas dos dias que você gravou. Copiar copia o link para a área de transferência.',
  'help.guide.share-public.result':
    'Quem tiver o link vê só as seções ativadas. Os campos que você desativou em “Campos do registro” também ficam ocultos ali.',
  'help.guide.share-public.tip.1':
    'As fotos só aparecem no mapa público quando Galeria e Mapa estão ativados. Com Mapa desativado, o servidor remove as coordenadas das fotos antes de enviá-las.',
  'help.guide.share-public.tip.2': 'Clique em “Excluir link”, ao lado de Copiar, para parar de compartilhar.',
  // contributors
  'help.guide.contributors.title': 'Escrever em conjunto',
  'help.guide.contributors.goal': 'Deixe outro viajante adicionar as próprias entradas e fotos.',
  'help.guide.contributors.step.1': 'Abra “Configurações da jornada” pelo ⋯ no cabeçalho e procure Colaboradores.',
  'help.guide.contributors.step.2': 'Clique em “Convidar colaborador” e busque o usuário pelo nome ou e-mail.',
  'help.guide.contributors.step.3': 'Escolha Visualizador ou Editor e clique em Convidar.',
  'help.guide.contributors.result':
    'A jornada aparece na lista da pessoa, e as entradas dela mostram o nome dela. Para remover um colaborador, clique no × ao lado dele.',
  'help.guide.contributors.tip.1':
    'Colaboradores são para pessoas deste TREK. Para todas as outras, existe o link público.',
  // studio
  'help.guide.studio.title': 'Montar a jornada como livro de fotos',
  'help.guide.studio.goal': 'Transforme o diário em páginas para imprimir.',
  'help.guide.studio.step.1': 'Clique em “Studio” no cabeçalho. O editor de design abre por cima da jornada.',
  'help.guide.studio.step.2':
    'Para voltar, clique em × na ponta direita da barra superior. Você volta para onde estava.',
  'help.guide.studio.result':
    'A coluna e seus painéis ficam à esquerda, a página dupla fica na bancada e as propriedades ficam à direita. O Layout automático monta o livro a partir dos seus registros. Exportar cria um PDF pronto para impressão.',
  'help.guide.studio.tip.1':
    'O Studio precisa de uma janela com pelo menos 1024 px de largura e não está disponível no celular.',
  'help.guide.studio.tip.2':
    'O livro tem o mesmo acesso da jornada: quem pode ler a jornada pode abrir o livro, e quem pode editar a jornada pode salvá-lo.',
  // archive-journey
  'help.guide.archive-journey.title': 'Arquivar ou excluir uma jornada',
  'help.guide.archive-journey.goal': 'Encerre uma jornada concluída ou exclua uma de vez.',
  'help.guide.archive-journey.step.1':
    'Clique em ⋯ no canto superior direito do cabeçalho para abrir “Configurações da jornada”.',
  'help.guide.archive-journey.step.2':
    'Lá embaixo, “Arquivar Jornada” encerra a jornada e a marca como arquivada; “Restaurar Jornada” a restaura. “Excluir” apaga a jornada com todos os registros e fotos, depois de uma confirmação.',
  'help.guide.archive-journey.result':
    'Uma jornada arquivada continua legível e compartilhável; ela só deixa de abrir no dia de hoje.',
  'help.guide.archive-journey.tip.1':
    'A exclusão não pode ser desfeita e não altera as viagens às quais a jornada estava vinculada.',
  'help.guide.archive-journey.tip.2': 'A capa, o nome e o subtítulo ficam na mesma janela, no topo.',
  'help.guide.journey-status.title': 'Definir o status de uma jornada',
  'help.guide.journey-status.goal':
    'Marque você mesmo uma jornada como rascunho, ao vivo ou concluída, em vez de seguir as datas das viagens dela.',
  'help.guide.journey-status.step.1':
    'Clique em ⋯ no canto superior direito do cabeçalho da jornada para abrir “Configurações da jornada”.',
  'help.guide.journey-status.step.2':
    'Em “Status”, escolha “Rascunho”, “Ao vivo” ou “Concluído”. A escolha é salva na hora.',
  'help.guide.journey-status.result':
    'A jornada fica com o status escolhido: Rascunho e Concluído aparecem como selo no cartão e no cabeçalho, e uma jornada “Ao vivo” aparece no banner no topo da lista de jornadas.',
  'help.guide.journey-status.tip.1':
    '“Automático” volta a usar as datas das viagens vinculadas. Sem viagem vinculada, uma jornada automática continua como rascunho.',
  'help.guide.journey-status.tip.2':
    'Um status definido manualmente continua até você mudá-lo, mesmo que as datas da viagem mudem.',

  // ── Screen: journey-studio ────────────────────────────────────────────────────────────
  'help.ctx.journey-studio.title': 'Studio', // same-as-en
  'help.ctx.journey-studio.summary':
    'O TREK Studio monta uma jornada como um livro de fotos que você pode imprimir. Ele abre por cima do diário: a coluna e seus painéis ficam à esquerda, a página dupla em que você trabalha fica no meio e as propriedades ficam à direita. O Layout automático cria um primeiro rascunho a partir dos seus registros, um tema dá ao livro suas cores e fontes, e o assistente pode desenhar páginas com você. Depois disso, você pode mover, recortar e mudar o estilo de tudo, e pode desfazer cada passo.',
  'help.ctx.journey-studio.bullet.1':
    'Barra superior: à esquerda, a capa e o nome da jornada. À direita, quem mais está no livro e se ele foi salvo, o formato da página, desfazer, refazer e colar, Layout automático, o assistente, a ajuda, Exportar e o botão que fecha o Studio.',
  'help.ctx.journey-studio.bullet.2':
    'Coluna à esquerda: Páginas, Conteúdo (as fotos e os registros da jornada), Layouts, Elementos (texto, formas, linhas, molduras, ícones e adesivos), Viagem (números, mapas, países e marcas criados a partir da jornada) e, separados logo abaixo, Tema e Camadas.',
  'help.ctx.journey-studio.bullet.3':
    'Bancada: a página dupla atual com sangria e margens de segurança, e abaixo dela a barra de zoom com Ajustar à tela, Visão do livro e Baixar esta página dupla.',
  'help.ctx.journey-studio.bullet.4':
    'Propriedades, à direita: tudo sobre o elemento selecionado, de posição, tamanho e recorte a cores, efeitos, ordem de sobreposição e bloqueio. Quando nada está selecionado, mostra o fundo da página, o tema, os números de página e o documento.',
  'help.ctx.journey-studio.bullet.5':
    'O livro é montado como um livro impresso: capa, uma primeira página isolada diante do verso em branco da capa, as páginas duplas, uma última página isolada e a contracapa. Os números de página contam a partir da primeira página e são impressos como aparecem.',
  'help.ctx.journey-studio.bullet.6':
    'Várias pessoas podem montar o livro ao mesmo tempo: cada uma vê os cursores das outras, com os nomes. Se você salvar uma versão que outra pessoa alterou, o TREK mostra um conflito em vez de sobrescrever o trabalho dela.',
  'help.ctx.journey-studio.bullet.7':
    'Tema: um visual para o livro inteiro, com seu papel, sua tinta e três cores de destaque, suas fontes e seus motivos. Os elementos vinculados ao tema o acompanham quando você o troca.',
  'help.ctx.journey-studio.bullet.8':
    'Assistente: onde um administrador configurou a IA, o balão de fala na barra superior abre um assistente que monta páginas, escreve legendas e muda o estilo do livro com você. Cada alteração dele é um passo de desfazer.',
  // studio-auto-layout
  'help.guide.studio-auto-layout.title': 'Montar o livro automaticamente',
  'help.guide.studio-auto-layout.goal':
    'Gere com um clique um primeiro rascunho completo a partir dos registros e das fotos do diário.',
  'help.guide.studio-auto-layout.step.1': 'Clique em “Auto layout” na barra superior.',
  'help.guide.studio-auto-layout.step.2':
    'Escolha “O livro inteiro”: todas as páginas são substituídas, mas seu título e a configuração de página continuam. “Esta página” refaz só a página dupla que está na tela. Essa opção só aparece em páginas duplas criadas a partir de uma entrada.',
  'help.guide.studio-auto-layout.step.3':
    'Confira as páginas na coluna de páginas. Se você preferia a versão anterior, “Desfazer” reverte o layout inteiro.',
  'help.guide.studio-auto-layout.result':
    'Uma página dupla por entrada, na ordem, com as fotos, o título e o texto já posicionados. Cada elemento continua ligado à entrada e é atualizado com ela até você editá-lo.',
  'help.guide.studio-auto-layout.tip.1':
    'As duas opções são passos normais de desfazer, então você pode testá-las e desfazê-las.',
  'help.guide.studio-auto-layout.tip.2':
    'Quando o layout automático liga um elemento a uma entrada, o elemento é atualizado quando você edita essa entrada. Quando você muda o elemento em Propriedades, o vínculo é desfeito.',
  // studio-pages
  'help.guide.studio-pages.title': 'Adicionar, mover e remover páginas duplas',
  'help.guide.studio-pages.goal': 'Edite o livro página por página.',
  'help.guide.studio-pages.step.1':
    'Abra Páginas na coluna. As miniaturas mostram o livro em ordem: capa, primeira página, páginas duplas, última página e contracapa. A primeira e a última página aparecem ao lado do verso em branco da capa, como o livro encadernado se abre.',
  'help.guide.studio-pages.step.2':
    '“Adicionar página”, na parte de baixo, adiciona uma nova página dupla antes da última página. O + entre duas miniaturas insere uma nessa posição.',
  'help.guide.studio-pages.step.3':
    'Passe o mouse sobre uma miniatura para ver as ações: “Mover para antes”, “Mover para depois”, “Duplicar página” e “Excluir página”. Clique em uma miniatura para abrir essa página dupla na bancada.',
  'help.guide.studio-pages.result':
    'A capa, a primeira e a última página e a contracapa ficam no lugar. Novas páginas duplas sempre entram entre elas.',
  'help.guide.studio-pages.tip.1':
    'A visão de livro, na barra superior, mostra o livro inteiro em folhas, do jeito que ele será encadernado.',
  'help.guide.studio-pages.tip.2':
    'Os números de página são ativados em Documento, em Propriedades, sem nada selecionado.',
  // studio-layouts
  'help.guide.studio-layouts.title': 'Aplicar um layout a uma página dupla',
  'help.guide.studio-layouts.goal': 'Aplique a uma página dupla uma disposição pronta de molduras de foto e texto.',
  'help.guide.studio-layouts.step.1':
    'Abra Layouts na coluna. Primeiro vêm as páginas desenhadas: capas e páginas duplas inteiras no tema do livro, que os botões de estilo reduzem a um só visual. Minhas disposições e Prontas vêm depois delas, na mesma grade.',
  'help.guide.studio-layouts.step.2':
    'Clique em um. A página dupla na bancada recebe as molduras desse layout, e as fotos e textos que você já tinha são colocados nelas.',
  'help.guide.studio-layouts.result':
    'As molduras vazias são espaços reservados para conteúdo: arraste uma foto de Conteúdo para uma delas ou use “Adicionar a esta página”.',
  'help.guide.studio-my-layouts.title': 'Salvar uma página como disposição própria',
  'help.guide.studio-my-layouts.goal': 'Reutilize uma disposição que você criou em outras páginas do livro.',
  'help.guide.studio-my-layouts.step.1': 'Organize uma página do jeito que quiser e depois abra Layouts na coluna.',
  'help.guide.studio-my-layouts.step.2':
    'Clique em Salvar esta página como disposição em Minhas disposições. A página aparece como um cartão na lista.',
  'help.guide.studio-my-layouts.tip.1':
    'Clique na sua disposição em outra página para montá-la do mesmo jeito, com as fotos e os textos dela.',
  'help.guide.studio-my-layouts.result':
    'Suas disposições são salvas com o livro e oferecidas em páginas do mesmo tipo: as de uma capa para capas, as de uma página dupla para páginas duplas.',
  'help.guide.studio-layouts.tip.1': 'Um layout é um passo de desfazer como qualquer outro.',
  // studio-content
  'help.guide.studio-content.title': 'Colocar fotos e registros em uma página',
  'help.guide.studio-content.goal': 'Adicione as fotos e os registros da própria jornada à página dupla.',
  'help.guide.studio-content.step.1':
    'Abra “Conteúdo” na barra lateral. “Fotos” lista todas as imagens da jornada. “Entradas” lista as entradas com o texto delas.',
  'help.guide.studio-content.step.2':
    'Arraste uma foto para a página dupla ou para uma moldura vazia, ou clique em “Adicionar a esta página” abaixo dela. “Enviar fotos” adiciona imagens que ainda não estão na jornada; “Do Immich” ou “Do Synology” as escolhe de uma biblioteca conectada.',
  'help.guide.studio-content.step.3':
    'Abaixo de uma entrada, “Título”, “História” e “Lugar” colocam esse texto na página como elemento de texto. A data e as coordenadas entram como marcas, e as fotos da entrada também aparecem listadas ali.',
  'help.guide.studio-content.result':
    'Uma foto solta vira um elemento de foto. O texto continua ligado à entrada até você editá-lo.',
  'help.guide.studio-theme.title': 'Dar um tema ao livro',
  'help.guide.studio-theme.goal': 'Defina as cores e as fontes do livro inteiro de uma vez.',
  'help.guide.studio-theme.step.1':
    'Abra Tema na coluna. Cada cartão mostra um tema como uma páginazinha: seu papel, sua fonte e suas três cores de destaque.',
  'help.guide.studio-theme.step.2':
    'Clique em um tema para experimentá-lo. Abaixo dos cartões você pode mudar a paleta, escolher outras fontes e escolher motivos e decoração.',
  'help.guide.studio-theme.step.3':
    'Clique em Aplicar ao livro, ou em Aplicar a esta página para a página dupla na tela.',
  'help.guide.studio-theme.tip.1':
    'Os elementos vinculados ao tema assumem suas cores e fontes e o acompanham quando você o troca. Reestilizar também o que ainda não está vinculado vincula o resto primeiro.',
  'help.guide.studio-theme.tip.2': 'Cores das fotos cria uma paleta a partir das imagens da jornada.',
  'help.guide.studio-theme.result':
    'Todas as cores e fontes vinculadas do livro mudam ao mesmo tempo, e aplicar o tema é um único passo de desfazer.',
  'help.guide.studio-content.tip.1': 'A caixa de busca no topo de Conteúdo filtra as duas listas.',
  'help.guide.studio-content.tip.2':
    'Quando você solta um arquivo do computador na bancada, o TREK o envia e o posiciona de uma vez.',
  // studio-elements
  'help.guide.studio-elements.title': 'Adicionar textos, formas, ícones e adesivos',
  'help.guide.studio-elements.goal': 'Decore uma página dupla com mais do que fotos e histórias.',
  'help.guide.studio-elements.step.1':
    'Abra Elementos na coluna. Seis abas organizam o que você pode adicionar: Texto, Formas, Linhas, Molduras, Ícones e Adesivos.',
  'help.guide.studio-elements.step.2':
    'Clique em um estilo de texto ou em um título desenhado, uma forma, uma linha, uma moldura vazia, um ícone ou um adesivo. Cada um é colocado no meio da página dupla, e depois você pode movê-lo.',
  'help.guide.studio-elements.result':
    'Clique duas vezes em um elemento de texto para digitar nele; Propriedades reúne fonte, peso, tamanho, espaçamento e alinhamento.',
  'help.guide.studio-stickers.title': 'Decorar com adesivos',
  'help.guide.studio-stickers.goal': 'Adicione ilustrações, de monumentos e comidas a animais e setas.',
  'help.guide.studio-stickers.step.1': 'Abra Elementos na coluna e escolha Adesivos.',
  'help.guide.studio-stickers.step.2':
    'Busque uma palavra ou navegue pelas prateleiras e clique em um adesivo para colocá-lo na página dupla.',
  'help.guide.studio-stickers.tip.1':
    'Com um adesivo selecionado, Propriedades muda a cor das partes dele e o espelha.',
  'help.guide.studio-stickers.result': 'O adesivo é um desenho, então fica nítido em qualquer tamanho.',
  'help.guide.studio-elements.tip.1': 'Molduras são espaços vazios para fotos: solte uma imagem nelas depois.',
  // studio-travel
  'help.guide.studio-travel.title': 'Adicionar mapas, números, países e marcas',
  'help.guide.studio-travel.goal': 'Transforme a própria jornada em elementos desenhados na página.',
  'help.guide.studio-travel.step.1':
    'Abra Viagem na coluna. Quatro abas organizam o que você pode adicionar: Números, Mapas, Países e Marcas.',
  'help.guide.studio-travel.step.2':
    'Cada cartão mostra o elemento com os números da sua própria jornada, nas cores do tema: um resumo como pôster, bilhete, placa de estrada ou odômetro, um mapa com paradas numeradas ou recortado em um país, um país como carimbo, cartão-postal ou alfinete, uma data ou uma distância como carimbo, etiqueta ou fita.',
  'help.guide.studio-travel.step.3':
    'Clique em um cartão. O elemento é colocado no meio da página dupla, e depois você pode movê-lo e redimensioná-lo.',
  'help.guide.studio-travel.result':
    'O elemento aparece na página dupla. Propriedades muda o visual dele, e cada número, mapa e país se atualiza quando a jornada muda.',
  'help.guide.studio-text-effects.title': 'Adicionar efeitos ao texto',
  'help.guide.studio-text-effects.goal':
    'Dê a um título um contorno, uma sombra, uma curva ou letras preenchidas com um padrão.',
  'help.guide.studio-text-effects.step.1': 'Clique em um elemento de texto na página para selecioná-lo.',
  'help.guide.studio-text-effects.step.2':
    'Em Propriedades, abra Efeitos para adicionar um contorno, uma sombra ou um destaque, ou preencher as letras com um gradiente ou um padrão. Maiúsculas e posição curva a linha e a ajusta ao quadro.',
  'help.guide.studio-text-effects.tip.1':
    'Ajustar ao quadro reduz o texto até caber no quadro, então um título longo nunca transborda.',
  'help.guide.studio-text-effects.result': 'O efeito é desenhado junto com o texto, na impressão igual à tela.',
  'help.guide.studio-background.title': 'Mudar o fundo da página',
  'help.guide.studio-background.goal':
    'Pinte a página com uma cor, um gradiente ou um padrão, ou coloque uma foto por baixo.',
  'help.guide.studio-background.step.1':
    'Clique em uma parte vazia da página para que nada fique selecionado. Fundo da página fica no topo de Propriedades.',
  'help.guide.studio-background.step.2':
    'Escolha Papel, Sólido, Gradiente ou Padrão e uma cor, ou clique em uma foto em Foto como fundo.',
  'help.guide.studio-background.tip.1': 'Aplicar a todas as páginas dá a todas as páginas do livro o mesmo fundo.',
  'help.guide.studio-background.result': 'O fundo avança sobre a sangria, então é impresso até a borda da página.',
  'help.guide.studio-layers.title': 'Organizar, ocultar e bloquear com camadas',
  'help.guide.studio-layers.goal':
    'Veja tudo o que está na página dupla na ordem de sobreposição e trabalhe nisso ali mesmo.',
  'help.guide.studio-layers.step.1': 'Abra Camadas na coluna. O topo da lista é a frente da página.',
  'help.guide.studio-layers.step.2':
    'Arraste uma linha para reordená-la, use o olho para ocultar um elemento e o cadeado para mantê-lo no lugar. Selecione vários e agrupe-os para movê-los juntos.',
  'help.guide.studio-layers.tip.1': 'Clique duas vezes em uma linha para dar ao elemento um nome próprio.',
  'help.guide.studio-layers.tip.2': 'Os elementos ocultos ficam de fora do PDF.',
  'help.guide.studio-layers.result':
    'Páginas cheias continuam fáceis de editar, e as partes já prontas não se mexem por acidente.',
  'help.guide.studio-travel.tip.1':
    'Em Mapas, Paradas lista todas as paradas do trajeto. Desative uma para deixá-la de fora dos mapas e dos números, o aeroporto de casa, por exemplo.',
  'help.guide.studio-travel.tip.2':
    'Um mapa de país mostra só as paradas daquele país, então o país preenche a página mesmo quando a jornada começou com um voo longo.',
  // studio-properties
  'help.guide.studio-properties.title': 'Editar o que você selecionou',
  'help.guide.studio-properties.goal': 'Mova, recorte, estilize e empilhe um elemento pelo inspetor.',
  'help.guide.studio-properties.step.1':
    'Clique em um elemento da página dupla. Aparecem alças de tamanho e rotação. Arraste o elemento para movê-lo.',
  'help.guide.studio-properties.step.2':
    '“Properties”, à direita, mostra as configurações do item selecionado: posição e tamanho, “Crop” com o ponto focal que define o que fica no quadro, “Fill” ou “Fit”, os filtros de “Look”, “Corner radius”, “Frame style”, a ordem de empilhamento e “Lock”.',
  'help.guide.studio-properties.step.3':
    '“Duplicar” e “Excluir” ficam no topo do inspetor. “Desfazer”, na barra superior, reverte qualquer uma dessas alterações.',
  'help.guide.studio-properties.result':
    'Um elemento travado não pode ser selecionado nem movido na página. Isso protege um layout pronto enquanto você trabalha nos outros elementos.',
  'help.guide.studio-properties.tip.1': 'Shift+clique seleciona vários elementos; o inspetor então edita todos juntos.',
  'help.guide.studio-properties.tip.2':
    'Se você editar um elemento posicionado pelo layout automático, ele deixa de estar ligado à entrada e não acompanha mais as mudanças nela.',
  // studio-format
  'help.guide.studio-format.title': 'Escolher o formato da página',
  'help.guide.studio-format.goal': 'Defina o tamanho de impressão do livro antes de montar o layout.',
  'help.guide.studio-format.step.1':
    'Clique no formato da página na barra superior, ao lado das ferramentas de edição. Ele mostra o nome e a forma do formato.',
  'help.guide.studio-format.step.2':
    'Escolha “Square 21 × 21 cm”, “Square 30 × 30 cm”, A4 ou A5 em paisagem ou retrato, ou informe largura e altura personalizadas em milímetros. Sangria e margem de segurança ficam logo abaixo.',
  'help.guide.studio-format.result':
    'Todas as páginas duplas são desenhadas nesse tamanho, com 3 mm de sangria e 5 mm de margem de segurança por padrão.',
  'help.guide.studio-format.tip.1':
    'Mude o formato primeiro e só depois rode o layout automático. Ele usa o formato que estiver definido no momento em que roda.',
  'help.guide.studio-format.tip.2':
    'Pergunte à gráfica os valores de sangria e de margem de segurança e informe esses.',
  // studio-export
  'help.guide.studio-export.title': 'Exportar o livro como PDF',
  'help.guide.studio-export.goal': 'Gere um arquivo pronto para impressão ou um para ler na tela.',
  'help.guide.studio-export.step.1': 'Clique em “Exportar” na barra superior.',
  'help.guide.studio-export.step.2':
    'Escolha “Páginas avulsas”, uma página por folha em ordem de leitura, que é o que a gráfica precisa, ou “Páginas duplas”, duas páginas por vez, como o livro abre. “Marcas de corte” acrescenta a sangria em todas as bordas e mostra onde cortar.',
  'help.guide.studio-export.step.3':
    'Clique em “Visualizar impressão”. O navegador abre as páginas. Escolha “Salvar como PDF” para gerar o arquivo.',
  'help.guide.studio-export.result':
    'Um PDF com o número de folhas que a janela anunciou, no formato de página que você definiu.',
  'help.guide.studio-export.tip.1': 'O PDF só pode ser gerado no computador, assim como o próprio Studio.',
  'help.guide.studio-export.tip.2':
    'Para uma prova, exporte “Páginas duplas” sem marcas de corte; para a gráfica, “Páginas avulsas” com as marcas.',
  // studio-spread-file
  'help.guide.studio-spread-file.title': 'Reutilizar uma página dupla em outro livro',
  'help.guide.studio-spread-file.goal': 'Copie um design de que você gosta do livro de uma jornada para o de outra.',
  'help.guide.studio-spread-file.step.1':
    'Com a página dupla na bancada, clique em “Baixar esta página dupla” na ponta direita da barra de zoom. O arquivo contém o design, não as fotos.',
  'help.guide.studio-spread-file.step.2':
    'No outro livro, abra “Páginas”, clique em “Importar” ao lado de “Adicionar página” e escolha o arquivo.',
  'help.guide.studio-spread-file.result':
    'A página dupla é importada com as molduras e os estilos de texto. Solte nas molduras as fotos da nova jornada.',
  'help.guide.studio-spread-file.tip.1':
    'Se um arquivo não for um design de página dupla, o TREK o recusa e mostra o motivo.',

  // ── Screen: settings (all tabs) ───────────────────────────────────────────────────────
  'help.ctx.settings.title': 'Configurações',
  'help.ctx.settings.summary':
    'Suas configurações pessoais, com uma aba por assunto na barra lateral à esquerda. A maioria dos interruptores vale assim que você os muda. Um formulário com botão Salvar só salva quando você clica em Salvar. Nada aqui muda o TREK para outras pessoas.',
  'help.ctx.settings.bullet.1':
    'Barra lateral à esquerda: Exibição, Aparência, Mapa, Notificações, Integrações, Offline e Conta. Plugins aparece quando há um plugin ativo. Sobre aparece, a menos que o operador o tenha ocultado. A versão aparece no fim.',
  'help.ctx.settings.bullet.2':
    'Exibição abre primeiro. Ela reúne o idioma, o idioma dos nomes de lugares, as unidades, o formato de hora, o início da semana e a moeda de exibição, além do comportamento do mapa da viagem. Aparência reúne tema, cores, legibilidade, tamanho do texto e os widgets do painel.',
  'help.ctx.settings.bullet.3':
    'Mapa define o motor de mapa e o estilo; Notificações define quais eventos vão para qual canal; Integrações conecta bibliotecas de fotos, AirTrail, Dawarich e wanderer, e reúne as chaves de API e o MCP; Offline define o que este dispositivo armazena.',
  'help.ctx.settings.bullet.4':
    'Em “Conta” ficam o seu perfil, a senha, a autenticação em dois fatores, as passkeys e a opção de excluir a conta.',
  'help.ctx.settings-display.title': 'Exibição',
  'help.ctx.settings-display.summary':
    'Com que tela o TREK abre, o idioma e as unidades que ele usa e como o mapa da viagem e as reservas se comportam. Toda alteração vale na hora.',
  'help.ctx.settings-display.bullet.1':
    'Inicialização: “Página inicial” abre no Painel ou na “Viagem ativa”; com “Viagem ativa”, “Aba inicial” escolhe em que aba essa viagem abre.',
  'help.ctx.settings-display.bullet.2':
    'Idioma e região: “Moeda de exibição” (ou “Moeda da viagem” para não converter), Idioma, “Nomes de lugares”, “Unidade de temperatura”, “Unidade de distância”, “Formato de hora” e “Semana começa em”.',
  'help.ctx.settings-display.bullet.3':
    'Viagem e mapa: “Abrir lugares em”, “Data primeiro nos títulos dos dias”, “Rótulos das rotas de reservas”, “Sempre mostrar rotas de reserva”, “Marcadores compactos para lugares não planejados”, “Explorar lugares no mapa”, “Ocultar códigos de reserva” e “Otimizar rota a partir da hospedagem”.',
  'help.ctx.settings-appearance.title': 'Aparência',
  'help.ctx.settings-appearance.summary':
    'A aparência do TREK nesta conta: claro ou escuro, a cor de destaque, vidro e animações, tamanho do texto e quais widgets o painel mostra. Tudo é aplicado na hora, em todos os dispositivos em que você fizer login.',
  'help.ctx.settings-appearance.bullet.1':
    'Tema: “Tema de cores” (Claro, Escuro ou Automático), o esquema de cores e, com Personalizado, sua própria cor de destaque para os modos claro e escuro, com verificação de contraste.',
  'help.ctx.settings-appearance.bullet.2':
    'Legibilidade, marcada como Experimental: Transparência, “Reduzir movimento”, Densidade e “Tamanho do texto”, com um controle para Tudo e um para cada tamanho: Grande, Médio, Normal e Pequeno.',
  'help.ctx.settings-appearance.bullet.3':
    'Widgets do painel: interruptores separados para computador (“Abaixo do destaque”, “Barra lateral direita”) e celular (“Abaixo do destaque”, “No fim da página”).',
  'help.ctx.settings-appearance.bullet.4':
    '“Restaurar padrões”, abaixo dos cartões, volta a aba inteira aos valores padrão.',
  'help.ctx.settings-map.title': 'Mapa',
  'help.ctx.settings-map.summary':
    'Qual motor desenha os mapas do planejador e do diário, e com que estilo. Leaflet é o mapa raster clássico; Mapbox GL acrescenta prédios e relevo em 3D com o seu próprio token; MapLibre GL desenha os blocos vetoriais do OpenFreeMap sem token. O Atlas sempre usa Leaflet.',
  'help.ctx.settings-map.bullet.1':
    '“Provedor de mapa”: Leaflet, Mapbox GL (Experimental) ou MapLibre GL, cada opção com uma breve descrição.',
  'help.ctx.settings-map.bullet.2':
    '“Modelo de mapa” e “Chave de API do CARTO” para o Leaflet; “Estilo do mapa” para os dois motores GL, além do “Token de acesso Mapbox” para o Mapbox GL.',
  'help.ctx.settings-map.bullet.3':
    'Só no Mapbox GL: “Prédios 3D & terreno” e “Modo alta qualidade”. Uma prévia ao vivo aparece acima de “Salvar mapa”. “Salvar mapa” salva a sua escolha.',
  'help.ctx.settings-notifications.title': 'Notificações',
  'help.ctx.settings-notifications.summary':
    'Como o TREK entra em contato com você fora do app. No topo, uma tabela com uma linha por evento e uma coluna por canal define o que é enviado para onde. Abaixo dela ficam os cartões do webhook, do ntfy, do push neste dispositivo e de eventuais canais de plugins.',
  'help.ctx.settings-notifications.bullet.1':
    'Notificações: ative ou desative cada evento por canal. Um cadeado indica que o administrador desativou aquele evento para todos.',
  'help.ctx.settings-notifications.bullet.2':
    '“URL do webhook”: um webhook do Discord, do Slack ou personalizado, com Testar e Salvar.',
  'help.ctx.settings-notifications.bullet.3':
    'Ntfy: “Tópico Ntfy” e, opcionalmente, “URL do servidor Ntfy” e token de acesso, com Testar e Salvar.',
  'help.ctx.settings-notifications.bullet.4':
    '“Notificações push neste dispositivo”: “Ativar neste dispositivo” vale só para este navegador; “Enviar teste” envia uma notificação de teste. Um canal de plugin mostra Configurar até ser configurado.',
  'help.ctx.settings-integrations.title': 'Integrações',
  'help.ctx.settings-integrations.summary':
    'Tudo o que se conecta ao TREK de fora: bibliotecas de fotos para o diário, AirTrail para voos, Dawarich para registrar por onde você realmente passou, wanderer para trilhas, chaves de API somente leitura para outros programas e MCP para clientes de IA. A conexão com outro serviço só aparece depois que o administrador a ativa.',
  'help.ctx.settings-integrations.bullet.1':
    'Immich e Synology Photos, AirTrail, Dawarich e wanderer: cada cartão tem o endereço e a chave, Salvar e “Testar conexão”, e um selo Conectado ou “Não conectado”.',
  'help.ctx.settings-integrations.bullet.2':
    'Chaves de API: chaves somente leitura para a API pública, cada uma limitada às áreas que você escolher, com o Endpoint para copiar.',
  'help.ctx.settings-integrations.bullet.3':
    '“Configuração MCP”: o “Endpoint MCP” e, em “Clientes OAuth 2.1”, os seus clientes registrados, a “Configuração do cliente” para copiar e as “Sessões OAuth ativas”, com Revogar.',
  'help.ctx.settings-integrations.bullet.4':
    'Tokens de API: a forma antiga de se conectar ao MCP, marcada como Obsoleto; use “Clientes OAuth 2.1” no lugar.',
  'help.ctx.settings-offline.title': 'Offline', // same-as-en
  'help.ctx.settings-offline.summary':
    'O que o TREK guarda neste dispositivo para que uma viagem abra mesmo sem conexão, e o que acontece quando uma alteração feita offline entra em conflito com uma alteração feita em outro lugar.',
  'help.ctx.settings-offline.bullet.1':
    'Modo offline: “Forçar modo offline” baixa tudo antes, depois passa a funcionar só com o cache e coloca suas alterações na fila.',
  'help.ctx.settings-offline.bullet.2':
    '“Preparar para uso offline”: “Baixar para uso offline” baixa os dados das viagens, os documentos e os blocos do mapa; “Sincronizar agora” sincroniza de novo manualmente.',
  'help.ctx.settings-offline.bullet.3':
    '“O que armazenar offline”: “Armazenar blocos do mapa offline” e um interruptor por viagem. Uma viagem já concluída só é armazenada se você a ativar.',
  'help.ctx.settings-offline.bullet.4':
    '“Conflitos de sincronização” só aparece quando duas alterações entram em conflito, com “A minha”, “Manter a do servidor” e “Quando ocorrer um conflito”. “Cache offline” mostra o número de viagens e de alterações pendentes ou com falha, com “Tentar novamente”, Descartar e “Limpar cache”.',
  'help.ctx.settings-account.title': 'Conta',
  'help.ctx.settings-account.summary':
    'Sua conta neste TREK e a forma como você entra: foto de perfil, nome de usuário e e-mail, senha, autenticação em dois fatores e passkeys. “Excluir conta” fica no rodapé do cartão Conta.',
  'help.ctx.settings-account.bullet.1':
    'Conta: clique na câmera sobre a imagem para enviar uma foto e na lixeira vermelha para removê-la. “Nome de usuário” e E-mail são salvos com “Salvar perfil”.',
  'help.ctx.settings-account.bullet.2':
    '“Alterar senha”: a senha atual, a nova duas vezes, com as regras sendo marcadas enquanto você digita, e depois “Atualizar senha”. Quando este TREK só permite entrar por SSO, esse cartão não aparece.',
  'help.ctx.settings-account.bullet.3':
    'Autenticação em duas etapas (2FA) com app autenticador e códigos de backup; passkeys para entrar sem senha.',
  'help.ctx.settings-account.bullet.4':
    '“Excluir conta” fica à esquerda, no rodapé do cartão Conta, e pede confirmação. O único administrador não pode excluir a si mesmo.',
  // language-region
  'help.guide.language-region.title': 'Definir idioma, unidades e moeda',
  'help.guide.language-region.goal': 'Use o TREK no seu idioma e com os formatos da sua região.',
  'help.guide.language-region.step.1':
    'Em Idioma e região, escolha um Idioma na fileira de chips. O TREK muda na hora, em todos os dispositivos em que você entra.',
  'help.guide.language-region.step.2':
    '“Nomes de lugares” define o idioma da busca de lugares, das sugestões e dos endereços; “Igual ao app” segue o idioma da interface.',
  'help.guide.language-region.result':
    'Datas, distâncias e valores aparecem no formato que você espera. Em Custos, os valores são mostrados na sua moeda de exibição apenas para visualização; os valores lançados não mudam.',
  'help.guide.language-region.tip.1': '“Moeda da viagem” mostra cada viagem na própria moeda, sem conversão.',
  'help.guide.language-region.tip.2': 'O idioma também define os nomes dos dias e dos meses em Férias e no diário.',
  // travel-map-prefs
  'help.guide.travel-map-prefs.title': 'Ajustar o mapa da viagem e os títulos dos dias',
  'help.guide.travel-map-prefs.goal':
    'Escolha o que o mapa da viagem mostra e como ficam os cabeçalhos dos dias, em todas as viagens.',
  'help.guide.travel-map-prefs.step.1':
    'Em Viagem e mapa, “Abrir lugares em” define qual app de mapas o botão de navegação abre direto; “Perguntar sempre” deixa você escolher o app a cada vez. “Data primeiro nos títulos dos dias” mostra a data do calendário primeiro no título de cada dia.',
  'help.guide.travel-map-prefs.step.2':
    '“Sempre mostrar rotas de reserva” desenha no mapa todos os voos, trens e outras reservas; “Rótulos das rotas de reservas” coloca o nome da estação ou do aeroporto em cada ponta. “Marcadores compactos para lugares não planejados” reduz os lugares que ainda não estão em nenhum dia, para que as paradas planejadas fiquem mais fáceis de ver.',
  'help.guide.travel-map-prefs.result':
    'O mapa usa essas configurações em todas as viagens, até você mudá-las de novo.',
  'help.guide.travel-map-prefs.tip.1':
    'Essas preferências valem por conta, não por viagem. Cada membro de uma viagem compartilhada vê as próprias escolhas.',
  'help.guide.travel-map-prefs.tip.2':
    'Um administrador pode definir os padrões para todos; o que você muda aqui vale só para você.',
  // startup
  'help.guide.startup.title': 'Escolher com que tela o TREK abre',
  'help.guide.startup.goal': 'Faça o TREK abrir na página que você mais usa, e não sempre no painel.',
  'help.guide.startup.step.1':
    'No topo de Exibição, em Inicialização, defina “Página inicial” como Painel ou “Viagem ativa”.',
  'help.guide.startup.step.2': 'Com “Viagem ativa”, aparece “Aba inicial”: escolha em que aba essa viagem abre.',
  'help.guide.startup.result': 'Na próxima vez que você abrir o TREK, ele já abre nessa página.',
  'help.guide.startup.tip.1':
    '“Viagem ativa” é a viagem em andamento hoje ou a próxima que vem por aí. É a mesma viagem que o painel mostra em destaque no topo.',
  // theme-scheme
  'help.guide.theme-scheme.title': 'Definir o tema e a cor de destaque',
  'help.guide.theme-scheme.goal':
    'Deixe o TREK claro, escuro ou acompanhando o seu dispositivo, na cor que você preferir.',
  'help.guide.theme-scheme.step.1':
    'Em Tema, defina “Tema de cores” como Claro, Escuro ou Automático. Automático acompanha o seu dispositivo.',
  'help.guide.theme-scheme.step.2':
    'Escolha um esquema de cores: Padrão, Alto contraste, Índigo, Verde-azulado, Rosa, Âmbar, Violeta ou Personalizado.',
  'help.guide.theme-scheme.step.3':
    'Com Personalizado, escolha um dos pontos de cor ou defina sua própria cor de destaque, separadamente para Claro e Escuro. A pílula ao lado indica se o contraste é bom ou baixo.',
  'help.guide.theme-scheme.result':
    'Botões, links e destaques usam a cor de destaque em todo o app, em todos os dispositivos em que você entrar.',
  'help.guide.theme-scheme.tip.1':
    'A barra de navegação também tem uma chave rápida de claro ou escuro; ela define o mesmo tema.',
  'help.guide.theme-scheme.tip.2': 'Se o esquema padrão estiver difícil de ler, escolha “High contrast”.',
  // readability
  'help.guide.readability.title': 'Ajustar a legibilidade e o tamanho do texto',
  'help.guide.readability.goal': 'Use menos efeito de vidro e animação, mais espaço ou texto maior.',
  'help.guide.readability.step.1':
    'Em Legibilidade, Transparência troca os painéis de vidro por superfícies sólidas, “Reduzir movimento” reduz as animações ao mínimo, e Densidade escolhe entre Confortável e Compacta.',
  'help.guide.readability.step.2':
    '“Tamanho do texto”: arraste Tudo para ajustar todo o texto de uma vez, ou defina Grande, Médio, Normal e Pequeno um a um. Cada tamanho mostra um exemplo, então você vê o resultado enquanto arrasta.',
  'help.guide.readability.result':
    'A mudança vale para o app inteiro de uma vez, inclusive os painéis do mapa e o diário.',
  'help.guide.readability.tip.1':
    'Algumas partes do TREK já reduzem as animações quando o seu dispositivo está configurado para reduzir movimento. “Reduzir movimento” diminui as animações nas outras partes.',
  'help.guide.readability.tip.2':
    'O tamanho do texto é aplicado pelos níveis tipográficos, então nada fica cortado. Se um tamanho não couber mais, o texto quebra a linha.',
  // dashboard-widgets
  'help.guide.dashboard-widgets.title': 'Escolher os widgets do painel',
  'help.guide.dashboard-widgets.goal': 'Mostre só os widgets que você usa, separadamente no computador e no celular.',
  'help.guide.dashboard-widgets.step.1':
    'Em “Widgets do painel”, a parte de computador lista os widgets “Abaixo do destaque” e a “Barra lateral direita”. Desativar a “Barra lateral direita” oculta a coluna inteira e centraliza o painel; os widgets dela ficam esmaecidos até você reativá-la.',
  'help.guide.dashboard-widgets.step.2':
    'O celular tem interruptores próprios, “Abaixo do destaque” e “No fim da página”, para o painel no seu telefone.',
  'help.guide.dashboard-widgets.result':
    'O painel muda na hora. Se a barra lateral direita estiver desligada, o painel fica centralizado.',
  'help.guide.dashboard-widgets.tip.1':
    'Os widgets de um complemento só aparecem enquanto o administrador mantiver esse complemento ativado.',
  'help.guide.dashboard-widgets.tip.2':
    'O próprio painel lembra a visualização em grade ou lista e a ordenação em cada dispositivo.',
  // map-provider
  'help.guide.map-provider.title': 'Escolher o motor e o estilo do mapa',
  'help.guide.map-provider.goal': 'Alterne entre o mapa clássico, os mapas vetoriais e o mapa 3D do Mapbox.',
  'help.guide.map-provider.step.1':
    'Em “Provedor de mapa”, escolha Leaflet para o mapa 2D clássico com qualquer bloco raster, Mapbox GL para blocos vetoriais com prédios e relevo em 3D, ou MapLibre GL para blocos vetoriais do OpenFreeMap sem token.',
  'help.guide.map-provider.step.2':
    'Escolha um “Modelo de mapa” para o Leaflet ou um “Estilo do mapa” para um motor GL, ou cole a sua própria URL. O Mapbox GL precisa de um “Token de acesso Mapbox”, e os modelos CARTO, de uma “Chave de API do CARTO”; o link abaixo de cada campo mostra onde conseguir.',
  'help.guide.map-provider.step.3':
    'Com o Mapbox GL, ative “Prédios 3D & terreno” e, se o seu dispositivo for rápido o bastante, “Modo alta qualidade”. Confira a prévia e clique em “Salvar mapa”.',
  'help.guide.map-provider.result':
    'Os mapas do planejador e do diário usam o motor que você escolheu. O Atlas sempre usa o Leaflet.',
  'help.guide.map-provider.tip.1': 'Sem token, o Mapbox GL usa o Leaflet em vez de mostrar um mapa vazio.',
  'help.guide.map-provider.tip.2':
    'Os blocos de mapa que você salva offline vêm do provedor que estiver ativo no momento do download.',
  // notification-channels
  'help.guide.notification-channels.title': 'Escolher onde receber notificações',
  'help.guide.notification-channels.goal':
    'Receba lembretes de viagem e avisos de colaboração no celular ou em outra ferramenta.',
  'help.guide.notification-channels.step.1':
    'Para um webhook, cole uma “URL do webhook” do Discord, do Slack ou personalizada, clique em Testar e depois em Salvar.',
  'help.guide.notification-channels.step.2':
    'Para o ntfy, preencha o “Tópico Ntfy” e, se tiver um servidor próprio, a “URL do servidor Ntfy” e um token de acesso. Testar envia uma mensagem na hora; Salvar guarda as configurações.',
  'help.guide.notification-channels.step.3':
    'No cartão Notificações, no topo, ative ou desative cada evento por canal. Um cadeado indica que o administrador desativou para todos. Um canal de plugin mostra Configurar até ser configurado; “Enviar teste” faz um teste.',
  'help.guide.notification-channels.result':
    'Os eventos são enviados pelos canais que você ativou para eles. A coluna No app define o que o sino da barra de navegação mostra.',
  'help.guide.notification-channels.tip.1':
    'O Lembrete de cada viagem, com quantos dias antes da partida, é definido no formulário de edição da viagem.',
  'help.guide.notification-channels.tip.2':
    'O administrador pode preencher um servidor ntfy padrão para todos; você continua escolhendo o seu próprio tópico.',
  // photo-providers
  'help.guide.photo-providers.title': 'Conectar uma biblioteca de fotos',
  'help.guide.photo-providers.goal': 'Deixe o diário carregar as fotos do dia do Immich ou do Synology Photos.',
  'help.guide.photo-providers.step.1':
    'Em Integrações, procure o cartão do Immich ou do Synology Photos e informe o que ele pede: a “URL do servidor” e uma “Chave de API” para o Immich, ou “Nome de usuário” e Senha para o Synology Photos. O Immich também pode copiar as fotos da jornada para a biblioteca dele quando você as envia.',
  'help.guide.photo-providers.step.2': 'Clique em “Testar conexão” e depois em Salvar. O selo muda para Conectado.',
  'help.guide.photo-providers.result':
    'A aba “External photos” do editor de registros busca na biblioteca conectada as fotos do dia do registro, começando pelas mais próximas do local.',
  'help.guide.photo-providers.tip.1':
    'A conexão vale só para a sua conta: os outros membros de uma jornada conectam as próprias bibliotecas.',
  'help.guide.photo-providers.tip.2':
    'Um provedor cujas fotos não têm dados de GPS também funciona. Nesse caso, a lista é ordenada por horário.',
  // api-keys
  'help.guide.api-keys.title': 'Criar uma chave de API',
  'help.guide.api-keys.goal': 'Permita que outros programas leiam suas viagens pela API pública.',
  'help.guide.api-keys.step.1':
    'Em “Chaves de API”, clique em “Criar chave”, dê um Nome que indique onde ela será usada e, em “O que esta chave pode ler”, deixe só as áreas de que ela precisa. Clique em Criar.',
  'help.guide.api-keys.step.2':
    'Copie a chave em “Chave de API criada”: ela só é mostrada uma vez. Clique em Concluído. O Endpoint a ser chamado aparece abaixo da lista.',
  'help.guide.api-keys.result':
    'Programas com a chave podem ler as áreas que você escolheu e nunca alteram nada. A lista mostra quando cada chave foi criada e usada pela última vez, e a lixeira a exclui.',
  'help.guide.api-keys.tip.1': 'Use uma chave por ferramenta, para poder revogar uma sem afetar as outras.',
  'help.guide.api-keys.tip.2':
    'Para deixar um cliente de IA alterar coisas, use o MCP com OAuth; as chaves de API só leem.',
  // mcp-oauth
  'help.guide.mcp-oauth.title': 'Conectar um assistente de IA pelo MCP',
  'help.guide.mcp-oauth.goal': 'Dê ao Claude, a um IDE ou a outro cliente MCP acesso às suas viagens.',
  'help.guide.mcp-oauth.step.1': 'Em “Configuração MCP”, copie o “Endpoint MCP” para o seu cliente.',
  'help.guide.mcp-oauth.step.2':
    'Em “Clientes OAuth 2.1”, clique em “Novo cliente” e escolha uma predefinição rápida, como Claude Desktop ou Cursor, ou preencha você mesmo “Nome da aplicação”, “URIs de redirecionamento” e “Escopos permitidos”; para um servidor sem navegador, escolha o cliente de máquina. Clique em “Registrar cliente” e copie o “Segredo do cliente”: ele só aparece uma vez.',
  'help.guide.mcp-oauth.step.3':
    'Cada cliente tem “Renovar segredo” e “Excluir cliente”. “Sessões OAuth ativas” lista os clientes conectados, com Revogar. “Configuração do cliente” se expande e mostra um trecho pronto para clientes que usam JSON.',
  'help.guide.mcp-oauth.result':
    'O cliente pode ver e alterar o que os escopos dele permitem, em seu nome, e cada ação aparece com o seu nome.',
  'help.guide.mcp-oauth.tip.1':
    'As permissões limitam o que um cliente pode fazer: dê a um cliente só a permissão de leitura até que ele precise de mais.',
  'help.guide.mcp-oauth.tip.2':
    'O administrador pode desativar o MCP para a instância inteira. Nesse caso, esta seção não aparece.',
  // offline-prepare
  'help.guide.offline-prepare.title': 'Usar viagens offline',
  'help.guide.offline-prepare.goal':
    'Salve suas viagens e os mapas delas neste dispositivo antes de ficar sem conexão.',
  'help.guide.offline-prepare.step.1':
    'Em “O que armazenar offline”, mantenha “Armazenar blocos do mapa offline” ativado e ative as viagens que você quer ter neste dispositivo. Uma viagem já concluída só é armazenada se você a ativar.',
  'help.guide.offline-prepare.step.2':
    'De volta ao topo, em “Preparar para uso offline”, clique em “Baixar para uso offline”. O TREK baixa os dados das viagens, os documentos e os blocos do mapa e informa quantas viagens armazenou.',
  'help.guide.offline-prepare.step.3':
    '“Forçar modo offline” baixa tudo mais uma vez e depois passa a funcionar só com o que está neste dispositivo, para você conferir se está tudo lá antes de sair.',
  'help.guide.offline-prepare.result':
    'As viagens abrem sem conexão. As alterações que você fizer ficam em uma fila e são enviadas quando você voltar a ficar online.',
  'help.guide.offline-prepare.tip.1':
    'Os blocos do mapa são o que mais ocupa espaço; desative-os para guardar só os dados das viagens e os documentos.',
  'help.guide.offline-prepare.tip.2': 'Instale o TREK como app pelo navegador para ter o melhor início offline.',
  // offline-conflicts
  'help.guide.offline-conflicts.title': 'Escolher qual versão fica em um conflito de sincronização',
  'help.guide.offline-conflicts.goal':
    'Escolha como o TREK resolve um conflito entre uma alteração feita offline e outra feita em outro lugar.',
  'help.guide.offline-conflicts.step.1':
    'Quando uma alteração que você fez offline entra em conflito com uma mais recente, “Conflitos de sincronização” aparece perto do topo de Offline. Para cada alteração, clique em “A minha” ou “Manter a do servidor”.',
  'help.guide.offline-conflicts.step.2':
    'No mesmo cartão, “Quando ocorrer um conflito” define o que acontece das próximas vezes: “Perguntar sempre”, “Sempre manter a minha versão” ou “Sempre manter a versão do servidor”.',
  'help.guide.offline-conflicts.result':
    'Com “Perguntar sempre”, o conflito fica em “Conflitos de sincronização” até você escolher. Com as outras duas opções, o TREK resolve sozinho.',
  'help.guide.offline-conflicts.tip.1': '“Limpar cache” apaga só a cópia deste dispositivo. Nada muda no servidor.',
  // profile
  'help.guide.profile.title': 'Alterar seu perfil',
  'help.guide.profile.goal': 'Atualize seu nome, seu e-mail e sua foto.',
  'help.guide.profile.step.1':
    'No cartão Conta, clique na câmera sobre a sua imagem para enviar uma foto; a lixeira vermelha a remove e volta a mostrar a sua inicial.',
  'help.guide.profile.step.2': 'Edite “Nome de usuário” e E-mail abaixo da imagem.',
  'help.guide.profile.result':
    'Seu nome e sua foto são atualizados em todos os lugares de uma vez, inclusive nas viagens que você compartilha.',
  'help.guide.profile.tip.1': 'Uma conta vinculada por SSO mostra um selo SSO e “Vinculado a”, com o provedor.',
  // password
  'help.guide.password.title': 'Alterar sua senha',
  'help.guide.password.goal': 'Defina uma nova senha.',
  'help.guide.password.step.1':
    'Em “Alterar senha”, digite a “Senha atual”, depois a “Nova senha” e repita-a em “Confirmar nova senha”. A lista abaixo marca cada regra cumprida enquanto você digita.',
  'help.guide.password.step.2': 'Clique em “Atualizar senha”.',
  'help.guide.password.result':
    'A nova senha vale na hora. Todos os outros dispositivos são desconectados, seus tokens de API do MCP são excluídos e os clientes OAuth precisam entrar de novo; este dispositivo continua conectado.',
  'help.guide.password.tip.1':
    'Quando este TREK só permite entrar por SSO, não existe senha do TREK nem o cartão “Alterar senha”.',
  // mfa
  'help.guide.mfa.title': 'Ativar a autenticação em dois fatores',
  'help.guide.mfa.goal': 'Proteja a conta com um código de um app autenticador.',
  'help.guide.mfa.step.1': 'Em “Autenticação em duas etapas (2FA)”, clique em “Configurar autenticador”.',
  'help.guide.mfa.step.2':
    'Escaneie o QR code com o seu app ou digite o segredo manualmente, depois digite o código de seis dígitos que o app mostra e clique em “Ativar 2FA”.',
  'help.guide.mfa.step.3':
    'Guarde os códigos de backup com “Copiar códigos”, “Baixar TXT” ou “Imprimir / PDF” e clique em OK. Cada código só funciona uma vez. Use um código quando estiver sem o celular.',
  'help.guide.mfa.result': 'Todo login passa a pedir um código depois da senha.',
  'help.guide.mfa.tip.1': '“Desativar 2FA” pede a sua senha e um código atual ou um código de backup ainda não usado.',
  'help.guide.mfa.tip.2': 'O administrador pode exigir 2FA para todos. Nesse caso, não dá para desativar aqui.',
  // passkeys
  'help.guide.passkeys.title': 'Entrar com uma passkey',
  'help.guide.passkeys.goal': 'Use a digital, o reconhecimento facial ou o PIN do seu dispositivo em vez de senha.',
  'help.guide.passkeys.step.1':
    'Em Passkeys, clique em “Adicionar uma passkey”, confirme sua senha atual e dê um nome que indique de qual dispositivo ela é; depois, siga as instruções do dispositivo.',
  'help.guide.passkeys.step.2':
    'Cada passkey mostra se está Sincronizado ou presa a “Este aparelho” e quando foi usada pela última vez. Renomear muda o nome, e o botão de excluir a remove depois que você digita sua senha.',
  'help.guide.passkeys.result': 'A página de login oferece a passkey. Você continua podendo entrar com sua senha.',
  'help.guide.passkeys.tip.1':
    'Uma passkey fica guardada no dispositivo ou no gerenciador de senhas dele, então adicione uma passkey para cada dispositivo.',
  'help.guide.passkeys.tip.2':
    'As passkeys só aparecem depois que o administrador as ativa. Enquanto o servidor não tiver o domínio WebAuthn, o cartão avisa isso em vez de oferecer “Adicionar uma passkey”.',
  // delete-account
  'help.guide.delete-account.title': 'Excluir sua conta',
  'help.guide.delete-account.goal': 'Remova sua conta e os dados que são só seus.',
  'help.guide.delete-account.step.1':
    'No cartão Conta, clique em “Excluir conta”, à esquerda do rodapé, e depois em “Excluir permanentemente”.',
  'help.guide.delete-account.result':
    'Sua conta é excluída, junto com as viagens, os lugares e os arquivos que são seus. As viagens de outras pessoas continuam.',
  'help.guide.delete-account.tip.1':
    'Se você for o único administrador, o TREK mostra “Exclusão não permitida”: promova outro usuário a administrador antes.',
  'help.guide.delete-account.tip.2': 'Não dá para desfazer. Exporte o que quiser guardar antes de confirmar.',

  // ── Screen: admin (all tabs) ──────────────────────────────────────────────────────────
  'help.ctx.admin.title': 'Administrador',
  'help.ctx.admin.summary':
    'Configurações da instância inteira do TREK, para todos os usuários: quem pode entrar e como, o que está ativado, onde os arquivos ficam guardados, como o servidor entra em contato com as pessoas e como é feito o backup. Só administradores veem esta página. A barra lateral agrupa as abas em Usuários, Configuração, Integrações e Manutenção, e cada aba é uma tela própria.',
  'help.ctx.admin.bullet.1':
    'O cabeçalho mostra, à direita, o número de usuários, viagens, lugares e arquivos. Logo abaixo, aparece o banner “Atualização disponível” quando sai uma versão mais nova do TREK.',
  'help.ctx.admin.bullet.2':
    'Usuários e “Padrões do usuário”: contas, links de convite e permissões, e as configurações e o mapa com que uma conta nova começa.',
  'help.ctx.admin.bullet.3':
    'Personalização, Configurações, Complementos, Plugins e Armazenamento: modelos de mala, categorias e férias escolares; login, passkeys, 2FA, chaves de API e provedores de busca; os módulos de recursos; plugins de terceiros; e para onde vão os envios.',
  'help.ctx.admin.bullet.4':
    'Notificações, “Acesso MCP” e GitHub: os canais que os usuários podem escolher e os padrões com que começam, os tokens e as sessões dos clientes de IA, e o histórico de versões.',
  'help.ctx.admin.bullet.5':
    'Backup e Auditoria: backups sob demanda e agendados, e o registro dos eventos relevantes para a segurança.',
  'help.ctx.admin-users.title': 'Usuários',
  'help.ctx.admin-users.summary':
    'Todas as contas deste TREK, com função, e-mail e última atividade, os links de convite que permitem o cadastro em uma instância fechada, e quem pode fazer o quê nas viagens.',
  'help.ctx.admin-users.bullet.1':
    'A tabela: usuário, e-mail, função, criação e “Última atividade”, com “Editar usuário” e “Excluir usuário” em cada linha. Um ponto verde no avatar indica que a pessoa está online agora; a sua própria linha mostra (Você).',
  'help.ctx.admin-users.bullet.2':
    '“Criar usuário”, no canto superior direito do cartão Usuários, cria uma conta manualmente com uma senha que você passa para o usuário.',
  'help.ctx.admin-users.bullet.3':
    '“Links de convite”, logo abaixo: links de cadastro com limite de usos, prazo de validade e, se quiser, uma viagem em que o novo usuário entra ao se cadastrar.',
  'help.ctx.admin-users.bullet.4':
    '“Configurações de Permissões”, no fim: para cada ação, quem pode realizá-la (Todos, “Membros da viagem”, “Dono da viagem” ou “Apenas administrador”). Clique em Salvar no topo do cartão para salvar.',
  'help.ctx.admin-defaults.title': 'Padrões do usuário',
  'help.ctx.admin-defaults.summary':
    'Com o que uma conta nova já começa, para ninguém precisar configurar antes: tema de cores, unidades, formato de hora, início da semana, moeda de exibição e códigos de reserva ocultos, além do mapa, das chaves dele e dos servidores de rotas.',
  'help.ctx.admin-defaults.bullet.1':
    '“Configurações padrão do usuário”, à esquerda: “Tema de cores”, “Unidade de temperatura”, “Unidade de distância”, “Formato de hora”, “Semana começa em”, “Moeda de exibição” e “Ocultar códigos de reserva”.',
  'help.ctx.admin-defaults.bullet.2':
    'Mapa, à direita: “Modelo de mapa”, “Chave CARTO compartilhada”, “Servidor de rotas próprio” e “Instância Valhalla própria”, uma pré-visualização e depois “Motor de mapas”, com “Estilo do mapa”, “Token compartilhado do Mapbox”, “Edifícios & relevo em 3D” e “Modo de alta qualidade”.',
  'help.ctx.admin-config.title': 'Personalização',
  'help.ctx.admin-config.summary':
    'Configurações compartilhadas por todas as viagens da instância: modelos de mala, o conjunto de categorias de lugares e coleções e o catálogo de férias escolares usado pelo Férias.',
  'help.ctx.admin-config.bullet.1':
    'Modelos de mala: listas com nome, com categorias e itens, que servem de ponto de partida para a lista de bagagem de uma viagem.',
  'help.ctx.admin-config.bullet.2':
    'Categorias: nome, ícone e cor das categorias usadas em todo o TREK, dos detalhes dos lugares às Coleções, cada uma editada em uma janela com pré-visualização.',
  'help.ctx.admin-config.bullet.3':
    'Férias escolares: o catálogo de países e regiões com seus períodos de férias, que todos podem escolher em Férias.',
  'help.ctx.admin-settings.title': 'Configurações',
  'help.ctx.admin-settings.summary':
    'Como as pessoas entram e quais serviços externos o servidor pode usar. À esquerda: Métodos de autenticação, “Login com passkey”, “Exigir autenticação em dois fatores (2FA)” e “Login Único (OIDC)”. À direita: “Tipos de arquivo permitidos” e “Chaves de API”, com os provedores de busca e de transporte público. A “Zona de perigo” fica no fim.',
  'help.ctx.admin-settings.bullet.1':
    'Métodos de autenticação: login com senha, cadastro com senha e, depois de configurar o OIDC, login por SSO e provisionamento automático por SSO. “Exigir autenticação em dois fatores (2FA)” tem um cartão próprio.',
  'help.ctx.admin-settings.bullet.2':
    '“Login com passkey”: “Ativar login com passkey”, o “Relying Party ID (domínio)” e as “Origens permitidas”. “Login Único (OIDC)”: “Nome exibido”, “URL do emissor”, uma URL de descoberta opcional, “ID do cliente” e “Segredo do cliente”.',
  'help.ctx.admin-settings.bullet.3':
    'Chaves de API: a TREK Places API vem primeiro e não precisa de chave. Abaixo ficam a “Chave da API Google Maps” (com Testar e “Para que a chave é usada”), a chave do Unsplash e a do Amap, e um único Salvar no fim do cartão.',
  'help.ctx.admin-settings.bullet.4':
    '“Provedor de transporte público” e “Provedor de busca de lugares” definem quem responde às buscas de transporte e de lugares; “Registo de pesquisas de locais” registra qual resultado foi escolhido; “Tipos de arquivo permitidos” limita os envios.',
  'help.ctx.admin-addons.title': 'Complementos',
  'help.ctx.admin-addons.summary':
    'Os módulos de recursos do TREK, cada um com sua chave: Bagagem, Orçamento, Documentos, Férias, Atlas, Colab, Jornada, Coleções, Viagem de carro, MCP, AirTrail, Dawarich e Análise por IA. Desligado significa que o item de navegação, as rotas e a API são removidos para todo mundo.',
  'help.ctx.admin-addons.bullet.1':
    'Um bloco por complemento, com o interruptor e, quando houver, sublinhas com as opções.',
  'help.ctx.admin-addons.bullet.2':
    'Os provedores de fotos e de documentos também aparecem aqui como blocos, para que Immich ou Synology possam ser oferecidos aos usuários.',
  'help.ctx.admin-addons.bullet.3': '“Rastreamento de malas” tem um interruptor próprio abaixo dos blocos.',
  'help.ctx.admin-plugins.title': 'Plugins', // same-as-en
  'help.ctx.admin-plugins.summary':
    'Plugins de terceiros que rodam em processo próprio ao lado do TREK, cada um com as permissões que pediu na instalação. Instale pelo catálogo, envie um pacote ou vincule uma pasta enquanto desenvolve um plugin.',
  'help.ctx.admin-plugins.bullet.1':
    'Instalado e Descobrir, com “Buscar plugins…” e os filtros Tipo, Status e Ordenar. Cada linha mostra a versão, Revisado, Assinado ou “Sem assinatura”, o que o plugin pode acessar, um interruptor e um menu ⋯.',
  'help.ctx.admin-plugins.bullet.2':
    'Os dois ícones no cabeçalho do cartão: “Enviar plugin” aceita .zip, .tgz ou .tar.gz (ou solte um .zip na página); Reescanear encontra uma pasta de plugin vinculada para desenvolvimento.',
  'help.ctx.admin-plugins.bullet.3':
    'Hosts permitidos por plugin: os endereços que cada plugin pode acessar, já que as conexões de saída ficam bloqueadas por padrão.',
  'help.ctx.admin-storage.title': 'Armazenamento',
  'help.ctx.admin-storage.summary':
    'Onde os envios ficam guardados: no disco local ou em um bucket S3, com cópia opcional para outros destinos. Cada categoria de envio pode ir para um destino diferente, e nada muda até você clicar em “Salvar alterações”.',
  'help.ctx.admin-storage.bullet.1':
    'Saúde, no topo: as gravações que falharam em um destino de espelho, ou “Nenhuma falha de réplica registrada.”',
  'help.ctx.admin-storage.bullet.2':
    'Backends: nome, tipo, uso e “Espelhado em”, com Testar, Editar e Remover. “Calcular agora” calcula o que está armazenado; um backend definido por variável de ambiente é somente leitura.',
  'help.ctx.admin-storage.bullet.3':
    'Categorias: documentos de viagem, fotos de jornada, capas, fotos de perfil, imagens de lugares, os caches de fotos e os backups, cada um atribuído a um backend.',
  'help.ctx.admin-notifications.title': 'Notificações',
  'help.ctx.admin-notifications.summary':
    'Os canais que a instância oferece aos usuários e os que você recebe como administrador. Os usuários escolhem os próprios tópicos e URLs em Configurações; você decide o que existe e configura o e-mail.',
  'help.ctx.admin-notifications.bullet.1':
    '“E-mail (SMTP)”, Webhook, Ntfy e Web Push têm, cada um, um interruptor que oferece o canal aos usuários; o e-mail também precisa das configurações do servidor. No app está sempre ativado.',
  'help.ctx.admin-notifications.bullet.2':
    '“Lembretes de viagem”: se o servidor envia o lembrete antes do início de uma viagem.',
  'help.ctx.admin-notifications.bullet.3':
    '“Webhook de admin”, “Ntfy de admin” e o cartão Notificações: para onde vão os eventos de administração (“Nova versão disponível”, “Falha na réplica de armazenamento”, “Região de remo pedida”), cada um com um botão de teste.',
  'help.ctx.admin-mcp-tokens.title': 'Acesso MCP',
  'help.ctx.admin-mcp-tokens.summary':
    'Todos os tokens e sessões OAuth que clientes de IA têm neste TREK, de todos os usuários. Você pode revogar qualquer um deles.',
  'help.ctx.admin-mcp-tokens.bullet.1':
    'Sessões OAuth: o cliente, os escopos concedidos, o dono e a data, com um ícone de lixeira para revogar o acesso.',
  'help.ctx.admin-mcp-tokens.bullet.2':
    'Tokens de API: nome, dono, Criado e “Último uso”, com uma lixeira para excluir o token.',
  'help.ctx.admin-github.title': 'GitHub', // same-as-en
  'help.ctx.admin-github.summary':
    'As novidades do TREK: o histórico de versões no GitHub e se já existe uma versão mais nova que a sua. A atualização em si é feita fora do app, no servidor.',
  'help.ctx.admin-github.bullet.1':
    '“Histórico de versões” mostra as versões em uma linha do tempo, com as notas de cada uma. A mais nova tem o rótulo “Mais recente”, os pré-lançamentos mostram Pré-lançamento, e GitHub abre a página de versões.',
  'help.ctx.admin-github.bullet.2':
    '“Atualização disponível” aparece abaixo do cabeçalho da página quando sai uma versão mais nova; “Como atualizar” mostra os comandos para Docker ou o guia de atualização para outras instalações.',
  'help.ctx.admin-backup.title': 'Backup', // same-as-en
  'help.ctx.admin-backup.summary':
    'Backups completos do banco de dados e dos envios, feitos manualmente ou por agendamento, guardados no servidor e disponíveis para download em um único arquivo. Use Restaurar para recuperar um backup.',
  'help.ctx.admin-backup.bullet.1':
    '“Backup de dados”: “Criar backup” e “Enviar backup” no topo do cartão, e a lista de backups com Baixar, Restaurar e um ícone de lixeira para excluir.',
  'help.ctx.admin-backup.bullet.2':
    '“Enviar backup” restaura a partir de um arquivo feito em outra instância ou em um dia anterior, depois da mesma pergunta de Restaurar.',
  'help.ctx.admin-backup.bullet.3':
    'Backup automático: ligado ou desligado, Intervalo, “Executar no horário” e o dia, e “Excluir backups antigos após” (de 1 dia a “Manter para sempre”), aplicados com Salvar.',
  'help.ctx.admin-audit.title': 'Auditoria',
  'help.ctx.admin-audit.summary':
    'O registro de eventos administrativos e relevantes para a segurança: logins e falhas, alterações de MFA, mudanças de usuários e de configurações, backups e restaurações. Somente leitura, dos mais recentes para os mais antigos.',
  'help.ctx.admin-audit.bullet.1': 'Uma linha por evento, com hora, usuário, ação, recurso, IP e detalhes.',
  'help.ctx.admin-audit.bullet.2':
    'Atualizar, no cabeçalho do cartão, recarrega a lista. O selo ao lado do título mostra quantas entradas foram carregadas do total, e “Carregar mais” carrega entradas mais antigas.',
  // create-user
  'help.guide.create-user.title': 'Criar um usuário',
  'help.guide.create-user.goal': 'Adicione uma conta manualmente, sem convite.',
  'help.guide.create-user.step.1': 'Clique em “Criar usuário” no canto superior direito do cartão Usuários.',
  'help.guide.create-user.step.2':
    'Informe “Nome de usuário”, E-mail e uma Senha; a lista abaixo da senha mostra quais regras ela já cumpre. Escolha a Função: Usuário ou Administrador.',
  'help.guide.create-user.step.3': 'Clique em “Criar usuário”.',
  'help.guide.create-user.result':
    'A conta aparece na tabela e já pode entrar. Passe a senha para a pessoa por um canal de confiança.',
  'help.guide.create-user.tip.1': 'Para alguém que deve escolher a própria senha, um link de convite é melhor.',
  'help.guide.create-user.tip.2':
    'Um Administrador vê esta página e pode fazer tudo. O que um Usuário pode fazer nas viagens é definido em “Configurações de Permissões”, mais abaixo.',
  // edit-user
  'help.guide.edit-user.title': 'Alterar os dados ou a senha de um usuário',
  'help.guide.edit-user.goal':
    'Renomeie alguém, promova ou rebaixe a pessoa, ou ajude-a a entrar de novo depois de perder a senha.',
  'help.guide.edit-user.step.1':
    'Clique no lápis (“Editar usuário”) na linha do usuário. A janela mostra o e-mail da conta no topo.',
  'help.guide.edit-user.step.2':
    'Altere “Nome de usuário”, E-mail ou Função, ou digite uma “Nova senha” (deixe em branco para manter a atual) e clique em Salvar. “Redefinir passkeys”, na parte de baixo, remove todas as passkeys da conta depois que você confirma.',
  'help.guide.edit-user.result':
    'A alteração vale na hora. Uma nova senha também desconecta a pessoa em todos os dispositivos, e as sessões antigas deixam de funcionar.',
  'help.guide.edit-user.tip.1':
    'Você não pode tirar de si mesmo a função de administrador enquanto for o último administrador.',
  'help.guide.edit-user.tip.2':
    'Redefinir as passkeys mantém a senha. A pessoa cadastra novas passkeys em Configurações, Conta.',
  // invite-links
  'help.guide.invite-links.title': 'Convidar alguém por link',
  'help.guide.invite-links.goal':
    'Permita que alguém se cadastre em uma instância fechada e, se quiser, entre direto em uma viagem.',
  'help.guide.invite-links.step.1': 'Clique em “Criar link” no canto superior direito do cartão “Links de convite”.',
  'help.guide.invite-links.step.2':
    'Escolha “Máx. usos” (1× a 5×, ou ∞) e “Expira após” (1d a 14d, ou ∞), se quiser uma viagem em “Adicionar à viagem (opcional)”, e clique em “Criar e copiar”.',
  'help.guide.invite-links.step.3':
    'Envie o link. Cada linha mostra quantas vezes ele foi usado, quando expira, a viagem a que adiciona e quem o criou, com Ativo, Expirado ou Esgotado ao lado. “Copiar link” copia de novo, e a lixeira o exclui.',
  'help.guide.invite-links.result':
    'Quem abrir o link se cadastra com a própria senha. Se uma viagem tiver sido escolhida, a pessoa entra nela na hora.',
  'help.guide.invite-links.tip.1':
    'Os links de convite funcionam mesmo com o cadastro com senha desativado em Configurações.',
  'help.guide.invite-links.tip.2': 'Um link de uso único e validade curta é o padrão mais seguro para uma pessoa só.',
  // delete-user
  'help.guide.delete-user.title': 'Excluir um usuário',
  'help.guide.delete-user.goal': 'Remova uma conta e tudo o que pertence a ela.',
  'help.guide.delete-user.step.1': 'Clique na lixeira (“Excluir usuário”) na linha do usuário e confirme com Excluir.',
  'help.guide.delete-user.result':
    'A conta é excluída, junto com todas as viagens e jornadas que pertencem a ela, inclusive viagens compartilhadas com outras pessoas. As viagens em que ela era só membro continuam com os donos.',
  'help.guide.delete-user.tip.1': 'Não dá para desfazer. Se não tiver certeza, faça um backup antes.',
  'help.guide.delete-user.tip.2':
    'O ícone de lixeira na sua própria linha não funciona: você não pode excluir a si mesmo. Outro administrador precisa fazer isso.',
  // permissions
  'help.guide.permissions.title': 'Definir quem pode fazer o quê',
  'help.guide.permissions.goal': 'Defina, para cada ação, qual função pode realizá-la neste TREK.',
  'help.guide.permissions.step.1':
    'Em “Configurações de Permissões”, procure a ação no grupo dela, como “Excluir viagens” em “Gerenciamento de Viagens”, e escolha quem pode realizá-la: Todos, “Membros da viagem”, “Dono da viagem” ou “Apenas administrador”. Uma linha alterada fica marcada como personalizado.',
  'help.guide.permissions.step.2':
    'Clique em Salvar no canto superior direito do cartão. “Restaurar padrões” volta todas as linhas ao nível original; depois disso, clique em Salvar também.',
  'help.guide.permissions.result':
    'A regra vale para todas as viagens de uma vez. Quem está abaixo do nível deixa de ver os botões e menus correspondentes.',
  'help.guide.permissions.tip.1':
    '“Dono da viagem” é a pessoa que criou a viagem; administradores sempre podem fazer tudo.',
  'help.guide.permissions.tip.2':
    'Cada ação tem a própria linha, então você pode, por exemplo, deixar os membros planejarem lugares e dias, mas reservar a exclusão da viagem ao dono.',
  // default-map
  'help.guide.default-map.title': 'Definir o mapa padrão dos novos usuários',
  'help.guide.default-map.goal': 'Dê a cada conta nova um mapa que funciona sem token pessoal.',
  'help.guide.default-map.step.1':
    'Em Mapa, escolha um “Modelo de mapa” ou cole uma URL de blocos, e informe uma “Chave CARTO compartilhada” se usar blocos CARTO. A pré-visualização abaixo mostra o resultado.',
  'help.guide.default-map.step.2':
    'Mais abaixo, escolha o “Motor de mapas”: “Padrão (gratuito)”, Mapbox (3D) ou MapLibre (OpenFreeMap). Para Mapbox e MapLibre, escolha o “Estilo do mapa”; para Mapbox, adicione o “Token compartilhado do Mapbox” e decida sobre “Edifícios & relevo em 3D” e “Modo de alta qualidade”.',
  'help.guide.default-map.result':
    'Contas novas começam com essa configuração. Quem já escolheu o próprio mapa em Configurações continua com o seu.',
  'help.guide.default-map.tip.1':
    'Um token ou uma chave informados aqui são compartilhados por todos que não têm os próprios, então fique de olho na cota.',
  'help.guide.default-map.tip.2':
    'Contas existentes que nunca alteraram nada na aba do mapa também usam esses padrões.',
  // packing-templates
  'help.guide.packing-templates.title': 'Montar um modelo de bagagem',
  'help.guide.packing-templates.goal':
    'Dê às viagens uma lista de bagagem pronta para começar, em vez de uma lista vazia.',
  'help.guide.packing-templates.step.1': 'Clique em “Novo modelo”, digite um nome e confirme com o tique.',
  'help.guide.packing-templates.step.2':
    'Clique no nome do modelo para abri-lo e depois em “Adicionar categoria”. O + no topo de uma categoria adiciona itens, e um item só precisa de nome.',
  'help.guide.packing-templates.step.3':
    'Tudo é salvo enquanto você trabalha. O lápis renomeia um modelo, uma categoria ou um item. A lixeira exclui um item na hora. Para um modelo ou uma categoria, ela pede confirmação antes, porque tudo o que há dentro também é excluído.',
  'help.guide.packing-templates.result':
    'O modelo aparece na lista de mala de todas as viagens; aplicá-lo copia os itens, então cada viagem pode alterá-los à vontade.',
  'help.guide.packing-templates.tip.1':
    'Um modelo para cada tipo de viagem (praia, cidade, trilha) funciona melhor do que uma lista enorme.',
  'help.guide.packing-templates.tip.2': 'Excluir um modelo não altera as viagens que já o aplicaram.',
  'help.guide.packing-templates.tip.3':
    '“Salvar como modelo” na lista de mala de uma viagem cria um modelo com o peso, a quantidade e a bolsa de cada item. Esses dados aparecem ao lado do item aqui, e aplicar o modelo coloca os itens nas mesmas bolsas.',
  // categories
  'help.guide.categories.title': 'Gerenciar o conjunto de categorias',
  'help.guide.categories.goal': 'Defina quais categorias lugares e coleções podem ter e como elas aparecem.',
  'help.guide.categories.step.1':
    'Clique em “Nova categoria”, digite o nome na linha de título da janela, escolha um Ícone e uma Cor e confira a Pré-visualização. Clique em Criar.',
  'help.guide.categories.step.2':
    'Na lista, o lápis (Editar) abre uma categoria, e Atualizar salva. A lixeira (Excluir) remove a categoria depois que você confirma.',
  'help.guide.categories.result':
    'O conjunto vale em todo o app de uma vez: no inspetor de lugares, nos pinos do mapa, nas Coleções e nos filtros.',
  'help.guide.categories.tip.1':
    'Os lugares guardam o ID da categoria, então renomear uma categoria muda o nome dela em todos os lugares.',
  'help.guide.categories.tip.2':
    'Quando você exclui uma categoria, os lugares dela ficam sem categoria. Se isso importar, mova-os antes para outra categoria.',
  // school-holiday-catalog
  'help.guide.school-holiday-catalog.title': 'Manter as férias escolares manualmente',
  'help.guide.school-holiday-catalog.goal':
    'Mantenha as férias escolares de um país ou região para que todos possam escolhê-las no Férias.',
  'help.guide.school-holiday-catalog.step.1':
    'Em “Férias escolares”, escolha o País, ou clique em + (“Adicionar país”), informe o País e o “Código do país (ex.: US)” e salve. “Adicionar região” inclui cada parte do país que tem datas próprias.',
  'help.guide.school-holiday-catalog.step.2':
    'Clique em uma região para abrir “Região ou distrito escolar”: use “Adicionar período”, dê a cada um um “Nome das férias”, “Data inicial” e “Data final”, e salve. A lixeira remove um período ou uma região; um país só pode ser excluído quando não tiver mais regiões.',
  'help.guide.school-holiday-catalog.result':
    'Os usuários escolhem o país e a região nas Configurações do Férias e veem os períodos na grade do ano.',
  'help.guide.school-holiday-catalog.tip.1':
    'Uma região que alguém já escolheu no próprio calendário do Férias não pode ser excluída.',
  // auth-methods
  'help.guide.auth-methods.title': 'Definir como as pessoas entram',
  'help.guide.auth-methods.goal': 'Ative ou desative o login com senha, o SSO e o cadastro, e torne o 2FA obrigatório.',
  'help.guide.auth-methods.step.1':
    'Em “Métodos de autenticação”, ative ou desative o login com senha e o cadastro com senha; cada interruptor vale na hora. Com o cadastro desativado, contas novas só surgem por links de convite, SSO ou “Criar usuário”.',
  'help.guide.auth-methods.step.2':
    '“SSO Login” e “SSO Auto-Provisioning” precisam do “Login Único (OIDC)” configurado mais abaixo; o provisionamento automático cria uma conta na primeira vez que alguém entra pelo SSO.',
  'help.guide.auth-methods.step.3':
    'Ative “Exigir autenticação em dois fatores (2FA)” para obrigar quem não tem 2FA a configurá-la em Configurações antes de usar o TREK.',
  'help.guide.auth-methods.result': 'A página de login oferece exatamente os métodos que você deixou ativados.',
  'help.guide.auth-methods.tip.1':
    'O TREK não deixa você desativar o último método de login: o interruptor fica cinza, e a dica avisa que pelo menos um método de login deve permanecer ativado.',
  'help.guide.auth-methods.tip.2':
    'Com OIDC_ONLY definido no servidor, os interruptores de senha ficam bloqueados, e uma nota avisa isso.',
  // oidc
  'help.guide.oidc.title': 'Conectar o login único',
  'help.guide.oidc.goal': 'Deixe as pessoas entrarem com o seu provedor de identidade.',
  'help.guide.oidc.step.1':
    'Em “Login Único (OIDC)”, informe o “Nome exibido” no botão, a “URL do emissor”, o “ID do cliente” e o “Segredo do cliente” do seu provedor. Preencha “URL de descoberta (opcional)” só se o provedor não a publicar no endereço padrão, como acontece com o Authentik. Clique em Salvar.',
  'help.guide.oidc.step.2': 'Ative “SSO Login” em “Authentication Methods”.',
  'help.guide.oidc.result':
    'A página de login mostra o botão de SSO; com “SSO Auto-Provisioning” ativado, quem entra pela primeira vez recebe uma conta automaticamente.',
  'help.guide.oidc.tip.1':
    'A URI de redirecionamento que o seu provedor pede é o endereço do seu TREK mais o caminho de callback do OIDC indicado na documentação.',
  'help.guide.oidc.tip.2':
    'O mapeamento de claims define quais grupos do SSO viram administradores; veja a página sobre OIDC na documentação.',
  // instance-keys
  'help.guide.instance-keys.title': 'Informar as chaves de API',
  'help.guide.instance-keys.goal':
    'Ative fotos e avaliações do Google, capas do Unsplash e a busca do Amap para a instância inteira.',
  'help.guide.instance-keys.step.1':
    'Em “Chaves de API”, a TREK Places API, no topo, já cuida da busca de lugares sem chave. “O que vem dentro” lista o que ela cobre e o que não cobre.',
  'help.guide.instance-keys.step.2':
    'Para fotos, avaliações e horários de funcionamento, cole uma “Chave da API Google Maps” e clique em Testar; o resultado mostra Conectado ou Inválida. Abra “Para que a chave é usada” e ative só o que você quer que seja cobrado: “Fotos de Locais”, “Autocompletar de Locais”, “Detalhes do Local”, “Enriquecimento de lugares” e “Pesquisar apenas com o Google”, além de um “Limite diário de chamadas ao Google”.',
  'help.guide.instance-keys.step.3':
    'Cole a “Chave de API do Unsplash” para a busca de capas e a “Chave de API do Amap (高德地图)” para a busca de lugares na China continental, e clique em Salvar no fim do cartão.',
  'help.guide.instance-keys.result':
    'Os usuários têm acesso aos recursos sem precisar de chaves próprias. Sem chave do Google, a busca usa a TREK Places API e o OpenStreetMap.',
  'help.guide.instance-keys.tip.1':
    'Quando um usuário tem uma chave pessoal em Configurações, o TREK usa essa chave em vez da chave da instância para ele.',
  'help.guide.instance-keys.tip.2':
    'As chaves também podem vir de variáveis de ambiente; nesse caso, aparecem aqui como somente leitura.',
  'help.guide.instance-keys.tip.3':
    '“Limite diário de chamadas ao Google” define quanto o TREK pode gastar com a chave por dia. O selo ao lado do título conta as chamadas de hoje. Quando o limite é atingido, as buscas passam a usar o OpenStreetMap até o dia seguinte (UTC).',
  // places-transit
  'help.guide.places-transit.title': 'Escolher os provedores de busca e de transporte público',
  'help.guide.places-transit.goal':
    'Escolha qual serviço responde às buscas de lugares e às rotas de transporte público.',
  'help.guide.places-transit.step.1':
    'Em “Provedor de transporte público”, escolha “Transitous (grátis)”, que dispensa chave e funciona melhor na Europa, ou Google, que usa a chave do Google. A escolha é salva na hora.',
  'help.guide.places-transit.step.2':
    'Em “Provedor de busca de lugares”, escolha qual serviço o TREK consulta quando o índice do TREK e o OpenStreetMap não encontram nada: Automático (Google, se houver chave, depois Amap), Google Places, Amap (高德地图) ou OpenStreetMap.',
  'help.guide.places-transit.result':
    'Todos os campos de busca e todas as rotas de transporte público do TREK usam essa escolha.',
  'help.guide.places-transit.tip.1':
    'Uma opção escolhida sem a chave correspondente mostra um aviso aqui. A busca de lugares passa então a usar só o índice do TREK e o OpenStreetMap, e o transporte público, só o Transitous.',
  'help.guide.places-transit.tip.2':
    'As rotas de transporte público do Google são cobradas por requisição; as do Transitous, não.',
  // file-types
  'help.guide.file-types.title': 'Limitar os tipos de arquivo',
  'help.guide.file-types.goal': 'Defina quais extensões de arquivo os envios podem ter.',
  'help.guide.file-types.step.1':
    'Em “Tipos de arquivo permitidos”, edite a lista de extensões separadas por vírgula, ou digite * para permitir todos os tipos, e clique em Salvar.',
  'help.guide.file-types.result':
    'Envios de qualquer outro tipo são recusados com uma mensagem clara, nos documentos, no diário e nas capas.',
  'help.guide.file-types.tip.1':
    'Mantenha os tipos de imagem na lista; capas e fotos de jornada são verificadas pela mesma lista.',
  // toggle-addon
  'help.guide.toggle-addon.title': 'Ativar ou desativar um complemento',
  'help.guide.toggle-addon.goal': 'Disponibilize um módulo de recursos para todo mundo ou remova-o.',
  'help.guide.toggle-addon.step.1':
    'Clique no interruptor no bloco do complemento. O item de navegação aparece ou some para todos na hora.',
  'help.guide.toggle-addon.step.2':
    'Alguns blocos têm sublinhas com opções, como “Rastreamento de malas” em Listas ou os provedores de fotos em Jornada; elas só aparecem enquanto o complemento está ativado.',
  'help.guide.toggle-addon.result':
    'Quando você desativa um complemento, os dados dele são mantidos. Quando você o reativa, os dados aparecem de novo.',
  'help.guide.toggle-addon.tip.1': 'Desativar o MCP remove o endpoint e as seções de Integrações que dependem dele.',
  'help.guide.toggle-addon.tip.2':
    'Férias, Atlas e Jornada são os complementos que os usuários mais pedem; Documentos precisa de espaço de armazenamento para os envios.',
  // install-plugin
  'help.guide.install-plugin.title': 'Instalar um plugin',
  'help.guide.install-plugin.goal': 'Adicione um plugin de terceiros e conceda exatamente as permissões que ele pede.',
  'help.guide.install-plugin.step.1':
    'Abra Descobrir, encontre um plugin com “Buscar plugins…” ou com o filtro Tipo e clique em Instalar. Para um arquivo de pacote, clique em “Enviar plugin” (o ícone de nuvem no canto superior direito do cartão) ou solte o .zip na página.',
  'help.guide.install-plugin.step.2':
    'Em Instalado, leia a linha: o que o plugin pode acessar, os hosts a que ele se conecta e se ele é Revisado e Assinado. Depois, ative “Ativar plugin”; a linha passa a mostrar Ativo.',
  'help.guide.install-plugin.step.3':
    'O menu ⋯ da linha oferece Reiniciar, “Ver registro de erros”, “Hosts permitidos” e “Alterar versão…”, além dos links para o código-fonte; Excluir desinstala o plugin e os dados dele. Uma versão mais nova aparece como atualização na linha, e uma que pede novas permissões fica desativada até você aprová-las.',
  'help.guide.install-plugin.result':
    'O plugin roda em um processo próprio. Tudo o que ele adiciona, como widgets, camadas de mapa ou ferramentas, aparece onde o plugin define.',
  'help.guide.install-plugin.tip.1':
    'Reescanear encontra uma pasta de plugin vinculada para desenvolvimento, sem pacote.',
  'help.guide.install-plugin.tip.2':
    'Um plugin sem assinatura aparece marcado assim; instale-o só se confiar na origem.',
  // storage-backends
  'help.guide.storage-backends.title': 'Mover os envios para o S3 ou espelhá-los',
  'help.guide.storage-backends.goal':
    'Guarde os arquivos em um armazenamento de objetos ou copie cada envio para um segundo destino.',
  'help.guide.storage-backends.step.1':
    'Em Backends, clique em “Adicionar backend”, dê um Nome, escolha o Tipo, Local ou S3, e preencha os campos. Para manter uma cópia em outro lugar, marque os “Destinos do espelho”. Clique em Aplicar e depois em Testar na nova linha para verificar a conexão.',
  'help.guide.storage-backends.step.2':
    'Em Categorias, atribua cada tipo de envio, como “Documentos da viagem”, “Fotos da jornada” ou Backups, a um backend.',
  'help.guide.storage-backends.step.3':
    'Clique em “Salvar alterações”, no fim. Se uma categoria passar a apontar para outro lugar, o TREK pergunta se deve “Mover objetos existentes” ou “Apenas rotear novas gravações”.',
  'help.guide.storage-backends.result':
    'Os novos envios vão para o backend atribuído. Os arquivos movidos passam a ser servidos de lá, e o que você escolheu não mover continua onde estava.',
  'help.guide.storage-backends.tip.1':
    'Um backend configurado por variáveis de ambiente aparece aqui, mas não pode ser editado.',
  'help.guide.storage-backends.tip.2':
    'Um destino de espelho recebe uma cópia de cada nova gravação; “Sincronizar agora”, na linha, copia o que já estava armazenado. Um destino lento deixa lento cada envio nesse backend.',
  // channels-instance
  'help.guide.channels-instance.title': 'Configurar os canais de notificação',
  'help.guide.channels-instance.goal': 'Defina quais canais os usuários podem escolher e configure o e-mail.',
  'help.guide.channels-instance.step.1':
    'Ative “E-mail (SMTP)” no cabeçalho do cartão, informe host, porta, usuário e senha SMTP e o endereço do remetente, e clique em Salvar. “Enviar e-mail de teste” manda um e-mail para você. “Ignorar a verificação do certificado TLS” serve apenas para um servidor de e-mail local com certificado próprio.',
  'help.guide.channels-instance.step.2':
    'Ative Webhook, Ntfy e Web Push para oferecê-los. Depois, os usuários informam a própria URL ou tópico, ou ativam o push por dispositivo, em Configurações, Notificações.',
  'help.guide.channels-instance.step.3':
    '“Lembretes de viagem” ativa ou desativa o lembrete antes do início de uma viagem; No app está sempre ativado.',
  'help.guide.channels-instance.result': 'A aba “Notificações” de cada usuário mostra os canais que você ligou.',
  'help.guide.channels-instance.tip.1':
    'A “URL do servidor Ntfy” no cartão “Ntfy de admin” também é o servidor padrão dos usuários. Eles ainda podem definir o próprio servidor.',
  'help.guide.channels-instance.tip.2':
    'Os canais de plugins aparecem sozinhos assim que um plugin com esse recurso estiver ativo.',
  // admin-channels
  'help.guide.admin-channels.title': 'Receber os eventos de administração no celular',
  'help.guide.admin-channels.goal':
    'Receba avisos sobre novas versões, falhas nos espelhos de armazenamento e pedidos de região de remo.',
  'help.guide.admin-channels.step.1':
    'Em “Ntfy de admin”, informe o “Tópico de admin” e, se necessário, a “URL do servidor Ntfy” e um “Token de acesso (opcional)”; em “Webhook de admin”, uma URL. Clique em Salvar em cada cartão.',
  'help.guide.admin-channels.step.2':
    'Clique em “Enviar Ntfy de teste” ou “Enviar webhook de teste” para ver uma mensagem chegar.',
  'help.guide.admin-channels.result':
    'Os eventos de administração vão para todos os administradores no app e, onde você ativou, para o tópico ntfy e o webhook de administração.',
  'help.guide.admin-channels.tip.1':
    'Mantenha o tópico de administração separado do seu tópico pessoal, para que os avisos de falha não se percam no meio das mensagens das viagens.',
  'help.guide.admin-channels.tip.2':
    'O webhook e o tópico de administração são separados dos seus canais pessoais em Configurações, Notificações.',
  // mcp-tokens-admin
  'help.guide.mcp-tokens-admin.title': 'Revogar o acesso de IA',
  'help.guide.mcp-tokens-admin.goal':
    'Veja e revogue todos os tokens e sessões que clientes de IA têm, de qualquer usuário.',
  'help.guide.mcp-tokens-admin.step.1':
    'Em “Sessões OAuth”, encontre o cliente pelo nome e pelo dono; os chips mostram os escopos concedidos. A lixeira revoga a sessão depois que você confirma.',
  'help.guide.mcp-tokens-admin.step.2':
    'Em “Tokens de API”, o mesmo vale para tokens: nome, dono, Criado e “Último uso”. A lixeira exclui o token, e o cliente para de funcionar na hora.',
  'help.guide.mcp-tokens-admin.result': 'O usuário do cliente precisa conectá-lo de novo. Nada mais muda.',
  'help.guide.mcp-tokens-admin.tip.1':
    'As permissões mostram o que um cliente pode fazer; manter uma permissão somente leitura é seguro.',
  'help.guide.mcp-tokens-admin.tip.2':
    'Desativar o complemento MCP desconecta todos os clientes de uma vez e esconde esta aba, mas não exclui nada: os tokens voltam a funcionar quando ele é reativado.',
  // release-history
  'help.guide.release-history.title': 'Verificar se há uma versão nova',
  'help.guide.release-history.goal': 'Saiba se o seu TREK está atualizado e o que a próxima versão traz.',
  'help.guide.release-history.step.1':
    'Quando sai uma versão mais nova, “Atualização disponível” aparece abaixo do cabeçalho da página, com a versão que você usa. “Ver no GitHub” abre a versão, e “Como atualizar” mostra os comandos para Docker ou o guia de atualização para outras instalações.',
  'help.guide.release-history.step.2':
    'O “Histórico de versões” lista todas as versões com as notas de cada uma. “Mostrar detalhes” expande as notas, a versão mais nova tem o selo “Mais recente” e “Carregar mais” mostra versões mais antigas.',
  'help.guide.release-history.result':
    'A atualização é feita no host, baixando a nova imagem ou compilando a nova tag; o diretório de dados é mantido.',
  'help.guide.release-history.tip.1': 'Faça um backup antes de atualizar. A aba Backup fica ao lado desta.',
  'help.guide.release-history.tip.2':
    'Os pré-lançamentos aparecem na lista, mas não são anunciados como atualização, a menos que você esteja usando um pré-lançamento.',
  // create-backup
  'help.guide.create-backup.title': 'Fazer e restaurar um backup',
  'help.guide.create-backup.goal':
    'Faça backup da instância inteira, guarde uma cópia em outro lugar e tenha como restaurá-la.',
  'help.guide.create-backup.step.1':
    'Em “Backup de dados”, clique em “Criar backup” no canto superior direito. Ele salva o banco de dados e os envios em um único arquivo no servidor.',
  'help.guide.create-backup.step.2':
    'Baixar guarda uma cópia fora do servidor; a lixeira exclui os backups antigos depois que você confirma.',
  'help.guide.create-backup.step.3':
    'Restaurar em um backup, ou “Enviar backup” com um arquivo, substitui todos os dados atuais assim que você clica em “Sim, restaurar” na janela “Restaurar backup?”.',
  'help.guide.create-backup.result':
    'Uma restauração traz de volta usuários, viagens, arquivos e configurações exatamente como estavam naquele backup.',
  'help.guide.create-backup.tip.1':
    'Restaurar é a única ação aqui que não pode ser desfeita. Faça um backup novo antes.',
  'help.guide.create-backup.tip.2':
    'Os backups ficam no diretório de dados. Copie-os para outra máquina, para que fiquem seguros se esta máquina falhar.',
  // auto-backup
  'help.guide.auto-backup.title': 'Agendar backups',
  'help.guide.auto-backup.goal': 'Deixe o servidor fazer os próprios backups e apagar os antigos.',
  'help.guide.auto-backup.step.1':
    'Em “Backup automático”, ative “Ativar backup automático” e escolha o Intervalo (“A cada hora”, Diário, Semanal ou Mensal), “Executar no horário” e, para semanal ou mensal, o “Dia da semana” ou o “Dia do mês”.',
  'help.guide.auto-backup.step.2':
    'Em “Excluir backups antigos após”, escolha por quanto tempo cada backup fica guardado, de 1 dia a “Manter para sempre”, e clique em Salvar.',
  'help.guide.auto-backup.result':
    'Os backups aparecem na lista conforme a programação. Os mais antigos são excluídos quando passam do prazo que você escolheu.',
  'help.guide.auto-backup.tip.1':
    '“Executar no horário” usa o horário do servidor; a dica abaixo mostra o fuso horário do servidor.',
  'help.guide.auto-backup.tip.2':
    'O espaço no servidor é limitado: 7 ou 14 dias costumam bastar, com uma cópia baixada guardada em outro lugar.',
  // audit-log
  'help.guide.audit-log.title': 'Ler o registro de auditoria',
  'help.guide.audit-log.goal': 'Descubra quem fez o quê e quando.',
  'help.guide.audit-log.step.1':
    'Leia as linhas, das mais recentes para as mais antigas: Hora, Usuário, Ação, Recurso, IP e Detalhes. Cada ação tem o nome do que aconteceu, como um login com falha, uma alteração de MFA ou uma restauração.',
  'help.guide.audit-log.step.2':
    'Atualizar, no canto superior direito, recarrega a lista. O selo ao lado do título mostra quantas entradas foram carregadas do total, e “Carregar mais” carrega entradas mais antigas.',
  'help.guide.audit-log.result': 'Você tem um registro para mostrar a quem perguntar por que algo mudou.',
  'help.guide.audit-log.tip.1': 'Os horários aparecem no fuso horário do servidor.',
  'help.guide.audit-log.tip.2': 'O registro só aceita acréscimos; nada aqui pode ser editado ou excluído pelo app.',
  // document-providers
  'help.guide.document-providers.title': 'Oferecer um repositório de documentos',
  'help.guide.document-providers.goal':
    'Defina com quais serviços de armazenamento uma viagem pode sincronizar os documentos.',
  'help.guide.document-providers.step.1':
    'O bloco Documentos lista os repositórios em linhas: Paperless-ngx, Papra, Nextcloud, OpenCloud e Synology Drive. Os cinco começam desativados, e as linhas só aparecem enquanto o próprio Documentos estiver ativado.',
  'help.guide.document-providers.step.2':
    'Ative o interruptor na linha do Nextcloud. Aparece a mensagem “Complemento atualizado”, e a partir daí os donos de viagem encontram “Sincronização de documentos” na aba Arquivos das viagens, com o Nextcloud em “Conectar um provedor”.',
  'help.guide.document-providers.result':
    'O repositório fica disponível em todas as viagens deste TREK. Nada é conectado até o dono de uma viagem conectá-lo.',
  'help.guide.document-providers.tip.1':
    'Aqui você só decide se um repositório pode ser oferecido. O endereço e as credenciais pertencem a uma viagem e são informados pelo dono dela na aba “Arquivos”, nunca no painel de administração.',
  'help.guide.document-providers.tip.2':
    'Desativar Documentos desativa também todos os repositórios, e não é possível ativar um repositório enquanto Documentos estiver desativado: o servidor responde “Enable the Documents addon first”. Um repositório na sua própria rede também precisa de ALLOW_INTERNAL_NETWORK=true no servidor.',

  // ── Screen: trip ──────────────────────────────────────────────────────────────────────
  'help.ctx.trip.title': 'Viagem',
  'help.ctx.trip.summary':
    'Tudo sobre uma viagem: o plano com os dias, o mapa e os lugares, e as abas de passeios, transportes, reservas, listas, custos, arquivos, colaboração e um diário vinculado. Cada uma delas tem uma tela de ajuda própria abaixo desta.',
  'help.ctx.trip.bullet.1':
    'A barra de abas abaixo da barra superior: Planejado, Passeios, Transportes, Reservas, Listas, Custos, Arquivos, Colab e, quando há um diário vinculado, Diário. Os complementos e plugins definem quais abas existem no seu TREK.',
  'help.ctx.trip.bullet.2':
    'Planejado tem três colunas: os dias à esquerda, o mapa no meio e os lugares à direita. Com o complemento “Viagem de carro”, a coluna de dias começa com um seletor entre Dias e “Viagem de carro”; com o complemento Passeios, a coluna de lugares começa com Lugares e Passeios. Reservas e transportes fazem parte do plano, na parada e entre as paradas; as abas listam todos eles.',
  'help.ctx.trip.bullet.3':
    '“Configurações da viagem”, a pílula ao lado do nome da viagem no canto superior esquerdo, abre as configurações da viagem: Pessoas (membros e convidados), Compartilhando (o link público somente leitura e o link de convite) e Diário.',
  'help.ctx.trip.bullet.4':
    'Título, datas, capa e moeda são editados em “Minhas viagens”, pelo lápis no cartão da viagem. O nome da viagem no canto superior esquerdo leva você de volta para lá.',
  'help.ctx.trip.bullet.5':
    'A aba na borda interna de uma coluna recolhe a coluna, e o mapa ocupa o espaço livre. Uma coluna recolhida aparece como um pequeno bloco no canto superior do mapa; clique nele para mostrá-la de novo. Arraste o divisor fino ao lado de uma coluna para mudar a largura dela.',
  'help.ctx.trip.bullet.6':
    'A seta de desfazer na barra de ferramentas dos dias desfaz suas alterações recentes no plano, uma de cada vez.',
  // add-member
  'help.guide.add-member.title': 'Adicionar um membro',
  'help.guide.add-member.goal': 'Dê acesso a esta viagem a alguém que tem conta no TREK.',
  'help.guide.add-member.step.1':
    'Clique em “Configurações da viagem”, a pílula ao lado do nome da viagem no canto superior esquerdo. Ela abre em Pessoas.',
  'help.guide.add-member.step.2':
    'Em “Convidar usuário”, escolha a pessoa em “Selecionar usuário…” e clique em Convidar.',
  'help.guide.add-member.step.3':
    'A pessoa agora aparece em Acesso. O selo Proprietário indica o dono. “Remover acesso”, no fim de uma linha, remove a pessoa depois que você confirma.',
  'help.guide.add-member.result':
    'O membro pode ver e editar a viagem como você, dentro dos níveis que o administrador definiu em “Configurações de Permissões”.',
  'help.guide.add-member.tip.1':
    'Quem não aparece na lista ainda não tem conta no TREK: adicione a pessoa como convidada ou peça que ela se cadastre por um link de convite.',
  'help.guide.add-member.tip.2':
    'O número ao lado de Acesso conta as pessoas da viagem; os convidados aparecem separados, mais abaixo.',
  // trip-invite-link
  'help.guide.trip-invite-link.title': 'Convidar por link',
  'help.guide.trip-invite-link.goal': 'Deixe as pessoas entrarem na viagem por conta própria.',
  'help.guide.trip-invite-link.step.1':
    'Clique em “Configurações da viagem”, ao lado do nome da viagem, e escolha Compartilhando à esquerda. Em “Link de convite da viagem”, clique em “Criar link de convite”.',
  'help.guide.trip-invite-link.step.2':
    'Clique em “Copiar” e envie o link. Qualquer pessoa com conta no TREK que abrir o link entra como membro.',
  'help.guide.trip-invite-link.step.3':
    '“Gerar novamente” substitui o link, e o antigo deixa de funcionar; “Desativar” desliga o link.',
  'help.guide.trip-invite-link.result': 'Quem abrir o link entra na viagem e aparece em “Acesso”.',
  'help.guide.trip-invite-link.tip.1':
    'Quem não tem conta não consegue usar esse link. Um administrador cria links de cadastro em “Administrador”, “Usuários” e pode vincular um deles a esta viagem.',
  'help.guide.trip-invite-link.tip.2':
    'Gere o link de novo se você o mandou no chat errado: o link antigo para de funcionar na hora.',
  // add-guest
  'help.guide.add-guest.title': 'Adicionar um convidado sem conta',
  'help.guide.add-guest.goal': 'Adicione à viagem alguém que não usa o TREK.',
  'help.guide.add-guest.step.1':
    'Clique em “Configurações da viagem”, ao lado do nome da viagem. Em Pessoas, Convidados é a última seção, abaixo de Acesso.',
  'help.guide.add-guest.step.2': 'Digite o nome em “Nome do convidado” e clique em “Adicionar convidado”.',
  'help.guide.add-guest.result': 'O convidado pode receber custos, itens da mala e tarefas, mas não pode fazer login.',
  'help.guide.add-guest.tip.1':
    'Renomear (o lápis) muda o nome de um convidado. “Remover acesso” (a lixeira) remove o convidado depois que você confirma: as atribuições dele são excluídas, e a parte dele em cada despesa é dividida entre os demais participantes da divisão.',
  'help.guide.add-guest.tip.2': 'Se a pessoa criar uma conta depois, convide-a como membro e remova o convidado.',
  // public-link
  'help.guide.public-link.title': 'Publicar um link só para leitura',
  'help.guide.public-link.goal': 'Mostre a viagem a pessoas que não devem editá-la.',
  'help.guide.public-link.step.1':
    'Clique em “Configurações da viagem”, ao lado do nome da viagem, e escolha Compartilhando à esquerda.',
  'help.guide.public-link.step.2':
    'No cartão “Link público”, ative o que o link pode mostrar. “Mapa e plano” está sempre ativado; Reservas, Bagagem, Custos e Chat ficam a seu critério.',
  'help.guide.public-link.step.3':
    'Em Opções, “Só transporte e hospedagem” deixa de fora atividades, notas dos dias e dias vazios. “Sem fotos” deixa de fora as fotos dos lugares.',
  'help.guide.public-link.result':
    'Qualquer pessoa com o link vê as partes escolhidas sem fazer login e não consegue mudar nada.',
  'help.guide.public-link.tip.1':
    'O link não aparece listado em lugar nenhum, mas qualquer pessoa que o tenha consegue abri-lo. Guarde-o com o mesmo cuidado de uma senha.',
  'help.guide.public-link.tip.2': 'Para dar permissão de edição, adicione a pessoa como membro.',
  // transfer-ownership
  'help.guide.transfer-ownership.title': 'Transferir a viagem ou sair dela',
  'help.guide.transfer-ownership.goal': 'Passe a viagem para outro proprietário ou saia de uma viagem que não é sua.',
  'help.guide.transfer-ownership.step.1':
    'Clique em “Configurações da viagem”, ao lado do nome da viagem. Em Acesso, clique em “Tornar proprietário” (a coroa) na linha de um membro e confirme.',
  'help.guide.transfer-ownership.step.2':
    '“Sair da viagem”, na sua própria linha, tira você da viagem depois que você confirma. Se você for o proprietário, transfira a propriedade antes.',
  'help.guide.transfer-ownership.result':
    'O novo proprietário gerencia os membros e pode excluir a viagem; você continua como membro comum.',
  'help.guide.transfer-ownership.tip.1':
    'O proprietário é quem criou a viagem, até a propriedade ser transferida. Só o proprietário pode excluir a viagem.',
  'help.guide.transfer-ownership.tip.2':
    '“Remover acesso”, na linha de outro membro, funciona no sentido contrário: o proprietário remove esse membro da viagem.',
  // collapse-columns
  'help.guide.collapse-columns.title': 'Abrir espaço para o mapa',
  'help.guide.collapse-columns.goal': 'Recolha uma coluna ou deixe-a mais larga.',
  'help.guide.collapse-columns.step.1':
    'Clique na aba da borda interna da coluna de dias, a que tem o ícone de painel, para recolher a coluna; o mapa ocupa o espaço livre. A coluna de lugares tem a mesma aba.',
  'help.guide.collapse-columns.step.2':
    'Quando uma coluna está recolhida, um pequeno bloco com o ícone de painel aparece no canto superior do mapa; a dica dele mostra Planejado ou Lugares. Clique nele para mostrar a coluna de novo.',
  'help.guide.collapse-columns.step.3':
    'Arraste o divisor fino entre uma coluna e o mapa para mudar a largura da coluna.',
  'help.guide.collapse-columns.result':
    'As larguras ficam salvas. Na próxima visita, as colunas aparecem abertas de novo.',
  'help.guide.collapse-columns.tip.1': 'Você pode recolher as duas colunas ao mesmo tempo para ver só o mapa.',
  'help.guide.collapse-columns.tip.2':
    'Em uma janela estreita só cabe uma coluna: abrir uma recolhe a outra. No celular não há colunas; Viagem, Planejado e Lugares, no topo, alternam entre as telas.',
  // undo-change
  'help.guide.undo-change.title': 'Desfazer a última alteração',
  'help.guide.undo-change.goal': 'Desfaça a sua última alteração no plano.',
  'help.guide.undo-change.step.1':
    'Clique na seta de desfazer na barra de ferramentas acima dos dias. A dica dela mostra qual alteração será desfeita.',
  'help.guide.undo-change.result': 'O plano volta a ser como era, e uma mensagem curta informa o que foi desfeito.',
  'help.guide.undo-change.tip.1':
    'Desfazer vale para o plano: adicionar, atribuir, remover, reordenar, mover e travar lugares, limpar um dia, otimizar uma rota, excluir lugares, mudar categorias e importar.',
  'help.guide.undo-change.tip.2':
    'Clique de novo para voltar mais: o TREK guarda suas últimas 30 alterações nesta viagem, das mais recentes para as mais antigas, até você sair dela.',
  'help.guide.clear-day.title': 'Limpar um dia',
  'help.guide.clear-day.goal': 'Tire todos os lugares de um dia de uma vez, por exemplo para planejar o dia do zero.',
  'help.guide.clear-day.step.1': 'Clique com o botão direito no cabeçalho do dia no plano.',
  'help.guide.clear-day.step.2': 'Escolha “Limpar dia” e confirme.',
  'help.guide.clear-day.result':
    'O dia fica vazio e os lugares dele voltam para a lista como não planejados. A seta de desfazer acima dos dias traz tudo de volta.',
  'help.guide.clear-day.tip.1': 'Só os lugares são removidos. O dia mantém as notas e as reservas.',

  // ── Screen: trip-places ───────────────────────────────────────────────────────────────
  'help.ctx.trip-places.title': 'Lugares',
  'help.ctx.trip-places.summary':
    'A coluna da direita do plano: todos os lugares da viagem, planejados ou não, com busca, filtros e ordenação, e as formas de adicionar lugares: pela busca, manualmente ou a partir de uma lista compartilhada. Lugares e Passeios, no topo, alternam entre os lugares e os passeios da viagem.',
  'help.ctx.trip-places.bullet.1':
    'Lugares e Passeios, no topo da coluna, alternam a lista. Lugares é o que aparece ao entrar. Passeios lista os passeios da viagem e importa arquivos GPX, KML e KMZ com “Importar GPX ou KML”; um passeio não aparece na lista de lugares.',
  'help.ctx.trip-places.bullet.2':
    '“Adicionar lugar/atividade” abre o formulário de um lugar que você pesquisa ou digita. Com um dia aberto, o botão mostra “Novo local”, e “Para o dia”, ao lado, cria o lugar direto nesse dia.',
  'help.ctx.trip-places.bullet.3':
    '“Importar locais”, o botão de ícone ao lado, oferece “Importar lista” para uma lista compartilhada do Google Maps ou do Naver Maps. Se um administrador tiver desativado o complemento Passeios, ele também oferece “Importar arquivo” para arquivos .gpx, .kml e .kmz, e você pode soltar um arquivo sobre a coluna.',
  'help.ctx.trip-places.bullet.4':
    'Abaixo deles ficam a Busca, que também pesquisa descrições e notas, e a caixa Escolher ao lado. A fileira de baixo tem os filtros: Mostrar alterna entre Todos, “Não planejados” e Planejado, cada um com sua contagem. O botão de etiqueta filtra por categoria, a estrela por avaliação mínima, o globo (quando a viagem abrange mais de um país ou região) por país ou região, e “Ordenar por” define a ordem da lista.',
  'help.ctx.trip-places.bullet.5':
    'Cada linha mostra imagem, nome e descrição ou endereço, e uma estrela com a avaliação média quando alguém já avaliou o lugar. Clique para ver os detalhes do lugar, arraste para um dia, ou clique com o botão direito (ou em “Mais opções”, os três pontos) para Editar, “+ Dia”, “Abrir site”, Google Maps, “Salvar na Coleção” e Excluir.',
  'help.ctx.trip-places.bullet.6':
    'Com um dia aberto, o + redondo no fim de uma linha (“+ Dia”) adiciona o lugar a esse dia. Ele aparece em todos os lugares que ainda não estão nesse dia. Planejado passa então a listar só esse dia, e o chip “Mostrando apenas o dia aberto” avisa isso. O x dele, “Mostrar a viagem inteira”, fecha o dia.',
  // create-place
  'help.guide.create-place.title': 'Criar um lugar',
  'help.guide.create-place.goal':
    'Adicione manualmente um lugar ou uma atividade, com todos os detalhes de que o planejamento precisa.',
  'help.guide.create-place.step.1':
    'Clique em “Adicionar lugar/atividade” no topo da coluna de lugares (“Novo local” quando há um dia aberto). O formulário abre com o cursor na busca.',
  'help.guide.create-place.step.2':
    'Digite o lugar em “Buscar lugares…” e escolha um resultado. O nome no topo da janela, Endereço, Latitude, Longitude e Site são preenchidos, e “Detalhes do lugar”, à esquerda, mostra imagens, horário de funcionamento e uma descrição. Em um TREK com chave do Google, “Não é o lugar certo? Buscar no Google”, abaixo dos resultados, faz a mesma busca pelo Google. Com Coleções ativado, “Lugares salvos”, à direita, oferece os lugares das suas listas do mesmo jeito.',
  'help.guide.create-place.step.3':
    'Em “Detalhes do lugar”, clique em uma imagem em “Escolher uma imagem” para usá-la como imagem do lugar. “Usar este texto” copia a descrição para o formulário.',
  'help.guide.create-place.step.4':
    'Confira os campos do formulário. O nome, no topo da janela, é o único campo obrigatório. A pílula Categoria logo abaixo escolhe uma das categorias da viagem, e o + ao lado cria uma nova. Endereço, Latitude e Longitude vêm da busca ou podem ser digitados. Descrição e Notas são para seus próprios textos. Site recebe o link, Anexar em Arquivos adiciona um documento, e Telefone, E-mail e “Adicionar horário de funcionamento” servem para informações que a busca não encontrou.',
  'help.guide.create-place.step.5':
    'Clique em Adicionar. Se já houver na viagem um lugar com o mesmo nome ou no mesmo local, o TREK mostra um aviso e o botão muda para “Adicionar mesmo assim”.',
  'help.guide.create-place.result':
    'O lugar aparece na lista e no mapa, em “Não planejados”, até ser colocado em um dia.',
  'help.guide.create-place.tip.1':
    'Custos, no fim do formulário, com o complemento Orçamento ativado, abre o editor de Custos para a despesa do lugar logo depois de salvar. Uma imagem ou PDF colado na janela é anexado como arquivo em Arquivos.',
  'help.guide.create-place.tip.2':
    'O índice do TREK e o OpenStreetMap fornecem os resultados da busca em qualquer TREK, e “Detalhes do lugar” é preenchido automaticamente com dados da Wikipédia, do Wikivoyage e do Wikimedia. O TREK só consulta o Google quando os dois não encontram nada, e só o Google fornece avaliações.',
  'help.guide.create-place.tip.3':
    'Você também pode criar um lugar pelo mapa: clique com o botão direito no ponto, e o formulário abre com as coordenadas e o endereço preenchidos.',
  // place-to-open-day
  'help.guide.place-to-open-day.title': 'Adicionar um lugar direto ao dia aberto',
  'help.guide.place-to-open-day.goal': 'Crie ou escolha um lugar e adicione-o ao dia de uma só vez.',
  'help.guide.place-to-open-day.step.1':
    'Clique no cabeçalho de um dia na coluna de dias. O dia fica aberto: o cartão dele aparece destacado, e a coluna de lugares mostra o botão “Para o dia” ao lado de “Novo local”.',
  'help.guide.place-to-open-day.step.2':
    '“Para o dia” abre o mesmo formulário de “Novo local”, mas o lugar já entra no dia aberto quando você clica em Adicionar.',
  'help.guide.place-to-open-day.step.3':
    'Para adicionar um lugar existente ao dia aberto, clique no + redondo no fim da linha dele (“+ Dia”), ou clique com o botão direito e escolha “+ Dia”. O + aparece em todos os lugares que ainda não estão nesse dia.',
  'help.guide.place-to-open-day.step.4':
    'Também funciona ao contrário, sem abrir um dia antes: arraste a linha do lugar para fora da coluna e solte em um cartão de dia. Se soltar entre duas paradas, ele fica exatamente ali.',
  'help.guide.place-to-open-day.result':
    'O lugar entra no fim da lista do dia; arraste para cima ou para baixo até a posição certa.',
  'help.guide.place-to-open-day.tip.1':
    'O dia aberto também influencia a busca: com um dia aberto, o mapa e a busca por perto partem dos lugares que já estão nesse dia.',
  'help.guide.place-to-open-day.tip.2': 'Desfazer, na barra de ferramentas acima dos dias, desfaz a atribuição.',
  // filter-places
  'help.guide.filter-places.title': 'Encontrar um lugar na lista',
  'help.guide.filter-places.goal': 'Mostre na coluna só os lugares que você está procurando.',
  'help.guide.filter-places.step.1':
    'Mostrar, o menu suspenso abaixo da busca, alterna entre Todos, “Não planejados” (ainda sem dia) e Planejado (já em um dia), cada um com sua contagem. Se o complemento Passeios estiver desativado e uma trilha GPX tiver sido importada, aparece também Trilhas.',
  'help.guide.filter-places.step.2':
    'Digite em Buscar, no topo. A lista é filtrada enquanto você digita, por nome, endereço, descrição e notas; o x no campo limpa a busca.',
  'help.guide.filter-places.step.3':
    'O botão de etiqueta ao lado de Mostrar lista as categorias: marque uma ou mais, inclusive “Sem categoria”. O botão mostra quantas estão marcadas, e “Limpar filtro”, no fim da lista, desmarca todas.',
  'help.guide.filter-places.step.4':
    'A estrela ao lado define uma avaliação mínima: 5+, 4+ e assim por diante mostram só os lugares com média pelo menos igual. Lugares sem avaliação ficam ocultos.',
  'help.guide.filter-places.result': 'O número em Mostrar indica quantos lugares correspondem, e os filtros se somam.',
  'help.guide.filter-places.tip.1':
    'Com um dia aberto, “Planejado” lista só esse dia e avisa: “Mostrando apenas o dia aberto”, com “Mostrar a viagem inteira” ao lado.',
  'help.guide.filter-places.tip.2':
    'O mapa também aplica Mostrar, as categorias e a avaliação e, com um dia aberto, Planejado no mapa mostra só esse dia. A busca e o globo filtram só a lista.',
  // edit-place
  'help.guide.edit-place.title': 'Alterar um lugar',
  'help.guide.edit-place.goal': 'Corrija um nome, mova o pino, adicione um site ou troque a categoria.',
  'help.guide.edit-place.step.1':
    'Clique com o botão direito na linha e escolha Editar, ou clique em “Mais opções” no fim da linha, ou abra o lugar e clique em Editar nos detalhes.',
  'help.guide.edit-place.step.2':
    'Altere o que precisar em “Editar lugar”: o nome e a pílula Categoria no topo da janela, Endereço, Latitude e Longitude, Descrição, Notas, Site, Telefone, E-mail e o horário de funcionamento. Quando o lugar está em exatamente um dia, ou quando você o abriu a partir de um dia, o formulário também traz Início, Fim e “Notas para este dia”.',
  'help.guide.edit-place.step.3': 'Clique em Atualizar.',
  'help.guide.edit-place.result':
    'A alteração vale em todos os lugares onde o lugar aparece: a lista, o mapa e cada dia em que ele está.',
  'help.guide.edit-place.tip.1':
    '“Notas para este dia” pertencem ao lugar só naquele dia; Notas pertencem ao lugar em si.',
  'help.guide.edit-place.tip.2':
    'Um “Fim” antes do “Início” bloqueia o “Atualizar”. “Sobreposição de horário com:” só avisa que outra parada do dia tem o mesmo horário.',
  // delete-place
  'help.guide.delete-place.title': 'Excluir um lugar',
  'help.guide.delete-place.goal': 'Remova um lugar da viagem de forma definitiva.',
  'help.guide.delete-place.step.1':
    'Clique com o botão direito na linha e escolha Excluir (também em “Mais opções”, no fim da linha), ou clique em Excluir nos detalhes do lugar.',
  'help.guide.delete-place.step.2':
    'Clique em “Excluir” na confirmação. Se havia uma noite reservada no lugar ou uma reserva vinculada a ele, a confirmação informa o que será excluído junto.',
  'help.guide.delete-place.result':
    'O lugar sai da lista, do mapa e de todos os dias. Desfazer, na barra de ferramentas acima dos dias, o restaura.',
  'help.guide.delete-place.tip.1': 'Para tirar um lugar de um dia só, use “Remover do dia” naquela parada.',
  'help.guide.delete-place.tip.2':
    'Para excluir vários lugares de uma vez, clique no ícone de seleção ao lado da busca para iniciar uma seleção.',
  // select-places
  'help.guide.select-places.title': 'Alterar ou excluir vários lugares de uma vez',
  'help.guide.select-places.goal': 'Altere vários lugares de uma vez, em vez de um por um.',
  'help.guide.select-places.step.1':
    'Clique no visto ao lado do campo de busca. As linhas ganham caixas de seleção redondas, e uma barra com as ações aparece no pé da coluna.',
  'help.guide.select-places.step.2':
    'Clique nas linhas para marcá-las. “Selecionar tudo”, o duplo tique na barra, marca todas as linhas exibidas pelos filtros.',
  'help.guide.select-places.step.3':
    'A barra conta os lugares marcados. “Alterar categoria” dá a todos a mesma categoria; “Salvar na Coleção” (com Coleções ativado) copia os lugares para uma das suas coleções; “Excluir seleção” os remove depois de uma confirmação.',
  'help.guide.select-places.step.4': 'Clique em Concluído, o X no fim da barra, para encerrar a seleção.',
  'help.guide.select-places.result':
    'A alteração vale para todos os lugares selecionados; uma exclusão pode ser desfeita pela barra de ferramentas acima dos dias.',
  'help.guide.select-places.tip.1':
    'Os filtros continuam valendo durante a seleção: filtre primeiro por “Não planejados”, e “Selecionar tudo” seleciona só esses lugares.',
  'help.guide.select-places.tip.2':
    '“Marcar como visitado nas suas listas” aparece na barra quando o addon Coleções está ativado: ele marca os lugares como visitados nas coleções em que estão salvos.',
  // import-places-file
  'help.guide.import-places-file.title': 'Importar lugares de um arquivo GPX, KML ou KMZ',
  'help.guide.import-places-file.goal':
    'Com o complemento Passeios desativado, importe como lugares os alfinetes e caminhos exportados pelo Google My Maps, pelo Google Earth ou por um rastreador GPS.',
  'help.guide.import-places-file.step.1':
    'Clique em “Importar locais”, o botão de ícone ao lado do botão de adicionar, e escolha “Importar arquivo”, ou solte o arquivo em qualquer parte da coluna de lugares. As duas opções só existem quando um administrador desativou o complemento Passeios.',
  'help.guide.import-places-file.step.2':
    'Escolha o arquivo ou arraste-o para a caixa. Para GPX, marque o que importar: “Pontos de caminho”, Rotas e “Trilhas (com geometria de percurso)”. Para KML e KMZ, marque “Pontos (Placemarks)” e “Caminhos (LineStrings)”.',
  'help.guide.import-places-file.step.3':
    'A caixa aceita vários arquivos de uma vez, mas só .gpx, .kml e .kmz. Qualquer outro tipo de arquivo, ou um com mais de 10 MB, é recusado na janela e não é importado.',
  'help.guide.import-places-file.step.4':
    'Clique em Importar. Uma mensagem informa quantos lugares foram importados. Para arquivos KML ou KMZ, a janela continua aberta com um resumo do que foi criado e do que foi ignorado.',
  'help.guide.import-places-file.result':
    'Os lugares estão na lista. Uma trilha tem um traço colorido na linha dela, aparece desenhada no mapa e ganha o próprio filtro Trilhas.',
  'help.guide.import-places-file.tip.1':
    'Um arquivo grande demais é recusado, e o TREK mostra o limite de tamanho; exporte de novo sem fotos ou divida o arquivo.',
  'help.guide.import-places-file.tip.2':
    'Dá para desfazer a importação inteira pela barra de ferramentas acima dos dias.',
  // import-places-list
  'help.guide.import-places-list.title': 'Importar uma lista compartilhada do Google Maps ou do Naver Maps',
  'help.guide.import-places-list.goal': 'Importe lugares a partir do link de uma lista compartilhada.',
  'help.guide.import-places-list.step.1':
    'Clique em “Importar locais”, o botão de ícone ao lado do botão de adicionar, e escolha “Importar lista”.',
  'help.guide.import-places-list.step.2':
    'Em Provedor, escolha “Lista Google” ou “Lista Naver” e cole o link compartilhado da lista em Link. Um link de rota do Google Maps também funciona: as paradas viram lugares, na ordem do percurso.',
  'help.guide.import-places-list.step.3': 'Clique em “Importar”.',
  'help.guide.import-places-list.result':
    'Todos os lugares da lista estão na viagem, com os nomes da lista; os lugares que já estavam na viagem são ignorados.',
  'help.guide.import-places-list.tip.1':
    'A lista precisa estar compartilhada publicamente; o link de uma lista privada não importa nada.',
  'help.guide.import-places-list.tip.2':
    '“Enriquecer lugares via Google” aparece na janela quando o seu TREK tem chave do Google: ele pesquisa cada lugar importado e completa fotos, endereço e detalhes.',
  'help.guide.sort-places.title': 'Ordenar a lista de lugares',
  'help.guide.sort-places.goal':
    'Ordene a lista por nome, por avaliação ou pelo que foi adicionado ou alterado por último.',
  'help.guide.sort-places.step.1':
    'Clique em “Ordenar por”, o botão de setas no fim da fileira de filtros. Uma marca indica a ordem atual, e a dica do botão mostra o nome dela.',
  'help.guide.sort-places.step.2':
    'Escolha uma ordem, como “Melhor avaliados”, ou ordene por nome. A lista é atualizada na hora.',
  'help.guide.sort-places.result': 'A lista mostra os lugares na ordem escolhida, até você escolher outra.',
  'help.guide.sort-places.tip.1':
    'Qualquer ordem diferente de “Adicionados recentemente” destaca o botão, para você ver na hora que a lista está ordenada de outro jeito.',
  'help.guide.sort-places.tip.2':
    'A ordenação só muda a lista. Os dias mantêm a própria ordem, e o seu navegador lembra a ordem que você escolheu.',
  'help.guide.place-by-hand.title': 'Adicionar um lugar que a busca não encontra',
  'help.guide.place-by-hand.goal':
    'Cadastre um lugar você mesmo, com telefone, e-mail e horário de funcionamento, quando a busca de lugares não encontra nada.',
  'help.guide.place-by-hand.step.1':
    'Na janela do lugar, digite o nome na busca e pressione Enter. Se nada for encontrado, a janela avisa e oferece “Adicionar manualmente”.',
  'help.guide.place-by-hand.step.2':
    'Clique em “Adicionar manualmente”. O texto que você buscou vira o nome, e a janela rola até os campos de contato.',
  'help.guide.place-by-hand.step.3': 'Preencha Telefone e E-mail, se souber.',
  'help.guide.place-by-hand.step.4':
    'Clique em “Adicionar horário de funcionamento” e defina quando o lugar abre e fecha em cada dia. O botão de copiar aplica a todos os dias o horário do primeiro, e o interruptor de um dia o marca como Encerrada.',
  'help.guide.place-by-hand.step.5': 'Clique em Adicionar.',
  'help.guide.place-by-hand.result':
    'O lugar entra na lista. Os detalhes mostram o telefone, o e-mail e o horário de funcionamento que você informou, como em um lugar encontrado pela busca.',
  'help.guide.place-by-hand.tip.1':
    'Quando você edita um lugar sem horário próprio, ele copia automaticamente o horário de funcionamento de “Detalhes do lugar”, à esquerda. Se ele já tiver horário, um botão ao lado copia o horário consultado.',
  'help.guide.place-by-hand.tip.2':
    'O horário que você informar substitui o consultado, então um café com horário de temporada mostra o horário que você conhece.',

  // ── Screen: trip-days ─────────────────────────────────────────────────────────────────
  'help.ctx.trip-days.title': 'Dias',
  'help.ctx.trip-days.summary':
    'A coluna da esquerda do plano: um cartão por dia, com as paradas em ordem, as notas, as reservas e os transportes do dia e a rota entre as paradas. É aqui que a viagem é planejada de fato.',
  'help.ctx.trip-days.bullet.1':
    'O cabeçalho no topo: Exportar (PDF, calendário, GPX) à esquerda; à direita, a seta de desfazer, “Expandir todos os dias” / “Recolher todos os dias”, “Reordenar dias” e, quando alguma reserva tem uma rota para desenhar, “Mostrar todas as rotas de reservas”.',
  'help.ctx.trip-days.bullet.2':
    'Um cartão de dia: um bloco com o número do dia e a previsão do tempo, o título (“Dia 1” até você dar um nome) e a data e, logo abaixo, pílulas para a hospedagem da noite (verde no check-in, vermelha no check-out, tracejada enquanto não estiver confirmada; o bilhete abre a reserva) e para um carro alugado. Clique no cabeçalho para abrir o dia, a seta o recolhe, e o + (“Adicionar ao dia”) abre um menu: “Adicionar local a este dia”, “Adicionar hospedagem”, “Adicionar transporte”, “Transporte público” e “Adicionar nota”. Um clique com o botão direito no cabeçalho oferece o mesmo, além de “Limpar dia”.',
  'help.ctx.trip-days.bullet.3':
    'Dentro de um dia: as paradas em ordem, cada uma com imagem, ícone da categoria, nome, horário e descrição, as reservas ligadas a ela e quem vai; as notas; e as reservas e os transportes do dia, coloridos conforme o tipo. Passe o mouse sobre uma parada para ver a alça de arrastar, o cadeado na imagem, as setas, “Adicionar reserva” e os três pontos (“Mais opções”). Você também pode clicar com o botão direito em paradas e notas para abrir o menu delas.',
  'help.ctx.trip-days.bullet.4':
    'No dia aberto, quando ele tem duas paradas, a barra de rota aparece abaixo delas: Rota mostra o dia no mapa e o tempo de cada trecho entre as paradas, os três ícones definem Carro, “A pé” ou Bicicleta para o dia, e depois vêm Otimizar, “Abrir no Google Maps” e “Abrir no CoMaps”.',
  'help.ctx.trip-days.bullet.5':
    'Você pode adicionar lugares a um dia de várias formas: arrastando uma linha da coluna de lugares, usando “+ Dia” nessa linha, usando “Adicionar local a este dia” no + do dia ou em um dia vazio, ou pelos detalhes do lugar.',
  'help.ctx.trip-days.bullet.6':
    '“Custo total”, no fim, soma as despesas de Custos que pertencem às paradas e reservas do dia, cada uma uma vez só, na sua moeda de exibição.',
  // read-day-plan
  'help.guide.read-day-plan.title': 'Ler um dia',
  'help.guide.read-day-plan.goal': 'Entenda o que cada parte do cartão do dia mostra antes de mudar qualquer coisa.',
  'help.guide.read-day-plan.step.1':
    'O cabeçalho: um bloco com o número do dia e a previsão do tempo, depois “Dia 1” ou o título que você deu, e a data. Abaixo, pílulas para a hospedagem da noite (verde no check-in, vermelha no check-out, tracejada enquanto não estiver confirmada; o bilhete nela abre a reserva) e para um carro alugado. Clique no cabeçalho para abrir o dia (o painel de detalhes abre sobre o mapa). O + à direita (“Adicionar ao dia”) adiciona um lugar, uma hospedagem, um transporte, uma conexão de transporte público ou uma nota, e a seta recolhe o cartão.',
  'help.guide.read-day-plan.step.2':
    'Uma parada mostra a imagem, o ícone da categoria e o nome, depois o horário (quando tiver um Início) e a descrição. As “Notas para este dia” aparecem embaixo. Ao passar o mouse sobre a linha, surgem os controles: a alça à esquerda serve para arrastar, a imagem vira um cadeado para a otimização de rota e, na ponta direita, ficam as setas (“Mover para cima”, “Mover para baixo”), “Adicionar reserva” e os três pontos (“Mais opções”).',
  'help.guide.read-day-plan.step.3':
    'Uma reserva em uma parada aparece nela como um selo Reserva, verde quando confirmada e âmbar enquanto pendente, com o horário e a empresa. Clique no selo para abrir a reserva; o botão de rota ao lado desenha o trajeto dela. Um transporte tem uma linha própria, colorida conforme o tipo, com o horário e Partida ou Chegada. Clique em uma reserva para abrir os detalhes; Editar, ali, permite alterá-la.',
  'help.guide.read-day-plan.step.4':
    'Com Rota ativada, o conector entre duas paradas mostra a duração e a distância do trecho no meio de transporte do dia; clique nele para mudar o meio de transporte só desse trecho.',
  'help.guide.read-day-plan.step.5':
    'A barra de rota abaixo das paradas do dia aberto: Rota desenha o trajeto do dia no mapa, os três ícones escolhem Carro, “A pé” ou Bicicleta, Otimizar reordena as paradas, e “Abrir no Google Maps” e “Abrir no CoMaps” abrem o dia nesses apps.',
  'help.guide.read-day-plan.result':
    'Cada símbolo do cartão tem um significado; os guias abaixo explicam como alterar cada um deles.',
  'help.guide.read-day-plan.tip.1':
    'Clique com o botão direito em uma parada, ou nos três pontos dela, para abrir o menu: Editar, “Remover do dia”, “Tirar da rota”, “Abrir site”, “Salvar na Coleção”, Excluir. Os apps de navegação ficam nos detalhes do lugar, em Navegação.',
  'help.guide.read-day-plan.tip.2':
    'Passe o mouse sobre uma parada e “Adicionar reserva” aparece no fim da linha. A reserva criada ali fica vinculada a essa parada nesse dia.',
  // place-onto-day
  'help.guide.place-onto-day.title': 'Colocar um lugar em um dia',
  'help.guide.place-onto-day.goal': 'Transforme um lugar da lista em parada de um dia, na posição certa da ordem.',
  'help.guide.place-onto-day.step.1':
    'Arraste uma linha da coluna de lugares até o cartão do dia. Solte entre duas paradas para colocá-la exatamente ali, ou no cabeçalho do dia para adicioná-la no fim.',
  'help.guide.place-onto-day.step.2':
    'Sem arrastar: abra o dia clicando no cabeçalho dele e clique no + redondo no fim da linha do lugar (“+ Dia”), ou clique com o botão direito na linha e escolha “+ Dia”.',
  'help.guide.place-onto-day.step.3':
    '“Adicionar local a este dia”, no menu + do dia ou em um dia vazio, abre o formulário de lugar, e o novo lugar já entra no dia na hora.',
  'help.guide.place-onto-day.step.4':
    'Com um dia aberto, “Adicionar ao dia”, nos detalhes de um lugar, coloca o lugar nesse dia; “Para o dia”, no cabeçalho da coluna de lugares, cria um lugar novo direto no dia aberto.',
  'help.guide.place-onto-day.result':
    'O lugar agora é uma parada do dia. Ele aparece no mapa com o número do dia, e a coluna de lugares o conta em Planejado.',
  'help.guide.place-onto-day.tip.1':
    'Um lugar pode estar em vários dias: coloque-o no segundo dia pela coluna de lugares. Já arrastar uma parada de um cartão de dia para outro move a parada.',
  'help.guide.place-onto-day.tip.2': 'A seta de desfazer no cabeçalho desfaz a atribuição.',
  'help.guide.place-onto-day.tip.3':
    'Não é possível soltar uma parada entre dois itens com horário fixo nem antes de uma reserva que já tem horário; o plano continua em ordem cronológica.',
  // reorder-stops
  'help.guide.reorder-stops.title': 'Mudar a ordem de um dia',
  'help.guide.reorder-stops.goal': 'Mova uma parada para cima, para baixo ou para outro dia.',
  'help.guide.reorder-stops.step.1': 'Passe o mouse sobre a parada e arraste-a pela alça até a nova posição no cartão.',
  'help.guide.reorder-stops.step.2':
    'Ou use as setas na ponta direita da parada sob o mouse (“Mover para cima”, “Mover para baixo”): uma posição por clique.',
  'help.guide.reorder-stops.step.3':
    'Arraste a parada até o cartão de outro dia para passá-la para lá; ela sai do dia anterior.',
  'help.guide.reorder-stops.step.4':
    'Se uma parada tem horário fixo e a mudança quebraria a ordem do dia, o TREK pergunta “Remover horário?”, porque é o horário que define a posição da parada. Confirmar remove o horário para que a parada possa ir para qualquer posição. Cancelar deixa o dia como estava.',
  'help.guide.reorder-stops.result': 'A rota e os tempos de deslocamento são atualizados na hora para a nova ordem.',
  'help.guide.reorder-stops.tip.1':
    'Uma reserva com horário fixo fica na posição definida pelo horário. Se você a soltar em outro ponto do dia, ela volta. Se arrastá-la para o cartão de outro dia, ela passa para esse dia.',
  'help.guide.reorder-stops.tip.2':
    'Otimizar, na barra de rota, ordena o dia inteiro pelo caminho mais curto quando o dia tem três paradas ou mais. Trave uma parada antes para mantê-la onde está.',
  // set-stop-times
  'help.guide.set-stop-times.title': 'Definir o horário de uma parada',
  'help.guide.set-stop-times.goal':
    'Defina quando uma parada começa e termina, para o dia funcionar como uma programação.',
  'help.guide.set-stop-times.step.1':
    'Clique com o botão direito na parada, ou nos três pontinhos dela, e escolha “Editar”. Quando você abre o formulário pelo dia, ele traz “Início” e “Fim” para aquele dia, logo abaixo da localização.',
  'help.guide.set-stop-times.step.2':
    'Preencha “Início” e, se quiser, “Fim”. “Sobreposição de horário com:” avisa que outra parada do dia com horário se sobrepõe. Um “Fim” anterior ao “Início” bloqueia “Atualizar”.',
  'help.guide.set-stop-times.step.3':
    'Clique em “Atualizar”. A parada ganha um selo com o horário e vai para a posição certa do dia de acordo com esse horário.',
  'help.guide.set-stop-times.result':
    'As paradas com horário mantêm a posição na ordem; as sem horário se organizam em volta delas.',
  'help.guide.set-stop-times.tip.1':
    'O horário pertence à parada naquele dia; o mesmo lugar em outro dia pode ter outro horário.',
  'help.guide.set-stop-times.tip.2':
    'Para mover manualmente uma parada com horário, arraste-a. O TREK pergunta “Remover horário?”, e quando você clica em Confirmar o horário é removido.',
  'help.guide.set-stop-times.tip.3':
    '“Notas para este dia”, no mesmo formulário, servem para informações que valem só nesse dia, como uma reserva de mesa ou o número de um ingresso.',
  // remove-from-day
  'help.guide.remove-from-day.title': 'Tirar uma parada de um dia',
  'help.guide.remove-from-day.goal': 'Tire um lugar de um dia sem excluí-lo da viagem.',
  'help.guide.remove-from-day.step.1':
    'Clique com o botão direito na parada, ou nos três pontos dela, e escolha “Remover do dia”.',
  'help.guide.remove-from-day.step.2':
    'A parada sai do dia. O lugar continua na coluna de lugares, em “Não planejados” se não estiver em nenhum outro dia.',
  'help.guide.remove-from-day.result':
    'O dia, a rota e o custo dele são atualizados. A seta de desfazer restaura a parada.',
  'help.guide.remove-from-day.tip.1': 'Excluir, no mesmo menu, tira o lugar da viagem inteira, de todos os dias.',
  'help.guide.remove-from-day.tip.2':
    '“Remover do dia” também fica no painel de detalhes do lugar, ao lado de “Adicionar ao dia”.',
  // lock-stop
  'help.guide.lock-stop.title': 'Travar uma parada no lugar',
  'help.guide.lock-stop.goal': 'Mantenha uma parada na posição dela quando a rota for otimizada.',
  'help.guide.lock-stop.step.1':
    'Passe o mouse sobre a imagem da parada e clique no cadeado: “Manter posição durante a otimização da rota”.',
  'help.guide.lock-stop.step.2':
    'Agora “Otimizar” organiza as outras paradas em volta dela. Clique no cadeado de novo (“Clique para desbloquear”) para desbloqueá-la.',
  'help.guide.lock-stop.result': 'O cadeado aparece na imagem; a parada mantém a posição até você destravá-la.',
  'help.guide.lock-stop.tip.1':
    'Uma parada com horário fixo fica travada pelo horário; ela nunca se move na otimização.',
  'help.guide.lock-stop.tip.2':
    'O cadeado só dura até você recarregar a página. Depois disso, todas as paradas são destravadas; só as paradas com horário continuam fixas.',
  // day-note
  'help.guide.day-note.title': 'Adicionar uma nota a um dia',
  'help.guide.day-note.goal': 'Guarde no dia um lembrete, um número de ingresso ou um plano B.',
  'help.guide.day-note.step.1': 'Clique no + no cabeçalho do dia (“Adicionar ao dia”) e escolha “Adicionar nota”.',
  'help.guide.day-note.step.2':
    'Digite o nome da nota no topo da janela, onde está escrito “Obs.”. É esse nome que aparece no cartão do dia. Escreva o resto em “Nota do dia”: a barra de ferramentas acima formata o texto (negrito, listas, links, citações), e “Pré-visualização”, à esquerda, mostra como a linha vai ficar.',
  'help.guide.day-note.step.3':
    'Escolha um “Ícone” e uma “Cor” para diferenciar bem a nota das paradas e clique em “Adicionar”.',
  'help.guide.day-note.step.4':
    'A nota aparece no dia como uma parada: arraste-a para a posição certa ou use as setas dela. Clique nela para editar. Excluir fica na janela e no menu de três pontos ou de clique direito, e antes pergunta “Excluir nota?”.',
  'help.guide.day-note.result': 'A nota faz parte do dia e do PDF, na posição para onde você a arrastou.',
  'help.guide.day-note.tip.1':
    'Os links de uma nota abrem em nova aba, e uma quebra de linha simples continua sendo uma quebra de linha.',
  'help.guide.day-note.tip.2': 'As notas são por dia. Coloque no Colab uma nota que vale para a viagem inteira.',
  // day-route
  'help.guide.day-route.title': 'Mostrar e otimizar a rota do dia',
  'help.guide.day-route.goal':
    'Veja a rota entre as paradas, escolha como vai se deslocar e deixe o TREK organizar a ordem.',
  'help.guide.day-route.step.1':
    'Abra o dia e clique em Rota na barra de rota abaixo das paradas: o trajeto entre as paradas é desenhado no mapa, e os conectores entre elas mostram o tempo e a distância de cada trecho.',
  'help.guide.day-route.step.2':
    'Os três ícones ao lado definem o meio de transporte do dia: Carro, “A pé” ou Bicicleta. Os trechos são recalculados. Plugins podem adicionar outros meios.',
  'help.guide.day-route.step.3':
    'Clique em um conector para mudar o meio de transporte só daquele trecho: escolha um meio, “Transporte público” para buscar uma conexão onde houver essa opção, ou “Usar padrão do dia” para voltar ao meio do dia.',
  'help.guide.day-route.step.4':
    'Otimizar (a seta circular) reordena as paradas pelo caminho mais curto, a partir de três paradas. Paradas com cadeado ou horário fixo ficam onde estão; se houver uma hospedagem no dia, a rota começa nela.',
  'help.guide.day-route.step.5':
    '“Abrir no Google Maps” ou “Abrir no CoMaps” abre o dia inteiro como rota nesse app, para navegar pelo caminho; o CoMaps também usa o meio de transporte do dia.',
  'help.guide.day-route.result':
    'O dia vira uma rota com horários. O “Custo total” e os trechos se atualizam quando a ordem muda.',
  'help.guide.day-route.tip.1':
    'As rotas vêm do OSRM por padrão; o administrador pode configurar o TREK para usar outro serviço de rotas em “Padrões do usuário”.',
  'help.guide.day-route.tip.2':
    'Um trecho sem rota calculada não mostra tempo. Confira se as duas paradas têm coordenadas.',
  'help.guide.day-route.tip.3': 'A seta de desfazer reverte uma otimização.',
  // manage-days
  'help.guide.manage-days.title': 'Adicionar, reordenar e renomear dias',
  'help.guide.manage-days.goal': 'Altere os próprios dias, não só os lugares neles.',
  'help.guide.manage-days.step.1':
    'Os dias vêm das datas da viagem. Mude as datas no formulário de edição da viagem, no Painel, e os dias são adicionados ou removidos no início ou no fim. Antes de remover um dia com conteúdo, uma lista mostra quais dias saem e o que há neles.',
  'help.guide.manage-days.step.2':
    '“Reordenar dias”, no cabeçalho, abre uma lista: arraste um dia pela alça ou use “Mover para cima” e “Mover para baixo”, e ele muda de posição com seus lugares, notas e reservas. Abaixo da lista, Adicionar com a próxima data inclui um dia depois do último com data e estende a viagem em um dia; “Sem data” acrescenta um dia sem data. Uma viagem sem datas tem só “Adicionar dia”.',
  'help.guide.manage-days.step.3':
    '“Excluir dia”, a lixeira no fim de uma linha, pergunta antes. Ele lista o que é excluído junto com o dia: os lugares, as notas e as reservas, uma hospedagem com check-in ou check-out nele e os dias que passam para uma data antes. “Excluir dia” remove o dia, Cancelar o mantém; o último dia não pode ser excluído.',
  'help.guide.manage-days.step.4':
    'Para renomear um dia, abra-o e clique no lápis ao lado do título no painel de detalhes sobre o mapa. O nome substitui “Dia 1” no cartão e no PDF.',
  'help.guide.manage-days.step.5':
    '“Expandir todos os dias” e “Recolher todos os dias”, no cabeçalho, expandem ou recolhem todos os cartões de uma vez. Para recolher só um cartão, clique na seta dele.',
  'help.guide.manage-days.result':
    'As datas ficam presas à posição: quando você sobe um dia, ele fica com a data anterior, e as paradas, notas e reservas dele vão junto.',
  'help.guide.manage-days.tip.1': 'Mover dias pode ser desfeito com a seta de desfazer; excluir um dia, não.',
  'help.guide.manage-days.tip.2':
    '“Custo total”, no fim do plano, soma a viagem inteira; a aba Custos mostra o detalhamento.',
  // bookings-in-plan
  'help.guide.bookings-in-plan.title': 'Entender reservas e transportes no plano',
  'help.guide.bookings-in-plan.goal': 'Veja onde uma reserva aparece depois de criada e em qual tela ela é criada.',
  'help.guide.bookings-in-plan.step.1':
    'Um transporte (voo, trem, balsa, ônibus, carro) é uma linha colorida de acordo com o tipo, com o horário e Partida no dia em que sai ou Chegada no dia em que chega; o globo ao lado mostra o fuso horário, e um voo com escala ganha uma linha por trecho. Em uma conexão de transporte público, clique na seta para ver as linhas dela. Clique em uma linha para abrir a reserva; Editar, ali, permite alterá-la.',
  'help.guide.bookings-in-plan.step.2':
    'Uma reserva vinculada a uma parada (um restaurante, um passeio) aparece como selo “Reserva” nessa parada, com o horário. O selo fica verde quando a reserva está confirmada e âmbar enquanto está pendente. Uma reserva com dia, mas sem parada, ganha uma linha própria no dia.',
  'help.guide.bookings-in-plan.step.3':
    'Uma noite em hotel é uma hospedagem: a pílula dela no cabeçalho do dia fica verde no check-in e vermelha no check-out, e o ícone de bilhete abre a reserva. O painel de detalhes do dia a mostra em Hospedagem, e a rota de cada um desses dias começa ali.',
  'help.guide.bookings-in-plan.step.4':
    'No mapa, o botão de rota em uma linha de reserva desenha o trajeto dela; “Mostrar todas as rotas de reservas”, no cabeçalho, desenha todos.',
  'help.guide.bookings-in-plan.step.5':
    'Para criar: “Adicionar reserva” em uma parada sob o mouse, “Adicionar transporte” e “Transporte público” no menu + do dia, e as abas Reservas e Transportes para a lista completa, com importação e arquivos.',
  'help.guide.bookings-in-plan.result':
    'Cada reserva aparece uma vez no plano. As abas mostram as mesmas reservas em forma de lista.',
  'help.guide.bookings-in-plan.tip.1':
    'Confirmada e pendente é um status que você define na reserva; o plano mostra esse status na parada, e a aba Reservas conta os dois.',
  'help.guide.bookings-in-plan.tip.2':
    'Se você soltar uma reserva com horário em outro ponto do dia, ela volta para a posição do horário. Se arrastá-la para o cartão de outro dia, ela passa para esse dia. Para mudar o horário, edite a reserva.',
  // export-plan
  'help.guide.export-plan.title': 'Exportar o plano',
  'help.guide.export-plan.goal': 'Exporte o plano como documento, para o seu calendário ou para um aparelho de GPS.',
  'help.guide.export-plan.step.1': 'Clique em Exportar, à esquerda da barra de cabeçalho acima dos dias.',
  'help.guide.export-plan.step.2':
    'Documento: PDF abre a visualização de impressão de todos os dias, com paradas, notas e reservas, começando por um mapa geral da rota; “Meu plano em PDF” mantém só aquilo de que você participa. Na visualização, “Quebra de página por dia” começa cada dia em uma página nova, “Notas de transporte” inclui as notas dos seus transportes, e “Salvar como PDF” faz o download.',
  'help.guide.export-plan.step.3':
    'Calendário: “Baixar .ics” salva as reservas como arquivo de calendário. “Assinar calendário” gera um link que o seu app de calendário atualiza automaticamente.',
  'help.guide.export-plan.step.4':
    '“Mapas e GPS” (GPX): “Viagem inteira” exporta lugares, rotas dos dias e trilhas; “Somente lugares”, só os alfinetes; “Dias como rotas”, uma rota por dia, para mapas offline e aparelhos de GPS.',
  'help.guide.export-plan.result': 'O arquivo é baixado; nada muda na viagem.',
  'help.guide.export-plan.tip.1':
    'Para abrir um único dia em um app de mapas, use a barra de rota dele: “Abrir no Google Maps” ou “Abrir no CoMaps”.',
  'help.guide.export-plan.tip.2':
    '“Assinar calendário” exige os feeds de calendário ativados nas suas configurações e permissão para compartilhar a viagem; há um guia sobre isso no Painel.',
  'help.guide.export-plan.tip.3':
    'Para exportar basta ter acesso de leitura: todo membro da viagem pode exportar o PDF, o .ics e o GPX.',

  // ── Screen: trip-place ────────────────────────────────────────────────────────────────
  'help.ctx.trip-place.title': 'Detalhes do lugar',
  'help.ctx.trip-place.summary':
    'O cartão que abre sobre o mapa quando você escolhe um lugar: tudo o que a viagem sabe sobre ele, as estrelas que cada um deu, a imagem e os arquivos, e os botões para adicioná-lo ao dia aberto, abri-lo em um app de mapas ou salvá-lo em uma lista.',
  'help.ctx.trip-place.bullet.1':
    'Clique em uma linha na coluna de lugares, em uma parada dentro de um dia ou em um marcador no mapa, e o cartão abre sobre o mapa. Se você o abrir a partir de um dia, o cartão sabe de qual parada se trata e mostra também os participantes e a reserva dela. Um passeio (uma caminhada, uma cavalgada ou uma caminhada urbana da aba Passeios) abre o próprio cartão de passeio em vez deste.',
  'help.ctx.trip-place.bullet.2':
    'O cabeçalho mostra a imagem redonda, o nome, o endereço em uma linha e rótulos com o que se sabe: aberto ou fechado, a categoria, o horário, o preço, o telefone, o e-mail e as coordenadas. Clique na imagem para usar uma foto sua ou uma dos arquivos do lugar. Clique duas vezes no nome para renomear o lugar. O X à direita fecha o cartão. A imagem, a renomeação, Editar e Excluir só estão disponíveis para viajantes que podem alterar lugares.',
  'help.ctx.trip-place.bullet.3':
    'Logo abaixo: as estrelas que cada viajante deu ao lugar, a descrição e as notas, além de “Notas para este dia” quando a parada tiver uma.',
  'help.ctx.trip-place.bullet.4':
    'Depois vêm “Horário de funcionamento”, “Cor da trilha”, “Dados da trilha” e Arquivos, quando aplicáveis. Enviar, no título Arquivos, adiciona arquivos do seu computador, e a lista também mostra os arquivos fixados nesta parada e os da reserva dela, inclusive a confirmação de um hotel. Plugins podem adicionar linhas próprias abaixo.',
  'help.ctx.trip-place.bullet.5':
    'A fileira de baixo: “Adicionar ao dia” ou “Remover do dia” quando há um dia aberto, depois Navegação (ou o nome do seu app de mapas, se você escolheu um em Configurações), “Abrir site” e “Salvar na Coleção”. À direita, a lixeira vermelha exclui o lugar, e Editar abre o formulário dele.',
  'help.ctx.trip-place.bullet.6':
    'Um lugar escolhido na busca mostra o que o índice do TREK ou o OpenStreetMap sabem sobre ele: “Em aberto” ou Encerrada entre as pílulas do topo, com um anel verde ou vermelho em volta da imagem, conforme o horário local do lugar; o telefone, também como pílula; “Horário de funcionamento” mais abaixo, com o horário de hoje na linha e a semana inteira ao clicar; e o site em “Abrir site”. A avaliação do Google só aparece em lugares encontrados pelo Google, em um TREK com chave do Google. Horário de funcionamento, telefone e e-mail que você mesmo digitou no formulário do lugar substituem os pesquisados e também definem a cor do anel.',
  // read-place
  'help.guide.read-place.title': 'O que o cartão mostra sobre um lugar',
  'help.guide.read-place.goal': 'Veja tudo o que a viagem sabe sobre um lugar, em um só cartão.',
  'help.guide.read-place.step.1':
    'Na coluna de dias, clique na parada que você quer ver. O cartão abre sobre o mapa, e a parada continua destacada no dia.',
  'help.guide.read-place.step.2':
    'No topo: a imagem redonda, o nome e o endereço em uma linha; a dica mostra o endereço completo. As pílulas logo abaixo indicam se o lugar está “Em aberto” ou Encerrada agora, pelo horário local, com um anel verde ou vermelho em volta da imagem. Elas também mostram a categoria, o horário, o telefone e o e-mail (clique para abrir o app de telefone ou de e-mail) e, em telas largas, as coordenadas exatas. O X à direita fecha o cartão.',
  'help.guide.read-place.step.3':
    '“Avaliação” é a primeira seção abaixo do cabeçalho: as estrelas que cada viajante deu ao lugar, com a média e o número de votos. Enquanto ninguém votar, aparece “Ainda sem avaliações”.',
  'help.guide.read-place.step.4':
    'Depois vêm a descrição e, abaixo dela, as notas. As duas são o texto do formulário do lugar, com formatação: listas, links e negrito funcionam.',
  'help.guide.read-place.step.5':
    '“Participantes” mostra quem vai a essa parada. Todo mundo está incluído até você remover alguém.',
  'help.guide.read-place.step.6':
    '“Horário de funcionamento”, mais abaixo: a linha mostra o horário do dia que você está vendo. Clique nela para ver a semana inteira, com esse dia em negrito. “Arquivos” fica ao lado.',
  'help.guide.read-place.result':
    'O cartão fica aberto até você fechá-lo com o X ou escolher outro lugar. O horário da semana continua expandido, e a parada a que ele pertence continua destacada na coluna de dias.',
  'help.guide.read-place.tip.1':
    'Quando você escolhe o lugar na coluna de lugares, o cartão mostra o lugar, não uma parada. Por isso não aparecem participantes, e só as reservas do próprio lugar, como a estadia de um hotel. Escolha a parada dentro do dia para ver tudo.',
  'help.guide.read-place.tip.2':
    'Se você pode alterar lugares, clique duas vezes no nome para renomear o lugar sem abrir o formulário. Enter salva, Esc cancela a alteração.',
  'help.guide.read-place.tip.3':
    'Um lugar digitado manualmente só tem as informações preenchidas no formulário. Clique em Editar e preencha você mesmo Telefone, E-mail e o horário de funcionamento, ou escolha o lugar entre as sugestões em “Buscar lugares…” e clique em Atualizar para que eles sejam pesquisados. A avaliação do Google exige uma chave do Google.',
  // rate-place
  'help.guide.rate-place.title': 'Avaliar um lugar',
  'help.guide.rate-place.goal': 'Dê as suas estrelas a um lugar e veja as avaliações de todos os outros.',
  'help.guide.rate-place.step.1':
    'Abra o lugar. A fileira de estrelas fica logo abaixo do cabeçalho e mostra a média dos votos até agora, com o número de votos entre parênteses.',
  'help.guide.rate-place.step.2':
    'Clique na estrela que quiser. As estrelas se preenchem conforme você passa o ponteiro sobre elas, então você vê qual nota vai dar.',
  'help.guide.rate-place.step.3':
    'Seu voto entra na média na hora, e os rostinhos ao lado mostram quem votou. Passe o mouse sobre a linha para ver as estrelas de cada um.',
  'help.guide.rate-place.step.4':
    'A mesma média aparece na linha do lugar na coluna de lugares, então fica fácil achar os melhores lugares na lista.',
  'help.guide.rate-place.result':
    'Todos da viagem veem as suas estrelas no lugar. A estrela na fileira de filtros acima da lista agora pode mostrar só os lugares com uma avaliação mínima.',
  'help.guide.rate-place.tip.1':
    'Todos os viajantes podem avaliar, mesmo em uma viagem em que só alguns podem alterar lugares.',
  'help.guide.rate-place.tip.2':
    'Clique na estrela que você já deu para remover sua avaliação. Quando ninguém avaliou o lugar, ele volta a mostrar “Ainda sem avaliações”.',
  'help.guide.rate-place.tip.3':
    'Até seis votantes aparecem como rostos ao lado das estrelas. A dica lista todos eles e destaca você.',
  // place-image
  'help.guide.place-image.title': 'Colocar uma imagem sua num lugar',
  'help.guide.place-image.goal': 'Troque a miniatura automática por uma foto sua.',
  'help.guide.place-image.step.1': 'Abra o lugar pela coluna de lugares.',
  'help.guide.place-image.step.2':
    'Aponte para a imagem redonda no cabeçalho: aparece uma câmera, e a dica mostra “Enviar imagem”. Clique e escolha o arquivo. Se o lugar já tiver fotos entre os arquivos, o TREK pergunta antes: “Enviar do dispositivo” ou uma das imagens em “Dos arquivos anexados”.',
  'help.guide.place-image.step.3': 'O topo do cartão passa a mostrar a sua imagem, com um pequeno X vermelho no canto.',
  'help.guide.place-image.step.4':
    'A mesma imagem também aparece na linha do lugar, na coluna de lugares, e no marcador dele no mapa.',
  'help.guide.place-image.result':
    'A sua imagem passa a ser usada para o lugar em todo lado: no cartão, na coluna de lugares, na parada do dia, no marcador no mapa e em uma viagem compartilhada.',
  'help.guide.place-image.tip.1': 'São aceitos JPG, PNG, GIF e WebP, e um HEIC de iPhone é convertido no envio.',
  'help.guide.place-image.tip.2':
    'O X no canto remove a sua imagem, e a imagem automática volta a aparecer. O lugar em si não muda.',
  'help.guide.place-image.tip.3':
    'Se você não adicionou uma imagem, o TREK procura uma pelas coordenadas do lugar. Se não encontrar, mostra o ícone da categoria. Só viajantes que podem alterar lugares podem definir uma imagem.',
  // place-day-assign
  'help.guide.place-day-assign.title': 'Adicionar o lugar ao dia aberto ou tirá-lo',
  'help.guide.place-day-assign.goal': 'Use o botão no cartão em vez de arrastar a linha pelo planejador.',
  'help.guide.place-day-assign.step.1':
    'Clique no cabeçalho de um dia na coluna de dias. Esse dia passa a ser o dia aberto, e o cartão vale para ele.',
  'help.guide.place-day-assign.step.2':
    'Na coluna de lugares, clique em um lugar que não está nesse dia. O cartão dele abre, e a fileira de baixo oferece “Adicionar ao dia”.',
  'help.guide.place-day-assign.step.3':
    'Clique em “Adicionar ao dia”. A parada entra no fim do dia, e o botão muda para “Remover do dia”.',
  'help.guide.place-day-assign.step.4':
    'A parada agora está no dia, no fim da lista. Arraste-a para cima até a posição certa.',
  'help.guide.place-day-assign.step.5':
    '“Remover do dia” tira a parada do dia de novo, e o cartão volta a mostrar “Adicionar ao dia”.',
  'help.guide.place-day-assign.result': 'A parada é adicionada ao dia ou removida dele. O lugar em si não muda.',
  'help.guide.place-day-assign.tip.1':
    'O botão só aparece enquanto um dia estiver aberto. Sem um dia aberto, não há dia ao qual adicionar o lugar.',
  'help.guide.place-day-assign.tip.2':
    'Se você tirar uma parada de um dia, o lugar continua na viagem e na coluna de lugares. Excluir remove o lugar de todos os lugares.',
  'help.guide.place-day-assign.tip.3':
    'Uma parada adicionada ao dia por uma reserva de hospedagem não mostra nenhum dos dois botões. Essa noite é adicionada e removida no bloco de hospedagem do dia.',
  // place-participants
  'help.guide.place-participants.title': 'Definir quem vai a esta parada',
  'help.guide.place-participants.goal': 'Escolha quem vai a uma parada sem mudar quem está na viagem.',
  'help.guide.place-participants.step.1':
    'Clique na parada dentro do dia. O cartão abre e “Participantes” lista todo mundo da viagem.',
  'help.guide.place-participants.step.2':
    'Clique no chip de um viajante para tirá-lo dessa parada. Ao passar o mouse sobre o chip, o nome aparece riscado.',
  'help.guide.place-participants.step.3':
    'Um + tracejado aparece assim que falta alguém. Clique nele para ver quem não está na parada.',
  'help.guide.place-participants.step.4':
    'Clique em um nome para incluir essa pessoa de novo. Quando todos voltarem, a parada volta a ser do grupo inteiro.',
  'help.guide.place-participants.result':
    'A parada mostra só os viajantes escolhidos. O resto do grupo fica livre nesse horário.',
  'help.guide.place-participants.tip.1':
    'Participantes só aparece quando há uma parada selecionada, então escolha o lugar dentro do dia, não na coluna de lugares. Também só aparece em viagens com mais de um viajante.',
  'help.guide.place-participants.tip.2':
    'Se ninguém for escolhido, todos vão. Por isso não dá para tirar o último viajante de uma parada.',
  'help.guide.place-participants.tip.3':
    'Um convidado, que não tem conta própria, pode ser participante como qualquer outra pessoa.',
  // place-booking
  'help.guide.place-booking.title': 'A reserva de uma parada',
  'help.guide.place-booking.goal': 'Veja a reserva de uma parada, abra-a e vincule uma nova reserva a ela.',
  'help.guide.place-booking.step.1':
    'Abra a parada a que a reserva pertence. O cartão a lista em Reservas como um pequeno cartão próprio, com o nome da reserva e Confirmada ou Pendente.',
  'help.guide.place-booking.step.2':
    'O cartão da reserva mostra a Data, o Horário e o “Código da reserva”, rótulos com outros detalhes da reserva (número do voo, plataforma, check-in) e as notas que ela tiver.',
  'help.guide.place-booking.step.3': 'Clique no cartão da reserva. A reserva abre sobre o mapa.',
  'help.guide.place-booking.step.4':
    'Editar, no fim da reserva, abre o formulário dela. Nesse formulário, “Vincular à atribuição do dia” liga uma reserva a uma parada, e ali já aparece esta parada. Feche o formulário.',
  'help.guide.place-booking.step.5':
    'Uma nova reserva para uma parada começa na coluna dos dias: passe o mouse sobre a parada e clique em “Adicionar reserva”, o ícone de bilhete no fim dela. O formulário abre como “Nova reserva”, já vinculado à parada.',
  'help.guide.place-booking.result':
    'A reserva fica vinculada à parada: aparece no cartão e no dia, e os arquivos dela também são listados aqui, em Arquivos.',
  'help.guide.place-booking.tip.1':
    'Uma reserva aparece na parada em que está fixada, e uma reserva de hotel também aparece no hotel, onde quer que você o abra. Uma reserva sem parada aparece na aba Reservas.',
  'help.guide.place-booking.tip.2':
    'Várias reservas podem ficar na mesma parada, por exemplo um almoço e um passeio que saem do mesmo lugar.',
  'help.guide.place-booking.tip.3':
    'Para um trem, um voo ou uma balsa, Editar abre o formulário de transporte, o mesmo da aba Transportes.',
  // place-files
  'help.guide.place-files.title': 'Guardar os ingressos de um lugar junto com ele',
  'help.guide.place-files.goal': 'Anexe o bilhete, o voucher ou o mapa ao lugar a que ele pertence.',
  'help.guide.place-files.step.1':
    'Abra o lugar. Arquivos fica abaixo dos detalhes, ao lado de “Horário de funcionamento” quando o lugar tem horário, e mostra Arquivos enquanto o lugar não tem nenhum.',
  'help.guide.place-files.step.2': 'Clique em Enviar, à direita do título Arquivos, e escolha o arquivo.',
  'help.guide.place-files.step.3': 'O botão mostra quantos arquivos o lugar tem, e a lista abre automaticamente.',
  'help.guide.place-files.step.4': 'Cada linha mostra o nome e o tamanho do arquivo. Clique para abrir o arquivo.',
  'help.guide.place-files.result':
    'O arquivo fica anexado ao lugar e é contado no cartão. Ele também aparece na aba “Arquivos” da viagem.',
  'help.guide.place-files.tip.1':
    'Arquivos também lista o que está fixado nesta parada e o que está anexado à reserva dela, então a confirmação do hotel aparece no próprio hotel.',
  'help.guide.place-files.tip.2':
    'Enviar aceita vários arquivos de uma vez, e qualquer foto entre eles pode virar a imagem do lugar.',
  'help.guide.place-files.tip.3':
    'Se você não tiver permissão para enviar arquivos, o botão “Enviar” não aparece; os arquivos que já estão no lugar continuam aparecendo.',
  // place-navigation
  'help.guide.place-navigation.title': 'Abrir um lugar em um app de mapas ou no site dele',
  'help.guide.place-navigation.goal': 'Abra o lugar no app de navegação que você usa para chegar lá.',
  'help.guide.place-navigation.step.1': 'Abra o lugar e clique em Navegação, na fileira de baixo.',
  'help.guide.place-navigation.step.2':
    'A lista mostra os apps de mapas que servem para este lugar: Google Maps, Waze, Apple Maps, OpenStreetMap e CoMaps, além de “Outro app de mapas” no Android.',
  'help.guide.place-navigation.step.3':
    'Clique no app que você usa. Sempre que possível, o TREK envia ao app o próprio lugar, não só as coordenadas, para você chegar na entrada certa.',
  'help.guide.place-navigation.step.4':
    '“Abrir site”, ao lado, abre o site do próprio lugar, com horários e ingressos, em uma nova aba.',
  'help.guide.place-navigation.result':
    'O app de mapas abre no lugar, o site abre em uma nova aba, e nada muda na viagem. Se o TREK estiver instalado como app, o app de mapas abre em vez de uma nova aba.',
  'help.guide.place-navigation.tip.1':
    'O Waze começa a navegação na hora. Os outros apps abrem o lugar, e você toca mais uma vez para iniciar a navegação.',
  'help.guide.place-navigation.tip.2':
    'Os apps oferecidos dependem do lugar e do seu dispositivo: o Apple Maps não aparece no Android, o 高德地图 só aparece para lugares na China, e Waze, Apple Maps e CoMaps precisam das coordenadas do lugar. “Outro app de mapas” abre o lugar em qualquer app de mapas do seu Android.',
  'help.guide.place-navigation.tip.3':
    'Escolha seu app de mapas uma vez em Configurações, em “Abrir lugares em”. O botão passa a mostrar o nome dele e o abre direto. Ele faz o mesmo quando só um app serve para o lugar.',
  // place-to-collection
  'help.guide.place-to-collection.title': 'Salvar um lugar numa das suas listas',
  'help.guide.place-to-collection.goal': 'Guarde para a próxima viagem um lugar que você encontrou nesta.',
  'help.guide.place-to-collection.step.1':
    'Abra o lugar e clique em “Salvar na Coleção” na fileira da parte de baixo do cartão.',
  'help.guide.place-to-collection.step.2':
    '“Salvar na lista” mostra todas as listas suas ou compartilhadas com você. Um marcador preenchido à direita indica as listas que já têm este lugar.',
  'help.guide.place-to-collection.step.3': 'Clique na lista. O lugar é adicionado a ela na hora.',
  'help.guide.place-to-collection.step.4': 'Feche a janela com o X; o botão no cartão passa a mostrar Salvo.',
  'help.guide.place-to-collection.result':
    'O lugar está na sua lista, com a imagem, as notas e o endereço, pronto para a próxima viagem.',
  'help.guide.place-to-collection.tip.1':
    'O botão só aparece enquanto o complemento Coleções estiver ativado, o que o administrador faz em Complementos.',
  'help.guide.place-to-collection.tip.2':
    'Um lugar pode estar em várias listas ao mesmo tempo, com um status diferente em cada uma: ideia em uma, visitado em outra.',
  'help.guide.place-to-collection.tip.3':
    '“Marcar como visitado”, abaixo do nome do lugar no topo do seletor, marca o lugar como visitado na lista. Se o lugar estiver em várias das suas listas, o botão mostra “Visitado em todas” e marca em todas de uma vez. Visualização abre suas listas em Coleções.',
  // place-track
  'help.guide.place-track.title': 'Ver uma trilha e dar uma cor própria a ela',
  'help.guide.place-track.goal': 'Veja a extensão de uma caminhada importada e qual linha do mapa é essa caminhada.',
  'help.guide.place-track.step.1':
    'Na coluna de lugares, a linha de uma trilha mostra um traço curto na cor em que ela aparece no mapa. Clique nela.',
  'help.guide.place-track.step.2': '“Dados da trilha” mostra o comprimento do percurso, nas unidades que você definiu.',
  'help.guide.place-track.step.3':
    '“Cor da trilha”, logo acima, mostra a cor em uso. Clique na linha para abrir as amostras de cor.',
  'help.guide.place-track.step.4': 'Escolha uma cor. A linha no mapa e o traço na linha da lista mudam junto.',
  'help.guide.place-track.step.5':
    'A célula tracejada à esquerda, “Cor automática”, volta a trilha para a cor padrão. O conta-gotas à direita abre o seletor de cores do sistema para qualquer outra cor.',
  'help.guide.place-track.result':
    'A trilha aparece na cor que você escolheu: no cartão, na linha dela na coluna de lugares e no mapa.',
  'help.guide.place-track.tip.1':
    'Só um lugar com percurso tem esses dois blocos: um lugar importado de um arquivo GPX, KML ou KMZ antes de existir Passeios, ou em um TREK com Passeios desativado. Com Passeios ativado, um novo arquivo GPX vira um passeio, que abre o próprio cartão de passeio.',
  'help.guide.place-track.tip.2':
    'Uma trilha gravada com altitude também mostra o ponto mais alto e o mais baixo, os metros de subida e de descida e o perfil da caminhada.',
  'help.guide.place-track.tip.3':
    'Cada importação dá uma cor própria a cada trilha que adiciona, então duas caminhadas nunca ficam com a mesma cor.',
  // read-place
  'help.guide.read-place.step.7':
    'A fileira de baixo reúne o que você pode fazer daqui: colocar o lugar no dia aberto ou tirá-lo, abri-lo em um app de mapas ou no site dele, salvá-lo em uma lista e, à direita, excluí-lo (a lixeira vermelha) ou editá-lo.',

  // ── Screen: trip-files ────────────────────────────────────────────────────────────────
  'help.ctx.trip-files.title': 'Arquivos',
  'help.ctx.trip-files.summary':
    'Todos os documentos da viagem numa só lista: passagens, confirmações, passes e imagens. Cada um tem uma observação, um vínculo com o lugar ou a reserva a que pertence e uma lixeira de onde você pode restaurá-lo.',
  'help.ctx.trip-files.bullet.1':
    '“Solte os arquivos aqui”, a caixa tracejada abaixo da barra, recebe os arquivos que você soltar nela. Um clique nela abre o seletor de arquivos. A caixa mostra os tipos de arquivo que este TREK aceita e o limite por arquivo (máx. 50 MB, a menos que um administrador tenha definido outro).',
  'help.ctx.trip-files.bullet.2':
    'A barra no topo traz Arquivos e as abas de filtro Todos, PDFs, Imagens e Documentos, cada uma com sua contagem. Uma aba de estrela aparece depois de Todos assim que um arquivo é favoritado, e uma aba “Notas Colab” aparece no fim assim que uma nota tem anexo.',
  'help.ctx.trip-files.bullet.3':
    'Cada linha mostra uma miniatura ou o tipo do arquivo, quem o enviou, o nome, a nota logo abaixo, o tamanho e a data, e um selo por vínculo: o lugar, a reserva ou o transporte pelo nome (passe o mouse para ver “Plano do dia”, Reserva ou Transporte), e “Das notas Colab”.',
  'help.ctx.trip-files.bullet.4':
    'No fim de uma linha há até cinco ícones, cada um com nome quando você aponta para ele: Favoritar, Atribuir (o lápis), Abrir, Baixar e Excluir. Excluir não pede confirmação: o arquivo vai para a lixeira, de onde pode ser restaurado. Offline, notas, links, estrelas e a lixeira continuam funcionando e são enviados quando o TREK voltar a ficar online; só enviar arquivos e remover outro vínculo exigem conexão.',
  'help.ctx.trip-files.bullet.5':
    'Uma imagem ou um vídeo abre em tela cheia, com as setas do teclado e uma fileira de miniaturas. Qualquer outro documento abre em uma janela com o nome no topo e “Abrir em nova aba” e Baixar abaixo. Um passe de carteira digital é baixado na hora.',
  'help.ctx.trip-files.bullet.6':
    'O ícone de lixeira na ponta direita da barra (“Lixeira”) mostra os arquivos excluídos. Ali você restaura cada um ou o exclui de vez, e “Esvaziar lixeira”, na barra, exclui todos. “Sincronização de documentos” fica à esquerda do ícone de lixeira quando a viagem está conectada a um repositório de documentos, ou, para o dono da viagem ou um administrador, assim que algum repositório é ativado.',
  // files-upload
  'help.guide.files-upload.title': 'Adicionar um documento à viagem',
  'help.guide.files-upload.goal':
    'Envie para a viagem uma passagem, uma confirmação ou uma foto da sua pasta de downloads, para que todos na viagem possam abrir.',
  'help.guide.files-upload.step.1':
    'Abra a viagem e clique em “Arquivos” na barra de abas. Os documentos da viagem aparecem ali, com a área de envio logo acima.',
  'help.guide.files-upload.step.2':
    'Clique em “Solte os arquivos aqui” e escolha um ou mais arquivos. Eles são enviados um depois do outro, e a caixa mostra “Enviando...” durante o envio. Dentro da caixa, abaixo de “ou clique para escolher”, aparecem os tipos de arquivo que este TREK aceita e o tamanho máximo por arquivo.',
  'help.guide.files-upload.step.3':
    'Quando o último arquivo termina de subir, “Atribuir arquivo” abre automaticamente para ele (se a viagem tiver lugares ou reservas), com o nome do arquivo no topo da janela. “Adicione uma nota...”, em Obs., adiciona uma nota ao arquivo, e as listas abaixo o vinculam a um lugar ou a uma reserva. Feche com o × no canto superior direito; fechar não faz perder nada.',
  'help.guide.files-upload.step.4':
    'Os arquivos novos aparecem no topo da lista; só os favoritados ficam acima deles. Cada linha mostra quem enviou o arquivo, o nome, o tamanho e a data. Uma imagem ganha miniatura; os outros arquivos mostram o tipo.',
  'help.guide.files-upload.result':
    'Os documentos estão na viagem, e todos que podem ver a viagem podem abri-los e baixá-los.',
  'help.guide.files-upload.tip.1':
    'Você também pode arrastar um arquivo da área de trabalho direto para a caixa. A caixa fica destacada enquanto o arquivo está sobre ela.',
  'help.guide.files-upload.tip.2':
    'Pressione Ctrl+V para colar na lista uma imagem da área de transferência, sem precisar salvar antes a captura de tela de uma reserva.',
  'help.guide.files-upload.tip.3':
    'Para enviar arquivos é preciso ter permissão de envio; sem ela, a caixa nem aparece. Um tipo que não está na lista é recusado com uma mensagem, e nada é enviado. Um arquivo acima do limite (50 MB, a menos que um administrador tenha definido outro) é recusado antes do envio, e a mensagem informa o limite. Enviar também exige conexão: offline, o TREK avisa e não envia nada.',
  // files-link
  'help.guide.files-link.title': 'Vincular um documento a um lugar ou a uma reserva',
  'help.guide.files-link.goal':
    'Deixe a passagem fácil de achar a partir do dia a que ela pertence, e não só por esta lista.',
  'help.guide.files-link.step.1':
    'Clique no lápis no fim da linha (Atribuir). “Atribuir arquivo” abre, com o nome do arquivo no topo da janela.',
  'help.guide.files-link.step.2':
    'Em Obs., “Adicione uma nota...” aceita uma linha, que depois aparece abaixo do nome do arquivo na lista. Ela é salva quando você pressiona Enter ou sai do campo.',
  'help.guide.files-link.step.3':
    'Em Lugar, à esquerda, aparecem os lugares da viagem, agrupados por dia, com a data, e “Não atribuído” no fim, para os lugares que não estão em nenhum dia. Clique em um para marcá-lo.',
  'help.guide.files-link.step.4':
    'Em “Reserva” e “Transporte”, à direita, ficam as reservas da viagem. Clique na reserva a que o documento pertence. Ela também ganha um ✓.',
  'help.guide.files-link.step.5':
    'Feche com o × no canto superior direito. Aqui não há botão de salvar: cada clique já foi salvo na hora.',
  'help.guide.files-link.result':
    'A linha mostra a nota e um selo por vínculo: um com o nome do lugar e outro com o nome do voo. Ao passar o mouse sobre um selo, aparece “Plano do dia” ou “Transporte”. O documento também fica anexado ao lugar e ao voo.',
  'help.guide.files-link.tip.1':
    'Um arquivo pode ter vários vínculos ao mesmo tempo, então a mesma confirmação pode estar ligada à reserva do hotel e ao lugar do hotel.',
  'help.guide.files-link.tip.2':
    'Clique de novo em uma entrada marcada para remover esse vínculo; o arquivo em si continua. Offline, a nota e as novas marcações são salvas e enviadas quando o TREK voltar a ficar online; só remover outro vínculo exige conexão.',
  'help.guide.files-link.tip.3':
    'Também funciona ao contrário: um documento anexado a um lugar ou a uma reserva também aparece nesta lista, com o mesmo selo na linha.',
  // files-star
  'help.guide.files-star.title': 'Manter os documentos importantes no topo',
  'help.guide.files-star.goal':
    'Marque os poucos documentos de que você vai mesmo precisar, para encontrá-los rápido em uma lista longa.',
  'help.guide.files-star.step.1':
    'Clique na estrela no fim de uma linha (“Favoritar”). Ela fica dourada, uma segunda estrela aparece antes do nome do arquivo e, ao passar o mouse sobre o botão, ele passa a mostrar “Remover favorito”.',
  'help.guide.files-star.step.2':
    'A lista é reordenada: os arquivos favoritados ficam acima de todos os outros, com os mais novos primeiro em cada grupo.',
  'help.guide.files-star.step.3':
    'Uma estrela aparece nas abas de filtro da barra, logo depois de “Todos”, com o número de arquivos favoritados ao lado. Clique nela para ver só esses arquivos.',
  'help.guide.files-star.result':
    'Os arquivos favoritados aparecem no topo da lista, e uma das abas mostra só os favoritos.',
  'help.guide.files-star.tip.1':
    'A aba de estrela só existe enquanto houver um arquivo favoritado. Quando você tira o favorito do último arquivo, a aba some.',
  'help.guide.files-star.tip.2':
    'Favoritar exige a mesma permissão de Atribuir, “Editar metadados do arquivo”. Um membro sem ela vê as estrelas, mas um clique em Favoritar não muda nada para ele.',
  // files-filter
  'help.guide.files-filter.title': 'Encontrar um documento na lista',
  'help.guide.files-filter.goal': 'Mostre só o tipo de documento que você está procurando.',
  'help.guide.files-filter.step.1':
    'As abas de filtro ficam na barra do topo, ao lado de Arquivos: Todos, PDFs, Imagens e Documentos, cada uma com o número de arquivos ao lado.',
  'help.guide.files-filter.step.2': 'Clique em PDFs: a lista mostra só os arquivos PDF.',
  'help.guide.files-filter.step.3':
    'Outras duas abas só aparecem quando a viagem tem arquivos correspondentes. Clique em “Notas Colab”, que aparece assim que uma nota da aba “Colab” tem um anexo: a lista passa a mostrar só esses arquivos. A aba de estrela aparece do mesmo jeito, assim que um arquivo é favoritado.',
  'help.guide.files-filter.step.4': 'Todos traz a lista inteira de volta.',
  'help.guide.files-filter.result':
    'A lista mostra só os arquivos da aba selecionada, e a contagem em cada aba mostra quantos são.',
  'help.guide.files-filter.tip.1':
    'Aqui não há pastas, e os arquivos não podem ser renomeados. Para diferenciar os documentos, use a nota em “Atribuir arquivo”, os vínculos com lugares e reservas, e a estrela.',
  'help.guide.files-filter.tip.2':
    'A lista sempre mostra os favoritos primeiro e depois os mais recentes, então um documento enviado hoje aparece acima de um do mês passado.',
  // files-preview
  'help.guide.files-preview.title': 'Ler um documento sem sair do TREK',
  'help.guide.files-preview.goal':
    'Veja uma passagem ou uma imagem na hora e baixe para o seu dispositivo quando precisar dela lá.',
  'help.guide.files-preview.step.1':
    'Clique no nome de uma imagem ou na miniatura dela. Ela abre em tela cheia, com o nome do arquivo e a posição dela entre as imagens no canto superior esquerdo. Um vídeo abre do mesmo jeito e é reproduzido ali.',
  'help.guide.files-preview.step.2':
    'Use as setas redondas nas laterais, as teclas de seta para a esquerda e para a direita ou a faixa de miniaturas embaixo para passar por todas as imagens que a lista está mostrando.',
  'help.guide.files-preview.step.3':
    '“Abrir em nova aba” e Baixar são os botões redondos no canto superior direito, ao lado do ×. Clique no ×, pressione Esc ou clique no fundo escuro para fechar a imagem.',
  'help.guide.files-preview.step.4':
    'Um documento que não é imagem abre em uma janela: o nome no topo, com “Abrir em nova aba” e Baixar em pílulas logo abaixo e, no caso de um PDF, a própria página embaixo. O × no canto superior direito, Esc ou um clique fora da janela a fecham.',
  'help.guide.files-preview.step.5':
    'A seta no fim de uma linha (Baixar) salva o arquivo direto no seu dispositivo, sem abri-lo antes.',
  'help.guide.files-preview.result':
    'O documento aparece na tela, e os mesmos dois botões o abrem em uma aba do navegador ou o salvam no seu computador.',
  'help.guide.files-preview.tip.1': 'Numa tela sensível ao toque, deslize entre as imagens em vez de clicar nas setas.',
  'help.guide.files-preview.tip.2':
    'Um passe de carteira digital nunca abre em pré-visualização. Ele é baixado na hora, para o celular abri-lo no app de carteira.',
  'help.guide.files-preview.tip.3':
    '“Abrir em nova aba” e “Baixar” carregam o arquivo com a sua sessão, então um link copiado da barra de endereços não funciona para outras pessoas.',
  // files-trash
  'help.guide.files-trash.title': 'Excluir um documento e restaurá-lo',
  'help.guide.files-trash.goal':
    'Exclua o que a viagem não precisa mais e restaure os arquivos de que você ainda precisa.',
  'help.guide.files-trash.step.1':
    'Clique na lixeira no fim de uma linha (Excluir). O arquivo sai da lista na hora, e aparece a mensagem “Movido para a lixeira”. Não há pergunta de confirmação.',
  'help.guide.files-trash.step.2':
    'O ícone de lixeira na ponta direita da barra (“Lixeira”) mostra os arquivos excluídos. O título da barra passa a ser “Lixeira”, e as abas de filtro e a caixa de envio ficam ocultas.',
  'help.guide.files-trash.step.3':
    'Uma linha na lixeira fica acinzentada e tem dois ícones: “Restaurar”, que restaura o arquivo, e “Excluir”, que o apaga definitivamente depois de uma confirmação.',
  'help.guide.files-trash.step.4':
    'Clique em “Restaurar”. Aparece a mensagem “Arquivo restaurado”, e o arquivo sai da lixeira. A nota e os vínculos dele continuam.',
  'help.guide.files-trash.step.5':
    '“Esvaziar lixeira”, na barra ao lado do ícone de lixeira, exclui de vez tudo o que ainda está na lixeira. O navegador pede confirmação uma vez antes disso. O ícone de lixeira volta para os arquivos.',
  'help.guide.files-trash.result': 'O arquivo volta para a lista, no lugar onde estava.',
  'help.guide.files-trash.tip.1':
    'Excluir em uma linha não pede confirmação. É por isso que existe a lixeira: nada sai do TREK até você excluir aqui. Tudo isso também funciona offline e é enviado quando o TREK voltar a ficar online.',
  'help.guide.files-trash.tip.2':
    'Excluir e restaurar arquivos exige permissão para excluir arquivos. Um membro sem ela não vê Excluir na linha nem os botões da lixeira.',
  'help.guide.files-trash.tip.3': 'Um arquivo excluído de vez na lixeira não pode ser recuperado.',
  // files-sync
  'help.guide.files-sync.title': 'Sincronizar os documentos com o seu repositório de documentos',
  'help.guide.files-sync.goal':
    'Conecte a viagem ao seu próprio repositório de documentos, para que os arquivos enviados aqui sejam salvos lá e os arquivos salvos lá apareçam aqui.',
  'help.guide.files-sync.step.1':
    'Clique em “Sincronização de documentos”, ao lado do ícone da lixeira, na ponta direita da barra. A janela abre com o nome da viagem abaixo do título. À esquerda, em “Conectar um provedor”, ficam os repositórios que um administrador ativou, cada um com uma linha explicando como guarda os arquivos: Paperless-ngx e Papra por etiqueta, Nextcloud e Synology Drive em uma pasta, OpenCloud em um espaço. À direita aparece “Nada conectado ainda”.',
  'help.guide.files-sync.step.2':
    'Clique no seu serviço de armazenamento, aqui o Nextcloud. Abre uma janela menor para a conexão, com o nome do serviço, pedindo os dados de login que ele exige.',
  'help.guide.files-sync.step.3':
    'Preencha Endereço e o login do repositório: um “Token de API” para o Paperless-ngx, uma “Chave de API” e o “ID da organização” para o Papra, “Nome de usuário” e uma “Senha de aplicativo” para o Nextcloud, “Nome de usuário” e um “Token de aplicativo” para o OpenCloud e, para o Synology Drive, “Nome de usuário”, Senha e, se a conta pedir, um “Código de dois fatores”. Use senha ou token de aplicativo sempre que o repositório oferecer, nunca a senha da sua conta. Nextcloud e Synology Drive também aceitam uma “Pasta base” opcional, onde o TREK procura as pastas das viagens, aqui /Reisen. “Aceitar certificado autoassinado”, no fim, é só para um repositório na sua própria rede com esse tipo de certificado.',
  'help.guide.files-sync.step.4':
    'Clique em “Testar conexão”. O TREK se conecta ao repositório com o que você digitou, e o rodapé mostra “Acessado, conectado como”, seguido do nome da conta. Se as credenciais forem recusadas ou o endereço não puder ser alcançado, o rodapé avisa isso. Nos dois casos, nada é salvo.',
  'help.guide.files-sync.step.5':
    'Clique em Conectar. A conexão fica salva com a viagem, e o TREK pergunta onde ficam os documentos da viagem no repositório: a etiqueta, a pasta ou o espaço que os reúne. Só o que estiver ali é sincronizado. “Criar um novo” cria um quando você clica em Criar, com um nome tirado do título da viagem. Em “Ou use um que você já tem”, aparecem os existentes. Clique em um, aqui a pasta Autumn in Japan.',
  'help.guide.files-sync.step.6':
    'A janela abre de novo: o seu repositório aparece em “Esta viagem”, à esquerda, e o cartão dele, à direita, mostra para onde ele sincroniza, quando foi a última sincronização e “Sincronizar agora”. A primeira sincronização começa automaticamente. Clique em “Sincronizar agora” para sincronizar quando quiser. Depois de uma sincronização, o selo “Ainda não sincronizado” ao lado do nome vira um ponto verde, que mostra “Em sincronia” quando você passa o mouse. A barra de fluxo mostra quantos documentos o TREK e o repositório têm, com as faixas “Saída para o repositório” e “Entrada do repositório” entre eles. Feche a janela no × do canto superior direito.',
  'help.guide.files-sync.result':
    'Os documentos que já estavam no repositório aparecem no topo da lista, enviados em seu nome, e todos os documentos da viagem também ficam no repositório, exceto os das Notas Colab. A partir de agora, o TREK verifica o repositório em segundo plano, e as alterações na lista são copiadas para o repositório.',
  'help.guide.files-sync.tip.1':
    'Só o dono da viagem ou um administrador da instância pode conectar uma viagem, porque as credenciais dão acesso à conta inteira no repositório. Depois que a viagem está conectada, todos os membros veem “Sincronização de documentos” e podem abrir a janela, ler o cartão e clicar em “Sincronizar agora”.',
  'help.guide.files-sync.tip.2':
    'Um serviço na sua própria rede precisa de ALLOW_INTERNAL_NETWORK=true no servidor do TREK, e o endereço dele tem que ser o endereço da máquina na rede, nunca localhost. Sem isso, “Testar conexão” responde “Esse endereço não é permitido.”',
  'help.guide.files-sync.tip.3':
    'Desconectar, o ícone ao lado de “Sincronizar agora”, pede confirmação uma vez. Depois, encerra a conexão e mantém todos os documentos dos dois lados. Se você conectar uma etiqueta, pasta ou espaço pela segunda vez, o TREK trata como novo e importa tudo o que há nele de novo. Por isso, depois de desconectar, conecte um vazio, não o antigo.',

  // ── Screen: trip-day-detail ───────────────────────────────────────────────────────────
  'help.ctx.trip-day-detail.title': 'Detalhes do dia',
  'help.ctx.trip-day-detail.summary':
    'O painel que abre sobre o mapa quando você clica no cabeçalho de um dia. Ele mostra o dia como um todo: o nome e a data, o tempo onde você vai estar, as reservas desse dia e as noites reservadas para ele.',
  'help.ctx.trip-day-detail.bullet.1':
    'Clique no cabeçalho de um dia na coluna de dias, e o painel abre sobre o centro do mapa. Clique de novo no mesmo cabeçalho, ou no X à direita, para fechar o painel e desmarcar o dia. Abrir um lugar, pela coluna de lugares ou pelo mapa, fecha o painel e mostra o lugar.',
  'help.ctx.trip-day-detail.bullet.2':
    'O cabeçalho mostra o nome e a data do dia. O lápis ao lado do nome renomeia o dia. A seta dupla recolhe o painel em uma barra estreita para você voltar a ver o mapa.',
  'help.ctx.trip-day-detail.bullet.3':
    'No topo, você vê a previsão do tempo do dia. “Previsão para” mostra a que lugar ela se refere: a primeira parada do dia ou o hotel onde você acorda.',
  'help.ctx.trip-day-detail.bullet.4':
    'Reservas lista as reservas desse dia, cada uma com o tipo, a parada a que pertence e os horários. Verde indica confirmada, âmbar ainda pendente, e um trajeto de transporte público aparece em azul, sem status. Um clique em uma linha abre a reserva.',
  'help.ctx.trip-day-detail.bullet.5':
    'Hospedagem mostra cada noite reservada que abrange este dia, com Check-in e Check-out nos dias em que acontecem, o horário de check-in, o horário de check-out e o número de confirmação. Quando a estadia tem uma reserva, uma caixa Reserva logo abaixo mostra a reserva, com Pendente ou Confirmada. Clique nela para abrir a reserva.',
  'help.ctx.trip-day-detail.bullet.6':
    '“Adicionar hospedagem” adiciona um pernoite neste dia: escolha o estabelecimento entre os lugares da viagem, os dias que ele cobre e informe os horários e o código. O + no cabeçalho de um dia, com a dica “Adicionar ao dia”, também tem “Adicionar hospedagem”: ele abre este painel com o formulário já aberto.',
  // day-panel
  'help.guide.day-panel.title': 'Abrir um dia e ver os detalhes',
  'help.guide.day-panel.goal':
    'Veja um dia inteiro, com a previsão do tempo, as reservas e onde você vai dormir, sem sair do mapa.',
  'help.guide.day-panel.step.1':
    'Clique no cabeçalho de um dia na coluna de dias. O dia fica selecionado e os detalhes dele abrem sobre o centro do mapa.',
  'help.guide.day-panel.step.2':
    'O cabeçalho mostra o nome do dia (“Dia 1” até você dar um nome a ele) e, logo abaixo, a data.',
  'help.guide.day-panel.step.3':
    'A previsão do tempo do dia fica no topo. “Previsão para” mostra a que lugar ela se refere: a primeira parada do dia ou o hotel onde você passou a noite anterior.',
  'help.guide.day-panel.step.4': 'Reservas, logo abaixo, lista as reservas desse dia, com os horários.',
  'help.guide.day-panel.step.5':
    'Hospedagem mostra as noites reservadas que abrangem este dia, com Check-in e Check-out nos dias em que acontecem.',
  'help.guide.day-panel.step.6':
    'A seta dupla no cabeçalho recolhe o painel em uma barra estreita. O X ao lado fecha o painel e desmarca o dia.',
  'help.guide.day-panel.result':
    'Quando você recolhe o painel até a barra, o mapa fica livre e o dia continua selecionado. Quando você fecha o painel, o dia deixa de estar selecionado e o plano fica como estava.',
  'help.guide.day-panel.tip.1':
    'Clicar em qualquer ponto da barra de cabeçalho do painel também o recolhe. A setinha é só uma das formas de fazer isso.',
  'help.guide.day-panel.tip.2':
    'Quando você abre um lugar, pela coluna de lugares ou pelo mapa, o painel do dia fecha e os detalhes do lugar aparecem no lugar dele. Clique de novo no cabeçalho do dia para voltar a vê-lo.',
  // day-weather
  'help.guide.day-weather.title': 'Ver a previsão do tempo do dia',
  'help.guide.day-weather.goal': 'Veja a previsão do tempo para o lugar onde você realmente vai estar naquele dia.',
  'help.guide.day-weather.step.1':
    '“Previsão para” mostra a que lugar os números se referem: a primeira parada do dia ou, em um dia sem parada, o hotel onde você dorme na noite anterior.',
  'help.guide.day-weather.step.2':
    'O número grande é a temperatura do dia. Ao lado ficam a mínima, a máxima e a condição do tempo por extenso.',
  'help.guide.day-weather.step.3':
    'As etiquetas à direita mostram a chance de chuva, quanto deve chover, o vento mais forte e os horários do nascer e do pôr do sol.',
  'help.guide.day-weather.step.4':
    'Embaixo, o dia hora a hora, de duas em duas horas: o horário, o ícone, a temperatura e a chance de chuva. As horas acima de 50 por cento ficam sombreadas de azul.',
  'help.guide.day-weather.result':
    'O cartão do dia na coluna de dias também mostra a previsão do tempo em letra pequena abaixo do número, para você ver rapidinho o tempo da viagem inteira.',
  'help.guide.day-weather.tip.1':
    'Os graus e o vento seguem a “Unidade de temperatura”, em “Exibição” nas Configurações: se você escolher °F Fahrenheit, a mesma previsão aparece em °F e mph.',
  'help.guide.day-weather.tip.2':
    'Um dia sem parada localizada e sem hotel na noite anterior não mostra previsão nenhuma: a previsão é sempre de um lugar, nunca da viagem.',
  'help.guide.day-weather.tip.3':
    'Com mais de 16 dias de antecedência, não há previsão disponível. Os números passam a ser as médias de anos anteriores para aquela data. Eles aparecem marcados com Ø, e uma nota logo abaixo avisa isso.',
  // rename-day
  'help.guide.rename-day.title': 'Dar um nome ao dia',
  'help.guide.rename-day.goal': 'Dê a um dia um nome como “Chegada em Kyoto” ou “Dia de descanso” em vez de “Dia 5”.',
  'help.guide.rename-day.step.1': 'Abra o dia. O cabeçalho mostra “Dia 5”, com a data embaixo.',
  'help.guide.rename-day.step.2': 'Clique no lápis ao lado do nome.',
  'help.guide.rename-day.step.3': 'O nome vira um campo editável. Digite o nome que quiser.',
  'help.guide.rename-day.step.4':
    'Pressione Enter ou clique em outro lugar. Esc cancela a alteração. O cartão do dia, na coluna de dias, também passa a mostrar o nome.',
  'help.guide.rename-day.result':
    'O nome substitui “Dia 5” no painel e no cartão do dia, na coluna de dias; a data não muda.',
  'help.guide.rename-day.tip.1':
    'Se você apagar o campo e salvar, o dia volta a se chamar “Dia 5”: o número aparece quando não há nome.',
  'help.guide.rename-day.tip.2':
    'O nome pertence ao dia, não à data. Se você reordenar os dias, o nome vai junto com todo o resto daquele dia.',
  // add-accommodation
  'help.guide.add-accommodation.title': 'Reservar uma noite num dia',
  'help.guide.add-accommodation.goal':
    'Adicione o hotel ao plano uma única vez, com os dias que ele cobre, os horários e o número de confirmação.',
  'help.guide.add-accommodation.step.1':
    'Primeiro, a hospedagem precisa ser um lugar da viagem. Crie-a na coluna de lugares como qualquer outro lugar: o seletor só oferece lugares que já existem.',
  'help.guide.add-accommodation.step.2': 'Abra o dia da chegada e clique em “Adicionar hospedagem”, em Hospedagem.',
  'help.guide.add-accommodation.step.3':
    '“Aplicar aos dias” define quais noites a estadia cobre: Início é o dia do check-in, Fim o dia do check-out, e Todos cobre a viagem inteira. O topo da janela mostra o período e o número de noites.',
  'help.guide.add-accommodation.step.4':
    'Preencha Check-in, Até e Check-out, e coloque o número da reserva em Confirmação. Os quatro podem ficar em branco.',
  'help.guide.add-accommodation.step.5':
    'Escolha o estabelecimento em “Selecionar hospedagem”. Categoria, acima da lista, filtra por uma categoria.',
  'help.guide.add-accommodation.step.6': 'Clique em “Salvar”.',
  'help.guide.add-accommodation.result':
    'A estadia aparece em todos os dias que cobre, com Check-in no primeiro e Check-out no último. O estabelecimento vira uma parada no dia do check-in, então o mapa mostra a rota até lá, e uma reserva de hotel aparece na aba Reservas.',
  'help.guide.add-accommodation.tip.1':
    'O seletor abre no dia de onde você veio, com o check-out no dia seguinte; você pode mudar os dois antes de salvar.',
  'help.guide.add-accommodation.tip.2':
    'Ao criar o hotel, dê a ele a categoria Hotel. Assim, “Categoria”, acima da lista, mostra só os seus hotéis com um clique.',
  'help.guide.add-accommodation.tip.3':
    'Todos os horários são opcionais: uma estadia sem check-in e sem código continua cobrindo as noites dela, e a rota continua sendo desenhada.',
  // edit-accommodation
  'help.guide.edit-accommodation.title': 'Alterar ou cancelar uma noite reservada',
  'help.guide.edit-accommodation.goal': 'Mude uma estadia de data, corrija os horários dela ou tire-a do plano.',
  'help.guide.edit-accommodation.step.1':
    'O cartão mostra o estabelecimento e o endereço, Check-in ou Check-out nos dias em que acontecem, com os horários, o número de confirmação e, em Reserva, a reserva que veio junto.',
  'help.guide.edit-accommodation.step.2':
    'O lápis à direita, “Editar hospedagem”, abre a estadia para edição. O título do pop-up passa a ser “Editar hospedagem”.',
  'help.guide.edit-accommodation.step.3':
    'Corrija Check-in, Até, Check-out e Confirmação. Os dias, acima, e o estabelecimento, abaixo, também podem ser alterados aqui.',
  'help.guide.edit-accommodation.step.4': 'Clique em “Salvar”.',
  'help.guide.edit-accommodation.step.5':
    'O X ao lado do lápis, Remover, remove a estadia. Ele não pede confirmação, e a reserva de hotel ligada à estadia também é excluída.',
  'help.guide.edit-accommodation.result':
    'A alteração vale na hora para todos os dias que a estadia cobre e para a reserva de hotel na aba Reservas.',
  'help.guide.edit-accommodation.tip.1':
    'Uma noite no meio de uma estadia não tem o rótulo Check-in nem o Check-out: só o primeiro e o último dia do período têm.',
  'help.guide.edit-accommodation.tip.2':
    'Cancelar uma estadia também remove a parada que ela adicionou ao dia do check-in e qualquer custo vinculado à reserva. Se foi engano, reserve a noite de novo.',
  // day-bookings
  'help.guide.day-bookings.title': 'As reservas do dia num relance',
  'help.guide.day-bookings.goal': 'Veja em um só lugar o que já está reservado para este dia e se está confirmado.',
  'help.guide.day-bookings.step.1':
    'Reservas lista as reservas do dia: as que têm a data dele e as fixadas em uma das paradas dele. Uma reserva fixada em uma parada de outro dia aparece só nessa parada.',
  'help.guide.day-bookings.step.2':
    'Cada linha mostra o tipo de reserva, o nome e, quando ela pertence a uma parada, essa parada em cinza logo depois. Os horários aparecem na ponta direita, antes do ponto de status.',
  'help.guide.day-bookings.step.3':
    'A cor indica o status da reserva: verde é confirmada, âmbar ainda pendente, e um trajeto de transporte público aparece em azul, sem status. Hotéis não ficam nesta lista: eles têm uma seção própria logo abaixo.',
  'help.guide.day-bookings.step.4':
    'Clique em uma linha para abrir a reserva. A pílula no cabeçalho alterna entre Pendente e Confirmada, e Editar, no fim, muda o resto. Reservas novas são criadas na aba Reservas, e transportes, na aba Transportes.',
  'help.guide.day-bookings.result':
    'Tudo o que tem a data desse dia, e tudo o que está ligado a uma das paradas dele, está nesta lista.',
  'help.guide.day-bookings.tip.1':
    'Uma reserva aparece no dia da sua própria data. Se você mudar a data na aba Reservas ou Transportes, a reserva passa automaticamente para o outro dia.',
  'help.guide.day-bookings.tip.2':
    'Se não houver o bloco “Reservas”, o dia não tem reservas: ele fica oculto em vez de aparecer vazio.',
  'help.guide.map-lock.title': 'Travar o mapa',
  'help.guide.map-lock.goal': 'Mantenha o mapa parado enquanto você navega entre dias e lugares.',
  'help.guide.map-lock.step.1':
    'O cadeado é o de cima dos dois botões redondos no canto inferior esquerdo do mapa; ao passar o mouse, aparece “Travar a visualização do mapa”. Clique nele. Enquanto estiver fechado, abrir um dia ou escolher um lugar não aproxima nem move mais o mapa, e o botão passa a mostrar “Deixar o mapa seguir a seleção”.',
  'help.guide.map-lock.result': 'O mapa fica onde você o deixou enquanto você trabalha no plano.',
  'help.guide.map-lock.tip.1':
    'Clique de novo no cadeado, agora “Deixar o mapa seguir a seleção”, e o mapa volta a acompanhar o que você escolhe. O cadeado só existe no computador; no celular, o mapa sempre acompanha.',

  // ── Screen: trip-map ──────────────────────────────────────────────────────────────────
  'help.ctx.trip-map.title': 'Mapa',
  'help.ctx.trip-map.summary':
    'O centro do plano: cada lugar da viagem como um alfinete, cada passeio como uma linha, as rotas entre eles e, nas bordas do mapa, os botões para travar a visão, mudar para satélite, mostrar a viagem inteira de uma vez e mostrar os lugares da área que você está vendo.',
  'help.ctx.trip-map.bullet.1':
    'Cada alfinete é um lugar: mostra a foto dele, se tiver; senão, a cor da categoria com o ícone dela. Passe o mouse sobre um alfinete para ver um cartão com a imagem, o nome e o endereço, além da avaliação e da categoria, se o lugar tiver. Arraste um alfinete até o cartão de um dia para planejar o lugar ali. Uma estadia com reserva ainda pendente aparece esmaecida, com um anel tracejado.',
  'help.ctx.trip-map.bullet.2':
    'Alfinetes muito próximos são agrupados em um círculo escuro com um número. Clique no círculo, e o mapa aproxima os alfinetes que estão nele. Com “Marcadores compactos para lugares não planejados” ativado, em Configurações > Exibição, na seção “Viagem e mapa”, os lugares que ainda não estão em nenhum dia aparecem como pontinhos sem foto, para que as paradas planejadas fiquem mais fáceis de ver.',
  'help.ctx.trip-map.bullet.3':
    'Clique em um pino para abrir o lugar em um cartão na parte de baixo do mapa, com a avaliação, os arquivos e as próximas ações. Clique em uma área vazia do mapa para fechar o cartão.',
  'help.ctx.trip-map.bullet.4':
    'Com um dia aberto na coluna de dias, as paradas dele ganham um pequeno selo branco com a posição delas nesse dia. Um lugar que aparece duas vezes no dia mostra os dois números. Os filtros acima da lista de lugares (Mostrar, as categorias e a estrela da avaliação mínima) também filtram os alfinetes no mapa.',
  'help.ctx.trip-map.bullet.5':
    'A fileira de ícones no topo pesquisa na parte visível do mapa: Restaurantes, Cafés, “Bares e vida noturna”, Hospedagem, “Pontos turísticos”, “Museus e cultura”, “Natureza e parques” e Atividades. As categorias adicionadas por plugins vêm depois de uma linha divisória fina. Quando a fileira é mais larga que o mapa, a roda do mouse a rola para o lado. “Pesquisar nesta área” refaz a busca depois que você move o mapa.',
  'help.ctx.trip-map.bullet.6':
    'Clique com o botão direito em qualquer ponto do mapa para abrir o formulário de lugar ali, com o endereço já pesquisado. Há dois botões redondos no canto inferior esquerdo: o cadeado, “Travar a visualização do mapa”, mantém o mapa parado enquanto você navega por dias e lugares, e o botão abaixo, “Mudar para vista de satélite”, troca o mapa desenhado por imagens de satélite.',
  'help.ctx.trip-map.bullet.7':
    '“Mostrar a viagem inteira”, no canto inferior direito, desenha todos os dias de deslocamento de uma vez e lista o que cada dia abrange. O ícone de rota na linha de uma reserva desenha essa reserva, e o ícone de rota na barra de ferramentas acima dos dias desenha todas as reservas. Clique na ponta de uma reserva desenhada para abrir os detalhes dela.',
  'help.ctx.trip-map.bullet.8':
    'Com o complemento Dawarich ativado, o botão redondo do Dawarich, abaixo de “Mostrar a viagem inteira”, mostra a rota que o seu celular realmente gravou. “Mostrar rota gravada” a desenha como linha tracejada abaixo da rota planejada, uma cor por dia. Quando não há linha, o rótulo do botão explica por quê.',
  // map-markers
  'help.guide.map-markers.title': 'Ler o mapa',
  'help.guide.map-markers.goal': 'Entenda o que significa cada alfinete, selo e bolha do mapa.',
  'help.guide.map-markers.step.1':
    'O mapa mostra todos os lugares da viagem. Onde os pinos estão próximos demais para distinguir, eles se agrupam em um círculo escuro com o número de pinos dentro. Clique no círculo e o mapa aproxima até esses pinos ou, no zoom máximo, separa os pinos.',
  'help.guide.map-markers.step.2':
    'Um alfinete mostra a foto do lugar quando ele tem uma; senão, a cor da categoria com o ícone dela. Uma estadia cuja reserva ainda está pendente aparece esmaecida, com um anel tracejado. Ao passar o mouse sobre um alfinete, um cartão abre ao lado: a mesma foto, maior, o nome e o endereço, com a avaliação e a categoria se o lugar as tiver.',
  'help.guide.map-markers.step.3':
    'Clique em um alfinete e o lugar abre em um cartão na parte de baixo do mapa: a imagem, o nome e o endereço no topo, depois as estrelas, a descrição e os arquivos, inclusive os da reserva. Embaixo ficam as ações: “Adicionar ao dia” quando um dia está aberto (“Remover do dia” se o lugar já estiver nele), Navegação, “Abrir site”, “Salvar na Coleção” (Salvo quando já está em uma) e, à direita, a lixeira e Editar. O X no topo, ou um clique em uma área vazia do mapa, fecha o cartão.',
  'help.guide.map-markers.step.4':
    'Abra um dia na coluna de dias e as paradas dele ganham números: o pequeno selo branco no canto de um pino mostra a posição da parada no dia. Um lugar que aparece duas vezes no dia mostra os dois números. Sem nenhum dia aberto, não há números, e o canto mostra a avaliação do lugar, se ele tiver uma.',
  'help.guide.map-markers.step.5':
    'Arraste um pino do mapa até o cartão de um dia na coluna de dias, e o lugar fica planejado nesse dia, igual a quando você arrasta a linha dele da lista de lugares.',
  'help.guide.map-markers.result':
    'Nada mudou na viagem: o mapa só mostra a viagem. Cada pino indica qual é o lugar, em que dia ele está e em que ordem.',
  'help.guide.map-markers.tip.1':
    'Ao recolher um dia na coluna de dias, as paradas dele somem do mapa. Expanda o dia de novo para mostrá-las.',
  'help.guide.map-markers.tip.2':
    'Os filtros acima da lista de lugares também definem o que o mapa mostra: Mostrar (“Não planejados”, Planejado), as categorias do botão de etiqueta e a avaliação mínima da estrela reduzem o número de alfinetes. O filtro de país filtra só a lista.',
  'help.guide.map-markers.tip.3':
    'Este mapa não tem botões de zoom: a roda do mouse aproxima e afasta, um clique duplo aproxima um nível, e arrastar o mapa o move.',
  // map-nearby-places
  'help.guide.map-nearby-places.title': 'Encontrar lugares por perto no mapa',
  'help.guide.map-nearby-places.goal':
    'Busque restaurantes, pontos turísticos ou um hotel na parte da cidade que aparece no mapa e adicione um deles à viagem.',
  'help.guide.map-nearby-places.step.1':
    'A fileira de ícones no topo do mapa é a busca por categoria: Restaurantes, Cafés, “Bares e vida noturna”, Hospedagem, “Pontos turísticos”, “Museus e cultura”, “Natureza e parques” e Atividades. As categorias adicionadas por plugins vêm depois de um divisor fino; passe o mouse sobre um ícone para ver o nome.',
  'help.guide.map-nearby-places.step.2':
    'Clique numa categoria. O TREK busca esse tipo de lugar na área visível do mapa e coloca um pino na cor da categoria para cada resultado. Só uma categoria por vez: clicar em outra substitui a atual, e clicar na que está ativa a desativa.',
  'help.guide.map-nearby-places.step.3':
    'Quando você move o mapa, aparece um segundo botão abaixo da linha: “Pesquisar nesta área” faz a mesma busca na nova área visível. Mover o mapa não inicia uma busca sozinho, o que mantém baixo o número de requisições.',
  'help.guide.map-nearby-places.step.4':
    'Passe o mouse sobre um alfinete para ver o nome do que a busca encontrou. Clique no alfinete, e o formulário do lugar abre já preenchido: o nome no topo da janela, Endereço, Latitude e Longitude, e o site e o telefone, se a busca os encontrou.',
  'help.guide.map-nearby-places.step.5':
    'Confira o que foi preenchido e complete o que a busca não tinha como saber. A pílula de categoria abaixo do nome já vem definida quando a viagem tem uma categoria correspondente, como restaurante para um restaurante; senão, ela mostra “Sem categoria” até você escolher uma. Adicione uma Descrição e suas próprias notas.',
  'help.guide.map-nearby-places.step.6':
    'Clique em “Adicionar”. Se já existir na viagem um lugar com o mesmo nome ou no mesmo ponto, o TREK avisa, e o botão muda para “Adicionar mesmo assim”.',
  'help.guide.map-nearby-places.result':
    'O lugar entra na lista de lugares e no mapa como um alfinete da própria viagem, em “Não planejados” até você colocá-lo em um dia. Os alfinetes da busca ficam até você desativar a categoria.',
  'help.guide.map-nearby-places.tip.1':
    'A fileira fica oculta quando “Explorar lugares no mapa” está desativado em Configurações > Exibição, na seção “Viagem e mapa”.',
  'help.guide.map-nearby-places.tip.2':
    'Os resultados vêm do índice TREK Places e do OpenStreetMap, então essa é uma das poucas coisas do plano que precisa de conexão.',
  'help.guide.map-nearby-places.tip.3':
    'A busca cobre só a área visível na tela, então aproxime o zoom na rua que interessa. Uma busca na cidade inteira traz só os primeiros sessenta resultados, sem ordem clara.',
  // map-add-place
  'help.guide.map-add-place.title': 'Criar um lugar com o botão direito no mapa',
  'help.guide.map-add-place.goal': 'Coloque um lugar exatamente onde você quer, sem precisar buscá-lo antes.',
  'help.guide.map-add-place.step.1':
    'Clique com o botão direito no ponto do mapa. O formulário de lugar abre com o título “Adicionar lugar/atividade”.',
  'help.guide.map-add-place.step.2':
    'Latitude e longitude já vêm preenchidas com esse ponto. O TREK consulta as coordenadas e preenche “Endereço” com o que encontrar ali. Se a consulta achar um nome, o TREK também preenche o nome no topo da janela. Nada foi salvo ainda, então corrija o que estiver errado.',
  'help.guide.map-add-place.step.3':
    'Digite no campo do topo da janela um nome que você reconheça. Escolha uma categoria na pílula logo abaixo, que mostra “Sem categoria” até você escolher. Depois, adicione os demais detalhes para o plano: Descrição, Notas, Site.',
  'help.guide.map-add-place.step.4':
    'Clique em Adicionar. O lugar entra na lista como não planejado, mesmo com um dia aberto: o clique com o botão direito no mapa define o local, não o dia.',
  'help.guide.map-add-place.result':
    'O lugar aparece na lista e no mapa, em “Não planejados”, até você colocá-lo em um dia.',
  'help.guide.map-add-place.tip.1':
    'O endereço é obtido a partir das coordenadas, então pode aparecer uma rua em vez de um nome e, em áreas isoladas, ficar vazio. Você pode alterar os dois campos.',
  'help.guide.map-add-place.tip.2':
    'Nos mapas MapLibre GL e Mapbox GL, um clique com o botão do meio faz o mesmo; numa tela sensível ao toque, um toque longo.',
  // map-satellite
  'help.guide.map-satellite.title': 'Mudar para satélite',
  'help.guide.map-satellite.goal': 'Troque o mapa desenhado por imagens aéreas e volte quando quiser.',
  'help.guide.map-satellite.step.1':
    'O seletor da camada base é o de baixo dos dois botões redondos no canto inferior esquerdo do mapa, abaixo do cadeado. O ícone sempre mostra a camada para a qual ele muda, e a dica diz qual: “Mudar para vista de satélite”. Clique nele.',
  'help.guide.map-satellite.step.2':
    'O mapa agora mostra imagens de satélite, com detalhe suficiente para ver prédios individuais, e você não precisa de chave própria. Tudo o que o TREK desenha continua por cima: os alfinetes, a rota do dia, as trilhas e as rotas de reservas.',
  'help.guide.map-satellite.step.3':
    'O botão agora mostra “Mudar para vista de mapa”. Clique nele para voltar ao mapa.',
  'help.guide.map-satellite.result': 'O mapa é redesenhado, e a camada escolhida fica salva na sua conta.',
  'help.guide.map-satellite.tip.1':
    'A escolha fica salva na sua conta, não na viagem, então toda viagem abre do jeito que você deixou, seja qual for o renderizador de mapa que você usa.',
  'help.guide.map-satellite.tip.2':
    'As imagens de satélite não têm rótulos: nomes de ruas, bairros e números das casas só aparecem no mapa desenhado, então volte para ele quando estiver procurando um endereço.',
  // map-whole-trip
  'help.guide.map-whole-trip.title': 'Ver a viagem inteira e as distâncias',
  'help.guide.map-whole-trip.goal':
    'Mostre todos os dias de deslocamento da viagem, e não só o dia aberto, e veja quanto você percorre em cada dia.',
  'help.guide.map-whole-trip.step.1':
    'O botão redondo “Mostrar a viagem inteira” fica no canto inferior direito do mapa. Clique nele e todos os dias de deslocamento da viagem são desenhados de uma vez, cada um com sua cor, para você distinguir dias vizinhos.',
  'help.guide.map-whole-trip.step.2':
    'O cartão acima do botão lista esses dias: um ponto colorido, o nome do dia, um ícone para cada meio de transporte usado nele e a distância percorrida. “Distância total” fica no topo.',
  'help.guide.map-whole-trip.step.3':
    'Clique em um dia no cartão para selecioná-lo: a linha dele fica sombreada e o dia abre na coluna de dias. Gire a roda do mouse sobre uma cidade para dar zoom. Os dias que passam por ela aparecem lado a lado, cada um com a sua cor.',
  'help.guide.map-whole-trip.step.4':
    'Agora o botão diz “Ocultar a viagem inteira”. Clique nele para voltar a mostrar só o dia aberto.',
  'help.guide.map-whole-trip.result':
    'Cada dia de deslocamento aparece na própria cor, e o cartão mostra o que cada dia percorre e o total da viagem.',
  'help.guide.map-whole-trip.tip.1':
    'O total é calculado alguns trechos por vez. Enquanto aparecer … depois dele, o número é só uma soma parcial. Ele fica definitivo quando todos os trechos estiverem calculados.',
  'help.guide.map-whole-trip.tip.2':
    'Se o roteador não conseguir calcular um trecho, ele fica como linha reta e não entra na conta. O cartão avisa isso, para o total não parecer menor sem explicação.',
  'help.guide.map-whole-trip.tip.3':
    'Um dia com menos de duas paradas localizadas e sem trajeto de ida ou volta ao hotel não tem rota para desenhar, então nem aparece no cartão.',
  // map-booking-routes
  'help.guide.map-booking-routes.title': 'Mostrar a rota de uma reserva no mapa',
  'help.guide.map-booking-routes.goal':
    'Mostre no mapa os voos, trens e trajetos de carro que você reservou, e tire-os de lá quando quiser.',
  'help.guide.map-booking-routes.step.1':
    'As rotas de reservas ficam desligadas até você ligar alguma. Na ponta direita da linha de um transporte, na coluna de dias, há um pequeno ícone de rota: “Mostrar rotas de reservas”.',
  'help.guide.map-booking-routes.step.2':
    'Clique nele, e a reserva aparece no mapa: um voo como arco de círculo máximo, um percurso de carro pelas estradas reais, um trem como a sequência das estações. Confirmada aparece em linha contínua, Pendente em tracejado, e as pontas da rota são pílulas azuis com o ícone do transporte.',
  'help.guide.map-booking-routes.step.3':
    'Clique em uma pílula de extremidade, e os detalhes da reserva abrem: status, tipo e dias como pílulas no cabeçalho colorido, os horários nas duas pontas, os demais detalhes abaixo e, no fim, “No mapa”, que desativa esta rota, “Alterar trajeto” em uma conexão de transporte público, a lixeira que exclui a reserva, e Editar. O X no cabeçalho fecha os detalhes.',
  'help.guide.map-booking-routes.step.4':
    'O ícone de rota na barra de ferramentas acima dos dias vale para a viagem inteira de uma vez: “Mostrar todas as rotas de reservas” desenha todas as reservas que têm rota.',
  'help.guide.map-booking-routes.step.5':
    'Isso substitui as suas escolhas anteriores, então as rotas que você ativou reserva por reserva voltam ao padrão. Clique de novo, agora com o rótulo “Ocultar todas as rotas de reservas”, para ocultar todas as rotas de reservas.',
  'help.guide.map-booking-routes.result':
    'As reservas que você escolheu aparecem no mapa, e a escolha fica guardada para esta viagem neste navegador até você mudá-la.',
  'help.guide.map-booking-routes.tip.1':
    'As pontas só mostram o código do aeroporto ou o nome da estação quando “Rótulos das rotas de reservas” está ativado em Configurações > Exibição, na seção “Viagem e mapa”; senão, mostram só o ícone.',
  'help.guide.map-booking-routes.tip.2':
    '“Sempre mostrar rotas de reserva”, na mesma seção, exibe essas rotas desde o início em todas as viagens em que você ainda não definiu isso.',
  'help.guide.map-booking-routes.tip.3':
    'Uma reserva só pode ser desenhada se tiver início e fim com coordenadas, por isso um hotel ou um restaurante não tem ícone de rota.',
  // map-dawarich-trail
  'help.guide.map-dawarich-trail.title': 'Mostrar a rota que você realmente fez',
  'help.guide.map-dawarich-trail.goal':
    'Mostre no mapa a rota que o Dawarich gravou no seu celular, como linha tracejada ao lado da rota planejada, e veja dia a dia como a viagem realmente foi.',
  'help.guide.map-dawarich-trail.step.1':
    'O botão redondo do Dawarich fica no canto inferior direito do mapa, abaixo de “Mostrar a viagem inteira”. Ao passar o mouse, aparece “Mostrar rota gravada”. Clique nele. O TREK pede ao seu Dawarich os dados das datas da viagem, e um anel gira em volta do botão enquanto o TREK espera a resposta.',
  'help.guide.map-dawarich-trail.step.2':
    'A rota gravada aparece como linha tracejada, uma cor por dia, abaixo da rota planejada, para que o plano continue legível. O botão agora mostra “Ocultar rota gravada”. Cada dia termina à meia-noite local. Ao recolher um dia na coluna de dias, a linha tracejada e as paradas dele somem do mapa.',
  'help.guide.map-dawarich-trail.step.3':
    'Clique também em “Mostrar a viagem inteira”, e cada dia planejado aparece como linha contínua ao lado da gravação tracejada. Onde as duas linhas coincidem, o dia foi como planejado. Onde a linha tracejada se afasta da rota planejada, não foi.',
  'help.guide.map-dawarich-trail.result':
    'O que você planejou e o que realmente fez aparecem juntos no mapa, em linhas tracejadas e contínuas. O cartão acima dos botões continua listando os dias planejados e as distâncias.',
  'help.guide.map-dawarich-trail.tip.1':
    'Ligado ou desligado fica salvo por viagem na sua conta, então vale em qualquer navegador e em qualquer dispositivo. Enquanto a rota está ligada, o TREK consulta o Dawarich de novo a cada dois minutos, então uma viagem em andamento é atualizada sem recarregar a página. A rota em si nunca é armazenada: ela não fica no banco de dados do TREK, nem nos backups, nem disponível offline.',
  'help.guide.map-dawarich-trail.tip.2':
    'O texto do botão explica por que o mapa está vazio: “Carregando a rota gravada…” enquanto carrega, “Nada foi gravado nessas datas”, “Não foi possível carregar a rota gravada” ou “A rota gravada precisa de conexão” quando o TREK está offline.',
  // map-compass
  'help.guide.map-compass.title': 'Girar o mapa e encontrar o norte de novo',
  'help.guide.map-compass.goal':
    'Gire o mapa para a direção em que você está indo e volte-o para o norte com um clique.',
  'help.guide.map-compass.step.1':
    'Gire o mapa arrastando com o botão direito, ou segure Ctrl e arraste com o botão esquerdo; em tela sensível ao toque, gire com dois dedos. A bússola redonda ao lado da fileira de ícones de categoria, no topo do mapa, gira junto: a seta dela sempre aponta para o norte, então ela se inclina no mesmo ângulo que o mapa.',
  'help.guide.map-compass.step.2':
    'Clique na bússola. O botão, chamado Voltar ao norte, gira o mapa de volta para o norte ficar no topo, deixa a visão plana de novo, e a seta volta a apontar para cima.',
  'help.guide.map-compass.result':
    'O mapa volta a apontar para o norte e fica reto de novo. Nada mudou na viagem: a bússola só muda a visualização.',
  'help.guide.map-compass.tip.1':
    'A bússola só existe nos mapas MapLibre GL e Mapbox GL; o mapa Leaflet não pode ser girado, então não tem bússola. “Provedor de mapa”, em Configurações, na seção Mapa, define qual mapa você usa, e “Salvar mapa” salva a escolha.',
  'help.guide.map-compass.tip.2':
    'O clique também desfaz a inclinação. Arraste para cima ou para baixo com o botão direito do mouse para inclinar a vista, e “Reset north” a deixa nivelada e desfaz a rotação. No Mapbox GL com “Prédios 3D & terreno” ativado, isso também achata a vista 3D até você inclinar de novo.',

  // ── Screen: trip-collab ───────────────────────────────────────────────────────────────
  'help.ctx.trip-collab.title': 'Colab',
  'help.ctx.trip-collab.summary':
    'A aba onde o grupo planeja junto, em cinco cartões: o chat à esquerda, Notas e Links ao lado, Enquetes e Próximos passos abaixo. Tudo o que é escrito aqui aparece na hora na tela dos outros membros, sem precisar recarregar.',
  'help.ctx.trip-collab.bullet.1':
    'O chat é o cartão da esquerda. Escreva em “Digite uma mensagem...” e aperte Enter. Shift + Enter cria uma nova linha. A carinha insere um emoji, e “Anexar imagens” adiciona até quatro fotos à mensagem.',
  'help.ctx.trip-collab.bullet.2':
    'Passe o mouse sobre uma mensagem para ver “Responder” e, nas suas, “Excluir”; clique com o botão direito para ver as oito reações rápidas. Uma mensagem excluída é substituída por um aviso que diz quem a excluiu.',
  'help.ctx.trip-collab.bullet.3':
    'Notas é a área de notas compartilhadas: “Nova nota”, no cabeçalho, cria uma nota, e a engrenagem ao lado abre “Gerenciar categorias”, com os nomes e as cores. Quando há categorias, uma fileira de pílulas abaixo do cabeçalho filtra os cartões: Todos ou uma categoria. O cartão de uma nota mostra a categoria como um ponto colorido e o link como um botão redondo, e os três pontos (“Mais opções”) trazem Expandir, Fixar, Editar e Excluir.',
  'help.ctx.trip-collab.bullet.4':
    'Links reúne os endereços da web da viagem. “Adicionar link” pede um título e um endereço http ou https. “Editar link”, “Fixar link” e “Excluir link” ficam no fim do chip, e os links fixados ficam sempre na frente.',
  'help.ctx.trip-collab.bullet.5':
    'Use enquetes para tomar decisões. “Nova enquete” faz uma pergunta com pelo menos duas opções. Clique numa opção para votar nela. O cadeado (“Encerrar”) e a lixeira (“Excluir”), à direita do cabeçalho da enquete, encerram a votação ou removem a enquete.',
  'help.ctx.trip-collab.bullet.6':
    'Próximos passos lista as paradas da viagem que ainda estão por vir, até oito, com os horários e as pessoas que vão. Ele só lê o plano do dia; os horários são definidos lá.',
  // write-note
  'help.guide.write-note.title': 'Escrever uma nota compartilhada',
  'help.guide.write-note.goal':
    'Deixe o que o grupo inteiro precisa saber, como uma regra, um endereço ou um lembrete, onde todos possam encontrar.',
  'help.guide.write-note.step.1':
    'Clique em “Nova nota” no cabeçalho do cartão “Notas”. A janela da nota abre com o cursor já no campo de título.',
  'help.guide.write-note.step.2':
    'Digite o título onde aparece “Título da nota”, no topo da janela. É o único campo obrigatório: “Criar” fica acinzentado até o título ter texto, e pressionar Enter no título cria a nota na hora.',
  'help.guide.write-note.step.3':
    '“Conteúdo” guarda o texto e aceita Markdown: uma palavra em negrito, uma lista, um título. O cartão mostra as três primeiras linhas, e “Expandir”, no menu dele, abre a nota inteira.',
  'help.guide.write-note.step.4':
    'Em Categoria, escolha a categoria da nota. A cor dela é usada agora no cabeçalho da janela e depois no cabeçalho do cartão. A primeira categoria já vem selecionada. As pílulas são as categorias existentes, e uma nova se cria em “Gerenciar categorias”. Enquanto a viagem não tiver categorias, essa fileira não aparece.',
  'help.guide.write-note.step.5':
    'Em “Site” vai um link relacionado à nota. O cartão passa a mostrar no topo um botão redondo de link que abre esse endereço.',
  'help.guide.write-note.step.6':
    'Clique em Criar. Só Cancelar e o X fecham a janela, então um clique fora dela ou Esc não fazem você perder o que escreveu.',
  'help.guide.write-note.result':
    'A nota vira um cartão no painel Notas, com o topo na cor da categoria, e todos os outros membros a veem na hora.',
  'help.guide.write-note.tip.1':
    'Os três pontos de um cartão (“Mais opções”) abrem Expandir, Fixar, Editar e Excluir. Fixar mantém a nota no topo do painel, com uma moldura na cor dela. As demais notas são ordenadas pela última alteração.',
  'help.guide.write-note.tip.2':
    'A engrenagem ao lado de “Nova nota” abre “Gerenciar categorias”. Ali você pode dar uma cor a uma categoria, renomeá-la em todos os lugares de uma vez ou criá-la antes que alguma nota a use. Nada muda até você clicar em “Salvar”.',
  'help.guide.write-note.tip.3':
    '“Anexar arquivos” adiciona um documento à nota, se você tiver permissão para enviar arquivos à viagem. Anexar abre o seletor de arquivos, e você também pode colar uma imagem ou um PDF na janela.',
  'help.guide.write-note.tip.4':
    'Notas tem uma chave própria em Complementos, abaixo de Colab: um administrador pode desativá-la e manter o chat, os links, as enquetes e “Próximos passos” funcionando.',
  // shared-links
  'help.guide.shared-links.title': 'Reunir os links da viagem',
  'help.guide.shared-links.goal':
    'Mantenha o portal de reservas, o álbum compartilhado e os horários num só lugar, sem precisar procurá-los no chat.',
  'help.guide.shared-links.step.1':
    'Clique em “Adicionar link” no cabeçalho do cartão Links. A janela abre com o cursor no campo do topo.',
  'help.guide.shared-links.step.2':
    'Digite o nome em “Título do link”, cole o endereço em Link, logo abaixo, e clique em “Salvar link”.',
  'help.guide.shared-links.step.3':
    'O chip mostra o nome e o site para onde aponta. Clique nele para abrir a página em uma nova aba.',
  'help.guide.shared-links.step.4':
    'Os três botões redondos no fim dela são “Editar link”, “Fixar link” e “Excluir link”. “Fixar link” leva a etiqueta para o início do painel e a mostra na cor de destaque. “Excluir link” pede confirmação antes, porque o link some para todos os membros.',
  'help.guide.shared-links.result':
    'O link vira um item no painel Links, fixado na frente, e aparece na hora na tela de todos os membros.',
  'help.guide.shared-links.tip.1':
    'Só endereços http ou https são aceitos. Qualquer outra coisa é recusada, e a janela continua aberta com o que você digitou.',
  'help.guide.shared-links.tip.2':
    'Os links fixados vêm primeiro, depois os mais recentes. O pequeno ícone ao lado do título é o favicon do próprio site, carregado do site, então sem internet a etiqueta mostra um ícone de link simples.',
  'help.guide.shared-links.tip.3':
    'Links tem um interruptor próprio em Complementos, abaixo de Colab, então um administrador pode desativar o painel sem mexer no resto da aba.',
  // create-poll
  'help.guide.create-poll.title': 'Perguntar ao grupo',
  'help.guide.create-poll.goal':
    'Transforme uma pergunta que ninguém responde no chat em uma enquete em que todos podem votar.',
  'help.guide.create-poll.step.1': 'Clique em “Nova enquete” no cabeçalho do cartão “Enquetes”. A janela abre.',
  'help.guide.create-poll.step.2':
    'Escreva a pergunta em “Pergunta”. O aviso “Suporta Markdown”, embaixo da caixa, indica que negrito, quebra de linha ou uma lista curta funcionam aqui.',
  'help.guide.create-poll.step.3':
    'Preencha “Opção 1” e “Opção 2” em “Opções”. São necessárias pelo menos duas opções preenchidas, e cada opção pode ter várias linhas.',
  'help.guide.create-poll.step.4':
    '“Adicionar opção”, logo abaixo, adiciona uma terceira, uma quarta, quantas você precisar. O pequeno x ao lado de uma linha, que aparece quando há mais de duas opções, remove essa opção.',
  'help.guide.create-poll.step.5':
    '“Múltipla escolha” deixa cada pessoa marcar mais de uma opção. Se estiver desativada, o voto de uma pessoa passa para a nova opção quando ela escolhe outra.',
  'help.guide.create-poll.step.6': 'Clique em “Criar enquete”.',
  'help.guide.create-poll.result': 'A enquete aparece no topo do painel Enquetes, aberta, com 0 votos no cabeçalho.',
  'help.guide.create-poll.tip.1': 'A pergunta é exibida como Markdown. As opções ficam como texto simples.',
  'help.guide.create-poll.tip.2':
    '“Criar enquete” fica acinzentado até haver uma pergunta e pelo menos duas opções com texto.',
  'help.guide.create-poll.tip.3':
    'O prazo só pode ser definido no app do celular. Uma enquete com prazo mostra o tempo restante em um chip âmbar no cabeçalho e é encerrada quando o tempo acaba.',
  'help.guide.create-poll.tip.4':
    '“Enquetes” tem sua própria chave em “Complementos”, abaixo de “Colab”: um administrador pode desligá-la e manter os outros quatro painéis ligados.',
  // vote-poll
  'help.guide.vote-poll.title': 'Votar e ver o resultado',
  'help.guide.vote-poll.goal': 'Vote, veja o resultado do grupo e mude o seu voto.',
  'help.guide.vote-poll.step.1':
    'Clique na opção que você quer. O círculo dela mostra um tique, a opção ganha uma moldura na cor de destaque, e a barra atrás dela cresce.',
  'help.guide.vote-poll.step.2':
    'Agora você vê o resultado completo: a barra mostra a proporção, a porcentagem fica à direita e os círculos pequenos são as pessoas que escolheram aquela opção, até três delas.',
  'help.guide.vote-poll.step.3':
    'Mudou de ideia? Clique em outra opção. Numa enquete sem “Múltipla escolha”, seu voto passa para a nova opção em vez de contar um segundo voto.',
  'help.guide.vote-poll.step.4':
    'O número de votos aparece em um chip abaixo da pergunta. Clicar na opção que você já escolheu retira o seu voto, e a contagem diminui.',
  'help.guide.vote-poll.result':
    'Sua opção fica marcada, as barras mostram como o grupo votou e os círculos mostram quem escolheu cada opção.',
  'help.guide.vote-poll.tip.1':
    'As porcentagens e quem votou em quê só aparecem depois que você vota, ou quando a enquete é encerrada. O número de votos no cabeçalho aparece para todos.',
  'help.guide.vote-poll.tip.2':
    'O voto nunca é anônimo: passe o mouse sobre um dos círculos de uma opção para ver o nome de quem votou.',
  // close-poll
  'help.guide.close-poll.title': 'Encerrar ou remover uma enquete',
  'help.guide.close-poll.goal':
    'Encerre a votação quando o grupo tiver decidido e exclua uma enquete de que ninguém precisa mais.',
  'help.guide.close-poll.step.1':
    '“Encerrar”, o cadeado à direita do cabeçalho de uma enquete, termina a votação. Não dá mais para clicar nas opções.',
  'help.guide.close-poll.step.2':
    'Uma enquete encerrada vai para o fim do painel, sob o título Encerrada quando há enquetes abertas acima. Ela ganha um chip Encerrada e mostra o resultado para todos, tenham votado ou não. A opção vencedora fica em negrito, sobre uma barra verde; se for a que você escolheu, a barra usa a sua cor de destaque.',
  'help.guide.close-poll.step.3':
    '“Excluir”, a lixeira à direita do cabeçalho, apaga a enquete. Numa enquete encerrada, ele é o único botão, porque o cadeado some. Não há confirmação, e os votos também são apagados.',
  'help.guide.close-poll.result':
    'Uma enquete excluída some do painel de todos os membros. Uma enquete só encerrada continua visível lá embaixo, com o resultado.',
  'help.guide.close-poll.tip.1':
    'Encerrar não pode ser desfeito: não dá para reabrir. Uma enquete encerrada por engano precisa ser criada de novo.',
  'help.guide.close-poll.tip.2':
    'Excluir remove a enquete e todos os votos para todos, na hora e sem pedir confirmação.',
  // whats-next
  'help.guide.whats-next.title': 'Ler Próximos passos',
  'help.guide.whats-next.goal': 'Veja o que o grupo vai fazer em seguida sem abrir o plano.',
  'help.guide.whats-next.step.1':
    'O cartão lista as próximas paradas da viagem, até oito, em ordem cronológica, sob um título por dia: Hoje, Amanhã ou a data, com o título do dia ao lado, se houver. O cabeçalho mostra quantas são.',
  'help.guide.whats-next.step.2':
    'À esquerda de cada parada aparece o horário: o início, “até” e o fim, quando a parada tem um, ou “TBD” quando ainda não há horário definido.',
  'help.guide.whats-next.step.3':
    'Ao lado aparecem o nome, o endereço e, em etiquetas, as pessoas daquela parada. Se ninguém estiver atribuído à parada, todos da viagem aparecem.',
  'help.guide.whats-next.result':
    'Uma lista do que vem por aí, só para leitura: ela segue o plano, e nada aqui o altera.',
  'help.guide.whats-next.tip.1':
    'Aqui você não define nada. Os horários vêm do plano do dia; quando você os muda lá, esta lista é atualizada na hora.',
  'help.guide.whats-next.tip.2':
    'Só aparece o que ainda está por vir: uma parada sai da lista quando o horário de início passa, uma parada de hoje sem horário fica até o fim do dia e, no fim da viagem, o painel fica vazio.',
  'help.guide.whats-next.tip.3':
    'Próximos passos tem um interruptor próprio em Complementos, abaixo de Colab. É um painel do computador: a aba Colab do app no celular não o mostra.',
  // trip-chat
  'help.guide.trip-chat.title': 'Conversar com o grupo',
  'help.guide.trip-chat.goal':
    'Envie uma mensagem, responda a uma mensagem específica, reaja a outra e exclua uma mensagem sua.',
  'help.guide.trip-chat.step.1':
    'Escreva em “Digite uma mensagem...” e pressione Enter. A seta redonda ao lado da caixa faz o mesmo. Shift + Enter cria uma nova linha.',
  'help.guide.trip-chat.step.2':
    'O smiley abre o seletor de emojis, com “Carinhas”, “Reações” e “Viagem”. O emoji escolhido é adicionado ao texto que você está escrevendo. Ele não é enviado sozinho.',
  'help.guide.trip-chat.step.3':
    'Passe o mouse sobre a mensagem de outra pessoa: um pequeno botão redondo aparece no canto dela. É o Responder.',
  'help.guide.trip-chat.step.4':
    'A mensagem que você responde aparece citada acima da caixa. Escreva e envie sua mensagem, e a citação vai junto. Clique no X da citação para removê-la.',
  'help.guide.trip-chat.step.5':
    'Clique com o botão direito em uma mensagem para ver as oito reações rápidas. A sua reação aparece abaixo da mensagem. Clique de novo na mesma reação para removê-la.',
  'help.guide.trip-chat.step.6':
    'As suas mensagens têm “Excluir”, o ícone de lixeira, ao lado de “Responder”. A mensagem é excluída na hora, e um aviso informa que você a excluiu. Não dá para desfazer.',
  'help.guide.trip-chat.result':
    'Sua resposta é a mensagem mais recente, com a mensagem citada no topo. Sua reação aparece embaixo da outra mensagem. No lugar da mensagem que você excluiu, um aviso diz que você a excluiu.',
  'help.guide.trip-chat.tip.1':
    'Enter envia, Shift + Enter cria uma nova linha. Uma mensagem com só um a três emojis aparece em tamanho grande.',
  'help.guide.trip-chat.tip.2':
    'Com “Anexar imagens” você pode adicionar até quatro imagens a uma mensagem. Também dá para colar as imagens ou arrastá-las para a caixa.',
  'help.guide.trip-chat.tip.3':
    'Uma mensagem com link ganha um cartão de prévia logo abaixo, buscado pelo seu próprio TREK, então um link para algo que só você consegue acessar continua um link simples.',
  'help.guide.trip-chat.tip.4':
    'O chat tem um interruptor próprio em Complementos, abaixo de Colab: um administrador pode desativá-lo e manter as notas, os links, as enquetes e Próximos passos ativados.',

  // ── Screen: trip-lists ────────────────────────────────────────────────────────────────
  'help.ctx.trip-lists.title': 'Listas',
  'help.ctx.trip-lists.summary':
    'Duas listas para cada viagem: a lista de bagagem, com quem leva o quê e quanto pesa, e a lista de tarefas com tudo o que precisa ser feito antes e durante a viagem. A aba aparece enquanto o complemento “Listas” estiver ligado.',
  'help.ctx.trip-lists.bullet.1':
    '“Lista de mala” e “A fazer”, na barra do topo, alternam entre as duas e mostram quantos itens há em cada uma; os botões na ponta direita da barra pertencem à que estiver aberta.',
  'help.ctx.trip-lists.bullet.2':
    'A lista de mala é dividida em listas, por exemplo Documentos ou Roupas, com o nome que você quiser. Cada lista é um cartão. O cabeçalho tem uma alça para arrastar a lista inteira para outra posição, um ponto colorido, um selo com embalados/total, três pontos com Renomear, “Marcar todos”, “Desmarcar todos” e “Excluir lista”, e uma seta que recolhe o cartão. “Adicionar lista”, na barra acima, cria uma nova.',
  'help.ctx.trip-lists.bullet.3':
    'Cada linha tem uma alça para arrastar, uma caixa de seleção e um nome, seguidos de um pequeno avatar de quem leva o item. Um item com quantidade maior que um também ganha um contador de embalados, como 3/10, com um menos e um mais. Depois vêm a quantidade, em um pequeno selo, e, com “Rastreamento de malas” ativado, o peso em gramas e um círculo da bolsa; por fim, a lixeira e um menu de três pontos com “Mover para lista”, Compartilhando, Renomear e Excluir. Os controles que a linha não usa ficam esmaecidos até você passar o mouse sobre eles.',
  'help.ctx.trip-lists.bullet.4':
    'Compartilhada e “Minha lista” dividem a lista de mala em duas: a que todos veem e a sua. Todos, “Em aberto” e Concluído, ao lado, filtram a que estiver aberta. “A a Z”, na ponta da fileira, mostra os itens de cada lista em ordem alfabética, e um segundo clique volta à sua ordem. O cartão de progresso acima conta o que já está na mala.',
  'help.ctx.trip-lists.bullet.5':
    '“Aplicar modelo” e “Salvar como modelo” preenchem uma lista ou a salvam, para você não precisar digitar. Os dois ícones seguintes, Exportar e Importar, exportam a lista para impressão, PDF ou arquivo, e importam uma lista. O botão vermelho na ponta direita do cartão de progresso mostra quantos itens estão marcados e os remove.',
  'help.ctx.trip-lists.bullet.6':
    '“A fazer” tem uma barra lateral própria: o cartão de progresso, os filtros Todos, “Minhas tarefas”, Atrasada e Concluído, uma linha por lista e “Adicionar lista” abaixo delas. As tarefas ficam em um cartão cujo cabeçalho mostra o nome do filtro e a ordenação, Prioridade ou “Data de vencimento”. Clique em uma tarefa para abri-la no painel da direita. “Nova tarefa”, na barra, abre a janela “Nova tarefa”.',
  // packing-categories
  'help.guide.packing-categories.title': 'Montar a lista de bagagem',
  'help.guide.packing-categories.goal':
    'Organize em listas o que você vai levar, adicione itens a elas e escolha quem é responsável por cada lista.',
  'help.guide.packing-categories.step.1':
    'Clique em “Adicionar lista” na barra acima das listas. Uma janelinha abre. Digite o nome na faixa do topo, onde está escrito “Nome da lista (ex: Roupas)”, e clique em “Adicionar”.',
  'help.guide.packing-categories.step.2':
    'A nova lista começa com uma linha provisória que mostra só três pontinhos claros. Clique em “Adicionar item” na parte de baixo da linha, digite o item em “Nome do item...” e aperte Enter: o primeiro item substitui a linha provisória, e o campo continua aberto para o próximo.',
  'help.guide.packing-categories.step.3':
    'Renomeie uma linha clicando no nome dela ou em Renomear, nos três pontos na ponta direita.',
  'help.guide.packing-categories.step.4':
    'O círculo tracejado com uma pessoa, na faixa superior da lista, atribui membros da viagem à lista. Escolha um nome. Para remover essa pessoa, clique no chip que aparece.',
  'help.guide.packing-categories.step.5':
    'Os três pontos ao lado da contagem abrem mais opções: Renomear, “Marcar todos”, “Desmarcar todos” e “Excluir lista”. “Excluir lista” exclui a lista e todos os itens dela sem pedir confirmação de novo. A seta na ponta direita recolhe a lista.',
  'help.guide.packing-categories.result':
    'A nova lista aparece na grade, com os itens embaixo e o ponto colorido, e o contador dela mostra quantos itens já estão na mala.',
  'help.guide.packing-categories.tip.1':
    'Uma lista só existe por meio dos seus itens. Se você excluir o último item, a linha vira um espaço reservado para que a lista mantenha a posição e a cor; se excluir essa linha também, a lista é excluída.',
  'help.guide.packing-categories.tip.2':
    'Quando você atribui alguém a uma lista, a pessoa recebe uma notificação de bagagem. Isso não muda quem pode ver os itens. Isso se define em “Compartilhando”, no menu de três pontinhos de uma linha.',
  'help.guide.packing-categories.tip.3':
    'Duas listas podem ter o mesmo nome. O TREK as diferencia internamente, então os nomes ficam exatamente como você digitou.',
  // check-off-packing
  'help.guide.check-off-packing.title': 'Marcar os itens enquanto arruma a mala',
  'help.guide.check-off-packing.goal':
    'Marque o que já está na mala, acompanhe a barra de progresso e remova os itens embalados.',
  'help.guide.check-off-packing.step.1':
    'Clique na caixa à esquerda de uma linha. O nome fica riscado, e a barra de progresso é atualizada.',
  'help.guide.check-off-packing.step.2':
    'O cartão de progresso acima das listas mostra quantos itens já estão na mala em relação ao total da lista, em número, em porcentagem e em barra.',
  'help.guide.check-off-packing.step.3':
    'Para marcar uma lista inteira de uma vez: os três pontinhos no cabeçalho dela têm “Marcar todos” e “Desmarcar todos”.',
  'help.guide.check-off-packing.step.4':
    '“Todos”, “Em aberto” e “Concluído”, ao lado de “Compartilhada” e “Minha lista”, filtram a grade. “Em aberto” mostra só o que ainda falta, então uma lista com tudo guardado some.',
  'help.guide.check-off-packing.step.5':
    'O botão vermelho Remover … marcados, na ponta direita do cartão de progresso, com o número de itens marcados, exclui todos de uma vez depois de uma confirmação do navegador.',
  'help.guide.check-off-packing.result':
    'Só os itens pendentes ficam listados, e a barra acima mostra quanto da bagagem já está pronta.',
  'help.guide.check-off-packing.tip.1': 'Um item marcado ainda pode ser renomeado: clique no nome dele.',
  'help.guide.check-off-packing.tip.2':
    '“Marcar todos” e “Desmarcar todos” valem para uma lista de cada vez, pelos três pontos da própria lista.',
  'help.guide.check-off-packing.tip.3':
    'Quando todos os itens estão marcados, o contador dá lugar a “Tudo na mala!”, e a barra fica verde.',
  // apply-packing-template
  'help.guide.apply-packing-template.title': 'Aplicar um modelo de mala',
  'help.guide.apply-packing-template.goal':
    'Adicione uma lista pronta à viagem e salve a lista desta viagem para a próxima.',
  'help.guide.apply-packing-template.step.1': 'Clique em “Aplicar modelo” na barra acima da lista.',
  'help.guide.apply-packing-template.step.2': 'Escolha um modelo. Cada linha mostra o nome e quantos itens ele tem.',
  'help.guide.apply-packing-template.step.3':
    'Os itens entram na visão em que você está: Compartilhada os adiciona à lista que todos veem, e “Minha lista”, à sua lista pessoal.',
  'help.guide.apply-packing-template.step.4':
    'Para guardar a lista desta viagem para a próxima, clique em “Salvar como modelo”. Uma pequena janela abre. Digite um nome no campo do topo, onde aparece “Nome do modelo”, e clique em Salvar.',
  'help.guide.apply-packing-template.result':
    'As listas e os itens do modelo são adicionados à viagem, ao lado do que já havia.',
  'help.guide.apply-packing-template.tip.1':
    'Um modelo copia a lista, a quantidade, o peso e a bolsa de cada item, e cria as bolsas que a viagem ainda não tem. As marcações não são copiadas, e nada que já está na lista é removido.',
  'help.guide.apply-packing-template.tip.2':
    '“Aplicar modelo” só aparece quando já existe algum modelo. Sem modelos, o botão nem aparece.',
  'help.guide.apply-packing-template.tip.3':
    '“Salvar como modelo” só aparece para um administrador da instância, e só enquanto a lista tem itens. Ele salva os itens compartilhados e os seus próprios itens, nunca os itens particulares de outro membro.',
  // import-packing-list
  'help.guide.import-packing-list.title': 'Colar uma lista de bagagem inteira',
  'help.guide.import-packing-list.goal':
    'Transforme de uma vez em itens de bagagem uma lista que você já tem em outro lugar.',
  'help.guide.import-packing-list.step.1':
    'Clique em Importar, o ícone com a seta para baixo na ponta direita da barra acima da lista.',
  'help.guide.import-packing-list.step.2':
    'Um item por linha: Categoria, Nome, Peso em g (opcional), Bolsa (opcional), checked/unchecked (opcional). O exemplo em cinza na caixa mostra os quatro formatos, e os números na borda esquerda contam as linhas que você digita. Uma lista em Markdown também funciona: um título dá nome à lista, e "- [ ]" e "- [x]" viram itens.',
  'help.guide.import-packing-list.step.3':
    'Ou carregue as linhas de um arquivo com “Carregar CSV/TXT/MD”, no canto inferior esquerdo da janela. Ele aceita arquivos .csv, .txt ou .md e substitui o que estiver na caixa.',
  'help.guide.import-packing-list.step.4':
    'Clique em “Importar 3” no canto inferior direito. O número no botão indica quantas linhas o TREK entendeu.',
  'help.guide.import-packing-list.result':
    'Cada linha do arquivo vira uma linha na lista indicada no primeiro campo dela. Os itens que já estavam lá não mudam.',
  'help.guide.import-packing-list.tip.1':
    'Vírgulas, pontos e vírgulas e tabulações separam os campos, e aspas duplas mantêm um campo inteiro, então "Camisa, azul" continua sendo um nome só. Uma linha com um único valor é só um nome. Uma linha sem lista própria vai para “Outro”. "3x" antes de um nome define a quantidade.',
  'help.guide.import-packing-list.tip.2':
    'Se a viagem ainda não tiver a bolsa indicada no quarto campo, o TREK a cria. Importar e “Aplicar modelo” são as duas formas de adicionar pesos e bolsas a vários itens de uma vez.',
  // export-packing-list
  'help.guide.export-packing-list.title': 'Imprimir ou exportar a lista de bagagem',
  'help.guide.export-packing-list.goal':
    'Imprima a lista, salve como PDF ou exporte como arquivo para outro app ou para a próxima viagem.',
  'help.guide.export-packing-list.step.1':
    'Clique em Exportar, o ícone com a seta para cima na barra acima da lista, logo antes de Importar.',
  'help.guide.export-packing-list.step.2':
    '“Checklist em Markdown (.md)” e “CSV para importação (.csv)” salvam a lista como arquivo na hora.',
  'help.guide.export-packing-list.step.3':
    'Clique em “Imprimir ou salvar como PDF”. A prévia mostra a lista como uma página: no topo, a viagem, as datas e quanto já está na mala; depois, cada lista como um cartão, com uma caixinha para marcar em cada item.',
  'help.guide.export-packing-list.step.4':
    'Clique em “Imprimir ou salvar como PDF”, abaixo da pré-visualização. O navegador abre a janela de impressão: escolha uma impressora, ou “Salvar como PDF” para salvar um arquivo.',
  'help.guide.export-packing-list.result':
    'A impressão e os arquivos trazem a visualização que estiver aberta, “Compartilhada” ou “Minha lista”, com as quantidades, os pesos e as marcações.',
  'help.guide.export-packing-list.tip.1':
    'O CSV está no formato que “Importar” lê, com as malas incluídas, então você pode usá-lo como seu próprio modelo de bagagem: é só importá-lo na próxima viagem.',
  'help.guide.export-packing-list.tip.2':
    'O arquivo Markdown abre como checklist no Obsidian, no Notion ou no GitHub, e você pode importá-lo de novo com Importar.',
  // share-packing-item
  'help.guide.share-packing-item.title': 'Decidir quem vê um item e quem o leva',
  'help.guide.share-packing-item.goal':
    'Mova um item entre a lista comum do grupo, a sua própria lista e as pessoas para quem você vai levá-lo.',
  'help.guide.share-packing-item.step.1':
    'Acima das listas, “Compartilhada” é a lista que todos veem e “Minha lista” é a sua. Cada uma mostra quantos itens tem. Clique em “Minha lista” para ver a sua.',
  'help.guide.share-packing-item.step.2':
    'De volta em “Compartilhada”, abra os três pontinhos no fim de uma linha e clique em “Compartilhando”.',
  'help.guide.share-packing-item.step.3':
    'Há três níveis: “Compartilhada”, visível para todo o grupo; “Pessoal”, que só você vê; e “Compartilhar com…”, em que você escolhe as pessoas para quem o item vale.',
  'help.guide.share-packing-item.step.4':
    'Um item “Pessoal” fica só em “Minha lista”. Mude para “Minha lista” para encontrá-lo.',
  'help.guide.share-packing-item.step.5':
    'Abra Compartilhando de novo e marque um nome em “Compartilhar com…”. O item passa a aparecer também na lista dessa pessoa, e a linha ganha um pequeno selo com o número de pessoas com quem ele está compartilhado.',
  'help.guide.share-packing-item.result': 'O item fica no nível escolhido, e a linha mostra quem vai levá-lo.',
  'help.guide.share-packing-item.tip.1':
    'Só quem vai levar um item pode mudar o compartilhamento dele. Quem recebeu o compartilhamento vê o item na própria “Minha lista”, com um pequeno selo de mão que mostra o seu nome quando a pessoa passa o mouse. Ela pode marcá-lo.',
  'help.guide.share-packing-item.tip.2':
    'Em um item compartilhado que outra pessoa vai levar, o menu de três pontos mostra duas outras opções no lugar de “Compartilhando”: “Eu também posso levar”, que coloca você ao lado dela, e “Copiar para minha lista”, que cria uma cópia particular para você.',
  'help.guide.share-packing-item.tip.3':
    'Itens novos recebem o compartilhamento da visão em que você os adiciona. Itens adicionados em Compartilhada são compartilhados com todos. Itens adicionados em “Minha lista” ficam como Pessoal, a menos que todos os itens dessa lista estejam compartilhados com as mesmas pessoas: nesse caso, o novo item também é compartilhado com elas.',
  // packing-bags
  'help.guide.packing-bags.title': 'Pesar as malas',
  'help.guide.packing-bags.goal':
    'Informe o peso de cada item, distribua os itens nas malas e mantenha cada mala dentro do limite da companhia aérea.',
  'help.guide.packing-bags.step.1': 'Clique na etiqueta de peso antes do círculo e digite o peso do item em gramas.',
  'help.guide.packing-bags.step.2': 'O círculo depois do peso é a bolsa do item. Clique nele.',
  'help.guide.packing-bags.step.3':
    'Se ainda não houver bolsa, clique em “Adicionar mala”, digite um nome e pressione Enter. A bolsa é criada, e o item vai para ela.',
  'help.guide.packing-bags.step.4':
    'O cartão Malas aparece à direita das listas assim que existe uma bolsa. Cada bolsa mostra o nome, quem a leva, uma barra de ocupação, quantos itens tem e o peso. Abaixo das bolsas vêm “Não atribuído” e “Peso total” e, embaixo, “Na mala”: o peso já embalado, com uma barra fina mostrando a proporção.',
  'help.guide.packing-bags.step.5':
    'Clique em “Definir limite”, ao lado do peso da bolsa, e digite o limite em quilos, como as companhias aéreas informam.',
  'help.guide.packing-bags.step.6':
    'O mais tracejado no fim da linha com o nome da bolsa, logo antes do X, abre “Atribuir membros”. Marque os membros que levam a bolsa: eles aparecem ao lado do mais, e “Por pessoa”, no fim do cartão, lista o que cada um leva.',
  'help.guide.packing-bags.result':
    'O cartão Malas, à direita, mostra o peso de cada bolsa em relação ao limite, o que não está em nenhuma bolsa, o que cada pessoa leva e o total, com quanto dele já está na mala.',
  'help.guide.packing-bags.tip.1':
    'O campo de peso, o círculo da mala e o cartão “Malas” só existem enquanto um administrador mantiver “Rastreamento de malas” ativado no addon Listas. Em uma janela mais estreita, as malas abrem pelo botão “Malas” acima do cartão de progresso.',
  'help.guide.packing-bags.tip.2':
    'O servidor calcula o peso de uma mala com os itens de todos os membros, inclusive os que você não pode ver, então o número é o peso real da mala.',
  'help.guide.packing-bags.tip.3':
    'Uma mala sem limite é comparada com a mala mais pesada, para você poder comparar as barras. Se você definir um limite para a mala, a barra passa a ser medida por esse limite.',
  // create-todo
  'help.guide.create-todo.title': 'Adicionar uma tarefa',
  'help.guide.create-todo.goal': 'Anote uma tarefa, com lista, prioridade, data e pessoa responsável.',
  'help.guide.create-todo.step.1': 'Clique em “Nova tarefa”, na ponta direita da barra.',
  'help.guide.create-todo.step.2':
    'A janela “Nova tarefa” abre com o cursor no topo. Digite o nome no campo “Nome da tarefa” e acrescente em Descrição o que quiser lembrar.',
  'help.guide.create-todo.step.3':
    '“Lista” agrupa a tarefa. Escolha uma ou use o sinal de mais ao lado para criar uma nova em uma pequena janela.',
  'help.guide.create-todo.step.4': '“Prioridade” tem quatro botões: Nenhum, P1, P2 e P3, do vermelho ao azul.',
  'help.guide.create-todo.step.5':
    '“Data de vencimento”, ao lado de “Lista”, abre um calendário, e “Atribuído a” atribui a tarefa a uma pessoa.',
  'help.guide.create-todo.step.6': 'Clique em “Criar tarefa”.',
  'help.guide.create-todo.result':
    'A tarefa aparece na lista, com a prioridade, a data de vencimento e a lista em selos e o avatar do responsável no fim da linha, e abre no painel da direita.',
  'help.guide.create-todo.tip.1':
    'Só o nome é obrigatório. Todo o resto pode ser preenchido depois pelo painel da direita.',
  'help.guide.create-todo.tip.2': 'Com uma lista selecionada na barra lateral, a tarefa nova já começa nessa lista.',
  'help.guide.create-todo.tip.3': 'Apertar Enter no campo do nome cria a tarefa na hora, sem mexer nos outros campos.',
  // todo-filters
  'help.guide.todo-filters.title': 'Encontrar e alterar uma tarefa',
  'help.guide.todo-filters.goal': 'Mostre só as tarefas que importam agora e edite a tarefa que você encontrou.',
  'help.guide.todo-filters.step.1':
    '“Tarefas”, na barra lateral: “Todos” mostra tudo o que ainda está pendente, “Minhas tarefas” mostra o que foi atribuído a você, “Atrasada” mostra tarefas com data no passado e “Concluído” mostra as tarefas finalizadas. Cada filtro mostra a sua contagem. Clique em “Atrasada”.',
  'help.guide.todo-filters.step.2':
    'Em Listas há uma linha por lista. Escolha uma para ver essa lista, inclusive as tarefas concluídas.',
  'help.guide.todo-filters.step.3':
    'A ordenação no topo da lista muda a ordem do que está na tela: Prioridade coloca P1 primeiro, e “Data de vencimento” coloca o prazo mais próximo primeiro. Só dá para usar uma das duas por vez, e um segundo clique volta para a sua ordem.',
  'help.guide.todo-filters.step.4': 'Clique em uma tarefa para abri-la no painel da direita.',
  'help.guide.todo-filters.step.5':
    'Altere o que precisar: o nome, Prioridade, Lista, “Data de vencimento” ou “Atribuído a”. Descrição mostra o texto com links clicáveis; clique nela para editar. Depois clique em “Salvar alterações”, no fim do painel. A caixa no cabeçalho do painel marca a tarefa como concluída, e Excluir, ao lado de “Salvar alterações”, a exclui na hora.',
  'help.guide.todo-filters.result':
    'A lista mostra só as tarefas que você pediu, e o painel da direita edita a que você selecionou.',
  'help.guide.todo-filters.tip.1':
    'Uma linha de lista conta só as tarefas em aberto, mas, quando você a seleciona, as tarefas concluídas também aparecem. “Todos”, “Minhas tarefas” e “Atrasada” ocultam as tarefas concluídas; “Concluído” mostra só as concluídas.',
  'help.guide.todo-filters.tip.2':
    '“Prioridade” e “Data de vencimento” não podem ser usadas juntas na ordenação. Enquanto uma delas estiver ativa, não dá para arrastar as linhas para uma ordem sua.',

  // ── Screen: trip-bookings ─────────────────────────────────────────────────────────────
  'help.ctx.trip-bookings.title': 'Reservas',
  'help.ctx.trip-bookings.summary':
    'Esta aba reúne tudo o que foi reservado para a viagem, menos transporte: hospedagens, mesas, ingressos, passeios e estacionamentos. Cada reserva é um cartão, uma linha de lista ou uma barra na linha do tempo, com código, documentos, viajantes e custo. Clique em uma reserva para abrir os detalhes.',
  'help.ctx.trip-bookings.bullet.1':
    '“Reserva manual”, na ponta direita da barra, abre “Nova reserva”. Ela cria seis tipos de reserva: Hospedagem, Restaurante, Evento, Passeio, Estacionamento e Outro. Voos, trens e outros transportes ficam na aba Transportes e nunca aparecem aqui.',
  'help.ctx.trip-bookings.bullet.2':
    'O ícone de download antes de “Reserva manual”, “Importar confirmações de reserva”, envia confirmações para o TREK ler automaticamente: EML, PDF, PKPass, HTML ou TXT, no máximo cinco arquivos de 10 MB, e fotos quando o modelo de IA lê imagens. O ícone só aparece quando o servidor consegue ler esses arquivos.',
  'help.ctx.trip-bookings.bullet.3':
    '“Buscar” procura em títulos, tipos, lugares, notas, códigos de reserva e viajantes. “Filtrar”, o funil ao lado, restringe a aba por Status, por Tipo, com uma contagem para cada um, e por Viajantes, assim que alguma reserva tiver pessoas indicadas. Um número no funil mostra quantos filtros estão ativos.',
  'help.ctx.trip-bookings.bullet.4':
    'Os três ícones depois de Filtrar mudam a visualização: Cartões, Lista e “Linha do tempo”. “Opções de visualização”, os controles deslizantes ao lado, agrupa e ordena cartões e lista ou define as faixas da linha do tempo, e o ícone de planilha logo depois, “Exportar como planilha (CSV)”, baixa como arquivo o que a aba mostra. Por padrão, os cartões ficam agrupados em Confirmada e Pendente, e a lista, por dia. Clique no título de uma seção para recolhê-la.',
  'help.ctx.trip-bookings.bullet.5':
    'O cartão tem um cabeçalho colorido conforme o status, com o ponto de status (um clique alterna entre Pendente e Confirmada), o tipo, o título, o lápis e a lixeira. Abaixo dele ficam os dados que a reserva tiver: Data, Hora, Código da reserva, Check-in e Check-out, Local / endereço, Hospedagem, Vinculada a (a parada no plano), Link, Notas, Viajantes, Arquivos e os custos vinculados.',
  'help.ctx.trip-bookings.bullet.6':
    'Um clique em um cartão, uma linha ou uma barra abre o detalhe da reserva, com “No mapa” (quando a reserva tem um lugar), a lixeira e Editar no rodapé. Excluir pergunta uma vez (“Excluir reserva?”, que avisa se custos serão excluídos junto). Depois, a reserva e as despesas vinculadas são excluídas, e, no caso de uma hospedagem, as noites dela saem do plano do dia.',
  // booking-views
  'help.guide.booking-views.title': 'Mudar a visualização e abrir uma reserva',
  'help.guide.booking-views.goal':
    'Veja as reservas como cartões, em lista ou numa linha do tempo, e abra uma para ver todos os detalhes.',
  'help.guide.booking-views.step.1':
    'Os três ícones depois de Filtrar, na barra, são as visualizações, e cada um mostra o nome quando você aponta para ele: Cartões, Lista e “Linha do tempo”. A aba abre em Cartões, com um cartão por reserva nas seções Confirmada e Pendente. Clique em Lista, o do meio.',
  'help.guide.booking-views.step.2':
    'Lista mostra uma linha por reserva, sob um título para cada dia, com o dia e o horário à direita; as setas do teclado passam de uma linha para outra. Clique em “Linha do tempo”, a última das três.',
  'help.guide.booking-views.step.3':
    '“Linha do tempo” mostra as reservas ao longo dos dias da viagem: uma faixa por tipo e uma barra do início ao fim de cada reserva. Uma reserva pendente tem contorno tracejado. Viagem encaixa a viagem inteira na largura; clique no título de um dia para ver esse dia hora a hora.',
  'help.guide.booking-views.step.4':
    'Dia mostra um único dia em uma escala de horas, e o comprimento de cada barra indica a duração. As setas ao lado do nome do dia levam ao dia anterior e ao seguinte. Durante a viagem, Hoje vai para o dia atual, e o seletor Viagem e Dia, à direita, volta para a viagem inteira.',
  'help.guide.booking-views.step.5':
    'Passe o mouse sobre uma barra para ver o dia, os horários e o local dela, e clique para abrir os detalhes da reserva. Um cartão em “Cartões” e uma linha em “Lista” abrem a mesma janela.',
  'help.guide.booking-views.step.6':
    'O cabeçalho da visualização detalhada mostra o título e selos com o status (um clique o alterna), o tipo, o dia e o código da reserva, com um botão que copia o código. Abaixo vêm os horários em blocos e depois o lugar, os viajantes, as notas, os custos e os arquivos, se a reserva tiver, e no rodapé “No mapa”, a lixeira e “Editar”.',
  'help.guide.booking-views.result':
    'A reserva abre na visualização de detalhes: “Editar” abre o formulário, “No mapa” mostra a reserva no plano, e “Encerrar” ou Esc levam você de volta à visualização de onde veio.',
  'help.guide.booking-views.tip.1':
    '“Opções de visualização”, o ícone de controles deslizantes depois dos ícones de visualização, permite agrupar e ordenar “Cartões” e “Lista” com “Agrupar por” e “Ordenar por”. Em “Linha do tempo”, oferece “Uma faixa por tipo” e “Mostrar a outra aba”. “Mostrar a outra aba” exibe as entradas da aba “Transportes”, esmaecidas, numa faixa fina no topo. “Redefinir visualização” restaura o padrão, e cada aba lembra a própria visualização neste navegador.',
  'help.guide.booking-views.tip.2':
    'Uma reserva antes ou depois da viagem, ou sem data, não pode aparecer na linha do tempo. Ela aparece abaixo do gráfico como um pequeno cartão em “Antes da viagem”, “Depois da viagem” ou “Sem data”.',
  'help.guide.booking-views.tip.3':
    'Os mesmos detalhes abrem em qualquer lugar onde a reserva apareça: na aba Transportes, no plano do dia, nos detalhes de um dia e nos de um lugar. Um clique no título renomeia a reserva.',
  // create-booking
  'help.guide.create-booking.title': 'Criar uma reserva',
  'help.guide.create-booking.goal':
    'Adicione manualmente à viagem um restaurante, um evento, um passeio, uma vaga de estacionamento ou qualquer outra coisa.',
  'help.guide.create-booking.step.1':
    'Clique em “Reserva manual”, na ponta direita da barra. Abre “Nova reserva”, com o título e dois selos num cabeçalho no topo.',
  'help.guide.create-booking.step.2':
    'Clique no rótulo do tipo na faixa do topo, que mostra “Outro” numa reserva nova, e escolha o “Tipo de reserva”. Esta aba cria seis tipos: Hospedagem, Restaurante, Evento, Passeio, Estacionamento e Outro. O formulário muda conforme a escolha: só Hospedagem usa um intervalo de dias em vez de datas.',
  'help.guide.create-booking.step.3':
    'Digite o título na faixa do topo, o campo acima das etiquetas. É o único campo obrigatório, e “Adicionar” fica cinza até você preencher algo.',
  'help.guide.create-booking.step.4':
    'Defina Data e “Horário de início” e, se a reserva tiver fim, “Data final” e “Horário de término”. Os calendários só oferecem dias dentro da viagem. Uma data e um horário de término que não sejam posteriores ao início aparecem em vermelho e bloqueiam Adicionar. Um horário de término antes do de início, sem data final, só gera um aviso: se a reserva termina no dia seguinte, defina uma data final.',
  'help.guide.create-booking.step.5':
    'Informe o “Código da reserva” que está na confirmação e clique na pílula de status no cabeçalho, ao lado do tipo. Ela mostra Pendente em uma reserva nova e muda para Confirmada. O status define em que seção o cartão aparece.',
  'help.guide.create-booking.step.6': 'Clique em Adicionar no fim do formulário.',
  'help.guide.create-booking.result':
    'A reserva aparece como cartão na seção dela. A cor do cabeçalho indica o status, e o cartão mostra o tipo, a data, os horários e o código. Todos da viagem a veem na hora.',
  'help.guide.create-booking.tip.1':
    '“Local / endereço” sugere endereços reais enquanto você digita. Ao escolher um, ele substitui o que você escreveu. Um endereço digitado por você fica como está.',
  'help.guide.create-booking.tip.2':
    'Em “Link”, informe a página da própria reserva no site do fornecedor. O cartão e a visualização detalhada mostram esse endereço como um link que abre numa nova aba.',
  'help.guide.create-booking.tip.3':
    'As notas aceitam Markdown, então uma lista ou uma linha em negrito aparece como lista ou negrito no cartão e nos detalhes.',
  // booking-hotel
  'help.guide.booking-hotel.title': 'Reservar uma hospedagem',
  'help.guide.booking-hotel.goal':
    'Cadastre uma hospedagem para que ela conte ao mesmo tempo como reserva e como noites no plano do dia.',
  'help.guide.booking-hotel.step.1':
    'Clique em “Reserva manual” e escolha Hospedagem na pílula de tipo, na faixa superior. Os campos de data dão lugar a um bloco de campos de hotel.',
  'help.guide.booking-hotel.step.2':
    'Escolha o hotel em Hospedagem. A lista traz os lugares da viagem, sem trilhas e passeios importados. Ao escolher um, o nome dele vai para o título, se estiver vazio, e o endereço para “Local / endereço”.',
  'help.guide.booking-hotel.step.3':
    'Defina De e Até: a primeira noite e a manhã em que você vai embora. Os dois oferecem os dias da viagem com as datas, e o TREK mantém Até depois de De.',
  'help.guide.booking-hotel.step.4':
    'Preencha “Check-in”, “Check-in até” e “Check-out”, e o “Código da reserva” que está na confirmação.',
  'help.guide.booking-hotel.step.5': 'Clique em “Adicionar”.',
  'help.guide.booking-hotel.result':
    'O cartão mostra o intervalo de dias em “Data”, os horários de check-in e check-out e o endereço. A estadia agora também aparece nesses dias do plano.',
  'help.guide.booking-hotel.tip.1':
    '“Hospedagem” é o único tipo sem “Data” e sem “Horário de início”. As datas dela são “De” e “Até”, e você escolhe dias da viagem, não datas do calendário.',
  'help.guide.booking-hotel.tip.2':
    'Deixe Hospedagem em branco e digite o endereço no lugar: o lugar é pesquisado, criado e marcado no mapa para você.',
  'help.guide.booking-hotel.tip.3': 'Quando você exclui a reserva, as noites dela também saem do plano do dia.',
  // link-booking
  'help.guide.link-booking.title': 'Vincular uma reserva ao plano',
  'help.guide.link-booking.goal':
    'Vincule uma reserva à parada e ao lugar dela, para que ela apareça onde você precisa.',
  'help.guide.link-booking.step.1':
    'Passe o mouse sobre o cartão que você quer vincular e clique no lápis do cabeçalho. Abre “Editar reserva”.',
  'help.guide.link-booking.step.2':
    'Abra “Vincular à atribuição do dia”. A lista mostra o seu plano: um título para cada dia e, abaixo dele, as paradas daquele dia, numeradas e com os horários. Escolha a parada à qual a reserva pertence.',
  'help.guide.link-booking.step.3':
    '“Local / Atividade” vincula o próprio lugar. Escolha o lugar ali, e o título e “Local / endereço” são preenchidos se estiverem vazios.',
  'help.guide.link-booking.step.4': 'Clique em Atualizar.',
  'help.guide.link-booking.result':
    'O cartão mostra o dia e a parada em “Vinculada a”, e a reserva aparece com essa parada no plano do dia.',
  'help.guide.link-booking.tip.1':
    '“Sem vínculo (avulsa)”, no topo da lista, remove o vínculo. Hospedagem não tem seletor de parada: ela se vincula pelas noites.',
  'help.guide.link-booking.tip.2':
    'Escolher uma parada em um dia com data preenche a “Data”, se ela estiver vazia. Uma data que você já definiu não muda.',
  // booking-travelers
  'help.guide.booking-travelers.title': 'Definir para quem é a reserva',
  'help.guide.booking-travelers.goal':
    'Marque para quais viajantes uma reserva vale e depois veja só as reservas deles.',
  'help.guide.booking-travelers.step.1':
    'Abra a reserva pelo lápis no cartão dela. “Viajantes” fica ao lado do “Código da reserva” e mostra “Atribuir viajantes” enquanto ninguém estiver atribuído à reserva.',
  'help.guide.booking-travelers.step.2':
    'Clique nele e escolha para quem é esta reserva; convidados com nome também aparecem na lista. Quem for selecionado ganha um tique, e o avatar aparece no campo. Clique de novo no nome para remover a pessoa.',
  'help.guide.booking-travelers.step.3': 'Clique em Atualizar.',
  'help.guide.booking-travelers.step.4':
    'Clique em Filtrar na barra: em Viajantes, clique em uma pessoa para ver só as reservas dela. Várias pessoas podem ficar ativas ao mesmo tempo.',
  'help.guide.booking-travelers.result':
    'O cartão lista as pessoas a quem a reserva se refere, e “Filtrar” restringe a aba às reservas das pessoas que você escolher.',
  'help.guide.booking-travelers.tip.1':
    'No cartão e na visualização detalhada, os viajantes só aparecem; não dá para alterá-los ali. Você os define aqui, no formulário.',
  'help.guide.booking-travelers.tip.2':
    '“Viajantes” aparece em “Filtrar” quando a viagem tem mais de um membro e pelo menos uma reserva tem alguém indicado. Sua escolha fica valendo até você fechar a aba do navegador.',
  // booking-files
  'help.guide.booking-files.title': 'Guardar o voucher junto com a reserva',
  'help.guide.booking-files.goal': 'Anexe a confirmação, o bilhete ou o passe à reserva correspondente.',
  'help.guide.booking-files.step.1':
    'Abra a reserva pelo lápis no cartão dela. Arquivos fica ao lado de Vincular; clique ali em “Anexar arquivo”. Em uma reserva já existente, o documento é enviado na hora, e o TREK mostra “Arquivo enviado”.',
  'help.guide.booking-files.step.2': 'O documento aparece pelo nome, com um botão para abri-lo e um X ao lado.',
  'help.guide.booking-files.step.3':
    '“Vincular arquivo existente” mostra os documentos da viagem que ainda não estão nesta reserva. Escolha um e ele é anexado sem precisar enviar de novo.',
  'help.guide.booking-files.step.4': 'Clique em “Atualizar”.',
  'help.guide.booking-files.result':
    'O cartão e a tela de detalhes listam os documentos em Arquivos. Clique em um documento para abri-lo. “Mostrar nos arquivos”, acima da lista na tela de detalhes, leva você à aba Arquivos.',
  'help.guide.booking-files.tip.1':
    'Em uma reserva que você ainda está criando, o documento é enviado quando você clica em Adicionar. Enviar exige conexão.',
  'help.guide.booking-files.tip.2':
    'O X ao lado de um documento remove o vínculo, não o documento. Ele continua na aba “Arquivos” da viagem.',
  'help.guide.booking-files.tip.3':
    'O administrador define quais tipos de arquivo podem ser anexados, em “Tipos de arquivo permitidos”. Por padrão, documentos, textos e imagens são permitidos.',
  // booking-cost
  'help.guide.booking-cost.title': 'Transformar o preço de uma reserva em custo',
  'help.guide.booking-cost.goal':
    'Adicione o custo de uma reserva a Custos, dividido entre as pessoas que pagam por ela.',
  'help.guide.booking-cost.step.1':
    'Abra a reserva pelo lápis no cartão e vá até o fim do formulário. Em Custos ficam “Criar despesa” e “Vincular despesa existente”, com a observação Salva a reserva e depois abre o editor de Custos.',
  'help.guide.booking-cost.step.2':
    'Clique em “Criar despesa”. A reserva é salva, o formulário fecha e o editor de Custos abre como “Adicionar despesa”.',
  'help.guide.booking-cost.step.3':
    'O nome no cabeçalho já é o título da reserva, e Dia já é o dia da reserva. Informe o “Valor total” e confira a Moeda ao lado.',
  'help.guide.booking-cost.step.4':
    'O selo no cabeçalho é a Categoria, já definida como a que corresponde ao tipo de reserva. Em “Quem pagou?”, escolha quem pagou e, em “Dividir”, como o valor é dividido.',
  'help.guide.booking-cost.step.5': 'Clique em “Adicionar despesa”.',
  'help.guide.booking-cost.result':
    'O cartão mostra o valor na parte de baixo, o formulário da reserva lista a despesa em “Despesas vinculadas”, e a mesma despesa aparece na aba “Custos”, vinculada a esta reserva.',
  'help.guide.booking-cost.tip.1':
    'A categoria depende do tipo: Restaurante vira “Comida e bebida”, Hospedagem vira Hospedagem, Estacionamento vira Estacionamento, e Evento e Passeio viram Outro.',
  'help.guide.booking-cost.tip.2':
    'Uma reserva pode ter várias despesas. “Vincular despesa existente” oferece as despesas de Custos que ainda não estão vinculadas a nada. Em uma despesa vinculada, “Desvincular, manter a despesa” remove o vínculo e mantém a despesa em Custos, enquanto a lixeira a exclui.',
  'help.guide.booking-cost.tip.3':
    'Custos só aparece no formulário enquanto o complemento Custos estiver ativado, o que o administrador faz em Complementos.',
  // filter-bookings
  'help.guide.filter-bookings.title': 'Encontrar uma reserva',
  'help.guide.filter-bookings.goal': 'Filtre uma aba longa por palavra, status, tipo ou pessoa.',
  'help.guide.filter-bookings.step.1':
    'Digite em “Buscar”, na barra. A busca procura em títulos, tipos, lugares e endereços, notas, códigos de reserva e nomes dos viajantes, e a aba vai mostrando menos resultados enquanto você digita. Esc limpa a caixa.',
  'help.guide.filter-bookings.step.2':
    'Clique em “Filtrar”, o funil ao lado da busca. O painel tem “Status”, “Tipo” e, quando alguma reserva tiver pessoas atribuídas, “Viajantes”.',
  'help.guide.filter-bookings.step.3':
    'Em Status, escolha Confirmada ou Pendente para ver só essas; Todos mostra as duas.',
  'help.guide.filter-bookings.step.4':
    'Em Tipo, clique em um ou mais tipos para ver só esses. Cada tipo mostra quantas reservas tem, e um tique marca os selecionados.',
  'help.guide.filter-bookings.step.5':
    'Um número em Filtrar mostra quantos filtros estão ativos, e um chip ao lado da busca mostra quantas reservas sobraram do total. Clique no chip, ou em “Limpar filtros” no fim do painel, para ver tudo de novo.',
  'help.guide.filter-bookings.result':
    'A aba mostra só o que você escolheu, tanto em “Cartões” quanto em “Lista” e “Linha do tempo”, e os filtros ficam ativos nesta viagem até você fechar a aba do navegador.',
  'help.guide.filter-bookings.tip.1':
    '“Tipo” só aparece quando a aba tem mais de um tipo, e lista só os tipos que estão nela. Então, se a aba não tiver nenhum passeio, “Tipo” não tem a opção “Passeio”.',
  'help.guide.filter-bookings.tip.2':
    'Se nada corresponder ao filtro, a aba mostra “Nada corresponde a esses filtros”, com “Limpar filtros” logo abaixo.',
  // import-booking-file
  'help.guide.import-booking-file.title': 'Importar uma reserva pela confirmação',
  'help.guide.import-booking-file.goal':
    'Deixe o TREK ler a reserva a partir do e-mail ou do PDF enviado pelo fornecedor, para você não precisar digitar tudo de novo.',
  'help.guide.import-booking-file.step.1':
    'Clique no ícone de download na barra, “Importar confirmações de reserva”; o nome aparece quando você passa o mouse. A janela com o mesmo nome abre.',
  'help.guide.import-booking-file.step.2':
    'Solte as confirmações na caixa, ou clique nela e escolha os arquivos: EML, PDF, PKPass, HTML e TXT, até cinco arquivos de 10 MB cada, e fotos (JPG, PNG, WEBP) quando o modelo de IA consegue ler imagens. A caixa mostra o nome dos arquivos escolhidos.',
  'help.guide.import-booking-file.step.3':
    'Clique em Importar. A janela fecha na hora, porque a leitura acontece em segundo plano.',
  'help.guide.import-booking-file.step.4':
    'Um cartão no canto inferior direito mostra o progresso abaixo do nome do arquivo. Ele continua visível enquanto você navega pelo app e depois de recarregar a página. “Analisando arquivos…” vira um ✓ quando a leitura termina, e o cartão oferece “Importar”. Clique nele.',
  'help.guide.import-booking-file.step.5':
    'Cada reserva encontrada abre em “Nova reserva”, uma depois da outra, já preenchida. Para um hotel, isso inclui o nome dele como título e, se a viagem tiver o lugar, em “Hospedagem”, o “Local / endereço”, “De” e “Até” nas noites da estadia, Check-in e Check-out, o “Código da reserva”, a confirmação em Arquivos e, com Custos ativado, o preço como “Despesa vinculada”. Confira e clique em “Adicionar”.',
  'help.guide.import-booking-file.result':
    'A reserva aparece como cartão em “Pendente”, com as noites, o código e a confirmação em “Arquivos”. A estadia aparece nesses dias do plano. Se “Custos” estiver ativado, o preço é lançado como despesa vinculada à reserva.',
  'help.guide.import-booking-file.tip.1':
    'O ícone de importação só aparece quando o servidor consegue ler confirmações. Para isso, é preciso ter o extrator ou o complemento “Análise por IA”. O administrador liga o complemento “Análise por IA” em “Complementos”. Uma aba sem reservas também mostra essa opção como o botão “Importar de arquivo”.',
  'help.guide.import-booking-file.tip.2':
    'Se nada puder ser lido, o cartão avisa. Com “Análise por IA” ativada, ele oferece “Tentar leitura com IA”, que envia os mesmos arquivos direto para o modelo. Uma leitura concluída fica guardada por dez minutos; comece a revisão dentro desse prazo.',
  'help.guide.import-booking-file.tip.3':
    'A confirmação só é anexada quando o tipo dela está em “Tipos de arquivo permitidos”, nas configurações de administração. PDF é permitido por padrão; um e-mail, EML, precisa ser adicionado antes, senão a reserva é salva sem ela.',
  // edit-booking
  'help.guide.edit-booking.title': 'Alterar uma reserva',
  'help.guide.edit-booking.goal':
    'Corrija um horário, adicione o código que chegou depois ou mude uma reserva de “Pendente” para “Confirmada”.',
  'help.guide.edit-booking.step.1':
    'Passe o mouse sobre o cartão e clique no lápis do cabeçalho. Abre “Editar reserva” com todos os dados da reserva.',
  'help.guide.edit-booking.step.2':
    'Mude o que for preciso, por exemplo o “Código da reserva” que a empresa enviou depois.',
  'help.guide.edit-booking.step.3':
    'Clique na etiqueta “Pendente” na faixa do topo. Ela muda para “Confirmada”, e a faixa fica verde.',
  'help.guide.edit-booking.step.4': 'Clique em Atualizar.',
  'help.guide.edit-booking.result':
    'O cartão muda de lugar: uma reserva confirmada aparece na seção Confirmada, com ponto verde e faixa superior verde, e todos da viagem veem a mudança.',
  'help.guide.edit-booking.tip.1':
    'Se você não consegue ler um “Código da reserva”, é porque “Ocultar códigos de reserva” está ativado em Configurações, na aba Exibição. Passe o mouse sobre o código, ou clique nele, para lê-lo.',
  'help.guide.edit-booking.tip.2':
    'Se você mudar o tipo, a categoria de uma despesa vinculada muda junto, a menos que você tenha escolhido a categoria manualmente no editor de Custos.',
  'help.guide.edit-booking.tip.3':
    '“Editar”, no rodapé da visualização detalhada de uma reserva, abre o mesmo formulário. Você também pode mudar o status sem formulário nenhum: clique no ponto de um cartão ou de uma linha, ou no selo de status na visualização detalhada.',
  // delete-booking
  'help.guide.delete-booking.title': 'Excluir uma reserva',
  'help.guide.delete-booking.goal': 'Remova da viagem uma reserva cancelada.',
  'help.guide.delete-booking.step.1':
    'Aponte para o cartão e clique na lixeira do cabeçalho. A lixeira no fim dos detalhes de uma reserva faz o mesmo.',
  'help.guide.delete-booking.step.2':
    '“Excluir reserva?” mostra o nome da reserva escolhida e avisa que ela será excluída permanentemente. Quando há custos vinculados, avisa que eles também serão excluídos.',
  'help.guide.delete-booking.step.3': 'Clique em Excluir.',
  'help.guide.delete-booking.result':
    'O cartão é excluído para todos da viagem. Não dá para desfazer a exclusão de uma reserva, então a pergunta de confirmação é a sua última chance de cancelar.',
  'help.guide.delete-booking.tip.1':
    'Excluir uma reserva também remove as despesas vinculadas a ela. Excluir uma hospedagem também remove as noites dela do plano do dia.',
  'help.guide.delete-booking.tip.2':
    'Os documentos anexados continuam na aba Arquivos da viagem; só o vínculo deles com a reserva é removido.',

  // ── Screen: trip-costs ────────────────────────────────────────────────────────────────
  'help.ctx.trip-costs.title': 'Custos',
  'help.ctx.trip-costs.summary':
    'O dinheiro da viagem: cada despesa em um extrato por data ou em uma tabela, quem lançou e quem deve por ela, na moeda do comprovante. A coluna da direita mostra quem precisa pagar a quem para acertar as contas.',
  'help.ctx.trip-costs.bullet.1':
    'A barra no topo mostra as datas da viagem e os viajantes entre os quais os custos são divididos. Ela também traz “Buscar despesas…”, Filtrar (o funil), “Exportar CSV” (o ícone de download) e o seletor Lista / Tabela.',
  'help.ctx.trip-costs.bullet.2':
    'Na ponta direita, “Acertar contas” registra todas as transferências em aberto de uma vez, “Escanear comprovante” preenche uma despesa a partir de uma foto quando o complemento “Análise por IA” consegue ler imagens, e “Adicionar despesa” abre o editor.',
  'help.ctx.trip-costs.bullet.3':
    'Quatro cartões abaixo da barra: “Você deve” e “Devem a você” mostram o seu lado do acerto, “Valor pendente” é o que foi registrado mas ainda não tem quem pagou, e “Gasto total da viagem” soma tudo, com “Sua parte” e “Você pagou” logo abaixo.',
  'help.ctx.trip-costs.bullet.4':
    'O extrato é agrupado por dia, do mais recente ao mais antigo, e cada dia mostra quantos lançamentos tem e quanto foi gasto. Uma linha mostra a categoria como uma aba colorida, o nome, os chips de quem pagou, com o valor de cada um e, abaixo, Dividir com a parte de cada viajante (uma marca indica quem já pagou a sua), depois a nota e o valor, além de “você emprestou” ou “você pegou emprestado” quando a divisão faz os outros deverem a você ou você dever a eles.',
  'help.ctx.trip-costs.bullet.5':
    'A coluna da direita mostra os resultados: “Acertar contas” lista quem paga quem, “Saldos” mostra o saldo positivo ou negativo de cada viajante, “Orçamento final” mostra quanto a viagem custa para cada um, e “Por categoria” mostra em que o dinheiro foi gasto.',
  'help.ctx.trip-costs.bullet.6':
    'Um pagamento registrado aparece no mesmo extrato, em uma linha própria, com um lápis e Desfazer ao lado. Uma despesa tem um lápis e uma lixeira, e a lixeira pede confirmação antes de excluí-la. Uma despesa com comprovantes tem um chip Comprovante ao lado do nome, que os abre.',
  'help.ctx.trip-costs.bullet.7':
    '“Tabela”, na barra, mostra as mesmas despesas como uma planilha, agrupadas por categoria, com “Pessoas” e “Dias” e o valor por pessoa e por dia. Nesse caso, “Resumo” substitui “Por categoria”. “Custos” lembra a visualização que você escolheu.',
  // add-expense
  'help.guide.add-expense.title': 'Adicionar uma despesa',
  'help.guide.add-expense.goal': 'Registre quanto algo custou, quem pagou e com quem a despesa é dividida.',
  'help.guide.add-expense.step.1':
    'Clique em “Adicionar despesa”, na ponta direita da barra. O editor abre com a data de hoje, pago por você e com todos já incluídos na divisão.',
  'help.guide.add-expense.step.2':
    'Digite no campo do topo da janela para que foi a despesa. Enquanto estiver vazio, ele mostra “ex.: jantar, lembranças, gasolina…”. Esse é o nome da despesa, e não dá para salvá-la sem ele.',
  'help.guide.add-expense.step.3':
    'A etiqueta abaixo do nome é a “Categoria”, que fica em “Comida e bebida” até você escolher outra. São catorze, e não dá para alterá-las. O cabeçalho muda para a cor da categoria escolhida, assim como a marca na linha e a barra dela em “Por categoria”.',
  'help.guide.add-expense.step.4':
    'Digite o valor do comprovante em “Valor total”. A “Moeda”, ao lado, começa na moeda em que Custos é exibido; se você trocar, o editor mostra o valor convertido. “Dia” começa em hoje, e a despesa fica agrupada sob esse dia na lista.',
  'help.guide.add-expense.step.5':
    'Em “Quem pagou?”, clique na pessoa que de fato pagou. “Você” já vem selecionado. “Ninguém pagou ainda” registra o valor sem que ninguém fique devendo, e “Várias pessoas pagaram”, no seletor ao lado do título, divide a conta entre várias pessoas.',
  'help.guide.add-expense.step.6':
    '“Dividir”, logo abaixo, começa em “Igualmente”, com todos marcados e a parte de cada um ao lado do nome. Mantenha assim ou altere. Clique em “Adicionar despesa” na parte de baixo da janela para salvar.',
  'help.guide.add-expense.result':
    'A despesa aparece no extrato, no dia dela, entra no “Gasto total da viagem”, e a coluna de acerto recalcula quem deve a quem.',
  'help.guide.add-expense.tip.1':
    'Se você não mudar os padrões, a despesa fica com a data de hoje, paga por você e dividida igualmente entre todos: só precisa preencher o nome e o valor.',
  'help.guide.add-expense.tip.2':
    'O ± ao lado do valor transforma a despesa em reembolso. Um total negativo significa dinheiro devolvido, e a divisão é invertida.',
  'help.guide.add-expense.tip.3':
    'Anexar, ao lado de “Comprovantes e notas” na parte de baixo da janela, aceita imagens e PDFs. Eles são enviados quando você salva, ficam guardados nos Arquivos da viagem, e um chip Comprovante aparece ao lado do nome na lista.',
  // expense-payers
  'help.guide.expense-payers.title': 'Definir quem pagou',
  'help.guide.expense-payers.goal': 'Registre quem pagou uma despesa, a outra metade do cálculo do acerto de contas.',
  'help.guide.expense-payers.step.1':
    'Abra uma despesa pelo lápis ao lado da linha dela e veja “Quem pagou?”. “Uma pessoa pagou” é o padrão no seletor ao lado do título: cada viajante é um chip, e o chip com contorno é quem pagou. Clique em outro chip para trocar.',
  'help.guide.expense-payers.step.2':
    '“Ninguém pagou ainda”, a etiqueta tracejada depois dos viajantes, registra o valor sem que ninguém fique devendo nada. A despesa continua contando no “Gasto total da viagem”.',
  'help.guide.expense-payers.step.3':
    '“Várias pessoas pagaram”, a outra opção desse seletor, lista todos os viajantes com uma caixa para marcar, e cada pessoa marcada ganha um campo de valor. Marque quem pagou e digite quanto cada um pagou; os valores precisam somar o total.',
  'help.guide.expense-payers.step.4':
    'Uma despesa que ninguém pagou aparece marcada como Pendente na linha e entra no cartão “Valor pendente”, que soma os gastos ainda sem pagador.',
  'help.guide.expense-payers.result':
    'Quem pagou define quem recebe de volta, a divisão define quem paga, e Saldos é a diferença entre os dois.',
  'help.guide.expense-payers.tip.1':
    '“Quem pagou?” e “Dividir” são independentes: você pode pagar um jantar em que não estava e entrar na divisão de um que não pagou.',
  'help.guide.expense-payers.tip.2':
    'Com vários pagadores, os valores precisam somar o total. Quando você marca mais um pagador, o restante é dividido de novo entre os valores que você não digitou. Enquanto os valores não baterem, o editor mostra o total que eles precisam somar e não salva.',
  'help.guide.expense-payers.tip.3':
    'Voltar uma despesa para “Ninguém pagou ainda” não a remove: o valor continua em “Gasto total da viagem” e a linha passa a “Pendente”.',
  // split-expense
  'help.guide.split-expense.title': 'Dividir uma conta entre os viajantes',
  'help.guide.split-expense.goal':
    'Decida quem deve por uma despesa: todos em partes iguais, por valor ou item a item do comprovante.',
  'help.guide.split-expense.step.1':
    'No editor da despesa, Dividir lista todos os viajantes com uma caixa para marcar. Desmarque um nome para deixar a pessoa fora desta despesa: o nome fica cinza, perde a parte dele e não deve nada por ela.',
  'help.guide.split-expense.step.2':
    'Igualmente, no seletor ao lado do título, é o padrão: cada viajante marcado fica com a mesma parte, mostrada ao lado do nome. Os selos abaixo da lista mostram entre quantas pessoas a despesa é dividida e quanto é cada parte.',
  'help.guide.split-expense.step.3':
    '“Personalizado” troca as partes por campos de valor. Digite quanto cada viajante deve. O selo abaixo se atualiza enquanto você digita e fica verde com “A divisão bate com o total”. Não dá para salvar enquanto os valores não baterem com o total.',
  'help.guide.split-expense.step.4':
    '“Recibo” divide o comprovante linha por linha: “Adicionar item”, depois um nome e um preço por linha e, ao lado de “Dividindo entre:”, os viajantes que dividem aquela linha.',
  'help.guide.split-expense.step.5':
    '“Parte de cada um”, abaixo das linhas, mostra quanto cada viajante deve no fim, e “Valor total”, no topo, é a soma das linhas. Clique em “Salvar” na parte de baixo da janela.',
  'help.guide.split-expense.result':
    'Todos os saldos são calculados a partir da divisão. Ela é salva com a despesa, aparece na linha como Dividir, com a parte de cada viajante, e pode ser alterada depois sem mudar mais nada.',
  'help.guide.split-expense.tip.1':
    'Um viajante que você desmarcar não deve nada nesta despesa; os outros pagam a parte deles.',
  'help.guide.split-expense.tip.2':
    'Igualmente divide até o último centavo: o centavo que sobra fica com uma pessoa diferente a cada despesa, para que não seja sempre a mesma a pagá-lo.',
  'help.guide.split-expense.tip.3':
    'O modo Recibo calcula sozinho o “Valor total” e deixa o campo cinza: o total é a soma das linhas do comprovante.',
  'help.guide.split-expense.tip.4':
    'Uma divisão personalizada também pode ser feita em porcentagem: mude “Inserir partes como” para %, e as partes precisam somar 100 % antes de a despesa ser salva.',
  // expense-currency
  'help.guide.expense-currency.title': 'Lançar uma despesa em outra moeda',
  'help.guide.expense-currency.goal': 'Lance o valor que está no comprovante, e o TREK salva a taxa de câmbio.',
  'help.guide.expense-currency.step.1':
    'Abra “Adicionar despesa”. Digite o nome no topo da janela e informe em “Valor total” exatamente o valor do comprovante, sem converter.',
  'help.guide.expense-currency.step.2':
    'Abra “Moeda”, ao lado do valor, e escolha a moeda do recibo. A lista tem todos os códigos que o TREK conhece e permite busca: digite as três letras.',
  'help.guide.expense-currency.step.3':
    'Uma fileira de selos aparece abaixo dos campos: o valor que você digitou e quanto ele vale agora, marcado como “taxa ao vivo”. Isso é só uma prévia. Não é o valor que fica salvo.',
  'help.guide.expense-currency.step.4':
    'Clique em “Adicionar despesa” no fim da janela. A taxa é fixada nesse momento: a despesa mantém o valor que tinha no dia em que você a lançou.',
  'help.guide.expense-currency.step.5':
    'No extrato, a linha mostra os dois valores abaixo do nome: o que você digitou, uma seta e o valor na moeda da viagem. Todos os totais, saldos e acertos da aba Custos usam o segundo valor.',
  'help.guide.expense-currency.result':
    'A despesa mantém o valor e a moeda que você digitou. O extrato mostra os dois, e os totais e saldos da viagem são calculados na moeda da viagem.',
  'help.guide.expense-currency.tip.1':
    'A taxa fica fixa no momento em que você salva, então uma dívida acertada não muda se o câmbio mudar na semana seguinte. Uma nova taxa só é salva quando você troca a moeda da despesa.',
  'help.guide.expense-currency.tip.2':
    '“Moeda de exibição”, nas Configurações, muda só a forma como os valores aparecem. Os valores salvos nunca mudam. Se o campo estiver vazio, cada viagem aparece na própria moeda.',
  'help.guide.expense-currency.tip.3':
    'A moeda da viagem é definida na própria viagem, em “Editar viagem”, e exige a permissão “Editar detalhes da viagem”. Se você mudar a moeda, todas as cotações congeladas são recalculadas para a nova moeda. Os valores em si não são convertidos.',
  // filter-costs
  'help.guide.filter-costs.title': 'Encontrar uma despesa ou os gastos de um dia',
  'help.guide.filter-costs.goal': 'Filtre uma lista longa de despesas para ver só o que você procura.',
  'help.guide.filter-costs.step.1':
    'Digite em “Buscar despesas…”, na barra. A busca procura no nome das despesas enquanto você digita, e Esc a limpa.',
  'help.guide.filter-costs.step.2':
    '“Filtrar”, o funil ao lado da busca, abre os filtros. O seletor no topo é a sua visão do extrato: “Todos”, “Pagas por mim” para o que você pagou e “Devem a mim” para as despesas em que você pagou mais do que a sua parte.',
  'help.guide.filter-costs.step.3':
    'Em “Categoria”, escolha uma das catorze categorias, e só as despesas dela aparecem. O funil mostra quantos filtros estão ativos.',
  'help.guide.filter-costs.step.4':
    'Em “Dia”, escolha um dos dias com despesas. Um aviso substitui os cabeçalhos dos dias e mostra esse dia por extenso, quantas despesas ele tem e o total dele.',
  'help.guide.filter-costs.step.5':
    '“Exportar CSV”, o ícone de download ao lado do funil, salva todas as despesas num arquivo, com o valor original, a moeda e o valor convertido.',
  'help.guide.filter-costs.result':
    'Você pode combinar os filtros, e os grupos por dia são atualizados com os próprios totais das despesas que sobraram.',
  'help.guide.filter-costs.tip.1':
    'Pagamentos registrados não têm nome nem categoria, então uma busca ou um filtro de categoria os oculta, assim como “Devem a mim”. O filtro de dia os mantém, no dia em que o pagamento foi feito.',
  'help.guide.filter-costs.tip.2':
    '“Exportar CSV” sempre exporta todas as despesas, independentemente do filtro na tela, com uma linha por despesa.',
  'help.guide.filter-costs.tip.3':
    '“Limpar filtros”, no fim do menu de filtros quando há algum filtro ativo, desativa todos de uma vez.',
  // settle-up
  'help.guide.settle-up.title': 'Ver quem deve a quem e acertar as contas',
  'help.guide.settle-up.goal':
    'Transforme muitas despesas compartilhadas no menor número de transferências que quitam todas as dívidas, e registre as transferências quando forem feitas.',
  'help.guide.settle-up.step.1':
    'O cartão “Acertar contas”, na coluna da direita, lista as transferências que quitariam todas as dívidas: quem paga a quem, mostrado como dois avatares com os nomes na dica, e quanto. O número no cabeçalho mostra quantas ainda estão em aberto.',
  'help.guide.settle-up.step.2':
    '“Acertar”, ao lado de uma transferência, registra que ela foi feita. A transferência some do cartão e os saldos são atualizados.',
  'help.guide.settle-up.step.3':
    'A transferência registrada vira uma linha no extrato, no dia em que aconteceu, marcada como Pagamento, com os dois viajantes e o valor.',
  'help.guide.settle-up.step.4':
    'Ao lado dessa linha, o lápis corrige um pagamento e Desfazer o cancela, e a transferência volta para o cartão “Acertar contas”.',
  'help.guide.settle-up.step.5':
    '“Adicionar pagamento”, no cabeçalho do cartão, registra uma transferência que não seguiu uma sugestão. Escolha De e Para, o valor, a moeda e o dia em que ela aconteceu, adicione uma Nota, como a forma de pagamento, se quiser, e clique em “Adicionar pagamento” no fim da janela.',
  'help.guide.settle-up.step.6':
    '“Acertar contas”, na barra do topo, registra todas as transferências em aberto de uma vez, sem perguntar, por exemplo quando o grupo acerta todas as dívidas no fim da viagem.',
  'help.guide.settle-up.result':
    'Cada transferência registrada vira uma linha no extrato e tira uma linha do cartão “Acertar contas”. Quando o cartão mostrar “Todos quitados”, a viagem está totalmente paga.',
  'help.guide.settle-up.tip.1':
    'O cartão mostra o menor número de transferências, não cada dívida: se três pessoas devem umas às outras em círculo, isso se reduz a um ou dois pagamentos.',
  'help.guide.settle-up.tip.2':
    '“Acertar” só registra a transferência. Nenhum dinheiro é enviado. Pague pelo meio de pagamento de sempre e depois clique em “Acertar”.',
  'help.guide.settle-up.tip.3':
    'Um pagamento pode ser feito em qualquer moeda, então é normal pagar em euros uma dívida em ienes: a janela tem seu próprio seletor de moeda e também congela essa cotação.',
  // final-budget
  'help.guide.final-budget.title': 'Ver quanto a viagem custou a cada viajante',
  'help.guide.final-budget.goal': 'Veja os números de cada pessoa: o saldo de hoje e o custo real por pessoa.',
  'help.guide.final-budget.step.1':
    'Saldos mostra a situação de cada viajante: uma barra verde para a direita se a viagem deve a ele, uma barra vermelha para a esquerda se ele deve à viagem, e o valor ao lado do nome.',
  'help.guide.final-budget.step.2':
    'O “Orçamento final”, logo abaixo, responde a outra pergunta: não quem deve o quê agora, mas quanto a viagem custa para cada viajante depois que tudo for devolvido.',
  'help.guide.final-budget.step.3':
    'Clique num nome para ver o cálculo: “Despesas pagas” e, abaixo, “Reembolsos líquidos” e “Reembolsos pendentes”.',
  'help.guide.final-budget.step.4':
    'Abaixo das três linhas, há uma lista sob o nome de cada viajante com os itens que compõem aquela linha: as despesas que esse viajante pagou, as transferências já registradas e as que ainda estão em aberto. Cada lista soma exatamente o valor da linha de mesmo nome.',
  'help.guide.final-budget.result':
    '“Saldos” mostra hoje quem tem dinheiro a receber e quem está devendo. “Orçamento final” mostra quanto a viagem custa para cada um de vocês depois que tudo for acertado.',
  'help.guide.final-budget.tip.1':
    'Registrar um pagamento não muda o orçamento final de ninguém. Só move um valor dos reembolsos pendentes para os reembolsos líquidos.',
  'help.guide.final-budget.tip.2':
    'Uma despesa sem pagador fica de fora dos dois cartões, assim como fica de fora das sugestões de acerto.',
  // expense-from-booking
  'help.guide.expense-from-booking.title': 'Transformar uma reserva em despesa',
  'help.guide.expense-from-booking.goal':
    'Associe o custo real de um voo, de um hotel ou de um lugar ao registro correspondente.',
  'help.guide.expense-from-booking.step.1':
    'Encontre a reserva na aba Transportes ou Reservas e clique no lápis no topo do cartão dela.',
  'help.guide.expense-from-booking.step.2':
    'Role até Custos, perto do fim do formulário. Ali estão “Criar despesa”, que salva a reserva primeiro, e “Vincular despesa existente”, para uma despesa que já está em Custos.',
  'help.guide.expense-from-booking.step.3':
    'Clique em “Criar despesa”. A reserva é salva, o formulário fecha e o editor de Custos abre com o título da reserva como nome, o tipo dela associado a uma categoria e o dia da reserva como dia da despesa.',
  'help.guide.expense-from-booking.step.4':
    'Preencha o valor e a moeda, quem pagou e a divisão, como em qualquer despesa, e clique em “Adicionar despesa”. Quando você reabrir a reserva, a despesa aparece em “Despesas vinculadas”, com um lápis para editá-la, “Desvincular, manter a despesa” para remover o vínculo mantendo a despesa, e uma lixeira para excluí-la.',
  'help.guide.expense-from-booking.result':
    'A reserva mostra o custo, e a despesa vira uma linha comum na aba “Custos”, com pagador, divisão e moeda como qualquer outra.',
  'help.guide.expense-from-booking.tip.1':
    'Excluir a reserva também exclui as despesas vinculadas, e a pergunta de confirmação avisa isso. “Remover despesa”, no bloco Custos da reserva, faz o contrário: exclui a despesa e mantém a reserva. “Desvincular, manter a despesa” mantém as duas.',
  'help.guide.expense-from-booking.tip.2':
    'Um lugar tem o mesmo bloco no formulário, e lá “Criar despesa” salva o lugar antes.',
  // costs-table
  'help.guide.costs-table.title': 'Planejar os custos em uma tabela',
  'help.guide.costs-table.goal':
    'Veja e altere as despesas em uma tabela, organizada por categoria e com cálculo por pessoa e por dia.',
  'help.guide.costs-table.step.1':
    'Clique em “Tabela”, o segundo ícone do seletor “Lista / Tabela” na barra. Uma tabela com as mesmas despesas substitui o extrato, e a busca e os filtros também valem para ela.',
  'help.guide.costs-table.step.2':
    'A tabela é agrupada por categoria. O cabeçalho de cada grupo mostra o nome, quantas despesas ele tem e o subtotal; clique no cabeçalho para recolher o grupo. As colunas são Nome, Data, Total, Pessoas e Dias, e depois “Por pessoa”, “Por dia” e “P. p. / dia”, calculadas a partir delas, sobre fundo cinza. Uma linha Total, no fim, soma tudo.',
  'help.guide.costs-table.step.3':
    'Clique numa célula para alterá-la ali mesmo: um nome, um total, Pessoas ou Dias. Digite e pressione Enter ou clique fora para salvar, ou pressione Esc para cancelar; a data abre o calendário. “Por pessoa” e as outras colunas calculadas são atualizadas na hora.',
  'help.guide.costs-table.step.4':
    'Um total com cadeado não pode ser alterado aqui: alguém já pagou ou ele foi lançado em outra moeda, e a dica explica qual dos dois. Ao clicar nele, a despesa abre, para que os saldos e a taxa de câmbio fixada continuem corretos.',
  'help.guide.costs-table.step.5':
    '“Adicionar despesa”, no fim de uma categoria, adiciona a ela uma linha chamada “Novo lançamento”, com a data do lançamento mais recente da categoria. O campo de nome já vem aberto para você alterar. Informe o total do mesmo jeito.',
  'help.guide.costs-table.step.6':
    'Nesta visualização, a coluna da direita mostra Resumo no lugar de “Por categoria”. Ele soma as despesas de quatro formas: Categoria, Dia, Pagador (com “Sem pagador ainda” para as não pagas) e Status, Pago contra “Em aberto”.',
  'help.guide.costs-table.result':
    'Cada despesa aparece na categoria dela, com o valor por pessoa e por dia. Quando você muda um total em uma célula, os cartões acima e o Resumo são atualizados na hora.',
  'help.guide.costs-table.tip.1':
    'Custos lembra a visualização neste navegador: abre na tabela até você clicar em Lista de novo.',
  'help.guide.costs-table.tip.2':
    'Uma despesa dividida como “Personalizado” ou “Recibo” não tem uma parte única por pessoa, então os campos “Por pessoa” e “P. p. / dia” dela ficam vazios.',
  'help.guide.costs-table.tip.3':
    'Pagadores, divisão, observação e comprovantes são editados na própria despesa: “Mais opções”, no fim de uma linha, tem “Editar”, e “Excluir” para remover a linha.',

  // ── Screen: trip-transports ───────────────────────────────────────────────────────────
  'help.ctx.trip-transports.title': 'Transportes',
  'help.ctx.trip-transports.summary':
    'Todos os meios que levam você de uma parada a outra: voos, trens, ônibus, carros, táxis, bicicletas, cruzeiros, balsas, teleféricos e as conexões de transporte público que o TREK pesquisa para você. A aba lista todos eles. Você também pode criá-los e consultá-los no plano, e eles aparecem desenhados no mapa.',
  'help.ctx.trip-transports.bullet.1':
    'A aba mostra só os trajetos. Hospedagem, restaurantes, eventos e ingressos ficam na aba Reservas, para que a mesma entrada nunca apareça duas vezes.',
  'help.ctx.trip-transports.bullet.2':
    'A barra no topo tem Buscar, Filtrar por status, tipos e viajantes, as três visualizações Cartões, Lista e “Linha do tempo”, “Opções de visualização” e “Exportar como planilha (CSV)”, que baixa o que está sendo exibido. Transporte, à direita, adiciona um trajeto manualmente. Os ícones antes dele, “Importar confirmações de reserva” e “Importar do AirTrail”, aparecem quando o servidor consegue ler confirmações ou quando há um AirTrail conectado. Em uma aba vazia, as mesmas ações aparecem no meio como Transporte, “Importar de arquivo” e AirTrail.',
  'help.ctx.trip-transports.bullet.3':
    'Cartões é a visualização em que a aba abre: primeiro Confirmada, depois Pendente. Você pode recolher cada seção clicando no título. As conexões de transporte público planejadas não têm status e aparecem entre os trajetos confirmados, em ordem de horário, a menos que “Opções de visualização” dê a elas uma seção própria, “Transporte público automático”. Lista agrupa por dia, e “Linha do tempo” mostra todos os trajetos ao longo dos dias da viagem.',
  'help.ctx.trip-transports.bullet.4':
    'A faixa superior de um cartão tem a cor do status: verde para confirmada, âmbar para pendente, azul para uma conexão planejada. Ela mostra o ponto de status, o tipo, o título, o lápis e a lixeira. Abaixo: Data, Hora, “Código da reserva”, Rota e a companhia aérea e o número do voo, ou o número do trem, a plataforma e o assento. Clique no cartão para abrir os detalhes.',
  'help.ctx.trip-transports.bullet.5':
    'Você também pode criar transportes no plano: o + no cabeçalho de um dia (com a dica “Adicionar ao dia”), ou um clique com o botão direito no cabeçalho, oferece “Adicionar transporte” e “Transporte público”. O conector de tempo entre duas paradas abre a mesma busca para aquele trecho.',
  'help.ctx.trip-transports.bullet.6':
    'Um transporte com as duas pontas definidas desenha uma linha no mapa. O ícone de rota na linha dele no plano do dia e “No mapa”, nos detalhes, ativam essa linha. “Mostrar todas as rotas de reservas”, na barra de ferramentas acima dos dias, ativa ou desativa as linhas da viagem inteira.',
  // transports-list
  'help.guide.transports-list.title': 'Entender a aba Transportes',
  'help.guide.transports-list.goal': 'Entenda o que a lista mostra antes de alterar qualquer coisa nela.',
  'help.guide.transports-list.step.1':
    'Transportes é uma aba da viagem, depois de Planejado (e de Passeios, quando esse complemento está ativado). Ela só tem os trajetos: hotéis, restaurantes, eventos e ingressos ficam na aba Reservas.',
  'help.guide.transports-list.step.2':
    'A busca à esquerda da barra filtra os trajetos enquanto você digita. Filtrar, o funil ao lado, abre as opções: Status com Todos, Confirmada e Pendente, e depois cada tipo em uso com sua contagem. Marque um ou mais tipos para ver só esses. Um número no funil indica quantos filtros estão ativos, e a barra mostra quantos trajetos aparecem, por exemplo 1 de 4. “Limpar filtros”, no fim do menu, volta a mostrar todos.',
  'help.guide.transports-list.step.3':
    '“Cartões”, “Lista” e “Linha do tempo”, ao lado, mostram os transportes como cartões, como linhas agrupadas por dia ou como barras ao longo dos dias da viagem. “Opções de visualização”, o ícone de controles deslizantes, define “Agrupar por” e “Ordenar por” em “Cartões” e “Lista”, e as faixas em “Linha do tempo”. “Redefinir visualização” volta ao padrão. Em “Cartões”, “Transporte público em seção própria” mostra as conexões planejadas em “Transporte público automático”.',
  'help.guide.transports-list.step.4':
    'Cada cartão mostra todos os detalhes. A faixa no topo fica verde para “Confirmada” e âmbar para “Pendente” e mostra o ponto de status, o tipo e o título. Abaixo dela, “Data” mostra os dias que o transporte abrange, com as datas. Em seguida vêm “Hora”, “Código da reserva”, “Rota” com o ícone do tipo entre as paradas, e a companhia aérea e o número do voo ou o número do trem, a plataforma e o assento. Clique no cartão para abrir os detalhes.',
  'help.guide.transports-list.step.5':
    'Clique no ponto de status para alternar o trajeto entre Pendente e Confirmada; a dica mostra para qual, por exemplo “Definir como Pendente”. O lápis no cabeçalho abre o formulário do transporte, e a lixeira o exclui depois da pergunta “Excluir reserva?”, que lista o que será excluído, inclusive os custos vinculados.',
  'help.guide.transports-list.result':
    'Cada cartão mostra se o trajeto está reservado, e você pode usar a barra para filtrar ou ordenar a lista quando quiser.',
  'help.guide.transports-list.tip.1':
    'A aba lembra as suas configurações: a visualização, o agrupamento e a ordenação neste navegador, as seções recolhidas de cada viagem e os filtros até você fechar a aba do navegador.',
  'help.guide.transports-list.tip.2':
    '“Importar confirmações de reserva” e “Importar do AirTrail”, os dois ícones antes de Transporte, só aparecem quando o servidor consegue ler confirmações e quando há uma instância do AirTrail conectada. Sem eles, você preenche a lista manualmente ou com a busca de transporte público.',
  // add-transport
  'help.guide.add-transport.title': 'Adicionar um transporte a um dia',
  'help.guide.add-transport.goal':
    'Adicione o transporte que leva você de uma parada à seguinte no dia em que ele acontece.',
  'help.guide.add-transport.step.1':
    'No cabeçalho do dia do trajeto, clique no +, com a dica “Adicionar ao dia”, e escolha “Adicionar transporte”. Um clique com o botão direito no cabeçalho do dia abre o mesmo menu. O formulário abre com esse dia já preenchido.',
  'help.guide.add-transport.step.2':
    'A pílula de tipo no cabeçalho mostra o tipo de transporte, Voo por padrão. Clique nela para escolher Voo, Trem, Ônibus, Carro, Táxi, Bicicleta, Cruzeiro, Balsa, Teleférico ou Outro, e o formulário se adapta: um voo ganha um aeroporto em cada parada; um trem, uma sequência de estações; um cruzeiro, Embarque, “Porto de escala” e Desembarque; um carro, Retirada, Devolução e “Paradas pelo caminho”.',
  'help.guide.add-transport.step.3':
    'Digite o título direto na faixa do topo, onde está o texto de exemplo em cinza. É o único campo obrigatório: enquanto ele estiver vazio, a linha abaixo mostra “Título *” e “Adicionar” fica cinza. Use um título que você reconheceria num painel de partidas.',
  'help.guide.add-transport.step.4':
    'Em “Rota”, os campos “De” e “Para” aceitam uma estação, um porto ou um endereço. Os lugares da própria viagem aparecem como sugestão antes de você digitar. Digite pelo menos três letras para buscar e escolha um resultado. Um nome que você só digita, sem escolher nos resultados, não é salvo, e nada aparece no mapa.',
  'help.guide.add-transport.step.5':
    'Data e “Horário de início” indicam quando ele começa, e “Data final” e “Horário de término”, quando termina; para um trajeto que chega no dia seguinte, defina o dia seguinte ali. “Código da reserva” e Notas, mais abaixo, são opcionais. Clique na pílula Pendente no cabeçalho para mudá-la para Confirmada.',
  'help.guide.add-transport.step.6': 'Clique em Adicionar.',
  'help.guide.add-transport.result':
    'O transporte vira uma linha no dia, no horário dele entre as paradas, e um cartão na aba Transportes, em Pendente ou Confirmada.',
  'help.guide.add-transport.tip.1':
    'A linha é posicionada pelo horário de início, depois da última parada que começa antes. Arraste-a pela alça para outra posição no dia ou para outro dia.',
  'help.guide.add-transport.tip.2':
    'Use “Anexar arquivo”, em Arquivos, para adicionar a passagem. “Criar despesa”, em Custos, salva a reserva e abre o editor de Custos para lançar a tarifa.',
  'help.guide.add-transport.tip.3':
    '“Viajantes”, o primeiro bloco do formulário, define quem vai nesse transporte. Quando a viagem tem mais de um membro e algum transporte tem alguém indicado, “Filtrar”, na aba, também oferece “Viajantes”, que mostra só os transportes de uma pessoa.',
  // import-transport-file
  'help.guide.import-transport-file.title': 'Importar um voo pelo bilhete eletrônico',
  'help.guide.import-transport-file.goal':
    'Deixe o TREK ler um voo, um trem ou uma balsa a partir do bilhete enviado pela empresa e confira antes de salvar.',
  'help.guide.import-transport-file.step.1':
    'Na barra da aba Transportes, clique no ícone de download antes de Transporte, com a dica “Importar confirmações de reserva”. Abre a janela com esse nome, a mesma da aba Reservas. Em uma aba vazia, “Importar de arquivo”, no meio, faz o mesmo.',
  'help.guide.import-transport-file.step.2':
    'Solte o bilhete na caixa, ou clique nela e escolha o arquivo: EML, PDF, PKPass, HTML e TXT, até cinco arquivos de 10 MB cada, e fotos de um bilhete (JPG, PNG, WEBP) quando seu servidor tiver um modelo de IA para lê-las. A caixa mostra o nome dos arquivos escolhidos.',
  'help.guide.import-transport-file.step.3':
    'Clique em Importar. A janela fecha na hora, e o arquivo é lido em segundo plano.',
  'help.guide.import-transport-file.step.4':
    'Um cartão no canto inferior direito mostra o andamento abaixo do nome do arquivo. “Analisando arquivos…” vira um tique quando a leitura termina, e o cartão oferece Importar. Clique nele.',
  'help.guide.import-transport-file.step.5':
    'Um voo abre em “Adicionar transporte” já preenchido: o tipo marcado como “Voo”, a companhia aérea e o número do voo como título no cabeçalho, os dois aeroportos em “Rota” com “Partida” e “Chegada”, os horários e os fusos, “Companhia aérea” e “Nº do voo”, o “Código da reserva” e o bilhete em “Arquivos”. Confira e clique em “Adicionar”.',
  'help.guide.import-transport-file.result':
    'O voo vira um cartão em “Pendente” na aba Transportes e uma linha no dia da partida, com a passagem em Arquivos. Quando os dois aeroportos são conhecidos, o voo aparece como uma curva no mapa.',
  'help.guide.import-transport-file.tip.1':
    'As duas abas usam a mesma importação. Um arquivo com um voo e um hotel abre o voo em “Adicionar transporte” e depois o hotel em “Nova reserva”, não importa em qual aba você começou.',
  'help.guide.import-transport-file.tip.2':
    'Os aeroportos são posicionados pelo código. Se não for possível localizar uma estação ou um porto, o nome aparece em âmbar no cartão de importação, no canto inferior direito. Escolha o local manualmente em “Rota” antes de clicar em “Adicionar”, senão o transporte não aparece no mapa.',
  // plan-transit
  'help.guide.plan-transit.title': 'Planejar uma conexão de transporte público',
  'help.guide.plan-transit.goal':
    'Deixe o TREK buscar os trens e ônibus reais entre dois pontos de um dia e colocar no plano o que você escolher.',
  'help.guide.plan-transit.step.1':
    'Clique no + no cabeçalho do dia e escolha “Transporte público”. A busca abre para esse dia: o dia aparece como pílula no cabeçalho, e Manual e Automático, ao lado, alternam entre esta busca e o formulário comum.',
  'help.guide.plan-transit.step.2':
    'De e Para aceitam uma parada ou uma estação. Com o campo ainda vazio, o TREK sugere a hospedagem do dia, as estações e aeroportos das reservas do dia e as paradas do próprio dia. Ao digitar duas letras, ele passa a buscar as estações da tabela de horários. Inverter, entre os dois campos, troca De e Para.',
  'help.guide.plan-transit.step.3':
    '“Partida” ou “Chegada” com um horário indicam quando você quer viajar, e “Melhor rota”, “Menos baldeações” ou “Menos caminhada” definem a ordem dos resultados.',
  'help.guide.plan-transit.step.4':
    'Os botões abaixo mostram quais meios podem ser usados: Trem, Metrô, Bonde, Ônibus, Balsa e Teleférico. Desative um para excluí-lo; pelo menos um continua ativo. Depois clique em “Buscar”.',
  'help.guide.plan-transit.step.5':
    'Cada resultado mostra partida e chegada, a duração, quantas baldeações e quanto se anda a pé, além das linhas como selos, nas cores delas quando o horário oficial informa. Clique em um para expandi-lo e ver cada trecho, com as paradas onde você embarca e faz baldeação, as plataformas e as caminhadas entre as linhas.',
  'help.guide.plan-transit.step.6': 'Clique em “Adicionar ao dia”.',
  'help.guide.plan-transit.result':
    'A conexão vira uma linha no dia, com os selos das linhas. Clique na seta dela para ver cada trecho. Ela também aparece como cartão na aba Transportes, entre os trajetos confirmados, em azul.',
  'help.guide.plan-transit.tip.1':
    'As conexões vêm do Transitous, um serviço comunitário gratuito que usa dados públicos de horários: sem chave e sem conta. Um administrador pode configurar a busca para usar o Google.',
  'help.guide.plan-transit.tip.2':
    'Não encontrou nada? Os dados cobrem uma região e um período. Tente outro horário, ative mais meios de transporte ou escolha uma estação em vez do próprio lugar. A mensagem informa qual serviço respondeu. Uma viagem sem datas não tem dia para pesquisar, então só oferece o formulário comum.',
  'help.guide.plan-transit.tip.3':
    'A mesma busca abre para um único trecho: clique no conector de tempo entre duas paradas e escolha “Transporte público”. De, Para e o horário de partida já vêm preenchidos.',
  // change-transit-route
  'help.guide.change-transit-route.title': 'Abrir e alterar uma conexão planejada',
  'help.guide.change-transit-route.goal': 'Leia a conexão linha por linha, renomeie-a ou busque o trajeto de novo.',
  'help.guide.change-transit-route.step.1':
    'Na aba “Transportes”, uma conexão planejada é um cartão com faixa azul no topo, listado em ordem de horário junto com os transportes confirmados. Se “Transporte público em seção própria” estiver ativado em “Opções de visualização”, ela aparece em “Transporte público automático”. Clique no cartão. A conexão abre como uma reserva.',
  'help.guide.change-transit-route.step.2':
    'Os blocos no topo mostram a partida e a chegada com as paradas, a “Duração”, as “Baldeações” e o trecho “A pé”. Abaixo deles, “Itinerário” mostra a conexão linha por linha, com os horários, as plataformas e as caminhadas entre as linhas.',
  'help.guide.change-transit-route.step.3':
    '“Alterar trajeto”, no fim da reserva, abre a busca de novo, já preenchida com as duas pontas desta conexão e com o dia dela.',
  'help.guide.change-transit-route.step.4':
    'Clique em Buscar, abra outra conexão e clique em “Adicionar ao dia”; ela substitui a antiga. Editar, na ponta direita do rodapé da reserva, abre o formulário de transporte comum, onde você edita o “Código da reserva”, os viajantes, as notas e os arquivos.',
  'help.guide.change-transit-route.result':
    'O trajeto passa a usar o novo itinerário, e o cartão dele na aba Transportes mostra as novas linhas e horários.',
  'help.guide.change-transit-route.tip.1':
    'Clique no título no cabeçalho da reserva para renomear a conexão sem mudar o trajeto. As notas ficam no formulário de transporte, que abre em “Editar”.',
  'help.guide.change-transit-route.tip.2':
    'A lixeira no rodapé da reserva exclui a conexão depois de uma confirmação; o dia mantém as paradas.',
  // leg-travel-mode
  'help.guide.leg-travel-mode.title': 'Mudar o meio de transporte de um trecho',
  'help.guide.leg-travel-mode.goal':
    'Defina um trecho de um dia de carro como caminhada ou planeje esse trecho com a busca de transporte público.',
  'help.guide.leg-travel-mode.step.1':
    'Os conectores entre as paradas só aparecem com a rota do dia ativada. Clique no cabeçalho do dia para abri-lo e depois em Rota, na barra abaixo das paradas.',
  'help.guide.leg-travel-mode.step.2':
    'Cada conector mostra o tempo de deslocamento e a distância daquele trecho, com o ícone do meio usado no cálculo: um carro para dirigir, um pé para caminhar, uma bicicleta para pedalar.',
  'help.guide.leg-travel-mode.step.3':
    'Clique no conector. O menu oferece Carro, “A pé” e Bicicleta, “Transporte público” só para este trecho e “Usar padrão do dia”.',
  'help.guide.leg-travel-mode.step.4':
    'Escolha “A pé”. Só esse trecho muda; o resto do dia mantém o próprio meio de transporte.',
  'help.guide.leg-travel-mode.result':
    'O trecho mostra o ícone de pé e o tempo a pé, e os outros trechos do dia mantêm o meio de transporte do dia.',
  'help.guide.leg-travel-mode.tip.1':
    'O meio de transporte pertence ao trecho, não ao dia: os botões Carro, “A pé” e Bicicleta do dia inteiro nunca substituem um trecho que você definiu manualmente. “Usar padrão do dia” faz o trecho voltar a seguir esses botões.',
  'help.guide.leg-travel-mode.tip.2':
    '“Transporte público”, no mesmo menu, abre a busca de conexões exatamente para este trecho, com as duas pontas e o horário de partida já preenchidos.',
  'help.guide.leg-travel-mode.tip.3':
    'Os tempos vêm de um roteador público, calculados sobre ruas e caminhos reais. Se o roteador não conseguir calcular um trecho, ele continua como linha reta e sem tempo.',
  // edit-transport
  'help.guide.edit-transport.title': 'Alterar ou excluir um transporte',
  'help.guide.edit-transport.goal':
    'Corrija um horário, uma plataforma ou um código de reserva, ou remova o transporte da viagem.',
  'help.guide.edit-transport.step.1':
    'No plano do dia, um transporte é uma linha entre as paradas, colorida de acordo com o tipo. Clique nela para abrir a reserva: status, tipo, dias e “Código da reserva” (com um botão para copiar) aparecem como pílulas no topo, e os horários de partida e chegada, com aeroportos ou estações, logo abaixo.',
  'help.guide.edit-transport.step.2':
    'Editar, no fim da reserva, abre o formulário que a criou, com “Editar transporte” acima do título, no cabeçalho. Ali você pode mudar tudo: o título, as pílulas de status e de tipo, a rota, os dias e horários, o “Código da reserva”.',
  'help.guide.edit-transport.step.3':
    'A rota de um voo é uma sequência de aeroportos; a de um trem, de estações; a de um cruzeiro, de portos. “Adicionar parada” (“Adicionar porto” em um cruzeiro) insere mais uma no meio, e cada trecho mantém seus próprios horários e seu próprio número de voo ou de trem.',
  'help.guide.edit-transport.step.4':
    'Clique em Atualizar. Para remover o transporte de vez, use a lixeira à esquerda da mesma barra, a lixeira no fim da reserva ou a lixeira no cartão dele na aba Transportes, e confirme.',
  'help.guide.edit-transport.result':
    'A alteração aparece em todos os lugares onde o transporte está: na aba Transportes, no dia em que ele acontece e na linha dele no mapa.',
  'help.guide.edit-transport.tip.1':
    'O mesmo formulário abre pelos dois caminhos: por “Editar” na reserva que abre a partir de uma linha do plano do dia e pelo lápis no cartão da aba “Transportes”. Uma conexão de transporte público planejada também abre como reserva. Ali, “Alterar trajeto” abre a busca de novo e “Editar” abre este formulário.',
  'help.guide.edit-transport.tip.2':
    'Para mover um transporte para outro dia, você não precisa do formulário: arraste a linha dele de um cartão de dia para o outro.',
  // transport-on-map
  'help.guide.transport-on-map.title': 'Mostrar um transporte no mapa',
  'help.guide.transport-on-map.goal': 'Veja o trajeto real de um voo, de uma viagem de carro ou de uma conexão.',
  'help.guide.transport-on-map.step.1':
    'Um transporte com as duas pontas definidas mostra um pequeno ícone de rota na linha dele no plano do dia. Clique nele; a dica muda para “Ocultar rotas de reservas”.',
  'help.guide.transport-on-map.step.2':
    'A rota aparece no mapa, com um marcador em forma de pílula em cada ponta, mostrando o ícone do transporte.',
  'help.guide.transport-on-map.step.3':
    'Clique em um marcador de ponta, e a reserva abre sobre o mapa. O cabeçalho mostra o status, o tipo, os dias e o “Código da reserva”. Abaixo, aparecem os horários com aeroportos ou estações, a companhia aérea e o número do voo. Clique em Encerrar, no cabeçalho, para fechar.',
  'help.guide.transport-on-map.step.4':
    'O ícone de rota na barra acima dos dias vale para a viagem inteira: “Mostrar todas as rotas de reservas”, e “Ocultar todas as rotas de reservas” para escondê-las de novo.',
  'help.guide.transport-on-map.step.5':
    'Uma conexão planejada de transporte público não tem ícone de rota próprio. Ela é desenhada pela chave “Rota” do dia, então “Ocultar todas as rotas de reservas” não a oculta enquanto a rota daquele dia estiver ligada.',
  'help.guide.transport-on-map.result':
    'As rotas aparecem no mapa com um marcador em cada ponta e ficam lá até você desativá-las.',
  'help.guide.transport-on-map.tip.1':
    'Voos, cruzeiros e balsas aparecem como uma curva. Carro, ônibus, táxi e bicicleta seguem as ruas e estradas reais. Trens e conexões planejadas passam pelas estações onde param.',
  'help.guide.transport-on-map.tip.2':
    'Uma reserva confirmada aparece em linha contínua, e uma pendente, em linha tracejada. A configuração “Rótulos das rotas de reservas” mostra o código do aeroporto ou o nome da estação nos marcadores das pontas.',
  'help.guide.transport-on-map.tip.3':
    '“Mostrar todas as rotas de reservas” não se soma às rotas que você já está mostrando: ele substitui o que você definiu pelos ícones individuais. Depois de clicar, todas as rotas ficam visíveis ou todas ficam ocultas.',
  // airtrail-import
  'help.guide.airtrail-import.title': 'Importar voos do AirTrail',
  'help.guide.airtrail-import.goal':
    'Importe de uma vez para a viagem os voos que você já tem no AirTrail e mantenha-os atualizados pelo AirTrail depois disso.',
  'help.guide.airtrail-import.step.1':
    'Com o complemento AirTrail ativado e a sua instância conectada em Integrações, nas Configurações, a barra da aba Transportes mostra um ícone de avião, “Importar do AirTrail”, antes de “Transporte”. Clique nele.',
  'help.guide.airtrail-import.step.2':
    '“Importar do AirTrail” lista os voos da sua conta em dois grupos. “Durante esta viagem” traz os voos com data dentro da viagem, já marcados. “Outros voos” traz o resto, desmarcados. Um voo que já está na viagem aparece acinzentado e marcado como “Importado”.',
  'help.guide.airtrail-import.step.3':
    'Cada linha é uma caixa de seleção com a companhia aérea e o número do voo, os dois aeroportos e a data. Clique numa linha para incluir ou excluir o voo. Os voos em “Outros voos” só são importados se você marcá-los.',
  'help.guide.airtrail-import.step.4':
    'Voos de conexão são agrupados: cada um parte do aeroporto onde o anterior pousou, dentro de um dia. A caixa abaixo, Importar como um único voo com escala nesse aeroporto, já vem marcada. Deixe-a marcada para uma reserva com escala ou desmarque para importar os trechos como voos separados.',
  'help.guide.airtrail-import.step.5':
    'Clique no botão no canto inferior direito, que mostra o número de voos marcados, como em Importar 2. A mensagem seguinte informa quantos voos foram importados.',
  'help.guide.airtrail-import.step.6':
    'Os voos aparecem como cartões em Confirmada, cada um com uma pílula azul do AirTrail ao lado do título, e como linhas nos dias em que acontecem. Um voo com conexão é um único cartão, e a rota dele passa pela escala.',
  'help.guide.airtrail-import.result':
    'Os voos do AirTrail viram cartões na aba “Transportes” e linhas nos dias deles, cada um com a etiqueta AirTrail indicando de onde veio.',
  'help.guide.airtrail-import.tip.1':
    'Um voo que já está na viagem com o mesmo número e a mesma data é ignorado, e uma mensagem informa quantos foram ignorados. A seta de desfazer na barra de ferramentas acima dos dias desfaz a importação inteira.',
  'help.guide.airtrail-import.tip.2':
    'O AirTrail continua sendo a fonte principal dos dados. O TREK lê as alterações de lá quando você abre a viagem e a cada poucos minutos em segundo plano. Um voo excluído no AirTrail mantém o cartão no TREK, e o rótulo dele muda para “Não sincronizado”. As edições feitas no TREK só voltam para o AirTrail se “Gravar alterações de volta no AirTrail” estiver ativado em Integrações.',
  'help.guide.airtrail-import.tip.3':
    'Uma conexão combinada não é um único voo do AirTrail que possa ser sincronizado, então ela é importada uma única vez: fica com a etiqueta azul, que explica isso quando você passa o mouse sobre ela. O mesmo acontece com um voo sincronizado quando você adiciona uma escala manualmente.',

  // ── Screen: trip-roadtrip ─────────────────────────────────────────────────────────────
  'help.ctx.trip-roadtrip.title': 'Viagem de carro',
  'help.ctx.trip-roadtrip.summary':
    'O plano visto como um único trajeto de carro: os mesmos dias e os mesmos lugares, ligados como paradas com a direção entre elas, numa trilha na coluna da esquerda e no mapa. Mostra a distância e o tempo de direção, onde você precisa abastecer e o que há ao longo da estrada.',
  'help.ctx.trip-roadtrip.bullet.1':
    '“Dias” e “Viagem de carro”, no topo da coluna esquerda, alternam entre o plano dos dias e o trajeto de carro. Nada é copiado nem alterado: “Dias” mostra o plano exatamente como estava.',
  'help.ctx.trip-roadtrip.bullet.2':
    'O topo do trilho mostra os totais da viagem: Distância, “Tempo de direção” e Paradas. Abaixo, há um cartão para cada dia com percurso: o número e a data do dia em um bloco e pílulas com os quilômetros, o tempo de direção, quantas paradas o dia tem, o que ele atravessa e um selo Trilha. Um voo, trem ou balsa que você reservou aparece na sequência como um cartão separado.',
  'help.ctx.trip-roadtrip.bullet.3':
    'Uma parada numerada é um lugar que é o objetivo do dia. Uma parada no caminho, como abastecimento, recarga ou área de descanso, mostra o ícone do tipo em vez de um número e não entra na contagem. Clique em um número para mudar o tipo, clique no selo Parada para definir quanto tempo você fica, e arraste uma parada para movê-la dentro do dia ou para outro dia.',
  'help.ctx.trip-roadtrip.bullet.4':
    'Entre duas paradas, uma faixa de trajeto mostra a distância e o tempo do trecho. Clique nela para ver “Rotas para este trecho” ou clique na rota no mapa para fazer o trecho passar por um ponto intermediário.',
  'help.ctx.trip-roadtrip.bullet.5':
    'A coluna da direita vira “No trajeto”: escolha o que procurar e o dia em uma linha, a largura do corredor, e clique em Buscar. O mais em um resultado, Adicionar, inclui o lugar no percurso no ponto em que você realmente passa por ele, e o ícone de cama em um hotel adiciona um pernoite. Manual adiciona um lugar que a busca não encontrou, e os três pontos ao lado do título importam uma rota do Google Maps.',
  'help.ctx.trip-roadtrip.bullet.6':
    '“Configurações de direção”, logo abaixo, reúne os limites, o carro e a autonomia dele, os tempos diários de viagem, o que evitar, como a linha é desenhada e se os alertas atuais aparecem no mapa. Essas configurações pertencem à viagem, então todos planejam com o mesmo carro.',
  // roadtrip-mode
  'help.guide.roadtrip-mode.title': 'Ver a viagem como um único trajeto',
  'help.guide.roadtrip-mode.goal': 'Passe o plano para o modo viagem de carro e entenda o que o trilho mostra.',
  'help.guide.roadtrip-mode.step.1':
    'Clique em “Viagem de carro” no seletor Dias e “Viagem de carro”, no topo da coluna da esquerda. O plano do dia é substituído pelo percurso, e o mapa mostra todos os dias que têm rota.',
  'help.guide.roadtrip-mode.step.2':
    'O cartão no topo do trilho soma a viagem inteira: Distância, “Tempo de direção” e Paradas. Ele fica fixo enquanto você rola os dias.',
  'help.guide.roadtrip-mode.step.3':
    'Abaixo dele há um cartão para cada dia com percurso; dias sem percurso ficam de fora. O cabeçalho do cartão mostra o número do dia com a data embaixo e pílulas com a distância e o tempo do percurso e o número de paradas do dia.',
  'help.guide.roadtrip-mode.step.4':
    'Dentro do cartão, o dia aparece em sequência: uma parada numerada para cada lugar, um trecho de percurso entre cada par e o horário de chegada na borda direita. Um voo, trem ou balsa que você reservou aparece na sequência como um cartão próprio.',
  'help.guide.roadtrip-mode.step.5':
    'Clique no cabeçalho de um dia para recolhê-lo; a seta no fim dele gira. Um dia recolhido também some do mapa. Clique de novo no cabeçalho para mostrá-lo.',
  'help.guide.roadtrip-mode.result':
    'A coluna da esquerda mostra o percurso, e o mapa mostra todos os dias dele. Dias volta direto para o plano, sem mudanças.',
  'help.guide.roadtrip-mode.tip.1':
    'A escolha fica salva por viagem na sua conta. Depois de recarregar a página, em outro navegador ou em outro dispositivo, a viagem abre de novo na visualização de viagem de carro.',
  'help.guide.roadtrip-mode.tip.2':
    'A chave só aparece depois que um administrador ativa o complemento Viagem de carro, em Complementos, no painel de administração.',
  'help.guide.roadtrip-mode.tip.3':
    'No celular não há seletor: o complemento adiciona uma aba própria, “Viagem de carro”, ao lado de “Planejado”.',
  // roadtrip-stops
  'help.guide.roadtrip-stops.title': 'Paradas pelo caminho e quanto tempo você fica',
  'help.guide.roadtrip-stops.goal':
    'Transforme um lugar do percurso em parada no caminho e defina quanto tempo dura cada parada.',
  'help.guide.roadtrip-stops.step.1':
    'Clique no número na frente de uma parada no trilho. O rótulo dele é “Tornar uma parada no caminho”, e ele abre os tipos de parada como uma fileira de discos coloridos logo abaixo.',
  'help.guide.roadtrip-stops.step.2':
    'Escolha um tipo. Passe o mouse sobre um disco para ver o nome: Hospedagem, Combustível, Carregamento, “Área de descanso”, Camping, Comida ou “Pontos turísticos”. O número vira o ícone desse tipo, e as paradas abaixo são renumeradas.',
  'help.guide.roadtrip-stops.step.3':
    'Uma parada no caminho não é um destino, então o cabeçalho do dia conta uma parada a menos.',
  'help.guide.roadtrip-stops.step.4':
    'Clique no ícone de novo, “Alterar o tipo de parada”, e escolha “Voltar a ser um destino” para a parada receber o número de volta.',
  'help.guide.roadtrip-stops.step.5':
    'Cada parada tem um selo Parada, que mostra um mais enquanto nada estiver planejado. Clique nele para abrir “Tempo nesta parada”.',
  'help.guide.roadtrip-stops.step.6':
    'Defina a duração com o controle deslizante, com os botões de menos e mais ou com uma das opções prontas. “Partida” muda, enquanto “Chegada” continua no horário em que o trajeto chega. Depois, clique em “Salvar”.',
  'help.guide.roadtrip-stops.result':
    'O selo “Parada” da parada que você alterou mostra a nova duração, e todos os horários de chegada seguintes se ajustam. Uma parada que você mudou para um tipo e depois voltou atrás passa a ser de novo um destino numerado.',
  'help.guide.roadtrip-stops.tip.1':
    'O tempo de permanência pertence ao lugar, não a uma visita: um lugar planejado em dois dias tem o mesmo tempo nos dois dias.',
  'help.guide.roadtrip-stops.tip.2':
    'As paradas no caminho também aparecem em Dias. Desativar “Mostrar também em Dias”, em “Paradas de serviço”, nas “Configurações de direção”, as deixa só na Viagem de carro.',
  'help.guide.roadtrip-stops.tip.3': '“Sem permanência”, na mesma janela, remove o tempo.',
  'help.guide.roadtrip-stops.tip.4':
    'Clique em uma parada no caminho ou em uma noite reservada para abrir o cartão dela sobre o mapa. Com “Viagem de carro” ativada, “Editar” ali abre a janela compacta que a busca usa, em vez do formulário de lugar, e “Mais detalhes” nessa janela abre o formulário completo.',
  // roadtrip-corridor
  'help.guide.roadtrip-corridor.title': 'Encontrar combustível, comida e onde dormir ao longo da rota',
  'help.guide.roadtrip-corridor.goal':
    'Busque ao longo da estrada que você realmente vai percorrer e adicione o que encontrar ao trecho certo.',
  'help.guide.roadtrip-corridor.step.1':
    'Em “Procurando por”, abra a lista e marque o que você precisa. Dá para combinar “Combustível”, “Carregamento”, “Área de descanso”, “Camping”, “Hospedagem”, “Comida” e “Pontos turísticos”: a lista continua aberta para mais uma escolha, e o campo mostra depois um ícone para cada tipo.',
  'help.guide.roadtrip-corridor.step.2':
    'Escolha o dia no menu no fim da mesma linha. Ele oferece os dias que têm cartão no trilho, e Buscar espera até a rota do dia escolhido estar calculada.',
  'help.guide.roadtrip-corridor.step.3':
    'Em “Num raio de”, escolha até que distância procurar de cada lado da estrada, 2 km, 5 km ou 10 km, e clique em Buscar.',
  'help.guide.roadtrip-corridor.step.4':
    'Os resultados aparecem agrupados por tipo, na ordem em que você passa por eles. Cada um mostra a distância da rota e em que ponto do percurso do dia ele fica.',
  'help.guide.roadtrip-corridor.step.5':
    'Clique em Adicionar, o mais em um resultado. “Adicionar como parada” mostra em que dia e em que posição ele entra e pede o “Tipo de parada” e o “Tempo nesta parada”; um ponto de recarga também mostra “Disponibilidade e tarifas”. Adicionar o coloca no percurso, e “Mais detalhes” abre o formulário completo do lugar.',
  'help.guide.roadtrip-corridor.result':
    'A parada adicionada aparece na rota, no ponto em que você passa por ela, com o ícone do tipo. O dia é recalculado passando pela parada, e isso limpa a lista: pesquise de novo para a próxima parada.',
  'help.guide.roadtrip-corridor.tip.1':
    'Nada é buscado até você apertar “Buscar”: cada busca envia muitas requisições a um serviço compartilhado.',
  'help.guide.roadtrip-corridor.tip.2':
    '“Filtrar por nome” filtra os resultados sem uma nova busca, e “Limpar resultados” esvazia a lista e remove os pinos. Clique num resultado para mostrá-lo no mapa.',
  'help.guide.roadtrip-corridor.tip.3':
    'Você também pode arrastar um resultado do mapa até a rota. Assim você mesmo escolhe o trecho quando passa pela mesma estrada duas vezes. “Manual”, ao lado de “Buscar”, adiciona um lugar que a busca não encontrou, procurando pelo nome.',
  // roadtrip-via
  'help.guide.roadtrip-via.title': 'Passar um trecho por um ponto intermediário',
  'help.guide.roadtrip-via.goal': 'Faça um trecho passar pela estrada que você quer, sem adicionar uma parada.',
  'help.guide.roadtrip-via.step.1':
    'Mostre no mapa o trecho que você quer: clique em uma parada no trilho e feche o cartão que abre sobre o mapa.',
  'help.guide.roadtrip-via.step.2':
    'Clique na rota desenhada. Um ponto de passagem é adicionado ao trecho clicado, e a rota do trecho é recalculada passando por ele.',
  'help.guide.roadtrip-via.step.3':
    'A trilha se atualiza: o cabeçalho do dia mostra a nova distância e o novo tempo de direção, e todas as chegadas depois do ponto de passagem mudam junto.',
  'help.guide.roadtrip-via.step.4':
    'Passe o mouse sobre a alça para ver o que ela faz: “Arraste para remodelar a rota, clique com o botão direito para remover”. Arraste-a para outro ponto, e o trecho é redesenhado passando pelo novo ponto.',
  'help.guide.roadtrip-via.step.5':
    'Clique com o botão direito na alça para removê-la. O trecho volta a usar a rota direta.',
  'help.guide.roadtrip-via.result':
    'O trecho segue a estrada que você escolheu, e a distância, o tempo de direção e os horários de chegada do dia são recalculados.',
  'help.guide.roadtrip-via.tip.1':
    'Um ponto de passagem não é uma parada: não tem número, tempo de permanência nem horário de chegada, e não entra na contagem de paradas do dia.',
  'help.guide.roadtrip-via.tip.2':
    'As alças só aparecem a partir do nível de zoom 9, então um mapa que mostra a viagem inteira exibe a linha sem elas.',
  'help.guide.roadtrip-via.tip.3':
    'Um clique a mais de dois quilômetros de qualquer trecho desenhado é ignorado, assim como um clique em um voo, um trem ou uma balsa.',
  // roadtrip-alternatives
  'help.guide.roadtrip-alternatives.title': 'Testar outro caminho para um trecho',
  'help.guide.roadtrip-alternatives.goal':
    'Veja as outras rotas que o roteador oferece para um trecho do percurso e escolha uma.',
  'help.guide.roadtrip-alternatives.step.1':
    'Clique em uma faixa de trajeto na barra lateral, a linha entre duas paradas que mostra a distância e o tempo do trecho. O rótulo dela é “Outras rotas”.',
  'help.guide.roadtrip-alternatives.step.2':
    '“Rotas para este trecho” abre sobre o mapa, com uma entrada por estrada e o comprimento de cada uma. O mapa desenha cada estrada com o tempo de direção: a sua estrada atual em azul forte e as outras em azul mais claro.',
  'help.guide.roadtrip-alternatives.step.3':
    'Passe o mouse sobre uma opção para destacar aquela estrada. Atual é a estrada que você está usando, e “Mais rápida” é a mais rápida; as outras mostram quanto são mais lentas ou que tipo de via evitam.',
  'help.guide.roadtrip-alternatives.step.4':
    'Clique em uma opção para usar essa rota, ou em Encerrar para manter a rota atual.',
  'help.guide.roadtrip-alternatives.result':
    'O trecho passa a usar a estrada escolhida, e a distância na coluna lateral e os horários de chegada seguintes também mudam.',
  'help.guide.roadtrip-alternatives.tip.1':
    'Quando você escolhe outra estrada, o TREK primeiro a confere com o roteador da viagem de carro. Depois, mantém o trecho nessa estrada com o mínimo de pontos de passagem necessários e substitui os pontos de passagem que o trecho já tinha. Uma estrada que o roteador não consegue seguir não é salva. Escolher a estrada do próprio roteador remove os pontos de passagem de novo.',
  'help.guide.roadtrip-alternatives.tip.2':
    '“Sem rodovia”, “Sem pedágio” e “Sem balsa” vêm de um segundo serviço, com modelo de velocidade próprio, então os tempos deles não podem ser comparados com os outros.',
  // roadtrip-limits
  'help.guide.roadtrip-limits.title': 'Definir o carro e os limites de direção',
  'help.guide.roadtrip-limits.goal': 'Informe ao TREK qual veículo você dirige e quanto quer dirigir sem parar.',
  'help.guide.roadtrip-limits.step.1':
    '“Configurações de direção” fica abaixo da busca, na coluna da direita. Os selos mostram o que está definido; clique para abrir.',
  'help.guide.roadtrip-limits.step.2':
    'Em Carro, “Trecho mais longo seguido” e “Condução por dia” são em minutos. Um campo vazio significa desativado, e nada é sinalizado.',
  'help.guide.roadtrip-limits.step.3':
    'Em Veículo, diga o que você dirige. Combustível só abastece em postos, Elétrico só em pontos de recarga, e Ambos nos dois.',
  'help.guide.roadtrip-limits.step.4':
    'Digite você mesmo a “Autonomia por tanque” ou a “Autonomia por carga”. Ou abra “Calcular pelos dados do carro”, abaixo de “Abastecer até”: ele usa Tanque e Consumo, ou Bateria, Consumo e “Desgaste da bateria”, e calcula a autonomia.',
  'help.guide.roadtrip-limits.step.5':
    '“Evitar quando possível”, na coluna da esquerda, é uma preferência, não uma proibição: se um dia não tiver outra opção, ele usa a estrada mesmo assim e mostra um aviso no cabeçalho.',
  'help.guide.roadtrip-limits.step.6':
    'Clique em Encerrar. Os selos do cartão mostram o que está definido, e o trilho marca cada trecho e cada dia que ultrapassa um limite.',
  'help.guide.roadtrip-limits.result':
    'Os selos do cartão mostram o que está definido, e cada trecho e cada dia acima de um limite ganha um selo na trilha.',
  'help.guide.roadtrip-limits.tip.1':
    'As configurações pertencem à viagem, então todo mundo nela planeja com o mesmo carro e os mesmos limites.',
  'help.guide.roadtrip-limits.tip.2':
    '“Abastecer até” define até quanto uma parada enche o tanque ou a bateria, porque ninguém carrega até 100 % na estrada. Uma parada de abastecimento ou recarga pode usar outro valor pelo selo da bateria na linha dela.',
  'help.guide.roadtrip-limits.tip.3':
    'Em “Linha da rota”, “Conectar os dias” também traça o trajeto da última parada de um dia até a primeira parada do dia seguinte. “Começar e terminar cada dia na hospedagem” faz cada dia começar e terminar na hospedagem reservada para aquelas noites. “Uma cor por dia” mostra cada dia com a sua própria cor.',
  // roadtrip-day-window
  'help.guide.roadtrip-day-window.title': 'Definir início e fim do dia de direção',
  'help.guide.roadtrip-day-window.goal':
    'Pare de dirigir no horário que você escolher e defina onde o dia deve terminar.',
  'help.guide.roadtrip-day-window.step.1':
    'Abra “Configurações de direção” na coluna da direita e procure “Horários diários”, na coluna da esquerda da janela.',
  'help.guide.roadtrip-day-window.step.2':
    'Defina um “Início do dia”. Sozinho, ele não faz nada: os dois horários são necessários, como diz a nota abaixo deles.',
  'help.guide.roadtrip-day-window.step.3':
    'Defina um “Fim do dia”. O percurso passa a parar nesse horário e continua na manhã seguinte, o que aparece como uma linha “Fim do dia” e uma linha “Continuar viagem” na coluna lateral.',
  'help.guide.roadtrip-day-window.step.4':
    'Em “Encerrar o dia”, escolha “No trajeto” para parar na estrada no horário final, ou “No último local” para parar antes que o próximo trecho passe do horário.',
  'help.guide.roadtrip-day-window.step.5':
    'Clique em Encerrar. O cartão “Configurações de direção” mostra os dois horários em um selo.',
  'help.guide.roadtrip-day-window.result':
    'O trajeto é dividido em dias de viagem com a duração que você definiu, e o que não couber continua em dias calculados depois do último. Seus dias e os lugares deles não mudam.',
  'help.guide.roadtrip-day-window.tip.1':
    'Se você apagar qualquer um dos dois horários, o recurso é desativado de novo. Horários que você mesmo definiu em uma parada sempre têm prioridade.',
  'help.guide.roadtrip-day-window.tip.2':
    'Com horários diários definidos, os dias ficam sempre ligados: o trajeto da última parada de um dia até a primeira do dia seguinte é calculado e contado.',
  'help.guide.roadtrip-day-window.tip.3':
    'O fim de cada dia também aparece como marcador no mapa: uma lua com o número do dia. Arraste-a ao longo da rota, ou sobre um lugar, para terminar o dia em outro ponto. Clique com o botão direito nela para voltar ao fim automático. “Restaurar fins de dia automáticos”, nesta janela, desfaz todas essas mudanças. Para terminar um dia em uma parada, clique na parada e ative “Encerrar o dia aqui” no cartão dela.',
  // roadtrip-refuel
  'help.guide.roadtrip-refuel.title': 'Abastecer antes que o tanque esvazie',
  'help.guide.roadtrip-refuel.goal':
    'Encontre um lugar para abastecer no trecho da rota que o carro ainda alcança e adicione-o ao percurso.',
  'help.guide.roadtrip-refuel.step.1':
    'Com uma autonomia definida, a coluna lateral mostra uma faixa no trecho onde o combustível ou a bateria acaba: “Aqui o tanque acaba” ou, em um carro elétrico, “A bateria acaba aqui”. Abaixo, aparece em que ponto do trecho isso acontece.',
  'help.guide.roadtrip-refuel.step.2':
    'O ícone de lâmpada na faixa é o botão: “Buscar combustível” ou, para carro elétrico, “Procurar recarga”. Ele busca ao longo da estrada antes desse ponto e mostra “Procurando ao longo da rota…” durante a busca.',
  'help.guide.roadtrip-refuel.step.3':
    'Aparecem até três postos, cada um com a distância até a rota e quanta autonomia ainda sobraria.',
  'help.guide.roadtrip-refuel.step.4':
    'O sinal de mais em uma oferta a adiciona como parada para abastecer. “Adicionar como parada” abre com o tipo e o horário já preenchidos, e “Adicionar” coloca a parada no trecho, no ponto exato em que a rota passa por ela.',
  'help.guide.roadtrip-refuel.result':
    'A parada aparece no trecho certo com o ícone próprio, e a autonomia volta a ser contada a partir dela. A faixa vai para o ponto onde o tanque agora fica vazio, ou some se você conseguir chegar ao fim do trajeto sem outra parada.',
  'help.guide.roadtrip-refuel.tip.1':
    'A autonomia conta a partir da última parada de abastecimento ou recarga, mesmo de um dia para o outro. O tipo de veículo define quais paradas contam: Combustível só postos, Elétrico só pontos de recarga.',
  'help.guide.roadtrip-refuel.tip.2':
    'A busca olha a estrada antes do ponto em que o combustível acaba, mantém uma reserva e conta o desvio duas vezes, então todo lugar oferecido é realmente alcançável.',
  'help.guide.roadtrip-refuel.tip.3':
    'Se não houver resultados, você pode pesquisar de novo: a lâmpada muda para “Tentar novamente”, porque a busca de lugares é um serviço compartilhado que às vezes não responde a tempo.',
  // roadtrip-track
  'help.guide.roadtrip-track.title': 'Fazer um dia seguir uma trilha importada',
  'help.guide.roadtrip-track.goal':
    'Use no trajeto de um dia uma rota panorâmica que você importou como trilha GPX ou KML.',
  'help.guide.roadtrip-track.step.1': 'Clique no selo “Trilha” no cabeçalho de um dia. A janela abre nesse dia.',
  'help.guide.roadtrip-track.step.2':
    'Escolha uma trilha. Cada uma mostra o comprimento e se acompanha a rota deste dia ou a que distância fica dela. A trilha mais próxima aparece primeiro.',
  'help.guide.roadtrip-track.step.3':
    'Clique em “Seguir esta trilha”. O TREK adiciona pontos de passagem onde o percurso mais se afasta do traçado, recalcula a rota e repete isso várias vezes.',
  'help.guide.roadtrip-track.step.4':
    'A janela informa quantos pontos de passagem foram colocados e o quanto o percurso agora se mantém perto do traçado, ou que o percurso já seguia o traçado. “Descartar pontos de passagem”, no canto inferior esquerdo, remove esses pontos, e o roteador planeja o dia de novo. Fechar a janela mantém o traçado.',
  'help.guide.roadtrip-track.result':
    'O percurso do dia segue o traçado em vez da estrada que o roteador teria escolhido. Passe o mouse sobre o selo Trilha para ver o nome do traçado. Quando os pontos de passagem mantêm o percurso no traçado, o selo também fica destacado.',
  'help.guide.roadtrip-track.tip.1':
    'A janela lista os lugares da viagem que têm um percurso: um GPX ou KML importado com “Importar arquivo” na coluna de lugares em Dias, com Rotas ou “Trilhas (com geometria de percurso)” marcadas para GPX, ou “Caminhos (LineStrings)” para KML. “Importar arquivo” só aparece com o complemento Passeios desativado; com Passeios ativado, um GPX vira um passeio, que esta janela não lista. Enquanto a viagem não tiver um traçado, nenhum dia mostra o selo.',
  'help.guide.roadtrip-track.tip.2':
    'Seguir um traçado substitui os pontos de passagem que os trechos do dia já tinham, então ajuste um trecho à mão depois do traçado, não antes.',
  'help.guide.dateless-trip.step.1': 'Clique em “Nova viagem” e dê um nome à viagem.',
  'help.guide.edit-trip.tip.2':
    'Adicionar ou remover “Companheiros de viagem” aqui vale na hora, sem clicar em Atualizar.',
  'help.guide.trip-reminder.result':
    'Você recebe o lembrete o número de dias escolhido antes do início da viagem, pelos canais em que recebe notificações.',
  'help.guide.upcoming-reservations.step.1':
    'Procure “Próximas reservas” na coluna da direita. Ali aparecem as próximas seis reservas de todas as suas viagens, das mais próximas para as mais distantes, com data, hora e tipo.',
  'help.guide.half-company-holiday.step.1': 'Mude a barra de ferramentas para “Feriado da empresa”.',
  'help.guide.edit-holiday-calendar.result': 'A grade e a legenda são atualizadas na hora a cada alteração.',
  'help.guide.person-color.result': 'Todos os dias registrados pela pessoa agora aparecem na nova cor.',
  'help.guide.answer-fusion-request.step.1':
    'Abra Férias depois que alguém convidar você. A janela “Pedido de fusão” abre sozinha.',
  'help.guide.log-for-partner.step.1':
    'No cartão Pessoas, clique no nome da pessoa. Uma marca de seleção indica que ela está selecionada.',
  'help.guide.dissolve-fusion.step.1': 'Abra as Configurações.',
  'help.guide.country-places.step.2': 'Clique no selo Lugares do cartão, aquele com o alfinete.',
  'help.guide.search-place.tip.2': 'Se a região já estiver marcada, o pop-up pergunta se você quer removê-la.',
  'help.guide.tour-activity-stats.step.4':
    'Os selos à direita mostram a base das somas: Planejado para os passeios contados pelo planejamento da viagem, Gravado para os passeios com um traçado real vinculado. “Ainda por vir”, “Sem dia” e “Sem data” contam os passeios que ainda não entram na soma. O i explica a regra.',
  'help.guide.move-to-list.step.2':
    'Clique em “Duplicar em lista” para mantê-los aqui também, ou em “Mover para lista” para tirá-los desta lista.',
  'help.guide.accept-list-invite.title': 'Aceitar um convite para uma lista',
  'help.guide.tour-collection-add-to-trip.step.3':
    'Em “Pontos de caminho”, escolha o bloco com os pontos para adicionar início, paradas e fim na ordem, ou “Só a linha” para adicionar apenas a linha salva.',
  'help.guide.tour-collection-manage.step.1':
    'Abra uma lista. Cada passeio salvo mostra o grau, o tipo, a viagem de onde foi salvo, a distância, a subida e quantos pontos de caminho tem. Passe o mouse sobre o nome da viagem para ver quem o salvou.',
  'help.guide.entry-draft.step.1': 'No editor, ative Rascunho na coluna da direita.',
  'help.guide.journey-map-layers.step.3':
    'Clique em um alfinete vazado ou em um pontinho no mapa. Um cartão mostra o que é: um lugar planejado e o dia dele, ou uma estadia com “Abrir registro”, que leva ao relato do dia a que ela pertence.',
  'help.guide.journey-keep-route.step.3': 'Clique em “Salvar rota”.',
  'help.guide.journey-day-stays.step.3':
    'Clique em “Não é um lugar que visitei” na estadia que você não quer. Ela sai da lista.',
  'help.guide.journey-take-over-day.step.3':
    'Se quiser uma única entrada para o dia inteiro, mude Entradas para “Relato do dia”: uma só entrada lista todas as estadias escolhidas com seus horários.',
  'help.guide.journey-auto-prepare.step.2': 'Em “Dias gravados”, ative “Preparar dias gravados automaticamente”.',
  'help.guide.photo-location.step.2': 'Em Fotos, ative “Localizar entradas pelas fotos”.',
  'help.guide.link-trip.tip.3':
    'Se você escrever uma entrada em um dia de uma viagem ainda não vinculada, o editor oferece “Vincular viagem” ali mesmo, na entrada.',
  'help.ctx.settings-plugins.summary':
    'Suas configurações pessoais dos plugins que o administrador instalou: as chaves e preferências que cada plugin pede e um registro do que os plugins fizeram em seu nome. A aba só aparece enquanto houver um plugin ativo.',
  'help.ctx.settings-about.bullet.3':
    'No Ko-fi, no Buy Me a Coffee e no Discord você pode apoiar o TREK ou conversar com quem o desenvolve.',
  'help.guide.language-region.step.3':
    'Defina a “Moeda de exibição” ou mantenha “Moeda da viagem” para ver cada viagem na própria moeda. Depois escolha “Unidade de temperatura”, “Unidade de distância”, “Formato de hora” e o dia em “Semana começa em”.',
  'help.guide.travel-map-prefs.step.3':
    '“Explorar lugares no mapa” mostra a pílula de categorias para encontrar lugares próximos. “Ocultar códigos de reserva” esconde os números de confirmação até você passar o mouse ou tocar neles. “Otimizar rota a partir da hospedagem” faz o dia começar e terminar no seu hotel.',
  'help.guide.web-push-device.step.2':
    'No cartão Notificações, no topo, a coluna Push define quais eventos são enviados aos seus dispositivos.',
  'help.guide.connect-airtrail.goal': 'Deixe o TREK importar e sincronizar os voos do seu próprio AirTrail.',
  'help.guide.connect-dawarich.goal':
    'Deixe o TREK ver por onde você realmente passou, a partir do seu próprio Dawarich.',
  'help.guide.tour-connect-wanderer.goal':
    'Deixe o TREK ler as trilhas do seu próprio wanderer para importá-las como passeios.',
  'help.guide.tour-wanderer-watch.title': 'Receber aviso quando suas trilhas do wanderer mudarem',
  'help.guide.plugin-settings.tip.2':
    'Um canal de plugin em Notificações tem um botão Configurar que abre esta página.',
  'help.guide.default-user-settings.result':
    'As contas novas e todos que nunca mudaram essas configurações passam a ver as suas escolhas.',
  'help.guide.own-routing-engine.goal':
    'Calcule as rotas dos dias e das viagens de carro em um servidor OSRM ou Valhalla próprio, em vez dos públicos.',
  'help.guide.admin-passkeys.tip.1':
    'Se o TREK ainda não conseguir determinar um domínio, um aviso informa isso, e as passkeys ficam ocultas até você definir APP_URL ou o Relying Party ID.',
  'help.guide.rotate-jwt-secret.step.1':
    'No fim da aba Configurações, em “Zona de perigo”, clique em Renovar ao lado de “Rotacionar segredo JWT”.',
  'help.guide.storage-backends.tip.3':
    'O TREK consegue baixar os caches de fotos de novo, então espelhá-los costuma ser desperdício de espaço.',
  'help.guide.admin-channels.step.3':
    'No cartão Notificações logo abaixo, escolha para cada evento por quais canais ele é enviado: “Nova versão disponível”, “Falha na réplica de armazenamento” e “Região de remo pedida”. Cada interruptor salva na hora.',
  'help.guide.notification-defaults.tip.1':
    'Desligado é um padrão que cada usuário ainda pode ligar; Bloqueado desliga para todos.',
  'help.ctx.notifications.bullet.4':
    'Ao lado da hora de cada notificação, “Marcar como lido” (o tique duplo) e Excluir (a lixeira) valem só para ela. “Marcar tudo como lido” e “Excluir tudo”, no topo, valem para a lista inteira.',
  'help.guide.read-notifications.tip.2':
    'Uma notificação sem botão é apenas informativa. Leia no painel e marque como lida ali mesmo.',
  'help.guide.filter-notifications.result':
    'A lista mostra só o que ainda não foi lido, das mais recentes para as mais antigas.',
  'help.guide.delete-notifications.title': 'Excluir notificações',
  'help.guide.notification-settings.goal':
    'Decida quais eventos aparecem no ícone do sino e quais também chegam a você por e-mail, webhook, ntfy ou push.',
  'help.guide.public-link.step.4': 'Clique em “Criar link”, depois em Copiar, e envie.',
  'help.guide.link-journal.step.2': 'Clique em “Vincular diário” e escolha um dos seus diários em “Escolha um diário”.',
  'help.guide.dawarich-stays.title': 'Transformar uma estadia gravada em lugar',
  'help.guide.dawarich-stays.tip.2':
    'Se você excluir um lugar que veio de uma estadia, a estadia volta para a lista como aguardando.',
  'help.guide.leave-stop-off-route.goal':
    'Mantenha uma parada no dia sem que a rota passe por ela, para um lugar por onde você passa a pé ou que só quer ver no mapa.',
  'help.guide.day-route.tip.4':
    'Para uma parada que você quer no dia, mas fora da rota, escolha “Tirar da rota” no menu dela.',
  'help.guide.move-booking-day.step.2':
    'Arraste a linha até o cabeçalho do cartão de outro dia. Uma reserva de um dia só passa inteira para esse dia. Em uma reserva de vários dias, a linha Partida muda o dia em que ela começa, e a linha Chegada, o dia em que termina.',
  'help.guide.place-image-from-file.title': 'Usar uma foto anexada como imagem do lugar',
  'help.guide.place-image-from-file.tip.2':
    'Uma foto fixada na parada ou anexada à reserva dela também aparece como opção.',
  'help.guide.place-own-hours.step.5':
    'Clique em Atualizar. O cartão agora mostra seus horários em “Horário de funcionamento”, e “Em aberto” ou Encerrada, no topo, passa a se basear neles.',
  'help.guide.confirm-stay-booking.step.3':
    'Clique em Pendente no topo. A dica mostra “Definir como Confirmada”, e o ponto fica verde.',
  'help.guide.map-nearby-places.tip.4':
    'Uma categoria cuja busca falhou ganha um ponto vermelho, e “Pesquisar nesta área” fica vermelho com um sinal de alerta: clique nele para tentar de novo.',
  'help.guide.tour-map-lines.tip.1':
    'Ao recolher um dia na coluna de dias, os passeios e as paradas dele somem do mapa.',
  'help.guide.car-stops.step.3':
    'Digite um título no cabeçalho. Em Rota, escolha em De onde você retira o carro e em Para onde o devolve; os lugares da viagem aparecem como sugestão antes mesmo de você digitar. Retirada e “Hora retirada” indicam quando você retira o carro; Devolução e “Hora devolução”, quando o devolve.',
  'help.guide.transport-details.step.1':
    'Na aba Transportes, clique em um cartão. Os detalhes abrem sobre a aba, com o cabeçalho na mesma cor do cartão. A linha de um transporte no plano do dia abre os mesmos detalhes.',
  'help.guide.export-transports-csv.tip.2':
    'A aba Reservas tem o mesmo ícone e gera um arquivo próprio, que termina em bookings.csv.',
  'help.guide.group-sort-bookings.step.2':
    'Em “Agrupar por”, escolha Status, Dia, Tipo ou “Sem agrupamento”. A aba se organiza nessas seções na hora.',
  'help.guide.export-bookings-csv.result':
    'Seu navegador baixa um arquivo com o nome da viagem e da aba, por exemplo autumn-in-japan-bookings.csv, com uma linha para cada reserva exibida na aba.',
  'help.guide.arrange-packing-list.result':
    'As listas ficam na ordem em que você as arrastou, e os itens ficam em ordem de A a Z até você desligar isso. O TREK continua guardando a sua ordem.',
  'help.guide.count-packed-pieces.step.2':
    'Um contador aparece antes da quantidade: 0/5, com um botão de menos e um de mais. Clique no mais para cada peça que vai para a bolsa.',
  'help.guide.expense-receipts.step.4':
    'De volta ao extrato, a linha tem um chip Comprovante ao lado do nome, com o número entre parênteses quando há vários. Clique nele para abrir o comprovante.',
  'help.guide.final-budget.tip.3':
    'Quem saiu da viagem continua com uma linha em Saldos e em “Orçamento final” enquanto ainda tiver dinheiro a receber ou a pagar.',
  'help.guide.files-sync-settings.step.2':
    'A barra de fluxo mostra o TREK e o seu repositório, com os documentos de cada um, e duas faixas entre eles: “Saída para o repositório” e “Entrada do repositório”. Clique em “Saída para o repositório” para desativá-la. A faixa fica cinza, e a linha abaixo das faixas passa a dizer “Só entrando”. Clique de novo para reativá-la.',
  'help.guide.files-sync-settings.tip.4':
    'Só o proprietário da viagem ou um administrador pode alterar essas opções. Os outros membros veem a barra de fluxo com uma linha como “Documentos vão nos dois sentidos”, mas não veem Configurações.',
  'help.guide.manage-notes.step.2':
    'Expandir abre a nota inteira: o texto completo, o Site e os Arquivos. Clique em um arquivo para ver a prévia. Editar, no rodapé, passa direto para o editor; o X no canto superior direito fecha a nota.',
  'help.guide.note-categories.goal':
    'Organize as notas do grupo em categorias com nome e cor e mostre uma categoria por vez.',
  'help.guide.note-categories.tip.1':
    'A lixeira só remove categorias que nenhuma nota usa. Uma categoria ainda em uso continua na lista até você mover essas notas para outra categoria.',
  'help.guide.roadtrip-reorder.title': 'Reordenar uma parada ou mudá-la de dia',
  'help.guide.roadtrip-reorder.tip.3':
    'O TREK não pergunta nada sobre um horário que você fixou: o trilho recalcula o dia na hora e marca as paradas que não dá mais para alcançar a tempo.',
  'help.guide.roadtrip-overnight.step.3':
    'No topo da janela, Pernoite adiciona uma noite de hospedagem e Pausa transforma o lugar em uma parada temporária. Um hotel abre em Pernoite; um camping, em Pausa. Um pernoite pede apenas o Check-in, que pode ficar em branco.',
  'help.guide.roadtrip-stop-fill.step.1':
    'Em uma parada de abastecimento ou recarga no trilho, clique no selo da bateria. Ele mostra até que nível a parada abastece: esmaecido enquanto usa o valor de “Abastecer até”, sólido quando tem um valor próprio.',
  'help.guide.roadtrip-bookings.step.1':
    'Registre o trajeto como uma reserva de Voo, Trem, Balsa, Cruzeiro ou Ônibus no dia correspondente, com as duas pontas localizadas. O percurso a inclui automaticamente: a estrada termina no terminal de onde o trajeto parte e recomeça onde ele chega.',
  'help.guide.roadtrip-google-import.result':
    'As paradas da rota são adicionadas depois da última parada daquele dia, e a rota no trilho e no mapa passa por elas.',
  'help.guide.roadtrip-hazards.step.3':
    'Os alertas aparecem no mapa como áreas. Clique em um para ver do que se trata, qual serviço o informou e quando foi atualizado pela última vez.',
  'help.ctx.trip-tours.bullet.2':
    'No topo, “Importar GPX ou KML” traz arquivos como passeios. O botão de filtro logo abaixo (de início Todos, com o número de passeios) filtra a lista por status, origem, limite de rota e tipo.',
  'help.guide.tour-show-list.step.2':
    'Cada linha é um passeio. A barra colorida é a linha dele no mapa, e o bloco redondo mostra o limite de rota (T1 a T6) de uma caminhada planejada no TREK ou o ícone do tipo. Os selos abaixo do nome mostram os dias em que ele está, o tempo, a distância e a subida. Em um passeio de vários dias, a lua com um número indica quantas etapas ele tem.',
  'help.guide.tour-add-to-day.title': 'Colocar um passeio em um dia',
  'help.guide.tour-add-to-day.tip.2':
    'Quando a viagem termina antes da última etapa, a opção mostra a última etapa que cabe, e as seguintes ficam sem dia.',
  'help.guide.tour-day-times.step.3':
    'Clique em Atualizar. A linha agora mostra início → fim. Um horário de término calculado aparece mais claro, com ≈ para estimativa, ≥ enquanto uma estadia ainda não tem horário e +1 quando passa da meia-noite. Passe o mouse sobre ele para ver como foi calculado.',
  'help.guide.tour-remove-from-day.goal': 'Tire um passeio do planejamento sem excluí-lo.',
  'help.guide.tour-filter-list.goal':
    'Reduza uma lista longa aos passeios que você procura: ainda não planejados, de um arquivo ou de um tipo.',
  'help.guide.tour-filter-list.result': 'Só os passeios filtrados aparecem na lista; os outros continuam na viagem.',
  'help.guide.tour-hide-on-map.result':
    'Só os passeios que você quer aparecem no mapa, e os ocultos continuam na lista, esmaecidos.',
  'help.guide.tour-import-plan-tab.result':
    'O traçado virou um passeio da viagem: uma linha na lista com o selo GPX e uma linha no mapa.',
  'help.guide.tour-detail-read.title': 'Abrir um passeio e ler o cartão dele',
  'help.guide.tour-detail-read.step.7': 'Feche o cartão com o X no topo ou pressione Esc.',
  'help.guide.tour-rename-colour.goal':
    'Dê ao passeio um nome fácil de reconhecer e uma cor de linha bem visível no mapa.',
  'help.guide.tour-take-along.title': 'Baixar um passeio para o celular ou o GPS',
  'help.guide.tour-take-along.tip.4':
    'Na aba Passeios, o mesmo download fica no topo da coluna da esquerda. Se o passeio tiver alterações não salvas, o download pede que você salve antes.',
  'help.guide.tour-copy-keep.tip.1':
    'Os dois são cópias: alterações posteriores no passeio não mudam nem a cópia nem a versão salva na coleção.',
  'help.guide.tour-packing-link.step.2':
    'Em “Vincular a”, escolha “Lista de mala inteira” ou uma das listas. Cada linha mostra quantos itens tem.',
  'help.guide.tour-files.title': 'Anexar arquivos a um passeio',
  'help.guide.tour-activity-link.title': 'Vincular o traçado que você realmente fez',
  'help.guide.tour-activity-link.tip.2':
    'Só dá para vincular um traçado importado que não foi usado para planejar um passeio, e cada traçado só pode ser vinculado a um passeio.',
  'help.guide.tour-activity-compare.step.4':
    'Trocar, abaixo do traçado, escolhe outra gravação. Desvincular o tira do passeio, e o traçado continua na viagem como importação.',
  'help.guide.tour-origin-check.step.3':
    'Um passeio que você desenhou na aba Passeios mostra “planejado no TREK”, com o dia em que foi Criado.',
  'help.ctx.trip-tour-planner.bullet.2':
    'O painel da esquerda é o editor. Sem nada aberto, ele oferece “Planejar novo passeio”. Com um passeio aberto, mostra o nome, o tipo, os pontos de caminho, os cartões do tipo e os detalhes, com Descartar e Salvar embaixo.',
  'help.guide.tour-open-workspace.step.2':
    'O painel da esquerda é o editor. Sem nenhum passeio aberto, ele oferece “Planejar novo passeio”, que começa um passeio no mapa.',
  'help.guide.tour-open-workspace.tip.3':
    'Se você abrir outro passeio com alterações não salvas no editor, o TREK pergunta antes: “Descartar alterações” ou continuar editando.',
  'help.guide.tour-draw-route.step.5':
    'Clique nos próximos pontos na ordem em que vai percorrê-los. Cada clique adiciona o ponto como o novo fim e, a partir de dois pontos, o TREK traça a rota pelos caminhos.',
  'help.guide.tour-type-profile.goal':
    'Escolha o tipo de passeio e, se for de bicicleta, o perfil, para que a rota siga os caminhos certos.',
  'help.guide.tour-edit-points.title': 'Mover, reordenar e remover pontos',
  'help.guide.tour-edit-points.tip.1':
    'O primeiro ponto tem o selo Início e o último, Fim. Mover um ponto para o topo ou para o fim da lista faz dele o início ou o fim.',
  'help.guide.tour-shaping-points.step.4':
    'Para transformar uma parada em ponto de forma, ou o contrário, abra “Mais ações” na linha dela e escolha “Tornar um ponto de forma” ou “Tornar uma parada”.',
  'help.guide.tour-loop-reverse.step.2':
    'A última linha agora mostra “Volta ao início”, e a rota no mapa termina onde começou.',
  'help.guide.tour-leg-by-hand.step.1':
    'Abra “Mais ações” no ponto onde o trecho começa e escolha “Desenhar o próximo trecho à mão”.',
  'help.guide.tour-trip-places.goal': 'Adicione como parada do passeio um lugar que você já planejou na viagem.',
  'help.guide.tour-trip-places.result': 'O passeio ganha uma nova parada para o lugar da viagem, com o mesmo nome.',
  'help.guide.tour-details-times.tip.2':
    'Em uma caminhada, Detalhes também traz “Dificuldade máxima da trilha” e “Escolha da rota”, explicadas nos guias de caminhada. Uma caminhada urbana não tem Pausas: em vez disso, conta o tempo de permanência nas paradas.',
  'help.guide.tour-save.step.4': 'O passeio agora aparece em “Passeios desta viagem”, ainda sem dia.',
  'help.guide.tour-edit-saved.step.2':
    'Altere o que precisar, como em um passeio novo: mova ou adicione pontos, troque o tipo ou edite os detalhes, como aqui a Descrição.',
  'help.guide.tour-summary-profile.goal':
    'Veja a extensão e a inclinação do passeio e em que ponto da rota fica cada altitude.',
  'help.guide.tour-summary-profile.result':
    'Você sabe a extensão do passeio, quanto ele sobe, quanto tempo leva e onde fica íngreme.',
  'help.guide.tour-list-manage.tip.1':
    'Cada passeio conta uma vez nos totais, mesmo que esteja em vários dias. Uma soma com ≥ na frente não inclui alguns passeios. Passe o mouse sobre ela para ver quantos.',
  'help.guide.tour-delete.tip.1': 'Não dá para desfazer esta ação, e Desfazer não traz o passeio de volta.',
  'help.guide.tour-saved-elsewhere.step.3':
    'Se você clicar em Salvar mesmo assim, abre “Alterado nesse meio-tempo”, e nada é sobrescrito.',
  'help.ctx.trip-tour-import.bullet.2':
    'A “Prévia da importação” mostra no mapa todos os traçados dos arquivos, com distância, subida, descida e pontos, antes de salvar qualquer coisa. Em “Importar como”, você diz o que são os traçados.',
  'help.guide.tour-import-gpx.step.3':
    'A “Prévia da importação” abre, e nada foi salvo ainda. O mapa mostra o percurso inteiro, e cada traçado dos arquivos é uma linha numerada com distância, subida, descida e pontos. Um traçado gravado também mostra quando foi feito e quanto tempo levou.',
  'help.guide.tour-import-gpx.result':
    'O passeio está em “Passeios desta viagem”, ainda sem dia. Se for um só, ele abre direto no mapa como “Passeio GPX”.',
  'help.guide.tour-view-import.tip.3': 'Uma trilha do wanderer abre do mesmo jeito, como “Passeio do wanderer”.',
  'help.guide.tour-plan-from-import.tip.1': 'Descartar remove a sugestão. Nada é guardado até você salvar.',
  'help.guide.tour-restore-recorded.step.2': 'Clique em “Restaurar traçado gravado”.',
  'help.guide.tour-take-over.step.2': 'Escolha “Trazer um passeio de outra viagem”.',
  'help.guide.tour-take-over.result':
    'Uma mensagem confirma a transferência, e o passeio abre no editor, pronto para ir para um dia.',
  'help.guide.tour-import-wanderer.tip.2':
    'A importação é uma cópia: alterações posteriores no wanderer não mudam o passeio. “Verificar fonte”, na Origem do passeio, avisa quando a trilha mudou.',
  'help.ctx.trip-tour-map.bullet.3':
    '“Buscar lugar ou endereço”, no topo do mapa, leva o mapa até uma cidade, um refúgio ou um cume sem adicionar nada ao passeio.',
  'help.guide.tour-map-layers.result':
    'O passeio aparece no mapa mais adequado a ele, e a pílula mostra qual está ativo.',
  'help.guide.tour-along-search.step.3':
    'Em “Até esta distância da rota”, escolha a que distância da linha procurar: 250 m, 500 m, 1 km ou 2 km.',
  'help.guide.tour-along-add-stop.goal':
    'Faça o passeio passar por um mirante, um refúgio ou uma nascente que você encontrou no caminho.',
  'help.guide.tour-along-add-stop.tip.3':
    'Um trecho onde não dá para adicionar parada (uma via ferrata ou um transbordo adicionado como linha fixa, ou um trecho desenhado à mão) fica esmaecido na lista, com o motivo ao lado.',
  'help.guide.tour-3d-terrain.result':
    'Você viu o passeio sobre o terreno 3D, com os trechos íngremes coloridos, e o mapa plano está de volta para o planejamento.',
  'help.guide.tour-3d-flyover.step.3':
    'Pausa interrompe o voo onde ele está, e “Reproduzir sobrevoo” continua dali. Recomeçar volta ao início e começa o voo de novo.',
  'help.guide.tour-map-overlays.step.1':
    'Abra um passeio de esqui na aba Passeios. As pistas já vêm ligadas: o interruptor delas é a montanha nevada na pílula do canto inferior esquerdo, “Pistas, trilhas de esqui de fundo e teleféricos”. Clique nele para ocultá-las no mapa e clique de novo para mostrá-las.',
  'help.ctx.trip-tour-stages.title': 'Passeios de vários dias',
  'help.guide.tour-multi-day.goal': 'Divida uma rota em etapas, uma para cada dia de deslocamento.',
  'help.guide.tour-multi-day.tip.2':
    'Para juntar duas etapas de novo, escolha “Remover fim de etapa” no menu da parada com a lua. Remover essa parada também as junta, e um aviso oferece Desfazer.',
  'help.guide.tour-stages-on-days.step.3':
    'Escolha “Etapas a partir deste dia”: a etapa 1 vai para esse dia e cada etapa seguinte para o dia seguinte. “Roteiro completo neste dia” coloca a rota inteira só nesse dia.',
  'help.guide.tour-stages-on-days.result':
    'Cada etapa está no seu dia da viagem, e a etapa que você abriu está no editor.',
  'help.ctx.trip-tour-hike.bullet.6':
    'O “Resumo do passeio”, à direita, mostra distância, subida, tempo estimado de caminhada ou corrida, pausas e o total planejado, com o perfil de altitude logo abaixo. Salvar, no fim do editor, salva o passeio.',
  'help.guide.tour-hike-plan.step.6': 'Clique em Salvar no fim da coluna da esquerda.',
  'help.guide.tour-hike-trail-details.step.1':
    'Abra a caminhada em “Passeios desta viagem” e procure “Detalhes da trilha” abaixo do cartão “Pontos de caminho”. Ative “Mostrar ao longo da rota”.',
  'help.guide.tour-hike-trail-details.tip.3':
    'Nada nesse cartão altera o passeio, e ele precisa de conexão. Uma caminhada importada mostra o mesmo cartão na visualização, sem limite de rota.',
  'help.guide.tour-hike-round.result':
    'A caminhada segue o circuito que você escolheu, de volta ao início. “Volta usada”, na parte de baixo do mapa, tem Desfazer, e Salvar mantém a mudança.',
  'help.guide.tour-hike-compare-ways.step.3':
    'Os selos de cada linha mostram quanto aquele caminho é mais longo, mais alto ou mais lento que o atual. Clique no que você quer.',
  'help.guide.tour-ferrata-add.step.1':
    'Com uma caminhada aberta, clique em “Vias ferratas” na fileira de botões do mapa, no canto inferior esquerdo. O selo conta as vias ferratas visíveis; aproxime o zoom se ele pedir.',
  'help.guide.tour-ferrata-add.tip.3':
    'O trecho na via ferrata fica destacado no perfil de altitude, para você ver em que momento do dia chega a ele.',
  'help.guide.tour-run-plan.step.5': 'Dê um nome à corrida em “Nome do passeio” e clique em Salvar.',
  'help.guide.tour-run-ways.step.1':
    'Abra a corrida em “Passeios desta viagem” e ative “Mostrar ao longo da rota” em “Detalhes da trilha”, abaixo do cartão “Pontos de caminho”.',
  'help.ctx.trip-tour-walk.bullet.1':
    'Em “Tipo de passeio”, a opção “Caminhada urbana / turística” transforma um passeio em caminhada. Os pontos dela são paradas com Rótulo, tempo de permanência e importância. Uma caminhada não tem limite de trilha nem o campo Pausas: o tempo de permanência é usado no lugar.',
  'help.guide.tour-walk-plan.step.2':
    'Adicione as paradas: confira se “Adicionar ponto” está ativo e clique no mapa em cada uma, ou clique em “Locais da viagem” para usar um lugar que a viagem já tem.',
  'help.guide.tour-walk-plan.result':
    'A caminhada lista as paradas com o tempo de permanência, e o “Resumo do passeio” soma tudo. Coloque-a em um dia para ver quando você chega a cada parada.',
  'help.guide.tour-walk-sights.tip.1': 'Vira uma parada da caminhada, não um lugar da viagem.',
  'help.guide.tour-walk-day-times.step.3':
    'Abra a caminhada de novo na aba Passeios. No topo de “Pontos de caminho”, “Horários para” mostra o dia e o horário de início. Em uma caminhada planejada em vários dias, clique ali para escolher outro.',
  'help.guide.tour-walk-google-import.goal':
    'Cole uma rota a pé compartilhada do Google Maps e carregue as paradas dela como caminhada.',
  'help.guide.tour-walk-google-import.result':
    'Uma nova caminhada urbana abre no editor com as paradas do Google Maps, pronta para ser salva.',
  'help.guide.tour-walk-check-off.tip.2':
    'A linha da caminhada no plano do dia também mostra a contagem, por exemplo 3/7.',
  'help.ctx.trip-tour-bike.bullet.4':
    'No perfil MTB, o mesmo cartão mostra os graus das trilhas (mtb:scale) onde os mapeadores os informaram. Um caminho sem grau é desconhecido, não fácil.',
  'help.guide.tour-bike-profile.step.6':
    'Digite um nome em “Nome do passeio” e clique em Salvar no fim do painel da esquerda.',
  'help.guide.tour-bike-surfaces.goal':
    'Descubra quanto da rota é asfalto, cascalho ou desconhecido, e por que tipos de caminho ela passa.',
  'help.guide.tour-bike-surfaces.tip.3':
    'O cartão usa a rota como o roteador a planejou e não altera nada no passeio. Ele precisa de conexão; offline, ele avisa, e a rota não é afetada.',
  'help.guide.tour-bike-mtb-grades.tip.1':
    '“Sem grau nos dados” significa desconhecido, não fácil. O grau não diz se uma trilha é adequada para você.',
  'help.ctx.trip-tour-ski.bullet.3':
    'Cada ponto em que você clica no mapa é ligado ao anterior por pistas, teleféricos e trilhas. Abaixo de cada ponto, o trecho dele aparece como chips, com as pistas na cor do grau e seus minutos. Um trecho que não pode ser planejado fica vermelho, mostra o motivo e oferece uma correção ou “Desenhar reto”.',
  'help.guide.tour-ski-plan.step.4':
    'Confira se “Adicionar ponto” está ativo e clique no mapa onde você começa e em cada lugar que quer alcançar, na ordem. O roteador de pistas liga cada ponto ao anterior por pistas, teleféricos e trilhas.',
  'help.guide.tour-ski-options.title': 'Dizer ao roteador de pistas como você esquia',
  'help.guide.tour-ski-options.tip.2':
    '“Usar teleféricos” vem ativado por padrão em Alpino e Snowboard e desativado nas outras modalidades. Excluir e “Descer de teleférico se preciso” só aparecem quando teleféricos são usados.',
  'help.guide.tour-ski-fix-leg.tip.1':
    'Você também pode arrastar o ponto no mapa para mais perto de uma pista, trilha ou teleférico. O trecho é recalculado quando você solta.',
  'help.guide.tour-ski-summary.step.2':
    'Esquiando, “Em teleféricos”, Aguardando e “A pé” mostram o tempo de cada um. Pistas, “Descida nas pistas” e “Viagens de teleférico” mostram a extensão das pistas, o desnível que você desce nelas e quantos teleféricos você pega.',
  'help.guide.tour-ski-pistes-layer.goal':
    'Veja as pistas, trilhas de esqui de fundo e teleféricos em volta do seu passeio de esqui e o que as cores significam.',
  'help.guide.tour-ski-import.title': 'Importar um traçado de esqui e dizer o que foi',
  'help.guide.tour-ski-import.tip.1':
    'Um traçado importado fica como foi gravado: o TREK não o ajusta às pistas, e o cartão mostra “Tempo de esqui” como “Não calculado”.',
  'help.ctx.trip-tour-paddle.bullet.3':
    '“Mais ações” em um ponto reúne as ferramentas de remo: planejar o próximo trecho pela água ou desenhá-lo à mão, “Carregar o barco a partir daqui” e “Eclusa neste ponto”.',
  'help.guide.tour-paddle-setup.step.3':
    'Em Barco, escolha Caiaque, Canoa, SUP ou Outro. O barco define a velocidade que o TREK sugere.',
  'help.guide.tour-paddle-setup.tip.4':
    '“Remar tem riscos”, a linha no fim da coluna, abre “Segurança na água”. Leia uma vez antes do seu primeiro passeio.',
  'help.guide.tour-paddle-water-route.step.5':
    'Para planejar de uma vez todos os trechos desenhados à mão, clique em “Planejar pela água os trechos desenhados à mão”, as ondas no cabeçalho de “Pontos de caminho”.',
  'help.guide.tour-paddle-portage.step.1':
    'Aponte para a parada onde você sai da água e clique em “Mais ações”, os três pontos.',
  'help.guide.tour-paddle-portage.result':
    'O trecho vira um transbordo no mapa e nos pontos de caminho, e a “Estimativa de tempo” o conta como tempo carregando o barco.',
  'help.guide.tour-paddle-lock.tip.2':
    'Se um transbordo contorna a eclusa, ela fica esmaecida e marcada com “Contornada por terra, conta o transbordo”. O tempo do transbordo é que conta, e os minutos da eclusa ficam de fora.',
  'help.guide.tour-paddle-time.step.4':
    'Com um transbordo no passeio, a linha Carregando conta o tempo de carregar o barco. Clique na velocidade e digite com que rapidez você carrega o barco. “Desembarque e reembarque” soma os minutos em cada transbordo.',
  'help.guide.tour-paddle-wind.step.1':
    'Coloque o passeio de remo em um dia da viagem. O cartão Vento, na coluna da esquerda, passa a mostrar a previsão desse dia no início do passeio.',
  'help.guide.tour-paddle-wind.result':
    'Você sabe como vai estar o vento no seu ponto de entrada na água, hora a hora.',
  'help.guide.tour-paddle-checklist.tip.1':
    'Para cada obstáculo, escolha o que vai fazer: “Passar remando”, “Fazer transbordo”, Contornar ou “Não afeta”. Próximo leva à próxima entrada em aberto.',
  'help.guide.tour-paddle-track-marks.step.1':
    'Na aba Passeios, clique em “Adicionar passeio” na coluna da direita, escolha “Importar GPX ou KML” e selecione o arquivo.',
  'help.guide.tour-paddle-track-marks.tip.2':
    'Descartar remove as marcações que você não salvou. O traçado gravado em si nunca é redesenhado.',
  'help.ctx.trip-tour-horse.bullet.4':
    'O TREK não calcula tempo de cavalgada. Informe um horário em Planejado, em Detalhes, se quiser que ele apareça no dia.',
  'help.guide.tour-horse-plan.step.5':
    'Escolha um trecho em Seções. Confira o Sentido em que você vai percorrê-lo e o que “Acesso a cavalo” diz ao longo dele.',
  'help.guide.tour-horse-plan.tip.5':
    'Nada em uma cavalgada é roteado: clicar na linha desenhada não adiciona ponto de forma, e os pontos nas pontas de uma seção ficam onde a rota os coloca.',
  'help.guide.tour-horse-gap.tip.1':
    'Nenhum roteador nem rota equestre verificou uma seção manual. Olhe o mapa para ver por onde ela realmente passa.',
  'help.guide.tour-horse-recorded.step.4':
    'A cavalgada abre na coluna da esquerda. O cartão “Passeio gravado” mostra “Como gravado”, “Sem tempo a cavalo” e “Acesso não verificado”. Aponte para um selo para ver o motivo.',
  'help.guide.dateless-trip.step.2':
    'Deixe “Data de início” e “Data de término” em branco. Abaixo delas aparece o campo “Número de dias”: informe para quantos dias você quer planejar.',
  'help.guide.trip-reminder.tip.1':
    'Só o proprietário da viagem (ou um administrador) vê o bloco Lembrete. Se ele estiver em cinza, um administrador precisa antes ativar os lembretes de viagem, em Administrador, Notificações.',
  'help.guide.upcoming-reservations.step.2': 'Clique em uma reserva para abrir a viagem a que ela pertence.',
  'help.guide.timezones-widget.tip.1':
    'A lista usa os nomes oficiais dos fusos horários, como Europe/Lisbon ou America/New_York, então pesquise pela cidade que aparece no nome.',
  'help.guide.half-company-holiday.step.2': 'Ative “Meio dia” na mesma barra de ferramentas.',
  'help.guide.edit-holiday-calendar.tip.1': 'Cada alteração é salva na hora. Não existe botão Salvar.',
  'help.guide.person-color.tip.1': 'A mesma cor identifica a pessoa na barra de ferramentas e no cartão Direito.',
  'help.guide.answer-fusion-request.step.2':
    'Leia o que significa a fusão: um calendário compartilhado, lançamentos que vocês podem editar um para o outro e configurações de férias compartilhadas.',
  'help.guide.log-for-partner.step.2':
    'Confira a barra de ferramentas: o primeiro botão agora mostra o nome e a cor da pessoa.',
  'help.guide.dissolve-fusion.step.2': 'Em “Encerrar fusão”, na parte de baixo, clique em Encerrar.',
  'help.guide.country-places.step.3':
    'A janela lista todos os lugares contados para o país, agrupados por viagem; com mais de seis, “Buscar lugares”, no topo, filtra a lista. Clique em um lugar ou no título de uma viagem para abrir essa viagem no planejador.',
  'help.guide.tour-activity-stats.step.5':
    'Clique em “Ver passeios”. “Meus passeios realizados” abre com os totais, a divisão “Por tipo” e todos os passeios do período, com dia, viagem, distância e subida. As pílulas do cabeçalho também mudam o período e o tipo aqui.',
  'help.guide.move-to-list.step.3':
    'Escolha a lista de destino. Com mais de três listas, uma caixa de busca no topo ajuda a encontrá-la.',
  'help.guide.accept-list-invite.goal': 'Entre em uma lista que alguém compartilhou com você ou recuse o convite.',
  'help.guide.tour-collection-add-to-trip.step.4':
    'Se quiser, mude “Nome na viagem” e clique em “Adicionar a uma viagem”.',
  'help.guide.tour-collection-manage.step.2':
    'Digite em “Buscar lugares”. A busca filtra os passeios pelo nome, junto com os lugares.',
  'help.guide.create-journey.tip.3':
    'Quando uma viagem acabou de terminar, “Criar jornada” no banner “A viagem acabou de terminar”, no topo, cria uma jornada com essa viagem já selecionada.',
  'help.guide.entry-draft.step.2': 'Clique em Salvar. O cartão agora mostra o selo Rascunho.',
  'help.guide.gallery-map.step.3':
    'De volta à “Linha do tempo”, o mapa à direita acompanha a rolagem: a entrada visível ganha um anel na cor do dia. Clique em um alfinete para rolar a linha do tempo até a entrada dele.',
  'help.guide.journey-map-layers.tip.1':
    'Uma linha colorida tracejada é a rota GPX de uma viagem, parte do plano; uma linha contínua é uma rota gravada naquele dia.',
  'help.guide.journey-keep-route.tip.1':
    'Onde a gravação para, a linha também para. O TREK desenha só o que foi gravado.',
  'help.guide.journey-day-stays.tip.1':
    'A linha só aparece para quem pode editar o diário e tem o próprio Dawarich conectado, e só nos dias em que ainda há algo para decidir.',
  'help.guide.journey-take-over-day.step.4':
    'Deixe “Salvar também a rota do dia” ativado para manter a rota também e clique no botão Trazer. Ele mostra quantos rascunhos vai criar.',
  'help.guide.journey-auto-prepare.step.3':
    'A linha abaixo informa quando suas estadias foram buscadas pela última vez ou por que não deu certo. Clique em “Buscar agora” para consultar o Dawarich na hora.',
  'help.guide.photo-location.tip.1': 'Lugares que você mesmo definiu nunca são alterados.',
  'help.ctx.settings-plugins.bullet.1':
    '“Configurações de plugins”: logo abaixo, um cartão para cada plugin que precisa de informações suas, com os campos e Salvar. Um campo secreto nunca é exibido de novo depois de salvo.',
  'help.guide.dashboard-widgets.step.3':
    '“Restaurar padrões”, abaixo dos cartões, volta a aba Aparência inteira às configurações originais.',
  'help.guide.web-push-device.result':
    'O cartão mostra “Ativado neste dispositivo”, e os eventos ativados em Push chegam mesmo com o TREK fechado.',
  'help.guide.connect-airtrail.step.1':
    'Em Integrações, procure o AirTrail e informe a “URL da instância” e uma chave de API. A chave é criada no AirTrail, em Settings, Security.',
  'help.guide.connect-dawarich.step.1':
    'Em Integrações, procure o Dawarich e informe o “Endereço da instância” e a chave de API, que fica no Dawarich em Account, API key.',
  'help.guide.tour-connect-wanderer.step.1':
    'Em Integrações, procure o wanderer e informe a “URL da instância” e um token de API. O token é criado no wanderer, em Settings, Account, API tokens; ele começa com wanderer_key_.',
  'help.guide.tour-wanderer-watch.goal':
    'Deixe o TREK verificar, em segundo plano, se as trilhas que você importou mudaram.',
  'help.guide.mcp-oauth.tip.3':
    'Os “Tokens de API” ainda funcionam, mas estão marcados como Obsoleto; passe a usar um cliente OAuth.',
  'help.guide.offline-conflicts.tip.2': 'A escolha vale só para este dispositivo.',
  'help.guide.default-user-settings.tip.1':
    'A escolha do próprio usuário em Configurações sempre tem prioridade; estes valores valem para quem não mudou a configuração.',
  'help.guide.own-routing-engine.step.1':
    'Em Mapa, na aba “Padrões do usuário”, informe o endereço do seu servidor OSRM em “Servidor de rotas próprio”.',
  'help.guide.admin-passkeys.tip.2':
    'Se você mudar o domínio depois, todas as passkeys que as pessoas já adicionaram deixam de funcionar.',
  'help.guide.instance-keys.tip.4':
    'A chave do Amap precisa ser do tipo Web 服务 (serviço web), não uma chave de JS API.',
  'help.guide.rotate-jwt-secret.step.2': 'Leia o aviso e clique em “Rotacionar e sair”.',
  'help.guide.notification-defaults.tip.2': 'Um padrão só vale para quem não alterou aquela célula por conta própria.',
  'help.ctx.notifications.bullet.5':
    'Em Configurações, na seção Notificações, você escolhe quais eventos recebe aqui e quais recebe por e-mail, webhook, ntfy ou push.',
  'help.guide.read-notifications.result':
    'Você está na tela de que a notificação tratava, e o número no sino diminui em um.',
  'help.guide.mark-notifications-read.title': 'Marcar notificações como lidas',
  'help.guide.delete-notifications.goal': 'Mantenha a lista enxuta removendo o que você não precisa mais.',
  'help.guide.notification-settings.step.1': 'Clique no seu nome no canto superior direito.',
  'help.guide.public-link.step.5': 'Você pode mudar as opções enquanto o link existir. “Excluir link” desativa o link.',
  'help.guide.link-journal.step.3':
    'Para cada pessoa da viagem, escolha “Sem acesso”, Ler ou Editar. “Todos podem ler” e Ninguém definem todos de uma vez.',
  'help.guide.collapse-columns.tip.3': 'Com o divisor em foco, você também pode movê-lo com as setas do teclado.',
  'help.guide.edit-place.tip.3':
    'Se você clicar fora da janela, suas alterações não se perdem: o TREK pergunta antes “Descartar suas alterações?”, e “Continuar editando” leva você de volta ao formulário.',
  'help.guide.dawarich-stays.goal':
    'Adicione os lugares onde o Dawarich registrou suas estadias durante a viagem, depois de conferir cada um.',
  'help.guide.leave-stop-off-route.step.1':
    'Clique com o botão direito na parada, ou nos três pontos dela, e escolha “Tirar da rota”.',
  'help.guide.move-booking-day.step.3':
    'A linha agora aparece no novo dia, no horário dela. Abra a reserva se também precisar mudar o horário.',
  'help.guide.place-image-from-file.goal':
    'Use como imagem do lugar uma foto que já está nos arquivos dele, sem precisar enviá-la de novo.',
  'help.guide.place-image-from-file.tip.3': 'Só os viajantes que podem alterar lugares podem trocar a imagem.',
  'help.guide.place-own-hours.result':
    'O cartão mostra o seu telefone, o seu e-mail e o seu horário de funcionamento, e o anel em volta da imagem fica verde ou vermelho conforme esse horário.',
  'help.guide.confirm-stay-booking.step.4':
    'Feche a reserva com o X no canto superior direito. Em Reserva, o cartão da estadia agora mostra Confirmada.',
  'help.guide.tour-map-lines.title': 'Encontrar seus passeios no mapa',
  'help.guide.tour-map-lines.tip.2':
    'Ocultar um passeio afeta só você e fica salvo neste navegador para esta viagem: o passeio, os dias e a cor dele continuam iguais para todos. “Mostrar todos”, acima da lista de Passeios, volta a exibir todos os passeios ocultos, e o mapa no celular sempre mostra todos.',
  'help.guide.car-stops.step.4':
    'Em “Paradas pelo caminho”, clique em “Adicionar parada” para cada lugar por onde o percurso passa e escolha o lugar, com um horário ao lado se quiser. Uma parada sem lugar escolhido é removida quando você salva.',
  'help.guide.transport-details.step.2':
    'As pílulas do cabeçalho mostram o status, o tipo, o dia e o “Código da reserva”. Clique na pílula de status para alternar entre Pendente e Confirmada. O pequeno ícone de cópia na pílula do código, “Copiar código da reserva”, copia o código para a área de transferência.',
  'help.guide.group-sort-bookings.step.3':
    'Em “Ordenar por”, escolha Data, Título, Tipo ou Status. A fileira abaixo inverte a ordem: “Mais cedo primeiro” ou “Mais tarde primeiro” para datas, “A a Z” ou “Z a A” para os demais.',
  'help.guide.booking-on-map.title': 'Encontrar uma reserva no mapa',
  'help.guide.export-bookings-csv.tip.1':
    'As colunas são Tipo, Título, Status, Início, Fim, De, Para, Localização, Confirmação e Notas.',
  'help.guide.arrange-packing-list.tip.1':
    'Com “A a Z” ativado, não dá para arrastar itens, mas ainda dá para arrastar listas inteiras.',
  'help.guide.count-packed-pieces.step.3':
    'Enquanto só parte das peças estiver embalada, o contador fica na sua cor de destaque e a caixa de seleção ganha um contorno nessa cor. Clique no menos para tirar uma peça da contagem.',
  'help.guide.expense-receipts.step.5':
    'A prévia mostra o comprovante, com “Abrir em nova aba” e Baixar no topo. Com vários comprovantes, as setas do teclado passam de um para outro, e Esc fecha a prévia.',
  'help.guide.files-sync-settings.step.3':
    'Clique em Configurações, abaixo da barra de fluxo, para ver as demais opções.',
  'help.guide.manage-notes.step.3':
    'Fixar, no mesmo menu, mantém a nota no topo do painel, com uma moldura na cor da categoria e um alfinete ao lado do título. Desafixar, no mesmo menu, devolve a nota à posição normal.',
  'help.guide.note-categories.step.1':
    'Clique na engrenagem ao lado de “Nova nota”, no cabeçalho do cartão Notas. “Gerenciar categorias” abre com uma linha para cada categoria: a cor, o nome, seis pontos de cor e uma lixeira.',
  'help.guide.note-categories.tip.2':
    'Uma categoria sem notas fica guardada só no seu navegador. Os outros membros passam a vê-la quando alguma nota é colocada nela.',
  'help.guide.roadtrip-reorder.goal': 'Mude a ordem do percurso ou passe uma parada para outro dia, direto no trilho.',
  'help.guide.roadtrip-overnight.step.4':
    '“Encontrar hospedagem”, ao lado, mostra o nome para copiar e links para sites de reserva: trivago ou CHECK24 para hotel, PiNCAMP ou Pitchup para camping. Confira o lugar, as datas e os hóspedes no site.',
  'help.guide.roadtrip-stop-fill.step.2':
    'Em “Abastece até”, escolha de 50 a 100. A linha abaixo dos botões mostra até onde você consegue dirigir a partir daqui com isso.',
  'help.guide.roadtrip-bookings.step.2':
    'No trilho, o trajeto é um cartão na cor do tipo, com os horários na coluna de chegada e os pontos de partida e chegada abaixo do título.',
  'help.guide.roadtrip-google-import.tip.1':
    'O TREK calcula a própria rota entre as paradas; ele não copia o trajeto do Google.',
  'help.guide.roadtrip-hazards.result': 'O mapa mostra os alertas atuais na região da sua viagem, e a rota não muda.',
  'help.ctx.trip-tours.bullet.3':
    'Uma linha: a barra colorida é a linha do passeio no mapa, o bloco redondo mostra o limite de rota (T1 a T6) ou o tipo, um pequeno selo GPX ou wanderer indica uma importação, e os selos mostram os dias, o tempo, a distância e a subida. Uma lua com um número indica quantas etapas tem um passeio de vários dias.',
  'help.guide.tour-show-list.step.3': 'Clique em uma linha. O cartão do passeio abre sobre o mapa.',
  'help.guide.tour-add-to-day.goal':
    'Planeje quando você vai fazer um passeio, para que ele apareça no dia com a linha dele no mapa.',
  'help.guide.tour-add-to-day.tip.3':
    'Um passeio só pode entrar uma vez em cada dia. Se você o soltar em um dia que já o tem, o TREK apenas avisa “Este passeio já está nesse dia.”',
  'help.guide.tour-day-times.step.4':
    'Se o passeio terminar depois do início do próximo item do dia, um aviso abaixo da linha informa isso, por exemplo: Termina às 13:30, depois do início de Almoço no Gostner Schwaige às 12:30. Nada é movido.',
  'help.guide.tour-remove-from-day.step.1':
    'Na coluna de dias, aponte para a linha do passeio, clique em “Mais opções” e escolha “Remover do dia”.',
  'help.guide.tour-filter-list.step.1':
    'Clique no botão de filtro abaixo de “Importar GPX ou KML”. Ele mostra o status usado no filtro, de início Todos, com o número de passeios ao lado.',
  'help.guide.tour-hide-on-map.title': 'Ocultar a linha de um passeio no mapa',
  'help.guide.tour-import-plan-tab.title': 'Importar um traçado pela aba Planejado',
  'help.ctx.trip-tour-detail.title': 'Detalhes do passeio',
  'help.guide.tour-detail-read.goal':
    'Veja todas as informações da viagem sobre um passeio: os dias, a distância e as altitudes, o perfil e a origem.',
  'help.guide.tour-detail-read.tip.1':
    'Uma pílula âmbar “use com cautela” significa que a importação tem altitudes ou medidas incompletas. Leve isso em conta ao ler a subida e o perfil.',
  'help.guide.tour-rename-colour.step.1':
    'Abra o cartão do passeio e clique no lápis ao lado do nome. O nome vira um campo editável.',
  'help.guide.tour-take-along.goal':
    'Veja como chegar ao início de um passeio, abra a página dele na web ou baixe a rota como arquivo GPX.',
  'help.guide.tour-take-along.result':
    'Você tem o caminho até o início no seu app de mapas e a rota inteira em um arquivo GPX.',
  'help.guide.tour-copy-keep.tip.2':
    '“Salvar na Coleção”, no menu de um passeio no plano do dia, abre esta mesma janela, então a rota também é salva ali.',
  'help.guide.tour-packing-link.step.3': 'Clique em Vincular.',
  'help.guide.tour-files.goal':
    'Adicione ao passeio uma reserva, um mapa ou uma descrição da rota e abra o arquivo de novo pelo cartão do passeio.',
  'help.guide.tour-activity-link.goal': 'Vincule um traçado GPX gravado a um passeio planejado sem alterar o plano.',
  'help.guide.tour-activity-link.tip.3':
    '“Tempo gasto” vai do primeiro ao último registro de horário do traçado, com as pausas incluídas.',
  'help.guide.tour-activity-compare.tip.1':
    '“Comparar no mapa” só está disponível quando o cartão aparece ao lado do mapa, não no celular.',
  'help.guide.tour-origin-check.tip.1':
    'Um passeio trazido de outra viagem mostra essa viagem e o passeio em “Trazido de”.',
  'help.ctx.trip-tour-planner.bullet.3':
    '“Passeios desta viagem”, o painel da direita, lista todos os passeios, com o filtro e “Totais da viagem” acima da lista. Com um passeio aberto, o “Resumo do passeio”, no topo, mostra a distância, a subida, o tempo e o perfil de altitude dele. O mais no topo, “Adicionar passeio”, planeja, importa ou traz um passeio.',
  'help.guide.tour-open-workspace.step.3':
    'O painel da direita, “Passeios desta viagem”, lista todos os passeios da viagem, com o filtro e “Totais da viagem” acima da lista.',
  'help.guide.tour-open-workspace.result':
    'A aba Passeios: o editor à esquerda, os passeios da viagem à direita e o mapa no meio.',
  'help.guide.tour-draw-route.step.6':
    'Em “Pontos de caminho”, cada ponto ganha uma linha com o número dele, que recebe o nome do lugar assim que ele carrega. Enquanto o TREK trabalha, um pontinho ao lado de “Novo passeio” mostra o status.',
  'help.guide.tour-type-profile.step.1':
    'Clique em “Tipo de passeio”, abaixo de “Nome do passeio”. Ali aparece o tipo atual, com uma linha explicando como ele é planejado.',
  'help.guide.tour-edit-points.goal': 'Mude o trajeto do passeio movendo os pontos no mapa ou na lista.',
  'help.guide.tour-edit-points.tip.2':
    'A linha mostra as coordenadas até o nome do lugar carregar. Desfazer e Refazer não têm atalho de teclado.',
  'help.guide.tour-shaping-points.tip.1': 'O início e o fim são sempre paradas.',
  'help.guide.tour-loop-reverse.step.3':
    'Clique em “Inverter o sentido”, ao lado, para fazer o passeio inteiro no sentido oposto.',
  'help.guide.tour-leg-by-hand.step.2':
    'O trecho vira uma reta tracejada, e abaixo da linha a lista mostra “Desenhado à mão, sem rota”, com o comprimento dele.',
  'help.guide.tour-trip-places.step.1':
    'Clique em “Locais da viagem”, ao lado de “Adicionar ponto”, em “Pontos de caminho”. Os lugares da viagem aparecem logo abaixo.',
  'help.guide.tour-details-times.title': 'Dar nome ao passeio e planejar o tempo',
  'help.guide.tour-details-times.tip.3':
    'Clique na seta ao lado de Detalhes para recolher a seção. Ela abre sozinha quando algum campo tem um valor que Salvar não aceita.',
  'help.guide.tour-save.tip.1':
    'Descartar, ao lado de Salvar, descarta as alterações não salvas depois de uma confirmação. Isso não muda um passeio já salvo.',
  'help.guide.tour-edit-saved.step.3':
    'Clique em Salvar. Aparece “Passeio salvo”, e o passeio mantém os dias, os arquivos e as notas.',
  'help.guide.tour-summary-profile.step.1':
    'O “Resumo do passeio”, no topo de “Passeios desta viagem”, mostra a Distância, o “Ganho de elevação” e a “Perda de elevação” do passeio no editor, o tempo estimado, as pausas e o total planejado.',
  'help.guide.tour-list-manage.title': 'Gerenciar os passeios da viagem',
  'help.guide.tour-list-manage.tip.2':
    'Um dia que já tem o passeio aparece em cinza no menu de dias. Em um passeio de vários dias, o TREK pergunta se as etapas começam nesse dia ou se o passeio inteiro vai para esse dia.',
  'help.guide.tour-delete.tip.2': 'Para apenas tirá-lo de um dia, use “Remover do dia” no menu do dia.',
  'help.guide.tour-saved-elsewhere.step.4':
    'Escolha “Salvar como novo passeio” para manter os dois, “Carregar a mais nova” para carregar a outra versão ou Sobrescrever para substituir a outra versão pela sua.',
  'help.ctx.trip-tour-import.bullet.3':
    'Uma importação abre como “Passeio GPX” ou “Passeio do wanderer”: a linha, o “Resumo do passeio” e o perfil de altitude, exatamente como foram importados. A linha dela na lista tem o selo “Importação GPX”.',
  'help.guide.tour-import-gpx.step.4':
    'Em “Importar como”, confira o que são os traçados. Trilha vem selecionado. “Passeio de bicicleta” e Corrida pedem o perfil, “Passeio de remo” pede o barco e a água, e “Esqui e inverno”, a modalidade.',
  'help.guide.tour-view-import.title': 'Ver um traçado importado',
  'help.guide.tour-view-import.result':
    'Você vê o traçado gravado exatamente como foi importado, sem nada recalculado.',
  'help.guide.tour-plan-from-import.tip.2':
    'Quando o cartão avisa que a sugestão se afasta do traçado em trechos mais longos, confira essas partes no mapa antes de planejar com ela.',
  'help.guide.tour-restore-recorded.step.3':
    'Confirme com “Restaurar traçado gravado”. Os pontos de caminho e a linha calculada são removidos, e os dias e as notas continuam.',
  'help.guide.tour-take-over.step.3':
    'Encontre o passeio: digite em “Pesquisar por nome” ou filtre a lista com os filtros Viagem e Tipo.',
  'help.guide.tour-import-wanderer.title': 'Importar uma trilha do wanderer',
  'help.guide.tour-import-wanderer.tip.3':
    'Uma trilha que já está na viagem aparece marcada como “Nesta viagem” e oferece “Abrir o passeio”. Uma trilha que mudou desde a importação oferece “Importar como nova versão” ao lado da antiga.',
  'help.ctx.trip-tour-map.bullet.4':
    '“Ao longo do passeio”, um cartão no painel da esquerda, procura mirantes, água, refúgios, comida e outros pontos perto da rota e lista os resultados. Você pode adicionar um lugar da lista ao passeio como parada.',
  'help.guide.tour-map-layers.tip.1':
    'O mapa que você escolhe vale para todos os passeios que abrir até recarregar a página. Um passeio cujo tipo não oferece esse mapa abre em Mapa, e o mapa da aba Planejado e a configuração em Configurações não mudam.',
  'help.guide.tour-along-search.step.4':
    'Clique em “Buscar ao longo do passeio”. O TREK só pesquisa: o passeio não muda.',
  'help.guide.tour-along-add-stop.step.1':
    'Clique em um lugar da lista “Ao longo do passeio” ou no alfinete dele no mapa. O cartão abre sobre o mapa: o que é, a que distância fica da rota e em que ponto do passeio está.',
  'help.guide.tour-3d-terrain.title': 'Ver um passeio em 3D',
  'help.guide.tour-3d-terrain.tip.1':
    '“Visão geral”, na mesma fileira, volta a mostrar a rota inteira depois que você move a visualização.',
  'help.guide.tour-3d-flyover.step.4': 'Clique em “Visão geral” para ver o passeio inteiro de novo.',
  'help.guide.tour-map-overlays.step.2':
    'Clique em “Legenda das pistas”, o pequeno quadrado de pontos coloridos ao lado do interruptor.',
  'help.ctx.trip-tour-stages.summary':
    'Um passeio de vários dias é uma rota dividida em etapas, uma para cada dia de deslocamento. Aqui você define onde termina cada dia, vê as medidas de cada etapa e coloca as etapas nos dias da viagem.',
  'help.guide.tour-multi-day.step.1': 'Em “Passeios desta viagem”, clique no passeio para abri-lo no editor.',
  'help.guide.tour-multi-day.tip.3':
    'O tempo de uma etapa não inclui as pausas. Um tempo na cor de alerta, “Mais de um dia em movimento”, passa de um dia.',
  'help.guide.tour-stages-on-days.step.4':
    'Clique no botão com a lua e o número de etapas, “Mostrar etapas”, para exibi-las.',
  'help.ctx.trip-tour-hike.title': 'Caminhadas e corridas',
  'help.guide.tour-hike-plan.title': 'Planejar uma caminhada dentro da dificuldade que você definir',
  'help.guide.tour-hike-plan.result':
    'A caminhada aparece em “Passeios desta viagem” com distância, subida e tempo de caminhada, pronta para ser colocada em um dia.',
  'help.guide.tour-hike-trail-details.step.2':
    'Escolha o que mostrar: SAC para o grau de dificuldade da trilha, Piso ou “Tipo de via”. A rota no mapa usa as mesmas cores da lista.',
  'help.guide.tour-hike-round.title': 'Encontrar uma caminhada circular com a extensão que você quer',
  'help.guide.tour-hike-round.tip.1':
    'Os circuitos respeitam a “Dificuldade máxima da trilha” da caminhada; a pílula T no cartão mostra qual é.',
  'help.guide.tour-hike-compare-ways.step.4':
    'Clique em “Usar este caminho”. O TREK confere com o roteador se a rota realmente passa por ele.',
  'help.guide.tour-ferrata-add.step.2':
    'Clique em uma via ferrata no mapa, na linha tracejada ou na placa dela. O cartão mostra o nome, o grau e a extensão.',
  'help.guide.tour-ferrata-add.tip.4':
    '“Ver no OpenStreetMap”, no cartão, abre os dados da própria via ferrata. O selo fica âmbar quando nada consegue carregar, com o motivo na dica.',
  'help.guide.tour-run-plan.result':
    'A corrida aparece em “Passeios desta viagem” com o “Tempo de corrida (planejado)”, e o perfil e o ritmo ficam salvos com ela.',
  'help.guide.tour-run-ways.step.2':
    'O topo do cartão agora mostra quanto da corrida é sem pavimento e qual é o caminho de grau mais difícil.',
  'help.ctx.trip-tour-walk.bullet.2':
    '“Pontos de caminho” lista as paradas em ordem. Um anel em volta do número de uma parada a marca como Imperdível (contínuo) ou Opcional (tracejado), um pequeno escudo a marca como Protegida, e uma pílula abaixo do nome mostra quanto tempo você fica.',
  'help.guide.tour-walk-plan.step.3':
    'Aponte para uma parada em “Pontos de caminho”, clique em “Mais ações” ao lado dela e escolha “Editar parada”.',
  'help.guide.tour-walk-sights.title': 'Adicionar atrações a uma caminhada urbana',
  'help.guide.tour-walk-sights.tip.2':
    'Depois que você muda a rota, o botão passa a mostrar “Buscar novamente”, porque os lugares encontrados eram da rota antiga.',
  'help.guide.tour-walk-day-times.step.4':
    'Abaixo de cada parada você vê quando chega e quanto tempo fica. Um aviso aparece quando um lugar está fechado nesse horário ou fecha durante a visita.',
  'help.guide.tour-walk-google-import.step.1':
    'Em “Passeios desta viagem”, clique em “Adicionar passeio” (o + no topo) e escolha “Importar passeio do Google Maps”.',
  'help.guide.tour-walk-check-off.title': 'Marcar as paradas de uma caminhada no dia',
  'help.guide.tour-walk-check-off.tip.3':
    'Se você colocar uma caminhada em um dia estando offline, poderá marcá-la depois que ela sincronizar.',
  'help.guide.tour-bike-profile.title': 'Planejar um passeio de bicicleta para o seu estilo de pedalada',
  'help.guide.tour-bike-profile.result':
    'O passeio de bicicleta fica salvo e aparece em “Passeios desta viagem”, com a rota calculada para o perfil e o tempo de pedalada no “Resumo do passeio”.',
  'help.guide.tour-bike-surfaces.step.1':
    'Em “Passeios desta viagem”, à direita, clique em um passeio de bicicleta para abri-lo. Depois que a rota é calculada, o cartão “Piso e vias” aparece abaixo de “Pontos de caminho”.',
  'help.guide.tour-bike-surfaces.tip.4':
    'Clique no título do cartão para recolhê-lo. Ele continua recolhido neste navegador mesmo depois de recarregar.',
  'help.guide.tour-bike-mtb-grades.tip.2':
    'Onde os mapeadores classificaram as subidas, “Grau de subida (mtb:scale:uphill)” aparece logo abaixo, com linhas próprias.',
  'help.ctx.trip-tour-ski.bullet.4':
    'O cartão “Rota pelas pistas”, abaixo dos pontos de caminho, divide o dia em Esquiando, “Em teleféricos”, Aguardando e “A pé”, com a extensão das pistas, o desnível que você desce nelas e as viagens de teleférico. “Tempo de esqui”, no “Resumo do passeio” à direita, soma tudo quando todos os trechos estiverem planejados.',
  'help.guide.tour-ski-plan.step.5':
    'Abaixo de cada ponto, o trecho dele aparece como chips: cada pista, teleférico e trecho a pé pelo nome ou pelo tipo, as pistas com um ponto na cor do grau, e os minutos de cada um.',
  'help.guide.tour-ski-options.goal':
    'Defina as pistas mais difíceis, o que preferir, o seu ritmo e quais teleféricos usar, para que os trechos combinem com você.',
  'help.guide.tour-ski-options.tip.3':
    '“Evitar ligações supostas” mantém a rota fora de conexões que os dados do mapa apenas supõem, como um trecho não mapeado entre duas pistas.',
  'help.guide.tour-ski-fix-leg.tip.2':
    'Enquanto os dados de pistas de uma área ainda estão sendo baixados, o planejador espera e tenta de novo automaticamente.',
  'help.guide.tour-ski-summary.step.3':
    'No “Resumo do passeio”, à direita, “Tempo de esqui” soma tudo. O pontinho de informação explica como ele é calculado.',
  'help.guide.tour-ski-pistes-layer.step.1':
    'Com um passeio de “Esqui e inverno” aberto, o mapa mostra as pistas automaticamente. O interruptor da montanha nevada, na fileira do canto inferior esquerdo do mapa, as desliga e liga; a dica dele diz “Pistas, trilhas de esqui de fundo e teleféricos”.',
  'help.guide.tour-ski-import.goal':
    'Importe um traçado gravado de esqui, esqui de fundo ou raquetes de neve e dê a ele a modalidade certa.',
  'help.guide.tour-ski-import.tip.2':
    'Para editá-lo como um passeio planejado, use “Planejar uma versão editável” no cartão “Versão editável”. Os pontos são ligados por linhas retas.',
  'help.ctx.trip-tour-paddle.bullet.4':
    '“Estimativa de tempo” soma o tempo na água, carregando o barco, saindo e voltando para a água, nas eclusas e nas pausas, com base em velocidades e minutos que você pode alterar.',
  'help.guide.tour-paddle-setup.step.4':
    'Em Água, escolha Rio ou Lago. Você só consegue salvar o passeio depois de escolher o barco e o tipo de água.',
  'help.guide.tour-paddle-setup.result':
    'Um novo passeio de remo com barco, água e velocidade definidos, pronto para o primeiro ponto no mapa.',
  'help.guide.tour-paddle-water-route.tip.1':
    'Onde faltam dados de água, o TREK os baixa automaticamente para a região ou pede a um administrador, conforme a configuração da instância. O trecho então mostra “Carregando os dados de água” e é planejado automaticamente assim que os dados chegam, geralmente em um a três minutos.',
  'help.guide.tour-paddle-portage.step.2':
    'Escolha “Carregar o barco a partir daqui”. O trecho até o próximo ponto vira um transbordo, desenhado em terra.',
  'help.guide.tour-paddle-lock.title': 'Adicionar uma eclusa e o tempo de espera',
  'help.guide.tour-paddle-lock.tip.3': '“Remover a eclusa” fica no fim do cartão aberto e em “Mais ações”.',
  'help.guide.tour-paddle-time.step.5':
    'Enquanto alguma eclusa estiver sem os tempos, a estimativa mostra Incompleta, e uma nota abaixo das linhas lista o que falta.',
  'help.guide.tour-paddle-wind.step.2':
    'Confira a direção do vento, o Médio e as Rajadas. Médio é a maior média horária do dia; Rajadas, a rajada mais forte.',
  'help.guide.tour-paddle-checklist.title': 'Revisar a lista de obstáculos',
  'help.guide.tour-paddle-checklist.tip.2':
    '“Fazer transbordo” não planeja um transbordo automaticamente. Clique em “Planejar o transbordo” para configurá-lo no mapa.',
  'help.guide.tour-paddle-track-marks.step.2':
    'Na “Prévia da importação”, defina “Importar como” para “Passeio de remo” e escolha o Barco e a Água. A importação só continua depois que você escolher os dois.',
  'help.guide.tour-paddle-track-marks.tip.3':
    'Em um traçado gravado, a linha Água da “Estimativa de tempo” tem velocidade própria: clique nela e digite a velocidade com que você remou.',
  'help.ctx.trip-tour-horse.bullet.5':
    'Uma cavalgada importada de um arquivo GPX fica exatamente como foi gravada, e o cartão “Passeio gravado” mostra o que a importação não conseguiu calcular.',
  'help.guide.tour-horse-plan.step.6':
    'Clique em “Adotar trecho”. O trecho entra na cavalgada como um selo com o nome da rota no cartão “Pontos de caminho”. Adicione outros trechos do mesmo jeito.',
  'help.guide.tour-horse-gap.title': 'Cobrir uma lacuna entre rotas equestres',
  'help.guide.tour-horse-gap.tip.2':
    'Os pontos em que você clica no mapa entram na cavalgada do mesmo jeito, como trechos retos e não verificados.',
  'help.guide.tour-horse-recorded.result':
    'A cavalgada está na viagem exatamente como você a fez, com a distância e as altitudes do arquivo.',
  'help.guide.dateless-trip.step.3': 'Clique em “Criar nova viagem”.',
  'help.guide.trip-reminder.tip.2':
    'Toda viagem nova começa com um lembrete 3 dias antes da partida. Os canais desse lembrete são definidos em Configurações, Notificações.',
  'help.guide.upcoming-reservations.result':
    'A viagem abre. De volta ao painel, o widget continua mostrando o que vem a seguir.',
  'help.guide.entitlement.tip.2':
    'Em um plano fundido, cada pessoa tem a própria linha, e você também pode definir o direito das outras.',
  'help.guide.half-company-holiday.step.3': 'Clique no dia. Metade da célula fica âmbar.',
  'help.guide.school-holidays.tip.2':
    'Passe o mouse sobre um dia de férias para ver o nome delas em “Férias escolares”.',
  'help.guide.answer-fusion-request.step.3':
    'Clique em “Aceitar e fundir” para unir os planos ou em Recusar para manter seu plano separado.',
  'help.guide.log-for-partner.step.3':
    'Clique nos dias que quer registrar e depois clique de novo no seu próprio nome em Pessoas.',
  'help.guide.dissolve-fusion.result':
    'Cada um volta ao próprio plano, com os próprios lançamentos, e Pessoas lista só você.',
  'help.guide.country-places.result': 'O planejador abre na viagem a que o lugar pertence.',
  'help.guide.tour-activity-stats.step.6':
    'Para um passeio que não aconteceu, clique em Excluir, o botão redondo no fim da linha dele. O passeio continua na lista, esmaecido e marcado como “De fora”. O mesmo botão, agora “Contar de novo”, volta a contá-lo.',
  'help.guide.move-to-list.tip.1':
    'Os rótulos pertencem a uma lista só, então um lugar movido ou duplicado fica sem rótulos na nova lista.',
  'help.guide.accept-list-invite.step.1':
    'Procure o convite em Convites, no painel de listas. Se você veio pela notificação do convite, o cartão está no topo da página. Ele mostra o nome da lista e quem enviou.',
  'help.guide.tour-collection-add-to-trip.tip.1':
    'O novo passeio ainda não está em nenhum dia e não adiciona lugares. Nem a lista nem o passeio original mudam.',
  'help.guide.tour-collection-manage.step.3':
    'Clique na lixeira no fim da linha do passeio e confirme com “Tirar da coleção”.',
  'help.ctx.journey-detail.bullet.7':
    'Com o Dawarich conectado, o cabeçalho de um dia também mostra “Trazer a gravação” (ou a distância da rota salva para o dia) e “Importar dia”. Em um dia com estadias aguardando, elas aparecem agrupadas em uma linha no fim do dia.',
  'help.guide.entry-draft.tip.1':
    'Os colaboradores continuam vendo um rascunho. Só o link público o esconde até você desativar Rascunho.',
  'help.guide.journey-map-layers.tip.2':
    'Um interruptor esmaecido ainda não tem nada para mostrar, e a dica dele explica por quê. Sua escolha fica salva por jornada neste navegador.',
  'help.guide.journey-keep-route.tip.2':
    'Mais tarde, clique na distância no cabeçalho do dia para comparar de novo com o Dawarich: Substituir fica com a nova versão, e “Remover rota” tira a rota do dia da jornada.',
  'help.guide.journey-day-stays.tip.2':
    'Em um dia cheio, “Importar dia”, no fim da linha, trata todas as estadias de uma vez.',
  'help.guide.journey-take-over-day.tip.1':
    'Nada é salvo antes de você clicar nesse botão, e nada é salvo duas vezes: uma estadia que já está no diário aparece marcada e não pode ser escolhida de novo.',
  'help.guide.journey-auto-prepare.tip.1':
    'Só são preparados os dias de viagens vinculadas que têm datas, e nada é adicionado ao diário automaticamente.',
  'help.guide.photo-location.result':
    'Uma entrada sem lugar recebe o local onde foi tirada a primeira foto dela com GPS e passa a aparecer no mapa.',
  'help.guide.contributors.tip.2':
    '“Por meio de viagens” lista as pessoas que têm acesso por uma viagem vinculada. O acesso delas se muda nas configurações dessa viagem, não aqui.',
  'help.ctx.settings-plugins.bullet.2':
    'Um plugin pode adicionar Ações ao cartão dele, que são executadas depois que você confirma, e Conectar ou Desconectar quando ele faz login em outro serviço por você.',
  'help.guide.web-push-device.tip.1':
    'O push funciona por navegador: repita o processo em cada celular e computador em que quer receber notificações. “Desativar neste dispositivo” desliga só naquele dispositivo.',
  'help.guide.connect-airtrail.step.2':
    '“Permitir certificados autoassinados” é só para uma instância confiável na sua própria rede. “Gravar alterações de volta no AirTrail” vem desativado por padrão, então o TREK só lê; ative para enviar suas edições de volta.',
  'help.guide.connect-dawarich.step.2':
    '“Procurar novas estadias automaticamente” deixa o TREK verificar por conta própria. Desativado, o TREK só lê o Dawarich quando você pede. “Permitir certificado autoassinado” é só para uma instância em que o seu servidor não confia.',
  'help.guide.tour-connect-wanderer.step.2':
    'Ative “Permitir certificado autoassinado” somente para uma instância na sua própria rede.',
  'help.guide.tour-wanderer-watch.step.1':
    'No cartão do wanderer, ative “Verificar mudanças nas minhas trilhas”. Para isso, é preciso ter uma conexão salva.',
  'help.guide.plugin-settings.title': 'Configurar um plugin para você',
  'help.guide.default-user-settings.tip.2':
    '“Moeda de exibição” só converte os valores para visualização. Os valores lançados em Custos continuam como estão.',
  'help.guide.own-routing-engine.step.2':
    'Para rotas que evitam pedágios, rodovias ou balsas, informe o endereço do seu Valhalla em “Instância Valhalla própria”. Cada campo é salvo quando você sai dele; depois, reinicie o servidor do TREK e recarregue a página.',
  'help.guide.admin-passkeys.tip.3':
    'Se um usuário perdeu o dispositivo com as passkeys, remova-as com “Redefinir passkeys” em “Editar usuário”.',
  'help.guide.rotate-jwt-secret.result':
    'Um novo segredo de assinatura passa a valer, e todos os usuários, inclusive você, precisam entrar de novo.',
  'help.guide.read-notifications.title': 'Ler suas notificações',
  'help.guide.filter-notifications.title': 'Ver todas as notificações ou só as não lidas',
  'help.guide.mark-notifications-read.goal': 'Remova o destaque e o número do sino depois de ver as novidades.',
  'help.guide.delete-notifications.step.1':
    'Clique em Excluir, a lixeira ao lado da hora de uma notificação, para remover só aquela.',
  'help.guide.notification-settings.step.2': 'Clique em Configurações no menu.',
  'help.guide.public-link.tip.3': 'Passe o mouse sobre uma opção para ver o que ela oculta.',
  'help.guide.link-journal.step.4':
    'Leia a nota amarela: ela mostra quem vai receber o diário pela primeira vez. Depois, clique em “Vincular diário”.',
  'help.guide.dawarich-stays.step.1':
    'Com o Dawarich conectado em Configurações, Integrações, “Do Dawarich” aparece acima da lista de lugares. O cabeçalho mostra quando o TREK verificou pela última vez e quantas estadias estão aguardando. Clique nele para abrir a lista.',
  'help.guide.leave-stop-off-route.step.2':
    'Um selo “Fora da rota” aparece ao lado do nome. A parada continua no dia e no mapa, mas a rota do dia e os tempos dos trechos a ignoram.',
  'help.guide.move-booking-day.result': 'No plano, a reserva passa a pertencer ao novo dia, com o mesmo horário.',
  'help.guide.clear-day.tip.2': 'Esta opção do menu só aparece em dias que têm lugares.',
  'help.guide.place-image-from-file.step.1':
    'Abra um lugar que tenha uma foto entre os Arquivos. O bloco Arquivos, perto do fim do cartão, mostra quantos arquivos o lugar tem.',
  'help.guide.place-own-hours.title': 'Corrigir o horário de funcionamento, o telefone ou o e-mail de um lugar',
  'help.guide.place-own-hours.tip.1':
    'O horário que você informa substitui o que o TREK pesquisou, então um café com horário de temporada mostra o que você sabe.',
  'help.guide.day-panel.tip.3':
    'Planeja pelo calendário? Ative “Data primeiro nos títulos dos dias” em Configurações, na aba Exibição, e o cabeçalho passa a mostrar a data primeiro, com “Dia 1” ou o nome do dia embaixo.',
  'help.guide.confirm-stay-booking.result':
    'A reserva do hotel fica confirmada, tanto no cartão da estadia quanto na aba Reservas.',
  'help.guide.tour-map-lines.goal':
    'Diferencie os passeios da viagem no mapa, abra um pela linha dele e oculte os que você não precisa ver agora.',
  'help.guide.tour-map-lines.tip.3':
    '“Tirar da rota”, no menu da linha do passeio no plano do dia, faz a rota do dia deixar de ir até o início e o fim do passeio. “Colocar de volta na rota” os liga de novo.',
  'help.guide.car-stops.step.5':
    'A ordem das paradas é a rota. “Mover para cima” e “Mover para baixo”, à esquerda de uma parada, mudam essa ordem, e “Remover parada”, o X à direita, a remove.',
  'help.guide.transport-details.step.3':
    'Os blocos abaixo mostram a partida e a chegada, com estações ou aeroportos, e depois a plataforma e o assento, quando definidos. Um trajeto com paradas intermediárias as lista em Rota, e um reservado trecho a trecho lista o código de cada trecho em “Códigos por trecho”. Em seguida vêm Viajantes, Notas, Custos e Arquivos; “Mostrar nos arquivos” abre o bilhete na aba Arquivos.',
  'help.guide.export-transports-csv.title': 'Exportar os transportes como planilha',
  'help.guide.group-sort-bookings.step.4':
    'Clique no título de uma seção para recolhê-la. O número ao lado mostra quantas reservas ela tem, e um segundo clique a abre de novo.',
  'help.guide.booking-on-map.goal': 'Vá de uma reserva direto para o lugar dela no plano e no mapa.',
  'help.guide.export-bookings-csv.tip.2':
    'As colunas são separadas por ponto e vírgula, e o Excel abre o arquivo com os acentos certinhos.',
  'help.guide.arrange-packing-list.tip.2':
    'O TREK lembra o “A a Z” neste navegador, então a lista abre ordenada da próxima vez também. Isso só muda o que você vê, nunca a ordem que os outros veem.',
  'help.guide.count-packed-pieces.step.4':
    'Quando o contador chega à quantidade, o item é marcado automaticamente e conta como na mala.',
  'help.guide.expense-receipts.result':
    'O comprovante fica salvo com a despesa: o chip na linha dela o abre, e o arquivo também fica nos Arquivos da viagem.',
  'help.guide.files-sync-settings.step.4':
    'Em “Quando um documento é excluído”, escolha o que acontece com a cópia do outro lado. “Manter as duas cópias” deixa a cópia do repositório onde está. “Mover para a lixeira” manda essa cópia para a lixeira do repositório quando o documento é excluído no TREK.',
  'help.ctx.trip-collab.bullet.7':
    'Tudo aqui precisa de conexão. Offline, mensagens, notas, links, enquetes e votos não são salvos, e o TREK avisa: Isto precisa de conexão. Tente de novo quando o TREK voltar a ficar online. Membros sem permissão para editar o Colab podem ler tudo, mas não veem “Nova nota”, “Adicionar link” e “Nova enquete”, e a caixa de mensagem fica cinza.',
  'help.guide.manage-notes.step.4':
    'Editar abre a janela da nota com tudo preenchido. Altere o que precisar, aqui mais uma linha em Conteúdo, e clique em Salvar.',
  'help.guide.note-categories.step.2':
    'Digite um nome em “Nova categoria...”, no fim, e pressione Enter ou clique no mais ao lado. A nova categoria recebe a próxima cor e uma linha própria.',
  'help.guide.note-categories.tip.3':
    'No cartão, a categoria aparece só como o ponto colorido no cabeçalho. Passe o mouse sobre o ponto para ver o nome.',
  'help.guide.roadtrip-reorder.step.1':
    'Arraste uma parada pela linha dela e solte sobre outra parada do mesmo dia. Ela assume o lugar dessa parada, e a rota do dia é recalculada na nova ordem.',
  'help.guide.roadtrip-overnight.step.5':
    'Clique em Adicionar. A noite é reservada deste dia para o seguinte, e o lugar entra no percurso como pernoite desse dia.',
  'help.guide.roadtrip-stop-fill.step.3':
    'Para a parada voltar a usar a sua configuração, abra o selo de novo e clique em “Usar meu padrão”.',
  'help.guide.roadtrip-bookings.step.3':
    'A pílula Check-in ou Embarque indica até quando o percurso precisa levar você ao terminal: a partida é marcada com essa antecedência em relação ao horário oficial.',
  'help.guide.roadtrip-google-import.title': 'Importar uma rota do Google Maps',
  'help.guide.roadtrip-google-import.tip.2':
    'O link precisa ter pelo menos duas paradas que o TREK consiga localizar, e no máximo 30.',
  'help.guide.roadtrip-hazards.tip.1':
    'Alertas não são interdições: a rota nunca muda por causa deles, e eles são avisos atuais, não uma previsão para as suas datas.',
  'help.ctx.trip-tours.bullet.4':
    'Passe o mouse sobre uma linha para ver o olho (“Ocultar no mapa”) e o + redondo (“Adicionar ao dia”). Arraste uma linha até um dia na coluna da esquerda para planejá-la ali, ou clique nela para abrir o cartão do passeio sobre o mapa.',
  'help.guide.tour-show-list.step.4':
    'O cartão mostra as medidas do passeio e, em “Dias da viagem”, os dias em que ele está. Para mudar a rota em si, abra a aba Passeios e clique no passeio em “Passeios desta viagem”.',
  'help.guide.tour-add-to-day.step.1':
    'Passe o mouse sobre o passeio na lista e clique no + redondo à direita da linha (“Adicionar ao dia”).',
  'help.guide.tour-add-to-day.tip.4':
    'Com um dia aberto (clique no cabeçalho dele), o cartão do passeio também oferece “Adicionar ao dia” para esse dia. A seta de desfazer acima dos dias desfaz a atribuição.',
  'help.guide.tour-day-times.tip.1': 'Um horário de término que você informa substitui o calculado.',
  'help.guide.tour-remove-from-day.step.2':
    'O passeio continua na lista à direita. O selo Dia some, e o filtro volta a contá-lo em “Não planejados”.',
  'help.guide.tour-filter-list.step.2':
    'Em Status, escolha “Não planejados” para os passeios ainda sem dia ou Planejado para os que já estão em um dia. Cada linha mostra quantos passeios correspondem.',
  'help.guide.tour-hide-on-map.goal':
    'Oculte do mapa os passeios de que você não precisa agora, sem mudá-los para ninguém.',
  'help.guide.tour-import-plan-tab.goal': 'Importe um traçado GPX ou KML como passeio enquanto planeja os dias.',
  'help.ctx.trip-tour-detail.summary':
    'O cartão que abre sobre o mapa quando você escolhe um passeio na aba Planejado: os dias, as medidas e o perfil, a origem e os botões para enviá-lo ao celular, copiá-lo, salvá-lo em uma coleção ou vinculá-lo à lista de mala.',
  'help.guide.tour-detail-read.step.1':
    'No topo da coluna da direita, mude de Lugares para Passeios e clique em um passeio. O cartão dele abre sobre o mapa. A linha do passeio dentro de um dia, ou a linha dele no mapa, abre o mesmo cartão.',
  'help.guide.tour-detail-read.tip.2':
    'Um passeio de remo não mostra altitudes nem perfil: os pontos ficam nas margens, então as altitudes estariam erradas.',
  'help.guide.tour-rename-colour.step.2':
    'Digite o novo nome e clique no botão redondo de confirmação, ou pressione Enter. Esc mantém o nome anterior.',
  'help.guide.tour-take-along.step.1':
    'Abra o cartão do passeio. Navegação, no fim do cartão, abre o início do passeio em um app de mapas e, se houver vários, mostra a lista de apps antes. Ela leva você até o início, não ao longo da rota.',
  'help.guide.tour-copy-keep.title': 'Copiar um passeio ou guardá-lo em uma coleção',
  'help.guide.tour-copy-keep.tip.3':
    'Na aba Passeios, o marcador no topo da coluna da esquerda faz o mesmo para o passeio aberto. Se ele tiver alterações não salvas, o TREK pede que você salve o passeio antes.',
  'help.guide.tour-packing-link.step.4':
    'O cartão agora mostra a lista, quantos itens dela já estão na mala, uma barra e os primeiros itens. Os que já estão na mala aparecem riscados.',
  'help.guide.tour-files.step.1':
    'Abra o cartão do passeio e role até Arquivos, no fim. Clique em Enviar no cabeçalho da seção e escolha um ou mais arquivos.',
  'help.guide.tour-activity-link.step.1':
    'Abra o cartão do passeio planejado e role até “Trilha real”. Clique em “Adicionar trilha real”.',
  'help.guide.tour-activity-link.result':
    'O traçado fica vinculado ao passeio, e o cartão mostra o plano e o que você fez lado a lado.',
  'help.guide.tour-activity-compare.tip.2':
    'Os passeios realizados no Atlas contam o traçado vinculado em vez dos valores planejados.',
  'help.guide.tour-origin-check.tip.2':
    'Um passeio do wanderer tem uma seta ao lado da origem, “Abrir no wanderer”, e “Verificar fonte” no cabeçalho da seção. A verificação pergunta ao wanderer se a trilha mudou desde a importação. “Importar como novo instantâneo” importa então a nova versão como um passeio separado. Este passeio mantém os dias e as notas.',
  'help.ctx.trip-tour-planner.bullet.4':
    'Com “Adicionar ponto” ativado (“Marcar pontos” na pílula do mapa), um clique no mapa marca um ponto. Arraste um alfinete para movê-lo, clique na rota desenhada para adicionar um ponto de forma ali e escolha um lugar da viagem com “Locais da viagem”.',
  'help.guide.tour-open-workspace.step.4':
    'O mais no topo do painel da direita, “Adicionar passeio”, oferece “Importar GPX ou KML”, “Importar passeio do Google Maps” e “Trazer um passeio de outra viagem”. Com um passeio aberto, “Planejar novo passeio” também aparece ali.',
  'help.guide.tour-draw-route.title': 'Desenhar um novo passeio',
  'help.guide.tour-draw-route.tip.1':
    'Com “Marcar pontos” ativado, o cursor vira uma mira. Desative para arrastar o mapa sem adicionar pontos. No 3D ele começa desativado, porque ali você arrasta o mapa para olhar em volta.',
  'help.guide.tour-type-profile.step.2':
    'Escolha o tipo na lista: Trilha, “Caminhada urbana / turística”, Corrida, “Passeio de bicicleta”, “Passeio de remo”, “Passeio a cavalo” ou “Esqui e inverno”. Cada um explica o que planeja, e trocar o tipo recalcula a rota.',
  'help.guide.tour-edit-points.step.1':
    'Arraste um alfinete numerado no mapa até onde o ponto deve ficar. A rota é recalculada passando pelo novo local.',
  'help.guide.tour-edit-points.result':
    'Os pontos estão onde você quer, na ordem que você quer, e a rota foi recalculada.',
  'help.guide.tour-shaping-points.tip.2': 'Um ponto de forma não pode encerrar uma etapa de um passeio de vários dias.',
  'help.guide.tour-loop-reverse.tip.1':
    'Quando o passeio já é um circuito, “Voltar ao início” mostra “O passeio já volta ao início”.',
  'help.guide.tour-leg-by-hand.step.3':
    'Para o roteador calcular o trecho de novo, abra o mesmo menu e escolha “Rotear o próximo trecho de novo”.',
  'help.guide.tour-trip-places.step.2':
    'Pesquise nos lugares da viagem ou veja em “Perto do passeio”: os lugares a até dois quilômetros da rota, do mais próximo ao mais distante, cada um com a distância.',
  'help.guide.tour-details-times.goal':
    'Dê ao passeio um nome, uma descrição e um link, e inclua pausas no tempo dele.',
  'help.guide.tour-details-times.result': 'O passeio agora tem nome, notas e o tempo que você planejou para ele.',
  'help.guide.tour-save.tip.2':
    '“Voltar aos passeios”, no topo do painel, fecha o editor e pergunta antes se houver alterações não salvas.',
  'help.guide.tour-edit-saved.step.4':
    'Clique em “Voltar aos passeios” para fechar. Se houver alterações não salvas, o TREK pergunta antes “Descartar as alterações não salvas do passeio?”.',
  'help.guide.tour-summary-profile.step.2':
    'O pontinho de informação ao lado do tempo estimado explica como ele é calculado.',
  'help.guide.tour-list-manage.goal':
    'Veja os totais dos passeios da viagem, coloque um em um dia e filtre a lista para o que você precisa.',
  'help.guide.tour-list-manage.tip.3':
    'A lixeira em uma linha exclui o passeio. A aba Planejado lista os mesmos passeios quando a coluna da direita está em Passeios.',
  'help.guide.tour-delete.tip.3':
    'Os passeios são excluídos aqui, na aba Passeios. A lixeira só aparece para viajantes que podem editar os lugares da viagem.',
  'help.guide.tour-saved-elsewhere.tip.1':
    '“Salvar como novo passeio” dá à sua cópia o nome do passeio seguido de (minha versão).',
  'help.ctx.trip-tour-import.bullet.4':
    '“Versão editável” transforma uma importação em um passeio com pontos de caminho que você pode mover. “Substituir a importação” mantém o traçado gravado, e o cartão “Traçado gravado” no editor leva você de volta a ele.',
  'help.guide.tour-import-gpx.step.5':
    'Clique em Importar 1 passeio (ou Importar 3 passeios, para um arquivo com três traçados).',
  'help.guide.tour-view-import.goal':
    'Veja o percurso, as medidas e a altimetria de um passeio importado exatamente como chegaram.',
  'help.guide.tour-plan-from-import.title': 'Planejar um passeio editável a partir de uma importação',
  'help.guide.tour-plan-from-import.tip.3':
    'Em importações de remo ou esqui, os pontos são ligados por linhas retas em vez de terem a rota calculada.',
  'help.guide.tour-restore-recorded.tip.1':
    'O cartão só aparece em um passeio que foi substituído com “Substituir a importação” e depois salvo.',
  'help.guide.tour-take-over.step.4':
    'Clique no passeio. O lado direito mostra a linha dele, as medidas e a viagem de origem.',
  'help.guide.tour-import-wanderer.goal':
    'Importe para a viagem, como passeio, uma das trilhas do seu próprio wanderer.',
  'help.guide.tour-import-wanderer.tip.4': '“Abrir no wanderer” abre a trilha na sua instância.',
  'help.ctx.trip-tour-map.bullet.5':
    'No 3D, a rota aparece sobre o relevo, colorida pela inclinação, com uma legenda que resume os graus de inclinação e um sobrevoo que a percorre do início ao fim.',
  'help.guide.tour-map-layers.tip.2':
    'Trilhas e Bicicleta vêm de servidores mantidos por voluntários e só aparecem enquanto o administrador permitir. Quando um deles para de responder, o segmento mostra um ! e você pode trocar de mapa; o seu passeio continua como está.',
  'help.guide.tour-along-search.step.5':
    'Os lugares encontrados aparecem listados com a distância até a rota e desenhados no mapa na cor deles. Uma estrela marca os mais conhecidos, e “No passeio”, os que já são paradas. O botão agora mostra “Buscar novamente”.',
  'help.guide.tour-along-add-stop.step.2':
    '“Onde entra” sugere o trecho em que o lugar se encaixa melhor. Clique para escolher entre quais duas paradas ele entra, ou “Como novo destino”. O mapa mostra a nova rota tracejada antes de qualquer mudança.',
  'help.guide.tour-3d-terrain.goal': 'Veja o passeio sobre a paisagem real, colorido pela inclinação.',
  'help.guide.tour-3d-terrain.tip.2':
    'O mapa escolhido também é usado no 3D, assim como as vias ferratas, as pistas e a sinalização náutica. Enquanto edita um passeio, você pode arrastar os pontos sobre o relevo e, com “Marcar pontos” ativado, um clique adiciona um ponto.',
  'help.guide.tour-3d-flyover.result': 'Você viu o passeio do alto, do início ao fim, na velocidade que escolheu.',
  'help.guide.tour-map-overlays.step.3':
    'A legenda explica as cores: as pistas de descida de Iniciante a Freeride, “Trilhas de esqui de fundo”, “Trilhas de inverno e de raquetes”, “Pistas de trenó” e “Teleféricos e elevadores”. “Legenda completa no OpenSnowMap” mostra todos os símbolos. Pressione Esc para fechar.',
  'help.ctx.trip-tour-stages.bullet.1':
    'Dias, no editor, transforma o passeio aberto em “Um dia” ou “Vários dias”. Ao voltar para um dia só, todos os fins de etapa são removidos depois de uma confirmação, e a rota continua como está.',
  'help.guide.tour-multi-day.step.2':
    'Em Dias, clique em “Vários dias”. Uma nota mostra onde fica o fim da primeira etapa.',
  'help.guide.tour-multi-day.tip.4':
    'As etapas são salvas quando você clica em Salvar. Quando uma mudança remove uma etapa que está em um dia da viagem, um aviso informa que salvar a tira desse dia.',
  'help.guide.tour-stages-on-days.step.5':
    'Cada etapa mostra o dia em que está. Clique no dia para mover a etapa para outro dia, ou escolha “Sem dia” para tirá-la.',
  'help.ctx.trip-tour-hike.summary':
    'Uma caminhada ou corrida aberta na aba Passeios: o editor à esquerda, o mapa no meio, o resumo do passeio e os outros passeios da viagem à direita. A caminhada respeita a dificuldade de trilha que você permitir, a corrida é calculada pelo seu próprio ritmo, e as duas mostram o que o OpenStreetMap registra pelo caminho.',
  'help.guide.tour-hike-plan.goal':
    'Comece uma caminhada, defina as paradas, escolha o grau de trilha mais difícil que a rota pode usar e salve.',
  'help.guide.tour-hike-plan.tip.1':
    'Uma caminhada nova começa em T2 (“Caminhada em montanha”). O T3 traz um aviso de que esses caminhos podem ser expostos e exigem passo firme e nenhum medo de altura.',
  'help.guide.tour-hike-trail-details.step.3':
    'Os selos resumem: quanto da rota é Conhecido, o grau “Maior conhecido” e, à parte, o “Limite de rota” usado para planejar a caminhada.',
  'help.guide.tour-hike-round.goal':
    'Deixe o TREK sugerir circuitos com a extensão que você quer, saindo de uma parada da caminhada.',
  'help.guide.tour-hike-round.tip.2':
    'São aceitas distâncias de 1 a 60 km, e o TREK oferece circuitos com até 20 % de diferença da sua.',
  'help.guide.tour-hike-compare-ways.result':
    'Só esse trecho segue o caminho escolhido, e o resto da caminhada continua como estava. “Caminho adotado”, na parte de baixo do mapa, tem Desfazer.',
  'help.guide.tour-ferrata-add.step.3':
    'Clique em “Adicionar ao passeio”. A via ferrata entra no fim da rota como um trecho próprio, com um ponto em cada ponta.',
  'help.guide.tour-run-plan.title': 'Planejar uma corrida no seu próprio ritmo',
  'help.guide.tour-run-plan.tip.1': 'Sem um ritmo, não dá para salvar a corrida.',
  'help.guide.tour-run-ways.step.3':
    'Clique em Piso e depois em um tipo de piso na lista para mostrar só esses trechos no mapa.',
  'help.ctx.trip-tour-walk.bullet.3':
    'Quando a caminhada está em um dia com horário de início, “Horários para”, no topo de “Pontos de caminho”, mostra esse dia, e cada parada exibe a chegada, o tempo de permanência e o que diz o horário de funcionamento.',
  'help.guide.tour-walk-plan.step.4':
    'Dê à parada um Rótulo e uma “Permanência em minutos”. Deixe a permanência em branco enquanto não souber, e use 0 para um ponto por onde você só passa.',
  'help.guide.tour-walk-sights.goal':
    'Escolha um tema, pesquise ao longo da caminhada e adicione um lugar como parada.',
  'help.guide.tour-walk-sights.tip.3':
    'Horários de funcionamento e sites vêm da fonte, na maioria das vezes o OpenStreetMap. Confira antes de ir.',
  'help.guide.tour-walk-day-times.tip.1':
    'Sem horário de início, a linha avisa: Dê à caminhada um horário neste dia para ver chegadas e horários de funcionamento.',
  'help.guide.tour-walk-google-import.step.2': 'Cole o link em “Link da rota a pé” e clique em “Ler o link”.',
  'help.guide.tour-walk-check-off.goal': 'Marque as paradas visitadas ou puladas no dia e veja quanto falta caminhar.',
  'help.guide.tour-walk-check-off.result':
    'As paradas visitadas ficam marcadas, as puladas aparecem riscadas, e o tempo restante conta só o que ainda falta.',
  'help.guide.tour-bike-profile.goal':
    'Comece um passeio de bicicleta e deixe o TREK calcular a rota para cicloturismo, estrada, gravel ou MTB.',
  'help.guide.tour-bike-profile.tip.1': 'Mudar o perfil depois recalcula a rota inteira para o novo perfil.',
  'help.guide.tour-bike-surfaces.step.2':
    'O selo no cabeçalho do cartão mostra a parte da rota que com certeza não é pavimentada.',
  'help.guide.tour-bike-mtb-grades.title': 'Conferir os graus das trilhas de um passeio de mountain bike',
  'help.guide.tour-bike-mtb-grades.tip.3':
    'Se não foi possível ler os graus, o cartão avisa. Clique em “Tentar novamente”.',
  'help.ctx.trip-tour-ski.bullet.5':
    'Com um passeio de “Esqui e inverno” aberto, o mapa mostra as pistas do OpenSnowMap, com “Legenda das pistas” ao lado do interruptor. Tudo isso são dados de mapeamento: nada aqui diz se uma pista ou um teleférico está aberto, como está a neve ou qualquer coisa sobre avalanches.',
  'help.guide.tour-ski-plan.step.6': 'Dê um nome ao passeio em “Nome do passeio” e clique em Salvar.',
  'help.guide.tour-ski-options.step.1':
    'Em um passeio de “Esqui e inverno”, as opções do roteador ficam abaixo de Modalidade. Você só vê as que a sua modalidade usa: “Esqui cross-country” não tem “Pistas mais difíceis”, por exemplo.',
  'help.guide.tour-ski-options.result':
    'O passeio é recalculado dentro dos seus limites, e o cartão “Rota pelas pistas” lista as pistas mais difíceis que ele evitou.',
  'help.guide.tour-ski-fix-leg.tip.3':
    'Offline, os trechos são desenhados em linha reta por enquanto. Uma linha cinza sobre caminhos de verão é uma observação, não um erro.',
  'help.guide.tour-ski-summary.tip.1':
    'Evitadas lista as pistas mais difíceis que o roteador evitou por causa do seu limite em “Pistas mais difíceis”.',
  'help.guide.tour-ski-pistes-layer.step.2':
    'Clique em “Legenda das pistas”, o botão com quatro pontos coloridos ao lado do interruptor.',
  'help.guide.tour-ski-import.step.1':
    'Na aba Passeios, clique em “Adicionar passeio” (o mais acima de “Passeios desta viagem”), escolha “Importar GPX ou KML” e selecione o arquivo.',
  'help.guide.tour-ski-import.tip.3':
    'Você também pode soltar arquivos GPX, KML ou KMZ em qualquer parte da aba Passeios para abrir a mesma prévia.',
  'help.ctx.trip-tour-paddle.bullet.5':
    'Vento mostra a previsão no início do passeio para o dia em que ele está planejado. “Lista de verificação” lista os obstáculos da rota salva e o que você decidiu para cada um.',
  'help.guide.tour-paddle-setup.step.5':
    'Em um lago, “Nos lagos” define o trajeto: “Em linha reta” é o mais curto, e “Perto da margem” segue junto à margem para dias de vento.',
  'help.guide.tour-paddle-water-route.title': 'Planejar os trechos na água',
  'help.guide.tour-paddle-water-route.tip.2':
    'Onde a rota contorna uma barragem carregando o barco ou passa por uma eclusa, o TREK coloca ali um ponto próprio, marcado como Detectado. Se você o mover ou alterar, ele passa a ser um ponto seu.',
  'help.guide.tour-paddle-portage.step.3':
    'Um cartão Transbordo aparece abaixo do ponto, com a extensão e os minutos a mais. Clique nele para abri-lo.',
  'help.guide.tour-paddle-lock.goal': 'Coloque uma eclusa no passeio e inclua no tempo a espera e a passagem.',
  'help.guide.tour-paddle-lock.result':
    'A eclusa está no passeio com os minutos dela, e a “Estimativa de tempo” os soma.',
  'help.guide.tour-paddle-time.tip.1':
    'O TREK começa com 4 km/h na água, 2 km/h carregando o barco e 10 minutos em cada transbordo. São valores iniciais para ajustar, não medições.',
  'help.guide.tour-paddle-wind.step.3':
    'As barras mostram as horas do dia, com as rajadas atrás do vento médio. Passe o mouse sobre uma barra para ver os valores e a direção daquela hora.',
  'help.guide.tour-paddle-checklist.goal':
    'Veja o que se sabe sobre barragens, eclusas e regras de acesso em uma rota salva e decida o que fazer em cada uma.',
  'help.guide.tour-paddle-checklist.tip.3':
    'Uma entrada marcada como “Verificar de novo” foi decidida antes de a rota ou os dados mudarem. Decida de novo, ou escolha “Manter decisão” ou “Remover decisão”. As decisões que não valem mais ficam em “Decisões anteriores”.',
  'help.guide.tour-paddle-track-marks.step.3': 'Clique em Importar 1 passeio.',
  'help.guide.tour-paddle-track-marks.result':
    'O traçado gravado inclui os transbordos e as eclusas, e a “Estimativa de tempo” os considera.',
  'help.guide.tour-horse-plan.title': 'Planejar uma cavalgada por rotas equestres',
  'help.guide.tour-horse-plan.step.7':
    'Dê um nome à cavalgada em “Nome do passeio” e clique em Salvar no fim da coluna da esquerda.',
  'help.guide.tour-horse-gap.goal': 'Continue com um trecho que começa longe do fim da sua cavalgada.',
  'help.guide.tour-horse-gap.tip.3':
    'Um trecho que começa a até 25 m do fim da sua cavalgada continua direto a partir dele, e “Ligação com seu passeio” mostra “Liga-se ao fim do seu passeio”.',
  'help.guide.tour-horse-recorded.tip.1':
    'A linha fica exatamente como o arquivo a gravou. Nada é recalculado, e uma cavalgada gravada não tem versão editável.',
  'help.guide.dateless-trip.result':
    'O cartão mostra Ideia e “Sem datas definidas”, e a viagem tem tantos dias vazios quantos você pediu.',
  'help.guide.trip-reminder.title': 'Receber um lembrete antes de uma viagem',
  'help.guide.upcoming-reservations.tip.1':
    'Uma hospedagem em hotel aparece duas vezes: uma no check-in e outra no check-out.',
  'help.guide.half-company-holiday.result':
    'A empresa tem meio dia de folga, e um dia de férias registrado nessa data conta como apenas meio dia.',
  'help.guide.edit-holiday-calendar.title': 'Alterar ou remover um calendário de feriados',
  'help.guide.answer-fusion-request.result':
    'Depois de “Aceitar e fundir”, os dois planos aparecem em uma só grade, cada pessoa na própria cor.',
  'help.guide.log-for-partner.result':
    'Os dias aparecem na cor da outra pessoa e são descontados do direito dela, não do seu.',
  'help.guide.dissolve-fusion.tip.1':
    'Cancelar nessa janela deixa o plano como está; seus lançamentos são mantidos de qualquer forma.',
  'help.guide.country-places.tip.1':
    'Um lugar no país errado geralmente tem endereço ou coordenadas errados. Abra a viagem dele a partir daqui e corrija o lugar lá.',
  'help.guide.tour-activity-stats.title': 'Ver o que você fez nos seus passeios',
  'help.guide.tour-activity-stats.result':
    'As somas na janela e na aba Passeios não incluem mais o passeio que você deixou de fora. A rota, os dias e a viagem continuam como estão.',
  'help.guide.move-to-list.tip.2':
    'Mover tira os lugares da lista, então só o dono dela ou um administrador vê “Mover para lista”. “Duplicar em lista” funciona em qualquer lista que você consiga abrir.',
  'help.guide.accept-list-invite.step.2': 'Clique em Aceitar para entrar ou em Recusar para rejeitar o convite.',
  'help.guide.tour-collection-add-to-trip.tip.2':
    'Se o passeio foi guardado sem linha, os pontos de caminho precisam ser adicionados junto. A janela avisa e já seleciona essa opção para você.',
  'help.guide.tour-collection-manage.tip.1':
    'Remover um passeio da lista não altera os passeios já criados a partir dele nas suas viagens.',
  'help.guide.entry-draft.tip.2':
    'Quando você importa um dia do Dawarich, as entradas dele chegam como rascunho. Confira o selo antes de compartilhar.',
  'help.guide.journey-map-layers.result':
    'O mapa mostra só as camadas que você quer, e a legenda explica cada alfinete, ponto e linha.',
  'help.guide.journey-keep-route.result':
    'O cabeçalho do dia mostra a distância, e a rota aparece com linha contínua na camada Gravado do mapa para todos da jornada. Um link compartilhado só a mostra quando “Rotas gravadas” está ativado.',
  'help.guide.journey-day-stays.result':
    'As estadias que você já decidiu saem da linha. As entradas que você escreveu aparecem no dia delas como qualquer outra, e você pode adicionar fotos e texto normalmente.',
  'help.guide.journey-take-over-day.tip.2':
    'Rascunhos não aparecem em links compartilhados. Adicione fotos e texto e depois desative Rascunho em cada entrada.',
  'help.guide.journey-auto-prepare.tip.2':
    'Um ponto no botão de lista de um dia indica que o dia ainda não está finalizado; a dica explica por quê.',
  'help.ctx.settings-plugins.bullet.3':
    '“Atividade dos plugins”, no fim, lista cada ação que um plugin realizou em seu nome, das mais recentes para as mais antigas, com Atualizar.',
  'help.guide.language-region.tip.3':
    '“Semana começa em” define a primeira coluna de todos os seletores de data; o Férias tem a própria configuração.',
  'help.guide.web-push-device.tip.2': 'No iPhone e no iPad, primeiro adicione o TREK à Tela de Início e abra por ali.',
  'help.guide.connect-airtrail.step.3':
    'Clique em Salvar e depois em “Testar conexão”. O teste informa quantos voos encontrou, e o selo muda para Conectado.',
  'help.guide.connect-dawarich.step.3':
    'Clique em Salvar e depois em “Testar conexão”: o teste conta as estadias dos últimos 30 dias. Depois de conectado, “Procurar agora” verifica na hora, e Desconectar, à direita, encerra a conexão.',
  'help.guide.tour-connect-wanderer.step.3':
    'Clique em Salvar e depois em “Testar conexão”. O teste informa quantas das suas trilhas você pode importar, e o selo muda para Conectado.',
  'help.guide.tour-wanderer-watch.step.2':
    'No máximo uma vez por dia, o TREK lê o registro resumido de cada trilha que você importou, e a linha mostra quando foi a última verificação. Quando uma trilha pode ter mudado, você recebe uma notificação e Avisos a conta: clique em Avisos para ver cada passeio como “Pode ter mudado”, Alterado ou “Não verificável” e abri-lo dali.',
  'help.guide.plugin-settings.goal':
    'Passe a um plugin as suas próprias chaves e preferências e veja o que ele fez em seu nome.',
  'help.guide.own-routing-engine.result': 'As rotas de todas as viagens são calculadas nos seus servidores.',
  'help.guide.admin-passkeys.title': 'Oferecer login com passkey',
  'help.guide.rotate-jwt-secret.tip.1': 'Você também é desconectado, então entre de novo logo em seguida.',
  'help.guide.notification-defaults.title': 'Definir os padrões de notificação dos usuários',
  'help.ctx.notifications.title': 'Notificações',
  'help.guide.read-notifications.goal':
    'Veja o que aconteceu nas suas viagens enquanto você estava fora e abra direto.',
  'help.guide.filter-notifications.goal': 'Veja todas as suas notificações ou só as que você ainda não leu.',
  'help.guide.mark-notifications-read.step.1':
    'Clique em “Marcar como lido”, o tique duplo ao lado da hora de uma notificação, para marcar só aquela.',
  'help.guide.delete-notifications.step.2':
    '“Excluir tudo”, no topo, apaga a lista inteira de uma vez, depois de uma janela pedir confirmação.',
  'help.guide.notification-settings.step.3':
    'Clique em Notificações na barra lateral de Configurações. O primeiro cartão tem uma linha por evento, e a coluna No app define o que o sino mostra.',
  'help.guide.link-journal.result':
    'Uma aba Diário aparece na barra de abas da viagem. Todos a quem você deu Ler ou Editar podem abrir o diário nessa aba, com atualizações ao vivo.',
  'help.guide.create-place.tip.4':
    'Um link copiado do Google Maps também funciona na busca: cole, pressione Enter, e o TREK identifica o lugar pelo link. Quando o formulário já tem uma posição, “Lugares perto deste marcador”, a mira ao lado da busca, lista o que há em volta.',
  'help.guide.dawarich-stays.step.2':
    'As estadias aparecem agrupadas por dia, cada uma com a hora em que você chegou e saiu; um ícone de medidor marca as estadias sobre as quais o Dawarich não tinha certeza. Clique em “Adicionar como lugar”, o alfinete ao lado de uma estadia.',
  'help.guide.leave-stop-off-route.step.3':
    'Para incluí-la de novo na rota, abra o mesmo menu e escolha “Colocar de volta na rota”.',
  'help.guide.move-booking-day.tip.1':
    'As linhas esmaecidas nos dias intermediários de uma reserva de vários dias não podem ser arrastadas, nem um trecho isolado de um voo com escalas.',
  'help.guide.place-image-from-file.step.2':
    'Clique na imagem redonda do cabeçalho. Como o lugar tem fotos, uma pequena janela pergunta de onde a imagem deve vir.',
  'help.guide.place-own-hours.goal':
    'Coloque no cartão o horário que você realmente conferiu, quando o pesquisado estiver errado ou faltando.',
  'help.guide.place-own-hours.tip.2':
    'O telefone e o e-mail aparecem como pílulas no cabeçalho do cartão. Clique em um deles para abrir no app de telefone ou de e-mail.',
  'help.guide.edit-accommodation.tip.3':
    'Com “Ocultar códigos de reserva” ativado em Configurações, na aba Exibição, o número de confirmação fica borrado. Passe o mouse ou clique nele para ler.',
  'help.guide.confirm-stay-booking.tip.1': 'Clique de novo na pílula, e a reserva volta para Pendente.',
  'help.guide.map-markers.tip.4':
    'Com “Marcadores compactos para lugares não planejados” ativado, em Configurações > Exibição, na seção “Viagem e mapa”, os lugares que ainda não estão em nenhum dia aparecem como pontinhos, sem foto nem avaliação. O lugar escolhido sempre aparece completo.',
  'help.guide.tour-map-lines.step.1':
    'Cada passeio da viagem aparece no mapa como uma linha na cor dele, com o alfinete no ponto de partida. Se você escolheu uma cor para o passeio, a linha usa essa cor; senão, usa a cor da categoria.',
  'help.guide.car-stops.step.6': 'Clique em Adicionar.',
  'help.guide.transport-details.step.4':
    'Clique no título para renomear o trajeto sem abrir o formulário. Renomear abre com o nome preenchido: digite o novo e clique em Salvar.',
  'help.guide.export-transports-csv.goal':
    'Exporte os trajetos da viagem do TREK como arquivo CSV, para uma planilha, um agente de viagens ou para imprimir.',
  'help.guide.group-sort-bookings.result':
    'As reservas aparecem nas seções e na ordem escolhidas, e este navegador guarda a escolha para a próxima visita.',
  'help.guide.booking-on-map.step.1':
    'Clique no cartão de uma reserva que tenha um lugar, vinculado em “Local / Atividade” ou, para uma estadia, em Hospedagem. O detalhe dela abre.',
  'help.guide.export-bookings-csv.title': 'Exportar as reservas como planilha',
  'help.guide.export-bookings-csv.tip.3':
    'O botão aparece assim que a aba tem uma reserva. A aba Transportes exporta as próprias entradas do mesmo jeito.',
  'help.guide.arrange-packing-list.title': 'Organizar a lista de mala na sua ordem',
  'help.guide.count-packed-pieces.result':
    'A linha mostra quantas peças já estão na mala, e o item é marcado quando a última entra.',
  'help.guide.expense-receipts.title': 'Anexar um comprovante a uma despesa',
  'help.guide.expense-receipts.tip.1':
    'No editor, um clique no nome de um arquivo listado abre a mesma prévia. Nesse caso, Esc fecha só a prévia, não a despesa.',
  'help.guide.files-sync-settings.step.5':
    '“Quando os dois lados mudaram” define qual cópia fica quando um documento foi editado nos dois lugares: Perguntar, “Manter a cópia do TREK” ou “Manter a cópia do armazenamento”. “Sincronizar automaticamente” deixa o TREK verificar mudanças em segundo plano; desativado, o cartão mostra Pausado, e só “Sincronizar agora” faz a sincronização. Cada alteração aqui é salva na hora.',
  'help.guide.manage-notes.step.5':
    'Excluir pergunta antes, “Excluir nota?”, porque a nota é excluída para todos os membros, junto com os arquivos dela. Clique em Excluir para confirmar.',
  'help.guide.note-categories.step.3':
    'Clique no nome de uma categoria para renomeá-la. Digite o novo nome e pressione Enter; Esc mantém o anterior.',
  'help.guide.roadtrip-reorder.step.2':
    'Para mudar uma parada de dia, solte-a sobre uma parada no cartão desse dia. Enquanto você arrasta, os dias com menos de duas paradas aparecem como cartões tracejados no fim do trilho, e você também pode soltar neles.',
  'help.guide.roadtrip-corridor.tip.4':
    'Abaixo do filtro, escolha uma parada do dia, ou o ponto a meio caminho entre duas, para ver só o que está a até 25, 50 ou 100 km desse ponto. Com pontos de recarga na lista, “Qualquer tomada” e “Qualquer potência” filtram por tipo de tomada e potência.',
  'help.guide.roadtrip-overnight.result':
    'O lugar aparece no percurso como pernoite daquele dia, e a estadia fica reservada na viagem como qualquer outra.',
  'help.guide.roadtrip-stop-fill.result':
    'Nesta parada, o tanque é abastecido até o valor escolhido. A autonomia a partir dali, incluindo uma eventual faixa “Aqui o tanque acaba”, é calculada com base nisso.',
  'help.guide.roadtrip-bookings.step.4': 'Clique no cartão para abrir a reserva.',
  'help.guide.roadtrip-google-import.goal':
    'Transforme uma rota planejada no Google Maps em paradas de um dos seus dias.',
  'help.guide.roadtrip-google-import.tip.3':
    'A importação precisa de conexão e de permissão para editar lugares e dias.',
  'help.guide.roadtrip-hazards.tip.2':
    'O DWD cobre a Alemanha, e o GDACS informa desastres no mundo todo. Um alerta mostrado só como ponto indica que a área afetada é desconhecida.',
  'help.ctx.trip-tours.bullet.5':
    'Na coluna de dias, um passeio é uma linha como uma parada. Com um Início, ele mostra início → fim, com o fim calculado a partir do tempo do passeio, e “Mais opções” traz Editar, “Remover do dia”, “Tirar da rota” e “Salvar na Coleção”.',
  'help.guide.tour-show-list.step.5': 'Clique em Lugares no mesmo seletor para voltar à lista de lugares.',
  'help.guide.tour-add-to-day.step.2':
    'Escolha o dia. O menu lista todos os dias da viagem, com data e título; um dia que já tem o passeio aparece em cinza.',
  'help.guide.tour-add-to-day.result':
    'O passeio aparece no dia, e a linha dele passa a fazer parte desse dia no mapa.',
  'help.guide.tour-day-times.tip.2':
    'Um dia com uma etapa de um passeio de vários dias não recebe horário de término calculado, porque o tempo do passeio é o da rota inteira.',
  'help.guide.tour-remove-from-day.step.3':
    'Ou clique no cabeçalho do dia para abri-lo, clique no passeio na lista e depois em “Remover do dia”, no fim do cartão dele.',
  'help.guide.tour-filter-list.step.3':
    'Quando a lista mistura tipos, Origem (TREK, “Importação GPX”, wanderer), “Limite de rota” (T1 a T6) e Tipo (Trilha, “Passeio de bicicleta” e assim por diante) filtram ainda mais. Clique de novo em um valor marcado para desmarcá-lo.',
  'help.guide.tour-hide-on-map.step.1':
    'Aponte para um passeio na lista e clique no olho que aparece à direita da linha (“Ocultar no mapa”).',
  'help.guide.tour-import-plan-tab.step.1':
    'Na aba Planejado, clique em Passeios no seletor no topo da coluna da direita.',
  'help.ctx.trip-tour-detail.bullet.1':
    'Clique em um passeio na lista de Passeios (antes, mude a coluna da direita de Lugares para Passeios), na linha dele dentro de um dia ou na linha dele no mapa, e o cartão abre sobre o mapa. O mapa continua funcionando enquanto o cartão está aberto.',
  'help.guide.tour-detail-read.step.2':
    'O cabeçalho mostra o nome do passeio e um resumo em pílulas: o tipo de passeio, de onde veio (se foi importado), o tempo planejado, a distância, a subida e a descida.',
  'help.guide.tour-detail-read.tip.3':
    'Alguns passeios mostram mais: uma caminhada urbana, as estações; um passeio de remo, as verificações e o vento; um passeio já feito, a “Trilha real”; e um passeio vinculado a uma lista, a “Lista de mala”.',
  'help.guide.tour-rename-colour.step.3':
    'Clique no ponto colorido no canto do bloco redondo do passeio, “Cor da trilha”. A seção “Cor da trilha” abre logo abaixo do cabeçalho.',
  'help.guide.tour-take-along.step.2':
    'Se o passeio tiver uma página na web, o botão ao lado mostra o nome do site (Komoot, AllTrails, Outdooractive ou Wanderer) ou Site, para qualquer outro. Ele abre a página em uma nova aba.',
  'help.guide.tour-copy-keep.goal':
    'Crie uma variante de um passeio nesta viagem ou guarde-o em uma das suas coleções para viagens futuras.',
  'help.guide.tour-copy-keep.tip.4':
    'Coleção só aparece com o complemento Coleções ativado. Uma lista em que você só tem permissão de leitura não pode ser escolhida e, se ainda não houver nenhuma lista, a janela oferece “Abrir coleções”.',
  'help.guide.tour-packing-link.step.5':
    'Clique em “Abrir a lista de mala” para marcar os itens. O TREK muda para a aba Listas, já na lista de mala.',
  'help.guide.tour-files.step.2': 'A linha abaixo agora mostra quantos são, e a lista se abre.',
  'help.guide.tour-activity-link.step.2':
    'Em “Feito em”, confira o dia em que você fez o passeio. Escolha “Sem dia” se ele não pertencer a nenhum.',
  'help.guide.tour-activity-compare.title': 'Comparar o plano com o que você fez',
  'help.guide.tour-activity-compare.result': 'Você compara rapidamente o dia com o plano, no cartão e no mapa.',
  'help.guide.tour-origin-check.tip.3':
    '“Sem conexão com o wanderer” significa que a sua conta ainda não está conectada. Conecte em Configurações, Integrações.',
  'help.ctx.trip-tour-planner.bullet.5':
    '“Buscar lugar ou endereço”, no topo do mapa, move o mapa. A pílula no canto inferior esquerdo alterna entre os mapas que o tipo do passeio oferece, como Topo ou Satélite, e reúne os interruptores do passeio aberto, como “Marcar pontos” e 3D.',
  'help.guide.tour-open-workspace.step.5':
    '“Buscar lugar ou endereço”, no topo do mapa, leva o mapa até um lugar, para você começar onde o passeio fica.',
  'help.guide.tour-draw-route.goal':
    'Marque os pontos de um novo passeio no mapa e deixe o TREK calcular a rota entre eles.',
  'help.guide.tour-draw-route.tip.2':
    'Topo ou Trilhas, na pílula do mapa, mostra os caminhos, o que facilita clicar em um deles. Um ponto longe demais de qualquer caminho que o tipo possa usar recebe um aviso em vez de uma rota.',
  'help.guide.tour-type-profile.step.3':
    'Um passeio de bicicleta pede o Perfil abaixo do tipo: Cicloturismo, Estrada, Gravel ou MTB. A linha abaixo explica o que o perfil prioriza.',
  'help.guide.tour-edit-points.step.2':
    'Clique em uma linha em “Pontos de caminho” para selecionar o ponto. O alfinete dele fica destacado no mapa.',
  'help.guide.tour-shaping-points.title': 'Ajustar a rota com um ponto de forma',
  'help.guide.tour-shaping-points.tip.3':
    'Em uma cavalgada, clicar na linha não adiciona nada, porque nenhum roteador calcula o traçado.',
  'help.guide.tour-loop-reverse.tip.2':
    'Remova a linha “Volta ao início” para o passeio voltar a ser só de ida. Um trecho desenhado à mão continua desenhado à mão quando o passeio é invertido.',
  'help.guide.tour-leg-by-hand.step.4':
    '“Recalcular o próximo trecho” pede ao roteador para calcular só aquele trecho de novo, sem mexer nos outros.',
  'help.guide.tour-trip-places.step.3':
    'Clique em um lugar. Ele entra como o novo fim do passeio, e a lista continua aberta para o próximo.',
  'help.guide.tour-details-times.step.1':
    '“Nome do passeio”, no topo do painel da esquerda, guarda o nome. Em um passeio novo, o texto cinza ali, como “Trilha sem título”, é só um exemplo: digite o seu.',
  'help.guide.tour-save.title': 'Salvar um passeio',
  'help.guide.tour-save.tip.3':
    'Salvar também não funciona enquanto algum campo tiver um valor inválido, como um site que não é um endereço. Detalhes abre sozinho para mostrar o campo.',
  'help.guide.tour-edit-saved.tip.1': 'Salvar fica cinza em um passeio que você não alterou.',
  'help.guide.tour-summary-profile.step.3':
    'Passe o cursor ao longo do “Perfil de elevação”. Ele mostra a distância e a altitude naquele ponto, e um marcador indica o mesmo lugar no mapa.',
  'help.guide.tour-list-manage.step.1':
    '“Totais da viagem” fica acima da lista. Recolhido, mostra o número de passeios e quantos estão Planejado e “Não planejados”. A seta à direita abre uma linha por tipo, com distância, subida, descida e tempos somados.',
  'help.guide.tour-list-manage.result':
    'Você vê os totais dos passeios mostrados pelo filtro, e cada passeio está no dia que você quer.',
  'help.guide.tour-delete.result': 'O passeio sumiu da lista, do mapa e de todos os dias.',
  'help.guide.tour-saved-elsewhere.tip.2':
    'O mesmo acontece quando você altera o passeio em outro dispositivo. Um passeio que você não alterou simplesmente é recarregado, e uma nota avisa isso.',
  'help.ctx.trip-tour-import.bullet.5':
    'Depois que o wanderer é conectado em Configurações, Integrações, um botão wanderer aparece ao lado de “Planejar novo passeio” quando nenhum passeio está aberto. Ele lista as suas trilhas para importar.',
  'help.guide.tour-import-gpx.tip.1':
    'Você também pode arrastar os arquivos do computador e soltá-los na aba Passeios. A mesma prévia abre.',
  'help.guide.tour-view-import.step.1':
    'Na aba Passeios, clique em um passeio com o selo “Importação GPX” em “Passeios desta viagem”.',
  'help.guide.tour-plan-from-import.goal':
    'Obtenha, a partir de um traçado gravado, pontos de caminho que você pode mover e veja o quanto a nova rota se mantém perto dele.',
  'help.guide.tour-plan-from-import.tip.4':
    'Um “Passeio a cavalo” não tem versão editável: fica exatamente como foi percorrido.',
  'help.guide.tour-restore-recorded.tip.2':
    'Um passeio criado com “Planejar como novo passeio” não tem traçado gravado próprio. A importação de origem continua na lista.',
  'help.guide.tour-take-over.step.5': 'Se quiser, dê outro nome em “Nome nesta viagem”.',
  'help.guide.tour-import-wanderer.step.1':
    'Na aba Passeios, sem nenhum passeio aberto, clique em wanderer ao lado de “Planejar novo passeio”.',
  'help.guide.tour-import-wanderer.result':
    'A trilha vira um passeio da viagem e abre no mapa como “Passeio do wanderer”.',
  'help.guide.tour-map-layers.title': 'Escolher o mapa de um passeio',
  'help.guide.tour-map-layers.tip.3':
    'Passeios de remo e caminhadas urbanas oferecem só Mapa e Satélite; corridas, passeios de esqui e cavalgadas oferecem Mapa, Topo e Satélite.',
  'help.guide.tour-along-search.result':
    'Os lugares ao longo da rota aparecem na lista e no mapa, prontos para você conferir.',
  'help.guide.tour-along-add-stop.step.3':
    'Clique em “Adicionar como parada”. O selo ao lado é uma estimativa aproximada do desvio, medida em linha reta.',
  'help.guide.tour-3d-terrain.step.1':
    'Abra um passeio na aba Passeios e clique em 3D, no fim da pílula do canto inferior esquerdo. O mapa se inclina e mostra o relevo em 3D, com a rota desenhada sobre ele.',
  'help.guide.tour-3d-terrain.tip.3':
    'A paisagem precisa de conexão: as altitudes vêm dos blocos de relevo abertos do Mapzen. Um passeio de remo aparece na própria cor, sem graus de inclinação, porque a água é plana.',
  'help.guide.tour-3d-flyover.tip.1':
    'Use a roda do mouse durante o sobrevoo para aproximar ou afastar; a câmera continua no marcador. Você só consegue arrastar o mapa depois de pausar.',
  'help.guide.tour-map-overlays.step.4':
    'Em um passeio de remo, a pílula oferece “Sinais náuticos” no lugar. Clique para mostrar boias, balizas e sinalização de porto na água.',
  'help.ctx.trip-tour-stages.bullet.2':
    '“Encerrar etapa aqui”, no menu “Mais ações” de uma parada, encerra uma etapa nessa parada. Em seguida, “Pontos de caminho” mostra um título Etapa N para cada etapa, com distância e tempo, e a parada que encerra uma etapa ganha um ícone de lua.',
  'help.guide.tour-multi-day.step.3':
    'Aponte para a parada onde termina o primeiro dia, clique em “Mais ações” e escolha “Encerrar etapa aqui”.',
  'help.guide.tour-multi-day.result':
    'Uma única rota com suas etapas, cada uma medida separadamente. Clique em Salvar para mantê-las.',
  'help.guide.tour-stages-on-days.step.6':
    'A seta ao lado, “Abrir esta etapa no planejador”, abre o passeio no editor nessa etapa.',
  'help.ctx.trip-tour-hike.bullet.1':
    '“Tipo de passeio”, no topo do editor, define como a rota é planejada. Trilha usa caminhos até a “Dificuldade máxima da trilha” definida em Detalhes; Corrida usa caminhos bons para correr e pede o seu “Ritmo planejado”.',
  'help.guide.tour-hike-plan.step.1':
    'Clique em “Planejar novo passeio” no topo da coluna da esquerda. O editor abre como “Novo passeio”.',
  'help.guide.tour-hike-plan.tip.2':
    'A partir de T4, o TREK pergunta antes “Ativar o cálculo de rotas alpinas?”. Confirme só se a rota puder passar por terreno exposto ou sem sinalização; a pergunta aparece uma vez por sessão de edição.',
  'help.guide.tour-hike-trail-details.step.4':
    'Clique em um grau na lista para mostrar só esses trechos no mapa. Clique de novo para ver a rota inteira.',
  'help.guide.tour-hike-round.step.1':
    'Com a caminhada aberta, clique em “Trilha circular a partir do início” no cabeçalho do cartão “Pontos de caminho”. A partir de outra parada, abra “Mais ações” dela e escolha “Trilha circular a partir daqui”.',
  'help.guide.tour-hike-round.tip.3':
    '“Buscar novamente” volta à escolha da distância, e Cancelar fecha o cartão sem mudar nada.',
  'help.guide.tour-hike-compare-ways.tip.1':
    'Só caminhadas oferecem isso, e só em trechos calculados pelo roteador, não nos desenhados à mão.',
  'help.guide.tour-ferrata-add.step.4':
    'Em “Pontos de caminho”, o trecho entre esses dois pontos mostra o nome, o grau e a extensão da via ferrata.',
  'help.guide.tour-run-plan.goal':
    'Planeje uma corrida por caminhos bons para correr e calcule o tempo pelo seu ritmo.',
  'help.guide.tour-run-plan.tip.2':
    'Subidas, descidas e o quanto o caminho é técnico não entram no tempo: é a distância multiplicada pelo ritmo, nada mais.',
  'help.guide.tour-run-ways.result': 'Antes de sair, você já sabe quais partes da corrida não são no asfalto.',
  'help.ctx.trip-tour-walk.bullet.4':
    '“Ao longo do passeio” encontra atrações por “Tema do passeio” a uma certa distância da rota, e “Adicionar como parada” encaixa uma delas na caminhada onde você escolher.',
  'help.guide.tour-walk-plan.step.5':
    'Defina Importância como Comum, Opcional ou Imperdível. Ative Protegida para uma parada que deve ficar onde está quando uma mudança for sugerida depois, e clique em Salvar.',
  'help.guide.tour-walk-sights.step.1':
    'Com uma caminhada urbana aberta, procure “Ao longo do passeio” na coluna da esquerda e escolha um “Tema do passeio”: “Cultura e história”, “Parques e vistas”, “Comida e vida local” ou “Um pouco de tudo”.',
  'help.guide.tour-walk-sights.result':
    'A atração vira uma parada da caminhada, encaixada na rota entre as paradas que você escolheu.',
  'help.guide.tour-walk-day-times.tip.2':
    'Se uma parada ainda não tiver tempo de permanência, os horários de chegada depois dela aparecem como os mais cedo possíveis.',
  'help.guide.tour-walk-google-import.step.3':
    'Confira “Paradas do link”. Uma parada sem posição no link é marcada e fica de fora.',
  'help.guide.tour-walk-check-off.step.1':
    'Na aba Planejado, clique na caminhada urbana no dia dela. O cartão abre ao lado do mapa.',
  'help.ctx.trip-tour-bike.title': 'Passeios de bicicleta',
  'help.guide.tour-bike-profile.step.1':
    'Na aba Passeios, clique em “Planejar novo passeio” no topo do painel da esquerda.',
  'help.guide.tour-bike-profile.tip.2':
    'O perfil só orienta o roteador. Ele não diz se dá para pedalar em um caminho: o cartão “Piso e vias” mostra por onde a rota passa.',
  'help.guide.tour-bike-surfaces.step.3':
    'Em Piso, clique em uma linha como Cascalho ou Terra. Os trechos correspondentes ficam destacados no mapa. Clique de novo na linha para tirar o destaque.',
  'help.guide.tour-bike-mtb-grades.goal':
    'Veja o quanto as trilhas de um passeio de MTB são difíceis antes de pedalar nelas.',
  'help.guide.tour-bike-mtb-grades.tip.4':
    'Troque o Perfil para outro que não seja MTB, e as seções de grau somem. A rota é então recalculada para o novo perfil.',
  'help.guide.tour-ski-plan.title': 'Planejar um passeio de esqui e inverno',
  'help.guide.tour-ski-plan.tip.1':
    'Para “Esqui cross-country”, escolha também a Técnica: Clássica, Skating ou Desconhecida. O aviso abaixo dos campos mostra o que ainda falta.',
  'help.guide.tour-ski-options.step.2':
    'Abra “Pistas mais difíceis” e escolha o grau mais alto que você quer esquiar, de Iniciante a Especialista. O padrão é Intermediária.',
  'help.guide.tour-ski-fix-leg.title': 'Corrigir um trecho de esqui que não pôde ser planejado',
  'help.guide.tour-ski-fix-leg.tip.4':
    'Enquanto algum trecho não estiver planejado, o cartão “Rota pelas pistas” avisa que ainda não há tempo de esqui.',
  'help.guide.tour-ski-summary.tip.2':
    '“Tempo de esqui” fica como “Não calculado” até todos os trechos estarem planejados. Para dar um tempo ao passeio mesmo assim, informe um total planejado nos detalhes dele.',
  'help.guide.tour-ski-pistes-layer.step.3':
    'A legenda mostra as pistas de descida por dificuldade, as trilhas de esqui de fundo, as trilhas de inverno e de raquetes, as pistas de trenó e os teleféricos. “Legenda completa no OpenSnowMap” abre a legenda inteira.',
  'help.guide.tour-ski-import.step.2': 'Na “Prévia da importação”, abra “Importar como” e escolha “Esqui e inverno”.',
  'help.guide.tour-ski-import.result':
    'O traçado está em “Passeios desta viagem”, com a modalidade e a técnica no cartão “Trilha de esqui”.',
  'help.ctx.trip-tour-paddle.bullet.6':
    '“Remar tem riscos”, a linha no fim da coluna da esquerda, abre “Segurança na água”. O mapa oferece Mapa e Satélite, e “Sinais náuticos” como sobreposição.',
  'help.guide.tour-paddle-setup.step.6':
    '“Velocidade de remada” mostra em cinza a sugestão para o barco. Digite a sua, e o campo passa a mostrar “Velocidade própria”; o link abaixo, “Usar a sugerida”, volta à velocidade do barco.',
  'help.guide.tour-paddle-water-route.goal':
    'Deixe o TREK planejar um trecho pelo rio ou lago e entenda os avisos de um trecho que ele não conseguiu planejar.',
  'help.guide.tour-paddle-water-route.tip.3':
    'As notas abaixo de um trecho planejado indicam Águas bravas, com o grau, uma “Passagem para canoas” ou uma “Lacuna nos dados do mapa” coberta com uma linha reta.',
  'help.guide.tour-paddle-portage.step.4':
    'Em Rota, “Seguir o caminho” usa um caminho mapeado, e “Linha reta” vai direto. O TREK procura o caminho sozinho e avisa quando não há nenhum sem um desvio longo.',
  'help.guide.tour-paddle-lock.step.1': 'Aponte para a parada na eclusa e clique em “Mais ações”, os três pontos.',
  'help.guide.tour-paddle-time.title': 'Ver e ajustar o tempo de um passeio de remo',
  'help.guide.tour-paddle-time.tip.2': 'Correnteza e vento não entram na estimativa.',
  'help.guide.tour-paddle-wind.step.4':
    'Abra “O que o vento significa para a remada” para saber o que vento contra, vento lateral, travessias abertas e rajadas fazem com um barco.',
  'help.guide.tour-paddle-checklist.step.1':
    'Salve o passeio de remo e procure “Lista de verificação” na coluna da esquerda. O selo no cabeçalho resume a situação da lista.',
  'help.guide.tour-paddle-checklist.tip.4':
    'Os obstáculos vêm dos dados do OpenStreetMap das regiões que o TREK tem. Onde não há dados, o cartão avisa, e você mesmo verifica barragens, eclusas e transbordos.',
  'help.guide.tour-paddle-track-marks.step.4':
    'Clique no traçado em “Passeios desta viagem”. A coluna da esquerda o mostra como foi gravado, com o cartão “Transbordos e eclusas”.',
  'help.ctx.trip-tour-horse.title': 'Cavalgadas',
  'help.guide.tour-horse-plan.goal':
    'Monte uma cavalgada com trechos das rotas equestres sinalizadas, na visão do mapa.',
  'help.guide.tour-horse-plan.result':
    'A cavalgada segue os trechos que você escolheu, cada um com o nome da rota, o ponto de acesso e a extensão, e aparece em “Passeios desta viagem”.',
  'help.guide.tour-horse-gap.step.1':
    'Com um trecho na cavalgada, abra outra rota e escolha um trecho que não encoste no fim da sua cavalgada. Em “Ligação com seu passeio”, um aviso informa a distância entre eles.',
  'help.guide.tour-horse-recorded.title': 'Manter uma cavalgada gravada de um arquivo GPX',
  'help.guide.tour-horse-recorded.tip.2':
    'Um arquivo sem altitudes mostra “Sem altitudes no arquivo” em vez de uma subida zero.',
  'help.guide.dateless-trip.tip.1':
    'Quando souber quando vai viajar, abra o formulário pelo lápis no cartão e escolha as datas. Os dias já planejados mantêm a ordem e recebem as datas nessa mesma ordem.',
  'help.guide.trip-reminder.goal': 'Receba um lembrete alguns dias antes de partir.',
  'help.guide.upcoming-reservations.tip.2':
    'Pendente indica uma reserva ainda não confirmada. Reservas canceladas e viagens arquivadas ficam de fora.',
  'help.guide.half-company-holiday.tip.1':
    'Férias já registradas nesse dia caem para meio dia. Quem registrar esse dia depois gasta só 0,5 dia.',
  'help.guide.edit-holiday-calendar.goal':
    'Renomeie, mude a cor, mova ou exclua um calendário de feriados ou de férias escolares que você adicionou.',
  'help.guide.person-color.title': 'Mudar a cor de uma pessoa',
  'help.guide.answer-fusion-request.tip.1':
    'O pedido fica aberto até você responder. Se houver vários, eles aparecem um depois do outro.',
  'help.guide.log-for-partner.tip.1': '“Meio dia” e “Banco de horas” também funcionam para a pessoa selecionada.',
  'help.guide.dissolve-fusion.tip.2':
    'Se a ideia é só deixar alguém ver os seus dias, compartilhe o seu calendário em vez disso.',
  'help.guide.country-details.tip.2':
    'Clique no selo Lugares para ver todos os lugares contados para o país, agrupados por viagem.',
  'help.guide.country-places.tip.2':
    'O selo só aparece quando o país tem lugares próprios. Um país que você só marcou manualmente não tem nenhum.',
  'help.guide.tour-activity-stats.goal':
    'Veja a distância, a subida e o número de passeios que você fez em todas as suas viagens, por período e por tipo, e deixe de fora um passeio que não aconteceu.',
  'help.guide.tour-activity-stats.tip.1':
    'Um passeio só conta depois que o último dia dele termina. Um passeio sem dia, ou só em dias sem data, nunca conta. Para que conte, coloque-o em um dia com data na viagem dele.',
  'help.guide.move-to-list.result':
    'Os lugares estão na outra lista, e uma breve mensagem informa quantos foram movidos ou duplicados.',
  'help.guide.accept-list-invite.tip.1':
    'O que você pode fazer na lista depende da função que o dono lhe deu: Visualizador, Editor ou Administrador.',
  'help.guide.tour-collection-add-to-trip.title': 'Adicionar a uma viagem um passeio de uma lista',
  'help.guide.tour-collection-add-to-trip.tip.3':
    'Para guardar um passeio em uma lista, abra um passeio salvo na viagem e clique em Coleção, no rodapé.',
  'help.guide.tour-collection-manage.tip.2': 'Só o dono e os administradores da lista veem a lixeira.',
  'help.guide.entry-draft.result':
    'A entrada continua na sua linha do tempo, marcada como Rascunho, e não aparece no link compartilhado.',
  'help.guide.journey-map-layers.title': 'Escolher o que o mapa da jornada mostra',
  'help.guide.journey-keep-route.title': 'Manter a rota que você gravou em um dia',
  'help.guide.journey-day-stays.title': 'Escrever entradas a partir das estadias que o Dawarich registrou',
  'help.guide.journey-take-over-day.title': 'Importar um dia gravado inteiro',
  'help.guide.journey-take-over-day.result':
    'O dia agora tem um rascunho por estadia ou grupo unido, ou um único relato do dia, e as estadias dele não aparecem mais como pendentes.',
  'help.guide.journey-auto-prepare.result':
    'Enquanto uma viagem vinculada está em andamento, as estadias de cada dia aparecem nesse dia, prontas para “Importar dia”.',
  'help.ctx.settings-about.title': 'Sobre',
  'help.guide.web-push-device.tip.3':
    'O push exige que o TREK esteja aberto por HTTPS. Se as notificações estiverem bloqueadas, permita-as nas configurações do navegador e tente de novo.',
  'help.guide.connect-airtrail.result':
    'O selo mostra Conectado, e a aba Transportes de uma viagem passa a oferecer “Importar do AirTrail”.',
  'help.guide.connect-dawarich.result':
    'O selo mostra Conectado, e o planejador, o diário e o Atlas podem oferecer o que o Dawarich registrou.',
  'help.guide.tour-connect-wanderer.result':
    'O selo mostra Conectado, e a aba Passeios de uma viagem pode pesquisar no seu wanderer e importar as trilhas.',
  'help.guide.tour-wanderer-watch.result':
    'O TREK verifica as trilhas que você importou e avisa quando uma pode ter mudado. Um passeio só muda quando você aceita a alteração.',
  'help.guide.plugin-settings.step.1':
    'Abra Plugins na barra lateral de configurações. Abaixo de “Configurações de plugins”, cada plugin que precisa de configurações suas tem um cartão com os campos: preencha e clique em Salvar. As ações do cartão são executadas depois que você confirma.',
  'help.guide.profile.step.3': 'Clique em “Salvar perfil”, à direita do rodapé do cartão.',
  'help.guide.default-user-settings.title': 'Definir com o que os novos usuários começam',
  'help.guide.own-routing-engine.tip.1':
    'Os servidores OSRM públicos aceitam cerca de uma requisição por segundo. Isso basta para um dia, mas pode ser lento demais para uma viagem de carro.',
  'help.guide.admin-passkeys.goal':
    'Deixe as pessoas entrarem com impressão digital, reconhecimento facial ou o PIN do dispositivo.',
  'help.guide.rotate-jwt-secret.tip.2':
    'Para desconectar só uma pessoa, defina uma “Nova senha” para ela em “Editar usuário”. Isso encerra apenas as sessões dela.',
  'help.guide.notification-defaults.goal':
    'Defina como começam as notificações de cada usuário e bloqueie de vez um canal para um evento.',
  'help.ctx.notifications.summary':
    'Todas as notificações que o TREK mostrou no app, das mais recentes para as mais antigas: uma reserva que alguém alterou, uma nova mensagem no chat de uma viagem, um calendário compartilhado com você. O sino no canto superior direito mostra as dez mais recentes; esta página mostra todas.',
  'help.guide.read-notifications.step.1':
    'Clique no sino no canto superior direito. O número vermelho sobre ele mostra quantas notificações você ainda não leu.',
  'help.guide.filter-notifications.step.1': 'Clique no sino no canto superior direito.',
  'help.guide.mark-notifications-read.step.2':
    'Clique em “Marcar tudo como lido”, no topo, para marcar todas as notificações como lidas de uma vez.',
  'help.guide.delete-notifications.tip.1':
    'Excluir remove a notificação só para você. A reserva, a mensagem ou o compartilhamento a que ela se referia continua como está.',
  'help.guide.notification-settings.tip.1':
    'Um cadeado em uma célula indica que o administrador desativou esse evento para todos.',
  'help.guide.add-guest.tip.3':
    'Só o proprietário da viagem pode adicionar, renomear e remover convidados. Um convidado que pagou uma despesa só pode ser removido depois que você trocar o pagador ou excluir o pagamento.',
  'help.guide.link-journal.tip.1':
    'Você só pode vincular diários de que é dono. Não dá para vincular um diário em que você só tem permissão para escrever.',
  'help.ctx.trip-places.bullet.7':
    'O ícone de seleção ao lado da busca inicia uma seleção. Use a barra no fim da coluna para dar uma nova categoria a várias linhas de uma vez, adicioná-las a uma coleção, marcá-las como visitadas ou excluí-las.',
  'help.guide.filter-places.step.5':
    'Quando a viagem abrange mais de um país ou região, o globo filtra a lista por um país ou por uma região dele, cada um com sua contagem. “Limpar filtro” volta para “Todos os países”.',
  'help.guide.import-places-file.tip.3':
    'Com Passeios ativado, que é o padrão, você importa um arquivo por Passeios, no topo da coluna, com “Importar GPX ou KML”, e as linhas dele viram passeios. Os alfinetes do arquivo não são importados ali, porque passeios só têm linhas.',
  'help.guide.dawarich-stays.step.3':
    'Confira o Nome, a Chegada e a Saída, escolha um Dia ou deixe em “Ainda sem dia definido”, adicione Notas se quiser e clique em “Adicionar lugar”.',
  'help.guide.leave-stop-off-route.result':
    'A parada continua no dia e no PDF; enquanto estiver marcada como “Fora da rota”, a rota vai direto da parada anterior para a seguinte.',
  'help.guide.move-booking-day.tip.2':
    'Dentro do próprio dia, uma reserva com horário sempre volta para a posição do horário.',
  'help.guide.place-image-from-file.step.3':
    'Em “Dos arquivos anexados”, clique na foto que você quer. “Enviar do dispositivo”, acima, escolhe uma nova do seu computador.',
  'help.guide.place-own-hours.step.1':
    'Abra o lugar e clique em Editar, no canto inferior direito do cartão. O formulário do lugar abre.',
  'help.guide.place-own-hours.tip.3':
    'Clique em “Remover horário de funcionamento” e depois em Atualizar para o cartão voltar a mostrar o horário encontrado automaticamente.',
  'help.guide.confirm-stay-booking.title': 'Confirmar a reserva de uma estadia',
  'help.guide.confirm-stay-booking.tip.2':
    'A mesma pílula funciona em todas as reservas, inclusive nas que aparecem em Reservas no dia.',
  'help.guide.map-lock.tip.2':
    'Este navegador lembra o cadeado em todas as viagens. Ao abrir uma viagem, o mapa ainda se ajusta a ela uma vez, para nunca abrir em uma área vazia.',
  'help.guide.tour-map-lines.step.2':
    'Clique na linha ou no alfinete de início dela. O cartão do passeio abre na parte de baixo do mapa, e a linha passa a ser desenhada mais grossa, com borda branca, para você distingui-la das outras. O X no cabeçalho do cartão o fecha.',
  'help.guide.car-stops.title': 'Planejar um percurso de carro com paradas pelo caminho',
  'help.guide.car-stops.result':
    'O percurso vira um cartão na aba Transportes e uma linha no dia dele, e a linha no mapa vai da retirada, passando por todas as paradas na ordem, até a devolução.',
  'help.guide.transport-details.step.5':
    '“No mapa”, no fim dos detalhes, mostra a linha do trajeto e abre o Planejado no dia dele. Editar, na ponta direita, abre o formulário completo, e a lixeira ao lado exclui o trajeto depois que você confirma.',
  'help.guide.export-transports-csv.step.1':
    'Filtre a lista antes se quiser só uma parte. Buscar, Filtrar e a ordenação em “Opções de visualização” contam: o arquivo traz o que a aba mostra, na mesma ordem.',
  'help.guide.group-sort-bookings.tip.1':
    'Cartões e Lista têm agrupamentos próprios: Cartões começa por Status, e Lista, por Dia. Um ponto em “Opções de visualização” indica que algo está diferente do padrão, e “Redefinir visualização”, no fim do painel, restaura o padrão.',
  'help.guide.booking-on-map.step.2': 'Clique em “No mapa”, no fim dos detalhes.',
  'help.guide.export-bookings-csv.goal':
    'Exporte as reservas da viagem como arquivo CSV para abrir no Excel, no Numbers ou em qualquer outra planilha.',
  'help.guide.arrange-packing-list.goal':
    'Mova listas inteiras e itens avulsos para onde quiser, ou veja cada lista em ordem alfabética.',
  'help.guide.check-off-packing.tip.4':
    'Para um item com quantidade maior que um, você também pode marcar as peças como embaladas uma a uma. Veja “Embalar várias peças de uma coisa”.',
  'help.guide.count-packed-pieces.tip.1':
    'Marcar a caixa embala todas as peças de uma vez, e desmarcar tira todas de novo.',
  'help.guide.expense-receipts.goal': 'Guarde o comprovante ou a nota junto com a despesa e abra de novo pelo extrato.',
  'help.guide.expense-receipts.tip.2':
    'A lixeira ao lado de um comprovante o tira da despesa quando você salva. O arquivo em si continua em Arquivos; exclua-o lá para removê-lo de vez.',
  'help.guide.files-sync.tip.4':
    'Se o cartão mostrar um aviso amarelo com “Voltar a ligar”, o repositório não aceita mais o login salvo. Clique em “Voltar a ligar”, informe uma nova senha de app ou token, e a sincronização recomeça.',
  'help.guide.files-sync-settings.result':
    'A partir da próxima execução, a viagem sincroniza só no sentido escolhido, e exclusões e edições conflitantes seguem as regras que você definiu.',
  'help.guide.manage-notes.result':
    'A nota sai do cartão Notas para todos os membros de uma vez. Uma nota que você só fixou ou alterou continua lá, e os outros a veem do jeito que você deixou.',
  'help.guide.note-categories.step.4':
    'Os pontos de cor de uma linha definem a cor dessa categoria: Índigo, Vermelho, Âmbar, Esmeralda, Azul ou Violeta. Aqui, Hospedagem fica âmbar.',
  'help.guide.roadtrip-reorder.step.3':
    'Pelo teclado, selecione uma parada e pressione Alt com a seta para cima ou para baixo para movê-la uma posição dentro do dia.',
  'help.guide.roadtrip-overnight.title': 'Passar uma noite pelo caminho',
  'help.guide.roadtrip-overnight.tip.1':
    'A noite vai até o dia seguinte. Para outras datas, altere a reserva: mude as datas em Dias, junto com o resto da estadia.',
  'help.guide.roadtrip-stop-fill.tip.1':
    'Só as paradas onde o seu carro pode abastecer mostram o selo: postos de combustível para Combustível, pontos de recarga para Elétrico, e os dois para Ambos.',
  'help.guide.roadtrip-bookings.result':
    'Cada trajeto reservado aparece no percurso no ponto em que acontece, e a rota antes e depois dele vai até os terminais e sai deles.',
  'help.guide.roadtrip-google-import.step.1':
    'Clique nos três pontos no topo de “No trajeto” e escolha “Importar rota do Google Maps”.',
  'help.guide.roadtrip-hazards.title': 'Mostrar os alertas atuais no mapa',
  'help.guide.roadtrip-hazards.tip.3':
    'Os dados são atualizados a cada dez minutos e precisam de conexão. Como as outras configurações de direção, o interruptor fica salvo na viagem.',
  'help.ctx.trip-tours.bullet.6':
    'Mudar uma rota e excluir um passeio são feitos na aba Passeios, em “Passeios desta viagem”.',
  'help.guide.tour-show-list.tip.1':
    'Clique na linha de um passeio no mapa, e a lista destaca esse passeio e rola até ele.',
  'help.guide.tour-add-to-day.step.3':
    'A mensagem Adicionado ao dia 10 confirma, a linha ganha o selo Dia, e o dia na coluna da esquerda lista o passeio com o tempo, a distância e a subida.',
  'help.guide.tour-day-times.title': 'Definir o horário de início de um passeio no dia',
  'help.guide.tour-day-times.tip.3':
    '“Tirar da rota”, no mesmo menu, mantém o passeio no dia, mas fora da rota do dia no mapa. “Colocar de volta na rota” desfaz isso.',
  'help.guide.tour-remove-from-day.tip.1':
    'Um passeio de vários dias é removido um dia por vez, porque cada dia tem a própria etapa.',
  'help.guide.tour-filter-list.step.4':
    'Feche o menu. O botão agora mostra o status, o número de passeios que restaram e +1 para cada filtro a mais que você definiu.',
  'help.guide.tour-hide-on-map.step.2':
    'A linha do passeio some do mapa. A linha dele continua na lista, esmaecida, com um olho riscado (“Mostrar no mapa”). Clique nele para mostrar a linha de novo.',
  'help.guide.tour-import-plan-tab.step.2':
    'Clique em “Importar GPX ou KML”, no topo da lista, e escolha os arquivos (GPX, KML ou KMZ).',
  'help.ctx.trip-tour-detail.bullet.2':
    'O cabeçalho mostra o bloco redondo do passeio, o nome com um lápis para renomear, um ponto colorido com a cor da linha e pílulas com o tipo, a origem, o tempo planejado, a distância, a subida e a descida. O X à direita fecha o cartão, assim como Esc.',
  'help.guide.tour-detail-read.step.3':
    'Aponte para o tempo para ver como ele é composto: o tempo em movimento, as pausas e o total planejado.',
  'help.guide.tour-detail-read.tip.4':
    'O cartão não altera a rota. Para mover um ponto ou redesenhar um trecho, abra a aba Passeios e clique no passeio em “Passeios desta viagem”.',
  'help.guide.tour-rename-colour.step.4':
    'Escolha uma cor. “Cor automática”, a primeira célula, volta a linha para a cor padrão, e “Escolher cor personalizada”, a última, permite qualquer cor. A linha no mapa e a faixa na lista de Passeios mudam na hora.',
  'help.guide.tour-take-along.step.3':
    'Clique em GPX para baixar o passeio salvo como arquivo GPX: a rota inteira, com as altitudes disponíveis, pronta para um app de navegação ou um aparelho de GPS.',
  'help.guide.tour-copy-keep.step.1':
    'Abra o cartão do passeio e clique em Copiar, no fim. O TREK cria um passeio novo e independente, sem os dias, e o original continua como está.',
  'help.guide.tour-copy-keep.result':
    'A viagem ganha um segundo passeio para você alterar à vontade, e a coleção guarda a própria cópia, pronta para ser adicionada a outra viagem.',
  'help.guide.tour-packing-link.tip.1':
    'É só um vínculo. Nada é copiado nem movido, e os itens continuam em Listas. Marque um item lá, e o passeio mostra isso na hora.',
  'help.guide.tour-files.step.3': 'Clique em um arquivo para abri-lo.',
  'help.guide.tour-activity-link.step.3':
    'Escolha a gravação em Trilha ou clique em “Importar GPX” para trazer um arquivo novo.',
  'help.guide.tour-activity-compare.goal': 'Veja onde o traçado real difere do plano e troque ou desvincule o traçado.',
  'help.guide.tour-origin-check.title': 'Ver de onde veio um passeio',
  'help.guide.tour-origin-check.result': 'Você sabe de onde o passeio veio, quando e se ele mudou desde então.',
  'help.ctx.trip-tour-planner.bullet.6':
    'Um rascunho não salvo fica guardado: abra a aba Passeios de novo, e ele é restaurado com o aviso “Rascunho não salvo restaurado”. “Voltar aos passeios” e Descartar perguntam antes de descartar alterações.',
  'help.guide.tour-open-workspace.step.6':
    'A pílula no canto inferior esquerdo troca o mapa, de início entre Mapa e Satélite. Com um passeio aberto, ela oferece os mapas do tipo dele, como Topo ou Trilhas, e interruptores como “Marcar pontos” e 3D.',
  'help.guide.tour-draw-route.step.1':
    'Clique em “Planejar novo passeio” no topo do painel da esquerda. O painel passa a mostrar “Novo passeio”, uma trilha, a menos que você escolha outro tipo.',
  'help.guide.tour-draw-route.tip.3':
    'Se um rascunho tiver alterações não salvas, “Planejar novo passeio” no menu “Adicionar passeio” pergunta antes: “Começar um novo passeio?”, com “Descartar e começar”.',
  'help.guide.tour-type-profile.step.4':
    'A rota é recalculada para o perfil, e o “Resumo do passeio”, à direita, mostra a distância e o tempo.',
  'help.guide.tour-edit-points.step.3':
    'Para mudar a ordem, aponte para uma linha e arraste-a pela alça que aparece na borda esquerda.',
  'help.guide.tour-shaping-points.goal': 'Leve a rota para outro caminho sem adicionar uma parada.',
  'help.guide.tour-shaping-points.result':
    'A rota passa por onde você a arrastou, e as paradas continuam numeradas como antes.',
  'help.guide.tour-loop-reverse.tip.3':
    'Em uma caminhada, “Trilha circular a partir do início”, ao lado, procura trilhas circulares com a extensão que você escolher.',
  'help.guide.tour-leg-by-hand.tip.1':
    'Nenhum roteador verificou um trecho desenhado à mão: ele pode cruzar água, terreno particular ou um penhasco.',
  'help.guide.tour-trip-places.step.4':
    'A linha mostra “Local da viagem” abaixo do nome. “Desvincular do local”, em “Mais ações”, mantém o ponto, mas remove o vínculo.',
  'help.guide.tour-details-times.step.2': 'Em Detalhes, escreva uma Descrição e adicione um Site, se houver.',
  'help.guide.tour-save.goal': 'Guarde o passeio desenhado na viagem.',
  'help.guide.tour-save.result': 'O passeio fica salvo na viagem, pronto para ser colocado em um dia.',
  'help.guide.tour-edit-saved.tip.2':
    'Um traçado GPX ou KML importado abre como “Passeio GPX”, só para visualização. “Planejar uma versão editável”, ali, cria um passeio que você pode alterar.',
  'help.guide.tour-summary-profile.step.4':
    '“Recolher perfil de elevação”, a seta ao lado do título, oculta o perfil; clique de novo para mostrá-lo.',
  'help.guide.tour-list-manage.step.2':
    'Aponte para um passeio e clique no mais redondo da linha, “Adicionar ao dia”, para abrir os dias da viagem.',
  'help.guide.tour-delete.title': 'Excluir um passeio',
  'help.guide.tour-saved-elsewhere.title': 'Quando o passeio foi salvo em outro lugar',
  'help.guide.tour-saved-elsewhere.result': 'Nenhuma alteração se perde, a menos que alguém escolha descartá-la.',
  'help.guide.tour-import-gpx.title': 'Importar um arquivo GPX, KML ou KMZ como passeio',
  'help.guide.tour-import-gpx.tip.2':
    'Cada traçado ou rota de um arquivo vira um passeio próprio. Os traçados nunca são unidos.',
  'help.guide.tour-view-import.step.2':
    'A coluna da esquerda o mostra como “Passeio GPX”: o “Resumo do passeio” com distância, altitudes e tempo gravado, e o perfil de elevação logo abaixo. O mapa mostra a linha dele.',
  'help.guide.tour-plan-from-import.step.1':
    'Abra o passeio importado na aba Passeios. No cartão “Versão editável”, à esquerda, clique em “Planejar uma versão editável”.',
  'help.guide.tour-plan-from-import.result':
    'O passeio agora tem pontos de caminho que você pode arrastar, e a Origem mostra “Replanejado, trilha gravada mantida”.',
  'help.guide.tour-restore-recorded.result':
    'O passeio volta a ser um “Passeio GPX” e mostra a linha com que foi gravado.',
  'help.guide.tour-take-over.step.6': 'Clique em Trazer.',
  'help.guide.tour-import-wanderer.step.2':
    'Digite em “Pesquisar trilhas”. “Pesquisar nesta área do mapa” mostra só as trilhas que estão na parte visível do mapa.',
  'help.ctx.trip-tour-map.title': 'Mapa do passeio',
  'help.guide.tour-map-layers.goal':
    'Planeje no mapa mais adequado ao tipo de passeio: curvas de nível para as subidas, trilhas sinalizadas ou ciclovias, ou imagens de satélite.',
  'help.guide.tour-along-search.title': 'Encontrar lugares ao longo de um passeio',
  'help.guide.tour-along-search.tip.1':
    'Depois que você muda a rota, os tipos ou a distância, “Buscar novamente” fica destacado e avisa que a lista foi encontrada para a rota anterior. Clique nele para atualizar a lista.',
  'help.guide.tour-along-add-stop.step.4':
    'A rota é recalculada passando pelo lugar, e “Ao longo do passeio” mostra quanta distância e quanto tempo o passeio ganhou. Desfazer, na mesma linha, remove a parada.',
  'help.guide.tour-3d-terrain.step.2':
    'A rota aparece colorida pela inclinação. Clique em Inclinação, na fileira de baixo, para mostrá-la na cor do passeio, e clique de novo para voltar às cores de inclinação.',
  'help.guide.tour-3d-flyover.title': 'Sobrevoar um passeio',
  'help.guide.tour-3d-flyover.tip.2':
    'O sobrevoo só começa depois que a paisagem de toda a rota estiver carregada, para não parar no meio esperando dados do mapa. Aponte para o anel para ver quanto já carregou.',
  'help.guide.tour-map-overlays.result':
    'As pistas ou os sinais náuticos aparecem sobre o mapa, e a legenda explica o que significam.',
  'help.ctx.trip-tour-stages.bullet.3':
    'O “Resumo do passeio” lista cada etapa em Etapas, da parada em que começa até a parada em que termina. Um clique em uma etapa seleciona a última parada dela e marca o ponto no perfil de elevação.',
  'help.guide.tour-multi-day.step.4':
    '“Pontos de caminho” agora se divide em Etapa 1 e Etapa 2, cada uma com distância e tempo. A parada que encerra uma etapa mostra um ícone de lua.',
  'help.guide.tour-stages-on-days.title': 'Colocar um passeio de vários dias nos dias da viagem',
  'help.guide.tour-stages-on-days.tip.1':
    'Quando a viagem termina antes da última etapa, a opção mostra qual é a última etapa que cabe. As etapas seguintes ficam sem dia.',
  'help.ctx.trip-tour-hike.bullet.2':
    '“Pontos de caminho” lista as paradas em ordem. “Adicionar ponto” já vem ativado, então um clique no mapa marca a próxima; “Locais da viagem”, ao lado, transforma um refúgio ou um hotel da viagem em parada.',
  'help.guide.tour-hike-plan.step.2':
    'Abra “Tipo de passeio” e escolha Trilha: a pé, dentro da dificuldade que você definir.',
  'help.guide.tour-hike-plan.tip.3':
    '“Escolha da rota”, abaixo da dificuldade, define preferências para a rota: “Evitar subidas íngremes”, “Evitar escadas” e “Evitar balsas”. Onde não há alternativa, a rota passa por ali mesmo assim.',
  'help.guide.tour-hike-trail-details.step.5':
    'Clique em Piso para ver a mesma rota pelo tipo de chão, do asfalto à terra e à rocha.',
  'help.guide.tour-hike-round.step.2':
    'O cartão “Trilha circular” abre sobre o mapa. Confira o início em De e digite a Distância que você quer. A pílula ao lado mostra a faixa de extensões possíveis para um circuito.',
  'help.guide.tour-hike-compare-ways.title': 'Comparar outros caminhos para um trecho de uma caminhada',
  'help.guide.tour-hike-compare-ways.tip.2':
    'Quando o roteador não conhece outro caminho, o cartão avisa. Quando o roteador não consegue seguir o caminho escolhido, o trecho fica como está e o cartão informa isso.',
  'help.guide.tour-ferrata-add.step.5':
    'O “Resumo do passeio”, à direita, mostra o selo “Trilha via ferrata” com o grau, e o topo do editor avisa “A rota passa por uma via ferrata”.',
  'help.guide.tour-run-plan.step.1': 'Clique em “Planejar novo passeio”, abra “Tipo de passeio” e escolha Corrida.',
  'help.guide.tour-run-plan.tip.3': 'Quando suas distâncias estão em milhas, o ritmo também é por milha.',
  'help.guide.tour-run-ways.tip.1': 'Nada aqui altera a rota da corrida nem o tempo dela.',
  'help.ctx.trip-tour-walk.bullet.5':
    '“Adicionar passeio”, em “Passeios desta viagem”, importa uma rota a pé compartilhada do Google Maps. Na aba Planejado, uma caminhada aberta a partir do dia dela permite marcar as paradas daquele dia.',
  'help.guide.tour-walk-plan.step.6':
    'O “Resumo do passeio”, à direita, mostra “Tempo est.”, Paradas e Planejado, a soma dos dois. Clique em Salvar no fim da coluna da esquerda para guardar a caminhada.',
  'help.guide.tour-walk-sights.step.2':
    'O tema preenche “O que procurar”. Abra para marcar ou desmarcar tipos e escolha até onde procurar em “Até esta distância da rota”.',
  'help.guide.tour-walk-day-times.title': 'Ver chegadas e horários de funcionamento do dia',
  'help.guide.tour-walk-day-times.tip.3':
    'Os horários de funcionamento vêm do OpenStreetMap ou do lugar da viagem a que a parada pertence, e a pílula ao lado indica qual. Confira antes de ir.',
  'help.guide.tour-walk-google-import.step.4':
    'Clique em “Carregar como passeio”. O TREK planeja sozinho o caminho a pé entre as paradas. Clique em Salvar para guardar a caminhada.',
  'help.guide.tour-walk-check-off.step.2':
    'Role até “Paradas do passeio”. Cada parada mostra quanto tempo você fica e, se a caminhada tiver horário de início, quando você chega.',
  'help.ctx.trip-tour-bike.summary':
    'Um passeio de bicicleta aberto no editor da aba Passeios: o perfil usado no cálculo da rota, o tempo de pedalada, o tipo de piso e, em um passeio de mountain bike, o grau de dificuldade das trilhas.',
  'help.guide.tour-bike-profile.step.2': 'Abra o campo “Tipo de passeio” e escolha “Passeio de bicicleta”.',
  'help.guide.tour-bike-profile.tip.3':
    'Onde nenhum caminho para bicicleta chega perto de um ponto, o painel avisa Nenhum caminho para bicicletas chega ao ponto N. Mova o ponto ou abra “Mais ações” no ponto anterior e escolha “Desenhar o próximo trecho à mão”.',
  'help.guide.tour-bike-surfaces.step.4':
    'Em “Tipo de via”, clique em uma linha como “Estrada rural ou florestal” ou “Estrada com trânsito” para ver por onde a rota passa nela.',
  'help.guide.tour-bike-mtb-grades.step.1':
    'Abra o passeio de bicicleta no editor e confira se o Perfil está em MTB. Os graus das trilhas só são lidos nesse perfil.',
  'help.ctx.trip-tour-ski.title': 'Passeios de esqui e inverno',
  'help.guide.tour-ski-plan.goal':
    'Planeje um dia nas pistas, um circuito de esqui de fundo, um passeio de esqui ou uma caminhada com raquetes pelas pistas, teleféricos e trilhas mapeados.',
  'help.guide.tour-ski-plan.tip.2':
    'O pontinho de informação ao lado de Modalidade explica o que o TREK faz com passeios de esqui. Nada ali, nem em qualquer outra parte desta tela, diz algo sobre neve, avalanches ou se pistas, teleféricos e trilhas estão abertos.',
  'help.guide.tour-ski-options.step.3':
    'Em Preferir, escolha “Mais rápida”, “Mais esqui” ou “Mais fácil”. Em Ritmo, escolha Tranquilo, Normal ou Esportivo: isso muda o tempo que o roteador calcula para cada pista.',
  'help.guide.tour-ski-fix-leg.goal': 'Faça um trecho vermelho ser planejado com um clique ou desenhe-o em linha reta.',
  'help.guide.tour-ski-fix-leg.result':
    'Nenhum trecho fica mais vermelho: cada um segue as pistas ou vai em linha reta entre seus pontos.',
  'help.guide.tour-ski-summary.tip.3':
    'Um passeio salvo abre como foi salvo. Mova um ponto ou mude uma opção para recalculá-lo com os dados de pistas atuais.',
  'help.guide.tour-ski-pistes-layer.tip.1':
    'Se o interruptor continuar cinza e mostrar “Aproxime o mapa para ver as pistas”, aproxime o zoom na área de esqui.',
  'help.guide.tour-ski-import.step.3':
    'Escolha a Modalidade e, para “Esqui cross-country”, a Técnica. Até lá, a janela avisa Escolha uma modalidade para importar a trilha como esqui.',
  'help.ctx.trip-tour-paddle.title': 'Passeios de remo',
  'help.guide.tour-paddle-setup.title': 'Planejar um passeio de remo',
  'help.guide.tour-paddle-setup.step.7':
    'Confira se “Adicionar ponto” está ativado e clique no mapa: primeiro o ponto de entrada na água, depois os pontos pelo caminho e o ponto de saída.',
  'help.guide.tour-paddle-water-route.step.1':
    'Um trecho desenhado à mão mostra “Desenhado à mão, sem rota” abaixo do ponto, com a extensão. O TREK mantém a linha como você desenhou.',
  'help.guide.tour-paddle-water-route.tip.4':
    'Não dá para salvar enquanto houver um trecho não planejado. Planeje-o pela água ou desenhe-o à mão antes.',
  'help.guide.tour-paddle-portage.step.5':
    'Em “Saída e entrada”, digite os minutos de que você precisa para sair, descarregar e voltar para a água. Se deixar em branco, o TREK usa 10 minutos.',
  'help.guide.tour-paddle-lock.step.2':
    'Escolha “Eclusa neste ponto”. Um cartão Eclusa aparece abaixo do ponto, marcado como “Falta o tempo”.',
  'help.guide.tour-paddle-time.goal':
    'Veja como se somam o tempo na água, o transporte do barco, as eclusas e as pausas, e defina seus próprios valores.',
  'help.guide.tour-paddle-time.tip.3':
    'As pausas e um total planejado seu são definidos em Detalhes. Com um total planejado, o cartão mostra “Seu total planejado” ao lado da estimativa.',
  'help.guide.tour-paddle-wind.tip.1':
    'Só há previsão para os próximos 16 dias. Para um dia mais distante, o cartão informa a partir de que data a previsão estará disponível. Para um dia que já passou, ele avisa isso.',
  'help.guide.tour-paddle-checklist.step.2':
    'A linha abaixo mostra o quanto os dados estão atualizados: “Data OSM” para o OpenStreetMap, Consultados para quando o TREK os leu, e “Dados de obstáculos” onde eles não cobrem a rota inteira.',
  'help.guide.tour-paddle-checklist.tip.5':
    'Uma lista de verificação não é uma liberação de segurança nem legal. Sua decisão não anula uma proibição nem um terreno particular registrado no OpenStreetMap.',
  'help.guide.tour-paddle-track-marks.step.5':
    'Clique em Transbordo e depois clique na linha onde você saiu da água e onde voltou.',
  'help.ctx.trip-tour-horse.summary':
    'Uma cavalgada nunca tem a rota calculada. Ela é montada com trechos das rotas equestres sinalizadas que o OpenStreetMap conhece, ligados por trechos que você desenha à mão, ou mantida exatamente como você a gravou.',
  'help.guide.tour-horse-plan.step.1':
    'Deixe visível no mapa a área onde você quer cavalgar e clique em “Planejar novo passeio” no topo da coluna da esquerda.',
  'help.guide.tour-horse-plan.tip.1':
    'Uma rota equestre não dá permissão para cavalgar nela. “Acesso a cavalo” só mostra o que está marcado no OpenStreetMap. Siga sempre a sinalização no local.',
  'help.guide.tour-horse-gap.step.2':
    'Ative “Ligar com um trecho manual”. A lacuna é desenhada em linha reta e sem verificação.',
  'help.guide.tour-horse-recorded.goal':
    'Importe uma cavalgada que você gravou em um aparelho de GPS ou em um app e mantenha-a exatamente como foi feita.',
  'help.guide.tour-horse-recorded.tip.3':
    'Você também pode soltar o arquivo em qualquer parte da aba Passeios para abrir a mesma prévia.',
  'help.guide.create-trip.tip.3':
    'Em “Companheiros de viagem”, você pode adicionar pessoas que já têm conta aqui. Elas viram membros da viagem assim que ela é criada.',
  'help.guide.trip-reminder.step.1':
    'Clique no lápis no cartão da viagem. Para uma viagem nova, o formulário “Nova viagem” tem a mesma seção.',
  'help.guide.company-holidays.tip.2':
    'Um feriado da empresa de dia inteiro remove as férias já registradas nesse dia, para que ninguém gaste dias de direito com ele.',
  'help.guide.half-company-holiday.tip.2':
    'Clique de novo no dia com as mesmas configurações para desmarcá-lo, ou com “Meio dia” desativado para transformá-lo em feriado da empresa de dia inteiro.',
  'help.guide.edit-holiday-calendar.step.1':
    'Abra as Configurações e procure o calendário em “Feriados nacionais” ou “Férias escolares”.',
  'help.guide.person-color.goal': 'Dê a você ou a quem planeja com você uma cor mais fácil de distinguir.',
  'help.guide.answer-fusion-request.tip.2':
    'Qualquer um dos dois pode encerrar a fusão depois, e os lançamentos de vocês são mantidos.',
  'help.guide.log-for-partner.tip.2':
    'A pessoa vê a mudança na hora, e a linha dela no cartão Direito é atualizada imediatamente.',
  'help.guide.country-places.title': 'Ver todos os lugares de um país',
  'help.guide.tour-activity-stats.step.1':
    'No painel na parte de baixo do mapa, abra a aba Passeios, ao lado de Estatísticas e “Lista de desejos”.',
  'help.guide.tour-activity-stats.tip.2':
    'Vincule o traçado que você realmente fez com “Adicionar trilha real” nos detalhes do passeio, e os valores gravados substituem os planejados aqui. Um passeio planejado em vários dias conta uma vez só.',
  'help.ctx.collections.bullet.7':
    'Passeios guardados: os passeios que você guardou de uma viagem são as primeiras linhas de uma lista, com grau, tipo, a viagem de origem e as medidas. “Adicionar a uma viagem” cria um passeio novo a partir de um deles, e o ícone de lixeira o remove da lista.',
  'help.guide.move-to-list.title': 'Mover ou duplicar lugares para outra lista',
  'help.guide.copy-to-trip.tip.2':
    'Lugares que a viagem já tem são ignorados, e o TREK informa quantos foram ignorados.',
  'help.guide.accept-list-invite.tip.2':
    'Clique em Compartilhada, no topo da lista, para ver os membros. Ali, “Sair da lista” tira você da lista.',
  'help.guide.tour-collection-add-to-trip.goal':
    'Crie um passeio novo em uma das suas viagens a partir de um passeio salvo em uma lista, com ou sem os pontos de caminho.',
  'help.guide.tour-collection-add-to-trip.result':
    'A janela confirma que o passeio agora pertence a essa viagem. “Abrir viagem” leva você até lá. Encerrar mantém você em Coleções.',
  'help.guide.tour-collection-manage.tip.3':
    'Passeios guardados aparecem só na própria lista, não em “Todos os salvos”.',
  'help.guide.search-journey.step.3':
    'Clique em um dia para rolar até ele, ou na seta dele para listar as entradas desse dia e escolher uma.',
  'help.guide.journey-map-layers.goal':
    'Veja a diferença entre o plano e o que realmente aconteceu, e ligue ou desligue as camadas.',
  'help.guide.journey-keep-route.goal':
    'Coloque no mapa da jornada a rota real de um dia vinda do Dawarich e mantenha-a lá.',
  'help.guide.journey-day-stays.goal': 'Transforme as estadias que o Dawarich registrou em entradas, uma de cada vez.',
  'help.guide.journey-take-over-day.goal':
    'Transforme as estadias de um dia em rascunhos de entradas, ou em um único relato do dia, de uma vez só.',
  'help.guide.journey-auto-prepare.title': 'Deixar o TREK preparar seus dias gravados',
  'help.guide.photo-location.title': 'Localizar as entradas onde as fotos foram tiradas',
  'help.ctx.settings-about.summary':
    'O que é o TREK, a versão que este servidor executa e onde encontrar o projeto: a documentação, onde relatar um bug e as formas de apoiar o projeto.',
  'help.guide.startup.tip.2': 'Uma aba inicial que pertence a um complemento desativado abre o plano em vez dela.',
  'help.guide.web-push-device.title': 'Receber notificações push neste dispositivo',
  'help.guide.connect-airtrail.tip.1':
    'O cartão só aparece enquanto o administrador mantém o complemento AirTrail ativado.',
  'help.guide.connect-dawarich.tip.1':
    'O TREK só sugere entradas, lugares e países; nada é adicionado até você confirmar, e nada é gravado de volta no Dawarich.',
  'help.guide.tour-connect-wanderer.tip.1':
    'O cartão só aparece enquanto o administrador permite o wanderer em Passeios.',
  'help.guide.tour-wanderer-watch.tip.1':
    'Um aviso nunca altera um passeio; a verificação da fonte do passeio mostra o que realmente mudou.',
  'help.guide.api-keys.tip.3':
    'Envie a chave como Authorization: Bearer ou X-API-Key para /api/v1. Cada conta pode ter até 10 chaves.',
  'help.guide.plugin-settings.step.2':
    '“Atividade dos plugins” lista cada ação que um plugin realizou em seu nome, das mais recentes para as mais antigas; Atualizar carrega as últimas.',
  'help.ctx.admin-github.bullet.3':
    'Sobre: Ko-fi, Buy Me a Coffee, Discord, “Reportar um bug”, “Solicitar recurso” e a Wiki.',
  'help.guide.default-user-settings.goal':
    'Dê a todas as contas unidades, tema de cores e moeda adequados, sem que ninguém precise abrir as Configurações.',
  'help.guide.default-map.step.3':
    'Cada campo é salvo quando você sai dele. O link de redefinir ao lado do nome de um campo volta ao valor padrão do TREK.',
  'help.guide.own-routing-engine.tip.2':
    'Com só o seu servidor de rotas definido, o Valhalla público também deixa de ser usado. O link de redefinir ao lado de um campo o limpa de novo.',
  'help.guide.admin-passkeys.step.1': 'Na aba Configurações, em “Login com passkey”, ative “Ativar login com passkey”.',
  'help.guide.storage-backends.step.4':
    'Saúde, no topo, lista as gravações que falharam em um destino de espelho. Se aparecer “Nenhuma falha de réplica registrada.”, está tudo funcionando.',
  'help.guide.channels-instance.tip.3':
    'O Web Push exige HTTPS. No iPhone e no iPad, as pessoas precisam primeiro adicionar o TREK à Tela de Início.',
  'help.guide.notification-defaults.step.1':
    'Na aba Notificações, role até “Padrões para usuários”, no fim. Cada linha é um evento, e cada coluna, um canal.',
  'help.ctx.notifications.bullet.1':
    'O sino no canto superior direito mostra quantas notificações você ainda não leu. Clique nele para ver as dez mais recentes, e em “Ver todas as notificações”, no fim, para abrir esta página.',
  'help.guide.read-notifications.step.2':
    'O painel lista as dez mais recentes. Cada uma diz quem fez o quê e onde, e as não lidas têm o fundo colorido.',
  'help.guide.filter-notifications.step.2': 'No fim do painel, clique em “Ver todas as notificações”.',
  'help.guide.mark-notifications-read.tip.1': 'Abrir uma notificação pelo botão dela também a marca como lida.',
  'help.guide.delete-notifications.tip.2':
    'Uma notificação excluída não pode ser recuperada. Para tirar uma notificação da frente sem perdê-la, marque-a como lida e use “Não lidas”.',
  'help.guide.notification-settings.tip.2':
    'Não há configurações por viagem: cada interruptor vale para todas as suas viagens.',
  'help.guide.link-journal.title': 'Vincular um diário à viagem',
  'help.guide.link-journal.tip.2':
    'A partir daí, as pessoas a quem você deu acesso também veem o diário na própria lista de jornadas.',
  'help.ctx.trip-places.bullet.8':
    'Com o Dawarich conectado, “Do Dawarich”, no topo da lista, mostra as estadias que o Dawarich registrou durante a viagem. “Adicionar como lugar” transforma uma estadia em lugar. “Não é um lugar que visitei” a remove da lista.',
  'help.guide.dawarich-stays.step.4':
    'Se uma estadia não foi uma visita de verdade, clique em “Não é um lugar que visitei”, o x ao lado, para removê-la. “Mostrar … já tratados”, no fim da lista, mostra as estadias que você adicionou ou removeu. “Colocar de volta” devolve uma estadia removida à lista.',
  'help.guide.leave-stop-off-route.tip.1':
    'Só paradas com coordenadas têm essa opção, e ela vale apenas para este dia: o mesmo lugar em outro dia continua na rota.',
  'help.guide.move-booking-day.title': 'Mudar uma reserva de dia',
  'help.guide.place-image-from-file.step.4':
    'A foto agora é a imagem do lugar. Clique no pequeno X vermelho no canto para removê-la.',
  'help.guide.place-own-hours.step.2': 'Abaixo de Site, preencha Telefone e E-mail, se souber.',
  'help.guide.add-accommodation.tip.4':
    'Um jeito mais rápido: o + no cabeçalho do dia, com a dica “Adicionar ao dia”, tem “Adicionar hospedagem”. Ele abre o dia com este formulário já aberto.',
  'help.guide.confirm-stay-booking.goal': 'Marque como confirmada a reserva de hotel de uma estadia, direto pelo dia.',
  'help.guide.map-whole-trip.tip.4':
    'A opção de mostrar a viagem inteira fica salva por viagem na sua conta, então a viagem abre do mesmo jeito em outro navegador.',
  'help.guide.tour-map-lines.step.3':
    'Abra na coluna de dias um dia em que o passeio está, e ele passa a fazer parte da rota do dia: a rota vai até onde o passeio começa e continua de onde ele termina.',
  'help.guide.car-stops.goal':
    'Defina para um carro alugado ou para o seu próprio carro a retirada, a devolução e os lugares onde você para no caminho.',
  'help.guide.car-stops.tip.1':
    'Não existe um tipo separado para aluguel: carro alugado e carro próprio são ambos Carro.',
  'help.guide.transport-details.result':
    'O Planejado abre no dia do trajeto, com a linha dele desenhada no mapa e o ícone de rota da linha ativado.',
  'help.guide.export-transports-csv.step.2':
    'Clique no ícone de planilha depois de “Opções de visualização”, com a dica “Exportar como planilha (CSV)”.',
  'help.guide.group-sort-bookings.title': 'Agrupar e ordenar as reservas',
  'help.guide.group-sort-bookings.tip.2':
    'Na “Linha do tempo”, o mesmo botão traz “Uma faixa por tipo” e “Mostrar a outra aba”.',
  'help.guide.booking-on-map.result':
    'Os detalhes fecham, e a aba Planejado abre no dia da reserva, com o lugar dela selecionado no mapa.',
  'help.guide.export-bookings-csv.step.1':
    'Para exportar só parte da aba, filtre antes com Buscar ou Filtrar. O arquivo traz exatamente o que a aba mostra.',
  'help.guide.import-booking-file.tip.4':
    'Ler uma confirmação exige conexão. Offline, Importar avisa isso, e você tenta de novo quando o TREK voltar a ficar online.',
  'help.guide.arrange-packing-list.step.1':
    'Arraste a alça na ponta esquerda do cabeçalho de uma lista, antes do ponto colorido, e solte a lista sobre outro cartão. Um contorno na sua cor de destaque indica o cartão de destino, e a lista assume o lugar desse cartão para todos da viagem.',
  'help.guide.count-packed-pieces.title': 'Embalar várias peças de uma coisa',
  'help.guide.count-packed-pieces.tip.2':
    'Com “Rastreamento de malas” ativado, “Na mala”, no cartão Malas, conta só as peças já contadas.',
  'help.guide.packing-bags.tip.4':
    'O peso de uma bolsa levada por várias pessoas é dividido igualmente entre elas em “Por pessoa”. Esse peso aparece sublinhado com pontos e mostra uma explicação quando você aponta para ele.',
  'help.guide.expense-receipts.step.1':
    'Clique no lápis ao lado da linha da despesa. O editor abre nela, com “Comprovantes e notas” perto do fim.',
  'help.guide.expense-receipts.tip.3':
    'Anexar exige conexão e permissão para enviar arquivos, porque o comprovante fica guardado como um dos arquivos da viagem.',
  'help.guide.files-sync-settings.title': 'Escolher o sentido da sincronização dos documentos',
  'help.guide.files-sync-settings.tip.1':
    'Uma faixa sempre fica ativada: clicar na única faixa que ainda está ativada não faz nada.',
  'help.guide.manage-notes.title': 'Ler, fixar e editar uma nota',
  'help.guide.manage-notes.tip.1':
    'Expandir só aparece no menu quando a nota tem texto. Um membro sem permissão para editar o Colab vê só Expandir.',
  'help.guide.note-categories.step.5':
    'Clique em Salvar. Todas as notas de uma categoria renomeada ou com nova cor mudam na hora, para todos os membros. Cancelar descarta suas alterações.',
  'help.guide.trip-chat.tip.5':
    'O chat mostra as mensagens mais recentes primeiro. “Carregar mensagens antigas”, no topo do chat, carrega as anteriores.',
  'help.guide.roadtrip-reorder.result':
    'As paradas ficam na ordem que você definiu, e a distância, o tempo de direção e os horários de chegada de cada dia alterado são recalculados.',
  'help.guide.roadtrip-overnight.goal':
    'Encontre um lugar para dormir na estrada e adicione a noite ao percurso como reserva.',
  'help.guide.roadtrip-overnight.tip.2':
    'Voltar uma noite reservada para Pausa, por Editar no cartão dela, pergunta antes “Remover a pernoita?”. “Tornar uma pausa” remove a noite, com a reserva e qualquer despesa vinculada, e mantém a parada no percurso.',
  'help.guide.roadtrip-stop-fill.tip.2':
    'Se você escolher o valor que a parada já tem, ela volta a usar o seu valor padrão.',
  'help.guide.roadtrip-bookings.tip.1':
    'O horário no terminal é marcado antes do horário oficial, para dar tempo do check-in: uma hora para voo ou cruzeiro, meia hora para balsa, dez minutos para trem ou ônibus.',
  'help.guide.roadtrip-google-import.step.2':
    'Cole o link de uma rota que você compartilhou do Google Maps e clique em Pré-visualização.',
  'help.guide.roadtrip-hazards.goal': 'Veja no mapa os alertas de clima e de desastres na região do seu percurso.',
  'help.ctx.trip-tours.title': 'Passeios no plano',
  'help.guide.tour-show-list.title': 'Mostrar os passeios da viagem no plano',
  'help.guide.tour-show-list.tip.2':
    'Ainda não tem passeios? “Importar GPX ou KML”, no topo da lista, importa um arquivo, e “Planejar novo passeio”, na aba Passeios, cria um novo.',
  'help.guide.tour-add-to-day.step.4':
    'Ou arraste a linha para fora da lista e solte em um dia na coluna da esquerda. Se soltar entre duas paradas, ela fica ali.',
  'help.guide.tour-day-times.goal':
    'Veja quando um passeio termina e se ele se sobrepõe ao que vem depois naquele dia.',
  'help.guide.tour-day-times.tip.4':
    '“Salvar na Coleção”, no mesmo menu, guarda o passeio em uma coleção com a rota, como faz o botão Coleção do cartão.',
  'help.guide.tour-remove-from-day.tip.2':
    'Não há Excluir nesses menus nem no cartão. Um passeio é excluído na aba Passeios, pela lixeira na linha dele em “Passeios desta viagem”.',
  'help.guide.tour-filter-list.tip.1':
    '“Limite de rota” é a dificuldade máxima permitida no planejamento da rota, não a dificuldade medida na trilha.',
  'help.guide.tour-hide-on-map.step.3':
    'Enquanto houver algum passeio oculto, uma linha acima da lista mostra “Oculto no mapa”, com quantos são. “Mostrar todos” volta a exibir todos de uma vez.',
  'help.guide.tour-import-plan-tab.step.3':
    'A “Prévia da importação” mostra cada traçado antes de salvar qualquer coisa. Em “Importar como”, escolha o tipo (Trilha, “Passeio de bicicleta” e assim por diante) e clique em Importar 1 passeio.',
  'help.ctx.trip-tour-detail.bullet.3':
    'Abaixo vêm “Dias da viagem”, com um bloco para cada dia em que o passeio está, as medidas com o perfil de elevação e, conforme o caso: as estações de uma caminhada urbana, as verificações e o vento de um passeio de remo, “Trilha real”, “Lista de mala”, Descrição, Notas, Origem e Arquivos.',
  'help.guide.tour-detail-read.step.4':
    '“Dias da viagem” mostra um bloco para cada dia em que o passeio está, com a data. Ainda não está em nenhum dia da viagem significa que ele ainda não foi planejado.',
  'help.guide.tour-detail-read.tip.5':
    'No celular, o cartão abre como uma folha que sobe da parte de baixo, para ler e para levar o passeio com você.',
  'help.guide.tour-rename-colour.tip.1':
    'O nome e a cor pertencem à viagem, então todos nela os veem. Para ocultar um passeio só no seu mapa, sem mudá-lo para ninguém, use o olho na lista de Passeios.',
  'help.guide.tour-take-along.tip.1':
    'Em um dispositivo que compartilha arquivos, Compartilhar aparece ao lado de GPX e envia o mesmo arquivo direto para outro app.',
  'help.guide.tour-copy-keep.step.2':
    'A cópia abre na hora, com o nome do original seguido de (cópia). Clique no lápis para dar um nome próprio a ela.',
  'help.guide.tour-packing-link.title': 'Vincular um passeio à lista de mala',
  'help.guide.tour-packing-link.tip.2':
    'Trocar, no cabeçalho da seção, vincula o passeio a outra lista. “Remover vínculo”, nessa janela, remove o vínculo, e a lista continua igual.',
  'help.guide.tour-files.tip.1': 'Esses arquivos também são arquivos da viagem, então aparecem também na aba Arquivos.',
  'help.guide.tour-activity-link.step.4': 'Confira o que ele mediu em Real e clique em Vincular.',
  'help.guide.tour-activity-compare.step.1':
    'Abra o cartão do passeio. “Plano e real” mostra Distância, “Ganho de elevação”, “Perda de elevação” e “Tempo com pausas” do plano ao lado dos valores do traçado, com a Diferença.',
  'help.guide.tour-origin-check.goal':
    'Descubra se um passeio foi desenhado no TREK ou importado, de qual arquivo, e se foi alterado desde então.',
  'help.ctx.trip-tour-planner.title': 'Passeios',
  'help.guide.tour-open-workspace.title': 'Conhecer a aba Passeios',
  'help.guide.tour-open-workspace.step.7':
    'Clique em um passeio no painel da direita. Um passeio planejado no TREK abre no editor. Um traçado importado abre sem alterações, como “Passeio GPX”, só para visualização.',
  'help.guide.tour-draw-route.step.2':
    'Digite onde o passeio começa em “Buscar lugar ou endereço” e escolha o resultado. O mapa vai até lá.',
  'help.guide.tour-draw-route.tip.4':
    'Um rascunho não salvo fica guardado. Abra de novo a aba Passeios da viagem, e ele é restaurado com o aviso “Rascunho não salvo restaurado”.',
  'help.guide.tour-type-profile.tip.1':
    'Uma troca de tipo conta como um passo no histórico: “Desfazer edição do ponto de passagem”, no topo do painel, traz de volta o tipo anterior e a rota dele.',
  'help.guide.tour-edit-points.step.4':
    'Ou abra “Mais ações” (os três pontos) na linha e escolha “Mover ponto de passagem para cima” ou “Mover ponto de passagem para baixo”.',
  'help.guide.tour-shaping-points.step.1':
    'Clique na rota desenhada no mapa, no ponto por onde ela deve passar de outro jeito. Ali aparece um pontinho: um ponto de forma.',
  'help.guide.tour-loop-reverse.title': 'Fazer um circuito ou inverter o passeio',
  'help.guide.tour-loop-reverse.result': 'Um circuito que termina onde começou, ou o mesmo passeio no sentido oposto.',
  'help.guide.tour-leg-by-hand.tip.2':
    'Um ponto que nenhum caminho alcança mostra um aviso com “Mostrar ponto” e o número dele. Mova o ponto para um caminho ou desenhe à mão o trecho até ele.',
  'help.guide.tour-trip-places.tip.1':
    'Um lugar que já está no passeio aparece marcado como “No passeio” e não pode ser escolhido duas vezes.',
  'help.guide.tour-details-times.step.3': 'Informe as Pausas, por exemplo 0:45. Elas são somadas ao tempo estimado.',
  'help.guide.tour-save.step.1': 'Digite um nome em “Nome do passeio”. Sem nome, Salvar fica cinza.',
  'help.guide.tour-edit-saved.title': 'Alterar um passeio salvo',
  'help.guide.tour-edit-saved.tip.3':
    '“Baixar GPX” e “Guardar em uma coleção”, no topo do painel, funcionam depois que as alterações estão salvas.',
  'help.guide.tour-summary-profile.tip.1': 'Clique no título do cartão para recolher o resumo inteiro.',
  'help.guide.tour-list-manage.step.3':
    'Escolha o dia. O passeio é adicionado a esse dia, e a linha dele mostra o dia.',
  'help.guide.tour-delete.goal': 'Remova um passeio da viagem de vez.',
  'help.guide.tour-saved-elsewhere.goal':
    'Decida o que acontece quando outra pessoa salvou o passeio enquanto você o alterava.',
  'help.ctx.trip-tour-import.title': 'Importar passeios',
  'help.guide.tour-import-gpx.goal':
    'Transforme um traçado de um relógio GPS, de um app ou do Google Earth em um passeio da viagem, conferido antes de salvar qualquer coisa.',
  'help.guide.tour-import-gpx.tip.3':
    'Um traçado que a viagem já tem aparece em cinza como “Já está na viagem” e é ignorado.',
  'help.guide.tour-view-import.step.3': '“Voltar aos passeios”, a seta no canto superior esquerdo, o fecha.',
  'help.guide.tour-plan-from-import.step.2':
    'O TREK pega pontos de controle do traçado e recalcula a rota entre eles. O mapa mostra a importação pontilhada e a sugestão em linha contínua, e o cartão compara as extensões, a parte que fica a até 50 m do traçado e o “Maior desvio”.',
  'help.guide.tour-restore-recorded.title': 'Voltar ao traçado gravado',
  'help.guide.tour-take-over.title': 'Trazer um passeio de outra viagem',
  'help.guide.tour-take-over.tip.1':
    'A cópia é um passeio separado. Ela ainda não está em nenhum dia, e mudanças posteriores no original não afetam a cópia, nem o contrário. A Origem mostra de qual viagem ela foi trazida.',
  'help.guide.tour-import-wanderer.step.3':
    'Clique em uma trilha. Ela aparece no mapa, e a coluna mostra as medidas do arquivo GPX, a descrição e se ela é pública ou particular no wanderer.',
  'help.ctx.trip-tour-map.summary':
    'O mapa no centro da aba Passeios, para o passeio aberto: os mapas adequados ao tipo dele, as pistas ou os sinais náuticos sobrepostos, os lugares ao longo da rota e o mesmo passeio em 3D sobre a paisagem real.',
  'help.guide.tour-map-layers.step.1':
    'Abra a aba Passeios e clique em um passeio em “Passeios desta viagem”, à direita. Ele abre no planejador, e a pílula no canto inferior esquerdo do mapa lista os mapas que esse tipo de passeio oferece.',
  'help.guide.tour-along-search.goal':
    'Procure mirantes, água, refúgios ou um lugar para comer perto da rota do passeio que você está planejando.',
  'help.guide.tour-along-search.tip.2':
    'Em uma caminhada urbana, quatro temas acima da lista já selecionam os tipos certos para você.',
  'help.guide.tour-along-add-stop.result':
    'O passeio agora passa pelo lugar, com a nova distância e o novo tempo no “Resumo do passeio”. Salve o passeio para manter a alteração.',
  'help.guide.tour-3d-terrain.step.3':
    'Clique na pílula “Distribuição da inclinação”, à direita. Ela se expande e mostra quanto do passeio fica em “menos de 5 %”, “de 5 a 10 %”, “de 10 a 18 %”, “de 18 a 27 %” e “27 % ou mais”. Recolhida, mostra o ponto mais alto e o trecho mais íngreme.',
  'help.guide.tour-3d-flyover.goal':
    'Assista ao passeio inteiro, do início ao fim, antes de caminhar, pedalar ou esquiar nele.',
  'help.guide.tour-3d-flyover.tip.3':
    'Com o voo pausado, percorra o perfil de elevação para levar o marcador a esse ponto. “Reproduzir sobrevoo” continua dali.',
  'help.guide.tour-map-overlays.tip.1':
    'As pistas são dados de mapeamento, não um boletim em tempo real: não dizem nada sobre o que está aberto ou preparado, sobre a neve ou sobre avalanches. Quando você afasta o zoom para além da área de esqui, o interruptor mostra “Aproxime o mapa para ver as pistas”.',
  'help.ctx.trip-tour-stages.bullet.4':
    'Em “Passeios desta viagem”, um passeio de vários dias mostra uma lua com o número de etapas. Esse botão, “Mostrar etapas”, expande a lista de etapas, com o dia de cada uma e os totais do “Roteiro completo”.',
  'help.guide.tour-multi-day.step.5':
    'O “Resumo do passeio” lista cada etapa em Etapas. Clique em uma para ver onde ela termina: a última parada dela é selecionada, e o perfil de elevação marca o ponto.',
  'help.guide.tour-stages-on-days.goal': 'Coloque cada etapa em um dia próprio, ou o passeio inteiro em um único dia.',
  'help.guide.tour-stages-on-days.tip.2':
    '“Roteiro completo neste dia” fica cinza em um dia que já tem o passeio. “Etapas a partir deste dia” continua funcionando ali e substitui o passeio inteiro nesse dia.',
  'help.ctx.trip-tour-hike.bullet.3':
    'O cabeçalho do cartão “Pontos de caminho” reúne as ferramentas de rota: “Inverter o sentido”, “Voltar ao início” e, em uma caminhada, “Trilha circular a partir do início”. “Mais ações”, em uma parada, tem “Comparar caminhos do próximo trecho”.',
  'help.guide.tour-hike-plan.step.3': 'Digite um nome em “Nome do passeio”.',
  'help.guide.tour-hike-plan.tip.4':
    'O tempo de caminhada segue a regra das placas de trilha (DIN 33466) e não inclui pausas. Adicione as pausas em Pausas, em Detalhes, e elas aparecem no total planejado.',
  'help.guide.tour-hike-trail-details.result':
    'Você sabe que grau tem cada parte da caminhada, qual é o piso e onde cada trecho fica no mapa.',
  'help.guide.tour-hike-round.step.3':
    'Clique em “Buscar voltas”. Volta A, Volta B e assim por diante aparecem na lista e no mapa, cada uma na própria cor.',
  'help.guide.tour-hike-compare-ways.goal':
    'Veja que outros caminhos uma caminhada poderia seguir entre duas paradas e escolha um deles.',
  'help.guide.tour-hike-compare-ways.tip.3': 'Cancelar fecha o cartão sem mudar a rota.',
  'help.guide.tour-ferrata-add.result':
    'A caminhada segue a via ferrata pela linha própria dela no OpenStreetMap. Clique no mapa para continuar a partir do topo. O roteador planeja só o caminho até a via ferrata e o caminho depois dela.',
  'help.guide.tour-run-plan.step.2':
    'Escolha um Perfil: Corrida, para caminhos quase todos pavimentados na cidade, em parques e à beira de rios, ou “Corrida em trilha”, para estradas de terra na mata e trilhas naturais.',
  'help.guide.tour-run-plan.tip.4':
    '“Corrida em trilha” usa caminhos até o nível de trilha de montanha (T2), nunca mais difíceis.',
  'help.guide.tour-run-ways.tip.2':
    'Mude o Perfil para “Corrida em trilha” para a rota usar mais trilhas naturais, ou para Corrida para mantê-la em chão firme.',
  'help.guide.tour-walk-plan.title': 'Planejar uma caminhada urbana de parada em parada',
  'help.guide.tour-walk-plan.tip.1':
    'O anel em volta do número de uma parada mostra a importância: contínuo para Imperdível, tracejado para Opcional. Um pequeno escudo marca uma parada Protegida.',
  'help.guide.tour-walk-sights.step.3':
    'Clique em “Buscar ao longo do passeio”. Uma estrela antes de um nome indica um Destaque, um dos lugares mais conhecidos da região.',
  'help.guide.tour-walk-day-times.goal':
    'Saiba quando você chega a cada parada no dia da caminhada e quais lugares estarão fechados nesse horário.',
  'help.guide.tour-walk-day-times.tip.4':
    'Duas caminhadas no mesmo dia: na aba Planejado, clique no trecho entre elas (“Alterar meio de transporte”) e escolha “Transporte público”. A busca começa onde a primeira caminhada termina, no horário em que ela termina, e avisa se uma conexão chega depois do início da próxima caminhada.',
  'help.guide.tour-walk-google-import.tip.1':
    'Só rotas planejadas a pé são lidas. Mude o Google Maps para o modo a pé antes de compartilhar.',
  'help.guide.tour-walk-check-off.step.3':
    'Clique em “Marcar como visitado” em uma parada que você já viu, ou em Pular em uma que vai deixar de fora.',
  'help.ctx.trip-tour-bike.bullet.1':
    'Perfil, abaixo de “Tipo de passeio”, define para que tipo de pedalada o roteador planeja: Cicloturismo, Estrada, Gravel ou MTB. A linha abaixo explica o que o roteador procura, e mudar o perfil recalcula a rota inteira.',
  'help.guide.tour-bike-profile.step.3':
    'Em Perfil, escolha Cicloturismo, Estrada, Gravel ou MTB. A linha abaixo explica o que o roteador procura com esse perfil.',
  'help.guide.tour-bike-profile.tip.4':
    'Salvar fica cinza até o passeio ter um nome e a rota e as altitudes estarem calculadas.',
  'help.guide.tour-bike-surfaces.result':
    'O mapa destaca os trechos da linha que você escolheu, e você sabe por quais pisos a rota passa. O passeio em si não muda.',
  'help.guide.tour-bike-mtb-grades.step.2':
    'No cartão “Piso e vias”, veja “Grau da trilha (mtb:scale)”: a parte da rota de S0, sem dificuldade especial, até S4 ou mais, terreno para especialistas.',
  'help.ctx.trip-tour-ski.summary':
    'Um passeio do tipo “Esqui e inverno” na aba Passeios: um dia nas pistas, um circuito de esqui de fundo, um passeio de esqui, uma caminhada com raquetes ou uma caminhada de inverno. Os trechos seguem as pistas, teleféricos e trilhas mapeados no OpenStreetMap, planejados pelo roteador de pistas para a sua modalidade e os seus limites, e um traçado de esqui gravado é importado com a modalidade dele.',
  'help.guide.tour-ski-plan.step.1':
    'Na aba Passeios, clique em “Planejar novo passeio” no topo do painel da esquerda.',
  'help.guide.tour-ski-plan.tip.3':
    'Mudar a modalidade depois mantém seus pontos e recalcula os trechos com as opções dessa modalidade.',
  'help.guide.tour-ski-options.step.4':
    'Use os interruptores: “Usar teleféricos”, “Permitir rotas freeride”, “Descer de teleférico se preciso” e “Evitar ligações supostas”. “Esqui cross-country” acrescenta “Só trilhas preparadas” e “Só trilhas iluminadas”, e “Esqui de travessia” acrescenta “Subir pela borda da pista”.',
  'help.guide.tour-ski-fix-leg.step.1':
    'Um trecho que o roteador não conseguiu planejar mostra uma linha vermelha abaixo do ponto, com o motivo, por exemplo Só um teleférico que você excluiu liga estes pontos, e a pista ou o teleférico em questão.',
  'help.guide.tour-ski-summary.title': 'Ler a rota pelas pistas de um passeio de esqui',
  'help.guide.tour-ski-summary.tip.4':
    'O fim do cartão mostra as áreas de esqui e a data dos dados de mapa usados no planejamento.',
  'help.guide.tour-ski-pistes-layer.tip.2':
    'Se as pistas pararem de carregar, o interruptor mostra um sinal de alerta. O mapa e a sua rota continuam funcionando.',
  'help.guide.tour-ski-import.step.4': 'Clique em Importar 1 passeio.',
  'help.ctx.trip-tour-paddle.summary':
    'Um passeio de caiaque, canoa ou SUP em rio ou lago. Ele indica o barco e o tipo de água, segue a água onde o TREK tem dados, inclui transbordos e eclusas no tempo e mostra o vento no dia em que você rema e o que se sabe sobre os obstáculos pelo caminho.',
  'help.guide.tour-paddle-setup.goal':
    'Comece um passeio de caiaque, canoa ou SUP e informe com que barco, em que água e em que velocidade você vai remar.',
  'help.guide.tour-paddle-setup.tip.1':
    'Com Barco em Outro, não há velocidade sugerida. Informe uma, senão o tempo na água fica em branco.',
  'help.guide.tour-paddle-water-route.step.2':
    'Para planejar um trecho pela água, aponte para a parada antes dele e clique em “Mais ações”, os três pontos.',
  'help.guide.tour-paddle-water-route.result':
    'Cada trecho segue a água ou foi desenhado à mão de propósito, e um trecho que o TREK não conseguiu planejar mostra o motivo.',
  'help.guide.tour-paddle-portage.tip.1':
    'Para remar o trecho, afinal, abra de novo “Mais ações” no ponto e escolha “Remar este trecho de novo”. Ele volta a ser um trecho desenhado à mão.',
  'help.guide.tour-paddle-lock.step.3': 'Clique no cartão Eclusa para abri-lo.',
  'help.guide.tour-paddle-time.step.1':
    '“Estimativa de tempo” fica na coluna da esquerda, abaixo dos pontos de caminho. O selo no cabeçalho é o total, com as pausas incluídas.',
  'help.guide.tour-paddle-time.result': 'A estimativa considera o que você informou e mostra o que ainda falta.',
  'help.guide.tour-paddle-wind.tip.2':
    'Um passeio de vários dias mostra um chip Dia para cada dia no cabeçalho do cartão. Clique em um para ver esse dia.',
  'help.guide.tour-paddle-checklist.step.3':
    'As entradas seguem a rota: barragens, eclusas, corredeiras, pontos de entrada e regras de acesso do OpenStreetMap, além dos seus próprios transbordos e eclusas, marcados como Próprio.',
  'help.guide.tour-paddle-checklist.result': 'Cada entrada da rota tem uma decisão, e você leu o aviso de segurança.',
  'help.guide.tour-paddle-track-marks.step.6': 'Clique em Eclusa e depois clique na linha onde fica a eclusa.',
  'help.ctx.trip-tour-horse.bullet.1':
    'Defina “Tipo de passeio” como “Passeio a cavalo” no editor, e o cartão “Rotas equestres” aparece na coluna da esquerda. “Buscar na área do mapa” lista as rotas visíveis no mapa.',
  'help.guide.tour-horse-plan.step.2':
    'Clique no campo “Tipo de passeio”, abaixo de “Nome do passeio”, e escolha “Passeio a cavalo”. O cartão “Rotas equestres” aparece abaixo de “Pontos de caminho”.',
  'help.guide.tour-horse-plan.tip.2':
    'O TREK não calcula tempo de cavalgada. Informe um em Planejado, em Detalhes, se quiser um horário no dia.',
  'help.guide.tour-horse-gap.step.3':
    'Clique em “Adotar trecho”. Enquanto o interruptor não estiver ativado, o botão fica cinza.',
  'help.guide.tour-horse-recorded.step.1':
    'Em “Passeios desta viagem”, clique em “Adicionar passeio” (o +), escolha “Importar GPX ou KML” e selecione o arquivo da sua cavalgada.',
  'help.guide.dateless-trip.title': 'Planejar uma viagem sem datas',
  'help.guide.trip-reminder.step.2':
    'Em Lembrete, escolha 1, 3 ou 9 dias. Para outra antecedência, clique em Personalizado e digite um número de dias entre 1 e 30.',
  'help.guide.upcoming-reservations.title': 'Ir direto para as próximas reservas',
  'help.guide.half-company-holiday.title': 'Marcar meio feriado da empresa',
  'help.guide.edit-holiday-calendar.step.2':
    'Clique no quadrado de cor para escolher uma nova cor, ou digite um novo rótulo e pressione Enter.',
  'help.guide.person-color.step.1': 'No cartão Pessoas, clique no ponto colorido antes do nome.',
  'help.guide.answer-fusion-request.title': 'Responder a um pedido de fusão',
  'help.guide.log-for-partner.title': 'Registrar dias para quem planeja com você',
  'help.guide.dissolve-fusion.title': 'Parar de planejar juntos',
  'help.guide.country-places.goal':
    'Liste os lugares que o TREK conta para um país, para conferir o que você fez lá ou encontrar um lugar que o TREK atribuiu ao país errado.',
  'help.guide.regions.tip.3':
    '“Adicionar à lista de desejos” também funciona para uma região. Ela aparece com o mesmo hachurado de um país da sua lista de desejos.',
  'help.guide.tour-activity-stats.step.2':
    'Escolha um período e um tipo nas duas pílulas à esquerda. Período oferece “Desde sempre”, “Este ano”, “Últimos 12 meses” e cada ano anterior em que você tem passeios; Tipo restringe os números a um tipo de passeio, ou “Todos os tipos”.',
  'help.guide.tour-activity-stats.tip.3':
    'Um dia com participantes definidos conta só para eles; um dia sem ninguém definido conta para todos da viagem. A aba carrega dados ao vivo e precisa de conexão com a internet.',
  'help.guide.move-to-list.goal':
    'Reorganize suas listas movendo lugares de uma para outra ou copiando-os para uma segunda lista.',
  'help.guide.accept-list-invite.result':
    'A lista aparece em Compartilhada, no painel, e abre com os lugares. As alterações feitas pelos membros aparecem ao vivo.',
  'help.guide.tour-collection-add-to-trip.step.1':
    'Abra a lista. Os passeios guardados são as primeiras linhas, acima dos lugares. Clique em “Adicionar a uma viagem” no passeio, ou na própria linha.',
  'help.guide.tour-collection-manage.title': 'Encontrar e remover passeios guardados',
  'help.guide.tour-collection-manage.result': 'O passeio sai da lista, e uma breve mensagem confirma.',
  'help.guide.entry-draft.title': 'Manter uma entrada como rascunho',
  'help.guide.journey-map-layers.step.1':
    'No topo do mapa, a barra de camadas tem Planejado, Gravado, Entradas e Fotos, cada uma com sua contagem. Clique em uma para ocultá-la ou mostrá-la.',
  'help.guide.journey-keep-route.step.1': 'No cabeçalho do dia, clique no botão do Dawarich, “Trazer a gravação”.',
  'help.guide.journey-day-stays.step.1':
    'Um dia com estadias para revisar termina com uma linha como 4 estadias do Dawarich e o intervalo de horário. Clique nela para ver as estadias.',
  'help.guide.journey-take-over-day.step.1':
    'Clique em “Importar dia” no fim da linha de estadias do dia, ou no botão de lista no cabeçalho do dia, que mostra quantas estadias estão aguardando.',
  'help.guide.journey-auto-prepare.goal':
    'Deixe as estadias de cada dia prontas para revisão automaticamente enquanto uma viagem está em andamento.',
  'help.guide.photo-location.goal': 'Coloque as entradas no mapa sem precisar pesquisar um lugar para cada uma.',
  'help.ctx.settings-about.bullet.1': 'A versão que este servidor executa aparece ao lado do título.',
  'help.guide.readability.tip.3':
    'Legibilidade está marcada como Experimental. Se algo parecer errado, clique em “Restaurar padrões”, no fim da aba, para voltar às configurações padrão.',
  'help.guide.web-push-device.goal':
    'Veja as notificações do TREK no celular ou no computador mesmo com o TREK fechado.',
  'help.guide.connect-airtrail.tip.2':
    'A chave é guardada criptografada e nunca mais aparece; pontos no campo indicam que há uma chave salva.',
  'help.guide.connect-dawarich.tip.2':
    'Abaixo dos botões, o cartão mostra quando o TREK verificou pela última vez e o que a sua versão do Dawarich não oferece.',
  'help.guide.tour-connect-wanderer.tip.2':
    'Uma instância em endereço privado pode exigir que o administrador permita redes internas.',
  'help.guide.tour-wanderer-watch.tip.2':
    'Pausado até significa que o wanderer não respondeu; “Token recusado” significa que o token precisa passar em um teste de conexão ou ser substituído por um novo.',
  'help.guide.plugin-settings.result':
    'O plugin funciona com as suas configurações, e cada ação que ele realiza por você aparece em “Atividade dos plugins”.',
  'help.ctx.admin-defaults.bullet.3':
    'O link de redefinir ao lado de um campo que você definiu volta ao padrão do TREK. A configuração do próprio usuário sempre tem prioridade sobre estas.',
  'help.ctx.admin-settings.bullet.5':
    'Zona de perigo: “Rotacionar segredo JWT” desconecta todos os usuários, inclusive você.',
  'help.guide.default-user-settings.step.1':
    'Em “Configurações padrão do usuário”, escolha “Tema de cores” (Claro, Escuro ou Automático), “Unidade de temperatura”, “Unidade de distância”, “Formato de hora”, “Semana começa em”, a “Moeda de exibição” e se “Ocultar códigos de reserva” fica ativado ou desativado. Cada escolha é salva na hora.',
  'help.guide.admin-passkeys.step.2':
    'Informe o “Relying Party ID (domínio)”, como trek.example.org, e as “Origens permitidas” pelas quais o seu TREK é acessado, e clique em Salvar. Deixe os dois em branco para usar APP_URL.',
  'help.guide.rotate-jwt-secret.title': 'Desconectar todos de uma vez',
  'help.guide.notification-defaults.step.2':
    'Clique em uma célula para passá-la ao próximo estado: Ligado, Desligado, Bloqueado. A dica mostra o próximo estado, e cada clique salva na hora.',
  'help.ctx.notifications.bullet.2':
    'Todos e “Não lidas”, no topo, alternam entre todas as notificações e só as que você ainda não leu. A lista carrega mais conforme você rola.',
  'help.guide.read-notifications.step.3':
    'Clique no botão abaixo de uma notificação, aqui “Ver Vacay”, para abrir aquilo a que ela se refere. Isso também a marca como lida.',
  'help.guide.filter-notifications.step.3':
    'Clique em “Não lidas” para ver só as notificações que você ainda não leu. Todos volta a mostrar todas.',
  'help.guide.mark-notifications-read.tip.2':
    'Marcar como lida só muda a cor de fundo e a contagem. A notificação continua na lista até você excluí-la.',
  'help.guide.delete-notifications.result': 'A notificação sai da lista e do sino.',
  'help.guide.notification-settings.result':
    'As Configurações abrem em Notificações, com um interruptor para cada evento e canal.',
  'help.guide.link-journal.goal':
    'Mostre um dos seus diários da Jornada dentro da viagem, para as pessoas que você escolher.',
  'help.guide.link-journal.tip.3':
    'Depois, Diário, nas “Configurações da viagem”, tem “Editar acesso”, “Trocar diário” e Desvincular. Desvincular remove a aba; as pessoas que você adicionou no próprio diário mantêm o acesso.',
  'help.guide.dawarich-stays.result':
    'A estadia vira um lugar da viagem, no dia escolhido ou em “Não planejados”, e o painel a marca como concluída.',
  'help.ctx.trip-days.bullet.7': 'Durante a viagem, o plano abre no dia de hoje e rola até ele.',
  'help.guide.leave-stop-off-route.tip.2': '“Remover do dia” tira a parada do dia; “Tirar da rota” a mantém no plano.',
  'help.guide.move-booking-day.goal':
    'Mude um transporte ou uma reserva de dia direto pelo plano, sem abrir o formulário.',
  'help.guide.place-image-from-file.result':
    'A foto passa a ser a imagem do lugar no cartão, na coluna de lugares, no dia e no mapa.',
  'help.guide.place-own-hours.step.3':
    '“Horário de funcionamento”, logo abaixo, mostra a semana, com uma linha por dia. Se o TREK encontrou horários para o lugar, eles já vêm preenchidos; senão, clique antes em “Adicionar horário de funcionamento”. Digite quando o lugar abre e fecha em cada dia e clique em Encerrada nos dias em que não abre.',
  'help.guide.add-accommodation.tip.5':
    'Trilhas GPX e lugares de passeios nunca aparecem como opção de hospedagem, só os lugares comuns da viagem.',
  'help.guide.confirm-stay-booking.step.1':
    'Abra o dia do check-in. No cartão da estadia, em Reserva, aparece a reserva de hotel daquela noite, com Pendente ou Confirmada. Clique nessa caixa.',
  'help.guide.tour-map-lines.step.4':
    'Para tirar um passeio do mapa, mude a coluna da direita para Passeios, aponte para o passeio e clique no olho, “Ocultar no mapa”. A linha e o alfinete dele somem do mapa, e a linha continua na lista, esmaecida, com um olho riscado, “Mostrar no mapa”, que o exibe de novo.',
  'help.guide.car-stops.step.1':
    'No cabeçalho do dia em que você retira o carro, clique no +, com a dica “Adicionar ao dia”, e escolha “Adicionar transporte”.',
  'help.guide.car-stops.tip.2':
    '“Mover para cima” e “Mover para baixo” só aparecem quando o percurso tem duas paradas ou mais.',
  'help.guide.transport-details.title': 'Abrir um transporte e usar os detalhes',
  'help.guide.transport-details.tip.1':
    'Clicar de novo em “No mapa”, em um trajeto com a linha desenhada, oculta a linha.',
  'help.guide.export-transports-csv.result':
    'Seu navegador salva um arquivo com o nome da viagem, como autumn-in-japan-transports.csv, com uma linha por trajeto: Tipo, Título, Status, Início, Fim, De, Para, Localização, Confirmação e Notas.',
  'help.guide.group-sort-bookings.goal':
    'Organize os cartões ou a lista por status, por dia ou por tipo, na ordem que preferir.',
  'help.guide.booking-on-map.tip.1':
    '“No mapa” só aparece em reservas com lugar. Escolha um em “Local / Atividade” no formulário, e o botão aparece.',
  'help.guide.export-bookings-csv.step.2':
    'Abra “Opções de visualização”, os controles deslizantes depois dos ícones de visualização, e escolha uma ordem em “Ordenar por”. As linhas seguem essa ordem, uma por reserva e sem seções.',
  'help.guide.edit-booking.tip.4':
    'Se você alterou algo, um clique fora do formulário, ou Esc, pergunta “Descartar suas alterações?”. “Continuar editando” leva você de volta ao formulário.',
  'help.guide.arrange-packing-list.step.2':
    'Dentro de uma lista, a alça à esquerda de uma linha arrasta o item para cima ou para baixo. Um traço na sua cor de destaque, na borda esquerda de uma linha, mostra onde ele vai ficar.',
  'help.guide.count-packed-pieces.goal': 'Dê uma quantidade a um item e marque as peças como embaladas uma a uma.',
  'help.guide.count-packed-pieces.tip.3': 'Com quantidade um, não aparece contador; só a caixa de seleção.',
  'help.guide.expense-receipts.step.2':
    'Clique em Anexar, ao lado de “Comprovantes e notas”, e escolha a foto ou o PDF; você também pode escolher vários de uma vez. Cada arquivo aparece listado abaixo do título, com uma lixeira para removê-lo.',
  'help.guide.files-sync-settings.goal':
    'Decida se os documentos só são importados do seu repositório, só são exportados para ele ou as duas coisas, e o que acontece quando um documento é excluído ou alterado nos dois lugares.',
  'help.guide.files-sync-settings.tip.2':
    'Com Perguntar, um documento editado nos dois lugares fica em “Precisa de atenção”, abaixo do cartão. Clique em Resolver e escolha “Manter a versão do TREK”, “Manter a versão do provedor” ou “Manter as duas”.',
  'help.guide.manage-notes.goal':
    'Abra uma nota inteira, mantenha a mais importante no topo e corrija ou remova o que estiver desatualizado.',
  'help.guide.manage-notes.tip.2':
    'Durante a edição, o X vermelho em um arquivo já anexado o exclui na hora, antes mesmo de você clicar em Salvar, e ele não vai para a lixeira. Todos os arquivos de uma nota também aparecem na aba Arquivos da viagem.',
  'help.guide.note-categories.step.6':
    'De volta ao cartão Notas, as pílulas abaixo do cabeçalho filtram os cartões. Clique em uma categoria para ver só as notas dela; Todos, ou a mesma pílula de novo, mostra todas.',
  'help.guide.roadtrip-reorder.tip.1':
    'Mover uma parada aqui também a move no plano do dia: Dias mostra a mesma ordem.',
  'help.guide.roadtrip-overnight.step.1':
    'Em “No trajeto”, marque Hospedagem em “Procurando por”, ou Camping para um lugar de acampamento, escolha o dia em que quer parar e clique em Buscar.',
  'help.guide.roadtrip-overnight.tip.3':
    'Com “Começar e terminar cada dia na hospedagem” ativado, em “Linha da rota”, nas “Configurações de direção”, o percurso do dia seguinte começa onde você dormiu.',
  'help.guide.roadtrip-stop-fill.title': 'Definir até quanto abastecer em uma parada',
  'help.guide.roadtrip-bookings.title': 'Incluir no percurso o seu voo, trem ou balsa',
  'help.guide.roadtrip-bookings.tip.2':
    'Uma mesa ou um ingresso reservado em uma parada aparece como pílula nessa parada; o que não pertence a nenhuma parada aparece em “Também reservado neste dia”.',
  'help.guide.roadtrip-google-import.step.3':
    'Confira as paradas encontradas. Cada uma mostra onde fica; uma parada marcada como Localização não resolvida é ignorada.',
  'help.guide.roadtrip-hazards.step.1': 'Abra “Configurações de direção” na coluna da direita.',
  'help.ctx.trip-tours.summary':
    'A coluna da direita da aba Planejado no modo Passeios: todos os passeios da viagem em uma lista, ao lado dos dias. Daqui você coloca passeios nos dias, filtra a lista, oculta linhas no mapa e importa arquivos GPX ou KML. As rotas são desenhadas e alteradas na aba Passeios.',
  'help.guide.tour-show-list.goal':
    'Troque a coluna de lugares pelos passeios da viagem, para vê-los e escolhê-los ao lado dos dias.',
  'help.guide.tour-show-list.tip.3':
    'Com o complemento Passeios ativado, traçados nunca aparecem na lista de Lugares: todo traçado importado vira um passeio e aparece aqui.',
  'help.guide.tour-add-to-day.step.5':
    'Um passeio com etapas pergunta em seguida, no mesmo menu. “Etapas a partir deste dia” coloca a etapa 1 nesse dia e cada etapa seguinte no dia seguinte; “Roteiro completo neste dia” coloca tudo nesse único dia.',
  'help.guide.tour-day-times.step.1':
    'Na coluna de dias, aponte para a linha do passeio, clique em “Mais opções” (os três pontos) e escolha Editar.',
  'help.guide.tour-day-times.result':
    'O passeio aparece na linha do tempo do dia com início e fim, como qualquer parada com horário.',
  'help.guide.tour-remove-from-day.result':
    'O dia não lista mais o passeio, e a linha dele na lista fica sem o selo Dia.',
  'help.guide.tour-filter-list.tip.2':
    'Uma seção só aparece quando os passeios diferem nesse critério, então uma lista curta pode oferecer só Status.',
  'help.guide.tour-hide-on-map.tip.1':
    'Ocultar afeta só você e fica salvo neste navegador para esta viagem: o passeio, os dias e a cor dele não mudam, e ele continua visível no mapa das outras pessoas.',
  'help.guide.tour-import-plan-tab.tip.1':
    'Um traçado que já está na viagem aparece marcado como “Já está na viagem” e não é importado duas vezes.',
  'help.ctx.trip-tour-detail.bullet.4':
    'A fileira de baixo: “Adicionar ao dia” ou “Remover do dia” quando há um dia aberto, Navegação até o início, a página web do passeio, GPX, Compartilhar (se o seu dispositivo compartilha arquivos), Coleção e Copiar.',
  'help.guide.tour-detail-read.step.5':
    'Abaixo vêm as medidas: Distância, “Altitude mínima”, “Altitude máxima”, “Ganho de elevação” e “Perda de elevação”, os tempos logo abaixo e o perfil de elevação na cor da linha do passeio.',
  'help.guide.tour-detail-read.result':
    'O cartão do passeio fica aberto ao lado do plano, e você sabe em que dias ele está, qual a extensão e a inclinação e de onde ele veio.',
  'help.guide.tour-rename-colour.tip.2': 'O lápis e o ponto só funcionam para membros que podem editar lugares.',
  'help.guide.tour-take-along.tip.2':
    'Escolha um app de mapas preferido em Configurações, e Navegação abre esse app direto em vez de listar os apps.',
  'help.guide.tour-copy-keep.step.3':
    'Para guardar um passeio para outras viagens, abra-o e clique em Coleção, no fim do cartão.',
  'help.guide.tour-packing-link.goal':
    'Mostre direto no cartão do passeio o que levar para ele, a partir da lista de mala da viagem ou de uma das listas.',
  'help.guide.tour-packing-link.tip.3':
    'Para vincular é preciso ter permissão para editar lugares. Os demais veem a lista vinculada, mas não podem mudar o vínculo.',
  'help.guide.tour-files.tip.2': 'Enviar só aparece para membros que podem alterar o passeio e adicionar arquivos.',
  'help.guide.tour-activity-link.step.5':
    'O traçado agora aparece em “Trilha real”, com valores e perfil próprios ao lado do plano.',
  'help.guide.tour-activity-compare.step.2':
    '“Maior distância do plano” mostra a maior distância entre o traçado e a linha planejada, e “Fora do plano” mostra quanto do traçado ficou fora dessa linha.',
  'help.guide.tour-origin-check.step.1':
    'Abra o cartão do passeio e role até Origem. Origem mostra de onde ele veio: “Importação GPX”, com o nome do arquivo, importação KML ou KMZ, ou wanderer, com o endereço dele.',
  'help.ctx.trip-tour-planner.summary':
    'O planejador de passeios da viagem: o editor à esquerda, todos os passeios da viagem à direita e o mapa no meio. Aqui você desenha um passeio ponto a ponto, calcula a rota por caminhos e estradas reais, adiciona os detalhes e salva o passeio na viagem.',
  'help.guide.tour-open-workspace.goal': 'Abra o planejador de passeios e saiba para que serve cada parte dele.',
  'help.guide.tour-open-workspace.tip.1':
    'Recolher, na aba da borda interna de cada painel, oculta o painel para dar mais espaço ao mapa; Planejado e “Passeios desta viagem” mostram os painéis de novo. Arraste a borda de um painel para deixá-lo mais largo ou mais estreito.',
  'help.guide.tour-draw-route.step.3':
    'Confira se “Adicionar ponto”, em “Pontos de caminho”, está ativado (é o mesmo interruptor de “Marcar pontos” na pílula do mapa) e clique no mapa onde o passeio começa.',
  'help.guide.tour-draw-route.result':
    'Uma rota numerada no mapa e os pontos dela em “Pontos de caminho”, prontos para receber um nome e ser salvos.',
  'help.guide.tour-type-profile.tip.2':
    'Alguns tipos pedem mais informações antes de salvar: uma Corrida pede o “Ritmo planejado”; um “Passeio de remo”, o barco e a água; um passeio de “Esqui e inverno”, a modalidade.',
  'help.guide.tour-edit-points.step.5': '“Remover ponto de passagem”, a lixeira ao lado, tira o ponto do passeio.',
  'help.guide.tour-shaping-points.step.2':
    'Arraste o ponto para o caminho que a rota deve seguir. A rota é recalculada passando por ele.',
  'help.guide.tour-loop-reverse.goal': 'Faça o passeio terminar onde começou, ou inverta o sentido dele.',
  'help.guide.tour-leg-by-hand.title': 'Desenhar um trecho à mão ou recalculá-lo',
  'help.guide.tour-leg-by-hand.result':
    'O trecho vira uma linha reta onde você escolheu, marcado como desenhado à mão, ou tem a rota recalculada.',
  'help.guide.tour-trip-places.tip.2':
    'Remover a parada ou desvinculá-la deixa o lugar na viagem como está, inclusive com os dias.',
  'help.guide.tour-details-times.step.4':
    'Planejado mostra o total. Digite o seu para substituí-lo; ele passa a ser marcado como “Ajuste manual”.',
  'help.guide.tour-save.step.2':
    'Espere o pontinho ao lado de “Novo passeio” sumir. Salvar precisa da rota e de todas as altitudes dela.',
  'help.guide.tour-edit-saved.goal': 'Abra um passeio que você planejou antes, altere-o e salve de novo.',
  'help.guide.tour-edit-saved.result': 'O passeio salvo agora tem as suas alterações.',
  'help.guide.tour-summary-profile.tip.2':
    'Uma rota que sobe uma via ferrata ganha um selo de alerta com o grau acima dos números.',
  'help.guide.tour-list-manage.step.4':
    'O botão acima de “Totais da viagem” é o filtro. Ele mostra o status exibido, de início Todos, com o número de passeios.',
  'help.guide.tour-delete.step.1':
    'Aponte para o passeio em “Passeios desta viagem” e clique na lixeira à direita da linha, Excluir, com o nome do passeio.',
  'help.guide.tour-saved-elsewhere.step.1':
    '“Este passeio foi salvo em outro lugar” aparece no topo do painel enquanto você edita. Suas alterações ficam guardadas até você decidir.',
  'help.ctx.trip-tour-import.summary':
    'Aqui você importa para a viagem passeios que já existem em outro lugar: um arquivo GPX, KML ou KMZ de um relógio ou app, um passeio de outra viagem sua ou uma trilha do seu próprio wanderer. Uma importação fica exatamente como foi gravada, e você pode planejar uma versão editável a partir dela.',
  'help.guide.tour-import-gpx.step.1':
    'Abra a aba Passeios da viagem. No topo de “Passeios desta viagem”, à direita, clique no + (“Adicionar passeio”).',
  'help.guide.tour-import-gpx.tip.4':
    'Um arquivo KML ou KMZ também lista em “Não importado” o que ele continha além das linhas: alfinetes, áreas e outros itens.',
  'help.guide.tour-view-import.tip.1':
    'Uma importação não pode ser editada ponto a ponto. “Planejar uma versão editável”, no cartão “Versão editável” acima, cria a partir dela um passeio que você pode alterar.',
  'help.guide.tour-plan-from-import.step.3':
    'Clique em “Substituir a importação” para replanejar este passeio no lugar: os dias e as notas continuam, e o traçado gravado fica guardado para você poder restaurá-lo. “Planejar como novo passeio” não altera a importação e cria um segundo passeio ao lado dela.',
  'help.guide.tour-restore-recorded.goal':
    'Desfaça o replanejamento de uma importação e recupere o traçado original, mesmo muito tempo depois.',
  'help.guide.tour-take-over.goal':
    'Reaproveite um passeio que você já planejou ou importou em outra viagem sua, sem desenhá-lo de novo.',
  'help.guide.tour-take-over.tip.2':
    'Só aparecem as suas outras viagens, e só os primeiros 100 passeios. Pesquise ou filtre para encontrar os demais.',
  'help.guide.tour-import-wanderer.step.4': 'Clique em “Importar para a viagem”.',
  'help.ctx.trip-tour-map.bullet.1':
    'A pílula no canto inferior esquerdo do mapa tem os mapas base que o tipo do passeio aberto oferece: Mapa, Topo, Trilhas em uma caminhada, Bicicleta em um passeio de bicicleta, e Satélite. O que você escolhe ali vale só para o planejador e nunca muda a configuração de mapa em Configurações.',
  'help.guide.tour-map-layers.step.2':
    'Clique em Topo para ver curvas de nível e relevo sombreado, o mapa que mostra a inclinação do terreno. O mapa escolhido fica destacado na pílula.',
  'help.guide.tour-along-search.step.1':
    'Abra um passeio na aba Passeios e role o painel da esquerda até “Ao longo do passeio”, abaixo das paradas. O cartão aparece quando o passeio já tem uma rota.',
  'help.guide.tour-along-search.tip.3':
    'Os resultados vêm do OpenStreetMap e do índice de lugares do TREK, então a busca precisa de conexão. Quando nada é encontrado, Ampliar para tenta a próxima distância; quando um servidor está ocupado, “Tentar novamente” mostra uma contagem regressiva até você poder tentar de novo.',
  'help.guide.tour-along-add-stop.tip.1':
    'O lugar vira uma parada do passeio, não um lugar da viagem, então não aparece na lista de lugares.',
  'help.guide.tour-3d-terrain.step.4':
    'Arraste o controle Relevo para deixar as elevações até três vezes mais altas, o que ajuda em terrenos suaves.',
  'help.guide.tour-3d-flyover.step.1':
    'Mude o passeio para 3D. Enquanto a paisagem ao longo da rota carrega, um anel vai se enchendo onde aparece o botão de reprodução; quando estiver cheio, clique em “Reproduzir sobrevoo”. A câmera acompanha um marcador ao longo da rota, e o cursor no perfil de elevação do “Resumo do passeio” se move junto.',
  'help.guide.tour-map-overlays.title': 'Mostrar pistas ou sinais náuticos sobre o mapa',
  'help.guide.tour-map-overlays.tip.2':
    'Mesmo sem nenhum passeio aberto, o interruptor das pistas está lá, para você explorar uma área de esqui antes de planejar. Em uma caminhada, a pílula oferece “Vias ferratas” no lugar, com o número de rotas visíveis.',
  'help.ctx.trip-tour-stages.bullet.5':
    'O mais na linha de um passeio, “Adicionar ao dia”, coloca as etapas na viagem, uma por dia, a partir do dia escolhido, ou o passeio inteiro nesse único dia.',
  'help.guide.tour-multi-day.step.6':
    'Para voltar a um passeio de um dia, clique em “Um dia” e confirme “Transformar em passeio de um dia?” com “Remover fins de etapa”. A rota continua como está.',
  'help.guide.tour-stages-on-days.step.1':
    'Em “Passeios desta viagem”, aponte para o passeio de vários dias e clique no mais, “Adicionar ao dia”.',
  'help.guide.tour-stages-on-days.tip.3':
    'Arrastar um passeio de vários dias para um dia na aba Planejado faz a mesma pergunta em uma janela, assim como “Adicionar ao dia” no cartão do passeio.',
  'help.ctx.trip-tour-hike.bullet.4':
    '“Detalhes da trilha”, abaixo dos pontos de caminho, mostra o grau SAC, o piso e o tipo de via de cada trecho segundo o OpenStreetMap e colore a rota no mapa de acordo. Nada ali altera o passeio.',
  'help.guide.tour-hike-plan.step.4':
    '“Adicionar ponto” já vem ativado: clique no mapa onde a caminhada começa e onde termina. “Locais da viagem”, ao lado, permite escolher um refúgio ou um hotel da viagem. A partir de dois pontos, o TREK calcula a rota a pé.',
  'help.guide.tour-hike-trail-details.title': 'Ver graus, pisos e tipos de via ao longo de uma caminhada',
  'help.guide.tour-hike-trail-details.tip.1':
    'Os caminhos sem valor no OpenStreetMap aparecem em Desconhecida, e desconhecida não quer dizer fácil. Se alguns mostrarem “Não foi possível consultar agora”, clique em “Tentar novamente”.',
  'help.guide.tour-hike-round.step.4':
    'Clique em uma volta para escolhê-la. A linha mostra distância, subida e tempo, e quanto ela difere da distância que você pediu.',
  'help.guide.tour-hike-compare-ways.step.1':
    'Aponte para a parada onde o trecho começa, clique em “Mais ações” na linha dela e escolha “Comparar caminhos do próximo trecho”.',
  'help.guide.tour-ferrata-add.title': 'Incluir uma via ferrata em uma caminhada',
  'help.guide.tour-ferrata-add.tip.1':
    'Uma via ferrata exige equipamento e experiência. A dica do selo mostra quanto dela a rota sobe.',
  'help.guide.tour-run-plan.step.3':
    'Digite o seu “Ritmo planejado” em minutos e segundos por quilômetro, por exemplo 7:30.',
  'help.guide.tour-run-ways.title': 'Ver por que tipos de via uma corrida passa',
  'help.ctx.trip-tour-walk.title': 'Caminhada urbana',
  'help.guide.tour-walk-plan.goal':
    'Monte uma caminhada turística com paradas, definindo quanto tempo você fica em cada uma e quais são importantes.',
  'help.guide.tour-walk-plan.tip.2':
    'Uma caminhada urbana não tem limite de trilha nem o campo Pausas: os tempos de permanência são usados no lugar.',
  'help.guide.tour-walk-sights.step.4':
    'Clique em um lugar da lista. O cartão abre sobre o mapa: em “Onde entra”, escolha entre quais duas paradas ele vai ficar.',
  'help.guide.tour-walk-day-times.step.1':
    'Coloque a caminhada em um dia: em “Passeios desta viagem”, clique no + redondo da linha dela (“Adicionar ao dia”) e escolha o dia.',
  'help.guide.tour-walk-day-times.result':
    'Você pode reordenar as paradas ou mudar os tempos de permanência até que todos os lugares estejam abertos quando você chegar.',
  'help.guide.tour-walk-google-import.tip.2':
    '“Usar outro link” volta para o campo do link. Carregar substitui as alterações não salvas no planejador, e a janela avisa antes.',
  'help.guide.tour-walk-check-off.step.4':
    'O topo da lista conta as paradas visitadas e mostra o tempo de caminhada restante. Desfazer, em uma parada, remove a marcação.',
  'help.ctx.trip-tour-bike.bullet.2':
    'O “Resumo do passeio”, à direita, mostra o “Tempo pedalando (estimado)”, o tempo calculado pelo roteador para o perfil, incluindo as subidas. As pausas não estão incluídas.',
  'help.guide.tour-bike-profile.step.4':
    'Em “Pontos de caminho”, clique em “Locais da viagem” e escolha o início e o fim, aqui Hotel Alpenroyal e depois Hotel Greif. Você também pode conferir se “Adicionar ponto” está ativado e clicar no mapa. A partir de dois pontos, o TREK calcula a rota.',
  'help.guide.tour-bike-profile.tip.5':
    'Se um administrador permitir o mapa CyclOSM, a fileira de camadas do mapa também oferece Bicicleta enquanto um passeio de bicicleta estiver aberto. Se ele parar de carregar, mude para Mapa. O passeio não muda.',
  'help.guide.tour-bike-surfaces.tip.1':
    '“Fora dos dados” significa que o OpenStreetMap não registra o piso ali. O piso é desconhecido, não necessariamente bom.',
  'help.guide.tour-bike-mtb-grades.step.3': 'Clique em uma linha de grau para destacar essas trilhas no mapa.',
  'help.ctx.trip-tour-ski.bullet.1':
    'Modalidade vem primeiro, e nada vem pré-selecionado: Alpino, Snowboard, “Esqui cross-country”, “Esqui de travessia”, “Raquetes de neve” ou “Caminhada de inverno”. “Esqui cross-country” também pede a Técnica: Clássica, Skating ou Desconhecida. Sem uma modalidade, não dá para salvar o passeio.',
  'help.guide.tour-ski-plan.step.2': 'Abra “Tipo de passeio” e escolha “Esqui e inverno”.',
  'help.guide.tour-ski-plan.tip.4':
    'Onde não há dados de pistas, o trecho é uma linha reta entre os pontos. Para raquetes de neve e caminhada de inverno, ele pode usar caminhos de verão, e uma nota cinza no trecho avisa isso.',
  'help.guide.tour-ski-options.step.5':
    'Em Excluir, pressione cada tipo de teleférico que você não quer usar: Teleskis, “Cadeirinhas abertas”, Gôndolas, Bondinhos ou “Funiculares e trens”. Os pressionados ficam riscados.',
  'help.guide.tour-ski-fix-leg.step.2':
    'Clique na correção que a linha oferece: “Permitir pistas mais difíceis”, “Permitir este teleférico”, “Descer de teleférico”, “Trocar de técnica” ou “Trocar de disciplina”. A opção muda, e o trecho é recalculado.',
  'help.guide.tour-ski-summary.goal': 'Veja como o dia se divide entre esquiar, teleféricos, espera e caminhada.',
  'help.guide.tour-ski-summary.result':
    'Você sabe quanto tempo o dia leva nas pistas, nos teleféricos e na espera por eles.',
  'help.guide.tour-ski-pistes-layer.tip.3':
    'A camada traz dados de mapeamento, não um boletim em tempo real: não diz nada sobre o que está aberto ou preparado, sobre a neve ou sobre avalanches. O interruptor aparece mesmo sem passeio aberto, para você explorar uma área de esqui antes de planejar.',
  'help.guide.tour-ski-import.step.5':
    'Clique no traçado em “Passeios desta viagem” para abri-lo. Para corrigir a modalidade depois, clique em Trocar no cartão “Trilha de esqui”.',
  'help.ctx.trip-tour-paddle.bullet.1':
    'Em “Tipo de passeio”, “Passeio de remo” pede um Barco (Caiaque, Canoa, SUP ou Outro) e a Água (Rio ou Lago). Não dá para salvar o passeio antes de escolher os dois.',
  'help.guide.tour-paddle-setup.step.1':
    'Na aba Passeios, clique em “Planejar novo passeio” no topo da coluna da esquerda.',
  'help.guide.tour-paddle-setup.tip.2':
    'O mapa de um passeio de remo oferece Mapa e Satélite, além de “Sinais náuticos” do OpenSeaMap como sobreposição.',
  'help.guide.tour-paddle-water-route.step.3':
    'Escolha “Planejar o próximo trecho pela água”. O TREK planeja o trecho pelo rio ou lago, deste ponto até o próximo.',
  'help.guide.tour-paddle-portage.title': 'Carregar o barco para contornar um obstáculo',
  'help.guide.tour-paddle-portage.tip.2':
    'No último ponto, “Carregar o barco a partir daqui” passa a valer quando você marca o próximo ponto. A linha mostra “Carregar a partir daqui”, e o X dela, “Não carregar mais”, desfaz isso.',
  'help.guide.tour-paddle-lock.step.4':
    'Digite os minutos de Espera e de Passagem. Com os dois preenchidos, o cartão mostra a soma.',
  'help.guide.tour-paddle-time.step.2':
    'A faixa mostra a rota do início ao fim: a água, os transbordos em marrom e as eclusas como traços. Os obstáculos da rota são marcações em que você pode clicar para encontrá-los no mapa.',
  'help.guide.tour-paddle-wind.title': 'Conferir o vento para um dia de remo',
  'help.guide.tour-paddle-wind.tip.3':
    'Em um dia de vento com travessia de lago, o cartão oferece “Planejar perto da margem”, que planeja os lagos junto à margem.',
  'help.guide.tour-paddle-checklist.step.4':
    'Clique em uma entrada. O mapa vai até ela: se for um obstáculo, o cartão dele abre com a sua decisão; se for um transbordo ou uma eclusa seus, o ponto é selecionado.',
  'help.guide.tour-paddle-track-marks.title': 'Marcar transbordos e eclusas em um traçado de remo gravado',
  'help.guide.tour-paddle-track-marks.step.7': 'Abra os cartões, digite os minutos e clique em Salvar.',
  'help.ctx.trip-tour-horse.bullet.2':
    'Uma rota abre em uma janela própria: escolha um trecho e o Sentido em que vai percorrê-lo, confira o “Acesso a cavalo” e clique em “Adotar trecho”.',
  'help.guide.tour-horse-plan.step.3':
    'No cartão “Rotas equestres”, clique em “Buscar na área do mapa”. Todas as rotas equestres sinalizadas na área aparecem listadas, com a extensão dentro dela.',
  'help.guide.tour-horse-plan.tip.3':
    'Moveu o mapa depois de uma busca? O botão passa a mostrar “Buscar nesta área”. Se a área for grande demais, o TREK pede que você aproxime o zoom antes.',
  'help.guide.tour-horse-gap.step.4':
    'No cartão “Pontos de caminho”, a ligação aparece como “Manual, não verificado”, com a extensão. Aponte para ela para ver o motivo.',
  'help.guide.tour-horse-recorded.step.2':
    'A “Prévia da importação” abre, e nada foi salvo ainda. Em “Importar como”, defina “Tipo de passeio” como “Passeio a cavalo”. Três selos mostram o que a importação mantém e o que ela não calcula.',
  'help.guide.dateless-trip.goal': 'Comece a planejar antes de saber quando vai viajar.',
  'help.guide.trip-reminder.step.3': 'Clique em Atualizar.',
  'help.guide.upcoming-reservations.goal':
    'Veja as próximas reservas de todas as suas viagens e abra a viagem a que cada uma pertence.',
  'help.guide.log-day.tip.3':
    'Um dia marcado como feriado da empresa de dia inteiro não pode ser registrado. Em um meio feriado da empresa, um dia de férias conta só 0,5.',
  'help.guide.half-company-holiday.goal':
    'Dê a todos uma tarde livre, na véspera de Natal, por exemplo, sem fechar o dia inteiro.',
  'help.guide.public-holidays.tip.2': 'Passe o mouse sobre um feriado na grade para ver o nome dele.',
  'help.guide.edit-holiday-calendar.step.3':
    'Mude o país ou a região nas listas do calendário, ou clique na lixeira para removê-lo.',
  'help.guide.person-color.step.2': 'Escolha uma cor. Ela é salva na hora, e a janela fecha.',
  'help.guide.answer-fusion-request.goal': 'Decida se quer unir o seu plano de férias ao de quem convidou você.',
  'help.guide.log-for-partner.goal':
    'Registre uma folga para uma pessoa fundida ao seu plano, por exemplo quando ela pedir.',
  'help.guide.dissolve-fusion.goal': 'Separe de novo um plano fundido em planos individuais.',
  'help.guide.country-places.step.1':
    'Pesquise um país que você visitou e selecione-o. O cartão dele aparece no painel inferior.',
  'help.guide.tour-activity-stats.step.3':
    'Veja os números: a distância, com o número de passeios no canto, e depois “Ganho de elevação” e “Perda de elevação”. Com “Todos os tipos”, os três tipos que você mais fez aparecem em seguida, cada um com a contagem e a distância.',
  'help.guide.move-to-list.step.1':
    'Clique no ícone de caixa de seleção, Escolher, na fileira de filtros e marque os lugares.',
  'help.guide.tour-collection-add-to-trip.step.2':
    'Em “Na viagem”, escolha a viagem. Uma viagem à qual você não pode adicionar passeios aparece esmaecida.',
  'help.guide.tour-collection-manage.goal':
    'Veja quais passeios uma lista tem e de onde eles vieram, e remova os que não precisa mais.',
  'help.guide.entry-draft.goal': 'Escreva uma entrada agora e oculte-a da jornada compartilhada até ela ficar pronta.',
  'help.guide.journey-map-layers.step.2':
    'Clique no (i) no fim da barra para ver a legenda do mapa: ela explica cada alfinete, ponto e linha.',
  'help.guide.journey-keep-route.step.2':
    'Confira o “Fuso horário do dia”, que define onde o dia começa e termina, e confira a gravação: distância, intervalo de tempo, trechos e lacunas.',
  'help.guide.journey-day-stays.step.2':
    'Clique em “Escrever uma entrada no diário” em uma estadia. A entrada é adicionada nesse dia, no horário de chegada, com o nome e a posição da estadia.',
  'help.guide.journey-take-over-day.step.2':
    'Marque as estadias que quer manter e corrija os nomes. “Juntar em uma entrada”, entre duas estadias marcadas, as une; “Manter separadas” as divide de novo.',
  'help.guide.journey-auto-prepare.step.1':
    'Clique em ⋯ no canto superior direito do cabeçalho para abrir “Configurações da jornada”.',
  'help.guide.photo-location.step.1':
    'Clique em ⋯ no canto superior direito do cabeçalho para abrir “Configurações da jornada”.',
  'help.guide.share-public.tip.3':
    'Rascunhos nunca aparecem no link, e as rotas gravadas só aparecem em dias com uma entrada publicada.',
  'help.ctx.settings-plugins.title': 'Plugins', // same-as-en
  'help.ctx.settings-about.bullet.2':
    '“Reportar um bug” e “Solicitar recurso” abrem o projeto no GitHub; Wiki abre a documentação.',
  'help.guide.map-provider.tip.3':
    'Em um mapa GL, clique com o botão direito e arraste para girar e inclinar o mapa; o clique com o botão do meio adiciona um lugar.',
  'help.guide.web-push-device.step.1':
    'Em “Notificações push neste dispositivo”, clique em “Ativar neste dispositivo” e permita as notificações quando o navegador perguntar. “Enviar teste” confere se elas chegam.',
  'help.guide.connect-airtrail.title': 'Conectar o seu AirTrail',
  'help.guide.connect-dawarich.title': 'Conectar o seu Dawarich',
  'help.guide.tour-connect-wanderer.title': 'Conectar o seu wanderer',
  'help.guide.tour-connect-wanderer.tip.3': 'Desconectar, à direita, remove o token.',
  'help.guide.tour-wanderer-watch.tip.3':
    'Os canais desses avisos são escolhidos em Notificações, na linha “wanderer: avisos sobre suas trilhas”.',
  'help.guide.plugin-settings.tip.1':
    'Estas configurações são só suas; os outros membros configuram o plugin para si mesmos.',
  'help.guide.offline-conflicts.step.3':
    'As alterações que o servidor continua recusando aparecem em “Cache offline” como “Alterações com falha”: “Tentar novamente” as envia mais uma vez, e Descartar mantém a versão do servidor.',
  'help.ctx.admin-notifications.bullet.4':
    '“Padrões para usuários”, no fim: por evento e canal, Ligado, Desligado ou Bloqueado para todos que não mudaram a configuração.',
  'help.guide.default-user-settings.step.2':
    'Um campo que você definiu ganha um link de redefinir ao lado do nome; ele volta ao padrão original do TREK.',
  'help.guide.own-routing-engine.title': 'Usar seus próprios servidores de rotas',
  'help.guide.admin-passkeys.result':
    'A página de login passa a oferecer “Entrar com uma passkey”, e as pessoas podem adicionar passkeys nas próprias configurações.',
  'help.guide.rotate-jwt-secret.goal': 'Encerre todas as sessões depois de uma suspeita de vazamento.',
  'help.guide.notification-defaults.result':
    'Todos que não mudaram uma célula partem da sua escolha, e as células bloqueadas aparecem travadas nas configurações deles.',
  'help.ctx.notifications.bullet.3':
    'Cada notificação diz quem fez o quê e onde. As não lidas têm o fundo colorido. Um botão abaixo dela, como “Ver viagem” ou “Ver Vacay”, leva você até lá e a marca como lida.',
  'help.guide.read-notifications.tip.1':
    'O sino aparece em todas as telas com a barra de navegação, e o número dele se atualiza sozinho quando chega algo novo.',
  'help.guide.filter-notifications.tip.1':
    'A página carrega notificações mais antigas conforme você rola para baixo, então nada fica cortado depois da primeira tela.',
  'help.guide.mark-notifications-read.result':
    'Nenhuma notificação tem mais o fundo colorido, e o número vermelho do sino some.',
  'help.guide.notification-settings.title': 'Escolher do que você é avisado',
  'help.guide.link-journal.step.1':
    'Clique em “Configurações da viagem”, ao lado do nome da viagem, e escolha Diário à esquerda.',
  'help.guide.dawarich-stays.tip.1':
    'Nada entra na viagem até você clicar em “Adicionar lugar”. Um lugar adicionado a partir de uma estadia mostra isso nos detalhes: “Adicionado a partir dos seus registros do Dawarich”.',
  'help.guide.leave-stop-off-route.title': 'Deixar uma parada fora da rota',
  'help.guide.move-booking-day.step.1':
    'Passe o mouse sobre a linha da reserva no dia: a alça à esquerda indica que ela pode ser arrastada.',
  'help.guide.place-image-from-file.tip.1': 'Só aparecem arquivos JPG, PNG, GIF e WebP; um bilhete em PDF não aparece.',
  'help.guide.place-own-hours.step.4':
    'Os botões à direita de “Horário de funcionamento”: o botão de copiar aplica a todos os dias o horário de segunda-feira, e o X remove os seus horários. Se o TREK tiver encontrado horários próprios, “Usar dos detalhes do lugar” os traz de volta.',
  'help.guide.confirm-stay-booking.step.2':
    'A reserva abre sobre o plano. A primeira pílula do cabeçalho mostra o status.',
  'help.ctx.trip-map.bullet.9':
    'Cada passeio da viagem é uma linha na cor dele, com um alfinete onde começa. Clique na linha para abrir o cartão do passeio. Em um dia com passeio, a rota do dia vai até onde o passeio começa e continua de onde ele termina. O olho ao lado de um passeio na lista de Passeios, “Ocultar no mapa”, tira a linha dele do seu mapa.',
  'help.guide.tour-map-lines.result':
    'Os passeios que você quer estão no mapa, cada um na sua cor, e o que você ocultou aparece esmaecido na lista de Passeios.',
  'help.guide.car-stops.step.2':
    'Clique na pílula de tipo no cabeçalho e escolha Carro. O formulário muda: Data e “Horário de início” viram Retirada e “Hora retirada”, “Data final” e “Horário de término” viram Devolução e “Hora devolução”, e “Paradas pelo caminho” aparece abaixo de De e Para.',
  'help.guide.transport-details.goal':
    'Veja todos os detalhes de um trajeto em um só lugar, copie o código da reserva, renomeie o trajeto ou vá até ele no mapa.',
  'help.guide.transport-details.tip.2':
    'Esc ou um clique fora dos detalhes os fecha. Se Renomear ou a pergunta de exclusão estiver aberta, ela fecha primeiro.',
  'help.guide.export-transports-csv.tip.1': 'O ícone só aparece na barra enquanto a aba tiver pelo menos um trajeto.',
  'help.guide.group-sort-bookings.step.1':
    'Em Cartões ou Lista, clique em “Opções de visualização”, os controles deslizantes depois dos três ícones de visualização.',
  'help.guide.create-booking.tip.4':
    'Offline, a reserva é salva neste dispositivo e sincroniza quando você volta a ficar online. Arquivos novos precisam de conexão, então remova-os ou salve depois. Se você clicar fora do formulário sem querer, ou pressionar Esc, o TREK pergunta “Descartar suas alterações?” antes que algo que você digitou se perca.',
  'help.guide.booking-on-map.tip.2': 'Uma estadia abre na primeira noite.',
  'help.guide.export-bookings-csv.step.3':
    'Clique em “Exportar como planilha (CSV)”, o ícone de planilha depois de “Opções de visualização”.',
  'help.guide.arrange-packing-list.step.3':
    '“A a Z”, na ponta direita da fileira com Compartilhada e “Minha lista”, mostra os itens de cada lista em ordem alfabética, para você ver rapidinho se algo já está lá. Clique de novo para voltar à sua ordem.',
  'help.guide.count-packed-pieces.step.1':
    'Clique no selo de quantidade em uma linha, o pequeno número seguido de um x, digite quantas peças vai levar, por exemplo 5, e pressione Enter.',
  'help.guide.expense-receipts.step.3':
    'Clique em Salvar no fim da janela. Os arquivos são enviados com a despesa e também aparecem nos Arquivos da viagem.',
  'help.guide.files-sync-settings.step.1':
    'Clique em “Sincronização de documentos”, na ponta direita da barra. Com a viagem vinculada, o cartão do seu repositório abre à direita; se houver mais de um, clique no que quiser em “Esta viagem”, à esquerda.',
  'help.guide.files-sync-settings.tip.3':
    '“Atualizações na hora”, um link com Copiar ao lado, só aparece para repositórios em que o TREK não consegue acompanhar as mudanças automaticamente. Cole o link no repositório, e as mudanças chegam na hora, em vez de só na próxima verificação.',
  'help.guide.manage-notes.step.1':
    'Clique nos três pontos no cabeçalho de um cartão de nota (“Mais opções”). O menu traz Expandir, Fixar, Editar e Excluir.',
  'help.guide.note-categories.title': 'Organizar as notas em categorias',
  'help.guide.note-categories.result':
    'As notas mostram os novos nomes e cores, e o cartão Notas mostra só a categoria escolhida.',
  'help.guide.roadtrip-stops.tip.5':
    'Uma parada com horário de término no plano do dia dura até esse horário. A janela dela mostra quando o percurso segue, e “Remover horário de término” permite definir a duração você mesmo de novo.',
  'help.guide.roadtrip-reorder.tip.2':
    'Trajetos reservados e seus terminais ficam onde a reserva os coloca; só lugares podem ser arrastados.',
  'help.guide.roadtrip-overnight.step.2':
    'Um hotel mostra um ícone de cama em vez do mais. Clique nele, “Adicionar como pernoite”, para abrir “Adicionar como parada” para a noite. Um camping tem o Adicionar de sempre.',
  'help.guide.roadtrip-stop-fill.goal':
    'Defina para uma parada de abastecimento ou recarga o próprio nível, como 80 % em um carregador rápido ou 100 % durante a noite.',
  'help.guide.roadtrip-bookings.goal':
    'Veja onde um trajeto reservado entra no percurso e até quando você precisa chegar lá.',
  'help.guide.roadtrip-bookings.tip.3':
    'Um trajeto que não está em nenhum dia da viagem não entra no percurso: uma nota no topo do trilho mostra qual é, com “Abrir reserva” para dar uma data a ele.',
  'help.guide.roadtrip-google-import.step.4': 'Em Dia, escolha em que dia as paradas entram e clique em Importar.',
  'help.guide.roadtrip-hazards.step.2':
    'Em “Alertas atuais”, no fim da coluna da direita da janela, ative “Mostrar áreas de risco” e clique em Encerrar.',
  'help.ctx.trip-tours.bullet.1':
    'O seletor Lugares e Passeios, no topo da coluna da direita, troca a lista de lugares pelos passeios. Ele só aparece com o complemento Passeios ativado, e nesse caso os passeios nunca aparecem na lista de Lugares.',
  'help.guide.tour-show-list.step.1':
    'Na aba Planejado, clique em Passeios no seletor no topo da coluna da direita. A coluna passa a listar os passeios em vez dos lugares.',
  'help.guide.tour-show-list.result':
    'A coluna da direita lista os passeios da viagem, e o que você clicou está aberto no cartão dele.',
  'help.guide.tour-add-to-day.tip.1':
    'Arrastar um passeio com etapas para um dia faz a mesma pergunta em uma pequena janela. Cancelar deixa o plano como estava.',
  'help.guide.tour-day-times.step.2':
    'Defina o Início e deixe o Fim em branco. A linha abaixo dos campos mostra o fim calculado pelo TREK: o início mais o tempo do passeio.',
  'help.guide.tour-remove-from-day.title': 'Tirar um passeio de um dia',
  'help.guide.tour-filter-list.title': 'Filtrar a lista de passeios',
  'help.guide.tour-filter-list.tip.3':
    'Se não sobrar nada, a lista avisa que nenhum passeio corresponde aos filtros, e “Limpar filtros” desfaz todos. Os filtros só mudam o que a lista mostra, nunca um passeio ou um dia.',
  'help.guide.tour-hide-on-map.tip.2':
    'O mapa do celular sempre mostra todos os passeios, e a aba Passeios não tem o olho: ocultar funciona aqui, na aba Planejado.',
  'help.guide.tour-import-plan-tab.tip.2':
    'Aqui, a importação fica na lista e não abre em um planejador. Coloque-a em um dia com o + redondo dela ou abra a aba Passeios para vê-la por lá.',
  'help.ctx.trip-tour-detail.bullet.5':
    'O cartão serve para consultar e para o que acompanha um passeio. A rota em si é alterada na aba Passeios: abra a aba e clique no passeio em “Passeios desta viagem”. Os passeios também são excluídos lá, não aqui.',
  'help.guide.tour-detail-read.step.6':
    'Role mais para ver a Descrição e as Notas e depois a Origem: “planejado no TREK”, o arquivo de onde foi importado ou a trilha do wanderer de onde veio, com a data.',
  'help.guide.tour-rename-colour.title': 'Renomear um passeio e mudar a cor dele',
  'help.guide.tour-rename-colour.result':
    'O passeio aparece com o novo nome em toda a viagem, e a linha dele fica na cor que você escolheu.',
  'help.guide.tour-take-along.tip.3':
    'O arquivo vem do servidor, então precisa de conexão. Um passeio criado offline pode ser baixado depois que sincronizar.',
  'help.guide.tour-copy-keep.step.4': 'Escolha a lista em Coleção, confira o “Nome na coleção” e clique em Guardar.',
  'help.guide.tour-packing-link.step.1':
    'Abra o cartão do passeio e role até “Lista de mala”. Clique em “Vincular uma lista de mala”.',
  'help.guide.tour-packing-link.result':
    'Você está na lista de mala, na aba Listas, e o cartão do passeio mostra cada item que você marcar.',
  'help.guide.tour-files.result': 'Os arquivos ficam anexados ao passeio e abrem pelo cartão dele.',
  'help.guide.tour-activity-link.tip.1':
    'O plano continua como está. O traçado só é vinculado, e Desvincular remove o vínculo.',
  'help.guide.tour-activity-compare.step.3':
    'Clique em “Comparar no mapa” para desenhar o traçado real pontilhado ao lado do plano. “Encerrar comparação” o remove.',
  'help.guide.tour-origin-check.step.2':
    'Importado mostra o dia da importação. Aqui mostra o estado atual: “Como importado”, “Editado no TREK” ou “Replanejado, trilha gravada mantida”.',
  'help.ctx.trip-tour-planner.bullet.1':
    'Passeios fica na barra de abas da viagem, logo depois de Planejado, enquanto o complemento Passeios estiver ativado. A aba aparece no computador e no tablet; no celular, os passeios são vistos e colocados nos dias pela aba Planejado, mas não são desenhados.',
  'help.guide.tour-open-workspace.step.1':
    'Clique em Passeios na barra de abas da viagem, logo depois de Planejado. O mapa ocupa a tela, com um painel de cada lado.',
  'help.guide.tour-open-workspace.tip.2':
    'Solte arquivos GPX, KML ou KMZ em qualquer parte desta aba para importá-los como passeios da viagem.',
  'help.guide.tour-draw-route.step.4':
    '“Ponto marcado” aparece na parte de baixo do mapa. Desfazer, ao lado, remove o ponto.',
  'help.guide.tour-type-profile.title': 'Escolher o tipo de passeio',
  'help.guide.tour-type-profile.result': 'A rota do passeio é calculada para o tipo e o perfil escolhidos.',
  'help.guide.tour-edit-points.step.6':
    '“Desfazer edição do ponto de passagem” e “Refazer edição do ponto de passagem”, no topo do painel, desfazem ou refazem cada alteração, uma de cada vez.',
  'help.guide.tour-shaping-points.step.3':
    'Em “Pontos de caminho”, ele aparece com o selo “Ponto de forma” e sem número, para que as paradas mantenham a numeração.',
  'help.guide.tour-loop-reverse.step.1':
    'Clique em “Voltar ao início” no cabeçalho do cartão “Pontos de caminho”. O passeio ganha um último trecho de volta ao primeiro ponto.',
  'help.guide.tour-leg-by-hand.goal':
    'Ligue dois pontos com uma linha reta onde o roteador não encontra caminho, ou recalcule um trecho.',
  'help.guide.tour-trip-places.title': 'Usar um lugar da viagem como parada',
  'help.guide.tour-trip-places.tip.3': 'Os outros passeios da viagem nunca aparecem como opção de parada.',
  'help.guide.tour-details-times.tip.1': 'Os tempos podem ser digitados como 2:56, 2 h 56 ou 176 minutos.',
  'help.guide.tour-save.step.3':
    'Clique em Salvar no fim do painel da esquerda. Aparece “Passeio salvo”, e o título do painel muda para “Editar passeio”.',
  'help.guide.tour-edit-saved.step.1':
    'Clique no passeio em “Passeios desta viagem”. Ele abre no painel da esquerda como “Editar passeio”, e o mapa mostra a rota.',
  'help.guide.tour-summary-profile.title': 'Ler o resumo do passeio e o perfil de elevação',
  'help.guide.tour-summary-profile.tip.3':
    'Um passeio de remo não mostra altitudes, porque na água as únicas altitudes disponíveis seriam as das margens.',
  'help.guide.tour-list-manage.step.5':
    'Escolha “Não planejados” para os passeios ainda sem dia, ou filtre por Origem, “Limite de rota” ou Tipo. Cada linha mostra quantos passeios correspondem, e os totais acompanham o filtro.',
  'help.guide.tour-delete.step.2':
    'Leia o que é excluído junto: a rota, os pontos de caminho editáveis e as atribuições de dia. Clique em “Excluir permanentemente”.',
  'help.guide.tour-saved-elsewhere.step.2':
    '“Carregar a mais nova” substitui as suas alterações pela versão mais recente, depois de uma confirmação.',
  'help.ctx.trip-tour-import.bullet.1':
    'O + no topo de “Passeios desta viagem” é “Adicionar passeio”. Ele oferece “Importar GPX ou KML”, “Importar passeio do Google Maps” e “Trazer um passeio de outra viagem”. Você também pode soltar arquivos em qualquer parte da aba Passeios.',
  'help.guide.tour-import-gpx.step.2':
    'Escolha “Importar GPX ou KML” e selecione um ou mais arquivos .gpx, .kml ou .kmz, de até 10 MB cada.',
  'help.guide.tour-import-gpx.tip.5':
    'Um arquivo sem altitudes mostra “Sem altitudes no arquivo”. A linha e a distância continuam certas, mas a subida e a descida ficam desconhecidas.',
  'help.guide.tour-view-import.tip.2':
    'O ícone de download no cabeçalho salva o passeio de novo como arquivo GPX, e o marcador o guarda em uma coleção.',
  'help.guide.tour-plan-from-import.step.4':
    'O passeio abre no editor com os pontos de caminho. Altere-o se quiser e clique em Salvar no fim da coluna.',
  'help.guide.tour-restore-recorded.step.1':
    'Em “Passeios desta viagem”, clique no passeio que você replanejou. O cartão “Traçado gravado”, no editor, informa que o traçado original foi mantido.',
  'help.guide.tour-take-over.step.1':
    'Abra a aba Passeios da viagem que vai receber o passeio. No topo de “Passeios desta viagem”, clique no + (“Adicionar passeio”).',
  'help.guide.tour-take-over.tip.3':
    'Trazer um passeio precisa de conexão. Se o editor tiver alterações não salvas, a cópia ainda entra na lista, mas não abre, para não atrapalhar o que você está fazendo.',
  'help.guide.tour-import-wanderer.tip.1':
    'O botão aparece depois que o wanderer é conectado em Configurações, Integrações. Antes disso, a lista oferece “Conectar nas configurações”.',
  'help.ctx.trip-tour-map.bullet.2':
    'Depois do divisor na pílula vêm os interruptores do tipo do passeio: “Marcar pontos” enquanto você edita um passeio, “Vias ferratas” em uma caminhada, “Sinais náuticos” em um passeio de remo e as pistas em um passeio de esqui. 3D, no fim, mostra o passeio sobre uma paisagem em 3D.',
  'help.guide.tour-map-layers.step.3':
    'Em uma caminhada, clique em Trilhas para ver as trilhas sinalizadas e seus números; um passeio de bicicleta oferece Bicicleta para as ciclovias. Satélite mostra imagens de satélite, e Mapa volta ao mapa padrão.',
  'help.guide.tour-along-search.step.2':
    'Clique em “O que procurar” e marque os tipos que quer, até seis de cada vez: Mirantes, Cumes, “Cabanas e abrigos”, “Água potável”, Comida e outros. A lista oferece o que combina com o tipo do passeio, e todo passeio começa com três tipos marcados.',
  'help.guide.tour-along-add-stop.title': 'Adicionar como parada um lugar ao longo do passeio',
  'help.guide.tour-along-add-stop.tip.2':
    'Um lugar que vira o novo fim aparece marcado como “Aumenta o passeio”: o fim antigo deixa de ser o fim, e o passeio continua até esse lugar.',
  'help.guide.tour-3d-terrain.step.5': 'Clique em 3D de novo para voltar ao mapa plano e continuar planejando.',
  'help.guide.tour-3d-flyover.step.2':
    'Em Velocidade, escolha 1×, 2× ou 4×. Em 1×, a maioria dos passeios leva cerca de 45 segundos do início ao fim.',
  'help.guide.tour-map-overlays.goal':
    'Mostre no mapa as pistas e os teleféricos, ou as boias e a sinalização de porto, enquanto planeja um passeio de esqui ou de remo.',
  'help.guide.tour-map-overlays.tip.3':
    'Quando uma camada para de carregar, o interruptor dela mostra um ! com uma explicação; o mapa e a sua rota continuam funcionando sem ela.',
  'help.guide.tour-multi-day.title': 'Planejar um passeio de vários dias',
  'help.guide.tour-multi-day.tip.1':
    '“Encerrar etapa aqui” também funciona em um passeio de um dia: ele vira automaticamente um passeio de vários dias. A primeira e a última parada, e os pontos de forma, não podem encerrar uma etapa.',
  'help.guide.tour-stages-on-days.step.2': 'Escolha o dia em que você começa a primeira etapa.',
  'help.guide.tour-stages-on-days.tip.4':
    'No plano do dia, cada etapa aparece como Etapa N, com distância e tempo próprios. Desfazer, acima dos dias na aba Planejado, desfaz toda a distribuição de uma vez.',
  'help.ctx.trip-tour-hike.bullet.5':
    'Em uma caminhada, “Vias ferratas”, na fileira de botões do mapa no canto inferior esquerdo, mostra as vias ferratas próximas. O cartão de uma via ferrata a adiciona à rota como um trecho separado.',
  'help.guide.tour-hike-plan.step.5':
    'Em Detalhes, abra “Dificuldade máxima da trilha” e escolha até que dificuldade as trilhas podem chegar, de T1 (Trilhas) a T6 (“Caminhada alpina difícil”). A rota é recalculada dentro desse limite.',
  'help.guide.tour-hike-trail-details.goal':
    'Veja o que o OpenStreetMap registra sobre os caminhos de uma caminhada e encontre esses trechos no mapa.',
  'help.guide.tour-hike-trail-details.tip.2':
    'Um grau acima do limite da caminhada mostra o selo “Acima do limite” na linha dele.',
  'help.guide.tour-hike-round.step.5':
    'Clique em “Usar esta volta” e depois em Substituir quando o TREK perguntar se deve substituir a rota planejada.',
  'help.guide.tour-hike-compare-ways.step.2':
    '“Outros caminhos para este trecho” abre sobre o mapa com o “Caminho atual” e Caminho A, Caminho B e assim por diante. Cada um aparece no mapa na própria cor, e apontar para uma linha destaca o traçado dela.',
  'help.guide.tour-ferrata-add.goal': 'Encontre as vias ferratas perto da sua caminhada e inclua uma delas na rota.',
  'help.guide.tour-ferrata-add.tip.2':
    'Vias ferratas só são oferecidas em caminhadas. Uma via ferrata que a rota já sobe mostra “Parte do passeio” no cartão em vez de “Adicionar ao passeio”.',
  'help.guide.tour-run-plan.step.4':
    'Defina o início e o fim no mapa ou escolha-os com “Locais da viagem”. Abaixo do ritmo aparece o tempo de corrida: a distância multiplicada pelo ritmo.',
  'help.guide.tour-run-ways.goal': 'Confira quanto de uma corrida é sem pavimento e quão difíceis ficam os caminhos.',
  'help.ctx.trip-tour-walk.summary':
    'Um passeio a pé de parada em parada, planejado na aba Passeios: quanto tempo você fica em cada parada, quais são importantes, as atrações pelo caminho e quando você chega a cada uma no dia da caminhada, conferido com o horário de funcionamento.',
  'help.guide.tour-walk-plan.step.1':
    'Clique em “Planejar novo passeio” no topo da coluna da esquerda, abra “Tipo de passeio” e escolha “Caminhada urbana / turística”.',
  'help.guide.tour-walk-plan.tip.3':
    '“Desvincular do local”, em “Mais ações” de uma parada, só desfaz o vínculo com um lugar da viagem. O lugar em si continua na viagem.',
  'help.guide.tour-walk-sights.step.5':
    'Clique em “Adicionar como parada”. Um aviso mostra quanto a caminhada ficou mais longa, com Desfazer ao lado.',
  'help.guide.tour-walk-day-times.step.2':
    'Defina um horário de início nesse dia: na aba Planejado, clique com o botão direito na caminhada no dia, escolha Editar e informe um Início.',
  'help.guide.tour-walk-google-import.title': 'Transformar uma rota a pé do Google Maps em caminhada urbana',
  'help.guide.tour-walk-google-import.tip.3':
    'Só as paradas são trazidas, não a linha desenhada no Google Maps. Um link curto maps.app.goo.gl precisa de conexão para ser aberto.',
  'help.guide.tour-walk-check-off.tip.1':
    'As marcações ficam salvas por dia: abra a caminhada pelo dia dela no plano, não pela lista de passeios.',
  'help.ctx.trip-tour-bike.bullet.3':
    'O cartão “Piso e vias”, abaixo de “Pontos de caminho”, mostra o chão da rota: os pisos, os tipos de via e a parte que com certeza não é pavimentada. Clique em uma linha para destacar os trechos dela no mapa.',
  'help.guide.tour-bike-profile.step.5':
    'Veja o “Tempo pedalando (estimado)” no “Resumo do passeio”, à direita. Passe o mouse sobre o pontinho de informação para ver como ele é calculado.',
  'help.guide.tour-bike-surfaces.title': 'Ver os pisos de um passeio de bicicleta',
  'help.guide.tour-bike-surfaces.tip.2':
    'No perfil Estrada, um aviso acima das barras mostra quanto do percurso com certeza não é pavimentado. “Mostrar no mapa” destaca esses trechos.',
  'help.guide.tour-bike-mtb-grades.result':
    'O mapa destaca as trilhas do grau escolhido, e você sabe quais são os trechos difíceis do passeio.',
  'help.ctx.trip-tour-ski.bullet.2':
    'Abaixo da modalidade ficam as opções do roteador de pistas, só as que a sua modalidade usa: “Pistas mais difíceis”, Preferir, Ritmo, interruptores como “Usar teleféricos” e Excluir, para os tipos de teleférico que você não quer usar. Cada alteração recalcula o passeio.',
  'help.guide.tour-ski-plan.step.3':
    'Em Modalidade, escolha o que vai fazer: Alpino, Snowboard, “Esqui cross-country”, “Esqui de travessia”, “Raquetes de neve” ou “Caminhada de inverno”. Nada vem pré-selecionado, e o passeio não pode ser salvo sem uma modalidade.',
  'help.guide.tour-ski-plan.result':
    'Um passeio de “Esqui e inverno” salvo em “Passeios desta viagem”, com os trechos pelas pistas, teleféricos e trilhas mapeados e o tempo calculado no “Resumo do passeio”.',
  'help.guide.tour-ski-options.tip.1': 'Cada alteração recalcula o passeio, trecho por trecho.',
  'help.guide.tour-ski-fix-leg.step.3':
    'Se nenhuma correção servir, clique em “Desenhar reto”. O trecho vira uma linha reta entre os dois pontos.',
  'help.guide.tour-ski-summary.step.1':
    'Abaixo dos pontos de caminho, procure o cartão “Rota pelas pistas”. Clique no título para recolhê-lo ou abri-lo de novo.',
  'help.guide.tour-ski-pistes-layer.title': 'Mostrar as pistas no mapa',
  'help.guide.tour-ski-pistes-layer.result':
    'As pistas aparecem por baixo do passeio, e você consegue ler as cores delas.',
  'help.guide.tour-ski-import.step.6':
    'Em “Classificar trilha de esqui”, escolha a modalidade ou a técnica certa e clique em Salvar.',
  'help.ctx.trip-tour-paddle.bullet.2':
    'Cada ponto mostra a função dele em um selo: Embarque, Desembarque, Reembarque ou “Desembarque final”. Abaixo de um ponto aparece o que vem depois: um trecho desenhado à mão, um transbordo, uma eclusa, ou o motivo pelo qual um trecho não pôde ser planejado.',
  'help.guide.tour-paddle-setup.step.2':
    'Abra “Tipo de passeio” e escolha “Passeio de remo”, “Na água, de caiaque, canoa ou SUP”.',
  'help.guide.tour-paddle-setup.tip.3':
    'Em um passeio de remo, “Ao longo do passeio” procura primeiro “Pontos de entrada na água”, “Aluguel de barcos” e “Água potável”.',
  'help.guide.tour-paddle-water-route.step.4':
    'Um trecho que o TREK não conseguiu planejar fica vermelho e mostra o motivo, por exemplo que ainda não há dados de água para a área. Clique em “Desenhar reto” para desenhá-lo à mão por enquanto.',
  'help.guide.tour-paddle-portage.goal':
    'Marque um trecho em que você carrega o barco, para que ele conte como terra, com tempo para sair da água e voltar.',
  'help.guide.tour-paddle-portage.tip.3':
    'O transporte do barco conta a 2 km/h até você definir a sua própria “Velocidade no transbordo” no cartão “Estimativa de tempo”.',
  'help.guide.tour-paddle-lock.tip.1':
    'O TREK não conhece os horários das eclusas. Os tempos são só o que você informa, então confira você mesmo o horário de funcionamento da eclusa.',
  'help.guide.tour-paddle-time.step.3':
    'A linha Água é a distância na água na sua “Velocidade de remada”. Mude a velocidade no campo “Velocidade de remada”, no topo da coluna.',
  'help.guide.tour-paddle-wind.goal': 'Veja o vento previsto no início do passeio no dia em que você vai remar.',
  'help.guide.tour-paddle-wind.tip.4':
    'Nenhum valor da previsão significa que é seguro. Confira as condições no local.',
  'help.guide.tour-paddle-checklist.step.5':
    'No fim da coluna, clique em “Remar tem riscos” para ler “Segurança na água” antes de sair.',
  'help.guide.tour-paddle-track-marks.goal':
    'Importe um traçado de remo do seu relógio e marque onde você carregou o barco e onde passou por uma eclusa.',
  'help.guide.tour-paddle-track-marks.tip.1':
    'Clique exatamente sobre o traçado: um clique longe demais da linha é recusado, e o cartão avisa.',
  'help.ctx.trip-tour-horse.bullet.3':
    'Cada trecho é um selo no cartão “Pontos de caminho”, com o nome da rota, um ponto de acesso e a extensão. Um trecho que nenhuma rota equestre cobre aparece como “Manual, não verificado”.',
  'help.guide.tour-horse-plan.step.4':
    'Clique em uma rota na lista. Ela abre em um mapa próprio, com os trechos numerados.',
  'help.guide.tour-horse-plan.tip.4':
    '“Desfazer edição do ponto de passagem”, no cabeçalho da coluna da esquerda, desfaz um trecho inteiro de uma vez.',
  'help.guide.tour-horse-gap.result':
    'A cavalgada não tem mais lacunas, e o trecho de ligação aparece marcado como desenhado à mão.',
  'help.guide.tour-horse-recorded.step.3': 'Clique em Importar 1 passeio.',
  'help.guide.dissolve-fusion.step.3': 'Confirme com “Encerrar” na janela que aparece.',
};

export default help;
