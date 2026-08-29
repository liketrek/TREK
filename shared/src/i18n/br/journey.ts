import type { TranslationStrings } from '../types';

const journey: TranslationStrings = {
  'journey.search.placeholder': 'Buscar jornadas…',
  'journey.search.noResults': 'Nenhuma jornada corresponde a "{query}"',
  'journey.title': 'Jornada',
  'journey.subtitle': 'Registre suas viagens em tempo real',
  'journey.new': 'Nova jornada',
  'journey.create': 'Criar',
  'journey.titlePlaceholder': 'Para onde você vai?',
  'journey.empty': 'Nenhuma jornada ainda',
  'journey.emptyHint': 'Comece a documentar sua próxima viagem',
  'journey.deleted': 'Jornada excluída',
  'journey.createError': 'Não foi possível criar a jornada',
  'journey.deleteError': 'Não foi possível excluir a jornada',
  'journey.deleteConfirmTitle': 'Excluir',
  'journey.deleteConfirmMessage': 'Excluir "{title}"? Isso não pode ser desfeito.',
  'journey.deleteConfirmGeneric': 'Tem certeza de que deseja excluir isso?',
  'journey.notFound': 'Jornada não encontrada',
  'journey.photos': 'Fotos',
  'journey.timelineEmpty': 'Nenhuma parada ainda',
  'journey.timelineEmptyHint': 'Adicione um check-in ou escreva uma entrada no diário para começar',
  'journey.status.draft': 'Rascunho',
  'journey.status.active': 'Ativa',
  'journey.status.completed': 'Concluída',
  'journey.status.upcoming': 'Próxima',
  'journey.status.archived': 'Arquivado',
  'journey.checkin.add': 'Fazer check-in',
  'journey.checkin.namePlaceholder': 'Nome do local',
  'journey.checkin.notesPlaceholder': 'Notas (opcional)',
  'journey.checkin.save': 'Salvar',
  'journey.checkin.error': 'Não foi possível salvar o check-in',
  'journey.entry.add': 'Diário',
  'journey.entry.edit': 'Editar entrada',
  'journey.entry.titlePlaceholder': 'Título (opcional)',
  'journey.entry.bodyPlaceholder': 'O que aconteceu hoje?',
  'journey.entry.save': 'Salvar',
  'journey.entry.error': 'Não foi possível salvar a entrada',
  'journey.photo.add': 'Foto',
  'journey.photo.uploadError': 'Falha no envio',
  'journey.share.share': 'Compartilhar',
  'journey.share.public': 'Público',
  'journey.share.linkCopied': 'Link público copiado',
  'journey.share.disabled': 'Compartilhamento público desativado',
  'journey.editor.titlePlaceholder': 'Dê um nome a este momento...',
  'journey.editor.bodyPlaceholder': 'Conte a história deste dia...',
  'journey.editor.placePlaceholder': 'Localização (opcional)',
  'journey.editor.tagsPlaceholder': 'Tags: joia escondida, melhor refeição, preciso voltar...',
  'journey.visibility.private': 'Privado',
  'journey.visibility.shared': 'Compartilhado',
  'journey.visibility.public': 'Público',
  'journey.emptyState.title': 'Sua história começa aqui',
  'journey.emptyState.subtitle': 'Faça check-in em um lugar ou escreva sua primeira entrada no diário',
  'journey.frontpage.subtitle': 'Transforme suas viagens em histórias que você nunca vai esquecer',
  'journey.frontpage.createJourney': 'Criar jornada',
  'journey.frontpage.activeJourney': 'Jornada ativa',
  'journey.frontpage.latestJourney': 'Última jornada',
  'journey.frontpage.allJourneys': 'Todas as jornadas',
  'journey.frontpage.journeys': 'jornadas',
  'journey.frontpage.createNew': 'Criar uma nova jornada',
  'journey.frontpage.createNewSub': 'Escolha viagens, escreva histórias, compartilhe suas aventuras',
  'journey.frontpage.live': 'Ao vivo',
  'journey.frontpage.synced': 'Sincronizado',
  'journey.frontpage.continueWriting': 'Continuar escrevendo',
  'journey.frontpage.updated': 'Atualizado {time}',
  'journey.frontpage.suggestionLabel': 'A viagem acabou de terminar',
  'journey.frontpage.suggestionText': 'Transforme <strong>{title}</strong> em uma jornada',
  'journey.frontpage.dismiss': 'Dispensar',
  'journey.frontpage.journeyName': 'Nome da jornada',
  'journey.frontpage.namePlaceholder': 'ex. Sudeste Asiático 2026',
  'journey.frontpage.selectTrips': 'Selecionar viagens',
  'journey.frontpage.tripsSelected': 'viagens selecionadas',
  'journey.frontpage.trips': 'viagens',
  'journey.frontpage.placesImported': 'lugares serão importados',
  'journey.frontpage.places': 'lugares',
  'journey.detail.backToJourney': 'Voltar à jornada',
  'journey.detail.syncedWithTrips': 'Sincronizado com viagens',
  'journey.detail.addEntry': 'Adicionar entrada',
  'journey.detail.jumpToTop': 'Voltar ao topo',
  'journey.detail.jumpToLast': 'Ir para a última entrada',
  'journey.detail.newEntry': 'Nova entrada',
  'journey.detail.editEntry': 'Editar entrada',
  'journey.detail.noEntries': 'Nenhuma entrada ainda',
  'journey.detail.noEntriesHint': 'Adicione uma viagem para começar com entradas preliminares',
  'journey.detail.noPhotos': 'Nenhuma foto ainda',
  'journey.detail.noPhotosHint': 'Envie fotos para as entradas ou explore sua biblioteca do Immich/Synology',
  'journey.detail.journeyStats': 'Estatísticas da jornada',
  'journey.detail.syncedTrips': 'Viagens sincronizadas',
  'journey.detail.noTripsLinked': 'Nenhuma viagem vinculada ainda',
  'journey.detail.contributors': 'Colaboradores',
  'journey.detail.readMore': 'Ler mais',
  'journey.detail.prosCons': 'Prós e contras',
  'journey.detail.photos': 'fotos',
  'journey.detail.day': 'Dia {number}',
  'journey.detail.places': 'lugares',
  'journey.stats.days': 'Dias',
  'journey.stats.cities': 'Cidades',
  'journey.stats.entries': 'Entradas',
  'journey.stats.photos': 'Fotos',
  'journey.stats.places': 'Lugares',
  'journey.skeletons.show': 'Mostrar sugestões',
  'journey.skeletons.hide': 'Ocultar sugestões',
  'journey.verdict.lovedIt': 'Adorei',
  'journey.verdict.couldBeBetter': 'Poderia ser melhor',
  'journey.synced.places': 'lugares',
  'journey.synced.synced': 'sincronizado',
  'journey.editor.discardChangesConfirm': 'Você tem alterações não salvas. Descartá-las?',
  'journey.editor.uploadFailed': 'Falha ao enviar fotos',
  'journey.editor.uploadPhotos': 'Enviar fotos',
  'journey.editor.uploading': 'Enviando...',
  'journey.editor.uploadingProgress': 'Enviando {done}/{total}…',
  'journey.editor.uploadPartialFailed': '{failed} de {total} fotos falharam — salve novamente para tentar',
  'journey.editor.fromGallery': 'Da galeria',
  'journey.editor.allPhotosAdded': 'Todas as fotos já foram adicionadas',
  'journey.editor.writeStory': 'Escreva sua história...',
  'journey.editor.prosCons': 'Prós e contras',
  'journey.editor.pros': 'Prós',
  'journey.editor.cons': 'Contras',
  'journey.editor.proPlaceholder': 'Algo ótimo...',
  'journey.editor.conPlaceholder': 'Não tão bom...',
  'journey.editor.addAnother': 'Adicionar outro',
  'journey.editor.date': 'Data',
  'journey.editor.location': 'Localização',
  'journey.editor.searchLocation': 'Buscar localização...',
  'journey.editor.mood': 'Humor',
  'journey.editor.weather': 'Clima',
  'journey.editor.photoFirst': '1º',
  'journey.editor.makeFirst': 'Tornar 1º',
  'journey.editor.searching': 'Pesquisando...',
  'journey.editor.useCurrentLocation': 'Usar minha localização atual',
  'journey.editor.locationPermissionDenied':
    'O acesso à localização foi negado. Permita nas configurações do navegador e tente novamente.',
  'journey.editor.locationTimeout': 'Tempo esgotado ao obter sua localização. Tente novamente.',
  'journey.editor.locationUnavailable': 'Não foi possível determinar sua localização.',
  'journey.editor.locationInsecureContext': 'A localização requer uma conexão segura (HTTPS).',
  'journey.mood.amazing': 'Incrível',
  'journey.mood.good': 'Bom',
  'journey.mood.neutral': 'Neutro',
  'journey.mood.rough': 'Difícil',
  'journey.weather.sunny': 'Ensolarado',
  'journey.weather.partly': 'Parcialmente nublado',
  'journey.weather.cloudy': 'Nublado',
  'journey.weather.rainy': 'Chuvoso',
  'journey.weather.stormy': 'Tempestuoso',
  'journey.weather.cold': 'Nevando',
  'journey.trips.linkTrip': 'Vincular viagem',
  'journey.trips.searchTrip': 'Buscar viagem',
  'journey.trips.searchPlaceholder': 'Nome da viagem ou destino...',
  'journey.trips.noTripsAvailable': 'Nenhuma viagem disponível',
  'journey.trips.link': 'Vincular',
  'journey.trips.tripLinked': 'Viagem vinculada',
  'journey.trips.linkFailed': 'Não foi possível vincular a viagem',
  'journey.trips.addTrip': 'Adicionar viagem',
  'journey.trips.unlinkTrip': 'Desvincular viagem',
  'journey.trips.unlinkMessage':
    'Desvincular "{title}"? Todas as entradas e fotos sincronizadas desta viagem serão excluídas permanentemente. Isso não pode ser desfeito.',
  'journey.trips.unlink': 'Desvincular',
  'journey.trips.tripUnlinked': 'Viagem desvinculada',
  'journey.trips.unlinkFailed': 'Não foi possível desvincular a viagem',
  'journey.trips.noTripsLinkedSettings': 'Nenhuma viagem vinculada',
  'journey.contributors.invite': 'Convidar colaborador',
  'journey.contributors.searchUser': 'Buscar usuário',
  'journey.contributors.searchPlaceholder': 'Nome de usuário ou e-mail...',
  'journey.contributors.noUsers': 'Nenhum usuário encontrado',
  'journey.contributors.role': 'Função',
  'journey.contributors.added': 'Colaborador adicionado',
  'journey.contributors.addFailed': 'Não foi possível adicionar o colaborador',
  'journey.share.publicShare': 'Compartilhamento público',
  'journey.share.createLink': 'Criar link de compartilhamento',
  'journey.share.linkCreated': 'Link de compartilhamento criado',
  'journey.share.createFailed': 'Não foi possível criar o link',
  'journey.share.copy': 'Copiar',
  'journey.share.copied': 'Copiado!',
  'journey.share.timeline': 'Linha do tempo',
  'journey.share.gallery': 'Galeria',
  'journey.share.map': 'Mapa',
  'journey.share.removeLink': 'Remover link de compartilhamento',
  'journey.share.linkDeleted': 'Link de compartilhamento removido',
  'journey.share.deleteFailed': 'Não foi possível excluir',
  'journey.share.updateFailed': 'Não foi possível atualizar',
  'journey.invite.role': 'Função',
  'journey.invite.viewer': 'Visualizador',
  'journey.invite.editor': 'Editor',
  'journey.invite.invite': 'Convidar',
  'journey.invite.inviting': 'Convidando...',
  'journey.settings.title': 'Configurações da jornada',
  'journey.settings.coverImage': 'Imagem de capa',
  'journey.settings.changeCover': 'Alterar capa',
  'journey.settings.addCover': 'Adicionar imagem de capa',
  'journey.settings.name': 'Nome',
  'journey.settings.subtitle': 'Subtítulo',
  'journey.settings.subtitlePlaceholder': 'ex. Tailândia, Vietnã e Camboja',
  'journey.settings.endJourney': 'Arquivar Jornada',
  'journey.settings.reopenJourney': 'Restaurar Jornada',
  'journey.settings.archived': 'Jornada arquivada',
  'journey.settings.reopened': 'Jornada reaberta',
  'journey.settings.endDescription': 'Oculta o selo Ao Vivo. Você pode reabrir a qualquer momento.',
  'journey.settings.delete': 'Excluir',
  'journey.settings.deleteJourney': 'Excluir jornada',
  'journey.settings.deleteMessage': 'Excluir "{title}"? Todas as entradas e fotos serão perdidas.',
  'journey.settings.saved': 'Configurações salvas',
  'journey.settings.saveFailed': 'Não foi possível salvar',
  'journey.settings.coverUpdated': 'Capa atualizada',
  'journey.settings.coverFailed': 'Falha no envio',
  'journey.settings.failedToDelete': 'Falha ao excluir',
  'journey.entries.deleteTitle': 'Excluir entrada',
  'journey.photosUploaded': '{count} fotos enviadas',
  'journey.photosUploadFailed': 'Algumas fotos não foram enviadas',
  'journey.photosAdded': '{count} fotos adicionadas',
  'journey.public.notFound': 'Não encontrado',
  'journey.public.notFoundMessage': 'Esta jornada não existe ou o link expirou.',
  'journey.public.readOnly': 'Somente leitura · Jornada pública',
  'journey.public.tagline': 'Kit de recursos e exploração de viagens',
  'journey.public.sharedVia': 'Compartilhado via',
  'journey.public.madeWith': 'Feito com',
  'journey.pdf.journeyBook': 'Livro da jornada',
  'journey.pdf.madeWith': 'Feito com TREK',
  'journey.pdf.day': 'Dia',
  'journey.pdf.theEnd': 'Fim',
  'journey.pdf.saveAsPdf': 'Salvar como PDF',
  'journey.pdf.pages': 'páginas',
  'journey.picker.tripPeriod': 'Período da viagem',
  'journey.picker.dateRange': 'Período',
  'journey.picker.allPhotos': 'Todas as fotos',
  'journey.picker.albums': 'Álbuns',
  'journey.picker.selected': 'selecionados',
  'journey.picker.addTo': 'Adicionar a',
  'journey.picker.newGallery': 'Nova galeria',
  'journey.picker.selectAll': 'Selecionar tudo',
  'journey.picker.deselectAll': 'Desmarcar tudo',
  'journey.picker.noAlbums': 'Nenhum álbum encontrado',
  'journey.picker.selectDate': 'Selecionar data',
  'journey.picker.search': 'Pesquisar',
  'journey.detail.journeyTab': 'Journey', // en-fallback
  'journey.contributors.remove': 'Remove contributor', // en-fallback
  'journey.contributors.removeConfirm': 'Remove {username} from this journey?', // en-fallback
  'journey.contributors.removed': 'Contributor removed', // en-fallback
  'journey.contributors.removeFailed': 'Failed to remove contributor', // en-fallback
  'journey.editor.externalPhotos': 'External photos', // en-fallback
  'journey.editor.externalPhotosFor': 'Photos for {date}', // en-fallback
  'journey.editor.externalPhotosNearby': 'Nearby photos first', // en-fallback
  'journey.editor.externalPhotosNoLocation': 'All photos from this day', // en-fallback
  'journey.editor.externalPhotosQueued': 'queued', // en-fallback
  'journey.editor.externalPhotosUnavailable': 'No connected photo providers are available.', // en-fallback
  'journey.editor.externalPhotosPartialFailed': '{failed} photo groups failed — save again to retry', // en-fallback
  'journey.picker.day': 'This day', // en-fallback
  'journey.studio.title': 'TREK Studio', // en-fallback
  'journey.studio.open': 'Studio', // en-fallback
  'journey.studio.openAria': 'Open the photo book studio', // en-fallback
  'journey.studio.backToJourney': 'Back to the journey', // en-fallback
  'journey.studio.format': 'Page format', // en-fallback
  'journey.studio.formatA4Landscape': 'A4 landscape', // en-fallback
  'journey.studio.formatA4Portrait': 'A4 portrait', // en-fallback
  'journey.studio.formatSquare21': 'Square 21 × 21 cm', // en-fallback
  'journey.studio.formatSquare30': 'Square 30 × 30 cm', // en-fallback
  'journey.studio.pages': 'Pages', // en-fallback
  'journey.studio.cover': 'Cover', // en-fallback
  'journey.studio.inspector': 'Properties', // en-fallback
  'journey.studio.inspectorEmpty': 'Select something on the page to edit it.', // en-fallback
  'journey.studio.emptySpread': 'This spread is still empty', // en-fallback
  'journey.studio.autoLayout': 'Auto layout', // en-fallback
  'journey.studio.export': 'Export', // en-fallback
  'journey.studio.day': 'DIA',
  'journey.studio.stations': 'Etapas',
  'journey.studio.peersHere': 'aqui',
  'journey.studio.folioAuto': 'Automático',
  'journey.studio.exportLayout': 'Layout',
  'journey.studio.exportPages': 'Páginas avulsas',
  'journey.studio.exportPagesHint': 'Uma folha por página, na ordem de leitura. É o que a gráfica quer.',
  'journey.studio.exportSpreads': 'Páginas duplas',
  'journey.studio.exportSpreadsHint': 'Duas páginas por vez, como o livro abre. Para ler.',
  'journey.studio.exportFinishing': 'Acabamento',
  'journey.studio.exportMarks': 'Marcas de corte',
  'journey.studio.exportMarksHint': 'Acrescenta {bleed} mm de sangria em cada borda e marca onde cortar',
  'journey.studio.exportNote':
    '{sheets} folhas de {width} × {height} mm. O navegador transforma a visualização em PDF.',
  'journey.studio.exportOpen': 'Visualizar impressão',
  'journey.studio.exportSave': 'Salvar como PDF',
  'journey.studio.exportPreparing': 'Preparando',
  'journey.studio.exportSheetCount': '{count} folhas',
  'journey.studio.undo': 'Undo', // en-fallback
  'journey.studio.redo': 'Redo', // en-fallback
  'journey.studio.zoomIn': 'Zoom in', // en-fallback
  'journey.studio.zoomOut': 'Zoom out', // en-fallback
  'journey.studio.zoomFit': 'Fit to view', // en-fallback
  'journey.studio.downloadSpread': 'Baixar esta página dupla',
  'journey.studio.downloadSpreadHint':
    'Salva o design desta página dupla como arquivo, sem as fotos, para compartilhar ou reutilizar',
  'journey.studio.importSpread': 'Importar',
  'journey.studio.importSpreadHint': 'Adiciona uma página dupla a partir de um arquivo de design baixado',
  'journey.studio.importSpreadFailed': 'Esse arquivo não é uma página do TREK Studio',
  'journey.studio.desktopOnly': 'Studio needs a bigger screen', // en-fallback
  'journey.studio.desktopOnlyHint':
    'Montar um livro pede espaço de trabalho, então o Studio existe só no computador, e o PDF também. Todo o resto da sua viagem funciona aqui como sempre.', // en-fallback
  'journey.studio.formatA5Landscape': 'A5 landscape', // en-fallback
  'journey.studio.bookView': 'Book view', // en-fallback
  'journey.studio.multiple': 'Several', // en-fallback
  'journey.studio.kind.photo': 'Photo', // en-fallback
  'journey.studio.kind.text': 'Text', // en-fallback
  'journey.studio.kind.shape': 'Shape', // en-fallback
  'journey.studio.position': 'Position', // en-fallback
  'journey.studio.width': 'W', // en-fallback
  'journey.studio.height': 'H', // en-fallback
  'journey.studio.text': 'Text', // en-fallback
  'journey.studio.typography': 'Type', // en-fallback
  'journey.studio.leading': 'Line', // en-fallback
  'journey.studio.colour': 'Colour', // en-fallback
  'journey.studio.autoColour': 'Automático',
  'journey.studio.countryNames': 'Nomes',
  'journey.studio.crop': 'Crop', // en-fallback
  'journey.studio.look': 'Look', // en-fallback
  'journey.studio.radius': 'Corner', // en-fallback
  'journey.studio.shape': 'Shape', // en-fallback
  'journey.studio.arrange': 'Arrange', // en-fallback
  'journey.studio.toFront': 'Bring to front', // en-fallback
  'journey.studio.forward': 'Bring forward', // en-fallback
  'journey.studio.backward': 'Send backward', // en-fallback
  'journey.studio.toBack': 'Send to back', // en-fallback
  'journey.studio.lock': 'Lock', // en-fallback
  'journey.studio.unlock': 'Unlock', // en-fallback
  'journey.studio.delete': 'Delete', // en-fallback
  'journey.studio.pageHint': 'Page', // en-fallback
  'journey.studio.boundHint': 'Follows the journal entry. Editing it here breaks that link.', // en-fallback
  'journey.studio.fit.cover': 'Fill', // en-fallback
  'journey.studio.fit.contain': 'Fit', // en-fallback
  'journey.studio.filter.none': 'Original', // en-fallback
  'journey.studio.filter.bw': 'Black & white', // en-fallback
  'journey.studio.filter.warm': 'Warm', // en-fallback
  'journey.studio.shapeKind.rect': 'Rectangle', // en-fallback
  'journey.studio.shapeKind.ellipse': 'Ellipse', // en-fallback
  'journey.studio.focalHint': 'Drag the point to choose what stays in frame.', // en-fallback
  'journey.studio.backCover': 'Back cover', // en-fallback
  'journey.studio.sections': 'Sections', // en-fallback
  'journey.studio.content': 'Content', // en-fallback
  'journey.studio.elements': 'Elements', // en-fallback
  'journey.studio.templates': 'Layouts', // en-fallback
  'journey.studio.photos': 'Photos', // en-fallback
  'journey.studio.entries': 'Entries', // en-fallback
  'journey.studio.addToPage': 'Add to this page', // en-fallback
  'journey.studio.noPhotos': 'This journey has no photos yet.', // en-fallback
  'journey.studio.untitled': 'Untitled', // en-fallback
  'journey.studio.addTitle': 'Title', // en-fallback
  'journey.studio.addStory': 'Story', // en-fallback
  'journey.studio.addPlace': 'Place', // en-fallback
  'journey.studio.shapes': 'Shapes', // en-fallback
  'journey.studio.frames': 'Molduras', // en-fallback
  'journey.studio.emptyFrame': 'Empty frame', // en-fallback
  'journey.studio.frameHint': 'An empty frame marks where a picture goes. Drop one on it from Content.', // en-fallback
  'journey.studio.shapeKind.line': 'Line', // en-fallback
  'journey.studio.styleTitle': 'Heading', // en-fallback
  'journey.studio.styleSubtitle': 'Subheading', // en-fallback
  'journey.studio.styleBody': 'Body text', // en-fallback
  'journey.studio.styleCaption': 'Caption', // en-fallback
  'journey.studio.sampleHeading': 'A heading', // en-fallback
  'journey.studio.sampleSubheading': 'A subheading', // en-fallback
  'journey.studio.sampleBody': 'Write something about this day.', // en-fallback
  'journey.studio.sampleCaption': 'Caption', // en-fallback
  'journey.studio.templatesCoverHint':
    'Layouts apply to the inside spreads. The cover and the back are designed on their own.', // en-fallback
  'journey.studio.tpl.heroStory': 'Hero and story', // en-fallback
  'journey.studio.tpl.fullBleed': 'One picture, full spread', // en-fallback
  'journey.studio.tpl.twoUp': 'Two full pages', // en-fallback
  'journey.studio.tpl.grid4': 'Four up', // en-fallback
  'journey.studio.tpl.grid6': 'Six up', // en-fallback
  'journey.studio.tpl.strip': 'Strip and text', // en-fallback
  'journey.studio.tpl.quietText': 'Text only', // en-fallback
  'journey.studio.tpl.portraitPair': 'A pair', // en-fallback
  'journey.studio.dropPhotoHere': 'Arraste sua foto\npara cá',
  'journey.studio.searchContent': 'Search photos and entries', // en-fallback
  'journey.studio.noMatches': 'Nothing matches that.', // en-fallback
  'journey.studio.decorations': 'Decoration', // en-fallback
  'journey.studio.quoteMark': 'Quotation mark', // en-fallback
  'journey.studio.circleOutline': 'Outlined circle', // en-fallback
  'journey.studio.roundFrame': 'Rounded frame', // en-fallback
  'journey.studio.shapeKind.rounded': 'Rounded rectangle', // en-fallback
  'journey.studio.shapeKind.triangle': 'Triangle', // en-fallback
  'journey.studio.shapeKind.outline': 'Outline only', // en-fallback
  'journey.studio.travel': 'Viagem',
  'journey.studio.travelEmpty': 'Os números desta jornada ainda não estão prontos.',
  'journey.studio.grids': 'Grades',
  'journey.studio.gridHint': 'Uma grade coloca um bloco de molduras vazias. Arraste fotos de Conteúdo para elas.',
  'journey.studio.lines': 'Linhas',
  'journey.studio.frameStyles': 'Estilos de moldura',
  'journey.studio.frameShapes': 'Formas de moldura',
  'journey.studio.plainFrame': 'Simples',
  'journey.studio.polaroidFrame': 'Polaroid',
  'journey.studio.whiteFrame': 'Borda branca',
  'journey.studio.shadowFrame': 'Sombra',
  'journey.studio.filmFrame': 'Filme',
  'journey.studio.tapeFrame': 'Com fita',
  'journey.studio.shapeGroup.basic': 'Básicas',
  'journey.studio.shapeGroup.polygons': 'Polígonos',
  'journey.studio.shapeGroup.stars': 'Estrelas',
  'journey.studio.shapeGroup.arrows': 'Setas',
  'journey.studio.shapeGroup.speech': 'Balões',
  'journey.studio.shapeGroup.travel': 'Viagem',
  'journey.studio.shapeGroup.decor': 'Decoração',
  'journey.studio.shapeGroup.banners': 'Faixas',
  'journey.studio.summary': 'Resumo',
  'journey.studio.tripSummary': 'Resumo da viagem',
  'journey.studio.statsRow': 'Uma linha',
  'journey.studio.statsFull': 'Tudo',
  'journey.studio.routeMap': 'Mapa do trajeto',
  'journey.studio.mapStyle.minimal': 'Mínimo',
  'journey.studio.mapStyle.outline': 'Contorno',
  'journey.studio.mapStyle.paper': 'Papel',
  'journey.studio.mapStyle.dark': 'Escuro',
  'journey.studio.countries': 'Países',
  'journey.studio.countryList': 'Lista de países',
  'journey.studio.countryGrid': 'Grade de países',
  'journey.studio.noCountries': 'Nenhum país identificado para esta jornada ainda.',
  'journey.studio.noRoute': 'Ainda não há paradas com coordenadas.',
  'journey.studio.marks': 'Marcas',
  'journey.studio.dateMark': 'Data',
  'journey.studio.dayMark': 'Contador de dias',
  'journey.studio.dayWord': 'DIA',
  'journey.studio.coordsMark': 'Coordenadas',
  'journey.studio.coordsDms': 'Graus',
  'journey.studio.coordsDecimal': 'Decimal',
  'journey.studio.flagMark': 'Bandeira',
  'journey.studio.distanceMark': 'Distância',
  'journey.studio.metric.distance': 'Distância',
  'journey.studio.metric.days': 'Dias',
  'journey.studio.metric.steps': 'Paradas',
  'journey.studio.metric.photos': 'Fotos',
  'journey.studio.metric.countries': 'Países',
  'journey.studio.metric.places': 'Lugares',
  'journey.studio.metric.furthest': 'Mais longe',
  'journey.studio.kind.map': 'Mapa',
  'journey.studio.kind.stats': 'Números',
  'journey.studio.kind.countries': 'Países',
  'journey.studio.kind.badge': 'Marca',
  'journey.studio.kind.list': 'Lista',
  'journey.studio.kind.icon': 'Ícone',
  'journey.studio.duplicate': 'Duplicar',
  'journey.studio.style': 'Estilo',
  'journey.studio.shows': 'Mostrar',
  'journey.studio.size': 'Tamanho',
  'journey.studio.weight': 'Peso',
  'journey.studio.italic': 'Itálico',
  'journey.studio.tracking': 'Espaçamento',
  'journey.studio.rotation': 'Rotação',
  'journey.studio.opacity': 'Opacidade',
  'journey.studio.fill': 'Preenchimento',
  'journey.studio.fillOn': 'Preenchido',
  'journey.studio.stroke': 'Contorno',
  'journey.studio.strokeWidth': 'Espessura',
  'journey.studio.gradient': 'Degradê',
  'journey.studio.gradientDown': 'Para baixo',
  'journey.studio.gradientUp': 'Para cima',
  'journey.studio.showIcons': 'Ícones',
  'journey.studio.mapFit': 'Área',
  'journey.studio.mapPadding': 'Espaço',
  'journey.studio.mapShape': 'Forma',
  'journey.studio.align.left': 'Esquerda',
  'journey.studio.align.center': 'Centro',
  'journey.studio.align.right': 'Direita',
  'journey.studio.markStyle.plain': 'Simples',
  'journey.studio.markStyle.chip': 'Etiqueta',
  'journey.studio.markStyle.outline': 'Contornado',
  'journey.studio.markStyle.stacked': 'Empilhado',
  'journey.studio.icon': 'Ícone',
  'journey.studio.iconAndLabel': 'Ícone e texto',
  'journey.studio.iconOnly': 'Só ícone',
  'journey.studio.labelOnly': 'Só texto',
  'journey.studio.icons': 'Ícones',
  'journey.studio.iconsForTravel': 'Para viagem',
  'journey.studio.iconsAll': 'Todos os ícones',
  'journey.studio.searchIcons': 'Buscar ícones',
  'journey.studio.lineWidth': 'Espessura',
  'journey.studio.mask': 'Recortar na forma',
  'journey.studio.maskNone': 'Nenhuma',
  'journey.studio.frameStyle': 'Moldura',
  'journey.studio.mapLayers': 'Camadas',
  'journey.studio.showLand': 'Países',
  'journey.studio.showRoute': 'Trajeto',
  'journey.studio.showPins': 'Paradas',
  'journey.studio.showLabels': 'Rótulos',
  'journey.studio.units': 'Unidades',
  'journey.studio.metrics': 'Números',
  'journey.studio.layout': 'Disposição',
  'journey.studio.layoutGrid': 'Grade',
  'journey.studio.layoutRow': 'Linha',
  'journey.studio.layoutColumn': 'Coluna',
  'journey.studio.layoutList': 'Lista',
  'journey.studio.showOutline': 'Contornos',
  'journey.studio.showFlag': 'Bandeiras',
  'journey.studio.showName': 'Nomes',
  'journey.studio.textScale': 'Tamanho do texto',
  'journey.studio.accent': 'Destaque',
  'journey.studio.refresh': 'Atualizar da jornada',
  'journey.studio.staleHint': 'A jornada mudou desde que estes números foram obtidos.',
  'journey.studio.align': 'Alinhamento',
  'journey.studio.filter.cool': 'Frio',
  'journey.studio.filter.fade': 'Desbotado',
  'journey.studio.filter.contrast': 'Intenso',
  'journey.studio.strokeStyle': 'Traço',
  'journey.studio.strokeSolid': 'Contínuo',
  'journey.studio.strokeDashed': 'Tracejado',
  'journey.studio.strokeDotted': 'Pontilhado',
  'journey.studio.singleFigures': 'Números avulsos',
  'journey.studio.addPage': 'Adicionar página',
  'journey.studio.addPageAfter': 'Inserir página depois',
  'journey.studio.duplicatePage': 'Duplicar página',
  'journey.studio.deletePage': 'Excluir página',
  'journey.studio.movePageUp': 'Mover para antes',
  'journey.studio.movePageDown': 'Mover para depois',
  'journey.studio.beta': 'Beta',
  'journey.studio.addProsCons': 'Prós e contras',
  'journey.studio.showMarks': 'Marcas',
  'journey.studio.formatCustom': 'Tamanho próprio',
  'journey.studio.document': 'Documento',
  'journey.studio.pageNumbers': 'Números de página',
  'journey.studio.pageNumbersOn': 'Sim',
  'journey.studio.pageNumbersOff': 'Não',
  'journey.studio.folio.outer': 'Externo',
  'journey.studio.folio.inner': 'Interno',
  'journey.studio.folio.centre': 'Centralizado',
  'journey.studio.folioStart': 'Começa em',
  'journey.studio.folioMargin': 'Margem',
  'journey.studio.relayoutSpread': 'Esta página',
  'journey.studio.relayoutSpreadHint': 'Refazer a partir da entrada',
  'journey.studio.relayoutSpreadNone': 'Esta página não vem de uma entrada',
  'journey.studio.relayoutBook': 'O livro inteiro',
  'journey.studio.relayoutBookHint': 'Substitui todas as páginas — reversível',
  'journey.studio.tpl.coverFull': 'Sangria total',
  'journey.studio.tpl.coverBand': 'Imagem e faixa',
  'journey.studio.tpl.coverWindow': 'Emoldurado',
  'journey.studio.tpl.coverQuiet': 'Só texto',
  'journey.studio.tpl.coverHalf': 'Duas metades',
  'journey.studio.tpl.fullText': 'Imagem e história',
  'journey.studio.tpl.grid9': 'Nove',
  'journey.studio.tpl.mosaic': 'Mosaico',
  'journey.studio.tpl.bandQuote': 'Palavras no meio',
  'journey.studio.tpl.staggerFour': 'Quatro escalonadas',
  'journey.studio.weightMissing': 'Esta fonte não tem esse peso',
  'journey.studio.mapSource': 'Origem do mapa',
  'journey.studio.mapSourceVector': 'Contornos',
  'journey.studio.mapSourceRelief': 'Relevo',
  'journey.studio.routeLook': 'A linha',
  'journey.studio.roads': 'Estradas',
  'journey.studio.roadsFetch': 'Seguir as estradas',
  'journey.studio.roadsFollow': 'Pela estrada',
  'journey.studio.roadsDirect': 'Direta',
  'journey.studio.recommended': 'recomendado',
  'journey.studio.bleed': 'Sangria',
  'journey.studio.safeArea': 'Segurança',
  'journey.studio.roadsAgain': 'Buscar de novo',
  'journey.studio.roadsClear': 'Limpar',
  'journey.studio.roadsBusy': 'Consultando',
  'journey.studio.roadsHint':
    'Pede a um serviço de rotas o caminho percorrido em cada trecho. Os trechos longos ficam como estão.',
  'journey.studio.roadsHave': 'As estradas ficam salvas neste livro, então ele imprime a mesma linha offline.',
  'journey.studio.routeStyle': 'Aparência',
  'journey.studio.routePlain': 'Lisa',
  'journey.studio.routeDrawn': 'Desenhada',
  'journey.studio.routeArc': 'Trechos longos',
  'journey.studio.routeStraight': 'Retos',
  'journey.studio.routeBow': 'Curvados',
  'journey.studio.routeDashArcs': 'Tracejar os trechos curvados',
  'journey.studio.mapStops': 'Paradas',
  'journey.studio.pinDot': 'Pontos',
  'journey.studio.pinPhoto': 'Fotos',
  'journey.studio.pinPhotoNone': 'Ainda não há fotos nessas paradas, então elas aparecem como pontos.',
  'journey.studio.mapSourceSatellite': 'Satélite',
  'journey.studio.mapSourceSatelliteHint':
    'Sentinel-2 sem nuvens, livre para impressão com o crédito. Nítido até o nível da rua.',
  'journey.studio.mapSourceReliefHint':
    'Relevo sombreado da NASA, livre para impressão. Ideal para um país ou um continente, grosseiro demais para uma cidade.',
  'journey.studio.mapPrintDpi': 'Imprime com cerca de',
  'journey.studio.mapPrintDpiLow': 'sem nitidez neste tamanho, use um enquadramento mais amplo ou outra origem',
  'journey.studio.mapPerTrip': 'Uma viagem por vez',
  'journey.studio.mapWholeJourney': 'Jornada inteira',
  'journey.studio.mapScope': 'Mostrar',
  'journey.studio.mapSourceTiles': 'Blocos de mapa',
  'journey.studio.mapSourceStatic': 'Mapbox',
  'journey.studio.mapSourceHint': 'Baixado ao renderizar e impresso com o crédito',
  'journey.studio.mapZoom': 'Zoom',
  'journey.studio.mapFraming': 'Enquadramento',
  'journey.studio.mapFitStops': 'Paradas',
  'journey.studio.mapFitCountry': 'País inteiro',
  'journey.studio.mapPadTight': 'Justo',
  'journey.studio.mapPadNormal': 'Normal',
  'journey.studio.mapPadWide': 'Amplo',
  'journey.studio.mapPadFar': 'Muito amplo',
  'journey.studio.mapClipRect': 'Em moldura',
  'journey.studio.mapClipCountry': 'Recortado',
  'journey.studio.mapClipNeedsCountry': 'Precisa de um país para recortar',
  'journey.studio.mapCutVector': 'Recorte',
  'journey.studio.mapCutTiles': 'Mapa recortado',
  'journey.studio.mapZoomAuto': 'Ajustar',
  'journey.studio.saving': 'Salvando',
  'journey.studio.saved': 'Salvo',
  'journey.studio.saveFailed': 'Não salvo',
  'journey.studio.saveRetry': 'Tentar de novo',
  'journey.studio.saveConflict': 'Outra pessoa salvou este livro',
  'journey.studio.saveTakeTheirs': 'A dela',
  'journey.studio.saveKeepMine': 'A minha',
  'journey.studio.rotate': 'Girar',
  'journey.studio.rotateLeft': 'Girar à esquerda',
  'journey.studio.rotateRight': 'Girar à direita',
  'journey.studio.saveReadOnly': 'Somente leitura, nada é salvo',
};
export default journey;
