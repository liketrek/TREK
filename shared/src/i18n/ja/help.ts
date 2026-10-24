import type { TranslationStrings } from '../types';

// English fallback until 'ja' is translated.
const help: TranslationStrings = {
  'help.title': 'ヘルプとドキュメント',
  'help.search': 'ドキュメントを検索…',
  'help.contents': '目次',
  'help.noResults': '一致するページはありません。',
  'help.errorTitle': 'このページを読み込めませんでした',
  'help.errorBody': 'ヘルプの内容は TREK の wiki から取得しています。接続を確認して、もう一度お試しください。',

  // center
  'help.center.button': 'この画面のヘルプ',
  'help.center.title': 'ヘルプ',
  'help.center.onThisScreen': 'この画面',
  'help.center.screens': '画面',
  'help.center.thisScreen': '現在',
  'help.center.subScreens': 'サブ画面 {count} 件',
  'help.center.subScreensLabel': 'サブ画面',
  'help.center.guidesCount': 'ガイド {count} 件',
  'help.center.goToScreen': '{screen}へ移動',
  'help.center.overview': '概要',
  'help.center.howTo': '操作ガイド',
  'help.center.searchPlaceholder': 'ガイドとドキュメントを検索…',
  'help.center.searchEmpty': '「{query}」に一致する結果はありません。',
  'help.center.searchGuides': 'ガイド',
  'help.center.searchDocs': 'ドキュメント',
  'help.center.searchError': '現在、検索を利用できません。',
  'help.center.back': '戻る',
  'help.center.close': 'ヘルプを閉じる',
  'help.center.steps': '{count}ステップ',
  'help.center.step': 'ステップ {n}',
  'help.center.stepsLabel': 'ステップ',
  'help.center.stepOf': 'ステップ {n} / {total}',
  'help.center.screenshot': 'スクリーンショット',
  'help.center.result': '結果',
  'help.center.tips': '知っておくと便利',
  'help.center.related': '関連',
  'help.center.openDocs': 'ヘルプ＆ドキュメントで開く',
  'help.center.docsSection': 'ドキュメント内',
  'help.center.noContext': 'この画面のガイドはまだありません。',
  'help.center.noContextHint': 'ドキュメントを検索するか、探している内容をお知らせください。',
  'help.center.feedback': 'お探しの情報が見つかりませんか？',
  'help.center.feedbackLink': 'GitHubで知らせる',
  'help.center.discord': 'Discordで質問する',
  'help.center.quick': 'クイック',
  'help.center.guide': 'ガイド',
  'help.center.tour': 'ウォークスルー',
  'help.center.imageAlt': '「{title}」の手順{n}',

  // ctx
  'help.ctx.dashboard.title': 'ダッシュボード',
  'help.ctx.dashboard.summary':
    'ダッシュボードには、すべての旅行が表示されます。上部の搭乗券風のカードには、進行中か次の旅行が表示されます。その下の列にはこれまでの旅の実績が集計され、カードには計画中、アーカイブ済み、終了したすべての旅行が並びます。',
  'help.ctx.dashboard.bullet.1':
    '搭乗券：進行中または次の旅行を、日付、同行者、場所、カウントダウン付きで表示します。クリックすると旅行が開きます。右上の4つのボタンで、編集、複製、アーカイブ、削除ができます。',
  'help.ctx.dashboard.bullet.2':
    '旅の統計：訪れた国の数、旅行の数、旅に出ていた日数、飛行距離を、すべての旅行を通して表示します。',
  'help.ctx.dashboard.bullet.3':
    '旅行カードは「予定」「アーカイブ済み」「完了」で絞り込め、グリッドかリストで表示できます。上の検索ボックスでは、タイトル、日付、旅行内の場所で、すべての旅行をまとめて検索できます。編集、複製、アーカイブ、削除のボタンは、各カードの写真の右上にあります。',
  'help.ctx.dashboard.bullet.4':
    '右側のウィジェット：通貨換算、「コレクション」（コレクションアドオンがオンの場合）、世界時計、今後の予約、プラグインのウィジェットです。組み込みのウィジェットは「設定」の「外観」でオフにできます。',
  'help.ctx.dashboard.bullet.5': '「新しい旅行」カードと右下のボタンのどちらからでも、新しい旅行を作成できます。',

  // create-trip
  'help.guide.create-trip.title': '旅行を作成する',
  'help.guide.create-trip.goal': '名前、日程、カバー写真を設定して、新しい旅行を始めます。',
  'help.guide.create-trip.step.1':
    '「新しい旅行」をクリックします。旅行一覧の最後にあるカードと、右下のボタンでも同じ操作ができます。',
  'help.guide.create-trip.step.2': '旅行に名前を付けます。必須なのは名前だけで、ほかはあとから追加できます。',
  'help.guide.create-trip.step.3':
    '開始日と終了日を選びます。TREKが日付ごとに1日ずつ作成するので、すぐに旅程を計画し始められます。日付が未定なら、両方を空欄のままにして、代わりに「日数」を入力します。',
  'help.guide.create-trip.step.4':
    '任意：カバー写真を追加します。自分の写真をアップロードする、ドラッグや貼り付けで追加する、行き先でUnsplashを検索する、のいずれかを選べます。',
  'help.guide.create-trip.step.5': '「新しい旅行を作成」をクリックします。',
  'help.guide.create-trip.result':
    '旅行がダッシュボードに表示されます。次に出かける旅行なら、上部の搭乗券にも表示されます。',
  'help.guide.create-trip.tip.1':
    '日程はあとから変更できます。すでに予約がある場合は、予約も日程に合わせて移動するかどうかを TREK が確認します。',
  'help.guide.create-trip.tip.2': 'ここで選んだ旅行の通貨に、すべての費用が換算されます。目的地の通貨を選びましょう。',

  // edit-trip
  'help.guide.edit-trip.title': '旅行を編集する',
  'help.guide.edit-trip.goal': '旅行の名前、日付、設定を変更します。',
  'help.guide.edit-trip.step.1': '旅行カード（または搭乗券）の右上にある鉛筆アイコンをクリックします。',
  'help.guide.edit-trip.step.2': '名前、説明、日付、カバー、通貨、リマインダー、同行者など、必要な項目を変更します。',
  'help.guide.edit-trip.step.3': '「更新」をクリックします。',
  'help.guide.edit-trip.result': '旅行のメンバー全員の画面で、カードがすぐに更新されます。',
  'help.guide.edit-trip.tip.1':
    '予約のある旅行の開始日を動かすと、予約も一緒に動かすかどうか確認されます。旅行を短くすると、削除される日とその日の予定が一覧され、「日を削除して保存」をクリックしたときだけ保存されます。',

  // cover-image
  'help.guide.cover-image.title': 'カバー写真を設定する',
  'help.guide.cover-image.goal': '旅行のカードと搭乗券に表示される画像を設定します。',
  'help.guide.cover-image.step.1': 'カードの鉛筆アイコンから、旅行の編集フォームを開きます。',
  'help.guide.cover-image.step.2':
    '「カバー画像」で写真をドロップするか貼り付けます。クリックしてアップロードすることも、行き先を入力して「Unsplashを検索」をクリックすることもできます。',
  'help.guide.cover-image.step.3': '写真を選び、「更新」をクリックします。',
  'help.guide.cover-image.result': '写真は旅行と一緒に保存され、旅行が表示されるすべての場所に表示されます。',
  'help.guide.cover-image.tip.1':
    'Unsplashで検索した写真には、クレジットが自動で表示されます。自分でアップロードした写真は自分のサーバーに保存されます。',

  // duplicate-trip
  'help.guide.duplicate-trip.title': '旅行を複製する',
  'help.guide.duplicate-trip.goal': '既存の旅行をテンプレートにして、新しい旅行を作ります。',
  'help.guide.duplicate-trip.step.1': 'カード右上の複製アイコンをクリックします。',
  'help.guide.duplicate-trip.step.2': 'コピーされるものとされないものを確認して、「旅行をコピー」をクリックします。',
  'help.guide.duplicate-trip.result':
    'ダッシュボードにコピーが表示されます。名前は元の名前の後ろに（コピー）が付いたものです。名前と日付は変更できます。',
  'help.guide.duplicate-trip.tip.1':
    'コピーされるのは、日、場所、ツアーとロードトリップのルート、予約、予算の項目、持ち物リスト、ToDo、日のメモです。持ち物リストとToDoは、チェックが外れた状態でコピーされます。メンバー、チャット、投票、ファイル、共有リンクはコピーされません。',

  // archive-trip
  'help.guide.archive-trip.title': '旅行をアーカイブ・復元する',
  'help.guide.archive-trip.goal': '旅行を削除せずに旅行一覧から外し、あとで復元します。',
  'help.guide.archive-trip.step.1': 'カード右上のアーカイブアイコンをクリックします。',
  'help.guide.archive-trip.step.2': 'カードの上にあるフィルターを「アーカイブ済み」に切り替えると、再び表示されます。',
  'help.guide.archive-trip.step.3':
    'カードの「復元」をクリックすると「予定」に戻ります。日付が過ぎている場合は「完了」に戻ります。',
  'help.guide.archive-trip.result':
    'アーカイブした旅行のデータはすべて残ります。ダッシュボードと、全旅行のカレンダーフィードには表示されなくなります。',

  // delete-trip
  'help.guide.delete-trip.title': '旅行を削除する',
  'help.guide.delete-trip.goal': '旅行を完全に削除します。',
  'help.guide.delete-trip.step.1': 'カード右上のゴミ箱アイコンをクリックします。',
  'help.guide.delete-trip.step.2':
    '「削除」で確定します。ダイアログに旅行名が表示されるので、削除する旅行が正しいか確認できます。',
  'help.guide.delete-trip.result':
    '旅行と、その日、場所、予約、ファイルが削除されます。元に戻せないので、迷う場合は代わりにアーカイブしてください。',

  // filter-and-view
  'help.guide.filter-and-view.title': '完了した旅行を探し、グリッドとリストを切り替える',
  'help.guide.filter-and-view.goal': '完了した旅行やアーカイブした旅行を表示し、好みのレイアウトを選びます。',
  'help.guide.filter-and-view.step.1':
    'カードの上にある「予定」「アーカイブ済み」「完了」を使います。「完了」には、終了日を過ぎたすべての旅行が入ります。',
  'help.guide.filter-and-view.step.2':
    'リストアイコンをクリックするとコンパクトなリスト表示に、もう一度クリックするとグリッド表示に切り替わります。',
  'help.guide.filter-and-view.result': 'ダッシュボードの表示方法は、この端末に保存されます。',

  // calendar-feed
  'help.guide.calendar-feed.title': 'すべての旅行をカレンダーで購読する',
  'help.guide.calendar-feed.goal': '進行中のすべての旅行の日と予約を、カレンダーアプリで同期して表示します。',
  'help.guide.calendar-feed.step.1': '表示切り替えの隣にあるカレンダーアイコンをクリックします。',
  'help.guide.calendar-feed.step.2':
    '「カレンダー購読を有効にする」をクリックします。TREKが非公開のフィードリンクを作成します。',
  'help.guide.calendar-feed.step.3':
    '「Google カレンダーに追加」か「Apple カレンダー / Outlook に追加」をクリックします。ほかのカレンダーアプリの場合は、「またはリンクを手動でコピー」を開いてリンクをコピーします。',
  'help.guide.calendar-feed.result':
    '進行中のすべての旅行がカレンダーに表示され、自動で更新されます。アーカイブした旅行と、終了から90日以上たった旅行は含まれません。',
  'help.guide.calendar-feed.tip.1':
    'リンクはほかの人に知られないようにしてください。リンクを知っている人は誰でもフィードを読めます。ほかの人に知られた場合は、「再生成」で新しいリンクを作ると、古いリンクは使えなくなります。「オフにする」でリンクを完全に削除します。',

  // widgets
  'help.guide.widgets.title': 'ダッシュボードのウィジェットを選ぶ',
  'help.guide.widgets.goal': '統計の行と右側のウィジェットを表示・非表示にします。',
  'help.guide.widgets.step.1': '右上のアバターのメニューを開き、「設定」を選びます。',
  'help.guide.widgets.step.2': '「外観」タブに切り替えます。',
  'help.guide.widgets.step.3':
    '「ダッシュボードウィジェット」で、ウィジェットごとにオン・オフを切り替えます。デスクトップとモバイルは別々に設定できます。「右サイドバー」で右の列全体をまとめてオフにできます。',
  'help.guide.widgets.step.4': 'ダッシュボードに戻ります。変更はすぐに反映されています。',
  'help.guide.widgets.result':
    'ウィジェットを非表示にすると、そのぶん旅行の表示スペースが広がります。右サイドバーをまるごとオフにすると、レイアウトが中央寄せになります。',
  'help.guide.widgets.link': '外観の設定を開く',

  // currency-widget
  'help.guide.currency-widget.title': '通貨を換算する',
  'help.guide.currency-widget.goal': '現在のレートで、2つの通貨の間で金額を換算します。',
  'help.guide.currency-widget.step.1': '金額を入力し、2つの通貨を選びます。',
  'help.guide.currency-widget.step.2': '間の矢印で2つの通貨を入れ替え、円形の矢印でレートを更新します。',
  'help.guide.currency-widget.result': '通貨の組み合わせはアカウントに保存されるので、どの端末でも同じになります。',
  'help.guide.currency-widget.tip.1':
    '為替レートは無料のFrankfurterサービスから取得します。ウィジェットの角にある円形の矢印で、最新のレートを取得できます。',

  // timezones-widget
  'help.guide.timezones-widget.title': '世界時計を追加する',
  'help.guide.timezones-widget.goal': '目的地の現地時刻を確認します。',
  'help.guide.timezones-widget.step.1':
    '「タイムゾーン」ウィジェットの＋をクリックし、都市（例：Lisbon）を検索して一覧から選びます。',
  'help.guide.timezones-widget.step.2': '時計を削除するには、時計にカーソルを合わせ、右に出る×をクリックします。',
  'help.guide.timezones-widget.result': '時計はアカウントに保存されます。',
  'help.guide.search-trips.title': '旅行を検索する',
  'help.guide.search-trips.goal': '名前、日付、計画した場所から旅行を探します。アーカイブした旅行も対象です。',
  'help.guide.search-trips.step.1':
    'カードの上の「旅行や場所を検索」に入力します。入力するそばから、予定、アーカイブ済み、完了の旅行がまとめて絞り込まれます。',
  'help.guide.search-trips.step.2':
    '場所で一致した旅行には、旅行のタイトルの下にその場所が表示されます。入力欄の×をクリックするかEscapeキーを押すと、すべての旅行がまた表示されます。',
  'help.guide.search-trips.result':
    'ダッシュボードには一致する旅行だけが表示されます。検索欄を空にすると、すべての旅行が再び表示されます。',
  'help.guide.search-trips.tip.1':
    '日付でも検索できます。「May 2027」や「2027-05」のように年月を入力すると、その月の旅行が見つかります。',
  'help.guide.search-trips.tip.2':
    '検索中は「予定」「アーカイブ済み」「完了」の切り替えが適用されないので、フィルターのせいで旅行が見つからないことはありません。',

  // ── Screen: vacay ──────────────────────────────────────────────────────────
  'help.ctx.vacay.title': 'Vacay',
  'help.ctx.vacay.summary':
    'Vacayは個人用の休暇プランナーです。1年に休暇が何日あるか、どの日を記録したか、残りが何日かを管理します。グリッドには1年全体が表示されます。サイドバーには、年の選択、一緒に計画する人、共有されたカレンダー、凡例、付与日数があります。',
  'help.ctx.vacay.bullet.1':
    '年間のグリッド：12か月分のカードに、1日1マスで並びます。日をクリックすると記録・解除できます。小さな青い点は、旅行が入っている日を示します。',
  'help.ctx.vacay.bullet.2':
    '下部のツールバー：自分の名前と色が付いた最初のボタンで休暇を記録します。「会社休日」では、会社全体が休みの日をマークします。「半休」と「代休・フレックス」で、クリックしたときに記録される内容が変わります。「半休」は会社休日にも使えます。',
  'help.ctx.vacay.bullet.3':
    '「付与日数」：選択した年の「日」「使用済み」「残り」と、その横に繰り越し日数と代休・フレックスの日数が表示されます。カードの見出しをクリックすると折りたためます。',
  'help.ctx.vacay.bullet.4':
    '「人数」には、プランを共有している人がそれぞれの色で表示されます。「共有カレンダー」では、ほかの人の休みが色の輪で表示されます。共有カレンダーは編集できません。',
  'help.ctx.vacay.bullet.5':
    '「設定」では、週末、週の開始、繰り越し、休暇年度、会社休日、祝日と学校の休暇のカレンダーを設定できます。誰かと一緒に計画している間は「統合を解除」もあります。',
  // log-day
  'help.guide.log-day.title': '休暇日を記録する',
  'help.guide.log-day.goal': '年間グリッドに休みの日を記録し、残日数が更新されるのを確認します。',
  'help.guide.log-day.step.1':
    '下部のツールバーの最初のボタンを確認します。自分の名前と色が表示されていれば、日をクリックすると自分の休暇として記録されます。',
  'help.guide.log-day.step.2':
    'いずれかの月のカードで日をクリックします。その日があなたの色で塗られ、「使用済み」が1日増えます。',
  'help.guide.log-day.step.3': '同じ日をもう一度クリックすると、記録が消えます。',
  'help.guide.log-day.result':
    '日が記録されます。「日」「使用済み」「残り」がすぐに更新され、プランを統合している全員にもすぐに反映されます。',
  'help.guide.log-day.tip.1':
    '「設定」で「週末を除外」がオンの間は、週末を記録できません。以前に記録した週末は、解除できます。',
  'help.guide.log-day.tip.2':
    'マスの青い点は、自分の旅行が入っている日を示します。休暇と旅行が重なっているかがわかります。',
  // half-day
  'help.guide.half-day.title': '半日休を記録する',
  'help.guide.half-day.goal': '午後だけ休んで、付与日数を半日分だけ使います。',
  'help.guide.half-day.step.1': 'ツールバーで「半休」をオンにします。オレンジの点が、グリッド上の半休のマークです。',
  'help.guide.half-day.step.2': '日をクリックします。0.5日として記録され、角にオレンジの点が付きます。',
  'help.guide.half-day.step.3':
    '終わったら「半休」をオフに戻します。設定の違う半休の日をクリックすると、現在の設定に変わります。',
  'help.guide.half-day.result':
    '「使用済み」が0.5増えます。「半休」と「代休・フレックス」は別々に設定できるので、半日の代休も記録できます。',
  'help.guide.half-day.tip.1': 'ツールバーには次のクリックで付く印が常に表示されるので、記録する前に確認できます。',
  // comp-day
  'help.guide.comp-day.title': '代休・フレックスを記録する',
  'help.guide.comp-day.goal': '休暇日数を使わずに代休を取ります。',
  'help.guide.comp-day.step.1':
    'ツールバーで「代休・フレックス」をオンにします。斜線の入った丸が、グリッド上の代休のマークです。',
  'help.guide.comp-day.step.2': '日をクリックします。塗りつぶしではなく、あなたの色の斜線で表示されます。',
  'help.guide.comp-day.result': '代休は付与日数のタイルの横で別に数えられ、「残り」が減ることはありません。',
  'help.guide.comp-day.tip.1': '残業の振替休日、フレックス、代休など、休暇ではない休みに使います。',
  // entitlement
  'help.guide.entitlement.title': '付与日数を設定する',
  'help.guide.entitlement.goal': '1年の休暇日数をVacayに設定します。',
  'help.guide.entitlement.step.1':
    'サイドバーの「付与日数」カードで、自分の行の「日」タイルをクリックします。カードが閉じている場合は、見出しをクリックして開きます。',
  'help.guide.entitlement.step.2': '日数を入力してEnterキーを押します。Escapeキーを押すと元の値のままになります。',
  'help.guide.entitlement.result': '「残り」は、付与日数、繰り越し分、使用済みの日数から再計算されます。',
  'help.guide.entitlement.tip.1': '付与日数は年ごとに設定されるので、ここでの変更は選択中の年にだけ反映されます。',
  // years
  'help.guide.years.title': '年を追加・切り替える',
  'help.guide.years.goal': '来年の計画を今から立てたり、昨年を振り返ったりします。',
  'help.guide.years.step.1': '年の右にある＋で翌年を、左にある＋で前年を追加します。',
  'help.guide.years.step.2': '矢印か、その下の年のチップで年を切り替えます。',
  'help.guide.years.step.3':
    '年を削除するには、年のチップにカーソルを合わせ、小さなマイナスをクリックします。その年のエントリーもすべて削除されるので、よく確認してください。',
  'help.guide.years.result': '年ごとに付与日数と記録が分かれています。繰り越しによって前年と翌年がつながります。',
  // company-holidays
  'help.guide.company-holidays.title': '会社の休日を設定する',
  'help.guide.company-holidays.goal': '会社全体が休みの日を、誰の付与日数も減らさずに設定します。',
  'help.guide.company-holidays.step.1':
    '「設定」を開き、「会社休日」がオンになっているか確認します。デフォルトでオンになっています。ツールバーにこのモードが表示されるのは、オンのときだけです。',
  'help.guide.company-holidays.step.2': 'グリッドに戻り、ツールバーを「会社休日」に切り替えます。',
  'help.guide.company-holidays.step.3':
    '日をクリックします。琥珀色になり、凡例に表示されます。もう一度クリックすると解除されます。',
  'help.guide.company-holidays.result':
    '会社休日はプランを統合している全員に表示され、「残り」が減ることはありません。',
  'help.guide.company-holidays.tip.1':
    '統合しているメンバーは誰でも会社休日を編集できるので、誰が管理するかを決めておきましょう。',
  // public-holidays
  'help.guide.public-holidays.title': '祝日を表示する',
  'help.guide.public-holidays.goal': '自分の国や地域の祝日をグリッドに表示します。',
  'help.guide.public-holidays.step.1': '「設定」を開き、「祝日」をオンにします。',
  'help.guide.public-holidays.step.2':
    '「カレンダーを追加」をクリックし、国と、必要なら地域を選びます。色とラベルも設定できます。最後に「追加」をクリックします。',
  'help.guide.public-holidays.step.3': '「設定」を閉じます。祝日がグリッドと凡例に表示されます。',
  'help.guide.public-holidays.result': '祝日はカレンダーの色で表示され、付与日数から差し引かれることはありません。',
  'help.guide.public-holidays.tip.1':
    'カレンダーは複数追加できます。たとえば、自分の地域と、統合している同僚の地域です。',
  // school-holidays
  'help.guide.school-holidays.title': '学校の休暇を表示する',
  'help.guide.school-holidays.goal': '自分の地域の学校の休みを、自分の休みと並べて確認します。',
  'help.guide.school-holidays.step.1': '「設定」を開き、「学校の休暇」をオンにします。',
  'help.guide.school-holidays.step.2':
    '「カレンダーを追加」をクリックして国を選びます。カレンダーが地域ごとに分かれている国では、地域またはグループも選んでから「追加」をクリックします。',
  'help.guide.school-holidays.step.3':
    '「設定」を閉じます。学校の休みはカレンダーの色で塗られ、その日の下部に色の帯が付きます。',
  'help.guide.school-holidays.result': '学校の休暇はカレンダーに表示されるだけで、誰の付与日数も減りません。',
  'help.guide.school-holidays.tip.1':
    '地域が見つからない場合は、管理者が「管理」の「カスタマイズ」にある「学校の休暇」で手動で登録できます。',
  // weekends
  'help.guide.weekends.title': '週末をブロックし、週の始まりを設定する',
  'help.guide.weekends.goal': '週末を集計から外し、好きな曜日から週を始めます。',
  'help.guide.weekends.step.1': '「設定」を開きます。',
  'help.guide.weekends.step.2': '「週末を除外」をオンにし、「週末」で週末として扱う曜日を選びます。',
  'help.guide.weekends.step.3': '「週の開始」で「月」か「日」を選びます。',
  'help.guide.weekends.result': '除外した日はグリッドでグレー表示になり、誤って記録できなくなります。',
  // leave-year
  'help.guide.leave-year.title': '休暇年度を設定する',
  'help.guide.leave-year.goal': '1月から12月ではなく、会計年度や入社日を基準に付与日数を数えます。',
  'help.guide.leave-year.step.1': '「設定」を開き、「休暇年度」を探します。',
  'help.guide.leave-year.step.2':
    '「カレンダー」、「会計年度」（開始の月日を指定）、「入社日」（入社した日付を指定）から選びます。',
  'help.guide.leave-year.result':
    '付与日数、使用日数、繰り越しがその期間で計算され、グリッドはその期間の最初の月から始まります。',
  'help.guide.leave-year.tip.1':
    'この設定は個人ごとです。統合したプランでも、各自の休暇年度と日数はそれぞれのままです。',
  // carry-over
  'help.guide.carry-over.title': '使わなかった日を繰り越す',
  'help.guide.carry-over.goal': '期間の終わりに残った日数を次の期間に加えます。',
  'help.guide.carry-over.step.1': '「設定」を開きます。',
  'help.guide.carry-over.step.2': '「繰越」をオンにします。',
  'help.guide.carry-over.result': '繰り越し分はすべての年を通して再計算され、付与日数の下に表示されます。',
  'help.guide.carry-over.tip.1': 'オフにすると、繰り越しの残高がすべて0に戻ります。',
  // invite
  'help.guide.invite.title': 'ほかの人と一緒に計画する',
  'help.guide.invite.goal': 'ほかのTREKユーザーとプランを統合し、お互いの休みを1つのグリッドで確認します。',
  'help.guide.invite.step.1': '「人数」カードの人のアイコンをクリックします。',
  'help.guide.invite.step.2': 'ユーザーを選び、「招待を送信」をクリックします。',
  'help.guide.invite.step.3':
    '相手に通知が届き、次にVacayを開いたときに「統合の招待」が表示されます。それまでは招待が保留中として表示され、カーソルを合わせると取り消せます。',
  'help.guide.invite.result':
    '2人のプランがひとつになります。人ごとに色が付き、お互いの休暇日を記録でき、すべてリアルタイムで同期されます。',
  'help.guide.invite.tip.1':
    '統合を元に戻すには、「設定」で「解除」をクリックします。全員のエントリーがそれぞれのプランに戻ります。',
  'help.guide.invite.tip.2': '相手に自分の休みを見せるだけなら、統合ではなくカレンダーを共有してください。',
  // share-calendar
  'help.guide.share-calendar.title': 'カレンダーを閲覧専用で共有する',
  'help.guide.share-calendar.goal': 'プランを変更させずに、自分の休みの日を相手に見せます。',
  'help.guide.share-calendar.step.1': '「共有カレンダー」カードの共有アイコンをクリックします。',
  'help.guide.share-calendar.step.2': 'ユーザーを選び、「共有」をクリックします。相手の承認は必要ありません。',
  'help.guide.share-calendar.step.3':
    '共有されたカレンダーはカードの上部に表示されます。クリックすると表示・非表示を切り替えられ、カーソルを合わせて×をクリックすると削除できます。「共有中の相手」では、名前にカーソルを合わせて「共有を停止」をクリックします。',
  'help.guide.share-calendar.result':
    '相手のグリッドに、自分の休みが色の輪で表示されます。相手は共有された内容を編集できません。',
  'help.guide.share-calendar.tip.1':
    '共有と統合はそれぞれ独立しています。ある人と統合したまま、別の人と共有することもできます。',
  'help.guide.share-calendar.tip.2': 'リングの付いた日にカーソルを合わせると、誰がどのくらい休むかがわかります。',

  // ── Screen: atlas ─────────────────────────────────────────────────────────────────────
  'help.ctx.atlas.title': 'Atlas',
  'help.ctx.atlas.summary':
    'Atlas では、これまでに旅した場所を世界地図で確認できます。旅行で訪れた国はすべて色付けされ、TREK を使う前に訪れた国は手動で追加できます。ズームインすると地域が表示されます。まだ行きたい場所を行きたいリストにまとめたり、下部のガラス風パネルで数字を確認したりできます。',
  'help.ctx.atlas.bullet.1':
    '地図：訪れた国にはそれぞれ固有の色が付き、予定の国は破線の輪郭、行きたいリストの国は斜線、ほかの国はグレーで表示されます。国にカーソルを合わせると、その国の旅行、場所、最初と最後の訪問が表示されます。',
  'help.ctx.atlas.bullet.2':
    '上部の検索：国名か場所を入力します。行ったことのない国ならポップアップが開き、行ったことのある国ならパネルにカードが表示されます。場所を選ぶと、地図がその地域を表示するので、その地域をマークできます。',
  'help.ctx.atlas.bullet.3':
    '右上の「予定の国を表示」：これからの旅行の国を表示します。このスイッチは、これからの旅行がある場合だけ表示されます。',
  'help.ctx.atlas.bullet.4':
    '下部のパネル：「統計」タブには、国（予定の国はその横）、地域、旅行、場所、都市、日数、大陸、連続記録、今年の旅行が表示されます。「行きたいリスト」タブには、これから行きたい場所が並びます。ツアーアドオンがあれば「ツアー」タブも表示され、実施したツアーの距離と獲得標高がわかります。',
  'help.ctx.atlas.bullet.5':
    '地域：大きくズームインすると、地図に州や県が表示されます。クリックすると、マーク、マーク解除、行きたいリストへの追加ができます。',
  'help.ctx.atlas.bullet.6':
    'Dawarich：アドオンを接続すると、統計の左のパネルで、記録をもとに行きたいリストの項目を訪問済みにしたり、国を追加したりできます。どちらも確認してから行われます。',
  // mark-country
  'help.guide.mark-country.title': '国を訪問済みにする',
  'help.guide.mark-country.goal': 'TREK を使う前に訪れた国を追加して、マップと国の数に含めます。',
  'help.guide.mark-country.step.1': 'マップ上部の検索ボックスに国名を入力します。',
  'help.guide.mark-country.step.2': '一覧から選びます。マップがその国に移動し、ポップアップが開きます。',
  'help.guide.mark-country.step.3': '「訪問済みにする」を選びます。',
  'help.guide.mark-country.result':
    'その国に地図上で色が付き、「国」の数が1つ増えます。色は固定なので、ほかの国をマークしても、ほかの国の色は変わりません。',
  'help.guide.mark-country.tip.1':
    '地図上のグレーの国をクリックしても、同じポップアップが開きます。小さな国は検索のほうが確実です。',
  'help.guide.mark-country.tip.2':
    '手動で訪問済みにした国は、その国への旅行の日程に関係なく、常に訪問済みとして数えられます。',
  // unmark-country
  'help.guide.unmark-country.title': '訪問済みにした国を取り消す',
  'help.guide.unmark-country.goal': '手動で訪問済みにした国をマップから外します。',
  'help.guide.unmark-country.step.1':
    '国を検索して選ぶか、マップ上でクリックします。自分で訪問済みにした国なら、ポップアップで削除するかどうかを確認されます。',
  'help.guide.unmark-country.step.2': '「削除」で確定します。',
  'help.guide.unmark-country.result': 'その国がグレーに戻り、数に含まれなくなります。',
  'help.guide.unmark-country.tip.1':
    'この方法で外せるのは、手動でマークした国だけです。旅行や場所がある国は、その旅行や場所を削除するまでマークされたままです。手動でマークした国は、パネルの詳細カードの「削除」でも外せます。',
  // country-details
  'help.guide.country-details.title': 'ある国での記録を見る',
  'help.guide.country-details.goal': '訪問済みの国を開き、その国を訪れた旅行に移動します。',
  'help.guide.country-details.step.1': '地図上部の検索ボックスに、訪れた国の名前を入力します。',
  'help.guide.country-details.step.2':
    '候補から選びます。地図がその国に移動し、下部のパネルにカードが表示されます。カードには国旗、場所・旅行・訪れた地域の数のバッジ、最初の3つの旅行のチップが表示されます。',
  'help.guide.country-details.result': '旅行のチップをクリックすると、その旅行がプランナーで開きます。',
  'help.guide.country-details.tip.1':
    'マップ上で国にカーソルを合わせると、同じ数字に加えて、最初と最後の訪問日が表示されます。',
  // planned-countries
  'help.guide.planned-countries.title': 'これから行く国を表示する',
  'help.guide.planned-countries.goal': 'これからの旅行の国を、訪問済みとして数えずに地図に表示します。',
  'help.guide.planned-countries.step.1': '右上の「予定の国を表示」をオンにします。横の数字は予定の国の数です。',
  'help.guide.planned-countries.step.2':
    '予定している国を検索して選びます。パネルに「予定」と表示され、マップのツールチップにはいつ行くかが表示されます。',
  'help.guide.planned-countries.result':
    '予定の国は破線の輪郭で表示されるので、訪問済みの国と見分けがつきます。スイッチの設定は保存されます。',
  'help.guide.planned-countries.tip.1':
    '国は、その国への旅行が始まった時点で訪問済みになります。進行中の旅行も含まれます。日程のない旅行は、統計にまったく含まれません。',
  'help.guide.planned-countries.tip.2': 'このスイッチは、これからの旅行があるときだけ表示されます。',
  // regions
  'help.guide.regions.title': '地域をマークする',
  'help.guide.regions.goal': '国だけでなく、訪れた州、省、県などもマークします。',
  'help.guide.regions.step.1':
    '州や県の境界が表示されるまで、国を拡大します。国を検索して選ぶと、十分に拡大した状態まで地図が移動します。',
  'help.guide.regions.step.2':
    '地域をクリックします。地域にカーソルを合わせると名前が表示されます。ポップアップには地域とその国が表示されます。',
  'help.guide.regions.step.3': '「訪問済みにする」を選びます。',
  'help.guide.regions.result':
    '地域がその国の色で塗られます。地域を訪問済みにすると、国がまだ訪問済みでなければ、国も訪問済みとして数えられます。',
  'help.guide.regions.tip.1':
    '訪問済みの地域をクリックすると、「削除」が表示されます。自分で訪問済みにした地域でも、場所から追加された地域でも同じです。',
  'help.guide.regions.tip.2': '実際に場所がある地域は、自動で訪問済みになります。何もする必要はありません。',
  // search-place
  'help.guide.search-place.title': '場所を検索してその地域をマークする',
  'help.guide.search-place.goal': '都市がどの地域にあるか知らなくても、ミュンヘンを検索してバイエルンをマークします。',
  'help.guide.search-place.step.1':
    '検索ボックスに都市、名所、住所を入力します。最初に国が表示され、その下の「場所」に一致する場所が表示されます。',
  'help.guide.search-place.step.2': '場所を選びます。地図がその場所に移動し、その地点のある地域が特定されます。',
  'help.guide.search-place.step.3':
    'その地域について「訪問済みにする」を選びます。まだ行ったことがなければ「行きたいリストに追加」を選びます。',
  'help.guide.search-place.result':
    '地域が訪問済みになり、国も訪問済みになります。マップのデータに地域情報がない国では、代わりに国そのものが訪問済みになります。',
  'help.guide.search-place.tip.1':
    '場所は TREK のほかの画面と同じ検索で探すので、管理者が設定したプロバイダーが使われます。',
  // bucket-country
  'help.guide.bucket-country.title': '国を行きたいリストに追加する',
  'help.guide.bucket-country.goal': '訪れた国とは別に、行きたい国のリストを地図上で管理します。',
  'help.guide.bucket-country.step.1': '国を検索して選ぶか、地図上でクリックします。',
  'help.guide.bucket-country.step.2': '「行きたいリストに追加」を選びます。',
  'help.guide.bucket-country.step.3': '時期が決まっていれば月と年を選び、「行きたいリストに追加」で確定します。',
  'help.guide.bucket-country.result':
    'その国は、訪問後に付く色の斜線で表示され、パネルの「行きたいリスト」タブに追加されます。',
  'help.guide.bucket-country.tip.1': '国がリストに入ると、同じポップアップに「行きたいリストから削除」が表示されます。',
  'help.guide.bucket-country.tip.2':
    '目標の時期ごとに1件です。同じ国を別々の2つの月でリストに入れることはできますが、同じ月に2回は入れられません。',
  // bucket-place
  'help.guide.bucket-place.title': '場所を行きたいリストに追加する',
  'help.guide.bucket-place.goal': '行きたい都市、名所、住所を、座標と目標日付きで保存します。',
  'help.guide.bucket-place.step.1': '下部のパネルで「行きたいリスト」タブを開きます。',
  'help.guide.bucket-place.step.2': '「場所を追加」をクリックします。',
  'help.guide.bucket-place.step.3':
    '名前を入力して検索ボタンを押し、一致する候補を選ぶと、場所に座標が付きます。名前だけ入力して、検索を省くこともできます。',
  'help.guide.bucket-place.step.4': '必要に応じて月と年を選び、「追加」をクリックします。',
  'help.guide.bucket-place.result':
    'その場所が目標日付きで行きたいリストの先頭に追加されます。カーソルを合わせると、削除用の×が表示されます。',
  'help.guide.bucket-place.tip.1':
    'Dawarich があとで項目を達成済みにできるのは、座標がある項目だけです。記録でその場所に行ったことがわかった時点で、チェックが付きます。',
  // stats
  'help.guide.stats.title': '統計を見る',
  'help.guide.stats.goal': 'パネルの数字が何を数えていて、何を数えていないかを確認します。',
  'help.guide.stats.step.1':
    '「国」は、実際に訪れた国の数です（重複は数えません）。予定の国は数の下に表示され、数には含まれません。「地域」は、訪れた州や県の数です。「旅行」「場所」「日」は、すべての旅行の合計です。「都市」は場所の住所から計算するので、推定値です。',
  'help.guide.stats.step.2':
    '大陸の欄には、大陸ごとの訪問済みの国の数が表示されます。南極は訪れると表示されます。続いて連続記録（旅行が1回以上ある年が続いている年数）と、今年の旅行数が表示されます。',
  'help.guide.stats.result': '数字は旅行の計画に合わせて自動で更新されます。ここで管理する必要はありません。',
  'help.guide.stats.tip.1':
    '都市は住所の文字列から読み取るもので、検索はしていません。そのため「Osteria Francescana, Italy」のような短い住所や、都道府県で終わる住所は、都市ではなく地域として数えられることがあります。',
  'help.guide.stats.tip.2': '手動で訪問済みにした国は「国」と大陸の数に含まれますが、旅行、場所、日数は増えません。',
  // dawarich-countries
  'help.guide.dawarich-countries.title': '記録から国を追加する',
  'help.guide.dawarich-countries.goal': 'Dawarichを使って過去1年に滞在した国を調べ、確認した国を地図に追加します。',
  'help.guide.dawarich-countries.step.1':
    'Dawarichアドオンを接続していると、地図の下部の統計の左に、2つのタイルがあるDawarichのパネルが表示されます。「国」をクリックします。',
  'help.guide.dawarich-countries.step.2':
    'ダイアログが「国」タブで開きます。「国を探す」をクリックします。TREKが過去12か月の記録にある国と都市を1か月ずつ読み込むので、少し時間がかかることがあります。Atlasにまだない国が、国旗、都市の数、最初の都市名付きで一覧されます。どの国も最初はチェックが入っています。除外するには行をクリックします。',
  'help.guide.dawarich-countries.step.3':
    '右下のボタンで確定します。5行にチェックが入っていれば、ボタンは「5か国を追加」になります。追加された国の数がダイアログに表示されます。ダイアログを閉じると、マップはすでに更新されています。',
  'help.guide.dawarich-countries.result':
    '確定した国がマップ上で色付けされ、Dawarich からの記録として「国」に数えられます。手動で訪問済みにした国は変わりません。',
  'help.guide.dawarich-countries.tip.1':
    'Atlas ですでに訪問済みになっている国は、手動、旅行、以前の照合のどれによるものでも除外されるので、自分で付けた印が変わることはありません。以前 Atlas から外した国は、ここで確定すると再び追加されます。',
  'help.guide.dawarich-countries.tip.2':
    'TREK が国名を照合できなかった場合、その名前は行の下に表示され、捨てられることはありません。「もう一度確認」で Dawarich にもう一度問い合わせます。一覧の下には、直近12か月分を確認したことが表示されます。この期間は変更できません。',
  // dawarich-wishes
  'help.guide.dawarich-wishes.title': '記録をもとに行きたいリストにチェックを付ける',
  'help.guide.dawarich-wishes.goal': '行きたいリストのうち実際に訪れた場所を調べ、訪れた日付で訪問済みにします。',
  'help.guide.dawarich-wishes.step.1':
    '地図下部の統計の左にあるDawarichのパネルで、「ウィッシュリスト」をクリックします。',
  'help.guide.dawarich-wishes.step.2':
    'ダイアログが「ウィッシュリスト」タブで開きます。「ウィッシュリストを照合」をクリックすると、座標のあるすべての項目について、TREK が記録を照合します。訪れた項目は、どこまで近づいたか、どのくらい滞在したか、その日付とともに一覧表示され、最初からチェックが入っています。すでにチェック済みの項目には「チェック済み」と表示されます。一覧の下には座標のない項目の数と、判定ルールが表示されます：250 m 以内に 20 分以上滞在すると、訪れたとみなされます。',
  'help.guide.dawarich-wishes.step.3':
    '右下のボタンで確定します。2行にチェックが入っていれば、ボタンは「2件をチェック済みにする」になります。そのあとダイアログを閉じ、隣のパネルの「行きたいリスト」タブを開きます。',
  'help.guide.dawarich-wishes.result':
    '各項目に緑のチェックと、今日ではなく滞在した日の日付が付きます。ツールチップには「Dawarich の記録からチェックを付けました」と表示されます。日付をクリックすると取り消せます。',
  'help.guide.dawarich-wishes.tip.1':
    '通り過ぎただけでは数えられません。場所の近くで、ある程度の時間滞在する必要があります。条件に合う滞在が複数あれば、一番長いものが使われます。座標のない項目は照合できないので、名前だけでなく、「場所を追加」の検索から場所を追加してください。',
  'help.guide.dawarich-wishes.tip.2':
    '1回の確認で調べるのは最大50件で、まだチェックが付いていないものから順に調べます。それ以上ある場合はその旨が表示されます。すでにチェックが付いていた項目は、元の日付のままです。',

  // ── Screen: collections ───────────────────────────────────────────────────────────────
  'help.ctx.collections.title': 'コレクション',
  'help.ctx.collections.summary':
    '「コレクション」は、旅行とは別の自分のライブラリです。見つけて残しておきたい場所を、名前付きのリストにまとめられます。各場所には「アイデア」「行きたい」「訪問済み」のステータスがあり、ツアーがオンなら、旅行から保存したツアーも入れられます。場所とツアーは旅行との間でコピーされるだけでリンクはされないため、リストと旅行が互いに影響し合うことはありません。',
  'help.ctx.collections.bullet.1':
    '左のリストの列には、自分のリスト、共有されたリスト、まだ返事をしていない招待、自分が所有するリストの内容をまとめた「すべての保存済み」が表示されます。上部に「新しいリスト」とファイルのインポートがあります。',
  'help.ctx.collections.bullet.2':
    '開いているリストのヘッダーには、色、カバー、説明、リンク、メンバーが表示され、右側に「編集」（所有者のみ）、「エクスポート」、「共有」があります。ほかの人から共有されたリストでは、「共有」ボタンが共有済みの表示（「共有」）になります。',
  'help.ctx.collections.bullet.3':
    '場所の上のフィルター行：場所を追加する＋、「ステータス」「カテゴリ」「評価」「並び替え」のドロップダウン、「選択」のチェックボックスアイコン、「旅行から取り込む」のクラウドアイコンがあります。ラベルのフィルターは、地図を表示していないときだけこの行に表示されます。',
  'help.ctx.collections.bullet.4':
    '場所の行：写真、名前と住所、ラベルとカテゴリ、右側にステータスのピルがあります。ピルを1回クリックすると、次のステータスに変わります。',
  'help.ctx.collections.bullet.5':
    '右側の地図：座標のある場所ごとにピンが表示されます。上部のバーには、「地図を拡大」（地図が全画面になると「リストを表示」）、ラベルのフィルターとラベルを管理するボタン、「場所を検索」ボックスがあります。ピンをクリックすると、その場所が開きます。',
  'help.ctx.collections.bullet.6':
    '詳細シート：行をクリックすると、カバー、カテゴリ、ステータス、星の評価、ラベル、説明、リンクが表示されます。カバーのカメラアイコンで写真を変えられます。下部には「編集」「旅行にコピー」、ナビゲーションのボタン、「リストから削除」があります。',
  // create-list
  'help.guide.create-list.title': 'リストを作成する',
  'help.guide.create-list.goal': '色とカバーを付けた新しいリストに名前を付けて作り、場所を追加できるようにします。',
  'help.guide.create-list.step.1': 'リストのサイドバー上部にある「新しいリスト」をクリックします。',
  'help.guide.create-list.step.2':
    'リストに名前を付けて色を選びます。カバー画像、説明、リンクは任意で、あとから「編集」で追加できます。',
  'help.guide.create-list.step.3': '「作成」をクリックします。',
  'help.guide.create-list.result': '空のリストが開きます。「場所を追加」か「旅行から取り込む」で場所を追加できます。',
  'help.guide.create-list.tip.1':
    'カバーには、自分でアップロードした画像か、同じダイアログのUnsplash検索で見つけた写真を使えます。',
  // add-place
  'help.guide.add-place.title': '場所を追加する',
  'help.guide.add-place.goal':
    '場所を探し、名前、カテゴリ、ステータス、メモを付けて、開いているリストに一度に保存します。',
  'help.guide.add-place.step.1':
    '場所の上のフィルター行の先頭にある＋をクリックします。まだ空のリストでは、ページ中央の「場所を追加」をクリックします。',
  'help.guide.add-place.step.2': '検索欄に場所を入力し、結果を選びます。名前、住所、座標が結果から入力されます。',
  'help.guide.add-place.step.3':
    'ステータスを設定し、必要ならカテゴリ、説明、リンクも入力して「追加」をクリックします。ダイアログは次の場所のために開いたままです。「キャンセル」で閉じます。',
  'help.guide.add-place.result': '場所がリストに追加され、座標がある場合は地図にピンが表示されます。',
  'help.guide.add-place.tip.1':
    '旅行の中からも、場所の詳細や場所のメニューにある「コレクションに保存」で、旅行を離れずに旅行の場所をリストに追加できます。',
  'help.guide.add-place.tip.2':
    '追加できるのは、自分のリストか、自分が編集者か管理者のリストだけです。「すべての保存済み」や閲覧だけのリストには＋がありません。',
  // import-from-trip
  'help.guide.import-from-trip.title': '旅行から場所を取り込む',
  'help.guide.import-from-trip.goal': '場所をひとつずつ保存する代わりに、旅行の場所をまとめてリストに取り込みます。',
  'help.guide.import-from-trip.step.1':
    'フィルター行にある、雲と矢印のインポートボタンをクリックします。空のリストでは、同じボタンが「場所を追加」の隣にあります。',
  'help.guide.import-from-trip.step.2': '自分の旅行を1つ選びます。',
  'help.guide.import-from-trip.step.3':
    '取り込みたい場所にチェックを入れます。すでにリストにある場所はグレー表示です。旅行のどの日にも入っていない場所は、最初から選択されています。すべての場所がいずれかの日に入っている場合は、新しい場所がすべて選択されます。「新しいものだけ」にすると、リストにすでにある場所が非表示になります。',
  'help.guide.import-from-trip.step.4':
    '「インポート」をクリックします。ボタンには、追加される件数が常に表示されます。',
  'help.guide.import-from-trip.result':
    '場所が名前、住所、座標、説明、カテゴリ付きでリストにコピーされます。旅行は変わりません。',
  'help.guide.import-from-trip.tip.1':
    '名前や座標が重複する場所は自動でスキップされるので、2回インポートしても問題ありません。',
  'help.guide.import-from-trip.tip.2':
    '旅行の場所一覧では、選択モードの「コレクションに保存」を使って、自分で選んだ場所だけを保存することもできます。',
  // place-status
  'help.guide.place-status.title': '場所のステータスを設定する',
  'help.guide.place-status.goal': 'アイデア段階のもの、候補に残したもの、訪れた場所を管理します。',
  'help.guide.place-status.step.1':
    '場所の行の右端にあるステータスをクリックします。「アイデア」が「行きたい」に変わります。',
  'help.guide.place-status.step.2':
    'もう一度クリックすると「訪問済み」に、さらにもう一度クリックすると「アイデア」に戻ります。',
  'help.guide.place-status.result':
    'ピルとその色がすぐに変わり、一覧の上のステータスのフィルターの件数も更新されます。',
  'help.guide.place-status.tip.1':
    'ステータスがあるのはコレクションだけです。場所を旅行にコピーしても、ステータスはコピーされません。',
  'help.guide.place-status.tip.2':
    '旅行から「コレクションに保存」を開くと、「リストに保存」に、その場所が入っているリストごとのステータスのピルが表示されます。場所パネルの選択バーには「リストで訪問済みにする」もあります。',
  // place-detail
  'help.guide.place-detail.title': '保存した場所を開く',
  'help.guide.place-detail.goal':
    '場所の情報をすべて確認し、編集、旅行へのコピー、道順の確認、削除などの操作をします。',
  'help.guide.place-detail.step.1':
    '場所の行をクリックします。一覧の横に詳細シートが開き、地図がその場所に移動します。',
  'help.guide.place-detail.step.2':
    '下部には「編集」「旅行にコピー」、地図アプリで場所を開くナビゲーションのボタン、「リストから削除」があります。カバーのカメラアイコンで、自動で設定された写真を自分の写真に差し替えられます。',
  'help.guide.place-detail.result':
    '「編集」を使うと、名前、カテゴリ、ラベル、住所、座標、説明、リンクをシート上で直接変更できます。',
  'help.guide.place-detail.tip.1':
    '場所に画像がない場合、カバーは自動で取得されます。自分でアップロードできるのは20 MBまでのJPG、PNG、GIF、WebP、HEICです。カメラの横のゴミ箱アイコンで、自動の写真に戻せます。',
  'help.guide.place-detail.tip.2':
    '自分を含むメンバー全員が、ステータスの下で星の評価を付けられます。フィルター行の「評価」のフィルターは、その平均を使います。',
  // labels
  'help.guide.labels.title': 'ラベルで場所を分類する',
  'help.guide.labels.goal': '共通のカテゴリに加えて、地区や日にちなど、リスト独自のラベルを付けます。',
  'help.guide.labels.step.1':
    '地図の上のラベルの横にある「ラベルを追加」（ラベルがあるリストでは「ラベルを管理」）をクリックします。地図が表示されていない場合、このボタンはフィルター行の右端にあります。',
  'help.guide.labels.step.2':
    '名前を入力し、色を選んで「ラベルを追加」をクリックします。既存のラベルの名前変更、色の変更、削除も同じダイアログでできます。',
  'help.guide.labels.step.3':
    '「選択」をオンにして場所にチェックを入れ、選択バーの「ラベルを割り当て」をクリックします。ラベルを選び、「ラベルを割り当て」で確定します。1か所だけなら、詳細シートの「編集」からもラベルを付けられます。',
  'help.guide.labels.step.4':
    '地図の上のラベルを1つ以上クリックすると、そのいずれかのラベルが付いた場所だけが一覧と地図に表示されます。もう一度クリックすると、そのラベルがフィルターから外れます。',
  'help.guide.labels.result':
    'ラベルを付けた場所は、行にラベルが表示されます。ラベルのフィルターは、閲覧者を含むメンバー全員が使えます。',
  'help.guide.labels.tip.1': 'ラベルは作成したリストだけのものです。場所を別のリストに移すと、ラベルは外れます。',
  'help.guide.labels.tip.2': 'ラベルの管理と割り当てには、リストの編集権限が必要です。',
  // filter-select
  'help.guide.filter-select.title': '場所を絞り込んで選択する',
  'help.guide.filter-select.goal': 'リストを絞り込み、複数の場所をまとめて変更します。',
  'help.guide.filter-select.step.1':
    'フィルター行のドロップダウンで、ステータス、カテゴリ、最低評価、並び順を選びます。ステータスとカテゴリには、それぞれの選択肢に当てはまる場所の数が表示されます。',
  'help.guide.filter-select.step.2':
    'ドロップダウンの後ろにあるチェックボックスアイコン「選択」をクリックします。各行にチェックボックスが付き、選択バーが表示されます。',
  'help.guide.filter-select.step.3':
    '場所にチェックを入れるか、「すべて選択」でフィルターに表示中の場所をすべて選び、「ラベルを割り当て」「リストに移動」「リストに複製」「旅行にコピー」「削除」から選びます。移動と削除ができるのは、リストの所有者か管理者だけです。',
  'help.guide.filter-select.result':
    '操作は選択したすべての場所にまとめて適用されます。右側の × で選択モードを終了します。',
  'help.guide.filter-select.tip.1':
    '「すべて選択」で選ばれるのは、フィルターに一致する場所だけです。「行きたい」の場所すべてを操作するには、「行きたい」で絞り込んでから「すべて選択」をクリックします。',
  // copy-to-trip
  'help.guide.copy-to-trip.title': '場所を旅行にコピーする',
  'help.guide.copy-to-trip.goal': '保存した場所を、自分の旅行の立ち寄り先として追加します。',
  'help.guide.copy-to-trip.step.1':
    '「選択」をオンにして場所にチェックを入れるか、場所を1つ開いて詳細シートの「旅行にコピー」を使います。',
  'help.guide.copy-to-trip.step.2': '選択バーの「旅行にコピー」をクリックします。',
  'help.guide.copy-to-trip.step.3': '旅行を選びます。一覧が長いときは検索ボックスで絞り込めます。',
  'help.guide.copy-to-trip.result':
    '場所が、名前、説明、カテゴリ、メモ、価格、座標、写真、タグとともに、その旅行の場所リストに追加されます。コレクションは何も変わりません。',
  'help.guide.copy-to-trip.tip.1':
    '共有リストの閲覧者もこの操作ができます。リストの場所をコピーするだけで、リストは変わりません。',
  // share-list
  'help.guide.share-list.title': 'リストを共有する',
  'help.guide.share-list.goal': 'このTREKのほかの人と、リアルタイムでリストを一緒に作ります。',
  'help.guide.share-list.step.1': '自分のリストの上部にある「共有」をクリックします。',
  'help.guide.share-list.step.2': 'ユーザーを選び、役割を「閲覧者」「編集者」「管理者」から選びます。',
  'help.guide.share-list.step.3':
    '「招待を送信」をクリックします。相手がリストのレールか通知から招待を承認するまで、保留中と表示されます。',
  'help.guide.share-list.result':
    '相手が承認すると、相手の「共有」にリストが表示され、変更はすべてリアルタイムで同期されます。メンバーと役割は、同じダイアログで引き続き編集できます。',
  'help.guide.share-list.tip.1':
    '「閲覧者」は、場所の閲覧、評価、自分の旅行へのコピーができます。「編集者」は、場所とラベルの追加・編集ができます。「管理者」は、移動と削除もできます。',
  'help.guide.share-list.tip.2':
    'メンバーを招待したり外したりできるのはオーナーだけです。メンバーは自分で共有リストから抜けられます。',
  // export-list
  'help.guide.export-list.title': 'リストをファイルにエクスポートする',
  'help.guide.export-list.goal': '別のTREKサーバーを使っている人にリストを渡したり、地図アプリで開いたりします。',
  'help.guide.export-list.step.1': 'リストの上部にある「エクスポート」をクリックします。',
  'help.guide.export-list.step.2':
    'ほかのTREKでラベルとステータスごと使うなら「TREK リスト」、OsmAnd、Organic Maps、Garminなどウェイポイントを読み込めるアプリで使うならGPXを選びます。',
  'help.guide.export-list.result':
    'ファイルがダウンロードされます。共有リストのメンバーなら誰でもエクスポートできます。',
  'help.guide.export-list.tip.1':
    '座標のない場所は GPX のウェイポイントにできないため除外され、除外された件数が TREK に表示されます。',
  'help.guide.export-list.tip.2':
    '評価、メンバー、アップロードした写真は、あえてエクスポートしません。これらはリストではなく、この TREK に属するデータだからです。',
  // import-file
  'help.guide.import-file.title': 'ファイルからリストをインポートする',
  'help.guide.import-file.goal':
    'TREKのリストファイルかGPXファイルを、新しいリストとして、または既存のリストにインポートします。',
  'help.guide.import-file.step.1':
    'リストのレールで、「新しいリスト」の横にある上向き矢印のインポートボタンをクリックします。',
  'help.guide.import-file.step.2':
    'ファイルを選びます。インポートする前に、ファイルの内容（名前、場所の数、ラベルの数）が表示されます。',
  'help.guide.import-file.step.3':
    '「新しいリスト」のままにして必要なら名前を変え、「インポート」をクリックします。または「リストに追加」を選んで編集できるリストに場所を入れ、「リストに追加」をクリックします。',
  'help.guide.import-file.result':
    'インポートした場所が入った状態でリストが開きます。リストへのインポートでは場所が追加されるだけです。すでにある場所のステータス、メモ、ラベルは変わりません。',
  'help.guide.import-file.tip.1':
    'GPX からは、名前のあるウェイポイントがすべて場所になります。トラックは線なので除外され、除外された点の数がプレビューに表示されます。',
  'help.guide.import-file.tip.2':
    'TREK リストでも GPX でもないファイルは読み込めず、その理由が表示されます。読み取れない場所が1つあっても、スキップされるのはその場所だけで、ファイル全体ではありません。',
  // edit-list
  'help.guide.edit-list.title': 'リストを編集・削除する',
  'help.guide.edit-list.goal': 'リストの名前、色、カバー、説明、リンクを変更したり、リストを削除したりします。',
  'help.guide.edit-list.step.1': 'リストの上部にある「編集」をクリックします。所有者にだけ表示されます。',
  'help.guide.edit-list.step.2':
    '必要な項目を変更して「保存」をクリックします。左下のゴミ箱アイコン「リストを削除」を使うと、確認後にリストとその場所がすべて削除されます。',
  'help.guide.edit-list.result': '上部のヘッダーに、新しい色、カバー、説明がすぐに反映されます。',
  'help.guide.edit-list.tip.1': 'リストの削除は元に戻せません。コピーを残したい場合は、先にエクスポートしてください。',
  // all-saved
  'help.guide.all-saved.title': 'ライブラリ全体を検索する',
  'help.guide.all-saved.goal': '自分が持っているすべてのリストの場所を、まとめて表示します。',
  'help.guide.all-saved.step.1':
    'リストのレールで「すべての保存済み」をクリックします。自分が所有または共同所有しているすべてのリストの場所が1つの画面にまとめて表示されます。',
  'help.guide.all-saved.step.2':
    '地図の上の「場所を検索」に入力し、ほかのリストと同じようにフィルターを使います。ここでも「選択」が使え、リストをまたいで移動、複製、旅行へのコピー、削除ができます。',
  'help.guide.all-saved.result':
    '保存したすべての場所がまとめて表示されます。追加先のリストが1つに決まらないため、ここでは場所の追加やインポートはできません。',
  'help.guide.all-saved.tip.1':
    'ラベルと保存したツアーはリストごとのものなので、「すべての保存済み」ではどちらも使えません。',

  // ── Screen: journey ───────────────────────────────────────────────────────────────────
  'help.ctx.journey.title': '日記',
  'help.ctx.journey.summary':
    '「日記」は写真が主役の旅日記です。日記はそれぞれ1つ以上の旅行にリンクし、ストーリー、写真、気分、天気を入れたエントリーを1日ずつ書いていきます。この画面には日記が一覧され、開くと書き始められます。',
  'help.ctx.journey.bullet.1':
    '上部のバナーには、進行中の日記か最新の日記が、エントリー、写真、場所の数と一緒に表示されます。「続けて書く」で今日の日付から開きます。旅行が終わった直後は、その上に「旅行が終了しました」バナーが表示され、その旅行を日記にすることを提案します。',
  'help.ctx.journey.bullet.2':
    '「すべての日記」の下に、日記ごとのカードがカバー、ステータス、日付、件数付きで並びます。バナーに表示中の日記は、ここには表示されません。カードをクリックすると開きます。',
  'help.ctx.journey.bullet.3': 'グリッドの最後のカード「新しい日記を作成」で、旅行から日記を作成できます。',
  // create-journey
  'help.guide.create-journey.title': '日記を作成する',
  'help.guide.create-journey.goal': '旅行の日記を始めます。旅行の場所は、すでに提案として追加されています。',
  'help.guide.create-journey.step.1': 'グリッドの最後のカード「新しい日記を作成」をクリックします。',
  'help.guide.create-journey.step.2':
    '名前と、必要ならサブタイトルを入力し、関係する旅行にチェックを入れます。追加される場所の数がカウンターに表示されます。',
  'help.guide.create-journey.step.3': '「日記を作成」をクリックします。',
  'help.guide.create-journey.result':
    '日記が開きます。リンクした旅行のすべての場所が、予定されている日ごとに1回ずつ、提案としてタイムラインに表示されます。それぞれについてエントリーを書けます。',
  'help.guide.create-journey.tip.1': '旅行は、あとから「日記設定」で追加でリンクできます。',
  'help.guide.create-journey.tip.2': '旅行にリンクしない日記も作れます。その場合は、エントリーを手動で追加します。',
  // open-journey
  'help.guide.open-journey.title': '日記を開く',
  'help.guide.open-journey.goal': '日記を開き、どこから表示されるかを確認します。',
  'help.guide.open-journey.step.1':
    'カードをクリックします。各カードには、カバー、日付、日記に含まれるエントリー・写真・場所の数が表示されています。',
  'help.guide.open-journey.result':
    '進行中の日記は今日の日付で開きます。今日の分がまだない場合は、今日より前の最後のエントリーで開きます。終わった日記は最初から開きます。',
  'help.guide.open-journey.tip.1': '「日記設定」でカバーを設定しない場合は、日記の最初の写真がカバーになります。',
  // continue-writing
  'help.guide.continue-writing.title': '進行中の日記の続きを書く',
  'help.guide.continue-writing.goal': '進行中の日記の今日のページを直接開きます。',
  'help.guide.continue-writing.step.1':
    '上部のバナーにある「続けて書く」をクリックします。バナーには進行中の日記が表示されます。進行中のものがなければ、最新の日記が表示されます。',
  'help.guide.continue-writing.result':
    '日記が今日のページで開きます。今日まだ何も書いていなければ、今日より前の最後のエントリーで開きます。',
  'help.guide.continue-writing.tip.1':
    '旅行が終わった直後は、この上に「旅行が終了しました」バナーが表示されます。「日記を作成」でその旅行を選んだ状態の日記を始められ、「閉じる」でこのブラウザーではこの案内が表示されなくなります。',

  // ── Screen: journey-detail ────────────────────────────────────────────────────────────
  'help.ctx.journey-detail.title': '日記',
  'help.ctx.journey-detail.summary':
    '開いている日記です。左に日ごとのタイムライン、右に地図があり、地図では予定、記録、エントリー、写真のレイヤーを切り替えられます。ヘッダーには件数、Studio、提案のスイッチ、「日記設定」を開く⋯があります。その下のツールバーでエントリーを追加します。',
  'help.ctx.journey-detail.bullet.1':
    'ヘッダー：戻る矢印とステータスのバッジ、カバー、タイトルとサブタイトル、日・場所・エントリー・写真の数、右側にStudio、提案の表示・非表示を切り替える目のアイコン、「日記設定」を開く⋯があります。',
  'help.ctx.journey-detail.bullet.2':
    'ツールバー：「タイムライン」と「ギャラリー」のタブ、「この旅を検索」、「エントリーを追加」があります。「ギャラリー」では「エントリーを追加」の代わりに「アップロード」が表示されます。',
  'help.ctx.journey-detail.bullet.3':
    'タイムライン：日ごとのセクションに、日の番号、場所の数、その日にエントリーを追加する＋があります。その下に、写真、気分、天気、ストーリー付きのエントリーカードと、旅行からの提案を示す破線のカードが並びます。提案カードは×で非表示にできます。',
  'help.ctx.journey-detail.bullet.4':
    'マップ：上部のレイヤーバーで、「予定」（白抜きのピンと旅行のGPXルートの破線）、「記録」（Dawarichから保存したルートの実線）、「エントリー」（日の色のピンを日付順に細い破線でつないだもの）、「写真」を切り替えます。横の(i)で、すべての記号の意味を確認できます。',
  'help.ctx.journey-detail.bullet.5':
    '「日記設定」（⋯）：カバー、名前とサブタイトル、ステータス、GPXトラック、記録された日、写真から作る場所、エントリーの項目、非表示にした提案、同期した旅行、参加者と、旅行のどのメンバーにアクセスを許可するか、公開共有、アーカイブ、削除。',
  'help.ctx.journey-detail.bullet.6':
    '長いタイムラインの下部には、「先頭へ戻る」、好きな日やエントリーへ移動できる日数表示、「最後の記録へ」があります。',
  // add-entry
  'help.guide.add-entry.title': 'エントリーを書く',
  'help.guide.add-entry.goal': 'タイトル、本文、気分、天気を入れて、1日の出来事を書きます。',
  'help.guide.add-entry.step.1':
    'ツールバーの「エントリーを追加」をクリックします。特定の日に追加するなら、その日のヘッダーの右端にある＋をクリックします。',
  'help.guide.add-entry.step.2':
    'エントリーにタイトルを付け、本文を書きます。本文の上のツールバーで、太字、斜体、見出し、引用、リンク、リストをMarkdownで追加できます。',
  'help.guide.add-entry.step.3': '右の列で日付と時刻を確認し、場所を検索するか現在地を使い、気分と天気を選びます。',
  'help.guide.add-entry.step.4': '「保存」をクリックします。',
  'help.guide.add-entry.result':
    'エントリーがタイムラインのその日と、マップ上のピンとして表示されます。ヘッダーの数も更新されます。',
  'help.guide.add-entry.tip.1': '提案に書き込むときも同じエディターを使い、場所はあらかじめ設定されています。',
  'help.guide.add-entry.tip.2':
    '場所のあるエントリーには「ルートから除外」があります。エントリーは日記に残りますが、距離と国には数えられず、Studioの地図にも表示されません。',
  // entry-photos
  'help.guide.entry-photos.title': 'エントリーに写真と動画を追加する',
  'help.guide.entry-photos.goal': '日に写真を追加します。最初の写真がエントリーのカバーになります。',
  'help.guide.entry-photos.step.1': 'カードの⋯からエントリーのメニューを開き、「編集」を選びます。',
  'help.guide.entry-photos.step.2':
    '「写真をアップロード」をクリックしてファイルを選びます。「ギャラリーから」では日記のギャラリーにある写真を選べます。「外部の写真」では、接続しているImmichかSynologyのライブラリからその日の写真を検索します。',
  'help.guide.entry-photos.step.3':
    '写真にカーソルを合わせて「1番目にする」をクリックしてカバーを選び、「保存」をクリックします。',
  'help.guide.entry-photos.result': '写真がカードとギャラリーに表示されます。1枚目がどこでもサムネイルになります。',
  'help.guide.entry-photos.tip.1':
    '動画も同じ方法でエントリーに追加できます。mp4、m4v、webm、mov で、500 MB まで対応しています。動画は変換されずにそのまま保存されます。',
  'help.guide.entry-photos.tip.2':
    'iPhone の HEIC ファイルはアップロード時に JPEG に変換され、GPS とカメラのメタデータは削除されます。',
  // suggestions
  'help.guide.suggestions.title': '提案を使う・見送る',
  'help.guide.suggestions.goal': '旅行の場所をエントリーにし、書かない提案は非表示にします。',
  'help.guide.suggestions.step.1':
    '提案は、破線の枠と「エントリーを追加」ボタンが付いたカードで、リンクした旅行の場所を計画した日に表示します。クリックすると、場所と日が入った状態でエディターが開きます。',
  'help.guide.suggestions.step.2':
    '使わないカードの右端の×をクリックします。カードはタイムラインから消えますが削除はされず、旅行の同期で再び提案されることもありません。',
  'help.guide.suggestions.step.3':
    'やはり使いたくなった場合は、ヘッダーの⋯から「日記設定」を開きます。「見送った提案を戻す」に件数が表示され、すべての提案を元に戻せます。',
  'help.guide.suggestions.result':
    'タイムラインには、書きたいエントリーだけが残ります。読んでいる間は、ヘッダーの目のアイコンで提案をまとめて非表示にできます。',
  'help.guide.suggestions.tip.1': '2日に計画されている場所は、それぞれの日に提案が表示されます。',
  'help.guide.suggestions.tip.2': '提案は統計に含まれません。数えられるのは書いたエントリーだけです。',
  // add-on-day
  'help.guide.add-on-day.title': '過去の日にエントリーを追加する',
  'help.guide.add-on-day.goal': '過去の日について、あとから日付を直さずに書きます。',
  'help.guide.add-on-day.step.1': 'その日のヘッダーの右端にある＋をクリックします。',
  'help.guide.add-on-day.step.2': 'その日付が設定された状態でエディターが開きます。いつもどおり書いて「保存」します。',
  'help.guide.add-on-day.result': 'エントリーがすぐに正しい日に追加されます。',
  'help.guide.add-on-day.tip.1':
    '1日の中で順番を変えるには、エントリーにカーソルを合わせます。左側に「上へ移動」と「下へ移動」が表示されます。',
  // pros-cons
  'help.guide.pros-cons.title': '評価を追加する',
  'help.guide.pros-cons.goal': '1日を、良かったことと良くなかったことでまとめます。',
  'help.guide.pros-cons.step.1':
    'エディターで、本文の下にある「良かった点・気になった点」を探します。「良かった点」または「気になった点」に項目を入力し、次の項目は「追加」で加えます。',
  'help.guide.pros-cons.step.2':
    '保存します。カードの「もっと見る」で、ストーリーと評価が2つの短いリストで表示されます。',
  'help.guide.pros-cons.result': '本文の下に良かった点と気になった点が表示され、ひと目でわかります。',
  'help.guide.pros-cons.tip.1':
    '評価を書かない日記なら、「日記設定」の「記録の項目」でこのセクションをオフにできます。',
  // search-journey
  'help.guide.search-journey.title': '長い日記の中を検索する',
  'help.guide.search-journey.goal': '何週間分ものエントリーをスクロールせずに、目的のエントリーを見つけます。',
  'help.guide.search-journey.step.1':
    'ツールバーの「この旅を検索」に入力します。入力するそばから、タイトル、ストーリー、場所、タグでタイムラインが絞り込まれます。アクセント記号や大文字・小文字は区別されません。',
  'help.guide.search-journey.step.2':
    '特定の日へ移動するには、タイムライン下部の「先頭へ戻る」と「最後の記録へ」の間にある日数表示をクリックします。',
  'help.guide.search-journey.result':
    'タイムラインが選んだ日やエントリーまでスクロールし、地図もその場所に移動します。検索ボックスを消去するまで、一致するエントリーだけが表示されます。',
  'help.guide.search-journey.tip.1':
    '進行中の日記は今日のページで開くので、たいていは今日のページが最初から表示されています。',
  'help.guide.search-journey.tip.2':
    'ヘッダーの目のアイコンで提案を非表示にすると、自分が書いたエントリーだけが表示されます。',
  // gallery-map
  'help.guide.gallery-map.title': 'ギャラリーとマップを見る',
  'help.guide.gallery-map.goal': '日記全体を、写真として、またマップ上の場所として見ます。',
  'help.guide.gallery-map.step.1':
    'ツールバーで「ギャラリー」に切り替えます。すべてのエントリーの写真と、ギャラリーに直接アップロードした写真が表示されます。クリックするとライトボックスで開きます。',
  'help.guide.gallery-map.step.2':
    '右の「アップロード」で写真をギャラリーに追加します。ImmichやSynologyを連携していれば、ライブラリ名のボタンからそこの写真を選べます。',
  'help.guide.gallery-map.result':
    'ピンはその日の色で表示され、日付順に細い破線で結ばれます。地図上部のレイヤーバーで、表示する内容を切り替えます。',
  'help.guide.gallery-map.tip.1':
    '旅行のGPXトラックは、地図の「予定」レイヤーに破線で表示されます。「日記設定」の「旅行のGPXトラックをすべて表示」でオフにできます。',
  'help.guide.gallery-map.tip.2':
    '「ギャラリー」と「マップ」の両方を共有している場合、位置情報のあるギャラリーの写真は公開マップにも表示されます。',
  // entry-fields
  'help.guide.entry-fields.title': 'エントリーの項目をオフにする',
  'help.guide.entry-fields.goal': 'エディターに、この日記で使う項目だけを表示します。',
  'help.guide.entry-fields.step.1': 'ヘッダー右上の⋯をクリックして、「日記設定」を開きます。',
  'help.guide.entry-fields.step.2': '「記録の項目」で「気分」「天気」「良かった点・気になった点」をオフにします。',
  'help.guide.entry-fields.result':
    'エディターにこれらの項目が表示されなくなります。書いた内容は消えません。項目をオンに戻すと、保存されていた内容が再び表示されます。共有した日記でも同じ項目が非表示になります。',
  'help.guide.entry-fields.tip.1': 'スイッチは日記ごとに設定するので、出張と休暇で内容を変えられます。',
  // link-trip
  'help.guide.link-trip.title': '別の旅行をリンクする',
  'help.guide.link-trip.goal': '2つ目の旅行の場所を、提案として日記に追加します。',
  'help.guide.link-trip.step.1': 'ヘッダー右上の⋯をクリックして、「日記設定」を開きます。',
  'help.guide.link-trip.step.2': '「同期中の旅行」で「旅行を追加」をクリックします。',
  'help.guide.link-trip.step.3': '名前か行き先で旅行を検索し、横の「リンク」をクリックします。',
  'help.guide.link-trip.result':
    '旅行の場所がそれぞれの日の提案としてタイムラインに表示され、GPXトラックと一緒に地図の「予定」レイヤーに追加されます。',
  'help.guide.link-trip.tip.1':
    'リンクした旅行の横のゴミ箱アイコンで、確認後にリンクを解除します。書いたエントリーは残ります。',
  'help.guide.link-trip.tip.2': '日のあるエントリーは、その日にいくつの旅行が重なっていても1回だけ数えられます。',
  // share-public
  'help.guide.share-public.title': '日記を一般公開する',
  'help.guide.share-public.goal': 'TREKのアカウントがない人に、閲覧専用のリンクを渡します。',
  'help.guide.share-public.step.1': 'ヘッダーの⋯から「日記設定」を開き、「公開共有」までスクロールします。',
  'help.guide.share-public.step.2': '「共有リンクを作成」をクリックします。',
  'help.guide.share-public.step.3':
    '訪問者に見せる内容を「タイムライン」「ギャラリー」「マップ」から選びます。「マップ」では、「旅行の予定」で計画した場所とルートを、「記録したルート」で記録した日のルートを追加できます。「コピー」でリンクをクリップボードにコピーします。',
  'help.guide.share-public.result':
    'リンクを知っている人が見られるのは、有効にしたセクションだけです。「記録の項目」でオフにした項目は、そこでも表示されません。',
  'help.guide.share-public.tip.1':
    '公開の地図に写真が表示されるのは、「ギャラリー」と「マップ」の両方がオンの場合だけです。「マップ」がオフの場合は、写真を送る前にサーバーが座標を削除します。',
  'help.guide.share-public.tip.2': '共有をやめるには、「コピー」の横の「リンクを削除」をクリックします。',
  // contributors
  'help.guide.contributors.title': '共同で書く',
  'help.guide.contributors.goal': 'ほかの旅行者が、自分のエントリーと写真を追加できるようにします。',
  'help.guide.contributors.step.1': 'ヘッダーの⋯から「日記設定」を開き、「参加者」を見つけます。',
  'help.guide.contributors.step.2': '「参加者を招待」をクリックし、名前またはメールアドレスでユーザーを検索します。',
  'help.guide.contributors.step.3': '「閲覧者」か「編集者」を選び、「招待」をクリックします。',
  'help.guide.contributors.result':
    '相手の一覧に日記が表示され、相手のエントリーには相手の名前が付きます。参加者を外すには、横の×をクリックします。',
  'help.guide.contributors.tip.1':
    '参加者に追加できるのは、このTREKにアカウントがある人です。それ以外の人には公開リンクを使います。',
  // studio
  'help.guide.studio.title': '日記をフォトブックにレイアウトする',
  'help.guide.studio.goal': '日記を印刷できるページにします。',
  'help.guide.studio.step.1': 'ヘッダーの「Studio」をクリックします。日記の上にデザイナーが開きます。',
  'help.guide.studio.step.2': '戻るときは、上部バーの右端にある × をクリックします。元の画面に戻ります。',
  'help.guide.studio.result':
    '左にサイドバーとそのパネル、作業エリアに見開き、右にプロパティがあります。自動レイアウトはエントリーからブックを作り、エクスポートは印刷用の PDF を作ります。',
  'help.guide.studio.tip.1': 'Studio を使うには、幅 1024 px 以上のウィンドウが必要です。スマートフォンでは使えません。',
  'help.guide.studio.tip.2':
    'ブックのアクセス権は日記と同じです。日記を閲覧できる人はブックを開け、日記を編集できる人はブックを保存できます。',
  // archive-journey
  'help.guide.archive-journey.title': '日記をアーカイブ・削除する',
  'help.guide.archive-journey.goal': '終わった日記を閉じるか、完全に削除します。',
  'help.guide.archive-journey.step.1': 'ヘッダー右上の⋯をクリックして、「日記設定」を開きます。',
  'help.guide.archive-journey.step.2':
    '一番下の「日記をアーカイブ」で日記を終了し、アーカイブ済みにします。「日記を復元」で元に戻せます。「削除」は、確認のあと、すべてのエントリーと写真ごと日記を削除します。',
  'help.guide.archive-journey.result': 'アーカイブした日記も閲覧・共有できます。今日の日付で開かなくなるだけです。',
  'help.guide.archive-journey.tip.1': '削除は元に戻せません。日記にリンクしていた旅行には影響しません。',
  'help.guide.archive-journey.tip.2': 'カバー、名前、サブタイトルは、同じダイアログの上部にあります。',
  'help.guide.journey-status.title': '日記のステータスを設定する',
  'help.guide.journey-status.goal': '旅行の日付に任せずに、日記を下書き、ライブ、完了のいずれかに自分で設定します。',
  'help.guide.journey-status.step.1': '日記のヘッダー右上の⋯をクリックして、「日記設定」を開きます。',
  'help.guide.journey-status.step.2':
    '「ステータス」で「下書き」「ライブ」「完了」のいずれかを選びます。選択はすぐに保存されます。',
  'help.guide.journey-status.result':
    '日記に選んだステータスが設定されます。「下書き」と「完了」はカードとヘッダーにバッジで表示され、「ライブ」の日記は日記一覧の上部のバナーに表示されます。',
  'help.guide.journey-status.tip.1':
    '「自動」にすると、再びリンクした旅行の日付に従います。リンクした旅行がなければ、自動の日記は下書きのままです。',
  'help.guide.journey-status.tip.2':
    '手動で設定したステータスは、旅行の日程が変わっても、自分で変更するまでそのままです。',

  // ── Screen: journey-studio ────────────────────────────────────────────────────────────
  'help.ctx.journey-studio.title': 'Studio',
  'help.ctx.journey-studio.summary':
    'TREK Studio は、日記を印刷できるフォトブックとしてレイアウトします。日記の上に開き、左にサイドバーとそのパネル、中央に作業中の見開き、右にそのプロパティが表示されます。自動レイアウトはエントリーから最初の下書きを作り、テーマはブックの色と書体を決め、アシスタントはページのデザインを一緒に考えます。その後は、あらゆるものを移動、トリミング、スタイル変更でき、すべての操作を元に戻せます。',
  'help.ctx.journey-studio.bullet.1':
    '上部バー：左に日記のカバーと名前。右には、このブックにほかに誰がいるか、保存済みかどうか、ページサイズ、元に戻す、やり直す、貼り付け、自動レイアウト、アシスタント、ヘルプ、エクスポート、そして Studio を閉じるボタンが並びます。',
  'help.ctx.journey-studio.bullet.2':
    '左のサイドバー：ページ、コンテンツ（日記の写真とエントリー）、レイアウト、要素（テキスト、図形、線、フレーム、アイコン、ステッカー）、旅（日記から作る数字、地図、国、マーク）、そして少し離れた位置にテーマとレイヤーがあります。',
  'help.ctx.journey-studio.bullet.3':
    '作業エリア：塗り足しと安全領域つきで現在の見開きを表示します。下のズームバーには、全体表示、ブック表示、この見開きをダウンロードがあります。',
  'help.ctx.journey-studio.bullet.4':
    '右のプロパティ：選択した要素に関するすべてを扱います。位置、サイズ、トリミングから、色、エフェクト、重なり順、ロックまでです。何も選択していないときは、ページの背景、テーマ、ページ番号、ドキュメントが表示されます。',
  'help.ctx.journey-studio.bullet.5':
    'ブックは印刷された本と同じ構成です。表紙、表紙の白い裏面の向かいにある単独の最初のページ、見開き、単独の最後のページ、裏表紙の順です。ページ番号は最初のページから数え、表示どおりに印刷されます。',
  'help.ctx.journey-studio.bullet.6':
    '複数の人が同時にデザインできます。ほかの人のカーソルが名前付きで表示されます。ほかの人が変更した版に保存しようとすると、相手の作業を上書きせずに競合が表示されます。',
  'help.ctx.journey-studio.bullet.7':
    'テーマ：ブック全体の見た目を一つにまとめます。紙、インク、3色のアクセント、書体、モチーフを含みます。テーマにリンクした要素は、テーマを変えるとそれに合わせて変わります。',
  'help.ctx.journey-studio.bullet.8':
    'アシスタント：管理者が AI を設定している場合、上部バーの吹き出しからアシスタントを開けます。ページのレイアウト、キャプションの作成、ブックのスタイル変更を一緒に行います。アシスタントによる変更は、すべて元に戻せる操作になります。',
  // studio-auto-layout
  'help.guide.studio-auto-layout.title': 'ブックを自動で作成する',
  'help.guide.studio-auto-layout.goal': '日記のエントリーと写真から、ワンクリックで最初の下書きを一通り作ります。',
  'help.guide.studio-auto-layout.step.1': '上部バーの「自動レイアウト」をクリックします。',
  'help.guide.studio-auto-layout.step.2':
    '「本全体」を選ぶと、タイトルとページ設定はそのままで、すべてのページが置き換わります。「このページ」は、画面に表示中の見開きだけを作り直します。これは、エントリーから作られた見開きでのみ選べます。',
  'help.guide.studio-auto-layout.step.3':
    'ページのサイドバーで仕上がりを確認します。前のほうがよければ、「元に戻す」でレイアウト全体を元に戻せます。',
  'help.guide.studio-auto-layout.result':
    'エントリーごとに1つの見開きが順番に作られ、写真、タイトル、本文が配置されます。各要素はエントリーにリンクしたままで、編集するまでエントリーの変更が反映されます。',
  'help.guide.studio-auto-layout.tip.1': 'どちらも通常の操作として元に戻せるので、気軽に試せます。',
  'help.guide.studio-auto-layout.tip.2':
    '自動レイアウトでエントリーにリンクした要素は、そのエントリーを編集すると更新されます。「プロパティ」で要素を変更すると、リンクは外れます。',
  // studio-pages
  'help.guide.studio-pages.title': '見開きを追加、移動、削除する',
  'help.guide.studio-pages.goal': '本を1ページずつ編集します。',
  'help.guide.studio-pages.step.1':
    'サイドバーでページを開きます。サムネイルがブックを順に表示します。表紙、最初のページ、見開き、最後のページ、裏表紙の順です。最初のページと最後のページは、製本された本を開いたときと同じように、表紙の白い裏面の隣に描かれます。',
  'help.guide.studio-pages.step.2':
    '一番下の「ページを追加」で、最後のページの前に新しい見開きが追加されます。2つのサムネイルの間にある + をクリックすると、その位置に挿入されます。',
  'help.guide.studio-pages.step.3':
    'サムネイルにカーソルを合わせると、操作が表示されます：「前へ移動」「後ろへ移動」「ページを複製」「ページを削除」。サムネイルをクリックすると、その見開きが作業エリアに開きます。',
  'help.guide.studio-pages.result':
    '表紙、最初と最後のページ、裏表紙は位置が固定です。新しい見開きは必ずその間に追加されます。',
  'help.guide.studio-pages.tip.1':
    '上部バーの「ブック表示」で、製本したときと同じように、ブック全体を紙面で表示します。',
  'help.guide.studio-pages.tip.2':
    'ページ番号は、何も選択していない状態で「プロパティ」の「ドキュメント」からオンにします。',
  // studio-layouts
  'help.guide.studio-layouts.title': '見開きにレイアウトを適用する',
  'help.guide.studio-layouts.goal': '見開きに、写真とテキストのフレームを配置した既成のレイアウトを適用します。',
  'help.guide.studio-layouts.step.1':
    'サイドバーでレイアウトを開きます。最初に並ぶのはデザイン済みのページで、ブックのテーマで仕上げた表紙や見開きがそのまま入っています。スタイルのチップで一つの雰囲気に絞れます。マイレイアウトと標準は、その下に同じグリッドで続きます。',
  'help.guide.studio-layouts.step.2':
    'レイアウトを1つクリックします。作業エリアの見開きにそのレイアウトのフレームが適用され、既存の写真とテキストがフレームに配置されます。',
  'help.guide.studio-layouts.result':
    '空のフレームはコンテンツ用の枠です。「コンテンツ」から写真をドラッグするか、「このページに追加」を使います。',
  'help.guide.studio-my-layouts.title': 'ページを自分のレイアウトとして保存する',
  'help.guide.studio-my-layouts.goal': 'ブックの別のページで作った配置を再利用します。',
  'help.guide.studio-my-layouts.step.1': 'ページを好みの配置に整えてから、サイドバーでレイアウトを開きます。',
  'help.guide.studio-my-layouts.step.2':
    'マイレイアウトの下にあるこのページをレイアウトとして保存をクリックします。ページがカードとしてリストに追加されます。',
  'help.guide.studio-my-layouts.tip.1':
    '別のページで自分のレイアウトをクリックすると、そのページの写真と文章はそのままに、同じ配置になります。',
  'help.guide.studio-my-layouts.result':
    'レイアウトはブックと一緒に保存され、同じ種類のページで使えます。表紙用は表紙に、見開き用は見開きに表示されます。',
  'help.guide.studio-layouts.tip.1': 'レイアウトの適用も、ほかの操作と同じように元に戻せます。',
  // studio-content
  'help.guide.studio-content.title': '写真とエントリーをページに配置する',
  'help.guide.studio-content.goal': '日記の写真とエントリーを見開きに追加します。',
  'help.guide.studio-content.step.1':
    'サイドバーの「内容」を開きます。「写真」には日記のすべての写真が、「エントリー」には本文付きのエントリーが表示されます。',
  'help.guide.studio-content.step.2':
    '写真を見開きや空のフレームにドラッグするか、その下の「このページに追加」をクリックします。「写真をアップロード」で、まだ日記にない写真を追加できます。「Immichから」や「Synologyから」で、接続したライブラリから選べます。',
  'help.guide.studio-content.step.3':
    'エントリーの下にある「タイトル」「本文」「場所」をクリックすると、そのテキストがテキスト要素としてページに配置されます。日付と座標はマークとして追加され、エントリーの写真もそこに一覧表示されます。',
  'help.guide.studio-content.result':
    'ドロップした写真は写真の要素になります。テキストは、編集するまでエントリーにリンクしたままです。',
  'help.guide.studio-theme.title': 'ブックにテーマを付ける',
  'help.guide.studio-theme.goal': 'ブック全体の色と書体を一度に設定します。',
  'help.guide.studio-theme.step.1':
    'サイドバーでテーマを開きます。各カードは、テーマを小さなページとして見せます。紙、書体、3色のアクセントカラーが並びます。',
  'help.guide.studio-theme.step.2':
    'テーマをクリックして試します。カードの下で、パレットの変更、ほかの書体の選択、モチーフや装飾の選択ができます。',
  'help.guide.studio-theme.step.3': '本に適用をクリックします。画面に表示中の見開きだけなら、このページに適用です。',
  'help.guide.studio-theme.tip.1':
    'テーマにリンクした要素はテーマの色と書体を使い、テーマを変えるとそれに従います。まだリンクされていないものもスタイル変更を使うと、残りを先にリンクします。',
  'help.guide.studio-theme.tip.2': '写真から色を取るは、日記の写真からパレットを作ります。',
  'help.guide.studio-theme.result':
    'ブック内のリンクされた色と書体がすべて一度に変わり、テーマの適用は元に戻せる1回の操作になります。',
  'help.guide.studio-content.tip.1': '「コンテンツ」上部の検索ボックスで、両方の一覧を絞り込めます。',
  'help.guide.studio-content.tip.2':
    'パソコンからファイルを作業エリアにドロップすると、アップロードと配置が一度にできます。',
  // studio-elements
  'help.guide.studio-elements.title': 'テキスト、図形、アイコン、ステッカーを追加する',
  'help.guide.studio-elements.goal': '写真や文章に加えて、見開きに装飾を追加します。',
  'help.guide.studio-elements.step.1':
    'サイドバーで要素を開きます。追加できるものは、テキスト、図形、線、フレーム、アイコン、ステッカーの6つのタブに分かれています。',
  'help.guide.studio-elements.step.2':
    'テキストスタイルかデザインされたタイトル、図形、線、空のフレーム、アイコン、ステッカーをクリックします。どれも見開きの中央に置かれるので、あとで動かせます。',
  'help.guide.studio-elements.result':
    'テキスト要素をダブルクリックすると入力できます。「プロパティ」で、フォント、太さ、サイズ、間隔、配置を設定できます。',
  'help.guide.studio-stickers.title': 'ステッカーで飾る',
  'help.guide.studio-stickers.goal': '名所や食べ物から動物や矢印まで、イラストを追加します。',
  'help.guide.studio-stickers.step.1': 'サイドバーで要素を開き、ステッカーを選びます。',
  'help.guide.studio-stickers.step.2': '言葉で検索するか棚を見て回り、ステッカーをクリックして見開きに置きます。',
  'help.guide.studio-stickers.tip.1': 'ステッカーを選択すると、プロパティでパーツの色を変えたり、反転したりできます。',
  'help.guide.studio-stickers.result': 'ステッカーは描画なので、どんなサイズでも鮮明なままです。',
  'help.guide.studio-elements.tip.1': 'フレームは空の写真枠です。写真はあとからドロップできます。',
  // studio-travel
  'help.guide.studio-travel.title': '地図、数字、国、マークを追加する',
  'help.guide.studio-travel.goal': '旅そのものを、ページ上のデザインされた要素に変えます。',
  'help.guide.studio-travel.step.1':
    'サイドバーで旅を開きます。追加できるものは、数字、地図、国、マークの4つのタブに分かれています。',
  'help.guide.studio-travel.step.2':
    '各カードは、あなたの日記の数字をテーマの色で見せます。まとめはポスター、チケット、道路標識、オドメーターで、地図は番号付きの立ち寄り地か国で切り出した形で、国はスタンプ、ポストカード、ピンで、日付や距離はスタンプ、タグ、リボンで表示されます。',
  'help.guide.studio-travel.step.3':
    'カードをクリックします。要素が見開きの中央に置かれるので、あとで動かしたりサイズを変えたりできます。',
  'help.guide.studio-travel.result':
    '要素が見開きに表示されます。プロパティで見た目を変えられ、数字、地図、国は日記が変わるたびに更新されます。',
  'help.guide.studio-text-effects.title': 'テキストにエフェクトを付ける',
  'help.guide.studio-text-effects.goal': '見出しに輪郭、影、カーブ、またはパターンで塗った文字を付けます。',
  'help.guide.studio-text-effects.step.1': 'ページ上のテキスト要素をクリックして選択します。',
  'help.guide.studio-text-effects.step.2':
    'プロパティでエフェクトを開き、輪郭、影、ハイライトを加えるか、文字をグラデーションやパターンで塗ります。配置では、行をカーブさせたり、ボックスに合わせたりできます。',
  'help.guide.studio-text-effects.tip.1':
    '収めるは、テキストがボックスに収まるまで縮小するので、長いタイトルもはみ出しません。',
  'help.guide.studio-text-effects.result':
    'エフェクトはテキストと一緒に描画されるので、印刷でも画面と同じに仕上がります。',
  'help.guide.studio-background.title': 'ページの背景を変える',
  'help.guide.studio-background.goal': 'ページを単色、グラデーション、パターンで塗るか、写真を下に敷きます。',
  'help.guide.studio-background.step.1':
    'ページの何もない部分をクリックして、何も選択されていない状態にします。プロパティの先頭にページの背景があります。',
  'help.guide.studio-background.step.2':
    '紙、単色、グラデーション、パターンのいずれかと色を選ぶか、背景に写真の下から写真をクリックします。',
  'help.guide.studio-background.tip.1': 'すべてのページに適用を使うと、ブックのすべてのページに同じ背景が付きます。',
  'help.guide.studio-background.result': '背景は塗り足しまで広がるので、ページの端まで印刷されます。',
  'help.guide.studio-layers.title': 'レイヤーで並べ替え、隠し、ロックする',
  'help.guide.studio-layers.goal': '見開き上のすべてを重なり順に表示して、そこで操作します。',
  'help.guide.studio-layers.step.1': 'サイドバーでレイヤーを開きます。リストの一番上がページの最前面です。',
  'help.guide.studio-layers.step.2':
    '行をドラッグして重なり順を変え、目のアイコンで要素を隠し、ロックでその場に固定します。複数を選んでグループ化すると、まとめて動かせます。',
  'help.guide.studio-layers.tip.1': '行をダブルクリックすると、要素に独自の名前を付けられます。',
  'help.guide.studio-layers.tip.2': '非表示の要素は PDF に含まれません。',
  'help.guide.studio-layers.result': '要素の多いページでも編集しやすく、仕上がった部分を誤って動かすこともありません。',
  'help.guide.studio-travel.tip.1':
    '地図の下にある立ち寄り地には、ルートのすべての立ち寄り地が並びます。たとえば自宅の空港など、地図や数字に入れたくないものはオフにします。',
  'help.guide.studio-travel.tip.2':
    '国の地図にはその国の立ち寄り地だけが表示されるので、旅が長いフライトで始まっていても、国がページいっぱいに広がります。',
  // studio-properties
  'help.guide.studio-properties.title': '選択したものを編集する',
  'help.guide.studio-properties.goal':
    'インスペクターで、要素の移動、トリミング、スタイル設定、重なり順の変更を行います。',
  'help.guide.studio-properties.step.1':
    '見開き上の要素をクリックします。サイズ変更と回転のハンドルが表示されます。ドラッグすると移動できます。',
  'help.guide.studio-properties.step.2':
    '右側の「プロパティ」には、選択中の要素の設定が表示されます。位置とサイズ、フレームに残す部分を焦点で決める「トリミング」、「フィル」または「フィット」、「ルック」フィルター、「角の半径」、「フレーム」のスタイル、重なり順、「ロック」です。',
  'help.guide.studio-properties.step.3':
    '「複製」と「削除」はインスペクターの上部にあります。上部バーの「元に戻す」で、これらの変更はどれも取り消せます。',
  'help.guide.studio-properties.result':
    'ロックした要素は、ページ上で選択も移動もできなくなります。ほかの要素を作業している間も、仕上がったレイアウトが崩れません。',
  'help.guide.studio-properties.tip.1':
    'Shift を押しながらクリックすると複数の要素を選択でき、インスペクターでまとめて編集できます。',
  'help.guide.studio-properties.tip.2':
    '自動レイアウトで配置した要素を編集すると、エントリーとのリンクが外れ、そのエントリーのあとの変更が反映されなくなります。',
  // studio-format
  'help.guide.studio-format.title': 'ページのサイズを選ぶ',
  'help.guide.studio-format.goal': 'レイアウトを作る前に、本の印刷サイズを決めます。',
  'help.guide.studio-format.step.1':
    '上部バーの編集ツールの隣にあるページサイズをクリックします。サイズの名前と形が表示されています。',
  'help.guide.studio-format.step.2':
    '「正方形 21 × 21 cm」「正方形 30 × 30 cm」、A4 または A5 の横向き・縦向きから選ぶか、幅と高さをミリ単位で入力します。塗り足しと安全マージンはその下で設定します。',
  'help.guide.studio-format.result':
    'すべての見開きがそのサイズで表示されます。初期設定では塗り足しが3 mm、安全領域が5 mmです。',
  'help.guide.studio-format.tip.1':
    '先に判型を変えてから、「自動レイアウト」を実行してください。「自動レイアウト」は、実行時に設定されている判型を使います。',
  'help.guide.studio-format.tip.2': '印刷所に塗り足しと安全領域の値を確認して、その値を入力してください。',
  // studio-export
  'help.guide.studio-export.title': 'ブックをPDFで書き出す',
  'help.guide.studio-export.goal': '印刷用のファイル、または画面で読むためのファイルを作ります。',
  'help.guide.studio-export.step.1': '上部バーの「エクスポート」をクリックします。',
  'help.guide.studio-export.step.2':
    '印刷所に入稿するなら、読む順に1枚1ページで出力する「単ページ」を選びます。本を開いたときのように2ページずつ出力するなら「見開き」です。「トンボ」を付けると、各辺に塗り足しが加わり、断裁位置が示されます。',
  'help.guide.studio-export.step.3':
    '「印刷ビュー」をクリックします。ブラウザーでページが開きます。「PDFとして保存」を選ぶと、ファイルが作成されます。',
  'help.guide.studio-export.result': '設定したページサイズで、ダイアログに表示された枚数のPDFが作成されます。',
  'help.guide.studio-export.tip.1': 'PDFは、Studioと同じくパソコンでしか作成できません。',
  'help.guide.studio-export.tip.2':
    '校正用にはトンボなしの「見開き」で、印刷所用にはトンボ付きの「単ページ」で書き出します。',
  // studio-spread-file
  'help.guide.studio-spread-file.title': '見開きを別の本で再利用する',
  'help.guide.studio-spread-file.goal': '気に入ったデザインを、ある日記の本から別の日記の本にコピーします。',
  'help.guide.studio-spread-file.step.1':
    '作業エリアに見開きを表示した状態で、ズームバー右端の「この見開きをダウンロード」をクリックします。ファイルに含まれるのはデザインだけで、写真は含まれません。',
  'help.guide.studio-spread-file.step.2':
    'もう一方の本で「ページ」を開き、「ページを追加」の隣の「インポート」をクリックして、ファイルを選びます。',
  'help.guide.studio-spread-file.result':
    '見開きがフレームとテキストスタイル付きでインポートされます。新しい日記の写真をフレームにドロップしてください。',
  'help.guide.studio-spread-file.tip.1': '見開きのデザインファイルでない場合は、理由とともに読み込みが拒否されます。',

  // ── Screen: settings (all tabs) ───────────────────────────────────────────────────────
  'help.ctx.settings.title': '設定',
  'help.ctx.settings.summary':
    '個人の設定です。左のサイドバーにトピックごとのタブがあります。ほとんどのスイッチは切り替えるとすぐに反映されます。「保存」ボタンのあるフォームは、「保存」をクリックしたときだけ保存されます。ここでの設定がほかの人のTREKに影響することはありません。',
  'help.ctx.settings.bullet.1':
    '左のサイドバー：「表示」「外観」「マップ」「通知」「連携」「オフライン」「アカウント」があります。「プラグイン」はプラグインが有効なときに表示されます。「情報」は運営者が非表示にしていなければ表示されます。下部にバージョンが表示されます。',
  'help.ctx.settings.bullet.2':
    '最初に開くのは「表示」です。言語、場所の名前の言語、単位、時刻形式、週の開始、表示通貨と、旅行の地図の動作を設定します。「外観」では、テーマ、色、読みやすさ、文字サイズ、ダッシュボードのウィジェットを設定します。',
  'help.ctx.settings.bullet.3':
    '「マップ」では地図エンジンとスタイルを選びます。「通知」では、どのイベントをどのチャンネルに送るかを設定します。「連携」では写真ライブラリ、AirTrail、Dawarich、wandererを接続でき、APIキーとMCPもここにあります。「オフライン」では、この端末に保存する内容を設定します。',
  'help.ctx.settings.bullet.4':
    '「アカウント」では、プロフィール、パスワード、二要素認証、パスキーを管理でき、アカウントを削除することもできます。',
  'help.ctx.settings-display.title': '表示',
  'help.ctx.settings-display.summary':
    'TREKを開いたときの画面、使う言語と単位、旅行の地図と予約の動作を設定します。変更はすべてすぐに反映されます。',
  'help.ctx.settings-display.bullet.1':
    '「起動」：「起動時の画面」で「ダッシュボード」か「進行中の旅行」を選びます。「進行中の旅行」の場合は、「起動時のタブ」でその旅行を開いたときのタブを選びます。',
  'help.ctx.settings-display.bullet.2':
    '言語と地域：「表示通貨」（換算しない場合は「旅行の通貨」）、「言語」「場所の名前」「温度単位」「距離単位」「時刻形式」「週の開始」があります。',
  'help.ctx.settings-display.bullet.3':
    '「旅行と地図」：「場所を開くアプリ」「日の見出しで日付を先に表示」「予約ルートのラベル」「予約ルートを常に表示」「未計画の場所を小さなマーカーで表示」「地図でスポットを探す」「予約コードをぼかす」「宿泊先を起点にルートを最適化」があります。',
  'help.ctx.settings-appearance.title': '外観',
  'help.ctx.settings-appearance.summary':
    'このアカウントでの TREK の見た目を設定します。ライトかダークか、アクセントカラー、ガラス効果とアニメーション、文字サイズ、ダッシュボードに表示するウィジェットです。変更はすぐに反映され、サインインしているどの端末にも適用されます。',
  'help.ctx.settings-appearance.bullet.1':
    'テーマ：「カラーモード」（「ライト」「ダーク」「自動」）、カラースキーム、「カスタム」ではライトモードとダークモードそれぞれの自分のアクセントカラーをコントラストの確認付きで設定できます。',
  'help.ctx.settings-appearance.bullet.2':
    '「実験的」と表示されている読みやすさの設定：透明度、動きを減らす、密度、「文字サイズ」があります。「文字サイズ」には「すべて」のスライダーと、大、中、「標準」、小のスライダーがそれぞれあります。',
  'help.ctx.settings-appearance.bullet.3':
    'ダッシュボードのウィジェット：デスクトップ（「ヒーローの下」「右サイドバー」）とモバイル（「ヒーローの下」「ページ下部」）で別々にスイッチがあります。',
  'help.ctx.settings-appearance.bullet.4': 'カードの下にある「既定に戻す」を押すと、タブ全体が初期値に戻ります。',
  'help.ctx.settings-map.title': 'マップ',
  'help.ctx.settings-map.summary':
    '旅行プランナーと日記の地図を描くエンジンと、そのスタイルを設定します。Leafletは従来のラスター地図です。Mapbox GLは自分のトークンを使って3Dの建物と地形を表示します。MapLibre GLはトークンなしでOpenFreeMapのベクタータイルを描きます。Atlasでは常にLeafletが使われます。',
  'help.ctx.settings-map.bullet.1':
    '「地図プロバイダー」：Leaflet、Mapbox GL（「実験的」）、MapLibre GLから選べます。それぞれに短い説明があります。',
  'help.ctx.settings-map.bullet.2':
    'Leaflet用の「地図テンプレート」と「CARTO API キー」、2つのGLエンジン用の「地図スタイル」、Mapbox GL用の「Mapbox アクセストークン」があります。',
  'help.ctx.settings-map.bullet.3':
    'Mapbox GLのみ：「3D建物・地形」と「高品質モード」があります。「地図を保存」の上にライブプレビューが表示され、「地図を保存」で選択内容を保存します。',
  'help.ctx.settings-notifications.title': '通知',
  'help.ctx.settings-notifications.summary':
    'アプリの外でTREKから届く通知の設定です。上部の表は、イベントごとの行とチャンネルごとの列で、何をどこに送るかを決めます。その下に、Webhook、ntfy、この端末のプッシュ、プラグインのチャンネルのカードがあります。',
  'help.ctx.settings-notifications.bullet.1':
    '「通知」：イベントごとにチャンネル別のオン・オフを切り替えます。鍵のマークは、管理者が全員に対してオフにしていることを示します。',
  'help.ctx.settings-notifications.bullet.2':
    'Webhook URL：Discord、Slack、またはカスタムのWebhookを入力し、「テスト」と「保存」を使います。',
  'help.ctx.settings-notifications.bullet.3':
    'Ntfy：「Ntfy トピック」、任意で「Ntfy サーバーURL」とアクセストークンを入力し、「テスト」と「保存」を使います。',
  'help.ctx.settings-notifications.bullet.4':
    '「このデバイスのプッシュ通知」：「このデバイスでオンにする」はこのブラウザーだけに適用されます。「テスト送信」でテスト通知を送れます。プラグインのチャンネルには、設定が済むまで「設定する」が表示されます。',
  'help.ctx.settings-integrations.title': '連携',
  'help.ctx.settings-integrations.summary':
    '外部からTREKにつなぐものすべてです。日記用の写真ライブラリ、フライト用のAirTrail、実際に行った場所を記録するDawarich、トレイル用のwanderer、ほかのソフトウェア向けの読み取り専用APIキー、AIクライアント向けのMCPがあります。ほかのサービスとの接続は、管理者がオンにしてから表示されます。',
  'help.ctx.settings-integrations.bullet.1':
    'ImmichとSynology Photos、AirTrail、Dawarich、wanderer：各カードにアドレスとキー、「保存」と「接続をテスト」、「接続済み」か「未接続」のバッジがあります。',
  'help.ctx.settings-integrations.bullet.2':
    '「APIキー」：公開API用の読み取り専用キーです。キーごとに読み取れる範囲を選べ、コピー用の「エンドポイント」も表示されます。',
  'help.ctx.settings-integrations.bullet.3':
    '「MCP設定」：「MCPエンドポイント」があり、「OAuth 2.1 クライアント」に登録したクライアント、コピー用の「クライアント設定」、「取り消し」付きの「有効なセッション」が表示されます。',
  'help.ctx.settings-integrations.bullet.4':
    '「API トークン」：MCPに接続する以前の方法で、「非推奨」と表示されています。代わりに「OAuth 2.1 クライアント」を使ってください。',
  'help.ctx.settings-offline.title': 'オフライン',
  'help.ctx.settings-offline.summary':
    'オフラインでも旅行を開けるように TREK がこの端末に保存するデータと、オフラインでの変更がほかの場所での変更と競合したときの動作について説明します。',
  'help.ctx.settings-offline.bullet.1':
    '「オフラインモード」：「オフラインモードを強制」では、先にすべてをダウンロードし、そのあとはキャッシュだけで動作して、変更は送信待ちになります。',
  'help.ctx.settings-offline.bullet.2':
    '「オフラインの準備」：「オフライン用にダウンロード」で旅行データ、ドキュメント、地図タイルをダウンロードします。「今すぐ再同期」で手動で同期し直します。',
  'help.ctx.settings-offline.bullet.3':
    '「オフラインで保存する内容」：「地図タイルをオフラインで保存」と、旅行ごとのスイッチがあります。終了した旅行は、オンにした場合だけ保存されます。',
  'help.ctx.settings-offline.bullet.4':
    '「同期の競合」は、2つの変更が競合したときだけ表示され、「自分の版」「サーバーの変更を保持」「競合が発生したとき」があります。「オフラインキャッシュ」には、旅行の数と、送信待ちや失敗した変更の数が表示され、「再試行」「キャンセル」「キャッシュを消去」があります。',
  'help.ctx.settings-account.title': 'アカウント',
  'help.ctx.settings-account.summary':
    'このTREKでのアカウントとサインイン方法です。プロフィール画像、ユーザー名とメール、パスワード、二要素認証、パスキーを設定できます。「アカウント削除」は「アカウント」カードの下部にあります。',
  'help.ctx.settings-account.bullet.1':
    '「アカウント」：写真のカメラアイコンをクリックして画像をアップロードし、赤いゴミ箱アイコンで削除します。「ユーザー名」と「メール」は「プロフィールを保存」で保存されます。',
  'help.ctx.settings-account.bullet.2':
    '「パスワード変更」：現在のパスワードと新しいパスワード（2回）を入力します。入力中に満たしたルールにチェックが付きます。最後に「パスワード更新」をクリックします。このTREKがSSOでしかサインインできない場合、このカードは表示されません。',
  'help.ctx.settings-account.bullet.3':
    '認証アプリとバックアップコードを使う「二要素認証（2FA）」、パスワードなしでサインインできる「パスキー」。',
  'help.ctx.settings-account.bullet.4':
    '「アカウント削除」は「アカウント」カードの下部の左側にあり、確認のあとで実行されます。管理者が1人だけの場合、その管理者は自分を削除できません。',
  // language-region
  'help.guide.language-region.title': '言語、単位、通貨を設定する',
  'help.guide.language-region.goal': 'TREK を自分の言語と、地域に合った表示形式で使います。',
  'help.guide.language-region.step.1':
    '「言語と地域」で、チップの列から「言語」を選びます。すぐに切り替わり、サインインしているすべての端末に反映されます。',
  'help.guide.language-region.step.2':
    '「場所の名前」で、場所の検索、候補、住所に使う言語を設定します。「アプリと同じ」では、画面の言語に合わせます。',
  'help.guide.language-region.result':
    '日付、距離、金額が見慣れた形式で表示されます。「費用」では金額が表示通貨で表示されますが、表示上だけで、入力した金額は変わりません。',
  'help.guide.language-region.tip.1': '「旅行の通貨」では、換算せずに各旅行をその旅行の通貨で表示します。',
  'help.guide.language-region.tip.2': '言語の設定は、Vacay と日記の曜日名や月名にも反映されます。',
  // travel-map-prefs
  'help.guide.travel-map-prefs.title': '旅行の地図と日の見出しを調整する',
  'help.guide.travel-map-prefs.goal': 'すべての旅行で、旅行の地図に表示する内容と日の見出しの表示を選びます。',
  'help.guide.travel-map-prefs.step.1':
    '「旅行と地図」の「場所を開くアプリ」で、ナビゲーションのボタンで直接開く地図アプリを選びます。「毎回確認する」では、毎回アプリを選べます。「日の見出しで日付を先に表示」をオンにすると、各日の見出しにカレンダーの日付が先に表示されます。',
  'help.guide.travel-map-prefs.step.2':
    '「予約ルートを常に表示」をオンにすると、飛行機、電車などすべての予約のルートが地図に表示されます。「予約ルートのラベル」では、両端に駅や空港の名前が表示されます。「未計画の場所を小さなマーカーで表示」では、まだ日に入っていない場所が小さく表示され、計画済みの立ち寄り先が見やすくなります。',
  'help.guide.travel-map-prefs.result': '旅行のマップは、次に変更するまで、すべての旅行でこの設定を使います。',
  'help.guide.travel-map-prefs.tip.1':
    'これは旅行ごとではなく、アカウントごとの設定です。共有している旅行でも、メンバーにはそれぞれ自分の設定で表示されます。',
  'help.guide.travel-map-prefs.tip.2':
    '管理者は全員の既定値を設定できますが、ここで切り替えた内容は自分にだけ適用されます。',
  // startup
  'help.guide.startup.title': 'TREKを開いたときの画面を選ぶ',
  'help.guide.startup.goal': '毎回ダッシュボードではなく、いちばんよく使う画面でTREKを開きます。',
  'help.guide.startup.step.1':
    '「表示」の上部にある「起動」で、「起動時の画面」を「ダッシュボード」か「進行中の旅行」にします。',
  'help.guide.startup.step.2':
    '「進行中の旅行」を選ぶと「起動時のタブ」が表示されます。その旅行を開いたときのタブを選びます。',
  'help.guide.startup.result': '次にTREKを開くと、そのページが直接開きます。',
  'help.guide.startup.tip.1':
    '「進行中の旅行」とは、今日行われている旅行か、次に始まる旅行のことです。ダッシュボードの上部に表示される旅行と同じです。',
  // theme-scheme
  'help.guide.theme-scheme.title': 'テーマとアクセントカラーを設定する',
  'help.guide.theme-scheme.goal': 'TREKをライト、ダーク、端末に合わせた表示にし、好きな色にします。',
  'help.guide.theme-scheme.step.1':
    '「テーマ」で「カラーモード」を「ライト」「ダーク」「自動」から選びます。「自動」では端末の設定に合わせます。',
  'help.guide.theme-scheme.step.2':
    'カラースキームを選びます：デフォルト、ハイコントラスト、インディゴ、ティール、ローズ、アンバー、バイオレット、「カスタム」。',
  'help.guide.theme-scheme.step.3':
    '「カスタム」では、色の点から1つ選ぶか、「ライト」と「ダーク」それぞれに自分のアクセントカラーを設定します。横のピルに「コントラスト良好」か「コントラスト不足」と表示されます。',
  'help.guide.theme-scheme.result':
    'ボタン、リンク、ハイライトのすべてにアクセントカラーが使われます。サインインしているどの端末でも同じです。',
  'help.guide.theme-scheme.tip.1':
    'ナビバーにも、ライトとダークをすぐに切り替えられるスイッチがあります。設定されるテーマは同じです。',
  'help.guide.theme-scheme.tip.2': 'デフォルトの配色が読みにくいときは、「ハイコントラスト」を選びましょう。',
  // readability
  'help.guide.readability.title': '読みやすさと文字サイズを調整する',
  'help.guide.readability.goal': '透明効果や動きを減らしたり、余白を広げたり、文字を大きくしたりします。',
  'help.guide.readability.step.1':
    '「読みやすさ」で、「透明度」はガラス風のパネルを不透明にし、「動きを減らす」はアニメーションを最小限にします。「密度」では「ゆったり」か「コンパクト」を選びます。',
  'help.guide.readability.step.2':
    '「文字サイズ」：「すべて」をドラッグしてすべての文字をまとめて拡大・縮小するか、大、中、「標準」、小を個別に設定します。サイズごとにサンプルが表示されるので、ドラッグしながら結果を確認できます。',
  'help.guide.readability.result': '地図のパネルや日記を含め、アプリ全体にすぐに反映されます。',
  'help.guide.readability.tip.1':
    '端末で動きを減らす設定にしていると、TREKの一部ではすでにアニメーションが控えめになります。「動きを減らす」をオンにすると、それ以外の部分のアニメーションも控えめになります。',
  'help.guide.readability.tip.2':
    '文字サイズはタイポグラフィの階層に沿って適用されるので、文字が切れることはありません。収まらない場合は折り返して表示されます。',
  // dashboard-widgets
  'help.guide.dashboard-widgets.title': 'ダッシュボードのウィジェットを選ぶ',
  'help.guide.dashboard-widgets.goal': '使うウィジェットだけを、デスクトップとスマートフォンで別々に表示します。',
  'help.guide.dashboard-widgets.step.1':
    '「ダッシュボードウィジェット」のデスクトップには、「ヒーローの下」と「右サイドバー」のウィジェットが並んでいます。「右サイドバー」をオフにすると、右の列全体が非表示になってダッシュボードが中央に寄り、その列のウィジェットはまたオンにするまで薄く表示されます。',
  'help.guide.dashboard-widgets.step.2':
    'モバイルには、スマートフォンのダッシュボード用に専用のスイッチ「ヒーローの下」と「ページ下部」があります。',
  'help.guide.dashboard-widgets.result':
    'ダッシュボードがすぐに変わります。右サイドバーをオフにすると、ダッシュボードは中央寄せになります。',
  'help.guide.dashboard-widgets.tip.1':
    'アドオンのウィジェットは、管理者がそのアドオンをオンにしている場合だけ表示されます。',
  'help.guide.dashboard-widgets.tip.2': 'ダッシュボードのグリッド表示・リスト表示と並び順は、端末ごとに保存されます。',
  // map-provider
  'help.guide.map-provider.title': '地図エンジンとスタイルを選ぶ',
  'help.guide.map-provider.goal': 'クラシックな地図、ベクタータイル、Mapbox の3D地図を切り替えます。',
  'help.guide.map-provider.step.1':
    '「地図プロバイダー」で選びます。好きなラスタータイルで使える従来の2D地図ならLeaflet、3Dの建物と地形を表示できるベクタータイルならMapbox GL、トークン不要のOpenFreeMapのベクタータイルならMapLibre GLです。',
  'help.guide.map-provider.step.2':
    'Leafletなら「地図テンプレート」、GLエンジンなら「地図スタイル」を選ぶか、自分のURLを貼り付けます。Mapbox GLには「Mapbox アクセストークン」、CARTOのテンプレートには「CARTO API キー」が必要です。各欄の下のリンクで入手方法を確認できます。',
  'help.guide.map-provider.step.3':
    'Mapbox GLでは「3D建物・地形」をオンにし、端末の性能に余裕があれば「高品質モード」もオンにします。プレビューを確認して、「地図を保存」をクリックします。',
  'help.guide.map-provider.result':
    '旅行プランナーと日記の地図が、選んだエンジンで表示されます。Atlasでは常にLeafletが使われます。',
  'help.guide.map-provider.tip.1': 'トークンがない場合、Mapbox GLは空の地図を表示する代わりにLeafletを使います。',
  'help.guide.map-provider.tip.2':
    'オフライン用に保存する地図タイルは、ダウンロード時に有効なプロバイダーのものになります。',
  // notification-channels
  'help.guide.notification-channels.title': '通知の受け取り先を設定する',
  'help.guide.notification-channels.goal':
    '旅行のリマインダーや共同作業の通知を、スマートフォンやほかのツールで受け取ります。',
  'help.guide.notification-channels.step.1':
    'Webhookの場合は、Discord、Slack、またはカスタムのWebhook URLを貼り付け、「テスト」をクリックしてから「保存」します。',
  'help.guide.notification-channels.step.2':
    'ntfyの場合は「Ntfy トピック」を入力します。自分でサーバーを運用している場合は、「Ntfy サーバーURL」とアクセストークンも入力します。「テスト」ですぐにメッセージが送られ、「保存」で設定が保存されます。',
  'help.guide.notification-channels.step.3':
    '上部の「通知」カードで、イベントごとにチャンネル別のオン・オフを切り替えます。鍵のマークは、管理者が全員に対してオフにしていることを示します。プラグインのチャンネルには、設定が済むまで「設定する」が表示されます。「テスト送信」で動作を試せます。',
  'help.guide.notification-channels.result':
    'イベントは、オンにしたチャンネルで届きます。「アプリ内」の列で、ナビゲーションバーのベルに表示する内容が決まります。',
  'help.guide.notification-channels.tip.1':
    '旅行ごとの「リマインダー」（出発の何日前か）は、旅行の編集フォームで設定します。',
  'help.guide.notification-channels.tip.2':
    '管理者が全員用の既定のntfyサーバーを設定している場合があります。その場合もトピックは自分で選びます。',
  // photo-providers
  'help.guide.photo-providers.title': '写真ライブラリを接続する',
  'help.guide.photo-providers.goal': '日記で、ImmichやSynology Photosからその日の写真を読み込めるようにします。',
  'help.guide.photo-providers.step.1':
    '「連携」でImmichかSynology Photosのカードを探し、必要な情報を入力します。Immichは「サーバーURL」と「APIキー」、Synology Photosは「ユーザー名」と「パスワード」です。Immichでは、日記に写真をアップロードしたときにImmichのライブラリにもコピーできます。',
  'help.guide.photo-providers.step.2':
    '「接続をテスト」をクリックし、「保存」します。バッジが「接続済み」に変わります。',
  'help.guide.photo-providers.result':
    'エントリーエディターの「外部の写真」タブで、接続したライブラリからエントリーの日の写真を探せます。エントリーの場所に近いものから順に表示されます。',
  'help.guide.photo-providers.tip.1':
    'この接続はあなたのアカウント専用です。日記のほかのメンバーは、それぞれ自分のライブラリを接続します。',
  'help.guide.photo-providers.tip.2':
    '写真に GPS データのないプロバイダーでも使えます。その場合、一覧は時刻順に並びます。',
  // api-keys
  'help.guide.api-keys.title': 'API キーを作成する',
  'help.guide.api-keys.goal': 'ほかのソフトウェアから、公開APIで自分の旅行を読み取れるようにします。',
  'help.guide.api-keys.step.1':
    '「APIキー」で「キーを作成」をクリックし、使い道がわかる「名前」を付けます。「このキーが読み取れる範囲」では、必要な項目だけを残します。最後に「作成」をクリックします。',
  'help.guide.api-keys.step.2':
    '「API キーを作成しました」でキーをコピーします。キーは一度しか表示されません。「完了」をクリックします。呼び出す「エンドポイント」は一覧の下に表示されます。',
  'help.guide.api-keys.result':
    'キーを持つソフトウェアは、選んだ範囲を読み取れますが、何も変更できません。一覧には各キーの作成日と最終使用日が表示され、ゴミ箱アイコンで削除できます。',
  'help.guide.api-keys.tip.1': 'ツールごとにキーを分けておくと、ほかのツールに影響を与えずにキーを取り消せます。',
  'help.guide.api-keys.tip.2':
    'AIクライアントに変更を許可するには、代わりにOAuthを使うMCPを使ってください。APIキーは読み取り専用です。',
  // mcp-oauth
  'help.guide.mcp-oauth.title': 'MCPでAIアシスタントを接続する',
  'help.guide.mcp-oauth.goal': 'Claude、IDE、そのほかのMCPクライアントから自分の旅行にアクセスできるようにします。',
  'help.guide.mcp-oauth.step.1': '「MCP設定」で、クライアント用の「MCPエンドポイント」をコピーします。',
  'help.guide.mcp-oauth.step.2':
    '「OAuth 2.1 クライアント」で「新規クライアント」をクリックし、クイックプリセット（Claude Desktop、Cursorなど）を選ぶか、「アプリ名」「リダイレクトURI」「許可スコープ」を自分で入力します。ブラウザーのないサーバーの場合は、マシンクライアントを選びます。「登録」をクリックし、「クライアントシークレット」をコピーします。シークレットは一度しか表示されません。',
  'help.guide.mcp-oauth.step.3':
    '各クライアントに「シークレット更新」と「クライアント削除」があります。「有効なセッション」にはサインイン中のクライアントが並び、「取り消し」で解除できます。「クライアント設定」を開くと、JSONを使うクライアント向けのそのまま使えるスニペットが表示されます。',
  'help.guide.mcp-oauth.result':
    'クライアントは、スコープで許可された範囲であなたとして閲覧・変更でき、すべての操作はあなたの名前で記録されます。',
  'help.guide.mcp-oauth.tip.1':
    'スコープで、クライアントにできることを制限できます。必要になるまでは、読み取りのスコープだけを付与しましょう。',
  'help.guide.mcp-oauth.tip.2': '管理者がインスタンス全体で MCP をオフにしている場合、このセクションは表示されません。',
  // offline-prepare
  'help.guide.offline-prepare.title': '旅行をオフラインで使えるようにする',
  'help.guide.offline-prepare.goal': '接続が切れる前に、旅行とその地図をこの端末に保存しておきます。',
  'help.guide.offline-prepare.step.1':
    '「オフラインで保存する内容」で「地図タイルをオフラインで保存」をオンのままにし、この端末に保存したい旅行をオンにします。終了した旅行は、オンにした場合だけ保存されます。',
  'help.guide.offline-prepare.step.2':
    '上部に戻り、「オフラインの準備」で「オフライン用にダウンロード」をクリックします。旅行データ、ドキュメント、地図タイルがダウンロードされ、保存した旅行の数が表示されます。',
  'help.guide.offline-prepare.step.3':
    '「オフラインモードを強制」を使うと、もう一度ダウンロードしたあと、この端末のデータだけで動作します。出発前に、必要なものがすべて揃っているか確認できます。',
  'help.guide.offline-prepare.result':
    '接続がなくても旅行を開けます。変更内容は送信待ちとして保存され、オンラインに戻ると送信されます。',
  'help.guide.offline-prepare.tip.1':
    'いちばん容量を使うのは地図タイルです。旅行データとドキュメントだけを保存するなら、地図タイルをオフにします。',
  'help.guide.offline-prepare.tip.2':
    'オフラインでスムーズに起動するには、ブラウザーからTREKをアプリとしてインストールしてください。',
  // offline-conflicts
  'help.guide.offline-conflicts.title': '同期の競合で残すバージョンを選ぶ',
  'help.guide.offline-conflicts.goal':
    'オフラインでの変更とほかの場所での変更が競合したとき、TREK がどう解決するかを選びます。',
  'help.guide.offline-conflicts.step.1':
    'オフラインでの変更が新しい変更と競合すると、「オフライン」の上部に「同期の競合」が表示されます。変更ごとに「自分の版」か「サーバーの変更を保持」をクリックします。',
  'help.guide.offline-conflicts.step.2':
    '同じカードの「競合が発生したとき」で、次回からの動作を選びます：「毎回確認する」「常に自分のバージョンを保持」「常にサーバーのバージョンを保持」。',
  'help.guide.offline-conflicts.result':
    '「毎回確認する」の場合、選ぶまで競合は「同期の競合」に残ります。ほかの2つの選択肢では、TREKが自動で解決します。',
  'help.guide.offline-conflicts.tip.1':
    '「キャッシュを消去」で削除されるのは、この端末のコピーだけです。サーバー上のデータは変わりません。',
  // profile
  'help.guide.profile.title': 'プロフィールを変更する',
  'help.guide.profile.goal': '名前、メール、プロフィール画像を変更します。',
  'help.guide.profile.step.1':
    '「アカウント」カードで、画像のカメラアイコンをクリックして画像をアップロードします。赤いゴミ箱アイコンで削除すると、イニシャルの表示に戻ります。',
  'help.guide.profile.step.2': '画像の下で「ユーザー名」と「メール」を編集します。',
  'help.guide.profile.result': '共有している旅行も含め、すべての場所で名前と画像がすぐに更新されます。',
  'help.guide.profile.tip.1': 'SSOで連携したアカウントには、SSOのバッジと「連携先」のプロバイダーが表示されます。',
  // password
  'help.guide.password.title': 'パスワードを変更する',
  'help.guide.password.goal': '新しいパスワードを設定します。',
  'help.guide.password.step.1':
    '「パスワード変更」で「現在のパスワード」を入力し、「新しいパスワード」と、同じものを「新しいパスワード（確認）」に入力します。入力中、下の一覧で満たしたルールにチェックが付きます。',
  'help.guide.password.step.2': '「パスワード更新」をクリックします。',
  'help.guide.password.result':
    '新しいパスワードはすぐに有効になります。ほかの端末はすべてサインアウトされ、MCPのAPIトークンは削除され、OAuthクライアントはサインインし直す必要があります。この端末はサインインしたままです。',
  'help.guide.password.tip.1':
    'このTREKがSSOでしかサインインできない場合、TREKのパスワードはなく、「パスワード変更」カードも表示されません。',
  // mfa
  'help.guide.mfa.title': '二要素認証をオンにする',
  'help.guide.mfa.goal': '認証アプリのコードで、アカウントを保護します。',
  'help.guide.mfa.step.1': '「二要素認証（2FA）」で「認証アプリを設定」をクリックします。',
  'help.guide.mfa.step.2':
    'アプリでQRコードを読み取るか、シークレットを手で入力し、アプリに表示された6桁のコードを入力して「2FAを有効化」をクリックします。',
  'help.guide.mfa.step.3':
    '「コードをコピー」「TXTでダウンロード」「印刷 / PDF」のいずれかでバックアップコードを保存し、「OK」をクリックします。各コードは1回だけ使えます。スマートフォンが手元にないときに使います。',
  'help.guide.mfa.result': 'サインインのたびに、パスワードのあとにコードの入力を求められます。',
  'help.guide.mfa.tip.1': '「2FAを無効化」には、パスワードと、現在のコードか未使用のバックアップコードが必要です。',
  'help.guide.mfa.tip.2': '管理者は全員に2FAを必須にできます。その場合、ここではオフにできません。',
  // passkeys
  'help.guide.passkeys.title': 'パスキーでサインインする',
  'help.guide.passkeys.goal': 'パスワードの代わりに、端末の指紋認証、顔認証、PIN を使います。',
  'help.guide.passkeys.step.1':
    '「パスキー」で「パスキーを追加」をクリックし、現在のパスワードを入力して、どの端末かわかる名前を付けます。そのあと端末の指示に従います。',
  'help.guide.passkeys.step.2':
    '各パスキーには、「同期済み」か「この端末」専用か、最後に使った日時が表示されます。「名前を変更」で名前を変え、削除ボタンではパスワードを入力したあとに削除します。',
  'help.guide.passkeys.result':
    'サインインページでパスキーが使えるようになります。パスワードでのサインインも引き続き使えます。',
  'help.guide.passkeys.tip.1':
    'パスキーは端末やそのパスワードマネージャーに保存されるので、端末ごとにパスキーを追加してください。',
  'help.guide.passkeys.tip.2':
    'パスキーは、管理者がオンにした場合だけ表示されます。サーバーのWebAuthnのドメインが設定されるまでは、「パスキーを追加」の代わりにその旨がカードに表示されます。',
  // delete-account
  'help.guide.delete-account.title': 'アカウントを削除する',
  'help.guide.delete-account.goal': 'アカウントと、自分だけのデータを削除します。',
  'help.guide.delete-account.step.1':
    '「アカウント」カードで、下部の左にある「アカウント削除」をクリックし、「完全に削除」をクリックします。',
  'help.guide.delete-account.result':
    'アカウントが、自分が所有する旅行、場所、ファイルと一緒に削除されます。ほかの人が所有する旅行は残ります。',
  'help.guide.delete-account.tip.1':
    '管理者が自分ひとりの場合、TREKに「削除できません」と表示されます。先に別のユーザーを管理者にしてください。',
  'help.guide.delete-account.tip.2':
    '元に戻すことはできません。残しておきたいものは、確定する前にエクスポートしてください。',

  // ── Screen: admin (all tabs) ──────────────────────────────────────────────────────────
  'help.ctx.admin.title': '管理',
  'help.ctx.admin.summary':
    'TREKのインスタンス全体と全ユーザーに関わる設定です。誰がどうサインインできるか、何をオンにするか、ファイルの保存先、サーバーからの連絡方法、バックアップの方法を管理します。このページは管理者にだけ表示されます。サイドバーではタブが「ユーザー」「設定」「連携」「メンテナンス」にまとめられ、タブごとに別の画面になっています。',
  'help.ctx.admin.bullet.1':
    'ヘッダーの右側に、ユーザー、旅行、場所、ファイルの数が表示されます。TREKの新しいリリースがあると、その下に「アップデートあり」バナーが表示されます。',
  'help.ctx.admin.bullet.2':
    '「ユーザー」と「ユーザーのデフォルト」：アカウント、招待リンク、権限と、新しいアカウントの初期設定と地図です。',
  'help.ctx.admin.bullet.3':
    '「カスタマイズ」「設定」「アドオン」「プラグイン」「ストレージ」：持ち物テンプレート、カテゴリ、学校の休暇。サインイン、パスキー、2FA、APIキー、検索プロバイダー。機能モジュール。サードパーティのプラグイン。アップロードの保存先。',
  'help.ctx.admin.bullet.4':
    '「通知」「MCPトークン」、GitHub：ユーザーが選べるチャンネルとその初期設定、AIクライアントのトークンとセッション、リリース履歴です。',
  'help.ctx.admin.bullet.5':
    '「バックアップ」と「監査」：手動と定期のバックアップ、セキュリティに関わるイベントのログです。',
  'help.ctx.admin-users.title': 'ユーザー',
  'help.ctx.admin-users.summary':
    'このTREKのすべてのアカウント（権限、メール、最後にアクティブだった日時）、非公開のインスタンスで登録に使う招待リンク、旅行で誰が何をできるかを管理します。',
  'help.ctx.admin-users.bullet.1':
    '表：ユーザー、メール、権限、作成日、「最終アクティブ」が表示され、行ごとに「ユーザーを編集」と「ユーザー削除」があります。アバターの緑の点は、その人が今オンラインであることを示します。自分の行には「（あなた）」と表示されます。',
  'help.ctx.admin-users.bullet.2':
    '「ユーザー」カード右上の「ユーザーを作成」で、アカウントを手動で追加できます。パスワードは自分で決めてユーザーに伝えます。',
  'help.ctx.admin-users.bullet.3':
    '下の「招待リンク」：登録用のリンクです。使用回数の上限、有効期限、必要なら新規ユーザーが登録時に参加する旅行を設定できます。',
  'help.ctx.admin-users.bullet.4':
    '下部の「権限設定」：操作ごとに、実行できる人（「全員」「旅行メンバー」「旅行オーナー」「管理者のみ」）を設定します。カード上部の「保存」で保存します。',
  'help.ctx.admin-defaults.title': 'ユーザーのデフォルト',
  'help.ctx.admin-defaults.summary':
    '新しいアカウントの初期設定です。これで、ユーザーが最初に設定する手間が省けます。カラーモード、単位、時刻形式、週の開始、表示通貨、予約コードのぼかし、さらに地図、そのキー、ルーティングサーバーを設定できます。',
  'help.ctx.admin-defaults.bullet.1':
    '左側の「既定のユーザー設定」：「カラーモード」「温度単位」「距離単位」「時刻形式」「週の開始」「表示通貨」「予約コードをぼかす」があります。',
  'help.ctx.admin-defaults.bullet.2':
    '右側の「マップ」：「地図テンプレート」「共有 CARTO キー」「自前のルーティングサーバー」「自前の Valhalla インスタンス」、プレビュー、続いて「地図エンジン」と「地図スタイル」「共有 Mapbox トークン」「3D の建物と地形」「高品質モード」があります。',
  'help.ctx.admin-config.title': 'カスタマイズ',
  'help.ctx.admin-config.summary':
    'インスタンスのすべての旅行で共通の設定です。持ち物テンプレート、場所とコレクションで使うカテゴリ、Vacayで使う学校の休暇の一覧があります。',
  'help.ctx.admin-config.bullet.1':
    '「持ち物テンプレート」：カテゴリとアイテムをまとめた名前付きのリストです。旅行の持ち物リストをここから始められます。',
  'help.ctx.admin-config.bullet.2':
    '「カテゴリ」：場所の詳細から「コレクション」まで、TREK全体で使うカテゴリの名前、アイコン、色です。それぞれプレビュー付きのダイアログで編集します。',
  'help.ctx.admin-config.bullet.3': '「学校の休暇」：国と地域ごとの休暇期間の一覧です。Vacayで誰でも選べます。',
  'help.ctx.admin-settings.title': '設定',
  'help.ctx.admin-settings.summary':
    'サインインの方法と、サーバーが使える外部サービスを設定します。左側は「認証方法」「パスキーログイン」「二要素認証（2FA）を必須にする」「シングルサインオン（OIDC）」。右側は「許可するファイル形式」と、検索・乗換案内のプロバイダーを含む「APIキー」です。「危険ゾーン」は下部にあります。',
  'help.ctx.admin-settings.bullet.1':
    '「認証方法」：「パスワードログイン」「パスワード登録」と、OIDCを設定済みなら「SSOログイン」「SSO自動登録」があります。「二要素認証（2FA）を必須にする」は専用のカードにあります。',
  'help.ctx.admin-settings.bullet.2':
    '「パスキーログイン」：「パスキーログインを有効化」、「Relying Party ID（ドメイン）」、「許可するオリジン」。「シングルサインオン（OIDC）」：「表示名」、Issuer URL、「ディスカバリー URL（任意）」、「クライアントID」、「クライアントシークレット」。',
  'help.ctx.admin-settings.bullet.3':
    '「APIキー」：いちばん上はTREK Places APIで、キーは不要です。その下に「Google Maps APIキー」（「テスト」と「キーの使いみち」付き）、Unsplashのキー、Amapのキーがあり、カード下部に「保存」が1つあります。',
  'help.ctx.admin-settings.bullet.4':
    '「公共交通のプロバイダー」と「地点検索のプロバイダー」で、公共交通と場所の検索に使うサービスを選びます。「場所検索の記録」には、選ばれた検索結果が記録されます。「許可するファイル形式」でアップロードを制限します。',
  'help.ctx.admin-addons.title': 'アドオン',
  'help.ctx.admin-addons.summary':
    'TREK の機能モジュールで、それぞれにスイッチがあります。持ち物、予算、ドキュメント、Vacay、Atlas、Collab、日記、コレクション、ロードトリップ、MCP、AirTrail、Dawarich、AI解析です。オフにすると、ナビゲーションの項目、ルート、API が全員に対して削除されます。',
  'help.ctx.admin-addons.bullet.1':
    'アドオンごとにタイルとスイッチがあり、オプションのあるアドオンにはその下に行が表示されます。',
  'help.ctx.admin-addons.bullet.2':
    '写真とドキュメントのプロバイダーもタイルで表示されるので、ImmichやSynologyをユーザーに提供できます。',
  'help.ctx.admin-addons.bullet.3': '「バッグ管理」は、タイルの下に専用のスイッチがあります。',
  'help.ctx.admin-plugins.title': 'プラグイン',
  'help.ctx.admin-plugins.summary':
    'TREK とは別のプロセスで動くサードパーティ製のプラグインです。それぞれ、インストール時に求めた権限を持ちます。カタログからインストールするか、パッケージをアップロードするか、プラグインの開発中はフォルダをリンクします。',
  'help.ctx.admin-plugins.bullet.1':
    '「インストール済み」と「探す」には、「プラグインを検索…」と、「タイプ」「ステータス」「並び替え」のフィルターがあります。各行に、バージョン、「レビュー済み」、「署名済み」か「署名なし」、プラグインがアクセスできる範囲、スイッチ、⋯メニューが表示されます。',
  'help.ctx.admin-plugins.bullet.2':
    'カードのヘッダーにある2つのアイコン：「プラグインをアップロード」は.zip、.tgz、.tar.gzに対応します（ページに.zipをドロップしても追加できます）。「再スキャン」は、開発用にリンクしたプラグインフォルダを検出します。',
  'help.ctx.admin-plugins.bullet.3':
    'プラグインごとの「許可するホスト」：プラグインが接続できるアドレスです。外部への接続はデフォルトでブロックされます。',
  'help.ctx.admin-storage.title': 'ストレージ',
  'help.ctx.admin-storage.summary':
    'アップロードの保存先を設定します。ローカルディスクかS3バケットで、必要に応じてほかのバックエンドにもコピーできます。アップロードの種類ごとに別のバックエンドを指定でき、「変更を保存」をクリックするまで何も変わりません。',
  'help.ctx.admin-storage.bullet.1':
    '上部の「健康」：ミラー先への書き込みの失敗、または「レプリカの失敗は記録されていません。」が表示されます。',
  'help.ctx.admin-storage.bullet.2':
    '「バックエンド」：名前、タイプ、使用量、ミラー先が表示され、「テスト」「編集」「削除」が使えます。「今すぐ計算」で保存量を計算します。環境変数で定義したバックエンドは読み取り専用です。',
  'help.ctx.admin-storage.bullet.3':
    '「カテゴリ」：旅行の書類、日記の写真、カバー、プロフィール画像、場所の画像、写真のキャッシュ、バックアップを、それぞれバックエンドに割り当てます。',
  'help.ctx.admin-notifications.title': '通知',
  'help.ctx.admin-notifications.summary':
    'インスタンスがユーザーに提供するチャンネルと、管理者として受け取るチャンネルを設定します。ユーザーは「設定」で自分のトピックやURLを選びます。管理者は使えるチャンネルを決め、メールを設定します。',
  'help.ctx.admin-notifications.bullet.1':
    '「メール（SMTP）」、Webhook、Ntfy、「Webプッシュ」には、それぞれユーザーにチャンネルを提供するスイッチがあります。メールにはサーバーの設定も必要です。「アプリ内」は常にオンです。',
  'help.ctx.admin-notifications.bullet.2':
    '「旅行リマインダー」：旅行が始まる前に、サーバーからリマインダーを送るかどうかを設定します。',
  'help.ctx.admin-notifications.bullet.3':
    '「管理者Webhook」「管理者Ntfy」「通知」カード：管理者向けのイベント（「新しいバージョン」「ストレージレプリカの障害」「パドル地域のリクエスト」）の送信先を設定します。それぞれにテストボタンがあります。',
  'help.ctx.admin-mcp-tokens.title': 'MCPトークン',
  'help.ctx.admin-mcp-tokens.summary':
    'この TREK で AI クライアントが持っているすべてのトークンと OAuth セッションを、全ユーザー分表示します。どれでも取り消せます。',
  'help.ctx.admin-mcp-tokens.bullet.1':
    '「OAuthセッション」：クライアント、付与されたスコープ、所有者、日付が表示され、ゴミ箱アイコンで取り消せます。',
  'help.ctx.admin-mcp-tokens.bullet.2':
    '「API トークン」：名前、所有者、「作成日」「最終使用」が表示され、ゴミ箱アイコンで削除できます。',
  'help.ctx.admin-github.title': 'GitHub',
  'help.ctx.admin-github.summary':
    'TREKの新着情報です。GitHubのリリース履歴と、今より新しいバージョンがあるかどうかがわかります。アップデート自体は、アプリではなくホスト上で行います。',
  'help.ctx.admin-github.bullet.1':
    '「リリース履歴」には、リリースがリリースノート付きのタイムラインで表示されます。最新版には「最新」、プレリリースには「プレリリース」と表示され、GitHubのボタンでリリースページが開きます。',
  'help.ctx.admin-github.bullet.2':
    '新しいリリースがあると、ページのヘッダーの下に「アップデートあり」が表示されます。「更新方法」には、Docker用のコマンドか、ほかの環境向けの更新ガイドが表示されます。',
  'help.ctx.admin-backup.title': 'バックアップ',
  'help.ctx.admin-backup.summary':
    'データベースとアップロードの完全なバックアップです。手動か定期的に作成してサーバーに保存し、1つのファイルとしてダウンロードできます。「復元」でバックアップから元に戻せます。',
  'help.ctx.admin-backup.bullet.1':
    '「データバックアップ」：カード上部に「バックアップを作成」と「バックアップをアップロード」、その下にバックアップの一覧があり、「ダウンロード」「復元」と削除用のゴミ箱アイコンがあります。',
  'help.ctx.admin-backup.bullet.2':
    '「バックアップをアップロード」では、別のインスタンスや以前に作ったファイルから、「復元」と同じ確認のあとに復元します。',
  'help.ctx.admin-backup.bullet.3':
    '「自動バックアップ」：オン・オフ、「間隔」、「実行時刻」と曜日、「古いバックアップを削除」（「1日」から「無期限」まで）を設定し、「保存」で適用します。',
  'help.ctx.admin-audit.title': '監査',
  'help.ctx.admin-audit.summary':
    'セキュリティと管理に関するイベントのログです。サインインとその失敗、MFAの変更、ユーザーと設定の変更、バックアップと復元が記録されます。閲覧専用で、新しい順に表示されます。',
  'help.ctx.admin-audit.bullet.1': 'イベントごとに1行で、時刻、ユーザー、操作、リソース、IP、詳細を表示します。',
  'help.ctx.admin-audit.bullet.2':
    'カードのヘッダーにある「更新」で一覧を再読み込みします。タイトル横のバッジには、全件のうち読み込んだ件数が表示されます。「さらに読み込む」で古い記録を読み込みます。',
  // create-user
  'help.guide.create-user.title': 'ユーザーを作成する',
  'help.guide.create-user.goal': '招待を使わずに、アカウントを手動で追加します。',
  'help.guide.create-user.step.1': '「ユーザー」カード右上の「ユーザーを作成」をクリックします。',
  'help.guide.create-user.step.2':
    '「ユーザー名」「メール」「パスワード」を入力します。パスワードの下のチェックリストで、満たしているルールを確認できます。「権限」でユーザーか「管理者」を選びます。',
  'help.guide.create-user.step.3': '「ユーザーを作成」をクリックします。',
  'help.guide.create-user.result':
    'アカウントが表に追加され、すぐにサインインできるようになります。パスワードは、信頼できる方法で本人に伝えてください。',
  'help.guide.create-user.tip.1': 'パスワードを本人に決めてもらう場合は、招待リンクのほうが適しています。',
  'help.guide.create-user.tip.2':
    '「管理者」はこのページを表示でき、すべての操作ができます。ユーザーが旅行でできることは、下の「権限設定」で決めます。',
  // edit-user
  'help.guide.edit-user.title': 'ユーザーの情報やパスワードを変える',
  'help.guide.edit-user.goal':
    'ユーザーの名前を変える、権限を上げる・下げる、パスワードを忘れた人が再びサインインできるようにする、といった操作をします。',
  'help.guide.edit-user.step.1':
    'ユーザーの行の鉛筆アイコン（「ユーザーを編集」）をクリックします。ダイアログの上部に、そのアカウントのメールが表示されます。',
  'help.guide.edit-user.step.2':
    '「ユーザー名」「メール」「権限」を変更するか「新しいパスワード」を入力して（空欄なら今のパスワードのまま）、「保存」をクリックします。下部の「パスキーをリセット」を使うと、確認後にそのアカウントのパスキーがすべて削除されます。',
  'help.guide.edit-user.result':
    '変更はすぐに反映されます。新しいパスワードを設定すると、その人はすべての端末でサインアウトされ、古いセッションは使えなくなります。',
  'help.guide.edit-user.tip.1': '管理者が自分1人だけの間は、自分の管理者権限を外せません。',
  'help.guide.edit-user.tip.2':
    'パスキーをリセットしても、パスワードはそのまま残ります。新しいパスキーは本人が「設定」の「アカウント」で追加します。',
  // invite-links
  'help.guide.invite-links.title': 'リンクで招待する',
  'help.guide.invite-links.goal':
    '登録を締め切ったインスタンスでも登録できるようにし、必要ならそのまま旅行に追加します。',
  'help.guide.invite-links.step.1': '「招待リンク」カード右上の「リンク作成」をクリックします。',
  'help.guide.invite-links.step.2':
    '「最大使用回数」（1×〜5×、または∞）と「有効期限」（1d〜14d、または∞）を選び、必要なら「旅行に追加（任意）」で旅行を選んで、「作成してコピー」をクリックします。',
  'help.guide.invite-links.step.3':
    'リンクを送ります。各行に使用回数、有効期限、追加先の旅行、作成者が表示され、横に「有効」「期限切れ」「使用済み」のいずれかが付きます。「リンクをコピー」でもう一度コピーでき、ゴミ箱アイコンで削除できます。',
  'help.guide.invite-links.result':
    'リンクを開いた人は、自分のパスワードで登録します。旅行を選んでいた場合は、すぐにその旅行に参加します。',
  'help.guide.invite-links.tip.1': '「設定」で「パスワード登録」をオフにしていても、招待リンクは使えます。',
  'help.guide.invite-links.tip.2': '1人だけを招待するなら、使用回数1回で有効期限の短いリンクがいちばん安全です。',
  // delete-user
  'help.guide.delete-user.title': 'ユーザーを削除する',
  'help.guide.delete-user.goal': 'アカウントと、そのアカウントが所有するものをすべて削除します。',
  'help.guide.delete-user.step.1':
    'ユーザーの行のゴミ箱アイコン（「ユーザー削除」）をクリックし、「削除」で確定します。',
  'help.guide.delete-user.result':
    'アカウントが、そのアカウントが所有するすべての旅行と日記と一緒に削除されます。ほかの人と共有していた旅行も削除されます。メンバーとして参加していただけの旅行は、所有者のもとに残ります。',
  'help.guide.delete-user.tip.1': '元に戻すことはできません。迷ったら、先にバックアップを取ってください。',
  'help.guide.delete-user.tip.2':
    '自分の行のゴミ箱アイコンは使えません。自分自身は削除できないため、別の管理者に削除してもらう必要があります。',
  // permissions
  'help.guide.permissions.title': '誰が何をできるかを決める',
  'help.guide.permissions.goal': 'この TREK で、操作ごとにどの役割に許可するかを設定します。',
  'help.guide.permissions.step.1':
    '「権限設定」で、グループ内の操作（例：「旅行管理」の「旅行を削除」）を探し、実行できる人を「全員」「旅行メンバー」「旅行オーナー」「管理者のみ」から選びます。変更した行には「カスタマイズ済み」と表示されます。',
  'help.guide.permissions.step.2':
    'カード右上の「保存」をクリックします。「既定に戻す」ですべての行が初期のレベルに戻ります。そのあとも「保存」をクリックしてください。',
  'help.guide.permissions.result':
    'ルールはすべての旅行にまとめて適用されます。そのレベルに満たない人には、該当するボタンやメニューが表示されなくなります。',
  'help.guide.permissions.tip.1': '「旅行オーナー」は旅行を作成した人です。管理者は常にすべての操作ができます。',
  'help.guide.permissions.tip.2':
    '操作ごとに行が分かれているので、たとえばメンバーには場所と日の計画を任せ、旅行の削除は所有者だけにする、といった設定ができます。',
  // default-map
  'help.guide.default-map.title': '新規ユーザーの地図の初期設定を決める',
  'help.guide.default-map.goal': '個人のトークンがなくても、新しいアカウントすべてで地図が使えるようにします。',
  'help.guide.default-map.step.1':
    '「マップ」で「地図テンプレート」を選ぶかタイルのURLを貼り付け、CARTOのタイルを使う場合は「共有 CARTO キー」を入力します。下のプレビューで結果を確認できます。',
  'help.guide.default-map.step.2':
    'さらに下の「地図エンジン」で、「標準（無料）」「Mapbox（3D）」、MapLibre（OpenFreeMap）から選びます。MapboxとMapLibreでは「地図スタイル」を選び、Mapboxでは「共有 Mapbox トークン」を入力して、「3D の建物と地形」と「高品質モード」を設定します。',
  'help.guide.default-map.result':
    '新しいアカウントはこの設定で始まります。「設定」で自分の地図を選んだユーザーは、その設定のままです。',
  'help.guide.default-map.tip.1':
    'ここに入力したトークンやキーは、自分のものを持っていない全員で共有されます。利用上限に注意してください。',
  'help.guide.default-map.tip.2':
    'マップのタブで何も変更していない既存のアカウントにも、このデフォルトが適用されます。',
  // packing-templates
  'help.guide.packing-templates.title': '持ち物テンプレートを作る',
  'help.guide.packing-templates.goal':
    '空のリストではなく、テンプレートの持ち物リストから旅行を始められるようにします。',
  'help.guide.packing-templates.step.1': '「新規テンプレート」をクリックし、名前を入力してチェックマークで確定します。',
  'help.guide.packing-templates.step.2':
    'テンプレート名をクリックして開き、「カテゴリを追加」をクリックします。カテゴリの上部の＋でアイテムを追加します。アイテムに必要なのは名前だけです。',
  'help.guide.packing-templates.step.3':
    '操作内容はその都度保存されます。鉛筆アイコンでテンプレート、カテゴリ、アイテムの名前を変えられます。ゴミ箱アイコンでアイテムはすぐに削除されます。テンプレートやカテゴリは中身もすべて削除されるため、先に確認されます。',
  'help.guide.packing-templates.result':
    'テンプレートは、すべての旅行の持ち物リストで使えます。適用するとアイテムがコピーされるので、旅行ごとに自由に変更できます。',
  'help.guide.packing-templates.tip.1':
    '1つの長いリストより、旅行の種類（ビーチ、都市、ハイキングなど）ごとにテンプレートを作るほうが使いやすくなります。',
  'help.guide.packing-templates.tip.2': 'テンプレートを削除しても、すでに適用した旅行には影響しません。',
  'help.guide.packing-templates.tip.3':
    '旅行の持ち物リストで「テンプレートとして保存」を使うと、各アイテムの重さ、数量、バッグを含むテンプレートができます。これらはここでアイテムの横に表示され、テンプレートを適用するとアイテムが同じバッグに入ります。',
  // categories
  'help.guide.categories.title': 'カテゴリを管理する',
  'help.guide.categories.goal': '場所とコレクションで使えるカテゴリと、その見た目を決めます。',
  'help.guide.categories.step.1':
    '「新しいカテゴリ」をクリックし、ダイアログのタイトル行に名前を入力します。「アイコン」と「色」を選び、「プレビュー」を確認したら「作成」をクリックします。',
  'help.guide.categories.step.2':
    '一覧で鉛筆アイコン（「編集」）をクリックするとカテゴリが開き、「更新」で保存します。ゴミ箱アイコン（「削除」）で、確認後にカテゴリを削除します。',
  'help.guide.categories.result':
    '設定はすべての場所にまとめて反映されます。場所のインスペクター、マップのピン、コレクション、フィルターです。',
  'help.guide.categories.tip.1':
    '場所はカテゴリのIDで紐づいているので、カテゴリの名前を変えると、すべての場所でカテゴリ名が変わります。',
  'help.guide.categories.tip.2':
    'カテゴリを削除すると、そのカテゴリの場所はカテゴリなしになります。困る場合は、先に別のカテゴリに割り当ててください。',
  // school-holiday-catalog
  'help.guide.school-holiday-catalog.title': '学校の休暇を手動で管理する',
  'help.guide.school-holiday-catalog.goal': '国や地域の学校の休暇を登録し、Vacayで誰でも選べるようにします。',
  'help.guide.school-holiday-catalog.step.1':
    '「学校の休暇」で国を選ぶか、＋（「国を追加」）をクリックして国名と「国コード（例：US）」を入力して保存します。「地域を追加」で、独自の休暇期間がある地域をそれぞれ追加します。',
  'help.guide.school-holiday-catalog.step.2':
    '地域をクリックすると「地域または学区」が開きます。「休暇期間を追加」で期間ごとに「休暇名」「開始日」「終了日」を入力し、保存します。ゴミ箱アイコンで期間や地域を削除します。国は、地域がなくなると削除できます。',
  'help.guide.school-holiday-catalog.result':
    'ユーザーは Vacay の「設定」で国と地域を選ぶと、年間グリッドに休暇期間が表示されます。',
  'help.guide.school-holiday-catalog.tip.1': '誰かがすでにVacayのカレンダーで選んでいる地域は削除できません。',
  // auth-methods
  'help.guide.auth-methods.title': 'サインイン方法を決める',
  'help.guide.auth-methods.goal': 'パスワードでのサインイン、SSO、新規登録のオンとオフを切り替え、2FA を必須にします。',
  'help.guide.auth-methods.step.1':
    '「認証方法」で「パスワードログイン」と「パスワード登録」のオン・オフを切り替えます。スイッチはそれぞれすぐに反映されます。登録をオフにすると、新しいアカウントは招待リンク、SSO、「ユーザーを作成」からしか作れません。',
  'help.guide.auth-methods.step.2':
    '「SSOログイン」と「SSO自動登録」を使うには、下で「シングルサインオン（OIDC）」を設定する必要があります。自動登録では、SSO で初めてサインインした人のアカウントが作成されます。',
  'help.guide.auth-methods.step.3':
    '「二要素認証（2FA）を必須にする」をオンにすると、2FA未設定のユーザーは全員、TREKを使う前に「設定」で2FAを設定する必要があります。',
  'help.guide.auth-methods.result': 'サインインページには、オンにした方法だけが表示されます。',
  'help.guide.auth-methods.tip.1':
    '最後に残ったログイン方法はオフにできません。そのスイッチはグレーになり、ツールチップに「少なくとも1つのログイン方法を有効にしておく必要があります」と表示されます。',
  'help.guide.auth-methods.tip.2':
    'サーバーにOIDC_ONLYが設定されている場合、パスワードのスイッチはロックされ、その旨のメモが表示されます。',
  // oidc
  'help.guide.oidc.title': 'シングルサインオンを接続する',
  'help.guide.oidc.goal': '自分のIDプロバイダーでサインインできるようにします。',
  'help.guide.oidc.step.1':
    '「シングルサインオン（OIDC）」で、ボタンに表示する「表示名」と、プロバイダーのIssuer URL、「クライアントID」、「クライアントシークレット」を入力します。「ディスカバリー URL（任意）」は、Authentikのように、プロバイダーが通常のアドレスで公開していない場合だけ入力します。「保存」をクリックします。',
  'help.guide.oidc.step.2': '「認証方法」で「SSOログイン」をオンにします。',
  'help.guide.oidc.result':
    'サインインページに SSO ボタンが表示されます。「SSO自動登録」がオンなら、初めてサインインするユーザーのアカウントが自動で作成されます。',
  'help.guide.oidc.tip.1':
    'プロバイダーに設定するリダイレクト URI は、TREK のアドレスに、ドキュメントに記載の OIDC コールバックのパスを付けたものです。',
  'help.guide.oidc.tip.2':
    'どの SSO グループを管理者にするかは、クレームマッピングで決まります。ドキュメントの OIDC のページを参照してください。',
  // instance-keys
  'help.guide.instance-keys.title': 'APIキーを入力する',
  'help.guide.instance-keys.goal':
    'インスタンス全体で、Googleの写真と評価、Unsplashのカバー、Amapの検索を使えるようにします。',
  'help.guide.instance-keys.step.1':
    '「APIキー」の上部にあるTREK Places APIは、キーなしでも場所の検索に対応しています。「何が入っているか」で、対応している内容と対応していない内容を確認できます。',
  'help.guide.instance-keys.step.2':
    '写真、評価、営業時間を使うには、「Google Maps APIキー」を貼り付けて「テスト」をクリックします。「接続済み」か「無効」と表示されます。「キーの使いみち」を開き、課金されてもよいものだけをオンにします：「場所の写真」「場所のオートコンプリート」「場所の詳細」「場所の情報補完」「Google だけで検索」。「Google 呼び出しの1日の上限」も設定できます。',
  'help.guide.instance-keys.step.3':
    'カバー画像の検索用に「Unsplash APIキー」を、中国本土の場所の検索用に「Amap（高德地图）API キー」を貼り付け、カード下部の「保存」をクリックします。',
  'help.guide.instance-keys.result':
    'ユーザーは自分のキーがなくても機能を使えます。Googleのキーがない場合、検索にはTREK Places APIとOpenStreetMapが使われます。',
  'help.guide.instance-keys.tip.1':
    'ユーザーが「設定」で個人のキーを設定している場合、そのユーザーにはインスタンスのキーではなく個人のキーが使われます。',
  'help.guide.instance-keys.tip.2': 'キーは環境変数からも設定できます。その場合、ここでは読み取り専用で表示されます。',
  'help.guide.instance-keys.tip.3':
    '「Google 呼び出しの1日の上限」で、TREK がそのキーで1日に使える量を制限します。タイトル横のバッジには今日の呼び出し回数が表示されます。上限に達すると、翌日（UTC）まで検索には OpenStreetMap が使われます。',
  // places-transit
  'help.guide.places-transit.title': '検索と公共交通機関のプロバイダーを選ぶ',
  'help.guide.places-transit.goal': '場所の検索と、公共交通機関の経路検索に使うサービスを選びます。',
  'help.guide.places-transit.step.1':
    '「公共交通のプロバイダー」で、キー不要でヨーロッパに強い「Transitous（無料）」か、Googleのキーを使うGoogleを選びます。選択はすぐに保存されます。',
  'help.guide.places-transit.step.2':
    '「地点検索のプロバイダー」で、TREKのインデックスとOpenStreetMapで見つからなかったときに問い合わせるサービスを選びます：「自動」（キーがあればGoogle、次にAmap）、Google Places、「Amap（高德地图）」、OpenStreetMap。',
  'help.guide.places-transit.result': 'TREK のすべての検索ボックスと公共交通機関の経路で、この設定が使われます。',
  'help.guide.places-transit.tip.1':
    'キーが設定されていない選択肢には、ここに警告が表示されます。その場合、場所の検索はTREKのインデックスとOpenStreetMapだけ、公共交通はTransitousだけを使います。',
  'help.guide.places-transit.tip.2':
    'Googleの公共交通機関のルートは、リクエストごとに課金されます。Transitousは無料です。',
  // file-types
  'help.guide.file-types.title': 'ファイル形式を制限する',
  'help.guide.file-types.goal': 'アップロードできるファイルの拡張子を決めます。',
  'help.guide.file-types.step.1':
    '「許可するファイル形式」で、カンマ区切りの拡張子の一覧を編集するか、すべての形式を許可するなら*を入力して、「保存」をクリックします。',
  'help.guide.file-types.result':
    'それ以外の形式のファイルは、ドキュメント、日記、カバーのいずれでもアップロードできず、その旨がはっきり表示されます。',
  'help.guide.file-types.tip.1':
    '画像の形式は一覧から外さないでください。カバーと日記の写真も同じ一覧でチェックされます。',
  // toggle-addon
  'help.guide.toggle-addon.title': 'アドオンをオン・オフにする',
  'help.guide.toggle-addon.goal': '機能モジュールを全員が使えるようにするか、使えなくします。',
  'help.guide.toggle-addon.step.1':
    'アドオンのタイルのスイッチをクリックします。ナビゲーションの項目が、全員に対してすぐに表示・非表示になります。',
  'help.guide.toggle-addon.step.2':
    'タイルによっては、オプション用の行があります（「リスト」の「バッグ管理」、「日記」の写真プロバイダーなど）。これらはアドオンがオンの場合だけ表示されます。',
  'help.guide.toggle-addon.result':
    'アドオンをオフにしても、データは残ります。もう一度オンにすると、データがまた表示されます。',
  'help.guide.toggle-addon.tip.1':
    'MCP をオフにすると、エンドポイントと、それを使う「連携」のセクションがなくなります。',
  'help.guide.toggle-addon.tip.2':
    'Vacay、Atlas、日記は、ユーザーから特に要望の多いアドオンです。「ドキュメント」にはアップロード用のストレージが必要です。',
  // install-plugin
  'help.guide.install-plugin.title': 'プラグインをインストールする',
  'help.guide.install-plugin.goal': 'サードパーティ製のプラグインを追加し、求められた権限だけを付与します。',
  'help.guide.install-plugin.step.1':
    '「探す」を開き、「プラグインを検索…」か「タイプ」のフィルターでプラグインを見つけて「インストール」をクリックします。パッケージファイルの場合は、「プラグインをアップロード」（カード右上の雲のアイコン）をクリックするか、ページに.zipをドロップします。',
  'help.guide.install-plugin.step.2':
    '「インストール済み」で行の内容を確認します。プラグインがアクセスできる範囲、接続先のホスト、「レビュー済み」「署名済み」かどうかです。そのあと「プラグインを有効にする」をオンにすると、行に「有効」と表示されます。',
  'help.guide.install-plugin.step.3':
    '行の⋯メニューには、「再起動」「エラーログを表示」「許可するホスト」「バージョン変更…」と、ソースへのリンクがあります。「削除」でプラグインとそのデータをアンインストールします。新しいバージョンがあると行にアップデートとして表示され、新しい権限を求めるバージョンは、承認するまでオフのままです。',
  'help.guide.install-plugin.result':
    'プラグインが独立したプロセスで動作します。ウィジェット、地図のレイヤー、ツールなど、プラグインが追加するものは、プラグインで決められた場所に表示されます。',
  'help.guide.install-plugin.tip.1':
    '「再スキャン」で、パッケージ化せずに開発用にリンクしたプラグインのフォルダーを検出します。',
  'help.guide.install-plugin.tip.2':
    '署名のないプラグインにはその旨が表示されます。提供元を信頼できる場合だけインストールしてください。',
  // storage-backends
  'help.guide.storage-backends.title': 'アップロードをS3に移す、またはミラーリングする',
  'help.guide.storage-backends.goal':
    'ファイルをオブジェクトストレージに保存する、またはすべてのアップロードを2つ目のバックエンドにもコピーします。',
  'help.guide.storage-backends.step.1':
    '「バックエンド」で「バックエンドを追加」をクリックし、「名前」を付け、「タイプ」（ローカルかS3）を選んで各欄を入力します。別の場所にもコピーを置くには、「ミラー先」にチェックを入れます。「適用」をクリックし、新しい行の「テスト」で接続を確認します。',
  'help.guide.storage-backends.step.2':
    '「カテゴリ」で、「旅行の書類」「日記の写真」「バックアップ」など、アップロードの種類ごとにバックエンドを割り当てます。',
  'help.guide.storage-backends.step.3':
    '下部の「変更を保存」をクリックします。カテゴリの保存先が変わる場合は、「既存のオブジェクトを移動」するか「新規書き込みのみ切り替える」かを確認されます。',
  'help.guide.storage-backends.result':
    '新しいアップロードは、割り当てたバックエンドに保存されます。移動したファイルはそこから配信され、移動しないと選んだファイルは元の場所に残ります。',
  'help.guide.storage-backends.tip.1': '環境変数で設定したバックエンドは表示されますが、ここでは編集できません。',
  'help.guide.storage-backends.tip.2':
    'ミラー先には、新しく書き込まれたものがすべてコピーされます。それ以前に保存されたものは、行の「今すぐ同期」でコピーします。ミラー先が遅いと、そのバックエンドへのアップロードがすべて遅くなります。',
  // channels-instance
  'help.guide.channels-instance.title': '通知チャンネルを設定する',
  'help.guide.channels-instance.goal': 'ユーザーが選べるチャンネルを決め、メールを設定します。',
  'help.guide.channels-instance.step.1':
    'カードのヘッダーで「メール（SMTP）」をオンにし、SMTPホスト、SMTPポート、SMTPユーザー、SMTPパスワード、送信元アドレスを入力して「保存」をクリックします。「テストメール送信」で自分宛てにメールを送れます。「TLS 証明書の検証をスキップ」は、独自の証明書を使うローカルのメールサーバー専用です。',
  'help.guide.channels-instance.step.2':
    'Webhook、Ntfy、「Webプッシュ」をオンにすると、ユーザーが使えるようになります。ユーザーは「設定」の「通知」で、自分のURLやトピックを入力するか、端末ごとにプッシュをオンにします。',
  'help.guide.channels-instance.step.3':
    '「旅行リマインダー」で、旅行が始まる前のリマインダーのオン・オフを切り替えます。「アプリ内」は常にオンです。',
  'help.guide.channels-instance.result': 'すべてのユーザーの「通知」タブに、オンにしたチャンネルが表示されます。',
  'help.guide.channels-instance.tip.1':
    '「管理者Ntfy」カードの「Ntfy サーバーURL」は、ユーザーの既定のサーバーにもなります。ユーザーは自分のサーバーを設定することもできます。',
  'help.guide.channels-instance.tip.2':
    'プラグインのチャンネルは、その機能を持つプラグインが有効になると自動で表示されます。',
  // admin-channels
  'help.guide.admin-channels.title': '管理者向けのイベントをスマートフォンで受け取る',
  'help.guide.admin-channels.goal':
    '新しいリリース、ストレージのミラーの障害、パドル地域のリクエストを通知で受け取ります。',
  'help.guide.admin-channels.step.1':
    '「管理者Ntfy」で「管理者トピック」と、必要なら「Ntfy サーバーURL」と「アクセストークン（任意）」を入力します。「管理者Webhook」ではURLを入力します。それぞれのカードで「保存」をクリックします。',
  'help.guide.admin-channels.step.2':
    '「ntfyテスト送信」か「Webhookテスト送信」をクリックして、メッセージが届くか確認します。',
  'help.guide.admin-channels.result':
    '管理者向けのイベントはアプリ内のすべての管理者に届き、オンにしていれば管理者用のntfyトピックとWebhookにも送られます。',
  'help.guide.admin-channels.tip.1':
    '管理者用のトピックは個人用のものと分けておきましょう。障害の通知が旅行の通知に埋もれずに済みます。',
  'help.guide.admin-channels.tip.2':
    '管理者用のWebhookとトピックは、「設定」の「通知」にある自分のチャンネルとは別のものです。',
  // mcp-tokens-admin
  'help.guide.mcp-tokens-admin.title': 'AI のアクセスを取り消す',
  'help.guide.mcp-tokens-admin.goal': 'AI クライアントが持つトークンとセッションを、全ユーザー分確認して取り消します。',
  'help.guide.mcp-tokens-admin.step.1':
    '「OAuthセッション」で、名前と所有者からクライアントを探します。チップには付与されたスコープが表示されます。ゴミ箱アイコンで、確認後にセッションを取り消します。',
  'help.guide.mcp-tokens-admin.step.2':
    '「API トークン」でも同じように、名前、所有者、「作成日」「最終使用」が表示されます。ゴミ箱アイコンでトークンを削除すると、そのクライアントはすぐに使えなくなります。',
  'help.guide.mcp-tokens-admin.result':
    'クライアントのユーザーは、もう一度接続する必要があります。ほかは何も変わりません。',
  'help.guide.mcp-tokens-admin.tip.1':
    'スコープを見ると、クライアントに何ができたかがわかります。読み取り専用のスコープなら残しておいても安全です。',
  'help.guide.mcp-tokens-admin.tip.2':
    'MCPアドオンをオフにすると、すべてのクライアントがすぐに使えなくなり、このタブも非表示になりますが、何も削除されません。再びオンにすると、トークンはまた使えます。',
  // release-history
  'help.guide.release-history.title': '新しいリリースを確認する',
  'help.guide.release-history.goal': 'TREKが最新かどうかと、次のバージョンの内容を確認します。',
  'help.guide.release-history.step.1':
    '新しいリリースがあると、ページのヘッダーの下に、今のバージョンと一緒に「アップデートあり」が表示されます。「GitHubで見る」でリリースのページが開き、「更新方法」にはDocker用のコマンドか、ほかの環境向けの更新ガイドが表示されます。',
  'help.guide.release-history.step.2':
    '「リリース履歴」には、すべてのリリースがリリースノート付きで一覧表示されます。「詳細を表示」で内容を展開できます。最新のリリースには「最新」ラベルが付き、「さらに読み込む」で過去のリリースを表示できます。',
  'help.guide.release-history.result':
    'アップデートはホスト側で、新しいイメージを取得するか、新しいタグをビルドして行います。データディレクトリはそのまま残ります。',
  'help.guide.release-history.tip.1':
    'アップデートの前にバックアップを取りましょう。「バックアップ」タブはこのタブの隣にあります。',
  'help.guide.release-history.tip.2':
    'プレリリースは表示されますが、自分がプレリリースを使っている場合を除き、アップデートとしては通知されません。',
  // create-backup
  'help.guide.create-backup.title': 'バックアップを作成・復元する',
  'help.guide.create-backup.goal':
    'インスタンス全体をバックアップし、別の場所にもコピーを保存して、復元できるようにします。',
  'help.guide.create-backup.step.1':
    '「データバックアップ」で、右上の「バックアップを作成」をクリックします。データベースとアップロードが1つのファイルにまとめてサーバーに保存されます。',
  'help.guide.create-backup.step.2':
    '「ダウンロード」でサーバーの外にコピーを保存できます。ゴミ箱アイコンで、確認後に古いバックアップを削除します。',
  'help.guide.create-backup.step.3':
    'バックアップの「復元」、またはファイルを使う「バックアップをアップロード」は、「バックアップを復元しますか？」で「はい、復元します」をクリックすると、現在のデータをすべて置き換えます。',
  'help.guide.create-backup.result':
    '復元すると、ユーザー、旅行、ファイル、設定が、そのバックアップの時点とまったく同じ状態に戻ります。',
  'help.guide.create-backup.tip.1': 'ここで元に戻せない操作は復元だけです。先に新しいバックアップを作成してください。',
  'help.guide.create-backup.tip.2':
    'バックアップはデータディレクトリに保存されます。このマシンが故障しても失われないよう、別のマシンにコピーしておきましょう。',
  // auto-backup
  'help.guide.auto-backup.title': 'バックアップをスケジュールする',
  'help.guide.auto-backup.goal': 'サーバーが自動でバックアップを作成し、古いバックアップを削除するようにします。',
  'help.guide.auto-backup.step.1':
    '「自動バックアップ」で「自動バックアップを有効化」をオンにし、「間隔」（「毎時間」「毎日」「毎週」「毎月」）、「実行時刻」、毎週・毎月の場合は「曜日」か「月の日」を選びます。',
  'help.guide.auto-backup.step.2':
    '「古いバックアップを削除」で、バックアップの保存期間を「1日」から「無期限」の中から選び、「保存」をクリックします。',
  'help.guide.auto-backup.result':
    'スケジュールどおりにバックアップが一覧に追加されます。選んだ期間より古いバックアップは削除されます。',
  'help.guide.auto-backup.tip.1':
    '「実行時刻」はサーバーの時刻です。下のヒントにサーバーのタイムゾーンが表示されます。',
  'help.guide.auto-backup.tip.2':
    'サーバーの容量には限りがあります。通常は7日か14日で十分です。ダウンロードしたコピーを別の場所にも保管しておきましょう。',
  // audit-log
  'help.guide.audit-log.title': '監査ログを確認する',
  'help.guide.audit-log.goal': '誰が、いつ、何をしたかを調べます。',
  'help.guide.audit-log.step.1':
    '新しい順に並んだ行を確認します。項目は「時刻」「ユーザー」「操作」「対象」、IP、「詳細」です。操作名は、ログイン失敗、MFAの変更、復元など、起きた内容を表します。',
  'help.guide.audit-log.step.2':
    '右上の「更新」で一覧を再読み込みします。タイトル横のバッジには、全件のうち読み込んだ件数が表示されます。「さらに読み込む」で古い記録を読み込みます。',
  'help.guide.audit-log.result': '変更の理由を聞かれたときに見せられる記録が手に入ります。',
  'help.guide.audit-log.tip.1': '時刻はサーバーのタイムゾーンで表示されます。',
  'help.guide.audit-log.tip.2': 'ログは追記専用です。アプリから編集や削除はできません。',
  // document-providers
  'help.guide.document-providers.title': 'ドキュメントの保管先を提供する',
  'help.guide.document-providers.goal': '旅行がドキュメントを同期できる保管先を決めます。',
  'help.guide.document-providers.step.1':
    '「ドキュメント」のタイルに、保管先がPaperless-ngx、Papra、Nextcloud、OpenCloud、Synology Driveの行で並んでいます。5つとも初期設定はオフで、これらの行は「ドキュメント」自体がオンの場合だけ表示されます。',
  'help.guide.document-providers.step.2':
    'Nextcloudの行のスイッチをオンにします。「アドオンを更新しました」と表示され、以降、旅行の所有者は旅行の「ファイル」タブで「ドキュメント同期」を使えるようになり、「連携先を接続」にNextcloudが表示されます。',
  'help.guide.document-providers.result':
    'このTREKのすべての旅行で保管先を使えるようになります。旅行の所有者が接続するまでは、何も接続されません。',
  'help.guide.document-providers.tip.1':
    'ここで決めるのは、保管先を選択肢として出すかどうかだけです。アドレスと認証情報は旅行ごとの設定で、旅行のオーナーがその旅行の「ファイル」タブで入力します。管理パネルでは入力しません。',
  'help.guide.document-providers.tip.2':
    '「ドキュメント」をオフにすると、すべての保管先もオフになります。「ドキュメント」がオフの間は保管先をオンにできず、サーバーから「先にドキュメントアドオンを有効にしてください」と返されます。自分のネットワーク内にある保管先を使うには、サーバーで ALLOW_INTERNAL_NETWORK=true の設定も必要です。',

  // ── Screen: trip ──────────────────────────────────────────────────────────────────────
  'help.ctx.trip.title': '旅行',
  'help.ctx.trip.summary':
    '1つの旅行に関するすべてです。日、地図、場所で構成される計画画面と、ツアー、移動、予約、リスト、費用、ファイル、コラボ、リンクした日記の各タブがあります。それぞれについて、この下に専用のヘルプがあります。',
  'help.ctx.trip.bullet.1':
    'トップバーの下のタブバー：「予定」「ツアー」「移動」「予約」「リスト」「費用」「ファイル」「コラボ」、日記をリンクすると「日記」も表示されます。どのタブがあるかは、TREKのアドオンとプラグインで決まります。',
  'help.ctx.trip.bullet.2':
    '「予定」は3列構成で、左に日、中央に地図、右に場所があります。ロードトリップアドオンがあると日の列の先頭に「日」と「ロードトリップ」の切り替えが、ツアーアドオンがあると場所の列の先頭に「場所」と「ツアー」の切り替えが表示されます。予約と移動は計画の一部として、立ち寄り先の位置や立ち寄り先の間に表示され、タブではその一覧を見られます。',
  'help.ctx.trip.bullet.3':
    '左上の旅行名の横にあるピル「旅行の設定」で、旅行の設定が開きます。「メンバー」（メンバーとゲスト）、「共有」（閲覧専用の公開リンクと招待リンク）、「日記」があります。',
  'help.ctx.trip.bullet.4':
    'タイトル、日付、カバー、通貨は、「マイ旅行」で旅行カードの鉛筆アイコンから編集します。左上の旅行名をクリックすると、そこに戻れます。',
  'help.ctx.trip.bullet.5':
    '列の内側の端にあるタブで列を折りたたむと、空いたスペースに地図が広がります。折りたたんだ列は地図の上の角に小さなタイルとして表示され、クリックすると再び表示されます。列の横の細い区切り線をドラッグすると幅を変えられます。',
  'help.ctx.trip.bullet.6': '日のツールバーにある元に戻す矢印で、計画に加えた最近の変更を1つずつ取り消せます。',
  // add-member
  'help.guide.add-member.title': 'メンバーを追加する',
  'help.guide.add-member.goal': 'TREK アカウントを持っている人に、この旅行へのアクセス権を与えます。',
  'help.guide.add-member.step.1': '左上の旅行名の横にあるピル「旅行の設定」をクリックします。「メンバー」が開きます。',
  'help.guide.add-member.step.2': '「ユーザーを招待」で、「ユーザーを選択…」から相手を選び、「招待」をクリックします。',
  'help.guide.add-member.step.3':
    'その人が「アクセス」に表示されます。所有者には「所有者」バッジが付きます。行の右端の「アクセスを削除」を使うと、確認後にその人が外れます。',
  'help.guide.add-member.result':
    'メンバーは、管理者が「権限設定」で決めた範囲内で、あなたと同じように旅行を閲覧・編集できます。',
  'help.guide.add-member.tip.1':
    '一覧に出てこない人は、まだ TREK アカウントを持っていません。ゲストとして追加するか、招待リンクから登録してもらいましょう。',
  'help.guide.add-member.tip.2': '「アクセス」の横の数字は旅行のメンバーの数です。ゲストはその下に別に表示されます。',
  // trip-invite-link
  'help.guide.trip-invite-link.title': 'リンクで招待する',
  'help.guide.trip-invite-link.goal': 'リンクから自分で旅行に参加してもらいます。',
  'help.guide.trip-invite-link.step.1':
    '旅行名の横の「旅行の設定」をクリックし、左側で「共有」を選びます。「旅行の招待リンク」で「招待リンクを作成」をクリックします。',
  'help.guide.trip-invite-link.step.2':
    '「コピー」をクリックしてリンクを送ります。TREK アカウントを持っている人がリンクを開くと、メンバーとして参加します。',
  'help.guide.trip-invite-link.step.3':
    '「再生成」でリンクが新しくなり、古いリンクは使えなくなります。「無効にする」でリンクをオフにします。',
  'help.guide.trip-invite-link.result': 'リンクを開いた人は旅行に参加し、「アクセス」に表示されます。',
  'help.guide.trip-invite-link.tip.1':
    'アカウントを持っていない人は使えません。管理者は「管理」の「ユーザー」で登録リンクを作成でき、この旅行にリンクすることもできます。',
  'help.guide.trip-invite-link.tip.2':
    '間違ったチャットにリンクを送ってしまった場合は、リンクを再生成してください。古いリンクはすぐに使えなくなります。',
  // add-guest
  'help.guide.add-guest.title': 'アカウントのないゲストを追加する',
  'help.guide.add-guest.goal': 'TREKを使っていない人を旅行に追加します。',
  'help.guide.add-guest.step.1':
    '旅行名の横の「旅行の設定」をクリックします。「メンバー」では、「アクセス」の下のいちばん最後に「ゲスト」があります。',
  'help.guide.add-guest.step.2': '「ゲスト名」に名前を入力し、「ゲストを追加」をクリックします。',
  'help.guide.add-guest.result': 'ゲストは費用、持ち物、タスクに割り当てられますが、サインインはできません。',
  'help.guide.add-guest.tip.1':
    '「名前を変更」（鉛筆アイコン）でゲストの名前を変えます。「アクセスを削除」（ゴミ箱アイコン）では、確認後にゲストを削除します。ゲストへの割り当ては削除され、各支出のゲストの負担分は、その分け方に含まれるほかの人で分けられます。',
  'help.guide.add-guest.tip.2': 'その人があとでアカウントを作ったら、メンバーとして招待し、ゲストは削除してください。',
  // public-link
  'help.guide.public-link.title': '閲覧専用のリンクを公開する',
  'help.guide.public-link.goal': '編集はさせずに、旅行を見せます。',
  'help.guide.public-link.step.1': '旅行名の横の「旅行の設定」をクリックし、左側で「共有」を選びます。',
  'help.guide.public-link.step.2':
    '「公開リンク」カードで、リンクで見せる内容をオンにします。「地図・プラン」は常にオンで、「予約」「持ち物」「費用」「チャット」は自由に選べます。',
  'help.guide.public-link.step.3':
    '「選択肢」の「移動と宿泊のみ」では、アクティビティ、日のメモ、空の日が除外されます。「写真なし」では、場所の写真が除外されます。',
  'help.guide.public-link.result':
    'リンクを知っている人は、ログインせずに選んだ部分を見られますが、何も変更できません。',
  'help.guide.public-link.tip.1':
    'リンクはどこにも公開されませんが、知っている人なら誰でも開けます。パスワードと同じように大切に扱ってください。',
  'help.guide.public-link.tip.2': '編集権限を渡したい場合は、代わりにメンバーとして追加してください。',
  // transfer-ownership
  'help.guide.transfer-ownership.title': '旅行を譲る、または旅行から抜ける',
  'help.guide.transfer-ownership.goal': 'ほかの人をオーナーにするか、自分がオーナーでない旅行から抜けます。',
  'help.guide.transfer-ownership.step.1':
    '旅行名の横の「旅行の設定」をクリックします。「アクセス」で、メンバーの行の「オーナーにする」（王冠のアイコン）をクリックして確定します。',
  'help.guide.transfer-ownership.step.2':
    '自分の行の「旅行を退出」で、確認後に旅行から抜けます。所有者の場合は、先に所有権を譲ってください。',
  'help.guide.transfer-ownership.result':
    '新しいオーナーがメンバーを管理し、旅行を削除できるようになります。あなたは通常のメンバーとして残ります。',
  'help.guide.transfer-ownership.tip.1':
    '所有権を譲るまでは、旅行を作成した人が所有者です。旅行を削除できるのは所有者だけです。',
  'help.guide.transfer-ownership.tip.2':
    'ほかのメンバーの行にある「アクセスを削除」はその逆で、所有者がそのメンバーを旅行から外します。',
  // collapse-columns
  'help.guide.collapse-columns.title': '地図を広く表示する',
  'help.guide.collapse-columns.goal': '列を折りたたむか、幅を広げます。',
  'help.guide.collapse-columns.step.1':
    '日程の列の内側の端にある、パネルアイコンの付いたタブをクリックすると、列が折りたたまれ、空いたスペースにマップが広がります。場所の列にも同じタブがあります。',
  'help.guide.collapse-columns.step.2':
    '列を折りたたむと、地図の上の角にパネルのアイコンが付いた小さなタイルが表示されます。ツールチップには「予定」か「場所」と表示されます。クリックすると列がまた表示されます。',
  'help.guide.collapse-columns.step.3': '列とマップの間にある細い区切り線をドラッグすると、列の幅を変えられます。',
  'help.guide.collapse-columns.result': '幅は保存されます。次に開いたときは、列は再び開いた状態で表示されます。',
  'help.guide.collapse-columns.tip.1': '両方の列を同時に折りたたむと、地図だけを表示できます。',
  'help.guide.collapse-columns.tip.2':
    'ウィンドウの幅が狭いと列は1つしか入らず、片方を開くともう片方が閉じます。スマートフォンには列がなく、上部の「旅」「予定」「場所」で表示を切り替えます。',
  // undo-change
  'help.guide.undo-change.title': '最後の変更を元に戻す',
  'help.guide.undo-change.goal': '計画への最後の変更を元に戻します。',
  'help.guide.undo-change.step.1':
    '日程の上のツールバーにある「元に戻す」矢印をクリックします。ツールチップに、取り消される変更が表示されます。',
  'help.guide.undo-change.result': '計画が元の状態に戻り、何を取り消したかが短いメッセージで表示されます。',
  'help.guide.undo-change.tip.1':
    '「元に戻す」で取り消せるのは計画の操作です：場所の追加、割り当て、削除、並べ替え、移動、ロック、日のクリア、ルートの最適化、場所の削除、カテゴリの変更、インポート。',
  'help.guide.undo-change.tip.2':
    '繰り返しクリックすると、さらに前に戻れます。TREKはこの旅行での直近30件の変更を、旅行を離れるまで新しい順に保持します。',
  'help.guide.clear-day.title': '日を空にする',
  'help.guide.clear-day.goal':
    '日からすべての場所をまとめて外します。たとえば、その日を一から計画し直すときに使います。',
  'help.guide.clear-day.step.1': '計画画面で、日のヘッダーを右クリックします。',
  'help.guide.clear-day.step.2': '「日をクリア」を選び、確定します。',
  'help.guide.clear-day.result':
    'その日は空になり、場所は未計画としてリストに戻ります。日程の上にある「元に戻す」矢印で元に戻せます。',
  'help.guide.clear-day.tip.1': '外れるのは場所だけです。その日のメモと予約は残ります。',

  // ── Screen: trip-places ───────────────────────────────────────────────────────────────
  'help.ctx.trip-places.title': '場所',
  'help.ctx.trip-places.summary':
    '計画画面の右の列です。計画済みかどうかにかかわらず旅行のすべての場所が表示され、検索、フィルター、並べ替えができます。場所は検索、手動、共有されたリストから追加できます。上部の「場所」と「ツアー」で、場所と旅行のツアーを切り替えます。',
  'help.ctx.trip-places.bullet.1':
    '列の上部の「場所」と「ツアー」で一覧を切り替えます。最初は「場所」が開いています。「ツアー」には旅行のツアーが並び、「GPXまたはKMLをインポート」でGPX、KML、KMZファイルを取り込めます。ツアーは場所の一覧には表示されません。',
  'help.ctx.trip-places.bullet.2':
    '「場所／アクティビティを追加」で、検索するか入力して場所を追加するフォームが開きます。日を開いているときはボタンが「新しい場所」になり、横の「この日へ」でその日に直接場所を作成できます。',
  'help.ctx.trip-places.bullet.3':
    'その横のアイコンボタン「場所をインポート」には、Google MapsやNaver Mapsで共有したリスト用の「リストをインポート」があります。管理者がツアーアドオンをオフにしている場合は、.gpx、.kml、.kmzファイル用の「ファイルをインポート」もあり、ファイルを列にドロップすることもできます。',
  'help.ctx.trip-places.bullet.4':
    'その下に、説明とメモも検索対象になる「検索」と、その横の「選択」チェックボックスがあります。さらに下の行がフィルターです。「表示」で「すべて」「未計画」「予定」を件数付きで切り替えます。タグのボタンでカテゴリ、星で最低評価、地球儀（旅行が複数の国や地域にまたがる場合）で国や地域を絞り込み、「並べ替え」で一覧の順番を決めます。',
  'help.ctx.trip-places.bullet.5':
    '各行には画像、名前、説明か住所が表示され、誰かが評価した場所には平均評価の星が付きます。クリックすると場所の詳細が開きます。日にドラッグすることも、右クリック（または三点メニュー「その他のオプション」）で「編集」「+ 日」「Webサイトを開く」、Googleマップ、「コレクションに保存」「削除」を使うこともできます。',
  'help.ctx.trip-places.bullet.6':
    '日を開いている間は、行の右端の丸い＋（「+ 日」）で、その場所をその日に追加できます。この＋は、その日にまだ入っていない場所すべてに表示されます。このとき「予定」にはその日の場所だけが表示され、「開いている日のみ表示中」のチップが表示されます。チップの×「旅行全体を表示」で日が閉じます。',
  // create-place
  'help.guide.create-place.title': '場所を作成する',
  'help.guide.create-place.goal': '予定に必要な情報をすべて入れて、場所やアクティビティを手動で追加します。',
  'help.guide.create-place.step.1':
    '場所の列の上部にある「場所／アクティビティを追加」（日を開いているときは「新しい場所」）をクリックします。検索欄にカーソルがある状態でフォームが開きます。',
  'help.guide.create-place.step.2':
    '「場所を検索…」に場所を入力し、結果を選びます。ダイアログ上部の名前、「アドレス」「緯度」「経度」「ウェブサイト」が入力され、左の「場所の詳細」に画像、営業時間、説明が表示されます。Googleのキーを設定したTREKでは、結果の下の「この場所ではありませんか？Googleで検索」で、同じ検索をGoogleで行えます。コレクションがオンの場合は、右の「保存済みの場所」で自分のリストの場所も同じように選べます。',
  'help.guide.create-place.step.3':
    '「場所の詳細」の「写真を選ぶ」で画像をクリックすると、場所の画像になります。「このテキストを使う」を押すと、説明がフォームにコピーされます。',
  'help.guide.create-place.step.4':
    'フォームの内容を確認します。必須なのは、ダイアログ上部の名前だけです。その下の「カテゴリ」ピルで旅行のカテゴリを選び、横の＋で新しいカテゴリを作れます。「アドレス」「緯度」「経度」は検索結果から入るか、自分で入力します。「説明」と「ノート」には自由にメモを書けます。「ウェブサイト」にはリンクを入れ、「ファイル」の「添付」で書類を追加します。「電話」「メール」「営業時間を追加」には、検索で見つからなかった情報を入力します。',
  'help.guide.create-place.step.5':
    '「追加」をクリックします。同じ名前か同じ位置の場所がすでに旅行にある場合は警告が表示され、ボタンが「それでも追加」に変わります。',
  'help.guide.create-place.result': '場所が一覧と地図に追加されます。日に入れるまでは「未計画」に表示されます。',
  'help.guide.create-place.tip.1':
    '「予算」アドオンがオンの場合、フォーム下部の「費用」を使うと、保存直後にその場所の支出の「費用」エディターが開きます。ダイアログに貼り付けた画像やPDFは、「ファイル」に添付されます。',
  'help.guide.create-place.tip.2':
    'どのTREKでも、検索結果はTREKのインデックスとOpenStreetMapから取得し、「場所の詳細」はWikipedia、Wikivoyage、Wikimediaから自動で入力されます。両方で見つからない場合だけGoogleに問い合わせ、評価はGoogleからだけ取得されます。',
  'help.guide.create-place.tip.3':
    'マップから場所を作ることもできます。地点を右クリックすると、座標と住所が入力された状態でフォームが開きます。',
  // place-to-open-day
  'help.guide.place-to-open-day.title': '開いている日に場所を直接追加する',
  'help.guide.place-to-open-day.goal': '場所を作成するか選んで、一度にその日に追加します。',
  'help.guide.place-to-open-day.step.1':
    '日の列で日のヘッダーをクリックします。日が開いてカードが強調表示され、場所の列の「新しい場所」の横に「この日へ」ボタンが表示されます。',
  'help.guide.place-to-open-day.step.2':
    '「この日へ」では「新しい場所」と同じフォームが開きますが、「追加」をクリックするとすぐに、開いている日に場所が追加されます。',
  'help.guide.place-to-open-day.step.3':
    '既存の場所を開いている日に追加するには、行の右端の丸い＋（「+ 日」）をクリックするか、右クリックして「+ 日」を選びます。＋は、その日にまだ入っていない場所すべてに表示されます。',
  'help.guide.place-to-open-day.step.4':
    '先に日を開かなくても、逆の方法で追加できます。場所の行を列からドラッグして、日のカードにドロップします。2つの立ち寄り先の間にドロップすると、その位置に入ります。',
  'help.guide.place-to-open-day.result':
    '場所がその日の最後に追加されます。上下にドラッグして、正しい位置に移動します。',
  'help.guide.place-to-open-day.tip.1':
    '開いている日は検索にも影響します。日を開いているときは、地図と周辺の検索が、その日にすでにある場所を基準に始まります。',
  'help.guide.place-to-open-day.tip.2': '日の上のツールバーにある「元に戻す」で、割り当てを取り消せます。',
  // filter-places
  'help.guide.filter-places.title': '一覧から場所を探す',
  'help.guide.filter-places.goal': '列に、探している場所だけを表示します。',
  'help.guide.filter-places.step.1':
    '検索の下のドロップダウン「表示」で、「すべて」「未計画」（まだどの日にも入っていない）「予定」（いずれかの日に入っている）を切り替えます。それぞれ件数も表示されます。ツアーアドオンがオフでGPXトラックをインポートしている場合は、「トラック」も選べます。',
  'help.guide.filter-places.step.2':
    '上部の「検索」に入力します。入力するそばから、名前、住所、説明、メモで一覧が絞り込まれます。入力欄の×で消去できます。',
  'help.guide.filter-places.step.3':
    '「表示」の横にあるタグのボタンでカテゴリの一覧が開きます。1つ以上にチェックを入れます（「カテゴリなし」もあります）。ボタンにはチェックした数が表示され、一覧下部の「フィルター解除」ですべて外れます。',
  'help.guide.filter-places.step.4':
    'その横の星で最低評価を設定します。5+、4+などを選ぶと、平均評価がそれ以上の場所だけが表示されます。評価のない場所は非表示になります。',
  'help.guide.filter-places.result':
    '「表示」の数字に当てはまる場所の数が表示されます。フィルターは組み合わせて使えます。',
  'help.guide.filter-places.tip.1':
    '日を開いているときは、「予定」にその日の場所だけが表示され、「開いている日のみ表示中」と、その隣に「旅行全体を表示」が表示されます。',
  'help.guide.filter-places.tip.2':
    '地図にも「表示」、カテゴリ、評価が適用されます。日を開いているときは、地図の「予定」にその日の場所だけが表示されます。検索と地球儀のフィルターは一覧だけに適用されます。',
  // edit-place
  'help.guide.edit-place.title': '場所を変更する',
  'help.guide.edit-place.goal':
    '名前を直したり、ピンを移動したり、ウェブサイトを追加したり、カテゴリを変えたりします。',
  'help.guide.edit-place.step.1':
    '行を右クリックして「編集」を選ぶか、行の右端の「その他のオプション」をクリックするか、場所を開いて詳細の「編集」をクリックします。',
  'help.guide.edit-place.step.2':
    '「場所を編集」で必要な項目を変更します。ダイアログ上部の名前と「カテゴリ」ピル、「アドレス」「緯度」「経度」「説明」「ノート」「ウェブサイト」「電話」「メール」、営業時間です。場所がちょうど1日だけに入っている場合や、日から開いた場合は、その日の「開始」「終了」「この日のメモ」もフォームに表示されます。',
  'help.guide.edit-place.step.3': '「更新」をクリックします。',
  'help.guide.edit-place.result':
    '変更は、一覧、地図、その場所が入っているすべての日など、その場所が表示されるすべての場所に反映されます。',
  'help.guide.edit-place.tip.1': '「この日のメモ」はその日の場所だけのメモで、「ノート」は場所そのもののメモです。',
  'help.guide.edit-place.tip.2':
    '「終了」が「開始」より前だと「更新」できません。「時間が重複しています：」は、その日の別の立ち寄り先と時間が重なっていることを知らせるだけです。',
  // delete-place
  'help.guide.delete-place.title': '場所を削除する',
  'help.guide.delete-place.goal': '旅行から場所を完全に削除します。',
  'help.guide.delete-place.step.1':
    '行を右クリックして「削除」を選ぶか（行の右端の「その他のオプション」にもあります）、場所の詳細で「削除」をクリックします。',
  'help.guide.delete-place.step.2':
    '確認メッセージで「削除」をクリックします。その場所に宿泊が予約されている場合や、予約がリンクされている場合は、一緒に削除されるものが確認メッセージに表示されます。',
  'help.guide.delete-place.result':
    '場所が一覧、地図、すべての日から削除されます。日の上のツールバーにある「元に戻す」で元に戻せます。',
  'help.guide.delete-place.tip.1': '特定の日からだけ外すには、その立ち寄り先の「この日から削除」を使ってください。',
  'help.guide.delete-place.tip.2': '複数の場所をまとめて削除するには、検索の横のチェックをクリックして選択を始めます。',
  // select-places
  'help.guide.select-places.title': '複数の場所をまとめて変更・削除する',
  'help.guide.select-places.goal': '1つずつではなく、複数の場所をまとめて変更します。',
  'help.guide.select-places.step.1':
    '検索欄の隣にあるチェックをクリックします。行に丸いチェックボックスが表示され、列の下部に操作用のバーが表示されます。',
  'help.guide.select-places.step.2':
    '行をクリックしてチェックを入れます。バーにある二重チェックの「すべて選択」で、フィルターで表示されているすべての行を選択できます。',
  'help.guide.select-places.step.3':
    'バーにチェックした場所の数が表示されます。「カテゴリを変更」で全部を同じカテゴリにし、「コレクションに保存」（コレクションがオンの場合）で自分のコレクションの1つにコピーし、「選択を削除」で確認後に削除します。',
  'help.guide.select-places.step.4': 'バーの右端の×（「完了」）をクリックして、選択を終えます。',
  'help.guide.select-places.result':
    '選んだすべての場所に変更が適用されます。削除は日の上のツールバーから元に戻せます。',
  'help.guide.select-places.tip.1':
    '選択中もフィルターは使えます。先に「未計画」で絞り込んでから「すべて選択」を使うと、その場所だけが選択されます。',
  'help.guide.select-places.tip.2':
    '「コレクション」アドオンがオンのときは、バーに「リストで訪問済みにする」が表示されます。保存先のコレクションで、その場所を訪問済みにします。',
  // import-places-file
  'help.guide.import-places-file.title': 'GPX、KML、KMZ ファイルから場所をインポートする',
  'help.guide.import-places-file.goal':
    'ツアーアドオンがオフの場合に、Google マイマップ、Google Earth、GPSトラッカーから書き出したピンや経路を、場所としてインポートします。',
  'help.guide.import-places-file.step.1':
    '追加ボタンの横のアイコンボタン「場所をインポート」をクリックして「ファイルをインポート」を選ぶか、場所の列のどこかにファイルをドロップします。どちらも、管理者がツアーアドオンをオフにしている場合だけ使えます。',
  'help.guide.import-places-file.step.2':
    'ファイルを選ぶか、ボックスにドラッグします。GPXの場合は、インポートする項目にチェックを入れます：「ウェイポイント」「ルート」「トラック（経路付き）」。KMLとKMZの場合は、「ポイント（プレースマーク）」と「パス（ライン）」にチェックを入れます。',
  'help.guide.import-places-file.step.3':
    'ボックスには複数のファイルを一度に入れられますが、対応するのは.gpx、.kml、.kmzだけです。それ以外の形式や10 MBを超えるファイルはダイアログで拒否され、インポートされません。',
  'help.guide.import-places-file.step.4':
    '「インポート」をクリックします。インポートした場所の数がメッセージで表示されます。KMLやKMZの場合はダイアログが開いたままになり、作成されたものとスキップされたものの概要が表示されます。',
  'help.guide.import-places-file.result':
    '場所が一覧に追加されます。トラックは行に色の線が付き、地図に描かれ、専用の「トラック」フィルターで絞り込めます。',
  'help.guide.import-places-file.tip.1':
    'ファイルが大きすぎると読み込めず、サイズの上限が表示されます。写真なしでエクスポートし直すか、ファイルを分割してください。',
  'help.guide.import-places-file.tip.2': 'インポート全体を、日程の上のツールバーから取り消せます。',
  // import-places-list
  'help.guide.import-places-list.title': '共有された Google マップや NAVER Map のリストをインポートする',
  'help.guide.import-places-list.goal': '共有リストのリンクから場所をインポートします。',
  'help.guide.import-places-list.step.1':
    '追加ボタンの横のアイコンボタン「場所をインポート」をクリックし、「リストをインポート」を選びます。',
  'help.guide.import-places-list.step.2':
    '「プロバイダー」で「Google リスト」か「Naver リスト」を選び、リストの共有リンクを「リンク」に貼り付けます。Googleマップの経路のリンクも使えます。その場合、経由地が運転する順に場所になります。',
  'help.guide.import-places-list.step.3': '「インポート」をクリックします。',
  'help.guide.import-places-list.result':
    'リストのすべての場所が、リストと同じ名前で旅行に追加されます。旅行にすでにある場所はスキップされます。',
  'help.guide.import-places-list.tip.1':
    'リストは公開で共有されている必要があります。非公開のリストのリンクでは、何もインポートされません。',
  'help.guide.import-places-list.tip.2':
    'TREKにGoogleのキーがある場合は、ダイアログに「Googleで場所を補完」が表示されます。インポートした場所をそれぞれ検索し、写真、住所、詳細を入力します。',
  'help.guide.sort-places.title': '場所の一覧を並べ替える',
  'help.guide.sort-places.goal': '一覧を名前順、評価順、最近追加・変更した順に並べ替えます。',
  'help.guide.sort-places.step.1':
    'フィルター行の右端にある矢印のボタン「並べ替え」をクリックします。現在の並び順にチェックが付いており、ボタンのツールチップにその名前が表示されます。',
  'help.guide.sort-places.step.2': '並び順（例：「評価が高い順」）か名前順を選びます。一覧がすぐに並び替わります。',
  'help.guide.sort-places.result': 'ほかの並び順を選ぶまで、一覧は選んだ順番で表示されます。',
  'help.guide.sort-places.tip.1':
    '「追加が新しい順」以外の並び順ではボタンが強調表示されるので、いつもと違う順で並んでいることがすぐにわかります。',
  'help.guide.sort-places.tip.2':
    '並べ替えで変わるのは一覧だけです。日の順番は変わりません。選んだ並び順はブラウザーに保存されます。',
  'help.guide.place-by-hand.title': '検索で見つからない場所を追加する',
  'help.guide.place-by-hand.goal':
    '場所の検索で見つからないときに、電話番号、メールアドレス、営業時間を含めて自分で場所を入力します。',
  'help.guide.place-by-hand.step.1':
    '場所のダイアログで、検索欄に名前を入力して Enter を押します。何も見つからないとダイアログにその旨が表示され、「手動で追加」が選べるようになります。',
  'help.guide.place-by-hand.step.2':
    '「手動で追加」をクリックします。検索した文字列が名前になり、ダイアログが連絡先の欄までスクロールします。',
  'help.guide.place-by-hand.step.3': 'わかっていれば「電話」と「メール」を入力します。',
  'help.guide.place-by-hand.step.4':
    '「営業時間を追加」をクリックし、曜日ごとに開店時刻と閉店時刻を設定します。コピーボタンで最初の曜日の時間を全曜日に設定でき、曜日のスイッチでその日を「終了」（定休日）にできます。',
  'help.guide.place-by-hand.step.5': '「追加」をクリックします。',
  'help.guide.place-by-hand.result':
    '場所がリストに追加されます。詳細には、入力した電話番号、メールアドレス、営業時間が、検索で見つけた場所と同じように表示されます。',
  'help.guide.place-by-hand.tip.1':
    '営業時間が未設定の場所を編集すると、左側の「場所の詳細」から営業時間が自動でコピーされます。すでに営業時間がある場合は、横のボタンで検索した営業時間をコピーできます。',
  'help.guide.place-by-hand.tip.2':
    '入力した営業時間は検索で取得した営業時間より優先されるので、季節によって営業時間が変わるカフェでも、自分が知っている時間を表示できます。',

  // ── Screen: trip-days ─────────────────────────────────────────────────────────────────
  'help.ctx.trip-days.title': '日',
  'help.ctx.trip-days.summary':
    '計画画面の左の列です。日ごとのカードに、立ち寄り先が順番に並び、メモ、その日の予約と移動、立ち寄り先の間のルートが表示されます。旅行の計画は主にここで行います。',
  'help.ctx.trip-days.bullet.1':
    '上部のヘッダー：左に「エクスポート」（PDF、カレンダー、GPX）、右に元に戻す矢印、「すべての日を展開」／「すべての日を折りたたむ」、「日付を並べ替え」があります。描けるルートを持つ予約があれば「すべての予約ルートを表示」も表示されます。',
  'help.ctx.trip-days.bullet.2':
    '日のカード：日付の番号と天気予報のタイル、タイトル（名前を付けるまでは「1日目」）と日付があり、その下に、その夜の宿泊のピル（チェックイン日は緑、チェックアウト日は赤、未確定の間は破線。チケットのアイコンで予約が開きます）とレンタカーのピルが表示されます。ヘッダーをクリックすると日が開き、山形の矢印で折りたためます。＋（「この日に追加」）でメニューが開き、「この日に場所を追加」「宿泊先を追加」「移動手段を追加」「公共交通機関」「メモを追加」を選べます。ヘッダーを右クリックすると同じメニューに加え、「日をクリア」も表示されます。',
  'help.ctx.trip-days.bullet.3':
    '日の中身：立ち寄り先が順番に並び、それぞれ画像、カテゴリアイコン、名前、時刻、説明、紐づく予約、参加する人が表示されます。メモ、その日の予約と移動（タイプごとに色分け）も並びます。立ち寄り先にカーソルを合わせると、ドラッグ用のハンドル、画像上のロック、矢印、「予約を追加」、三点メニュー（「その他のオプション」）が表示されます。立ち寄り先とメモは右クリックでもメニューを開けます。',
  'help.ctx.trip-days.bullet.4':
    '開いている日に立ち寄り先が2つ以上あると、その下にルートバーが表示されます。「ルート」でその日を地図に表示し、立ち寄り先の間の各区間の所要時間も表示します。3つのアイコンでその日の移動手段を「車」「徒歩」「自転車」から選び、続いて「最適化」「Googleマップで開く」「CoMapsで開く」があります。',
  'help.ctx.trip-days.bullet.5':
    '日に場所を追加する方法はいくつかあります。場所の列から行をドラッグする、その行の「+ 日」を使う、日の＋か空の日の「この日に場所を追加」を使う、場所の詳細から追加する、のいずれかです。',
  'help.ctx.trip-days.bullet.6':
    '下部の「合計費用」には、「費用」の支出のうち、その日の立ち寄り先と予約に紐づくものが、それぞれ1回ずつ表示通貨で合計されます。',
  // read-day-plan
  'help.guide.read-day-plan.title': '日の内容を確認する',
  'help.guide.read-day-plan.goal': '何かを変更する前に、日のカードの各部分が何を表しているかを確認します。',
  'help.guide.read-day-plan.step.1':
    'ヘッダー：日の番号と天気予報のタイル、続いて「1日目」か付けたタイトルと日付があります。その下に、その夜の宿泊のピル（チェックイン日は緑、チェックアウト日は赤、未確定の間は破線。チケットのアイコンで予約が開きます）とレンタカーのピルがあります。ヘッダーをクリックすると日が開き、地図の上に詳細パネルが表示されます。右の＋（「この日に追加」）で場所、宿泊、移動、公共交通機関の乗り継ぎ、メモを追加でき、山形の矢印でカードを折りたためます。',
  'help.guide.read-day-plan.step.2':
    '立ち寄り先には画像、カテゴリアイコン、名前が表示され、「開始」を設定すると時刻、続いて説明が表示されます。「この日のメモ」はその下に出ます。行にカーソルを合わせると操作ボタンが現れます。左のグリップでドラッグでき、画像はルート最適化用のロックに変わり、右端には矢印（「上へ移動」「下へ移動」）、「予約を追加」、三点メニュー（「その他のオプション」）があります。',
  'help.guide.read-day-plan.step.3':
    '立ち寄り先の予約は「予約」バッジで示されます。確定済みなら緑、保留中なら琥珀色で、時刻と運航会社も表示されます。バッジをクリックすると予約が開き、横のルートボタンでそのルートが描かれます。移動はタイプごとに色分けされた専用の行で、時刻と「出発」または「到着」が表示されます。予約をクリックすると詳細が開き、そこの「編集」で変更できます。',
  'help.guide.read-day-plan.step.4':
    '「ルート」がオンのときは、2つの立ち寄り先の間に、その日の移動手段での所要時間と距離が表示されます。クリックすると、その区間だけ移動手段を変えられます。',
  'help.guide.read-day-plan.step.5':
    '開いている日の立ち寄り先の下にあるルートバー：「ルート」でその日の道順を地図に描き、3つのアイコンで「車」「徒歩」「自転車」を選びます。「最適化」で立ち寄り先を並べ替え、「Googleマップで開く」と「CoMapsで開く」でその日の道順をそれぞれのアプリで開きます。',
  'help.guide.read-day-plan.result':
    'カードの記号にはそれぞれ意味があります。それぞれの変更方法は、以下のガイドで説明しています。',
  'help.guide.read-day-plan.tip.1':
    '立ち寄り先を右クリックするか三点メニューをクリックすると、「編集」「この日から削除」「ルートから外す」「Webサイトを開く」「コレクションに保存」「削除」のメニューが開きます。ナビゲーションアプリは、場所の詳細の「ナビゲーション」にあります。',
  'help.guide.read-day-plan.tip.2':
    '立ち寄り先にカーソルを合わせると、行の末尾に「予約を追加」が表示されます。ここで作った予約は、この日のこの立ち寄り先にリンクされます。',
  // place-onto-day
  'help.guide.place-onto-day.title': '場所を日に追加する',
  'help.guide.place-onto-day.goal': '一覧の場所を、日の立ち寄り先として順番の正しい位置に追加します。',
  'help.guide.place-onto-day.step.1':
    '場所の列の行を、日のカードにドラッグします。2つの立ち寄り先の間にドロップするとその位置に、日のヘッダーにドロップすると最後に追加されます。',
  'help.guide.place-onto-day.step.2':
    'ドラッグしない方法：日の見出しをクリックして日を開き、場所の行の右端にある丸い＋（「+ 日」）をクリックするか、行を右クリックして「+ 日」を選びます。',
  'help.guide.place-onto-day.step.3':
    '日の＋メニューか空の日にある「この日に場所を追加」で場所のフォームが開き、新しい場所がすぐにその日に追加されます。',
  'help.guide.place-onto-day.step.4':
    '日を開いているときは、場所の詳細の「日に追加」でその日に入れられます。場所の列の上部にある「この日へ」では、開いている日に新しい場所を直接作成できます。',
  'help.guide.place-onto-day.result':
    '場所がその日の立ち寄り先になります。地図にはその日の番号付きで表示され、場所の列では「予定」として数えられます。',
  'help.guide.place-onto-day.tip.1':
    '1つの場所を複数の日に入れられます。2日目以降は場所の列から追加してください。立ち寄り先をある日のカードから別の日のカードへドラッグすると、追加ではなく移動になります。',
  'help.guide.place-onto-day.tip.2': 'ヘッダーの元に戻す矢印で、割り当てを取り消せます。',
  'help.guide.place-onto-day.tip.3':
    '時刻が決まっている2つの項目の間や、時刻のある予約の前には、立ち寄り先をドロップできません。予定は常に時刻順に並びます。',
  // reorder-stops
  'help.guide.reorder-stops.title': '日の中の順番を変える',
  'help.guide.reorder-stops.goal': '立ち寄り先を上下に、または別の日に移動します。',
  'help.guide.reorder-stops.step.1':
    '立ち寄り先にカーソルを合わせ、ハンドルをドラッグしてカード内の新しい位置に移動します。',
  'help.guide.reorder-stops.step.2':
    'または、カーソルを合わせた立ち寄り先の右端にある矢印（「上へ移動」「下へ移動」）を使います。1回クリックするごとに1つずつ動きます。',
  'help.guide.reorder-stops.step.3':
    '立ち寄り先を別の日のカードにドラッグすると、その日に移り、元の日からは削除されます。',
  'help.guide.reorder-stops.step.4':
    '時刻を固定した立ち寄り先を動かすと日の順番が崩れる場合は、「時刻を削除しますか？」と確認されます。時刻によって立ち寄り先の位置が決まっているためです。「確認」で時刻が削除され、どこにでも動かせるようになります。「キャンセル」なら日は元のままです。',
  'help.guide.reorder-stops.result': 'ルートと所要時間が、すぐに新しい順番に合わせて更新されます。',
  'help.guide.reorder-stops.tip.1':
    '時刻を固定した予約は、その時刻の位置から動きません。同じ日の別の位置にドロップしても元に戻ります。別の日のカードにドラッグすると、その日に移ります。',
  'help.guide.reorder-stops.tip.2':
    'その日の立ち寄り先が3つ以上ある場合は、ルートバーの「最適化」で、1日全体を最短ルートの順に並べ替えられます。位置を変えたくない立ち寄り先は、先にロックしておきます。',
  // set-stop-times
  'help.guide.set-stop-times.title': '立ち寄り先に時刻を設定する',
  'help.guide.set-stop-times.goal': '立ち寄り先の開始時刻と終了時刻を決めて、1日をスケジュールとして組み立てます。',
  'help.guide.set-stop-times.step.1':
    '立ち寄り先を右クリックするか三点メニューをクリックして、「編集」を選びます。日からフォームを開くと、場所のすぐ下にその日の「開始」と「終了」があります。',
  'help.guide.set-stop-times.step.2':
    '「開始」と、必要なら「終了」を入力します。「時間が重複しています：」は、その日の時刻付きの別の立ち寄り先と重なっていることを知らせます。「終了」が「開始」より前だと「更新」できません。',
  'help.guide.set-stop-times.step.3':
    '「更新」をクリックします。立ち寄り先に時刻のバッジが付き、その日の中で時刻に合った位置に移動します。',
  'help.guide.set-stop-times.result':
    '時刻のある立ち寄り先は順番の位置が固定され、時刻のない立ち寄り先はその前後に並びます。',
  'help.guide.set-stop-times.tip.1':
    '時刻はその日の立ち寄り先ごとの設定です。同じ場所でも、別の日には別の時刻を設定できます。',
  'help.guide.set-stop-times.tip.2':
    '時刻のある立ち寄り先を手で動かすにはドラッグします。「時刻を削除しますか？」と確認され、「確認」をクリックすると時刻が削除されます。',
  'help.guide.set-stop-times.tip.3':
    '同じフォームの「この日のメモ」には、テーブルの予約やチケット番号など、その日だけに関係する情報を入れます。',
  // remove-from-day
  'help.guide.remove-from-day.title': '立ち寄り先を日から外す',
  'help.guide.remove-from-day.goal': '旅行から削除せずに、場所を日から外します。',
  'help.guide.remove-from-day.step.1':
    '立ち寄り先を右クリックするか三点メニューをクリックして、「この日から削除」を選びます。',
  'help.guide.remove-from-day.step.2':
    '立ち寄り先がその日から外れます。場所は場所の列に残り、ほかのどの日にも入っていなければ「未計画」に表示されます。',
  'help.guide.remove-from-day.result': '日、ルート、費用が更新されます。元に戻す矢印で立ち寄り先を戻せます。',
  'help.guide.remove-from-day.tip.1': '同じメニューの「削除」では、すべての日を含め、旅行全体から場所が削除されます。',
  'help.guide.remove-from-day.tip.2': '「この日から削除」は、場所の詳細パネルの「日に追加」の横にもあります。',
  // lock-stop
  'help.guide.lock-stop.title': '立ち寄り先を固定する',
  'help.guide.lock-stop.goal': 'ルートを最適化しても、立ち寄り先の位置が変わらないようにします。',
  'help.guide.lock-stop.step.1':
    '立ち寄り先の写真にカーソルを合わせ、鍵アイコン（「最適化中も位置を保持」）をクリックします。',
  'help.guide.lock-stop.step.2':
    'これで「最適化」をすると、ほかの立ち寄り先がその周りで並べ替えられます。もう一度鍵（「クリックして解除」）をクリックすると、固定が解除されます。',
  'help.guide.lock-stop.result': '画像にロックが表示され、ロックを外すまで立ち寄り先の位置は変わりません。',
  'help.guide.lock-stop.tip.1': '時刻を固定した立ち寄り先は、時刻によって位置が固定され、最適化でも動きません。',
  'help.guide.lock-stop.tip.2':
    'ロックはページを再読み込みするまでしか保持されません。再読み込みすると、すべての立ち寄り先のロックが外れます。固定されたままなのは、時刻のある立ち寄り先だけです。',
  // day-note
  'help.guide.day-note.title': '日にメモを追加する',
  'help.guide.day-note.goal': 'メモ、チケット番号、代わりの予定などをその日に残しておきます。',
  'help.guide.day-note.step.1': '日のヘッダーの＋（「この日に追加」）をクリックし、「メモを追加」を選びます。',
  'help.guide.day-note.step.2':
    'ダイアログ上部の「メモ」と書かれた欄に、メモの名前を入力します。日のカードにはこの名前が表示されます。そのほかの内容は「日別メモ」に書きます。上のツールバーで書式（太字、リスト、リンク、引用）を設定でき、左の「プレビュー」で行の見た目を確認できます。',
  'help.guide.day-note.step.3': '立ち寄り先と見分けやすいように「アイコン」と「色」を選び、「追加」をクリックします。',
  'help.guide.day-note.step.4':
    'メモは立ち寄り先と同じようにその日に表示されます。ドラッグするか矢印で位置を変えられます。クリックすると編集できます。「削除」はダイアログと、三点メニューまたは右クリックメニューにあり、先に「メモを削除しますか？」と確認されます。',
  'help.guide.day-note.result': 'メモはドラッグした位置で、その日とPDFに含まれます。',
  'help.guide.day-note.tip.1': 'メモ内のリンクは新しいタブで開きます。1回の改行はそのまま改行として表示されます。',
  'help.guide.day-note.tip.2': 'メモは日ごとのものです。旅行全体のメモは「コラボ」に書きます。',
  // day-route
  'help.guide.day-route.title': 'その日のルートを表示・最適化する',
  'help.guide.day-route.goal': '立ち寄り先の間のルートを表示し、移動手段を選び、順番をTREKに最適化させます。',
  'help.guide.day-route.step.1':
    '日を開き、立ち寄り先の下のルートバーで「ルート」をクリックします。立ち寄り先の間のルートが地図に描かれ、立ち寄り先の間に区間ごとの所要時間と距離が表示されます。',
  'help.guide.day-route.step.2':
    '横の3つのアイコンで、その日の移動手段を「車」「徒歩」「自転車」から選びます。区間が計算し直されます。プラグインで独自の移動手段が追加されることもあります。',
  'help.guide.day-route.step.3':
    '立ち寄り先の間の表示をクリックすると、その区間だけの移動手段を変えられます。移動手段を選ぶか、対応している場合は「公共交通機関」で乗り継ぎを検索するか、「1日のデフォルトを使用」でその日の移動手段に戻します。',
  'help.guide.day-route.step.4':
    '「最適化」（円形の矢印）で、立ち寄り先が3つ以上ある場合に最短ルートの順に並べ替えます。ロックした立ち寄り先や時刻を固定した立ち寄り先は位置が変わりません。その日に宿泊先がある場合、ルートは宿泊先から始まります。',
  'help.guide.day-route.step.5':
    '「Googleマップで開く」か「CoMapsで開く」で、その日全体をルートとしてアプリで開き、移動中のナビに使えます。CoMapsでは、その日の移動手段も引き継がれます。',
  'help.guide.day-route.result':
    'その日が時刻付きのルートになります。順番を変えると、「合計費用」と各区間も更新されます。',
  'help.guide.day-route.tip.1':
    'ルートはデフォルトで OSRM を使って計算されます。管理者は「ユーザーのデフォルト」で、別のルーティングエンジンを使うように設定できます。',
  'help.guide.day-route.tip.2':
    'ルートを計算できなかった区間には時間が表示されません。両方の立ち寄り先に座標があるか確認してください。',
  'help.guide.day-route.tip.3': '「元に戻す」矢印で最適化を取り消せます。',
  // manage-days
  'help.guide.manage-days.title': '日を追加、並べ替え、名前変更する',
  'help.guide.manage-days.goal': '日に入っている場所だけでなく、日そのものを変更します。',
  'help.guide.manage-days.step.1':
    '日は旅行の日付から作られます。ダッシュボードで旅行の編集フォームを開いて日付を変えると、最初か最後に日が追加・削除されます。内容のある日が削除される前に、削除される日とその内容が一覧で表示されます。',
  'help.guide.manage-days.step.2':
    'ヘッダーの「日付を並べ替え」で一覧が開きます。グリップで日をドラッグするか、「上へ移動」「下へ移動」を使うと、場所、メモ、予約ごと移動します。一覧の下の「次の日付で追加」は、日付のある最後の日の次に日を追加し、旅行を1日延ばします。「日付なし」は、日付のない日を最後に追加します。日付のない旅行には「日付を追加」だけがあります。',
  'help.guide.manage-days.step.3':
    '行の右端のゴミ箱「日を削除」を押すと、先に確認されます。その日と一緒に削除されるもの（場所、メモ、予約、その日にチェックインまたはチェックアウトする宿泊）と、日付が1日繰り上がる日が一覧されます。「日を削除」で削除し、「キャンセル」で残します。最後の1日は削除できません。',
  'help.guide.manage-days.step.4':
    '日の名前を変えるには、日を開き、地図の上の詳細パネルでタイトルの横の鉛筆アイコンをクリックします。カードとPDFで、「1日目」の代わりにその名前が表示されます。',
  'help.guide.manage-days.step.5':
    'ヘッダーの「すべての日を展開」と「すべての日を折りたたむ」で、すべてのカードをまとめて開閉します。カードを1枚だけ折りたたむには、山形の矢印をクリックします。',
  'help.guide.manage-days.result':
    '日付は位置に紐づいたままです。日を上に移動するとその日は前の日付になり、立ち寄り先、メモ、予約も一緒に移動します。',
  'help.guide.manage-days.tip.1': '日の移動は元に戻す矢印で取り消せますが、日の削除は取り消せません。',
  'help.guide.manage-days.tip.2':
    '計画画面の下部の「合計費用」は旅行全体の合計です。内訳は「費用」タブで確認できます。',
  // bookings-in-plan
  'help.guide.bookings-in-plan.title': '予定に表示される予約と移動の見方',
  'help.guide.bookings-in-plan.goal': '予約を作成したあとにどこに表示されるか、どの画面で作成するかを確認します。',
  'help.guide.bookings-in-plan.step.1':
    '移動（飛行機、電車、フェリー、バス、車）は、タイプごとに色分けされた行で、時刻と、出発日なら「出発」、到着日なら「到着」が表示されます。横の地球儀のアイコンでタイムゾーンがわかります。経由地のあるフライトは区間ごとに1行になります。公共交通機関の乗り継ぎは、山形の矢印をクリックすると路線が表示されます。行をクリックすると予約が開き、そこの「編集」で変更できます。',
  'help.guide.bookings-in-plan.step.2':
    '立ち寄り先にリンクされた予約（レストラン、ツアーなど）は、その立ち寄り先に時刻付きの「予約」バッジとして表示されます。バッジは確定済みなら緑、保留中なら琥珀色です。日だけが決まっていて立ち寄り先のない予約は、その日の中に独立した行として表示されます。',
  'help.guide.bookings-in-plan.step.3':
    'ホテルでの宿泊は宿泊先として扱われます。日のヘッダーのピルはチェックイン日に緑、チェックアウト日に赤になり、チケットのアイコンで予約が開きます。その日の詳細パネルでは「宿泊」に表示され、該当する日のルートはそこから始まります。',
  'help.guide.bookings-in-plan.step.4':
    '予約の行にあるルートボタンで、そのルートが地図に描かれます。ヘッダーの「すべての予約ルートを表示」で、すべてのルートが描かれます。',
  'help.guide.bookings-in-plan.step.5':
    '作成する方法：カーソルを合わせた立ち寄り先の「予約を追加」、日の＋メニューの「移動手段を追加」と「公共交通機関」、インポートやファイルも扱える一覧の「予約」タブと「移動」タブです。',
  'help.guide.bookings-in-plan.result':
    '予約は計画の中にそれぞれ1回ずつ表示されます。タブでは同じ予約が一覧で表示されます。',
  'help.guide.bookings-in-plan.tip.1':
    '確定と保留は予約に設定するステータスです。計画では立ち寄り先に表示され、「予約」タブでは両方が数えられます。',
  'help.guide.bookings-in-plan.tip.2':
    '時刻のある予約を同じ日の別の位置にドロップすると、時刻の位置に戻ります。別の日のカードにドラッグすると、その日に移ります。時刻を変えるには予約を編集します。',
  // export-plan
  'help.guide.export-plan.title': '計画をエクスポートする',
  'help.guide.export-plan.goal': '計画を書類、カレンダー、GPS端末用にエクスポートします。',
  'help.guide.export-plan.step.1': '日の上のヘッダーの左にある「エクスポート」をクリックします。',
  'help.guide.export-plan.step.2':
    '「書類」：PDFでは、最初にルートの概要地図があり、立ち寄り先、メモ、予約を含むすべての日の印刷用の画面が開きます。「自分の計画をPDFで」では、自分が参加するものだけになります。印刷用の画面で「日ごとに改ページ」をオンにすると各日が新しいページから始まり、「交通機関のメモ」で移動のメモが追加されます。「PDFとして保存」でダウンロードします。',
  'help.guide.export-plan.step.3':
    '「カレンダー」：「.ics をダウンロード」で予約をカレンダーファイルとして保存できます。「カレンダーを購読」では、カレンダーアプリが自動で更新するリンクを取得できます。',
  'help.guide.export-plan.step.4':
    '「地図と GPS」（GPX）：オフライン地図やGPS端末用に書き出します。「旅行全体」では場所、日のルート、トラック、「場所のみ」ではピンだけ、「日程をルートとして」では1日1つのルートを書き出します。',
  'help.guide.export-plan.result': 'ファイルがダウンロードされます。旅行の内容は何も変わりません。',
  'help.guide.export-plan.tip.1':
    '1日分を地図アプリで開くには、その日のルートバーにある「Googleマップで開く」または「CoMapsで開く」を使います。',
  'help.guide.export-plan.tip.2':
    '「カレンダーを購読」を使うには、設定でカレンダーフィードをオンにし、旅行を共有する権限が必要です。手順は「ダッシュボード」のガイドにあります。',
  'help.guide.export-plan.tip.3':
    'エクスポートに必要なのは閲覧権限だけです。旅行のメンバーなら誰でも、PDF、.ics、GPXをエクスポートできます。',

  // ── Screen: trip-place ────────────────────────────────────────────────────────────────
  'help.ctx.trip-place.title': '場所の詳細',
  'help.ctx.trip-place.summary':
    '場所を選ぶと地図の上に開くカードです。旅行にあるその場所の情報すべて、みんなが付けた星の評価、画像とファイルが表示されます。開いている日に追加する、地図アプリで開く、リストに保存する、といったボタンもあります。',
  'help.ctx.trip-place.bullet.1':
    '場所の列の行、日の中の立ち寄り先、地図上のマーカーのいずれかをクリックすると、地図の上にカードが開きます。日から開いた場合は、どの立ち寄り先かがわかるので、その立ち寄り先の参加者と予約も表示されます。ツアー（「ツアー」タブのハイキング、ライド、街歩き）は、このカードではなく専用のツアーカードで開きます。',
  'help.ctx.trip-place.bullet.2':
    'ヘッダーには、丸い画像、名前、1行の住所と、わかっている情報のラベル（営業中か終了か、カテゴリ、時刻、価格、電話番号、メール、座標）が表示されます。画像をクリックすると、自分の画像や場所のファイルにある写真を使えます。名前をダブルクリックすると名前を変えられます。右の×でカードを閉じます。画像の変更、名前の変更、「編集」「削除」は、場所を変更する権限のあるメンバーだけが使えます。',
  'help.ctx.trip-place.bullet.3':
    'その下に、旅行者それぞれが付けた星、説明、メモ、立ち寄り先にあれば「この日のメモ」が表示されます。',
  'help.ctx.trip-place.bullet.4':
    '続いて、該当する場合は「営業時間」「トラックの色」「統計を記録」「ファイル」があります。「ファイル」の見出しの「アップロード」でパソコンからファイルを追加できます。一覧には、この立ち寄り先にピン留めしたファイルと、ホテルの確認書など、その予約のファイルも表示されます。プラグインがその下に独自の行を追加することもあります。',
  'help.ctx.trip-place.bullet.5':
    '下部の行：日を開いているときは「日に追加」か「この日から削除」、続いて「ナビゲーション」（「設定」で地図アプリを選んでいればそのアプリ名）、「Webサイトを開く」「コレクションに保存」があります。右側の赤いゴミ箱アイコンで場所を削除し、「編集」でフォームを開きます。',
  'help.ctx.trip-place.bullet.6':
    '検索から選んだ場所には、TREKのインデックスやOpenStreetMapの情報が表示されます。上部のピルに「営業中」または「終了」（場所の現地時刻で判定され、画像の周りに緑または赤の輪が付きます）、電話番号もピルで表示されます。下のほうの「営業時間」には今日の時間が表示され、クリックすると1週間分が開きます。ウェブサイトは「Webサイトを開く」から開けます。Googleの評価は、Googleのキーを設定したTREKで、Googleで見つけた場所にだけ表示されます。場所のフォームに自分で入力した営業時間、電話番号、メールは、取得した情報より優先され、輪の色もそれで決まります。',
  // read-place
  'help.guide.read-place.title': '場所のカードでわかること',
  'help.guide.read-place.goal': '1つの場所について旅行にある情報を、1枚のカードですべて確認します。',
  'help.guide.read-place.step.1':
    '日の列で、確認したい立ち寄り先をクリックします。地図の上にカードが開き、その立ち寄り先はその日の中で強調表示されたままになります。',
  'help.guide.read-place.step.2':
    '上部には丸い画像、名前、住所が1行に並び、ツールチップで住所全体を確認できます。その下のピルには、場所の現地時刻で今「営業中」か「終了」かが表示され、それに合わせて画像の周りに緑か赤の輪が付きます。ピルにはほかに、カテゴリ、時刻、電話番号、メール（クリックすると電話アプリやメールアプリが開きます）、画面が広い場合は正確な座標も表示されます。右の×でカードを閉じます。',
  'help.guide.read-place.step.3':
    'ヘッダーのすぐ下の最初のセクションが「評価」です。旅行者それぞれが付けた星が、平均と投票数とともに表示されます。まだ誰も投票していないときは「未評価」と表示されます。',
  'help.guide.read-place.step.4':
    'その下に説明、さらにその下にメモが表示されます。どちらも場所のフォームに入力したテキストで、書式が反映されます。リスト、リンク、太字が使えます。',
  'help.guide.read-place.step.5':
    '「参加者」には、この立ち寄り先に行く人が表示されます。誰かを外すまでは全員が含まれます。',
  'help.guide.read-place.step.6':
    'さらに下の「営業時間」：行には表示中の日の営業時間が表示されます。クリックすると、その日を太字にして1週間分が表示されます。隣には「ファイル」があります。',
  'help.guide.read-place.result':
    'カードは、×で閉じるか別の場所を選ぶまで開いたままです。1週間分の営業時間は開いたままで、その場所の立ち寄り先は日の列で強調表示されたままです。',
  'help.guide.read-place.tip.1':
    '場所の列から選んだ場合、カードに表示されるのは場所であって立ち寄り先ではありません。そのため参加者は表示されず、予約もホテルの宿泊など場所自体に属するものだけが表示されます。すべてを表示するには、日の中の立ち寄り先を選んでください。',
  'help.guide.read-place.tip.2':
    '場所を変更できる権限があれば、名前をダブルクリックすると、フォームを開かずに名前を変えられます。Enterキーで保存し、Escapeキーで取り消します。',
  'help.guide.read-place.tip.3':
    '手で入力した場所には、フォームに入力した情報しかありません。「編集」をクリックして「電話」「メール」、営業時間を自分で入力するか、「場所を検索…」の候補から場所を選んで「更新」をクリックすると、情報が取得されます。Googleの評価にはGoogleのキーが必要です。',
  // rate-place
  'help.guide.rate-place.title': '場所を評価する',
  'help.guide.rate-place.goal': '場所に自分で星を付け、ほかのメンバーの評価も確認します。',
  'help.guide.rate-place.step.1':
    '場所を開きます。星はヘッダーのすぐ下にあり、これまでの投票の平均と、かっこ内に投票数が表示されます。',
  'help.guide.rate-place.step.2':
    '付けたい星をクリックします。カーソルを動かすと星が塗られるので、付ける評価を確認できます。',
  'help.guide.rate-place.step.3':
    'あなたの票はすぐに平均に反映され、横に並ぶ顔で誰が投票したかがわかります。行にカーソルを合わせると、全員の評価が表示されます。',
  'help.guide.rate-place.step.4':
    '同じ平均が場所の列のその行にも表示されるので、一覧の中から評価の高い場所を簡単に見つけられます。',
  'help.guide.rate-place.result':
    '付けた星は、旅行のメンバー全員に表示されます。一覧の上のフィルター行の星で、最低評価以上の場所だけを表示できるようになります。',
  'help.guide.rate-place.tip.1': '一部のメンバーしか場所を変更できない旅行でも、メンバー全員が評価できます。',
  'help.guide.rate-place.tip.2':
    '自分が付けた星をクリックすると、評価を取り消せます。誰も評価していない場所には、また「未評価」と表示されます。',
  'help.guide.rate-place.tip.3':
    '星の横には、最大6人まで投票した人の顔が表示されます。ツールチップには全員が表示され、あなたには印が付きます。',
  // place-image
  'help.guide.place-image.title': '場所に自分の写真を設定する',
  'help.guide.place-image.goal': '自動で表示されるサムネイルを、自分の写真に差し替えます。',
  'help.guide.place-image.step.1': '場所の列から場所を開きます。',
  'help.guide.place-image.step.2':
    'ヘッダーの丸い画像にカーソルを合わせると、カメラが表示され、ツールチップに「画像をアップロード」と表示されます。クリックしてファイルを選びます。場所のファイルにすでに写真がある場合は、先に「デバイスからアップロード」か、「添付ファイルから」の写真のどれかを選びます。',
  'help.guide.place-image.step.3': 'カードの上部に自分の画像が表示され、角に小さな赤い×が付きます。',
  'help.guide.place-image.step.4': '同じ画像が、場所の列の行と地図のマーカーにも表示されます。',
  'help.guide.place-image.result':
    'カード、場所の列、日の立ち寄り先、地図のマーカー、共有した旅行など、どこでもその画像が場所の画像として使われます。',
  'help.guide.place-image.tip.1':
    'JPG、PNG、GIF、WebP に対応しています。iPhone の HEIC はアップロード時に変換されます。',
  'help.guide.place-image.tip.2':
    '角の X で自分の写真を外すと、自動の写真が再び表示されます。場所そのものは変わりません。',
  'help.guide.place-image.tip.3':
    '画像を設定していない場合、TREKは場所の座標から画像を探します。見つからなければ、カテゴリのアイコンが表示されます。画像を設定できるのは、場所を変更する権限のあるメンバーだけです。',
  // place-day-assign
  'help.guide.place-day-assign.title': '開いている日に場所を追加する、または外す',
  'help.guide.place-day-assign.goal': '行をプランナー上でドラッグする代わりに、カードのボタンを使います。',
  'help.guide.place-day-assign.step.1':
    '日の列で日のヘッダーをクリックします。その日が開いている日になり、カードの操作はその日に対して行われます。',
  'help.guide.place-day-assign.step.2':
    '場所の列で、その日に入っていない場所をクリックします。カードが開き、下部の行に「日に追加」が表示されます。',
  'help.guide.place-day-assign.step.3':
    '「日に追加」をクリックします。立ち寄り先がその日の最後に追加され、ボタンが「この日から削除」に変わります。',
  'help.guide.place-day-assign.step.4':
    '立ち寄り先がその日のリストの最後に追加されました。上にドラッグして、正しい位置に移動します。',
  'help.guide.place-day-assign.step.5':
    '「この日から削除」で立ち寄り先をその日から外すと、カードに再び「日に追加」が表示されます。',
  'help.guide.place-day-assign.result':
    '立ち寄り先がその日に追加されるか、その日から外れます。場所そのものは変わりません。',
  'help.guide.place-day-assign.tip.1':
    'このボタンは、日を開いているときだけ表示されます。日を開いていなければ、場所を追加する先の日がありません。',
  'help.guide.place-day-assign.tip.2':
    '立ち寄り先を日から外しても、場所は旅行と場所の列に残ります。すべての場所から消すには「削除」を使います。',
  'help.guide.place-day-assign.tip.3':
    '宿泊の予約によって日に追加された立ち寄り先には、どちらのボタンも表示されません。その宿泊は、日の宿泊の欄で追加・削除します。',
  // place-participants
  'help.guide.place-participants.title': '立ち寄り先に行くメンバーを決める',
  'help.guide.place-participants.goal': '旅行のメンバーはそのままで、1つの立ち寄り先に行く人を選びます。',
  'help.guide.place-participants.step.1':
    '日の中の立ち寄り先をクリックします。カードが開き、「参加者」に旅行のメンバー全員が表示されます。',
  'help.guide.place-participants.step.2':
    '旅行者のチップをクリックすると、その人をこの立ち寄り先から外せます。チップにカーソルを合わせると、名前に取り消し線が付きます。',
  'help.guide.place-participants.step.3':
    '誰かが外れると、すぐに破線の + が表示されます。クリックすると、立ち寄り先に参加していない人がわかります。',
  'help.guide.place-participants.step.4':
    '名前をクリックすると、その人がまた追加されます。全員が追加されると、立ち寄り先はまたグループ全員のものになります。',
  'help.guide.place-participants.result':
    '立ち寄り先に、選んだメンバーだけが表示されます。ほかのメンバーは、その時間は自由に過ごせます。',
  'help.guide.place-participants.tip.1':
    '「参加者」は立ち寄り先を選んでいるときだけ表示されるので、場所の列ではなく、日の中の場所を選んでください。また、メンバーが2人以上いる旅行でだけ表示されます。',
  'help.guide.place-participants.tip.2':
    '誰も選んでいなければ、全員が行くことになります。そのため、立ち寄り先から最後の1人を外すことはできません。',
  'help.guide.place-participants.tip.3':
    '自分のアカウントを持たないゲストも、ほかのメンバーと同じように参加者にできます。',
  // place-booking
  'help.guide.place-booking.title': '立ち寄り先の予約',
  'help.guide.place-booking.goal': '立ち寄り先の予約を確認して開き、新しい予約をリンクします。',
  'help.guide.place-booking.step.1':
    '予約が紐づく立ち寄り先を開きます。カードの「予約」に、予約名と「確定」か「保留」が入った小さなカードで表示されます。',
  'help.guide.place-booking.step.2':
    '予約のカードに、「日付」「時刻」「予約コード」、予約のほかの情報（便名、ホーム、チェックインなど）のラベル、予約のメモが表示されます。',
  'help.guide.place-booking.step.3': '予約のカードをクリックします。地図の上に予約が開きます。',
  'help.guide.place-booking.step.4':
    '予約の下部の「編集」で、予約のフォームが開きます。そのフォームの「日への割り当てにリンク」で予約を立ち寄り先にリンクします。ここにはすでにこの立ち寄り先が表示されています。フォームを閉じます。',
  'help.guide.place-booking.step.5':
    '立ち寄り先の新しい予約は、日程の列から作ります。立ち寄り先にカーソルを合わせ、末尾のチケットアイコン「予約を追加」をクリックします。フォームが「新しい予約」として開き、すでにその立ち寄り先にリンクされています。',
  'help.guide.place-booking.result':
    '予約が立ち寄り先にリンクされます。カードと日に表示され、予約のファイルはここの「ファイル」にも一覧表示されます。',
  'help.guide.place-booking.tip.1':
    '予約はピン留めした立ち寄り先に表示されます。ホテルの予約は、どこから開いてもホテルにも表示されます。立ち寄り先のない予約は「予約」タブに表示されます。',
  'help.guide.place-booking.tip.2':
    '1つの立ち寄り先に複数の予約を付けられます。たとえば、同じ場所から始まるランチとツアーなどです。',
  'help.guide.place-booking.tip.3':
    '電車、飛行機、フェリーの場合、「編集」では「移動」タブと同じ移動のフォームが開きます。',
  // place-files
  'help.guide.place-files.title': '場所のチケットを場所にまとめる',
  'help.guide.place-files.goal': 'チケット、バウチャー、地図を、関係する場所に添付します。',
  'help.guide.place-files.step.1':
    '場所を開きます。「ファイル」は詳細の下にあり、営業時間がある場合はその横に表示されます。ファイルがまだない場合も「ファイル」と表示されます。',
  'help.guide.place-files.step.2': '「ファイル」見出しの右にある「アップロード」をクリックして、ファイルを選びます。',
  'help.guide.place-files.step.3': 'ボタンに場所のファイル数が表示され、一覧が自動で開きます。',
  'help.guide.place-files.step.4': '各行にファイル名とサイズが表示されます。クリックするとファイルが開きます。',
  'help.guide.place-files.result':
    'ファイルが場所に添付され、カードの件数に加わります。旅行の「ファイル」タブにも表示されます。',
  'help.guide.place-files.tip.1':
    '「ファイル」には、この立ち寄り先にピン留めしたものや、その予約に添付したものも表示されます。たとえば、ホテルの予約確認書がホテルに表示されます。',
  'help.guide.place-files.tip.2':
    '「アップロード」では複数のファイルを一度に追加でき、その中の写真を場所の画像にできます。',
  'help.guide.place-files.tip.3':
    'ファイルをアップロードする権限がない場合、「アップロード」ボタンは表示されません。場所に添付済みのファイルは引き続き表示されます。',
  // place-navigation
  'help.guide.place-navigation.title': '場所を地図アプリやウェブサイトで開く',
  'help.guide.place-navigation.goal': 'いつも使っているナビアプリで場所を開き、そこへ向かいます。',
  'help.guide.place-navigation.step.1': '場所を開き、下部の行の「ナビゲーション」をクリックします。',
  'help.guide.place-navigation.step.2':
    'この場所で使える地図アプリが一覧されます：Googleマップ、Waze、Appleマップ、OpenStreetMap、CoMaps。Androidでは「他の地図アプリ」もあります。',
  'help.guide.place-navigation.step.3':
    '使っているアプリをクリックします。TREKはできるだけ座標だけでなく場所そのものをアプリに渡すので、正しい入口に着けます。',
  'help.guide.place-navigation.step.4':
    '横の「Webサイトを開く」で、営業時間やチケットの情報がある場所の公式サイトが新しいタブで開きます。',
  'help.guide.place-navigation.result':
    '地図アプリでその場所が開き、ウェブサイトは新しいタブで開きます。旅行の内容は変わりません。TREKをアプリとしてインストールしている場合は、新しいタブではなく地図アプリが開きます。',
  'help.guide.place-navigation.tip.1':
    'Waze はすぐにナビを開始します。ほかのアプリでは場所が開くので、もう一度タップしてナビを開始します。',
  'help.guide.place-navigation.tip.2':
    '表示されるアプリは、場所と端末によって変わります。AndroidではAppleマップは表示されず、高德地图は中国国内の場所でだけ表示されます。Waze、Appleマップ、CoMapsには場所の座標が必要です。「他の地図アプリ」では、Androidスマートフォンにある任意の地図アプリで場所を開けます。',
  'help.guide.place-navigation.tip.3':
    '「設定」の「場所を開くアプリ」で地図アプリを選んでおくと、ボタンにそのアプリ名が表示され、すぐに開くようになります。場所に使えるアプリが1つだけの場合も同じです。',
  // place-to-collection
  'help.guide.place-to-collection.title': '場所を自分のリストに保存する',
  'help.guide.place-to-collection.goal': 'この旅行で見つけた場所を、次の旅行のために保存します。',
  'help.guide.place-to-collection.step.1': '場所を開き、カード下部の行にある「コレクションに保存」をクリックします。',
  'help.guide.place-to-collection.step.2':
    '「リストに保存」に、自分が所有または共有しているリストがすべて表示されます。右側のブックマークが塗りつぶされているリストには、すでにこの場所が入っています。',
  'help.guide.place-to-collection.step.3': 'リストをクリックします。場所がすぐにそのリストに追加されます。',
  'help.guide.place-to-collection.step.4': '×でダイアログを閉じると、カードのボタンが「保存しました」に変わります。',
  'help.guide.place-to-collection.result': '場所が画像、メモ、住所と一緒にリストに保存され、次の旅行で使えます。',
  'help.guide.place-to-collection.tip.1':
    'このボタンは「コレクション」アドオンがオンの場合だけ表示されます。アドオンは管理者が「アドオン」でオンにします。',
  'help.guide.place-to-collection.tip.2':
    '1つの場所を複数のリストに入れ、リストごとに別のステータス（あるリストでは「アイデア」、別のリストでは「訪問済み」など）にできます。',
  'help.guide.place-to-collection.tip.3':
    '選択画面の上部、場所名の下にある「訪問済みにする」で、リスト内のその場所を訪問済みにします。場所が自分の複数のリストに入っている場合、ボタンは「すべてで訪問済み」になり、すべてのリストでまとめて訪問済みにします。「表示」でコレクションの自分のリストが開きます。',
  // place-track
  'help.guide.place-track.title': 'トラックを確認し、色を設定する',
  'help.guide.place-track.goal': 'インポートしたルートの距離を確認し、マップ上でどの線がそのルートかを見分けます。',
  'help.guide.place-track.step.1':
    '場所の列にあるトラックの行には、マップ上のトラックと同じ色の短い線が表示されています。それをクリックします。',
  'help.guide.place-track.step.2': '「統計を記録」に、設定した単位でルートの距離が表示されます。',
  'help.guide.place-track.step.3':
    'その上の「トラックの色」に、使用中の色が表示されています。行をクリックすると色の見本が開きます。',
  'help.guide.place-track.step.4': '色を選びます。地図の線と行の線の色が変わります。',
  'help.guide.place-track.step.5':
    '左端の破線のマス「自動の色」で、トラックを既定の色に戻します。右端のスポイトで、システムのカラーピッカーが開き、好きな色を選べます。',
  'help.guide.place-track.result':
    'トラックが選んだ色で表示されます。カード、場所の列のその行、マップのどれでも同じ色です。',
  'help.guide.place-track.tip.1':
    'この2つの欄があるのは、経路を持つ場所だけです。ツアー機能ができる前にGPX、KML、KMZファイルからインポートした場所や、ツアーがオフのTREKでインポートした場所が該当します。ツアーがオンの場合、新しいGPXファイルはツアーになり、専用のツアーカードで開きます。',
  'help.guide.place-track.tip.2':
    '標高付きで記録されたトラックでは、最高地点と最低地点、上りと下りの高低差（m）、ルートの高低図も表示されます。',
  'help.guide.place-track.tip.3':
    'インポートでは、追加するトラックごとに別の色が付くので、2つのルートが同じ色になることはありません。',
  // read-place
  'help.guide.read-place.step.7':
    '下部の行には、ここからできる操作が並びます。開いている日に場所を入れる・外す、地図アプリやウェブサイトで開く、リストに保存する、右側で削除（赤いゴミ箱）や編集をする、です。',

  // ── Screen: trip-files ────────────────────────────────────────────────────────────────
  'help.ctx.trip-files.title': 'ファイル',
  'help.ctx.trip-files.summary':
    '旅行のすべての書類を1つのリストにまとめます。チケット、予約確認書、パス、画像などです。それぞれにメモと、関係する場所や予約へのリンクを付けられます。削除したファイルはゴミ箱から復元できます。',
  'help.ctx.trip-files.bullet.1':
    'バーの下の破線のボックス「ここにファイルをドロップ」に、ファイルをドロップできます。クリックするとファイルの選択画面が開きます。ボックスには、このTREKで使えるファイル形式と1ファイルの上限（管理者が変更していなければ最大50 MB）が表示されます。',
  'help.ctx.trip-files.bullet.2':
    '上部のバーに「ファイル」と、フィルターのタブ「すべて」「PDF」「画像」「ドキュメント」が件数付きで並びます。ファイルにスターを付けると「すべて」の後ろにスターのタブが、ノートにファイルを添付すると最後に「Collabメモ」タブが表示されます。',
  'help.ctx.trip-files.bullet.3':
    '各行には、サムネイルかファイルの形式、アップロードした人、名前、その下のメモ、サイズと日付、リンクごとのバッジが表示されます。バッジは場所、予約、移動の名前（カーソルを合わせると「日別計画」「予約」「移動」と表示されます）と、「Collabメモより」です。',
  'help.ctx.trip-files.bullet.4':
    '行の右端には最大5つのアイコンがあり、カーソルを合わせると名前が表示されます：「スター」「割り当て」（鉛筆）、開く、「ダウンロード」「削除」。「削除」は確認なしで実行され、ファイルはゴミ箱に移り、そこから戻せます。オフラインでも、メモ、リンク、スター、ゴミ箱は使え、TREKがオンラインに戻ると送信されます。接続が必要なのは、アップロードと、別のリンクを外す操作だけです。',
  'help.ctx.trip-files.bullet.5':
    '画像や動画は全画面で開き、矢印キーとサムネイルの列で切り替えられます。それ以外の書類はダイアログで開き、上部に名前、その下に「新しいタブで開く」と「ダウンロード」が表示されます。ウォレットのパスはすぐにダウンロードされます。',
  'help.ctx.trip-files.bullet.6':
    'バーの右端にあるゴミ箱アイコン（「ゴミ箱」）で、リストが削除済みのファイルに切り替わります。ここでファイルを1つずつ復元したり完全に削除したりでき、バーの「ゴミ箱を空にする」ですべて削除できます。ゴミ箱アイコンの左には「ドキュメント同期」があります。表示されるのは、旅行がドキュメントの保管先に接続されているとき、または保管先が有効になった時点で旅行のオーナーと管理者に対してです。',
  // files-upload
  'help.guide.files-upload.title': '旅行に書類を追加する',
  'help.guide.files-upload.goal':
    'チケット、予約確認書、写真をダウンロードフォルダーから旅行にアップロードし、旅行のメンバー全員が開けるようにします。',
  'help.guide.files-upload.step.1':
    '旅行を開き、タブバーの「ファイル」をクリックします。旅行の書類が一覧表示され、その上にアップロード用のボックスがあります。',
  'help.guide.files-upload.step.2':
    '「ここにファイルをドロップ」をクリックし、ファイルを1つ以上選びます。ファイルは1つずつアップロードされ、その間ボックスに「アップロード中...」と表示されます。ボックス内の「またはクリックして参照」の下に、このTREKで使えるファイル形式と1ファイルの最大サイズが表示されます。',
  'help.guide.files-upload.step.3':
    '最後のファイルのアップロードが終わると、そのファイルの「ファイルを割り当て」が自動で開きます（旅行に場所か予約がある場合）。ダイアログ上部にファイル名が表示されます。「メモ」の「メモを追加...」でファイルにメモを付け、その下の一覧でファイルを場所や予約にリンクします。右上の×で閉じます。閉じても入力内容は失われません。',
  'help.guide.files-upload.step.4':
    '新しいファイルは一覧の上部に表示されます。それより上にあるのはスター付きのファイルだけです。各行に、アップロードした人、名前、サイズ、日付が表示されます。画像にはサムネイルが、それ以外のファイルには形式が表示されます。',
  'help.guide.files-upload.result':
    '書類が旅行に保存され、旅行を見られる人は誰でも開いたりダウンロードしたりできます。',
  'help.guide.files-upload.tip.1':
    'デスクトップからファイルを直接ボックスにドラッグすることもできます。ファイルがボックスの上にある間、ボックスが強調表示されます。',
  'help.guide.files-upload.tip.2':
    'Ctrl+V を押すと、クリップボードの画像をリストに追加できます。予約のスクリーンショットをいったん保存する必要はありません。',
  'help.guide.files-upload.tip.3':
    'アップロードにはファイルをアップロードする権限が必要です。権限がないとボックス自体が表示されません。一覧にない形式のファイルはメッセージとともに拒否され、何もアップロードされません。上限（管理者が変更していなければ50 MB）を超えるファイルは送信前に拒否され、メッセージに上限が表示されます。アップロードには接続も必要で、オフラインのときはTREKがその旨を表示し、何もアップロードしません。',
  // files-link
  'help.guide.files-link.title': '書類を場所や予約にリンクする',
  'help.guide.files-link.goal': 'このリストからだけでなく、関係する日からもチケットをすぐに見つけられるようにします。',
  'help.guide.files-link.step.1':
    '行の右端の鉛筆アイコン（「割り当て」）をクリックします。「ファイルを割り当て」が開き、ダイアログ上部にファイル名が表示されます。',
  'help.guide.files-link.step.2':
    '「メモ」の「メモを追加...」に1行のメモを入力すると、一覧のファイル名の下に表示されます。Enterキーを押すか入力欄から離れると保存されます。',
  'help.guide.files-link.step.3':
    '左の「場所」には、旅行の場所が日ごとに日付付きでまとめて表示され、どの日にも入っていない場所は最後の「未割り当て」に表示されます。クリックするとチェックが付きます。',
  'help.guide.files-link.step.4':
    '右側の「予約」と「交通」には、旅行の予約が並んでいます。書類に対応する予約をクリックすると、そこにもチェックが付きます。',
  'help.guide.files-link.step.5':
    '右上の × で閉じます。ここには保存ボタンはありません。クリックするたびにすぐ保存されています。',
  'help.guide.files-link.result':
    '行にメモと、リンクごとのバッジが表示されます。場所の名前のバッジと、フライトの名前のバッジです。バッジにカーソルを合わせると「日別計画」または「交通」と表示されます。書類は、その場所とフライトにも添付されます。',
  'help.guide.files-link.tip.1':
    '1つのファイルに複数のリンクを付けられます。たとえば同じ予約確認書を、ホテルの予約とホテルの場所の両方にリンクできます。',
  'help.guide.files-link.tip.2':
    'チェックの入った項目をもう一度クリックするとリンクが外れますが、ファイル自体は残ります。オフラインのときもメモと新しいチェックは保存され、TREKがオンラインに戻ると送信されます。接続が必要なのは、別のリンクを外すときだけです。',
  'help.guide.files-link.tip.3':
    '逆の場合も同じです。場所や予約に添付した書類もこの一覧に表示され、行に同じバッジが付きます。',
  // files-star
  'help.guide.files-star.title': '大事な書類を上に表示する',
  'help.guide.files-star.goal': '本当に必要な書類に印を付け、長い一覧の中からすぐに見つけられるようにします。',
  'help.guide.files-star.step.1':
    '行の末尾にある星（「スター」）をクリックします。星が金色になり、ファイル名の前にも星が表示されます。ボタンにカーソルを合わせると「スター解除」と表示されるようになります。',
  'help.guide.files-star.step.2':
    'リストが並べ替えられます。スター付きのファイルがほかのファイルより上に表示され、それぞれのグループ内では新しい順に並びます。',
  'help.guide.files-star.step.3':
    'バーのフィルターのタブに、「すべて」のすぐ後ろに星が表示され、横にスター付きファイルの数が表示されます。クリックすると、スター付きのファイルだけが表示されます。',
  'help.guide.files-star.result':
    'スター付きのファイルがリストの一番上に表示され、スター付きのファイルだけを表示するタブも追加されます。',
  'help.guide.files-star.tip.1':
    'スターのタブは、スター付きのファイルがある間だけ表示されます。最後のファイルのスターを外すと、タブは消えます。',
  'help.guide.files-star.tip.2':
    'スターを付けるには、「割り当て」と同じ「ファイル情報を編集」の権限が必要です。権限がないメンバーにもスターは表示されますが、「スター」をクリックしても何も変わりません。',
  // files-filter
  'help.guide.files-filter.title': '一覧から書類を探す',
  'help.guide.files-filter.goal': '探している種類の書類だけを表示します。',
  'help.guide.files-filter.step.1':
    'フィルターのタブは、上部のバーの「ファイル」の隣にあります。「すべて」「PDF」「画像」「ドキュメント」で、それぞれの横にファイル数が表示されます。',
  'help.guide.files-filter.step.2': '「PDF」をクリックすると、リストに PDF ファイルだけが表示されます。',
  'help.guide.files-filter.step.3':
    'あと2つのタブは、該当するファイルが旅行にあるときだけ表示されます。Collab タブのメモにファイルが添付されると表示される「Collabメモ」をクリックすると、リストにはそれらのファイルだけが表示されます。スターのタブも同じように、ファイルにスターを付けた時点で表示されます。',
  'help.guide.files-filter.step.4': '「すべて」で、一覧全体がまた表示されます。',
  'help.guide.files-filter.result':
    '選んだタブのファイルだけが一覧に表示され、各タブの数字でファイルの数がわかります。',
  'help.guide.files-filter.tip.1':
    'ここにはフォルダーがなく、ファイル名も変更できません。書類を見分けるには、「ファイルを割り当て」のメモ、場所や予約へのリンク、スターを使います。',
  'help.guide.files-filter.tip.2':
    'リストは常にスター付きのファイルが先頭で、その後は新しい順に並びます。今日アップロードした書類は、先月のものより上に表示されます。',
  // files-preview
  'help.guide.files-preview.title': 'TREK を離れずに書類を見る',
  'help.guide.files-preview.goal': 'チケットや画像をすぐに表示し、必要なら端末にダウンロードします。',
  'help.guide.files-preview.step.1':
    '画像の名前かサムネイルをクリックします。全画面で開き、左上にファイル名と何枚目の画像かが表示されます。動画も同じように開き、その場で再生されます。',
  'help.guide.files-preview.step.2':
    '左右の丸い矢印、キーボードの左右の矢印キー、または下部のサムネイルで、リストに表示されているすべての画像を切り替えられます。',
  'help.guide.files-preview.step.3':
    '「新しいタブで開く」と「ダウンロード」は、右上の×の横にある丸いボタンです。×をクリックするか、Escapeキーを押すか、暗い背景をクリックすると画像が閉じます。',
  'help.guide.files-preview.step.4':
    '画像以外の書類はダイアログで開きます。上部に名前、その下に「新しいタブで開く」と「ダウンロード」のピル、PDFならその下にページが表示されます。右上の×をクリックするか、Escapeキーを押すか、ダイアログの外をクリックすると閉じます。',
  'help.guide.files-preview.step.5': '行の右端の矢印（「ダウンロード」）で、ファイルを開かずに直接端末に保存します。',
  'help.guide.files-preview.result':
    '書類が画面に表示されます。同じ2つのボタンで、ブラウザーのタブで開くか、ディスクに保存できます。',
  'help.guide.files-preview.tip.1': 'タッチ画面では、矢印をクリックする代わりにスワイプして画像を切り替えます。',
  'help.guide.files-preview.tip.2':
    'ウォレット用のパスはプレビューされません。すぐにダウンロードされるので、スマートフォンのウォレットアプリで開けます。',
  'help.guide.files-preview.tip.3':
    '「新しいタブで開く」と「ダウンロード」は、どちらもあなたのセッションでファイルを読み込みます。そのため、アドレスバーからコピーしたリンクは、ほかの人には使えません。',
  // files-trash
  'help.guide.files-trash.title': '書類を削除・復元する',
  'help.guide.files-trash.goal': '旅行に不要になったファイルを削除し、まだ必要なファイルは復元します。',
  'help.guide.files-trash.step.1':
    '行の右端のゴミ箱アイコン（「削除」）をクリックします。ファイルがすぐに一覧から消え、「ゴミ箱に移動しました」と表示されます。確認はありません。',
  'help.guide.files-trash.step.2':
    'バーの右端にあるゴミ箱アイコン（「ゴミ箱」）で、リストが削除済みのファイルに切り替わります。バーのタイトルが「ゴミ箱」になり、フィルターのタブとアップロード用のボックスは非表示になります。',
  'help.guide.files-trash.step.3':
    'ゴミ箱の行はグレーで表示され、2つのアイコンがあります。ファイルを元に戻す「復元」と、確認のあと完全に削除する「削除」です。',
  'help.guide.files-trash.step.4':
    '「復元」をクリックします。「ファイルを復元しました」と表示され、ファイルがゴミ箱から戻ります。メモとリンクはそのまま残ります。',
  'help.guide.files-trash.step.5':
    'バーのゴミ箱アイコンの隣にある「ゴミ箱を空にする」で、ゴミ箱にあるものをすべて完全に削除します。削除の前に、ブラウザーで一度確認が表示されます。ゴミ箱アイコンをクリックすると、ファイルの一覧に戻ります。',
  'help.guide.files-trash.result': 'ファイルが一覧の元の位置に戻ります。',
  'help.guide.files-trash.tip.1':
    '行の「削除」は確認なしで実行されます。そのためゴミ箱があり、ここで削除するまでTREKから完全には消えません。これらの操作はすべてオフラインでも使え、TREKがオンラインに戻ると送信されます。',
  'help.guide.files-trash.tip.2':
    'ファイルの削除と復元には、ファイルを削除する権限が必要です。権限がないメンバーには、行の「削除」もゴミ箱のボタンも表示されません。',
  'help.guide.files-trash.tip.3': 'ゴミ箱で完全に削除したファイルは、元に戻せません。',
  // files-sync
  'help.guide.files-sync.title': 'ドキュメントを保管先と同期する',
  'help.guide.files-sync.goal':
    '旅行を自分のドキュメント保管先に接続し、ここでアップロードしたファイルが保管先に保存され、保管先に保存したファイルがここに表示されるようにします。',
  'help.guide.files-sync.step.1':
    'バーの右端、ゴミ箱アイコンの隣にある「ドキュメント同期」をクリックします。タイトルの下に旅行名が入ったダイアログが開きます。左側の「連携先を接続」には管理者がオンにした保管先が並び、それぞれにファイルの保存方法が書かれています。Paperless-ngx と Papra はタグ、Nextcloud と Synology Drive はフォルダー、OpenCloud はスペースで保存します。右側には「まだ何も接続されていません」と表示されています。',
  'help.guide.files-sync.step.2':
    '自分の保管先をクリックします。ここでは Nextcloud です。接続用の小さなダイアログが開きます。保管先の名前が表示され、その保管先に必要なサインイン情報の入力を求められます。',
  'help.guide.files-sync.step.3':
    '「アドレス」と、保管先のサインイン情報を入力します。Paperless-ngxは「API トークン」、Papraは「API キー」と「組織 ID」、Nextcloudは「ユーザー名」と「アプリパスワード」、OpenCloudは「ユーザー名」と「アプリトークン」、Synology Driveは「ユーザー名」「パスワード」と、アカウントで必要な場合は「二段階認証コード」です。保管先にアプリパスワードやトークンがある場合は必ずそれを使い、アカウントのパスワードは使わないでください。NextcloudとSynology Driveでは、TREKが旅行のフォルダーを探す「基準フォルダー」（この例では/Reisen）も任意で設定できます。下部の「自己署名証明書を許可」は、自己署名証明書を使う自分のネットワーク内の保管先にだけ使います。',
  'help.guide.files-sync.step.4':
    '「接続をテスト」をクリックします。TREKが入力した内容で保管先に接続し、下部に「接続しました。」とアカウント名を含む「…としてサインイン中」が表示されます。認証情報が拒否されたり、アドレスに接続できなかったりした場合は、その内容が表示されます。どちらの場合も、何も保存されません。',
  'help.guide.files-sync.step.5':
    '「接続」をクリックします。接続が旅行に保存され、保管先のどこに旅行のドキュメントを置くか（タグ、フォルダー、スペース）を確認されます。同期されるのは、その中にあるものだけです。「新しく作る」では、「作成」をクリックすると、旅行のタイトルから付けた名前で新しく作成されます。「または既にあるものを使う」には、既存のものが表示されます。1つクリックします（この例ではフォルダー「Autumn in Japan」）。',
  'help.guide.files-sync.step.6':
    'ダイアログが再び開きます。左側の「この旅行」に自分の保管先が表示され、右側のカードには同期先、最後に同期した日時、「今すぐ同期」が表示されます。最初の同期は自動で始まります。「今すぐ同期」をクリックすれば、いつでも同期できます。同期が終わると、名前の隣の「まだ同期していません」のバッジが緑の点に変わり、カーソルを合わせると「同期済み」と表示されます。フローバーには TREK と保管先それぞれのドキュメント数が表示され、その間に「保管先へ」と「保管先から」のレーンがあります。右上の × でダイアログを閉じます。',
  'help.guide.files-sync.result':
    '保管先にあったドキュメントが、あなたの名前でアップロードされたものとしてリストの一番上に表示されます。また、Collabメモのドキュメントを除き、旅行のすべてのドキュメントが保管先にも保存されます。以降は TREK がバックグラウンドで保管先を確認し、リストの変更は保管先にもコピーされます。',
  'help.guide.files-sync.tip.1':
    '旅行を接続できるのは、旅行のオーナーかインスタンスの管理者だけです。認証情報で保管先のアカウント全体にアクセスできるためです。旅行を接続すると、メンバー全員に「ドキュメント同期」が表示され、開いてカードを確認し、「今すぐ同期」を押せるようになります。',
  'help.guide.files-sync.tip.2':
    '自分のネットワーク内にある保管先を使うには、TREK サーバーで ALLOW_INTERNAL_NETWORK=true の設定が必要です。アドレスには localhost ではなく、ネットワーク上のそのマシンのアドレスを指定してください。設定がないと、「接続をテスト」で「このアドレスは許可されていません。」と表示されます。',
  'help.guide.files-sync.tip.3':
    '「今すぐ同期」の横のアイコン「接続解除」を押すと、一度確認されたあと接続が終了します。ドキュメントは両方にすべて残ります。同じタグ、フォルダー、スペースを再び接続すると新しいものとして扱われ、中身がすべてもう一度インポートされます。そのため、接続を解除したあとは、元のものではなく空のものを接続してください。',

  // ── Screen: trip-day-detail ───────────────────────────────────────────────────────────
  'help.ctx.trip-day-detail.title': '日詳細',
  'help.ctx.trip-day-detail.summary':
    '日のヘッダーをクリックすると地図の上に開くパネルです。その日全体の情報として、名前と日付、滞在先の天気、その日の予約、その日の宿泊が表示されます。',
  'help.ctx.trip-day-detail.bullet.1':
    '日の列で日のヘッダーをクリックすると、地図の中央にパネルが開きます。同じヘッダーをもう一度クリックするか右の×をクリックすると、パネルが閉じ、日の選択が解除されます。場所の列や地図から場所を開くと、パネルが閉じて場所が表示されます。',
  'help.ctx.trip-day-detail.bullet.2':
    'ヘッダーにその日の名前と日付が表示されます。名前の横の鉛筆アイコンで日の名前を変えられます。二重の山形の矢印でパネルを細いバーに折りたたむと、地図がまた見えるようになります。',
  'help.ctx.trip-day-detail.bullet.3':
    '上部にその日の天気が表示されます。「…の予報」で、どの場所の予報かがわかります。その日の最初の立ち寄り先か、その朝に目覚めるホテルです。',
  'help.ctx.trip-day-detail.bullet.4':
    '「予約」には、その日の予約が種類、紐づく立ち寄り先、時刻付きで一覧されます。緑は確定、琥珀色は保留中です。公共交通機関の移動は青で、ステータスはありません。行をクリックすると予約が開きます。',
  'help.ctx.trip-day-detail.bullet.5':
    '「宿泊」には、この日にかかる宿泊がすべて表示されます。該当する日には「チェックイン」「チェックアウト」、チェックインの受付時間、チェックアウトの時刻、予約番号が表示されます。宿泊に予約がある場合は、下の「予約」ボックスに予約名と「保留」か「確定」が表示されます。クリックすると予約が開きます。',
  'help.ctx.trip-day-detail.bullet.6':
    '「宿泊先を追加」で、この日の宿泊を追加します。旅行の場所から宿泊施設を選び、対象の日を決め、時刻とコードを入力します。日のヘッダーにある＋（ツールチップ「この日に追加」）にも「宿泊先を追加」があり、フォームを開いた状態でこのパネルが表示されます。',
  // day-panel
  'help.guide.day-panel.title': '日を開いて詳細を確認する',
  'help.guide.day-panel.goal': 'マップから離れずに、天気、予約、宿泊先を含めて1日の全体を確認します。',
  'help.guide.day-panel.step.1':
    '日程の列で日のヘッダーをクリックします。その日が選択され、マップの中央に詳細が開きます。',
  'help.guide.day-panel.step.2':
    'ヘッダーにはその日の名前が表示されます。名前を付けるまでは「1日目」で、その下に日付があります。',
  'help.guide.day-panel.step.3':
    '上部にその日の天気が表示されます。「…の予報」で、どの場所の予報かがわかります。その日の最初の立ち寄り先か、前の夜に泊まったホテルです。',
  'help.guide.day-panel.step.4': 'その下の「予約」に、その日の予約が時刻付きで一覧されます。',
  'help.guide.day-panel.step.5':
    '「宿泊」に、その日にかかる宿泊が表示され、該当する日には「チェックイン」と「チェックアウト」が付きます。',
  'help.guide.day-panel.step.6':
    'ヘッダーの二重矢印をクリックすると、パネルが細いバーに折りたたまれます。その隣の X をクリックするとパネルが閉じ、日の選択も解除されます。',
  'help.guide.day-panel.result':
    'パネルをバーに折りたたむと、マップが広く使え、日は選択されたままです。パネルを閉じると日の選択が解除され、予定はそのまま残ります。',
  'help.guide.day-panel.tip.1':
    'パネルのヘッダーバーのどこをクリックしても、パネルを折りたためます。矢印ボタンはその方法の1つにすぎません。',
  'help.guide.day-panel.tip.2':
    '場所の列や地図から場所を開くと、日のパネルが閉じて場所の詳細が表示されます。もう一度日のヘッダーをクリックすると、日が表示されます。',
  // day-weather
  'help.guide.day-weather.title': 'その日の天気を確認する',
  'help.guide.day-weather.goal': 'その日に実際にいる場所の天気を確認します。',
  'help.guide.day-weather.step.1':
    '「…の予報」に、どの場所の数値かが表示されます。その日の最初の立ち寄り先か、立ち寄り先がない日は前の夜に泊まるホテルです。',
  'help.guide.day-weather.step.2': '大きな数字がその日の気温です。横に最低気温と最高気温、天気が文字で表示されます。',
  'help.guide.day-weather.step.3': 'その右に並ぶ表示：降水確率、降水量、最大風速、日の出と日の入りの時刻です。',
  'help.guide.day-weather.step.4':
    '一番下には、その日の天気が2時間ごとに表示されます。時刻、アイコン、気温、降水確率です。降水確率が50%を超える時間帯は青く表示されます。',
  'help.guide.day-weather.result':
    '日程の列にあるその日のカードにも、番号の下に天気が小さく表示されるので、旅行全体の天気をすぐに確認できます。',
  'help.guide.day-weather.tip.1':
    '気温と風速は、「設定」の「表示」にある「温度単位」に従います。「°F 華氏」を選ぶと、同じ予報が °F と mph で表示されます。',
  'help.guide.day-weather.tip.2':
    '位置のある立ち寄り先も前の夜のホテルもない日は、天気は表示されません。予報は常に場所ごとのもので、旅行全体のものではありません。',
  'help.guide.day-weather.tip.3':
    '16日より先は、予報がありません。その場合は、過去数年のその日の平均値がØ付きで表示され、その下に注意書きが表示されます。',
  // rename-day
  'help.guide.rename-day.title': '日に名前を付ける',
  'help.guide.rename-day.goal': '「5日目」の代わりに、「京都到着」や「休養日」のような名前を日に付けます。',
  'help.guide.rename-day.step.1': '日を開きます。ヘッダーに「5日目」と表示され、その下に日付があります。',
  'help.guide.rename-day.step.2': '名前の横の鉛筆アイコンをクリックします。',
  'help.guide.rename-day.step.3': '名前が入力欄に変わります。付けたい名前を入力します。',
  'help.guide.rename-day.step.4':
    'Enterキーを押すか、ほかの場所をクリックします。Escapeキーで変更を取り消します。日の列のその日のカードにも名前が表示されます。',
  'help.guide.rename-day.result':
    'パネルと日の列のカードで、「5日目」の代わりにその名前が表示されます。日付は変わりません。',
  'help.guide.rename-day.tip.1':
    '入力欄を空にして保存すると、日の名前は「5日目」に戻ります。名前がない場合は番号が表示されます。',
  'help.guide.rename-day.tip.2':
    '名前は日付ではなく日に付きます。日を並べ替えると、名前もその日のほかの内容と一緒に移動します。',
  // add-accommodation
  'help.guide.add-accommodation.title': '日に宿泊を追加する',
  'help.guide.add-accommodation.goal': 'ホテルを、宿泊する日、時刻、確認番号とともに一度だけ予定に追加します。',
  'help.guide.add-accommodation.step.1':
    '宿泊先は、まず旅行の場所になっている必要があります。ほかの場所と同じように、場所の列で作成してください。選択画面には、すでにある場所しか表示されません。',
  'help.guide.add-accommodation.step.2': '到着する日を開き、「宿泊」の下の「宿泊先を追加」をクリックします。',
  'help.guide.add-accommodation.step.3':
    '「適用日」で、宿泊する夜を設定します。「開始」がチェックイン日、「終了」がチェックアウト日で、「すべて」は旅行全体です。ダイアログ上部に期間と泊数が表示されます。',
  'help.guide.add-accommodation.step.4':
    '「チェックイン」「チェックイン期限」「チェックアウト」を入力し、予約番号を「確認」に入力します。4つとも空欄のままでもかまいません。',
  'help.guide.add-accommodation.step.5':
    '「宿泊先を選択」で宿泊施設を選びます。一覧の上の「カテゴリ」で、1つのカテゴリに絞り込めます。',
  'help.guide.add-accommodation.step.6': '「保存」をクリックします。',
  'help.guide.add-accommodation.result':
    '宿泊がその期間のすべての日に表示され、初日に「チェックイン」、最終日に「チェックアウト」が付きます。宿泊施設はチェックイン日の立ち寄り先になるので、地図にそこまでのルートが表示され、「予約」タブにはホテルの予約が追加されます。',
  'help.guide.add-accommodation.tip.1':
    '日付の選択画面は開いていた日から始まり、チェックアウトは翌日になっています。保存する前に、どちらも変更できます。',
  'help.guide.add-accommodation.tip.2':
    'ホテルを作成するときに「ホテル」カテゴリを付けておくと、リストの上の「カテゴリ」でワンクリックでホテルだけを表示できます。',
  'help.guide.add-accommodation.tip.3':
    '時刻はすべて任意です。チェックインの時刻もコードもない宿泊でも、宿泊する夜はきちんと登録され、ルートも表示されます。',
  // edit-accommodation
  'help.guide.edit-accommodation.title': '予約した宿泊を変更・キャンセルする',
  'help.guide.edit-accommodation.goal': '宿泊の日程を変える、時刻を修正する、計画から削除する、のいずれかを行います。',
  'help.guide.edit-accommodation.step.1':
    'カードには、宿泊施設と住所、該当する日の「チェックイン」か「チェックアウト」と時刻、予約番号、「予約」には宿泊に紐づく予約が表示されます。',
  'help.guide.edit-accommodation.step.2':
    '右側の鉛筆アイコン「宿泊先を編集」で、宿泊を編集できます。ポップアップのタイトルが「宿泊先を編集」に変わります。',
  'help.guide.edit-accommodation.step.3':
    '「チェックイン」「チェックイン期限」「チェックアウト」「確認」を修正します。上の日と、下の宿泊施設もここで変えられます。',
  'help.guide.edit-accommodation.step.4': '「保存」をクリックします。',
  'help.guide.edit-accommodation.step.5':
    '鉛筆アイコンの隣の×「削除」で、宿泊を削除します。確認は表示されず、その宿泊に紐づくホテルの予約も一緒に削除されます。',
  'help.guide.edit-accommodation.result':
    '変更は、その宿泊に含まれるすべての日と、「予約」タブのホテルの予約にすぐ反映されます。',
  'help.guide.edit-accommodation.tip.1':
    '連泊の途中の夜には「チェックイン」も「チェックアウト」も表示されません。表示されるのは期間の最初の日と最後の日だけです。',
  'help.guide.edit-accommodation.tip.2':
    '宿泊を取り消すと、チェックイン日に追加された立ち寄り先と、予約にリンクされた費用も削除されます。間違えた場合は、もう一度宿泊を追加してください。',
  // day-bookings
  'help.guide.day-bookings.title': 'その日の予約をひと目で確認する',
  'help.guide.day-bookings.goal': 'この日にすでに予約しているものと、確定しているかどうかをまとめて確認します。',
  'help.guide.day-bookings.step.1':
    '「予約」には、その日の予約が一覧されます。その日の日付の予約と、その日の立ち寄り先にピン留めした予約です。別の日の立ち寄り先にピン留めした予約は、その立ち寄り先にだけ表示されます。',
  'help.guide.day-bookings.step.2':
    '各行に予約の種類と名前が表示され、立ち寄り先に紐づく予約はその後ろにグレーで立ち寄り先が表示されます。時刻は右端の、ステータスの点の前に表示されます。',
  'help.guide.day-bookings.step.3':
    '色で予約のステータスがわかります。緑は確定、琥珀色は保留中です。公共交通機関の移動は青で、ステータスはありません。ホテルはこの一覧には含まれず、下に専用の欄があります。',
  'help.guide.day-bookings.step.4':
    '行をクリックすると予約が開きます。ヘッダーのピルで「保留」と「確定」を切り替え、下部の「編集」でほかの項目を変更します。新しい予約は「予約」タブで、移動は「移動」タブで作成します。',
  'help.guide.day-bookings.result':
    'その日の日付の予約と、その日の立ち寄り先にリンクした予約が、すべてこの一覧に表示されます。',
  'help.guide.day-bookings.tip.1':
    '予約は、その予約の日付の日に表示されます。「予約」タブや「移動」タブで日付を変えると、予約は自動で別の日に移ります。',
  'help.guide.day-bookings.tip.2':
    '「予約」ブロックがなければ、その日に予約はありません。空のブロックは表示されず、非表示になります。',
  'help.guide.map-lock.title': 'マップを固定する',
  'help.guide.map-lock.goal': '日や場所をクリックしても、マップが動かないようにします。',
  'help.guide.map-lock.step.1':
    'ロックは、地図左下にある2つの丸いボタンのうち上のほうです。カーソルを合わせると「地図の表示を固定」と表示されます。これをクリックします。ロック中は、日を開いたり場所を選んだりしても地図が拡大・移動しなくなり、ボタンの表示が「選択に合わせて地図を移動」に変わります。',
  'help.guide.map-lock.result': '計画を進めている間も、地図は表示した位置のままになります。',
  'help.guide.map-lock.tip.1':
    'もう一度ロック（今は「選択に合わせて地図を移動」）をクリックすると、地図が再び選択に合わせて動くようになります。ロックはパソコンでだけ使えます。スマートフォンでは、地図は常に選択に合わせて動きます。',

  // ── Screen: trip-map ──────────────────────────────────────────────────────────────────
  'help.ctx.trip-map.title': 'マップ',
  'help.ctx.trip-map.summary':
    '計画画面の中央です。旅行のすべての場所がピン、すべてのツアーが線で表示され、その間のルートも描かれます。地図の端のボタンで、表示の固定、衛星表示への切り替え、旅行全体の表示、表示中のエリアにある場所の表示ができます。',
  'help.ctx.trip-map.bullet.1':
    'ピンは場所を表します。場所に写真があればその写真、なければカテゴリの色とアイコンが表示されます。ピンにカーソルを合わせると、画像、名前、住所と、場所にあれば評価とカテゴリも載ったカードが表示されます。ピンを日のカードにドラッグすると、その日に場所を入れられます。予約がまだ保留の宿泊は、薄く破線の輪付きで表示されます。',
  'help.ctx.trip-map.bullet.2':
    '近すぎるピンは、数字付きの濃い色の丸1つにまとめられます。丸をクリックすると、地図がその中のピンまで拡大します。「設定」＞「表示」の「旅行と地図」で「未計画の場所を小さなマーカーで表示」をオンにすると、まだどの日にも入っていない場所が写真なしの小さな点になり、計画済みの立ち寄り先が見やすくなります。',
  'help.ctx.trip-map.bullet.3':
    'ピンをクリックすると、マップ下部のカードにその場所が開き、評価、ファイル、次にできる操作が表示されます。マップの何もないところをクリックするとカードが閉じます。',
  'help.ctx.trip-map.bullet.4':
    '日の列で日を開いていると、その日の立ち寄り先に、その日での順番を示す小さな白いバッジが付きます。その日に2回入っている場所には、両方の番号が表示されます。場所の一覧の上にあるフィルター（「表示」、カテゴリ、最低評価の星）は、地図上のピンにも適用されます。',
  'help.ctx.trip-map.bullet.5':
    '上部のアイコンの列で、表示中の範囲を検索します：「レストラン」「カフェ」「バー・ナイトライフ」「宿泊」「観光スポット」「美術館・文化施設」「自然・公園」「アクティビティ」。プラグインが追加したカテゴリは、細い区切り線の後ろに並びます。列が地図より長い場合は、マウスホイールで横にスクロールできます。地図を動かしたら、「このエリアを検索」でもう一度検索します。',
  'help.ctx.trip-map.bullet.6':
    '地図上の好きな場所を右クリックすると、その地点の住所が入った状態で場所のフォームが開きます。左下には丸いボタンが2つあります。ロック「地図の表示を固定」は、日や場所を次々にクリックしても地図の表示を動かさないようにします。その下の「衛星表示に切り替える」は、地図を衛星写真に切り替えます。',
  'help.ctx.trip-map.bullet.7':
    '右下の「旅程全体を表示」で、すべての移動日を一度に表示し、各日の内容を一覧にします。予約の行にあるルートアイコンではその予約を、日程の上のツールバーにあるルートアイコンではすべての予約を表示します。表示された予約の端をクリックすると、詳細が開きます。',
  'help.ctx.trip-map.bullet.8':
    'Dawarichアドオンがオンの場合、「旅程全体を表示」の下の丸いDawarichボタンで、スマートフォンが実際に記録したルートを表示できます。「記録されたルートを表示」で、計画したルートの下に日ごとの色の破線で描かれます。線がない場合は、ボタンのラベルに理由が表示されます。',
  // map-markers
  'help.guide.map-markers.title': '地図の見方',
  'help.guide.map-markers.goal': '地図上のピン、バッジ、吹き出しの意味を理解します。',
  'help.guide.map-markers.step.1':
    'マップには旅行のすべての場所が表示されます。ピンが近すぎて見分けられない場所では、ピンの数が入った濃い色の円にまとめられます。円をクリックするとそのピンまでズームし、最大までズームしている場合はピンが広がって表示されます。',
  'help.guide.map-markers.step.2':
    'ピンには、場所に写真があればその写真、なければカテゴリの色とアイコンが表示されます。予約がまだ保留の宿泊は、薄く破線の輪付きで表示されます。ピンにカーソルを合わせると横にカードが開き、同じ写真が大きく表示され、名前と住所、場所にあれば評価とカテゴリもわかります。',
  'help.guide.map-markers.step.3':
    'ピンをクリックすると、地図の下部に場所のカードが開きます。上部に画像、名前、住所、続いて星、説明、ファイル（予約のファイルを含む）が表示されます。下部には操作ボタンが並びます。日を開いているときは「日に追加」（その日にすでに入っている場所では「この日から削除」）、「ナビゲーション」、「Webサイトを開く」、「コレクションに保存」（保存済みなら「保存しました」）、右側にゴミ箱と「編集」です。上部の×か、地図の何もないところをクリックすると閉じます。',
  'help.guide.map-markers.step.4':
    '日程の列で日を開くと、立ち寄り先に番号が付きます。ピンの角にある小さな白いバッジが、その日の中での順番です。同じ日に2回出てくる場所には、両方の番号が表示されます。日を開いていないときは番号の代わりに、評価があればその場所の評価が角に表示されます。',
  'help.guide.map-markers.step.5':
    'マップのピンを日程の列の日のカードにドラッグすると、その場所がその日の予定に入ります。場所の一覧から行をドラッグするのと同じです。',
  'help.guide.map-markers.result':
    '旅行の内容は何も変わりません。マップは旅行を表示しているだけです。各ピンで、どの場所か、どの日の何番目かがわかります。',
  'help.guide.map-markers.tip.1':
    '日の列で日を折りたたむと、その日の立ち寄り先が地図から消えます。もう一度開くと表示されます。',
  'help.guide.map-markers.tip.2':
    '場所の一覧の上にあるフィルターは、地図の表示にも反映されます。「表示」（「未計画」「予定」）、タグのボタンのカテゴリ、星の最低評価で、ピンの数が絞り込まれます。国のフィルターは一覧だけに適用されます。',
  'help.guide.map-markers.tip.3':
    'この地図にはズームボタンがありません。マウスホイールで拡大・縮小し、ダブルクリックで1段階拡大し、地図をドラッグして移動します。',
  // map-nearby-places
  'help.guide.map-nearby-places.title': '地図で周辺の場所を探す',
  'help.guide.map-nearby-places.goal':
    'マップに表示している範囲でレストラン、観光スポット、ホテルを探し、旅行に追加します。',
  'help.guide.map-nearby-places.step.1':
    '地図上部のアイコンの列がカテゴリ検索です：「レストラン」「カフェ」「バー・ナイトライフ」「宿泊」「観光スポット」「美術館・文化施設」「自然・公園」「アクティビティ」。プラグインが追加したカテゴリは、細い区切り線の後ろに並びます。アイコンにカーソルを合わせると名前が表示されます。',
  'help.guide.map-nearby-places.step.2':
    'カテゴリをクリックします。TREK がマップに表示されている範囲でその種類の場所を探し、見つかった場所ごとにカテゴリの色のピンを立てます。一度に選べるカテゴリは1つだけです。別のカテゴリをクリックすると切り替わり、選択中のカテゴリをクリックするとオフになります。',
  'help.guide.map-nearby-places.step.3':
    'マップを動かすと、列の下に2つ目のボタン「このエリアを検索」が表示され、新しい表示範囲で同じ検索ができます。マップを動かしただけでは検索は始まりません。こうしてリクエストの数を抑えています。',
  'help.guide.map-nearby-places.step.4':
    'ピンにカーソルを合わせると、見つかった場所の名前が表示されます。ピンをクリックすると、情報が入力された状態で場所のフォームが開きます。ダイアログ上部の名前、「アドレス」「緯度」「経度」と、検索で見つかればウェブサイトと電話番号も入ります。',
  'help.guide.map-nearby-places.step.5':
    '入力された内容を確認し、検索ではわからなかった情報を追加します。旅行に合うカテゴリ（レストランならレストランなど）があれば、名前の下の「カテゴリ」ピルは設定済みです。なければ、選ぶまで「カテゴリなし」と表示されます。「説明」と自分のメモを追加します。',
  'help.guide.map-nearby-places.step.6':
    '「追加」をクリックします。同じ名前や同じ地点の場所がすでに旅行にある場合は TREK が知らせ、ボタンが「それでも追加」に変わります。',
  'help.guide.map-nearby-places.result':
    '場所が場所の一覧に追加され、地図上では旅行のピンとして表示されます。日に入れるまでは「未計画」に表示されます。検索のピンは、カテゴリをオフにするまで表示されたままです。',
  'help.guide.map-nearby-places.tip.1':
    '「設定」＞「表示」の「旅行と地図」で「地図でスポットを探す」がオフの場合、この列は表示されません。',
  'help.guide.map-nearby-places.tip.2':
    '結果はTREK Placesのインデックスと OpenStreetMapから取得するため、計画画面では数少ない、接続が必要な機能です。',
  'help.guide.map-nearby-places.tip.3':
    '検索の対象は画面に表示されている範囲だけなので、調べたい通りまで拡大してください。都市全体で検索すると、最初の60件だけが特に決まった順番なしで表示されます。',
  // map-add-place
  'help.guide.map-add-place.title': 'マップを右クリックして場所を作る',
  'help.guide.map-add-place.goal': '検索せずに、好きな位置に場所を置きます。',
  'help.guide.map-add-place.step.1':
    'マップ上の地点を右クリックします。「場所／アクティビティを追加」という見出しの場所フォームが開きます。',
  'help.guide.map-add-place.step.2':
    '「緯度」と「経度」にはその地点がすでに入っています。TREK が座標から住所を調べて「住所」に入力し、名前が見つかればダイアログ上部の名前も入力します。まだ何も保存されていないので、違っている箇所は直してください。',
  'help.guide.map-add-place.step.3':
    'ダイアログ上部の欄に、わかりやすい名前を入力します。その下のピルでカテゴリを選びます（選ぶまでは「カテゴリなし」と表示されます）。続いて、計画に必要なほかの情報（「説明」「ノート」「ウェブサイト」）を入力します。',
  'help.guide.map-add-place.step.4':
    '「追加」をクリックします。日を開いていても、場所は未計画として一覧に追加されます。地図の右クリックで決まるのは位置で、日ではありません。',
  'help.guide.map-add-place.result': '場所が一覧と地図に追加されます。日に入れるまでは「未計画」に表示されます。',
  'help.guide.map-add-place.tip.1':
    '住所は座標から調べるため、名前ではなく通りの名前が表示されることがあり、郊外では空欄になることもあります。どちらの項目も上書きできます。',
  'help.guide.map-add-place.tip.2':
    'MapLibre GL と Mapbox GL のマップでは中クリックでも、タッチ画面では長押しでも同じ操作ができます。',
  // map-satellite
  'help.guide.map-satellite.title': '航空写真に切り替える',
  'help.guide.map-satellite.goal': '通常の地図と航空写真を切り替えます。',
  'help.guide.map-satellite.step.1':
    'ベースレイヤーの切り替えは、地図左下にある2つの丸いボタンのうち、ロックの下にあるほうです。アイコンには切り替え先のレイヤーが表示され、ツールチップにも「衛星表示に切り替える」のように表示されます。これをクリックします。',
  'help.guide.map-satellite.step.2':
    '地図が航空写真になります。建物1つずつが見分けられるほど詳細で、自分のキーも必要ありません。ピン、その日のルート、トラック、予約のルートなど、TREKが描くものはすべてその上に表示されます。',
  'help.guide.map-satellite.step.3':
    'ボタンの表示が「地図表示に切り替える」に変わります。クリックすると地図表示に戻ります。',
  'help.guide.map-satellite.result': '地図が描き直され、選んだレイヤーはアカウントに保存されます。',
  'help.guide.map-satellite.tip.1':
    'この設定は旅行ではなくアカウントに保存されます。そのため、どの地図レンダラーを使っていても、どの旅行も前回の表示のまま開きます。',
  'help.guide.map-satellite.tip.2':
    '航空写真には文字がありません。通りの名前、地区名、番地は通常の地図にしか表示されないので、住所を探すときは切り替えて戻してください。',
  // map-whole-trip
  'help.guide.map-whole-trip.title': '旅行全体と距離を確認する',
  'help.guide.map-whole-trip.goal':
    '開いている日だけでなく、旅行の移動日をすべて表示し、日ごとの移動距離を確認します。',
  'help.guide.map-whole-trip.step.1':
    '丸い「旅程全体を表示」ボタンはマップの右下にあります。クリックすると、旅行の移動日がすべて一度に表示されます。日ごとに色が違うので、隣り合う日も見分けられます。',
  'help.guide.map-whole-trip.step.2':
    'ボタンの上のカードに、それらの日が一覧表示されます。色の点、日の名前、その日の移動手段ごとのアイコン、その日の移動距離です。一番上に「合計距離」があります。',
  'help.guide.map-whole-trip.step.3':
    'カードの日をクリックすると選択され、その行に網掛けが付いて、日程の列でその日が開きます。都市の上でマウスホイールを回すとズームインでき、その都市を通る日がそれぞれの色で並んで表示されます。',
  'help.guide.map-whole-trip.step.4':
    'ボタンが「旅程全体を非表示」に変わります。クリックすると、開いている日だけの表示に戻ります。',
  'help.guide.map-whole-trip.result':
    '移動のある日がそれぞれの色で表示され、カードに各日の距離と旅行全体の合計が表示されます。',
  'help.guide.map-whole-trip.tip.1':
    '合計は数区間ずつ計算されます。後ろに「…」が表示されている間は、途中までの合計です。すべての区間の計算が終わると確定します。',
  'help.guide.map-whole-trip.tip.2':
    'ルーターが区間を計算できない場合、その区間は直線のままで、距離に含まれません。カードにその旨が表示されるので、知らないうちに合計が少なくなることはありません。',
  'help.guide.map-whole-trip.tip.3':
    '位置情報のある立ち寄り先が2つ未満で、宿泊先への行き来もない日は、表示するルートがないため、カードにも表示されません。',
  // map-booking-routes
  'help.guide.map-booking-routes.title': '予約のルートをマップに表示する',
  'help.guide.map-booking-routes.goal': '予約したフライト、列車、車での移動をマップに表示し、また非表示にします。',
  'help.guide.map-booking-routes.step.1':
    '予約ルートは、オンにするまで表示されません。日程の列にある移動の行の右端に、小さなルートアイコン「予約ルートを表示」があります。',
  'help.guide.map-booking-routes.step.2':
    'クリックすると、予約が地図に表示されます。飛行機は大圏ルートの弧、車は実際の道路沿い、電車は駅をつないだ線で表示されます。「確定」は実線、「保留」は破線で、ルートの両端は移動手段のアイコン付きの青いピルです。',
  'help.guide.map-booking-routes.step.3':
    '端のピルをクリックすると、予約の詳細が開きます。色の付いたヘッダーにステータス、タイプ、日のピル、両端の時刻、その下にほかの情報が表示されます。下部には、このルートを再びオフにする「地図上」、公共交通機関の乗り継ぎでは「経路を変更」、予約を削除するゴミ箱アイコン、「編集」があります。ヘッダーの×で詳細を閉じます。',
  'help.guide.map-booking-routes.step.4':
    '日の上のツールバーにあるルートのアイコンは、旅行全体に対して使えます。「すべての予約ルートを表示」で、ルートのある予約をすべて表示します。',
  'help.guide.map-booking-routes.step.5':
    'これまでの選択は置き換えられるので、予約ごとにオンにしたルートはリセットされます。表示が「すべての予約ルートを非表示」に変わったボタンをもう一度押すと、予約のルートがすべて非表示になります。',
  'help.guide.map-booking-routes.result':
    '選んだ予約がマップに表示されます。この設定は、変更するまでこのブラウザーのこの旅行で保持されます。',
  'help.guide.map-booking-routes.tip.1':
    '両端に空港コードや駅名が表示されるのは、「設定」＞「表示」の「旅行と地図」で「予約ルートのラベル」がオンの場合だけです。オフの場合はアイコンだけが表示されます。',
  'help.guide.map-booking-routes.tip.2':
    '同じセクションの「予約ルートを常に表示」をオンにすると、まだ自分で設定していないすべての旅行で、最初から予約ルートが表示されます。',
  'help.guide.map-booking-routes.tip.3':
    '予約のルートを表示するには、出発地と到着地の両方に座標が必要です。そのため、ホテルやレストランにはルートアイコンがありません。',
  // map-dawarich-trail
  'help.guide.map-dawarich-trail.title': '実際に移動したルートを表示する',
  'help.guide.map-dawarich-trail.goal':
    'Dawarich がスマートフォンで記録したルートを、計画したルートの横に破線でマップに表示し、旅行が実際にどうだったかを日ごとに確認します。',
  'help.guide.map-dawarich-trail.step.1':
    '丸いDawarichボタンは地図の右下、「旅程全体を表示」の下にあります。カーソルを合わせると「記録されたルートを表示」と表示されます。クリックすると、TREKが自分のDawarichに旅行期間のデータを問い合わせ、応答を待つ間ボタンの周りで輪が回ります。',
  'help.guide.map-dawarich-trail.step.2':
    '記録されたルートが日ごとの色の破線で表示されます。計画が見やすいように、計画したルートの下に描かれます。ボタンの表示は「記録されたルートを非表示」に変わります。日は現地時間の深夜0時で区切られます。日の列で日を折りたたむと、その日の破線と立ち寄り先が地図から消えます。',
  'help.guide.map-dawarich-trail.step.3':
    '「旅程全体を表示」もクリックすると、計画したすべての日が、記録の破線の横に実線で表示されます。2本の線が重なっているところは計画どおりに進み、破線が計画のルートから外れているところは計画と違っていたことがわかります。',
  'help.guide.map-dawarich-trail.result':
    '計画したルートと実際の移動が、破線と実線でマップに並んで表示されます。ボタンの上のカードには、引き続き計画した日とその距離が一覧表示されます。',
  'help.guide.map-dawarich-trail.tip.1':
    'オンかオフかは旅行ごとにアカウントに保存されるので、どのブラウザーや端末でも同じです。ルートがオンの間、TREK は2分ごとに Dawarich に問い合わせるため、進行中の旅行はページを再読み込みしなくても更新されます。ルート自体は保存されないので、TREK のデータベースにもバックアップにも含まれず、オフラインでは表示されません。',
  'help.guide.map-dawarich-trail.tip.2':
    'マップに何も表示されない理由は、ボタンのラベルでわかります。読み込み中は「記録されたルートを読み込み中…」、ほかに「この日付には記録がありません」「記録されたルートを読み込めませんでした」、TREK がオフラインのときは「記録されたルートの表示には接続が必要です」と表示されます。',
  // map-compass
  'help.guide.map-compass.title': 'マップを回転させ、北向きに戻す',
  'help.guide.map-compass.goal': '進む方向に合わせて地図を回転させ、1回のクリックで北向きに戻します。',
  'help.guide.map-compass.step.1':
    '右ボタンでドラッグするか、Ctrlキーを押しながら左ボタンでドラッグすると、地図が回転します。タッチ画面では2本の指で回します。地図上部のカテゴリアイコンの列の横にある丸いコンパスも一緒に回ります。矢印は常に北を指すので、地図と同じ角度だけ傾きます。',
  'help.guide.map-compass.step.2':
    'コンパスをクリックします。このボタン（「北を上にする」）で、地図が北が上の向きに戻り、傾きも平らに戻って、矢印がまた上を向きます。',
  'help.guide.map-compass.result':
    'マップが北向きに戻り、傾きもなくなります。旅行の内容は何も変わりません。コンパスで変わるのは表示だけです。',
  'help.guide.map-compass.tip.1':
    'コンパスがあるのは MapLibre GL と Mapbox GL のマップだけです。Leaflet のマップは回転できないため、コンパスはありません。使うマップは「設定」の「マップ」にある「地図プロバイダー」で選び、「地図を保存」で保存します。',
  'help.guide.map-compass.tip.2':
    'クリックすると傾きもなくなります。右ボタンで上下にドラッグすると表示が傾き、「北向きにリセット」で傾きと回転が元に戻ります。Mapbox GL で「3D建物・地形」がオンの場合は、もう一度傾けるまで3D表示も平らになります。',

  // ── Screen: trip-collab ───────────────────────────────────────────────────────────────
  'help.ctx.trip-collab.title': 'コラボ',
  'help.ctx.trip-collab.summary':
    'グループで一緒に計画するタブで、5枚のカードがあります。左に「チャット」、その横に「ノート」と「リンク」、その下に「投票」と「次にすること」です。ここに書いた内容は、再読み込みしなくても、すぐにほかのメンバー全員の画面に表示されます。',
  'help.ctx.trip-collab.bullet.1':
    'チャットは左側のカードです。「メッセージを入力…」に入力して Enter を押します。Shift＋Enter で改行できます。スマイリーで絵文字を追加でき、「画像を添付」でメッセージに画像を4枚まで添付できます。',
  'help.ctx.trip-collab.bullet.2':
    'メッセージにカーソルを合わせると「返信」が、自分のメッセージにはさらに「削除」が表示されます。右クリックすると8種類のクイックリアクションが表示されます。削除されたメッセージは、誰が削除したかを示す表示に置き換わります。',
  'help.ctx.trip-collab.bullet.3':
    '「ノート」は共有のメモ欄です。ヘッダーの「新規ノート」でノートを作成し、その横の歯車で「カテゴリ管理」を開いて、カテゴリの名前と色を設定します。カテゴリを作ると、ヘッダーの下に並ぶピルで、カードを「すべて」か1つのカテゴリに絞り込めます。ノートのカードには、カテゴリが色の点、リンクが丸いボタンで表示され、三点メニュー（「その他のオプション」）に「展開」「固定」「編集」「削除」があります。',
  'help.ctx.trip-collab.bullet.4':
    '「リンク」には旅行に関係するウェブアドレスをまとめます。「リンクを追加」でタイトルと http または https のアドレスを入力します。「リンクを編集」「リンクを固定」「リンクを削除」はチップの末尾にあり、固定したリンクは先頭に表示されたままになります。',
  'help.ctx.trip-collab.bullet.5':
    '投票を使って物事を決めましょう。「新しい投票」で、2つ以上の選択肢を付けて質問します。選択肢をクリックすると投票できます。投票のヘッダー右側にある鍵アイコン（「閉じる」）で投票を締め切り、ゴミ箱アイコン（「削除」）で投票を削除します。',
  'help.ctx.trip-collab.bullet.6':
    '「次にすること」には、旅行のこれからの立ち寄り先が最大8件、時刻と参加者付きで表示されます。日程の内容を表示するだけなので、時刻は日程で設定します。',
  // write-note
  'help.guide.write-note.title': '共有のノートを書く',
  'help.guide.write-note.goal':
    'ルール、住所、リマインダーなど、グループ全員に必要な情報を、誰でも見つけられる場所に置きます。',
  'help.guide.write-note.step.1':
    '「ノート」カードのヘッダーにある「新規ノート」をクリックします。ノートのダイアログが開き、タイトル欄にカーソルが置かれています。',
  'help.guide.write-note.step.2':
    'ダイアログ上部の「ノートのタイトル」にタイトルを入力します。必須の項目はこれだけです。タイトルを入力するまで「作成」はグレーのままで、タイトル欄で Enter を押すとすぐにノートが作成されます。',
  'help.guide.write-note.step.3':
    '「内容」に本文を入力します。Markdown に対応していて、太字、リスト、見出しが使えます。カードには最初の3行が表示され、メニューの「展開」でノート全体が開きます。',
  'help.guide.write-note.step.4':
    '「カテゴリ」で、ノートのカテゴリを選びます。その色が、今はダイアログのヘッダーに、あとでカードのヘッダーに使われます。最初のカテゴリがあらかじめ選ばれています。ピルは既存のカテゴリで、新しいカテゴリは「カテゴリ管理」で作成します。旅行にカテゴリがまだない場合、この行は表示されません。',
  'help.guide.write-note.step.5':
    '「ウェブサイト」には、ノートに関係するリンクを入力します。カードの上部に、そのリンクを開く丸いボタンが表示されます。',
  'help.guide.write-note.step.6':
    '「作成」をクリックします。ダイアログは「キャンセル」と×でしか閉じないので、外側をクリックしたりEscキーを押したりしても、書いた内容は失われません。',
  'help.guide.write-note.result':
    'ノートが「ノート」パネルにカードで表示されます。上部はカテゴリの色になり、ほかのメンバー全員にもすぐに表示されます。',
  'help.guide.write-note.tip.1':
    'カードの三点メニュー（「その他のオプション」）に「展開」「固定」「編集」「削除」があります。「固定」でノートをカテゴリの色の枠付きでパネルの上部に固定します。ほかのノートは、最後に変更された順に並びます。',
  'help.guide.write-note.tip.2':
    '「新規ノート」の隣の歯車アイコンで「カテゴリ管理」が開きます。カテゴリに色を付けたり、名前をまとめて変更したり、まだノートで使っていないカテゴリを追加したりできます。「保存」をクリックするまで変更は反映されません。',
  'help.guide.write-note.tip.3':
    '旅行にファイルをアップロードする権限があれば、「ファイルを添付」でノートに書類を添付できます。「添付」でファイルの選択画面が開きます。画像やPDFはダイアログに貼り付けることもできます。',
  'help.guide.write-note.tip.4':
    '「ノート」には、「アドオン」の「Collab」の下に専用のスイッチがあります。管理者はノートだけをオフにして、チャット、リンク、投票、「次にすること」はそのまま使えるようにできます。',
  // shared-links
  'help.guide.shared-links.title': '旅行のリンクをまとめる',
  'help.guide.shared-links.goal':
    '予約サイト、共有アルバム、時刻表を1か所にまとめて、チャットをさかのぼって探さずに済むようにします。',
  'help.guide.shared-links.step.1':
    '「リンク」カードのヘッダーにある「リンクを追加」をクリックします。上部の入力欄にカーソルがある状態でダイアログが開きます。',
  'help.guide.shared-links.step.2':
    '「リンクのタイトル」に名前を入力し、その下の「リンク」にアドレスを貼り付けて、「リンクを保存」をクリックします。',
  'help.guide.shared-links.step.3':
    'チップに名前とリンク先のサイトが表示されます。クリックすると、新しいタブでページが開きます。',
  'help.guide.shared-links.step.4':
    '末尾にある3つの丸いボタンは「リンクを編集」「リンクを固定」「リンクを削除」です。「リンクを固定」をクリックすると、チップがパネルの先頭に移動し、アクセントカラーで表示されます。「リンクを削除」は、すべてのメンバーからリンクが削除されるため、先に確認が表示されます。',
  'help.guide.shared-links.result':
    'リンクが「リンク」パネルの先頭に固定されたチップとして表示され、すぐにメンバー全員の画面にも表示されます。',
  'help.guide.shared-links.tip.1':
    '使えるのは http または https のアドレスだけです。それ以外は登録できず、入力した内容のままダイアログが開いています。',
  'help.guide.shared-links.tip.2':
    '固定したリンクが先頭に、そのあとは新しい順に並びます。タイトルの横の小さなアイコンはそのサイトのファビコンで、サイトから読み込まれます。そのため、インターネットに接続していないときは、代わりに通常のリンクアイコンが表示されます。',
  'help.guide.shared-links.tip.3':
    '「リンク」は「アドオン」の「コラボ」の下にある独立したスイッチなので、管理者はタブのほかの部分はそのままで、このパネルだけをオフにできます。',
  // create-poll
  'help.guide.create-poll.title': 'グループに聞く',
  'help.guide.create-poll.goal': 'チャットで誰も答えない質問を、全員が投票できる投票にします。',
  'help.guide.create-poll.step.1':
    '「投票」カードのヘッダーにある「新しい投票」をクリックします。ダイアログが開きます。',
  'help.guide.create-poll.step.2':
    '「質問」に質問を入力します。入力欄の下にある「Markdown対応」は、太字、改行、短いリストが使えるという意味です。',
  'help.guide.create-poll.step.3':
    '「選択肢」の「選択肢 1」と「選択肢 2」を入力します。空でない選択肢が2つ以上必要です。1つの選択肢に複数行を入力することもできます。',
  'help.guide.create-poll.step.4':
    'その下の「選択肢を追加」で、3つ目、4つ目と必要なだけ選択肢を追加できます。選択肢が3つ以上になると行の横に表示される小さな × で、その選択肢を削除できます。',
  'help.guide.create-poll.step.5':
    '「複数選択」をオンにすると、全員が2つ以上の選択肢を選べます。オフの場合は、別の選択肢を選ぶと票がそちらに移ります。',
  'help.guide.create-poll.step.6': '「投票を作成」をクリックします。',
  'help.guide.create-poll.result':
    '投票が「投票」パネルの上部に受付中の状態で表示され、ヘッダーには0票と表示されます。',
  'help.guide.create-poll.tip.1': '質問は Markdown で表示されます。選択肢はプレーンテキストのままです。',
  'help.guide.create-poll.tip.2': '質問と、入力済みの選択肢が2つ以上そろうまで、「投票を作成」はグレーのままです。',
  'help.guide.create-poll.tip.3':
    '締め切りはスマートフォンのアプリでしか設定できません。締め切りのある投票は、ヘッダーに残り時間が琥珀色のチップで表示され、時間になると締め切られます。',
  'help.guide.create-poll.tip.4':
    '「投票」には、「アドオン」の「Collab」の下に専用のスイッチがあります。管理者は投票だけをオフにして、ほかの4つのパネルはそのまま使えるようにできます。',
  // vote-poll
  'help.guide.vote-poll.title': '投票して結果を見る',
  'help.guide.vote-poll.goal': '投票して、グループの結果を確認し、投票を変更します。',
  'help.guide.vote-poll.step.1':
    '選びたい選択肢をクリックします。丸にチェックが付き、選択肢にアクセントカラーの枠が付いて、後ろのバーが伸びます。',
  'help.guide.vote-poll.step.2':
    'これで結果全体を確認できます。バーが割合を、右側の数字がパーセントを示し、小さな丸はその選択肢を選んだ人です（最大3人まで表示）。',
  'help.guide.vote-poll.step.3':
    '気が変わったら、別の選択肢をクリックします。「複数選択」でない投票では、票が2つになるのではなく、新しい選択肢に票が移ります。',
  'help.guide.vote-poll.step.4':
    '票数は、質問の下のチップに表示されます。すでに選んだ選択肢をもう一度クリックすると投票が取り消され、票数が減ります。',
  'help.guide.vote-poll.result':
    '選んだ選択肢にチェックが付き、バーでグループの投票結果が、丸で誰がどの選択肢を選んだかがわかります。',
  'help.guide.vote-poll.tip.1':
    '割合と誰が何に投票したかは、自分が投票するか投票が終了するまで表示されません。ヘッダーの票数は全員に表示されます。',
  'help.guide.vote-poll.tip.2':
    '投票は匿名ではありません。選択肢の丸にカーソルを合わせると、投票した人の名前が表示されます。',
  // close-poll
  'help.guide.close-poll.title': '投票を終了・削除する',
  'help.guide.close-poll.goal': 'グループで決まったら投票を締め切り、不要になった投票は削除します。',
  'help.guide.close-poll.step.1':
    '投票のヘッダー右側にある鍵アイコンの「閉じる」で、投票を締め切ります。選択肢はクリックできなくなります。',
  'help.guide.close-poll.step.2':
    '終了した投票はパネルのいちばん下に移ります。開いている投票がある場合は、「終了」の見出しの下に表示されます。「終了」チップが付き、投票したかどうかに関係なく全員に結果が表示されます。最も票を集めた選択肢は、緑のバー上に太字で表示されます。自分が選んだ選択肢なら、バーはアクセントカラーになります。',
  'help.guide.close-poll.step.3':
    'ヘッダー右側のゴミ箱アイコン「削除」で、投票を削除します。締め切った投票では鍵アイコンがなくなるので、ボタンはこれだけになります。確認は表示されず、票も一緒に削除されます。',
  'help.guide.close-poll.result':
    '削除した投票は、メンバー全員のパネルから消えます。締め切っただけの投票は、結果とともに一番下に表示されたまま残ります。',
  'help.guide.close-poll.tip.1':
    '投票の終了は取り消せず、再開もできません。誤って終了した投票は、作り直す必要があります。',
  'help.guide.close-poll.tip.2': '「削除」では、投票とすべての票が、確認なしで全員の画面からすぐに削除されます。',
  // whats-next
  'help.guide.whats-next.title': '「次にすること」を確認する',
  'help.guide.whats-next.goal': '予定を開かなくても、グループが次に何をするかを確認できます。',
  'help.guide.whats-next.step.1':
    'カードには、旅行のこれからの立ち寄り先が最大8件、時刻順に、日ごとの見出しの下に表示されます。見出しは「今日」「明日」または日付で、その日にタイトルがあれば隣に表示されます。ヘッダーには件数が表示されます。',
  'help.guide.whats-next.step.2':
    '各立ち寄り先の左に時刻が表示されます。開始時刻と、終了時刻があれば「〜」と終了時刻です。時刻が未設定のときは「未定」と表示されます。',
  'help.guide.whats-next.step.3':
    'その横に、名前、住所、その立ち寄り先に行く人のチップが表示されます。立ち寄り先に誰も割り当てられていなければ、旅行のメンバー全員が表示されます。',
  'help.guide.whats-next.result':
    'これからの予定の一覧が表示されます。閲覧専用で、計画の内容に合わせて表示され、ここから計画が変わることはありません。',
  'help.guide.whats-next.tip.1':
    'ここで設定するものはありません。時刻は日程から取得されます。日程で時刻を変えると、この一覧もすぐに更新されます。',
  'help.guide.whats-next.tip.2':
    '表示されるのはこれからの予定だけです。立ち寄り先は開始時刻を過ぎると一覧から消え、時刻のない今日の立ち寄り先はその日が終わるまで残ります。旅行が終わると、パネルは空になります。',
  'help.guide.whats-next.tip.3':
    '「次にすること」は「アドオン」の「コラボ」の下に専用のスイッチがあります。パソコン用のパネルで、スマートフォンのアプリの「コラボ」タブには表示されません。',
  // trip-chat
  'help.guide.trip-chat.title': 'グループとチャットする',
  'help.guide.trip-chat.goal':
    'メッセージを送る、特定のメッセージに返信する、ほかのメッセージにリアクションする、自分のメッセージを削除する。',
  'help.guide.trip-chat.step.1':
    '「メッセージを入力…」に入力して Enter を押します。入力欄の横にある丸い矢印ボタンでも送信できます。Shift＋Enter では改行になります。',
  'help.guide.trip-chat.step.2':
    'スマイリーをクリックすると絵文字の選択画面が開き、「スマイリー」「リアクション」「旅行」のカテゴリがあります。選んだ絵文字は入力中のテキストに追加されるだけで、それだけでは送信されません。',
  'help.guide.trip-chat.step.3':
    'ほかの人のメッセージにカーソルを合わせると、角に小さな丸いボタンが表示されます。これが「返信」です。',
  'help.guide.trip-chat.step.4':
    '返信するメッセージが入力欄の上に引用されます。メッセージを書いて送信すると、引用も一緒に送られます。引用の×をクリックすると、引用を外せます。',
  'help.guide.trip-chat.step.5':
    'メッセージを右クリックすると、8つのクイックリアクションが表示されます。自分のリアクションはメッセージの下に表示されます。同じリアクションをもう一度クリックすると取り消せます。',
  'help.guide.trip-chat.step.6':
    '自分のメッセージには、「返信」の隣にゴミ箱アイコンの「削除」があります。クリックするとメッセージはすぐに削除され、削除したことを示す表示が残ります。元に戻すことはできません。',
  'help.guide.trip-chat.result':
    '返信が最新のメッセージとして表示され、上部に引用元のメッセージが表示されます。リアクションは相手のメッセージの下に表示されます。削除したメッセージには、削除したことを示す表示が残ります。',
  'help.guide.trip-chat.tip.1':
    'Enter で送信、Shift＋Enter で改行です。絵文字だけのメッセージ（1～3個）は大きく表示されます。',
  'help.guide.trip-chat.tip.2':
    '「画像を添付」で、1つのメッセージに画像を4枚まで添付できます。入力欄に貼り付けたり、ドロップしたりすることもできます。',
  'help.guide.trip-chat.tip.3':
    'リンクを含むメッセージには、その下にプレビューのカードが表示されます。プレビューは自分のTREKが取得するので、自分しかアクセスできないリンクは通常のリンクのまま表示されます。',
  'help.guide.trip-chat.tip.4':
    '「チャット」は「アドオン」の「コラボ」の下にある独立したスイッチです。管理者はチャットだけをオフにして、ノート、リンク、投票、「次にすること」はそのまま使えるようにできます。',

  // ── Screen: trip-lists ────────────────────────────────────────────────────────────────
  'help.ctx.trip-lists.title': 'リスト',
  'help.ctx.trip-lists.summary':
    '1つの旅行に2つのリストがあります。誰が何を持っていくか、どのくらいの重さかがわかる持ち物リストと、旅行の前と旅行中にやることをまとめた ToDo リストです。このタブは「リスト」アドオンがオンのときに表示されます。',
  'help.ctx.trip-lists.bullet.1':
    '上部のバーの「持ち物リスト」と「ToDo」で表示を切り替えます。それぞれに件数も表示されます。バーの右端のボタンは、開いているほうの操作です。',
  'help.ctx.trip-lists.bullet.2':
    '持ち物リストは、「書類」や「衣類」など好きな名前のリストに分かれています。リストはそれぞれカードになっていて、ヘッダーには、リストごと別の位置にドラッグできるグリップ、色の点、準備済みと全体の数を示すバッジ、「名前を変更」「すべてチェック」「すべて解除」「リストを削除」がある三点メニュー、カードを折りたたむ矢印があります。上のバーの「リストを追加」で新しいリストを作れます。',
  'help.ctx.trip-lists.bullet.3':
    '各行には、ドラッグ用のハンドル、チェックボックス、名前、そのアイテムを持っていく人の小さなアバターがあります。数量が2以上のアイテムには、マイナスとプラス付きの準備済みカウンター（例：3/10）も付きます。続いて数量の小さなバッジ、「バッグ管理」がオンのときはグラム単位の重さとバッグの丸、ゴミ箱、三点メニュー（「リストへ移動」「共有」「名前を変更」「削除」）が並びます。その行で使っていない操作は、カーソルを合わせるまで薄く表示されます。',
  'help.ctx.trip-lists.bullet.4':
    '「共有」と「マイリスト」で、持ち物リストを全員が見るリストと自分用のリストに分けます。その横の「すべて」「未完了」「完了」で、開いているほうを絞り込みます。行の右端の「名前順」で各リストのアイテムを名前順に並べ、もう一度クリックすると自分で並べた順に戻ります。上の進捗カードで、準備済みの数がわかります。',
  'help.ctx.trip-lists.bullet.5':
    '「テンプレートを適用」と「テンプレートとして保存」で、入力せずにリストを作成したり保存したりできます。その後ろの2つのアイコン「エクスポート」と「インポート」で、リストを印刷用、PDF、ファイルで書き出し、リストを取り込めます。進捗カードの右端の赤いボタンには、チェックしたアイテムの数が表示され、それらを削除できます。',
  'help.ctx.trip-lists.bullet.6':
    '「ToDo」には専用のサイドバーがあり、進捗カード、「すべて」「自分のタスク」「期限切れ」「完了」のフィルター、リストごとの行、その下に「リストを追加」があります。タスクはカードの中に並びます。カードのヘッダーには、フィルター名と並び順（「優先度」か「期限」）が表示されます。タスクをクリックすると右のペインで開きます。バーの「新しいタスクを追加...」で「新しいタスク」のダイアログが開きます。',
  // packing-categories
  'help.guide.packing-categories.title': '持ち物リストを作る',
  'help.guide.packing-categories.goal':
    '持っていくものをリストに分け、アイテムを追加して、リストごとの担当者を決めます。',
  'help.guide.packing-categories.step.1':
    'リストの上のバーにある「リストを追加」をクリックします。小さなダイアログが開くので、上部の帯の「リスト名（例：衣類）」に名前を入力し、「追加」をクリックします。',
  'help.guide.packing-categories.step.2':
    '新しいリストは、薄い3つの点だけのプレースホルダーの行から始まります。行の下にある「品目を追加」をクリックし、「項目名...」にアイテムを入力して Enter を押します。最初のアイテムがプレースホルダーと入れ替わり、入力欄は次のアイテムのために開いたままです。',
  'help.guide.packing-categories.step.3':
    '行の名前をクリックするか、右端の三点メニューの「名前を変更」で名前を変えます。',
  'help.guide.packing-categories.step.4':
    'リストの上部の帯にある、人のアイコンが入った破線の丸で、旅行のメンバーをリストに割り当てます。名前を選びます。外すには、表示されたチップをクリックします。',
  'help.guide.packing-categories.step.5':
    '件数の横の三点メニューに、ほかの操作があります：「名前を変更」「すべてチェック」「すべて解除」「リストを削除」。「リストを削除」では、確認なしでリストとそのアイテムがすべて削除されます。右端の矢印でリストを折りたためます。',
  'help.guide.packing-categories.result':
    '新しいリストが色の点付きでグリッドに表示され、その下にアイテムが並びます。バッジには、すでに詰めたアイテムの数が表示されます。',
  'help.guide.packing-categories.tip.1':
    'リストはアイテムがあって初めて存在します。最後のアイテムを削除すると、リストの位置と色を保つために行がプレースホルダーになります。その行も削除すると、リストが削除されます。',
  'help.guide.packing-categories.tip.2':
    'リストに誰かを割り当てると、その人に持ち物の通知が届きます。アイテムを見られる人は変わりません。それは行の三点メニューにある「共有」で設定します。',
  'help.guide.packing-categories.tip.3':
    '2つのリストに同じ名前を付けてもかまいません。TREK が内部で区別するので、名前は入力したとおりに残ります。',
  // check-off-packing
  'help.guide.check-off-packing.title': '荷造りしながらチェックする',
  'help.guide.check-off-packing.goal':
    'バッグに入れたものにチェックを付け、進捗バーを確認し、準備済みのアイテムを削除します。',
  'help.guide.check-off-packing.step.1':
    '行の左のボックスをクリックします。名前に取り消し線が付き、進捗バーが更新されます。',
  'help.guide.check-off-packing.step.2':
    'リストの上の進捗カードに、リスト全体のうち詰め終わったアイテムの数が、件数、パーセント、バーで表示されます。',
  'help.guide.check-off-packing.step.3':
    'リスト全体をまとめてチェックするには、ヘッダーの三点メニューにある「すべてチェック」と「すべて解除」を使います。',
  'help.guide.check-off-packing.step.4':
    '「共有」と「マイリスト」の隣にある「すべて」「未完了」「完了」で、グリッドを絞り込めます。「未完了」ではまだ詰めていないものだけが表示されるので、すべて詰め終わったリストは非表示になります。',
  'help.guide.check-off-packing.step.5':
    '進捗カードの右端にある赤いボタン「チェック済みの…件を削除」（チェックしたアイテムの数が入ります）を押すと、ブラウザーでの確認を1回経て、チェックしたアイテムがまとめて削除されます。',
  'help.guide.check-off-packing.result': '未完了のアイテムだけが表示され、上のバーで荷造りの進み具合がわかります。',
  'help.guide.check-off-packing.tip.1': 'チェックしたアイテムも名前を変えられます。名前をクリックしてください。',
  'help.guide.check-off-packing.tip.2':
    '「すべてチェック」と「すべて解除」は、リストごとの三点メニューから、1つのリストずつ使います。',
  'help.guide.check-off-packing.tip.3':
    'すべてのアイテムにチェックが入ると、カウンターが「すべて梱包済み！」に変わり、バーが緑になります。',
  // apply-packing-template
  'help.guide.apply-packing-template.title': '持ち物テンプレートを適用する',
  'help.guide.apply-packing-template.goal':
    '用意されたリストを旅行に追加したり、この旅行のリストを次の旅行のために保存したりします。',
  'help.guide.apply-packing-template.step.1': 'リストの上のバーにある「テンプレートを適用」をクリックします。',
  'help.guide.apply-packing-template.step.2':
    'テンプレートを選びます。各行に、テンプレートの名前とアイテムの数が表示されます。',
  'help.guide.apply-packing-template.step.3':
    'アイテムは開いている表示に追加されます。「共有」では全員が見る共有リストに、「マイリスト」では自分のリストに追加されます。',
  'help.guide.apply-packing-template.step.4':
    'この旅行のリストを次の旅行でも使うには、「テンプレートとして保存」をクリックします。小さなダイアログが開くので、上部の「テンプレート名」と表示された欄に名前を入力し、「保存」をクリックします。',
  'help.guide.apply-packing-template.result':
    'テンプレートのリストとアイテムが、既存のものと並んで旅行に追加されます。',
  'help.guide.apply-packing-template.tip.1':
    'テンプレートでは、各アイテムのリスト、数量、重さ、バッグがコピーされ、旅行にまだないバッグは作成されます。チェックはコピーされず、すでにリストにあるものも削除されません。',
  'help.guide.apply-packing-template.tip.2':
    '「テンプレートを適用」は、テンプレートが1つ以上あるときだけ表示されます。テンプレートがなければボタン自体が表示されません。',
  'help.guide.apply-packing-template.tip.3':
    '「テンプレートとして保存」は、インスタンスの管理者にだけ、リストにアイテムがあるときに表示されます。保存されるのは共有アイテムと自分のアイテムで、ほかのメンバーの非公開アイテムは含まれません。',
  // import-packing-list
  'help.guide.import-packing-list.title': '持ち物リストをまとめて貼り付ける',
  'help.guide.import-packing-list.goal': 'ほかの場所にあるリストを、まとめて持ち物のアイテムにします。',
  'help.guide.import-packing-list.step.1':
    '一覧の上のバーの右端にある、下向き矢印のアイコン「インポート」をクリックします。',
  'help.guide.import-packing-list.step.2':
    '1行に1アイテムです：カテゴリ, 名前, 重さ（g、任意）, バッグ（任意）, checked/unchecked（任意）。ボックス内のグレーの見本で4つの形式をすべて確認でき、左端の数字で入力した行数がわかります。Markdownのリストも使えます。見出しがリスト名になり、「- [ ]」と「- [x]」がアイテムになります。',
  'help.guide.import-packing-list.step.3':
    'または、ダイアログ左下の「CSV/TXT/MDを読み込む」で、ファイルから行を読み込みます。.csv、.txt、.mdファイルに対応し、ボックスの内容が置き換わります。',
  'help.guide.import-packing-list.step.4':
    '右下の「3件をインポート」をクリックします。ボタンの数字は、TREK が読み取れた行の数です。',
  'help.guide.import-packing-list.result':
    '1行が1つのアイテムになり、最初の欄に書いた名前のリストに入ります。既存のアイテムは変わりません。',
  'help.guide.import-packing-list.tip.1':
    'カンマ、セミコロン、タブのどれでも項目を区切れます。ダブルクォーテーションで囲むと1つの項目になるので、"Shirt, blue" は1つの名前のままです。値が1つだけの行は名前として扱われます。リストの指定がない行は「その他」に入ります。名前の前に「3x」と付けると数量になります。',
  'help.guide.import-packing-list.tip.2':
    '4番目の項目に書いたバッグが旅行にまだない場合は、TREKが作成します。多くのアイテムに重さとバッグをまとめて設定するには、「インポート」と「テンプレートを適用」の2つの方法があります。',
  // export-packing-list
  'help.guide.export-packing-list.title': '持ち物リストを印刷・エクスポートする',
  'help.guide.export-packing-list.goal':
    'リストを印刷する、PDFで保存する、ほかのアプリや次の旅行用にファイルで書き出す、のいずれかを行います。',
  'help.guide.export-packing-list.step.1':
    '一覧の上のバーで、「インポート」のすぐ前にある上向き矢印のアイコン「エクスポート」をクリックします。',
  'help.guide.export-packing-list.step.2':
    '「Markdown チェックリスト (.md)」と「インポート用 CSV (.csv)」では、リストがすぐにファイルとして保存されます。',
  'help.guide.export-packing-list.step.3':
    '「印刷または PDF として保存」をクリックします。プレビューにはリストが1ページで表示されます。上部に旅行名、日程、詰め終わった量、その下にリストごとのカードが並び、各アイテムにはチェック欄が付きます。',
  'help.guide.export-packing-list.step.4':
    'プレビューの下にある「印刷または PDF として保存」をクリックします。ブラウザーの印刷ダイアログが開くので、プリンターを選ぶか、ファイルに保存するなら「PDFとして保存」を選びます。',
  'help.guide.export-packing-list.result':
    '印刷物とファイルには、開いている表示（「共有」または「マイリスト」）が、数量、重さ、チェックとともに含まれます。',
  'help.guide.export-packing-list.tip.1':
    'CSV は「インポート」で読み込める形式で、バッグの情報も含まれます。そのため、自分用の持ち物テンプレートとして使えます。次の旅行にインポートしてください。',
  'help.guide.export-packing-list.tip.2':
    'Markdownファイルは、Obsidian、Notion、GitHubでチェックリストとして開けます。「インポート」で取り込み直すこともできます。',
  // share-packing-item
  'help.guide.share-packing-item.title': 'アイテムを見る人と持っていく人を決める',
  'help.guide.share-packing-item.goal':
    'アイテムを、グループの共有リスト、自分のリスト、持っていってあげる相手の間で移動します。',
  'help.guide.share-packing-item.step.1':
    'リストの上にある「共有」は全員が見るリスト、「マイリスト」は自分だけのリストです。それぞれにアイテムの数が表示されます。「マイリスト」をクリックすると自分のリストが表示されます。',
  'help.guide.share-packing-item.step.2': '「共有」に戻り、行の末尾の三点メニューを開いて「共有」をクリックします。',
  'help.guide.share-packing-item.step.3':
    '共有範囲は3段階です。グループ全員が見られる「共有」、自分だけが見られる「個人」、アイテムの対象者を選ぶ「共有する相手…」です。',
  'help.guide.share-packing-item.step.4':
    '「個人」のアイテムは「マイリスト」にしかありません。「マイリスト」に切り替えて探してください。',
  'help.guide.share-packing-item.step.5':
    'もう一度「共有」を開き、「共有する相手…」で名前にチェックを入れます。アイテムがその人のリストにも表示され、行に共有している人数の小さなバッジが付きます。',
  'help.guide.share-packing-item.result': 'アイテムが選んだ範囲に入り、行に持っていく人が表示されます。',
  'help.guide.share-packing-item.tip.1':
    'アイテムの共有を変更できるのは、そのアイテムを持っていく人だけです。共有された人の「マイリスト」には、小さな手のバッジ付きで表示され、カーソルを合わせるとあなたの名前が表示されます。共有された人もチェックを付けられます。',
  'help.guide.share-packing-item.tip.2':
    'ほかの人が持っていく共有アイテムでは、三点メニューに「共有」の代わりに2つの項目が表示されます。「私も持っていけます」を選ぶとその人の隣に自分が追加され、「マイリストにコピー」を選ぶと自分用の非公開のコピーが作られます。',
  'help.guide.share-packing-item.tip.3':
    '新しいアイテムの共有設定は、追加したときの表示で決まります。「共有」で追加したアイテムは全員と共有されます。「マイリスト」で追加したアイテムは「個人」になります。ただし、そのリストのアイテムがすべて同じ人たちと共有されている場合は、新しいアイテムもその人たちと共有されます。',
  // packing-bags
  'help.guide.packing-bags.title': 'バッグの重さを量る',
  'help.guide.packing-bags.goal':
    'すべてのアイテムに重さを入力し、バッグに振り分けて、各バッグを航空会社の制限内に収めます。',
  'help.guide.packing-bags.step.1': '丸の前にある重さのバッジをクリックし、アイテムの重さをグラムで入力します。',
  'help.guide.packing-bags.step.2': '重さの後ろの丸がアイテムのバッグです。クリックします。',
  'help.guide.packing-bags.step.3':
    'まだバッグがない場合は、「バッグを追加」をクリックし、名前を入力してEnterキーを押します。バッグが作成され、アイテムがそのバッグに入ります。',
  'help.guide.packing-bags.step.4':
    'バッグを1つ作ると、リストの右に「バッグ」カードが表示されます。バッグごとに、名前、持つ人、容量のバー、入っているアイテム数、重さが表示されます。バッグの下には「未割り当て」と「総重量」、その下に「梱包済み」（梱包済みの重さと、その割合を示す細いバー）が表示されます。',
  'help.guide.packing-bags.step.5':
    'バッグの重さの横にある「制限を設定」をクリックし、航空会社の表記と同じようにキログラムで上限を入力します。',
  'help.guide.packing-bags.step.6':
    'バッグ名の行の端、×の手前にある破線のプラスで「メンバーを割り当て」が開きます。バッグを持つメンバーにチェックを入れると、プラスの横に表示されます。カード下部の「1人あたり」に、各メンバーが持つものが一覧されます。',
  'help.guide.packing-bags.result':
    '右の「バッグ」カードに、各バッグの重さと上限、どのバッグにも入っていないもの、各メンバーが持つもの、合計とそのうち準備済みの量が表示されます。',
  'help.guide.packing-bags.tip.1':
    '重さの欄、バッグの丸いアイコン、「バッグ」カードは、管理者が「リスト」アドオンで「バッグ管理」をオンにしているときだけ表示されます。ウィンドウの幅が狭いときは、代わりに進捗カードの上にある「バッグ」ボタンからバッグを開きます。',
  'help.guide.packing-bags.tip.2':
    'バッグの重さは、あなたに見えないものも含めた全メンバーのアイテムからサーバーが計算します。そのため、表示される数字はバッグの実際の重さです。',
  'help.guide.packing-bags.tip.3':
    '制限のないバッグは、一番重いバッグと比べて表示されるので、バー同士を比べられます。バッグに制限を設定すると、バーはその制限を基準に表示されます。',
  // create-todo
  'help.guide.create-todo.title': 'タスクを追加する',
  'help.guide.create-todo.goal': 'タスクを、リスト、優先度、日付、担当者付きで登録します。',
  'help.guide.create-todo.step.1': 'バーの右端にある「新しいタスクを追加...」をクリックします。',
  'help.guide.create-todo.step.2':
    '「新しいタスク」のダイアログが開き、上部にカーソルがあります。「タスク名」に名前を入力し、メモしておきたいことは「説明」に入力します。',
  'help.guide.create-todo.step.3':
    '「リスト」でタスクをグループ分けします。既存のリストを選ぶか、隣のプラスをクリックして、小さなダイアログで新しいリストの名前を付けます。',
  'help.guide.create-todo.step.4':
    '「優先度」には「なし」「P1」「P2」「P3」の4つのボタンがあり、色は赤から青へ変わります。',
  'help.guide.create-todo.step.5': '「リスト」の隣の「期限」でカレンダーが開き、「担当者」でタスクを人に割り当てます。',
  'help.guide.create-todo.step.6': '「タスクを作成」をクリックします。',
  'help.guide.create-todo.result':
    'タスクが一覧に追加され、優先度、期限、リストのバッジと、行の右端に担当者のアバターが表示されます。右のペインでタスクが開きます。',
  'help.guide.create-todo.tip.1': '必須なのは名前だけです。ほかの項目は、あとで右のペインから入力できます。',
  'help.guide.create-todo.tip.2': 'サイドバーでリストを選んでいると、新しいタスクはそのリストに追加されます。',
  'help.guide.create-todo.tip.3': '名前の欄で Enter を押すと、ほかの欄を入力しなくてもすぐにタスクが作成されます。',
  // todo-filters
  'help.guide.todo-filters.title': 'タスクを探して変更する',
  'help.guide.todo-filters.goal': '今必要なタスクだけを表示し、見つけたタスクを編集します。',
  'help.guide.todo-filters.step.1':
    'サイドバーの「タスク」：「すべて」には未完了のタスクすべて、「自分のタスク」には自分に割り当てられたタスク、「期限切れ」には期限を過ぎたタスク、「完了」には完了したタスクが表示されます。それぞれに件数が表示されます。「期限切れ」をクリックします。',
  'help.guide.todo-filters.step.2':
    '「リスト」には、リストごとの行があります。1つ選ぶと、そのリストが完了したタスクも含めて表示されます。',
  'help.guide.todo-filters.step.3':
    '一覧の上部の並べ替えで、表示中のタスクの順番を変えます。「優先度」ではP1が先頭に、「期限」では期限が近いものが先頭になります。同時に使えるのはどちらか1つで、もう一度クリックすると自分で並べた順に戻ります。',
  'help.guide.todo-filters.step.4': 'タスクをクリックすると、右のペインで開きます。',
  'help.guide.todo-filters.step.5':
    '名前、「優先度」「リスト」「期限」「担当者」など、必要な項目を変更します。「説明」にはリンクが使えるテキストが表示され、クリックすると編集できます。最後にペイン下部の「変更を保存」をクリックします。ペインのヘッダーのボックスでタスクを完了にでき、「変更を保存」の横の「削除」でタスクがすぐに削除されます。',
  'help.guide.todo-filters.result':
    '一覧には条件に合うタスクだけが表示され、右側のパネルで選んだタスクを編集できます。',
  'help.guide.todo-filters.tip.1':
    'リストの行に表示される数は未完了のタスクだけですが、リストを選ぶと完了済みのタスクも表示されます。「すべて」「自分のタスク」「期限切れ」では完了済みのタスクが非表示になり、「完了」では完了済みのタスクだけが表示されます。',
  'help.guide.todo-filters.tip.2':
    '並べ替えの「優先度」と「期限」は同時に使えません。どちらかがオンの間は、行をドラッグして自分で並べ替えることはできません。',

  // ── Screen: trip-bookings ─────────────────────────────────────────────────────────────
  'help.ctx.trip-bookings.title': '予約',
  'help.ctx.trip-bookings.summary':
    'このタブには、移動以外の旅行の予約がすべて入ります。宿泊、レストランの予約、チケット、ツアー、駐車場などです。予約はそれぞれカード、リストの行、タイムラインのバーで表示され、予約コード、書類、同行者、費用が含まれます。予約をクリックすると詳細が開きます。',
  'help.ctx.trip-bookings.bullet.1':
    'バーの右端の「手動予約」で「新しい予約」が開きます。作成できる予約は「宿泊」「レストラン」「イベント」「ツアー」「駐車場」「その他」の6種類です。飛行機、電車などの移動は「移動」タブにあり、ここには表示されません。',
  'help.ctx.trip-bookings.bullet.2':
    '「手動予約」の前にあるダウンロードアイコン「予約確認書のインポート」で確認書をアップロードすると、TREKが自動で読み取ります。対応形式はEML、PDF、PKPass、HTML、TXTで、1ファイル10 MBまで、最大5ファイルです。AIモデルが画像を読める場合は写真も使えます。このアイコンは、サーバーが読み取りに対応している場合だけ表示されます。',
  'help.ctx.trip-bookings.bullet.3':
    '「検索」では、タイトル、タイプ、場所、メモ、予約コード、同行者を検索できます。隣の漏斗アイコン「フィルター」では、「ステータス」、件数付きの「タイプ」、そして予約に人が指定されていれば「同行者」でタブを絞り込めます。漏斗アイコンの数字は、有効なフィルターの数です。',
  'help.ctx.trip-bookings.bullet.4':
    '「フィルター」の後ろの3つのアイコンで、表示を「カード」「リスト」「タイムライン」に切り替えます。その横のスライダー「表示オプション」で、カードとリストのグループ化と並べ替え、またはタイムラインのレーンを設定します。さらに後ろの表計算アイコン「表計算ファイルとして書き出し (CSV)」で、タブに表示中の内容をファイルでダウンロードします。初期設定では、カードは「確定」と「保留」に、リストは日ごとに分かれます。セクションの見出しをクリックすると折りたためます。',
  'help.ctx.trip-bookings.bullet.5':
    'カードのヘッダーはステータスに応じた色で、ステータスの点（クリックで「保留」と「確定」を切り替え）、タイプ、タイトル、鉛筆アイコン、ゴミ箱アイコンがあります。その下に、予約に登録されている詳細が表示されます。「日付」「時刻」「予約コード」「チェックイン」「チェックアウト」「場所／住所」「宿泊」「リンク先」（予定の中の立ち寄り先）、「リンク」「ノート」「同行者」「ファイル」、リンクされた費用です。',
  'help.ctx.trip-bookings.bullet.6':
    'カード、行、バーをクリックすると予約の詳細が開き、下部に「地図上」（予約に場所がある場合）、ゴミ箱、「編集」があります。削除時には一度だけ「予約を削除しますか？」と確認され、費用も一緒に削除される場合はその旨が表示されます。削除すると、予約と紐づく支出が削除され、宿泊の場合はその宿泊も日程から削除されます。',
  // booking-views
  'help.guide.booking-views.title': '表示を切り替えて予約を開く',
  'help.guide.booking-views.goal': '予約をカード、リスト、タイムラインで表示し、1件を開いてすべての詳細を確認します。',
  'help.guide.booking-views.step.1':
    'バーの「フィルター」の後ろにある3つのアイコンが表示の切り替えで、カーソルを合わせると名前が表示されます：「カード」「リスト」「タイムライン」。タブは「カード」で開き、予約ごとのカードが「確定」と「保留」のセクションに並びます。真ん中の「リスト」をクリックします。',
  'help.guide.booking-views.step.2':
    '「リスト」では、日ごとの見出しの下に予約が1行ずつ並び、右側に日と時刻が表示されます。矢印キーで行を移動できます。3つのうち最後の「タイムライン」をクリックします。',
  'help.guide.booking-views.step.3':
    '「タイムライン」では、予約が旅行の日に沿って表示されます。タイプごとに1本のレーンがあり、各予約が開始から終了までのバーで表示されます。保留中の予約は破線の枠です。「旅行」で旅行全体を画面の幅に収めます。日の見出しをクリックすると、その日を時間単位で表示します。',
  'help.guide.booking-views.step.4':
    '「日」では、1日を時間軸で表示し、バーの長さで時間がわかります。日の名前の横の矢印で前の日と次の日に移動します。旅行中は「今日」で今日に移動でき、右側の「旅行」と「日」の切り替えで旅行全体に戻ります。',
  'help.guide.booking-views.step.5':
    'バーにカーソルを合わせると、日、時刻、場所が表示されます。クリックすると予約の詳細が開きます。「カード」のカードや「リスト」の行からも、同じポップアップが開きます。',
  'help.guide.booking-views.step.6':
    '詳細画面のヘッダーには、タイトルと、ステータス（クリックで切り替え）、タイプ、日、予約コードのラベルが表示されます。予約コードにはコピー用のボタンがあります。その下に時刻のタイル、さらに場所、同行者、メモ、費用、ファイルのうち予約にあるものが表示され、一番下に「地図上」、ゴミ箱アイコン、「編集」があります。',
  'help.guide.booking-views.result':
    '予約の詳細画面が開きます。「編集」でフォームが開き、「地図上」で予定上の位置を表示し、「閉じる」か Esc で元の表示に戻ります。',
  'help.guide.booking-views.tip.1':
    '表示アイコンの後ろにあるスライダーアイコンの「表示オプション」で、「カード」と「リスト」を「グループ化」と「並べ替え」でまとめたり並べ替えたりできます。「タイムライン」では「種類ごとに1レーン」と「もう一方のタブも表示」を選べます。「もう一方のタブも表示」をオンにすると、「移動」タブの項目が上部の細いレーンに薄く表示されます。「表示をリセット」でデフォルトに戻ります。表示の設定は、タブごとにこのブラウザーに保存されます。',
  'help.guide.booking-views.tip.2':
    '旅行の前や後の予約、日付のない予約は、タイムラインには表示できません。グラフの下に、「旅行前」「旅行後」「日付なし」の小さなカードで表示されます。',
  'help.guide.booking-views.tip.3':
    '予約の詳細は、「移動」タブ、日程、日の詳細、場所の詳細など、予約が表示されるどこからでも同じように開きます。タイトルをクリックすると、予約の名前を変えられます。',
  // create-booking
  'help.guide.create-booking.title': '予約を作成する',
  'help.guide.create-booking.goal': 'レストラン、イベント、ツアー、駐車場など、何でも手動で旅行に追加します。',
  'help.guide.create-booking.step.1':
    'バーの右端にある「手動予約」をクリックします。「新しい予約」が開き、上部のヘッダーにタイトルと2つのラベルが表示されます。',
  'help.guide.create-booking.step.2':
    '上部の帯にあるタイプのラベル（新しい予約では「その他」）をクリックし、「予約タイプ」を選びます。このタブで作れるのは「宿泊」「レストラン」「イベント」「ツアー」「駐車場」「その他」の6種類です。選んだタイプに応じてフォームが変わります。日付ではなく日の範囲を使うのは「宿泊」だけです。',
  'help.guide.create-booking.step.3':
    '上部の帯の、ラベルの上にある欄にタイトルを入力します。必須の項目はこれだけで、何か入力するまで「追加」はグレーのままです。',
  'help.guide.create-booking.step.4':
    '「日付」と「開始時刻」を設定します。予約に終了がある場合は、「終了日」と「終了時刻」も設定します。カレンダーで選べるのは旅行期間中の日だけです。終了日時が開始より後でない場合は赤く表示され、「追加」できません。終了日がなく終了時刻が開始時刻より前の場合は、警告が表示されるだけです。予約が翌日に終わるなら、終了日を設定してください。',
  'help.guide.create-booking.step.5':
    '確認書の「予約コード」を入力し、ヘッダーのタイプの横にあるステータスのピルをクリックします。新しい予約では「保留」と表示されており、クリックすると「確定」に変わります。ステータスによって、カードが表示されるセクションが決まります。',
  'help.guide.create-booking.step.6': 'フォーム下部の「追加」をクリックします。',
  'help.guide.create-booking.result':
    '予約がそのセクションにカードで表示されます。ヘッダーの色でステータスがわかり、カードにはタイプ、日付と時刻、コードが表示されます。旅行のほかのメンバーにもすぐに表示されます。',
  'help.guide.create-booking.tip.1':
    '「場所／住所」では、入力中に実在の住所が候補として表示されます。候補を選ぶと入力した内容が置き換わります。自分で入力した住所はそのまま残ります。',
  'help.guide.create-booking.tip.2':
    '「リンク」には、予約サイトにあるその予約のページを入力します。カードと詳細画面に、新しいタブで開くリンクとして表示されます。',
  'help.guide.create-booking.tip.3':
    'メモには Markdown が使えるので、リストや太字の行は、カードと詳細画面でもリストや太字で表示されます。',
  // booking-hotel
  'help.guide.booking-hotel.title': '宿泊先を予約する',
  'help.guide.booking-hotel.goal': '宿泊先を入力して、予約としても日程の宿泊としても同時に扱われるようにします。',
  'help.guide.booking-hotel.step.1':
    '「手動予約」をクリックし、上部の帯のタイプのピルで「宿泊」を選びます。日付の欄が、ホテル用の入力欄に変わります。',
  'help.guide.booking-hotel.step.2':
    '「宿泊」でホテルを選びます。一覧には旅行の場所が並び、インポートしたトラックとツアーは含まれません。選ぶと、タイトルが空なら名前が、「場所／住所」には住所が入ります。',
  'help.guide.booking-hotel.step.3':
    '「開始」と「終了」で、最初の宿泊日と出発する朝を設定します。どちらも旅行の日を日付付きで選べ、「終了」は常に「開始」より後になります。',
  'help.guide.booking-hotel.step.4':
    '「チェックイン」「チェックイン期限」「チェックアウト」と、予約確認書にある「予約コード」を入力します。',
  'help.guide.booking-hotel.step.5': '「追加」をクリックします。',
  'help.guide.booking-hotel.result':
    'カードの「日付」に宿泊する日の範囲が表示され、チェックインとチェックアウトの時刻、住所も表示されます。宿泊は、予定のその日にも表示されるようになります。',
  'help.guide.booking-hotel.tip.1':
    '「日付」と「開始時刻」がないのは「宿泊」だけです。宿泊の日付は「開始」と「終了」で、カレンダーの日付ではなく、旅行の日から選びます。',
  'help.guide.booking-hotel.tip.2':
    '「宿泊」を空欄にして、代わりに住所を入力することもできます。その場所が検索・作成され、地図にピンが立ちます。',
  'help.guide.booking-hotel.tip.3': '予約を削除すると、その宿泊も日程から削除されます。',
  // link-booking
  'help.guide.link-booking.title': '予約を計画にリンクする',
  'help.guide.link-booking.goal': '予約を立ち寄り先と場所にリンクして、必要な場所に表示されるようにします。',
  'help.guide.link-booking.step.1':
    'リンクしたいカードにカーソルを合わせ、ヘッダーの鉛筆アイコンをクリックします。「予約を編集」が開きます。',
  'help.guide.link-booking.step.2':
    '「日への割り当てにリンク」を開きます。一覧には予定が表示されます。日ごとの見出しの下に、その日の立ち寄り先が番号と時刻付きで並びます。予約に対応する立ち寄り先を選びます。',
  'help.guide.link-booking.step.3':
    '「場所 / アクティビティ」では、場所そのものをリンクします。ここで場所を選ぶと、タイトルと「場所／住所」が空欄なら自動で入力されます。',
  'help.guide.link-booking.step.4': '「更新」をクリックします。',
  'help.guide.link-booking.result':
    'カードの「リンク先」に日と立ち寄り先が表示され、日程ではその立ち寄り先に予約が表示されます。',
  'help.guide.link-booking.tip.1':
    '一覧の先頭の「リンクなし（単独）」でリンクを外せます。宿泊には立ち寄り先の選択はなく、宿泊する夜でリンクされます。',
  'help.guide.link-booking.tip.2':
    '日付のある日の立ち寄り先を選ぶと、空欄の「日付」が自動で入力されます。すでに設定済みの日付は変わりません。',
  // booking-travelers
  'help.guide.booking-travelers.title': '予約の対象者を設定する',
  'help.guide.booking-travelers.goal': '予約の対象になる旅行者を指定し、その人の予約だけを表示します。',
  'help.guide.booking-travelers.step.1':
    'カードの鉛筆アイコンで予約を開きます。「同行者」は「予約コード」の隣にあります。予約に誰も割り当てられていない間は「同行者を割り当て」と表示されます。',
  'help.guide.booking-travelers.step.2':
    'クリックして、この予約の対象の人を選びます。名前を登録したゲストも一覧にあります。選んだ人にはチェックが付き、欄にアバターが表示されます。もう一度名前をクリックすると外れます。',
  'help.guide.booking-travelers.step.3': '「更新」をクリックします。',
  'help.guide.booking-travelers.step.4':
    'バーの「フィルター」をクリックし、「同行者」で人をクリックすると、その人の予約だけが表示されます。複数の人を同時に選べます。',
  'help.guide.booking-travelers.result':
    'カードに対象の人が表示されます。「フィルター」で、選んだ人の予約だけにタブを絞り込めます。',
  'help.guide.booking-travelers.tip.1':
    'カードと詳細画面では同行者は表示されるだけで、変更はできません。設定はこのフォームで行います。',
  'help.guide.booking-travelers.tip.2':
    '「フィルター」の「同行者」は、旅行のメンバーが2人以上いて、少なくとも1件の予約に誰かが指定されているときに表示されます。選んだ内容は、ブラウザーのタブを閉じるまで保持されます。',
  // booking-files
  'help.guide.booking-files.title': '予約確認書を予約と一緒に保管する',
  'help.guide.booking-files.goal': '確認書、チケット、パスを、関係する予約に添付します。',
  'help.guide.booking-files.step.1':
    'カードの鉛筆アイコンで予約を開きます。「リンク」の横に「ファイル」があるので、そこで「ファイルを添付」をクリックします。既存の予約では書類がすぐにアップロードされ、「ファイルをアップロードしました」と表示されます。',
  'help.guide.booking-files.step.2': '書類が名前で一覧され、開くボタンと横に×が表示されます。',
  'help.guide.booking-files.step.3':
    '「既存ファイルをリンク」では、まだこの予約に添付されていない旅行の書類が表示されます。選ぶだけで、アップロードし直さずに添付できます。',
  'help.guide.booking-files.step.4': '「更新」をクリックします。',
  'help.guide.booking-files.result':
    'カードと詳細表示の「ファイル」にドキュメントが並びます。ドキュメントをクリックすると開きます。詳細表示で一覧の上にある「ファイルで表示」を押すと、「ファイル」タブに移動します。',
  'help.guide.booking-files.tip.1':
    '作成中の予約では、「追加」をクリックした時点で書類がアップロードされます。アップロードには接続が必要です。',
  'help.guide.booking-files.tip.2':
    '書類の横の X で外れるのはリンクだけで、書類そのものは削除されません。書類は旅行の「ファイル」タブに残ります。',
  'help.guide.booking-files.tip.3':
    '添付できるファイルの種類は、管理者が「許可するファイル形式」で設定します。デフォルトでは、書類、テキスト、画像が添付できます。',
  // booking-cost
  'help.guide.booking-cost.title': '予約の料金を費用にする',
  'help.guide.booking-cost.goal': '予約の費用を「費用」に追加し、支払う人で分けます。',
  'help.guide.booking-cost.step.1':
    'カードの鉛筆アイコンで予約を開き、フォームのいちばん下に移動します。「費用」に「支出を作成」と「既存の支出をリンク」があり、「予約を保存してから費用エディターを開きます」というメモがあります。',
  'help.guide.booking-cost.step.2':
    '「支出を作成」をクリックします。予約が保存されてフォームが閉じ、「費用」のエディターが「支出を追加」として開きます。',
  'help.guide.booking-cost.step.3':
    'ヘッダーの名前には予約のタイトルが、「日付」には予約の日がすでに入っています。「合計金額」を入力し、横の「通貨」を確認します。',
  'help.guide.booking-cost.step.4':
    'ヘッダーのラベルが「カテゴリ」で、予約のタイプに合ったカテゴリがすでに設定されています。「誰が支払いましたか？」で支払った人を選び、「分け方」で金額の分け方を選びます。',
  'help.guide.booking-cost.step.5': '「支出を追加」をクリックします。',
  'help.guide.booking-cost.result':
    'カードの一番下に金額が表示され、予約のフォームでは「リンク済みの支出」に支出が表示されます。同じ支出が「費用」タブにも、この予約にリンクされた状態で表示されます。',
  'help.guide.booking-cost.tip.1':
    'カテゴリはタイプで決まります。「レストラン」は「飲食」、「宿泊」は「宿泊」、「駐車場」は「駐車場」、「イベント」と「ツアー」は「その他」になります。',
  'help.guide.booking-cost.tip.2':
    '1つの予約に複数の支出を付けられます。「既存の支出をリンク」では、「費用」にあるまだ何にもリンクしていない支出から選べます。リンク済みの支出では、「リンクを解除し、支出は残す」でリンクだけを外して「費用」に残し、ゴミ箱アイコンで支出を削除します。',
  'help.guide.booking-cost.tip.3':
    'フォームに「費用」が表示されるのは「費用」アドオンがオンの場合だけです。アドオンは管理者が「アドオン」で切り替えます。',
  // filter-bookings
  'help.guide.filter-bookings.title': '予約を探す',
  'help.guide.filter-bookings.goal': '長いタブを、キーワード、ステータス、タイプ、人で絞り込みます。',
  'help.guide.filter-bookings.step.1':
    'バーの「検索」に入力します。タイトル、タイプ、場所と住所、メモ、予約コード、同行者の名前が検索され、入力するにつれてタブの結果が絞り込まれます。Esc で入力欄が空になります。',
  'help.guide.filter-bookings.step.2':
    '検索の隣にある漏斗アイコン「フィルター」をクリックします。パネルには「ステータス」「タイプ」と、予約に人が割り当てられていれば「同行者」があります。',
  'help.guide.filter-bookings.step.3':
    '「ステータス」で「確定」か「保留」を選ぶと、そのステータスの予約だけが表示されます。「すべて」で両方が表示されます。',
  'help.guide.filter-bookings.step.4':
    '「タイプ」で1つ以上のタイプをクリックすると、そのタイプだけが表示されます。各タイプに予約の件数が表示され、選んだタイプにはチェックが付きます。',
  'help.guide.filter-bookings.step.5':
    '「フィルター」の数字は有効なフィルターの数で、検索の横のチップには、全予約のうち表示されている数が表示されます。チップかパネル下部の「フィルターをリセット」をクリックすると、すべてがまた表示されます。',
  'help.guide.filter-bookings.result':
    'タブには選んだものだけが表示されます。「カード」「リスト」「タイムライン」のどれでも同じです。フィルターは、ブラウザーのタブを閉じるまでこの旅行で保持されます。',
  'help.guide.filter-bookings.tip.1':
    '「タイプ」はタブに2種類以上のタイプがあるときだけ表示され、タブにあるタイプだけが選べます。たとえばツアーがないタブでは、「タイプ」に「ツアー」はありません。',
  'help.guide.filter-bookings.tip.2':
    'フィルターに一致するものがないと、タブに「このフィルターに一致するものはありません」と表示され、すぐ下に「フィルターをリセット」があります。',
  // import-booking-file
  'help.guide.import-booking-file.title': '予約確認書から予約をインポートする',
  'help.guide.import-booking-file.goal':
    '予約サイトから届いたメールやPDFから、TREKに予約を読み取らせて、入力し直す手間を省きます。',
  'help.guide.import-booking-file.step.1':
    'バーのダウンロードアイコン「予約確認書のインポート」をクリックします。名前はカーソルを合わせると表示されます。同じ名前のダイアログが開きます。',
  'help.guide.import-booking-file.step.2':
    '確認書をボックスにドロップするか、ボックスをクリックしてファイルを選びます。対応形式はEML、PDF、PKPass、HTML、TXTで、1ファイル10 MBまで、最大5ファイルです。AIモデルが画像を読める場合は、写真（JPG、PNG、WEBP）も使えます。選んだファイル名がボックスに表示されます。',
  'help.guide.import-booking-file.step.3':
    '「インポート」をクリックします。読み取りはバックグラウンドで行われるので、ダイアログはすぐに閉じます。',
  'help.guide.import-booking-file.step.4':
    '右下のカードに、ファイル名と進行状況が表示されます。アプリ内を移動しても、再読み込みしても表示されたままです。読み取りが終わると「ファイルを解析中…」がチェックマークに変わり、カードに「インポート」が表示されます。それをクリックします。',
  'help.guide.import-booking-file.step.5':
    '見つかった予約が、内容の入った状態で1件ずつ「新しい予約」に開きます。ホテルの場合は、タイトルにホテル名、旅行にその場所があれば「宿泊」にその場所、さらに「場所／住所」、宿泊日の「開始」と「終了」、「チェックイン」と「チェックアウト」、「予約コード」、「ファイル」に予約確認書、「費用」がオンなら「リンク済みの支出」に料金が入ります。内容を確認して「追加」をクリックします。',
  'help.guide.import-booking-file.result':
    '予約が「保留」にカードとして表示され、宿泊日、コード、「ファイル」の予約確認書が付きます。宿泊は予定のその日に表示されます。「費用」がオンなら、料金が予約にリンクされた支出として追加されます。',
  'help.guide.import-booking-file.tip.1':
    'インポートのアイコンは、サーバーが予約確認書を読み取れるときだけ表示されます。そのためには、抽出ツールか「AI 解析」アドオンのどちらかが必要です。「AI 解析」アドオンは、管理者が「アドオン」でオンにします。予約が1件もないタブでは、「ファイルからインポート」ボタンとしても表示されます。',
  'help.guide.import-booking-file.tip.2':
    '何も読み取れなかった場合は、カードにその旨が表示されます。「AI 解析」がオンなら「AI で読み取る」が表示され、同じファイルを直接モデルに送ります。読み取った結果は10分間保持されるので、その間に確認を始めてください。',
  'help.guide.import-booking-file.tip.3':
    '確認書が添付されるのは、その形式が管理者の設定の「許可するファイル形式」に含まれている場合だけです。PDFは初期設定で許可されていますが、メール（EML）は先に追加する必要があります。追加しないと、確認書なしで予約が保存されます。',
  // edit-booking
  'help.guide.edit-booking.title': '予約を変更する',
  'help.guide.edit-booking.goal':
    '時刻を直したり、あとから届いたコードを追加したり、予約を「保留」から「確定」に変えたりします。',
  'help.guide.edit-booking.step.1':
    'カードにカーソルを合わせ、ヘッダーの鉛筆アイコンをクリックします。予約のすべての詳細が入った状態で「予約を編集」が開きます。',
  'help.guide.edit-booking.step.2':
    '変更が必要な箇所を直します。たとえば、あとから業者が送ってきた「予約コード」です。',
  'help.guide.edit-booking.step.3':
    '上部の帯にある「保留」のラベルをクリックします。「確定」に変わり、帯が緑になります。',
  'help.guide.edit-booking.step.4': '「更新」をクリックします。',
  'help.guide.edit-booking.result':
    'カードが移動します。確定した予約は緑の点と緑の上部の帯付きで「確定」セクションに表示され、旅行のメンバー全員にその変化が見えます。',
  'help.guide.edit-booking.tip.1':
    '「予約コード」が読めない場合は、「設定」の「表示」で「予約コードをぼかす」がオンになっています。コードにカーソルを合わせるかクリックすると読めます。',
  'help.guide.edit-booking.tip.2':
    'タイプを変えると、リンクされた支出のカテゴリも一緒に変わります。ただし、「費用」のエディターでカテゴリを手動で選んでいた場合は変わりません。',
  'help.guide.edit-booking.tip.3':
    '予約の詳細画面の一番下にある「編集」でも、同じフォームが開きます。ステータスはフォームを開かなくても切り替えられます。カードや行の点、または詳細画面のステータスのラベルをクリックします。',
  // delete-booking
  'help.guide.delete-booking.title': '予約を削除する',
  'help.guide.delete-booking.goal': 'キャンセルになった予約を旅行から削除します。',
  'help.guide.delete-booking.step.1':
    'カードにカーソルを合わせ、ヘッダーのゴミ箱アイコンをクリックします。予約の詳細の下部にあるゴミ箱アイコンでも同じです。',
  'help.guide.delete-booking.step.2':
    '「予約を削除しますか？」に、選んだ予約の名前と、完全に削除されることが表示されます。費用が紐づいている場合は、費用も削除されることが表示されます。',
  'help.guide.delete-booking.step.3': '「削除」をクリックします。',
  'help.guide.delete-booking.result':
    '旅行のメンバー全員の画面からカードが削除されます。予約の削除は元に戻せないので、確認のメッセージがキャンセルできる最後の機会です。',
  'help.guide.delete-booking.tip.1':
    '予約を削除すると、リンクされた支出も削除されます。宿泊を削除すると、日程からその宿泊日も削除されます。',
  'help.guide.delete-booking.tip.2':
    '添付されていた書類は旅行の「ファイル」タブに残ります。削除されるのは予約とのリンクだけです。',

  // ── Screen: trip-costs ────────────────────────────────────────────────────────────────
  'help.ctx.trip-costs.title': '費用',
  'help.ctx.trip-costs.summary':
    '旅行のお金を管理します。すべての支出が日付順の台帳か表で表示され、誰が入力し誰が負担するかが、レシートの通貨のまま記録されます。右の列には、精算するために誰が誰にいくら払えばよいかが表示されます。',
  'help.ctx.trip-costs.bullet.1':
    '上部のバーに、旅行の日付と費用を分け合う同行者が表示されます。「支出を検索…」、「フィルター」（じょうごのアイコン）、「CSVを書き出し」（ダウンロードのアイコン）、「リスト」／「表」の切り替えもあります。',
  'help.ctx.trip-costs.bullet.2':
    'バーの右端には、未精算の送金をまとめて記録する「精算する」、「AI 解析」アドオンが画像を読める場合に写真から支出を入力する「レシートをスキャン」、エディターを開く「支出を追加」があります。',
  'help.ctx.trip-costs.bullet.3':
    'バーの下に4枚のカードがあります。「支払う額」と「受け取る額」は精算での自分の分、「未精算の金額」は記録済みでまだ支払者がいない金額、「旅行の合計支出」はすべての合計で、その下に「あなたの負担分」と「あなたが支払った額」が表示されます。',
  'help.ctx.trip-costs.bullet.4':
    '台帳は日ごとに新しい順でまとめられ、各日の見出しに件数とその日の支出額が表示されます。各行には、色のタブで示すカテゴリ、名前、支払者のチップと各自の支払額、その下に同行者ごとの負担額付きの「分け方」（支払い済みの人にはチェック）、メモと金額が表示されます。分け方によってほかの人に貸している場合は「貸し」、借りている場合は「借り」と表示されます。',
  'help.ctx.trip-costs.bullet.5':
    '右側の列に結果が表示されます。「精算する」には誰が誰に払うか、「残高」には旅行者ごとの過不足、「最終負担額」には1人ずつにかかる旅行の費用、「カテゴリ別」には何にお金を使ったかが表示されます。',
  'help.ctx.trip-costs.bullet.6':
    '記録した支払いは同じ台帳に専用の行として表示され、横に鉛筆アイコンと「元に戻す」があります。支出には鉛筆とゴミ箱のアイコンがあり、ゴミ箱は削除前に確認します。レシートのある支出には名前の横に「レシート」チップが付き、クリックするとレシートが開きます。',
  'help.ctx.trip-costs.bullet.7':
    'バーの「表」では、同じ支出がカテゴリ別にまとめた表として表示され、「人数」「日数」、1人あたりと1日あたりの金額がわかります。このとき「カテゴリ別」は「概要」に置き換わります。選んだ表示は「費用」に保存されます。',
  // add-expense
  'help.guide.add-expense.title': '支出を追加する',
  'help.guide.add-expense.goal': 'かかった金額、支払った人、一緒に負担する人を記録します。',
  'help.guide.add-expense.step.1':
    'バーの右端にある「支出を追加」をクリックします。今日の日付、支払者は自分、全員が分け方に入った状態でエディターが開きます。',
  'help.guide.add-expense.step.2':
    'ダイアログ上部の欄に、何の支出かを入力します。空欄のときは「例：夕食、お土産、ガソリン…」と表示されます。これが支出の名前で、名前がないと支出を保存できません。',
  'help.guide.add-expense.step.3':
    '名前の下にあるのが「カテゴリ」で、ほかを選ぶまでは「飲食」になっています。カテゴリは14種類で、変更はできません。選んだカテゴリの色に、ヘッダー、行のタブ、「カテゴリ別」のバーも変わります。',
  'help.guide.add-expense.step.4':
    'レシートの金額を「合計金額」に入力します。隣の「通貨」は、最初は「費用」の表示通貨になっています。変更すると、換算した金額がエディターに表示されます。「日」は最初は今日になっていて、一覧ではその日の下に支出がまとめられます。',
  'help.guide.add-expense.step.5':
    '「誰が支払いましたか？」で、実際に支払った人をクリックします。最初は「自分」が選ばれています。「まだ誰も支払っていません」を選ぶと、誰の負担にもせずに金額だけを記録します。見出しの横の切り替えで「複数人が支払い」を選ぶと、支払いを複数の人で分けられます。',
  'help.guide.add-expense.step.6':
    'その下の「分け方」は最初「均等」になっていて、全員にチェックが入り、名前の横にそれぞれの負担額が表示されます。そのままでも、変更してもかまいません。ダイアログ下部の「支出を追加」をクリックして保存します。',
  'help.guide.add-expense.result':
    '支出がその日の下の台帳に追加されて「旅行の合計支出」に加算され、精算の列で誰が誰にいくら払うかが計算し直されます。',
  'help.guide.add-expense.tip.1':
    '初期設定のままなら、支出は今日の日付、支払者は自分、全員で均等に分ける設定になります。入力が必要なのは名前と金額だけです。',
  'help.guide.add-expense.tip.2':
    '金額の横の±で、支出を払い戻しにできます。合計がマイナスの場合はお金が払い戻されたことになり、分け方も逆になります。',
  'help.guide.add-expense.tip.3':
    'ダイアログ下部の「レシート・請求書」の横にある「添付」で、画像とPDFを追加できます。保存時にアップロードされて旅行の「ファイル」に保存され、一覧の名前の横に「レシート」チップが付きます。',
  // expense-payers
  'help.guide.expense-payers.title': '支払った人を設定する',
  'help.guide.expense-payers.goal': '支出を誰が支払ったかを記録します。精算の計算に必要な、もう半分の情報です。',
  'help.guide.expense-payers.step.1':
    '行の横の鉛筆アイコンで支出を開き、「誰が支払いましたか？」を確認します。見出しの横の切り替えは、デフォルトで「1人が支払い」です。旅行者がそれぞれチップで表示され、枠の付いたチップが支払った人です。別のチップをクリックすると変更できます。',
  'help.guide.expense-payers.step.2':
    '旅行者の後ろにある破線のチップ「まだ誰も支払っていません」を選ぶと、誰にも負担を発生させずに金額だけを記録します。支出は引き続き「旅行の合計支出」に含まれます。',
  'help.guide.expense-payers.step.3':
    '同じ切り替えのもう一方の「複数人が支払い」では、同行者全員がチェックボックス付きで表示され、チェックした人ごとに金額の欄が表示されます。支払った人にチェックを入れて、それぞれの支払額を入力します。金額の合計は総額と一致する必要があります。',
  'help.guide.expense-payers.step.4':
    '誰も支払っていない支出は、行に「未完了」と表示され、「未精算の金額」カードに加算されます。このカードには、まだ支払者のいない支出が合計されます。',
  'help.guide.expense-payers.result':
    '支払った人で誰に払い戻されるかが決まり、分け方で誰が負担するかが決まります。「残高」はその2つの差です。',
  'help.guide.expense-payers.tip.1':
    '「誰が支払いましたか？」と「分け方」はそれぞれ独立しています。自分が参加していない夕食の代金を払うことも、自分が払っていない夕食の割り勘に入ることもできます。',
  'help.guide.expense-payers.tip.2':
    '支払った人が複数いる場合は、金額の合計が総額と一致する必要があります。支払った人をもう1人チェックすると、自分で入力していない金額に残りが分け直されます。金額が一致しない間は、合わせるべき合計がエディターに表示され、保存できません。',
  'help.guide.expense-payers.tip.3':
    '支出を「まだ誰も支払っていません」に戻しても、支出は削除されません。金額は「旅行の合計支出」に残り、行は「未完了」になります。',
  // split-expense
  'help.guide.split-expense.title': '旅行者で代金を分ける',
  'help.guide.split-expense.goal': '支出を誰が負担するかを、全員で均等に、金額で、またはレシートの項目ごとに決めます。',
  'help.guide.split-expense.step.1':
    '支出のエディターの「分け方」には、同行者全員がチェックボックス付きで表示されます。名前のチェックを外すと、その人はこの支出から外れます。名前がグレーになり、負担分がなくなって、この支出は負担しません。',
  'help.guide.split-expense.step.2':
    '見出しの横の切り替えにある「均等」が初期設定です。チェックを入れた同行者全員が同じ額を負担し、名前の横にその額が表示されます。一覧の下のバッジに、分ける人数と1人あたりの額が表示されます。',
  'help.guide.split-expense.step.3':
    '「カスタム」を選ぶと、割合の代わりに金額の入力欄が表示されます。旅行者ごとの負担額を入力してください。下のバッジは入力に合わせて更新され、合計と一致すると緑色の「分割は合計と一致しています」になります。金額が合計と一致しないうちは保存できません。',
  'help.guide.split-expense.step.4':
    '「レシート」では、レシートを1行ずつ分けます。「品目を追加」で行を足し、行ごとに名前と金額を入力して、「分割:」の横でその行を分け合う旅行者を選びます。',
  'help.guide.split-expense.step.5':
    '行の下の「一人あたりの負担」に旅行者ごとの最終的な負担額が、上部の「合計金額」に行の合計が表示されます。ダイアログ下部の「保存」をクリックします。',
  'help.guide.split-expense.result':
    '残高はすべて、この分け方から計算されます。分け方は支出と一緒に保存され、その行に「分け方」として同行者ごとの負担額付きで表示されます。あとから変えても、ほかには影響しません。',
  'help.guide.split-expense.tip.1':
    'チェックを外した旅行者は、この支出については何も負担しません。ほかの人がそれぞれの分を払います。',
  'help.guide.split-expense.tip.2':
    '「均等」は1セント単位まで正確に分けます。余った1セントは支出ごとに別の人に割り当てられるので、いつも同じ人が負担することはありません。',
  'help.guide.split-expense.tip.3':
    '「レシート」モードでは、「合計金額」が自動で計算され、欄はグレーになります。合計はレシートの各行の合計です。',
  'help.guide.split-expense.tip.4':
    'カスタムの分け方は割合でも入力できます。「負担の入力方法」を%に切り替えます。保存するには、割合の合計が100 %になる必要があります。',
  // expense-currency
  'help.guide.expense-currency.title': '別の通貨で支出を入力する',
  'help.guide.expense-currency.goal': 'レシートの金額をそのまま入力すると、TREK が為替レートを保存します。',
  'help.guide.expense-currency.step.1':
    '「支出を追加」を開きます。ダイアログ上部に名前を入力し、「合計金額」には換算した金額ではなく、レシートに書かれた金額をそのまま入力します。',
  'help.guide.expense-currency.step.2':
    '金額の隣の「通貨」を開き、レシートの通貨を選びます。一覧には TREK が対応しているすべての通貨コードがあり、3文字を入力して検索できます。',
  'help.guide.expense-currency.step.3':
    '入力欄の下にバッジが並び、入力した金額と現在の換算額が「リアルタイムレート」付きで表示されます。これはプレビューで、保存される値ではありません。',
  'help.guide.expense-currency.step.4':
    'ダイアログ下部の「支出を追加」をクリックします。レートはこの時点で固定され、この支出は入力した日の金額のまま変わりません。',
  'help.guide.expense-currency.step.5':
    '台帳では、行の名前の下に、入力した金額、矢印、旅行の通貨での金額の両方が表示されます。「費用」タブの合計、残高、精算はすべて、旅行の通貨での金額を使います。',
  'help.guide.expense-currency.result':
    '支出には入力した金額と通貨がそのまま残ります。帳簿には両方が表示され、旅行の合計と残高は旅行の通貨で計算されます。',
  'help.guide.expense-currency.tip.1':
    'レートは保存した時点で固定されるので、翌週に為替レートが変わっても、精算済みの貸し借りは変わりません。新しいレートが保存されるのは、支出の通貨を変更したときだけです。',
  'help.guide.expense-currency.tip.2':
    '「設定」の「表示通貨」で変わるのは金額の表示だけです。保存された金額は変わりません。空欄にすると、各旅行はその旅行の通貨で表示されます。',
  'help.guide.expense-currency.tip.3':
    '旅行の通貨は旅行そのものの設定で、「旅行を編集」で変更します。変更には「旅行詳細を編集」の権限が必要です。変更すると、固定されたすべてのレートが新しい通貨に合わせて再計算されます。金額そのものは換算されません。',
  // filter-costs
  'help.guide.filter-costs.title': '支出や1日の出費を探す',
  'help.guide.filter-costs.goal': '長い支出の一覧を絞り込み、探しているものだけを表示します。',
  'help.guide.filter-costs.step.1':
    'バーの「支出を検索…」に入力します。入力するそばから支出の名前で絞り込まれ、Escキーで消去できます。',
  'help.guide.filter-costs.step.2':
    '検索の隣にある漏斗アイコン「フィルター」でフィルターが開きます。上部の切り替えで、帳簿を自分の視点で表示できます。「すべて」、自分が払ったものを表示する「自分が支払った分」、自分の負担分より多く払った支出を表示する「受け取る分」です。',
  'help.guide.filter-costs.step.3':
    '「カテゴリ」で14のカテゴリから1つを選ぶと、そのカテゴリの支出だけが表示されます。漏斗アイコンには、有効なフィルターの数が表示されます。',
  'help.guide.filter-costs.step.4':
    '「日」で、支出のある日から1日を選びます。日の見出しの代わりにバナーが表示され、その日の日付、支出の件数、合計がわかります。',
  'help.guide.filter-costs.step.5':
    '漏斗アイコンの隣にあるダウンロードアイコンの「CSVを書き出し」で、すべての支出をファイルに保存できます。元の金額、その通貨、換算後の金額が含まれます。',
  'help.guide.filter-costs.result':
    'フィルターは組み合わせて使えます。日ごとのまとまりは、表示されている支出の合計に更新されます。',
  'help.guide.filter-costs.tip.1':
    '記録した支払いには名前もカテゴリもないため、検索やカテゴリのフィルター、「受け取る分」では非表示になります。日のフィルターでは、支払った日の下に表示されます。',
  'help.guide.filter-costs.tip.2':
    '「CSVを書き出し」では、画面で何を絞り込んでいても、常にすべての支出が1件1行で書き出されます。',
  'help.guide.filter-costs.tip.3':
    'フィルターを設定するとフィルターメニューの下部に表示される「フィルターをリセット」で、すべてのフィルターをまとめてオフにできます。',
  // settle-up
  'help.guide.settle-up.title': '誰が誰にいくら払うかを確認して精算する',
  'help.guide.settle-up.goal':
    'たくさんの共同の支出を、すべての貸し借りを清算できる最少の送金にまとめ、送金したら記録します。',
  'help.guide.settle-up.step.1':
    '右側の列の「精算する」カードには、すべての貸し借りを清算するための送金が一覧表示されます。誰が誰にいくら払うかが、2つのアバター（ツールチップに名前）と金額で示されます。ヘッダーの数字は、未精算の件数です。',
  'help.guide.settle-up.step.2':
    '送金の横の「精算」をクリックすると、送金済みとして記録されます。その送金はカードから消え、残高が更新されます。',
  'help.guide.settle-up.step.3':
    '記録した送金は、送金した日の下に台帳の行として追加され、「支払い」と2人の同行者、金額が表示されます。',
  'help.guide.settle-up.step.4':
    'その行の横の鉛筆アイコンで支払いを修正し、「元に戻す」で取り消します。取り消すと、その送金は「精算する」カードに戻ります。',
  'help.guide.settle-up.step.5':
    'カードのヘッダーの「支払いを追加」では、提案に従わなかった送金を記録できます。「支払元」と支払先、金額、通貨、支払った日を選び、必要なら支払い方法などを「メモ」に入力して、ダイアログ下部の「支払いを追加」をクリックします。',
  'help.guide.settle-up.step.6':
    '上部のバーの「精算する」では、確認なしで未精算の送金をまとめて記録します。旅行の最後にグループで全員分を精算するときなどに使います。',
  'help.guide.settle-up.result':
    '記録した送金はすべて帳簿の1行になり、「精算する」カードから1行ずつ消えます。カードに「全員が清算済みです」と表示されれば、旅行の支払いはすべて完了です。',
  'help.guide.settle-up.tip.1':
    'カードに表示されるのは、すべての貸し借りではなく最少の送金です。3人がお互いに貸し借りしている場合でも、1回か2回の支払いにまとまります。',
  'help.guide.settle-up.tip.2':
    '「精算」は送金を記録するだけで、お金は送られません。いつもの方法で支払ってから、「精算」をクリックしてください。',
  'help.guide.settle-up.tip.3':
    '支払いはどの通貨でもできるので、円の借りをユーロで返すこともよくあります。ダイアログには専用の通貨の選択欄があり、そのレートも固定されます。',
  // final-budget
  'help.guide.final-budget.title': '同行者ごとの旅行の費用を確認する',
  'help.guide.final-budget.goal': '1人ごとの数字（現在の残高と、1人あたりの実際の費用）を確認します。',
  'help.guide.final-budget.step.1':
    '「残高」に同行者ごとの状況が表示されます。受け取る側なら右に緑のバー、支払う側なら左に赤のバーが表示され、名前の横に金額が表示されます。',
  'help.guide.final-budget.step.2':
    'その下の「最終負担額」が示すのは別のことです。今誰がいくら払うべきかではなく、すべての立て替えを返し終えたとき、旅行者1人あたり旅行にいくらかかったかです。',
  'help.guide.final-budget.step.3':
    '名前をクリックすると計算の内訳が表示されます。「支払った費用」、その下に「精算（差引）」と「未精算の金額」です。',
  'help.guide.final-budget.step.4':
    '3つの行の下には、旅行者の名前ごとに、その行の内訳が一覧表示されます。その旅行者が支払った支出、記録済みの送金、未精算の送金です。各一覧の合計は、同じ名前の行の金額とぴったり一致します。',
  'help.guide.final-budget.result':
    '「残高」には、今の時点で誰がお金を受け取り、誰が払うべきかが表示されます。「最終負担額」には、すべての立て替えを返し終えたとき、旅行に1人ずつにいくらかかったかが表示されます。',
  'help.guide.final-budget.tip.1':
    '支払いを記録しても、誰の最終負担額も変わりません。金額が未精算の払い戻しから精算済みの払い戻しに移るだけです。',
  'help.guide.final-budget.tip.2': '支払者のいない支出は、精算の提案と同じく、どちらのカードにも含まれません。',
  // expense-from-booking
  'help.guide.expense-from-booking.title': '予約から支出を作成する',
  'help.guide.expense-from-booking.goal': 'フライト、ホテル、場所に実際にかかった費用を、対応する記録に添付します。',
  'help.guide.expense-from-booking.step.1':
    '「移動」タブか「予約」タブで予約を探し、カード上部の鉛筆アイコンをクリックします。',
  'help.guide.expense-from-booking.step.2':
    'フォームの最後のほうにある「費用」までスクロールします。先に予約を保存する「支出を作成」と、「費用」にすでにある支出を使う「既存の支出をリンク」があります。',
  'help.guide.expense-from-booking.step.3':
    '「支出を作成」をクリックします。予約が保存されてフォームが閉じ、「費用」エディターが開きます。名前には予約のタイトル、カテゴリには予約のタイプに合うもの、支出の日には予約の日が入っています。',
  'help.guide.expense-from-booking.step.4':
    'ほかの支出と同じように、金額と通貨、支払った人、分け方を入力して「支出を追加」をクリックします。予約をもう一度開くと、「リンク済みの支出」にその支出が表示されます。編集用の鉛筆アイコン、支出を残してリンクだけを外す「リンクを解除し、支出は残す」、削除用のゴミ箱アイコンがあります。',
  'help.guide.expense-from-booking.result':
    '予約に費用が表示されます。支出は「費用」タブの通常の行になり、ほかの支出と同じように支払った人、分け方、通貨を持ちます。',
  'help.guide.expense-from-booking.tip.1':
    '予約を削除すると、紐づく支出も削除されます。確認のメッセージにもその旨が表示されます。予約の「費用」欄の「支出を削除」はその逆で、支出を削除して予約は残します。「リンクを解除し、支出は残す」では両方とも残ります。',
  'help.guide.expense-from-booking.tip.2':
    '場所のフォームにも同じ欄があります。「支出を作成」を押すと、先に場所が保存されます。',
  // costs-table
  'help.guide.costs-table.title': '表で費用を計画する',
  'help.guide.costs-table.goal':
    '支出を表で確認・変更します。カテゴリごとに並び、1人あたりと1日あたりの金額が計算されます。',
  'help.guide.costs-table.step.1':
    'バーにある「リスト」／「表」の切り替えで、2つ目のアイコン「表」をクリックします。帳簿が同じ支出の表に切り替わり、検索とフィルターも表に適用されます。',
  'help.guide.costs-table.step.2':
    '表はカテゴリごとにまとめられます。グループの見出しには名前、支出の数、小計が表示され、クリックすると折りたためます。列は「名前」「日付」「合計」「人数」「日」と、これらから計算されるグレーの背景の「1人あたり」「1日あたり」「人/日」です。下部の「合計」行ですべてが合計されます。',
  'help.guide.costs-table.step.3':
    'セルをクリックすると、その場で変更できます。名前、合計、「人数」、「日数」です。入力したら Enter を押すかほかの場所をクリックして保存し、Esc で取り消します。日付をクリックするとカレンダーが開きます。「1人あたり」などの計算列はすぐに更新されます。',
  'help.guide.costs-table.step.4':
    '鍵アイコンの付いた合計は、ここでは変更できません。誰かが支払い済みか、別の通貨で入力された支出で、どちらなのかはツールチップに表示されます。クリックすると代わりに支出が開くので、残高と固定された為替レートは正しいまま保たれます。',
  'help.guide.costs-table.step.5':
    'カテゴリの最後にある「支出を追加」をクリックすると、そのカテゴリに「新しい項目」という名前の行が追加されます。日付はそのカテゴリの最新の項目と同じです。名前の欄はすでに編集できる状態なので、そのまま変更できます。合計も同じように入力します。',
  'help.guide.costs-table.step.6':
    'この表示では、右の列に「カテゴリ別」の代わりに「概要」が表示されます。支出を4つの方法で合計します：「カテゴリ」「日」、「支払者」（未払いのものは「支払者未設定」）、ステータス（「支払済み」と「未精算」）。',
  'help.guide.costs-table.result':
    'すべての支出がカテゴリごとに、1人あたりと1日あたりの金額付きで表示されます。セルで合計を変更すると、上のカードと「概要」がすぐに更新されます。',
  'help.guide.costs-table.tip.1':
    '「費用」の表示はこのブラウザーに保存されます。もう一度「リスト」をクリックするまで、表で開きます。',
  'help.guide.costs-table.tip.2':
    '「カスタム」や「レシート」で分けた支出には1人ごとの決まった負担額がないため、「1人あたり」と「人/日」は空欄になります。',
  'help.guide.costs-table.tip.3':
    '支払った人、分け方、メモ、レシートは、支出そのものの画面で編集します。行の末尾の「その他のオプション」に、「編集」と、行を削除する「削除」があります。',

  // ── Screen: trip-transports ───────────────────────────────────────────────────────────
  'help.ctx.trip-transports.title': '移動',
  'help.ctx.trip-transports.summary':
    '立ち寄り先の間の移動手段すべてです。飛行機、電車、バス、車、タクシー、自転車、クルーズ、フェリー、ロープウェイと、TREKが検索する公共交通機関の乗り継ぎがあります。このタブで一覧でき、計画画面でも作成・確認でき、地図にも描かれます。',
  'help.ctx.trip-transports.bullet.1':
    'このタブには移動だけが表示されます。宿泊、レストラン、イベント、チケットは「予約」タブにあるので、同じ項目が2回表示されることはありません。',
  'help.ctx.trip-transports.bullet.2':
    '上部のバーには、「検索」、ステータス・タイプ・同行者で絞り込む「フィルター」、「カード」「リスト」「タイムライン」の3つの表示、「表示オプション」、表示中の内容をダウンロードする「表計算ファイルとして書き出し (CSV)」があります。右の「交通」で移動を手動で追加します。その前のアイコン「予約確認書のインポート」と「AirTrail からインポート」は、サーバーが確認書を読み取れる場合や、AirTrailを接続している場合に表示されます。タブが空のときは、同じ操作が中央に「交通」「ファイルからインポート」、AirTrailとして表示されます。',
  'help.ctx.trip-transports.bullet.3':
    'タブを開くと「カード」表示になり、「確定」、続いて「保留」が表示されます。各セクションは見出しをクリックすると折りたためます。計画した公共交通機関の乗り継ぎにはステータスがなく、確定済みの移動の中に時刻順で表示されます。ただし、「表示オプション」で専用のセクション「公共交通機関の自動検索」を設定した場合は別に表示されます。「リスト」は日ごとにまとめて表示し、「タイムライン」は旅行期間のすべての移動を表示します。',
  'help.ctx.trip-transports.bullet.4':
    'カードの上部の帯はステータスで色分けされます。確定は緑、保留は琥珀色、計画した乗り継ぎは青です。帯にはステータスの点、タイプ、タイトル、鉛筆アイコン、ゴミ箱アイコンがあります。その下に、日付、時刻、「予約コード」、ルート、航空会社と便名、または列車番号、ホーム、座席が表示されます。カードをクリックすると詳細が開きます。',
  'help.ctx.trip-transports.bullet.5':
    '移動は計画画面でも作成できます。日のヘッダーの＋（ツールチップ「この日に追加」）か、ヘッダーの右クリックで、「移動手段を追加」と「公共交通機関」を選べます。2つの立ち寄り先の間の所要時間の表示をクリックすると、その区間で同じ検索が開きます。',
  'help.ctx.trip-transports.bullet.6':
    '出発地と到着地の両方を設定した移動は、地図に線で表示されます。日程の行にあるルートのアイコンか、詳細の「地図上」でその線を表示します。日の上のツールバーの「すべての予約ルートを表示」で、旅行全体の線の表示・非表示を切り替えます。',
  // transports-list
  'help.guide.transports-list.title': '「移動」タブの見方',
  'help.guide.transports-list.goal': '何かを変更する前に、一覧に何が表示されているかを確認します。',
  'help.guide.transports-list.step.1':
    '「移動」は旅行のタブの1つで、「予定」（ツアーアドオンがオンなら「ツアー」）の後ろにあります。ここにあるのは移動だけです。ホテル、レストラン、イベント、チケットは「予約」タブにあります。',
  'help.guide.transports-list.step.2':
    'バー左側の「検索」は、入力するそばから移動を絞り込みます。その横のじょうごアイコン「フィルター」を押すと選択肢が開きます。「ステータス」（「すべて」「確定」「保留」）に続いて、使用中のタイプがすべて件数付きで並びます。タイプを1つ以上チェックすると、そのタイプだけが表示されます。じょうごの数字は有効なフィルターの数で、バーには「4件中1件」のように表示中の件数が出ます。メニュー下部の「フィルターをリセット」で、すべての移動がまた表示されます。',
  'help.guide.transports-list.step.3':
    '隣の「カード」「リスト」「タイムライン」で、移動をカード、日ごとの行、旅行の日程にまたがるバーのいずれかで表示します。スライダーアイコンの「表示オプション」では、「カード」と「リスト」の「グループ化」と「並べ替え」、「タイムライン」のレーンを設定できます。「表示をリセット」でデフォルトに戻ります。「カード」で「公共交通機関を別セクションにする」をオンにすると、計画した経路が「公共交通機関の自動検索」にまとめて表示されます。',
  'help.guide.transports-list.step.4':
    '各カードにはすべての詳細が表示されます。上部の帯は「確定」なら緑、「保留」なら琥珀色で、ステータスの点、タイプ、タイトルが表示されます。その下の「日付」には、移動がまたがる日とその日付が表示されます。続いて「時刻」「予約コード」、立ち寄り先の間にタイプのアイコンが入った「ルート」、航空会社と便名、または列車番号、ホーム、座席です。カードをクリックすると詳細が開きます。',
  'help.guide.transports-list.step.5':
    'ステータスの点をクリックすると、「保留」と「確定」が切り替わります。ツールチップに「保留にする」のように切り替え先が表示されます。ヘッダーの鉛筆アイコンで移動のフォームが開き、ゴミ箱アイコンで削除できます。削除前に「予約を削除しますか？」と確認され、紐づく費用を含めて削除される内容が表示されます。',
  'help.guide.transports-list.result':
    '各カードで予約済みかどうかがわかり、バーでいつでも一覧を絞り込んだり並べ替えたりできます。',
  'help.guide.transports-list.tip.1':
    'タブの設定は保存されます。表示、グループ化、並び替えはこのブラウザーに、折りたたんだセクションは旅行ごとに、フィルターはブラウザーのタブを閉じるまで保存されます。',
  'help.guide.transports-list.tip.2':
    '「交通」の前にある2つのアイコン「予約確認書のインポート」と「AirTrail からインポート」は、サーバーが確認書を読み取れる場合と、AirTrailのインスタンスを接続している場合だけ表示されます。ない場合は、手動か公共交通機関の検索で一覧に追加します。',
  // add-transport
  'help.guide.add-transport.title': '日に移動手段を追加する',
  'help.guide.add-transport.goal': '立ち寄り先から次の立ち寄り先への移動手段を、その移動がある日に追加します。',
  'help.guide.add-transport.step.1':
    '移動する日のヘッダーで＋（ツールチップ「この日に追加」）をクリックし、「移動手段を追加」を選びます。日のヘッダーを右クリックしても同じメニューが表示されます。フォームはその日が入力された状態で開きます。',
  'help.guide.add-transport.step.2':
    'ヘッダーのタイプのピルに、移動手段のタイプが表示されます（初期設定は「飛行機」）。クリックすると「飛行機」「電車」「バス」「レンタカー」「タクシー」「自転車」「クルーズ」「フェリー」「ロープウェイ」「その他」を選べ、フォームもそれに合わせて変わります。飛行機では各経由地に空港、電車では駅、クルーズでは「乗船」「寄港地」「下船」、車では「受取」「返却」「途中の立ち寄り先」を入力します。',
  'help.guide.add-transport.step.3':
    '上部の帯の、グレーの例文があるところに、タイトルを直接入力します。必須の項目はこれだけです。入力するまでは下の行に「タイトル *」と表示され、「追加」はグレーのままです。発車案内板で見てわかるようなタイトルにしましょう。',
  'help.guide.add-transport.step.4':
    '「ルート」の出発地と到着地には、駅、港、住所を入力します。入力する前から、旅行の場所が候補に表示されます。3文字以上入力すると検索されるので、結果から選びます。入力しただけで結果から選ばなかった名前は保存されず、マップにも何も表示されません。',
  'help.guide.add-transport.step.5':
    '「日付」と「開始時刻」で出発日時、「終了日」と「終了時刻」で到着日時を設定します。翌日に着く場合は、終了日を翌日にします。下の「予約コード」と「メモ」は任意です。ヘッダーの「保留」のピルをクリックすると「確定」に変わります。',
  'help.guide.add-transport.step.6': '「追加」をクリックします。',
  'help.guide.add-transport.result':
    '移動がその日の立ち寄り先の間に時刻順の行で表示され、「移動」タブには「保留」か「確定」のカードで表示されます。',
  'help.guide.add-transport.tip.1':
    '行は開始時刻に従って、それより早く始まる最後の立ち寄り先のあとに配置されます。つまみをドラッグすると、その日の別の位置や別の日に移動できます。',
  'help.guide.add-transport.tip.2':
    'チケットは「ファイル」の「ファイルを添付」で追加します。「費用」の「支出を作成」を使うと、予約が保存され、運賃を入力する「費用」のエディターが開きます。',
  'help.guide.add-transport.tip.3':
    'フォームの最初のブロック「同行者」で、この移動手段を使う人を設定します。旅行のメンバーが2人以上いて、移動手段に誰かが指定されていると、タブの「フィルター」にも「同行者」が表示され、1人分の移動だけを表示できます。',
  // import-transport-file
  'help.guide.import-transport-file.title': 'e チケットからフライトをインポートする',
  'help.guide.import-transport-file.goal':
    '運航会社から届いたチケットから、TREKにフライト、電車、フェリーを読み取らせ、保存する前に内容を確認します。',
  'help.guide.import-transport-file.step.1':
    '「移動」タブのバーで、「交通」の前にあるダウンロードアイコン（ツールチップ「予約確認書のインポート」）をクリックします。同じ名前のダイアログが開きます。「予約」タブのものと同じです。タブが空のときは、中央の「ファイルからインポート」でも同じ操作ができます。',
  'help.guide.import-transport-file.step.2':
    'チケットをボックスにドロップするか、ボックスをクリックしてファイルを選びます。対応形式はEML、PDF、PKPass、HTML、TXTで、1ファイル10 MBまで、最大5ファイルです。サーバーに読み取り用のAIモデルがあれば、チケットの写真（JPG、PNG、WEBP）も使えます。選んだファイル名はボックスに表示されます。',
  'help.guide.import-transport-file.step.3':
    '「インポート」をクリックします。ダイアログはすぐに閉じ、ファイルはバックグラウンドで読み取られます。',
  'help.guide.import-transport-file.step.4':
    '右下のカードに、ファイル名と進み具合が表示されます。読み取りが終わると「ファイルを解析中…」がチェックマークに変わり、カードに「インポート」が表示されます。それをクリックします。',
  'help.guide.import-transport-file.step.5':
    'フライトの情報が入力された状態で「移動手段を追加」が開きます。タイプは「飛行機」、ヘッダーのタイトルには航空会社と便名、「ルート」には「出発」と「到着」の空港とそれぞれの時刻・タイムゾーン、さらに「航空会社」「便名」「予約コード」、「ファイル」にはチケットが入っています。内容を確認して「追加」をクリックします。',
  'help.guide.import-transport-file.result':
    'フライトが「移動」タブの「保留」にカードとして、出発日に行として追加され、チケットは「ファイル」に入ります。両方の空港がわかっていれば、フライトはマップ上に弧で表示されます。',
  'help.guide.import-transport-file.tip.1':
    '2つのタブのインポートは同じものです。フライトとホテルを含むファイルは、どちらのタブから始めても、まずフライトが「移動手段を追加」に、次にホテルが「新しい予約」に開きます。',
  'help.guide.import-transport-file.tip.2':
    '空港はコードで位置が決まります。駅や港の位置を特定できなかった場合は、右下のインポートのカードにその名前が琥珀色で表示されます。「追加」をクリックする前に「ルート」で手動で選んでください。そうしないと、その移動手段はマップに表示されません。',
  // plan-transit
  'help.guide.plan-transit.title': '公共交通機関の乗り継ぎを計画する',
  'help.guide.plan-transit.goal':
    'その日の2地点の間を走る実際の電車やバスをTREKに調べさせ、選んだものを計画に追加します。',
  'help.guide.plan-transit.step.1':
    '日のヘッダーの＋をクリックし、「公共交通機関」を選びます。その日の検索が開きます。日はヘッダーにピルで表示され、横の「手動」と「自動」で、この検索と通常のフォームを切り替えます。',
  'help.guide.plan-transit.step.2':
    '「出発地」と「到着地」には、立ち寄り先か駅を指定します。入力欄が空のうちは、その日の宿泊先、その日の予約の駅や空港、その日の立ち寄り先が候補に出ます。2文字入力すると、時刻表の駅を検索します。2つの欄の間の「入れ替え」で、出発地と到着地を入れ替えます。',
  'help.guide.plan-transit.step.3':
    '「出発」または「到着」と時刻で移動したい時間を指定し、「おすすめルート」「乗り換え少」「徒歩少」で結果の並び順を選びます。',
  'help.guide.plan-transit.step.4':
    '下のチップで、使える交通手段を選びます。「電車」「地下鉄」「路面電車」「バス」「フェリー」「ロープウェイ」です。オフにした手段は除外されます。最低1つはオンのままになります。最後に「検索」をクリックします。',
  'help.guide.plan-transit.step.5':
    '各結果には、出発と到着の時刻、所要時間、乗り換え回数、徒歩の距離が表示され、路線はバッジで示されます。時刻表に路線の色があれば、その色で表示されます。結果をクリックすると展開され、区間ごとに乗車駅と乗り換え駅、ホーム、乗り換えの徒歩が表示されます。',
  'help.guide.plan-transit.step.6': '「この日に追加」をクリックします。',
  'help.guide.plan-transit.result':
    '乗り継ぎが路線のバッジ付きでその日の行として追加されます。山形の矢印をクリックすると、区間ごとに表示されます。「移動」タブにも、確定済みの移動の中に青いカードで表示されます。',
  'help.guide.plan-transit.tip.1':
    '乗り継ぎ情報は、公開されている時刻表データを使った無料のコミュニティサービスTransitousから取得します。キーもアカウントも不要です。管理者は、代わりにGoogleで検索するように設定することもできます。',
  'help.guide.plan-transit.tip.2':
    '見つからない場合は、データが対応している地域と期間を確認してください。別の時間を試す、ほかの交通手段もオンにする、場所ではなく駅を選ぶ、といった方法があります。メッセージには、応答したサービス名が表示されます。日付のない旅行には検索する日がないため、通常のフォームだけが表示されます。',
  'help.guide.plan-transit.tip.3':
    '区間ごとにも同じ検索を開けます。2つの立ち寄り先の間の所要時間の表示をクリックし、「公共交通機関」を選びます。出発地、到着地、出発時刻が入力されています。',
  // change-transit-route
  'help.guide.change-transit-route.title': '計画した経路を開いて変更する',
  'help.guide.change-transit-route.goal': '経路を1行ずつ確認したり、名前を変えたり、経路を検索し直したりします。',
  'help.guide.change-transit-route.step.1':
    '「移動」タブでは、計画した経路は上部が青い帯のカードで、確定した移動と一緒に時刻順に並んでいます。「表示オプション」で「公共交通機関を別セクションにする」をオンにしている場合は、「公共交通機関の自動検索」に表示されます。カードをクリックすると、経路が予約として開きます。',
  'help.guide.change-transit-route.step.2':
    '上部のタイルには、出発と到着とそれぞれの駅、「期間」「乗り換え」「徒歩」が表示されます。その下の「行程」には、経路が1行ずつ、時刻、ホーム、乗り換えの徒歩とともに表示されます。',
  'help.guide.change-transit-route.step.3':
    '予約の下部の「経路を変更」で、この乗り継ぎの出発地と到着地、日が入った状態で検索がもう一度開きます。',
  'help.guide.change-transit-route.step.4':
    '「検索」をクリックし、別の乗り継ぎを開いて「この日に追加」をクリックすると、古い乗り継ぎと置き換わります。予約の下部の右端にある「編集」では、通常の移動のフォームが開き、「予約コード」、同行者、メモ、ファイルを編集できます。',
  'help.guide.change-transit-route.result':
    '乗り継ぎが新しい経路に変わり、「移動」タブのカードにも新しい路線と時刻が表示されます。',
  'help.guide.change-transit-route.tip.1':
    '予約のヘッダーにあるタイトルをクリックすると、経路を変えずに名前だけを変更できます。メモは、「編集」で開く移動手段のフォームに書きます。',
  'help.guide.change-transit-route.tip.2':
    '予約の下部にあるゴミ箱アイコンで、確認のあと経路を削除できます。その日の立ち寄り先はそのまま残ります。',
  // leg-travel-mode
  'help.guide.leg-travel-mode.title': '区間の移動手段を変える',
  'help.guide.leg-travel-mode.goal':
    '車で移動する日の1区間を徒歩にしたり、その区間を公共交通機関の検索で計画したりします。',
  'help.guide.leg-travel-mode.step.1':
    '立ち寄り先の間の所要時間の表示は、その日のルートをオンにした場合だけ表示されます。日のヘッダーをクリックして日を開き、立ち寄り先の下のバーで「ルート」をクリックします。',
  'help.guide.leg-travel-mode.step.2':
    '立ち寄り先の間に、その区間の所要時間と距離が、ルート計算に使った移動手段のアイコン付きで表示されます。車のアイコンは車、足のアイコンは徒歩、自転車のアイコンは自転車です。',
  'help.guide.leg-travel-mode.step.3':
    '立ち寄り先の間の表示をクリックします。メニューに「車」「徒歩」「自転車」、この区間だけの「公共交通機関」、「1日のデフォルトを使用」が表示されます。',
  'help.guide.leg-travel-mode.step.4':
    '「徒歩」を選びます。変わるのはこの区間だけで、その日のほかの区間の移動手段はそのままです。',
  'help.guide.leg-travel-mode.result':
    'その区間に徒歩のアイコンと徒歩の所要時間が表示され、その日のほかの区間は日の移動手段のままです。',
  'help.guide.leg-travel-mode.tip.1':
    '移動手段は日ではなく区間ごとの設定です。日全体の「車」「徒歩」「自転車」ボタンを使っても、手動で設定した区間は上書きされません。「1日のデフォルトを使用」で、その区間がまた日のボタンに従うようになります。',
  'help.guide.leg-travel-mode.tip.2':
    '同じメニューの「公共交通機関」を選ぶと、この区間の経路検索が開きます。出発地、到着地、出発時刻はすでに入力されています。',
  'help.guide.leg-travel-mode.tip.3':
    '所要時間は、実際の道路と歩道をもとに公開ルーターが計算します。ルーターが計算できない区間は直線のままで、時間は表示されません。',
  // edit-transport
  'help.guide.edit-transport.title': '移動手段を変更・削除する',
  'help.guide.edit-transport.goal': '時刻、ホーム、予約コードを直したり、移動手段を旅行から削除したりします。',
  'help.guide.edit-transport.step.1':
    '日程では、移動は立ち寄り先の間にある、タイプごとに色分けされた行です。クリックすると予約が開きます。上部にステータス、タイプ、日、「予約コード」（コピーボタン付き）がピルで並び、その下に出発・到着の時刻と空港または駅が表示されます。',
  'help.guide.edit-transport.step.2':
    '予約の下部の「編集」で、作成したときのフォームが開き、ヘッダーのタイトルの上に「移動手段を編集」と表示されます。タイトル、ステータスとタイプのピル、ルート、日と時刻、「予約コード」など、すべて変更できます。',
  'help.guide.edit-transport.step.3':
    '飛行機のルートは空港、電車は駅、クルーズは港をつないだものです。「経由地を追加」（クルーズでは「寄港地を追加」）で間に追加でき、各区間にはそれぞれの時刻と便名や列車番号が付きます。',
  'help.guide.edit-transport.step.4':
    '「更新」をクリックします。移動を完全に削除するには、同じバーの左にあるゴミ箱アイコン、予約の下部のゴミ箱アイコン、「移動」タブのカードのゴミ箱アイコンのいずれかを使い、確定します。',
  'help.guide.edit-transport.result':
    '「移動」タブ、移動のある日、地図上の線など、移動が表示されるすべての場所に変更が反映されます。',
  'help.guide.edit-transport.tip.1':
    '同じフォームを2か所から開けます。日程の行から開く予約の「編集」と、「移動」タブのカードにある鉛筆アイコンです。計画した公共交通機関の経路も予約として開きます。そこで「経路を変更」をクリックすると検索がもう一度開き、「編集」をクリックするとこのフォームが開きます。',
  'help.guide.edit-transport.tip.2':
    '移動手段を別の日に移すのにフォームは不要です。行をある日のカードから別の日のカードへドラッグします。',
  // transport-on-map
  'help.guide.transport-on-map.title': '移動手段をマップに表示する',
  'help.guide.transport-on-map.goal': 'フライト、車での移動、乗り継ぎの実際のルートを確認します。',
  'help.guide.transport-on-map.step.1':
    '出発地と到着地の両方を設定した移動には、日程の行に小さなルートのアイコンが表示されます。クリックすると、ツールチップが「予約ルートを非表示」に変わります。',
  'help.guide.transport-on-map.step.2':
    '地図にルートが表示され、両端に移動手段のアイコン付きのピルのマーカーが付きます。',
  'help.guide.transport-on-map.step.3':
    '端のマーカーをクリックすると、地図の上に予約が開きます。ヘッダーにステータス、タイプ、日、「予約コード」が表示され、その下に時刻と空港や駅、航空会社、便名が表示されます。ヘッダーの「閉じる」をクリックして閉じます。',
  'help.guide.transport-on-map.step.4':
    '日程の上のツールバーにあるルートアイコンでは、旅行全体をまとめて操作できます。「すべての予約ルートを表示」で表示し、「すべての予約ルートを非表示」で再び隠します。',
  'help.guide.transport-on-map.step.5':
    '計画した公共交通機関の経路には、専用のルートアイコンがありません。その日の「ルート」の切り替えで表示されるため、その日のルートがオンの間は、「すべての予約ルートを非表示」を使っても非表示になりません。',
  'help.guide.transport-on-map.result':
    'ルートが両端にマーカー付きでマップに表示され、オフにするまで表示されたままです。',
  'help.guide.transport-on-map.tip.1':
    '飛行機、クルーズ、フェリーは曲線で表示されます。車、バス、タクシー、自転車は実際の道路に沿って表示されます。列車と計画した経路は、停車する駅を通って表示されます。',
  'help.guide.transport-on-map.tip.2':
    '確定済みの予約は実線、保留中の予約は破線で表示されます。「予約ルートのラベル」の設定で、両端のマーカーに空港コードや駅名を表示できます。',
  'help.guide.transport-on-map.tip.3':
    '「すべての予約ルートを表示」は、表示中のルートに追加するのではなく、個別のアイコンで設定した内容を置き換えます。押すと、すべてのルートが表示されるか、すべて非表示になります。',
  // airtrail-import
  'help.guide.airtrail-import.title': 'AirTrailからフライトをインポートする',
  'help.guide.airtrail-import.goal':
    'AirTrail に登録済みのフライトをまとめて旅行に取り込み、その後も AirTrail の内容に合わせて更新します。',
  'help.guide.airtrail-import.step.1':
    'AirTrail アドオンがオンで、「設定」の「連携」で自分のインスタンスを接続していると、「移動」タブのバーで「交通」の前に飛行機アイコンの「AirTrail からインポート」が表示されます。それをクリックします。',
  'help.guide.airtrail-import.step.2':
    '「AirTrail からインポート」には、あなたのアカウントのフライトが2つのグループに分かれて表示されます。「この旅行の期間中」には旅行期間内のフライトがチェック済みの状態で、「その他のフライト」にはそれ以外のフライトがチェックなしで入っています。すでに旅行にあるフライトはグレーで表示され、「インポート済み」と表示されます。',
  'help.guide.airtrail-import.step.3':
    '各行はチェックボックスで、航空会社と便名、2つの空港、日付が表示されます。行をクリックすると、そのフライトを含めるか外すかを切り替えられます。「その他のフライト」のフライトは、チェックを入れたときだけインポートされます。',
  'help.guide.airtrail-import.step.4':
    '乗り継ぎのフライト（前のフライトが着いた空港から1日以内に出発するもの）は、まとめて表示されます。下のチェックボックス「その空港で乗り継ぐ1つのフライトとしてインポート」は最初からオンになっています。経由地のある1つの予約にするならオンのまま、区間を別々のフライトとしてインポートするならオフにします。',
  'help.guide.airtrail-import.step.5':
    '右下のボタン（チェックしたフライトの数が「2件をインポート」のように表示されています）をクリックします。インポートしたフライトの数がメッセージで表示されます。',
  'help.guide.airtrail-import.step.6':
    'フライトが「確定」にカードで表示され、タイトルの横に青いAirTrailのピルが付きます。運航日の日程にも行で表示されます。乗り継ぎのフライトは1枚のカードになり、ルートは乗り継ぎ地を経由します。',
  'help.guide.airtrail-import.result':
    'AirTrail のフライトが「移動」タブのカードと、それぞれの日の行として表示されます。どれにも取り込み元を示す AirTrail のラベルが付きます。',
  'help.guide.airtrail-import.tip.1':
    '同じ便名と日付のフライトがすでに旅行にある場合はスキップされ、スキップした件数がメッセージで表示されます。日程の上のツールバーにある「元に戻す」矢印で、インポート全体を取り消せます。',
  'help.guide.airtrail-import.tip.2':
    'データの元は引き続き AirTrail です。TREK は旅行を開いたときと、バックグラウンドで数分ごとに変更を読み込みます。AirTrail で削除したフライトのカードは TREK に残り、ラベルが「未同期」に変わります。TREK での編集が AirTrail に反映されるのは、「連携」で「変更を AirTrail に書き戻す」がオンのときだけです。',
  'help.guide.airtrail-import.tip.3':
    '結合した乗り継ぎは、同期できる1つの AirTrail フライトではないため、1回限りのインポートになります。青いラベルはそのまま残り、カーソルを合わせるとその旨が表示されます。同期しているフライトに手動で経由地を追加した場合も同じです。',

  // ── Screen: trip-roadtrip ─────────────────────────────────────────────────────────────
  'help.ctx.trip-roadtrip.title': 'ロードトリップ',
  'help.ctx.trip-roadtrip.summary':
    '計画をひと続きのドライブとして表示します。同じ日と同じ場所が、間の運転区間でつながった立ち寄り先として、左の列の行程とマップに表示されます。距離と運転時間、給油が必要な場所、道沿いにあるものがわかります。',
  'help.ctx.trip-roadtrip.bullet.1':
    '左の列の上にある「日」と「ロードトリップ」で、日ごとの予定とドライブを切り替えます。何もコピーされず、何も変更されません。「日」では予定がそのまま表示されます。',
  'help.ctx.trip-roadtrip.bullet.2':
    'レールの上部に旅行全体の合計（「距離」「運転時間」「地点」）が表示されます。その下に、ドライブのある日ごとのカードがあります。タイルに日の番号と日付、続いて距離（km）、運転時間、立ち寄り先の数、通過する国境などのピルと、「トラック」バッジが表示されます。予約した飛行機、電車、フェリーは、その中に別のカードで表示されます。',
  'help.ctx.trip-roadtrip.bullet.3':
    '番号付きの立ち寄り先は、その日の目的地です。給油、充電、休憩所などの途中の立ち寄り先には、番号の代わりに種類のアイコンが表示され、数には含まれません。番号をクリックすると種類を変えられ、「滞在」バッジで滞在時間を設定し、立ち寄り先をドラッグするとその日の中や別の日に移動できます。',
  'help.ctx.trip-roadtrip.bullet.4':
    '2つの立ち寄り先の間にあるドライブの帯に、区間の距離と所要時間が表示されます。帯をクリックすると「この区間の走り方」が開きます。マップ上のルートをクリックすると、経由地を通るように区間を変えられます。',
  'help.ctx.trip-roadtrip.bullet.5':
    '右の列が「ルートの途中」に変わります。探すものと日を1行で選び、範囲の幅を決めて「検索」します。結果のプラス「追加」を押すと、実際に通過する地点でドライブに追加されます。ホテルのベッドのアイコンでは宿泊を追加できます。「手動」で検索に出なかった場所を追加でき、タイトル横の三点メニューからGoogle Mapsのルートをインポートできます。',
  'help.ctx.trip-roadtrip.bullet.6':
    'その下の「運転の設定」では、制限、車と航続距離、1日の移動時間、避けるもの、線の描き方、現在の警告を地図に表示するかどうかを設定します。設定は旅行ごとなので、全員が同じ車で計画できます。',
  // roadtrip-mode
  'help.guide.roadtrip-mode.title': '旅行をひと続きのドライブとして表示する',
  'help.guide.roadtrip-mode.goal': '計画をロードトリップモードに切り替え、レールの表示内容を理解します。',
  'help.guide.roadtrip-mode.step.1':
    '左の列の上部にある「日」と「ロードトリップ」の切り替えで「ロードトリップ」をクリックします。日程がドライブの表示に変わり、地図にはルートのある日がすべて表示されます。',
  'help.guide.roadtrip-mode.step.2':
    'レールの上部のカードに、旅行全体の「距離」「運転時間」「地点」の合計が表示されます。日をスクロールしても、このカードは固定されたままです。',
  'help.guide.roadtrip-mode.step.3':
    'その下に、ドライブがある日ごとのカードが並びます。ドライブのない日は表示されません。カードのヘッダーには、日の番号とその下に日付、続いてドライブの距離と時間、その日の立ち寄り先の数がピルで表示されます。',
  'help.guide.roadtrip-mode.step.4':
    'カードの中では、その日が順番に表示されます。場所ごとに番号付きの立ち寄り先、立ち寄り先の間にドライブの区間、右端に到着時刻があります。予約した飛行機、電車、フェリーは、その中に専用のカードで表示されます。',
  'help.guide.roadtrip-mode.step.5':
    '日のヘッダーをクリックすると折りたたまれ、右端の矢印が回転します。折りたたんだ日は地図からも非表示になります。もう一度ヘッダーをクリックすると表示されます。',
  'help.guide.roadtrip-mode.result':
    '左の列にドライブが、地図にはそのすべての日が表示されます。「日」で、変更されていない計画にすぐ戻れます。',
  'help.guide.roadtrip-mode.tip.1':
    'この設定は旅行ごとにアカウントに保存されます。再読み込みしても、別のブラウザーや端末で開いても、旅行はロードトリップ表示で開きます。',
  'help.guide.roadtrip-mode.tip.2':
    'この切り替えは、管理者が管理パネルの「アドオン」で「ロードトリップ」アドオンをオンにしたときだけ表示されます。',
  'help.guide.roadtrip-mode.tip.3':
    'スマートフォンでは切り替えはなく、アドオンによって「予定」の隣に「ロードトリップ」タブが追加されます。',
  // roadtrip-stops
  'help.guide.roadtrip-stops.title': '途中の立ち寄り先と滞在時間',
  'help.guide.roadtrip-stops.goal':
    'ドライブ上の場所を途中の立ち寄り先にし、それぞれの立ち寄りにかかる時間を設定します。',
  'help.guide.roadtrip-stops.step.1':
    'レールで、立ち寄り先の前にある番号をクリックします。ラベルは「途中の立ち寄りにする」で、その下に立ち寄りの種類が色の付いた丸で一列に表示されます。',
  'help.guide.roadtrip-stops.step.2':
    '種類を選びます。丸にカーソルを合わせると名前が表示されます：「宿泊」「燃料」「充電」「サービスエリア」「キャンプ場」「食事」「観光スポット」。番号がその種類のアイコンに変わり、その下の立ち寄り先の番号が振り直されます。',
  'help.guide.roadtrip-stops.step.3':
    '途中の立ち寄り先は目的地ではないため、その日のヘッダーの立ち寄り先の数は1つ少なくなります。',
  'help.guide.roadtrip-stops.step.4':
    'もう一度アイコン（「立ち寄りの種類を変更」）をクリックして「目的地に戻す」を選ぶと、立ち寄り先に再び番号が付きます。',
  'help.guide.roadtrip-stops.step.5':
    '各立ち寄り先に「滞在」バッジがあり、何も設定していない間は＋が表示されます。クリックすると「この立ち寄り先での滞在時間」が開きます。',
  'help.guide.roadtrip-stops.step.6':
    'スライダー、マイナス・プラスボタン、またはプリセットで長さを設定します。「到着」は運転で着く時刻のまま変わらず、「出発」の時刻が変わります。最後に「保存」をクリックします。',
  'help.guide.roadtrip-stops.result':
    '変更した立ち寄り先の「滞在」バッジに新しい長さが表示され、それ以降の到着時刻もすべて合わせて変わります。種類を変えてから元に戻した立ち寄り先は、再び番号付きの目的地になります。',
  'help.guide.roadtrip-stops.tip.1':
    '滞在時間は訪問ごとではなく場所ごとの設定です。2日に計画した場所は、どちらの日も同じ滞在時間になります。',
  'help.guide.roadtrip-stops.tip.2':
    '途中の立ち寄り先は「日」にも表示されます。「運転の設定」の「サービス施設での停車」で「日別にも表示」をオフにすると、「ロードトリップ」にだけ表示されます。',
  'help.guide.roadtrip-stops.tip.3': '同じダイアログの「滞在なし」で、滞在時間を削除できます。',
  'help.guide.roadtrip-stops.tip.4':
    '途中の立ち寄り先や予約済みの宿泊をクリックすると、マップの上にそのカードが開きます。「ロードトリップ」がオンのときは、そこで「編集」をクリックすると、場所のフォームではなく、検索で使う簡易ダイアログが開きます。そのダイアログの「詳細を追加」で、すべての項目があるフォームが開きます。',
  // roadtrip-corridor
  'help.guide.roadtrip-corridor.title': 'ルート沿いで給油所、食事、宿を探す',
  'help.guide.roadtrip-corridor.goal': '実際に走る道沿いで検索し、見つけたものを正しい区間に追加します。',
  'help.guide.roadtrip-corridor.step.1':
    '「探すもの」で一覧を開き、必要なものにチェックを入れます。「燃料」「充電」「サービスエリア」「キャンプ場」「宿泊」「食事」「観光スポット」を組み合わせられます。一覧は続けて選べるように開いたままで、欄には種類ごとのアイコンが表示されます。',
  'help.guide.roadtrip-corridor.step.2':
    '同じ行の右端にあるドロップダウンで日を選びます。レールにカードがある日が選べます。選んだ日のルートの計算が終わるまで、「検索」は待機します。',
  'help.guide.roadtrip-corridor.step.3':
    '「範囲」で、道路の両側をどこまで探すかを2 km、5 km、10 kmから選び、「検索」をクリックします。',
  'help.guide.roadtrip-corridor.step.4':
    '結果は種類ごとにまとめられ、通過する順に並びます。それぞれ、ルートからの距離と、その日のドライブのどのあたりにあるかが表示されます。',
  'help.guide.roadtrip-corridor.step.5':
    '結果のプラス「追加」をクリックします。「立ち寄り先として追加」に追加される日と位置が表示されるので、「立ち寄りの種類」と「この立ち寄り先での滞在時間」を入力します。充電スポットには「空き状況と料金」も表示されます。「追加」でドライブに追加され、「詳細を追加」では代わりに場所のフォーム全体が開きます。',
  'help.guide.roadtrip-corridor.result':
    '追加した立ち寄り先が、実際に通過する地点に種類のアイコン付きで表示されます。その日はその立ち寄り先を通るようにルートが計算し直され、一覧は空になります。次の立ち寄り先はもう一度検索してください。',
  'help.guide.roadtrip-corridor.tip.1':
    '「検索」を押すまで検索は行われません。1回の検索で、共有サービスに多くのリクエストが送られるためです。',
  'help.guide.roadtrip-corridor.tip.2':
    '「名前で絞り込む」では、検索し直さずに結果を絞り込めます。「結果を消去」で一覧が空になり、ピンも消えます。結果をクリックするとマップ上に表示されます。',
  'help.guide.roadtrip-corridor.tip.3':
    '結果をマップからルート上にドラッグすることもできます。同じ道を2回通るときは、この方法で区間を自分で選べます。「検索」の隣の「手動」では、検索で見つからなかった場所を名前で調べて追加できます。',
  // roadtrip-via
  'help.guide.roadtrip-via.title': '経由地を通るように区間を変える',
  'help.guide.roadtrip-via.goal': '立ち寄り先を追加せずに、区間を通りたい道路に変えます。',
  'help.guide.roadtrip-via.step.1':
    '変えたい区間を地図に表示します。レールで立ち寄り先をクリックし、地図の上に開いたカードを閉じます。',
  'help.guide.roadtrip-via.step.2':
    '描かれたルートをクリックします。クリックした区間に経由地点が追加され、その区間が経由地点を通るように計算し直されます。',
  'help.guide.roadtrip-via.step.3':
    '行程が更新されます。その日のヘッダーに新しい距離と運転時間が表示され、経由地以降のすべての到着時刻も変わります。',
  'help.guide.roadtrip-via.step.4':
    'ハンドルにカーソルを合わせると、操作方法が表示されます：ドラッグでルートを変更、右クリックで削除。別の場所にドラッグすると、新しい地点を通るように区間が描き直されます。',
  'help.guide.roadtrip-via.step.5': 'ハンドルを右クリックすると削除されます。区間は再び直行ルートになります。',
  'help.guide.roadtrip-via.result':
    '区間が選んだ道を通るようになり、その日の距離、運転時間、到着時刻が再計算されます。',
  'help.guide.roadtrip-via.tip.1':
    '経由地点は立ち寄り先ではありません。番号、滞在時間、到着時刻はなく、その日の立ち寄り先の数にも含まれません。',
  'help.guide.roadtrip-via.tip.2':
    'ハンドルはズームレベル9以上でだけ表示されるため、旅行全体を表示した地図では線だけが表示されます。',
  'help.guide.roadtrip-via.tip.3':
    '描かれた区間から2 km以上離れた場所や、飛行機、電車、フェリーをクリックしても無視されます。',
  // roadtrip-alternatives
  'help.guide.roadtrip-alternatives.title': '区間の別の道順を試す',
  'help.guide.roadtrip-alternatives.goal':
    'ドライブの一部区間について、ルーターが提案するほかのルートを見て、1つを選びます。',
  'help.guide.roadtrip-alternatives.step.1':
    'サイドバーでドライブの帯をクリックします。2つの立ち寄り先の間にある、区間の距離と所要時間が表示された行です。ラベルは「別のルート」です。',
  'help.guide.roadtrip-alternatives.step.2':
    'マップの上に「この区間の走り方」が開き、道ごとにその距離が一覧表示されます。マップには各道が運転時間とともに表示されます。現在の道は濃い青、ほかの道は薄い青です。',
  'help.guide.roadtrip-alternatives.step.3':
    '項目にカーソルを合わせると、その道路が強調表示されます。「現在」は今使っている道路、「最速」はいちばん速い道路です。ほかの道路には、どれだけ遅いか、どの道路の種類を避けているかが表示されます。',
  'help.guide.roadtrip-alternatives.step.4':
    '項目をクリックするとそのルートを使います。「閉じる」で今のルートのままにします。',
  'help.guide.roadtrip-alternatives.result':
    'その区間が選んだ道路を通るようになり、横の列の距離とそれ以降の到着時刻も変わります。',
  'help.guide.roadtrip-alternatives.tip.1':
    '別の道を選ぶと、TREK はまずロードトリップのルーターでその道を確認します。そのうえで、必要最小限の経由地でその区間をその道に固定し、区間にあった経由地は置き換えます。ルーターがたどれない道は保存されません。ルーター自身が選んだ道に戻すと、経由地は再び削除されます。',
  'help.guide.roadtrip-alternatives.tip.2':
    '「高速道路なし」「有料道路なし」「フェリーなし」は、独自の速度モデルを持つ別のエンジンで計算されるため、所要時間をほかのルートと比べることはできません。',
  // roadtrip-limits
  'help.guide.roadtrip-limits.title': '車と運転の上限を設定する',
  'help.guide.roadtrip-limits.goal': 'どんな車で走るか、休憩なしでどのくらい走りたいかを TREK に設定します。',
  'help.guide.roadtrip-limits.step.1':
    '「運転の設定」は右の列の検索の下にあります。バッジに設定内容が表示されます。クリックすると開きます。',
  'help.guide.roadtrip-limits.step.2':
    '「運転」の「連続運転の上限」と「1日の運転」は分単位です。空欄はオフで、何も警告されません。',
  'help.guide.roadtrip-limits.step.3':
    '「車両」で、車の種類を選びます。「ガソリン」は給油の立ち寄り先だけ、「電気」は充電の立ち寄り先だけ、「両方」はどちらでも補給します。',
  'help.guide.roadtrip-limits.step.4':
    '「満タンでの航続」か「1回の充電での航続距離」を自分で入力します。または、「補給する量」の下の「車のデータから計算する」を開くと、「タンク容量」と「消費量」、または「バッテリー容量」「消費量」「バッテリー劣化」から航続距離が計算されます。',
  'help.guide.roadtrip-limits.step.5':
    '左の列の「できるだけ避ける」は希望であって禁止ではありません。ほかに道がない日はその道路を使い、日のヘッダーにメモが表示されます。',
  'help.guide.roadtrip-limits.step.6':
    '「閉じる」をクリックします。カードのバッジに設定内容が表示され、レールでは制限を超える区間と日にすべて印が付きます。',
  'help.guide.roadtrip-limits.result':
    'カードのバッジに設定内容が表示されます。上限を超えた区間と日には、行程にバッジが付きます。',
  'help.guide.roadtrip-limits.tip.1': '設定は旅行ごとなので、メンバー全員が同じ車、同じ上限で計画します。',
  'help.guide.roadtrip-limits.tip.2':
    '「補給する量」は、立ち寄り先でタンクやバッテリーをどこまで満たすかを示します。旅行中に100 %まで充電することはまずないためです。給油・充電の立ち寄り先では、行のバッテリーバッジで個別に変更できます。',
  'help.guide.roadtrip-limits.tip.3':
    '「ルートの線」の「日をつなぐ」をオンにすると、ある日の最後の立ち寄り先から翌日の最初の立ち寄り先までの運転もルートに含まれます。「毎日を宿泊先で始めて宿泊先で終える」をオンにすると、毎日その夜に予約した宿泊先から始まり、宿泊先で終わります。「日ごとに色を分ける」をオンにすると、日ごとに違う色で表示されます。',
  // roadtrip-day-window
  'help.guide.roadtrip-day-window.title': '運転する日の開始時刻と終了時刻を決める',
  'help.guide.roadtrip-day-window.goal': '決めた時刻で運転を終え、その日の終点を設定します。',
  'help.guide.roadtrip-day-window.step.1':
    '右の列で「運転の設定」を開き、ダイアログの左の列にある「毎日の移動時間」を見つけます。',
  'help.guide.roadtrip-day-window.step.2':
    '「一日の開始時刻」を設定します。これだけでは何も変わりません。下のメモにあるとおり、両方の時刻が必要です。',
  'help.guide.roadtrip-day-window.step.3':
    '「一日の終了時刻」を設定します。その時刻でドライブが止まり、翌朝に続きます。横の列に「一日の終了」と「移動を再開」の行が表示されます。',
  'help.guide.roadtrip-day-window.step.4':
    '「1日の終了地点」で、終了時刻になったら道の途中で休む「ルートの途中」か、次の運転でその時刻を過ぎてしまう前に止まる「最後の場所」を選びます。',
  'help.guide.roadtrip-day-window.step.5':
    '「閉じる」をクリックします。「運転の設定」カードに、2つの時刻がバッジで表示されます。',
  'help.guide.roadtrip-day-window.result':
    'ドライブが設定した長さの移動日に分けられ、収まらない分は最後の日のあとに計算で追加された日に続きます。自分で作った日とその場所は変わりません。',
  'help.guide.roadtrip-day-window.tip.1':
    'どちらかの時刻を消すと、この機能は再びオフになります。立ち寄り先に自分で設定した時刻が常に優先されます。',
  'help.guide.roadtrip-day-window.tip.2':
    '毎日の移動時間を設定すると、日は常につながります。ある日の最後の立ち寄り先から翌日の最初の立ち寄り先までの運転も、ルートに含めて計算されます。',
  'help.guide.roadtrip-day-window.tip.3':
    '各日の終了地点は、地図上にも日の番号付きの月のマーカーで表示されます。マーカーをルートに沿って、または場所の上にドラッグすると、別の場所でその日を終えられます。右クリックすると自動の終了地点に戻ります。このダイアログの「一日の終了地点を自動に戻す」で、これらの変更をすべて元に戻せます。特定の立ち寄り先で1日を終えるには、立ち寄り先をクリックし、カードで「ここで一日を終了」をオンにします。',
  // roadtrip-refuel
  'help.guide.roadtrip-refuel.title': '燃料が切れる前に補給する',
  'help.guide.roadtrip-refuel.goal': '車がまだ走れる範囲のルート上で給油できる場所を見つけ、ドライブに追加します。',
  'help.guide.roadtrip-refuel.step.1':
    '航続距離を設定すると、横の列で燃料やバッテリーが切れる区間に帯が表示されます。「ここで燃料切れ」（電気自動車では「ここでバッテリーが切れます」）と、その区間のどのあたりかが表示されます。',
  'help.guide.roadtrip-refuel.step.2':
    '帯にあるランプのアイコンがボタンです。「給油所を探す」、電気自動車なら「充電スポットを探す」です。その地点より手前の道沿いを検索し、検索中は「ルート沿いを検索中…」と表示されます。',
  'help.guide.roadtrip-refuel.step.3':
    '最大3か所のスタンドが表示され、それぞれルートからの距離と、到着時の残りの航続距離がわかります。',
  'help.guide.roadtrip-refuel.step.4':
    '候補のプラスをクリックすると、給油の立ち寄り先として追加できます。種類と時刻が入力された状態で「立ち寄り先として追加」が開き、「追加」をクリックすると、ルートが実際にそこを通る地点で区間に追加されます。',
  'help.guide.roadtrip-refuel.result':
    '立ち寄り先が専用のアイコン付きで正しい区間に追加され、航続距離はそこから計算し直されます。帯は燃料が新たに切れる地点に移動します。ほかに立ち寄らずにドライブの終点まで行けるなら、帯は消えます。',
  'help.guide.roadtrip-refuel.tip.1':
    '航続距離は、日をまたいで最後の給油・充電の立ち寄り先から計算されます。どの立ち寄り先を数えるかは「何で走るか」で決まり、「ガソリン」なら給油、「電気」なら充電の立ち寄り先だけです。',
  'help.guide.roadtrip-refuel.tip.2':
    '検索では、燃料が切れる地点より前の道路を対象にし、予備を残して寄り道を往復分で計算するので、表示される場所はどれも確実にたどり着けます。',
  'help.guide.roadtrip-refuel.tip.3':
    '結果がない場合は、もう一度検索できます。場所の検索は共有のサービスで、タイムアウトすることがあるため、ボタンが「再試行」に変わります。',
  // roadtrip-track
  'help.guide.roadtrip-track.title': '1日のルートをインポートしたトラックに合わせる',
  'help.guide.roadtrip-track.goal':
    'GPX や KML のトラックとしてインポートした景色のよいルートを、1日のドライブに使います。',
  'help.guide.roadtrip-track.step.1':
    '日のヘッダーにある「トラック」バッジをクリックします。その日のダイアログが開きます。',
  'help.guide.roadtrip-track.step.2':
    'トラックを選びます。各トラックには距離と、この日のルートに沿っているか、どのくらい離れているかが表示されます。一番近いトラックが先頭に並びます。',
  'help.guide.roadtrip-track.step.3':
    '「このトラックをたどる」をクリックします。TREKが、ドライブがトラックから最も離れている場所に経由地点を追加してルートを計算し直し、これを何回か繰り返します。',
  'help.guide.roadtrip-track.step.4':
    'ダイアログに、配置した経由地点の数と、ドライブがトラックにどこまで近づいたかが表示されます。すでにトラックに沿っていた場合はその旨が表示されます。左下の「経由地点を削除」で経由地点を外すと、ルーターがその日を計画し直します。ダイアログを閉じてもトラックは残ります。',
  'help.guide.roadtrip-track.result':
    'その日のドライブが、ルーターが選ぶ道路ではなくトラックに沿って進みます。「トラック」バッジにカーソルを合わせると、トラックの名前が表示されます。経由地点でドライブがトラックに沿っている場合は、バッジも強調表示されます。',
  'help.guide.roadtrip-track.tip.1':
    'ダイアログには、経路を持つ旅行の場所が表示されます。対象は、「日」の下の場所の列で「ファイルをインポート」から取り込んだGPXかKMLで、GPXなら「ルート」か「トラック（経路付き）」、KMLなら「パス（ライン）」にチェックを入れたものです。「ファイルをインポート」はツアーアドオンがオフのときだけ使えます。ツアーがオンの場合、GPXはツアーになり、このダイアログには表示されません。旅行にトラックがない間は、どの日にもバッジは表示されません。',
  'help.guide.roadtrip-track.tip.2':
    'トラックをたどると、その日の区間にあった経由地点は置き換えられます。区間を手で調整するのは、トラックをたどる前ではなく後にしてください。',
  'help.guide.dateless-trip.step.1': '「新しい旅行」をクリックして、旅行に名前を付けます。',
  'help.guide.edit-trip.tip.2': 'ここで同行者を追加・削除すると、「更新」を押さなくてもすぐに反映されます。',
  'help.guide.trip-reminder.result':
    '旅行が始まる指定日数前に、通知を受け取っているチャンネルにリマインダーが届きます。',
  'help.guide.upcoming-reservations.step.1':
    '右の列にある「今後の予約」を見ます。すべての旅行の予約のうち直近の6件が、近い順に日付、時刻、タイプ付きで並びます。',
  'help.guide.half-company-holiday.step.1': 'ツールバーを「会社休日」に切り替えます。',
  'help.guide.edit-holiday-calendar.result': '変更するたびに、グリッドと凡例がすぐに更新されます。',
  'help.guide.person-color.result': 'その人が記録した日がすべて新しい色で表示されます。',
  'help.guide.answer-fusion-request.step.1':
    '招待を受けたらVacayを開きます。「統合の招待」ダイアログが自動で開きます。',
  'help.guide.log-for-partner.step.1':
    '「人数」カードでその人の名前をクリックします。チェックマークが付けば選択されています。',
  'help.guide.dissolve-fusion.step.1': '「設定」を開きます。',
  'help.guide.country-places.step.2': 'カード内の「場所」バッジ（ピンのアイコン）をクリックします。',
  'help.guide.search-place.tip.2':
    'その地域がすでにマークされている場合は、代わりに削除するかどうかをポップアップで確認されます。',
  'help.guide.tour-activity-stats.step.4':
    '右側のバッジは、合計の根拠を示します。「予定」は旅行の計画に基づいて数えたツアー、「記録」は実際のトラックをリンクしたツアーです。「これから」「日なし」「日付なし」は、まだ合計に含まれていないツアーの数です。「i」を押すとルールを確認できます。',
  'help.guide.move-to-list.step.2':
    'このリストにも残すなら「リストに複製」、このリストから外すなら「リストに移動」をクリックします。',
  'help.guide.accept-list-invite.title': 'リストへの招待を承認する',
  'help.guide.tour-collection-add-to-trip.step.3':
    '「ウェイポイント」で、ウェイポイント付きのタイルを選ぶと出発地、立ち寄り先、到着地が順番どおりに追加されます。保存した線だけを追加するなら「線のみ」を選びます。',
  'help.guide.tour-collection-manage.step.1':
    'リストを開きます。保存したツアーごとに、グレード、タイプ、保存元の旅行、距離と獲得標高、ウェイポイントの数が表示されます。旅行名にカーソルを合わせると、保存した人がわかります。',
  'help.guide.entry-draft.step.1': 'エディターの右の列で「下書き」をオンにします。',
  'help.guide.journey-map-layers.step.3':
    '地図上の白抜きのピンか小さな点をクリックします。カードに内容が表示されます。計画した場所ならその日、滞在なら「エントリーを開く」が表示され、そこから該当する1日のレポートに移動できます。',
  'help.guide.journey-keep-route.step.3': '「ルートを保存」をクリックします。',
  'help.guide.journey-day-stays.step.3':
    '不要な滞在で「訪れていない場所」をクリックします。その滞在が一覧から消えます。',
  'help.guide.journey-take-over-day.step.3':
    '1日分を1つのエントリーにまとめるなら、「エントリー」を「1日のレポート」に切り替えます。選んだ滞在がすべて、時刻付きで1つのエントリーに並びます。',
  'help.guide.journey-auto-prepare.step.2': '「記録された日」で「記録された日を自動で準備する」をオンにします。',
  'help.guide.photo-location.step.2': '「写真」で「写真から記録の場所を設定」をオンにします。',
  'help.guide.link-trip.tip.3':
    'まだリンクしていない旅行の日にエントリーを書くと、エディターのエントリー内に「旅行をリンク」が表示されます。',
  'help.ctx.settings-plugins.summary':
    '管理者がインストールしたプラグインの個人設定です。各プラグインが求めるキーや設定と、プラグインがあなたに代わって行った操作の記録があります。このタブは、プラグインが有効なときだけ表示されます。',
  'help.ctx.settings-about.bullet.3':
    'Ko-fi、Buy Me a Coffee、Discordから、TREKを支援したり、開発者と話したりできます。',
  'help.guide.language-region.step.3':
    '「表示通貨」を設定します。旅行ごとにその旅行の通貨で見たい場合は「旅行の通貨」のままにします。続けて「温度単位」「距離単位」「時刻形式」と、「週の開始」の曜日を選びます。',
  'help.guide.travel-map-prefs.step.3':
    '「地図でスポットを探す」をオンにすると、近くの場所を探すカテゴリのピルが表示されます。「予約コードをぼかす」は、カーソルを合わせるかタップするまで予約番号を隠します。「宿泊先を起点にルートを最適化」は、1日の始まりと終わりをホテルにします。',
  'help.guide.web-push-device.step.2': '上部の「通知」カードの「プッシュ」列で、端末に送るイベントを選びます。',
  'help.guide.connect-airtrail.goal': '自分のAirTrailのフライトをTREKにインポートして同期します。',
  'help.guide.connect-dawarich.goal': '自分のDawarichから、実際に行った場所をTREKに読み込みます。',
  'help.guide.tour-connect-wanderer.goal':
    '自分のwandererのトレイルをTREKで読み込み、ツアーとしてインポートできるようにします。',
  'help.guide.tour-wanderer-watch.title': 'wandererのトレイルが変わったら通知を受け取る',
  'help.guide.plugin-settings.tip.2':
    '「通知」にあるプラグインのチャンネルには「設定する」ボタンがあり、このページが開きます。',
  'help.guide.default-user-settings.result':
    '新しいアカウントと、これらの設定を一度も変えていないユーザー全員に、あなたの選択が適用されます。',
  'help.guide.own-routing-engine.goal':
    '公開サーバーの代わりに、自分で運用するOSRMやValhallaのサーバーで、日程とロードトリップのルートを計算します。',
  'help.guide.admin-passkeys.tip.1':
    'TREKがまだドメインを判別できない場合は警告が表示され、APP_URLかRelying Party IDを設定するまでパスキーは表示されません。',
  'help.guide.rotate-jwt-secret.step.1':
    '「設定」タブ下部の「危険ゾーン」で、「JWTシークレットをローテーション」の横にある「更新」をクリックします。',
  'help.guide.storage-backends.tip.3':
    '写真のキャッシュはTREKが再ダウンロードできるため、ミラーリングしてもたいていは容量の無駄になります。',
  'help.guide.admin-channels.step.3':
    '下の「通知」カードで、イベントごとに送信するチャンネルを選びます。対象は「新しいバージョン」「ストレージレプリカの障害」「パドル地域のリクエスト」です。スイッチはそれぞれすぐに保存されます。',
  'help.guide.notification-defaults.tip.1':
    '「オフ」は既定値で、各ユーザーが自分でオンにできます。「ブロック」は全員に対してオフにします。',
  'help.ctx.notifications.bullet.4':
    '各通知の時刻の横にある「既読にする」（二重のチェック）と「削除」（ゴミ箱）は、その通知だけに使えます。上部の「すべて既読」と「すべて削除」は、リスト全体が対象です。',
  'help.guide.read-notifications.tip.2': 'ボタンのない通知はお知らせだけです。パネルで読んで、そのまま既読にします。',
  'help.guide.filter-notifications.result': '未読の通知だけが、新しい順に表示されます。',
  'help.guide.delete-notifications.title': '通知を削除する',
  'help.guide.notification-settings.goal':
    'ベルのアイコンに表示するイベントと、メール、Webhook、ntfy、プッシュでも受け取るイベントを決めます。',
  'help.guide.public-link.step.4': '「リンク作成」をクリックし、「コピー」して送ります。',
  'help.guide.link-journal.step.2': '「ジャーナルをリンク」をクリックし、「日記を選択」で自分の日記を選びます。',
  'help.guide.dawarich-stays.title': '記録された滞在を場所にする',
  'help.guide.dawarich-stays.tip.2': '滞在から作った場所を削除すると、その滞在は待機中としてリストに戻ります。',
  'help.guide.leave-stop-off-route.goal':
    '歩いて通るだけの場所や地図に表示したいだけの場所を、ルートには含めずにその日の立ち寄り先として残します。',
  'help.guide.day-route.tip.4':
    'その日には入れたいけれどルートには含めたくない立ち寄り先は、メニューで「ルートから外す」を選びます。',
  'help.guide.move-booking-day.step.2':
    '行を別の日のカードのヘッダーにドラッグします。1日だけの予約は、まるごとその日に移ります。複数日にまたがる予約の場合、「出発」の行では開始日、「到着」の行では終了日が移ります。',
  'help.guide.place-image-from-file.title': '添付した写真を場所の画像にする',
  'help.guide.place-image-from-file.tip.2': '立ち寄り先にピン留めした写真や、その予約に添付した写真も選べます。',
  'help.guide.place-own-hours.step.5':
    '「更新」をクリックします。カードの「営業時間」に自分で入力した時間が表示され、上部の「営業中」「終了」もそれに基づいて判定されます。',
  'help.guide.confirm-stay-booking.step.3':
    '上部の「保留」をクリックします。ツールチップに「確定にする」と表示され、点が緑に変わります。',
  'help.guide.map-nearby-places.tip.4':
    '検索に失敗したカテゴリには赤い点が付き、「このエリアを検索」が警告マーク付きの赤に変わります。クリックすると再試行します。',
  'help.guide.tour-map-lines.tip.1': '日の列で日を折りたたむと、その日のツアーと立ち寄り先が地図から消えます。',
  'help.guide.car-stops.step.3':
    'ヘッダーにタイトルを入力します。「ルート」で、車を受け取る場所を「出発地」、返す場所を「到着地」で選びます。入力する前から旅行の場所が候補に出ます。「受取」と「受取時刻」には受け取る日時、「返却」と「返却時刻」には返す日時を入れます。',
  'help.guide.transport-details.step.1':
    '「移動」タブでカードをクリックします。タブの上に詳細が開き、ヘッダーはカードと同じ色になります。日程にある移動の行からも同じ詳細が開きます。',
  'help.guide.export-transports-csv.tip.2':
    '「予約」タブにも同じアイコンがあり、末尾がbookings.csvの別ファイルを書き出します。',
  'help.guide.group-sort-bookings.step.2':
    '「グループ化」で「ステータス」「日」「タイプ」「グループ化しない」のいずれかを選びます。タブはすぐにそのグループごとに並び替わります。',
  'help.guide.export-bookings-csv.result':
    '旅行名とタブ名が付いたファイル（例：autumn-in-japan-bookings.csv）がブラウザーでダウンロードされます。タブに表示されていた予約が1件につき1行で入っています。',
  'help.guide.arrange-packing-list.result':
    'リストはドラッグした順に並び、アイテムはこの設定をオフにするまで「名前順」に並びます。自分で並べた順番もTREKに保存されています。',
  'help.guide.count-packed-pieces.step.2':
    '数量の前に、マイナスとプラスが付いたカウンター（0/5）が表示されます。バッグに1つ入れるたびにプラスをクリックします。',
  'help.guide.expense-receipts.step.4':
    '台帳に戻ると、その行の名前の横に「レシート」チップが付いています。複数ある場合は枚数が括弧内に表示されます。クリックするとレシートが開きます。',
  'help.guide.final-budget.tip.3':
    '旅行から抜けた人も、その人との間に未精算のお金が残っている間は、「残高」と「最終負担額」に行が残ります。',
  'help.guide.files-sync-settings.step.2':
    'フローバーには、TREKと自分の保管先、それぞれにあるドキュメント、その間の2本のレーン「保管先へ」と「保管先から」が表示されます。「保管先へ」をクリックするとオフになり、レーンがグレーになって、レーンの下に「受信のみ」と表示されます。もう一度クリックするとオンに戻ります。',
  'help.guide.files-sync-settings.tip.4':
    'これらを変更できるのは、旅行の所有者か管理者だけです。ほかのメンバーには「ドキュメントは双方向に移動します」のような説明付きのフローバーが表示されますが、「設定」はありません。',
  'help.guide.manage-notes.step.2':
    '「展開」を押すと、メモの全文と「ウェブサイト」「ファイル」が表示されます。ファイルをクリックするとプレビューできます。下部の「編集」でそのままエディターに切り替わり、右上の×でメモを閉じます。',
  'help.guide.note-categories.goal': 'グループのメモに名前と色の付いたカテゴリを作り、カテゴリごとに表示します。',
  'help.guide.note-categories.tip.1':
    'ゴミ箱で削除できるのは、どのメモにも使われていないカテゴリだけです。使用中のカテゴリは、そのメモを別のカテゴリに移すまで一覧に残ります。',
  'help.guide.roadtrip-reorder.title': '立ち寄り先を並べ替える、別の日に移す',
  'help.guide.roadtrip-reorder.tip.3':
    '固定した時刻があっても確認はされません。レールがすぐにその日を再計算し、時間内に着けなくなった立ち寄り先に印を付けます。',
  'help.guide.roadtrip-overnight.step.3':
    'ダイアログ上部の「宿泊」で1泊を追加し、「休憩」でしばらく立ち寄る場所にします。ホテルは「宿泊」、キャンプ場は「休憩」の状態で開きます。宿泊に必要なのは「チェックイン」だけで、空欄のままでもかまいません。',
  'help.guide.roadtrip-stop-fill.step.1':
    'レールの給油または充電の立ち寄り先で、バッテリーのバッジをクリックします。その立ち寄り先でどこまで補給するかが表示されます。「補給する量」の値を使っている間は薄く、独自の値を設定すると濃く表示されます。',
  'help.guide.roadtrip-bookings.step.1':
    'その日に、出発地と到着地の両方を指定して、「飛行機」「電車」「フェリー」「クルーズ」「バス」の予約を登録します。ドライブには自動で組み込まれ、道路は乗り物が出るターミナルで終わり、到着した場所からまた始まります。',
  'help.guide.roadtrip-google-import.result':
    'ルートの立ち寄り先がその日の最後の立ち寄り先の後に追加され、レールと地図のルートがそこを通るようになります。',
  'help.guide.roadtrip-hazards.step.3':
    '警告は地図上にエリアとして表示されます。クリックすると、内容、報告したサービス、最終更新日時がわかります。',
  'help.ctx.trip-tours.bullet.2':
    '上部の「GPXまたはKMLをインポート」で、ファイルをツアーとして取り込みます。その下のフィルターボタン（最初は「すべて」とツアー数）で、ステータス、ソース、ルーティングの上限、タイプで一覧を絞り込めます。',
  'help.guide.tour-show-list.step.2':
    '1行が1つのツアーです。色付きのバーは地図上の線の色で、丸いタイルには、TREKで計画したハイキングならルーティングの上限（T1〜T6）、それ以外はタイプのアイコンが表示されます。名前の下のバッジには、入っている日、時間、距離、獲得標高が表示されます。複数日ツアーでは、数字付きの月のアイコンでステージ数がわかります。',
  'help.guide.tour-add-to-day.title': 'ツアーを日に入れる',
  'help.guide.tour-add-to-day.tip.2':
    '最後のステージより前に旅行が終わる場合は、収まる最後のステージまでが表示され、それ以降のステージは日なしのままになります。',
  'help.guide.tour-day-times.step.3':
    '「更新」をクリックします。行に「開始 → 終了」が表示されます。計算された終了時刻は薄く表示され、推定値には≈、滞在の時刻が未設定の間は≥、日付をまたぐ場合は+1が付きます。カーソルを合わせると計算方法がわかります。',
  'help.guide.tour-remove-from-day.goal': 'ツアーを削除せずに予定から外します。',
  'help.guide.tour-filter-list.goal':
    '長い一覧を、未計画のもの、ファイルから取り込んだもの、特定のタイプなど、見たいツアーだけに絞り込みます。',
  'help.guide.tour-filter-list.result':
    '絞り込んだツアーだけが一覧に表示されます。ほかのツアーも旅行には残っています。',
  'help.guide.tour-hide-on-map.result':
    '地図には見たいツアーだけが表示され、非表示にしたツアーは薄い表示で一覧に残ります。',
  'help.guide.tour-import-plan-tab.result':
    'トラックが旅行のツアーになり、一覧にGPXバッジ付きの行が、地図に線が追加されます。',
  'help.guide.tour-detail-read.title': 'ツアーを開いてカードを見る',
  'help.guide.tour-detail-read.step.7': 'カード上部の×をクリックするか、Escapeキーを押して閉じます。',
  'help.guide.tour-rename-colour.goal': 'ツアーにわかりやすい名前と、地図で見やすい線の色を付けます。',
  'help.guide.tour-take-along.title': 'ツアーをスマートフォンやGPSにダウンロードする',
  'help.guide.tour-take-along.tip.4':
    '「ツアー」タブでは、左の列の上部に同じダウンロードがあります。ツアーに未保存の変更があると、先に保存するよう求められます。',
  'help.guide.tour-copy-keep.tip.1':
    'どちらもコピーです。あとでツアーを変更しても、コピーにもコレクションに保存した版にも反映されません。',
  'help.guide.tour-packing-link.step.2':
    '「リンク先」で「持ち物リスト全体」か、その中のリストを1つ選びます。各行にアイテム数が表示されます。',
  'help.guide.tour-files.title': 'ツアーにファイルを添付する',
  'help.guide.tour-activity-link.title': '実際に通ったトラックをリンクする',
  'help.guide.tour-activity-link.tip.2':
    'リンクできるのは、ツアーの計画に使われていないインポート済みのトラックだけです。1つのトラックは1つのツアーにしかリンクできません。',
  'help.guide.tour-activity-compare.step.4':
    'トラックの下の「変更」で別の記録を選べます。「解除」でツアーから外しても、トラックはインポートとして旅行に残ります。',
  'help.guide.tour-origin-check.step.3':
    '「ツアー」タブで描いたツアーには「TREKで計画」と表示され、「作成日」に日付が出ます。',
  'help.ctx.trip-tour-planner.bullet.2':
    '左のレールがエディターです。何も開いていないときは「新しいツアーを計画」が表示されます。ツアーを開くと、名前、タイプ、ウェイポイント、そのタイプ用のカード、詳細が表示され、下部に「キャンセル」と「保存」があります。',
  'help.guide.tour-open-workspace.step.2':
    '左のレールがエディターです。ツアーを開いていないときは「新しいツアーを計画」が表示され、地図上でツアーを作り始められます。',
  'help.guide.tour-open-workspace.tip.3':
    'エディターに未保存の変更があるまま別のツアーを開くと、先に確認されます。「変更を破棄」するか、編集を続けるかを選びます。',
  'help.guide.tour-draw-route.step.5':
    '進む順に次の地点をクリックします。クリックするたびにその地点が新しい終点になり、2点目からはTREKが道に沿ってルートを計画します。',
  'help.guide.tour-type-profile.goal':
    'ツアーのタイプと、自転車ツアーならプロフィールも選び、ルートが適した道を通るようにします。',
  'help.guide.tour-edit-points.title': '地点を移動、並べ替え、削除する',
  'help.guide.tour-edit-points.tip.1':
    '最初の地点には「開始」、最後の地点には「終了」のバッジが付きます。地点をいちばん上かいちばん下に動かすと、そこが開始または終了になります。',
  'help.guide.tour-shaping-points.step.4':
    '立ち寄り先を形状ポイントに、または形状ポイントを立ち寄り先に変えるには、その行の「その他の操作」を開き、「形状ポイントにする」か「停留地点にする」を選びます。',
  'help.guide.tour-loop-reverse.step.2': '最後の行に「スタートへ戻る」と表示され、地図上のルートが出発地で終わります。',
  'help.guide.tour-leg-by-hand.step.1':
    '区間の始まりの地点で「その他の操作」を開き、「次の区間を手で描く」を選びます。',
  'help.guide.tour-trip-places.goal': '旅行ですでに計画した場所を、ツアーの立ち寄り先として追加します。',
  'help.guide.tour-trip-places.result': '旅行の場所と同じ名前の立ち寄り先がツアーに追加されます。',
  'help.guide.tour-details-times.tip.2':
    'ハイキングの「詳細」には、「登山道の難易度上限」と「ルートの選び方」もあります。詳しくはハイキングのガイドを参照してください。街歩きには「休憩」がなく、代わりに各立ち寄り先での滞在時間が使われます。',
  'help.guide.tour-save.step.4': 'ツアーが「この旅行のツアー」に表示されます。まだどの日にも入っていません。',
  'help.guide.tour-edit-saved.step.2':
    '新しいツアーと同じように、必要な部分を変更します。地点の移動や追加、タイプの切り替え、詳細の編集（この例では「説明」）ができます。',
  'help.guide.tour-summary-profile.goal': 'ツアーの長さと勾配、ルート上のどこがどの標高かを確認します。',
  'help.guide.tour-summary-profile.result': 'ツアーの長さ、獲得標高、所要時間、急になる場所がわかります。',
  'help.guide.tour-list-manage.tip.1':
    '複数の日に入っていても、各ツアーは合計で1回だけ数えられます。先頭に≥が付いた合計には、含まれていないツアーがあります。カーソルを合わせると件数がわかります。',
  'help.guide.tour-delete.tip.1': 'この操作は取り消せません。「元に戻す」でもツアーは戻りません。',
  'help.guide.tour-saved-elsewhere.step.3':
    'それでも「保存」をクリックすると、代わりに「その間に変更されました」が開き、何も上書きされません。',
  'help.ctx.trip-tour-import.bullet.2':
    '「インポートのプレビュー」では、保存する前に、ファイル内のすべてのトラックが距離、登り、下り、ポイント数とともに地図に表示されます。「取り込む種類」で、トラックが何なのかを指定します。',
  'help.guide.tour-import-gpx.step.3':
    '「インポートのプレビュー」が開きます。この時点では何も保存されていません。地図にはコース全体が表示され、ファイル内のトラックが1つずつ、距離、登り、下り、ポイント数付きの番号付きの行になります。記録されたトラックには、記録日時と所要時間も表示されます。',
  'help.guide.tour-import-gpx.result':
    'ツアーが「この旅行のツアー」に追加されます。まだどの日にも入っていません。トラックが1つだけなら、GPXツアーとしてすぐに地図上に開きます。',
  'help.guide.tour-view-import.tip.3': 'wandererのトレイルも同じように、wandererツアーとして開きます。',
  'help.guide.tour-plan-from-import.tip.1': '「キャンセル」で提案を破棄します。保存するまで何も保存されません。',
  'help.guide.tour-restore-recorded.step.2': '「記録されたトラックを復元」をクリックします。',
  'help.guide.tour-take-over.step.2': '「別の旅からツアーを取り込む」を選びます。',
  'help.guide.tour-take-over.result':
    '取り込み完了のメッセージが表示され、ツアーがエディターで開きます。あとは日に入れるだけです。',
  'help.guide.tour-import-wanderer.tip.2':
    'インポートしたものはコピーです。あとでwandererで変更してもツアーは変わりません。トレイルが変わったかどうかは、ツアーの「出どころ」にある「ソースを確認」でわかります。',
  'help.ctx.trip-tour-map.bullet.3':
    '地図上部の「場所や住所を検索」を使うと、ツアーに何も追加せずに、町や山小屋、山頂へ地図を移動できます。',
  'help.guide.tour-map-layers.result':
    'ツアーに合った地図の上にツアーが表示され、どの地図を使っているかがピルでわかります。',
  'help.guide.tour-along-search.step.3':
    '「ルートからこの距離以内」で、線からどこまで離れた場所を探すかを選びます：250 m、500 m、1 km、2 km。',
  'help.guide.tour-along-add-stop.goal':
    '途中で見つけた展望台、山小屋、湧き水を経由するようにツアーのルートを変えます。',
  'help.guide.tour-along-add-stop.tip.3':
    '立ち寄り先を追加できない区間（固定線として追加したヴィア・フェラータや陸上運搬、手で描いた区間）は一覧で薄く表示され、横に理由が表示されます。',
  'help.guide.tour-3d-terrain.result': '3D地形でツアーと急な区間の色分けを確認でき、計画用の平面の地図に戻っています。',
  'help.guide.tour-3d-flyover.step.3':
    '「一時停止」でその場でフライトを止め、「フライオーバーを再生」でそこから再開します。「最初から」で最初に戻り、もう一度フライトを始めます。',
  'help.guide.tour-map-overlays.step.1':
    '「ツアー」タブでスキーツアーを開きます。ゲレンデは最初から表示されています。切り替えは左下のピルにある雪山のアイコン「ゲレンデ、クロスカントリーコース、リフト」です。クリックすると地図から消え、もう一度クリックすると表示されます。',
  'help.ctx.trip-tour-stages.title': '複数日のツアー',
  'help.guide.tour-multi-day.goal': '1つのルートを、移動する日ごとのステージに分けます。',
  'help.guide.tour-multi-day.tip.2':
    '2つのステージを再びつなげるには、月のアイコンが付いた立ち寄り先のメニューで「ステージの終点を外す」を選びます。その立ち寄り先を削除してもつながり、通知に「元に戻す」が表示されます。',
  'help.guide.tour-stages-on-days.step.3':
    '「この日からステージごとに」を選ぶと、ステージ1がその日に、以降のステージが1日ずつ後の日に入ります。「この日にツアー全体」を選ぶと、ルート全体がその1日に入ります。',
  'help.guide.tour-stages-on-days.result':
    'すべてのステージが旅行のそれぞれの日に入り、開いたステージがエディターに表示されます。',
  'help.ctx.trip-tour-hike.bullet.6':
    '右の「ツアーの概要」には、距離、獲得標高、推定の歩行またはランニング時間、休憩、予定の合計時間が表示され、その下に標高プロフィールがあります。エディター下部の「保存」でツアーを保存します。',
  'help.guide.tour-hike-plan.step.6': '左の列の下部にある「保存」をクリックします。',
  'help.guide.tour-hike-trail-details.step.1':
    '「この旅行のツアー」からハイキングを開き、「ウェイポイント」カードの下にある「道の詳細」で「ルートに沿って表示」をオンにします。',
  'help.guide.tour-hike-trail-details.tip.3':
    'このカードでツアーが変わることはありません。使うには接続が必要です。インポートしたハイキングでも同じカードが表示されますが、ルーティングの上限はありません。',
  'help.guide.tour-hike-round.result':
    'ハイキングが選んだ周回ルートをたどり、出発地に戻ります。地図下部の「周回を採用しました」に「元に戻す」があり、「保存」で確定します。',
  'help.guide.tour-hike-compare-ways.step.3':
    '行のバッジには、今の道と比べてどれだけ長いか、高いか、時間がかかるかが表示されます。使いたい道をクリックします。',
  'help.guide.tour-ferrata-add.step.1':
    'ハイキングを開いた状態で、左下の地図ボタンの列にある「ヴィア・フェラータ」をクリックします。バッジは表示範囲内のヴィア・フェラータの数です。ズームインを求められたら拡大してください。',
  'help.guide.tour-ferrata-add.tip.3':
    'ヴィア・フェラータの区間は標高プロフィール上で強調表示されるので、その日のどのあたりで着くかがわかります。',
  'help.guide.tour-run-plan.step.5': '「ツアー名」にランニングの名前を入力し、「保存」をクリックします。',
  'help.guide.tour-run-ways.step.1':
    '「この旅行のツアー」からランニングを開き、「ウェイポイント」カードの下にある「道の詳細」で「ルートに沿って表示」をオンにします。',
  'help.ctx.trip-tour-walk.bullet.1':
    '「ツアーの種類」を「街歩き・観光」にすると、ツアーが街歩きになります。各地点は「ラベル」、滞在時間、重要度を持つ立ち寄り先になります。街歩きには登山の上限も「休憩」欄もなく、代わりに滞在時間が使われます。',
  'help.guide.tour-walk-plan.step.2':
    '立ち寄り先を追加します。「地点を追加」がオンになっていることを確認して各地点で地図をクリックするか、「旅の場所」をクリックして旅行にある場所を選びます。',
  'help.guide.tour-walk-plan.result':
    '街歩きに立ち寄り先が滞在時間付きで並び、「ツアーの概要」で合計されます。日に入れると、各立ち寄り先に着く時刻がわかります。',
  'help.guide.tour-walk-sights.tip.1': 'これは街歩きの立ち寄り先になり、旅行の場所にはなりません。',
  'help.guide.tour-walk-day-times.step.3':
    '「ツアー」タブで街歩きをもう一度開きます。「ウェイポイント」の上部にある「時刻の基準日」に、日と開始時刻が表示されます。複数の日に入れた街歩きでは、クリックして別の日を選べます。',
  'help.guide.tour-walk-google-import.goal':
    'Google Mapsで共有された徒歩ルートを貼り付けて、立ち寄り先を街歩きとして読み込みます。',
  'help.guide.tour-walk-google-import.result':
    'Google Mapsの立ち寄り先が入った新しい街歩きがエディターで開き、すぐに保存できます。',
  'help.guide.tour-walk-check-off.tip.2': '日程の街歩きの行にも、3/7のように件数が表示されます。',
  'help.ctx.trip-tour-bike.bullet.4':
    'MTBプロフィールでは、同じカードに、マッパーが登録したトレイルのグレード（mtb:scale）が表示されます。グレードのない道は「簡単」ではなく「不明」です。',
  'help.guide.tour-bike-profile.step.6': '「ツアー名」に名前を入力し、左のレール下部の「保存」をクリックします。',
  'help.guide.tour-bike-surfaces.goal':
    'ルートのうちアスファルト、砂利、不明がそれぞれどれくらいか、どんな種類の道を通るかを確認します。',
  'help.guide.tour-bike-surfaces.tip.3':
    'カードはルーターが計画したルートをもとにしていて、ツアーは一切変えません。使うには接続が必要です。オフラインのときはその旨が表示され、ルートには影響しません。',
  'help.guide.tour-bike-mtb-grades.tip.1':
    '「データに難度なし」は「簡単」ではなく「不明」という意味です。グレードは、そのトレイルが自分に合うかどうかを示すものではありません。',
  'help.ctx.trip-tour-ski.bullet.3':
    '地図上でクリックした地点は、ゲレンデ、リフト、コースに沿って1つ前の地点とつながります。各地点の下にはその区間がチップで並び、ゲレンデはグレードの色で分数付きで表示されます。計画できない区間は赤くなり、理由とともに修正方法か「直線で描く」が表示されます。',
  'help.guide.tour-ski-plan.step.4':
    '「地点を追加」がオンになっていることを確認し、出発地と行きたい場所を順番に地図上でクリックします。ゲレンデのルーターが、ゲレンデ、リフト、コースに沿って各地点を1つ前の地点とつなぎます。',
  'help.guide.tour-ski-options.title': 'ゲレンデのルーターに滑り方を設定する',
  'help.guide.tour-ski-options.tip.2':
    '「リフトを使う」は、「アルペン」と「スノーボード」では最初からオン、ほかの種目ではオフです。「除外」と「必要ならリフトで下る」は、リフトを使うときだけ表示されます。',
  'help.guide.tour-ski-fix-leg.tip.1':
    '地図上で地点をゲレンデ、コース、リフトの近くまでドラッグすることもできます。指を離すと、区間が計画し直されます。',
  'help.guide.tour-ski-summary.step.2':
    '「滑走」「リフト乗車」「待ち時間」「徒歩」には、それぞれの時間が表示されます。「ゲレンデ」「ゲレンデでの下降」「リフト乗車」には、ゲレンデの長さ、そこで滑り降りる標高差、乗るリフトの数が表示されます。',
  'help.guide.tour-ski-pistes-layer.goal':
    'スキーツアー周辺のゲレンデ、クロスカントリーコース、リフトと、その色の意味を確認します。',
  'help.guide.tour-ski-import.title': 'スキーのトラックをインポートして種類を指定する',
  'help.guide.tour-ski-import.tip.1':
    'インポートしたトラックは記録されたまま保持されます。TREKはゲレンデに合わせないため、カードの「スキー時間」は「計算なし」と表示されます。',
  'help.ctx.trip-tour-paddle.bullet.3':
    '地点の「その他の操作」にはパドル用のツールがあります。次の区間を水上で計画する、手で描く、「ここからボートを運ぶ」、「この地点に閘門を追加」です。',
  'help.guide.tour-paddle-setup.step.3':
    '「ボート」で「カヤック」「カナディアンカヌー」、SUP、「その他」から選びます。ボートによって、TREKが提案する速度が決まります。',
  'help.guide.tour-paddle-setup.tip.4':
    '列の下部にある「パドリングにはリスクがあります」の行を押すと、「水上での安全」が開きます。最初のツアーの前に一度読んでおいてください。',
  'help.guide.tour-paddle-water-route.step.5':
    '手で描いた区間をまとめて計画するには、「ウェイポイント」のヘッダーにある波のアイコン「手描きの区間を水上で計画」をクリックします。',
  'help.guide.tour-paddle-portage.step.1':
    '上陸する立ち寄り先にカーソルを合わせ、三点アイコンの「その他の操作」をクリックします。',
  'help.guide.tour-paddle-portage.result':
    'その区間が地図とウェイポイントで陸上運搬になり、「所要時間の見積もり」では運搬として計算されます。',
  'help.guide.tour-paddle-lock.tip.2':
    '閘門を迂回する陸上運搬がある場合、閘門は薄く表示され「運んで迂回」と示されます。陸上運搬の時間が代わりに計算され、閘門の分数は含まれません。',
  'help.guide.tour-paddle-time.step.4':
    'ツアーに陸上運搬がある場合、「運搬」の行で運搬が計算されます。速度をクリックして、ボートを運ぶ速さを入力します。「上陸と再出艇」では、陸上運搬ごとにかかる分数を加えます。',
  'help.guide.tour-paddle-wind.step.1':
    'パドルツアーを旅行の日に入れます。すると左の列の「風」カードに、ツアーの出発地点でのその日の予報が表示されます。',
  'help.guide.tour-paddle-wind.result': '出艇地点のその日の風が、1時間ごとにわかります。',
  'help.guide.tour-paddle-checklist.tip.1':
    '障害物ごとに、「漕いで通過」「陸上運搬する」「迂回する」「影響なし」から対応を選びます。「次へ」で次の未回答の項目に移ります。',
  'help.guide.tour-paddle-track-marks.step.1':
    '「ツアー」タブで、右の列の「ツアーを追加」をクリックし、「GPXまたはKMLをインポート」を選んでファイルを選択します。',
  'help.guide.tour-paddle-track-marks.tip.2':
    '「キャンセル」で、保存していないマークを破棄します。記録されたトラック自体が描き直されることはありません。',
  'help.ctx.trip-tour-horse.bullet.4':
    'TREKは乗馬の時間を計算しません。日程に時間を入れたい場合は、「詳細」の「予定」に入力してください。',
  'help.guide.tour-horse-plan.step.5':
    '「区間」で区間を選びます。進む「方向」と、その区間の「乗馬でのアクセス」の内容を確認します。',
  'help.guide.tour-horse-plan.tip.5':
    '乗馬ではルート計算は行われません。描いた線をクリックしても形状ポイントは追加されず、区間の両端の地点はルート上の位置のままです。',
  'help.guide.tour-horse-gap.tip.1':
    '手動の区間は、ルーターも乗馬ルートも確認していません。実際にどこを通るかは地図で確認してください。',
  'help.guide.tour-horse-recorded.step.4':
    '左の列で乗馬が開きます。「記録された乗馬」カードには「記録のまま」「乗馬時間なし」「通行可否は未確認」と表示されます。バッジにカーソルを合わせると理由がわかります。',
  'help.guide.dateless-trip.step.2':
    '「開始日」と「終了日」は空欄のままにします。その下に「日数」欄が表示されるので、計画したい日数を入力します。',
  'help.guide.trip-reminder.tip.1':
    '「リマインダー」の欄が表示されるのは、旅行の所有者（または管理者）だけです。グレー表示の場合は、先に管理者が「管理」の「通知」で旅行のリマインダーをオンにする必要があります。',
  'help.guide.upcoming-reservations.step.2': '予約をクリックすると、その予約の旅行が開きます。',
  'help.guide.timezones-widget.tip.1':
    '一覧ではEurope/LisbonやAmerica/New_Yorkのような正式なタイムゾーン名が使われているので、名前に含まれる都市名で検索してください。',
  'help.guide.half-company-holiday.step.2': '同じツールバーで「半休」をオンにします。',
  'help.guide.edit-holiday-calendar.tip.1': '変更はすべてすぐに保存されます。「保存」ボタンはありません。',
  'help.guide.person-color.tip.1': 'ツールバーと「付与日数」カードでも、同じ色でその人が示されます。',
  'help.guide.answer-fusion-request.step.2':
    '統合の内容を確認します。カレンダーが1つの共有カレンダーになり、お互いのエントリーを編集でき、休暇の設定も共有されます。',
  'help.guide.log-for-partner.step.2': 'ツールバーを確認します。最初のボタンに、その人の名前と色が表示されています。',
  'help.guide.dissolve-fusion.step.2': '下部の「統合を解除」で「解除」をクリックします。',
  'help.guide.country-places.step.3':
    'ダイアログには、その国として数えたすべての場所が旅行ごとに表示されます。6件を超える場合は、上部の「場所を検索」で絞り込めます。場所か旅行の見出しをクリックすると、その旅行がプランナーで開きます。',
  'help.guide.tour-activity-stats.step.5':
    '「ツアーを表示」をクリックします。「自分のツアー実績」が開き、合計、「種類別」の内訳、期間内のすべてのツアーが日、旅行、距離、獲得標高付きで表示されます。ヘッダーのピルで、ここでも期間とタイプを変えられます。',
  'help.guide.move-to-list.step.3':
    '移動先のリストを選びます。リストが4つ以上ある場合は、上部の検索ボックスで絞り込めます。',
  'help.guide.accept-list-invite.goal': '共有されたリストに参加するか、招待を断ります。',
  'help.guide.tour-collection-add-to-trip.step.4': '必要に応じて「旅での名前」を変え、「旅に追加」をクリックします。',
  'help.guide.tour-collection-manage.step.2':
    '「場所を検索」に入力します。場所と一緒に、ツアーも名前で絞り込まれます。',
  'help.guide.create-journey.tip.3':
    '旅行が終わった直後は、上部の「旅行が終了しました」バナーにある「日記を作成」から、その旅行を選んだ状態で日記を始められます。',
  'help.guide.entry-draft.step.2': '「保存」をクリックします。カードに「下書き」バッジが付きます。',
  'help.guide.gallery-map.step.3':
    '「タイムライン」に戻ると、右の地図がスクロールに合わせて動きます。表示中のエントリーは、その日の色の輪で示されます。ピンをクリックすると、タイムラインがそのエントリーまでスクロールします。',
  'help.guide.journey-map-layers.tip.1':
    '色付きの破線は旅行のGPXルートで、計画の一部です。実線はその日に記録されたルートです。',
  'help.guide.journey-keep-route.tip.1': '記録が途切れたところで線も途切れます。TREKは記録された部分だけを描きます。',
  'help.guide.journey-day-stays.tip.1':
    'この行が表示されるのは、日記を編集でき、自分のDawarichを連携している人だけです。また、まだ判断が必要なものが残っている日にだけ表示されます。',
  'help.guide.journey-take-over-day.step.4':
    'ルートも残すなら「この日のルートも保存する」をオンのままにして、「取り込む」ボタンをクリックします。ボタンには作成される下書きの数が表示されます。',
  'help.guide.journey-auto-prepare.step.3':
    'その下に、滞在を最後に取得した日時か、取得できなかった理由が表示されます。「今すぐ取得」をクリックすると、すぐにDawarichに問い合わせます。',
  'help.guide.photo-location.tip.1': '自分で設定した場所が移動されることはありません。',
  'help.ctx.settings-plugins.bullet.1':
    '「プラグイン設定」：その下に、入力が必要なプラグインごとのカードがあり、入力欄と「保存」があります。シークレットの欄は、一度保存すると二度と表示されません。',
  'help.guide.dashboard-widgets.step.3': 'カードの下の「既定に戻す」を押すと、「外観」タブ全体が初期設定に戻ります。',
  'help.guide.web-push-device.result':
    'カードに「このデバイスでオン」と表示され、「プッシュ」でオンにしたイベントがTREKを閉じていても届きます。',
  'help.guide.connect-airtrail.step.1':
    '「連携」でAirTrailを探し、「インスタンス URL」とAPIキーを入力します。キーはAirTrailの「設定」の「セキュリティ」で作成します。',
  'help.guide.connect-dawarich.step.1':
    '「連携」でDawarichを探し、「インスタンスのアドレス」と、Dawarichの「アカウント」の「APIキー」にあるAPIキーを入力します。',
  'help.guide.tour-connect-wanderer.step.1':
    '「連携」でwandererを探し、「インスタンス URL」とAPIトークンを入力します。トークンはwandererの「設定」の「アカウント」にある「APIトークン」で作成します。トークンはwanderer_key_で始まります。',
  'help.guide.tour-wanderer-watch.goal':
    'インポートしたトレイルに変更がないか、TREKがバックグラウンドで確認するようにします。',
  'help.guide.mcp-oauth.tip.3':
    '「API トークン」はまだ使えますが「非推奨」と表示されます。OAuthクライアントに切り替えてください。',
  'help.guide.offline-conflicts.tip.2': 'この設定はこの端末にだけ適用されます。',
  'help.guide.default-user-settings.tip.1':
    'ユーザーが「設定」で自分で選んだ内容が常に優先されます。ここでの設定は、その項目を変更していないユーザー全員に適用されます。',
  'help.guide.own-routing-engine.step.1':
    '「ユーザーのデフォルト」の「マップ」で、「自前のルーティングサーバー」にOSRMサーバーのアドレスを入力します。',
  'help.guide.admin-passkeys.tip.2': 'あとでドメインを変えると、すでに登録されたパスキーはすべて使えなくなります。',
  'help.guide.instance-keys.tip.4':
    'Amapのキーは、JS APIキーではなく、Web 服务（ウェブサービス）のキーである必要があります。',
  'help.guide.rotate-jwt-secret.step.2': '警告を読み、「ローテーションしてログアウト」をクリックします。',
  'help.guide.notification-defaults.tip.2': '既定値が適用されるのは、その項目を自分で変更していない人だけです。',
  'help.ctx.notifications.bullet.5':
    'ここに届くイベントと、メール、Webhook、ntfy、プッシュで届くイベントは、「設定」の「通知」で選べます。',
  'help.guide.read-notifications.result': '通知に関係する画面が開き、ベルの数字が1つ減ります。',
  'help.guide.mark-notifications-read.title': '通知を既読にする',
  'help.guide.delete-notifications.goal': '不要になった通知を削除して、一覧をすっきりさせます。',
  'help.guide.notification-settings.step.1': '右上の自分の名前をクリックします。',
  'help.guide.public-link.step.5':
    'リンクがある間は、選択内容を変えられます。「リンクを削除」でリンクが無効になります。',
  'help.guide.link-journal.step.3':
    '旅行のメンバーごとに「アクセスなし」「閲覧」「編集」を選びます。「全員閲覧」と「なし」で、全員をまとめて設定できます。',
  'help.guide.collapse-columns.tip.3': '区切り線にフォーカスがあるときは、矢印キーでも動かせます。',
  'help.guide.edit-place.tip.3':
    'ダイアログの外をクリックしても、変更は失われません。まず「変更を破棄しますか？」と確認され、「編集を続ける」でフォームに戻れます。',
  'help.guide.dawarich-stays.goal': '旅行中にDawarichが記録した滞在先を、1つずつ確認してから場所として追加します。',
  'help.guide.leave-stop-off-route.step.1':
    '立ち寄り先を右クリックするか三点メニューをクリックして、「ルートから外す」を選びます。',
  'help.guide.move-booking-day.step.3':
    '行が新しい日の、その予約の時刻の位置に表示されます。時刻も変える場合は、予約を開いてください。',
  'help.guide.place-image-from-file.goal':
    '場所のファイルにすでにある写真を、アップロードし直さずに場所の画像にします。',
  'help.guide.place-image-from-file.tip.3': '画像を変更できるのは、場所を変更する権限のあるメンバーだけです。',
  'help.guide.place-own-hours.result':
    'カードに自分で入力した電話番号、メール、営業時間が表示され、画像の周りの輪もその営業時間に基づいて緑か赤になります。',
  'help.guide.confirm-stay-booking.step.4': '右上の×で予約を閉じます。宿泊のカードの「予約」に「確定」と表示されます。',
  'help.guide.tour-map-lines.title': '地図でツアーを見つける',
  'help.guide.tour-map-lines.tip.2':
    'ツアーの非表示は自分にだけ適用され、この旅行についてこのブラウザーに保存されます。ツアー、その日、色は、ほかのメンバーには変わりません。「ツアー」一覧の上の「すべて表示」で、非表示にしたツアーがすべて表示されます。スマートフォンの地図には常にすべてのツアーが表示されます。',
  'help.guide.car-stops.step.4':
    '「途中の立ち寄り先」で、ドライブで通る場所ごとに「経由地を追加」をクリックして場所を選びます。必要なら横に時刻も入れられます。場所を選んでいない経由地は、保存時に削除されます。',
  'help.guide.transport-details.step.2':
    'ヘッダーのピルに、ステータス、タイプ、日、「予約コード」が表示されます。ステータスのピルをクリックすると、「保留」と「確定」が切り替わります。コードのピルにある小さなコピーアイコン「予約コードをコピー」で、コードがクリップボードにコピーされます。',
  'help.guide.group-sort-bookings.step.3':
    '「並べ替え」で「日付」「タイトル」「タイプ」「ステータス」のいずれかを選びます。その下の行で順番を逆にできます。日付では「早い順」か「遅い順」、それ以外では「名前順」か「Z→A」です。',
  'help.guide.booking-on-map.title': '地図で予約を見つける',
  'help.guide.export-bookings-csv.tip.1':
    '列は「タイプ」「タイトル」「ステータス」「開始」「終了」「出発地」「到着地」「場所」「確認」「ノート」です。',
  'help.guide.arrange-packing-list.tip.1':
    '「名前順」がオンの間はアイテムをドラッグできませんが、リストごとのドラッグはできます。',
  'help.guide.count-packed-pieces.step.3':
    '一部だけ準備できている間は、カウンターがアクセントカラーになり、チェックボックスにも同じ色の枠が付きます。マイナスをクリックすると、数が1つ減ります。',
  'help.guide.expense-receipts.step.5':
    'プレビューにレシートが表示され、上部に「新しいタブで開く」と「ダウンロード」があります。レシートが複数ある場合は矢印キーで切り替えられ、Escキーでプレビューを閉じます。',
  'help.guide.files-sync-settings.step.3': 'フローバーの下の「設定」をクリックすると、残りのオプションが表示されます。',
  'help.guide.manage-notes.step.3':
    '同じメニューの「固定」を選ぶと、ノートがパネルの上部に固定され、カテゴリの色の枠とタイトル横のピンが付きます。同じメニューの「固定を解除」で、元の位置に戻ります。',
  'help.guide.note-categories.step.1':
    '「ノート」カードのヘッダーで、「新規ノート」の横にある歯車をクリックします。「カテゴリ管理」が開き、カテゴリごとに色、名前、6つの色の点、ゴミ箱が1行に並びます。',
  'help.guide.note-categories.tip.2':
    'ノートが1つもないカテゴリは、自分のブラウザーにだけ保存されます。ほかのメンバーには、そのカテゴリにノートが入った時点で表示されます。',
  'help.guide.roadtrip-reorder.goal': 'レール上で直接、ドライブの順番を変えたり、立ち寄り先を別の日に移したりします。',
  'help.guide.roadtrip-overnight.step.4':
    'その横の「宿泊施設を探す」には、コピー用の名前と予約サイトへのリンクがあります。ホテルならtrivagoかCHECK24、キャンプ場ならPiNCAMPかPitchupです。場所、日付、人数は予約サイトで確認してください。',
  'help.guide.roadtrip-stop-fill.step.2':
    '「補給する量」で50〜100を選びます。ボタンの下に、その量でここから走れる距離が表示されます。',
  'help.guide.roadtrip-bookings.step.2':
    'レールでは、その移動がタイプの色のカードで表示されます。到着の列に時刻表、タイトルの下に出発地と到着地が表示されます。',
  'help.guide.roadtrip-google-import.tip.1':
    'TREKは立ち寄り先の間のルートを独自に計算します。Googleの道順をそのままコピーするわけではありません。',
  'help.guide.roadtrip-hazards.result': '旅行の周辺にある現在の警告が地図に表示されます。ルートは変わりません。',
  'help.ctx.trip-tours.bullet.3':
    '各行：色付きのバーは地図上のツアーの線、丸いタイルはルーティングの上限（T1〜T6）またはタイプを示し、小さなGPXやwandererのバッジはインポートしたツアーの印です。バッジには日、時間、距離、獲得標高が表示されます。複数日ツアーでは、数字付きの月のアイコンでステージ数がわかります。',
  'help.guide.tour-show-list.step.3': '行をクリックします。地図の上にツアーのカードが開きます。',
  'help.guide.tour-add-to-day.goal': 'ツアーをいつ行うかを決めて、その日に線付きで表示されるようにします。',
  'help.guide.tour-add-to-day.tip.3':
    'ツアーは同じ日に1回しか入れられません。すでに入っている日にドロップすると、「このツアーはすでにその日に入っています。」と表示されるだけです。',
  'help.guide.tour-day-times.step.4':
    'その日の次の予定が始まった後にツアーが終わる場合は、行の下に「13:30に終了、Gostner Schwaigeでの昼食（12:30開始）より後です」のようなメモが表示されます。何も移動されません。',
  'help.guide.tour-remove-from-day.step.1':
    '日の列でツアーの行にカーソルを合わせ、「その他のオプション」をクリックして「この日から削除」を選びます。',
  'help.guide.tour-filter-list.step.1':
    '「GPXまたはKMLをインポート」の下のフィルターボタンをクリックします。ボタンには絞り込み中のステータス（最初は「すべて」）と、ツアーの数が表示されています。',
  'help.guide.tour-hide-on-map.title': '地図でツアーの線を非表示にする',
  'help.guide.tour-import-plan-tab.title': '「予定」タブからトラックをインポートする',
  'help.ctx.trip-tour-detail.title': 'ツアーの詳細',
  'help.guide.tour-detail-read.goal':
    'ツアーについて旅行にある情報をすべて確認します。日、距離と標高、プロフィール、出どころです。',
  'help.guide.tour-detail-read.tip.1':
    '琥珀色の「注意して使用」ピルは、インポートしたデータの標高や数値が不完全であることを示します。獲得標高やプロフィールを見るときは、この点に注意してください。',
  'help.guide.tour-rename-colour.step.1':
    'ツアーのカードを開き、名前の横の鉛筆アイコンをクリックします。名前が入力欄になります。',
  'help.guide.tour-take-along.goal':
    'ツアーの出発地点までの道順を調べる、ウェブのページを開く、ルートをGPXファイルでダウンロードする、のいずれかを行います。',
  'help.guide.tour-take-along.result':
    '出発地点までの道順が地図アプリに表示され、ルート全体をGPXファイルで持ち出せます。',
  'help.guide.tour-copy-keep.tip.2':
    '日程にあるツアーのメニューの「コレクションに保存」でも同じダイアログが開くので、ルートはそこにも保存されます。',
  'help.guide.tour-packing-link.step.3': '「リンク」をクリックします。',
  'help.guide.tour-files.goal':
    '予約、地図、ルートの説明をツアーに追加し、ツアーのカードからいつでも開けるようにします。',
  'help.guide.tour-activity-link.goal': '計画は変えずに、記録したGPXトラックを計画済みのツアーにリンクします。',
  'help.guide.tour-activity-link.tip.3':
    '「所要時間」は、トラックの最初のタイムスタンプから最後のタイムスタンプまでで、休憩も含みます。',
  'help.guide.tour-activity-compare.tip.1':
    '「地図で比較」は、カードが地図の横に表示されているときだけ使えます。スマートフォンでは使えません。',
  'help.guide.tour-origin-check.tip.1':
    '別の旅行から取り込んだツアーでは、「取り込み元」にその旅行とツアーの名前が表示されます。',
  'help.ctx.trip-tour-planner.bullet.3':
    '右のレール「この旅行のツアー」には、すべてのツアーが並び、一覧の上にフィルターと「旅の合計」があります。ツアーを開いている間は、上部の「ツアーの概要」に距離、獲得標高、時間、標高プロフィールが表示されます。上部のプラス「ツアーを追加」で、ツアーの計画、インポート、取り込みができます。',
  'help.guide.tour-open-workspace.step.3':
    '右のレール「この旅行のツアー」には旅行のすべてのツアーが並び、一覧の上にフィルターと「旅の合計」があります。',
  'help.guide.tour-open-workspace.result':
    '「ツアー」タブが開きます。左にエディター、右に旅行のツアー、その間に地図があります。',
  'help.guide.tour-draw-route.step.6':
    '「ウェイポイント」には地点ごとに番号付きの行ができ、名前が読み込まれると場所の名前が付きます。TREKが処理している間は、「新しいツアー」の横の小さな点で状態がわかります。',
  'help.guide.tour-type-profile.step.1':
    '「ツアー名」の下の「ツアーの種類」をクリックします。現在のタイプと、その計画方法の説明が1行で表示されています。',
  'help.guide.tour-edit-points.goal': '地図や一覧で地点を動かして、ツアーの経路を変えます。',
  'help.guide.tour-edit-points.tip.2':
    '場所の名前が読み込まれるまでは、行に座標が表示されます。「元に戻す」と「やり直し」にキーボードショートカットはありません。',
  'help.guide.tour-shaping-points.tip.1': '開始地点と終了地点は常に停留地点です。',
  'help.guide.tour-loop-reverse.step.3': 'ツアー全体を逆向きに進むには、その横の「方向を反転」をクリックします。',
  'help.guide.tour-leg-by-hand.step.2':
    'その区間は破線の直線になり、行の下に「手描き、ルート計算なし」と長さが表示されます。',
  'help.guide.tour-trip-places.step.1':
    '「ウェイポイント」で「地点を追加」の横にある「旅の場所」をクリックします。その下に旅行の場所が表示されます。',
  'help.guide.tour-details-times.title': 'ツアーに名前を付けて時間を計画する',
  'help.guide.tour-details-times.tip.3':
    '「詳細」は横の矢印で折りたためます。「保存」できない値が入っている項目があると、自動で開きます。',
  'help.guide.tour-save.tip.1':
    '「保存」の横の「キャンセル」で、確認後に未保存の変更を破棄します。保存済みのツアーは変わりません。',
  'help.guide.tour-edit-saved.step.3':
    '「保存」をクリックします。「ツアーを保存しました」と表示され、ツアーの日、ファイル、ノートはそのまま残ります。',
  'help.guide.tour-summary-profile.step.1':
    '「この旅行のツアー」の上部にある「ツアーの概要」に、エディターで開いているツアーの「距離」「累積上昇量」「累積下降量」、推定時間、休憩、予定の合計時間が表示されます。',
  'help.guide.tour-list-manage.title': '旅行のツアーを管理する',
  'help.guide.tour-list-manage.tip.2':
    'すでにそのツアーが入っている日は、日のメニューでグレー表示になります。複数日ツアーでは、その日からステージを始めるか、ツアー全体をその日に入れるかを確認されます。',
  'help.guide.tour-delete.tip.2': '日から外すだけなら、代わりに日のメニューの「この日から削除」を使ってください。',
  'help.guide.tour-saved-elsewhere.step.4':
    '両方残すなら「新しいツアーとして保存」、もう一方の版を読み込むなら「新しい版を読み込む」、もう一方の版を自分の版で置き換えるなら「上書き」を選びます。',
  'help.ctx.trip-tour-import.bullet.3':
    'インポートしたものは、GPXツアーまたはwandererツアーとして開きます。線、「ツアーの概要」、標高プロフィールは、インポートしたときのままです。一覧の行には「GPXインポート」バッジが付きます。',
  'help.guide.tour-import-gpx.step.4':
    '「取り込む種類」で、トラックの種類を確認します。初期設定は「ハイキング」です。「サイクリング」と「ランニング」ではプロフィール、「パドルツアー」ではボートと水域、「スキーと冬」では種目を選びます。',
  'help.guide.tour-view-import.title': 'インポートしたトラックを見る',
  'help.guide.tour-view-import.result': '記録したトラックが、何も再計算されず、インポートしたとおりに表示されます。',
  'help.guide.tour-plan-from-import.tip.2':
    '提案が長い区間でトラックから離れているとカードに表示された場合は、その提案で計画する前に、該当部分を地図で確認してください。',
  'help.guide.tour-restore-recorded.step.3':
    '「記録されたトラックを復元」で確定します。ウェイポイントとルート計算した線が削除され、日とノートは残ります。',
  'help.guide.tour-take-over.step.3':
    'ツアーを探します。「名前で検索」に入力するか、「旅行」と「タイプ」のフィルターで一覧を絞り込みます。',
  'help.guide.tour-import-wanderer.title': 'wandererからトレイルをインポートする',
  'help.guide.tour-import-wanderer.tip.3':
    '旅行にすでにあるトレイルには「この旅行内」と表示され、「ツアーを開く」が使えます。インポート後に変更されたトレイルには、古いものの横に「新しいバージョンとしてインポート」が表示されます。',
  'help.ctx.trip-tour-map.bullet.4':
    '左のパネルにある「ツアー沿い」カードでは、ルート近くの展望台、水場、山小屋、飲食店などを検索して一覧にできます。一覧の場所は、立ち寄り先としてツアーに追加できます。',
  'help.guide.tour-map-layers.tip.1':
    '選んだ地図は、ページを再読み込みするまで、開くすべてのツアーで使われます。その地図に対応していないタイプのツアーは「マップ」で開きます。「予定」タブの地図と「設定」の設定は変わりません。',
  'help.guide.tour-along-search.step.4': '「ツアー沿いを検索」をクリックします。検索するだけで、ツアーは変わりません。',
  'help.guide.tour-along-add-stop.step.1':
    '「ツアー沿い」の一覧で場所をクリックするか、地図上のピンをクリックします。地図の上にカードが開き、それが何か、ルートからの距離、ツアーのどのあたりにあるかが表示されます。',
  'help.guide.tour-3d-terrain.title': 'ツアーを3Dで見る',
  'help.guide.tour-3d-terrain.tip.1': '表示を動かしたあとは、同じ行の「概要」でルート全体が再び表示されます。',
  'help.guide.tour-3d-flyover.step.4': '「概要」をクリックすると、ツアー全体がまた表示されます。',
  'help.guide.tour-map-overlays.step.2':
    'スイッチの横にある、色の点が並んだ小さな四角「ゲレンデの凡例」をクリックします。',
  'help.ctx.trip-tour-stages.summary':
    '複数日ツアーは、1つのルートを移動する日ごとのステージに分けたものです。ここでは各日の終点を決め、ステージごとの数値を確認し、ステージを旅行の日に入れます。',
  'help.guide.tour-multi-day.step.1': '「この旅行のツアー」でツアーをクリックし、エディターで開きます。',
  'help.guide.tour-multi-day.tip.3':
    'ステージの時間には休憩は含まれません。警告色の「移動だけで1日を超えます」は、1日より長いことを示します。',
  'help.guide.tour-stages-on-days.step.4':
    '月のアイコンとステージ数が付いたボタン「ステージを表示」をクリックすると、ステージが表示されます。',
  'help.ctx.trip-tour-hike.title': 'ハイキングとランニング',
  'help.guide.tour-hike-plan.title': '難易度を決めてハイキングを計画する',
  'help.guide.tour-hike-plan.result':
    'ハイキングが距離、獲得標高、歩行時間付きで「この旅行のツアー」に表示され、日に入れられる状態になります。',
  'help.guide.tour-hike-trail-details.step.2':
    '表示する項目を選びます：ハイキングのグレードを示すSAC、「路面」、「道の種類」。地図上のルートは一覧と同じ色で表示されます。',
  'help.guide.tour-hike-round.title': '長さを決めて周回ハイキングを探す',
  'help.guide.tour-hike-round.tip.1':
    '周回ルートは、そのハイキングの「登山道の難易度上限」の範囲内に収まります。上限はカードのTピルで確認できます。',
  'help.guide.tour-hike-compare-ways.step.4':
    '「この道にする」をクリックします。TREKがルーターで、ルートが実際にその道を通るかを確認します。',
  'help.guide.tour-ferrata-add.step.2':
    '地図上でヴィア・フェラータ（破線か標識）をクリックします。カードに名前、グレード、長さが表示されます。',
  'help.guide.tour-ferrata-add.tip.4':
    'カードの「OpenStreetMap で表示」で、そのヴィア・フェラータのデータを開けます。何も読み込めないときはバッジが琥珀色になり、ツールチップに理由が表示されます。',
  'help.guide.tour-run-plan.result':
    'ランニングが「走行時間 (予定)」付きで「この旅行のツアー」に表示され、プロフィールとペースも一緒に保存されます。',
  'help.guide.tour-run-ways.step.2':
    'カードの上部に、ランニングのうち未舗装の割合と、コース上でいちばん難しいグレードの道が表示されます。',
  'help.ctx.trip-tour-walk.bullet.2':
    '「ウェイポイント」には立ち寄り先が順番に並びます。番号を囲む輪は「必見」（実線）か「任意」（破線）、小さな盾は「保護」を示し、名前の下のピルに滞在時間が表示されます。',
  'help.guide.tour-walk-plan.step.3':
    '「ウェイポイント」で立ち寄り先にカーソルを合わせ、横の「その他の操作」をクリックして「立ち寄り先を編集」を選びます。',
  'help.guide.tour-walk-sights.title': '街歩きのルート沿いに見どころを追加する',
  'help.guide.tour-walk-sights.tip.2':
    'ルートを変えると、ボタンが「もう一度検索」になります。見つかった場所は変更前のルートに基づいているためです。',
  'help.guide.tour-walk-day-times.step.4':
    '各立ち寄り先の下に、到着時刻と滞在時間が表示されます。その時間に閉まっている場所や、滞在中に閉まる場所には警告が表示されます。',
  'help.guide.tour-walk-google-import.step.1':
    '「この旅行のツアー」で「ツアーを追加」（上部の＋）をクリックし、「Google Maps から街歩きを読み込む」を選びます。',
  'help.guide.tour-walk-check-off.title': '当日に街歩きの立ち寄り先をチェックする',
  'help.guide.tour-walk-check-off.tip.3': 'オフラインで日に入れた街歩きは、同期が済んでからチェックできます。',
  'help.guide.tour-bike-profile.title': '自分の走り方に合わせてサイクリングを計画する',
  'help.guide.tour-bike-profile.result':
    'サイクリングが保存されて「この旅行のツアー」に表示されます。ルートはプロフィールに合わせて計算され、「ツアーの概要」に走行時間が表示されます。',
  'help.guide.tour-bike-surfaces.step.1':
    '右の「この旅行のツアー」で、サイクリングをクリックして開きます。ルートが計算されると、「ウェイポイント」の下に「路面と道」カードが表示されます。',
  'help.guide.tour-bike-surfaces.tip.4':
    'カードのタイトルをクリックすると折りたためます。このブラウザーでは、再読み込み後も折りたたまれたままです。',
  'help.guide.tour-bike-mtb-grades.tip.2':
    'マッパーが登りにグレードを付けている場合は、その下に「登りの難度（mtb:scale:uphill）」が専用の行で表示されます。',
  'help.ctx.trip-tour-ski.bullet.4':
    'ウェイポイントの下の「ゲレンデルート」カードでは、1日を「滑走」「リフト乗車」「待ち時間」「徒歩」に分け、ゲレンデの長さ、滑り降りる標高差、リフトの乗車回数を表示します。すべての区間が計画されると、右の「ツアーの概要」の「スキー時間」に合計が表示されます。',
  'help.guide.tour-ski-plan.step.5':
    '各地点の下に、その区間がチップで並びます。ゲレンデ、リフト、徒歩の区間がそれぞれ名前か種類で表示され、ゲレンデにはグレードの色の点が付き、それぞれの分数も表示されます。',
  'help.guide.tour-ski-options.goal':
    '滑る最高難度、優先するもの、ペース、使うリフトを設定して、自分に合った区間にします。',
  'help.guide.tour-ski-options.tip.3':
    '「推定の接続を避ける」をオンにすると、地図データが推定しているだけの接続（2つのゲレンデの間の地図にない区間など）をルートに使いません。',
  'help.guide.tour-ski-fix-leg.tip.2':
    'そのエリアのゲレンデデータをダウンロードしている間は、プランナーが待機し、自動で再試行します。',
  'help.guide.tour-ski-summary.step.3':
    '右の「ツアーの概要」の「スキー時間」に、すべての合計が表示されます。情報の点を押すと計算方法がわかります。',
  'help.guide.tour-ski-pistes-layer.step.1':
    '「スキーと冬」のツアーを開いている間は、地図にゲレンデが自動で表示されます。地図左下の列にある雪山のスイッチで表示のオン・オフを切り替えられます。ツールチップには「ゲレンデ、クロスカントリーコース、リフト」と表示されます。',
  'help.guide.tour-ski-import.goal':
    '記録したスキー、クロスカントリー、スノーシューのトラックをインポートし、正しい種目を設定します。',
  'help.guide.tour-ski-import.tip.2':
    '計画したツアーのように編集するには、「編集可能なバージョン」カードの「編集可能なバージョンを計画」を使います。地点は直線でつながれます。',
  'help.ctx.trip-tour-paddle.bullet.4':
    '「所要時間の見積もり」では、水上の時間、ボートの運搬、上陸と再出艇、閘門、休憩を、変更できる速度と分数から合計します。',
  'help.guide.tour-paddle-setup.step.4':
    '「水域」で「川」か「湖」を選びます。ボートと水域の両方を選ぶまで、ツアーは保存できません。',
  'help.guide.tour-paddle-setup.result':
    'ボート、水域、速度を設定した新しいパドルツアーができ、地図に最初の地点を置けるようになります。',
  'help.guide.tour-paddle-water-route.tip.1':
    '水域のデータがない場所では、インスタンスの設定に応じて、TREKがその地域のデータを自動でダウンロードするか、管理者に依頼します。その間、区間には「水域データを読み込み中」と表示され、データが揃うと自動で計画されます。通常は1〜3分ほどです。',
  'help.guide.tour-paddle-portage.step.2':
    '「ここからボートを運ぶ」を選びます。次の地点までの区間が陸上運搬になり、陸上に描かれます。',
  'help.guide.tour-paddle-lock.title': '閘門と待ち時間を追加する',
  'help.guide.tour-paddle-lock.tip.3': '「閘門を削除」は、開いたカードの下部と「その他の操作」にあります。',
  'help.guide.tour-paddle-time.step.5':
    'すべての閘門に時間を設定するまで、見積もりには「不完全」と表示され、行の下のメモに不足している項目が表示されます。',
  'help.guide.tour-paddle-wind.step.2':
    '風向き、「平均」、「突風」を確認します。「平均」はその日の1時間平均のうち最も強い値、「突風」は最も強い突風です。',
  'help.guide.tour-paddle-checklist.title': '障害物チェックリストを確認する',
  'help.guide.tour-paddle-checklist.tip.2':
    '「陸上運搬する」を選んでも、陸上運搬は自動では計画されません。「陸上運搬を計画」をクリックして、地図上で設定します。',
  'help.guide.tour-paddle-track-marks.step.2':
    '「インポートのプレビュー」で「取り込む種類」を「パドルツアー」にし、「ボート」と「水域」を選びます。両方を選ぶまでインポートは進められません。',
  'help.guide.tour-paddle-track-marks.tip.3':
    '記録したトラックでは、「所要時間の見積もり」の「水域」の行に専用の速度があります。クリックして、実際に漕いだ速さを入力します。',
  'help.ctx.trip-tour-horse.bullet.5':
    'GPXファイルからインポートした乗馬は記録したままの状態で保持され、「記録された乗馬」カードに、インポートで計算できなかった項目が表示されます。',
  'help.guide.tour-horse-plan.step.6':
    '「区間を取り込む」をクリックします。区間がルート名のバッジとして「ウェイポイント」カードに追加されます。ほかの区間も同じように追加します。',
  'help.guide.tour-horse-gap.title': '乗馬ルートの間の空白をつなぐ',
  'help.guide.tour-horse-gap.tip.2': '地図上でクリックした地点も同じように、未確認の直線区間として乗馬に追加されます。',
  'help.guide.tour-horse-recorded.result':
    '乗馬が実際に走ったとおりに旅行に追加され、距離と標高はファイルの値になります。',
  'help.guide.dateless-trip.step.3': '「新しい旅行を作成」をクリックします。',
  'help.guide.trip-reminder.tip.2':
    '新しい旅行には、出発3日前のリマインダーが最初から設定されています。届けるチャンネルは「設定」の「通知」で選びます。',
  'help.guide.upcoming-reservations.result':
    '旅行が開きます。ダッシュボードに戻っても、ウィジェットには引き続き次の予定が表示されます。',
  'help.guide.entitlement.tip.2': '統合したプランでは、全員に自分の行があり、ほかの人の付与日数も設定できます。',
  'help.guide.half-company-holiday.step.3': '日をクリックします。セルの半分が琥珀色になります。',
  'help.guide.school-holidays.tip.2':
    '休みの期間の日にカーソルを合わせると、「学校の休暇」の下に休みの名前が表示されます。',
  'help.guide.answer-fusion-request.step.3':
    'プランを統合するなら「承認して統合」、自分のプランを別のままにするなら「却下する」をクリックします。',
  'help.guide.log-for-partner.step.3': '記録する日をクリックしてから、「人数」で自分の名前をもう一度クリックします。',
  'help.guide.dissolve-fusion.result':
    '全員がそれぞれのエントリーを持つ自分のプランに戻り、「人数」には自分だけが表示されます。',
  'help.guide.country-places.result': 'その場所がある旅行がプランナーで開きます。',
  'help.guide.tour-activity-stats.step.6':
    '実際には行かなかったツアーは、その行の右端にある丸いボタン「除外」をクリックします。ツアーは一覧に残りますが、薄く表示され「除外」と示されます。同じボタンが「再び集計」に変わり、もう一度押すとまた集計に含まれます。',
  'help.guide.move-to-list.tip.1':
    'ラベルはリストごとのものなので、移動・複製した場所には移動先のリストでラベルが付いていません。',
  'help.guide.accept-list-invite.step.1':
    'リストのレールの「招待」で招待を探します。招待の通知から開いた場合は、ページ上部にカードが表示されています。カードにはリスト名と招待した人が表示されます。',
  'help.guide.tour-collection-add-to-trip.tip.1':
    '新しいツアーはまだどの日にも入っておらず、場所も追加されません。リストと元のツアーはどちらも変わりません。',
  'help.guide.tour-collection-manage.step.3':
    'ツアーの行の右端にあるゴミ箱アイコンをクリックし、「コレクションから削除」で確定します。',
  'help.ctx.journey-detail.bullet.7':
    'Dawarichを連携していると、日のヘッダーに「記録を取り込む」（その日のルートを保存済みなら距離）と「1日を取り込む」も表示されます。待機中の滞在がある日は、滞在がその日の最後に1行でまとめて表示されます。',
  'help.guide.entry-draft.tip.1':
    '下書きは参加者には引き続き表示されます。「下書き」をオフにするまで非表示になるのは、公開リンクだけです。',
  'help.guide.journey-map-layers.tip.2':
    '薄く表示されたスイッチは、まだ表示するものがないことを示し、ツールチップに理由が表示されます。選択内容はこのブラウザーで日記ごとに保存されます。',
  'help.guide.journey-keep-route.tip.2':
    'あとで日のヘッダーの距離をクリックすると、もう一度Dawarichと比較できます。「置き換える」で新しい版を使い、「ルートを削除」でその日のルートを日記から削除します。',
  'help.guide.journey-day-stays.tip.2':
    '滞在の多い日は、行の右端にある「1日を取り込む」で、その日の滞在をまとめて処理できます。',
  'help.guide.journey-take-over-day.tip.1':
    'このボタンを押すまでは何も保存されず、同じものが二重に保存されることもありません。すでに日記にある滞在には印が付き、もう一度選ぶことはできません。',
  'help.guide.journey-auto-prepare.tip.1':
    '準備されるのは、リンク済みで日付のある旅行の日だけです。日記に自動で追加されるものはありません。',
  'help.guide.photo-location.result':
    '場所が未設定のエントリーには、GPS情報のある最初の写真の撮影地が設定され、地図に表示されるようになります。',
  'help.guide.contributors.tip.2':
    '「旅行経由」には、リンクした旅行を通じてアクセスできる人が表示されます。その人たちのアクセスは、ここではなく旅行の設定で変更します。',
  'help.ctx.settings-plugins.bullet.2':
    'プラグインによっては、カードに「操作」が追加され、確認後に実行されます。プラグインがあなたの代わりにほかのサービスにサインインする場合は、「接続」や「接続解除」も表示されます。',
  'help.guide.web-push-device.tip.1':
    'プッシュはブラウザーごとに設定します。通知を受け取りたいスマートフォンとパソコンで、それぞれ設定してください。「このデバイスでオフにする」は、その端末でだけ通知を止めます。',
  'help.guide.connect-airtrail.step.2':
    '「自己署名証明書を許可する」は、自分のネットワーク内にある信頼できるインスタンスにだけ使います。「変更を AirTrail に書き戻す」は初期設定でオフなので、TREKは読み取りだけを行います。編集内容をAirTrailに反映するにはオンにします。',
  'help.guide.connect-dawarich.step.2':
    '「新しい滞在を自動で確認」をオンにすると、TREKが自動で確認します。オフの場合、TREKがDawarichを読み込むのは操作したときだけです。「自己署名証明書を許可」は、サーバーが信頼していないインスタンスにだけ使います。',
  'help.guide.tour-connect-wanderer.step.2':
    '「自己署名証明書を許可する」は、自分のネットワーク内にあるインスタンスの場合だけオンにします。',
  'help.guide.tour-wanderer-watch.step.1':
    'wandererのカードで「トレイルの変更を確認する」をオンにします。先に接続を保存しておく必要があります。',
  'help.guide.plugin-settings.title': '自分用にプラグインを設定する',
  'help.guide.default-user-settings.tip.2':
    '「表示通貨」は表示用に金額を換算するだけです。「費用」に入力した金額は変わりません。',
  'help.guide.own-routing-engine.step.2':
    '有料道路、高速道路、フェリーを避けるルートを使うには、「自前の Valhalla インスタンス」にValhallaのアドレスを入力します。各欄は入力欄から離れると保存されます。そのあとTREKサーバーを再起動し、ページを再読み込みします。',
  'help.guide.admin-passkeys.tip.3':
    'ユーザーがパスキーを登録した端末をなくした場合は、「ユーザーを編集」の「パスキーをリセット」でそのパスキーを削除します。',
  'help.guide.rotate-jwt-secret.result':
    '新しい署名用シークレットが設定され、自分を含むすべてのユーザーがサインインし直す必要があります。',
  'help.guide.read-notifications.title': '通知を読む',
  'help.guide.filter-notifications.title': 'すべての通知か、未読の通知だけを表示する',
  'help.guide.mark-notifications-read.goal': '新しい通知を確認したら、強調表示とベルの数字を消します。',
  'help.guide.delete-notifications.step.1':
    '通知の時刻の横にあるゴミ箱「削除」をクリックすると、その通知だけが削除されます。',
  'help.guide.notification-settings.step.2': 'メニューの「設定」をクリックします。',
  'help.guide.public-link.tip.3': '選択肢にカーソルを合わせると、何が非表示になるかを確認できます。',
  'help.guide.link-journal.step.4':
    '黄色のメモを読みます。初めて日記にアクセスできるようになる人が表示されています。そのあと「ジャーナルをリンク」をクリックします。',
  'help.guide.dawarich-stays.step.1':
    '「設定」の「連携」でDawarichを接続すると、場所の一覧の上に「Dawarich から」が表示されます。見出しには、TREKが最後に確認した日時と、待機中の滞在の数が表示されます。クリックして一覧を開きます。',
  'help.guide.leave-stop-off-route.step.2':
    '名前の横に「ルート外」バッジが付きます。立ち寄り先はその日にも地図にも残りますが、その日のルートと区間の所要時間からは外れます。',
  'help.guide.move-booking-day.result': '予約が計画上の新しい日に移ります。時刻は変わりません。',
  'help.guide.clear-day.tip.2': 'このメニュー項目は、場所が入っている日にだけ表示されます。',
  'help.guide.place-image-from-file.step.1':
    '「ファイル」に写真がある場所を開きます。カード下部の「ファイル」欄に、その場所のファイル数が表示されています。',
  'help.guide.place-own-hours.title': '場所の営業時間、電話番号、メールを修正する',
  'help.guide.place-own-hours.tip.1':
    '自分で入力した時間は、TREKが取得した時間より優先されます。季節によって営業時間が変わるカフェでも、自分の知っている時間を表示できます。',
  'help.guide.day-panel.tip.3':
    'カレンダーの日付で計画したい場合は、「設定」の「表示」で「日の見出しで日付を先に表示」をオンにします。ヘッダーに日付が先に表示され、その下に「1日目」や日の名前が表示されます。',
  'help.guide.confirm-stay-booking.result':
    'ホテルの予約が確定になり、宿泊のカードと「予約」タブの両方に反映されます。',
  'help.guide.tour-map-lines.goal':
    '地図上で旅行のツアーを見分け、線からツアーを開き、今は必要ないツアーを非表示にします。',
  'help.guide.tour-map-lines.tip.3':
    '日程のツアーの行のメニューにある「ルートから外す」を選ぶと、その日のルートがツアーの出発地と終点を通らなくなります。「ルートに戻す」で再びつながります。',
  'help.guide.car-stops.step.5':
    '立ち寄り先の順番がそのままルートになります。立ち寄り先の左の「上へ移動」「下へ移動」で順番を変え、右の×「立ち寄り先を削除」で削除します。',
  'help.guide.transport-details.step.3':
    '下のタイルに、出発・到着とその駅または空港、設定されていればホームと座席が表示されます。途中に停車地がある移動は「ルート」の下に一覧され、区間ごとに予約した移動は「区間ごとのコード」の下に区間ごとのコードが表示されます。続いて「同行者」「ノート」「費用」「ファイル」があり、「ファイルで表示」で「ファイル」タブのチケットが開きます。',
  'help.guide.export-transports-csv.title': '移動を表計算ファイルとしてエクスポートする',
  'help.guide.group-sort-bookings.step.4':
    'セクションの見出しをクリックすると折りたためます。横の数字はその中の予約の数で、もう一度クリックすると開きます。',
  'help.guide.booking-on-map.goal': '予約から、計画と地図上のその場所へ移動します。',
  'help.guide.export-bookings-csv.tip.2': '列はセミコロンで区切られ、Excelで開いてもアクセント記号が文字化けしません。',
  'help.guide.arrange-packing-list.tip.2':
    '「名前順」はこのブラウザーに保存されるので、次回も並べ替えた状態で開きます。変わるのは自分の表示だけで、ほかの人に見える順番は変わりません。',
  'help.guide.count-packed-pieces.step.4':
    'カウンターが数量に達すると、アイテムに自動でチェックが入り、準備済みとして数えられます。',
  'help.guide.expense-receipts.result':
    'レシートが支出と一緒に保存されます。行のチップから開けるほか、ファイルは旅行の「ファイル」にもあります。',
  'help.guide.files-sync-settings.step.4':
    '「ドキュメントが削除されたとき」で、もう一方にあるコピーの扱いを選びます。「両方のコピーを残す」では、保管先のコピーはそのまま残ります。「ゴミ箱へ移動する」では、TREKでドキュメントを削除すると、保管先のコピーがゴミ箱に移ります。',
  'help.ctx.trip-collab.bullet.7':
    'ここでの操作にはすべて接続が必要です。オフラインでは、メッセージ、ノート、リンク、投票、投票への回答は保存されず、「接続が必要です。TREKがオンラインに戻ったらもう一度お試しください。」と表示されます。「コラボ」の編集権限がないメンバーもすべて閲覧できますが、「新規ノート」「リンクを追加」「新しい投票」は表示されず、メッセージ欄はグレーになります。',
  'help.guide.manage-notes.step.4':
    '「編集」で、内容が入力された状態のノートのダイアログが開きます。必要な部分を変更し（この例では「内容」に1行追加）、「保存」をクリックします。',
  'help.guide.note-categories.step.2':
    '下部の「新しいカテゴリ…」に名前を入力し、Enterキーを押すか横のプラスをクリックします。新しいカテゴリには次の色が割り当てられ、専用の行が追加されます。',
  'help.guide.note-categories.tip.3':
    'カードでは、カテゴリはヘッダーの色の点でだけ示されます。点にカーソルを合わせると名前が表示されます。',
  'help.guide.roadtrip-reorder.step.1':
    '立ち寄り先を行ごとドラッグし、同じ日の別の立ち寄り先の上にドロップします。その立ち寄り先の位置に入り、その日のルートが新しい順番で計算し直されます。',
  'help.guide.roadtrip-overnight.step.5':
    '「追加」をクリックします。この日から翌日までの1泊が登録され、その場所がその日の宿泊としてドライブに追加されます。',
  'help.guide.roadtrip-stop-fill.step.3':
    'その立ち寄り先で自分の設定に戻すには、もう一度バッジを開き、「自分の既定値を使う」をクリックします。',
  'help.guide.roadtrip-bookings.step.3':
    '「チェックイン」や「乗車」のピルは、いつまでにターミナルに着く必要があるかを示します。ドライブの出発は、時刻表よりその分早く設定されます。',
  'help.guide.roadtrip-google-import.title': 'Google Mapsからルートをインポートする',
  'help.guide.roadtrip-google-import.tip.2':
    'リンクには、TREKが位置を特定できる立ち寄り先が2〜30か所含まれている必要があります。',
  'help.guide.roadtrip-hazards.tip.1':
    '警告は通行止めの情報ではありません。警告によってルートが変わることはなく、内容は現在のお知らせで、旅行日の予報ではありません。',
  'help.ctx.trip-tours.bullet.4':
    '行にカーソルを合わせると、目のアイコン（「地図で非表示にする」）と丸い＋（「この日に追加」）が表示されます。行を左の列の日にドラッグするとその日に計画でき、クリックすると地図の上にツアーのカードが開きます。',
  'help.guide.tour-show-list.step.4':
    'カードには、ツアーの数値と、「旅行の日程」に入っている日が表示されます。ルート自体を変えるには、「ツアー」タブを開き、「この旅行のツアー」でツアーをクリックします。',
  'help.guide.tour-add-to-day.step.1':
    '一覧でツアーにカーソルを合わせ、行の右にある丸い＋（「この日に追加」）をクリックします。',
  'help.guide.tour-add-to-day.tip.4':
    '日を開いているとき（ヘッダーをクリックした状態）は、ツアーのカードにもその日用の「日に追加」が表示されます。日の上にある元に戻す矢印で、割り当てを取り消せます。',
  'help.guide.tour-day-times.tip.1': '自分で入力した終了時刻は、計算された時刻より優先されます。',
  'help.guide.tour-remove-from-day.step.2':
    'ツアーは右の一覧に残ります。「日」バッジが消え、フィルターでは再び「未計画」として数えられます。',
  'help.guide.tour-filter-list.step.2':
    '「ステータス」で、まだどの日にも入っていないツアーなら「未計画」、すでに日に入っているツアーなら「予定」を選びます。各行に当てはまるツアーの数が表示されます。',
  'help.guide.tour-hide-on-map.goal': '今は必要ないツアーを、ほかの人の表示は変えずに地図から非表示にします。',
  'help.guide.tour-import-plan-tab.goal': '日程を計画しながら、GPXやKMLのトラックをツアーとしてインポートします。',
  'help.ctx.trip-tour-detail.summary':
    '「予定」タブでツアーを選ぶと、地図の上にカードが開きます。日、数値とプロフィール、出どころが表示され、スマートフォンへの送信、コピー、コレクションへの保存、持ち物リストへのリンクのボタンがあります。',
  'help.guide.tour-detail-read.step.1':
    '右の列の上部で「場所」から「ツアー」に切り替え、ツアーをクリックします。地図の上にカードが開きます。日の中のツアーの行や地図上の線からも、同じカードが開きます。',
  'help.guide.tour-detail-read.tip.2':
    'パドルツアーには標高もプロフィールも表示されません。地点が岸にあるため、標高が正しくならないからです。',
  'help.guide.tour-rename-colour.step.2':
    '新しい名前を入力し、丸いチェックボタンをクリックするかEnterキーを押します。Escapeキーを押すと元の名前のままになります。',
  'help.guide.tour-take-along.step.1':
    'ツアーのカードを開きます。カード下部の「ナビゲーション」で、ツアーの出発地点が地図アプリで開きます。アプリが複数ある場合は、先にアプリの一覧が表示されます。案内されるのは出発地点までで、ルートに沿った案内ではありません。',
  'help.guide.tour-copy-keep.title': 'ツアーをコピーする、コレクションに保存する',
  'help.guide.tour-copy-keep.tip.3':
    '「ツアー」タブでは、左の列の上部にあるブックマークで、開いているツアーに同じ操作ができます。未保存の変更があると、先にツアーを保存するよう求められます。',
  'help.guide.tour-packing-link.step.4':
    'カードに、リスト、そのうち準備済みのアイテム数、バー、最初のいくつかのアイテムが表示されます。準備済みのアイテムには取り消し線が付きます。',
  'help.guide.tour-files.step.1':
    'ツアーのカードを開き、いちばん下の「ファイル」までスクロールします。セクションの見出しの「アップロード」をクリックし、ファイルを1つ以上選びます。',
  'help.guide.tour-activity-link.step.1':
    '計画したツアーのカードを開き、「実際のトラック」までスクロールします。「実際のトラックを追加」をクリックします。',
  'help.guide.tour-activity-link.result':
    'トラックがツアーにリンクされ、カードに計画と実際の結果が並んで表示されます。',
  'help.guide.tour-activity-compare.tip.2':
    'Atlasのツアー実績では、計画の値ではなく、リンクしたトラックの値が集計されます。',
  'help.guide.tour-origin-check.tip.2':
    'wandererのツアーには、ソースの横に矢印「wanderer で開く」があり、セクションの見出しに「ソースを確認」があります。確認すると、インポート後にトレイルが変わったかどうかをwandererに問い合わせます。そのあと「新しいスナップショットとしてインポート」で、新しい版を別のツアーとしてインポートできます。このツアーの日とノートはそのまま残ります。',
  'help.ctx.trip-tour-planner.bullet.4':
    '「地点を追加」がオン（地図のピルでは「ポイントを配置」）の間は、地図をクリックすると地点を置けます。ピンをドラッグすると移動でき、描かれたルートをクリックするとそこに形状ポイントを追加でき、「旅の場所」で旅行の場所を選べます。',
  'help.guide.tour-open-workspace.step.4':
    '右のレール上部のプラス「ツアーを追加」には、「GPXまたはKMLをインポート」「Google Maps から街歩きを読み込む」「別の旅からツアーを取り込む」があります。ツアーを開いている間は「新しいツアーを計画」も表示されます。',
  'help.guide.tour-draw-route.title': '新しいツアーを描く',
  'help.guide.tour-draw-route.tip.1':
    '「ポイントを配置」がオンの間、ポインターは十字になります。オフにすると、地点を追加せずに地図をドラッグして動かせます。3Dでは、ドラッグで周りを見回すため、最初はオフになっています。',
  'help.guide.tour-type-profile.step.2':
    '一覧からタイプを選びます：「ハイキング」「街歩き・観光」「ランニング」「サイクリング」「パドルツアー」「乗馬ツアー」「スキーと冬」。それぞれに何を計画するかの説明があり、タイプを変えるとルートが計画し直されます。',
  'help.guide.tour-edit-points.step.1':
    '地図上の番号付きのピンを、地点を置きたい場所までドラッグします。ルートが新しい場所を通るように計画し直されます。',
  'help.guide.tour-edit-points.result': '地点が思いどおりの位置と順番になり、ルートが計画し直されます。',
  'help.guide.tour-shaping-points.tip.2': '形状ポイントは、複数日ツアーのステージの終点にはできません。',
  'help.guide.tour-loop-reverse.tip.1':
    'ツアーが周回ルートになると、「スタートに戻る」に「このツアーはすでにスタートに戻ります」と表示されます。',
  'help.guide.tour-leg-by-hand.step.3':
    'ルーターに計画し直させるには、同じメニューを開いて「次の区間を再びルート計算する」を選びます。',
  'help.guide.tour-trip-places.step.2':
    '「旅の場所を検索」で探すか、「ツアーの近く」を見ます。ルートから2 km以内の場所が、近い順に距離付きで並んでいます。',
  'help.guide.tour-details-times.goal': 'ツアーに名前、説明、リンクを付け、時間に休憩を加えます。',
  'help.guide.tour-details-times.result': 'ツアーに名前、メモ、予定の時間が設定されます。',
  'help.guide.tour-save.tip.2':
    'レール上部の「ツアー一覧に戻る」でエディターを閉じます。未保存の変更がある場合は、先に確認されます。',
  'help.guide.tour-edit-saved.step.4':
    '「ツアー一覧に戻る」をクリックして閉じます。未保存の変更があると、先に「ツアーの未保存の変更を破棄しますか？」と確認されます。',
  'help.guide.tour-summary-profile.step.2': '推定時間の横にある情報の点で、計算方法を確認できます。',
  'help.guide.tour-list-manage.goal': '旅行のツアーの合計を確認し、ツアーを日に入れ、一覧を必要なものに絞り込みます。',
  'help.guide.tour-list-manage.tip.3':
    '行のゴミ箱アイコンでツアーを削除します。「予定」タブでも、右の列を「ツアー」に切り替えると同じツアーが一覧されます。',
  'help.guide.tour-delete.tip.3':
    'ツアーの削除は、この「ツアー」タブで行います。ゴミ箱アイコンは、旅行の場所を編集できるメンバーにだけ表示されます。',
  'help.guide.tour-saved-elsewhere.tip.1':
    '「新しいツアーとして保存」では、ツアー名の後ろに「（自分の版）」を付けた名前でコピーが保存されます。',
  'help.ctx.trip-tour-import.bullet.4':
    '「編集可能なバージョン」で、インポートしたものを、動かせるウェイポイント付きのツアーにできます。「インポートを置き換え」でも記録されたトラックは残り、エディターの「記録されたトラック」カードから元に戻せます。',
  'help.guide.tour-import-gpx.step.5':
    '「1件のツアーをインポート」（トラックが3つのファイルなら「3件のツアーをインポート」）をクリックします。',
  'help.guide.tour-view-import.goal':
    'インポートしたツアーのコース、数値、標高を、取り込んだときのままの状態で確認します。',
  'help.guide.tour-plan-from-import.title': 'インポートしたものから編集可能なツアーを計画する',
  'help.guide.tour-plan-from-import.tip.3':
    'パドルやスキーのインポートは、ルート計算されず、地点の間が直線でつながれます。',
  'help.guide.tour-restore-recorded.tip.1':
    'このカードは、「インポートを置き換え」で置き換えて保存したツアーにだけ表示されます。',
  'help.guide.tour-take-over.step.4': 'ツアーをクリックします。右側に、その線、数値、元の旅行が表示されます。',
  'help.guide.tour-import-wanderer.goal': '自分のwandererにあるトレイルを、ツアーとして旅行にインポートします。',
  'help.guide.tour-import-wanderer.tip.4': '「wanderer で開く」で、自分のインスタンスのトレイルが開きます。',
  'help.ctx.trip-tour-map.bullet.5':
    '3Dでは、ルートが地形の上に勾配に応じた色で表示されます。勾配をまとめた凡例と、出発地から終点までルートをたどるフライオーバーもあります。',
  'help.guide.tour-map-layers.tip.2':
    '「ハイキング」と「自転車」はボランティアのサーバーから提供され、管理者が許可している場合だけ使えます。応答がなくなると、その項目に「!」が表示され、別の地図に切り替えられます。ツアーは変わりません。',
  'help.guide.tour-along-search.step.5':
    '見つかった場所がルートからの距離付きで一覧され、地図上にそれぞれの色で表示されます。星はよく知られた場所、「ツアー内」はすでに立ち寄り先になっている場所を示します。ボタンは「もう一度検索」に変わります。',
  'help.guide.tour-along-add-stop.step.2':
    '「追加する位置」に、その場所がいちばん合う区間が提案されます。クリックすると、代わりにどの2つの立ち寄り先の間に入れるか、または「新しいゴールとして」を選べます。変更する前に、新しいルートが地図に破線で表示されます。',
  'help.guide.tour-3d-terrain.goal': 'ツアーを実際の地形の上で、勾配に応じた色で表示します。',
  'help.guide.tour-3d-terrain.tip.2':
    '選んだ地図は3Dでも使われ、ヴィア・フェラータ、ゲレンデ、航路標識も表示されます。ツアーの編集中は、地形の上で地点をドラッグでき、「ポイントを配置」がオンならクリックで地点を追加できます。',
  'help.guide.tour-3d-flyover.result': '選んだ速度で、出発地から終点までツアーを上空から見られます。',
  'help.guide.tour-map-overlays.step.3':
    '凡例で色の意味がわかります。「初心者」から「フリーライド」までの滑降コース、「クロスカントリーコース」、「冬季・スノーシューのルート」、「そりコース」、「リフトとロープウェイ」です。「OpenSnowMap の完全な凡例」で、すべての記号を確認できます。Escapeキーで閉じます。',
  'help.ctx.trip-tour-stages.bullet.1':
    'エディターの「日」で、開いているツアーを「日帰り」か「複数日」にします。「日帰り」に戻すと、確認後にステージの終点がすべて削除されます。ルートは変わりません。',
  'help.guide.tour-multi-day.step.2':
    '「日」で「複数日」をクリックします。最初のステージの終点がどこに置かれたかがメモで表示されます。',
  'help.guide.tour-multi-day.tip.4':
    'ステージは「保存」をクリックすると保存されます。変更によって旅行の日に入っているステージがなくなる場合は、保存するとその日から削除されるという通知が表示されます。',
  'help.guide.tour-stages-on-days.step.5':
    '各ステージに、入っている日が表示されます。日をクリックすると、ステージを別の日に移せます。「日なし」を選ぶと日から外れます。',
  'help.ctx.trip-tour-hike.summary':
    '「ツアー」タブで開いたハイキングやランニングです。左にエディター、中央に地図、右にツアーの概要と旅行のほかのツアーがあります。ハイキングは許可した登山道の難易度の範囲に収まり、ランニングは自分のペースで時間が計算されます。どちらも、ルート沿いでOpenStreetMapに記録されている情報を表示します。',
  'help.guide.tour-hike-plan.goal':
    'ハイキングを作成し、立ち寄り先を設定し、ルートで使ってよい最も難しい登山道のグレードを選んで保存します。',
  'help.guide.tour-hike-plan.tip.1':
    '新しいハイキングはT2（山岳ハイキング）から始まります。T3では、道が切り立っている場合があり、確かな足取りと高所への慣れが必要だという警告が表示されます。',
  'help.guide.tour-hike-trail-details.step.3':
    'バッジで概要がわかります。ルートのうち「判明」している割合、「判明している最高」のグレード、そして別に、ハイキングの計画に使った「ルートの上限」です。',
  'help.guide.tour-hike-round.goal':
    'ハイキングの立ち寄り先の1つから始まる、希望の長さの周回ルートをTREKに提案してもらいます。',
  'help.guide.tour-hike-round.tip.2':
    '距離は1〜60 kmで指定でき、指定した距離の前後20 %以内の周回ルートが提案されます。',
  'help.guide.tour-hike-compare-ways.result':
    'その区間だけが選んだ道を通り、ハイキングのほかの部分は変わりません。地図下部の「道を採用しました」に「元に戻す」があります。',
  'help.guide.tour-ferrata-add.step.3':
    '「ツアーに追加」をクリックします。ヴィア・フェラータが、両端に地点の付いた独立した区間としてルートの最後に追加されます。',
  'help.guide.tour-run-plan.title': '自分のペースでランニングを計画する',
  'help.guide.tour-run-plan.tip.1': 'ペースを設定しないと、ランニングは保存できません。',
  'help.guide.tour-run-ways.step.3': '「路面」をクリックし、一覧から路面を選ぶと、その区間だけが地図に表示されます。',
  'help.ctx.trip-tour-walk.bullet.3':
    '開始時刻のある日に街歩きを入れると、「ウェイポイント」上部の「時刻の基準日」にその日が表示され、各立ち寄り先に到着時刻、滞在時間、営業時間の情報が表示されます。',
  'help.guide.tour-walk-plan.step.4':
    '立ち寄り先に「ラベル」と「滞在時間（分）」を設定します。滞在時間がまだわからない場合は空欄のままにし、通過するだけの地点には0を入力します。',
  'help.guide.tour-walk-sights.goal': 'テーマを選んで街歩きのルート沿いを検索し、場所を立ち寄り先として追加します。',
  'help.guide.tour-walk-sights.tip.3':
    '営業時間とウェブサイトは、主にOpenStreetMapなどの元データから取得しています。出かける前に確認してください。',
  'help.guide.tour-walk-day-times.tip.1':
    '開始時刻がない場合は、「この日の街歩きに時刻を設定すると、到着時刻と営業時間が表示されます」と表示されます。',
  'help.guide.tour-walk-google-import.step.2':
    '「徒歩ルートのリンク」にリンクを貼り付け、「リンクを読み取る」をクリックします。',
  'help.guide.tour-walk-check-off.goal': '当日に立ち寄り先を訪問済みやスキップとして記録し、残りの歩く量を確認します。',
  'help.guide.tour-walk-check-off.result':
    '訪問済みの立ち寄り先にはチェックが、スキップした立ち寄り先には取り消し線が付き、残り時間にはこれからの分だけが数えられます。',
  'help.guide.tour-bike-profile.goal':
    'サイクリングを作成し、ツーリング、ロード、グラベル、MTBに合わせてTREKにルートを計算させます。',
  'help.guide.tour-bike-profile.tip.1':
    'あとでプロフィールを変えると、ルート全体が新しいプロフィールで計画し直されます。',
  'help.guide.tour-bike-surfaces.step.2':
    'カードのヘッダーのバッジに、ルートのうち未舗装と判明している割合が表示されます。',
  'help.guide.tour-bike-mtb-grades.title': 'マウンテンバイクツアーのトレイルのグレードを確認する',
  'help.guide.tour-bike-mtb-grades.tip.3':
    'グレードを読み込めなかった場合は、カードにその旨が表示されます。「再試行」をクリックしてください。',
  'help.ctx.trip-tour-ski.bullet.5':
    '「スキーと冬」のツアーを開いている間は、地図にOpenSnowMapのゲレンデが表示され、そのスイッチの横に「ゲレンデの凡例」があります。どれも地図データなので、コースやリフトが営業中かどうか、雪の状態、雪崩についてはわかりません。',
  'help.guide.tour-ski-plan.step.6': '「ツアー名」に名前を入力し、「保存」をクリックします。',
  'help.guide.tour-ski-options.step.1':
    '「スキーと冬」のツアーでは、ルーターのオプションは「種目」の下にあります。表示されるのは、選んだ種目で使うオプションだけです。たとえば「クロスカントリー」には「最も難しいコース」がありません。',
  'help.guide.tour-ski-options.result':
    'ツアーが設定した制限の範囲内で計画し直され、「ゲレンデルート」カードに避けた難しいコースが一覧されます。',
  'help.guide.tour-ski-fix-leg.tip.3':
    'オフラインの間は、区間がひとまず直線で描かれます。夏道に関するグレーの行はメモで、エラーではありません。',
  'help.guide.tour-ski-summary.tip.1':
    '「回避したコース」には、「最も難しいコース」の上限によってルーターが避けた難しいコースが一覧されます。',
  'help.guide.tour-ski-pistes-layer.step.2':
    'スイッチの横にある、4つの色の点のボタン「ゲレンデの凡例」をクリックします。',
  'help.guide.tour-ski-import.step.1':
    '「ツアー」タブで「ツアーを追加」（「この旅行のツアー」の上のプラス）をクリックし、「GPXまたはKMLをインポート」を選んでファイルを選択します。',
  'help.guide.tour-ski-import.tip.3':
    'GPX、KML、KMZファイルを「ツアー」タブのどこかにドロップしても、同じプレビューが開きます。',
  'help.ctx.trip-tour-paddle.bullet.5':
    '「風」には、計画した日のツアー出発地点での予報が表示されます。「チェックリスト」には、保存したルート上の障害物と、それぞれへの対応が一覧されます。',
  'help.guide.tour-paddle-setup.step.5':
    '湖の場合は「湖の横断」でルートを決めます。「まっすぐ」は最短ルート、「岸沿い」は風の強い日向けに岸の近くを通るルートです。',
  'help.guide.tour-paddle-water-route.title': '水上の区間を計画する',
  'help.guide.tour-paddle-water-route.tip.2':
    'ルートが堰を陸上運搬で迂回する場所や閘門を通る場所には、TREKが自動で地点を置き、「検出」と表示します。その地点を動かしたり変更したりすると、自分の地点になります。',
  'help.guide.tour-paddle-portage.step.3':
    '地点の下に、長さと追加の時間（分）が表示された「陸上運搬」カードが表示されます。クリックすると開きます。',
  'help.guide.tour-paddle-lock.goal': 'ツアーに閘門を追加し、待ち時間と通過時間を所要時間に含めます。',
  'help.guide.tour-paddle-lock.result':
    '閘門が時間（分）付きでツアーに追加され、「所要時間の見積もり」に加算されます。',
  'help.guide.tour-paddle-time.tip.1':
    '初期値は、水上4 km/h、運搬2 km/h、陸上運搬ごとに10分です。実測値ではなく、調整するための初期値です。',
  'help.guide.tour-paddle-wind.step.3':
    'バーは1日の時間ごとの風を示し、平均風速の後ろに突風が表示されます。バーにカーソルを合わせると、その時間の数値と風向きが表示されます。',
  'help.guide.tour-paddle-checklist.goal':
    '保存したルート上の堰、閘門、通行ルールについてわかっていることを確認し、それぞれでどうするかを決めます。',
  'help.guide.tour-paddle-checklist.tip.3':
    '「もう一度確認」と表示された項目は、ルートかデータが変わる前に決めたものです。決め直すか、「決定を維持」か「決定を削除」を選びます。当てはまらなくなった決定は「以前の決定」に一覧されます。',
  'help.guide.tour-paddle-track-marks.step.3': '「1件のツアーをインポート」をクリックします。',
  'help.guide.tour-paddle-track-marks.result':
    '記録したトラックに陸上運搬と閘門が含まれ、「所要時間の見積もり」で計算されます。',
  'help.guide.tour-horse-plan.title': '乗馬ルートに沿って乗馬を計画する',
  'help.guide.tour-horse-plan.step.7': '「ツアー名」に乗馬の名前を入力し、左の列の下部にある「保存」をクリックします。',
  'help.guide.tour-horse-gap.goal': '乗馬の終点から離れた場所で始まる区間に続けます。',
  'help.guide.tour-horse-gap.tip.3':
    '乗馬の終点から25 m以内で始まる区間は、そのまま終点から続きます。「ツアーとのつながり」には「ツアーの終点につながる」と表示されます。',
  'help.guide.tour-horse-recorded.tip.1':
    '線はファイルに記録されたままです。ルートが計算し直されることはなく、記録された乗馬には編集可能なバージョンはありません。',
  'help.guide.dateless-trip.result':
    'カードに「アイデア」と「日程未設定」が表示され、旅行には指定した数の空の日ができます。',
  'help.guide.trip-reminder.title': '旅行の前にリマインダーを受け取る',
  'help.guide.upcoming-reservations.tip.1': 'ホテルの宿泊は、チェックインとチェックアウトで2回表示されます。',
  'help.guide.half-company-holiday.result':
    '会社がその日を半日休みとし、その日に記録した休暇は半日分として数えられます。',
  'help.guide.edit-holiday-calendar.title': '休日カレンダーを変更・削除する',
  'help.guide.answer-fusion-request.result':
    '「承認して統合」を押すと、両方のプランが1つのグリッドに表示され、それぞれ自分の色で示されます。',
  'help.guide.log-for-partner.result': 'その日が相手の色で表示され、自分ではなく相手の付与日数から差し引かれます。',
  'help.guide.dissolve-fusion.tip.1':
    'その画面で「キャンセル」を押すと、プランはそのまま残ります。どちらの場合も、自分のエントリーは残ります。',
  'help.guide.country-places.tip.1':
    '違う国に分類されている場所は、たいてい住所か座標が間違っています。ここからその旅行を開き、場所を修正してください。',
  'help.guide.tour-activity-stats.title': 'ツアーの実績を確認する',
  'help.guide.tour-activity-stats.result':
    'ダイアログと「ツアー」タブの合計から、除外したツアーが外れます。ツアーのルート、日、旅行はそのままです。',
  'help.guide.move-to-list.tip.2':
    '移動すると場所がリストから外れるため、「リストに移動」はリストの所有者と管理者にだけ表示されます。「リストに複製」は、開けるリストならどこからでも使えます。',
  'help.guide.accept-list-invite.step.2': '参加するなら「承認」、断るなら「却下する」をクリックします。',
  'help.guide.tour-collection-add-to-trip.tip.2':
    '線なしで保存したツアーの場合は、ウェイポイントも一緒に追加する必要があります。ダイアログにその旨が表示され、その選択肢が自動で選ばれます。',
  'help.guide.tour-collection-manage.tip.1':
    'リストからツアーを削除しても、そのツアーから旅行にすでに作成したツアーは変わりません。',
  'help.guide.entry-draft.tip.2':
    'Dawarichから1日分を取り込むと、そのエントリーは下書きになります。共有する前に、バッジが付いていないか確認してください。',
  'help.guide.journey-map-layers.result':
    '地図には表示したいレイヤーだけが表示され、ピン、点、線の意味はすべて凡例で確認できます。',
  'help.guide.journey-keep-route.result':
    '日のヘッダーに距離が表示され、ルートが地図の「記録」レイヤーに実線で描かれます。日記の全員に表示されます。共有リンクでは、「記録したルート」がオンの場合だけ表示されます。',
  'help.guide.journey-day-stays.result':
    '判断した滞在は行から消えます。書いたエントリーはほかのエントリーと同じようにその日に表示され、いつもどおり写真やテキストを追加できます。',
  'help.guide.journey-take-over-day.tip.2':
    '下書きは共有リンクには表示されません。写真とテキストを追加したら、エントリーごとに「下書き」をオフにします。',
  'help.guide.journey-auto-prepare.tip.2':
    '日のリストボタンに点が付いている場合は、その日がまだ確定していません。理由はツールチップで確認できます。',
  'help.ctx.settings-plugins.bullet.3':
    '下部の「プラグインのアクティビティ」には、プラグインがあなたに代わって行った操作が新しい順にすべて表示されます。「更新」で再読み込みできます。',
  'help.guide.language-region.tip.3':
    '「週の開始」で、すべての日付選択の最初の列が決まります。Vacayには専用の設定があります。',
  'help.guide.web-push-device.tip.2': 'iPhoneとiPadでは、先にTREKをホーム画面に追加し、そこから開いてください。',
  'help.guide.connect-airtrail.step.3':
    '「保存」をクリックし、「接続をテスト」をクリックします。見つかったフライトの数が表示され、バッジが「接続済み」に変わります。',
  'help.guide.connect-dawarich.step.3':
    '「保存」をクリックし、「接続をテスト」をクリックします。過去30日間の滞在の数が表示されます。接続後は、「今すぐ確認」ですぐに確認でき、右側の「接続解除」で接続を終了できます。',
  'help.guide.tour-connect-wanderer.step.3':
    '「保存」をクリックし、「接続をテスト」をクリックします。インポートできるトレイルの数が表示され、バッジが「接続済み」に変わります。',
  'help.guide.tour-wanderer-watch.step.2':
    'TREKは最大1日1回、インポートした各トレイルの概要を読み込み、最後に確認した日時を行に表示します。トレイルが変わった可能性があると通知が届き、「お知らせ」の数が増えます。「お知らせ」をクリックすると、各ツアーが「変更の可能性」「変更あり」「確認できません」のいずれかで表示され、そこから開けます。',
  'help.guide.plugin-settings.goal':
    'プラグインに自分のキーと設定を入力し、プラグインがあなたに代わって行った操作を確認します。',
  'help.guide.own-routing-engine.result': 'すべての旅行のルートが、自分のサーバーで計算されます。',
  'help.guide.admin-passkeys.title': 'パスキーでのサインインを使えるようにする',
  'help.guide.rotate-jwt-secret.tip.1': '自分もサインアウトされるので、すぐにサインインし直してください。',
  'help.guide.notification-defaults.title': 'ユーザー向けの通知の既定値を設定する',
  'help.ctx.notifications.title': '通知',
  'help.guide.read-notifications.goal': '離れている間に旅行で起きたことを確認し、その場所を直接開きます。',
  'help.guide.filter-notifications.goal': 'すべての通知か、まだ読んでいない通知だけを確認します。',
  'help.guide.mark-notifications-read.step.1':
    '通知の時刻の横にある二重のチェック「既読にする」をクリックすると、その通知だけが既読になります。',
  'help.guide.delete-notifications.step.2':
    '上部の「すべて削除」を押すと、確認のダイアログのあとで一覧全体がまとめて削除されます。',
  'help.guide.notification-settings.step.3':
    '「設定」のサイドバーで「通知」をクリックします。最初のカードにはイベントごとの行があり、「アプリ内」の列でベルに表示する内容が決まります。',
  'help.guide.link-journal.result':
    '旅行のタブバーに「日記」タブが表示されます。「閲覧」か「編集」を許可した人は全員、このタブで日記を開け、内容はリアルタイムで更新されます。',
  'help.guide.create-place.tip.4':
    'Googleマップからコピーしたリンクも検索に使えます。貼り付けてEnterキーを押すと、TREKがリンクから場所を読み取ります。フォームに位置が入ると、検索の横の照準アイコン「このピンの近くの場所」で、周辺の場所を一覧できます。',
  'help.guide.dawarich-stays.step.2':
    '滞在は日ごとにまとめられ、到着時刻と出発時刻が表示されます。ゲージのアイコンは、Dawarichの判定に自信がない滞在です。滞在の横にあるピン「場所として追加」をクリックします。',
  'help.guide.leave-stop-off-route.step.3': '再びルートに含めるには、同じメニューを開いて「ルートに戻す」を選びます。',
  'help.guide.move-booking-day.tip.1':
    '複数日にまたがる予約の途中の日に表示される薄い行はドラッグできません。経由地のあるフライトの1区間だけをドラッグすることもできません。',
  'help.guide.place-image-from-file.step.2':
    'ヘッダーの丸い画像をクリックします。場所に写真があるので、画像をどこから選ぶかを尋ねる小さな画面が開きます。',
  'help.guide.place-own-hours.goal':
    '取得した営業時間が間違っている、またはない場合に、実際に確認した営業時間をカードに表示します。',
  'help.guide.place-own-hours.tip.2':
    '電話番号とメールはカードのヘッダーにピルで表示されます。クリックすると電話アプリやメールアプリが開きます。',
  'help.guide.edit-accommodation.tip.3':
    '「設定」の「表示」で「予約コードをぼかす」をオンにしている場合、予約番号はぼかされたままです。カーソルを合わせるかクリックすると読めます。',
  'help.guide.confirm-stay-booking.tip.1': 'もう一度ピルをクリックすると、予約は「保留」に戻ります。',
  'help.guide.map-markers.tip.4':
    '「設定」＞「表示」の「旅行と地図」で「未計画の場所を小さなマーカーで表示」をオンにすると、まだどの日にも入っていない場所が、写真も評価もない小さな点になります。選んだ場所は常に通常の表示になります。',
  'help.guide.tour-map-lines.step.1':
    '旅行のツアーはすべて、地図上にそれぞれの色の線で描かれ、出発地点にピンが付きます。ツアーに色を設定していればその色、設定していなければカテゴリの色が使われます。',
  'help.guide.car-stops.step.6': '「追加」をクリックします。',
  'help.guide.transport-details.step.4':
    'タイトルをクリックすると、フォームを開かずに名前を変えられます。「名前を変更」が今の名前が入った状態で開くので、新しい名前を入力して「保存」をクリックします。',
  'help.guide.export-transports-csv.goal':
    '旅行の移動をCSVファイルとしてTREKから書き出し、表計算ソフト、旅行代理店、印刷などに使います。',
  'help.guide.group-sort-bookings.result':
    '予約が選んだグループと順番で並びます。この設定はこのブラウザーに保存され、次回も使われます。',
  'help.guide.booking-on-map.step.1':
    '場所が紐づいた予約（「場所 / アクティビティ」、宿泊なら「宿泊」でリンク）のカードをクリックします。詳細が開きます。',
  'help.guide.export-bookings-csv.title': '予約を表計算ファイルとしてエクスポートする',
  'help.guide.export-bookings-csv.tip.3':
    'ボタンは、タブに予約が1件でもあれば表示されます。「移動」タブでも同じ方法でエクスポートできます。',
  'help.guide.arrange-packing-list.title': '持ち物リストを好きな順番に並べる',
  'help.guide.count-packed-pieces.result':
    '行に準備済みの個数が表示され、最後の1つを入れるとアイテムにチェックが付きます。',
  'help.guide.expense-receipts.title': '支出にレシートを添付する',
  'help.guide.expense-receipts.tip.1':
    'エディターで一覧のファイル名をクリックしても、同じプレビューが開きます。このときEscキーで閉じるのはプレビューだけで、支出は閉じません。',
  'help.guide.files-sync-settings.step.5':
    '「両方が変更された場合」で、両方で編集されたドキュメントのどちらを残すかを選びます：「確認する」「TREK のコピーを残す」「保存先のコピーを残す」。「自動で同期」をオンにすると、TREKがバックグラウンドで変更を確認します。オフにするとカードに「一時停止中」と表示され、「今すぐ同期」を押したときだけ同期されます。ここでの変更はすべてすぐに保存されます。',
  'help.guide.manage-notes.step.5':
    '「削除」を押すと、先に「メモを削除しますか？」と確認されます。ノートはファイルごと全メンバーから削除されるためです。「削除」をクリックして確定します。',
  'help.guide.note-categories.step.3':
    'カテゴリ名をクリックすると名前を変えられます。新しい名前を入力してEnterキーを押します。Escキーを押すと元の名前のままです。',
  'help.guide.roadtrip-reorder.step.2':
    '立ち寄り先を別の日に移すには、その日のカードの立ち寄り先の上にドロップします。ドラッグ中は、立ち寄り先が2つ未満の日がレールの最後に破線のカードで表示され、そこにもドロップできます。',
  'help.guide.roadtrip-corridor.tip.4':
    'フィルターの下で、その日の立ち寄り先を1つ、または「2つの中間」を選ぶと、その地点から25、50、100 km以内のものだけが表示されます。一覧に充電スポットがある場合は、「すべてのプラグ」と「すべての出力」で、コネクターと出力で絞り込めます。',
  'help.guide.roadtrip-overnight.result':
    'その場所がその日の宿泊地としてドライブに表示され、宿泊はほかの宿泊と同じように旅行に登録されます。',
  'help.guide.roadtrip-stop-fill.result':
    'この立ち寄り先では、選んだ量まで補給されます。その後の航続距離（「ここで燃料切れ」の帯を含む）は、この量をもとに計算されます。',
  'help.guide.roadtrip-bookings.step.4': 'カードをクリックすると予約が開きます。',
  'help.guide.roadtrip-google-import.goal': 'Googleマップで計画したルートを、旅行の1日の立ち寄り先として取り込みます。',
  'help.guide.roadtrip-google-import.tip.3': 'インポートには、接続と、場所と日の両方を編集する権限が必要です。',
  'help.guide.roadtrip-hazards.tip.2':
    'DWDはドイツ、GDACSは世界中の災害を対象としています。地点だけで示された警告は、影響範囲がわからないことを意味します。',
  'help.ctx.trip-tours.bullet.5':
    '日の列では、ツアーは立ち寄り先と同じような行で表示されます。「開始」を設定すると「開始 → 終了」と表示され、終了時刻はツアーの所要時間から計算されます。「その他のオプション」には「編集」「この日から削除」「ルートから外す」「コレクションに保存」があります。',
  'help.guide.tour-show-list.step.5': '同じスイッチの「場所」をクリックすると、場所の一覧に戻ります。',
  'help.guide.tour-add-to-day.step.2':
    '日を選びます。メニューには旅行のすべての日が日付とタイトル付きで並び、すでにそのツアーが入っている日はグレー表示になります。',
  'help.guide.tour-add-to-day.result':
    'ツアーがその日の中に表示され、地図上でもその線がその日の一部として表示されます。',
  'help.guide.tour-day-times.tip.2':
    '複数日ツアーのステージが1つ入った日には、終了時刻は計算されません。ツアーの所要時間はルート全体のものだからです。',
  'help.guide.tour-remove-from-day.step.3':
    'または、日のヘッダーをクリックして日を開き、一覧でツアーをクリックして、カード下部の「この日から削除」をクリックします。',
  'help.guide.tour-filter-list.step.3':
    '一覧にいろいろなツアーが混ざっている場合は、「出典」（TREK、GPXインポート、wanderer）、「ルートの上限」（T1〜T6）、「タイプ」（「ハイキング」「サイクリング」など）でさらに絞り込めます。チェックした値をもう一度クリックすると解除されます。',
  'help.guide.tour-hide-on-map.step.1':
    '一覧のツアーにカーソルを合わせ、行の右に表示される目のアイコン（「地図で非表示にする」）をクリックします。',
  'help.guide.tour-import-plan-tab.step.1': '「予定」タブで、右の列の上部にあるスイッチの「ツアー」をクリックします。',
  'help.ctx.trip-tour-detail.bullet.1':
    '「ツアー」一覧のツアー（先に右の列を「場所」から「ツアー」に切り替えます）、日の中のツアーの行、地図上の線のいずれかをクリックすると、地図の上にカードが開きます。カードを開いたままでも地図を操作できます。',
  'help.guide.tour-detail-read.step.2':
    'ヘッダーにツアーの名前と、概要を示すピルが表示されます。ツアーの種類、インポートしたものなら出どころ、予定の所要時間、距離、上り、下りです。',
  'help.guide.tour-detail-read.tip.3':
    'ツアーによっては、ほかの情報も表示されます。街歩きなら立ち寄り先、パドルツアーならチェックと風、実施済みのツアーなら「実際のトラック」、リストにリンクしたツアーなら「持ち物リスト」です。',
  'help.guide.tour-rename-colour.step.3':
    'ツアーの丸いタイルの角にある色の点「トラックの色」をクリックします。ヘッダーの下に「トラックの色」の欄が開きます。',
  'help.guide.tour-take-along.step.2':
    'ツアーにウェブページがある場合は、その横のボタンにサイト名（Komoot、AllTrails、Outdooractive、Wanderer）、それ以外のサイトなら「ウェブサイト」と表示されます。クリックすると新しいタブでページが開きます。',
  'help.guide.tour-copy-keep.goal':
    'この旅行内でツアーの別バージョンを作る、または今後の旅行のために自分のコレクションに保存します。',
  'help.guide.tour-copy-keep.tip.4':
    '「コレクション」は、コレクションアドオンがオンの場合だけ表示されます。閲覧しかできないリストは選べません。リストがまだない場合は、ダイアログに「コレクションを開く」が表示されます。',
  'help.guide.tour-packing-link.step.5':
    '「持ち物リストを開く」をクリックしてチェックを付けます。TREKが「リスト」タブの持ち物リストに切り替わります。',
  'help.guide.tour-files.step.2': 'その下の行にファイルの数が表示され、一覧が開きます。',
  'help.guide.tour-activity-link.step.2':
    '「実施日」で、実施した日を確認します。どの日にも当てはまらない場合は「日なし」を選びます。',
  'help.guide.tour-activity-compare.title': '計画と実際の結果を比べる',
  'help.guide.tour-activity-compare.result': 'その日の結果を、カードと地図ですぐに計画と比べられます。',
  'help.guide.tour-origin-check.tip.3':
    '「wanderer 未接続」は、アカウントがまだ接続されていないことを示します。「設定」の「連携」で接続してください。',
  'help.ctx.trip-tour-planner.bullet.5':
    '地図上部の「場所や住所を検索」で地図を移動できます。左下のピルでは、ツアーのタイプで使える地図（「地形図」や「衛星写真」など）を切り替えられ、「ポイントを配置」や3Dなど、開いているツアーのスイッチもあります。',
  'help.guide.tour-open-workspace.step.5':
    '地図上部の「場所や住所を検索」で地図をその場所に移動できるので、ツアーを行う場所から始められます。',
  'help.guide.tour-draw-route.goal': '新しいツアーの地点を地図上に置き、その間のルートをTREKに計算させます。',
  'help.guide.tour-draw-route.tip.2':
    '地図のピルで「地形図」か「ハイキング」を選ぶと道が表示されるので、道をクリックしやすくなります。そのタイプで使える道から離れすぎた地点には、ルートの代わりに通知が表示されます。',
  'help.guide.tour-type-profile.step.3':
    'サイクリングでは、タイプの下で「プロフィール」を選びます：「ツーリング」「ロード」「グラベル」、MTB。その下に、そのプロフィールで優先される道の説明が表示されます。',
  'help.guide.tour-edit-points.step.2':
    '「ウェイポイント」の行をクリックすると、その地点が選択されます。地図上のピンが強調表示されます。',
  'help.guide.tour-shaping-points.title': '形状ポイントでルートを変える',
  'help.guide.tour-shaping-points.tip.3':
    '乗馬では、ルーターがルートの形を決めないため、線をクリックしても何も追加されません。',
  'help.guide.tour-loop-reverse.tip.2':
    '「スタートへ戻る」の行を削除すると、片道のツアーに戻ります。手で描いた区間は、ツアーを逆向きにしても手描きのままです。',
  'help.guide.tour-leg-by-hand.step.4':
    '「次の区間を再計算」では、ほかの区間には触れずに、その区間だけをもう一度ルーターで計算します。',
  'help.guide.tour-trip-places.step.3':
    '場所をクリックします。ツアーの新しい終点として追加され、一覧は次の場所を選べるように開いたままになります。',
  'help.guide.tour-details-times.step.1':
    '左のレール上部の「ツアー名」に名前を入力します。新しいツアーで表示されているグレーの文字（「名前のないハイキング」など）はプレースホルダーなので、自分で名前を入力してください。',
  'help.guide.tour-save.title': 'ツアーを保存する',
  'help.guide.tour-save.tip.3':
    'アドレスになっていないウェブサイトなど、無効な値の欄がある場合も「保存」できません。「詳細」が自動で開き、その欄が表示されます。',
  'help.guide.tour-edit-saved.tip.1': '変更していないツアーでは、「保存」はグレー表示のままです。',
  'help.guide.tour-summary-profile.step.3':
    '「標高グラフ」の上でポインターを動かします。その地点の距離と標高が表示され、地図上の同じ地点に点が表示されます。',
  'help.guide.tour-list-manage.step.1':
    '「旅の合計」は一覧の上にあります。折りたたんだ状態では、ツアーの数と「予定」「未計画」の数が表示されます。右側の矢印で開くと、タイプごとに距離、上り、下り、時間の合計が1行ずつ表示されます。',
  'help.guide.tour-list-manage.result': 'フィルターで表示しているツアーの合計がわかり、各ツアーが希望の日に入ります。',
  'help.guide.tour-delete.result': 'ツアーが一覧、地図、すべての日から削除されます。',
  'help.guide.tour-saved-elsewhere.tip.2':
    '別の端末でツアーを変更した場合も同じです。変更していないツアーはそのまま再読み込みされ、その旨のメモが表示されます。',
  'help.ctx.trip-tour-import.bullet.5':
    '「設定」の「連携」でwandererを接続すると、ツアーを開いていない間は「新しいツアーを計画」の横にwandererボタンが表示されます。インポートできる自分のトレイルが一覧されます。',
  'help.guide.tour-import-gpx.tip.1':
    'パソコンからファイルを「ツアー」タブにドラッグ＆ドロップすることもできます。同じプレビューが開きます。',
  'help.guide.tour-view-import.step.1':
    '「ツアー」タブの「この旅行のツアー」で、「GPXインポート」バッジの付いたツアーをクリックします。',
  'help.guide.tour-plan-from-import.goal':
    '記録したトラックから動かせるウェイポイントを作り、新しいルートがトラックにどれだけ近いかを確認します。',
  'help.guide.tour-plan-from-import.tip.4':
    '「乗馬ツアー」には編集可能なバージョンはなく、実際に走ったとおりに保持されます。',
  'help.guide.tour-restore-recorded.tip.2':
    '「新しいツアーとして計画」で作ったツアーには、独自の記録されたトラックはありません。元のインポートは一覧に残っています。',
  'help.guide.tour-take-over.step.5': '必要に応じて「この旅での名前」で名前を変えます。',
  'help.guide.tour-import-wanderer.step.1':
    '「ツアー」タブでツアーを開いていない状態で、「新しいツアーを計画」の横のwandererをクリックします。',
  'help.guide.tour-import-wanderer.result': 'トレイルが旅行のツアーになり、wandererツアーとして地図上に開きます。',
  'help.guide.tour-map-layers.title': 'ツアーの地図を選ぶ',
  'help.guide.tour-map-layers.tip.3':
    'パドルツアーと街歩きで選べるのは「マップ」と「衛星写真」だけです。ランニング、スキーツアー、乗馬では「マップ」「地形図」「衛星写真」を選べます。',
  'help.guide.tour-along-search.result': 'ルート沿いの場所が一覧と地図に表示され、確認できるようになります。',
  'help.guide.tour-along-add-stop.step.3':
    '「立ち寄り先として追加」をクリックします。横のバッジは、寄り道の距離を直線で測ったおおよその目安です。',
  'help.guide.tour-3d-terrain.step.1':
    '「ツアー」タブでツアーを開き、左下のピルの右端にある3Dをクリックします。地図が傾いて地形が立体的に表示され、その上にルートが描かれます。',
  'help.guide.tour-3d-terrain.tip.3':
    '地形の表示には接続が必要です。標高は公開されているMapzenの地形タイルから取得します。パドルツアーは水面が平らなため、勾配の色分けなしで独自の色で描かれます。',
  'help.guide.tour-3d-flyover.tip.1':
    'フライオーバー中にマウスホイールを回すと拡大・縮小できます。カメラは点を追い続けます。一時停止するまでは地図をドラッグできません。',
  'help.guide.tour-map-overlays.step.4':
    'パドルツアーでは、ピルに代わりに「航路標識」が表示されます。クリックすると、水上のブイ、灯標、港の標識が表示されます。',
  'help.ctx.trip-tour-stages.bullet.2':
    '立ち寄り先の「その他の操作」メニューの「ここでステージを終える」で、その立ち寄り先でステージを区切ります。すると「ウェイポイント」に、ステージごとに「ステージN」の見出しと距離、時間が表示され、ステージの終点の立ち寄り先には月のアイコンが付きます。',
  'help.guide.tour-multi-day.step.3':
    '1日目が終わる立ち寄り先にカーソルを合わせ、「その他の操作」をクリックして「ここでステージを終える」を選びます。',
  'help.guide.tour-multi-day.result':
    '1つのルートがステージに分かれ、ステージごとに数値が計算されます。「保存」をクリックすると保存されます。',
  'help.guide.tour-stages-on-days.step.6':
    '横の矢印「このステージをプランナーで開く」で、そのステージを表示した状態でツアーがエディターに開きます。',
  'help.ctx.trip-tour-hike.bullet.1':
    'エディター上部の「ツアーの種類」で、ルートの計画方法が決まります。「ハイキング」では「詳細」の「登山道の難易度上限」までの道を使い、「ランニング」では走りやすい道を使い、「予定ペース」の入力が必要です。',
  'help.guide.tour-hike-plan.step.1':
    '左の列の上部にある「新しいツアーを計画」をクリックします。エディターが「新しいツアー」として開きます。',
  'help.guide.tour-hike-plan.tip.2':
    'T4以上では、最初に「アルパインルート検索を有効にしますか？」と確認されます。ルートが切り立った場所や標識のない地形を通ってもよい場合だけ確定してください。この確認は編集のたびに1回だけ表示されます。',
  'help.guide.tour-hike-trail-details.step.4':
    '一覧のグレードをクリックすると、その区間だけが地図に表示されます。もう一度クリックすると、ルート全体が表示されます。',
  'help.guide.tour-hike-round.step.1':
    'ハイキングを開いた状態で、「ウェイポイント」カードの見出しにある「スタートから周回ルート」をクリックします。別の立ち寄り先から始めるなら、その「その他の操作」を開いて「ここから周回ルート」を選びます。',
  'help.guide.tour-hike-round.tip.3':
    '「もう一度検索」で距離の指定に戻ります。「キャンセル」では何も変えずにカードを閉じます。',
  'help.guide.tour-hike-compare-ways.tip.1':
    'この機能はハイキングだけで、ルーターが計画した区間にだけ使えます。手で描いた区間には使えません。',
  'help.guide.tour-ferrata-add.step.4':
    '「ウェイポイント」では、その2つの地点の間の区間に、ヴィア・フェラータの名前、グレード、長さが表示されます。',
  'help.guide.tour-run-plan.goal': '走りやすい道でランニングを計画し、自分のペースから所要時間を出します。',
  'help.guide.tour-run-plan.tip.2':
    '上り、下り、道の技術的な難しさは時間に含まれません。時間は距離×ペースだけで計算されます。',
  'help.guide.tour-run-ways.result': '出発前に、ランニングのどの部分がアスファルトでないかがわかります。',
  'help.ctx.trip-tour-walk.bullet.4':
    '「ツアー沿い」では、ルートから一定の距離内で「散策のテーマ」に合う見どころを探せます。「立ち寄り先として追加」で、選んだ位置に見どころを街歩きに組み込みます。',
  'help.guide.tour-walk-plan.step.5':
    '「重要度」を「通常」「任意」「必見」から選びます。あとで変更が提案されても位置を変えたくない立ち寄り先は「保護」をオンにして、「保存」をクリックします。',
  'help.guide.tour-walk-sights.step.1':
    '街歩きを開いた状態で、左の列の「ツアー沿い」を見つけ、「散策のテーマ」を選びます：「文化と歴史」「公園と眺望」「食と地元の暮らし」「いろいろ」。',
  'help.guide.tour-walk-sights.result':
    '見どころが街歩きの立ち寄り先になり、選んだ立ち寄り先の間のルートに組み込まれます。',
  'help.guide.tour-walk-day-times.tip.2':
    '滞在時間がまだない立ち寄り先があると、それ以降の到着時刻は最も早い場合の時刻で表示されます。',
  'help.guide.tour-walk-google-import.step.3':
    '「リンク内の立ち寄り先」を確認します。リンクに位置がない立ち寄り先には印が付き、除外されます。',
  'help.guide.tour-walk-check-off.step.1':
    '「予定」タブで、その日の街歩きをクリックします。地図の横にカードが開きます。',
  'help.ctx.trip-tour-bike.title': 'サイクリング',
  'help.guide.tour-bike-profile.step.1': '「ツアー」タブで、左のレール上部の「新しいツアーを計画」をクリックします。',
  'help.guide.tour-bike-profile.tip.2':
    'プロフィールはルーターの目安にすぎず、その道を走れるかどうかは示しません。ルートの路面は「路面と道」カードで確認できます。',
  'help.guide.tour-bike-surfaces.step.3':
    '「路面」で「グラベル」や「未舗装の土」などの行をクリックします。その区間が地図上で強調表示されます。もう一度クリックすると強調表示が消えます。',
  'help.guide.tour-bike-mtb-grades.goal': 'MTBツアーのトレイルがどれくらい難しいかを、走る前に確認します。',
  'help.guide.tour-bike-mtb-grades.tip.4':
    '「プロフィール」をMTB以外にすると、グレードの欄は消え、ルートが新しいプロフィールで計画し直されます。',
  'help.guide.tour-ski-plan.title': 'スキー・冬のツアーを計画する',
  'help.guide.tour-ski-plan.tip.1':
    '「クロスカントリー」では「走法」も選びます：「クラシカル」「スケーティング」「不明」。入力欄の下の通知に、まだ足りない項目が表示されます。',
  'help.guide.tour-ski-options.step.2':
    '「最も難しいコース」を開き、滑りたい最高のグレードを「初心者」から「エキスパート」の中から選びます。初期設定は「中級」です。',
  'help.guide.tour-ski-fix-leg.title': '計画できなかったスキーの区間を直す',
  'help.guide.tour-ski-fix-leg.tip.4':
    'すべての区間が計画されるまで、「ゲレンデルート」カードにはスキー時間がまだないと表示されます。',
  'help.guide.tour-ski-summary.tip.2':
    'すべての区間が計画されるまで、「スキー時間」は「計算なし」のままです。それでもツアーに時間を設定したい場合は、詳細に予定の合計時間を入力します。',
  'help.guide.tour-ski-pistes-layer.step.3':
    '凡例には、難易度別の滑降コース、クロスカントリーコース、冬季・スノーシューのルート、そりコース、リフトが表示されます。「OpenSnowMap の完全な凡例」で、すべての凡例が開きます。',
  'help.guide.tour-ski-import.step.2': '「インポートのプレビュー」で「取り込む種類」を開き、「スキーと冬」を選びます。',
  'help.guide.tour-ski-import.result':
    'トラックが「この旅行のツアー」に追加され、「スキーのトラック」カードに種目と走法が表示されます。',
  'help.ctx.trip-tour-paddle.bullet.6':
    '左の列の下部にある「パドリングにはリスクがあります」の行を押すと、「水上での安全」が開きます。地図には「マップ」と「衛星写真」があり、重ねて表示できる「航路標識」もあります。',
  'help.guide.tour-paddle-setup.step.6':
    '「パドル速度」には、ボートに合わせた提案値がグレーで表示されます。自分の値を入力すると欄に「自分の速度」と表示され、その下のリンク「提案値を使う」でボートの速度に戻せます。',
  'help.guide.tour-paddle-water-route.goal':
    '川や湖に沿った区間をTREKに計画させ、計画できなかった区間のメモの意味を理解します。',
  'help.guide.tour-paddle-water-route.tip.3':
    '計画した区間の下のメモには、グレード付きの急流、「カヌー水路」、直線でつないだ「地図データの欠落」が表示されます。',
  'help.guide.tour-paddle-portage.step.4':
    '「ルート」で、「道に沿う」なら地図にある道を使い、「直線」ならまっすぐ横切ります。TREKが自動で道を探し、大きな遠回りをしないと道がない場合はその旨を表示します。',
  'help.guide.tour-paddle-lock.step.1':
    '閘門の立ち寄り先にカーソルを合わせ、三点アイコンの「その他の操作」をクリックします。',
  'help.guide.tour-paddle-time.title': 'パドルツアーの所要時間を確認・調整する',
  'help.guide.tour-paddle-time.tip.2': '水の流れと風は見積もりに含まれません。',
  'help.guide.tour-paddle-wind.step.4':
    '「風がパドリングに与える影響」を開くと、向かい風、横風、開けた水面の横断、突風がボートにどう影響するかがわかります。',
  'help.guide.tour-paddle-checklist.step.1':
    'パドルツアーを保存し、左の列で「チェックリスト」を見つけます。見出しのバッジで、リストの進み具合がわかります。',
  'help.guide.tour-paddle-checklist.tip.4':
    '障害物の情報は、TREKが持っている地域のOpenStreetMapデータから取得します。データがない場合はカードにその旨が表示されるので、堰、閘門、陸上運搬は自分で確認してください。',
  'help.guide.tour-paddle-track-marks.step.4':
    '「この旅行のツアー」でトラックをクリックします。左の列に記録したままの状態で表示され、「陸上運搬と閘門」カードもあります。',
  'help.ctx.trip-tour-horse.title': '乗馬',
  'help.guide.tour-horse-plan.goal': '地図上の標識付き乗馬ルートの区間をつなげて、乗馬を組み立てます。',
  'help.guide.tour-horse-plan.result':
    '乗馬が取り込んだ区間をたどり、区間ごとにルート名、アクセスの点、長さが表示されます。乗馬は「この旅行のツアー」に一覧されます。',
  'help.guide.tour-horse-gap.step.1':
    '乗馬に区間がある状態で別のルートを開き、乗馬の終点に接していない区間を選びます。「ツアーとのつながり」に、どれだけ離れているかが表示されます。',
  'help.guide.tour-horse-recorded.title': 'GPXファイルの記録から乗馬を保存する',
  'help.guide.tour-horse-recorded.tip.2':
    '標高のないファイルでは、上りが0と表示される代わりに「ファイルに標高がありません」と表示されます。',
  'help.guide.dateless-trip.tip.1':
    '旅行の時期が決まったら、カードの鉛筆アイコンでフォームを開いて日付を選びます。計画済みの日は順番を保ったまま、その順に日付が割り当てられます。',
  'help.guide.trip-reminder.goal': '出発の数日前にリマインダーを受け取ります。',
  'help.guide.upcoming-reservations.tip.2':
    '「保留」はまだ確定していない予約を示します。キャンセルした予約とアーカイブした旅行は表示されません。',
  'help.guide.half-company-holiday.tip.1':
    'その日にすでに記録された休暇は半日分に減ります。あとからその日に記録する人は0.5日だけ消費します。',
  'help.guide.edit-holiday-calendar.goal':
    '追加した祝日や学校の休暇のカレンダーの名前、色、並び順を変えたり、削除したりします。',
  'help.guide.person-color.title': '人の色を変える',
  'help.guide.answer-fusion-request.tip.1':
    '招待は返事をするまで残ります。招待が複数ある場合は、1つずつ順番に表示されます。',
  'help.guide.log-for-partner.tip.1': '「半休」と「代休・フレックス」は、選択した人にも使えます。',
  'help.guide.dissolve-fusion.tip.2': '自分の日を見せるだけなら、代わりにカレンダーを共有してください。',
  'help.guide.country-details.tip.2':
    '「場所」バッジをクリックすると、その国として数えたすべての場所が旅行ごとに表示されます。',
  'help.guide.country-places.tip.2':
    'このバッジは、その国に場所がある場合だけ表示されます。手動でマークしただけの国には場所がありません。',
  'help.guide.tour-activity-stats.goal':
    'すべての旅行で行ったツアーの距離、獲得標高、件数を期間とタイプ別に確認し、実際には行かなかったツアーを除外します。',
  'help.guide.tour-activity-stats.tip.1':
    'ツアーは、最後の日が終わると集計されます。どの日にも入っていないツアーや、日付のない日にだけ入っているツアーは集計されません。集計するには、旅行の日付のある日にツアーを入れてください。',
  'help.guide.move-to-list.result': '場所が別のリストに入り、移動・複製した数が短いメッセージで表示されます。',
  'help.guide.accept-list-invite.tip.1':
    'リストでできることは、所有者が割り当てた役割（「閲覧者」「編集者」「管理者」）によって決まります。',
  'help.guide.tour-collection-add-to-trip.title': 'リストのツアーを旅行に追加する',
  'help.guide.tour-collection-add-to-trip.tip.3':
    'ツアーをリストに保存するには、旅行で保存済みのツアーを開き、下部の「コレクション」をクリックします。',
  'help.guide.tour-collection-manage.tip.2': 'ゴミ箱アイコンは、リストの所有者と管理者にだけ表示されます。',
  'help.guide.entry-draft.result':
    'エントリーは「下書き」と表示されてタイムラインに残り、共有リンクには表示されません。',
  'help.guide.journey-map-layers.title': '日記の地図に表示する内容を選ぶ',
  'help.guide.journey-keep-route.title': 'その日に記録したルートを保存する',
  'help.guide.journey-day-stays.title': 'Dawarichが記録した滞在からエントリーを書く',
  'help.guide.journey-take-over-day.title': '記録した1日をまるごと取り込む',
  'help.guide.journey-take-over-day.result':
    'その日には、滞在かまとめたグループごとに下書きが1つずつ、または1日のレポートが1つでき、その滞在は未処理として表示されなくなります。',
  'help.guide.journey-auto-prepare.result':
    'リンクした旅行の期間中は、毎日の滞在がその日に一覧され、「1日を取り込む」ですぐに取り込めます。',
  'help.ctx.settings-about.title': '情報',
  'help.guide.web-push-device.tip.3':
    'プッシュを使うには、TREKをHTTPSで開く必要があります。通知がブロックされている場合は、ブラウザーの設定で許可してからもう一度試してください。',
  'help.guide.connect-airtrail.result':
    'バッジが「接続済み」になり、旅行の「移動」タブに「AirTrail からインポート」が表示されます。',
  'help.guide.connect-dawarich.result':
    'バッジが「接続済み」になり、旅行プランナー、日記、AtlasでDawarichの記録を使えるようになります。',
  'help.guide.tour-connect-wanderer.result':
    'バッジが「接続済み」になり、旅行の「ツアー」タブで自分のwandererを検索してトレイルをインポートできるようになります。',
  'help.guide.tour-wanderer-watch.result':
    'TREKがインポートしたトレイルを確認し、変更された可能性があると通知します。ツアーが変わるのは、変更を承認したときだけです。',
  'help.guide.plugin-settings.step.1':
    '設定のサイドバーで「プラグイン」を開きます。「プラグイン設定」の下に、設定が必要なプラグインごとに入力欄付きのカードがあります。入力して「保存」をクリックします。カードの操作は、確認後に実行されます。',
  'help.guide.profile.step.3': 'カード下部の右側にある「プロフィールを保存」をクリックします。',
  'help.guide.default-user-settings.title': '新規ユーザーの初期設定を決める',
  'help.guide.own-routing-engine.tip.1':
    '公開のOSRMサーバーでは、リクエストはおよそ1秒に1回までです。1日分の計算には十分ですが、ロードトリップでは遅すぎることがあります。',
  'help.guide.admin-passkeys.goal': '指紋、顔認証、端末のPINでサインインできるようにします。',
  'help.guide.rotate-jwt-secret.tip.2':
    '特定の1人だけをサインアウトさせるには、「ユーザーを編集」で「新しいパスワード」を設定してください。その人のセッションだけが終了します。',
  'help.guide.notification-defaults.goal':
    '全ユーザーの通知の初期設定を決め、イベントごとにチャンネルを完全にブロックします。',
  'help.ctx.notifications.summary':
    'TREKがアプリ内で表示したすべての通知が、新しい順に並びます。誰かが予約を変更した、旅行のチャットに新しいメッセージが届いた、カレンダーが共有された、などです。右上のベルには最新の10件が、このページにはすべてが表示されます。',
  'help.guide.read-notifications.step.1': '右上のベルをクリックします。ベルの赤い数字は未読の通知の数です。',
  'help.guide.filter-notifications.step.1': '右上のベルをクリックします。',
  'help.guide.mark-notifications-read.step.2':
    '上部の「すべて既読」をクリックすると、すべての通知がまとめて既読になります。',
  'help.guide.delete-notifications.tip.1':
    '削除すると、自分の通知だけが消えます。通知に関係する予約、メッセージ、共有はそのままです。',
  'help.guide.notification-settings.tip.1':
    'セルの鍵のマークは、管理者がそのイベントを全員に対してオフにしていることを示します。',
  'help.guide.add-guest.tip.3':
    'ゲストの追加、名前の変更、削除ができるのは旅行の所有者だけです。支出を支払ったゲストは、支払者を変えるか支払いを削除するまで削除できません。',
  'help.guide.link-journal.tip.1':
    'リンクできるのは自分が所有する日記だけです。書き込みだけができる日記はリンクできません。',
  'help.ctx.trip-places.bullet.7':
    '検索の横のチェックで選択を始めます。列の下部のバーで、複数の行にまとめて新しいカテゴリを付ける、コレクションに追加する、訪問済みにする、削除する、といった操作ができます。',
  'help.guide.filter-places.step.5':
    '旅行が複数の国や地域にまたがる場合は、地球儀のボタンで一覧を1つの国か、その中の1つの地域に絞り込めます。それぞれ件数付きで表示されます。「フィルター解除」で「すべての国」に戻ります。',
  'help.guide.import-places-file.tip.3':
    'ツアーがオン（初期設定）の場合は、列の上部の「ツアー」で「GPXまたはKMLをインポート」からファイルを取り込み、線がツアーになります。ツアーには線しか含まれないため、ファイル内のピンはインポートされません。',
  'help.guide.dawarich-stays.step.3':
    '「名前」「到着」「出発」を確認し、「日」を選ぶか「まだ日付が未設定」のままにします。必要なら「ノート」を追加して、「場所を追加」をクリックします。',
  'help.guide.leave-stop-off-route.result':
    '立ち寄り先はその日とPDFに含まれたままです。「ルート外」の間は、ルートが前の立ち寄り先から次の立ち寄り先へ直接進みます。',
  'help.guide.move-booking-day.tip.2': '時刻のある予約は、同じ日の中では必ず時刻の位置に戻ります。',
  'help.guide.place-image-from-file.step.3':
    '「添付ファイルから」で使いたい写真をクリックします。その上の「デバイスからアップロード」では、パソコンから新しい写真を選べます。',
  'help.guide.place-own-hours.step.1': '場所を開き、カード右下の「編集」をクリックします。場所のフォームが開きます。',
  'help.guide.place-own-hours.tip.3':
    '「営業時間を削除」をクリックしてから「更新」すると、自動で取得した営業時間がカードに戻ります。',
  'help.guide.confirm-stay-booking.title': '宿泊の予約を確定する',
  'help.guide.confirm-stay-booking.tip.2': '同じピルはすべての予約で使えます。日の「予約」の下にある予約でも使えます。',
  'help.guide.map-lock.tip.2':
    'ロックの状態は、このブラウザーで旅行ごとに記憶されます。旅行を開くと、地図は一度だけ旅行全体に合わせて表示されるので、何もない場所が表示されることはありません。',
  'help.guide.tour-map-lines.step.2':
    '線か、出発地点のピンをクリックします。地図の下部にツアーのカードが開き、線が白い縁取り付きで太く表示されるので、ほかの線の中でも見分けられます。カードのヘッダーの×で閉じます。',
  'help.guide.car-stops.title': '途中に立ち寄るドライブを計画する',
  'help.guide.car-stops.result':
    'ドライブが「移動」タブのカードと、その日の行になります。地図上の線は、受取地点からすべての立ち寄り先を順番に通り、返却地点まで続きます。',
  'help.guide.transport-details.step.5':
    '詳細の下部の「地図上」で、移動の線を表示し、その日の「予定」を開きます。右端の「編集」でフォーム全体が開き、その横のゴミ箱アイコンで、確認後に移動を削除します。',
  'help.guide.export-transports-csv.step.1':
    '一部だけ書き出したい場合は、先に一覧を絞り込みます。「検索」「フィルター」、「表示オプション」の並べ替えがすべて反映され、タブに表示されている内容がその順番のままファイルになります。',
  'help.guide.group-sort-bookings.tip.1':
    '「カード」と「リスト」には、それぞれ別のグループ化が設定されます。初期設定は「カード」が「ステータス」、「リスト」が「日」です。「表示オプション」に点が付いていると初期設定から変わっていることを示し、パネル下部の「表示をリセット」で初期設定に戻ります。',
  'help.guide.booking-on-map.step.2': '詳細の下部にある「地図上」をクリックします。',
  'help.guide.export-bookings-csv.goal':
    '旅行の予約をCSVファイルとして書き出し、Excel、Numbersなどの表計算ソフトで開きます。',
  'help.guide.arrange-packing-list.goal':
    'リストやアイテムを好きな位置に動かしたり、各リストを名前順で表示したりします。',
  'help.guide.check-off-packing.tip.4':
    '数量が2以上のアイテムは、1つずつ準備済みにすることもできます。ガイド「同じものを複数持っていく」を参照してください。',
  'help.guide.count-packed-pieces.tip.1':
    'チェックボックスにチェックを入れるとすべての個数が準備済みになり、チェックを外すとすべて未準備に戻ります。',
  'help.guide.expense-receipts.goal':
    'レシートや請求書を対応する支出と一緒に保存し、台帳からいつでも開けるようにします。',
  'help.guide.expense-receipts.tip.2':
    'レシートの横のゴミ箱アイコンを使うと、保存時にそのレシートが支出から外れます。ファイル自体は「ファイル」に残るので、完全に削除するにはそこで削除します。',
  'help.guide.files-sync.tip.4':
    'カードに「再接続」付きの黄色いお知らせが表示された場合は、保存したサインイン情報が保管先で使えなくなっています。「再接続」をクリックして新しいアプリパスワードかトークンを入力すると、同期が再開されます。',
  'help.guide.files-sync-settings.result':
    '次の同期から、旅行は選んだ方向にだけ同期され、削除や競合する編集は設定したルールで処理されます。',
  'help.guide.manage-notes.result':
    'ノートが「ノート」カードから全メンバー分まとめて削除されます。固定や変更をしただけのノートは残り、ほかのメンバーにもその状態で表示されます。',
  'help.guide.note-categories.step.4':
    '行の色の点で、そのカテゴリの色を選びます：インディゴ、「赤」「アンバー」、エメラルド、「青」、バイオレット。この例では「宿泊」をアンバーにしています。',
  'help.guide.roadtrip-reorder.step.3':
    'キーボードでは、立ち寄り先にフォーカスしてAltキーと上下の矢印キーを押すと、その日の中で1つずつ移動できます。',
  'help.guide.roadtrip-overnight.title': 'ルートの途中で1泊する',
  'help.guide.roadtrip-overnight.tip.1':
    '宿泊は翌日までです。日程を変えるには予約を変更します。宿泊のほかの項目と一緒に「日」で日付を変えてください。',
  'help.guide.roadtrip-stop-fill.tip.1':
    'バッジが表示されるのは、車に補給できる立ち寄り先だけです。「ガソリン」なら給油の立ち寄り先、「電気」なら充電の立ち寄り先、「両方」ならどちらにも表示されます。',
  'help.guide.roadtrip-bookings.result':
    '予約した移動がすべて、その時点の位置でドライブに組み込まれ、その前後の道路はターミナルまで、またはターミナルからのルートになります。',
  'help.guide.roadtrip-google-import.step.1':
    '「ルートの途中」上部の三点メニューをクリックし、「Google Mapsのルートをインポート」を選びます。',
  'help.guide.roadtrip-hazards.title': '現在の警告を地図に表示する',
  'help.guide.roadtrip-hazards.tip.3':
    'データは10分ごとに更新され、接続が必要です。ほかの運転の設定と同じく、このスイッチは旅行ごとに保存されます。',
  'help.ctx.trip-tours.bullet.6': 'ルートの変更とツアーの削除は、「ツアー」タブの「この旅行のツアー」で行います。',
  'help.guide.tour-show-list.tip.1':
    '地図上でツアーの線をクリックすると、一覧でそのツアーが強調表示され、その位置までスクロールします。',
  'help.guide.tour-add-to-day.step.3':
    '「10日目に追加しました」と表示され、行に「日」バッジが付きます。左の列のその日に、ツアーが時間、距離、獲得標高付きで表示されます。',
  'help.guide.tour-day-times.title': 'その日のツアーに開始時刻を設定する',
  'help.guide.tour-day-times.tip.3':
    '同じメニューの「ルートから外す」では、ツアーはその日に残したまま、地図上のその日のルートから外します。「ルートに戻す」で元に戻ります。',
  'help.guide.tour-remove-from-day.tip.1':
    '複数日ツアーは、1日ずつ外します。日ごとにそれぞれのステージがあるためです。',
  'help.guide.tour-filter-list.step.4':
    'メニューを閉じます。ボタンにステータス、残ったツアーの数、追加で設定したフィルターごとに+1が表示されます。',
  'help.guide.tour-hide-on-map.step.2':
    'ツアーの線が地図から消えます。行は一覧に薄く表示されたまま残り、斜線の入った目のアイコン（「地図に表示」）が表示されます。クリックすると線がまた表示されます。',
  'help.guide.tour-import-plan-tab.step.2':
    '一覧の上部の「GPXまたはKMLをインポート」をクリックし、ファイル（GPX、KML、KMZ）を選びます。',
  'help.ctx.trip-tour-detail.bullet.2':
    'ヘッダーには、ツアーの丸いタイル、名前と名前を変える鉛筆アイコン、線の色を示す色の点、タイプ、出どころ、予定時間、距離、上り、下りのピルが表示されます。右の×かEscapeキーでカードを閉じます。',
  'help.guide.tour-detail-read.step.3':
    '時間にカーソルを合わせると、移動時間、休憩、予定の合計という内訳が表示されます。',
  'help.guide.tour-detail-read.tip.4':
    'このカードではルートは変わりません。地点を動かしたり区間を描き直したりするには、「ツアー」タブを開き、「この旅行のツアー」でツアーをクリックします。',
  'help.guide.tour-rename-colour.step.4':
    '色を選びます。最初の「自動の色」で線を既定の色に戻し、最後の「カスタムカラーを選択」で好きな色を選べます。地図上の線と「ツアー」一覧の色の帯がすぐに変わります。',
  'help.guide.tour-take-along.step.3':
    '「GPX」をクリックすると、保存したツアーがGPXファイルでダウンロードされます。標高データを含むルート全体が入っていて、ナビアプリやGPS端末でそのまま使えます。',
  'help.guide.tour-copy-keep.step.1':
    'ツアーのカードを開き、下部の「コピー」をクリックします。日の割り当てのない独立した新しいツアーが作成され、元のツアーはそのまま残ります。',
  'help.guide.tour-copy-keep.result':
    '旅行に自由に変更できる2つ目のツアーができ、コレクションには別のコピーが保存されて、ほかの旅行にも追加できます。',
  'help.guide.tour-packing-link.tip.1':
    'これはリンクするだけです。何もコピー・移動されず、アイテムは「リスト」に残ります。そこでチェックを付けると、ツアーにすぐ反映されます。',
  'help.guide.tour-files.step.3': 'ファイルをクリックすると開きます。',
  'help.guide.tour-activity-link.step.3':
    '「トラック」で記録を選ぶか、「GPXをインポート」をクリックして新しいファイルを取り込みます。',
  'help.guide.tour-activity-compare.goal':
    '実際のトラックが計画とどこで違うかを確認し、トラックを変更したりリンクを解除したりします。',
  'help.guide.tour-origin-check.title': 'ツアーの出どころを確認する',
  'help.guide.tour-origin-check.result': 'ツアーがどこからいつ来たのか、その後変更されたかどうかがわかります。',
  'help.ctx.trip-tour-planner.bullet.6':
    '未保存の下書きは保持されます。「ツアー」タブをもう一度開くと「未保存の下書きを復元しました」と表示されて元に戻ります。「ツアー一覧に戻る」と「キャンセル」は、変更を破棄する前に確認します。',
  'help.guide.tour-open-workspace.step.6':
    '左下のピルで地図を切り替えます。最初は「マップ」と「衛星写真」です。ツアーを開くと、そのタイプ用の地図（「地形図」や「ハイキング」など）と、「ポイントを配置」や3Dなどのスイッチが表示されます。',
  'help.guide.tour-draw-route.step.1':
    '左のレール上部の「新しいツアーを計画」をクリックします。レールが「新しいツアー」に変わります。ほかのタイプを選ばなければハイキングになります。',
  'help.guide.tour-draw-route.tip.3':
    '下書きに未保存の変更がある場合、「ツアーを追加」メニューの「新しいツアーを計画」を選ぶと、先に「新しいツアーを開始しますか？」と確認され、「破棄して開始」を選べます。',
  'help.guide.tour-type-profile.step.4':
    'ルートがそのプロフィールで計画し直され、右の「ツアーの概要」に距離と時間が表示されます。',
  'help.guide.tour-edit-points.step.3':
    '順番を変えるには、行にカーソルを合わせ、左端に表示されるグリップをドラッグします。',
  'help.guide.tour-shaping-points.goal': '立ち寄り先を追加せずに、ルートを別の道に変えます。',
  'help.guide.tour-shaping-points.result': 'ルートがドラッグした位置を通り、立ち寄り先の番号は変わりません。',
  'help.guide.tour-loop-reverse.tip.3':
    'ハイキングでは、その横の「スタートから周回ルート」で、指定した長さの周回ハイキングを探せます。',
  'help.guide.tour-leg-by-hand.tip.1':
    '手で描いた区間は、ルーターで確認されていません。水域、私有地、崖を通っている可能性があります。',
  'help.guide.tour-trip-places.step.4':
    'その行の名前の下に「旅の場所」と表示されます。「その他の操作」の「場所とのリンクを解除」を使うと、地点は残したままリンクだけを外せます。',
  'help.guide.tour-details-times.step.2':
    '「詳細」で「説明」を書き、ウェブサイトがあれば「ウェブサイト」に入力します。',
  'help.guide.tour-save.goal': '描いたツアーを旅行に保存します。',
  'help.guide.tour-save.result': 'ツアーが旅行に保存され、日に入れられるようになります。',
  'help.guide.tour-edit-saved.tip.2':
    'インポートしたGPXやKMLのトラックは、閲覧用の「GPXツアー」として開きます。そこで「編集可能なバージョンを計画」を使うと、変更できるツアーができます。',
  'help.guide.tour-summary-profile.step.4':
    'タイトルの横の矢印「標高グラフを折りたたむ」でグラフを隠せます。もう一度クリックすると表示されます。',
  'help.guide.tour-list-manage.step.2':
    'ツアーにカーソルを合わせ、行の丸いプラス「この日に追加」をクリックすると、旅行の日の一覧が開きます。',
  'help.guide.tour-delete.title': 'ツアーを削除する',
  'help.guide.tour-saved-elsewhere.title': 'ツアーがほかの場所で保存されていた場合',
  'help.guide.tour-saved-elsewhere.result': '誰かが破棄を選ばない限り、変更が失われることはありません。',
  'help.guide.tour-import-gpx.title': 'GPX、KML、KMZファイルをツアーとしてインポートする',
  'help.guide.tour-import-gpx.tip.2':
    'ファイル内のトラックやルートは、それぞれ別のツアーになります。トラックがつなげられることはありません。',
  'help.guide.tour-view-import.step.2':
    '左の列に「GPXツアー」として表示されます。「ツアーの概要」に距離、標高、記録時間が表示され、その下に標高グラフがあります。地図にはその線が表示されます。',
  'help.guide.tour-plan-from-import.step.1':
    '「ツアー」タブでインポートしたツアーを開きます。左側の「編集可能なバージョン」カードで「編集可能なバージョンを計画」をクリックします。',
  'help.guide.tour-plan-from-import.result':
    'ツアーにドラッグできるウェイポイントができ、「出どころ」に「計画し直し済み、記録トラックは保持」と表示されます。',
  'help.guide.tour-restore-recorded.result': 'ツアーがGPXツアーに戻り、記録したときの線が表示されます。',
  'help.guide.tour-take-over.step.6': '「取り込む」をクリックします。',
  'help.guide.tour-import-wanderer.step.2':
    '「トレイルを検索」に入力します。「この地図の範囲を検索」では、表示中の地図の範囲にあるトレイルだけが表示されます。',
  'help.ctx.trip-tour-map.title': 'ツアーの地図',
  'help.guide.tour-map-layers.goal':
    'ツアーの種類にいちばん合った地図で計画します。登りには等高線、標識のあるトレイルやサイクリングルート、または航空写真を使えます。',
  'help.guide.tour-along-search.title': 'ツアー沿いの場所を探す',
  'help.guide.tour-along-search.tip.1':
    'ルート、種類、距離を変えると「もう一度検索」が強調表示され、一覧が変更前のルートで検索した結果であることが示されます。クリックすると一覧が更新されます。',
  'help.guide.tour-along-add-stop.step.4':
    'ルートがその場所を通るように計画し直され、「ツアー沿い」に、増えた距離と時間が表示されます。同じ行の「元に戻す」で立ち寄り先を取り消せます。',
  'help.guide.tour-3d-terrain.step.2':
    'ルートは勾配で色分けされます。下部の列の「勾配」をクリックするとツアーの色で表示され、もう一度クリックすると勾配の色分けに戻ります。',
  'help.guide.tour-3d-flyover.title': 'ツアーに沿って空から見る',
  'help.guide.tour-3d-flyover.tip.2':
    'フライオーバーは、ルート全体の地形を読み込んでから始まるので、途中で地図データの読み込みのために止まることはありません。輪にカーソルを合わせると、読み込みの進み具合がわかります。',
  'help.guide.tour-map-overlays.result': '地図にゲレンデや航路標識が表示され、凡例でその意味がわかります。',
  'help.ctx.trip-tour-stages.bullet.3':
    '「ツアーの概要」の「ステージ」に、すべてのステージが開始と終了の立ち寄り先付きで一覧されます。ステージをクリックすると、その最後の立ち寄り先が選択され、標高グラフにその地点が示されます。',
  'help.guide.tour-multi-day.step.4':
    '「ウェイポイント」が「ステージ1」と「ステージ2」に分かれ、それぞれ距離と時間が表示されます。ステージの終点の立ち寄り先には月のアイコンが付きます。',
  'help.guide.tour-stages-on-days.title': '複数日ツアーを旅行の日に入れる',
  'help.guide.tour-stages-on-days.tip.1':
    '最後のステージより前に旅行が終わる場合は、収まる最後のステージが選択肢に表示されます。それ以降のステージは日に入りません。',
  'help.ctx.trip-tour-hike.bullet.2':
    '「ウェイポイント」には立ち寄り先が順番に並びます。「地点を追加」は最初からオンなので、地図をクリックすると次の地点が置かれます。横の「旅の場所」で、旅行の山小屋やホテルを立ち寄り先にできます。',
  'help.guide.tour-hike-plan.step.2':
    '「ツアーの種類」を開き、「ハイキング」（徒歩、設定した難易度の範囲内）を選びます。',
  'help.guide.tour-hike-plan.tip.3':
    '難易度の下の「ルートの選び方」で、ルートの希望を設定します：「急な登りを避ける」「階段を避ける」「フェリーを避ける」。ほかに道がない場合は、それでもその道を通ります。',
  'help.guide.tour-hike-trail-details.step.5':
    '「路面」をクリックすると、アスファルトから未舗装の土や岩まで、歩く路面ごとに同じルートを確認できます。',
  'help.guide.tour-hike-round.step.2':
    '地図の上に「周回ハイキング」カードが開きます。「出発地」で出発地点を確認し、希望の「距離」を入力します。横のピルに、周回ルートの長さの範囲が表示されます。',
  'help.guide.tour-hike-compare-ways.title': 'ハイキングの区間でほかの道と比べる',
  'help.guide.tour-hike-compare-ways.tip.2':
    'ルーターがほかの道を見つけられない場合は、カードにその旨が表示されます。選んだ道をルーターがたどれない場合は、区間はそのままで、カードでお知らせします。',
  'help.guide.tour-ferrata-add.step.5':
    '右の「ツアーの概要」にグレード付きの「ヴィア・フェラータ」バッジが表示され、エディターの上部に「ルートがヴィア・フェラータを通ります」という警告が表示されます。',
  'help.guide.tour-run-plan.step.1':
    '「新しいツアーを計画」をクリックし、「ツアーの種類」を開いて「ランニング」を選びます。',
  'help.guide.tour-run-plan.tip.3': '距離の単位がマイルの場合、ペースもマイルあたりになります。',
  'help.guide.tour-run-ways.tip.1': 'ここでの操作で、ランニングのルートや時間が変わることはありません。',
  'help.ctx.trip-tour-walk.bullet.5':
    '「この旅行のツアー」の「ツアーを追加」で、Google Mapsで共有された徒歩ルートをインポートできます。「予定」タブでその日から街歩きを開くと、その日の立ち寄り先をチェックできます。',
  'help.guide.tour-walk-plan.step.6':
    '右の「ツアーの概要」に「推定時間」「滞在先」と、その合計の「予定」が表示されます。左の列の下部の「保存」をクリックして、街歩きを保存します。',
  'help.guide.tour-walk-sights.step.2':
    'テーマを選ぶと「探すもの」が設定されます。開いて種類ごとにオン・オフを切り替え、「ルートからこの距離以内」で探す範囲を選びます。',
  'help.guide.tour-walk-day-times.title': 'その日の到着時刻と営業時間を確認する',
  'help.guide.tour-walk-day-times.tip.3':
    '営業時間はOpenStreetMapか、立ち寄り先に紐づく旅行の場所から取得し、どちらから取得したかが横のピルに表示されます。出かける前に確認してください。',
  'help.guide.tour-walk-google-import.step.4':
    '「街歩きとして読み込む」をクリックします。立ち寄り先の間の徒歩ルートはTREKが計画します。「保存」をクリックして街歩きを保存します。',
  'help.guide.tour-walk-check-off.step.2':
    '「立ち寄り先」までスクロールします。各立ち寄り先に滞在時間と、街歩きに開始時刻があれば到着時刻が表示されます。',
  'help.ctx.trip-tour-bike.summary':
    '「ツアー」タブのエディターで開いたサイクリングです。ルート計算に使うプロフィール、走行時間、ルートの路面、マウンテンバイクのツアーならトレイルの難度グレードがわかります。',
  'help.guide.tour-bike-profile.step.2': '「ツアーの種類」欄を開き、「サイクリング」を選びます。',
  'help.guide.tour-bike-profile.tip.3':
    '地点の近くに自転車で通れる道がない場合は、レールに「地点Nまで自転車で通れる道がありません」と表示されます。地点を動かすか、1つ前の地点の「その他の操作」を開いて「次の区間を手で描く」を選びます。',
  'help.guide.tour-bike-surfaces.step.4':
    '「道の種類」で「農道・林道」や「交通のある道路」などの行をクリックすると、ルートのどこがその道かがわかります。',
  'help.guide.tour-bike-mtb-grades.step.1':
    'エディターでサイクリングを開き、「プロフィール」がMTBになっていることを確認します。トレイルのグレードは、MTBのプロフィールでだけ読み込まれます。',
  'help.ctx.trip-tour-ski.title': 'スキーと冬のツアー',
  'help.guide.tour-ski-plan.goal':
    'ゲレンデでの1日、クロスカントリーの周回、スキーツアー、スノーシューの散策を、地図にあるコース、リフト、トレイルに沿って計画します。',
  'help.guide.tour-ski-plan.tip.2':
    '「種目」の横の情報の点で、TREKがスキーツアーで何をするかを確認できます。そこにもほかのどこにも、雪や雪崩の情報、コース、リフト、トレイルが営業中かどうかの情報はありません。',
  'help.guide.tour-ski-options.step.3':
    '「優先」で「最速」「たくさん滑る」「最も易しい」から選びます。「ペース」で「ゆったり」「標準」「スポーティ」から選ぶと、ルーターが各コースに見込む時間が変わります。',
  'help.guide.tour-ski-fix-leg.goal': '赤い区間を1クリックで計画するか、直線で描きます。',
  'help.guide.tour-ski-fix-leg.result': '赤い区間がなくなり、各区間がゲレンデに沿うか、地点の間を直線で結びます。',
  'help.guide.tour-ski-summary.tip.3':
    '保存したツアーは、保存したときの状態で開きます。地点を動かすかオプションを変えると、最新のゲレンデデータで計画し直されます。',
  'help.guide.tour-ski-pistes-layer.tip.1':
    'スイッチがグレーのまま「ゲレンデを表示するには拡大してください」と表示される場合は、スキー場に拡大してください。',
  'help.guide.tour-ski-import.step.3':
    '「種目」を選び、「クロスカントリー」なら「走法」も選びます。選ぶまでは、ダイアログに「スキーとしてインポートするには種目を選んでください」と表示されます。',
  'help.ctx.trip-tour-paddle.title': 'パドルツアー',
  'help.guide.tour-paddle-setup.title': 'パドルツアーを計画する',
  'help.guide.tour-paddle-setup.step.7':
    '「地点を追加」がオンになっていることを確認し、地図をクリックします。最初に出艇地点、次に途中の地点、最後に上陸地点の順です。',
  'help.guide.tour-paddle-water-route.step.1':
    '手で描いた区間には、地点の下に「手描き、ルート計算なし」と長さが表示されます。線は描いたとおりに保持されます。',
  'help.guide.tour-paddle-water-route.tip.4':
    '計画されていない区間があると保存できません。先に水上で計画するか、手で描いてください。',
  'help.guide.tour-paddle-portage.step.5':
    '「上陸と再出艇」に、上陸して荷物を降ろし、再び出艇するまでにかかる分数を入力します。空欄の場合は10分で計算されます。',
  'help.guide.tour-paddle-lock.step.2':
    '「この地点に閘門を追加」を選びます。地点の下に「時間未入力」と表示された「閘門」カードが表示されます。',
  'help.guide.tour-paddle-time.goal': '水上、運搬、閘門、休憩の時間がどう合計されるかを確認し、自分の値を設定します。',
  'help.guide.tour-paddle-time.tip.3':
    '休憩と自分で決めた予定の合計時間は「詳細」で設定します。予定の合計時間を設定すると、カードの見積もりの横に「自分の予定合計時間」が表示されます。',
  'help.guide.tour-paddle-wind.tip.1':
    '予報があるのは今後16日分だけです。それより先の日は、いつから予報が見られるかが表示されます。過ぎた日は、その日が過ぎていることが表示されます。',
  'help.guide.tour-paddle-checklist.step.2':
    'その下に、データの新しさが表示されます。OpenStreetMapのデータの日付が「OSM データの日付」、TREKが読み込んだ日時が「取得日時」、ルート全体をカバーしていない場合は「障害物データ」に表示されます。',
  'help.guide.tour-paddle-checklist.tip.5':
    'チェックリストは、安全上・法律上の許可ではありません。決定をしても、OpenStreetMapに記録された通行禁止や私有地が解除されるわけではありません。',
  'help.guide.tour-paddle-track-marks.step.5':
    '「陸上運搬」をクリックし、線上で上陸した地点と再出艇した地点をクリックします。',
  'help.ctx.trip-tour-horse.summary':
    '乗馬はルート計算されません。OpenStreetMapにある標識付き乗馬ルートの区間を、手で描いた区間でつないで組み立てるか、記録したままの状態で保持します。',
  'help.guide.tour-horse-plan.step.1':
    '乗りたいエリアを地図に表示してから、左の列の上部にある「新しいツアーを計画」をクリックします。',
  'help.guide.tour-horse-plan.tip.1':
    '乗馬ルートだからといって、そこを乗馬で通ってよいとは限りません。「乗馬でのアクセス」はOpenStreetMapのタグを表示しているだけです。現地では必ず標識に従ってください。',
  'help.guide.tour-horse-gap.step.2': '「手動の区間でつなぐ」をオンにします。空白は直線で描かれ、確認はされません。',
  'help.guide.tour-horse-recorded.goal':
    'GPS端末やアプリで記録した乗馬をインポートし、実際に走ったとおりに保持します。',
  'help.guide.tour-horse-recorded.tip.3':
    'ファイルを「ツアー」タブのどこかにドロップしても、同じプレビューが開きます。',
  'help.guide.create-trip.tip.3':
    '「同行者」では、このTREKにすでにアカウントがある人を追加できます。追加した人は、旅行の作成と同時にメンバーになります。',
  'help.guide.trip-reminder.step.1':
    '旅行カードの鉛筆アイコンをクリックします。新しい旅行の場合は、「新しい旅行」フォームに同じ欄があります。',
  'help.guide.company-holidays.tip.2':
    '終日の会社休日にすると、その日にすでに記録された休暇は取り消され、誰の付与日数も消費されません。',
  'help.guide.half-company-holiday.tip.2':
    '同じ設定のままその日をもう一度クリックすると解除されます。「半休」をオフにしてクリックすると、終日の会社休日になります。',
  'help.guide.edit-holiday-calendar.step.1': '「設定」を開き、「祝日」か「学校の休暇」でカレンダーを見つけます。',
  'help.guide.person-color.goal': '自分や一緒に計画している人に、見分けやすい色を設定します。',
  'help.guide.answer-fusion-request.tip.2': 'あとでどちらからでも統合を解除できます。エントリーは残ります。',
  'help.guide.log-for-partner.tip.2': '相手にもすぐに変更が表示され、「付与日数」の行もすぐに更新されます。',
  'help.guide.country-places.title': '国内のすべての場所を見る',
  'help.guide.tour-activity-stats.step.1':
    '地図下部のパネルで、「統計」と「行きたいリスト」の横にある「ツアー」タブを開きます。',
  'help.guide.tour-activity-stats.tip.2':
    'ツアーの詳細で「実際のトラックを追加」から実際に通ったトラックをリンクすると、ここでは計画の値の代わりに記録の値が使われます。複数の日に計画したツアーも1回だけ数えられます。',
  'help.ctx.collections.bullet.7':
    '保存したツアー：旅行から保存したツアーはリストの最初の行に並び、グレード、タイプ、元の旅行、数値が表示されます。「旅に追加」でそのツアーから新しいツアーを作り、ゴミ箱アイコンでリストから削除します。',
  'help.guide.move-to-list.title': '場所を別のリストに移動・複製する',
  'help.guide.copy-to-trip.tip.2': '旅行にすでにある場所はスキップされ、スキップした数が表示されます。',
  'help.guide.accept-list-invite.tip.2':
    'リスト上部の「共有」をクリックするとメンバーが表示されます。そこにある「リストから退出」で、リストから抜けられます。',
  'help.guide.tour-collection-add-to-trip.goal':
    'リストに保存したツアーから、ウェイポイントあり・なしを選んで、自分の旅行に新しいツアーを作ります。',
  'help.guide.tour-collection-add-to-trip.result':
    'ツアーがその旅行に追加されたことがダイアログで表示されます。「旅を開く」でその旅行に移動し、「閉じる」でコレクションに留まります。',
  'help.guide.tour-collection-manage.tip.3':
    '保存したツアーはそのリストにだけ表示され、「すべての保存済み」には表示されません。',
  'help.guide.search-journey.step.3':
    '日をクリックするとそこまでスクロールします。矢印をクリックすると、その日のエントリーが一覧され、選べます。',
  'help.guide.journey-map-layers.goal': '計画と実際の違いを確認し、レイヤーのオン・オフを切り替えます。',
  'help.guide.journey-keep-route.goal': 'Dawarichからその日の実際のルートを日記の地図に追加し、保存します。',
  'help.guide.journey-day-stays.goal': 'Dawarichが記録した滞在を、1つずつエントリーにします。',
  'help.guide.journey-take-over-day.goal': '1日の滞在を、1回の操作で下書きのエントリーか、1つの1日のレポートにします。',
  'help.guide.journey-auto-prepare.title': '記録した日をTREKに準備させる',
  'help.guide.photo-location.title': '写真の撮影地にエントリーを配置する',
  'help.ctx.settings-about.summary':
    'TREKの概要、このサーバーで動いているバージョン、プロジェクトの情報です。ドキュメント、不具合の報告先、プロジェクトの支援方法があります。',
  'help.guide.startup.tip.2': 'オフにしたアドオンのタブを起動時のタブにしている場合は、代わりに計画画面が開きます。',
  'help.guide.web-push-device.title': 'この端末でプッシュ通知を受け取る',
  'help.guide.connect-airtrail.tip.1': 'このカードは、管理者がAirTrailアドオンをオンにしている場合だけ表示されます。',
  'help.guide.connect-dawarich.tip.1':
    'TREKはエントリー、場所、国を提案するだけです。確認するまで何も追加されず、Dawarichに書き戻されることもありません。',
  'help.guide.tour-connect-wanderer.tip.1':
    'このカードは、管理者が「ツアー」でwandererを許可している場合だけ表示されます。',
  'help.guide.tour-wanderer-watch.tip.1':
    'お知らせでツアーが変わることはありません。実際に何が変わったかは、ツアーのソースの確認でわかります。',
  'help.guide.api-keys.tip.3':
    'キーは、Authorization: BearerかX-API-Keyとして/api/v1に送ります。1つのアカウントで作成できるキーは10個までです。',
  'help.guide.plugin-settings.step.2':
    '「プラグインのアクティビティ」には、プラグインがあなたに代わって行った操作が新しい順にすべて表示されます。「更新」で最新の状態を読み込みます。',
  'help.ctx.admin-github.bullet.3':
    '「情報」：Ko-fi、Buy Me a Coffee、Discord、「不具合報告」「機能リクエスト」、Wikiがあります。',
  'help.guide.default-user-settings.goal':
    '誰も「設定」を開かなくても、すべてのアカウントで適切な単位、カラーモード、通貨が使われるようにします。',
  'help.guide.default-map.step.3':
    '各欄は入力欄から離れると保存されます。欄の名前の横にあるリセットのリンクで、TREKの既定値に戻せます。',
  'help.guide.own-routing-engine.tip.2':
    '自前のルーティングサーバーだけを設定した場合は、公開のValhallaも使われません。欄の横のリセットのリンクで、また空欄に戻せます。',
  'help.guide.admin-passkeys.step.1':
    '「設定」タブの「パスキーログイン」で「パスキーログインを有効化」をオンにします。',
  'help.guide.storage-backends.step.4':
    '上部の「健康」に、ミラー先への書き込みの失敗が一覧されます。「レプリカの失敗は記録されていません。」と表示されていれば、問題ありません。',
  'help.guide.channels-instance.tip.3':
    '「Webプッシュ」にはHTTPSが必要です。iPhoneとiPadでは、ユーザーが先にTREKをホーム画面に追加する必要があります。',
  'help.guide.notification-defaults.step.1':
    '「通知」タブで、下部の「ユーザーの既定値」までスクロールします。行がイベント、列がチャンネルです。',
  'help.ctx.notifications.bullet.1':
    '右上のベルに未読の通知の数が表示されます。クリックすると最新の10件が表示され、下部の「すべて表示」でこのページが開きます。',
  'help.guide.read-notifications.step.2':
    'パネルに最新の10件が表示されます。それぞれ誰がどこで何をしたかがわかり、未読の通知は背景に色が付いています。',
  'help.guide.filter-notifications.step.2': 'パネルの下部で「すべて表示」をクリックします。',
  'help.guide.mark-notifications-read.tip.1': '通知のボタンから開いた場合も、その通知は既読になります。',
  'help.guide.delete-notifications.tip.2':
    '削除した通知は元に戻せません。通知を残したまま見えなくするには、既読にして「未読」で絞り込みます。',
  'help.guide.notification-settings.tip.2': '旅行ごとの設定はありません。1つのスイッチがすべての旅行に適用されます。',
  'help.guide.link-journal.title': '旅行に日記をリンクする',
  'help.guide.link-journal.tip.2': '以降は、アクセスを許可した人の日記一覧にもその日記が表示されます。',
  'help.ctx.trip-places.bullet.8':
    'Dawarichを連携していると、一覧の上の「Dawarich から」に、旅行中にDawarichが記録した滞在が表示されます。「場所として追加」で滞在を場所にし、「訪れていない場所」で一覧から外します。',
  'help.guide.dawarich-stays.step.4':
    '実際には訪れていない滞在は、横の×「訪れていない場所」をクリックして一覧から外します。一覧の下部の「処理済みの…件を表示」で、追加・除外した滞在が表示されます。「戻す」で除外した滞在を一覧に戻せます。',
  'help.guide.leave-stop-off-route.tip.1':
    'この項目は座標のある立ち寄り先にだけあり、設定はその日だけに適用されます。ほかの日の同じ場所は、引き続きルートに含まれます。',
  'help.guide.move-booking-day.title': '予約を別の日に移す',
  'help.guide.place-image-from-file.step.4':
    '写真が場所の画像になります。角の小さな赤い×をクリックすると、また外せます。',
  'help.guide.place-own-hours.step.2': '「ウェブサイト」の下で、わかっていれば「電話」と「メール」を入力します。',
  'help.guide.add-accommodation.tip.4':
    'もっと早い方法もあります。日のヘッダーの＋（ツールチップ「この日に追加」）にある「宿泊先を追加」を使うと、このフォームを開いた状態で日が開きます。',
  'help.guide.confirm-stay-booking.goal': '宿泊のホテルの予約を、日の画面から直接確定にします。',
  'help.guide.map-whole-trip.tip.4':
    '旅行全体を表示するかどうかは、アカウントに旅行ごとに保存されるので、別のブラウザーでも同じ状態で旅行が開きます。',
  'help.guide.tour-map-lines.step.3':
    '日の列でツアーが入っている日を開くと、ツアーがその日のルートの一部になります。ルートはツアーの出発地点まで進み、ツアーの終点から続きます。',
  'help.guide.car-stops.goal': 'レンタカーや自分の車に、受取、返却、その間の立ち寄り先を設定します。',
  'help.guide.car-stops.tip.1': 'レンタカー専用のタイプはありません。レンタカーも自分の車も「レンタカー」です。',
  'help.guide.transport-details.result':
    '移動の日の「予定」が開き、地図に線が表示され、その行のルートアイコンがオンになります。',
  'help.guide.export-transports-csv.step.2':
    '「表示オプション」の後ろにある表計算アイコン（ツールチップ「表計算ファイルとして書き出し (CSV)」）をクリックします。',
  'help.guide.group-sort-bookings.title': '予約をグループ化して並べ替える',
  'help.guide.group-sort-bookings.tip.2':
    '「タイムライン」では、同じボタンに「種類ごとに1レーン」と「もう一方のタブも表示」があります。',
  'help.guide.booking-on-map.result': '詳細が閉じて、「予定」タブで予約の日が開き、その場所が地図上で選択されます。',
  'help.guide.export-bookings-csv.step.1':
    'タブの一部だけをエクスポートするには、先に「検索」か「フィルター」で絞り込みます。ファイルには、タブに表示されている内容がそのまま入ります。',
  'help.guide.import-booking-file.tip.4':
    '確認書の読み取りには接続が必要です。オフラインのときは「インポート」にその旨が表示されるので、TREKがオンラインに戻ってからもう一度試してください。',
  'help.guide.arrange-packing-list.step.1':
    'リストのヘッダーの左端、色の点の前にあるハンドルをドラッグし、リストを別のカードの上にドロップします。移動先のカードにアクセントカラーの枠が付き、リストがそのカードの位置に移ります。並び順は旅行のメンバー全員に反映されます。',
  'help.guide.count-packed-pieces.title': '同じものを複数持っていく',
  'help.guide.count-packed-pieces.tip.2':
    '「バッグ管理」がオンの場合、「バッグ」カードの「梱包済み」には、カウント済みの個数だけが数えられます。',
  'help.guide.packing-bags.tip.4':
    '複数の人が持つバッグの重さは、「1人あたり」で均等に分けられます。この重さには点線の下線が付き、カーソルを合わせるとその説明が表示されます。',
  'help.guide.expense-receipts.step.1':
    '支出の行の横にある鉛筆アイコンをクリックします。エディターが開き、下部の近くに「レシート・請求書」があります。',
  'help.guide.expense-receipts.tip.3':
    'レシートは旅行のファイルとして保存されるため、添付には接続とファイルをアップロードする権限が必要です。',
  'help.guide.files-sync-settings.title': 'ドキュメントの同期の方向を選ぶ',
  'help.guide.files-sync-settings.tip.1':
    'どちらかのレーンは常にオンになります。オンのレーンが1つだけのときにそれをクリックしても、何も起きません。',
  'help.guide.manage-notes.title': 'ノートを読む、固定する、編集する',
  'help.guide.manage-notes.tip.1':
    '「展開」がメニューに表示されるのは、ノートにテキストがある場合だけです。「コラボ」の編集権限がないメンバーには「展開」だけが表示されます。',
  'help.guide.note-categories.step.5':
    '「保存」をクリックします。名前や色を変えたカテゴリのノートはすべて、全メンバーの画面ですぐに変わります。「キャンセル」で変更を破棄します。',
  'help.guide.trip-chat.tip.5':
    'チャットには最新のメッセージが表示されます。上部の「以前のメッセージを読み込む」で、それより前のメッセージを読み込めます。',
  'help.guide.roadtrip-reorder.result':
    '立ち寄り先が設定した順番に並び、変更したすべての日の距離、運転時間、到着時刻が計算し直されます。',
  'help.guide.roadtrip-overnight.goal': '旅の途中で泊まる場所を見つけ、その宿泊を予約としてドライブに追加します。',
  'help.guide.roadtrip-overnight.tip.2':
    '予約した宿泊をカードの「編集」から「休憩」に戻すと、先に「宿泊を取り消しますか？」と確認されます。「休憩にする」では、宿泊とその予約、紐づく支出が削除され、立ち寄り先はドライブに残ります。',
  'help.guide.roadtrip-stop-fill.tip.2':
    '立ち寄り先にすでに設定されている値を選ぶと、その立ち寄り先は自分の既定値に戻ります。',
  'help.guide.roadtrip-bookings.tip.1':
    'チェックインの時間を見込んで、ターミナルに着く時刻は時刻表より早めに設定されます。飛行機とクルーズは1時間、フェリーは30分、電車とバスは10分です。',
  'help.guide.roadtrip-google-import.step.2':
    'Googleマップで共有したルートのリンクを貼り付け、「プレビュー」をクリックします。',
  'help.guide.roadtrip-hazards.goal': 'ドライブの周辺の気象警報や災害情報を地図で確認します。',
  'help.ctx.trip-tours.title': '計画画面のツアー',
  'help.guide.tour-show-list.title': '旅行のツアーを計画画面に表示する',
  'help.guide.tour-show-list.tip.2':
    'ツアーがまだない場合は、一覧上部の「GPXまたはKMLをインポート」でファイルを取り込むか、「ツアー」タブの「新しいツアーを計画」で新しく作成します。',
  'help.guide.tour-add-to-day.step.4':
    'または、行を一覧からドラッグして、左の列の日にドロップします。2つの立ち寄り先の間にドロップすると、その位置に入ります。',
  'help.guide.tour-day-times.goal': 'ツアーがいつ終わるか、その日の次の予定と重ならないかを確認します。',
  'help.guide.tour-day-times.tip.4':
    '同じメニューの「コレクションに保存」では、カードの「コレクション」ボタンと同じように、ツアーをルートごとコレクションに保存します。',
  'help.guide.tour-remove-from-day.tip.2':
    'これらのメニューやカードに「削除」はありません。ツアーの削除は、「ツアー」タブの「この旅行のツアー」で、行のゴミ箱アイコンから行います。',
  'help.guide.tour-filter-list.tip.1':
    '「ルートの上限」は、ルートの計画で許容した最高の難易度で、トレイルで実際に測った難易度ではありません。',
  'help.guide.tour-hide-on-map.step.3':
    '非表示のツアーがある間は、一覧の上に「地図で非表示」とその数が表示されます。「すべて表示」で、すべてのツアーがまとめて表示されます。',
  'help.guide.tour-import-plan-tab.step.3':
    '「インポートのプレビュー」で、保存する前に各トラックを確認できます。「取り込む種類」でタイプ（「ハイキング」「サイクリング」など）を選び、「1件のツアーをインポート」をクリックします。',
  'help.ctx.trip-tour-detail.bullet.3':
    'その下に、ツアーが入っている日ごとのタイルを並べた「旅行の日程」、数値と標高グラフ、さらに該当するものとして、街歩きの立ち寄り先、パドルツアーのチェックと風、「実際のトラック」「持ち物リスト」「説明」「ノート」「出どころ」「ファイル」が続きます。',
  'help.guide.tour-detail-read.step.4':
    '「旅行の日程」には、ツアーが入っている日ごとのタイルが日付付きで表示されます。「まだ旅行のどの日にも入っていません」と表示されていれば、まだ予定に入れていません。',
  'help.guide.tour-detail-read.tip.5':
    'スマートフォンでは、カードが下からシートとして開き、内容を読んだり、ツアーを持ち出したりできます。',
  'help.guide.tour-rename-colour.tip.1':
    '名前と色は旅行の設定なので、旅行のメンバー全員に表示されます。ほかの人には影響させずに自分の地図だけでツアーを非表示にするには、「ツアー」一覧の目のアイコンを使います。',
  'help.guide.tour-take-along.tip.1':
    'ファイルを共有できる端末では、GPXの横に「共有」が表示され、同じファイルを直接ほかのアプリに送れます。',
  'help.guide.tour-copy-keep.step.2':
    'コピーがすぐに開きます。名前は元の名前の後ろに（コピー）が付いたものです。鉛筆アイコンをクリックして、別の名前を付けます。',
  'help.guide.tour-packing-link.title': 'ツアーを持ち物リストにリンクする',
  'help.guide.tour-packing-link.tip.2':
    'セクションの見出しの「変更」で、ツアーを別のリストにリンクできます。そのダイアログの「リンクを解除」でリンクが外れ、リストはそのまま残ります。',
  'help.guide.tour-files.tip.1': 'これらのファイルは旅行のファイルでもあるので、「ファイル」タブにも表示されます。',
  'help.guide.tour-activity-link.step.4': '「実績」で計測された内容を確認し、「リンク」をクリックします。',
  'help.guide.tour-activity-compare.step.1':
    'ツアーのカードを開きます。「予定と実績」に、計画の「距離」「累積上昇量」「累積下降量」「休憩込みの時間」がトラックの値と並んで、「差」と一緒に表示されます。',
  'help.guide.tour-origin-check.goal':
    'ツアーがTREKで描かれたのかインポートされたのか、どのファイルからか、その後変更されたかを確認します。',
  'help.ctx.trip-tour-planner.title': 'ツアー',
  'help.guide.tour-open-workspace.title': '「ツアー」タブの画面構成',
  'help.guide.tour-open-workspace.step.7':
    '右のレールでツアーをクリックします。TREKで計画したツアーはエディターで開きます。インポートしたトラックは、閲覧用の「GPXツアー」としてそのままの状態で開きます。',
  'help.guide.tour-draw-route.step.2':
    'ツアーの出発地を「場所や住所を検索」に入力し、結果を選びます。地図がその場所に移動します。',
  'help.guide.tour-draw-route.tip.4':
    '未保存の下書きは保持されます。旅行の「ツアー」タブをもう一度開くと、「未保存の下書きを復元しました」と表示されて元に戻ります。',
  'help.guide.tour-type-profile.tip.1':
    'タイプの変更は履歴の1ステップとして扱われます。レール上部の「地点の編集を元に戻す」で、元のタイプとルートに戻ります。',
  'help.guide.tour-edit-points.step.4':
    'または、行の「その他の操作」（三点アイコン）を開き、「地点を上へ移動」か「地点を下へ移動」を選びます。',
  'help.guide.tour-shaping-points.step.1':
    '地図上で、ルートを別の道に通したい位置をクリックします。そこに小さな点が表示されます。これが形状ポイントです。',
  'help.guide.tour-loop-reverse.title': '周回ルートにする、ツアーを逆向きにする',
  'help.guide.tour-loop-reverse.result': '出発地に戻る周回ルート、または同じツアーを逆向きに進むルートになります。',
  'help.guide.tour-leg-by-hand.tip.2':
    'どの道からも届かない地点には、「地点を表示」と地点の番号付きの通知が表示されます。地点を道の上に動かすか、その地点までの区間を手で描きます。',
  'help.guide.tour-trip-places.tip.1':
    'すでにツアーにある場所には「ツアー内」と表示され、同じ場所を二度選ぶことはできません。',
  'help.guide.tour-details-times.step.3': '「休憩」を0:45のように入力します。推定時間に加算されます。',
  'help.guide.tour-save.step.1': '「ツアー名」に名前を入力します。名前がないと「保存」はグレー表示のままです。',
  'help.guide.tour-edit-saved.title': '保存したツアーを変更する',
  'help.guide.tour-edit-saved.tip.3':
    'レール上部の「GPXをダウンロード」と「コレクションに保存」は、変更を保存すると使えるようになります。',
  'help.guide.tour-summary-profile.tip.1': 'カードのタイトルをクリックすると、概要全体を折りたためます。',
  'help.guide.tour-list-manage.step.3': '日を選びます。ツアーがその日に追加され、行にその日が表示されます。',
  'help.guide.tour-delete.goal': 'ツアーを旅行から完全に削除します。',
  'help.guide.tour-saved-elsewhere.goal':
    'ツアーを変更している間にほかの人がツアーを保存した場合に、どうするかを決めます。',
  'help.ctx.trip-tour-import.title': 'ツアーのインポート',
  'help.guide.tour-import-gpx.goal':
    'GPSウォッチ、アプリ、Google Earthのトラックを、保存前に確認したうえで旅行のツアーにします。',
  'help.guide.tour-import-gpx.tip.3':
    '旅行にすでにあるトラックは「すでに旅行にあります」とグレー表示され、スキップされます。',
  'help.guide.tour-view-import.step.3': '左上の矢印「ツアー一覧に戻る」で閉じます。',
  'help.guide.tour-plan-from-import.step.2':
    'TREKがトラックから制御点を取り出し、ルートを計算し直します。地図にはインポートしたトラックが点線、提案が実線で表示され、カードで両方の長さ、「トラックから50 m以内」の割合、「最大のずれ」を比べられます。',
  'help.guide.tour-restore-recorded.title': '記録されたトラックに戻す',
  'help.guide.tour-take-over.title': '別の旅行からツアーを取り込む',
  'help.guide.tour-take-over.tip.1':
    'コピーは別のツアーになります。まだどの日にも入っておらず、あとで元のツアーを変えてもコピーには影響せず、その逆も同じです。「出どころ」に取り込み元の旅行が表示されます。',
  'help.guide.tour-import-wanderer.step.3':
    'トレイルをクリックします。地図に表示され、列にはGPXファイルの計測値、説明、wandererでの公開・非公開が表示されます。',
  'help.ctx.trip-tour-map.summary':
    '「ツアー」タブの中央にある、開いているツアー用の地図です。そのタイプに合った地図、重ねて表示するゲレンデや航路標識、ルート沿いの場所、実際の地形の上に3Dで表示したツアーを確認できます。',
  'help.guide.tour-map-layers.step.1':
    '「ツアー」タブを開き、右の「この旅行のツアー」でツアーをクリックします。プランナーでツアーが開き、地図左下のピルに、その種類のツアーで使える地図が一覧されます。',
  'help.guide.tour-along-search.goal':
    '計画中のツアーのルート近くにある、展望台、水場、山小屋、食事のできる場所を探します。',
  'help.guide.tour-along-search.tip.2': '街歩きでは、一覧の上にある4つのテーマで、適した種類が自動で選ばれます。',
  'help.guide.tour-along-add-stop.result':
    'ツアーがその場所を通るようになり、「ツアーの概要」に新しい距離と時間が表示されます。変更を残すには、ツアーを保存してください。',
  'help.guide.tour-3d-terrain.step.3':
    '右の「勾配の内訳」ピルをクリックします。ツアーのうち「5 % 未満」「5〜10 %」「10〜18 %」「18〜27 %」「27 % 以上」の区間がそれぞれどれくらいかが表示されます。折りたたんだ状態では、最高地点と最も急な区間が表示されます。',
  'help.guide.tour-3d-flyover.goal': '歩く、走る、滑る前に、ツアー全体を出発地から終点まで上空から見ます。',
  'help.guide.tour-3d-flyover.tip.3':
    '一時停止中に標高グラフの上でカーソルを動かすと、点がその地点に移動します。「フライオーバーを再生」で、そこから再開します。',
  'help.guide.tour-map-overlays.tip.1':
    'ゲレンデは地図データで、リアルタイムの情報ではありません。営業中か、圧雪されているか、雪の状態、雪崩についてはわかりません。スキー場の範囲を超えて縮小すると、スイッチに「ゲレンデを表示するには拡大してください」と表示されます。',
  'help.ctx.trip-tour-stages.bullet.4':
    '「この旅行のツアー」では、複数日ツアーにステージ数付きの月のアイコンが表示されます。このボタン「ステージを表示」で、ステージの一覧が、各ステージが入っている日と「ツアー全体」の合計付きで展開されます。',
  'help.guide.tour-multi-day.step.5':
    '「ツアーの概要」の「ステージ」に、すべてのステージが一覧されます。ステージをクリックすると、最後の立ち寄り先が選択され、標高グラフにその地点が示されるので、終点がわかります。',
  'help.guide.tour-stages-on-days.goal': 'ステージをそれぞれ別の日に入れる、またはツアー全体を1日に入れます。',
  'help.guide.tour-stages-on-days.tip.2':
    'すでにそのツアーが入っている日では、「この日にツアー全体」はグレー表示になります。「この日からステージごとに」は使え、その日のツアー全体を置き換えます。',
  'help.ctx.trip-tour-hike.bullet.3':
    '「ウェイポイント」カードの見出しにルート用のツールがあります：「方向を反転」「スタートに戻る」、ハイキングでは「スタートから周回ルート」。立ち寄り先の「その他の操作」には「次の区間の道を比較」があります。',
  'help.guide.tour-hike-plan.step.3': '「ツアー名」に名前を入力します。',
  'help.guide.tour-hike-plan.tip.4':
    '歩行時間はハイキングの道標の基準（DIN 33466）に基づいて計算され、休憩は含まれません。「詳細」の「休憩」に入力すると、予定の合計時間に反映されます。',
  'help.guide.tour-hike-trail-details.result':
    'ハイキングのどの区間がどのグレードで、どんな路面で、地図のどこにあるかがわかります。',
  'help.guide.tour-hike-round.step.3':
    '「周回を探す」をクリックします。周回A、周回Bなどが、それぞれ別の色で一覧と地図に表示されます。',
  'help.guide.tour-hike-compare-ways.goal':
    'ハイキングの2つの立ち寄り先の間でほかに通れる道を確認し、その1つを選びます。',
  'help.guide.tour-hike-compare-ways.tip.3': '「キャンセル」でカードを閉じます。ルートは変わりません。',
  'help.guide.tour-ferrata-add.result':
    'ハイキングが、OpenStreetMapにある専用の線に沿ってヴィア・フェラータを通ります。地図をクリックすると、頂上側から続けられます。ルーターが計画するのは、ヴィア・フェラータまでの道とその先の道だけです。',
  'help.guide.tour-run-plan.step.2':
    '「プロフィール」を選びます。街中、公園、川沿いの主に舗装された道なら「ランニング」、林道や未舗装の道なら「トレイルランニング」です。',
  'help.guide.tour-run-plan.tip.4': '「トレイルランニング」で使うのは山道（T2）までで、それより難しい道は使いません。',
  'help.guide.tour-run-ways.tip.2':
    '未舗装の道を多く通るには「プロフィール」を「トレイルランニング」に、固い路面を走るには「ランニング」に切り替えます。',
  'help.guide.tour-walk-plan.title': '立ち寄り先をつないで街歩きを計画する',
  'help.guide.tour-walk-plan.tip.1':
    '立ち寄り先の番号を囲む輪は重要度を示します。実線は「必見」、破線は「任意」です。小さな盾は「保護」された立ち寄り先を示します。',
  'help.guide.tour-walk-sights.step.3':
    '「ツアー沿いを検索」をクリックします。名前の前の星は「注目スポット」で、その周辺で特に有名な場所です。',
  'help.guide.tour-walk-day-times.goal':
    '街歩きの日に、各立ち寄り先に何時に着くか、その時間に閉まっている場所はどこかを確認します。',
  'help.guide.tour-walk-day-times.tip.4':
    '1日に街歩きが2つある場合：「予定」タブで、その間の区間（「移動手段を変更」）をクリックし、「公共交通機関」を選びます。最初の街歩きが終わる場所と時刻から検索され、乗り継ぎが次の街歩きの開始より遅く着く場合は警告が表示されます。',
  'help.guide.tour-walk-google-import.tip.1':
    '読み込めるのは徒歩で計画したルートだけです。共有する前に、Googleマップを徒歩に切り替えてください。',
  'help.guide.tour-walk-check-off.step.3':
    '見た立ち寄り先では「訪問済みにする」、行かない立ち寄り先では「スキップ」をクリックします。',
  'help.ctx.trip-tour-bike.bullet.1':
    '「ツアーの種類」の下の「プロフィール」で、ルーターがどんな走り方に合わせて計画するかを選びます：「ツーリング」「ロード」「グラベル」、MTB。その下に、ルーターが優先する道の説明が表示され、変えるとルート全体が計画し直されます。',
  'help.guide.tour-bike-profile.step.3':
    '「プロフィール」で「ツーリング」「ロード」「グラベル」、MTBのいずれかを選びます。その下に、そのプロフィールでルーターが優先する道の説明が表示されます。',
  'help.guide.tour-bike-profile.tip.4':
    'ツアーに名前があり、ルートと標高の計算が終わるまで、「保存」はグレー表示のままです。',
  'help.guide.tour-bike-surfaces.result':
    '選んだ行の区間が地図に表示され、ルートの路面がわかります。ツアー自体は変わりません。',
  'help.guide.tour-bike-mtb-grades.step.2':
    '「路面と道」カードで「トレイル難度（mtb:scale）」を確認します。「S0、特に難しさなし」から「S4以上、上級者向け」まで、ルートのうちの割合が表示されます。',
  'help.ctx.trip-tour-ski.summary':
    '「ツアー」タブの「スキーと冬」タイプのツアーです。ゲレンデでの1日、クロスカントリーの周回、スキーツアー、スノーシュー、冬の散策を計画できます。区間はOpenStreetMapにあるコース、リフト、トレイルに沿って、種目と制限に合わせてゲレンデのルーターが計画します。記録したスキーのトラックは、種目を付けてインポートします。',
  'help.guide.tour-ski-plan.step.1': '「ツアー」タブで、左のレール上部の「新しいツアーを計画」をクリックします。',
  'help.guide.tour-ski-plan.tip.3':
    'あとで種目を変えても地点はそのまま残り、その種目で使うオプションで区間が計画し直されます。',
  'help.guide.tour-ski-options.step.4':
    'スイッチを使います：「リフトを使う」「フリーライドルートを許可」「必要ならリフトで下る」「推定の接続を避ける」。「クロスカントリー」では「圧雪済みトレイルのみ」と「ライトアップされたトレイルのみ」、「山スキー」では「コース脇を登る」も表示されます。',
  'help.guide.tour-ski-fix-leg.step.1':
    'ルーターが計画できなかった区間は、地点の下に赤い行で表示され、理由（例：「これらの地点をつなぐのは除外したリフトだけです」）と、該当するコースやリフトが示されます。',
  'help.guide.tour-ski-summary.title': 'スキーツアーのゲレンデルートを確認する',
  'help.guide.tour-ski-summary.tip.4':
    'カードの下部に、スキー場の名前と、ツアーの計画に使った地図データの日付が表示されます。',
  'help.guide.tour-ski-pistes-layer.tip.2':
    'ゲレンデが読み込めなくなると、スイッチに警告マークが表示されます。地図とルートは引き続き使えます。',
  'help.guide.tour-ski-import.step.4': '「1件のツアーをインポート」をクリックします。',
  'help.ctx.trip-tour-paddle.summary':
    '川や湖でのカヤック、カナディアンカヌー、SUPのツアーです。ボートと水域を設定し、TREKにデータがある場所では水域に沿ってルートを計画し、陸上運搬と閘門も所要時間に含めます。漕ぐ日の風と、途中の障害物についてわかっていることも表示します。',
  'help.guide.tour-paddle-setup.goal':
    'カヤック、カナディアンカヌー、SUPのツアーを作成し、ボート、水域、速さを設定します。',
  'help.guide.tour-paddle-setup.tip.1':
    '「ボート」を「その他」にすると、提案される速度はありません。速度を入力しないと、水上の時間は空欄のままです。',
  'help.guide.tour-paddle-water-route.step.2':
    '区間を1つだけ水上で計画するには、その前の立ち寄り先にカーソルを合わせ、三点アイコンの「その他の操作」をクリックします。',
  'help.guide.tour-paddle-water-route.result':
    'すべての区間が水域に沿うか、意図して手で描いたものになり、TREKが計画できなかった区間には理由が表示されます。',
  'help.guide.tour-paddle-portage.tip.1':
    'やはりその区間を漕ぐ場合は、その地点の「その他の操作」をもう一度開き、「この区間を再び漕ぐ」を選びます。手で描いた区間に戻ります。',
  'help.guide.tour-paddle-lock.step.3': '「閘門」カードをクリックして開きます。',
  'help.guide.tour-paddle-time.step.1':
    '「所要時間の見積もり」は、左の列のウェイポイントの下にあります。見出しのバッジが休憩込みの合計時間です。',
  'help.guide.tour-paddle-time.result': '入力した内容が見積もりに反映され、まだ足りない項目も表示されます。',
  'help.guide.tour-paddle-wind.tip.2':
    '複数日のツアーでは、カードの見出しに日ごとのチップが表示されます。クリックすると、その日の風が表示されます。',
  'help.guide.tour-paddle-checklist.step.3':
    '項目はルートの順に並びます。OpenStreetMapの堰、閘門、急流、出艇地点、通行ルールと、自分で追加した陸上運搬と閘門（「自分の計画」と表示）です。',
  'help.guide.tour-paddle-checklist.result':
    'ルート上のすべての項目に対応が決まり、安全に関する注意も確認できています。',
  'help.guide.tour-paddle-track-marks.step.6': '「閘門」をクリックし、線上の閘門の位置をクリックします。',
  'help.ctx.trip-tour-horse.bullet.1':
    'エディターで「ツアーの種類」を「乗馬ツアー」にすると、左の列に「乗馬ルート」カードが表示されます。「地図の表示範囲で探す」で、表示中の地図の範囲にあるルートが一覧されます。',
  'help.guide.tour-horse-plan.step.2':
    '「ツアー名」の下の「ツアーの種類」欄をクリックし、「乗馬ツアー」を選びます。「ウェイポイント」の下に「乗馬ルート」カードが表示されます。',
  'help.guide.tour-horse-plan.tip.2':
    'TREKは乗馬の時間を計算しません。日程に時間を入れたい場合は、「詳細」の「予定」に入力してください。',
  'help.guide.tour-horse-gap.step.3':
    '「区間を取り込む」をクリックします。スイッチがオンになるまで、ボタンはグレー表示のままです。',
  'help.guide.tour-horse-recorded.step.1':
    '「この旅行のツアー」で「ツアーを追加」（＋）をクリックし、「GPXまたはKMLをインポート」を選んで乗馬のファイルを選択します。',
  'help.guide.dateless-trip.title': '日付を決めずに旅行を計画する',
  'help.guide.trip-reminder.step.2':
    '「リマインダー」で1日、3日、9日のいずれかを選びます。ほかの日数にするには、「カスタム」をクリックして1〜30の日数を入力します。',
  'help.guide.upcoming-reservations.title': '次の予約にすぐ移動する',
  'help.guide.half-company-holiday.title': '半日の会社休日を設定する',
  'help.guide.edit-holiday-calendar.step.2':
    '色の四角をクリックして新しい色を選ぶか、新しいラベルを入力してEnterキーを押します。',
  'help.guide.person-color.step.1': '「人数」カードで、名前の前にある色の点をクリックします。',
  'help.guide.answer-fusion-request.title': '統合の招待に返事をする',
  'help.guide.log-for-partner.title': '一緒に計画している人の日を記録する',
  'help.guide.dissolve-fusion.title': '一緒に計画するのをやめる',
  'help.guide.country-places.goal':
    'TREKがその国として数えている場所を一覧し、そこでしたことを確認したり、間違った国に分類された場所を見つけたりします。',
  'help.guide.regions.tip.3':
    '「行きたいリストに追加」は地域にも使えます。地域は、行きたいリストの国と同じ斜線で表示されます。',
  'help.guide.tour-activity-stats.step.2':
    '左の2つのピルで期間とタイプを選びます。「期間」には「全期間」「今年」「過去12か月」と、ツアーのある過去の各年があります。「タイプ」では、数値を1種類のツアーか「すべてのタイプ」に絞り込みます。',
  'help.guide.tour-activity-stats.tip.3':
    '参加者が指定された日は、その人たちだけの実績になります。誰も指定されていない日は、旅行の全員の実績になります。このタブは最新のデータを読み込むので、インターネット接続が必要です。',
  'help.guide.move-to-list.goal': '場所をリスト間で移動したり、別のリストにコピーしたりして、リストを整理します。',
  'help.guide.accept-list-invite.result':
    'リストがレールの「共有」の下に表示され、場所と一緒に開きます。メンバーの変更はリアルタイムで反映されます。',
  'help.guide.tour-collection-add-to-trip.step.1':
    'リストを開きます。保存したツアーは、場所の上の最初の行に並んでいます。ツアーの「旅に追加」か、行自体をクリックします。',
  'help.guide.tour-collection-manage.title': '保存したツアーを探す・削除する',
  'help.guide.tour-collection-manage.result': 'ツアーがリストから削除され、短いメッセージで確認できます。',
  'help.guide.entry-draft.title': 'エントリーを下書きのままにする',
  'help.guide.journey-map-layers.step.1':
    '地図上部のレイヤーバーに、「予定」「記録」「エントリー」「写真」が件数付きで並んでいます。クリックすると表示・非表示が切り替わります。',
  'help.guide.journey-keep-route.step.1': 'その日のヘッダーで、Dawarichのボタン「記録を取り込む」をクリックします。',
  'help.guide.journey-day-stays.step.1':
    '確認が必要な滞在がある日の最後には、「Dawarichから4件の滞在」のような行と時間帯が表示されます。クリックすると滞在が表示されます。',
  'help.guide.journey-take-over-day.step.1':
    'その日の滞在の行の右端にある「1日を取り込む」か、日のヘッダーにあるリストボタン（待機中の滞在の数が表示されています）をクリックします。',
  'help.guide.journey-auto-prepare.goal': '旅行中、その日の滞在を確認できるように自動で準備します。',
  'help.guide.photo-location.goal': 'エントリーごとに場所を検索しなくても、エントリーを地図に表示します。',
  'help.ctx.settings-about.bullet.1': 'このサーバーで動いているバージョンが、タイトルの横に表示されます。',
  'help.guide.readability.tip.3':
    '読みやすさの設定は「実験的」です。表示がおかしい場合は、タブ下部の「既定に戻す」で初期設定に戻せます。',
  'help.guide.web-push-device.goal': 'TREKを閉じていても、スマートフォンやパソコンでTREKの通知を受け取ります。',
  'help.guide.connect-airtrail.tip.2':
    'キーは暗号化して保存され、再び表示されることはありません。欄に点が表示されていれば、キーは保存されています。',
  'help.guide.connect-dawarich.tip.2':
    'ボタンの下に、TREKが最後に確認した日時と、使っているDawarichのバージョンで使えない機能が表示されます。',
  'help.guide.tour-connect-wanderer.tip.2':
    'プライベートアドレスのインスタンスの場合、管理者が内部ネットワークを許可する必要があることがあります。',
  'help.guide.tour-wanderer-watch.tip.2':
    '「…まで一時停止」は、wandererが応答しなかったことを示します。「トークンが拒否されました」は、接続テストを成功させるか、新しいトークンにする必要があることを示します。',
  'help.guide.plugin-settings.result':
    'プラグインが自分の設定で動作し、あなたに代わって行った操作はすべて「プラグインのアクティビティ」に表示されます。',
  'help.ctx.admin-defaults.bullet.3':
    '設定した欄の横のリセットのリンクで、TREKの既定値に戻せます。ユーザーが自分で設定した内容は、常にこれより優先されます。',
  'help.ctx.admin-settings.bullet.5':
    '「危険ゾーン」：「JWTシークレットをローテーション」を使うと、自分を含むすべてのユーザーがサインアウトされます。',
  'help.guide.default-user-settings.step.1':
    '「既定のユーザー設定」で、「カラーモード」（「ライト」「ダーク」「自動」）、「温度単位」「距離単位」「時刻形式」「週の開始」「表示通貨」と、「予約コードをぼかす」のオン・オフを選びます。選択はそれぞれすぐに保存されます。',
  'help.guide.admin-passkeys.step.2':
    '「Relying Party ID（ドメイン）」（例：trek.example.org）と、TREKにアクセスするときの「許可するオリジン」を入力し、「保存」をクリックします。両方を空欄にすると、APP_URLが使われます。',
  'help.guide.rotate-jwt-secret.title': '全員をまとめてサインアウトさせる',
  'help.guide.notification-defaults.step.2':
    'セルをクリックすると、オン、「オフ」「ブロック」の順に切り替わります。ツールチップに次の状態が表示され、クリックするたびにすぐに保存されます。',
  'help.ctx.notifications.bullet.2':
    '上部の「すべて」と「未読」で、すべての通知と未読の通知だけを切り替えます。スクロールすると、続きが読み込まれます。',
  'help.guide.read-notifications.step.3':
    '通知の下のボタン（例：「Vacayを見る」）をクリックすると、通知に関係する画面が開きます。同時に既読になります。',
  'help.guide.filter-notifications.step.3':
    '「未読」をクリックすると、未読の通知だけが表示されます。「すべて」で、すべての通知がまた表示されます。',
  'help.guide.mark-notifications-read.tip.2':
    '既読にしても、変わるのは背景の色と数だけです。通知は削除するまで一覧に残ります。',
  'help.guide.delete-notifications.result': '通知が一覧とベルから削除されます。',
  'help.guide.notification-settings.result':
    '「設定」の「通知」が開き、イベントとチャンネルごとのスイッチが表示されます。',
  'help.guide.link-journal.goal': '自分の日記の1つを、選んだ人に向けて旅行の中に表示します。',
  'help.guide.link-journal.tip.3':
    'あとで「旅行の設定」の「日記」から、「アクセスを編集」「ジャーナルを変更」「解除」ができます。解除するとタブは消えますが、日記自体で追加した人のアクセスは残ります。',
  'help.guide.dawarich-stays.result':
    '滞在が旅行の場所になり、選んだ日か「未計画」に入ります。パネルでは処理済みになります。',
  'help.ctx.trip-days.bullet.7': '旅行中は、計画画面が今日の日を表示した状態で開きます。',
  'help.guide.leave-stop-off-route.tip.2':
    '「この日から削除」では、立ち寄り先がその日から外れます。「ルートから外す」では、計画に残ったままです。',
  'help.guide.move-booking-day.goal': 'フォームを開かずに、計画画面から直接、移動や予約を別の日に移します。',
  'help.guide.place-image-from-file.result': '写真が、カード、場所の列、日、地図で、その場所の画像として表示されます。',
  'help.guide.place-own-hours.step.3':
    'その下の「営業時間」には、1日1行で1週間分が表示されます。TREKが営業時間を見つけている場合は入力済みです。そうでなければ、先に「営業時間を追加」をクリックします。各日の開店時刻と閉店時刻を入力し、定休日には「終了」をクリックします。',
  'help.guide.add-accommodation.tip.5':
    '宿泊先として選べるのは旅行の通常の場所だけで、GPXトラックやツアーの場所は表示されません。',
  'help.guide.confirm-stay-booking.step.1':
    'チェックインする日を開きます。宿泊のカードの「予約」に、その夜のホテルの予約が「保留」か「確定」と一緒に表示されています。そのボックスをクリックします。',
  'help.guide.tour-map-lines.step.4':
    'ツアーを地図から消すには、右の列を「ツアー」に切り替え、ツアーにカーソルを合わせて目のアイコン「地図で非表示にする」をクリックします。線とピンが地図から消え、行は一覧に薄く表示されたまま残ります。斜線の入った目のアイコン「地図に表示」で、また表示できます。',
  'help.guide.car-stops.step.1':
    '車を受け取る日のヘッダーで＋（ツールチップ「この日に追加」）をクリックし、「移動手段を追加」を選びます。',
  'help.guide.car-stops.tip.2': '「上へ移動」と「下へ移動」は、ドライブに立ち寄り先が2つ以上あるときに表示されます。',
  'help.guide.transport-details.title': '移動を開いて詳細を使う',
  'help.guide.transport-details.tip.1': '線が表示されている移動でもう一度「地図上」をクリックすると、線が消えます。',
  'help.guide.export-transports-csv.result':
    '旅行名の付いたファイル（例：autumn-in-japan-transports.csv）がブラウザーで保存されます。移動ごとに1行で、「タイプ」「タイトル」「ステータス」「開始」「終了」「出発地」「到着地」「場所」「確認」「ノート」が入っています。',
  'help.guide.group-sort-bookings.goal': 'カードやリストを、ステータス、日、タイプ別に、好きな順番で並べます。',
  'help.guide.booking-on-map.tip.1':
    '「地図上」は、場所のある予約にだけ表示されます。フォームの「場所 / アクティビティ」で場所を選ぶと、ボタンが表示されます。',
  'help.guide.export-bookings-csv.step.2':
    '表示アイコンの後ろにあるスライダー「表示オプション」を開き、「並べ替え」で順番を選びます。行はその順に、予約ごとに1行で並び、グループ分けはされません。',
  'help.guide.edit-booking.tip.4':
    '何かを変更したあとにフォームの外をクリックするかEscapeキーを押すと、「変更を破棄しますか？」と確認されます。「編集を続ける」でフォームに戻ります。',
  'help.guide.arrange-packing-list.step.2':
    'リストの中では、行の左にあるグリップでアイテムを上下にドラッグします。行の左端に表示されるアクセントカラーの線が、移動先を示します。',
  'help.guide.count-packed-pieces.goal': 'アイテムに数量を設定し、1つずつ準備済みにしていきます。',
  'help.guide.count-packed-pieces.tip.3': '数量が1の場合はカウンターは表示されず、チェックボックスだけです。',
  'help.guide.expense-receipts.step.2':
    '「レシート・請求書」の横の「添付」をクリックし、写真かPDFを選びます。複数をまとめて選ぶこともできます。ファイルは見出しの下に一覧され、ゴミ箱アイコンで外せます。',
  'help.guide.files-sync-settings.goal':
    'ドキュメントを保管先から取り込むだけか、保管先に書き出すだけか、両方かを決め、ドキュメントが削除されたときや両方で変更されたときの扱いも決めます。',
  'help.guide.files-sync-settings.tip.2':
    '「確認する」を選んだ場合、両方で編集されたドキュメントはカードの下の「確認が必要」に表示されます。「解決」をクリックし、「TREK のバージョンを残す」「連携先のバージョンを残す」「両方を残す」から選びます。',
  'help.guide.manage-notes.goal': 'ノートを全文で開き、大切なノートを上に固定し、古くなった内容を修正・削除します。',
  'help.guide.manage-notes.tip.2':
    '編集中に、添付済みのファイルの赤い×をクリックすると、「保存」をクリックする前でもすぐに削除され、ゴミ箱にも移りません。ノートのファイルはすべて、旅行の「ファイル」タブにも表示されます。',
  'help.guide.note-categories.step.6':
    '「ノート」カードに戻ると、ヘッダーの下のピルでカードを絞り込めます。カテゴリをクリックするとそのカテゴリのノートだけが表示され、「すべて」か同じピルをもう一度クリックすると、すべてが表示されます。',
  'help.guide.roadtrip-reorder.tip.1':
    'ここで立ち寄り先を動かすと、日程でも動きます。「日」にも同じ順番で表示されます。',
  'help.guide.roadtrip-overnight.step.1':
    '「ルートの途中」の「探すもの」で「宿泊」（テントサイトなら「キャンプ場」）にチェックを入れ、泊まる日を選んで「検索」をクリックします。',
  'help.guide.roadtrip-overnight.tip.3':
    '「運転の設定」の「ルートの線」で「毎日を宿泊先で始めて宿泊先で終える」をオンにしていると、翌日のドライブは泊まった場所から始まります。',
  'help.guide.roadtrip-stop-fill.title': '立ち寄り先ごとの補給量を設定する',
  'help.guide.roadtrip-bookings.title': '飛行機、電車、フェリーをドライブに組み込む',
  'help.guide.roadtrip-bookings.tip.2':
    '立ち寄り先で予約したテーブルやチケットは、その立ち寄り先にピルで表示されます。どの立ち寄り先にも属さない予約は、「この日のその他の予約」に一覧されます。',
  'help.guide.roadtrip-google-import.step.3':
    '見つかった立ち寄り先を確認します。それぞれの位置が表示され、「位置を特定できません」と表示された立ち寄り先はスキップされます。',
  'help.guide.roadtrip-hazards.step.1': '右の列で「運転の設定」を開きます。',
  'help.ctx.trip-tours.summary':
    '「予定」タブの右の列を「ツアー」に切り替えた画面です。旅行のすべてのツアーが日の横の一覧に並びます。ここでは、ツアーを日に入れる、一覧を絞り込む、地図上の線を非表示にする、GPXやKMLファイルをインポートする、といった操作ができます。ルートの作成と変更は「ツアー」タブで行います。',
  'help.guide.tour-show-list.goal': '場所の列を旅行のツアーに切り替え、日の横でツアーを確認・選択します。',
  'help.guide.tour-show-list.tip.3':
    'ツアーアドオンがオンの場合、トラックは「場所」の一覧には表示されません。インポートしたトラックはすべてツアーになり、ここに表示されます。',
  'help.guide.tour-add-to-day.step.5':
    'ステージのあるツアーでは、同じメニューで続けて確認されます。「この日からステージごとに」ではステージ1がその日に、以降のステージが1日ずつ後の日に入ります。「この日にツアー全体」では、ツアー全体がその1日に入ります。',
  'help.guide.tour-day-times.step.1':
    '日の列でツアーの行にカーソルを合わせ、「その他のオプション」（三点アイコン）をクリックして「編集」を選びます。',
  'help.guide.tour-day-times.result':
    'ツアーが、時刻のあるほかの立ち寄り先と同じように、開始と終了の時刻付きでその日のタイムラインに表示されます。',
  'help.guide.tour-remove-from-day.result': 'その日にツアーが表示されなくなり、一覧の行から「日」バッジが消えます。',
  'help.guide.tour-filter-list.tip.2':
    '絞り込みの項目は、ツアーによって値が異なる場合だけ表示されます。そのため、短い一覧では「ステータス」しかないこともあります。',
  'help.guide.tour-hide-on-map.tip.1':
    '非表示は自分にだけ適用され、この旅行についてこのブラウザーに保存されます。ツアー、その日、色は変わらず、ほかの人の地図にはツアーが表示されたままです。',
  'help.guide.tour-import-plan-tab.tip.1':
    '旅行にすでにあるトラックには「すでに旅行にあります」と表示され、二重にインポートされることはありません。',
  'help.ctx.trip-tour-detail.bullet.4':
    '下部の列：日を開いているときは「日に追加」か「この日から削除」、出発地点への「ナビゲーション」、ツアーのウェブページ、GPX、ファイルを共有できる端末では「共有」、「コレクション」「コピー」があります。',
  'help.guide.tour-detail-read.step.5':
    'その下に数値が続きます。距離、「最低標高」「最高標高」「累積上昇量」「累積下降量」、その下に時間、そしてツアーの線と同じ色の標高グラフです。',
  'help.guide.tour-detail-read.result':
    '計画画面の横にツアーのカードが開き、ツアーが入っている日、長さと勾配、出どころがわかります。',
  'help.guide.tour-rename-colour.tip.2': '鉛筆アイコンと色の点を使えるのは、場所を編集する権限のあるメンバーだけです。',
  'help.guide.tour-take-along.tip.2':
    '「設定」でよく使う地図アプリを選んでおくと、「ナビゲーション」でアプリの一覧が出ずに、そのアプリがすぐに開きます。',
  'help.guide.tour-copy-keep.step.3':
    'ツアーをほかの旅行用に保存するには、ツアーを開いてカード下部の「コレクション」をクリックします。',
  'help.guide.tour-packing-link.goal':
    'ツアーに持っていくものを、旅行の持ち物リスト全体かその中のリストから、ツアーのカードに表示します。',
  'help.guide.tour-packing-link.tip.3':
    'リンクするには場所を編集する権限が必要です。ほかのメンバーにもリンクしたリストは表示されますが、リンクは変更できません。',
  'help.guide.tour-files.tip.2': '「アップロード」は、ツアーを変更してファイルを追加できるメンバーにだけ表示されます。',
  'help.guide.tour-activity-link.step.5':
    'トラックが「実際のトラック」に表示され、計画の横に独自の値とプロフィールが表示されます。',
  'help.guide.tour-activity-compare.step.2':
    '「予定からの最大距離」には、トラックと計画の線がいちばん離れた距離が、「予定外」には、トラックのうち計画の線から外れた割合が表示されます。',
  'help.guide.tour-origin-check.step.1':
    'ツアーのカードを開き、「出どころ」までスクロールします。「出典」に元の情報が表示されます：ファイル名付きの「GPXインポート」、KMLやKMZのインポート、アドレス付きのwanderer。',
  'help.ctx.trip-tour-planner.summary':
    '旅行のツアープランナーです。左にエディター、右に旅行のすべてのツアー、その間に地図があります。ここでは、地点を1つずつ置いてツアーを描き、実際の道や道路に沿ってルートを計算し、詳細を入力して旅行に保存します。',
  'help.guide.tour-open-workspace.goal': 'ツアープランナーを開き、各部分の役割を把握します。',
  'help.guide.tour-open-workspace.tip.1':
    '各レールの内側の端にあるタブの「折りたたむ」でレールを隠すと、地図が広くなります。「予定」と「この旅行のツアー」でレールがまた表示されます。レールの端をドラッグすると、幅を変えられます。',
  'help.guide.tour-draw-route.step.3':
    '「ウェイポイント」の「地点を追加」がオンになっていることを確認し（地図のピルの「ポイントを配置」と同じスイッチです）、ツアーの出発地で地図をクリックします。',
  'help.guide.tour-draw-route.result':
    '地図に番号付きのルートが表示され、「ウェイポイント」に地点が並びます。あとは名前を付けて保存するだけです。',
  'help.guide.tour-type-profile.tip.2':
    'タイプによっては、保存する前に追加の入力が必要です。「ランニング」には「予定ペース」、「パドルツアー」にはボートと水域、「スキーと冬」には種目が必要です。',
  'help.guide.tour-edit-points.step.5': '横のゴミ箱アイコン「地点を削除」で、その地点をツアーから削除します。',
  'help.guide.tour-shaping-points.step.2':
    '点を、ルートに通らせたい道の上までドラッグします。その点を通るようにルートが計画し直されます。',
  'help.guide.tour-loop-reverse.goal': 'ツアーを出発地で終わるようにする、または逆向きにします。',
  'help.guide.tour-leg-by-hand.title': '区間を手で描く、計画し直す',
  'help.guide.tour-leg-by-hand.result':
    '区間が、選んだ場所を通る手描きの直線として示されるか、ルートが計算し直されます。',
  'help.guide.tour-trip-places.tip.2':
    '立ち寄り先を削除したりリンクを解除したりしても、旅行の場所は日の割り当ても含めてそのまま残ります。',
  'help.guide.tour-details-times.step.4':
    '「予定」に合計時間が表示されます。自分で入力すると上書きでき、「手動で上書き」と表示されます。',
  'help.guide.tour-save.step.2':
    '「新しいツアー」の横の点が消えるまで待ちます。保存するには、ルートとすべての標高の計算が終わっている必要があります。',
  'help.guide.tour-edit-saved.goal': '以前に計画したツアーを開いて変更し、もう一度保存します。',
  'help.guide.tour-edit-saved.result': '保存したツアーに変更が反映されます。',
  'help.guide.tour-summary-profile.tip.2':
    'ヴィア・フェラータを通るルートでは、数値の上にグレード付きの警告バッジが表示されます。',
  'help.guide.tour-list-manage.step.4':
    '「旅の合計」の上のボタンがフィルターです。絞り込み中のステータス（最初は「すべて」）とツアーの数が表示されます。',
  'help.guide.tour-delete.step.1':
    '「この旅行のツアー」でツアーにカーソルを合わせ、行の右にあるゴミ箱アイコン（ツアー名付きの「削除」）をクリックします。',
  'help.guide.tour-saved-elsewhere.step.1':
    '編集中に、レールの上部に「このツアーは別の場所で保存されました」と表示されます。どうするか決めるまで、自分の変更は残ります。',
  'help.ctx.trip-tour-import.summary':
    'ほかの場所にあるツアーを旅行に取り込みます。ウォッチやアプリのGPX、KML、KMZファイル、自分のほかの旅行のツアー、自分のwandererのトレイルを取り込めます。インポートしたものは記録したとおりに保持され、そこから編集可能なバージョンを計画できます。',
  'help.guide.tour-import-gpx.step.1':
    '旅行の「ツアー」タブを開きます。右の「この旅行のツアー」の上部で、＋（「ツアーを追加」）をクリックします。',
  'help.guide.tour-import-gpx.tip.4':
    'KMLやKMZファイルでは、線以外に含まれていたもの（ピン、エリアなど）が「インポートされません」に一覧されます。',
  'help.guide.tour-view-import.tip.1':
    'インポートしたものは、地点ごとの編集はできません。上の「編集可能なバージョン」カードの「編集可能なバージョンを計画」で、変更できるツアーを作れます。',
  'help.guide.tour-plan-from-import.step.3':
    '「インポートを置き換え」をクリックすると、このツアーがその場で計画し直されます。日とノートは残り、記録されたトラックも保持されるので、あとで戻せます。「新しいツアーとして計画」では、インポートしたものは変えずに、横に2つ目のツアーを作ります。',
  'help.guide.tour-restore-recorded.goal':
    'インポートしたものの計画し直しを取り消し、あとからでも元のトラックに戻します。',
  'help.guide.tour-take-over.goal': '自分のほかの旅行で計画・インポートしたツアーを、描き直さずに再利用します。',
  'help.guide.tour-take-over.tip.2':
    '表示されるのは自分のほかの旅行だけで、ツアーは最初の100件までです。それ以外は検索かフィルターで探してください。',
  'help.guide.tour-import-wanderer.step.4': '「旅行にインポート」をクリックします。',
  'help.ctx.trip-tour-map.bullet.1':
    '地図左下のピルに、開いているツアーのタイプで使えるベースマップがあります：「マップ」「地形図」、ハイキングでは「ハイキング」、サイクリングでは「自転車」、「衛星写真」。ここでの選択はプランナーだけに適用され、「設定」の地図の設定は変わりません。',
  'help.guide.tour-map-layers.step.2':
    '「地形図」をクリックすると、等高線と陰影起伏が表示され、地形の勾配がわかります。選んだ地図はピルで強調表示されます。',
  'help.guide.tour-along-search.step.1':
    '「ツアー」タブでツアーを開き、左のパネルをツアーの立ち寄り先の下にある「ツアー沿い」までスクロールします。このカードはツアーにルートができると表示されます。',
  'help.guide.tour-along-search.tip.3':
    '結果はOpenStreetMapとTREKの場所インデックスから取得するので、検索には接続が必要です。何も見つからない場合は、「範囲を広げる」で次の距離で検索します。サーバーが混み合っている場合は、「再試行」に再試行できるまでのカウントダウンが表示されます。',
  'help.guide.tour-along-add-stop.tip.1':
    'その場所はツアーの立ち寄り先になり、旅行の場所にはならないので、場所の一覧には表示されません。',
  'help.guide.tour-3d-terrain.step.4':
    '「陰影起伏」のスライダーをドラッグすると、山の高さを最大3倍まで強調でき、なだらかな地形で見やすくなります。',
  'help.guide.tour-3d-flyover.step.1':
    'ツアーを3Dに切り替えます。ルート沿いの地形を読み込んでいる間、再生ボタンが表示される位置で輪が満ちていきます。いっぱいになったら「フライオーバーを再生」をクリックします。カメラがルート上の点を追い、「ツアーの概要」の標高グラフのカーソルも一緒に動きます。',
  'help.guide.tour-map-overlays.title': 'ゲレンデや航路標識を地図に重ねる',
  'help.guide.tour-map-overlays.tip.2':
    'ツアーを開いていないときもゲレンデのスイッチがあるので、計画する前にスキー場を確認できます。ハイキングでは、代わりにピルに「ヴィア・フェラータ」が表示され、表示範囲内のルート数が付きます。',
  'help.ctx.trip-tour-stages.bullet.5':
    'ツアーの行のプラス「この日に追加」で、選んだ日から1日1ステージずつ旅行に入れるか、ツアー全体をその1日に入れます。',
  'help.guide.tour-multi-day.step.6':
    '日帰りツアーに戻すには、「日帰り」をクリックし、「日帰りツアーにしますか？」で「ステージの終点をすべて外す」を選んで確定します。ルートは変わりません。',
  'help.guide.tour-stages-on-days.step.1':
    '「この旅行のツアー」で複数日ツアーにカーソルを合わせ、プラス「この日に追加」をクリックします。',
  'help.guide.tour-stages-on-days.tip.3':
    '「予定」タブで複数日ツアーを日にドラッグしたときも、ツアーのカードの「日に追加」を使ったときも、同じ内容がダイアログで確認されます。',
  'help.ctx.trip-tour-hike.bullet.4':
    'ウェイポイントの下の「道の詳細」には、OpenStreetMapにある区間ごとのSACグレード、路面、道の種類が表示され、それに応じて地図上のルートが色分けされます。ここでの操作でツアーが変わることはありません。',
  'help.guide.tour-hike-plan.step.4':
    '「地点を追加」は最初からオンです。ハイキングの出発地と終点で地図をクリックします。横の「旅の場所」で、旅行の山小屋やホテルを選ぶこともできます。2点目から、TREKが徒歩ルートを計算します。',
  'help.guide.tour-hike-trail-details.title': 'ハイキングのグレード、路面、道の種類を確認する',
  'help.guide.tour-hike-trail-details.tip.1':
    'OpenStreetMapに値がない道は「不明」に一覧されます。「不明」は簡単という意味ではありません。「今回は取得できませんでした」と表示された項目がある場合は、「再試行」をクリックします。',
  'help.guide.tour-hike-round.step.4':
    '周回ルートをクリックして選びます。行に距離、獲得標高、時間と、指定した距離との差が表示されます。',
  'help.guide.tour-hike-compare-ways.step.1':
    '区間の始まりの立ち寄り先にカーソルを合わせ、行の「その他の操作」をクリックして「次の区間の道を比較」を選びます。',
  'help.guide.tour-ferrata-add.title': 'ハイキングにヴィア・フェラータを組み込む',
  'help.guide.tour-ferrata-add.tip.1':
    'ヴィア・フェラータには装備と経験が必要です。バッジのツールチップに、ルートのうちヴィア・フェラータで登る部分の長さが表示されます。',
  'help.guide.tour-run-plan.step.3': '「予定ペース」に、1 kmあたりの分と秒（例：7:30）を入力します。',
  'help.guide.tour-run-ways.title': 'ランニングで通る道を確認する',
  'help.ctx.trip-tour-walk.title': '街歩き',
  'help.guide.tour-walk-plan.goal': '立ち寄り先をつないで観光の街歩きを作り、それぞれの滞在時間と重要度を設定します。',
  'help.guide.tour-walk-plan.tip.2': '街歩きには登山の上限も「休憩」欄もなく、代わりに滞在時間が使われます。',
  'help.guide.tour-walk-sights.step.4':
    '一覧の場所をクリックします。地図の上にカードが開くので、「追加する位置」で、間に入れる2つの立ち寄り先を選びます。',
  'help.guide.tour-walk-day-times.step.1':
    '街歩きを日に入れます。「この旅行のツアー」で、行の丸い＋（「この日に追加」）をクリックして日を選びます。',
  'help.guide.tour-walk-day-times.result':
    '着いたときにすべての場所が開いているように、立ち寄り先の順番や滞在時間を調整できます。',
  'help.guide.tour-walk-google-import.tip.2':
    '「別のリンクを使う」でリンクの入力欄に戻ります。読み込むとプランナーの未保存の変更が置き換えられるので、先にダイアログで警告されます。',
  'help.guide.tour-walk-check-off.step.4':
    '一覧の上部に、訪問済みの立ち寄り先の数と、残りの歩く時間が表示されます。立ち寄り先の「取り消す」で、印を外せます。',
  'help.ctx.trip-tour-bike.bullet.2':
    '右の「ツアーの概要」には「走行時間（推定）」が表示されます。これはプロフィールに合わせてルーターが計算した時間で、上りも考慮されています。休憩は含まれません。',
  'help.guide.tour-bike-profile.step.4':
    '「ウェイポイント」で「旅の場所」をクリックし、出発地と終点を選びます（この例ではHotel AlpenroyalとHotel Greif）。「地点を追加」がオンになっていることを確認して、地図をクリックしてもかまいません。2点目から、TREKがルートを計算します。',
  'help.guide.tour-bike-profile.tip.5':
    '管理者がCyclOSMの地図を許可している場合、サイクリングを開いている間は、地図のレイヤーの列に「自転車」も表示されます。読み込めなくなったら「マップ」に切り替えてください。ツアーは変わりません。',
  'help.guide.tour-bike-surfaces.tip.1':
    '「データなし」は、OpenStreetMapにその場所の路面が記録されていないことを示します。路面は不明で、良いとは限りません。',
  'help.guide.tour-bike-mtb-grades.step.3': 'グレードの行をクリックすると、そのトレイルが地図上で強調表示されます。',
  'help.ctx.trip-tour-ski.bullet.1':
    '最初に「種目」を選びます。初期状態では何も選ばれていません：「アルペン」「スノーボード」「クロスカントリー」「山スキー」「スノーシュー」「冬のハイキング」。「クロスカントリー」では「走法」（「クラシカル」「スケーティング」「不明」）も選びます。種目がないとツアーを保存できません。',
  'help.guide.tour-ski-plan.step.2': '「ツアーの種類」を開き、「スキーと冬」を選びます。',
  'help.guide.tour-ski-plan.tip.4':
    'ゲレンデのデータがない場所では、区間は地点の間の直線になります。スノーシューと冬のハイキングでは代わりに夏道を使うことがあり、その場合は区間にグレーのメモが表示されます。',
  'help.guide.tour-ski-options.step.5':
    '「除外」で、乗りたくないリフトの種類を押します：「Tバー・ロープトウ」「オープンチェアリフト」「ゴンドラ」「ロープウェイ」「ケーブルカーと鉄道」。押した種類には取り消し線が付きます。',
  'help.guide.tour-ski-fix-leg.step.2':
    '行に表示される修正方法をクリックします：「より難しいコースを許可」「このリフトを許可」「リフトで下る」「走法を切り替える」「種目を切り替える」。オプションが変わり、区間が計画し直されます。',
  'help.guide.tour-ski-summary.goal': '1日の時間が、滑走、リフト、待ち時間、徒歩にどう分かれるかを確認します。',
  'help.guide.tour-ski-summary.result':
    'その日の滑走、リフト乗車、リフト待ちにそれぞれどれくらいかかるかがわかります。',
  'help.guide.tour-ski-pistes-layer.tip.3':
    'このレイヤーは地図データで、リアルタイムの情報ではありません。営業中か、圧雪されているか、雪の状態、雪崩についてはわかりません。ツアーを開いていないときもスイッチがあるので、計画する前にスキー場を確認できます。',
  'help.guide.tour-ski-import.step.5':
    '「この旅行のツアー」でトラックをクリックして開きます。あとで種目を直すには、「スキーのトラック」カードの「変更」をクリックします。',
  'help.ctx.trip-tour-paddle.bullet.1':
    '「ツアーの種類」で「パドルツアー」を選ぶと、ボート（「カヤック」「カナディアンカヌー」、SUP、「その他」）と「水域」（「川」か「湖」）を選ぶ必要があります。両方を選ぶまでツアーは保存できません。',
  'help.guide.tour-paddle-setup.step.1': '「ツアー」タブで、左の列の上部にある「新しいツアーを計画」をクリックします。',
  'help.guide.tour-paddle-setup.tip.2':
    'パドルツアーの地図では、「マップ」と「衛星写真」と、重ねて表示できるOpenSeaMapの「航路標識」が使えます。',
  'help.guide.tour-paddle-water-route.step.3':
    '「次の区間を水上で計画」を選びます。この地点から次の地点までの区間が、川や湖に沿って計画されます。',
  'help.guide.tour-paddle-portage.title': '障害物を避けてボートを運ぶ',
  'help.guide.tour-paddle-portage.tip.2':
    '最後の地点で「ここからボートを運ぶ」を選んだ場合は、次の地点を置いた時点で適用されます。行に「ここから陸上運搬」と表示され、その×「陸上運搬をやめる」で取り消せます。',
  'help.guide.tour-paddle-lock.step.4':
    '「待ち時間」と「通過」の分数を入力します。両方を入力すると、カードに合計が表示されます。',
  'help.guide.tour-paddle-time.step.2':
    '帯には、出発地から終点までのルートが表示されます。水上、茶色の陸上運搬、目盛りで示した閘門です。ルート上の障害物には印があり、クリックすると地図上の位置がわかります。',
  'help.guide.tour-paddle-wind.title': 'パドルの日の風を確認する',
  'help.guide.tour-paddle-wind.tip.3':
    '風の強い日に湖を横断するルートがある場合は、カードに「岸沿いで計画」が表示され、湖を岸に沿って計画し直せます。',
  'help.guide.tour-paddle-checklist.step.4':
    '項目をクリックすると、地図がその場所に移動します。障害物なら決めた対応付きのカードが開き、自分で追加した陸上運搬や閘門ならその地点が選択されます。',
  'help.guide.tour-paddle-track-marks.title': '記録したパドルのトラックに陸上運搬と閘門を設定する',
  'help.guide.tour-paddle-track-marks.step.7': 'カードを開いて分数を入力し、「保存」をクリックします。',
  'help.ctx.trip-tour-horse.bullet.2':
    'ルートは専用のダイアログで開きます。区間と、進む「方向」を選び、「乗馬でのアクセス」を確認して、「区間を取り込む」をクリックします。',
  'help.guide.tour-horse-plan.step.3':
    '「乗馬ルート」カードで「地図の表示範囲で探す」をクリックします。表示範囲内の標識付き乗馬ルートが、その範囲での長さ付きですべて一覧されます。',
  'help.guide.tour-horse-plan.tip.3':
    '検索のあとに地図を動かすと、ボタンが「この範囲を検索」に変わります。範囲が広すぎる場合は、先に拡大するよう求められます。',
  'help.guide.tour-horse-gap.step.4':
    '「ウェイポイント」カードで、つないだ区間に「手動、未確認」と長さが表示されます。カーソルを合わせると理由がわかります。',
  'help.guide.tour-horse-recorded.step.2':
    '「インポートのプレビュー」が開きます。この時点では何も保存されていません。「取り込む種類」で「ツアーの種類」を「乗馬ツアー」にします。3つのバッジで、インポートで保持されるものと計算されないものがわかります。',
  'help.guide.dateless-trip.goal': '旅行の時期が決まる前から計画を始めます。',
  'help.guide.trip-reminder.step.3': '「更新」をクリックします。',
  'help.guide.upcoming-reservations.goal': 'すべての旅行の中から次の予約を確認し、その旅行を開きます。',
  'help.guide.log-day.tip.3': '終日の会社休日の日は記録できません。半日の会社休日では、休暇は0.5日分だけ消費されます。',
  'help.guide.half-company-holiday.goal': 'クリスマスイブなど、1日まるごとではなく午後だけを全員の休みにします。',
  'help.guide.public-holidays.tip.2': 'グリッドの祝日にカーソルを合わせると、祝日の名前が表示されます。',
  'help.guide.edit-holiday-calendar.step.3':
    '一覧で国や地域を変えるか、ゴミ箱アイコンをクリックしてカレンダーを削除します。',
  'help.guide.person-color.step.2': '色を選びます。すぐに保存され、ダイアログが閉じます。',
  'help.guide.answer-fusion-request.goal': '招待してくれた人と休暇のプランを統合するかどうかを決めます。',
  'help.guide.log-for-partner.goal': '頼まれたときなどに、統合したプランの相手の休みを入力します。',
  'help.guide.dissolve-fusion.goal': '統合したプランを別々のプランに戻します。',
  'help.guide.country-places.step.1': '訪れた国を検索して選びます。下部のパネルに国のカードが表示されます。',
  'help.guide.tour-activity-stats.step.3':
    '数値を確認します。距離（角にツアーの数）、続いて「累積上昇量」と「累積下降量」です。「すべてのタイプ」では、続いて実施が多い上位3つのタイプが件数と距離付きで表示されます。',
  'help.guide.move-to-list.step.1':
    'フィルター行のチェックボックスアイコン「選択」をクリックし、場所にチェックを入れます。',
  'help.guide.tour-collection-add-to-trip.step.2':
    '「追加先の旅」で旅行を選びます。ツアーを追加できない旅行は薄く表示されます。',
  'help.guide.tour-collection-manage.goal':
    'リストにあるツアーとその元の旅行を確認し、不要になったツアーを削除します。',
  'help.guide.entry-draft.goal': 'エントリーを今書いておき、準備ができるまで共有する日記には表示しないようにします。',
  'help.guide.journey-map-layers.step.2':
    'バーの右端の(i)をクリックすると、地図の凡例が表示され、ピン、点、線の意味がすべてわかります。',
  'help.guide.journey-keep-route.step.2':
    '日の始まりと終わりを決める「この日のタイムゾーン」を確認し、記録の内容（距離、時間帯、区間の数、途切れ）を確認します。',
  'help.guide.journey-day-stays.step.2':
    '滞在の「日記を書く」をクリックします。滞在の名前と位置が入ったエントリーが、その日の到着時刻に追加されます。',
  'help.guide.journey-take-over-day.step.2':
    '残す滞在にチェックを入れ、名前を修正します。チェックした2つの滞在の間にある「1つのエントリーにまとめる」でまとめ、「別々にする」で分け直します。',
  'help.guide.journey-auto-prepare.step.1': 'ヘッダー右上の⋯をクリックして、「日記設定」を開きます。',
  'help.guide.photo-location.step.1': 'ヘッダー右上の⋯をクリックして、「日記設定」を開きます。',
  'help.guide.share-public.tip.3':
    '下書きはリンクには表示されません。記録したルートは、公開したエントリーがある日にだけ表示されます。',
  'help.ctx.settings-plugins.title': 'プラグイン',
  'help.ctx.settings-about.bullet.2':
    '「不具合報告」と「機能リクエスト」でGitHubのプロジェクトが開き、Wikiでドキュメントが開きます。',
  'help.guide.map-provider.tip.3':
    'GLの地図では、右クリックしたままドラッグすると回転や傾きを変えられます。中クリックで場所を追加できます。',
  'help.guide.web-push-device.step.1':
    '「このデバイスのプッシュ通知」で「このデバイスでオンにする」をクリックし、ブラウザーで確認されたら通知を許可します。「テスト送信」で通知が届くか確認できます。',
  'help.guide.connect-airtrail.title': '自分のAirTrailを接続する',
  'help.guide.connect-dawarich.title': '自分のDawarichを接続する',
  'help.guide.tour-connect-wanderer.title': '自分のwandererを接続する',
  'help.guide.tour-connect-wanderer.tip.3': '右側の「接続解除」で、トークンを削除できます。',
  'help.guide.tour-wanderer-watch.tip.3':
    'このお知らせを受け取るチャンネルは、「通知」の「wanderer：トレイルに関するお知らせ」の行で選びます。',
  'help.guide.plugin-settings.tip.1':
    'これらの設定は自分専用です。ほかのメンバーは、それぞれ自分でプラグインを設定します。',
  'help.guide.offline-conflicts.step.3':
    'サーバーに拒否され続ける変更は、「オフラインキャッシュ」に「失敗した変更」として表示されます。「再試行」でもう一度送信し、「キャンセル」でサーバーのバージョンを残します。',
  'help.ctx.admin-notifications.bullet.4':
    '下部の「ユーザーの既定値」：イベントとチャンネルごとに、設定を変更していない全員に適用するオン、「オフ」「ブロック」を選びます。',
  'help.guide.default-user-settings.step.2':
    '設定した欄には、名前の横にリセットのリンクが表示されます。これでTREKの初期値に戻せます。',
  'help.guide.own-routing-engine.title': '自前のルーティングサーバーを使う',
  'help.guide.admin-passkeys.result':
    'サインインページに「パスキーでサインイン」が表示され、ユーザーは自分の設定でパスキーを登録できるようになります。',
  'help.guide.rotate-jwt-secret.goal': '漏えいの疑いがあるときに、すべてのセッションを終了します。',
  'help.guide.notification-defaults.result':
    'セルを変更していない人には、あなたの選択が初期設定として適用されます。ブロックしたセルは、ユーザーの設定画面でロックされて表示されます。',
  'help.ctx.notifications.bullet.3':
    '各通知には、誰がどこで何をしたかが表示されます。未読の通知は背景に色が付いています。下のボタン（「旅行を見る」「Vacayを見る」など）で関係する画面に移動でき、通知は既読になります。',
  'help.guide.read-notifications.tip.1':
    'ベルはナビゲーションバーのあるすべての画面にあり、新しい通知が届くと数字が自動で更新されます。',
  'help.guide.filter-notifications.tip.1':
    '下にスクロールすると古い通知が読み込まれるので、最初の画面で途切れることはありません。',
  'help.guide.mark-notifications-read.result': '背景に色の付いた通知がなくなり、ベルの赤い数字も消えます。',
  'help.guide.notification-settings.title': '通知する内容を選ぶ',
  'help.guide.link-journal.step.1': '旅行名の横の「旅行の設定」をクリックし、左側で「日記」を選びます。',
  'help.guide.dawarich-stays.tip.1':
    '「場所を追加」をクリックするまで、旅行には何も追加されません。滞在から追加した場所の詳細には、「Dawarich の記録から追加されました」と表示されます。',
  'help.guide.leave-stop-off-route.title': '立ち寄り先をルートから外す',
  'help.guide.move-booking-day.step.1':
    'その日の予約の行にカーソルを合わせます。左側にグリップが表示され、ドラッグできることがわかります。',
  'help.guide.place-image-from-file.tip.1':
    '選べるのはJPG、PNG、GIF、WebPのファイルだけです。PDFのチケットは選べません。',
  'help.guide.place-own-hours.step.4':
    '「営業時間」の右のボタン：コピーボタンで月曜日の営業時間を全曜日に設定し、×で入力した営業時間を削除します。TREKが独自に営業時間を見つけている場合は、「場所の詳細から取り込む」でその時間に戻せます。',
  'help.guide.confirm-stay-booking.step.2':
    '計画画面の上に予約が開きます。ヘッダーの最初のピルにステータスが表示されます。',
  'help.ctx.trip-map.bullet.9':
    '旅行のツアーはすべて、それぞれの色の線で表示され、出発地点にピンが付きます。線をクリックすると、ツアーのカードが開きます。ツアーがある日は、その日のルートがツアーの出発地点まで進み、終点から続きます。「ツアー」一覧のツアーの横にある目のアイコン「地図で非表示にする」で、自分の地図から線を消せます。',
  'help.guide.tour-map-lines.result':
    '表示したいツアーがそれぞれの色で地図に表示され、非表示にしたツアーは「ツアー」一覧で薄く表示されます。',
  'help.guide.car-stops.step.2':
    'ヘッダーのタイプのピルをクリックし、「レンタカー」を選びます。フォームが変わり、「日付」と「開始時刻」が「受取」と「受取時刻」に、「終了日」と「終了時刻」が「返却」と「返却時刻」になります。出発地と到着地の下に「途中の立ち寄り先」も表示されます。',
  'help.guide.transport-details.goal':
    '移動の詳細をまとめて確認し、予約コードをコピーしたり、名前を変えたり、地図上の位置に移動したりします。',
  'help.guide.transport-details.tip.2':
    'Escapeキーを押すか詳細の外をクリックすると閉じます。「名前を変更」や削除の確認が開いている場合は、そちらが先に閉じます。',
  'help.guide.export-transports-csv.tip.1': 'このアイコンは、タブに移動が1件以上ある場合だけバーに表示されます。',
  'help.guide.group-sort-bookings.step.1':
    '「カード」か「リスト」で、3つの表示アイコンの後ろにあるスライダー「表示オプション」をクリックします。',
  'help.guide.create-booking.tip.4':
    'オフラインでは予約はこの端末に保存され、オンラインに戻ると同期されます。新しいファイルには接続が必要なので、ファイルを外すか、あとで保存してください。うっかりフォームの外をクリックしたりEscapeキーを押したりしても、入力内容が失われる前に「変更を破棄しますか？」と確認されます。',
  'help.guide.booking-on-map.tip.2': '宿泊の場合は、最初の夜の日が開きます。',
  'help.guide.export-bookings-csv.step.3':
    '「表示オプション」の後ろにある表計算アイコン「表計算ファイルとして書き出し (CSV)」をクリックします。',
  'help.guide.arrange-packing-list.step.3':
    '「共有」と「マイリスト」がある行の右端の「名前順」で、各リストのアイテムを名前順に並べると、すでにリストにあるかがすぐにわかります。もう一度クリックすると、自分で並べた順に戻ります。',
  'help.guide.count-packed-pieces.step.1':
    '行の数量バッジ（後ろに×が付いた小さな数字）をクリックし、持っていく個数（例：5）を入力してEnterキーを押します。',
  'help.guide.expense-receipts.step.3':
    'ダイアログ下部の「保存」をクリックします。ファイルが支出と一緒にアップロードされ、旅行の「ファイル」にも表示されます。',
  'help.guide.files-sync-settings.step.1':
    'バーの右端にある「ドキュメント同期」をクリックします。旅行が保管先に紐づいていれば、右に保管先のカードが開きます。保管先が複数ある場合は、左の「この旅行」で目的の保管先をクリックします。',
  'help.guide.files-sync-settings.tip.3':
    '「即時更新」（横に「コピー」が付いたリンク）は、TREKが自動で変更を受け取れない保管先にだけ表示されます。このリンクを保管先に貼り付けると、次の確認を待たずに変更がすぐ届きます。',
  'help.guide.manage-notes.step.1':
    'ノートのカードのヘッダーにある三点アイコン（「その他のオプション」）をクリックします。メニューに「展開」「固定」「編集」「削除」があります。',
  'help.guide.note-categories.title': 'ノートをカテゴリに分ける',
  'help.guide.note-categories.result':
    'ノートに新しい名前と色が反映され、「ノート」カードには選んだカテゴリのノートだけが表示されます。',
  'help.guide.roadtrip-stops.tip.5':
    '日程で終了時刻を設定した立ち寄り先は、その時刻まで滞在します。ダイアログにドライブの出発時刻が表示され、「終了時刻を削除」で滞在時間を自分で設定し直せます。',
  'help.guide.roadtrip-reorder.tip.2':
    '予約した移動とそのターミナルは、予約で決まる位置から動きません。ドラッグできるのは場所だけです。',
  'help.guide.roadtrip-overnight.step.2':
    'ホテルには＋の代わりにベッドのアイコンが表示されます。これ（「宿泊として追加」）をクリックすると、宿泊用の「立ち寄り先として追加」が開きます。キャンプ場には通常の「追加」があります。',
  'help.guide.roadtrip-stop-fill.goal':
    '給油・充電の立ち寄り先ごとに、急速充電なら80 %、一晩なら100 %のように補給量を設定します。',
  'help.guide.roadtrip-bookings.goal':
    '予約した移動がドライブのどこに入るか、いつまでにそこに着く必要があるかを確認します。',
  'help.guide.roadtrip-bookings.tip.3':
    '旅行のどの日にも入っていない移動は、ドライブには含まれません。レールの上部にその移動の名前がメモで表示され、「予約を開く」で日付を設定できます。',
  'help.guide.roadtrip-google-import.step.4': '「日」で立ち寄り先を入れる日を選び、「インポート」をクリックします。',
  'help.guide.roadtrip-hazards.step.2':
    'ダイアログの右の列の下部にある「現在の警報」で「危険地域を表示」をオンにし、「閉じる」をクリックします。',
  'help.ctx.trip-tours.bullet.1':
    '右の列の上部にある「場所」と「ツアー」の切り替えで、場所の一覧とツアーの一覧を入れ替えます。この切り替えはツアーアドオンがオンの場合だけ表示され、そのときツアーは「場所」の一覧には表示されません。',
  'help.guide.tour-show-list.step.1':
    '「予定」タブで、右の列の上部にある切り替えの「ツアー」をクリックします。列に、場所の代わりにツアーが一覧されます。',
  'help.guide.tour-show-list.result': '右の列に旅行のツアーが一覧され、クリックしたツアーのカードが開きます。',
  'help.guide.tour-add-to-day.tip.1':
    'ステージのあるツアーを日にドラッグすると、小さなダイアログで同じ内容が確認されます。「キャンセル」で計画は元のままです。',
  'help.guide.tour-day-times.step.2':
    '「開始」を設定し、「終了」は空欄のままにします。入力欄の下に、TREKが計算した終了時刻（開始時刻＋ツアーの所要時間）が表示されます。',
  'help.guide.tour-remove-from-day.title': 'ツアーを日から外す',
  'help.guide.tour-filter-list.title': 'ツアーの一覧を絞り込む',
  'help.guide.tour-filter-list.tip.3':
    '何も残らない場合は、一覧に「条件に一致するツアーはありません」と表示されます。「フィルターをリセット」ですべて解除できます。フィルターで変わるのは一覧の表示だけで、ツアーや日は変わりません。',
  'help.guide.tour-hide-on-map.tip.2':
    'スマートフォンの地図には常にすべてのツアーが表示されます。「ツアー」タブには目のアイコンがないので、非表示にするのはこの「予定」タブです。',
  'help.guide.tour-import-plan-tab.tip.2':
    'インポートしたツアーはここでは一覧に残り、プランナーでは開きません。丸い＋で日に入れるか、「ツアー」タブを開いて確認してください。',
  'help.ctx.trip-tour-detail.bullet.5':
    'このカードは、ツアーの確認と関連する操作のためのものです。ルート自体は「ツアー」タブで変更します。タブを開いて、「この旅行のツアー」でツアーをクリックしてください。ツアーの削除もここではなく、そこで行います。',
  'help.guide.tour-detail-read.step.6':
    'さらにスクロールすると、「説明」と「ノート」、続いて「出どころ」があります。TREKで計画したのか、インポート元のファイルか、元のwandererのトレイルかが日付付きで表示されます。',
  'help.guide.tour-rename-colour.title': 'ツアーの名前と色を変える',
  'help.guide.tour-rename-colour.result': '旅行内のどこでもツアーの新しい名前が表示され、線は選んだ色で表示されます。',
  'help.guide.tour-take-along.tip.3':
    'ファイルはサーバーから取得するので、接続が必要です。オフラインで作ったツアーは、同期してからダウンロードできます。',
  'help.guide.tour-copy-keep.step.4':
    '「コレクション」でリストを選び、「コレクションでの名前」を確認して「保存」をクリックします。',
  'help.guide.tour-packing-link.step.1':
    'ツアーのカードを開き、「持ち物リスト」までスクロールします。「持ち物リストをリンク」をクリックします。',
  'help.guide.tour-packing-link.result':
    '「リスト」タブの持ち物リストが開きます。チェックを付けたアイテムはすべて、ツアーのカードにも反映されます。',
  'help.guide.tour-files.result': 'ファイルがツアーに添付され、ツアーのカードから開けます。',
  'help.guide.tour-activity-link.tip.1':
    '計画は変わりません。トラックはリンクされるだけで、「解除」でリンクを外せます。',
  'help.guide.tour-activity-compare.step.3':
    '「地図で比較」をクリックすると、計画の横に実際のトラックが点線で表示されます。「比較を終了」で消えます。',
  'help.guide.tour-origin-check.step.2':
    '「インポート済み」にはインポートした日が表示されます。「ここ」には現在の状態（「インポート時のまま」「TREK で編集済み」「計画し直し済み、記録トラックは保持」）が表示されます。',
  'help.ctx.trip-tour-planner.bullet.1':
    'ツアーアドオンがオンの場合、旅行のタブバーの「予定」のすぐ後ろに「ツアー」があります。このタブはパソコンとタブレットで使えます。スマートフォンでは、「予定」タブでツアーを確認したり日に入れたりできますが、ツアーを描くことはできません。',
  'help.guide.tour-open-workspace.step.1':
    '旅行のタブバーで、「予定」のすぐ後ろにある「ツアー」をクリックします。画面いっぱいに地図が表示され、両側にレールがあります。',
  'help.guide.tour-open-workspace.tip.2':
    'このタブのどこかにGPX、KML、KMZファイルをドロップすると、旅行のツアーとしてインポートできます。',
  'help.guide.tour-draw-route.step.4':
    '地図の下部に「ポイントを配置しました」と表示されます。横の「元に戻す」で地点を取り消せます。',
  'help.guide.tour-type-profile.title': 'ツアーの種類を選ぶ',
  'help.guide.tour-type-profile.result': '選んだタイプとプロフィールに合わせて、ツアーのルートが計算されます。',
  'help.guide.tour-edit-points.step.6':
    'レール上部の「地点の編集を元に戻す」と「地点の編集をやり直す」で、変更を1つずつ取り消したりやり直したりできます。',
  'help.guide.tour-shaping-points.step.3':
    '「ウェイポイント」には「形状ポイント」バッジ付きで番号なしで表示されるので、立ち寄り先の番号は変わりません。',
  'help.guide.tour-loop-reverse.step.1':
    '「ウェイポイント」カードの見出しにある「スタートに戻る」をクリックします。最初の地点に戻る最後の区間がツアーに追加されます。',
  'help.guide.tour-leg-by-hand.goal':
    'ルーターが道を見つけられない場所で2つの地点を直線でつなぐ、または区間を計画し直します。',
  'help.guide.tour-trip-places.title': '旅行の場所を立ち寄り先にする',
  'help.guide.tour-trip-places.tip.3': '旅行のほかのツアーが、立ち寄り先の候補に表示されることはありません。',
  'help.guide.tour-details-times.tip.1': '時間は2:56、2 h 56、176 minutesのように入力できます。',
  'help.guide.tour-save.step.3':
    '左のレール下部の「保存」をクリックします。「ツアーを保存しました」と表示され、レールのタイトルが「ツアーを編集」に変わります。',
  'help.guide.tour-edit-saved.step.1':
    '「この旅行のツアー」でツアーをクリックします。左のレールに「ツアーを編集」として開き、地図にルートが表示されます。',
  'help.guide.tour-summary-profile.title': 'ツアーの概要と標高グラフを確認する',
  'help.guide.tour-summary-profile.tip.3':
    'パドルツアーには標高は表示されません。水上では、岸の標高しか取得できないためです。',
  'help.guide.tour-list-manage.step.5':
    'まだどの日にも入っていないツアーを見るなら「未計画」を選ぶか、「出典」「ルートの上限」「タイプ」で絞り込みます。各行に当てはまるツアーの数が表示され、合計もフィルターに合わせて変わります。',
  'help.guide.tour-delete.step.2':
    '一緒に削除されるもの（ルート、編集可能なウェイポイント、日の割り当て）を確認し、「完全に削除」をクリックします。',
  'help.guide.tour-saved-elsewhere.step.2': '「新しい版を読み込む」では、確認後に自分の変更を新しい版で置き換えます。',
  'help.ctx.trip-tour-import.bullet.1':
    '「この旅行のツアー」の上部の＋が「ツアーを追加」です。「GPXまたはKMLをインポート」「Google Maps から街歩きを読み込む」「別の旅からツアーを取り込む」があります。「ツアー」タブのどこかにファイルをドロップしても取り込めます。',
  'help.guide.tour-import-gpx.step.2':
    '「GPXまたはKMLをインポート」を選び、.gpx、.kml、.kmzファイルを1つ以上選びます（1ファイル10 MBまで）。',
  'help.guide.tour-import-gpx.tip.5':
    '標高のないファイルには「ファイルに標高がありません」と表示されます。線と距離は正しいままですが、上りと下りは不明になります。',
  'help.guide.tour-view-import.tip.2':
    'ヘッダーのダウンロードアイコンでGPXファイルとして保存し直せます。ブックマークでコレクションに保存できます。',
  'help.guide.tour-plan-from-import.step.4':
    'ツアーがウェイポイント付きでエディターに開きます。必要に応じて変更し、列の下部の「保存」をクリックします。',
  'help.guide.tour-restore-recorded.step.1':
    '「この旅行のツアー」で、計画し直したツアーをクリックします。エディターの「記録されたトラック」カードに、記録したトラックが保持されていることが表示されています。',
  'help.guide.tour-take-over.step.1':
    'ツアーを追加したい旅行の「ツアー」タブを開きます。「この旅行のツアー」の上部で、＋（「ツアーを追加」）をクリックします。',
  'help.guide.tour-take-over.tip.3':
    'ツアーの取り込みには接続が必要です。エディターに未保存の変更がある場合、コピーは一覧に追加されますが開かないので、作業中の内容はそのまま残ります。',
  'help.guide.tour-import-wanderer.tip.1':
    'このボタンは、「設定」の「連携」でwandererを接続すると表示されます。それまでは、一覧に「設定で接続」が表示されます。',
  'help.ctx.trip-tour-map.bullet.2':
    'ピルの区切り線の後ろに、ツアーのタイプ用のスイッチがあります。ツアーの編集中は「ポイントを配置」、ハイキングでは「ヴィア・フェラータ」、パドルツアーでは「航路標識」、スキーツアーではゲレンデです。最後の3Dで、ツアーを立体的な地形の上に表示します。',
  'help.guide.tour-map-layers.step.3':
    'ハイキングでは「ハイキング」をクリックすると、標識のあるトレイルとその番号が表示されます。サイクリングでは代わりに「自転車」でサイクリングルートが表示されます。「衛星写真」で航空写真を表示し、「マップ」で標準の地図に戻ります。',
  'help.guide.tour-along-search.step.2':
    '「探すもの」をクリックし、探したい種類に最大6つまでチェックを入れます：「展望地」「山頂」「山小屋・避難小屋」「飲料水」「食事」など。ツアーのタイプに合った種類が表示され、最初は3つにチェックが入っています。',
  'help.guide.tour-along-add-stop.title': 'ツアー沿いの場所を立ち寄り先として追加する',
  'help.guide.tour-along-add-stop.tip.2':
    '新しい終点になる場所には「ツアーが長くなります」と表示されます。これまでの終点は終点ではなくなり、ツアーがこの場所まで延びます。',
  'help.guide.tour-3d-terrain.step.5': 'もう一度3Dをクリックすると、平面の地図に戻り、計画を続けられます。',
  'help.guide.tour-3d-flyover.step.2':
    '「速度」で1×、2×、4×を選びます。1×では、ほとんどのツアーが出発地から終点まで約45秒です。',
  'help.guide.tour-map-overlays.goal':
    'スキーやパドルのツアーを計画しながら、ゲレンデとリフト、またはブイや港の標識を地図に表示します。',
  'help.guide.tour-map-overlays.tip.3':
    'レイヤーが読み込めなくなると、スイッチに「!」と説明が表示されます。地図とルートは、そのレイヤーなしで引き続き使えます。',
  'help.guide.tour-multi-day.title': '複数日にわたるツアーを計画する',
  'help.guide.tour-multi-day.tip.1':
    '「ここでステージを終える」は日帰りツアーでも使え、その場合ツアーは自動で複数日ツアーになります。最初と最後の立ち寄り先と形状ポイントでは、ステージを区切れません。',
  'help.guide.tour-stages-on-days.step.2': '最初のステージを始める日を選びます。',
  'help.guide.tour-stages-on-days.tip.4':
    '日程では、各ステージが「ステージN」として、それぞれの距離と時間付きで表示されます。「予定」タブの日の上にある「元に戻す」で、割り当て全体を1回で取り消せます。',
  'help.ctx.trip-tour-hike.bullet.5':
    'ハイキングでは、左下の地図ボタンの列にある「ヴィア・フェラータ」で、周辺のヴィア・フェラータが表示されます。ヴィア・フェラータのカードから、独立した区間としてルートに追加できます。',
  'help.guide.tour-hike-plan.step.5':
    '「詳細」で「登山道の難易度上限」を開き、許容する道の難しさをT1（ハイキング）からT6（難度の高いアルパインハイキング）の中から選びます。その範囲内でルートが計画し直されます。',
  'help.guide.tour-hike-trail-details.goal':
    'ハイキングのルートの道についてOpenStreetMapに記録されている情報を確認し、その区間を地図上で探します。',
  'help.guide.tour-hike-trail-details.tip.2':
    'ハイキングの上限より高いグレードの行には、「上限を超えています」バッジが表示されます。',
  'help.guide.tour-hike-round.step.5':
    '「この周回にする」をクリックし、計画済みのルートを置き換えるか確認されたら「置き換える」をクリックします。',
  'help.guide.tour-hike-compare-ways.step.2':
    '地図の上に「この区間のほかの道」が開き、「現在の道」と道A、道Bなどが表示されます。それぞれ地図に別の色で表示され、行にカーソルを合わせるとその線が強調表示されます。',
  'help.guide.tour-ferrata-add.goal':
    'ハイキングの周辺にあるヴィア・フェラータを見つけ、その1つをルートに組み込みます。',
  'help.guide.tour-ferrata-add.tip.2':
    'ヴィア・フェラータが表示されるのはハイキングだけです。すでにルートが通っているヴィア・フェラータのカードには、「ツアーに追加」の代わりに「ツアーの一部」と表示されます。',
  'help.guide.tour-run-plan.step.4':
    '地図で出発地と終点を設定するか、「旅の場所」で選びます。ペースの下に、距離×ペースで計算した走行時間が表示されます。',
  'help.guide.tour-run-ways.goal': 'ランニングのコースのうち未舗装の割合と、道がどれくらい難しいかを確認します。',
  'help.ctx.trip-tour-walk.summary':
    '「ツアー」タブで計画する、立ち寄り先をつなぐ徒歩のツアーです。各立ち寄り先での滞在時間、重要度、途中の見どころ、街歩きの日に各立ち寄り先に着く時刻を設定し、営業時間と照らし合わせて確認できます。',
  'help.guide.tour-walk-plan.step.1':
    '左の列の上部にある「新しいツアーを計画」をクリックし、「ツアーの種類」を開いて「街歩き・観光」を選びます。',
  'help.guide.tour-walk-plan.tip.3':
    '立ち寄り先の「その他の操作」にある「場所とのリンクを解除」は、旅行の場所とのリンクを外すだけです。場所自体は旅行に残ります。',
  'help.guide.tour-walk-sights.step.5':
    '「立ち寄り先として追加」をクリックします。街歩きがどれだけ長くなるかがお知らせに表示され、横に「元に戻す」があります。',
  'help.guide.tour-walk-day-times.step.2':
    'その日の開始時刻を設定します。「予定」タブで、日の中の街歩きを右クリックし、「編集」を選んで「開始」を入力します。',
  'help.guide.tour-walk-google-import.title': 'Googleマップの徒歩ルートを街歩きにする',
  'help.guide.tour-walk-google-import.tip.3':
    '取り込まれるのは立ち寄り先だけで、Googleマップに描かれた線は取り込まれません。maps.app.goo.glの短縮リンクを開くには接続が必要です。',
  'help.guide.tour-walk-check-off.tip.1':
    'チェックは日ごとに保存されます。ツアーの一覧ではなく、計画画面のその日から街歩きを開いてください。',
  'help.ctx.trip-tour-bike.bullet.3':
    '「ウェイポイント」の下の「路面と道」カードで、ルートの路面、道の種類、未舗装と判明している割合を確認できます。行をクリックすると、その区間が地図上で強調表示されます。',
  'help.guide.tour-bike-profile.step.5':
    '右の「ツアーの概要」で「走行時間（推定）」を確認します。情報の点にカーソルを合わせると、計算方法がわかります。',
  'help.guide.tour-bike-surfaces.title': 'サイクリングの路面を確認する',
  'help.guide.tour-bike-surfaces.tip.2':
    '「ロード」プロフィールでは、バーの上の警告に、未舗装と判明している距離が表示されます。「地図に表示」でその区間を地図上に示します。',
  'help.guide.tour-bike-mtb-grades.result':
    '選んだグレードのトレイルが地図に表示され、ツアーのどの区間が難しいかがわかります。',
  'help.ctx.trip-tour-ski.bullet.2':
    '種目の下に、ゲレンデのルーターのオプションがあります。表示されるのは、その種目で使うものだけです：「最も難しいコース」「優先」「ペース」、「リフトを使う」などのスイッチ、乗りたくない種類のリフトを選ぶ「除外」。変更するたびにツアーが計画し直されます。',
  'help.guide.tour-ski-plan.step.3':
    '「種目」で、行うことを選びます：「アルペン」「スノーボード」「クロスカントリー」「山スキー」「スノーシュー」「冬のハイキング」。初期状態では何も選ばれておらず、選ばないとツアーを保存できません。',
  'help.guide.tour-ski-plan.result':
    '「スキーと冬」のツアーが「この旅行のツアー」に保存されます。区間は地図にあるコース、リフト、トレイルに沿い、所要時間が「ツアーの概要」に表示されます。',
  'help.guide.tour-ski-options.tip.1': '変更するたびに、ツアーが区間ごとに計画し直されます。',
  'help.guide.tour-ski-fix-leg.step.3':
    '合う修正方法がない場合は、「直線で描く」をクリックします。区間が2つの地点を結ぶ直線になります。',
  'help.guide.tour-ski-summary.step.1':
    'ウェイポイントの下で「ゲレンデルート」カードを見つけます。タイトルをクリックすると、折りたたんだり開いたりできます。',
  'help.guide.tour-ski-pistes-layer.title': '地図にゲレンデを表示する',
  'help.guide.tour-ski-pistes-layer.result': 'ツアーの下にゲレンデが表示され、色の意味を確認できます。',
  'help.guide.tour-ski-import.step.6': '「スキーのトラックを分類」で正しい種目か走法を選び、「保存」をクリックします。',
  'help.ctx.trip-tour-paddle.bullet.2':
    '各地点には役割を示すバッジが付きます：「出艇」「上陸」「再出艇」「最終上陸」。地点の下には、その後に続くもの（手で描いた区間、陸上運搬、閘門、または区間を計画できなかった理由）が表示されます。',
  'help.guide.tour-paddle-setup.step.2':
    '「ツアーの種類」を開き、「パドルツアー」（「水上で、カヤック、カヌー、SUPで」）を選びます。',
  'help.guide.tour-paddle-setup.tip.3':
    'パドルツアーでは、「ツアー沿い」でまず「入水地点」「ボートレンタル」「飲料水」が検索されます。',
  'help.guide.tour-paddle-water-route.step.4':
    'TREKが計画できなかった区間は赤くなり、理由（そのエリアの水域データがまだない、など）が表示されます。「直線で描く」をクリックすると、ひとまず手で描いた区間にできます。',
  'help.guide.tour-paddle-portage.goal':
    'ボートを運ぶ区間を設定し、陸上として計算されるようにします。上陸と再出艇の時間も含めます。',
  'help.guide.tour-paddle-portage.tip.3':
    '運搬は、「所要時間の見積もり」カードで自分の「運搬速度」を設定するまで、2 km/hで計算されます。',
  'help.guide.tour-paddle-lock.tip.1':
    'TREKは閘門の運用時間を把握していません。時間は入力した値だけなので、閘門の利用時間は自分で確認してください。',
  'help.guide.tour-paddle-time.step.3':
    '「水上」の行は、水上の距離を「パドル速度」で計算した時間です。速度は列の上部の「パドル速度」欄で変えられます。',
  'help.guide.tour-paddle-wind.goal': '漕ぐ日の、ツアー出発地点での風の予報を確認します。',
  'help.guide.tour-paddle-wind.tip.4': '予報の値は安全を保証するものではありません。現地の状況を確認してください。',
  'help.guide.tour-paddle-checklist.step.5':
    '出発前に、列の下部の「パドリングにはリスクがあります」をクリックして「水上での安全」を読んでください。',
  'help.guide.tour-paddle-track-marks.goal':
    'ウォッチで記録したパドルのトラックをインポートし、ボートを運んだ場所と閘門を通った場所を追加します。',
  'help.guide.tour-paddle-track-marks.tip.1':
    'トラックの線の上を正確にクリックしてください。線から離れすぎた場所をクリックすると受け付けられず、カードにその旨が表示されます。',
  'help.ctx.trip-tour-horse.bullet.3':
    '各区間は「ウェイポイント」カードのバッジで、ルート名、アクセスの点、長さが表示されます。どの乗馬ルートにも含まれない区間には「手動、未確認」と表示されます。',
  'help.guide.tour-horse-plan.step.4':
    '一覧のルートをクリックします。ルートが専用の地図で開き、区間に番号が付いています。',
  'help.guide.tour-horse-plan.tip.4': '左の列の上部にある「地点の編集を元に戻す」で、区間1つ分をまとめて取り消せます。',
  'help.guide.tour-horse-gap.result': '乗馬のルートに途切れがなくなり、つないだ区間は手描きとして表示されます。',
  'help.guide.tour-horse-recorded.step.3': '「1件のツアーをインポート」をクリックします。',
  'help.guide.dissolve-fusion.step.3': '確認ウィンドウで「解除」をクリックして確定します。',
};

export default help;
