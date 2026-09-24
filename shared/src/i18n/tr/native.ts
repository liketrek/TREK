import type { TranslationStrings } from '../types';

const native: TranslationStrings = {
  'native.connect.title': 'TREK’e bağlan',
  'native.connect.hint': 'TREK’i tarayıcında açtığın adresi gir.',
  'native.connect.placeholder': 'trek.example.com',
  'native.connect.submit': 'Bağlan',
  'native.connect.checking': 'Kontrol ediliyor…',
  'native.connect.errorInvalid': 'Bu bir web adresine benzemiyor.',
  'native.connect.errorUnreachable': 'Bu adreste yanıt veren bir sunucu yok. Adresi ve bağlantını kontrol et.',
  'native.connect.errorNotTrek': 'Bu adresteki sunucu TREK değil.',
  'native.connect.errorTooOld': 'Bu TREK sunucusu uygulama için çok eski. Önce güncellenmesi gerekiyor.',
  'native.offline.title': 'Sunucuya ulaşılamıyor',
  'native.offline.hint': 'TREK, {server} adresine ulaşamadı. Bağlantını kontrol edip tekrar dene.',
  'native.offline.retry': 'Tekrar dene',
  'native.changeServer': 'Sunucuyu değiştir',
  'native.login.failed': 'Giriş yapılamadı. Lütfen tekrar dene.',
  'native.handoff.title': 'Uygulamada devam et',
  'native.handoff.hint': '{name} olarak giriş yaptın. Girişi tamamlamak için TREK uygulamasını aç.',
  'native.handoff.open': 'TREK uygulamasını aç',
  'native.handoff.switchAccount': 'Başka bir hesap kullan',
  'native.settings.server': 'Sunucu',
  'native.settings.serverHint': 'Bu uygulama {server} adresine bağlı.',
};

export default native;
