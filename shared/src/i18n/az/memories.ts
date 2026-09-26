import type { TranslationStrings } from '../types';

const memories: TranslationStrings = {
  'memories.title': 'Fotolar',
  'memories.notConnected': '{provider_name} qoşulmayıb',
  'memories.notConnectedHint':
    'Bu səyahətə fotolar əlavə etmək üçün Tənzimləmələr bölməsində {provider_name} serverinizi qoşun.',
  'memories.notConnectedMultipleHint':
    'Bu səyahətə fotolar əlavə etmək üçün Tənzimləmələr bölməsində bu foto provayderlərindən birini qoşun: {provider_names}.',

  'memories.noDates':
    'Fotoları yükləmək üçün səyahətinizə tarixlər əlavə edin.',
  'memories.noPhotos': 'Heç bir foto tapılmadı',
  'memories.noPhotosHint':
    'Bu səyahətin tarix aralığı üçün {provider_name} daxilində heç bir foto tapılmadı.',
  'memories.photosFound': 'foto',
  'memories.fromOthers': 'başqalarından',

  'memories.sharePhotos': 'Fotoları paylaş',
  'memories.sharing': 'Paylaşım',
  'memories.reviewTitle': 'Fotolarınızı nəzərdən keçirin',
  'memories.reviewHint':
    'Paylaşılmasını istəmədiyiniz fotolara klikləyin.',
  'memories.shareCount': '{count} foto paylaş',

  'memories.providerUrl': 'Server URL-i',
  'memories.providerApiKey': 'API açarı',
  'memories.providerUsername': 'İstifadəçi adı',
  'memories.providerPassword': 'Parol',
  'memories.providerOTP': 'MFA kodu (aktivdirsə)',
  'memories.skipSSLVerification':
    'SSL sertifikatı yoxlamasını keç',
  'memories.immichAutoUpload':
    'Yüklənən səyahət fotolarını Immich-ə də köçür',
  'memories.providerUrlHintSynology':
    'URL-ə Photos tətbiqinin yolunu daxil edin, məsələn, https://nas:5001/photo',

  'memories.testConnection': 'Bağlantını yoxla',
  'memories.testShort': 'Yoxla',
  'memories.testFirst': 'Əvvəlcə bağlantını yoxlayın',
  'memories.connected': 'Qoşulub',
  'memories.disconnected': 'Qoşulmayıb',
  'memories.connectionSuccess': '{provider_name} ilə bağlantı yaradıldı',
  'memories.connectionError':
    '{provider_name} ilə bağlantı yaratmaq mümkün olmadı',
  'memories.saved':
    '{provider_name} tənzimləmələri yadda saxlanıldı',
  'memories.providerDisconnectedBanner':
    '{provider_name} ilə bağlantınız kəsilib. Fotolara baxmaq üçün Tənzimləmələr bölməsində yenidən qoşulun.',
  'memories.saveError':
    '{provider_name} tənzimləmələrini yadda saxlamaq mümkün olmadı',

  'memories.addPhotos': 'Fotolar əlavə et',
  'memories.linkAlbum': 'Albomu əlaqələndir',
  'memories.selectAlbum': '{provider_name} albomu seç',
  'memories.selectAlbumMultiple': 'Albom seç',
  'memories.noAlbums': 'Heç bir albom tapılmadı',
  'memories.syncAlbum': 'Albomu sinxronlaşdır',
  'memories.unlinkAlbum': 'Albomla əlaqəni sil',
  'memories.photos': 'foto',

  'memories.selectPhotos': '{provider_name} daxilindən fotolar seç',
  'memories.selectPhotosMultiple': 'Fotolar seç',
  'memories.selectHint': 'Seçmək üçün fotolara toxunun.',
  'memories.selected': 'seçilib',
  'memories.addSelected': '{count} foto əlavə et',
  'memories.alreadyAdded': 'Əlavə edilib',

  'memories.private': 'Şəxsi',
  'memories.stopSharing': 'Paylaşımı dayandır',
  'memories.oldest': 'Əvvəlcə ən köhnələr',
  'memories.newest': 'Əvvəlcə ən yenilər',
  'memories.allLocations': 'Bütün məkanlar',
  'memories.tripDates': 'Səyahət tarixləri',
  'memories.allPhotos': 'Bütün fotolar',

  'memories.confirmShareTitle':
    'Səyahət üzvləri ilə paylaşılsın?',
  'memories.confirmShareHint':
    '{count} foto bu səyahətin bütün üzvlərinə görünəcək. Daha sonra ayrı-ayrı fotoları şəxsi edə bilərsiniz.',
  'memories.confirmShareButton': 'Fotoları paylaş',

  'memories.error.loadAlbums':
    'Albomları yükləmək mümkün olmadı',
  'memories.error.linkAlbum':
    'Albomu əlaqələndirmək mümkün olmadı',
  'memories.error.unlinkAlbum':
    'Albomla əlaqəni silmək mümkün olmadı',
  'memories.error.syncAlbum':
    'Albomu sinxronlaşdırmaq mümkün olmadı',
  'memories.error.loadPhotos':
    'Fotoları yükləmək mümkün olmadı',
  'memories.error.addPhotos':
    'Fotoları əlavə etmək mümkün olmadı',
  'memories.error.removePhoto':
    'Fotonu silmək mümkün olmadı',
  'memories.error.toggleSharing':
    'Paylaşım vəziyyətini yeniləmək mümkün olmadı',

  'memories.saveRouteNotConfigured':
    'Bu provayder üçün yadda saxlama marşrutu konfiqurasiya edilməyib',
  'memories.testRouteNotConfigured':
    'Bu provayder üçün yoxlama marşrutu konfiqurasiya edilməyib',
  'memories.fillRequiredFields':
    'Bütün tələb olunan sahələri doldurun',
};

export default memories;