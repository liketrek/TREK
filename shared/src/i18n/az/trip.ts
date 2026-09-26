import type { TranslationStrings } from '../types';

const trip: TranslationStrings = {
  'trip.tabs.plan': 'Plan',
  'trip.tabs.transports': 'Nəqliyyat',
  'trip.tabs.reservations': 'Rezervasiyalar',
  'trip.tabs.reservationsShort': 'Rezervasiya',
  'trip.tabs.packing': 'Baqaj siyahısı',
  'trip.tabs.packingShort': 'Baqaj',
  'trip.tabs.lists': 'Siyahılar',
  'trip.tabs.listsShort': 'Siyahılar',
  'trip.tabs.budget': 'Xərclər',
  'trip.tabs.files': 'Fayllar',

  'trip.loading': 'Səyahət yüklənir...',
  'trip.loadingPhotos': 'Məkan fotoları yüklənir...',
  'trip.loadingSteps.pack': 'Çantalarınız hazırlanır...',
  'trip.loadingSteps.road': 'Yola çıxırıq...',
  'trip.loadingSteps.arrive': 'Az qaldı...',

  'trip.mobilePlan': 'Plan',
  'trip.mobilePlaces': 'Məkanlar',

  'trip.toast.placeUpdated': 'Məkan yeniləndi',
  'trip.toast.tripUpdated': 'Səyahət yeniləndi',
  'trip.toast.placeAdded': 'Məkan əlavə edildi',
  'trip.toast.placeDeleted': 'Məkan silindi',
  'trip.toast.selectDay': 'Əvvəlcə bir gün seçin',
  'trip.toast.assignedToDay': 'Məkan günə təyin edildi',
  'trip.toast.loadError': 'Səyahəti yükləmək mümkün olmadı',
  'trip.toast.reorderError': 'Sıralamanı dəyişmək mümkün olmadı',
  'trip.toast.reservationUpdated': 'Rezervasiya yeniləndi',
  'trip.toast.reservationAdded': 'Rezervasiya əlavə edildi',
  'trip.toast.deleted': 'Silindi',

  'trip.confirm.deletePlace': 'Bu məkanı silmək istədiyinizə əminsiniz?',
  'trip.confirm.deletePlaces': '{count} məkan silinsin?',
  'trip.toast.placesDeleted': '{count} məkan silindi',

  'trip.invite.linkTitle': 'Səyahət dəvət linki',
  'trip.invite.linkHint':
    'Bu linki açan istənilən TREK istifadəçisi səyahətə üzv kimi qoşulacaq. Köhnə linki etibarsız etmək üçün yenisini yaradın.',
  'trip.invite.create': 'Dəvət linki yarat',
  'trip.invite.regenerate': 'Yenidən yarat',
  'trip.invite.disable': 'Deaktiv et',
  'trip.invite.joinHeading': 'Bu səyahətə qoşulun',
  'trip.invite.joinPrompt': 'Siz “{title}” səyahətinə dəvət edilmisiniz.',
  'trip.invite.joinCta': 'Səyahətə qoşul',
  'trip.invite.joining': 'Qoşulur…',
  'trip.invite.invalidTitle': 'Dəvət əlçatan deyil',
  'trip.invite.invalid': 'Bu dəvət linki etibarsızdır və ya vaxtı bitib.',
  'trip.invite.backToDashboard': 'İdarə panelinə qayıt',

  'transit.title': 'İctimai nəqliyyat',
  'transit.from': 'Haradan',
  'transit.to': 'Haraya',
  'transit.searchStop': 'Dayanacaq və ya stansiya axtarın…',
  'transit.swap': 'Yerlərini dəyiş',
  'transit.depart': 'Yola düşmə',
  'transit.arrive': 'Çatma',
  'transit.mode.rail': 'Qatar',
  'transit.mode.subway': 'Metro',
  'transit.mode.tram': 'Tramvay',
  'transit.mode.bus': 'Avtobus',
  'transit.mode.ferry': 'Bərə',
  'transit.mode.cable': 'Kanat yolu',
  'transit.pref.best': 'Ən yaxşı marşrut',
  'transit.pref.transfers': 'Daha az dəyişmə',
  'transit.pref.walking': 'Daha az piyada yol',
  'transit.search': 'Axtar',
  'transit.searching': 'Axtarılır…',
  'transit.searchError': 'Marşrut axtarışı uğursuz oldu. Yenidən cəhd edin.',
  'transit.noResultsVia':
    '{provider} vasitəsilə uyğun bağlantı tapılmadı. Başqa vaxt və ya filtrlər seçin.',
  'transit.noResults':
    'Uyğun bağlantı tapılmadı. Başqa vaxt və ya filtrlər seçin.',
  'transit.direct': 'Birbaşa',
  'transit.transfers': '{count} dəyişmə',
  'transit.min': '{count} dəq.',
  'transit.stops': '{count} dayanacaq',
  'transit.walkTo': '{name} istiqamətinə piyada gedin',
  'transit.platform': 'Platforma {track}',
  'transit.adding': 'Əlavə edilir…',
  'transit.addToDay': 'Günə əlavə et',
  'transit.itinerary': 'Marşrut planı',
  'transit.attribution': 'Marşrut məlumatlarının mənbəyi:',

  'transport.modeManual': 'Əl ilə',
  'transport.modeAutomated': 'Avtomatik',

  'transit.sectionTitle': 'Avtomatik ictimai nəqliyyat',
  'transit.changeRoute': 'Marşrutu dəyiş',
  'transit.editDetails': 'Təfərrüatları redaktə et',
  'transit.journey': 'İctimai nəqliyyatla səfər',
  'transit.pickDay': 'Bağlantıları axtarmaq üçün bir gün seçin.',
  'transit.noItinerary':
    'Bu qeyddə saxlanılmış marşrut yoxdur — marşrut axtarmaq üçün “Marşrutu dəyiş” seçimindən istifadə edin.',
  'transit.durationLabel': 'Müddət',
  'transit.transfersLabel': 'Dəyişmələr',
  'transit.walkLabel': 'Piyada',
  'transit.searchHint':
    'Real bağlantıları axtarın və birbaşa günə əlavə edin — məlumatlar Transitous tərəfindən təmin edilir.',

  'trip.confirm.deletePlaceNight':
    'Bu, həmçinin “{name}” məkanında rezervasiya edilmiş qalmanı silir.',
  'trip.confirm.deletePlaceBooked':
    'Bu, həmçinin “{name}” məkanında rezervasiya edilmiş qalmanı, “{booking}” rezervasiyasını və onunla əlaqəli bütün xərcləri silir.',
  'trip.confirm.deletePlaceBookedSame':
    'Bu, həmçinin “{name}” məkanında rezervasiya edilmiş qalmanı, onun rezervasiyasını və əlaqəli bütün xərcləri silir.',
};

export default trip;