import type { TranslationStrings } from '../types';

const settings: TranslationStrings = {
  'settings.title': 'Tənzimləmələr',
  'settings.subtitle': 'Şəxsi tənzimləmələrinizi konfiqurasiya edin',
  'settings.tabs.display': 'Ümumi',
  'settings.tabs.map': 'Xəritə',
  'settings.tabs.notifications': 'Bildirişlər',
  'settings.tabs.integrations': 'İnteqrasiyalar',

  'settings.plugins.oauth.connected': 'Qoşulub',
  'settings.plugins.oauth.notConnected': 'Qoşulmayıb',
  'settings.plugins.oauth.connect': 'Qoş',
  'settings.plugins.oauth.disconnect': 'Bağlantını kəs',
  'settings.tabs.plugins': 'Plaginlər',
  'settings.plugins.title': 'Plagin tənzimləmələri',
  'settings.plugins.subtitle':
    'İstifadə etdiyiniz plaginlər üçün şəxsi tənzimləmələriniz (API açarları və seçimlər).',
  'settings.plugins.empty': 'Aktiv plagin yoxdur.',
  'settings.plugins.saved': 'Tənzimləmələr yadda saxlanıldı',
  'settings.plugins.requiredMissing': '“{field}” tələb olunur',

  'settings.pluginActivity.title': 'Plagin fəaliyyəti',
  'settings.pluginActivity.description':
    'Plaginin sizin adınızdan etdiyi bütün əməliyyatlar, ən yenidən başlayaraq.',
  'settings.pluginActivity.empty': 'Hələ plagin fəaliyyəti yoxdur.',
  'settings.pluginActivity.refresh': 'Yenilə',
  'settings.pluginActivity.columns.plugin': 'Plagin',
  'settings.pluginActivity.columns.action': 'Əməliyyat',
  'settings.pluginActivity.columns.resource': 'Resurs',
  'settings.pluginActivity.columns.when': 'Vaxt',
  'settings.pluginActivity.columns.status': 'Nəticə',

  'settings.tabs.account': 'Hesab',
  'settings.tabs.offline': 'Oflayn',
  'settings.tabs.about': 'Haqqında',

  'settings.map': 'Xəritə',
  'settings.mapTemplate': 'Xəritə şablonu',
  'settings.mapTemplatePlaceholder.select': 'Şablon seçin...',
  'settings.mapDefaultHint':
    'OpenStreetMap üçün boş saxlayın (standart)',
  'settings.routingBase': 'Şəxsi marşrut mühərriki',
  'settings.routingBaseHint':
    'Öz OSRM instansiyanız. Sahə boş olduqda saniyədə təxminən bir sorğuya icazə verən ictimai serverlər istifadə edilir — bu, bir günlük plan üçün kifayətdir, avtomobil səyahəti üçün isə məhdud ola bilər. Server yenidən başladıldıqdan sonra qüvvəyə minir.',
  'settings.valhallaBase': 'Şəxsi Valhalla instansiyası',
  'settings.valhallaBaseHint':
    'TREK ödənişli yollardan, avtomagistrallardan və bərələrdən yayınmaq üçün standart olaraq ictimai FOSSGIS Valhalla xidmətindən istifadə edir. Əvəzində öz Valhalla URL-inizdən istifadə etmək üçün onu buraya daxil edin. Yalnız fərdi marşrut instansiyası konfiqurasiya edilərsə, ictimai Valhalla istifadə olunmur. Fərdi URL daxil etdikdən sonra serveri yenidən başladın və səhifəni yeniləyin.',
  'settings.mapHint': 'Xəritə plitələri üçün URL şablonu',
  'settings.mapProvider': 'Xəritə provayderi',
  'settings.mapProviderHint':
    'Səyahət planlayıcısı və Səyahət gündəliyi xəritələrinə təsir edir. Atlas həmişə Leaflet istifadə edir.',
  'settings.mapLeafletSubtitle':
    'Klassik 2D, istənilən rastr plitələri',
  'settings.mapMapboxSubtitle':
    'Vektor plitələri, 3D binalar və relyef',
  'settings.mapMapLibreSubtitle':
    'OpenFreeMap vektor plitələri, token tələb olunmur',
  'settings.mapExperimental': 'Eksperimental',

  'settings.mapMapboxToken': 'Mapbox giriş tokeni',
  'settings.mapMapboxTokenHint': 'İctimai token (pk.*), mənbə:',
  'settings.mapMapboxTokenLink': 'mapbox.com → Access tokens',

  'settings.mapCartoKey': 'CARTO API açarı',
  'settings.mapCartoKeyHint':
    'CARTO əsas xəritələri açar olmadan su nişanı göstərir. Pulsuzdur və hesab tələb etmir, mənbə:',
  'settings.mapCartoKeyLink': 'carto.com əsas xəritə API açarı',
  'settings.mapCartoKeyMissing':
    'Bu şablon CARTO əsas xəritəsidir. Açar olmadıqda CARTO hər plitənin üzərinə “API KEY REQUIRED” yazısı əlavə edir. Açar daxil edənədək TREK standart əsas xəritəni göstərəcək.',

  'settings.mapStyle': 'Xəritə üslubu',
  'settings.mapStylePlaceholder': 'Mapbox üslubu seçin',
  'settings.mapStyleHint':
    'Hazır üslub və ya öz mapbox://styles/USER/ID URL-iniz',
  'settings.mapOpenFreeMapStylePlaceholder':
    'OpenFreeMap üslubu seçin',
  'settings.mapOpenFreeMapStyleHint':
    'Hazır üslub və ya OpenFreeMap üslub URL-i. OpenFreeMap üslubları tokensiz işləyir.',

  'settings.map3dBuildings': '3D binalar və relyef',
  'settings.map3dHint':
    'Maililik və real 3D bina modelləri — peyk görünüşü daxil olmaqla bütün üslublarda işləyir.',
  'settings.mapHighQuality': 'Yüksək keyfiyyət rejimi',
  'settings.mapHighQualityHint':
    'Daha kəskin kənarlar və real dünya görünüşü üçün hamarlama və qlobus proyeksiyası.',
  'settings.mapHighQualityWarning':
    'Zəif cihazlarda performansa təsir edə bilər.',
  'settings.mapTipLabel': 'İpucu:',
  'settings.mapTip':
    'xəritəni fırlatmaq və əymək üçün sağ kliklə sürükləyin. Məkan əlavə etmək üçün orta düymə ilə klikləyin (sağ klik fırlatma üçün ayrılıb).',
  'settings.saveMap': 'Xəritəni yadda saxla',

  'settings.apiKeys': 'API açarları',
  'settings.mapsKey': 'Google Maps API açarı',
  'settings.mapsKeyHint':
    'Məkan axtarışı üçün. Places API (New) tələb olunur. console.cloud.google.com ünvanından əldə edin',
  'settings.weatherKey': 'OpenWeatherMap API açarı',
  'settings.weatherKeyHint':
    'Hava məlumatları üçün. openweathermap.org/api ünvanında pulsuzdur',
  'settings.keyPlaceholder': 'Açarı daxil edin...',
  'settings.configured': 'Konfiqurasiya edilib',
  'settings.saveKeys': 'Açarları yadda saxla',

  'settings.display': 'Görünüş',
  'settings.colorMode': 'Rəng rejimi',
  'settings.light': 'İşıqlı',
  'settings.dark': 'Tünd',
  'settings.auto': 'Avtomatik',
  'settings.language': 'Dil',
  'settings.temperature': 'Temperatur vahidi',
  'settings.distance': 'Məsafə vahidi',
  'settings.timeFormat': 'Vaxt formatı',
  'settings.weekStart': 'Həftənin başlanğıcı',
  'settings.weekStartHint': 'Bütün tarix seçicilərində həftənin ilk günü. Vacay-ın öz ayarı var.',

  'settings.bookingLabels': 'Rezervasiya marşrutu etiketləri',
  'settings.bookingLabelsHint':
    'Stansiya və hava limanı adlarını xəritədə göstərin. Deaktiv olduqda yalnız ikon göstərilir.',
  'settings.mapPoiPill': 'Xəritədə məkanları kəşf et',
  'settings.mapPoiPillHint':
    'OpenStreetMap vasitəsilə yaxınlıqdakı restoranları, otelləri və digər məkanları tapmaq üçün səyahət xəritəsində kateqoriya düyməsi göstərin.',
  'settings.blurBookingCodes': 'Rezervasiya kodlarını bulanıqlaşdır',
  'settings.aiAlwaysRetry':
    'Rezervasiya idxalını həmişə AI ilə yenidən sına',
  'settings.aiAlwaysRetryHint':
    'Fayl standart təhlil vasitəsi ilə oxunmadıqda onu avtomatik olaraq AI ilə yenidən təhlil edin.',

  'settings.optimizeFromAccommodation':
    'Marşrutu yaşayış yerindən başlayaraq optimallaşdır',
  'settings.optimizeFromAccommodationHint':
    'Günü optimallaşdırarkən marşrutu səhər oyandığınız oteldən başladın və həmin axşam giriş etdiyiniz oteldə bitirin.',

  'settings.notifications': 'Bildirişlər',
  'settings.notifyTripInvite': 'Səyahət dəvətləri',
  'settings.notifyBookingChange': 'Rezervasiya dəyişiklikləri',
  'settings.notifyTripReminder': 'Səyahət xatırlatmaları',
  'settings.notifyTodoDue': 'Son tarixi yaxınlaşan tapşırıqlar',
  'settings.notifyVacayInvite': 'Vacay birləşdirmə dəvətləri',
  'settings.notifyVacayShare': 'Vacay təqvim paylaşımları',
  'settings.notifyCollectionInvite': 'Kolleksiya dəvətləri',
  'settings.notifySynologySessionCleared': 'Synology sessiyası təmizləndi',
  'settings.notifyPluginNotification': 'Plagin bildirişləri',
  'settings.notifyPhotosShared': 'Paylaşılan fotolar (Immich)',
  'settings.notifyCollabMessage': 'Çat mesajları (Collab)',
  'settings.notifyPackingTagged': 'Baqaj siyahısı: təyinatlar',
  'settings.notifyWebhook': 'Webhook bildirişləri',
  'settings.notifyVersionAvailable': 'Yeni versiya əlçatandır',
  'settings.notifyReplicaFailure': 'Yaddaş replikası xətası',

  'settings.notificationPreferences.email': 'E-poçt',
  'settings.notificationPreferences.webhook': 'Webhook',
  'settings.notificationPreferences.inapp': 'Tətbiqdaxili',
  'settings.notificationPreferences.notConfigured':
    'Hələ konfiqurasiya edilməyib — plaginin tənzimləmələrində quraşdırın',
  'settings.plugins.actions': 'Əməliyyatlar',
  'settings.plugins.actions.confirm': 'Bu əməliyyat icra edilsin?',
  'settings.notificationPreferences.sendTest': 'Test göndər',
  'settings.notificationPreferences.configure': 'Konfiqurasiya et',
  'settings.notificationPreferences.testSuccess':
    'Test bildirişi göndərildi.',
  'settings.notificationPreferences.testFailed': 'Test uğursuz oldu.',
  'settings.notificationPreferences.pluginConfigured':
    'Konfiqurasiya edilib. Giriş məlumatlarını plaginin tənzimləmələr səhifəsindən idarə edin.',
  'settings.notificationPreferences.ntfy': 'Ntfy',
  'settings.notificationPreferences.push': 'Push',
  'settings.webPush.title': 'Bu cihazda push bildirişləri',
  'settings.webPush.hint':
    'TREK bağlı olanda belə TREK bildirişlərini bu cihazda göstərir. Hansı hadisələrin gəldiyini Push sütunu müəyyən edir.',
  'settings.webPush.enable': 'Bu cihaz üçün aktiv et',
  'settings.webPush.disable': 'Bu cihaz üçün deaktiv et',
  'settings.webPush.enabled': 'Bu cihaz üçün aktivdir',
  'settings.webPush.unsupported': 'Bu brauzer push bildirişlərini qəbul edə bilmir.',
  'settings.webPush.insecure': 'Push üçün TREK HTTPS vasitəsilə açılmalıdır.',
  'settings.webPush.iosInstall': 'iPhone və iPad-də əvvəlcə TREK-i Əsas ekrana əlavə edin və onu oradan açın.',
  'settings.webPush.denied':
    'Bu brauzerdə TREK üçün bildirişlər bloklanıb. Onlara brauzer tənzimləmələrində icazə verin, sonra yenidən cəhd edin.',
  'settings.webPush.failed': 'Bu cihaz üçün push aktiv edilə bilmədi.',
  'settings.notificationPreferences.noChannels':
    'Heç bir bildiriş kanalı konfiqurasiya edilməyib. Administratordan e-poçt və ya webhook bildirişlərini quraşdırmasını istəyin.',

  'settings.webhookUrl.label': 'Webhook URL-i',
  'settings.webhookUrl.placeholder':
    'https://discord.com/api/webhooks/...',
  'settings.webhookUrl.hint':
    'Bildirişlər almaq üçün Discord, Slack və ya fərdi webhook URL-inizi daxil edin.',
  'settings.webhookUrl.saved': 'Webhook URL-i yadda saxlanıldı',
  'settings.webhookUrl.test': 'Yoxla',
  'settings.webhookUrl.testSuccess':
    'Test webhook-u uğurla göndərildi',
  'settings.webhookUrl.testFailed': 'Test webhook-u uğursuz oldu',

  'settings.ntfyUrl.topicLabel': 'Ntfy mövzusu',
  'settings.ntfyUrl.topicPlaceholder': 'my-trek-alerts',
  'settings.ntfyUrl.serverLabel':
    'Ntfy server URL-i (istəyə bağlı)',
  'settings.ntfyUrl.serverPlaceholder': 'https://ntfy.sh',
  'settings.ntfyUrl.hint':
    'Push bildirişləri almaq üçün ntfy mövzusunu daxil edin. Administratorunuzun konfiqurasiya etdiyi standart serverdən istifadə etmək üçün server sahəsini boş saxlayın.',
  'settings.ntfyUrl.tokenLabel': 'Giriş tokeni (istəyə bağlı)',
  'settings.ntfyUrl.tokenHint':
    'Parolla qorunan mövzular üçün tələb olunur.',
  'settings.ntfyUrl.saved': 'Ntfy tənzimləmələri yadda saxlanıldı',
  'settings.ntfyUrl.test': 'Yoxla',
  'settings.ntfyUrl.testSuccess':
    'Test ntfy bildirişi uğurla göndərildi',
  'settings.ntfyUrl.testFailed': 'Test ntfy bildirişi uğursuz oldu',
  'settings.ntfyUrl.tokenCleared': 'Giriş tokeni təmizləndi',

  'settings.notificationsDisabled':
    'Bildirişlər konfiqurasiya edilməyib. Administratordan e-poçt və ya webhook bildirişlərini aktivləşdirməsini istəyin.',
  'settings.notificationsActive': 'Aktiv kanal',
  'settings.notificationsManagedByAdmin':
    'Bildiriş hadisələri administratorunuz tərəfindən konfiqurasiya edilir.',
  'settings.on': 'Aktiv',
  'settings.off': 'Deaktiv',

  'settings.mcp.title': 'MCP konfiqurasiyası',
  'settings.mcp.endpoint': 'MCP son nöqtəsi',
  'settings.mcp.clientConfig': 'Müştəri konfiqurasiyası',
  'settings.mcp.clientConfigHint':
    'Aşağıdakı siyahıdan API tokeni götürərək <your_token> hissəsini onunla əvəz edin. npx yolu sisteminizə uyğun dəyişdirilə bilər (məsələn, Windows-da C:\\PROGRA~1\\nodejs\\npx.cmd).',
  'settings.mcp.clientConfigHintOAuth':
    'Yuxarıda yaratdığınız OAuth 2.1 müştərisində göstərilən məlumatlarla <your_client_id> və <your_client_secret> hissələrini əvəz edin. İlk qoşulma zamanı mcp-remote avtorizasiyanı tamamlamaq üçün brauzerinizi açacaq. npx yolu sisteminizə uyğun dəyişdirilə bilər (məsələn, Windows-da C:\\PROGRA~1\\nodejs\\npx.cmd).',
  'settings.mcp.copy': 'Kopyala',
  'settings.mcp.copied': 'Kopyalandı!',
  'settings.mcp.apiTokens': 'API tokenləri',
  'settings.mcp.createToken': 'Yeni token yarat',
  'settings.mcp.noTokens':
    'Hələ token yoxdur. MCP müştərilərini qoşmaq üçün token yaradın.',
  'settings.mcp.tokenCreatedAt': 'Yaradılıb',
  'settings.mcp.tokenUsedAt': 'İstifadə edilib',
  'settings.mcp.deleteTokenTitle': 'Tokeni sil',
  'settings.mcp.deleteTokenMessage':
    'Bu token dərhal işləməyəcək. Ondan istifadə edən bütün MCP müştəriləri giriş icazəsini itirəcək.',
  'settings.mcp.modal.createTitle': 'API tokeni yarat',
  'settings.mcp.modal.tokenName': 'Tokenin adı',
  'settings.mcp.modal.tokenNamePlaceholder':
    'məs. Claude Desktop, İş noutbuku',
  'settings.mcp.modal.creating': 'Yaradılır…',
  'settings.mcp.modal.create': 'Token yarat',
  'settings.mcp.modal.createdTitle': 'Token yaradıldı',
  'settings.mcp.modal.createdWarning':
    'Bu token yalnız bir dəfə göstəriləcək. İndi kopyalayıb təhlükəsiz yerdə saxlayın — sonradan bərpa edilə bilməz.',
  'settings.mcp.modal.done': 'Hazır',
  'settings.mcp.toast.created': 'Token yaradıldı',
  'settings.mcp.toast.createError': 'Token yaratmaq mümkün olmadı',
  'settings.mcp.toast.deleted': 'Token silindi',
  'settings.mcp.toast.deleteError': 'Tokeni silmək mümkün olmadı',
  'settings.mcp.apiTokensDeprecated':
    'API tokenləri köhnəlmiş hesab olunur və gələcək versiyada silinəcək. Əvəzində OAuth 2.1 müştərilərindən istifadə edin.',

  'settings.oauth.clients': 'OAuth 2.1 müştəriləri',
  'settings.oauth.clientsHint':
    'Üçüncü tərəf MCP tətbiqlərinin (Claude Web, Cursor və s.) statik tokenlər olmadan qoşulması üçün OAuth 2.1 müştəriləri qeydiyyatdan keçirin.',
  'settings.oauth.createClient': 'Yeni müştəri',
  'settings.oauth.noClients': 'Qeydiyyatdan keçmiş OAuth müştərisi yoxdur.',
  'settings.oauth.clientId': 'Müştəri ID-si',
  'settings.oauth.clientSecret': 'Müştəri sirri',
  'settings.oauth.deleteClient': 'Müştərini sil',
  'settings.oauth.deleteClientMessage':
    'Bu müştəri və bütün aktiv sessiyaları həmişəlik silinəcək. Ondan istifadə edən tətbiqlər giriş icazəsini dərhal itirəcək.',
  'settings.oauth.rotateSecret': 'Sirri yenilə',
  'settings.oauth.rotateSecretMessage':
    'Yeni müştəri sirri yaradılacaq və bütün mövcud sessiyalar dərhal etibarsız ediləcək. Bu pəncərəni bağlamazdan əvvəl tətbiqinizi yeniləyin.',
  'settings.oauth.rotateSecretConfirm': 'Yenilə',
  'settings.oauth.rotateSecretConfirming': 'Yenilənir…',
  'settings.oauth.rotateSecretDoneTitle': 'Yeni sirr yaradıldı',
  'settings.oauth.rotateSecretDoneWarning':
    'Bu sirr yalnız bir dəfə göstərilir. İndi kopyalayıb tətbiqinizi yeniləyin — bütün əvvəlki sessiyalar etibarsız edilib.',

  'settings.oauth.activeSessions': 'Aktiv OAuth sessiyaları',
  'settings.oauth.sessionScopes': 'İcazə sahələri',
  'settings.oauth.sessionExpires': 'Bitmə vaxtı',
  'settings.oauth.revoke': 'Ləğv et',
  'settings.oauth.revokeSession': 'Sessiyanı ləğv et',
  'settings.oauth.revokeSessionMessage':
    'Bu OAuth sessiyasının giriş icazəsi dərhal ləğv ediləcək.',

  'settings.oauth.modal.createTitle': 'OAuth müştərisini qeydiyyatdan keçir',
  'settings.oauth.modal.presets': 'Sürətli seçimlər',
  'settings.oauth.modal.clientName': 'Tətbiqin adı',
  'settings.oauth.modal.clientNamePlaceholder':
    'məs. Claude Web, Mənim MCP tətbiqim',
  'settings.oauth.modal.redirectUris': 'Yönləndirmə URI-ləri',
  'settings.oauth.modal.redirectUrisPlaceholder':
    'https://your-app.com/callback\nhttps://your-app.com/auth',
  'settings.oauth.modal.redirectUrisHint':
    'Hər sətirdə bir URI. HTTPS, geri dövrəli HTTP və ya şəxsi tətbiq sxemi (myapp://). Geri dövrəli URI-nin portu istisna olmaqla tam uyğunlaşdırılır.',
  'settings.oauth.modal.scopes': 'İcazə verilən sahələr',
  'settings.oauth.modal.scopesHint':
    'list_trips və get_trip_summary həmişə əlçatandır — əlavə icazə sahəsi tələb olunmur. Bunlar AI-a digər alətlər üçün lazım olan səyahət ID-lərini tapmağa imkan verir.',
  'settings.oauth.modal.selectAll': 'Hamısını seç',
  'settings.oauth.modal.deselectAll': 'Bütün seçimləri ləğv et',
  'settings.oauth.modal.creating': 'Qeydiyyatdan keçirilir…',
  'settings.oauth.modal.create': 'Müştərini qeydiyyatdan keçir',
  'settings.oauth.modal.createdTitle': 'Müştəri qeydiyyatdan keçirildi',
  'settings.oauth.modal.createdWarning':
    'Müştəri sirri yalnız bir dəfə göstərilir. İndi kopyalayın — sonradan bərpa edilə bilməz.',

  'settings.oauth.toast.createError':
    'OAuth müştərisini qeydiyyatdan keçirmək mümkün olmadı',
  'settings.oauth.toast.deleted': 'OAuth müştərisi silindi',
  'settings.oauth.toast.deleteError':
    'OAuth müştərisini silmək mümkün olmadı',
  'settings.oauth.toast.revoked': 'Sessiya ləğv edildi',
  'settings.oauth.toast.revokeError':
    'Sessiyanı ləğv etmək mümkün olmadı',
  'settings.oauth.toast.rotateError':
    'Müştəri sirrini yeniləmək mümkün olmadı',

  'settings.oauth.modal.machineClient':
    'Maşın müştərisi (brauzer girişi olmadan)',
  'settings.oauth.modal.machineClientHint':
    'client_credentials icazəsindən istifadə edin — yönləndirmə URI-ləri tələb olunmur. Token birbaşa client_id və client_secret vasitəsilə verilir və seçilmiş icazə sahələri daxilində sizin adınızdan işləyir.',
  'settings.oauth.modal.machineClientUsage':
    'Token əldə edin: grant_type=client_credentials, client_id və client_secret ilə POST /oauth/token sorğusu göndərin. Brauzer və yeniləmə tokeni tələb olunmur.',
  'settings.oauth.badge.machine': 'maşın',

  'settings.account': 'Hesab',
  'settings.about': 'Haqqında',
  'settings.about.reportBug': 'Xəta bildir',
  'settings.about.reportBugHint': 'Problem tapmısınız? Bizə bildirin',
  'settings.about.featureRequest': 'Funksiya təklifi',
  'settings.about.featureRequestHint': 'Yeni funksiya təklif edin',
  'settings.about.wikiHint': 'Sənədlər və təlimatlar',
  'settings.about.descriptionManaged':
    'TREK səyahətlərinizi ilk ideyadan son xatirəyədək təşkil etməyə kömək edir. Günlük planlaşdırma, büdcə, baqaj siyahıları, fotolar və daha çoxu — hamısı bir yerdə.',
  'settings.about.sourceTitle': 'Mənbə kodu',
  'settings.about.sourceHint':
    'TREK AGPL-3.0 lisenziyalı açıq mənbəli layihədir',

  'settings.about.supporters.badge': 'Aylıq dəstəkçilər',
  'settings.about.supporters.title': 'TREK-in səyahət yoldaşları',
  'settings.about.supporters.subtitle':
    'Siz növbəti marşrutunuzu planlaşdırarkən bu insanlar TREK-in gələcəyini planlaşdırmağa kömək edir. Onların aylıq töhfəsi birbaşa inkişaf işlərinə və sərf olunan real iş saatlarına yönəlir — beləliklə TREK açıq mənbəli qalır.',
  'settings.about.supporters.since': '{date} tarixindən dəstəkçi',
  'settings.about.supporters.tierEmpty': 'İlk dəstəkçi olun',
  'settings.about.supporter.tier.noReturnTicket': 'Dönüşsüz bilet',
  'settings.about.supporter.tier.lostLuggageVip': 'İtmiş baqaj VIP',
  'settings.about.supporter.tier.businessClassDreamer':
    'Biznes sinfi xəyalpərəsti',
  'settings.about.supporter.tier.budgetTraveller': 'Büdcəli səyahətçi',
  'settings.about.supporter.tier.hostelBunkmate': 'Hostel otaq yoldaşı',

  'settings.about.description':
    'TREK səyahətlərinizi ilk ideyadan son xatirəyədək təşkil etməyə kömək edən, öz serverinizdə yerləşdirilən səyahət planlayıcısıdır. Günlük planlaşdırma, büdcə, baqaj siyahıları, fotolar və daha çoxu — hamısı bir yerdə, öz serverinizdə.',
  'settings.about.madeWith': 'Hazırlanıb:',
  'settings.about.madeBy':
    'Maurice və böyüyən açıq mənbə icması tərəfindən.',

  'settings.username': 'İstifadəçi adı',
  'settings.email': 'E-poçt',
  'settings.role': 'Rol',
  'settings.roleAdmin': 'Administrator',
  'settings.oidcLinked': 'Əlaqələndirilib:',
  'settings.changePassword': 'Parolu dəyiş',
  'settings.currentPassword': 'Cari parol',
  'settings.currentPasswordRequired': 'Cari parol tələb olunur',
  'settings.newPassword': 'Yeni parol',
  'settings.confirmPassword': 'Yeni parolu təsdiqləyin',
  'settings.updatePassword': 'Parolu yenilə',
  'settings.passwordRequired': 'Cari və yeni parolu daxil edin',
  'settings.passwordTooShort': 'Parol ən azı 8 simvoldan ibarət olmalıdır',
  'settings.passwordMismatch': 'Parollar uyğun gəlmir',
  'settings.passwordWeak':
    'Parolda böyük hərf, kiçik hərf, rəqəm və xüsusi simvol olmalıdır',
  'settings.passwordChanged': 'Parol uğurla dəyişdirildi',
  'settings.mustChangePassword':
    'Davam etməzdən əvvəl parolunuzu dəyişməlisiniz. Aşağıda yeni parol təyin edin.',

  'settings.deleteAccount': 'Hesabı sil',
  'settings.deleteAccountTitle': 'Hesabınız silinsin?',
  'settings.deleteAccountWarning':
    'Hesabınız və bütün səyahətləriniz, məkanlarınız və fayllarınız həmişəlik silinəcək. Bu əməliyyatı geri qaytarmaq mümkün deyil.',
  'settings.deleteAccountConfirm': 'Həmişəlik sil',
  'settings.deleteBlockedTitle': 'Silmək mümkün deyil',
  'settings.deleteBlockedMessage':
    'Siz yeganə administratorsunuz. Hesabınızı silməzdən əvvəl başqa istifadəçini administrator edin.',
  'settings.roleUser': 'İstifadəçi',
  'settings.saveProfile': 'Profili yadda saxla',

  'settings.toast.mapSaved': 'Xəritə tənzimləmələri yadda saxlanıldı',
  'settings.toast.keysSaved': 'API açarları yadda saxlanıldı',
  'settings.toast.displaySaved': 'Görünüş tənzimləmələri yadda saxlanıldı',
  'settings.toast.profileSaved': 'Profil yadda saxlanıldı',

  'settings.uploadAvatar': 'Profil şəkli yüklə',
  'settings.removeAvatar': 'Profil şəklini sil',
  'settings.avatarUploaded': 'Profil şəkli yeniləndi',
  'settings.avatarRemoved': 'Profil şəkli silindi',
  'settings.avatarError': 'Yükləmə uğursuz oldu',
  'settings.avatarRemoveError': 'Silmək mümkün olmadı',

  'settings.mfa.title': 'İki mərhələli autentifikasiya (2FA)',
  'settings.mfa.description':
    'E-poçt və parolla daxil olarkən ikinci təhlükəsizlik mərhələsi əlavə edir. Autentifikator tətbiqindən istifadə edin (Google Authenticator, Authy və s.).',
  'settings.mfa.requiredByPolicy':
    'Administratorunuz iki mərhələli autentifikasiya tələb edir. Davam etməzdən əvvəl aşağıda autentifikator tətbiqini quraşdırın.',
  'settings.mfa.backupTitle': 'Ehtiyat kodları',
  'settings.mfa.backupDescription':
    'Autentifikator tətbiqinə girişinizi itirsəniz, bu birdəfəlik ehtiyat kodlarından istifadə edin.',
  'settings.mfa.backupWarning':
    'Bu kodları indi yadda saxlayın. Hər kod yalnız bir dəfə istifadə edilə bilər.',
  'settings.mfa.backupCopy': 'Kodları kopyala',
  'settings.mfa.backupDownload': 'TXT endir',
  'settings.mfa.backupPrint': 'Çap / PDF',
  'settings.mfa.backupCopied': 'Ehtiyat kodları kopyalandı',
  'settings.mfa.enabled': 'Hesabınızda 2FA aktivdir.',
  'settings.mfa.disabled': '2FA aktiv deyil.',
  'settings.mfa.setup': 'Autentifikatoru quraşdır',
  'settings.mfa.scanQr':
    'Bu QR kodu tətbiqinizlə skan edin və ya gizli açarı əl ilə daxil edin.',
  'settings.mfa.secretLabel': 'Gizli açar (əl ilə daxil etmə)',
  'settings.mfa.codePlaceholder': '6 rəqəmli kod',
  'settings.mfa.enable': '2FA-nı aktivləşdir',
  'settings.mfa.cancelSetup': 'Ləğv et',
  'settings.mfa.disableTitle': '2FA-nı deaktiv et',
  'settings.mfa.disableHint':
    'Hesab parolunuzu və autentifikatorunuzdakı cari kodu daxil edin.',
  'settings.mfa.disable': '2FA-nı deaktiv et',
  'settings.mfa.toastEnabled':
    'İki mərhələli autentifikasiya aktivləşdirildi',
  'settings.mfa.toastDisabled':
    'İki mərhələli autentifikasiya deaktiv edildi',
  'settings.mfa.demoBlocked': 'Demo rejimində əlçatan deyil',

  'settings.currency': 'Göstərilən valyuta',
  'settings.currencyHint':
    'Xərclər bölməsindəki məbləğlər yalnız göstərilmək üçün bu valyutaya çevrilir — ilkin məbləğlər dəyişmir.',
  'settings.currencyTrip': 'Səyahət valyutası',

  'settings.passkey.title': 'Keçid açarları',
  'settings.passkey.description':
    'Keçid açarı ilə daha sürətli və fişinqə davamlı şəkildə daxil olun — barmaq izi, üz, PIN və ya fiziki təhlükəsizlik açarından istifadə edin. Parolunuz ehtiyat giriş üsulu kimi qalır.',
  'settings.passkey.notConfigured':
    'Keçid açarları aktivdir, lakin bu serverdə hələ tam konfiqurasiya edilməyib. Administratorunuzdan WebAuthn domenini təyin etməsini istəyin.',
  'settings.passkey.add': 'Keçid açarı əlavə et',
  'settings.passkey.addTitle': 'Keçid açarı əlavə et',
  'settings.passkey.passwordPrompt':
    'Cari parolunuzu təsdiqləyin, sonra cihazınızdakı göstərişləri izləyin.',
  'settings.passkey.passwordRequired': 'Cari parolunuz tələb olunur.',
  'settings.passkey.namePlaceholder':
    'Ad (istəyə bağlı, məsələn, “iPhone”)',
  'settings.passkey.addedToast': 'Keçid açarı əlavə edildi',
  'settings.passkey.added': 'Əlavə edilib',
  'settings.passkey.addError': 'Keçid açarını əlavə etmək mümkün olmadı',
  'settings.passkey.cancelled': 'Keçid açarının quraşdırılması ləğv edildi',
  'settings.passkey.deleted': 'Keçid açarı silindi',
  'settings.passkey.deleteConfirm':
    'Bu keçid açarı silinsin? Parolunuzla təsdiqləyin.',
  'settings.passkey.rename': 'Adını dəyiş',
  'settings.passkey.defaultName': 'Keçid açarı',
  'settings.passkey.synced': 'Sinxronlaşdırılıb',
  'settings.passkey.deviceBound': 'Bu cihaz',
  'settings.passkey.lastUsed': 'Son istifadə',
  'settings.passkey.neverUsed': 'Heç vaxt istifadə edilməyib',

  'settings.airtrail.title': 'AirTrail',
  'settings.airtrail.hint':
    'Uçuşları idxal və sinxronlaşdırmaq üçün AirTrail instansiyanızı qoşun. AirTrail-də Tənzimləmələr → Təhlükəsizlik bölməsindən API açarı yaradın.',
  'settings.airtrail.url': 'İnstansiya URL-i',
  'settings.airtrail.apiKey': 'API açarı',
  'settings.airtrail.apiKeyPlaceholder': 'Bearer API açarı',
  'settings.airtrail.apiKeyHint':
    'AirTrail-də Tənzimləmələr → Təhlükəsizlik bölməsindən yaradılır. Şifrələnmiş şəkildə saxlanılır.',
  'settings.airtrail.allowInsecureTls':
    'Öz-özünə imzalanmış sertifikatlara icazə ver',
  'settings.airtrail.allowInsecureTlsHint':
    'Yalnız öz şəbəkənizdəki etibarlı instansiya üçün aktivləşdirin.',
  'settings.airtrail.writeBack': 'Dəyişiklikləri AirTrail-ə geri yaz',
  'settings.airtrail.writeBackHint':
    'Standart olaraq deaktivdir: AirTrail əsas məlumat mənbəyidir və TREK ondan yalnız oxuyur. TREK-də edilən dəyişiklikləri AirTrail-ə göndərmək üçün aktivləşdirin.',
  'settings.airtrail.connected': 'Qoşulub',
  'settings.airtrail.notConnected': 'Qoşulmayıb',
  'settings.airtrail.toast.saved': 'AirTrail bağlantısı yadda saxlanıldı',
  'settings.airtrail.toast.saveError':
    'Bağlantını yadda saxlamaq mümkün olmadı',
  'settings.airtrail.test.button': 'Bağlantını yoxla',
  'settings.airtrail.test.success':
    'Qoşuldu — {count} uçuş tapıldı',
  'settings.airtrail.test.failed': 'Bağlantı uğursuz oldu',

  'settings.aiParsing.title': 'AI ilə təhlil',
  'settings.aiParsing.hint':
    'Yüklənmiş fayllardan rezervasiyaları çıxarmaq üçün istifadə edilən AI modelini seçin. Bu, yalnız administratorunuz bütün instansiya üçün model konfiqurasiya etmədikdə tətbiq olunur.',
  'settings.aiParsing.provider': 'Provayder',
  'settings.aiParsing.providerLocal': 'Lokal (Ollama)',
  'settings.aiParsing.providerOpenai': 'OpenAI',
  'settings.aiParsing.providerAnthropic': 'Anthropic',
  'settings.aiParsing.localAdminOnly':
    'Lokal Ollama son nöqtəsi administrator tənzimləmələrində bütün instansiya üçün bir dəfə quraşdırılır. Burada öz OpenAI və ya Anthropic açarınızdan istifadə edə bilərsiniz.',
  'settings.aiParsing.model': 'Model',
  'settings.aiParsing.baseUrl': 'Əsas URL',
  'settings.aiParsing.baseUrlHint':
    'Modelin işlədiyi yer — lokal Ollama serveri və ya OpenAI ilə uyğun son nöqtə.',
  'settings.aiParsing.apiKey': 'API açarı',
  'settings.aiParsing.apiKeyHint':
    'Şifrələnmiş şəkildə saxlanılır. Cari açarı saxlamaq üçün boş buraxın.',
  'settings.aiParsing.multimodal': 'Model şəkilləri oxuyur',
  'settings.aiParsing.multimodalHint':
    'Şəkilləri oxuyan model üçün aç: onda foto idxal oluna və ya skan edilə bilər.',
  'settings.aiParsing.toast.saved': 'AI tənzimləmələri yadda saxlanıldı',
  'settings.aiParsing.toast.saveError':
    'AI tənzimləmələrini yadda saxlamaq mümkün olmadı',

  'settings.tabs.appearance': 'Görünüş',
  'settings.appearance.theme': 'Tema',
  'settings.appearance.scheme': 'Rəng sxemi',
  'settings.appearance.scheme.default': 'Standart',
  'settings.appearance.scheme.highContrast': 'Yüksək kontrast',
  'settings.appearance.scheme.indigo': 'İndiqo',
  'settings.appearance.scheme.teal': 'Mavi-yaşıl',
  'settings.appearance.scheme.rose': 'Qızılgül',
  'settings.appearance.scheme.amber': 'Kəhrəba',
  'settings.appearance.scheme.violet': 'Bənövşəyi',
  'settings.appearance.scheme.custom': 'Fərdi',
  'settings.appearance.customAccent': 'Fərdi vurğu rəngi',
  'settings.appearance.contrastOk': 'Yaxşı kontrast',
  'settings.appearance.contrastLow': 'Aşağı kontrast',
  'settings.appearance.readability': 'Oxunaqlılıq',
  'settings.appearance.transparency': 'Şəffaflıq',
  'settings.appearance.transparencyHint':
    'Şüşəyə bənzər yarımşəffaf səthlər. Bütöv və daha yüksək kontrastlı fonlar üçün deaktiv edin.',
  'settings.appearance.reduceMotion': 'Hərəkəti azalt',
  'settings.appearance.reduceMotionHint':
    'Animasiyaları və keçidləri minimuma endirin.',
  'settings.appearance.density': 'Sıxlıq',
  'settings.appearance.comfortable': 'Rahat',
  'settings.appearance.compact': 'Yığcam',
  'settings.appearance.textSize': 'Mətn ölçüsü',
  'settings.appearance.advancedTextSizes': 'Ətraflı mətn ölçüləri',
  'settings.appearance.hideAdvanced': 'Ətraflı seçimləri gizlət',
  'settings.appearance.tier.title': 'Başlıqlar',
  'settings.appearance.tier.subtitle': 'Altbaşlıqlar',
  'settings.appearance.tier.body': 'Əsas mətn',
  'settings.appearance.tier.caption': 'Kiçik yazılar',

  'settings.appearance.dashboardWidgets': 'İdarə paneli vidcetləri',
  'settings.appearance.dashboardWidgetsHint':
    'İdarə paneli vidcetlərini kompüter və mobil cihazlarda ayrıca göstərin və ya gizlədin.',
  'settings.appearance.desktop': 'Kompüter',
  'settings.appearance.mobile': 'Mobil',
  'settings.appearance.widget.sidebar': 'Sağ yan panel',
  'settings.appearance.widget.currency': 'Valyuta',
  'settings.appearance.widget.collections': 'Kolleksiyalar',
  'settings.appearance.widget.timezones': 'Saat qurşaqları',
  'settings.appearance.widget.upcomingReservations':
    'Qarşıdan gələn rezervasiyalar',
  'settings.appearance.widget.atlas': 'Atlas / ölkələr',
  'settings.appearance.widget.tripsTotal': 'Ümumi səyahətlər',
  'settings.appearance.widget.daysTraveled': 'Səyahət edilən günlər',
  'settings.appearance.widget.distanceFlown': 'Uçuş məsafəsi',
  'settings.appearance.reset': 'Standartlara sıfırla',
  'settings.appearance.group.belowHero': 'Əsas blokun altında',
  'settings.appearance.group.bottomOfPage': 'Səhifənin aşağısında',
  'settings.appearance.sidebarHint':
    'Bütün sağ sütun. Deaktiv etdikdə idarə paneli mərkəzə çəkilir.',
  'settings.appearance.densityHint':
    'Yığcam rejim ekrana daha çox məlumat sığdırmaq üçün aralıqları və daxili boşluqları azaldır.',
  'settings.appearance.textSizeAll': 'Hər şey',
  'settings.appearance.perSize': 'Hər ölçünü ayrıca tənzimlə',
  'settings.appearance.size.large': 'Böyük',
  'settings.appearance.size.medium': 'Orta',
  'settings.appearance.size.normal': 'Normal',
  'settings.appearance.size.small': 'Kiçik',

  'settings.appearance.preview.large': 'Böyük başlıq',
  'settings.appearance.preview.medium': 'Orta altbaşlıq',
  'settings.appearance.preview.normal': 'Normal əsas mətn',
  'settings.appearance.preview.small': 'Kiçik yazı / ünvan',
  'settings.appearance.example.large': 'Başlıqlar, böyük rəqəmlər',
  'settings.appearance.example.medium': 'Altbaşlıqlar',
  'settings.appearance.example.normal': 'Məkan adları, təsvirlər',
  'settings.appearance.example.small': 'Ünvanlar, etiketlər',

  'settings.appearance.experimental': 'Eksperimental',
  'settings.appearance.mobileNav': 'Aşağı naviqasiya paneli',
  'settings.appearance.mobileNav.hint':
    'Paneldə hansı elementlərin görünəcəyini və hansılarının “Daha çox” altında yerləşəcəyini seçin. İdarə paneli həmişə birinci qalır.',
  'settings.appearance.mobileNav.inBar': 'Paneldə',
  'settings.appearance.mobileNav.underMore': '“Daha çox” altında',
  'settings.appearance.mobileNav.moreEmpty':
    'Burada hələ heç nə yoxdur — bütün elementlər panelə sığır.',
  'settings.appearance.mobileNav.pinned': 'Bərkidilib',
  'settings.appearance.mobileNav.toMore': '“Daha çox” altına daşı',
  'settings.appearance.mobileNav.toBar': 'Panelə daşı',

  'settings.appearance.dashOrder': 'İdarə panelinin sırası',
  'settings.appearance.dashOrder.hint':
    'Telefonun idarə panelində səyahət siyahısı və vidcetlərin düzülüş sırasını dəyişin. Seçilmiş səyahət həmişə yuxarıda qalır.',
  'settings.appearance.dashOrder.trips': 'Səyahətlər',
  'settings.appearance.dashOrder.hidden': 'Gizlədilib',

  'settings.general.languageRegion': 'Dil və region',
  'settings.general.travelMap': 'Səyahət və xəritə',
  'settings.general.startup': 'Başlanğıc',
  'settings.startPage': 'Başlanğıc səhifəsi',
  'settings.startPageDashboard': 'İdarə paneli',
  'settings.startPageActiveTrip': 'Aktiv səyahət',
  'settings.startPageHint':
    'TREK birbaşa bu gün davam edən və ya qarşıdan gələn növbəti səyahəti açır. Bu, idarə panelində önə çıxarılan səyahətlə eynidir.',
  'settings.startTripTab': 'Başlanğıc tabı',
  'settings.startTripTabHint':
    'Səyahət açıldıqda göstərilən tab. Deaktiv etdiyiniz əlavəyə aiddirsə, əvəzində plan görünüşü açılır.',

  // ── Offline (#1135) ────────────────────────────────────────────────────────
  'settings.offline.cache.title': 'Oflayn keş',
  'settings.offline.mode.title': 'Oflayn rejim',
  'settings.offline.mode.force': 'Oflayn rejimi məcburi aktivləşdir',
  'settings.offline.mode.forceHint':
    'Yalnız keşlənmiş məlumatlarla işləyin və dəyişikliklərinizi növbəyə əlavə edin. Yenidən qoşulmaq və sinxronlaşdırmaq üçün deaktiv edin.',
  'settings.offline.mode.active':
    'Oflayn rejim aktivdir — dəyişiklikləriniz növbəyə əlavə edilib və rejimi deaktiv etdikdə sinxronlaşdırılacaq.',

  'settings.offline.prepare.title': 'Oflayn istifadə üçün hazırla',
  'settings.offline.prepare.hint':
    'Bağlantını itirməzdən əvvəl lazım olan hər şeyi — səyahət məlumatlarını, sənədləri və xəritə plitələrini — endirin.',
  'settings.offline.prepare.button': 'Oflayn istifadə üçün endir',
  'settings.offline.prepare.running': 'Endirilir…',
  'settings.offline.prepare.done': 'Oflayn istifadə üçün hazırdır',
  'settings.offline.prepare.phase.trips': 'Səyahət məlumatları',
  'settings.offline.prepare.phase.files': 'Sənədlər',
  'settings.offline.prepare.phase.tiles': 'Xəritə plitələri',

  'settings.offline.resync': 'İndi yenidən sinxronlaşdır',
  'settings.offline.resyncing': 'Sinxronlaşdırılır…',
  'settings.offline.storage.title': 'Oflayn saxlanılacaq məlumatlar',
  'settings.offline.storage.tiles': 'Xəritə plitələrini oflayn saxla',
  'settings.offline.storage.tilesHint':
    'Xəritə plitələri ən çox yaddaş istifadə edir. Yalnız səyahət məlumatları və sənədləri oflayn saxlamaq üçün bunu deaktiv edin.',
  'settings.offline.storage.tripsTitle': 'Səyahətlər',
  'settings.offline.storage.tripOn': 'Oflayn saxlanılır',
  'settings.offline.storage.tripOff': 'Saxlanılmır',
  'settings.offline.storage.tripFinished':
    'Bitib. Yalnız aktivləşdirsəniz oflayn saxlanılacaq.',

  'settings.offline.notice.stored':
    'Bu cihazda {count} səyahət saxlanıldı',
  'settings.offline.notice.nothing':
    'Saxlanılacaq heç nə yoxdur. Saxlamaq istədiyiniz səyahətləri aktivləşdirin.',
  'settings.offline.notice.busy':
    'Sinxronlaşdırma artıq davam edir. Bir az sonra yenidən cəhd edin.',
  'settings.offline.notice.offline':
    'Bağlantı yoxdur. Səyahətləri oflayn istifadə üçün saxlamaq məqsədilə internetə qoşulun.',
  'settings.offline.notice.signedOut':
    'Sessiyanız başa çatıb. Sinxronlaşdırmaq üçün yenidən daxil olun.',
  'settings.offline.notice.failed':
    'Endirməni tamamlamaq mümkün olmadı. Bağlantınızı yoxlayıb yenidən cəhd edin.',
  'settings.offline.notice.loadFailed':
    'Bu cihazın oflayn yaddaşını oxumaq mümkün olmadı. Keşi təmizləmək adətən problemi həll edir.',

  'settings.offline.clear': 'Keşi təmizlə',
  'settings.offline.clearConfirm':
    'Bütün oflayn səyahət məlumatları təmizlənsin? İnternetə qoşulduqda istənilən vaxt yenidən sinxronlaşdıra bilərsiniz.',
  'settings.offline.stats.trips': 'Keşlənmiş səyahətlər',
  'settings.offline.stats.pending': 'Gözləyən dəyişikliklər',
  'settings.offline.stats.failed': 'Uğursuz dəyişikliklər',
  'settings.offline.stats.conflicts': 'Ziddiyyətlər',
  'settings.offline.empty':
    'Hələ heç bir səyahət keşlənməyib. Sinxronlaşdırmaq üçün internetə qoşulun.',
  'settings.offline.loading': 'Yüklənir…',

  'settings.offline.conflicts.title': 'Sinxronlaşdırma ziddiyyətləri',
  'settings.offline.conflicts.hint':
    'Oflayn etdiyiniz dəyişikliklər serverdəki daha yeni dəyişikliklərlə ziddiyyət təşkil edir. Saxlanılacaq versiyanı seçin.',
  'settings.offline.conflicts.keepMine': 'Mənim versiyamı saxla',
  'settings.offline.conflicts.keepServer': 'Server versiyasını saxla',
  'settings.offline.conflicts.mine': 'Sizin versiyanız',
  'settings.offline.conflicts.server': 'Server versiyası',
  'settings.offline.conflicts.item': '“{name}” üçün dəyişiklik',
  'settings.offline.conflicts.strategyTitle': 'Ziddiyyət yarandıqda',
  'settings.offline.conflicts.strategy.ask': 'Hər dəfə məndən soruş',
  'settings.offline.conflicts.strategy.mine':
    'Həmişə mənim versiyamı saxla',
  'settings.offline.conflicts.strategy.server':
    'Həmişə server versiyasını saxla',

  'settings.offline.banner.offline': 'Oflayn',
  'settings.offline.banner.forced': 'Oflayn rejim',
  'settings.offline.banner.queued': 'Oflayn · növbədə {count}',
  'settings.offline.banner.syncing': '{count} sinxronlaşdırılır…',
  'settings.offline.banner.failed':
    'Sinxronlaşdırmaq mümkün olmadı: {count}',
  'settings.offline.banner.conflicts': 'Ziddiyyətlər: {count}',

  'settings.alwaysShowRoutes':
    'Rezervasiya marşrutlarını həmişə göstər',
  'settings.alwaysShowRoutesHint':
    'Hər uçuş, qatar və digər rezervasiyanın marşrutunu xəritədə avtomatik göstərin — hər biri üçün ayrıca aktivləşdirməyə ehtiyac yoxdur.',

  // Public API keys (Settings -> Integrations)
  // ── API keys: what a key may read ─────────────────────────────────────────
  'settings.apiScopes.title': 'Bu açarın oxuya biləcəyi məlumatlar',
  'settings.apiScopes.hint':
    'Bütün məlumatları görməli olan açar üçün hər şeyi aktiv saxlayın. Deaktiv etdiyiniz məlumat sadəcə cavabdan çıxarılmır, bu açar üçün tamamilə qadağan edilir.',
  'settings.apiScopes.all': 'Hər şey',
  'settings.apiScopes.noneSelected':
    'Ən azı bir sahə seçin, əks halda açar heç bir məlumatı oxuya bilməyəcək.',
  'settings.apiScopes.limited': '{total} sahədən {count}',
  'settings.apiScopes.trips': 'Səyahətlər',
  'settings.apiScopes.days': 'Günlər',
  'settings.apiScopes.places': 'Məkanlar',
  'settings.apiScopes.notes': 'Günlük qeydlər',
  'settings.apiScopes.reservations': 'Rezervasiyalar',
  'settings.apiScopes.accommodations': 'Yaşayış yerləri',
  'settings.apiScopes.travellers': 'İştirak edənlər',
  'settings.apiScopes.bucket-list': 'Arzular siyahısı',
  'settings.apiScopes.stats': 'Ümumi göstəricilər',

  'settings.apiKeys.title': 'API açarları',
  'settings.apiKeys.description':
    'Digər proqramların səyahətlərinizi oxuya bilməsi üçün ictimai API açarları. Yalnız oxuma: açar heç nəyi dəyişdirə və ya silə bilməz.',
  'settings.apiKeys.create': 'Açar yarat',
  'settings.apiKeys.empty':
    'Hələ açar yoxdur. Digər proqramı qoşmaq üçün açar yaradın.',
  'settings.apiKeys.createdAt': 'yaradılıb',
  'settings.apiKeys.usedAt': 'son istifadə',
  'settings.apiKeys.deleteTitle': 'Açarı sil',
  'settings.apiKeys.deleteMessage':
    'Bu açardan istifadə edən hər şey dərhal işləməyi dayandıracaq. Bu əməliyyatı geri qaytarmaq mümkün deyil.',
  'settings.apiKeys.deleted': 'Açar silindi',
  'settings.apiKeys.deleteFailed': 'Açarı silmək mümkün olmadı',
  'settings.apiKeys.createFailed': 'Açar yaratmaq mümkün olmadı',
  'settings.apiKeys.copy': 'Kopyala',
  'settings.apiKeys.docsHint':
    'Açarı /api/v1 ünvanına “Authorization: Bearer ...” və ya “X-API-Key: ...” kimi göndərin.',
  'settings.apiKeys.endpoint': 'Son nöqtə',
  'settings.apiKeys.neverUsed': 'heç vaxt istifadə edilməyib',
  'settings.apiKeys.loadFailed':
    'Açarlarınızı yükləmək mümkün olmadı. Yenidən sınamaq üçün səhifəni yeniləyin.',
  'settings.apiKeys.limitReached':
    'Hesab üçün maksimum say olan {max} açarınız var. Yeni açar yaratmaq üçün artıq istifadə etmədiyiniz açarlardan birini silin.',
  'settings.apiKeys.copyFailed':
    'Kopyalamaq mümkün olmadı. Mətni seçərək əl ilə kopyalayın.',

  'settings.apiKeys.modal.createTitle': 'API açarı yarat',
  'settings.apiKeys.modal.name': 'Ad',
  'settings.apiKeys.modal.namePlaceholder': 'məs. Dawarich',
  'settings.apiKeys.modal.nameHint':
    'Açarı daha sonra tanımağınız üçün yalnız sizə görünən ad.',
  'settings.apiKeys.modal.creating': 'Yaradılır...',
  'settings.apiKeys.modal.create': 'Yarat',
  'settings.apiKeys.modal.createdTitle': 'API açarı yaradıldı',
  'settings.apiKeys.modal.createdWarning':
    'Açarı indi kopyalayın. O, yalnız bir dəfə göstərilir və sonradan bərpa edilə bilməz.',
  'settings.apiKeys.modal.done': 'Hazır',
};

export default settings;