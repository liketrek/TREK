import type { TranslationStrings } from '../types';

const wandererWatch: TranslationStrings = {
  'wanderer.watch.label': 'Marşrutlarımdakı dəyişiklikləri yoxla',
  'wanderer.watch.hint': 'İdxal edilmiş marşrut dəyişmiş ola bilərsə bildiriş.',
  'wanderer.watch.info':
    'TREK idxal etdiyin hər marşrutun qısa qeydini gündə ən çox bir dəfə oxuyur, GPX faylını isə heç vaxt. O, yalnız bildirir: dəyişikliyin qəbul edilib-edilməməsinə turun mənbə yoxlaması ilə özün qərar verirsən.',
  'wanderer.watch.notConnected': 'Əvvəlcə wanderer qoş',
  'wanderer.watch.on': 'Fon yoxlaması açıldı',
  'wanderer.watch.off': 'Fon yoxlaması bağlandı',
  'wanderer.watch.failed': 'Fon yoxlamasını dəyişmək alınmadı',
  'wanderer.watch.lastRun': 'Son yoxlama {date}',
  'wanderer.watch.neverRun': 'Hələ yoxlanmayıb',
  'wanderer.watch.paused': '{time} vaxtınadək dayandırılıb',
  'wanderer.watch.pausedHint':
    'wanderer cavab vermədi. Hər uğursuzluqdan sonra TREK yenidən soruşmazdan əvvəl daha uzun gözləyir.',
  'wanderer.watch.blocked': 'Token rədd edildi',
  'wanderer.watch.blockedHint':
    'wanderer API tokenini rədd etdi. Bağlantı testi keçəndə və ya yeni token saxlananda yoxlama davam edir.',
  'wanderer.watch.hints': 'Xəbərdarlıqlar',
  'wanderer.watch.hintsCount': '{count} açıq xəbərdarlıq',
  'wanderer.watch.hintsCount.one': '{count} açıq xəbərdarlıq',
  'wanderer.watch.empty': 'Açıq xəbərdarlıq yoxdur',
  'wanderer.watch.dialogTitle': 'Marşrutların barədə xəbərdarlıqlar',
  'wanderer.watch.openTour': 'Turu aç',
  'wanderer.watch.checkedAt': 'Yoxlanıb {date}',
  'wanderer.watch.noticeLabel': 'Fon yoxlaması',
  'wanderer.watch.state.possible_change': 'Dəyişmiş ola bilər',
  'wanderer.watch.state.changed': 'Dəyişib',
  'wanderer.watch.state.unverifiable': 'Yoxlanıla bilmir',
  'wanderer.watch.stateHint.possible_change':
    'wanderer marşrutun vaxt möhürünü dəyişdi. Məzmunun fərqli olub-olmadığını yalnız mənbə yoxlaması göstərir.',
  'wanderer.watch.stateHint.changed':
    'wanderer qeydi başqa ad və ya təsvir göstərir. Mənbə yoxlaması dəyişən hər şeyi göstərir.',
  'wanderer.watch.stateHint.unverifiable':
    'TREK bu marşrutu qiymətləndirə bilmədi, ona görə də dəyişiklik barədə heç nə deyilmir.',
  'wanderer.watch.reason.unavailable': 'Marşruta çatmaq olmur',
  'wanderer.watch.reason.no_change_time': 'Vaxt möhürü yoxdur',
};
export default wandererWatch;
