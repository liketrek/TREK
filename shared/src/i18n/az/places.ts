import type { TranslationStrings } from '../types';

const places: TranslationStrings = {
  'places.addPlace': 'Məkan/Fəaliyyət əlavə et',
  'places.addToSelectedDay': 'Açıq günə əlavə et',
  'places.addPlaceShort': 'Yeni məkan',
  'places.addToDayShort': 'Günə əlavə et',
  'places.importFile': 'Faylı idxal et',
  'places.trackIndicator': 'İz / marşrut',
  'places.sidebarDrop': 'İdxal etmək üçün buraya burax',
  'places.importFileHint':
    'Google My Maps, Google Earth və ya GPS izləyicisi kimi alətlərdən .gpx, .kml və ya .kmz fayllarını idxal edin.',
  'places.importFileDropHere':
    'Fayl seçmək üçün klikləyin və ya faylı buraya sürükləyib buraxın',
  'places.importFileDropActive': 'Seçmək üçün faylı buraya buraxın',
  'places.importFileUnsupported':
    'Dəstəklənməyən fayl növüdür. .gpx, .kml və ya .kmz istifadə edin.',
  'places.importFileTooLarge':
    'Fayl həddindən çox böyükdür. Maksimum yükləmə ölçüsü {maxMb} MB-dır.',
  'places.importFileError': 'İdxal uğursuz oldu',
  'places.importAllSkipped': 'Bütün məkanlar artıq bu səyahətdə mövcuddur.',

  'places.gpxImported': 'GPX-dən {count} məkan idxal edildi',
  'places.gpxImportTypes': 'Nələri idxal etmək istəyirsiniz?',
  'places.gpxImportWaypoints': 'Yol nöqtələri',
  'places.gpxImportRoutes': 'Marşrutlar',
  'places.gpxImportTracks': 'İzlər (marşrut xətti ilə)',
  'places.gpxImportNoneSelected':
    'İdxal etmək üçün ən azı bir növ seçin.',

  'places.kmlImportTypes': 'Nələri idxal etmək istəyirsiniz?',
  'places.kmlImportPoints': 'Nöqtələr (Placemarks)',
  'places.kmlImportPaths': 'Yollar (LineStrings)',
  'places.kmlImportNoneSelected':
    'İdxal etmək üçün ən azı bir növ seçin.',

  'places.selectionCount': '{count} seçilib',
  'places.deleteSelected': 'Seçilənləri sil',
  'places.changeCategory': 'Kateqoriyanı dəyiş',
  'places.categoryChanged': '{count} məkan yeniləndi',
  'places.kmlKmzImported': 'KMZ/KML-dən {count} məkan idxal edildi',
  'places.urlResolved': 'Məkan URL-dən idxal edildi',
  'places.importList': 'Siyahı idxalı',
  'places.kmlKmzSummaryValues':
    'Məkan nişanları: {total} • İdxal edildi: {created} • Buraxıldı: {skipped}',

  'places.importGoogleList': 'Google siyahısı',
  'places.importNaverList': 'Naver siyahısı',
  'places.googleListHint':
    'Bütün məkanları idxal etmək üçün paylaşılan Google Maps siyahısının linkini daxil edin.',
  'places.googleDirHint':
    'İstiqamət linki də istifadə edilə bilər: dayanacaqlar avtomobillə hərəkət sırasına uyğun məkanlara çevriləcək.',
  'places.googleListImported':
    '“{list}” siyahısından {count} məkan idxal edildi',
  'places.googleListError':
    'Google Maps siyahısını idxal etmək mümkün olmadı',
  'places.naverListHint':
    'Bütün məkanları idxal etmək üçün paylaşılan Naver Maps siyahısının linkini daxil edin.',
  'places.naverListImported':
    '“{list}” siyahısından {count} məkan idxal edildi',
  'places.naverListError':
    'Naver Maps siyahısını idxal etmək mümkün olmadı',

  'places.viewDetails': 'Təfərrüatlara bax',
  'places.assignToDay': 'Hansı günə əlavə edilsin?',
  'places.all': 'Hamısı',
  'places.unplanned': 'Planlaşdırılmayıb',
  'places.planned': 'Planlaşdırılıb',

  /** Shown under the filter tabs while an open day narrows both the list and the map. */
  'places.dayScoped': 'Yalnız açıq gün göstərilir',
  'places.dayScopedClear': 'Bütün səyahəti göstər',

  'places.filterTracks': 'İzlər',
  'places.filterByRating': 'Reytinqə görə filtrlə',
  'places.yourRating': 'Sizin reytinqiniz',
  'places.notRated': 'Hələ qiymətləndirilməyib',
  'places.search': 'Məkanları axtarın...',
  'places.allCategories': 'Bütün kateqoriyalar',
  'places.categoriesSelected': 'kateqoriya',
  'places.clearFilter': 'Filtri təmizlə',
  'places.count': '{count} məkan',
  'places.countSingular': '1 məkan',
  'places.allPlanned': 'Bütün məkanlar planlaşdırılıb',
  'places.noneFound': 'Heç bir məkan tapılmadı',

  'places.editPlace': 'Məkanı redaktə et',
  'places.formName': 'Ad',
  'places.formNamePlaceholder': 'məs. Eyfel qülləsi',
  'places.formDescription': 'Təsvir',
  'places.formDescriptionPlaceholder': 'Qısa təsvir...',
  'places.formAddress': 'Ünvan',
  'places.formAddressPlaceholder': 'Küçə, şəhər, ölkə',
  'places.formLat': 'Enlik (məs. 48.8566)',
  'places.formLng': 'Uzunluq (məs. 2.3522)',
  'places.formCategory': 'Kateqoriya',
  'places.noCategory': 'Kateqoriya yoxdur',
  'places.newCategory': 'Yeni kateqoriya',
  'places.categoryNamePlaceholder': 'Kateqoriyanın adı',
  'places.formTime': 'Vaxt',
  'places.startTime': 'Başlanğıc',
  'places.endTime': 'Son',
  'places.endTimeBeforeStart':
    'Bitmə vaxtı başlanğıc vaxtından əvvəldir',
  'places.timeCollision': 'Vaxt üst-üstə düşür:',
  'places.formWebsite': 'Veb-sayt',
  'places.formNotes': 'Qeydlər',
  'places.formNotesPlaceholder': 'Şəxsi qeydlər...',
  'places.assignmentNotes': 'Bu gün üçün qeydlər',
  'places.assignmentNotesPlaceholder':
    'Bu məkan haqqında yalnız bu günə aid qeydlər...',
  'places.formReservation': 'Rezervasiya',
  'places.reservationNotesPlaceholder':
    'Rezervasiya qeydləri, təsdiq nömrəsi...',
  'places.mapsSearchPlaceholder': 'Məkanları axtarın...',
  'places.mapsSearchError': 'Məkan axtarışı uğursuz oldu.',
  'places.searchGoogleInstead':
    'Axtardığınız məkan deyil? Əvəzində Google-da axtarın',
  'places.loadingDetails': 'Məkan təfərrüatları yüklənir…',
  'places.osmHint':
    'OpenStreetMap axtarışından istifadə edilir (fotolar, iş saatları və reytinqlər yoxdur). Tam təfərrüatlar üçün tənzimləmələrdə Google API açarı əlavə edin.',

  'places.source.amap': 'Amap',
  'places.details.title': 'Məkan təfərrüatları',
  'places.details.empty': 'Ətraflı məlumat üçün bir nəticə seçin',
  'places.details.loading': 'Təfərrüatlar yüklənir...',
  'places.details.error': 'Təfərrüatları yükləmək mümkün olmadı.',
  'places.details.disabled':
    'Əlavə məlumatların əldə edilməsi administrator tərəfindən deaktiv edilib.',
  'places.details.noPhotos': 'Bu məkan üçün heç bir şəkil tapılmadı.',
  'places.details.pickImage': 'Şəkil seç',
  'places.details.description': 'Təsvir',
  'places.details.adopt': 'Bu mətndən istifadə et',
  'places.details.adoptBlocked': 'Əvvəlcə təsvir sahəsini təmizləyin',
  'places.details.facts': 'Faydalı məlumatlar',
  'places.details.nothing': 'Bu məkan haqqında məlumat tapılmadı.',
  'places.details.aboutBrand': 'Şəbəkə haqqında',
  'places.details.aboutBrandNote':
    'Bu məlumat həmin filialı deyil, ümumi şəbəkəni təsvir edir.',
  'places.details.fact.rating': 'Reytinq',
  'places.details.fact.cuisine': 'Mətbəx',
  'places.details.fact.openingHours': 'İş saatları',
  'places.details.fact.menu': 'Menyu',
  'places.details.fact.outdoorSeating': 'Açıq havada oturacaq yerləri',
  'places.details.fact.takeaway': 'Paket servis',
  'places.details.fact.delivery': 'Çatdırılma',
  'places.details.fact.wheelchair': 'Pilləsiz giriş',
  'places.details.fact.vegetarian': 'Vegetarian',
  'places.details.fact.vegan': 'Veqan',
  'places.details.fact.internetAccess': 'Wi-Fi',

  'places.categoryCreateError': 'Kateqoriya yaratmaq mümkün olmadı',
  'places.nameRequired': 'Ad daxil edin',
  'places.saveError': 'Yadda saxlamaq mümkün olmadı',
  'places.createExpenseHint':
    'Məkanı yadda saxlayır, sonra Xərclər redaktorunu açır.',
  'places.duplicateExists': '“{name}” artıq bu səyahətdə mövcuddur.',
  'places.addAnyway': 'Yenə də əlavə et',

  'places.enrichOnImport': 'Məkan məlumatlarını Google vasitəsilə tamamla',
  'places.enrichOnImportHint':
    'Foto, ünvan və əlaqə məlumatlarını əlavə etmək üçün idxal edilən hər məkanı axtarır. Google Maps açarınızdan istifadə edir.',

  'places.uploadImage': 'Şəkil yüklə',
  'places.changeImage': 'Şəkli dəyiş',
  'places.removeImage': 'Şəkli sil',
  'places.imageUploadError': 'Şəkli yükləmək mümkün olmadı',
  'places.imageRemoveError': 'Şəkli silmək mümkün olmadı',
};

export default places;