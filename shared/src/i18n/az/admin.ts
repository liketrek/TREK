import type { TranslationStrings } from '../types';

const admin: TranslationStrings = {
  'admin.notifications.title': 'Bildirişlər',
  'admin.notifications.hint': 'Bir bildiriş kanalı seçin. Eyni anda yalnız biri aktiv ola bilər.',
  'admin.notifications.none': 'Deaktivdir',
  'admin.notifications.email': 'E-poçt (SMTP)',
  'admin.notifications.webhook': 'Webhook',
  'admin.notifications.ntfy': 'Ntfy',
  'admin.ntfy.hint':
    'İstifadəçilərə push bildirişləri üçün öz ntfy mövzularını konfiqurasiya etməyə icazə verin. İstifadəçi tənzimləmələrinin əvvəlcədən doldurulması üçün aşağıda standart serveri təyin edin.',
  'admin.notifications.save': 'Bildiriş tənzimləmələrini yadda saxla',
  'admin.notifications.saved': 'Bildiriş tənzimləmələri yadda saxlanıldı',
  'admin.notifications.testWebhook': 'Sınaq webhook-u göndər',
  'admin.notifications.testWebhookSuccess': 'Sınaq webhook-u uğurla göndərildi',
  'admin.notifications.testWebhookFailed': 'Sınaq webhook-u uğursuz oldu',
  'admin.notifications.testNtfy': 'Sınaq ntfy bildirişi göndər',
  'admin.notifications.testNtfySuccess': 'Sınaq ntfy bildirişi uğurla göndərildi',
  'admin.notifications.testNtfyFailed': 'Sınaq ntfy bildirişi uğursuz oldu',
  'admin.notifications.emailPanel.title': 'E-poçt (SMTP)',
  'admin.notifications.webhookPanel.title': 'Webhook',
  'admin.notifications.webPushPanel.title': 'Web Push',
  'admin.notifications.webPushPanel.hint':
    'İstifadəçilərə TREK bağlı olanda belə brauzer vasitəsilə telefon və kompüterlərində bildiriş almağa imkan verir. HTTPS tələb olunur; iPhone və iPad-də TREK Əsas ekrana əlavə edilməlidir.',
  'admin.notifications.inappPanel.title': 'Tətbiqdaxili',
  'admin.notifications.inappPanel.hint':
    'Tətbiqdaxili bildirişlər həmişə aktivdir və ümumi şəkildə deaktiv edilə bilməz.',
  'admin.notifications.adminWebhookPanel.title': 'Administrator webhook-u',
  'admin.notifications.adminWebhookPanel.hint':
    'Bu webhook yalnız administrator bildirişləri üçün istifadə edilir (məsələn, versiya xəbərdarlıqları). O, istifadəçi webhook-larından ayrıdır və təyin edildikdə həmişə işə düşür.',
  'admin.notifications.adminWebhookPanel.saved': 'Administrator webhook URL-si yadda saxlanıldı',
  'admin.notifications.adminWebhookPanel.testSuccess': 'Sınaq webhook-u uğurla göndərildi',
  'admin.notifications.adminWebhookPanel.testFailed': 'Sınaq webhook-u uğursuz oldu',
  'admin.notifications.adminWebhookPanel.alwaysOnHint':
    'URL konfiqurasiya edildikdə administrator webhook-u həmişə işə düşür',
  'admin.notifications.adminNtfyPanel.title': 'Administrator Ntfy',
  'admin.notifications.adminNtfyPanel.hint':
    'Bu ntfy mövzusu yalnız administrator bildirişləri üçün istifadə edilir (məsələn, versiya xəbərdarlıqları). O, istifadəçi mövzularından ayrıdır və konfiqurasiya edildikdə həmişə işə düşür.',
  'admin.notifications.adminNtfyPanel.serverLabel': 'Ntfy server URL-si',
  'admin.notifications.adminNtfyPanel.serverHint':
    'İstifadəçi ntfy bildirişləri üçün standart server kimi də istifadə edilir. Standart olaraq ntfy.sh istifadə etmək üçün boş saxlayın. İstifadəçilər bunu öz tənzimləmələrində dəyişə bilərlər.',
  'admin.notifications.adminNtfyPanel.serverPlaceholder': 'https://ntfy.sh',
  'admin.notifications.adminNtfyPanel.topicLabel': 'Administrator mövzusu',
  'admin.notifications.adminNtfyPanel.topicPlaceholder': 'trek-admin-alerts',
  'admin.notifications.adminNtfyPanel.tokenLabel': 'Giriş tokeni (istəyə bağlı)',
  'admin.notifications.adminNtfyPanel.tokenCleared': 'Administrator giriş tokeni təmizləndi',
  'admin.notifications.adminNtfyPanel.saved': 'Administrator ntfy tənzimləmələri yadda saxlanıldı',
  'admin.notifications.adminNtfyPanel.test': 'Sınaq ntfy bildirişi göndər',
  'admin.notifications.adminNtfyPanel.testSuccess': 'Sınaq ntfy bildirişi uğurla göndərildi',
  'admin.notifications.adminNtfyPanel.testFailed': 'Sınaq ntfy bildirişi uğursuz oldu',
  'admin.notifications.adminNtfyPanel.alwaysOnHint':
    'Mövzu konfiqurasiya edildikdə administrator ntfy bildirişi həmişə işə düşür',
  'admin.notifications.adminNotificationsHint':
    'Yalnız administratorlara aid bildirişləri hansı kanalların çatdıracağını konfiqurasiya edin (məsələn, versiya xəbərdarlıqları).',
  'admin.notifications.tripReminders.title': 'Səyahət xatırlatmaları',
  'admin.notifications.tripReminders.hint':
    'Səyahət başlamazdan əvvəl xatırlatma bildirişi göndərin (səyahətdə xatırlatma günlərinin təyin edilməsi tələb olunur).',
  'admin.notifications.tripReminders.enabled': 'Səyahət xatırlatmaları aktivdir',
  'admin.notifications.tripReminders.disabled': 'Səyahət xatırlatmaları deaktivdir',
  'admin.smtp.title': 'E-poçt və bildirişlər',
  'admin.smtp.hint': 'E-poçt bildirişlərinin göndərilməsi üçün SMTP konfiqurasiyası.',
  'admin.smtp.testButton': 'Sınaq e-poçtu göndər',
  'admin.webhook.hint':
    'İstifadəçilərə bildirişlər üçün öz webhook URL-lərini konfiqurasiya etməyə icazə verin (Discord, Slack və s.).',
  'admin.smtp.testSuccess': 'Sınaq e-poçtu uğurla göndərildi',
  'admin.smtp.testFailed': 'Sınaq e-poçtu uğursuz oldu',
  'admin.title': 'İdarəetmə',
  'admin.subtitle': 'İstifadəçi idarəetməsi və sistem tənzimləmələri',
  'admin.tabs.users': 'İstifadəçilər',
  'admin.tabs.categories': 'Kateqoriyalar',
  'admin.tabs.backup': 'Ehtiyat nüsxə',
  'admin.tabs.notifications': 'Bildirişlər',
  'admin.tabs.audit': 'Audit',
  'admin.stats.users': 'İstifadəçilər',
  'admin.stats.trips': 'Səyahətlər',
  'admin.stats.places': 'Məkanlar',
  'admin.stats.photos': 'Fotolar',
  'admin.stats.files': 'Fayllar',
  'admin.table.user': 'İstifadəçi',
  'admin.table.email': 'E-poçt',
  'admin.table.role': 'Rol',
  'admin.table.created': 'Yaradılıb',
  'admin.table.lastLogin': 'Son giriş',
  'admin.table.actions': 'Əməliyyatlar',
  'admin.you': '(Siz)',
  'admin.editUser': 'İstifadəçini redaktə et',
  'admin.newPassword': 'Yeni parol',
  'admin.newPasswordHint': 'Cari parolu saxlamaq üçün boş saxlayın',
  'admin.deleteUser':
    '"{name}" istifadəçisi silinsin? Bütün səyahətləri həmişəlik silinəcək.',
  'admin.deleteUserTitle': 'İstifadəçini sil',
  'admin.newPasswordPlaceholder': 'Yeni parolu daxil edin…',
  'admin.toast.loadError': 'Administrator məlumatlarını yükləmək mümkün olmadı',
  'admin.toast.userUpdated': 'İstifadəçi yeniləndi',
  'admin.toast.updateError': 'Yeniləmək mümkün olmadı',
  'admin.toast.userDeleted': 'İstifadəçi silindi',
  'admin.toast.deleteError': 'Silmək mümkün olmadı',
  'admin.toast.cannotDeleteSelf': 'Öz hesabınızı silə bilməzsiniz',
  'admin.toast.userCreated': 'İstifadəçi yaradıldı',
  'admin.toast.createError': 'İstifadəçi yaratmaq mümkün olmadı',
  'admin.toast.fieldsRequired': 'İstifadəçi adı, e-poçt və parol tələb olunur',
  'admin.createUser': 'İstifadəçi yarat',
  'admin.invite.title': 'Dəvət keçidləri',
  'admin.invite.subtitle': 'Birdəfəlik qeydiyyat keçidləri yaradın',
  'admin.invite.create': 'Keçid yarat',
  'admin.invite.createAndCopy': 'Yarat və kopyala',
  'admin.invite.empty': 'Hələ heç bir dəvət keçidi yaradılmayıb',
  'admin.invite.maxUses': 'Maksimum istifadə',
  'admin.invite.expiry': 'Bu müddətdən sonra bitir',
  'admin.invite.uses': 'istifadə edilib',
  'admin.invite.expiresAt': 'bitmə vaxtı',
  'admin.invite.createdBy': 'yaradan',
  'admin.invite.active': 'Aktiv',
  'admin.invite.expired': 'Müddəti bitib',
  'admin.invite.usedUp': 'İstifadə limiti bitib',
  'admin.invite.copied': 'Dəvət keçidi mübadilə buferinə kopyalandı',
  'admin.invite.copyLink': 'Keçidi kopyala',
  'admin.invite.deleted': 'Dəvət keçidi silindi',
  'admin.invite.createError': 'Dəvət keçidi yaratmaq mümkün olmadı',
  'admin.invite.deleteError': 'Dəvət keçidini silmək mümkün olmadı',
  'admin.tabs.settings': 'Tənzimləmələr',
  'admin.allowRegistration': 'Qeydiyyata icazə ver',
  'admin.allowRegistrationHint': 'Yeni istifadəçilər özləri qeydiyyatdan keçə bilərlər',
  'admin.authMethods': 'Doğrulama üsulları',
  'admin.passwordLogin': 'Parolla giriş',
  'admin.passwordLoginHint': 'İstifadəçilərə e-poçt və parolla daxil olmağa icazə verin',
  'admin.passwordRegistration': 'Parolla qeydiyyat',
  'admin.passwordRegistrationHint':
    'Yeni istifadəçilərə e-poçt və parolla qeydiyyatdan keçməyə icazə verin',
  'admin.oidcLogin': 'SSO ilə giriş',
  'admin.oidcLoginHint': 'İstifadəçilərə SSO ilə daxil olmağa icazə verin',
  'admin.oidcRegistration': 'SSO ilə avtomatik hesab yaratma',
  'admin.oidcRegistrationHint': 'Yeni SSO istifadəçiləri üçün avtomatik hesab yaradın',
  'admin.envOverrideHint':
    'Parolla giriş tənzimləmələri OIDC_ONLY mühit dəyişəni ilə idarə olunur və burada dəyişdirilə bilməz.',
  'admin.lockoutWarning': 'Ən azı bir giriş üsulu aktiv qalmalıdır',
  'admin.requireMfa': 'İki faktorlu doğrulamanı (2FA) tələb et',
  'admin.requireMfaHint':
    '2FA-sı olmayan istifadəçilər tətbiqdən istifadə etməzdən əvvəl Tənzimləmələr bölməsində quraşdırmanı tamamlamalıdırlar.',
  'admin.apiKeys': 'API açarları',
  'admin.apiKeysHint':
    'Məkan məlumatlarının haradan əldə edildiyi. TREK indeksinə açar lazım deyil; aşağıdakı iki provayder istəyə bağlıdır.',
  'admin.trekApi.badgeDefault': 'Tövsiyə edilən standart',
  'admin.googleCaveat.badge': 'Tövsiyə edilmir',
  'admin.googleCaveat.body':
    'TREK açıq mənbəlidir və biz burada bitərəf deyilik. Adi müəssisələrin reytinqləri və fotoları bu miqyasda yalnız Google-da mövcuddur və inhisar məhz budur. Bu sahə onu tövsiyə etdiyimiz üçün deyil, alternativ olmadığı üçün buradadır. Bundan sonra hər sorğu Google-a göndərilir.',
  'admin.trekApi.tagline':
    'TREK-in öz məkan indeksi. Google açarı, kvota və sorğularınızı sayan heç kim olmadan axtarış edin.',
  'admin.trekApi.factPlaces': 'Dünya üzrə 73,6 milyon məkan',
  'admin.trekApi.factNoKey': 'Açar yoxdur, kvota yoxdur',
  'admin.trekApi.factOffline': 'Ölkə paketləri oflayn işləyir',
  'admin.trekApi.factPrivacy': 'Axtarışlar heç vaxt qeydə alınmır',
  'admin.trekApi.more': 'Nələr daxildir',
  'admin.trekApi.fieldPhone': 'Telefon',
  'admin.trekApi.fieldStableId': 'Sabit ID',
  'admin.trekApi.includedNote':
    'Təsvirlər məkanın öz veb-saytından, iş saatları isə işarələndiyi hallarda OpenStreetMap-dən əldə edilir.',
  'admin.trekApi.notRatings': 'Reytinqlər',
  'admin.trekApi.notPhotos': 'Adi müəssisələrin fotoları',
  'admin.trekApi.notIncludedNote':
    'Heç bir açıq məlumat dəstində bunların heç biri heç bir qiymətə mövcud deyil. Bu ikisini əldə etməyin yeganə yolu Google açarı olaraq qalır.',
  'admin.trekApi.sourcesLabel': 'Mənbələr',
  'admin.trekApi.sourcesNote':
    'Cavabdakı hər sahə məlumatın bu mənbələrdən hansından əldə edildiyini göstərir.',
  'admin.trekApi.included': 'Daxildir',
  'admin.trekApi.notIncluded': 'Daxil deyil',
  'admin.mapsKey': 'Google Maps API açarı',
  'admin.mapsKeyHint': 'Məkan axtarışı üçün tələb olunur. console.cloud.google.com saytından əldə edin',
  'admin.mapsKeyHintLong':
    'Google API açarı olmadan tövsiyə edilən TREK API istifadə olunur. Açar olduqda fotolar, reytinqlər və iş saatları əlavə olaraq yüklənə bilər. Açarı console.cloud.google.com saytında yaradın.',
  'admin.recommended': 'Tövsiyə edilir',
  'admin.weatherKey': 'OpenWeatherMap API açarı',
  'admin.weatherKeyHint': 'Hava məlumatları üçün. openweathermap.org saytında pulsuzdur',
  'admin.unsplashKey': 'Unsplash API açarı',
  'admin.unsplashKeyHint': 'Şəkil axtarışı üçün. unsplash.com/developers saytında pulsuzdur',
  'admin.amapKey': 'Amap (高德地图) API açarı',
  'admin.amapKeyHint':
    'Google-un əlçatmaz, OpenStreetMap əhatəsinin isə zəif olduğu materik Çinində məkan axtarışı üçün. JS API açarı deyil, "Web 服务" (veb xidməti) açarı tələb olunur. Onu console.amap.com saytından əldə edin.',
  'admin.keyFromEnv': '{name} ilə təyin edilib',
  'admin.placesProvider.title': 'Məkan axtarışı provayderi',
  'admin.placesProvider.subtitle':
    'TREK-in öz indeksi və OpenStreetMap hər axtarışa cavab verir. Onlar heç nə tapmadıqda başqa kimə sorğu göndəriləcəyini bu seçim müəyyən edir: Avtomatik rejim açar mövcud olduqda əvvəlcə Google-a, sonra Amap-a üstünlük verir.',
  'admin.placesProvider.auto': 'Avtomatik',
  'admin.placesProvider.google': 'Google Places',
  'admin.placesProvider.amap': 'Amap (高德地图)',
  'admin.placesProvider.openstreetmap': 'OpenStreetMap',
  'admin.placesProvider.missingKey':
    'Seçilmiş provayder üçün API açarı konfiqurasiya edilməyib, buna görə məkan axtarışına yalnız TREK indeksi və OpenStreetMap cavab verir.',
  'admin.placesProvider.saved': 'Məkan axtarışı provayderi yadda saxlanıldı',
  'admin.validateKey': 'Sına',
  'admin.keyValid': 'Qoşulub',
  'admin.keyInvalid': 'Etibarsızdır',
  'admin.keySaved': 'API açarları yadda saxlanıldı',
  'admin.oidcTitle': 'Tək giriş (OIDC)',
  'admin.oidcSubtitle':
    'Google, Apple, Authentik və ya Keycloak kimi xarici provayderlər vasitəsilə girişə icazə verin.',
  'admin.oidcDisplayName': 'Göstərilən ad',
  'admin.oidcIssuer': 'Təminatçı URL-si',
  'admin.oidcIssuerHint':
    'Provayderin OpenID Connect təminatçı URL-si. Məsələn, https://accounts.google.com',
  'admin.oidcSaved': 'OIDC konfiqurasiyası yadda saxlanıldı',
  'admin.oidcOnlyMode': 'Parolla doğrulamanı deaktiv et',
  'admin.oidcOnlyModeHint':
    'Aktiv edildikdə yalnız SSO ilə girişə icazə verilir. Parol əsaslı giriş və qeydiyyat bloklanır.',
  'admin.fileTypes': 'İcazə verilən fayl növləri',
  'admin.fileTypesHint': 'İstifadəçilərin hansı fayl növlərini yükləyə biləcəyini konfiqurasiya edin.',
  'admin.fileTypesFormat':
    'Vergüllə ayrılmış uzantılar (məsələn, jpg,png,pdf,doc). Bütün növlərə icazə vermək üçün * istifadə edin.',
  'admin.fileTypesSaved': 'Fayl növü tənzimləmələri yadda saxlanıldı',
  'admin.googleOptions': 'Açarın hansı məqsədlərlə istifadə edilə biləcəyi',
  'admin.googleOptionsSummary': '{total} seçimdən {on} aktivdir',
  'admin.placesPhotos.title': 'Məkan fotoları',
  'admin.placesPhotos.subtitle':
    'Google Places API-dən fotoları əldə edin. API kvotasına qənaət etmək üçün deaktiv edin. Wikimedia fotolarına təsir göstərmir.',
  'admin.placesAutocomplete.title': 'Məkanın avtomatik tamamlanması',
  'admin.placesAutocomplete.subtitle':
    'Axtarış təklifləri üçün Google Places API-dən istifadə edin. API kvotasına qənaət etmək üçün deaktiv edin.',
  'admin.placesDetails.title': 'Məkan məlumatları',
  'admin.placesDetails.subtitle':
    'Google Places API-dən məkan haqqında ətraflı məlumatları (iş saatları, reytinq və veb-sayt) əldə edin. API kvotasına qənaət etmək üçün deaktiv edin.',
  'admin.placesEnrich.title': 'Məkan məlumatlarının zənginləşdirilməsi',
  'admin.placesEnrich.subtitle':
    'Məkan əlavə edərkən şəkillər və təsvir göstərin. Wikipedia və OpenStreetMap həmişə istifadə olunur; Məkan fotoları və ya Məkan məlumatları aktiv olduqda Google da əlavə edilir.',
  'admin.placesGoogleOnly.title': 'Yalnız Google ilə axtar',
  'admin.placesGoogleOnly.subtitle':
    'Hər axtarış və hər təklif Google Places-a göndərilir. Deaktiv olduqda əvvəlcə TREK-in öz indeksi və OpenStreetMap cavab verir, Google-a isə yalnız onlar heç nə tapmadıqda sorğu göndərilir.',
  'admin.placesGoogleOnly.missingKey':
    'Google Maps API açarı tələb olunur. Açar olmadıqda bu keçidin vəziyyətindən asılı olmayaraq axtarış TREK-in öz indeksi və OpenStreetMap ilə aparılır.',
  'admin.placesGoogleOnly.otherProvider':
    'Məkan provayderi kimi Google tələb olunur. Amap və ya OpenStreetMap seçildikdə bu keçidin vəziyyətindən asılı olmayaraq axtarış heç vaxt Google-a göndərilmir.',
  'admin.transitProvider.title': 'İctimai nəqliyyat provayderi',
  'admin.transitProvider.subtitle': 'İctimai nəqliyyat axtarışına hansı xidmətin cavab verəcəyi.',
  'admin.transitProvider.transitous': 'Transitous (pulsuz)',
  'admin.transitProvider.google': 'Google',
  'admin.transitProvider.transitousHint':
    'İcma GTFS lentləri. Pulsuz və açarsızdır, ən yaxşı əhatə dairəsi Avropadadır.',
  'admin.transitProvider.googleHint':
    'Transitous-un məlumatı olmayan regionlar üçün yuxarıdakı Google API açarından istifadə edir. Hər axtarış üçün ödəniş tutulur — açar təyin edilmədikdə Transitous istifadə olunur.',
  'admin.transitProvider.noKeyWarning':
    'Google seçilib, lakin Google API açarı konfiqurasiya edilməyib — ictimai nəqliyyat axtarışı hələ də Transitous istifadə edir. Yuxarıdakı API açarları bölməsində açar əlavə edin.',
  'admin.transitProvider.personalKeyWarning':
    'Yalnız şəxsi Google açarınız təyin edilib, buna görə digər üzvlərin ictimai nəqliyyat axtarışları yenə Transitous-a yönləndirilir. Açarı bütün sistemə tətbiq etmək üçün yuxarıda administrator kimi yadda saxlayın.',
  'admin.placeShadow.title': 'Məkan axtarışı jurnalı',
  'admin.placeShadow.subtitle':
    'Hansı axtarış nəticəsinin seçildiyini qeydə alın ki, başqa məkan indeksini sonradan real axtarışlarla müqayisə etmək mümkün olsun. Heç bir məlumat bu sistemdən kənara çıxmır və administrator istənilən vaxt jurnalı ixrac edə və ya silə bilər.',
  'admin.bagTracking.title': 'Çantaların izlənməsi',
  'admin.bagTracking.subtitle':
    'Baqaj elementləri üçün çəki və çanta təyin edilməsini aktivləşdirin',
  'admin.collab.chat.title': 'Çat',
  'admin.collab.chat.subtitle': 'Səyahətin birgə planlaşdırılması üçün real vaxt mesajlaşması',
  'admin.collab.notes.title': 'Qeydlər',
  'admin.collab.notes.subtitle': 'Paylaşılan qeydlər və sənədlər',
  'admin.collab.polls.title': 'Sorğular',
  'admin.collab.polls.subtitle': 'Qrup sorğuları və səsvermə',
  'admin.collab.whatsnext.title': 'Növbədə nə var',
  'admin.collab.whatsnext.subtitle': 'Fəaliyyət təklifləri və növbəti addımlar',
  'admin.tabs.config': 'Fərdiləşdirmə',
  'admin.tabs.defaults': 'İstifadəçi standartları',
  'admin.defaultSettings.title': 'Standart istifadəçi tənzimləmələri',
  'admin.defaultSettings.description':
    'Bütün sistem üçün standart dəyərləri təyin edin. Tənzimləməni dəyişməmiş istifadəçilər bu dəyərləri görəcəklər. Onların öz dəyişiklikləri həmişə üstün tutulur.',
  'admin.defaultSettings.saved': 'Standart dəyər yadda saxlanıldı',
  'admin.defaultSettings.reset': 'Daxili standart dəyərə sıfırla',
  'admin.defaultSettings.resetToBuiltIn': 'sıfırla',
  'admin.defaultSettings.mapProvider': 'Xəritə mühərriki',
  'admin.defaultSettings.mapProviderHint':
    'Bu sistemdəki hər kəs üçün standart xəritə. Hər istifadəçi bunu öz tənzimləmələrində dəyişə bilər.',
  'admin.defaultSettings.providerLeaflet': 'Standart (pulsuz)',
  'admin.defaultSettings.providerMapbox': 'Mapbox (3D)',
  'admin.defaultSettings.providerMapLibre': 'MapLibre (OpenFreeMap)',
  'admin.defaultSettings.mapboxToken': 'Paylaşılan Mapbox tokeni',
  'admin.defaultSettings.mapboxTokenHint':
    'Öz tokenini daxil etməmiş hər istifadəçi üçün istifadə edilir — beləliklə açarı ayrı-ayrılıqda paylaşmadan bütün sistem Mapbox əldə edir. Şifrələnmiş şəkildə saxlanılır.',
  'admin.defaultSettings.mapboxStyle': 'Xəritə üslubu',
  'admin.defaultSettings.mapboxStylePlaceholder': 'Üslub seçin…',
  'admin.defaultSettings.mapbox3d': '3D binalar və relyef',
  'admin.defaultSettings.mapboxQuality': 'Yüksək keyfiyyət rejimi',
  'admin.defaultSettings.cartoKey': 'Paylaşılan CARTO açarı',
  'admin.defaultSettings.cartoKeyHint':
    'Öz açarını daxil etməmiş hər istifadəçi üçün istifadə edilir, beləliklə bütün sistem su nişanı olmadan CARTO xəritə parçalarını əldə edir. Şifrələnmiş şəkildə saxlanılır.',
  'admin.tabs.templates': 'Baqaj şablonları',
  'admin.packingTemplates.title': 'Baqaj şablonları',
  'admin.packingTemplates.subtitle': 'Səyahətləriniz üçün təkrar istifadə edilə bilən baqaj siyahıları yaradın',
  'admin.packingTemplates.create': 'Yeni şablon',
  'admin.packingTemplates.namePlaceholder': 'Şablonun adı (məsələn, Çimərlik tətili)',
  'admin.packingTemplates.empty': 'Hələ heç bir şablon yaradılmayıb',
  'admin.packingTemplates.items': 'element',
  'admin.packingTemplates.categories': 'kateqoriya',
  'admin.packingTemplates.itemName': 'Elementin adı',
  'admin.packingTemplates.itemCategory': 'Kateqoriya',
  'admin.packingTemplates.categoryName': 'Kateqoriyanın adı (məsələn, Geyim)',
  'admin.packingTemplates.addCategory': 'Kateqoriya əlavə et',
  'admin.packingTemplates.created': 'Şablon yaradıldı',
  'admin.packingTemplates.deleted': 'Şablon silindi',
  'admin.packingTemplates.loadError': 'Şablonları yükləmək mümkün olmadı',
  'admin.packingTemplates.createError': 'Şablon yaratmaq mümkün olmadı',
  'admin.packingTemplates.deleteError': 'Şablonu silmək mümkün olmadı',
  'admin.packingTemplates.deleteCategoryError': 'Kateqoriyanı silmək mümkün olmadı',
  'admin.packingTemplates.deleteItemError': 'Elementi silmək mümkün olmadı',
  'admin.packingTemplates.saveError': 'Yadda saxlamaq mümkün olmadı',
  'admin.tabs.addons': 'Əlavələr',
  'admin.tabs.plugins': 'Plaginlər',
  'admin.tabs.storage': 'Saxlama',
  'admin.plugins.rescan': 'Yenidən skan et',
  'admin.plugins.rescanned': 'Plaginlər qovluğu yenidən skan edildi',
  'admin.plugins.upload': 'Plagin yüklə',
  'admin.plugins.dropToUpload': 'Quraşdırmaq üçün plagin .zip faylını buraya atın',
  'admin.plugins.uploaded': '“{name}” plagini yükləndi — işlətmək üçün aktivləşdirin',
  'admin.plugins.sideloaded': 'Əl ilə yüklənib',
  'admin.plugins.devLinkBadge': 'Tərtibatçı keçidi',
  'admin.plugins.devLinkHint':
    'Yerli yığma qovluğundan yüklənib və real məlumatlarla işləyərkən avtomatik yenilənir — yalnız tərtibat üçün',
  'admin.plugins.devLinkTitle': 'Yerli plagini əlaqələndir',
  'admin.plugins.devLinkPathPlaceholder': '/plagininize/mutleq/yol',
  'admin.plugins.devLinkButton': 'Əlaqələndir',
  'admin.plugins.devLinkLinked': '{id} əlaqələndirildi — işlətmək üçün aktivləşdirin',
  'admin.plugins.sideloadedHint':
    'Əl ilə yüklənib — reyestrdən deyil, imzalanmayıb və yoxlanılmayıb',
  'admin.plugins.browse': 'Plaginlərə bax',
  'admin.plugins.installed': 'Quraşdırılıb',
  'admin.plugins.install': 'Quraşdır',
  'admin.plugins.registryEmpty': 'Reyestrdə hələ heç bir plagin yoxdur.',
  'admin.plugins.actionError': 'Əməliyyat uğursuz oldu',
  'admin.plugins.activate': 'Aktivləşdir',
  'admin.plugins.activated': 'Plagin aktivləşdirildi',
  'admin.plugins.deactivate': 'Deaktiv et',
  'admin.plugins.deactivated': 'Plagin deaktiv edildi',
  'admin.plugins.viewErrors': 'Xəta jurnalına bax',
  'admin.plugins.errorLog': 'Xəta jurnalı',
  'admin.plugins.allowedHosts': 'İcazə verilən hostlar',
  'admin.plugins.allowedHosts.hint':
    'Bu plagin yalnız sizin adını göstərə biləcəyiniz xidmətlə əlaqə saxlayır. Əlaqə yarada biləcəyi hostları əlavə edin — başqa heç bir hosta qoşula bilməz.',
  'admin.plugins.allowedHosts.none': 'Hələ heç bir host əlavə edilməyib.',
  'admin.plugins.allowedHosts.unsupported':
    'Bu plagin operator tərəfindən təqdim edilən hostlardan istifadə etmir. İcazə verilən hostlar onun manifestində sabit şəkildə müəyyən edilib.',
  'admin.plugins.allowedHosts.restartNote':
    'Yadda saxlamaq plagini yenidən başladır ki, yeni siyahını tətbiq etsin.',
  'admin.plugins.allowedHosts.add': 'İcazə verilən host əlavə et',
  'admin.plugins.allowedHosts.count': '{n} icazə verilən host',
  'admin.plugins.operatorEgressPill': '+ əlavə etdiyiniz hostlar',
  'admin.plugins.operatorEgressHint':
    'Bu plagin yalnız sizin adını göstərə biləcəyiniz xidmətlə əlaqə saxlayır. Quraşdırdıqdan sonra ⋯ → İcazə verilən hostlar bölməsindən qoşula biləcəyi hostları əlavə edin. Başqa heç bir hosta qoşula bilməz.',
  'admin.plugins.noErrors': 'Heç bir xəta qeydə alınmayıb.',
  'admin.plugins.uninstalled': 'Plagin sistemdən silindi',
  'admin.plugins.uninstallTitle': 'Plagin sistemdən silinsin?',
  'admin.plugins.uninstallBody':
    'Bu əməliyyat plagini dayandırır, kodunu silir və bütün məlumatlarını təmizləyir. Bu əməliyyatı geri qaytarmaq mümkün deyil.',
  'admin.plugins.status.starting': 'Başladılır…',
  'admin.plugins.type.widget': 'Vidcet',
  'admin.plugins.type.page': 'Səhifə',
  'admin.plugins.type.integration': 'İnteqrasiya',
  'admin.plugins.type.trip-page': 'Səyahət səhifəsi',
  'admin.plugins.reviewed': 'Yoxlanılıb',
  'admin.plugins.unreviewed': 'Yoxlanılmayıb',
  'admin.plugins.updated': 'Plagin yeniləndi',
  'admin.plugins.updateTo': 'Yenilə → v{version}',
  'admin.plugins.enabledToggle': 'Plagini aktivləşdir',
  'plugins.notFound': 'Plagin tapılmadı',
  'plugins.frameLoadFailed': 'Bu plagini yükləmək mümkün olmadı.',
  'admin.plugins.title': 'Plaginlər',
  'admin.plugins.subtitle': 'Sisteminizdə üçüncü tərəf plaginlərini quraşdırın və idarə edin.',
  'admin.plugins.disabledTitle': 'Plaginlər deaktivdir',
  'admin.plugins.disabledBody':
    'Plaginlərin icra mühiti deaktiv edilib (TREK_PLUGINS_ENABLED). Administrator onu server konfiqurasiyasında aktivləşdirməyənə qədər heç bir plagin işləyə bilməz.',
  'admin.plugins.empty': 'Hələ heç bir plagin quraşdırılmayıb.',
  'admin.plugins.loadError': 'Plaginləri yükləmək mümkün olmadı.',
  'admin.plugins.scaffoldNote':
    'Plaginlərin quraşdırılması və aktivləşdirilməsi sonrakı yeniləmədə əlavə ediləcək. Bu panel hazırda yalnız quraşdırılmış plaginləri göstərir.',
  'admin.plugins.status.active': 'Aktiv',
  'admin.plugins.status.inactive': 'Qeyri-aktiv',
  'admin.plugins.status.disabled': 'Deaktivdir',
  'admin.plugins.status.error': 'Xəta',
  'admin.plugins.status.incompatible': 'Uyğun deyil',
  'admin.plugins.details': 'Ətraflı məlumat',
  'admin.plugins.detailError': 'Plagin məlumatlarını yükləmək mümkün olmadı.',
  'admin.plugins.permissionsTitle': 'İcazələr',
  'admin.plugins.noPermissions': 'Bu plagin heç bir xüsusi icazə tələb etmir.',
  'admin.plugins.egressNote': 'Bunlara qoşula bilər: {hosts}',
  'admin.plugins.setupTitle': 'Quraşdırma',
  'admin.plugins.noSetup': 'Dərhal işləyir — konfiqurasiya ediləcək heç nə yoxdur.',
  'admin.plugins.scope.instance': 'Bütün sistem üzrə',
  'admin.plugins.scope.user': 'Hər istifadəçi üçün',
  'admin.plugins.fieldRequired': 'Tələb olunur',
  'admin.plugins.sourceRepo': 'Mənbə kodu reyestri',
  'admin.plugins.reportIssue': 'Problem bildir',
  'admin.plugins.homepage': 'Ana səhifə',
  'admin.plugins.requiresTrek': 'TREK {version}+ tələb edir',
  'admin.plugins.reviewedOn': '{date} tarixində yoxlanılıb',
  'admin.plugins.perm.db:own': 'Öz məlumatlarını təcrid edilmiş verilənlər bazasında saxlamaq',
  'admin.plugins.perm.db:read:trips':
    'Əməliyyatı həyata keçirən istifadəçinin giriş icazəsi olan səyahətləri oxumaq',
  'admin.plugins.perm.db:read:users':
    'Əsas profil məlumatlarını oxumaq (ad və avatar — giriş məlumatları heç vaxt daxil deyil)',
  'admin.plugins.perm.db:read:costs':
    'Əməliyyatı həyata keçirən istifadəçinin giriş icazəsi olan xərcləri (büdcə elementlərini) oxumaq',
  'admin.plugins.perm.db:read:packing':
    'Əməliyyatı həyata keçirən istifadəçinin giriş icazəsi olan səyahətlərin baqaj siyahılarını oxumaq',
  'admin.plugins.perm.db:write:packing':
    'Əməliyyatı həyata keçirən istifadəçinin redaktə edə bildiyi səyahətlərdə baqaj elementləri yaratmaq, redaktə etmək və silmək',
  'admin.plugins.perm.weather:read':
    'Hostun keşlənmiş hava proqnozunu oxumaq (koordinatlar üzrə)',
  'admin.plugins.perm.db:read:categories': 'Ümumi məkan kateqoriyaları siyahısını oxumaq',
  'admin.plugins.perm.db:read:tags':
    'Əməliyyatı həyata keçirən istifadəçinin öz etiketlərini oxumaq',
  'admin.plugins.perm.db:write:tags':
    'Əməliyyatı həyata keçirən istifadəçinin öz etiketlərini yaratmaq, redaktə etmək və silmək',
  'admin.plugins.perm.db:read:todos':
    'Əməliyyatı həyata keçirən istifadəçinin giriş icazəsi olan səyahətlərin tapşırıqlarını oxumaq',
  'admin.plugins.perm.db:write:todos':
    'Əməliyyatı həyata keçirən istifadəçinin redaktə edə bildiyi səyahətlərdə tapşırıqlar yaratmaq, redaktə etmək və silmək',
  'admin.plugins.perm.db:write:atlas':
    'Ölkələri və regionları ziyarət edilmiş kimi işarələmək və əməliyyatı həyata keçirən istifadəçinin arzular siyahısını idarə etmək (Atlas əlavəsi tələb olunur)',
  'admin.plugins.perm.db:write:vacay':
    'Əməliyyatı həyata keçirən istifadəçinin aktiv planında məzuniyyət günlərini və şirkət tətillərini dəyişmək (Vacay əlavəsi tələb olunur)',
  'admin.plugins.perm.db:write:journal':
    'Əməliyyatı həyata keçirən istifadəçinin redaktə edə bildiyi səyahət gündəliklərində qeydlər yaratmaq, redaktə etmək və silmək, həmçinin onlara fotolar əlavə etmək (Journey əlavəsi tələb olunur)',
  'admin.plugins.perm.db:write:collections':
    'Əməliyyatı həyata keçirən istifadəçinin kolleksiya roluna uyğun olaraq kolleksiyalar yaratmaq və redaktə etmək, həmçinin onlara məkanlar əlavə etmək (Collections əlavəsi tələb olunur)',
  'admin.plugins.perm.db:write:files':
    'Əməliyyatı həyata keçirən istifadəçinin redaktə edə bildiyi səyahətlərə fayllar əlavə etmək (10 MB limit, bloklanmış uzantılar qəbul edilmir) və onların keçidlərini idarə etmək',
  'admin.plugins.perm.db:write:collab':
    'Əməliyyatı həyata keçirən istifadəçinin redaktə edə bildiyi səyahətlərdə qeydlər, sorğular və çat mesajları paylaşmaq (Collab əlavəsi tələb olunur)',
  'admin.plugins.perm.db:write:members':
    'Səyahətlərə istifadəçilər əlavə etmək — səyahətə giriş icazəsi verir; əməliyyatı həyata keçirən istifadəçinin üzvləri idarəetmə hüququ ilə məhdudlaşdırılır',
  'admin.plugins.perm.notify:send':
    'Əməliyyatı həyata keçirən istifadəçiyə və ya üzvü olduğu səyahətə bildiriş (zəng gələnlər qutusu + e-poçt/ntfy) göndərmək — ixtiyari alıcıya heç vaxt göndərilmir',
  'admin.plugins.perm.ai:invoke':
    'Administrator tərəfindən konfiqurasiya edilmiş süni intellekt provayderini əməliyyatı həyata keçirən istifadəçinin adından işə salmaq (mətn tamamlama + sənəd məlumatlarının çıxarılması) — plagin açarı heç vaxt saxlamır',
  'admin.plugins.perm.oauth:client':
    'Host vasitəsilə idarə edilən OAuth ilə sizin adınızdan üçüncü tərəf xidmətinə qoşulmaq (tokenləri host saxlayır, plagin onları heç vaxt görmür)',
  'admin.plugins.perm.db:read:files':
    'Əməliyyatı həyata keçirən istifadəçinin giriş icazəsi olan səyahətlərin fayllarını oxumaq',
  'admin.plugins.perm.db:read:journal':
    'Əməliyyatı həyata keçirən istifadəçinin səyahət gündəliklərini oxumaq (Journey əlavəsi tələb olunur)',
  'admin.plugins.perm.db:read:atlas':
    'Əməliyyatı həyata keçirən istifadəçinin ziyarət etdiyi ölkələri və regionları oxumaq (Atlas əlavəsi tələb olunur)',
  'admin.plugins.perm.db:read:vacay':
    'Əməliyyatı həyata keçirən istifadəçinin məzuniyyət planını oxumaq (Vacay əlavəsi tələb olunur)',
  'admin.plugins.perm.db:read:daynotes':
    'Əməliyyatı həyata keçirən istifadəçinin giriş icazəsi olan səyahətlərin günlük qeydlərini oxumaq',
  'admin.plugins.perm.db:read:collections':
    'Əməliyyatı həyata keçirən istifadəçinin yadda saxlanılmış məkan kolleksiyalarını oxumaq (Collections əlavəsi tələb olunur)',
  'admin.plugins.perm.db:write:costs':
    'Əməliyyatı həyata keçirən istifadəçinin redaktə edə bildiyi səyahətlərdə xərclər (büdcə elementləri) yaratmaq',
  'admin.plugins.perm.db:write:places':
    'Əməliyyatı həyata keçirən istifadəçinin redaktə edə bildiyi səyahətlərə məkan əlavə etmək, onları redaktə etmək və silmək',
  'admin.plugins.perm.db:write:days':
    'Əməliyyatı həyata keçirən istifadəçinin redaktə edə bildiyi səyahətlərə gün əlavə etmək, onları redaktə etmək və silmək',
  'admin.plugins.perm.db:write:itinerary':
    'Əməliyyatı həyata keçirən istifadəçinin redaktə edə bildiyi səyahət günlərinə məkan təyin etmək və onları günlərdən çıxarmaq',
  'admin.plugins.perm.db:write:trips':
    'Əməliyyatı həyata keçirən istifadəçinin redaktə edə bildiyi səyahətlərin məlumatlarını (başlıq, tarixlər, valyuta…) redaktə etmək',
  'admin.plugins.perm.db:write:reservations':
    'Əməliyyatı həyata keçirən istifadəçinin redaktə edə bildiyi səyahətlərdə rezervasiyalar yaratmaq, redaktə etmək və silmək',
  'admin.plugins.perm.db:write:accommodations':
    'Əməliyyatı həyata keçirən istifadəçinin redaktə edə bildiyi səyahətlərdə qalma yerləri yaratmaq, redaktə etmək və silmək',
  'admin.plugins.perm.db:write:daynotes':
    'Əməliyyatı həyata keçirən istifadəçinin redaktə edə bildiyi səyahətlərdə günlük qeydlər yaratmaq, redaktə etmək və silmək',
  'admin.plugins.perm.db:meta':
    'Əməliyyatı həyata keçirən istifadəçinin giriş icazəsi olan səyahətlərə, məkanlara və günlərə öz məxfi məlumatlarını əlavə etmək',
  'admin.plugins.perm.ws:broadcast:trip': 'Səyahət üzvlərinə real vaxt yeniləmələri göndərmək',
  'admin.plugins.perm.ws:broadcast:user':
    'Ayrı-ayrı istifadəçilərə real vaxt yeniləmələri göndərmək',
  'admin.plugins.perm.hook:photo-provider': 'Xatirələr bölməsinə fotolar təqdim etmək',
  'admin.plugins.perm.hook:calendar-source': 'Təqvimə tədbirlər təqdim etmək',
  'admin.plugins.perm.hook:place-detail-provider':
    'Məkana əlavə məlumatlar (rəylər, reytinqlər və keçidlər) təqdim etmək',
  'admin.plugins.perm.hook:search-provider':
    'TREK-in öz nəticələri ilə yanaşı, öz indeksindən məkan axtarışlarına cavab vermək',
  'admin.plugins.perm.hook:poi-category-provider':
    'Öz məkan kateqoriyalarını “Xəritədə məkanları kəşf et” bölməsinə əlavə etmək; birini seçdikdə plaginə baxdığınız xəritə sahəsi göndərilir',
  'admin.plugins.perm.hook:trip-warning-provider':
    'Səyahətlə bağlı doğrulama xəbərdarlıqları yaratmaq (planlayıcıda göstərilir)',
  'admin.plugins.perm.hook:table-contributor':
    'Səyahət görünüşlərinə (rezervasiyalar, məkanlar və günlər) sütunlar və əməliyyatlar əlavə etmək',
  'admin.plugins.perm.hook:map-marker-provider':
    'Səyahət xəritəsinə markerlər əlavə etmək (məsələn, rezervasiyaları və ya maraqlı nöqtələri göstərmək)',
  'admin.plugins.perm.hook:map-layer-provider':
    'Səyahət xəritəsində marşrutlar, dəhlizlər və zonalar çəkmək',
  'admin.plugins.perm.hook:route-provider':
    'Planlayıcının günlər üçün istifadə edə biləcəyi marşrut profilləri təqdim etmək (məsələn, şarj dayanacaqları ilə elektrik avtomobili marşrutu)',
  'admin.plugins.perm.hook:day-schedule-provider':
    'Gün planına vaxt qeydləri əlavə etmək (şarj dayanacaqları və təhlükəsizlik vaxt ehtiyatları)',
  'admin.plugins.perm.hook:day-tint-provider':
    'Gün planındakı günləri rənglə kodlaşdırmaq (məsələn, günün səyahətin hansı mərhələsinə aid olduğunu göstərmək)',
  'admin.plugins.cap.mcpTools': 'Süni intellekt alətləri yayımlayır',
  'admin.plugins.mcpToolsTitle': 'Yayımladığı süni intellekt alətləri',
  'admin.plugins.mcpToolsHint':
    'Köməkçi bunları istifadəçinin adından işə sala bilər. Hər biri yuxarıda verilmiş giriş icazələri ilə işləyir.',
  'admin.plugins.poiCategoriesTitle': 'Əlavə etdiyi xəritə kateqoriyaları',
  'admin.plugins.perm.mcp:tools':
    'Süni intellekt köməkçisinin sizin adınızdan işə sala biləcəyi alətlər yayımlamaq (köməkçinin öz icazələri ilə deyil, burada plaginə verdiyiniz giriş icazələri ilə işləyir)',
  'admin.plugins.perm.geolocation:read':
    'Plaginin görünüşlərindən biri açıq olduqda canlı mövqeyinizi istəmək (TREK onu plaginin öz icazəsi ilə deyil, bu saytın məkan icazəsi ilə oxuyur)',
  'admin.plugins.perm.hook:pdf-section-provider':
    'Səyahətin PDF ixracına mətn bölmələri əlavə etmək',
  'admin.plugins.perm.hook:atlas-layer-provider':
    'Atlas dünya xəritəsində ölkələri vurğulamaq (məsələn, arzular siyahıları və ya səyahət xəbərdarlıqları)',
  'admin.plugins.perm.hook:journal-entry-provider':
    'Səyahət gündəliyi qeydlərinə əlavə sətirlər (keçidlər və statistika) təqdim etmək',
  'admin.plugins.perm.hook:trip-card-provider':
    'İdarə panelindəki səyahət kartlarına kiçik nişanlar (vəziyyət və saylar) əlavə etmək',
  'admin.plugins.perm.hook:notification-channel':
    'Bildirişlərinizi əlavə kanal vasitəsilə çatdırmaq',
  'admin.plugins.perm.hook:user-data':
    'İstifadəçi haqqında saxladığı məlumatları silmək və ya ixrac etmək (GDPR hesab silmə və məlumat sorğuları)',
  'admin.plugins.perm.events:subscribe':
    'Əsas fəaliyyət hadisələrinə reaksiya vermək (yalnız hadisənin adı və səyahət, məzmun heç vaxt daxil deyil)',
  'admin.plugins.perm.jobs:run':
    'Elan etdiyi fon tapşırıqlarını cədvəl üzrə işə salmaq (istifadəçi konteksti yoxdur — istifadəçi məlumatlarını oxuya bilməz)',
  'admin.plugins.perm.http:outbound': 'Elan etdiyi hostlara xarici sorğular göndərmək',
  'admin.plugins.perm.db:read:collab':
    'Əməliyyatı həyata keçirən istifadəçinin giriş icazəsi olan səyahətlərin qeydlərini, sorğularını və çat mesajlarını oxumaq (Collab əlavəsi tələb olunur)',
  'admin.plugins.perm.db:read:files:content':
    'Əməliyyatı həyata keçirən istifadəçinin giriş icazəsi olan səyahətlərdəki faylların bayt məzmununu oxumaq',
  'admin.plugins.perm.db:create:trips':
    'Əməliyyatı həyata keçirən istifadəçiyə məxsus yeni səyahətlər yaratmaq',
  'admin.plugins.perm.rates:read': 'Hostun keşlənmiş valyuta məzənnələrini oxumaq',
  'admin.plugins.updateConsentTitle': 'Bu yeniləmə yeni icazələr tələb edir',
  'admin.plugins.updateConsentBody':
    '{name} v{version} hələ vermədiyiniz hüquqları tələb edir. Yeni versiya quraşdırılıb, lakin siz təsdiqləyənə qədər deaktiv qalacaq.',
  'admin.plugins.updateNewPermissions': 'Yeni tələb edilən icazələr',
  'admin.plugins.updateNewEgress': 'Yeni xarici bağlantılar',
  'admin.plugins.updateApprove': 'Təsdiqlə və aktivləşdir',
  'admin.plugins.updateLater': 'Hələlik deaktiv saxla',
  'admin.plugins.updateKeptOff':
    'Yeniləmə quraşdırıldı — yeni icazələri təsdiqləyənə qədər deaktiv saxlanıldı',
  'admin.plugins.reviewedMeaning':
    '“Yoxlanılıb” o deməkdir ki, TREK tərtibatçısı plaginin hər versiyasını zərərli proqramlara qarşı nəzərdən keçirib — keyfiyyətinə və ya işləyib-işləmədiyinə görə yox. Bu, plaginin zərərsiz olduğuna zəmanət vermir.',
  'admin.plugins.security.title': 'Plaginlərin necə təcrid edildiyi və məhdudiyyətlər',
  'admin.plugins.security.isolationTitle': 'Hər plagin təcrid edilmiş mühitdə işləyir',
  'admin.plugins.security.isolationBody':
    'Plagin yalnız öz fayllarını oxuya bilən ayrıca, ciddi məhdudlaşdırılmış proses kimi işləyir. O, verilənlər bazanızı, giriş sirrinizi və ya şifrələmə açarınızı oxuya, başqa proqramları işə sala və heç bir yerə fayl yaza bilməz. Onun interfeysi sessiya kukinizi oxuya və ətrafındakı TREK səhifəsinə müdaxilə edə bilməyən qapalı brauzer çərçivəsində işləyir.',
  'admin.plugins.security.permsTitle': 'İcazələr nə deməkdir',
  'admin.plugins.security.permsBody':
    'Quraşdırmadan əvvəl göstərilən icazələr plagin işləyərkən TREK-in tətbiq etdiyi sərt məhdudiyyətdir — plagin siyahıda olmayan heç bir əməliyyatı yerinə yetirə bilməz. Lakin onlar plaginin əslində nə etdiyini deyil, nə edə biləcəyini göstərir. Səyahətlərinizi oxumaq və serverə qoşulmaq icazəsi verilmiş plagin səyahətlərinizi həmin serverə göndərə bilər. Buna görə yalnız təsviri deyil, icazələri və xarici hostları da oxuyun.',
  'admin.plugins.security.limitsTitle': 'Nəyə zəmanət verə bilmərik',
  'admin.plugins.security.limitsBody':
    'Təcridetmə güclü proqram sərhədidir, lakin mütləq deyil. Plagin tam olaraq təsdiqlədiyiniz hüquqlarla işləyir. Buna görə həmin hüquqlar daxilində təsvirində göstəriləndən fərqli davrana və qanuni şəkildə əldə etdiyi məlumatları elan etdiyi hostlara göndərə bilər. TREK plaginin kodunun əslində nə etdiyini oxumur və qiymətləndirmir.',
  'admin.plugins.security.worstTitle': 'Ən pis ehtimal',
  'admin.plugins.security.worstBody':
    'Aktivləşdirdiyiniz zərərli plagin ona verdiyiniz məlumatlardan və bağlantılardan sui-istifadə edə bilər — məsələn, oxumağa icazəsi olan səyahətləri sızdıra bilər. O, parolları oğurlaya, saxta administrator girişi yarada, serverinizdə əmrlər işlədə və ya icazə vermədiyiniz məlumatlara çata bilməz. Zərər təsdiqlədiyiniz icazələrlə məhdudlaşır və plagini deaktiv etmək onu dayandırır.',
  'admin.plugins.security.reviewedTitle': '“Yoxlanılıb” nə deməkdir',
  'admin.plugins.security.reviewedBody':
    'Yoxlanılmış plagin hər versiyada TREK tərtibatçısı tərəfindən zərərli proqramlara qarşı əl ilə nəzərdən keçirilib — yaxşı işləyib-işləmədiyinə görə deyil, zərərli koda görə yoxlanılıb. Bu, plaginin zərərsiz olduğuna zəmanət deyil.',
  'admin.plugins.security.signedTitle': '“İmzalanıb” nə deməkdir',
  'admin.plugins.security.signedBody':
    'TREK-in hər quraşdırmada yoxladığı nəzarət cəmi faylların reyestrin təsdiqlədiyi fayllarla tam eyni olduğunu sübut edir. İmza isə başqa şeyi sübut edir: faylların müəllifdən gəldiyini və yalnız onun sahib olduğu açarla imzalandığını. İmzalanmış plagində hər ikisi mövcuddur. İmzalanmamış plagin təhlükəli demək deyil — sadəcə bir zəmanəti daha azdır və hazırda reyestrdəki plaginlərin əksəriyyəti imzalanmayıb.',
  'admin.plugins.signed': 'İmzalanıb',
  'admin.plugins.signedHint':
    'Quraşdırılarkən müəllifin imzalama açarı ilə doğrulanıb',
  'admin.plugins.unsigned': 'İmzalanmayıb',
  'admin.plugins.unsignedHint':
    'Fayllar reyestrin təsdiqlədiyi fayllarla uyğun gəlir, lakin onları müəlliflə əlaqələndirən heç nə yoxdur. Bir zəmanəti daha azdır — bu, təhlükəli olduğu demək deyil.',
  'admin.plugins.updateBlocked': 'Yeniləmə bloklandı — {reason}',
  'admin.plugins.reviewBlock': 'Yoxla',
  'admin.plugins.retrusted': 'Yeni imzalama açarına etibar edildi — plagin yeniləndi',
  'admin.plugins.sig.title': '{name} plagininin imzasını doğrulamaq mümkün olmadı',
  'admin.plugins.sig.keyChangedBody':
    'Müəllifin imzalama açarı bu plaginin ilkin quraşdırılmasında istifadə edilən açar deyil. Müəlliflər açarları dəyişə bilərlər — lakin plagini ələ keçirmiş hücumçu da tam olaraq belə görünərdi.',
  'admin.plugins.sig.invalidBody':
    'Fayllar müəllifin imzası ilə uyğun gəlmir. Bunlar müəllifin imzaladığı fayllar deyil — ya zədələniblər, ya da dəyişdiriliblər. Bu məhdudiyyəti keçmək mümkün deyil.',
  'admin.plugins.sig.missingBody':
    'Bu plagin quraşdırdığınız zaman imzalanmışdı, lakin yeni versiyada imza yoxdur. TREK bu geriləməni səssizcə qəbul etməyəcək. Bu məhdudiyyəti keçmək mümkün deyil.',
  'admin.plugins.sig.incompleteBody':
    'Reyestr qeydi yarımçıq imzalanıb: müəllif açarı göstərilib, lakin versiyada imza yoxdur və ya əksinə. Bu, plagin tərəfindəki xətadır. Bu məhdudiyyəti keçmək mümkün deyil.',
  'admin.plugins.sig.pinnedKey': 'Quraşdırılarkən istifadə edilən açar',
  'admin.plugins.sig.newKey': 'İndi təqdim etdiyi açar',
  'admin.plugins.sig.confirmOutOfBand':
    'TREK qanuni açar dəyişikliyini plagin ələ keçirilməsindən fərqləndirə bilmir — hər ikisi buradan eyni görünür. Qəbul etməzdən əvvəl yeni açarı artıq etibar etdiyiniz kanal vasitəsilə müəlliflə təsdiqləyin. Təsdiqlədikdən sonra plagin yenilənəcək və yeni açar yadda saxlanılacaq.',
  'admin.plugins.sig.retrustConfirm': 'Yeni açara etibar et və yenilə',
  'admin.plugins.sig.cancel': 'Etibar etmə',
  'admin.plugins.sig.consentUnsigned':
    'Bu versiyanı müəllifi ilə əlaqələndirən heç nə yoxdur — fayllar reyestrdəki fayllarla uyğun gəlir, lakin müəllif imzası daşımır.',
  'admin.plugins.security.trustTitle': 'Əsas nəticə',
  'admin.plugins.security.trustBody':
    'Plagin quraşdırmaq istənilən üçüncü tərəf tətbiqini quraşdırmağa bənzəyir: yalnız etibar etdiyiniz müəlliflərin kodunu əlavə edin və şübhə etdikdə əvvəlcə onu özünüz yoxlayın. TREK üçüncü tərəf plaginlərinə görə məsuliyyət daşımır.',
  'admin.plugins.runtimeOn': 'İcra mühiti aktivdir',
  'admin.plugins.tabDiscover': 'Kəşf et',
  'admin.plugins.searchPlaceholder': 'Plaginləri axtar…',
  'admin.plugins.filterType': 'Növ',
  'admin.plugins.filterStatus': 'Vəziyyət',
  'admin.plugins.sortBy': 'Sırala',
  'admin.plugins.allTypes': 'Bütün növlər',
  'admin.plugins.allStatuses': 'Hamısı',
  'admin.plugins.stateOff': 'Deaktiv',
  'admin.plugins.filterUpdate': 'Yeniləmə mövcuddur',
  'admin.plugins.sortName': 'Ad',
  'admin.plugins.sortRecent': 'Son yenilənənlər',
  'admin.plugins.sortUpdates': 'Əvvəlcə yeniləmələr',
  'admin.plugins.sortDownloads': 'Ən çox endirilənlər',
  'admin.plugins.updatesAvailable': 'Plaginləriniz üçün {count} yeniləmə mövcuddur.',
  'admin.plugins.newerNeedsTrek': 'v{version} mövcuddur — TREK {range} tələb edir',
  'admin.plugins.updateAll': 'Hamısını yenilə',
  'admin.plugins.versionsTitle': 'Versiyalar',
  'admin.plugins.versionPickerTitle': 'Versiyanı dəyiş — {name}',
  'admin.plugins.versionSwitch': '{version} versiyasına keç',
  'admin.plugins.versionNeedsTrek': 'TREK {range} tələb edir',
  'admin.plugins.changeVersion': 'Versiyanı dəyiş…',
  'admin.plugins.noVersions': 'Reyestrdə yayımlanmış versiya tapılmadı.',
  'admin.plugins.downgradeTitle': 'Bu plagin əvvəlki versiyaya qaytarılsın?',
  'admin.plugins.downgradeBody':
    'v{from} versiyasından v{to} versiyasına keçid: yeni versiyanın yazdığı məlumatlar saxlanılacaq və köhnə versiya onları anlamaya bilər.',
  'admin.plugins.downgradeConfirm': 'Əvvəlki versiyaya qaytar',
  'admin.plugins.updatesHeld': 'Yeniləmələr v{version} versiyasında dayandırılıb',
  'admin.plugins.resumeUpdates': 'Yeniləmələri davam etdir',
  'admin.plugins.updatesResumed': 'Yeniləmələr davam etdirildi',
  'admin.plugins.noMatchInstalled': 'Axtarışınıza uyğun quraşdırılmış plagin yoxdur.',
  'admin.plugins.noMatchRegistry': 'Reyestrdə axtarışınıza uyğun plagin yoxdur.',
  'admin.plugins.restart': 'Yenidən başlat',
  'admin.plugins.restarted': 'Plagin yenidən başladıldı',
  'admin.plugins.instanceSettings': 'Sistem tənzimləmələri',
  'admin.plugins.settingsSaved': 'Tənzimləmələr yadda saxlanıldı',
  'admin.plugins.settingsSavedRestarted':
    'Tənzimləmələr yadda saxlanıldı — plagin yenidən başladıldı',
  'admin.plugins.actions': 'Əməliyyatlar',
  'admin.plugins.actions.confirm': 'Bu əməliyyat icra edilsin?',
  'admin.plugins.actions.inactive': 'Əməliyyatlarını icra etmək üçün plagini aktivləşdirin',
  'admin.plugins.requiredMissing': '“{field}” tələb olunur',
  'admin.plugins.cap.readsTrips': 'Səyahətlərinizi oxuyur',
  'admin.plugins.cap.readsUsers': 'Əsas profil məlumatlarını oxuyur',
  'admin.plugins.cap.readsCosts': 'Xərclərinizi oxuyur',
  'admin.plugins.cap.readsPacking': 'Baqaj siyahılarını oxuyur',
  'admin.plugins.cap.readsFiles': 'Səyahət fayllarını oxuyur',
  'admin.plugins.cap.writesCosts': 'Xərclər əlavə edir',
  'admin.plugins.cap.writesPlaces': 'Məkanları redaktə edir',
  'admin.plugins.cap.writesDays': 'Günləri redaktə edir',
  'admin.plugins.cap.writesItinerary': 'Marşrutu redaktə edir',
  'admin.plugins.cap.writesTrips': 'Səyahətləri redaktə edir',
  'admin.plugins.cap.metadata': 'Metaməlumat əlavə edir',
  'admin.plugins.cap.widget': 'İdarə paneli vidceti',
  'admin.plugins.cap.heroWidget': 'Minik talonu vidceti',
  'admin.plugins.cap.placeSlot': 'Məkan məlumatları',
  'admin.plugins.cap.daySlot': 'Gün məlumatları',
  'admin.plugins.cap.reservationSlot': 'Rezervasiya məlumatları',
  'admin.plugins.cap.replacesTabs': 'Planlayıcı tablarını əvəz edir',
  'admin.plugins.cap.realtime': 'Real vaxt yeniləmələri',
  'admin.plugins.cap.notificationChannel': 'Bildiriş kanalı',
  'admin.plugins.cap.photos': 'Fotolar təqdim edir',
  'admin.plugins.cap.calendar': 'Təqvim tədbirləri təqdim edir',
  'admin.plugins.cap.placeDetails': 'Məkan məlumatlarını zənginləşdirir',
  'admin.plugins.cap.search': 'Axtarışlara cavab verir',
  'admin.plugins.cap.poiCategories': 'Xəritəyə kateqoriyalar əlavə edir',
  'admin.plugins.cap.warnings': 'Problemləri işarələyir',
  'admin.plugins.cap.mapLayers': 'Xəritədə təsvirlər çəkir',
  'admin.plugins.cap.routing': 'Marşrutlaşdırma təqdim edir',
  'admin.plugins.cap.daySchedule': 'Plan vaxtları əlavə edir',
  'admin.plugins.cap.dayTint': 'Günləri rəngləndirir',
  'admin.plugins.cap.geolocation': 'Mövqeyinizi oxuyur',
  'admin.plugins.cap.events': 'Fəaliyyətlərə reaksiya verir',
  'admin.plugins.cap.requiresAddon': '{addon} əlavəsini tələb edir',
  'admin.plugins.cap.dependsOn': '{id} {version} tələb edir',
  'admin.plugins.dep.addonDisabledToast': 'Əvvəlcə tələb olunan əlavələri aktivləşdirin: {addons}',
  'admin.plugins.dep.autoEnabled': 'Əvvəlcə tələb olunan plaginlər aktivləşdirildi: {plugins}',
  'admin.plugins.dep.downloaded': '{id} endirildi',
  'admin.plugins.dep.resolveTitle': 'Çatışmayan asılılıqlar',
  'admin.plugins.dep.resolveBody':
    '“{name}” aktivləşdirilməzdən əvvəl bu plaginlərin quraşdırılması tələb olunur.',
  'admin.plugins.dep.requires': '{version} tələb edir',
  'admin.plugins.dep.mismatch': '{wanted} tələb edir — {installed} quraşdırılıb',
  'admin.plugins.dep.download': 'Endir',
  'admin.plugins.dep.update': 'Yenilə',
  'admin.plugins.dep.resolveHint':
    'Öz asılılıqları daxil olmaqla ən son uyğun versiyanı endirir.',
  'admin.plugins.dep.trekIncompatible':
    'TREK {range} tələb edir — bu serverdə {host} işləyir',
  'admin.plugins.dep.trekUnknown': 'Hansı TREK versiyalarını dəstəklədiyini göstərmir',
  'admin.plugins.installCompatible': '{version} versiyasını quraşdır',
  'admin.plugins.installAnyway': 'Yenə də quraşdır',
  'admin.plugins.rangeBypass.pill': 'Versiya yoxlamaları deaktivdir',
  'admin.plugins.rangeBypass.pillHint':
    'TREK_PLUGINS_IGNORE_TREK_RANGE təyin edilib — plaginlər müəlliflərinin göstərdiyi TREK versiyalarından kənarda quraşdırıla və işləyə bilər',
  'admin.plugins.rangeBypass.title': 'Dəstəklədiyi TREK versiyalarından kənardır',
  'admin.plugins.rangeBypass.noticeTitle':
    'Dəstəklədiyi TREK versiyalarından kənarda quraşdırılıb',
  'admin.plugins.rangeBypass.body':
    '“{name}” TREK {range} versiyalarını dəstəklədiyini göstərir, bu serverdə isə {host} işləyir. TREK buna yalnız TREK_PLUGINS_IGNORE_TREK_RANGE təyin edildiyi üçün icazə verir. Müəllif bu TREK versiyası üçün plaginin versiya aralığını yeniləməyib, buna görə işləyəcəyinə zəmanət yoxdur — nadir hallarda uyğun olmayan plagin TREK məlumatlarını korlaya bilər. Yalnız bu riski qəbul edirsinizsə davam edin.',
  'admin.plugins.rangeBypass.bodyUnknown':
    '“{name}” hansı TREK versiyalarını dəstəklədiyini göstərmir; bu serverdə {host} işləyir. TREK buna yalnız TREK_PLUGINS_IGNORE_TREK_RANGE təyin edildiyi üçün icazə verir. Müəllifin onu bu TREK versiyasında sınaqdan keçirdiyinə dair məlumat yoxdur, buna görə işləyəcəyinə zəmanət verilmir — nadir hallarda uyğun olmayan plagin TREK məlumatlarını korlaya bilər. Yalnız bu riski qəbul edirsinizsə davam edin.',
  'admin.plugins.dep.trekBypassed':
    'TREK versiya aralığından ({range}) kənardır — versiya yoxlamaları deaktivdir',
  'admin.plugins.dep.trekBypassedUnknown':
    'TREK versiya aralığı göstərilməyib — versiya yoxlamaları deaktivdir',
  'admin.plugins.incompatible': 'Uyğun deyil',
  'admin.plugins.accessTitle': 'Giriş əldə edə biləcəyi məlumatlar',
  'admin.plugins.connectsTitle': 'Qoşulduğu xidmətlər',
  'admin.plugins.detailsTitle': 'Ətraflı məlumat',
  'admin.plugins.noAccess': 'Xüsusi giriş icazəsi tələb etmir.',
  'admin.plugins.metaVersion': 'Versiya',
  'admin.plugins.metaSize': 'Ölçü',
  'admin.plugins.metaRequires': 'Tələb edir',
  'admin.plugins.metaReviewed': 'Yoxlanılma tarixi',
  'admin.plugins.downloads': 'Endirmələr',
  'admin.addons.title': 'Əlavələr',
  'admin.addons.subtitle':
    'TREK təcrübənizi fərdiləşdirmək üçün funksiyaları aktivləşdirin və ya deaktiv edin.',
  'admin.addons.catalog.packing.name': 'Siyahılar',
  'admin.addons.catalog.packing.description':
    'Səyahətləriniz üçün baqaj siyahıları və tapşırıqlar',
  'admin.addons.catalog.budget.name': 'Xərclər',
  'admin.addons.catalog.budget.description':
    'Səyahət xərclərini izləyin və onları səyahətçilər arasında bölüşdürün',
  'admin.addons.catalog.documents.name': 'Sənədlər',
  'admin.addons.catalog.documents.description': 'Səyahət sənədlərini saxlayın və idarə edin',
  'admin.addons.catalog.vacay.name': 'Vacay',
  'admin.addons.catalog.vacay.description': 'Təqvim görünüşlü şəxsi məzuniyyət planlayıcısı',
  'admin.addons.catalog.atlas.name': 'Atlas',
  'admin.addons.catalog.atlas.description':
    'Ziyarət edilmiş ölkələr və səyahət statistikası ilə dünya xəritəsi',
  'admin.addons.catalog.collab.name': 'Collab',
  'admin.addons.catalog.collab.description':
    'Birgə planlaşdırma üçün qeydlər, sorğular, çat və təkliflər',
  'admin.addons.catalog.roadtrip.name': 'Avtomobil səyahəti',
  'admin.addons.catalog.roadtrip.description':
    'Marşrut üzərindəki dayanacaqlar, sürmə müddətləri və avtomatik yenilənən çatma vaxtları ilə avtomobil səfərlərini planlaşdırın',
  'admin.addons.catalog.memories.name': 'Fotolar (Immich)',
  'admin.addons.catalog.memories.description':
    'Immich sisteminiz vasitəsilə səyahət fotolarını paylaşın',
  'admin.addons.catalog.mcp.name': 'MCP',
  'admin.addons.catalog.mcp.description':
    'Süni intellekt köməkçisi inteqrasiyası üçün Model Context Protocol',
  'admin.addons.subtitleBefore': 'Funksiyaları aktiv və ya deaktiv edərək ',
  'admin.addons.subtitleAfter': ' təcrübənizi fərdiləşdirin.',
  'admin.addons.catalog.naver_list_import.name': 'Naver siyahısının idxalı',
  'admin.addons.catalog.naver_list_import.description':
    'Paylaşılan Naver Maps siyahısından məkanları idxal edin',
  'admin.addons.catalog.airtrail.name': 'AirTrail',
  'admin.addons.catalog.airtrail.description':
    'AirTrail sisteminizdən uçuşları sinxronlaşdırın',
  'admin.addons.catalog.dawarich.name': 'Dawarich',
  'admin.addons.catalog.dawarich.description':
    'Hər istifadəçinin özünün qoşduğu Dawarich sistemindən ziyarətləri və qeydə alınmış marşrutları oxuyun',
  'admin.addons.catalog.llm_parsing.name': 'Süni intellektlə təhlil',
  'admin.addons.catalog.llm_parsing.description':
    'Daxili təhlilçinin oxuya bilmədiyi rezervasiyaları seçdiyiniz süni intellekt modeli ilə oxuyur',
  'admin.addons.llm.vision.auto': 'Avtomatik',
  'admin.addons.llm.vision.on': 'Bəli',
  'admin.addons.llm.vision.off': 'Xeyr',
  'admin.addons.llm.vision.hintLocal': 'Avtomatik rejim bu modelin şəkilləri oxuyub-oxumadığını Ollama serverindən soruşur.',
  'admin.addons.llm.vision.hintCloud': 'Bulud modeli üçün Avtomatik "xeyr" deməkdir. Bu model şəkilləri oxuyursa, Bəli seç.',
  'admin.addons.enabled': 'Aktivdir',
  'admin.addons.disabled': 'Deaktivdir',
  'admin.addons.type.trip': 'Səyahət',
  'admin.addons.type.global': 'Ümumi',
  'admin.addons.type.integration': 'İnteqrasiya',
  'admin.addons.tripHint': 'Hər səyahətdə tab kimi mövcuddur',
  'admin.addons.globalHint': 'Əsas naviqasiyada müstəqil bölmə kimi mövcuddur',
  'admin.addons.integrationHint':
    'Ayrıca səhifəsi olmayan server xidmətləri və API inteqrasiyaları',
  'admin.addons.toast.updated': 'Əlavə yeniləndi',
  'admin.addons.toast.error': 'Əlavəni yeniləmək mümkün olmadı',
  'admin.addons.group.count': '{total} əlavədən {enabled} aktivdir',
  'admin.addons.noAddons': 'Heç bir əlavə mövcud deyil',
  'admin.weather.title': 'Hava məlumatları',
  'admin.weather.badge': '24 mart 2026-cı ildən',
  'admin.weather.description':
    'TREK hava məlumatlarının mənbəyi kimi Open-Meteo-dan istifadə edir. Open-Meteo pulsuz, açıq mənbəli hava xidmətidir — API açarı tələb olunmur.',
  'admin.weather.forecast': '16 günlük hava proqnozu',
  'admin.weather.forecastDesc': 'Əvvəllər 5 gün idi (OpenWeatherMap)',
  'admin.weather.climate': 'Tarixi iqlim məlumatları',
  'admin.weather.climateDesc':
    '16 günlük hava proqnozundan sonrakı günlər üçün son 85 ilin orta göstəriciləri',
  'admin.weather.requests': 'Gündə 10 000 sorğu',
  'admin.weather.requestsDesc': 'Pulsuzdur, API açarı tələb olunmur',
  'admin.weather.locationHint':
    'Hava məlumatları hər gün üçün koordinatları olan ilk məkana əsaslanır. Günə heç bir məkan təyin edilməyibsə, məkan siyahısındakı istənilən məkan istinad kimi istifadə olunur.',
  'admin.tabs.mcpTokens': 'MCP girişi',
  'admin.mcpTokens.title': 'MCP girişi',
  'admin.mcpTokens.subtitle':
    'Bütün istifadəçilər üzrə OAuth sessiyalarını və API tokenlərini idarə edin',
  'admin.mcpTokens.sectionTitle': 'API tokenləri',
  'admin.mcpTokens.owner': 'Sahib',
  'admin.mcpTokens.tokenName': 'Tokenin adı',
  'admin.mcpTokens.created': 'Yaradılıb',
  'admin.mcpTokens.lastUsed': 'Son istifadə',
  'admin.mcpTokens.never': 'Heç vaxt',
  'admin.mcpTokens.empty': 'Hələ heç bir MCP tokeni yaradılmayıb',
  'admin.mcpTokens.deleteTitle': 'Tokeni sil',
  'admin.mcpTokens.deleteMessage':
    'Bu əməliyyat tokeni dərhal ləğv edəcək. İstifadəçi bu token vasitəsilə MCP girişini itirəcək.',
  'admin.mcpTokens.deleteSuccess': 'Token silindi',
  'admin.mcpTokens.deleteError': 'Tokeni silmək mümkün olmadı',
  'admin.mcpTokens.loadError': 'Tokenləri yükləmək mümkün olmadı',
  'admin.oauthSessions.sectionTitle': 'OAuth sessiyaları',
  'admin.oauthSessions.clientName': 'Müştəri',
  'admin.oauthSessions.owner': 'Sahib',
  'admin.oauthSessions.scopes': 'İcazə sahələri',
  'admin.oauthSessions.created': 'Yaradılıb',
  'admin.oauthSessions.empty': 'Aktiv OAuth sessiyası yoxdur',
  'admin.oauthSessions.revokeTitle': 'Sessiyanı ləğv et',
  'admin.oauthSessions.revokeMessage':
    'Bu əməliyyat OAuth sessiyasını dərhal ləğv edəcək. Müştəri MCP girişini itirəcək.',
  'admin.oauthSessions.revokeSuccess': 'Sessiya ləğv edildi',
  'admin.oauthSessions.revokeError': 'Sessiyanı ləğv etmək mümkün olmadı',
  'admin.oauthSessions.loadError': 'OAuth sessiyalarını yükləmək mümkün olmadı',
  'admin.tabs.github': 'GitHub',
  'admin.audit.subtitle':
    'Təhlükəsizlik baxımından həssas və idarəetmə hadisələri (ehtiyat nüsxələr, istifadəçilər, MFA və tənzimləmələr).',
  'admin.audit.empty': 'Hələ heç bir audit qeydi yoxdur.',
  'admin.audit.refresh': 'Yenilə',
  'admin.audit.loadMore': 'Daha çox yüklə',
  'admin.audit.showing': '{count} yüklənib · cəmi {total}',
  'admin.audit.col.time': 'Vaxt',
  'admin.audit.col.user': 'İstifadəçi',
  'admin.audit.col.action': 'Əməliyyat',
  'admin.audit.col.resource': 'Resurs',
  'admin.audit.col.ip': 'IP',
  'admin.audit.col.details': 'Ətraflı məlumat',
  'admin.github.title': 'Buraxılış tarixçəsi',
  'admin.github.subtitle': '{repo} reyestrindən ən son yeniləmələr',
  'admin.github.latest': 'Ən son',
  'admin.github.prerelease': 'İlkin buraxılış',
  'admin.github.showDetails': 'Ətraflı məlumatı göstər',
  'admin.github.hideDetails': 'Ətraflı məlumatı gizlət',
  'admin.github.loadMore': 'Daha çox yüklə',
  'admin.github.loading': 'Yüklənir...',
  'admin.github.error': 'Buraxılışları yükləmək mümkün olmadı',
  'admin.github.by': 'müəllif',
  'admin.github.support': 'TREK-i inkişaf etdirməyə davam etməyimə kömək edir',
  'admin.update.available': 'Yeniləmə mövcuddur',
  'admin.update.text': 'TREK {version} mövcuddur. Sizdə {current} işləyir.',
  'admin.update.button': 'GitHub-da bax',
  'admin.update.install': 'Yeniləməni quraşdır',
  'admin.update.confirmTitle': 'Yeniləmə quraşdırılsın?',
  'admin.update.confirmText':
    'TREK {current} versiyasından {version} versiyasına yenilənəcək. Bundan sonra server avtomatik yenidən başladılacaq.',
  'admin.update.dataInfo':
    'Bütün məlumatlarınız (səyahətlər, istifadəçilər, API açarları, yükləmələr, Vacay, Atlas və büdcələr) qorunacaq.',
  'admin.update.warning': 'Yenidən başlatma zamanı tətbiq qısa müddət ərzində əlçatmaz olacaq.',
  'admin.update.confirm': 'İndi yenilə',
  'admin.update.installing': 'Yenilənir…',
  'admin.update.success': 'Yeniləmə quraşdırıldı! Server yenidən başladılır…',
  'admin.update.failed': 'Yeniləmə uğursuz oldu',
  'admin.update.backupHint': 'Yeniləməzdən əvvəl ehtiyat nüsxə yaratmağı tövsiyə edirik.',
  'admin.update.backupLink': 'Ehtiyat nüsxəyə keç',
  'admin.update.howTo': 'Necə yeniləməli',
  'admin.update.dockerText':
    'TREK sisteminiz Docker-də işləyir. {version} versiyasına yeniləmək üçün serverinizdə aşağıdakı əmrləri icra edin:',
  'admin.update.nonDockerText':
    'Bu TREK sistemi Docker-də işləmir. {version} versiyasına yeniləmək üçün əvvəl istifadə etdiyiniz quraşdırma və ya yeniləmə üsulunu yenidən icra edin — məsələn, Proxmox Community Scripts istifadə edirsinizsə, yeniləməni LXC konsolundan başladın:',
  'admin.update.wikiLink': 'Yeniləmə təlimatını aç',
  'admin.update.reloadHint': 'Bir neçə saniyədən sonra səhifəni yenidən yükləyin.',
  'admin.tabs.permissions': 'İcazələr',
  'admin.addons.catalog.journey.name': 'Səyahət gündəliyi',
  'admin.addons.catalog.journey.description':
    'Qeydiyyatlar, fotolar və gündəlik hekayələrlə səyahət izləmə və səyahət gündəliyi',
  'admin.addons.catalog.collections.name': 'Kolleksiyalar',
  'admin.addons.catalog.collections.description':
    'İstənilən səyahətdən məkanları adlandırılmış siyahılarda toplayın və yenidən istifadə edin',
  'admin.passkey.title': 'Keçid açarı ilə giriş',
  'admin.passkey.cardHint':
    'İstifadəçilərə keçid açarları (WebAuthn) ilə daxil olmağa icazə verin. Standart olaraq deaktivdir.',
  'admin.passkey.login': 'Keçid açarı ilə girişi aktivləşdir',
  'admin.passkey.loginHint':
    '“Keçid açarı ilə daxil ol” seçimini göstərin və istifadəçilərə tənzimləmələrində keçid açarlarını qeydiyyatdan keçirməyə icazə verin.',
  'admin.passkey.notConfigured':
    'Bu quraşdırma üçün hələ heç bir WebAuthn domeni müəyyən edilmir. APP_URL və ya aşağıdakı Relying Party ID-ni təyin edin — həmin vaxta qədər keçid açarları gizli qalacaq.',
  'admin.passkey.rpId': 'Relying Party ID (domen)',
  'admin.passkey.rpIdHint':
    'Keçid açarlarının bağlandığı sadə domen, məsələn, trek.example.org. APP_URL əsasında müəyyən edilməsi üçün boş saxlayın. Sonradan dəyişdirilməsi mövcud keçid açarlarını etibarsız edəcək.',
  'admin.passkey.origins': 'İcazə verilən mənbələr',
  'admin.passkey.originsHint':
    'Vergüllə ayrılmış tam mənbələr, məsələn, https://trek.example.org. APP_URL istifadə etmək üçün boş saxlayın.',
  'admin.passkey.reset': 'Keçid açarlarını sıfırla',
  'admin.passkey.resetHint':
    'Bu istifadəçinin bütün keçid açarlarını silin (məsələn, cihaz itirildikdə). O, yenə də parolu ilə daxil ola bilər.',
  'admin.passkey.resetConfirm': '{name} üçün bütün keçid açarları silinsin?',
  'admin.passkey.resetDone': '{count} keçid açarı silindi',
  'admin.group.users': 'İstifadəçilər',
  'admin.group.config': 'Konfiqurasiya',
  'admin.group.integration': 'İnteqrasiyalar',
  'admin.group.maintenance': 'Texniki xidmət',
  'admin.invite.tripLabel': 'Səyahətə əlavə et (istəyə bağlı)',
  'admin.invite.tripNone': 'Səyahət yoxdur',
  'admin.invite.tripHint':
    'Yeni istifadəçi keçid vasitəsilə qeydiyyatdan keçdikdə avtomatik olaraq bu səyahətə əlavə edilir.',
  'admin.invite.boundTo': '{trip} səyahətinə əlavə edir',
  'admin.placesUsageTitle': 'Açarın hansı məqsədlərlə istifadə edildiyi',
  'admin.mapsKeyHintShort':
    'Fotolar, reytinqlər və iş saatları əlavə edir. Bundan sonra hər sorğu Google-a göndərilir.',
  'admin.amapKeyHintShort':
    'Materik Çinində məkan axtarışı üçün. JS API açarı deyil, veb xidməti açarı tələb olunur.',
  'admin.collab.links.subtitle': 'Paylaşılan keçidlər və əlfəcinlər',
};

export default admin;