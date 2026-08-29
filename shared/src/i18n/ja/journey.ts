import type { TranslationStrings } from '../types';

const journey: TranslationStrings = {
  'journey.search.placeholder': '日記を検索…',
  'journey.search.noResults': '「{query}」に一致する日記はありません',
  'journey.title': '日記',
  'journey.subtitle': '旅の記録をリアルタイムで残そう',
  'journey.new': '新しい日記',
  'journey.create': '作成',
  'journey.titlePlaceholder': 'どこへ行きますか？',
  'journey.empty': '日記はまだありません',
  'journey.emptyHint': '次の旅を記録してみましょう',
  'journey.deleted': '日記を削除しました',
  'journey.createError': '日記を作成できませんでした',
  'journey.deleteError': '日記を削除できませんでした',
  'journey.deleteConfirmTitle': '削除',
  'journey.deleteConfirmMessage': '「{title}」を削除しますか？元に戻せません。',
  'journey.deleteConfirmGeneric': '本当に削除しますか？',
  'journey.notFound': '日記が見つかりません',
  'journey.photos': '写真',
  'journey.timelineEmpty': 'まだ立ち寄りがありません',
  'journey.timelineEmptyHint': 'チェックインするか、日記を書いて始めましょう',
  'journey.status.draft': '下書き',
  'journey.status.active': '進行中',
  'journey.status.completed': '完了',
  'journey.status.upcoming': '予定',
  'journey.status.archived': 'アーカイブ',
  'journey.checkin.add': 'チェックイン',
  'journey.checkin.namePlaceholder': '場所名',
  'journey.checkin.notesPlaceholder': 'メモ（任意）',
  'journey.checkin.save': '保存',
  'journey.checkin.error': 'チェックインを保存できませんでした',
  'journey.entry.add': '日記',
  'journey.entry.edit': '編集',
  'journey.entry.titlePlaceholder': 'タイトル（任意）',
  'journey.entry.bodyPlaceholder': '今日は何がありましたか？',
  'journey.entry.save': '保存',
  'journey.entry.error': '日記を保存できませんでした',
  'journey.photo.add': '写真',
  'journey.photo.uploadError': 'アップロードに失敗しました',
  'journey.share.share': '共有',
  'journey.share.public': '公開',
  'journey.share.linkCopied': '公開リンクをコピーしました',
  'journey.share.disabled': '公開共有は無効です',
  'journey.editor.titlePlaceholder': 'この瞬間に名前をつけて…',
  'journey.editor.bodyPlaceholder': 'この日のストーリーを書いてみよう…',
  'journey.editor.placePlaceholder': '場所（任意）',
  'journey.editor.tagsPlaceholder': 'タグ：穴場、最高の食事、また行きたい…',
  'journey.visibility.private': '非公開',
  'journey.visibility.shared': '共有',
  'journey.visibility.public': '公開',
  'journey.emptyState.title': 'ここから物語が始まります',
  'journey.emptyState.subtitle': '場所にチェックインするか、最初の日記を書いてみましょう',
  'journey.frontpage.subtitle': '旅を、忘れられない物語に',
  'journey.frontpage.createJourney': '日記を作成',
  'journey.frontpage.activeJourney': '進行中の日記',
  'journey.frontpage.latestJourney': '最新の日記',
  'journey.frontpage.allJourneys': 'すべての日記',
  'journey.frontpage.journeys': '日記',
  'journey.frontpage.createNew': '新しい日記を作成',
  'journey.frontpage.createNewSub': '旅を選んで、物語を書き、共有しよう',
  'journey.frontpage.live': 'ライブ',
  'journey.frontpage.synced': '同期済み',
  'journey.frontpage.continueWriting': '続けて書く',
  'journey.frontpage.updated': '{time}に更新',
  'journey.frontpage.suggestionLabel': '旅行が終了しました',
  'journey.frontpage.suggestionText': '<strong>{title}</strong>を日記にしよう',
  'journey.frontpage.dismiss': '閉じる',
  'journey.frontpage.journeyName': '日記名',
  'journey.frontpage.namePlaceholder': '例：東南アジア 2026',
  'journey.frontpage.selectTrips': '旅行を選択',
  'journey.frontpage.tripsSelected': '件選択',
  'journey.frontpage.trips': '旅行',
  'journey.frontpage.placesImported': '場所がインポートされます',
  'journey.frontpage.places': '場所',
  'journey.detail.backToJourney': '日記に戻る',
  'journey.detail.syncedWithTrips': '旅行と同期済み',
  'journey.detail.addEntry': 'エントリーを追加',
  'journey.detail.jumpToTop': '先頭へ戻る',
  'journey.detail.jumpToLast': '最後の記録へ',
  'journey.detail.newEntry': '新しいエントリー',
  'journey.detail.editEntry': 'エントリーを編集',
  'journey.detail.noEntries': 'エントリーはまだありません',
  'journey.detail.noEntriesHint': '旅行を追加して下書きエントリーを作成しましょう',
  'journey.detail.noPhotos': '写真はまだありません',
  'journey.detail.noPhotosHint': 'エントリーに写真を追加するか、Immich/Synologyライブラリを表示',
  'journey.detail.journeyTab': '日記',
  'journey.detail.journeyStats': '統計',
  'journey.detail.syncedTrips': '同期中の旅行',
  'journey.detail.noTripsLinked': 'リンクされた旅行はありません',
  'journey.detail.contributors': '参加者',
  'journey.detail.readMore': 'もっと見る',
  'journey.detail.prosCons': '良かった点・気になった点',
  'journey.detail.photos': '写真',
  'journey.detail.day': '{number}日目',
  'journey.detail.places': '場所',
  'journey.stats.days': '日数',
  'journey.stats.cities': '都市',
  'journey.stats.entries': 'エントリー',
  'journey.stats.photos': '写真',
  'journey.stats.places': '場所',
  'journey.skeletons.show': '提案を表示',
  'journey.skeletons.hide': '提案を非表示',
  'journey.verdict.lovedIt': '最高だった',
  'journey.verdict.couldBeBetter': '改善の余地あり',
  'journey.synced.places': '場所',
  'journey.synced.synced': '同期済み',
  'journey.editor.discardChangesConfirm': '未保存の変更があります。破棄しますか？',
  'journey.editor.uploadPhotos': '写真をアップロード',
  'journey.editor.uploading': 'アップロード中…',
  'journey.editor.fromGallery': 'ギャラリーから',
  'journey.editor.allPhotosAdded': 'すべての写真は追加済みです',
  'journey.editor.writeStory': 'ストーリーを書く…',
  'journey.editor.prosCons': '良かった点・気になった点',
  'journey.editor.pros': '良かった点',
  'journey.editor.cons': '気になった点',
  'journey.editor.proPlaceholder': '良かったこと…',
  'journey.editor.conPlaceholder': 'いまいちだったこと…',
  'journey.editor.addAnother': '追加',
  'journey.editor.date': '日付',
  'journey.editor.location': '場所',
  'journey.editor.searchLocation': '場所を検索…',
  'journey.editor.mood': '気分',
  'journey.editor.weather': '天気',
  'journey.editor.photoFirst': '1番目',
  'journey.editor.makeFirst': '1番目にする',
  'journey.editor.searching': '検索中…',
  'journey.editor.useCurrentLocation': '現在地を使用',
  'journey.editor.locationPermissionDenied':
    '位置情報へのアクセスが拒否されました。ブラウザの設定で許可して再試行してください。',
  'journey.editor.locationTimeout': '位置情報の取得がタイムアウトしました。もう一度お試しください。',
  'journey.editor.locationUnavailable': '現在地を特定できませんでした。',
  'journey.editor.locationInsecureContext': '位置情報には安全な接続（HTTPS）が必要です。',
  'journey.mood.amazing': '最高',
  'journey.mood.good': '良い',
  'journey.mood.neutral': '普通',
  'journey.mood.rough': '大変',
  'journey.weather.sunny': '晴れ',
  'journey.weather.partly': '晴れ時々くもり',
  'journey.weather.cloudy': 'くもり',
  'journey.weather.rainy': '雨',
  'journey.weather.stormy': '嵐',
  'journey.weather.cold': '雪',
  'journey.trips.linkTrip': '旅行をリンク',
  'journey.trips.searchTrip': '旅行を検索',
  'journey.trips.searchPlaceholder': '旅行名または目的地…',
  'journey.trips.noTripsAvailable': '利用できる旅行がありません',
  'journey.trips.link': 'リンク',
  'journey.trips.tripLinked': '旅行をリンクしました',
  'journey.trips.linkFailed': 'リンクに失敗しました',
  'journey.trips.addTrip': '旅行を追加',
  'journey.trips.unlinkTrip': 'リンク解除',
  'journey.trips.unlinkMessage':
    '「{title}」のリンクを解除しますか？この旅行から同期されたエントリーと写真はすべて完全に削除されます。元に戻せません。',
  'journey.trips.unlink': '解除',
  'journey.trips.tripUnlinked': 'リンクを解除しました',
  'journey.trips.unlinkFailed': '解除に失敗しました',
  'journey.trips.noTripsLinkedSettings': 'リンクされた旅行はありません',
  'journey.contributors.invite': '参加者を招待',
  'journey.contributors.searchUser': 'ユーザーを検索',
  'journey.contributors.searchPlaceholder': 'ユーザー名またはメール…',
  'journey.contributors.noUsers': 'ユーザーが見つかりません',
  'journey.contributors.role': '役割',
  'journey.contributors.added': '参加者を追加しました',
  'journey.contributors.addFailed': '追加に失敗しました',
  'journey.contributors.remove': '参加者を削除',
  'journey.contributors.removeConfirm': '{username}をこの日記から削除しますか？',
  'journey.contributors.removed': '参加者を削除しました',
  'journey.contributors.removeFailed': '削除に失敗しました',
  'journey.share.publicShare': '公開共有',
  'journey.share.createLink': '共有リンクを作成',
  'journey.share.linkCreated': '共有リンクを作成しました',
  'journey.share.createFailed': 'リンク作成に失敗しました',
  'journey.share.copy': 'コピー',
  'journey.share.copied': 'コピーしました！',
  'journey.share.timeline': 'タイムライン',
  'journey.share.gallery': 'ギャラリー',
  'journey.share.map': 'マップ',
  'journey.share.removeLink': '共有リンクを削除',
  'journey.share.linkDeleted': '共有リンクを削除しました',
  'journey.share.deleteFailed': '削除に失敗しました',
  'journey.share.updateFailed': '更新に失敗しました',
  'journey.invite.role': '役割',
  'journey.invite.viewer': '閲覧者',
  'journey.invite.editor': '編集者',
  'journey.invite.invite': '招待',
  'journey.invite.inviting': '招待中…',
  'journey.settings.title': '日記設定',
  'journey.settings.coverImage': 'カバー画像',
  'journey.settings.changeCover': 'カバーを変更',
  'journey.settings.addCover': 'カバー画像を追加',
  'journey.settings.name': '名前',
  'journey.settings.subtitle': 'サブタイトル',
  'journey.settings.subtitlePlaceholder': '例：タイ・ベトナム・カンボジア',
  'journey.settings.endJourney': '日記をアーカイブ',
  'journey.settings.reopenJourney': '日記を復元',
  'journey.settings.archived': '日記をアーカイブしました',
  'journey.settings.reopened': '日記を復元しました',
  'journey.settings.endDescription': 'Liveバッジを非表示にします。いつでも再開できます。',
  'journey.settings.delete': '削除',
  'journey.settings.deleteJourney': '日記を削除',
  'journey.settings.deleteMessage': '「{title}」を削除しますか？すべてのエントリーと写真が失われます。',
  'journey.settings.saved': '設定を保存しました',
  'journey.settings.saveFailed': '保存に失敗しました',
  'journey.settings.coverUpdated': 'カバーを更新しました',
  'journey.settings.coverFailed': 'アップロードに失敗しました',
  'journey.settings.failedToDelete': '削除に失敗しました',
  'journey.entries.deleteTitle': 'エントリーを削除',
  'journey.photosUploaded': '{count}枚の写真をアップロード',
  'journey.photosAdded': '{count}枚の写真を追加',
  'journey.public.notFound': '見つかりません',
  'journey.public.notFoundMessage': 'この日記は存在しないか、リンクの有効期限が切れています。',
  'journey.public.readOnly': '閲覧のみ · 公開日記',
  'journey.public.tagline': '旅の記録＆探索キット',
  'journey.public.sharedVia': '共有元',
  'journey.public.madeWith': '作成：',
  'journey.pdf.journeyBook': '日記ブック',
  'journey.pdf.madeWith': 'Made with TREK',
  'journey.pdf.day': '日目',
  'journey.pdf.theEnd': 'おわり',
  'journey.pdf.saveAsPdf': 'PDFとして保存',
  'journey.pdf.pages': 'ページ',
  'journey.picker.tripPeriod': '旅行期間',
  'journey.picker.dateRange': '日付範囲',
  'journey.picker.allPhotos': 'すべての写真',
  'journey.picker.albums': 'アルバム',
  'journey.picker.selected': '選択中',
  'journey.picker.addTo': '追加先',
  'journey.picker.newGallery': '新しいギャラリー',
  'journey.picker.selectAll': 'すべて選択',
  'journey.picker.deselectAll': '選択解除',
  'journey.picker.noAlbums': 'アルバムがありません',
  'journey.picker.selectDate': '日付を選択',
  'journey.picker.search': '検索',
  'journey.editor.uploadingProgress': 'アップロード中 {done}/{total}…',
  'journey.editor.uploadFailed': '写真のアップロードに失敗しました',
  'journey.editor.uploadPartialFailed':
    '{total}枚中{failed}枚の写真がアップロードに失敗しました — もう一度保存して再試行してください',
  'journey.photosUploadFailed': '一部の写真をアップロードできませんでした',
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
  'journey.studio.day': '日目',
  'journey.studio.stations': '立ち寄り先',
  'journey.studio.peersHere': '閲覧中',
  'journey.studio.folioAuto': '自動',
  'journey.studio.exportLayout': 'レイアウト',
  'journey.studio.exportPages': '単ページ',
  'journey.studio.exportPagesHint': '1ページにつき1枚、読み順に並べます。印刷所が求める形式です。',
  'journey.studio.exportSpreads': '見開き',
  'journey.studio.exportSpreadsHint': '本を開いたときのまま2ページずつ。閲覧用です。',
  'journey.studio.exportFinishing': '仕上げ',
  'journey.studio.exportMarks': 'トンボ',
  'journey.studio.exportMarksHint': '各辺に{bleed}mmの塗り足しを付け、断裁位置を示します',
  'journey.studio.exportNote': '{width}×{height}mmの用紙{sheets}枚。印刷ビューはブラウザがPDFにします。',
  'journey.studio.exportOpen': '印刷ビュー',
  'journey.studio.exportSave': 'PDFとして保存',
  'journey.studio.exportPreparing': '準備中',
  'journey.studio.exportSheetCount': '{count}枚',
  'journey.studio.undo': 'Undo', // en-fallback
  'journey.studio.redo': 'Redo', // en-fallback
  'journey.studio.zoomIn': 'Zoom in', // en-fallback
  'journey.studio.zoomOut': 'Zoom out', // en-fallback
  'journey.studio.zoomFit': 'Fit to view', // en-fallback
  'journey.studio.downloadSpread': 'この見開きをダウンロード',
  'journey.studio.downloadSpreadHint':
    'この見開きのデザインを、写真を除いてファイルに保存します。共有や再利用に使えます',
  'journey.studio.importSpread': '読み込む',
  'journey.studio.importSpreadHint': 'ダウンロードしたデザインファイルから見開きを追加します',
  'journey.studio.importSpreadFailed': 'このファイルは TREK Studio の見開きではありません',
  'journey.studio.desktopOnly': 'Studio needs a bigger screen', // en-fallback
  'journey.studio.desktopOnlyHint':
    '本づくりには広さが要るので、Studio はデスクトップ専用です。PDF の作成も同じです。旅の記録のほかの機能は、ここでもこれまでどおり使えます。', // en-fallback
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
  'journey.studio.autoColour': '自動',
  'journey.studio.countryNames': '名前',
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
  'journey.studio.frames': 'フレーム', // en-fallback
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
  'journey.studio.dropPhotoHere': '写真をここに\nドラッグ',
  'journey.studio.searchContent': 'Search photos and entries', // en-fallback
  'journey.studio.noMatches': 'Nothing matches that.', // en-fallback
  'journey.studio.decorations': 'Decoration', // en-fallback
  'journey.studio.quoteMark': 'Quotation mark', // en-fallback
  'journey.studio.circleOutline': 'Outlined circle', // en-fallback
  'journey.studio.roundFrame': 'Rounded frame', // en-fallback
  'journey.studio.shapeKind.rounded': 'Rounded rectangle', // en-fallback
  'journey.studio.shapeKind.triangle': 'Triangle', // en-fallback
  'journey.studio.shapeKind.outline': 'Outline only', // en-fallback
  'journey.studio.travel': '旅',
  'journey.studio.travelEmpty': 'この旅の数値はまだ準備できていません。',
  'journey.studio.grids': 'グリッド',
  'journey.studio.gridHint':
    'グリッドは空のフレームをまとめて配置します。「コンテンツ」から写真をドラッグしてください。',
  'journey.studio.lines': '線',
  'journey.studio.frameStyles': 'フレームのスタイル',
  'journey.studio.frameShapes': 'フレームの形',
  'journey.studio.plainFrame': 'なし',
  'journey.studio.polaroidFrame': 'ポラロイド',
  'journey.studio.whiteFrame': '白フチ',
  'journey.studio.shadowFrame': 'ドロップシャドウ',
  'journey.studio.filmFrame': 'フィルム',
  'journey.studio.tapeFrame': 'テープ留め',
  'journey.studio.shapeGroup.basic': '基本',
  'journey.studio.shapeGroup.polygons': '多角形',
  'journey.studio.shapeGroup.stars': '星',
  'journey.studio.shapeGroup.arrows': '矢印',
  'journey.studio.shapeGroup.speech': '吹き出し',
  'journey.studio.shapeGroup.travel': '旅',
  'journey.studio.shapeGroup.decor': '装飾',
  'journey.studio.shapeGroup.banners': 'バナー',
  'journey.studio.summary': 'サマリー',
  'journey.studio.tripSummary': '旅のサマリー',
  'journey.studio.statsRow': '1行',
  'journey.studio.statsFull': 'すべて',
  'journey.studio.routeMap': 'ルートマップ',
  'journey.studio.mapStyle.minimal': 'ミニマル',
  'journey.studio.mapStyle.outline': 'アウトライン',
  'journey.studio.mapStyle.paper': '紙',
  'journey.studio.mapStyle.dark': 'ダーク',
  'journey.studio.countries': '国',
  'journey.studio.countryList': '国リスト',
  'journey.studio.countryGrid': '国グリッド',
  'journey.studio.noCountries': 'この旅の国はまだ判定されていません。',
  'journey.studio.noRoute': '座標のある地点がまだありません。',
  'journey.studio.marks': 'マーク',
  'journey.studio.dateMark': '日付',
  'journey.studio.dayMark': '日数カウンター',
  'journey.studio.dayWord': 'DAY',
  'journey.studio.coordsMark': '座標',
  'journey.studio.coordsDms': '度分秒',
  'journey.studio.coordsDecimal': '十進度',
  'journey.studio.flagMark': '国旗',
  'journey.studio.distanceMark': '距離',
  'journey.studio.metric.distance': '距離',
  'journey.studio.metric.days': '日数',
  'journey.studio.metric.steps': '地点',
  'journey.studio.metric.photos': '写真',
  'journey.studio.metric.countries': '国',
  'journey.studio.metric.places': '場所',
  'journey.studio.metric.furthest': '最遠',
  'journey.studio.kind.map': '地図',
  'journey.studio.kind.stats': '数値',
  'journey.studio.kind.countries': '国',
  'journey.studio.kind.badge': 'マーク',
  'journey.studio.kind.list': 'リスト',
  'journey.studio.kind.icon': 'アイコン',
  'journey.studio.duplicate': '複製',
  'journey.studio.style': 'スタイル',
  'journey.studio.shows': '表示',
  'journey.studio.size': 'サイズ',
  'journey.studio.weight': 'ウェイト',
  'journey.studio.italic': '斜体',
  'journey.studio.tracking': '字間',
  'journey.studio.rotation': '回転',
  'journey.studio.opacity': '不透明度',
  'journey.studio.fill': '塗りの色',
  'journey.studio.fillOn': '塗りつぶし',
  'journey.studio.stroke': '線の色',
  'journey.studio.strokeWidth': '太さ',
  'journey.studio.gradient': 'フェード',
  'journey.studio.gradientDown': '下へ',
  'journey.studio.gradientUp': '上へ',
  'journey.studio.showIcons': 'アイコン',
  'journey.studio.mapFit': '範囲',
  'journey.studio.mapPadding': '余白',
  'journey.studio.mapShape': '形',
  'journey.studio.align.left': '左',
  'journey.studio.align.center': '中央',
  'journey.studio.align.right': '右',
  'journey.studio.markStyle.plain': '標準',
  'journey.studio.markStyle.chip': 'チップ',
  'journey.studio.markStyle.outline': '枠線',
  'journey.studio.markStyle.stacked': '縦並び',
  'journey.studio.icon': 'アイコン',
  'journey.studio.iconAndLabel': 'アイコンと文字',
  'journey.studio.iconOnly': 'アイコンのみ',
  'journey.studio.labelOnly': '文字のみ',
  'journey.studio.icons': 'アイコン',
  'journey.studio.iconsForTravel': '旅向け',
  'journey.studio.iconsAll': 'すべてのアイコン',
  'journey.studio.searchIcons': 'アイコンを検索',
  'journey.studio.lineWidth': '太さ',
  'journey.studio.mask': '形で切り抜く',
  'journey.studio.maskNone': 'なし',
  'journey.studio.frameStyle': 'フレーム',
  'journey.studio.mapLayers': 'レイヤー',
  'journey.studio.showLand': '国',
  'journey.studio.showRoute': 'ルート',
  'journey.studio.showPins': '地点',
  'journey.studio.showLabels': 'ラベル',
  'journey.studio.units': '単位',
  'journey.studio.metrics': '数値',
  'journey.studio.layout': 'レイアウト',
  'journey.studio.layoutGrid': 'グリッド',
  'journey.studio.layoutRow': '行',
  'journey.studio.layoutColumn': '列',
  'journey.studio.layoutList': 'リスト',
  'journey.studio.showOutline': '輪郭',
  'journey.studio.showFlag': '国旗',
  'journey.studio.showName': '名前',
  'journey.studio.textScale': '文字サイズ',
  'journey.studio.accent': 'アクセント',
  'journey.studio.refresh': '旅から更新',
  'journey.studio.staleHint': 'これらの数値を取得したあと、旅の内容が変わりました。',
  'journey.studio.align': '配置',
  'journey.studio.filter.cool': 'クール',
  'journey.studio.filter.fade': '色あせ',
  'journey.studio.filter.contrast': '強め',
  'journey.studio.strokeStyle': '線',
  'journey.studio.strokeSolid': '実線',
  'journey.studio.strokeDashed': '破線',
  'journey.studio.strokeDotted': '点線',
  'journey.studio.singleFigures': '単独の数値',
  'journey.studio.addPage': 'ページを追加',
  'journey.studio.addPageAfter': 'この後にページを挿入',
  'journey.studio.duplicatePage': 'ページを複製',
  'journey.studio.deletePage': 'ページを削除',
  'journey.studio.movePageUp': '前へ移動',
  'journey.studio.movePageDown': '後ろへ移動',
  'journey.studio.beta': 'Beta',
  'journey.studio.addProsCons': '良かった点・気になった点',
  'journey.studio.showMarks': '記号',
  'journey.studio.formatCustom': 'カスタムサイズ',
  'journey.studio.document': 'ドキュメント',
  'journey.studio.pageNumbers': 'ノンブル',
  'journey.studio.pageNumbersOn': 'オン',
  'journey.studio.pageNumbersOff': 'オフ',
  'journey.studio.folio.outer': '外側',
  'journey.studio.folio.inner': '内側',
  'journey.studio.folio.centre': '中央',
  'journey.studio.folioStart': '開始番号',
  'journey.studio.folioMargin': '余白',
  'journey.studio.relayoutSpread': 'このページ',
  'journey.studio.relayoutSpreadHint': 'エントリーから作り直す',
  'journey.studio.relayoutSpreadNone': 'このページはエントリー由来ではありません',
  'journey.studio.relayoutBook': '本全体',
  'journey.studio.relayoutBookHint': 'すべてのページを差し替え — 取り消せます',
  'journey.studio.tpl.coverFull': '裁ち落とし',
  'journey.studio.tpl.coverBand': '写真と帯',
  'journey.studio.tpl.coverWindow': '額装',
  'journey.studio.tpl.coverQuiet': '文字のみ',
  'journey.studio.tpl.coverHalf': '上下二分割',
  'journey.studio.tpl.fullText': '写真と本文',
  'journey.studio.tpl.grid9': '9分割',
  'journey.studio.tpl.mosaic': 'モザイク',
  'journey.studio.tpl.bandQuote': '間にことば',
  'journey.studio.tpl.staggerFour': '4枚ずらし',
  'journey.studio.weightMissing': 'この書体にこのウェイトはありません',
  'journey.studio.mapSource': '地図のソース',
  'journey.studio.mapSourceVector': '輪郭',
  'journey.studio.mapSourceRelief': '陰影起伏',
  'journey.studio.mapSourceSatellite': '衛星写真',
  'journey.studio.mapSourceSatelliteHint':
    '雲のない Sentinel-2。出典を付ければ無料で印刷できます。街の通りまで鮮明です。',
  'journey.studio.routeLook': 'ルートの線',
  'journey.studio.routeStyle': '描き方',
  'journey.studio.routePlain': '一本線',
  'journey.studio.routeDrawn': '地図帳風',
  'journey.studio.routeArc': '長い区間',
  'journey.studio.routeStraight': '直線',
  'journey.studio.routeBow': '曲線',
  'journey.studio.routeDashArcs': '曲線を破線にする',
  'journey.studio.mapStops': '立ち寄り先',
  'journey.studio.pinDot': '点',
  'journey.studio.pinPhoto': '写真',
  'journey.studio.pinPhotoNone': 'これらの立ち寄り先にはまだ写真がないため、点で表示します。',
  'journey.studio.roads': '道路',
  'journey.studio.roadsFetch': '道路に沿わせる',
  'journey.studio.roadsFollow': '道なり',
  'journey.studio.roadsDirect': '直行',
  'journey.studio.recommended': '推奨',
  'journey.studio.bleed': '塗り足し',
  'journey.studio.safeArea': '安全領域',
  'journey.studio.roadsAgain': '取得し直す',
  'journey.studio.roadsClear': '破棄',
  'journey.studio.roadsBusy': '取得中',
  'journey.studio.roadsHint': 'ルート検索サービスに各区間の走行経路を問い合わせます。長い区間はそのままです。',
  'journey.studio.roadsHave': '道路はこの本に保存されるので、オフラインでも同じ線で印刷されます。',
  'journey.studio.mapSourceReliefHint':
    'NASA の陰影起伏図。ライセンス不要で印刷できます。国や大陸には最適ですが、都市単位には粗すぎます。',
  'journey.studio.mapPrintDpi': '印刷解像度は約',
  'journey.studio.mapPrintDpiLow': 'このサイズではぼやけます。範囲を広げるか別のソースをお試しください',
  'journey.studio.mapPerTrip': '旅行ごと',
  'journey.studio.mapWholeJourney': '日記全体',
  'journey.studio.mapScope': '表示',
  'journey.studio.mapSourceTiles': '地図タイル',
  'journey.studio.mapSourceStatic': 'Mapbox',
  'journey.studio.mapSourceHint': 'レンダリング時に取得し、出典を付けて印刷します',
  'journey.studio.mapZoom': 'ズーム',
  'journey.studio.mapFraming': '表示範囲',
  'journey.studio.mapFitStops': '立ち寄り先',
  'journey.studio.mapFitCountry': '国全体',
  'journey.studio.mapPadTight': '狭め',
  'journey.studio.mapPadNormal': '標準',
  'journey.studio.mapPadWide': '広め',
  'journey.studio.mapPadFar': 'かなり広め',
  'journey.studio.mapClipRect': '枠あり',
  'journey.studio.mapClipCountry': '形に切り抜く',
  'journey.studio.mapClipNeedsCountry': '切り抜くには国が必要です',
  'journey.studio.mapCutVector': '切り抜き',
  'journey.studio.mapCutTiles': '切り抜き地図',
  'journey.studio.mapZoomAuto': '自動',
  'journey.studio.saving': '保存中',
  'journey.studio.saved': '保存しました',
  'journey.studio.saveFailed': '未保存',
  'journey.studio.saveRetry': '再試行',
  'journey.studio.saveConflict': 'ほかの人がこの本を保存しました',
  'journey.studio.saveTakeTheirs': '相手の版',
  'journey.studio.saveKeepMine': '自分の版',
  'journey.studio.rotate': '回転',
  'journey.studio.rotateLeft': '左に回転',
  'journey.studio.rotateRight': '右に回転',
  'journey.studio.saveReadOnly': '閲覧のみ・保存されません',
};
export default journey;
