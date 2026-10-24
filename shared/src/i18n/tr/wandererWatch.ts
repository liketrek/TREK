import type { TranslationStrings } from '../types';

const wandererWatch: TranslationStrings = {
  'wanderer.watch.label': 'Rotalarımdaki değişiklikleri denetle',
  'wanderer.watch.hint': 'İçe aktarılan bir rota değişmiş olabilirse bildirim.',
  'wanderer.watch.info':
    'TREK, içe aktardığın her rotanın kısa kaydını günde en fazla bir kez okur, GPX dosyasını asla. Yalnızca bildirir: bir değişikliğin alınıp alınmayacağına turun kaynak denetimiyle sen karar verirsin.',
  'wanderer.watch.notConnected': 'Önce wanderer bağla',
  'wanderer.watch.on': 'Arka plan denetimi açıldı',
  'wanderer.watch.off': 'Arka plan denetimi kapatıldı',
  'wanderer.watch.failed': 'Arka plan denetimi değiştirilemedi',
  'wanderer.watch.lastRun': 'Son denetim {date}',
  'wanderer.watch.neverRun': 'Henüz denetlenmedi',
  'wanderer.watch.paused': '{time} saatine kadar duraklatıldı',
  'wanderer.watch.pausedHint':
    'wanderer yanıt vermedi. TREK her başarısızlıktan sonra yeniden sormadan önce daha uzun bekler.',
  'wanderer.watch.blocked': 'Belirteç reddedildi',
  'wanderer.watch.blockedHint':
    'wanderer API belirtecini reddetti. Bir bağlantı testi geçtiğinde ya da yeni bir belirteç kaydedildiğinde denetim sürer.',
  'wanderer.watch.hints': 'İpuçları',
  'wanderer.watch.hintsCount': '{count} açık ipucu',
  'wanderer.watch.hintsCount.one': '{count} açık ipucu',
  'wanderer.watch.empty': 'Açık ipucu yok',
  'wanderer.watch.dialogTitle': 'Rotalarınla ilgili ipuçları',
  'wanderer.watch.openTour': 'Turu aç',
  'wanderer.watch.checkedAt': 'Denetlendi {date}',
  'wanderer.watch.noticeLabel': 'Arka plan denetimi',
  'wanderer.watch.state.possible_change': 'Değişmiş olabilir',
  'wanderer.watch.state.changed': 'Değişti',
  'wanderer.watch.state.unverifiable': 'Denetlenemiyor',
  'wanderer.watch.stateHint.possible_change':
    'wanderer rotanın zaman damgasını değiştirdi. İçeriğin farklı olup olmadığını yalnızca kaynak denetimi gösterir.',
  'wanderer.watch.stateHint.changed':
    'wanderer kaydı başka bir ad ya da açıklama gösteriyor. Kaynak denetimi değişen her şeyi gösterir.',
  'wanderer.watch.stateHint.unverifiable':
    'TREK bu rotayı değerlendiremedi, bu yüzden değişip değişmediği hakkında bir şey söylenmiyor.',
  'wanderer.watch.reason.unavailable': 'Rotaya ulaşılamıyor',
  'wanderer.watch.reason.no_change_time': 'Zaman damgası yok',
};
export default wandererWatch;
